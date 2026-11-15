// Mở trang trong Chrome ẩn (im lặng, không cửa sổ), chạy một đoạn mã trong trang rồi in kết quả dạng JSON.
// Dùng để hỏi nhanh trạng thái của app khi dò lỗi hoặc viết phép kiểm: nhãn nào đang hiện, ô số liệu ghi gì, một hàm
// chạy mất bao lâu… Lệnh nặng: chạy qua kiem-tra/co-khoa.sh.
//
//   node kiem-tra/chay-trong-trang.mjs <tệp HTML> "<tham số đường dẫn>" "<biểu thức JS>" [--co 1280x800] [--khung 240]
//                                      [--anh tệp.png] [--tieng vi]
//
// Ví dụ:
//   node kiem-tra/chay-trong-trang.mjs dist/index.html "canh=ngan-ha&buoc=7" "__vt.boNhan.trangThai().filter(n => !n.an).map(n => n.chu)"
//   node kiem-tra/chay-trong-trang.mjs dist/index.html "canh=lorentz&buoc=3" "document.getElementById('hud').innerText" --anh /tmp/a.png
//
// Trang được mở với im=1 (không tiếng); vòng khung hình riêng của trang bị tắt, thay vào đó bộ này gọi __vt.buoc(1/60)
// --khung lần (mặc định 240 = 4 giây) trước khi tính biểu thức, để máy quay bay xong và mô hình tới đúng trạng thái.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moChrome } from './chrome-an.mjs';

const thamSo = process.argv.slice(2);
const [tepHtml, thamTrang = '', bieuThuc = 'document.title'] = thamSo;
if (!tepHtml || tepHtml.startsWith('--')) throw Error('Dùng: node kiem-tra/chay-trong-trang.mjs <tệp HTML> "<tham số>" "<biểu thức JS>" [--co 1280x800] [--khung 240] [--anh tệp.png]');
const lay = (co, macDinh) => { const i = thamSo.indexOf(co); return i >= 0 && thamSo[i + 1] ? thamSo[i + 1] : macDinh; };
const [rong, cao] = lay('--co', '1280x800').split('x').map(Number);
const soKhung = Number(lay('--khung', '240'));
const tieng = lay('--tieng', 'vi');
const tepAnh = lay('--anh', '');
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));

function chuanBi() {
  window.__VT_IM_LANG = true;
  window.requestAnimationFrame = () => 0;
  try { localStorage.clear(); } catch { /* không có bộ nhớ: bỏ qua */ }
}

const c = await moChrome();
try {
  const dienThoai = rong < 600 || cao < 500;
  await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: 1, mobile: dienThoai });
  await c.goi('Emulation.setTouchEmulationEnabled', { enabled: dienThoai, maxTouchPoints: dienThoai ? 5 : 1 });
  await c.goi('Emulation.setLocaleOverride', { locale: tieng });
  await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: `(${chuanBi})()` });
  const url = pathToFileURL(resolve(tepHtml));
  const tham = new URLSearchParams(thamTrang);
  if (!tham.has('lang')) tham.set('lang', tieng);
  if (!tham.has('im')) tham.set('im', '1');
  url.search = tham.toString();
  await c.goi('Page.navigate', { url: url.href });
  let xong = false;
  for (let i = 0; i < 1200 && !xong; i++) {
    if (c.loiTrang) throw Error(c.loiTrang);
    xong = await c.doc(`!!window.__vt && (${tham.has('canh') || tham.has('bai') ? '!!window.__vt.canh' : 'true'})`);
    if (!xong) await cho(50);
  }
  if (!xong) throw Error('Không mở được ' + url.href);
  if (soKhung > 0) await c.doc(`(() => { for (let i = 0; i < ${soKhung}; i++) __vt.buoc(1 / 60); return true; })()`);
  const kq = await c.doc(`(async () => { const kq = await (${bieuThuc}); return kq === undefined ? null : kq; })()`);
  console.log(typeof kq === 'string' ? kq : JSON.stringify(kq, null, 2));
  const loi = await c.doc('window.__vt ? __vt.loiGhi.slice(0, 5) : []');
  if (loi.length) console.log('LỖI TRONG CẢNH:', loi.join(' | '));
  if (tepAnh) {
    const { data } = await c.goi('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(tepAnh, Buffer.from(data, 'base64'));
    console.log('Đã chụp:', tepAnh);
  }
} finally {
  await c.dong();
}
