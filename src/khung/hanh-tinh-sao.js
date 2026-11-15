// Sao, lỗ đen nhỏ (hình minh hoạ cho cảnh sơ đồ), thiên hà xoắn nhỏ, sao chổi.
// Tất cả là hình minh hoạ vẽ bằng shader, màu tuyến tính, phần phát sáng có độ sáng lớn hơn 1 để có quầng.

import * as THREE from 'three';
import { taoNgauNhien } from './ve.js';
import { GLSL_NHIEU } from './hanh-tinh-glsl.js';
import { GLSL_DINH_BANG, geoBang } from './hanh-tinh-mat-troi.js';

// Màu của vật đen ở nhiệt độ K (gần đúng theo Tanner Helland), trả THREE.Color tuyến tính, độ sáng ~1.
export function mauNhietDo(K) {
  const t = Math.min(40000, Math.max(1000, K)) / 100;
  let r, g, b;
  if (t <= 66) { r = 255; g = 99.4708 * Math.log(t) - 161.1196; b = t <= 19 ? 0 : 138.5177 * Math.log(t - 10) - 305.0448; }
  else { r = 329.6987 * Math.pow(t - 60, -0.1332); g = 288.1222 * Math.pow(t - 60, -0.0755); b = 255; }
  const k = (x) => Math.min(255, Math.max(0, x)) / 255;
  const c = new THREE.Color().setRGB(k(r), k(g), k(b), THREE.SRGBColorSpace);
  const m = Math.max(c.r, c.g, c.b) || 1;
  return c.multiplyScalar(1 / m);
}

const layMau = (mau, nhietDo) => (nhietDo ? mauNhietDo(nhietDo) : new THREE.Color(mau ?? 0xfff2dc));

// ---------------------------------------------------------------------------
// Sao: lõi rất sáng, quầng mềm, tia nhiễu xạ (như ảnh chụp qua kính thiên văn), lấp lánh rất nhẹ.
//   mau (hex) hoặc nhietDo (K); banKinh: bán kính lõi (đơn vị cảnh); doSang: 1 bình thường, 2–4 sao rất sáng;
//   tia: số tia nhiễu xạ (0, 4 hoặc 6); doDaiTia: chiều dài tia theo bán kính lõi.
// Trả về { nhom, capNhat(dt), datMau(hex), datDoSang(k), datBanKinh(r) }.
// ---------------------------------------------------------------------------
export function taoSao({ mau, nhietDo, banKinh = 0.05, doSang = 1, tia = 4, doDaiTia = 18, gocTia = 0.3, hat = 1 } = {}) {
  const nhom = new THREE.Group();
  const CO = Math.max(doDaiTia, 14);
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uCo: { value: banKinh * CO }, uLoi: { value: 1 / CO }, uMau: { value: layMau(mau, nhietDo) }, uSang: { value: doSang },
      uSoTia: { value: tia }, uDaiTia: { value: doDaiTia / CO }, uGoc: { value: gocTia }, uT: { value: 0 }, uHat: { value: hat },
    },
    vertexShader: GLSL_DINH_BANG,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uLoi, uSang, uSoTia, uDaiTia, uGoc, uT, uHat;
      varying vec2 vQ;
      void main() {
        float r = length(vQ);
        if (r > 1.0) discard;
        float x = r / uLoi;
        float loi = exp(-x * x * 1.6);
        float quang = 1.0 / (1.0 + x * x * 0.9);
        float xa = exp(-x * 0.6) * 0.12;
        float tia = 0.0;
        if (uSoTia > 0.5) {
          for (int i = 0; i < 3; i++) {
            if (float(i) >= uSoTia * 0.5) break;
            float a = uGoc + 3.14159265 * float(i) / (uSoTia * 0.5);
            vec2 d = vec2(cos(a), sin(a));
            float doc = abs(dot(vQ, d)), ngang = abs(vQ.x * d.y - vQ.y * d.x);
            float rong = uLoi * (0.09 + 0.12 * doc / uDaiTia);
            tia += exp(-ngang / rong) * exp(-doc / (uDaiTia * 0.32)) * smoothstep(uDaiTia, uDaiTia * 0.4, doc);
          }
        }
        float lap = 0.94 + 0.06 * sin(uT * 7.3 + uHat * 13.0) * sin(uT * 3.1 + uHat * 5.0);
        vec3 c = mix(uMau, vec3(1.0), loi * 0.75) * loi * 8.0 + uMau * (quang * 0.7 + xa + tia * 1.1 * lap);
        c *= uSang * smoothstep(1.0, 0.7, r);
        gl_FragColor = vec4(c, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  m.tuyenTinh = true;
  const bang = new THREE.Mesh(geoBang(), m);
  bang.frustumCulled = false;
  nhom.add(bang);
  return {
    nhom, bang,
    capNhat(dt = 0) { m.uniforms.uT.value += dt; },
    datMau(hex, K) { m.uniforms.uMau.value.copy(layMau(hex, K)); },
    datDoSang(k) { m.uniforms.uSang.value = k; },
    datBanKinh(r) { m.uniforms.uCo.value = r * CO; },
  };
}

// ---------------------------------------------------------------------------
// Lỗ đen nhỏ (HÌNH MINH HOẠ cho cảnh sơ đồ, không dựng bằng dò tia; Bài 15 có bản dò tia riêng):
// quả cầu đen tuyệt đối (bóng tối), vòng photon mảnh rực sáng sát mép, đĩa bồi tụ nóng mềm quanh xích đạo
// (quay vi sai, bên lao tới sáng hơn do hiệu ứng Doppler), và ảnh cong của mặt sau đĩa ôm quanh bóng tối.
//   banKinh: bán kính bóng tối (đơn vị cảnh); dia: có đĩa không; doSang: nhân độ sáng.
// Trả về { nhom, cau, dia, vong, capNhat(dt, camera), datDia(b), datDoSang(k) }.
// Đĩa nằm trong mặt phẳng xz của nhóm (trục quay là y).
// ---------------------------------------------------------------------------
export function taoLoDenNho({ banKinh = 0.2, dia = true, doSang = 1, trongDia = 1.6, ngoaiDia = 4.2 } = {}) {
  const nhom = new THREE.Group();
  const cau = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  cau.scale.setScalar(banKinh);
  nhom.add(cau);
  const uT = { value: 0 }, uSang = { value: doSang };

  const geoDia = new THREE.RingGeometry(trongDia * 0.92, ngoaiDia, 192, 8);
  geoDia.rotateX(-Math.PI / 2);
  const matDia = new THREE.ShaderMaterial({
    uniforms: { uT, uSang, uTrong: { value: trongDia }, uNgoai: { value: ngoaiDia } },
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vVo;
      void main() {
        vP = position;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vVo = transpose(mat3(modelMatrix)) * (cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uT, uSang, uTrong, uNgoai;
      varying vec3 vP; varying vec3 vVo;
      ${GLSL_NHIEU}
      void main() {
        float r = length(vP.xz);
        float x = (r - uTrong) / (uNgoai - uTrong);
        if (x < -0.05 || x > 1.0) discard;
        float phi = atan(vP.z, vP.x);
        // quay vi sai kiểu Kepler: trong nhanh, ngoài chậm
        float om = 0.6 * pow(r / uTrong, -1.5);
        float g = phi - uT * om;
        vec3 q = vec3(cos(g) * r, sin(g) * r, 0.0);
        float xoan = fbm(vec3(r * 3.0, g * 1.6 + r * 2.4, 1.3), 5, 0.0);
        float soi = nhieuG(vec3(r * 22.0, g * 0.8, 2.0));
        float mat = (0.55 + 0.6 * xoan + 0.18 * soi);
        // nhiệt độ giảm ra ngoài: trắng vàng → cam → đỏ
        float T = pow(max(r / uTrong, 1.0), -0.75);
        vec3 c = mix(vec3(0.9, 0.18, 0.04), vec3(1.0, 0.55, 0.18), smoothstep(0.25, 0.6, T));
        c = mix(c, vec3(1.0, 0.88, 0.7), smoothstep(0.6, 0.95, T));
        // Doppler: bên lao về phía người xem sáng hơn
        vec3 V = normalize(vVo);
        vec3 vt = vec3(-sin(phi), 0.0, cos(phi));
        float beta = 0.45 * pow(r / uTrong, -0.5);
        float D = 1.0 / (1.0 - beta * dot(vt, V));
        D = clamp(D * D * D, 0.25, 3.5);
        float bien = smoothstep(-0.05, 0.12, x) * (1.0 - smoothstep(0.55, 1.0, x));
        float I = T * T * 2.4 * mat * bien * D;
        gl_FragColor = vec4(c * I * uSang, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  matDia.tuyenTinh = true;
  const meshDia = new THREE.Mesh(geoDia, matDia);
  meshDia.scale.setScalar(banKinh);
  meshDia.visible = dia;
  nhom.add(meshDia);

  // Vòng photon và ảnh cong của đĩa: bảng quay mặt về máy quay.
  const CO = 3.2;
  const matVong = new THREE.ShaderMaterial({
    uniforms: { uCo: { value: banKinh * CO }, uR: { value: 1 / CO }, uT, uSang, uDia: { value: dia ? 1 : 0 }, uTruc: { value: new THREE.Vector2(0, 1) }, uNghieng: { value: 1 }, uLech: { value: new THREE.Vector2(1, 0) } },
    vertexShader: GLSL_DINH_BANG,
    fragmentShader: /* glsl */ `
      uniform float uR, uT, uSang, uDia, uNghieng;
      uniform vec2 uTruc, uLech;
      varying vec2 vQ;
      ${GLSL_NHIEU}
      void main() {
        float r = length(vQ);
        if (r > 1.0) discard;
        vec2 h = vQ / max(r, 1e-5);
        float x = r / uR;
        // vòng photon: mảnh, rất sáng, hơi lệch sáng về phía đĩa lao tới
        float lech = 0.75 + 0.45 * dot(h, uLech) * uDia;
        float v1 = (x - 1.035) / 0.018, v2 = (x - 1.06) / 0.06;
        float vong = exp(-v1 * v1) * 5.0 + exp(-v2 * v2) * 0.9;
        // ảnh cong của mặt sau đĩa: dải ôm quanh bóng tối, đậm ở phía trên/dưới khi nhìn nghiêng sát mặt đĩa
        float doc = abs(dot(h, uTruc));
        float anh = exp(-pow((x - 1.18 - 0.12 * doc) / (0.08 + 0.06 * uNghieng), 2.0));
        anh *= (0.25 + 0.75 * doc * uNghieng) * uDia * 1.4;
        float soi = 0.75 + 0.25 * fbm(vec3(h * 4.0, uT * 0.1), 3, 0.0);
        vec3 c = vec3(1.0, 0.82, 0.6) * vong * lech + vec3(1.0, 0.6, 0.28) * anh * soi * lech;
        c += vec3(1.0, 0.55, 0.25) * 0.05 * exp(-(x - 1.0) * 4.0) * step(1.0, x);
        c *= smoothstep(1.0, 0.8, r) * step(0.985, x) * uSang;
        gl_FragColor = vec4(c, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  matVong.tuyenTinh = true;
  const vong = new THREE.Mesh(geoBang(), matVong);
  vong.frustumCulled = false;
  vong.renderOrder = 2;
  nhom.add(vong);

  const tam = new THREE.Vector3(), truc = new THREE.Vector3(), toiMay = new THREE.Vector3(), tmp = new THREE.Vector3();
  const q = new THREE.Quaternion();
  return {
    nhom, cau, dia: meshDia, vong,
    capNhat(dt = 0, camera = null) {
      uT.value += dt;
      if (!camera) return;
      // hướng trục đĩa và phía đĩa lao tới, chiếu lên màn hình
      nhom.updateMatrixWorld();
      nhom.getWorldPosition(tam);
      nhom.getWorldQuaternion(q);
      truc.set(0, 1, 0).applyQuaternion(q);
      toiMay.copy(camera.position).sub(tam).normalize();
      matVong.uniforms.uNghieng.value = 1 - Math.abs(truc.dot(toiMay));
      camera.updateMatrixWorld();
      const qv = camera.quaternion.clone().invert();
      tmp.copy(truc).applyQuaternion(qv);
      const l = Math.hypot(tmp.x, tmp.y);
      if (l > 1e-3) matVong.uniforms.uTruc.value.set(tmp.x / l, tmp.y / l);
      // vận tốc đĩa quay quanh +y: phía lao tới là trục × hướng tới máy quay
      tmp.copy(truc).cross(toiMay).applyQuaternion(qv);
      const l2 = Math.hypot(tmp.x, tmp.y);
      if (l2 > 1e-3) matVong.uniforms.uLech.value.set(tmp.x / l2, tmp.y / l2);
    },
    datDia(b) { meshDia.visible = b; matVong.uniforms.uDia.value = b ? 1 : 0; },
    datDoSang(k) { uSang.value = k; },
  };
}

// ---------------------------------------------------------------------------
// Thiên hà xoắn nhỏ (hình minh hoạ cho cảnh vũ trụ học): lõi vàng sáng, các nhánh xoắn lô-ga xanh trắng,
// đốm hồng của vùng sinh sao, quầng sao mờ. Các hạt vẽ bằng điểm, kích thước theo khoảng cách.
//   banKinh: bán kính đĩa; soSao: số hạt; soNhanh: số nhánh xoắn; hat: hạt giống ngẫu nhiên;
//   kieu: 'xoan' (xoắn) hoặc 'elip' (thiên hà elip, không có nhánh); doSang.
// Trả về { nhom, capNhat(dt), datDoSang(k) }. Đĩa nằm trong mặt phẳng xz của nhóm.
// ---------------------------------------------------------------------------
export function taoThienHaNho({ banKinh = 1, soSao = 16000, soNhanh = 2, hat = 3, kieu = 'xoan', doSang = 1, tocDoQuay = 0.03 } = {}) {
  const rnd = taoNgauNhien(hat);
  const pos = new Float32Array(soSao * 3), mau = new Float32Array(soSao * 3), co = new Float32Array(soSao);
  const doc = 0.36;   // độ dốc nhánh (tan góc xoắn)
  for (let i = 0; i < soSao; i++) {
    const k = rnd();
    let x, y, z, c, s;
    if (kieu === 'elip' || k < 0.22) {
      // phình giữa (hoặc cả thiên hà elip): phân bố gần kiểu de Vaucouleurs
      const r = banKinh * (kieu === 'elip' ? 0.9 : 0.28) * Math.pow(rnd(), 2.2) * 1.4;
      const th = Math.acos(2 * rnd() - 1), ph = rnd() * Math.PI * 2;
      x = r * Math.sin(th) * Math.cos(ph); y = r * Math.cos(th) * (kieu === 'elip' ? 0.7 : 0.55); z = r * Math.sin(th) * Math.sin(ph);
      c = [1.0, 0.78 + 0.1 * rnd(), 0.52 + 0.1 * rnd()]; s = 0.8 + rnd();
    } else if (k < 0.3) {
      // quầng sao mờ
      const r = banKinh * (0.2 + 1.1 * rnd());
      const th = Math.acos(2 * rnd() - 1), ph = rnd() * Math.PI * 2;
      x = r * Math.sin(th) * Math.cos(ph); y = r * Math.cos(th) * 0.35; z = r * Math.sin(th) * Math.sin(ph);
      c = [0.75, 0.72, 0.68]; s = 0.4;
    } else {
      // đĩa và nhánh xoắn: r phân bố mũ, góc theo đường xoắn lô-ga cộng tán ngẫu nhiên
      const r = banKinh * Math.min(1.05, 0.08 + (-Math.log(1 - rnd() * 0.97)) * 0.3);
      const nhanh = Math.floor(rnd() * soNhanh);
      const tan = (rnd() - 0.5 + (rnd() - 0.5)) * (0.35 + 0.25 * (1 - r / banKinh));
      const goc = (nhanh * Math.PI * 2) / soNhanh + Math.log(r / banKinh + 0.05) / doc + tan;
      x = r * Math.cos(goc); z = r * Math.sin(goc); y = (rnd() - 0.5 + (rnd() - 0.5)) * 0.035 * banKinh;
      const gan = Math.abs(tan) < 0.12;
      const vungSinh = gan && rnd() < 0.09;
      c = vungSinh ? [1.0, 0.36, 0.55] : gan ? [0.62, 0.74, 1.0] : [0.85, 0.82, 0.8];
      s = vungSinh ? 2.2 : gan ? 1.2 : 0.7;
    }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    mau[i * 3] = c[0]; mau[i * 3 + 1] = c[1]; mau[i * 3 + 2] = c[2];
    co[i] = s * (0.6 + 0.8 * rnd());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aMau', new THREE.BufferAttribute(mau, 3));
  geo.setAttribute('aCo', new THREE.BufferAttribute(co, 1));
  const uSang = { value: doSang };
  const m = new THREE.ShaderMaterial({
    uniforms: { uSang, uCoGoc: { value: banKinh * 0.012 }, uTiLe: { value: 1 }, uCaoMH: { value: 800 } },
    vertexShader: /* glsl */ `
      attribute vec3 aMau; attribute float aCo;
      uniform float uCoGoc, uTiLe, uCaoMH;
      varying vec3 vMau; varying float vMo;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float px = aCo * uCoGoc * projectionMatrix[1][1] * uCaoMH * 0.5 / max(-mv.z, 1e-4);
        vMo = clamp(px, 0.0, 1.0);           // điểm nhỏ hơn 1 điểm ảnh: giữ cỡ 1, mờ bớt cho đúng tổng sáng
        gl_PointSize = max(px, 1.0) * uTiLe * 2.0;
        vMau = aMau;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uSang;
      varying vec3 vMau; varying float vMo;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float k = exp(-d * d * 4.0);
        gl_FragColor = vec4(vMau * k * vMo * uSang * 0.16, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  m.tuyenTinh = true;
  const diem = new THREE.Points(geo, m);
  diem.frustumCulled = false;
  diem.onBeforeRender = (renderer) => {
    m.uniforms.uTiLe.value = renderer.getPixelRatio();
    const s = renderer.getSize(_kt);
    m.uniforms.uCaoMH.value = s.y;
  };
  const nhom = new THREE.Group();
  nhom.add(diem);
  // lõi sáng
  const loi = taoSao({ mau: kieu === 'elip' ? 0xffd9a8 : 0xffe2b0, banKinh: banKinh * 0.04, doSang: 0.22 * doSang, tia: 0, doDaiTia: 14 });
  nhom.add(loi.nhom);
  return {
    nhom, diem,
    capNhat(dt = 0) { diem.rotation.y -= tocDoQuay * dt; },
    datDoSang(k) { uSang.value = k; loi.datDoSang(0.22 * k); },
  };
}
const _kt = new THREE.Vector2();

// ---------------------------------------------------------------------------
// Sao chổi (hình minh hoạ): nhân nhỏ, đầu (coma) sáng xanh lục nhạt, đuôi ion xanh thẳng hướng ngược Mặt Trời,
// đuôi bụi vàng trắng rộng và cong về phía sau đường bay. Hạt chạy dọc đuôi theo thời gian.
//   banKinh: cỡ đầu; dai: chiều dài đuôi; hat. datHuongSang(v): hướng TỚI Mặt Trời (hệ thế giới);
//   datHuongBay(v): hướng bay. Nhóm không được xoay (hướng tính trong hệ thế giới).
// Trả về { nhom, capNhat(dt), datHuongSang(v), datHuongBay(v), datDoSang(k) }.
// ---------------------------------------------------------------------------
export function taoSaoChoi({ banKinh = 0.05, dai = 2, hat = 9, doSang = 1 } = {}) {
  const rnd = taoNgauNhien(hat);
  const N = 5000;
  const a = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    a[i * 4] = rnd();                                  // pha dọc đuôi
    a[i * 4 + 1] = rnd() < 0.4 ? 0 : 1;                // 0 = đuôi ion, 1 = đuôi bụi
    a[i * 4 + 2] = rnd() * Math.PI * 2;                // góc ngang
    a[i * 4 + 3] = Math.sqrt(rnd());                   // bán kính ngang
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('aQ', new THREE.BufferAttribute(a, 4));
  const uT = { value: 0 }, uSang = { value: doSang };
  const uDuoi = { value: new THREE.Vector3(-1, 0, 0) }, uBay = { value: new THREE.Vector3(0, 0, 1) };
  const m = new THREE.ShaderMaterial({
    uniforms: { uT, uSang, uDuoi, uBay, uDai: { value: dai }, uR: { value: banKinh }, uTiLe: { value: 1 }, uCaoMH: { value: 800 } },
    vertexShader: /* glsl */ `
      attribute vec4 aQ;
      uniform float uT, uDai, uR, uTiLe, uCaoMH;
      uniform vec3 uDuoi, uBay;
      varying vec3 vMau; varying float vSang;
      void main() {
        float bui = aQ.y;
        float s = fract(aQ.x + uT * (bui > 0.5 ? 0.05 : 0.12));
        vec3 d = normalize(uDuoi);
        vec3 b = normalize(uBay - d * dot(uBay, d) + vec3(1e-4));
        vec3 c = cross(d, b);
        float L = uDai * (bui > 0.5 ? 0.8 : 1.0);
        vec3 p = d * s * L;
        // đuôi bụi cong lùi về sau đường bay, nở rộng; đuôi ion hẹp, thẳng
        p -= b * (bui > 0.5 ? s * s * L * 0.35 : 0.0);
        float rong = uR * (bui > 0.5 ? (0.6 + s * 7.0) : (0.3 + s * 2.2));
        p += (b * cos(aQ.z) + c * sin(aQ.z)) * aQ.w * rong;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float px = rong * 0.9 * projectionMatrix[1][1] * uCaoMH * 0.5 / max(-mv.z, 1e-4);
        gl_PointSize = clamp(px, 1.5, 64.0) * uTiLe;
        vMau = bui > 0.5 ? vec3(1.0, 0.86, 0.62) : vec3(0.45, 0.7, 1.0);
        vSang = (1.0 - s) * (1.0 - s) * smoothstep(0.0, 0.03, s) * (bui > 0.5 ? 0.16 : 0.14) / max(px * px * 0.015, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uSang;
      varying vec3 vMau; varying float vSang;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        gl_FragColor = vec4(vMau * exp(-d * d * 3.0) * vSang * uSang, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  m.tuyenTinh = true;
  const duoi = new THREE.Points(geo, m);
  duoi.frustumCulled = false;
  duoi.onBeforeRender = (renderer) => { m.uniforms.uTiLe.value = renderer.getPixelRatio(); m.uniforms.uCaoMH.value = renderer.getSize(_kt).y; };
  const nhom = new THREE.Group();
  nhom.add(duoi);
  const dau = taoSao({ mau: 0xc8ffe6, banKinh: banKinh * 0.22, doSang: 0.55 * doSang, tia: 0, doDaiTia: 16 });
  nhom.add(dau.nhom);
  const nhan = new THREE.Mesh(new THREE.IcosahedronGeometry(banKinh * 0.08, 2), new THREE.MeshBasicMaterial({ color: 0x3a3430 }));
  nhom.add(nhan);
  return {
    nhom, duoi,
    capNhat(dt = 0) { uT.value += dt; dau.capNhat(dt); },
    datHuongSang(v) { uDuoi.value.set(-(v.x ?? v[0]), -(v.y ?? v[1]), -(v.z ?? v[2])).normalize(); },
    datHuongBay(v) { uBay.value.set(v.x ?? v[0], v.y ?? v[1], v.z ?? v[2]).normalize(); },
    datDoSang(k) { uSang.value = k; dau.datDoSang(0.55 * k); },
  };
}
