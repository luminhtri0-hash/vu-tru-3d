// Chuyển động tăng tốc đều trong không-thời gian phẳng (tọa độ Rindler), dùng cho Bài 8.
// Đơn vị hình học: năm và năm ánh sáng, c = 1. Không đụng tới three.js.

import { C, NAM_GIAY } from './hang-so.js';

export const G0 = 9.80665;                    // gia tốc trọng trường chuẩn, m/s²

// c/a tính bằng năm; đó cũng là c²/a tính bằng năm ánh sáng.
export const cTrenA = (a = G0) => C / a / NAM_GIAY;
// a tính bằng năm ánh sáng trên năm bình phương.
export const aNasNam2 = (a = G0) => 1 / cTrenA(a);

// (ρ, η) → (X, T): X = ρ cosh η, T = ρ sinh η.
export const tuRindler = (rho, eta) => [rho * Math.cosh(eta), rho * Math.sinh(eta)];
// (X, T) → (ρ, η), chỉ dùng được trong nêm X > |T|.
export const veRindler = (X, T) => [Math.sqrt(X * X - T * T), Math.atanh(T / X)];

// Gia tốc riêng của điểm nằm ở «độ cao» ρ: a = c²/ρ.
export const giaTocTaiRho = (rho) => 1 / rho;

// Tăng tốc đều 1 g suốt thời gian riêng tau (năm trên tàu).
export function duHanh(tau, a = G0) {
  const k = cTrenA(a);
  const x = tau / k;
  return { T: k * Math.sinh(x), d: k * (Math.cosh(x) - 1), v: Math.tanh(x), g: Math.cosh(x) };
}

// Đi tới khoảng cách D (năm ánh sáng): tăng tốc nửa đường đầu, hãm nửa đường sau.
export function duHanhCoHam(D, a = G0) {
  const k = cTrenA(a);
  const x = Math.acosh(1 + D / 2 / k);
  return { tau: 2 * k * x, T: 2 * k * Math.sinh(x), gMax: Math.cosh(x), vMax: Math.tanh(x) };
}
// Đi tới khoảng cách D, tăng tốc suốt (không hãm).
export function duHanhKhongHam(D, a = G0) {
  const k = cTrenA(a);
  const x = Math.acosh(1 + D / k);
  return { tau: k * x, T: k * Math.sinh(x) };
}

// Tỉ số nhịp đồng hồ trần/sàn trong tên lửa: (ρ0 + h)/ρ0 = 1 + ah/c².
export const tiLeNhip = (rho0, h) => (rho0 + h) / rho0;

// Quả bóng thả từ trần lúc η = 0 đứng yên ở X = ρ0 + h; sàn chạm tới nó lúc T này.
export const tChamSan = (rho0, h) => Math.sqrt((rho0 + h) ** 2 - rho0 ** 2);

// Dịch chuyển tần số do trọng lực trên độ cao h (mét): gh/c².
export const dichTanSo = (hM, g = G0) => (g * hM) / (C * C);

// Đèn hiệu thả qua cửa sàn lúc η = 0 (đứng yên ở X = ρ0), phát xung lúc T_e theo đồng hồ của nó.
// Xung tới sàn lúc thời gian riêng của sàn τ = −ρ0 ln(1 − T_e/ρ0); T_e ≥ ρ0 thì không bao giờ tới.
export const thoiDiemNhan = (Te, rho0) => (Te < rho0 ? -rho0 * Math.log(1 - Te / rho0) : Infinity);
