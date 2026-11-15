// Bộ kiểm số cho Bài 6 «Thuyết tương đối hẹp: phép biến đổi Lorentz».
// Chạy: node kiem-tra/kiem-lorentz.mjs

import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { gamma, doNhanh, bienDoi, khoang2, congVanToc, nhipDongHo, sinhDoi, muon, chamMoiNgay, chamMoiNgayGanDung, gammaTuNangLuong, vanToc4, TAU_MUON_S } from '../src/vat-ly/lorentz.js';
import { C } from '../src/vat-ly/hang-so.js';
import { TOC_NAY, NHIP_DONG_HO, giayThatMoiTich, dtDongThoi, chenhTuoi, vanTocBan, THU_THACH_B6, datThuThach } from '../src/vat-ly/lorentz-thu-thach.js';

muc('1. Hệ số Lorentz (bảng ở bước 2)');
kiem('γ(0,6)', gamma(0.6), 1.25, 1e-12);
kiem('γ(0,8)', gamma(0.8), 5 / 3, 1e-12);
kiem('γ(0,1)', gamma(0.1), 1.005, 5e-4);
kiem('γ(0,5)', gamma(0.5), 1.155, 5e-4);
kiem('γ(0,9)', gamma(0.9), 2.294, 5e-4);
kiem('γ(0,99)', gamma(0.99), 7.089, 5e-4);
kiem('γ(0,999)', gamma(0.999), 22.37, 5e-3);
kiem('γ của máy bay 900 km/h trừ 1', gamma(250 / C) - 1, 3.5e-13, 0.05e-13);

muc('2. Đồng hồ ánh sáng: Pythagoras cho đúng 2hγ');
for (const b of [0.3, 0.6, 0.8, 0.95]) {
  const h = 1;
  const t = nhipDongHo(h, b);
  kiem(`(t/2)² = h² + (βt/2)² tại β = ${b}`, (t / 2) ** 2 - h * h - ((b * t) / 2) ** 2, 0, 1e-12);
  kiem(`nhịp = 2hγ tại β = ${b}`, t, 2 * h * gamma(b), 1e-12);
}

muc('3. Phép biến đổi giữ nguyên s²');
for (const [t, x, b] of [[2, 1, 0.6], [3, -1, 0.8], [1, 2.5, -0.5], [4, 3, 0.95], [-2, 5, 0.3]]) {
  const [t2, x2] = bienDoi(t, x, b);
  kiem(`s² của (t = ${t}; x = ${x}) với β = ${b}`, khoang2(t2, x2), khoang2(t, x), 1e-11);
}
{
  const [t2, x2] = bienDoi(1, 0, 0.6);
  kiem('vạch 1 năm trên trục ct′: t = γ', bienDoi(1, 0, -0.6)[0], 1.25, 1e-12);
  kiem('vạch đó nằm trên hyperbol −t² + x² = −1', khoang2(...bienDoi(1, 0, -0.6)), -1, 1e-12);
  kiem('biến đổi ngược trả về chỗ cũ', bienDoi(t2, x2, -0.6)[0], 1, 1e-12);
}

muc('4. Đồng thời và co độ dài');
{
  const b = 0.6, L = 3;
  kiem('chớp B (x = +3, t = 0) trong khung tàu: t′ = −γβL', bienDoi(0, L, b)[0], -2.25, 1e-12);
  kiem('chớp A (x = −3, t = 0) trong khung tàu: t′ = +γβL', bienDoi(0, -L, b)[0], 2.25, 1e-12);
  kiem('tàu thấy B lúc t = L/(1 + β)', L / (1 + b), 1.875, 1e-12);
  kiem('tàu thấy A lúc t = L/(1 − β)', L / (1 - b), 7.5, 1e-12);
  kiem('thước 4 đơn vị ở 0,6 c đo trong phòng thí nghiệm', 4 / gamma(0.6), 3.2, 1e-12);
  kiem('thước 4 đơn vị ở 0,8 c', 4 / gamma(0.8), 2.4, 1e-12);
  // cắt dải thế giới bằng «bây giờ» của tàu: hai đầu (t′ = 0, x′ = ±2) cách nhau 4 theo thước của tàu
  const [ta, xa] = bienDoi(0, -2, -b), [tb, xb] = bienDoi(0, 2, -b);
  kiem('đoạn cắt bởi «bây giờ» của tàu có s = L0', Math.sqrt(khoang2(tb - ta, xb - xa)), 4, 1e-12);
}

muc('5. Độ nhanh và quay hyperbol');
kiem('tanh(độ nhanh của 0,6) = 0,6', Math.tanh(doNhanh(0.6)), 0.6, 1e-12);
kiem('độ nhanh của 0,6 = ln 2', doNhanh(0.6), Math.log(2), 1e-12);
kiem('độ nhanh của 0,8 = ln 3', doNhanh(0.8), Math.log(3), 1e-12);
kiem('cosh φ = γ tại 0,8', Math.cosh(doNhanh(0.8)), 5 / 3, 1e-12);

muc('6. Cộng vận tốc khớp với hợp hai phép biến đổi');
kiem('0,8 c cộng 0,8 c', congVanToc(0.8, 0.8), 0.9756, 5e-5);
kiem('0,5 c cộng 0,5 c', congVanToc(0.5, 0.5), 0.8, 1e-12);
kiem('0,8 c cộng ánh sáng', congVanToc(0.8, 1), 1, 1e-12);
kiem('ánh sáng cộng ánh sáng', congVanToc(1, 1), 1, 1e-12);
for (const [u, v] of [[0.8, 0.8], [0.5, 0.3], [0.9, -0.4]]) {
  // một điểm của khung thứ ba, biến đổi hai lần liền, phải giống biến đổi một lần với w
  const [t1, x1] = bienDoi(...bienDoi(2, 0.7, u), v);
  const [t2, x2] = bienDoi(2, 0.7, congVanToc(u, v));
  kiem(`hợp hai phép biến đổi ${u} và ${v}: t`, t1, t2, 1e-12);
  kiem(`hợp hai phép biến đổi ${u} và ${v}: x`, x1, x2, 1e-12);
  kiem(`độ nhanh cộng thẳng: φ(${u}) + φ(${v}) = φ(w)`, doNhanh(u) + doNhanh(v), doNhanh(congVanToc(u, v)), 1e-12);
}

kiem('tanh(ln 9) = 80/82', Math.tanh(Math.log(9)), 80 / 82, 1e-12);
kiem('câu hỏi: 0,6 c cộng 0,6 c', congVanToc(0.6, 0.6), 0.882, 5e-4);
kiem('câu hỏi: thước 10 m ở 0,6 c', 10 / gamma(0.6), 8, 1e-12);
kiem('câu hỏi: 3 giờ trên tàu 0,8 c', 3 * gamma(0.8), 5, 1e-12);

muc('7. Anh em sinh đôi');
{
  const s = sinhDoi(4.37, 0.8);
  kiem('Alpha Centauri, 0,8 c: người ở nhà chờ', s.T, 10.925, 1e-9, ' năm');
  kiem('người đi già thêm', s.Tdi, 6.555, 1e-9, ' năm');
  kiem('«bây giờ» của người đi trước khi quay đầu cắt đồng hồ ở nhà', s.truocQuay, 1.97, 0.005, ' năm');
  kiem('ngay sau khi quay đầu', s.sauQuay, 8.96, 0.005, ' năm');
  kiem('bước nhảy 2βL', s.nhay, 6.99, 0.005, ' năm');
  kiem('thời gian riêng một chặng: 5,4625 × 0,6', Math.sqrt(5.4625 ** 2 - 4.37 ** 2), 3.28, 0.005, ' năm');
  kiem('chặng đi kéo dài L/β', 4.37 / 0.8, 5.4625, 1e-12, ' năm');
  kiem('tổng: hai chặng × Tdi/2 · γ … kiểm lại T = Tdi·γ', s.Tdi * s.g, s.T, 1e-9);
  // đường thẳng dài nhất: thời gian riêng của đường gấp khúc nhỏ hơn đường thẳng
  kiemDung('đường gấp khúc có thời gian riêng ngắn hơn đường thẳng', s.Tdi < s.T);
}

muc('8. Bằng chứng');
{
  const m = muon(0.998);
  kiem('γ của muon ở 0,998 c', m.g, 15.82, 0.005);
  kiem('cτ0 của muon', C * TAU_MUON_S, 659, 0.5, ' m');
  kiem('quãng đường trung bình γβcτ0', m.quangDuongM / 1000, 10.4, 0.05, ' km');
  kiem('sống trung bình đo từ mặt đất', m.songS * 1e6, 34.75, 0.01, ' µs');
  kiem('Bailey 1977: 29,3 × 2,197 µs', 29.3 * TAU_MUON_S * 1e6, 64.4, 0.05, ' µs');
  kiem('khí quyển 10,4 km trong khung muon (co γ lần)', 10.4e3 / m.g, 657, 1, ' m');
  kiem('bằng βcτ0 (cùng con số theo cả hai cách kể)', m.neuKhongGianM, 657, 1, ' m');
  kiem('GPS 3,874 km/s: v²/2c² × 86 400 giây', chamMoiNgayGanDung(3874) * 1e6, 7.2, 0.05, ' µs');
  kiem('GPS: công thức đủ cho cùng kết quả', chamMoiNgay(3874) * 1e6, chamMoiNgayGanDung(3874) * 1e6, 1e-5, ' µs');
  kiem('LHC: 6 500 GeV / 0,938272 GeV', gammaTuNangLuong(6500), 6928, 0.5);
  kiem('vận tốc của proton LHC: 1 − β', 1 - Math.sqrt(1 - 1 / gammaTuNangLuong(6500) ** 2), 1.04e-8, 0.01e-8);
}

muc('9. Vận tốc bốn chiều');
for (const b of [0, 0.6, 0.99]) {
  const [ut, ux] = vanToc4(b);
  kiem(`−u_t² + u_x² tại β = ${b}`, -ut * ut + ux * ux, -1, 1e-9);
}

muc('10. Bản 3: thử thách (đích trong tầm kéo, nút «thử ngay» và trạng thái lúc vào bước không tự đạt)');
{
  // bước 2: γ = 2
  kiem('γ = 2 ở v = √3/2 c', gamma(Math.sqrt(3) / 2), 2, 1e-12);
  kiemDung('bước 2: thanh trượt (bước 0,01) đạt ở 0,87', datThuThach.gamma2(0.87));
  kiemDung('bước 2: kéo tay nắm (bước 0,001) đạt ở 0,866', datThuThach.gamma2(0.866));
  for (const b of [0.6, 0.8]) kiemDung(`bước 2: ${b} c (lúc vào bước, nút) không tự đạt`, !datThuThach.gamma2(b));
  // bước 3: Δt′ = 6
  kiem('bước 3: Δt′ ở 0,6 c (lời giảng: 4,5)', dtDongThoi(0.6, 3), 4.5, 1e-12);
  kiem('bước 3: v = c/√2 cho γβ = 1, Δt′ = 6', dtDongThoi(Math.SQRT1_2, 3), 6, 1e-12);
  kiemDung('bước 3: thanh trượt đạt ở 0,71', datThuThach.dongThoi(0.71));
  for (const b of [0, 0.6]) kiemDung(`bước 3: ${b} c không tự đạt`, !datThuThach.dongThoi(b));
  kiemDung('bước 3: đích nằm trong tầm 0–0,95 c', Math.SQRT1_2 < 0.95);
  // bước 4: L = 3
  kiem('bước 4: v = √7/4 c cho L = 3', 4 / gamma(Math.sqrt(7) / 4), 3, 1e-12);
  kiemDung('bước 4: thanh trượt đạt ở 0,66', datThuThach.thuoc(0.66));
  for (const b of [0.6, 0.8]) kiemDung(`bước 4: ${b} c không tự đạt (L = ${(4 / gamma(b)).toFixed(2)})`, !datThuThach.thuoc(b));
  // bước 6: w = 0,9 khi u = 0,8
  const vBan = vanTocBan(0.8, 0.9);
  kiem('bước 6: phải bắn 0,1/0,28 ≈ 0,357 c', vBan, 0.1 / 0.28, 1e-12);
  kiem('bước 6: cộng lại đúng 0,9 c', congVanToc(0.8, vBan), 0.9, 1e-12);
  kiemDung('bước 6: thanh trượt đạt ở 0,36', datThuThach.cong(0.8, 0.36));
  for (const v of [0.8, 1]) kiemDung(`bước 6: bắn ${v} (nút, lúc vào bước) không tự đạt`, !datThuThach.cong(0.8, v));
  kiemDung('bước 6: Newton (bắn 0,1 c) không đạt', !datThuThach.cong(0.8, 0.1));
  kiemDung('bước 6: cho tàu 0,9 c rồi bắn 0 không tính (tàu phải giữ 0,8 c)', !datThuThach.cong(0.9, 0));
  // bước 7: chênh 5 năm
  let lo = 0.8, hi = 0.99;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (chenhTuoi(4.37, m) < 5) lo = m; else hi = m; }
  kiem('bước 7: tốc độ cho chênh 5 năm (Alpha Centauri)', lo, 0.862, 0.001);
  kiem('bước 7: chênh ở 0,8 c (lúc vào bước)', chenhTuoi(4.37, 0.8), 4.37, 1e-9, ' năm');
  kiemDung('bước 7: 0,8 c và 0,99 c (nút) không tự đạt', !datThuThach.sinhDoi(4.37, 0.8) && !datThuThach.sinhDoi(4.37, 0.99));
  kiemDung('bước 7: kéo tay nắm (bước 0,001) đạt ở 0,862', datThuThach.sinhDoi(4.37, 0.862));
  kiemDung('bước 7: điểm quay đầu ở x = 2,5β nằm trong tầm kéo 0,25–2,475', 2.5 * 0.862 > 0.25 && 2.5 * 0.862 < 2.475);
}

muc('11. Bản 3: tiếng tích của hai đồng hồ ánh sáng');
kiem('một tích của đồng hồ (h = 1): 2h/c', NHIP_DONG_HO, 2, 0);
kiem('«bây giờ» chạy 1,1 đơn vị mỗi giây thật', TOC_NAY, 1.1, 0);
kiem('đồng hồ đứng yên: một tiếng tích mỗi ~1,8 giây (lời giảng)', giayThatMoiTich(1), 1.818, 0.001, ' s');
kiem('đồng hồ trên tàu 0,6 c: thưa hơn đúng 1,25 lần', giayThatMoiTich(gamma(0.6)) / giayThatMoiTich(1), 1.25, 1e-12);
kiem('đồng hồ trên tàu γ = 2: tích mỗi 3,6 giây', giayThatMoiTich(2), 3.636, 0.001, ' s');
{
  // sinh nhật trong bước 7: mô hình vẽ cả chuyến đi cao 10 đơn vị, «bây giờ» chạy 1,1 đơn vị mỗi giây
  const s = sinhDoi(4.37, 0.8), k = 10 / s.T;
  kiem('sinh nhật người ở nhà: mỗi ~0,99 giây thật', 1 / (k * TOC_NAY), 0.993, 0.001, ' s');
  kiem('sinh nhật người đi: thưa hơn γ = 5/3 lần', (s.g / (k * TOC_NAY)) / (1 / (k * TOC_NAY)), 5 / 3, 1e-12);
}

tongKet();
