import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 2 — Ngân Hà.
// Đơn vị: 1 = 1 000 năm ánh sáng. Mặt phẳng Ngân Hà là mặt XZ, trục Y hướng về cực bắc thiên hà.
// Góc θ đo ngược chiều kim đồng hồ khi nhìn từ cực bắc: vị trí = (R·cosθ, y, −R·sinθ).
// Mặt Trời ở θ = π, quay thuận chiều kim đồng hồ (θ giảm dần).
//
// Hình (Bản 3) gồm nhiều lớp chồng lên nhau, như một ảnh thiên văn:
//   1. ánh sáng nền liền mạch của đĩa, phình trung tâm, thanh và nhánh (một mặt phẳng tô bằng shader);
//   2. hạt sao: sao già vàng trong đĩa, sao trẻ xanh và vùng khí hydro hồng rải theo nhánh, sao vàng cam ở thanh;
//   3. các dải bụi tối ở mép trong của nhánh (năm lớp mỏng, càng nhìn xiên càng đậm, nhìn ngang mép đĩa thành một vệt tối);
//   4. quần sao cầu trong quầng; lỗ đen Sagittarius A* (hình minh hoạ, chỉ hiện khi bay lại gần tâm);
//   5. bong bóng Fermi và eROSITA: khối khí phát sáng, vẽ bằng cách đi dọc tia nhìn qua khối (dò tia thể tích).
// Mọi lớp quay đúng như mô hình của Bản 2: sao đĩa theo đường cong quay, hình mẫu nhánh 25 km/s/kpc, thanh 40 km/s/kpc.

import * as THREE from 'three';
import { so } from '../vat-ly/hang-so.js';
import { taoNhan, taoDom, taoNenSao, taoNgauNhien, DuongDay, duongTron, donViMoiDiemAnh, goNhanDeNhau } from '../khung/ve.js';
import { khungDoThi, MAU } from '../khung/giao-dien.js';
import { taoSao, taoLoDenNho, taoThienHaNho } from '../khung/hanh-tinh.js';
import { GLSL_NHIEU } from '../khung/hanh-tinh-glsl.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('ngan-ha', khoa, goc, thamSo);

export const R0 = 26.7;                 // Mặt Trời cách tâm 26 700 năm ánh sáng
export const V0 = 0.7672;               // 230 km/s đổi ra nghìn năm ánh sáng mỗi triệu năm
export const OM_NHANH = 0.02557;        // tốc độ góc của hình mẫu nhánh xoắn: 25 km/s/kpc (rad/triệu năm)
const OM_THANH = 0.0409;         // thanh trung tâm: 40 km/s/kpc
const TAN_P = Math.tan((12.5 * Math.PI) / 180);  // góc mở của nhánh xoắn ≈ 12,5°
const R_REF = 22.2;              // nhánh Sagittarius cắt đường Mặt Trời–tâm ở 22 200 năm ánh sáng
export const omegaSao = (R) => (V0 * Math.tanh(R / 3)) / R;
const OM_MT = omegaSao(R0);      // ≈ 0,0287 rad/triệu năm → một vòng ≈ 219 triệu năm
export const CHU_KY_MT = (2 * Math.PI) / OM_MT;
const yMatTroi = (t) => 0.3 * Math.sin((2 * Math.PI * t) / 85 + 0.218);
const GOC_THANH = Math.PI - (27 * Math.PI) / 180;   // đầu gần của thanh lệch 27° về phía kinh độ dương

// ----- Số liệu cho tương tác, âm thanh, thử thách (có phép kiểm trong kiem-tra/kiem-ngan-ha.mjs) -----
// Tốc độ quay (km/s) ở bán kính R (nghìn năm ánh sáng): mô hình đường cong quay gần phẳng, và «theo Kepler» nếu mọi
// khối lượng nằm trong quỹ đạo Mặt Trời.
export const V_KMS = 230;
export const vDoDuoc = (R) => V_KMS * Math.tanh(R / 3);
export const vKepler = (R) => V_KMS * Math.sqrt(R0 / R);
// Vòng đồng quay: bán kính mà sao đi một vòng mất đúng bằng hình mẫu nhánh.
export function banKinhDongQuay() {
  let a = 10, b = 60;
  for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (omegaSao(m) > OM_NHANH) a = m; else b = m; }
  return (a + b) / 2;
}
// Âm thanh: cao độ tỉ lệ với tốc độ quay, 2 Hz cho mỗi km/s (230 km/s → 460 Hz).
export const HZ_MOI_KM_S = 2;
// Kepler cho một khối lượng tâm: T² = a³/M (năm, AU, khối lượng Mặt Trời).
export const M_SGR = 4.3e6;
export const chuKyQuanhSgr = (aAU) => Math.sqrt(aAU ** 3 / M_SGR);
export const E_S2 = 0.88;               // tâm sai quỹ đạo S2 (GRAVITY 2018: 0,886)
// Đích của các thử thách
export const TT_DONG_QUAY_SAI = 0.03;   // |Ω_sao/Ω_nhánh − 1|
export const TT_KEPLER_TI = 0.75, TT_KEPLER_SAI = 0.015;   // v_Kepler / v_đo được
export const TT_S2_T = 16, TT_S2_SAI = 0.5;                // năm
// Quỹ đạo S2 trong hình: phóng to, 1 AU vẽ thành 1/480 nghìn năm ánh sáng.
export const S2_DON_VI = 1 / 480;

const R = String.raw;
const lin = (c) => Math.pow(c, 2.2);   // màu «mắt nhìn» → màu tuyến tính cho bộ dựng hình

// ---------------------------------------------------------------------------
// Hạt sao. Thuộc tính aDL = (R, θ, y, loại): loại 0 sao đĩa (quay theo đường cong quay, sáng lên khi qua nhánh),
// 1 sao trẻ và vùng khí trong nhánh (đi theo hình mẫu nhánh), 2 thanh và phình (quay như vật cứng), 3 đứng yên.
// ---------------------------------------------------------------------------
function taoHat() {
  const rnd = taoNgauNhien(20261111);
  const dl = [], mau = [], co = [], vt = [];
  const them = (R, th, y, loai, r, g, b, a, c, x = 0, yy = 0, z = 0) => {
    dl.push(R, th, y, loai); mau.push(lin(r), lin(g), lin(b), a); co.push(c); vt.push(x, yy, z);
  };
  const sech2 = (h) => h * Math.atanh(Math.max(-0.999, Math.min(0.999, 2 * rnd() - 1)));

  // 1. Đĩa sao già: mật độ giảm theo hàm mũ, thang 8 500 năm ánh sáng
  for (let i = 0; i < 130000; i++) {
    const R = -8.5 * Math.log(Math.max(1e-9, rnd() * rnd()));
    if (R > 58 || R < 0.6) { i--; continue; }
    const day = rnd() < 0.16;
    const k = 0.7 + 0.6 * rnd();
    const am = rnd();
    them(R, rnd() * 2 * Math.PI, sech2(day ? 2.4 : 0.8), 0, 1.0, 0.84 + 0.1 * am, 0.62 + 0.18 * am, 0.16 * k, 0.17 + 0.15 * rnd());
  }
  // 2. Sao trẻ trong bốn nhánh chính + nhánh Orion; vùng khí hydro phát sáng hồng thành từng đám
  const NHANH = [[Math.PI, 0.18], [Math.PI / 2, 0.32], [0, 0.18], [-Math.PI / 2, 0.32]];
  const viTriNhanh = () => {
    let R, th;
    if (rnd() < 0.05) {            // nhánh Orion: một đoạn ngắn ngay ngoài Mặt Trời
      th = Math.PI - 0.5 + 1.15 * rnd();
      R = 27.7 * Math.exp((th - Math.PI) * Math.tan((11 * Math.PI) / 180)) + rnd.chuan() * 0.5;
    } else {
      let u = rnd(), d = 0;
      for (const [dd, w] of NHANH) { if (u < w) { d = dd; break; } u -= w; d = dd; }
      R = 9 - 16 * Math.log(1 - rnd() * (1 - Math.exp(-46 / 16)));
      th = Math.PI + Math.log(R / R_REF) / TAN_P + d;
      R += rnd.chuan() * (0.55 + 0.018 * R);
      th += (rnd.chuan() * 0.45) / R;
    }
    return [R, th];
  };
  for (let i = 0; i < 72000; i++) {
    const [R, th] = viTriNhanh();
    const y = rnd.chuan() * 0.28, k = rnd();
    if (k < 0.1) them(R, th, y, 1, 0.75, 0.86, 1.0, 0.55, 0.3 + 0.16 * rnd());     // sao trẻ rất sáng
    else them(R, th, y, 1, 0.82, 0.9, 1.0, 0.26, 0.18 + 0.1 * rnd());
  }
  for (let j = 0; j < 1100; j++) {                 // vùng tạo sao: đám khí hồng quanh vài sao xanh rất nóng
    const [R0d, th0] = viTriNhanh();
    if (R0d < 6) continue;
    const n = 6 + Math.floor(rnd() * 12), to = 0.12 + 0.22 * rnd();
    for (let i = 0; i < n; i++) {
      const dx = rnd.chuan() * to, dz = rnd.chuan() * to;
      them(R0d + dx, th0 + dz / R0d, rnd.chuan() * 0.08, 1, 1.0, 0.36, 0.56, 0.42, 0.22 + 0.3 * rnd());
    }
    for (let i = 0; i < 2; i++) them(R0d + rnd.chuan() * to * 0.6, th0 + (rnd.chuan() * to * 0.6) / R0d, rnd.chuan() * 0.05, 1, 0.7, 0.82, 1.0, 0.9, 0.3);
  }
  // 3. Thanh và phình trung tâm
  const cT = Math.cos(GOC_THANH), sT = Math.sin(GOC_THANH);
  for (let i = 0; i < 52000; i++) {
    let a, b, c;
    if (rnd() < 0.6) { a = rnd.chuan() * 4.4; b = rnd.chuan() * 2.0; c = rnd.chuan() * 1.6; }
    else { a = (rnd() * 2 - 1) * 14.5; b = rnd.chuan() * 1.15; c = rnd.chuan() * 0.55; }
    const x = a * cT - b * sT, y = a * sT + b * cT;
    if (x * x + y * y + c * c < 0.8) { i--; continue; }   // chừa lõi cho lỗ đen và quỹ đạo sao S2 khi bay lại gần
    const am = rnd();
    them(Math.hypot(x, y), Math.atan2(y, x), c, 2, 1.0, 0.74 + 0.1 * am, 0.46 + 0.12 * am, 0.07 + 0.05 * rnd(), 0.2 + 0.14 * rnd());
  }
  // 4. Hàng xóm: hai đám mây Magellan, thiên hà Tiên Nữ (M31), Tam Giác (M33)
  const thienHaNho = ({ tam, n, thang, catTai, phap, phinh = 0, mauSac = [0.9, 0.92, 1.0], doSang = 0.35, coHat = 0.4, day = 0.08 }) => {
    const N = new THREE.Vector3(...phap).normalize();
    const U = new THREE.Vector3(1, 0.3, 0.2).cross(N).normalize();
    const W = new THREE.Vector3().crossVectors(N, U);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const laPhinh = rnd() < phinh;
      let R = laPhinh ? Math.abs(rnd.chuan()) * thang * 0.5 : -thang * Math.log(Math.max(1e-9, rnd() * rnd()));
      if (R > catTai) { i--; continue; }
      const p = rnd() * 2 * Math.PI;
      const cao = rnd.chuan() * (laPhinh ? thang * 0.35 : thang * day);
      v.set(0, 0, 0).addScaledVector(U, R * Math.cos(p)).addScaledVector(W, R * Math.sin(p)).addScaledVector(N, cao);
      const m = laPhinh ? [1.0, 0.82, 0.58] : mauSac;
      them(0, 0, 0, 3, m[0], m[1], m[2], doSang * (0.7 + 0.6 * rnd()), coHat * (0.7 + 0.6 * rnd()), tam[0] + v.x, tam[1] + v.y, tam[2] + v.z);
    }
  };
  thienHaNho({ tam: [-1.8, -88.5, 134.6], n: 5200, thang: 3.6, catTai: 16, phap: [0.3, 0.75, 0.6], day: 0.25, doSang: 0.3, coHat: 0.5 });
  thienHaNho({ tam: [50.8, -139.7, 120.3], n: 2000, thang: 2.2, catTai: 9, phap: [0.6, 0.2, 0.8], day: 0.5, doSang: 0.28, coHat: 0.5 });
  // Tiên Nữ và Tam Giác: vẽ bằng taoThienHaNho (có nhánh xoắn, lõi vàng) trong tao(), không còn là đám hạt trơn.

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vt), 3));
  geo.setAttribute('aDL', new THREE.BufferAttribute(new Float32Array(dl), 4));
  geo.setAttribute('aMau', new THREE.BufferAttribute(new Float32Array(mau), 4));
  geo.setAttribute('aCo', new THREE.BufferAttribute(new Float32Array(co), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uPx: { value: 1000 }, uSang: { value: 1 }, uXom: { value: 1 }, uGiu: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec4 aDL; attribute vec4 aMau; attribute float aCo;
      uniform float uT, uPx, uSang, uXom, uGiu; varying vec4 vMau;
      const float V0 = ${V0.toFixed(5)}, OM_P = ${OM_NHANH.toFixed(6)}, OM_B = ${OM_THANH.toFixed(6)}, TANP = ${TAN_P.toFixed(6)}, R_REF = ${R_REF.toFixed(2)};
      void main() {
        float R = aDL.x, th = aDL.y, loai = aDL.w, sang = 1.0;
        // Lùi thật xa, cả Ngân Hà chỉ còn vài chục điểm ảnh: hàng trăm nghìn đốm chồng lên cùng một chỗ làm card đồ hoạ
        // phải trộn màu hàng nghìn lần mỗi điểm ảnh. Khi đó chỉ vẽ một phần (uGiu) số hạt, chọn ngẫu nhiên cố định theo hạt,
        // và nhân độ sáng lên 1/uGiu cho tổng ánh sáng giữ nguyên.
        float giu = 1.0;
        if (loai < 2.5 && uGiu < 0.999) {
          if (fract(sin(dot(aDL.xyz, vec3(12.9898, 78.233, 37.719)) + aCo * 91.7) * 43758.5453) > uGiu) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vMau = vec4(0.0); return;
          }
          giu = 1.0 / uGiu;
        }
        vec3 p = position;
        if (loai < 0.5) {            // sao đĩa: gần tâm quay một vòng nhanh hơn; sáng lên khi băng qua nhánh
          th -= V0 * tanh(R / 3.0) / R * uT;
          float d = th - (3.14159265 + log(R / R_REF) / TANP - OM_P * uT);
          float f = 0.5 + 0.5 * cos(4.0 * d), sd = sin(d);
          float vung = smoothstep(9.0, 14.0, R) * (1.0 - smoothstep(47.0, 58.0, R));
          sang = 1.0 + 2.2 * vung * f * f * f * (0.5 + 0.5 * sd * sd);
          p = vec3(R * cos(th), aDL.z, -R * sin(th));
        } else if (loai < 1.5) {     // sao trẻ: sinh ra trong nhánh nên đi theo hình mẫu nhánh
          th -= OM_P * uT; p = vec3(R * cos(th), aDL.z, -R * sin(th));
        } else if (loai < 2.5) {     // thanh trung tâm quay như một vật cứng
          th -= OM_B * uT; p = vec3(R * cos(th), aDL.z, -R * sin(th));
        }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float px = aCo * uPx / max(0.001, -mv.z);
        gl_PointSize = clamp(px, 1.3, aCo > 1.5 ? 90.0 : 10.0);
        // hạt nhỏ hơn điểm ảnh: giữ cỡ tối thiểu, mờ bớt cho đúng tổng ánh sáng
        // thiên hà hàng xóm (loại 3) mờ đi khi máy quay ở sâu trong Ngân Hà (từ tâm nhìn ra, Tiên Nữ chỉ là vệt mờ sau phình)
        float xom = loai > 2.5 ? uXom : 1.0;
        vMau = vec4(aMau.rgb, aMau.a * sang * giu * clamp(px / 1.3, 0.25, 1.0) * uSang * xom * smoothstep(1.5, 7.0, -mv.z));
      }`,
    fragmentShader: /* glsl */ `
      varying vec4 vMau;
      void main() {
        vec2 v = gl_PointCoord * 2.0 - 1.0;
        float d2 = dot(v, v);
        if (d2 > 1.0) discard;             // góc vuông ngoài đốm tròn: không góp gì, bỏ sớm
        float a = exp(-d2 * 4.5) * (1.0 - smoothstep(0.64, 1.0, d2));
        gl_FragColor = vec4(vMau.rgb, vMau.a * a);
      }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
  });
  mat.tuyenTinh = true;
  const diem = new THREE.Points(geo, mat);
  diem.frustumCulled = false;
  diem.renderOrder = 1;
  return { diem, mat };
}

// Hình mẫu nhánh dùng chung cho các shader của đĩa (cùng công thức với hạt sao ở trên).
const GLSL_NHANH = /* glsl */ `
  const float OM_P = ${OM_NHANH.toFixed(6)}, OM_B = ${OM_THANH.toFixed(6)}, TANP = ${TAN_P.toFixed(6)}, R_REF = ${R_REF.toFixed(2)};
  const float GOC_THANH = ${GOC_THANH.toFixed(6)};
  // độ lệch pha so với nhánh gần nhất (−π/4 … π/4) và trọng số của nhánh ấy (hai nhánh lớn đậm hơn hai nhánh nhỏ)
  vec2 phaNhanh(float R, float th, float t) {
    float d = th - (3.14159265 + log(max(R, 0.3) / R_REF) / TANP - OM_P * t);
    float k = floor(d / 1.5707963 + 0.5);
    float dd = d - k * 1.5707963;
    float w = mod(k, 2.0) > 0.5 ? 1.0 : 0.62;
    return vec2(dd, w);
  }
`;

// ---------------------------------------------------------------------------
// Lớp 1: ánh sáng nền của đĩa (vô số sao không phân biệt được), tô trên một mặt phẳng.
// ---------------------------------------------------------------------------
function taoAnhSangNen() {
  const geo = new THREE.PlaneGeometry(132, 132, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uSang: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vW;
      void main() { vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uT, uSang;
      varying vec3 vP; varying vec3 vW;
      ${GLSL_NHIEU}
      ${GLSL_NHANH}
      void main() {
        float R = length(vP.xz);
        if (R > 64.0) discard;
        float th = atan(-vP.z, vP.x);
        // thanh và phình: toạ độ dọc (a) và ngang (b) theo trục thanh đang quay
        float gb = GOC_THANH - OM_B * uT;
        vec2 ab = vec2(dot(vec2(vP.x, -vP.z), vec2(cos(gb), sin(gb))), dot(vec2(vP.x, -vP.z), vec2(-sin(gb), cos(gb))));
        float phinh = exp(-2.2 * pow((ab.x * ab.x) / 10.0 + (ab.y * ab.y) / 3.2, 0.55));
        float thanh = exp(-pow(ab.x / 11.5, 4.0) - pow(ab.y / 1.6, 2.0));
        float loi = exp(-length(ab * vec2(1.0, 1.7)) / 0.55);
        // đĩa: hàm mũ, thang 8 500 năm ánh sáng, mờ dần ở mép
        float dia = exp(-R / 8.5) * (1.0 - smoothstep(40.0, 62.0, R));
        // nhánh: sáng, xanh hơn; có đốm mây sao
        vec2 pn = phaNhanh(R, th, uT);
        float vung = smoothstep(6.0, 12.0, R) * (1.0 - smoothstep(46.0, 60.0, R));
        float nhanh = exp(-pow(pn.x / 0.2, 2.0)) * pn.y * vung;
        float gn = th + OM_P * uT;                    // toạ độ quay theo hình mẫu nhánh (đốm mây sao đi theo nhánh)
        vec3 q = vec3(R * cos(gn), R * sin(gn), 0.0) * 0.42;
        float dom = 0.55 + 0.9 * max(fbm(q, 4, 0.0), -0.4);
        float sangNhanh = nhanh * exp(-R / 19.0) * 1.15 * dom;
        float sangDia = dia * (0.55 + 0.25 * dom);
        vec3 c = vec3(1.0, 0.6, 0.28) * (phinh * 2.6 + thanh * 0.8 + loi * 2.2)
               + vec3(0.95, 0.78, 0.55) * sangDia * 0.75
               + vec3(0.55, 0.7, 1.0) * sangNhanh;
        // lớp sáng mỏng: nhìn xiên thì dày hơn (giới hạn để mép đĩa không cháy)
        vec3 toiMat = normalize(cameraPosition - vW);
        float xien = clamp(1.0 / max(abs(toiMat.y), 0.05), 1.0, 2.6);
        gl_FragColor = vec4(c * uSang * xien, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  mat.tuyenTinh = true;
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 0;
  return { mesh: m, mat };
}

// ---------------------------------------------------------------------------
// Lớp 3: bụi tối. Năm lớp mỏng ở các độ cao khác nhau; bề dày quang học tỉ lệ với quãng đường tia nhìn đi trong lớp
// (1/|cos|), nên nhìn từ trên xuống thấy dải bụi mảnh dọc nhánh, nhìn ngang mép thấy một vệt tối cắt ngang phình.
// ---------------------------------------------------------------------------
function taoBui() {
  const nhom = new THREE.Group();
  const geo = new THREE.PlaneGeometry(110, 110, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const uT = { value: 0 }, uDam = { value: 1 };
  // Hai lớp (trước là năm): bề dày quang học tổng giữ nguyên (tổng trọng số 4,5), nhìn gần như y hệt mà mỗi điểm ảnh
  // chỉ phải tính nhiễu hai lần thay vì năm (đo trên app thật: năm lớp phủ kín màn hình là phần nặng nhất của bài).
  const LOP = [[-0.06, 2.25], [0.06, 2.25]];
  const mats = [];
  for (const [y, w] of LOP) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uT, uDam, uW: { value: w / 4.5 }, uHat: { value: y * 7.0 } },
      vertexShader: /* glsl */ `
        varying vec3 vP; varying vec3 vW;
        void main() { vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uT, uDam, uW, uHat;
        varying vec3 vP; varying vec3 vW;
        ${GLSL_NHIEU}
        ${GLSL_NHANH}
        void main() {
          float R = length(vP.xz);
          if (R > 54.0) discard;
          // hệ số theo góc nhìn tính trước: bằng 0 (nhìn sát mép, ở xa) thì bỏ luôn, khỏi tính nhiễu
          vec3 toiMat = normalize(cameraPosition - vW);
          float cos0 = max(abs(toiMat.y), 0.03);
          float hienGoc = max(smoothstep(0.04, 0.2, abs(toiMat.y)), smoothstep(45.0, 90.0, length(cameraPosition - vW)));
          if (hienGoc * uDam < 0.002) discard;
          float th = atan(-vP.z, vP.x);
          vec2 pn = phaNhanh(R, th, uT);
          // dải bụi nằm ở mép trong của nhánh (phía khí chảy vào nhánh), mảnh và đứt quãng
          float lan = exp(-(((pn.x - 0.12) / 0.06) * ((pn.x - 0.12) / 0.06))) * (0.6 + 0.4 * pn.y);
          float gn = th + OM_P * uT;
          vec3 q = vec3(R * cos(gn), R * sin(gn), uHat);
          float soi = fbm(q * 0.55, 4, 0.0);
          float gon = fbmGon(q * 1.3, 3, 0.0);
          float vung = smoothstep(7.0, 12.0, R) * (1.0 - smoothstep(34.0, 52.0, R));
          // bụi dọc mép trước của thanh, và một lớp bụi mỏng rải khắp đĩa trong
          float gb = GOC_THANH - OM_B * uT;
          vec2 ab = vec2(dot(vec2(vP.x, -vP.z), vec2(cos(gb), sin(gb))), dot(vec2(vP.x, -vP.z), vec2(-sin(gb), cos(gb))));
          float thanh = exp(-pow(ab.x / 9.0, 4.0)) * exp(-pow((abs(ab.y) - 1.3) / 0.35, 2.0)) * smoothstep(1.5, 3.0, abs(ab.x));
          float tau = (lan * (0.6 + 1.3 * max(soi + 0.25, 0.0)) * (0.6 + 0.7 * gon) + 0.22 * (0.4 + 0.6 * max(soi + 0.3, 0.0))) * vung * 3.4 + thanh * 0.9 * (0.6 + 0.6 * gon);
          float a = (1.0 - exp(-tau * uW * uDam / cos0)) * hienGoc;
          gl_FragColor = vec4(vec3(0.016, 0.010, 0.007), a);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    mat.tuyenTinh = true;
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y;
    m.renderOrder = 2;
    nhom.add(m);
    mats.push(mat);
  }
  return { nhom, uT, uDam };
}

// ---------------------------------------------------------------------------
// Bong bóng: khối khí phát sáng hình giọt nước ngược ở hai phía mặt đĩa. Đi dọc tia nhìn qua khối (18 bước), cộng
// ánh sáng của khí: trong lòng sáng đều, mép rõ và sáng hơn một chút (như ảnh tia gamma, tia X), có gợn mây.
// Bán kính theo độ cao giữ đúng hình của Bản 2 (hẹp ở gốc, phình ở giữa, khép ở đỉnh).
// ---------------------------------------------------------------------------
function taoBongBong(cao, rongNua, mau, doSang) {
  const geo = new THREE.BoxGeometry(2, 2, 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uCao: { value: cao }, uRong: { value: rongNua }, uMau: { value: new THREE.Color(mau) }, uSang: { value: doSang }, uT: { value: 0 }, uHien: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vO; varying vec3 vRo;
      void main() { vO = position; vRo = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uCao, uRong, uSang, uT, uHien; uniform vec3 uMau;
      varying vec3 vO; varying vec3 vRo;
      ${GLSL_NHIEU}
      float banKinh(float t) { return uRong * pow(max(sin(3.14159265 * pow(clamp(t, 0.0, 1.0), 0.78)), 0.0), 0.72); }
      void main() {
        // tia nhìn trong hệ của hộp (hộp [-1, 1]³ co giãn thành rongNua × cao × rongNua)
        vec3 ro = vRo;
        vec3 rd = normalize(vO - ro);
        vec3 t1 = (-1.0 - ro) / rd, t2 = (1.0 - ro) / rd;
        vec3 tn = min(t1, t2), tf = max(t1, t2);
        float t0 = max(max(max(tn.x, tn.y), tn.z), 0.0), tk = min(min(tf.x, tf.y), tf.z);
        if (tk <= t0) discard;
        vec3 thang = vec3(uRong, uCao, uRong);
        const int N = 18;
        float buoc = (tk - t0) / float(N);
        float dai = length(rd * thang) * buoc;          // độ dài thật của một bước
        float lech = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
        float tong = 0.0;
        for (int i = 0; i < N; i++) {
          vec3 p = (ro + rd * (t0 + (float(i) + lech) * buoc)) * thang;
          float h = abs(p.y) / uCao;
          float rb = banKinh(h);
          float s = (length(p.xz) - rb) / uRong;
          float trong = smoothstep(0.03, -0.05, s);
          float vien = exp(-(((s + 0.035) / 0.05) * ((s + 0.035) / 0.05)));
          float goc = smoothstep(0.0, 0.06, h) * smoothstep(1.0, 0.86, h);
          float g = (trong * 0.35 + vien * 0.75) * goc;
          if (g < 1e-3) continue;              // mẫu nằm ngoài khối khí: khỏi tính nhiễu (phần nặng nhất)
          float may = 0.7 + 0.6 * fbm(p * 0.16 + vec3(0.0, uT * 0.02, 0.0), 3, 0.0);
          tong += g * may;
        }
        float I = tong * dai / uRong * uSang * uHien;
        gl_FragColor = vec4(uMau * I, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, side: THREE.BackSide,
  });
  mat.tuyenTinh = true;
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(rongNua * 1.02, cao * 1.01, rongNua * 1.02);
  m.renderOrder = 6;
  m.frustumCulled = false;
  return { mesh: m, mat };
}

// Quần sao cầu: đốm sáng tròn mềm, lõi đặc (khoảng 150 cụm, như Ngân Hà thật), đứng yên trong mô hình.
function taoQuanSaoCau() {
  const rnd = taoNgauNhien(7341);
  const n = 150, p = new Float32Array(n * 3), s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = 3 + 62 * Math.pow(rnd(), 2.4), z = rnd() * 2 - 1, ph = rnd() * 2 * Math.PI, c = Math.sqrt(1 - z * z);
    p.set([r * c * Math.cos(ph), r * z * 0.8, r * c * Math.sin(ph)], i * 3);
    s[i] = 0.6 + 0.8 * rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  geo.setAttribute('aS', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: 1000 }, uSang: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aS; uniform float uPx; varying float vS;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(0.5 * aS * uPx / max(-mv.z, 0.01), 3.0, 40.0);
        vS = aS;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uSang; varying float vS;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float k = exp(-d * d * 9.0) * 1.6 + exp(-d * d * 2.5) * 0.25;
        k *= 1.0 - smoothstep(0.85, 1.0, d);
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.6) * k * uSang * (0.5 + 0.5 * vS), 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  mat.tuyenTinh = true;
  const diem = new THREE.Points(geo, mat);
  diem.frustumCulled = false;
  diem.renderOrder = 3;
  return { diem, mat, viTri: p };
}

// Giải phương trình Kepler E − e sin E = M.
function giaiKepler(M, e) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 20; i++) { const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-10) break; }
  return E;
}

export default {
  id: 'ngan-ha',
  ten: 'Ngân Hà: thành phố sao của chúng ta',
  moTa: 'Vài trăm tỉ ngôi sao, một lỗ đen ở giữa, hai bong bóng khổng lồ',
  yChinh: 'Mặt Trời chỉ là một trong vài trăm tỉ ngôi sao của Ngân Hà, nằm cách tâm 26 700 năm ánh sáng. Sao ở xa tâm vẫn quay nhanh gần bằng sao ở gần: dấu hiệu của **vật chất tối**. Ở chính giữa là lỗ đen Sagittarius A* nặng 4,3 triệu Mặt Trời; phía trên và phía dưới nó phồng lên hai bong bóng khổng lồ.',
  giaiThich: R`
    Mỗi chấm sáng ở đây đại diện cho hàng triệu ngôi sao. Hình dạng dựng theo hiểu biết hiện nay: một **thanh sao** ở giữa, **bốn nhánh xoắn ốc** chính, đĩa mỏng chỉ dày khoảng 1 000 năm ánh sáng so với bề ngang 100 000 năm ánh sáng. Vì ta nằm bên trong nên bản đồ này còn nhiều chỗ chưa chắc, nhất là nửa bên kia tâm.

    Nhánh xoắn ốc là **sóng mật độ**, không phải dải sao cố định. Đường cong quay gần như phẳng là bằng chứng của vật chất tối. Bong bóng Fermi (2010, tia gamma) và bong bóng eROSITA (2020, tia X) nhiều khả năng là dấu vết những đợt bùng phát năng lượng ở vùng tâm.`,
  hinh: { quang: 0.3, banKinh: 0.42, nguong: 1.05 },
  mayAnh: { viTri: [-14, 82, 112], dich: [0, 0, 0], fov: 45, min: 1.5, max: 9000 },

  baiGiang: {
    mucTieu: [
      'Tả được hình dạng Ngân Hà: đĩa, phình trung tâm, thanh, nhánh xoắn ốc, quầng.',
      'Giải thích được vì sao nhánh xoắn ốc là sóng mật độ chứ không phải dải sao cố định.',
      'Tính được khối lượng bên trong quỹ đạo Mặt Trời từ $v^2R/G$, và đọc được đường cong quay như bằng chứng của vật chất tối.',
      'Dùng định luật Kepler để suy ra khối lượng lỗ đen Sagittarius A* từ quỹ đạo sao S2.',
      'Nói được Ngân Hà đứng ở đâu giữa các thiên hà hàng xóm.',
    ],
    buoc: [
      {
        ten: 'Một chiếc đĩa có thanh ở giữa',
        noiDung: R`
          Bạn đang nhìn Ngân Hà từ bên ngoài, ở góc chếch phía trên. Mỗi chấm sáng đại diện cho hàng triệu ngôi sao; cả Ngân Hà có khoảng 100–400 tỉ sao. Có ba phần chính:

          - **Đĩa**: rộng khoảng 100 000 năm ánh sáng nhưng chỉ dày chừng 1 000 năm ánh sáng, mỏng như một chiếc đĩa CD. Mặt Trời nằm trong đĩa.
          - **Phình trung tâm và thanh**: vùng sao già màu vàng cam ở giữa, kéo dài thành một **thanh** dài khoảng 30 000 năm ánh sáng. Ngân Hà là một {{thiên hà xoắn ốc có thanh}}.
          - **Nhánh xoắn ốc**: những dải sáng hơn, xanh hơn quấn quanh đĩa, nơi có nhiều sao trẻ và khí.

          Quanh tất cả là một **quầng** gần tròn, thưa thớt, có các cụm sao cầu (chấm vàng rải rác).

          > [Hiểu sai thường gặp] Chưa ai chụp được Ngân Hà từ bên ngoài. Hình này dựng lại từ khoảng cách và vận tốc đo được của sao, khí hydro và mây phân tử. Nửa bên kia tâm bị bụi che, nên phần đó chắc chắn kém hơn.

          > [Thử ngay] Rê chuột lên phình trung tâm, các nhánh, Mặt Trời hay một cụm sao cầu để xem tên và số liệu. Nhìn ngang mép đĩa để thấy dải bụi tối cắt ngang phình.
          > [[Nhìn từ trên xuống|tren]] [[Nhìn ngang mép đĩa|ngang]] [[Toàn cảnh|toan]]`,
        vao: (c) => c.buoc({ mayAnh: 'toan', bong: false }),
        nut: { tren: (c) => c.goc('tren'), ngang: (c) => c.goc('ngang'), toan: (c) => c.goc('toan') },
      },
      {
        ten: 'Nhánh xoắn ốc là sóng, không phải dây sao',
        noiDung: R`
          Cho thời gian chạy nhanh rồi nhìn từ trên xuống. Sao gần tâm đi hết một vòng nhanh hơn sao ở xa: trong mô hình, sao cách tâm 13 000 năm ánh sáng đi một vòng mất khoảng 107 triệu năm, Mặt Trời mất khoảng 219 triệu năm.

          Nếu nhánh là một dây sao cố định, chênh lệch ấy sẽ cuốn nó lại: cứ mỗi tỉ năm, đoạn trong quay hơn đoạn ngoài gần **5 vòng**. Ngân Hà đã hơn 10 tỉ tuổi mà nhánh vẫn mở. Lời giải thích được chấp nhận rộng rãi: nhánh là một {{sóng mật độ}}.

          Giống chỗ kẹt xe trên đường cao tốc: xe chạy vào chỗ kẹt, chậm lại, rồi chạy ra; chỗ kẹt vẫn ở đó dù xe trong đó đổi liên tục. Sao và khí cũng đi xuyên qua nhánh. Ở nhánh khí bị nén lại, sao mới ra đời, và những sao xanh rất sáng sống chỉ vài triệu năm nên tắt trước khi kịp rời nhánh. Vì vậy nhánh sáng và xanh.

          > [Lưu ý] Trong mô hình, hình mẫu nhánh quay đều với tốc độ góc 25 km/s mỗi kiloparsec (một vòng khoảng 246 triệu năm), sao đĩa sáng lên khi băng qua nhánh, còn hạt «sao trẻ» được cho đi theo nhánh. Đó là cách vẽ minh hoạ cho ý sóng mật độ, không phải mô phỏng động lực học.

          > [Thử ngay] Kéo «sao thử» (ngôi sao xanh lục có tia) ra xa hay vào gần tâm. Ở gần tâm nó vượt qua các nhánh; ở xa thì các nhánh vượt nó. Mỗi lần nó băng qua một nhánh có một tiếng «tinh» (âm thanh minh hoạ).
          > [[Tua nhanh 20 triệu năm mỗi giây|nhanh]] [[Dừng lại|dung]] [[Nhìn từ trên|tren]]`,
        vao: (c) => c.buoc({ tocDo: 20, mayAnh: 'tren', bong: false, luoi: false, saoThu: 'dongquay' }),
        thuThach: {
          de: R`Tìm **vòng đồng quay**: bán kính mà sao thử đi một vòng mất đúng bằng hình mẫu nhánh (246 triệu năm). Ở đó sao nằm yên so với các nhánh, không còn tiếng «tinh» nào. Đạt khi hai chu kỳ lệch nhau dưới 3%.`,
          kiem: (c) => c.daKeo.thu && Math.abs(c.tiDongQuay() - 1) < TT_DONG_QUAY_SAI,
          goiY: 'Sao ở gần tâm quay nhanh hơn hình mẫu nhánh. Kéo sao thử ra dần cho tới khi nó đứng yên so với nhánh; ô số liệu ghi hai chu kỳ. Trong mô hình, vòng này ở khoảng 30 000 năm ánh sáng.',
        },
        nut: { nhanh: (c) => c.datTocDo(20), dung: (c) => c.datTocDo(0), tren: (c) => c.goc('tren') },
      },
      {
        ten: 'Mặt Trời ở đâu?',
        noiDung: R`
          Mặt Trời (chấm vàng có mũi tên) cách tâm khoảng **26 700 năm ánh sáng**, tức 8,2 kiloparsec, hơn nửa đường từ tâm ra mép đĩa. Nó nằm trong **nhánh Orion**, một nhánh phụ ngắn giữa hai nhánh lớn Sagittarius (phía trong) và Perseus (phía ngoài).

          Vệt vàng phía sau là quãng Mặt Trời đi trong 200 triệu năm qua. Như đã tính ở Bài 1, một vòng mất khoảng 220 triệu năm, gọi là một {{năm thiên hà}}.

          Mặt Trời còn nhấp nhô lên xuống qua mặt phẳng đĩa, như con ngựa trên vòng quay ngựa gỗ. Hiện nó ở phía bắc mặt phẳng vài chục năm ánh sáng.

          > [Lưu ý] Độ cao và chu kỳ nhấp nhô trong mô hình (biên độ 300 năm ánh sáng, 85 triệu năm một lần) là minh hoạ; số đo thật còn khác nhau giữa các tác giả. Mặt Trời cũng được vẽ to hơn thật hàng tỉ lần.

          > [Con số] Khoảng cách 8,2 kpc đo được nhờ theo dõi quỹ đạo các sao quanh lỗ đen ở tâm (GRAVITY 2019–2021): biết kích thước quỹ đạo theo AU và góc nó chắn trên bầu trời là suy ra được khoảng cách.

          > [Thử ngay] [[Bay tới chỗ Mặt Trời|mt]] [[Nhìn từ trên|tren]] [[Về hiện tại|nay]]`,
        vao: (c) => c.buoc({ tocDo: 2, mayAnh: 'mt', bong: false, ve0: true }),
        nut: { mt: (c) => c.goc('mt'), tren: (c) => c.goc('tren'), nay: (c) => c.veHienTai() },
      },
      {
        ten: 'Đường cong quay phẳng và vật chất tối',
        noiDung: R`
          Các chấm xanh lục là ba ngôi sao ở 26 700, 38 000 và 50 000 năm ánh sáng. Số đo cho thấy chúng quay với tốc độ **gần như bằng nhau**, khoảng 230 km/s. Đồ thị tốc độ theo khoảng cách (ở phần điều khiển) vì thế gần như nằm ngang: một {{đường cong quay}} phẳng.

          Nếu gần hết khối lượng nằm bên trong quỹ đạo Mặt Trời (như Mặt Trời trong Hệ Mặt Trời), thì càng ra xa sao càng phải chậm, theo định luật Kepler:

          $$ v = \sqrt{\frac{GM}{r}} \quad\Longrightarrow\quad v \propto \frac{1}{\sqrt{r}} $$

          Các chấm hồng là ba sao ấy nếu đi theo Kepler: ở 50 000 năm ánh sáng chỉ còn 168 km/s, tụt lại phía sau. Sao thật không chậm như vậy. Phải có thêm khối lượng ở vùng xa mà ta không thấy: {{vật chất tối}}.

          +++ Đi sâu: cân Ngân Hà bằng tốc độ của Mặt Trời
          Lực hấp dẫn đóng vai trò lực hướng tâm: $GM/R^2 = v^2/R$, nên khối lượng bên trong quỹ đạo là

          $$ \begin{aligned} M = \frac{v^2 R}{G} &= \frac{(2{,}3 \times 10^{5})^2 \times 2{,}53 \times 10^{20}}{6{,}67 \times 10^{-11}} \\ &\approx 2{,}0 \times 10^{41}\ \text{kg} \approx 1{,}0 \times 10^{11}\ M_\odot \end{aligned} $$

          (công thức này đúng cho phân bố khối lượng cầu; với đĩa phẳng, kết quả lệch vài chục phần trăm). Nếu $v$ không đổi thì $M = v^2R/G$ tăng tỉ lệ với $R$: ra xa gấp đôi, khối lượng bên trong cũng gấp đôi, dù ánh sáng ở đó đã thưa thớt. Toàn bộ sao và khí của Ngân Hà chỉ khoảng $6 \times 10^{10}\ M_\odot$, còn tổng khối lượng tính cả vùng xa khoảng $10^{12}\ M_\odot$: phần lớn là vật chất tối.
          +++

          > [Thử ngay] Kéo «sao thử» (ngôi sao xanh lục có tia) ra xa tâm; ngôi sao hồng là nó nếu đi theo Kepler. Âm thanh: hai nốt kéo dài, cao độ tỉ lệ với tốc độ (2 Hz cho mỗi km/s, quy đổi cho tai nghe được). Nốt của sao thật gần như đứng yên, nốt «theo Kepler» trầm dần khi ra xa.
          > [[Tua nhanh|nhanh]] [[Đặt lại|lai]] [[Nhìn từ trên|quay]]`,
        vao: (c) => c.buoc({ tocDo: 12, mayAnh: 'quay', bong: false, nhanh: false, mau: true, doThi: true, saoThu: 'kepler' }),
        ra: (c) => c.tatGiong(),
        thuThach: {
          de: R`Đặt sao thử ở nơi tốc độ theo Kepler chỉ còn **3/4** tốc độ đo được. Ở đó khối lượng bên trong quỹ đạo của nó phải lớn gấp $(4/3)^2 \approx 1{,}78$ lần khối lượng bên trong quỹ đạo Mặt Trời. Đạt khi tỉ số lệch dưới 0,015.`,
          kiem: (c) => c.daKeo.thu && Math.abs(c.tiKepler() - TT_KEPLER_TI) < TT_KEPLER_SAI,
          goiY: R`$\sqrt{R_0/R} = 3/4$ nên $R = 16R_0/9 \approx 47\,500$ năm ánh sáng. Hai nốt lúc ấy cách nhau một quãng bốn đúng (tần số tỉ lệ 3 : 4).`,
        },
        nut: { nhanh: (c) => c.datTocDo(30), lai: (c) => c.buoc({ tocDo: 12, bong: false, nhanh: false, mau: true, doThi: true, saoThu: 'kepler' }), quay: (c) => c.goc('quay') },
      },
      {
        ten: 'Sagittarius A*: lỗ đen ở tâm',
        noiDung: R`
          Ở chính giữa là {{lỗ đen siêu nặng}} Sagittarius A*, nặng khoảng **4,3 triệu lần Mặt Trời**. Biểu tượng trên hình được phóng to hàng trăm triệu lần; bán kính chân trời sự kiện thật chỉ 12,7 triệu km, bằng chừng 1/5 khoảng cách Sao Thủy – Mặt Trời.

          Người ta cân nó bằng chính định luật Kepler của Bài 1. Sao **S2** quay quanh Sgr A* mỗi vòng **16 năm**, trên một elip rất dẹt; lúc gần nhất chỉ cách 120 AU và lao đi khoảng 7 650 km/s. Với khối lượng tâm $M$ (tính bằng khối lượng Mặt Trời):

          $$ \begin{aligned} T^2 = \frac{a^3}{M} \;\Longrightarrow\; a &= (M T^2)^{1/3} \\ &= (4{,}3 \times 10^{6} \times 16^2)^{1/3} \approx 1\,030\ \text{AU} \end{aligned} $$

          Kích thước quỹ đạo đo được khớp với con số này. Không có vật nào khác nặng chừng ấy mà gọn trong chừng ấy chỗ, ngoài một lỗ đen.

          > [Lịch sử] Năm 2018 nhóm GRAVITY đo được ánh sáng của S2 bị dịch chuyển đỏ hấp dẫn khi qua chỗ gần nhất, đúng như thuyết tương đối rộng dự đoán; năm 2020 đo được quỹ đạo S2 xoay dần (Bài 13). Năm 2022 kính Event Horizon Telescope công bố ảnh bóng của Sgr A* (Bài 15).

          > [Thử ngay] Ở tâm có một «sao thử» chạy trên elip dẹt như S2. Kéo đốm xanh lam (điểm xa nhất của quỹ đạo) ra xa hay lại gần: quỹ đạo to ra thì chu kỳ dài ra theo $T = \sqrt{a^3/M}$. Quỹ đạo vẽ phóng to khoảng 130 000 lần, lỗ đen còn phóng to hơn nữa. Đồng hồ riêng ở đây chạy 2 năm mỗi giây; mỗi lần sao vụt qua điểm gần lỗ đen nhất có một tiếng chuông.
          > [[Bay tới tâm|tam]] [[Toàn cảnh|toan]]`,
        vao: (c) => c.buoc({ tocDo: 0, mayAnh: 'tam', bong: false, s2: true }),
        thuThach: {
          de: R`Kéo quỹ đạo sao thử cho nó đi một vòng mất đúng **16 năm**, như sao S2. Đạt khi chu kỳ lệch dưới nửa năm.`,
          kiem: (c) => c.daKeo.s2 && Math.abs(c.chuKyS2() - TT_S2_T) < TT_S2_SAI,
          goiY: R`Phép tính ở trên cho $a \approx 1\,030$ AU. Nhãn cạnh sao thử ghi sẵn $a$ và $T$.`,
        },
        nut: { tam: (c) => c.goc('tam'), toan: (c) => c.goc('toan') },
      },
      {
        ten: 'Hai cặp bong bóng khổng lồ',
        noiDung: R`
          Nhìn ngang mép đĩa: phía trên và phía dưới tâm phồng lên hai cặp bong bóng.

          - **Bong bóng Fermi** (hồng), tìm ra năm 2010 trong ảnh tia gamma của kính Fermi: mỗi bên cao khoảng **25 000 năm ánh sáng**.
          - **Bong bóng eROSITA** (cam, lớn hơn), tìm ra năm 2020 trong ảnh tia X: mỗi bên cao khoảng **45 000 năm ánh sáng**.

          Mắt thường không thấy chúng. Đó là khí rất nóng và hạt năng lượng cao, nhiều khả năng do những đợt bùng phát ở vùng tâm cách đây vài triệu tới vài chục triệu năm: hoặc lỗ đen nuốt mạnh một lượng khí, hoặc một đợt sinh sao dữ dội. Câu trả lời còn đang tranh luận.

          > [Lưu ý] Hình bong bóng vẽ đối xứng, trơn tru cho dễ nhìn; bong bóng thật có mép gồ ghề và lệch.

          > [Thử ngay] [[Nhìn ngang|bong]] [[Tắt bong bóng|tat]] [[Bật lại|bat]]`,
        vao: (c) => c.buoc({ tocDo: 2, mayAnh: 'bong', bong: true, nhanh: false }),
        nut: { bong: (c) => c.goc('bong'), tat: (c) => c.buoc({ tocDo: 2, bong: false, nhanh: false }), bat: (c) => c.buoc({ tocDo: 2, bong: true, nhanh: false }) },
      },
      {
        ten: 'Hàng xóm: Mây Magellan và Tiên Nữ',
        noiDung: R`
          Lùi thật xa. Ngân Hà có hai thiên hà nhỏ đi kèm nhìn thấy được bằng mắt thường ở bầu trời phương nam: **Mây Magellan Lớn** (160 000 năm ánh sáng) và **Mây Magellan Nhỏ** (200 000 năm ánh sáng).

          Xa hơn nhiều là **thiên hà Tiên Nữ (M31)**, cách **2,5 triệu năm ánh sáng**, lớn cỡ Ngân Hà. Ánh sáng ta thấy từ nó rời đi từ trước khi loài người xuất hiện. Tiên Nữ đang **tiến lại gần** tâm Ngân Hà với tốc độ khoảng 110 km/s.

          Tính thô: 2,5 triệu năm ánh sáng chia cho 110 km/s được khoảng 6,8 tỉ năm. Nhưng hai thiên hà hút nhau nên càng lại gần càng nhanh. Trước đây người ta cho rằng chúng chắc chắn va chạm sau khoảng 4–5 tỉ năm. Tính toán năm 2025 dựa trên số đo của Hubble và Gaia cho thấy điều đó **chưa chắc**: vận tốc ngang của Tiên Nữ còn sai số lớn, và lực hút của M33 và Mây Magellan Lớn làm lệch quỹ đạo. Khả năng hai thiên hà sáp nhập trong 10 tỉ năm tới chỉ khoảng **một nửa**; khả năng va chạm trực diện trong 4–5 tỉ năm tới chỉ khoảng 2%. Nếu có va chạm, sao gần như không đụng nhau, vì khoảng trống giữa chúng quá lớn.

          Ngân Hà, Tiên Nữ, Tam Giác (M33) cùng vài chục thiên hà nhỏ hợp thành {{Nhóm Địa phương}}.

          > [Lưu ý] Đo từ Mặt Trời, Tiên Nữ lại gần khoảng 300 km/s. Phần lớn trong đó là do chính Mặt Trời: nó bay 230 km/s (Bài 1) theo hướng lệch khoảng 37° so với hướng tới Tiên Nữ, nên góp khoảng 185 km/s. Trừ phần ấy đi mới ra khoảng 110 km/s.

          > [Thử ngay] [[Xem hàng xóm|xom]] [[Về Ngân Hà|toan]]`,
        vao: (c) => c.buoc({ tocDo: 4, mayAnh: 'xom', nhanh: false }),
        nut: { xom: (c) => c.goc('xom'), toan: (c) => c.goc('toan') },
      },
    ],
    congThuc: [
      { ten: 'Khối lượng bên trong một quỹ đạo tròn', tex: R`M(\lt R) = \frac{v^2 R}{G}`, y: 'Mặt Trời: $v = 230$ km/s, $R = 8{,}2$ kpc cho $M \\approx 10^{11}\\ M_\\odot$.' },
      { ten: 'Tốc độ quay theo Kepler', tex: R`v = \sqrt{\frac{GM}{r}} \propto \frac{1}{\sqrt r}`, y: 'Đúng khi gần hết khối lượng nằm bên trong quỹ đạo. Ngân Hà không theo quy luật này: dấu hiệu vật chất tối.' },
      { ten: 'Kepler cho một khối lượng tâm bất kỳ', tex: R`T^2 = \frac{a^3}{M} \quad (T\text{: năm},\ a\text{: AU},\ M\text{: khối lượng Mặt Trời})`, y: 'Sao S2: $T = 16$ năm, $a \\approx 1\\,030$ AU cho $M \\approx 4{,}3$ triệu.' },
      { ten: 'Bán kính chân trời sự kiện', tex: R`r_s = \frac{2GM}{c^2} \approx 2{,}95\ \text{km} \times \frac{M}{M_\odot}`, y: 'Sgr A*: khoảng 12,7 triệu km.' },
      { ten: 'Năm thiên hà', tex: R`T = \frac{2\pi R_0}{v} \approx 2{,}2 \times 10^{8}\ \text{năm}`, y: 'Xem Bài 1, bước 8.' },
    ],
    cauHoi: [
      {
        hoi: 'Vì sao nhánh xoắn ốc của Ngân Hà không bị cuốn chặt lại sau hàng tỉ năm?',
        chon: ['Vì mọi sao quay cùng một tốc độ góc như vật rắn', 'Vì nhánh là sóng mật độ: sao đi xuyên qua nhánh, hình mẫu nhánh tồn tại lâu', 'Vì lỗ đen ở tâm giữ nhánh cố định', 'Vì Ngân Hà mới hình thành gần đây'],
        dung: 1,
        giai: 'Sao gần tâm đi một vòng nhanh hơn hẳn sao ở xa, nên một dây sao cố định sẽ bị cuốn chặt. Nhánh là chỗ dồn ứ, giống chỗ kẹt xe: sao đi vào rồi đi ra. Lỗ đen ở tâm quá nhẹ so với cả Ngân Hà (chỉ khoảng một phần hai trăm nghìn) để ảnh hưởng tới nhánh.',
      },
      {
        hoi: 'Một sao cách tâm Ngân Hà xa gấp đôi Mặt Trời, quay với tốc độ đúng bằng Mặt Trời. Khối lượng bên trong quỹ đạo của nó so với khối lượng bên trong quỹ đạo Mặt Trời?',
        chon: ['Bằng nhau', 'Gấp đôi', 'Gấp bốn', 'Bằng một nửa'],
        dung: 1,
        giai: R`$M = v^2R/G$: cùng $v$, $R$ gấp đôi thì $M$ gấp đôi. Nếu khối lượng bằng nhau (không có gì thêm ở vùng xa) thì sao ấy phải chậm hơn, chỉ còn $230/\sqrt 2 \approx 163$ km/s.`,
      },
      {
        hoi: 'Đường cong quay phẳng của Ngân Hà cho ta biết điều gì?',
        chon: ['Ngân Hà đang co lại', 'Có nhiều khối lượng ở vùng xa tâm mà ta không nhìn thấy', 'Tâm Ngân Hà không có lỗ đen', 'Định luật hấp dẫn sai ở mọi khoảng cách'],
        dung: 1,
        giai: 'Sao ở xa vẫn quay nhanh nghĩa là khối lượng bên trong quỹ đạo của chúng vẫn tăng theo bán kính, trong khi sao và khí ở đó đã thưa. Cách giải thích được chấp nhận rộng rãi là vật chất tối. (Có những thuyết sửa định luật hấp dẫn ở gia tốc rất nhỏ, nhưng không phải «sai ở mọi khoảng cách».)',
      },
      {
        hoi: 'Sao S2 quay quanh Sgr A* mỗi vòng 16 năm. Nếu khối lượng lỗ đen lớn gấp 8 lần mà chu kỳ vẫn 16 năm, bán trục lớn của quỹ đạo sẽ',
        chon: ['gấp 8 lần', 'gấp 2 lần', 'gấp 512 lần', 'không đổi'],
        dung: 1,
        giai: R`$a = (MT^2)^{1/3}$: $M$ gấp 8 thì $a$ gấp $8^{1/3} = 2$.`,
      },
      {
        hoi: 'Đo từ Mặt Trời, thiên hà Tiên Nữ lại gần khoảng 300 km/s. Vì sao sách lại nói nó lại gần Ngân Hà khoảng 110 km/s?',
        chon: ['Vì vũ trụ giãn nở', 'Vì phần lớn 300 km/s là do chính Mặt Trời đang bay về phía Tiên Nữ quanh tâm Ngân Hà', 'Vì ánh sáng từ Tiên Nữ bị bẻ cong', 'Vì đo sai'],
        dung: 1,
        giai: 'Đây lại là bài học về hệ quy chiếu của Bài 1: tốc độ phụ thuộc chỗ đứng đo. Trừ chuyển động 230 km/s của Mặt Trời quanh tâm Ngân Hà mới được tốc độ của Tiên Nữ so với Ngân Hà.',
      },
      {
        hoi: 'Vì sao các nhà thiên văn tin chắc ở tâm Ngân Hà có một lỗ đen, dù không nhìn thấy nó trực tiếp bằng kính thường?',
        dap: 'Quỹ đạo của các sao quanh tâm, nhất là S2 (16 năm một vòng, gần nhất chỉ 120 AU), cho phép dùng định luật Kepler để tính khối lượng ở tâm: khoảng 4,3 triệu lần Mặt Trời. Khối lượng ấy nằm gọn trong một vùng nhỏ hơn quỹ đạo S2 lúc gần nhất; không có cụm sao hay vật nào khác nặng thế mà gọn thế, ngoài lỗ đen. Sau đó GRAVITY đo được dịch chuyển đỏ hấp dẫn của S2 (2018), và EHT chụp được bóng của Sgr A* (2022).',
      },
    ],
    docThem: [
      'GRAVITY Collaboration 2018, A&A 615, L15: đo dịch chuyển đỏ hấp dẫn của sao S2 khi đi qua gần Sgr A*.',
      'Event Horizon Telescope 2022, ApJL 930, L12: ảnh bóng của Sagittarius A*.',
      'B. Ryden, *Introduction to Cosmology* (bản 2, 2016): phần vật chất tối, trong đó có đường cong quay của thiên hà.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): lỗ đen siêu nặng ở tâm các thiên hà.',
    ],
    thuatNgu: [
      { vi: 'thiên hà xoắn ốc có thanh', en: 'barred spiral galaxy', nghia: 'Thiên hà dạng đĩa có nhánh xoắn ốc, phần giữa kéo dài thành một thanh sao. Ngân Hà thuộc loại này.' },
      { vi: 'sóng mật độ', en: 'density wave', nghia: 'Vùng dồn ứ sao và khí có hình dạng quay đều với tốc độ góc riêng, khác tốc độ của các sao; sao và khí đi xuyên qua nó. Cách giải thích chính cho nhánh xoắn ốc.' },
      { vi: 'đường cong quay', en: 'rotation curve', nghia: 'Đồ thị tốc độ quay của sao và khí theo khoảng cách tới tâm thiên hà.' },
      { vi: 'vật chất tối', en: 'dark matter', nghia: 'Thành phần khối lượng không phát và không hấp thụ ánh sáng, chỉ lộ ra qua lực hấp dẫn; chiếm phần lớn khối lượng Ngân Hà.' },
      { vi: 'lỗ đen siêu nặng', en: 'supermassive black hole', nghia: 'Lỗ đen nặng từ hàng triệu tới hàng tỉ lần Mặt Trời, nằm ở tâm hầu hết các thiên hà lớn.' },
      { vi: 'Nhóm Địa phương', en: 'Local Group', nghia: 'Nhóm vài chục thiên hà gồm Ngân Hà, Tiên Nữ, Tam Giác và các thiên hà nhỏ đi kèm, rộng khoảng 10 triệu năm ánh sáng.' },
    ],
  },
  conSo: [
    '**100–400 tỉ** ngôi sao; đĩa sao rộng khoảng 100 000 năm ánh sáng, dày khoảng 1 000 năm ánh sáng.',
    '**26 700 năm ánh sáng** (8,2 kpc): khoảng cách từ ta tới tâm Ngân Hà.',
    '**Khoảng 10¹¹ khối lượng Mặt Trời**: khối lượng bên trong quỹ đạo Mặt Trời, tính từ $v^2R/G$.',
    '**Sagittarius A***: lỗ đen 4,3 triệu khối lượng Mặt Trời. Bán kính chân trời sự kiện 12,7 triệu km. Sao S2 quay quanh nó mỗi vòng 16 năm.',
    '**25 000 năm ánh sáng**: chiều cao mỗi bong bóng Fermi. Bong bóng eROSITA cao tới 45 000 năm ánh sáng.',
    '**2,5 triệu năm ánh sáng**: khoảng cách tới thiên hà Tiên Nữ, đang lại gần khoảng 110 km/s.',
  ],
  hieuDung: '**Chưa ai chụp được Ngân Hà từ bên ngoài.** Mọi «ảnh toàn cảnh» Ngân Hà, kể cả mô hình này, đều là hình dựng lại từ các phép đo khoảng cách và vận tốc của sao, khí hydro và sóng vô tuyến. Voyager 1 mới đi được một ngày ánh sáng; muốn ra ngoài chụp ảnh phải đi hàng chục nghìn năm ánh sáng.',
  nguon: 'GRAVITY Collaboration 2018–2022 (khoảng cách R₀, khối lượng Sgr A*, quỹ đạo S2); Event Horizon Telescope 2022; Reid và cộng sự 2019 (nhánh xoắn ốc, tốc độ quay); Bland-Hawthorn và Gerhard 2016, ARA&A 54, 529 (cấu trúc, thanh, khối lượng sao và khí, tổng khối lượng Ngân Hà); Su, Slatyer và Finkbeiner 2010 (bong bóng Fermi); Predehl và cộng sự 2020 (bong bóng eROSITA); van der Marel và cộng sự 2012, ApJ 753, 8 (vận tốc và quỹ đạo của Tiên Nữ); Sawala và cộng sự 2025, Nature Astronomy (khả năng Ngân Hà và Tiên Nữ sáp nhập). Hằng số: CODATA 2018, IAU 2012.',

  tao(app) {
    const scene = new THREE.Scene();
    const camera = app.camera;
    const am = app.am, tt = app.tt;
    const thamThu = app.imLang ? new URLSearchParams(location.search) : new URLSearchParams();
    // Ta đang nhìn Ngân Hà từ bên ngoài nên nền trời không có dải Ngân Hà, chỉ vài sao xa mờ.
    scene.add(taoNenSao({ soSao: 2200, hat: 11, doSang: 0.38, nganHa: false }));
    const nen = taoAnhSangNen();
    scene.add(nen.mesh);
    const { diem, mat } = taoHat();
    scene.add(diem);
    const bui = taoBui();
    scene.add(bui.nhom);
    const qsc = taoQuanSaoCau();
    scene.add(qsc.diem);
    // phình trung tâm nhìn từ mọi phía: quầng ấm quay mặt về máy quay (cho phình có khối khi nhìn ngang mép đĩa)
    const phinh3d = taoDom(new THREE.Color(0xffb070).multiplyScalar(0.55), 15);
    phinh3d.renderOrder = 1;
    scene.add(phinh3d);

    // ----- Lỗ đen trung tâm (hình minh hoạ, phóng to hàng trăm triệu lần; chỉ hiện khi bay lại gần) -----
    const BK_LO_DEN = 0.15;
    const loDen = taoLoDenNho({ banKinh: BK_LO_DEN, dia: true, doSang: 1 });
    loDen.nhom.rotation.set(0.35, 0, 0.18);
    scene.add(loDen.nhom);
    const nhanLoDen = taoNhan(chuCanh("canh.sagittarius-a-lo-den-4-3-trieu-khoi", "Sagittarius A*<small>lỗ đen 4,3 triệu M☉</small>"), 'vang dam');
    scene.add(nhanLoDen);

    // ----- Quỹ đạo «sao thử» quanh Sgr A* (bước 5): kéo để đổi bán trục lớn, chu kỳ theo Kepler -----
    const s2 = { a: 600, gio: 0, keo: false, vong: 0, nhacCuoi: -1 };
    const nhomS2 = new THREE.Group();
    nhomS2.rotation.set(0.55, 0.5, 0.25);
    const vongS2 = new DuongDay(241, { mau: 0x7fcaff, rong: 1.6, doMo: 0.75, sang: 1.2 });
    const saoS2 = taoSao({ mau: 0xbcd4ff, banKinh: 0.03, doSang: 1.6, tia: 0 });
    nhomS2.add(vongS2.line, saoS2.nhom);
    nhomS2.visible = false;
    scene.add(nhomS2);
    const nhanS2 = taoNhan(chuCanh("canh.sao-thu", "Sao thử"), 'dam xanh');   // nền đậm: chữ đọc được trên quầng sáng của sao
    scene.add(nhanS2);
    const viTriS2 = (E, out) => {
      const a = s2.a * S2_DON_VI, b = a * Math.sqrt(1 - E_S2 * E_S2);
      return out.set(a * (Math.cos(E) - E_S2), 0, b * Math.sin(E));
    };
    const tam3 = new THREE.Vector3();
    function veVongS2() {
      for (let i = 0; i <= 240; i++) { viTriS2((i / 240) * 2 * Math.PI, tam3); vongS2.dat(i, tam3.x, tam3.y, tam3.z); }
      vongS2.xong(241);
      nhanS2.datChu(chuCanh("canh.sao-thu-quanh-sgr-a-a-au-t", "Sao thử quanh Sgr A*<small>a = {0} AU · T = {1} năm</small>", [so(s2.a, 0), so(chuKyQuanhSgr(s2.a), 1)]));
    }
    veVongS2();

    // ----- Bong bóng Fermi và eROSITA -----
    const bongFermi = taoBongBong(26, 9.5, new THREE.Color(0xff4a86), 0.55);
    const bongEro = taoBongBong(46, 21, new THREE.Color(0xff8a3c), 0.22);
    const nhanFermi = taoNhan(chuCanh("canh.bong-bong-fermi-tia-gamma-cao-25-000", "Bong bóng Fermi<small>tia gamma · cao 25 000 năm ánh sáng</small>"), 'hong dam');
    nhanFermi.position.set(7.6, 17, 0);
    const nhanEro = taoNhan(chuCanh("canh.bong-bong-erosita-tia-x-cao-45-000", "Bong bóng eROSITA<small>tia X · cao 45 000 năm ánh sáng</small>"), 'mo');
    nhanEro.position.set(17, 34, 0);
    scene.add(bongEro.mesh, bongFermi.mesh, nhanFermi, nhanEro);

    // ----- Lưới khoảng cách -----
    const luoi = new THREE.Group();
    const dsNhanLuoi = [];
    for (let r = 10; r <= 60; r += 10) {
      luoi.add(duongTron(r, { n: 180, mau: 0x9fb6ff, doMo: r % 20 === 0 ? 0.13 : 0.07 }));
      const n = taoNhan(chuCanh("canh.nam-anh-sang", "{0} năm ánh sáng", [so(r * 1000, 0)]), 'mo tran');
      n.position.set(r * Math.cos(2.25), 0, r * Math.sin(2.25));
      luoi.add(n);
      dsNhanLuoi.push(n);
    }
    scene.add(luoi);

    // ----- Tên các nhánh (quay theo hình mẫu nhánh); mỗi tên có một điểm rê chuột -----
    const nhomNhanh = new THREE.Group();
    const dsNhanNhanh = [];
    const dsDiemNhanh = [];
    const datNhanNhanh = (chu, d, R, moTa, lop = '') => {
      const th = Math.PI + d + Math.log(R / R_REF) / TAN_P;   // góc mà nhánh này đi qua bán kính R
      const n = taoNhan(chu, lop);
      n.position.set(R * Math.cos(th), 0.4, -R * Math.sin(th));
      const diemRe = new THREE.Object3D();
      diemRe.position.copy(n.position);
      nhomNhanh.add(n, diemRe);
      dsNhanNhanh.push(n);
      dsDiemNhanh.push([diemRe, chu.replace(/<small>.*$/, ''), moTa]);
    };
    datNhanNhanh(chuCanh("canh.nhanh-perseus-anh-tien", "Nhánh Perseus (Anh Tiên)"), -Math.PI / 2, 38, chuCanh("canh.mot-trong-hai-nhanh-lon-nam-phia-ngoai", "Một trong hai nhánh lớn, nằm phía ngoài Mặt Trời. Sao trẻ xanh và vùng khí hồng rải dọc nhánh."));
    datNhanNhanh(chuCanh("canh.nhanh-sagittarius-nhan-ma", "Nhánh Sagittarius (Nhân Mã)"), 0, 30, chuCanh("canh.nhanh-nam-phia-trong-mat-troi-giua-mat", "Nhánh nằm phía trong Mặt Trời, giữa Mặt Trời và tâm."));
    datNhanNhanh(chuCanh("canh.nhanh-scutum-centaurus", "Nhánh Scutum–Centaurus"), Math.PI / 2, 36, chuCanh("canh.nhanh-lon-thu-hai-bat-dau-gan-mot", "Nhánh lớn thứ hai, bắt đầu gần một đầu của thanh."));
    datNhanNhanh(chuCanh("canh.nhanh-norma-nhanh-ngoai", "Nhánh Norma – Nhánh Ngoài"), Math.PI, 44, chuCanh("canh.nhanh-nho-hon-bat-dau-gan-dau-kia", "Nhánh nhỏ hơn, bắt đầu gần đầu kia của thanh rồi vòng ra ngoài."));
    {
      const n = taoNhan(chuCanh("canh.nhanh-orion-noi-mat-troi-dang-o", "Nhánh Orion<small>nơi Mặt Trời đang ở</small>"), 'xanh');
      const th = Math.PI + 0.42;
      const R = 27.7 * Math.exp(0.42 * Math.tan((11 * Math.PI) / 180));
      n.position.set(R * Math.cos(th), 0.4, -R * Math.sin(th));
      const diemRe = new THREE.Object3D();
      diemRe.position.copy(n.position);
      nhomNhanh.add(n, diemRe);
      dsNhanNhanh.push(n);
      dsDiemNhanh.push([diemRe, chuCanh("canh.nhanh-orion", "Nhánh Orion"), chuCanh("canh.nhanh-phu-ngan-giua-hai-nhanh-lon-sagittarius", "Nhánh phụ ngắn giữa hai nhánh lớn Sagittarius và Perseus. Mặt Trời nằm ở đây.")]);
    }
    scene.add(nhomNhanh);

    // ----- Mặt Trời -----
    const mtSao = taoSao({ mau: 0xffd070, banKinh: 0.3, doSang: 1.5, tia: 4, doDaiTia: 18 });
    const nhanMT = taoNhan(chuCanh("canh.mat-troi-ban-dang-o-day", "Mặt Trời<small>bạn đang ở đây</small>"), 'vang dam');
    const quyDaoMT = duongTron(R0, { n: 256, mau: 0xffd070, doMo: 0.26, net: true });
    const vetMT = new DuongDay(240, { mau: 0xffd070, rong: 1.8, moDan: true, sang: 1.2 });
    const muiMT = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 1, new THREE.Color(0xffd070).multiplyScalar(1.4), 0.3, 0.15);
    scene.add(mtSao.nhom, nhanMT, quyDaoMT, vetMT.line, muiMT);

    // ----- Hàng xóm -----
    const hangXom = [
      [taoNhan(chuCanh("canh.may-magellan-lon-160-000-nam-anh-sang", "Mây Magellan Lớn<small>160 000 năm ánh sáng</small>"), ''), [-1.8, -88.5, 134.6], 130, 20, chuCanh("canh.thien-ha-nho-di-kem-ngan-ha-thay", "Thiên hà nhỏ đi kèm Ngân Hà, thấy được bằng mắt thường ở bầu trời phương nam.")],
      [taoNhan(chuCanh("canh.may-magellan-nho-200-000-nam-anh-sang", "Mây Magellan Nhỏ<small>200 000 năm ánh sáng</small>"), ''), [50.8, -139.7, 120.3], 130, 12, chuCanh("canh.thien-ha-nho-di-kem-thu-hai-cung", "Thiên hà nhỏ đi kèm thứ hai, cũng thấy được ở bầu trời phương nam.")],
      [taoNhan(chuCanh("canh.thien-ha-tien-nu-m31-2-5-trieu", "Thiên hà Tiên Nữ (M31)<small>2,5 triệu năm ánh sáng</small>"), 'dam'), [-1250, -935, -2020], 600, 120, chuCanh("canh.thien-ha-xoan-oc-lon-co-ngan-ha", "Thiên hà xoắn ốc lớn cỡ Ngân Hà, khoảng 1 000 tỉ sao, đang lại gần tâm Ngân Hà khoảng 110 km/s.")],
      [taoNhan(chuCanh("canh.thien-ha-tam-giac-m33-2-7-trieu", "Thiên hà Tam Giác (M33)<small>2,7 triệu năm ánh sáng</small>"), ''), [-1636, -1418, -1689], 600, 40, chuCanh("canh.thien-ha-xoan-oc-nho-trong-nhom-dia", "Thiên hà xoắn ốc nhỏ trong Nhóm Địa phương.")],
    ];
    for (const [n, p, , lech] of hangXom) { n.position.set(p[0] + lech, p[1], p[2]); scene.add(n); }
    // Tiên Nữ (M31) và Tam Giác (M33): thiên hà xoắn có nhánh (hình minh hoạ), mặt đĩa nghiêng theo pháp tuyến cũ.
    const thienHaXom = [
      [taoThienHaNho({ banKinh: 105, soSao: 9000, soNhanh: 2, hat: 31, doSang: 1, tocDoQuay: 0.004 }), [-1250, -935, -2020], [0.62, 0.3, -0.72], 4.2],
      [taoThienHaNho({ banKinh: 36, soSao: 3500, soNhanh: 2, hat: 33, doSang: 1, tocDoQuay: 0.006 }), [-1636, -1418, -1689], [0.2, 0.8, 0.5], 3.4],
    ];
    for (const [g, p, n] of thienHaXom) {
      g.nhom.position.set(...p);
      g.nhom.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...n).normalize());
      scene.add(g.nhom);
    }
    const nhanNH = taoNhan(chuCanh("canh.ngan-ha-thien-ha-cua-chung-ta", "Ngân Hà<small>thiên hà của chúng ta</small>"), 'vang dam');
    nhanNH.position.set(60, 0, 0);
    scene.add(nhanNH);

    // ----- Trạng thái và điều khiển -----
    let t = 0;               // triệu năm kể từ bây giờ
    let tocDo = 4;           // triệu năm mỗi giây
    const hien = { bong: true, luoi: true, nhanh: true };
    const bang = app.bang;
    const viTriMT = new THREE.Vector3();
    const tinhMT = (tt0, out) => {
      const th = Math.PI - OM_MT * tt0;
      return out.set(R0 * Math.cos(th), yMatTroi(tt0), -R0 * Math.sin(th));
    };

    // ----- Sao mẫu cho đường cong quay: sao thật (đường cong phẳng) và sao «theo Kepler» -----
    // Ba sao xuất phát cùng một hướng với Mặt Trời, ở 26 700, 38 000 và 50 000 năm ánh sáng.
    const R_MAU = [R0, 38, 50];
    const nhomMau = new THREE.Group();
    const dsMau = R_MAU.map((Rm, i) => {
      const that = taoDom(new THREE.Color(0x8fe3a8).multiplyScalar(1.6), 1), kep = taoDom(new THREE.Color(0xff7aa8).multiplyScalar(1.6), 1);
      const vK = 230 * Math.sqrt(R0 / Rm);
      const nThat = taoNhan(chuCanh("canh.230-km-s-so-do-gan-nhu-khong", "{0}230 km/s<small>số đo: gần như không đổi</small>", [i === 0 ? chuCanh("canh.mat-troi", "Mặt Trời · ") : '']), 'tran');
      nThat.element.style.color = '#8fe3a8';
      const nKep = taoNhan(chuCanh("canh.km-s-neu-theo-kepler", "{0} km/s<small>nếu theo Kepler</small>", [so(vK, 0)]), 'hong tran');
      nhomMau.add(that, kep, nThat, nKep);
      return { R: Rm, that, kep, nThat, nKep, omThat: omegaSao(Rm), omKep: (V0 * Math.sqrt(R0 / Rm)) / Rm, viThat: new THREE.Vector3(), viKep: new THREE.Vector3() };
    });
    const tiaThat = new DuongDay(3, { mau: 0x8fe3a8, rong: 2, quang: 0.12 });
    const tiaKep = new DuongDay(3, { mau: 0xff7aa8, rong: 2, quang: 0.12, net: [1.2, 0.8] });
    nhomMau.add(tiaThat.line, tiaKep.line);
    nhomMau.visible = false;
    scene.add(nhomMau);
    let tMau = 0;

    // ----- Sao thử kéo được (bước 2: vòng đồng quay; bước 4: so với Kepler) -----
    const thu = { R: 13, phi: Math.PI * 0.62, phiKep: Math.PI * 0.62, keo: false, cheDo: null, pha: 0, nhacCuoi: -1, gio: 0 };
    const saoThu = taoSao({ mau: 0x8fe3a8, banKinh: 0.32, doSang: 1.8, tia: 4, doDaiTia: 18 });
    const saoKep = taoSao({ mau: 0xff7aa8, banKinh: 0.26, doSang: 1.5, tia: 4, doDaiTia: 14 });
    const vongThu = new DuongDay(181, { mau: 0x8fe3a8, rong: 1.3, doMo: 0.5, net: [1.4, 1.0] });
    const nhanThu = taoNhan(chuCanh("canh.sao-thu", "Sao thử"), 'tran');
    nhanThu.element.style.color = '#8fe3a8';
    const nhanKepThu = taoNhan('', 'hong tran');
    const nhomThu = new THREE.Group();
    nhomThu.add(saoThu.nhom, saoKep.nhom, vongThu.line, nhanThu, nhanKepThu);
    nhomThu.visible = false;
    scene.add(nhomThu);
    function veVongThu() {
      for (let i = 0; i <= 180; i++) { const g = (i / 180) * 2 * Math.PI; vongThu.dat(i, thu.R * Math.cos(g), 0, thu.R * Math.sin(g)); }
      vongThu.xong(181);
    }
    const daKeo = { thu: false, s2: false };
    const gioiHanR = () => (thu.cheDo === 'kepler' ? [R0, 62] : [6, 58]);
    const tayThu = tt.tayNam({
      viTri: [thu.R, 0, 0], mau: 0x8fe3a8, co: 0.5,
      ten: chuCanh("canh.sao-thu", "Sao thử"), moTa: () => moTaSaoThu(),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 1, 0], qua: [0, 0, 0] },
      gioiHan: (q) => { q.setY(0); const [a, b] = gioiHanR(); const r = q.length(); return r < 1e-6 ? q.set(a, 0, 0) : q.setLength(Math.min(b, Math.max(a, r))); },
      nhan: chuCanh("canh.keo-sao-thu-ra-xa-vao-gan", "Kéo sao thử ra xa, vào gần"),
      khiNam: () => { thu.keo = true; batGiong(); },
      khiKeo: (q) => { thu.R = q.length(); thu.phi = thu.phiKep = Math.atan2(-q.z, q.x); thu.pha = phaThu(); veVongThu(); daKeo.thu = true; },
      khiTha: () => { thu.keo = false; },
    });
    const tayS2 = tt.tayNam({
      viTri: [0, 0, 0], mau: 0x7fcaff, co: 0.06,
      ten: chuCanh("canh.diem-xa-nhat-cua-quy-dao", "Điểm xa nhất của quỹ đạo"), moTa: () => chuCanh("canh.keo-ra-xa-hay-lai-gan-lo-den", "Kéo ra xa hay lại gần lỗ đen.<br>a = <span class=\"so\">{0} AU</span> · T = √(a³/M) = <span class=\"so\">{1} năm</span><br>Quỹ đạo vẽ phóng to khoảng 130 000 lần.", [so(s2.a, 0), so(chuKyQuanhSgr(s2.a), 1)]),
      rangBuoc: { kieu: 'ham', chieu: (tia, hienTai) => chieuTayS2(tia, hienTai) },
      nhan: chuCanh("canh.keo-de-doi-co-quy-dao", "Kéo để đổi cỡ quỹ đạo"),
      khiNam: () => { s2.keo = true; },
      khiKeo: (q) => { datS2TuDiem(q); daKeo.s2 = true; },
      khiTha: () => { s2.keo = false; },
    });
    // tay nắm S2 trượt dọc trục lớn của quỹ đạo (từ lỗ đen ra phía điểm xa nhất)
    const trucS2 = new THREE.Vector3();
    const _mp = new THREE.Plane(), _q = new THREE.Vector3();
    function chieuTayS2(tia, hienTai) {
      nhomS2.updateMatrixWorld();
      trucS2.set(-1, 0, 0).transformDirection(nhomS2.matrixWorld);
      // mặt phẳng chứa trục lớn và quay mặt nhiều nhất về phía máy quay
      const n = new THREE.Vector3().crossVectors(trucS2, tia.direction).cross(trucS2).normalize();
      if (n.lengthSq() < 1e-8) return null;
      _mp.setFromNormalAndCoplanarPoint(n, nhomS2.position);
      if (!tia.intersectPlane(_mp, _q)) return null;
      const s = Math.min(3000, Math.max(250, _q.dot(trucS2) / ((1 + E_S2) * S2_DON_VI))) * (1 + E_S2) * S2_DON_VI;
      return (hienTai || new THREE.Vector3()).copy(trucS2).multiplyScalar(s);
    }
    function datS2TuDiem(q) {
      s2.a = Math.min(3000, Math.max(250, q.length() / ((1 + E_S2) * S2_DON_VI)));
      veVongS2();
    }
    // điểm rê chuột cho các cấu trúc
    const diemTam = new THREE.Object3D(), diemThanh = new THREE.Object3D(), diemFermi = new THREE.Object3D(), diemEro = new THREE.Object3D();
    diemFermi.position.set(0, 15, 0); diemEro.position.set(0, -34, 0);
    const diemCau = new THREE.Object3D();
    { // một cụm sao cầu ở quầng, khá xa đĩa cho dễ rê
      let k = 0, tot = -1;
      for (let i = 0; i < 150; i++) { const y = Math.abs(qsc.viTri[i * 3 + 1]), r = Math.hypot(qsc.viTri[i * 3], qsc.viTri[i * 3 + 2]); const d = y - Math.abs(r - 30) * 0.3; if (y > 8 && d > tot) { tot = d; k = i; } }
      diemCau.position.set(qsc.viTri[k * 3], qsc.viTri[k * 3 + 1], qsc.viTri[k * 3 + 2]);
    }
    scene.add(diemTam, diemThanh, diemFermi, diemEro, diemCau);
    const dsRe = [];
    const re = (vat, tc) => { const r = tt.them(vat, { banKinhPx: 22, ...tc }); dsRe.push([r, tc]); return r; };
    const reTam = re(diemTam, { ten: chuCanh("canh.sagittarius-a", "Sagittarius A*"), mau: 0xffc46b, banKinhPx: 16, moTa: chuCanh("canh.lo-den-sieu-nang-o-tam-ngan-ha", "Lỗ đen siêu nặng ở tâm Ngân Hà, khoảng <span class=\"so\">4,3 triệu</span> khối lượng Mặt Trời.<br>Bán kính chân trời sự kiện <span class=\"so\">12,7 triệu km</span>.<br><i>Bấm để bay tới tâm</i>"), khiBam: () => { am.phat('bam'); goc('tam'); } });
    re(diemThanh, { ten: chuCanh("canh.phinh-trung-tam-va-thanh", "Phình trung tâm và thanh"), mau: 0xffb070, banKinhPx: 34, moTa: chuCanh("canh.sao-gia-mau-vang-cam-thanh-dai-khoang", "Sao già màu vàng cam. Thanh dài khoảng <span class=\"so\">30 000 năm ánh sáng</span>; trong mô hình nó quay như một vật cứng, 40 km/s mỗi kiloparsec.") });
    re(mtSao.nhom, { ten: chuCanh("canh.mat-troi-b70a9e", "Mặt Trời"), mau: 0xffd070, banKinhPx: 16, moTa: chuCanh("canh.cach-tam-26-700-nam-anh-sang-bay", "Cách tâm <span class=\"so\">26 700 năm ánh sáng</span>, bay <span class=\"so\">230 km/s</span>.<br>Một vòng quanh tâm khoảng 220 triệu năm.<br><i>Bấm để bay tới</i>"), khiBam: () => { am.phat('bam'); goc('mt'); } });
    const reFermi = re(diemFermi, { ten: chuCanh("canh.bong-bong-fermi", "Bong bóng Fermi"), mau: 0xff4a86, banKinhPx: 60, moTa: chuCanh("canh.khi-rat-nong-va-hat-nang-luong-cao", "Khí rất nóng và hạt năng lượng cao, phát tia gamma; tìm ra năm 2010.<br>Mỗi bên cao khoảng <span class=\"so\">25 000 năm ánh sáng</span>.") });
    const reEro = re(diemEro, { ten: chuCanh("canh.bong-bong-erosita", "Bong bóng eROSITA"), mau: 0xff8a3c, banKinhPx: 60, moTa: chuCanh("canh.lon-hon-bong-bong-fermi-phat-tia-x", "Lớn hơn bong bóng Fermi, phát tia X; tìm ra năm 2020.<br>Mỗi bên cao khoảng <span class=\"so\">45 000 năm ánh sáng</span>.") });
    re(diemCau, { ten: chuCanh("canh.cum-sao-cau", "Cụm sao cầu"), mau: 0xffd29a, banKinhPx: 14, moTa: chuCanh("canh.qua-cau-day-dac-hang-chuc-nghin-toi", "Quả cầu dày đặc hàng chục nghìn tới hàng triệu sao già, nằm trong quầng.<br>Ngân Hà có khoảng 150 cụm (vị trí trong hình là minh hoạ).") });
    for (const [vat, ten, moTa] of dsDiemNhanh) re(vat, { ten, mau: 0x9fc4ff, banKinhPx: 28, moTa });
    for (const [n, , , , moTa] of hangXom) re(n, { ten: n.element.firstChild.textContent, mau: 0xdfe8ff, banKinhPx: 34, moTa });

    const dkTocDo = bang.thanhTruot({
      nhan: chuCanh("canh.moi-giay-troi-qua", "Mỗi giây trôi qua"), min: 0, max: 40, buoc: 0.5, giaTri: tocDo,
      hienThi: (v) => (v === 0 ? chuCanh("canh.dung-yen", "đứng yên") : chuCanh("canh.trieu-nam", "{0} triệu năm", [so(v, 1)])),
      khiDoi: (v) => { tocDo = v; },
    });
    const GOC = {
      toan: () => [[-14, 82, 112], [0, 0, 0]],
      tren: () => [[0, 150, 0.5], [0, 0, 0]],
      ngang: () => [[-20, 5, 150], [0, 0, 0]],
      bong: () => [[-6, 18, 118], [0, 12, 0]],
      mt: () => { tinhMT(t, viTriMT); return [[viTriMT.x - 9, 7, viTriMT.z + 13], viTriMT.toArray()]; },
      tam: () => [[1.62, 1.28, 3.32], [-0.18, 0, 0]],
      // đứng sau lưng Ngân Hà, chếch khỏi đường Ngân Hà – Tiên Nữ: Ngân Hà ở gần nên hai Mây Magellan tách nhau rõ, Tiên Nữ
      // và Tam Giác ở xa phía dưới bên trái, cả năm thiên hà nằm trong phần trống bên trái bảng bài giảng.
      // Cửa sổ hẹp (điện thoại cầm dọc) thì lùi xa thêm tới 1,9 lần để cả cụm vừa khung.
      xom: () => {
        const k = 1 + 0.9 * THREE.MathUtils.clamp((700 - app.rong) / 300, 0, 1);
        return [[-375 + 865 * k, -340 + 144 * k, -606 + 2105 * k], [-375, -340, -606]];
      },
      quay: () => [[-10, 120, 40], [-6, 0, 0]],
    };
    const goc = (ten, giay) => app.bayToi(...GOC[ten](), giay ?? (ten === 'xom' ? 3.2 : 1.8));
    bang.chon({
      nhan: chuCanh("canh.bay-toi", "Bay tới"),
      luaChon: [
        { giaTri: 'toan', nhan: chuCanh("canh.toan-canh", "Toàn cảnh") }, { giaTri: 'tren', nhan: chuCanh("canh.nhin-tu-tren", "Nhìn từ trên") }, { giaTri: 'ngang', nhan: chuCanh("canh.nhin-ngang", "Nhìn ngang") },
        { giaTri: 'mt', nhan: chuCanh("canh.cho-mat-troi", "Chỗ Mặt Trời") }, { giaTri: 'tam', nhan: chuCanh("canh.tam-ngan-ha", "Tâm Ngân Hà") }, { giaTri: 'xom', nhan: chuCanh("canh.hang-xom", "Hàng xóm") },
      ],
      giaTri: null,
      khiDoi: (v) => goc(v),
    });
    const dkBong = bang.congTac({ nhan: chuCanh("canh.bong-bong-fermi-va-erosita", "Bong bóng Fermi và eROSITA"), giaTri: true, khiDoi: (v) => { hien.bong = v; } });
    const dkNhanh = bang.congTac({ nhan: chuCanh("canh.ten-cac-nhanh-xoan-oc", "Tên các nhánh xoắn ốc"), giaTri: true, khiDoi: (v) => { hien.nhanh = v; } });
    const dkLuoi = bang.congTac({ nhan: chuCanh("canh.vong-do-khoang-cach", "Vòng đo khoảng cách"), giaTri: true, khiDoi: (v) => { hien.luoi = v; luoi.visible = v; } });
    const dkMau = bang.congTac({ nhan: chuCanh("canh.sao-mau-do-duoc-va-theo-kepler", "Sao mẫu: đo được và theo Kepler"), giaTri: false, khiDoi: (v) => { nhomMau.visible = v; tMau = 0; } });
    bang.nut([{ nhan: chuCanh("canh.ve-hien-tai", "Về hiện tại"), khiBam: () => { t = 0; tMau = 0; } }]);

    // Đồ thị đường cong quay: tốc độ quay theo khoảng cách tới tâm
    const doThi = bang.doThi(180);
    {
      const g = doThi.ctx;
      const { X, Y: YY } = khungDoThi(g, {
        rong: doThi.rong, cao: doThi.cao, x0: 0, x1: 60, y0: 0, y1: 300,
        nhanX: chuCanh("canh.nghin-nam-anh-sang-toi-tam", "nghìn năm ánh sáng tới tâm"), nhanY: chuCanh("canh.toc-do-quay-km-s", "tốc độ quay (km/s)"),
        vachX: [10, 20, 30, 40, 50], vachY: [100, 200, 300], le: [34, 10, 10, 24],
      });
      g.lineWidth = 2.2; g.strokeStyle = MAU.luc; g.beginPath();
      for (let Rr = 0.2; Rr <= 60; Rr += 0.4) { const y = YY(230 * Math.tanh(Rr / 3)); if (Rr < 0.3) g.moveTo(X(Rr), y); else g.lineTo(X(Rr), y); }
      g.stroke();
      g.setLineDash([5, 4]); g.strokeStyle = MAU.hong; g.beginPath();
      for (let Rr = R0; Rr <= 60; Rr += 0.4) { const y = YY(230 * Math.sqrt(R0 / Rr)); if (Rr === R0) g.moveTo(X(Rr), y); else g.lineTo(X(Rr), y); }
      g.stroke(); g.setLineDash([]);
      g.fillStyle = MAU.vang; g.beginPath(); g.arc(X(R0), YY(230), 4, 0, 2 * Math.PI); g.fill();
      g.font = '10px -apple-system, "Helvetica Neue", sans-serif'; g.textBaseline = 'bottom'; g.textAlign = 'left';
      g.fillStyle = MAU.vang; g.fillText(chuCanh("canh.mat-troi-b70a9e", "Mặt Trời"), X(R0) - 18, YY(230) - 6);
      g.fillStyle = MAU.luc; g.fillText(chuCanh("canh.mo-hinh-gan-voi-so-do-gan-nhu", "mô hình, gần với số đo: gần như phẳng"), X(4), YY(262));
      g.fillStyle = MAU.hong; g.textAlign = 'right'; g.fillText(chuCanh("canh.kepler-neu-moi-khoi-luong-o-trong-quy", "Kepler, nếu mọi khối lượng ở trong quỹ đạo Mặt Trời"), X(59), YY(120));
    }
    doThi.el.hidden = true;

    // ----- Âm thanh của sao thử ở bước 4: hai nốt kéo dài, cao độ theo tốc độ (đo được và theo Kepler) -----
    let giongThat = null, giongKep = null;
    function batGiong() {
      if (thu.cheDo !== 'kepler' || giongThat) return;
      giongThat = am.giong({ dang: 'mem', tanSo: HZ_MOI_KM_S * vDoDuoc(thu.R), doTo: 0 });
      giongKep = am.giong({ dang: 'mem', tanSo: HZ_MOI_KM_S * vKepler(thu.R), doTo: 0 });
    }
    function tatGiong() {
      giongThat?.tat?.(0.4); giongKep?.tat?.(0.4);
      giongThat = giongKep = null;
    }
    // pha của sao thử so với nhánh gần nhất (đổi số nguyên mỗi khi băng qua một nhánh)
    function phaThu() {
      const d = thu.phi - (Math.PI + Math.log(thu.R / R_REF) / TAN_P - OM_NHANH * t);
      return Math.floor(d / (Math.PI / 2) + 0.5);
    }
    function moTaSaoThu() {
      if (thu.cheDo === 'kepler') {
        return chuCanh("canh.cach-tam-nam-anh-sang-do-duoc-km", "Cách tâm <span class=\"so\">{0} năm ánh sáng</span><br>Đo được: <span class=\"so\">{1} km/s</span> · theo Kepler: <span class=\"so\">{2} km/s</span><br>Tỉ số Kepler / đo được: <span class=\"so\">{3}</span>", [so(thu.R * 1000, 0), so(vDoDuoc(thu.R), 0), so(vKepler(thu.R), 0), so(vKepler(thu.R) / vDoDuoc(thu.R), 3)]);
      }
      return chuCanh("canh.cach-tam-nam-anh-sang-mot-vong-trieu", "Cách tâm <span class=\"so\">{0} năm ánh sáng</span><br>Một vòng: <span class=\"so\">{1} triệu năm</span> · hình mẫu nhánh: <span class=\"so\">{2} triệu năm</span>", [so(thu.R * 1000, 0), so((2 * Math.PI) / omegaSao(thu.R), 0), so((2 * Math.PI) / OM_NHANH, 0)]);
    }

    // Đặt toàn bộ trạng thái cho một bước của bài giảng
    function buoc(o = {}) {
      const k = { tocDo: 4, bong: true, nhanh: true, luoi: true, mau: false, doThi: false, saoThu: null, s2: false, ...o };
      tocDo = k.tocDo; dkTocDo.dat(tocDo);
      if (k.ve0) t = 0;
      // Khi vừa rời S2, máy quay còn nằm sâu trong vùng tâm. Chờ nó lùi
      // tới tầm thấy được hai thùy rồi mới đưa lớp khí vào hình.
      doiGocBong = k.mayAnh === 'bong' && !hien.bong && camera.position.length() < 50;
      hien.bong = k.bong; dkBong.dat(k.bong);
      hien.nhanh = k.nhanh; dkNhanh.dat(k.nhanh);
      hien.luoi = k.luoi; luoi.visible = k.luoi; dkLuoi.dat(k.luoi);
      nhomMau.visible = k.mau; dkMau.dat(k.mau); tMau = 0;
      doThi.el.hidden = !k.doThi;
      // sao thử
      tatGiong();
      thu.cheDo = k.saoThu;
      daKeo.thu = daKeo.s2 = false;
      if (k.saoThu) {
        thu.R = k.saoThu === 'kepler' ? 32 : 13;
        thu.phi = thu.phiKep = k.saoThu === 'kepler' ? Math.PI * 0.78 : Math.PI * 0.62;
        thu.pha = phaThu(); veVongThu();
      }
      nhomThu.visible = !!k.saoThu;
      tayThu.an(!k.saoThu);
      // quỹ đạo sao thử quanh Sgr A*
      s2.hien = k.s2;
      if (k.s2) { s2.a = 600; s2.gio = 0; s2.vong = 0; veVongS2(); }
      tayS2.an(!k.s2);
      gocBuoc = k.mayAnh || null;
      if (k.mayAnh) goc(k.mayAnh);
    }

    const dsNhan = [];
    const huong = new THREE.Vector3(), q3 = new THREE.Vector3(), vW = new THREE.Vector3();
    let doMoBong = 1, doMoLoDen = 0, doiGocBong = false, gocBuoc = null;
    let gioThuc = 0;
    function capNhat(dt, dtThuc) {
      gioThuc += dtThuc;
      t += dt * tocDo;
      mat.uniforms.uT.value = t;
      const pxCao = (app.cao * app.renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
      mat.uniforms.uPx.value = pxCao;
      // bán kính Ngân Hà trên màn hình (điểm ảnh thật): dưới khoảng 900 thì bớt dần số hạt vẽ (xem shader hạt)
      const rNH = (60 * pxCao) / Math.max(1, camera.position.length());
      mat.uniforms.uGiu.value = THREE.MathUtils.clamp((rNH / 900) ** 2, 0.03, 1);
      qsc.mat.uniforms.uPx.value = pxCao;
      nen.mat.uniforms.uT.value = t;
      bui.uT.value = t;
      nhomNhanh.rotation.y = -OM_NHANH * t;
      bongFermi.mat.uniforms.uT.value += dtThuc;
      bongEro.mat.uniforms.uT.value += dtThuc;

      const dCam = camera.position.distanceTo(app.dk.target);
      const dGoc = camera.position.length();
      const upp = (d) => donViMoiDiemAnh(camera, d, app.cao);

      // Mặt Trời: ngôi sao cỡ cố định trên màn hình
      tinhMT(t, viTriMT);
      const dMT = camera.position.distanceTo(viTriMT);
      const u = upp(dMT);
      mtSao.nhom.position.copy(viTriMT);
      mtSao.datBanKinh(Math.max(0.12, 5 * u));
      mtSao.capNhat(dtThuc);
      nhanMT.position.copy(viTriMT);
      const th = Math.PI - OM_MT * t;
      huong.set(Math.sin(th), 0, Math.cos(th));           // tiếp tuyến theo chiều quay (θ giảm)
      muiMT.position.copy(viTriMT);
      muiMT.setDirection(huong);
      const dai = Math.max(3, 56 * u);
      muiMT.setLength(dai, dai * 0.22, dai * 0.1);
      const nV = 240;
      for (let i = 0; i < nV; i++) { tinhMT(t - (i / (nV - 1)) * 200, q3); vetMT.dat(i, q3.x, q3.y, q3.z); }
      vetMT.xong(nV, 1.2);

      // sao mẫu: sao thật đi vòng với tốc độ gần như không đổi; sao «theo Kepler» chậm dần ra ngoài
      if (nhomMau.visible) {
        tMau += dt * tocDo;
        dsMau.forEach((m, i) => {
          const a1 = Math.PI - m.omThat * tMau, a2 = Math.PI - m.omKep * tMau;
          m.viThat.set(m.R * Math.cos(a1), 0.3, -m.R * Math.sin(a1));
          m.viKep.set(m.R * Math.cos(a2), 0.3, -m.R * Math.sin(a2));
          const uu = upp(camera.position.distanceTo(m.viThat));
          m.that.position.copy(m.viThat); m.that.scale.setScalar(24 * uu);
          m.kep.position.copy(m.viKep); m.kep.scale.setScalar(20 * uu);
          m.nThat.position.copy(m.viThat); m.nKep.position.copy(m.viKep);
          m.kep.visible = i > 0;
          tiaThat.dat(i, m.viThat.x, 0.3, m.viThat.z); tiaKep.dat(i, i === 0 ? m.viThat.x : m.viKep.x, 0.3, i === 0 ? m.viThat.z : m.viKep.z);
        });
        tiaThat.xong(3); tiaKep.xong(3);
      }

      // sao thử
      if (thu.cheDo) {
        if (!thu.keo) {
          thu.phi -= omegaSao(thu.R) * dt * tocDo;
          thu.phiKep -= ((V0 * Math.sqrt(R0 / thu.R)) / thu.R) * dt * tocDo;
          q3.set(thu.R * Math.cos(thu.phi), 0, -thu.R * Math.sin(thu.phi));
          tayThu.dat(q3);
        }
        const pT = tayThu.viTri;
        saoThu.nhom.position.copy(pT);
        const uT = upp(camera.position.distanceTo(pT));
        saoThu.datBanKinh(Math.max(0.1, 5 * uT));
        saoThu.capNhat(dtThuc);
        nhanThu.position.copy(pT);
        const kep = thu.cheDo === 'kepler';
        saoKep.nhom.visible = nhanKepThu.visible = kep;
        if (kep) {
          q3.set(thu.R * Math.cos(thu.phiKep), 0, -thu.R * Math.sin(thu.phiKep));
          saoKep.nhom.position.copy(q3);
          saoKep.datBanKinh(Math.max(0.08, 4 * uT));
          nhanKepThu.position.copy(q3);
          nhanThu.datChu(chuCanh("canh.sao-thu-km-s-do-duoc-o-nam", "Sao thử · {0} km/s<small>đo được ở {1} năm ánh sáng</small>", [so(vDoDuoc(thu.R), 0), so(thu.R * 1000, 0)]));
          nhanKepThu.datChu(chuCanh("canh.km-s-neu-theo-kepler", "{0} km/s<small>nếu theo Kepler</small>", [so(vKepler(thu.R), 0)]));
          if (giongThat) {
            const im = dt === 0 ? 0 : 1;
            vW.copy(pT).project(camera);
            const lech = Math.max(-0.7, Math.min(0.7, vW.x * 0.7));
            giongThat.dat({ tanSo: HZ_MOI_KM_S * vDoDuoc(thu.R), doTo: 0.07 * im, lech });
            giongKep.dat({ tanSo: HZ_MOI_KM_S * vKepler(thu.R), doTo: 0.06 * im, lech });
          }
        } else {
          nhanThu.datChu(chuCanh("canh.sao-thu-mot-vong-trieu-nam-nhanh-trieu", "Sao thử<small>vòng {0} · nhánh {1} triệu năm</small>", [so((2 * Math.PI) / omegaSao(thu.R), 0), so((2 * Math.PI) / OM_NHANH, 0)]));
          // băng qua một nhánh: tiếng «tinh» ngắn
          const pha = phaThu();
          if (pha !== thu.pha) {
            if (dt > 0 && !thu.keo && gioThuc - thu.nhacCuoi > 0.12) {
              vW.copy(pT).project(camera);
              am.not({ tanSo: 784, dai: 0.6, doTo: 0.16, dang: 'kinh', lech: Math.max(-0.7, Math.min(0.7, vW.x * 0.7)) });
              thu.nhacCuoi = gioThuc;
            }
            thu.pha = pha;
          }
        }
      }

      // lỗ đen và quỹ đạo sao thử quanh nó: chỉ hiện khi bay lại gần tâm
      const gan = THREE.MathUtils.clamp((70 - dGoc) / 30, 0, 1);
      doMoLoDen += (gan - doMoLoDen) * (1 - Math.exp(-dtThuc * 4));
      loDen.nhom.visible = doMoLoDen > 0.01;
      loDen.datDoSang(1.4 * doMoLoDen);
      loDen.capNhat(dtThuc, camera);
      nhanLoDen.position.set(Math.max(BK_LO_DEN * 2.6, 10 * upp(dGoc)), Math.max(BK_LO_DEN * 1.6, 6 * upp(dGoc)) * doMoLoDen, 0);
      reTam.an(dGoc > 160);
      nhomS2.visible = !!s2.hien && doMoLoDen > 0.05;
      if (nhomS2.visible) {
        const T = chuKyQuanhSgr(s2.a);
        if (dt > 0) s2.gio += dt * 2;                     // đồng hồ riêng: 2 năm mỗi giây
        const Mtb = (2 * Math.PI * s2.gio) / T;
        const vong = Math.floor(Mtb / (2 * Math.PI));
        if (vong !== s2.vong) {
          if (vong === s2.vong + 1 && dt > 0 && gioThuc - s2.nhacCuoi > 0.2) { am.not({ tanSo: 1046, dai: 1.2, doTo: 0.18, dang: 'chuong' }); s2.nhacCuoi = gioThuc; }
          s2.vong = vong;
        }
        viTriS2(giaiKepler(Mtb - 2 * Math.PI * vong, E_S2), q3);
        saoS2.nhom.position.copy(q3);
        saoS2.capNhat(dtThuc);
        nhomS2.updateMatrixWorld();
        if (!s2.keo) { viTriS2(Math.PI, q3); tayS2.dat(q3.applyMatrix4(nhomS2.matrixWorld)); }
        saoS2.nhom.getWorldPosition(q3);
        nhanS2.position.copy(q3);
      }

      // bong bóng mờ dần khi tắt
      // Nhả ngay nếu người học dừng chuyến bay để tự điều khiển góc nhìn.
      if (doiGocBong && (dGoc >= 50 || !app._bay)) doiGocBong = false;
      doMoBong += ((hien.bong && !doiGocBong ? 1 : 0) - doMoBong) * (1 - Math.exp(-dtThuc * 5));
      bongFermi.mesh.visible = bongEro.mesh.visible = doMoBong > 0.01;
      bongFermi.mat.uniforms.uHien.value = bongEro.mat.uniforms.uHien.value = doMoBong;
      reFermi.an(!hien.bong); reEro.an(!hien.bong);
      // điểm rê chuột của thanh: dọc theo trục thanh đang quay
      const gb = GOC_THANH - OM_THANH * t;
      diemThanh.position.set(6 * Math.cos(gb), 0, -6 * Math.sin(gb));

      // sáng hơn một chút khi lùi xa để Ngân Hà không biến mất; lại gần thì hạt to ra và chồng lên nhau nên giảm sáng
      // lùi tới cỡ hàng xóm (vài nghìn) thì bớt lại: Ngân Hà chỉ còn vài chục điểm ảnh, sáng quá thì cháy thành một cục trắng
      const kXa = 1 - 0.55 * THREE.MathUtils.smoothstep(dCam, 1200, 3500);
      const kSang = (0.3 + 0.7 * THREE.MathUtils.smoothstep(dCam, 15, 120)) * THREE.MathUtils.clamp(0.9 + dCam / 700, 1, 3.2) * kXa;
      mat.uniforms.uSang.value = kSang;
      const kXom = 0.12 + 0.88 * THREE.MathUtils.smoothstep(dGoc, 40, 160);
      mat.uniforms.uXom.value = kXom;
      for (const [g, , , k] of thienHaXom) { g.nhom.visible = dGoc > 60; g.datDoSang(k * kXom); g.capNhat(dtThuc); }
      // Bay vào tâm thì lớp ánh sáng nền gần như tắt: nhìn xiên sát mặt đĩa, lõi phình của lớp này phủ một màn loá vàng
      // lên cả khung hình và lên lỗ đen. Ở đó hạt sao tự đủ dựng cảnh. Tắt hẳn thì khỏi vẽ (đỡ một lớp nhiễu toàn màn hình).
      const kNen = 0.035 + 0.965 * THREE.MathUtils.smoothstep(dGoc, 8, 40);
      nen.mat.uniforms.uSang.value = 0.55 * THREE.MathUtils.clamp(0.8 + dCam / 900, 1, 2.2) * kNen * kXa;
      bui.uDam.value = THREE.MathUtils.smoothstep(dGoc, 10, 35);
      qsc.mat.uniforms.uSang.value = 0.9;
      phinh3d.material.opacity = THREE.MathUtils.clamp((dGoc - 6) / 30, 0, 1);

      const xa = dCam > 420, ratXa = dCam > 1500;
      dsNhan.length = 0;
      dsNhan.push({ nhan: nhanMT, uuTien: 100, tat: ratXa });
      // Sgr A* không thuộc ý bước «Mặt Trời ở đâu» (nằm dưới bảng) và bước đường cong quay (nhãn vắt ngang đĩa)
      dsNhan.push({ nhan: nhanLoDen, uuTien: 90, tat: xa || gocBuoc === 'mt' || thu.cheDo === 'kepler' });
      dsNhan.push({ nhan: nhanS2, uuTien: 92, tat: !nhomS2.visible });
      dsNhan.push({ nhan: nhanThu, uuTien: 94, tat: !thu.cheDo || xa }, { nhan: nhanKepThu, uuTien: 93, tat: thu.cheDo !== 'kepler' || xa });
      dsNhan.push({ nhan: nhanFermi, uuTien: 80, tat: !hien.bong || xa }, { nhan: nhanEro, uuTien: 60, tat: !hien.bong || xa });
      // bước «Mặt Trời ở đâu» chỉ nhắc nhánh Orion, Sagittarius, Perseus: tắt Scutum–Centaurus, Norma (nằm dưới bảng)
      dsNhanNhanh.forEach((n, i) => dsNhan.push({ nhan: n, uuTien: 50, tat: !hien.nhanh || dCam > 330 || (gocBuoc === 'mt' && (i === 2 || i === 3)) }));
      for (const n of dsNhanLuoi) dsNhan.push({ nhan: n, uuTien: 20, tat: !hien.luoi || dCam > 330 });
      // năm thiên hà của bước «Hàng xóm» cùng một dải ưu tiên để nằm sát nhau thì khung dời chứ không ẩn
      hangXom.forEach(([n, , nguong], i) => dsNhan.push({ nhan: n, uuTien: 74 - (i >> 1), tat: dCam < nguong }));
      dsNhan.push({ nhan: nhanNH, uuTien: 95, tat: !xa });
      dsMau.forEach((m, i) => dsNhan.push({ nhan: m.nThat, uuTien: 85 - i, tat: !nhomMau.visible || xa }, { nhan: m.nKep, uuTien: 84 - i, tat: !nhomMau.visible || xa || i === 0 }));
      goNhanDeNhau(dsNhan, camera, app.rong, app.cao);
      luoi.visible = hien.luoi && dCam < 900;
      quyDaoMT.visible = dCam < 900;
      // lùi rất xa (hàng xóm): Mặt Trời nhỏ hơn mọi thứ, tia sáng của nó che mất Ngân Hà nên ẩn đi
      mtSao.nhom.visible = muiMT.visible = vetMT.line.visible = !ratXa;
    }

    function hud() {
      const vong = t / CHU_KY_MT;
      const dong = [
        [chuCanh("canh.thoi-gian", "Thời gian"), t < 0.05 ? chuCanh("canh.hien-tai", "hiện tại") : chuCanh("canh.trieu-nam-sau", "{0} triệu năm sau", [so(t, 0)])],
        [chuCanh("canh.mat-troi-da-di", "Mặt Trời đã đi"), chuCanh("canh.vong-quanh-tam-ngan-ha", "{0} vòng quanh tâm Ngân Hà", [so(vong, 2)])],
        [chuCanh("canh.mot-vong-nam-thien-ha", "Một vòng (năm thiên hà)"), chuCanh("canh.khoang-trieu-nam", "khoảng {0} triệu năm", [so(CHU_KY_MT, 0)])],
        [chuCanh("canh.mat-troi-cach-mat-phang-dia", "Mặt Trời cách mặt phẳng đĩa"), chuCanh("canh.nam-anh-sang", "{0} năm ánh sáng", [so(yMatTroi(t) * 1000, 0)])],
      ];
      if (thu.cheDo === 'dongquay') dong.push([chuCanh("canh.sao-thu-mot-vong-nhanh", "Sao thử: một vòng / nhánh"), chuCanh("canh.trieu-nam-54640e", "{0} / {1} triệu năm", [so((2 * Math.PI) / omegaSao(thu.R), 0), so((2 * Math.PI) / OM_NHANH, 0)])]);
      if (thu.cheDo === 'kepler') dong.push([chuCanh("canh.sao-thu-kepler-do-duoc", "Sao thử: Kepler / đo được"), `${so(vKepler(thu.R), 0)} / ${so(vDoDuoc(thu.R), 0)} km/s = ${so(vKepler(thu.R) / vDoDuoc(thu.R), 3)}`]);
      if (nhomS2.visible) dong.push([chuCanh("canh.sao-thu-quanh-sgr-a", "Sao thử quanh Sgr A*"), chuCanh("canh.a-au-t-nam", "a = {0} AU · T = {1} năm", [so(s2.a, 0), so(chuKyQuanhSgr(s2.a), 1)])]);
      return dong;
    }

    // Tham số riêng khi chụp kiểm (chỉ đọc ở chế độ im lặng): thu=dongquay | kepler34 | s2
    const thuDat = thamThu.get('thu');
    let choThu = !!thuDat;
    function apThu() {
      choThu = false;
      if (thuDat === 'dongquay') { thu.R = banKinhDongQuay(); veVongThu(); thu.pha = phaThu(); daKeo.thu = true; }
      else if (thuDat === 'kepler34') { thu.R = (16 / 9) * R0; veVongThu(); daKeo.thu = true; }
      else if (thuDat === 's2') { s2.a = Math.cbrt(M_SGR * 16 * 16); veVongS2(); daKeo.s2 = true; }
      const g = thamThu.get('gocThu');
      if (g) { const [a, b] = g.split(';').map((s) => s.split(',').map(Number)); app.bayToi(a, b, 0); }
    }

    return {
      scene, hud, tuChinhGanXa: [0.02, 60, 3e4], buoc, goc,
      capNhat: (dt, dtThuc) => { if (choThu) apThu(); capNhat(dt, dtThuc); },
      datTocDo: (v) => { tocDo = v; dkTocDo.dat(v); },
      veHienTai: () => { t = 0; tMau = 0; },
      tatGiong,
      // cho thử thách
      get daKeo() { return daKeo; },
      tiDongQuay: () => omegaSao(thu.R) / OM_NHANH,
      tiKepler: () => vKepler(thu.R) / vDoDuoc(thu.R),
      chuKyS2: () => chuKyQuanhSgr(s2.a),
      huy: () => { tatGiong(); },
    };
  },
};
