// Lỗ đen Schwarzschild trong tọa độ Eddington–Finkelstein «đi vào».
// Đơn vị: c = 1, bán kính Schwarzschild rs = 1 (thời gian đo bằng rs/c).
//
//   t* = t + ln|r − 1|
//   ds² = −(1 − 1/r) dt*² + (2/r) dt* dr + (1 + 1/r) dr² + r² dφ²
//
// Tọa độ này không hỏng ở chân trời r = 1, nên vẽ được cả bên trong lỗ đen.
// Tệp này chỉ có công thức (không dùng three.js) để bộ kiểm số đọc được.

// Bình phương khoảng không-thời gian của một bước nhỏ (dt*, dr, dNgang), với dNgang = r·dφ là dịch chuyển ngang.
export function ds2EF(r, dts, dr, dNgang = 0) {
  return -(1 - 1 / r) * dts * dts + (2 / r) * dts * dr + (1 + 1 / r) * dr * dr + dNgang * dNgang;
}

// Cùng bước đó viết trong tọa độ Schwarzschild (dt, dr, dNgang); chỉ dùng ở r ≠ 1.
export function ds2Schw(r, dt, dr, dNgang = 0) {
  const f = 1 - 1 / r;
  return -f * dt * dt + (dr * dr) / f + dNgang * dNgang;
}

// Nón ánh sáng tương lai tại bán kính r, cắt ở độ cao dt* = eps: một elip trong mặt phẳng (dr, dNgang).
//   tâm lệch vào trong −eps/(r + 1), bán trục bán kính eps·r/(r + 1), bán trục ngang eps·√(r/(r + 1)).
export function nonEF(r, eps = 1) {
  const tam = -eps / (r + 1);
  const a = (eps * r) / (r + 1);
  const b = eps * Math.sqrt(r / (r + 1));
  return { tam, a, b, ngoai: tam + a, trong: tam - a };
}

// Độ dốc dr/dt* của hai tia sáng theo phương bán kính.
export const docTiaRa = (r) => (r - 1) / (r + 1);   // «đi ra»: dương ngoài chân trời, 0 tại chân trời, âm bên trong
export const docTiaVao = () => -1;                  // «đi vào»: luôn 45° hướng vào tâm

// Đường thế giới của tia «đi ra»: t* = r + 2 ln|r − 1| + C.  Hằng số C chọn để tia qua (t*0, r0).
export const tsTiaRa = (r, ts0, r0) => ts0 + (r - r0) + 2 * Math.log(Math.abs(r - 1) / Math.abs(r0 - 1));
// Tia «đi vào»: t* = −r + C.
export const tsTiaVao = (r, ts0, r0) => ts0 + (r0 - r);

// ---------- Người rơi tự do từ rất xa, vận tốc ban đầu bằng 0 ở vô cực («giọt mưa») ----------
// dr/dτ = −r^(−1/2),  dt*/dτ = (1 + x + x²)/(1 + x) với x = r^(−1/2).
export const drDtau = (r) => -1 / Math.sqrt(r);
export function dtsDtau(r) { const x = 1 / Math.sqrt(r); return (1 + x + x * x) / (1 + x); }
// Thời gian riêng còn lại tới r = 0: τ = (2/3) r^(3/2).
export const tauToiTam = (r) => (2 / 3) * Math.pow(r, 1.5);
// Bán kính sau thời gian riêng τ, xuất phát ở r0.
export const rSauTau = (r0, tau) => Math.pow(Math.max(0, Math.pow(r0, 1.5) - 1.5 * tau), 2 / 3);
// Nghiệm đóng: t*(r) = T0 − (2/3) r^(3/2) − 2√r + 2 ln(1 + √r), với T0 là t* lúc tới kỳ dị.
// (Suy từ thời gian Painlevé–Gullstrand: giọt mưa có t_PG = τ.)
export const tsGiotMua = (r, T0 = 0) => T0 - (2 / 3) * Math.pow(r, 1.5) - 2 * Math.sqrt(r) + 2 * Math.log(1 + Math.sqrt(r));

// Thời gian riêng dài nhất có thể sống bên trong chân trời: (π/2)·rs/c (thả rơi từ đứng yên ngay tại chân trời).
export const TAU_TOI_DA_TRONG = Math.PI / 2;
// Tích phân số kiểm lại. Thả từ đứng yên tại r = 1 (năng lượng riêng E = 0): (dr/dτ)² = 1/r − 1, nên
//   τ = ∫₀¹ √(r/(1 − r)) dr.  Đổi biến r = 1 − u² cho khỏi kỳ dị ở mép: τ = ∫₀¹ 2√(1 − u²) du.
export function tauToiDaSo(n = 4000) {
  let s = 0;
  const h = 1 / n;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * h, r = 1 - u * u;
    s += Math.sqrt(r / (1 - r)) * 2 * u * h;   // = 2√(1 − u²)·du, viết theo r để đúng là tích phân gốc
  }
  return s;
}

// ---------- Người đứng lơ lửng ở bán kính r0 ----------
// Gia tốc riêng (đơn vị c²/rs) cần để không rơi: (1/(2 r0²)) / √(1 − 1/r0). Vô hạn tại chân trời.
export const giaTocLoLung = (r0) => 1 / (2 * r0 * r0) / Math.sqrt(1 - 1 / r0);

// ---------- Đổi tọa độ ----------
export const tSchwTuEF = (ts, r) => ts - Math.log(Math.abs(r - 1));
// Trong tọa độ Schwarzschild tia sáng theo phương bán kính có dt/dr = ±r/(r − 1).
export const docSchw = (r) => r / (r - 1);

// Bất biến độ cong Kretschmann R_abcd R^abcd = 12 rs²/r⁶ (hữu hạn ở chân trời, vô hạn ở r = 0).
export const kretschmann = (r) => 12 / Math.pow(r, 6);

// ---------- Chớp sáng gửi ra ngoài ----------
// Người rơi xuất phát ở r0 lúc t* = 0 (đã có vận tốc của giọt mưa), cứ mỗi dTau phát một chớp.
// Người ở xa đứng yên ở rQS nhận chớp nào thoát ra. Trả về danh sách chớp và các mốc chính.
export function chopSang({ r0 = 6, dTau = 0.6, rQS = 7 } = {}) {
  const T0 = -tsGiotMua(r0, 0);                 // t* lúc tới kỳ dị (để t*(r0) = 0)
  const tauHet = tauToiTam(r0);                 // thời gian riêng tới kỳ dị
  const tauChanTroi = tauHet - tauToiTam(1);    // thời gian riêng tới chân trời
  const ds = [];
  for (let k = 0; k * dTau < tauHet - 1e-9; k++) {
    const tau = k * dTau;
    const r = rSauTau(r0, tau);
    const ts = tsGiotMua(r, T0);
    const thoat = r > 1;
    const tsNhan = thoat ? tsTiaRa(rQS, ts, r) : Infinity;
    ds.push({ k, tau, r, ts, thoat, tsNhan });
  }
  // Đồng hồ của người ở xa: thời gian riêng = √(1 − 1/rQS)·(khoảng t*), vì t* − t là hằng số tại rQS.
  const nhip = Math.sqrt(1 - 1 / rQS);
  const thoatRa = ds.filter((c) => c.thoat);
  const khoang = thoatRa.slice(1).map((c, i) => (c.tsNhan - thoatRa[i].tsNhan) * nhip);
  return { T0, tauHet, tauChanTroi, ds, khoang, nhip, chopCuoi: thoatRa[thoatRa.length - 1] ?? null, r0, dTau, rQS };
}
