import { dich as dichChu } from '../ngon-ngu/dich.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('chieu-thu-tu', khoa, goc, thamSo);
// Hình học bốn chiều thuần (không dùng three.js), cho Bài 3 «Chiều thứ tư»:
//   - đếm đỉnh, cạnh, mặt, ô của khối lập phương n chiều;
//   - phép quay trong không gian bốn chiều (quay TRONG một mặt phẳng tọa độ);
//   - thiết diện của siêu lập phương và siêu cầu với siêu phẳng w = w0.
// Tọa độ viết theo thứ tự (x, y, z, w); chỉ số 0, 1, 2, 3.

// Tổ hợp chập k của n.
export function toHop(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

// Số phần tử k chiều của khối lập phương n chiều: C(n, k) · 2^(n−k).
// (k = 0: đỉnh; 1: cạnh; 2: mặt vuông; 3: ô lập phương; …)
export const demPhanTu = (n, k) => toHop(n, k) * 2 ** (n - k);

// ----- Siêu lập phương cạnh 2, tâm ở gốc -----
// Đỉnh i (0…15): tọa độ thứ k bằng +1 nếu bit k của i bằng 1, ngược lại bằng −1.
export const DINH_LP = Array.from({ length: 16 }, (_, i) => [0, 1, 2, 3].map((k) => ((i >> k) & 1 ? 1 : -1)));

// 32 cạnh: [đỉnh đầu, đỉnh cuối, hướng k]. Đỉnh đầu có bit k = 0.
export const CANH_LP = [];
for (let i = 0; i < 16; i++) for (let k = 0; k < 4; k++) if (!((i >> k) & 1)) CANH_LP.push([i, i | (1 << k), k]);

// 24 mặt vuông: bốn đỉnh theo thứ tự vòng quanh, kèm hai hướng a < b mà mặt trải theo.
export const MAT_LP = [];
for (let a = 0; a < 4; a++) {
  for (let b = a + 1; b < 4; b++) {
    const khac = [0, 1, 2, 3].filter((k) => k !== a && k !== b);
    for (let m = 0; m < 4; m++) {
      const goc = ((m & 1) << khac[0]) | (((m >> 1) & 1) << khac[1]);
      MAT_LP.push({ dinh: [goc, goc | (1 << a), goc | (1 << a) | (1 << b), goc | (1 << b)], a, b });
    }
  }
}

// 8 ô lập phương: tọa độ thứ k cố định bằng −1 (dau = 0) hoặc +1 (dau = 1); mỗi ô có 8 đỉnh, 12 cạnh.
export const O_LP = [];
for (let k = 0; k < 4; k++) {
  for (let dau = 0; dau < 2; dau++) {
    const trong = (i) => ((i >> k) & 1) === dau;
    O_LP.push({ k, dau, canh: CANH_LP.map((c, j) => (trong(c[0]) && trong(c[1]) ? j : -1)).filter((j) => j >= 0) });
  }
}

// ----- Phép quay bốn chiều -----
// Ma trận 4 × 4 lưu thành Float64Array(16), theo hàng: M[4·i + j].
export function maTranDonVi(out = new Float64Array(16)) {
  out.fill(0);
  out[0] = out[5] = out[10] = out[15] = 1;
  return out;
}

// Nhân bên trái M bởi phép quay góc «goc» (radian) TRONG mặt phẳng tọa độ (i, j):
// v_i' = cos·v_i − sin·v_j ;  v_j' = sin·v_i + cos·v_j. Mọi tọa độ khác giữ nguyên.
export function quayMatPhang(M, i, j, goc) {
  const c = Math.cos(goc), s = Math.sin(goc);
  for (let k = 0; k < 4; k++) {
    const a = M[4 * i + k], b = M[4 * j + k];
    M[4 * i + k] = c * a - s * b;
    M[4 * j + k] = s * a + c * b;
  }
  return M;
}

// out = M · v (v: mảng 4 số).
export function nhanVec(M, v, out = [0, 0, 0, 0]) {
  for (let i = 0; i < 4; i++) out[i] = M[4 * i] * v[0] + M[4 * i + 1] * v[1] + M[4 * i + 2] * v[2] + M[4 * i + 3] * v[3];
  return out;
}

// Hướng đặt «đỉnh trước»: ma trận trực chuẩn có hàng cuối (1, 1, 1, 1)/2, nên tọa độ w mới
// của đỉnh bằng một nửa tổng bốn tọa độ cũ: w = s/2 với s = x1 + x2 + x3 + x4.
export const DINH_TRUOC = [
  [1 / Math.SQRT2, -1 / Math.SQRT2, 0, 0],
  [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6), 0],
  [1 / Math.sqrt(12), 1 / Math.sqrt(12), 1 / Math.sqrt(12), -3 / Math.sqrt(12)],
  [0.5, 0.5, 0.5, 0.5],
];

// Ma trận quay tổng: out = R_xy · R_xw · R_yw · R_zw · O, với O là hướng đặt ban đầu.
// goc: { xy, xw, yw, zw } (radian); huong: 'mat' (mặt trước, O = đơn vị) hoặc 'dinh' (đỉnh trước).
export function maTranQuay(goc, huong = 'mat', out = new Float64Array(16)) {
  maTranDonVi(out);
  if (huong === 'dinh') for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) out[4 * i + j] = DINH_TRUOC[i][j];
  quayMatPhang(out, 2, 3, goc.zw || 0);
  quayMatPhang(out, 1, 3, goc.yw || 0);
  quayMatPhang(out, 0, 3, goc.xw || 0);
  quayMatPhang(out, 0, 1, goc.xy || 0);
  return out;
}

// ----- Lát cắt -----
// Bán kính mặt cầu thiết diện khi siêu phẳng w = w0 cắt siêu cầu bán kính R: r = √(R² − w0²).
export const banKinhLatCat = (R, w0) => Math.sqrt(Math.max(0, R * R - w0 * w0));

// Bộ nhớ dùng lại cho catLapPhuong4 (tạo một lần, không cấp phát mỗi khung hình).
export function taoBoCat() {
  return {
    soDa: 0,                                                       // số đa giác (mặt của thiết diện)
    da: Array.from({ length: 8 }, () => ({ n: 0, p: new Float64Array(36), o: 0 })), // mỗi ô cho ≤ 1 đa giác
    soDinh: 0, dinh: new Float64Array(96 * 3),                     // các đỉnh khác nhau của thiết diện
    soCanh: 0,                                                     // số cạnh của khối thiết diện
    tam: [0, 0, 0],
    _tam: new Float64Array(36), _goc: new Float64Array(12), _thu: new Int32Array(12),
  };
}

// Thiết diện của siêu lập phương với siêu phẳng w = w0.
//   W: Float64Array(64), tọa độ (x, y, z, w) của 16 đỉnh SAU khi quay (đỉnh i ở W[4i … 4i+3]).
//   Kết quả ghi vào kq (từ taoBoCat()): mỗi ô cắt ra một đa giác lồi, các đỉnh đã xếp theo vòng.
// Cách làm: với mỗi ô (khối lập phương 3 chiều), lấy giao của 12 cạnh với siêu phẳng; đỉnh nằm đúng
// trên siêu phẳng được lấy một lần (bỏ trùng); ô nằm trọn trong siêu phẳng thì bỏ qua (các ô kề
// nó đã cho đủ các mặt); bộ điểm suy biến (ít hơn 3 điểm, hoặc thẳng hàng) cũng bỏ qua.
export function catLapPhuong4(W, w0, kq, eps = 1e-9) {
  kq.soDa = 0; kq.soDinh = 0; kq.soCanh = 0;
  const tmp = kq._tam;
  const epsTrung = 1e-7;
  for (let oi = 0; oi < 8; oi++) {
    const o = O_LP[oi];
    // ô nằm trọn trong siêu phẳng?
    let trongMat = 0;
    for (let i = 0; i < 16; i++) if (((i >> o.k) & 1) === o.dau && Math.abs(W[4 * i + 3] - w0) < eps) trongMat++;
    if (trongMat === 8) continue;
    let n = 0;
    const them = (x, y, z) => {
      for (let q = 0; q < n; q++) {
        if (Math.abs(tmp[3 * q] - x) < epsTrung && Math.abs(tmp[3 * q + 1] - y) < epsTrung && Math.abs(tmp[3 * q + 2] - z) < epsTrung) return;
      }
      if (n >= 12) return;
      tmp[3 * n] = x; tmp[3 * n + 1] = y; tmp[3 * n + 2] = z; n++;
    };
    for (const j of o.canh) {
      const [a, b] = CANH_LP[j];
      const da = W[4 * a + 3] - w0, db = W[4 * b + 3] - w0;
      const aTren = Math.abs(da) < eps, bTren = Math.abs(db) < eps;
      if (aTren) them(W[4 * a], W[4 * a + 1], W[4 * a + 2]);
      if (bTren) them(W[4 * b], W[4 * b + 1], W[4 * b + 2]);
      if (!aTren && !bTren && da * db < 0) {
        const t = da / (da - db);
        them(W[4 * a] + t * (W[4 * b] - W[4 * a]), W[4 * a + 1] + t * (W[4 * b + 1] - W[4 * a + 1]), W[4 * a + 2] + t * (W[4 * b + 2] - W[4 * a + 2]));
      }
    }
    if (n < 3) continue;
    // trọng tâm và pháp tuyến (cách Newell)
    let cx = 0, cy = 0, cz = 0;
    for (let q = 0; q < n; q++) { cx += tmp[3 * q]; cy += tmp[3 * q + 1]; cz += tmp[3 * q + 2]; }
    cx /= n; cy /= n; cz /= n;
    // chọn trục u là hướng tới điểm xa tâm nhất, pháp tuyến từ tổng tích có hướng
    let nx = 0, ny = 0, nz = 0;
    for (let q = 0; q < n; q++) {
      const ax = tmp[3 * q] - cx, ay = tmp[3 * q + 1] - cy, az = tmp[3 * q + 2] - cz;
      for (let r = q + 1; r < n; r++) {
        const bx = tmp[3 * r] - cx, by = tmp[3 * r + 1] - cy, bz = tmp[3 * r + 2] - cz;
        let px = ay * bz - az * by, py = az * bx - ax * bz, pz = ax * by - ay * bx;
        // dồn cùng chiều để không triệt tiêu nhau
        if (px * nx + py * ny + pz * nz < 0) { px = -px; py = -py; pz = -pz; }
        nx += px; ny += py; nz += pz;
      }
    }
    const ln = Math.hypot(nx, ny, nz);
    if (ln < 1e-9) continue;                     // các điểm thẳng hàng: không thành mặt
    nx /= ln; ny /= ln; nz /= ln;
    let ux = tmp[0] - cx, uy = tmp[1] - cy, uz = tmp[2] - cz;
    const lu = Math.hypot(ux, uy, uz) || 1;
    ux /= lu; uy /= lu; uz /= lu;
    const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux;
    const da = kq.da[kq.soDa++];
    da.n = n; da.o = oi;
    // xếp theo góc quanh trọng tâm (sắp xếp chèn, n ≤ 12, không cấp phát)
    const goc = kq._goc, thu = kq._thu;
    for (let q = 0; q < n; q++) {
      const dx = tmp[3 * q] - cx, dy = tmp[3 * q + 1] - cy, dz = tmp[3 * q + 2] - cz;
      const g = Math.atan2(dx * vx + dy * vy + dz * vz, dx * ux + dy * uy + dz * uz);
      let r = q;
      while (r > 0 && goc[r - 1] > g) { goc[r] = goc[r - 1]; thu[r] = thu[r - 1]; r--; }
      goc[r] = g; thu[r] = q;
    }
    for (let q = 0; q < n; q++) {
      const s = thu[q];
      da.p[3 * q] = tmp[3 * s]; da.p[3 * q + 1] = tmp[3 * s + 1]; da.p[3 * q + 2] = tmp[3 * s + 2];
    }
    kq.soCanh += n;
    // gom đỉnh chung
    for (let q = 0; q < n; q++) {
      const x = da.p[3 * q], y = da.p[3 * q + 1], z = da.p[3 * q + 2];
      let trung = false;
      for (let r = 0; r < kq.soDinh; r++) {
        if (Math.abs(kq.dinh[3 * r] - x) < 1e-6 && Math.abs(kq.dinh[3 * r + 1] - y) < 1e-6 && Math.abs(kq.dinh[3 * r + 2] - z) < 1e-6) { trung = true; break; }
      }
      if (!trung && kq.soDinh < 96) { kq.dinh[3 * kq.soDinh] = x; kq.dinh[3 * kq.soDinh + 1] = y; kq.dinh[3 * kq.soDinh + 2] = z; kq.soDinh++; }
    }
  }
  kq.soCanh /= 2;                                // mỗi cạnh của khối thuộc đúng hai mặt
  let tx = 0, ty = 0, tz = 0;
  for (let r = 0; r < kq.soDinh; r++) { tx += kq.dinh[3 * r]; ty += kq.dinh[3 * r + 1]; tz += kq.dinh[3 * r + 2]; }
  const m = Math.max(1, kq.soDinh);
  kq.tam[0] = tx / m; kq.tam[1] = ty / m; kq.tam[2] = tz / m;
  return kq;
}

// Gọi tên khối thiết diện theo số đỉnh và số mặt; deu = mọi cạnh dài bằng nhau.
export function tenKhoi(soDinh, soMat, deu = false) {
  if (soDinh === 0) return chuCanh("canh.khong-co-gi", "không có gì");
  if (soDinh === 4 && soMat === 4) return deu ? chuCanh("canh.tu-dien-deu", "tứ diện đều") : chuCanh("canh.tu-dien", "tứ diện");
  if (soDinh === 8 && soMat === 6) return deu ? chuCanh("canh.khoi-lap-phuong-50676b", "khối lập phương") : chuCanh("canh.hinh-hop", "hình hộp");
  if (soDinh === 6 && soMat === 8) return deu ? chuCanh("canh.bat-dien-deu", "bát diện đều") : chuCanh("canh.bat-dien", "bát diện");
  if (soDinh === 12 && soMat === 8) return deu ? chuCanh("canh.tu-dien-cut-deu", "tứ diện cụt đều") : chuCanh("canh.tu-dien-cut", "tứ diện cụt");
  if (soDinh === 6 && soMat === 5) return chuCanh("canh.lang-tru-tam-giac", "lăng trụ tam giác");
  return chuCanh("canh.khoi-mat-dinh", "khối {0} mặt, {1} đỉnh", [soMat, soDinh]);
}

// Độ dài ngắn nhất và dài nhất của các cạnh thiết diện (mỗi cạnh được đếm hai lần, không sao).
export function doDaiCanhCat(kq, out = [0, 0]) {
  let mn = Infinity, mx = 0;
  for (let a = 0; a < kq.soDa; a++) {
    const d = kq.da[a];
    for (let q = 0; q < d.n; q++) {
      const r = (q + 1) % d.n;
      const l = Math.hypot(d.p[3 * r] - d.p[3 * q], d.p[3 * r + 1] - d.p[3 * q + 1], d.p[3 * r + 2] - d.p[3 * q + 2]);
      mn = Math.min(mn, l); mx = Math.max(mx, l);
    }
  }
  out[0] = mn === Infinity ? 0 : mn; out[1] = mx;
  return out;
}
