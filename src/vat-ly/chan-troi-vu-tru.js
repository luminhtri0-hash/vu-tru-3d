// Cấu trúc nhân quả của vũ trụ giãn nở phẳng (FLRW): thời gian vũ trụ, thời gian bảo giác, các chân trời.
// Đơn vị: thời gian tỉ năm (Gyr), khoảng cách tỉ năm ánh sáng (Gly), c = 1.
//
//   H(a) = H0 √(Ωr a⁻⁴ + Ωm a⁻³ + ΩΛ)            (vũ trụ phẳng: Ωr + Ωm + ΩΛ = 1)
//   t(a) = ∫₀^a da / (a H)                       thời gian vũ trụ (tuổi khi hệ số tỉ lệ bằng a)
//   η(a) = ∫₀^a da / (a² H)                      thời gian bảo giác = quãng đường đồng chuyển ánh sáng đi được từ Vụ Nổ Lớn
//
// Khoảng cách đồng chuyển χ không đổi theo thời gian với thiên hà trôi theo dòng giãn nở;
// khoảng cách thật lúc đó là D = a·χ. Tia sáng theo phương bán kính: dχ = ±dη (nghiêng 45° trong hệ trục (χ, η)).
// Tệp này chỉ có công thức (không dùng three.js) để bộ kiểm số đọc được.

import { GYR_TREN_H0 } from './vu-tru-hoc.js';

export const MO_HINH_PLANCK = { H0: 67.4, Om: 0.315, OL: 0.685, Or: 9.2e-5 };
export const MO_HINH_DL = { H0: 70, Om: 0.3, OL: 0.7, Or: 0 };   // mô hình Davis và Lineweaver 2004 dùng
export const Z_BUC_XA_NEN = 1090;

// Tìm chỉ số i sao cho mang[i] ≤ x < mang[i+1] (mảng tăng dần).
function timKhoang(mang, x) {
  let lo = 0, hi = mang.length - 1;
  if (x <= mang[0]) return 0;
  if (x >= mang[hi]) return hi - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (mang[m] <= x) lo = m; else hi = m; }
  return lo;
}
// Nội suy tuyến tính y(x) trên hai mảng (x tăng dần).
function noiSuy(xs, ys, x) {
  const i = timKhoang(xs, x);
  const u = (x - xs[i]) / (xs[i + 1] - xs[i]);
  return ys[i] + u * (ys[i + 1] - ys[i]);
}

// Dựng bảng t(a), η(a) trên lưới a chia đều theo logarit, rồi trả về các hàm tra cứu.
export function taoVuTru({ H0 = 67.4, Om = 0.315, OL = 0.685, Or = 9.2e-5 } = {}, { aMin = 1e-8, aMax = 1e3, n = 24000 } = {}) {
  const h = H0 / GYR_TREN_H0;                                           // H0 tính bằng 1/Gyr
  const E = (a) => Math.sqrt(Or / (a * a * a * a) + Om / (a * a * a) + OL);
  const H = (a) => h * E(a);                                            // 1/Gyr
  // Đoạn đầu (a rất nhỏ): bức xạ và vật chất trội, ΩΛ không đáng kể → tích phân đóng.
  const tDau = (a) => (Om > 0
    ? (2 / (3 * h * Om * Om)) * ((Om * a - 2 * Or) * Math.sqrt(Or + Om * a) + 2 * Math.pow(Or, 1.5))
    : (a * a) / (2 * h * Math.sqrt(Or)));
  const etaDau = (a) => (Om > 0
    ? (2 / (h * Om)) * (Math.sqrt(Or + Om * a) - Math.sqrt(Or))
    : a / (h * Math.sqrt(Or)));
  const lnA = new Float64Array(n), A = new Float64Array(n), T = new Float64Array(n), ETA = new Float64Array(n);
  const l0 = Math.log(aMin), l1 = Math.log(aMax), dl = (l1 - l0) / (n - 1);
  // Tích phân theo ln a: dt = d(ln a)/H, dη = d(ln a)/(a H). Dùng Simpson trên từng ô (điểm giữa).
  const ft = (l) => 1 / H(Math.exp(l));
  const fe = (l) => { const a = Math.exp(l); return 1 / (a * H(a)); };
  for (let i = 0; i < n; i++) {
    const l = l0 + i * dl;
    lnA[i] = l; A[i] = Math.exp(l);
    if (i === 0) { T[0] = tDau(aMin); ETA[0] = etaDau(aMin); continue; }
    const la = l - dl, lm = l - dl / 2;
    T[i] = T[i - 1] + (dl / 6) * (ft(la) + 4 * ft(lm) + ft(l));
    ETA[i] = ETA[i - 1] + (dl / 6) * (fe(la) + 4 * fe(lm) + fe(l));
  }
  // Đuôi từ aMax tới vô cùng: H → h√(ΩΛ + Ωm a⁻³) gần như hằng; ∫ da/(a² H) ≈ 1/(aMax·H(aMax)) (sai số bậc a⁻³).
  const etaVoCung = OL > 0 ? ETA[n - 1] + 1 / (aMax * H(aMax)) : Infinity;

  const tTai = (a) => (a <= aMin ? tDau(a) : noiSuy(lnA, T, Math.log(a)));
  const etaTai = (a) => (a <= aMin ? etaDau(a) : noiSuy(lnA, ETA, Math.log(a)));
  const aTuT = (t) => {
    if (t <= T[0]) { // đảo nghiệm đoạn đầu bằng chia đôi
      let lo = 0, hi = aMin;
      for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (tDau(m) < t) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    return Math.exp(noiSuy(T, lnA, t));
  };
  const aTuEta = (eta) => {
    if (eta <= ETA[0]) {
      let lo = 0, hi = aMin;
      for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (etaDau(m) < eta) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    if (eta >= ETA[n - 1]) return aMax;
    return Math.exp(noiSuy(ETA, lnA, eta));
  };

  const tuoi = tTai(1);
  const eta0 = etaTai(1);
  const vu = {
    H0, Om, OL, Or, h, H, tTai, etaTai, aTuT, aTuEta, tuoi, eta0, etaVoCung, aMin, aMax,
    banKinhHubbleNay: 1 / h,                                  // c/H0
    chanTroiHat: eta0,                                        // khoảng cách thật hôm nay tới mép vũ trụ quan sát được
    chanTroiSuKien: etaVoCung - eta0,                         // khoảng cách thật hôm nay tới chân trời sự kiện
    // Nón ánh sáng quá khứ của ta (hôm nay): khoảng cách đồng chuyển và khoảng cách thật lúc phát.
    chiNonQuaKhu: (a) => eta0 - etaTai(a),
    dNonQuaKhu: (a) => a * (eta0 - etaTai(a)),
    // Mặt cầu Hubble: khoảng cách thật c/H(a); đồng chuyển c/(a·H).
    dHubble: (a) => 1 / H(a),
    chiHubble: (a) => 1 / (a * H(a)),
    // Chân trời hạt và chân trời sự kiện ở thời điểm ứng với a (đồng chuyển).
    chiHat: (a) => etaTai(a),
    chiSuKien: (a) => etaVoCung - etaTai(a),
    // Tốc độ lùi (tính theo c) của vật ở khoảng cách đồng chuyển chi, lúc hệ số tỉ lệ bằng a: v = ȧ·χ = a·H·χ.
    vLui: (a, chi) => a * H(a) * chi,
  };
  // Thiên hà ở dịch chuyển đỏ z: các con số đọc được.
  vu.thienHa = (z) => {
    const a = 1 / (1 + z);
    const chi = vu.chiNonQuaKhu(a);
    return { z, a, chi, tPhat: tTai(a), dPhat: a * chi, dNay: chi, vPhat: vu.vLui(a, chi), vNay: vu.vLui(1, chi), tDiDuong: tuoi - tTai(a) };
  };
  // Dịch chuyển đỏ (hôm nay quan sát) của thiên hà nằm ở khoảng cách đồng chuyển chi (chia đôi theo a).
  vu.zTaiChi = (chi) => {
    if (chi >= eta0) return Infinity;
    let lo = aMin, hi = 1;
    for (let k = 0; k < 100; k++) { const m = Math.sqrt(lo * hi); if (vu.chiNonQuaKhu(m) > chi) lo = m; else hi = m; }
    return 1 / Math.sqrt(lo * hi) - 1;
  };
  // Cực đại của nón ánh sáng quá khứ (khoảng cách thật lúc phát lớn nhất) và dịch chuyển đỏ tại đó.
  vu.cucDaiNon = () => {
    let lo = Math.log(1e-3), hi = 0;   // tìm cực đại theo ln a bằng chia ba
    const f = (l) => vu.dNonQuaKhu(Math.exp(l));
    for (let k = 0; k < 120; k++) {
      const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
      if (f(m1) < f(m2)) lo = m1; else hi = m2;
    }
    const a = Math.exp((lo + hi) / 2);
    return { a, z: 1 / a - 1, d: vu.dNonQuaKhu(a), t: tTai(a) };
  };
  return vu;
}
