// Bộ kiểm số cho các con số trong lời giảng Bài 17 «Sóng hấp dẫn» và Bài 18 «Vũ trụ giãn nở».
// Mỗi con số trong lời giảng được tính lại ở đây từ hằng số (src/vat-ly/hang-so.js)
// và từ các hàm vật lý có sẵn (src/vat-ly/song-hap-dan.js, src/vat-ly/vu-tru-hoc.js).
// Chạy: node kiem-tra/kiem-song-va-gian-no.mjs

import { kiem, kiemTiLe, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { khoiLuongChirp, thoiGianConLai, tanSoSong, bienDo, T_MAT_TROI } from '../src/vat-ly/song-hap-dan.js';
import * as TC from '../src/vat-ly/tieng-chirp.js';   // Bài 17 Bản 3: mô hình chiếu chậm, tiếng chirp, thử thách
import { lichSuGianNo, tuoiPhangGiaiTich, GYR_TREN_H0, PLANCK } from '../src/vat-ly/vu-tru-hoc.js';
import * as H from '../src/vat-ly/hang-so.js';
import { BIP_GOC, BIP_CHU_KY, tanSoBip, chuKyBip, TAN_SO_H_ALPHA, THU_THACH, tDinhVuTruDong, aDinhVuTruDong, vLuiTheoC } from '../src/vat-ly/thu-thach-gian-no.js';
import { taoVuTru } from '../src/vat-ly/chan-troi-vu-tru.js';

const MSUN = H.M_MAT_TROI, C = H.C;
const L_MAT_TROI = 3.828e26;          // W, độ sáng danh định của Mặt Trời (IAU 2015)
const M_HIDRO = 1.6735575e-27;        // kg, khối lượng nguyên tử hiđrô
const D_PROTON = 2 * 0.8409e-15;      // m, đường kính proton (bán kính điện tích CODATA 2018)

// df/dt của sóng từ hai vật quay tròn (xấp xỉ tứ cực), Mc tính theo M☉
const dfdt = (f, mc) => (96 / 5) * Math.PI ** (8 / 3) * (mc * T_MAT_TROI) ** (5 / 3) * f ** (11 / 3);
const mcTuDfdt = (f, fd) => ((5 / 96) * Math.PI ** (-8 / 3) * f ** (-11 / 3) * fd) ** (3 / 5) / T_MAT_TROI;

// =====================================================================
muc('BÀI 17 · 1. Khối lượng chirp và tiếng «chirp» của GW150914');
kiem('Khối lượng chirp 36 + 29 M☉ (hệ của nguồn)', khoiLuongChirp(36, 29), 28.1, 0.05, ' M☉');
kiem('Khối lượng chirp 1,46 + 1,27 M☉ (GW170817)', khoiLuongChirp(1.46, 1.27), 1.19, 0.01, ' M☉');
kiem('Khối lượng chirp đo tại máy dò (dịch đỏ z = 0,09): 28,1 × 1,09', khoiLuongChirp(36, 29) * 1.09, 30.6, 0.2, ' M☉');
const MC = 30.4;                      // khối lượng chirp trong hệ máy dò dùng trong lời giảng
kiem('Thời gian từ 35 Hz tới lúc sáp nhập', thoiGianConLai(35, MC), 0.17, 0.01, ' s');
kiem('Từ 35 Hz lên 150 Hz', thoiGianConLai(35, MC) - thoiGianConLai(150, MC), 0.16, 0.01, ' s');
{
  let N = 0;
  for (let f = 35; f < 150; f += 0.01) N += (f / dfdt(f, MC)) * 0.01;
  kiem('Số chu kỳ sóng từ 35 tới 150 Hz («khoảng 8»)', N, 8.5, 0.5);
}
kiem('df/dt lúc 35 Hz', dfdt(35, MC), 79, 2, ' Hz/s');
kiem('df/dt lúc 100 Hz', dfdt(100, MC), 3700, 50, ' Hz/s');
kiem('Đo f và df/dt rồi suy ngược ra Mc', mcTuDfdt(35, dfdt(35, MC)), MC, 1e-9, ' M☉');
kiem('Công thức df/dt khớp với tanSoSong() (đạo hàm số)', (tanSoSong(0.05 - 1e-6, MC) - tanSoSong(0.05 + 1e-6, MC)) / 2e-6, dfdt(tanSoSong(0.05, MC), MC), 1e-3 * dfdt(tanSoSong(0.05, MC), MC), ' Hz/s');
kiem('Tần số tỉ lệ τ^(−3/8): còn 1/256 thời gian thì tần số gấp 8', tanSoSong(0.1 / 256, MC) / tanSoSong(0.1, MC), 8, 1e-9);

muc('BÀI 17 · 2. Năng lượng, công suất, khoảng cách của GW150914');
kiemTiLe('3 M☉ × c²', 3 * MSUN * C * C, 5.4e47, 0.01, ' J');
kiem('Công suất đỉnh 3,6 × 10⁴⁹ W tính ra M☉c² mỗi giây', 3.6e49 / (MSUN * C * C), 200, 3);
kiem('Công suất đỉnh gấp độ sáng Mặt Trời (bậc độ lớn)', Math.log10(3.6e49 / L_MAT_TROI), 23, 0.1);
kiemTiLe('Công suất trung bình nếu 3 M☉c² tỏa ra trong 0,2 s', (3 * MSUN * C * C) / 0.2, 2.7e48, 0.01, ' W');
kiem('410 Mpc đổi ra tỉ năm ánh sáng', (410 * H.MPC_M) / H.NAS_M / 1e9, 1.3, 0.05);
kiem('Biên độ tính được ở 410 Mpc, 150 Hz, hướng thuận lợi nhất', bienDo(150, MC, 410) * 1e21, 2.4, 0.05, ' ×10⁻²¹');
kiem('Biên độ giảm theo 1/d: xa gấp đôi thì h còn một nửa', bienDo(150, MC, 820) / bienDo(150, MC, 410), 0.5, 1e-12);
kiemTiLe('ΔL = h·L với h = 10⁻²¹, L = 4 km', 1e-21 * 4000, 4e-18, 1e-9, ' m');
kiem('Đường kính proton chia cho ΔL («vài trăm lần»)', D_PROTON / 4e-18, 420, 15);
kiem('Bước sóng ở 150 Hz', C / 150 / 1000, 2000, 5, ' km');
{
  const GM = H.G * 65 * MSUN, w = Math.PI * 150;          // tần số quỹ đạo = nửa tần số sóng
  kiem('Hai lỗ đen cách nhau lúc sóng 150 Hz (65 M☉)', Math.cbrt(GM / (w * w)) / 1000, 340, 10, ' km');
  kiem('Tốc độ tương đối lúc đó', Math.cbrt(GM * w) / C, 0.53, 0.02, ' c');
  kiem('Tổng bán kính Schwarzschild của hai lỗ đen', (2 * GM) / (C * C) / 1000, 192, 1, ' km');
  kiem('Tần số quỹ đạo lúc sóng 35 Hz', 35 / 2, 17.5, 0);
}

muc('BÀI 17 · 3. Tứ cực, Trái Đất – Mặt Trời, pulsar đôi');
{
  const m1 = H.GM_TRAI_DAT / H.G, m2 = MSUN, a = H.AU_M;
  const P = ((32 / 5) * H.G ** 4 / C ** 5) * (m1 * m2) ** 2 * (m1 + m2) / a ** 5;
  kiem('Công suất sóng hấp dẫn của Trái Đất quanh Mặt Trời', P, 196, 5, ' W');
  kiem('Tần số sóng của Trái Đất: hai chu kỳ mỗi năm', 2 / H.NAM_GIAY * 1e8, 6.34, 0.01, ' ×10⁻⁸ Hz');
}
{
  // PSR B1913+16: công thức Peters–Mathews cho quỹ đạo elip (Hartle ch. 16).
  const mp = 1.4398, mc = 1.3886, e = 0.6171334, Pb = 0.322997448918 * 86400;
  const fe = (1 + (73 / 24) * e * e + (37 / 96) * e ** 4) / (1 - e * e) ** 3.5;
  const dP = -(192 * Math.PI / 5) * ((2 * Math.PI * T_MAT_TROI) / Pb) ** (5 / 3) * fe * mp * mc * (mp + mc) ** (-1 / 3);
  kiem('Pulsar Hulse–Taylor: chu kỳ quỹ đạo', Pb / 3600, 7.75, 0.01, ' giờ');
  kiem('Pulsar Hulse–Taylor: dP/dt tiên đoán', dP * 1e12, -2.40, 0.02, ' ×10⁻¹²');
  kiem('… đổi ra micro giây mỗi năm', dP * H.NAM_GIAY * 1e6, -76, 1, ' µs/năm');
}

muc('BÀI 17 · 4. GW170817 và tương lai');
kiem('40 Mpc đổi ra triệu năm ánh sáng', (40 * H.MPC_M) / H.NAS_M / 1e6, 130, 1);
kiem('Chênh tốc độ tối đa: 1,7 s / 130 triệu năm (×10⁻¹⁶)', 1.7 / (130e6 * H.NAM_GIAY) * 1e16, 4.1, 0.1);
kiem('GW170817: thời gian từ 24 Hz tới lúc sáp nhập (Mc tại máy dò 1,188 M☉)', thoiGianConLai(24, 1.188), 100, 5, ' s');
kiem('Hai máy LIGO cách nhau 3 002 km: ánh sáng đi hết', (3002e3 / C) * 1000, 10, 0.05, ' ms');
kiem('Mảng định thời pulsar: chu kỳ 10 năm ứng với (nHz)', 1 / (10 * H.NAM_GIAY) * 1e9, 3.2, 0.05);

// ---------------------------------------------------------------------------------------------------------------
// Bài 17, Bản 3: mô hình chiếu chậm (src/vat-ly/tieng-chirp.js), quy đổi tiếng chirp, đích của các thử thách.
muc('BÀI 17 · 5. Mô hình chiếu chậm khớp với công thức thật');
{
  const ts = TC.thongSoMoHinh(36, 29);
  kiem('GW150914 trên hình: số lần chiếu chậm («73 lần» ở ô số liệu)', 1 / ts.sTL, 73.1, 0.2);
  kiem('14 giây trên hình bằng bao nhiêu giây thật', TC.T0 * ts.sTL, 0.19, 0.005, ' s');
  kiem('Tần số sóng thật lúc bắt đầu mô hình (τ = 14 s trên hình)', ts.fDau, 35, 0.5, ' Hz');
  kiem('Tần số lúc nhập của mô hình = 2,2 × f(ISCO) với 65 M☉ («khoảng 150 Hz»)', ts.fNhap, 149, 1, ' Hz');
  kiem('f(ISCO) của 65 M☉', TC.tanSoISCO(65), 67.7, 0.1, ' Hz');
  // Ở mọi thời điểm trước đoạn giữ tần số, tần số của mô hình đúng bằng công thức tanSoSong() với τ thật = sTL·τ.
  for (const tau of [14, 8, 3, 1]) {
    kiem(`τ = ${tau} s trên hình: tanSoThat() = tanSoSong(sTL·τ)`, TC.tanSoThat(tau, ts), tanSoSong(tau * ts.sTL, ts.mc), 1e-9, ' Hz');
  }
  // Tốc độ góc trên hình nhân 1/sTL đúng bằng tốc độ góc thật.
  const [, om] = TC.phaMoHinh(5, ts);
  kiem('ω trên hình / sTL = Ω thật (τ = 5 s trên hình)', om / ts.sTL, Math.PI * tanSoSong(5 * ts.sTL, ts.mc), 1e-6, ' rad/s');
  // Pha liền mạch ở chỗ nối (công thức → giữ tần số → rung tắt dần).
  kiem('Pha liền ở τ = τ_M', TC.phaMoHinh(ts.tauM + 1e-9, ts)[0] - TC.phaMoHinh(ts.tauM - 1e-9, ts)[0], 0, 1e-6);
  kiem('Pha liền lúc nhập (τ = 0)', TC.phaMoHinh(1e-9, ts)[0] - TC.phaMoHinh(-1e-9, ts)[0], 0, 1e-6);
  kiemDung('Trần 11 rad/s không bao giờ chặn (cả cặp bằng nhau nặng nhẹ khác nhau)', [[1.2, 1.2], [36, 29], [80, 80], [80, 1.2]].every(([a, b]) => TC.thongSoMoHinh(a, b).omMax < TC.OM_TRAN));
  const nt = TC.thongSoMoHinh(1.46, 1.27), ld10 = TC.thongSoMoHinh(10, 10);
  kiem('GW170817 trên hình: tần số lúc bắt đầu', nt.fDau, 828, 2, ' Hz');
  kiem('GW170817 trên hình: tần số lúc nhập', nt.fNhap, 3544, 5, ' Hz');
  kiem('10 + 10 M☉: tần số lúc nhập', ld10.fNhap, 484, 1, ' Hz');
}

muc('BÀI 17 · 6. Quy đổi tiếng chirp (hàm quyDoiTieng)');
{
  const ts = TC.thongSoMoHinh(36, 29);
  const q1 = TC.quyDoiTieng(14, ts), q2 = TC.quyDoiTieng(1, ts);
  kiem('Cao độ giữ đúng tần số thật lúc τ = 14 s (35 Hz)', q1.tanSo, ts.fDau, 1e-9, ' Hz');
  kiem('Cao độ τ = 1 s trên hình (13,7 ms thật)', q2.tanSo, tanSoSong(ts.sTL, ts.mc), 1e-9, ' Hz');
  kiem('Độ to tỉ lệ f^(2/3): tỉ số độ to giữa hai lúc', q2.doTo / q1.doTo, (q2.tanSo / q1.tanSo) ** (2 / 3), 1e-9);
  kiem('Độ to lúc nhập, nhìn dọc trục = độ to đỉnh', TC.quyDoiTieng(1e-6, ts).doTo, TC.DO_TO_DINH, 1e-9);
  kiem('Độ to lúc nhập, máy dò trong mặt phẳng quỹ đạo: một nửa', TC.quyDoiTieng(1e-6, ts, { huong: TC.heSoHuong(0).cong }).doTo, TC.DO_TO_DINH / 2, 1e-9);
  kiem('Sau khi nhập 0,42 s trên hình: độ to còn 1/e', TC.quyDoiTieng(-TC.RUNG_TAT, ts).doTo / TC.DO_TO_DINH, Math.exp(-1), 1e-9);
  kiem('Pha rung: cao độ 0,95 × tần số lúc nhập', TC.quyDoiTieng(-0.3, ts).tanSo, 0.95 * ts.fNhap, 1e-9, ' Hz');
  kiem('Nâng hai quãng tám (loa nhỏ): đúng 4 lần', TC.quyDoiTieng(3, ts, { heSoCao: 4 }).tanSo / TC.quyDoiTieng(3, ts).tanSo, 4, 1e-12);
  kiem('Tốc độ «nhanh như thật» trên thanh trượt (×1/sTL)', TC.tocDoNhuThat(ts), 73.1, 0.2);
  kiem('Ở tốc độ như thật, hết 14 giây trên hình mất (giây đồng hồ)', TC.T0 / TC.tocDoNhuThat(ts), 0.19, 0.005, ' s');
  // Chạy như thật, đo cao độ theo đồng hồ thật: phải trùng công thức (t_c − t)^(−3/8) của tín hiệu thật.
  {
    const v = TC.tocDoNhuThat(ts);
    let tau = TC.T0, saiMax = 0;
    for (let t = 0; tau > ts.tauM + 0.05; t += 1 / 60) {
      tau = TC.T0 - t * v;
      if (tau <= ts.tauM + 0.05) break;
      const conLaiThat = TC.T0 * ts.sTL - t;           // giây thật còn lại theo đồng hồ
      saiMax = Math.max(saiMax, Math.abs(TC.quyDoiTieng(tau, ts).tanSo / tanSoSong(conLaiThat, ts.mc) - 1));
    }
    kiem('Tốc độ như thật: cao độ từng khung hình khớp f(t_c − t) (sai lệch lớn nhất)', saiMax, 0, 1e-9);
  }
  kiemDung('Tần số tiếng luôn trong dải 20–12 000 Hz của khung âm thanh', [0.01, 1, 14, -3].every((t) => {
    const f = TC.quyDoiTieng(t, TC.thongSoMoHinh(1.2, 1.2), { heSoCao: 4 }).tanSo; return f >= 20 && f <= 12000;
  }));
  kiem('Hệ số hướng dọc trục: «+» = 1, «×» = 1 (phân cực tròn)', TC.heSoHuong(1).cong + TC.heSoHuong(1).cheo, 2, 1e-12);
  kiem('Hệ số hướng trong mặt phẳng quỹ đạo: «+» = 1/2, «×» = 0', TC.heSoHuong(0).cong + 10 * TC.heSoHuong(0).cheo, 0.5, 1e-12);
  kiem('Dọc trục mạnh gấp đôi trong mặt phẳng quỹ đạo', TC.heSoHuong(1).cong / TC.heSoHuong(0).cong, 2, 1e-12);
}

muc('BÀI 17 · 7. Đích của các thử thách');
{
  // Bước 1: máy dò lệch trục quay dưới 10°: biên độ «+» ít nhất 98,5% so với ngay trên trục.
  kiem('Bước 1: lệch trục 10° thì biên độ «+» còn', TC.heSoHuong(Math.cos(10 * H.DO)).cong, 0.985, 0.001);
  // Bước 3: kiểu «×», hai cánh tay xoay 45° đo được trọn biên độ; dung sai |sin 2θ| ≥ 0,99 ↔ θ = 45° ± 4°.
  kiem('Bước 3: xoay 45°, kiểu «×» thành chênh lệch trọn vẹn', TC.chenhLechCanhTay(0, 1, Math.PI / 4), 1, 1e-12);
  kiem('Bước 3: xoay 0°, kiểu «×» không làm lệch hai cánh tay', TC.chenhLechCanhTay(0, 1, 0), 0, 1e-12);
  kiemDung('Bước 3: dung sai ±4° nằm trong |sin 2θ| ≥ 0,99', Math.abs(Math.sin(2 * 41 * H.DO)) >= 0.99 && Math.abs(Math.sin(2 * 49 * H.DO)) >= 0.99 && Math.abs(Math.sin(2 * 36 * H.DO)) < 0.99);
  // Bước 4: hai lỗ đen quay 25 vòng mỗi giây ⇒ sóng 50 Hz; lúc ấy cách nhau khoảng 700 km, còn khoảng 73 ms.
  kiem('Bước 4: 25 vòng mỗi giây ⇒ tần số sóng', 2 * 25, 50, 0, ' Hz');
  kiem('Bước 4: khoảng cách hai lỗ đen lúc sóng 50 Hz (65 M☉)', TC.khoangCachKm(50, 65), 704, 2, ' km');
  kiem('Bước 4: thời gian còn lại lúc sóng 50 Hz (Mc = 28,1 M☉)', thoiGianConLai(50, khoiLuongChirp(36, 29)) * 1000, 73, 1, ' ms');
  kiemDung('Bước 4: 50 Hz nằm trong dải mô hình GW150914 (35–149 Hz)', TC.thongSoMoHinh(36, 29).fDau < 50 && TC.thongSoMoHinh(36, 29).fNhap > 50);
  // Bước 5: tần số lúc nhập 250 Hz ± 10 Hz ⇔ tổng khối lượng 38,7 M☉ (37,2–40,3).
  kiem('Bước 5: tổng khối lượng cho tần số lúc nhập 250 Hz', TC.tongKhoiLuongChoTanSoNhap(250), 38.7, 0.05, ' M☉');
  kiem('Bước 5: kiểm lại bằng mô hình (19,35 + 19,35 M☉)', TC.thongSoMoHinh(19.35, 19.35).fNhap, 250, 0.1, ' Hz');
  kiem('Bước 5: tần số lúc nhập không phụ thuộc tỉ lệ hai khối lượng (30 + 8,7 M☉)', TC.thongSoMoHinh(30, 8.7).fNhap, 250, 0.1, ' Hz');
  kiem('Bước 5: biên dưới của dung sai (260 Hz)', TC.tongKhoiLuongChoTanSoNhap(260), 37.2, 0.05, ' M☉');
  kiem('Bước 5: biên trên của dung sai (240 Hz)', TC.tongKhoiLuongChoTanSoNhap(240), 40.3, 0.05, ' M☉');
  kiemDung('Bước 5: cặp sẵn có của bài (GW150914, GW170817, 10 + 10) không trúng đích', [[36, 29], [1.46, 1.27], [10, 10]].every(([a, b]) => Math.abs(TC.thongSoMoHinh(a, b).fNhap - 250) > 10));
  // Bước 6: dừng đúng lúc sóng 100 Hz (± 4 Hz): còn khoảng 12 ms.
  kiem('Bước 6: thời gian còn lại lúc 100 Hz (Mc = 28,1 M☉)', thoiGianConLai(100, khoiLuongChirp(36, 29)) * 1000, 11.6, 0.1, ' ms');
  kiem('Bước 6: khoảng cách hai lỗ đen lúc 100 Hz', TC.khoangCachKm(100, 65), 444, 2, ' km');
  {
    const ts = TC.thongSoMoHinh(36, 29);
    // trong chiếu chậm ×1, cửa sổ 96–104 Hz kéo dài bao lâu trên hình (phải ngắn hơn 0,6 s giữ của thử thách,
    // để không thể đạt khi chỉ để mô hình tự chạy)
    const tauF = (f) => thoiGianConLai(f, ts.mc) / ts.sTL;
    kiemDung('Bước 6: chạy tự do không đạt được (cửa sổ 96–104 Hz ngắn hơn 0,6 s trên hình)', tauF(96) - tauF(104) < 0.6);
  }
}

// =====================================================================
muc('BÀI 18 · 1. Định luật Hubble–Lemaître và mật độ tới hạn');
const H0 = 67.4;
const H0_SI = (H0 * 1000) / H.MPC_M;
kiem('Thiên hà ở 100 Mpc lùi xa', H0 * 100, 6740, 1e-9, ' km/s');
kiem('… dịch chuyển đỏ z ≈ v/c', (H0 * 100) / 299792.458, 0.0225, 0.0002);
kiem('1/H0', GYR_TREN_H0 / H0, 14.5, 0.01, ' tỉ năm');
kiem('Khoảng cách Hubble c/H0', 299792.458 / H0, 4448, 1, ' Mpc');
kiem('… đổi ra tỉ năm ánh sáng', ((299792.458 / H0) * H.MPC_M) / H.NAS_M / 1e9, 14.5, 0.01);
const RHO_C = (3 * H0_SI * H0_SI) / (8 * Math.PI * H.G);
kiem('Mật độ tới hạn ρc = 3H0²/(8πG) (×10⁻²⁷ kg/m³)', RHO_C * 1e27, 8.5, 0.05);
kiem('… tính ra số nguyên tử hiđrô mỗi mét khối', RHO_C / M_HIDRO, 5.1, 0.05);
kiem('Vật chất thường Ωb = 0,0224/h² (Planck)', 0.0224 / 0.674 ** 2, 0.049, 0.001);
kiem('Vật chất tối Ωm − Ωb', 0.315 - 0.0224 / 0.674 ** 2, 0.266, 0.002);
kiem('Giãn nở ở khoảng cách 1 AU (nếu Hệ Mặt Trời giãn theo)', H0 * (H.AU_M / H.MPC_M) * H.NAM_GIAY * 1000, 10.3, 0.1, ' m/năm');

muc('BÀI 18 · 2. Lịch sử giãn nở ΛCDM (Planck 2018)');
const LS = lichSuGianNo(PLANCK);
const tTaiA = (ls, aa) => {
  const b = ls.bang;
  for (let i = 1; i < b.length; i++) if (b[i].a >= aa) { const u = (aa - b[i - 1].a) / (b[i].a - b[i - 1].a); return b[i - 1].t + u * (b[i].t - b[i - 1].t) + ls.tuoi; }
  return NaN;
};
kiem('Tuổi vũ trụ (tích phân số)', LS.tuoi, 13.8, 0.02, ' tỉ năm');
kiem('Tuổi vũ trụ: công thức đóng (bỏ bức xạ)', tuoiPhangGiaiTich(67.4, 0.315), 13.8, 0.01, ' tỉ năm');
kiem('Tuổi vũ trụ × H0 (gần bằng 1 là trùng hợp)', LS.tuoi / (GYR_TREN_H0 / H0), 0.95, 0.005);
const aEq = PLANCK.Or / PLANCK.Om;
kiem('Bức xạ bằng vật chất: z', 1 / aEq - 1, 3400, 50);
kiem('… lúc vũ trụ bao nhiêu tuổi (nghìn năm)', tTaiA(LS, aEq) * 1e6, 50, 3);
const aMLam = Math.cbrt(PLANCK.Om / PLANCK.OL);
kiem('Vật chất bằng năng lượng tối: a', aMLam, 0.77, 0.005);
kiem('… z', 1 / aMLam - 1, 0.30, 0.01);
kiem('… cách nay (tỉ năm)', LS.tuoi - tTaiA(LS, aMLam), 3.5, 0.05);
const aGT = Math.cbrt(PLANCK.Om / (2 * PLANCK.OL));
kiem('Bắt đầu giãn nhanh dần: a = (Ωm/2ΩΛ)^(1/3)', aGT, 0.613, 0.001);
kiem('Hàm thư viện cho cùng a', LS.aTangToc, aGT, 1e-12);
kiem('… z', 1 / aGT - 1, 0.63, 0.005);
kiem('… lúc vũ trụ bao nhiêu tuổi', tTaiA(LS, aGT), 7.7, 0.05, ' tỉ năm');
kiem('… cách nay', LS.tuoi - tTaiA(LS, aGT), 6.1, 0.05, ' tỉ năm');
{
  // ä đổi dấu đúng tại aGT: kiểm bằng sai phân của bảng a(t)
  const t = tTaiA(LS, aGT) - LS.tuoi, d = 0.3;
  const gia = (tt) => (LS.aTai(tt + d) - 2 * LS.aTai(tt) + LS.aTai(tt - d)) / (d * d);
  kiemDung('ä < 0 trước lúc đó, ä > 0 sau lúc đó', gia(t - 1.5) < 0 && gia(t + 1.5) > 0);
}
kiem('a = 0,5 (z = 1): vũ trụ bao nhiêu tuổi', tTaiA(LS, 0.5), 5.8, 0.05, ' tỉ năm');
kiem('a = 0,25 (z = 3): vũ trụ bao nhiêu tuổi', tTaiA(LS, 0.25), 2.15, 0.05, ' tỉ năm');
kiem('Bức xạ nền phát ra (z = 1090): nhiệt độ lúc đó', 2.725 * 1091, 2970, 10, ' K');
kiem('… vũ trụ bao nhiêu tuổi (nghìn năm)', tTaiA(LS, 1 / 1091) * 1e6, 375, 10);
{
  // mặt cầu Hubble hôm nay: khoảng cách đồng chuyển động bằng c/H0
  let D = 0, a = 1;
  const da = 1e-5;
  while (D < 1) { const am = a - da / 2; D += da / (am * am * Math.sqrt(PLANCK.Or / am ** 4 + PLANCK.Om / am ** 3 + PLANCK.OL)); a -= da; }
  kiem('Thiên hà đang lùi nhanh đúng bằng c hôm nay có z', 1 / a - 1, 1.5, 0.03);
}

muc('BÀI 18 · 3. Các kiểu vũ trụ khác');
const EDS = lichSuGianNo({ H0, Om: 1, OL: 0, Or: 0 });
kiem('Chỉ có vật chất: tuổi 2/(3H0)', EDS.tuoi, 9.7, 0.03, ' tỉ năm');
const DONG = lichSuGianNo({ H0, Om: 2.5, OL: 0, Or: PLANCK.Or }, { tSau: 200 });
kiemDung('Ωm = 2,5: co sập lại', DONG.coLai);
kiem('Ωm = 2,5: kích thước lớn nhất Ωm/(Ωm − 1)', Math.max(...DONG.as), 2.5 / 1.5, 0.003);
kiem('Ωm = 2,5: tuổi hôm nay', DONG.tuoi, 7.8, 0.05, ' tỉ năm');
kiem('Ωm = 2,5: co sập sau hôm nay', DONG.tCuoi, 54, 0.5, ' tỉ năm');
kiem('Ωm = 2,5: tổng đời, so với nghiệm giải tích πΩm/(H0(Ωm−1)^1,5)', DONG.tuoi + DONG.tCuoi, (Math.PI * 2.5) / 1.5 ** 1.5 * (GYR_TREN_H0 / H0), 0.05, ' tỉ năm');
const RONG = lichSuGianNo({ H0, Om: 0.05, OL: 0, Or: PLANCK.Or });
kiem('Gần như trống (Ωm = 0,05): tuổi', RONG.tuoi, 13.5, 0.05, ' tỉ năm');
kiem('Trống hoàn toàn: tuổi = 1/H0', GYR_TREN_H0 / H0, 14.5, 0.01, ' tỉ năm');
kiem('Căng thẳng Hubble: 73 so với 67,4', (73 - 67.4) / 67.4 * 100, 8.3, 0.05, ' %');

muc('BÀI 18 · 4. Bản 3: thử thách và tiếng «bíp» (src/vat-ly/thu-thach-gian-no.js)');
{
  const V = taoVuTru(PLANCK);
  const cH0 = GYR_TREN_H0 / H0;                                         // tỉ năm ánh sáng
  // Thử thách 1: lùi 0,5 c hôm nay
  kiem('Thử thách 1: d = 0,5 c/H0 (gợi ý: 7,3 tỉ năm ánh sáng)', THU_THACH.nuaC.v * cH0, 7.25, 0.05, ' tỉ năm ánh sáng');
  kiem('… tính bằng Mpc (gợi ý: khoảng 2 220)', THU_THACH.nuaC.v * C / 1000 / H0, 2224, 5, ' Mpc');
  kiemDung('… thiên hà mẫu ban đầu (3,33 tỉ năm ánh sáng, 0,23 c) chưa đạt khi vào bước', Math.abs(3.33 / cH0 - THU_THACH.nuaC.v) > THU_THACH.nuaC.sai);
  kiem('… dung sai ± 0,03 c ứng với ± 0,44 tỉ năm ánh sáng', THU_THACH.nuaC.sai * cH0, 0.44, 0.01, ' tỉ năm ánh sáng');
  // Thử thách 3: z = 2 → a = 1/3
  const a3 = 1 / (1 + THU_THACH.z2.z);
  kiem('Thử thách 3: z = 2 ứng với a = 1/3', a3, 1 / 3, 1e-12);
  kiem('… lúc vũ trụ (gợi ý: khoảng 3,3 tỉ năm tuổi)', V.tTai(a3), 3.27, 0.05, ' tỉ năm');
  kiemDung('… lúc vào bước (a = 0,5, z = 1) chưa đạt', Math.abs(1 - THU_THACH.z2.z) > THU_THACH.z2.sai);
  kiemDung('… nút «a = 0,25» (z = 3) không làm đạt', Math.abs(3 - THU_THACH.z2.z) > THU_THACH.z2.sai);
  // Thử thách 4: vũ trụ Ωm = 2,5 ngừng giãn
  const DONG4 = lichSuGianNo({ H0, Om: 2.5, OL: 0, Or: PLANCK.Or }, { tSau: 200 });
  let iMax = 0;
  DONG4.as.forEach((a, i) => { if (a > DONG4.as[iMax]) iMax = i; });
  kiem('Thử thách 4: lúc lớn nhất, công thức πΩm/(2H0(Ωm−1)^1,5) (gợi ý: khoảng 31 tỉ năm tuổi)', tDinhVuTruDong(H0, 2.5), 31, 0.1, ' tỉ năm');
  kiem('… khớp tích phân số của lichSuGianNo', DONG4.ts[iMax] + DONG4.tuoi, tDinhVuTruDong(H0, 2.5), 0.1, ' tỉ năm');
  kiem('… kích thước lớn nhất (gợi ý: 1,67 lần hôm nay)', aDinhVuTruDong(2.5), 1.67, 0.005);
  const Hsau = (dt) => { const t = DONG4.ts[iMax] + dt, e = 0.01; return ((DONG4.aTai(t + e) - DONG4.aTai(t - e)) / (2 * e) / DONG4.aTai(t)) * GYR_TREN_H0; };
  kiemDung('… |H| < 3 km/s/Mpc trong một khoảng rộng hơn ± 1 tỉ năm (kéo tay làm được)', Math.abs(Hsau(1)) < THU_THACH.dinh.H && Math.abs(Hsau(-1)) < THU_THACH.dinh.H);
  kiemDung('… hôm nay của vũ trụ ấy (H = 67,4) chưa đạt', H0 > THU_THACH.dinh.H);
  // Thử thách 5: thiên hà mẫu ban đầu (χ = 3,33 tỉ năm ánh sáng) lùi đúng bằng c
  let lo = 1, hi = 30;
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (vLuiTheoC(PLANCK, 3.33, m) < 1) lo = m; else hi = m; }
  kiem('Thử thách 5: thiên hà mẫu 3,33 tỉ năm ánh sáng lùi bằng c khi (gợi ý: khoảng 42 tỉ năm tuổi)', V.tTai(lo), 41.7, 0.4, ' tỉ năm');
  kiemDung('… trước giới hạn của đồng hồ vũ trụ (13,8 + 45 tỉ năm)', V.tTai(lo) < 13.79 + 45);
  kiem('… v/c hôm nay của thiên hà mẫu (chưa đạt khi vào bước)', vLuiTheoC(PLANCK, 3.33, 1), 0.23, 0.005);
  kiem('… vLuiTheoC khớp định luật Hubble hôm nay: χ/(c/H0)', vLuiTheoC(PLANCK, 3.33, 1), 3.33 / cH0, 1e-4);
  kiem('Mặt cầu Hubble về lâu dài dừng ở c/(H0√ΩΛ) (lời giảng bước 8: 17,5)', cH0 / Math.sqrt(PLANCK.OL), 17.5, 0.05, ' tỉ năm ánh sáng');
  kiem('… 30 tỉ năm nữa c/H đã gần như tới đó', 1 / V.H(V.aTuT(13.79 + 30)), 17.5, 0.15, ' tỉ năm ánh sáng');
  // Tiếng bíp
  kiem('Tần số vạch Hα 656,28 nm (lời giảng: 4,57 × 10¹⁴ Hz)', TAN_SO_H_ALPHA / 1e14, 4.57, 0.005, ' × 10¹⁴ Hz');
  kiem('Bíp gốc', BIP_GOC, 880, 0, ' Hz');
  kiem('z = 1: trầm đúng một quãng tám', tanSoBip(1), 440, 1e-9, ' Hz');
  kiem('z = 0,25 (thiên hà mẫu hôm nay): 880/1,25', tanSoBip(0.25), 704, 1e-9, ' Hz');
  kiem('z = 1: nhịp thưa gấp đôi', chuKyBip(1) / BIP_CHU_KY, 2, 1e-12);
  // z của ánh sáng từ thiên hà mẫu (χ = 3,33 tỉ năm ánh sáng) tới nhà hôm nay
  kiem('z của thiên hà mẫu hôm nay (khoảng 0,25)', V.zTaiChi(3.33), 0.25, 0.02);
}

tongKet();
