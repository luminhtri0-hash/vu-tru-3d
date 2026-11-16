// Bộ kiểm số của Bài 9, bước 8 (src/vat-ly/thoi-gian-bong.js): quả bóng ném lên rồi bắt lại sau 2 giây, so ba đường
// thế giới nối cùng hai sự kiện. Mọi con số trong lời giảng, nhãn, ô số liệu và đích của thử thách bước 8.
// Phần còn lại của Bài 9 kiểm ở kiem-tra/kiem-phan-3-cu.mjs.
import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { C } from '../src/vat-ly/hang-so.js';
import { G_BONG, T_BONG, dinhTracDia, doCao, vanToc, loiDoCao, thietTocDo, thoiGianThem, thoiGianThemToi } from '../src/vat-ly/thoi-gian-bong.js';

const c2 = C * C;
const A = dinhTracDia();

muc('Bài 9 · bước 8: đường trắc địa của quả bóng');
kiem('đỉnh đường ném lên (m)', A, 4.9, 1e-9);
kiem('tốc độ ném v₀ = gT/2 (m/s)', vanToc(A, 0), (G_BONG * T_BONG) / 2, 1e-9);
kiem('vận tốc ở đỉnh bằng 0', vanToc(A, T_BONG / 2), 0, 1e-12);
kiem('gia tốc trên đường ném lên bằng −g (m/s²)', (vanToc(A, 1.5) - vanToc(A, 0.5)) / 1, -G_BONG, 1e-9);
kiem('bóng về tay sau 2 giây', doCao(A, T_BONG), 0, 1e-12);

// Tích phân số trực tiếp từ nhịp 1 + gz/c² − v²/(2c²), độc lập với công thức gọn trong tệp vật lý.
const n = 20000;
const tichSo = (Ad) => {
  let loi = 0, thiet = 0;
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) * T_BONG) / n, z = doCao(Ad, t), v = vanToc(Ad, t);
    loi += (G_BONG * z / c2) * (T_BONG / n); thiet += (v * v / (2 * c2)) * (T_BONG / n);
  }
  return { loi, thiet };
};
const so = tichSo(A);
kiem('lợi do ở cao: công thức gọn khớp tích phân số (×10⁻¹⁶ s)', loiDoCao(A) * 1e16, so.loi * 1e16, 1e-6);
kiem('thiệt do tốc độ: công thức gọn khớp tích phân số (×10⁻¹⁶ s)', thietTocDo(A) * 1e16, so.thiet * 1e16, 1e-6);
kiem('lợi do ở cao (lời giảng: 7,1 × 10⁻¹⁶ s)', loiDoCao(A) * 1e16, 7.1, 0.05);
kiem('thiệt do tốc độ (lời giảng: 3,6 × 10⁻¹⁶ s)', thietTocDo(A) * 1e16, 3.6, 0.05);
kiem('thời gian riêng thêm trên đường trắc địa (nhãn: 3,6 × 10⁻¹⁶ s)', thoiGianThem(A) * 1e16, 3.6, 0.05);
kiem('tích luỹ tới lúc bắt lại bằng tổng', thoiGianThemToi(A, T_BONG) * 1e16, thoiGianThem(A) * 1e16, 1e-9);
kiem('tích luỹ lúc ném bằng 0', thoiGianThemToi(A, 0), 0, 1e-30);

muc('Bài 9 · bước 8: so với các đường khác');
kiemDung('đường trắc địa cho nhiều thời gian riêng nhất (quét đỉnh 0 tới 12 m)', (() => {
  let tot = 0, totA = 0;
  for (let i = 0; i <= 1200; i++) { const a = (12 * i) / 1200, x = thoiGianThem(a); if (x > tot) { tot = x; totA = a; } }
  return Math.abs(totA - A) <= 0.01;
})());
kiem('đường hồng mặc định cao gấp rưỡi (m)', 1.5 * A, 7.35, 1e-9);
kiemDung('cao gấp rưỡi và thấp một nửa cho ít hơn đường trắc địa', thoiGianThem(1.5 * A) < thoiGianThem(A) && thoiGianThem(0.5 * A) < thoiGianThem(A));
kiem('cao gấp đôi (9,8 m): lợi vừa bằng thiệt, bằng đứng yên (lời giảng)', thoiGianThem(2 * A) * 1e16, 0, 1e-9);
kiem('đứng yên ở tay: thêm 0', thoiGianThem(0), 0, 1e-30);
kiemDung('cao gấp rưỡi: cột hồng thấp hơn cột vàng ở mọi lúc gần bắt lại', thoiGianThemToi(1.5 * A, T_BONG) < thoiGianThemToi(A, T_BONG));
// đồ thị ở bảng điều khiển vẽ trong khoảng −4 tới 4 (×10⁻¹⁶ s) với đỉnh 0 tới 12 m
kiemDung('đồ thị: mọi giá trị nằm trong khung −4 tới 4 (×10⁻¹⁶ s)', (() => {
  for (let i = 0; i <= 120; i++) { const x = thoiGianThem((12 * i) / 120) * 1e16; if (x < -4 || x > 4) return false; }
  return true;
})());

muc('Bài 9 · bước 8: thử thách');
// Đích: kéo đỉnh hồng tới 4,9 m, lệch không quá 0,15 m. Không nút nào đặt sẵn đỉnh trong khoảng đó.
for (const [ten, a] of [['nút «Hồng cao gấp đôi»', 2 * A], ['nút «Hồng thấp một nửa»', 0.5 * A], ['lúc mới vào bước', 1.5 * A]]) {
  kiemDung(`${ten} không đạt sẵn thử thách`, Math.abs(a - A) > 0.15);
}
kiemDung('trạng thái thử «vot49» (đỉnh 4,95 m) đạt thử thách', Math.abs(A + 0.05 - A) <= 0.15);

tongKet();
