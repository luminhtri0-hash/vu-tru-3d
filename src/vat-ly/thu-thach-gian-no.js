// Con số của phần tương tác Bài 18 «Vũ trụ giãn nở» (Bản 3): đích và dung sai của các thử thách,
// quy đổi tiếng «bíp» theo dịch chuyển đỏ. Chỉ công thức, không dùng three.js, để bộ kiểm số đọc được
// (kiem-tra/kiem-song-va-gian-no.mjs, mục «BÀI 18 · 4»).

import { GYR_TREN_H0 } from './vu-tru-hoc.js';

// Tiếng bíp: vạch đỏ Hα của hiđrô (656,3 nm, khoảng 4,57 × 10¹⁴ Hz) được quy đổi thành nốt 880 Hz cho tai nghe được.
// Ánh sáng tới nhà có dịch chuyển đỏ z thì tần số chia cho 1 + z và nhịp các đỉnh sóng thưa ra 1 + z lần;
// tiếng bíp nhận được làm đúng như vậy: cao độ 880/(1 + z) Hz, chu kỳ 0,9 × (1 + z) giây.
export const BIP_GOC = 880;
export const BIP_CHU_KY = 0.9;
export const tanSoBip = (z) => BIP_GOC / (1 + z);
export const chuKyBip = (z) => BIP_CHU_KY * (1 + z);
export const TAN_SO_H_ALPHA = 299792458 / 656.28e-9;   // Hz

// Thử thách (đích, dung sai).
export const THU_THACH = {
  nuaC: { v: 0.5, sai: 0.03 },          // bước 1: thiên hà mẫu lùi 0,5 c hôm nay
  z2: { z: 2, sai: 0.15 },              // bước 3: thời điểm mà ánh sáng phát ra tới ta với z = 2 (a = 1/3)
  dinh: { H: 3 },                       // bước 4: vũ trụ quá đặc ngừng giãn, |H| < 3 km/s/Mpc
  bangC: { v: 1, sai: 0.04 },           // bước 8: thiên hà mẫu nằm trên mặt cầu Hubble, lùi 1 ± 0,04 c
};

// Vũ trụ chỉ có vật chất, Ωm > 1 (bỏ bức xạ): lúc lớn nhất ở giữa đời, t = π Ωm / (2 H0 (Ωm − 1)^1,5).
export const tDinhVuTruDong = (H0, Om) => ((Math.PI * Om) / (2 * (Om - 1) ** 1.5)) * (GYR_TREN_H0 / H0);
// Kích thước lớn nhất a = Ωm / (Ωm − 1).
export const aDinhVuTruDong = (Om) => Om / (Om - 1);

// Vũ trụ phẳng ΛCDM: tốc độ lùi (theo c) của thiên hà có khoảng cách đồng chuyển chi (tỉ năm ánh sáng) lúc hệ số tỉ lệ a:
// v/c = ȧ·χ = H0·χ·√(Ωr/a² + Ωm/a + ΩΛ a²), với H0 tính bằng 1/tỉ năm.
export function vLuiTheoC({ H0 = 67.4, Om = 0.315, OL = 0.685, Or = 9.2e-5 } = {}, chi, a) {
  const h = H0 / GYR_TREN_H0;
  return h * chi * Math.sqrt(Or / (a * a) + Om / a + OL * a * a);
}
