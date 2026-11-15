// Bộ kiểm số cho Bài 8 «Gia tốc trong không-thời gian».
// Chạy: node kiem-tra/kiem-rindler.mjs

import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { G0, cTrenA, aNasNam2, tuRindler, veRindler, duHanh, duHanhCoHam, duHanhKhongHam, tiLeNhip, tChamSan, dichTanSo, thoiDiemNhan, giaTocTaiRho } from '../src/vat-ly/rindler.js';
import { R0_NGAN_HA_NAS } from '../src/vat-ly/hang-so.js';

const K = cTrenA();
const H = 0.4;

muc('1. Đơn vị: 1 g theo năm và năm ánh sáng');
kiem('c/g', K, 0.9687, 5e-5, ' năm');
kiem('1 g', aNasNam2(), 1.03, 0.005, ' năm ánh sáng/năm²');

muc('2. Hệ thức sinh, cosh, tanh');
for (const eta of [-1.2, 0, 0.5, 1.7]) {
  const [X, T] = tuRindler(K, eta);
  kiem(`X² − T² = ρ0² tại η = ${eta}`, X * X - T * T, K * K, 1e-12);
  kiem(`vận tốc dX/dT = tanh η tại η = ${eta}`, T / X, Math.tanh(eta), 1e-12);
  const [r, e] = veRindler(X, T);
  kiem(`đổi ngược ra đúng η = ${eta}`, e, eta, 1e-9);
  kiem(`đổi ngược ra đúng ρ`, r, K, 1e-9);
}
{
  // gia tốc riêng: |d²x/dτ²| của hyperbol bằng 1/ρ
  const tau = 0.7, d = 1e-4;
  const x = (t) => tuRindler(K, t / K);
  const [X0, T0] = x(tau - d), [X1, T1] = x(tau), [X2, T2] = x(tau + d);
  const aX = (X0 - 2 * X1 + X2) / (d * d), aT = (T0 - 2 * T1 + T2) / (d * d);
  kiem('gia tốc riêng của sàn = 1/ρ0', Math.sqrt(aX * aX - aT * aT), 1 / K, 1e-5);
  kiem('trần tăng tốc yếu hơn sàn: ρ0/(ρ0 + h)', giaTocTaiRho(K + H) / giaTocTaiRho(K), 0.708, 5e-4);
}

muc('3. Bảng du hành 1 g');
const BANG = [
  [1, 1.19, 0.56, 0.7748],
  [2, 3.76, 2.91, 0.9683],
  [3, 10.70, 9.77, 0.9959],
  [5, 84.5, 83.5, 0.99993],
  [10, 14736, 14735, 0.99999999],
];
for (const [tau, T, d, v] of BANG) {
  const r = duHanh(tau);
  const sai = (x) => Math.max(0.006, Math.abs(x) * 6e-4);
  kiem(`τ = ${tau} năm: Trái Đất`, r.T, T, sai(T), ' năm');
  kiem(`τ = ${tau} năm: quãng đường`, r.d, d, sai(d), ' năm ánh sáng');
  kiem(`τ = ${tau} năm: vận tốc`, r.v, v, 6e-5, ' c');
}

muc('4. Tới tâm Ngân Hà (26 700 năm ánh sáng)');
{
  const r = duHanhCoHam(R0_NGAN_HA_NAS);
  kiem('có hãm ở nửa sau: năm trên tàu', r.tau, 19.8, 0.05);
  kiem('có hãm: năm trên Trái Đất', r.T, 26702, 1);
  kiem('γ lớn nhất ở giữa đường', r.gMax, 13782, 1);
  const s = duHanhKhongHam(R0_NGAN_HA_NAS);
  kiem('không hãm: năm trên tàu', s.tau, 10.6, 0.05);
}

muc('5. Đồng hồ trần và sàn');
kiem('tỉ số nhịp (ρ0 + h)/ρ0 với h = 0,4', tiLeNhip(K, H), 1.413, 5e-4);
kiem('bằng 1 + ah/c²', tiLeNhip(K, H), 1 + aNasNam2() * H, 1e-12);
{
  // chớp sáng từ sàn: η khi tới trần = η phát + ln((ρ0 + h)/ρ0)
  for (const etaE of [0, 0.3, 0.9]) {
    const [Xe, Te] = tuRindler(K, etaE);
    const u = Te - Xe;                                        // T − X không đổi dọc tia sáng đi lên
    const R = K + H;
    // giao với X² − T² = R²: −u·v = R², v = T + X
    const v = -(R * R) / u;
    const T = (u + v) / 2, X = (v - u) / 2;
    const [, etaC] = veRindler(X, T);
    kiem(`tia phát lúc η = ${etaE} tới trần lúc η + ln(1,413)`, etaC - etaE, Math.log(tiLeNhip(K, H)), 1e-9);
  }
}
kiem('Pound và Rebka: gh/c² với h = 22,5 m', dichTanSo(22.5), 2.455e-15, 0.001e-15);
kiem('0,25 năm của sàn ứng với ? năm của trần', 0.25 * tiLeNhip(K, H), 0.353, 5e-4, ' năm');
kiem('gh/c² cho mỗi mét', dichTanSo(1), 1.09e-16, 0.01e-16);
kiem('tên lửa 30 m: hiệu ứng nhỏ hơn bao nhiêu lần so với h = 0,4 năm ánh sáng', (tiLeNhip(K, H) - 1) / dichTanSo(30), 1.26e14, 0.02e14);
kiem('mỗi năm trên tàu quãng đường nhân lên e^(a/c)', Math.exp(1 / K), 2.81, 0.01);
kiem('kiểm lại: d(6)/d(5)', duHanh(6).d / duHanh(5).d, 2.8, 0.05);

muc('6. Quả bóng');
{
  const t = tChamSan(K, H);
  kiem('sàn chạm quả bóng lúc T', t, 0.967, 5e-4, ' năm');
  const [X] = tuRindler(K, Math.asinh(t / K));
  kiem('lúc đó sàn ở đúng X = ρ0 + h', X, K + H, 1e-12);
  kiem('theo đồng hồ sàn', K * Math.asinh(t / K), K * Math.acosh((K + H) / K), 1e-12, ' năm');
  kiem('đồng hồ sàn lúc chạm', K * Math.acosh((K + H) / K), 0.85, 0.005, ' năm');
}

muc('7. Chân trời: đèn hiệu thả qua cửa sàn');
kiem('xung phát lúc 0 tới ngay', thoiDiemNhan(0, K), 0, 1e-12);
kiem('xung phát lúc 0,5 năm tới sàn lúc', thoiDiemNhan(0.5, K), 0.703, 5e-4, ' năm');
kiem('xung phát lúc 0,9 năm tới sàn lúc', thoiDiemNhan(0.9, K), 2.563, 5e-4, ' năm');
kiemDung('xung phát sau T = ρ0 không bao giờ tới', thoiDiemNhan(1.0, K) === Infinity);

muc('8. Bản 3: thử thách và âm thanh');
{
  // Thử thách bước 1: kéo tên lửa tới 0,9 c (lệch dưới 0,01 c)
  const e = Math.atanh(0.9);
  kiem('0,9 c đến sau τ = ρ0·atanh 0,9', K * e, 1.426, 5e-4, ' năm');
  kiem('lúc đó đồng hồ Trái Đất (khung quán tính) chỉ', K * Math.sinh(e), 2.0, 0.005, ' năm');
  kiem('dung sai ±0,01 c: τ thấp nhất', K * Math.atanh(0.89), 1.377, 0.001, ' năm');
  kiem('dung sai ±0,01 c: τ cao nhất', K * Math.atanh(0.91), 1.480, 0.001, ' năm');
  // Thử thách bước 4: đồng hồ thứ ba nhanh gấp đôi sàn
  kiem('đồng hồ nhanh gấp đôi ở ρ = 2ρ0', 2 * K, 1.937, 5e-4, ' năm ánh sáng');
  kiem('tỉ số nhịp ở đó = ρ/ρ0', tiLeNhip(K, K), 2, 1e-12);
  kiem('gia tốc riêng ở đó (theo g)', giaTocTaiRho(2 * K) / giaTocTaiRho(K), 0.5, 1e-12);
  kiem('dung sai ±0,05 về tỉ số ứng với ± (năm ánh sáng)', 0.05 * K, 0.048, 5e-4);
  // Thử thách bước 5: tín hiệu không bao giờ tới khi phát sau T = ρ0 trên đường X = ρ0
  kiemDung('phát lúc ρ0 + 0,01 thì không bao giờ tới', thoiDiemNhan(K + 0.01, K) === Infinity);
  kiemDung('lúc vào bước (phát lúc 0,5 năm) thì tới được', Number.isFinite(thoiDiemNhan(0.5, K)));
  kiem('nhãn «nhịp nhận chậm đi còn …» khi phát lúc 0,5 năm', 1 - 0.5 / K, 0.48, 0.005);
  // Âm thanh: tần số nốt = 660 Hz × (nhịp nhận / nhịp phát) = 660 Hz × (1 − Te/ρ0) = 660 Hz × e^(−τ_nhận/ρ0)
  const f = (Te) => 660 * (1 - Te / K);
  for (const Te of [0.3, 0.5, 0.9]) kiem(`tần số nốt bằng 660·e^(−τ/ρ0), phát lúc ${Te}`, f(Te), 660 * Math.exp(-thoiDiemNhan(Te, K) / K), 1e-9, ' Hz');
  kiem('chớp phát lúc 0,5 năm nghe ở', f(0.5), 319, 0.5, ' Hz');
  kiem('chớp phát lúc 0,9 năm nghe ở', f(0.9), 46.8, 0.1, ' Hz');
  {
    // tỉ số nhịp nhận/phát bằng dTe/dτ (đạo hàm số)
    const d = 1e-6, Te = 0.6;
    kiem('nhịp nhận/nhịp phát = dTe/dτ_nhận', d / (thoiDiemNhan(Te + d, K) - thoiDiemNhan(Te, K)), 1 - Te / K, 1e-5);
  }
  // Quy đổi thời gian của hình: «bây giờ» chạy 0,42 năm đồng hồ sàn mỗi giây
  kiem('1 năm đồng hồ sàn kéo dài «khoảng 2,4 giây»', 1 / 0.42, 2.4, 0.03, ' s');
  kiem('tích trần cách nhau (theo đồng hồ sàn)', 0.25 / tiLeNhip(K, H), 0.177, 5e-4, ' năm');
}

tongKet();
