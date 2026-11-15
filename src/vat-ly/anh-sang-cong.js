// Các phép tính phụ cho Bài 14 «Ánh sáng bị bẻ cong» (bầu trời bị bẻ cong, thấu kính hấp dẫn kéo được, thử thách).
// Thuần số, không đụng three.js. Đơn vị: rs = 1 trừ khi ghi khác. Kiểm ở kiem-tra/kiem-phan-4-cu.mjs.

import { gocLechAnhSang, gocLechXapXi, B_TOI_HAN } from './schwarzschild.js';

// ---------------------------------------------------------------------------
// Bảng góc lệch toàn phần α(b) cho tia tới từ vô cực và đi ra vô cực, dùng trong shader bầu trời.
// Biến của bảng: w = −ln(1 − b_c/b), chạy đều từ 0 (b = ∞) tới W_MAX (b sát b_c). Lý do chọn w: gần b_c góc lệch
// tăng như −ln(b − b_c), tức tăng đúng bằng w, nên bảng nội suy tuyến tính đều tay và ngoài bảng chỉ cần kéo dài
// với độ dốc 1 (tiệm cận đúng của lệch mạnh).
// ---------------------------------------------------------------------------
export const SO_O_BANG = 48;
export const W_MAX = 9;
export const bTuW = (w) => B_TOI_HAN / (1 - Math.exp(-w));

export function taoBangGocLech(n = SO_O_BANG, wMax = W_MAX) {
  const bang = new Float32Array(n);
  for (let i = 1; i < n; i++) {
    const b = bTuW((wMax * i) / (n - 1));
    // tia rất xa: dùng khai triển trường yếu (sai khác dưới 10⁻⁵ rad ở b > 60); còn lại tích phân RK4
    bang[i] = b > 60 ? gocLechXapXi(b) : gocLechAnhSang(b, { xa: 600, heSo: 0.01 });
  }
  return bang;
}

// Tra bảng giống hệt shader (để bộ kiểm đo sai số nội suy).
export function traGocLech(bang, b, wMax = W_MAX) {
  if (b < B_TOI_HAN) return null;
  const n = bang.length;
  const w = -Math.log(Math.max(1 - B_TOI_HAN / b, 1e-12));
  const k = (w / wMax) * (n - 1);
  if (k >= n - 1) return bang[n - 1] + (w - wMax);
  const i = Math.floor(k), t = k - i;
  return bang[i] + (bang[i + 1] - bang[i]) * t;
}

// Phần góc lệch còn phải nhận trên đoạn từ chỗ người nhìn (ở toạ độ x0 dọc tia, tính từ điểm gần tâm nhất) ra tới vô cực,
// theo gần đúng đường thẳng: ∫ b·dx/(b² + x²)^{3/2} từ x0 tới ∞, chia cho tích phân trên cả đường (bằng 2/b).
export const phanLechConLai = (x0, b) => 0.5 * (1 - x0 / Math.hypot(x0, b));

// ---------------------------------------------------------------------------
// Thấu kính điểm khi hấp dẫn yếu. Mọi độ dài cùng một đơn vị; rs là bán kính Schwarzschild trong đơn vị ấy.
// ---------------------------------------------------------------------------
// Bán kính Einstein (radian): θ_E² = 2·rs·D_LS/(D_L·D_S), vì 4GM/c² = 2rs.
export const banKinhEinstein = (rs, DL, DLS) => Math.sqrt((2 * rs * DLS) / (DL * (DL + DLS)));

// Hai ảnh của nguồn lệch β (đơn vị θ_E): θ± = (β ± √(β² + 4))/2.
export const haiAnh = (beta) => [(beta + Math.sqrt(beta * beta + 4)) / 2, (beta - Math.sqrt(beta * beta + 4)) / 2];

// Độ phóng đại tổng của hai ảnh (nguồn điểm): μ = (β² + 2)/(β·√(β² + 4)).
export const doPhongDai = (beta) => (beta * beta + 2) / (Math.max(Math.abs(beta), 1e-9) * Math.sqrt(beta * beta + 4));

// Khoảng ngắm b (đơn vị rs) cho góc lệch toàn phần đúng bằng «goc» (radian), tìm trên [bTren, bDuoi] với bTren > bDuoi > b_c.
export function bTheoGocLech(goc, bDuoi = B_TOI_HAN + 1e-3, bTren = 60) {
  const f = (b) => gocLechAnhSang(b, { xa: 400, heSo: 0.02 }) - goc;   // giảm dần theo b
  let a = bDuoi, c = bTren;
  for (let i = 0; i < 60; i++) { const m = (a + c) / 2; if (f(m) > 0) a = m; else c = m; }
  return (a + c) / 2;
}
