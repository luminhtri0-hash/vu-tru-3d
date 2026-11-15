// Bộ kiểm số cho Bài 5 «Nón ánh sáng và nhân quả». Chạy: node kiem-tra/kiem-non-anh-sang.mjs
import { kiem, kiemDung, kiemTiLe, muc, tongKet } from './khung-kiem.mjs';
import { C, NAM_GIAY, AU_KM } from '../src/vat-ly/hang-so.js';
import { jdTuMs } from '../src/vat-ly/he-mat-troi.js';
import {
  binhPhuongKhoang, phanLoai, thoiGianRieng, khoangCachRieng, viTriTau, vanTocTau, thoiGianRiengTau,
  giayAnhSangKm, giayAnhSangAU, giayTuNam, khoangCachTraiDatHoa, khoangCachVoyager1,
  R_MAT_TRANG_KM, NAS_ALPHA_CEN, NAS_TAM_NGAN_HA, NAS_ANDROMEDA,
} from '../src/vat-ly/khoang-cach-anh-sang.js';
import { bienDoi } from '../src/vat-ly/lorentz.js';

muc('1. Thời gian ánh sáng: nhìn xa là nhìn về quá khứ');
kiem('1 AU / c', giayAnhSangAU(1), 499.005, 0.001, ' s');
kiem('1 AU / c tính bằng phút (8,3)', giayAnhSangAU(1) / 60, 8.3, 0.05, ' phút');
kiem('Mặt Trăng 384 400 km / c', giayAnhSangKm(R_MAT_TRANG_KM), 1.282, 0.001, ' s');
kiem('1 mét / c (3,3 phần tỉ giây)', 1 / C * 1e9, 3.336, 0.001, ' ns');
const jdNay = jdTuMs(Date.now());
const auHoa = khoangCachTraiDatHoa(jdNay);
kiemDung(`Trái Đất – Sao Hỏa hôm nay ${auHoa.toFixed(3)} AU nằm trong [0,37; 2,68]`, auHoa >= 0.37 && auHoa <= 2.68);
let mn = Infinity, mx = 0;
for (let d = 0; d < 365.25 * 32; d += 0.5) { const r = khoangCachTraiDatHoa(2451545 + d); mn = Math.min(mn, r); mx = Math.max(mx, r); }
kiem('Sao Hỏa gần nhất (2000–2032)', mn, 0.373, 0.01, ' AU');
kiem('Sao Hỏa xa nhất (2000–2032)', mx, 2.675, 0.01, ' AU');
kiemDung(`thời gian ánh sáng từ Sao Hỏa trong khoảng 3–22 phút (${(giayAnhSangAU(mn) / 60).toFixed(1)}–${(giayAnhSangAU(mx) / 60).toFixed(1)})`, giayAnhSangAU(mn) / 60 >= 3 && giayAnhSangAU(mx) / 60 <= 22.5);
const JD_11_11_2026 = 2461355.5;
const auV = khoangCachVoyager1(JD_11_11_2026, 'matTroi');
kiemDung(`Voyager 1 ngày 11/11/2026 cách Mặt Trời ${auV.toFixed(2)} AU, trong [172; 174]`, auV >= 172 && auV <= 174);
kiem('Voyager 1: khoảng cách tới Mặt Trời ≈ 172 AU', auV, 172, 0.5, ' AU');
kiem('Voyager 1: thời gian ánh sáng (gần 24 giờ)', giayAnhSangAU(auV) / 3600, 24, 0.3, ' giờ');
kiem('Voyager 1 tính từ Trái Đất (gần 24 giờ)', giayAnhSangAU(khoangCachVoyager1(JD_11_11_2026, 'traiDat')) / 3600, 24, 0.3, ' giờ');
kiem('Alpha Centauri', giayTuNam(NAS_ALPHA_CEN) / NAM_GIAY, 4.37, 0, ' năm');
kiem('Tâm Ngân Hà', giayTuNam(NAS_TAM_NGAN_HA) / NAM_GIAY, 26700, 0, ' năm');
kiem('Andromeda', giayTuNam(NAS_ANDROMEDA) / NAM_GIAY, 2.5e6, 0, ' năm');
// GW170817: chênh 1,7 giây sau khoảng 130 triệu năm (40 Mpc)
kiemTiLe('40 Mpc ra năm ánh sáng (khoảng 130 triệu)', (40e6 * 3.0856775814913673e16) / (C * NAM_GIAY), 1.3e8, 0.01);
const tiLeGW = 1.7 / (1.3e8 * NAM_GIAY);
kiemDung(`GW170817: 1,7 s / 130 triệu năm = ${tiLeGW.toExponential(2)} < 10⁻¹⁵`, tiLeGW < 1e-15);

muc('2. Khoảng không-thời gian và phân loại (c = 1)');
kiem('P = (3; 5): s²', binhPhuongKhoang(3, 5), -16, 0);
kiem('P = (4; 4): s²', binhPhuongKhoang(4, 4), 0, 0);
kiem('P = (5; 3): s²', binhPhuongKhoang(5, 3), 16, 0);
kiem('P = (2; 4,5): s²', binhPhuongKhoang(2, 4.5), -16.25, 1e-12);
kiemDung('(3; 5) kiểu thời gian, tương lai', phanLoai(3, 5) === 'tuongLai');
kiemDung('(2,5; −4,5) kiểu thời gian, quá khứ', phanLoai(2.5, -4.5) === 'quaKhu');
kiemDung('(4; 4) kiểu ánh sáng', phanLoai(4, 4) === 'anhSangTL');
kiemDung('(5; 3) và (5; 1,5) kiểu không gian', phanLoai(5, 3) === 'khongGian' && phanLoai(5, 1.5) === 'khongGian');
kiemDung('câu hỏi: (Δt = 2, Δx = 3) kiểu không gian, s² = 5', phanLoai(3, 2) === 'khongGian' && binhPhuongKhoang(3, 2) === 5);
// s² bất biến qua phép biến đổi Lorentz (kiểm trước cho Bài 6)
for (const v of [0.3, 0.6, -0.8]) {
  const g = 1 / Math.sqrt(1 - v * v), dx = 3, dt = 5;
  const dx2 = g * (dx - v * dt), dt2 = g * (dt - v * dx);
  kiem(`s² như nhau với người bay ${v} c`, binhPhuongKhoang(dx2, dt2), -16, 1e-12);
}

muc('3. Thời gian riêng, khoảng cách riêng');
kiem('τ(3; 5) = 4', thoiGianRieng(3, 5), 4, 1e-12);
kiem('v(3; 5) = 0,6 c', 3 / 5, 0.6, 0);
kiem('τ(0; 4) = 4', thoiGianRieng(0, 4), 4, 0);
kiem('(4; 5,66) cũng có τ = 4: Δt = √32', Math.sqrt(32), 5.66, 0.005);
kiem('τ(4; √32) = 4', thoiGianRieng(4, Math.sqrt(32)), 4, 1e-12);
kiem('σ(5; 3) = 4', khoangCachRieng(5, 3), 4, 1e-12);
kiem('câu hỏi: τ(8; 10) = 6', thoiGianRieng(8, 10), 6, 1e-12);
kiem('câu hỏi: tốc độ 8/10 = 0,8 c', 8 / 10, 0.8, 0);

muc('4. Con tàu tăng tốc rồi hãm (tối đa 0,8 c, 6 năm)');
kiem('quãng đi được sau 6 năm', viTriTau(6), 3.06, 0.005, ' năm ánh sáng');
kiem('tốc độ lớn nhất (t = 3)', vanTocTau(3), 0.8, 1e-12);
kiem('góc nghiêng lớn nhất', (Math.atan(0.8) * 180) / Math.PI, 38.7, 0.05, '°');
kiem('thời gian riêng cả chặng', thoiGianRiengTau(6), 4.88, 0.005, ' năm');
let tocDoMax = 0;
for (let t = 0; t <= 6; t += 0.001) tocDoMax = Math.max(tocDoMax, Math.abs(vanTocTau(t)));
kiemDung('đường thế giới luôn trong nón: |v| < 1 ở mọi lúc', tocDoMax < 1);
// đạo hàm số của vị trí khớp với vận tốc
let lechV = 0;
for (let t = 0.1; t < 6; t += 0.37) lechV = Math.max(lechV, Math.abs((viTriTau(t + 1e-6) - viTriTau(t - 1e-6)) / 2e-6 - vanTocTau(t)));
kiem('dx/dt khớp v(t)', lechV, 0, 1e-6);
kiem('đường nhanh hơn ánh sáng vẽ trong hình: 3,74 / 2,2', 3.74 / 2.2, 1.7, 0.001, ' c');

muc('5. Hằng số');
kiem('1 AU (km)', AU_KM, 149597870.7, 0.001);

muc('6. Bản 3: đích của các thử thách');
// Bước 2: P ở nơi khác mà cách O không quá 1 năm ánh sáng (ví dụ dùng khi chụp ảnh kiểm: (0,7; 0,35))
kiemDung('P = (0,7; 0,35) ở nơi khác', phanLoai(0.7, 0.35) === 'khongGian');
kiemDung('P = (1; 0,99) vẫn ở nơi khác dù rất sát mặt nón', phanLoai(1, 0.99) === 'khongGian');
// Bước 3: người quan sát thấy O và P = (5; 3) cùng lúc khi v = Δt/Δx = 0,6; khi đó Δx′ = σ = 4
{
  const [tp, xp] = bienDoi(3, 5, 0.6);
  kiem('P = (5; 3), v = 0,6: Δt′ = 0', tp, 0, 1e-12);
  kiem('P = (5; 3), v = 0,6: Δx′ = σ = 4', xp, 4, 1e-12);
  // dung sai |Δt′| ≤ 0,1 ứng với v trong khoảng 0,6 ± 0,016 (tay nắm còn bắt dính đúng v = 0,6 khi cách dưới 0,012)
  const dt1 = bienDoi(3, 5, 0.585)[0], dt2 = bienDoi(3, 5, 0.615)[0];
  kiemDung(`|Δt′| tại v = 0,585 và 0,615 là ${Math.abs(dt1).toFixed(3)}, ${Math.abs(dt2).toFixed(3)}: nằm trong dung sai 0,1`, Math.abs(dt1) <= 0.1 && Math.abs(dt2) <= 0.1);
  kiem('v bắt dính = Δt/Δx', 3 / 5, 0.6, 0);
  let lech = 0;
  for (const v of [-0.9, -0.5, 0, 0.3, 0.6, 0.9]) { const [a, b] = bienDoi(3, 5, v); lech = Math.max(lech, Math.abs(-a * a + b * b - binhPhuongKhoang(5, 3))); }
  kiem('s² của P = (5; 3) như nhau với mọi v của người quan sát 2', lech, 0, 1e-12);
  const [tA] = bienDoi(3, 5, 0.3), [tB] = bienDoi(3, 5, 0.9);
  kiemDung('kiểu không gian: thứ tự đổi khi v vượt 0,6 (Δt′ > 0 ở v = 0,3, < 0 ở v = 0,9)', tA > 0 && tB < 0);
  const [t4, x4] = bienDoi(5, 3, 0.6);
  kiem('P = (3; 5), người quan sát v = 0,6 là phi hành gia: Δx′ = 0', x4, 0, 1e-12);
  kiem('và Δt′ = τ = 4', t4, 4, 1e-12);
}
// Bước 4: τ = 3 năm, cách O ít nhất 2 năm ánh sáng
kiem('P = (4; 5): τ = 3', thoiGianRieng(4, 5), 3, 1e-12);
kiem('P = (2,5; √15,25): τ = 3', thoiGianRieng(2.5, Math.sqrt(9 + 6.25)), 3, 1e-12);
kiemDung('các nút «thử ngay» của bước 4 không cho τ = 3', [[3, 5], [4, Math.sqrt(32)], [0, 4], [5, 3]].every(([x, t]) => Math.abs(thoiGianRieng(x, t) - 3) > 0.05));
// Bước 5: đồng hồ tàu chỉ 2 năm khi ở nhà khoảng 2,30 năm
{
  let a = 0, b = 6;
  for (let i = 0; i < 60; i++) { const c = (a + b) / 2; if (thoiGianRiengTau(c) < 2) a = c; else b = c; }
  kiem('τ tàu = 2 khi ở nhà t ≈ 2,30 năm', a, 2.30, 0.005, ' năm');
  kiem('kiểm lại τ tại đó', thoiGianRiengTau(a), 2, 1e-6, ' năm');
  kiem('cả chặng: đồng hồ ở nhà tích 6 lần', Math.floor(6), 6, 0);
  kiem('cả chặng: đồng hồ trên tàu tích 4 lần (τ = 4,88)', Math.floor(thoiGianRiengTau(6)), 4, 0);
}
// Bắt dính vào mặt nón: đặt t = x thì P đúng là kiểu ánh sáng
kiemDung('P = (4,4; 4,4) sau khi bắt dính: kiểu ánh sáng', phanLoai(4.4, 4.4) === 'anhSangTL');

muc('7. Bản 3: âm thanh (chỉ để tai nghe)');
kiem('nốt «trong nón tương lai»: La 4', 440, 440, 0, ' Hz');
kiem('nốt «trên mặt nón» cao hơn một quãng tám', 880 / 440, 2, 0);
kiem('nốt «ở nơi khác»: Mi 5', 659.25, 440 * 2 ** (7 / 12), 0.02, ' Hz');

tongKet();
