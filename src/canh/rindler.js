import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 8 — Gia tốc trong không-thời gian (tên lửa tăng tốc đều, tọa độ Rindler).
// Sơ đồ 1+1 dựng trong 3D: X nằm ngang (trục X của three.js), cT hướng lên (trục Y), chiều y vào sâu (trục Z)
// dùng cho bề rộng tên lửa và các tấm kính. Đơn vị: năm và năm ánh sáng, c = 1, gia tốc sàn 1 g.
// «Khung nhìn» nội suy mượt tọa độ hiển thị của MỌI điểm giữa (X, T) quán tính và (ρ, τ_sàn = ρ0·η) của tên lửa.
// Bản 3: đường thế giới là ống sáng, sàn và trần có tấm kính theo bề rộng tên lửa, chân trời là một mặt sáng có
// vệt tín hiệu trượt dọc, một tên lửa nhỏ (thư viện đồ vật) nằm dọc tia «cùng lúc», đáy ở sàn. Kéo trong cảnh:
// tên lửa dọc đường thế giới (bước 1), đồng hồ thứ ba (bước 4), sự kiện phát tín hiệu (bước 5). Âm thanh: tiếng
// động cơ không đổi, tiếng tích của các đồng hồ, nốt của chớp đèn hiệu trầm dần theo dịch đỏ.
// Tham số riêng khi chụp ảnh (chỉ đọc khi app.imLang): thu=v09 | dh2 | phat | phat07 | tl.

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { so, soNghia, R0_NGAN_HA_NAS } from '../vat-ly/hang-so.js';
import { cTrenA, duHanh, duHanhCoHam, tiLeNhip, tChamSan, thoiDiemNhan } from '../vat-ly/rindler.js';
import { taoNhan, taoNenSao, taoDom, goNhanDeNhau } from '../khung/ve.js';
import { MAU_KTG } from '../khung/ktg.js';
import { taoDenCanh, taoTenLua } from '../khung/do-vat.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('rindler', khoa, goc, thamSo);

const R = String.raw;

const RHO0 = cTrenA();          // c²/a = 0,9687 năm ánh sáng
const HT = 0.4;                 // chiều cao tên lửa (năm ánh sáng): phi lý, để nhìn thấy được
const RHO1 = RHO0 + HT;
const SC = 2;                   // đơn vị hiển thị cho mỗi năm (năm ánh sáng)
const B = { x0: -3.2, x1: 6.6, t0: -4.6, t1: 4.6 };
const W = 0.75;                 // nửa bề rộng tên lửa (chiều y)
const YK = 1.6;                 // nửa bề sâu các tấm kính
const ETA_BONG = Math.acosh(RHO1 / RHO0);
const LN_TL = Math.log(tiLeNhip(RHO0, HT));

// ----- Ánh xạ hiển thị: (X, T) → (x, t) màn hình, nội suy theo K (0 quán tính, 1 tên lửa) -----
let K = 0;
const M_ = [0, 0];
function anh(X, T) {
  const xi = SC * X, ti = SC * T;
  if (K <= 1e-5) { M_[0] = xi; M_[1] = ti; return true; }
  if (X <= Math.abs(T) + 1e-9) return false;       // ngoài nêm Rindler: tên lửa không có tọa độ cho nó
  const rho = Math.sqrt(X * X - T * T), eta = Math.atanh(T / X);
  M_[0] = xi + K * (SC * rho - xi);
  M_[1] = ti + K * (SC * RHO0 * eta - ti);
  return true;
}
// Từ (ρ, η) cho gọn.
const anhR = (rho, eta) => anh(rho * Math.cosh(eta), rho * Math.sinh(eta));

// ----- Cắt đoạn theo khung (Liang–Barsky) -----
let U0 = 0, U1 = 1;
const KQ = { ax: 0, at: 0, bx: 0, bt: 0 };
function lb(p, q) {
  if (p === 0) return q >= 0;
  const r = q / p;
  if (p < 0) { if (r > U1) return false; if (r > U0) U0 = r; } else { if (r < U0) return false; if (r < U1) U1 = r; }
  return true;
}
function cat(ax, at, bx, bt) {
  U0 = 0; U1 = 1;
  const dx = bx - ax, dt = bt - at;
  if (!lb(-dx, ax - B.x0) || !lb(dx, B.x1 - ax) || !lb(-dt, at - B.t0) || !lb(dt, B.t1 - at) || U1 <= U0) return false;
  KQ.ax = ax + U0 * dx; KQ.at = at + U0 * dt; KQ.bx = ax + U1 * dx; KQ.bt = at + U1 * dt;
  return true;
}
const trong = (x, t, le = 0) => x >= B.x0 - le && x <= B.x1 + le && t >= B.t0 - le && t <= B.t1 + le;

class NetDoan {
  constructor(toiDa, { mau = 0xffffff, rong = 1.4, doMo = 1, cong = true, quang = 0, net = null } = {}) {
    this.toiDa = toiDa;
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
  them(ax, at, ay, bx, bt, by) {
    if (this.n >= this.toiDa) return;
    const a = this.bo.array, j = this.n * 6;
    a[j] = ax; a[j + 1] = at; a[j + 2] = ay; a[j + 3] = bx; a[j + 4] = bt; a[j + 5] = by;
    this.n++;
  }
  // đoạn trong tọa độ hiển thị, cắt theo khung, ở chiều sâu y
  doan(ax, at, bx, bt, y = 0) { if (cat(ax, at, bx, bt)) this.them(KQ.ax, KQ.at, y, KQ.bx, KQ.bt, y); }
  xong() { this.bo.needsUpdate = true; this.geo.instanceCount = this.n; if (this.mat.dashed) this.line.computeLineDistances(); }
}

class MatDong {
  constructor(toiDaTam, mau, doMo) {
    this.toiDa = toiDaTam;
    this.pos = new Float32Array(toiDaTam * 9);
    this.geo = new THREE.BufferGeometry();
    this.thuoc = new THREE.BufferAttribute(this.pos, 3);
    this.thuoc.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.thuoc);
    this.mesh = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color: mau, transparent: true, opacity: doMo, side: THREE.DoubleSide, depthWrite: false }));
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
  // dải: đoạn (x0, t0)–(x1, t1) kéo theo y từ ya tới yb
  dai(x0, t0, x1, t1, ya, yb) { this.tam(x0, t0, ya, x1, t1, ya, x1, t1, yb); this.tam(x0, t0, ya, x1, t1, yb, x0, t0, yb); }
  xong() { this.geo.setDrawRange(0, this.n * 3); this.thuoc.needsUpdate = true; }
}

class BoDom {
  constructor(nhom, mau, co, n) {
    this.ds = Array.from({ length: n }, () => { const d = taoDom(mau, co); d.visible = false; nhom.add(d); return d; });
    this.i = 0;
  }
  bat() { this.i = 0; }
  them(x, t, y = 0) { if (this.i >= this.ds.length || !trong(x, t)) return null; const d = this.ds[this.i++]; d.position.set(x, t, y); d.visible = true; return d; }
  xong() { for (let k = this.i; k < this.ds.length; k++) this.ds[k].visible = false; }
}
class BoNhan {
  constructor(nhom, n) {
    this.ds = Array.from({ length: n }, () => { const o = taoNhan('', ''); o.visible = false; nhom.add(o); return o; });
    this.i = 0;
  }
  bat() { this.i = 0; }
  // uu: mức ưu tiên khi các nhãn tránh nhau (goNhanDeNhau): 90 trở lên là nhãn chính, không bao giờ ẩn vì đè.
  them(html, lop, x, t, y = 0, phai = false, uu = 20) {
    if (!html || this.i >= this.ds.length || !trong(x, t, 0.2)) return null;
    const o = this.ds[this.i++];
    o._uu = uu;
    const ten = `nhan ${lop}${phai ? ' phai' : ''}`;
    if (o.element.className !== ten) o.element.className = ten;
    o.center.x = phai ? 1 : 0;
    o.datChu(html);
    o.position.set(x, t, y);
    o.visible = true;
    return o;
  }
  xong() { for (let k = this.i; k < this.ds.length; k++) this.ds[k].visible = false; }
}

// Đường cong cho bằng hàm tham số f(s) → (X, T) (năm), vẽ thành n đoạn đã ánh xạ và cắt.
const _f = [0, 0];
function cong(net, f, s0, s1, n, y = 0) {
  let co = false, px = 0, pt = 0;
  for (let i = 0; i <= n; i++) {
    f(s0 + ((s1 - s0) * i) / n);
    const ok = anh(_f[0], _f[1]);
    if (ok && co) net.doan(px, pt, M_[0], M_[1], y);
    co = ok; px = M_[0]; pt = M_[1];
  }
}

// ----- Ống sáng: đường thế giới chính vẽ thành ống phát sáng (cộng sáng), dựng lại được mỗi khung hình -----
// Mọi đường thế giới của bài nằm trong mặt phẳng z = hằng số, nên vòng tròn của ống dựng từ pháp tuyến trong mặt
// phẳng (−t', x') và trục z. Có thể ngắt thành nhiều dải (đường bị khung cắt).
const VS_ONG = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`;
const FS_ONG = /* glsl */ `
  uniform vec3 uMau; uniform float uDoMo;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float ndv = clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
    float loi = ndv * ndv * ndv;
    float tim = pow(ndv, 14.0);
    vec3 c = uMau * (0.22 + 0.95 * loi) + vec3(1.0) * tim * 0.55 * min(1.0, dot(uMau, vec3(0.33)));
    gl_FragColor = vec4(c * uDoMo, 1.0);
  }`;
const CANH_ONG = 10;
const COS_ONG = Float32Array.from({ length: CANH_ONG }, (_, j) => Math.cos((j / CANH_ONG) * Math.PI * 2));
const SIN_ONG = Float32Array.from({ length: CANH_ONG }, (_, j) => Math.sin((j / CANH_ONG) * Math.PI * 2));
class OngSang {
  constructor(toiDa, mau, { banKinh = 0.045, doSang = 2.2 } = {}) {
    this.toiDa = toiDa; this.r = banKinh;
    this.p = new Float32Array(toiDa * 3);
    this.dau = new Uint8Array(toiDa);
    const nv = toiDa * CANH_ONG;
    this.pos = new Float32Array(nv * 3); this.nor = new Float32Array(nv * 3);
    this.idx = new Uint32Array(Math.max(1, toiDa - 1) * CANH_ONG * 6);
    this.geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aNor = new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage);
    this.aIdx = new THREE.BufferAttribute(this.idx, 1).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.aPos);
    this.geo.setAttribute('normal', this.aNor);
    this.geo.setIndex(this.aIdx);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS_ONG, fragmentShader: FS_ONG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uMau: { value: new THREE.Color(mau).multiplyScalar(doSang) }, uDoMo: { value: 1 } },
    });
    this.mat.tuyenTinh = true;
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    this.n = 0; this.moi = true;
    this.geo.setDrawRange(0, 0);
  }
  bat() { this.n = 0; this.moi = true; }
  ngat() { this.moi = true; }
  them(x, t, y = 0) {
    if (this.n >= this.toiDa) return;
    const k = this.n * 3;
    this.p[k] = x; this.p[k + 1] = t; this.p[k + 2] = y;
    this.dau[this.n] = this.moi ? 1 : 0;
    this.moi = false;
    this.n++;
  }
  xong() {
    const { n, p, pos, nor, idx, dau, r } = this;
    let ni = 0;
    for (let i = 0; i < n; i++) {
      const a = i > 0 && !dau[i] ? i - 1 : i;
      const b = i + 1 < n && !dau[i + 1] ? i + 1 : i;
      let tx = p[b * 3] - p[a * 3], ty = p[b * 3 + 1] - p[a * 3 + 1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      for (let j = 0; j < CANH_ONG; j++) {
        const k = (i * CANH_ONG + j) * 3, c = COS_ONG[j], s = SIN_ONG[j];
        nor[k] = -ty * c; nor[k + 1] = tx * c; nor[k + 2] = s;
        pos[k] = p[i * 3] + r * nor[k]; pos[k + 1] = p[i * 3 + 1] + r * nor[k + 1]; pos[k + 2] = p[i * 3 + 2] + r * s;
      }
      if (i > 0 && !dau[i]) {
        const v0 = (i - 1) * CANH_ONG, v1 = i * CANH_ONG;
        for (let j = 0; j < CANH_ONG; j++) {
          const j2 = (j + 1) % CANH_ONG;
          idx[ni++] = v0 + j; idx[ni++] = v1 + j; idx[ni++] = v1 + j2;
          idx[ni++] = v0 + j; idx[ni++] = v1 + j2; idx[ni++] = v0 + j2;
        }
      }
    }
    this.geo.setDrawRange(0, ni);
    this.aPos.needsUpdate = true; this.aNor.needsUpdate = true; this.aIdx.needsUpdate = true;
  }
}

// ----- Mặt sáng: tấm kính dựng từ các dải (chân trời, «bây giờ», bề rộng sàn và trần) -----
// Viền sáng theo góc nhìn, hai mép theo chiều sâu sáng rõ, lưới mảnh vẽ trong shader; uVet > 0 thì có vệt sáng
// trượt dọc theo u (tín hiệu chạy song song với chân trời mãi mãi). u: dọc dải (0 ở gốc), v: theo chiều sâu (0..1).
const VS_MAT = /* glsl */ `
  attribute vec2 aUv;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() { vUv = aUv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`;
const FS_MAT = /* glsl */ `
  uniform vec3 uMau; uniform float uDoMo, uGio, uVet, uLuoi, uNen;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    float u = vUv.x, v = vUv.y;
    float ndv = clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
    float fr = (1.0 - ndv) * (1.0 - ndv);
    float mep = exp(-min(v, 1.0 - v) / 0.035);
    float g = abs(fract(v * 6.0 + 0.5) - 0.5) / fwidth(v * 6.0);
    float luoi = (1.0 - min(g, 1.0)) * uLuoi;
    float s = 0.5 + 0.5 * sin(u * 26.0 - uGio * 2.6);
    s = s * s; s = s * s; s = s * s; s = s * s;
    float a = (uNen + 0.22 * fr + 0.32 * mep + luoi * 0.22 + uVet * s * (0.25 + 0.4 * (1.0 - abs(v - 0.5) * 2.0)));
    gl_FragColor = vec4(uMau * a * uDoMo, 1.0);
  }`;
class MatSang {
  constructor(toiDaTam, mau, { doMo = 1, vet = 0, luoi = 0.6, nen = 0.06 } = {}) {
    this.toiDa = toiDaTam;
    this.pos = new Float32Array(toiDaTam * 9);
    this.nor = new Float32Array(toiDaTam * 9);
    this.uv = new Float32Array(toiDaTam * 6);
    this.geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aNor = new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage);
    this.aUv = new THREE.BufferAttribute(this.uv, 2).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.aPos);
    this.geo.setAttribute('normal', this.aNor);
    this.geo.setAttribute('aUv', this.aUv);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS_MAT, fragmentShader: FS_MAT, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uGio: { value: 0 }, uVet: { value: vet }, uLuoi: { value: luoi }, uNen: { value: nen } },
    });
    this.mat.tuyenTinh = true;
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.n = 0;
  }
  bat() { this.n = 0; }
  _dinh(i, x, t, y, nx, nt, u, v) {
    const k = i * 3, q = i * 2;
    this.pos[k] = x; this.pos[k + 1] = t; this.pos[k + 2] = y;
    this.nor[k] = nx; this.nor[k + 1] = nt; this.nor[k + 2] = 0;
    this.uv[q] = u; this.uv[q + 1] = v;
  }
  // dải: đoạn (x0, t0)–(x1, t1) kéo theo chiều sâu từ ya tới yb; u0, u1: toạ độ dọc dải ở hai đầu đoạn
  dai(x0, t0, x1, t1, ya, yb, u0 = 0, u1 = 1) {
    if (this.n + 2 > this.toiDa) return;
    const l = Math.hypot(x1 - x0, t1 - t0) || 1, nx = -(t1 - t0) / l, nt = (x1 - x0) / l;
    let i = this.n * 3;
    this._dinh(i++, x0, t0, ya, nx, nt, u0, 0); this._dinh(i++, x1, t1, ya, nx, nt, u1, 0); this._dinh(i++, x1, t1, yb, nx, nt, u1, 1);
    this._dinh(i++, x0, t0, ya, nx, nt, u0, 0); this._dinh(i++, x1, t1, yb, nx, nt, u1, 1); this._dinh(i++, x0, t0, yb, nx, nt, u0, 1);
    this.n += 2;
  }
  xong() { this.geo.setDrawRange(0, this.n * 3); this.aPos.needsUpdate = true; this.aNor.needsUpdate = true; this.aUv.needsUpdate = true; }
}

// Âm kéo dài tạo lại được sau khi tắt (am.giong, am.tiengOn trả về tay cầm dùng một lần).
function amKeoDai(am, loai, goc) {
  let h = null;
  return {
    dat(q, muot) { if (!h) h = am[loai]({ ...goc, ...q }); h.dat(q, muot); },
    tat(giay = 0.3) { if (h) { h.tat(giay); h = null; } },
  };
}

// Tần số nghe của một chớp đèn hiệu (phát lúc Te theo đồng hồ đèn hiệu) khi tới sàn: nhịp nhận / nhịp phát = 1 − Te/ρ0.
const TAN_SO_PHAT = 660;
const tanSoNhan = (Te) => TAN_SO_PHAT * (1 - Te / RHO0);

const KIEU_DI = [{ giaTri: 'suot', nhan: chuCanh("canh.tang-toc-suot", "Tăng tốc suốt") }, { giaTri: 'ham', nhan: chuCanh("canh.tang-toc-roi-ham", "Tăng tốc rồi hãm") }];

export default {
  id: 'rindler',
  ten: 'Gia tốc trong không-thời gian',
  moTa: 'Tên lửa 1 g: hyperbol, đồng hồ trần nhanh hơn sàn, chân trời',
  yChinh: 'Tên lửa tăng tốc đều vạch trong không-thời gian một hyperbol tiến sát nhưng không bao giờ chạm tia sáng 45°. Lưới tọa độ của phi hành đoàn cong theo; trong lưới ấy vật thả ra «rơi», ánh sáng cong, đồng hồ ở trần chạy nhanh hơn đồng hồ ở sàn, và sau lưng tên lửa có một chân trời. Tất cả xảy ra trong không-thời gian hoàn toàn phẳng.',
  mayAnh: { viTri: [6.5, 3.2, 17.5], dich: [1.7, 0, 0], fov: 40, min: 4, max: 50, hep: 0.6 },

  baiGiang: {
    mucTieu: [
      'Giải thích được vì sao tên lửa tăng tốc đều có đường thế giới là hyperbol và không bao giờ đạt tốc độ ánh sáng.',
      'Đọc được lưới tọa độ của phi hành đoàn: các đường «cùng lúc» quay quanh điểm chốt, sàn và trần là hai hyperbol.',
      'Suy ra được trên sơ đồ vì sao đồng hồ ở trần chạy nhanh hơn ở sàn theo hệ số 1 + ah/c².',
      'Nói được chân trời Rindler là gì và vì sao nó giống chân trời lỗ đen.',
      'Tính được thời gian của một chuyến du hành 1 g bằng các hàm sinh, cosh, tanh.',
    ],
    buoc: [
      {
        ten: 'Tăng tốc đều: một hyperbol',
        noiDung: R`
          Bài 7 đặt một buồng kín trong tên lửa: phi hành đoàn thấy mình nặng như trên mặt đất. Giờ vẽ tên lửa đó trong không-thời gian. Lưới trắng là một {{khung quán tính}}: trục ngang $X$ (năm ánh sáng), trục đứng $cT$ (năm). Đường hồng là **sàn** tên lửa.

          «Tăng tốc đều 1 g» nghĩa là phi hành đoàn, đo bằng gia tốc kế mang theo, **lúc nào cũng** thấy gia tốc đúng 9,81 m/s². Đó là {{gia tốc riêng}}. Nhìn từ khung quán tính, tốc độ tăng dần nhưng chậm dần lại khi gần $c$, vì cộng vận tốc kiểu Bài 6 không bao giờ vượt $c$. Kết quả là một **hyperbol**:

          $$ X^2 - c^2T^2 = \left(\frac{c^2}{a}\right)^2 $$

          Lúc $T = 0$ tên lửa đứng yên ở $X = c^2/a$. Sau đó nó tiến sát tia sáng 45° (đường vàng) nhưng không bao giờ chạm. Đó là {{chuyển động hyperbol}}.

          > [Con số] Với $a$ = 1 g: $c/a = 0{,}9687$ năm, $c^2/a = 0{,}9687$ năm ánh sáng. Nói cách khác, 1 g $\approx 1{,}03$ năm ánh sáng mỗi năm bình phương. Đó là lý do mọi con số của bài đều gọn quanh 1.

          > [Thử ngay] Các nhãn trên sàn ghi tốc độ sau mỗi nửa năm theo đồng hồ tên lửa: sau 1 năm đã 0,77 c, sau 2 năm 0,97 c. Kéo tên lửa nhỏ (đốm hồng ở đáy) dọc đường thế giới để đọc tốc độ ở từng lúc.
          > [[Nhìn thẳng|thang]] [[Nhìn chéo|cheo]]

          > [Lưu ý] Tên lửa nhỏ trên hình nằm dọc đường «cùng lúc» của phi hành đoàn, đáy ở sàn, lửa phụt về phía sau. Tiếng ù của động cơ **không đổi** suốt chuyến: thứ phi hành đoàn cảm thấy là gia tốc riêng, và nó luôn là 1 g, dù nhìn từ khung quán tính tên lửa nhanh dần lên.

          +++ Đi sâu: vì sao lại là hyperbol
          Gọi $\tau$ là thời gian riêng của phi hành đoàn và $\varphi$ là độ nhanh (Bài 6), $v/c = \tanh\varphi$. Trong khoảng $\dd\tau$ ngắn, tên lửa là một khung quán tính tức thời; nó tăng vận tốc thêm $a\,\dd\tau$ **trong khung đó**. Vì độ nhanh cộng thẳng, $\dd\varphi = a\,\dd\tau/c$, nên $\varphi = a\tau/c$.

          Vận tốc bốn chiều là $u = c\,(\cosh\varphi,\ \sinh\varphi)$. Tích phân theo $\tau$:

          $$ cT = \frac{c^2}{a}\sinh\frac{a\tau}{c}, \qquad X = \frac{c^2}{a}\cosh\frac{a\tau}{c} $$

          Dùng $\cosh^2 - \sinh^2 = 1$ được đúng phương trình hyperbol ở trên. Vận tốc nhìn từ khung quán tính là $v = c\tanh(a\tau/c)$, luôn nhỏ hơn $c$.
          +++`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ che: 'tenlua', khung: 'qt', hien: { san: true, vanToc: true, keoTL: true }, mayAnh: 'cheo' }),
        nut: { thang: (c) => c.goc('thang'), cheo: (c) => c.goc('cheo') },
        thuThach: {
          de: 'Kéo tên lửa dọc đường thế giới tới lúc nó đạt **0,9 c** so với khung quán tính (lệch dưới 0,01 c).',
          kiem: (c) => Math.abs(c.vanToc() - 0.9) <= 0.01,
          giu: 0.6,
          goiY: R`$v = c\tanh(a\tau/c)$. Ô số liệu và nhãn cạnh tên lửa ghi $v$. Tốc độ 0,9 c đến sau khoảng 1,4 năm trên tàu, đúng lúc đồng hồ Trái Đất chỉ 2 năm.`,
        },
      },
      {
        ten: 'Lưới của phi hành đoàn',
        noiDung: R`
          Thêm **trần** tên lửa (xanh lam), cao $h$ = 0,4 năm ánh sáng so với sàn. Muốn tên lửa cứng (sàn và trần luôn cách nhau đúng $h$ theo thước của phi hành đoàn), trần phải vạch một hyperbol **khác**, cùng tâm:

          $$ X^2 - c^2T^2 = \left(\frac{c^2}{a} + h\right)^2 $$

          Các tia xanh lục mờ đi qua gốc là những đường «cùng lúc» của phi hành đoàn, mỗi tia cách nhau 0,25 năm theo đồng hồ sàn. Mỗi tia là trục $x'$ của khung quán tính tức thời của tên lửa (Bài 6): càng về sau, tên lửa càng nhanh nên tia càng nghiêng. Tất cả các tia **quay quanh cùng một điểm chốt** ở gốc. Tấm kính xanh lục sáng là «bây giờ» của phi hành đoàn, đang quay theo.

          Hyperbol và tia cùng tạo thành lưới {{tọa độ Rindler}} $(\rho,\ \eta)$: $\rho$ là «độ cao» (hằng số trên mỗi hyperbol), $\eta$ là «góc» của tia.

          > [Lưu ý] Tên lửa cao 0,4 năm ánh sáng là phi lý; chọn vậy để nhìn thấy được. Tên lửa thật cao chừng 30 m thì hiệu ứng nhỏ hơn cỡ một trăm nghìn tỉ lần, nhưng vẫn có thật và đo được (bước 4).

          > [Thử ngay] Đổi sang khung tên lửa: lưới cong thành ô chữ nhật, sàn và trần dựng đứng, tia «cùng lúc» nằm ngang.
          > [[Khung tên lửa|tl]] [[Khung quán tính|qt]]

          Để giữ khoảng cách không đổi, **sàn phải tăng tốc mạnh hơn trần**: gia tốc riêng ở độ cao $\rho$ là $c^2/\rho$. Sàn chịu 1 g thì trần chỉ chịu $\rho_0/(\rho_0 + h) \approx 0{,}71$ g. Đây không phải chuyện riêng của tên lửa này: thuyết tương đối không cho vật cứng nào tăng tốc đều ở mọi điểm.`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ che: 'tenlua', khung: 'qt', hien: { san: true, tran: true, luoiR: true, nay: true }, mayAnh: 'cheo' }),
        nut: { tl: (c) => c.datKhung('tl'), qt: (c) => c.datKhung('qt') },
      },
      {
        ten: 'Thả quả bóng: trọng lực từ lưới cong',
        noiDung: R`
          Lúc $\eta = 0$ (tên lửa đang đứng yên tức thời), phi hành đoàn thả một quả bóng từ trần. Từ lúc đó không còn gì đẩy quả bóng, nên trong khung quán tính nó **đứng yên mãi**: đường thế giới thẳng đứng $X = \rho_0 + h$ (đường trắng). Sàn tên lửa thì vẫn tăng tốc, lao tới và đón lấy quả bóng lúc

          $$ cT = \sqrt{(\rho_0 + h)^2 - \rho_0^2} \approx 0{,}967 \text{ năm} $$

          theo khung quán tính, tức $0{,}85$ năm theo đồng hồ sàn.

          > [Thử ngay] Đổi sang khung tên lửa: sàn đứng yên, còn quả bóng **cong về phía sàn**, nhanh dần. Phi hành đoàn thấy quả bóng rơi y như trên Trái Đất.
          > [[Khung tên lửa|tl]] [[Khung quán tính|qt]] [[Nhìn thẳng|thang]]

          Cùng một đường thế giới, thẳng trong lưới này, cong trong lưới kia. «Lực» kéo quả bóng xuống không đến từ đâu cả: nó chỉ là hệ quả của việc **chọn lưới tọa độ cong** gắn với tên lửa. Đây là ý của Einstein ở Bài 7, giờ vẽ thành hình: trọng lực trong buồng là thứ đổi được bằng cách đổi lưới.

          > [Hiểu sai thường gặp] «Đường thế giới của quả bóng cong đi khi đổi khung.» Không. Đường thế giới là tập hợp sự kiện, không đổi. Chỉ tọa độ ta gắn cho các sự kiện là đổi, nên hình vẽ của đường đổi theo.`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ che: 'tenlua', khung: 'qt', hien: { san: true, tran: true, luoiR: true, bong: true, nay: true }, mayAnh: 'cheo' }),
        nut: { tl: (c) => c.datKhung('tl'), qt: (c) => c.datKhung('qt'), thang: (c) => c.goc('thang') },
      },
      {
        ten: 'Đồng hồ trên trần chạy nhanh hơn',
        noiDung: R`
          Đồng hồ ở sàn phát một chớp sáng mỗi 0,25 năm (đường vàng đi lên 45°). Chấm hồng: các tích của đồng hồ sàn. Chấm xanh lam: các tích của đồng hồ trần, cũng mỗi 0,25 năm **theo đồng hồ trần**. Chấm vàng: lúc trần nhận chớp sáng.

          Tia sáng đi từ sàn lên trần mất cùng một «góc» $\Delta\eta$ dù phát lúc nào, nên trần nhận các chớp **cách đều** theo $\eta$, như sàn phát. Nhưng thời gian riêng dọc hyperbol độ cao $\rho$ là $\tau = \rho\,\eta/c$: cùng một $\Delta\eta$, đồng hồ trần đếm được nhiều hơn đồng hồ sàn đúng

          $$ \frac{\Delta\tau_{\text{trần}}}{\Delta\tau_{\text{sàn}}} = \frac{\rho_0 + h}{\rho_0} = 1 + \frac{ah}{c^2} \approx 1{,}413 $$

          Trong hình: 0,25 năm của sàn ứng với 0,353 năm của trần. Đồng hồ trên cao chạy nhanh hơn; ánh sáng đi lên tới nơi thưa hơn, tức đỏ hơn.

          > [Thử ngay] Khung tên lửa: tia sáng **cong**, và chấm xanh lam trên trần dày hơn chấm hồng trên sàn. Kéo **đồng hồ thứ ba** (đốm tím trên trục ngang) lên cao hay xuống thấp: chấm tím của nó dày lên hay thưa đi theo đúng tỉ số $\rho/\rho_0$.
          > [[Khung tên lửa|tl]] [[Khung quán tính|qt]]

          > [Lưu ý] Về âm thanh: mỗi đồng hồ tích một tiếng sau mỗi 0,25 năm theo chính nó (sàn tích trầm, trần tích cao hơn, đồng hồ thứ ba cao nhất). Nghe được trần tích dày hơn sàn. Trên hình, 1 năm của đồng hồ sàn kéo dài khoảng 2,4 giây.

          > [Lịch sử] Pound và Rebka (1960) bắn tia gamma lên xuống tháp cao 22,5 m ở Đại học Harvard. Theo nguyên lý tương đương, đứng trên mặt đất giống ở trong tên lửa 1 g, nên tần số phải lệch $gh/c^2 = 9{,}81 \times 22{,}5/(2{,}998 \times 10^8)^2 \approx 2{,}46 \times 10^{-15}$. Họ đo được đúng cỡ đó. Bài 9 đi tiếp với đồng hồ trong trọng lực thật.

          +++ Đi sâu: vì sao Δη không đổi, và τ = ρη
          Đặt $c = 1$. Dùng tọa độ ánh sáng $u = T - X$, $v = T + X$. Trên hyperbol độ cao $\rho$: $X = \rho\cosh\eta$, $T = \rho\sinh\eta$ nên $u = -\rho e^{-\eta}$ và $v = \rho e^{\eta}$.

          1. Tia sáng đi về phía $+X$ có $u$ không đổi.
          2. Phát từ sàn lúc $\eta_1$: $u = -\rho_0 e^{-\eta_1}$. Tới trần khi $-\rho_1 e^{-\eta_2} = -\rho_0 e^{-\eta_1}$, tức $\eta_2 = \eta_1 + \ln(\rho_1/\rho_0)$.
          3. Vậy mọi tia đều mất cùng $\Delta\eta = \ln(\rho_1/\rho_0)$: hai chớp phát cách nhau $\delta\eta$ thì tới nơi cũng cách nhau $\delta\eta$.
          4. Thời gian riêng dọc hyperbol: $\dd\tau^2 = \dd T^2 - \dd X^2 = \rho^2(\cosh^2\eta - \sinh^2\eta)\,\dd\eta^2 = \rho^2\dd\eta^2$, nên $\tau = \rho\,\eta$.
          5. Sàn: $\delta\tau_0 = \rho_0\,\delta\eta$. Trần: $\delta\tau_1 = \rho_1\,\delta\eta$. Tỉ số $\rho_1/\rho_0 = 1 + h/\rho_0 = 1 + ah/c^2$ với $\rho_0 = c^2/a$.
          +++`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ che: 'tenlua', khung: 'qt', hien: { san: true, tran: true, xung: true, vach: true, dongHo3: true }, mayAnh: 'cheo' }),
        nut: { tl: (c) => c.datKhung('tl'), qt: (c) => c.datKhung('qt') },
        thuThach: {
          de: 'Kéo đồng hồ thứ ba tới độ cao mà nó chạy **nhanh gấp đôi** đồng hồ sàn (lệch dưới 0,05).',
          kiem: (c) => Math.abs(c.tiLeDongHo3() - 2) <= 0.05,
          giu: 0.6,
          goiY: R`Tỉ số nhịp là $\rho/\rho_0$ với $\rho_0 = 0{,}97$ năm ánh sáng. Gấp đôi nghĩa là cách điểm chốt xa gấp đôi sàn, chỗ gia tốc riêng chỉ còn 0,5 g.`,
        },
      },
      {
        ten: 'Chân trời sau lưng tên lửa',
        noiDung: R`
          Tấm kính đỏ cam nghiêng 45° là mặt $cT = X$. Mọi tín hiệu phát ra **sau** mặt này (phía trên nó) đi với tốc độ ánh sáng cũng không bao giờ đuổi kịp tên lửa, chừng nào tên lửa còn tăng tốc. Phi hành đoàn không bao giờ thấy được gì ở đó. Mặt này là {{chân trời Rindler}}.

          Để thấy rõ, phi hành đoàn thả một **đèn hiệu** qua cửa sàn lúc $\eta = 0$. Đèn hiệu đứng yên trong khung quán tính (đường cam), cứ 0,1 năm theo đồng hồ của nó lại phát một chớp về phía tên lửa.

          - Chớp phát lúc 0,5 năm tới sàn lúc 0,70 năm (đồng hồ sàn); chớp phát lúc 0,9 năm tới sàn lúc 2,56 năm.
          - Đèn hiệu đi qua chân trời lúc 0,9687 năm. Các chớp phát sau đó (đỏ, nét mờ) chạy song song với chân trời mãi mãi, không bao giờ tới.

          > [Thử ngay] Khung tên lửa: đèn hiệu rơi về phía chân trời (dồn về $\rho = 0$), **chậm dần**, không bao giờ qua được; các chớp tới thưa dần, tức đỏ dần, rồi tắt. Phi hành đoàn không bao giờ thấy nó qua chân trời, dù với chính đèn hiệu, việc đi qua chẳng có gì đặc biệt.
          > [[Khung tên lửa|tl]] [[Khung quán tính|qt]]

          > [Thử ngay] Ở khung quán tính, kéo **sự kiện phát** (đốm vàng trên đường cam) lên xuống: tia vàng là tín hiệu của bạn. Nếu tên lửa rời Trái Đất lúc $T = 0$ thì đường cam cũng chính là Trái Đất: thư gửi từ nhà sau 0,97 năm không bao giờ tới được phi hành đoàn.

          > [Lưu ý] Về âm thanh: mỗi chớp đèn hiệu tới sàn là một nốt. Tần số nốt bằng 660 Hz nhân với tỉ số nhịp nhận trên nhịp phát, $1 - T_e/\rho_0$: các nốt **thưa dần và trầm dần**, đúng như ánh sáng bị dịch về phía đỏ. Đây là quy đổi cho tai nghe được, không phải tần số thật của ánh sáng.

          Đó đúng là hình ảnh một vật rơi vào lỗ đen nhìn từ xa (Bài 16): chậm dần, đỏ dần, mờ dần ở chân trời. Chân trời ở đây không phải là một vật hay một bức tường: nó do chuyển động của người quan sát tạo ra. Tên lửa ngừng tăng tốc thì chân trời biến mất.`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ che: 'tenlua', khung: 'qt', hien: { san: true, tran: true, chanTroi: true, den: true, nay: true, phat: true }, mayAnh: 'cheo' }),
        nut: { tl: (c) => c.datKhung('tl'), qt: (c) => c.datKhung('qt') },
        thuThach: {
          de: 'Kéo sự kiện phát lên đường cam để phát một tín hiệu mà tên lửa **không bao giờ nhận được**.',
          kiem: (c) => c.tinHieuKhongToi(),
          giu: 0.6,
          goiY: 'Tín hiệu đi 45° sang phải. Nó đuổi kịp tên lửa chỉ khi được phát ở phía dưới mặt chân trời cT = X. Đường cam cắt chân trời lúc 0,97 năm.',
        },
      },
      {
        ten: 'Nguyên lý tương đương, và giới hạn của nó',
        noiDung: R`
          Gom lại: đứng trên mặt đất giống hệt ở trong tên lửa 1 g. Trong cả hai, vật thả ra rơi, ánh sáng cong, đồng hồ trên cao chạy nhanh hơn. Đó là {{nguyên lý tương đương}} của Bài 7, giờ có đủ hình không-thời gian.

          Nhưng hãy chú ý: **không-thời gian ở cả bài này vẫn phẳng**. Lưới trắng quán tính vẫn vẽ được khắp nơi, đường thẳng vẫn là đường thẳng. Mọi hiệu ứng «trọng lực» chỉ là do lưới của tên lửa cong.

          > [Thử ngay] Chuyển qua lại giữa hai lưới. Cùng một hình học, hai cách gắn tọa độ.
          > [[Khung tên lửa|tl]] [[Khung quán tính|qt]] [[Nhìn thẳng|thang]] [[Nhìn chéo|cheo]]

          Trọng lực thật của một hành tinh khác ở chỗ: **không có lưới quán tính nào xoá được nó ở mọi nơi cùng lúc**.

          - Trong tên lửa, mọi vật thả ra đều rơi song song, cùng hướng. Chuyển sang khung quán tính là hết rơi, ở mọi nơi.
          - Quanh Trái Đất, quả bóng ở Hà Nội rơi về tâm, quả bóng ở Buenos Aires cũng rơi về tâm, tức gần như ngược chiều. Một khung rơi tự do xoá được trọng lực ở Hà Nội thì không xoá được ở Buenos Aires.

          Chỗ không xoá được đó là {{độ cong}} của không-thời gian, lộ ra qua {{lực thủy triều}}. Bài 10 và Bài 12 làm rõ điều này.

          > [Tóm lại] Nguyên lý tương đương chỉ đúng **trong vùng đủ nhỏ**. Trong vùng nhỏ, trọng lực bị xoá được; ở quy mô lớn thì không, và đó là trọng lực thật.`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ che: 'tenlua', khung: 'tl', hien: { san: true, tran: true, luoiR: true, bong: true, xung: true, nay: true }, mayAnh: 'cheo' }),
        nut: { tl: (c) => c.datKhung('tl'), qt: (c) => c.datKhung('qt'), thang: (c) => c.goc('thang'), cheo: (c) => c.goc('cheo') },
      },
      {
        ten: 'Du hành 1 g: tới tâm Ngân Hà trong một đời người',
        noiDung: R`
          Giờ dùng hyperbol để tính một chuyến đi. Tên lửa tăng tốc 1 g suốt; $\tau$ là số năm trôi qua **trên tàu**:

          $$ cT = \frac{c^2}{a}\sinh\frac{a\tau}{c}, \qquad v = c\tanh\frac{a\tau}{c} $$

          $$ d = \frac{c^2}{a}\left(\cosh\frac{a\tau}{c} - 1\right) $$

          | Trên tàu $\tau$ | Trái Đất $T$ | Quãng đường $d$ | Tốc độ $v$ |
          |---|---|---|---|
          | 1 năm | 1,19 năm | 0,56 năm ánh sáng | 0,775 c |
          | 2 năm | 3,76 năm | 2,91 năm ánh sáng | 0,968 c |
          | 3 năm | 10,7 năm | 9,77 năm ánh sáng | 0,9959 c |
          | 5 năm | 84,5 năm | 83,5 năm ánh sáng | 0,99993 c |
          | 10 năm | 14 736 năm | 14 735 năm ánh sáng | gần như c |

          Sau vài năm, $\sinh$ và $\cosh$ tăng theo hàm mũ: mỗi năm trên tàu thêm, quãng đường nhân lên gần 2,8 lần.

          > [Con số] **Tới tâm Ngân Hà**, cách 26 700 năm ánh sáng, tăng tốc nửa đường đầu rồi hãm nửa đường sau để tới nơi đứng yên: trên tàu chỉ trôi qua khoảng **19,8 năm**. Trên Trái Đất trôi qua khoảng **26 700 năm**. Nếu không hãm (bay vụt qua), chỉ cần 10,6 năm trên tàu.

          > [Thử ngay] Kéo **Số năm trên tàu**, hoặc bấm:
          > [[Tới tâm Ngân Hà|ngan]] [[Tới Alpha Centauri|alpha]] [[Tăng tốc suốt 5 năm|nam5]]

          > [Lưu ý] Hình chỉ là tỉ lệ thu nhỏ để vừa khung: trục ngang và trục đứng cùng một thước (ánh sáng vẫn 45°), thước đó đổi theo chuyến đi. Không tính tới nhiên liệu: một tên lửa thật không mang nổi năng lượng cho chuyến đi như thế.

          Thời gian riêng của người trên tàu là «độ dài» của đường hồng: chỉ 19,8 năm, trong khi trên Trái Đất trôi qua khoảng 26 700 năm. Một con tàu đi thẳng đều nối đúng hai sự kiện khởi hành và tới nơi sẽ có thời gian riêng dài hơn đường hồng, đúng như Bài 6: giữa hai sự kiện, đường thẳng cho thời gian riêng dài nhất.`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ che: 'duhanh', tauTong: duHanhCoHam(R0_NGAN_HA_NAS).tau, kieu: 'ham', mayAnh: 'thang' }),
        nut: {
          ngan: (c) => c.cauHinh({ tauTong: duHanhCoHam(R0_NGAN_HA_NAS).tau, kieu: 'ham' }),
          alpha: (c) => c.cauHinh({ tauTong: duHanhCoHam(4.37).tau, kieu: 'ham' }),
          nam5: (c) => c.cauHinh({ tauTong: 5, kieu: 'suot' }),
        },
      },
    ],
    congThuc: [
      { ten: 'Đường thế giới tăng tốc đều', tex: R`X^2 - c^2T^2 = \left(\frac{c^2}{a}\right)^2`, y: 'Hyperbol tiệm cận tia sáng 45°. Với 1 g, c²/a = 0,9687 năm ánh sáng.' },
      { ten: 'Theo thời gian trên tàu', tex: R`cT = \frac{c^2}{a}\sinh\frac{a\tau}{c},\quad X = \frac{c^2}{a}\cosh\frac{a\tau}{c},\quad v = c\tanh\frac{a\tau}{c}`, y: '$\\tau$: thời gian riêng của phi hành đoàn. Độ nhanh tăng đều: $\\varphi = a\\tau/c$.' },
      { ten: 'Tọa độ Rindler', tex: R`X = \rho\cosh\eta,\qquad cT = \rho\sinh\eta,\qquad \tau = \rho\,\eta/c`, y: '$\\rho$: độ cao (hằng số trên mỗi hyperbol); $\\eta$: góc của đường «cùng lúc». Gia tốc riêng ở độ cao $\\rho$ là $c^2/\\rho$.' },
      { ten: 'Đồng hồ trần và sàn', tex: R`\frac{\Delta\tau_{\text{trần}}}{\Delta\tau_{\text{sàn}}} = 1 + \frac{ah}{c^2}`, y: 'Trên Trái Đất: $gh/c^2$, khoảng $1{,}1 \\times 10^{-16}$ cho mỗi mét độ cao.' },
    ],
    cauHoi: [
      {
        hoi: 'Một tên lửa tăng tốc đều 1 g mãi mãi. Nhìn từ Trái Đất, điều gì xảy ra với tốc độ của nó?',
        chon: ['Tăng đều 9,8 m/s mỗi giây, vượt c sau khoảng một năm', 'Tăng dần, tiến sát c nhưng không bao giờ đạt', 'Tăng tới c rồi giữ nguyên', 'Giảm dần vì khối lượng tăng'],
        dung: 1,
        giai: R`$v = c\tanh(a\tau/c)$ luôn nhỏ hơn $c$. Phi hành đoàn vẫn thấy gia tốc đều 1 g, nhưng nhìn từ Trái Đất, mỗi lần tăng vận tốc phải cộng theo công thức cộng vận tốc của Bài 6, nên không bao giờ vượt $c$. Đáp án đầu là cộng kiểu Newton.`,
      },
      {
        hoi: 'Trong tên lửa tăng tốc, đồng hồ ở trần và đồng hồ ở sàn: đồng hồ nào chạy nhanh hơn, theo ai?',
        chon: ['Đồng hồ sàn nhanh hơn, vì sàn tăng tốc mạnh hơn', 'Đồng hồ trần nhanh hơn; mọi người trong tên lửa đều đồng ý', 'Hai đồng hồ như nhau vì cùng một tên lửa', 'Tuỳ người nhìn ở trần hay ở sàn'],
        dung: 1,
        giai: R`Trần nhận chớp sáng của sàn thưa hơn, và sàn nhận chớp sáng của trần dày hơn: cả hai cùng kết luận trần chạy nhanh hơn, theo hệ số $1 + ah/c^2$. Khác với giãn thời gian do chuyển động đều (đối xứng), ở đây hai đồng hồ đứng yên với nhau nên so sánh được không mập mờ.`,
      },
      {
        hoi: 'Quả bóng thả từ trần tên lửa. Trong khung quán tính, quả bóng làm gì?',
        chon: ['Rơi xuống sàn với gia tốc 1 g', 'Đứng yên (hoặc đi thẳng đều); chính sàn lao tới đón nó', 'Bay ngược lên', 'Đi theo một hyperbol khác'],
        dung: 1,
        giai: 'Sau khi thả, không có gì đẩy quả bóng nên đường thế giới của nó thẳng. «Rơi» chỉ xuất hiện khi mô tả bằng lưới tọa độ của tên lửa.',
      },
      {
        hoi: 'Vì sao phi hành đoàn không bao giờ thấy đèn hiệu họ thả ra đi qua chân trời?',
        chon: ['Vì đèn hiệu bị phá huỷ trước khi tới chân trời', 'Vì ánh sáng phát từ chỗ chân trời trở về sau không bao giờ đuổi kịp tên lửa đang tăng tốc', 'Vì chân trời là một bức tường vật chất', 'Vì đèn hiệu dừng lại ở chân trời'],
        dung: 1,
        giai: 'Đèn hiệu đi qua chân trời sau chừng một năm (0,97 năm) theo đồng hồ của nó, không có gì đặc biệt. Nhưng tín hiệu phát từ đó chạy song song với chân trời, không bao giờ tới tên lửa. Các tín hiệu phát ngay trước đó tới nơi ngày càng muộn và thưa: phi hành đoàn thấy đèn hiệu chậm dần, đỏ dần.',
      },
      {
        hoi: 'Trên tàu tăng tốc 1 g suốt 3 năm (không hãm). Khi đó tàu cách Trái Đất bao xa, và trên Trái Đất đã qua bao lâu?',
        chon: ['3 năm ánh sáng, 3 năm', '9,77 năm ánh sáng, 10,7 năm', '1,5 năm ánh sáng, 3,4 năm', '84 năm ánh sáng, 85 năm'],
        dung: 1,
        giai: R`$a\tau/c = 3/0{,}9687 \approx 3{,}10$. $cT = 0{,}9687 \sinh 3{,}10 \approx 10{,}7$ năm; $d = 0{,}9687(\cosh 3{,}10 - 1) \approx 9{,}77$ năm ánh sáng. Đáp án cuối là của 5 năm.`,
      },
      {
        hoi: 'Nguyên lý tương đương nói đứng trên mặt đất giống ở trong tên lửa 1 g. Vậy trọng lực của Trái Đất có phải chỉ là do «chọn lưới cong» như trong tên lửa không?',
        dap: 'Chỉ trong vùng nhỏ. Trong tên lửa, mọi vật rơi song song; một khung quán tính duy nhất xoá được «trọng lực» ở mọi nơi, vì không-thời gian vẫn phẳng. Quanh Trái Đất, vật ở hai phía rơi về tâm theo hai hướng ngược nhau, và vật ở cao, ở thấp rơi với gia tốc khác nhau. Không lưới quán tính nào xoá được trọng lực ở mọi nơi cùng lúc. Phần còn lại đó (lực thủy triều) là độ cong thật của không-thời gian.',
      },
    ],
    docThem: [
      'C. W. Misner, K. S. Thorne và J. A. Wheeler, *Gravitation* (1973), chương 6: người quan sát tăng tốc, tọa độ của người quan sát tăng tốc đều.',
      'B. Schutz, *A First Course in General Relativity* (bản 2, 2009), chương 5: vì sao trọng lực không thể là lực trong không-thời gian phẳng; tháp Pound–Rebka trong tên lửa.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 5 và 6: chuyển động tăng tốc đều, nguyên lý tương đương, dịch chuyển đỏ hấp dẫn.',
      'Pound và Rebka 1960, Phys. Rev. Lett. 4, 337: đo dịch chuyển đỏ hấp dẫn trên tháp 22,5 m.',
    ],
    thuatNgu: [
      { vi: 'gia tốc riêng', en: 'proper acceleration', nghia: 'Gia tốc mà người trên vật đo được bằng gia tốc kế mang theo. Vật rơi tự do có gia tốc riêng bằng 0; người đứng trên mặt đất có gia tốc riêng 1 g hướng lên.' },
      { vi: 'chuyển động hyperbol', en: 'hyperbolic motion', nghia: R`Chuyển động với gia tốc riêng không đổi. Đường thế giới là hyperbol $X^2 - c^2T^2 = (c^2/a)^2$, tiệm cận tia sáng.` },
      { vi: 'tọa độ Rindler', en: 'Rindler coordinates', nghia: R`Tọa độ $(\rho,\ \eta)$ gắn với một họ người quan sát tăng tốc đều: $X = \rho\cosh\eta$, $cT = \rho\sinh\eta$. Không-thời gian vẫn phẳng, chỉ lưới tọa độ cong.` },
      { vi: 'chân trời Rindler', en: 'Rindler horizon', nghia: 'Mặt cT = X: tín hiệu phát sau mặt này không bao giờ tới được người quan sát tăng tốc đều. Do chuyển động của người quan sát tạo ra, biến mất khi ngừng tăng tốc.' },
    ],
  },

  conSo: [
    '**0,9687 năm**: c/a với a = 1 g; tức 1 g ≈ 1,03 năm ánh sáng mỗi năm bình phương.',
    '**0,775 c** sau 1 năm trên tàu, **0,968 c** sau 2 năm.',
    '**2,46 × 10⁻¹⁵**: chênh lệch nhịp đồng hồ giữa đỉnh và chân tháp 22,5 m (Pound và Rebka 1960).',
    '**19,8 năm** trên tàu để tới tâm Ngân Hà (có hãm), trong khi Trái Đất trôi qua khoảng 26 700 năm.',
  ],
  hieuDung: '**Không-thời gian trong bài này hoàn toàn phẳng.** Quả bóng «rơi», ánh sáng «cong», đồng hồ trên cao chạy nhanh: tất cả chỉ là hệ quả của lưới tọa độ cong gắn với tên lửa. Trọng lực thật (của một hành tinh) khác ở chỗ không lưới nào xoá được nó ở mọi nơi cùng lúc; phần không xoá được đó là độ cong.',
  nguon: 'Gia tốc trọng trường chuẩn 9,80665 m/s² và năm Julius 365,25 ngày. Tháp Harvard 22,5 m: Pound và Rebka 1960, Phys. Rev. Lett. 4, 337. Khoảng cách tới tâm Ngân Hà 26 700 năm ánh sáng: GRAVITY 2019–2021 (như Bài 2). Alpha Centauri 4,37 năm ánh sáng. Mọi con số trong bài được tính lại trong kiem-tra/kiem-rindler.mjs.',
  hinh: { quang: 0.38, nguong: 0.9 },
  css: '.nhan.phai { margin-left: -9px; text-align: right; } .nhan.cam { color: #ffb86b; } .nhan.do { color: #ff8a73; } .nhan.luc { color: #8fe3a8; } .nhan.tim { color: #c8aaff; }',

  tao(app) {
    const scene = new THREE.Scene();
    const am = app.am, tt = app.tt;
    K = 0;
    const TAU_MIN = -1.6, TAU_MAX = 2.3;   // vòng chạy của «bây giờ» theo đồng hồ sàn (năm)
    scene.add(taoNenSao({ soSao: 1500, hat: 83, doSang: 0.45 }));
    const denCanh = taoDenCanh(scene, { renderer: app.renderer, huongChinh: [3, 6, 9], huongVien: [-6, 2, -5] });
    const goc = new THREE.Group();
    scene.add(goc);

    const S = {
      che: 'tenlua', khung: 'qt', kDich: 0,
      hien: { san: true },
      tauTong: 19.81, kieu: 'ham',
      eta: 0, ban: true,
      tuDieu: false,                 // bước 1: người học đã kéo tên lửa, «bây giờ» đứng yên ở đó
      rhoD: 1.75, daKeoDH: false,    // đồng hồ thứ ba (bước 4): độ cao ρ
      teThu: 0.5, daKeoPhat: false,  // tín hiệu người học phát từ đường cam (bước 5): thời điểm phát
    };
    const MAU_TIM = 0xc8aaff, MAU_CAM = 0xffb86b;
    const sang = (m, k) => new THREE.Color(m).multiplyScalar(k);

    const net = {
      luoiQT: new NetDoan(2600, { mau: 0xffffff, rong: 1, doMo: 0.06, cong: false }),
      luoiQT2: new NetDoan(900, { mau: 0xffffff, rong: 1.2, doMo: 0.15, cong: false }),
      trucQT: new NetDoan(200, { mau: 0xffffff, rong: 1.6, doMo: 0.45, cong: false }),
      luoiR: new NetDoan(1800, { mau: MAU_KTG.thoiGian, rong: 1, doMo: 0.17 }),
      luoiR2: new NetDoan(600, { mau: MAU_KTG.thoiGian, rong: 1.5, doMo: 0.42 }),
      tiaR: new NetDoan(60, { mau: MAU_KTG.hienTai, rong: 1, doMo: 0.2 }),
      tiaR2: new NetDoan(20, { mau: MAU_KTG.hienTai, rong: 1.5, doMo: 0.45 }),
      sang45: new NetDoan(20, { mau: MAU_KTG.anhSang, rong: 1.8, doMo: 0.6, quang: 0.08 }),
      vien: new NetDoan(700, { mau: 0xffffff, rong: 1, doMo: 0.16, cong: false }),
      xung: new NetDoan(1200, { mau: MAU_KTG.anhSang, rong: 1.6, doMo: 0.75, quang: 0.05 }),
      xungDen: new NetDoan(1200, { mau: MAU_KTG.anhSang, rong: 1.2, doMo: 0.45 }),
      xungMat: new NetDoan(800, { mau: MAU_KTG.do, rong: 1.1, doMo: 0.2 }),
      chanTroi: new NetDoan(20, { mau: MAU_KTG.do, rong: 1.2, doMo: 0.55 }),
      chanTroiLoi: new NetDoan(8, { mau: MAU_KTG.do, rong: 2.6, doMo: 1, quang: 0.14 }),
      nay: new NetDoan(12, { mau: MAU_KTG.hienTai, rong: 2.2, doMo: 0.9, quang: 0.08 }),
      tinHieu: new NetDoan(40, { mau: MAU_KTG.anhSang, rong: 2.8, doMo: 1, quang: 0.14 }),
      tinHieuMat: new NetDoan(40, { mau: MAU_KTG.do, rong: 2.2, doMo: 0.9, quang: 0.1 }),
      // chuyến du hành
      dhSang: new NetDoan(4, { mau: MAU_KTG.anhSang, rong: 1.6, doMo: 0.6, quang: 0.06 }),
      dhLuoi: new NetDoan(60, { mau: 0xffffff, rong: 1, doMo: 0.12, cong: false }),
    };
    for (const k in net) goc.add(net[k].line);
    const ong = {
      san: new OngSang(320, MAU_KTG.hong, { banKinh: 0.04, doSang: 1.7 }),
      tran: new OngSang(320, MAU_KTG.thoiGian, { banKinh: 0.04, doSang: 1.7 }),
      bong: new OngSang(120, 0xffffff, { banKinh: 0.03, doSang: 1.2 }),
      den: new OngSang(200, MAU_CAM, { banKinh: 0.032, doSang: 1.3 }),
      dh3: new OngSang(320, MAU_TIM, { banKinh: 0.035, doSang: 1.5 }),
      dat: new OngSang(8, 0xffffff, { banKinh: 0.04, doSang: 0.95 }),
      tau: new OngSang(400, MAU_KTG.hong, { banKinh: 0.055, doSang: 2.4 }),
    };
    for (const k in ong) goc.add(ong[k].mesh);
    const mat = {
      san: new MatSang(320, sang(MAU_KTG.hong, 0.55), { nen: 0.05, luoi: 0.5 }),
      tran: new MatSang(320, sang(MAU_KTG.thoiGian, 0.55), { nen: 0.05, luoi: 0.5 }),
      chanTroi: new MatSang(8, sang(MAU_KTG.do, 1.0), { nen: 0.06, vet: 1, luoi: 0.3 }),
      chanTroiQK: new MatSang(8, sang(MAU_KTG.do, 0.45), { nen: 0.05, vet: 0, luoi: 0.2 }),
      nay: new MatSang(4, sang(MAU_KTG.hienTai, 0.9), { nen: 0.07, luoi: 0.4 }),
    };
    for (const k in mat) goc.add(mat[k].mesh);
    const dom = {
      hong: new BoDom(goc, sang(MAU_KTG.hong, 1.5), 0.3, 60),
      xanh: new BoDom(goc, sang(MAU_KTG.thoiGian, 1.5), 0.3, 60),
      tim: new BoDom(goc, sang(MAU_TIM, 1.5), 0.3, 60),
      vang: new BoDom(goc, sang(MAU_KTG.anhSang, 1.6), 0.28, 40),
      trang: new BoDom(goc, sang(0xffffff, 1.3), 0.3, 40),
      cam: new BoDom(goc, sang(MAU_CAM, 1.2), 0.17, 30),
      to: new BoDom(goc, sang(0xffffff, 1.8), 0.6, 8),
    };
    const nhan = new BoNhan(goc, 44);
    // Vật chạy theo «bây giờ» của phi hành đoàn
    const domBong = taoDom(sang(0xffffff, 2), 0.62), domDen = taoDom(sang(MAU_CAM, 2.4), 0.7);
    const domXung = Array.from({ length: 24 }, () => { const d = taoDom(sang(MAU_KTG.anhSang, 2), 0.42); goc.add(d); return d; });
    const domSan = taoDom(sang(MAU_KTG.hong, 2.2), 0.55), domTran = taoDom(sang(MAU_KTG.thoiGian, 2.2), 0.55), domDH3 = taoDom(sang(MAU_TIM, 2.2), 0.55);
    const domTin = taoDom(sang(MAU_KTG.anhSang, 2.6), 0.5);
    goc.add(domBong, domDen, domSan, domTran, domDH3, domTin);
    const nhanNay = taoNhan('', 'luc tran phai');
    nhanNay.center.x = 1;
    const nhanBong = taoNhan('', 'dam');
    const nhanTL = taoNhan('', 'hong tran');
    const nhanTin = taoNhan('', 'tran');
    goc.add(nhanNay, nhanBong, nhanTL, nhanTin);

    // Tên lửa nhỏ: nằm dọc tia «cùng lúc» của phi hành đoàn, đáy ở sàn, dài tới trần (tối đa 1 đơn vị hình); lửa phụt về phía điểm chốt.
    const tenLua = taoTenLua({ mauNhan: MAU_KTG.hong, luc: 1, doDaiLua: 2.4 });
    const CAO_TL = 4.2 + 0.38;
    const tlXoay = new THREE.Group(), tlCo = new THREE.Group();
    tlCo.add(tenLua.nhom); tlXoay.add(tlCo); goc.add(tlXoay);
    const _u = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _h = new THREE.Vector3(), _p = new THREE.Vector3();

    // ----- Điều khiển -----
    const bang = app.bang;
    const dkKhung = bang.chon({
      nhan: chuCanh("canh.khung-nhin", "Khung nhìn"),
      luaChon: [{ giaTri: 'qt', nhan: chuCanh("canh.khung-quan-tinh", "Khung quán tính") }, { giaTri: 'tl', nhan: chuCanh("canh.khung-ten-lua", "Khung tên lửa") }],
      giaTri: S.khung, khiDoi: (v) => datKhung(v),
    });
    const congTac = {};
    const TEN_HIEN = [['tran', chuCanh("canh.tran-ten-lua", "Trần tên lửa")], ['luoiR', chuCanh("canh.luoi-cua-phi-hanh-doan", "Lưới của phi hành đoàn")], ['bong', chuCanh("canh.qua-bong-tha-tu-tran", "Quả bóng thả từ trần")], ['xung', chuCanh("canh.chop-sang-tu-san-len-tran", "Chớp sáng từ sàn lên trần")], ['den', chuCanh("canh.den-hieu-va-chan-troi", "Đèn hiệu và chân trời")]];
    for (const [k, ten] of TEN_HIEN) {
      congTac[k] = bang.congTac({ nhan: ten, giaTri: false, khiDoi: (v) => { S.hien[k] = v; if (k === 'den') S.hien.chanTroi = v; if (k === 'xung') S.hien.vach = v; S.ban = true; capNhatTay(); } });
    }
    const dkTau = bang.thanhTruot({
      nhan: chuCanh("canh.so-nam-tren-tau", "Số năm trên tàu"), min: 0.5, max: 25, giaTri: S.tauTong, log: true,
      hienThi: (v) => chuCanh("canh.nam", "{0} năm", [so(v, 2)]),
      khiDoi: (v) => { S.tauTong = v; S.ban = true; },
    });
    const dkKieu = bang.chon({ nhan: chuCanh("canh.kieu-chuyen-di", "Kiểu chuyến đi"), luaChon: KIEU_DI, giaTri: S.kieu, khiDoi: (v) => { S.kieu = v; S.ban = true; } });
    const ghiChu = bang.chuThich('');

    function datKhung(v) { S.khung = v; dkKhung.dat(v); S.kDich = v === 'tl' ? 1 : 0; }

    const GOC = {
      cheo: [[6.5, 3.2, 17.5], [1.7, 0, 0]],
      thang: [[1.7, 0, 19], [1.7, 0, 0]],
    };
    const goc3 = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    // ----- Tay nắm trong cảnh -----
    // η của điểm trên sàn có toạ độ hiển thị t (t tăng theo η với mọi K): chia đôi.
    function etaTuT(t, rho = RHO0) {
      let a = -ETA_MAX, b = ETA_MAX;
      for (let i = 0; i < 44; i++) { const m = (a + b) / 2; anhR(rho, m); if (M_[1] < t) a = m; else b = m; }
      return (a + b) / 2;
    }
    const ETA_KEO = Math.atanh(0.985);
    const tayTL = tt.tayNam({
      viTri: [SC * RHO0, 0, 0], mau: MAU_KTG.hong, co: 0.1, ten: chuCanh("canh.ten-lua", "Tên lửa"),
      moTa: () => chuCanh("canh.dong-ho-san-nam-v-c", "Đồng hồ sàn <b>{0} năm</b> · v = <b>{1} c</b> · γ = {2}", [so(S.eta * RHO0, 2), so(Math.tanh(S.eta), 3), so(Math.cosh(S.eta), 2)]),
      rangBuoc: {
        kieu: 'ham',
        chieu: (tia) => {
          if (Math.abs(tia.direction.z) < 1e-6) return null;
          const s = -tia.origin.z / tia.direction.z;
          if (s <= 0) return null;
          tia.at(s, _h);
          const e = Math.max(-ETA_KEO, Math.min(ETA_KEO, etaTuT(_h.y)));
          anhR(RHO0, e);
          return _p.set(M_[0], M_[1], 0);
        },
      },
      nhan: chuCanh("canh.keo-ten-lua-doc-duong-the-gioi", "Kéo tên lửa"),
      khiNam: () => { S.tuDieu = true; S.daKeoTL = true; },
      khiKeo: (p) => { S.tuDieu = true; S.daKeoTL = true; S.eta = Math.max(-ETA_KEO, Math.min(ETA_KEO, etaTuT(p.y))); },
    });
    const tayDH = tt.tayNam({
      viTri: [SC * S.rhoD, 0, 0], mau: MAU_TIM, co: 0.1, ten: chuCanh("canh.dong-ho-thu-ba", "Đồng hồ thứ ba"),
      moTa: () => chuCanh("canh.do-cao-nam-anh-sang-chay-nhanh-gap", "Độ cao ρ = {0} năm ánh sáng: chạy nhanh gấp <b>{1}</b> lần đồng hồ sàn; gia tốc riêng {2} g.", [so(S.rhoD, 2), so(S.rhoD / RHO0, 2), so(RHO0 / S.rhoD, 2)]),
      rangBuoc: { kieu: 'duong', qua: [0, 0, 0], huong: [1, 0, 0] },
      gioiHan: (p) => { p.x = Math.max(SC * 0.3, Math.min(SC * 3.2, p.x)); p.y = 0; p.z = 0; return p; },
      nhan: chuCanh("canh.keo-dong-ho-thu-ba-len-xuong", "Kéo đồng hồ thứ ba"),
      khiKeo: (p) => { S.rhoD = p.x / SC; S.daKeoDH = true; S.ban = true; },
    });
    const tayPhat = tt.tayNam({
      viTri: [SC * RHO0, SC * S.teThu, 0], mau: MAU_KTG.anhSang, co: 0.1, ten: chuCanh("canh.su-kien-phat-tin-hieu", "Sự kiện phát tín hiệu"),
      moTa: () => (S.teThu < RHO0
        ? chuCanh("canh.phat-luc-nam-dong-ho-duong-cam-toi", "Phát lúc {0} năm (đồng hồ đường cam). Tới sàn lúc <b>{1} năm</b> theo đồng hồ sàn.", [so(S.teThu, 3), so(thoiDiemNhan(S.teThu, RHO0), 2)])
        : chuCanh("canh.phat-luc-nam-o-tren-chan-troi-khong", "Phát lúc {0} năm: ở trên chân trời, <b>không bao giờ</b> tới tên lửa.", [so(S.teThu, 3)])),
      rangBuoc: { kieu: 'duong', qua: [SC * RHO0, 0, 0], huong: [0, 1, 0] },
      gioiHan: (p) => { p.x = SC * RHO0; p.z = 0; p.y = Math.max(0, Math.min(SC * 2.25, p.y)); return p; },
      nhan: chuCanh("canh.keo-su-kien-phat-tin-hieu", "Kéo sự kiện phát tín hiệu"),
      khiKeo: (p) => {
        const cu = S.teThu;
        S.teThu = p.y / SC; S.daKeoPhat = true; S.ban = true;
        if ((cu < RHO0) !== (S.teThu < RHO0)) am.not({ tanSo: S.teThu < RHO0 ? 440 : 220, dai: 0.5, doTo: 0.35, dang: 'kinh' });
      },
    });
    // rê chuột xem thông tin
    tt.them(tenLua.nhom, { ten: chuCanh("canh.ten-lua", "Tên lửa"), mau: MAU_KTG.hong, moTa: () => chuCanh("canh.gia-toc-rieng-cua-san-luon-la-1", "Gia tốc riêng của sàn luôn là 1 g. Lúc này: đồng hồ sàn {0} năm, v = {1} c so với khung quán tính.", [so(S.eta * RHO0, 2), so(Math.tanh(S.eta), 3)]) });
    const reChanTroi = tt.them(mat.chanTroi.mesh, { ten: chuCanh("canh.chan-troi-rindler", "Chân trời Rindler"), mau: MAU_KTG.do, moTa: chuCanh("canh.mat-ct-x-tin-hieu-phat-tu-phia", "Mặt cT = X. Tín hiệu phát từ phía trên mặt này chạy song song với nó mãi mãi, không bao giờ đuổi kịp tên lửa (chừng nào tên lửa còn tăng tốc).") });
    const reNay = tt.them(mat.nay.mesh, { ten: chuCanh("canh.bay-gio-cua-phi-hanh-doan", "«Bây giờ» của phi hành đoàn"), mau: MAU_KTG.hienTai, moTa: () => chuCanh("canh.moi-su-kien-ma-phi-hanh-doan-coi", "Mọi sự kiện mà phi hành đoàn coi là «cùng lúc» với đồng hồ sàn chỉ {0} năm. Tấm này quay quanh điểm chốt.", [so(S.eta * RHO0, 2)]) });

    function capNhatTay() {
      const h = S.hien, tl = S.che === 'tenlua';
      tayTL.an(!(tl && h.keoTL));
      tayDH.an(!(tl && h.dongHo3));
      tayPhat.an(!(tl && h.phat && S.kDich < 0.5));
      reChanTroi.an(!(tl && h.chanTroi));
      reNay.an(!(tl && h.nay));
    }

    function capNhatGiaoDien() {
      const tl = S.che === 'tenlua';
      dkKhung.el.hidden = !tl;
      for (const k in congTac) { congTac[k].el.hidden = !tl; congTac[k].dat(!!S.hien[k]); }
      dkTau.el.hidden = dkKieu.el.hidden = tl;
      ghiChu.dat(tl
        ? chuCanh("canh.truc-ngang-x-nam-anh-sang-truc-dung", "Trục ngang X (năm ánh sáng), trục đứng cT (năm), c = 1. Ống hồng: sàn. Ống xanh lam: trần. Tấm xanh lục: «bây giờ» của phi hành đoàn. Gia tốc của sàn: 1 g.")
        : chuCanh("canh.ong-trang-trai-dat-ong-hong-con-tau", "Ống trắng: Trái Đất. Ống hồng: con tàu; chấm hồng: mỗi năm trên tàu. Chấm trắng: năm trên Trái Đất. Đường vàng: ánh sáng phát lúc khởi hành."));
      capNhatTay();
    }

    function cauHinh(o = {}) {
      if (o.che) S.che = o.che;
      if (o.hien) {
        S.hien = { ...o.hien };
        S.tuDieu = false; S.daKeoDH = false; S.daKeoPhat = false;
        S.rhoD = 1.75; S.teThu = 0.5;
        if (S.hien.keoTL) { S.eta = 0.5 / RHO0; S.tuDieu = true; } else S.eta = TAU_MIN / RHO0;
        S.daKeoTL = false;
        tayDH.dat([SC * S.rhoD, 0, 0]);
        tayPhat.dat([SC * RHO0, SC * S.teThu, 0]);
      }
      if (o.khung) { datKhung(o.khung); K = S.kDich; }
      if (o.tauTong != null) { S.tauTong = o.tauTong; dkTau.dat(o.tauTong); }
      if (o.kieu) { S.kieu = o.kieu; dkKieu.dat(o.kieu); }
      S.ban = true;
      capNhatGiaoDien();
      if (o.mayAnh) goc3(o.mayAnh);
    }

    // =====================================================================
    // Dựng hình tên lửa trong không-thời gian (dựng lại khi khung nhìn hay công tắc đổi)
    // =====================================================================
    const ETA_MAX = 2.7;
    function sheet(m, n, rho, eta0, eta1, N) {
      // mặt kính: hyperbol độ cao rho, kéo theo chiều sâu từ −W tới W
      let co = false, px = 0, pt = 0;
      for (let i = 0; i <= N; i++) {
        const e = eta0 + ((eta1 - eta0) * i) / N;
        const ok = anhR(rho, e) && trong(M_[0], M_[1]);
        if (ok && co) {
          m.dai(px, pt, M_[0], M_[1], -W, W, (i - 1) / N, i / N);
          n.them(px, pt, -W, M_[0], M_[1], -W); n.them(px, pt, W, M_[0], M_[1], W);
        }
        co = ok; px = M_[0]; pt = M_[1];
      }
    }
    // Ống theo một đường cho bằng hàm tham số f(s) → (X, T), ngắt ở chỗ ra khỏi khung hay ra khỏi nêm Rindler.
    function ongCong(o, f, s0, s1, n, y = 0) {
      o.ngat();
      for (let i = 0; i <= n; i++) {
        f(s0 + ((s1 - s0) * i) / n);
        if (anh(_f[0], _f[1]) && trong(M_[0], M_[1])) o.them(M_[0], M_[1], y);
        else o.ngat();
      }
    }
    function nhanR(html, lop, rho, eta, phai = false, dx = 0, dt = 0, uu = 20) { if (anhR(rho, eta)) nhan.them(html, lop, M_[0] + dx, M_[1] + dt, 0, phai, uu); }

    function veTenLua() {
      const h = S.hien;
      // lưới quán tính: rõ ở khung quán tính, mờ dần khi chuyển sang khung tên lửa; mỗi năm một nét đậm hơn
      net.luoiQT.bat(); net.luoiQT2.bat();
      for (let j = -6; j <= 13; j++) { const X = j * 0.5; if (j) cong(j % 2 ? net.luoiQT : net.luoiQT2, (s) => { _f[0] = X; _f[1] = s; }, -2.4, 2.4, 40); }
      for (let j = -9; j <= 9; j++) { const T = j * 0.5; if (j) cong(j % 2 ? net.luoiQT : net.luoiQT2, (s) => { _f[0] = s; _f[1] = T; }, -1.7, 3.4, 40); }
      net.luoiQT.mat.opacity = 0.06 * (1 - 0.6 * K);
      net.luoiQT2.mat.opacity = 0.15 * (1 - 0.6 * K);
      // trục
      net.trucQT.bat();
      cong(net.trucQT, (s) => { _f[0] = s; _f[1] = 0; }, -1.7, 3.35, 40);
      if (K < 0.02) { net.trucQT.doan(0, B.t0, 0, B.t1); }
      // ánh sáng 45° qua điểm chốt
      net.sang45.bat();
      if (K < 0.02) { net.sang45.doan(-4.7, -4.7, 4.7, 4.7); net.sang45.doan(-4.7, 4.7, 4.7, -4.7); }
      // lưới Rindler: hyperbol mỗi 0,25 năm ánh sáng (đậm mỗi 1), tia «cùng lúc» mỗi 0,25 năm đồng hồ sàn (đậm mỗi 1)
      net.luoiR.bat(); net.luoiR2.bat(); net.tiaR.bat(); net.tiaR2.bat();
      if (h.luoiR) {
        for (let j = 1; j <= 13; j++) { const rho = j * 0.25; cong(j % 4 ? net.luoiR : net.luoiR2, (s) => { _f[0] = rho * Math.cosh(s); _f[1] = rho * Math.sinh(s); }, -ETA_MAX, ETA_MAX, 80); }
      }
      if (h.luoiR || h.nay) {
        for (let j = -12; j <= 12; j++) {
          const eta = (j * 0.25) / RHO0;
          if (Math.abs(eta) > ETA_MAX) continue;
          if (anhR(1e-4, eta)) { const ax = M_[0], at = M_[1]; anhR(3.6, eta); (j % 4 ? net.tiaR : net.tiaR2).doan(ax, at, M_[0], M_[1]); }
        }
      }
      // chân trời: mặt sáng có vệt tín hiệu trượt dọc theo nó
      mat.chanTroi.bat(); mat.chanTroiQK.bat(); net.chanTroi.bat(); net.chanTroiLoi.bat();
      if (h.chanTroi) {
        const xm = 4.6 * (1 - K);
        for (const d of [1, -1]) {
          (d > 0 ? mat.chanTroi : mat.chanTroiQK).dai(0, 0, xm, d * 4.6, -YK, YK, 0, 1);
          net.chanTroiLoi.them(0, 0, 0, xm, d * 4.6, 0);
          net.chanTroi.them(0, 0, -YK, xm, d * 4.6, -YK); net.chanTroi.them(0, 0, YK, xm, d * 4.6, YK);
          net.chanTroi.them(xm, d * 4.6, -YK, xm, d * 4.6, YK);
        }
        nhan.them(chuCanh("canh.chan-troi-ct-x-tin-hieu-phat-sau", "chân trời: cT = X<small>tín hiệu phát sau mặt này không bao giờ tới tên lửa</small>"), 'do', xm * 0.72 + 0.1, 4.6 * 0.72, YK, false, 60);
      }
      // sàn, trần: ống sáng ở giữa, tấm kính theo bề rộng tên lửa
      mat.san.bat(); mat.tran.bat(); net.vien.bat(); ong.san.bat(); ong.tran.bat(); ong.dat.bat(); ong.tau.bat();
      for (const k in dom) dom[k].bat();
      nhan.bat();
      if (h.san) {
        sheet(mat.san, net.vien, RHO0, -ETA_MAX, ETA_MAX, 140);
        ongCong(ong.san, (s) => { _f[0] = RHO0 * Math.cosh(s); _f[1] = RHO0 * Math.sinh(s); }, -ETA_MAX, ETA_MAX, 220);
        nhanR(chuCanh("canh.san-gia-toc-rieng-1-g", "sàn<small>gia tốc riêng 1 g</small>"), 'hong dam', RHO0, -1.25, true, -0.15, 0, 70);
        if (h.vanToc) {
          for (const tau of [-1.5, -1, -0.5, 0.5, 1, 1.5, 2]) {
            const eta = tau / RHO0;
            if (anhR(RHO0, eta) && dom.hong.them(M_[0], M_[1])) {
              nhan.them(chuCanh("canh.nam-v-c", "{0} năm<small>v = {1} c</small>", [so(tau, 1), so(Math.tanh(eta), 2)]), 'hong', M_[0] + 0.12, M_[1], 0, false, 30);
            }
          }
          if (anhR(RHO0, 0)) { dom.to.them(M_[0], M_[1]); nhan.them(chuCanh("canh.dung-yen-tuc-thoi-x-c-a-0", "đứng yên tức thời<small>X = c²/a = 0,97 năm ánh sáng</small>"), 'dam', M_[0] - 0.15, M_[1] - 0.05, 0, true, 60); }
        }
      }
      if (h.tran) {
        sheet(mat.tran, net.vien, RHO1, -ETA_MAX, ETA_MAX, 140);
        ongCong(ong.tran, (s) => { _f[0] = RHO1 * Math.cosh(s); _f[1] = RHO1 * Math.sinh(s); }, -ETA_MAX, ETA_MAX, 220);
        nhanR(chuCanh("canh.tran-gia-toc-rieng-g", "trần<small>gia tốc riêng {0} g</small>", [so(RHO0 / RHO1, 2)]), 'xanh dam', RHO1, -0.75, false, 0.15, 0, 70);
      }
      if (h.vach) {
        // mỗi 0,25 năm theo đồng hồ của chính nó
        for (let j = -12; j <= 16; j++) {
          const tau = j * 0.25;
          const eS = tau / RHO0, eT = tau / RHO1;
          if (h.san && Math.abs(eS) < ETA_MAX && anhR(RHO0, eS)) {
            dom.hong.them(M_[0], M_[1]);
            if (j > 0 && j % 4 === 0) nhan.them(chuCanh("canh.nam", "{0} năm", [so(tau, 0)]), 'hong tran', M_[0], M_[1], 0, true, 15);
          }
          if (h.tran && Math.abs(eT) < ETA_MAX && anhR(RHO1, eT)) {
            dom.xanh.them(M_[0], M_[1]);
            if (j > 0 && j % 4 === 0) nhan.them(chuCanh("canh.nam", "{0} năm", [so(tau, 0)]), 'xanh tran', M_[0] + 0.05, M_[1], 0, false, 15);
          }
        }
      }
      // đồng hồ thứ ba do người học đặt ở độ cao ρ (bước 4)
      ong.dh3.bat();
      if (h.dongHo3) {
        const rD = S.rhoD;
        ongCong(ong.dh3, (s) => { _f[0] = rD * Math.cosh(s); _f[1] = rD * Math.sinh(s); }, -ETA_MAX, ETA_MAX, 220);
        for (let j = -16; j <= 24; j++) {
          const e = (j * 0.25) / rD;
          if (Math.abs(e) < ETA_MAX && anhR(rD, e)) dom.tim.them(M_[0], M_[1]);
        }
        nhanR(chuCanh("canh.dong-ho-thu-ba-nhanh-gap-san", "đồng hồ thứ ba<small>nhanh gấp {0} lần sàn</small>", [so(rD / RHO0, 2)]), 'tim dam', rD, -0.42, false, 0.18, 0, 85);
      }
      // quả bóng: đứng yên ở X = ρ0 + h từ lúc thả tới lúc sàn chạm
      ong.bong.bat();
      if (h.bong) {
        const tc = tChamSan(RHO0, HT);
        ongCong(ong.bong, (s) => { _f[0] = RHO1; _f[1] = s; }, 0, tc, 60);
        if (anh(RHO1, 0)) { dom.trang.them(M_[0], M_[1]); nhan.them(chuCanh("canh.tha-qua-bong", "thả quả bóng"), 'tran', M_[0] + 0.12, M_[1] - 0.1, 0, false, 55); }
        if (anh(RHO1, tc)) { dom.to.them(M_[0], M_[1]); nhan.them(chuCanh("canh.san-cham-bong-dong-ho-san-nam", "sàn chạm bóng<small>đồng hồ sàn: {0} năm</small>", [so(RHO0 * ETA_BONG, 2)]), 'dam', M_[0] + 0.12, M_[1], 0, false, 65); }
      }
      // chớp sáng từ sàn lên trần
      net.xung.bat();
      if (h.xung) {
        for (let j = -10; j <= 12; j++) {
          const e1 = (j * 0.25) / RHO0, e2 = e1 + LN_TL;
          if (e1 < -ETA_MAX || e2 > ETA_MAX) continue;
          const [X1, T1] = [RHO0 * Math.cosh(e1), RHO0 * Math.sinh(e1)];
          const [X2, T2] = [RHO1 * Math.cosh(e2), RHO1 * Math.sinh(e2)];
          cong(net.xung, (s) => { _f[0] = X1 + (X2 - X1) * s; _f[1] = T1 + (T2 - T1) * s; }, 0, 1, 16);
          if (anhR(RHO1, e2)) dom.vang.them(M_[0], M_[1]);
        }
      }
      // đèn hiệu thả qua cửa sàn, và các chớp nó phát về tên lửa
      ong.den.bat(); net.xungDen.bat(); net.xungMat.bat();
      if (h.den) {
        ongCong(ong.den, (s) => { _f[0] = RHO0; _f[1] = s; }, 0, K > 0.02 ? RHO0 * 0.9995 : 2.4, 160);
        for (let j = 0; j <= 22; j++) {
          const Te = j * 0.1;
          const u = Te - RHO0;                        // T − X giữ nguyên dọc tia đi về phía +X
          if (Te < RHO0) {
            const etaR = -Math.log(-u / RHO0);        // tới sàn lúc này (theo η)
            const XR = RHO0 * Math.cosh(etaR), TR = RHO0 * Math.sinh(etaR);
            cong(net.xungDen, (s) => { _f[0] = RHO0 + (XR - RHO0) * s; _f[1] = Te + (TR - Te) * s; }, 0, 1, 24);
            if (anhR(RHO0, etaR)) dom.vang.them(M_[0], M_[1]);
          } else if (K < 0.02) {
            net.xungMat.doan(SC * RHO0, SC * Te, SC * (RHO0 + 3), SC * (Te + 3));
          }
          if (anh(RHO0, Te)) dom.cam.them(M_[0], M_[1]);
        }
        if (anh(RHO0, 0.35)) nhan.them(chuCanh("canh.den-hieu-tha-qua-cua-san-luc-0", "đèn hiệu<small>thả qua cửa sàn lúc η = 0</small>"), 'cam', M_[0] - 0.12, M_[1], 0, true, 70);
        if (K < 0.02 && anh(RHO0, RHO0)) { dom.to.them(M_[0], M_[1]); nhan.them(chuCanh("canh.qua-chan-troi-luc-nam", "qua chân trời<small>lúc {0} năm</small>", [so(RHO0, 4)]), 'do', M_[0] - 0.12, M_[1], 0, true, 70); }
      }
      // tín hiệu người học phát từ đường cam (bước 5)
      net.tinHieu.bat(); net.tinHieuMat.bat();
      nhanTin.visible = false; domTin.visible = false;
      if (h.phat && K < 0.5) {
        const Te = S.teThu;
        if (Te < RHO0) {
          const etaR = -Math.log(1 - Te / RHO0);
          const XR = RHO0 * Math.cosh(etaR), TR = RHO0 * Math.sinh(etaR);
          cong(net.tinHieu, (s) => { _f[0] = RHO0 + (XR - RHO0) * s; _f[1] = Te + (TR - Te) * s; }, 0, 1, 24);
          if (anhR(RHO0, etaR) && trong(M_[0], M_[1])) {
            domTin.visible = true; domTin.position.set(M_[0], M_[1], 0);
            nhanTin.visible = true; nhanTin.element.className = 'nhan vang tran';
            nhanTin.position.set(M_[0] + 0.15, M_[1] - 0.05, 0);
            nhanTin.datChu(chuCanh("canh.toi-san-luc-nam-nhip-nhan-cham-di", "tới sàn lúc {0} năm<small>nhịp nhận chậm đi còn {1} lần</small>", [so(RHO0 * etaR, 2), so(1 - Te / RHO0, 2)]));
          } else if (anh(RHO0, Te)) {
            nhanTin.visible = true; nhanTin.element.className = 'nhan vang tran';
            nhanTin.position.set(Math.min(B.x1 - 2.2, M_[0] + 0.5), Math.min(B.t1 - 0.3, M_[1] + 0.9), 0);
            nhanTin.datChu(chuCanh("canh.toi-san-luc-nam-ngoai-khung-hinh-nhip", "tới sàn lúc {0} năm<small>(ngoài khung hình) · nhịp nhận còn {1} lần</small>", [so(RHO0 * etaR, 2), so(1 - Te / RHO0, 2)]));
          }
        } else {
          net.tinHieuMat.doan(SC * RHO0, SC * Te, SC * (RHO0 + 3), SC * (Te + 3));
          if (anh(RHO0, Te)) {
            nhanTin.visible = true; nhanTin.element.className = 'nhan do tran';
            nhanTin.position.set(Math.min(B.x1 - 2.4, M_[0] + 0.6), Math.min(B.t1 - 0.3, M_[1] + 0.75), 0);
            nhanTin.datChu(chuCanh("canh.khong-bao-gio-toi-chay-song-song-voi", "không bao giờ tới<small>chạy song song với chân trời mãi mãi</small>"));
          }
        }
      }
      // điểm chốt
      if (K < 0.3 && (h.luoiR || h.nay || h.chanTroi)) { dom.to.them(0, 0); nhan.them(chuCanh("canh.diem-chot", "điểm chốt"), 'tran', 0.12, -0.25, 0, false, 50); }
      // nhãn trục
      if (K < 0.5) { nhan.them(chuCanh("canh.x-nam-anh-sang", "X (năm ánh sáng)"), 'mo tran', B.x1 - 0.1, 0.25, 0, true); nhan.them(chuCanh("canh.ct-nam", "cT (năm)"), 'xanh tran', 0.1, B.t1 - 0.2, 0); }
      else nhan.them(chuCanh("canh.do-cao-trong-ten-lua", "ρ: độ cao trong tên lửa"), 'mo tran', B.x1 - 0.1, 0.25, 0, true);

      for (const k in net) net[k].xong();
      for (const k in ong) ong[k].xong();
      for (const k in mat) if (k !== 'nay') mat[k].xong();
      for (const k in dom) dom[k].xong();
      nhan.xong();
    }

    // Chuyến du hành 1 g (bước 7): tỉ lệ đổi theo chuyến đi.
    let thongTinDH = null;
    function veDuHanh() {
      for (const k in net) net[k].bat();
      for (const k in mat) mat[k].bat();
      for (const k in ong) ong[k].bat();
      for (const k in dom) dom[k].bat();
      nhan.bat();
      nhanTin.visible = domTin.visible = false;
      const k = RHO0, tau = S.tauTong;
      const ham = S.kieu === 'ham';
      let D, Ttong, vMax, gMax;
      if (ham) { const n = tau / 2 / k; D = 2 * k * (Math.cosh(n) - 1); Ttong = 2 * k * Math.sinh(n); vMax = Math.tanh(n); gMax = Math.cosh(n); }
      else { const r = duHanh(tau); D = r.d; Ttong = r.T; vMax = r.v; gMax = r.g; }
      // Gốc nâng lên cho sự kiện «khởi hành» nằm trên ô số liệu (5 dòng).
      const ox = -2.6, ot = -3.5;
      const sc = Math.min(7.8 / Ttong, 7.8 / D);
      const P = (X, T) => { M_[0] = ox + sc * X; M_[1] = ot + sc * T; };
      // vị trí và thời gian theo thời gian riêng s
      const viTri = (s) => {
        if (!ham || s <= tau / 2) { _f[0] = k * (Math.cosh(s / k) - 1); _f[1] = k * Math.sinh(s / k); return; }
        const r = tau - s;
        _f[0] = D - k * (Math.cosh(r / k) - 1); _f[1] = Ttong - k * Math.sinh(r / k);
      };
      // lưới thưa: 4 nấc theo mỗi trục
      const nac = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].find((s) => Ttong / s <= 6) || 50000;
      for (let j = 1; j * nac <= Ttong * 1.02; j++) {
        P(0, j * nac); const a0 = M_[0], a1 = M_[1]; P(D * 1.05, j * nac); net.dhLuoi.doan(a0, a1, M_[0], M_[1]);
        P(0, j * nac); dom.trang.them(M_[0], M_[1]);
        nhan.them(chuCanh("canh.nam", "{0} năm", [soNghia(j * nac, 3)]), 'mo tran', ox - 0.1, M_[1], 0, true, 15);
      }
      // Trái Đất và ánh sáng
      P(0, 0); ong.dat.them(M_[0], M_[1]); P(0, Ttong * 1.04); ong.dat.them(M_[0], M_[1]);
      P(0, 0); const l0 = M_[0], l1 = M_[1]; P(Ttong * 1.1, Ttong * 1.1); net.dhSang.doan(l0, l1, M_[0], M_[1]);
      // con tàu
      for (let i = 0; i <= 360; i++) { viTri((tau * i) / 360); P(_f[0], _f[1]); ong.tau.them(M_[0], M_[1]); }
      // mỗi năm trên tàu
      const buoc = tau > 30 ? 5 : tau > 12 ? 2 : tau > 5 ? 1 : 0.5;
      for (let s = buoc; s < tau - 1e-6; s += buoc) { viTri(s); P(_f[0], _f[1]); dom.hong.them(M_[0], M_[1]); }
      P(0, 0); dom.to.them(M_[0], M_[1]);
      nhan.them(chuCanh("canh.khoi-hanh", "khởi hành"), 'tran', M_[0] + 0.15, M_[1] - 0.2, 0, false, 50);
      P(D, Ttong); dom.to.them(M_[0], M_[1]);
      // Quãng đường đã có ở ô số liệu; nhãn chỉ giữ hai thời gian để so.
      nhan.them(chuCanh("canh.tren-tau-nam-trai-dat-nam", "{0}<small>trên tàu {1} năm · Trái Đất {2} năm</small>", [ham ? chuCanh("canh.toi-noi-dung-yen", "tới nơi, đứng yên") : chuCanh("canh.sau", "sau ") + so(tau, 1) + chuCanh("canh.nam-tren-tau", " năm trên tàu"), so(tau, 1), soNghia(Ttong, 4)]), 'hong dam', M_[0] - 0.15, M_[1] + 0.3, 0, true, 90);
      nhan.them(chuCanh("canh.trai-dat", "Trái Đất"), 'dam', ox + 0.12, ot + 0.35, 0, false, 60);
      nhan.them(chuCanh("canh.anh-sang", "ánh sáng"), 'vang tran', ox + 4.4, ot + 4.6, 0, false, 30);
      if (ham) { viTri(tau / 2); P(_f[0], _f[1]); dom.to.them(M_[0], M_[1]); nhan.them(chuCanh("canh.giua-duong-bat-dau-ham-v-c-c", "giữa đường: bắt đầu hãm<small>v = c − {0} c · γ = {1}</small>", [soNghia(1 - vMax, 2), soNghia(gMax, 3)]), 'hong', M_[0] - 0.15, M_[1], 0, true, 60); }
      for (const k2 in net) net[k2].xong();
      for (const k2 in mat) mat[k2].xong();
      for (const k2 in ong) ong[k2].xong();
      for (const k2 in dom) dom[k2].xong();
      nhan.xong();
      thongTinDH = { D, Ttong, vMax, gMax, tau, ham, viTri, P, sc };
    }

    // ----- Âm thanh -----
    // Động cơ: tiếng ù không đổi, vì gia tốc riêng (thứ phi hành đoàn cảm thấy) không đổi.
    // Đồng hồ: mỗi 0,25 năm theo đồng hồ của chính nó, sàn tích trầm, trần tích cao, đồng hồ thứ ba tích cao hơn nữa.
    // Đèn hiệu: mỗi chớp tới sàn là một nốt, tần số = 660 Hz × (nhịp nhận / nhịp phát) = 660 Hz × (1 − Te/ρ0).
    // Quy đổi thời gian: 1 năm của đồng hồ sàn kéo dài khoảng 2,4 giây nghe.
    const amDongCo = amKeoDai(am, 'tiengOn', { mau: 'nau', tanSoLoc: 360, doTo: 0 });
    const tatAm = () => amDongCo.tat(0.25);
    const etaChop = [];   // η lúc các chớp của đèn hiệu tới sàn, kèm thời điểm phát
    for (let j = 0; j <= 22; j++) { const Te = j * 0.1; if (Te < RHO0) etaChop.push([-Math.log(1 - Te / RHO0), Te]); }
    let etaTruoc = S.eta;
    function phatTieng(e0, e1) {
      const h = S.hien;
      const qua = (x) => e0 < x && x <= e1;
      if (h.vach) {
        const n0 = Math.floor((e0 * RHO0) / 0.25), n1 = Math.floor((e1 * RHO0) / 0.25);
        if (n1 > n0 && h.san) am.tich({ tanSo: 620, doTo: 0.32, lech: -0.25, dai: 0.05 });
        const m0 = Math.floor((e0 * RHO1) / 0.25), m1 = Math.floor((e1 * RHO1) / 0.25);
        if (m1 > m0 && h.tran) am.tich({ tanSo: 1040, doTo: 0.28, lech: 0.25, dai: 0.04 });
      }
      if (h.dongHo3) {
        const d0 = Math.floor((e0 * S.rhoD) / 0.25), d1 = Math.floor((e1 * S.rhoD) / 0.25);
        if (d1 > d0) am.tich({ tanSo: 1560, doTo: 0.24, lech: 0.45, dai: 0.035 });
      }
      if (h.bong && qua(ETA_BONG)) am.not({ tanSo: 140, dai: 0.35, doTo: 0.45, dang: 'mem' });
      if (h.den) for (const [e, Te] of etaChop) if (qua(e)) am.not({ tanSo: tanSoNhan(Te), dai: 0.4, doTo: 0.34, dang: 'chuong' });
      if (h.phat && S.teThu < RHO0 && qua(-Math.log(1 - S.teThu / RHO0))) am.not({ tanSo: tanSoNhan(S.teThu), dai: 0.6, doTo: 0.45, dang: 'kinh' });
    }

    // ----- Nhãn tránh nhau -----
    // Dựng sẵn danh sách một lần (không cấp phát mỗi khung hình). Nhãn trong bộ nhãn dùng mức ưu tiên ghi lúc them().
    const dsNhan = nhan.ds.map((o) => ({ nhan: o, uuTien: 20, tat: true, giu: false }));
    const NHAN_RIENG = [[nhanTL, 90, true], [nhanTin, 85, false], [nhanBong, 80, false], [nhanNay, 65, false]];
    for (const [o, uuTien, giu] of NHAN_RIENG) dsNhan.push({ nhan: o, uuTien, tat: true, giu });
    function xepNhan() {
      for (const k of dsNhan) {
        const o = k.nhan;
        k.tat = !o.visible;
        if (o._uu != null) { k.uuTien = o._uu; k.giu = o._uu >= 90; }
      }
      goNhanDeNhau(dsNhan, app.camera, app.rong, app.cao);
    }

    // ----- Vòng lặp -----
    let gio = 0, daThu = false, tong = 0;
    const thamThu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    function capNhat(dt) {
      tong += dt;
      if (thamThu && !daThu && tong > 0.4) { daThu = true; apThu(thamThu); }
      const tl = S.che === 'tenlua';
      if (tl) {
        const d = S.kDich - K;
        if (Math.abs(d) > 1e-5) {
          const nhay = d * (1 - Math.exp(-dt * 2.6)) + Math.sign(d) * dt * 0.08;
          if (Math.abs(nhay) >= Math.abs(d)) K = S.kDich; else K += nhay;
          S.ban = true;
          capNhatTay();
        }
      }
      if (S.ban) { if (tl) veTenLua(); else veDuHanh(); S.ban = false; }
      gio += dt;
      mat.chanTroi.mat.uniforms.uGio.value = gio;
      // đồ vật chạy theo «bây giờ» của phi hành đoàn
      domSan.visible = domTran.visible = domDH3.visible = domBong.visible = domDen.visible = nhanNay.visible = nhanBong.visible = nhanTL.visible = false;
      tlXoay.visible = false;
      for (const d of domXung) d.visible = false;
      mat.nay.bat(); net.nay.bat();
      if (!tl) {
        mat.nay.xong(); net.nay.xong();
        // tên lửa nhỏ chạy dọc đường thế giới của con tàu: mũi về phía trước khi tăng tốc, quay đầu khi hãm
        const t = thongTinDH;
        if (t) {
          const chu = 7, q = (gio % chu) / chu;
          const sTau = t.tau * Math.min(1, q / 0.9);
          const moDH = Math.min(1, q / 0.06, Math.max(0, (1 - q) / 0.06));
          t.viTri(sTau); t.P(_f[0], _f[1]);
          tlXoay.visible = moDH > 0.01;
          tlXoay.position.set(M_[0], M_[1], 0.05);
          const ham = t.ham && sTau > t.tau / 2;
          _d.set(ham ? -1 : 1, 0, 0);
          tlXoay.quaternion.setFromUnitVectors(_u, _d);
          const k = 0.12 * moDH;
          tlCo.scale.set(k, k, k);
          tenLua.datLucDay(q < 0.9 ? 1 : 0, 0.3);
          tenLua.capNhat(dt);
        }
        if (dt > 0 && tlXoay.visible) amDongCo.dat({ tanSoLoc: 360, doTo: 0.07, lech: 0.15 }, 0.1);
        else amDongCo.dat({ doTo: 0 }, 0.1);
        xepNhan();
        return;
      }
      tenLua.datLucDay(1, 0.3);
      if (!S.tuDieu) {
        S.eta += (dt * 0.42) / RHO0;
        if (S.eta * RHO0 > TAU_MAX || S.eta * RHO0 < TAU_MIN - 0.5) { S.eta = TAU_MIN / RHO0; etaTruoc = S.eta; }
      }
      if (dt > 0 && S.eta > etaTruoc && S.eta - etaTruoc < 0.2) phatTieng(etaTruoc, S.eta);
      etaTruoc = S.eta;
      const eta = S.eta, h = S.hien;
      // hiện, ẩn dần ở hai đầu vòng lặp (không nhảy hình)
      const tauS = eta * RHO0;
      const mo = S.tuDieu ? 1 : Math.min(1, Math.max(0, (tauS - TAU_MIN) / 0.35), Math.max(0, (TAU_MAX - tauS) / 0.35));
      mat.nay.mat.uniforms.uDoMo.value = mo;
      net.nay.mat.opacity = 0.9 * mo;
      if (h.nay) {
        if (anhR(1e-4, eta)) {
          const ax = M_[0], at = M_[1];
          anhR(3.6, eta);
          const bx = M_[0], bt = M_[1];
          if (cat(ax, at, bx, bt)) {
            mat.nay.dai(KQ.ax, KQ.at, KQ.bx, KQ.bt, -YK, YK, 0, 1);
            net.nay.them(KQ.ax, KQ.at, -YK, KQ.bx, KQ.bt, -YK); net.nay.them(KQ.ax, KQ.at, YK, KQ.bx, KQ.bt, YK);
            // nhãn đặt ở ρ = 3 (trong khung), canh phải
            const ok = anhR(3, eta) && trong(M_[0], M_[1]);
            nhanNay.visible = ok && mo > 0.5;
            nhanNay.position.set(M_[0], M_[1] + 0.25, YK);
            nhanNay.datChu(chuCanh("canh.bay-gio-cua-phi-hanh-doan-dong-ho", "«bây giờ» của phi hành đoàn<small>đồng hồ sàn {0} năm · trần {1} năm</small>", [so(eta * RHO0, 2), so(eta * RHO1, 2)]));
          }
        }
      }
      // tên lửa nhỏ: đáy ở sàn, mũi ở trần, dọc tia «cùng lúc»
      if (h.san && anhR(RHO0, eta) && trong(M_[0], M_[1])) {
        const fx = M_[0], ft = M_[1];
        domSan.visible = true; domSan.position.set(fx, ft, 0);
        const moMep = Math.min(1, Math.max(0, (B.t1 - ft) / 0.7), Math.max(0, (ft - B.t0) / 0.7));
        anhR(RHO1, eta);
        _d.set(M_[0] - fx, M_[1] - ft, 0);
        const dai = _d.length();
        const moTL = mo * moMep;
        if (dai > 1e-3 && moTL > 0.01) {
          tlXoay.visible = true;
          tlXoay.position.set(fx, ft, 0);
          tlXoay.quaternion.setFromUnitVectors(_u, _d.divideScalar(dai));
          const w = 0.21 * moTL;
          tlCo.scale.set(w, (Math.min(dai, 1.0) / CAO_TL) * moTL, w);
          tenLua.capNhat(dt);
        }
        if (h.keoTL) {
          nhanTL.visible = true;
          nhanTL.center.set(1, 0.5);
          nhanTL.position.set(fx - 0.3, ft + 0.32, 0);
          nhanTL.datChu(chuCanh("canh.dong-ho-san-nam-v-c-trai-dat", "đồng hồ sàn {0} năm<small>v = {1} c · Trái Đất: cT = {2} năm</small>", [so(eta * RHO0, 2), so(Math.tanh(eta), 3), so(RHO0 * Math.sinh(eta), 2)]));
          if (!tt.dangKeo) tayTL.dat(_p.set(fx, ft, 0));
        }
      }
      if (h.tran && anhR(RHO1, eta) && trong(M_[0], M_[1])) { domTran.visible = true; domTran.position.set(M_[0], M_[1], 0); }
      if (h.dongHo3 && anhR(S.rhoD, eta) && trong(M_[0], M_[1])) { domDH3.visible = true; domDH3.position.set(M_[0], M_[1], 0); }
      if (h.bong) {
        let ok;
        if (eta <= 0) ok = anhR(RHO1, eta);
        else if (eta < ETA_BONG) ok = anh(RHO1, RHO1 * Math.tanh(eta));
        else ok = anhR(RHO0, eta);
        if (ok && trong(M_[0], M_[1])) {
          domBong.visible = nhanBong.visible = true;
          domBong.position.set(M_[0], M_[1], 0.02);
          nhanBong.center.set(1, 0.5);
          nhanBong.position.set(M_[0] - 0.12, M_[1] - 0.18, 0.02);
          nhanBong.datChu(eta <= 0 ? chuCanh("canh.qua-bong-con-gan-o-tran", "quả bóng (còn gắn ở trần)") : eta < ETA_BONG ? chuCanh("canh.qua-bong-dang-roi", "quả bóng đang «rơi»") : chuCanh("canh.qua-bong-nam-tren-san", "quả bóng nằm trên sàn"));
        }
      }
      if (h.xung) {
        let i = 0;
        for (let j = -10; j <= 12 && i < domXung.length; j++) {
          const e1 = (j * 0.25) / RHO0;
          if (eta < e1 || eta > e1 + LN_TL) continue;
          const rho = RHO0 * Math.exp(eta - e1);
          if (anhR(rho, eta) && trong(M_[0], M_[1])) { const d = domXung[i++]; d.visible = true; d.position.set(M_[0], M_[1], 0); }
        }
      }
      if (h.den && eta > 0) {
        // đèn hiệu đứng yên ở X = ρ0; trên đường «cùng lúc» η nó ở T = ρ0 tanh η
        if (anh(RHO0, RHO0 * Math.tanh(eta)) && trong(M_[0], M_[1])) { domDen.visible = true; domDen.position.set(M_[0], M_[1], 0); }
      }
      mat.nay.xong(); net.nay.xong();
      // động cơ: tiếng không đổi (gia tốc riêng không đổi)
      if (dt > 0 && tlXoay.visible) amDongCo.dat({ tanSoLoc: 360, doTo: 0.07, lech: 0.15 }, 0.1);
      else amDongCo.dat({ doTo: 0 }, 0.1);
      xepNhan();
    }

    // Trạng thái dựng sẵn để chụp ảnh và kiểm thử thách (chỉ khi app.imLang).
    function apThu(ten) {
      if (ten === 'v09') { S.tuDieu = true; S.daKeoTL = true; S.eta = Math.atanh(0.9); }
      else if (ten === 'dh2') { S.rhoD = 2 * RHO0; S.daKeoDH = true; tayDH.dat([SC * S.rhoD, 0, 0]); }
      else if (ten === 'phat') { S.teThu = 1.3; S.daKeoPhat = true; tayPhat.dat([SC * RHO0, SC * S.teThu, 0]); }
      else if (ten === 'phat07') { S.teThu = 0.7; S.daKeoPhat = true; tayPhat.dat([SC * RHO0, SC * S.teThu, 0]); }
      else if (ten === 'tl') datKhung('tl');
      S.ban = true;
    }

    function hud() {
      if (S.che === 'duhanh') {
        const t = thongTinDH;
        if (!t) return [];
        return [
          [chuCanh("canh.tren-tau", "Trên tàu"), chuCanh("canh.nam", "{0} năm", [so(S.tauTong, 2)])],
          [chuCanh("canh.chuyen-di-1-g", "Chuyến đi 1 g"), S.kieu === 'ham' ? chuCanh("canh.tang-toc-nua-dau-ham-nua-sau", "tăng tốc nửa đầu, hãm nửa sau") : chuCanh("canh.tang-toc-suot-ef473b", "tăng tốc suốt")],
          [chuCanh("canh.trai-dat", "Trái Đất"), chuCanh("canh.nam-troi-qua", "{0} năm trôi qua", [soNghia(t.Ttong, 4)])],
          [chuCanh("canh.quang-duong", "Quãng đường"), chuCanh("canh.nam-anh-sang-1b", "{0} năm ánh sáng", [soNghia(t.D, 4)])],
          [chuCanh("canh.nhanh-nhat", "Nhanh nhất"), `v = ${t.vMax > 0.9999 ? `c − ${soNghia(1 - t.vMax, 2)} c` : `${so(t.vMax, 4)} c`} · γ = ${soNghia(t.gMax, 4)}`],
        ];
      }
      const eta = S.eta;
      const d = [
        [chuCanh("canh.khung-nhin", "Khung nhìn"), chuCanh("canh.duong-chuyen", "{0} ({1}% đường chuyển)", [K < 0.5 ? chuCanh("canh.quan-tinh", "quán tính") : chuCanh("canh.ten-lua-e51d27", "tên lửa"), so(K * 100, 0)])],
        [chuCanh("canh.dong-ho-san-tran", "Đồng hồ sàn · trần"), chuCanh("canh.nam-nam-ti-so", "{0} năm · {1} năm (tỉ số {2})", [so(eta * RHO0, 2), so(eta * RHO1, 2), so(tiLeNhip(RHO0, HT), 3)])],
        [chuCanh("canh.ten-lua-so-voi-khung-quan-tinh", "Tên lửa so với khung quán tính"), `v = ${so(Math.tanh(eta), 3)} c`],
      ];
      if (S.hien.dongHo3) {
        d.push([chuCanh("canh.dong-ho-thu-ba", "Đồng hồ thứ ba"), chuCanh("canh.rho-nam-anh-sang", "ρ = {0} năm ánh sáng", [so(S.rhoD, 2)])]);
        d.push([chuCanh("canh.nhip-so-voi-san", "Nhịp so với sàn"), chuCanh("canh.nhanh-gap-lan", "nhanh gấp {0} lần", [so(S.rhoD / RHO0, 3)])]);
      }
      if (S.hien.den && eta > 0) {
        const tr = eta * RHO0;
        // thời điểm phát (đồng hồ đèn hiệu) của chớp sáng đang tới sàn
        const Te = RHO0 * (1 - Math.exp(-tr / RHO0));
        // Giới hạn 0,9687 năm đã ghi ở nhãn «qua chân trời» và trong lời giảng.
        d.push([chuCanh("canh.chop-den-hieu-toi-san", "Chớp đèn hiệu tới sàn"), chuCanh("canh.phat-luc-nam-tieng-hz", "phát lúc {0} năm · tiếng {1} Hz", [so(Te, 3), so(tanSoNhan(Te), 0)])]);
      }
      if (S.hien.phat) d.push([chuCanh("canh.tin-hieu-ban-phat", "Tín hiệu bạn phát"), S.teThu < RHO0 ? chuCanh("canh.luc-nam-toi-san-luc-nam", "lúc {0} năm → tới sàn lúc {1} năm", [so(S.teThu, 3), so(thoiDiemNhan(S.teThu, RHO0), 2)]) : chuCanh("canh.luc-nam-khong-bao-gio-toi", "lúc {0} năm → không bao giờ tới", [so(S.teThu, 3)])]);
      return d;
    }

    cauHinh({ che: 'tenlua', hien: { san: true } });

    return {
      scene, capNhat, hud, cauHinh, datKhung, goc: goc3, tatAm,
      vanToc: () => (S.daKeoTL ? Math.tanh(S.eta) : NaN),
      tiLeDongHo3: () => (S.daKeoDH ? S.rhoD / RHO0 : NaN),
      tinHieuKhongToi: () => S.daKeoPhat && K < 0.5 && S.teThu >= RHO0 + 0.01,
      huy() { tatAm(); denCanh.huy(); },
    };
  },
};
