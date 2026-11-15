// Các hàm vẽ dùng chung: nhãn chữ, đốm sáng, nền sao, đường tròn, dọn bộ nhớ.

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { taoBauTroi } from './bau-troi.js';
import { boNhan } from './bo-nhan.js';

// Số ngẫu nhiên có hạt giống, để mỗi lần mở các ngôi sao nằm đúng chỗ cũ.
export function taoNgauNhien(hat = 1) {
  let a = hat >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rnd.chuan = () => { // phân bố chuẩn (Box–Muller)
    let u = 0;
    while (u === 0) u = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  };
  return rnd;
}

// Nhãn chữ gắn vào một điểm trong không gian 3D. html có thể chứa <small> cho dòng phụ.
//   lop: dam, mo, vang, xanh, hong, luc, do, tim, tran (không nền), giua; ghép được nhiều lớp.
//   giua: nhãn nằm giữa điểm neo (mặc định nằm bên phải điểm neo, cách 10 điểm ảnh).
//   khiBam: nhãn bấm được.
//   uuTien, giu, tuDo: xem bo-nhan.js. Khung tự giữ nhãn trong phần màn hình nhìn thấy (không chui dưới bảng bài giảng,
//   ô số liệu, thanh trên; chạm mép thì lật sang bên kia điểm neo) nên bài không phải tự né các vùng đó.
// Nhãn trả về có: datChu(html), hien(b), datMau(mau), datUuTien(n).
const LOP_MAU = ['vang', 'xanh', 'hong', 'luc', 'do', 'tim'];
export function taoNhan(html, lop = '', { giua = false, khiBam = null, uuTien = null, giu = false, tuDo = false } = {}) {
  const el = document.createElement('div');
  el.className = `nhan ${lop}${giua ? ' giua' : ''}${khiBam ? ' bam' : ''}`;
  el.innerHTML = html;
  if (khiBam) el.addEventListener('pointerdown', (e) => { e.stopPropagation(); khiBam(e); });
  const o = new CSS2DObject(el);
  o.center.set(giua ? 0.5 : 0, 0.5);
  const so = boNhan.dangKy(o, { uuTien, giu, tuDo });
  o.onAfterRender = () => { if (so.go) boNhan.dangKyLai(so); };      // nhãn từng bị rút khỏi sổ (bài gỡ khỏi cảnh rồi đưa lại)
  o.datChu = (h) => { if (el.innerHTML !== h) el.innerHTML = h; return o; };
  o.hien = (b) => { o.visible = b; return o; };
  o.datUuTien = (n) => { so.uuTien = n; return o; };
  // Đổi màu chữ của nhãn đã dựng: tên một lớp màu ('vang', 'xanh', 'hong', 'luc', 'do', 'tim'), một số 0xRRGGBB, một
  // chuỗi màu CSS, hoặc null để về màu mặc định.
  o.datMau = (mau) => {
    for (const l of LOP_MAU) el.classList.remove(l);
    el.style.color = '';
    if (mau == null || mau === '') return o;
    if (typeof mau === 'string' && LOP_MAU.includes(mau)) el.classList.add(mau);
    else el.style.color = typeof mau === 'number' ? `#${mau.toString(16).padStart(6, '0')}` : mau;
    return o;
  };
  return o;
}
// Đổi màu một nhãn đã dựng (cách gọi rời, cho bài không giữ đối tượng nhãn mà chỉ giữ phần tử của nó).
export function datMauNhan(nhan, mau) { return nhan?.datMau ? nhan.datMau(mau) : nhan; }

// Cho các nhãn tránh nhau theo mức ưu tiên: nhãn ưu tiên cao đặt trước; nhãn thấp hơn mà chạm vào thì khung thử lật nó
// sang bên kia điểm neo, lên trên, xuống dưới, rồi mới tạm ẩn. Nhãn có giu = true không bao giờ bị ẩn vì đè.
// ds: [{ nhan, uuTien, tat?, giu? }] với nhan là đối tượng tạo bởi taoNhan() đã nằm trong cảnh; tat = true thì ẩn hẳn.
// Gọi mỗi khung hình trong capNhat() như trước (camera, rong, cao giữ lại cho tương thích, khung không cần nữa).
// Việc xếp chỗ làm ở bo-nhan.js, sau khi cảnh được vẽ.
export function goNhanDeNhau(ds, camera, rong, cao) {
  if (boNhan.bat) { boNhan.vaoNhom(ds); return; }
  goNhanDeNhauCu(ds, camera, rong, cao);
}
// Bộ cũ (trước bản 3.7), chỉ còn dùng khi tắt bộ bố trí nhãn (boNhan.bat = false) để so sánh.
const _vN = new THREE.Vector3();
function goNhanDeNhauCu(ds, camera, rong, cao) {
  const daNhan = [];
  ds.sort((a, b) => b.uuTien - a.uuTien);
  for (const k of ds) {
    const o = k.nhan;
    if (k.tat) { o.visible = false; continue; }
    o.getWorldPosition(_vN).project(camera);
    if (_vN.z > 1 || _vN.z < -1) { o.visible = false; continue; }
    const el = o.element;
    const chu = el.textContent;
    if (el._chu !== chu || !el._r) {
      el._chu = chu;
      el._r = el.offsetWidth || 0;
      el._c = el.offsetHeight || 0;
    }
    const w = el._r || chu.length * 6.4 + 12, h = el._c || (el.querySelector('small') ? 30 : 16);
    const x = (_vN.x * 0.5 + 0.5) * rong - o.center.x * w, y = (-_vN.y * 0.5 + 0.5) * cao - h / 2;
    let de = false;
    if (!k.giu) {
      for (const q of daNhan) {
        if (x < q[2] + 6 && x + w > q[0] - 6 && y < q[3] + 2 && y + h > q[1] - 2) { de = true; break; }
      }
    }
    o.visible = !de;
    if (!de) daNhan.push([x, y, x + w, y + h]);
  }
}

// Đốm sáng tròn mềm (dùng cho Mặt Trời, sao, hạt).
let _texDom = null;
export function texDom() {
  if (_texDom) return _texDom;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.12, 'rgba(255,255,255,0.95)');
  gr.addColorStop(0.28, 'rgba(255,255,255,0.38)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  _texDom = new THREE.CanvasTexture(c);
  _texDom.colorSpace = THREE.SRGBColorSpace;
  return _texDom;
}

export function taoDom(mau = 0xffffff, coTheGioi = 1, { doMo = 1 } = {}) {
  const m = new THREE.SpriteMaterial({ map: texDom(), color: mau, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: doMo });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(coTheGioi);
  return s;
}

// Một thế giới dài bao nhiêu đơn vị thì chiếm 1 điểm ảnh, ở khoảng cách d trước máy quay.
export function donViMoiDiemAnh(camera, d, caoManHinh) {
  return (2 * d * Math.tan((camera.fov * Math.PI) / 360)) / (caoManHinh * (camera.zoom || 1));
}

// Nền trời ở vô cực. Từ Bản 3 là bầu trời THẬT (src/khung/bau-troi.js): hơn 25 nghìn sao thật có màu, dải Ngân Hà thật.
// Nếu truyền daiNganHa = { tam, cucBac } (véc-tơ đơn vị trong hệ trục cảnh: hướng tâm Ngân Hà và cực bắc thiên hà)
// thì cả bầu trời được xoay cho khớp; không truyền thì dùng một hướng mặc định theo «hat».
// Tuỳ chọn thêm: chomSao: ['Cyg', 'Ori'] hoặc true (vẽ nét chòm sao), nganHa: false (bỏ dải Ngân Hà).
// Kết quả có thêm: huongSao('Deneb'), huongChomSao('Cyg') → véc-tơ đơn vị để gắn nhãn; datDoSang(k).
export function taoNenSao(tuyChon = {}) { return taoBauTroi(tuyChon); }

// Đường tròn nằm trong mặt phẳng XZ.
export function duongTron(r, { n = 128, mau = 0xffffff, doMo = 0.3, net = false } = {}) {
  const pts = new Float32Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    pts[i * 3] = r * Math.cos(a);
    pts[i * 3 + 2] = r * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const mat = net
    ? new THREE.LineDashedMaterial({ color: mau, transparent: true, opacity: doMo, dashSize: r * 0.03, gapSize: r * 0.03, depthWrite: false })
    : new THREE.LineBasicMaterial({ color: mau, transparent: true, opacity: doMo, depthWrite: false });
  const l = new THREE.Line(geo, mat);
  if (net) l.computeLineDistances();
  return l;
}

// Đường gấp khúc có thể cập nhật từng khung hình. mau: 0xRRGGBB; có thể mờ dần về cuối.
export class DuongDong {
  constructor(soDiemToiDa, { mau = 0xffffff, doMo = 1, moDan = false, cong = false } = {}) {
    this.toiDa = soDiemToiDa;
    this.viTri = new Float32Array(soDiemToiDa * 3);
    this.geo = new THREE.BufferGeometry();
    this.thuocTinh = new THREE.BufferAttribute(this.viTri, 3);
    this.thuocTinh.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.thuocTinh);
    this.moDan = moDan;
    this.mauGoc = new THREE.Color(mau);
    if (moDan) {
      this.mau = new Float32Array(soDiemToiDa * 3);
      this.thuocTinhMau = new THREE.BufferAttribute(this.mau, 3);
      this.thuocTinhMau.setUsage(THREE.DynamicDrawUsage);
      this.geo.setAttribute('color', this.thuocTinhMau);
    }
    this.mat = new THREE.LineBasicMaterial({
      color: moDan ? 0xffffff : mau, vertexColors: moDan, transparent: true, opacity: doMo,
      blending: cong || moDan ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false,
    });
    this.line = new THREE.Line(this.geo, this.mat);
    this.line.frustumCulled = false;
    this.n = 0;
  }
  // Gọi sau khi đã ghi n điểm vào this.viTri. Điểm 0 là đầu sáng nhất nếu moDan.
  xong(n, muDan = 1.4) {
    this.n = Math.min(n, this.toiDa);
    this.geo.setDrawRange(0, this.n);
    this.thuocTinh.needsUpdate = true;
    if (this.moDan) {
      const { r, g, b } = this.mauGoc;
      for (let i = 0; i < this.n; i++) {
        const k = Math.pow(1 - i / Math.max(1, this.n - 1), muDan);
        this.mau[i * 3] = r * k; this.mau[i * 3 + 1] = g * k; this.mau[i * 3 + 2] = b * k;
      }
      this.thuocTinhMau.needsUpdate = true;
    }
  }
  dat(i, x, y, z) { const k = i * 3; this.viTri[k] = x; this.viTri[k + 1] = y; this.viTri[k + 2] = z; }
}

// Đường nét đậm (bề rộng tính bằng điểm ảnh CSS, nhìn rõ cả trên màn hình Retina), cập nhật được
// từng khung hình mà không cấp phát lại bộ nhớ. Dùng cho vệt chuyển động, quỹ đạo, tia sáng.
export class DuongDay {
  // quang: > 0 thì vẽ thêm một quầng sáng rộng và mờ quanh nét (độ mờ = quang), cho nét trông như phát sáng.
  // sang: nhân độ sáng của nét (lớn hơn 1 thì nét có quầng sáng của bộ dựng hình; nét chính nên 1,3–2).
  constructor(soDiemToiDa, { mau = 0xffffff, rong = 1.6, doMo = 1, moDan = false, cong = true, net = null, quang = 0, sang = 1 } = {}) {
    this.toiDa = soDiemToiDa;
    this.sang = sang;
    this.diem = new Float32Array(soDiemToiDa * 3);
    const nDoan = Math.max(1, soDiemToiDa - 1);
    this.geo = new LineSegmentsGeometry();
    this.bo = new THREE.InstancedInterleavedBuffer(new Float32Array(nDoan * 6), 6, 1);
    this.bo.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('instanceStart', new THREE.InterleavedBufferAttribute(this.bo, 3, 0));
    this.geo.setAttribute('instanceEnd', new THREE.InterleavedBufferAttribute(this.bo, 3, 3));
    this.moDan = moDan;
    this.mauGoc = new THREE.Color(mau).multiplyScalar(sang);
    if (moDan) {
      this.boMau = new THREE.InstancedInterleavedBuffer(new Float32Array(nDoan * 6), 6, 1);
      this.boMau.setUsage(THREE.DynamicDrawUsage);
      this.geo.setAttribute('instanceColorStart', new THREE.InterleavedBufferAttribute(this.boMau, 3, 0));
      this.geo.setAttribute('instanceColorEnd', new THREE.InterleavedBufferAttribute(this.boMau, 3, 3));
    }
    this.mat = new LineMaterial({
      color: moDan ? 0xffffff : this.mauGoc, linewidth: rong, vertexColors: moDan, transparent: true, opacity: doMo,
      depthWrite: false, blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending,
      dashed: !!net, dashSize: net ? net[0] : 1, gapSize: net ? net[1] : 1,
    });
    this.line = new LineSegments2(this.geo, this.mat);
    this.line.frustumCulled = false;
    if (quang > 0) {
      this.matQuang = new LineMaterial({
        color: moDan ? 0xffffff : this.mauGoc, linewidth: rong * 4.5, vertexColors: moDan, transparent: true, opacity: quang,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      this.quang = new LineSegments2(this.geo, this.matQuang);
      this.quang.frustumCulled = false;
      this.quang.renderOrder = -1;
      this.line.add(this.quang);
    }
    this.geo.instanceCount = 0;
    this.n = 0;
  }
  // Đổi màu, độ mờ khi đang chạy.
  datMau(mau) { this.mauGoc.set(mau).multiplyScalar(this.sang); if (!this.moDan) { this.mat.color.copy(this.mauGoc); this.matQuang?.color.copy(this.mauGoc); } }
  datDoMo(doMo) { this.mat.opacity = doMo; }
  dat(i, x, y, z) { const k = i * 3; this.diem[k] = x; this.diem[k + 1] = y; this.diem[k + 2] = z; }
  // Gọi sau khi đã ghi n điểm bằng dat(). Điểm 0 là đầu sáng nhất nếu moDan.
  xong(n, muDan = 1.3) {
    n = Math.min(n, this.toiDa);
    this.n = n;
    const a = this.bo.array, d = this.diem, nd = Math.max(0, n - 1);
    for (let i = 0; i < nd; i++) {
      const k = i * 3, j = i * 6;
      a[j] = d[k]; a[j + 1] = d[k + 1]; a[j + 2] = d[k + 2]; a[j + 3] = d[k + 3]; a[j + 4] = d[k + 4]; a[j + 5] = d[k + 5];
    }
    this.bo.needsUpdate = true;
    this.geo.instanceCount = nd;
    if (this.moDan) {
      const { r, g, b } = this.mauGoc, m = this.boMau.array;
      for (let i = 0; i < nd; i++) {
        const k0 = Math.pow(1 - i / nd, muDan), k1 = Math.pow(1 - (i + 1) / nd, muDan), j = i * 6;
        m[j] = r * k0; m[j + 1] = g * k0; m[j + 2] = b * k0; m[j + 3] = r * k1; m[j + 4] = g * k1; m[j + 5] = b * k1;
      }
      this.boMau.needsUpdate = true;
    }
    if (this.mat.dashed) this.line.computeLineDistances();
  }
  // Ghi nguyên một mảng điểm [x,y,z,...] rồi hoàn tất.
  datMang(mang, n = mang.length / 3) {
    n = Math.min(n, this.toiDa);
    this.diem.set(mang.length > n * 3 ? mang.subarray(0, n * 3) : mang);
    this.xong(n);
  }
}

// Đường nét đậm cố định từ một mảng điểm.
export function duongDayTinh(mang, tuyChon = {}) {
  const d = new DuongDay(mang.length / 3, tuyChon);
  d.datMang(mang instanceof Float32Array ? mang : new Float32Array(mang));
  return d;
}

// Giải phóng bộ nhớ đồ họa của cả một cảnh.
export function huyCanh(scene) {
  const daHuy = new Set();
  // Ảnh vân: giải phóng bộ nhớ đồ hoạ (nếu sau này được dùng lại, three.js tự nạp lại từ dữ liệu gốc). Không đụng ảnh
  // dùng chung và ảnh của bộ đệm vẽ (bộ đệm vẽ mà giải phóng thì mất nội dung, do nơi tạo ra nó tự lo).
  const huyAnh = (t) => {
    if (!t || !t.isTexture || t === _texDom || t.vtDungChung || t.isRenderTargetTexture || daHuy.has(t)) return;
    daHuy.add(t);
    t.dispose();
  };
  scene.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) {
      for (const k in m) { const v = m[k]; if (v && v.isTexture) huyAnh(v); }
      if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k]?.value; if (v && v.isTexture) huyAnh(v); else if (Array.isArray(v)) v.forEach(huyAnh); }
      m.dispose();
    }
  });
  if (scene.background && scene.background.isTexture) huyAnh(scene.background);
}

export const lamMuot = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (6 * x - 15) + 10));
export const kep = (x, a, b) => Math.min(b, Math.max(a, x));
export const tron = (a, b, k) => a + (b - a) * k;
