// Tự phóng một vật quanh lỗ đen Schwarzschild (Bài 13, Bản 3). Đơn vị: rs = 1, c = 1, M = 1/2.
// Người học đặt chỗ phóng r0 (trên trục φ = 0) và vận tốc (vr, vφ) do một người đứng yên tại chỗ đo.
// Từ đó suy ra năng lượng riêng E, mô-men động lượng riêng L, điểm quay đầu, kiểu quỹ đạo và góc tiến động.
// Toán thuần, không đụng tới three.js. Bộ kiểm: kiem-tra/kiem-phan-4-cu.mjs (mục Bài 13 · Bản 3).

import { tienDongChinhXac } from './schwarzschild.js';

export const M_PHONG = 0.5;
// Thế hiệu dụng dạng «bình phương năng lượng»: (dr/dτ)² = E² − U(r), U(r) = (1 − 1/r)(1 + L²/r²).
export const theU = (r, L) => (1 - 1 / r) * (1 + (L * L) / (r * r));

// Vận tốc đo tại chỗ (người đứng yên) → E, L và dr/dτ.
// Khung trực chuẩn của người đứng yên: u = γ(e_t̂ + vr e_r̂ + vφ e_φ̂), nên
//   E = γ√(1 − 1/r), L = γ·vφ·r, dr/dτ = γ·vr·√(1 − 1/r).
export function tuVanToc(r0, vr, vphi) {
  const v2 = Math.min(0.999999, vr * vr + vphi * vphi);
  const g = 1 / Math.sqrt(1 - v2), f = 1 - 1 / r0;
  return { E: g * Math.sqrt(f), L: g * vphi * r0, vrTau: g * vr * Math.sqrt(f), gamma: g };
}
// Ngược lại: từ E, L tại r (điểm quay đầu, vr = 0) → tốc độ ngang đo tại chỗ.
export function vanTocNgangTuEL(r, E, L) {
  const g = E / Math.sqrt(1 - 1 / r);
  return L / (g * r);
}
// Tốc độ quỹ đạo tròn ở r (người đứng yên tại chỗ đo): √(M/(r − 2M)). Ở 3 rs bằng 0,5c.
export const vanTocTron = (r) => Math.sqrt(M_PHONG / (r - 2 * M_PHONG));
// Tốc độ thoát đo tại chỗ: √(rs/r).
export const vanTocThoat = (r) => Math.sqrt(1 / r);

// Đỉnh thế (vòng tròn không bền) của mô-men động lượng L: r = L²(1 − √(1 − 3/L²)); không có khi L² < 3.
export function dinhThe(L) {
  const L2 = L * L;
  if (L2 < 3) return null;
  const r = L2 * (1 - Math.sqrt(1 - 3 / L2));
  return { r, U: theU(r, L) };
}

// Tìm điểm quay đầu (E² = U) đầu tiên tính từ r0 theo một chiều. Trả về null nếu không có (đi tới chân trời
// hoặc ra vô cực).
function diemQuayDau(r0, E2, L, chieu) {
  const F = (r) => E2 - theU(r, L);
  const k = chieu < 0 ? 0.996 : 1.006;
  let a = r0, fa = Math.max(F(r0), 0);
  for (let i = 0; i < 6000; i++) {
    const b = a * k;
    if (chieu < 0 && b <= 1.0001) return null;
    if (chieu > 0 && b > 1e5) return null;
    const fb = F(b);
    if (fb < 0) {
      let lo = a, hi = b;           // F(lo) ≥ 0, F(hi) < 0
      for (let j = 0; j < 60; j++) { const m = 0.5 * (lo + hi); if (F(m) >= 0) lo = m; else hi = m; }
      return lo;
    }
    a = b; fa = fb;
  }
  return null;
}

// Phân loại quỹ đạo khi phóng từ r0 với vận tốc (vr, vφ):
//   'tron' (gần tròn, tâm sai < E_TRON), 'elip' (bị giữ lại, cận điểm xoay), 'roi' (rơi vào lỗ đen),
//   'thoat' (bay ra xa mãi), 'luot-thoat' (đi vào, lượn qua điểm gần nhất rồi bay ra xa mãi).
export const E_TRON = 0.08;
export function phanLoai(r0, vr, vphi) {
  const { E, L, vrTau } = tuVanToc(r0, vr, vphi);
  const E2 = E * E, L2 = Math.abs(L);
  const trong = diemQuayDau(r0, E2, L2, -1), ngoai = diemQuayDau(r0, E2, L2, +1);
  const kq = { E, L, vrTau, rP: trong, rA: ngoai, loai: 'elip', p: null, e: null, td: null };
  const raNgoai = vrTau > 1e-12, vaoTrong = vrTau < -1e-12;
  if (trong != null && ngoai != null) {
    const e = (ngoai - trong) / (ngoai + trong);
    kq.e = e;
    kq.p = (2 * ngoai * trong) / (M_PHONG * (ngoai + trong));
    kq.td = tienDongChinhXac(kq.p, e);
    kq.loai = e < E_TRON ? 'tron' : 'elip';
    // vòng tròn ở dưới 3 rs nằm trên đỉnh thế: có, nhưng không bền
    if (r0 < 3 && e < 1e-3) { kq.loai = 'khong-ben'; kq.td = null; }
  } else if (trong == null && ngoai == null) {
    kq.loai = vaoTrong || (!raNgoai && E2 < 1) ? 'roi' : 'thoat';
    if (kq.loai === 'roi') kq.rP = 1;
  } else if (trong == null) {
    kq.loai = 'roi'; kq.rP = 1;                         // bị giữ phía ngoài nhưng phía trong mở: quay đầu rồi rơi vào
  } else {
    kq.loai = vaoTrong ? 'luot-thoat' : 'thoat';          // phía ngoài mở
    if (!vaoTrong) kq.rP = r0;
  }
  return kq;
}

// ---------- Đích của thử thách (Bài 13) ----------
// Bước 3: phóng cho quỹ đạo gần tròn (tâm sai dưới E_TRON).
// Bước 6: cận điểm xoay 90° mỗi vòng (± 8°).
export const TT_XOAY_90 = { dich: Math.PI / 2, dungSai: (8 * Math.PI) / 180 };
// Bước 8: phóng vật hướng RA XA lỗ đen (thành phần hướng ra ít nhất 0,05c) mà nó vẫn quay lại rơi vào.
export const TT_ROI_RA = { vr: 0.05 };

// ---------- Âm thanh ----------
// Cao độ theo tốc độ: tần số = 200 Hz × (v/v_gốc)^0,6, v_gốc là tốc độ lúc phóng (hoặc ở điểm xa nhất). Mũ 0,6 nén
// dải tốc độ rộng (sao S2: ở điểm gần nhất nhanh gấp 16,3 lần ở điểm xa nhất) vào khoảng tai nghe dễ chịu. Kẹp trong 80–1600 Hz.
export const F_GOC = 200;
export const tanSoTocDo = (v, vGoc) => Math.min(1600, Math.max(80, F_GOC * Math.pow(Math.max(v, 1e-9) / Math.max(vGoc, 1e-9), 0.6)));
// Tỉ số tốc độ ở cận điểm và viễn điểm của elip Kepler: (1 + e)/(1 − e).
export const tiSoTocDoKepler = (e) => (1 + e) / (1 - e);
