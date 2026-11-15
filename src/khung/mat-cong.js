// Mặt nhúng của không gian quanh một khối lượng (paraboloid Flamm), dùng chung cho các bài 4–7.
//
// Đây là hình dạng THẬT của lát cắt xích đạo trong hình học Schwarzschild: hai vòng tròn có chu vi
// 2πr₁ và 2πr₂ cách nhau một khoảng đo-bằng-thước lớn hơn r₂ − r₁, và mặt cong thể hiện đúng phần dư đó.
// Chiều trũng xuống chỉ là quy ước vẽ; không có "phía dưới" nào trong không gian thật.

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { flamm, nhungSao, nhipDongHo, nhipDongHoTrongSao } from '../vat-ly/schwarzschild.js';
import { duongDayTinh } from './ve.js';

// Chất liệu của mặt cong (Bản 3): kính màu có khối. Màu lấy từ màu đỉnh (nhịp đồng hồ), sáng tối theo một ngọn đèn
// đặt chếch phía trên, viền sáng lên khi nhìn sát mặt (thấy rõ chỗ mặt uốn), có ánh phản chiếu nhẹ.
function taoChatLieuMat(doMo, sangVien = 1) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uDoMo: { value: doMo }, uVien: { value: sangVien } },
    vertexShader: /* glsl */ `
      attribute vec3 color; varying vec3 vMau; varying vec3 vN; varying vec3 vV;
      void main() {
        vMau = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalMatrix * normal; vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDoMo, uVien; varying vec3 vMau; varying vec3 vN; varying vec3 vV;
      void main() {
        vec3 v = normalize(vV);
        vec3 n = normalize(vN); if (dot(n, v) < 0.0) n = -n;       // mặt hai phía: luôn quay pháp tuyến về người nhìn
        vec3 den = normalize(vec3(0.35, 0.8, 0.5));
        float sang = 0.5 + 0.5 * dot(n, den);
        float vien = pow(clamp(1.0 - dot(n, v), 0.0, 1.0), 2.4);
        float bong = pow(max(dot(n, normalize(den + v)), 0.0), 42.0);
        vec3 c = vMau * (0.22 + 0.5 * sang) + vMau * 0.8 * uVien * vien + vec3(0.9, 0.95, 1.0) * 0.3 * bong;
        gl_FragColor = vec4(c, min(0.62, uDoMo * (0.7 + 1.35 * uVien * vien + 1.0 * bong)));
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  mat.tuyenTinh = true;
  mat.opacity = doMo;
  return mat;
}

// Màu theo nhịp đồng hồ n (1 = như ở rất xa, 0 = đứng hẳn): xanh trắng → vàng → cam đỏ → tối.
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
export function mauNhip(n, out = new THREE.Color()) {
  n = Math.max(0, Math.min(1, n));
  const nong = _c1.setRGB(1.0, 0.3, 0.12).lerp(_c2.setRGB(1.0, 0.8, 0.32), THREE.MathUtils.smoothstep(n, 0.12, 0.62));
  out.copy(nong).lerp(_c2.setRGB(0.5, 0.78, 1.0), THREE.MathUtils.smoothstep(n, 0.55, 0.985));
  return out.multiplyScalar(0.22 + 0.78 * Math.min(1, n * 2.2));
}

export class MatCong {
  // sangVien: độ sáng của viền kính khi nhìn sát mặt (1 = mặc định; 0,5 cho cảnh nhìn sát vào họng).
  constructor({ nR = 96, nPhi = 144, soTia = 24, doMoMat = 0.2, doMoLuoi = 0.75, sangVien = 1 } = {}) {
    this.nR = nR; this.nPhi = nPhi; this.soTia = soTia;
    this.nhom = new THREE.Group();
    // mặt mờ
    const nV = (nR + 1) * (nPhi + 1);
    this.vt = new Float32Array(nV * 3);
    this.mau = new Float32Array(nV * 3);
    const chiSo = [];
    for (let i = 0; i < nR; i++) for (let j = 0; j < nPhi; j++) {
      const a = i * (nPhi + 1) + j, b = a + 1, c = a + nPhi + 1, d = c + 1;
      chiSo.push(a, c, b, b, c, d);
    }
    this.geoMat = new THREE.BufferGeometry();
    this.geoMat.setAttribute('position', new THREE.BufferAttribute(this.vt, 3));
    this.geoMat.setAttribute('color', new THREE.BufferAttribute(this.mau, 3));
    this.geoMat.setIndex(chiSo);
    const chatLieu = taoChatLieuMat(doMoMat, sangVien);
    this.mat = new THREE.Mesh(this.geoMat, chatLieu);
    this.mat.onBeforeRender = () => { chatLieu.uniforms.uDoMo.value = chatLieu.opacity; };
    this.mat.renderOrder = -2;
    this.nhom.add(this.mat);
    // lưới
    // lưới: nét dày khử răng cưa (bề rộng tính bằng điểm ảnh), màu theo nhịp đồng hồ
    this.geoLuoi = new LineSegmentsGeometry();
    this.luoi = new LineSegments2(this.geoLuoi, new LineMaterial({ vertexColors: true, linewidth: 1.25, transparent: true, opacity: doMoLuoi, depthWrite: false }));
    this.luoi.frustumCulled = false;
    this.luoi.renderOrder = -1;
    this.nhom.add(this.luoi);
    this.rs = 1; this.R = null; this.rMax = 12; this.k = 1; this.kMau = 1; this._z0 = 0;
  }

  _z(r) { return this.R == null ? flamm(Math.max(r, this.rs), this.rs) : nhungSao(r, this.R, this.rs); }
  // độ cao của mặt tại bán kính r (âm = trũng xuống); mép ngoài nằm ở y = 0
  y(r) { return (this._z(Math.min(r, this.rMax)) - this._z0) * this.k; }
  // nhịp đồng hồ đứng yên tại r so với ở rất xa
  nhip(r) {
    if (this.rs <= 0) return 1;
    if (this.R != null && r < this.R) return nhipDongHoTrongSao(r, this.R, this.rs);
    return nhipDongHo(Math.max(r, this.rs), this.rs);
  }
  _mau(r, out) { return mauNhip(1 - (1 - this.nhip(r)) * this.kMau, out); }

  // rs: bán kính Schwarzschild; R: bán kính ngôi sao (null = lỗ đen); phongDai: nhân độ trũng khi vẽ;
  // kMau: khuếch đại độ lệch màu; vong: danh sách bán kính các vòng tròn lưới.
  dat({ rs = 1, R = null, rMax = 12, phongDai = 1, kMau = 1, vong = null }) {
    Object.assign(this, { rs, R, rMax, k: phongDai, kMau });
    this._z0 = 0; this._z0 = this._z(rMax);
    const rMin = R == null ? rs : 0;
    const { nR, nPhi } = this;
    const c = new THREE.Color();
    let p = 0;
    for (let i = 0; i <= nR; i++) {
      const r = rMin + (rMax - rMin) * Math.pow(i / nR, 1.7);     // dày điểm ở gần tâm, nơi mặt cong gắt
      const y = this.y(r);
      this._mau(r, c);
      for (let j = 0; j <= nPhi; j++) {
        const a = (j / nPhi) * 2 * Math.PI;
        this.vt[p] = r * Math.cos(a); this.vt[p + 1] = y; this.vt[p + 2] = r * Math.sin(a);
        this.mau[p] = c.r; this.mau[p + 1] = c.g; this.mau[p + 2] = c.b;
        p += 3;
      }
    }
    this.geoMat.attributes.position.needsUpdate = true;
    this.geoMat.attributes.color.needsUpdate = true;
    this.geoMat.computeVertexNormals();
    this.geoMat.computeBoundingSphere();

    const dsVong = vong || Array.from({ length: Math.floor(rMax) }, (_, i) => i + 1).filter((r) => r >= rMin);
    const d = [], m = [];
    const doan = (x0, y0, z0, x1, y1, z1, ca, cb) => { d.push(x0, y0, z0, x1, y1, z1); m.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b); };
    const ca = new THREE.Color(), cb = new THREE.Color();
    for (const r of dsVong) {
      if (r < rMin - 1e-9 || r > rMax + 1e-9) continue;
      const y = this.y(r);
      this._mau(r, ca).multiplyScalar(1.35);
      for (let j = 0; j < 144; j++) {
        const a0 = (j / 144) * 2 * Math.PI, a1 = ((j + 1) / 144) * 2 * Math.PI;
        doan(r * Math.cos(a0), y, r * Math.sin(a0), r * Math.cos(a1), y, r * Math.sin(a1), ca, ca);
      }
    }
    const M = 72;
    for (let t = 0; t < this.soTia; t++) {
      const a = (t / this.soTia) * 2 * Math.PI, cs = Math.cos(a), sn = Math.sin(a);
      for (let i = 0; i < M; i++) {
        const r0 = rMin + (rMax - rMin) * Math.pow(i / M, 1.7), r1 = rMin + (rMax - rMin) * Math.pow((i + 1) / M, 1.7);
        this._mau(r0, ca).multiplyScalar(1.1); this._mau(r1, cb).multiplyScalar(1.1);
        doan(r0 * cs, this.y(r0), r0 * sn, r1 * cs, this.y(r1), r1 * sn, ca, cb);
      }
    }
    // Đổi số đoạn thì phải dựng lại bộ đệm của nét dày (không ghi đè được bộ đệm cũ có cỡ khác).
    if (this._soDoan !== d.length) {
      this.geoLuoi.dispose();
      this.geoLuoi = new LineSegmentsGeometry();
      this.luoi.geometry = this.geoLuoi;
      this._soDoan = d.length;
    }
    this.geoLuoi.setPositions(d);
    this.geoLuoi.setColors(m);
  }
}

// Vòng tròn đặt lên mặt cong tại bán kính r (trả về nét dày; .material có color, opacity như cũ).
export function vongTrenMat(matCong, r, { mau = 0xffffff, doMo = 0.9, nang = 0.01, rong = 1.6 } = {}) {
  const n = 160, pts = new Float32Array((n + 1) * 3), y = matCong.y(r) + nang;
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; pts[i * 3] = r * Math.cos(a); pts[i * 3 + 1] = y; pts[i * 3 + 2] = r * Math.sin(a); }
  return duongDayTinh(pts, { mau, rong, doMo, cong: false }).line;
}
