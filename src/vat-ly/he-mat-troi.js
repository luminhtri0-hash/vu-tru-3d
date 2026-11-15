import { dich as dichChu } from '../ngon-ngu/dich.js';
import { ngonNgu } from '../ngon-ngu/dich.js';

// Vị trí các hành tinh và tàu Voyager trong hệ tọa độ hoàng đạo J2000, gốc ở Mặt Trời (đơn vị AU).
//
// Hành tinh: bảng "Approximate Positions of the Planets" của NASA/JPL (Standish & Williams),
// bảng 1, hiệu lực 1800–2050, sai số cỡ vài phút cung. https://ssd.jpl.nasa.gov/planets/approx_pos.html
// Voyager: véc-tơ trạng thái lấy từ JPL Horizons ngày 11/11/2026 (JD 2461355.5), ngoại suy thẳng.

import { DO, V_MAT_TROI_AU_NAM } from './hang-so.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('chung', khoa, goc, thamSo);

export const JD_J2000 = 2451545.0;
export const jdTuMs = (ms) => ms / 86400000 + 2440587.5;
export const msTuJd = (jd) => (jd - 2440587.5) * 86400000;

// Mỗi phần tử: [giá trị tại J2000, biến thiên mỗi thế kỷ Julius]. a: AU; góc: độ.
// L: kinh độ trung bình; wb: kinh độ điểm cận nhật; Om: kinh độ điểm nút lên.
export const HANH_TINH = [
  {
    id: 'thuy', ten: chuCanh("canh.sao-thuy", "Sao Thủy"), mau: 0xb5a79a, banKinhKm: 2439.7, chuKyNam: 0.2408467, vKmS: 47.36,
    moTa: chuCanh("canh.nho-nhat-chay-nhanh-nhat", "Nhỏ nhất, chạy nhanh nhất"),
    a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749],
    L: [252.2503235, 149472.67411175], wb: [77.45779628, 0.16047689], Om: [48.33076593, -0.12534081],
  },
  {
    id: 'kim', ten: chuCanh("canh.sao-kim", "Sao Kim"), mau: 0xe8cf9a, banKinhKm: 6051.8, chuKyNam: 0.61519726, vKmS: 35.02,
    moTa: chuCanh("canh.nong-nhat-may-day-dac", "Nóng nhất, mây dày đặc"),
    a: [0.72333566, 0.0000039], e: [0.00677672, -0.00004107], I: [3.39467605, -0.0007889],
    L: [181.9790995, 58517.81538729], wb: [131.60246718, 0.00268329], Om: [76.67984255, -0.27769418],
  },
  {
    id: 'dat', ten: chuCanh("canh.trai-dat", "Trái Đất"), mau: 0x5b9bff, banKinhKm: 6371.0, chuKyNam: 1.0000174, vKmS: 29.78,
    moTa: chuCanh("canh.nha-cua-chung-ta", "Nhà của chúng ta"),
    a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981], wb: [102.93768193, 0.32327364], Om: [0.0, 0.0],
  },
  {
    id: 'hoa', ten: chuCanh("canh.sao-hoa", "Sao Hỏa"), mau: 0xe0704a, banKinhKm: 3389.5, chuKyNam: 1.8808476, vKmS: 24.07,
    moTa: chuCanh("canh.hanh-tinh-do", "Hành tinh đỏ"),
    a: [1.52371034, 0.00001847], e: [0.0933941, 0.00007882], I: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499], wb: [-23.94362959, 0.44441088], Om: [49.55953891, -0.29257343],
  },
  {
    id: 'moc', ten: chuCanh("canh.sao-moc", "Sao Mộc"), mau: 0xd9b48a, banKinhKm: 69911, chuKyNam: 11.862615, vKmS: 13.07,
    moTa: chuCanh("canh.lon-nhat-khi-khong-lo", "Lớn nhất, khí khổng lồ"),
    a: [5.202887, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714],
    L: [34.39644051, 3034.74612775], wb: [14.72847983, 0.21252668], Om: [100.47390909, 0.20469106],
  },
  {
    id: 'tho', ten: chuCanh("canh.sao-tho", "Sao Thổ"), mau: 0xe6cf9c, banKinhKm: 58232, chuKyNam: 29.447498, vKmS: 9.68, vanh: true,
    moTa: chuCanh("canh.co-vanh-dai-ruc-ro", "Có vành đai rực rỡ"),
    a: [9.53667594, -0.0012506], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609],
    L: [49.95424423, 1222.49362201], wb: [92.59887831, -0.41897216], Om: [113.66242448, -0.28867794],
  },
  {
    id: 'thienVuong', ten: chuCanh("canh.sao-thien-vuong", "Sao Thiên Vương"), mau: 0x9fe3e6, banKinhKm: 25362, chuKyNam: 84.016846, vKmS: 6.8,
    moTa: chuCanh("canh.nam-nghieng-ma-quay", "Nằm nghiêng mà quay"),
    a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939],
    L: [313.23810451, 428.48202785], wb: [170.9542763, 0.40805281], Om: [74.01692503, 0.04240589],
  },
  {
    id: 'haiVuong', ten: chuCanh("canh.sao-hai-vuong", "Sao Hải Vương"), mau: 0x5a7dff, banKinhKm: 24622, chuKyNam: 164.79132, vKmS: 5.43,
    moTa: chuCanh("canh.xa-nhat-cham-nhat", "Xa nhất, chậm nhất"),
    a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372],
    L: [-55.12002969, 218.45945325], wb: [44.96476227, -0.32241464], Om: [131.78422574, -0.00508664],
  },
];

// Giải phương trình Kepler E − e·sinE = M (radian) bằng Newton.
export function giaiKepler(M, e) {
  M = ((M + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 12; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

// Phần tử quỹ đạo tại thời điểm jd, kèm ma trận xoay đã tính sẵn để dựng nhiều điểm cho nhanh.
export function phanTuQuyDao(ht, jd) {
  const T = (jd - JD_J2000) / 36525;
  // Các biến thiên tuyến tính chỉ đáng tin trong vài nghìn năm; kẹp lại để quỹ đạo không méo vô lý.
  const Tk = Math.max(-30, Math.min(30, T));
  const a = ht.a[0] + ht.a[1] * Tk;
  const e = ht.e[0] + ht.e[1] * Tk;
  const I = (ht.I[0] + ht.I[1] * Tk) * DO;
  const L = (ht.L[0] + ht.L[1] * T) * DO;
  const wb = (ht.wb[0] + ht.wb[1] * Tk) * DO;
  const Om = (ht.Om[0] + ht.Om[1] * Tk) * DO;
  const w = wb - Om;
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(Om), sO = Math.sin(Om), cI = Math.cos(I), sI = Math.sin(I);
  return {
    a, e, b: a * Math.sqrt(1 - e * e),
    M: L - wb,                       // độ lệch trung bình tại jd
    n: (ht.L[1] * DO) / 36525,       // chuyển động trung bình, rad/ngày
    // cột của ma trận từ mặt phẳng quỹ đạo sang hoàng đạo
    Px: cw * cO - sw * sO * cI, Py: cw * sO + sw * cO * cI, Pz: sw * sI,
    Qx: -sw * cO - cw * sO * cI, Qy: -sw * sO + cw * cO * cI, Qz: cw * sI,
  };
}

// Vị trí (AU, hoàng đạo J2000) từ phần tử và độ lệch trung bình M.
export function viTriTuPhanTu(el, M, out) {
  const E = giaiKepler(M, el.e);
  const xp = el.a * (Math.cos(E) - el.e);
  const yp = el.b * Math.sin(E);
  out[0] = el.Px * xp + el.Qx * yp;
  out[1] = el.Py * xp + el.Qy * yp;
  out[2] = el.Pz * xp + el.Qz * yp;
  return out;
}

export function viTriHanhTinh(ht, jd, out = [0, 0, 0]) {
  const el = phanTuQuyDao(ht, jd);
  return viTriTuPhanTu(el, el.M, out);
}

// Điểm trên đường elip quỹ đạo theo góc lệch tâm E (để vẽ đường quỹ đạo).
export function diemTrenQuyDao(el, E, out) {
  const xp = el.a * (Math.cos(E) - el.e);
  const yp = el.b * Math.sin(E);
  out[0] = el.Px * xp + el.Qx * yp;
  out[1] = el.Py * xp + el.Qy * yp;
  out[2] = el.Pz * xp + el.Qz * yp;
  return out;
}

// ----- Tàu Voyager -----
// Vị trí (AU) và vận tốc (AU/ngày) so với Mặt Trời, hoàng đạo J2000, tại JD 2461355.5 (11/11/2026 00:00 TDB).
// Hai tàu đã thoát khỏi Hệ Mặt Trời, bay gần như thẳng đều nên ngoại suy tuyến tính là đủ tốt từ ~1990 trở đi.
export const VOYAGER = [
  {
    id: 'v1', ten: chuCanh("canh.voyager-1", "Voyager 1"), jd0: 2461355.5, jdPhong: 2443391.5 /* 05/09/1977 */,
    r0: [-32.21203260192462, -137.1469069299433, 99.22804335856554],
    v: [-1.19524597077166e-3, -7.861204863823211e-3, 5.678198867022322e-3],
  },
  {
    id: 'v2', ten: chuCanh("canh.voyager-2", "Voyager 2"), jd0: 2461355.5, jdPhong: 2443375.5 /* 20/08/1977 */,
    r0: [39.98980640519708, -105.6855204067049, -89.97128095894509],
    v: [2.427657283629394e-3, -5.394407440582632e-3, -6.535632233632625e-3],
  },
];
export const JD_VOYAGER_TIN_DUOC = 2447892.5; // 01/01/1990: trước đó quỹ đạo còn cong vì bay ngang các hành tinh

export function viTriVoyager(v, jd, out = [0, 0, 0]) {
  const dt = jd - v.jd0;
  out[0] = v.r0[0] + v.v[0] * dt;
  out[1] = v.r0[1] + v.v[1] * dt;
  out[2] = v.r0[2] + v.v[2] * dt;
  return out;
}

// ----- Hướng trong Ngân Hà -----
// Ma trận xích đạo J2000 → thiên hà (Hipparcos). Mỗi hàng là một trục thiên hà viết trong hệ xích đạo:
// hàng 1 hướng về tâm Ngân Hà (l=0), hàng 2 hướng quay của Ngân Hà (l=90°), hàng 3 cực bắc thiên hà.
const XD_SANG_TH = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.44482963, 0.7469822445],
  [-0.867666149, -0.1980763734, 0.4559837762],
];
const NGHIENG = 23.4392911 * DO; // độ nghiêng hoàng đạo J2000
function xichDaoSangHoangDao([x, y, z]) {
  const c = Math.cos(NGHIENG), s = Math.sin(NGHIENG);
  return [x, c * y + s * z, -s * y + c * z];
}
// Ba trục thiên hà viết trong hệ hoàng đạo J2000.
export const TRUC_NGAN_HA = {
  tam: xichDaoSangHoangDao(XD_SANG_TH[0]),      // hướng tâm Ngân Hà (chòm Nhân Mã)
  quay: xichDaoSangHoangDao(XD_SANG_TH[1]),     // hướng Mặt Trời đang bay (chòm Thiên Nga)
  cucBac: xichDaoSangHoangDao(XD_SANG_TH[2]),   // cực bắc thiên hà
};
// Vận tốc Mặt Trời quanh tâm Ngân Hà, AU/năm, hệ hoàng đạo.
export const V_MAT_TROI = TRUC_NGAN_HA.quay.map((k) => k * V_MAT_TROI_AU_NAM);

// Chuyển hoàng đạo (x, y, z) sang hệ trục của three.js (Y hướng lên = cực bắc hoàng đạo).
export const hdSangBa = (v, out = [0, 0, 0]) => {
  const x = v[0], y = v[1], z = v[2];
  out[0] = x; out[1] = z; out[2] = -y;
  return out;
};

const ngayTheoVung = new Intl.DateTimeFormat(ngonNgu === 'en' ? 'en-US' : ngonNgu, { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
export function ngayThang(jd) {
  const d = new Date(msTuJd(jd));
  if (ngonNgu !== 'vi') return ngayTheoVung.format(d);
  const y = d.getUTCFullYear();
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${y}`;
}
