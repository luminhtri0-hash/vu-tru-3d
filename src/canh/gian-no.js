import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 18 — Vũ trụ giãn nở.
// Các cụm thiên hà nằm yên trong tọa độ đồng chuyển động; vị trí thật = a(t) × tọa độ đó.
// a(t) lấy từ phương trình Friedmann (vat-ly/vu-tru-hoc.js). Đơn vị: 1 = 30 megaparsec (khoảng 98 triệu năm ánh sáng).
// Hộp tuần hoàn cạnh 200 đơn vị nên đứng ở thiên hà nào nhìn ra cũng thấy như nhau.
// Thêm ở Bản 2: thước đo tới một thiên hà mẫu, mặt cầu Hubble, ba kiểu đồ thị (kích thước a(t), định luật Hubble,
// mật độ ba thành phần) và hàm cauHinh() để từng bước của bài giảng đặt mô hình.
// Bản 3: thiên hà có hình (xoắn, elip, nhiều cỡ, nhiều màu, nghiêng theo hướng đĩa), tấm vải không gian sáng giãn theo a,
// quả cầu kính, mũi tên vận tốc có đầu nhọn, thước có vạch mỗi tỉ năm ánh sáng, đồng hồ vũ trụ kéo được, kéo thiên hà mẫu,
// rê chuột lên thiên hà để đọc số, bấm để chuyển nhà, tiếng «bíp» trầm theo dịch chuyển đỏ, năm thử thách.
// Tham số kiểm thử riêng (chỉ đọc khi app.imLang): thu=nua-c | z2 | dinh | hubble-c | do.

import * as THREE from 'three';
import { so, soNghia } from '../vat-ly/hang-so.js';
import { lichSuGianNo } from '../vat-ly/vu-tru-hoc.js';
import { BIP_GOC, BIP_CHU_KY, THU_THACH, tDinhVuTruDong } from '../vat-ly/thu-thach-gian-no.js';
import { taoNhan, taoNenSao, taoNgauNhien, texDom, DuongDay, goNhanDeNhau } from '../khung/ve.js';
import { MAU, khungDoThi } from '../khung/giao-dien.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('gian-no', khoa, goc, thamSo);

const R = String.raw;

const CANH = 200, NUA = CANH / 2;
const MPC_MOI_DV = 30;
const GLY_MOI_MPC = 3.26156e-3;                  // 1 Mpc = 3,26 triệu năm ánh sáng
const R_CAU = (5000 / 3.2616) / MPC_MOI_DV;      // quả cầu cố định: bán kính 5 tỉ năm ánh sáng
const H0 = 67.4, OR = 9.2e-5;
const C_KM_S = 299792.458;
const C_TREN_H0 = C_KM_S / H0 / MPC_MOI_DV;      // bán kính Hubble hôm nay, đơn vị cảnh
const SO_TH = 5200;
const R_HIEN = NUA * 0.86;                       // xa hơn thì chấm mờ dần (mép hộp)

const MO_HINH = [
  { id: 'thuc', ten: chuCanh("canh.vu-tru-that", "Vũ trụ thật"), Om: 0.315, OL: 0.685, moTa: chuCanh("canh.31-5-vat-chat-68-5-nang-luong", "31,5% vật chất, 68,5% năng lượng tối (Planck 2018)") },
  { id: 'vc', ten: chuCanh("canh.chi-co-vat-chat", "Chỉ có vật chất"), Om: 1, OL: 0, moTa: chuCanh("canh.gian-mai-nhung-cham-dan", "Giãn mãi nhưng chậm dần") },
  { id: 'dong', ten: chuCanh("canh.qua-nhieu-vat-chat", "Quá nhiều vật chất"), Om: 2.5, OL: 0, moTa: chuCanh("canh.gian-toi-mot-muc-roi-co-sap-lai", "Giãn tới một mức rồi co sập lại") },
  { id: 'rong', ten: chuCanh("canh.gan-nhu-trong-rong", "Gần như trống rỗng"), Om: 0.05, OL: 0, moTa: chuCanh("canh.gan-nhu-khong-co-gi-ham-lai", "Gần như không có gì hãm lại") },
];
const boc = (x) => x - CANH * Math.round(x / CANH);   // đưa về hộp [−100, 100]

const GOC = {
  tong: [[70, 95, 235], [0, 0, 0]],
  gan: [[34, 40, 105], [0, 0, 0]],
  xa: [[150, 210, 500], [0, 0, 0]],
};

function taoThienHa() {
  const rnd = taoNgauNhien(1929);
  const nut = Array.from({ length: 70 }, () => [rnd() * CANH - NUA, rnd() * CANH - NUA, rnd() * CANH - NUA]);
  const soi = [];
  nut.forEach((a, i) => {
    const gan = nut.map((b, j) => [j, Math.hypot(boc(b[0] - a[0]), boc(b[1] - a[1]), boc(b[2] - a[2]))]).filter((k) => k[0] !== i).sort((x, y) => x[1] - y[1]);
    for (let k = 0; k < 2; k++) if (gan[k][0] > i || k === 0) soi.push([i, gan[k][0]]);
  });
  const vt = new Float32Array(SO_TH * 3), mau = new Float32Array(SO_TH * 3), co = new Float32Array(SO_TH);
  const loai = new Uint8Array(SO_TH);   // 0 trong cụm, 1 trên sợi, 2 rải rác, 3 thiên hà nhà
  for (let i = 0; i < SO_TH; i++) {
    let x, y, z;
    const k = rnd();
    if (i === 0) { x = y = z = 0; }
    else if (k < 0.34) { const n = nut[Math.floor(rnd() * nut.length)]; x = n[0] + rnd.chuan() * 3.4; y = n[1] + rnd.chuan() * 3.4; z = n[2] + rnd.chuan() * 3.4; }
    else if (k < 0.8) {
      const [ia, ib] = soi[Math.floor(rnd() * soi.length)], a = nut[ia], b = nut[ib], t = rnd();
      x = a[0] + boc(b[0] - a[0]) * t + rnd.chuan() * 1.7; y = a[1] + boc(b[1] - a[1]) * t + rnd.chuan() * 1.7; z = a[2] + boc(b[2] - a[2]) * t + rnd.chuan() * 1.7;
    } else { x = rnd() * CANH - NUA; y = rnd() * CANH - NUA; z = rnd() * CANH - NUA; }
    vt[i * 3] = boc(x); vt[i * 3 + 1] = boc(y); vt[i * 3 + 2] = boc(z);
    const am = rnd() < 0.45;
    mau[i * 3] = 1; mau[i * 3 + 1] = am ? 0.84 : 0.93; mau[i * 3 + 2] = am ? 0.62 : 1.0;
    co[i] = 1.5 + 1.6 * Math.pow(rnd(), 2.2);
    loai[i] = i === 0 ? 3 : k < 0.34 ? 0 : k < 0.8 ? 1 : 2;
  }
  // Bản 3: mỗi điểm là một thiên hà có hình (xoắn hoặc elip), hướng đĩa, cỡ, màu riêng. Dùng một chuỗi ngẫu nhiên
  // riêng để vị trí giữ y như Bản 2. Trong cụm dày có nhiều thiên hà elip hơn (quan hệ hình thái – mật độ).
  const r2 = taoNgauNhien(2718);
  const truc = new Float32Array(SO_TH * 3), ts = new Float32Array(SO_TH * 4), mauTH = new Float32Array(SO_TH * 3);
  for (let i = 0; i < SO_TH; i++) {
    const l = loai[i];
    const elip = l !== 3 && r2() < (l === 0 ? 0.5 : l === 1 ? 0.24 : 0.12);
    const cz = 2 * r2() - 1, ph = 2 * Math.PI * r2(), s = Math.sqrt(1 - cz * cz);
    truc[i * 3] = s * Math.cos(ph); truc[i * 3 + 1] = cz; truc[i * 3 + 2] = s * Math.sin(ph);
    const lon = r2() < (l === 0 ? 0.08 : 0.035);
    let ban = lon ? 1.9 + 1.2 * r2() : 0.55 + 1.05 * Math.pow(r2(), 2.2);
    if (elip && l === 0 && r2() < 0.25) ban *= 1.5;
    ts[i * 4] = ban; ts[i * 4 + 1] = elip ? 1 : 0; ts[i * 4 + 2] = r2(); ts[i * 4 + 3] = r2() < 0.3 ? 3 : 2;
    const v = r2();
    if (elip) { mauTH[i * 3] = 1; mauTH[i * 3 + 1] = 0.86 + 0.08 * v; mauTH[i * 3 + 2] = 0.7 + 0.12 * v; }
    else { mauTH[i * 3] = 0.9 + 0.1 * v; mauTH[i * 3 + 1] = 0.94 + 0.04 * v; mauTH[i * 3 + 2] = 1; }
    if (l === 3) {   // thiên hà nhà: xoắn lớn, nghiêng vừa phải để thấy rõ nhánh
      ts[i * 4] = 3.4; ts[i * 4 + 1] = 0; ts[i * 4 + 2] = 0.37; ts[i * 4 + 3] = 2;
      mauTH[i * 3] = 1.7; mauTH[i * 3 + 1] = 1.7; mauTH[i * 3 + 2] = 1.8;
      const n = new THREE.Vector3(0.25, 0.9, 0.35).normalize();
      truc[i * 3] = n.x; truc[i * 3 + 1] = n.y; truc[i * 3 + 2] = n.z;
    }
  }
  return { vt, mau, co, truc, ts, mauTH };
}

// ---------------------------------------------------------------------------------------------
// Shader vẽ thiên hà (Bản 3): mỗi thiên hà là một tấm vuông luôn quay về máy quay; shader tự chiếu đĩa
// theo hướng trục đĩa (nghiêng thì thành elip, nhìn cạnh thì thành vạch có dải bụi), vẽ nhánh xoắn lô-ga,
// phình giữa vàng, đốm hồng của vùng sinh sao; thiên hà elip là khối sáng kiểu de Vaucouleurs.
// Thiên hà nhỏ hơn vài điểm ảnh thì chuyển dần sang đốm mờ cùng tổng ánh sáng (không nhấp nháy, không răng cưa).
// Kích thước thiên hà được phóng to hàng trăm lần cho dễ thấy và KHÔNG giãn theo a (thiên hà liên kết bởi hấp dẫn).
// Nhuộm đỏ: màu quy ước theo z (trắng → cam → đỏ thẫm, tối dần), không phải màu mắt thấy.
// ---------------------------------------------------------------------------------------------
const VS_TH = /* glsl */ `
  attribute vec3 aViTri; attribute vec3 aTruc; attribute vec4 aTS; attribute vec3 aMau; attribute float aZ;
  uniform float uA, uPx, uSang, uMep0, uMep1, uDo;
  varying vec2 vQ; varying vec3 vN; varying vec4 vTS; varying vec3 vMau; varying float vSang, vK, vZ;
  void main() {
    vec4 mv = modelViewMatrix * vec4(aViTri * uA, 1.0);
    float r = aTS.x;
    float d = max(-mv.z, 1e-3);
    float rPx = r * uPx / d;
    float k = max(1.0, 2.6 / max(rPx, 1e-4));
    vec2 o = position.xy * 1.3 * k;
    mv.xy += o * r;
    gl_Position = projectionMatrix * mv;
    vQ = o; vK = k;
    vN = normalize(mat3(modelViewMatrix) * aTruc);
    vTS = aTS; vMau = aMau; vZ = aZ * uDo;
    float mep = 1.0 - smoothstep(uMep0, uMep1, length(aViTri));
    vSang = uSang * mep * pow(1.0 / k, 0.9);
  }`;
const FS_TH = /* glsl */ `
  varying vec2 vQ; varying vec3 vN; varying vec4 vTS; varying vec3 vMau; varying float vSang, vK, vZ;
  float bam(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec3 nhuomDo(vec3 c, float z) {
    float t = clamp(z / 1.1, 0.0, 1.0);
    float l = dot(c, vec3(0.3, 0.55, 0.15));
    vec3 cam = vec3(1.0, 0.6, 0.3) * l * 1.15, tham = vec3(1.0, 0.16, 0.07) * l * 1.05;
    vec3 r = mix(c, cam, smoothstep(0.0, 0.45, t));
    r = mix(r, tham, smoothstep(0.4, 1.0, t));
    return r * (1.0 - 0.4 * t);
  }
  void main() {
    vec2 q = vQ;
    float rq = length(q);
    if (rq > 1.3 * vK || vSang < 1e-3) discard;
    vec3 n = normalize(vN);
    float ci = max(abs(n.z), 0.14);
    vec2 e = dot(n.xy, n.xy) > 1e-6 ? normalize(n.xy) : vec2(0.0, 1.0);
    float u = dot(q, vec2(-e.y, e.x)), w = dot(q, e);
    float hat = vTS.z;
    float nho = clamp((vK - 1.0) / 1.6, 0.0, 1.0);
    vec3 c;
    if (vTS.y < 0.5) {
      vec2 p = vec2(u, w / ci);
      float r = length(p);
      // ngoài mép đĩa (đĩa nghiêng chỉ chiếm một phần nhỏ của tấm vuông) mà phình cũng đã tắt: bỏ sớm, khỏi tính nhánh
      if (nho <= 0.0 && r > 1.02 && length(vec2(u, w / mix(ci, 1.0, 0.5))) > 0.55) discard;
      float th = atan(p.y, p.x + 1e-5);
      float dia = exp(-r / 0.27) * (1.0 - smoothstep(0.7, 1.02, r));
      float xoan = th - log(max(r, 0.04)) / 0.32 + hat * 6.2832;
      float canh = pow(max(0.5 + 0.5 * cos(vTS.w * xoan), 0.0), 2.6);
      float vung = smoothstep(0.08, 0.28, r) * (1.0 - smoothstep(0.62, 1.0, r));
      vec2 g = p * 11.0 + hat * 31.0;
      vec2 f = fract(g) - 0.5;
      float dom = step(0.78, bam(floor(g))) * exp(-dot(f, f) * 26.0) * canh * vung;
      float phinh = exp(-length(vec2(u, w / mix(ci, 1.0, 0.5))) / 0.075);
      float bui = 1.0 - 0.75 * (1.0 - ci) * exp(-((w + 0.02) * (w + 0.02)) / 0.002) * smoothstep(0.04, 0.2, abs(u)) * (1.0 - smoothstep(0.6, 0.95, abs(u)));
      c = (vec3(0.5, 0.64, 1.0) * dia * (0.22 + 1.9 * canh * vung) + vec3(1.0, 0.36, 0.6) * dom * 2.4 * (0.6 + 0.4 * ci)) / sqrt(ci) * 1.1
        + vec3(1.0, 0.8, 0.52) * phinh * 3.0;
      c *= bui;
    } else {
      float ba = 0.55 + 0.45 * fract(hat * 7.31);
      float re = length(vec2(u, w / ba));
      c = vec3(1.0, 0.78, 0.52) * (2.6 * exp(-pow(re / 0.06, 0.6)) + 0.4 * exp(-re * re * 5.5));
    }
    c *= vMau;
    if (nho > 0.0) {
      float b = exp(-rq * rq / (vK * vK) * 6.0) * 1.3;
      c = mix(c, vMau * (vTS.y < 0.5 ? vec3(0.85, 0.88, 1.0) : vec3(1.0, 0.82, 0.6)) * b, nho);
    }
    c *= 1.0 - smoothstep(0.95 * vK, 1.3 * vK, rq);
    gl_FragColor = vec4(max(nhuomDo(c, vZ) * vSang, vec3(0.0)), 1.0);
  }`;

export default {
  id: 'gian-no',
  ten: 'Vũ trụ giãn nở',
  moTa: 'Không gian giãn, không có tâm; phương trình Friedmann; giãn nhanh dần',
  yChinh: 'Áp phương trình Einstein cho cả vũ trụ thì ra một kết quả gây sốc: vũ trụ không thể đứng yên, nó phải giãn ra hoặc co lại. Mọi khoảng cách lớn tỉ lệ với một hệ số $a(t)$, và các thiên hà lùi xa nhau với vận tốc tỉ lệ khoảng cách. Không gian đã giãn như thế suốt **13,8 tỉ năm**; từ khoảng 6 tỉ năm trước, nó giãn **nhanh dần**.',
  giaiThich: R`
Thiên hà lùi xa với $v = H_0 d$, $H_0 \approx 67{,}4$ km/s mỗi megaparsec. Không phải chúng bay qua không gian: **không gian giãn**, mọi khoảng cách lớn nhân với cùng hệ số $a(t)$. Đứng ở thiên hà nào cũng thấy như vậy, nên không có tâm.

Ánh sáng đi trong không gian đang giãn bị kéo dài: $1 + z = 1/a$. Phương trình Friedmann $H^2 = \tfrac{8\pi G}{3}\rho - kc^2/a^2$ nối tốc độ giãn với mật độ; mật độ tới hạn $3H_0^2/(8\pi G) \approx 8{,}5 \times 10^{-27}$ kg/m³, cỡ 5 nguyên tử hiđrô mỗi mét khối.

Bức xạ loãng theo $a^{-4}$, vật chất theo $a^{-3}$, năng lượng tối không loãng. Phương trình gia tốc $\ddot a/a = -\tfrac{4\pi G}{3}(\rho + 3P/c^2)$ cho thấy năng lượng tối (áp suất âm) làm giãn nở nhanh dần, bắt đầu khi $a = (\Omega_m/2\Omega_\Lambda)^{1/3} \approx 0{,}61$, khoảng 6,1 tỉ năm trước. Tuổi vũ trụ tính từ tích phân: 13,8 tỉ năm.`,

  baiGiang: {
    mucTieu: [
      'Phát biểu và dùng được định luật Hubble–Lemaître $v = H_0 d$, kể cả đổi đơn vị km/s mỗi megaparsec.',
      'Giải thích vì sao giãn nở không có tâm, và gỡ được ba hiểu sai: Vụ Nổ Lớn tại một điểm, lùi nhanh hơn ánh sáng là vô lý, mọi thứ đều giãn theo.',
      'Dùng hệ số tỉ lệ $a(t)$ để tính dịch chuyển đỏ: $1 + z = 1/a$.',
      'Suy ra phương trình Friedmann kiểu Newton, tính được mật độ tới hạn, và nối phương trình gia tốc với phát biểu $\\rho + 3P/c^2$ ở Bài 12.',
      'Nói được vì sao số liệu chọn mô hình ΛCDM, lúc nào vũ trụ chuyển sang giãn nhanh dần, và «căng thẳng Hubble» là gì.',
    ],
    buoc: [
      {
        ten: 'Thiên hà lùi xa: định luật Hubble–Lemaître',
        noiDung: R`
Mỗi thiên hà vẽ ở đây đại diện cho một cụm thiên hà. Thiên hà trong vòng vàng ở giữa là **thiên hà nhà** của bạn. Mũi tên xanh là vận tốc lùi xa của các cụm quanh đó: cụm nào ở xa gấp đôi thì mũi tên dài gấp đôi. Đồ thị dưới bảng điều khiển vẽ vận tốc theo khoảng cách: một đường thẳng.

Đó là {{định luật Hubble–Lemaître}}:

$$ v = H_0\, d . $$

$d$ là khoảng cách, $v$ là vận tốc lùi xa, $H_0$ là {{hằng số Hubble}} hôm nay. Vệ tinh Planck cho $H_0 \approx 67{,}4$ km/s mỗi megaparsec (1 Mpc = 3,26 triệu năm ánh sáng).

> [Ví dụ] Một thiên hà cách 100 Mpc lùi xa $67{,}4 \times 100 = 6\,740$ km/s. Ánh sáng của nó bị kéo dài thêm khoảng 2,2% (dịch chuyển đỏ $z \approx v/c \approx 0{,}022$).

Đường vàng nối nhà với một **thiên hà mẫu**: nhãn ghi khoảng cách và vận tốc của nó, đúng tỉ lệ $H_0$.

> [Thử ngay] Kéo đốm vàng trên **thiên hà mẫu** ra xa hoặc lại gần: xa gấp đôi thì vận tốc lùi gấp đôi. Rê chuột lên một thiên hà bất kỳ để đọc khoảng cách và vận tốc của nó. Bật tiếng thì nghe hai nốt: nốt gốc phát ở nhà, rồi nốt nhận được từ thiên hà mẫu, trầm hơn vì dịch chuyển đỏ (bước 3).
> [[Đồ thị vận tốc theo khoảng cách|hubble]] [[Nhìn gần|gan]] [[Nhìn toàn cảnh|tong]]

> [Lưu ý] Thiên hà được vẽ to gấp hàng trăm lần cho dễ thấy; hình xoắn, hình elip của từng cái là hình minh hoạ. Cỡ của chúng không giãn theo vũ trụ (bước 8 giải thích vì sao).

> [Lịch sử] Năm 1927 Georges Lemaître suy ra từ phương trình Einstein rằng vũ trụ giãn nở và vận tốc lùi xa phải tỉ lệ với khoảng cách. Năm 1929 Edwin Hubble công bố số liệu đo khoảng cách các thiên hà cho thấy đúng như vậy. Năm 2018, Hiệp hội Thiên văn Quốc tế khuyến nghị gọi tên là định luật Hubble–Lemaître.

+++ Đi sâu: $1/H_0$ là một thang thời gian
$H_0$ có đơn vị (km/s)/Mpc, tức là «trên giây». Đổi 1 Mpc $= 3{,}086 \times 10^{19}$ km:

$$ \frac{1}{H_0} = \frac{3{,}086 \times 10^{19}\ \text{km}}{67{,}4\ \text{km/s}} \approx 4{,}6 \times 10^{17}\ \text{s} \approx 14{,}5\ \text{tỉ năm}. $$

Nếu mọi thiên hà luôn giữ vận tốc hiện tại, thì $d/v = 1/H_0$ là thời gian từ lúc chúng chụm lại: 14,5 tỉ năm. Tuổi thật tính kỹ (bước 7) là 13,8 tỉ năm; hai số gần nhau phần lớn là do trùng hợp, vì giãn nở đã chậm dần rồi lại nhanh dần. Tương tự, $c/H_0 \approx 4\,450$ Mpc, khoảng 14,5 tỉ năm ánh sáng, gọi là khoảng cách Hubble.

Mô hình bỏ qua chuyển động riêng của từng thiên hà (vài trăm km/s), nên các điểm trên đồ thị nằm đúng trên một đường thẳng; số liệu thật thì tản ra quanh đường ấy, nhất là ở gần.
+++`,
        vao: (c) => c.cauHinh({ moHinh: 'thuc', t: 'nay', muiTen: true, luoi: true, do_: false, doThi: 'hubble', thuoc: true, hubble: false, bip: true, nha: 0, mayAnh: 'tong' , hud: ['H', 'mau', 'bip', 'a'] }),
        nut: { hubble: (c) => c.cauHinh({ doThi: 'hubble' }), gan: (c) => c.goc('gan'), tong: (c) => c.goc('tong') },
        thuThach: {
          de: 'Kéo thiên hà mẫu tới chỗ **hôm nay** nó lùi xa đúng **một nửa tốc độ ánh sáng** (sai lệch dưới 0,03 c).',
          kiem: (c) => { const s = c.trangThai(); return s.moHinh === 'thuc' && s.homNay && Math.abs(s.vMau - THU_THACH.nuaC.v) < THU_THACH.nuaC.sai; },
          goiY: R`$v = H_0 d$, nên cần $d = 0{,}5\, c/H_0 \approx 7{,}3$ tỉ năm ánh sáng (khoảng 2 220 Mpc). Nhãn của thiên hà mẫu đổi theo khi kéo.`,
        },
      },
      {
        ten: 'Không gian giãn: không có tâm, không có mép',
        noiDung: R`
Nhìn tấm lưới sáng: nó giãn ra cùng các thiên hà. Các cụm thiên hà **không bay qua không gian**; chúng gần như nằm yên tại chỗ của mình, còn khoảng cách giữa mọi cặp thì nhân lên cùng một tỉ lệ. Giống ổ bánh mì nho đang nở: hạt nho nào cũng thấy mọi hạt khác lùi ra, hạt càng xa lùi càng nhanh.

Vì vậy **không có tâm**. Bấm thẳng vào một thiên hà bất kỳ trong cảnh (hoặc nút dưới đây) để «chuyển nhà» sang đó: từ nhà mới, bạn vẫn thấy đúng một bức tranh, mọi thứ lùi ra xa mình theo $v = H_0 d$.

> [Thử ngay] [[Chuyển nhà sang thiên hà khác|chuyen]] [[Về thiên hà nhà ban đầu|ve]] [[Chiếu từ Vụ Nổ Lớn|chieu]]

> [Hiểu sai thường gặp] «Vụ Nổ Lớn là một vụ nổ tại một điểm, các thiên hà là mảnh vỡ bay ra.» Không đúng. Không có điểm nổ và không có «bên ngoài» để bay vào. Mọi chỗ trong không gian đều từng đặc và nóng như nhau, và chỗ nào cũng giãn ra. Vụ Nổ Lớn xảy ra **ở khắp nơi cùng lúc**.

> [Lưu ý] Mô hình là một hộp lặp lại: đi ra mép này là vào mép kia, để không có mép và nhìn từ thiên hà nào cũng như nhau. Vũ trụ thật có thể hữu hạn mà không có mép, hoặc vô hạn; số liệu hiện nay chưa phân biệt được.

+++ Đi sâu: vì sao chỉ có kiểu $v \propto d$ là không có tâm
Gọi $D$ là {{khoảng cách đồng chuyển}} (khoảng cách đo hôm nay, không đổi theo thời gian) và $a(t)$ là hệ số chung. Khoảng cách thật lúc $t$ là $d = a(t)\,D$. Đạo hàm theo thời gian:

$$ v = \dot a\, D = \frac{\dot a}{a}\, d = H\, d, \qquad H = \frac{\dot a}{a}. $$

Đứng ở thiên hà B thay vì A: vận tốc của C so với B là $v_C - v_B = H(d_C - d_B)$, vẫn là định luật Hubble với tâm B. Nếu vận tốc tỉ lệ $d^2$ chẳng hạn, phép trừ này sẽ không còn dạng cũ: người ở mỗi thiên hà sẽ thấy một bức tranh khác, và có một «tâm» đặc biệt. Vũ trụ đồng nhất (mọi nơi như nhau) và đẳng hướng (mọi hướng như nhau) buộc giãn nở phải có dạng $v = Hd$.
+++`,
        vao: (c) => c.cauHinh({ moHinh: 'thuc', t: 'nay', muiTen: true, luoi: true, do_: false, doThi: 'a', thuoc: false, hubble: false, bip: false, demLai: true, mayAnh: 'tong' , hud: ['a', 'H', 'nha', 'cau'] }),
        nut: { chuyen: (c) => c.cauHinh({ nha: 'khac' }), ve: (c) => c.cauHinh({ nha: 0 }), chieu: (c) => c.cauHinh({ chieu: true }) },
        thuThach: {
          de: 'Bấm thẳng vào **hai thiên hà khác nhau** trong cảnh để chuyển nhà hai lần. Sau mỗi lần, xem mũi tên: mọi thiên hà vẫn lùi ra xa nhà mới.',
          kiem: (c) => c.trangThai().soBamCanh >= 2,
          giu: 0.2,
          goiY: 'Rê chuột lên một thiên hà: ô chú giải ghi «Bấm để chuyển nhà sang đây». Nút «Chuyển nhà» trong bài không được tính.',
        },
      },
      {
        ten: 'Hệ số tỉ lệ $a(t)$ và dịch chuyển đỏ',
        noiDung: R`
Mô hình đang ở lúc vũ trụ 5,8 tỉ năm tuổi, khi mọi khoảng cách lớn chỉ bằng **một nửa** hôm nay: {{hệ số tỉ lệ}} $a = 0{,}5$. Quy ước $a = 1$ là hôm nay. Mọi khoảng cách giữa các cụm thiên hà là $d = a(t)\,D$, với $D$ cố định.

Ánh sáng đi trong không gian đang giãn bị kéo dài theo: bước sóng tỉ lệ với $a$. Ánh sáng phát lúc hệ số tỉ lệ là $a$, tới ta hôm nay, có bước sóng dài gấp $1/a$ lần. Đó là {{dịch chuyển đỏ vũ trụ học}}:

$$ 1 + z = \frac{\lambda_\text{nhận}}{\lambda_\text{phát}} = \frac{1}{a_\text{phát}} . $$

> [Ví dụ] Ánh sáng phát lúc $a = 0{,}5$ có $z = 1$: vạch đỏ của hiđrô (656 nm) tới ta ở 1 312 nm, thành hồng ngoại. Lúc $a = 0{,}25$ (vũ trụ 2,1 tỉ năm tuổi) thì $z = 3$.

Bật **nhuộm đỏ**: mỗi thiên hà có màu theo dịch chuyển đỏ của ánh sáng từ nó tới nhà lúc này. Càng xa, ánh sáng càng đi lâu, càng bị kéo dài.

> [Thử ngay] Kéo đốm xanh trên **đồng hồ vũ trụ** (cột đứng ở thiên hà nhà) để đổi thời điểm: lưới, thiên hà và màu nhuộm đổi theo. Bật tiếng để nghe tiếng bíp của thiên hà mẫu trầm xuống.
> [[Lúc a = 0,5|a05]] [[Lúc a = 0,25|a025]] [[Về hôm nay|nay]] [[Bật hoặc tắt nhuộm đỏ|do]]

> [Lưu ý] Màu nhuộm là màu quy ước theo $z$ (trắng, cam, đỏ thẫm), không phải màu mắt thấy: với $z$ cỡ 1, ánh sáng nhìn thấy đã thành hồng ngoại. Tiếng bíp cũng là quy đổi cho tai nghe được: vạch đỏ của hiđrô ($4{,}57 \times 10^{14}$ Hz) ứng với nốt 880 Hz phát ở nhà; nốt nhận từ thiên hà mẫu có tần số $880/(1 + z)$ Hz và nhịp thưa ra $1 + z$ lần, đúng như sóng ánh sáng bị kéo dài.

> [Con số] {{bức xạ nền vi sóng vũ trụ|Bức xạ nền}} phát ra ở $z \approx 1\,090$, khi vũ trụ chừng 380 000 năm tuổi và nóng khoảng 3 000 K. Bước sóng kéo dài 1 091 lần, nhiệt độ giảm cùng tỉ lệ, còn 2,725 K hôm nay.

+++ Đi sâu: vì sao bước sóng tỉ lệ với $a$
Hai đỉnh sóng liên tiếp rời nguồn cách nhau một khoảng thời gian rất ngắn $\Delta t_\text{phát}$. Ánh sáng đi được quãng đồng chuyển động $\dd D = c\,\dd t / a(t)$ trong thời gian $\dd t$. Hai đỉnh cùng đi một quãng đồng chuyển động như nhau, nên

$$ \frac{c\,\Delta t_\text{phát}}{a_\text{phát}} = \frac{c\,\Delta t_\text{nhận}}{a_\text{nhận}} \ \Rightarrow\ \frac{\lambda_\text{nhận}}{\lambda_\text{phát}} = \frac{a_\text{nhận}}{a_\text{phát}} . $$

Công thức không chứa vận tốc nào. Vì thế không nên nghĩ $z$ là hiệu ứng Doppler của một vận tốc lúc phát; với $z$ lớn, dùng $v = cz$ hay công thức Doppler của thuyết tương đối hẹp đều cho kết quả sai (xem Davis và Lineweaver 2004). Chỉ khi $z$ nhỏ thì $z \approx v/c$, như ở bước 1.
+++`,
        vao: (c) => c.cauHinh({ moHinh: 'thuc', a: 0.5, muiTen: false, luoi: true, do_: true, doThi: 'a', thuoc: true, hubble: false, bip: true, nha: 0, mayAnh: 'tong' , hud: ['a', 'z', 'bip', 'mau', 'nhietDo'] }),
        nut: { a05: (c) => c.cauHinh({ a: 0.5 }), a025: (c) => c.cauHinh({ a: 0.25 }), nay: (c) => c.cauHinh({ t: 'nay' }), do: (c) => c.datDo() },
        thuThach: {
          de: 'Kéo đồng hồ vũ trụ tới lúc mà ánh sáng phát ra khi ấy, tới ta hôm nay, có dịch chuyển đỏ $z = 2$ (sai lệch dưới 0,15).',
          kiem: (c) => { const s = c.trangThai(); return s.moHinh === 'thuc' && Math.abs(1 / s.a - 1 - THU_THACH.z2.z) < THU_THACH.z2.sai; },
          goiY: '$1 + z = 1/a$, nên cần $a = 1/3$: mọi khoảng cách bằng một phần ba hôm nay, lúc vũ trụ khoảng 3,3 tỉ năm tuổi. Ô số liệu ghi sẵn $z$.',
        },
      },
      {
        ten: 'Phương trình Friedmann',
        noiDung: R`
Tốc độ giãn do đâu mà có? Áp phương trình Einstein (Bài 12) cho một vũ trụ đồng nhất và đẳng hướng, Alexander Friedmann (1922) được

$$ H^2 = \left(\frac{\dot a}{a}\right)^2 = \frac{8\pi G}{3}\,\rho - \frac{kc^2}{a^2} . $$

$\rho$ là mật độ của mọi thứ (vật chất, bức xạ, năng lượng tối; năng lượng chia cho $c^2$), $k$ cho biết độ cong của không gian. Đây là {{phương trình Friedmann}}. Nó giống hệt định luật bảo toàn năng lượng của một hòn đá ném lên: động năng (vế trái) cân với thế năng hấp dẫn (số hạng $\rho$) và «năng lượng toàn phần» (số hạng $k$).

Không gian phẳng ($k = 0$) khi $\rho$ đúng bằng {{mật độ tới hạn}}

$$ \rho_c = \frac{3H_0^2}{8\pi G} \approx 8{,}5 \times 10^{-27}\ \text{kg/m}^3 , $$

cỡ **5 nguyên tử hiđrô trong mỗi mét khối**. Người ta đo mật độ bằng {{tham số mật độ}} $\Omega = \rho/\rho_c$. Planck đo được tổng $\Omega$ bằng 1 tới vài phần nghìn: vũ trụ gần như phẳng.

> [Thử ngay] Đồ thị dưới bảng là $a(t)$ giải từ phương trình này. So vũ trụ thật với một vũ trụ quá đặc, co sập lại: chọn «Quá nhiều vật chất» rồi kéo đồng hồ vũ trụ lên dần, lưới giãn chậm lại, đứng yên, rồi co.
> [[Vũ trụ thật|thuc]] [[Quá nhiều vật chất|dong]] [[Chỉ có vật chất|vc]]

+++ Đi sâu: suy ra kiểu Newton từ một quả cầu bụi
Lấy một quả cầu tưởng tượng bán kính $R(t) = a(t)\,r$ trong một vũ trụ đầy bụi đồng nhất mật độ $\rho$. Khối lượng bên trong $M = \tfrac43 \pi R^3 \rho$ không đổi khi cầu giãn. Theo định lý vỏ cầu, phần vật chất bên ngoài không kéo gì lên một thiên hà nằm trên mặt cầu. Năng lượng của thiên hà ấy (trên một đơn vị khối lượng) bảo toàn:

$$ \tfrac12 \dot R^2 - \frac{GM}{R} = E . $$

Thay $M$ và chia cho $\tfrac12 R^2 = \tfrac12 a^2 r^2$:

$$ \left(\frac{\dot a}{a}\right)^2 = \frac{8\pi G}{3}\rho + \frac{2E}{r^2 a^2} . $$

Đặt $2E/r^2 = -kc^2$ là ra phương trình Friedmann. $E \lt 0$ ($k > 0$): giãn tới một mức rồi co lại, như hòn đá ném không đủ mạnh. $E > 0$: giãn mãi. $E = 0$ đúng là trường hợp $\rho = \rho_c$.

Thay số với $H_0 = 67{,}4$ km/s/Mpc $= 2{,}18 \times 10^{-18}$ s⁻¹: $\rho_c = 3 \times (2{,}18 \times 10^{-18})^2 / (8\pi \times 6{,}67 \times 10^{-11}) \approx 8{,}5 \times 10^{-27}$ kg/m³. Chia cho khối lượng nguyên tử hiđrô $1{,}67 \times 10^{-27}$ kg được khoảng 5,1.

Thuyết tương đối rộng cho đúng phương trình này, kèm hai điều Newton không có: $k$ là độ cong thật của không gian, và $\rho$ gồm cả năng lượng của bức xạ và năng lượng tối.
+++`,
        vao: (c) => c.cauHinh({ moHinh: 'thuc', t: 'nay', muiTen: true, luoi: true, do_: false, doThi: 'a', thuoc: false, hubble: false, bip: false, mayAnh: 'tong' , hud: ['a', 'H', 'gianNo', 'cau'] }),
        nut: { thuc: (c) => c.cauHinh({ moHinh: 'thuc' }), dong: (c) => c.cauHinh({ moHinh: 'dong' }), vc: (c) => c.cauHinh({ moHinh: 'vc' }) },
        thuThach: {
          de: 'Với kiểu «Quá nhiều vật chất», kéo đồng hồ vũ trụ tới lúc vũ trụ **ngừng giãn**, ngay trước khi co lại ($|H| \\lt 3$ km/s mỗi megaparsec).',
          kiem: (c) => { const s = c.trangThai(); return s.moHinh === 'dong' && Math.abs(s.H) < THU_THACH.dinh.H; },
          goiY: 'Bấm «Quá nhiều vật chất», rồi kéo đốm xanh lên cao. Vũ trụ này lớn nhất, gấp 1,67 lần hôm nay, khi khoảng 31 tỉ năm tuổi; lúc đó ô «Tốc độ giãn» chỉ gần 0.',
        },
      },
      {
        ten: 'Ba thành phần, ba cách loãng đi',
        noiDung: R`
Đồ thị giờ vẽ mật độ của ba thành phần theo hệ số tỉ lệ (cả hai trục chia theo lũy thừa của 10):

- **Vật chất** (5% vật chất thường, 27% {{vật chất tối}}): số hạt không đổi, thể tích tăng theo $a^3$, nên $\rho_m \propto a^{-3}$.
- **Bức xạ**: số photon cũng loãng theo $a^{-3}$, thêm mỗi photon bị kéo dài bước sóng nên mất năng lượng theo $1/a$: $\rho_r \propto a^{-4}$.
- **Năng lượng tối** dạng {{hằng số vũ trụ}}: mật độ **không đổi** dù không gian giãn bao nhiêu.

Hôm nay $\Omega_r \approx 9 \times 10^{-5}$, $\Omega_m = 0{,}315$, $\Omega_\Lambda = 0{,}685$. Ngược thời gian, bức xạ tăng nhanh nhất, nên vũ trụ trải qua ba thời kỳ:

| Thời kỳ | Kéo dài tới | $a(t)$ gần đúng |
|---|---|---|
| bức xạ trội | $z \approx 3\,400$, vũ trụ chừng 50 000 năm tuổi | $\propto t^{1/2}$ |
| vật chất trội | $z \approx 0{,}3$, khoảng 3,5 tỉ năm trước | $\propto t^{2/3}$ |
| năng lượng tối trội | đang diễn ra | tăng theo hàm mũ |

> [Thử ngay] [[Tới lúc vật chất bằng năng lượng tối|bang]] [[Chiếu từ Vụ Nổ Lớn|chieu]] [[Về hôm nay|nay]]

+++ Đi sâu: mỗi thành phần loãng ra sao, từ định luật bảo toàn năng lượng
Một thể tích đồng chuyển động $V \propto a^3$ giãn ra như pít-tông trong xi-lanh, không có nhiệt đi vào: $\dd(\rho c^2 V) = -P\,\dd V$. Với chất có $P = w\rho c^2$ ($w$ không đổi), giải ra

$$ \rho \propto a^{-3(1+w)} . $$

- Bụi, vật chất lạnh: $P \approx 0$, $w = 0$, $\rho \propto a^{-3}$.
- Bức xạ: $P = \rho c^2/3$, $w = 1/3$, $\rho \propto a^{-4}$.
- Hằng số vũ trụ: $P = -\rho c^2$, $w = -1$, $\rho$ không đổi. Áp suất âm nghĩa là khi thể tích tăng, công $-P\,\dd V$ là dương: vừa đủ để «đổ đầy» phần thể tích mới với cùng mật độ.

Hai mốc trong bảng: bức xạ bằng vật chất khi $\Omega_r a^{-4} = \Omega_m a^{-3}$, tức $a = \Omega_r/\Omega_m \approx 2{,}9 \times 10^{-4}$; vật chất bằng năng lượng tối khi $a = (\Omega_m/\Omega_\Lambda)^{1/3} \approx 0{,}77$.
+++`,
        vao: (c) => c.cauHinh({ moHinh: 'thuc', t: 'nay', muiTen: false, luoi: true, do_: false, doThi: 'matDo', thuoc: false, hubble: false, bip: false, mayAnh: 'tong' , hud: ['a', 'nhietDo', 'z', 'gianNo'] }),
        nut: { bang: (c) => c.cauHinh({ a: Math.cbrt(0.315 / 0.685) }), chieu: (c) => c.cauHinh({ chieu: true }), nay: (c) => c.cauHinh({ t: 'nay' }) },
      },
      {
        ten: 'Chậm dần rồi nhanh dần',
        noiDung: R`
Đường cong $a(t)$ trên đồ thị lúc đầu cong xuống (giãn chậm dần), rồi uốn ngược lên (giãn nhanh dần). Chấm trắng đang đứng đúng ở chỗ uốn: vũ trụ **7,7 tỉ năm tuổi**, khoảng **6,1 tỉ năm trước**, $z \approx 0{,}63$.

Lý do nằm ở phát biểu của Bài 12: một quả cầu hạt rơi tự do co lại theo $\rho + 3P/c^2$, không chỉ theo $\rho$. Cho cả vũ trụ, điều đó thành {{phương trình gia tốc}}:

$$ \frac{\ddot a}{a} = -\frac{4\pi G}{3}\left(\rho + \frac{3P}{c^2}\right). $$

Với vật chất, $P \approx 0$: vế phải âm, giãn nở bị hãm. Với năng lượng tối, $P = -\rho_\Lambda c^2$ nên $\rho + 3P/c^2 = -2\rho_\Lambda \lt 0$: nó **đẩy**. Vật chất loãng dần, năng lượng tối thì không, nên đến một lúc lực đẩy thắng:

$$ \rho_m = 2\rho_\Lambda \ \Rightarrow\ a = \left(\frac{\Omega_m}{2\Omega_\Lambda}\right)^{1/3} \approx 0{,}613 . $$

> [Thử ngay] Xem ô số liệu đổi từ «chậm dần» sang «nhanh dần». Kéo đồng hồ vũ trụ qua lại quanh 7,7 tỉ năm để thấy chỗ đổi.
> [[Lúc 4 tỉ năm tuổi|truoc]] [[Đúng lúc chuyển|dung]] [[Lúc 11 tỉ năm tuổi|sau]]

> [Lịch sử] Năm 1998 hai nhóm (Riess và cộng sự; Perlmutter và cộng sự) đo các {{siêu tân tinh loại Ia}} ở xa. Loại sao nổ này có độ sáng thật gần như như nhau, nên độ mờ cho biết khoảng cách. Chúng mờ hơn dự kiến của một vũ trụ giãn chậm dần: giãn nở đang **tăng tốc**. Saul Perlmutter, Brian Schmidt và Adam Riess nhận giải Nobel Vật lý 2011.

+++ Đi sâu: suy ra phương trình gia tốc
Viết phương trình Friedmann thành $\dot a^2 = \tfrac{8\pi G}{3}\rho a^2 - kc^2$ rồi đạo hàm theo thời gian:

$$ 2\dot a \ddot a = \frac{8\pi G}{3}\left(\dot\rho a^2 + 2\rho a \dot a\right). $$

Bảo toàn năng lượng ở bước 5, $\dd(\rho c^2 a^3) = -P\,\dd(a^3)$, viết lại là $\dot\rho = -3\dfrac{\dot a}{a}\left(\rho + \dfrac{P}{c^2}\right)$. Thay vào và chia cho $2a\dot a$:

$$ \frac{\ddot a}{a} = \frac{4\pi G}{3}\left(-3\rho - \frac{3P}{c^2} + 2\rho\right) = -\frac{4\pi G}{3}\left(\rho + \frac{3P}{c^2}\right). $$

Đây chính là kết quả Baez và Bunn (2005) dùng để giải thích phương trình Einstein: thể tích một quả cầu hạt thử co lại với gia tốc tỉ lệ $\rho + 3P/c^2$. Với ΛCDM, thay $\rho_m \propto a^{-3}$ và $\rho_\Lambda$ không đổi, $\ddot a = 0$ khi $\Omega_m a^{-3} = 2\Omega_\Lambda$. Với $\Omega_m = 0{,}315$, $\Omega_\Lambda = 0{,}685$: $a = 0{,}613$, $z = 1/a - 1 \approx 0{,}63$; tích phân $a(t)$ cho thời điểm đó là 7,7 tỉ năm sau Vụ Nổ Lớn.
+++`,
        vao: (c) => c.cauHinh({ moHinh: 'thuc', a: Math.cbrt(0.315 / 1.37), muiTen: true, luoi: true, do_: false, doThi: 'a', thuoc: false, hubble: false, bip: false, mayAnh: 'tong' , hud: ['gianNo', 'a', 'H', 'z'] }),
        nut: { truoc: (c) => c.cauHinh({ t: 4 }), dung: (c) => c.cauHinh({ a: Math.cbrt(0.315 / 1.37) }), sau: (c) => c.cauHinh({ t: 11 }) },
      },
      {
        ten: 'Tuổi và số phận: vì sao chọn ΛCDM',
        noiDung: R`
Biết $H(a)$ là tính được tuổi vũ trụ: cộng dồn thời gian để $a$ tăng từ 0 tới 1,

$$ t_0 = \int_0^1 \frac{\dd a}{a\,H(a)}, $$

$$ H(a) = H_0\sqrt{\Omega_r a^{-4} + \Omega_m a^{-3} + \Omega_k a^{-2} + \Omega_\Lambda} , $$

với $\Omega_k = 1 - \Omega_r - \Omega_m - \Omega_\Lambda$. Cùng $H_0 = 67{,}4$, mỗi kiểu vũ trụ cho một tuổi khác nhau:

| Kiểu vũ trụ | Tuổi hôm nay | Tương lai |
|---|---|---|
| Vũ trụ thật (ΛCDM) | 13,8 tỉ năm | giãn nhanh dần mãi |
| Chỉ có vật chất, phẳng | 9,7 tỉ năm | giãn chậm dần mãi |
| Quá nhiều vật chất ($\Omega_m = 2{,}5$) | 7,8 tỉ năm | giãn tới 1,67 lần hôm nay rồi co sập, sau 54 tỉ năm nữa |
| Gần như trống ($\Omega_m = 0{,}05$) | 13,5 tỉ năm | giãn gần đều |

> [Thử ngay] [[Vũ trụ thật|thuc]] [[Chỉ có vật chất|vc]] [[Quá nhiều vật chất|dong]] [[Gần như trống|rong]]

Vũ trụ chỉ có vật chất **trẻ hơn** những ngôi sao già nhất đo được (khoảng 12–13 tỉ năm): mâu thuẫn. Vũ trụ gần trống thì không tạo được các thiên hà và cụm thiên hà ta thấy. ΛCDM được chọn vì ba loại số liệu độc lập cùng chỉ về một chỗ: siêu tân tinh (giãn nhanh dần), bức xạ nền (không gian phẳng, $\Omega_m$ khoảng 0,3) và sự phân bố các thiên hà.

+++ Đi sâu: công thức đóng cho tuổi vũ trụ
Bỏ bức xạ (chỉ ảnh hưởng tới vài chục nghìn năm đầu), vũ trụ phẳng chỉ có vật chất và hằng số vũ trụ có nghiệm đóng:

$$ t_0 = \frac{2}{3H_0\sqrt{\Omega_\Lambda}}\,\operatorname{arsinh}\sqrt{\frac{\Omega_\Lambda}{\Omega_m}} . $$

Thay $1/H_0 = 14{,}51$ tỉ năm, $\Omega_\Lambda = 0{,}685$, $\Omega_m = 0{,}315$: $\sqrt{\Omega_\Lambda/\Omega_m} = 1{,}475$, $\operatorname{arsinh} 1{,}475 = 1{,}181$, nên $t_0 = 14{,}51 \times \dfrac{2 \times 1{,}181}{3 \times 0{,}828} \approx 13{,}8$ tỉ năm. Mô hình trong bài tích phân số đủ cả bức xạ và cho 13,79 tỉ năm.

Khi $\Omega_\Lambda = 0$, $\Omega_m = 1$: $t_0 = \dfrac{2}{3H_0} = 9{,}7$ tỉ năm. Vũ trụ trống hẳn ($\Omega = 0$): $a$ tăng đều, $t_0 = 1/H_0 = 14{,}5$ tỉ năm.
+++`,
        vao: (c) => c.cauHinh({ moHinh: 'vc', t: 'nay', muiTen: true, luoi: true, do_: false, doThi: 'a', thuoc: false, hubble: false, bip: false, mayAnh: 'tong' , hud: ['gianNo', 'a', 'H', 'nhietDo'] }),
        nut: { thuc: (c) => c.cauHinh({ moHinh: 'thuc' }), vc: (c) => c.cauHinh({ moHinh: 'vc' }), dong: (c) => c.cauHinh({ moHinh: 'dong' }), rong: (c) => c.cauHinh({ moHinh: 'rong' }) },
      },
      {
        ten: 'Hiểu cho đúng, và câu hỏi còn mở',
        noiDung: R`
Máy quay lùi xa. Quả cầu kính đỏ cam là {{mặt cầu Hubble}}: ở đó vận tốc lùi xa $H_0 d$ đúng bằng $c$, bán kính $c/H_0 \approx 14{,}5$ tỉ năm ánh sáng. Ánh sáng từ những thiên hà có $z$ lớn hơn khoảng 1,5 đang tới ta từ những nơi hôm nay lùi xa **nhanh hơn ánh sáng**.

> [Hiểu sai thường gặp] «Lùi nhanh hơn ánh sáng là trái thuyết tương đối.» Thuyết tương đối hẹp cấm một vật vượt qua tia sáng **ngay bên cạnh nó**. Vận tốc lùi xa là tốc độ tăng của một khoảng cách rất lớn, cộng dồn từ sự giãn của mọi đoạn không gian dọc đường. Không vật nào đuổi kịp tia sáng tại chỗ.

> [Hiểu sai thường gặp] «Mọi thứ đều giãn theo: nguyên tử, Trái Đất, Hệ Mặt Trời.» Không. Những gì liên kết chặt bởi hấp dẫn hay lực điện từ giữ nguyên kích thước; giãn nở chỉ thấy giữa các nhóm và cụm thiên hà không còn giữ nhau. Nếu khoảng cách Trái Đất – Mặt Trời giãn theo $H_0$, nó sẽ tăng 10 m mỗi năm; quỹ đạo Trái Đất không giãn như thế. Vì vậy các thiên hà trong mô hình giữ nguyên cỡ.

> [Thử ngay] Kéo đồng hồ vũ trụ về tương lai: mặt cầu Hubble chỉ lớn dần tới khoảng 17,5 tỉ năm ánh sáng rồi gần như đứng lại, còn khoảng cách tới các thiên hà thì cứ nhân lên, nên chúng lần lượt ra ngoài mặt cầu.
> [[Bật hoặc tắt mặt cầu Hubble|hubble]] [[Lúc a = 0,5|qk]] [[Về hôm nay|nay]]

**Căng thẳng Hubble.** Hai cách đo $H_0$ không khớp: từ bức xạ nền qua mô hình ΛCDM, Planck cho $67{,}4 \pm 0{,}5$; từ thang khoảng cách (sao biến quang Cepheid rồi siêu tân tinh), nhóm SH0ES đo được $73 \pm 1$. Lệch 8%, lớn hơn nhiều so với sai số mỗi bên báo. Một nhóm khác dùng kính James Webb với những loại sao khác thay cho Cepheid lại được khoảng 70, nằm giữa hai bên. Có thể còn sai số chưa phát hiện, cũng có thể ΛCDM thiếu một mảnh vật lý. Tới nay **chưa ngã ngũ**.

**Năng lượng tối có thật là hằng số?** Số liệu DESI (2024–2025) về phân bố các thiên hà, ghép với siêu tân tinh và bức xạ nền, **gợi ý** năng lượng tối có thể yếu dần theo thời gian. Độ tin cậy chưa đủ để khẳng định; mô hình trong bài vẫn dùng hằng số vũ trụ.

Bài sau vẽ chính vũ trụ này thành một sơ đồ không-thời gian: nón ánh sáng quá khứ của ta, mặt cầu Hubble, và những chân trời giới hạn những gì ta có thể thấy.`,
        vao: (c) => c.cauHinh({ moHinh: 'thuc', t: 'nay', muiTen: true, luoi: false, do_: false, doThi: 'hubble', thuoc: true, hubble: true, bip: false, mayAnh: 'xa' , hud: ['mau', 'H', 'a', 'gianNo'] }),
        nut: { hubble: (c) => c.datHubble(), qk: (c) => c.cauHinh({ a: 0.5 }), nay: (c) => c.cauHinh({ t: 'nay' }) },
        thuThach: {
          de: 'Kéo đồng hồ vũ trụ về tương lai (và kéo thiên hà mẫu nếu cần) tới khi thiên hà mẫu nằm đúng trên mặt cầu Hubble: lùi xa đúng bằng tốc độ ánh sáng (sai lệch dưới 0,04 c).',
          kiem: (c) => { const s = c.trangThai(); return s.moHinh === 'thuc' && Math.abs(s.vMau - THU_THACH.bangC.v) < THU_THACH.bangC.sai; },
          goiY: 'Thiên hà mẫu ban đầu (nay cách 3,3 tỉ năm ánh sáng) lùi đúng bằng $c$ khi vũ trụ khoảng 42 tỉ năm tuổi. Kéo thiên hà mẫu ra xa hơn thì lúc ấy tới sớm hơn.',
        },
      },
    ],
    congThuc: [
      { ten: 'Định luật Hubble–Lemaître', tex: R`v = H_0\,d, \qquad H = \frac{\dot a}{a}`, y: '$H_0 \\approx 67{,}4$ km/s mỗi megaparsec (Planck); $1/H_0 \\approx 14{,}5$ tỉ năm.' },
      { ten: 'Dịch chuyển đỏ vũ trụ học', tex: R`1 + z = \frac{1}{a_\text{phát}}`, y: '$a$ là hệ số tỉ lệ lúc ánh sáng phát ra (hôm nay $a = 1$).' },
      { ten: 'Phương trình Friedmann', tex: R`H^2 = \frac{8\pi G}{3}\,\rho - \frac{kc^2}{a^2}`, y: '$\\rho$ gồm vật chất, bức xạ và năng lượng tối; $k$ là độ cong của không gian.' },
      { ten: 'Mật độ tới hạn', tex: R`\rho_c = \frac{3H_0^2}{8\pi G} \approx 8{,}5 \times 10^{-27}\ \text{kg/m}^3`, y: 'Cỡ 5 nguyên tử hiđrô mỗi mét khối. $\\Omega = \\rho/\\rho_c$.' },
      { ten: 'Phương trình gia tốc', tex: R`\frac{\ddot a}{a} = -\frac{4\pi G}{3}\left(\rho + \frac{3P}{c^2}\right)`, y: 'Năng lượng tối có $P = -\\rho c^2$ nên làm giãn nở nhanh dần.' },
      { ten: 'Ba cách loãng đi', tex: R`\rho_r \propto a^{-4}, \quad \rho_m \propto a^{-3}, \quad \rho_\Lambda = \text{hằng số}`, y: 'Bức xạ trội lúc đầu, rồi vật chất, giờ là năng lượng tối.' },
    ],
    cauHoi: [
      {
        hoi: 'Với $H_0 = 70$ km/s mỗi megaparsec, một thiên hà cách 200 Mpc lùi xa với vận tốc bao nhiêu?',
        chon: ['3 500 km/s', '14 000 km/s', '0,35 km/s', '140 000 km/s'],
        dung: 1,
        giai: '$v = H_0 d = 70 \\times 200 = 14\\,000$ km/s. Đơn vị «km/s mỗi megaparsec» nghĩa là mỗi megaparsec khoảng cách thêm 70 km/s vận tốc.',
      },
      {
        hoi: 'Một người ở một thiên hà cách ta 1 tỉ năm ánh sáng nhìn ra vũ trụ. Người ấy thấy gì?',
        chon: ['Mọi thiên hà bay về phía Ngân Hà, tâm của giãn nở', 'Mọi thiên hà khác lùi xa mình, càng xa lùi càng nhanh, y như ta thấy', 'Một nửa bầu trời lùi xa, nửa kia tiến lại', 'Các thiên hà đứng yên, vì người ấy đang bay cùng chúng'],
        dung: 1,
        giai: 'Giãn nở $v = Hd$ không có tâm: từ thiên hà nào cũng thấy cùng một định luật. Ngân Hà không có gì đặc biệt.',
      },
      {
        hoi: 'Ánh sáng phát ra khi mọi khoảng cách lớn chỉ bằng 1/4 hôm nay. Dịch chuyển đỏ $z$ của nó là bao nhiêu?',
        chon: ['0,25', '3', '4', '16'],
        dung: 1,
        giai: '$1 + z = 1/a = 4$, nên $z = 3$. Hay nhầm thành $z = 4$ vì quên số 1, hoặc $z = 0{,}25$ vì lấy thẳng $a$.',
      },
      {
        hoi: 'Khi $a = 0{,}5$, mật độ vật chất và mật độ năng lượng tối (hằng số vũ trụ) gấp bao nhiêu lần hôm nay?',
        chon: ['Vật chất gấp 2, năng lượng tối gấp 2', 'Vật chất gấp 8, năng lượng tối không đổi', 'Vật chất gấp 8, năng lượng tối gấp 8', 'Vật chất gấp 16, năng lượng tối không đổi'],
        dung: 1,
        giai: 'Vật chất loãng theo $a^{-3}$: $0{,}5^{-3} = 8$. Hằng số vũ trụ không loãng. Gấp 16 là của bức xạ ($a^{-4}$).',
      },
      {
        hoi: 'Vì sao năng lượng tối làm vũ trụ giãn nhanh dần, trong khi vật chất làm giãn chậm dần?',
        chon: ['Vì năng lượng tối loãng nhanh hơn vật chất', 'Vì áp suất của nó âm, $P = -\\rho c^2$, nên $\\rho + 3P/c^2$ âm và phương trình gia tốc cho $\\ddot a > 0$', 'Vì nó là một lực ly tâm do vũ trụ quay', 'Vì vũ trụ đóng'],
        dung: 1,
        giai: 'Phương trình gia tốc chứa $\\rho + 3P/c^2$. Với vật chất $P \\approx 0$, tổng dương: hãm. Với năng lượng tối, tổng bằng $-2\\rho_\\Lambda$: đẩy. Năng lượng tối không loãng chút nào, chứ không phải loãng nhanh hơn.',
      },
      {
        hoi: 'Một bạn nói: «Thiên hà ở $z = 3$ đang lùi xa nhanh hơn ánh sáng, vậy thuyết tương đối sai rồi. Mà nếu không gian giãn thì cái bàn của tôi cũng phải to ra.» Hãy trả lời cả hai ý.',
        dap: 'Thuyết tương đối hẹp chỉ cấm vượt tia sáng tại cùng một chỗ. Vận tốc lùi xa là tốc độ tăng của khoảng cách tới một nơi rất xa, do mọi đoạn không gian dọc đường cùng giãn; không vật nào đuổi kịp tia sáng bên cạnh nó, nên không có mâu thuẫn. Còn cái bàn, nguyên tử, Trái Đất, Hệ Mặt Trời và cả thiên hà được lực điện từ hoặc hấp dẫn giữ chặt, nên giữ nguyên kích thước; giãn nở chỉ thể hiện giữa các nhóm thiên hà không còn giữ nhau.',
      },
    ],
    docThem: [
      'B. Ryden, *Introduction to Cosmology* (bản 2, 2016): định luật Hubble, phương trình Friedmann suy kiểu Newton, các mô hình vũ trụ một và nhiều thành phần, đo các tham số vũ trụ học.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 17–18: vũ trụ học, metric Friedmann–Robertson–Walker, lịch sử giãn nở.',
      'Davis và Lineweaver 2004, «Expanding Confusion», PASA 21, 97: lùi xa nhanh hơn ánh sáng, dịch chuyển đỏ, mặt cầu Hubble; gỡ từng hiểu sai.',
      'Baez và Bunn 2005, «The Meaning of Einstein’s Equation», Am. J. Phys. 73, 644: từ $\\rho + 3P/c^2$ tới phương trình gia tốc của vũ trụ.',
    ],
    thuatNgu: [
      { vi: 'định luật Hubble–Lemaître', en: 'Hubble–Lemaître law', nghia: 'Vận tốc lùi xa tỉ lệ với khoảng cách: $v = H_0 d$. Lemaître suy ra năm 1927, Hubble công bố số liệu năm 1929.' },
      { vi: 'phương trình Friedmann', en: 'Friedmann equation', nghia: 'Phương trình Einstein viết cho vũ trụ đồng nhất, đẳng hướng: $H^2 = \\tfrac{8\\pi G}{3}\\rho - kc^2/a^2$.' },
      { vi: 'mật độ tới hạn', en: 'critical density', nghia: 'Mật độ làm không gian phẳng: $3H^2/(8\\pi G)$, hôm nay khoảng $8{,}5 \\times 10^{-27}$ kg/m³.' },
      { vi: 'tham số mật độ', en: 'density parameter Ω', nghia: 'Mật độ của một thành phần chia cho mật độ tới hạn. Hôm nay $\\Omega_m \\approx 0{,}315$, $\\Omega_\\Lambda \\approx 0{,}685$.' },
      { vi: 'phương trình gia tốc', en: 'acceleration equation', nghia: '$\\ddot a/a = -\\tfrac{4\\pi G}{3}(\\rho + 3P/c^2)$: cho biết giãn nở đang nhanh dần hay chậm dần.' },
      { vi: 'vật chất tối', en: 'dark matter', nghia: 'Vật chất không phát sáng, chỉ lộ ra qua lực hấp dẫn; chiếm khoảng 27% năng lượng của vũ trụ, gấp năm lần vật chất thường.' },
      { vi: 'siêu tân tinh loại Ia', en: 'type Ia supernova', nghia: 'Vụ nổ của một sao lùn trắng; độ sáng thật gần như như nhau nên dùng làm «ngọn nến chuẩn» để đo khoảng cách.' },
      { vi: 'căng thẳng Hubble', en: 'Hubble tension', nghia: 'Độ lệch giữa $H_0$ suy từ bức xạ nền (67,4) và $H_0$ đo bằng thang khoảng cách (khoảng 73). Chưa có lời giải.' },
    ],
  },

  conSo: [
    '**67,4 km/s mỗi megaparsec**: hằng số Hubble theo Planck; đo bằng thang khoảng cách thì khoảng 73 («căng thẳng Hubble»).',
    '**13,8 tỉ năm**: tuổi vũ trụ theo ΛCDM (Planck 2018: 13,79). Còn $1/H_0 = 14{,}5$ tỉ năm.',
    '**8,5 × 10⁻²⁷ kg/m³**: mật độ tới hạn, cỡ 5 nguyên tử hiđrô mỗi mét khối.',
    '**5% – 27% – 68%**: vật chất thường, vật chất tối và năng lượng tối trong vũ trụ hôm nay.',
    '**6,1 tỉ năm trước** ($z \\approx 0{,}63$): giãn nở chuyển từ chậm dần sang nhanh dần.',
    '**2,725 K**: nhiệt độ bức xạ nền hôm nay; phát ra ở $z \\approx 1\\,090$, khi vũ trụ chừng 380 000 năm tuổi.',
  ],
  hieuDung: '**Thiên hà không «bay» trong không gian; chính không gian giãn ra.** Vì vậy những thiên hà rất xa có thể lùi nhanh hơn ánh sáng mà không vi phạm thuyết tương đối. Vụ Nổ Lớn không xảy ra tại một điểm mà ở khắp nơi. Những thứ liên kết chặt như nguyên tử, Trái Đất, Hệ Mặt Trời và cả thiên hà thì **không** giãn ra theo; trong mô hình, kích thước các thiên hà vì thế được giữ nguyên.',
  nguon: 'Tham số vũ trụ: Planck Collaboration 2020, A&A 641, A6 (H0 = 67,4 ± 0,5; Ωm = 0,315; Ωb·h² = 0,0224; tuổi 13,79 tỉ năm; z = 1 090). H0 khoảng 73 từ thang khoảng cách: nhóm SH0ES (Riess và cộng sự 2022); khoảng 70 bằng kính James Webb: Freedman và cộng sự 2025. Gợi ý năng lượng tối biến đổi: DESI 2025 (DR2). Giãn nở tăng tốc: Riess và cộng sự 1998, Perlmutter và cộng sự 1999. Lemaître 1927, Hubble 1929. Suy luận theo Ryden (2016), Hartle (2003) ch. 17–18, Baez và Bunn 2005, Davis và Lineweaver 2004. Các con số tính lại trong kiem-tra/kiem-song-va-gian-no.mjs.',
  mayAnh: { viTri: [70, 95, 235], dich: [0, 0, 0], fov: 42, min: 20, max: 3000 },

  tao(app) {
    const scene = new THREE.Scene();
    const camera = app.camera;
    const am = app.am, tt = app.tt;
    scene.add(taoNenSao({ soSao: 700, hat: 53, doSang: 0.22, nganHa: false }));
    const goc = taoThienHa();
    const vt = new Float32Array(SO_TH * 3);          // tọa độ đồng chuyển động so với thiên hà nhà
    const zTH = new Float32Array(SO_TH);             // dịch chuyển đỏ của ánh sáng từ mỗi thiên hà tới nhà lúc này

    // ----- Các thiên hà: một lưới vuông dùng chung, mỗi thiên hà một bản (instance) -----
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const atVT = new THREE.InstancedBufferAttribute(vt, 3); atVT.setUsage(THREE.DynamicDrawUsage);
    const atZ = new THREE.InstancedBufferAttribute(zTH, 1); atZ.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aViTri', atVT);
    geo.setAttribute('aTruc', new THREE.InstancedBufferAttribute(goc.truc, 3));
    geo.setAttribute('aTS', new THREE.InstancedBufferAttribute(goc.ts, 4));
    geo.setAttribute('aMau', new THREE.InstancedBufferAttribute(goc.mauTH, 3));
    geo.setAttribute('aZ', atZ);
    geo.instanceCount = SO_TH;
    const uA = { value: 1 };
    const U = { uA, uPx: { value: 1000 }, uSang: { value: 1.3 }, uDo: { value: 0 }, uMep0: { value: R_HIEN }, uMep1: { value: NUA } };
    const matTH = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS_TH, fragmentShader: FS_TH, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    matTH.tuyenTinh = true;
    const thienHa = new THREE.Mesh(geo, matTH);
    thienHa.frustumCulled = false;
    thienHa.renderOrder = 1;
    scene.add(thienHa);

    // ----- Tấm vải không gian: lưới vẽ trong shader theo toạ độ đồng chuyển động, nên giãn đúng theo a -----
    const matVai = new THREE.ShaderMaterial({
      uniforms: { uA, uMau: { value: new THREE.Color(0x86aef5) }, uDoMo: { value: 1 } },
      vertexShader: /* glsl */ `
        varying vec3 vW;
        void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uA, uDoMo; uniform vec3 uMau; varying vec3 vW;
        float net(vec2 o, float rong) { vec2 d = max(fwidth(o), vec2(1e-6)); vec2 g = abs(fract(o - 0.5) - 0.5) / d; return 1.0 - smoothstep(rong * 0.5 - 0.5, rong * 0.5 + 0.8, min(g.x, g.y)); }
        float mem(vec2 o, float w) { vec2 g = abs(fract(o - 0.5) - 0.5); return exp(-min(g.x, g.y) / w); }
        void main() {
          vec2 x = vW.xz / uA;                                   // toạ độ đồng chuyển động
          float r = length(x) / ${NUA.toFixed(1)};
          float mep = 1.0 - smoothstep(0.45, 0.97, r);
          if (mep <= 0.0) discard;
          vec2 o = fwidth(x / 10.0);
          float oPx = 1.0 / max(max(o.x, o.y), 1e-6);
          float hienPhu = smoothstep(4.0, 14.0, oPx);
          float phu = net(x / 10.0, 1.1) * hienPhu;
          float chinh = net(x / 50.0, 1.9);
          float quang = mem(x / 50.0, 0.03) * 0.55 + mem(x / 10.0, 0.045) * 0.2 * hienPhu;
          float nen = 0.045 * (1.0 - r);
          vec3 c = uMau * (nen + 0.15 * phu + 0.42 * chinh + 0.2 * quang) * mep * uDoMo;
          gl_FragColor = vec4(c, 1.0);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    matVai.tuyenTinh = true;
    const vai = new THREE.Mesh(new THREE.PlaneGeometry(2 * NUA, 2 * NUA), matVai);
    vai.rotation.x = -Math.PI / 2;
    vai.renderOrder = -1;
    const nhanVai = taoNhan(chuCanh("canh.luoi-khong-gian-moi-o-300-mpc-dong", "Lưới không gian<small>mỗi ô 300 Mpc, giãn theo a</small>"), 'mo tran');
    scene.add(vai, nhanVai);

    // ----- Quả cầu cố định (bán kính thật 5 tỉ năm ánh sáng) -----
    const cau = taoCauKinh(0x7fcaff, { doMo: 0.2 });
    cau.scale.setScalar(R_CAU);
    const nhanCau = taoNhan(chuCanh("canh.qua-cau-co-dinh-ban-kinh-that-5", "Quả cầu cố định<small>5 tỉ năm ánh sáng, không giãn</small>"), 'xanh');
    nhanCau.position.set(-R_CAU * 0.72, -R_CAU * 0.72, 0);   // nửa dưới: tránh gợi ý kéo của đồng hồ vũ trụ
    scene.add(cau, nhanCau);

    // ----- Thiên hà nhà: vòng vàng đánh dấu -----
    const vongNha = new THREE.Sprite(new THREE.SpriteMaterial({ map: texVong(), color: new THREE.Color(0xf3c66f).multiplyScalar(2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    vongNha.renderOrder = 3;
    const nhanNha = taoNhan(chuCanh("canh.thien-ha-nha-ban-dang-dung-o-day", "Thiên hà nhà<small>bạn đang đứng ở đây</small>"), 'vang dam');
    scene.add(vongNha, nhanNha);

    // ----- Mũi tên vận tốc lùi xa: nét dày sáng dần về mũi, đầu nhọn hình nón -----
    const SO_MT = 80;
    const boMT = new THREE.InstancedInterleavedBuffer(new Float32Array(SO_MT * 6), 6, 1); boMT.setUsage(THREE.DynamicDrawUsage);
    const boMauMT = new THREE.InstancedInterleavedBuffer(new Float32Array(SO_MT * 6), 6, 1);
    for (let i = 0; i < SO_MT; i++) boMauMT.array.set([0.04, 0.16, 0.24, 0.55, 1.15, 1.5], i * 6);
    const geoMT = new LineSegmentsGeometry();
    geoMT.setAttribute('instanceStart', new THREE.InterleavedBufferAttribute(boMT, 3, 0));
    geoMT.setAttribute('instanceEnd', new THREE.InterleavedBufferAttribute(boMT, 3, 3));
    geoMT.setAttribute('instanceColorStart', new THREE.InterleavedBufferAttribute(boMauMT, 3, 0));
    geoMT.setAttribute('instanceColorEnd', new THREE.InterleavedBufferAttribute(boMauMT, 3, 3));
    geoMT.instanceCount = SO_MT;
    const muiTen = new LineSegments2(geoMT, new LineMaterial({ color: 0xffffff, linewidth: 2.2, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    muiTen.frustumCulled = false;
    const dauMT = new THREE.InstancedMesh(new THREE.ConeGeometry(0.42, 1.5, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x7fe0ff).multiplyScalar(1.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), SO_MT);
    dauMT.frustumCulled = false;
    scene.add(muiTen, dauMT);
    const _o = new THREE.Object3D(), _h = new THREE.Vector3(), TRUC_Y = new THREE.Vector3(0, 1, 0);
    let dsGan = [];

    // ----- Thước đo tới thiên hà mẫu: nét vàng có vạch mỗi tỉ năm ánh sáng -----
    const thuoc = new DuongDay(2, { mau: 0xf3c66f, rong: 2.4, quang: 0.14, sang: 1.5 });
    const SO_VACH = 40;
    const vtVach = new Float32Array(SO_VACH * 3);
    const geoVach = new THREE.BufferGeometry();
    geoVach.setAttribute('position', new THREE.BufferAttribute(vtVach, 3));
    const vach = new THREE.Points(geoVach, new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, map: texDom(), color: new THREE.Color(0xffe2a0).multiplyScalar(1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    vach.frustumCulled = false;
    const nhanThuoc = taoNhan('', 'vang');
    nhanThuoc.center.set(-0.08, 0.5);   // tâm dọc 0,5 để bộ gỡ nhãn đè đo đúng chỗ; dời xuống bằng vị trí
    scene.add(thuoc.line, vach, nhanThuoc);

    // ----- Mặt cầu Hubble: nơi vận tốc lùi xa bằng c -----
    const cauHubble = taoCauKinh(0xff8a73, { doMo: 0.2, kt: 36, vt: 18 });
    const nhanHubble = taoNhan('', 'tran', { giua: true });
    nhanHubble.element.style.color = '#ff8a73';
    scene.add(cauHubble, nhanHubble);

    // ----- Đồng hồ vũ trụ: cột đứng ở thiên hà nhà, đốm xanh kéo được (vị trí theo căn bậc hai của thời gian) -----
    const COT_Y0 = 8, COT_DAI = 58;
    const cot = new DuongDay(2, { mau: 0x7fcaff, rong: 1.6, doMo: 0.55, sang: 1.1 });
    cot.dat(0, 0, COT_Y0, 0); cot.dat(1, 0, COT_Y0 + COT_DAI, 0); cot.xong(2);
    const cotDaQua = new DuongDay(2, { mau: 0x7fcaff, rong: 3.4, doMo: 1, quang: 0.16, sang: 1.8 });
    const MOC_COT = [[1, chuCanh("canh.1-ti-nam", "1 tỉ năm")], [4, '4'], [13.8, chuCanh("canh.hom-nay", "hôm nay")], [25, '25'], [40, chuCanh("canh.40-ti-nam", "40 tỉ năm")]];
    const vachCot = MOC_COT.map(([t, chu]) => {
      const n = taoNhan(chu, t === 13.8 ? 'xanh dam tran' : 'xanh tran');
      const g = new DuongDay(2, { mau: 0x7fcaff, rong: 1.6, doMo: 0.8, sang: 1.2 });
      scene.add(n, g.line);
      return { t, n, g };
    });
    const nhanCot = taoNhan(chuCanh("canh.dong-ho-vu-tru-tuoi-vu-tru-keo", "Đồng hồ vũ trụ<small>tuổi vũ trụ, kéo đốm xanh để đổi</small>"), 'xanh dam');
    scene.add(cot.line, cotDaQua.line, nhanCot);

    // ----- Trạng thái -----
    let mh = MO_HINH[0], Om = mh.Om, OL = mh.OL;
    let ls = null, tMin = 0.02, tMax = 60;
    let tv = 13.8;                 // tỉ năm kể từ Vụ Nổ Lớn
    let dangChieu = false;
    let chiSoNha = 0, chiSoMau = 0, chiSoKhac = 0;
    const nhaGoc = [0, 0, 0];
    const hien = { muiTen: true, luoi: true, do_: false, thuoc: true, hubble: false, bip: false, hud: ['a', 'H', 'gianNo', 'cau'] };
    let kieuDT = 'a';
    let a = 1, daDemTrong = 0;
    let soLanChuyen = 0, soBamCanh = 0;
    const lsChuan = lichSuGianNo({ H0, Om: 0.315, OL: 0.685, Or: OR }, { tSau: 45 });
    const kcMau = new Float32Array(Math.ceil(SO_TH / 9));   // khoảng cách đồng chuyển động của các điểm vẽ trên đồ thị Hubble
    let soKcMau = 0;
    const yCot = (t) => COT_Y0 + COT_DAI * Math.sqrt(Math.min(1, Math.max(0, (t - tMin) / (tMax - tMin))));
    const tCot = (y) => tMin + (tMax - tMin) * ((Math.min(COT_Y0 + COT_DAI, Math.max(COT_Y0, y)) - COT_Y0) / COT_DAI) ** 2;

    function datNha(i) {
      chiSoNha = i;
      const hx = goc.vt[i * 3], hy = goc.vt[i * 3 + 1], hz = goc.vt[i * 3 + 2];
      nhaGoc[0] = hx; nhaGoc[1] = hy; nhaGoc[2] = hz;
      const kc = [];
      for (let k = 0; k < SO_TH; k++) {
        const x = boc(goc.vt[k * 3] - hx), y = boc(goc.vt[k * 3 + 1] - hy), z = boc(goc.vt[k * 3 + 2] - hz);
        vt[k * 3] = x; vt[k * 3 + 1] = y; vt[k * 3 + 2] = z;
        if (k !== i) kc.push([k, x * x + y * y + z * z]);
      }
      atVT.needsUpdate = true;
      kc.sort((p, q) => p[1] - q[1]);
      // chọn rải đều theo khoảng cách để thấy "xa gấp đôi, lùi nhanh gấp đôi"
      dsGan = [];
      for (let k = 0; k < SO_MT; k++) dsGan.push(kc[Math.min(kc.length - 1, 4 + k * 9)][0]);
      // thiên hà mẫu cho thước đo (khoảng 1 000 Mpc hôm nay) và «nhà kế tiếp» (khoảng 1 600 Mpc)
      chiSoMau = (kc.find((p) => p[1] >= 34 * 34) ?? kc[kc.length - 1])[0];
      chiSoKhac = (kc.find((p) => p[1] >= 52 * 52) ?? kc[kc.length - 1])[0];
      soKcMau = 0;
      for (let k = 0; k < kc.length && soKcMau < kcMau.length; k += 9) {
        const r = Math.sqrt(kc[k][1]);
        if (r < R_HIEN) kcMau[soKcMau++] = r;
      }
    }
    function tinhMoHinh() {
      ls = lichSuGianNo({ H0, Om, OL, Or: OR }, { tSau: 45 });
      tMin = Math.max(0.02, 0.004 * ls.tuoi);
      tMax = ls.tuoi + ls.tCuoi - (ls.coLai ? 0.02 : 0);
      veCot();
    }
    const aTai = (t) => ls.aTai(t - ls.tuoi);
    const tocDoA = (t) => (aTai(t + 0.01) - aTai(t - 0.01)) / 0.02;   // da/dt, mỗi tỉ năm
    // thời điểm (tỉ năm sau Vụ Nổ Lớn) lúc hệ số tỉ lệ đạt aDich lần đầu
    function tTaiA(aDich) {
      const b = ls.bang;
      for (let i = 1; i < b.length; i++) {
        if (b[i].a >= aDich) { const u = (aDich - b[i - 1].a) / (b[i].a - b[i - 1].a || 1); return b[i - 1].t + u * (b[i].t - b[i - 1].t) + ls.tuoi; }
      }
      return ls.tuoi;
    }
    function veCot() {
      for (const v of vachCot) {
        const t = v.t === 13.8 ? ls.tuoi : v.t;
        const co = t > tMin && t < tMax;
        v.n.visible = v.g.line.visible = co;
        v.n._an = !co;
        if (!co) continue;
        const y = yCot(t);
        v.g.dat(0, -1.6, y, 0); v.g.dat(1, 1.6, y, 0); v.g.xong(2);
        v.n.position.set(2.2, y, 0);
      }
      nhanCot.position.set(2.2, COT_Y0 + COT_DAI + 3, 0);
    }

    // ----- Điều khiển -----
    const bang = app.bang;
    const dkMH = bang.chon({
      nhan: chuCanh("canh.kieu-vu-tru", "Kiểu vũ trụ"),
      luaChon: MO_HINH.map((m) => ({ giaTri: m.id, nhan: m.ten, moTa: m.moTa })),
      giaTri: mh.id,
      khiDoi: (id) => { mh = MO_HINH.find((m) => m.id === id); Om = mh.Om; OL = mh.OL; dkOm.dat(Om); dkOL.dat(OL); tinhMoHinh(); tv = Math.min(ls.tuoi, tMax); dkT.dat(phanT(tv)); veDoThi(); },
    });
    const tuChon = () => { mh = { id: 'tu', ten: chuCanh("canh.tu-chon", "Tự chọn") }; dkMH.dat(null); const u = phanT(tv); tinhMoHinh(); tv = Math.min(tMax, Math.max(tMin, tv)); dkT.dat(u > 1 ? 1 : phanT(tv)); veDoThi(); };
    const dkOm = bang.thanhTruot({ nhan: chuCanh("canh.vat-chat-m-ke-ca-vat-chat-toi", "Vật chất Ω<sub>m</sub> (kể cả vật chất tối)"), min: 0.05, max: 3, buoc: 0.005, giaTri: Om, hienThi: (v) => so(v, 3), khiDoi: (v) => { Om = v; tuChon(); } });
    const dkOL = bang.thanhTruot({ nhan: chuCanh("canh.nang-luong-toi", "Năng lượng tối Ω<sub>Λ</sub>"), min: 0, max: 1.2, buoc: 0.005, giaTri: OL, hienThi: (v) => so(v, 3), khiDoi: (v) => { OL = v; tuChon(); } });
    const phanT = (t) => (t - tMin) / (tMax - tMin);
    const dkT = bang.thanhTruot({
      nhan: chuCanh("canh.thoi-gian-ke-tu-vu-no-lon-hoac", "Thời gian kể từ Vụ Nổ Lớn (hoặc kéo đồng hồ vũ trụ trong cảnh)"), min: 0, max: 1, buoc: 0.0005, giaTri: 0.2,
      hienThi: (u) => chuCanh("canh.ti-nam", "{0} tỉ năm", [so(tMin + u * (tMax - tMin), 1)]),
      khiDoi: (u) => { tv = tMin + u * (tMax - tMin); dangChieu = false; },
    });
    bang.nut([
      { nhan: chuCanh("canh.chieu-tu-vu-no-lon", "▶ Chiếu từ Vụ Nổ Lớn"), chinh: true, khiBam: () => { tv = tMin; dangChieu = true; } },
      { nhan: chuCanh("canh.ve-hom-nay", "Về hôm nay"), khiBam: () => { tv = Math.min(ls.tuoi, tMax); dangChieu = false; dkT.dat(phanT(tv)); } },
    ]);
    const dkMT = bang.congTac({ nhan: chuCanh("canh.mui-ten-van-toc-lui-xa", "Mũi tên vận tốc lùi xa"), giaTri: true, khiDoi: (v) => { hien.muiTen = v; capNhatHien(); } });
    const dkLuoi = bang.congTac({ nhan: chuCanh("canh.luoi-khong-gian-gian-theo-vu-tru", "Lưới không gian (giãn theo vũ trụ)"), giaTri: true, khiDoi: (v) => { hien.luoi = v; capNhatHien(); } });
    const dkDo = bang.congTac({ nhan: chuCanh("canh.nhuom-do-theo-dich-chuyen-do-nhin-tu", "Nhuộm đỏ theo dịch chuyển đỏ nhìn từ nhà"), giaTri: false, khiDoi: (v) => { hien.do_ = v; aVeCuoi = -1; } });
    const dkThuoc = bang.congTac({ nhan: chuCanh("canh.thuoc-do-toi-mot-thien-ha-mau", "Thước đo tới một thiên hà mẫu"), giaTri: true, khiDoi: (v) => { hien.thuoc = v; capNhatHien(); } });
    const dkBip = bang.congTac({ nhan: chuCanh("canh.tieng-bip-tu-thien-ha-mau-tram-theo", "Tiếng bíp từ thiên hà mẫu (trầm theo dịch chuyển đỏ)"), giaTri: false, khiDoi: (v) => { hien.bip = v; choBip = 0.2; } });
    const dkDT = bang.chon({
      nhan: chuCanh("canh.do-thi", "Đồ thị"),
      luaChon: [{ giaTri: 'a', nhan: chuCanh("canh.kich-thuoc-a-t", "Kích thước a(t)") }, { giaTri: 'hubble', nhan: chuCanh("canh.van-toc-theo-khoang-cach", "Vận tốc theo khoảng cách") }, { giaTri: 'matDo', nhan: chuCanh("canh.mat-do-ba-thanh-phan", "Mật độ ba thành phần") }],
      giaTri: kieuDT,
      khiDoi: (v) => { kieuDT = v; veDoThi(); },
    });
    const chuDT = bang.chuThich('');
    const dt = bang.doThi(170);
    const chuMau = bang.chuThich('');
    tinhMoHinh();
    tv = ls.tuoi;
    dkT.dat(phanT(tv));
    datNha(0);

    // ----- Tương tác trong cảnh -----
    // Đồng hồ vũ trụ: đốm xanh trượt dọc cột đứng.
    const tayT = tt.tayNam({
      viTri: [0, yCot(tv), 0], mau: 0x7fcaff, co: 1.7,
      rangBuoc: { kieu: 'duong', qua: [0, 0, 0], huong: [0, 1, 0] },
      gioiHan: (p) => { p.x = 0; p.z = 0; p.y = Math.min(COT_Y0 + COT_DAI, Math.max(COT_Y0, p.y)); return p; },
      nhan: chuCanh("canh.keo-de-doi-thoi-gian", "Kéo để đổi thời gian"), ten: chuCanh("canh.dong-ho-vu-tru", "Đồng hồ vũ trụ"),
      moTa: () => chuCanh("canh.tuoi-vu-tru-ti-nam-moi-khoang-cach", "Tuổi vũ trụ <b>{0} tỉ năm</b><br>Mọi khoảng cách lớn bằng <b>{1}%</b> hôm nay (a = {2})", [so(tv, tv < 1 ? 2 : 1), soNghia(a * 100, 3), soNghia(a, 3)]),
      khiNam: () => { dangChieu = false; },
      khiKeo: (p) => { tv = tCot(p.y); dkT.dat(phanT(tv)); },
    });
    // Thiên hà mẫu: đốm vàng trượt dọc tia từ nhà, thiên hà đi theo.
    const huongMau = new THREE.Vector3(1, 0, 0);
    const _w = new THREE.Vector3();
    const chieuLenTia = (tia) => {
      const b = tia.direction.dot(huongMau), e = tia.origin.dot(huongMau), dd = tia.direction.dot(tia.origin);
      const mau = 1 - b * b;
      const s = mau > 1e-6 ? (e - b * dd) / mau : e;
      return _w.copy(huongMau).multiplyScalar(Math.max(0, s));
    };
    const tayM = tt.tayNam({
      viTri: [0, 0, 0], mau: 0xf3c66f, co: 1.9,
      rangBuoc: { kieu: 'ham', chieu: (tia) => chieuLenTia(tia) },
      gioiHan: (p) => { const L = p.length(), lo = 3 * a, hi = R_HIEN * 0.97 * a; if (L < lo) p.copy(huongMau).multiplyScalar(lo); else if (L > hi) p.setLength(hi); return p; },
      nhan: chuCanh("canh.keo-thien-ha-mau-ra-xa-lai-gan", "Kéo thiên hà mẫu"), ten: chuCanh("canh.thien-ha-mau", "Thiên hà mẫu"),
      moTa: () => moTaThienHa(chiSoMau),
      khiKeo: (p) => {
        const j = chiSoMau * 3;
        vt[j] = p.x / a; vt[j + 1] = p.y / a; vt[j + 2] = p.z / a;
        for (let k = 0; k < 3; k++) goc.vt[j + k] = boc(vt[j + k] + nhaGoc[k]);
        atVT.needsUpdate = true; aVeCuoi = -1;
      },
    });
    // Rê chuột lên một thiên hà bất kỳ: đọc khoảng cách, vận tốc, z; bấm để chuyển nhà.
    const dauDo = new THREE.Object3D();
    scene.add(dauDo);
    let chiSoRe = -1;
    const _p = new THREE.Vector3();
    dauDo.raycast = (raycaster, kq) => {
      const ray = raycaster.ray, nguong = raycaster.params.Points.threshold || 1;
      let tot = -1, sau = Infinity;
      for (let i = 0; i < SO_TH; i++) {
        const x = vt[i * 3], y = vt[i * 3 + 1], z = vt[i * 3 + 2];
        if (x * x + y * y + z * z > R_HIEN * R_HIEN) continue;
        _p.set(x * a, y * a, z * a);
        const r = goc.ts[i * 4] * 1.1 + nguong * 0.5;
        if (ray.distanceSqToPoint(_p) > r * r) continue;
        const s = _p.sub(ray.origin).dot(ray.direction);
        if (s > 0 && s < sau) { sau = s; tot = i; }
      }
      if (tot < 0) return;
      chiSoRe = tot;
      dauDo.position.set(vt[tot * 3] * a, vt[tot * 3 + 1] * a, vt[tot * 3 + 2] * a);
      dauDo.updateMatrixWorld();
      kq.push({ distance: sau, object: dauDo, point: dauDo.position.clone() });
    };
    tt.them(dauDo, {
      ten: chuCanh("canh.thien-ha", "Thiên hà"), mau: 0xffe2b0, banKinhPx: 0,
      moTa: () => moTaThienHa(chiSoRe),
      khiBam: () => { if (chiSoRe >= 0 && chiSoRe !== chiSoNha) { datNha(chiSoRe); soLanChuyen++; soBamCanh++; aVeCuoi = -1; } },
    });
    function moTaThienHa(i) {
      if (i < 0) return '';
      const x = vt[i * 3], y = vt[i * 3 + 1], z = vt[i * 3 + 2];
      const D = Math.hypot(x, y, z);
      if (i === chiSoNha) return chuCanh("canh.thien-ha-nha-ban-dang-dung-o-day-52cf88", "<b>Thiên hà nhà</b>: bạn đang đứng ở đây. Mọi thiên hà khác lùi ra xa nơi này.");
      const H = (tocDoA(tv) / a) * 977.79;
      const dMpc = D * a * MPC_MOI_DV, v = H * dMpc;
      const zz = zTai(D);
      const kieu = goc.ts[i * 4 + 1] > 0.5 ? chuCanh("canh.thien-ha-elip", "Thiên hà elip") : chuCanh("canh.thien-ha-xoan", "Thiên hà xoắn");
      return chuCanh("canh.cach-nha-ti-nam-anh-sang-mpc-lui", "{0}{1}<br>Cách nhà <b>{2} tỉ năm ánh sáng</b> ({3} Mpc)<br>Lùi xa <b>{4} km/s</b> = {5} c<br>Ánh sáng tới nhà lúc này: z = {6}{7}", [kieu, i === chiSoMau ? chuCanh("canh.thien-ha-mau-62c1d4", " (thiên hà mẫu)") : '', so(dMpc * GLY_MOI_MPC, 2), so(dMpc, 0), so(v, 0), so(v / C_KM_S, 2), so(zz, 2), i !== chiSoMau ? chuCanh("canh.bam-de-chuyen-nha-sang-day", "<br><i>Bấm để chuyển nhà sang đây</i>") : '']);
    }

    function capNhatHien() {
      muiTen.visible = dauMT.visible = hien.muiTen;
      vai.visible = nhanVai.visible = hien.luoi;
      thuoc.line.visible = vach.visible = nhanThuoc.visible = hien.thuoc;
      tayM.an(!hien.thuoc);
      cauHubble.visible = nhanHubble.visible = hien.hubble;
      chuMau.el.hidden = !hien.do_;
      chuMau.dat(chuCanh("canh.mau-nhuom-mau-quy-uoc-khong-phai-mau", "<b>Màu nhuộm</b> (màu quy ước, không phải màu mắt thấy): <span style=\"color:#fff\">trắng</span> z ≈ 0 · <span style=\"color:#ffae6b\">cam</span> z ≈ 0,5 · <span style=\"color:#ff5a3c\">đỏ thẫm</span> z ≥ 1."));
    }

    function veDoThi() {
      if (kieuDT === 'hubble') return veHubble();
      if (kieuDT === 'matDo') return veMatDo();
      chuDT.dat(chuCanh("canh.kich-thuoc-vu-tru-theo-thoi-gian-duong", "<b>Kích thước vũ trụ theo thời gian.</b> Đường vàng: kiểu vũ trụ đang chọn. Đường xám: vũ trụ thật. Chấm trắng: thời điểm đang xem."));
      const { ctx: g, rong, cao } = dt;
      const x1 = Math.min(60, Math.max(tMax, 30)), y1 = 4;
      const vachX = []; for (let x = 0; x <= x1; x += 10) vachX.push(x);
      const { X, Y } = khungDoThi(g, { rong, cao, x0: 0, x1, y0: 0, y1, nhanX: chuCanh("canh.ti-nam-ke-tu-vu-no-lon", "tỉ năm kể từ Vụ Nổ Lớn"), nhanY: chuCanh("canh.kich-thuoc-a-hom-nay-1", "kích thước a (hôm nay = 1)"), vachX, vachY: [1, 2, 3, 4] });
      const ve = (lich, mau, rongNet) => {
        g.strokeStyle = mau; g.lineWidth = rongNet; g.beginPath();
        let dau = true;
        for (const k of lich.bang) {
          const x = k.t + lich.tuoi;
          if (x > x1 || k.a > y1 * 1.02) continue;
          if (dau) { g.moveTo(X(x), Y(k.a)); dau = false; } else g.lineTo(X(x), Y(k.a));
        }
        g.stroke();
      };
      if (mh.id !== 'thuc') ve(lsChuan, 'rgba(180,184,196,0.6)', 1.2);
      ve(ls, MAU.vang, 2);
      // hôm nay
      g.setLineDash([3, 3]); g.strokeStyle = 'rgba(127,202,255,0.7)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(X(ls.tuoi), Y(0)); g.lineTo(X(ls.tuoi), Y(1)); g.lineTo(X(0), Y(1)); g.stroke(); g.setLineDash([]);
      g.fillStyle = MAU.xanh; g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillText(chuCanh("canh.hom-nay", "hôm nay"), X(ls.tuoi) + 4, Y(0) - 3);
      // điểm uốn: bắt đầu giãn nhanh dần
      if (ls.aTangToc && ls.aTangToc < y1) {
        const tu = tTaiA(ls.aTangToc);
        g.fillStyle = MAU.hong; g.beginPath(); g.arc(X(tu), Y(ls.aTangToc), 3, 0, 2 * Math.PI); g.fill();
        g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(chuCanh("canh.bat-dau-nhanh-dan", "bắt đầu nhanh dần"), X(tu) - 5, Y(ls.aTangToc) - 2);
      }
      const ax = Math.min(y1, a);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(X(Math.min(tv, x1)), Y(ax), 4, 0, 2 * Math.PI); g.fill();
    }

    // Đồ thị Hubble: vận tốc lùi xa (theo c) theo khoảng cách thật lúc tv (tỉ năm ánh sáng)
    function veHubble() {
      const H = (tocDoA(tv) / a) * 977.79;                       // km/s/Mpc
      const dH = Math.abs(H) > 1e-6 ? (C_KM_S / Math.abs(H)) * GLY_MOI_MPC : Infinity;   // tỉ năm ánh sáng
      const dMax = R_HIEN * a * MPC_MOI_DV * GLY_MOI_MPC;
      const x1 = Math.min(80, Math.max(dMax, Math.min(1.3 * dH, 60), 1));
      const vMax = (Math.abs(H) * x1) / GLY_MOI_MPC / C_KM_S;
      const y1 = Math.max(1.3, Math.min(4, vMax * 1.05));
      const y0 = H < 0 ? -y1 : 0;
      const buocX = x1 > 40 ? 10 : x1 > 16 ? 5 : x1 > 6 ? 2 : 1;
      const vachX = []; for (let x = 0; x <= x1; x += buocX) vachX.push(x);
      const vachY = []; for (let y = Math.ceil(y0 * 2) / 2; y <= y1; y += 0.5) vachY.push([y, so(y, 1)]);
      const { ctx: g, rong, cao } = dt;
      const { X, Y } = khungDoThi(g, { rong, cao, x0: 0, x1, y0, y1, nhanX: chuCanh("canh.khoang-cach-that-ti-nam-anh-sang", "khoảng cách thật (tỉ năm ánh sáng)"), nhanY: chuCanh("canh.van-toc-lui-xa-theo-c", "vận tốc lùi xa (theo c)"), vachX, vachY });
      // đường v = H·d
      g.strokeStyle = MAU.xanh; g.lineWidth = 1.6; g.beginPath();
      g.moveTo(X(0), Y(0)); const vx1 = (H * x1) / GLY_MOI_MPC / C_KM_S; g.lineTo(X(x1), Y(Math.max(y0, Math.min(y1, vx1))) ); g.stroke();
      // các cụm thiên hà trong mô hình
      g.fillStyle = 'rgba(255,240,215,0.75)';
      for (let i = 0; i < soKcMau; i++) {
        const d = kcMau[i] * a * MPC_MOI_DV * GLY_MOI_MPC, v = (H * d) / GLY_MOI_MPC / C_KM_S;
        g.fillRect(X(d) - 1.2, Y(v) - 1.2, 2.4, 2.4);
      }
      // thiên hà mẫu
      if (hien.thuoc) {
        const jm = chiSoMau * 3, d = Math.hypot(vt[jm], vt[jm + 1], vt[jm + 2]) * a * MPC_MOI_DV * GLY_MOI_MPC, v = (H * d) / GLY_MOI_MPC / C_KM_S;
        if (d <= x1) { g.fillStyle = MAU.vang; g.beginPath(); g.arc(X(d), Y(Math.max(y0, Math.min(y1, v))), 4, 0, 2 * Math.PI); g.fill(); }
      }
      // v = c và mặt cầu Hubble
      g.setLineDash([3, 3]); g.strokeStyle = 'rgba(243,198,111,0.75)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(X(0), Y(1)); g.lineTo(X(x1), Y(1)); g.stroke();
      g.fillStyle = MAU.vang; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText(chuCanh("canh.toc-do-anh-sang", "tốc độ ánh sáng"), X(0) + 4, Y(1) - 2);
      if (dH < x1) {
        g.strokeStyle = 'rgba(255,138,115,0.8)';
        g.beginPath(); g.moveTo(X(dH), Y(y0)); g.lineTo(X(dH), Y(y1)); g.stroke();
        g.fillStyle = MAU.do; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText(chuCanh("canh.mat-cau-hubble", "mặt cầu Hubble"), X(dH) - 4, Y(y1) + 14);
      }
      g.setLineDash([]);
      chuDT.dat(chuCanh("canh.dinh-luat-hubble-luc-ti-nam-cham-cac", "<b>Định luật Hubble lúc {0} tỉ năm.</b> Chấm: các thiên hà trong mô hình (tới khoảng {1} tỉ năm ánh sáng){2}. Độ dốc là H = {3} km/s mỗi megaparsec. Vạch đỏ cam: khoảng cách c/H, nơi vận tốc lùi xa bằng ánh sáng.", [so(tv, 1), so(dMax, 1), hien.thuoc ? chuCanh("canh.cham-vang-thien-ha-mau", "; chấm vàng: thiên hà mẫu") : '', soNghia(H, 3)]));
    }

    // Mật độ ba thành phần theo hệ số tỉ lệ, thang lũy thừa của 10 (đơn vị: mật độ tới hạn hôm nay)
    function veMatDo() {
      const x0 = -4.5, x1 = 0.7, y0 = -1.5, y1 = 14.5;
      const vachX = [[-4, '10⁻⁴'], [-3, '10⁻³'], [-2, '10⁻²'], [-1, chuCanh("canh.0-1", "0,1")], [0, '1']];
      const vachY = [[0, '1'], [4, '10⁴'], [8, '10⁸'], [12, '10¹²']];
      const { ctx: g, rong, cao } = dt;
      const { X, Y } = khungDoThi(g, { rong, cao, x0, x1, y0, y1, nhanX: chuCanh("canh.he-so-ti-le-a", "hệ số tỉ lệ a"), nhanY: chuCanh("canh.mat-do-so-voi-c-hom-nay", "mật độ (so với ρc hôm nay)"), vachX, vachY });
      g.save(); g.beginPath(); g.rect(X(x0), Y(y1), X(x1) - X(x0), Y(y0) - Y(y1)); g.clip();
      const duong = (logO, mu, mau) => { g.strokeStyle = mau; g.lineWidth = 1.8; g.beginPath(); g.moveTo(X(x0), Y(logO + mu * x0)); g.lineTo(X(x1), Y(logO + mu * x1)); g.stroke(); };
      duong(Math.log10(OR), -4, MAU.hong);
      duong(Math.log10(Om), -3, MAU.xanh);
      if (OL > 0) duong(Math.log10(OL), 0, MAU.vang);
      // hai mốc bằng nhau
      g.fillStyle = '#fff';
      const xEq = Math.log10(OR / Om);
      g.beginPath(); g.arc(X(xEq), Y(Math.log10(Om) - 3 * xEq), 3, 0, 2 * Math.PI); g.fill();
      if (OL > 0) { const xL = Math.log10(Om / OL) / 3; g.beginPath(); g.arc(X(xL), Y(Math.log10(OL)), 3, 0, 2 * Math.PI); g.fill(); }
      // lúc đang xem
      const xa = Math.log10(Math.max(1e-6, a));
      g.setLineDash([3, 3]); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(X(xa), Y(y0)); g.lineTo(X(xa), Y(y1)); g.stroke(); g.setLineDash([]);
      g.restore();
      g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.textBaseline = 'top'; g.fillStyle = MAU.hong; g.fillText(chuCanh("canh.buc-xa-a", "bức xạ ~ a⁻⁴"), X(-2.2) + 6, Y(Math.log10(OR) + 8.8));
      g.textBaseline = 'bottom';
      g.fillStyle = MAU.xanh; g.fillText(chuCanh("canh.vat-chat-a", "vật chất ~ a⁻³"), X(-1.75), Y(Math.log10(Om) + 5.25));
      if (OL > 0) { g.fillStyle = MAU.vang; g.fillText(chuCanh("canh.nang-luong-toi-khong-doi", "năng lượng tối: không đổi"), X(-4.4), Y(Math.log10(OL)) - 2); }
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillText(chuCanh("canh.buc-xa-vat-chat", "bức xạ = vật chất"), X(xEq) + 6, Y(Math.log10(Om) - 3 * xEq) - 3);
      chuDT.dat(chuCanh("canh.mat-do-theo-kich-thuoc-vu-tru-ca", "<b>Mật độ theo kích thước vũ trụ</b> (cả hai trục theo lũy thừa của 10). Vạch đứng: lúc đang xem, a = {0}. Chấm trắng: nơi hai thành phần bằng nhau.", [soNghia(a, 3)]));
    }

    // dịch chuyển đỏ của ánh sáng đến nhà lúc này, theo khoảng cách đồng chuyển động (bảng nội suy)
    const bangD = new Float32Array(80), bangZ = new Float32Array(80);
    function tinhBangDo(aQS) {
      const Ok = 1 - OR - Om - OL;
      let D = 0, ap = aQS;
      for (let i = 0; i < 80; i++) {
        const an = aQS * Math.exp(-(i + 1) * 0.028);
        const am_ = Math.sqrt(ap * an);
        const E = Math.sqrt(Math.max(1e-9, OR / am_ ** 4 + Om / am_ ** 3 + Ok / (am_ * am_) + OL));
        D += (C_TREN_H0 * (ap - an)) / (am_ * am_ * E);
        bangD[i] = D; bangZ[i] = aQS / an - 1;
        ap = an;
      }
    }
    const zTai = (D) => {
      if (D <= bangD[0]) return (bangZ[0] * D) / bangD[0];
      for (let i = 1; i < 80; i++) if (D <= bangD[i]) return bangZ[i - 1] + ((bangZ[i] - bangZ[i - 1]) * (D - bangD[i - 1])) / (bangD[i] - bangD[i - 1]);
      return bangZ[79];
    };

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      if (o.moHinh) dkMH.dat(o.moHinh, true);
      if (o.t != null) { tv = o.t === 'nay' ? Math.min(ls.tuoi, tMax) : Math.min(tMax, Math.max(tMin, o.t)); dangChieu = false; dkT.dat(phanT(tv)); }
      if (o.a != null) { tv = Math.min(tMax, Math.max(tMin, tTaiA(o.a))); dangChieu = false; dkT.dat(phanT(tv)); }
      if (o.chieu) { tv = tMin; dangChieu = true; }
      if (o.muiTen != null) { hien.muiTen = o.muiTen; dkMT.dat(o.muiTen); }
      if (o.luoi != null) { hien.luoi = o.luoi; dkLuoi.dat(o.luoi); }
      if (o.do_ != null) dkDo.dat(o.do_, true);
      if (o.thuoc != null) { hien.thuoc = o.thuoc; dkThuoc.dat(o.thuoc); }
      if (o.hubble != null) hien.hubble = o.hubble;
      if (o.hud) hien.hud = o.hud;
      if (o.bip != null) { hien.bip = o.bip; dkBip.dat(o.bip); choBip = 0.6; }
      if (o.nha != null) { datNha(o.nha === 'khac' ? chiSoKhac : o.nha); if (o.nha === 'khac') soLanChuyen++; aVeCuoi = -1; }
      if (o.demLai) soBamCanh = 0;
      if (o.doThi) { kieuDT = o.doThi; dkDT.dat(o.doThi); }
      capNhatHien();
      veDoThi();
      aVeCuoi = -1;
      if (o.mayAnh) app.bayToi(GOC[o.mayAnh][0], GOC[o.mayAnh][1], 1.8);
    }

    // Trạng thái đọc được (thử thách và bộ kiểm dùng).
    function trangThai() {
      const H = (tocDoA(tv) / a) * 977.79;
      const jm = chiSoMau * 3;
      const dMpc = Math.hypot(vt[jm], vt[jm + 1], vt[jm + 2]) * a * MPC_MOI_DV;
      return { tv, a, H, moHinh: mh.id, homNay: Math.abs(tv - ls.tuoi) < 0.15, vMau: (H * dMpc) / C_KM_S, dMauGly: dMpc * GLY_MOI_MPC, soBamCanh };
    }

    let dMauMpc = 0, choVe = 0, aVeCuoi = -1, choBip = 0.6, gyCuoi = Math.floor(tv), zMau = 0, daThu = false;
    function capNhat(dtg, dtThuc) {
      if (!daThu) { daThu = true; datTrangThaiThu(); }
      if (dangChieu) {
        tv += dtg * ((tMax - tMin) / 26);
        if (tv >= tMax) { tv = tMax; dangChieu = false; }
        dkT.dat(phanT(tv));
      }
      a = Math.max(1e-3, aTai(tv));
      uA.value = a;
      U.uPx.value = (app.cao * app.renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
      U.uDo.value += ((hien.do_ ? 1 : 0) - U.uDo.value) * Math.min(1, dtThuc * 5);
      vai.scale.setScalar(a);
      const dCam = camera.position.length();
      vongNha.scale.setScalar(Math.max(9, dCam * 0.05));
      nhanNha.position.set(0, -Math.max(4, dCam * 0.026), 0);
      nhanVai.position.set(NUA * 0.62 * a, 0, NUA * 0.62 * a);
      // đồng hồ vũ trụ
      const yT = yCot(tv);
      cotDaQua.dat(0, 0, COT_Y0, 0); cotDaQua.dat(1, 0, yT, 0); cotDaQua.xong(2);
      if (!tt.dangKeo) tayT.dat([0, yT, 0]);
      // mũi tên: vận tốc lùi xa v = H·d, vẽ dài tỉ lệ với v
      const hNay = tocDoA(tv) / a;                      // H, đơn vị 1/tỉ năm (âm khi vũ trụ co lại)
      if (hien.muiTen) {
        const k = hNay * 2.6, coDau = Math.max(1, dCam * 0.006);
        const b = boMT.array;
        for (let i = 0; i < SO_MT; i++) {
          const j = dsGan[i] * 3, x = vt[j] * a, y = vt[j + 1] * a, z = vt[j + 2] * a;
          b[i * 6] = x; b[i * 6 + 1] = y; b[i * 6 + 2] = z; b[i * 6 + 3] = x * (1 + k); b[i * 6 + 4] = y * (1 + k); b[i * 6 + 5] = z * (1 + k);
          _h.set(x * k, y * k, z * k);
          const L = _h.length();
          _o.position.set(x * (1 + k), y * (1 + k), z * (1 + k));
          if (L > 1e-6) { _h.multiplyScalar(1 / L); _o.quaternion.setFromUnitVectors(TRUC_Y, _h); _o.position.addScaledVector(_h, -0.5 * coDau); }
          _o.scale.setScalar(L > 1e-6 ? Math.min(coDau, L * 0.6) : 1e-4);
          _o.updateMatrix();
          dauMT.setMatrixAt(i, _o.matrix);
        }
        boMT.needsUpdate = true;
        dauMT.instanceMatrix.needsUpdate = true;
      }
      // thước đo tới thiên hà mẫu
      const jm = chiSoMau * 3;
      const mx = vt[jm] * a, my = vt[jm + 1] * a, mz = vt[jm + 2] * a;
      const dMau = Math.hypot(mx, my, mz);
      dMauMpc = dMau * MPC_MOI_DV;
      if (dMau > 1e-6) huongMau.set(mx / dMau, my / dMau, mz / dMau);
      if (hien.thuoc) {
        thuoc.dat(0, 0, 0, 0); thuoc.dat(1, mx, my, mz); thuoc.xong(2);
        // vạch: mỗi tỉ năm ánh sáng thật một vạch
        const buocVach = 1 / (MPC_MOI_DV * GLY_MOI_MPC);   // đơn vị cảnh cho 1 tỉ năm ánh sáng
        let n = 0;
        for (let s = buocVach; s < dMau - 0.5 && n < SO_VACH; s += buocVach) { vtVach[n * 3] = huongMau.x * s; vtVach[n * 3 + 1] = huongMau.y * s; vtVach[n * 3 + 2] = huongMau.z * s; n++; }
        geoVach.setDrawRange(0, n);
        geoVach.attributes.position.needsUpdate = true;
        nhanThuoc.position.set(mx, my - Math.max(4, camera.position.length() * 0.038), mz);   // dưới thiên hà mẫu, chừa chỗ cho gợi ý kéo
        if (!tt.dangKeo) tayM.dat([mx, my, mz]);
      }
      // mặt cầu Hubble (bán kính thật c/H, đơn vị cảnh)
      const H = hNay * 977.79;
      if (hien.hubble) {
        const rH = H > 0 ? C_KM_S / H / MPC_MOI_DV : 0;
        cauHubble.visible = nhanHubble.visible = rH > 0;
        cauHubble.scale.setScalar(Math.max(1e-3, rH));
        nhanHubble.position.set(0, rH * 0.96, 0);   // đỉnh quả cầu, căn giữa: không chui dưới bảng bài giảng
      }
      // đếm thiên hà trong quả cầu cố định; dịch chuyển đỏ; vẽ lại đồ thị, nhãn
      choVe -= dtThuc;
      if (choVe <= 0 || Math.abs(a - aVeCuoi) > 0.01 * a) {
        choVe = 0.15; aVeCuoi = a;
        const r2 = (R_CAU / a) ** 2;
        let dem = 0;
        tinhBangDo(a);
        const canZ = hien.do_ || U.uDo.value > 0.01;
        for (let i = 0; i < SO_TH; i++) {
          const d2 = vt[i * 3] ** 2 + vt[i * 3 + 1] ** 2 + vt[i * 3 + 2] ** 2;
          if (d2 < r2 && d2 < NUA * NUA) dem++;
          if (canZ) zTH[i] = zTai(Math.sqrt(d2));
        }
        if (canZ) atZ.needsUpdate = true;
        daDemTrong = dem;
        zMau = zTai(dMau / a);
        veDoThi();
        if (hien.thuoc) {
          const dMpc = dMau * MPC_MOI_DV;
          nhanThuoc.datChu(chuCanh("canh.thien-ha-mau-cach", "Thiên hà mẫu<small>cách {0} tỉ năm ánh sáng</small>", [so(dMpc * GLY_MOI_MPC, 2)]));
        }
        if (hien.hubble && H > 0) nhanHubble.datChu(chuCanh("canh.mat-cau-hubble-ban-kinh-c-h-ti", "Mặt cầu Hubble<small>c/H = {0} tỉ năm ánh sáng</small>", [so((C_KM_S / H) * GLY_MOI_MPC, 1)]));
      }
      // Âm thanh (chỉ khi mô hình đang chạy). Tiếng bíp: nốt gốc 880 Hz ở nhà, rồi nốt nhận được từ thiên hà mẫu;
      // tần số và nhịp của nốt nhận được đều chia cho 1 + z, đúng như ánh sáng.
      if (dtg > 0) {
        if (hien.bip && hien.thuoc) {
          choBip -= dtg;
          if (choBip <= 0) {
            const k = 1 + Math.max(0, zMau);
            am.not({ tanSo: BIP_GOC, dai: 0.16, doTo: 0.16, dang: 'mem', lech: -0.35 });
            am.not({ tanSo: BIP_GOC / k, dai: 0.2 * k, doTo: 0.3, dang: 'chuong', lech: 0.35, tre: 0.3 });
            choBip = Math.max(0.3, BIP_CHU_KY * k);
          }
        }
        // mỗi tỉ năm trôi qua (khi chiếu hoặc kéo đồng hồ) một tiếng tích
        const gy = Math.floor(tv);
        if (gy !== gyCuoi) { if (Math.abs(gy - gyCuoi) <= 3) am.tich({ tanSo: 1500, doTo: 0.14, dai: 0.03 }); gyCuoi = gy; }
      } else gyCuoi = Math.floor(tv);
      choNhan -= dtThuc;
      if (choNhan <= 0) { choNhan = 0.25; goNhan(); }
      app.dk.autoRotate = app.dangChay && !tt.dangKeo;
      app.dk.autoRotateSpeed = 0.25;
    }
    // Gỡ nhãn đè nhau: nhãn ưu tiên cao giữ lại, nhãn thấp mà chạm thì tạm ẩn.
    let choNhan = 0;
    const hienThat = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const dsNhan = [
      // Thiên hà mẫu và mặt cầu Hubble là vật chính của bước nào bật chúng: ưu tiên 90, không bao giờ ẩn vì đè.
      { nhan: nhanThuoc, uuTien: 90, giu: true }, { nhan: nhanHubble, uuTien: 90, giu: true },
      { nhan: nhanNha, uuTien: 75 }, { nhan: nhanCot, uuTien: 70 }, { nhan: nhanCau, uuTien: 65 }, { nhan: nhanVai, uuTien: 60 },
      ...vachCot.map((v) => ({ nhan: v.n, uuTien: v.t === 13.8 ? 25 : 20 })),
    ];
    function goNhan() {
      for (const k of dsNhan) {
        const o = k.nhan;
        let bat = !o._an;
        if (o === nhanThuoc) bat = bat && hien.thuoc;
        else if (o === nhanHubble) bat = bat && hien.hubble && cauHubble.visible;
        else if (o === nhanVai) bat = bat && hien.luoi;
        o.visible = true;
        k.tat = !bat || !hienThat(o.parent);
      }
      goNhanDeNhau(dsNhan.slice(), camera, app.rong, app.cao);
    }

    // bấm vào một thiên hà (khi khung tương tác chưa nhận lần bấm): chuyển nhà sang đó
    const tia = new THREE.Vector3();
    function khiBam(ndc) {
      let tot = -1, gan = 16 * 16;
      for (let i = 0; i < SO_TH; i++) {
        const x = vt[i * 3], y = vt[i * 3 + 1], z = vt[i * 3 + 2];
        if (x * x + y * y + z * z > NUA * NUA * 0.8 || i === chiSoNha) continue;
        tia.set(x * a, y * a, z * a).project(camera);
        if (tia.z > 1) continue;
        const dx = (tia.x - ndc.x) * app.rong * 0.5, dy = (tia.y - ndc.y) * app.cao * 0.5, d = dx * dx + dy * dy;
        if (d < gan) { gan = d; tot = i; }
      }
      if (tot >= 0) { datNha(tot); soLanChuyen++; soBamCanh++; aVeCuoi = -1; }
    }

    // Ô số liệu: tối đa 5 dòng. Dòng đầu luôn là tuổi vũ trụ; các dòng sau theo thứ tự ưu tiên của bước
    // (hien.hud, do vao của bước đặt); dòng nào lúc này không có giá trị thì nhường chỗ cho dòng kế.
    function hud() {
      const H = (tocDoA(tv) / a) * 977.79;             // km/s/Mpc
      const giaToc = -(OR / a ** 3 + (0.5 * Om) / (a * a) - OL * a);
      const dong = [
        [chuCanh("canh.tuoi-vu-tru", "Tuổi vũ trụ"), chuCanh("canh.ti-nam-bc707d", "{0} tỉ năm{1}", [so(tv, tv < 1 ? 2 : 1), Math.abs(tv - ls.tuoi) < 0.06 ? chuCanh("canh.hom-nay-22f958", " (hôm nay)") : tv < ls.tuoi ? chuCanh("canh.ti-nam-truoc", " ({0} tỉ năm trước)", [so(ls.tuoi - tv, 1)]) : chuCanh("canh.ti-nam-sau", " ({0} tỉ năm sau)", [so(tv - ls.tuoi, 1)])])],
      ];
      for (const ten of hien.hud) {
        if (dong.length >= 5) break;
        if (ten === 'a') dong.push([chuCanh("canh.moi-khoang-cach-lon", "Mọi khoảng cách lớn"), chuCanh("canh.a-bang-hom-nay", "a = {0}, bằng {1}% hôm nay", [soNghia(a, 3), soNghia(a * 100, 3)])]);
        else if (ten === 'H') dong.push([chuCanh("canh.toc-do-gian-h", "Tốc độ giãn (H)"), H >= 0 ? chuCanh("canh.km-s-moi-megaparsec", "{0} km/s mỗi megaparsec", [soNghia(H, 3)]) : chuCanh("canh.dang-co-lai-km-s-moi-megaparsec", "đang co lại: {0} km/s mỗi megaparsec", [soNghia(-H, 3)])]);
        else if (ten === 'gianNo') dong.push([chuCanh("canh.su-gian-no", "Sự giãn nở"), H < 0 ? chuCanh("canh.da-dao-chieu-vu-tru-co-lai", "đã đảo chiều, vũ trụ co lại") : Math.abs(giaToc) < 0.01 ? chuCanh("canh.dung-luc-chuyen-tu-cham-dan-sang-nhanh", "đúng lúc chuyển từ chậm dần sang nhanh dần") : giaToc > 0 ? chuCanh("canh.dang-nhanh-dan-nang-luong-toi-thang", "đang nhanh dần (năng lượng tối thắng)") : chuCanh("canh.dang-cham-dan-vat-chat-ham-lai", "đang chậm dần (vật chất hãm lại)")]);
        else if (ten === 'cau') dong.push([chuCanh("canh.trong-qua-cau-co-dinh", "Trong quả cầu cố định"), chuCanh("canh.thien-ha-f7bb50", "{0} thiên hà", [so(daDemTrong, 0)])]);
        else if (ten === 'z' && a < 0.995) dong.push([chuCanh("canh.anh-sang-phat-luc-nay-hom-nay-nhan", "Ánh sáng phát lúc này"), chuCanh("canh.buoc-song-dai-gap-lan-z", "z = {1}, bước sóng gấp {0} lần", [soNghia(1 / a, 3), soNghia(1 / a - 1, 2)])]);
        else if (ten === 'nhietDo') dong.push([chuCanh("canh.nhiet-do-buc-xa-nen", "Nhiệt độ bức xạ nền"), `${soNghia(2.725 / a, 3)} K`]);
        else if (ten === 'mau' && hien.thuoc) dong.push([chuCanh("canh.thien-ha-mau-lui", "Thiên hà mẫu lùi"), chuCanh("canh.km-s-bang-c", "{0} km/s = {1} c", [so(H * dMauMpc, 0), so((H * dMauMpc) / C_KM_S, 2)])]);
        else if (ten === 'bip' && hien.bip && hien.thuoc) dong.push([chuCanh("canh.tieng-bip-quy-doi", "Tiếng bíp (quy đổi)"), chuCanh("canh.goc-hz-nhan-hz-chia-cho-1-z", "{0} Hz → {1} Hz, chia cho {2}", [so(BIP_GOC, 0), so(BIP_GOC / (1 + zMau), 0), so(1 + zMau, 2)])]);
        else if (ten === 'nha' && soLanChuyen > 0) dong.push([chuCanh("canh.ban-da-chuyen-nha", "Bạn đã chuyển nhà"), chuCanh("canh.lan-nhin-tu-dau-moi-thu-cung-lui", "{0} lần", [soLanChuyen])]);
      }
      return dong;
    }

    // Tham số riêng khi chụp kiểm thử (chỉ đọc ở chế độ im lặng): thu=<tên trạng thái>.
    function datTrangThaiThu() {
      if (!app.imLang) return;
      const thu = new URLSearchParams(location.search).get('thu');
      if (!thu) return;
      const datMau = (dGly) => {
        const j = chiSoMau * 3, L = Math.hypot(vt[j], vt[j + 1], vt[j + 2]), D = dGly / (MPC_MOI_DV * GLY_MOI_MPC) / a;
        for (let k = 0; k < 3; k++) { vt[j + k] *= D / L; goc.vt[j + k] = boc(vt[j + k] + nhaGoc[k]); }
        atVT.needsUpdate = true; aVeCuoi = -1;
      };
      if (thu === 'nua-c') datMau(0.5 * C_KM_S / H0 * GLY_MOI_MPC);
      else if (thu === 'z2') cauHinh({ a: 1 / 3 });
      else if (thu === 'dinh') { cauHinh({ moHinh: 'dong' }); cauHinh({ t: tDinhVuTruDong(H0, 2.5) }); }
      else if (thu === 'hubble-c') {
        // chia đôi theo thời gian: lúc thiên hà mẫu lùi đúng bằng c
        let lo = ls.tuoi, hi = tMax;
        const j = chiSoMau * 3, D = Math.hypot(vt[j], vt[j + 1], vt[j + 2]) * MPC_MOI_DV;
        for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (tocDoA(m) * 977.79 * D < C_KM_S) lo = m; else hi = m; }
        cauHinh({ t: lo });
      }
      else if (thu === 'do') cauHinh({ do_: true });
    }

    const kq = {
      scene, capNhat, hud, khiBam, cauHinh, trangThai,
      goc: (ten) => app.bayToi(GOC[ten][0], GOC[ten][1], 1.8),
      datDo: () => cauHinh({ do_: !hien.do_ }),
      datHubble: () => cauHinh({ hubble: !hien.hubble }),
      thuTrangThai: datTrangThaiThu,
    };
    return kq;
  },
};

// Vòng sáng đánh dấu thiên hà nhà.
function texVong() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.72, 'rgba(255,255,255,0)');
  gr.addColorStop(0.8, 'rgba(255,255,255,1)');
  gr.addColorStop(0.87, 'rgba(255,255,255,0.3)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Mặt cầu kính: viền sáng theo góc nhìn (Fresnel), lưới kinh tuyến và vĩ tuyến mảnh vẽ trong shader.
function taoCauKinh(mau, { doMo = 1, kt = 24, vt = 12 } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo } },
    vertexShader: /* glsl */ `
      varying vec3 vN, vV, vP;
      void main() { vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uDoMo; varying vec3 vN, vV, vP;
      float net(float o, float rong) { float d = max(fwidth(o), 1e-6); float g = abs(fract(o - 0.5) - 0.5) / d; return 1.0 - smoothstep(rong * 0.5 - 0.5, rong * 0.5 + 0.8, g); }
      void main() {
        vec3 p = normalize(vP);
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
        float vi = asin(clamp(p.y, -1.0, 1.0)) / 3.14159 * ${vt.toFixed(1)};
        float ki = atan(p.z, p.x) / 6.28318 * ${kt.toFixed(1)};
        float l = max(net(vi, 1.1), net(ki, 1.1) * (1.0 - smoothstep(0.9, 0.98, abs(p.y))));
        vec3 c = uMau * (0.012 + 0.75 * f + l * (0.1 + 0.45 * f)) * uDoMo;
        gl_FragColor = vec4(c, 1.0);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  m.tuyenTinh = true;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 36), m);
  mesh.renderOrder = 2;
  return mesh;
}
