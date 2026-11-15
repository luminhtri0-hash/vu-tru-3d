// So hai thư mục ảnh (do kiem-tra/chup-giao-dien.mjs chụp) từng tệp một: tệp nào khác thì đếm số điểm ảnh khác.
// Dùng khi sửa kiểu trình bày mà không định đổi hình (ví dụ gom biến trong style.css): mọi ảnh phải trùng.
//
//   node kiem-tra/so-anh.mjs <thư mục mốc> <thư mục mới> [--cho-phep 0]
//
// --cho-phep N: số điểm ảnh khác tối đa mỗi ảnh mà vẫn coi là trùng (mặc định 0). Mã thoát 1 nếu có ảnh khác.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const [moc, moi] = process.argv.slice(2);
if (!moc || !moi) throw Error('Dùng: node kiem-tra/so-anh.mjs <thư mục mốc> <thư mục mới> [--cho-phep 0]');
const i = process.argv.indexOf('--cho-phep');
const choPhep = i > 0 ? Number(process.argv[i + 1]) : 0;
function dsAnh(goc, thuMuc = goc, ra = []) {
  for (const ten of readdirSync(thuMuc).sort()) {
    const p = join(thuMuc, ten);
    if (statSync(p).isDirectory()) dsAnh(goc, p, ra); else if (ten.endsWith('.png')) ra.push(relative(goc, p));
  }
  return ra;
}
const giaiMa = (tep) => execFileSync('ffmpeg', ['-v', 'error', '-i', tep, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1 << 28 });
const a = dsAnh(moc), b = new Set(dsAnh(moi));
let khac = 0, thieu = 0, trung = 0;
for (const ten of a) {
  if (!b.has(ten)) { thieu++; console.log('THIẾU ở thư mục mới:', ten); continue; }
  const x = readFileSync(join(moc, ten)), y = readFileSync(join(moi, ten));
  if (x.equals(y)) { trung++; continue; }
  const p = giaiMa(join(moc, ten)), q = giaiMa(join(moi, ten));
  if (p.length !== q.length) { khac++; console.log('KHÁC CỠ:', ten); continue; }
  let n = 0;
  for (let k = 0; k < p.length; k += 3) if (p[k] !== q[k] || p[k + 1] !== q[k + 1] || p[k + 2] !== q[k + 2]) n++;
  if (n > choPhep) { khac++; console.log(`KHÁC ${n} điểm ảnh:`, ten); } else trung++;
}
for (const ten of b) if (!a.includes(ten)) console.log('Chỉ có ở thư mục mới:', ten);
console.log(`${a.length} ảnh: ${trung} trùng, ${khac} khác, ${thieu} thiếu.`);
process.exit(khac || thieu ? 1 : 0);
