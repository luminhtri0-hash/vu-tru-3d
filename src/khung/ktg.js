import { dich as dichChu } from '../ngon-ngu/dich.js';
// Công cụ vẽ sơ đồ không-thời gian trong 3D, dùng chung cho các bài của Phần 2 trở đi.
//
// QUY ƯỚC TRỤC (mọi bài không-thời gian đều theo):
//   thời gian (ct) hướng LÊN  → trục Y của three.js
//   chiều không gian x        → trục X
//   chiều không gian y        → trục Z
// Dùng đơn vị c = 1 (một đơn vị thời gian ứng với một đơn vị độ dài) nên tia sáng nghiêng đúng 45°.

import * as THREE from 'three';
import { DuongDay, duongDayTinh, taoNhan, taoDom } from './ve.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('chung', khoa, goc, thamSo);

// Bảng màu thống nhất cho các sơ đồ không-thời gian.
export const MAU_KTG = {
  anhSang: 0xf3c66f,     // tia sáng, nón ánh sáng
  hienTai: 0x8fe3a8,     // mặt phẳng «bây giờ»
  thoiGian: 0x7fcaff,    // trục thời gian, đồng hồ
  khongGian: 0xffffff,   // lưới không gian
  quaKhu: 0x6f8cff,
  tuongLai: 0xffb86b,
  hong: 0xff7aa8,
  tim: 0xc8aaff,
  do: 0xff8a73,
};

// (x, y, ct) của vật lý → Vector3 của three.js
export const vt = (x, y, t) => new THREE.Vector3(x, t, y);

const matNen = (mau, doMo, cong = false) => new THREE.MeshBasicMaterial({
  color: mau, transparent: true, opacity: doMo, side: THREE.DoubleSide, depthWrite: false,
  blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending,
});

// Mũi tên từ điểm «tu» tới điểm «den» (mảng [X, Y, Z] trong tọa độ three.js).
export function muiTen(tu, den, { mau = 0xffffff, rong = 1.6, doMo = 0.9, dau = 0.2 } = {}) {
  const g = new THREE.Group();
  const a = new THREE.Vector3(...tu), b = new THREE.Vector3(...den);
  const huong = b.clone().sub(a);
  const dai = huong.length() || 1;
  huong.normalize();
  const cuoiThan = b.clone().addScaledVector(huong, -Math.min(dau, dai) * 0.8);
  g.add(duongDayTinh([a.x, a.y, a.z, cuoiThan.x, cuoiThan.y, cuoiThan.z], { mau, rong, doMo, cong: false }).line);
  const non = new THREE.Mesh(new THREE.ConeGeometry(dau * 0.36, dau, 16), new THREE.MeshBasicMaterial({ color: mau, transparent: true, opacity: doMo }));
  non.position.copy(b).addScaledVector(huong, -dau / 2);
  non.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), huong);
  g.add(non);
  return g;
}

// Ba trục x, y, thời gian có mũi tên và nhãn. x, y, t: [từ, tới]. Trục nào để null thì không vẽ.
export function trucKTG({
  x = [-5, 5], y = [-5, 5], t = [0, 8], goc = [0, 0, 0],
  nhanX = 'x', nhanY = 'y', nhanT = chuCanh("canh.thoi-gian", "thời gian"),
  mau = 0xffffff, mauT = MAU_KTG.thoiGian, doMo = 0.55, rong = 1.4,
} = {}) {
  const g = new THREE.Group();
  const [gx, gy, gt] = goc;
  const them = (tu, den, m, nhan, lop) => {
    g.add(muiTen(tu, den, { mau: m, rong, doMo }));
    if (nhan) {
      const n = taoNhan(nhan, `${lop} tran`);
      n.position.set(...den);
      g.add(n);
    }
  };
  if (x) them([x[0], gt, gy], [x[1], gt, gy], mau, nhanX, 'mo');
  if (y) them([gx, gt, y[0]], [gx, gt, y[1]], mau, nhanY, 'mo');
  if (t) them([gx, t[0], gy], [gx, t[1], gy], mauT, nhanT, 'xanh');
  return g;
}

// Đồng hồ chung cho các hiệu ứng chuyển động nhẹ của sơ đồ (xung sáng chạy trên nón, ánh lướt trên kính).
const gio = () => performance.now() * 0.001;

// Lưới phẳng căng bởi hai vectơ u, v xuất phát từ «goc» (đều là mảng [X, Y, Z] của three.js).
// soU, soV: số ô theo mỗi hướng. Dùng cho sàn không gian (u, v nằm ngang) hoặc sơ đồ dựng đứng.
// Từ Bản 3 lưới được vẽ trong shader: nét mảnh đều một điểm ảnh rưỡi dù nhìn gần hay xa, cứ «chinh» ô có một
// nét đậm hơn, ô quá nhỏ trên màn hình thì nét phụ tự mờ đi (không rối), và lưới mờ dần về phía mép.
export function luoi({ goc = [0, 0, 0], u = [1, 0, 0], v = [0, 0, 1], soU = 10, soV = 10, mau = 0xffffff, doMo = 0.12, chinh = 5, moMep = 0.5 } = {}) {
  const G = new THREE.Vector3(...goc), U = new THREE.Vector3(...u).multiplyScalar(soU), V = new THREE.Vector3(...v).multiplyScalar(soV);
  const dinh = [G, G.clone().add(U), G.clone().add(U).add(V), G.clone().add(V)];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(dinh.flatMap((d) => [d.x, d.y, d.z]), 3));
  geo.setAttribute('aO', new THREE.Float32BufferAttribute([0, 0, soU, 0, soU, soV, 0, soV], 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uSo: { value: new THREE.Vector2(soU, soV) }, uChinh: { value: chinh }, uMep: { value: moMep } },
    vertexShader: /* glsl */ `
      attribute vec2 aO; varying vec2 vO;
      void main() { vO = aO; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uDoMo, uChinh, uMep; uniform vec2 uSo; varying vec2 vO;
      float net(vec2 o, float rong) {
        vec2 d = max(fwidth(o), vec2(1e-6));
        vec2 g = abs(fract(o - 0.5) - 0.5) / d;                 // khoảng cách tới nét gần nhất, tính bằng điểm ảnh
        return 1.0 - smoothstep(rong * 0.5 - 0.5, rong * 0.5 + 0.7, min(g.x, g.y));
      }
      void main() {
        vec2 d = fwidth(vO);
        float oPx = 1.0 / max(max(d.x, d.y), 1e-6);             // một ô rộng bao nhiêu điểm ảnh
        float phu = net(vO, 1.1) * smoothstep(5.0, 16.0, oPx);  // ô nhỏ hơn chừng 5 điểm ảnh: bỏ nét phụ
        float chinh = uChinh > 0.5 ? net(vO / uChinh, 1.5) : 0.0;
        vec2 q = (vO / uSo - 0.5) * 2.0;                        // −1…1 trên mặt lưới
        float mep = 1.0 - uMep * smoothstep(0.35, 1.0, max(abs(q.x), abs(q.y)));
        float a = uDoMo * mep * max(phu, chinh * 2.1);
        if (a < 0.002) discard;
        gl_FragColor = vec4(uMau, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  mat.tuyenTinh = true;
  mat.opacity = doMo;            // để mã cũ đổi .material.opacity vẫn có tác dụng
  mat.color = mat.uniforms.uMau.value;
  const m = new THREE.Mesh(geo, mat);
  m.onBeforeRender = () => { mat.uniforms.uDoMo.value = mat.opacity; };
  m.renderOrder = -2;
  return m;
}

// Sàn không gian: lưới nằm ngang tại thời điểm t, tâm ở gốc, nửa cạnh «nua», mỗi ô rộng «o».
export function luoiSan({ nua = 5, o = 1, t = 0, mau = 0xffffff, doMo = 0.12 } = {}) {
  const so = Math.round((2 * nua) / o);
  return luoi({ goc: [-nua, t, -nua], u: [o, 0, 0], v: [0, 0, o], soU: so, soV: so, mau, doMo });
}

// Mặt phẳng «bây giờ»: tấm kính mỏng nằm ngang có viền. Gọi .datT(t) để nâng lên hạ xuống.
// Từ Bản 3: kính sáng dần ra mép, có một dải ánh lướt chậm qua mặt, viền phát sáng.
export function matHienTai({ nua = 5, mau = MAU_KTG.hienTai, doMo = 0.07, vien = 0.55 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uT: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uDoMo, uT; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        vec2 q = abs(vUv - 0.5) * 2.0;
        float mep = smoothstep(0.72, 1.0, max(q.x, q.y));                 // sáng dần ra mép
        float nghieng = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.0);   // nhìn sát mặt thì kính đậm hơn
        float luot = exp(-pow((vUv.x + vUv.y - fract(uT * 0.045) * 3.0 + 0.5) * 5.0, 2.0));   // dải ánh lướt chéo
        float a = uDoMo * (0.7 + 1.5 * mep + 0.15 * nghieng + 0.45 * luot);
        gl_FragColor = vec4(uMau * (1.0 + 0.5 * mep), min(a, 0.3));
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  mat.tuyenTinh = true;
  mat.opacity = doMo;
  mat.color = mat.uniforms.uMau.value;
  const tam = new THREE.Mesh(new THREE.PlaneGeometry(2 * nua, 2 * nua), mat);
  tam.rotation.x = -Math.PI / 2;
  tam.renderOrder = 2;
  tam.onBeforeRender = () => { mat.uniforms.uT.value = gio(); mat.uniforms.uDoMo.value = mat.opacity; };
  g.add(tam);
  const k = nua;
  g.add(duongDayTinh([-k, 0, -k, k, 0, -k, k, 0, k, -k, 0, k, -k, 0, -k], { mau, rong: 1.5, doMo: vien, cong: true, sang: 1.5 }).line);
  g.datT = (t) => { g.position.y = t; };
  return g;
}

// Nón ánh sáng có đỉnh tại gốc của nhóm (đặt nhóm .position tới sự kiện cần vẽ).
// cao: nón vươn tới ct = ±cao. tren / duoi: vẽ nón tương lai / nón quá khứ.
// Từ Bản 3 mặt nón vẽ bằng shader: viền sáng theo góc nhìn (thấy rõ khối nón), «soDuong» tia mảnh chạy dọc mặt nón,
// và các vòng sáng chạy với tốc độ ánh sáng: toả ra trên nón tương lai, dồn về đỉnh trên nón quá khứ.
// Vòng sáng chạy theo giờ thật, chỉ để mặt nón «sống», không biểu diễn một tín hiệu cụ thể nào.
export function nonAnhSang({ cao = 4, tren = true, duoi = true, mau = MAU_KTG.anhSang, mauDuoi = null, doMo = 0.1, soDuong = 12, vanh = true, xung = true } = {}) {
  const g = new THREE.Group();
  const mot = (dau, m) => {
    const hinh = new THREE.ConeGeometry(cao, cao, 96, 1, true);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMau: { value: new THREE.Color(m) }, uDoMo: { value: doMo }, uT: { value: 0 },
        uSoTia: { value: soDuong }, uChieu: { value: dau }, uSoXung: { value: xung ? Math.max(1, Math.round(cao / 2)) : 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uMau; uniform float uDoMo, uT, uSoTia, uChieu, uSoXung; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          float h = 1.0 - vUv.y;                                            // 0 ở đỉnh, 1 ở miệng nón
          float vien = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 1.5);
          float o = vUv.x * uSoTia;
          float tia = uSoTia > 0.5 ? 1.0 - smoothstep(0.1, 1.3, abs(fract(o - 0.5) - 0.5) / max(fwidth(o), 1e-6)) : 0.0;
          float vong = 0.0;
          if (uSoXung > 0.5) {
            float f = fract(h * uSoXung - uChieu * uT * 0.16);
            vong = smoothstep(0.86, 0.985, f) * (1.0 - smoothstep(0.985, 1.0, f)) * smoothstep(0.02, 0.18, h);
          }
          float a = uDoMo * (0.7 + 3.4 * vien + 2.6 * tia * (0.35 + 0.65 * smoothstep(0.0, 0.25, h)) + 2.4 * vong);
          gl_FragColor = vec4(uMau * a, 1.0);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    mat.tuyenTinh = true;
    mat.opacity = doMo;
    mat.color = mat.uniforms.uMau.value;
    const luoiNon = new THREE.Mesh(hinh, mat);
    // ConeGeometry có đỉnh ở +cao/2: nón tương lai phải lật ngược để đỉnh ở gốc, miệng mở lên trên
    if (dau > 0) { luoiNon.rotation.x = Math.PI; luoiNon.position.y = cao / 2; } else luoiNon.position.y = -cao / 2;
    luoiNon.renderOrder = 3;
    luoiNon.onBeforeRender = () => { mat.uniforms.uT.value = gio(); mat.uniforms.uDoMo.value = mat.opacity; };
    g.add(luoiNon);
    if (vanh) {
      const q = [];
      for (let i = 0; i <= 128; i++) { const a = (i / 128) * 2 * Math.PI; q.push(cao * Math.cos(a), dau * cao, cao * Math.sin(a)); }
      g.add(duongDayTinh(q, { mau: m, rong: 1.6, doMo: Math.min(1, doMo * 7), cong: true, sang: 1.4 }).line);
    }
  };
  if (tren) mot(1, mau);
  if (duoi) mot(-1, mauDuoi ?? mau);
  return g;
}

// Chấm sáng đánh dấu một sự kiện. Từ Bản 3: lõi sáng (có quầng) và một vòng sóng nhỏ lan ra rồi tắt, lặp lại chậm.
let _texVong = null;
function texVong() {
  if (_texVong) return _texVong;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const k = c.getContext('2d');
  const gr = k.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.62, 'rgba(255,255,255,0)');
  gr.addColorStop(0.8, 'rgba(255,255,255,0.9)');
  gr.addColorStop(0.9, 'rgba(255,255,255,0.25)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  k.fillStyle = gr;
  k.fillRect(0, 0, 128, 128);
  _texVong = new THREE.CanvasTexture(c);
  _texVong.colorSpace = THREE.SRGBColorSpace;
  _texVong.vtDungChung = true;
  return _texVong;
}
export function suKien(mau = 0xffffff, co = 0.32, { vong = true } = {}) {
  const s = taoDom(mau, co);
  s.material.color.multiplyScalar(1.5);
  if (vong) {
    const mv = new THREE.SpriteMaterial({ map: texVong(), color: mau, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
    const v = new THREE.Sprite(mv);
    const lech = Math.random() * 2.4;
    v.onBeforeRender = () => {
      const f = ((gio() + lech) % 2.4) / 2.4;
      v.scale.setScalar(0.7 + 1.5 * f);
      mv.opacity = s.material.opacity * 0.5 * (1 - f) * (1 - f) * Math.min(1, f * 8);
      mv.color.copy(s.material.color);
    };
    s.add(v);
  }
  return s;
}

// Đường thế giới từ hàm vị trí theo thời gian: ham(t) → [x, y]. Trả về DuongDay (thêm .line vào cảnh).
export function duongTheGioi(ham, t0, t1, n = 200, tuyChon = {}) {
  const d = new DuongDay(n, { rong: 2.2, cong: true, ...tuyChon });
  for (let i = 0; i < n; i++) {
    const t = t0 + ((t1 - t0) * i) / (n - 1);
    const [x, y] = ham(t);
    d.dat(i, x, t, y);
  }
  d.xong(n);
  return d;
}

// Vòng tròn nằm ngang (trong mặt phẳng không gian) tại thời điểm t: ví dụ mặt sóng ánh sáng lúc đó.
export function vongNgang(r, t = 0, { mau = MAU_KTG.anhSang, rong = 1.6, doMo = 0.9, n = 96, tam = [0, 0] } = {}) {
  const q = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; q.push(tam[0] + r * Math.cos(a), t, tam[1] + r * Math.sin(a)); }
  return duongDayTinh(q, { mau, rong, doMo, cong: true });
}
