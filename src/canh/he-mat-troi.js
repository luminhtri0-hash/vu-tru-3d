import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 1 — Hệ Mặt Trời đang bay.
// Vị trí thật của các hành tinh và hai tàu Voyager; hai cách nhìn cùng một chuyển động:
// đứng ở Mặt Trời (quỹ đạo khép kín) và đứng ở Ngân Hà (đường xoắn ốc).
// Đơn vị cảnh: 1 = 1 AU. Trục Y hướng về cực bắc hoàng đạo (xem hdSangBa).

import * as THREE from 'three';
import {
  HANH_TINH, phanTuQuyDao, viTriTuPhanTu, diemTrenQuyDao, VOYAGER, viTriVoyager, V_MAT_TROI,
  TRUC_NGAN_HA, hdSangBa, jdTuMs, ngayThang, JD_VOYAGER_TIN_DUOC, JD_J2000,
} from '../vat-ly/he-mat-troi.js';
import { so, V_MAT_TROI_AU_NAM, NGAY_ANH_SANG_AU, AU_KM, DO } from '../vat-ly/hang-so.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, duongDayTinh, donViMoiDiemAnh, goNhanDeNhau, duongTron } from '../khung/ve.js';
import { khungDoThi, MAU } from '../khung/giao-dien.js';
import { taoMatTroi, taoTraiDat, taoHanhTinh, taoVanhDai, taoVoCau } from '../khung/hanh-tinh.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('he-mat-troi', khoa, goc, thamSo);

const R = String.raw;

// ----- Số liệu cho tương tác, âm thanh, thử thách (có phép kiểm trong kiem-tra/kiem-he-mat-troi.mjs) -----
// Kinh độ trung bình (độ) của hành tinh ở ngày jd, theo bảng JPL: mỗi lần vượt bội của 360° là đi hết một vòng.
export const kinhDoTrungBinh = (ht, jd) => ht.L[0] + (ht.L[1] * (jd - JD_J2000)) / 36525;
// Định luật Kepler thứ ba (năm, AU).
export const chuKyKepler = (a) => Math.pow(a, 1.5);
// Tốc độ quỹ đạo tròn ở 1 AU (km/s): v = 29,78 / √a.
export const V_TRAI_DAT = 29.78;
// Cao độ nốt của mỗi hành tinh: tỉ lệ với tốc độ quỹ đạo, 22 Hz cho mỗi km/s (quy đổi cho tai nghe được).
export const HZ_MOI_KM_S = 22;
export const tanSoNot = (vKmS) => HZ_MOI_KM_S * vKmS;
// Đích của các thử thách
export const TT_LECH_NHIN = 6;          // độ: nhìn dọc hướng bay
export const TT_LECH_XUNG_DOI = 1.5;    // độ: Trái Đất và Sao Hỏa thẳng hàng với Mặt Trời
export const TT_CHU_KY = 8, TT_SAI_CHU_KY = 0.25;   // năm: hành tinh thử
export const TT_V1_SAI = 0.6;           // AU: Voyager 1 cách đúng một ngày ánh sáng

// ----- Vệt sáng: dải băng phẳng luôn quay mặt về máy quay, bề rộng tính bằng điểm ảnh -----
// Mỗi vệt giữ đúng màu của mình: hoà màu kiểu «phủ lên» (alpha nhân sẵn) thay vì cộng dồn, nên chỗ các vệt chồng nhau
// không cháy thành trắng. Đầu vệt (điểm 0) sáng nhất và hơi dày hơn, rồi mờ dần về đuôi.
const DINH_VET = /* glsl */ `
  uniform vec2 uRes; uniform float uRong, uN, uDauRong;
  attribute vec3 aTruoc; attribute vec3 aSau; attribute float aCanh; attribute float aK;
  varying float vT; varying float vX; varying float vNua;
  vec2 manHinh(vec4 c) { return c.xy / max(abs(c.w), 1e-5) * 0.5 * uRes; }
  void main() {
    mat4 pm = projectionMatrix * modelViewMatrix;
    vec4 c = pm * vec4(position, 1.0);
    vec2 s = manHinh(c), sa = manHinh(pm * vec4(aTruoc, 1.0)), sb = manHinh(pm * vec4(aSau, 1.0));
    vec2 d1 = s - sa, d2 = sb - s;
    float l1 = length(d1), l2 = length(d2);
    vec2 d = (l1 > 1e-3 ? d1 / l1 : vec2(0.0)) + (l2 > 1e-3 ? d2 / l2 : vec2(0.0));
    d = length(d) < 1e-3 ? vec2(1.0, 0.0) : normalize(d);
    vT = aK / max(uN - 1.0, 1.0);
    float nua = 0.5 * uRong * (1.0 + uDauRong * exp(-vT * 50.0)) + 0.8;
    vNua = nua; vX = aCanh * nua;
    c.xy += vec2(-d.y, d.x) * aCanh * nua / (0.5 * uRes) * c.w;
    gl_Position = c;
  }`;
const MANH_VET = /* glsl */ `
  uniform vec3 uMau; uniform float uMu, uDau, uDoMo;
  varying float vT; varying float vX; varying float vNua;
  void main() {
    float a = pow(max(1.0 - vT, 0.0), uMu) * uDoMo;
    float x = abs(vX);
    float canh = clamp(vNua - x, 0.0, 1.0);
    float loi = exp(-x * x / max(vNua * vNua * 0.16, 0.25));
    float al = a * canh;
    if (al < 0.002) discard;
    vec3 c = uMau * (0.62 + 0.55 * loi) * (1.0 + uDau * exp(-vT * 36.0));
    gl_FragColor = vec4(c * al, al);
  }`;
const _v4 = new THREE.Vector4();
export class VetSang {
  constructor(toiDa, { mau = 0xffffff, rong = 1.8, sang = 1, dau = 1.5, mu = 1.2, doMo = 0.95, dauRong = 0.5, cong = false } = {}) {
    this.toiDa = toiDa;
    const soO = (toiDa + 2) * 2;
    this.B = new Float32Array(soO * 3);
    this.bo = new THREE.InterleavedBuffer(this.B, 3);
    this.bo.setUsage(THREE.DynamicDrawUsage);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('aTruoc', new THREE.InterleavedBufferAttribute(this.bo, 3, 0));
    geo.setAttribute('position', new THREE.InterleavedBufferAttribute(this.bo, 3, 6));
    geo.setAttribute('aSau', new THREE.InterleavedBufferAttribute(this.bo, 3, 12));
    const canh = new Float32Array(soO), k = new Float32Array(soO);
    for (let i = 0; i < soO; i++) { canh[i] = i % 2 ? 1 : -1; k[i] = i >> 1; }
    geo.setAttribute('aCanh', new THREE.BufferAttribute(canh, 1));
    geo.setAttribute('aK', new THREE.BufferAttribute(k, 1));
    const chiSo = new (toiDa * 2 > 65000 ? Uint32Array : Uint16Array)(Math.max(1, toiDa - 1) * 6);
    for (let i = 0; i < toiDa - 1; i++) { const v = i * 2; chiSo.set([v, v + 1, v + 2, v + 2, v + 1, v + 3], i * 6); }
    geo.setIndex(new THREE.BufferAttribute(chiSo, 1));
    geo.setDrawRange(0, 0);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
    this.geo = geo;
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) }, uRong: { value: rong }, uN: { value: 2 }, uDauRong: { value: dauRong },
        uMau: { value: new THREE.Color(mau).multiplyScalar(sang) }, uMu: { value: mu }, uDau: { value: dau }, uDoMo: { value: doMo },
      },
      vertexShader: DINH_VET, fragmentShader: MANH_VET,
      transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
      blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.mat.tuyenTinh = true;
    this.rong = rong;
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.onBeforeRender = (renderer) => {
      renderer.getCurrentViewport(_v4);
      this.mat.uniforms.uRes.value.set(Math.max(1, _v4.z), Math.max(1, _v4.w));
      this.mat.uniforms.uRong.value = this.rong * renderer.getPixelRatio();
    };
    this.n = 0;
  }
  dat(i, x, y, z) { const j = (i + 1) * 6, B = this.B; B[j] = B[j + 3] = x; B[j + 1] = B[j + 4] = y; B[j + 2] = B[j + 5] = z; }
  // Gọi sau khi đã ghi n điểm bằng dat(). Điểm 0 là đầu vệt (sáng nhất).
  xong(n) {
    n = Math.min(n, this.toiDa);
    this.n = n;
    const B = this.B;
    for (let j = 0; j < 6; j++) B[j] = B[6 + j];                      // ô đệm trước điểm đầu
    const e = (n + 1) * 6;
    for (let j = 0; j < 6; j++) B[e + j] = B[e - 6 + j];              // ô đệm sau điểm cuối
    this.bo.clearUpdateRanges();
    this.bo.addUpdateRange(0, (n + 2) * 6);
    this.bo.needsUpdate = true;
    this.mat.uniforms.uN.value = n;
    this.geo.setDrawRange(0, Math.max(0, n - 1) * 6);
  }
}
const VET_TOI_DA_NAM = 150;   // vệt dài nhất, tính theo năm
const N_VET = 2400;           // số điểm tối đa của mỗi vệt
const DIEM_MOI_VONG = 40;
const N_BANG_VET = 512;       // số điểm của bảng tra quanh mỗi elip (dùng để dựng vệt xoắn ốc cho nhanh)
const N_CUNG = 96;            // số điểm của đuôi sáng sau mỗi hành tinh (khi nhìn từ Mặt Trời)
const PHAN_CUNG = 0.3;        // đuôi dài 30% vòng quỹ đạo

// Trục quay của hành tinh (IAU WGCCRE 2015): xích kinh và xích vĩ của cực bắc (độ),
// góc quay W tại J2000 (độ) và tốc độ quay (độ mỗi ngày; số âm là quay ngược).
export const TRUC_QUAY = {
  thuy: [281.0103, 61.4155, 329.5988, 6.1385108],
  kim: [272.76, 67.16, 160.2, -1.4813688],
  dat: [0, 90, 190.147, 360.9856235],
  hoa: [317.68143, 52.8865, 176.63, 350.89198226],
  moc: [268.057, 64.495, 284.95, 870.536],
  tho: [40.589, 83.537, 38.9, 810.7939024],
  thienVuong: [257.311, -15.175, 203.81, -501.1600928],
  haiVuong: [299.36, 43.46, 249.978, 541.1397757],
};
const NGHIENG_HD = 23.4392911 * DO;
// Cực bắc của hành tinh viết trong hệ hoàng đạo J2000 (véc-tơ đơn vị).
export function cucHoangDao(ra, dec) {
  const a = ra * DO, d = dec * DO;
  const x = Math.cos(d) * Math.cos(a), y = Math.cos(d) * Math.sin(a), z = Math.sin(d);
  const c = Math.cos(NGHIENG_HD), s = Math.sin(NGHIENG_HD);
  return [x, c * y + s * z, -s * y + c * z];
}
// Độ nghiêng trục quay so với mặt phẳng quỹ đạo của chính hành tinh (độ). Hành tinh quay ngược (Sao Kim,
// Sao Thiên Vương) theo quy ước thường dùng được ghi trên 90°, tức tính theo chiều tự quay.
export function doNghiengTruc(ht, jd = JD_J2000) {
  const el = phanTuQuyDao(ht, jd);
  const n = [el.Py * el.Qz - el.Pz * el.Qy, el.Pz * el.Qx - el.Px * el.Qz, el.Px * el.Qy - el.Py * el.Qx];
  const p = cucHoangDao(TRUC_QUAY[ht.id][0], TRUC_QUAY[ht.id][1]);
  const g = Math.acos(Math.max(-1, Math.min(1, n[0] * p[0] + n[1] * p[1] + n[2] * p[2]))) / DO;
  return TRUC_QUAY[ht.id][3] < 0 ? 180 - g : g;
}

// Kích thước vẽ: hành tinh to ít nhất R_HIEN(bán kính) AU và ít nhất PX_MIN điểm ảnh trên màn hình.
export const rHienThi = (banKinhKm) => 0.014 * Math.pow(banKinhKm / 6371, 0.42);
const pxToiThieu = (banKinhKm) => 6 * Math.pow(banKinhKm / 6371, 0.3) + 2;
export const R_MAT_TROI_TOI_THIEU = 0.035;   // AU; bán kính thật 0,00465 AU

// Ánh sáng đi quãng đường au mất bao lâu.
function thoiGianAnhSang(au) {
  const s = au * 499.004784;
  if (s < 90) return chuCanh("canh.giay", "{0} giây", [so(s, 0)]);
  if (s < 5400) return chuCanh("canh.phut", "{0} phút", [so(s / 60, 1)]);
  if (s < 86400 * 2) return chuCanh("canh.gio", "{0} giờ", [so(s / 3600, s < 36000 ? 1 : 0)]);
  return chuCanh("canh.ngay", "{0} ngày", [so(s / 86400, 1)]);
}
function thoiGianQuay(doMoiNgay) {
  const ngay = 360 / Math.abs(doMoiNgay);
  return ngay < 2 ? chuCanh("canh.gio", "{0} giờ", [so(ngay * 24, 1)]) : chuCanh("canh.ngay", "{0} ngày", [so(ngay, 1)]);
}

// ----- Hướng bay và các góc máy quay khi nhìn từ Ngân Hà -----
const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const HUONG_BAY = V3(hdSangBa(TRUC_NGAN_HA.quay)).normalize();
const NGANG = HUONG_BAY.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();   // vuông góc hướng bay, nằm trong mặt phẳng hoàng đạo
// Khi nhìn từ Ngân Hà, cả cảnh được xoay để hướng bay nằm ngang (trục X) và cực bắc thiên hà hướng lên (trục Y):
// mặt phẳng Ngân Hà nằm ngang, còn mặt phẳng quỹ đạo các hành tinh nghiêng khoảng 60°.
const Q_BAY = (() => {
  const H = HUONG_BAY, N = V3(hdSangBa(TRUC_NGAN_HA.cucBac)).normalize();
  const Z = new THREE.Vector3().crossVectors(H, N);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(H.x, H.y, H.z, 0, N.x, N.y, N.z, 0, Z.x, Z.y, Z.z, 0, 0, 0, 0, 1));
})();
const NGANG_BAY = NGANG.clone().applyQuaternion(Q_BAY);
// Góc máy quay khi nhìn từ Ngân Hà, viết trong hệ đã xoay (hướng bay là +X).
function gocBay(D, kieu = 'ngang', lui = 0.24) {   // lui: đích lùi sau Mặt Trời bao nhiêu phần D
  let dich, vt;
  if (kieu === 'truoc') {
    dich = new THREE.Vector3(-0.35 * D, 0, 0);
    vt = new THREE.Vector3(0.62 * D, 0.2 * D, 0.26 * D);
  } else if (kieu === 'phang') {   // nhìn sát mặt phẳng quỹ đạo: mặt phẳng thành một vạch, thấy rõ góc 60°
    dich = new THREE.Vector3(-0.15 * D, 0, 0);
    vt = dich.clone().addScaledVector(NGANG_BAY, D);
  } else {
    dich = new THREE.Vector3(-lui * D, 0, 0);
    vt = dich.clone().add(new THREE.Vector3(0.08 * D, 0.22 * D, 0.97 * D));
  }
  return [vt.toArray(), dich.toArray()];
}
const GOC_NGANG = gocBay(26);
// Cảnh mở đầu: đứng sau lưng, chếch bên trái Mặt Trời; các lò xo từ phía trước mặt cuộn về Mặt Trời, mũi tên hướng bay
// chĩa về chòm Thiên Nga trên nền dải Ngân Hà thật.
const GOC_DAU = [[-19, 5, 7], [5, 0.6, -1.5]];
const FOV_DAU = 56;

// Màu vệt bay: mỗi hành tinh một màu riêng, đủ khác nhau để các vòng xoắn chồng lên nhau vẫn phân biệt được.
const MAU_VET = {
  thuy: 0xb9a6f0, kim: 0xffc07a, dat: 0x4f9dff, hoa: 0xff5a3c,
  moc: 0xe0a46a, tho: 0xf4dc8c, thienVuong: 0x7ff0ea, haiVuong: 0x6a7dff,
};
const MAC_DINH = { thuoc: false, doThi: false, goc: false, xoay: false, theo: null, chon: null, tay: null };

export default {
  id: 'he-mat-troi',
  ten: 'Hệ Mặt Trời đang bay',
  moTa: 'Vị trí thật hôm nay; Mặt Trời lao đi 828 000 km/h',
  yChinh: 'Tám hành tinh quay quanh Mặt Trời, nhưng Mặt Trời không đứng yên. Nó kéo cả gia đình lao quanh tâm Ngân Hà với tốc độ **828 000 km/h**. Nhìn từ Ngân Hà, mỗi hành tinh vẽ ra một đường xoắn ốc. Cùng một chuyển động mà mỗi người nhìn thấy một hình khác: hình dạng đường đi phụ thuộc chỗ đứng nhìn.',
  giaiThich: R`
    Vị trí các hành tinh là **vị trí thật hôm nay**, tính từ bảng quỹ đạo của NASA/JPL. Khoảng cách đúng tỉ lệ; kích thước hành tinh và Mặt Trời được phóng to để nhìn thấy.

    Nhìn từ Ngân Hà, Mặt Trời bay 230 km/s về phía chòm Thiên Nga. Mặt phẳng quỹ đạo nghiêng khoảng **60°** so với hướng bay nên đường đi của mỗi hành tinh là một chiếc lò xo bị kéo xiên. Lò xo thật bị kéo giãn rất mạnh (mỗi năm Mặt Trời đi 48,5 AU, Trái Đất chỉ lượn một vòng dài 6,28 AU), nên mô hình mặc định **nén đường bay 10 lần**.

    Không có chỗ đứng nào là đứng yên tuyệt đối. Nói một vật chuyển động thế nào thì phải nói rõ so với cái gì.`,
  hinh: { quang: 0.42, banKinh: 0.5, nguong: 0.85 },
  mayAnh: { viTri: GOC_DAU[0], dich: GOC_DAU[1], fov: FOV_DAU, min: 0.02, max: 60000 },

  baiGiang: {
    mucTieu: [
      'Nói được Hệ Mặt Trời đang chuyển động thế nào so với Ngân Hà, nhanh bao nhiêu.',
      'Hình dung được tỉ lệ thật của Hệ Mặt Trời bằng đơn vị thiên văn và thời gian ánh sáng.',
      'Dùng định luật Kepler thứ ba $T^2 = a^3$ để tính chu kỳ từ khoảng cách, và suy ra nó từ định luật hấp dẫn Newton.',
      'Giải thích được vì sao nhìn từ Ngân Hà, các hành tinh vẽ ra đường xoắn ốc xiên chứ không phải phễu xoáy.',
      'Tính được một năm thiên hà từ bán kính và tốc độ quỹ đạo của Mặt Trời.',
    ],
    buoc: [
      {
        ten: 'Bạn đang bay 828 000 km/h',
        noiDung: R`
          Đây là Hệ Mặt Trời nhìn từ Ngân Hà. Quả cầu rực sáng là Mặt Trời. Nó đang lao về phía chòm Thiên Nga với tốc độ khoảng **230 km/s**, và kéo theo cả tám hành tinh. Mỗi vệt sáng là quãng đường một hành tinh vừa đi qua trong vài chục năm gần đây. Hành tinh vừa quay quanh Mặt Trời vừa bị Mặt Trời kéo đi, nên vệt của nó thành một **đường xoắn ốc**.

          - Vòng xoắn chặt nhất, sát Mặt Trời: Sao Thủy và Sao Kim.
          - Vệt xanh lam: Trái Đất. Mỗi vòng xoắn là một năm.
          - Những vòng rộng và thưa hơn nhiều: Sao Mộc, Sao Thổ.

          > [Con số] $230\ \text{km/s} \times 3\,600\ \text{s} = 828\,000$ km mỗi giờ. Trong vài giây bạn đọc câu này, cả Hệ Mặt Trời đã đi thêm hơn 1 000 km.

          > [Lưu ý] Quãng đường Mặt Trời bay được vẽ **ngắn lại 10 lần** để thấy rõ vòng xoắn. Mặt Trời và hành tinh được vẽ to hơn thật rất nhiều. Bước 3 và bước 6 nói rõ tỉ lệ thật.

          > [Thử ngay] Kéo chuột để xoay, cuộn để phóng to. Rê chuột vào một hành tinh để xem số liệu thật của nó, bấm vào để bay tới gần.
          > [[Nhìn từ phía trước|truoc]] [[Nhìn ngang|dau]] [[Đứng ở Mặt Trời mà nhìn|quay]]

          Cùng một chuyển động, nhìn từ hai chỗ khác nhau thì hình dạng đường đi khác hẳn nhau. Cả bài này xoay quanh ý đó.`,
        vao: (c) => c.buoc({ cheDo: 'bay', nen: 10, namBay: 60, tocDo: 365.25, mayAnh: 'dau', xoay: true }),
        thuThach: {
          de: R`Xoay để nhìn **dọc theo hướng bay** (đứng trước hay sau Mặt Trời đều được), cho mũi tên vàng chĩa thẳng vào mắt hoặc thẳng ra xa. Phần «Mặt Trời kéo đi» khi đó không còn thấy nữa: mỗi lò xo thu lại thành những vòng khép kín lồng vào nhau. Đạt khi hướng nhìn lệch hướng bay dưới 6°.`,
          kiem: (c) => c.lechHuongNhin() < TT_LECH_NHIN,
          giu: 0.6,
          goiY: 'Bấm «Nhìn từ phía trước» cho gần đúng hướng rồi kéo chuột thật chậm. Mỗi vòng là quỹ đạo nhìn nghiêng nên hơi dẹt (tỉ lệ hai trục khoảng 0,86, vì mặt phẳng quỹ đạo nghiêng 60° so với hướng bay); vòng ở xa trông nhỏ hơn vì phối cảnh.',
        },
        nut: {
          truoc: (c) => c.goc('truoc'),
          dau: (c) => c.goc('ngang'),
          quay: (c) => c.buoc({ cheDo: 'quay', tocDo: 30.4375, mayAnh: 'trong' }),
        },
      },
      {
        ten: 'Nhìn từ Mặt Trời: tám hành tinh hôm nay',
        noiDung: R`
          Giờ ta đứng yên cùng Mặt Trời, như hình vẽ quen thuộc trong sách giáo khoa. Mỗi hành tinh chạy trên một đường elip gần tròn; đuôi sáng phía sau là quãng nó vừa đi.

          Vị trí ở đây là **vị trí thật của hôm nay**, tính từ bảng quỹ đạo gần đúng của NASA/JPL. Bảng cho mỗi hành tinh sáu con số (như {{bán trục lớn}}, tâm sai, độ nghiêng) cùng mức thay đổi của chúng mỗi thế kỷ. Từ đó máy giải phương trình Kepler để ra vị trí ở ngày bất kỳ từ năm 1800 tới 2050, lệch cỡ vài phút cung so với lịch thiên văn chính xác.

          - Bốn hành tinh đá vòng trong: Sao Thủy, Sao Kim, Trái Đất, Sao Hỏa.
          - Vành đai tiểu hành tinh: 2,1–3,3 AU.
          - Bốn hành tinh khổng lồ: Sao Mộc, Sao Thổ (khí), Sao Thiên Vương, Sao Hải Vương (băng).
          - Vành đai Kuiper: 30–50 AU, nơi có Sao Diêm Vương.

          > [Lưu ý] Hai vành đai vẽ bằng vài nghìn hạt để **minh hoạ phân bố**. Thật ra chúng có rất nhiều thiên thể hơn, và mỗi hạt ở đây không ứng với thiên thể có thật nào.

          > [Thử ngay] Rê chuột vào một hành tinh để xem số liệu của nó; bấm vào tên để ghim số liệu ở phần điều khiển. Kéo Trái Đất (đốm xanh) dọc quỹ đạo để tua thời gian tới lui: mọi hành tinh chạy theo đúng ngày.
          > [[Xem cả tám hành tinh|ngoai]] [[Về vòng trong|trong]] [[Số liệu Trái Đất|dat]]`,
        vao: (c) => c.buoc({ cheDo: 'quay', homNay: true, tocDo: 30.4375, mayAnh: 'trong', tay: 'dat' }),
        thuThach: {
          de: R`Kéo Trái Đất tới ngày nó **vượt Sao Hỏa**: Mặt Trời, Trái Đất, Sao Hỏa thẳng hàng. Lúc ấy Sao Hỏa ở «xung đối», gần ta và sáng nhất. Đạt khi hai hành tinh lệch nhau dưới 1,5° nhìn từ Mặt Trời.`,
          kiem: (c) => c.daKeo.dat && Math.abs(c.lechDatHoa()) < TT_LECH_XUNG_DOI,
          goiY: 'Trái Đất ở vòng trong chạy nhanh hơn nên đuổi kịp Sao Hỏa. Kéo Trái Đất tới thêm chừng một phần tư vòng: lần xung đối tới rơi vào khoảng 20/02/2027.',
        },
        nut: {
          ngoai: (c) => c.goc('ngoai'),
          trong: (c) => c.goc('trong'),
          dat: (c) => c.chonCo('dat'),
        },
      },
      {
        ten: 'Tỉ lệ thật: một khoảng trống mênh mông',
        noiDung: R`
          Trên hình, **khoảng cách đúng tỉ lệ**, còn **kích thước thì không**: vẽ đúng thì Trái Đất nhỏ hơn một điểm ảnh. Để hình dung, thu nhỏ mọi thứ sao cho Mặt Trời là một quả bóng đường kính 1,4 m:

          | Vật | Thật | Thu nhỏ |
          |---|---|---|
          | Mặt Trời | đường kính 1 391 400 km | quả bóng 1,4 m |
          | Trái Đất | đường kính 12 742 km, cách 1 AU | viên bi 1,3 cm, cách 150 m |
          | Sao Mộc | đường kính 139 822 km, cách 5,2 AU | quả cam 14 cm, cách 780 m |
          | Sao Hải Vương | cách 30 AU | cách 4,5 km |
          | Voyager 1 | cách 172 AU | cách 26 km |
          | Ngôi sao gần nhất | 4,25 năm ánh sáng | cách 40 000 km |

          Ngôi sao gần nhất nằm xa cỡ một vòng quanh Trái Đất thật.

          {{Đơn vị thiên văn}} (AU) là khoảng cách trung bình Trái Đất – Mặt Trời, 149,6 triệu km. Ánh sáng đi 1 AU mất 499 giây, tức **8,3 phút ánh sáng**. Sao Mộc cách Mặt Trời khoảng 43 phút ánh sáng, Sao Hải Vương 4,2 giờ ánh sáng.

          > [Lưu ý] Mặt Trời được vẽ to hơn thật ít nhất 7 lần. Hành tinh to hơn thật từ khoảng 80 lần (Sao Mộc) tới gần 600 lần (Sao Thủy); Trái Đất khoảng 330 lần. Lùi xa thì còn được phóng to thêm để không nhỏ hơn vài điểm ảnh. Vân trên mặt hành tinh là hình minh hoạ cho dễ nhận ra, không phải bản đồ thật; riêng bờ biển Trái Đất là bờ biển thật.

          > [Thử ngay] Các vòng tròn mảnh là thước đo, ghi cả thời gian ánh sáng. Bay lại gần bằng các nút dưới đây hoặc bấm thẳng vào một hành tinh (thời gian chậm lại còn 1 giờ mỗi giây, để thấy hành tinh tự quay):
          > [[Trái Đất|dat]] [[Sao Mộc|moc]] [[Sao Thổ|tho]] [[Mặt Trời|mt]] [[Về toàn cảnh|toan]]`,
        vao: (c) => c.buoc({ cheDo: 'quay', tocDo: 30.4375, mayAnh: 'thuoc', thuoc: true }),
        nut: {
          dat: (c) => c.theo('dat'), moc: (c) => c.theo('moc'), tho: (c) => c.theo('tho'),
          mt: (c) => c.theo('mt'),
          toan: (c) => c.buoc({ cheDo: 'quay', tocDo: 30.4375, mayAnh: 'thuoc', thuoc: true }),
        },
      },
      {
        ten: 'Ba định luật Kepler',
        noiDung: R`
          Hành tinh càng xa thì chạy càng chậm, mà vòng của nó lại càng dài. Johannes Kepler tìm ra quy luật chính xác từ số liệu quan sát của Tycho Brahe (công bố năm 1609 và 1619):

          1. Mỗi hành tinh đi trên một **elip**, Mặt Trời nằm ở một tiêu điểm.
          2. Đoạn nối hành tinh với Mặt Trời quét những diện tích bằng nhau trong những khoảng thời gian bằng nhau: gần Mặt Trời thì đi nhanh, xa thì đi chậm.
          3. Bình phương chu kỳ $T$ tỉ lệ với lập phương bán trục lớn $a$ (nửa trục dài của elip):

          $$ T^2 = a^3 \qquad (T \text{ tính bằng năm},\ a \text{ bằng AU}) $$

          | Hành tinh | $a$ (AU) | $T$ (năm) | $T^2/a^3$ |
          |---|---|---|---|
          | Sao Thủy | 0,387 | 0,241 | 1,000 |
          | Sao Kim | 0,723 | 0,615 | 1,000 |
          | Trái Đất | 1,000 | 1,000 | 1,000 |
          | Sao Hỏa | 1,524 | 1,881 | 1,000 |
          | Sao Mộc | 5,203 | 11,86 | 0,999 |
          | Sao Thổ | 9,537 | 29,45 | 1,000 |
          | Sao Thiên Vương | 19,19 | 84,02 | 0,999 |
          | Sao Hải Vương | 30,07 | 164,8 | 0,999 |

          Bảng lấy đúng số liệu mô hình đang dùng. Đồ thị ở phần điều khiển vẽ $T$ theo $a$ trên thang logarit: tám điểm nằm thẳng trên một đường dốc 3/2.

          > [Ví dụ] Sao Mộc: $T = 5{,}203^{1,5} \approx 11{,}87$ năm, khớp với 11,86 năm trong bảng.

          +++ Đi sâu: suy ra định luật thứ ba từ Newton
          Xét quỹ đạo tròn bán kính $r$, tốc độ $v$. Lực hấp dẫn của Mặt Trời (khối lượng $M$) đóng vai trò lực hướng tâm:

          $$ \frac{GMm}{r^2} = \frac{m v^2}{r} $$

          Thay $v = 2\pi r / T$ rồi rút gọn:

          $$ T^2 = \frac{4\pi^2}{GM}\, r^3 $$

          Khối lượng hành tinh $m$ bị triệt tiêu, nên mọi hành tinh dùng chung một hằng số $4\pi^2/GM$. Đo thời gian bằng năm và độ dài bằng AU thì $GM$ của Mặt Trời gần đúng bằng $4\pi^2$ (lệch 0,004%), nên $T^2 = a^3$. Với quỹ đạo elip, bán kính $r$ được thay bằng bán trục lớn $a$.

          Tỉ số trong bảng lệch 1 chưa tới 0,2% vì hành tinh cũng kéo ngược Mặt Trời (Sao Mộc nặng bằng khoảng 1/1 047 Mặt Trời) và các hành tinh kéo lẫn nhau.
          +++

          > [Lưu ý] Âm thanh: mỗi hành tinh ngân một nốt khi đi hết một vòng quanh Mặt Trời, nên nhịp các nốt chính là chu kỳ $T$. Nốt cao hay trầm theo tốc độ quỹ đạo, 22 Hz cho mỗi km/s: Sao Thủy (47 km/s) cao nhất, Sao Hải Vương (5,4 km/s) trầm nhất. Đây là quy đổi cho tai nghe được; hành tinh không phát ra tiếng.

          > [Thử ngay] Kéo «hành tinh thử» (đốm hồng) ra xa hay lại gần Mặt Trời: chu kỳ của nó đổi theo $T = a^{1,5}$, và nốt của nó trầm dần khi ra xa.
          > [[10 năm mỗi giây|nhanh]] [[1 tháng mỗi giây|cham]] [[Nhìn vòng trong|trong]] [[Nhìn cả tám|ngoai]]`,
        vao: (c) => c.buoc({ cheDo: 'quay', tocDo: 365.25, mayAnh: 'kepler', doThi: true, tay: 'thu' }),
        thuThach: {
          de: R`Đặt hành tinh thử ở chỗ nó đi một vòng quanh Mặt Trời mất đúng **8 năm**. Đạt khi chu kỳ lệch dưới 0,25 năm.`,
          kiem: (c) => c.daKeo.thu && Math.abs(chuKyKepler(c.aThu) - TT_CHU_KY) < TT_SAI_CHU_KY,
          goiY: R`$T = 8$ thì $a^3 = T^2 = 64$, nên $a = 4$ AU: giữa Sao Hỏa và Sao Mộc. Nhãn cạnh hành tinh thử ghi sẵn $a$ và $T$.`,
        },
        nut: {
          nhanh: (c) => c.datTocDo(3652.5), cham: (c) => c.datTocDo(30.4375),
          trong: (c) => c.goc('trong'), ngoai: (c) => c.goc('ngoai'),
        },
      },
      {
        ten: 'Vì sao thành xoắn ốc: cộng hai vận tốc',
        noiDung: R`
          Nhìn từ Ngân Hà, vận tốc của mỗi hành tinh là **tổng** của hai phần:

          $$ \vec v_{\text{hành tinh}} = \vec V_{\text{Mặt Trời}} + \vec v_{\text{quỹ đạo}} $$

          - $\vec V$: giống nhau cho mọi hành tinh, 230 km/s về phía chòm Thiên Nga (mũi tên vàng).
          - $\vec v_{\text{quỹ đạo}}$: quay vòng theo quỹ đạo; với Trái Đất là 29,8 km/s.

          Chuyển động tròn cộng một chuyển động thẳng đều cho ra đường xoắn ốc. Nhưng mặt phẳng quỹ đạo (đĩa xanh mờ) **nghiêng khoảng 60°** so với hướng bay, nên $\vec V$ có hai thành phần:

          - vuông góc với mặt phẳng quỹ đạo: $230 \times \sin 60° \approx 200$ km/s, kéo vòng tròn thành lò xo;
          - nằm trong mặt phẳng: $230 \times \cos 60° \approx 115$ km/s, làm lò xo bị **xô xiên**.

          > [Hiểu sai thường gặp] Có video trên mạng vẽ Mặt Trời như sao chổi, hành tinh xoáy thành phễu ở phía sau. Sai ở hai chỗ: hành tinh không bị kéo lê phía sau (lúc ở trước, lúc ở sau Mặt Trời), và mặt phẳng quỹ đạo không vuông góc với hướng bay.

          +++ Đi sâu: tốc độ thật của Trái Đất so với tâm Ngân Hà
          Gọi $\alpha \approx 60°$ là góc giữa hướng bay và mặt phẳng quỹ đạo, $\varphi$ là vị trí của Trái Đất trên quỹ đạo. Thành phần của $\vec v_{\text{quỹ đạo}}$ dọc theo hướng bay bằng $v \cos\alpha \cos\varphi$, nên

          $$ |\vec v_{\text{hành tinh}}| = \sqrt{V^2 + v^2 + 2Vv\cos\alpha\cos\varphi} $$

          Thay $V = 230$, $v = 29{,}8$ km/s, $\cos\alpha \approx 0{,}5$: lớn nhất khoảng 246 km/s, nhỏ nhất khoảng 216 km/s. Trong một năm, Trái Đất lúc thì bay nhanh hơn, lúc chậm hơn Mặt Trời chừng 15 km/s.
          +++

          > [Thử ngay] [[Nhìn từ phía trước|truoc]] [[Nhìn ngang|ngang]] [[Nhìn sát mặt phẳng quỹ đạo|phang]]`,
        vao: (c) => c.buoc({ cheDo: 'bay', nen: 10, namBay: 40, tocDo: 365.25, mayAnh: 'bay', goc: true }),
        nut: { truoc: (c) => c.goc('truoc'), ngang: (c) => c.goc('bay'), phang: (c) => c.goc('phang') },
      },
      {
        ten: 'Nén 10 lần và tỉ lệ thật',
        noiDung: R`
          Mỗi năm Trái Đất đi một vòng dài $2\pi \times 1\ \text{AU} \approx 6{,}28$ AU. Cũng trong một năm đó, Mặt Trời bay được

          $$ 230\ \text{km/s} \times 3{,}156 \times 10^{7}\ \text{s} \approx 7{,}26 \times 10^{9}\ \text{km} \approx 48{,}5\ \text{AU} $$

          Vậy bước lò xo thật dài gấp gần **8 lần** chu vi vòng xoắn. Lò xo bị kéo giãn tới mức trông như một đường thẳng hơi lượn sóng. Sao Hải Vương còn hơn thế: mỗi vòng mất 165 năm, trong lúc đó Mặt Trời đi gần 8 000 AU, còn chu vi quỹ đạo chỉ 189 AU.

          Vì vậy mô hình mặc định **vẽ quãng đường bay ngắn lại 10 lần**: bước lò xo của Trái Đất còn 4,85 AU và vòng xoắn hiện rõ.

          > [Thử ngay] [[Đúng tỉ lệ thật|that]] [[Nén 10 lần|nen]]

          > [Con số] Bài 4 sẽ dựng một chiếc lò xo khác: đường thế giới của Trái Đất trong không-thời gian, có bước **một năm ánh sáng**, tức 63 241 AU, dài gấp khoảng 1 300 lần bước 48,5 AU ở đây. Hai chiếc lò xo khác nhau: chiếc ở bài này nằm trong không gian và chỉ có khi nhìn từ Ngân Hà; chiếc ở Bài 4 nằm trong không-thời gian và có sẵn với mọi người quan sát.`,
        vao: (c) => c.buoc({ cheDo: 'bay', nen: 10, namBay: 40, tocDo: 365.25, mayAnh: 'bay' }),
        nut: { that: (c) => c.datNen(1), nen: (c) => c.datNen(10) },
      },
      {
        ten: 'Voyager: nửa thế kỷ được một ngày ánh sáng',
        noiDung: R`
          Hai tàu Voyager rời Trái Đất năm 1977, bay ngang Sao Mộc, Sao Thổ (Voyager 2 ghé thêm Sao Thiên Vương, Sao Hải Vương) rồi được lực hút của các hành tinh ấy «ném» ra khỏi Hệ Mặt Trời. Vị trí và vận tốc ở đây lấy từ hệ thống JPL Horizons.

          - **Voyager 1** bay 16,9 km/s, mỗi năm xa thêm 3,57 AU. Nay cách Mặt Trời khoảng 172 AU, tức 0,995 **ngày ánh sáng**; khoảng đầu tháng 2/2027 sẽ cách đúng một ngày ánh sáng.
          - **Voyager 2** bay 15,3 km/s, nay cách khoảng 144 AU.

          Mặt cầu mờ bán kính 120 AU là {{nhật quyển}}: vùng gió Mặt Trời thổi tới, trước khi gặp khí giữa các vì sao. Voyager 1 vượt ra ngoài tháng 8/2012 ở 121 AU, Voyager 2 tháng 11/2018 ở 119 AU. Nhật quyển thật không tròn mà có đầu, có đuôi; ở đây chỉ vẽ sơ lược.

          Ngôi sao gần nhất, Proxima Centauri, cách 4,25 năm ánh sáng. Với tốc độ của Voyager 1, phải mất khoảng **75 000 năm** mới đi hết quãng ấy (và Voyager 1 cũng không bay về hướng đó).

          > [Con số] Trong 49 năm hai tàu bay, Mặt Trời đã chở chúng đi khoảng 2 400 AU quanh Ngân Hà, gấp 14 lần quãng Voyager 1 tự đi được.

          > [Thử ngay] Kéo Voyager 1 dọc đường bay của nó để tua thời gian (từ năm 1990 trở đi).
          > [[Tua lại năm 1990|lui]] [[Về hôm nay|nay]] [[Số liệu Voyager 1|v1]]`,
        vao: (c) => c.buoc({ cheDo: 'quay', homNay: true, tocDo: 365.25, mayAnh: 'voyager', chon: 'v1', tay: 'v1' }),
        thuThach: {
          de: R`Kéo Voyager 1 tới đúng lúc nó cách Mặt Trời **một ngày ánh sáng** (173,1 AU). Đạt khi lệch dưới 0,6 AU, tức chừng hai tháng đường bay.`,
          kiem: (c) => c.daKeo.v1 && Math.abs(c.rV1 - NGAY_ANH_SANG_AU) < TT_V1_SAI,
          goiY: 'Mỗi năm Voyager 1 xa thêm 3,57 AU. Hiện nó cách khoảng 172 AU, nên chỉ cần kéo tới thêm vài tháng. Cuộn để phóng to cho dễ kéo chính xác.',
        },
        nut: {
          lui: (c) => c.datNgay(2447892.5), nay: (c) => c.datNgay(null),
          v1: (c) => c.chonCo('v1'),
        },
      },
      {
        ten: 'Một năm thiên hà, và hình dạng phụ thuộc người nhìn',
        noiDung: R`
          Mặt Trời không bay thẳng mãi. Nó đi trên một vòng gần tròn quanh tâm Ngân Hà, bán kính $R_0 \approx 26\,700$ năm ánh sáng. Một vòng mất

          $$ \begin{aligned} T = \frac{2\pi R_0}{V} &= \frac{2\pi \times 26\,700\ \text{năm ánh sáng}}{230\ \text{km/s}} \\ &\approx 2{,}19 \times 10^{8}\ \text{năm} \end{aligned} $$

          tức khoảng **220 triệu năm**, gọi là một {{năm thiên hà}}. Mặt Trời đã 4,6 tỉ tuổi, vậy mới đi được chừng **20 vòng** (21 vòng theo phép tính trên). Sách hay ghi 225–250 triệu năm vì dùng số đo $V$ và $R_0$ hơi khác; các phép đo hiện nay cho $V$ từ 220 tới 250 km/s.

          +++ Đi sâu: tính từng bước
          $V/c = 230 / 299\,792 \approx 7{,}67 \times 10^{-4}$: Mặt Trời cần khoảng $1/(7{,}67 \times 10^{-4}) \approx 1\,303$ năm để đi một năm ánh sáng. Chu vi vòng là $2\pi \times 26\,700 \approx 167\,800$ năm ánh sáng, nên một vòng mất $167\,800 \times 1\,303 \approx 2{,}19 \times 10^{8}$ năm.
          +++

          ### Kết: cái gì không phụ thuộc người nhìn?
          Cùng chuyển động của Trái Đất: đứng ở Mặt Trời thấy một elip; đứng ở Ngân Hà thấy một lò xo xiên; nhìn đủ lâu thì lò xo ấy lại cuộn quanh tâm Ngân Hà. Không cách nhìn nào «đúng hơn». Thứ mọi người đều đồng ý là **các sự kiện**: Trái Đất ở đâu, vào lúc nào. Nối chúng lại được {{đường thế giới}} trong không-thời gian bốn chiều. Phần 2, nhất là Bài 4, dựng chính đường đó.

          > [Thử ngay] [[Xem toàn bộ 150 năm đường bay|xa]] [[Xem lại cảnh mở đầu|dau]]`,
        vao: (c) => c.buoc({ cheDo: 'bay', nen: 10, namBay: 150, tocDo: 365.25, mayAnh: 'xa' }),
        nut: {
          xa: (c) => c.buoc({ cheDo: 'bay', nen: 10, namBay: 150, tocDo: 365.25, mayAnh: 'xa' }),
          dau: (c) => c.buoc({ cheDo: 'bay', nen: 10, namBay: 60, tocDo: 365.25, mayAnh: 'dau', xoay: true }),
        },
      },
    ],
    congThuc: [
      { ten: 'Tốc độ Mặt Trời quanh tâm Ngân Hà', tex: R`V \approx 230\ \text{km/s} = 828\,000\ \text{km/h} \approx 48{,}5\ \text{AU/năm}`, y: 'Các phép đo cho từ 220 tới 250 km/s.' },
      { ten: 'Định luật Kepler thứ ba', tex: R`T^2 = \frac{4\pi^2}{GM}\,a^3 \quad\Longrightarrow\quad T^2 = a^3\ \ (\text{năm, AU})`, y: '$T$: chu kỳ; $a$: bán trục lớn; $M$: khối lượng Mặt Trời. Không phụ thuộc khối lượng hành tinh.' },
      { ten: 'Cộng vận tốc khi đổi chỗ đứng nhìn', tex: R`\vec v_{\text{Ngân Hà}} = \vec V_{\text{Mặt Trời}} + \vec v_{\text{quỹ đạo}}`, y: 'Phép cộng vận tốc của Galilei; đúng rất tốt khi tốc độ nhỏ so với ánh sáng.' },
      { ten: 'Thời gian ánh sáng', tex: R`t = \frac{d}{c}, \qquad 1\ \text{AU} \approx 499\ \text{s} \approx 8{,}3\ \text{phút}`, y: 'Một ngày ánh sáng dài khoảng 173 AU.' },
      { ten: 'Năm thiên hà', tex: R`T_{\text{TH}} = \frac{2\pi R_0}{V} \approx 2{,}2 \times 10^{8}\ \text{năm}`, y: '$R_0 \\approx 26\\,700$ năm ánh sáng: khoảng cách từ Mặt Trời tới tâm Ngân Hà.' },
    ],
    cauHoi: [
      {
        hoi: 'Nhìn từ Ngân Hà (đứng yên so với tâm Ngân Hà), đường đi của Trái Đất trong không gian có dạng gì?',
        chon: ['Một elip khép kín quanh Mặt Trời', 'Một lò xo bị kéo giãn và xô xiên', 'Một phễu xoáy kéo lê phía sau Mặt Trời', 'Một đường thẳng tuyệt đối'],
        dung: 1,
        giai: 'Vận tốc của Trái Đất là tổng của 230 km/s (chung cho cả Hệ Mặt Trời) và 29,8 km/s quay vòng. Kết quả là lò xo; vì mặt phẳng quỹ đạo nghiêng 60° so với hướng bay nên lò xo bị xô xiên. Elip là hình nhìn từ Mặt Trời. Phễu xoáy là hình sai trong video lan truyền trên mạng.',
      },
      {
        hoi: 'Sao Hỏa có bán trục lớn 1,524 AU. Theo định luật Kepler thứ ba, nó đi một vòng mất khoảng bao lâu?',
        chon: ['1,52 năm', '1,88 năm', '2,32 năm', '3,54 năm'],
        dung: 1,
        giai: R`$T = a^{1,5} = 1{,}524^{1,5} \approx 1{,}88$ năm (687 ngày). Chọn 1,52 là lấy $T = a$; 2,32 là $a^2$; 3,54 là $a^3$ (quên lấy căn bậc hai).`,
      },
      {
        hoi: 'Thu nhỏ Hệ Mặt Trời để Mặt Trời là quả bóng đường kính 1,4 m. Trái Đất khi đó cách quả bóng bao xa?',
        chon: ['1,5 m', '15 m', '150 m', '1,5 km'],
        dung: 2,
        giai: R`Tỉ lệ thu nhỏ là $1{,}4\ \text{m} / 1\,391\,400\ \text{km}$. Nhân với 149,6 triệu km được khoảng 150 m. Các hình vẽ trong sách thường đặt hành tinh sát Mặt Trời nên ta hay đoán quá gần.`,
      },
      {
        hoi: 'Sao Mộc cách Mặt Trời khoảng 5,2 AU. Ánh sáng Mặt Trời tới Sao Mộc mất bao lâu?',
        chon: ['8,3 phút', '43 phút', '4,2 giờ', 'Một ngày'],
        dung: 1,
        giai: 'Mỗi AU mất 8,3 phút ánh sáng, nên 5,2 AU mất khoảng 43 phút. 8,3 phút là của Trái Đất; 4,2 giờ là của Sao Hải Vương; một ngày ánh sáng là chỗ Voyager 1 sắp tới.',
      },
      {
        hoi: 'Vì sao khi nhìn từ Ngân Hà, mô hình vẽ quãng đường bay của Mặt Trời ngắn lại 10 lần?',
        chon: [
          'Vì Mặt Trời thật bay chậm hơn số ghi',
          'Vì lò xo thật có bước dài gấp gần 8 lần chu vi vòng của Trái Đất, trông gần như thẳng',
          'Vì mặt phẳng quỹ đạo nghiêng 60°',
          'Vì ánh sáng cần thời gian để tới mắt ta',
        ],
        dung: 1,
        giai: 'Mỗi năm Mặt Trời đi 48,5 AU còn Trái Đất chỉ lượn một vòng dài 6,28 AU. Vẽ đúng tỉ lệ thì vòng xoắn gần như biến mất. Nén 10 lần là thay đổi cách vẽ, không đổi chuyển động thật; bấm «Đúng tỉ lệ thật» để so.',
      },
      {
        hoi: 'Bạn đang ngồi yên trên ghế. Bạn đang chuyển động hay đứng yên? Trả lời cho đúng, và chỉ ra điều gì mọi người đều đồng ý.',
        dap: 'Câu hỏi chưa đủ nghĩa nếu không nói **so với cái gì**. So với ghế: đứng yên. So với Mặt Trời: chạy 29,8 km/s (cộng thêm vài trăm m/s do Trái Đất tự quay). So với tâm Ngân Hà: khoảng 230 km/s. Không có chỗ đứng nào là đứng yên tuyệt đối. Điều mọi người đều đồng ý là các **sự kiện** («tôi ngồi ở ghế này lúc 9 giờ») và đường thế giới nối chúng trong không-thời gian.',
      },
    ],
    docThem: [
      'A. Einstein, *Relativity: The Special and the General Theory* (1916), mấy mục đầu: hệ quy chiếu và tính tương đối của chuyển động (ví dụ hòn đá thả từ toa tàu).',
      'E. F. Taylor và J. A. Wheeler, *Spacetime Physics* (bản 2, 1992), ch. 3: nguyên lý tương đối, không có chuyển động tuyệt đối.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), ch. 10: Hệ Mặt Trời là phòng thí nghiệm kiểm tra thuyết tương đối rộng (Bài 13 sẽ quay lại).',
    ],
    thuatNgu: [
      { vi: 'bán trục lớn', en: 'semi-major axis', nghia: 'Nửa đường kính dài nhất của elip quỹ đạo; cũng bằng trung bình của khoảng cách gần nhất và xa nhất tới Mặt Trời. Kí hiệu $a$.' },
      { vi: 'định luật Kepler', en: "Kepler's laws", nghia: 'Ba quy luật chuyển động của hành tinh: quỹ đạo elip; quét diện tích đều; $T^2$ tỉ lệ với $a^3$. Newton suy ra cả ba từ định luật hấp dẫn.' },
      { vi: 'nhật quyển', en: 'heliosphere', nghia: 'Vùng không gian quanh Mặt Trời do gió Mặt Trời chiếm chỗ; mặt ngoài (nhật quyển biên) cách Mặt Trời khoảng 120 AU về phía Voyager bay.' },
      { vi: 'năm thiên hà', en: 'galactic year', nghia: 'Thời gian Mặt Trời đi hết một vòng quanh tâm Ngân Hà, khoảng 220–250 triệu năm tuỳ số đo dùng.' },
      { vi: 'hệ quy chiếu', en: 'reference frame', nghia: 'Vật hay nhóm vật được chọn làm mốc để nói vị trí và chuyển động; ví dụ «so với Mặt Trời», «so với tâm Ngân Hà».' },
    ],
  },
  conSo: [
    '**828 000 km/h** (230 km/s): tốc độ Mặt Trời quanh tâm Ngân Hà. Các phép đo cho từ 220 tới 250 km/s.',
    '**48,5 AU mỗi năm**: quãng Mặt Trời bay, gấp gần 8 lần vòng quỹ đạo của Trái Đất (6,28 AU).',
    '**8,3 phút**: ánh sáng đi 1 AU = 149,6 triệu km. Tới Sao Hải Vương mất 4,2 giờ.',
    '**$T^2 = a^3$**: định luật Kepler thứ ba (năm, AU), đúng tới 0,2% cho cả tám hành tinh.',
    '**172 AU ≈ một ngày ánh sáng**: Voyager 1 sau 49 năm bay. Tới ngôi sao gần nhất cần thêm khoảng 75 000 năm.',
    '**Khoảng 220 triệu năm**: một năm thiên hà; Mặt Trời mới đi được chừng 20 vòng.',
  ],
  hieuDung: '**Không phải «cơn lốc xoáy».** Trên mạng có video vẽ các hành tinh xoáy thành phễu phía sau Mặt Trời. Hình đó sai ở hai chỗ: hành tinh không bị kéo lê phía sau (lúc ở trước, lúc ở sau Mặt Trời), và mặt phẳng quỹ đạo nghiêng khoảng 60° chứ không vuông góc với hướng bay.',
  nguon: 'NASA/JPL, bảng quỹ đạo gần đúng của các hành tinh (Standish và Williams, 1800–2050). JPL Horizons cho vị trí và vận tốc Voyager 1, 2 (ngày 11/11/2026). Trục quay và tốc độ tự quay của hành tinh: IAU WGCCRE (Archinal và cộng sự 2018). Bán kính hành tinh: NASA Planetary Fact Sheet. Thời điểm và khoảng cách Voyager rời nhật quyển: NASA/JPL (2012, 2018). Proxima Centauri cách 4,25 năm ánh sáng. Tốc độ Mặt Trời và R₀: các phép đo 220–250 km/s; GRAVITY Collaboration 2019–2021 cho R₀ ≈ 8,2 kpc. Hằng số: CODATA 2018, IAU 2012.',

  tao(app) {
    const scene = new THREE.Scene();
    const vuTru = new THREE.Group();   // mọi thứ trừ ánh sáng; xoay khi nhìn từ Ngân Hà
    scene.add(vuTru);
    const camera = app.camera;
    const am = app.am, tt = app.tt;
    const tam = V3(hdSangBa(TRUC_NGAN_HA.tam));
    const cucBac = V3(hdSangBa(TRUC_NGAN_HA.cucBac));
    const vBay = V3(hdSangBa(V_MAT_TROI)); // AU/năm, hệ trục cảnh
    const thamThu = app.imLang ? new URLSearchParams(location.search) : new URLSearchParams();

    // Bầu trời thật: sao thật, dải Ngân Hà thật đúng hướng, nét chòm Thiên Nga (nơi Mặt Trời đang bay tới).
    const bauTroi = taoNenSao({ soSao: 7000, daiNganHa: { tam: tam.toArray(), cucBac: cucBac.toArray() }, chomSao: ['Cyg'] });
    vuTru.add(bauTroi);
    const huongCyg = bauTroi.huongChomSao('Cyg') ?? HUONG_BAY.clone();
    const huongDeneb = bauTroi.huongSao('Deneb') ?? huongCyg.clone();
    bauTroi.datDoSang(1.2);
    const netChomSao = bauTroi.children.find((o) => o.isLineSegments);   // nét chòm Thiên Nga: chỉ hiện khi nhìn từ Ngân Hà
    const nhanCyg = taoNhan(chuCanh("canh.chom-thien-nga-sao-deneb-mat-troi-dang", "Chòm Thiên Nga<small>sao Deneb · Mặt Trời đang bay về phía này</small>"), 'tran');
    nhanCyg.element.style.color = '#cfe0ff';
    const nhanDeneb = taoNhan(chuCanh("canh.thien-nga", "Thiên Nga"), 'mo tran');
    vuTru.add(nhanCyg, nhanDeneb);
    scene.add(new THREE.AmbientLight(0xffffff, 0.07));
    scene.add(new THREE.PointLight(0xfff4e6, 3.2, 0, 0));

    // ----- Mặt Trời -----
    const matTroi = taoMatTroi();
    matTroi.datDoSang(0.75);
    matTroi.datSangBeMat(1.5);
    vuTru.add(matTroi.nhom);
    const nhanMT = taoNhan(chuCanh("canh.mat-troi", "Mặt Trời"), 'vang dam');
    vuTru.add(nhanMT);

    // ----- Hành tinh: thư viện thiên thể (vân shader, khí quyển, bờ biển thật của Trái Đất, bóng vành Sao Thổ) -----
    const tmp = [0, 0, 0], tmp2 = [0, 0, 0];
    const Y = new THREE.Vector3(0, 1, 0);
    const jdNay = jdTuMs(Date.now());
    const hanhTinh = HANH_TINH.map((ht) => {
      const nhom = new THREE.Group();
      const truc = new THREE.Group();
      const [ra, dec, W0, Wn] = TRUC_QUAY[ht.id];
      truc.quaternion.setFromUnitVectors(Y, V3(hdSangBa(cucHoangDao(ra, dec))).normalize());
      const vt = ht.id === 'dat'
        ? taoTraiDat({ banKinh: 1, nghieng: 0, chiTiet: 128 })
        : taoHanhTinh({ id: ht.id, banKinh: 1, nghieng: 0, chiTiet: ht.id === 'moc' || ht.id === 'tho' ? 128 : 96 });
      vt.datNguonSang([0, 0, 0]);   // Mặt Trời ở gốc toạ độ thế giới (cả khi cảnh xoay quanh gốc)
      truc.add(vt.nhom);
      nhom.add(truc);
      const nhan = taoNhan(ht.ten, '', { khiBam: () => chon(ht.id) });
      nhom.add(nhan);
      vuTru.add(nhom);

      // đường quỹ đạo (elip tức thời) và đuôi sáng phía sau hành tinh
      const el = phanTuQuyDao(ht, jdNay);
      const nq = 256;
      const pts = new Float32Array((nq + 1) * 3);
      for (let i = 0; i <= nq; i++) {
        hdSangBa(diemTrenQuyDao(el, (i / nq) * 2 * Math.PI, tmp), tmp2);
        pts.set(tmp2, i * 3);
      }
      const quyDao = duongDayTinh(pts, { mau: ht.mau, rong: 1.2, doMo: 0.3, cong: false });
      vuTru.add(quyDao.line);
      const mauVet = MAU_VET[ht.id] ?? ht.mau;
      const cung = new VetSang(N_CUNG, { mau: mauVet, rong: 2.2, sang: 1.1, dau: 1.2, mu: 1.25 });
      vuTru.add(cung.mesh);
      const vet = new VetSang(N_VET, { mau: mauVet, rong: 1.7, sang: 1.05, dau: 2.2, mu: 1.15 });
      vet.mesh.visible = false;
      vuTru.add(vet.mesh);

      const p = {
        ht, nhom, truc, vt, cau: vt.cau, nhan, quyDao, cung, vet, W0, Wn,
        rHien: rHienThi(ht.banKinhKm), pxMin: pxToiThieu(ht.banKinhKm), r: 0.01,
        viTri: new THREE.Vector3(), el, nghieng: doNghiengTruc(ht),
        vong: Math.floor(kinhDoTrungBinh(ht, jdNay) / 360), nhacCuoi: -1,
      };
      // Rê chuột: số liệu thật; bấm: bay tới gần.
      p.tcRe = {
        ten: ht.ten, mau: mauVet, banKinhPx: 14,
        moTa: () => moTaHanhTinh(p),
        khiBam: () => { am.phat('bam'); theo(ht.id); },
      };
      tt.them(nhom, p.tcRe);
      return p;
    });
    const dat = hanhTinh[2], hoa = hanhTinh[3];

    // ----- Vành đai tiểu hành tinh và vành đai Kuiper (hạt minh hoạ) -----
    const daiTH = taoVanhDai({ n: 12000, aMin: 2.1, aMax: 3.3, nghieng: 8, hat: 41, mau: 0xd6c2a4, co: 3, doSang: 0.9 });
    const daiK = taoVanhDai({ n: 9000, aMin: 30, aMax: 50, nghieng: 9, hat: 42, mau: 0x9fbbe6, co: 2.8, doSang: 0.75, mat: (rnd) => (rnd() < 0.6 ? 42 + 6 * rnd() : 30 + 20 * rnd()) });
    vuTru.add(daiTH, daiK);
    const nhanTH = taoNhan(chuCanh("canh.vanh-dai-tieu-hanh-tinh-2-1-3", "Vành đai tiểu hành tinh<small>2,1–3,3 AU · hạt minh hoạ phân bố</small>"), 'mo');
    nhanTH.position.set(2.7 * Math.cos(-2.2), 0, 2.7 * Math.sin(-2.2));
    const nhanK = taoNhan(chuCanh("canh.vanh-dai-kuiper-30-50-au-hat-minh", "Vành đai Kuiper<small>30–50 AU · hạt minh hoạ phân bố</small>"), 'mo');
    nhanK.position.set(44 * Math.cos(-2.4), 0, 44 * Math.sin(-2.4));
    vuTru.add(nhanTH, nhanK);

    // ----- Thước đo khoảng cách: vòng tròn ghi khoảng cách và thời gian ánh sáng -----
    const thuoc = new THREE.Group();
    const dsNhanThuoc = [];
    for (const r of [1, 5, 10, 30, 100]) {
      thuoc.add(duongTron(r, { n: 192, mau: 0x9fb6ff, doMo: 0.2 }));
      const n = taoNhan(chuCanh("canh.au-anh-sang", "{0} AU<small>{1} ánh sáng</small>", [r, thoiGianAnhSang(r)]), 'mo tran');
      n.position.set(r * Math.cos(1.05), 0, r * Math.sin(1.05));
      thuoc.add(n);
      dsNhanThuoc.push(n);
    }
    thuoc.visible = false;
    vuTru.add(thuoc);

    // ----- Voyager -----
    const voyager = VOYAGER.map((v) => {
      const cham = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xeaf2ff).multiplyScalar(1.6) }));
      const lap = taoDom(new THREE.Color(0xcfe0ff).multiplyScalar(1.4), 1);   // đốm sáng nhỏ cho dễ thấy khi lùi xa
      const nhan = taoNhan(v.ten, 'dam', { khiBam: () => chon(v.id) });
      const day = new DuongDay(2, { mau: 0xffffff, rong: 1, doMo: 0.18, net: [3, 3] });
      const vet = new VetSang(64, { mau: 0xdfe8ff, rong: 1.6, sang: 0.9, dau: 1.2, mu: 1.1 });
      vet.mesh.visible = false;
      vuTru.add(cham, lap, nhan, day.line, vet.mesh);
      // chỗ tàu vượt ranh giới nhật quyển (từ véc-tơ JPL ngoại suy thẳng)
      const rRa = v.id === 'v1' ? 121 : 119;
      const a = v.v[0] ** 2 + v.v[1] ** 2 + v.v[2] ** 2, b = 2 * (v.r0[0] * v.v[0] + v.r0[1] * v.v[1] + v.r0[2] * v.v[2]);
      const cc = v.r0[0] ** 2 + v.r0[1] ** 2 + v.r0[2] ** 2 - rRa * rRa;
      const dtRa = (-b + Math.sqrt(b * b - 4 * a * cc)) / (2 * a);   // nghiệm sau: lúc đi ra
      const pRa = V3(hdSangBa(viTriVoyager(v, v.jd0 + dtRa, [0, 0, 0])));
      const moc = new THREE.Mesh(new THREE.TorusGeometry(1, 0.18, 8, 32), new THREE.MeshBasicMaterial({ color: 0x8fe3a8, transparent: true, opacity: 0.9 }));
      moc.position.copy(pRa);
      moc.lookAt(0, 0, 0);
      const nhanRa = taoNhan(`${v.id === 'v1' ? chuCanh("canh.voyager-1-ra-khoi-nhat-quyen", "Voyager 1 ra khỏi nhật quyển") : chuCanh("canh.voyager-2-ra-khoi-nhat-quyen", "Voyager 2 ra khỏi nhật quyển")}<small>${v.id === 'v1' ? chuCanh("canh.thang-8-2012-121-au", "tháng 8/2012 · 121 AU") : chuCanh("canh.thang-11-2018-119-au", "tháng 11/2018 · 119 AU")}</small>`, 'tran');
      nhanRa.element.style.color = '#8fe3a8';
      nhanRa.position.copy(pRa);
      vuTru.add(moc, nhanRa);
      const k = { v, cham, lap, nhan, day, vet, moc, nhanRa, viTri: new THREE.Vector3(), hd: [0, 0, 0] };
      tt.them(cham, {
        ten: v.ten, mau: 0xdfe8ff, banKinhPx: 14,
        moTa: () => moTaVoyager(k),
        khiBam: () => { am.phat('bam'); chonCo(v.id); },
      });
      return k;
    });

    // ----- Mũi tên chỉ hướng (nét đậm có quầng) -----
    function taoMuiTen(mau) {
      const nhom = new THREE.Group();
      const than = new DuongDay(2, { mau, rong: 2.4, quang: 0.1, sang: 1.25 });
      const dau = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(mau).multiplyScalar(1.5), transparent: true, opacity: 0.95 }));
      nhom.add(than.line, dau);
      return {
        nhom,
        dat(huong, dai, coDau = dai) {
          than.dat(0, 0, 0, 0); than.dat(1, huong.x * (dai - coDau * 0.08), huong.y * (dai - coDau * 0.08), huong.z * (dai - coDau * 0.08)); than.xong(2);
          dau.position.copy(huong).multiplyScalar(dai - coDau * 0.05);
          dau.quaternion.setFromUnitVectors(Y, huong);
          dau.scale.set(coDau * 0.03, coDau * 0.11, coDau * 0.03);
        },
      };
    }
    const muiBay = taoMuiTen(0xf3c66f);
    const nhanBay = taoNhan(chuCanh("canh.huong-mat-troi-bay-ve-phia-chom-thien", "Hướng Mặt Trời bay<small>về phía chòm Thiên Nga · 230 km/s = 828 000 km/h</small>"), 'vang dam');
    const huongTam = tam.clone().normalize();
    const muiTam = taoMuiTen(0x8fb4ff);
    const nhanTam = taoNhan(chuCanh("canh.tam-ngan-ha-cach-26-700-nam-anh", "Tâm Ngân Hà<small>cách 26 700 năm ánh sáng</small>"), 'xanh');
    vuTru.add(muiBay.nhom, nhanBay, muiTam.nhom, nhanTam);

    // Góc 60° giữa hướng bay và mặt phẳng quỹ đạo
    const chieu = HUONG_BAY.clone().setY(0).normalize();
    const gocNhom = new THREE.Group();
    const gocChieu = new DuongDay(2, { mau: 0x9fb6ff, rong: 1.6, doMo: 0.8, net: [0.5, 0.35] });
    const gocCung = new DuongDay(33, { mau: 0xf3c66f, rong: 2, quang: 0.12 });
    const nhanGoc = taoNhan(chuCanh("canh.giua-huong-bay-va-mat-phang-quy-dao", "≈ {0}°<small>giữa hướng bay và mặt phẳng quỹ đạo</small>", [so(Math.asin(HUONG_BAY.y) / DO, 0)]), 'vang');
    gocNhom.add(gocChieu.line, gocCung.line, nhanGoc);
    gocNhom.visible = false;
    vuTru.add(gocNhom);
    const vTam = new THREE.Vector3();

    // Đường Mặt Trời đã đi (chỉ ở chế độ bay) và mặt phẳng quỹ đạo (để thấy góc nghiêng 60°)
    const vetMT = new VetSang(2, { mau: 0xffd27a, rong: 1.5, sang: 0.75, dau: 0.6, mu: 0.9 });
    vetMT.mesh.visible = false;
    const matPhang = new THREE.Mesh(
      new THREE.CircleGeometry(31, 96),
      new THREE.MeshBasicMaterial({ color: 0x86a8ff, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }),
    );
    matPhang.rotation.x = -Math.PI / 2;
    const vienPhang = duongTron(31, { n: 192, mau: 0x86a8ff, doMo: 0.35 });
    matPhang.visible = vienPhang.visible = false;
    const nhanPhang = taoNhan(chuCanh("canh.mat-phang-quy-dao-nghieng-khoang-60-so", "Mặt phẳng quỹ đạo<small>nghiêng khoảng 60° so với hướng bay</small>"), 'mo');
    nhanPhang.position.set(-22, 0, 22);
    nhanPhang.visible = false;
    vuTru.add(vetMT.mesh, matPhang, vienPhang, nhanPhang);

    // Ranh giới nhật quyển, vẽ sơ lược bằng một mặt cầu 120 AU
    const nhatQuyen = taoVoCau(120, 0x5c8dff, 0.3);
    const nhanNQ = taoNhan(chuCanh("canh.ranh-gioi-nhat-quyen-khoang-120-au-ve", "Ranh giới nhật quyển<small>khoảng 120 AU · vẽ sơ lược</small>"), 'mo');
    nhanNQ.position.set(0, 120, 0);
    vuTru.add(nhatQuyen, nhanNQ);

    // ----- Hành tinh thử (bước 4): kéo ra xa, lại gần để thấy T = a^1,5 -----
    const thu = { a: 2.5, phi: 2.2, keo: false, vong: 0, nhacCuoi: -1 };
    const vongThu = new DuongDay(161, { mau: 0xff7aa8, rong: 1.4, doMo: 0.55 });
    const domThu = taoDom(new THREE.Color(0xff7aa8).multiplyScalar(2.2), 1);
    const nhanThu = taoNhan(chuCanh("canh.hanh-tinh-thu", "Hành tinh thử"), 'hong tran');
    const nhomThu = new THREE.Group();
    nhomThu.add(vongThu.line, domThu, nhanThu);
    nhomThu.visible = false;
    vuTru.add(nhomThu);
    const viTriThu = (out) => out.set(thu.a * Math.cos(thu.phi), 0, -thu.a * Math.sin(thu.phi));
    function veVongThu() {
      for (let i = 0; i <= 160; i++) { const g = (i / 160) * 2 * Math.PI; vongThu.dat(i, thu.a * Math.cos(g), 0, thu.a * Math.sin(g)); }
      vongThu.xong(161);
      nhanThu.datChu(chuCanh("canh.hanh-tinh-thu-a-au-t-nam", "Hành tinh thử<small>a = {0} AU · T = {1} năm</small>", [so(thu.a, 2), so(chuKyKepler(thu.a), 2)]));
    }
    veVongThu();

    // ----- Trạng thái -----
    let jd = jdNay;
    let cheDo = 'quay';
    let tocDo = 30.4375;     // ngày mô phỏng mỗi giây thật
    let namBay = 0;
    let chonId = null;
    let nen = 10;            // nén quãng đường bay khi vẽ (1 = đúng thật) để nhìn rõ vòng xoắn
    let tMT = 0;             // thời gian cho bề mặt Mặt Trời sôi
    let theoId = null, choTheo = 0;
    const viTriTheo = new THREE.Vector3();
    let hienGoc = false;
    let gioThuc = 0;         // đồng hồ thật (giây), để giãn các nốt nhạc
    let nhipKepler = false;  // đang ở bước định luật Kepler (mỗi vòng một nốt, đủ nhịp)
    const daKeo = { dat: false, v1: false, thu: false };   // người học đã tự kéo trong bước này chưa (cho thử thách)
    const JD_MIN = 2378496.5, JD_MAX = 2469807.5;        // 1800–2050: phạm vi của bảng quỹ đạo JPL

    // ----- Điều khiển -----
    const bang = app.bang;
    const GOC = {
      trong: () => [[0.9, 2.3, 4.4], [0, 0, 0]],
      thuoc: () => [[3, 13, 25], [0, 0, 0]],
      kepler: () => [[-2.2, 10.5, 15.5], [0, 0, 0]],
      ngoai: () => [[-12, 34, 66], [0, 0, 0]],
      voyager: () => [[120, 260, 470], [0, 0, 0]],
      dau: () => GOC_DAU,
      ngang: () => GOC_NGANG,
      bay: () => gocBay(nen === 1 ? 900 : 90),
      truoc: () => gocBay(nen === 1 ? 700 : 110, 'truoc'),
      phang: () => gocBay(nen === 1 ? 900 : 130, 'phang'),
      xa: () => gocBay(nen === 1 ? 6000 : 900, 'ngang', 0.1),   // đích gần Mặt Trời hơn để nhãn bên phải không chui dưới bảng bài giảng
    };
    let fovDich = 45;
    const goc = (ten, giay = 1.8) => { theoId = null; fovDich = ten === 'dau' ? FOV_DAU : 45; app.bayToi(...GOC[ten](), giay); };

    const dkCheDo = bang.chon({
      nhan: chuCanh("canh.dung-o-dau-de-nhin", "Đứng ở đâu để nhìn?"),
      luaChon: [
        { giaTri: 'quay', nhan: chuCanh("canh.nhin-tu-mat-troi", "Nhìn từ Mặt Trời"), moTa: chuCanh("canh.mat-troi-dung-yen-hanh-tinh-chay-vong", "Mặt Trời đứng yên, hành tinh chạy vòng tròn") },
        { giaTri: 'bay', nhan: chuCanh("canh.nhin-tu-ngan-ha", "Nhìn từ Ngân Hà"), moTa: chuCanh("canh.mat-troi-bay-230-km-s-hanh-tinh", "Mặt Trời bay 230 km/s, hành tinh vẽ đường xoắn ốc") },
      ],
      giaTri: cheDo,
      khiDoi: (v) => buoc({ cheDo: v, namBay: 30, tocDo: v === 'bay' ? 365.25 : 30.4375, mayAnh: v === 'bay' ? 'bay' : 'trong' }),
    });
    const dkTocDo = bang.chon({
      nhan: chuCanh("canh.moi-giay-troi-qua", "Mỗi giây trôi qua"),
      luaChon: [
        { giaTri: 0, nhan: chuCanh("canh.dung-yen", "đứng yên") }, { giaTri: 1 / 24, nhan: chuCanh("canh.1-gio", "1 giờ") }, { giaTri: 1, nhan: chuCanh("canh.1-ngay", "1 ngày") }, { giaTri: 30.4375, nhan: chuCanh("canh.1-thang", "1 tháng") },
        { giaTri: 365.25, nhan: chuCanh("canh.1-nam", "1 năm") }, { giaTri: 3652.5, nhan: chuCanh("canh.10-nam", "10 năm") },
      ],
      giaTri: tocDo,
      khiDoi: (v) => { tocDo = v; },
    });
    const namCuaJd = (j) => 2000 + (j - JD_J2000) / 365.25;
    const dkNgay = bang.thanhTruot({
      nhan: chuCanh("canh.dong-thoi-gian-1800-2050", "Dòng thời gian (1800–2050)"), min: 1800, max: 2050, buoc: 0.01, giaTri: namCuaJd(jd),
      hienThi: () => (jd > JD_MAX || jd < JD_MIN ? chuCanh("canh.nam-uoc-tinh", "năm {0} · ước tính", [Math.round(namCuaJd(jd))]) : ngayThang(jd)),
      khiDoi: (v) => { jd = JD_J2000 + (v - 2000) * 365.25; dungThoiGian(); daKeo.dat = true; },
    });
    bang.chon({
      nhan: chuCanh("canh.bay-toi", "Bay tới"),
      luaChon: [
        { giaTri: 'trong', nhan: chuCanh("canh.vong-trong", "Vòng trong") }, { giaTri: 'ngoai', nhan: chuCanh("canh.hanh-tinh-ngoai", "Hành tinh ngoài") },
        { giaTri: 'voyager', nhan: chuCanh("canh.voyager", "Voyager") }, { giaTri: 'dat', nhan: chuCanh("canh.trai-dat", "Trái Đất") }, { giaTri: 'tho', nhan: chuCanh("canh.sao-tho", "Sao Thổ") }, { giaTri: 'mt', nhan: chuCanh("canh.mat-troi", "Mặt Trời") },
      ],
      giaTri: null,
      khiDoi: (v) => {
        if (v === 'dat' || v === 'tho' || v === 'mt') theo(v);
        else { if (cheDo !== 'quay') datCheDo('quay'); goc(v); }
      },
    });
    const dkNen = bang.chon({
      nhan: chuCanh("canh.ve-duong-bay", "Vẽ đường bay"),
      luaChon: [
        { giaTri: 10, nhan: chuCanh("canh.nen-10-lan-cho-de-nhin", "Nén 10 lần cho dễ nhìn"), moTa: chuCanh("canh.quang-duong-mat-troi-bay-duoc-ve-ngan", "Quãng đường Mặt Trời bay được vẽ ngắn lại 10 lần để thấy rõ vòng xoắn") },
        { giaTri: 1, nhan: chuCanh("canh.dung-ti-le-that", "Đúng tỉ lệ thật"), moTa: chuCanh("canh.vong-xoan-that-bi-keo-gian-rat-dai", "Vòng xoắn thật bị kéo giãn rất dài, gần như đường thẳng") },
      ],
      giaTri: nen,
      khiDoi: (v) => datNen(v),
    });
    dkNen.el.hidden = true;
    const dkThuoc = bang.congTac({ nhan: chuCanh("canh.thuoc-do-khoang-cach-au-va-thoi-gian", "Thước đo khoảng cách (AU và thời gian ánh sáng)"), giaTri: false, khiDoi: (v) => { thuoc.visible = v; } });
    const dkDai = bang.congTac({ nhan: chuCanh("canh.vanh-dai-tieu-hanh-tinh-va-kuiper", "Vành đai tiểu hành tinh và Kuiper"), giaTri: true, khiDoi: (v) => { daiTH.visible = daiK.visible = v && cheDo !== 'bay'; } });
    bang.nut([{ nhan: chuCanh("canh.ve-hom-nay", "Về hôm nay"), khiBam: () => datNgay(null) }]);
    const the = bang.the(chuCanh("canh.re-chuot-vao-mot-hanh-tinh-de-xem", "Rê chuột vào một hành tinh để xem số liệu; bấm vào tên của nó để ghim số liệu ở đây."));

    // Đồ thị định luật Kepler thứ ba (thang logarit), vẽ một lần
    const doThi = bang.doThi(190);
    {
      const g = doThi.ctx;
      const lg = Math.log10;
      const { X, Y: YY } = khungDoThi(g, {
        rong: doThi.rong, cao: doThi.cao, x0: lg(0.3), x1: lg(40), y0: lg(0.15), y1: lg(300),
        nhanX: chuCanh("canh.ban-truc-lon-a-au", "bán trục lớn a (AU)"), nhanY: chuCanh("canh.chu-ky-t-nam", "chu kỳ T (năm)"),
        vachX: [[lg(0.5), chuCanh("canh.0-5", "0,5")], [lg(1), '1'], [lg(2), '2'], [lg(5), '5'], [lg(10), '10'], [lg(20), '20']],
        vachY: [[lg(0.3), chuCanh("canh.0-3", "0,3")], [lg(1), '1'], [lg(3), '3'], [lg(10), '10'], [lg(30), '30'], [lg(100), '100']],
        le: [38, 10, 10, 24],
      });
      g.strokeStyle = MAU.vang; g.lineWidth = 1.6; g.globalAlpha = 0.7;
      g.beginPath(); g.moveTo(X(lg(0.3)), YY(1.5 * lg(0.3))); g.lineTo(X(lg(40)), YY(1.5 * lg(40))); g.stroke();
      g.globalAlpha = 1;
      g.font = '10px -apple-system, "Helvetica Neue", sans-serif';
      g.textAlign = 'left'; g.textBaseline = 'middle';
      for (const ht of HANH_TINH) {
        const x = X(lg(ht.a[0])), y = YY(lg(ht.chuKyNam));
        g.fillStyle = `#${new THREE.Color(ht.mau).getHexString()}`;
        g.beginPath(); g.arc(x, y, 3.6, 0, 2 * Math.PI); g.fill();
        g.fillStyle = MAU.chu;
        const ten = ht.ten.replace('Sao ', '');
        if (ht.id === 'thuy' || ht.id === 'dat' || ht.id === 'moc') g.fillText(ten, x + 6, y + 7);
        else g.fillText(ten, x - g.measureText(ten).width - 6, y - 7);
      }
      g.fillStyle = MAU.vang; g.textAlign = 'right';
      g.fillText(chuCanh("canh.t-a-1-5-doc-3-2", "T = a^1,5 (dốc 3/2)"), X(lg(40)) - 4, YY(1.5 * lg(40)) + 14);
    }
    doThi.el.hidden = true;

    // ----- Tay nắm kéo được trong cảnh -----
    function dungThoiGian() { if (tocDo !== 0) { tocDo = 0; dkTocDo.dat(0); } }
    const kepJd = (j) => Math.min(JD_MAX, Math.max(JD_MIN, j));
    // Trái Đất là «dòng thời gian»: kéo nó dọc quỹ đạo thì ngày tháng (và mọi hành tinh) chạy theo.
    const tayDat = tt.tayNam({
      viTri: [1, 0, 0], mau: 0x7fcaff, co: 0.012,
      ten: chuCanh("canh.trai-dat-dong-thoi-gian", "Trái Đất · dòng thời gian"), moTa: chuCanh("canh.keo-doc-quy-dao-de-tua-thoi-gian", "Kéo dọc quỹ đạo để tua thời gian tới lui; mọi hành tinh chạy theo đúng ngày."),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 1, 0], qua: [0, 0, 0] },
      gioiHan: (q) => q.setY(0).setLength(Math.max(0.5, dat.viTri.length())),
      nhan: chuCanh("canh.keo-trai-dat-de-tua-thoi-gian", "Kéo Trái Đất để tua thời gian"),
      khiNam: () => { dungThoiGian(); },
      khiKeo: (q) => { keoDatToi(q); daKeo.dat = true; },
    });
    function keoDatToi(q) {
      // góc hoàng kinh đích của Trái Đất; tua jd tới chỗ Trái Đất có đúng góc ấy (hai lần Newton là đủ)
      const lamDich = Math.atan2(-q.z, q.x);
      for (let k = 0; k < 3; k++) {
        capNhatViTri(dat);
        const lam = Math.atan2(-dat.viTri.z, dat.viTri.x);
        const d = Math.atan2(Math.sin(lamDich - lam), Math.cos(lamDich - lam));
        jd = kepJd(jd + (d / (2 * Math.PI)) * 365.256);
      }
      for (const p of hanhTinh) p.vong = Math.floor(kinhDoTrungBinh(p.ht, jd) / 360);
    }
    // Hành tinh thử (bước 4)
    const tayThu = tt.tayNam({
      viTri: [thu.a, 0, 0], mau: 0xff7aa8, co: 0.03,
      ten: chuCanh("canh.hanh-tinh-thu", "Hành tinh thử"), moTa: () => chuCanh("canh.keo-ra-xa-hay-lai-gan-mat-troi", "Kéo ra xa hay lại gần Mặt Trời.<br>a = <span class=\"so\">{0} AU</span> · T = a<sup>1,5</sup> = <span class=\"so\">{1} năm</span>", [so(thu.a, 2), so(chuKyKepler(thu.a), 2)]),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 1, 0], qua: [0, 0, 0] },
      gioiHan: (q) => { q.setY(0); const r = q.length(); return r < 1e-6 ? q.set(0.6, 0, 0) : q.setLength(Math.min(32, Math.max(0.6, r))); },
      nhan: chuCanh("canh.keo-hanh-tinh-thu-ra-xa-lai-gan", "Kéo hành tinh thử ra xa, lại gần"),
      khiNam: () => { thu.keo = true; },
      khiKeo: (q) => { thu.a = q.length(); thu.phi = Math.atan2(-q.z, q.x); veVongThu(); daKeo.thu = true; },
      khiTha: () => { thu.keo = false; },
    });
    // Voyager 1 trên đường bay thẳng của nó: kéo để tua thời gian (từ 1990)
    const v1 = VOYAGER[0];
    const u1 = V3(hdSangBa(v1.v)).normalize(), toc1 = Math.hypot(...v1.v);   // AU mỗi ngày
    const goc1 = V3(hdSangBa(v1.r0));
    const tayV1 = tt.tayNam({
      viTri: goc1.toArray(), mau: 0xdfe8ff, co: 1.2,
      ten: chuCanh("canh.voyager-1-dong-thoi-gian", "Voyager 1 · dòng thời gian"), moTa: () => chuCanh("canh.keo-doc-duong-bay-de-tua-thoi-gian", "Kéo dọc đường bay để tua thời gian.<br>Cách Mặt Trời <span class=\"so\">{0} AU</span> = {1} ánh sáng", [so(voyager[0].viTri.length(), 1), thoiGianAnhSang(voyager[0].viTri.length())]),
      rangBuoc: { kieu: 'duong', qua: goc1.toArray(), huong: u1.toArray() },
      gioiHan: (q) => { const s = q.clone().sub(goc1).dot(u1); const j = kepJd(Math.max(JD_VOYAGER_TIN_DUOC, v1.jd0 + s / toc1)); return q.copy(goc1).addScaledVector(u1, (j - v1.jd0) * toc1); },
      nhan: chuCanh("canh.keo-voyager-1-de-tua-thoi-gian", "Kéo Voyager 1 để tua thời gian"),
      khiNam: () => { dungThoiGian(); },
      khiKeo: (q) => { jd = kepJd(Math.max(JD_VOYAGER_TIN_DUOC, v1.jd0 + q.clone().sub(goc1).dot(u1) / toc1)); for (const p of hanhTinh) p.vong = Math.floor(kinhDoTrungBinh(p.ht, jd) / 360); daKeo.v1 = true; },
    });
    let tayDang = null;      // tay nắm đang hiện: 'dat' | 'thu' | 'v1' | null
    function hienTay(ten) {
      tayDang = ten;
      tayDat.an(ten !== 'dat');
      tayThu.an(ten !== 'thu');
      tayV1.an(ten !== 'v1');
      nhomThu.visible = ten === 'thu';
    }
    hienTay(null);
    // Mặt Trời: rê để xem, bấm để bay tới.
    tt.them(matTroi.cau, {
      ten: chuCanh("canh.mat-troi", "Mặt Trời"), mau: 0xffc46b, banKinhPx: 18,
      moTa: chuCanh("canh.ngoi-sao-lun-vang-ban-kinh-696-000", "Ngôi sao lùn vàng, bán kính <span class=\"so\">696 000 km</span><br>Chiếm 99,86% khối lượng Hệ Mặt Trời<br>Bay quanh tâm Ngân Hà <span class=\"so\">230 km/s</span>"),
      khiBam: () => { am.phat('bam'); theo('mt'); },
    });

    function datNen(v) {
      nen = v;
      dkNen.dat(v);
      if (cheDo === 'bay') app.bayToi(...GOC.bay(), 1.6);
    }
    function datNgay(j) {
      jd = j ?? jdTuMs(Date.now()); namBay = Math.min(namBay, 30);
      for (const p of hanhTinh) p.vong = Math.floor(kinhDoTrungBinh(p.ht, jd) / 360);
    }

    function datCheDo(m) {
      cheDo = m;
      const bay = m === 'bay';
      for (const p of hanhTinh) { p.vet.mesh.visible = bay; p.cung.mesh.visible = !bay; p.quyDao.mat.opacity = bay ? 0.12 : 0.3; }
      daiTH.visible = daiK.visible = !bay && dkDai.lay();
      for (const v of voyager) { v.vet.mesh.visible = bay; v.day.line.visible = !bay; }
      vetMT.mesh.visible = bay;
      if (netChomSao) netChomSao.visible = bay;
      matPhang.visible = vienPhang.visible = bay;
      dkCheDo.dat(m);
      dkNen.el.hidden = !bay;
      if (bay) { theoId = null; if (tayDang) hienTay(null); }
    }

    // Đặt toàn bộ trạng thái cho một bước của bài giảng (thứ không nêu thì về mặc định).
    let lanDau = true;
    function buoc(o = {}) {
      const k = { ...MAC_DINH, ...o };
      if (k.cheDo) datCheDo(k.cheDo);
      if (lanDau) { lanDau = false; vuTru.quaternion.copy(k.cheDo === 'bay' ? Q_BAY : new THREE.Quaternion()); }
      if (k.nen) { nen = k.nen; dkNen.dat(nen); }
      if (k.homNay) datNgay(null);
      if (k.namBay != null) namBay = k.namBay;
      if (k.tocDo != null) { tocDo = k.tocDo; dkTocDo.dat(tocDo); }
      thuoc.visible = k.thuoc; dkThuoc.dat(k.thuoc);
      doThi.el.hidden = !k.doThi;
      nhipKepler = !!k.doThi;
      hienGoc = k.goc;
      app.dk.autoRotate = k.xoay;
      app.dk.autoRotateSpeed = 0.12;
      chonId = null; chon(k.chon);
      theoId = null;
      daKeo.dat = daKeo.v1 = daKeo.thu = false;
      if (k.tay === 'thu') { thu.a = 2.5; thu.phi = 2.2; thu.vong = 0; veVongThu(); }
      hienTay(k.tay);
      if (k.mayAnh) goc(k.mayAnh);
    }

    // Bay lại gần một hành tinh (hoặc Mặt Trời) rồi bám theo nó.
    function theo(id) {
      if (cheDo !== 'quay') datCheDo('quay');
      vuTru.quaternion.identity();
      tocDo = 1 / 24; dkTocDo.dat(tocDo);
      app.dk.autoRotate = false;
      fovDich = 45;
      if (id === 'mt') { theoId = null; app.bayToi([0.17, 0.07, 0.26], [0, 0, 0], 2); return; }
      const p = hanhTinh.find((k) => k.ht.id === id);
      capNhatViTri(p);
      const huong = p.viTri.clone().normalize().multiplyScalar(-0.75).add(V3([0, 0.38, 0])).addScaledVector(p.viTri.clone().cross(Y).normalize(), 0.62).normalize();
      const d = p.rHien * (p.ht.vanh ? 9 : 6.5);
      app.bayToi(p.viTri.clone().addScaledVector(huong, d).toArray(), p.viTri.toArray(), 2);
      theoId = id; choTheo = 2.05; viTriTheo.copy(p.viTri);
      if (chonId !== id) chon(id);
    }

    function chon(id) {
      chonId = id == null || chonId === id ? null : id;
      for (const p of hanhTinh) p.nhan.element.classList.toggle('chon', p.ht.id === chonId);
      for (const v of voyager) v.nhan.element.classList.toggle('chon', v.v.id === chonId);
      veThe();
    }
    const chonCo = (id) => { if (chonId !== id) chon(id); };
    function moTaHanhTinh(p) {
      const ht = p.ht, r = p.viTri.length();
      return chuCanh("canh.ban-truc-lon-au-mot-vong", "{0}<br>Bán trục lớn <span class=\"so\">{1} AU</span> · một vòng <span class=\"so\">{2}</span><br>", [ht.moTa, so(ht.a[0], 3), ht.chuKyNam < 2 ? chuCanh("canh.ngay", "{0} ngày", [so(ht.chuKyNam * 365.25, 0)]) : chuCanh("canh.nam", "{0} năm", [so(ht.chuKyNam, 1)])])
        + chuCanh("canh.toc-do-quy-dao-km-s-ban-kinh", "Tốc độ quỹ đạo <span class=\"so\">{0} km/s</span> · bán kính <span class=\"so\">{1} km</span><br>", [so(ht.vKmS, 1), so(ht.banKinhKm, 0)])
        + chuCanh("canh.luc-nay-cach-mat-troi-au-anh-sang", "Lúc này cách Mặt Trời <span class=\"so\">{0} AU</span> (ánh sáng đi {1})<br><i>Bấm để bay tới gần</i>", [so(r, r < 2 ? 3 : 2), thoiGianAnhSang(r)]);
    }
    function moTaVoyager(k) {
      const r = k.viTri.length(), kms = Math.hypot(...k.v.v) * AU_KM / 86400;
      return chuCanh("canh.roi-trai-dat-cach-mat-troi-au-anh", "Rời Trái Đất {0}<br>Cách Mặt Trời <span class=\"so\">{1} AU</span> = {2} ánh sáng<br>Tốc độ <span class=\"so\">{3} km/s</span>", [ngayThang(k.v.jdPhong), so(r, 1), thoiGianAnhSang(r), so(kms, 1)]);
    }
    function veThe() {
      const p = hanhTinh.find((k) => k.ht.id === chonId);
      const v = voyager.find((k) => k.v.id === chonId);
      if (p) {
        const r = p.viTri.length();
        const ht = p.ht;
        the.dat(chuCanh("canh.cach-mat-troi-luc-nay-au-anh-sang", "<span class=\"ten\">{0}</span> · {1}<br>\n          Cách Mặt Trời lúc này: <b>{2} AU</b> (ánh sáng đi mất {3})<br>\n          Một vòng quanh Mặt Trời: <b>{4}</b> · bán trục lớn {5} AU<br>\n          Tốc độ trung bình: <b>{6} km/s</b><br>\n          Tự quay một vòng: <b>{7}</b>{8} · trục nghiêng {9}°<br>\n          Bán kính: <b>{10} km</b> ({11} lần Trái Đất)", [ht.ten, ht.moTa, so(r, r < 2 ? 3 : 2), thoiGianAnhSang(r), ht.chuKyNam < 2 ? chuCanh("canh.ngay", "{0} ngày", [so(ht.chuKyNam * 365.25, 0)]) : chuCanh("canh.nam", "{0} năm", [so(ht.chuKyNam, 1)]), so(ht.a[0], 3), so(ht.vKmS, 1), thoiGianQuay(p.Wn), p.Wn < 0 ? chuCanh("canh.quay-nguoc", " (quay ngược)") : '', so(p.nghieng, 1), so(ht.banKinhKm, 0), so(ht.banKinhKm / 6371, 2)]));
      } else if (v) {
        const r = v.viTri.length();
        const rDat = v.viTri.distanceTo(dat.viTri);
        const kms = Math.hypot(...v.v.v) * AU_KM / 86400;
        the.dat(chuCanh("canh.roi-trai-dat-cach-mat-troi-au-anh-011fd2", "<span class=\"ten\">{0}</span> · rời Trái Đất {1}<br>\n          Cách Mặt Trời: <b>{2} AU</b> = {3} ánh sáng<br>\n          Cách Trái Đất: <b>{4} AU</b> = {5} ánh sáng<br>\n          Tốc độ: <b>{6} km/s</b>, mỗi năm xa thêm {7} AU<br>\n          {8}", [v.v.ten, ngayThang(v.v.jdPhong), so(r, 1), thoiGianAnhSang(r), so(rDat, 1), thoiGianAnhSang(rDat), so(kms, 1), so(kms * 0.210945, 2), v.v.id === 'v1' ? chuCanh("canh.ra-khoi-nhat-quyen-thang-8-2012-o", "Ra khỏi nhật quyển tháng 8/2012, ở cách Mặt Trời 121 AU.") : chuCanh("canh.ra-khoi-nhat-quyen-thang-11-2018-o", "Ra khỏi nhật quyển tháng 11/2018, ở cách Mặt Trời 119 AU.")]));
      } else {
        the.dat(chuCanh("canh.re-chuot-vao-mot-hanh-tinh-de-xem", "Rê chuột vào một hành tinh để xem số liệu; bấm vào tên của nó để ghim số liệu ở đây."));
      }
    }

    function capNhatViTri(p) {
      const el = phanTuQuyDao(p.ht, jd);
      p.el = el;
      hdSangBa(viTriTuPhanTu(el, el.M, tmp), tmp2);
      p.viTri.set(tmp2[0], tmp2[1], tmp2[2]);
    }

    // Nốt nhạc khi một hành tinh đi hết một vòng: cao độ theo tốc độ quỹ đạo (22 Hz cho mỗi km/s).
    const vW = new THREE.Vector3();
    // Ở bước định luật Kepler (có đồ thị), nhịp nốt chính là chu kỳ nên mỗi vòng một nốt như lời giảng viết. Ở các bước khác
    // tiếng chỉ để điểm xuyết: mỗi hành tinh không quá một nốt mỗi 0,9 giây, hai nốt bất kỳ cách nhau ít nhất 0,3 giây và nhỏ hơn.
    // (Trước Bản 3.2 bước mở đầu ngân tới 7 nốt mỗi giây, mỗi nốt dài 1,6 giây: thành một tràng chuông dồn dập ngay lúc mở app.)
    let notChungCuoi = -9;
    function ngan(vKmS, viTriThe, nhacCuoi) {
      const dayDu = nhipKepler;
      if (gioThuc - nhacCuoi < (dayDu ? 0.11 : 0.9)) return nhacCuoi;
      if (!dayDu && gioThuc - notChungCuoi < 0.3) return nhacCuoi;
      vW.copy(viTriThe).applyQuaternion(vuTru.quaternion).project(camera);
      const lech = Math.max(-0.8, Math.min(0.8, vW.x * 0.8));
      am.not({ tanSo: tanSoNot(vKmS), dai: dayDu ? 1.6 : 1.1, doTo: dayDu ? 0.16 : 0.09, lech, dang: 'chuong' });
      notChungCuoi = gioThuc;
      return gioThuc;
    }

    // ----- Mỗi khung hình -----
    const cho = new THREE.Vector3(), phai = new THREE.Vector3(), lech = new THREE.Vector3(), camL = new THREE.Vector3();
    const qNguoc = new THREE.Quaternion(), Q_GOC = new THREE.Quaternion();
    const dsNhan = [];
    let choThe = 0;
    const dungXoay = () => { app.dk.autoRotate = false; };
    app.dk.addEventListener('start', dungXoay);

    function capNhat(dt, dtThuc) {
      // góc nhìn rộng hơn cho cảnh mở đầu; đổi dần, không nhảy
      if (Math.abs(camera.fov - fovDich) > 0.01) {
        camera.fov += (fovDich - camera.fov) * (1 - Math.exp(-dtThuc * 2.5));
        if (Math.abs(camera.fov - fovDich) < 0.05) camera.fov = fovDich;
        camera.updateProjectionMatrix();
      }
      // Thời gian cứ chạy tiếp qua mốc cuối bảng JPL (năm 2050). Trước Bản 3.2 chỗ này kẹp jd ở 2050: bước mở đầu chạy
      // 1 năm mỗi giây nên chỉ 23 giây sau khi mở bài là mọi hành tinh ĐỨNG YÊN, trông như app bị đơ (lỗi gặp ngày 12/11/2026).
      // Ngoài khoảng 1800–2050 hàm phanTuQuyDao vẫn cho hành tinh đi đều trên elip của nó; bảng số liệu ghi rõ là ước tính.
      if (!tt.dangKeo) jd += dt * tocDo;
      tMT += dt;
      gioThuc += dtThuc;
      const bay = cheDo === 'bay';
      if (bay) namBay += (dt * tocDo) / 365.25;
      const namVet = Math.min(namBay, VET_TOI_DA_NAM);
      // xoay cả cảnh dần về hướng của chế độ đang xem
      const qDich = bay ? Q_BAY : Q_GOC;
      if (vuTru.quaternion.angleTo(qDich) < 1e-3) vuTru.quaternion.copy(qDich);
      else vuTru.quaternion.slerp(qDich, 1 - Math.exp(-dtThuc * 3.2));
      qNguoc.copy(vuTru.quaternion).invert();
      camL.copy(camera.position).applyQuaternion(qNguoc);   // máy quay viết trong hệ của cảnh
      camera.updateMatrixWorld();
      phai.setFromMatrixColumn(camera.matrixWorld, 0).applyQuaternion(qNguoc);
      const upp = (d) => donViMoiDiemAnh(camera, d, app.cao);
      const vx = V_MAT_TROI[0] / nen, vy = V_MAT_TROI[1] / nen, vz = V_MAT_TROI[2] / nen; // vận tốc dùng để VẼ vệt
      const dCam = camera.position.length();
      const u0 = upp(dCam);

      // Mặt Trời: quả cầu không nhỏ hơn R_MAT_TROI_TOI_THIEU, cũng không che mất quỹ đạo Sao Thủy khi lùi xa
      const rMT = Math.min(0.12, Math.max(R_MAT_TROI_TOI_THIEU, (bay ? 15 : 12) * u0));
      matTroi.capNhat(tMT, rMT, Math.max(rMT * 1.35, (bay ? 11 : 7) * u0));
      nhanMT.position.copy(phai).multiplyScalar(Math.max(rMT * 1.25, 10 * u0));
      nhanMT.datChu(bay ? chuCanh("canh.mat-troi-230-km-s", "Mặt Trời<small>230 km/s</small>") : chuCanh("canh.mat-troi", "Mặt Trời"));

      for (const p of hanhTinh) {
        capNhatViTri(p);
        const el = p.el;
        p.nhom.position.copy(p.viTri);
        const d = camL.distanceTo(p.viTri);
        // không để quả cầu phóng to lấn tới Mặt Trời khi lùi rất xa
        p.r = Math.min(Math.max(p.rHien, p.pxMin * upp(d)), 0.15 * p.viTri.length());
        p.truc.scale.setScalar(p.r);
        const W = ((p.W0 + p.Wn * (jd - JD_J2000)) % 360) * DO;
        p.cau.rotation.y = W;
        p.vt.datThoiGian(tMT);
        p.nhan.position.copy(phai).multiplyScalar(p.r * 1.12);
        p.tcRe.banKinhPx = Math.max(12, p.r / upp(d) + 4);

        // một vòng quanh Mặt Trời: ngân một nốt
        const vong = Math.floor(kinhDoTrungBinh(p.ht, jd) / 360);
        if (vong !== p.vong) {
          if (vong === p.vong + 1 && dt > 0) p.nhacCuoi = ngan(p.ht.vKmS, p.viTri, p.nhacCuoi);
          p.vong = vong;
        }

        if (bay) {
          const soVong = namVet / p.ht.chuKyNam;
          let n = Math.ceil(soVong * DIEM_MOI_VONG) + 2;
          let span = namVet;
          if (n > N_VET) { n = N_VET; span = ((N_VET - 2) / DIEM_MOI_VONG) * p.ht.chuKyNam; }
          // Mỗi điểm của vệt là vị trí hành tinh ở một thời điểm trước đó, trên CÙNG một elip. Thay vì giải phương trình
          // Kepler cho gần một vạn điểm ở mỗi khung hình (đo trên app thật: chiếm phần lớn thời gian tính của bài này),
          // dựng sẵn một bảng 512 điểm quanh elip rồi nội suy; bảng chỉ dựng lại khi elip đã trôi đáng kể (mười năm).
          if (!p.bangVet || Math.abs(jd - p.bangVet.jd) > 3652.5) {
            const B = p.bangVet?.B || new Float64Array((N_BANG_VET + 1) * 3);
            for (let k = 0; k <= N_BANG_VET; k++) {
              viTriTuPhanTu(el, (2 * Math.PI * k) / N_BANG_VET, tmp);
              hdSangBa(tmp, tmp2);
              B[k * 3] = tmp2[0]; B[k * 3 + 1] = tmp2[1]; B[k * 3 + 2] = tmp2[2];
            }
            p.bangVet = { B, jd };
          }
          const B = p.bangVet.B;
          hdSangBa([vx, vy, vz], tmp2);
          const ux = tmp2[0], uy = tmp2[1], uz = tmp2[2];
          const M0 = el.M / (2 * Math.PI), buocM = (el.n * 365.25 * span) / ((n - 1) * 2 * Math.PI), buocTuoi = span / (n - 1);
          for (let i = 0; i < n; i++) {
            let u = M0 - buocM * i; u = (u - Math.floor(u)) * N_BANG_VET;      // vị trí trong bảng (0 … N_BANG_VET)
            const k = Math.floor(u), f = u - k, j = k * 3;
            const tuoi = buocTuoi * i;                                       // năm trước hiện tại
            p.vet.dat(i, B[j] + (B[j + 3] - B[j]) * f - ux * tuoi, B[j + 1] + (B[j + 4] - B[j + 1]) * f - uy * tuoi, B[j + 2] + (B[j + 5] - B[j + 2]) * f - uz * tuoi);
          }
          p.vet.dat(0, p.viTri.x, p.viTri.y, p.viTri.z);                     // đầu vệt dính đúng vào hành tinh
          p.vet.xong(n);
        } else {
          for (let i = 0; i < N_CUNG; i++) {
            viTriTuPhanTu(el, el.M - (PHAN_CUNG * 2 * Math.PI * i) / (N_CUNG - 1), tmp);
            hdSangBa(tmp, tmp2);
            p.cung.dat(i, tmp2[0], tmp2[1], tmp2[2]);
          }
          p.cung.xong(N_CUNG);
        }
      }

      // bám theo hành tinh đang xem gần
      if (theoId) {
        const p = hanhTinh.find((k) => k.ht.id === theoId);
        if (choTheo > 0) { choTheo -= dtThuc; viTriTheo.copy(p.viTri); }
        else {
          lech.subVectors(p.viTri, viTriTheo);
          camera.position.add(lech); app.dk.target.add(lech);
          viTriTheo.copy(p.viTri);
        }
      }

      const tNam = (jd - JD_J2000) / 365.25;
      daiTH.material.uniforms.uT.value = tNam;
      daiK.material.uniforms.uT.value = tNam;

      for (const v of voyager) {
        const co = jd >= JD_VOYAGER_TIN_DUOC;
        v.cham.visible = v.lap.visible = co;
        v.day.line.visible = co && !bay && !theoId && dCam > 2;
        v.vet.mesh.visible = co && bay;
        if (!co) continue;
        viTriVoyager(v.v, jd, v.hd);
        hdSangBa(v.hd, tmp2);
        v.viTri.set(tmp2[0], tmp2[1], tmp2[2]);
        v.cham.position.copy(v.viTri); v.lap.position.copy(v.viTri);
        const uv = upp(camL.distanceTo(v.viTri));
        v.cham.scale.setScalar(4 * uv);
        v.lap.scale.setScalar(16 * uv);
        v.cham.rotation.y += dtThuc;
        v.nhan.position.copy(v.viTri).addScaledVector(phai, 6 * uv);
        const r = v.viTri.length();
        v.nhan.datChu(chuCanh("canh.au-anh-sang-30aef8", "{0}<small>{1} AU · {2} ánh sáng</small>", [v.v.ten, so(r, 0), thoiGianAnhSang(r)]));
        v.day.dat(0, 0, 0, 0); v.day.dat(1, v.viTri.x, v.viTri.y, v.viTri.z); v.day.xong(2);
        if (bay) {
          const tuoi = Math.min(namVet, (jd - JD_VOYAGER_TIN_DUOC) / 365.25);
          for (let i = 0; i < 64; i++) {
            const t = (tuoi * i) / 63;
            viTriVoyager(v.v, jd - t * 365.25, tmp);
            tmp[0] -= vx * t; tmp[1] -= vy * t; tmp[2] -= vz * t;
            hdSangBa(tmp, tmp2);
            v.vet.dat(i, tmp2[0], tmp2[1], tmp2[2]);
          }
          v.vet.xong(64);
        }
        const uMoc = upp(camL.distanceTo(v.moc.position));
        v.moc.scale.setScalar(5 * uMoc);
      }

      // tay nắm đi theo vật của nó (trừ lúc đang bị kéo)
      if (tayDang === 'dat' && !tt.dangKeo) tayDat.dat(dat.viTri);
      if (tayDang === 'v1' && !tt.dangKeo) tayV1.dat(voyager[0].viTri);
      if (tayDang === 'thu') {
        if (!thu.keo) {
          const dtNam = (dt * tocDo) / 365.25;
          thu.phi += (2 * Math.PI * dtNam) / chuKyKepler(thu.a);
          const vongThu = Math.floor(thu.phi / (2 * Math.PI));
          if (vongThu !== thu.vong) {
            if (vongThu === thu.vong + 1 && dt > 0) thu.nhacCuoi = ngan(V_TRAI_DAT / Math.sqrt(thu.a), cho.copy(tayThu.viTri), thu.nhacCuoi);
            thu.vong = vongThu;
          }
          viTriThu(cho);
          tayThu.dat(cho);
        } else thu.vong = Math.floor(thu.phi / (2 * Math.PI));
        domThu.position.copy(tayThu.viTri);
        domThu.scale.setScalar(14 * upp(camL.distanceTo(tayThu.viTri)));
        nhanThu.position.copy(tayThu.viTri).addScaledVector(phai, 12 * upp(camL.distanceTo(tayThu.viTri)));
      }

      // mũi tên chỉ hướng: dài cố định trên màn hình
      const dai = Math.max(100 * u0, rMT * 2.8);
      // mũi tên chĩa sâu vào màn hình thì bị ngắn đi: kéo dài thêm để trên màn hình vẫn dài chừng ấy
      cho.copy(camL).normalize();
      const rutNgan = (h) => Math.max(0.3, Math.sqrt(Math.max(0, 1 - h.dot(cho) ** 2)));
      const daiBay = dai / rutNgan(HUONG_BAY), daiTam = (dai * 0.75) / rutNgan(huongTam);
      muiBay.dat(HUONG_BAY, daiBay, dai);
      nhanBay.position.copy(HUONG_BAY).multiplyScalar(daiBay * 1.04);
      muiTam.dat(huongTam, daiTam, dai * 0.75);
      nhanTam.position.copy(huongTam).multiplyScalar(daiTam * 1.05);
      gocNhom.visible = bay && hienGoc;
      matPhang.visible = vienPhang.visible = gocNhom.visible;
      for (const p of hanhTinh) p.quyDao.line.visible = !bay || hienGoc;
      if (gocNhom.visible) {
        gocChieu.dat(0, 0, 0, 0); gocChieu.dat(1, chieu.x * dai, 0, chieu.z * dai); gocChieu.xong(2);
        const rg = dai * 0.55;
        for (let i = 0; i <= 32; i++) {
          vTam.copy(chieu).lerp(HUONG_BAY, i / 32).normalize().multiplyScalar(rg);
          gocCung.dat(i, vTam.x, vTam.y, vTam.z);
        }
        gocCung.xong(33);
        nhanGoc.position.copy(chieu).lerp(HUONG_BAY, 0.5).normalize().multiplyScalar(rg * 1.08);
      }
      // nhãn trên bầu trời (ở vô cực: đặt thật xa theo đúng hướng, tính từ máy quay)
      const xaTroi = Math.max(50, dCam * 40);
      nhanCyg.position.copy(camL).addScaledVector(huongDeneb, xaTroi);
      nhanDeneb.position.copy(camL).addScaledVector(huongCyg, xaTroi);

      if (bay) {
        cho.copy(vBay).multiplyScalar(-namVet / nen);
        for (let i = 0; i < 2; i++) vetMT.dat(i, cho.x * i, cho.y * i, cho.z * i);
        vetMT.xong(2);
      }
      const xa = dCam > 170;
      nhatQuyen.visible = xa;
      for (const v of voyager) v.moc.visible = xa && !bay;

      // nhãn: giữ nhãn quan trọng, ẩn nhãn bị đè
      dsNhan.length = 0;
      dsNhan.push({ nhan: nhanMT, uuTien: 100, giu: true });
      dsNhan.push({ nhan: nhanBay, uuTien: 72 }, { nhan: nhanTam, uuTien: bay ? 20 : 54 });
      dsNhan.push({ nhan: nhanCyg, uuTien: 74, tat: !bay }, { nhan: nhanDeneb, uuTien: 12, tat: true });
      dsNhan.push({ nhan: nhanGoc, uuTien: 80, tat: !gocNhom.visible });
      dsNhan.push({ nhan: nhanThu, uuTien: 90, tat: tayDang !== 'thu' });
      for (const v of voyager) {
        dsNhan.push({ nhan: v.nhan, uuTien: v.v.id === chonId ? 95 : 62, tat: jd < JD_VOYAGER_TIN_DUOC });
        dsNhan.push({ nhan: v.nhanRa, uuTien: 14, tat: !v.moc.visible });
      }
      const xaNgoai = dCam > 25;
      hanhTinh.forEach((p, i) => dsNhan.push({ nhan: p.nhan, uuTien: p.ht.id === chonId ? 96 : 52 + (xaNgoai ? i : 8 - i) }));
      dsNhan.push({ nhan: nhanTH, uuTien: 16, tat: !daiTH.visible || bay || dCam > 40 }, { nhan: nhanK, uuTien: 15, tat: !daiK.visible || bay || dCam < 25 || dCam > 600 });
      for (const n of dsNhanThuoc) dsNhan.push({ nhan: n, uuTien: 13, tat: !thuoc.visible });
      dsNhan.push({ nhan: nhanPhang, uuTien: 10, tat: !gocNhom.visible }, { nhan: nhanNQ, uuTien: 8, tat: !xa });
      goNhanDeNhau(dsNhan, camera, app.rong, app.cao);

      choThe -= dtThuc;
      if (choThe <= 0) {
        choThe = 0.25;
        if (chonId) veThe();
        dkNgay.dat(namCuaJd(jd));
      }
    }

    function hud() {
      const tocDoChu = tocDo === 0 ? chuCanh("canh.dung-yen", "đứng yên") : tocDo >= 365 ? chuCanh("canh.nam", "{0} năm", [so(tocDo / 365.25, 0)]) : tocDo >= 30 ? chuCanh("canh.1-thang", "1 tháng") : tocDo >= 7 ? chuCanh("canh.1-tuan", "1 tuần") : tocDo >= 1 ? chuCanh("canh.1-ngay", "1 ngày") : chuCanh("canh.1-gio", "1 giờ");
      if (cheDo === 'bay') {
        const quang = namBay * V_MAT_TROI_AU_NAM;
        return [
          [chuCanh("canh.da-troi", "Đã trôi"), chuCanh("canh.nam", "{0} năm", [so(namBay, 1)])],
          [chuCanh("canh.mat-troi-da-bay", "Mặt Trời đã bay"), chuCanh("canh.au-ngay-anh-sang", "{0} AU ≈ {1} ngày ánh sáng", [so(quang, 0), so(quang / NGAY_ANH_SANG_AU, 1)])],
          [chuCanh("canh.toc-do-mat-troi", "Tốc độ Mặt Trời"), '230 km/s = 828 000 km/h'],
          [chuCanh("canh.cach-ve", "Cách vẽ"), nen === 1 ? chuCanh("canh.duong-bay-dung-ti-le-that", "đường bay đúng tỉ lệ thật") : chuCanh("canh.duong-bay-nen-lan-cho-de-nhin", "đường bay nén {0} lần cho dễ nhìn", [nen])],
        ];
      }
      const v1v = voyager[0];
      const ngoaiBang = jd > JD_MAX || jd < JD_MIN;
      const dong = [[chuCanh("canh.ngay-c4c3ca", "Ngày"), ngoaiBang ? chuCanh("canh.ngoai-bang-so-lieu-1800-2050-vi-tri", "{0} · ngoài bảng số liệu 1800–2050, vị trí ước tính", [ngayThang(jd)]) : ngayThang(jd)], [chuCanh("canh.moi-giay-troi-qua", "Mỗi giây trôi qua"), tocDoChu]];
      if (tayDang === 'thu') dong.push([chuCanh("canh.hanh-tinh-thu", "Hành tinh thử"), chuCanh("canh.a-au-t-nam", "a = {0} AU · T = {1} năm", [so(thu.a, 2), so(chuKyKepler(thu.a), 2)])]);
      else if (tayDang === 'dat') dong.push([chuCanh("canh.sao-hoa-so-voi-trai-dat", "Sao Hỏa so với Trái Đất"), chuCanh("canh.lech-nhin-tu-mat-troi", "lệch {0}° nhìn từ Mặt Trời", [so(Math.abs(lechDatHoa()), 1)])]);
      if (theoId) {
        const p = hanhTinh.find((k) => k.ht.id === theoId);
        dong.push([chuCanh("canh.dang-xem-gan", "Đang xem gần"), chuCanh("canh.ve-to-hon-that-lan", "{0} · vẽ to hơn thật {1} lần", [p.ht.ten, so(p.r / (p.ht.banKinhKm / AU_KM), 0)])]);
      } else if (jd >= JD_VOYAGER_TIN_DUOC) dong.push([chuCanh("canh.voyager-1-cach-mat-troi", "Voyager 1 cách Mặt Trời"), chuCanh("canh.au-anh-sang-8e3546", "{0} AU = {1} ánh sáng", [so(v1v.viTri.length(), 1), thoiGianAnhSang(v1v.viTri.length())])]);
      return dong;
    }

    // Góc lệch (độ) giữa Trái Đất và Sao Hỏa nhìn từ Mặt Trời (hoàng kinh nhật tâm).
    function lechDatHoa() {
      const a = Math.atan2(-dat.viTri.z, dat.viTri.x), b = Math.atan2(-hoa.viTri.z, hoa.viTri.x);
      return Math.atan2(Math.sin(a - b), Math.cos(a - b)) / DO;
    }
    // Góc (độ) giữa hướng nhìn của máy quay và hướng bay (chỉ có nghĩa khi đang nhìn từ Ngân Hà).
    function lechHuongNhin() {
      if (cheDo !== 'bay' || vuTru.quaternion.angleTo(Q_BAY) > 0.02) return 180;
      cho.subVectors(app.dk.target, camera.position).normalize();
      return Math.acos(Math.min(1, Math.abs(cho.x))) / DO;
    }

    // Tham số riêng khi chụp kiểm (chỉ đọc ở chế độ im lặng): thu=doc | xung-doi | kepler8 | v1 | gan-<id>
    const thuDat = thamThu.get('thu');
    const choThu = { con: !!thuDat };
    function apThu() {
      choThu.con = false;
      if (thuDat === 'doc') { const D = 70; app.bayToi([D * 0.995, D * 0.06, D * 0.07], [0, 0, 0], 0); }
      else if (thuDat === 'xung-doi') { jd = 2461456.5 + 0.0; dungThoiGian(); daKeo.dat = true; }
      else if (thuDat === 'kepler8') { thu.a = 4.0; veVongThu(); daKeo.thu = true; }
      else if (thuDat === 'v1') { jd = 2461440.8; dungThoiGian(); daKeo.v1 = true; }
      else if (thuDat?.startsWith('gan-')) theo(thuDat.slice(4));
      else if (thuDat?.startsWith('re-')) {
        // rê chuột giả tới một hành tinh (để chụp ô chú giải)
        const p = hanhTinh.find((k) => k.ht.id === thuDat.slice(3));
        const st = document.createElement('style');
        st.textContent = '.vt-cg-trong, .vt-gy, .vt-diem, .vt-nhan { transition: none !important; }';
        document.head.append(st);
        setTimeout(() => {
          const cv = app.renderer.domElement, r = cv.getBoundingClientRect();
          const w = new THREE.Vector3(); p.nhom.getWorldPosition(w); w.project(camera);
          const x = r.left + (w.x + 1) / 2 * r.width, y = r.top + (1 - w.y) / 2 * r.height;
          for (const [dx, dy] of [[-20, 8], [0, 0]]) cv.dispatchEvent(new PointerEvent('pointermove', { clientX: x + dx, clientY: y + dy, pointerId: 1, pointerType: 'mouse', isPrimary: true, bubbles: true }));
          for (let i = 0; i < 40; i++) tt.capNhat(1 / 60);
        }, 300);
      }
      const g = thamThu.get('gocThu');
      if (g) { const [a, b] = g.split(';').map((s) => s.split(',').map(Number)); app.bayToi(a, b, 0); }
    }

    return {
      scene, capNhat: (dt, dtThuc) => { if (choThu.con) apThu(); capNhat(dt, dtThuc); }, hud, tuChinhGanXa: [0.01, 400, 3e5],
      buoc, goc, theo, datNen, datNgay,
      datTocDo: (v) => { tocDo = v; dkTocDo.dat(v); },
      chonCo,
      // cho thử thách
      lechHuongNhin, lechDatHoa,
      get daKeo() { return daKeo; },
      get aThu() { return thu.a; },
      get rV1() { return voyager[0].viTri.length(); },
      huy: () => { app.dk.removeEventListener('start', dungXoay); app.dk.autoRotate = false; camera.fov = 45; camera.updateProjectionMatrix(); },
    };
  },
};
