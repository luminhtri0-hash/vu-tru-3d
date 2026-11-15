// Sóng hấp dẫn từ hai vật quay quanh nhau (xấp xỉ tứ cực của Einstein, quỹ đạo tròn).
//
//   dΩ/dt = (96/5)·(G·Mc/c³)^{5/3}·Ω^{11/3}        Ω: tần số góc quỹ đạo, Mc: "khối lượng chirp"
//   ⇒ Ω(t) = [ (256/5)·(G·Mc/c³)^{5/3}·(tc − t) ]^{−3/8}
//   Pha quỹ đạo: Φ(t) = Φc − (8/5)·[(256/5)·K]^{−3/8}·(tc − t)^{5/8}
//   Tần số sóng hấp dẫn gấp đôi tần số quỹ đạo: f = Ω/π.  Biên độ h ∝ Mc^{5/3}·Ω^{2/3}/d.

import { C, G, M_MAT_TROI, MPC_M } from './hang-so.js';

export const T_MAT_TROI = (G * M_MAT_TROI) / C ** 3; // G·M☉/c³ ≈ 4,925 micro giây

export function khoiLuongChirp(m1, m2) {
  return Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
}

// Thời gian còn lại tới lúc sáp nhập khi sóng đang ở tần số f (Hz). Khối lượng tính theo M☉.
export function thoiGianConLai(f, mc) {
  return (5 / 256) * Math.pow(mc * T_MAT_TROI, -5 / 3) * Math.pow(Math.PI * f, -8 / 3);
}

// Tần số sóng (Hz) tại thời điểm còn tau giây trước khi sáp nhập.
export function tanSoSong(tau, mc) {
  return (1 / Math.PI) * Math.pow((256 / 5) * Math.pow(mc * T_MAT_TROI, 5 / 3) * tau, -3 / 8);
}

// Biên độ biến dạng h (không thứ nguyên) khi nhìn dọc trục quỹ đạo, ở khoảng cách d (Mpc).
export function bienDo(f, mc, dMpc) {
  return (4 / (dMpc * MPC_M)) * Math.pow((G * mc * M_MAT_TROI) / (C * C), 5 / 3) * Math.pow((Math.PI * f) / C, 2 / 3);
}

// Mô hình "chiếu chậm" không thứ nguyên dùng cho hình động: K = 1, tc = 0.
// Trả về pha quỹ đạo, tần số góc và khoảng cách hai vật tại thời điểm t < 0.
export function xoanVao(t, { K = 1, omegaMax = 12 } = {}) {
  const tau = Math.max(1e-6, -t);
  const A = Math.pow((256 / 5) * K, -3 / 8);
  let omega = A * Math.pow(tau, -3 / 8);
  let pha = -(8 / 5) * A * Math.pow(tau, 5 / 8);
  if (omega > omegaMax) {
    // sát lúc chạm nhau công thức phân kỳ; giữ tần số ở mức sáp nhập và nối pha cho liền
    const tauM = Math.pow(omegaMax / A, -8 / 3);
    pha = -(8 / 5) * A * Math.pow(tauM, 5 / 8) + omegaMax * (tauM - tau);
    omega = omegaMax;
  }
  return { omega, pha };
}
