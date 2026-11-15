import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 6 — Thuyết tương đối hẹp: phép biến đổi Lorentz (Bản 3: lưới vẽ trong shader, đồng hồ ánh sáng và con tàu
// có hình, đường thế giới của hai anh em là ống sáng, kéo vận tốc và điểm quay đầu, tiếng tích của hai đồng hồ).
// Sơ đồ Minkowski dựng trong 3D: x nằm ngang (trục X), ct hướng lên (trục Y), y vào sâu (trục Z); c = 1.
// Mọi vật thể được định nghĩa trong khung «phòng thí nghiệm», rồi vẽ SAU KHI áp phép biến đổi Lorentz với
// vận tốc khung nhìn β_nhìn (0 = phòng thí nghiệm). Đổi khung nhìn bằng cách cho độ nhanh φ = atanh β chạy dần
// tới đích, nên cả sơ đồ «quay hyperbol» mượt mà. Hình học được dựng lại chỉ khi có gì thay đổi.

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { so } from '../vat-ly/hang-so.js';
import { gamma, congVanToc, sinhDoi, muon, TAU_MUON_S } from '../vat-ly/lorentz.js';
import { TOC_NAY, NHIP_DONG_HO, dtDongThoi, chenhTuoi, THU_THACH_B6, datThuThach, vanTocBan } from '../vat-ly/lorentz-thu-thach.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, kep } from '../khung/ve.js';
import { MAU_KTG, nonAnhSang, suKien } from '../khung/ktg.js';
import { taoDenCanh, vlKimLoai, vlSang, vlSon, hopBo, dat, ghep, domSang, taoKetCau } from '../khung/do-vat-chung.js';
import { taoTenLua } from '../khung/do-vat-ten-lua.js';
import { taoDongHoAnhSang } from '../khung/do-vat-dong-ho.js';
import { taoTraiDat, taoSao } from '../khung/hanh-tinh.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('lorentz', khoa, goc, thamSo);

const R = String.raw;

// ----- Khung hình của sơ đồ (đơn vị hiển thị) -----
const B = { x0: -6.5, x1: 6.5, t0: -6, t1: 6 };
const YK = 2.6;                 // nửa bề sâu (chiều y) của các tấm kính
const XA = 60;                  // «xa vô cùng» để vẽ đường thẳng rồi cắt theo khung
const H_DH = 1;                 // khoảng cách hai gương của đồng hồ ánh sáng (theo y)
const W_DH = 0.3;               // nửa bề rộng gương
const T_DH = -5;                // lúc hai đồng hồ gặp nhau và cùng bắt đầu đếm
const L_DT = 3;                 // hai chớp sáng ở x = ±3
const L0 = 4;                   // độ dài riêng của thước trên tàu
const KM = 0.5;                 // bài muon: đơn vị hiển thị cho mỗi km
const H_MUON = 10.4;            // muon sinh ở độ cao 10,4 km (minh hoạ: đúng bằng quãng đường trung bình)
const B_MUON = 0.998;

// ----- Phép biến đổi đang dùng để vẽ: (t, x) phòng thí nghiệm → (t, x) khung nhìn, quanh điểm chốt (PT, PX) -----
// SC: phóng to quanh điểm chốt (chỉ dùng ở bài muon, để khung của muon nhìn được ở cùng cỡ hình).
let BV = 0, GV = 1, PT = 0, PX = 0, SC = 1;
const H_ = [0, 0];
function hien(t, x) {
  const dt = t - PT, dx = x - PX;
  H_[0] = SC * GV * (dt - BV * dx) + PT;
  H_[1] = SC * GV * (dx - BV * dt) + PX;
  return H_;
}
// Khung con tàu (vận tốc BS, gốc tại sự kiện (OT, OX) của phòng thí nghiệm) → phòng thí nghiệm.
let BS = 0.6, GS = 1.25, OT = 0, OX = 0;
const L_ = [0, 0];
function tuTau(tp, xp) {
  L_[0] = GS * (tp + BS * xp) + OT;
  L_[1] = GS * (xp + BS * tp) + OX;
  return L_;
}

// Cắt đoạn thẳng (trong tọa độ hiển thị x, t; y nội suy) theo khung B (Liang–Barsky).
let U0 = 0, U1 = 1;
const KQ = { ax: 0, at: 0, ay: 0, bx: 0, bt: 0, by: 0 };
function lb(p, q) {
  if (p === 0) return q >= 0;
  const r = q / p;
  if (p < 0) { if (r > U1) return false; if (r > U0) U0 = r; } else { if (r < U0) return false; if (r < U1) U1 = r; }
  return true;
}
function cat(ax, at, ay, bx, bt, by) {
  U0 = 0; U1 = 1;
  const dx = bx - ax, dt = bt - at;
  if (!lb(-dx, ax - B.x0) || !lb(dx, B.x1 - ax) || !lb(-dt, at - B.t0) || !lb(dt, B.t1 - at) || U1 <= U0) return false;
  KQ.ax = ax + U0 * dx; KQ.at = at + U0 * dt; KQ.ay = ay + U0 * (by - ay);
  KQ.bx = ax + U1 * dx; KQ.bt = at + U1 * dt; KQ.by = ay + U1 * (by - ay);
  return true;
}
const trongKhung = (x, t, le = 0) => x >= B.x0 - le && x <= B.x1 + le && t >= B.t0 - le && t <= B.t1 + le;

// Cắt đa giác lồi (cặp x, t) theo khung: Sutherland–Hodgman, bộ nhớ cấp sẵn.
const PA = new Float64Array(48), PB = new Float64Array(48);
function catNua(src, n, dst, k, s, b) {
  let m = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const vi = src[2 * i + k], vj = src[2 * j + k];
    const inI = s > 0 ? vi <= b : vi >= b, inJ = s > 0 ? vj <= b : vj >= b;
    if (inI) { dst[2 * m] = src[2 * i]; dst[2 * m + 1] = src[2 * i + 1]; m++; }
    if (inI !== inJ) {
      const u = (b - vi) / (vj - vi);
      dst[2 * m] = src[2 * i] + u * (src[2 * j] - src[2 * i]);
      dst[2 * m + 1] = src[2 * i + 1] + u * (src[2 * j + 1] - src[2 * i + 1]);
      m++;
    }
  }
  return m;
}
function catDaGiac(n) {
  n = catNua(PA, n, PB, 0, -1, B.x0); n = catNua(PB, n, PA, 0, 1, B.x1);
  n = catNua(PA, n, PB, 1, -1, B.t0); n = catNua(PB, n, PA, 1, 1, B.t1);
  return n;
}

// Nhiều đoạn thẳng rời nhau trong MỘT lần vẽ (lưới, đường gấp khúc đã cắt theo khung). Bộ nhớ cấp sẵn.
class NetDoan {
  constructor(toiDa, { mau = 0xffffff, rong = 1.4, doMo = 1, cong = true, quang = 0, net = null, sang = 1 } = {}) {
    this.toiDa = toiDa;
    mau = new THREE.Color(mau).multiplyScalar(sang);
    this.geo = new LineSegmentsGeometry();
    this.bo = new THREE.InstancedInterleavedBuffer(new Float32Array(toiDa * 6), 6, 1);
    this.bo.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('instanceStart', new THREE.InterleavedBufferAttribute(this.bo, 3, 0));
    this.geo.setAttribute('instanceEnd', new THREE.InterleavedBufferAttribute(this.bo, 3, 3));
    this.mat = new LineMaterial({
      color: mau, linewidth: rong, transparent: true, opacity: doMo, depthWrite: false,
      blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending,
      dashed: !!net, dashSize: net ? net[0] : 1, gapSize: net ? net[1] : 1,
    });
    this.line = new LineSegments2(this.geo, this.mat);
    this.line.frustumCulled = false;
    if (quang > 0) {
      const mq = new LineMaterial({ color: mau, linewidth: rong * 4.5, transparent: true, opacity: quang, depthWrite: false, blending: THREE.AdditiveBlending });
      const q = new LineSegments2(this.geo, mq);
      q.frustumCulled = false; q.renderOrder = -1;
      this.line.add(q);
    }
    this.n = 0;
    this.geo.instanceCount = 0;
  }
  bat() { this.n = 0; }
  // (x, t, y) vật lý → (X, Y, Z) của three.js
  them(ax, at, ay, bx, bt, by) {
    if (this.n >= this.toiDa) return;
    const a = this.bo.array, j = this.n * 6;
    a[j] = ax; a[j + 1] = at; a[j + 2] = ay; a[j + 3] = bx; a[j + 4] = bt; a[j + 5] = by;
    this.n++;
  }
  xong() {
    this.bo.needsUpdate = true;
    this.geo.instanceCount = this.n;
    if (this.mat.dashed) this.line.computeLineDistances();
  }
}

// Đoạn thẳng cho trong tọa độ phòng thí nghiệm → biến đổi → cắt → thêm vào nét.
function doan(net, t0, x0, y0, t1, x1, y1) {
  hien(t0, x0); const a0 = H_[0], a1 = H_[1];
  hien(t1, x1);
  if (!cat(a1, a0, y0, H_[1], H_[0], y1)) return false;
  net.them(KQ.ax, KQ.at, KQ.ay, KQ.bx, KQ.bt, KQ.by);
  return true;
}
// Đoạn thẳng cho trong tọa độ hiển thị (đã biến đổi) → cắt → thêm.
function doanHien(net, x0, t0, y0, x1, t1, y1) {
  if (!cat(x0, t0, y0, x1, t1, y1)) return false;
  net.them(KQ.ax, KQ.at, KQ.ay, KQ.bx, KQ.bt, KQ.by);
  return true;
}

// Mặt trong suốt dựng lại được (tam giác rời), bộ nhớ cấp sẵn.
class MatDong {
  constructor(toiDaTam, mau, doMo) {
    this.toiDa = toiDaTam;
    this.pos = new Float32Array(toiDaTam * 9);
    this.geo = new THREE.BufferGeometry();
    this.thuoc = new THREE.BufferAttribute(this.pos, 3);
    this.thuoc.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.thuoc);
    this.mesh = new THREE.Mesh(this.geo, vlKinhPhang(mau, doMo));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.n = 0;
  }
  bat() { this.n = 0; }
  tam(a, b, c, d, e, f, g, h, i) {
    if (this.n >= this.toiDa) return;
    const p = this.pos, k = this.n * 9;
    p[k] = a; p[k + 1] = b; p[k + 2] = c; p[k + 3] = d; p[k + 4] = e; p[k + 5] = f; p[k + 6] = g; p[k + 7] = h; p[k + 8] = i;
    this.n++;
  }
  // Đa giác (x, t) đang nằm trong PA, đặt ở chiều sâu y.
  daGiac(n, y) { for (let i = 1; i < n - 1; i++) this.tam(PA[0], PA[1], y, PA[2 * i], PA[2 * i + 1], y, PA[2 * i + 2], PA[2 * i + 3], y); }
  // Dải đứng: đoạn (x0, t0)–(x1, t1) kéo theo y từ ya tới yb.
  dai(x0, t0, x1, t1, ya, yb) {
    this.tam(x0, t0, ya, x1, t1, ya, x1, t1, yb);
    this.tam(x0, t0, ya, x1, t1, yb, x0, t0, yb);
  }
  xong() { this.geo.setDrawRange(0, this.n * 3); this.thuoc.needsUpdate = true; }
}

// Bộ đốm sáng và bộ nhãn dùng lại (không tạo mới mỗi lần dựng).
class BoDom {
  constructor(nhom, mau, co, n) {
    this.ds = Array.from({ length: n }, () => { const d = taoDom(mau, co); d.visible = false; nhom.add(d); return d; });
    this.i = 0;
  }
  bat() { this.i = 0; }
  them(x, t, y) { if (this.i >= this.ds.length) return null; const d = this.ds[this.i++]; d.position.set(x, t, y); d.visible = true; return d; }
  lab(t, x, y) { hien(t, x); return trongKhung(H_[1], H_[0], 0.01) ? this.them(H_[1], H_[0], y) : null; }
  xong() { for (let k = this.i; k < this.ds.length; k++) this.ds[k].visible = false; }
}
class BoNhan {
  constructor(nhom, n) {
    this.ds = Array.from({ length: n }, () => { const o = taoNhan('', ''); o.visible = false; nhom.add(o); return o; });
    this.i = 0;
  }
  bat() { this.i = 0; }
  // phai = true: nhãn nằm bên trái điểm (canh phải).
  them(html, lop, x, t, y = 0, phai = false) {
    if (!html || this.i >= this.ds.length || !trongKhung(x, t, 0.3)) return null;
    const o = this.ds[this.i++];
    const ten = `nhan ${lop}${phai ? ' phai' : ''}`;
    if (o.element.className !== ten) o.element.className = ten;
    o.center.x = phai ? 1 : 0;
    o.datChu(html);
    o.position.set(x, t, y);
    o.visible = true;
    return o;
  }
  lab(html, lop, t, x, y = 0, phai = false) { hien(t, x); return this.them(html, lop, H_[1], H_[0], y, phai); }
  xong() { for (let k = this.i; k < this.ds.length; k++) this.ds[k].visible = false; }
}

// Đường thế giới (tọa độ hiển thị, chưa cắt) để tìm chỗ «bây giờ» của khung nhìn cắt qua nó.
class DuongChay {
  constructor(n) { this.p = new Float32Array(n * 3); this.n = 0; this.toiDa = n; }
  bat() { this.n = 0; }
  lab(t, x, y = 0) { if (this.n >= this.toiDa) return; hien(t, x); const k = this.n * 3; this.p[k] = H_[1]; this.p[k + 1] = H_[0]; this.p[k + 2] = y; this.n++; }
  // Tìm điểm có t hiển thị = tau; ghi vào D_ (x, t, y, tỉ lệ dọc đoạn, chỉ số đoạn).
  tai(tau) {
    const p = this.p;
    for (let i = 0; i + 1 < this.n; i++) {
      const ta = p[i * 3 + 1], tb = p[i * 3 + 4];
      if ((ta <= tau && tau <= tb) || (tb <= tau && tau <= ta)) {
        const u = tb === ta ? 0 : (tau - ta) / (tb - ta);
        D_[0] = p[i * 3] + u * (p[i * 3 + 3] - p[i * 3]); D_[1] = tau; D_[2] = p[i * 3 + 2] + u * (p[i * 3 + 5] - p[i * 3 + 2]);
        D_[3] = u; D_[4] = i;
        return true;
      }
    }
    return false;
  }
}
const D_ = [0, 0, 0, 0, 0];

// =====================================================================
// Bản 3: vật liệu, lưới, ống sáng và đồ vật riêng của bài
// =====================================================================

// Kính phẳng cho các tấm «bây giờ» và dải thế giới: sáng dần ra mép (theo chiều sâu y) và theo góc nhìn sát mặt.
function vlKinhPhang(mau, doMo) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uYK: { value: YK } },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vV;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mv = viewMatrix * w; vV = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uDoMo, uYK; varying vec3 vW; varying vec3 vV;
      void main() {
        vec3 n = normalize(cross(dFdx(vV), dFdy(vV)));
        float sat = pow(1.0 - abs(dot(n, normalize(-vV))), 2.0);       // nhìn sát mặt kính thì đậm hơn
        float mep = smoothstep(0.82, 1.0, abs(vW.z) / uYK);             // sáng dần ra mép
        float a = uDoMo * (0.85 + 1.3 * sat + 2.2 * mep);
        gl_FragColor = vec4(uMau * (1.0 + 0.8 * mep), min(a, 0.42));
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  mat.tuyenTinh = true;
  mat.opacity = doMo;
  mat.color = mat.uniforms.uMau.value;
  return mat;
}

// Lưới Minkowski vẽ trong shader trên mặt phẳng của sơ đồ: lưới phòng thí nghiệm (trắng, mờ, lùi sau) và lưới
// con tàu (xanh lam, rõ hơn), các hyperbol bất biến là dải sáng mềm. Mỗi điểm ảnh tự đổi tọa độ hiển thị về tọa độ
// phòng thí nghiệm (nghịch đảo phép hien()) rồi về tọa độ con tàu, nên nét luôn mảnh đều, khử răng cưa, không rối.
function taoLuoiMinkowski() {
  const geo = new THREE.PlaneGeometry(B.x1 - B.x0, B.t1 - B.t0);
  geo.translate((B.x0 + B.x1) / 2, (B.t0 + B.t1) / 2, -0.01);
  const u = {
    uBV: { value: 0 }, uGV: { value: 1 }, uPT: { value: 0 }, uPX: { value: 0 }, uSC: { value: 1 },
    uBS: { value: 0.6 }, uGS: { value: 1.25 }, uOT: { value: 0 }, uOX: { value: 0 },
    uLab: { value: 1 }, uTau: { value: 1 }, uHyper: { value: 0 }, uBuoc: { value: 1 }, uGoc: { value: new THREE.Vector2(0, 0) },
    uKhung: { value: new THREE.Vector4(B.x0, B.x1, B.t0, B.t1) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uBV, uGV, uPT, uPX, uSC, uBS, uGS, uOT, uOX, uLab, uTau, uHyper, uBuoc;
      uniform vec2 uGoc; uniform vec4 uKhung;
      varying vec2 vP;
      float net(vec2 o, float rong) {
        vec2 d = max(fwidth(o), vec2(1e-6));
        vec2 g = abs(fract(o - 0.5) - 0.5) / d;
        float phu = smoothstep(0.012, 0.06, max(d.x, d.y));               // ô quá nhỏ trên màn hình: mờ đi
        return (1.0 - smoothstep(rong * 0.5 - 0.5, rong * 0.5 + 0.7, min(g.x, g.y))) * (1.0 - phu);
      }
      float vach(float s2, float k, float w) { float d = (s2 - k) / w; return exp(-d * d * 0.45) + 0.16 * exp(-d * d * 0.03); }
      void main() {
        float dtd = vP.y - uPT, dxd = vP.x - uPX;
        float t = uPT + uGV * (dtd + uBV * dxd) / uSC;
        float x = uPX + uGV * (dxd + uBV * dtd) / uSC;
        float gL = uLab > 0.001 ? net((vec2(x, t) - uGoc) / uBuoc, 1.0) * uLab : 0.0;
        float tp = uGS * ((t - uOT) - uBS * (x - uOX));
        float xp = uGS * ((x - uOX) - uBS * (t - uOT));
        float gT = uTau > 0.001 ? net(vec2(xp, tp), 1.25) * uTau : 0.0;
        float h = 0.0;
        if (uHyper > 0.001) {
          float s2 = -t * t + x * x;
          float w = max(fwidth(s2), 1e-5);
          for (int i = 1; i <= 3; i++) { float k = float(i * i); h += vach(s2, k, w) + vach(s2, -k, w); }
        }
        float mep = smoothstep(0.0, 0.9, min(min(vP.x - uKhung.x, uKhung.y - vP.x), min(vP.y - uKhung.z, uKhung.w - vP.y)));
        vec3 c = vec3(0.85, 0.9, 1.0) * gL * 0.085 + vec3(0.5, 0.79, 1.0) * gT * 0.5 + vec3(0.78, 0.62, 1.0) * h * uHyper * 0.34;
        gl_FragColor = vec4(c * mep, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  mat.tuyenTinh = true;
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = -2;
  m.u = u;
  return m;
}

// Ống sáng: đường thế giới dựng thành ống tròn phát sáng. Bộ nhớ cấp sẵn, cập nhật tại chỗ. Phần cao hơn uNay
// (trục thời gian của cảnh) là tương lai của khung đang nhìn: mờ và đứt khúc.
const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _Bv = new THREE.Vector3(), _R = new THREE.Vector3();
class OngSang {
  constructor(toiDa, { mau = 0xffffff, banKinh = 0.05, sang = 2.2, canh = 10, moTuongLai = 0.14 } = {}) {
    this.toiDa = Math.max(2, toiDa);
    this.canh = canh;
    this.r = banKinh;
    this.diem = new Float32Array(this.toiDa * 3);
    const nv = this.toiDa * canh;
    this.pos = new Float32Array(nv * 3);
    this.phap = new Float32Array(nv * 3);
    this.cos = Float32Array.from({ length: canh }, (_, j) => Math.cos((j / canh) * 2 * Math.PI));
    this.sin = Float32Array.from({ length: canh }, (_, j) => Math.sin((j / canh) * 2 * Math.PI));
    const geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aPhap = new THREE.BufferAttribute(this.phap, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.aPos);
    geo.setAttribute('normal', this.aPhap);
    const chiSo = new Uint16Array((this.toiDa - 1) * canh * 6);
    let m = 0;
    for (let i = 0; i < this.toiDa - 1; i++) {
      for (let j = 0; j < canh; j++) {
        const a = i * canh + j, b = i * canh + ((j + 1) % canh), c = a + canh, d = b + canh;
        chiSo[m++] = a; chiSo[m++] = c; chiSo[m++] = b; chiSo[m++] = b; chiSo[m++] = c; chiSo[m++] = d;
      }
    }
    geo.setIndex(new THREE.BufferAttribute(chiSo, 1));
    geo.setDrawRange(0, 0);
    this.geo = geo;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uMau: { value: new THREE.Color(mau).multiplyScalar(sang) }, uNay: { value: 1e9 }, uMo: { value: moTuongLai } },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vY = w.y;
          vec4 mv = viewMatrix * w;
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uMau; uniform float uNay, uMo; varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          float loi = pow(abs(dot(normalize(vN), normalize(vV))), 2.4);
          float tl = smoothstep(uNay - 0.015, uNay + 0.05, vY);
          float dut = 0.3 + 0.7 * smoothstep(0.35, 0.5, abs(fract(vY * 2.2) - 0.5) * 2.0);
          gl_FragColor = vec4(uMau * (0.22 + 1.15 * loi) * mix(1.0, uMo * dut, tl), 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.mat.tuyenTinh = true;
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.n = 0;
  }
  dat(i, x, y, z) { const k = i * 3; this.diem[k] = x; this.diem[k + 1] = y; this.diem[k + 2] = z; }
  xong(n) {
    n = Math.min(n, this.toiDa);
    this.n = n;
    if (n < 2) { this.geo.setDrawRange(0, 0); return; }
    const d = this.diem, P = this.pos, Q = this.phap, C = this.cos, Sn = this.sin, r = this.r, M = this.canh;
    let coN = false;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1) * 3, b = Math.min(n - 1, i + 1) * 3;
      _T.set(d[b] - d[a], d[b + 1] - d[a + 1], d[b + 2] - d[a + 2]);
      if (_T.lengthSq() < 1e-14) _T.set(0, 1, 0);
      _T.normalize();
      if (coN) _N.addScaledVector(_T, -_N.dot(_T));
      if (!coN || _N.lengthSq() < 1e-8) {
        _R.set(Math.abs(_T.y) < 0.9 ? 0 : 1, Math.abs(_T.y) < 0.9 ? 1 : 0, 0);
        _N.copy(_R).addScaledVector(_T, -_R.dot(_T));
        coN = true;
      }
      _N.normalize();
      _Bv.crossVectors(_T, _N);
      const x = d[i * 3], y = d[i * 3 + 1], z = d[i * 3 + 2];
      for (let j = 0; j < M; j++) {
        const nx = C[j] * _N.x + Sn[j] * _Bv.x, ny = C[j] * _N.y + Sn[j] * _Bv.y, nz = C[j] * _N.z + Sn[j] * _Bv.z;
        const k = (i * M + j) * 3;
        P[k] = x + r * nx; P[k + 1] = y + r * ny; P[k + 2] = z + r * nz;
        Q[k] = nx; Q[k + 1] = ny; Q[k + 2] = nz;
      }
    }
    this.aPos.needsUpdate = true;
    this.aPhap.needsUpdate = true;
    this.geo.setDrawRange(0, (n - 1) * M * 6);
  }
  // Ống thẳng nối hai điểm (tọa độ hiển thị x, t, y), cắt theo khung hình.
  doan(x0, t0, y0, x1, t1, y1) {
    if (!cat(x0, t0, y0, x1, t1, y1)) { this.xong(0); return false; }
    this.dat(0, KQ.ax, KQ.at, KQ.ay); this.dat(1, KQ.bx, KQ.bt, KQ.by); this.xong(2);
    return true;
  }
}

// Vị trí hiển thị của một vật đi đều (vận tốc b trong phòng thí nghiệm, qua sự kiện (t0, x0) của phòng thí nghiệm)
// tại thời điểm hiển thị «tau» của khung đang nhìn. Giải phương trình bậc nhất thay vì dò, nên đúng tuyệt đối.
// Trả về [x hiển thị, t phòng thí nghiệm, vận tốc so với khung nhìn].
const VT_ = [0, 0, 0];
function viTriTrenDuong(b, t0, x0, tau) {
  const t = PT + ((tau - PT) / (SC * GV) + BV * (x0 + b * PT - b * t0 - PX)) / (1 - BV * b);
  const x = x0 + b * (t - t0);
  VT_[0] = SC * GV * ((x - PX) - BV * (t - PT)) + PX;
  VT_[1] = t;
  VT_[2] = (b - BV) / (1 - b * BV);
  return VT_;
}

// Con tàu: tên lửa của thư viện đồ vật nằm ngang, dài khoảng 0,9 đơn vị. datVanToc(bRel) quay mũi theo hướng bay và
// co chiều dài theo đúng 1/γ của vận tốc so với khung đang nhìn (co độ dài áp cho cả vật, không chỉ cho thước).
function taoTauNho({ co = 0.2, mauNhan = 0x7fcaff } = {}) {
  const nhom = new THREE.Group();
  const co1 = new THREE.Group();
  nhom.add(co1);
  const tl = taoTenLua({ cao: 4.2, banKinh: 0.42, mauNhan, luc: 0, doDaiLua: 2.4 });
  tl.nhom.scale.setScalar(co);
  tl.nhom.rotation.z = -Math.PI / 2;
  tl.nhom.position.x = -(4.58 * co) / 2;
  co1.add(tl.nhom);
  return {
    nhom,
    datVanToc(bRel) {
      co1.rotation.y = bRel < -1e-4 ? Math.PI : 0;
      co1.scale.x = Math.sqrt(Math.max(0, 1 - bRel * bRel));
    },
    datLucDay: (k) => tl.datLucDay?.(k, 0.25),
    capNhat: (dt) => tl.capNhat?.(dt),
  };
}

// Cây thước 4 đơn vị của tàu: thanh kim loại có 4 ô sơn xen màu, vạch chia, hai đầu phát sáng.
// Gốc ở giữa thước; thước nằm dọc trục x. datDai(L) co thước (cả các vạch) về độ dài L.
function taoThuoc(L0 = 4) {
  const nhom = new THREE.Group();
  const co1 = new THREE.Group();
  nhom.add(co1);
  const tex = taoKetCau(1024, 64, (g, w, h) => {
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? '#d9dee6' : '#3f78b8';
      g.fillRect((i * w) / 4, 0, w / 4, h);
    }
    g.fillStyle = 'rgba(10,14,22,0.9)';
    for (let i = 0; i <= 40; i++) {
      const x = Math.min(w - 2, (i * w) / 40);
      const dai = i % 10 === 0 ? h : i % 5 === 0 ? h * 0.55 : h * 0.3;
      g.fillRect(x - (i % 10 ? 1 : 2), 0, i % 10 ? 2 : 4, dai);
    }
  });
  const vlMat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.35, roughness: 0.45 });
  const vlVo = vlKimLoai(0xaab2c0, 0.3);
  const than = new THREE.Mesh(new THREE.BoxGeometry(L0, 0.14, 0.42), [vlVo, vlVo, vlMat, vlVo, vlMat, vlVo]);
  co1.add(than);
  for (const s of [-1, 1]) {
    const dau = new THREE.Mesh(hopBo(0.06, 0.18, 0.46, 0.015), vlSang(MAU_KTG.thoiGian, 2.2));
    dau.position.x = (s * L0) / 2;
    co1.add(dau);
  }
  return { nhom, datDai(L) { co1.scale.x = L / L0; } };
}

const CHU_DE = [
  { giaTri: 'tiende', nhan: chuCanh("canh.tien-de", "Tiên đề") },
  { giaTri: 'dongho', nhan: chuCanh("canh.dong-ho", "Đồng hồ") },
  { giaTri: 'dongthoi', nhan: chuCanh("canh.dong-thoi", "Đồng thời") },
  { giaTri: 'thuoc', nhan: chuCanh("canh.thuoc", "Thước") },
  { giaTri: 'lorentz', nhan: chuCanh("canh.luoi-lorentz", "Lưới Lorentz") },
  { giaTri: 'cong', nhan: chuCanh("canh.cong-van-toc", "Cộng vận tốc") },
  { giaTri: 'sinhdoi', nhan: chuCanh("canh.sinh-doi", "Sinh đôi") },
  { giaTri: 'muon', nhan: chuCanh("canh.muon", "Muon") },
];

// Sự kiện mẫu cho bước «quay hyperbol»: (t, x) trong phòng thí nghiệm.
const SK_MAU = [
  { ten: 'P', t: 3, x: 1, mau: MAU_KTG.hong },
  { ten: 'Q', t: 1, x: 3.5, mau: MAU_KTG.tim },
  { ten: 'R', t: -2.5, x: -1.2, mau: 0xffb86b },
];

export default {
  id: 'lorentz',
  ten: 'Thuyết tương đối hẹp: phép biến đổi Lorentz',
  moTa: 'Khi tốc độ lớn, chính tấm «bây giờ» cũng nghiêng',
  yChinh: 'Tốc độ ánh sáng như nhau với mọi người quan sát. Muốn thế, thời gian và không gian phải đổi lẫn cho nhau khi đổi khung: đồng hồ chuyển động chạy chậm, thước chuyển động ngắn lại, và hai người chuyển động với nhau không đồng ý thế nào là «cùng lúc». Trên sơ đồ không-thời gian, đổi khung là một phép «quay hyperbol»: tia sáng đứng yên, các sự kiện trượt dọc những hyperbol bất biến.',
  mayAnh: { viTri: [6, 5, 23.5], dich: [0, 0, 0], fov: 40, min: 5, max: 60 },

  baiGiang: {
    mucTieu: [
      'Phát biểu được hai tiên đề của Einstein và thấy vì sao chúng buộc thời gian phải tương đối.',
      'Suy ra được hệ số γ từ đồng hồ ánh sáng và dùng nó tính giãn thời gian, co độ dài.',
      'Vẽ được trục ct′ và x′ của người chuyển động trên sơ đồ Minkowski, và đọc ra «bây giờ» của người đó.',
      'Dùng được phép biến đổi Lorentz và công thức cộng vận tốc; biết khoảng s² không đổi.',
      'Giải thích được nghịch lý anh em sinh đôi và các bằng chứng thật: muon, GPS, máy gia tốc.',
    ],
    buoc: [
      {
        ten: 'Hai tiên đề của Einstein',
        noiDung: R`
          Trên màn hình là sơ đồ không-thời gian quen thuộc của Bài 4 và Bài 5: trục ngang là $x$, trục đứng là $ct$, chiều sâu là $y$. Ở gốc tọa độ có một chớp sáng. Ánh sáng của nó lan ra thành {{nón ánh sáng}} màu vàng. Đường thẳng xanh lam là một con tàu bay ngang qua chỗ chớp sáng với tốc độ $0{,}6\,c$.

          Năm 1905, Einstein xây cả thuyết tương đối hẹp trên hai câu, gọi là hai {{tiên đề}}:

          1. **Định luật vật lý như nhau trong mọi {{khung quán tính}}.** Không thí nghiệm nào làm trong một con tàu kín, bay đều, cho biết tàu đang «thật sự» đứng yên hay chuyển động.
          2. **Tốc độ ánh sáng trong chân không như nhau với mọi người quan sát**, dù nguồn sáng hay người đo chuyển động thế nào: $c = 299\,792{,}458$ km/s.

          Hai vòng xanh lục là mặt sóng của chớp sáng **cùng một lúc theo phòng thí nghiệm**: vòng tròn tâm ở người đứng yên. Hai vòng xanh lam là mặt sóng **cùng một lúc theo con tàu**. Cả bốn vòng nằm trên **cùng một nón**.

          > [Thử ngay] Đổi sang khung con tàu. Cả sơ đồ quay đi, nhưng nón ánh sáng đứng nguyên. Giờ vòng xanh lam mới là vòng tròn có tâm ở con tàu: mỗi người đều thấy ánh sáng lan ra đều mọi phía quanh mình. Ở khung phòng thí nghiệm, kéo đốm xanh lam ở phần dưới đường của con tàu để đổi tốc độ: vòng xanh lam méo theo nhưng vẫn nằm trên nón.
          > [[Nhìn từ con tàu|tau]] [[Nhìn từ phòng thí nghiệm|lab]] [[Tàu bay 0,9 c|b9]]

          Đó là chỗ nghịch lý: hai người chuyển động với nhau mà cùng đứng ở tâm của một mặt cầu ánh sáng. Điều này chỉ có thể xảy ra nếu hai người **không cùng một «bây giờ»**. Cả bài này là hệ quả của câu đó.

          +++ Đi sâu: vì sao cộng vận tốc kiểu thường không dùng được với ánh sáng
          Theo Galilei và Newton, nếu tàu bay $v$ và bắn ra phía trước một viên đạn $u$ thì đạn đi $u + v$ so với mặt đất. Áp vào ánh sáng: ánh sáng phát từ tàu phải đi $c + v$. Thực nghiệm không thấy điều ấy. Thí nghiệm Michelson và Morley (1887) cho thấy tốc độ ánh sáng đo được không đổi dù Trái Đất chuyển động. Còn việc ánh sáng phát từ một nguồn đang bay vẫn đi đúng $c$, không phải $c + v$, được kiểm bằng ánh sáng của các sao đôi (de Sitter, 1913) và bằng tia gamma từ hạt pion bay gần $c$ (Alväger và cộng sự, 1964).

          Einstein chọn tin vào tiên đề 2 và sửa cách đổi tọa độ. Phép đổi mới (phép biến đổi Lorentz, bước 5) giữ nguyên tiên đề 1 vì nó giống hệt nhau cho mọi khung quán tính, và giữ nguyên tiên đề 2 vì nó biến nón ánh sáng thành chính nó. Cái giá phải trả: thời gian không còn chung cho mọi người.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'tiende', beta: 0.6, khung: 'lab', mayAnh: 'chinh' }),
        nut: { tau: (c) => c.datKhung('tau'), lab: (c) => c.datKhung('lab'), b9: (c) => c.datBeta(0.9) },
      },
      {
        ten: 'Đồng hồ ánh sáng: giãn thời gian',
        noiDung: R`
          Đây là hai chiếc {{đồng hồ ánh sáng}} giống hệt nhau. Mỗi chiếc có hai gương song song cách nhau $h$ theo chiều $y$ (vào sâu). Một tia sáng nảy qua lại giữa hai gương; mỗi lần nó về tới gương dưới là một «tích». Dải màu là dải thế giới của hai gương; đường vàng gấp khúc là đường thế giới của tia sáng.

          Chiếc màu trắng đứng yên trong phòng thí nghiệm: tia sáng đi thẳng lên, thẳng xuống, mỗi tích mất $2h/c$. Chiếc xanh lam gắn trên tàu. Nhìn từ phòng thí nghiệm, tia sáng của nó phải đi đường chéo, dài hơn, mà vẫn với tốc độ $c$. Vậy mỗi tích của nó **lâu hơn**:

          $$ \Delta t = \gamma\,\Delta\tau, \qquad \gamma = \frac{1}{\sqrt{1 - v^2/c^2}} $$

          $\Delta\tau$ là thời gian giữa hai tích đo bằng chính đồng hồ đó (thời gian riêng), $\Delta t$ là thời gian đo trong phòng thí nghiệm, $\gamma$ là {{hệ số Lorentz}}. Ví dụ ở $0{,}6\,c$: $\gamma = 1/\sqrt{1 - 0{,}36} = 1/0{,}8 = 1{,}25$. Đồng hồ trên tàu tích 4 lần thì đồng hồ phòng thí nghiệm tích 5 lần. Đó là {{giãn thời gian}}.

          | $v/c$ | 0,1 | 0,5 | 0,6 | 0,8 | 0,9 | 0,99 | 0,999 |
          |---|---|---|---|---|---|---|---|
          | $\gamma$ | 1,005 | 1,155 | 1,25 | 1,667 | 2,294 | 7,089 | 22,37 |

          > [Thử ngay] Tấm kính xanh lục đi lên là «bây giờ» của khung đang nhìn; số tích của hai đồng hồ ghi ở ô số liệu. Nghe: mỗi tích của đồng hồ phòng thí nghiệm là một tiếng trầm bên trái, của đồng hồ trên tàu là một tiếng cao bên phải; ở $0{,}6\,c$ tiếng bên phải thưa hơn đúng 1,25 lần. Kéo đốm xanh lam trên đường của đồng hồ trên tàu để đổi tốc độ. Rồi đổi sang khung con tàu: giờ chính đồng hồ phòng thí nghiệm chạy chậm. Giãn thời gian là **đối xứng**.
          > [[Tàu 0,6 c|b6]] [[Tàu 0,8 c|b8]] [[Nhìn từ con tàu|tau]] [[Về phòng thí nghiệm|lab]]

          > [Lưu ý] Hai gương cách nhau $h$ = 1 đơn vị, bằng cỡ cả sơ đồ, để thấy rõ tia sáng. Đồng hồ thật nhỏ hơn rất nhiều; kết quả không phụ thuộc $h$. Tiếng tích đi đúng nhịp tia sáng trong mô hình, chỉ chạy chậm lại cho tai nghe kịp: một tích của đồng hồ đứng yên kéo dài khoảng 1,8 giây.

          +++ Đi sâu: suy ra γ bằng định lý Pythagoras, từng dòng
          Xét một nửa tích của đồng hồ trên tàu, nhìn từ phòng thí nghiệm. Gọi $\Delta t$ là thời gian của cả một tích.

          1. Trong nửa tích, tia sáng đi được quãng $c\,\Delta t/2$ (tiên đề 2: tốc độ vẫn là $c$).
          2. Cùng lúc đó tàu dịch ngang một đoạn $v\,\Delta t/2$.
          3. Hai gương cách nhau $h$ theo chiều vuông góc với chuyển động. Chiều này không co (nếu co thì hai đồng hồ đi ngang qua nhau sẽ cùng thấy gương của người kia ngắn hơn, vô lý).
          4. Tam giác vuông: $(c\,\Delta t/2)^2 = h^2 + (v\,\Delta t/2)^2$.
          5. Chuyển vế: $(\Delta t/2)^2\,(c^2 - v^2) = h^2$, nên $\Delta t = \dfrac{2h}{\sqrt{c^2 - v^2}} = \dfrac{2h/c}{\sqrt{1 - v^2/c^2}}$.
          6. Trên tàu, tia sáng đi thẳng lên xuống nên $\Delta\tau = 2h/c$. Chia hai dòng: $\Delta t = \gamma\,\Delta\tau$.

          Với tốc độ đời thường $\gamma$ rất gần 1: máy bay 900 km/h có $\gamma - 1 \approx 3{,}5 \times 10^{-13}$. Vì vậy không ai nhận ra trước năm 1905.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'dongho', beta: 0.6, khung: 'lab', mayAnh: 'nghieng' }),
        nut: { b6: (c) => c.datBeta(0.6), b8: (c) => c.datBeta(0.8), tau: (c) => c.datKhung('tau'), lab: (c) => c.datKhung('lab') },
        thuThach: {
          de: 'Chỉnh vận tốc con tàu cho **γ = 2**: đồng hồ trên tàu tích một lần thì đồng hồ phòng thí nghiệm tích đúng hai lần.',
          kiem: (c) => { const s = c.trangThai(); return s.chuDe === 'dongho' && datThuThach.gamma2(s.beta); },
          goiY: R`$\gamma = 2$ nghĩa là $\sqrt{1 - v^2/c^2} = 1/2$, tức $v = \tfrac{\sqrt 3}{2}\,c \approx 0{,}87\,c$. Ô số liệu ghi γ hiện tại.`,
        },
      },
      {
        ten: 'Đồng thời là tương đối',
        noiDung: R`
          Hai chớp sáng A và B nổ ở $x = -3$ và $x = +3$, **cùng lúc** $t = 0$ theo phòng thí nghiệm. Người đứng ở giữa ($x = 0$, đường trắng) nhận ánh sáng của cả hai đúng một lúc, ở $t = 3$. Tấm kính xanh lục là «bây giờ» của phòng thí nghiệm: nằm ngang, chứa cả A lẫn B.

          Con tàu đi qua điểm giữa đúng lúc hai chớp sáng nổ. Nó lao về phía B nên gặp ánh sáng của B trước ($t = 1{,}875$), của A sau ($t = 7{,}5$). Người trên tàu biết mình đứng giữa hai chỗ nổ, biết ánh sáng hai bên đi cùng tốc độ $c$ (tiên đề 2). Vậy họ kết luận: **B nổ trước A**.

          Tấm kính xanh lam là «bây giờ» của con tàu: mặt phẳng $t' = 0$, tức $ct = (v/c)\,x$. Nó **nghiêng**, cùng góc với trục ct′ nhưng ngả về phía ngược lại, đối xứng qua tia sáng 45°. B nằm dưới tấm (quá khứ của tàu), A nằm trên (tương lai).

          > [Thử ngay] Đổi sang khung con tàu: tấm xanh lam nằm ngang, tấm xanh lục nghiêng. Cho tàu đứng yên: hai tấm trùng nhau. Ở khung phòng thí nghiệm, kéo đốm xanh lam trên trục ct′ và nhìn tấm xanh lam xoay theo. Tiếng chuông vang lên mỗi khi ánh sáng của một chớp tới người đứng giữa hoặc tới con tàu.
          > [[Nhìn từ con tàu|tau]] [[Về phòng thí nghiệm|lab]] [[Cho tàu đứng yên|b0]] [[Tàu 0,6 c|b6]]

          > [Ví dụ] Ở $0{,}6\,c$ ($\gamma = 1{,}25$), theo đồng hồ của tàu: B nổ lúc $t' = -\gamma (v/c)\,x_B/c = -2{,}25$, A nổ lúc $t' = +2{,}25$. Hai chớp sáng cách nhau 4,5 đơn vị thời gian.

          > [Hiểu sai thường gặp] So với Bài 4: đổi khung kiểu Galilei làm các đường thế giới nghiêng nhưng tấm «bây giờ» **vẫn nằm ngang**. Ở đây chính tấm «bây giờ» nghiêng. Đó là {{đồng thời tương đối}}, chỗ khác nhau cốt lõi giữa Newton và Einstein. Với tốc độ nhỏ, tấm chỉ nghiêng chút xíu nên ta không nhận ra.

          +++ Đi sâu: vì sao «bây giờ» của tàu là đường ct = βx
          Người trên tàu đồng bộ đồng hồ bằng ánh sáng (cách của Einstein): từ một điểm trên tàu phát chớp sáng về hai phía, hai đầu tàu cách đều thì phải nhận cùng lúc. Trong phòng thí nghiệm, đầu sau chạy tới đón ánh sáng nên nhận sớm, đầu trước chạy trốn nên nhận muộn.

          Tính cụ thể với $c = 1$: phát lúc $t = 0$ từ gốc, đầu trước và đầu sau ở $x = \pm a$ lúc đầu, chạy với vận tốc $\beta$. Đầu trước nhận lúc $t_1 = a/(1 - \beta)$, đầu sau lúc $t_2 = a/(1 + \beta)$. Hai sự kiện nhận này, theo định nghĩa, là «cùng lúc» với tàu. Nối chúng lại: độ dốc $\dfrac{t_1 - t_2}{x_1 - x_2} = \beta$. Vậy các đường «cùng lúc» của tàu là $ct = \beta x + \text{hằng số}$.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'dongthoi', beta: 0.6, khung: 'lab', mayAnh: 'kinh' }),
        nut: { tau: (c) => c.datKhung('tau'), lab: (c) => c.datKhung('lab'), b0: (c) => c.datBeta(0), b6: (c) => c.datBeta(0.6) },
        thuThach: {
          de: 'Chỉnh vận tốc con tàu để, theo đồng hồ của tàu, chớp B nổ trước chớp A đúng **6** đơn vị thời gian.',
          kiem: (c) => { const s = c.trangThai(); return s.chuDe === 'dongthoi' && datThuThach.dongThoi(s.beta); },
          goiY: R`Theo tàu, hai chớp cách nhau $\Delta t' = 2\gamma\beta L$ với $L = 3$. Cần $\gamma\beta = 1$, tức $v = c/\sqrt 2 \approx 0{,}71\,c$. Ô số liệu ghi $t'$ của hai chớp.`,
        },
      },
      {
        ten: 'Co độ dài: hai cách cắt một dải',
        noiDung: R`
          Trên tàu có một cây thước dài $L_0 = 4$ đơn vị, đo bằng thước của tàu. $L_0$ gọi là **độ dài riêng**. Trong không-thời gian, thước không phải là một đoạn thẳng mà là một **dải**: dải màu xanh lam, giới hạn bởi hai đường thế giới của hai đầu thước.

          «Độ dài của thước» là khoảng cách giữa hai đầu **đo cùng một lúc**. Nhưng «cùng lúc» thì mỗi người một kiểu, nên mỗi người cắt dải theo một cách:

          - Phòng thí nghiệm cắt bằng tấm «bây giờ» nằm ngang của mình: được đoạn **xanh lục**, dài $L_0/\gamma$.
          - Con tàu cắt bằng tấm «bây giờ» nghiêng của tàu: được đoạn **hồng**, dài đúng $L_0$ theo thước của tàu.

          $$ L = \frac{L_0}{\gamma} $$

          Ở $0{,}6\,c$: $L = 4/1{,}25 = 3{,}2$. Ở $0{,}8\,c$: $L = 4/1{,}667 = 2{,}4$. Đó là {{co độ dài}}. Nó chỉ xảy ra theo phương chuyển động; bề ngang (chiều $y$) giữ nguyên.

          > [Thử ngay] Cây thước sơn bốn ô nằm trên «bây giờ» $t = 0$ của khung đang nhìn. Kéo đốm xanh lam trên trục ct′ để đổi tốc độ: thước ngắn lại, cả bốn ô cùng co. Đổi sang khung con tàu: dải thước dựng đứng, đoạn hồng nằm ngang và dài 4 ô, thước dài đủ 4; đoạn xanh lục giờ là một đoạn nghiêng nối hai sự kiện **không cùng lúc** với tàu.
          > [[Nhìn từ con tàu|tau]] [[Về phòng thí nghiệm|lab]] [[Tàu 0,8 c|b8]] [[Tàu 0,6 c|b6]]

          > [Hiểu sai thường gặp] «Thước bị nén lại thật, các nguyên tử bị ép.» Không. Không có lực nào ép thước. Cả hai đoạn là hai lát cắt khác nhau của **cùng một dải** trong không-thời gian, giống như cắt chéo một khúc gỗ thì mặt cắt dài hơn cắt ngang. Co độ dài là hệ quả trực tiếp của đồng thời tương đối.

          +++ Đi sâu: tính L = L₀/γ từ sơ đồ
          Đặt $c = 1$. Hai đầu thước có $x' = 0$ và $x' = L_0$ với mọi $t'$. Dùng phép biến đổi Lorentz $x' = \gamma(x - \beta t)$ cho từng đầu, ở cùng một lúc $t$ của phòng thí nghiệm:

          $$ L_0 = x'_2 - x'_1 = \gamma\big[(x_2 - \beta t) - (x_1 - \beta t)\big] = \gamma\,(x_2 - x_1) = \gamma L $$

          Chữ $t$ triệt tiêu vì hai đầu được đo **cùng lúc** trong phòng thí nghiệm. Vậy $L = L_0/\gamma$. Làm ngược lại (đo một thước đứng yên trong phòng thí nghiệm từ trên tàu) cũng được $L_0/\gamma$: co độ dài cũng đối xứng.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'thuoc', beta: 0.6, khung: 'lab', mayAnh: 'kinh' }),
        nut: { tau: (c) => c.datKhung('tau'), lab: (c) => c.datKhung('lab'), b8: (c) => c.datBeta(0.8), b6: (c) => c.datBeta(0.6) },
        thuThach: {
          de: 'Chỉnh vận tốc con tàu để phòng thí nghiệm đo cây thước chỉ còn đúng **3** ô (độ dài riêng vẫn là 4).',
          kiem: (c) => { const s = c.trangThai(); return s.chuDe === 'thuoc' && datThuThach.thuoc(s.beta); },
          goiY: R`$L = L_0/\gamma$ nên cần $\gamma = 4/3$, tức $v = \tfrac{\sqrt 7}{4}\,c \approx 0{,}66\,c$. Ô số liệu ghi độ dài đo được.`,
        },
      },
      {
        ten: 'Phép biến đổi Lorentz: quay hyperbol',
        noiDung: R`
          Bây giờ gom tất cả vào một hình. Lưới trắng mờ là lưới tọa độ của phòng thí nghiệm, lưới xanh lam là của con tàu. Mỗi ô của tàu là một hình thoi: trục ct′ nghiêng về phía tia sáng, trục x′ nghiêng lên phía tia sáng. Đổi tọa độ từ khung này sang khung kia là {{phép biến đổi Lorentz}}:

          $$ ct' = \gamma\,(ct - \beta x), \qquad x' = \gamma\,(x - \beta\,ct), \qquad y' = y, \qquad \beta = \frac{v}{c} $$

          Đường cong tím mờ là các hyperbol $-c^2t^2 + x^2 = $ −9, −4, −1, 1, 4, 9. Phép biến đổi giữ nguyên **khoảng không-thời gian**:

          $$ s^2 = -c^2t^2 + x^2 + y^2 = -c^2t'^2 + x'^2 + y'^2 $$

          nên mỗi sự kiện chỉ trượt dọc hyperbol của nó. Các vạch đơn vị của mọi khung đều nằm trên các hyperbol này: vạch 1 trên trục ct′ nằm trên hyperbol $s^2 = -1$, cao hơn vạch của phòng thí nghiệm đúng $\gamma$ lần.

          > [Thử ngay] Bấm «Quay qua lại» và nhìn ba sự kiện P, Q, R: tọa độ của chúng đổi liên tục, $s^2$ ghi bên cạnh thì không. Hai tia sáng đứng yên. Hoặc kéo đốm xanh lam ở phần dưới trục ct′: lưới xanh lam khép lại về phía tia sáng như một cây kéo, các vạch 1, 2, 3, 4 trượt dọc hyperbol của chúng. Rê chuột lên P, Q, R để xem tọa độ trong cả hai khung.
          > [[Quay qua lại|lac]] [[Nhìn từ con tàu|tau]] [[Về phòng thí nghiệm|lab]] [[Tàu 0,9 c|b9]]

          ### Quay thường và quay hyperbol

          Bài 3 coi thời gian là một chiều nữa. Quay một mặt phẳng thường giữ nguyên $x^2 + y^2$ và dùng $\cos$, $\sin$ của góc quay. Đổi khung giữ nguyên $-c^2t^2 + x^2$ và dùng $\cosh$, $\sinh$ của **độ nhanh** $\varphi$:

          $$ \beta = \tanh\varphi, \quad \gamma = \cosh\varphi, \quad \gamma\beta = \sinh\varphi $$

          Ví dụ $0{,}6\,c$ ứng với $\varphi = \ln 2 \approx 0{,}693$; $0{,}8\,c$ ứng với $\varphi = \ln 3 \approx 1{,}099$. Dấu trừ trong $s^2$ là thứ làm không-thời gian khác không gian bốn chiều thường.

          +++ Đi sâu: chứng minh s² không đổi
          Đặt $c = 1$. Thay $t' = \gamma(t - \beta x)$ và $x' = \gamma(x - \beta t)$:

          $$ -t'^2 + x'^2 = \gamma^2\big[-(t - \beta x)^2 + (x - \beta t)^2\big] $$

          Khai triển trong ngoặc: $-t^2 + 2\beta t x - \beta^2 x^2 + x^2 - 2\beta x t + \beta^2 t^2 = (1 - \beta^2)(x^2 - t^2)$. Nhân với $\gamma^2 = 1/(1 - \beta^2)$ được đúng $-t^2 + x^2$. Chiều $y$ không đổi nên cộng thêm $y^2$ hai bên vẫn bằng nhau.

          Ngược lại, có thể chứng minh phép đổi tọa độ tuyến tính nào giữ nguyên $s^2$ (và giữ chiều thời gian) thì đều là một phép Lorentz, có thể kèm phép quay không gian. Hai tiên đề của Einstein tương đương với đòi hỏi này.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'lorentz', beta: 0.6, khung: 'lab', mayAnh: 'chinh' }),
        nut: { lac: (c) => c.lac(true), tau: (c) => c.datKhung('tau'), lab: (c) => c.datKhung('lab'), b9: (c) => c.datBeta(0.9) },
        ra: (c) => c.lac(false),
      },
      {
        ten: 'Cộng vận tốc: không vượt được c',
        noiDung: R`
          Con tàu (xanh lam) bay $u = 0{,}8\,c$ so với phòng thí nghiệm. Lúc đi qua gốc, nó bắn về phía trước một vật (hồng) với tốc độ $v = 0{,}8\,c$ **so với tàu**. Theo Newton, vật đi $1{,}6\,c$: đường đỏ đứt nét, nghiêng quá 45°, nằm ngoài nón ánh sáng. Điều đó không xảy ra. Công thức đúng:

          $$ w = \frac{u + v}{1 + uv/c^2} = \frac{0{,}8 + 0{,}8}{1 + 0{,}64}\,c \approx 0{,}976\,c $$

          Nhãn ở đầu mỗi đường ghi tốc độ đo **trong khung đang nhìn**, đọc thẳng từ độ nghiêng của đường trên hình.

          > [Thử ngay] Kéo đốm hồng trên đường của vật để đổi tốc độ bắn: đẩy hết cỡ cũng chỉ chạm tới đường vàng của ánh sáng. Đổi sang khung con tàu: tàu đứng yên, vật bay đúng tốc độ bắn, phòng thí nghiệm lùi lại $0{,}8\,c$. Rồi cho tàu bắn ra ánh sáng: ở khung nào nhãn cũng ghi 1 c.
          > [[Nhìn từ con tàu|tau]] [[Về phòng thí nghiệm|lab]] [[Bắn ra ánh sáng|as]] [[Vật bắn 0,8 c|v8]]

          - Khi $u$, $v$ nhỏ, mẫu số gần bằng 1 và công thức trở về $u + v$ của Newton.
          - Nếu $v = c$: $w = (u + c)/(1 + u/c) = c$. Ánh sáng cộng gì vẫn là $c$, đúng tiên đề 2.
          - Hai tốc độ nhỏ hơn $c$ cộng lại luôn nhỏ hơn $c$.

          +++ Đi sâu: cộng vận tốc là cộng độ nhanh
          Hai phép biến đổi Lorentz cùng phương nối nhau (từ phòng thí nghiệm sang tàu, rồi từ tàu sang vật) là một phép biến đổi Lorentz. Trong ngôn ngữ «quay hyperbol», hai góc quay cộng lại: $\varphi_w = \varphi_u + \varphi_v$.

          Dùng công thức cộng của tanh: $\tanh(\varphi_u + \varphi_v) = \dfrac{\tanh\varphi_u + \tanh\varphi_v}{1 + \tanh\varphi_u \tanh\varphi_v}$. Thay $\tanh\varphi = v/c$ được đúng công thức trên.

          Ví dụ: $0{,}8\,c$ có $\varphi = \ln 3$. Hai lần $\ln 3$ là $\ln 9$, và $\tanh(\ln 9) = (81 - 1)/(81 + 1) = 80/82 \approx 0{,}976$. Độ nhanh cộng được bao nhiêu cũng được, nhưng $\tanh$ không bao giờ tới 1.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'cong', beta: 0.8, vVat: 0.8, khung: 'lab', mayAnh: 'chinh' }),
        nut: { tau: (c) => c.datKhung('tau'), lab: (c) => c.datKhung('lab'), as: (c) => c.datVVat(1), v8: (c) => c.datVVat(0.8) },
        thuThach: {
          de: 'Tàu bay $0{,}8\\,c$. Kéo đốm hồng để vật đi đúng **0,9 c** so với phòng thí nghiệm. Theo Newton chỉ cần bắn $0{,}1\\,c$; thật ra phải bắn bao nhiêu?',
          kiem: (c) => { const s = c.trangThai(); return s.chuDe === 'cong' && datThuThach.cong(s.beta, s.vVat); },
          goiY: R`Giải $0{,}9 = \dfrac{0{,}8 + v}{1 + 0{,}8\,v}$ được $v = 0{,}1/0{,}28 \approx 0{,}36\,c$. Ô số liệu ghi phép cộng.`,
        },
      },
      {
        ten: 'Thời gian riêng và anh em sinh đôi',
        noiDung: R`
          Hai anh em sinh đôi. Người ở nhà (đường trắng thẳng đứng). Người đi (đường hồng) bay tới Alpha Centauri cách $L = 4{,}37$ năm ánh sáng với tốc độ $0{,}8\,c$ rồi quay về. Mỗi chấm là một năm sinh nhật của người đó, đếm bằng đồng hồ mang theo người: đó là {{thời gian riêng}}.

          - Người ở nhà chờ $T = 2L/v = 2 \times 4{,}37/0{,}8 \approx 10{,}9$ năm.
          - Người đi già thêm $T/\gamma = 10{,}9/1{,}667 \approx 6{,}6$ năm.

          Thời gian riêng là «độ dài» của đường thế giới, đo bằng $\Delta\tau = \sqrt{\Delta t^2 - \Delta x^2/c^2}$. Đường gấp khúc của người đi có thời gian riêng **ngắn hơn** đường thẳng của người ở nhà, dù trên hình nó trông dài hơn. Trong hình học thường, đường thẳng là đường **ngắn nhất** giữa hai điểm. Trong không-thời gian, đường thế giới thẳng (không tăng tốc) là đường có thời gian riêng **dài nhất**.

          > [Thử ngay] Kéo đốm hồng ở điểm quay đầu sang hai bên để đổi tốc độ bay. Nghe: mỗi sinh nhật của người ở nhà là một tiếng trầm bên trái, của người đi là một tiếng cao bên phải; tiếng bên phải thưa hơn. Rồi chọn khung của chặng đi và khung của chặng về. Ở mỗi khung, đồng hồ của người kia chạy chậm hơn. Nhưng không khung quán tính nào chứa trọn chuyến đi của người đi: muốn quay về, người đi phải đổi khung.
          > [[Khung chặng đi|di]] [[Khung chặng về|ve]] [[Khung ở nhà|nha]] [[Bay 0,99 c|b99]] [[Alpha Centauri 0,8 c|alpha]]

          Đó là lời giải của {{nghịch lý anh em sinh đôi}}. Hai người **không đối xứng**: người đi phải tăng tốc lúc quay đầu, người ở nhà thì không. Hai đường nét đứt là «bây giờ» của người đi ngay trước và ngay sau khi quay đầu. Chúng cắt đường của người ở nhà ở hai chỗ cách nhau gần 7 năm: phần đời người ở nhà mà người đi «bỏ qua» khi đổi khung.

          +++ Đi sâu: thời gian riêng của từng chặng
          Đặt $c = 1$, đơn vị năm. Chặng đi kéo dài $\Delta t = L/\beta = 5{,}4625$ năm và $\Delta x = 4{,}37$:

          $$ \Delta\tau = \sqrt{5{,}4625^2 - 4{,}37^2} = 5{,}4625\sqrt{1 - 0{,}64} = 5{,}4625 \times 0{,}6 \approx 3{,}28 \text{ năm} $$

          Chặng về y hệt, tổng $6{,}55$ năm. Người ở nhà: $\Delta x = 0$ nên $\Delta\tau = \Delta t = 10{,}925$ năm.

          Ngay trước khi quay đầu, «bây giờ» của người đi là đường $t = \beta x + \text{hằng số}$; nó cắt đường của người ở nhà lúc $L/\beta - \beta L \approx 1{,}97$ năm. Ngay sau khi quay đầu, đường đó lật thành $t = -\beta x + \text{hằng số}$, cắt lúc $L/\beta + \beta L \approx 8{,}96$ năm. Bước nhảy $2\beta L \approx 6{,}99$ năm chính là phần chênh lệch: người đi thấy người ở nhà già chậm trong cả hai chặng, cộng thêm cú nhảy lúc quay đầu.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'sinhdoi', L: 4.37, betaSD: 0.8, khungSD: 'nha', mayAnh: 'chinh' }),
        nut: {
          di: (c) => c.datKhungSD('di'), ve: (c) => c.datKhungSD('ve'), nha: (c) => c.datKhungSD('nha'),
          b99: (c) => c.cauHinh({ betaSD: 0.99 }), alpha: (c) => c.cauHinh({ L: 4.37, betaSD: 0.8 }),
        },
        thuThach: {
          de: 'Kéo điểm quay đầu để khi gặp lại, người đi trẻ hơn người ở nhà đúng **5 năm**.',
          kiem: (c) => { const s = c.trangThai(); return s.chuDe === 'sinhdoi' && datThuThach.sinhDoi(s.L, s.betaSD); },
          goiY: 'Bay càng nhanh thì chênh càng nhiều. Với đích cách 4,37 năm ánh sáng, cần khoảng 0,86 c. Ô số liệu ghi «chênh … năm».',
        },
      },
      {
        ten: 'Bằng chứng: muon, GPS, máy gia tốc',
        noiDung: R`
          Trên hình, trục ngang là **độ cao** (mỗi ô 2 km), trục đứng là $ct$. Một muon sinh ra ở tầng cao khí quyển, lao xuống với tốc độ $0{,}998\,c$. Muon tự phân rã: thời gian sống trung bình khi đứng yên là $\tau_0 = 2{,}197$ micro giây. Trong thời gian đó ánh sáng chỉ đi được $c\tau_0 = 659$ m. Theo Newton, đa số muon phải phân rã sau chừng 659 m (dấu ✗ đỏ).

          Nhưng ở $0{,}998\,c$ thì $\gamma = 15{,}8$. Nhìn từ mặt đất, đồng hồ của muon chạy chậm 15,8 lần, nên trung bình nó đi được $\gamma\beta c\tau_0 \approx 10{,}4$ km. Rossi và Hall (1941) đo số muon ở hai độ cao khác nhau và thấy đúng như thế.

          > [Thử ngay] Đổi sang khung của muon: nó đứng yên, sống đúng 2,2 micro giây của nó. Lớp không khí dày 10,4 km giờ chỉ dày 657 m vì co độ dài, và mặt đất lao lên đón nó. Hai khung, hai cách kể, cùng một sự kiện: muon tới mặt đất.
          > [[Nhìn từ muon|muon]] [[Nhìn từ mặt đất|dat]]

          > [Lưu ý] Trong hình, muon sinh ở độ cao 10,4 km cho dễ đọc: đúng quãng đường trung bình, nên nó tới mặt đất lúc đồng hồ của nó chỉ đúng $\tau_0$.

          ### Những phép đo khác

          - **Muon trong vòng trữ ở CERN** (Bailey và cộng sự, 1977): $\gamma = 29{,}3$, sống trung bình $29{,}3 \times 2{,}197 \approx 64{,}4$ micro giây, khớp tiên đoán tới khoảng một phần nghìn.
          - **GPS**: vệ tinh bay $3{,}87$ km/s, đồng hồ trên đó chậm $v^2/(2c^2) \times 86\,400$ s $\approx 7{,}2$ micro giây mỗi ngày do tốc độ. (Trọng lực gây hiệu ứng ngược chiều và lớn hơn: Bài 9.)
          - **LHC**: proton có năng lượng 6,5 TeV, khối lượng nghỉ 0,938 GeV, nên $\gamma = E/mc^2 \approx 6\,928$; tốc độ chỉ kém $c$ khoảng một phần trăm triệu.

          +++ Đi sâu: vận tốc bốn chiều và E = mc²
          Dọc đường thế giới, lấy đạo hàm tọa độ theo thời gian riêng được {{vận tốc bốn chiều}} $u = (\dd(ct)/\dd\tau,\ \dd x/\dd\tau) = \gamma\,(c,\ v)$. «Độ dài» của nó luôn như nhau: $-u_t^2 + u_x^2 = \gamma^2(-c^2 + v^2) = -c^2$. Mọi vật luôn đi trong không-thời gian với «tốc độ» $c$; chạy nhanh trong không gian thì phải đi chậm theo thời gian riêng.

          Nhân với khối lượng $m$ được {{xung lượng bốn chiều}} $p = m u = (\gamma m c,\ \gamma m v)$. Thành phần thời gian nhân $c$ là năng lượng: $E = \gamma m c^2$. Khi vật đứng yên, $\gamma = 1$ và $E = mc^2$: khối lượng là năng lượng của vật lúc đứng yên. Với LHC: $\gamma = 6\,500\ \text{GeV}/0{,}938\ \text{GeV}$.
          +++`,
        vao: (c) => c.cauHinh({ chuDe: 'muon', khungMuon: 'dat', mayAnh: 'chinh' }),
        nut: { muon: (c) => c.datKhungMuon('muon'), dat: (c) => c.datKhungMuon('dat') },
      },
    ],
    congThuc: [
      { ten: 'Hệ số Lorentz', tex: R`\gamma = \frac{1}{\sqrt{1 - v^2/c^2}}`, y: 'Bằng 1 khi đứng yên; 1,25 ở 0,6 c; 5/3 ở 0,8 c; tăng vô hạn khi v tới c.' },
      { ten: 'Phép biến đổi Lorentz', tex: R`ct' = \gamma\,(ct - \beta x),\quad x' = \gamma\,(x - \beta\,ct),\quad \beta = v/c`, y: 'Đổi tọa độ của cùng một sự kiện sang khung bay với vận tốc v theo phương x. Chiều y, z giữ nguyên.' },
      { ten: 'Giãn thời gian, co độ dài', tex: R`\Delta t = \gamma\,\Delta\tau, \qquad L = \frac{L_0}{\gamma}`, y: '$\\Delta\\tau$: thời gian riêng của đồng hồ chuyển động. $L_0$: độ dài riêng, đo khi thước đứng yên.' },
      { ten: 'Khoảng không-thời gian', tex: R`s^2 = -c^2\Delta t^2 + \Delta x^2 + \Delta y^2 + \Delta z^2`, y: 'Như nhau trong mọi khung quán tính. Với đường thế giới, $\\Delta\\tau = \\sqrt{-s^2}/c$ là thời gian riêng.' },
      { ten: 'Cộng vận tốc', tex: R`w = \frac{u + v}{1 + uv/c^2}`, y: 'Hai tốc độ nhỏ hơn c cộng lại vẫn nhỏ hơn c. Tương đương với cộng độ nhanh: $\\varphi_w = \\varphi_u + \\varphi_v$.' },
      { ten: 'Năng lượng', tex: R`E = \gamma m c^2,\qquad E_{\text{nghỉ}} = mc^2`, y: 'Thành phần thời gian của xung lượng bốn chiều.' },
    ],
    cauHoi: [
      {
        hoi: 'Một con tàu bay 0,8 c đi ngang qua Trái Đất. Trên tàu, một đồng hồ chỉ 3 giờ trôi qua. Đo từ Trái Đất, khoảng thời gian đó dài bao nhiêu?',
        chon: ['1,8 giờ', '2,4 giờ', '3 giờ', '5 giờ'],
        dung: 3,
        giai: 'γ(0,8) = 5/3, nên Δt = γΔτ = 5/3 × 3 = 5 giờ. Đáp án 1,8 giờ là nhân với 0,6 thay vì chia: nhầm chiều. Đồng hồ chuyển động chạy chậm, nên người đứng yên đo được khoảng thời gian **dài hơn**.',
      },
      {
        hoi: R`Hai sự kiện xảy ra cùng lúc ở hai nơi khác nhau theo phòng thí nghiệm. Một con tàu bay theo hướng từ sự kiện A tới sự kiện B. Theo con tàu thì sao?`,
        chon: ['Vẫn cùng lúc', 'B xảy ra trước A', 'A xảy ra trước B', 'Tuỳ người trên tàu ngồi ở đâu'],
        dung: 1,
        giai: R`Tấm «bây giờ» của tàu nghiêng lên theo hướng chuyển động ($ct = \beta x$). B nằm phía trước nên ở dưới tấm đó: thuộc quá khứ của tàu. Vậy B xảy ra trước. Kết quả không phụ thuộc chỗ ngồi: đó là chuyện tọa độ của khung, không phải chuyện ánh sáng tới mắt sớm hay muộn.`,
      },
      {
        hoi: 'Một cây thước dài riêng 10 m bay qua với tốc độ 0,6 c, dọc theo chiều dài của nó. Người đứng yên đo được thước dài bao nhiêu?',
        chon: ['6 m', '8 m', '10 m', '12,5 m'],
        dung: 1,
        giai: 'L = L₀/γ = 10/1,25 = 8 m. Đáp án 12,5 m là nhân với γ thay vì chia. Đáp án 6 m là nhân với 0,6 (lấy β thay cho 1/γ).',
      },
      {
        hoi: 'Từ một tàu bay 0,6 c, người ta bắn về phía trước một vật với tốc độ 0,6 c so với tàu. Vật đi nhanh bao nhiêu so với mặt đất?',
        chon: ['1,2 c', 'đúng c', '≈ 0,88 c', '0,6 c'],
        dung: 2,
        giai: 'w = (0,6 + 0,6)/(1 + 0,36) = 1,2/1,36 ≈ 0,882 c. Cộng kiểu Newton cho 1,2 c, vượt ánh sáng, nên chắc chắn sai.',
      },
      {
        hoi: 'Trong nghịch lý anh em sinh đôi, vì sao không thể lập luận ngược lại rằng «với người đi thì người ở nhà mới là người chuyển động, nên người ở nhà phải trẻ hơn»?',
        dap: 'Vì hai người không đối xứng. Người ở nhà ở mãi trong một khung quán tính; đường thế giới của họ thẳng. Người đi phải tăng tốc để quay đầu, nên đường thế giới gấp khúc và họ phải đổi từ khung quán tính của chặng đi sang khung của chặng về. Trong mỗi chặng, người đi thấy đồng hồ ở nhà chạy chậm thật; nhưng lúc đổi khung, «bây giờ» của họ quét qua một khoảng lớn trên đường của người ở nhà (gần 7 năm ở ví dụ Alpha Centauri). Tính đủ thì người đi trẻ hơn. Trong không-thời gian, đường thẳng có thời gian riêng dài nhất.',
      },
      {
        hoi: 'Muon đứng yên sống trung bình 2,2 micro giây. Một muon bay 0,998 c (γ ≈ 15,8). Nhìn từ khung của chính muon, vì sao nó vẫn xuyên được hơn 10 km khí quyển?',
        dap: 'Trong khung của muon, đồng hồ của nó chạy bình thường: nó chỉ sống khoảng 2,2 micro giây. Nhưng khí quyển lao về phía nó với tốc độ 0,998 c, nên lớp không khí dày 10,4 km (đo từ mặt đất) bị co lại γ lần, chỉ còn khoảng 657 m. Mặt đất tới được trong 2,2 micro giây. Người trên mặt đất giải thích bằng giãn thời gian, muon giải thích bằng co độ dài; hai cách kể cho cùng một sự kiện.',
      },
    ],
    docThem: [
      'E. F. Taylor và J. A. Wheeler, *Spacetime Physics* (bản 2, 1992), chương 3 nguyên lý tương đối, chương 4 chuyến đi tới Canopus (nghịch lý anh em sinh đôi), chương 5 thời gian riêng.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 4 và 5: phép biến đổi Lorentz, vận tốc và xung lượng bốn chiều.',
      'R. P. Feynman, *The Feynman Lectures on Physics*, tập I, chương 15 «The Special Theory of Relativity» và chương 16.',
      'A. Einstein, *Relativity: The Special and the General Theory* (1916), phần I: đoàn tàu, sân ga và tính tương đối của đồng thời.',
    ],
    thuatNgu: [
      { vi: 'tiên đề', en: 'postulate', nghia: 'Mệnh đề được chấp nhận làm điểm xuất phát. Thuyết tương đối hẹp dựa trên hai tiên đề: định luật vật lý như nhau trong mọi khung quán tính, và tốc độ ánh sáng như nhau với mọi người quan sát.' },
      { vi: 'đồng hồ ánh sáng', en: 'light clock', nghia: 'Đồng hồ tưởng tượng gồm hai gương song song và một tia sáng nảy qua lại; mỗi lần nảy về là một tích. Dùng để suy ra giãn thời gian chỉ bằng định lý Pythagoras.' },
      { vi: 'độ nhanh', en: 'rapidity', nghia: R`Góc «quay hyperbol» $\varphi$ ứng với vận tốc: $v/c = \tanh\varphi$. Độ nhanh của các phép đổi khung cùng phương cộng thẳng với nhau.` },
      { vi: 'nghịch lý anh em sinh đôi', en: 'twin paradox', nghia: 'Một người bay đi rồi quay về thì trẻ hơn người ở nhà. Không phải mâu thuẫn: người đi phải đổi khung quán tính, người ở nhà thì không.' },
      { vi: 'xung lượng bốn chiều', en: 'four-momentum', nghia: R`$p = m u = (\gamma m c,\ \gamma m \vec v)$. Thành phần thời gian nhân $c$ là năng lượng $E = \gamma m c^2$; khi đứng yên còn $E = mc^2$.` },
    ],
  },

  conSo: [
    '**γ = 1,25** ở 0,6 c; **γ = 5/3** ở 0,8 c; **γ ≈ 7,09** ở 0,99 c.',
    '**0,976 c**: tốc độ của vật bắn 0,8 c từ một tàu đang bay 0,8 c.',
    '**10,9 năm và 6,6 năm**: hai anh em sau chuyến đi Alpha Centauri ở 0,8 c.',
    '**10,4 km**: quãng đường trung bình của muon 0,998 c, thay vì 659 m.',
    '**7,2 micro giây mỗi ngày**: đồng hồ GPS chậm đi do tốc độ bay.',
  ],
  hieuDung: '**Giãn thời gian không phải đồng hồ bị hỏng.** Mọi quá trình trên tàu (đồng hồ, tim đập, phân rã hạt) đều chạy bình thường với người trên tàu. Cái khác là hai khung cắt không-thời gian thành các lát «bây giờ» khác nhau, nên đo khoảng thời gian giữa hai sự kiện ra khác nhau. Thứ mọi khung đều đồng ý là khoảng s² và thời gian riêng dọc mỗi đường thế giới.',
  nguon: 'Thời gian sống của muon 2,1969811 µs và khối lượng proton 0,93827208816 GeV: PDG và CODATA 2018. Muon trong khí quyển: Rossi và Hall 1941, Phys. Rev. 59, 223. Muon trong vòng trữ CERN: Bailey và cộng sự 1977, Nature 268, 301. Năng lượng chùm LHC 6,5 TeV: đợt chạy 2015–2018 của CERN. Tốc độ vệ tinh GPS 3,874 km/s: quỹ đạo bán kính 26 560 km. Alpha Centauri cách 4,37 năm ánh sáng. Mọi con số trong bài được tính lại trong kiem-tra/kiem-lorentz.mjs.',

  css: '.nhan.phai { margin-left: -9px; text-align: right; } .nhan.tim { color: #c8aaff; } .nhan.luc { color: #8fe3a8; }',

  tao(app) {
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 1500, hat: 61, doSang: 0.45 }));
    const den = taoDenCanh(scene, { renderer: app.renderer, huongChinh: [8, 8, 6], huongVien: [-6, 3, -8], cuongDo: 1.35 });
    const am = app.am, tt = app.tt;
    const goc = new THREE.Group();
    scene.add(goc);
    const luoiMK = taoLuoiMinkowski();
    goc.add(luoiMK);
    const LU = { lab: 0, tau: 0, buoc: 1, gx: 0, gt: 0 };   // lưới cần vẽ ở chủ đề đang mở (đặt trong veLai)

    const S = {
      chuDe: 'tiende', beta: 0.6, khung: 'lab', vVat: 0.8,
      L: 4.37, betaSD: 0.8, khungSD: 'nha', khungMuon: 'dat',
      phi: 0, phiDich: 0, lac: false, tLac: 0,
      tau: 0, ban: true,
    };

    // ----- Nét vẽ (dùng chung cho mọi chủ đề) -----
    const net = {
      luoiLab: new NetDoan(80, { mau: 0xffffff, rong: 1, doMo: 0.13, cong: false }),
      luoiTau: new NetDoan(80, { mau: MAU_KTG.thoiGian, rong: 1, doMo: 0.32 }),
      trucLab: new NetDoan(12, { mau: 0xffffff, rong: 1.8, doMo: 0.6, cong: false }),
      trucTau: new NetDoan(12, { mau: MAU_KTG.thoiGian, rong: 2.6, doMo: 0.95, quang: 0.1, sang: 1.6 }),
      sang: new NetDoan(400, { mau: MAU_KTG.anhSang, rong: 2.4, doMo: 0.95, quang: 0.12, sang: 1.8 }),
      sangMo: new NetDoan(40, { mau: MAU_KTG.anhSang, rong: 1.2, doMo: 0.35 }),
      trang: new NetDoan(60, { mau: 0xffffff, rong: 2.6, doMo: 0.9, quang: 0.07, cong: false }),
      trangMo: new NetDoan(60, { mau: 0xffffff, rong: 1, doMo: 0.35, cong: false }),
      xanh: new NetDoan(400, { mau: MAU_KTG.thoiGian, rong: 1.6, doMo: 0.85 }),
      xanhDam: new NetDoan(40, { mau: MAU_KTG.thoiGian, rong: 3, doMo: 1, quang: 0.1, sang: 1.5 }),
      luc: new NetDoan(400, { mau: MAU_KTG.hienTai, rong: 1.6, doMo: 0.85 }),
      lucDam: new NetDoan(20, { mau: MAU_KTG.hienTai, rong: 4.5, doMo: 1, quang: 0.12, sang: 1.6 }),
      hong: new NetDoan(40, { mau: MAU_KTG.hong, rong: 3, doMo: 1, quang: 0.1, sang: 1.6 }),
      hongNet: new NetDoan(20, { mau: MAU_KTG.hong, rong: 1.6, doMo: 0.85, net: [0.18, 0.12] }),
      timNet: new NetDoan(20, { mau: MAU_KTG.tim, rong: 1.6, doMo: 0.9, net: [0.18, 0.12] }),
      doNet: new NetDoan(20, { mau: MAU_KTG.do, rong: 2, doMo: 0.9, net: [0.22, 0.14] }),
      hyper: new NetDoan(900, { mau: MAU_KTG.tim, rong: 1.1, doMo: 0.38 }),
      hyperSK: new NetDoan(400, { mau: 0xffffff, rong: 1.5, doMo: 0.5 }),
    };
    for (const k in net) goc.add(net[k].line);
    // Màu riêng cho hyperbol của từng sự kiện mẫu: dùng ba nét nhỏ.
    const hyperSK = SK_MAU.map((e) => { const n = new NetDoan(260, { mau: e.mau, rong: 1.6, doMo: 0.55 }); goc.add(n.line); return n; });

    const mat = {
      luc: new MatDong(8, MAU_KTG.hienTai, 0.09),
      xanh: new MatDong(8, MAU_KTG.thoiGian, 0.1),
      nay: new MatDong(4, MAU_KTG.hienTai, 0.06),
      dai: new MatDong(40, MAU_KTG.thoiGian, 0.12),
      daiTrang: new MatDong(40, 0xffffff, 0.06),
      khi: new MatDong(12, 0x6f8cff, 0.1),
    };
    for (const k in mat) goc.add(mat[k].mesh);

    const non = nonAnhSang({ cao: 6, duoi: false, doMo: 0.07, soDuong: 16 });
    goc.add(non);

    const dom = {
      trang: new BoDom(goc, 0xffffff, 0.3, 40),
      xanh: new BoDom(goc, MAU_KTG.thoiGian, 0.3, 40),
      hong: new BoDom(goc, MAU_KTG.hong, 0.34, 40),
      vang: new BoDom(goc, MAU_KTG.anhSang, 0.75, 12),
      to: new BoDom(goc, 0xffffff, 0.6, 12),
      do: new BoDom(goc, MAU_KTG.do, 0.5, 4),
    };
    for (const [i, e] of SK_MAU.entries()) e.dom = (() => { const d = suKien(e.mau, 0.5); goc.add(d); return d; })(), e.i = i;
    const nhan = new BoNhan(goc, 44);
    // Đốm và nhãn chạy theo «bây giờ» của khung nhìn (cập nhật mỗi khung hình).
    const chay = Array.from({ length: 6 }, () => ({ duong: new DuongChay(160), dom: taoDom(0xffffff, 0.55), nhan: taoNhan('', 'dam'), mau: 0xffffff, ten: '', dung: false }));
    for (const c of chay) { goc.add(c.dom, c.nhan); }
    const vongNay = new DuongDay(97, { mau: MAU_KTG.anhSang, rong: 2.4, quang: 0.14 });
    goc.add(vongNay.line);

    // ----- Hyperbol bất biến: vẽ một lần (tập hợp không đổi khi đổi khung) -----
    function themHyper(n, k2, dau, doc) {
      // dau: nhánh ±; doc = true: nhánh kiểu thời gian t = ±√(k² + x²), false: kiểu không gian x = ±√(k² + t²)
      const N = 90;
      let px = 0, pt = 0;
      for (let i = 0; i <= N; i++) {
        const s = -7.5 + (15 * i) / N;
        const x = doc ? s : dau * Math.sqrt(k2 + s * s);
        const t = doc ? dau * Math.sqrt(k2 + s * s) : s;
        if (i > 0) doanHien(n, px, pt, 0, x, t, 0);
        px = x; pt = t;
      }
    }
    net.hyper.bat();
    for (const k of [1, 2, 3]) for (const d of [1, -1]) { themHyper(net.hyper, k * k, d, true); themHyper(net.hyper, k * k, d, false); }
    net.hyper.xong();
    for (const e of SK_MAU) {
      const s2 = -e.t * e.t + e.x * e.x;
      const n = hyperSK[e.i];
      n.bat();
      if (s2 < 0) themHyper(n, -s2, Math.sign(e.t), true); else themHyper(n, s2, Math.sign(e.x), false);
      n.xong();
      e.s2 = s2;
    }

    // ----- Điều khiển -----
    const bang = app.bang;
    const dkChuDe = bang.chon({ nhan: chuCanh("canh.chu-de", "Chủ đề"), luaChon: CHU_DE, giaTri: S.chuDe, khiDoi: (v) => cauHinh({ chuDe: v }) });
    const dkBeta = bang.thanhTruot({
      nhan: chuCanh("canh.van-toc-con-tau", "Vận tốc con tàu"), min: 0, max: 0.95, buoc: 0.01, giaTri: S.beta,
      hienThi: (v) => `${so(v, 2)} c · γ = ${so(gamma(v), 3)}`,
      khiDoi: (v) => datBeta(v),
    });
    const dkVVat = bang.thanhTruot({
      nhan: chuCanh("canh.vat-ban-ra-so-voi-tau", "Vật bắn ra (so với tàu)"), min: 0, max: 1, buoc: 0.01, giaTri: S.vVat,
      hienThi: (v) => (v >= 1 ? chuCanh("canh.anh-sang-1-c", "ánh sáng: 1 c") : `${so(v, 2)} c`),
      khiDoi: (v) => { S.vVat = v; S.ban = true; },
    });
    const dkKhung = bang.chon({
      nhan: chuCanh("canh.khung-nhin", "Khung nhìn"),
      luaChon: [{ giaTri: 'lab', nhan: chuCanh("canh.phong-thi-nghiem", "Phòng thí nghiệm") }, { giaTri: 'tau', nhan: chuCanh("canh.con-tau", "Con tàu") }],
      giaTri: S.khung, khiDoi: (v) => datKhung(v),
    });
    const dkBetaSD = bang.thanhTruot({
      nhan: chuCanh("canh.toc-do-nguoi-di", "Tốc độ người đi"), min: 0.1, max: 0.99, buoc: 0.01, giaTri: S.betaSD,
      hienThi: (v) => `${so(v, 2)} c · γ = ${so(gamma(v), 3)}`,
      khiDoi: (v) => { S.betaSD = v; capNhatKhungSD(); S.ban = true; },
    });
    const dkL = bang.thanhTruot({
      nhan: chuCanh("canh.khoang-cach-toi-dich", "Khoảng cách tới đích"), min: 1, max: 10, buoc: 0.01, giaTri: S.L,
      hienThi: (v) => chuCanh("canh.nam-anh-sang", "{0} năm ánh sáng", [so(v, 2)]),
      khiDoi: (v) => { S.L = v; capNhatKhungSD(); S.ban = true; },
    });
    const dkKhungSD = bang.chon({
      nhan: chuCanh("canh.khung-nhin", "Khung nhìn"),
      luaChon: [{ giaTri: 'nha', nhan: chuCanh("canh.nguoi-o-nha", "Người ở nhà") }, { giaTri: 'di', nhan: chuCanh("canh.chang-di", "Chặng đi") }, { giaTri: 've', nhan: chuCanh("canh.chang-ve", "Chặng về") }],
      giaTri: S.khungSD, khiDoi: (v) => datKhungSD(v),
    });
    const dkKhungMuon = bang.chon({
      nhan: chuCanh("canh.khung-nhin", "Khung nhìn"),
      luaChon: [{ giaTri: 'dat', nhan: chuCanh("canh.mat-dat", "Mặt đất") }, { giaTri: 'muon', nhan: chuCanh("canh.muon", "Muon") }],
      giaTri: S.khungMuon, khiDoi: (v) => datKhungMuon(v),
    });
    const ghiChu = bang.chuThich('');

    // Đích của khung nhìn (theo độ nhanh φ).
    function phiDich() {
      if (S.chuDe === 'sinhdoi') return S.khungSD === 'di' ? Math.atanh(S.betaSD) : S.khungSD === 've' ? -Math.atanh(S.betaSD) : 0;
      if (S.chuDe === 'muon') return S.khungMuon === 'muon' ? -Math.atanh(B_MUON) : 0;
      return S.khung === 'tau' ? Math.atanh(S.beta) : 0;
    }
    function datBeta(v) { S.lac = false; S.beta = v; dkBeta.dat(v); S.phiDich = phiDich(); S.ban = true; }
    function datKhung(v) { S.lac = false; S.khung = v; dkKhung.dat(v); S.phiDich = phiDich(); }
    function datKhungSD(v) { S.khungSD = v; dkKhungSD.dat(v); S.phiDich = phiDich(); }
    function capNhatKhungSD() { S.phiDich = phiDich(); }
    function datKhungMuon(v) { S.khungMuon = v; dkKhungMuon.dat(v); S.phiDich = phiDich(); }

    const GOC = {
      chinh: [[6, 5, 23.5], [0, 0, 0]],
      kinh: [[4.5, 10.5, 21], [0, -0.3, 0]],
      nghieng: [[16.5, 7, 13], [0.6, 0.6, 0.5]],
      thang: [[0.01, 0, 24], [0, 0, 0]],
    };
    const bay = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    const GHI_CHU = {
      tiende: chuCanh("canh.non-vang-anh-sang-cua-chop-sang-o", "Nón vàng: ánh sáng của chớp sáng ở gốc. Vòng xanh lục: mặt sóng «cùng lúc» theo phòng thí nghiệm. Vòng xanh lam: theo con tàu. Vòng vàng sáng: mặt sóng «lúc này» của khung đang nhìn."),
      dongho: chuCanh("canh.dai-trang-hai-guong-cua-dong-ho-dung", "Dải trắng: hai gương của đồng hồ đứng yên. Dải xanh lam: đồng hồ trên tàu. Đường vàng gấp khúc: tia sáng nảy giữa hai gương (theo chiều sâu y). Chấm: mỗi tích."),
      dongthoi: chuCanh("canh.tam-xanh-luc-bay-gio-cua-phong-thi", "Tấm xanh lục: «bây giờ» của phòng thí nghiệm. Tấm xanh lam: «bây giờ» của con tàu. Đường vàng: ánh sáng của hai chớp A, B."),
      thuoc: chuCanh("canh.dai-xanh-lam-dai-the-gioi-cua-thuoc", "Dải xanh lam: dải thế giới của thước trên tàu. Đoạn xanh lục: thước đo cùng lúc theo phòng thí nghiệm. Đoạn hồng: đo cùng lúc theo tàu."),
      lorentz: chuCanh("canh.luoi-trang-phong-thi-nghiem-luoi-xanh-lam", "Lưới trắng: phòng thí nghiệm. Lưới xanh lam: con tàu. Đường tím: hyperbol −t² + x² = ±1, ±4, ±9. Chấm màu: sự kiện mẫu và hyperbol riêng của nó."),
      cong: chuCanh("canh.nhan-o-dau-moi-duong-la-toc-do", "Nhãn ở đầu mỗi đường là tốc độ đo trong khung đang nhìn. Đường đỏ đứt: cộng kiểu Newton (chỉ hiện khi nhìn từ phòng thí nghiệm)."),
      sinhdoi: chuCanh("canh.cham-tren-moi-duong-sinh-nhat-theo-dong", "Chấm trên mỗi đường: sinh nhật theo đồng hồ của người đó. Hai đường đứt: «bây giờ» của người đi ngay trước và ngay sau khi quay đầu."),
      muon: chuCanh("canh.truc-ngang-do-cao-moi-o-2-km", "Trục ngang: độ cao (mỗi ô 2 km). Trục đứng: ct (mỗi ô 2 km, tức 6,67 micro giây). Chấm hồng trên đường của muon: mỗi 0,5 micro giây theo đồng hồ của nó."),
    };

    function capNhatGiaoDien() {
      const cd = S.chuDe;
      const thuong = cd !== 'sinhdoi' && cd !== 'muon';
      dkBeta.el.hidden = !thuong;
      dkKhung.el.hidden = !thuong;
      dkVVat.el.hidden = cd !== 'cong';
      dkBetaSD.el.hidden = dkL.el.hidden = dkKhungSD.el.hidden = cd !== 'sinhdoi';
      dkKhungMuon.el.hidden = cd !== 'muon';
      ghiChu.dat(GHI_CHU[cd]);
      non.visible = cd === 'tiende';
      net.hyper.line.visible = false;   // hyperbol bất biến nay là dải sáng mềm trong shader của lưới
      for (const e of SK_MAU) { hyperSK[e.i].line.visible = cd === 'lorentz'; e.dom.visible = cd === 'lorentz'; }
      vongNay.line.visible = cd === 'tiende';
      ongNha.mesh.visible = ongDi1.mesh.visible = ongDi2.mesh.visible = cd === 'sinhdoi';
    }

    function cauHinh(o = {}) {
      if (o.chuDe && o.chuDe !== S.chuDe) { S.chuDe = o.chuDe; dkChuDe.dat(S.chuDe); S.tau = -99; }
      if (o.beta != null) { S.beta = o.beta; dkBeta.dat(o.beta); }
      if (o.vVat != null) { S.vVat = o.vVat; dkVVat.dat(o.vVat); }
      if (o.khung) { S.khung = o.khung; dkKhung.dat(o.khung); }
      if (o.L != null) { S.L = o.L; dkL.dat(o.L); }
      if (o.betaSD != null) { S.betaSD = o.betaSD; dkBetaSD.dat(o.betaSD); }
      if (o.khungSD) { S.khungSD = o.khungSD; dkKhungSD.dat(o.khungSD); }
      if (o.khungMuon) { S.khungMuon = o.khungMuon; dkKhungMuon.dat(o.khungMuon); }
      S.lac = false;
      S.phiDich = phiDich();
      if (o.chuDe || o.nhay) { S.phi = S.phiDich; }   // đổi chủ đề thì nhảy ngay tới khung đích
      S.ban = true;
      capNhatGiaoDien();
      if (o.mayAnh) bay(o.mayAnh);
    }

    // =====================================================================
    // Dựng lại hình của chủ đề đang mở
    // =====================================================================
    const DS_TICH = { lab: [], tau: [] };       // thời điểm hiển thị của các tích (đồng hồ ánh sáng)
    let thongTin = {};

    // Hai lưới tọa độ nay vẽ trong shader (taoLuoiMinkowski): các hàm này chỉ bật lưới cho chủ đề đang dựng.
    function luoiPhong(buoc = 1) { LU.lab = 1; LU.buoc = buoc; LU.gx = 0; LU.gt = 0; }
    function luoiTau() { LU.tau = 1; }
    function datLuoi() {
      const u = luoiMK.u;
      u.uBV.value = BV; u.uGV.value = GV; u.uPT.value = PT; u.uPX.value = PX; u.uSC.value = SC;
      u.uBS.value = BS; u.uGS.value = GS; u.uOT.value = OT; u.uOX.value = OX;
      u.uLab.value = LU.lab; u.uTau.value = LU.tau; u.uBuoc.value = LU.buoc; u.uGoc.value.set(LU.gx, LU.gt);
      u.uHyper.value = S.chuDe === 'lorentz' ? 1 : 0;
    }
    // Hai trục của phòng thí nghiệm, có vạch và nhãn.
    function trucPhong(nhanT = 'ct', nhanX = 'x', vach = true) {
      net.trucLab.bat();
      if (doan(net.trucLab, -XA, 0, 0, XA, 0, 0)) nhan.them(nhanT, 'mo tran', KQ.bx, KQ.bt);
      if (doan(net.trucLab, 0, -XA, 0, 0, XA, 0)) nhan.them(nhanX, 'mo tran', KQ.bx, KQ.bt);
      net.trucLab.xong();
      if (vach) for (let k = -6; k <= 6; k++) if (k) { dom.trang.lab(k, 0, 0); dom.trang.lab(0, k, 0); }
    }
    function trucTau(nhanT = 'ct′', nhanX = 'x′', vach = true, soVach = false) {
      net.trucTau.bat();
      tuTau(-XA, 0); let a0 = L_[0], a1 = L_[1]; tuTau(XA, 0);
      if (doan(net.trucTau, a0, a1, 0, L_[0], L_[1], 0)) nhan.them(nhanT, 'xanh tran dam', KQ.bx, KQ.bt);
      if (nhanX != null) {
        tuTau(0, -XA); a0 = L_[0]; a1 = L_[1]; tuTau(0, XA);
        if (doan(net.trucTau, a0, a1, 0, L_[0], L_[1], 0)) nhan.them(nhanX, 'xanh tran dam', KQ.bx, KQ.bt);
      }
      net.trucTau.xong();
      if (vach) {
        for (let k = -8; k <= 8; k++) {
          if (!k) continue;
          tuTau(k, 0); const d = dom.xanh.lab(L_[0], L_[1], 0);
          if (d && soVach && k > 0 && k <= 4) nhan.them(String(k), 'xanh tran', d.position.x, d.position.y);
          tuTau(0, k); dom.xanh.lab(L_[0], L_[1], 0);
        }
      }
    }
    function tiaSang(t0 = 0, x0 = 0) {
      doan(net.sang, t0, x0, 0, t0 + XA, x0 + XA, 0);
      doan(net.sang, t0, x0, 0, t0 + XA, x0 - XA, 0);
    }
    // Tấm kính «bây giờ»: đường thẳng (t0, x0)–(t1, x1) của phòng thí nghiệm, kéo theo chiều y.
    function tamKinh(m, n, t0, x0, t1, x1) {
      hien(t0, x0); const a0 = H_[0], a1 = H_[1]; hien(t1, x1);
      if (!cat(a1, a0, 0, H_[1], H_[0], 0)) return false;
      const { ax, at, bx, bt } = KQ;
      m.dai(ax, at, bx, bt, -YK, YK);
      n.them(ax, at, -YK, bx, bt, -YK); n.them(ax, at, YK, bx, bt, YK);
      n.them(ax, at, -YK, ax, at, YK); n.them(bx, bt, -YK, bx, bt, YK);
      return true;
    }
    // Vùng giữa hai đường thẳng song song (dải thế giới), cho bằng bốn đỉnh trong tọa độ phòng thí nghiệm.
    function daiThe(m, y, d) {
      for (let i = 0; i < 4; i++) { hien(d[2 * i], d[2 * i + 1]); PA[2 * i] = H_[1]; PA[2 * i + 1] = H_[0]; }
      const n = catDaGiac(4);
      if (n >= 3) m.daGiac(n, y);
    }
    const D4 = new Float64Array(8);
    // Cắt một đoạn của phòng thí nghiệm theo khung, không vẽ (để đặt nhãn ở đầu đoạn).
    function catLab(t0, x0, t1, x1) { hien(t0, x0); const a0 = H_[0], a1 = H_[1]; hien(t1, x1); return cat(a1, a0, 0, H_[1], H_[0], 0); }
    function chayBat() { for (const c of chay) { c.dung = false; c.duong.bat(); } }
    function chayDung(i, mau, ten, lop = 'dam') {
      const c = chay[i];
      c.dung = true; c.ten = ten;
      c.dom.material.color.set(mau);
      c.nhan.element.className = `nhan ${lop}`;
      c.nhan.center.x = lop.includes('phai') ? 1 : 0;
      return c.duong;
    }

    function veLai() {
      for (const k in net) if (k !== 'hyper' && k !== 'hyperSK') net[k].bat();
      for (const k in mat) mat[k].bat();
      for (const k in dom) dom[k].bat();
      nhan.bat();
      chayBat();
      const cd = S.chuDe;
      BS = S.beta; GS = gamma(BS); OT = 0; OX = 0;
      PT = 0; PX = 0; SC = 1;
      net.luoiLab.line.visible = net.luoiTau.line.visible = false;
      LU.lab = 0; LU.tau = 0;
      thongTin = {};

      if (cd === 'tiende') {
        luoiPhong();
        net.luoiTau.bat(); net.luoiTau.xong();
        trucPhong('ct', 'x', false);
        trucTau(chuCanh("canh.con-tau-374bd0", "con tàu"), null, false);
        // mặt sóng đồng thời của phòng thí nghiệm (xanh lục) và của tàu (xanh lam)
        for (const k of [2, 4]) {
          let pt = 0, px = 0, py = 0;
          for (let i = 0; i <= 64; i++) {
            const a = (i / 64) * 2 * Math.PI;
            const x = k * Math.cos(a), y = k * Math.sin(a);
            if (i) doan(net.luc, k, px, py, k, x, y);
            px = x; py = y;
          }
          for (let i = 0; i <= 64; i++) {
            const a = (i / 64) * 2 * Math.PI;
            const xp = k * Math.cos(a), y = k * Math.sin(a);
            tuTau(k, xp);
            if (i) doan(net.xanh, pt, px, py, L_[0], L_[1], y);
            pt = L_[0]; px = L_[1]; py = y;
          }
        }
        nhan.lab(chuCanh("canh.mat-song-cung-luc-theo-phong-thi-nghiem", "mặt sóng cùng lúc<small>theo phòng thí nghiệm</small>"), 'luc tran', 4, -4, 0, true);
        tuTau(4, 4); hien(L_[0], L_[1]);
        nhan.them(chuCanh("canh.mat-song-cung-luc-theo-con-tau", "mặt sóng cùng lúc<small>theo con tàu</small>"), 'xanh tran', H_[1] + 0.2, H_[0], 0);
        dom.vang.lab(0, 0, 0);
        nhan.lab(chuCanh("canh.chop-sang", "chớp sáng"), 'vang dam', 0, 0.2);
        hien(5.6, 4.3); nhan.them(chuCanh("canh.non-anh-sang", "nón ánh sáng"), 'vang tran', 4.3, 5.6, 0);
      }

      else if (cd === 'dongho') {
        PT = T_DH; PX = 0; OT = T_DH; OX = 0;
        luoiPhong();
        luoiTau();
        LU.lab = 0.75; LU.tau = 0.55;
        // dải gương: phòng thí nghiệm (trắng) và tàu (xanh lam), ở y = 0 và y = h
        for (const y of [0, H_DH]) {
          D4.set([T_DH, -W_DH, T_DH, W_DH, T_DH + XA, W_DH, T_DH + XA, -W_DH]);
          daiThe(mat.daiTrang, y, D4);
          doan(net.trangMo, T_DH, -W_DH, y, T_DH + XA, -W_DH, y); doan(net.trangMo, T_DH, W_DH, y, T_DH + XA, W_DH, y);
          const w = W_DH / GS;
          D4.set([T_DH, -w, T_DH, w, T_DH + XA, w + BS * XA, T_DH + XA, -w + BS * XA]);
          daiThe(mat.dai, y, D4);
          doan(net.xanh, T_DH, -w, y, T_DH + XA, -w + BS * XA, y); doan(net.xanh, T_DH, w, y, T_DH + XA, w + BS * XA, y);
        }
        // tia sáng nảy giữa hai gương
        const dLab = chayDung(0, MAU_KTG.anhSang, '');
        const dTau = chayDung(1, MAU_KTG.anhSang, '');
        DS_TICH.lab.length = 0; DS_TICH.tau.length = 0;
        let soLab = 0, soTau = 0;
        for (let k = 0; k <= 40; k++) {
          const y = k % 2 ? H_DH : 0;
          // đồng hồ phòng thí nghiệm
          const tL = T_DH + k * H_DH;
          dLab.lab(tL, 0, y);
          if (k) doan(net.sang, tL - H_DH, 0, H_DH - y, tL, 0, y);
          // đồng hồ trên tàu
          const tT = T_DH + k * H_DH * GS, xT = BS * (tT - T_DH);
          dTau.lab(tT, xT, y);
          if (k) doan(net.sang, tT - H_DH * GS, xT - BS * H_DH * GS, H_DH - y, tT, xT, y);
          if (k % 2 === 0) {
            hien(tL, 0); DS_TICH.lab.push(H_[0]);
            if (trongKhung(H_[1], H_[0])) { dom.trang.them(H_[1], H_[0], 0); if (k) nhan.them(String(k / 2), 'mo tran', H_[1] - 0.55, H_[0], 0); soLab++; }
            hien(tT, xT); DS_TICH.tau.push(H_[0]);
            if (trongKhung(H_[1], H_[0])) { dom.xanh.them(H_[1], H_[0], 0); if (k) nhan.them(String(k / 2), 'xanh tran', H_[1] + 0.1, H_[0] - 0.25, 0); soTau++; }
          }
        }
        if (catLab(T_DH, 0, T_DH + XA, 0)) nhan.them(chuCanh("canh.dong-ho-phong-thi-nghiem", "đồng hồ phòng thí nghiệm"), 'dam', KQ.bx - 0.3, KQ.bt - 0.3, H_DH, true);
        if (catLab(T_DH, 0, T_DH + XA, BS * XA)) nhan.them(chuCanh("canh.dong-ho-tren-tau", "đồng hồ trên tàu"), 'xanh dam', KQ.bx + 0.35, KQ.bt - 0.3, H_DH);
        hien(T_DH, 0); nhan.them(chuCanh("canh.hai-dong-ho-gap-nhau-cung-chi-0", "hai đồng hồ gặp nhau<small>cùng chỉ 0</small>"), 'tran', H_[1] + 0.3, H_[0] - 0.4, 0);
        thongTin = { soLab, soTau };
      }

      else if (cd === 'dongthoi') {
        luoiPhong();
        luoiTau();
        trucPhong('ct', 'x', false);
        trucTau(chuCanh("canh.ct-con-tau", "ct′ (con tàu)"), 'x′', false);
        tamKinh(mat.luc, net.luc, 0, -XA, 0, XA);
        tuTau(0, -XA); const a0 = L_[0], a1 = L_[1]; tuTau(0, XA);
        tamKinh(mat.xanh, net.xanh, a0, a1, L_[0], L_[1]);
        // ánh sáng của hai chớp: tia đi vào giữa sáng rõ, tia đi ra ngoài mờ
        doan(net.sang, 0, -L_DT, 0, XA, -L_DT + XA, 0);
        doan(net.sang, 0, L_DT, 0, XA, L_DT - XA, 0);
        doan(net.sangMo, 0, -L_DT, 0, XA, -L_DT - XA, 0);
        doan(net.sangMo, 0, L_DT, 0, XA, L_DT + XA, 0);
        chayDung(0, MAU_KTG.anhSang, '').lab(0, -L_DT); chay[0].duong.lab(XA, -L_DT + XA);
        chayDung(1, MAU_KTG.anhSang, '').lab(0, L_DT); chay[1].duong.lab(XA, L_DT - XA);
        chayDung(2, MAU_KTG.thoiGian, chuCanh("canh.con-tau-374bd0", "con tàu"), 'xanh dam').lab(-XA, -BS * XA); chay[2].duong.lab(XA, BS * XA);
        const tpA = GS * (0 - BS * -L_DT), tpB = GS * (0 - BS * L_DT);
        const d = (t) => (Math.abs(t) < 0.005 ? '0' : so(t, 2));
        dom.vang.lab(0, -L_DT, 0); dom.vang.lab(0, L_DT, 0);
        const vt = S.khung === 'tau' && BS > 0;
        nhan.lab(chuCanh("canh.chop-a-t-0-t", "chớp A<small>t = 0 · t′ = {0}</small>", [d(tpA)]), 'vang dam', 0, -L_DT, 0);
        nhan.lab(chuCanh("canh.chop-b-t-0-t", "chớp B<small>t = 0 · t′ = {0}</small>", [d(tpB)]), 'vang dam', 0, L_DT, 0);
        // người đứng giữa nhận cả hai cùng lúc
        dom.to.lab(L_DT, 0, 0);
        nhan.lab(chuCanh("canh.nguoi-dung-giua-nhan-a-va-b-cung", "người đứng giữa<small>nhận A và B cùng lúc</small>"), 'dam', L_DT, -0.2, 0);
        if (BS > 0.005) {
          const tB = L_DT / (1 + BS), tA = L_DT / (1 - BS);
          if (dom.xanh.lab(tB, BS * tB, 0)) nhan.lab(chuCanh("canh.tau-thay-b", "tàu thấy B"), 'xanh', tB, BS * tB, 0);
          if (dom.xanh.lab(tA, BS * tA, 0)) nhan.lab(chuCanh("canh.roi-moi-thay-a", "rồi mới thấy A"), 'xanh', tA, BS * tA, 0);
        }
        nhan.lab(chuCanh("canh.bay-gio-cua-phong-thi-nghiem", "«bây giờ» của phòng thí nghiệm"), 'tran', 0, -4.6, -YK);
        tuTau(0, 2.8); nhan.lab(chuCanh("canh.bay-gio-cua-con-tau", "«bây giờ» của con tàu"), 'xanh tran', L_[0], L_[1], -YK);
        thongTin = { tpA, tpB, vt };
      }

      else if (cd === 'thuoc') {
        luoiPhong();
        luoiTau();
        trucPhong('ct', 'x', false);
        trucTau('ct′', null, true);
        const h = L0 / 2;
        // dải thế giới của thước (đỉnh cho trong khung tàu rồi đổi về phòng thí nghiệm)
        const dinh = [[-XA, -h], [-XA, h], [XA, h], [XA, -h]];
        dinh.forEach(([tp, xp], i) => { tuTau(tp, xp); D4[2 * i] = L_[0]; D4[2 * i + 1] = L_[1]; });
        daiThe(mat.dai, 0, D4);
        for (const xp of [-h, h]) { tuTau(-XA, xp); const a0 = L_[0], a1 = L_[1]; tuTau(XA, xp); doan(net.xanhDam, a0, a1, 0, L_[0], L_[1], 0); }
        // hai tấm «bây giờ»
        tamKinh(mat.luc, net.luc, 0, -XA, 0, XA);
        tuTau(0, -XA); const b0 = L_[0], b1 = L_[1]; tuTau(0, XA);
        tamKinh(mat.xanh, net.xanh, b0, b1, L_[0], L_[1]);
        // hai cách cắt
        const Lp = L0 / GS;
        doan(net.lucDam, 0, -Lp / 2, 0, 0, Lp / 2, 0);
        tuTau(0, -h); const c0 = L_[0], c1 = L_[1]; tuTau(0, h);
        doan(net.hong, c0, c1, 0.04, L_[0], L_[1], 0.04);
        nhan.lab(chuCanh("canh.do-cung-luc-trong-phong-thi-nghiem-l", "đo cùng lúc trong phòng thí nghiệm<small>L = L₀/γ = {0}</small>", [so(Lp, 2)]), 'dam', -0.55, Lp / 2 + 0.15, 0);
        nhan.lab(chuCanh("canh.do-cung-luc-tren-tau-l-thuoc-cua", "đo cùng lúc trên tàu<small>L₀ = {0} (thước của tàu)</small>", [so(L0, 0)]), 'hong dam', L_[0], L_[1] + 0.15, 0);
        tuTau(4.2, h); nhan.lab(chuCanh("canh.dai-the-gioi-cua-thuoc", "dải thế giới của thước"), 'xanh dam', L_[0], L_[1] + 0.2, 0);
        thongTin = { Lp };
      }

      else if (cd === 'lorentz') {
        luoiPhong();
        luoiTau();
        trucPhong('ct', 'x', true);
        trucTau('ct′', 'x′', true, true);
        tiaSang();
        for (const e of SK_MAU) {
          hien(e.t, e.x);
          e.dom.position.set(H_[1], H_[0], 0);
          e.dom.visible = trongKhung(H_[1], H_[0]);
          nhan.them(`${e.ten}<small>ct = ${so(H_[0], 2)} · x = ${so(H_[1], 2)} · s² = ${so(e.s2, 2)}</small>`, 'dam', H_[1], H_[0], 0);
        }
        nhan.them(chuCanh("canh.hyperbol-bat-bien-t-x-1-4-9", "hyperbol bất biến<small>−t² + x² = −1, −4, −9</small>"), 'tran', -3.1, Math.sqrt(9 + 9.61) + 0.15, 0);
        nhan.them('−t² + x² = 1, 4, 9', 'tran', Math.sqrt(9 + 5.29) + 0.1, -2.3, 0);
      }

      else if (cd === 'cong') {
        luoiPhong();
        luoiTau();
        trucPhong('', 'x', false);
        const w = congVanToc(BS, S.vVat);
        const vNhin = (u) => congVanToc(u, -BV);
        // Nhãn tốc độ đo trong khung đang nhìn, đặt ở độ cao tL trên đường (hoặc ở đầu đoạn đã cắt).
        const dauNhan = (u, lop, ten, tL, trai = false) => {
          const v = vNhin(u);
          const chu = Math.abs(Math.abs(v) - 1) < 1e-9 ? '1 c' : Math.abs(v) < 5e-4 ? chuCanh("canh.dung-yen", "đứng yên") : `${so(v, 3)} c`;
          const x = v * tL;
          if (Math.abs(x) < B.x1 - 0.4) nhan.them(`${ten}<small>${chu}</small>`, lop, x, tL, 0, trai || v < -0.05);
          else nhan.them(`${ten}<small>${chu}</small>`, lop, KQ.bx, KQ.bt, 0, trai || v < -0.05);
        };
        // phòng thí nghiệm và tàu (cả hai phía thời gian), vật và ánh sáng (từ gốc trở lên)
        if (doan(net.trang, -XA, 0, 0, XA, 0, 0)) dauNhan(0, 'dam', chuCanh("canh.phong-thi-nghiem-7b4795", "phòng thí nghiệm"), 5.5);
        if (doan(net.xanhDam, -XA, -BS * XA, 0, XA, BS * XA, 0)) dauNhan(BS, 'xanh dam', chuCanh("canh.con-tau-374bd0", "con tàu"), 5.2);
        if (S.vVat < 1) { if (doan(net.hong, 0, 0, 0, XA, w * XA, 0)) dauNhan(w, 'hong dam', chuCanh("canh.vat-ban-ra", "vật bắn ra"), 4.4, true); }
        if (doan(net.sang, 0, 0, 0, XA, XA, 0)) dauNhan(1, 'vang dam', chuCanh("canh.anh-sang", "ánh sáng"), 2.6);
        doan(net.sangMo, 0, 0, 0, XA, -XA, 0);
        const galilei = BS + S.vVat;
        if (Math.abs(BV) < 0.02 && galilei > 1.0001 && S.vVat < 1) {
          if (doan(net.doNet, 0, 0, 0, XA, galilei * XA, 0)) nhan.them(chuCanh("canh.newton-c-vuot-anh-sang-khong-the", "Newton: {0} c?<small>vượt ánh sáng: không thể</small>", [so(galilei, 2)]), 'tran', KQ.bx, KQ.bt - 0.7, 0, true);
        }
        dom.vang.lab(0, 0, 0);
        nhan.lab(chuCanh("canh.ban-ra", "bắn ra"), 'tran', 0, 0.15, 0);
        chayDung(0, 0xffffff, '').lab(-XA, 0); chay[0].duong.lab(XA, 0);
        chayDung(1, MAU_KTG.thoiGian, '').lab(-XA, -BS * XA); chay[1].duong.lab(XA, BS * XA);
        if (S.vVat < 1) { chayDung(2, MAU_KTG.hong, '').lab(0, 0); chay[2].duong.lab(XA, w * XA); }
        chayDung(3, MAU_KTG.anhSang, '').lab(0, 0); chay[3].duong.lab(XA, XA);
        thongTin = { w };
      }

      else if (cd === 'sinhdoi') {
        net.luoiLab.line.visible = net.luoiTau.line.visible = false;
        const b = S.betaSD, g = gamma(b);
        const sd = sinhDoi(S.L, b);
        const k = 10 / sd.T;                  // đơn vị hiển thị cho mỗi năm
        const xn = -2.5 * b;                  // vị trí nhà
        const xq = xn + k * S.L;              // chỗ quay đầu
        PT = 0; PX = xq;
        // ánh sáng từ lúc khởi hành (giới hạn của mọi đường đi)
        doan(net.sangMo, -5, xn, 0, -5 + XA, xn + XA, 0);
        doan(net.sangMo, -5, xn, 0, -5 + XA, xn - XA, 0);
        // lưới phòng thí nghiệm mờ, mỗi ô một năm và một năm ánh sáng, gốc ở nhà lúc chia tay
        luoiPhong(k); LU.lab = 0.75; LU.gx = xn; LU.gt = -5;
        // hai đường thế giới: ống sáng (trắng: người ở nhà; hồng: người đi, gãy ở chỗ quay đầu)
        hien(-5, xn); let a0 = H_[0], a1 = H_[1]; hien(5, xn); ongNha.doan(a1, a0, 0, H_[1], H_[0], 0);
        hien(-5, xn); a0 = H_[0]; a1 = H_[1]; hien(0, xq); ongDi1.doan(a1, a0, 0, H_[1], H_[0], 0);
        hien(0, xq); a0 = H_[0]; a1 = H_[1]; hien(5, xn); ongDi2.doan(a1, a0, 0, H_[1], H_[0], 0);
        // vạch thời gian riêng
        const buoc = [0.5, 1, 2, 5, 10, 20, 50].find((s) => s * k >= 0.6) || 50;
        for (let y = buoc; y < sd.T - 1e-9; y += buoc) dom.trang.lab(-5 + y * k, xn, 0);
        for (let y = buoc; y < sd.Tdi - 1e-9; y += buoc) {
          const tLab = y * g;                  // thời gian của phòng thí nghiệm ứng với y năm của người đi
          const t = -5 + tLab * k;
          const x = t <= 0 ? xn + b * tLab * k : xq - b * (t - 0);
          dom.hong.lab(t, x, 0);
        }
        // «bây giờ» của người đi ngay trước và sau khi quay đầu
        doan(net.timNet, 0, xq, 0, -b * (xq - xn), xn, 0);
        doan(net.hongNet, 0, xq, 0, b * (xq - xn), xn, 0);
        dom.trang.lab(-b * (xq - xn), xn, 0); dom.trang.lab(b * (xq - xn), xn, 0);
        nhan.lab(chuCanh("canh.bay-gio-ngay-truoc-khi-quay-dau-o", "«bây giờ» ngay trước khi quay đầu<small>ở nhà mới qua {0} năm</small>", [so(sd.truocQuay, 2)]), 'tim', -b * (xq - xn), xn, 0, true);
        nhan.lab(chuCanh("canh.bay-gio-ngay-sau-khi-quay-dau-o", "«bây giờ» ngay sau khi quay đầu<small>ở nhà đã qua {0} năm</small>", [so(sd.sauQuay, 2)]), 'hong', b * (xq - xn), xn, 0, true);
        dom.to.lab(-5, xn, 0); dom.to.lab(5, xn, 0); dom.hong.lab(0, xq, 0);
        nhan.lab(chuCanh("canh.chia-tay", "chia tay"), 'tran', -5, xn, 0, true);
        nhan.lab(chuCanh("canh.gap-lai-o-nha-nam-nguoi-di-nam", "gặp lại<small>ở nhà: {0} năm · người đi: {1} năm</small>", [so(sd.T, 1), so(sd.Tdi, 1)]), 'dam', 5, xn + 0.15, 0);
        hien(0, xq); nhan.them(chuCanh("canh.quay-dau-cach-nha-nam-anh-sang", "quay đầu<small>cách nhà {0} năm ánh sáng</small>", [so(S.L, 2)]), 'hong dam', H_[1] + 0.15, H_[0] + 0.45, 0);
        // đường cho đốm chạy
        const dN = chayDung(0, 0xffffff, '', 'dam phai'); dN.lab(-5, xn); dN.lab(5, xn);
        const dD = chayDung(1, MAU_KTG.hong, '', 'hong dam'); dD.lab(-5, xn); dD.lab(0, xq); dD.lab(5, xn);
        thongTin = { sd, k, xn, xq, g };
      }

      else if (cd === 'muon') {
        const xD = -2.6, x0 = xD + H_MUON * KM, t0 = -2.6;
        PT = t0; PX = x0; SC = GV;
        if (Math.abs(BV) < 0.02) luoiPhong(1, 8); else { net.luoiLab.bat(); net.luoiLab.xong(); }
        net.luoiTau.bat(); net.luoiTau.xong();
        const m = muon(B_MUON);
        // lớp khí quyển từ mặt đất tới độ cao 10,4 km
        D4.set([-XA, xD, -XA, x0, XA, x0, XA, xD]);
        daiThe(mat.khi, 0, D4);
        if (doan(net.trang, -XA, xD, 0, XA, xD, 0)) nhan.them(chuCanh("canh.mat-dat-73603d", "mặt đất"), 'dam', KQ.bx, KQ.bt - 0.4, 0, true);
        doan(net.trangMo, -XA, x0, 0, XA, x0, 0);
        const tCham = t0 + (H_MUON * KM) / B_MUON;
        doan(net.hong, t0, x0, 0, tCham, xD, 0);
        // vạch thời gian riêng: mỗi 0,5 micro giây của muon
        const ctMoiUs = 0.299792458 * KM;           // đơn vị hiển thị cho 1 micro giây × c
        for (let us = 0.5; us < TAU_MUON_S * 1e6; us += 0.5) {
          const t = t0 + us * m.g * ctMoiUs;
          const d = dom.hong.lab(t, x0 - B_MUON * (t - t0), 0);
          if (d) nhan.them(`${so(us, 1)} µs`, 'hong tran', d.position.x + 0.05, d.position.y, 0);
        }
        dom.hong.lab(t0, x0, 0); dom.to.lab(tCham, xD, 0);
        nhan.lab(chuCanh("canh.muon-sinh-ra-do-cao-10-4-km", "muon sinh ra<small>độ cao 10,4 km, bay 0,998 c</small>"), 'hong dam', t0, x0, 0);
        hien(tCham, xD);
        nhan.them(chuCanh("canh.toi-mat-dat-dong-ho-muon-chi-s", "tới mặt đất<small>đồng hồ muon chỉ {0} µs</small>", [so(TAU_MUON_S * 1e6, 2)]), 'dam', H_[1], H_[0], 0, true);
        if (Math.abs(BV) < 0.02) {
          const tN = t0 + 0.6586 * KM;
          doan(net.doNet, t0, x0, 0.05, tN, x0 - B_MUON * 0.6586 * KM, 0.05);
          dom.do.lab(tN, x0 - B_MUON * 0.6586 * KM, 0);
          nhan.lab(chuCanh("canh.neu-khong-co-gian-thoi-gian-phan-ra", "✗ nếu không có giãn thời gian<small>phân rã sau khoảng 659 m</small>"), 'tran', tN, x0 - B_MUON * 0.6586 * KM, 0, true);
          nhan.them(chuCanh("canh.lop-khong-khi-day-10-4-km", "lớp không khí dày 10,4 km"), 'tran', -1.4, 5.3, 0);
        } else {
          const xMat = x0 - H_MUON * KM;           // trong khung muon (đã phóng to γ lần) mặt đất cách đúng bấy nhiêu lúc muon sinh ra
          nhan.them(chuCanh("canh.lop-khong-khi-chi-day-m-co-do", "lớp không khí chỉ dày {0} m<small>co độ dài: 10,4 km chia γ = {1}</small>", [so(m.neuKhongGianM, 0), so(m.g, 1)]), 'tran', (xMat + x0) / 2 - 0.5, t0 - 0.6, 0, true);
          nhan.them(chuCanh("canh.hinh-phong-to-15-8-lan", "(hình phóng to 15,8 lần)"), 'mo tran', (xMat + x0) / 2 - 0.5, t0 - 1.1, 0, true);
        }
        chayDung(0, MAU_KTG.hong, '').lab(t0, x0); chay[0].duong.lab(tCham, xD);
        thongTin = { m, tCham };
      }

      for (const k in net) if (k !== 'hyper' && k !== 'hyperSK') net[k].xong();
      datLuoi();
      for (const k in mat) mat[k].xong();
      for (const k in dom) dom[k].xong();
      nhan.xong();
      // đốm chạy không dùng thì ẩn
      for (const c of chay) { c.dom.visible = c.nhan.visible = false; }
    }

    // Khoảng chạy của «bây giờ» trong khung nhìn, theo chủ đề.
    const KHOANG = { tiende: [0, 5.8], dongho: [-5, 6], dongthoi: [-1, 6], thuoc: [-6, 6], lorentz: [-6, 6], cong: [-1, 6], sinhdoi: [-5.8, 5.8], muon: [-3, 3] };
    let dang = '';

    // =====================================================================
    // Bản 3: đồ vật trong sơ đồ, tay nắm, tiếng
    // =====================================================================
    // Con tàu (tên lửa) chạy theo đường thế giới của nó tới chỗ «bây giờ» của khung đang nhìn.
    const tau3D = taoTauNho({ co: 0.27 });
    // Hai đồng hồ ánh sáng thật: gương cách nhau H_DH theo chiều sâu y, xung sáng nảy khớp với đường vàng gấp khúc.
    const taoDH = (mauKhung) => {
      const dh = taoDongHoAnhSang({ cao: H_DH, banKinh: 0.28, mauKhung });
      dh.nhom.rotation.x = Math.PI / 2;            // trục gương (y của đồng hồ) quay sang chiều sâu y của sơ đồ (Z)
      const co1 = new THREE.Group(); co1.add(dh.nhom);
      const nhom = new THREE.Group(); nhom.add(co1);
      return { dh, co1, nhom, k: -1 };
    };
    const dhLab = taoDH(0xe8eef8), dhTau = taoDH(MAU_KTG.thoiGian);
    // Cây thước của tàu (bước 4), nằm trên «bây giờ» t = 0 của khung đang nhìn, sau mặt sơ đồ một chút.
    const thuoc3D = taoThuoc(L0);
    // Anh em sinh đôi: Trái Đất (nhà), Alpha Centauri (đích), con tàu của người đi; hai đường thế giới là ống sáng.
    const traiDat = taoTraiDat({ banKinh: 0.36, chiTiet: 64 });
    traiDat.datHuongSang([0.5, 0.6, 0.8]);
    const saoDich = taoSao({ mau: 0xfff0d2, banKinh: 0.12, doSang: 2.6, tia: 4, doDaiTia: 16 });
    const tauDi = taoTauNho({ co: 0.25, mauNhan: MAU_KTG.hong });
    const ongNha = new OngSang(2, { mau: 0xffffff, banKinh: 0.055, sang: 1.5, moTuongLai: 0.2 });
    const ongDi1 = new OngSang(2, { mau: MAU_KTG.hong, banKinh: 0.055, sang: 2, moTuongLai: 0.2 });
    const ongDi2 = new OngSang(2, { mau: MAU_KTG.hong, banKinh: 0.055, sang: 2, moTuongLai: 0.2 });
    goc.add(tau3D.nhom, dhLab.nhom, dhTau.nhom, thuoc3D.nhom, traiDat.nhom, saoDich.nhom, tauDi.nhom, ongNha.mesh, ongDi1.mesh, ongDi2.mesh);
    thuoc3D.nhom.position.set(0, 0, 0.5);

    // ----- Tay nắm -----
    const T_KEO = -4, T_KEO_DH = T_DH + 2.5, T_KEO_VAT = 3.6;
    let keo = '';
    const xemLab = () => S.khung === 'lab' && Math.abs(S.phi) < 1e-3 && !S.lac;
    const moTaV = () => chuCanh("canh.v-c-keo-sang-phai-truc-ct-nga", "<span class=\"so\">v = {0} c · γ = {1}</span><br>Kéo sang phải: trục ct′ ngả về phía tia sáng, lưới xanh lam khép lại.", [so(S.beta, 3), so(gamma(S.beta), 3)]);
    const tayV = tt.tayNam({
      viTri: [S.beta * T_KEO, T_KEO, 0], mau: MAU_KTG.thoiGian, co: 0.15,
      rangBuoc: { kieu: 'duong', qua: [0, T_KEO, 0], huong: [1, 0, 0] },
      gioiHan: (p) => p.set(kep(p.x, 0.95 * T_KEO, 0), T_KEO, 0),
      ten: chuCanh("canh.truc-ct-cua-con-tau", "Trục ct′ của con tàu"), moTa: moTaV, nhan: chuCanh("canh.keo-truc-cua-con-tau", "Kéo trục của con tàu"),
      khiNam: () => { keo = 'v'; }, khiKeo: (p) => datBeta(Math.round((p.x / T_KEO) * 1000) / 1000), khiTha: () => { keo = ''; },
    });
    const tayVDH = tt.tayNam({
      viTri: [S.beta * (T_KEO_DH - T_DH), T_KEO_DH, 0], mau: MAU_KTG.thoiGian, co: 0.15,
      rangBuoc: { kieu: 'duong', qua: [0, T_KEO_DH, 0], huong: [1, 0, 0] },
      gioiHan: (p) => p.set(kep(p.x, 0, 0.95 * (T_KEO_DH - T_DH)), T_KEO_DH, 0),
      ten: chuCanh("canh.duong-the-gioi-cua-dong-ho-tren-tau", "Đường thế giới của đồng hồ trên tàu"), moTa: moTaV, nhan: chuCanh("canh.keo-de-doi-van-toc-tau", "Kéo để đổi vận tốc tàu"),
      khiNam: () => { keo = 'v'; }, khiKeo: (p) => datBeta(Math.round((p.x / (T_KEO_DH - T_DH)) * 1000) / 1000), khiTha: () => { keo = ''; },
    });
    const tayVat = tt.tayNam({
      viTri: [congVanToc(S.beta, S.vVat) * T_KEO_VAT, T_KEO_VAT, 0], mau: MAU_KTG.hong, co: 0.14,
      rangBuoc: { kieu: 'duong', qua: [0, T_KEO_VAT, 0], huong: [1, 0, 0] },
      gioiHan: (p) => p.set(kep(p.x, S.beta * T_KEO_VAT, T_KEO_VAT), T_KEO_VAT, 0),
      ten: chuCanh("canh.vat-ban-ra-f423a8", "Vật bắn ra"), moTa: () => chuCanh("canh.so-voi-tau-c-so-voi-phong-thi", "So với tàu: <span class=\"so\">{0} c</span> · so với phòng thí nghiệm: <span class=\"so\">{1} c</span>", [so(S.vVat, 3), so(congVanToc(S.beta, S.vVat), 3)]),
      nhan: chuCanh("canh.keo-vat-ban-ra", "Kéo vật bắn ra"),
      khiNam: () => { keo = 'vat'; },
      khiKeo: (p) => { const w = p.x / T_KEO_VAT; S.vVat = w >= 0.998 ? 1 : kep(vanTocBan(S.beta, w), 0, 1); dkVVat.dat(S.vVat); S.ban = true; },
      khiTha: () => { keo = ''; },
    });
    const tayQuay = tt.tayNam({
      viTri: [2.5 * S.betaSD, 0, 0], mau: MAU_KTG.hong, co: 0.15,
      rangBuoc: { kieu: 'duong', qua: [0, 0, 0], huong: [1, 0, 0] },
      gioiHan: (p) => p.set(kep(p.x, 0.25, 2.475), 0, 0),
      ten: chuCanh("canh.diem-quay-dau", "Điểm quay đầu"), moTa: () => chuCanh("canh.bay-c-toi-dich-cach-nam-anh-sang", "Bay <span class=\"so\">{0} c</span> tới đích cách <span class=\"so\">{1}</span> năm ánh sáng.<br>Kéo xa ra: bay nhanh hơn, về sớm hơn, người đi càng trẻ.", [so(S.betaSD, 3), so(S.L, 2)]),
      nhan: chuCanh("canh.keo-diem-quay-dau", "Kéo điểm quay đầu"),
      khiNam: () => { keo = 'quay'; },
      khiKeo: (p) => { S.betaSD = kep(Math.round((p.x / 2.5) * 1000) / 1000, 0.1, 0.99); dkBetaSD.dat(S.betaSD); capNhatKhungSD(); S.ban = true; },
      khiTha: () => { keo = ''; },
    });
    function datTayNam() {
      const cd = S.chuDe, lab = xemLab();
      const thuong = cd === 'tiende' || cd === 'dongthoi' || cd === 'thuoc' || cd === 'lorentz' || cd === 'cong';
      tayV.an(!(thuong && lab)); tayVDH.an(!(cd === 'dongho' && lab)); tayVat.an(!(cd === 'cong' && lab));
      tayQuay.an(!(cd === 'sinhdoi' && S.khungSD === 'nha' && Math.abs(S.phi) < 1e-3));
      if (keo !== 'v') { tayV.dat([S.beta * T_KEO, T_KEO, 0]); tayVDH.dat([S.beta * (T_KEO_DH - T_DH), T_KEO_DH, 0]); }
      if (keo !== 'vat') tayVat.dat([congVanToc(S.beta, S.vVat) * T_KEO_VAT, T_KEO_VAT, 0]);
      if (keo !== 'quay') tayQuay.dat([2.5 * S.betaSD, 0, 0]);
    }

    // ----- Rê chuột xem thông tin -----
    for (const e of SK_MAU) {
      tt.them(e.dom, {
        ten: chuCanh("canh.su-kien", "Sự kiện {0}", [e.ten]), mau: e.mau, banKinhPx: 16,
        moTa: () => {
          const b = S.beta, g = gamma(b);
          return chuCanh("canh.phong-thi-nghiem-ct-x-con-tau-ct", "Phòng thí nghiệm: <span class=\"so\">ct = {0} · x = {1}</span><br>Con tàu: <span class=\"so\">ct′ = {2} · x′ = {3}</span><br>Cả hai khung: <span class=\"so\">s² = {4}</span>", [so(e.t, 2), so(e.x, 2), so(g * (e.t - b * e.x), 2), so(g * (e.x - b * e.t), 2), so(e.s2, 2)]);
        },
      });
    }
    tt.them(tau3D.nhom, { ten: chuCanh("canh.con-tau", "Con tàu"), mau: MAU_KTG.thoiGian, moTa: () => chuCanh("canh.bay-c-so-voi-phong-thi-nghiem-trong", "Bay <span class=\"so\">{0} c</span> so với phòng thí nghiệm, γ = <span class=\"so\">{1}</span>. Trong khung đang nhìn, thân tàu ngắn lại đúng γ lần theo chiều bay.", [so(S.beta, 2), so(gamma(S.beta), 3)]) });
    tt.them(dhLab.nhom, { ten: chuCanh("canh.dong-ho-phong-thi-nghiem-bbc9b1", "Đồng hồ phòng thí nghiệm"), mau: 0xe8eef8, moTa: () => chuCanh("canh.da-tich-lan-toi-bay-gio-cua-khung", "Đã tích <span class=\"so\">{0}</span> lần tới «bây giờ» của khung đang nhìn.", [soTichNay.lab]) });
    tt.them(dhTau.nhom, { ten: chuCanh("canh.dong-ho-tren-tau-1b914e", "Đồng hồ trên tàu"), mau: MAU_KTG.thoiGian, moTa: () => chuCanh("canh.da-tich-lan-moi-tich-do-tu-phong", "Đã tích <span class=\"so\">{0}</span> lần. Mỗi tích, đo từ phòng thí nghiệm, dài γ × 2h/c = <span class=\"so\">{1}</span>.", [soTichNay.tau, so(gamma(S.beta) * NHIP_DONG_HO, 3)]) });
    tt.them(thuoc3D.nhom, { ten: chuCanh("canh.thuoc-cua-tau", "Thước của tàu"), mau: MAU_KTG.thoiGian, moTa: () => chuCanh("canh.do-dai-rieng-4-o-khung-dang-nhin", "Độ dài riêng 4 ô. Khung đang nhìn đo được <span class=\"so\">{0}</span>.", [so(L0 * Math.sqrt(1 - ((S.beta - BV) / (1 - S.beta * BV)) ** 2), 3)]) });
    tt.them(traiDat.nhom, { ten: chuCanh("canh.nguoi-o-nha-trai-dat", "Người ở nhà (Trái Đất)"), mau: 0xffffff, moTa: () => thongTin.sd ? chuCanh("canh.cho-nam-toi-luc-gap-lai", "Chờ <span class=\"so\">{0}</span> năm tới lúc gặp lại.", [so(thongTin.sd.T, 2)]) : '' });
    tt.them(tauDi.nhom, { ten: chuCanh("canh.nguoi-di", "Người đi"), mau: MAU_KTG.hong, moTa: () => thongTin.sd ? chuCanh("canh.gia-them-nam-it-hon-nguoi-o-nha", "Già thêm <span class=\"so\">{0}</span> năm: ít hơn người ở nhà <span class=\"so\">{1}</span> năm.", [so(thongTin.sd.Tdi, 2), so(thongTin.sd.T - thongTin.sd.Tdi, 2)]) : '' });
    tt.them(saoDich.nhom, { ten: chuCanh("canh.alpha-centauri", "Alpha Centauri"), mau: 0xfff0d2, banKinhPx: 16, moTa: () => chuCanh("canh.dich-cua-chuyen-di-cach-nha-nam-anh", "Đích của chuyến đi, cách nhà <span class=\"so\">{0}</span> năm ánh sáng.", [so(S.L, 2)]) });

    // Đặt vật theo «bây giờ» (tau) của khung đang nhìn. Gọi mỗi khung hình, không cấp phát bộ nhớ.
    const nhipCu = { lab: -1, tau: -1, nha: -1, di: -1, tauCu: -99 };
    function datVat3D(tau, dt) {
      const cd = S.chuDe;
      const coTau = cd === 'tiende' || cd === 'dongthoi' || cd === 'cong' || cd === 'lorentz';
      tau3D.nhom.visible = false;
      if (coTau) {
        const v = viTriTrenDuong(BS, OT, OX, tau);
        tau3D.nhom.visible = trongKhung(v[0], tau, -0.3);
        tau3D.nhom.position.set(v[0], tau, 0);
        tau3D.datVanToc(v[2]);
      }
      // đồng hồ ánh sáng
      dhLab.nhom.visible = dhTau.nhom.visible = cd === 'dongho';
      if (cd === 'dongho') {
        for (const [d, b, ten, tanSo, lech] of [[dhLab, 0, 'lab', 1046.5, -0.55], [dhTau, BS, 'tau', 1568, 0.55]]) {
          const v = viTriTrenDuong(b, T_DH, 0, tau);
          const gR = 1 / Math.sqrt(1 - v[2] * v[2]);
          const tauRieng = Math.max(0, (tau - T_DH) / gR);
          d.nhom.position.set(v[0], tau, 0);
          d.co1.scale.x = 1 / gR;
          d.dh.datThoiGian(tauRieng, NHIP_DONG_HO);
          d.dh.capNhat(dt);
          d.nhom.visible = trongKhung(v[0], tau, 0.3);
          // Tiếng: mỗi lần xung về gương dưới (một tích) là một tiếng «tích». Đồng hồ chạy (so với khung đang nhìn)
          // tích thưa hơn đúng γ lần.
          const k = Math.floor(tauRieng / NHIP_DONG_HO + 1e-9);
          if (nhipCu[ten] >= 0 && k === nhipCu[ten] + 1 && dt > 0) am.tich({ tanSo, doTo: 0.42, lech, dai: 0.06 });
          nhipCu[ten] = k;
        }
      }
      // thước
      thuoc3D.nhom.visible = cd === 'thuoc';
      if (cd === 'thuoc') { const bR = (BS - BV) / (1 - BS * BV); thuoc3D.datDai(L0 * Math.sqrt(1 - bR * bR)); }
      // anh em sinh đôi
      const sd = cd === 'sinhdoi' && thongTin.sd;
      traiDat.nhom.visible = saoDich.nhom.visible = tauDi.nhom.visible = !!sd;
      if (sd) {
        const { xn, xq, k, g } = thongTin;
        const b = S.betaSD;
        const n = viTriTrenDuong(0, -5, xn, tau);
        const tNha = n[1];
        traiDat.nhom.position.set(n[0], tau, 0);
        traiDat.nhom.visible = tNha >= -5 - 1e-6 && tNha <= 5 + 1e-6 && trongKhung(n[0], tau, 0.3);
        traiDat.capNhat(dt);
        const q = viTriTrenDuong(0, 0, xq, tau);
        saoDich.nhom.position.set(q[0], tau, 0);
        saoDich.nhom.visible = q[1] >= -5 && q[1] <= 5 && trongKhung(q[0], tau, 0.3);
        saoDich.capNhat(dt);
        // người đi: chặng đi trước sự kiện quay đầu (ở t hiển thị = 0, vì đó là điểm chốt), chặng về sau đó
        const v = tau < 0 ? viTriTrenDuong(b, -5, xn, tau) : viTriTrenDuong(-b, 0, xq, tau);
        tauDi.nhom.position.set(v[0], tau, 0);
        tauDi.nhom.visible = v[1] >= -5 - 1e-6 && v[1] <= 5 + 1e-6 && trongKhung(v[0], tau, 0.3);
        const quanh = Math.abs(tau) < 0.45;               // đang quay đầu: bật động cơ, mũi hướng về nhà
        const vVe = viTriTrenDuong(-b, 0, xq, tau)[2];
        tauDi.datVanToc(quanh ? vVe : v[2]);
        tauDi.datLucDay(quanh ? 1 : 0);
        tauDi.capNhat(dt);
        for (const o of [ongNha, ongDi1, ongDi2]) o.mat.uniforms.uNay.value = tau;
        // Tiếng: mỗi sinh nhật của người ở nhà (trầm, bên trái) và của người đi (cao, bên phải) khi «bây giờ» đi qua.
        const tuoiNha = (tNha + 5) / k;
        const tuoiDi = (v[1] + 5) / (k * g);
        const kN = Math.floor(tuoiNha + 1e-9), kD = Math.floor(tuoiDi + 1e-9);
        if (dt > 0 && tau > nhipCu.tauCu && tau - nhipCu.tauCu < 0.5) {
          if (kN > nhipCu.nha && kN >= 1 && tuoiNha <= thongTin.sd.T + 1e-6) am.tich({ tanSo: 880, doTo: 0.4, lech: -0.5, dai: 0.07 });
          if (kD > nhipCu.di && kD >= 1 && tuoiDi <= thongTin.sd.Tdi + 1e-6) am.tich({ tanSo: 1760, doTo: 0.4, lech: 0.5, dai: 0.07 });
        }
        nhipCu.nha = kN; nhipCu.di = kD;
      }
      // Bước 3: tiếng chuông khi ánh sáng một chớp tới người đứng giữa hoặc tới con tàu.
      if (cd === 'dongthoi' && dt > 0 && tau > nhipCu.tauCu && tau - nhipCu.tauCu < 0.5) {
        const tB = L_DT / (1 + BS), tA = L_DT / (1 - BS);
        const nghe = [[L_DT, 0, 784, 0], [tB, BS * tB, 1318.5, 0.5], [tA, BS * tA, 987.8, 0.5]];
        for (const [tl, xl, f, lech] of nghe) {
          hien(tl, xl);
          if (H_[0] > nhipCu.tauCu && H_[0] <= tau) am.not({ tanSo: f, dang: 'chuong', doTo: 0.3, dai: 1, lech });
        }
      }
      nhipCu.tauCu = tau;
    }
    let thu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    function apThu(ten) {
      if (ten === 'gamma2') datBeta(Math.sqrt(3) / 2);
      else if (ten === 'dongthoi') datBeta(Math.SQRT1_2);
      else if (ten === 'thuoc') datBeta(Math.sqrt(7) / 4);
      else if (ten === 'cong') { S.vVat = vanTocBan(THU_THACH_B6.cong.u, THU_THACH_B6.cong.w); dkVVat.dat(S.vVat); S.ban = true; }
      else if (ten === 'sinhdoi') { S.betaSD = 0.862; dkBetaSD.dat(S.betaSD); capNhatKhungSD(); S.ban = true; }
    }

    function capNhat(dt) {
      if (thu) { apThu(thu); thu = null; }
      // khung nhìn: độ nhanh chạy dần tới đích («quay hyperbol»)
      if (S.lac) { S.tLac += dt; S.phiDich = 1.15 * Math.sin(S.tLac * 0.55); }
      const d = S.phiDich - S.phi;
      if (Math.abs(d) > 1e-6) {
        const nhay = d * (1 - Math.exp(-dt * 2.4)) + Math.sign(d) * dt * 0.06;
        if (Math.abs(nhay) >= Math.abs(d)) S.phi = S.phiDich; else S.phi += nhay;
        S.ban = true;
      }
      if (S.ban) {
        BV = Math.tanh(S.phi); GV = Math.cosh(S.phi);
        veLai();
        S.ban = false;
        dang = S.chuDe;
      }
      // «bây giờ» của khung nhìn chạy lên
      const [ta, tb] = KHOANG[S.chuDe];
      if (S.tau < ta - 0.5 || S.tau > tb + 0.8) S.tau = ta;
      S.tau += dt * (S.chuDe === 'muon' ? 0.9 : TOC_NAY);
      const tau = Math.min(S.tau, tb);
      // tấm kính «bây giờ» của khung nhìn
      mat.nay.bat();
      const coNay = S.chuDe === 'dongho' || S.chuDe === 'tiende' || S.chuDe === 'sinhdoi';
      if (coNay) mat.nay.dai(B.x0, tau, B.x1, tau, -YK, YK);
      mat.nay.xong();
      // mặt sóng lúc này (bước 1): vòng tròn bán kính tau quanh chớp sáng trong khung đang nhìn
      if (S.chuDe === 'tiende') {
        for (let i = 0; i <= 96; i++) { const a = (i / 96) * 2 * Math.PI; vongNay.dat(i, tau * Math.cos(a), tau, tau * Math.sin(a)); }
        vongNay.xong(tau > 0.02 ? 97 : 0);
      }
      // đốm chạy
      for (let i = 0; i < chay.length; i++) {
        const c = chay[i];
        if (!c.dung || !c.duong.tai(tau) || !trongKhung(D_[0], D_[1])) { c.dom.visible = c.nhan.visible = false; continue; }
        c.dom.visible = true;
        c.dom.position.set(D_[0], D_[1], D_[2]);
        const tuoi = tuoiTai(i);
        c.nhan.visible = !!tuoi;
        if (tuoi) { c.nhan.datChu(tuoi); c.nhan.position.set(D_[0], D_[1], D_[2]); }
      }
      dongHoTai(tau);
      datVat3D(tau, dt);
      datTayNam();
    }

    // Tuổi của hai anh em ở chỗ «bây giờ» của khung nhìn cắt đường thế giới (bước 7).
    function tuoiTai(i) {
      if (S.chuDe !== 'sinhdoi' || !thongTin.sd) return '';
      const { sd, g } = thongTin;
      // D_[4]: đoạn thứ mấy, D_[3]: tỉ lệ dọc đoạn
      if (i === 0) return chuCanh("canh.o-nha-nam", "ở nhà: {0} năm", [so(D_[3] * sd.T, 1)]);
      if (i === 1) { const nua = sd.T / 2; const tLab = (D_[4] + D_[3]) * nua; return chuCanh("canh.nguoi-di-nam", "người đi: {0} năm", [so(tLab / g, 1)]); }
      return '';
    }
    let soTichNay = { lab: 0, tau: 0 };
    function dongHoTai(tau) {
      if (S.chuDe !== 'dongho') return;
      let a = 0, b = 0;
      for (const t of DS_TICH.lab) if (t <= tau + 1e-9 && t > T_DH + 1e-9 - 100) a++;
      for (const t of DS_TICH.tau) if (t <= tau + 1e-9) b++;
      soTichNay = { lab: Math.max(0, a - 1), tau: Math.max(0, b - 1) };
    }

    function hud() {
      const cd = S.chuDe, b = Math.tanh(S.phi);
      const khung = cd === 'sinhdoi' ? { nha: chuCanh("canh.nguoi-o-nha-c613f0", "người ở nhà"), di: chuCanh("canh.chang-di-cua-nguoi-di", "chặng đi của người đi"), ve: chuCanh("canh.chang-ve-cua-nguoi-di", "chặng về của người đi") }[S.khungSD]
        : cd === 'muon' ? (S.khungMuon === 'muon' ? 'muon' : chuCanh("canh.mat-dat-73603d", "mặt đất")) : (S.khung === 'tau' ? chuCanh("canh.con-tau-374bd0", "con tàu") : chuCanh("canh.phong-thi-nghiem-7b4795", "phòng thí nghiệm"));
      const d = [[chuCanh("canh.khung-nhin", "Khung nhìn"), `${khung} · β = ${so(b, 3)}${cd === 'lorentz' ? chuCanh("canh.do-nhanh", " · độ nhanh {0}", [so(S.phi, 3)]) : ''}`]];
      if (cd === 'tiende') { d.push([chuCanh("canh.con-tau", "Con tàu"), `${so(S.beta, 2)} c · γ = ${so(gamma(S.beta), 3)}`]); d.push([chuCanh("canh.vong-vang-sang", "Vòng vàng sáng"), chuCanh("canh.mat-song-luc-nay-cua-khung-dang-nhin", "mặt sóng «lúc này» của khung đang nhìn")]); }
      if (cd === 'dongho') {
        d.push([chuCanh("canh.so-tich-toi-bay-gio", "Số tích tới «bây giờ»"), chuCanh("canh.phong-thi-nghiem-tren-tau", "phòng thí nghiệm {0} · trên tàu {1}", [soTichNay.lab, soTichNay.tau])]);
        d.push([chuCanh("canh.mot-tich-tren-tau-do-tu-phong-thi", "Một tích trên tàu, đo từ phòng thí nghiệm"), `γ × 2h/c = ${so(gamma(S.beta) * 2 * H_DH, 3)} (γ = ${so(gamma(S.beta), 3)})`]);
      }
      if (cd === 'dongthoi' && thongTin.tpA != null) d.push([chuCanh("canh.theo-dong-ho-cua-tau", "Theo đồng hồ của tàu"), chuCanh("canh.b-no-luc-t-a-no-luc-t", "B nổ lúc t′ = {0}, A nổ lúc t′ = {1}", [so(thongTin.tpB, 2), so(thongTin.tpA, 2)])]);
      if (cd === 'thuoc' && thongTin.Lp) d.push([chuCanh("canh.thuoc", "Thước"), chuCanh("canh.do-dai-rieng-phong-thi-nghiem-do", "độ dài riêng {0} · phòng thí nghiệm đo {1} = {2}/{3}", [so(L0, 0), so(thongTin.Lp, 3), so(L0, 0), so(gamma(S.beta), 3)])]);
      if (cd === 'lorentz') d.push([chuCanh("canh.he-so", "Hệ số"), chuCanh("canh.tau-co-do-nhanh", "γ = {0} · tàu có độ nhanh {1}", [so(gamma(S.beta), 3), so(Math.atanh(S.beta), 3)])]);
      if (cd === 'cong' && thongTin.w != null) d.push([chuCanh("canh.cong-van-toc", "Cộng vận tốc"), S.vVat >= 1 ? chuCanh("canh.c-cong-anh-sang-1-c", "{0} c cộng ánh sáng = 1 c", [so(S.beta, 2)]) : `(${so(S.beta, 2)} + ${so(S.vVat, 2)})/(1 + ${so(S.beta * S.vVat, 4)}) = ${so(thongTin.w, 4)} c`]);
      if (cd === 'sinhdoi' && thongTin.sd) {
        const { sd } = thongTin;
        d.push([chuCanh("canh.chuyen-di", "Chuyến đi"), chuCanh("canh.nam-anh-sang-o-c", "{0} năm ánh sáng ở {1} c, γ = {2}", [so(S.L, 2), so(S.betaSD, 2), so(sd.g, 3)])]);
        d.push([chuCanh("canh.gap-lai", "Gặp lại"), chuCanh("canh.o-nha-nam-nguoi-di-nam-chenh-nam", "ở nhà {0} năm · người đi {1} năm · chênh {2} năm", [so(sd.T, 2), so(sd.Tdi, 2), so(sd.T - sd.Tdi, 2)])]);
      }
      if (cd === 'muon' && thongTin.m) {
        const { m } = thongTin;
        d.push([chuCanh("canh.muon-0-998-c", "Muon 0,998 c"), chuCanh("canh.song-s-do-tu-mat-dat-di-km", "γ = {0} · sống {1} µs đo từ mặt đất · đi {2} km", [so(m.g, 2), so(m.songS * 1e6, 1), so(m.quangDuongM / 1000, 1)])]);
        d.push(['GPS · LHC', chuCanh("canh.7-2-s-moi-ngay-6-928", "7,2 µs mỗi ngày · γ ≈ 6 928")]);
      }
      return d;
    }

    cauHinh({ chuDe: S.chuDe });

    return {
      scene, capNhat, hud, cauHinh,
      datBeta, datKhung, datKhungSD, datKhungMuon,
      datVVat: (v) => { S.vVat = v; dkVVat.dat(v); S.ban = true; },
      lac: (b) => { S.lac = b; S.tLac = Math.asin(Math.max(-1, Math.min(1, S.phi / 1.15))) / 0.55; if (!b) { S.phiDich = phiDich(); } },
      goc: bay,
      trangThai: () => ({ chuDe: S.chuDe, beta: S.beta, vVat: S.vVat, khung: S.khung, phi: S.phi, betaSD: S.betaSD, L: S.L }),
      huy() { den.huy(); },
    };
  },
};
