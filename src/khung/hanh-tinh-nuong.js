// «Nướng» vân bề mặt thành ảnh: chạy đúng công thức vân của shader (hanh-tinh-glsl.js) trên một bộ vẽ WebGL
// riêng, ẩn, vẽ ra ảnh trải phẳng kinh-vĩ (khớp toạ độ ảnh của SphereGeometry), rồi chép sang khung vẽ 2D để
// làm texture thường. Dùng cho bài cũ gắn vân vào MeshStandardMaterial (taoVanBeMat, veNetDan): bài cũ không
// phải sửa mà vẫn được vân mới (Trái Đất có bờ biển thật). Mỗi lần nướng một ảnh mất vài mili giây trên GPU.
// Bộ vẽ ẩn được giải phóng ngay khi nướng xong mọi ảnh đang chờ.

import * as THREE from 'three';
import { GLSL_NHIEU, GLSL_VAN, LOAI } from './hanh-tinh-glsl.js';
import { texDatLien } from './hanh-tinh-ban-do.js';
import { texBangMau } from './hanh-tinh-be-mat.js';

let _may = null;   // { renderer, scene, cam, mat, sanSang, dangDich, hong }

function taoMay() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true, powerPreference: 'default' });
    renderer.setPixelRatio(1);
    renderer.autoClear = true;
    renderer.setClearColor(0x000000, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uLoai: { value: 3 }, uW: { value: 0.003 }, uT: { value: 0 }, uBang: { value: texBangMau('moc') }, uDat: { value: texDatLien() } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform int uLoai; uniform float uW, uT;
        varying vec2 vUv;
        ${GLSL_NHIEU}
        ${GLSL_VAN}
        void main() {
          float th = (1.0 - vUv.y) * 3.14159265, ph = vUv.x * 6.2831853;
          vec3 p = vec3(-cos(ph) * sin(th), cos(th), sin(ph) * sin(th));
          vec4 v = vanTheoLoai(uLoai, p, vUv, uW, uT);
          if (uLoai == 10) gl_FragColor = vec4(vec3(v.a), v.a);   // mây: trắng, độ trong suốt ở kênh alpha (đã nhân trước)
          else gl_FragColor = vec4(raSRGB(v.rgb), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    });
    const scene = new THREE.Scene();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { renderer, scene, cam, mat, sanSang: false, dangDich: false, hong: false };
  } catch (e) {
    return { hong: true };
  }
}

// Có nướng được không (máy có WebGL2). Gọi lại nhiều lần không tốn.
export function layMayNuong() {
  if (!_may) _may = taoMay();
  return _may;
}

// Chuẩn bị (dịch shader) không chặn khung hình nếu trình duyệt hỗ trợ. Trả true khi đã sẵn sàng.
export function chuanBiNuong() {
  const m = layMayNuong();
  if (m.hong) return false;
  if (m.sanSang) return true;
  if (!m.dangDich) {
    m.dangDich = true;
    const xong = () => { m.sanSang = true; };
    try {
      const p = m.renderer.compileAsync ? m.renderer.compileAsync(m.scene, m.cam) : null;
      if (p && p.then) p.then(xong, () => { m.hong = true; });
      else { m.renderer.compile(m.scene, m.cam); xong(); }
    } catch (e) { m.hong = true; }
  }
  return m.sanSang;
}

// Nướng vân của thiên thể id ('thuy' … 'haiVuong', 'may', 'trang') ra khung vẽ 2D rong × cao.
export function nuongVan(id, rong, cao) {
  const m = layMayNuong();
  if (m.hong) return null;
  const loai = LOAI[id];
  if (!loai) return null;
  m.mat.uniforms.uLoai.value = loai;
  m.mat.uniforms.uW.value = (2 * Math.PI) / rong;
  m.mat.uniforms.uBang.value = texBangMau(id === 'moc' ? 'moc' : 'tho');
  m.renderer.setSize(rong, cao, false);
  m.renderer.render(m.scene, m.cam);
  const gl = m.renderer.getContext();
  if (gl.isContextLost && gl.isContextLost()) { m.hong = true; return null; }
  const c = document.createElement('canvas');
  c.width = rong; c.height = cao;
  const g = c.getContext('2d');
  g.globalCompositeOperation = 'copy';
  g.drawImage(m.renderer.domElement, 0, 0);
  return c;
}

// Giải phóng bộ vẽ ẩn (lần sau cần thì tạo lại).
export function giaiPhongMayNuong() {
  if (!_may || _may.hong) { _may = null; return; }
  try { _may.mat.dispose(); _may.renderer.dispose(); _may.renderer.forceContextLoss(); } catch (e) { /* bỏ qua */ }
  _may = null;
}
