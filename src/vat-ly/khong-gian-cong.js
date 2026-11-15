// Các phép tính phụ cho Bài 11 «Không gian cong quanh một khối lượng» (thử thách, thước kéo được).
// Thuần số, không đụng three.js. Đơn vị: bán kính vật thể R = 1 (lỗ đen: rs = 1). Kiểm ở kiem-tra/kiem-phan-3-cu.mjs.

import { khoangCachThat } from './schwarzschild.js';

// Chia đôi trên [a, b] cho hàm đơn điệu f, trả nghiệm của f = 0.
function chiaDoi(f, a, b, lan = 200) {
  let fa = f(a);
  for (let i = 0; i < lan; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}

// Tỉ số «đo bằng thước / hiệu bán kính chu vi» trên đoạn [r1, r2] (cả hai ở ngoài khối lượng).
export const tiSoThuoc = (r1, r2, rs) => khoangCachThat(r1, r2, rs) / (r2 - r1);

// Bán kính chu vi r2 sao cho từ r1 đi ra, thước đo được đúng l.
export const rTheoThuoc = (r1, l, rs) => chiaDoi((r) => khoangCachThat(r1, r, rs) - l, r1, r1 + l);

// Độ đặc rs/R sao cho từ bề mặt (r = 1) lên vòng r = 2, thước dài hơn hiệu bán kính đúng một tỉ lệ «du» (0,1 = 10%).
export const doDacTheoDu = (du) => chiaDoi((c) => khoangCachThat(1, 2, c) - (1 + du), 1e-9, 0.86);

// Lỗ đen (rs = 1): bán kính chu vi r2 sao cho đoạn từ chân trời tới r2 có tỉ số thước / hiệu bán kính đúng k.
export const rLoDenTheoTiSo = (k) => chiaDoi((r) => tiSoThuoc(1, r, 1) - k, 1.0001, 1e4);

// Góc dốc của mặt nhúng ở mép một ngôi sao có độ đặc C = rs/R: tan θ = √(C/(1 − C)); thước/hiệu bán kính = 1/√(1 − C).
export const gocDocMep = (C) => Math.atan(Math.sqrt(C / (1 - C)));
