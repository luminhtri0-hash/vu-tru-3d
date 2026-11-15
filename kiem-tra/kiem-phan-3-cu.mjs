// Bộ kiểm số cho ba bài cũ của Phần 3: Bài 7 «Nguyên lý tương đương», Bài 9 «Thời gian trôi chậm gần khối lượng»,
// Bài 11 «Không gian cong quanh một khối lượng». Mọi con số trong lời giảng của ba bài được tính lại ở đây từ hằng số.
// Chạy: node kiem-tra/kiem-phan-3-cu.mjs

import { kiem, kiemTiLe, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import * as H from '../src/vat-ly/hang-so.js';
import { flamm, nhungSao, nhipDongHo, khoangCachThat } from '../src/vat-ly/schwarzschild.js';
import { chenhDoCao, doCaoChoNsNgay, chenhVeTinh, usHapDan, usTocDo, vQuyDao, R_GPS, R_BU_TRU } from '../src/vat-ly/dong-ho-trai-dat.js';

const c = H.C, c2 = c * c;
const GM_D = H.GM_TRAI_DAT, R_D = H.R_TRAI_DAT_KM * 1000;
const g0 = 9.8;                                       // gia tốc rơi dùng trong lời giảng (m/s²)
const gD = GM_D / (R_D * R_D);                        // gia tốc hấp dẫn thuần ở mặt đất, không tính Trái Đất quay
const NGAY = H.NGAY_GIAY, NAM = H.NAM_GIAY;
const DO_GIAY = 180 / Math.PI * 3600;

// =====================================================================
muc('Bài 7 · Nguyên lý tương đương');
// Tia sáng đi ngang buồng rộng 3 m trên mặt đất: võng ½ g (L/c)²
const tBay = 3 / c;
kiem('thời gian ánh sáng vượt 3 m (ns)', tBay * 1e9, 10.0, 0.01);
kiem('độ võng của tia qua buồng 3 m (×10⁻¹⁶ m)', 0.5 * g0 * tBay * tBay * 1e16, 4.9, 0.02);
// Tên lửa 1 g: gia tốc mặt đất tính từ GM/R² (không tính quay) ≈ 9,82
kiem('g tính từ GM/R² ở mặt đất (m/s²)', gD, 9.82, 0.005);
// Trạm ISS cao khoảng 400 km: gia tốc hấp dẫn còn bao nhiêu phần trăm
const gISS = GM_D / ((R_D + 400e3) ** 2);
kiem('g ở độ cao 400 km (m/s²)', gISS, 8.7, 0.01);
kiem('tỉ lệ so với mặt đất (%), «gần 90%»', (gISS / gD) * 100, 88.5, 0.1);
// Lực thủy triều trong buồng rơi: hai bóng cách nhau d, rơi một quãng h, xích lại d·h/R
kiem('hai bóng cách 3 m rơi 1,55 m xích lại (µm)', (3 * 1.55 / R_D) * 1e6, 0.73, 0.005);
kiem('hai bóng cách 1 km rơi 500 m xích lại (cm)', (1000 * 500 / R_D) * 100, 7.8, 0.05);
kiem('gia tốc ngang lệch nhau của hai bóng cách 3 m (×10⁻⁶ m/s²)', (gD * 3 / R_D) * 1e6, 4.6, 0.05);
// Thời gian rơi 1,55 m (bóng thả từ tay)
kiem('thời gian bóng rơi 1,55 m (s)', Math.sqrt(2 * 1.55 / g0), 0.56, 0.005);
// Einstein 1911: lập luận buồng kín cho nửa độ lệch ánh sáng sát mép Mặt Trời
const rsMT = H.RS_MAT_TROI_M, RMT = H.R_MAT_TROI_KM * 1000;
kiem('độ lệch kiểu 1911 sát Mặt Trời, rs/R (giây cung)', (rsMT / RMT) * DO_GIAY, 0.875, 0.005);
kiem('độ lệch đúng 1915, 2rs/R (giây cung)', (2 * rsMT / RMT) * DO_GIAY, 1.75, 0.005);
// Bản 3 của Bài 7: thử thách, cần ga, hình thu nhỏ (hằng số chép từ src/canh/tuong-duong.js)
{
  const KG = 70, G_HINH = 2.4, C_HINH = 2.6, L_TIA = 1.47 - -1.17, RD_HINH = 6.5;
  const canChi = (k) => KG * k;                       // cân chỉ 70 kg × a/g, k = a/g theo cần ga
  kiem('cần ga 1 g: cân chỉ (kg)', canChi(1), 70, 1e-9);
  kiem('dung sai thử thách «70 kg»: ±0,043 g ứng với (kg)', canChi(1.043) - canChi(1), 3.0, 0.02);
  const vong = (k) => 0.5 * G_HINH * k * (L_TIA / C_HINH) ** 2;  // độ võng trên hình, buồng gia tốc k g
  kiem('độ võng trên hình ở 1 g (đơn vị hình, ô số liệu ghi 1,24)', vong(1), 1.24, 0.005);
  kiem('thử thách «võng một nửa»: cần ga 0,5 g cho tỉ số', vong(0.5) / vong(1), 0.5, 1e-12);
  kiem('dung sai ±0,04 g: tỉ số võng nằm trong', vong(0.54) / vong(1), 0.54, 1e-12);
  kiem('độ võng thật ở 0,5 g qua buồng 3 m (×10⁻¹⁶ m)', 0.5 * (g0 / 2) * tBay * tBay * 1e16, 2.45, 0.01);
  kiem('Trái Đất trên hình nhỏ hơn thật «khoảng một triệu lần»', R_D / RD_HINH / 1e6, 0.98, 0.01);
}

// =====================================================================
muc('Bài 9 · Thời gian trôi chậm gần khối lượng');
kiem('nhịp ở r = 2 rs (%)', nhipDongHo(2) * 100, 70.7, 0.05);
kiem('nhịp ở r = 1,5 rs (%)', nhipDongHo(1.5) * 100, 57.7, 0.05);
kiem('nhịp ở r = 1,1 rs (%)', nhipDongHo(1.1) * 100, 30.2, 0.05);
kiem('nhịp ở r = 1,01 rs (%)', nhipDongHo(1.01) * 100, 9.95, 0.01);
kiem('nhịp ở r = 4 rs (%)', nhipDongHo(4) * 100, 86.6, 0.05);
kiem('chớp phát mỗi 2 giây ở r = 2 rs, nhận cách nhau (s)', 2 / nhipDongHo(2), 2.83, 0.005);
kiem('chớp phát mỗi 2 giây ở r = 1,1 rs, nhận cách nhau (s)', 2 / nhipDongHo(1.1), 6.63, 0.005);
kiem('dịch chuyển đỏ z ở r = 2 rs', 1 / nhipDongHo(2) - 1, 0.414, 0.001);
// Trường yếu: chênh nhịp g·h/c²
kiem('gh/c² cho h = 1 m (×10⁻¹⁶)', (gD * 1 / c2) * 1e16, 1.09, 0.005);
kiem('h = 1 m: chênh mỗi ngày (ps)', (gD * 1 / c2) * NGAY * 1e12, 9.4, 0.05);
kiem('Pound–Rebka, h = 22,5 m (×10⁻¹⁵)', (gD * 22.5 / c2) * 1e15, 2.46, 0.005);
kiem('Chou 2010, h = 33 cm (×10⁻¹⁷)', (gD * 0.33 / c2) * 1e17, 3.6, 0.05);
kiem('Bothwell 2022, h = 1 mm (×10⁻¹⁹)', (gD * 1e-3 / c2) * 1e19, 1.09, 0.005);
kiem('Skytree, h = 450 m (×10⁻¹⁴)', (gD * 450 / c2) * 1e14, 4.9, 0.05);
kiem('Skytree: mỗi ngày (ns)', (gD * 450 / c2) * NGAY * 1e9, 4.2, 0.05);
kiem('Everest 8 849 m: mỗi năm (µs)', (gD * 8849 / c2) * NAM * 1e6, 30, 0.6);
const theD = GM_D / (R_D * c2);
kiem('mặt đất so với ở rất xa, GM/(Rc²) (×10⁻¹⁰)', theD * 1e10, 6.96, 0.01);
kiem('mặt đất so với ở rất xa: mỗi năm (ms)', theD * NAM * 1e3, 22, 0.1);
// So khớp: √(1 − rs/r) ở hai độ cao, hiệu nhịp ≈ gh/c² (h = 450 m)
{
  const rsD = 2 * GM_D / c2;
  const chinhXac = nhipDongHo(R_D + 450, rsD) - nhipDongHo(R_D, rsD);
  kiemTiLe('công thức đầy đủ khớp gh/c² (h = 450 m)', chinhXac, gD * 450 / c2, 1e-3);
}
// GPS
const rGPS = 26560e3;
kiem('độ cao GPS (km)', (rGPS - R_D) / 1e3, 20190, 15);
const vGPS = Math.sqrt(GM_D / rGPS);
kiem('tốc độ vệ tinh GPS (km/s)', vGPS / 1e3, 3.87, 0.005);
const phanHD = (GM_D / c2) * (1 / R_D - 1 / rGPS);
kiem('GPS: phần hấp dẫn (×10⁻¹⁰)', phanHD * 1e10, 5.29, 0.01);
kiem('GPS: phần hấp dẫn mỗi ngày (µs)', phanHD * NGAY * 1e6, 45.7, 0.05);
const phanTD = vGPS * vGPS / (2 * c2);
kiem('GPS: phần tốc độ (×10⁻¹¹)', phanTD * 1e11, 8.35, 0.01);
kiem('GPS: phần tốc độ mỗi ngày (µs)', phanTD * NGAY * 1e6, 7.2, 0.05);
kiem('GPS: tổng mỗi ngày (µs)', (phanHD - phanTD) * NGAY * 1e6, 38.5, 0.05);
kiem('GPS: sai số khoảng cách mỗi ngày nếu không chỉnh (km)', (phanHD - phanTD) * NGAY * c / 1e3, 11.5, 0.1);
kiem('mặt đất quay ở xích đạo 465 m/s: mỗi ngày (µs)', (465 * 465 / (2 * c2)) * NGAY * 1e6, 0.1, 0.01);
kiem('1 micro giây × c (m), «gần 300 m»', c * 1e-6, 300, 0.3);
kiem('rs Trái Đất (mm), «khoảng 9 mm»', 2 * GM_D / c2 * 1e3, 8.87, 0.01);
kiem('độ đặc mặt đất rs/R (×10⁻⁹)', 2 * GM_D / c2 / R_D * 1e9, 1.39, 0.01);
kiem('h = 1 m: hiệu nhịp, «9,4 phần nghìn tỉ giây mỗi ngày»', gD / c2 * NGAY * 1e12, 9.4, 0.05);
// Mặt Trời, sao neutron
const xMT = rsMT / RMT;
kiem('rs Mặt Trời (km)', rsMT / 1e3, 2.953, 0.001);
kiem('Mặt Trời: rs/R (×10⁻⁶)', xMT * 1e6, 4.24, 0.01);
kiem('bề mặt Mặt Trời chậm (phần triệu)', (1 - nhipDongHo(1, xMT)) * 1e6, 2.12, 0.01);
kiem('bề mặt Mặt Trời: mỗi năm (s)', (1 - nhipDongHo(1, xMT)) * NAM, 67, 0.5);
kiem('dịch đỏ Mặt Trời quy ra tốc độ (m/s)', (1 / nhipDongHo(1, xMT) - 1) * c, 636, 1);
const rsNT = 1.4 * rsMT;
kiem('rs sao neutron 1,4 khối lượng Mặt Trời (km)', rsNT / 1e3, 4.13, 0.005);
const nNT = nhipDongHo(12e3, rsNT);
kiem('nhịp ở mặt sao neutron 12 km (%)', nNT * 100, 81, 0.1);
kiem('bề mặt sao neutron 12 km tính theo rs', 12e3 / rsNT, 2.9, 0.005);
kiem('nhịp ở r = 2,9 rs (%)', nhipDongHo(2.9) * 100, 81, 0.1);
kiem('sao neutron: độ đặc rs/R (bảng Bài 9: 0,34)', rsNT / 12e3, 0.34, 0.005);
kiem('sao neutron: mỗi giờ chậm (phút)', (1 - nNT) * 60, 11.4, 0.05);
// Thời gian riêng cực đại: quả bóng ném lên 1 giây lên, 1 giây xuống ở mặt đất
{
  const T = 2, v0 = g0 * T / 2, hMax = v0 * v0 / (2 * g0);
  kiem('bóng bay 2 giây: lên cao (m)', hMax, 4.9, 0.001);
  kiem('bóng: tốc độ ném (m/s)', v0, 9.8, 1e-9);
  // phần lợi do lên cao: (g/c²)∫z dt, phần thiệt do tốc độ: (1/2c²)∫v² dt
  const n = 20000; let loiCao = 0, thietTD = 0;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) * T / n, z = v0 * t - 0.5 * g0 * t * t, v = v0 - g0 * t;
    loiCao += (g0 * z / c2) * T / n; thietTD += (v * v / (2 * c2)) * T / n;
  }
  kiem('bóng: lợi do lên cao (×10⁻¹⁶ s)', loiCao * 1e16, 7.1, 0.05);
  kiem('bóng: thiệt do tốc độ (×10⁻¹⁶ s)', thietTD * 1e16, 3.6, 0.05);
  kiemDung('lợi gấp đôi thiệt trên đường parabol (đặc trưng của nghiệm đúng)', Math.abs(loiCao / thietTD - 2) < 1e-3);
  // so với đường cong thử khác (lên cao gấp rưỡi, gấp nửa): thời gian riêng ít hơn
  const tauThem = (k) => { let s = 0; for (let i = 0; i < n; i++) { const t = (i + 0.5) * T / n; const z = k * (v0 * t - 0.5 * g0 * t * t), v = k * (v0 - g0 * t); s += (g0 * z / c2 - v * v / (2 * c2)) * T / n; } return s; };
  kiemDung('đường parabol đúng cho thời gian riêng lớn hơn đường cao gấp 1,5 và gấp 0,5', tauThem(1) > tauThem(1.5) && tauThem(1) > tauThem(0.5) && tauThem(1) > tauThem(0));
}

// ---------------------------------------------------------------------
// Bài 9 · Bản 3: đích của các thử thách, quy đổi âm thanh, sân khấu Trái Đất (src/vat-ly/dong-ho-trai-dat.js).
muc('Bài 9 · Bản 3: thử thách, âm thanh, Trái Đất');
{
  const nhip = (r) => Math.sqrt(1 - 1 / r);
  // bước 2: nhịp 50% ± 2%
  kiem('thử thách bước 2: r để nhịp 50% (rs)', 1 / (1 - 0.25), 4 / 3, 1e-12);
  kiem('  nhịp ở 4/3 rs', nhip(4 / 3), 0.5, 1e-12);
  kiem('  biên nhịp 48%: r (rs)', 1 / (1 - 0.48 ** 2), 1.2994, 0.0005);
  kiem('  biên nhịp 52%: r (rs)', 1 / (1 - 0.52 ** 2), 1.3706, 0.0005);
  kiemDung('  lúc vào bước (2 rs), các nút (8; 1,2 rs) và bấm vào năm đồng hồ cố định đều không đạt',
    [2, 8, 1.2, 1.06, 1.5, 2.5, 4.5].every((r) => Math.abs(nhip(r) - 0.5) > 0.02));
  // bước 3: chớp tới cách nhau 2,5 s ± 0,05 s (z = 0,25)
  kiem('thử thách bước 3: r để chớp tới cách nhau 2,5 s (rs)', 1 / (1 - 0.8 ** 2), 2.778, 0.0005);
  kiem('  khoảng nhận ở 2,778 rs (s)', 2 / nhip(1 / 0.36), 2.5, 1e-9);
  kiemDung('  lúc vào bước (2 rs), các nút (1,1; 5 rs) và năm đồng hồ cố định đều không đạt',
    [2, 1.1, 5, 1.06, 1.5, 2.5, 4.5, 8].every((r) => Math.abs(2 / nhip(r) - 2.5) > 0.05));
  // âm thanh quanh lỗ đen: không phóng đại
  kiem('tiếng «ting» 880 Hz phát ở 2 rs, nghe ở xa (Hz)', 880 * nhip(2), 622, 0.5);
  kiem('ở 2 rs: số tiếng trầm ứng với 10 tiếng cao', 10 * nhip(2), 7.07, 0.01);
  // bước 4: đồng hồ trên tháp nhanh hơn chân tháp 2 ns/ngày ± 0,1
  kiem('thử thách bước 4: độ cao để nhanh 2 ns mỗi ngày (m)', doCaoChoNsNgay(2), 212.3, 0.1);
  kiem('  dung sai ±0,1 ns ứng với (m)', doCaoChoNsNgay(2.1) - doCaoChoNsNgay(2), 10.6, 0.1);
  kiem('  ở 450 m (lúc vào bước): ns mỗi ngày', chenhDoCao(450) * NGAY * 1e9, 4.24, 0.01);
  kiemDung('  lúc vào bước chưa đạt', Math.abs(chenhDoCao(450) * NGAY * 1e9 - 2) > 0.1);
  kiem('  gh/c² ở 450 m (Skytree, ×10⁻¹⁴)', chenhDoCao(450) * 1e14, 4.9, 0.01);
  kiem('phóng đại kim tháp 4×10¹²: ở 450 m nhanh hơn (%)', 4e12 * chenhDoCao(450) * 100, 19.6, 0.1);
  kiem('tháp 634 m vẽ cao 1,2 trên Trái Đất bán kính 2: phóng đại (lần)', 1.2 / ((634 * 2) / R_D), 6029, 1);
  // bước 6: vệ tinh
  kiem('quỹ đạo GPS theo bán kính Trái Đất', R_GPS, 4.169, 0.001);
  kiem('GPS: phần hấp dẫn (µs/ngày)', usHapDan(R_GPS), 45.7, 0.05);
  kiem('GPS: phần tốc độ (µs/ngày)', usTocDo(R_GPS), 7.2, 0.05);
  kiem('GPS: tổng (µs/ngày)', usHapDan(R_GPS) - usTocDo(R_GPS), 38.5, 0.05);
  kiem('thử thách bước 6: quỹ đạo hai phần bù nhau (R)', R_BU_TRU, 1.5, 0);
  kiem('  độ lệch ở 1,5 R (µs/ngày)', usHapDan(1.5) - usTocDo(1.5), 0, 1e-9);
  kiem('  độ cao quỹ đạo ấy (km), «khoảng 3 190 km»', 0.5 * H.R_TRAI_DAT_KM, 3190, 5);
  const U0 = (GM_D / (c2 * R_D)) * NGAY * 1e6;             // độ lệch = U0·(1 − 1,5/r)
  kiem('  biên −2 µs/ngày: r (R)', 1.5 / (1 + 2 / U0), 1.4517, 0.0005);
  kiem('  biên +2 µs/ngày: r (R)', 1.5 / (1 - 2 / U0), 1.5516, 0.0005);
  kiem('  độ lệch ở biên 1,4517 R (µs/ngày)', usHapDan(1.5 / (1 + 2 / U0)) - usTocDo(1.5 / (1 + 2 / U0)), -2, 1e-6);
  kiemDung('  lúc vào bước (quỹ đạo GPS) chưa đạt', Math.abs(usHapDan(R_GPS) - usTocDo(R_GPS)) > 2);
  kiem('  vận tốc quỹ đạo ở 1,5 R (km/s)', vQuyDao(1.5) / 1000, 6.46, 0.01);
  kiem('phóng đại kim vệ tinh 4×10⁸: GPS nhanh hơn (%)', 4e8 * chenhVeTinh(R_GPS) * 100, 17.8, 0.1);
  kiem('  ở 1,06 R (thấp nhất kéo được) chậm hơn (%)', 4e8 * chenhVeTinh(1.06) * 100, -11.6, 0.1);
}

// =====================================================================
muc('Bài 11 · Không gian cong quanh một khối lượng');
// Khoảng cách thật từ bề mặt (r = R) tới r = 2R, phần dư so với R
const du = (C) => khoangCachThat(1, 2, C) - 1;
const C_D = (2 * GM_D / c2) / R_D;
kiem('rs Trái Đất (mm)', (2 * GM_D / c2) * 1e3, 8.87, 0.01);
kiem('Trái Đất: phần dư từ mặt đất tới 2R (mm)', du(C_D) * R_D * 1e3, 3.1, 0.05);
kiem('xấp xỉ (rs/2)·ln2 cho Trái Đất (mm)', (2 * GM_D / c2) / 2 * Math.LN2 * 1e3, 3.07, 0.01);
kiem('Mặt Trời: phần dư từ bề mặt tới 2R (km)', du(xMT) * RMT / 1e3, 1.02, 0.005);
kiem('Mặt Trời: phần dư từ bề mặt tới quỹ đạo Trái Đất (km)', (khoangCachThat(RMT, H.AU_M, rsMT) - (H.AU_M - RMT)) / 1e3, 7.9, 0.05);
const C_NT = rsNT / 12e3;
kiem('sao neutron: độ đặc rs/R', C_NT, 0.345, 0.001);
kiem('sao neutron: khoảng cách thật vòng 1 → vòng 2 (đơn vị R)', khoangCachThat(1, 2, C_NT), 1.148, 0.001);
kiem('sao neutron: phần dư (km)', du(C_NT) * 12, 1.78, 0.005);
kiem('sao neutron: phần dư (%)', du(C_NT) * 100, 14.8, 0.05);
// Hệ số dℓ/dr ở một số chỗ
kiem('dℓ/dr ở r = 2 rs', 1 / Math.sqrt(1 - 1 / 2), 1.414, 0.001);
kiem('dℓ/dr ở mặt sao neutron', 1 / Math.sqrt(1 - C_NT), 1.235, 0.001);
kiem('dℓ/dr ở mặt Trái Đất − 1 (×10⁻¹⁰)', (1 / Math.sqrt(1 - C_D) - 1) * 1e10, 6.96, 0.01);
// Lỗ đen: khoảng cách thật từ chân trời tới r = 2 rs
kiem('lỗ đen: khoảng cách thật từ rs tới 2 rs (đơn vị rs)', khoangCachThat(1, 2, 1), 2.30, 0.005);
// Mặt Flamm: z(r) = 2√(rs(r − rs)); độ dốc dz/dr = √(rs/(r − rs)); kiểm điều kiện nhúng 1 + z'² = 1/(1 − rs/r)
{
  const r = 3.7, h = 1e-6;
  const zp = (flamm(r + h) - flamm(r - h)) / (2 * h);
  kiem('mặt Flamm: 1 + (dz/dr)² = 1/(1 − rs/r) tại r = 3,7 rs', 1 + zp * zp, 1 / (1 - 1 / r), 1e-6);
  kiem('mặt Flamm: z(2 rs) (đơn vị rs)', flamm(2), 2, 1e-12);
  kiem('mặt Flamm: z(5 rs) (đơn vị rs)', flamm(5), 4, 1e-12);
}
// Chỏm cầu bên trong ngôi sao: bán kính A = √(R³/rs); nối trơn với mặt Flamm tại r = R
{
  const R = 1, rs = C_NT, A = Math.sqrt(R ** 3 / rs), h = 1e-6;
  kiem('sao neutron: bán kính chỏm cầu A (đơn vị R)', A, 1.70, 0.005);
  const trai = (nhungSao(R, R, rs) - nhungSao(R - h, R, rs)) / h, phai = (nhungSao(R + h, R, rs) - nhungSao(R, R, rs)) / h;
  kiem('chỏm cầu và mặt Flamm nối trơn (hiệu độ dốc)', trai - phai, 0, 1e-3);
  kiem('độ dốc tại mép sao = √(C/(1−C))', phai, Math.sqrt(rs / (1 - rs)), 1e-3);
}
kiem('giới hạn 9/8: rs/R lớn nhất', 8 / 9, 0.889, 0.001);
kiemDung('thanh trượt dừng ở 0,86 < 8/9', 0.86 < 8 / 9);
kiem('Mặt Trời → quỹ đạo Trái Đất: phần dư / quãng (×10⁻⁸)', 7.93 / 149.6e6 * 1e8, 5.3, 0.05);
kiem('Trái Đất: rs/2 (mm)', GM_D / c2 * 1e3, 4.43, 0.01);
kiem('Mặt Trời: rs/2 (km)', rsMT / 2e3, 1.48, 0.005);
kiem('ln(1 AU / bán kính Mặt Trời)', Math.log(H.AU_M / RMT), 5.37, 0.005);
kiem('lỗ đen: phần dư từ rs tới 2 rs (đơn vị rs)', khoangCachThat(1, 2, 1) - 1, 1.30, 0.005);
// Không gian cong với vật chậm: tỉ lệ đóng góp ≈ (v/c)²
kiem('Trái Đất quanh Mặt Trời: (v/c)² (×10⁻⁹)', (29.8e3 / c) ** 2 * 1e9, 9.9, 0.05);
kiem('vệ tinh GPS: (v/c)² (×10⁻¹⁰)', (vGPS / c) ** 2 * 1e10, 1.67, 0.01);

// ----- Bài 11, Bản 3: thước kéo được, thang «Nén», thử thách (đích, dung sai, trạng thái lúc mới vào bước) -----
{
  const KG = await import('../src/vat-ly/khong-gian-cong.js');
  const C_NT3 = 4.134 / 12;                                  // độ đặc sao neutron dùng trong cảnh
  muc('Bài 11 · Bản 3: đích của thử thách');
  // Bước 3: thước 2,00 từ bề mặt sao neutron → hiệu bán kính ≈ 1,79
  const r2 = KG.rTheoThuoc(1, 2, C_NT3);
  kiem('bước 3: thước 2,00 từ bề mặt → r', r2, 2.788, 0.002);
  kiem('bước 3: hiệu bán kính lúc ấy (gợi ý «khoảng 1,79»)', r2 - 1, 1.79, 0.005);
  kiemDung('bước 3: lúc mới vào (thước 1 → 5) chưa đạt', Math.abs(khoangCachThat(1, 5, C_NT3) - 2) > 0.03);
  // Bước 4: dư đúng 10% từ vòng 1 lên vòng 2
  const C10 = KG.doDacTheoDu(0.1);
  kiem('bước 4: độ đặc cho phần dư 10% (gợi ý «khoảng 0,25»)', C10, 0.249, 0.001);
  kiem('bước 4: bán kính sao / bán kính Schwarzschild (gợi ý «gấp 4 lần»)', 1 / C10, 4.0, 0.05);
  kiem('bước 4: dung sai ±0,005 trên tỉ số ↔ khoảng độ đặc (dưới)', KG.doDacTheoDu(0.095), 0.237, 0.002);
  kiem('bước 4: dung sai ±0,005 trên tỉ số ↔ khoảng độ đặc (trên)', KG.doDacTheoDu(0.105), 0.260, 0.002);
  kiemDung('bước 4: lúc mới vào (Mặt Trời) chưa đạt', Math.abs(khoangCachThat(1, 2, 2.953 / 695700) - 1.1) > 0.005);
  kiemDung('bước 4: nút «Sao neutron» (dư 14,8%) không đạt', Math.abs(khoangCachThat(1, 2, C_NT3) - 1.1) > 0.005);
  // Bước 5: lỗ đen, thước gấp đôi hiệu bán kính
  kiem('bước 5: lỗ đen, tỉ số từ chân trời tới 2 rs (gợi ý 2,30)', KG.tiSoThuoc(1, 2, 1), 2.30, 0.005);
  kiem('bước 5: lỗ đen, tỉ số từ chân trời tới 5 rs (gợi ý 1,48)', KG.tiSoThuoc(1, 5, 1), 1.48, 0.005);
  kiem('bước 5: thước gấp đôi khi đầu ngoài ở r (gợi ý «khoảng 2,45»)', KG.rLoDenTheoTiSo(2), 2.45, 0.01);
  kiemDung('bước 5: lúc mới vào (thước 1 → 5) chưa đạt', Math.abs(KG.tiSoThuoc(1, 5, 1) - 2) > 0.05);
  kiemDung('bước 5: có lời giải với Δr ≥ 1', KG.rLoDenTheoTiSo(2) - 1 >= 1);
  // Bước 6: mép sao dốc 45°
  kiem('bước 6: C = 0,5 → độ dốc ở mép (độ)', KG.gocDocMep(0.5) * 180 / Math.PI, 45, 1e-9);
  kiem('bước 6: C = 0,5 → thước / hiệu bán kính tại mép = √2', 1 / Math.sqrt(1 - 0.5), 1.414, 0.001);
  kiem('bước 6: dung sai C ± 0,02 ↔ góc dốc dưới (độ)', KG.gocDocMep(0.48) * 180 / Math.PI, 43.85, 0.05);
  kiem('bước 6: dung sai C ± 0,02 ↔ góc dốc trên (độ)', KG.gocDocMep(0.52) * 180 / Math.PI, 46.1, 0.05);
  kiem('bước 6: sao neutron lúc mới vào: góc dốc (độ, ô số liệu 35,9°)', KG.gocDocMep(C_NT3) * 180 / Math.PI, 35.9, 0.05);
  // Thang «Nén»: các mốc trong khoảng của thang (10⁻⁹ … 0,86)
  for (const [ten, c] of [['Trái Đất', 0.00887 / 6.371e6], ['Mặt Trời', 2.953 / 695700], ['Sao lùn trắng', 3.012 / 5900], ['Sao neutron', C_NT3]]) {
    kiemDung(`thang «Nén»: mốc ${ten} nằm trong thang`, c >= 1e-9 && c <= 0.86);
  }
}

tongKet();
