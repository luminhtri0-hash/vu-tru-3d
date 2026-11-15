import { ngonNgu } from '../ngon-ngu/dich.js';

// Hằng số vật lý và thiên văn dùng chung (hệ SI trừ khi ghi rõ).
// Nguồn: CODATA 2018, IAU 2012/2015, NASA/JPL.

export const C = 299792458;                    // tốc độ ánh sáng, m/s (định nghĩa)
export const G = 6.6743e-11;                   // hằng số hấp dẫn, m³/(kg·s²)
export const AU_M = 1.495978707e11;            // 1 đơn vị thiên văn, mét (IAU 2012)
export const AU_KM = AU_M / 1000;
export const NGAY_GIAY = 86400;
export const NAM_GIAY = 365.25 * NGAY_GIAY;    // năm Julius
export const NAS_M = C * NAM_GIAY;             // 1 năm ánh sáng, mét
export const NAS_AU = NAS_M / AU_M;            // ≈ 63 241 AU
export const NGAY_ANH_SANG_AU = C * NGAY_GIAY / AU_M; // ≈ 173,14 AU
export const GIO_ANH_SANG_AU = C * 3600 / AU_M;       // ≈ 7,214 AU
export const PARSEC_M = 3.0856775814913673e16;
export const MPC_M = PARSEC_M * 1e6;

export const GM_MAT_TROI = 1.32712440018e20;   // m³/s² (JPL)
export const M_MAT_TROI = GM_MAT_TROI / G;     // ≈ 1,9884e30 kg
export const RS_MAT_TROI_M = 2 * GM_MAT_TROI / (C * C); // bán kính Schwarzschild của Mặt Trời ≈ 2953 m
export const R_MAT_TROI_KM = 695700;
export const GM_TRAI_DAT = 3.986004418e14;     // m³/s²
export const R_TRAI_DAT_KM = 6371.0;

export const KM_S_SANG_AU_NAM = NAM_GIAY / AU_KM; // 1 km/s ≈ 0,21095 AU/năm

// Mặt Trời quay quanh tâm Ngân Hà. Các phép đo cho 220–250 km/s; dùng 230 km/s ≈ 828 000 km/h.
export const V_MAT_TROI_KM_S = 230;
export const V_MAT_TROI_AU_NAM = V_MAT_TROI_KM_S * KM_S_SANG_AU_NAM; // ≈ 48,5 AU/năm
// Khoảng cách tới tâm Ngân Hà: 8,2 kpc ≈ 26 700 năm ánh sáng (GRAVITY 2019–2021: 8,18–8,28 kpc).
export const R0_NGAN_HA_NAS = 26700;
// Sagittarius A*: 4,3 triệu khối lượng Mặt Trời (GRAVITY 2022: 4,297 triệu).
export const M_SGR_A = 4.3e6;

export const DO = Math.PI / 180;
export const GIAY_CUNG = DO / 3600;

// Tiện ích định dạng số kiểu Việt Nam: dấu phẩy thập phân, khoảng trắng mảnh ngăn hàng nghìn.
const tachNghin = ngonNgu === 'vi' ? ' ' : ',';
const thapPhan = ngonNgu === 'vi' ? ',' : '.';
export function so(x, chuSo = 1) {
  if (!isFinite(x)) return '∞';
  const s = Math.abs(x).toFixed(chuSo);
  let [nguyen, le] = s.split('.');
  nguyen = nguyen.replace(/\B(?=(\d{3})+(?!\d))/g, tachNghin);
  return (x < 0 ? '−' : '') + nguyen + (le ? thapPhan + le : '');
}

// Số có nghĩa: 0,00123 → "0,00123"; 12345 → "12 300"
export function soNghia(x, n = 3) {
  if (x === 0) return '0';
  if (!isFinite(x)) return '∞';
  const bac = Math.floor(Math.log10(Math.abs(x)));
  if (bac >= 15 || bac < -6) return luyThua(x, n);
  const chuSo = Math.max(0, n - 1 - bac);
  const tron = Number(x.toPrecision(n));
  return so(tron, Math.min(chuSo, 9));
}

const MU = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function luyThua(x, n = 2) {
  if (x === 0) return '0';
  const bac = Math.floor(Math.log10(Math.abs(x)));
  const heSo = x / Math.pow(10, bac);
  const mu = String(bac).split('').map((k) => MU[k]).join('');
  return `${heSo.toFixed(n - 1).replace('.', thapPhan)}×10${mu}`;
}
