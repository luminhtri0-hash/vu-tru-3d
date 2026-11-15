// Tách chữ từ đúng hợp đồng mà giao diện đọc; không gọi tao() hoặc dựng hình.
// node cong-cu/xuat-chu-bai.mjs [--ra thu-muc] [--kiem]
import { docBai } from './doc-bai.mjs';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KHOA_HOC, SO_BAI } from '../src/noi-dung/khoa-hoc.js';
import { THUAT_NGU } from '../src/noi-dung/thuat-ngu.js';

const goc = fileURLToPath(new URL('../', import.meta.url));
const thamSo = process.argv.slice(2);
const viTriRa = thamSo.indexOf('--ra');
if (viTriRa >= 0 && !thamSo[viTriRa + 1]) throw Error('Thiếu thư mục sau --ra');
const thuMuc = viTriRa < 0 ? join(goc, 'src/ngon-ngu/vi') : resolve(thamSo[viTriRa + 1]);
const kiem = thamSo.includes('--kiem');
const cacBai = KHOA_HOC.flatMap((phan) => phan.bai);
if (new Set(cacBai).size !== SO_BAI.length || cacBai.length !== SO_BAI.length ||
    !SO_BAI.every((id) => cacBai.includes(id))) throw Error('Danh mục và số bài không khớp');

const { bai, dichBai, dichPhan, dichThuatNguChung } = await docBai();

const tapHop = new Map();
function nhan(phamVi, khoa, goc) {
  if (!tapHop.has(phamVi)) tapHop.set(phamVi, {});
  const danhMuc = tapHop.get(phamVi);
  if (Object.hasOwn(danhMuc, khoa)) throw Error('Trùng khoá ' + phamVi + '/' + khoa);
  danhMuc[khoa] = goc;
  return goc;
}
KHOA_HOC.forEach((phan, i) => dichPhan(phan, i, nhan));
dichThuatNguChung(THUAT_NGU, nhan);
for (const canh of bai) dichBai(canh, nhan);

// Giữ nguyên thứ tự khoá của tệp đang có: khoá cũ đứng yên chỗ cũ (chỉ đổi giá trị), khoá bài đã bỏ thì rút ra, khoá
// bài mới chèn ngay sau khoá bài đứng trước nó trong thứ tự của bài (ví dụ bước 9 mới thêm nằm sau bước 8); khoá mới
// đứng đầu bài thì chèn trước khoá bài kế nó; tệp chưa có khoá bài nào thì nằm cuối.
// Trước đây công cụ luôn ghi «khoá khác trước, khoá bài sau», nên mỗi lần chạy là xếp lại mọi tệp có khoá bài đứng
// trước: hai nhánh cùng chạy công cụ là xung đột cả tệp dù không ai sửa chữ.
function giuThuTu(cu, khac, tinh) {
  const moi = { ...khac, ...tinh };
  const ra = Object.keys(cu).filter((khoa) => Object.hasOwn(moi, khoa));
  const daCo = new Set(ra);
  let viTri = -1, choMoc = [];
  for (const khoa of Object.keys(tinh)) {
    if (daCo.has(khoa)) {
      viTri = ra.indexOf(khoa);
      if (choMoc.length) { ra.splice(viTri, 0, ...choMoc); viTri += choMoc.length; choMoc = []; }
    } else if (viTri < 0) choMoc.push(khoa);
    else ra.splice(++viTri, 0, khoa);
  }
  ra.push(...choMoc);
  return Object.fromEntries(ra.map((khoa) => [khoa, moi[khoa]]));
}

let soKhoa = 0;
if (!kiem) mkdirSync(thuMuc, { recursive: true });
for (const [phamVi, tinh] of tapHop) {
  const tep = join(thuMuc, phamVi + '.json');
  const cu = existsSync(tep) ? JSON.parse(readFileSync(tep, 'utf8')) : {};
  const thuocBai = (khoa) => phamVi === 'chung' ?
    khoa.startsWith('phan.') || khoa.startsWith('thuatNgu.') : khoa.startsWith('bai.');
  if (kiem) {
    for (const khoa of new Set([...Object.keys(cu).filter(thuocBai), ...Object.keys(tinh)])) {
      if (cu[khoa] !== tinh[khoa]) { console.error(phamVi + '/' + khoa); process.exitCode = 1; }
    }
  } else {
    // Các khoá cảnh động và giao diện do công cụ khác quản lý.
    const khac = Object.fromEntries(Object.entries(cu).filter(([khoa]) => !thuocBai(khoa)));
    const noiDung = JSON.stringify(giuThuTu(cu, khac, tinh), null, 2) + '\n';
    if (!existsSync(tep) || readFileSync(tep, 'utf8') !== noiDung) {
      const tam = tep + '.' + process.pid + '.tmp';
      writeFileSync(tam, noiDung);
      renameSync(tam, tep);
    }
  }
  soKhoa += Object.keys(tinh).length;
}
console.log(soKhoa + ' khoá bài giảng và thuật ngữ, ' + bai.length + ' bài.');
