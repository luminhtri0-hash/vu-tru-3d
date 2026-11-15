// Đám hạt rơi tự do của Bài 12 (Bản 3): dựng đám hạt, trường hấp dẫn của một quả cầu vật chất đồng đều
// (trong và ngoài), đo biến dạng bằng ba trục chính, mô phỏng trọn một lần thả để tính đích của thử thách,
// và các quy đổi âm thanh của bài. Toán thuần, không đụng tới three.js. Bộ kiểm: kiem-tra/kiem-thuy-trieu.mjs.

import { giaToc, diemCau, hiepPhuong, triRieng3, det3, trieuCanBang, D_MAT_TRANG } from './thuy-trieu.js';

// ---------- Đám hạt ----------
export const N_MAT = 420, N_TRONG = 180, N_DAU = 14;     // hạt trên mặt, bên trong, và 14 hạt đánh dấu (6 trục + 8 chéo)
export const N_HAT = N_MAT + N_TRONG + N_DAU;
export const RC = 1.1;                                   // bán kính đám hạt lúc thả
export const DT_MO_PHONG = 1 / 240;                      // bước tích phân (đơn vị thời gian mô phỏng)
export const GM_HANH_TINH = 30;                          // chế độ «ngoài vật chất»
export const R_HANH_TINH = 2.4;
export const R_KHOI = 7.6;                               // quả cầu vật chất đồng đều (chế độ «trong»)
export const W2_KHOI = (2 * Math.PI / 16) ** 2;          // 4πGρ/3 bên trong quả cầu ấy
export const R_THA_MAC_DINH = 11;                        // chỗ thả mặc định ở chế độ «ngoài»

// Vị trí ban đầu (so với tâm đám) của mọi hạt: mặt ngoài xoắn Fibonacci, ba lớp vỏ bên trong (xoay lệch nhau
// để không thẳng hàng), rồi 14 hạt đánh dấu ±x, ±y, ±z và 8 hướng chéo. Giống hệt Bản 2.
export function taoDamHat() {
  const x0 = new Float64Array(3 * N_HAT);
  x0.set(diemCau(N_MAT, 0, RC));
  const lop = [0.3, 0.55, 0.8], nLop = N_TRONG / lop.length;
  lop.forEach((k, j) => {
    const q = diemCau(nLop, 0, RC * k);
    for (let i = 0; i < nLop; i++) {
      const c = Math.cos(j + 1), sn = Math.sin(j + 1), X = q[3 * i], Z = q[3 * i + 2];
      const d = 3 * (N_MAT + j * nLop + i);
      x0[d] = c * X - sn * Z; x0[d + 1] = q[3 * i + 1]; x0[d + 2] = sn * X + c * Z;
    }
  });
  const huong = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) huong.push([sx / Math.sqrt(3), sy / Math.sqrt(3), sz / Math.sqrt(3)]);
  huong.forEach((h, k) => { const i = N_MAT + N_TRONG + k; x0[3 * i] = RC * h[0]; x0[3 * i + 1] = RC * h[1]; x0[3 * i + 2] = RC * h[2]; });
  return x0;
}

// ---------- Trường ----------
// Quả cầu vật chất đồng đều bán kính R: bên trong a = −(GM/R³)·r (= −(4πGρ/3)·r), bên ngoài a = −GM·r/|r|³.
// Kéo đám hạt từ trong ra ngoài quả cầu là đổi từ «trong vật chất» sang «ngoài vật chất» mà không đổi trường.
export const truongCauDac = (w2 = W2_KHOI, R = R_KHOI) => ({ loai: 'cau-dac', w2, R, GM: w2 * R ** 3 });

export function giaTocT(truong, x, y, z, out) {
  if (truong.loai !== 'cau-dac') return giaToc(truong, x, y, z, out);
  const r2 = x * x + y * y + z * z, R = truong.R;
  const k = r2 < R * R ? -truong.w2 : -truong.GM / (r2 * Math.sqrt(r2));
  out[0] = k * x; out[1] = k * y; out[2] = k * z;
  return out;
}
const _g = [0, 0, 0];
export function khoiGiaTocT(truong, x, a, n) {
  for (let i = 0; i < n; i++) {
    giaTocT(truong, x[3 * i], x[3 * i + 1], x[3 * i + 2], _g);
    a[3 * i] = _g[0]; a[3 * i + 1] = _g[1]; a[3 * i + 2] = _g[2];
  }
}
// Verlet vận tốc một bước (như buocVerlet của thuy-trieu.js, thêm trường «cau-dac»).
export function buocVerletT(truong, x, v, a, n, dt) {
  for (let i = 0; i < 3 * n; i++) { v[i] += 0.5 * dt * a[i]; x[i] += dt * v[i]; }
  khoiGiaTocT(truong, x, a, n);
  for (let i = 0; i < 3 * n; i++) v[i] += 0.5 * dt * a[i];
}
// V̈/V lúc thả của một quả cầu nhỏ quanh điểm r: vết của tenxơ thủy triều.
// Ngoài vật chất bằng 0; trong quả cầu đồng đều bằng −3w² = −4πGρ.
export const vddvLucTha = (truong, r) => (truong.loai === 'cau-dac' ? (r < truong.R ? -3 * truong.w2 : 0)
  : truong.loai === 'trong' ? -3 * truong.w2 : truong.loai === 'toi' ? 3 * truong.H2 : 0);

// ---------- Đo biến dạng ----------
// Từ ma trận hiệp phương sai: ba trục chính, trục «dọc» (gần hướng u nhất), tỉ số trục so với lúc thả, thể tích.
// lamda0: trung bình ba trị riêng lúc thả; V0: √det lúc thả. Kết quả ghi vào kq (không cấp phát).
export function doBienDang(x, n, lamda0, V0, u, kq) {
  hiepPhuong(x, n, kq.cov, kq.tam);
  triRieng3(kq.cov, kq.gt, kq.vtr);
  const vtr = kq.vtr;
  let kd = 0, tot = -1;
  for (let k = 0; k < 3; k++) { const d = Math.abs(vtr[k] * u[0] + vtr[3 + k] * u[1] + vtr[6 + k] * u[2]); if (d > tot) { tot = d; kd = k; } }
  const ti = (k) => Math.sqrt(Math.max(0, kq.gt[k]) / lamda0);
  kq.kd = kd;
  kq.ar = ti(kd);
  kq.at = (ti((kd + 1) % 3) + ti((kd + 2) % 3)) / 2;
  kq.V = Math.sqrt(Math.max(0, det3(kq.cov))) / V0;
  kq.r = Math.hypot(kq.tam[0], kq.tam[1], kq.tam[2]);
  return kq;
}
export const taoKetQuaDo = () => ({ cov: new Float64Array(9), tam: [0, 0, 0], gt: [0, 0, 0], vtr: new Float64Array(9), kd: 0, ar: 1, at: 1, V: 1, r: 0 });

// Trạng thái một lần thả: đám hạt (đúng như trong cảnh) đặt quanh «tam», đứng yên. Như trong cảnh, đám hạt được
// xoay quanh trục đứng cho hạt «+x» nằm theo phương bán kính của chỗ thả (góc atan2(−z, x) trong mặt phẳng xz).
export function taoLanTha(truong, tam, x0 = taoDamHat()) {
  const n = N_HAT;
  const x = new Float64Array(3 * n), v = new Float64Array(3 * n), a = new Float64Array(3 * n);
  const g = Math.atan2(-tam[2], tam[0]), c = Math.cos(g), sn = Math.sin(g);
  for (let i = 0; i < n; i++) {
    const X = x0[3 * i], Y = x0[3 * i + 1], Z = x0[3 * i + 2];
    x[3 * i] = c * X + sn * Z + tam[0]; x[3 * i + 1] = Y + tam[1]; x[3 * i + 2] = -sn * X + c * Z + tam[2];
  }
  khoiGiaTocT(truong, x, a, n);
  const kq = taoKetQuaDo();
  hiepPhuong(x, n, kq.cov, kq.tam);
  triRieng3(kq.cov, kq.gt, kq.vtr);
  const lamda0 = (kq.gt[0] + kq.gt[1] + kq.gt[2]) / 3, V0 = Math.sqrt(det3(kq.cov));
  return { truong, x, v, a, n, lamda0, V0, t: 0, kq };
}

// Mô phỏng một lần thả tới thời điểm tDen, theo đúng bước tích phân của cảnh. Trả về số đo lúc tDen và cờ «cham»
// nếu đám hạt đã chạm mặt hành tinh trước đó (cảnh dừng lại khi chạm). Dùng cho bộ kiểm số và gợi ý thử thách.
export function moPhongTha(truong, tam, tDen, { rCham = 0 } = {}) {
  const s = taoLanTha(truong, tam);
  const u = huongDoc(truong, tam);
  let cham = false;
  const soBuoc = Math.round(tDen / DT_MO_PHONG);
  for (let k = 0; k < soBuoc; k++) {
    buocVerletT(truong, s.x, s.v, s.a, s.n, DT_MO_PHONG);
    if (rCham > 0) for (let i = 0; i < s.n; i++) if (Math.hypot(s.x[3 * i], s.x[3 * i + 1], s.x[3 * i + 2]) < rCham) { cham = true; break; }
    if (cham) break;
  }
  doBienDang(s.x, s.n, s.lamda0, s.V0, u, s.kq);
  return { ...s.kq, cham, x: s.x };
}
// Hướng «dọc» để chọn trục: phương bán kính (trường có tâm) hoặc trục x (năng lượng tối).
export function huongDoc(truong, tam) {
  const r = Math.hypot(tam[0], tam[1], tam[2]);
  if (truong.loai === 'toi' || r < 1e-9) return [1, 0, 0];
  return [tam[0] / r, tam[1] / r, tam[2] / r];
}

// Tỉ số khoảng cách hai hạt đánh dấu i, j so với lúc thả (2·RC).
export const tiSoCap = (x, i, j) => Math.hypot(x[3 * i] - x[3 * j], x[3 * i + 1] - x[3 * j + 1], x[3 * i + 2] - x[3 * j + 2]) / (2 * RC);

// ---------- Đích của các thử thách ----------
// Bước 2: elipxoit dài gấp rưỡi lúc thả (trục dọc 1,5 lần) đúng lúc t = 3.
export const TT_TRUC_DOC = { t: 3, dich: 1.5, dungSai: 0.05 };
// Bước 7: độ kéo 2GM/r³ lúc thả gấp 8 lần chỗ thả mặc định (r = 11): r = 5,5.
export const TT_KEO_GAP = { dich: 8, dungSai: 0.6 };
export const tiSoKeo = (r, r0 = R_THA_MAC_DINH) => (r0 / r) ** 3;
// Bước 4: thả trọn ngoài quả cầu vật chất (tâm đám cách tâm quả cầu ít nhất R + RC): thể tích lúc t = 1,5 vẫn còn
// ít nhất 0,95 lần lúc thả (thả bên trong thì chỉ còn khoảng 0,57).
export const TT_THE_TICH = { t: 1.5, nguong: 0.95 };
// Bước 6: kéo Mặt Trăng ra xa để đỉnh bướu nước còn một nửa (0,178 ± 0,01 m).
export const TT_TRIEU = { dich: trieuCanBang(0) / 2, dungSai: 0.01 };
// Đỉnh bướu khi Mặt Trăng trên hình ở khoảng cách d (D_HINH = 10 ứng với khoảng cách thật trung bình).
export const D_HINH = 10;
export const dinhBuou = (dHinh) => trieuCanBang(0, undefined, undefined, undefined, D_MAT_TRANG * (dHinh / D_HINH));

// ---------- Âm thanh (quy đổi cho tai nghe) ----------
// Hai nốt kéo dài: nốt «kéo» có tần số tỉ lệ với trục dọc, nốt «ép» tỉ lệ với trục ngang, cùng xuất phát từ F0 lúc thả.
// Trục dài gấp đôi thì nốt cao lên đúng một quãng tám.
export const F0_KEO_EP = 330;
export const tanSoTruc = (tiSo, f0 = F0_KEO_EP) => Math.min(1600, Math.max(70, f0 * tiSo));
// Tiếng sóng ở thành phố ven biển: to và sáng lên khi nước lên. h: mực nước (m) so với trung bình.
export function tiengSong(h) {
  const k = Math.min(1, Math.max(0, (h + 0.2) / 0.56));
  return { doTo: 0.02 + 0.1 * k, tanSoLoc: 300 + 1500 * k };
}
