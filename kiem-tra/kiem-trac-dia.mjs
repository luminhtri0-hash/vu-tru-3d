// Bộ kiểm số cho Bài 10 «Rơi tự do là đường thẳng nhất».
// Chạy: node kiem-tra/kiem-trac-dia.mjs
import { kiem, kiemTiLe, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { C, GM_TRAI_DAT, R_TRAI_DAT_KM } from '../src/vat-ly/hang-so.js';
import {
  taoMat, quyDao, clairaut, nangLuong, hDinhNangLuong, thoiGianBayNangLuong, giaTocToaDo, giaTocDungYen, hDinhNewton, psiH,
} from '../src/vat-ly/trac-dia.js';
import { tanSoTheoDoCao, betaChoDinh } from '../src/vat-ly/nem-bong.js';

const G0 = 9.80665, RE = R_TRAI_DAT_KM * 1000;
// Ba cỡ y như trong src/canh/trac-dia.js
const CO = {
  san: { rs: (2 * G0 * RE * RE) / (C * C), R: RE, hMax: 10, eta: 0.25, lambda: 0.6 },
  td: { rs: (2 * GM_TRAI_DAT) / (C * C), R: RE, hMax: 3 * RE, eta: 1, lambda: 0.9 },
  ld: { rs: 1, R: 1.5, hMax: 6.5, eta: 0.25, lambda: 0.6 },
};
const MAT = Object.fromEntries(Object.entries(CO).map(([k, c]) => [k, taoMat(c)]));

// Biến thiên tương đối lớn nhất của C dọc đường thế giới thật (bỏ điểm cuối, là điểm nội suy lúc chạm đất)
function bienThienClairaut(k, h0, vTaiCho) {
  const c = CO[k], m = MAT[k];
  const v0 = m.A(h0) * vTaiCho;
  const { e0, E2 } = nangLuong(c.rs, c.R, h0, v0);
  const tB = thoiGianBayNangLuong(c.rs, c.R, h0, e0, E2);
  const q = quyDao({ rs: c.rs, R: c.R, hMax: c.hMax, h0, v0, tMax: isFinite(tB) ? tB * 1.05 : 4 * m.T0, soBuoc: 20000 });
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < q.t.length - 1; i++) { const x = clairaut(m, q.h[i], q.v[i]); lo = Math.min(lo, x); hi = Math.max(hi, x); }
  return { bt: (hi - lo) / hi, q };
}

muc('1. Phép kiểm Clairaut: C = a²φ̇/√((bṙ/Θ)² + a²φ̇²) không đổi dọc đường thế giới thật');
for (const [k, h0, v, ten] of [
  ['san', 0, 9.9 / C, 'Sân nhà, ném 9,9 m/s'], ['san', 0, 13 / C, 'Sân nhà, ném 13 m/s'], ['san', 8, 0, 'Sân nhà, thả từ 8 m'],
  ['td', 0, 7900 / C, 'Quanh Trái Đất, ném 7,9 km/s'], ['td', 0, 11190 / C, 'Quanh Trái Đất, ném 11,19 km/s (ra khỏi khung)'],
  ['ld', 0, 0.45, 'Lỗ đen, ném 0,45 c'], ['ld', 0, 0.65, 'Lỗ đen, ném 0,65 c'], ['ld', 4, 0, 'Lỗ đen, thả từ r = 5,5 rs'],
]) {
  const { bt } = bienThienClairaut(k, h0, v);
  kiem(`${ten}: biến thiên tương đối của C`, bt, 0, 1e-11);
}

muc('2. Điều kiện nhúng |a′| ≤ b/Θ trên cả miền (z′² = (b/Θ)² − a′² ≥ 0)');
for (const [k, m] of Object.entries(MAT)) {
  let min = Infinity;
  for (let i = 0; i <= 20000; i++) { const h = (m.hMax * i) / 20000; min = Math.min(min, m.duNhung(h) / (m.b(h) / m.Theta) ** 2); }
  kiemDung(`${k}: min[z′²/(b/Θ)²] = ${min.toFixed(4)} ≥ 1 − λ² − sai số`, min >= 1 - CO[k].lambda ** 2 - 1e-6);
  kiemDung(`${k}: mặt đáy bán kính 1, thu hẹp dần lên trên (a giảm đều)`, Math.abs(m.bang.a[0] - 1) < 1e-15 && m.bang.a.every((x, i, a) => i === 0 || x < a[i - 1]));
  kiemDung(`${k}: k = A(R) − δ > 0`, m.k > 0);
}

muc('3. Sân nhà: ném 9,9 m/s');
{
  const { q } = bienThienClairaut('san', 0, 9.9 / C);
  const c = CO.san, m = MAT.san;
  const { e0, E2 } = nangLuong(c.rs, c.R, 0, m.A(0) * 9.9 / C);
  const hD = hDinhNangLuong(c.rs, c.R, 0, e0);
  kiem('độ cao cực đại (m)', hD, 4.997, 0.0005);
  kiem('thời gian bay (s), phương trình bậc hai', q.tBay / C, 2.019, 0.0005);
  const hN = (9.9 * 9.9) / (2 * G0), tN = (2 * 9.9) / G0;
  kiem('lệch so với Newton h = v²/2g (tương đối)', Math.abs(hD - hN) / hN, 0, 1e-6);
  // lệch cỡ 10⁻⁶ chủ yếu vì g giảm theo độ cao (h/R ≈ 8 × 10⁻⁷), không phải hiệu ứng tương đối
  kiem('lệch so với Newton T = 2v/g (tương đối), cỡ 10⁻⁶', Math.abs(q.tBay / C - tN) / tN, 0, 2e-6);
  const tN2 = thoiGianBayNangLuong(c.rs, c.R, 0, (9.9 / C) ** 2, 1, 64, true);
  kiem('lệch so với Newton luật 1/r² (tương đối)', Math.abs(q.tBay - tN2) / tN2, 0, 1e-8);
  kiem('mỗi vòng quanh mặt (s)', (2 * Math.PI * m.T0) / C, 2.69, 0.005);
  kiem('thả từ 5 m rơi mất (s)', quyDao({ rs: c.rs, R: c.R, hMax: 10, h0: 5, v0: 0, tMax: 1.2 * C, soBuoc: 6000 }).tBay / C, 1.01, 0.005);
  kiem('độ chênh nhịp đồng hồ ở 10 m so với mặt đất', psiH(c.rs, c.R, 10) / 2, 1.09e-15, 0.005e-15);
}

muc('4. Phương trình bậc hai và phương trình năng lượng cho cùng kết quả');
for (const [k, v, ten] of [['san', 9.9 / C, 'Sân nhà 9,9 m/s'], ['td', 7900 / C, 'Trái Đất 7,9 km/s'], ['ld', 0.6, 'lỗ đen 0,6 c']]) {
  const c = CO[k], m = MAT[k];
  const v0 = m.A(0) * v;
  const { e0, E2 } = nangLuong(c.rs, c.R, 0, v0);
  const tB = thoiGianBayNangLuong(c.rs, c.R, 0, e0, E2);
  const q = quyDao({ rs: c.rs, R: c.R, hMax: c.hMax, h0: 0, v0, tMax: tB * 1.05, soBuoc: 20000 });
  kiem(`${ten}: thời gian bay, chênh tương đối`, Math.abs(q.tBay - tB) / tB, 0, 1e-8);
  kiem(`${ten}: độ cao đỉnh, chênh tương đối`, Math.abs(q.hDinhSo - hDinhNangLuong(c.rs, c.R, 0, e0)) / hDinhNangLuong(c.rs, c.R, 0, e0), 0, 1e-6);
  // năng lượng: (dr/dt)² = A²W/E² dọc đường tích phân
  let lech = 0;
  for (let i = 0; i < q.t.length - 1; i += 97) {
    const h = q.h[i], A = m.A(h), W = e0 - c.rs * h / ((c.R + h) * c.R);
    lech = Math.max(lech, Math.abs(q.v[i] ** 2 - (A * A * W) / E2) / (v0 * v0));
  }
  kiem(`${ten}: (dr/dt)² − A²W/E² dọc đường (tương đối)`, lech, 0, 1e-9);
}

muc('5. Quanh Trái Đất (GM = 3,986 × 10¹⁴ m³/s², R = 6 371 km)');
{
  const c = CO.td, m = MAT.td;
  const { e0, E2 } = nangLuong(c.rs, c.R, 0, m.A(0) * 7900 / C);
  const hD = hDinhNangLuong(c.rs, c.R, 0, e0);
  kiem('ném 7,9 km/s: r cực đại / R', 1 + hD / RE, 1.995, 0.0005);
  kiem('ném 7,9 km/s: độ cao cực đại (km)', hD / 1000, 6340, 1);
  kiem('Newton luật 1/r² cho cùng độ cao (km)', hDinhNewton(c.rs, c.R, 7900 / C) / 1000, 6340, 1);
  kiem('ném 7,9 km/s: thời gian bay (phút)', thoiGianBayNangLuong(c.rs, c.R, 0, e0, E2) / C / 60, 68.7, 0.05);
  kiem('tốc độ thoát √(2GM/R) (km/s)', Math.sqrt((2 * GM_TRAI_DAT) / RE) / 1000, 11.19, 0.005);
  kiem('tốc độ thoát theo thuyết tương đối rộng √(rs/R)·c (km/s)', (Math.sqrt(c.rs / c.R) * C) / 1000, 11.19, 0.005);
  kiemDung('ném 11,19 km/s: thoát (không có đỉnh)', !isFinite(hDinhNangLuong(c.rs, c.R, 0, nangLuong(c.rs, c.R, 0, m.A(0) * 11190 / C).e0)) || hDinhNangLuong(c.rs, c.R, 0, nangLuong(c.rs, c.R, 0, m.A(0) * 11190 / C).e0) > 50 * RE);
  kiem('mỗi vòng quanh mặt với η = 1, λ = 0,9 (phút)', (2 * Math.PI * m.T0) / C / 60, 93.0, 0.05);
  const m25 = taoMat({ ...c, eta: 0.25, lambda: 0.6 });
  kiem('đối chiếu: η = 0,25, λ = 0,6 cho mỗi vòng khoảng 31 phút', (2 * Math.PI * m25.T0) / C / 60, 31, 0.1);
  kiem('bán kính Schwarzschild của Trái Đất (mm)', c.rs * 1000, 8.87, 0.01);
}

muc('6. Trọng lực từ nhịp đồng hồ: g = (c²/2)·dA/dr');
{
  kiem('g/c² ở mặt đất (mỗi mét), g = 9,80665', G0 / (C * C), 1.091e-16, 0.0005e-16);
  kiem('(c²/2)·dA/dr với GM thật (m/s²)', (C * C / 2) * (CO.td.rs / (RE * RE)), 9.820, 0.0005);
  kiem('c² (m²/s²)', C * C, 8.99e16, 0.005e16);
  kiem('quãng đường dọc trục thời gian trong 1 giây (km)', C / 1000, 299792, 1);
  kiem('rs/R của Trái Đất', CO.td.rs / RE, 1.4e-9, 0.05e-9);
  // giới hạn trường yếu, vận tốc nhỏ: d²r/dt² ≈ −rs/(2r²)
  const c = CO.san, { e0, E2 } = nangLuong(c.rs, c.R, 0, 1e-12);
  const a = giaTocToaDo(c.rs, c.R, 0, e0, E2, 0);
  kiem('d²r/dt² / (−rs/2R²) khi trường yếu, vận tốc nhỏ', a / (-c.rs / (2 * c.R * c.R)), 1, 3e-9);
  kiem('gia tốc riêng của người đứng yên ở mặt đất, Sân nhà (m/s²)', giaTocDungYen(c.rs, c.R, 0) * C * C, 9.81, 0.005);
}

muc('7. Gần lỗ đen (đơn vị rs)');
{
  const m = MAT.ld;
  kiem('nhịp đồng hồ ở 1,5 rs', Math.sqrt(m.A(0)), 0.58, 0.005);
  kiem('nhịp đồng hồ ở 8 rs', Math.sqrt(m.A(6.5)), 0.94, 0.005);
  kiem('gia tốc riêng để đứng yên ở 1,5 rs (c²/rs)', giaTocDungYen(1, 1.5, 0), 0.385, 0.0005);
  kiem('tốc độ thoát đo tại chỗ ở 1,5 rs (c)', Math.sqrt(1 / 1.5), 0.816, 0.0005);
  const { e0 } = nangLuong(1, 1.5, 0, m.A(0) * 0.65);
  kiemDung('ném 0,65 c: rơi về trong vòng một vòng quanh mặt', (() => {
    const E2 = m.A(0) + e0; return thoiGianBayNangLuong(1, 1.5, 0, e0, E2) < 2 * Math.PI * m.T0;
  })());
}

muc('9. Bản 3: đích của thử thách và quy đổi âm thanh (src/vat-ly/nem-bong.js)');
{
  const c = CO.san, m = MAT.san;
  // thời gian bay của vật ném từ độ cao h0 (m) với tốc độ đo tại chỗ v (m/s), đúng như cảnh dùng (quyDao)
  const bay = (h0, v) => {
    const v0 = m.A(h0) * (v / C);
    const tUoc = (v > 0 ? (2 * v) / G0 + 0.5 : Math.sqrt((2 * h0) / G0) + 0.5) * C;
    return quyDao({ rs: c.rs, R: c.R, hMax: c.hMax, h0, v0, tMax: tUoc, soBuoc: 3000 }).tBay / C;
  };
  const vong = (2 * Math.PI * m.T0) / C;
  kiem('một vòng quanh ống, Sân nhà (s)', vong, 2.69, 0.005);
  kiem('thử thách bước 1: vận tốc để lên 10 m sau đúng một vòng (m/s)', 10 / vong, 3.71, 0.005);
  kiemDung('  lúc vào bước (9,9 m/s) và nút «Ném chậm 4 m/s» không đạt (lệch quá 0,12 m/s)', [9.9, 4].every((v) => Math.abs(v - 10 / vong) > 0.12));
  kiem('thử thách bước 4: thả từ ½g·1,2² = 7,061 m, rơi (s)', bay((G0 * 1.44) / 2, 0), 1.2, 0.001);
  kiem('  biên 1,17 s: độ cao (m)', (G0 * 1.17 * 1.17) / 2, 6.71, 0.005);
  kiem('  biên 1,23 s: độ cao (m)', (G0 * 1.23 * 1.23) / 2, 7.42, 0.005);
  kiemDung('  lúc vào bước (thả 5 m) và các nút (5 m, 9 m) không đạt', [5, 9].every((h) => Math.abs(bay(h, 0) - 1.2) > 0.03));
  kiem('thử thách bước 5: ném 9,807 m/s, bay (s)', bay(0, G0), 2.0, 0.001);
  kiem('  ném 9,66 m/s, bay (s): gần biên dưới', bay(0, 9.66), 1.97, 0.003);
  kiem('  ném 9,95 m/s, bay (s): gần biên trên', bay(0, 9.95), 2.03, 0.003);
  kiemDung('  lúc vào bước (4, 7, 10, 13 m/s) không đạt', [4, 7, 10, 13].every((v) => Math.abs(bay(0, v) - 2) > 0.03));
  kiem('  nút «quả nặng, quả nhẹ» 9,9 m/s bay (s): gần đích nhưng không phải quả ném tay nên không tính', bay(0, 9.9), 2.019, 0.001);
  const beta = betaChoDinh(1.5, 3);
  kiem('thử thách bước 7: tốc độ tại chỗ để lên từ 1,5 rs tới 3 rs (c)', beta, Math.SQRT1_2, 1e-12);
  const dinh = (b) => 1.5 + hDinhNangLuong(1, 1.5, 0, nangLuong(1, 1.5, 0, MAT.ld.A(0) * b).e0);
  kiem('  đỉnh khi ném 0,7071 c (rs)', dinh(beta), 3, 1e-9);
  kiem('  biên dưới 2,8 rs: β (c)', betaChoDinh(1.5, 2.8), 0.694, 0.001);
  kiem('  biên trên 3,2 rs: β (c)', betaChoDinh(1.5, 3.2), 0.718, 0.001);
  kiemDung('  các quả lúc vào bước (0,65; 0,55; 0,45 c) không đạt', [0.65, 0.55, 0.45].every((b) => Math.abs(dinh(b) - 3) > 0.2));
  // âm thanh: f = 220·(1 + Δn(h)/Δn(hMax))
  kiem('cao độ ở mặt đất (Hz)', tanSoTheoDoCao(m, 0), 220, 1e-9);
  kiem('cao độ ở 10 m (Hz)', tanSoTheoDoCao(m, 10), 440, 1e-9);
  kiem('cao độ ở 5 m (Hz): gần như tuyến tính theo độ cao', tanSoTheoDoCao(m, 5), 330, 0.01);
  kiem('không trọng lực: cao độ ở 10 m (Hz)', tanSoTheoDoCao(m, 10, { trongLuc: false }), 220, 0);
  kiem('chênh nhịp thật giữa mặt đất và 10 m (×10⁻¹⁵)', Math.expm1(0.5 * Math.log1p(m.psi(10) / m.AR)) * 1e15, 1.09, 0.005);
  kiem('Gần lỗ đen: cao độ ở 1,5 rs (Hz)', tanSoTheoDoCao(MAT.ld, 0), 220, 1e-9);
  kiem('Gần lỗ đen: cao độ ở 8 rs (Hz)', tanSoTheoDoCao(MAT.ld, 6.5), 440, 1e-9);
}

muc('8. Câu hỏi tự kiểm');
kiem('chênh nhịp đồng hồ ở 100 m', (G0 * 100) / (C * C), 1.09e-14, 0.005e-14);

tongKet();
