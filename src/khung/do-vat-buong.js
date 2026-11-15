// Buồng thí nghiệm kín (dùng làm thang máy, khoang tàu): khung kim loại, vách kính mờ có viền sáng theo góc
// nhìn, sàn tấm thép có lưới sáng nhẹ, dải đèn quanh trần và sàn, đèn trần, một cửa sổ tròn trong suốt.
// Nhìn xuyên được vào trong từ mọi phía.
//
// Gốc toạ độ: tâm mặt sàn (mặt trên của sàn ở y = 0). Lòng buồng: x ∈ [−rong/2, rong/2], y ∈ [0, cao],
// z ∈ [−sau/2, sau/2]; khung và sàn nằm ra ngoài lòng buồng (sàn dày 0,14 xuống dưới, khung dày 0,09).
//
//   const b = taoBuong({ rong: 3, cao: 4, sau: 3, mau: 0x8fd0ff, cuaSo: 'sau' });
//   b.nhom                         Group đặt vào cảnh
//   b.neo('san' | 'tran' | 'trai' | 'phai' | 'sau' | 'truoc', out?)   điểm giữa mặt đó (toạ độ của buồng)
//   b.diem(ten, out)               như neo nhưng ra toạ độ thế giới
//   b.datMau(hex)  b.datDen(k, giay?)  b.datDoMo(k, giay?)   (chuyển mượt)
//   b.capNhat(dt)

import * as THREE from 'three';
import { LoXo, vlKimLoai, vlSang, vlKinh, taoKetCau, hopBo, ghep, dat, demTamGiac } from './do-vat-chung.js';

const VS = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz; vN = normalMatrix * normal;
    gl_Position = projectionMatrix * mv;
  }`;
const FS = /* glsl */ `
  uniform vec3 uMau; uniform float uDoMo; uniform vec2 uCo; uniform vec3 uLo; uniform float uSang;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  float bam(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  void main() {
    vec3 n = normalize(vN), v = normalize(vV);
    float ndv = clamp(abs(dot(n, v)), 0.0, 1.0);
    float fr = (1.0 - ndv) * (1.0 - ndv) * (1.0 - ndv);                       // sáng dần khi nhìn xiên (Fresnel)
    vec2 p = vUv * uCo;                                   // toạ độ trên tấm kính, tính bằng mét
    float d = max(0.0, min(min(p.x, uCo.x - p.x), min(p.y, uCo.y - p.y)));
    float vien = exp(-d / 0.022);                         // mép sáng mảnh
    float vienMem = exp(-d / 0.3);                        // ánh sáng loang vào từ mép
    float s = (p.x * 0.62 + p.y * 0.38);
    float s1 = clamp(sin(s * 1.7 + 0.4), 0.0, 1.0), s2 = clamp(sin(s * 1.7 + 1.05), 0.0, 1.0);
    s1 *= s1; s1 *= s1; s1 *= s1; s1 *= s1; s1 *= s1;                 // mũ 32
    s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2;   // mũ 128
    float vet = s1 * 0.55 + s2 * 0.4;  // vệt phản chiếu chéo
    float mo = 0.8 + 0.2 * bam(floor(vUv * uCo * 220.0 + 0.5));         // hạt kính mờ
    float lo = 1.0;
    if (uLo.z > 0.0) lo = smoothstep(uLo.z - 0.012, uLo.z + 0.012, length(p - uLo.xy));   // cửa sổ trong suốt
    float a = (0.055 * mo + 0.09 * vienMem + 0.5 * fr + 0.1 * vet) * lo + 0.75 * vien;
    vec3 c = uMau * (0.28 * mo + 0.55 * fr + 0.45 * vienMem) * lo + vec3(0.75, 0.85, 1.0) * vet * 0.55 * lo + uMau * vien * uSang;
    gl_FragColor = vec4(c, clamp(a, 0.0, 1.0) * uDoMo);
  }`;

// Sàn: tấm thép 0,5 m có rãnh, chấm chống trượt; kết cấu sáng riêng cho lưới.
let _san = null;
function ketCauSan() {
  if (_san) return _san;
  const N = 512;
  const map = taoKetCau(N, N, (g) => {
    g.fillStyle = '#1d2129'; g.fillRect(0, 0, N, N);
    const o = N / 2;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const gr = g.createLinearGradient(i * o, j * o, i * o + o, j * o + o);
      gr.addColorStop(0, '#3a404b'); gr.addColorStop(1, '#2c313a');
      g.fillStyle = gr; g.fillRect(i * o + 5, j * o + 5, o - 10, o - 10);
      g.fillStyle = 'rgba(255,255,255,0.05)';
      for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) {
        const x = i * o + 22 + a * 30 + (b % 2) * 15, y = j * o + 22 + b * 30;
        g.beginPath(); g.ellipse(x, y, 7, 3, (a + b) % 2 ? 0.8 : -0.8, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#5a616e';
      for (const [x, y] of [[14, 14], [o - 14, 14], [14, o - 14], [o - 14, o - 14]]) { g.beginPath(); g.arc(i * o + x, j * o + y, 4, 0, Math.PI * 2); g.fill(); }
    }
  }, { lap: true });
  const sang = taoKetCau(N, N, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, N, N);
    g.strokeStyle = '#fff'; g.lineWidth = 3;
    for (const k of [0, N / 2, N]) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, N); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(N, k); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.5;
    for (const k of [N / 4, (3 * N) / 4]) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, N); g.stroke(); g.beginPath(); g.moveTo(0, k); g.lineTo(N, k); g.stroke(); }
  }, { lap: true });
  _san = { map, sang };
  return _san;
}

export function taoBuong({ rong = 3, cao = 4, sau = 3, mau = 0x8fd0ff, cuaSo = 'sau', anhSang = true, doMo = 1 } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'buong';
  const b = 0.09, hx = rong / 2, hz = sau / 2, DAY = 0.14;
  const mauC = new THREE.Color(mau);

  // ---- khung: 12 thanh, 8 khối góc, ghép thành một lưới
  const vlKhung = vlKimLoai(0x59606e, 0.36);
  {
    const ds = [];
    const X = hx + b / 2, Z = hz + b / 2, yD = -b / 2 - 0.02, yT = cao + b / 2;
    for (const x of [-X, X]) for (const z of [-Z, Z]) ds.push(dat(hopBo(b, yT - yD, b, 0.012), { x, y: (yT + yD) / 2, z }));
    for (const y of [yD, yT]) {
      for (const z of [-Z, Z]) ds.push(dat(hopBo(2 * X, b, b, 0.012), { y, z }));
      for (const x of [-X, X]) ds.push(dat(hopBo(b, b, 2 * Z, 0.012), { x, y }));
    }
    for (const x of [-X, X]) for (const y of [yD, yT]) for (const z of [-Z, Z]) ds.push(dat(hopBo(0.15, 0.15, 0.15, 0.03), { x, y, z }));
    // thanh ngang giữa ở hai vách bên, làm tay vịn
    for (const x of [-hx + 0.05, hx - 0.05]) ds.push(dat(new THREE.CylinderGeometry(0.022, 0.022, sau * 0.7, 10), { rx: Math.PI / 2, x, y: 1.05 }));
    for (const x of [-hx + 0.05, hx - 0.05]) for (const z of [-sau * 0.35, sau * 0.35]) ds.push(dat(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 8), { rz: Math.PI / 2, x: x + (x < 0 ? -0.03 : 0.03), y: 1.05, z }));
    const khung = new THREE.Mesh(ghep(ds), vlKhung); khung.name = 'buong-khung'; nhom.add(khung);
  }

  // ---- sàn
  const ks = ketCauSan();
  const mapSan = ks.map.clone(); mapSan.repeat.set(rong, sau); mapSan.needsUpdate = true;
  const sangSan = ks.sang.clone(); sangSan.repeat.set(rong, sau); sangSan.needsUpdate = true;
  const vlSan = new THREE.MeshStandardMaterial({
    map: mapSan, metalness: 0.55, roughness: 0.5, emissive: mauC.clone(), emissiveMap: sangSan, emissiveIntensity: 0.32,
  });
  {
    const tam = new THREE.Mesh(new THREE.PlaneGeometry(rong, sau), vlSan);
    tam.rotation.x = -Math.PI / 2; tam.position.y = 0.001;
    const day = new THREE.Mesh(hopBo(rong + 0.02, DAY, sau + 0.02, 0.015), vlKimLoai(0x2e333c, 0.45));
    day.position.y = -DAY / 2;
    tam.name = 'buong-san'; day.name = 'buong-day';
    nhom.add(tam, day);
  }

  // ---- dải đèn quanh trần và quanh sàn (viền sáng)
  const vlDai = vlSang(mau, 2.2);
  {
    const ds = [];
    const t = 0.028;
    for (const y of [t / 2 + 0.004, cao - t / 2 - 0.004]) {
      for (const z of [-hz + t / 2, hz - t / 2]) ds.push(dat(new THREE.BoxGeometry(rong, t, t), { y, z }));
      for (const x of [-hx + t / 2, hx - t / 2]) ds.push(dat(new THREE.BoxGeometry(t, t, sau - 2 * t), { x, y }));
    }
    const dai = new THREE.Mesh(ghep(ds), vlDai); dai.name = 'buong-dai-den'; nhom.add(dai);
  }

  // ---- đèn trần
  const vlDenTran = vlSang(0xfff2dc, 1.7);
  {
    const vo = new THREE.Mesh(hopBo(1.1, 0.06, 1.1, 0.02), vlKimLoai(0x6b7280, 0.4));
    vo.position.y = cao - 0.03;
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), vlDenTran);
    mat.rotation.x = Math.PI / 2; mat.position.y = cao - 0.061;
    // lưới tản sáng trên mặt đèn
    const ds = [];
    for (let i = 1; i < 6; i++) {
      ds.push(dat(new THREE.BoxGeometry(0.96, 0.006, 0.01), { y: cao - 0.064, z: -0.48 + (i * 0.96) / 6 }));
      ds.push(dat(new THREE.BoxGeometry(0.01, 0.006, 0.96), { y: cao - 0.064, x: -0.48 + (i * 0.96) / 6 }));
    }
    const luoi = new THREE.Mesh(ghep(ds), vlKimLoai(0x8a919c, 0.4));
    vo.name = mat.name = luoi.name = 'buong-den-tran';
    nhom.add(vo, mat, luoi);
  }
  let den = null;
  if (anhSang) {
    den = new THREE.PointLight(0xfff0dc, 5, 0, 2);
    den.position.set(0, cao - 0.35, 0);
    nhom.add(den);
  }

  // ---- vách kính: bốn vách và trần
  const loTren = {};      // cửa sổ: vách nào, tâm (m, theo toạ độ trên tấm), bán kính
  const R_LO = 0.36;
  if (cuaSo) {
    const xL = cuaSo === 'sau' || cuaSo === 'truoc' ? Math.min(0.62, hx - 0.6) : Math.min(0.55, hz - 0.6);
    loTren[cuaSo] = { u: xL, y: cao * 0.64 };
  }
  const vachDs = [];
  const taoVach = (ten, w, h, viTri, xoay) => {
    const lo = loTren[ten];
    const m = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: {
        uMau: { value: mauC.clone() }, uDoMo: { value: doMo }, uCo: { value: new THREE.Vector2(w, h) },
        uLo: { value: new THREE.Vector3(lo ? w / 2 + lo.u : 0, lo ? lo.y : 0, lo ? R_LO : 0) }, uSang: { value: 1.3 },
      },
    });
    m.tuyenTinh = true;
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    o.position.set(...viTri); o.rotation.set(...xoay);
    o.renderOrder = 2;
    o.name = 'buong-vach-' + ten;
    nhom.add(o);
    vachDs.push(o);
    return o;
  };
  // PlaneGeometry nhìn về +z, u chạy theo +x. Vách 'sau' (z = −hz) nhìn vào trong; u theo +x.
  taoVach('sau', rong, cao, [0, cao / 2, -hz], [0, 0, 0]);
  taoVach('truoc', rong, cao, [0, cao / 2, hz], [0, Math.PI, 0]);        // u chạy theo −x
  taoVach('trai', sau, cao, [-hx, cao / 2, 0], [0, Math.PI / 2, 0]);       // u chạy theo −z
  taoVach('phai', sau, cao, [hx, cao / 2, 0], [0, -Math.PI / 2, 0]);      // u chạy theo +z
  taoVach('tran', rong, sau, [0, cao, 0], [Math.PI / 2, 0, 0]);
  const vlVach = vachDs.map((o) => o.material);

  // ---- cửa sổ tròn: vành thép có bu lông, kính trong
  if (cuaSo && loTren[cuaSo]) {
    const lo = loTren[cuaSo];
    const g = new THREE.Group();
    const vanh = new THREE.TorusGeometry(R_LO + 0.02, 0.045, 10, 44);
    const ds = [vanh];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ds.push(dat(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8), { rx: Math.PI / 2, x: Math.cos(a) * (R_LO + 0.02), y: Math.sin(a) * (R_LO + 0.02), z: 0.045 }));
      ds.push(dat(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8), { rx: Math.PI / 2, x: Math.cos(a) * (R_LO + 0.02), y: Math.sin(a) * (R_LO + 0.02), z: -0.045 }));
    }
    g.add(new THREE.Mesh(ghep(ds), vlKimLoai(0x8d95a2, 0.3)));
    const kinh = new THREE.Mesh(new THREE.CircleGeometry(R_LO, 40), vlKinh(0xbfe3ff, 0.1));
    g.add(kinh);
    const vienSang = new THREE.Mesh(new THREE.TorusGeometry(R_LO - 0.012, 0.005, 4, 48), vlDai);
    g.add(vienSang);
    const dd = {
      sau: { p: [lo.u, lo.y, -hz], r: [0, 0, 0] },
      truoc: { p: [-lo.u, lo.y, hz], r: [0, Math.PI, 0] },
      trai: { p: [-hx, lo.y, -lo.u], r: [0, Math.PI / 2, 0] },
      phai: { p: [hx, lo.y, lo.u], r: [0, -Math.PI / 2, 0] },
    }[cuaSo];
    g.name = 'buong-cua-so';
    if (dd) { g.position.set(...dd.p); g.rotation.set(...dd.r); nhom.add(g); }
  }

  // ---- điểm neo
  const NEO = {
    san: [0, 0, 0], tran: [0, cao, 0], trai: [-hx, cao / 2, 0], phai: [hx, cao / 2, 0],
    sau: [0, cao / 2, -hz], truoc: [0, cao / 2, hz], giua: [0, cao / 2, 0],
  };
  const lxDen = new LoXo(1, 0.5), lxMo = new LoXo(doMo, 0.5);
  const goc = { dai: vlDai.color.clone(), denTran: vlDenTran.color.clone(), sanE: vlSan.emissiveIntensity };

  const ketQua = {
    nhom,
    kichThuoc: { rong, cao, sau },
    neo(ten, out = new THREE.Vector3()) { return out.set(...(NEO[ten] || NEO.san)); },
    diem(ten, out = new THREE.Vector3()) { nhom.updateWorldMatrix(true, false); return nhom.localToWorld(out.set(...(NEO[ten] || NEO.san))); },
    datMau(hex) {
      mauC.set(hex);
      for (const m of vlVach) m.uniforms.uMau.value.copy(mauC);
      goc.dai.copy(mauC).multiplyScalar(2.2);
      vlSan.emissive.copy(mauC);
      ap();
    },
    datDen(k, giay = 0.5) { lxDen.datGiay(giay).dat(k); },
    datDoMo(k, giay = 0.5) { lxMo.datGiay(giay).dat(k); },
    capNhat(dt) { lxDen.buoc(dt); lxMo.buoc(dt); ap(); },
    soTamGiac: 0,
  };
  function ap() {
    const k = lxDen.v, m = lxMo.v;
    vlDenTran.color.copy(goc.denTran).multiplyScalar(0.15 + 0.85 * k);
    if (den) den.intensity = 5 * k * m;
    vlDai.color.copy(goc.dai).multiplyScalar(m);
    for (const v of vlVach) v.uniforms.uDoMo.value = m;
    vlSan.emissiveIntensity = goc.sanE * (0.4 + 0.6 * k);
  }
  ap();
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}
