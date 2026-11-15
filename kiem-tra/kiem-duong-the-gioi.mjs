// Bộ kiểm số cho Bài 4 «Sự kiện và đường thế giới». Chạy: node kiem-tra/kiem-duong-the-gioi.mjs
// Kiểm các con số trong lời giảng, đích và dung sai của thử thách, và các phép quy đổi âm thanh của Bản 3.
import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { C, NAS_AU, KM_S_SANG_AU_NAM } from '../src/vat-ly/hang-so.js';
import { HANH_TINH } from '../src/vat-ly/he-mat-troi.js';
import {
  gocNghiengDo, vTuGoc, R_TRAM, buocLoXo, vTuBuoc, TOC_BAY_GIO, giayThatMoiTich,
  TROI_HMT, giayThatMoiVong, gocTiaNangDo, THU_THACH_B4,
} from '../src/vat-ly/duong-the-gioi.js';

const ckm = C / 1000;
const ht = (id) => HANH_TINH.find((h) => h.id === id);

muc('1. Độ nghiêng của đường thế giới (bước 3, 4)');
kiem('0,5 c nghiêng 26,6°', gocNghiengDo(0.5), 26.6, 0.05, '°');
kiem('0,9 c nghiêng 42°', gocNghiengDo(0.9), 42, 0.05, '°');
kiem('ánh sáng nghiêng 45°', gocNghiengDo(1), 45, 1e-12, '°');
kiemDung('0,95 c (giới hạn của tay nắm) vẫn dưới 45°', gocNghiengDo(0.95) < 45);
kiem('máy bay 900 km/h: v/c ≈ 8,3·10⁻⁷', 250 / C, 8.3e-7, 0.05e-7);
kiemDung(`máy bay 900 km/h nghiêng ${gocNghiengDo(250 / C).toExponential(2)}° < 0,00005°`, gocNghiengDo(250 / C) < 5e-5);
kiem('1 giây × c (km)', ckm, 299792.458, 0, ' km');
kiem('đi sâu: dùng giây và mét thì tia sáng nghiêng (so với trục thời gian, độ)', (Math.atan(C) * 180) / Math.PI, 89.9999998, 1e-7, '°');

muc('2. Lò xo của chuyển động tròn (bước 5, câu hỏi Mặt Trăng)');
kiem('trạm 0,6 c: bước lò xo 17,8 giây ánh sáng', buocLoXo(R_TRAM, 0.6), 17.8, 0.01);
kiem('bước / chu vi = c/v', buocLoXo(R_TRAM, 0.6) / (2 * Math.PI * R_TRAM), 1 / 0.6, 1e-12);
kiem('Mặt Trăng: bước lò xo cT (km)', ckm * 27.3 * 86400, 7.07e11, 0.01e11, ' km');
kiem('Mặt Trăng: bước / bán kính quỹ đạo', (ckm * 27.3 * 86400) / 384400, 1.84e6, 0.01e6);
kiem('Trái Đất: bước (1 năm ánh sáng) / 1 AU', NAS_AU, 63241, 1);
kiem('Trái Đất: bước / chu vi ≈ c/v (khoảng 10 000)', NAS_AU / (2 * Math.PI), 10065, 1);

muc('3. Hệ Mặt Trời trong không-thời gian (bước 6–8)');
const nenToiDa = (NAS_AU * 2.0) / 2.2;
kiem('nén nhiều nhất (bốn hành tinh trong): khoảng 57 000 lần', nenToiDa, 57492, 1);
kiem('Sao Thủy: 88 ngày', ht('thuy').chuKyNam * 365.25, 88, 0.05, ' ngày');
kiem('Sao Hỏa: 687 ngày', ht('hoa').chuKyNam * 365.25, 687, 0.05, ' ngày');
kiem('ánh nắng 1 AU: 499 giây', (149597870.7 / ckm), 499, 0.01, ' s');
kiem('ánh nắng 1 AU: 8,3 phút', (149597870.7 / ckm) / 60, 8.3, 0.02, ' phút');
{
  const s = NAS_AU * 2.0;                       // tỉ lệ thật: đơn vị hiển thị mỗi năm (k = 2 đơn vị/AU)
  const quaKhu = 7 / s * 525960;                // phần dưới «hôm nay» cao 7 đơn vị
  kiem('tỉ lệ thật: phần quá khứ của khung hình (phút)', quaKhu, 29.1, 0.1, ' phút');
  kiem('tỉ lệ thật: cả khung hình cao 9,6 đơn vị (phút)', 9.6 / s * 525960, 39.9, 0.1, ' phút');
  kiem('nửa giờ = 1/18 000 vòng quỹ đạo (lấy tròn)', 1 / ((0.5 / 24) / 365.25), 17532, 1);
}
kiem('Trái Đất 29,8 km/s: v/c ≈ 10⁻⁴', 29.8 / ckm, 0.994e-4, 0.001e-4);
kiem('Trái Đất: nghiêng 0,0057°', gocNghiengDo(29.78 / ckm), 0.0057, 0.00005, '°');
kiem('1 km/s ra AU/năm (đổi khung Galilei)', KM_S_SANG_AU_NAM, 0.21095, 0.00001);

muc('4. Thử thách: đích nằm trong tầm thao tác, nút «thử ngay» không tự đạt');
{
  const q = THU_THACH_B4.nghieng;
  const vDich = vTuGoc(q.goc);
  kiem('bước 3: tan 35° = 0,70', vDich, 0.7002, 0.0001);
  kiemDung('bước 3: thanh trượt (bước 0,01) chạm đích ở 0,70', Math.abs(gocNghiengDo(0.7) - q.goc) <= q.dungSai);
  kiemDung('bước 3: đích nằm trong tầm kéo 0–0,95 c', vDich > 0 && vDich < 0.95);
  for (const v of [0, 0.5, 0.9]) kiemDung(`bước 3: nút ${v} c không tự đạt (${gocNghiengDo(v).toFixed(2)}°)`, Math.abs(gocNghiengDo(v) - q.goc) > q.dungSai);
}
{
  const q = THU_THACH_B4.loXo;
  const vDich = vTuBuoc(R_TRAM, q.buoc);
  kiem('bước 5: tốc độ cho bước lò xo 15 giây ánh sáng', vDich, 0.7121, 0.0001);
  kiemDung('bước 5: thanh trượt chạm đích ở 0,71', Math.abs(buocLoXo(R_TRAM, 0.71) - q.buoc) <= q.dungSai);
  for (const v of [0.2, 0.6, 0.9]) kiemDung(`bước 5: tốc độ ${v} c (nút, lúc vào bước) không tự đạt (bước ${buocLoXo(R_TRAM, v).toFixed(2)})`, Math.abs(buocLoXo(R_TRAM, v) - q.buoc) > q.dungSai);
}
{
  const q = THU_THACH_B4.tiaSang;
  kiem('bước 4: tia sáng cách nhà 3 giây ánh sáng lúc t = 4 giây', q.tPhat + q.khoang, 4, 0);
  kiemDung('bước 4: thời điểm đích nằm trong khối (0–10 giây)', q.tPhat + q.khoang <= 10);
  kiemDung('bước 1: «hai tàu gặp nhau» lúc t = 4,5 giây, trong khối', THU_THACH_B4.gap.t > 0 && THU_THACH_B4.gap.t < 10);
}
{
  const q = THU_THACH_B4.tiaNang;
  kiem('bước 7: tia nắng 45° ở tỉ lệ thật', gocTiaNangDo(1), 45, 1e-12, '°');
  kiem('bước 7: nén √3 lần thì tia nắng hợp 30°', gocTiaNangDo(Math.sqrt(3)), 30, 1e-9, '°');
  const mucDich = Math.log(Math.sqrt(3)) / Math.log(nenToiDa);
  kiem('bước 7: vị trí thanh «Trục thời gian» ứng với đích', mucDich, 0.05, 0.0005);
  const buoc = Math.pow(nenToiDa, 0.001);
  kiemDung(`bước 7: mỗi nấc thanh trượt đổi góc ${(gocTiaNangDo(Math.sqrt(3)) - gocTiaNangDo(Math.sqrt(3) * buoc)).toFixed(2)}° < dung sai`, gocTiaNangDo(Math.sqrt(3)) - gocTiaNangDo(Math.sqrt(3) * buoc) < q.dungSai);
  kiemDung('bước 7: hai nút (tỉ lệ thật, nén lại) không tự đạt', Math.abs(gocTiaNangDo(1) - q.goc) > q.dungSai && Math.abs(gocTiaNangDo(nenToiDa) - q.goc) > q.dungSai);
  // phần đứng của tia = (d/c)·s, phần ngang = d·k, với s = NAS_AU·k/n  →  tan = 1/n, không phụ thuộc d
  for (const d of [0.983, 1.017]) {
    const n = 1000, k = 2, s = (NAS_AU * k) / n;
    kiem(`tan(góc tia nắng) = 1/n với d = ${d} AU`, ((d / NAS_AU) * s) / (d * k), 1 / n, 1e-15);
  }
}

muc('5. Âm thanh: quy đổi cho tai nghe');
kiem('tấm «bây giờ» chạy 0,8 giây mô hình mỗi giây thật', TOC_BAY_GIO, 0.8, 0);
kiem('một tiếng «tích» mỗi 1,25 giây thật (lời giảng bước 1)', giayThatMoiTich(), 1.25, 1e-12, ' s');
{
  const sMax = 2.2;                               // đơn vị hiển thị mỗi năm khi nén nhiều nhất (bốn hành tinh trong)
  kiem('mỗi giây trôi qua là 3 tháng', (TROI_HMT / sMax) * 12, 3, 1e-12, ' tháng');
  kiem('Sao Thủy ngân mỗi ~1 giây', giayThatMoiVong(ht('thuy').chuKyNam, sMax), 0.96, 0.01, ' s');
  kiem('Trái Đất ngân mỗi 4 giây', giayThatMoiVong(ht('dat').chuKyNam, sMax), 4, 0.01, ' s');
  kiem('Sao Hỏa ngân mỗi 7,5 giây', giayThatMoiVong(ht('hoa').chuKyNam, sMax), 7.5, 0.05, ' s');
  const sNgoai = 0.25;
  kiemDung(`cả tám hành tinh: Sao Thủy sẽ ngân ${(1 / giayThatMoiVong(ht('thuy').chuKyNam, sNgoai)).toFixed(1)} lần mỗi giây (quá dày nên tắt)`, giayThatMoiVong(ht('thuy').chuKyNam, sNgoai) < 0.2);
  kiem('cả tám hành tinh: Sao Mộc ngân mỗi 5,4 giây', giayThatMoiVong(ht('moc').chuKyNam, sNgoai), 5.39, 0.01, ' s');
  const tiLe = giayThatMoiVong(ht('hoa').chuKyNam, sMax) / giayThatMoiVong(ht('dat').chuKyNam, sMax);
  kiem('nhịp nốt tỉ lệ đúng với chu kỳ quỹ đạo (Hỏa/Đất)', tiLe, ht('hoa').chuKyNam / ht('dat').chuKyNam, 1e-12);
}
kiem('trạm quay 0,6 c: một vòng (một tiếng ngân) mỗi 17,8 giây mô hình = 22,2 giây thật', buocLoXo(R_TRAM, 0.6) / TOC_BAY_GIO, 22.25, 0.01, ' s');

tongKet();
