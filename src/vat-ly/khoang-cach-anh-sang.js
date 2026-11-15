// Công thức thuần cho Bài 5 «Nón ánh sáng và nhân quả» (và vài số Mặt Trăng dùng ở Bài 3):
//   - khoảng không-thời gian giữa hai sự kiện, phân loại, thời gian riêng, khoảng cách riêng;
//   - đường thế giới của một con tàu tăng tốc rồi hãm;
//   - thời gian ánh sáng đi từ các thiên thể tới ta («nhìn xa là nhìn về quá khứ»).
// Đơn vị: trong sơ đồ dùng c = 1; thời gian ánh sáng tính bằng giây.

import { C, AU_KM, NAM_GIAY, R0_NGAN_HA_NAS } from './hang-so.js';
import { HANH_TINH, viTriHanhTinh, VOYAGER, viTriVoyager } from './he-mat-troi.js';

// ----- Mặt Trăng -----
export const R_MAT_TRANG_KM = 384400;           // bán kính quỹ đạo trung bình (bán trục lớn), km
export const CHU_KY_MAT_TRANG_NGAY = 27.32166;  // chu kỳ quay quanh Trái Đất so với các sao (tháng thiên văn), ngày

// ----- Khoảng cách tới các thiên thể ở xa (năm ánh sáng) -----
export const NAS_ALPHA_CEN = 4.37;              // hệ sao Alpha Centauri
export const NAS_TAM_NGAN_HA = R0_NGAN_HA_NAS;  // 26 700 năm ánh sáng
export const NAS_ANDROMEDA = 2.5e6;             // thiên hà Andromeda (M31), khoảng 2,5 triệu năm ánh sáng

// Thời gian ánh sáng (giây) để đi một quãng cho trước.
export const giayAnhSangKm = (km) => (km * 1000) / C;
export const giayAnhSangAU = (au) => (au * AU_KM * 1000) / C;
export const giayTuNam = (nam) => nam * NAM_GIAY;

const _a = [0, 0, 0], _b = [0, 0, 0];
const TRAI_DAT = HANH_TINH.find((h) => h.id === 'dat');
const SAO_HOA = HANH_TINH.find((h) => h.id === 'hoa');

// Khoảng cách Trái Đất – Sao Hỏa (AU) tại ngày Julius jd.
export function khoangCachTraiDatHoa(jd) {
  viTriHanhTinh(TRAI_DAT, jd, _a);
  viTriHanhTinh(SAO_HOA, jd, _b);
  return Math.hypot(_a[0] - _b[0], _a[1] - _b[1], _a[2] - _b[2]);
}

// Khoảng cách tới Voyager 1 (AU): từ Mặt Trời (tu = 'matTroi') hoặc từ Trái Đất (tu = 'traiDat').
export function khoangCachVoyager1(jd, tu = 'matTroi') {
  viTriVoyager(VOYAGER[0], jd, _b);
  if (tu === 'matTroi') return Math.hypot(_b[0], _b[1], _b[2]);
  viTriHanhTinh(TRAI_DAT, jd, _a);
  return Math.hypot(_a[0] - _b[0], _a[1] - _b[1], _a[2] - _b[2]);
}

// ----- Khoảng không-thời gian (c = 1, hai sự kiện O và P cách nhau Δx trong không gian, Δt trong thời gian) -----
export const binhPhuongKhoang = (dx, dt) => -dt * dt + dx * dx;

// Phân loại P so với O: 'trung' (cùng một sự kiện), 'tuongLai' / 'quaKhu' (kiểu thời gian),
// 'anhSangTL' / 'anhSangQK' (kiểu ánh sáng, nằm trên nón), 'khongGian' (kiểu không gian, ở nơi khác).
export function phanLoai(dx, dt, eps = 1e-3) {
  const s2 = binhPhuongKhoang(dx, dt);
  if (Math.abs(dx) < eps && Math.abs(dt) < eps) return 'trung';
  if (Math.abs(s2) <= eps * Math.max(1, dx * dx + dt * dt)) return dt > 0 ? 'anhSangTL' : 'anhSangQK';
  if (s2 < 0) return dt > 0 ? 'tuongLai' : 'quaKhu';
  return 'khongGian';
}

// Thời gian riêng của người đi thẳng đều từ O tới P (khoảng kiểu thời gian): τ = √(Δt² − Δx²).
export const thoiGianRieng = (dx, dt) => Math.sqrt(Math.max(0, dt * dt - dx * dx));
// Khoảng cách riêng (khoảng kiểu không gian): σ = √(Δx² − Δt²).
export const khoangCachRieng = (dx, dt) => Math.sqrt(Math.max(0, dx * dx - dt * dt));

// ----- Con tàu tăng tốc rồi hãm -----
// Rời O lúc t = 0, tới nơi lúc t = T, tốc độ v(t) = vMax · sin(πt/T): tăng từ 0 lên vMax rồi giảm về 0.
export const vanTocTau = (t, T = 6, vMax = 0.8) => (t <= 0 || t >= T ? 0 : vMax * Math.sin((Math.PI * t) / T));
export const viTriTau = (t, T = 6, vMax = 0.8) => {
  const k = Math.min(T, Math.max(0, t));
  return ((vMax * T) / Math.PI) * (1 - Math.cos((Math.PI * k) / T));
};
// Thời gian riêng tàu đo được từ lúc rời O tới thời điểm t: τ = ∫ √(1 − v²) dt (tích phân số, Simpson).
export function thoiGianRiengTau(t, T = 6, vMax = 0.8, n = 400) {
  const b = Math.min(T, Math.max(0, t));
  if (b <= 0) return 0;
  const h = b / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const v = vanTocTau(i * h, T, vMax);
    const f = Math.sqrt(1 - v * v);
    s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f;
  }
  return (s * h) / 3 + Math.max(0, t - T);
}
