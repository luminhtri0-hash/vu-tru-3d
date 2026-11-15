// Đồ vật nhỏ: cân sàn có màn hình số, quả bóng, đèn chiếu tia sáng, vệ tinh, tháp.
//
// taoCan({ rong = 0.62, sau = 0.5, cao = 0.1, mau = 0x8ff0c8 }) → { nhom, datSo(chu), capNhat? }
//   Gốc: tâm đáy, mặt trên ở y = cao (người đứng ở y = cao). Màn hình số bảy đoạn nghiêng ở mép trước (+z);
//   datSo('70.0') hoặc datSo('0.0'); chỉ vẽ lại khi chữ đổi. Đơn vị «kg» in sẵn (tuỳ chọn donVi).
// taoBong({ banKinh = 0.13, mau = 0xff6a5c }) → { nhom, datMau(hex), datQuay(w), capNhat(dt) }
//   Quả bóng cao su có đường may sáng, phủ bóng. Gốc ở tâm.
// taoDenChieu({ mau = 0x7fd6ff, doDai = 2.8, rCuoi = 0.16 }) → { nhom, datChum(bat, doDai?), datMau(hex) }
//   Đèn pha nhỏ gắn tường: gốc ở tâm mặt kính, chùm sáng mềm chiếu theo +x; giá đỡ ở phía −x (sát tường).
// taoVeTinh({ co = 1, quayPin = true }) → { nhom, capNhat(dt) }
//   Vệ tinh kiểu GPS: thân bọc lá vàng, hai cánh pin dọc trục x (sải khoảng 2,8·co), dàn ăng-ten xoắn hướng −y
//   (về phía Trái Đất), chảo nhỏ, cần nối. Gốc ở tâm thân.
// taoThap({ cao = 4 }) → { nhom, neo(ten, out?), capNhat(dt) }
//   Tháp giàn thép thon dần (dáng tháp truyền hình), hai đài quan sát có cửa kính sáng, cột ăng-ten, đèn báo
//   không đỏ nhấp nháy. Gốc ở chân tháp. Neo: 'chan', 'dai1', 'dai2', 'dinh'.

import * as THREE from 'three';
import { vlKimLoai, vlSon, vlBong, vlSang, taoKetCau, ketCau, hopBo, ghep, dat, thanhNoi, domSang, demTamGiac } from './do-vat-chung.js';

// ---------------------------------------------------------------- cân
const DOAN = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
function veSo(g, chu, W, H, mau, donVi) {
  g.fillStyle = '#020604'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // bỏ dấu chấm ra khỏi chuỗi ký tự, nhớ vị trí
  const kyTu = [];
  for (const ch of String(chu)) { if (ch === '.' || ch === ',') { if (kyTu.length) kyTu[kyTu.length - 1].cham = true; } else kyTu.push({ ch, cham: false }); }
  while (kyTu.length < 4) kyTu.unshift({ ch: ' ', cham: false });
  const n = kyTu.length;
  const vungSo = donVi ? W * 0.78 : W * 0.94;
  const cw = Math.min(vungSo / n, H * 0.62), ch = H * 0.72, t = cw * 0.17;
  const x0 = (donVi ? W * 0.04 : W * 0.03) + (vungSo - cw * n);
  const y0 = (H - ch) / 2;
  const doanHinh = (x, y, w, h, ngang) => {
    g.beginPath();
    if (ngang) { g.moveTo(x, y + h / 2); g.lineTo(x + h / 2, y); g.lineTo(x + w - h / 2, y); g.lineTo(x + w, y + h / 2); g.lineTo(x + w - h / 2, y + h); g.lineTo(x + h / 2, y + h); }
    else { g.moveTo(x + w / 2, y); g.lineTo(x + w, y + w / 2); g.lineTo(x + w, y + h - w / 2); g.lineTo(x + w / 2, y + h); g.lineTo(x, y + h - w / 2); g.lineTo(x, y + w / 2); }
    g.closePath(); g.fill();
  };
  kyTu.forEach(({ ch: c, cham }, i) => {
    const x = x0 + i * cw + cw * 0.12, w = cw * 0.68, hh = ch / 2;
    const bat = DOAN[c] ?? '';
    const D = {
      a: [x + t * 0.4, y0, w - t * 0.8, t, 1], g: [x + t * 0.4, y0 + hh - t / 2, w - t * 0.8, t, 1], d: [x + t * 0.4, y0 + ch - t, w - t * 0.8, t, 1],
      f: [x - t * 0.1, y0 + t * 0.4, t, hh - t * 0.4, 0], b: [x + w - t * 0.9, y0 + t * 0.4, t, hh - t * 0.4, 0],
      e: [x - t * 0.1, y0 + hh, t, hh - t * 0.4, 0], c: [x + w - t * 0.9, y0 + hh, t, hh - t * 0.4, 0],
    };
    for (const k of 'abcdefg') {
      g.fillStyle = bat.includes(k) ? mau : 'rgba(120,160,150,0.07)';
      const [a, b2, c2, d2, ngang] = D[k];
      doanHinh(a, b2, c2, d2, ngang);
    }
    g.fillStyle = cham ? mau : 'rgba(120,160,150,0.07)';
    g.beginPath(); g.arc(x + w + t * 0.55, y0 + ch - t / 2, t * 0.55, 0, Math.PI * 2); g.fill();
  });
  if (donVi) {
    g.fillStyle = mau; g.font = `600 ${Math.round(H * 0.3)}px "Helvetica Neue", Arial, sans-serif`;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText(donVi, W * 0.835, y0 + ch);
  }
}

export function taoCan({ rong = 0.62, sau = 0.5, cao = 0.1, mau = 0x8ff0c8, donVi = 'kg' } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'can';
  const hT = cao * 0.78;
  const than = new THREE.Mesh(hopBo(rong, hT, sau, Math.min(0.035, hT * 0.45), 3), vlKimLoai(0x8c939f, 0.34));
  than.position.y = hT / 2;
  const vlTam = vlSon(0x2b2f37, 0.85);
  const tam = new THREE.Mesh(hopBo(rong - 0.05, cao - hT + 0.01, sau - 0.05, 0.012), vlTam);
  tam.position.y = hT + (cao - hT) / 2 - 0.005;
  // gờ chống trượt trên mặt
  const ds = [];
  for (let i = 0; i < 9; i++) ds.push(dat(hopBo(rong - 0.12, 0.006, 0.012, 0.003), { y: cao + 0.002, z: -sau / 2 + 0.07 + (i * (sau - 0.14)) / 8 }));
  const go = new THREE.Mesh(ghep(ds), vlSon(0x3c414b, 0.7));
  // chân
  const dc = [];
  for (const x of [-rong / 2 + 0.06, rong / 2 - 0.06]) for (const z of [-sau / 2 + 0.06, sau / 2 - 0.06]) dc.push(dat(new THREE.CylinderGeometry(0.022, 0.026, 0.012, 12), { x, y: 0.006, z }));
  const chan = new THREE.Mesh(ghep(dc), vlSon(0x22252b, 0.9));
  than.position.y += 0.01; tam.position.y += 0.01; go.position.y += 0.01;
  nhom.add(than, tam, go, chan);
  // màn hình: hộp nghiêng nhô ra ở mép trước
  const mh = new THREE.Group();
  mh.position.set(0, hT * 0.62, sau / 2 + 0.012);
  mh.rotation.x = -0.75;
  const wM = Math.min(rong * 0.62, 0.38), hM = wM * 0.3;
  mh.add(new THREE.Mesh(hopBo(wM + 0.04, hM + 0.035, 0.05, 0.012), vlKimLoai(0x3a3f49, 0.35)));
  const W = 512, H = Math.round(512 * (hM / wM));
  const mauCss = `#${new THREE.Color(mau).getHexString()}`;
  const kc = taoKetCau(W, H, (g) => veSo(g, '0.0', W, H, mauCss, donVi));
  const vlMH = new THREE.MeshBasicMaterial({ map: kc, color: new THREE.Color(2.1, 2.1, 2.1) });
  const man = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), vlMH);
  man.position.z = 0.0255;
  mh.add(man);
  nhom.add(mh);
  let cu = '0.0';
  const ketQua = {
    nhom,
    datSo(chu) {
      chu = String(chu);
      if (chu === cu) return;
      cu = chu;
      veSo(kc.userData.canvas.getContext('2d'), chu, W, H, mauCss, donVi);
      kc.needsUpdate = true;
    },
    soTamGiac: 0,
  };
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}

// ---------------------------------------------------------------- bóng
function veBong(g, W, H, mau) {
  g.fillStyle = mau; g.fillRect(0, 0, W, H);
  // hai đường may uốn lượn (kiểu bóng tennis), nét sáng có viền tối mờ
  for (const [rong, kieu] of [[13, 'rgba(0,0,0,0.18)'], [7, '#f2ece0']]) {
    g.strokeStyle = kieu; g.lineWidth = rong; g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i <= 160; i++) {
      const x = (i / 160) * W, y = H / 2 + H * 0.26 * Math.sin((2 * Math.PI * 2 * i) / 160);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
}
export function taoBong({ banKinh = 0.13, mau = 0xff6a5c } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'bong';
  const css = (h) => `#${new THREE.Color(h).getHexString()}`;
  const kc = taoKetCau(512, 256, (g, W, H) => veBong(g, W, H, css(mau)));
  const vl = vlBong(0xffffff, 0.42, { map: kc, emissive: mau, emissiveIntensity: 0.08 });
  const qua = new THREE.Mesh(new THREE.SphereGeometry(banKinh, 32, 20), vl);
  qua.rotation.x = 0.5;
  nhom.add(qua);
  let w = 0;
  const ketQua = {
    nhom, qua,
    datMau(hex) { veBong(kc.userData.canvas.getContext('2d'), 512, 256, css(hex)); kc.needsUpdate = true; vl.emissive.set(hex); },
    datQuay(tocDo) { w = tocDo; },
    capNhat(dt) { if (w) qua.rotation.z -= w * dt; },
    soTamGiac: 0,
  };
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}

// ---------------------------------------------------------------- đèn chiếu
const VS_CHUM = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`;
const FS_CHUM = /* glsl */ `
  uniform vec3 uMau; uniform float uManh;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    float t = clamp(1.0 - vUv.y, 0.0, 1.0);
    float ndv = clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
    float a = pow(ndv, 2.2) * pow(max(1.0 - t, 0.0), 1.6) * smoothstep(0.0, 0.05, t + 0.02) * uManh;
    gl_FragColor = vec4(uMau * a, 1.0);
  }`;
export function taoDenChieu({ mau = 0x7fd6ff, doDai = 2.8, rCuoi = 0.16 } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'den-chieu';
  // vỏ đèn: tiện tròn theo trục y rồi xoay sang trục x; có cánh tản nhiệt
  const p = [[0, -0.25], [0.045, -0.25], [0.06, -0.235]];
  for (let i = 0; i < 5; i++) { const y = -0.22 + i * 0.024; p.push([0.062, y], [0.084, y + 0.004], [0.084, y + 0.012], [0.062, y + 0.016]); }
  p.push([0.066, -0.09], [0.068, -0.03], [0.078, -0.012], [0.078, 0.004], [0.06, 0.004]);
  const vo = new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  vo.rotateZ(-Math.PI / 2);
  nhom.add(new THREE.Mesh(vo, vlKimLoai(0x6d7584, 0.34)));
  // mặt kính phát sáng
  const vlKinhDen = vlSang(mau, 3.2);
  const kinh = new THREE.Mesh(new THREE.CircleGeometry(0.06, 28), vlKinhDen);
  kinh.rotation.y = Math.PI / 2;
  const vanh = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.008, 6, 28), vlKimLoai(0xb9c0cb, 0.25));
  vanh.rotation.y = Math.PI / 2; vanh.position.x = 0.002;
  nhom.add(kinh, vanh);
  // giá chữ U và tấm bắt tường
  const ds = [dat(hopBo(0.02, 0.2, 0.2, 0.006), { x: -0.265 })];
  for (const s of [-1, 1]) ds.push(dat(hopBo(0.17, 0.03, 0.012, 0.004), { x: -0.17, z: s * 0.094 }));
  ds.push(dat(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 10), { rx: Math.PI / 2, x: -0.1 }));
  for (const [y, z] of [[0.07, 0.07], [-0.07, 0.07], [0.07, -0.07], [-0.07, -0.07]]) ds.push(dat(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 8), { rz: Math.PI / 2, x: -0.253, y, z }));
  nhom.add(new THREE.Mesh(ghep(ds), vlKimLoai(0x4b515c, 0.4)));
  // chùm sáng mềm
  const gc = new THREE.CylinderGeometry(0.055, rCuoi, 1, 28, 1, true);
  gc.translate(0, -0.5, 0); gc.rotateZ(Math.PI / 2);
  const vlChum = new THREE.ShaderMaterial({
    vertexShader: VS_CHUM, fragmentShader: FS_CHUM, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uMau: { value: new THREE.Color(mau).multiplyScalar(0.55) }, uManh: { value: 1 } },
  });
  vlChum.tuyenTinh = true;
  const chum = new THREE.Mesh(gc, vlChum);
  chum.scale.x = doDai;
  chum.renderOrder = 4;
  const quang = domSang(mau, 0.42, 2.2);
  quang.position.x = 0.01;
  nhom.add(chum, quang);
  const ketQua = {
    nhom,
    datChum(bat, dai = null) { chum.visible = !!bat; if (dai != null) chum.scale.x = Math.max(0.01, dai); },
    datMau(hex) {
      vlKinhDen.color.set(hex).multiplyScalar(3.2);
      vlChum.uniforms.uMau.value.set(hex).multiplyScalar(0.55);
      quang.material.color.set(hex).multiplyScalar(2.2);
    },
    soTamGiac: 0,
  };
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}

// ---------------------------------------------------------------- vệ tinh
export function taoVeTinh({ co = 1, quayPin = true } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 've-tinh';
  const goc = new THREE.Group();
  goc.scale.setScalar(co);
  nhom.add(goc);
  const vlVang = vlKimLoai(0xffd27a, 0.38, { map: ketCau('la-vang') });
  const vlTrang = vlSon(0xbdbdb8, 0.5);
  const vlKhung = vlKimLoai(0x9aa1ad, 0.32);
  // thân
  goc.add(new THREE.Mesh(hopBo(0.5, 0.62, 0.5, 0.025), vlVang));
  for (const y of [0.32, -0.32]) goc.add(new THREE.Mesh(dat(hopBo(0.53, 0.04, 0.53, 0.01), { y }), vlTrang));
  // dàn ăng-ten xoắn hướng xuống (−y)
  const ds = [dat(new THREE.CylinderGeometry(0.21, 0.23, 0.03, 24), { y: -0.355 })];
  const xoan = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; xoan.push([Math.cos(a) * 0.15, Math.sin(a) * 0.15]); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; xoan.push([Math.cos(a) * 0.065, Math.sin(a) * 0.065]); }
  for (const [x, z] of xoan) ds.push(dat(new THREE.CylinderGeometry(0.014, 0.018, 0.13, 8), { x, y: -0.43, z }));
  goc.add(new THREE.Mesh(ghep(ds), vlTrang));
  // chảo nhỏ ở mặt bên
  const pc = []; for (let i = 0; i <= 8; i++) { const r = (i / 8) * 0.11; pc.push(new THREE.Vector2(r, (r * r) / 0.12)); }
  const chao = new THREE.Mesh(new THREE.LatheGeometry(pc, 24), vlTrang);
  chao.material.side = THREE.DoubleSide;
  chao.rotation.x = -Math.PI / 2; chao.position.set(0.06, 0.12, 0.3);
  goc.add(chao);
  // cần và cánh pin
  const vlPin = new THREE.MeshStandardMaterial({ map: ketCau('pin'), metalness: 0.55, roughness: 0.28, color: 0xc8d2ff });
  const vlMatSau = vlSon(0x8d8f94, 0.6);
  const canh = [];
  for (const s of [-1, 1]) {
    const c = new THREE.Group();
    c.position.x = s * 0.25;
    c.add(new THREE.Mesh(dat(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 10), { rz: Math.PI / 2, x: s * 0.16 }), vlKhung));
    c.add(new THREE.Mesh(dat(hopBo(0.04, 0.12, 0.16, 0.01), { x: s * 0.33 }), vlKhung));
    for (let i = 0; i < 2; i++) {
      const x = s * (0.65 + i * 0.6);
      // mặt pin nhìn về +z (thứ tự mặt hộp: +x, −x, +y, −y, +z, −z)
      const tam = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.46, 0.014), [vlMatSau, vlMatSau, vlMatSau, vlMatSau, vlPin, vlMatSau]);
      tam.position.x = x;
      c.add(tam);
    }
    goc.add(c);
    canh.push(c);
  }
  let gio = 0;
  const ketQua = {
    nhom, canh,
    capNhat(dt) { gio += dt; if (quayPin) for (const c of canh) c.rotation.x = 0.25 * Math.sin(gio * 0.15); },
    soTamGiac: 0,
  };
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}

// ---------------------------------------------------------------- tháp
export function taoThap({ cao = 4 } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'thap';
  const k = cao / 4;
  const N = 10, rDay = 0.5 * k, rDinh = 0.1 * k, hThan = cao * 0.86;
  const diem = (i, j) => {
    // mặt cắt: tam giác ở chân, tròn dần lên trên (6 điểm mỗi tầng)
    const f = i / N, h = hThan * f;
    const r = rDay + (rDinh - rDay) * Math.pow(f, 0.62);
    const a = (j / 6) * Math.PI * 2 + Math.PI / 2;
    const tron = Math.min(1, f * 1.6);
    const tg = 0.5 / Math.cos((((a - Math.PI / 2) % (Math.PI * 2 / 3)) + Math.PI * 2 / 3) % (Math.PI * 2 / 3) - Math.PI / 3);
    const rr = r * (tg * (1 - tron) + tron);
    return [Math.cos(a) * rr, h, Math.sin(a) * rr];
  };
  const ds = [];
  const rT = 0.016 * k;
  for (let i = 0; i < N; i++) for (let j = 0; j < 6; j++) {
    ds.push(thanhNoi(diem(i, j), diem(i + 1, j), j % 2 ? rT * 0.8 : rT * 1.4, 5));
    ds.push(thanhNoi(diem(i + 1, j), diem(i + 1, (j + 1) % 6), rT * 0.7, 5));
    ds.push(thanhNoi(diem(i, j), diem(i + 1, (j + 1) % 6), rT * 0.55, 4));
  }
  const vlThep = vlKimLoai(0xdfe4ec, 0.3);
  nhom.add(new THREE.Mesh(ghep(ds), vlThep));
  // lõi, chân đế, cột ăng-ten
  nhom.add(new THREE.Mesh(dat(new THREE.CylinderGeometry(0.05 * k, 0.07 * k, hThan, 12), { y: hThan / 2 }), vlSon(0xcfd4dc, 0.5)));
  nhom.add(new THREE.Mesh(dat(new THREE.CylinderGeometry(rDay * 1.15, rDay * 1.25, 0.06 * k, 24), { y: 0.03 * k }), vlSon(0x3b404a, 0.8)));
  nhom.add(new THREE.Mesh(dat(new THREE.CylinderGeometry(0.012 * k, 0.03 * k, cao - hThan + 0.1 * k, 8), { y: hThan + (cao - hThan) / 2 }), vlThep));
  // hai đài quan sát
  const vlCua = vlSang(0xffd9a0, 1.5);
  const vlVoDai = vlKimLoai(0x5d6470, 0.35);
  const yDai = [hThan * 0.56, hThan * 0.8];
  yDai.forEach((y, i) => {
    const r = (i ? 0.2 : 0.27) * k, h = (i ? 0.1 : 0.15) * k;
    const p = [[0, -h * 0.75], [r * 0.6, -h * 0.75], [r, -h * 0.3], [r, h * 0.35], [r * 0.8, h * 0.7], [0, h * 0.7]].map(([a, b]) => new THREE.Vector2(a, y + b));
    nhom.add(new THREE.Mesh(new THREE.LatheGeometry(p, 32), vlVoDai));
    nhom.add(new THREE.Mesh(dat(new THREE.CylinderGeometry(r * 1.012, r * 1.012, h * 0.45, 32, 1, true), { y: y + h * 0.04 }), vlCua));
  });
  // đèn báo không
  const denBao = [hThan * 0.8 + 0.08 * k, cao + 0.02 * k].map((y) => { const d = domSang(0xff3a2a, 0.12 * k, 3); d.position.y = y; nhom.add(d); return d; });
  const NEO = { chan: [0, 0, 0], dai1: [0, yDai[0], 0], dai2: [0, yDai[1], 0], dinh: [0, cao, 0] };
  let gio = 0;
  const ketQua = {
    nhom,
    neo(ten, out = new THREE.Vector3()) { return out.set(...(NEO[ten] || NEO.chan)); },
    capNhat(dt) { gio += dt; const b = (gio % 1.6) < 0.25 ? 1 : 0.08; for (const d of denBao) d.material.opacity = b; },
    soTamGiac: 0,
  };
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}
