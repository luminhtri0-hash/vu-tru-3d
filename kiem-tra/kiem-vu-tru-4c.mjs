// Bộ kiểm số cho Bài 19 «Không-thời gian của cả vũ trụ».
// Chạy: node kiem-tra/kiem-vu-tru-4c.mjs

import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { taoVuTru, MO_HINH_DL } from '../src/vat-ly/chan-troi-vu-tru.js';
import { lichSuGianNo, GYR_TREN_H0 } from '../src/vat-ly/vu-tru-hoc.js';
import { nhinTuLuc, THU_THACH_4C, TIENG_GOC_4C, tanSoTieng4c } from '../src/vat-ly/chan-troi-luc-bat-ky.js';

const v = taoVuTru();   // Planck 2018

muc('1. Mô hình Planck 2018 (H0 = 67,4; Ωm = 0,315; ΩΛ = 0,685; Ωr = 9,2·10⁻⁵)');
kiem('tuổi vũ trụ (tỉ năm)', v.tuoi, 13.79, 0.03);
kiem('khớp lichSuGianNo của vu-tru-hoc.js', v.tuoi, lichSuGianNo().tuoi, 0.01);
kiem('c/H0 (tỉ năm ánh sáng)', v.banKinhHubbleNay, 14.51, 0.005);
kiem('c/H0 = 977,79/67,4', v.banKinhHubbleNay, GYR_TREN_H0 / 67.4, 1e-9);
kiemDung('chân trời hạt trong [45,5; 46,8]', v.chanTroiHat >= 45.5 && v.chanTroiHat <= 46.8);
kiem('chân trời hạt (lời giảng: 46,1)', v.chanTroiHat, 46.1, 0.05);
kiemDung('chân trời sự kiện trong [16; 17,3]', v.chanTroiSuKien >= 16 && v.chanTroiSuKien <= 17.3);
kiem('chân trời sự kiện (lời giảng: 16,7)', v.chanTroiSuKien, 16.7, 0.05);
kiem('η(∞) (lời giảng: 62,8)', v.etaVoCung, 62.8, 0.05);

muc('2. Nón ánh sáng quá khứ hình giọt nước');
{
  const c = v.cucDaiNon();
  kiemDung('cực đại trong [5,6; 6,0] tỉ năm ánh sáng', c.d >= 5.6 && c.d <= 6.0);
  kiemDung('tại z trong [1,4; 1,8]', c.z >= 1.4 && c.z <= 1.8);
  kiem('cực đại (lời giảng: 5,85)', c.d, 5.85, 0.01);
  kiem('z tại cực đại (lời giảng: 1,6)', c.z, 1.6, 0.05);
  kiem('tuổi vũ trụ lúc đó (lời giảng: 4,1 tỉ năm)', c.t, 4.05, 0.06);
  // Tại cực đại, ánh sáng «đứng yên» về khoảng cách thật: tốc độ lùi lúc phát bằng đúng c (mặt cầu Hubble).
  kiem('tại cực đại tốc độ lùi lúc phát = c', v.vLui(c.a, v.chiNonQuaKhu(c.a)), 1, 0.002);
  kiem('nón khép về 0 ở Vụ Nổ Lớn', v.dNonQuaKhu(1e-7), 0, 1e-3);
}

muc('3. Mặt cầu Hubble và chân trời sự kiện, đo bằng dịch chuyển đỏ');
{
  const zH = v.zTaiChi(v.banKinhHubbleNay);
  kiemDung('z của thiên hà lùi đúng bằng c hôm nay ≈ 1,5', zH > 1.4 && zH < 1.6);
  kiem('z mặt cầu Hubble (lời giảng: 1,48)', zH, 1.48, 0.01);
  const zE = v.zTaiChi(v.chanTroiSuKien);
  kiemDung('z ở mép chân trời sự kiện ≈ 1,8–1,9', zE > 1.7 && zE < 2.0);
  kiem('z chân trời sự kiện (lời giảng: 1,87)', zE, 1.87, 0.01);
  kiem('v hôm nay tại chân trời hạt (lời giảng: 3,2 c)', v.vLui(1, v.chanTroiHat), 3.18, 0.01);
}

muc('4. Bức xạ nền (z = 1090)');
{
  const b = v.thienHa(1090);
  kiemDung('khoảng cách thật lúc phát trong [0,039; 0,044] tỉ năm ánh sáng', b.dPhat >= 0.039 && b.dPhat <= 0.044);
  kiem('khoảng cách lúc phát (lời giảng: 41 triệu năm ánh sáng)', b.dPhat * 1000, 41.4, 0.1);
  kiem('khoảng cách hôm nay (lời giảng: 45,2)', b.dNay, 45.2, 0.05);
  kiem('tuổi vũ trụ lúc phát (lời giảng: 371 000 năm)', b.tPhat * 1e6, 371, 1);
  kiem('khoảng cách giãn đúng (1 + z) lần', b.dNay / b.dPhat, 1091, 1e-6);
  kiem('tốc độ lùi hôm nay của nguồn bức xạ nền (lời giảng: 3,1 c)', b.vNay, 3.12, 0.01);
}

muc('5. Các thiên hà ví dụ trong lời giảng');
{
  const z1 = v.thienHa(1);
  kiem('z = 1: phát lúc vũ trụ 5,8 tỉ năm tuổi', z1.tPhat, 5.84, 0.01);
  kiem('z = 1: lúc phát cách 5,5', z1.dPhat, 5.55, 0.01);
  kiem('z = 1: nay cách 11,1', z1.dNay, 11.09, 0.01);
  const z11 = v.thienHa(11);
  kiem('z = 11: phát lúc vũ trụ 0,41 tỉ năm tuổi', z11.tPhat, 0.41, 0.01);
  kiem('z = 11: lúc phát cách 2,7', z11.dPhat, 2.67, 0.01);
  kiem('z = 11: nay cách 32,1', z11.dNay, 32.07, 0.01);
  kiem('z = 11: lúc phát lùi 4,3 c', z11.vPhat, 4.31, 0.01);
  kiem('z = 3: lúc phát lùi 1,7 c', v.thienHa(3).vPhat, 1.67, 0.01);
  kiemDung('z = 3 (lùi nhanh hơn c) vẫn thấy được: χ < chân trời hạt', v.thienHa(3).dNay < v.chanTroiHat);
}

muc('6. So với Davis và Lineweaver 2004 (H0 = 70; Ωm = 0,3; ΩΛ = 0,7; Ωr = 0)');
{
  const d = taoVuTru(MO_HINH_DL);
  kiem('chân trời hạt ≈ 46', d.chanTroiHat, 46, 1.5);
  kiem('chân trời sự kiện ≈ 16', d.chanTroiSuKien, 16, 1);
  kiem('tuổi (lời giảng: 13,5 tỉ năm)', d.tuoi, 13.47, 0.01);
  kiem('khớp lichSuGianNo về tuổi', d.tuoi, lichSuGianNo(MO_HINH_DL).tuoi, 0.01);
}

muc('7. Tự nhất quán của bảng tích phân');
{
  // t(a) và η(a) phải thỏa dt = a dη; lấy đạo hàm số tại vài điểm.
  for (const a of [1e-5, 1e-3, 0.3, 1, 5]) {
    const h = a * 0.01;
    const dt = v.tTai(a + h) - v.tTai(a - h), de = v.etaTai(a + h) - v.etaTai(a - h);
    kiem(`dt/dη = a tại a = ${a}`, dt / de / a, 1, 5e-4);
  }
  kiem('a(t) đảo đúng t(a)', v.aTuT(v.tTai(0.5)), 0.5, 1e-6);
  kiem('a(η) đảo đúng η(a)', v.aTuEta(v.etaTai(2)), 2, 1e-5);
  kiem('đoạn đầu: t(10⁻⁶) giải tích bức xạ a²/(2H0√Ωr) (năm)', v.tTai(1e-6) * 1e9, (1e-12 / (2 * v.h * Math.sqrt(9.2e-5))) * 1e9, 1e-3);
  kiem('a sau 25 tỉ năm nữa (lời giảng: 4,4)', v.aTuT(v.tuoi + 25), 4.44, 0.01);
}

muc('8. Các con số khác trong lời giảng');
{
  kiem('a lúc vũ trụ 4 tỉ năm tuổi (0,39)', v.aTuT(4.05), 0.39, 0.005);
  const aTT = Math.cbrt(0.315 / (2 * 0.685));
  kiem('bắt đầu giãn nhanh dần: a ≈ 0,61', aTT, 0.61, 0.005);
  kiem('… z ≈ 0,63', 1 / aTT - 1, 0.63, 0.005);
  kiem('… tuổi vũ trụ 7,7 tỉ năm', v.tTai(aTT), 7.7, 0.05);
  kiem('bán kính chân trời sự kiện về lâu dài c/(H0√ΩΛ) = 17,5', v.banKinhHubbleNay / Math.sqrt(0.685), 17.5, 0.05);
  kiem('… khớp khoảng cách thật của chân trời sự kiện 25 tỉ năm nữa', v.aTuT(v.tuoi + 25) * v.chiSuKien(v.aTuT(v.tuoi + 25)), 17.5, 0.05);
  const z3 = v.thienHa(3);
  kiem('z = 3: phát lúc 2,1 tỉ năm tuổi', z3.tPhat, 2.14, 0.01);
  kiem('z = 3: lúc phát cách 5,3', z3.dPhat, 5.3, 0.01);
  kiem('z = 3: ánh sáng đi 11,7 tỉ năm', z3.tDiDuong, 11.65, 0.01);
  kiem('z = 3: nay lùi 1,46 c', z3.vNay, 1.46, 0.005);
  kiem('z = 3: nay cách 21,2', z3.dNay, 21.2, 0.02);
  kiem('z = 11: ánh sáng đã đi 13,4 tỉ năm', v.thienHa(11).tDiDuong, 13.38, 0.01);
  kiem('bức xạ nền: tốc độ lùi lúc phát 66 c', v.thienHa(1090).vPhat, 66.35, 0.05);
  kiem('trục thời gian giãn 0,28/0,15 = 1,87 lần', 0.28 / 0.15, 1.87, 0.005);
  kiemDung('thiên hà nay cách 15 tỉ năm ánh sáng vẫn nhận được tín hiệu gửi hôm nay', 15 < v.chanTroiSuKien);
  kiemDung('thiên hà nay cách 20 tỉ năm ánh sáng không nhận được', 20 > v.chanTroiSuKien);
  kiem('1/H0 tính bằng 1/tỉ năm: H0 = 1/14,51', 1 / v.h, 14.51, 0.005);
}

muc('9. Bản 3: «bây giờ» kéo được, thử thách, âm thanh (src/vat-ly/chan-troi-luc-bat-ky.js)');
{
  // nhìn từ hôm nay phải khớp đúng các hàm cũ
  const N1 = nhinTuLuc(v, 1);
  kiem('«bây giờ» = hôm nay: chân trời hạt khớp', N1.chanTroiHat, v.chanTroiHat, 1e-9);
  kiem('… chân trời sự kiện khớp', N1.chanTroiSuKien, v.chanTroiSuKien, 1e-9);
  kiem('… c/H khớp (lệch do Ωr + Ωm + ΩΛ = 1,00009)', N1.dHubble, v.banKinhHubbleNay, 1e-3);
  for (const z of [0.5, 3, 11, 1090]) {
    const a = N1.thienHa(v.thienHa(z).chi), b = v.thienHa(z);
    kiem(`… thiên hà z = ${z}: z tính lại`, a.z, z, 2e-4 * (1 + z));
    kiem(`… thiên hà z = ${z}: khoảng cách lúc phát`, a.dPhat, b.dPhat, 1e-4 * (1 + b.dPhat));
  }
  // nhìn từ một lúc khác: nón quá khứ có cực đại đúng ở mặt cầu Hubble lúc phát (dD/dt = HD − c = 0)
  const aN = v.aTuT(7.55), N = nhinTuLuc(v, aN);
  let lo = Math.log(1e-3), hi = Math.log(aN);
  const f = (l) => Math.exp(l) * N.chiNon(Math.exp(l));
  for (let k = 0; k < 120; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) lo = m1; else hi = m2; }
  const aC = Math.exp((lo + hi) / 2);
  kiem('lúc 7,55 tỉ năm: đỉnh giọt nước nằm trên mặt cầu Hubble (v lúc phát = c)', v.vLui(aC, N.chiNon(aC)), 1, 0.003);
  kiemDung('chân trời hạt (khoảng cách thật) tăng theo thời gian', nhinTuLuc(v, v.aTuT(4)).dChanTroiHat < N.dChanTroiHat && N.dChanTroiHat < v.chanTroiHat);
  kiemDung('thiên hà z = 11 hôm nay (χ = 32,1) đã thấy được lúc 7,55 tỉ năm (χ < 38,1)', N.thienHa(v.thienHa(11).chi).thay);
  kiemDung('… nhưng chưa thấy được lúc 3 tỉ năm', !nhinTuLuc(v, v.aTuT(3)).thienHa(v.thienHa(11).chi).thay);
  // Thử thách 1 (bước 3): đỉnh giọt nước
  const c = v.cucDaiNon();
  kiemDung('Thử thách 1: đích 5,82 thấp hơn cực đại 5,85 (đạt được)', THU_THACH_4C.giot.dPhat < c.d);
  let zs = [];
  for (let z = 1; z < 2.4; z += 0.005) if (v.thienHa(z).dPhat >= THU_THACH_4C.giot.dPhat) zs.push(z);
  kiemDung(`… vùng đạt z ∈ [${zs[0].toFixed(2)}; ${zs[zs.length - 1].toFixed(2)}] chứa 1,6 và đủ rộng để kéo tay`, zs[0] < 1.6 && zs[zs.length - 1] > 1.6 && zs[zs.length - 1] - zs[0] > 0.3);
  kiem('… gợi ý: thiên hà ở đỉnh nay cách khoảng 15 tỉ năm ánh sáng', v.thienHa(c.z).chi, 15, 0.5, ' tỉ năm ánh sáng');
  kiemDung('… lúc vào bước (z = 3: 5,30) và nút z = 1 (5,55) chưa đạt', v.thienHa(3).dPhat < THU_THACH_4C.giot.dPhat && v.thienHa(1).dPhat < THU_THACH_4C.giot.dPhat);
  // Thử thách 2 (bước 4): lúc phát lùi 2 c
  let a2 = 1, b2 = 20;
  for (let k = 0; k < 80; k++) { const m = (a2 + b2) / 2; if (v.thienHa(m).vPhat < 2) a2 = m; else b2 = m; }
  kiem('Thử thách 2: z để lúc phát lùi đúng 2 c (gợi ý: khoảng 3,8)', a2, 3.8, 0.05);
  kiem('… nay cách (gợi ý: chừng 23 tỉ năm ánh sáng)', v.thienHa(a2).chi, 23.4, 0.3, ' tỉ năm ánh sáng');
  kiemDung('… vẫn thấy được (trong chân trời hạt)', v.thienHa(a2).chi < v.chanTroiHat);
  kiemDung('… các nút z = 3 (1,67 c), z = 1,48, z = 0,5 không làm đạt', [3, 1.48, 0.5].every((z) => Math.abs(v.thienHa(z).vPhat - 2) > THU_THACH_4C.v2.sai));
  // Thử thách 3 (bước 5): chân trời hạt bằng nửa hôm nay
  kiem('Thử thách 3: đích bằng nửa chân trời hạt hôm nay', THU_THACH_4C.hatNua.d, v.chanTroiHat / 2, 0.02);
  let a3 = 0.05, b3 = 1;
  for (let k = 0; k < 80; k++) { const m = (a3 + b3) / 2; if (m * v.etaTai(m) < THU_THACH_4C.hatNua.d) a3 = m; else b3 = m; }
  kiem('… lúc vũ trụ (gợi ý: quanh 7,6 tỉ năm tuổi)', v.tTai(a3), 7.55, 0.05, ' tỉ năm');
  let t0 = 0, t1 = 0;
  for (let t = 5; t < 11; t += 0.01) { const d = nhinTuLuc(v, v.aTuT(t)).dChanTroiHat; if (Math.abs(d - THU_THACH_4C.hatNua.d) < THU_THACH_4C.hatNua.sai) { if (!t0) t0 = t; t1 = t; } }
  kiemDung(`… vùng đạt ${t0.toFixed(2)}–${t1.toFixed(2)} tỉ năm, rộng hơn 0,3 tỉ năm`, t1 - t0 > 0.3);
  // Thử thách 4 (bước 6): vừa ngoài chân trời sự kiện
  const sk = v.chanTroiSuKien;
  kiem('Thử thách 4: mép dưới, z (vào bước ở z = 1,87 thì chưa đạt)', v.zTaiChi(sk + THU_THACH_4C.sk.tren), 1.91, 0.01);
  kiem('… mép trên 18 tỉ năm ánh sáng, z (gợi ý: khoảng 2,1)', v.zTaiChi(sk + THU_THACH_4C.sk.duoi), 2.14, 0.01);
  kiem('… mép trên tính bằng tỉ năm ánh sáng (gợi ý: trước 18)', sk + THU_THACH_4C.sk.duoi, 17.98, 0.01);
  kiemDung('… z = 1,87 (nút «đúng mép») chưa đạt', v.thienHa(1.87).chi - sk < THU_THACH_4C.sk.tren);
  kiemDung('… thiên hà trong vùng đích vẫn thấy được hôm nay', sk + THU_THACH_4C.sk.duoi < v.chanTroiHat);
  // Âm thanh
  kiem('Âm kéo dài: gốc', TIENG_GOC_4C, 660, 0, ' Hz');
  kiem('… z = 1: 330 Hz (trầm một quãng tám)', tanSoTieng4c(1), 330, 1e-9, ' Hz');
  kiem('… z = 1,87 (mép chân trời sự kiện): 230 Hz', tanSoTieng4c(1.87), 230, 0.5, ' Hz');
  kiem('Bước 2: lúc vũ trụ 4 tỉ năm tuổi, a (lời giảng: 0,38)', v.aTuT(4), 0.38, 0.005);
}

tongKet();
