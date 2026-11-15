// Hằng số SI có giá trị chính xác theo định nghĩa, năng lượng biểu diễn bằng eV.
const H = 6.62607015e-34, E = 1.602176634e-19;
export const H_EV_THZ = H / E * 1e12;
export const C_NM_THZ = 299792.458;
export const nangLuongPhoton = f => H_EV_THZ * f;
export const tanSoNguong = W => W / H_EV_THZ;
export const dongNang = (f, W) => Math.max(0, nangLuongPhoton(f) - W);

// Tấm thu có điện thế thấp hơn catốt một lượng U. Electron mô hình
// bay vuông góc hai bản, mang động năng cực đại của phổ quang electron.
export function chuyenDong(f, W, U) {
  const K = dongNang(f, W);
  return { K, thuDuoc: K > U, coHat: K > 0, diemQuay: U > 0 ? K / U : Infinity };
}

// Thời gian t tính theo đơn vị làm electron 1 eV vượt khe trong một đơn vị
// khi U = 0. x tính theo bề rộng khe. Đây là nghiệm chuyển động gia tốc đều.
export const viTriElectron = (K, U, t) => Math.sqrt(K) * t - U * t * t / 4;
export function thoiGianTrongKhe(K, U) {
  if (K <= 0) return 0;
  if (K > U) return 2 / (Math.sqrt(K) + Math.sqrt(K - U));
  return 4 * Math.sqrt(K) / U;
}
