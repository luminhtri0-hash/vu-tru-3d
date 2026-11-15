// Kiểm riêng các chuỗi đã dịch. --du yêu cầu mọi khoá trong phạm vi đã chọn;
// --bai <id> và --tieng <en|zh-CN|ja> để nghiệm thu một bài trước khi dịch tiếp.
// --thu-muc-dich <thư mục> đọc các bản nháp theo <thư mục>/<ngôn ngữ>/.
// --thuat-ngu <tệp JSON> đối chiếu cách dịch với bảng bốn thứ tiếng đã soạn.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { docBai } from '../cong-cu/doc-bai.mjs';
import { KHOA_HOC, SO_BAI } from '../src/noi-dung/khoa-hoc.js';
import { THUAT_NGU } from '../src/noi-dung/thuat-ngu.js';

const thamSo = process.argv.slice(2);
const docTham = (ten) => {
  const i = thamSo.indexOf(ten);
  if (i < 0) return null;
  if (!thamSo[i + 1] || thamSo[i + 1].startsWith('--')) throw Error('Thiếu giá trị của ' + ten);
  return thamSo[i + 1];
};
const goc = fileURLToPath(new URL('../src/ngon-ngu/', import.meta.url));
const thuMucDich = docTham('--thu-muc-dich') || goc;
const doc = (tep) => JSON.parse(readFileSync(tep, 'utf8'));
const tieng = docTham('--tieng'), phamVi = docTham('--bai'), du = thamSo.includes('--du');
const dsTieng = ['en', 'zh-CN', 'ja'];
if (tieng && !dsTieng.includes(tieng)) throw Error('Ngôn ngữ không hợp lệ');
const cacBai = KHOA_HOC.flatMap((p) => p.bai);
if (phamVi && !['chung', ...cacBai].includes(phamVi)) throw Error('Không tìm thấy bài ' + phamVi);
const { bai, dichBai, dichPhan } = await docBai();

// Những bài đã phát hành được tham chiếu trực tiếp bằng số trong lời giảng.
const soCu = 'he-mat-troi ngan-ha chieu-thu-tu duong-the-gioi non-anh-sang lorentz tuong-duong rindler thoi-gian trac-dia khong-thoi-gian thuy-trieu quy-dao anh-sang lo-den non-lo-den song-hap-dan gian-no vu-tru-4c'.split(' ');
assert.deepEqual(SO_BAI.slice(0, soCu.length), soCu, 'Có bài cũ bị đổi số.');
assert.deepEqual(cacBai.slice(0, 4), [soCu[0], soCu[1], soCu[14], soCu[16]]);
assert.deepEqual(bai.map((c) => c.id), cacBai, 'Tên tệp và ID cảnh không khớp.');
assert.deepEqual([...cacBai].sort(), [...new Set(SO_BAI)].sort(), 'Có ID thiếu hoặc lặp trong mục lục.');

for (const phan of KHOA_HOC) assert.equal(dichPhan(phan, 0).bai, phan.bai);
for (const canh of bai) {
  const daDich = dichBai(canh, () => '◆');
  assert.equal(daDich.id, canh.id);
  assert.equal(daDich.tao, canh.tao);
  for (const [i, q] of canh.baiGiang.cauHoi.entries()) {
    const k = daDich.baiGiang.cauHoi[i];
    if (!q.chon) continue;
    assert(Number.isInteger(q.dung) && q.dung >= 0 && q.dung < q.chon.length, canh.id + ': đáp án trỏ ngoài câu hỏi');
    assert.equal(k.dung, q.dung); assert.equal(k.chon.length, q.chon.length);
  }
  // Từng đáp án nhận đúng khoá theo thứ tự mà bộ chấm sử dụng.
  const coKhoa = dichBai(canh, (_, khoa) => khoa);
  for (const [i, q] of coKhoa.baiGiang.cauHoi.entries()) {
    q.chon?.forEach((k, j) => assert.equal(k, 'bai.baiGiang.cauHoi.' + (i + 1) + '.chon.' + (j + 1)));
  }
  canh.baiGiang.congThuc.forEach((ct, i) => assert.equal(daDich.baiGiang.congThuc[i].tex, ct.tex));
  canh.baiGiang.buoc.forEach((b, i) => {
    const m = daDich.baiGiang.buoc[i];
    assert.equal(m.nut, b.nut); assert.equal(m.vao, b.vao); assert.equal(m.ra, b.ra);
    if (b.thuThach) assert.equal(m.thuThach.kiem, b.thuThach.kiem);
  });
}

const thuatNguGoc = new Map();
for (const t of [...THUAT_NGU, ...bai.flatMap((c) => c.baiGiang.thuatNgu || [])]) {
  if (!thuatNguGoc.has(t.vi)) thuatNguGoc.set(t.vi, t.en);
}
const duongBang = docTham('--thuat-ngu') || join(goc, 'thuat-ngu.json');
const bang = new Map();
if (existsSync(duongBang)) {
  for (const t of doc(duongBang)) {
    assert(t.vi && !bang.has(t.vi) && t.en === thuatNguGoc.get(t.vi), 'Sai hoặc trùng thuật ngữ gốc ' + t.vi);
    for (const k of dsTieng) assert(typeof t[k] === 'string' && t[k].trim(), 'Thiếu ' + k + ' cho ' + t.vi);
    bang.set(t.vi, t);
  }
  assert.equal(bang.size, thuatNguGoc.size, 'Thiếu mục trong bảng thuật ngữ.');
} else if (docTham('--thuat-ngu')) throw Error('Không tìm thấy bảng thuật ngữ ' + duongBang);

function tachChu(chu, ma) {
  const ct = [], nut = [], tu = [], nhan = [], lienKet = [], deCap = [];
  // $$ và $ có vai trò khác nhau. Giữ cả cặp dấu, khoảng trắng và \text{…}.
  let con = chu.replace(/\\\$/g, '\u0000').replace(/\$\$[\s\S]*?\$\$|\$[^$]*?\$/g, (m) => { ct.push(m); return ' '; });
  const leDau = (con.match(/\$/g) || []).length;
  con = con.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, ten, id) => { nut.push(id.trim()); return ten; });
  con = con.replace(/\{\{([^}|]+)(?:\|([^}]+))?\}\}/g, (_, id, ten) => { tu.push(id.trim()); return ten || id; });
  con = con.replace(/^\s*>\s*\[([^\[\]]+)\]/gm, (_, ten) => { nhan.push(ten); return ' '; });
  con = con.replace(/https?:\/\/[^\s<>()]+|\b10\.\d{4,9}\/[a-z\d./:;()_-]+/gi, (s) => { lienKet.push(s); return ' '; });
  const theoBai = /(?:(?:\b(?:bài|lessons?)\s+|レッスン\s*)(\d+)|第\s*(\d+)\s*(?:课|課|讲|講))/giu;
  con = con.replace(theoBai, (_, n, m) => { deCap.push(n || m); return ' '; });
  const mauSo = ma === 'vi'
    ? /([−+-]?\d+(?:[ \u00a0\u202f]\d{3}(?!\d))*(?:,\d+)?)(?:\s*(nghìn|ngàn|triệu|tỉ|tỷ)(?!\p{L}))?/giu
    : /([−+-]?\d+(?:[, \u00a0\u202f]\d{3}(?!\d))*(?:\.\d+)?)(?:\s*(thousand|million|billion|trillion)\b|\s*(万亿|万億|万|亿|億|兆))?/giu;
  const mu = { nghìn:3, ngàn:3, triệu:6, tỉ:9, tỷ:9, thousand:3, million:6, billion:9, trillion:12, 万:4, 亿:8, 億:8, 万亿:12, 万億:12, 兆:12 };
  const vanBan = con.normalize('NFKC');
  const nhomSo = Array.from(vanBan.matchAll(mauSo));
  const so = nhomSo.map((m, i) => {
    let [, n, donVi, donViCjk] = m;
    const tiep = nhomSo[i + 1];
    if (!donVi && !donViCjk && tiep && (tiep[2] || tiep[3])) {
      const giua = vanBan.slice(m.index + m[0].length, tiep.index).trim();
      if (/^(?:[–—~～〜]|đến|tới|to|至|到|から)$/iu.test(giua)) donVi = tiep[2] || tiep[3];
    }
    let chuan = n.replace(/[ \u00a0\u202f]/g, '').replaceAll('−', '-').replaceAll(',', ma === 'vi' ? '.' : '');
    const dau = chuan.startsWith('-') ? '-' : '';
    const [nguyen, le = ''] = chuan.replace(/^[+-]/, '').split('.');
    // Chuyển dấu thập phân trên chuỗi để giữ nguyên số có nhiều chữ số.
    const noi = nguyen + le;
    const moc = nguyen.length + (mu[(donVi || donViCjk || '').toLowerCase()] || 0);
    chuan = moc >= noi.length ? noi.padEnd(moc, '0') : noi.slice(0, moc) + '.' + noi.slice(moc);
    return dau + chuan.replace(/^0+(?=\d)/, '').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  });
  return { ct, nut, tu, nhan, lienKet, deCap, so, leDau };
}
const giongTap = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
function doiChieu(chu, dich, ma) {
  const a = tachChu(chu, 'vi'), b = tachChu(dich, ma);
  const loi = [], xem = [];
  const muc = { ct: 'công thức KaTeX', nut: 'ID nút', tu: 'ID thuật ngữ', nhan: 'nhãn hộp', lienKet: 'URL/DOI', deCap: 'số bài tham chiếu' };
  for (const [k, ten] of Object.entries(muc)) if (!giongTap(a[k], b[k])) loi.push(ten);
  if (a.leDau !== b.leDau) loi.push('dấu $ lẻ');
  if (!giongTap(a.so, b.so)) {
    // Cùng số lượng nhóm số nhưng khác giá trị là một phép đổi số phải sửa.
    // Khi dịch số viết bằng chữ hoặc ngày tháng, số lượng
    // nhóm chữ số có thể đổi hợp lệ, nên để người soát quyết định.
    if (a.so.length === b.so.length) loi.push('giá trị số trong lời văn');
    else xem.push('số trong lời văn (xét ngày tháng, số viết bằng chữ và đơn vị)');
  }
  return { loi, xem };
}
// Mẫu cố ý sai để bảo đảm bộ kiểm bắt được lỗi dù các trang dịch còn trống.
assert(doiChieu('Giá \\$5, $x=2$ và $$y=3$$', 'Cost \\$5, $x=3$ and $$y=2$$', 'en').loi.includes('công thức KaTeX'));
assert.deepEqual(doiChieu('Bài 9, [[Kéo|keo]], {{độ cong}}: 1 200,5', '1,200.5, {{độ cong|curvature}}, [[Drag|keo]], Lesson 9', 'en'), { loi: [], xem: [] });
assert(doiChieu('[[Kéo|keo]] {{độ cong}}', '[[Drag|x]] {{độ cong khác|curvature}}', 'en').loi.length === 2);
assert.deepEqual(doiChieu('13,8 tỉ năm', '138億年', 'ja'), { loi: [], xem: [] });
assert.deepEqual(doiChieu('1 200,5 triệu', '1.2005 billion', 'en'), { loi: [], xem: [] });
assert(doiChieu('2,9', '2.8', 'ja').loi.length);
assert(doiChieu('tháng 1', 'January', 'en').xem.length);
assert(doiChieu('Bài 9', '第8課', 'ja').loi.length);
assert(doiChieu('> [Thử ngay] X', '> [Try now] X', 'en').loi.length);

assert.deepEqual(doiChieu('225–250 triệu năm', '2.25亿至2.50亿年', 'zh-CN'), { loi: [], xem: [] });

let soLoi = 0, canXem = 0, soDaDich = 0, soThieu = 0;
for (const ma of tieng ? [tieng] : dsTieng) {
  for (const id of phamVi ? [phamVi] : ['chung', ...cacBai]) {
    const tep = join(thuMucDich, ma, id + '.json');
    const nguon = doc(join(goc, 'vi', id + '.json'));
    const ngonNgu = existsSync(tep) ? doc(tep) : {};
    for (const [k, v] of Object.entries(nguon)) {
      if (!/^(bai\.|phan\.|thuatNgu\.)/.test(k)) continue;
      const o = ngonNgu[k], viTri = ma + '/' + id + '/' + k;
      if (typeof o !== 'string' || !o.trim()) {
        soThieu++;
        if (du) { soLoi++; console.error('THIẾU ' + viTri); }
        continue;
      }
      soDaDich++;
      const { loi, xem } = doiChieu(v, o, ma);
      if (bang.size && /(?:^|\.)thuatNgu\.\d+\.vi$/.test(k) && o !== bang.get(v)?.[ma]) loi.push('khác tên trong bảng thuật ngữ');
      if (o.trim() === v.trim() && /[ăâđêôơưạ-ỹ]/iu.test(v) && v.length > 18) xem.push('trùng nguyên văn tiếng Việt');
      if (/^bai\.(?:nguon|baiGiang\.docThem\.\d+)$/.test(k)) xem.push('đối chiếu tác giả, tên nguồn và số trang/chương');
      if (loi.length) { soLoi++; console.error('LỖI ' + viTri + ' — ' + loi.join(', ')); }
      if (xem.length) { canXem++; console.warn('CẦN SOÁT ' + viTri + ' — ' + xem.join(', ')); }
    }
  }
}
console.log(soDaDich + ' trường đã dịch, ' + soThieu + ' trường còn thiếu, ' + soLoi + ' lỗi, ' + canXem + ' trường cần người đối chiếu.');
if (soLoi) process.exitCode = 1;
