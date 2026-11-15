// Thư viện thiên thể của Vũ trụ 3D (Bản 3). Tệp này giữ nguyên mọi hàm Bản 2 đã xuất (bài cũ gọi như cũ) và gom
// các hàm mới từ các tệp hanh-tinh-*.js:
//
//   taoMatTroi({ banKinh })                 Mặt Trời hạt sôi, vết đen, sắc cầu, nhật hoa (hanh-tinh-mat-troi.js)
//   taoTraiDat({ banKinh, … })              Trái Đất bờ biển thật, biển phản chiếu, mây, khí quyển (hanh-tinh-be-mat.js)
//   taoMatTrang({ banKinh, … })             Mặt Trăng hố va chạm có bóng đổ, «biển» tối (vân tự sinh)
//   taoHanhTinh({ id, banKinh, … })         tám hành tinh vẽ bằng shader, vành Sao Thổ có bóng
//   taoSao({ mau | nhietDo, banKinh, doSang })   sao: lõi, quầng, tia nhiễu xạ (hanh-tinh-sao.js)
//   taoLoDenNho({ banKinh, dia })           lỗ đen minh hoạ: bóng tối, vòng photon, đĩa bồi tụ
//   taoThienHaNho({ banKinh, … }), taoSaoChoi({ … }), mauNhietDo(K)
//
// Hàm cũ (Bản 2, Bài 1 dùng): taoVanBeMat, veNetDan, taoVanhTho, taoKhiQuyen, taoMatTroi, taoVanhDai, taoVoCau.
// Vân cho bài cũ (taoVanBeMat) nay được «nướng» từ đúng công thức shader mới (hanh-tinh-nuong.js); máy không
// có WebGL2 thì quay về cách vẽ bằng CPU của Bản 2 (bên dưới).
//
// Vân bề mặt là hình minh hoạ cho dễ nhận ra từng thiên thể, không phải bản đồ thật, trừ bờ biển Trái Đất
// (Natural Earth, world-atlas/land-50m.json).

import * as THREE from 'three';
import { taoNgauNhien } from './ve.js';
import { layMayNuong, chuanBiNuong, nuongVan, giaiPhongMayNuong } from './hanh-tinh-nuong.js';
import { taoThienTheBeMat, taoVanhThoShader } from './hanh-tinh-be-mat.js';

export { taoMatTroi } from './hanh-tinh-mat-troi.js';
export { taoKhiQuyen, taoThienTheBeMat, texVanhTho, VANH_R0, VANH_R1 } from './hanh-tinh-be-mat.js';
export { taoSao, taoLoDenNho, taoThienHaNho, taoSaoChoi, mauNhietDo } from './hanh-tinh-sao.js';
export { khungDatLien, texDatLien } from './hanh-tinh-ban-do.js';

// ---------------------------------------------------------------------------
// Hàm mới (Bản 3). Mỗi hàm trả { nhom, capNhat(dt), datHuongSang(v), datNguonSang(p), … } (xem hanh-tinh-be-mat.js).
// datHuongSang(v): hướng TỚI nguồn sáng (hệ thế giới, ánh sáng song song).
// datNguonSang(p): vị trí nguồn sáng điểm (hệ thế giới), ví dụ Mặt Trời ở gốc toạ độ.
// ---------------------------------------------------------------------------

// Trái Đất thật: bờ biển Natural Earth, đất màu theo khí hậu gần đúng, biển phản chiếu Mặt Trời, mây trôi có bóng,
// khí quyển xanh mỏng ở rìa, nửa đêm tối với viền hoàng hôn ấm. tocDoQuay: radian mỗi giây (mặc định 0,06).
// chatLuong: 'nhanh' (mặc định: mặt đất và mây nướng sẵn thành ảnh lúc mở bài, vẽ nhẹ) hoặc 'goc' (tính vân
// trực tiếp mỗi khung hình như Bản 3 lúc đầu), xem hanh-tinh-be-mat.js.
export function taoTraiDat({ banKinh = 1, nghieng = 23.44, tocDoQuay, khiQuyen = true, chiTiet = 160, chatLuong = 'nhanh' } = {}) {
  return taoThienTheBeMat({ id: 'dat', banKinh, nghieng, tocDoQuay, khiQuyen, chiTiet, chatLuong });
}

// Mặt Trăng: hố va chạm nhiều cỡ (lòng chảo, vành nâng, hố lớn có đáy phẳng và núi giữa), bóng vành hố đổ vào lòng hố
// ở gần đường sáng tối, «biển» bazan tối, hố mới có tia sáng. VÂN TỰ SINH, KHÔNG PHẢI BẢN ĐỒ THẬT CỦA MẶT TRĂNG.
// Nửa có nhiều biển hướng về +x của vật. Mặc định không tự quay (luôn quay một mặt về Trái Đất).
export function taoMatTrang({ banKinh = 1, nghieng = 6.68, tocDoQuay = 0, chiTiet = 160 } = {}) {
  return taoThienTheBeMat({ id: 'trang', banKinh, nghieng, tocDoQuay, khiQuyen: false, chiTiet });
}

// Một trong tám hành tinh: id 'thuy' | 'kim' | 'dat' | 'hoa' | 'moc' | 'tho' | 'thienVuong' | 'haiVuong'.
// Tuỳ chọn: banKinh, nghieng (độ), tocDoQuay (rad/s), khiQuyen (mặc định có nếu hành tinh có khí quyển),
// vanh (mặc định chỉ Sao Thổ), chiTiet.
export function taoHanhTinh({ id = 'moc', ...tuyChon } = {}) {
  return taoThienTheBeMat({ id, ...tuyChon });
}

// ---------------------------------------------------------------------------
// Phần dưới: vân bằng CPU của Bản 2, giữ làm đường lùi khi không nướng được bằng GPU.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Nhiễu giá trị ba chiều (value noise) và nhiễu phân dạng (fbm), dùng để sinh vân trên mặt cầu.
// Lấy mẫu theo điểm (x, y, z) trên mặt cầu nên vân liền mạch, không có đường nối ở kinh tuyến 180°.
// ---------------------------------------------------------------------------
function taoNhieu(hat) {
  const rnd = taoNgauNhien(hat);
  const P = new Uint8Array(512);
  const V = new Float32Array(256);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  for (let i = 0; i < 256; i++) V[i] = rnd() * 2 - 1;
  const muot = (t) => t * t * (3 - 2 * t);
  const n3 = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const fx = x - xi, fy = y - yi, fz = z - zi;
    const X = xi & 255, Y = yi & 255, Z = zi & 255;
    const u = muot(fx), v = muot(fy), w = muot(fz);
    const a = P[X] + Y, aa = P[a] + Z, ab = P[a + 1] + Z, b = P[X + 1] + Y, ba = P[b] + Z, bb = P[b + 1] + Z;
    const l = (q, r, t) => q + (r - q) * t;
    return l(
      l(l(V[P[aa]], V[P[ba]], u), l(V[P[ab]], V[P[bb]], u), v),
      l(l(V[P[aa + 1]], V[P[ba + 1]], u), l(V[P[ab + 1]], V[P[bb + 1]], u), v),
      w,
    );
  };
  const fbm = (x, y, z, bac = 5) => {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < bac; i++) { s += a * n3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
    return s;
  };
  return { n3, fbm };
}

const kep01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const buoc = (a, b, x) => { const t = kep01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const tron3 = (c1, c2, t) => [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];

// Bảng màu theo vĩ độ (dải mây của hành tinh khí): [[vĩ độ độ, [r,g,b]], …] xếp tăng dần.
function mauTheoViDo(bang, lat) {
  if (lat <= bang[0][0]) return bang[0][1];
  for (let i = 1; i < bang.length; i++) {
    if (lat <= bang[i][0]) {
      const t = (lat - bang[i - 1][0]) / (bang[i][0] - bang[i - 1][0]);
      return tron3(bang[i - 1][1], bang[i][1], buoc(0, 1, t));
    }
  }
  return bang[bang.length - 1][1];
}

// ---------------------------------------------------------------------------
// Công thức vân bề mặt của từng hành tinh: ham(x, y, z, latDo, lonDo, N) → [r, g, b, a?] (0–255).
// y là trục cực (bắc ở y = +1).
// ---------------------------------------------------------------------------
const CONG_THUC = {
  thuy: { hat: 11, ham: (x, y, z, lat, lon, N) => {
    const h = N.fbm(x * 3, y * 3, z * 3, 5);
    const ho = N.fbm(x * 9 + 4, y * 9, z * 9, 3);
    const k = 0.55 + 0.35 * h + 0.2 * Math.max(0, ho) - 0.25 * buoc(0.25, 0.4, -ho);
    return [150 * k + 10, 142 * k + 8, 132 * k + 6];
  } },
  kim: { hat: 12, ham: (x, y, z, lat, lon, N) => {
    const w = N.fbm(x * 2, y * 2, z * 2, 3);
    const d = N.fbm(x * 1.5 + w * 1.2, y * 7 + w * 2.5, z * 1.5, 5);
    const c = tron3([214, 178, 118], [246, 228, 186], buoc(-0.35, 0.35, d));
    return c;
  } },
  dat: { hat: 13, ham: (x, y, z, lat, lon, N) => {
    const wx = N.fbm(x * 1.3 + 7, y * 1.3, z * 1.3, 3), wy = N.fbm(x * 1.3, y * 1.3 + 9, z * 1.3, 3);
    const h = N.fbm(x * 1.7 + wx * 0.9, y * 1.7 + wy * 0.9, z * 1.7, 6);
    const nguong = 0.07;
    const alat = Math.abs(lat);
    const bang = alat + 6 * N.n3(x * 6, y * 6, z * 6);
    if (bang > 74) return [236, 242, 248];
    if (h < nguong) {
      const sau = buoc(nguong - 0.22, nguong, h);
      return tron3([8, 30, 82], [28, 92, 158], sau * sau);
    }
    const kho = buoc(10, 22, alat) * (1 - buoc(32, 42, alat));        // vành đai sa mạc quanh vĩ độ 20–35°
    const am = N.fbm(x * 5 + 3, y * 5, z * 5, 3);
    let c = tron3([46, 96, 42], [92, 118, 56], buoc(-0.2, 0.3, am));
    c = tron3(c, [184, 152, 98], kep01(kho * 0.9 + am * 0.6));
    if (alat > 55) c = tron3(c, [104, 112, 92], buoc(55, 66, alat));
    const nui = buoc(nguong + 0.18, nguong + 0.34, h);
    c = tron3(c, [150, 132, 110], nui * 0.7);
    return c;
  } },
  may: { hat: 14, ham: (x, y, z, lat, lon, N) => {           // mây của Trái Đất: kênh alpha
    const w = N.fbm(x * 2, y * 2, z * 2, 3);
    const m = N.fbm(x * 3.2 + w * 1.6, y * 5 + w, z * 3.2, 5);
    const alat = Math.abs(lat);
    const vung = 0.75 + 0.25 * Math.cos((alat / 90) * Math.PI * 3);   // nhiều mây ở xích đạo và quanh vĩ độ 60°
    const a = buoc(0.02, 0.32, m * vung + 0.04) * 235;
    return [255, 255, 255, a];
  } },
  hoa: { hat: 15, ham: (x, y, z, lat, lon, N) => {
    const h = N.fbm(x * 2.2, y * 2.2, z * 2.2, 6);
    const t = N.fbm(x * 7, y * 7, z * 7, 3);
    let c = tron3([196, 104, 58], [222, 140, 88], buoc(-0.3, 0.4, t));
    c = tron3(c, [104, 52, 34], buoc(0.05, 0.22, h) * 0.8);
    const alat = Math.abs(lat) + 4 * N.n3(x * 8, y * 8, z * 8);
    if (alat > (lat > 0 ? 80 : 83)) c = [240, 236, 232];
    return c;
  } },
  moc: { hat: 16, ham: (x, y, z, lat, lon, N) => {
    const nhieu = N.fbm(x * 2.5, y * 14, z * 2.5, 5);
    const xoay = N.fbm(x * 6, y * 6, z * 6, 3);
    const l = lat + 2.4 * nhieu + 0.8 * xoay;
    let c = mauTheoViDo([
      [-90, [120, 112, 104]], [-62, [150, 132, 112]], [-40, [200, 176, 146]], [-30, [176, 120, 82]], [-22, [226, 206, 172]],
      [-14, [168, 104, 66]], [-6, [236, 224, 200]], [4, [222, 202, 168]], [9, [172, 108, 70]], [18, [190, 128, 88]],
      [24, [234, 220, 190]], [32, [180, 138, 100]], [42, [214, 196, 166]], [60, [160, 142, 120]], [90, [120, 112, 104]],
    ], l);
    c = tron3(c, [250, 244, 230], buoc(0.2, 0.45, xoay) * 0.35);
    // Vết Đỏ Lớn ở vĩ độ khoảng 22° nam
    let dl = lon - 40; dl = ((dl + 540) % 360) - 180;
    const e = (dl / 13) ** 2 + ((lat + 22) / 6) ** 2;
    if (e < 1.6) {
      const k = buoc(1.6, 0.6, e);
      const xoayTrong = 0.5 + 0.5 * Math.sin(Math.sqrt(e) * 9 + Math.atan2(lat + 22, dl / 2) * 2);
      c = tron3(c, tron3([176, 74, 48], [214, 120, 80], xoayTrong), k);
    }
    return c;
  } },
  tho: { hat: 17, ham: (x, y, z, lat, lon, N) => {
    const nhieu = N.fbm(x * 2, y * 12, z * 2, 4);
    const l = lat + 1.6 * nhieu;
    return mauTheoViDo([
      [-90, [150, 160, 166]], [-70, [176, 168, 140]], [-45, [214, 192, 140]], [-30, [196, 164, 110]], [-18, [232, 210, 160]],
      [-8, [218, 186, 128]], [6, [240, 222, 174]], [16, [212, 180, 124]], [28, [230, 208, 158]], [44, [200, 172, 122]],
      [64, [178, 164, 128]], [90, [140, 156, 170]],
    ], l);
  } },
  thienVuong: { hat: 18, ham: (x, y, z, lat, lon, N) => {
    const n = N.fbm(x * 2, y * 10, z * 2, 3);
    const c = tron3([150, 214, 220], [184, 234, 236], buoc(-0.3, 0.3, n + Math.sin((lat / 90) * 9) * 0.12));
    return tron3(c, [206, 240, 240], buoc(55, 85, Math.abs(lat)) * 0.5);
  } },
  haiVuong: { hat: 19, ham: (x, y, z, lat, lon, N) => {
    const n = N.fbm(x * 2.5, y * 12, z * 2.5, 4);
    let c = tron3([42, 74, 196], [84, 126, 236], buoc(-0.35, 0.35, n + Math.sin((lat / 90) * 7) * 0.2));
    let dl = lon + 60; dl = ((dl + 540) % 360) - 180;
    const e = (dl / 12) ** 2 + ((lat + 20) / 6) ** 2;
    if (e < 1) c = tron3(c, [24, 40, 120], buoc(1, 0.3, e));
    const may = N.fbm(x * 8, y * 30, z * 8, 3);
    c = tron3(c, [226, 236, 255], buoc(0.32, 0.5, may) * 0.85);
    return c;
  } },
};

function veVan(id, rong, cao, canvas = document.createElement('canvas')) {
  const ct = CONG_THUC[id];
  canvas.width = rong; canvas.height = cao;
  const g = canvas.getContext('2d');
  const anh = g.createImageData(rong, cao);
  const N = taoNhieu(ct.hat);
  const d = anh.data;
  for (let j = 0; j < cao; j++) {
    const lat = 90 - ((j + 0.5) / cao) * 180;
    const phi = (lat * Math.PI) / 180, cp = Math.cos(phi), y = Math.sin(phi);
    for (let i = 0; i < rong; i++) {
      const lon = ((i + 0.5) / rong) * 360 - 180;
      const l = (lon * Math.PI) / 180;
      const c = ct.ham(cp * Math.cos(l), y, cp * Math.sin(l), lat, lon, N);
      const k = (j * rong + i) * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = c.length > 3 ? c[3] : 255;
    }
  }
  g.putImageData(anh, 0, 0);
  return canvas;
}

// Vân bề mặt cho bài cũ (gắn vào MeshStandardMaterial): trả ngay một bản thô (vẽ bằng CPU trong chớp mắt), rồi
// veNetDan nướng bản nét bằng GPU (đúng công thức shader mới), mỗi khung hình vài mili giây. Bản nét được giữ lại
// cho những lần mở bài sau. id: 'thuy' … 'haiVuong', 'may' (mây Trái Đất, kênh alpha), 'trang'.
const _banNet = new Map();
const KICH_NET = { dat: [2048, 1024], moc: [2048, 1024], may: [2048, 1024], tho: [1536, 768] };
export function taoVanBeMat(id) {
  const tex = new THREE.CanvasTexture(_banNet.get(id) || veVan(CONG_THUC[id] ? id : 'thuy', 128, 64));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.daNet = _banNet.has(id);
  tex.idVan = id;
  return tex;
}
function datBanNet(tex, canvas) {
  _banNet.set(tex.idVan, canvas);
  tex.dispose();               // kích thước ảnh đổi: phải giải phóng để bộ vẽ cấp lại bộ nhớ đúng cỡ
  tex.image = canvas;
  tex.needsUpdate = true;
  tex.daNet = true;
  tex.viec = null;
}
// Làm tiếp việc vẽ bản nét trong khoảng ms mili giây. ds: danh sách texture do taoVanBeMat trả về.
// Trả true khi mọi texture đã nét.
export function veNetDan(ds, ms = 5) {
  const t0 = performance.now();
  let conLai = 0;
  for (const tex of ds) if (!tex.daNet) { if (_banNet.has(tex.idVan)) datBanNet(tex, _banNet.get(tex.idVan)); else conLai++; }
  if (!conLai) return true;
  const may = layMayNuong();
  if (!may.hong) {
    if (!chuanBiNuong()) return may.hong ? veNetDanCPU(ds, ms) : false;
    for (const tex of ds) {
      if (tex.daNet) continue;
      const [rong, cao] = KICH_NET[tex.idVan] || [1024, 512];
      const c = nuongVan(tex.idVan, rong, cao);
      if (!c) break;
      datBanNet(tex, c);
      conLai--;
      if (performance.now() - t0 > ms) break;
    }
    if (!conLai) { giaiPhongMayNuong(); return true; }
    if (!layMayNuong().hong) return false;
  }
  return veNetDanCPU(ds, ms);
}
function veNetDanCPU(ds, ms) {
  const t0 = performance.now();
  for (const tex of ds) {
    if (tex.daNet) continue;
    const id = CONG_THUC[tex.idVan] ? tex.idVan : 'thuy';
    if (!tex.viec) {
      const [rong, cao] = [1024, 512];
      const canvas = document.createElement('canvas');
      canvas.width = rong; canvas.height = cao;
      tex.viec = { canvas, g: canvas.getContext('2d'), rong, cao, j: 0, N: taoNhieu(CONG_THUC[id].hat) };
      tex.viec.anh = tex.viec.g.createImageData(rong, 1);
    }
    const v = tex.viec, ct = CONG_THUC[id];
    while (v.j < v.cao) {
      const j = v.j++;
      const lat = 90 - ((j + 0.5) / v.cao) * 180;
      const phi = (lat * Math.PI) / 180, cp = Math.cos(phi), y = Math.sin(phi);
      const d = v.anh.data;
      for (let i = 0; i < v.rong; i++) {
        const lon = ((i + 0.5) / v.rong) * 360 - 180;
        const l = (lon * Math.PI) / 180;
        const c = ct.ham(cp * Math.cos(l), y, cp * Math.sin(l), lat, lon, v.N);
        const k = i * 4;
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = c.length > 3 ? c[3] : 255;
      }
      v.g.putImageData(v.anh, 0, j);
      if (performance.now() - t0 > ms) return false;
    }
    datBanNet(tex, v.canvas);
    if (performance.now() - t0 > ms) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Vành Sao Thổ cho bài cũ: shader nhiều dải (vành C, B, khe Cassini, vành A có khe Encke, vành F), bóng hành tinh
// đổ lên vành, mặt khuất tối ở vành dày. Mặt Trời ở gốc toạ độ thế giới. Mesh nằm trong mặt phẳng xích đạo
// (vuông góc với trục cực y), đơn vị là bán kính Sao Thổ.
// ---------------------------------------------------------------------------
export const VANH_TRONG = 1.24, VANH_NGOAI = 2.27;
export function taoVanhTho() {
  return taoVanhThoShader();
}

// ---------------------------------------------------------------------------
// Vành đai hạt (tiểu hành tinh, Kuiper): mỗi hạt chạy trên quỹ đạo tròn nghiêng, tốc độ góc theo
// định luật Kepler (một vòng mất a^1,5 năm). Vị trí tính trong shader, không tốn công máy mỗi khung hình.
// ---------------------------------------------------------------------------
export function taoVanhDai({ n, aMin, aMax, nghieng, hat, mau, co = 1.8, doSang = 0.7, mat = null }) {
  const rnd = taoNgauNhien(hat);
  const q = new Float32Array(n * 4), s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = mat ? mat(rnd) : aMin + (aMax - aMin) * Math.sqrt(rnd());
    q[i * 4] = a;
    q[i * 4 + 1] = rnd() * Math.PI * 2;                                      // vị trí ban đầu
    q[i * 4 + 2] = Math.abs(rnd.chuan()) * nghieng * (Math.PI / 180);       // độ nghiêng
    q[i * 4 + 3] = rnd() * Math.PI * 2;                                      // kinh độ điểm nút
    s[i] = 0.35 + 0.65 * Math.pow(rnd(), 2.2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aQ', new THREE.BufferAttribute(q, 4));
  geo.setAttribute('aS', new THREE.BufferAttribute(s, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uMau: { value: new THREE.Color(mau) }, uCo: { value: co }, uSang: { value: doSang }, uTiLe: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec4 aQ; attribute float aS;
      uniform float uT, uCo, uTiLe; varying float vS;
      void main() {
        float a = aQ.x;
        float th = aQ.y + 6.2831853 * uT / (a * sqrt(a));
        float ci = cos(aQ.z), si = sin(aQ.z), cO = cos(aQ.w), sO = sin(aQ.w);
        float x = a * (cO * cos(th) - sO * ci * sin(th));
        float y = a * (sO * cos(th) + cO * ci * sin(th));
        float z = a * si * sin(th);
        vec4 mv = modelViewMatrix * vec4(x, z, -y, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uCo * uTiLe * (0.7 + 0.6 * aS);
        // lùi xa thì mờ bớt, để hàng nghìn hạt chồng lên nhau không thành một đốm loá
        vS = aS * clamp(a * 12.0 / max(1e-3, -mv.z), 0.06, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uSang; varying float vS;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float k = max(0.0, 1.0 - d);
        gl_FragColor = vec4(uMau * k * k * vS * uSang, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  const p = new THREE.Points(geo, m);
  p.frustumCulled = false;
  p.onBeforeRender = (renderer) => { m.uniforms.uTiLe.value = renderer.getPixelRatio(); };
  return p;
}

// Mặt cầu mờ, sáng ở rìa (dùng cho ranh giới nhật quyển).
export function taoVoCau(r, mau, manh = 0.5) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 32), new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uManh: { value: manh } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uManh; varying vec3 vN; varying vec3 vV;
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        gl_FragColor = vec4(uMau * (0.03 + pow(f, 4.0)) * uManh, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }));
  return m;
}
