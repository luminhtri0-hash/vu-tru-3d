// Mặc định kiểm tính toàn vẹn. --liet-ke in từng khoá chưa dịch,
// --du báo lỗi cho cả khoá còn thiếu. Có thể lọc theo một bài/một tiếng.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SO_BAI } from '../src/noi-dung/khoa-hoc.js';
import { khopNgonNgu, dich } from '../src/ngon-ngu/dich.js';
import { DS_TIENG_DICH } from '../cong-cu/ngon-ngu.mjs';

const args = process.argv.slice(2);
const tuyChon = (co, ds) => {
  if (!args.includes(co)) return ds;
  const giaTri = args[args.indexOf(co) + 1];
  if (!ds.includes(giaTri)) throw Error('Giá trị không có trong danh sách ' + co);
  return [giaTri];
};
const doc = (ma, id) => JSON.parse(readFileSync(new URL('../src/ngon-ngu/' + ma + '/' + id + '.json', import.meta.url)));
const bien = (s) => (s.match(/\{\d+\}/g) || []).sort();
assert.equal(khopNgonNgu('zh-Hans'), 'zh-CN');
assert.equal(khopNgonNgu('ja-JP'), 'ja');
assert.equal(khopNgonNgu('en-GB'), 'en');
assert.equal(khopNgonNgu('vi-VN'), 'vi');
assert.equal(khopNgonNgu('fr'), null);
assert.equal(khopNgonNgu('ko-KR'), 'ko');       // mục cấu hình có sẵn; app chỉ hiện khi có thư mục src/ngon-ngu/ko/
assert.equal(dich('chung', 'khong-ton-tai', 'Bài {0}', [15]), 'Bài 15');
for (const ma of tuyChon('--tieng', DS_TIENG_DICH)) {
  let tong = 0, thieu = 0;
  for (const id of tuyChon('--bai', ['chung', ...SO_BAI])) {
    const vi = doc('vi', id), dich = doc(ma, id);
    for (const k of Object.keys(dich)) assert(Object.hasOwn(vi, k), ma + '/' + id + '/' + k + ' không có bản gốc');
    for (const [k, s] of Object.entries(vi)) {
      tong++;
      assert(typeof s === 'string' && s.trim(), 'Gốc rỗng ' + id + '/' + k);
      if (!dich[k]?.trim()) {
        thieu++;
        if (args.includes('--liet-ke') || args.includes('--du')) console.log('THIẾU ' + ma + '/' + id + '/' + k);
      } else assert.deepEqual(bien(dich[k]), bien(s), 'Tham số sai ' + ma + '/' + id + '/' + k);
    }
  }
  console.log(ma + ' còn thiếu ' + thieu + '/' + tong + ' khoá.');
  if (args.includes('--du') && thieu) process.exitCode = 1;
}
