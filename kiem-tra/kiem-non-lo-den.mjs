// Bộ kiểm số cho Bài 16 «Nón ánh sáng quanh lỗ đen».
// Chạy: node kiem-tra/kiem-non-lo-den.mjs

import { kiem, kiemTiLe, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import * as E from '../src/vat-ly/eddington-finkelstein.js';
import { RS_MAT_TROI_M, C, AU_M, M_SGR_A } from '../src/vat-ly/hang-so.js';

const BAN_KINH = [0.35, 0.6, 0.85, 1, 1.25, 1.6, 2.2, 3, 4.2, 6];

muc('1. Mép nón (elip) nằm đúng trên nón ánh sáng của metric Eddington–Finkelstein: ds² = 0');
for (const r of BAN_KINH) {
  const eps = 0.5;
  const n = E.nonEF(r, eps);
  let lon = 0;
  lon = Math.max(lon, Math.abs(E.ds2EF(r, eps, n.trong, 0)));            // mép trong
  lon = Math.max(lon, Math.abs(E.ds2EF(r, eps, n.ngoai, 0)));            // mép ngoài
  lon = Math.max(lon, Math.abs(E.ds2EF(r, eps, n.tam, n.b)));            // mép ngang
  for (let k = 0; k < 24; k++) {                                         // và mọi điểm khác trên elip
    const g = (k / 24) * 2 * Math.PI;
    lon = Math.max(lon, Math.abs(E.ds2EF(r, eps, n.tam + n.a * Math.cos(g), n.b * Math.sin(g))));
  }
  kiem(`r = ${r}: |ds²| lớn nhất trên mép nón`, lon, 0, 1e-12);
}
kiem('mép trong luôn ở −ε (tia đi vào, 45°)', E.nonEF(3, 1).trong, -1, 1e-12);
kiem('r = 1: mép ngoài dựng đứng (dr = 0)', E.nonEF(1, 1).ngoai, 0, 1e-12);
kiemDung('r = 0,6: cả nón chĩa vào trong (mép ngoài < 0)', E.nonEF(0.6, 1).ngoai < 0);
kiem('ở xa (r = 10⁶): nón gần tròn, bán trục bán kính → ε', E.nonEF(1e6, 1).a, 1, 1e-5);
kiem('ở xa (r = 10⁶): bán trục ngang → ε', E.nonEF(1e6, 1).b, 1, 1e-5);

muc('2. Độ dốc tia sáng theo phương bán kính');
for (const r of [0.5, 1, 2, 3, 10]) {
  const d = E.docTiaRa(r);
  kiem(`tia «đi ra» tại r = ${r}: dr/dt* = (r − 1)/(r + 1)`, E.ds2EF(r, 1, d), 0, 1e-12);
}
kiem('tia «đi vào» là nghiệm còn lại: ds²(1, −1) = 0', E.ds2EF(2.5, 1, E.docTiaVao()), 0, 1e-12);
kiem('dr/dt* tại r = 3 (bước 3)', E.docTiaRa(3), 0.5, 1e-12);
{ // nghiệm đóng t* = r + 2 ln|r − 1| + C: đạo hàm số khớp (r + 1)/(r − 1)
  const r = 2.7, h = 1e-6;
  kiemTiLe('đạo hàm của t*(r) tia ra', (E.tsTiaRa(r + h, 0, 5) - E.tsTiaRa(r - h, 0, 5)) / (2 * h), (r + 1) / (r - 1), 1e-7);
}
{ // Schwarzschild: dt/dr = ±r/(r − 1)
  const r = 1.8;
  kiem('Schwarzschild: tia có dt/dr = r/(r − 1)', E.ds2Schw(r, E.docSchw(r), 1), 0, 1e-12);
  // đổi tọa độ: dt = dt* − dr/(r − 1); mép nón EF đổi sang phải vẫn là tia sáng theo metric Schwarzschild
  const n = E.nonEF(r, 1);
  const dr = n.ngoai, dt = 1 - dr / (r - 1);
  kiem('mép ngoài nón EF đổi sang tọa độ Schwarzschild vẫn có ds² = 0', E.ds2Schw(r, dt, dr), 0, 1e-12);
  kiem('dt/dr của mép ngoài sau khi đổi = r/(r − 1)', dt / dr, r / (r - 1), 1e-12);
}

muc('3. Người rơi tự do («giọt mưa»)');
for (const r of [8, 3, 1.5, 1, 0.5, 0.1]) {
  const uu = E.ds2EF(r, E.dtsDtau(r), E.drDtau(r));
  kiem(`u·u tại r = ${r}`, uu, -1, 1e-12);
}
kiem('dt*/dτ tại chân trời hữu hạn = 3/2', E.dtsDtau(1), 1.5, 1e-12);
{
  // τ từ r0 tới tâm: tích phân số ∫ dr / |dr/dτ| = ∫ √r dr
  const r0 = 6, n = 20000;
  let s = 0;
  for (let i = 0; i < n; i++) { const r = ((i + 0.5) / n) * r0; s += (r0 / n) / Math.abs(E.drDtau(r)); }
  kiemTiLe('τ(6 → 0): (2/3)·r^(3/2) khớp tích phân số', E.tauToiTam(r0), s, 1e-6);
  kiem('τ từ chân trời tới kỳ dị', E.tauToiTam(1), 2 / 3, 1e-12);
  // t*(r) dạng đóng khớp tích phân số của dt*/dr = (dt*/dτ)/(dr/dτ)
  let ts = 0;
  const r1 = 0.2;
  for (let i = 0; i < n; i++) { const r = r0 - ((i + 0.5) / n) * (r0 - r1); ts += ((r0 - r1) / n) * (E.dtsDtau(r) / Math.abs(E.drDtau(r))); }
  kiemTiLe('t*(6) → t*(0,2): công thức đóng khớp tích phân số', E.tsGiotMua(r1) - E.tsGiotMua(r0), ts, 1e-6);
  kiem('rSauTau đảo đúng tauToiTam', E.rSauTau(6, E.tauToiTam(6) - E.tauToiTam(2)), 2, 1e-12);
}
kiemTiLe('thời gian riêng tối đa bên trong = π/2 (tích phân số)', E.tauToiDaSo(), Math.PI / 2, 1e-5);
kiemDung('rơi từ xa (2/3) ngắn hơn mức tối đa (π/2)', 2 / 3 < E.TAU_TOI_DA_TRONG);

muc('4. Chớp sáng gửi người ở xa (r = 7), người rơi xuất phát ở r = 6, mỗi 0,6 rs/c phát một chớp');
{
  const k = E.chopSang({ r0: 6, dTau: 0.6, rQS: 7 });
  kiem('thời gian riêng tới kỳ dị', k.tauHet, 9.798, 0.001);
  kiem('thời gian riêng tới chân trời', k.tauChanTroi, 9.131, 0.001);
  kiemDung('khoảng nhận chớp tăng đơn điệu', k.khoang.every((x, i) => i === 0 || x > k.khoang[i - 1]));
  kiem('số chớp phát', k.ds.length, 17, 0);
  kiem('số chớp thoát ra', k.ds.filter((c) => c.thoat).length, 16, 0);
  kiem('chớp cuối thoát ra phát ở r', k.chopCuoi.r, 1.127, 0.001);
  kiem('khoảng nhận đầu tiên (thời gian riêng người ở xa)', k.khoang[0], 0.95, 0.005);
  kiem('khoảng nhận cuối cùng', k.khoang[k.khoang.length - 1], 4.23, 0.01);
  kiem('chớp phát bên trong ở r', k.ds[16].r, 0.445, 0.001);
  kiemDung('chớp phát bên trong không tới người ở xa', !Number.isFinite(k.ds[16].tsNhan));
  // Phát sát chân trời hơn nữa: thời gian nhận tiến tới vô hạn (logarit)
  kiemDung('phát ở r = 1 + 10⁻⁶ thì nhận muộn hơn 20 rs/c so với phát ở 1,1', E.tsTiaRa(7, 0, 1 + 1e-6) - E.tsTiaRa(7, 0, 1.1) > 20);
}

muc('5. Kỳ dị tọa độ và kỳ dị thật');
kiem('Kretschmann tại chân trời (đơn vị 1/rs⁴)', E.kretschmann(1), 12, 1e-12);
kiem('Kretschmann tại r = 0,1', E.kretschmann(0.1), 1.2e7, 1);
kiemDung('t Schwarzschild của người rơi → ∞ khi tới gần chân trời', E.tSchwTuEF(E.tsGiotMua(1 + 1e-12), 1 + 1e-12) > 25);
kiem('gia tốc lơ lửng ở r = 1,01 (đơn vị c²/rs)', E.giaTocLoLung(1.01), 4.926, 0.001);
kiemDung('gia tốc lơ lửng ở r = 1 + 10⁻⁸ vượt 4 000 c²/rs', E.giaTocLoLung(1 + 1e-8) > 4000);
kiem('ở rất xa gia tốc lơ lửng về Newton GM/r² = 1/(2r²)', E.giaTocLoLung(1000) * 2e6, 1, 1e-3);

muc('6. Con số thật (bước 8)');
{
  const rsSgr = RS_MAT_TROI_M * M_SGR_A;
  kiem('Sgr A*: rs (triệu km)', rsSgr / 1e9, 12.7, 0.05);
  kiem('Sgr A*: rs/c (giây)', rsSgr / C, 42.4, 0.1);
  kiem('Sgr A*: chân trời → kỳ dị (giây)', (2 / 3) * rsSgr / C, 28.2, 0.1);
  kiem('Sgr A*: nhiều nhất (giây)', (Math.PI / 2) * rsSgr / C, 66.5, 0.1);
  const g = (C * C / rsSgr) * E.giaTocLoLung(1.01) / 9.80665;
  kiem('Sgr A*: lơ lửng ở 1,01 rs cần (triệu g)', g / 1e6, 3.56, 0.01);
  const rsM87 = RS_MAT_TROI_M * 6.5e9;
  kiem('M87*: rs (AU)', rsM87 / AU_M, 128.3, 0.1);
  kiem('M87*: rs/c (giờ)', rsM87 / C / 3600, 17.8, 0.05);
  kiem('M87*: chân trời → kỳ dị (giờ)', (2 / 3) * rsM87 / C / 3600, 11.9, 0.05);
  kiem('M87*: nhiều nhất (giờ)', (Math.PI / 2) * rsM87 / C / 3600, 27.9, 0.05);
  const rs10 = RS_MAT_TROI_M * 10;
  kiem('10 khối lượng Mặt Trời: rs (km)', rs10 / 1000, 29.5, 0.05);
  kiem('10 khối lượng Mặt Trời: rs/c (micro giây)', rs10 / C * 1e6, 98.5, 0.1);
  kiem('10 khối lượng Mặt Trời: chân trời → kỳ dị (micro giây)', (2 / 3) * rs10 / C * 1e6, 65.7, 0.1);
  kiem('10 khối lượng Mặt Trời: nhiều nhất (micro giây)', (Math.PI / 2) * rs10 / C * 1e6, 154.7, 0.1);
}

muc('7. Các con số khác trong lời giảng');
{
  const goc = (r) => (Math.atan(E.docTiaRa(r)) * 180) / Math.PI;
  kiem('r = 6: dr/dt* = 5/7', E.docTiaRa(6), 5 / 7, 1e-12);
  kiem('r = 6: góc mép ngoài (35,5°)', goc(6), 35.5, 0.05);
  kiem('r = 100: góc mép ngoài (44,4°)', goc(100), 44.4, 0.05);
  kiem('r = 3: 0,50 c, 26,6°', goc(3), 26.6, 0.05);
  kiem('r = 2: 0,33 c', E.docTiaRa(2), 0.33, 0.005);
  kiem('r = 2: 18,4°', goc(2), 18.4, 0.05);
  kiem('r = 1,25: 0,11 c', E.docTiaRa(1.25), 0.11, 0.005);
  kiem('r = 1,25: 6,3°', goc(1.25), 6.3, 0.05);
  kiem('r = 0,6: dr/dt* = −0,25 c', E.docTiaRa(0.6), -0.25, 1e-12);
  kiem('nón dò r = 0,6: nghiêng 14,0° vào trong', -goc(0.6), 14.0, 0.05);
  kiem('r = 1,1: c dt/dr = 11', E.docSchw(1.1), 11, 1e-9);
  kiem('r = 1,01: c dt/dr = 101', E.docSchw(1.01), 101, 1e-9);
  kiem('r = 3: elip tâm lệch 0,25ε', -E.nonEF(3, 1).tam, 0.25, 1e-12);
  kiem('r = 3: bán trục 0,75ε', E.nonEF(3, 1).a, 0.75, 1e-12);
  kiem('r = 3: bán trục ngang 0,87ε', E.nonEF(3, 1).b, 0.87, 0.005);
  kiem('nhịp đồng hồ người ở r = 7: √(6/7)', Math.sqrt(6 / 7), 0.926, 0.0005);
  kiem('rs của Mặt Trời (km)', RS_MAT_TROI_M / 1000, 2.95, 0.005);
  const rsSgr = RS_MAT_TROI_M * M_SGR_A, rs10 = RS_MAT_TROI_M * 10;
  const tt = (rs) => (C * C) / (rs * rs) * 2;   // chênh gia tốc thủy triều trên 2 m tại chân trời
  kiem('thủy triều ở chân trời Sgr A*, L = 2 m (m/s²)', tt(rsSgr) * 1e3, 1.1, 0.05);
  kiem('… tính theo g (một phần vạn)', tt(rsSgr) / 9.80665 * 1e4, 1.1, 0.1);
  kiem('thủy triều ở chân trời lỗ đen 10 M☉ (10⁸ m/s²)', tt(rs10) / 1e8, 2.06, 0.01);
  kiem('… tính theo g (triệu)', tt(rs10) / 9.80665 / 1e6, 21, 0.2);
  kiem('Kretschmann tại 0,1 rs gấp một triệu lần tại chân trời', E.kretschmann(0.1) / E.kretschmann(1), 1e6, 1e-3);
}


muc('8. Bản 3: đích của các thử thách và quy đổi âm thanh');
{
  const goc = (r) => (Math.atan(E.docTiaRa(r)) * 180) / Math.PI;
  const rTuGoc = (g) => { const d = Math.tan((g * Math.PI) / 180); return (1 + d) / (1 - d); };   // nghịch của dr/dt* = (r − 1)/(r + 1)
  // Bước 1: trong hai hàng nón, chỉ nón ở r = 1 có mép ngoài dựng đứng
  kiemDung('Bước 1: chỉ đúng một bán kính trong hàng nón có mép ngoài dựng đứng (r = 1)', BAN_KINH.filter((r) => Math.abs(E.docTiaRa(r)) < 1e-12).join() === '1');
  // Bước 3: mép ngoài nghiêng 20° (± 1,5°)
  kiem('Bước 3: mép ngoài nghiêng 20° ở', rTuGoc(20), 2.14, 0.005, ' rs');
  kiem('… 18,5° ở', rTuGoc(18.5), 2.006, 0.001, ' rs');
  kiem('… 21,5° ở', rTuGoc(21.5), 2.30, 0.005, ' rs');
  kiemDung('… chỗ đặt sẵn (3 rs) và các nút (6; 3; 1,6; 1,25 rs) đều không đạt sẵn', [3, 6, 1.6, 1.25].every((r) => Math.abs(goc(r) - 20) >= 1.5));
  kiemDung('… 2 rs (18,4°, có trong bảng) cũng không đạt', Math.abs(goc(2) - 20) >= 1.5);
  kiem('… khoảng đạt rộng (điểm ảnh ở góc nhìn của bước, cách 14 đơn vị, góc nhìn 40°, cao 1000)', (rTuGoc(21.5) - rTuGoc(18.5)) * 1000 / (2 * 14 * Math.tan((20 * Math.PI) / 180)), 29, 2, ' px');
  // Bước 4: bên trong, mép ngoài nghiêng 5° vào trong (± 2°)
  kiem('Bước 4: mép ngoài nghiêng 5° vào trong ở', rTuGoc(-5), 0.84, 0.002, ' rs');
  kiem('… 3° ở', rTuGoc(-3), 0.900, 0.001, ' rs');
  kiem('… 7° ở', rTuGoc(-7), 0.781, 0.001, ' rs');
  kiemDung('… chỗ đặt sẵn (1 rs) và các nút (1; 1,05; 0,95 rs) không đạt sẵn', [1, 1.05, 0.95].every((r) => Math.abs(-goc(r) - 5) >= 2));
  // Bước 5: người rơi từ xa còn 0,2 rs/c tới kỳ dị (± 0,03)
  const rTuTau = (t) => Math.pow(1.5 * t, 2 / 3);
  kiem('Bước 5: τ = (2/3) r^{3/2} = 0,2 ở', rTuTau(0.2), 0.448, 0.001, ' rs');
  kiem('… kiểm lại bằng hàm của bài', E.tauToiTam(rTuTau(0.2)), 0.2, 1e-12, ' rs/c');
  kiem('… 0,17 rs/c ở', rTuTau(0.17), 0.402, 0.001, ' rs');
  kiem('… 0,23 rs/c ở', rTuTau(0.23), 0.492, 0.001, ' rs');
  kiemDung('… chỗ đặt sẵn (0,6 rs) và các nút (0,85; 0,6; 0,35 rs) không đạt sẵn', [0.85, 0.6, 0.35].every((r) => Math.abs(E.tauToiTam(r) - 0.2) >= 0.03));
  // Bước 6: dừng «bây giờ» ngay sau khi nhận chớp 16
  const C = E.chopSang({ r0: 6, dTau: 0.6, rQS: 7 });
  kiem('Bước 6: người ở xa nhận chớp 16 lúc t*', C.chopCuoi.tsNhan, 24.32, 0.01, ' rs/c');
  kiem('… chớp 16 phát ở', C.chopCuoi.r, 1.13, 0.005, ' rs');
  kiemDung('… vẫn nằm trong sơ đồ (t* ≤ 26) và chớp 15 tới trước đó hơn 1 rs/c', C.chopCuoi.tsNhan + 1 <= 26 && C.chopCuoi.tsNhan - C.ds[14].tsNhan > 1);
  // Âm thanh
  const fNon = (r) => 220 * 2 ** (2 * E.docTiaRa(r));
  kiem('Tiếng nón dò: tại chân trời (nốt La)', fNon(1), 220, 1e-9, ' Hz');
  kiem('… ở 3 rs (0,5 c: cao một quãng tám)', fNon(3), 440, 1e-9, ' Hz');
  kiem('… ở 1/3 rs (−0,5 c: trầm một quãng tám)', fNon(1 / 3), 110, 1e-9, ' Hz');
  kiem('… ở 6 rs', fNon(6), 592, 1, ' Hz');
  const fNhan = (k) => 660 * (0.6 / C.khoang[Math.max(0, k - 1)]);
  kiem('Tiếng chớp nhận được: chớp 1', fNhan(0), 419, 1, ' Hz');
  kiem('… chớp 16 (khoảng nhận 4,23)', fNhan(15), 93.6, 0.2, ' Hz');
  kiem('… tỉ số «khoảng phát / khoảng nhận» của chớp 16 = 1/(1 + z)', 0.6 / C.khoang[14], 0.142, 0.001);
}

tongKet();
