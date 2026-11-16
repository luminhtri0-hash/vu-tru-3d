// Bài 9, bước 8: thời gian riêng của quả bóng ném lên rồi bắt lại, so ba đường thế giới nối cùng hai sự kiện.
// Vật chậm, gần mặt đất (trường yếu): nhịp đồng hồ trên vật ≈ 1 + gz/c² − v²/(2c²) so với đồng hồ đứng yên ở tay.
// Mọi đường thử có dạng parabol z(t) = 4A·t(T − t)/T² (đỉnh A ở giữa chuyến), nên hai tích phân tính được gọn:
//   ∫z dt = (2/3)·A·T,     ∫v² dt = 16A²/(3T).
// Đường trắc địa (ném lên rồi rơi tự do) có A = gT²/8; mọi A khác cho thời gian riêng ít hơn.
// Phép kiểm: kiem-tra/kiem-thoi-gian.mjs.
import { C } from './hang-so.js';

export const G_BONG = 9.8;        // gia tốc rơi dùng trong lời giảng (m/s²)
export const T_BONG = 2;          // ném rồi bắt lại sau 2 giây
const C2 = C * C;

// Đỉnh của đường trắc địa: bóng ném lên với v₀ = gT/2, lên cao gT²/8 (4,9 m với T = 2 s).
export const dinhTracDia = (T = T_BONG, g = G_BONG) => (g * T * T) / 8;

// Độ cao, vận tốc theo thời gian trên đường có đỉnh A.
export const doCao = (A, t, T = T_BONG) => (4 * A * t * (T - t)) / (T * T);
export const vanToc = (A, t, T = T_BONG) => (4 * A * (T - 2 * t)) / (T * T);

// Phần lợi do ở cao: (g/c²)∫z dt (giây).
export const loiDoCao = (A, T = T_BONG, g = G_BONG) => (g / C2) * (2 / 3) * A * T;
// Phần thiệt do tốc độ: (1/2c²)∫v² dt (giây).
export const thietTocDo = (A, T = T_BONG) => (8 * A * A) / (3 * T * C2);
// Thời gian riêng thêm so với đứng yên ở tay suốt T (giây).
export const thoiGianThem = (A, T = T_BONG, g = G_BONG) => loiDoCao(A, T, g) - thietTocDo(A, T);

// Thời gian riêng thêm tích luỹ tới thời điểm t (cho số chạy theo quả bóng): ∫₀ᵗ (gz/c² − v²/2c²) dt'.
export function thoiGianThemToi(A, t, T = T_BONG, g = G_BONG) {
  const k = (4 * A) / (T * T);
  const tichZ = k * ((T * t * t) / 2 - (t * t * t) / 3);                  // ∫₀ᵗ z
  const tichV2 = k * k * ((T * T * t) - 2 * T * t * t + (4 * t * t * t) / 3);   // ∫₀ᵗ (T − 2t')² · k²
  return (g / C2) * tichZ - tichV2 / (2 * C2);
}
