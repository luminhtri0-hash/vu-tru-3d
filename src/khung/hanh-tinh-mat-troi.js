// Mặt Trời: bề mặt hạt sôi chuyển động (ô đối lưu Voronoi), mạng siêu hạt, tối dần và ngả đỏ về rìa, vết đen
// có vùng nửa tối dạng sợi, vệt sáng (faculae) gần rìa; sắc cầu đỏ hồng mảnh ở rìa có vài tai lửa; nhật hoa mềm
// có tia toả không đều, đổi chậm theo thời gian. Độ sáng dải rộng: lõi khoảng 2–3 (quầng sáng của bộ dựng hình
// làm nó rực lên) nhưng giữ màu vàng cam, không cháy thành đĩa trắng.
// Hạt sôi phóng to rất nhiều so với thật (ô thật ~1 000 km, tức 1/700 bán kính) để nhìn thấy được.

import * as THREE from 'three';
import { taoNgauNhien } from './ve.js';
import { GLSL_NHIEU } from './hanh-tinh-glsl.js';

// Bảng quảng cáo luôn quay mặt về máy quay (dựng trong hệ nhìn), nửa cạnh uCo (đơn vị cảnh, nhân theo tỉ lệ nhóm).
export const GLSL_DINH_BANG = /* glsl */ `
  uniform float uCo;
  varying vec2 vQ;
  void main() {
    vQ = position.xy;
    float s = length(modelMatrix[0].xyz);
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * uCo * s;
    gl_Position = projectionMatrix * mv;
  }
`;
let _geoBang = null;
export function geoBang() {
  if (!_geoBang) _geoBang = new THREE.PlaneGeometry(2, 2);
  return _geoBang;
}

export function taoMatTroi({ banKinh = 1, hat = 5 } = {}) {
  const nhom = new THREE.Group();
  // vết đen: từng cặp ở vĩ độ 8–28°, hai bán cầu
  const rnd = taoNgauNhien(hat);
  const vet = [];
  for (let i = 0; i < 3; i++) {
    const lat = (8 + 20 * rnd()) * (i % 2 ? -1 : 1) * (Math.PI / 180);
    const lon = rnd() * Math.PI * 2;
    const r = 0.022 + 0.03 * rnd();
    const huong = (la, lo) => new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo));
    const a = huong(lat, lon);
    vet.push(new THREE.Vector4(a.x, a.y, a.z, r));
    const b = huong(lat + 0.02 * (rnd() - 0.5), lon - 0.09 - 0.05 * rnd());
    vet.push(new THREE.Vector4(b.x, b.y, b.z, r * (0.45 + 0.3 * rnd())));
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uSang: { value: 1.3 }, uVet: { value: vet } },
    vertexShader: /* glsl */ `
      varying vec3 vP; varying vec3 vNw; varying vec3 vVw;
      void main() {
        vP = position;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vNw = normalize(mat3(modelMatrix) * normal);
        vVw = cameraPosition - w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uT, uSang; uniform vec4 uVet[6];
      varying vec3 vP; varying vec3 vNw; varying vec3 vVw;
      ${GLSL_NHIEU}
      void main() {
        vec3 n = normalize(vP);
        float w = max(length(fwidth(vP)), 1e-6);
        float mu = clamp(dot(normalize(vNw), normalize(vVw)), 0.0, 1.0);
        // hạt sôi (ô đối lưu): lòng ô nóng sáng, rãnh giữa các ô nguội tối
        float moHat = 1.0 - smoothstep(0.1, 0.4, w * 48.0);
        float hat = 0.5;
        if (moHat > 0.0) {
          vec3 m = n * 48.0 + 0.55 * vec3(nhieuG(n * 90.0), nhieuG(n * 90.0 + 7.0), nhieuG(n * 90.0 + 13.0));
          vec2 F = oVoronoi(m, uT * 0.3);
          float o = 1.0 - smoothstep(0.0, 0.9, F.x);            // lòng ô sáng tròn mềm
          float ranh = smoothstep(0.0, 0.16, F.y - F.x);        // rãnh tối mềm giữa các ô
          hat = mix(0.5, 0.25 + 0.75 * o * ranh, moHat);
        }
        float moNho = 1.0 - smoothstep(0.1, 0.4, w * 140.0);
        float hatNho = moNho > 0.0 ? nhieuG(n * 140.0 + vec3(uT * 0.08)) * moNho : 0.0;
        // mạng siêu hạt và vùng nóng lớn, trôi chậm
        vec2 S = oVoronoi(n * 8.0, uT * 0.025);
        float luoi = 1.0 - smoothstep(0.0, 0.14, S.y - S.x);
        float lon = fbm(n * 2.2 + vec3(0.0, uT * 0.004, uT * 0.003), 4, w * 2.2);
        float T = 0.62 + 0.14 * lon + 0.42 * (hat - 0.5) + 0.06 * hatNho + 0.025 * luoi;
        // vết đen: lõi tối (umbra) và vùng nửa tối có sợi toả ra (penumbra)
        float loi = 0.0, nua = 0.0, faculae = 0.0;
        for (int i = 0; i < 6; i++) {
          vec4 v = uVet[i];
          float c = dot(n, v.xyz);
          if (c < 0.9) continue;
          float d = acos(clamp(c, -1.0, 1.0)) / v.w;
          faculae += exp(-(((d - 1.4) / 0.9) * ((d - 1.4) / 0.9)));
          if (d > 1.15) continue;
          vec3 tt = normalize(n - v.xyz * c + 1e-6);
          float soi = 0.5 + 0.5 * nhieuG(tt * 26.0 + float(i) * 3.7);
          float u = 1.0 - smoothstep(0.36, 0.46, d + 0.05 * soi);
          float pu = (1.0 - smoothstep(0.85, 1.05, d + 0.08 * soi)) * (1.0 - u);
          loi = max(loi, u);
          nua = max(nua, pu * (0.55 + 0.45 * soi));
        }
        T += 0.04 * min(faculae, 1.5);
        T = mix(T, 0.34, nua * 0.8);
        T = mix(T, 0.10, loi);
        // nhiệt độ → màu (thân nhiệt: đỏ sẫm → cam → vàng nhạt)
        vec3 c = mix(vec3(0.45, 0.08, 0.01), vec3(1.0, 0.34, 0.04), smoothstep(0.08, 0.48, T));
        c = mix(c, vec3(1.0, 0.56, 0.14), smoothstep(0.42, 0.68, T));
        c = mix(c, vec3(1.0, 0.76, 0.40), smoothstep(0.66, 0.95, T));
        // tối dần về rìa (gần đúng theo số đo, hệ số u ≈ 0,6) và ngả đỏ
        float I = 1.0 - 0.52 * (1.0 - mu) - 0.24 * (1.0 - mu * mu);
        c *= I * mix(vec3(1.0, 0.58, 0.32), vec3(1.0), pow(mu, 0.3));
        // vệt sáng faculae nổi rõ gần rìa
        c += vec3(1.0, 0.72, 0.4) * (luoi * 0.3 + 0.5 * min(faculae, 1.0)) * pow(max(1.0 - mu, 0.0), 2.0) * smoothstep(0.0, 0.25, mu) * 0.4;
        gl_FragColor = vec4(c * uSang, 1.0);
      }`,
  });
  mat.tuyenTinh = true;
  const cau = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
  nhom.add(cau);

  // Nhật hoa, sắc cầu, tai lửa: một bảng quay mặt về máy quay.
  // uR: bán kính đĩa, uK: bán kính «gốc» của nhật hoa (lớn hơn uR khi lùi xa để quầng còn thấy), cùng đơn vị toạ độ bảng.
  const matHoa = new THREE.ShaderMaterial({
    uniforms: { uCo: { value: 9 }, uR: { value: 1 / 9 }, uK: { value: 1 / 9 }, uT: { value: 0 }, uSang: { value: 1 } },
    vertexShader: GLSL_DINH_BANG,
    fragmentShader: /* glsl */ `
      uniform float uR, uK, uT, uSang;
      varying vec2 vQ;
      ${GLSL_NHIEU}
      void main() {
        float r = length(vQ);
        if (r > 1.0) discard;
        vec2 h = vQ / max(r, 1e-5);
        float rr = r / uK;
        float t = uT;
        // dòng nhật hoa lớn (streamers) đổi chậm, và các tia mảnh
        float s1 = 0.5 + 0.5 * fbm(vec3(h * 1.6, t * 0.012), 4, 0.0);
        float s2 = nhieuG(vec3(h * 9.0, log(max(rr, 1.0)) * 0.6 - t * 0.02));
        float s3 = nhieuG(vec3(h * 30.0, log(max(rr, 1.0)) * 0.8 - t * 0.03 + 4.0));
        float keo = pow(s1, 2.5) * 1.8 + 0.2;
        float hoa = pow(max(rr, 1.0), -3.2 + 1.2 * (s1 - 0.5)) * keo * (0.75 + 0.25 * s2 + 0.08 * s3) * 0.22;
        hoa += 0.22 * exp(-(rr - 1.0) * 9.0) + 0.025 * exp(-(rr - 1.0) * 1.2);
        hoa *= smoothstep(1.0, 0.45, r);
        vec3 c = mix(vec3(1.0, 0.66, 0.36), vec3(1.0, 0.9, 0.78), smoothstep(1.0, 1.8, rr)) * hoa;
        // sắc cầu và tai lửa: chỉ rõ khi đĩa đủ lớn (uR gần uK)
        float ro = smoothstep(0.5, 0.9, uR / uK);
        float dR = (r - uR) / uR;
        // Chỉ tính ở dải sát rìa đĩa (dR từ -0,004 tới 0,1): ngoài dải này sắc cầu và tai lửa đều bằng 0 đúng,
        // nên bỏ qua được 6 lượt nhiễu cho gần hết các điểm ảnh của bảng nhật hoa (bảng phủ cả màn hình khi nhìn gần).
        if (ro > 0.0 && dR > -0.004 && dR < 0.1) {
          float sac = exp(-pow(dR / 0.012, 2.0)) * step(-0.004, dR);
          float tai = smoothstep(0.55, 0.85, 0.5 + 0.5 * fbm(vec3(h * 4.0, t * 0.01 + 2.0), 4, 0.0));
          float caoTai = 0.035 + 0.06 * (0.5 + 0.5 * nhieuG(vec3(h * 9.0, t * 0.02)));
          float taiLua = tai * smoothstep(caoTai, 0.0, dR) * step(0.0, dR) * (0.6 + 0.4 * nhieuG(vec3(h * 40.0, dR * 30.0 - t * 0.05)));
          c += vec3(1.0, 0.22, 0.2) * (sac * 2.4 + taiLua * 1.8) * ro;
        }
        gl_FragColor = vec4(c * uSang, 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  matHoa.tuyenTinh = true;
  const hoa = new THREE.Mesh(geoBang(), matHoa);
  hoa.frustumCulled = false;
  hoa.renderOrder = 1;
  nhom.add(hoa);

  const CO = 9;  // nửa cạnh bảng nhật hoa, tính theo bán kính gốc của quầng
  const vt = {
    nhom, cau, nhatHoa: hoa, banKinh,
    // t: thời gian tích luỹ (giây). r: bán kính quả cầu (đơn vị cảnh). rQuang: bán kính tối thiểu của quầng
    // (để còn thấy khi lùi xa). Cách gọi giữ nguyên từ Bản 2.
    capNhat(t, r = vt.banKinh, rQuang = r) {
      mat.uniforms.uT.value = t;
      matHoa.uniforms.uT.value = t;
      cau.scale.setScalar(r);
      const k = Math.max(r, rQuang);
      const co = CO * k;
      matHoa.uniforms.uCo.value = co;
      matHoa.uniforms.uR.value = r / co;
      matHoa.uniforms.uK.value = k / co;
    },
    doSang: 1,
    // nhân độ sáng nhật hoa (giữ cách gọi Bản 2)
    datDoSang(k) { vt.doSang = k; matHoa.uniforms.uSang.value = k; },
    // nhân độ sáng bề mặt (mặc định 2,5)
    datSangBeMat(k) { mat.uniforms.uSang.value = k; },
  };
  vt.capNhat(0);
  return vt;
}
