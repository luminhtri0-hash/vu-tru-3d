// Lực thủy triều, độ lệch trắc địa và ý nghĩa phương trình Einstein (Bài 12).
// Cơ học Newton cho trường yếu: r̈ = −GM·r/|r|³. Với trường yếu, đường đi này trùng đường trắc địa của
// Einstein tới sai số cỡ GM/(rc²). Trong khung của người rơi theo phương bán kính quanh lỗ đen Schwarzschild,
// tenxơ thủy triều có đúng dạng Newton (kéo 2GM/r³ theo phương bán kính, ép GM/r³ theo hai phương ngang).

import { C, G, GM_TRAI_DAT, GM_MAT_TROI, R_TRAI_DAT_KM } from './hang-so.js';

export const GM_MAT_TRANG = 4.9028e12;       // m³/s² (JPL)
export const D_MAT_TRANG = 384400e3;         // khoảng cách trung bình Trái Đất – Mặt Trăng, m
export const R_TRAM_ISS = 6771e3;            // bán kính quỹ đạo Trạm Vũ trụ Quốc tế (độ cao khoảng 400 km), m

// ---------- Con số ----------
// Gia tốc thủy triều của một thiên thể GM ở khoảng cách d, tại điểm cách tâm Trái Đất R về phía nó: 2GM·R/d³.
export const thuyTrieu = (GM, R, d) => (2 * GM * R) / (d * d * d);
// Chênh gia tốc mỗi mét theo phương bán kính tại khoảng cách r: 2GM/r³.
export const keoMoiMet = (GM, r) => (2 * GM) / (r * r * r);
// Bán kính Schwarzschild của một vật GM.
export const banKinhSchwarzschild = (GM) => (2 * GM) / (C * C);
// Chênh gia tốc giữa đầu và chân một người cao L (m) đứng thẳng tại chân trời của lỗ đen n lần khối lượng Mặt Trời.
// Tại r = rs: 2GM/rs³ = c²/rs², nên chênh = c²·L/rs².
export function chenhTaiChanTroi(nMatTroi, L = 2) {
  const GM = nMatTroi * GM_MAT_TROI, rs = banKinhSchwarzschild(GM);
  return { rs, keo: keoMoiMet(GM, rs) * L, kiem: (C * C * L) / (rs * rs) };
}
// Thủy triều cân bằng (lý tưởng, Trái Đất phủ kín nước): độ cao mặt nước h(θ) = (M_t/M_đ)·(R⁴/d³)·(3cos²θ − 1)/2,
// θ là góc so với hướng tới Mặt Trăng.
export function trieuCanBang(theta, GMt = GM_MAT_TRANG, GMd = GM_TRAI_DAT, R = R_TRAI_DAT_KM * 1000, d = D_MAT_TRANG) {
  const c = Math.cos(theta);
  return (GMt / GMd) * (R ** 4 / d ** 3) * (3 * c * c - 1) / 2;
}

// ---------- Tenxơ thủy triều Newton: T_ij = ∂a_i/∂x_j ----------
// Gia tốc tương đối của hai hạt rơi tự do cách nhau ξ: d²ξ_i/dt² = T_ij ξ_j  (với Riemann: −R^i_{0j0} ξ^j).
export function tenxoNgoai(GM, x, y, z) {
  const r2 = x * x + y * y + z * z, r = Math.sqrt(r2), k = GM / (r2 * r2 * r);
  const p = [x, y, z];
  const T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) T[i][j] = k * (3 * p[i] * p[j] - (i === j ? r2 : 0));
  return T;
}
// Trong khối cầu vật chất đồng đều mật độ ρ: T = −(4πGρ/3)·I. Hằng số vũ trụ: T = +(Λc²/3)·I.
export const tenxoTrongVatChat = (rho) => { const k = (-4 * Math.PI * G * rho) / 3; return [[k, 0, 0], [0, k, 0], [0, 0, k]]; };
export const vet = (T) => T[0][0] + T[1][1] + T[2][2];

// ---------- Trị riêng, véc-tơ riêng của ma trận đối xứng 3×3 (phương pháp Jacobi) ----------
// a: mảng 9 số (hàng nối hàng). Trả về { gt: [λ0, λ1, λ2], vt: mảng 9 số, cột k là véc-tơ riêng k }.
export function triRieng3(a, gt = [0, 0, 0], vt = new Float64Array(9)) {
  const m = Float64Array.from(a);
  vt.fill(0); vt[0] = vt[4] = vt[8] = 1;
  for (let lan = 0; lan < 50; lan++) {
    const lech = Math.abs(m[1]) + Math.abs(m[2]) + Math.abs(m[5]);
    if (lech < 1e-14 * (Math.abs(m[0]) + Math.abs(m[4]) + Math.abs(m[8]) + 1e-300)) break;
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      const apq = m[p * 3 + q];
      if (Math.abs(apq) < 1e-300) continue;
      const app = m[p * 4], aqq = m[q * 4];
      const th = (aqq - app) / (2 * apq);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < 3; k++) {   // nhân phải với phép quay
        const mkp = m[k * 3 + p], mkq = m[k * 3 + q];
        m[k * 3 + p] = c * mkp - s * mkq; m[k * 3 + q] = s * mkp + c * mkq;
      }
      for (let k = 0; k < 3; k++) {   // nhân trái với phép quay chuyển vị
        const mpk = m[p * 3 + k], mqk = m[q * 3 + k];
        m[p * 3 + k] = c * mpk - s * mqk; m[q * 3 + k] = s * mpk + c * mqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = vt[k * 3 + p], vkq = vt[k * 3 + q];
        vt[k * 3 + p] = c * vkp - s * vkq; vt[k * 3 + q] = s * vkp + c * vkq;
      }
    }
  }
  gt[0] = m[0]; gt[1] = m[4]; gt[2] = m[8];
  return { gt, vt };
}

// ---------- Đám hạt ----------
// Trường gia tốc: { loai: 'ngoai', GM } (một thiên thể ở gốc), { loai: 'trong', w2 } (a = −w2·r, vật chất đồng đều),
// { loai: 'toi', H2 } (a = +H2·r, hằng số vũ trụ).
export function giaToc(truong, x, y, z, out) {
  if (truong.loai === 'ngoai') {
    const r2 = x * x + y * y + z * z, k = -truong.GM / (r2 * Math.sqrt(r2));
    out[0] = k * x; out[1] = k * y; out[2] = k * z;
  } else {
    const k = truong.loai === 'trong' ? -truong.w2 : truong.H2;
    out[0] = k * x; out[1] = k * y; out[2] = k * z;
  }
  return out;
}

// Một bước Verlet vận tốc cho n hạt (mảng phẳng x, v, a, mỗi hạt 3 số). a phải là gia tốc tại x hiện tại.
const _g = [0, 0, 0];
export function buocVerlet(truong, x, v, a, n, dt) {
  for (let i = 0; i < 3 * n; i++) { v[i] += 0.5 * dt * a[i]; x[i] += dt * v[i]; }
  for (let i = 0; i < n; i++) {
    giaToc(truong, x[3 * i], x[3 * i + 1], x[3 * i + 2], _g);
    a[3 * i] = _g[0]; a[3 * i + 1] = _g[1]; a[3 * i + 2] = _g[2];
  }
  for (let i = 0; i < 3 * n; i++) v[i] += 0.5 * dt * a[i];
}
export function khoiGiaToc(truong, x, a, n) {
  for (let i = 0; i < n; i++) {
    giaToc(truong, x[3 * i], x[3 * i + 1], x[3 * i + 2], _g);
    a[3 * i] = _g[0]; a[3 * i + 1] = _g[1]; a[3 * i + 2] = _g[2];
  }
}

// Ma trận hiệp phương sai vị trí (quanh trọng tâm) của n hạt: mảng 9 số. Thể tích đám hạt tỉ lệ √det.
export function hiepPhuong(x, n, out = new Float64Array(9), tam = [0, 0, 0]) {
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < n; i++) { cx += x[3 * i]; cy += x[3 * i + 1]; cz += x[3 * i + 2]; }
  cx /= n; cy /= n; cz /= n;
  tam[0] = cx; tam[1] = cy; tam[2] = cz;
  out.fill(0);
  for (let i = 0; i < n; i++) {
    const dx = x[3 * i] - cx, dy = x[3 * i + 1] - cy, dz = x[3 * i + 2] - cz;
    out[0] += dx * dx; out[1] += dx * dy; out[2] += dx * dz; out[4] += dy * dy; out[5] += dy * dz; out[8] += dz * dz;
  }
  for (const k of [0, 1, 2, 4, 5, 8]) out[k] /= n;
  out[3] = out[1]; out[6] = out[2]; out[7] = out[5];
  return out;
}
export const det3 = (m) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);

// Các điểm phân bố đều trên mặt cầu (xoắn Fibonacci) và bên trong quả cầu (ngẫu nhiên có hạt giống).
export function diemCau(nMat, nTrong, banKinh = 1, hat = 7) {
  const p = new Float64Array(3 * (nMat + nTrong));
  const vang = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < nMat; i++) {
    const y = 1 - (2 * (i + 0.5)) / nMat, r = Math.sqrt(1 - y * y), ph = i * vang;
    p[3 * i] = banKinh * r * Math.cos(ph); p[3 * i + 1] = banKinh * y; p[3 * i + 2] = banKinh * r * Math.sin(ph);
  }
  let a = hat >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = nMat; i < nMat + nTrong; i++) {
    let x, y, z;
    do { x = 2 * rnd() - 1; y = 2 * rnd() - 1; z = 2 * rnd() - 1; } while (x * x + y * y + z * z > 1);
    p[3 * i] = banKinh * x; p[3 * i + 1] = banKinh * y; p[3 * i + 2] = banKinh * z;
  }
  return p;
}

// Mô phỏng một đám hạt nhỏ thả đứng yên quanh tâm «tam», đo V̈/V lúc đầu bằng sai phân:
//   V(t) ≈ V0·(1 + ½·(V̈/V)·t²)  ⇒  V̈/V ≈ 2·(V(t)/V0 − 1)/t²   (lấy ngoại suy Richardson hai bước).
export function doVddV(truong, tam, banKinh, { nMat = 400, nTrong = 200, t1 = null, soBuoc = 400 } = {}) {
  const n = nMat + nTrong;
  const x = diemCau(nMat, nTrong, banKinh);
  for (let i = 0; i < n; i++) { x[3 * i] += tam[0]; x[3 * i + 1] += tam[1]; x[3 * i + 2] += tam[2]; }
  const v = new Float64Array(3 * n), a = new Float64Array(3 * n);
  khoiGiaToc(truong, x, a, n);
  const V = () => Math.sqrt(det3(hiepPhuong(x, n)));
  const V0 = V();
  const dt = t1 / soBuoc;
  let Vh = 0;
  for (let k = 1; k <= soBuoc; k++) { buocVerlet(truong, x, v, a, n, dt); if (k === soBuoc / 2) Vh = V(); }
  const V1 = V();
  const f = (Vt, t) => (2 * (Vt / V0 - 1)) / (t * t);
  // f(t) = V̈/V + c·t² + … → ngoại suy về t = 0
  const fh = f(Vh, t1 / 2), f1 = f(V1, t1);
  return { vddv: (4 * fh - f1) / 3, x, n, cov: hiepPhuong(x, n) };
}
