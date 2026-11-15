// Đồng hồ quanh Trái Đất (Bài 9, Bản 3): chênh nhịp theo độ cao gần mặt đất và độ lệch của đồng hồ trên vệ tinh
// quỹ đạo tròn so với đồng hồ mặt đất (bỏ qua Trái Đất tự quay). Công thức trường yếu như lời giảng Bài 9.
// Phép kiểm: kiem-tra/kiem-phan-3-cu.mjs, mục «Bài 9 · Bản 3».

import { C, GM_TRAI_DAT, R_TRAI_DAT_KM, NGAY_GIAY } from './hang-so.js';

export const G_BAI9 = 9.8;                                   // gia tốc rơi dùng trong lời giảng Bài 9 (m/s²)
export const R_TD_M = R_TRAI_DAT_KM * 1000;
export const R_GPS = 26560 / R_TRAI_DAT_KM;                  // bán kính quỹ đạo GPS, theo bán kính Trái Đất

// Đồng hồ ở độ cao h (mét) nhanh hơn đồng hồ mặt đất một phần gh/c².
export const chenhDoCao = (h, g = G_BAI9) => (g * h) / (C * C);
// Độ cao để đồng hồ nhanh hơn mặt đất ns phần tỉ giây mỗi ngày.
export const doCaoChoNsNgay = (ns, g = G_BAI9) => ((ns * 1e-9) / NGAY_GIAY) * (C * C) / g;

// Vệ tinh trên quỹ đạo tròn bán kính r (theo bán kính Trái Đất R), so với đồng hồ đứng yên ở mặt đất:
//   phần hấp dẫn (nhanh lên) GM/c²·(1/R − 1/r), phần tốc độ (chậm đi) v²/(2c²) = GM/(2rc²).
export const vQuyDao = (r) => Math.sqrt(GM_TRAI_DAT / (r * R_TD_M));
export const phanHapDan = (r) => (GM_TRAI_DAT / (C * C)) * (1 / R_TD_M - 1 / (r * R_TD_M));
export const phanTocDo = (r) => GM_TRAI_DAT / (2 * r * R_TD_M * C * C);
export const chenhVeTinh = (r) => phanHapDan(r) - phanTocDo(r);
// Đổi ra micro giây mỗi ngày.
export const usHapDan = (r) => phanHapDan(r) * NGAY_GIAY * 1e6;
export const usTocDo = (r) => phanTocDo(r) * NGAY_GIAY * 1e6;
// Quỹ đạo mà hai phần bù nhau đúng: 1/R = 3/(2r) ⇒ r = 1,5 R.
export const R_BU_TRU = 1.5;
