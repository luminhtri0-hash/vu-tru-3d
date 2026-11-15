// Công thức của thuyết tương đối hẹp dùng cho Bài 6 (phép biến đổi Lorentz).
// Đơn vị: c = 1 cho các hàm hình học (vận tốc là β = v/c); các hàm số liệu thật dùng hệ SI.
// Không đụng tới three.js, để bộ kiểm số chạy được bằng node.

import { C, NGAY_GIAY } from './hang-so.js';

// Hệ số Lorentz γ = 1/√(1 − β²).
export const gamma = (b) => 1 / Math.sqrt(1 - b * b);

// Độ nhanh (rapidity) φ: β = tanh φ, γ = cosh φ, γβ = sinh φ.
export const doNhanh = (b) => Math.atanh(b);

// Phép biến đổi Lorentz theo phương x: (t, x) của khung cũ → (t′, x′) của khung đi với vận tốc β.
export function bienDoi(t, x, b) {
  const g = gamma(b);
  return [g * (t - b * x), g * (x - b * t)];
}

// Khoảng không-thời gian s² = −t² + x² + y² (c = 1).
export const khoang2 = (t, x, y = 0) => -t * t + x * x + y * y;

// Cộng vận tốc cùng phương: w = (u + v)/(1 + uv).
export const congVanToc = (u, v) => (u + v) / (1 + u * v);

// Đồng hồ ánh sáng: hai gương cách nhau h (đơn vị độ dài, c = 1). Một nhịp (đi và về) kéo dài 2h khi đứng yên.
// Khi đồng hồ bay với vận tốc β, tia sáng đi đường chéo: (t/2)² = h² + (βt/2)²  →  t = 2h/√(1 − β²) = 2hγ.
export const nhipDongHo = (h, b) => (2 * h) / Math.sqrt(1 - b * b);

// Nghịch lý anh em sinh đôi: đi tới khoảng cách L (năm ánh sáng) với tốc độ β rồi quay về.
// T: thời gian người ở nhà chờ (năm); Tdi: thời gian riêng của người đi;
// nhay: «bây giờ» của người đi nhảy bao nhiêu năm trên đồng hồ ở nhà lúc quay đầu (2βL).
export function sinhDoi(L, b) {
  const T = (2 * L) / b;
  const g = gamma(b);
  return { T, Tdi: T / g, g, nhay: 2 * b * L, truocQuay: L / b - b * L, sauQuay: L / b + b * L };
}

// Muon: thời gian sống trung bình khi đứng yên (PDG).
export const TAU_MUON_S = 2.1969811e-6;
export function muon(b) {
  const g = gamma(b);
  return {
    g,
    songS: g * TAU_MUON_S,                    // thời gian sống trung bình đo từ mặt đất
    quangDuongM: g * b * C * TAU_MUON_S,      // quãng đường trung bình đi được
    neuKhongGianM: b * C * TAU_MUON_S,        // quãng đường nếu không có giãn thời gian
  };
}

// Đồng hồ bay với tốc độ v (m/s) chậm đi bao nhiêu giây sau một ngày, chỉ tính hiệu ứng tốc độ.
export const chamMoiNgay = (vMS) => (1 - Math.sqrt(1 - (vMS * vMS) / (C * C))) * NGAY_GIAY;
// Gần đúng bậc nhất: v²/(2c²) × 86 400 giây.
export const chamMoiNgayGanDung = (vMS) => ((vMS * vMS) / (2 * C * C)) * NGAY_GIAY;

// Khối lượng nghỉ của proton (CODATA 2018), GeV.
export const M_PROTON_GEV = 0.93827208816;
// γ = E/(mc²) với E là năng lượng toàn phần.
export const gammaTuNangLuong = (eGeV, mGeV = M_PROTON_GEV) => eGeV / mGeV;

// Vận tốc bốn chiều u = γ(1, β): «độ dài» −u_t² + u_x² luôn bằng −1 (tức độ lớn bằng c).
export function vanToc4(b) { const g = gamma(b); return [g, g * b]; }
