// Mã hoá lại tệp giọng đọc cho nhẹ (mp3 một kênh, tốc độ bit thấp hơn) để đưa lên web hoặc kho mã công khai.
// Không phát tiếng, không sửa giong-doc/: chỉ ghi bản nhẹ ra thư mục khác và in bảng so sánh dung lượng.
//
//   node cong-cu/nen-giong-doc.mjs                       → đo thử 64 và 48 kbps, ghi vào «Dữ liệu làm việc/giong-doc-nhe/<kbps>/»
//   node cong-cu/nen-giong-doc.mjs --kbps 64 --ra <thư mục>   → chỉ làm một mức, ghi ra <thư mục>/<giọng>/<tệp>.mp3
//
// Cần ffmpeg. Bản gốc (96 kbps, 44,1 kHz) giữ nguyên làm bản chủ; tệp đã có và mới hơn bản gốc thì không làm lại.
// Lọc thông thấp ở 15 kHz trước khi mã hoá (giọng nói gần như không có gì phía trên) để bộ mã không phí bit vào đó.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const goc = fileURLToPath(new URL('../', import.meta.url));
const thamSo = process.argv.slice(2);
const lay = (co) => { const i = thamSo.indexOf(co); return i >= 0 ? thamSo[i + 1] : null; };
const cacMuc = lay('--kbps') ? [Number(lay('--kbps'))] : [64, 48];
const raRieng = lay('--ra');
if (cacMuc.some((k) => !(k >= 24 && k <= 128))) throw Error('--kbps phải từ 24 tới 128');

const thuMucGiong = join(goc, 'giong-doc');
const ds = JSON.parse(readFileSync(join(thuMucGiong, 'danh-sach.json'), 'utf8'));
const tep = Object.values(ds).flatMap((g) => Object.values(g.bai).flatMap((b) => b.tep.map((t) => t.tep)));
const tongGoc = tep.reduce((s, t) => s + statSync(join(thuMucGiong, t)).size, 0);
const giay = Object.values(ds).flatMap((g) => Object.values(g.bai).flatMap((b) => b.tep.map((t) => t.giay))).reduce((s, x) => s + x, 0);
const MB = (b) => (b / 1048576).toFixed(2) + ' MB';

console.log(`Bản gốc: ${tep.length} tệp, ${MB(tongGoc)}, ${(giay / 60).toFixed(1)} phút → ${(tongGoc / giay / 1024).toFixed(1)} KB mỗi giây tiếng`);
for (const kbps of cacMuc) {
  const ra = raRieng || join(goc, 'Dữ liệu làm việc', 'giong-doc-nhe', String(kbps));
  let tong = 0;
  for (const t of tep) {
    const nguon = join(thuMucGiong, t), dich = join(ra, t);
    if (!existsSync(dich) || statSync(dich).mtimeMs < statSync(nguon).mtimeMs) {
      mkdirSync(dirname(dich), { recursive: true });
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', nguon, '-map_metadata', '-1', '-af', 'lowpass=f=15000',
        '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', `${kbps}k`, dich], { stdio: 'inherit' });
    }
    tong += statSync(dich).size;
  }
  const uoc = (tong / giay) * 60 * 60;
  console.log(`${kbps} kbps: ${MB(tong)} (${Math.round((100 * tong) / tongGoc)}% bản gốc) · ước một giờ tiếng ${MB(uoc)} · ở ${ra}`);
}
