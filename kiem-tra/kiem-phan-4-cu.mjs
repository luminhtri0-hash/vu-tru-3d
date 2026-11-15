// Bộ kiểm số cho lời giảng của ba bài cũ Phần 4: Bài 13 «Quỹ đạo», Bài 14 «Ánh sáng bị bẻ cong», Bài 15 «Lỗ đen».
// Mọi con số nêu trong lời giảng được tính lại ở đây từ hằng số (src/vat-ly/hang-so.js)
// và từ các hàm trong src/vat-ly/schwarzschild.js. Chạy: node kiem-tra/kiem-phan-4-cu.mjs

import { kiem, kiemTiLe, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import * as S from '../src/vat-ly/schwarzschild.js';
import * as H from '../src/vat-ly/hang-so.js';

const DO = Math.PI / 180;
const GC = H.GIAY_CUNG;                         // một giây cung (radian)
const UAS = GC * 1e-6;                          // một micro giây cung
const rsMT = H.RS_MAT_TROI_M;                   // bán kính Schwarzschild của Mặt Trời, mét
const M_MT = H.GM_MAT_TROI / (H.C * H.C);       // GM/c² của Mặt Trời, mét

// =====================================================================
muc('Bài 13 · 1. Quỹ đạo mẫu và hai đại lượng bảo toàn (đơn vị rs = 1, M = 1/2)');
{
  const { L, E } = S.LEtuPE(14, 0.45, 0.5);
  kiem('Mẫu «Sát lỗ đen» p = 14, e = 0,45: điểm gần nhất', (14 * 0.5) / 1.45, 4.83, 0.005, ' rs');
  kiem('                                  điểm xa nhất', (14 * 0.5) / 0.55, 12.73, 0.005, ' rs');
  kiem('                                  mô-men động lượng L', L, 2.13, 0.005, ' rs·c');
  kiem('                                  năng lượng E', E, 0.973, 0.0005);
  // E và L phải khớp với hai điểm quay đầu: (1 − 1/r)(1 + L²/r²) = E² tại cận điểm và viễn điểm
  for (const r of [14 * 0.5 / 1.45, 14 * 0.5 / 0.55]) kiem(`  điểm quay đầu r = ${r.toFixed(3)}: (1 − rs/r)(1 + L²/r²) = E²`, (1 - 1 / r) * (1 + (L * L) / (r * r)), E * E, 1e-12);
  kiem('Mẫu «Sát lỗ đen»: tiến động chính xác mỗi vòng', S.tienDongChinhXac(14, 0.45) / DO, 117.4, 0.1, '°');
  kiem('Mẫu «Sát lỗ đen»: công thức 6π/p', S.tienDongXapXi(14) / DO, 77.1, 0.05, '°');
  kiem('Mẫu «Hoa thị» p = 9,4, e = 0,6: điểm gần nhất', (9.4 * 0.5) / 1.6, 2.94, 0.005, ' rs');
  kiem('Mẫu «Lượn sát rồi văng ra» p = 7,26, e = 0,6: điểm gần nhất', (7.26 * 0.5) / 1.6, 2.27, 0.005, ' rs');
  kiem('Mẫu «Lượn sát rồi văng ra»: tiến động mỗi vòng (hơn hai vòng rưỡi)', S.tienDongChinhXac(7.26, 0.6) / (2 * Math.PI), 2.56, 0.01, ' vòng');
  // thế hiệu dụng: số hạng của Einstein so với số hạng ly tâm bằng rs/r
  const r = 7;
  const tiSo = ((0.5 * 4) / r ** 3) / (4 / (2 * r * r));
  kiem('Số hạng mới / số hạng ly tâm = rs/r (r = 7 rs)', tiSo, 1 / 7, 1e-12);
  const aThuy = 0.38709927 * H.AU_M;
  kiem('Ở Sao Thủy số hạng mới nhỏ hơn số hạng ly tâm bấy nhiêu lần', aThuy / rsMT, 1.96e7, 0.02e7);
}

muc('Bài 13 · 2. Sao Thủy');
{
  const a = 0.38709927 * H.AU_M, e = 0.20563593;
  const p = (a * (1 - e * e)) / M_MT;
  const moiVong = S.tienDongXapXi(p);
  const vongMoiTheKy = 36525 / 87.9691;
  kiem('GM/c² của Mặt Trời', M_MT / 1000, 1.477, 0.001, ' km');
  kiem('Bán trục lớn Sao Thủy', a / 1e9, 57.9, 0.05, ' triệu km');
  kiem('Mỗi vòng xoay', moiVong / GC, 0.1035, 0.0005, '″');
  kiem('Số vòng mỗi thế kỷ', vongMoiTheKy, 415.2, 0.1);
  kiem('Mỗi thế kỷ', (moiVong * vongMoiTheKy) / GC, 42.98, 0.02, '″');
  kiem('Thời gian để elip xoay đủ một vòng', (360 * 3600) / ((moiVong * vongMoiTheKy) / GC) * 100 / 1e6, 3.0, 0.05, ' triệu năm');
}

muc('Bài 13 · 3. Sao S2 quanh Sgr A* (yếu tố quỹ đạo của GRAVITY 2020)');
{
  const aS2 = 0.125058 * 8246.7 * H.AU_M, e = 0.884649, GM = 4.261e6 * H.GM_MAT_TROI;
  const Mm = GM / (H.C * H.C);
  const p = (aS2 * (1 - e * e)) / Mm;
  kiem('Bán thông số p (để đặt mẫu S2 trong mô hình)', p, 5331, 5);
  kiem('Chu kỳ', (2 * Math.PI * Math.sqrt(aS2 ** 3 / GM)) / H.NAM_GIAY, 16.05, 0.03, ' năm');
  kiem('Điểm gần nhất', (aS2 * (1 - e)) / H.AU_M, 120, 1.5, ' AU');
  kiem('Điểm gần nhất tính theo rs', (aS2 * (1 - e)) / (2 * Mm), 1400, 25, ' rs');
  const vMax = Math.sqrt((GM * (1 + e)) / (aS2 * (1 - e)));
  kiem('Tốc độ ở điểm gần nhất', vMax / 1000, 7700, 100, ' km/s');
  kiem('… so với tốc độ ánh sáng', (vMax / H.C) * 100, 2.6, 0.05, ' %');
  kiem('Tiến động mỗi vòng', S.tienDongChinhXac(p, e) / DO * 60, 12.1, 0.2, '′');
}

muc('Bài 13 · 4. Quỹ đạo tròn trong cùng (ISCO) và hiệu suất của đĩa');
{
  const isco = S.LEtuPE(6.0000001, 0, 0.5);
  kiem('ISCO ở p = 6, tức r = 6M = 3 rs', 6 * 0.5, S.R_ISCO, 0);
  kiem('ISCO: L = √3 rs·c (= √12 M)', isco.L, Math.sqrt(3), 1e-3);
  kiem('ISCO: E = √(8/9)', isco.E, Math.sqrt(8 / 9), 1e-6);
  kiem('Hiệu suất giải phóng năng lượng 1 − √(8/9)', (1 - Math.sqrt(8 / 9)) * 100, 5.72, 0.005, ' %');
  // tốc độ trên quỹ đạo tròn do người đứng yên tại chỗ đo: v = √(M/(r − 2M))
  kiem('Tốc độ ở ISCO (người đứng yên tại chỗ đo)', Math.sqrt(0.5 / (3 - 1)), 0.5, 1e-12, ' c');
  kiem('Đồng hồ trên ISCO chạy bằng', S.nhipDongHoQuyDao(3) * 100, 70.7, 0.05, ' %');
  // quỹ đạo tròn tồn tại khi L² ≥ 12M²: r = (L²/2M)(1 ± √(1 − 12M²/L²)); vòng không bền nằm giữa 1,5 rs và 3 rs
  const vongTron = (L, Mm = 0.5) => { const k = (L * L) / (2 * Mm), q = Math.sqrt(1 - (12 * Mm * Mm) / (L * L)); return [k * (1 - q), k * (1 + q)]; };
  const [rKhong, rBen] = vongTron(2.13);
  kiem('L = 2,13: vòng tròn không bền', rKhong, 1.90, 0.01, ' rs');
  kiem('L = 2,13: vòng tròn bền', rBen, 7.18, 0.01, ' rs');
  kiem('L rất lớn: vòng không bền tiến về mặt cầu photon', vongTron(1e4)[0], 1.5, 1e-3, ' rs');
  // đỉnh thế năng cao bằng năng lượng nghỉ (E = 1) khi r = 2 rs: quỹ đạo «vừa đủ liên kết»
  const Lb = 2 * 0.5 * 2; // L = 4M
  kiem('Quỹ đạo vừa đủ liên kết: đỉnh thế ở 2 rs khi L = 4M', vongTron(Lb)[0], 2, 1e-12, ' rs');
  kiem('… và đỉnh đó có E = 1', Math.sqrt((1 - 1 / 2) * (1 + (Lb * Lb) / 4)), 1, 1e-12);
  // mẫu «Rơi vào»: thả đứng yên ở 12 rs với L = 1,75: năng lượng vượt đỉnh thế nên rơi thẳng vào
  const L = 1.75, E = Math.sqrt((1 - 1 / 12) * (1 + (L * L) / 144));
  const [rDinh] = vongTron(L);
  kiemDung('Mẫu «Rơi vào»: E² lớn hơn đỉnh thế (1 − rs/r)(1 + L²/r²)', E * E > (1 - 1 / rDinh) * (1 + (L * L) / (rDinh * rDinh)));
  kiem('Một vòng ở ISCO (đồng hồ ở xa), đơn vị rs/c', 2 * Math.PI * Math.sqrt(27 / 0.5), 46.17, 0.01);
  kiem('… với Sgr A* (4,3 triệu M☉)', (46.17 * H.M_SGR_A * rsMT) / H.C / 60, 32.6, 0.2, ' phút');
  kiem('… với M87* (6,5 tỉ M☉)', (46.17 * 6.5e9 * rsMT) / H.C / 86400, 34, 0.5, ' ngày');
}

// =====================================================================
muc('Bài 14 · 1. Góc lệch sát mép Mặt Trời');
{
  const b = H.R_MAT_TROI_KM * 1000;
  kiem('Khoảng ngắm sát mép Mặt Trời, tính theo rs', b / rsMT, 235600, 100, ' rs');
  kiem('Einstein: 2rs/b', (2 * rsMT / b) / GC, 1.75, 0.005, '″');
  kiem('Newton: rs/b (một nửa)', (rsMT / b) / GC, 0.88, 0.005, '″');
  kiem('1,75″ đổi ra độ: khoảng 1/2000 độ', 1 / ((2 * rsMT / b) / DO), 2056, 5);
  kiem('Mô hình: b = 8 rs, tính số', S.gocLechAnhSang(8, { xa: 400, heSo: 0.02 }) / DO, 17.8, 0.1, '°');
  kiem('Mô hình: b = 8 rs, công thức 2rs/b', (2 / 8) / DO, 14.3, 0.05, '°');
  kiem('Mô hình: b = 8 rs, Newton 2·atan(rs/2b)', (2 * Math.atan(0.5 / 8)) / DO, 7.2, 0.05, '°');
  kiem('Mô hình: b = 14 rs, tính số', S.gocLechAnhSang(14, { xa: 400, heSo: 0.02 }) / DO, 9.2, 0.05, '°');
  kiem('Mô hình: b = 14 rs, công thức 2rs/b', (2 / 14) / DO, 8.2, 0.05, '°');
  // Đoàn nhật thực 1919 (Dyson, Eddington và Davidson 1920): Sobral 1,98″ ± 0,12″, Príncipe 1,61″ ± 0,30″
  kiemDung('Sobral 1,98 ± 0,12″ cách Einstein dưới 2 lần sai số, cách Newton hơn 9 lần', Math.abs(1.98 - 1.75) < 2 * 0.12 && (1.98 - 0.875) / 0.12 > 9);
  kiemDung('Príncipe 1,61 ± 0,30″ cách Einstein dưới 1 lần sai số, cách Newton hơn 2 lần', Math.abs(1.61 - 1.75) < 0.3 && (1.61 - 0.875) / 0.3 > 2);
}

muc('Bài 14 · 2. Trễ Shapiro');
{
  const t4 = (4 * H.GM_MAT_TROI) / H.C ** 3;
  kiem('4GM/c³ của Mặt Trời', t4 * 1e6, 19.7, 0.05, ' µs');
  const tre = (r1AU, r2AU) => t4 * Math.log((4 * r1AU * r2AU * H.AU_M ** 2) / (H.R_MAT_TROI_KM * 1000) ** 2);
  kiem('Trái Đất – Sao Hỏa, tín hiệu sượt mép Mặt Trời, đi và về', tre(1, 1.524) * 1e6, 247, 2, ' µs');
  kiem('Trái Đất – Sao Kim, đi và về', tre(1, 0.723) * 1e6, 233, 2, ' µs');
}

muc('Bài 14 · 3. Bán kính Einstein');
{
  const tE = (mMT, DL, DS) => Math.sqrt((2 * mMT * rsMT * (DS - DL)) / (DL * DS));
  const kpc = H.PARSEC_M * 1e3, Gpc = H.PARSEC_M * 1e9;
  kiem('Ngôi sao 1 M☉ ở 4 kpc, nguồn ở 8 kpc', tE(1, 4 * kpc, 8 * kpc) / GC * 1000, 1.0, 0.03, ' phần nghìn giây cung');
  kiem('Thiên hà 10¹² M☉ ở 1 Gpc, nguồn ở 2 Gpc (ước lượng)', tE(1e12, 1 * Gpc, 2 * Gpc) / GC, 2.0, 0.05, '″');
  // phương trình thấu kính điểm β = θ − θE²/θ: hai ảnh θ± = (β ± √(β² + 4θE²))/2
  const beta = 0.35, tp = (beta + Math.sqrt(beta * beta + 4)) / 2, tm = (beta - Math.sqrt(beta * beta + 4)) / 2;
  kiem('Nguồn lệch 0,35 θE: ảnh ngoài', tp, 1.19, 0.005, ' θE');
  kiem('Nguồn lệch 0,35 θE: ảnh trong (phía bên kia)', tm, -0.84, 0.005, ' θE');
  kiem('Thỏa phương trình thấu kính', tp - 1 / tp, beta, 1e-12);
}

muc('Bài 14 · 4. Mặt cầu photon và khoảng ngắm tới hạn');
{
  // thế hiệu dụng của ánh sáng (1 − rs/r)/r² cực đại tại r = 1,5 rs, giá trị 4/27
  const V = (r) => (1 - 1 / r) / (r * r);
  let rMax = 1, vMax = 0;
  for (let r = 1; r < 5; r += 1e-5) if (V(r) > vMax) { vMax = V(r); rMax = r; }
  kiem('Đỉnh thế của ánh sáng', rMax, S.R_PHOTON, 1e-4, ' rs');
  kiem('Giá trị đỉnh = 4/27', vMax, 4 / 27, 1e-9);
  kiem('Khoảng ngắm tới hạn 1/√(4/27) = 3√3/2', 1 / Math.sqrt(vMax), S.B_TOI_HAN, 1e-6, ' rs');
  kiem('3√3/2', S.B_TOI_HAN, 2.598, 0.0005, ' rs');
  kiem('Tiết diện bắt π·b_c² so với π·rs²', S.B_TOI_HAN ** 2, 6.75, 1e-12, ' lần');
  kiemDung('b = 2,58 rs: bị nuốt', S.gocLechAnhSang(2.58) === null);
  const q = S.gocLechAnhSang(2.62);
  kiem('b = 2,62 rs: lệch', q / DO, 252, 2, '°');
  const q1 = S.gocLechAnhSang(2.6005);
  kiemDung('b = 2,6005 rs: quấn hơn một vòng rồi thoát', q1 !== null && q1 > 2 * Math.PI);
}

// =====================================================================
muc('Bài 15 · 1. Bán kính Schwarzschild');
{
  kiem('Mặt Trời', rsMT / 1000, 2.95, 0.005, ' km');
  kiem('Trái Đất', (2 * H.GM_TRAI_DAT) / H.C ** 2 * 1000, 8.9, 0.05, ' mm');
  const rsSgr = H.M_SGR_A * rsMT;
  kiem('Sgr A* (4,3 triệu M☉)', rsSgr / 1e9, 12.7, 0.05, ' triệu km');
  kiem('… gấp bán kính Mặt Trời', rsSgr / 1000 / H.R_MAT_TROI_KM, 18, 0.5, ' lần');
  const rsM87 = 6.5e9 * rsMT;
  kiem('M87* (6,5 tỉ M☉)', rsM87 / H.AU_M, 128, 0.5, ' AU');
  kiem('… gấp bán kính quỹ đạo Sao Hải Vương (30,07 AU)', rsM87 / H.AU_M / 30.07, 4.27, 0.02, ' lần');
  kiem('10 M☉', 10 * rsMT / 1000, 29.5, 0.05, ' km');
  // tốc độ thoát kiểu Newton bằng c đúng tại r = 2GM/c²
  kiem('Newton: √(2GM/r) tại r = rs', Math.sqrt((2 * H.GM_MAT_TROI) / rsMT), H.C, 1e-3, ' m/s');
}

muc('Bài 15 · 2. Bóng lỗ đen');
{
  kiem('Đường kính bóng 2·b_c = 3√3 rs', 2 * S.B_TOI_HAN, 5.2, 0.005, ' rs');
  kiem('Nhìn từ 15,7 rs (góc «Cảnh quen thuộc»): bóng rộng', (2 * S.gocBong(15.7)) / DO, 18.4, 0.05, '°');
  kiem('Nếu không có thấu kính, chân trời ở 15,7 rs chỉ rộng', (2 * Math.asin(1 / 15.7)) / DO, 7.3, 0.05, '°');
  kiem('Từ mặt cầu photon: bóng chiếm nửa bầu trời', (2 * S.gocBong(1.5)) / DO, 180, 1e-6, '°');
  // vành photon: mỗi lần tia quấn thêm nửa vòng, dải khoảng ngắm hẹp đi e^π lần (Schwarzschild)
  const a1 = S.gocLechAnhSang(S.B_TOI_HAN + 1e-3, { heSo: 0.002, xa: 400 });
  const a2 = S.gocLechAnhSang(S.B_TOI_HAN + 1e-3 * Math.exp(-Math.PI), { heSo: 0.002, xa: 400 });
  kiem('Thu hẹp khoảng ngắm e^π lần thì tia quấn thêm nửa vòng', (a2 - a1) / Math.PI, 1, 0.03, ' (× π)');
  kiem('e^π', Math.exp(Math.PI), 23.1, 0.05);
}

muc('Bài 15 · 3. Đĩa bồi tụ: Doppler, dịch đỏ, nhiệt độ');
{
  const r = 3, Om = Math.sqrt(0.5 / r ** 3), ell = r / Math.sqrt(1 - 1 / r);
  kiem('Ω·ℓ của photon bay tiếp tuyến ở ISCO', Om * ell, 0.5, 1e-12);
  const g = (l) => Math.sqrt(1 - 1.5 / r) / (1 - Om * l);
  kiem('Phía khí lao tới: g', g(ell), 1.41, 0.005);
  kiem('Phía khí chạy ra xa: g', g(-ell), 0.47, 0.005);
  kiem('Ánh sáng phát vuông góc với chiều quay: g', g(0), 0.707, 0.0005);
  kiem('Độ sáng ∝ g⁴: phía tới', g(ell) ** 4, 4, 1e-9);
  kiem('Độ sáng ∝ g⁴: phía xa', g(-ell) ** 4, 0.049, 0.0005);
  kiem('Tỉ số độ sáng hai phía', (g(ell) / g(-ell)) ** 4, 81, 1e-9);
  // nhiệt độ đĩa mỏng T ∝ r^(-3/4)(1 − √(r_in/r))^(1/4): nóng nhất ở r = (49/36)·r_in
  const T = (x) => Math.pow(x / 3, -0.75) * Math.pow(Math.max(0, 1 - Math.sqrt(3 / x)), 0.25);
  let rT = 3, Tm = 0;
  for (let x = 3; x < 12; x += 1e-4) if (T(x) > Tm) { Tm = T(x); rT = x; }
  kiem('Đĩa nóng nhất ở', rT, (49 / 36) * 3, 1e-3, ' rs');
  kiem('Hằng số chuẩn hóa nhiệt độ trong shader (0,4879)', Tm, 0.4879, 2e-4);
}

muc('Bài 15 · 4. Ảnh của Event Horizon Telescope');
{
  const bong = (mMT, D) => (2 * S.B_TOI_HAN * mMT * rsMT) / D / UAS;
  const Mpc = H.MPC_M;
  kiem('M87*: bóng tính từ 6,5 tỉ M☉ ở 16,8 Mpc', bong(6.5e9, 16.8 * Mpc), 39.7, 0.2, ' µas');
  kiemDung('M87*: vành đo được 42 ± 3 µas lớn hơn bóng chưa tới 10%', 42 / bong(6.5e9, 16.8 * Mpc) < 1.1);
  const D = H.R0_NGAN_HA_NAS * H.NAS_M;
  kiem('Sgr A*: khoảng cách 26 700 năm ánh sáng', D / (H.PARSEC_M * 1e3), 8.19, 0.01, ' kpc');
  kiem('Sgr A*: bóng tính từ 4,3 triệu M☉', bong(H.M_SGR_A, D), 54, 0.3, ' µas');
  kiemDung('Sgr A*: vành đo được 51,8 ± 2,3 µas khớp trong vòng 5%', Math.abs(51.8 / bong(H.M_SGR_A, D) - 1) < 0.05);
  kiem('Độ phân giải cỡ bước sóng 1,3 mm chia đường kính Trái Đất', (1.3e-3 / (2 * H.R_TRAI_DAT_KM * 1000)) / UAS, 21, 0.3, ' µas');
  kiem('42 µas nhìn từ Trái Đất bằng một vật trên Mặt Trăng (384 400 km) cỡ', 42 * UAS * 3.844e8 * 100, 7.8, 0.1, ' cm');
}

muc('Bài 15 · 5. Lực kéo giãn ở chân trời (người cao 2 m)');
{
  const keo = (mMT) => { const rs = mMT * rsMT; return (H.C ** 2 * 2) / (rs * rs) / 9.81; };
  kiem('Lỗ đen 10 M☉', keo(10), 2.1e7, 0.05e7, ' g');
  kiem('Sgr A*', keo(H.M_SGR_A) * 1e4, 1.1, 0.05, ' ×10⁻⁴ g');
}

muc('Bài 15 · 6. Lỗ đen quay (Kerr): quỹ đạo tròn trong cùng (Bardeen, Press, Teukolsky 1972)');
{
  // r_isco/M = 3 + Z2 ∓ √((3 − Z1)(3 + Z1 + 2Z2)), a = J/(Mc) tính theo M; dấu trừ: cùng chiều quay
  const isco = (a, cung) => {
    const Z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
    const Z2 = Math.sqrt(3 * a * a + Z1 * Z1);
    return 3 + Z2 + (cung ? -1 : 1) * Math.sqrt((3 - Z1) * (3 + Z1 + 2 * Z2));
  };
  kiem('Không quay: 6M = 3 rs', isco(0, true) / 2, 3, 1e-9, ' rs');
  kiem('Quay tối đa, cùng chiều: M = 0,5 rs', isco(1, true) / 2, 0.5, 1e-6, ' rs');
  kiem('Quay tối đa, ngược chiều: 9M = 4,5 rs', isco(1, false) / 2, 4.5, 1e-6, ' rs');
  // năng lượng riêng ở ISCO: E = √(1 − 2/(3x)) với x = r/M (công thức đúng cho mọi a)
  const hieuSuat = (x) => 1 - Math.sqrt(1 - 2 / (3 * x));
  kiem('Hiệu suất khi không quay', hieuSuat(6) * 100, 5.72, 0.005, ' %');
  kiem('Hiệu suất khi quay tối đa, cùng chiều', hieuSuat(1) * 100, 42.3, 0.05, ' %');
  kiem('Hiệu suất khi quay tối đa, ngược chiều', hieuSuat(9) * 100, 3.8, 0.05, ' %');
}

muc('Bài 15 · 7. Khối lượng tính toán khi dựng hình');
{
  kiem('Điểm ảnh ở cửa sổ 1600 × 1000', 1600 * 1000 / 1e6, 1.6, 0, ' triệu');
  kiem('Số bước tối đa mỗi khung hình (300 bước mỗi điểm)', 1.6e6 * 300 / 1e6, 480, 0, ' triệu');
}

muc('Các con số phụ trong lời giảng');
{
  const tongHop = (4 * 1.00782503 - 4.00260325) / (4 * 1.00782503) * 100;   // khối lượng nguyên tử H-1, He-4 (u)
  kiem('Tổng hợp hydro thành heli giải phóng', tongHop, 0.71, 0.01, ' %');
  kiem('Hiệu suất đĩa (5,72%) gấp tổng hợp hydro', 5.72 / tongHop, 8.0, 0.1, ' lần');
  kiem('Tiến động S2 (12,1′) gấp Sao Thủy (0,1035″) mỗi vòng', (12.1 * 60) / 0.1035, 7000, 100, ' lần');
  kiem('Đồng hồ đứng yên ở 1,1 rs', S.nhipDongHo(1.1) * 100, 30.2, 0.05, ' %');
  kiem('Khối lượng Trái Đất / Mặt Trời', H.GM_TRAI_DAT / H.GM_MAT_TROI * 1e6, 3.0, 0.01, ' ×10⁻⁶');
  kiem('M87* nặng gấp Sgr A*', 6.5e9 / H.M_SGR_A, 1500, 20, ' lần');
  kiem('M87* xa gấp Sgr A*', (16.8 * H.MPC_M) / (H.R0_NGAN_HA_NAS * H.NAS_M), 2050, 10, ' lần');
  const sinT = (S.B_TOI_HAN / 15.7) * Math.sqrt(1 - 1 / 15.7);
  kiem('Ở 15,7 rs: sin θ của mép bóng', sinT, 0.160, 0.001);
  kiem('Ở 15,7 rs: θ', Math.asin(sinT) / DO, 9.2, 0.05, '°');
  kiem('Ở 1,5 rs: 1,732 × 0,577', (S.B_TOI_HAN / 1.5) * Math.sqrt(1 - 1 / 1.5), 1, 1e-9);
  kiem('Sát mép Mặt Trời: 2rs/R (rad)', (2 * rsMT) / (H.R_MAT_TROI_KM * 1000) * 1e6, 8.5, 0.05, ' ×10⁻⁶');
  kiem('Logarit trong trễ Shapiro (Sao Hỏa)', Math.log((4 * 1.524 * H.AU_M ** 2) / (H.R_MAT_TROI_KM * 1000) ** 2), 12.5, 0.1);
  kiem('Bóng rộng gấp chân trời', S.B_TOI_HAN, 2.6, 0.01, ' lần');
  kiem('Sao Thủy: a(1 − e²) / 10⁶ km', 57.909 * (1 - 0.2056 ** 2), 55.46, 0.05);
  kiem('Sao Thủy: 1 − e²', 1 - 0.2056 ** 2, 0.958, 0.001);
}

// =====================================================================
// Bài 15 · Bản 3: máy phát rơi (tiếng, màu), dò tia khi rê chuột, đích của các thử thách
// (src/vat-ly/may-phat-roi.js, src/vat-ly/do-tia-lo-den.js). Nạp động để không đụng phần đầu tệp.
{
  const MP = await import('../src/vat-ly/may-phat-roi.js');
  const DT = await import('../src/vat-ly/do-tia-lo-den.js');
  const EF = await import('../src/vat-ly/eddington-finkelstein.js');

  muc('Bài 15 · 8. Máy phát thả rơi từ đứng yên (cycloid, đơn vị rs = c = 1)');
  {
    kiem('Thả từ chân trời (R = 1): thời gian riêng tới kỳ dị = π/2', MP.roiTuR(1 + 1e-12).tauHet, Math.PI / 2, 1e-6, ' rs/c');
    // τ tới chân trời bằng tích phân trực tiếp ∫ dr / √(1/r − 1/R), đổi biến r = R − u² cho khỏi kỳ dị ở đầu
    const R = 6;
    let s = 0;
    const n = 200000, uMax = Math.sqrt(R - 1);
    for (let i = 0; i < n; i++) { const u = (i + 0.5) * (uMax / n), r = R - u * u; s += (2 * u * (uMax / n)) / Math.sqrt(1 / r - 1 / R); }
    kiem('R = 6: τ tới chân trời, cycloid so với tích phân số', MP.roiTuR(R).tauCT, s, 1e-4, ' rs/c');
    kiem('R = 6: τ tới chân trời', MP.roiTuR(R).tauCT, 22.38, 0.01, ' rs/c');
    // dt*/dτ: giới hạn R → ∞ phải trùng «giọt mưa» của Bài 16
    const r = 2.3, roiXa = MP.roiTuR(1e12);
    kiem('dt*/dτ khi R → ∞ trùng giọt mưa (r = 2,3)', roiXa.dtsDtau(r), EF.dtsDtau(r), 1e-6);
    // t*(η) so với nghiệm đóng của thời gian Schwarzschild (MTW 31.10, 2M = 1) cộng ln(r − 1)
    const roi = MP.roiTuR(R), q = Math.sqrt(R - 1);
    const tSch = (eta) => Math.log(Math.abs((q + Math.tan(eta / 2)) / (q - Math.tan(eta / 2)))) + q * (eta + (R / 2) * (eta + Math.sin(eta)));
    let lon = 0;
    for (const eta of [0.3, 0.9, 1.5, 0.98 * roi.etaCT]) {
      const tsDung = tSch(eta) + Math.log(roi.r(eta) - 1) - Math.log(R - 1);
      lon = Math.max(lon, Math.abs(roi.tsTaiEta(eta) - tsDung));
    }
    kiem('t*(η) dọc đường rơi khớp nghiệm đóng (sai lệch lớn nhất)', lon, 0, 1e-7, ' rs/c');
    kiem('t* liên tục qua chân trời (không vô hạn): t* tại chân trời', roi.tsTaiEta(roi.etaCT), roi.tsTaiEta(roi.etaCT), 0);
    kiemDung('t* tại chân trời hữu hạn', Number.isFinite(roi.tsTaiEta(roi.etaCT)) && roi.tsTaiEta(roi.etaCT) > 0);
  }

  muc('Bài 15 · 9. Tín hiệu từ máy phát tới người đứng yên');
  {
    const r0 = 15.7, R = 6;
    // Tia thẳng theo bán kính (Δ = 0): thời điểm nhận phải trùng công thức tia «đi ra» của Eddington–Finkelstein
    const L0 = MP.lichTinHieu({ R, r0, D: 0 });
    let lon = 0;
    for (const x of L0.xung) {
      const tsNhan = EF.tsTiaRa(r0, L0.roi.tsTaiEta(x.eta), x.r);
      const T = Math.sqrt(1 - 1 / r0) * (tsNhan - Math.log(r0 - 1) + Math.log(R - 1));
      lon = Math.max(lon, Math.abs(T - x.T) / T);
    }
    kiem('Δ = 0: thời điểm nhận khớp công thức tia đi ra (sai lệch tương đối lớn nhất)', lon, 0, 1e-9);
    kiem('Tiếng đầu tiên chỉ lệch vì dịch đỏ hấp dẫn: g = √(1 − 1/R)/√(1 − 1/r0)', L0.xung[0].g, Math.sqrt(1 - 1 / R) / Math.sqrt(1 - 1 / r0), 1e-12);
    // g giải tích so với g đo bằng nhịp: g = dτ_phát / dT_nhận, cho cả tia thẳng, tia lệch và tia vòng qua lỗ đen
    for (const D of [0, 1, 2.5]) {
      const roi = MP.roiTuR(5), rN = 12, nhip = Math.sqrt(1 - 1 / rN);
      const T = (e) => {
        const rE = roi.r(e), tia = MP.timTia(rN, rE, D), ts = roi.tsTaiEta(e);
        const tN = tia.nhanh === 1 ? ts + rN + Math.log(rN - 1) - rE - 2 * Math.log(rE - 1) + tia.tg : ts - Math.log(rE - 1) + tia.tg;
        return nhip * tN;
      };
      for (const eta of [0.5, 1.5, 0.99 * roi.etaCT]) {
        const h = 1e-5, rE = roi.r(eta);
        const gSo = (roi.tau(eta + h) - roi.tau(eta - h)) / (T(eta + h) - T(eta - h));
        const tia = MP.timTia(rN, rE, D);
        const Q = Math.sqrt(Math.max(0, 1 - ((1 - 1 / rE) * tia.b ** 2) / rE ** 2));
        const g = (1 - 1 / rE) / (nhip * (roi.E + (tia.nhanh === 1 ? 1 : -1) * Q * roi.s(rE)));
        kiemTiLe(`Δ = ${D} rad, r phát = ${rE.toFixed(3)}: g công thức = g đo bằng nhịp`, g, gSo, 1e-3);
        kiem(`… tia tìm được tới đúng góc Δ`, tia.phi, D, 1e-9, ' rad');
      }
    }
    // Lịch của thử thách (thả ở 4,64 rs, nhìn vuông góc từ 15,7 rs): tiếng thưa dần và trầm dần, rồi hết
    const L = MP.lichTinHieu({ R: 4.64, r0, D: Math.PI / 2 });
    let giam = true, thua = true;
    const kc = L.xung.slice(1).map((x, i) => x.T - L.xung[i].T);
    for (let i = 2; i < L.xung.length; i++) if (!(L.xung[i].g < L.xung[i - 1].g + 1e-3)) giam = false;
    // lúc đầu máy phát còn hơi tiến lại gần người nhận (nhìn vuông góc) nên tiếng hơi dày lên một chút; từ tiếng thứ 5 thì thưa dần
    for (let i = 4; i < kc.length; i++) if (!(kc[i] > kc[i - 1])) thua = false;
    kiemDung('Thả ở 4,64 rs: tần số các tiếng nhận được giảm dần', giam);
    kiemDung('… từ tiếng thứ 5, khoảng cách giữa các tiếng tăng dần (thưa dần)', thua);
    kiem('… khoảng cuối so với khoảng đầu', kc[kc.length - 1] / kc[0], 2.0, 0.1, ' lần');
    MP.datHeBuoc(0.3);
    const L3 = MP.lichTinHieu({ R: 4.64, r0, D: Math.PI / 2 });
    MP.datHeBuoc(1);
    kiem('… hội tụ: thu nhỏ bước tích phân 3 lần, thời điểm nhận đổi không quá', Math.max(...L3.xung.map((x, i) => Math.abs(x.T - L.xung[i].T))), 0, 2e-3, ' rs/c');
    kiem('… số tiếng bíp tới được (mỗi 1 rs/c, phát ở ngoài chân trời)', L.xung.length, 15, 0);
    kiemDung('… tiếng cuối trầm dưới 400 Hz', MP.TAN_SO_PHAT * L.xung[L.xung.length - 1].g < 400);
    kiemDung('… hình ảnh tắt hẳn (g < 10⁻⁶) sau một thời gian hữu hạn của người nhận', L.bang[L.bang.length - 1].g < 1e-6 && Number.isFinite(L.bang[L.bang.length - 1].T));
    kiem('… ánh sáng đầu tiên tới sau (đồng hồ người nhận)', L.xung[0].T, 17.6, 0.1, ' rs/c');
    kiem('Quy đổi tiếng: tần số phát', MP.TAN_SO_PHAT, 880, 0, ' Hz');
    kiem('Quy đổi tiếng: một tiếng bíp mỗi', MP.DTAU_PHAT, 1, 0, ' rs/c (đồng hồ máy phát)');
    kiem('Quy đổi thời gian: 1 giây nghe ứng với', MP.RS_MOI_GIAY, 5, 0, ' rs/c');
    kiem('… với Sgr A*, 5 rs/c bằng', (5 * H.M_SGR_A * rsMT) / H.C / 60, 3.5, 0.05, ' phút');
    kiem('Ánh sáng 440 nm ra khỏi vùng mắt thấy (780 nm) khi g dưới', 440 / 780, 0.564, 0.001);
  }

  muc('Bài 15 · 10. Đích của các thử thách');
  {
    // Bước 2: rơi tới chân trời sau 15 rs/c (± 0,75)
    const tim = (f, y, a, b) => { for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (f(m) < y) a = m; else b = m; } return (a + b) / 2; };
    const R15 = tim(MP.tauToiChanTroi, 15, 2, 10);
    kiem('Bước 2: thả ở R để tới chân trời sau 15 rs/c', R15, 4.64, 0.01, ' rs');
    kiem('… R nhỏ nhất còn đạt (14,25 rs/c)', tim(MP.tauToiChanTroi, 14.25, 2, 10), 4.49, 0.01, ' rs');
    kiem('… R lớn nhất còn đạt (15,75 rs/c)', tim(MP.tauToiChanTroi, 15.75, 2, 10), 4.79, 0.01, ' rs');
    kiemDung('… chỗ đặt sẵn (R = 6) không đạt sẵn', Math.abs(MP.tauToiChanTroi(6) - 15) > 0.75);
    // Bước 3: bóng chiếm 90° đúng ở r = 3 rs
    kiem('Bước 3: bóng rộng 90° khi đứng ở 3 rs', (2 * S.gocBong(3)) / DO, 90, 1e-9, '°');
    const bong = (r) => (2 * S.gocBong(r)) / DO;
    kiem('… 87° ở', tim((r) => -bong(r), -87, 1.6, 20), 3.11, 0.01, ' rs');
    kiem('… 93° ở', tim((r) => -bong(r), -93, 1.6, 20), 2.90, 0.01, ' rs');
    kiemDung('… các nút của bước (15,7 rs; 42 rs; 1,5 rs) đều không đạt sẵn', [15.7, 42, 1.5].every((r) => Math.abs(bong(r) - 90) > 3));
    // Bước 4: vành ánh sáng bị bẻ hơn 180° có thật và rộng vài điểm ảnh (nhìn từ 15,7 rs, 1000 điểm ảnh cao, góc nhìn 50°)
    const cam = [0, 15.7 * Math.sin(8.8 * DO), 15.7 * Math.cos(8.8 * DO)];
    const r0 = Math.hypot(...cam), er = cam.map((x) => x / r0), px = (2 * Math.tan(25 * DO)) / 1000;
    let soDiem = 0, bienBong = null;
    for (let k = 150; k < 230; k += 0.25) {
      const th = k * px, d = [-er[0] * Math.cos(th) + Math.sin(th), -er[1] * Math.cos(th), -er[2] * Math.cos(th)];
      const t = DT.doTia(cam, d, { dia: false });
      if (t.thoat && t.be > 180) soDiem += 0.25;
      if (t.thoat && bienBong === null) bienBong = th / DO;
    }
    kiemDung('Bước 4: có một vành tia bị bẻ hơn 180° ngay ngoài mép bóng', soDiem > 0);
    kiem('… vành ấy rộng (điểm ảnh, ở 15,7 rs)', soDiem, 4.5, 2.5, ' px');
    // dò tia CPU khớp lý thuyết: mép bóng nằm ở góc gocBong(15,7)
    kiem('Dò tia khi rê chuột: mép bóng ở góc (so với công thức 9,2°)', bienBong, S.gocBong(15.7) / DO, 0.05, '°');
    // Bước 6: trên đĩa có chỗ g = 1 (Doppler bù đúng dịch đỏ hấp dẫn): dọc vòng r = 6, g đi từ dưới 1 lên trên 1
    const can = Math.sqrt(1 - 1 / 15.7), r = 6, lMax = r / Math.sqrt(1 - 1 / r);
    kiemDung('Bước 6: ở r = 6 rs có tia với g > 1 và tia với g < 1', DT.gDia(r, lMax, can) > 1 && DT.gDia(r, -lMax, can) < 1);
    kiem('… g của khí ở r = 6 rs, ánh sáng phát vuông góc với chiều quay', DT.gDia(6, 0, can), Math.sqrt(1 - 1.5 / 6) / can, 1e-12);
    kiem('… tốc độ khí ở mép trong đo tại chỗ', Math.sqrt(0.5 / (3 - 1)), 0.5, 1e-12, ' c');
  }
}

// ----- Bài 14, Bản 3: bầu trời bị bẻ cong, thấu kính kéo được, thử thách -----
{
  const AS = await import('../src/vat-ly/anh-sang-cong.js');
  muc('Bài 14 · Bản 3: bảng góc lệch của bầu trời');
  const bang = AS.taoBangGocLech();
  for (const b of [2.62, 2.7, 3, 4, 6, 10, 30]) {
    const that = S.gocLechAnhSang(b, { xa: 600, heSo: 0.01 }), tra = AS.traGocLech(bang, b);
    kiem(`tra bảng tại b = ${b} rs: sai số tương đối`, Math.abs(tra - that) / that, 0, 0.01);
  }
  kiemDung('dưới b_c thì bị nuốt (bảng trả null)', AS.traGocLech(bang, 2.59) === null);
  // ngoài bảng (sát b_c) kéo dài với độ dốc 1 theo w: kiểm tại b ứng với w = 10
  { const b = AS.bTuW(10), that = S.gocLechAnhSang(b), tra = AS.traGocLech(bang, b); kiem('kéo dài ngoài bảng tại w = 10 (rad)', tra, that, 0.05); }
  // phần góc lệch còn lại từ chỗ người nhìn: so với tích phân số ∫ b/(b² + x²)^{3/2} dx
  for (const [x0, b] of [[-50, 5], [0, 5], [20, 3]]) {
    let tp = 0; const h = 0.01; for (let x = x0; x < 5e4; x += h * Math.max(1, Math.abs(x) / 20)) { const dx = h * Math.max(1, Math.abs(x) / 20); tp += (b / Math.pow(b * b + (x + dx / 2) ** 2, 1.5)) * dx; }
    kiem(`phần lệch còn lại, x0 = ${x0}, b = ${b}`, AS.phanLechConLai(x0, b), (tp * b) / 2, 2e-3);
  }

  muc('Bài 14 · Bản 3: thấu kính hấp dẫn kéo được (người quan sát ở góc nhìn «sau»)');
  const DL = Math.hypot(46, 6, 12), DLS = 30;
  const tE = AS.banKinhEinstein(1, DL, DLS);
  kiem('khoảng cách người quan sát – lỗ đen (đơn vị cảnh)', DL, 47.9, 0.05);
  kiem('bán kính Einstein nhìn từ đó, rs = 1 (độ; ô số liệu 7,3°)', tE / DO, 7.3, 0.05);
  kiem('bán kính Einstein theo công thức của bài θE = √(4GM·D_LS/(c²·D_L·D_S)) (độ)', Math.sqrt((2 * 1 * DLS) / (DL * (DL + DLS))) / DO, tE / DO, 1e-9);
  const [p1, p2] = AS.haiAnh(0.35);
  kiem('nguồn lệch 0,35 θE: hai ảnh (ảnh ngoài)', p1, 1.19, 0.005);
  kiem('nguồn lệch 0,35 θE: hai ảnh (ảnh trong)', p2, -0.84, 0.005);
  kiem('thẳng hàng (β = 0): hai ảnh nhập thành vòng bán kính θE', AS.haiAnh(0)[0], 1, 1e-12);
  kiemDung('độ phóng đại tổng tăng khi lại gần đường ngắm (cao độ tiếng ngân tăng)', AS.doPhongDai(0.06) > AS.doPhongDai(0.35) && AS.doPhongDai(0.35) > AS.doPhongDai(1.2));
  kiem('độ phóng đại tổng khi β = 0,35 θE', AS.doPhongDai(0.35), 3.0, 0.05);
  kiemDung('thử thách bước 5: lúc mới vào (β = 0,35) chưa đạt', 0.35 > 0.06);

  muc('Bài 14 · Bản 3: đích của thử thách kéo tia');
  const b20 = AS.bTheoGocLech(20 * DO), b90 = AS.bTheoGocLech(90 * DO);
  kiem('bước 2: b cho góc lệch 20° (gợi ý «khoảng 7,3»)', b20, 7.2866, 0.001, ' rs');
  kiem('bước 2: công thức 2rs/b tại đó (gợi ý «khoảng 15,7°»)', (2 / b20) / DO, 15.7, 0.05, '°');
  kiem('bước 2: Newton tại đó (gợi ý «khoảng 7,9°»)', (2 * Math.atan(0.5 / b20)) / DO, 7.9, 0.06, '°');
  kiem('bước 2: dung sai ±1° ↔ khoảng b (từ)', AS.bTheoGocLech(21 * DO), 7.0, 0.05, ' rs');
  kiem('bước 2: dung sai ±1° ↔ khoảng b (tới)', AS.bTheoGocLech(19 * DO), 7.6, 0.06, ' rs');
  for (const b of [8, 4, 14]) kiemDung(`bước 2: lúc mới vào và các nút (b = ${b}) chưa đạt`, Math.abs(S.gocLechAnhSang(b, { xa: 400, heSo: 0.02 }) / DO - 20) > 1);
  kiem('bước 6: b cho góc lệch 90° (gợi ý «khoảng 3,08»)', b90, 3.0838, 0.001, ' rs');
  kiem('bước 6: hơn ngưỡng b_c bao nhiêu (gợi ý «chừng 0,5»)', b90 - S.B_TOI_HAN, 0.49, 0.01, ' rs');
  kiem('bước 6: công thức trường yếu cho 90° ở b = 4/π (gợi ý «khoảng 1,3»)', 4 / Math.PI, 1.27, 0.005, ' rs');
  kiem('bước 6: dung sai ±4° ↔ độ rộng khoảng b', AS.bTheoGocLech(86 * DO) - AS.bTheoGocLech(94 * DO), 0.09, 0.02, ' rs');
  for (const b of [2.62, 2.6005]) { const a = S.gocLechAnhSang(b); kiemDung(`bước 6: lúc mới vào và nút (b = ${b}) chưa đạt`, a !== null && Math.abs(a / DO - 90) > 4); }
  kiemDung('bước 6: nút b = 2,58 (bị nuốt) chưa đạt', S.gocLechAnhSang(2.58) === null);
  kiemDung('bước 7: b = 2,21 và 2,59 rs đều bị nuốt (khoảng đạt có thật)', S.gocLechAnhSang(2.21) === null && S.gocLechAnhSang(2.59) === null);
  kiemDung('bước 7: lúc mới vào (b = 5) chưa đạt', S.gocLechAnhSang(5) !== null);
  kiem('âm thanh: cao độ 220·2^(α/90°) ở 90° (Hz)', 220 * Math.pow(2, 90 / 90), 440, 1e-9);
  // âm thanh bước 4: độ trễ của chớp trên tia đang xét (b = 8 rs, rs = 2 đơn vị) tại «máy thu» x = 24, so với đường thẳng
  {
    const rsW = 2, s = S.taoTia(-32 / rsW, 8, 0, 1, 0, 0);
    let tre = null;
    for (let i = 0; i < 5000 && tre === null; i++) {
      const ox = s.x, ot = s.t;
      S.buocTiaRK4(s, Math.max(0.012, 0.035 * Math.hypot(s.x, s.y)));
      if (s.x * rsW >= 24) { const u = (24 / rsW - ox) / (s.x - ox); tre = (ot + u * (s.t - ot)) * rsW - 56; }
    }
    kiem('bước 4: độ trễ ở máy thu (đơn vị thời gian của cảnh)', tre, 4.88, 0.05);
    kiemDung('bước 4: độ trễ dương và nhỏ hơn khoảng cách hai chớp (11): hai tiếng không lẫn với chớp sau', tre > 0 && tre < 11 / 2);
  }
}

// ----- Bài 13, Bản 3: tự phóng vật quanh lỗ đen, đích của thử thách, âm thanh (src/vat-ly/phong-quy-dao.js) -----
{
  const PQ = await import('../src/vat-ly/phong-quy-dao.js');
  muc('Bài 13 · Bản 3: vận tốc đo tại chỗ → E, L; phân loại quỹ đạo');
  // Phóng ngang ở điểm xa nhất của các mẫu dựng sẵn phải cho lại đúng E, L, điểm gần nhất và góc tiến động
  for (const [ten, p, e] of [['Sát lỗ đen', 14, 0.45], ['Hoa thị', 9.4, 0.6], ['Lượn sát', 7.26, 0.6]]) {
    const { L, E } = S.LEtuPE(p, e, 0.5), rA = (p * 0.5) / (1 - e);
    const k = PQ.phanLoai(rA, 0, PQ.vanTocNgangTuEL(rA, E, L));
    kiem(`${ten}: phóng ngang ở ${rA.toFixed(2)} rs → E`, k.E, E, 1e-9);
    kiem(`${ten}: … L`, k.L, L, 1e-9);
    kiem(`${ten}: … điểm gần nhất`, k.rP, (p * 0.5) / (1 + e), 1e-6, ' rs');
    kiem(`${ten}: … cận điểm xoay mỗi vòng`, k.td / DO, S.tienDongChinhXac(p, e) / DO, 0.01, '°');
  }
  kiem('Tốc độ quỹ đạo tròn ở 3 rs (người đứng yên tại chỗ đo)', PQ.vanTocTron(3), 0.5, 1e-12, ' c');
  kiem('Tốc độ thoát √(rs/r) cho đúng E = 1 (r = 12)', PQ.tuVanToc(12, PQ.vanTocThoat(12), 0).E, 1, 1e-12);
  kiemDung('Phóng đúng tốc độ tròn ở 8 rs: «gần tròn»', PQ.phanLoai(8, 0, PQ.vanTocTron(8)).loai === 'tron');
  kiemDung('Đứng yên ở 12 rs: rơi vào', PQ.phanLoai(12, 0, 0).loai === 'roi');
  kiemDung('Phóng ra bằng 1,01 lần tốc độ thoát ở 12 rs: bay ra xa mãi', PQ.phanLoai(12, 1.01 * PQ.vanTocThoat(12), 0).loai === 'thoat');
  {
    const L = 1.75, E = Math.sqrt((1 - 1 / 12) * (1 + (L * L) / 144));
    kiemDung('Mẫu «Rơi vào» (12 rs, L = 1,75) phóng lại bằng mũi tên: rơi vào', PQ.phanLoai(12, 0, PQ.vanTocNgangTuEL(12, E, L)).loai === 'roi');
  }

  muc('Bài 13 · Bản 3: đích của các thử thách (phóng từ chỗ mặc định, mũi tên nằm ngang)');
  const khoang = (r0, dk, lo, hi, n = 4000) => { let a = null, b = null; for (let i = 0; i <= n; i++) { const v = lo + ((hi - lo) * i) / n; if (dk(PQ.phanLoai(r0, 0, v))) { if (a === null) a = v; b = v; } } return [a, b]; };
  const rManh = (14 * 0.5) / 0.55, rHoa = (9.4 * 0.5) / 0.4;
  const [t1, t2] = khoang(rManh, (k) => k.loai === 'tron', 0.1, 0.4);
  kiem('bước 3: tốc độ tròn ở chỗ phóng mặc định 12,73 rs («khoảng 20,6% c»)', PQ.vanTocTron(rManh) * 100, 20.6, 0.05, ' %');
  kiemDung('bước 3: tốc độ tròn nằm trong khoảng đạt', t1 <= PQ.vanTocTron(rManh) && PQ.vanTocTron(rManh) <= t2);
  kiem('bước 3: bề rộng khoảng tốc độ đạt (so với tốc độ tròn)', (t2 - t1) / PQ.vanTocTron(rManh), 0.068, 0.01);
  { const { L, E } = S.LEtuPE(14, 0.45, 0.5); kiemDung('bước 3: phóng như mẫu (lúc mới vào bước) chưa đạt', PQ.phanLoai(rManh, 0, PQ.vanTocNgangTuEL(rManh, E, L)).loai !== 'tron'); }
  const dk90 = (k) => (k.loai === 'elip' || k.loai === 'tron') && Math.abs(k.td - PQ.TT_XOAY_90.dich) <= PQ.TT_XOAY_90.dungSai;
  const [h1, h2] = khoang(rHoa, dk90, 0.1, 0.5);
  kiem('bước 6: phóng ngang 19% c ở 11,75 rs: cận điểm xoay mỗi vòng («thử quanh 19% c»)', PQ.phanLoai(rHoa, 0, 0.19).td / DO, 90, 8, '°');
  kiem('bước 6: bề rộng khoảng tốc độ đạt (điểm phần trăm c)', (h2 - h1) * 100, 0.8, 0.3);
  { const { L, E } = S.LEtuPE(9.4, 0.6, 0.5); kiemDung('bước 6: mẫu «Hoa thị» lúc mới vào (253,6°) chưa đạt', !dk90(PQ.phanLoai(rHoa, 0, PQ.vanTocNgangTuEL(rHoa, E, L)))); }
  kiemDung('bước 8: hướng ra 10% c, ngang 8% c ở 12 rs («thử»): quay lại rơi vào', PQ.phanLoai(12, 0.1, 0.08).loai === 'roi');
  kiemDung('bước 8: hướng ra 10% c nhưng ngang 20% c: không rơi', PQ.phanLoai(12, 0.1, 0.2).loai !== 'roi');
  kiemDung('bước 8: mẫu «Rơi vào» lúc mới vào có thành phần hướng ra 0 < 5% c: chưa đạt', 0 < PQ.TT_ROI_RA.vr);
  {
    // xác nhận bằng chính tích phân đường trắc địa của cảnh: vật phóng ra 10% c, ngang 8% c đi qua chân trời
    const k = PQ.tuVanToc(12, 0.1, 0.08), s = { r: 12, phi: 0, vr: k.vrTau, t: 0, tau: 0 };
    let rMaxDat = 12;
    for (let i = 0; i < 400000 && s.r > 1.0004; i++) { S.buocHat(s, Math.min(0.05, Math.max(2e-5, 0.15 * (s.r - 1))), k.L, k.E, 0.5); rMaxDat = Math.max(rMaxDat, s.r); }
    kiemDung('bước 8: tích phân số: vật đi ra xa hơn 12 rs rồi quay lại qua chân trời', rMaxDat > 12.5 && s.r <= 1.0004);
  }

  muc('Bài 13 · Bản 3: âm thanh (cao độ theo tốc độ, quy đổi cho tai nghe)');
  kiem('ở điểm xa nhất: 200 Hz', PQ.tanSoTocDo(0.2, 0.2), 200, 1e-12, ' Hz');
  kiem('S2: tốc độ ở điểm gần nhất / điểm xa nhất = (1 + e)/(1 − e) («16,3 lần»)', PQ.tiSoTocDoKepler(0.8846), 16.33, 0.01);
  {
    const a = 1, e = 0.8846, rP = a * (1 - e), rA = a * (1 + e);
    kiem('… khớp công thức tốc độ của Newton v² ∝ 2/r − 1/a', Math.sqrt((2 / rP - 1 / a) / (2 / rA - 1 / a)), PQ.tiSoTocDoKepler(e), 1e-12);
  }
  kiem('S2: nốt ở điểm gần nhất', PQ.tanSoTocDo(PQ.tiSoTocDoKepler(0.8846), 1), 1068.7, 0.5, ' Hz');
  kiem('Sao Thủy: nốt ở điểm gần nhất', PQ.tanSoTocDo(PQ.tiSoTocDoKepler(0.2056), 1), 256.9, 0.5, ' Hz');
  {
    const { L, E } = S.LEtuPE(14, 0.45, 0.5), v = (r) => Math.sqrt(1 - (1 - 1 / r) / (E * E));
    kiem('mẫu «Sát lỗ đen»: tốc độ đo tại chỗ ở điểm gần nhất', v((14 * 0.5) / 1.45) * 100, 40.4, 0.05, ' % c');
    kiem('mẫu «Sát lỗ đen»: nốt ở điểm gần nhất', PQ.tanSoTocDo(v((14 * 0.5) / 1.45), v((14 * 0.5) / 0.55)), 342, 0.5, ' Hz');
  }
  kiem('tần số không vượt 1 600 Hz (vật lao vào sát chân trời)', PQ.tanSoTocDo(0.999, 0.01), 1600, 0);
}

tongKet();
