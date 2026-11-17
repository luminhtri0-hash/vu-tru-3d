// Dựng bản học chạy trên web (hoặc từ tệp, hoặc máy chủ tĩnh), kể cả khi đặt dưới một thư mục con như /vu-tru-3d/.
//
//   node cong-cu/dung-web.mjs                                   → dist/web/
//   node cong-cu/dung-web.mjs --goc-web https://vi-du.org/vu-tru-3d/   (địa chỉ gốc dùng cho thẻ chia sẻ, đường dẫn chuẩn)
//   node cong-cu/dung-web.mjs --giong-kbps 64                   (tệp giọng đọc mã hoá lại cho nhẹ, cần ffmpeg; xem nen-giong-doc.mjs)
//
// Sau khi build.mjs dựng trang, công cụ này chỉ xử lý THÊM trên bản web (không đụng mã của khung hay bài):
//   - chép tệp giọng đọc vào giong-doc/, gắn ?v=<mã nội dung> vào đường dẫn từng tệp để trình duyệt và
//     service worker không giữ tiếng cũ khi tệp được tạo lại mà tên không đổi;
//   - thẻ <head>: tiêu đề, mô tả, đường dẫn chuẩn, thẻ chia sẻ (og:, twitter:), biểu tượng trang;
//   - một đoạn mã nhỏ đổi tiêu đề và mô tả theo thứ tiếng người học chọn, và thêm dòng chân trang
//     «Giấy phép · Mã nguồn» ở cuối màn hình chào (kiểu trình bày: lớp .chan-trang-web trong src/style.css).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const goc = fileURLToPath(new URL('../', import.meta.url));
const thamSo = process.argv.slice(2);
const lay = (co, macDinh) => { const i = thamSo.indexOf(co); return i >= 0 && thamSo[i + 1] ? thamSo[i + 1] : macDinh; };
const GOC_WEB = lay('--goc-web', 'https://trilu.edu.vn/vu-tru-3d/').replace(/\/?$/, '/');
const KHO_MA = 'https://github.com/luminhtri0-hash/vu-tru-3d';
const GIONG_KBPS = lay('--giong-kbps', null);
const ra = join(goc, 'dist', 'web');

rmSync(ra, { recursive: true, force: true });       // bản dựng sinh lại được: xoá hẳn để không sót tệp cũ
execFileSync(process.execPath, ['build.mjs', '--ra', ra], { cwd: goc, stdio: 'inherit' });
const tepTrang = join(ra, 'index.html');
let html = readFileSync(tepTrang, 'utf8');

// ---- 1. Giọng đọc ----
const thuMucGiong = join(goc, 'giong-doc');
// Bản nhẹ (nếu chọn): mã hoá lại một lần vào thư mục đệm, lần sau chỉ làm tệp mới hoặc đã đổi.
const thuMucChep = GIONG_KBPS ? join(goc, 'Dữ liệu làm việc', 'giong-doc-nhe', String(Number(GIONG_KBPS))) : thuMucGiong;
if (GIONG_KBPS) execFileSync(process.execPath, [join(goc, 'cong-cu', 'nen-giong-doc.mjs'), '--kbps', String(Number(GIONG_KBPS)), '--ra', thuMucChep], { cwd: goc, stdio: 'inherit' });
const manifest = existsSync(join(thuMucGiong, 'danh-sach.json')) ? JSON.parse(readFileSync(join(thuMucGiong, 'danh-sach.json'), 'utf8')) : {};
let soTep = 0, tongByte = 0;
for (const giong of Object.values(manifest)) {
  for (const bai of Object.values(giong.bai)) {
    for (const { tep } of bai.tep) {
      const nguon = resolve(thuMucGiong, tep);
      if (!tep.endsWith('.mp3') || relative(thuMucGiong, nguon) !== tep || !statSync(nguon).isFile()) {
        throw Error('Đường dẫn tệp giọng không hợp lệ: ' + tep);
      }
      const dich = join(ra, 'giong-doc', tep);
      mkdirSync(dirname(dich), { recursive: true });
      copyFileSync(join(thuMucChep, tep), dich);
      const noiDung = readFileSync(dich);
      tongByte += noiDung.length;
      // Danh sách giọng được nhúng vào trang dưới dạng chuỗi JSON: thay đúng chuỗi "tep" bằng bản có mã nội dung.
      const cu = JSON.stringify(tep);
      const soCho = html.split(cu).length - 1;
      if (soCho !== 1) throw Error(`Tìm thấy ${soCho} chỗ ${cu} trong trang (cần đúng 1) — cách nhúng danh sách giọng đã đổi?`);
      const ma = createHash('sha256').update(noiDung).digest('hex').slice(0, 10);
      html = html.replace(cu, () => JSON.stringify(`${tep}?v=${ma}`));
      soTep++;
    }
  }
}

// ---- 2. Thẻ <head> ----
const thoat = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const MO_TA = {
  vi: { ten: 'Vũ trụ 3D', tieuDe: 'Vũ trụ 3D · Học thuyết tương đối và vật lý lượng tử bằng mô hình 3D · Trí Lữ', moTa: 'Khoá học miễn phí với 28 bài: hệ Mặt Trời, không-thời gian, lỗ đen, sóng hấp dẫn, vũ trụ giãn nở và vật lý lượng tử. Xoay mô hình 3D, kéo vật, làm lại thí nghiệm ngay trên trình duyệt.' },
  en: { ten: '3D Universe', tieuDe: '3D Universe · Relativity and quantum physics with interactive 3D models · Trí Lữ', moTa: 'A free course in 28 lessons: the Solar System, spacetime, black holes, gravitational waves, the expanding universe and quantum physics. Rotate the 3D models, drag objects and rerun experiments right in your browser.' },
  'zh-CN': { ten: '3D宇宙', tieuDe: '3D宇宙 · 用互动3D模型学习相对论与量子物理 · Trí Lữ', moTa: '免费课程，共28课：太阳系、时空、黑洞、引力波、宇宙膨胀和量子物理。在浏览器里旋转3D模型、拖动物体、反复做实验。' },
  ja: { ten: '3D宇宙', tieuDe: '3D宇宙 · 3Dモデルで学ぶ相対性理論と量子物理 · Trí Lữ', moTa: '全28課の無料講座。太陽系、時空、ブラックホール、重力波、膨張する宇宙、量子物理を、ブラウザ上で3Dモデルを回し、物を動かし、実験を繰り返しながら学べます。' },
};
const CHAN_TRANG = {
  vi: ['Giấy phép', 'Mã nguồn'],
  en: ['License', 'Source code'],
  'zh-CN': ['许可协议', '源代码'],
  ja: ['ライセンス', 'ソースコード'],
};
const vi = MO_TA.vi;
const dau = [
  `<meta name="description" content="${thoat(vi.moTa)}">`,
  `<link rel="canonical" href="${GOC_WEB}">`,
  `<meta name="theme-color" content="#05060b">`,
  `<link rel="icon" type="image/png" sizes="32x32" href="bieu-tuong-32.png">`,
  `<link rel="icon" type="image/png" sizes="192x192" href="bieu-tuong-192.png">`,
  `<link rel="apple-touch-icon" href="bieu-tuong-180.png">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:site_name" content="Trí Lữ">`,
  `<meta property="og:title" content="${thoat(vi.ten)} · Trí Lữ">`,
  `<meta property="og:description" content="${thoat(vi.moTa)}">`,
  `<meta property="og:url" content="${GOC_WEB}">`,
  `<meta property="og:image" content="${GOC_WEB}anh-chia-se.jpg">`,
  `<meta property="og:image:width" content="1200">`,
  `<meta property="og:image:height" content="630">`,
  `<meta property="og:locale" content="vi_VN">`,
  `<meta property="og:locale:alternate" content="en_US">`,
  `<meta property="og:locale:alternate" content="zh_CN">`,
  `<meta property="og:locale:alternate" content="ja_JP">`,
  `<meta name="twitter:card" content="summary_large_image">`,
].join('\n');
if (!/<title[^>]*>[^<]*<\/title>/.test(html)) throw Error('Không thấy thẻ <title> trong trang');
// Thẻ <title> trơn (không kèm data-dich): đoạn mã ở cuối trang tự đổi tiêu đề theo thứ tiếng; bộ quét SEO của trang web chính
// chỉ nhận <title> không thuộc tính.
html = html.replace(/<title[^>]*>[^<]*<\/title>/, () => `<title>${thoat(vi.tieuDe)}</title>\n${dau}`);
// Trang chỉ có nền tối và tự lo màu (meta color-scheme dark): ghi rõ để bộ quét «hai chế độ màu» của trang web chính hiểu.
if (!/<html\b[^>]*>/.test(html)) throw Error('Không thấy thẻ <html> trong trang');
html = html.replace(/<html\b([^>]*)>/, (_, thuocTinh) => `<html${thuocTinh} data-selfdark>`);

// ---- 3. Mã nhỏ chạy sau khung: tiêu đề, mô tả theo thứ tiếng, chân trang ở màn hình chào ----
const maThem = `(function(){
var MT=${JSON.stringify(MO_TA)},CT=${JSON.stringify(CHAN_TRANG)},KHO=${JSON.stringify(KHO_MA)};
function nn(){var l=document.documentElement.lang;return MT[l]?l:'vi';}
function lam(){var l=nn(),m=MT[l];
document.title=m.tieuDe;var d=document.querySelector('meta[name="description"]');if(d)d.setAttribute('content',m.moTa);
var k=document.querySelector('#chao .khoi');if(!k||k.querySelector('.chan-trang-web'))return;
var c=CT[l],p=document.createElement('div');p.className='chan-trang-web';p.lang=l;
function a(t,h){var e=document.createElement('a');e.textContent=t;e.href=h;e.target='_blank';e.rel='noopener';return e;}
p.append(a(c[0],KHO+'/blob/main/LICENSE-CONTENT.md'),' · ',a(c[1],KHO));k.append(p);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(lam,0);});else setTimeout(lam,0);
})();`;
if (!html.includes('</body>')) throw Error('Không thấy </body> trong trang');
html = html.replace('</body>', () => `<script>${maThem}</script>\n</body>`);
writeFileSync(tepTrang, html);

// ---- 4. Biểu tượng và ảnh chia sẻ ----
const thuMucTaiNguyen = join(goc, 'tai-nguyen-web');
for (const ten of ['bieu-tuong-32.png', 'bieu-tuong-192.png', 'bieu-tuong-180.png', 'anh-chia-se.jpg']) {
  copyFileSync(join(thuMucTaiNguyen, ten), join(ra, ten));
}

console.log(`Bản web ở dist/web/index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB), kèm ${soTep} đoạn giọng đọc (${(tongByte / 1048576).toFixed(1)} MB).`);
