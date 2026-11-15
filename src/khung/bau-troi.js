// Bầu trời thật cho mọi cảnh: sao thật (danh mục XHIP tới cấp 7,5, màu theo chỉ số B–V), dải Ngân Hà thật
// (đường viền 5 mức sáng của Milky Way Outline Catalog, tô rồi làm mềm), nét chòm sao tuỳ chọn.
// Dữ liệu nhúng ở src/du-lieu/bau-troi.js (sinh bởi cong-cu/dong-goi-bau-troi.mjs).
//
//   import { taoBauTroi } from './bau-troi.js';
//   const bt = taoBauTroi({ soSao: 5000, doSang: 1, daiNganHa: { tam: [x, y, z], cucBac: [x, y, z] }, chomSao: ['Ori'] });
//   scene.add(bt);
//   bt.huongSao('Betelgeuse')     // → Vector3 đơn vị, trong hệ trục của daiNganHa (hệ của vật cha)
//   bt.huongChomSao('Ori')        // → Vector3 đơn vị tới giữa chòm sao
//   bt.datDoSang(0.5)             // đổi độ sáng khi đang chạy
//
// Tuỳ chọn:
//   soSao      mức «dày hay thưa». Vẽ khoảng 3 × soSao sao sáng nhất (5000 → tới cấp khoảng 7).
//   hat        hạt giống cho hướng mặc định của bầu trời khi không có daiNganHa.
//   daiNganHa  { tam, cucBac }: hướng tâm Ngân Hà và cực bắc thiên hà trong hệ trục của cảnh.
//   doSang     1: lộng lẫy (cảnh thiên văn); 0,4–0,6: nền kín đáo cho bài sơ đồ.
//   chomSao    true (mọi chòm) hoặc mảng mã IAU ['Cyg', 'Lyr', 'Aql']: vẽ nét mảnh nối chòm sao.
//   nganHa     false để tắt dải Ngân Hà (chỉ còn sao).
//
// Vật trả về luôn vẽ trước mọi thứ (renderOrder rất âm), không ghi và không thử độ sâu, không bị cắt theo khung nhìn,
// chỉ xoay theo máy quay (không dịch theo máy quay): bầu trời ở vô cực.

import * as THREE from 'three';
import { SAO, SO_SAO, NGAN_HA, B_MAX_NGAN_HA, MA_CHOM_SAO, CHOM_SAO, TEN_SAO } from '../du-lieu/bau-troi.js';

const D = Math.PI / 180;

// Ma trận đổi xích đạo J2000 sang thiên hà (Hipparcos, ESA 1997). Hàng i là trục thiên hà i viết trong hệ xích đạo:
// hàng 0 hướng tâm Ngân Hà (l = 0, b = 0), hàng 1 hướng l = 90°, hàng 2 cực bắc thiên hà.
export const XD_SANG_TH = [
  [-0.0548755604162154, -0.8734370902348850, -0.4838350155487132],
  [0.4941094278755837, -0.4448296299600112, 0.7469822444972189],
  [-0.8676661490190047, -0.1980763734312015, 0.4559837761750669],
];

// Véc-tơ đơn vị xích đạo (x tới điểm xuân phân, z tới cực bắc thiên cầu) từ xích kinh, xích vĩ (độ).
export function vecXichDao(ra, dec, ra3 = [0, 0, 0]) {
  const c = Math.cos(dec * D);
  ra3[0] = c * Math.cos(ra * D); ra3[1] = c * Math.sin(ra * D); ra3[2] = Math.sin(dec * D);
  return ra3;
}

// Xích đạo (véc-tơ) → toạ độ thiên hà { l, b } (độ, l trong 0–360).
export function sangThienHa(v) {
  const R = XD_SANG_TH;
  const x = R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2];
  const y = R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2];
  const z = R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2];
  let l = Math.atan2(y, x) / D;
  if (l < 0) l += 360;
  return { l, b: Math.asin(Math.max(-1, Math.min(1, z))) / D };
}

// ───────────────────────── giải mã dữ liệu (một lần cho cả ứng dụng) ─────────────────────────

function giaiBase64(s) {
  if (typeof atob === 'function') {
    const t = atob(s), a = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i);
    return a;
  }
  return new Uint8Array(Buffer.from(s, 'base64'));
}
const giaiU16 = (s) => { const b = giaiBase64(s); return new Uint16Array(b.buffer, b.byteOffset, b.byteLength >> 1); };

// Màu sao từ B–V: nhiệt độ theo công thức Ballesteros (2012), màu vật đen theo xấp xỉ Tanner Helland,
// đổi về màu tuyến tính, chuẩn hoá độ chói bằng 1 (độ sáng do cấp sao quyết định), đậm màu thêm một chút.
export function nhietDoTuBV(bv) { return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)); }
export function mauSao(bv, ra3 = [1, 1, 1]) {
  const t = nhietDoTuBV(Math.max(-0.4, Math.min(2.2, bv))) / 100;
  let r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  let g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  let b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const lin = (x) => { x = Math.max(0, Math.min(255, x)) / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  r = lin(r); g = lin(g); b = lin(b);
  const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const dam = 1.2;                         // đậm màu: ảnh chụp dài hạn cho màu sao rõ hơn mắt thường
  ra3[0] = Math.max(0, 1 + (r / Y - 1) * dam);
  ra3[1] = Math.max(0, 1 + (g / Y - 1) * dam);
  ra3[2] = Math.max(0, 1 + (b / Y - 1) * dam);
  return ra3;
}

// Độ sáng lõi (tuyến tính, ở doSang = 1) theo cấp sao. Cấp 6 → 0,085; cấp 1,5 → 0,8 (ngưỡng quầng); Sirius → 4.
export const doSangLoi = (cap) => 0.085 * Math.pow(10, -0.4 * (cap - 6) * 0.55);

let _sao = null;
export function giaiMaSao() {
  if (_sao) return _sao;
  const b = giaiBase64(SAO);
  const n = SO_SAO;
  const viTri = new Float32Array(n * 3), mau = new Float32Array(n * 3), sang = new Float32Array(n), pha = new Float32Array(n);
  const ra = new Float32Array(n), dec = new Float32Array(n), cap = new Float32Array(n), bv = new Float32Array(n);
  const v = [0, 0, 0], c = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const k = i * 6;
    ra[i] = ((b[k] | (b[k + 1] << 8)) / 65536) * 360;
    dec[i] = ((b[k + 2] | (b[k + 3] << 8)) / 65535) * 180 - 90;
    cap[i] = b[k + 4] / 25 - 2;
    bv[i] = b[k + 5] === 255 ? NaN : b[k + 5] / 85 - 0.4;
    vecXichDao(ra[i], dec[i], v);
    viTri.set(v, i * 3);
    mauSao(Number.isNaN(bv[i]) ? 0.6 : bv[i], c);
    mau.set(c, i * 3);
    sang[i] = doSangLoi(cap[i]);
    pha[i] = ((Math.imul(i + 1, 2654435761) >>> 0) % 10007) / 10007;
  }
  _sao = { n, viTri, mau, sang, pha, ra, dec, cap, bv };
  return _sao;
}

// Các vòng đường viền Ngân Hà: [{ muc, l: Float32Array, b: Float32Array }] (độ).
let _vongNH = null;
export function giaiMaNganHa() {
  if (_vongNH) return _vongNH;
  const a = giaiU16(NGAN_HA);
  let k = 0;
  const soMuc = a[k++], ds = [];
  for (let m = 0; m < soMuc; m++) {
    const soVong = a[k++];
    for (let j = 0; j < soVong; j++) {
      const n = a[k++], l = new Float32Array(n), b = new Float32Array(n);
      for (let i = 0; i < n; i++) { l[i] = (a[k++] / 65536) * 360; b[i] = (a[k++] / 65535) * 180 - 90; }
      ds.push({ muc: m, l, b });
    }
  }
  _vongNH = ds;
  return ds;
}

// Nét chòm sao: { Ori: [[ra, dec, ra, dec, …], …], … } (độ).
let _chom = null;
export function giaiMaChomSao() {
  if (_chom) return _chom;
  const a = giaiU16(CHOM_SAO);
  let k = 0;
  const so = a[k++], kq = {};
  for (let c = 0; c < so; c++) {
    const soNet = a[k++], net = [];
    for (let j = 0; j < soNet; j++) {
      const n = a[k++], d = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { d[i * 2] = (a[k++] / 65536) * 360; d[i * 2 + 1] = (a[k++] / 65535) * 180 - 90; }
      net.push(d);
    }
    kq[MA_CHOM_SAO[c]] = net;
  }
  _chom = kq;
  return kq;
}

// Hướng xích đạo (mảng 3 số) tới một sao có tên riêng; null nếu không có.
export function huongSaoXichDao(ten) {
  const i = TEN_SAO[ten];
  if (i === undefined) return null;
  const s = giaiMaSao();
  return [s.viTri[i * 3], s.viTri[i * 3 + 1], s.viTri[i * 3 + 2]];
}
export const tenSaoCo = () => Object.keys(TEN_SAO);
export function capSao(ten) { const i = TEN_SAO[ten]; return i === undefined ? NaN : giaiMaSao().cap[i]; }

// Hướng xích đạo tới giữa một chòm sao (trung bình các điểm nét, chuẩn hoá).
export function huongChomSaoXichDao(ma) {
  const net = giaiMaChomSao()[ma];
  if (!net) return null;
  const t = [0, 0, 0], v = [0, 0, 0];
  for (const d of net) for (let i = 0; i < d.length; i += 2) { vecXichDao(d[i], d[i + 1], v); t[0] += v[0]; t[1] += v[1]; t[2] += v[2]; }
  const L = Math.hypot(...t) || 1;
  return [t[0] / L, t[1] / L, t[2] / L];
}

// ───────────────────────── tô dải Ngân Hà thành ảnh (toạ độ thiên hà) ─────────────────────────

export const NH_RONG = 4096;                                  // 0,088° mỗi điểm ảnh
export const NH_B = Math.ceil(B_MAX_NGAN_HA + 14);           // ảnh phủ |b| ≤ NH_B độ (đủ chỗ cho quầng rộng)
export const NH_CAO = Math.round((NH_RONG * 2 * NH_B) / 360);
// Mỗi mức đường viền sáng thêm bấy nhiêu. Các mức là đường đồng độ sáng, cách nhau gần theo cấp số nhân,
// nên cộng dồn ra 0,07 → 0,15 → 0,28 → 0,5 → 0,85 (mức 1 vừa đủ nhô khỏi nền, mức 5 là các đám mây sao rực nhất).
const TRONG_SO_MUC = [0.055, 0.085, 0.14, 0.22, 0.35];

// Tô các vòng theo luật chẵn lẻ trên mặt cầu, từng hàng vĩ độ. Điểm tham chiếu mỗi hàng là kinh độ l = 180°
// (hướng ngược tâm): đi dọc kinh tuyến đó lên cực bắc thiên hà (nằm ngoài mọi mức), đếm số lần cắt đường viền.
// Trả về Float32Array RONG × CAO: tổng trọng số các mức chứa điểm ảnh (0–1). Cột x ↔ l = (x + 0,5)/RONG·360° − 180°.
export function toNganHa(rong = NH_RONG, cao = NH_CAO, bMax = NH_B, trongSo = TRONG_SO_MUC) { return chayHet(toNganHaTungNhip(rong, cao, bMax, trongSo)); }
// Chạy một bộ sinh tới cùng (bản «một hơi» của các hàm dựng ảnh bên dưới).
function chayHet(g) { let r = g.next(); while (!r.done) r = g.next(); return r.value; }
// Bản chia nhịp: cứ xong một ít hàng thì nhả quyền (yield) để nơi gọi có thể nhường cửa sổ vẽ một khung hình.
function* toNganHaTungNhip(rong, cao, bMax, trongSo) {
  const vong = giaiMaNganHa();
  const anh = new Float32Array(rong * cao);
  const soMuc = 1 + vong.reduce((m, v) => Math.max(m, v.muc), 0);
  const wrap = (x) => { x = (x + 180) % 360; if (x < 0) x += 360; return x - 180; };   // về [−180, 180)
  // Cạnh theo từng mức: l1 (đã đổi về hệ có tâm ở giữa, [−180,180)), b1, dl (đã quấn), b2.
  for (let m = 0; m < soMuc; m++) {
    const L1 = [], B1 = [], DL = [], B2 = [];
    const catKT = [];  // vĩ độ các điểm cắt kinh tuyến l = 180°
    for (const v of vong) {
      if (v.muc !== m) continue;
      const n = v.l.length;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const l1 = wrap(v.l[i]), dl = wrap(v.l[j] - v.l[i]);
        L1.push(l1); B1.push(v.b[i]); DL.push(dl); B2.push(v.b[j]);
        const l2 = l1 + dl;
        if (l2 >= 180 || l2 < -180) {   // cạnh đi qua l = ±180
          const t = ((l2 >= 180 ? 180 : -180) - l1) / dl;
          catKT.push(v.b[i] + t * (v.b[j] - v.b[i]));
        }
      }
    }
    const nCanh = L1.length, w = trongSo[m] ?? 0;
    if (!w) continue;
    const cat = [];
    for (let y = 0; y < cao; y++) {
      if ((y & 31) === 31) yield;
      const bh = -bMax + ((y + 0.5) / cao) * 2 * bMax;
      cat.length = 0;
      for (let e = 0; e < nCanh; e++) {
        const b1 = B1[e], b2 = B2[e];
        if ((b1 <= bh) === (b2 <= bh)) continue;
        cat.push(wrap(L1[e] + ((bh - b1) / (b2 - b1)) * DL[e]));
      }
      if (!cat.length) continue;
      cat.sort((a, b) => a - b);
      let trong = 0;
      for (const bc of catKT) if (bc > bh) trong ^= 1;
      // Đi từ l = −180 sang phải, đổi trạng thái tại mỗi điểm cắt.
      let x0 = 0;
      const hang = y * rong;
      for (let k = 0; k <= cat.length; k++) {
        const x1 = k < cat.length ? Math.round(((cat[k] + 180) / 360) * rong - 0.5) : rong;
        if (trong) for (let x = Math.max(0, x0); x < Math.min(rong, x1); x++) anh[hang + x] += w;
        trong ^= 1;
        x0 = x1;
      }
    }
  }
  return anh;
}

// Làm mềm kiểu Gauss (ba lần hộp), ngang có quấn vòng và nới theo 1/cos(b) để mềm đều trên mặt cầu.
function lamMem(src, rong, cao, bMax, sigmaDo) { return chayHet(lamMemTungNhip(src, rong, cao, bMax, sigmaDo)); }
function* lamMemTungNhip(src, rong, cao, bMax, sigmaDo) {
  const doMoiPx = 360 / rong;
  const a = Float32Array.from(src), t = new Float32Array(Math.max(rong, cao));
  const rDoc = Math.max(1, Math.round(Math.sqrt(4 * (sigmaDo / doMoiPx) ** 2 + 1) / 2));
  for (let y = 0; y < cao; y++) {
    if ((y & 15) === 15) yield;
    const b = (-bMax + ((y + 0.5) / cao) * 2 * bMax) * D;
    const sx = sigmaDo / doMoiPx / Math.max(0.2, Math.cos(b));
    const r = Math.max(1, Math.round(Math.sqrt(4 * sx * sx + 1) / 2));
    const hang = y * rong;
    for (let lan = 0; lan < 3; lan++) {
      let tong = 0;
      for (let k = -r; k <= r; k++) tong += a[hang + ((k % rong) + rong) % rong];
      for (let x = 0; x < rong; x++) {
        t[x] = tong / (2 * r + 1);
        tong += a[hang + (x + r + 1) % rong] - a[hang + ((x - r) % rong + rong) % rong];
      }
      for (let x = 0; x < rong; x++) a[hang + x] = t[x];
    }
  }
  for (let x = 0; x < rong; x++) {
    if ((x & 63) === 63) yield;
    for (let lan = 0; lan < 3; lan++) {
      let tong = 0;
      const lay = (y) => (y < 0 || y >= cao ? 0 : a[y * rong + x]);
      for (let k = -rDoc; k <= rDoc; k++) tong += lay(k);
      for (let y = 0; y < cao; y++) {
        t[y] = tong / (2 * rDoc + 1);
        tong += lay(y + rDoc + 1) - lay(y - rDoc);
      }
      for (let y = 0; y < cao; y++) a[y * rong + x] = t[y];
    }
  }
  return a;
}

// Dựng ảnh dải Ngân Hà mất gần nửa giây tính toán (4096 điểm ảnh ngang, làm mềm ba lượt). Trước Bản 3.2 việc này chạy một
// hơi ngay lần đầu mở một bài có dải Ngân Hà, tức là ngay sau khi màn hình chào hiện ra: cửa sổ đứng nửa giây, bấm không
// ăn. Nay app đặt CHIA_NHIP.bat = true: ảnh được dựng từng nhịp vài mili giây, xen giữa các khung hình; trong lúc đó dải
// Ngân Hà còn tối, dựng xong thì hiện. Các lượt kiểm và trang trưng bày để nguyên (dựng một hơi) nên ảnh chụp có ngay.
export const CHIA_NHIP = { bat: false };
let _texNH = null;
function* dungAnhNganHa(du) {
  const W = NH_RONG, H = NH_CAO;
  // Mức mờ (1–2) làm mềm nhiều: mép ngoài dải tan dần vào nền như ảnh thật.
  // Mức sáng (3–5) làm mềm ít: giữ các đám mây sao và vết bụi tối đúng chỗ.
  const w = TRONG_SO_MUC;
  const mo = yield* lamMemTungNhip(yield* toNganHaTungNhip(W, H, NH_B, [w[0], w[1], 0, 0, 0]), W, H, NH_B, 1.1);
  const sang = yield* lamMemTungNhip(yield* toNganHaTungNhip(W, H, NH_B, [0, 0, w[2], w[3], w[4]]), W, H, NH_B, 0.16);
  const min = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) min[i] = mo[i] + sang[i];
  yield;
  const rong = yield* lamMemTungNhip(min, W, H, NH_B, 3.4);    // quầng rộng
  for (let i = 0; i < W * H; i++) {
    du[i * 2] = Math.round(Math.sqrt(Math.min(1, min[i])) * 255);
    du[i * 2 + 1] = Math.round(Math.sqrt(Math.min(1, rong[i])) * 255);
  }
}
function texNganHa() {
  if (_texNH) return _texNH;
  const W = NH_RONG, H = NH_CAO;
  const du = new Uint8Array(W * H * 2);
  const t = new THREE.DataTexture(du, W, H, THREE.RGFormat, THREE.UnsignedByteType);
  t.unpackAlignment = 1;
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace;
  _texNH = t;
  const g = dungAnhNganHa(du);
  if (!CHIA_NHIP.bat || typeof setTimeout !== 'function') { chayHet(g); t.needsUpdate = true; return t; }
  t.needsUpdate = true;                 // tạm thời là ảnh đen (dải Ngân Hà chưa hiện)
  const nhip = () => {
    const t0 = performance.now();
    try {
      while (performance.now() - t0 < 5) if (g.next().done) { t.needsUpdate = true; return; }
    } catch (e) { console.warn('Dựng ảnh Ngân Hà:', e); return; }
    setTimeout(nhip, 0);
  };
  setTimeout(nhip, 0);
  return t;
}

// ───────────────────────── hướng bầu trời ─────────────────────────

function ngauNhien(hat) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hướng mặc định (không có daiNganHa): tâm Ngân Hà ở một phương vị ngẫu nhiên gần chân trời của cảnh (trục Y lên),
// dải nghiêng vừa phải so với mặt phẳng ngang. Xác định theo hat.
export function huongMacDinh(hat = 7) {
  const r = ngauNhien((hat * 7919 + 13) >>> 0);
  for (let i = 0; i < 3; i++) r();
  const az = r() * 2 * Math.PI, el = (r() - 0.5) * 0.45;
  const T = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  const N = new THREE.Vector3(0, 1, 0).addScaledVector(T, -T.y).normalize();
  N.applyAxisAngle(T, (r() < 0.5 ? -1 : 1) * (0.35 + r() * 0.5));
  return { tam: T.toArray(), cucBac: N.toArray() };
}

// Ma trận xoay hệ xích đạo → hệ cảnh, từ hướng tâm Ngân Hà và cực bắc thiên hà trong hệ cảnh.
export function maTranXichDaoSangCanh({ tam, cucBac }) {
  const T = new THREE.Vector3(...tam).normalize();
  const N = new THREE.Vector3(...cucBac);
  N.addScaledVector(T, -N.dot(T)).normalize();
  const Q = new THREE.Vector3().crossVectors(N, T);                // trục l = 90° (hệ phải: X × Y = Z)
  const B = new THREE.Matrix3().set(T.x, Q.x, N.x, T.y, Q.y, N.y, T.z, Q.z, N.z);   // thiên hà → cảnh
  const R = XD_SANG_TH;
  const Rm = new THREE.Matrix3().set(...R[0], ...R[1], ...R[2]);  // xích đạo → thiên hà
  return B.multiply(Rm);
}

// ───────────────────────── shader ─────────────────────────

const DINH_VO_CUC = /* glsl */ `
  vec4 veVoCuc(vec3 p) {
    vec4 q = projectionMatrix * vec4(mat3(viewMatrix) * mat3(modelMatrix) * p, 1.0);
    return vec4(q.xy, q.w * 0.99999, q.w);
  }`;

const SHADER_SAO = {
  vertexShader: /* glsl */ `
    attribute vec3 aMau; attribute float aSang; attribute float aPha;
    uniform float uTiLe, uSang, uNen, uGio;
    varying vec3 vMau; varying float vR, vL, vS, vI;
    ${DINH_VO_CUC}
    void main() {
      gl_Position = veVoCuc(position);
      float I = aSang * uSang;
      I = I / (1.0 + I * uNen);                                   // nền kín đáo: nén sao sáng
      I *= 1.0 + 0.045 * sin(uGio * (1.7 + aPha * 2.3) + aPha * 61.0) * smoothstep(0.12, 0.9, I);  // nhấp nháy rất nhẹ
      float r = min(0.7 + 0.7 * log2(max(I / 0.3, 1.0)), 3.2);             // bán kính lõi (điểm ảnh CSS)
      float L = I > 0.9 ? 4.0 + 10.0 * log2(I / 0.9 + 1.0) : 0.0;  // tia nhiễu xạ của sao sáng nhất
      float s = max(r * 3.6 + 1.0, L + 1.5);
      vR = r; vL = L; vS = s; vI = I; vMau = aMau;
      gl_PointSize = I < 0.003 ? 0.0 : 2.0 * s * uTiLe;
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vMau; varying float vR, vL, vS, vI;
    void main() {
      vec2 q = (gl_PointCoord - 0.5) * 2.0 * vS;
      float d2 = dot(q, q);
      float k = exp(-d2 / (2.0 * vR * vR));
      k += smoothstep(0.35, 1.2, vI) * 0.035 * exp(-sqrt(d2) / (1.6 * vR));   // viền mờ quanh sao sáng
      if (vL > 0.0) {
        vec2 a = abs(q);
        float w = 0.42;
        float t = exp(-a.y * a.y / (2.0 * w * w)) * pow(max(0.0, 1.0 - a.x / vL), 2.6)
                + exp(-a.x * a.x / (2.0 * w * w)) * pow(max(0.0, 1.0 - a.y / vL), 2.6);
        k += 0.16 * t * smoothstep(0.9, 2.2, vI);
      }
      gl_FragColor = vec4(vMau * (vI * k), 1.0);
    }`,
};

const SHADER_NGAN_HA = {
  vertexShader: /* glsl */ `
    varying vec3 vHuong;
    ${DINH_VO_CUC}
    void main() { vHuong = position; gl_Position = veVoCuc(position); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D uAnh; uniform mat3 uSangTH; uniform float uSang, uBMax;
    varying vec3 vHuong;
    float bam(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float nhieu(vec3 x) {
      vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(bam(i), bam(i + vec3(1, 0, 0)), f.x), mix(bam(i + vec3(0, 1, 0)), bam(i + vec3(1, 1, 0)), f.x), f.y),
                 mix(mix(bam(i + vec3(0, 0, 1)), bam(i + vec3(1, 0, 1)), f.x), mix(bam(i + vec3(0, 1, 1)), bam(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    void main() {
      vec3 g = uSangTH * normalize(vHuong);
      float l = atan(g.y, g.x), b = asin(clamp(g.z, -1.0, 1.0));
      vec2 uv = vec2(l / 6.2831853 + 0.5, b / (2.0 * uBMax) + 0.5);
      vec4 t = texture2D(uAnh, uv);
      float chiTiet = t.r * t.r, rong = t.g * t.g;
      // Vân mây sao: nhiễu nhiều tầng gắn chặt vào bầu trời (hình minh hoạ cho hàng triệu sao không phân giải được).
      float n1 = nhieu(g * 40.0), n2 = nhieu(g * 140.0), n3 = nhieu(g * 520.0);
      float van = 0.4 + 1.2 * (0.3 * n1 + 0.4 * n2 + 0.3 * n3);
      // Hạt li ti trong các đám mây sao (minh hoạ sao mờ hơn cấp 7,5), chỉ hiện khi mỗi ô cỡ một điểm ảnh, không lấp lánh khi thu nhỏ.
      float oPx = length(fwidth(g)) * 1400.0;
      float hatLi = pow(bam(floor(g * 1400.0)), 14.0) * smoothstep(0.12, 0.3, oPx) * (1.0 - smoothstep(0.7, 1.4, oPx));
      float sangLoi = exp(-l * l / 0.3) * exp(-b * b / 0.03);         // vùng phình quanh tâm (Nhân Mã, Thiên Yết)
      float I = (chiTiet * (van * 0.6 + hatLi * 2.5) + rong * 0.4) * (1.0 + 0.6 * sangLoi);
      I *= 0.36;                                                        // đỉnh khoảng 0,35: dưới ngưỡng quầng, không mờ đục
      // Màu: ấm ở vùng tâm, trung tính rồi hơi lạnh về phía ngược tâm; vết bụi ngả nâu.
      float am = exp(-l * l / 1.1);
      vec3 c = mix(vec3(0.82, 0.88, 1.0), vec3(1.0, 0.96, 0.9), smoothstep(2.6, 1.0, abs(l)));
      c = mix(c, vec3(1.0, 0.82, 0.6), am);
      float bui = clamp((rong - chiTiet) * 3.0, 0.0, 1.0) * smoothstep(0.02, 0.12, rong);
      c = mix(c, vec3(1.0, 0.7, 0.5), bui * 0.6);
      gl_FragColor = vec4(c * I * uSang, 1.0);
    }`,
};

const SHADER_NET = {
  vertexShader: /* glsl */ `
    ${DINH_VO_CUC}
    void main() { gl_Position = veVoCuc(position); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uMau;
    void main() { gl_FragColor = vec4(uMau, 1.0); }`,
};

// ───────────────────────── tạo bầu trời ─────────────────────────

export function taoBauTroi({ soSao = 5000, hat = 7, daiNganHa = null, doSang = 1, chomSao = null, nganHa = true, mauChomSao = 0x7f9cc8 } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'bauTroi';
  nhom.renderOrder = -1000;
  const huong = daiNganHa || huongMacDinh(hat);
  const M = maTranXichDaoSangCanh(huong);
  nhom.quaternion.setFromRotationMatrix(new THREE.Matrix4().setFromMatrix3(M));

  const dsMat = [];
  // Dải Ngân Hà: một lưới cầu, shader đọc ảnh đã tô theo toạ độ thiên hà.
  let matNH = null;
  if (nganHa) {
    const R = XD_SANG_TH;
    matNH = new THREE.ShaderMaterial({
      uniforms: {
        uAnh: { value: texNganHa() }, uSang: { value: 1 }, uBMax: { value: NH_B * D },
        uSangTH: { value: new THREE.Matrix3().set(...R[0], ...R[1], ...R[2]) },
      },
      ...SHADER_NGAN_HA, side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
    });
    matNH.tuyenTinh = true;
    const cau = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), matNH);
    cau.frustumCulled = false;
    cau.renderOrder = -1002;
    nhom.add(cau);
  }

  // Nét chòm sao (dưới sao, trên Ngân Hà).
  let matNet = null;
  if (chomSao) {
    const tat = giaiMaChomSao();
    const ma = chomSao === true ? Object.keys(tat) : chomSao;
    const p = [], v1 = [0, 0, 0], v2 = [0, 0, 0];
    for (const m of ma) for (const d of tat[m] || []) {
      for (let i = 0; i + 3 < d.length; i += 2) {
        vecXichDao(d[i], d[i + 1], v1); vecXichDao(d[i + 2], d[i + 3], v2);
        // Chừa một khe nhỏ quanh mỗi sao cho nét không đè lên sao.
        const goc = Math.acos(Math.max(-1, Math.min(1, v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2])));
        const k = Math.min(0.3, (0.55 * D) / Math.max(goc, 1e-6));
        for (let j = 0; j < 3; j++) p.push(v1[j] + (v2[j] - v1[j]) * k);
        for (let j = 0; j < 3; j++) p.push(v1[j] + (v2[j] - v1[j]) * (1 - k));
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    matNet = new THREE.ShaderMaterial({
      uniforms: { uMau: { value: new THREE.Color(mauChomSao) } },
      ...SHADER_NET, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
    });
    matNet.tuyenTinh = true;
    matNet.userData.mauGoc = new THREE.Color(mauChomSao);
    const net = new THREE.LineSegments(geo, matNet);
    net.frustumCulled = false;
    net.renderOrder = -1001;
    nhom.add(net);
  }

  // Sao: một lần vẽ điểm. Sao xếp từ sáng tới mờ nên chỉ cần vẽ n sao đầu.
  const s = giaiMaSao();
  const n = Math.max(200, Math.min(s.n, Math.round(soSao * 3)));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(s.viTri.subarray(0, n * 3), 3));
  geo.setAttribute('aMau', new THREE.BufferAttribute(s.mau.subarray(0, n * 3), 3));
  geo.setAttribute('aSang', new THREE.BufferAttribute(s.sang.subarray(0, n), 1));
  geo.setAttribute('aPha', new THREE.BufferAttribute(s.pha.subarray(0, n), 1));
  const matSao = new THREE.ShaderMaterial({
    uniforms: { uTiLe: { value: 1 }, uSang: { value: 1 }, uNen: { value: 0 }, uGio: { value: 0 } },
    ...SHADER_SAO, depthTest: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
  });
  matSao.tuyenTinh = true;
  const diem = new THREE.Points(geo, matSao);
  diem.frustumCulled = false;
  diem.renderOrder = -1000;
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  diem.onBeforeRender = (renderer) => {
    matSao.uniforms.uTiLe.value = renderer.getPixelRatio();
    matSao.uniforms.uGio.value = (performance.now() - t0) / 1000;
  };
  nhom.add(diem);
  dsMat.push(matSao);

  // Độ sáng: 1 lộng lẫy; 0,4–0,6 kín đáo (sao sáng bị nén, Ngân Hà mờ hẳn đi).
  nhom.datDoSang = (v) => {
    const k = Math.max(0, v);
    matSao.uniforms.uSang.value = k;
    matSao.uniforms.uNen.value = Math.max(0, 1 - k) * 1.4;
    if (matNH) matNH.uniforms.uSang.value = Math.pow(k, 1.6);
    if (matNet) matNet.uniforms.uMau.value.copy(matNet.userData.mauGoc).multiplyScalar(0.16 * Math.min(1, k * 1.3));
  };
  nhom.datDoSang(doSang);

  // Hướng tới một sao có tên / một chòm sao, trong hệ trục của vật cha (cùng hệ với daiNganHa).
  nhom.huongSao = (ten, ra = new THREE.Vector3()) => {
    const v = huongSaoXichDao(ten);
    return v ? ra.set(...v).applyQuaternion(nhom.quaternion) : null;
  };
  nhom.huongChomSao = (ma, ra = new THREE.Vector3()) => {
    const v = huongChomSaoXichDao(ma);
    return v ? ra.set(...v).applyQuaternion(nhom.quaternion) : null;
  };
  nhom.soSaoVe = n;
  return nhom;
}
