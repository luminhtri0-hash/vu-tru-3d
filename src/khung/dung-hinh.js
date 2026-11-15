// Bộ dựng hình của Bản 3: vẽ cảnh vào bộ đệm dải sáng rộng (HDR, số thực 16 bit, khử răng cưa 4 mẫu),
// thêm quầng phát sáng quanh thứ sáng (bloom), nén vùng sáng cho khỏi cháy trắng, làm tối nhẹ bốn góc,
// thêm hạt phim rất nhẹ để các dải màu tối không bị bậc thang, rồi mới đưa lên màn hình.
//
// Quy ước màu từ Bản 3:
//   - Trong cảnh, màu là màu TUYẾN TÍNH. Vật phát sáng được phép có độ sáng lớn hơn 1 (ví dụ nhân màu với 2–6):
//     càng lớn hơn 1 thì quầng sáng càng rộng. Vật không phát sáng nên giữ dưới khoảng 0,6.
//   - Vật liệu có sẵn của three.js (MeshBasicMaterial, LineMaterial, SpriteMaterial, MeshStandardMaterial…)
//     tự theo quy ước này.
//   - ShaderMaterial tự viết: nếu đặt material.tuyenTinh = true thì bộ dựng hình hiểu là shader đã xuất màu
//     tuyến tính (kiểu mới). Nếu không đặt (shader viết từ Bản 2, xuất thẳng màu màn hình) thì bộ dựng hình
//     tự chèn một dòng đổi màu màn hình → tuyến tính vào cuối shader, để hình trông như cũ.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Cấu hình mặc định; mỗi bài có thể ghi đè bằng trường `hinh` (xem «Hướng dẫn viết bài giảng.md»).
export const HINH_MAC_DINH = {
  quang: 0.5,         // độ mạnh của quầng sáng
  banKinh: 0.55,      // quầng lan rộng tới đâu (0–1)
  nguong: 0.8,        // sáng hơn mức này (tuyến tính) mới có quầng
  phoiSang: 1.0,      // nhân độ sáng cả cảnh trước khi nén
  vien: 0.34,         // tối bốn góc (0 = tắt)
  hat: 0.022,         // hạt phim (0 = tắt)
  nen: 0x010206,      // màu nền của khoảng không (gần đen, hơi xanh)
};

const SHADER_CUOI = {
  uniforms: {
    tDiffuse: { value: null },
    uPhoiSang: { value: 1 }, uVien: { value: 0.3 }, uHat: { value: 0.02 }, uGio: { value: 0 }, uTiLeKhung: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uPhoiSang, uVien, uHat, uGio, uTiLeKhung;
    varying vec2 vUv;
    // Nén vùng sáng: dưới 0,76 giữ nguyên màu; trên đó ép dần về 1 và ngả dần sang trắng (như phim, mắt người).
    vec3 nenSang(vec3 c) {
      const float dau = 0.76;
      float dinh = max(c.r, max(c.g, c.b));
      if (dinh < dau) return c;
      float d = 1.0 - dau;
      float moi = 1.0 - d * d / (dinh + d - dau);
      c *= moi / dinh;
      float g = 1.0 - 1.0 / (0.16 * (dinh - moi) + 1.0);
      return mix(c, vec3(moi), g);
    }
    vec3 raManHinh(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
    float bam(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      if (!(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b)) c = vec3(0.0);   // điểm ảnh hỏng thì cho đen, không để lan
      c = clamp(c, vec3(0.0), vec3(64.0)) * uPhoiSang;
      vec2 q = (vUv - 0.5) * vec2(min(uTiLeKhung, 1.6), 1.0);
      c *= 1.0 - uVien * smoothstep(0.42, 1.08, length(q) * 1.38);
      c = raManHinh(nenSang(c));
      float sang = dot(c, vec3(0.299, 0.587, 0.114));
      float n = bam(gl_FragCoord.xy + fract(uGio * 7.13) * 91.7) + bam(gl_FragCoord.yx + fract(uGio * 3.71) * 53.3) - 1.0;
      c += n * (uHat * (0.25 + 0.75 * (1.0 - sang)) * smoothstep(0.0, 0.06, sang + 0.02) + 0.6 / 255.0);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

// Dòng chèn vào cuối shader kiểu cũ: đổi màu màn hình (sRGB) sang tuyến tính.
const DONG_DOI = '\n  gl_FragColor.rgb = pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2));\n}';
let dangVeCanh = false;
let daVa = false;
function vaShaderCu() {
  if (daVa) return;
  daVa = true;
  const goc = THREE.ShaderMaterial.prototype.onBeforeCompile;
  THREE.ShaderMaterial.prototype.onBeforeCompile = function (shader, renderer) {
    goc?.call(this, shader, renderer);
    if (!dangVeCanh || this.tuyenTinh || this.isLineMaterial || this.isRawShaderMaterial) return;
    const f = shader.fragmentShader;
    const k = f.lastIndexOf('}');
    if (k < 0 || /colorspace_fragment|linearToOutputTexel/.test(f)) return;
    shader.fragmentShader = f.slice(0, k) + DONG_DOI + f.slice(k + 1);
  };
  const khoaGoc = THREE.ShaderMaterial.prototype.customProgramCacheKey;
  THREE.ShaderMaterial.prototype.customProgramCacheKey = function () {
    return `${khoaGoc.call(this)}|${this.tuyenTinh ? 'tt' : 'cu'}|${dangVeCanh ? 'canh' : 'hau'}`;
  };
}

export class DungHinh {
  constructor(renderer) {
    vaShaderCu();
    this.renderer = renderer;
    // Số mẫu khử răng cưa (0, 2 hoặc 4) và tỉ lệ độ nét của quầng sáng: mặc định bên dưới, đổi được khi đo thử qua window.__VT_THU.
    const thu = (typeof window !== 'undefined' && window.__VT_THU) || {};
    // Đo trên app thật (Apple GPU, 2880 × 1800): khử răng cưa 4 mẫu tốn thêm khoảng 12 mili giây mỗi khung hình ở độ nét 2,
    // trong khi ở độ nét ấy mắt gần như không thấy răng cưa. Nên: độ nét từ 1,5 trở lên thì không lấy mẫu thêm,
    // dưới 1,5 (máy đang phải hạ độ nét) thì lấy 4 mẫu cho nét khỏi gãy.
    this.mauEp = thu.mau ?? null;
    this.mauToiDa = Math.min(renderer.capabilities.maxSamples || 0, 4);
    this.soMau = this.mauEp ?? 0;
    this.tiLeQuang = thu.quang ?? 1;
    const dich = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: this.soMau, depthBuffer: true });
    this.composer = new EffectComposer(renderer, dich);
    this.quaCanh = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.quaQuang = new UnrealBloomPass(new THREE.Vector2(4, 4), HINH_MAC_DINH.quang, HINH_MAC_DINH.banKinh, HINH_MAC_DINH.nguong);
    // Chặn điểm ảnh hỏng (NaN, vô cực do một shader nào đó chia cho 0 hay lấy luỹ thừa số âm) ngay ở bước lọc vùng sáng:
    // nếu không, bước làm nhoè của quầng sáng sẽ rải chỗ hỏng ra cả khung hình và màn hình thành đen.
    const loc = this.quaQuang.materialHighPassFilter;
    const dongDoc = 'vec4 texel = texture2D( tDiffuse, vUv );';
    if (loc?.fragmentShader?.includes(dongDoc)) {
      loc.fragmentShader = loc.fragmentShader.replace(dongDoc, `${dongDoc}
        if ( ! ( texel.r == texel.r ) || ! ( texel.g == texel.g ) || ! ( texel.b == texel.b ) ) texel = vec4( 0.0 );
        texel.rgb = clamp( texel.rgb, vec3( 0.0 ), vec3( 48.0 ) );`);
      loc.needsUpdate = true;
      this.chanDiemHong = true;
    } else {
      this.chanDiemHong = false;
      console.warn('DungHinh: không chèn được bước chặn điểm ảnh hỏng vào bộ lọc vùng sáng (three.js đã đổi mã?).');
    }
    this.quaCuoi = new ShaderPass(SHADER_CUOI);
    this.quaCuoi.material.tuyenTinh = true;
    this.composer.addPass(this.quaCanh);
    this.composer.addPass(this.quaQuang);
    this.composer.addPass(this.quaCuoi);
    this.cauHinh = { ...HINH_MAC_DINH };
    this.gio = 0;
    this.rong = 4; this.cao = 4; this.tiLe = 1;
    // Vẽ cảnh: bật cờ để phần vá shader cũ chỉ áp dụng cho vật liệu của cảnh, không đụng tới các bước hậu kỳ.
    // Tự xoá bộ đệm bằng màu nền SAU khi đã chọn bộ đệm đích: three.js đổi màu nền sang đúng hệ màu của đích
    // lúc gọi setClearColor, nên gọi trước khi chọn đích thì nền bị sáng lên (xanh xám thay vì gần đen).
    this.mauNen = new THREE.Color(0x010206);
    this.quaCanh.clear = false;
    const veGoc = this.quaCanh.render.bind(this.quaCanh);
    this.quaCanh.render = (renderer, boGhi, boDoc, ...ts) => {
      renderer.setRenderTarget(boDoc);
      renderer.setClearColor(this.mauNen, 1);
      renderer.clear(true, true, true);
      dangVeCanh = true;
      try { veGoc(renderer, boGhi, boDoc, ...ts); } finally { dangVeCanh = false; }
    };
  }

  // Cấu hình hình ảnh của một bài (phần ghi đè lên mặc định). Gọi mỗi lần mở bài.
  datCauHinh(ch = {}) {
    this.cauHinh = { ...HINH_MAC_DINH, ...ch };
    const c = this.cauHinh;
    this.mauNen.set(c.nen);
    this.quaQuang.enabled = c.quang > 0.001;
    this.quaQuang.strength = c.quang;
    this.quaQuang.radius = c.banKinh;
    this.quaQuang.threshold = c.nguong;
    const u = this.quaCuoi.uniforms;
    u.uPhoiSang.value = c.phoiSang; u.uVien.value = c.vien; u.uHat.value = c.hat;
  }

  // khuRangCua: có lấy 4 mẫu khử răng cưa không. Do app quyết (xem UngDung._coKhuRangCua), KHÔNG còn tự suy từ độ nét:
  // trước Bản 3.2 hễ độ nét tụt dưới 1,5 là tự bật 4 mẫu, nên lúc máy chậm phải hạ độ nét thì lại nặng thêm (đo trên máy
  // thật: 1,25 có 4 mẫu chạy 53–55 khung hình mỗi giây, 1,5 không lấy mẫu chạy 59,6) và mọi vật phải biên dịch lại.
  datKichThuoc(rong, cao, tiLe, khuRangCua = false) {
    this.rong = rong; this.cao = cao; this.tiLe = tiLe;
    const mau = this.mauEp ?? (khuRangCua ? this.mauToiDa : 0);
    if (mau !== this.soMau) {
      this.soMau = mau;
      for (const d of [this.composer.renderTarget1, this.composer.renderTarget2]) { d.samples = mau; d.dispose(); }
    }
    this.composer.setPixelRatio(tiLe);
    this.composer.setSize(rong, cao);
    // Quầng sáng là chi tiết mềm: dựng ở độ nét thấp hơn cảnh thì nhẹ hơn nhiều mà gần như không khác.
    if (this.tiLeQuang !== 1) this.quaQuang.setSize(Math.max(8, Math.round(rong * tiLe * this.tiLeQuang)), Math.max(8, Math.round(cao * tiLe * this.tiLeQuang)));
    this.quaCuoi.uniforms.uTiLeKhung.value = rong / Math.max(1, cao);
  }

  // Vẽ thử cảnh vào một góc 8 × 8 điểm ảnh của chính bộ đệm cảnh (xem lam-nong.js): không để xem, chỉ để three.js và card
  // đồ hoạ biên dịch đúng những chương trình mà lượt vẽ thật sẽ dùng (cùng bộ đệm, cùng cờ «đang vẽ cảnh»).
  veThu(scene, camera) {
    const r = this.renderer, dich = this.composer.readBuffer;
    const tuXoa = r.autoClear;
    dich.viewport.set(0, 0, 8, 8); dich.scissor.set(0, 0, 8, 8); dich.scissorTest = true;
    r.autoClear = false;
    dangVeCanh = true;
    try { r.setRenderTarget(dich); r.render(scene, camera); }
    finally {
      dangVeCanh = false;
      r.autoClear = tuXoa;
      dich.viewport.set(0, 0, dich.width, dich.height); dich.scissor.set(0, 0, dich.width, dich.height); dich.scissorTest = false;
      r.setRenderTarget(null);
    }
  }

  // Các bước làm nóng phần hậu kỳ (quầng sáng, bước cuối): mỗi bước vẽ thử MỘT chương trình vào một góc nhỏ của đúng bộ
  // đệm mà nó sẽ dùng. Chỉ cần làm một lần cho cả phiên; lần gọi sau trả về mảng rỗng.
  cacBuocLamNong() {
    if (this._daNongHauKy) return [];
    this._daNongHauKy = true;
    const r = this.renderer, q = this.quaQuang;
    const ds = [];
    const veVao = (tam, vatLieu, layDich) => () => {
      const dich = layDich();
      const cu = tam.material;
      tam.material = vatLieu;
      if (dich) { dich.viewport.set(0, 0, 4, 4); dich.scissor.set(0, 0, 4, 4); dich.scissorTest = true; }
      else { r.setScissor(0, 0, 2, 2); r.setScissorTest(true); }
      try { r.setRenderTarget(dich); tam.render(r); }
      finally {
        tam.material = cu;
        if (dich) { dich.viewport.set(0, 0, dich.width, dich.height); dich.scissor.set(0, 0, dich.width, dich.height); dich.scissorTest = false; }
        else r.setScissorTest(false);
        r.setRenderTarget(null);
      }
    };
    const tamQ = q?._fsQuad ?? q?.fsQuad;
    if (tamQ && q.materialHighPassFilter && q.separableBlurMaterials && q.compositeMaterial) {
      ds.push(veVao(tamQ, q.materialHighPassFilter, () => q.renderTargetBright));
      q.separableBlurMaterials.forEach((m, i) => ds.push(veVao(tamQ, m, () => q.renderTargetsHorizontal[i])));
      ds.push(veVao(tamQ, q.compositeMaterial, () => q.renderTargetsHorizontal[0]));
      if (q.blendMaterial) ds.push(veVao(tamQ, q.blendMaterial, () => this.composer.readBuffer));
    }
    const tamC = this.quaCuoi._fsQuad ?? this.quaCuoi.fsQuad;
    if (tamC) ds.push(veVao(tamC, this.quaCuoi.material, () => null));
    return ds;
  }

  ve(scene, camera, dt = 0) {
    this.gio += dt;
    this.quaCanh.scene = scene;
    this.quaCanh.camera = camera;
    this.quaCuoi.uniforms.uGio.value = this.gio;
    this.composer.render(dt);
  }

  huy() { this.composer.dispose(); }
}

// Tự hạ độ nét khi máy vẽ không kịp, nâng lại (dè dặt) khi dư sức.
// Bản 3.1 viết lại sau khi app bị đơ lúc máy bận (xét mỗi 0,7 giây; máy rất chậm thì hạ hai nấc; hạ ba lần thì thôi nâng).
// Bản 3.2 sửa tiếp theo nhật ký máy thật ngày 12/11/2026:
//   - một cửa sổ chậm lẻ loi thường chỉ là cú khựng lúc đổi bước (biên dịch, dựng chữ) chứ máy không yếu: phải chậm hai cửa
//     sổ liền mới hạ (trừ khi chậm hẳn, dưới khoảng 23 khung hình mỗi giây);
//   - nấc hạ đầu tiên là TẮT khử răng cưa 4 mẫu (nếu đang bật) vì nó tốn hơn cả một nấc độ nét; sau đó mới hạ độ nét;
//   - phần tính toán của trang (JS) đã chiếm quá nửa khung hình thì hạ độ nét cũng vô ích: không hạ;
//   - «hơi chậm» (dưới khoảng 54 khung hình mỗi giây, cứ mươi khung lại rớt một khung) kéo dài ba cửa sổ cũng hạ một nấc.
export class TuChinhDoNet {
  constructor({ toiDa = 2, toiThieu = 1, nhip = 1 / 60 } = {}) {
    this.toiDa = toiDa; this.toiThieu = toiThieu; this.tiLe = toiDa; this.nhip = nhip;
    this.khuRangCua = false;
    this._tong = 0; this._so = 0; this._js = 0; this._nghi = 1.2; this._nhanhLien = 0; this._chamLien = 0; this._hoiChamLien = 0; this._lanHa = 0;
  }
  datTran(toiDa, khuRangCua = false) {
    this.toiDa = toiDa; if (this.tiLe > toiDa) this.tiLe = toiDa;
    this.khuRangCua = !!khuRangCua;
    this._nhanhLien = 0; this._chamLien = 0; this._hoiChamLien = 0; this._lanHa = 0;
  }
  // dtThuc: thời gian thật giữa hai khung hình đã vẽ (giây). msTinh: phần tính toán của trang trong khung vừa rồi (mili giây).
  // Trả về true nếu tỉ lệ hoặc cờ khử răng cưa vừa đổi.
  do(dtThuc, msTinh = 0) {
    if (dtThuc <= 0 || dtThuc > 0.5) return false;          // cửa sổ vừa hiện lại, vừa đổi bài: bỏ mẫu này
    if (this._nghi > 0) { this._nghi -= dtThuc; return false; }
    this._tong += dtThuc; this._so++; this._js += msTinh;
    if (this._tong < 0.7 || this._so < 4) return false;
    const tb = this._tong / this._so, js = this._js / this._so / 1000;
    this._tong = 0; this._so = 0; this._js = 0;
    const cham = tb > this.nhip * 1.45, ratCham = tb > this.nhip * 2.6, hoiCham = tb > this.nhip * 1.1;
    let ha = 0;
    if (cham) {
      this._nhanhLien = 0; this._chamLien++; this._hoiChamLien++;
      if (ratCham || this._chamLien >= 2) ha = ratCham ? 0.5 : 0.25;
    } else if (hoiCham) {
      this._nhanhLien = 0; this._chamLien = 0; this._hoiChamLien++;
      if (this._hoiChamLien >= 3) ha = 0.25;
    } else {
      this._chamLien = 0; this._hoiChamLien = 0;
      if (tb < this.nhip * 1.04) this._nhanhLien++; else this._nhanhLien = 0;
    }
    if (ha && js > this.nhip * 0.55) ha = 0;                 // trang tự tính đã hết nửa khung hình: hạ độ nét không cứu được
    let doi = false;
    if (ha) {
      this._chamLien = 0; this._hoiChamLien = 0;
      if (this.khuRangCua) { this.khuRangCua = false; this._lanHa++; doi = true; }
      else if (this.tiLe > this.toiThieu) { this.tiLe = Math.max(this.toiThieu, this.tiLe - ha); this._lanHa++; doi = true; }
    } else if (this._nhanhLien >= 9 && this.tiLe < this.toiDa && this._lanHa < 3) {
      this.tiLe = Math.min(this.toiDa, this.tiLe + 0.25); doi = true;
    }
    if (!doi) return false;
    this._nhanhLien = 0; this._nghi = 1.2;
    return true;
  }
  nghi(giay = 1.5) { this._nghi = Math.max(this._nghi, giay); this._tong = 0; this._so = 0; this._js = 0; }
}
