// Tên lửa và ngọn lửa phụt.
//
// taoLuaPhut({ banKinh = 0.27, doDai = 2.2, mau = 'cam' }) → { nhom, datLucDay(k, giay?), lucDay, capNhat(dt) }
//   Ngọn lửa phụt xuống theo −y từ gốc (miệng vòi). Gồm: lõi trắng nóng, luồng cam có kim cương sóng xung kích,
//   hạt lửa bay ra (tính hết trong shader, không cấp phát), quầng ở miệng vòi, đèn điểm màu lửa rọi lên thân.
//   k = 0 tắt hẳn; 1 là lực đẩy đầy; chuyển mượt.
//
// taoTenLua({ cao = 4.2, banKinh = 0.42, mauNhan = 0xff8a73, choBuong = null, caoMui, luc = 0, doDaiLua }) →
//   { nhom, lua, datLucDay(k, giay?), lucDay, neoBuong, miengVoi, capNhat(dt) }
//   - Không có choBuong: tên lửa nguyên chiếc (thân, ba cửa sổ, bốn cánh, mũi, vòi phun). Gốc ở miệng vòi,
//     thân dựng theo +y, cao tổng = cao + 0,38.
//   - choBuong = { rong, cao, sau } (ví dụ buồng 3 × 4 × 3): tên lửa chở buồng kính ở giữa (khoang hàng trong
//     suốt). Gốc trùng với gốc của buồng (tâm mặt sàn): đặt buồng vào neoBuong (hoặc cùng vị trí) là khớp.
//     Phần động cơ nằm dưới sàn, mũi nằm trên trần, bốn cột chống ở bốn góc.

import * as THREE from 'three';
import { LoXo, vlKimLoai, vlSon, vlBong, vlSang, vlKinh, hopBo, ghep, dat, domSang, demTamGiac } from './do-vat-chung.js';

const VS_LUA = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz; vN = normalMatrix * normal;
    gl_Position = projectionMatrix * mv;
  }`;
const FS_LUA = /* glsl */ `
  uniform float uGio, uLuc, uSang, uKim, uDoDac;
  uniform vec3 uMauLoi, uMauNgoai;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  float bam(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nhieu(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(bam(i), bam(i + vec2(1, 0)), f.x), mix(bam(i + vec2(0, 1)), bam(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    float t = clamp(1.0 - vUv.y, 0.0, 1.0);                    // 0 ở miệng vòi, 1 ở đuôi lửa (kẹp: khử răng cưa có thể nội suy ra ngoài tam giác)
    float ndv = clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
    float loi = pow(ndv, uDoDac);                              // đặc ở giữa, mỏng ở mép: trông có khối
    vec2 q = vec2(vUv.x * 7.0, t * 4.0 - uGio * 6.5);
    float n = nhieu(q) * 0.6 + nhieu(q * 2.3 + 7.1) * 0.4;
    float song = 0.62 + 0.55 * n;
    float tat = pow(max(1.0 - t, 0.0), 1.5) * smoothstep(0.0, 0.03, t + 0.005) * (1.0 - smoothstep(0.75 - 0.25 * n, 1.0, t));
    float k0 = clamp(0.5 + 0.5 * cos(t * 6.2832 * 3.2 - 0.9), 0.0, 1.0);
    float k2 = k0 * k0; k2 = k2 * k2 * k0 * k0 * k0 * k0 * k0 * k0;   // mũ 10 (nhân tay: pow mũ lớn gây NaN trên vài trình điều khiển)
    float kim = k2 * (1.0 - smoothstep(0.0, 0.75, t)) * uKim;   // kim cương xung kích
    vec3 mau = mix(uMauLoi, uMauNgoai, smoothstep(0.0, 0.45, t + 0.15 * n));
    float a = tat * loi * song * uLuc;
    vec3 c = mau * a * uSang + uMauLoi * kim * loi * uLuc * 2.2;
    gl_FragColor = vec4(c, 1.0);
  }`;
const VS_HAT = /* glsl */ `
  attribute vec4 aHat;
  uniform float uGio, uLuc, uDai, uR, uCao;
  varying float vT; varying float vK;
  void main() {
    float tocDo = (0.55 + 0.6 * aHat.y) * (0.5 + 0.8 * uLuc);
    float song = fract(aHat.x + uGio * tocDo);
    float g = aHat.z * 6.2832;
    float r = uR * (0.12 + 1.25 * song * (0.6 + 0.6 * aHat.w)) * sqrt(aHat.w);
    vec3 p = vec3(cos(g) * r, -song * uDai * (0.85 + 0.45 * aHat.y), sin(g) * r);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float co = uR * (0.3 + 1.3 * song) * (0.6 + 0.8 * aHat.y);
    gl_PointSize = max(1.0, co * uCao * projectionMatrix[1][1] * 0.5 / max(0.05, -mv.z));
    vT = song; vK = aHat.y;
  }`;
const FS_HAT = /* glsl */ `
  uniform vec3 uMau1, uMau2; uniform float uLuc;
  varying float vT; varying float vK;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float d = dot(q, q);
    if (d > 1.0) discard;
    float a = (1.0 - d); a *= a;
    vec3 c = mix(uMau1, uMau2, smoothstep(0.0, 0.5, vT));
    float tat = (1.0 - vT) * (1.0 - vT) * smoothstep(0.0, 0.06, vT);
    gl_FragColor = vec4(c * a * tat * uLuc * (0.25 + 0.3 * vK), 1.0);
  }`;

// Hình luồng lửa: tiện tròn, dài 1 (từ y = 0 xuống y = −1), phình nhẹ rồi thon về đuôi.
function hinhLua(r0, phinh, thon, n = 22) {
  const p = [];
  for (let i = n; i >= 0; i--) {
    const t = i / n;
    const r = r0 * (1 + phinh * Math.sin(Math.PI * Math.min(1, t * 1.6) * 0.5)) * (1 - thon * t * t) + 1e-3;
    p.push(new THREE.Vector2(r, -t));
  }
  return new THREE.LatheGeometry(p, 28);
}

const MAU_LUA = {
  cam: { loi: 0xe6eeff, ngoai: 0xff7a26, hat1: 0xffd9a0, hat2: 0xff5a1e, quang: 0xffa050 },
  xanh: { loi: 0xe8f4ff, ngoai: 0x4f8dff, hat1: 0xbfe0ff, hat2: 0x3f6dff, quang: 0x8fb8ff },
};

let _matHat = null;
export function taoLuaPhut({ banKinh = 0.27, doDai = 2.2, mau = 'cam', soHat = 220, anhSang = true } = {}) {
  const M = MAU_LUA[mau] || MAU_LUA.cam;
  const nhom = new THREE.Group();
  nhom.name = 'lua-phut';
  const taoVl = (loi, ngoai, sang, kim, doDac) => {
    const m = new THREE.ShaderMaterial({
      vertexShader: VS_LUA, fragmentShader: FS_LUA, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uGio: { value: 0 }, uLuc: { value: 0 }, uSang: { value: sang }, uKim: { value: kim }, uDoDac: { value: doDac },
        uMauLoi: { value: new THREE.Color(loi) }, uMauNgoai: { value: new THREE.Color(ngoai) },
      },
    });
    m.tuyenTinh = true;
    return m;
  };
  const vlNgoai = taoVl(M.loi, M.ngoai, 2.4, 0.0, 1.3);
  const vlLoi = taoVl(M.loi, 0xffd59a, 3.2, 1.0, 2.4);
  const ngoai = new THREE.Mesh(hinhLua(banKinh * 0.98, 0.38, 0.85), vlNgoai);
  const loi = new THREE.Mesh(hinhLua(banKinh * 0.62, 0.05, 0.92), vlLoi);
  ngoai.renderOrder = 4; loi.renderOrder = 5;
  ngoai.frustumCulled = loi.frustumCulled = false;
  nhom.add(ngoai, loi);

  // hạt lửa
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(soHat * 3), 3));
  const hat = new Float32Array(soHat * 4);
  let s = 12345;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < soHat * 4; i++) hat[i] = r();
  g.setAttribute('aHat', new THREE.BufferAttribute(hat, 4));
  const vlHat = new THREE.ShaderMaterial({
    vertexShader: VS_HAT, fragmentShader: FS_HAT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uGio: { value: 0 }, uLuc: { value: 0 }, uDai: { value: doDai }, uR: { value: banKinh }, uCao: { value: 1000 },
      uMau1: { value: new THREE.Color(M.hat1).multiplyScalar(3) }, uMau2: { value: new THREE.Color(M.hat2).multiplyScalar(1.5) },
    },
  });
  vlHat.tuyenTinh = true;
  const diem = new THREE.Points(g, vlHat);
  diem.frustumCulled = false;
  diem.renderOrder = 6;
  const _c = new THREE.Vector2();
  diem.onBeforeRender = (renderer) => { renderer.getDrawingBufferSize(_c); vlHat.uniforms.uCao.value = _c.y; };
  nhom.add(diem);

  // quầng ở miệng vòi và đèn rọi
  const quang = domSang(M.quang, banKinh * 4, 1.8);
  quang.position.y = -banKinh * 0.4;
  nhom.add(quang);
  let den = null;
  if (anhSang) {
    den = new THREE.PointLight(M.quang, 0, 0, 2);
    den.position.y = -banKinh * 2.2;
    nhom.add(den);
  }

  const lx = new LoXo(0, 0.45);
  let gio = 0;
  const ketQua = {
    nhom,
    get lucDay() { return lx.dich; },
    get hienTai() { return Math.max(0, lx.v); },
    datLucDay(k, giay = 0.45) { lx.datGiay(giay).dat(Math.max(0, k)); },
    capNhat(dt) {
      gio += dt;
      const k = Math.max(0, lx.buoc(dt));
      const rung = 1 + 0.05 * Math.sin(gio * 37) + 0.03 * Math.sin(gio * 61 + 1);
      const dai = doDai * (0.35 + 0.65 * Math.min(k, 1.4)) * rung;
      nhom.visible = k > 0.003;
      ngoai.scale.set(0.85 + 0.15 * k, dai, 0.85 + 0.15 * k);
      loi.scale.set(1, dai * 0.42, 1);
      for (const m of [vlNgoai, vlLoi, vlHat]) { m.uniforms.uGio.value = gio; m.uniforms.uLuc.value = Math.min(k, 1.3); }
      vlHat.uniforms.uDai.value = dai * 1.15;
      quang.material.opacity = Math.min(1, k) * (0.85 + 0.15 * Math.sin(gio * 29));
      quang.scale.setScalar(banKinh * (2.6 + 1.6 * k));
      if (den) den.intensity = 2.2 * k * rung * banKinh * banKinh / 0.07;
    },
  };
  ketQua.capNhat(0);
  return ketQua;
}

// Mặt cắt dọc (bán kính, y) → hình tiện (điểm đi từ dưới lên).
const tien = (ds, canh = 36) => new THREE.LatheGeometry(ds.map(([r, y]) => new THREE.Vector2(r, y)), canh);

// Vòi phun: chuông loe, mặt trong phát sáng theo lực đẩy.
function taoVoi(rRa, cao, vlVo) {
  const g = new THREE.Group();
  const rH = rRa * 0.42;
  const ngoai = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; ngoai.push([rH + (rRa - rH) * Math.pow(1 - t, 1.7), t * cao * 0.86]); }
  ngoai.push([rH * 1.25, cao * 0.92], [rH * 1.4, cao]);
  const vo = new THREE.Mesh(tien(ngoai, 32), vlVo);
  vo.material.side = THREE.DoubleSide;
  const trong = tien(ngoai.slice(0, 11).map(([r, y]) => [r * 0.96, y + 0.004]), 32);
  const vlTrong = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
  const lop = new THREE.Mesh(trong, vlTrong);
  // vành gia cố quanh miệng vòi
  const vanh = new THREE.Mesh(new THREE.TorusGeometry(rRa, rRa * 0.035, 6, 36), vlKimLoai(0x8c7a64, 0.35));
  vanh.rotation.x = Math.PI / 2;
  g.add(vo, lop, vanh);
  return { g, vlTrong };
}

// Cánh đuôi: hình thang vuốt, đùn dày, bo mép.
function hinhCanh(goc, ngon, cao, vuot, day) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(ngon, -vuot);
  s.lineTo(ngon, -vuot + cao * 0.35);
  s.lineTo(0, cao);
  s.lineTo(0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: day, bevelEnabled: true, bevelThickness: day * 0.4, bevelSize: day * 0.4, bevelSegments: 2, curveSegments: 4 });
  g.translate(goc, 0, -day / 2);
  return g;
}

export function taoTenLua({
  cao = 4.2, banKinh = 0.42, mau = 0xb9b6af, mauNhan = 0xff8a73, choBuong = null, caoMui = null, luc = 0, doDaiLua = null,
} = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'ten-lua';
  const vlVo = vlBong(mau, 0.45, { clearcoat: 0.15 });
  const vlNhan = vlBong(mauNhan, 0.4);
  const vlCanh = vlKimLoai(0x6a707c, 0.42);
  const vlToi = vlKimLoai(0x3b3f47, 0.4);
  const vlVoi = vlKimLoai(0x4a4440, 0.38);
  const vlKhung = vlKimLoai(0x9aa1ad, 0.3);
  const neoBuong = new THREE.Object3D();
  nhom.add(neoBuong);
  let lua, voi, mieng;

  if (!choBuong) {
    // ---------------- tên lửa nguyên chiếc
    const R = banKinh, y0 = 0.38, yC = y0 + cao * 0.6, Ln = cao - (yC - y0);
    const p = [[0.0, y0], [R * 0.62, y0], [R * 0.74, y0 + 0.05], [R, y0 + 0.24], [R, yC]];
    for (let i = 1; i <= 12; i++) { const f = i / 12; p.push([Math.max(0.0, R * Math.pow(1 - Math.pow(f, 1.7), 0.72)), yC + f * Ln]); }
    nhom.add(new THREE.Mesh(tien(p, 40), vlVo));
    // dải màu, đường ghép tấm
    const dai = (ya, yb, m, dr = 0.004) => nhom.add(new THREE.Mesh(tien([[0, ya], [R + dr, ya], [R + dr, yb], [0, yb]], 40), m));
    dai(y0 + 0.4, y0 + 0.52, vlNhan);
    dai(yC - 0.22, yC - 0.06, vlNhan);
    for (const y of [y0 + 0.95, y0 + 1.6]) dai(y, y + 0.012, vlToi, 0.003);
    // ba cửa sổ tròn có đèn trong khoang
    const vlCuaSo = vlSang(0xffd9a0, 1.35);
    for (let i = 0; i < 3; i++) {
      const y = yC - 0.55 - i * 0.42;
      const v = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 8, 24), vlKhung);
      v.position.set(0, y, R + 0.004);
      const k = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), vlCuaSo);
      k.position.set(0, y, R + 0.006);
      const kinh = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), vlKinh(0xffffff, 0.25));
      kinh.position.set(0, y, R + 0.012);
      nhom.add(v, k, kinh);
    }
    // bốn cánh
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(hinhCanh(R * 0.96, R * 1.05, R * 2.4, R * 0.45, 0.035), vlNhan);
      c.position.y = y0 + 0.12;
      c.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
      nhom.add(c);
    }
    // vòi
    voi = taoVoi(R * 0.66, y0, vlVoi);
    nhom.add(voi.g);
    mieng = 0;
    lua = taoLuaPhut({ banKinh: R * 0.6, doDai: doDaiLua ?? cao * 0.75 });
  } else {
    // ---------------- tên lửa chở buồng
    const { rong = 3, cao: hB = 4, sau = 3 } = choBuong;
    const R = Math.hypot(rong, sau) / 2 + 0.16;
    const yS = -0.16, yT = hB + 0.14;
    const hMui = caoMui ?? Math.max(1.8, R * 1.3);
    // khoang động cơ dưới sàn
    const yD = yS - Math.max(1.4, R * 0.62);
    nhom.add(new THREE.Mesh(tien([[0, yD], [R * 0.56, yD], [R * 0.72, yD + 0.12], [R * 0.9, yD + 0.42], [R * 0.985, yD + 0.75], [R, yD + 0.95], [R, yS], [0, yS]], 48), vlVo));
    const dai = (ya, yb, m, dr = 0.006) => nhom.add(new THREE.Mesh(tien([[0, ya], [R + dr, ya], [R + dr, yb], [0, yb]], 48), m));
    dai(yS - 0.34, yS - 0.2, vlNhan);
    dai(yD + 0.95, yD + 0.965, vlToi, 0.004);
    // mũi trên trần
    const pm = [[0, yT], [R, yT], [R, yT + 0.18]];
    for (let i = 1; i <= 14; i++) { const f = i / 14; pm.push([Math.max(0, R * Math.pow(1 - Math.pow(f, 1.45), 0.62)), yT + 0.18 + f * hMui]); }
    nhom.add(new THREE.Mesh(tien(pm, 48), vlVo));
    // đường ghép tấm và bốn cửa sổ nhỏ trên mũi
    const rMui = (f) => R * Math.pow(1 - Math.pow(f, 1.45), 0.62);
    for (const f of [0.42, 0.7]) {
      const y = yT + 0.18 + f * hMui, r = rMui(f) + 0.004;
      const v = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 4, 64), vlToi);
      v.rotation.x = Math.PI / 2; v.position.y = y;
      nhom.add(v);
    }
    const vlCs = vlSang(0xffd9a0, 1.3);
    for (let i = 0; i < 4; i++) {
      const f = 0.2, y = yT + 0.18 + f * hMui, r = rMui(f), a = (i * Math.PI) / 2 + Math.PI / 4;
      const w = new THREE.Group();
      w.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      w.lookAt(Math.cos(a) * r * 2, y + r * 0.35, Math.sin(a) * r * 2);
      w.add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 24), vlKhung));
      w.add(new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), vlCs));
      nhom.add(w);
    }
    dai(yT + 0.22, yT + 0.34, vlNhan, 0.004);
    // đèn hiệu đỏ trên đỉnh mũi
    const denHieu = domSang(0xff4a3a, 0.22, 3);
    denHieu.position.y = yT + 0.18 + hMui + 0.03;
    nhom.add(denHieu);
    nhom.userData.denHieu = denHieu;
    // vành sàn và vành trần
    for (const y of [yS, yT]) {
      const v = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 6, 56), vlKhung);
      v.rotation.x = Math.PI / 2; v.position.y = y;
      nhom.add(v);
    }
    // bốn cột chống ở bốn góc buồng, có khớp nối
    const ds = [];
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const x = Math.cos(a) * (R - 0.02), z = Math.sin(a) * (R - 0.02);
      ds.push(dat(new THREE.CylinderGeometry(0.055, 0.055, yT - yS, 12), { x, y: (yS + yT) / 2, z }));
      for (const y of [yS + 0.12, yT - 0.12, (yS + yT) / 2]) ds.push(dat(new THREE.CylinderGeometry(0.075, 0.075, 0.07, 12), { x, y, z }));
    }
    nhom.add(new THREE.Mesh(ghep(ds), vlKhung));
    // bốn cánh, nằm giữa các cột
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(hinhCanh(R * 0.96, R * 0.48, R * 0.62, R * 0.22, 0.07), vlCanh);
      c.position.y = yD + 0.12;
      c.rotation.y = (i * Math.PI) / 2;
      nhom.add(c);
    }
    // vòi chính
    const hV = R * 0.42;
    voi = taoVoi(R * 0.4, hV, vlVoi);
    voi.g.position.y = yD - hV;
    nhom.add(voi.g);
    mieng = yD - hV;
    lua = taoLuaPhut({ banKinh: R * 0.38, doDai: doDaiLua ?? R * 2.0 });
  }
  lua.nhom.position.y = mieng;
  nhom.add(lua.nhom);
  lua.datLucDay(luc, 0.01);

  let gio = 0;
  const _mauTrong = new THREE.Color(0xff8a3c);
  const ketQua = {
    nhom, lua, neoBuong,
    miengVoi: new THREE.Vector3(0, mieng, 0),
    get lucDay() { return lua.lucDay; },
    datLucDay(k, giay = 0.45) { lua.datLucDay(k, giay); },
    capNhat(dt) {
      gio += dt;
      lua.capNhat(dt);
      voi.vlTrong.color.copy(_mauTrong).multiplyScalar(Math.min(1.2, lua.hienTai) * 2.2);
      const dh = nhom.userData.denHieu;
      if (dh) dh.material.opacity = Math.sin(gio * 3.2) > 0.6 ? 1 : 0.12;
    },
    soTamGiac: 0,
  };
  ketQua.capNhat(0);
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}
