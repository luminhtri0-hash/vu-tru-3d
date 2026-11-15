// Bộ kiểm số cho Bài 12 «Độ cong thật và phương trình Einstein».
// Chạy: node kiem-tra/kiem-thuy-trieu.mjs
import { kiem, kiemTiLe, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { C, G, GM_TRAI_DAT, GM_MAT_TROI, M_SGR_A, R_TRAI_DAT_KM } from '../src/vat-ly/hang-so.js';
import {
  GM_MAT_TRANG, D_MAT_TRANG, R_TRAM_ISS, thuyTrieu, keoMoiMet, banKinhSchwarzschild, chenhTaiChanTroi, trieuCanBang,
  tenxoNgoai, tenxoTrongVatChat, vet, triRieng3, giaToc, buocVerlet, khoiGiaToc, hiepPhuong, det3, diemCau, doVddV,
} from '../src/vat-ly/thuy-trieu.js';
import {
  truongCauDac, giaTocT, vddvLucTha, moPhongTha, W2_KHOI, R_KHOI, RC, GM_HANH_TINH, R_HANH_TINH, R_THA_MAC_DINH, D_HINH,
  TT_TRUC_DOC, TT_THE_TICH, TT_TRIEU, TT_KEO_GAP, tiSoKeo, dinhBuou, tanSoTruc, tiengSong,
} from '../src/vat-ly/dam-hat-roi.js';

const RE = R_TRAI_DAT_KM * 1000;

muc('1. Con số ở bước 7 (tính lại từ hằng số)');
kiem('thủy triều Mặt Trăng trên Trái Đất 2GM·R/d³ (×10⁻⁶ m/s²)', thuyTrieu(GM_MAT_TRANG, RE, D_MAT_TRANG) * 1e6, 1.1, 0.005);
kiem('độ kéo trên Trạm Vũ trụ Quốc tế 2GM/r³, r = 6 771 km (×10⁻⁶ m/s² mỗi mét)', keoMoiMet(GM_TRAI_DAT, R_TRAM_ISS) * 1e6, 2.6, 0.05);
const bh = chenhTaiChanTroi(10, 2);
kiem('lỗ đen 10 M☉: bán kính Schwarzschild (km)', bh.rs / 1000, 29.5, 0.05);
kiem('lỗ đen 10 M☉: chênh đầu–chân người 2 m tại chân trời (×10⁸ m/s²)', bh.keo / 1e8, 2.06, 0.01);
kiemTiLe('2GM/r³ tại r = rs bằng c²/rs² (10 M☉)', bh.keo, bh.kiem, 1e-12);
const sgr = chenhTaiChanTroi(M_SGR_A, 2);
kiem('Sgr A* (4,3 triệu M☉): bán kính Schwarzschild (×10⁷ km)', sgr.rs / 1e3 / 1e7, 1.27, 0.005);
kiem('Sgr A*: chênh đầu–chân người 2 m tại chân trời (×10⁻³ m/s²)', sgr.keo * 1e3, 1.1, 0.05);
kiemTiLe('2GM/r³ tại r = rs bằng c²/rs² (Sgr A*)', sgr.keo, sgr.kiem, 1e-12);
kiem('thủy triều cân bằng: đỉnh bướu (m)', trieuCanBang(0), 0.357, 0.001);
kiem('thủy triều cân bằng: chênh đỉnh bướu và chỗ thấp nhất (m), «khoảng nửa mét»', trieuCanBang(0) - trieuCanBang(Math.PI / 2), 0.535, 0.002);
kiem('mô hình phóng đại lớp nước (triệu lần): 0,12·R so với đỉnh bướu thật', (0.12 * RE) / trieuCanBang(0) / 1e6, 2.1, 0.05);
kiem('Mặt Trăng trên hình kéo lại gần (lần): 60,3 R thật so với 10/2,4 R', (D_MAT_TRANG / RE) / (10 / 2.4), 14.5, 0.1);
kiem('chu kỳ hai lần triều lên (giờ): nửa của 24 giờ 50 phút', 24.84 / 2, 12.42, 0.01);

{
  // bước 2: hai giọt nước cách 1 m theo phương thẳng đứng trên trạm, sau 5 phút: ξ = cosh(√k·t)
  const k = keoMoiMet(GM_TRAI_DAT, R_TRAM_ISS);
  kiem('trạm vũ trụ: sau 5 phút hai giọt cách 1 m giãn thêm (cm), «thấy rõ»', (Math.cosh(Math.sqrt(k) * 300) - 1) * 100, 12, 1);
}

muc('2. Tenxơ thủy triều ngoài vật chất: tổng ba trị riêng bằng 0, dạng (2; −1; −1)·GM/r³');
for (const [x, y, z] of [[1, 0, 0], [3, 4, 12], [-2, 5, 1.5]]) {
  const T = tenxoNgoai(1, x, y, z), r = Math.hypot(x, y, z), k = 1 / r ** 3;
  const { gt } = triRieng3(T.flat());
  const s = [...gt].sort((a, b) => a - b);
  kiem(`(${x}; ${y}; ${z}): vết / (GM/r³)`, vet(T) / k, 0, 1e-12);
  kiem(`(${x}; ${y}; ${z}): trị riêng lớn nhất / (GM/r³)`, s[2] / k, 2, 1e-10);
  kiem(`(${x}; ${y}; ${z}): hai trị riêng còn lại / (GM/r³)`, (s[0] + s[1]) / (2 * k), -1, 1e-10);
}
{
  const rho = 5500;
  kiemTiLe('trong vật chất đồng đều: vết = −4πGρ', vet(tenxoTrongVatChat(rho)), -4 * Math.PI * G * rho, 1e-12);
}

muc('3. Mô phỏng đám hạt nhỏ: V̈/V lúc thả');
{
  const GM = 30, r0 = 11, k = GM / r0 ** 3;
  const o = doVddV({ loai: 'ngoai', GM }, [r0, 0, 0], 0.05, { t1: 0.6 });
  kiem('ngoài vật chất: (V̈/V)/(GM/r³) ≈ 0', o.vddv / k, 0, 1e-3);
  const w2 = (2 * Math.PI / 16) ** 2;               // = 4πGρ/3 trong cảnh
  const i = doVddV({ loai: 'trong', w2 }, [5.2, 0, 0], 1.1, { t1: 0.4 });
  kiemTiLe('trong vật chất đồng đều: V̈/V = −4πGρ = −3·w²', i.vddv, -3 * w2, 1e-4);
  const H2 = 0.0625;
  const d = doVddV({ loai: 'toi', H2 }, [0, 0, 0], 1.1, { t1: 0.4 });
  kiemTiLe('năng lượng tối: V̈/V = +Λc² = 3·(Λc²/3)', d.vddv, 3 * H2, 1e-4);
  // Mật độ thật: Trái Đất trung bình 5 514 kg/m³ → 4πGρ
  const rhoDat = GM_TRAI_DAT / G / ((4 / 3) * Math.PI * RE ** 3);
  kiem('mật độ trung bình Trái Đất (kg/m³)', rhoDat, 5514, 2);
}

muc('4. Tỉ số trục khớp công thức bậc hai trong thời gian ngắn');
{
  const GM = 30, r0 = 11, k = GM / r0 ** 3, n = 600, a0 = 0.05;
  const x = diemCau(400, 200, a0);
  for (let i = 0; i < n; i++) x[3 * i] += r0;
  const v = new Float64Array(3 * n), acc = new Float64Array(3 * n), tr = { loai: 'ngoai', GM };
  khoiGiaToc(tr, x, acc, n);
  const cov0 = Float64Array.from(hiepPhuong(x, n));
  const t1 = 1.0, buoc = 2000;
  for (let s = 0; s < buoc; s++) buocVerlet(tr, x, v, acc, n, t1 / buoc);
  const cov = hiepPhuong(x, n);
  // các trục chính nằm theo x (dọc) và y, z (ngang); so từng trục với chính nó lúc thả
  const ar = Math.sqrt(cov[0] / cov0[0]), at = (Math.sqrt(cov[4] / cov0[4]) + Math.sqrt(cov[8] / cov0[8])) / 2;
  kiem('trục dọc: (a/a0 − 1)/(GM t²/r³) ≈ 1 tại t = 1 (kt² = 0,023)', (ar - 1) / (k * t1 * t1), 1, 0.02);
  kiem('trục ngang: (a/a0 − 1)/(−GM t²/(2r³)) ≈ 1', (at - 1) / (-0.5 * k * t1 * t1), 1, 0.02);
  kiem('thể tích: |V/V0 − 1| nhỏ hơn nhiều so với kt²', Math.abs(Math.sqrt(det3(cov) / det3(cov0)) - 1) / (k * t1 * t1), 0, 0.03);
}

muc('5. Hai hạt cạnh nhau rơi về tâm: tiến lại gần; hai hạt trên dưới: giãn ra');
{
  const tr = { loai: 'ngoai', GM: 30 }, n = 4;
  const x = Float64Array.from([11.5, 0, 0, 10.5, 0, 0, 11, 0.5, 0, 11, -0.5, 0]);
  const v = new Float64Array(12), a = new Float64Array(12);
  khoiGiaToc(tr, x, a, n);
  for (let s = 0; s < 1000; s++) buocVerlet(tr, x, v, a, n, 0.002);
  kiemDung('cặp dọc giãn ra (> 1)', x[0] - x[3] > 1);
  kiemDung('cặp ngang tiến lại (< 1)', x[7] - x[10] < 1);
}

muc('6. Quả cầu vật chất đồng đều: mọi hạt tới tâm cùng lúc sau một phần tư chu kỳ');
{
  const w2 = (2 * Math.PI / 16) ** 2, tr = { loai: 'trong', w2 }, n = 600;
  const x = diemCau(400, 200, 1.1); for (let i = 0; i < n; i++) x[3 * i] += 5.2;
  const v = new Float64Array(3 * n), a = new Float64Array(3 * n);
  khoiGiaToc(tr, x, a, n);
  for (let s = 0; s < 4000; s++) buocVerlet(tr, x, v, a, n, 4 / 4000);
  let rmax = 0; for (let i = 0; i < n; i++) rmax = Math.max(rmax, Math.hypot(x[3 * i], x[3 * i + 1], x[3 * i + 2]));
  kiem('sau t = T/4 = 4: hạt xa tâm nhất (đơn vị mô phỏng)', rmax, 0, 1e-4);
}

muc('7. Áp suất âm và giãn nở tăng tốc');
{
  const rho = 1;
  const f = (P) => rho + 3 * P;           // c = 1
  kiemDung('P = −ρc²/3 là ngưỡng: ρ + 3P/c² = 0', Math.abs(f(-rho / 3)) < 1e-15);
  kiem('hằng số vũ trụ P = −ρc²: ρ + 3P/c² = −2ρ', f(-rho), -2, 1e-15);
  kiem('số phương trình độc lập: tenxơ đối xứng 4×4', (4 * 5) / 2, 10, 0);
}

// =====================================================================
// Bản 3: đám hạt kéo thả, thử thách và âm thanh (src/vat-ly/dam-hat-roi.js)
// =====================================================================
muc('8. Bản 3 · Trường của quả cầu vật chất đồng đều (chế độ «trong», kéo được ra ngoài)');
{
  const tc = truongCauDac(), g1 = [0, 0, 0], g2 = [0, 0, 0];
  giaTocT(tc, 5.2, 0.3, -0.4, g1); giaToc({ loai: 'trong', w2: W2_KHOI }, 5.2, 0.3, -0.4, g2);
  kiem('bên trong: trùng trường «trong» của Bản 2 (sai lệch)', Math.hypot(g1[0] - g2[0], g1[1] - g2[1], g1[2] - g2[2]), 0, 1e-15);
  giaTocT(tc, 10, 0, 0, g1);
  kiem('bên ngoài: GM/r² với GM = w²R³ (r = 10)', -g1[0], (W2_KHOI * R_KHOI ** 3) / 100, 1e-12);
  const gTrong = [0, 0, 0], gNgoai = [0, 0, 0];
  giaTocT(tc, R_KHOI - 1e-9, 0, 0, gTrong); giaTocT(tc, R_KHOI + 1e-9, 0, 0, gNgoai);
  kiem('liền mạch ở mặt quả cầu (hiệu hai phía)', Math.abs(gTrong[0] - gNgoai[0]), 0, 1e-8);
  kiem('V̈/V lúc thả bên trong = −3w² = −4πGρ', vddvLucTha(tc, 5.2), -3 * W2_KHOI, 1e-15);
  kiem('V̈/V lúc thả bên ngoài = 0', vddvLucTha(tc, 10), 0, 0);
  const dTrong = moPhongTha(tc, [5.2, 0, 0], 2), dCu = moPhongTha({ loai: 'trong', w2: W2_KHOI }, [5.2, 0, 0], 2);
  kiem('đám hạt mặc định (r = 5,2): thể tích lúc t = 2 giống hệt Bản 2', dTrong.V, dCu.V, 1e-12);
  kiem('… và bằng cos³(wt) của dao động điều hoà', dTrong.V, Math.cos(Math.sqrt(W2_KHOI) * 2) ** 3, 2e-3);
}

muc('9. Bản 3 · Đích của các thử thách (mô phỏng đúng đám hạt và bước tích phân của cảnh)');
{
  const ngoai = { loai: 'ngoai', GM: GM_HANH_TINH }, rCham = R_HANH_TINH + 0.05;
  // Bước 2: trục dọc 1,5 ± 0,05 đúng lúc t = 3
  const { t, dich, dungSai } = TT_TRUC_DOC;
  const d875 = moPhongTha(ngoai, [8.75, 0, 0], t, { rCham });
  kiem('bước 2: thả ở r = 8,75 → trục dọc lúc t = 3', d875.ar, dich, dungSai);
  kiemDung('bước 2: … chưa chạm hành tinh trước t = 3', !d875.cham);
  const d11 = moPhongTha(ngoai, [R_THA_MAC_DINH, 0, 0], t, { rCham });
  kiemDung(`bước 2: chỗ thả mặc định r = 11 cho ${d11.ar.toFixed(3)}, nằm ngoài dung sai (không đạt sẵn)`, Math.abs(d11.ar - dich) > dungSai);
  let rDat = [];
  for (let r = 7.5; r <= 11.001; r += 0.05) { const k = moPhongTha(ngoai, [r, 0, 0], t, { rCham }); if (!k.cham && Math.abs(k.ar - dich) <= dungSai) rDat.push(r); }
  kiem('bước 2: bề rộng khoảng chỗ thả đạt (đơn vị cảnh, đủ để kéo bằng tay)', rDat.length ? rDat[rDat.length - 1] - rDat[0] : 0, 0.4, 0.25);
  const dXoay = moPhongTha(ngoai, [8.75 * Math.cos(2), 0, -8.75 * Math.sin(2)], t, { rCham });
  kiem('bước 2: thả ở hướng khác cùng r = 8,75 cho cùng kết quả (đối xứng cầu)', dXoay.ar, d875.ar, 1e-6);

  // Bước 4: trong quả cầu, thể tích lúc t = 1,5 ≈ 0,57; ra hẳn ngoài thì ≥ 0,95
  const tc = truongCauDac();
  const vTrong = moPhongTha(tc, [5.2, 0, 0], TT_THE_TICH.t).V;
  kiem('bước 4: thả bên trong (r = 5,2): thể tích lúc t = 1,5, «khoảng 0,57»', vTrong, 0.575, 0.01);
  kiemDung('bước 4: … nhỏ hơn ngưỡng 0,95 (không đạt sẵn)', vTrong < TT_THE_TICH.nguong);
  const vMep = moPhongTha(tc, [R_KHOI + RC, 0, 0], TT_THE_TICH.t).V;
  kiemDung(`bước 4: thả vừa ra hẳn ngoài (r = 8,7): ${vMep.toFixed(3)} ≥ 0,95`, vMep >= TT_THE_TICH.nguong);
  kiemDung('bước 4: thả xa hơn (r = 12) cũng đạt', moPhongTha(tc, [12, 0, 0], TT_THE_TICH.t).V >= TT_THE_TICH.nguong);

  // Bước 6: đỉnh bướu còn một nửa khi Mặt Trăng xa gấp ∛2
  kiem('bước 6: đỉnh bướu ở khoảng cách thật (m)', dinhBuou(D_HINH), 0.357, 0.001);
  kiem('bước 6: đích = nửa đỉnh bướu (m), «0,18»', TT_TRIEU.dich, 0.178, 0.001);
  kiem('bước 6: Mặt Trăng trên hình ở 10·∛2 thì đỉnh bướu (m)', dinhBuou(D_HINH * Math.cbrt(2)), TT_TRIEU.dich, 1e-12);
  kiem('bước 6: 10·∛2 trên hình, «khoảng 12,6»', D_HINH * Math.cbrt(2), 12.6, 0.01);
  kiemDung('bước 6: lúc vào bước (d = 10) chưa đạt', Math.abs(dinhBuou(D_HINH) - TT_TRIEU.dich) > TT_TRIEU.dungSai);
  const dMin = D_HINH * Math.cbrt(0.357 / (TT_TRIEU.dich + TT_TRIEU.dungSai)), dMax = D_HINH * Math.cbrt(0.357 / (TT_TRIEU.dich - TT_TRIEU.dungSai));
  kiem('bước 6: bề rộng khoảng kéo đạt trên hình', dMax - dMin, 0.48, 0.05);

  // Bước 7: độ kéo gấp 8 lần ở r = 5,5
  kiem('bước 7: (11/5,5)³', tiSoKeo(5.5), 8, 1e-12);
  kiemDung('bước 7: chỗ thả mặc định không đạt (tỉ số 1)', Math.abs(tiSoKeo(R_THA_MAC_DINH) - TT_KEO_GAP.dich) > TT_KEO_GAP.dungSai);
  const r1 = R_THA_MAC_DINH / Math.cbrt(TT_KEO_GAP.dich + TT_KEO_GAP.dungSai), r2 = R_THA_MAC_DINH / Math.cbrt(TT_KEO_GAP.dich - TT_KEO_GAP.dungSai);
  kiem('bước 7: khoảng r đạt: cận dưới', r1, 5.36, 0.01);
  kiem('bước 7: khoảng r đạt: cận trên', r2, 5.65, 0.01);
  kiemDung('bước 7: khoảng đạt nằm ngoài giới hạn kéo gần nhất (RP + RC + 0,45 = 3,95)', r1 > R_HANH_TINH + RC + 0.45);
}

muc('10. Bản 3 · Âm thanh (quy đổi cho tai nghe)');
{
  kiem('lúc thả hai nốt cùng 330 Hz', tanSoTruc(1), 330, 0);
  kiem('trục dài gấp đôi: nốt cao lên một quãng tám (tỉ số tần số)', tanSoTruc(2) / tanSoTruc(1), 2, 1e-12);
  kiem('trục còn 0,78 lần: nốt «ép» (Hz)', tanSoTruc(0.78), 257.4, 0.01);
  kiem('trục co gần hết: tần số không xuống dưới 70 Hz', tanSoTruc(0.01), 70, 0);
  const lo = tiengSong(-0.18), cao = tiengSong(0.36);
  kiemDung('tiếng sóng: nước lên thì to hơn và sáng hơn', cao.doTo > lo.doTo && cao.tanSoLoc > lo.tanSoLoc);
}

tongKet();
