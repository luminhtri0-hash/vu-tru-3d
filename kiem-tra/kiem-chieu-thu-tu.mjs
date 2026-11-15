// Bộ kiểm số cho Bài 3 «Chiều thứ tư». Chạy: node kiem-tra/kiem-chieu-thu-tu.mjs
import { kiem, kiemDung, kiemTiLe, muc, tongKet } from './khung-kiem.mjs';
import {
  toHop, demPhanTu, DINH_LP, CANH_LP, MAT_LP, O_LP, DINH_TRUOC, maTranQuay, maTranDonVi, quayMatPhang, nhanVec,
  catLapPhuong4, taoBoCat, banKinhLatCat, doDaiCanhCat, tenKhoi,
} from '../src/vat-ly/bon-chieu.js';
import { R_MAT_TRANG_KM, CHU_KY_MAT_TRANG_NGAY, giayAnhSangKm } from '../src/vat-ly/khoang-cach-anh-sang.js';

muc('1. Đếm phần tử của khối lập phương n chiều: N_k(n) = C(n,k)·2^(n−k)');
const BANG = { 0: [1], 1: [2, 1], 2: [4, 4, 1], 3: [8, 12, 6, 1], 4: [16, 32, 24, 8, 1] };
for (const [n, ds] of Object.entries(BANG)) ds.forEach((v, k) => kiem(`n = ${n}, k = ${k}`, demPhanTu(Number(n), k), v, 0));
kiem('Lập phương 5 chiều: số đỉnh', demPhanTu(5, 0), 32, 0);
kiem('Lập phương 5 chiều: số cạnh (câu hỏi tự kiểm)', demPhanTu(5, 1), 80, 0);
kiem('Quy luật kéo: cạnh mới = 2·12 + 8', 2 * demPhanTu(3, 1) + demPhanTu(3, 0), demPhanTu(4, 1), 0);
kiem('Quy luật kéo: mặt mới = 2·6 + 12', 2 * demPhanTu(3, 2) + demPhanTu(3, 1), demPhanTu(4, 2), 0);
kiem('Quy luật kéo: ô mới = 2·1 + 6', 2 * demPhanTu(3, 3) + demPhanTu(3, 2), demPhanTu(4, 3), 0);
kiem('Euler bốn chiều: 16 − 32 + 24 − 8', 16 - 32 + 24 - 8, 0, 0);
kiem('Số mặt phẳng quay trong 4 chiều: C(4,2)', toHop(4, 2), 6, 0);
kiem('Số mặt phẳng quay trong 3 chiều: C(3,2)', toHop(3, 2), 3, 0);

muc('2. Dữ liệu siêu lập phương dùng để vẽ');
kiem('số đỉnh', DINH_LP.length, 16, 0);
kiem('số cạnh', CANH_LP.length, 32, 0);
kiem('số mặt vuông', MAT_LP.length, 24, 0);
kiem('số ô', O_LP.length, 8, 0);
kiemDung('mỗi ô có đúng 12 cạnh', O_LP.every((o) => o.canh.length === 12));
const dai = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));
kiemDung('mọi cạnh dài 2', CANH_LP.every(([a, b]) => Math.abs(dai(DINH_LP[a], DINH_LP[b]) - 2) < 1e-12));
kiemDung('mỗi mặt vuông có 4 cạnh dài 2 theo thứ tự vòng', MAT_LP.every((m) => [0, 1, 2, 3].every((q) => Math.abs(dai(DINH_LP[m.dinh[q]], DINH_LP[m.dinh[(q + 1) % 4]]) - 2) < 1e-12)));
kiemDung('có đúng 8 cạnh theo hướng w (cạnh vàng)', CANH_LP.filter((c) => c[2] === 3).length === 8);

muc('3. Phép quay bốn chiều giữ nguyên độ dài');
{
  const M = maTranQuay({ xy: 0.3, xw: 1.1, yw: -0.7, zw: 2.4 }, 'dinh');
  let loiTrucChuan = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += M[4 * i + k] * M[4 * j + k];
    loiTrucChuan = Math.max(loiTrucChuan, Math.abs(s - (i === j ? 1 : 0)));
  }
  kiem('M·Mᵀ = I (sai lệch lớn nhất)', loiTrucChuan, 0, 1e-12);
  let loiDai = 0;
  for (let n = 0; n < 50; n++) {
    const v = [Math.sin(n * 1.3), Math.cos(n * 0.7) * 2, Math.sin(n * 0.31) - 0.4, n / 25 - 1];
    loiDai = Math.max(loiDai, Math.abs(Math.hypot(...nhanVec(M, v)) - Math.hypot(...v)));
  }
  kiem('|M v| = |v| với 50 véc-tơ (sai lệch lớn nhất)', loiDai, 0, 1e-12);
  let loiDT = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += DINH_TRUOC[i][k] * DINH_TRUOC[j][k];
    loiDT = Math.max(loiDT, Math.abs(s - (i === j ? 1 : 0)));
  }
  kiem('Ma trận «đỉnh trước» trực chuẩn', loiDT, 0, 1e-12);
  const Q = quayMatPhang(maTranDonVi(), 0, 3, Math.PI / 2);
  const e1 = nhanVec(Q, [1, 0, 0, 0]);
  kiem('Quay 90° trong xw đưa trục x sang trục w: thành phần w', e1[3], 1, 1e-12);
  const v = [0.3, 0.5, -0.2, 0.9], a = 0.8, Rv = nhanVec(quayMatPhang(maTranDonVi(), 0, 3, a), v);
  kiem('x² + w² giữ nguyên khi quay trong xw', Rv[0] ** 2 + Rv[3] ** 2, v[0] ** 2 + v[3] ** 2, 1e-12);
  kiem('y không đổi khi quay trong xw', Rv[1], v[1], 0);
}

muc('4. Thiết diện của siêu lập phương');
const W = new Float64Array(64);
const datHuong = (huong) => {
  const M = maTranQuay({}, huong);
  DINH_LP.forEach((p, i) => { const o = nhanVec(M, p); for (let k = 0; k < 4; k++) W[4 * i + k] = o[k]; });
};
const kq = taoBoCat(), d2 = [0, 0];
datHuong('dinh');
{
  const muc = [-4, -2, 0, 2, 4].map((s) => DINH_LP.filter((p) => p.reduce((a, b) => a + b, 0) === s).length);
  kiemDung('số đỉnh theo tổng tọa độ s = −4, −2, 0, 2, 4 là 1, 4, 6, 4, 1', muc.join() === '1,4,6,4,1');
  kiemDung('hướng «đỉnh trước»: w = s/2 cho mọi đỉnh', DINH_LP.every((p, i) => Math.abs(W[4 * i + 3] - p.reduce((a, b) => a + b, 0) / 2) < 1e-12));
}
const thu = (s, dinh, mat, canh, ten, daiCanh) => {
  catLapPhuong4(W, s / 2, kq);
  doDaiCanhCat(kq, d2);
  kiem(`s = ${s}: số đỉnh`, kq.soDinh, dinh, 0);
  kiem(`s = ${s}: số mặt`, kq.soDa, mat, 0);
  kiem(`s = ${s}: số cạnh`, kq.soCanh, canh, 0);
  if (daiCanh != null) { kiem(`s = ${s}: cạnh ngắn nhất`, d2[0], daiCanh, 1e-9); kiem(`s = ${s}: cạnh dài nhất`, d2[1], daiCanh, 1e-9); }
  kiemDung(`s = ${s}: gọi tên «${ten}»`, tenKhoi(kq.soDinh, kq.soDa, d2[1] - d2[0] < 1e-6 * Math.max(1, d2[1])) === ten);
};
thu(-3, 4, 4, 6, 'tứ diện đều', Math.SQRT2);
thu(-2, 4, 4, 6, 'tứ diện đều', 2 * Math.SQRT2);       // siêu phẳng đi đúng qua 4 đỉnh
thu(-1, 12, 8, 18, 'tứ diện cụt đều', Math.SQRT2);
thu(0, 6, 8, 12, 'bát diện đều', 2 * Math.SQRT2);       // siêu phẳng đi đúng qua 6 đỉnh
thu(3, 4, 4, 6, 'tứ diện đều', Math.SQRT2);
catLapPhuong4(W, -2.2, kq);
kiem('ngoài tầm (w0 = −2,2): không có gì', kq.soDinh, 0, 0);
datHuong('mat');
for (const w0 of [-0.7, 0, 0.45]) {
  catLapPhuong4(W, w0, kq);
  doDaiCanhCat(kq, d2);
  kiem(`mặt trước, w0 = ${w0}: 8 đỉnh`, kq.soDinh, 8, 0);
  kiem(`mặt trước, w0 = ${w0}: 6 mặt`, kq.soDa, 6, 0);
  kiem(`mặt trước, w0 = ${w0}: cạnh dài 2`, d2[1], 2, 1e-9);
}
catLapPhuong4(W, 1, kq);
kiem('mặt trước, w0 = 1 (siêu phẳng chứa cả một ô): vẫn ra 8 đỉnh', kq.soDinh, 8, 0);

muc('5. Lát cắt siêu cầu');
kiem('R = 1, w0 = 0,6 → r = 0,8', banKinhLatCat(1, 0.6), 0.8, 1e-12);
kiem('R = 5, w0 = 3 → r = 4 (câu hỏi tự kiểm)', banKinhLatCat(5, 3), 4, 1e-12);
kiem('R = 1, w0 = 0 → r = 1', banKinhLatCat(1, 0), 1, 0);
kiem('R = 1, w0 = 1,2 → không có gì', banKinhLatCat(1, 1.2), 0, 0);

muc('6. Mặt Trăng');
kiem('384 400 km bằng bao nhiêu giây ánh sáng', giayAnhSangKm(R_MAT_TRANG_KM), 1.28, 0.005, ' s');
const cT = 299792.458 * CHU_KY_MAT_TRANG_NGAY * 86400;
kiemTiLe('c × 27,32 ngày (km)', cT, 7.08e11, 0.003);
kiemTiLe('bước xoắn / bán kính ≈ 1,84 triệu', cT / R_MAT_TRANG_KM, 1.84e6, 0.003);
const nen = cT / R_MAT_TRANG_KM / ((2 * 2 / 2.5) / 0.7);   // hình: bước 1,6, bán kính 0,7
kiemTiLe('trục thời gian trong hình nén khoảng 800 000 lần', nen, 8e5, 0.02);

muc('7. Bản 3: đích của các thử thách');
// Bước 2: kéo đủ bốn lần → siêu lập phương
kiem('kéo đủ 4 lần: 16 đỉnh', demPhanTu(4, 0), 16, 0);
kiem('kéo đủ 4 lần: 32 cạnh', demPhanTu(4, 1), 32, 0);
// Bước 3: quay 90° trong mặt phẳng xw → ô x = +1 nằm vào chỗ ô w = +1 (khối ngoài); quay −90° → ô x = −1
{
  const kiemO = (goc, dauX) => {
    const M = maTranQuay({ xw: goc }, 'mat');
    let lech = 0;
    for (const d of DINH_LP) if (d[0] === dauX) lech = Math.max(lech, Math.abs(nhanVec(M, d)[3] - 1));
    return lech;
  };
  kiem('xw = +90°: 8 đỉnh của ô x = +1 có w′ = +1', kiemO(Math.PI / 2, 1), 0, 1e-12);
  kiem('xw = −90°: 8 đỉnh của ô x = −1 có w′ = +1', kiemO(-Math.PI / 2, -1), 0, 1e-12);
  // dung sai 4°: ô ấy vẫn gần trọn ở ngoài (w′ ≥ cos 4° − sin 4°)
  const M4 = maTranQuay({ xw: (86 * Math.PI) / 180 }, 'mat');
  let wMin = Infinity;
  for (const d of DINH_LP) if (d[0] === 1) wMin = Math.min(wMin, nhanVec(M4, d)[3]);
  kiemDung(`xw = 86°: ô x = +1 vẫn có w′ ≥ 0,92 (thấp nhất ${wMin.toFixed(3)})`, wMin >= 0.92);
}
// Bước 4: r = 0,6 ± 0,02 ↔ w₀ = ±0,8
kiem('R = 1, w₀ = 0,8 → r = 0,6', banKinhLatCat(1, 0.8), 0.6, 1e-12);
{
  const wA = Math.sqrt(1 - 0.62 * 0.62), wB = Math.sqrt(1 - 0.58 * 0.58);
  kiemDung(`dung sai r ± 0,02 ứng với w₀ trong [${wA.toFixed(4)}; ${wB.toFixed(4)}], chứa 0,8, rộng hơn bước thanh trượt 0,005`, wA < 0.8 && wB > 0.8 && wB - wA > 0.005);
}
// Bước 5: đỉnh trước, tầm vươn theo w là 2 (s = 4 → w = 2), nên f = w₀ / 2; bát diện đều chỉ có đúng ở w₀ = 0
{
  const M = maTranQuay({}, 'dinh');
  const W = new Float64Array(64);
  let vuon = 0;
  DINH_LP.forEach((d, i) => { const o = nhanVec(M, d); for (let j = 0; j < 4; j++) W[4 * i + j] = o[j]; vuon = Math.max(vuon, Math.abs(o[3])); });
  kiem('đỉnh trước: tầm vươn theo w', vuon, 2, 1e-12);
  const kq = taoBoCat(), d2 = [0, 0];
  const ten = (w0) => { catLapPhuong4(W, w0, kq); doDaiCanhCat(kq, d2); return tenKhoi(kq.soDinh, kq.soDa, d2[1] - d2[0] < 1e-6 * Math.max(1, d2[1])); };
  kiemDung(`w₀ = 0: «${ten(0)}»`, ten(0) === 'bát diện đều');
  kiemDung(`w₀ = 0,01: «${ten(0.01)}» (không còn là bát diện: phải bắt dính đúng 0)`, ten(0.01) !== 'bát diện đều');
  kiemDung(`điểm bắt dính f = −0,75 (w₀ = −1,5, s = −3): «${ten(-1.5)}»`, ten(-1.5).startsWith('tứ diện'));
  kiemDung(`điểm bắt dính f = −0,25 (w₀ = −0,5, s = −1): «${ten(-0.5)}»`, ten(-0.5).startsWith('tứ diện cụt'));
}
// Bước 7: chấm hồng trên nhánh trên −t² + x² = −1 tại x = 2
{
  const t = Math.cosh(Math.asinh(2));
  kiem('x = 2 → t = √5', t, Math.sqrt(5), 1e-12);
  kiem('t ≈ 2,24 (gợi ý)', t, 2.24, 0.005);
  kiemDung('kéo trong giới hạn η ≤ 1,55 thì x tới được 2 (sinh 1,55 > 2,08)', Math.sinh(1.55) > 2.08);
}

muc('8. Bản 3: quy đổi âm thanh (chỉ để tai nghe, không phải tiếng của vật)');
{
  const NOT_CHIEU = [293.66, 369.99, 440.0, 587.33, 739.99];
  const nua = [0, 4, 7, 12, 16];
  NOT_CHIEU.forEach((f, k) => kiem(`nốt cho ${k} chiều: Rê 4 nâng ${nua[k]} nửa cung`, f, 293.66 * 2 ** (nua[k] / 12), 0.02, ' Hz'));
  const tanSoCau = (r) => 196 * 2 ** ((1 - r) * 1.6);
  kiem('quả cầu lát cắt r = 1 → 196 Hz', tanSoCau(1), 196, 1e-9, ' Hz');
  kiem('r → 0 → khoảng 594 Hz (cao hơn 1,6 quãng tám)', tanSoCau(0), 594.2, 0.1, ' Hz');
  let giam = true;
  for (let r = 0; r < 1; r += 0.01) if (tanSoCau(r + 0.01) >= tanSoCau(r)) giam = false;
  kiemDung('quả cầu càng to tiếng càng trầm (giảm đều)', giam);
}

tongKet();
