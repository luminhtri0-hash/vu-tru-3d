// Máy phát tín hiệu thả rơi vào lỗ đen Schwarzschild, và tín hiệu nó gửi tới một người đứng yên ở xa hơn.
// Dùng ở Bài 15 (âm thanh và hình của máy phát rơi). Chỉ có công thức, không dùng three.js, để bộ kiểm số đọc được.
// Đơn vị: rs = c = 1 (bán kính đo bằng rs, thời gian đo bằng rs/c).
//
// 1. Máy phát thả từ đứng yên ở bán kính R, rơi tự do theo phương bán kính (Hartle ch. 9, MTW §31.4):
//      r = (R/2)(1 + cos η),   τ = (R^{3/2}/2)(η + sin η),   η từ 0 (lúc thả) tới π (kỳ dị).
//    Năng lượng riêng E = √(1 − 1/R); tốc độ rơi theo đồng hồ của máy: dr/dτ = −s với s = √(1/r − 1/R).
//    Thời gian Eddington–Finkelstein t* = t + ln|r − 1| dọc đường rơi (không hỏng ở chân trời):
//      dt*/dτ = [r² + r + 1 − r(r + 1)/R] / [r (E r + s)].
// 2. Tín hiệu đi tới người nhận đứng yên ở bán kính r0, nằm lệch một góc Δ (nhìn từ tâm) so với hướng của máy phát.
//    Tia sáng nằm trong mặt phẳng chứa tâm, máy phát và người nhận. Ta lần ngược tia từ người nhận, tìm tham số
//    va chạm b để tia tới đúng (r_phát, Δ) (phương pháp bắn), rồi lấy thời gian đi dọc tia.
//    Tỉ số tần số nhận / phát (dịch đỏ hấp dẫn và Doppler gộp lại, từ g = (k·u_nhận)/(k·u_phát)):
//      g = (1 − 1/r) / ( √(1 − 1/r0) · (E + σ Q s) ),   Q = √(1 − (1 − 1/r) b²/r²),
//    σ = +1 nếu ánh sáng rời máy phát theo hướng đi ra, −1 nếu đi vào (vòng qua lỗ đen rồi mới ra).
//    Người nhận đứng yên nên đồng hồ của họ chạy theo √(1 − 1/r0) lần thời gian Schwarzschild t.

const SQ = Math.sqrt;
export const B_TOI_HAN = (3 * SQ(3)) / 2;

// ---------- 1. Rơi từ đứng yên ----------
export function roiTuR(R) {
  if (!(R > 1)) throw new Error('roiTuR: R phải lớn hơn 1');
  const E = SQ(1 - 1 / R);
  const k = R ** 1.5 / 2;
  const r = (eta) => (R / 2) * (1 + Math.cos(eta));
  const tau = (eta) => k * (eta + Math.sin(eta));
  const etaTuR = (x) => Math.acos(Math.min(1, Math.max(-1, (2 * x) / R - 1)));
  const s = (x) => SQ(Math.max(0, 1 / x - 1 / R));
  const dtsDtau = (x) => (x * x + x + 1 - (x * (x + 1)) / R) / (x * (E * x + s(x)));
  const dtsDeta = (eta) => { const x = r(eta); return x <= 0 ? 0 : dtsDtau(x) * k * (1 + Math.cos(eta)); };
  // Bảng t*(η) tích phân Simpson từng đoạn, t*(0) = 0.
  const N = 2400;
  const bang = new Float64Array(N + 1);
  const h = Math.PI / N;
  for (let i = 0; i < N; i++) {
    const a = i * h;
    bang[i + 1] = bang[i] + (h / 6) * (dtsDeta(a) + 4 * dtsDeta(a + h / 2) + dtsDeta(a + h));
  }
  const tsTaiEta = (eta) => {
    const x = Math.min(N, Math.max(0, eta / h));
    const i = Math.min(N - 1, Math.floor(x));
    const a = i * h, du = eta - a;
    // nội suy chính xác bậc cao bằng Simpson trên phần lẻ
    return bang[i] + (du / 6) * (dtsDeta(a) + 4 * dtsDeta(a + du / 2) + dtsDeta(eta));
  };
  const etaCT = etaTuR(1);
  return { R, E, k, r, tau, etaTuR, s, dtsDtau, tsTaiEta, etaCT, tauCT: tau(etaCT), tauHet: tau(Math.PI) };
}

// Thời gian riêng từ lúc thả (đứng yên ở R) tới chân trời.
export const tauToiChanTroi = (R) => roiTuR(R).tauCT;

// ---------- 2. Lần ngược một tia từ người nhận ----------
// Trạng thái phẳng (x, y, vx, vy), gia tốc a = −(3/2) b² x / r⁵ (cùng phương trình với shader của Bài 15).
// Chọn |v|² = 1 + b²/r³ lúc đầu thì tham số λ chính là tham số afin của photon có E = 1, L = b.
function giaToc(x, y, b2, o) {
  const r2 = x * x + y * y, r = SQ(r2);
  const k = (-1.5 * b2) / (r2 * r2 * r);
  o[0] = k * x; o[1] = k * y;
}

// Chạy tia từ người nhận (r0, góc 0) đi vào, góc tăng dần. nhanh = 1: dừng lần đầu r ≤ rE (trước cận điểm);
// nhanh = 2: đi qua cận điểm rồi dừng khi r ≥ rE. Trả về { phi, tg } với tg là tích phân thời gian
// (nhánh 1: Δ(t − r*) = ∫ b²/(r²(1 + Q)) dλ; nhánh 2: Δt = ∫ r/(r − 1) dλ), hoặc { phi: Infinity } khi tia không tới.
const _a = [0, 0];
export let HE_BUOC = 1;   // hệ số cỡ bước (bộ kiểm dùng để thử hội tụ)
export function datHeBuoc(k) { HE_BUOC = k; }
function chayTia(r0, b, rE, nhanh, phiToiDa = 40) {
  const b2 = b * b;
  const rd = SQ(Math.max(0, 1 - b2 / (r0 * r0) + b2 / (r0 * r0 * r0)));
  let x = r0, y = 0, vx = -rd, vy = b / r0;
  let phi = 0, tg = 0, quaCan = false;
  const tich = (xx, yy) => {
    const r = SQ(xx * xx + yy * yy);
    if (nhanh === 1) { const Q = SQ(Math.max(0, 1 - (1 - 1 / r) * b2 / (r * r))); return b2 / (r * r * (1 + Q)); }
    return r / (r - 1);
  };
  for (let i = 0; i < 200000; i++) {
    const r = SQ(x * x + y * y);
    // bước lớn ở xa, nhỏ dần khi tới gần bán kính đích (chỗ cắt, nhất là khi tia gần như tiếp tuyến ở cận điểm)
    const dl = HE_BUOC * Math.min(Math.min(0.5, Math.max(0.03 * r, 0.25 * Math.abs(r - rE))), Math.max(0.0008, 0.4 * Math.abs(r - rE)));
    // RK4 cho (x, y, vx, vy) và tích phân thời gian
    const k1x = vx, k1y = vy; giaToc(x, y, b2, _a); const k1vx = _a[0], k1vy = _a[1]; const k1t = tich(x, y);
    let xx = x + 0.5 * dl * k1x, yy = y + 0.5 * dl * k1y;
    const k2x = vx + 0.5 * dl * k1vx, k2y = vy + 0.5 * dl * k1vy; giaToc(xx, yy, b2, _a); const k2vx = _a[0], k2vy = _a[1]; const k2t = tich(xx, yy);
    xx = x + 0.5 * dl * k2x; yy = y + 0.5 * dl * k2y;
    const k3x = vx + 0.5 * dl * k2vx, k3y = vy + 0.5 * dl * k2vy; giaToc(xx, yy, b2, _a); const k3vx = _a[0], k3vy = _a[1]; const k3t = tich(xx, yy);
    xx = x + dl * k3x; yy = y + dl * k3y;
    const k4x = vx + dl * k3vx, k4y = vy + dl * k3vy; giaToc(xx, yy, b2, _a); const k4vx = _a[0], k4vy = _a[1]; const k4t = tich(xx, yy);
    const nx = x + (dl / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    const ny = y + (dl / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    const nvx = vx + (dl / 6) * (k1vx + 2 * k2vx + 2 * k3vx + k4vx);
    const nvy = vy + (dl / 6) * (k1vy + 2 * k2vy + 2 * k3vy + k4vy);
    const dtg = (dl / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    const nr = SQ(nx * nx + ny * ny);
    const nphi = phi + Math.atan2(x * ny - y * nx, x * nx + y * ny);
    const raNgoai = nx * nvx + ny * nvy > 0;
    if (nhanh === 1 && nr <= rE) { const u = (r - rE) / (r - nr); return { phi: phi + u * (nphi - phi), tg: tg + u * dtg }; }
    if (nr < 1) return { phi: Infinity, tg };               // rơi qua chân trời trước khi tới
    if (nhanh === 1) {
      if (raNgoai) return { phi, tg, quay: true };          // quay đầu trước khi tới rE: φ là góc ở cận điểm
    } else {
      if (raNgoai) quaCan = true;
      if (quaCan && nr >= rE) { const u = (rE - r) / (nr - r); return { phi: phi + u * (nphi - phi), tg: tg + u * dtg }; }
      if (quaCan && nr > r0 + 5) return { phi: Infinity, tg };
    }
    x = nx; y = ny; vx = nvx; vy = nvy; phi = nphi; tg += dtg;
    if (phi > phiToiDa) return { phi: Infinity, tg };
  }
  return { phi: Infinity, tg };
}

// b tại đó cận điểm của tia đúng bằng rE (chỉ có khi rE > 1,5): b² = rE³/(rE − 1).
const bCanDiem = (rE) => SQ((rE * rE * rE) / (rE - 1));

// Tìm tia tới (rE, Δ) từ người nhận ở r0. Trả về { b, nhanh, tg, phi } (ảnh trực tiếp, Δ trong [0, π]).
export function timTia(r0, rE, D) {
  const giai = (lo, hi, nhanh, tang) => {
    // tang: φ tăng theo b (nhánh 1) hay giảm (nhánh 2). Chia đôi, 60 lần là thừa cho độ chính xác 1e-15.
    let kq = null;
    for (let i = 0; i < 64; i++) {
      const b = 0.5 * (lo + hi);
      const t = chayTia(r0, b, rE, nhanh, D + 1);
      const lon = t.phi > D;
      if ((lon && tang) || (!lon && !tang)) hi = b; else lo = b;
      if (Number.isFinite(t.phi) && !t.quay) kq = { b, nhanh, tg: t.tg, phi: t.phi };
      if (hi - lo < 1e-11 * Math.max(1, hi)) break;
    }
    const b = 0.5 * (lo + hi);
    const t = chayTia(r0, b, rE, nhanh, D + 1);
    return Number.isFinite(t.phi) && !t.quay ? { b, nhanh, tg: t.tg, phi: t.phi } : kq;
  };
  if (D < 1e-9) {
    const t = chayTia(r0, 0, rE, 1);
    return { b: 0, nhanh: 1, tg: t.tg, phi: 0 };
  }
  if (rE < 1.5) return giai(0, B_TOI_HAN * (1 - 1e-12), 1, true);
  // Góc lớn nhất nhánh 1 còn với tới: tia có cận điểm đúng bằng rE (φ ở cận điểm).
  const bS = bCanDiem(rE);
  const tS = chayTia(r0, bS, rE, 1, D + 1);
  if (tS.phi >= D) return giai(0, bS, 1, true);
  return giai(B_TOI_HAN * (1 + 1e-12), bS, 2, false);
}

const rSao = (r) => r + Math.log(r - 1);   // tọa độ con rùa r*

// ---------- 3. Lịch tín hiệu ----------
// R: bán kính thả (đứng yên); r0: bán kính người nhận (> R); D: góc lệch (rad); dTau: khoảng phát (đồng hồ máy phát).
// Thời gian của người nhận T tính bằng đồng hồ của họ, gốc là lúc máy phát được thả (cùng thời gian Schwarzschild t).
export function lichTinHieu({ R, r0, D = Math.PI / 2, dTau = 1, soMau = 110 }) {
  const roi = roiTuR(R);
  const nhip = SQ(1 - 1 / r0);
  const tRel = -Math.log(R - 1);                       // t Schwarzschild lúc thả (t* = 0 lúc thả)
  const suKien = (eta) => {
    const rE = roi.r(eta);
    if (rE <= 1 + 1e-12) return null;
    const ts = roi.tsTaiEta(eta);
    const tia = timTia(r0, rE, D);
    if (!tia) return null;
    let tNhan;
    if (tia.nhanh === 1) tNhan = ts + r0 + Math.log(r0 - 1) - rE - 2 * Math.log(rE - 1) + tia.tg;
    else tNhan = ts - Math.log(rE - 1) + tia.tg;
    const s = roi.s(rE);
    const Q = SQ(Math.max(0, 1 - ((1 - 1 / rE) * tia.b * tia.b) / (rE * rE)));
    const sigma = tia.nhanh === 1 ? 1 : -1;
    const g = (1 - 1 / rE) / (nhip * (roi.E + sigma * Q * s));
    return { eta, tau: roi.tau(eta), r: rE, T: nhip * (tNhan - tRel), g, b: tia.b, nhanh: tia.nhanh };
  };
  // Mẫu dày dần về phía chân trời: nửa đầu đều theo η, nửa sau đều theo ln(r − 1) xuống tới 1e-7.
  const mau = [];
  const etaGiua = roi.etaCT * 0.92;
  const n1 = Math.round(soMau * 0.45);
  for (let i = 0; i < n1; i++) mau.push(etaGiua * (i / n1));
  const lg0 = Math.log(roi.r(etaGiua) - 1), lg1 = Math.log(1e-7);
  const n2 = soMau - n1;
  for (let i = 0; i <= n2; i++) mau.push(roi.etaTuR(1 + Math.exp(lg0 + (lg1 - lg0) * (i / n2))));
  const bang = mau.map(suKien).filter(Boolean);
  // Xung tín hiệu: phát mỗi dTau theo đồng hồ của máy phát, chỉ những xung phát ở ngoài chân trời mới tới.
  const xung = [];
  for (let k = 0; k * dTau < roi.tauCT; k++) {
    const tau = k * dTau;
    // giải η từ τ (τ tăng đơn điệu theo η)
    let lo = 0, hi = roi.etaCT;
    for (let i = 0; i < 80; i++) { const m = 0.5 * (lo + hi); if (roi.tau(m) < tau) lo = m; else hi = m; }
    const e = suKien(0.5 * (lo + hi));
    if (e) xung.push({ k, ...e });
  }
  // Sự kiện phát mà ánh sáng tới người nhận đúng lúc T (bảng đơn điệu theo T): nội suy ln(r − 1), ln g theo T.
  function thay(T) {
    if (!bang.length || T < bang[0].T) return null;
    const n = bang.length;
    if (T >= bang[n - 1].T) return { r: bang[n - 1].r, tau: bang[n - 1].tau, g: 0, het: true };
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (bang[m].T <= T) lo = m; else hi = m; }
    const a = bang[lo], c = bang[hi], u = (T - a.T) / (c.T - a.T);
    const r = 1 + Math.exp(Math.log(a.r - 1) + u * (Math.log(c.r - 1) - Math.log(a.r - 1)));
    const g = Math.exp(Math.log(a.g) + u * (Math.log(c.g) - Math.log(a.g)));
    return { r, tau: a.tau + u * (c.tau - a.tau), g, het: false };
  }
  return { roi, R, r0, D, dTau, nhip, bang, xung, thay };
}

// ---------- 4. Quy đổi sang tiếng nghe được (Bài 15) ----------
// Máy phát «kêu» một tiếng bíp ở TAN_SO_PHAT Hz sau mỗi DTAU_PHAT rs/c theo đồng hồ của nó; tiếng nhận được có tần số
// g × TAN_SO_PHAT và tới cách nhau đúng bằng khoảng nhận theo đồng hồ người nghe. Thời gian bị nén:
// GIAY_MOI_RS giây thật ứng với 1 rs/c của người nghe (với Sgr A*, 1 rs/c ≈ 42 giây).
export const TAN_SO_PHAT = 880;
export const DTAU_PHAT = 1;
export const RS_MOI_GIAY = 5;
