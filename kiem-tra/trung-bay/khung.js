// Phòng trưng bày: xem thử một mô-đun hình (thiên thể, đồ vật, hiệu ứng…) bằng đúng bộ dựng hình của app
// (dải sáng rộng, quầng sáng, nén sáng) mà không cần dựng cả ứng dụng.
//
// Mô-đun cần xem (tệp «thử») xuất mặc định:
//   export default {
//     mayAnh: { viTri: [x, y, z], dich: [x, y, z], fov: 40 },      // tuỳ chọn
//     hinh: { quang: 0.5, nguong: 0.85 },                          // tuỳ chọn: ghi đè cấu hình DungHinh
//     tao(app) { … return { scene, capNhat(dt) {} }; },            // app: { camera, dk, renderer, rong, cao, tham }
//   };
//
// Tham số đường dẫn: tua=<giây cho hình chạy trước>, goc=x,y,z (vị trí máy quay), dich=x,y,z, fov=<độ>,
//   dung=1 (đứng yên, không gọi capNhat nữa sau khi tua), và mọi tham số riêng mà tệp thử tự đọc ở app.tham.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { DungHinh } from '../../src/khung/dung-hinh.js';
import thu from 'ao:thu';

const tham = new URLSearchParams(location.search);
const so3 = (ten, md) => (tham.has(ten) ? tham.get(ten).split(',').map(Number) : md);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x010206, 1);
document.getElementById('san-khau').append(renderer.domElement);
const loi = [];
renderer.debug.onShaderError = (gl, ct, vs, fs) => {
  const tin = `${gl.getProgramInfoLog(ct) || ''} ${gl.getShaderInfoLog(vs) || ''} ${gl.getShaderInfoLog(fs) || ''}`.trim().slice(0, 600);
  loi.push(tin); console.error('Shader hỏng:', tin); baoLoi();
};
window.addEventListener('error', (e) => { loi.push(String(e.error?.stack || e.message).slice(0, 600)); baoLoi(); });
function baoLoi() { const el = document.getElementById('loi'); el.hidden = false; el.textContent = loi.join('\n\n'); }

const dungHinh = new DungHinh(renderer);
dungHinh.datCauHinh(thu.hinh);
const nhan = new CSS2DRenderer({ element: document.getElementById('lop-nhan') });
const m = thu.mayAnh || {};
const camera = new THREE.PerspectiveCamera(Number(tham.get('fov')) || m.fov || 40, 1, m.gan ?? 0.01, m.xa ?? 1e5);
camera.position.set(...so3('goc', m.viTri ?? [3, 2, 6]));
const dk = new OrbitControls(camera, renderer.domElement);
dk.enableDamping = true;
dk.target.set(...so3('dich', m.dich ?? [0, 0, 0]));

const app = { camera, dk, renderer, rong: 1, cao: 1, tham, dungHinh };
function doiKichThuoc() {
  const w = window.innerWidth, h = window.innerHeight;
  app.rong = w; app.cao = h;
  renderer.setSize(w, h);
  dungHinh.datKichThuoc(w, h, renderer.getPixelRatio(), renderer.getPixelRatio() < 1.5);   // trang trưng bày: khử răng cưa khi độ nét thấp, như app trên màn hình thường
  nhan.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
doiKichThuoc();
window.addEventListener('resize', doiKichThuoc);

let canh = null;
try { canh = thu.tao(app); } catch (e) { loi.push(String(e?.stack || e)); baoLoi(); }
window.__tb = { app, canh, loi };

let dung = false;
function buoc(dt) {
  dk.update();
  if (!canh) return;
  try { if (!dung) canh.capNhat?.(dt, dt); } catch (e) { loi.push(String(e?.stack || e)); baoLoi(); canh = null; return; }
  dungHinh.ve(canh.scene, camera, dt);
  nhan.render(canh.scene, camera);
}
if (tham.has('tua')) { const n = Math.round(Number(tham.get('tua')) * 60); for (let i = 0; i < n; i++) buoc(1 / 60); }
dung = tham.get('dung') === '1';
let truoc = performance.now();
(function vong(now) {
  requestAnimationFrame(vong);
  const dt = Math.min(0.1, Math.max(0, (now - truoc) / 1000)); truoc = now;
  buoc(dt);
})(truoc);
document.title = loi.length ? 'TRUNG-BAY:LOI' : 'TRUNG-BAY:DAT';
