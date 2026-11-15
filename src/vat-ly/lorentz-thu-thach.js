// Đích của các thử thách và các phép quy đổi âm thanh của Bài 6 (Bản 3). Dùng chung cho bài học và bộ kiểm số
// kiem-tra/kiem-lorentz.mjs. Đơn vị c = 1. Không đụng tới three.js.

import { gamma, congVanToc, sinhDoi } from './lorentz.js';

// «Bây giờ» của khung đang nhìn đi lên 1,1 đơn vị thời gian mỗi giây thật.
export const TOC_NAY = 1.1;
// Đồng hồ ánh sáng của bài: hai gương cách nhau h = 1, một tích (đi lên rồi về) dài 2h/c = 2 đơn vị thời gian riêng.
export const NHIP_DONG_HO = 2;
// Khoảng cách giữa hai tiếng «tích» nghe được (giây thật), với đồng hồ có hệ số γ so với khung đang nhìn.
export const giayThatMoiTich = (g = 1) => (NHIP_DONG_HO * g) / TOC_NAY;

// Đồng thời tương đối: hai chớp ở x = ±L cùng lúc theo phòng thí nghiệm; theo tàu bay β chúng cách nhau 2γβL.
export const dtDongThoi = (b, L) => 2 * gamma(b) * b * L;
// Anh em sinh đôi: người đi trẻ hơn bao nhiêu năm khi gặp lại.
export const chenhTuoi = (L, b) => { const s = sinhDoi(L, b); return s.T - s.Tdi; };
// Tốc độ phải bắn so với tàu (bay u) để vật đi w so với phòng thí nghiệm: phép cộng vận tốc đảo ngược.
export const vanTocBan = (u, w) => (w - u) / (1 - u * w);

export const THU_THACH_B6 = {
  // bước 2: γ = 2 (đồng hồ trên tàu tích một lần thì đồng hồ phòng thí nghiệm tích hai lần)
  gamma2: { gamma: 2, dungSai: 0.03 },
  // bước 3: theo tàu, chớp B nổ trước chớp A đúng 6 đơn vị thời gian (hai chớp ở x = ±3)
  dongThoi: { dt: 6, L: 3, dungSai: 0.15 },
  // bước 4: phòng thí nghiệm đo thước (độ dài riêng 4) chỉ còn 3
  thuoc: { L: 3, L0: 4, dungSai: 0.05 },
  // bước 6: tàu bay 0,8 c; vật bắn ra phải đi 0,9 c so với phòng thí nghiệm
  cong: { u: 0.8, w: 0.9, dungSaiU: 0.01, dungSai: 0.005 },
  // bước 7: khi gặp lại, người đi trẻ hơn đúng 5 năm
  sinhDoi: { chenh: 5, dungSai: 0.1 },
};

// Kiểm điều kiện đạt của từng thử thách (bài học và bộ kiểm số gọi cùng một hàm).
export const datThuThach = {
  gamma2: (b) => Math.abs(gamma(b) - THU_THACH_B6.gamma2.gamma) <= THU_THACH_B6.gamma2.dungSai,
  dongThoi: (b) => Math.abs(dtDongThoi(b, THU_THACH_B6.dongThoi.L) - THU_THACH_B6.dongThoi.dt) <= THU_THACH_B6.dongThoi.dungSai,
  thuoc: (b) => Math.abs(THU_THACH_B6.thuoc.L0 / gamma(b) - THU_THACH_B6.thuoc.L) <= THU_THACH_B6.thuoc.dungSai,
  cong: (u, v) => Math.abs(u - THU_THACH_B6.cong.u) <= THU_THACH_B6.cong.dungSaiU && v < 1 && Math.abs(congVanToc(u, v) - THU_THACH_B6.cong.w) <= THU_THACH_B6.cong.dungSai,
  sinhDoi: (L, b) => Math.abs(chenhTuoi(L, b) - THU_THACH_B6.sinhDoi.chenh) <= THU_THACH_B6.sinhDoi.dungSai,
};
