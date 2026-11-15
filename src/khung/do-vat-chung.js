// Phần dùng chung của thư viện đồ vật 3D (do-vat.js): lò xo làm mượt, vật liệu, kết cấu vẽ bằng canvas,
// môi trường phản chiếu, đèn cảnh, và vài hàm dựng khối (bo cạnh, ghép khối).
// Mọi màu ở đây là màu tuyến tính (xem «Hướng dẫn hình, tiếng, tương tác - Bản 3.md», mục 3).

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { texDom } from './ve.js';

export { mergeGeometries, RoundedBoxGeometry };

// ---------------------------------------------------------------- lò xo làm mượt
// Lò xo «tắt dần tới hạn»: đi tới đích nhanh nhất mà không vọt quá, có quán tính (đang chạy mà đổi đích
// thì không gãy khúc). Giải đúng bằng công thức nên ổn với mọi dt, không cấp phát bộ nhớ.
export class LoXo {
  constructor(v = 0, giay = 0.5) { this.v = v; this.dich = v; this.toc = 0; this.datGiay(giay); }
  // giay: thời gian để đi được khoảng 99% quãng đường
  datGiay(giay) { this.w = 6.6 / Math.max(0.02, giay); return this; }
  dat(dich, ngay = false) { this.dich = dich; if (ngay) { this.v = dich; this.toc = 0; } return this; }
  day(vanToc) { this.toc += vanToc; return this; }
  buoc(dt) {
    if (dt <= 0) return this.v;
    const w = this.w, x0 = this.v - this.dich, v0 = this.toc;
    const e = Math.exp(-w * dt), b = v0 + w * x0;
    this.v = this.dich + (x0 + b * dt) * e;
    this.toc = (v0 - w * b * dt) * e;
    if (Math.abs(this.v - this.dich) < 1e-6 && Math.abs(this.toc) < 1e-5) { this.v = this.dich; this.toc = 0; }
    return this.v;
  }
  get xong() { return this.v === this.dich && this.toc === 0; }
}

// ---------------------------------------------------------------- vật liệu
// Màu sRGB viết như thường (0xrrggbb); three.js tự đổi sang tuyến tính.
export const vlKimLoai = (mau = 0xb8bec8, nham = 0.32, them = {}) =>
  new THREE.MeshStandardMaterial({ color: mau, metalness: 1, roughness: nham, ...them });
export const vlSon = (mau = 0xdddddd, nham = 0.5, them = {}) =>
  new THREE.MeshStandardMaterial({ color: mau, metalness: 0, roughness: nham, ...them });
export const vlBong = (mau = 0xdddddd, nham = 0.35, them = {}) =>
  new THREE.MeshPhysicalMaterial({ color: mau, metalness: 0, roughness: nham, clearcoat: 0.6, clearcoatRoughness: 0.2, ...them });
// Vật phát sáng: doSang > 1 thì có quầng sáng của bộ dựng hình.
export const vlSang = (mau = 0xffffff, doSang = 2, them = {}) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(mau).multiplyScalar(doSang), ...them });
export const vlKinh = (mau = 0xcfe8ff, doMo = 0.18, them = {}) =>
  new THREE.MeshPhysicalMaterial({
    color: mau, metalness: 0, roughness: 0.04, transparent: true, opacity: doMo, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, side: THREE.DoubleSide, ...them,
  });

// ---------------------------------------------------------------- kết cấu vẽ bằng canvas
export function taoKetCau(rong, cao, ve, { srgb = true, lap = false } = {}) {
  const c = document.createElement('canvas');
  c.width = rong; c.height = cao;
  const g = c.getContext('2d');
  ve(g, rong, cao);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (lap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.userData.canvas = c;
  return t;
}

// Số ngẫu nhiên có hạt giống (để hình giống nhau mỗi lần dựng).
export function ngauNhien(hat = 7) {
  let s = hat >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

const _bo = {};
// Các kết cấu dùng chung, tạo một lần.
export function ketCau(ten) {
  if (_bo[ten]) return _bo[ten];
  let t;
  if (ten === 'vai') {
    // vân vải dệt của bộ đồ: dùng làm bản đồ gồ ghề (bumpMap)
    t = taoKetCau(128, 128, (g, w, h) => {
      const r = ngauNhien(11);
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(255,255,255,${0.05 + 0.05 * r()})`; g.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(0,0,0,${0.05 + 0.05 * r()})`; g.fillRect(x, 0, 1, h); }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.08 * r()})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
    }, { srgb: false, lap: true });
    t.repeat.set(4, 4);
  } else if (ten === 'la-vang') {
    // lá cách nhiệt vàng nhăn của vệ tinh
    t = taoKetCau(256, 256, (g, w, h) => {
      const r = ngauNhien(5);
      g.fillStyle = '#c99a3e'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) {
        const x = r() * w, y = r() * h, l = 10 + r() * 40, a = r() * Math.PI;
        g.strokeStyle = r() < 0.5 ? `rgba(255,236,170,${0.25 + 0.4 * r()})` : `rgba(90,55,10,${0.2 + 0.35 * r()})`;
        g.lineWidth = 1 + r() * 3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    }, { lap: true });
  } else if (ten === 'pin') {
    // tấm pin Mặt Trời: ô xanh thẫm, đường bạc
    t = taoKetCau(256, 256, (g, w, h) => {
      g.fillStyle = '#0b1636'; g.fillRect(0, 0, w, h);
      const n = 8, o = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const gr = g.createLinearGradient(i * o, j * o, i * o + o, j * o + o);
        gr.addColorStop(0, '#1a2f6e'); gr.addColorStop(1, '#0d1a46');
        g.fillStyle = gr; g.fillRect(i * o + 2, j * o + 2, o - 4, o - 4);
        g.fillStyle = 'rgba(200,210,235,0.35)'; g.fillRect(i * o + 2, j * o + o / 2, o - 4, 1);
      }
      g.strokeStyle = 'rgba(210,215,230,0.9)'; g.lineWidth = 2;
      for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * o, 0); g.lineTo(i * o, h); g.stroke(); g.beginPath(); g.moveTo(0, i * o); g.lineTo(w, i * o); g.stroke(); }
    }, { lap: true });
  }
  _bo[ten] = t;
  return t;
}

// ---------------------------------------------------------------- môi trường phản chiếu
const _moiTruong = new WeakMap();
// Bản đồ phản chiếu mềm (một căn phòng sáng, dựng bằng mã) cho kim loại và kính. Tạo một lần cho mỗi renderer.
export function layMoiTruong(renderer) {
  if (!renderer) return null;
  if (_moiTruong.has(renderer)) return _moiTruong.get(renderer);
  const pm = new THREE.PMREMGenerator(renderer);
  const phong = new RoomEnvironment();
  const tex = pm.fromScene(phong, 0.04).texture;
  phong.traverse((o) => { o.geometry?.dispose(); if (o.material) o.material.dispose(); });
  pm.dispose();
  _moiTruong.set(renderer, tex);
  return tex;
}

// Bộ đèn chuẩn cho cảnh có đồ vật: đèn chính ấm có hướng, đèn viền lạnh từ phía sau, đèn trời yếu,
// và môi trường phản chiếu nhẹ. Trả về { chinh, vien, troi, datCuongDo(k), huy() }.
export function taoDenCanh(scene, {
  renderer = null, cuongDo = 1, moiTruong = true, doPhanChieu = 0.35,
  huongChinh = [4, 7, 6], huongVien = [-5, 3, -6], mauChinh = 0xfff1de, mauVien = 0x9cc2ff,
} = {}) {
  const chinh = new THREE.DirectionalLight(mauChinh, 2.2);
  chinh.position.set(...huongChinh);
  const vien = new THREE.DirectionalLight(mauVien, 1.7);
  vien.position.set(...huongVien);
  const troi = new THREE.HemisphereLight(0x8a9ab8, 0x141820, 0.45);
  scene.add(chinh, vien, troi);
  const tex = moiTruong ? layMoiTruong(renderer) : null;
  const cu = { env: scene.environment, k: scene.environmentIntensity };
  if (tex) scene.environment = tex;
  const ketQua = {
    chinh, vien, troi,
    datCuongDo(k) {
      chinh.intensity = 2.2 * k; vien.intensity = 1.7 * k; troi.intensity = 0.45 * k;
      if (tex) scene.environmentIntensity = doPhanChieu * k;
    },
    huy() {
      scene.remove(chinh, vien, troi);
      if (tex) { scene.environment = cu.env; scene.environmentIntensity = cu.k ?? 1; }
    },
  };
  ketQua.datCuongDo(cuongDo);
  return ketQua;
}

// ---------------------------------------------------------------- khối
// Đặt vị trí/xoay cho một hình học (trả về chính nó, để viết gọn khi ghép).
export function dat(geo, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  if (sx !== 1 || sy !== 1 || sz !== 1) geo.scale(sx, sy, sz);
  if (rx) geo.rotateX(rx);
  if (ry) geo.rotateY(ry);
  if (rz) geo.rotateZ(rz);
  if (x || y || z) geo.translate(x, y, z);
  return geo;
}

// Ghép nhiều hình học thành một (cùng vật liệu → một lần vẽ). Bỏ thuộc tính lệch nhau trước khi ghép.
export function ghep(ds) {
  const giu = ['position', 'normal', 'uv'];
  // mergeGeometries cần tất cả cùng có (hoặc cùng không có) chỉ mục, cùng bộ thuộc tính
  const coIndex = ds.some((g) => g.index);
  for (const g of ds) {
    for (const k of Object.keys(g.attributes)) if (!giu.includes(k)) g.deleteAttribute(k);
    if (coIndex && !g.index) dienIndex(g);
  }
  const kq = mergeGeometries(ds, false);
  for (const g of ds) g.dispose();
  return kq;
}
function dienIndex(g) {
  const n = g.attributes.position.count;
  const a = new (n > 65535 ? Uint32Array : Uint16Array)(n);
  for (let i = 0; i < n; i++) a[i] = i;
  g.setIndex(new THREE.BufferAttribute(a, 1));
  return g;
}

// Hộp bo cạnh.
export const hopBo = (w, h, d, r = 0.02, doan = 1) => new RoundedBoxGeometry(w, h, d, doan, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4));

// Thanh nối hai điểm (trụ), dùng cho khung giàn.
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _y = new THREE.Vector3(0, 1, 0);
export function thanhNoi(p, q, r = 0.02, canh = 6) {
  _a.set(...p); _b.set(...q);
  const l = _a.distanceTo(_b);
  const g = new THREE.CylinderGeometry(r, r, l, canh, 1, true);
  const mx = (_a.x + _b.x) / 2, my = (_a.y + _b.y) / 2, mz = (_a.z + _b.z) / 2;
  _q.setFromUnitVectors(_y, _b.sub(_a).normalize());
  g.applyQuaternion(_q);
  g.translate(mx, my, mz);
  return g;
}

// Đốm sáng (sprite cộng sáng) có quầng.
export function domSang(mau = 0xffffff, co = 0.3, doSang = 2) {
  const m = new THREE.SpriteMaterial({
    map: texDom(), color: new THREE.Color(mau).multiplyScalar(doSang),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(co);
  return s;
}

// Đếm tam giác của một nhóm (để kiểm độ nhẹ).
export function demTamGiac(goc) {
  let n = 0;
  goc.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    const k = g.index ? g.index.count : g.attributes.position.count;
    n += (o.isPoints ? 0 : k / 3) * (o.count || 1);
  });
  return Math.round(n);
}

// Xoay hướng của vật theo một vec-tơ: trục +y của vật hướng theo (x, y, z).
export function huongTheo(vat, x, y, z) {
  _a.set(x, y, z).normalize();
  vat.quaternion.setFromUnitVectors(_y, _a);
}

// Đọc thuộc tính mỗi khung hình mà không cấp phát: dùng chung vài vec-tơ tạm.
export const tam = { v: new THREE.Vector3(), v2: new THREE.Vector3(), q: new THREE.Quaternion(), c: new THREE.Color() };
