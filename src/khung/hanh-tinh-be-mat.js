// Hành tinh, Trái Đất, Mặt Trăng vẽ bằng shader (vân tính ngay trong shader, nhìn gần vẫn nét, không tốn
// thời gian vẽ ảnh lúc mở bài), khí quyển tán xạ ở rìa, vành Sao Thổ có bóng. Màu xuất ra là màu tuyến tính
// (material.tuyenTinh = true), xem «Hướng dẫn hình, tiếng, tương tác - Bản 3.md» mục 3.
//
// Vân bề mặt là hình minh hoạ tự sinh (xem chú thích đầu hanh-tinh-glsl.js); riêng bờ biển Trái Đất là thật.

import * as THREE from 'three';
import { taoNgauNhien } from './ve.js';
import { GLSL_NHIEU, GLSL_HO, GLSL_VAN, GLSL_DINH_CAU, LOAI } from './hanh-tinh-glsl.js';
import { texDatLien } from './hanh-tinh-ban-do.js';

// ---------------------------------------------------------------------------
// Dải màu theo vĩ độ của các hành tinh khí (sRGB 0–255), dựng thành ảnh 256×1 cho shader.
// ---------------------------------------------------------------------------
const BANG = {
  moc: [
    [-90, [92, 90, 92]], [-70, [120, 112, 104]], [-58, [150, 134, 114]], [-50, [182, 162, 136]], [-44, [150, 122, 96]],
    [-38, [214, 196, 166]], [-32, [168, 128, 94]], [-26, [228, 214, 186]], [-20, [222, 206, 176]], [-17, [160, 100, 62]],
    [-12, [184, 122, 80]], [-8, [150, 92, 58]], [-5, [232, 222, 200]], [0, [214, 196, 160]], [5, [236, 226, 206]],
    [8, [164, 100, 62]], [12, [140, 82, 52]], [17, [176, 118, 80]], [20, [232, 218, 190]], [24, [186, 138, 98]],
    [28, [220, 204, 174]], [34, [170, 140, 108]], [40, [212, 196, 168]], [48, [160, 140, 116]], [56, [186, 170, 148]],
    [66, [128, 118, 108]], [90, [92, 90, 92]],
  ],
  tho: [
    [-90, [120, 130, 140]], [-75, [150, 150, 140]], [-60, [190, 176, 140]], [-45, [214, 192, 140]], [-35, [200, 170, 118]],
    [-25, [232, 212, 164]], [-15, [216, 186, 128]], [-5, [242, 226, 182]], [5, [238, 220, 170]], [14, [214, 182, 124]],
    [22, [232, 210, 160]], [32, [204, 176, 124]], [44, [222, 200, 150]], [56, [190, 170, 128]], [66, [176, 164, 130]],
    [74, [140, 150, 150]], [90, [110, 130, 150]],
  ],
};
const _bang = new Map();
export function texBangMau(id) {
  const ten = BANG[id] ? id : 'tho';
  if (_bang.has(ten)) return _bang.get(ten);
  const b = BANG[ten];
  const d = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const lat = ((i + 0.5) / 256) * 180 - 90;
    let k = 1;
    while (k < b.length - 1 && b[k][0] < lat) k++;
    const [l0, c0] = b[k - 1], [l1, c1] = b[k];
    let t = Math.min(1, Math.max(0, (lat - l0) / (l1 - l0)));
    t = t * t * (3 - 2 * t);
    for (let j = 0; j < 3; j++) d[i * 4 + j] = Math.round(c0[j] + (c1[j] - c0[j]) * t);
    d[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(d, 256, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  _bang.set(ten, tex);
  return tex;
}

// ---------------------------------------------------------------------------
// Vành Sao Thổ: độ dày quang học theo bán kính (đơn vị bán kính Sao Thổ, 60 268 km), dựa theo số đo
// của Cassini/Voyager ở mức gần đúng: vành C 1,239–1,527 (mỏng), vành B 1,527–1,951 (dày đặc nhất),
// khe Cassini 1,951–2,025 (có khe Huygens ở mép trong), vành A 2,025–2,267 (khe Encke 2,214, khe Keeler 2,265),
// vành F hẹp ở 2,324. Các gợn nhỏ bên trong mỗi vành là nhiễu minh hoạ.
// ---------------------------------------------------------------------------
export const VANH_R0 = 1.11, VANH_R1 = 2.35;
let _texVanh = null;
export function texVanhTho() {
  if (_texVanh) return _texVanh;
  const N = 2048, SUB = 6;
  const rnd = taoNgauNhien(31);
  const V = Float32Array.from({ length: 4096 }, () => rnd());
  const nh = (x) => { const i = Math.floor(x), f = x - i, a = V[i & 4095], b = V[(i + 1) & 4095]; return a + (b - a) * f * f * (3 - 2 * f); };
  const gon = (x) => 0.5 * nh(x) + 0.3 * nh(x * 2.7 + 13) + 0.2 * nh(x * 7.3 + 29);
  const bs = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const vanh = (r) => {          // → [độ dày quang học tau, r, g, b]
    if (r < 1.239) return [0.012 * bs(1.11, 1.2, r), 140, 130, 124];
    if (r < 1.527) {
      let t = 0.06 + 0.05 * gon(r * 900);
      if (r > 1.45) t += 0.06 * bs(1.45, 1.5, r);
      if (Math.abs(r - 1.29) < 0.004 || Math.abs(r - 1.47) < 0.003) t = 0.005;    // khe Colombo, Maxwell
      return [t, 150, 138, 124];
    }
    if (r < 1.951) {
      let t = 1.0 + 1.6 * gon(r * 700) + 1.2 * bs(1.64, 1.75, r) - 0.5 * bs(1.9, 1.951, r);
      t *= 0.75 + 0.5 * nh(r * 3000);
      const m = 0.5 + 0.5 * gon(r * 300);
      return [t, 226 + 10 * m, 206 + 10 * m, 170 + 12 * m];
    }
    if (r < 2.025) {
      if (r < 1.97) return [0.004, 120, 110, 100];             // khe Huygens
      return [0.08 + 0.07 * gon(r * 1200), 150, 140, 128];
    }
    if (r < 2.267) {
      if (Math.abs(r - 2.2143) < 0.0027) return [0.004, 120, 110, 100];   // khe Encke
      if (Math.abs(r - 2.2645) < 0.0008) return [0.004, 120, 110, 100];   // khe Keeler
      let t = 0.55 + 0.25 * gon(r * 800) - 0.25 * bs(2.18, 2.26, r);
      return [t, 214, 198, 170];
    }
    if (Math.abs(r - 2.324) < 0.0016) return [0.5, 226, 214, 196];       // vành F
    return [0.004 * (1 - bs(2.27, 2.33, r)), 150, 140, 130];
  };
  const d = new Uint8Array(N * 4);
  for (let i = 0; i < N; i++) {
    let a = 0, c0 = 0, c1 = 0, c2 = 0;
    for (let s = 0; s < SUB; s++) {
      const r = VANH_R0 + ((i + (s + 0.5) / SUB) / N) * (VANH_R1 - VANH_R0);
      const [tau, cr, cg, cb] = vanh(r);
      const op = 1 - Math.exp(-tau * 1.7);
      a += op; c0 += cr * op; c1 += cg * op; c2 += cb * op;
    }
    const k = a > 1e-6 ? 1 / a : 0;
    d[i * 4] = Math.round(c0 * k); d[i * 4 + 1] = Math.round(c1 * k); d[i * 4 + 2] = Math.round(c2 * k);
    d[i * 4 + 3] = Math.round((a / SUB) * 255);
  }
  const tex = new THREE.DataTexture(d, N, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  _texVanh = tex;
  return tex;
}

// Đồng phục (uniform) dùng chung giữa bề mặt, khí quyển, vành của cùng một thiên thể.
function uChung() {
  return {
    uNguon: { value: new THREE.Vector4(1, 0.25, 0.6, 0).normalize() },
    uT: { value: 0 },
    uCuong: { value: 1 },
  };
}

// ---------------------------------------------------------------------------
// Khí quyển: lớp vỏ tán xạ. Với mỗi điểm ảnh, tính tia nhìn đi sát hành tinh tới đâu (khoảng cách gần nhất b),
// lượng khí trên đường đi giảm theo hàm mũ khi b ra xa mặt đất (thang độ cao H), nhân với độ sáng ở chỗ đó
// (ban ngày xanh, gần đường sáng tối ngả cam) và hàm pha Rayleigh + tán xạ thuận (sáng lên khi nhìn ngược sáng).
// ---------------------------------------------------------------------------
function vatLieuKhiQuyen(u, mau, manh, day) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uNguon: u.uNguon, uCuong: u.uCuong, uMau: { value: new THREE.Color(mau) }, uManh: { value: manh }, uDay: { value: day }, uH: { value: (day - 1) / 5.5 } },
    vertexShader: /* glsl */ `
      uniform float uDay;
      varying vec3 vW; varying vec3 vC; varying float vR;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vC = modelMatrix[3].xyz; vR = length(modelMatrix[0].xyz) / uDay;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec4 uNguon; uniform vec3 uMau; uniform float uManh, uH, uCuong;
      varying vec3 vW; varying vec3 vC; varying float vR;
      void main() {
        vec3 ro = cameraPosition, rd = normalize(vW - ro);
        vec3 oc = vC - ro;
        float t = dot(oc, rd);
        float b = sqrt(max(dot(oc, oc) - t * t, 0.0)) / vR;
        if (t < 0.0) b = length(oc) / vR;
        vec3 diem = ro + rd * max(t, 0.0);
        float d;
        if (b >= 1.0) d = exp(-(b - 1.0) / uH);
        else {
          float mu = sqrt(1.0 - b * b);
          d = 0.5 * (uH * 2.5) / (mu + uH * 2.5);
          diem = ro + rd * (t - mu * vR);
        }
        vec3 nC = normalize(diem - vC);
        vec3 L = uNguon.w > 0.5 ? normalize(uNguon.xyz - diem) : normalize(uNguon.xyz);
        float ld = dot(nC, L);
        float sang = smoothstep(-0.28, 0.3, ld);
        vec3 mau = mix(vec3(1.0, 0.42, 0.16), uMau, smoothstep(-0.12, 0.3, ld));
        float cs = dot(rd, L);
        float pha = 0.75 * (1.0 + cs * cs) + 1.6 * pow(max(cs, 0.0), 10.0);
        gl_FragColor = vec4(mau * d * sang * pha * uManh * uCuong, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  m.tuyenTinh = true;
  return m;
}

const _geoKQ = new Map();
function geoCau(n) {
  if (!_geoKQ.has(n)) _geoKQ.set(n, new THREE.SphereGeometry(1, n, n / 2));
  return _geoKQ.get(n);
}

// Khí quyển phát sáng ở rìa: lớp vỏ bán kính day (đơn vị bán kính hành tinh). Dùng cho bài cũ (Mặt Trời ở gốc
// toạ độ thế giới). Giữ cách gọi của Bản 2: taoKhiQuyen(mau, manh, day) → Mesh.
export function taoKhiQuyen(mau, manh = 1, day = 1.05) {
  const u = uChung();
  u.uNguon.value.set(0, 0, 0, 1);
  const m = new THREE.Mesh(geoCau(64), vatLieuKhiQuyen(u, mau, manh * 0.85, day));
  m.scale.setScalar(day);
  return m;
}

// ---------------------------------------------------------------------------
// Vành Sao Thổ (shader): mặt sáng phản xạ, mặt khuất chỉ lọt ánh sáng qua chỗ mỏng (vành B dày thành tối, khe
// Cassini và vành C sáng lên), bóng hành tinh đổ lên vành, sáng hơn khi nhìn ngược sáng (tán xạ thuận).
// ---------------------------------------------------------------------------
function vatLieuVanh(u) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uNguon: u.uNguon, uCuong: u.uCuong, uVanh: { value: texVanhTho() }, uVanhR: { value: new THREE.Vector2(VANH_R0, VANH_R1) } },
    vertexShader: GLSL_DINH_CAU,
    fragmentShader: /* glsl */ `
      uniform sampler2D uVanh; uniform vec2 uVanhR; uniform float uCuong;
      varying vec3 vP; varying vec2 vUv; varying vec3 vLo; varying vec3 vVo;
      void main() {
        float r = length(vP.xz);
        vec4 v = texture(uVanh, vec2((r - uVanhR.x) / (uVanhR.y - uVanhR.x), 0.5));
        float op = v.a;
        if (op < 0.002) discard;
        vec3 L = normalize(vLo), V = normalize(vVo);
        // bóng hành tinh (mặt cầu bán kính 1 ở gốc)
        float tc = -dot(vP, L);
        float d2 = dot(vP, vP) - tc * tc;
        float bong = tc > 0.0 ? smoothstep(0.985, 1.015, sqrt(max(d2, 0.0))) : 1.0;
        float mu0 = abs(L.y);
        bool matSang = L.y * V.y > 0.0;
        float cs = max(dot(-V, L), 0.0);
        vec3 c;
        if (matSang) c = v.rgb * op * 1.25 * (0.18 + 0.82 * smoothstep(0.0, 0.25, mu0)) * (0.9 + 0.5 * pow(cs, 6.0));
        else c = v.rgb * op * (1.0 - op) * 1.6 * (0.5 + 2.5 * pow(cs, 4.0));
        c *= bong * uCuong;
        gl_FragColor = vec4(c, op);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
  });
  m.tuyenTinh = true;
  return m;
}
let _geoVanh = null;
function geoVanh() {
  if (!_geoVanh) { _geoVanh = new THREE.RingGeometry(VANH_R0, VANH_R1, 256, 6); _geoVanh.rotateX(-Math.PI / 2); }
  return _geoVanh;
}
// Vành Sao Thổ cho bài cũ (Mặt Trời ở gốc toạ độ thế giới): Mesh nằm trong mặt phẳng xích đạo (vuông góc trục y).
export function taoVanhThoShader() {
  const u = uChung();
  u.uNguon.value.set(0, 0, 0, 1);
  return new THREE.Mesh(geoVanh(), vatLieuVanh(u));
}

// ---------------------------------------------------------------------------
// Bề mặt: một shader chung, chọn công thức vân bằng #define LOAI. Đá (Thủy, Hỏa, Mặt Trăng) có hố va chạm
// lệch pháp tuyến và bóng đổ trong lòng hố; khí (Mộc, Thổ, …) có tối dần về rìa kiểu Minnaert;
// Trái Đất có biển phản chiếu, mây và bóng mây, tán xạ, viền hoàng hôn.
// ---------------------------------------------------------------------------
const HO = {
  9: [[3.2, 0.55, 1.0, 0.32], [7.5, 0.65, 2.0, 0.42], [17.0, 0.75, 3.0, 0.45], [38.0, 0.82, 4.0, 0.45], [85.0, 0.85, 5.0, 0.42], [190.0, 0.88, 6.0, 0.38], [420.0, 0.9, 7.0, 0.32]],
  1: [[4.0, 0.6, 1.5, 0.36], [10.0, 0.66, 2.5, 0.42], [24.0, 0.72, 3.5, 0.45], [56.0, 0.78, 4.5, 0.42], [130.0, 0.8, 5.5, 0.38], [300.0, 0.8, 6.5, 0.32]],
  4: [[7.0, 0.3, 1.7, 0.18], [17.0, 0.4, 2.7, 0.2], [40.0, 0.45, 3.7, 0.2], [95.0, 0.5, 4.7, 0.18]],
};
function glslHo(loai) {
  const ds = HO[loai];
  if (!ds) return '';
  const he = loai === 9 ? '(1.0 - 0.72 * bienT)' : loai === 4 ? '(0.4 + 0.9 * smoothstep(0.3, -0.5, p.y))' : '1.0';
  return ds.map(([f, md, h, s]) => `hoVaCham(p, ${f.toFixed(2)}, ${md} * ${he}, ${h.toFixed(1)}, ${s}, L, w, g, bong, tuoi, day);`).join('\n    ');
}

function vatLieuBeMat(loai, u, { mauKQ = 0x000000, manhKQ = 0, coVanh = false } = {}) {
  const da = loai === 1 || loai === 4 || loai === 9;
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uNguon: u.uNguon, uT: u.uT, uCuong: u.uCuong,
      uBang: { value: texBangMau(loai === 5 ? 'moc' : 'tho') },
      uDat: { value: loai === 3 ? texDatLien() : texBangMau('tho') },
      uMauKQ: { value: new THREE.Color(mauKQ) }, uManhKQ: { value: manhKQ },
      uVanh: { value: coVanh ? texVanhTho() : null }, uVanhR: { value: new THREE.Vector2(VANH_R0, VANH_R1) },
      uNuong: { value: 0 }, uMatDat: { value: null }, uMayDat: { value: null },
    },
    defines: { LOAI: loai, ...(coVanh ? { CO_VANH: 1 } : {}), ...(da ? { DA: 1 } : {}) },
    vertexShader: GLSL_DINH_CAU,
    fragmentShader: /* glsl */ `
      uniform float uT, uCuong, uManhKQ, uNuong;
      uniform vec3 uMauKQ;
      #if LOAI == 3
      uniform sampler2D uMatDat; uniform sampler2D uMayDat;
      #endif
      #ifdef CO_VANH
      uniform sampler2D uVanh; uniform vec2 uVanhR;
      #endif
      varying vec3 vP; varying vec2 vUv; varying vec3 vLo; varying vec3 vVo;
      ${GLSL_NHIEU}
      ${da ? GLSL_HO : ''}
      ${GLSL_VAN}
      #if LOAI == 3
      // Mặt đất đã nướng sẵn thành ảnh (rgb: hệ số phản xạ, a: mặt nạ nước), cùng công thức với vanDat.
      vec4 datNuong(vec3 p, vec2 uv, float w) {
        vec4 s = texture(uMatDat, uv);
        // nhìn rất gần: thêm một bậc nhiễu nhỏ cho đất khỏi mềm
        float gan = 1.0 - smoothstep(0.0006, 0.0016, w);
        if (gan > 0.0) s.rgb *= 1.0 + 0.2 * gan * (1.0 - s.a) * nhieuG(p * 380.0);
        return s;
      }
      #endif
      void main() {
        vec3 p = normalize(vP);
        float w = max(length(fwidth(vP)), 1e-6);
        vec3 L = normalize(vLo), V = normalize(vVo);
        float nl0 = dot(p, L), nv = max(dot(p, V), 0.0);
      #if LOAI == 3
        // Trái Đất: nửa đêm (nl0 < -0,2) mọi thành phần ở dưới đều bằng 0, khỏi tính vân.
        vec4 a = vec4(0.0);
        if (nl0 > -0.2) {
          if (uNuong > 0.5) a = datNuong(p, vUv, w);
          else a = vanTheoLoai(LOAI, p, vUv, w, uT);
        }
      #else
        vec4 a = vanTheoLoai(LOAI, p, vUv, w, uT);
      #endif
        vec3 alb = a.rgb;
        vec3 col;
      #ifdef DA
        vec3 g = vec3(0.0); float bong = 1.0, tuoi = 0.0, day = 0.0;
        #if LOAI == 9
        float bienT = bienTrang(p, w);
        #endif
        ${glslHo(loai)}
        // nhấp nhô lớn của địa hình (độ dốc của nhiễu, tính bằng sai phân)
        {
          float e = 0.004, k0 = fbm(p * 4.0, 4, w * 4.0);
          vec3 gn = vec3(fbm((p + vec3(e, 0, 0)) * 4.0, 4, w * 4.0) - k0, fbm((p + vec3(0, e, 0)) * 4.0, 4, w * 4.0) - k0, fbm((p + vec3(0, 0, e)) * 4.0, 4, w * 4.0) - k0) / e;
          g += gn * (LOAI == 4 ? 0.006 : 0.009);
        }
        g -= p * dot(g, p);
        vec3 n = normalize(p - g);
        alb *= 1.0 + 0.55 * min(tuoi, 1.5);
        float nl = dot(n, L), nvn = max(dot(n, V), 0.0);
        float lam = max(nl, 0.0);
        float ls = 2.0 * lam / (lam + nvn + 0.03);
        float dif = mix(lam, ls, LOAI == 4 ? 0.25 : 0.55);
        dif *= bong * smoothstep(-0.02, 0.04, nl0);
        col = alb * dif;
      #elif LOAI == 3
        // ----- Trái Đất -----
       if (nl0 <= -0.2) col = vec3(0.0);
       else {
        float may, mayBong;
        if (uNuong > 0.5) {
          // mây đã nướng (lúc t = 0): dời ảnh theo kinh độ đúng góc mây đã trôi ở vĩ độ này
          float goc = gocMayTroi((vUv.y - 0.5) * 180.0, uT);
          vec2 uvM = vec2(vUv.x + goc / 6.2831853, vUv.y);
          may = texture(uMayDat, uvM).r;
          // bóng mây: lấy mây ở chỗ dời 0,01 bán kính về phía Mặt Trời (đổi độ dời trên mặt cầu ra toạ độ ảnh)
          vec3 dong, bac; tiepTuyen(p, dong, bac);
          vec3 dl = L * 0.010;
          vec2 uvB = uvM + vec2(dot(dl, dong) / (6.2831853 * max(length(p.xz), 0.05)), dot(dl, bac) / 3.14159265);
          mayBong = texture(uMayDat, uvB, 0.6).r;
          // nhìn rất gần (một điểm ảnh nhỏ hơn một ô ảnh nướng): thêm một bậc mây vụn cho khỏi mềm
          float gan = 1.0 - smoothstep(0.0006, 0.0016, w);
          if (gan > 0.0 && may > 0.02) may = clamp(may * (1.0 + 0.22 * gan * nhieuG(xoayY(p, goc) * 300.0)), 0.0, 1.0);
        } else {
          may = mayDat(p, w, uT);
          mayBong = mayDat(normalize(p + L * 0.010), w * 1.5, uT);
        }
        float sangDat = max(nl0, 0.0);
        vec3 mat = alb * sangDat * (1.0 - 0.6 * mayBong * smoothstep(0.0, 0.15, nl0));
        // ánh Mặt Trời phản chiếu trên biển (độ gợn sóng đổi theo gió); chỉ tính ở chỗ có nước, ban ngày, không mây kín
        float nuocSang = a.a * smoothstep(0.0, 0.06, nl0) * (1.0 - may);
        if (nuocSang > 0.002) {
          vec3 H = normalize(L + V);
          float nh = max(dot(p, H), 0.0);
          float gon = 0.65 + 0.35 * fbm(p * 30.0 + uT * 0.01, 3, w * 30.0);
          float F = 0.02 + 0.98 * pow(max(1.0 - nv, 0.0), 5.0);
          float phan = (pow(nh, 400.0 * gon) * 2.6 + pow(nh, 40.0) * 0.08) * (0.25 + F);
          mat += vec3(1.0, 0.9, 0.75) * nuocSang * phan;
        }
        // hoàng hôn: viền ấm ở đường sáng tối
        vec3 mauSang = mix(vec3(1.0, 0.45, 0.2), vec3(1.0), smoothstep(-0.02, 0.22, nl0));
        vec3 mayMau = vec3(0.66) * mauSang * smoothstep(-0.08, 0.3, nl0) * (0.7 + 0.3 * may);
        col = mix(mat, mayMau, may);
        // tán xạ: lớp mờ xanh dày dần về rìa, chỉ ở phía ban ngày
        float fres = pow(max(1.0 - nv, 0.0), 2.2);
        vec3 tanXa = mix(vec3(0.5, 0.22, 0.1), vec3(0.09, 0.22, 0.6), smoothstep(-0.05, 0.3, nl0)) * smoothstep(-0.2, 0.25, nl0);
        col = col * (1.0 - 0.4 * fres) + tanXa * (0.008 + 0.55 * fres);
       }
      #else
        // ----- hành tinh khí, Sao Kim: tối dần về rìa kiểu Minnaert -----
        float dif = pow(max(nl0, 0.0), 1.15) * pow(max(nv, 0.02), 0.15);
        col = alb * dif;
      #endif
      #ifdef CO_VANH
        // bóng vành đổ lên hành tinh
        if (abs(L.y) > 1e-4) {
          float tv = -p.y / L.y;
          if (tv > 0.0) {
            vec3 h = p + L * tv;
            float s = (length(h.xz) - uVanhR.x) / (uVanhR.y - uVanhR.x);
            if (s > 0.0 && s < 1.0) col *= 1.0 - 0.88 * texture(uVanh, vec2(s, 0.5)).a;
          }
        }
      #endif
        // lớp mờ khí quyển ở rìa
        float fr = pow(max(1.0 - nv, 0.0), 3.0);
        col = mix(col, uMauKQ * 0.6 * smoothstep(-0.1, 0.35, nl0), fr * uManhKQ);
        gl_FragColor = vec4(col * uCuong, 1.0);
      }`,
  });
  m.tuyenTinh = true;
  return m;
}

// ---------------------------------------------------------------------------
// Trái Đất nướng sẵn (tăng tốc): mặt đất và mây là phần nặng nhất của shader (vài chục lượt nhiễu mỗi điểm ảnh),
// mà không đổi theo thời gian (mây chỉ trôi theo kinh độ). Nên vẽ một lần ra hai ảnh trải phẳng 4096 × 2048 (mặt
// đất: rgb hệ số phản xạ + a mặt nạ nước; mây: một kênh) bằng đúng công thức ấy, ngay trên card đồ hoạ của bộ vẽ
// chính, mỗi khung hình một dải 32 hàng (khoảng 2 giây là xong, không đọc ngược về CPU), rồi shader chỉ lấy mẫu
// ảnh. Ảnh dùng chung cho mọi Trái Đất và giữ lại cho các lần mở bài sau. Trong lúc chưa xong (hay máy không vẽ
// được vào ảnh) thì shader tính vân trực tiếp như trước, hình y hệt.
// Vẽ dải nằm trong onBeforeRender của quả cầu: three.js cho phép vẽ lồng như vậy (Reflector cũng làm thế).
// ---------------------------------------------------------------------------
const RONG_NUONG = 4096, CAO_NUONG = 2048, HANG_DAI = 32;
const _datNuong = { rtMat: null, rtMay: null, mat: null, canh: null, cam: null, buoc: 0, xong: false, hong: false, renderer: null, daNghe: false };
function taoBoNuong(renderer) {
  const d = _datNuong;
  const tuyChon = (dinhDang, srgb) => {
    const rt = new THREE.WebGLRenderTarget(RONG_NUONG, CAO_NUONG, {
      format: dinhDang, type: THREE.UnsignedByteType, depthBuffer: false, stencilBuffer: false,
      colorSpace: srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace,
      generateMipmaps: false, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping,
      anisotropy: 8,
    });
    rt.scissorTest = true;
    rt.texture.vtDungChung = true;
    return rt;
  };
  d.rtMat = tuyChon(THREE.RGBAFormat, true);      // SRGB8_ALPHA8: ghi màu tuyến tính, card tự mã hoá sRGB (đủ mịn cho biển tối)
  d.rtMay = tuyChon(THREE.RedFormat, false);
  d.mat = new THREE.ShaderMaterial({
    uniforms: { uLoai: { value: 3 }, uW: { value: (2 * Math.PI) / RONG_NUONG }, uBang: { value: texBangMau('tho') }, uDat: { value: texDatLien() } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform int uLoai; uniform float uW;
      varying vec2 vUv;
      ${GLSL_NHIEU}
      ${GLSL_VAN}
      void main() {
        float th = (1.0 - vUv.y) * 3.14159265, ph = vUv.x * 6.2831853;
        vec3 p = vec3(-cos(ph) * sin(th), cos(th), sin(ph) * sin(th));
        vec4 v = vanTheoLoai(uLoai, p, vUv, uW, 0.0);
        gl_FragColor = uLoai == 11 ? vec4(v.a, 0.0, 0.0, 1.0) : v;
      }`,
    depthTest: false, depthWrite: false,
  });
  d.mat.tuyenTinh = true;
  d.canh = new THREE.Scene();
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), d.mat);
  q.frustumCulled = false;
  d.canh.add(q);
  d.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  d.renderer = renderer;
  // Mất ngữ cảnh đồ hoạ thì ảnh nướng mất theo: các Trái Đất quay về cách tính trực tiếp, khôi phục xong thì nướng lại.
  if (!d.daNghe) {
    d.daNghe = true;
    renderer.domElement?.addEventListener?.('webglcontextlost', () => {
      for (const m of _vatLieuDat) { m.uniforms.uNuong.value = 0; m.uniforms.uMatDat.value = m.uniforms.uMayDat.value = null; }
      Object.assign(d, { rtMat: null, rtMay: null, mat: null, canh: null, cam: null, buoc: 0, xong: false, hong: false, renderer: null });
    });
  }
}
const _vatLieuDat = new Set();      // vật liệu Trái Đất đang dùng ảnh nướng (bỏ ra khi vật liệu bị huỷ)
// Vẽ tiếp một dải. Trả true khi cả hai ảnh đã xong.
function tienDoNuongDat(renderer) {
  const d = _datNuong;
  if (d.xong) return true;
  if (d.hong || !renderer?.capabilities?.isWebGL2) { d.hong = true; return false; }
  if (d.renderer && d.renderer !== renderer) return false;         // chỉ nướng trên một bộ vẽ
  try {
    if (!d.mat) taoBoNuong(renderer);
    const soDai = CAO_NUONG / HANG_DAI;
    const laMay = d.buoc >= soDai;
    const rt = laMay ? d.rtMay : d.rtMat;
    const y0 = (d.buoc % soDai) * HANG_DAI;
    d.mat.uniforms.uLoai.value = laMay ? 11 : 3;
    rt.viewport.set(0, 0, RONG_NUONG, CAO_NUONG);
    rt.scissor.set(0, y0, RONG_NUONG, HANG_DAI);
    const cuoi = (d.buoc % soDai) === soDai - 1;
    rt.texture.generateMipmaps = cuoi;                               // dải cuối của ảnh: dựng mipmap một lần
    const dichCu = renderer.getRenderTarget();
    const xoaCu = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(rt);
    renderer.render(d.canh, d.cam);
    renderer.setRenderTarget(dichCu);
    renderer.autoClear = xoaCu;
    if (d.buoc === 0) {
      // shader nướng dịch hỏng thì thôi, giữ cách tính trực tiếp
      const ct = renderer.properties.get(d.mat).currentProgram;
      if (ct?.diagnostics && ct.diagnostics.runnable === false) { d.hong = true; return false; }
    }
    d.buoc++;
    if (d.buoc < 2 * soDai) return false;
    d.xong = true;
    d.mat.dispose();
    return true;
  } catch (e) {
    console.warn('Không nướng được vân Trái Đất, dùng cách tính trực tiếp:', e);
    d.hong = true;
    return false;
  }
}
// Gắn ảnh nướng vào vật liệu Trái Đất khi đã có (gọi trong onBeforeRender; xong rồi thì không tốn gì).
function ganNuongDat(mat, renderer) {
  const u = mat.uniforms;
  if (u.uNuong.value > 0.5 || !tienDoNuongDat(renderer)) return;
  u.uMatDat.value = _datNuong.rtMat.texture;
  u.uMayDat.value = _datNuong.rtMay.texture;
  u.uNuong.value = 1;
  if (!_vatLieuDat.has(mat)) { _vatLieuDat.add(mat); mat.addEventListener('dispose', () => _vatLieuDat.delete(mat)); }
}

// Khí quyển của từng thiên thể: [màu, độ mạnh lớp vỏ, độ dày lớp vỏ (bán kính), độ mờ trên mặt]
const KHI_QUYEN = {
  kim: [0xffe6b8, 0.9, 1.035, 0.35], dat: [0x5f9fff, 1.25, 1.045, 0.0], hoa: [0xffb08a, 0.4, 1.02, 0.15],
  moc: [0xffe2bc, 0.35, 1.025, 0.2], tho: [0xffe8c4, 0.35, 1.025, 0.2], thienVuong: [0xb8f4ff, 0.75, 1.03, 0.35],
  haiVuong: [0x7aa4ff, 0.85, 1.03, 0.3],
};
// Trục nghiêng (độ) và tốc độ tự quay mặc định (radian mỗi giây, đã làm chậm cho dễ nhìn).
const MAC_DINH = {
  thuy: [0.03, 0.01], kim: [177.4, -0.006], dat: [23.44, 0.06], hoa: [25.19, 0.058], moc: [3.13, 0.14],
  tho: [26.73, 0.13], thienVuong: [97.77, -0.08], haiVuong: [28.32, 0.09], trang: [6.68, 0.0],
};

// Tạo một thiên thể có bề mặt (hành tinh, Trái Đất, Mặt Trăng).
//   id: 'thuy' | 'kim' | 'dat' | 'hoa' | 'moc' | 'tho' | 'thienVuong' | 'haiVuong' | 'trang'
//   banKinh: bán kính (đơn vị cảnh); nghieng: độ nghiêng trục (độ); tocDoQuay: radian mỗi giây;
//   khiQuyen: có vẽ lớp khí quyển không; vanh: có vành không (mặc định chỉ Sao Thổ); chiTiet: số đoạn kinh tuyến.
//   chatLuong (chỉ Trái Đất): 'nhanh' (mặc định) dùng mặt đất và mây nướng sẵn thành ảnh, nhẹ hơn nhiều khi Trái Đất
//     phủ lớn màn hình mà hình gần như y hệt; 'goc' luôn tính vân trực tiếp trong shader (nét nhất khi nhìn cực gần).
// Trả về { nhom, truc, cau, khiQuyen, vanh, capNhat(dt), datHuongSang(v), datNguonSang(p), datCuong(k), datThoiGian(t) }.
export function taoThienTheBeMat({ id = 'dat', banKinh = 1, nghieng, tocDoQuay, khiQuyen = true, vanh, chiTiet = 128, chatLuong = 'nhanh' } = {}) {
  const loai = LOAI[id] ?? 3;
  const md = MAC_DINH[id] || [0, 0.05];
  const u = uChung();
  const nhom = new THREE.Group();
  const truc = new THREE.Group();
  truc.rotation.z = THREE.MathUtils.degToRad(nghieng ?? md[0]);
  truc.scale.setScalar(banKinh);
  nhom.add(truc);
  const kq = khiQuyen ? KHI_QUYEN[id] : null;
  const coVanh = vanh ?? id === 'tho';
  const cau = new THREE.Mesh(geoCau(chiTiet), vatLieuBeMat(loai, u, { mauKQ: kq?.[0] ?? 0, manhKQ: kq?.[3] ?? 0, coVanh }));
  truc.add(cau);
  // Đo thử (app đo, --thu-js): window.__VT_THU = { chatLuongDat: 'goc' | 'nhanh' } ép chất lượng cho mọi Trái Đất.
  const ep = typeof window !== 'undefined' && window.__VT_THU?.chatLuongDat;
  const nuong = loai === 3 && (ep || chatLuong) !== 'goc';
  // Nướng dần mỗi lần quả cầu được vẽ (mỗi khung hình một lần, chỉ khi Trái Đất đang hiện).
  if (nuong) cau.onBeforeRender = (renderer) => ganNuongDat(cau.material, renderer);
  let lopKQ = null;
  if (kq) {
    lopKQ = new THREE.Mesh(geoCau(64), vatLieuKhiQuyen(u, kq[0], kq[1], kq[2]));
    lopKQ.scale.setScalar(kq[2]);
    truc.add(lopKQ);
  }
  let lopVanh = null;
  if (coVanh) { lopVanh = new THREE.Mesh(geoVanh(), vatLieuVanh(u)); truc.add(lopVanh); }
  const quay = tocDoQuay ?? md[1];
  return {
    nhom, truc, cau, khiQuyen: lopKQ, vanh: lopVanh, uniforms: u,
    capNhat(dt = 0) { u.uT.value += dt; cau.rotation.y += quay * dt; },
    datThoiGian(t) { u.uT.value = t; },
    // hướng TỚI nguồn sáng, hệ thế giới (ánh sáng song song)
    datHuongSang(v) { const l = Math.hypot(v.x ?? v[0], v.y ?? v[1], v.z ?? v[2]) || 1; u.uNguon.value.set((v.x ?? v[0]) / l, (v.y ?? v[1]) / l, (v.z ?? v[2]) / l, 0); },
    // vị trí nguồn sáng điểm, hệ thế giới (ví dụ Mặt Trời ở gốc toạ độ)
    datNguonSang(p) { u.uNguon.value.set(p.x ?? p[0], p.y ?? p[1], p.z ?? p[2], 1); },
    datCuong(k) { u.uCuong.value = k; },
  };
}
