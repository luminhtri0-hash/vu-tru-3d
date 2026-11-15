// Công thức nhỏ và con số đích của Bài 4 «Sự kiện và đường thế giới» (Bản 3: thử thách, âm thanh).
// Đơn vị c = 1: thời gian đo bằng giây, độ dài bằng giây ánh sáng. Không đụng tới three.js để bộ kiểm số chạy bằng node.

// Góc giữa đường thế giới thẳng và trục thời gian (độ): tan θ = v/c.
export const gocNghiengDo = (v) => (Math.atan(v) * 180) / Math.PI;
// Tốc độ (phần c) cho đường thế giới nghiêng θ độ.
export const vTuGoc = (doGoc) => Math.tan((doGoc * Math.PI) / 180);

// Trạm quay: bán kính quỹ đạo trong mô hình (giây ánh sáng).
export const R_TRAM = 1.7;
// Bước lò xo của chuyển động tròn: cT = 2πR·c/v (c = 1 nên bằng 2πR/v, đơn vị giây ánh sáng).
export const buocLoXo = (R, v) => (2 * Math.PI * R) / v;
export const vTuBuoc = (R, buoc) => (2 * Math.PI * R) / buoc;

// Tấm «bây giờ» tự chạy bao nhiêu giây mô hình trong một giây thật. Mỗi giây mô hình là một tiếng «tích».
export const TOC_BAY_GIO = 0.8;
export const giayThatMoiTich = () => 1 / TOC_BAY_GIO;

// Hệ Mặt Trời trong không-thời gian: đường thế giới trôi xuống TROI đơn vị hiển thị mỗi giây thật; khi trục thời gian
// có s đơn vị hiển thị cho mỗi năm thì một giây thật ứng với TROI/s năm. Hành tinh chu kỳ P năm ngân một nốt mỗi
// P·s/TROI giây thật.
export const TROI_HMT = 0.55;
export const giayThatMoiVong = (chuKyNam, sMoiNam) => (chuKyNam * sMoiNam) / TROI_HMT;

// Tia nắng từ Mặt Trời tới một hành tinh cách d AU. Khi trục thời gian bị nén n lần, phần đứng của tia (thời gian bay
// d/c, đổi ra đơn vị hiển thị) chỉ bằng 1/n lần phần ngang, nên tia hợp với mặt «hôm nay» một góc có tan = 1/n.
// Đúng tỉ lệ thật (n = 1) thì tia nghiêng đúng 45°.
export const gocTiaNangDo = (n) => (Math.atan(1 / n) * 180) / Math.PI;

// Đích và dung sai của các thử thách trong bài.
export const THU_THACH_B4 = {
  // bước 1: đưa «bây giờ» tới đúng lúc sự kiện «hai tàu gặp nhau» (t = 4,5 giây)
  gap: { t: 4.5, dungSai: 0.15 },
  // bước 3: đường thế giới của con tàu nghiêng đúng 35° so với trục thời gian
  nghieng: { goc: 35, dungSai: 0.7 },
  // bước 4: đèn bật lúc t = 1; tia sáng đã cách ngôi nhà đúng 3 giây ánh sáng
  tiaSang: { tPhat: 1, khoang: 3, dungSai: 0.15 },
  // bước 5: bước lò xo của trạm quay dài đúng 15 giây ánh sáng
  loXo: { buoc: 15, dungSai: 0.3 },
  // bước 7: kéo trục thời gian tới mức tia nắng hợp với tấm «hôm nay» đúng 30° (nén √3 lần)
  tiaNang: { goc: 30, dungSai: 1 },
};
