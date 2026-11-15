// Chụp một màn hình ở cỡ ĐIỆN THOẠI CẦM DỌC (bề ngang dưới 500 điểm ảnh) bằng Chrome ẩn có giả lập thiết bị.
// kiem-tra/chup.sh tự gọi tệp này khi bề ngang nhỏ hơn 500; không cần gọi tay.
//
// Vì sao cần: cửa sổ Chrome không thu hẹp dưới 500 điểm ảnh. Lệnh chụp thường (--window-size=390,844) vì thế dựng trang
// rộng 500 rồi CẮT lấy 390 điểm ảnh bên trái: thanh trên, bảng bài giảng và nhãn bị cụt ở mép phải dù app vẫn đúng.
// Ở đây trang được dựng đúng bề rộng yêu cầu, có cảm ứng, như trên điện thoại thật.
//
//   node kiem-tra/chup-hep.mjs <tệp html> <ảnh ra .png> [tham số đường dẫn] [rộng] [cao] [mili giây cho hình chạy]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moChrome } from './chrome-an.mjs';

const [tepHtml, tepAnh, thamSo = '', rong = '390', cao = '844', ms = '5000'] = process.argv.slice(2);
if (!tepHtml || !tepAnh) throw Error('Dùng: node kiem-tra/chup-hep.mjs <tệp html> <ảnh ra .png> [tham số] [rộng] [cao] [mili giây]');
const cho = (t) => new Promise((xong) => setTimeout(xong, t));

const url = pathToFileURL(resolve(tepHtml));
const tham = new URLSearchParams(thamSo);
if (!tham.has('im')) tham.set('im', '1');                                    // không bao giờ phát tiếng
url.search = tham.toString();

const c = await moChrome();
try {
  await c.goi('Emulation.setDeviceMetricsOverride', { width: Number(rong), height: Number(cao), deviceScaleFactor: 1, mobile: true });
  await c.goi('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.goi('Page.navigate', { url: url.href });
  let xong = false;
  for (let i = 0; i < 1200 && !xong; i++) {
    if (c.loiTrang) throw Error('Trang báo lỗi: ' + c.loiTrang);
    xong = await c.doc('!!window.__vt?.canh');
    if (!xong) await cho(50);
  }
  if (!xong) throw Error('Không mở được ' + url.href);
  await c.doc('document.fonts.ready.then(() => true)');
  // Tham số tua= đã được trang xử lý lúc mở. Chờ thêm một nhịp ngắn cho nhãn, ô số liệu và bảng vào chỗ.
  await cho(Math.min(1500, Math.max(300, Number(ms) / 5)));
  const loi = await c.doc('(window.__vt.loiGhi || []).slice(0, 3)');
  if (loi.length) console.log('  lưu ý, cảnh báo lỗi: ' + loi.join(' | '));
  const { data } = await c.goi('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  mkdirSync(dirname(resolve(tepAnh)), { recursive: true });
  writeFileSync(resolve(tepAnh), Buffer.from(data, 'base64'));
  console.log(`  đã chụp: ${resolve(tepAnh)} (${rong} × ${cao}, giả lập điện thoại)`);
} finally {
  await c.dong();
}
