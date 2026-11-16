import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài — Lỗ đen.
// Mỗi điểm ảnh là một tia sáng được lần ngược từ mắt người xem qua không-thời gian Schwarzschild
// (cùng thuật toán với buocTiaShader trong vat-ly/schwarzschild.js và doTia trong vat-ly/do-tia-lo-den.js, đã kiểm bằng số).
// Đơn vị: bán kính Schwarzschild rs = 1, c = 1. Người xem đứng yên (lơ lửng nhờ động cơ).
//
// Bản 3:
//   - Shader xuất màu tuyến tính, dải sáng rộng (vùng sáng nhất của đĩa sáng hơn 1 để bộ dựng hình thêm quầng).
//   - Bầu trời là bầu trời THẬT (src/khung/bau-troi.js) vẽ một lần vào ảnh lập phương; mỗi tia thoát ra đọc màu
//     theo hướng cuối cùng của nó, nên chính các ngôi sao và dải Ngân Hà thật bị bẻ cong.
//   - Máy phát tín hiệu thả rơi (vat-ly/may-phat-roi.js): vẽ bằng chính các tia (thấy cả ảnh bị bẻ của nó),
//     màu dịch theo g, tiếng «bíp» và nốt kéo dài có tần số g × 880 Hz.
//   - Rê chuột: dò lại đúng tia của điểm ảnh dưới con trỏ (vat-ly/do-tia-lo-den.js) và kể nó đi đâu.

import * as THREE from 'three';
import { so, soNghia, C, RS_MAT_TROI_M, AU_M } from '../vat-ly/hang-so.js';
import { gocBong, nhipDongHo } from '../vat-ly/schwarzschild.js';
import { doTia } from '../vat-ly/do-tia-lo-den.js';
import { lichTinHieu, tauToiChanTroi, TAN_SO_PHAT, DTAU_PHAT, RS_MOI_GIAY } from '../vat-ly/may-phat-roi.js';
import { taoNenSao } from '../khung/ve.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('lo-den', khoa, goc, thamSo);

const R = String.raw;

const R_TRONG = 3.0;   // mép trong của đĩa = quỹ đạo tròn ổn định trong cùng (ISCO)
const R_NGOAI = 12.0;
const BUOC_SONG_MAY = 440;   // nm: máy phát chớp ánh sáng xanh lam
const TAU_DICH = 15;         // thử thách bước 2: rơi tới chân trời sau 15 rs/c theo đồng hồ của máy

const MANH = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec3 uCam, uPhai, uLen, uTruoc;
uniform float uTanNua, uTiSo, uT, uDia, uDoppler, uLuoi, uVong, uBong, uChanTroi, uDiemAnh, uSangTroi, uSangDia, uMin, uMuThem;
uniform vec2 uLech;
uniform samplerCube uTroi;
uniform vec4 uMay;      // xyz: chỗ máy phát (đang được thấy); w > 0.5: có máy phát
uniform vec3 uMauMay;   // màu tuyến tính của máy phát, đã nhân độ sáng
const float PI = 3.14159265359;
const float RIN = ${R_TRONG.toFixed(1)}, ROUT = ${R_NGOAI.toFixed(1)};
const int SO_BUOC = 300;
float can;   // √(1 − rs/r) tại chỗ người xem

float bam(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// nhiễu mịn, lặp lại theo trục x với chu kỳ ck (để không lộ đường nối quanh đĩa)
float nhieu(vec2 p, float ck) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, ck), x1 = mod(i.x + 1.0, ck);
  return mix(mix(bam(vec2(x0, i.y)), bam(vec2(x1, i.y)), f.x), mix(bam(vec2(x0, i.y + 1.0)), bam(vec2(x1, i.y + 1.0)), f.x), f.y);
}
// bốn tầng nhiễu, vẫn lặp theo x
float fbm(vec2 p, float ck) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * nhieu(p, ck); p = vec2(p.x * 2.0, p.y * 2.07 + 3.7); ck *= 2.0; a *= 0.5; }
  return s / 0.9375;
}
// màu gần đúng của vật đen ở nhiệt độ T (Kelvin), theo thang màn hình; đổi sang tuyến tính khi dùng
vec3 mauVatDen(float T) {
  float t = clamp(T, 1000.0, 40000.0) / 100.0;
  float r = t <= 66.0 ? 1.0 : clamp(1.292936 * pow(t - 60.0, -0.1332047), 0.0, 1.0);
  float g = t <= 66.0 ? clamp(0.390082 * log(t) - 0.631841, 0.0, 1.0) : clamp(1.129891 * pow(t - 60.0, -0.0755148), 0.0, 1.0);
  float b = t >= 66.0 ? 1.0 : (t <= 19.0 ? 0.0 : clamp(0.543207 * log(t - 10.0) - 1.196254, 0.0, 1.0));
  return pow(vec3(r, g, b), vec3(2.2));
}

// lưới kinh – vĩ tuyến vẽ trên bầu trời ở rất xa, để thấy hình bị bẻ cong ra sao
float luoiTroi(vec3 d) {
  float kinh = atan(d.z, d.x), vi = asin(clamp(d.y, -1.0, 1.0));
  float o1 = abs(fract(kinh / (PI / 12.0) + 0.5) - 0.5) * (PI / 12.0) * cos(vi);
  float o2 = abs(fract(vi / (PI / 12.0) + 0.5) - 0.5) * (PI / 12.0);
  float w = 0.0024;
  float kt = smoothstep(w, w * 0.3, o1) * (1.0 - smoothstep(0.82, 0.97, abs(d.y)));   // kinh tuyến mờ dần về hai cực
  return max(kt, smoothstep(w, w * 0.3, o2));
}

// Đĩa bồi tụ mỏng: khí quay tròn theo quỹ đạo Kepler quanh trục y.
vec4 mauDia(vec3 c, float rho, float ell) {
  float om = sqrt(0.5 / (rho * rho * rho));                       // tốc độ góc (theo đồng hồ ở xa)
  // tỉ số tần số nhận / phát: gộp dịch chuyển Doppler và dịch đỏ hấp dẫn
  float g = sqrt(1.0 - 1.5 / rho) / max(0.05, 1.0 - om * ell) / can;
  if (uDoppler < 0.5) g = 1.0;
  float f = pow(rho / RIN, -0.75) * pow(max(0.0, 1.0 - sqrt(RIN / rho)), 0.25) / 0.4879;   // nhiệt độ theo bán kính
  float phi = atan(c.z, c.x);
  float lr = log(rho);
  // vân khí: trôi theo vòng quay; trộn hai pha lệch nhau nửa chu kỳ để vân không bị cuộn chặt mãi
  float P = 60.0;
  float p0 = fract(uT / P), p1 = fract(uT / P + 0.5);
  float u0 = (phi + om * (p0 - 0.5) * P) * 12.0 / PI + lr * 5.0, u1 = (phi + om * (p1 - 0.5) * P) * 12.0 / PI + lr * 5.0;
  float n0 = fbm(vec2(u0 + 24.0, lr * 10.0), 24.0);
  float n1 = fbm(vec2(u1 + 24.0, lr * 10.0 + 41.0), 24.0);
  float van = mix(n0, n1, abs(2.0 * p0 - 1.0));
  // những dải sáng tối mảnh chạy vòng quanh (khí xoáy thành sợi), lệch pha theo vân
  float soi = 0.8 + 0.2 * sin(lr * 46.0 + van * 7.0);
  float day = smoothstep(0.18, 0.75, van);
  float I = pow(g, 4.0 + uMuThem) * pow(f, 3.0) * mix((0.1 + 1.6 * day * day) * soi, 0.75, uMin) * 0.85 * uSangDia;
  vec3 mau = mauVatDen(4300.0 * f * g) * I;
  float a = smoothstep(RIN, RIN + 0.18, rho) * (1.0 - smoothstep(ROUT - 4.0, ROUT, rho));
  return vec4(mau * a, a * (0.5 + 0.5 * smoothstep(0.1, 0.55, van)));
}

void main() {
  vec2 uv = vUv + uLech;
  vec3 dLoc = normalize(uTruoc + uv.x * uTiSo * uTanNua * uPhai + uv.y * uTanNua * uLen);
  vec3 p = uCam;
  float r0 = length(p);
  vec3 er = p / r0;
  can = sqrt(max(1e-4, 1.0 - 1.0 / r0));
  // hướng nhìn của người đứng yên → hướng trong tọa độ Schwarzschild (co thành phần xuyên tâm)
  float dr = dot(dLoc, er);
  vec3 v = normalize(dr * can * er + (dLoc - dr * er));
  // mô-men động lượng quanh trục đĩa trên một đơn vị năng lượng của photon đi tới mắt
  float ell = dot(cross(p, -dLoc), vec3(0.0, 1.0, 0.0)) / can;
  vec3 hv = cross(p, v);
  float h2 = dot(hv, hv);
  float xa = max(40.0, r0 * 1.02);

  vec3 mau = vec3(0.0);
  float trong = 1.0;
  float thoat = 1.0;   // 0 khi tia rơi qua chân trời (dùng số thực thay cho biến đúng/sai: vài trình dịch shader xử lý sai biến đúng/sai gán trong vòng lặp có break)
  for (int i = 0; i < SO_BUOC; i++) {
    float r2 = dot(p, p), r = sqrt(r2);
    if (r < 1.0) { thoat = 0.0; break; }                 // qua chân trời sự kiện: không còn ánh sáng nào
    if (r > xa && dot(p, v) > 0.0) break;               // đã thoát ra xa
    // bước nhỏ ở gần lỗ đen, lớn dần ở nơi tia gần như thẳng (mỗi bước chỉ bị bẻ một góc nhỏ)
    float dl = max(0.02, min(0.1 * r, max(0.06 * r, 0.003 * r2 * r2 / max(1e-9, h2))));
    vec3 vn = v - 0.75 * dl * h2 * p / (r2 * r2 * r);   // nửa bước vận tốc: a = −(3/2)·h²·x/r⁵
    vec3 pn = p + dl * vn;
    float n2 = dot(pn, pn);
    vn -= 0.75 * dl * h2 * pn / (n2 * n2 * sqrt(n2));
    if (uMay.w > 0.5) {                                  // tia đi sát máy phát: cộng ánh sáng của nó
      vec3 ab = pn - p, am = uMay.xyz - p;
      float L2 = dot(ab, ab), L = sqrt(L2);
      float t = clamp(dot(am, ab) / max(L2, 1e-9), 0.0, 1.0);
      vec3 q = am - ab * t;
      float d2 = dot(q, q);
      mau += trong * uMauMay * (exp(-d2 / 0.0144) * min(L, 0.213) / 0.213 + 0.05 * exp(-d2 / 0.36) * min(L, 1.06) / 1.06);
    }
    if (uDia > 0.5 && p.y * pn.y < 0.0) {               // tia cắt mặt phẳng đĩa
      vec3 c = mix(p, pn, p.y / (p.y - pn.y));
      float rho = length(c.xz);
      if (rho > RIN && rho < ROUT) {
        vec4 d = mauDia(c, rho, ell);
        mau += trong * d.rgb;
        trong *= 1.0 - d.a;
        if (trong < 0.01) break;
      }
    }
    p = pn; v = vn;
  }
  // Bầu trời thật đọc theo hướng cuối cùng của tia. Đạo hàm tính ngoài mọi nhánh rẽ, rồi kẹp lại để chỗ ảnh bị nén mạnh
  // (sát mép bóng) chỉ nhòe vừa phải.
  vec3 dCuoi = normalize(v);
  vec3 gx = dFdx(dCuoi), gy = dFdy(dCuoi);
  gx *= min(1.0, 0.03 / max(length(gx), 1e-6));
  gy *= min(1.0, 0.03 / max(length(gy), 1e-6));
  vec3 troi = textureGrad(uTroi, dCuoi, gx, gy).rgb * uSangTroi;
  if (uLuoi > 0.5) troi = mix(troi, vec3(0.06, 0.36, 1.0) * 0.75, luoiTroi(dCuoi) * 0.6);
  mau += thoat * trong * troi * min(6.0, 1.0 / (can * can));   // càng gần chân trời, trời càng chói xanh
  // hai vòng đo: mép bóng (xanh lục) và cỡ chân trời nếu ánh sáng đi thẳng (đỏ, đứt nét)
  if (uVong > 0.5) {
    float gg = acos(clamp(dot(dLoc, -er), -1.0, 1.0));
    float w = uDiemAnh * 1.5;
    float a1 = 1.0 - smoothstep(0.0, w, abs(gg - uBong));
    float quanh = atan(dot(dLoc, uLen), dot(dLoc, uPhai));
    float a2 = (1.0 - smoothstep(0.0, w, abs(gg - uChanTroi))) * smoothstep(0.3, 0.42, abs(fract(quanh * 18.0 / PI) - 0.5));
    vec3 xanh = vec3(0.27, 0.77, 0.40), cam = vec3(1.0, 0.26, 0.17);
    mau += xanh * 0.35 * exp(-pow((gg - uBong) / (w * 5.0), 2.0));
    mau = mix(mau, xanh * 2.4, a1 * 0.95);
    mau = mix(mau, cam * 2.4, a2 * 0.95);
  }
  gl_FragColor = vec4(mau, 1.0);
}`;

// Màu (tuyến tính, đỉnh bằng 1) của ánh sáng có bước sóng lam (nm), gần đúng theo độ nhạy của mắt.
// Quá 680 nm (đỏ thẫm rồi hồng ngoại, mắt không còn thấy) thì hình giữ màu đỏ thẫm: quy ước để vẫn theo dõi được máy phát.
function mauBuocSong(lam, ra) {
  lam = Math.min(lam, 680);
  let r = 0, g = 0, b = 0;
  if (lam >= 380 && lam < 440) { r = -(lam - 440) / 60; b = 1; }
  else if (lam >= 440 && lam < 490) { g = (lam - 440) / 50; b = 1; }
  else if (lam >= 490 && lam < 510) { g = 1; b = -(lam - 510) / 20; }
  else if (lam >= 510 && lam < 580) { r = (lam - 510) / 70; g = 1; }
  else if (lam >= 580 && lam < 645) { r = 1; g = -(lam - 645) / 65; }
  else if (lam >= 645 && lam <= 780) r = 1;
  let k = 0;
  if (lam >= 380 && lam < 420) k = 0.3 + (0.7 * (lam - 380)) / 40;
  else if (lam >= 420 && lam <= 700) k = 1;
  else if (lam > 700 && lam <= 780) k = 0.3 + (0.7 * (780 - lam)) / 80;
  ra.setRGB((r * k) ** 2.2, (g * k) ** 2.2, (b * k) ** 2.2);
  return ra;
}

const LO_DEN = [
  { id: 'sgr', ten: chuCanh("canh.sagittarius-a", "Sagittarius A*"), m: 4.3e6, moTa: chuCanh("canh.tam-ngan-ha", "tâm Ngân Hà") },
  { id: 'm87', ten: chuCanh("canh.m87", "M87*"), m: 6.5e9, moTa: chuCanh("canh.anh-chup-lo-den-dau-tien-2019", "ảnh chụp lỗ đen đầu tiên, 2019") },
  { id: 'sao', ten: chuCanh("canh.10-khoi-luong-mat-troi", "10 khối lượng Mặt Trời"), m: 10, moTa: chuCanh("canh.lo-den-sinh-ra-tu-sao-chet", "lỗ đen sinh ra từ sao chết") },
];

function doDai(m) {
  if (m >= 0.1 * 9.4607e15) return chuCanh("canh.nam-anh-sang", "{0} năm ánh sáng", [soNghia(m / 9.4607e15, 3)]);
  if (m >= 0.5 * AU_M) return `${soNghia(m / AU_M, 3)} AU`;
  if (m >= 1e9) return chuCanh("canh.trieu-km", "{0} triệu km", [soNghia(m / 1e9, 3)]);
  if (m >= 1e3) return `${soNghia(m / 1e3, 3)} km`;
  return `${soNghia(m, 3)} m`;
}
function thoiLuong(s) {
  if (s < 1e-3) return chuCanh("canh.micro-giay", "{0} micro giây", [soNghia(s * 1e6, 2)]);
  if (s < 1) return chuCanh("canh.mili-giay", "{0} mili giây", [soNghia(s * 1e3, 2)]);
  if (s < 120) return chuCanh("canh.giay", "{0} giây", [soNghia(s, 2)]);
  if (s < 7200) return chuCanh("canh.phut", "{0} phút", [soNghia(s / 60, 2)]);
  if (s < 172800) return chuCanh("canh.gio", "{0} giờ", [soNghia(s / 3600, 2)]);
  return chuCanh("canh.ngay", "{0} ngày", [soNghia(s / 86400, 2)]);
}

export default {
  id: 'lo-den',
  ten: 'Lỗ đen: nơi ánh sáng không thoát ra',
  moTa: 'Bay quanh một lỗ đen dựng bằng đường đi thật của ánh sáng; so với ảnh của EHT',
  yChinh: 'Nén một khối lượng vào trong **bán kính Schwarzschild** $r_s = 2GM/c^2$ của nó thì ánh sáng cũng không ra được. Hình bạn đang xem không phải tranh vẽ: mỗi điểm ảnh là một tia sáng được lần ngược theo đúng phương trình của Einstein. Cái bóng rộng 5,2 rs, đĩa khí hiện cả mặt sau, một bên sáng hơn, và kính Event Horizon Telescope đã chụp được đúng những điều đó.',
  giaiThich: R`
    - Bán kính Schwarzschild $r_s = 2GM/c^2$: Mặt Trời 2,95 km, Trái Đất 8,9 mm, Sgr A* 12,7 triệu km, M87* 128 AU.
    - Cái bóng là tập hợp các hướng mà nhìn ngược theo tia sáng chỉ gặp chân trời. Đường kính $3\sqrt3\,r_s \approx 5{,}2\,r_s$, lớn hơn hẳn chân trời.
    - Ánh sáng quấn quanh mặt cầu photon tạo ra các ảnh bậc cao, chồng thành vành photon sát mép bóng.
    - Đĩa khí phẳng nhưng hiện cả mặt sau vì ánh sáng bị bẻ qua đỉnh và đáy lỗ đen. Một bên sáng hơn do hiệu ứng Doppler; mép trong tối đi do dịch chuyển đỏ.
    - EHT: vành M87* rộng 42 ± 3 micro giây cung (2019), Sgr A* khoảng 52 micro giây cung (2022), khớp với cỡ bóng tính từ khối lượng.
    - Mô hình là lỗ đen không quay. Lỗ đen thật có quay (Kerr): bóng hơi lệch, mép trong của đĩa dời vào hoặc ra.`,
  mayAnh: { viTri: [0, 2.4, 15.5], dich: [0, 0, 0], fov: 50, min: 1.06, max: 90, doi: false, hep: 0.7 },
  tiLeDiemAnh: 1,
  hinh: { tuQuanDoNet: true, quang: 0.42, banKinh: 0.4, nguong: 1.25 },   // bài này tự chỉnh độ nét theo tốc độ máy (xem MUC bên dưới)

  baiGiang: {
    mucTieu: [
      'Tính được bán kính Schwarzschild của một vật bất kỳ từ khối lượng của nó.',
      'Giải thích được vì sao cái bóng của lỗ đen rộng 5,2 rs chứ không phải 2 rs.',
      'Đọc được ảnh lỗ đen: mặt sau của đĩa, vành photon, phía sáng hơn, mép trong tối.',
      'So được cỡ bóng tính từ khối lượng và khoảng cách với ảnh thật của EHT.',
      'Mô tả được cách máy tính dựng hình bằng cách lần ngược tia sáng, và lỗ đen quay khác gì.',
    ],
    buoc: [
      {
        ten: 'Bán kính Schwarzschild',
        noiDung: R`
          Bạn đang lơ lửng ở xa một lỗ đen có đĩa khí nóng quay quanh. Cỡ của nó được định bởi một con số duy nhất, {{bán kính Schwarzschild}}:

          $$ r_s = \frac{2GM}{c^2} $$

          $M$ là khối lượng, $G$ là hằng số hấp dẫn, $c$ là tốc độ ánh sáng. Nén khối lượng $M$ vào trong bán kính đó thì không gì thoát ra được, kể cả ánh sáng.

          | Vật | Khối lượng | Bán kính Schwarzschild |
          |---|---|---|
          | Trái Đất | 0,000003 | 8,9 mm |
          | Mặt Trời | 1 | 2,95 km |
          | Lỗ đen sinh ra từ sao | 10 | 29,5 km |
          | Sagittarius A* | 4,3 triệu | 12,7 triệu km (gấp 18 lần bán kính Mặt Trời) |
          | M87* | 6,5 tỉ | 128 AU (gấp hơn 4 lần quỹ đạo Sao Hải Vương) |

          (Khối lượng tính theo Mặt Trời.) Hình trong mô hình **giống hệt nhau** cho mọi khối lượng nếu đo bằng $r_s$; chỉ cỡ thật và các con số trong ô số liệu thay đổi.

          > [Thử ngay] Chọn lỗ đen để tính số liệu: [[Sgr A*|sgr]] [[M87*|m87]] [[10 lần Mặt Trời|sao]]

          > [Lịch sử] Năm 1783 John Michell, rồi Laplace, đã nghĩ tới «ngôi sao tối» mà ánh sáng không thoát nổi, theo kiểu Newton. Đầu năm 1916, vài tuần sau khi Einstein công bố phương trình, Karl Schwarzschild tìm ra nghiệm chính xác cho một khối cầu. Cái tên «lỗ đen» được John Wheeler làm cho phổ biến năm 1967.

          +++ Đi sâu: trùng hợp với tốc độ thoát của Newton
          Theo Newton, tốc độ thoát khỏi bề mặt bán kính $r$ là $v = \sqrt{2GM/r}$. Cho $v = c$ được đúng $r = 2GM/c^2$.

          Với Mặt Trời: $GM = 1{,}327\times10^{20}\ \text{m}^3/\text{s}^2$, nên $r_s = 2\times1{,}327\times10^{20}/(2{,}998\times10^8)^2 \approx 2\,953$ m.

          Nhưng ý nghĩa khác hẳn. Ở «ngôi sao tối» của Newton, ánh sáng vẫn bay lên được một đoạn rồi rơi lại. Ở chân trời của Einstein, ánh sáng hướng ra ngoài **đứng yên tại chỗ**, và bên trong mọi hướng tương lai đều dẫn vào tâm (Bài 16). Hai công thức trùng nhau chỉ là một trùng hợp của phép tính (và của cách chọn tọa độ $r$), không phải vì hai bức tranh giống nhau.
          +++`,
        vao: (c) => c.cauHinh({ goc: 'xa', dia: true, doppler: true, luoi: false, vong: false, ra: false, loDen: 'sgr' }),
        nut: { sgr: (c) => c.cauHinh({ loDen: 'sgr' }), m87: (c) => c.cauHinh({ loDen: 'm87' }), sao: (c) => c.cauHinh({ loDen: 'sao' }) },
      },
      {
        ten: 'Chân trời sự kiện: màng một chiều',
        noiDung: R`
          Tắt đĩa khí đi, chỉ còn lỗ đen trước nền sao. {{Chân trời sự kiện}} ở $r = r_s$ không phải một bề mặt vật chất. Nó là ranh giới: đi vào được, không đi ra được, như một cái màng chỉ cho qua một chiều.

          Ô số liệu cho biết nếu bạn **đứng yên** ở chỗ này nhờ động cơ tên lửa thì:

          - đồng hồ của bạn chạy chậm theo tỉ lệ $\sqrt{1 - r_s/r}$ (Bài 9). Ở 1,1 rs chỉ còn 30,2%;
          - lực kéo giãn cơ thể (lực thủy triều, Bài 12) là bao nhiêu.

          > [Con số] Ngay ở chân trời, một người cao 2 m chịu lực kéo giãn khoảng **21 triệu lần** trọng lực Trái Đất với lỗ đen 10 lần Mặt Trời, nhưng chỉ khoảng **1 phần 10 000** trọng lực với Sgr A*. Lỗ đen càng lớn thì chân trời càng «hiền».

          > [Thử ngay] Kéo đốm xanh (một máy phát tín hiệu đang đứng yên) tới chỗ bạn muốn quanh lỗ đen rồi thả: nó rơi tự do vào trong. Bạn thấy nó chậm dần, đỏ dần, mờ dần rồi tắt hẳn ngay trước chân trời, dù theo đồng hồ của chính nó, nó đi qua chân trời sau một thời gian hữu hạn (ô số liệu ghi cả hai).
          > [[Thả máy phát|tha]] [[Bay tới mặt cầu photon|photon]] [[Bay sát chân trời|sat]] [[Về chỗ cũ|canh]]

          > [Lưu ý] Âm thanh và màu của máy phát là quy đổi cho tai và mắt. Máy phát kêu «bíp» 880 Hz sau mỗi 1 rs/c theo đồng hồ của nó và chớp ánh sáng xanh 440 nm. Bạn nghe mỗi tiếng ở $g \times 880$ Hz và thấy ánh sáng ở $440/g$ nm, với $g$ là tỉ số tần số nhận và phát (dịch đỏ hấp dẫn gộp hiệu ứng Doppler, tính theo đúng tia sáng đi từ máy phát tới bạn). Các tiếng tới cách nhau đúng bằng khoảng nhận theo đồng hồ của bạn, nên thưa dần cùng nhịp với trầm dần. Thời gian bị nén: 1 giây nghe ứng với 5 rs/c của bạn (với Sgr A* là khoảng 3,5 phút).

          > [Lưu ý] Ở sát chân trời, người lơ lửng cần động cơ cực mạnh. Bầu trời co lại thành một vùng sáng nhỏ phía trên, và ánh sáng sao bị dồn thành xanh và chói hơn. Chuyện gì xảy ra với nón ánh sáng ở chân trời và bên trong nó là nội dung của Bài 16.`,
        vao: (c) => c.cauHinh({ goc: 'canh', dia: false, doppler: true, luoi: false, vong: false, ra: false, loDen: 'sgr', may: true }),
        ra: (c) => c.cauHinh({ may: false }),
        nut: { tha: (c) => c.thaMay(), photon: (c) => c.cauHinh({ goc: 'photon' }), sat: (c) => c.cauHinh({ goc: 'sat' }), canh: (c) => c.cauHinh({ goc: 'canh' }) },
        thuThach: {
          de: 'Kéo máy phát tới chỗ mà nếu thả ra, theo đồng hồ của chính nó, nó tới chân trời sau đúng **15 rs/c** (lệch dưới 0,75), rồi thả cho nó rơi.',
          goiY: 'Rê chuột lên đốm xanh: ô chú giải ghi thời gian rơi tới chân trời nếu thả từ chỗ ấy. Thả càng xa thì rơi càng lâu; chỗ cần tìm cách tâm khoảng 4,6 rs.',
          kiem: (c) => c.thuThach.may(),
          giu: 0.4,
        },
      },
      {
        ten: 'Cái bóng rộng 5,2 rs',
        noiDung: R`
          Vùng đen ở giữa là **cái bóng** của lỗ đen. Hai vòng vừa bật lên cho thấy nó lớn hơn chân trời thế nào:

          - **vòng xanh lục**: mép bóng mà mô hình tính được;
          - **vòng đỏ đứt nét**: cỡ của chân trời nếu ánh sáng đi thẳng.

          Từ chỗ đang đứng (15,7 rs), bóng rộng 18,4° trên bầu trời, còn chân trời «đi thẳng» chỉ rộng 7,3°.

          Bóng không phải ảnh của chân trời. Nó là tập hợp những hướng mà nếu **lần ngược** theo tia sáng tới mắt, ta chỉ gặp chân trời. Ở Bài 14 ta đã thấy: tia có khoảng ngắm dưới $b_c = (3\sqrt3/2)\,r_s$ đều bị nuốt. Với người ở rất xa, mép bóng có bán kính đúng bằng $b_c$, nên

          $$ \text{đường kính bóng} = 2b_c = 3\sqrt3\,r_s \approx 5{,}2\,r_s $$

          > [Thử ngay] [[Bay ra xa|xa]] [[Về 15,7 rs|canh]] [[Tới mặt cầu photon|photon]]
          > Ở mặt cầu photon, bóng chiếm đúng **nửa bầu trời** (180°). Cuộn chuột để tự bay lại gần hay ra xa, kéo chuột để đổi góc nhìn; ô số liệu ghi bóng đang chiếm bao nhiêu độ.

          +++ Đi sâu: cỡ bóng với người đứng ở khoảng cách $r$
          Người đứng yên ở bán kính $r$ thấy mép bóng ở góc $\theta$ so với hướng tới tâm, với

          $$ \sin\theta = \frac{b_c}{r}\sqrt{1 - \frac{r_s}{r}} $$

          Thừa số $\sqrt{1-r_s/r}$ đến từ việc đổi hướng tia trong tọa độ Schwarzschild sang hướng mà người đứng yên đo bằng thước và đồng hồ của mình. Ở $r = 15{,}7\,r_s$: $\sin\theta = 2{,}598/15{,}7\times\sqrt{0{,}936} = 0{,}160$, $\theta = 9{,}2°$, bóng rộng 18,4°. Ở $r = 1{,}5\,r_s$: $\sin\theta = 1{,}732\times0{,}577 = 1$, $\theta = 90°$. Ở rất xa: $\theta \approx b_c/r$.
          +++`,
        vao: (c) => c.cauHinh({ goc: 'canh', dia: false, doppler: true, luoi: false, vong: true, ra: false }),
        nut: { xa: (c) => c.cauHinh({ goc: 'xa' }), canh: (c) => c.cauHinh({ goc: 'canh' }), photon: (c) => c.cauHinh({ goc: 'photon' }) },
        thuThach: {
          de: 'Cuộn chuột để bay lại gần cho tới khi bóng đen chiếm đúng **90°** bầu trời, tức một phần tư vòng quanh bạn (lệch dưới 3°).',
          goiY: 'Xem dòng «Bóng đen chiếm» trong ô số liệu. Chỗ cần tìm có một con số rất đẹp: đúng bằng bán kính mép trong của đĩa khí.',
          kiem: (c) => c.thuThach.bong90(),
          giu: 0.6,
        },
      },
      {
        ten: 'Thấu kính quanh lỗ đen: ảnh nhiều lớp',
        noiDung: R`
          Lưới xanh là lưới kinh tuyến, vĩ tuyến **vẽ trên bầu trời ở rất xa**, như các đường trên quả địa cầu. Không có lỗ đen thì nó là những đường đều đặn. Ở đây nó bị kéo méo: thấu kính hấp dẫn của Bài 14, giờ ở mức cực mạnh.

          - Vùng trời ngay sau lỗ đen hiện thành một **vòng Einstein** ôm quanh bóng.
          - Mỗi ngôi sao phía sau có ít nhất **hai ảnh**: một ảnh qua phía này, một ảnh vòng qua phía bên kia lỗ đen.
          - Thật ra có **vô số ảnh**. Tia có thể quấn thêm nửa vòng, một vòng, rưỡi vòng... quanh mặt cầu photon rồi mới tới mắt. Mỗi lần quấn thêm nửa vòng, ảnh hẹp đi khoảng $e^\pi \approx 23$ lần. Các ảnh ấy dồn sát mép bóng thành một vành mảnh: {{vành photon}}.

          > [Thử ngay] [[Bật lưới bầu trời|luoi]] [[Tắt lưới|tat]] [[Quay lưng lại, nhìn ra vũ trụ|ra]] [[Nhìn về lỗ đen|vao]]
          > Rê chuột lên bầu trời: ô chú giải cho biết ánh sáng tới đúng điểm ảnh ấy đã bị bẻ bao nhiêu độ và ngôi sao thật nằm lệch bao xa. Sao và dải Ngân Hà trên nền là bầu trời thật.

          +++ Đi sâu: vì sao mỗi lớp hẹp đi $e^\pi$ lần
          Gần khoảng ngắm tới hạn, góc lệch tăng theo logarit:

          $$ \alpha(b) \approx -\ln\Big(\frac{b - b_c}{b_c}\Big) + \text{hằng số} $$

          Muốn tia quấn thêm $\pi$ (nửa vòng), $\ln(b - b_c)$ phải giảm $\pi$, tức khoảng $b - b_c$ thu hẹp $e^\pi \approx 23{,}1$ lần. Tính số bằng chính phương trình mà mô hình dùng cũng ra đúng tỉ lệ này. Hệ số đứng trước logarit bằng 1 là riêng cho lỗ đen không quay.
          +++`,
        vao: (c) => c.cauHinh({ goc: 'canh', dia: false, doppler: true, luoi: true, vong: false, ra: false }),
        nut: { luoi: (c) => c.cauHinh({ luoi: true }), tat: (c) => c.cauHinh({ luoi: false }), ra: (c) => c.cauHinh({ ra: true }), vao: (c) => c.cauHinh({ ra: false }) },
        thuThach: {
          de: 'Rê chuột sát mép bóng, tìm một điểm trên bầu trời mà ánh sáng tới đó đã bị bẻ **hơn 180°**: ánh sáng của một ngôi sao gần như sau lưng bạn, vòng qua phía bên kia lỗ đen rồi quay lại.',
          goiY: 'Những tia bị bẻ mạnh nhất nằm trong một vành rất mảnh ngay ngoài mép bóng. Nhích chuột từng chút từ mép bóng ra ngoài và đọc góc trong ô chú giải.',
          kiem: (c) => c.thuThach.be180(),
          giu: 0.3,
        },
      },
      {
        ten: 'Đĩa bồi tụ: thấy được cả mặt sau',
        noiDung: R`
          Bật đĩa khí lại, tạm tắt hiệu ứng Doppler để thấy rõ hình dạng. {{Đĩa bồi tụ}} trong mô hình **phẳng như vành Sao Thổ**, từ 3 rs (quỹ đạo tròn bền trong cùng, Bài 13) ra tới 12 rs. Vậy mà ảnh trông như một chiếc mũ:

          - **Vòng cung vồng lên trên bóng** là phần đĩa nằm **sau** lỗ đen. Ánh sáng từ mặt trên của nó bị bẻ vòng qua đỉnh lỗ đen rồi mới tới mắt.
          - **Dải mảnh dưới bóng** là mặt dưới của chính phần đĩa phía sau ấy, ánh sáng vòng qua đáy.
          - **Vòng sáng mảnh sát mép bóng** là ảnh bậc cao: ánh sáng đã quấn hơn nửa vòng quanh lỗ đen.

          Không có gì che được cái ở sau lưng lỗ đen; nó chỉ hiện ra ở chỗ khác.

          > [Thử ngay] [[Nhìn ngang mặt đĩa|ngang]] [[Nhìn từ trên xuống|tren]] [[Góc quen thuộc|canh]]
          > Nhìn ngang mặt đĩa: phần đĩa phía sau hiện thành một vòng tròn trọn vẹn quanh bóng. Nhìn từ trên: đĩa gần như không méo, chỉ còn vòng ảnh bậc cao. Rê chuột lên vòng cung trên bóng: ô chú giải cho biết chỗ khí ấy nằm sau lỗ đen và tia đã quét bao nhiêu độ quanh tâm.

          > [Lưu ý] Đĩa trong mô hình mỏng tuyệt đối và có mép ngoài ở 12 rs cho dễ nhìn. Màu theo nhiệt độ chỉ là minh họa; khí thật nóng hơn nhiều và phát mạnh cả tia X, sóng vô tuyến.`,
        vao: (c) => c.cauHinh({ goc: 'canh', dia: true, doppler: false, luoi: false, vong: false, ra: false }),
        nut: { ngang: (c) => c.cauHinh({ goc: 'ngang' }), tren: (c) => c.cauHinh({ goc: 'tren' }), canh: (c) => c.cauHinh({ goc: 'canh' }) },
      },
      {
        ten: 'Một bên sáng hơn: Doppler và dịch đỏ',
        noiDung: R`
          Bật lại hiệu ứng Doppler. Một bên đĩa sáng bừng, bên kia mờ hẳn. Ở mép trong, khí quay với tốc độ bằng **nửa tốc độ ánh sáng**. Bên khí lao về phía ta, ánh sáng bị dồn lại: sáng hơn, xanh hơn. Bên khí chạy ra xa thì ngược lại.

          Gọi $g$ là tỉ số giữa tần số ta nhận và tần số khí phát. Ở mép trong (3 rs), với ánh sáng phát dọc theo chiều quay:

          | Phía | Tỉ số tần số | Độ sáng (tỉ lệ) |
          |---|---|---|
          | khí lao tới | 1,41 | 4 |
          | phát vuông góc | 0,71 | 0,25 |
          | khí chạy ra xa | 0,47 | 0,05 |

          Hai phía chênh nhau tới **81 lần**. Dòng giữa cho thấy $g$ nhỏ hơn 1 ngay cả khi không có Doppler: đồng hồ của khí ở 3 rs chạy bằng 70,7% đồng hồ ở xa, nên ánh sáng bị {{dịch chuyển đỏ hấp dẫn}}. Vì thế **mép trong tối đi**, dù khí nóng nhất ở khoảng 4,1 rs.

          > [Thử ngay] [[Tắt Doppler|tat]] [[Bật Doppler|bat]] [[Cho đĩa đứng yên|dung]] [[Cho đĩa quay|quay]]
          > Rê chuột lên đĩa để đọc $g$ của từng chỗ. Bật tiếng thì nghe thêm một nốt có tần số $440 \times g$ Hz (quy đổi cho tai): nốt cao lên ở phía khí lao tới, trầm xuống ở phía chạy ra xa và ở sát mép trong.

          +++ Đi sâu: công thức của $g$ và vì sao lũy thừa 4
          Với khí quay tròn ở bán kính $r$ (tốc độ góc $\Omega = \sqrt{GM/r^3}$ theo đồng hồ ở xa) và một tia có mô-men động lượng trên năng lượng là $\ell$:

          $$ g = \frac{\sqrt{1 - \frac{3r_s}{2r}}}{1 - \Omega\ell/c} $$

          Tử số là nhịp đồng hồ của khí trên quỹ đạo tròn (Bài 13); mẫu số là hiệu ứng Doppler. Ở 3 rs, tia phát tiếp tuyến có $\Omega\ell/c = \pm0{,}5$, nên $g = 0{,}707/0{,}5 = 1{,}41$ hoặc $0{,}707/1{,}5 = 0{,}47$.

          Độ sáng tỉ lệ $g^4$: mỗi photon mang năng lượng gấp $g$; photon tới dày hơn $g$ lần theo thời gian; và chùm tia bị dồn vào góc khối nhỏ hơn $g^2$ lần.
          +++`,
        vao: (c) => c.cauHinh({ goc: 'canh', dia: true, doppler: true, luoi: false, vong: false, ra: false, tocDo: 2.5 }),
        nut: { tat: (c) => c.cauHinh({ doppler: false }), bat: (c) => c.cauHinh({ doppler: true }), dung: (c) => c.cauHinh({ tocDo: 0 }), quay: (c) => c.cauHinh({ tocDo: 2.5 }) },
        thuThach: {
          de: 'Để Doppler bật. Rê chuột trên đĩa, tìm một chỗ mà ánh sáng tới mắt bạn **không đổi tần số**: $g = 1$ (lệch dưới 0,02). Ở đó hiệu ứng Doppler bù đúng dịch đỏ hấp dẫn.',
          goiY: 'Phía khí lao tới có g lớn hơn 1; phía chạy ra xa và sát mép trong có g nhỏ hơn 1. Tìm ở ranh giới giữa hai vùng, trên nửa đĩa sáng hơn.',
          kiem: (c) => c.thuThach.g1(),
          giu: 0.3,
        },
      },
      {
        ten: 'Ảnh thật: M87* năm 2019, Sgr A* năm 2022',
        noiDung: R`
          Nhìn lỗ đen gần như từ phía trên, lệch khoảng 17° so với trục quay, như hướng ta nhìn M87*: một vành sáng quanh một vùng tối, một bên sáng hơn. Đó đúng là thứ mà kính **Event Horizon Telescope** (EHT) chụp được.

          EHT nối các kính thiên văn vô tuyến ở nhiều châu lục thành một kính cỡ Trái Đất, quan sát ở bước sóng 1,3 mm. Độ phân giải cỡ bước sóng chia đường kính Trái Đất: khoảng **21 micro giây cung**, đủ để nhìn một quả cam trên Mặt Trăng.

          | | M87* | Sgr A* |
          |---|---|---|
          | Khối lượng (Mặt Trời) | 6,5 tỉ | 4,3 triệu |
          | Khoảng cách | 16,8 Mpc | 26 700 năm ánh sáng |
          | Bóng tính được: $5{,}2\,r_s$ chia khoảng cách | 39,7 µas | 54 µas |
          | Vành sáng đo được | 42 ± 3 µas (công bố 10/4/2019) | 51,8 ± 2,3 µas (công bố 12/5/2022) |

          (µas: micro giây cung.) Vành sáng là ánh sáng của khí ngay sát mép bóng, nên cỡ của nó không trùng hẳn với mép bóng: tuỳ khí phát sáng ở đâu, vành có thể lớn hơn hay nhỏ hơn bóng một chút. Khối lượng và khoảng cách cũng còn sai số vài phần trăm. Khối lượng 6,5 tỉ của M87* do chính EHT suy ra từ cỡ vành sáng, và khớp với khối lượng đo từ chuyển động của các sao quanh nó (khoảng 6,6 tỉ). Với Sgr A*, khối lượng và khoảng cách đo độc lập từ quỹ đạo sao S2, và vành sáng chỉ lệch bóng tính được khoảng 4%, nằm trong sai số: hình học lỗ đen của thuyết tương đối rộng vẫn đúng tới tận sát chân trời.

          > [Thử ngay] [[Nhìn như M87*|tren]] [[Góc quen thuộc|canh]] [[Số liệu M87*|m87]] [[Số liệu Sgr A*|sgr]]

          > [Lưu ý] Ảnh của EHT nhòe vì độ phân giải chỉ bằng chừng một nửa đường kính vành. Ảnh trong mô hình sắc nét vì máy tính không bị giới hạn ấy. Ở M87*, phía dưới vành sáng hơn; EHT giải thích là do khí quay và hiệu ứng Doppler như ở bước trước. Ở góc nhìn gần chính diện này, mô hình làm mịn vân khí và phóng đại độ chênh sáng giữa hai bên cho dễ thấy (minh hoạ); tính đúng thì bên khí lao tới chỉ sáng hơn bên kia chừng hai lần.`,
        vao: (c) => c.cauHinh({ goc: 'tren', dia: true, doppler: true, luoi: false, vong: false, ra: false, loDen: 'm87', tocDo: 2.5 }),
        nut: { tren: (c) => c.cauHinh({ goc: 'tren' }), canh: (c) => c.cauHinh({ goc: 'canh' }), m87: (c) => c.cauHinh({ loDen: 'm87' }), sgr: (c) => c.cauHinh({ loDen: 'sgr' }) },
      },
      {
        ten: 'Máy tính dựng hình này thế nào; lỗ đen quay',
        noiDung: R`
          Máy tính dựng hình bằng cách {{dò tia ngược}}: đi **từ mắt ra**, ngược chiều ánh sáng. Với mỗi điểm ảnh:

          1. Lấy hướng nhìn qua điểm ảnh ấy, đổi sang hướng trong tọa độ Schwarzschild.
          2. Giải phương trình đường đi của ánh sáng ở Bài 14 từng bước một, tới 300 bước; bước nhỏ ở gần lỗ đen, lớn dần ở xa.
          3. Mỗi lần tia cắt mặt phẳng đĩa giữa 3 rs và 12 rs: cộng màu của khí ở đó, nhân với $g^4$.
          4. Tia rơi xuống dưới $r_s$: điểm ảnh tối. Tia thoát ra xa: lấy màu bầu trời theo hướng cuối cùng của nó.

          Màn hình 1600 × 1000 có 1,6 triệu điểm ảnh, nên mỗi khung hình có thể tới **480 triệu bước**; card đồ họa làm song song tất cả. Đi ngược là vì trong vô số tia khí phát ra, chỉ một phần cực nhỏ tới đúng mắt ta.

          > [Lưu ý] Mô hình là lỗ đen **không quay**. Lỗ đen thật hầu như đều quay (lời giải Kerr, 1963). Lỗ đen quay kéo không-thời gian quanh nó quay theo. Hệ quả: mép trong của đĩa dời vào tới **0,5 rs** nếu khí quay cùng chiều (giải phóng tới 42% khối lượng nghỉ) hoặc ra tới **4,5 rs** nếu ngược chiều; cái bóng **lệch sang một bên** và một mép hơi dẹt, nhưng cỡ chỉ đổi vài phần trăm. Vì vậy ảnh EHT kiểm được khối lượng tốt hơn kiểm tốc độ quay.

          > [Thử ngay] [[Bay sát chân trời|sat]] [[Quay lưng nhìn ra vũ trụ|ra]] [[Về góc quen thuộc|canh]]
          > Rê chuột lên bất kỳ điểm ảnh nào: máy tính dò lại đúng tia của điểm ảnh ấy bằng cùng thuật toán và kể nó đi đâu (rơi vào chân trời, gặp đĩa ở đâu, hay tới từ ngôi sao nào).

          Bài 16 sẽ vẽ cấu trúc nhân quả của chân trời bằng nón ánh sáng, và theo một vật đi xuyên qua nó.`,
        vao: (c) => c.cauHinh({ goc: 'canh', dia: true, doppler: true, luoi: false, vong: false, ra: false, tocDo: 2.5 }),
        nut: { sat: (c) => c.cauHinh({ goc: 'sat', ra: false }), ra: (c) => c.cauHinh({ ra: true }), canh: (c) => c.cauHinh({ goc: 'canh', ra: false }) },
      },
    ],
    congThuc: [
      { ten: 'Bán kính Schwarzschild', tex: R`r_s = \frac{2GM}{c^2}`, y: 'Mặt Trời 2,95 km · Trái Đất 8,9 mm.' },
      { ten: 'Đường kính bóng (nhìn từ xa)', tex: R`2b_c = 3\sqrt3\,r_s \approx 5{,}2\,r_s`, y: 'Góc nhìn bằng $5{,}2\\,r_s$ chia khoảng cách.' },
      { ten: 'Cỡ bóng nhìn từ bán kính r', tex: R`\sin\theta = \frac{3\sqrt3}{2}\frac{r_s}{r}\sqrt{1-\frac{r_s}{r}}`, y: '$\\theta$ là bán kính góc của bóng; ở 1,5 rs bóng chiếm nửa bầu trời.' },
      { ten: 'Dịch tần số của đĩa', tex: R`g = \frac{\sqrt{1-3r_s/2r}}{1-\Omega\ell/c}, \qquad I \propto g^4`, y: 'Tử số: đồng hồ của khí chạy chậm. Mẫu số: hiệu ứng Doppler.' },
    ],
    cauHoi: [
      {
        hoi: 'Nếu nén cả Trái Đất thành một lỗ đen, bán kính chân trời của nó cỡ bao nhiêu?',
        chon: ['8,9 mét', '8,9 mm', '2,95 km', '6 371 km'],
        dung: 1,
        giai: R`$r_s = 2GM/c^2$ với $GM_{\text{TĐ}} = 3{,}99\times10^{14}\ \text{m}^3/\text{s}^2$ cho $8{,}9\times10^{-3}$ m, cỡ một viên bi. 2,95 km là của Mặt Trời.`,
      },
      {
        hoi: 'Vì sao cái bóng của lỗ đen rộng khoảng 5,2 rs chứ không phải 2 rs (đường kính chân trời)?',
        chon: [
          'Vì quanh chân trời có một lớp khí đen che bớt ánh sáng',
          'Vì mọi tia có khoảng ngắm dưới 2,6 rs đều bị bẻ vào và rơi qua chân trời',
          'Vì chân trời giãn nở theo thời gian',
          'Vì ảnh bị phóng to do thấu kính của khí quyển Trái Đất',
        ],
        dung: 1,
        giai: R`Bóng là tập hợp các hướng nhìn mà lần ngược theo tia sáng chỉ gặp chân trời. Khoảng ngắm tới hạn là $b_c = (3\sqrt3/2)\,r_s \approx 2{,}6\,r_s$, nên đường kính bóng là $2b_c \approx 5{,}2\,r_s$.`,
      },
      {
        hoi: 'Đĩa khí phẳng, ta lại nhìn nó gần như từ cạnh. Vì sao vẫn thấy một vòng cung sáng vồng lên phía trên cái bóng?',
        chon: [
          'Vì đĩa thật ra cong lên ở phía sau',
          'Vì ánh sáng từ phần đĩa phía sau lỗ đen bị bẻ vòng qua đỉnh lỗ đen rồi tới mắt',
          'Vì khí phía sau nóng hơn',
          'Vì đó là tia phản lực phun ra từ lỗ đen',
        ],
        dung: 1,
        giai: 'Không có gì che được phần sau lưng lỗ đen. Ánh sáng từ đó bị bẻ quanh lỗ đen và hiện ra phía trên (mặt trên của đĩa) và phía dưới (mặt dưới). Đĩa không hề cong.',
      },
      {
        hoi: 'Vì sao một bên đĩa sáng hơn hẳn bên kia?',
        chon: [
          'Vì bên đó gần lỗ đen hơn',
          'Vì khí bên đó đang lao về phía ta: hiệu ứng Doppler làm ánh sáng mạnh và xanh hơn',
          'Vì bên đó được Mặt Trời chiếu sáng',
          'Vì lỗ đen hút ánh sáng của bên kia',
        ],
        dung: 1,
        giai: R`Khí ở mép trong quay với tốc độ cỡ nửa tốc độ ánh sáng. Độ sáng tỉ lệ $g^4$: bên lao tới $g \approx 1{,}41$, bên chạy ra xa $g \approx 0{,}47$, chênh nhau khoảng 81 lần.`,
      },
      {
        hoi: 'M87* nặng gấp khoảng 1 500 lần Sgr A*, nhưng vành sáng của hai lỗ đen trên ảnh EHT lại có cỡ gần như nhau. Vì sao?',
        chon: [
          'Vì EHT phóng to ảnh Sgr A* lên cho dễ so',
          'Vì M87* ở xa hơn khoảng 2 000 lần, nên cỡ góc gần như bù lại',
          'Vì cỡ bóng không phụ thuộc khối lượng',
          'Vì Sgr A* quay nhanh hơn',
        ],
        dung: 1,
        giai: R`Cỡ góc của bóng bằng $5{,}2\,r_s$ chia khoảng cách, mà $r_s$ tỉ lệ với khối lượng. Khối lượng gấp khoảng 1 500 lần, khoảng cách gấp khoảng 2 000 lần (16,8 Mpc so với 8,2 kpc), nên M87* trông còn hơi nhỏ hơn: 40 so với 54 micro giây cung.`,
      },
      {
        hoi: 'Mô tả cách máy tính quyết định màu của một điểm ảnh trong hình lỗ đen.',
        dap: 'Máy tính lấy hướng nhìn qua điểm ảnh, rồi lần ngược tia sáng từ mắt ra bằng phương trình đường trắc địa kiểu ánh sáng, từng bước nhỏ. Mỗi lần tia cắt mặt phẳng đĩa ở chỗ có khí, cộng màu của khí (theo nhiệt độ và hệ số dịch tần $g$, độ sáng nhân $g^4$). Nếu tia xuống dưới bán kính Schwarzschild thì phần còn lại tối đen. Nếu tia thoát ra xa thì cộng màu bầu trời theo hướng cuối cùng của tia. Đi ngược như vậy là vì chỉ những tia tới đúng mắt mới cần tính.',
      },
    ],
    docThem: [
      'Event Horizon Telescope Collaboration 2019, ApJL 875, L1: ảnh đầu tiên của bóng lỗ đen M87*.',
      'Event Horizon Telescope Collaboration 2022, ApJL 930, L12: ảnh của Sagittarius A*.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 12: suy sập hấp dẫn và lỗ đen.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): lịch sử ý tưởng lỗ đen, từ «ngôi sao tối» tới lỗ đen quay.',
    ],
    thuatNgu: [
      { vi: 'bóng lỗ đen', en: 'black hole shadow', nghia: 'Vùng tối trên bầu trời gồm các hướng mà lần ngược theo tia sáng chỉ gặp chân trời. Với lỗ đen không quay, đường kính $3\\sqrt3\\,r_s \\approx 5{,}2\\,r_s$.' },
      { vi: 'vành photon', en: 'photon ring', nghia: 'Vành sáng mảnh sát mép bóng, gồm các ảnh của ánh sáng đã quấn quanh mặt cầu photon nửa vòng, một vòng hay nhiều hơn.' },
      { vi: 'đĩa bồi tụ', en: 'accretion disk', nghia: 'Đĩa khí xoáy dần vào một vật nặng; ma sát làm nó nóng và phát sáng. Quanh lỗ đen không quay, mép trong ở khoảng 3 rs.' },
      { vi: 'dò tia ngược', en: 'backward ray tracing', nghia: 'Cách dựng hình bằng cách lần mỗi tia sáng từ mắt ra ngoài, ngược chiều ánh sáng thật, rồi xem nó gặp gì.' },
      { vi: 'lỗ đen Kerr', en: 'Kerr black hole', nghia: 'Lỗ đen có quay (lời giải của Roy Kerr, 1963). Nó kéo không-thời gian quanh nó quay theo; bóng hơi lệch, mép trong của đĩa dời đi.' },
    ],
  },

  conSo: [
    '**Sagittarius A***: 4,3 triệu khối lượng Mặt Trời, bán kính chân trời 12,7 triệu km. EHT công bố ảnh năm 2022; vành sáng khoảng 52 micro giây cung.',
    '**M87***: 6,5 tỉ khối lượng Mặt Trời, bán kính chân trời 128 AU, gấp hơn 4 lần quỹ đạo Sao Hải Vương. Ảnh lỗ đen đầu tiên, công bố 10/4/2019; vành sáng 42 ± 3 micro giây cung.',
    '**5,2 rs** (chính xác $3\\sqrt3$): đường kính bóng lỗ đen nhìn từ xa.',
    '**81 lần**: chênh lệch độ sáng giữa hai phía mép trong của đĩa, do hiệu ứng Doppler.',
  ],
  hieuDung: '**Lỗ đen không phải máy hút bụi.** Ở xa, lực hấp dẫn của nó giống hệt một ngôi sao cùng khối lượng. Nếu Mặt Trời bỗng biến thành lỗ đen nặng đúng bằng nó, Trái Đất vẫn quay trên quỹ đạo cũ, chỉ có điều trời tối và lạnh. Và cái bóng đen trên ảnh không phải «bề mặt» của lỗ đen: nó rộng gấp hơn hai lần rưỡi chân trời.',
  nguon: 'Event Horizon Telescope Collaboration 2019, ApJL 875, L1 (M87*: khối lượng 6,5 tỉ M☉, khoảng cách 16,8 Mpc, vành 42 ± 3 µas) và 2022, ApJL 930, L12 (Sgr A*: vành 51,8 ± 2,3 µas). Khối lượng và khoảng cách Sgr A*: GRAVITY Collaboration. Khối lượng M87* từ chuyển động sao: Gebhardt và cộng sự 2011. Quỹ đạo tròn trong cùng của lỗ đen quay: Bardeen, Press và Teukolsky 1972. Hằng số: CODATA 2018, IAU 2012. Màu của đĩa là minh họa: nhiệt độ thật của khí cao hơn nhiều.',

  tao(app) {
    const scene = new THREE.Scene();
    const camera = app.camera;
    const am = app.am, tt = app.tt;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));

    // ---------- Bầu trời thật, vẽ một lần vào ảnh lập phương ----------
    // Dải Ngân Hà vắt chéo ngay sau lỗ đen (nhìn từ góc quen thuộc), vùng tâm hơi lệch phải: thấu kính hấp dẫn
    // biến nó thành vòng Einstein quanh bóng. Hướng bầu trời là chọn cho đẹp; các ngôi sao và dải sáng là thật.
    const anhTroi = new THREE.WebGLCubeRenderTarget(1024, {
      type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
    });
    const canhTroi = new THREE.Scene();
    const troi = taoNenSao({ soSao: 9000, doSang: 1, daiNganHa: { tam: [0.93, 0.12, -0.35], cucBac: [-0.2, 0.93, 0.32] } });
    canhTroi.add(troi);
    troi.traverse((o) => { if (o.isPoints) o.onBeforeRender = () => { o.material.uniforms.uTiLe.value = 0.85; }; });
    {
      const r = app.renderer;
      const xoaCu = r.autoClear, mauCu = r.getClearColor(new THREE.Color()), aCu = r.getClearAlpha();
      r.autoClear = true; r.setClearColor(0x000000, 1);
      new THREE.CubeCamera(0.1, 10, anhTroi).update(r, canhTroi);
      r.autoClear = xoaCu; r.setClearColor(mauCu, aCu);
    }

    const U = {
      uCam: { value: new THREE.Vector3() }, uPhai: { value: new THREE.Vector3() }, uLen: { value: new THREE.Vector3() },
      uTruoc: { value: new THREE.Vector3() }, uTanNua: { value: 0.4 }, uTiSo: { value: 1.6 }, uT: { value: 0 },
      uDia: { value: 1 }, uDoppler: { value: 1 }, uLuoi: { value: 0 }, uLech: { value: new THREE.Vector2() },
      uVong: { value: 0 }, uBong: { value: 0.1 }, uChanTroi: { value: 0.05 }, uDiemAnh: { value: 0.001 },
      uTroi: { value: anhTroi.texture }, uSangTroi: { value: 0.6 }, uSangDia: { value: 1 }, uMin: { value: 0 }, uMuThem: { value: 0 },
      uMay: { value: new THREE.Vector4(0, 0, 0, 0) }, uMauMay: { value: new THREE.Color() },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: 'varying vec2 vUv; void main() { vUv = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: MANH,
      depthTest: false, depthWrite: false,
    });
    mat.tuyenTinh = true;
    const tam = new THREE.Mesh(geo, mat);
    tam.frustumCulled = false;
    scene.add(tam);

    let loDen = LO_DEN[0];
    let tocDo = 2.5;      // đơn vị rs/c mỗi giây
    const bang = app.bang;
    // Bay tới bán kính r, độ cao doCao (độ) so với mặt đĩa; giữ hướng phương vị hiện tại trừ khi chỉ định.
    const bay = (r, doCao, giay = 2.2, phuongVi = null) => {
      const a = (doCao * Math.PI) / 180;
      const hien = phuongVi ?? Math.atan2(camera.position.x, camera.position.z);
      app.bayToi([r * Math.cos(a) * Math.sin(hien), r * Math.sin(a), r * Math.cos(a) * Math.cos(hien)], [0, 0, 0], giay);
    };
    const K_SANG_DIA = 0.9, K_MIN = 0.85, K_MU_THEM = 6;   // khi nhìn gần chính diện: phơi sáng của đĩa, độ làm mịn vân khí, phần mũ thêm cho g (minh hoạ)
    const GOC = { xa: [42, 12, 2.2], canh: [15.7, 8.8, 2.2], tren: [20, 73, 2.2], ngang: [17, 1.2, 2.2], photon: [1.5, 30, 3.2], sat: [1.1, 40, 3.6] };
    const dkBay = bang.chon({
      nhan: chuCanh("canh.bay-toi", "Bay tới"),
      luaChon: [
        { giaTri: 'xa', nhan: chuCanh("canh.tu-xa", "Từ xa") }, { giaTri: 'canh', nhan: chuCanh("canh.canh-quen-thuoc", "Cảnh quen thuộc") }, { giaTri: 'tren', nhan: chuCanh("canh.nhin-tu-tren", "Nhìn từ trên") },
        { giaTri: 'ngang', nhan: chuCanh("canh.ngang-mat-dia", "Ngang mặt đĩa") }, { giaTri: 'photon', nhan: chuCanh("canh.mat-cau-photon", "Mặt cầu photon") }, { giaTri: 'sat', nhan: chuCanh("canh.sat-chan-troi", "Sát chân trời") },
      ],
      giaTri: 'canh',
      khiDoi: (v) => { huyMay(); const g = GOC[v]; bay(g[0], g[1], g[2]); },
    });
    const dkDia = bang.congTac({ nhan: chuCanh("canh.dia-boi-tu-khi-nong-quay-quanh", "Đĩa bồi tụ (khí nóng quay quanh)"), giaTri: true, khiDoi: (v) => { U.uDia.value = v ? 1 : 0; } });
    const dkDop = bang.congTac({ nhan: chuCanh("canh.hieu-ung-doppler-va-dich-chuyen-do", "Hiệu ứng Doppler và dịch chuyển đỏ"), giaTri: true, khiDoi: (v) => { U.uDoppler.value = v ? 1 : 0; } });
    const dkLuoi = bang.congTac({ nhan: chuCanh("canh.luoi-bau-troi-de-thay-anh-sang-bi", "Lưới bầu trời (để thấy ánh sáng bị bẻ cong)"), giaTri: false, khiDoi: (v) => { U.uLuoi.value = v ? 1 : 0; } });
    let vong = false;
    const chuVong = bang.chuThich(chuCanh("canh.vong-xanh-luc-mep-bong-vong-do-dut", "<b>Vòng xanh lục</b>: mép bóng. <b>Vòng đỏ đứt nét</b>: chân trời trông lớn cỡ nào nếu ánh sáng đi thẳng."));
    const dkVong = bang.congTac({ nhan: chuCanh("canh.ve-mep-bong-va-co-chan-troi", "Vẽ mép bóng và cỡ chân trời"), giaTri: false, khiDoi: (v) => { vong = v; chuVong.el.hidden = !v; } });
    chuVong.el.hidden = true;
    let nhinRa = false;
    const dkRa = bang.congTac({ nhan: chuCanh("canh.quay-lung-lai-lo-den-nhin-ra-vu", "Quay lưng lại lỗ đen, nhìn ra vũ trụ"), giaTri: false, khiDoi: (v) => { nhinRa = v; } });
    const dkLD = bang.chon({
      nhan: chuCanh("canh.tinh-so-lieu-cho-lo-den-nao", "Tính số liệu cho lỗ đen nào?"),
      luaChon: LO_DEN.map((l) => ({ giaTri: l.id, nhan: l.ten, moTa: l.moTa })),
      giaTri: loDen.id,
      khiDoi: (v) => { loDen = LO_DEN.find((l) => l.id === v); },
    });
    const dkTD = bang.thanhTruot({
      nhan: chuCanh("canh.toc-do-quay-cua-dia", "Tốc độ quay của đĩa"), min: 0, max: 8, buoc: 0.1, giaTri: tocDo,
      hienThi: (v) => (v === 0 ? chuCanh("canh.dung-yen", "đứng yên") : `×${so(v, 1)}`),
      khiDoi: (v) => { tocDo = v; },
    });
    const nutMay = bang.nut([
      { nhan: chuCanh("canh.tha-may-phat", "Thả máy phát"), chinh: true, khiBam: () => thaMay() },
      { nhan: chuCanh("canh.dung-lay-may-phat-lai", "Dừng, lấy máy phát lại"), khiBam: () => huyMay() },
    ]);
    nutMay.hidden = true;

    // ======================================================================
    // Máy phát tín hiệu thả rơi (bước 2)
    // ======================================================================
    // Trước khi thả: tay nắm nằm trên mặt phẳng qua tâm, vuông góc với hướng nhìn (luôn «trước mặt» người xem),
    // ở bán kính mayR, góc mayA trên màn hình. Thả ra: máy phát rơi tự do theo phương bán kính, máy quay giữ yên
    // (người xem đứng lơ lửng để nhận tín hiệu), thời gian của người xem chạy RS_MOI_GIAY rs/c mỗi giây.
    const _phai = new THREE.Vector3(), _len = new THREE.Vector3(), _ve = new THREE.Vector3(), _mp = new THREE.Plane();
    const may = { bat: false, trangThai: 'cho', R: 6, A: 2.25, huong: new THREE.Vector3(), lich: null, T: 0, k: 0, giong: null, dkCu: true, rThay: 6, gThay: 1, tauThay: 0, daTha: false };
    const RMaxMay = () => Math.min(10, 0.8 * camera.position.length());
    const kepMay = (p) => {
      const l = p.length() || 1;
      const rr = Math.min(RMaxMay(), Math.max(1.8, l));
      return p.multiplyScalar(rr / l);
    };
    const datTayTheoGoc = () => {
      camera.updateMatrixWorld();
      _phai.setFromMatrixColumn(camera.matrixWorld, 0); _len.setFromMatrixColumn(camera.matrixWorld, 1);
      _ve.copy(_phai).multiplyScalar(Math.cos(may.A)).addScaledVector(_len, Math.sin(may.A)).multiplyScalar(Math.min(may.R, RMaxMay()));
      tayMay.dat(_ve);
    };
    const tayMay = tt.tayNam({
      viTri: [-4, 4, 0], mau: 0x7fcaff, co: 0.22,
      rangBuoc: {
        kieu: 'ham',
        chieu: (tia) => {
          _mp.setFromNormalAndCoplanarPoint(_ve.copy(camera.position).normalize(), new THREE.Vector3());
          const p = tia.intersectPlane(_mp, new THREE.Vector3());
          return p ? kepMay(p) : null;
        },
      },
      gioiHan: (p) => kepMay(p),
      nhan: chuCanh("canh.keo-may-phat-roi-tha", "Kéo máy phát rồi thả"),
      ten: chuCanh("canh.may-phat-tin-hieu", "Máy phát tín hiệu"),
      moTa: () => chuCanh("canh.dung-yen-o-r-rs-tha-ra-thi", "Đứng yên ở <span class=\"so\">r = {0} rs</span>. Thả ra thì theo đồng hồ của chính nó, nó tới chân trời sau <span class=\"so\">{1} rs/c</span> và tới kỳ dị sau <span class=\"so\">{2} rs/c</span>.", [so(may.R, 2), so(tauToiChanTroi(may.R), 1), so((Math.PI / 2) * may.R ** 1.5, 1)]),
      khiKeo: (p) => {
        camera.updateMatrixWorld();
        _phai.setFromMatrixColumn(camera.matrixWorld, 0); _len.setFromMatrixColumn(camera.matrixWorld, 1);
        may.R = p.length(); may.A = Math.atan2(p.dot(_len), p.dot(_phai));
      },
      khiTha: () => thaMay(),
    });
    tayMay.an(true);

    function thaMay() {
      if (!may.bat || may.trangThai === 'roi') return;
      const r0 = camera.position.length();
      if (r0 < 3) return;
      datTayTheoGoc();
      const p = tayMay.viTri.clone();
      may.R = p.length();
      may.huong.copy(p).normalize();
      const D = may.huong.angleTo(_ve.copy(camera.position).normalize());
      may.lich = lichTinHieu({ R: may.R, r0, D, dTau: DTAU_PHAT });
      may.T = 0; may.k = 0; may.trangThai = 'roi'; may.daTha = true;
      may.dkCu = app.dk.enabled; app.dk.enabled = false;
      tayMay.an(true);
      am.phat('tha', { doTo: 0.6 });
    }
    function huyMay() {
      if (may.trangThai === 'roi') app.dk.enabled = may.dkCu !== false;
      may.trangThai = 'cho'; may.lich = null;
      may.giong?.tat(0.3); may.giong = null;
      U.uMay.value.w = 0;
      if (may.bat) { tayMay.an(false); datTayTheoGoc(); }
    }
    function batMay(b) {
      if (!b) { huyMay(); may.bat = false; tayMay.an(true); nutMay.hidden = true; return; }
      may.bat = true; nutMay.hidden = false;
      huyMay();
    }
    const _mauMay = new THREE.Color();
    function capNhatMay(dt) {
      if (!may.bat) return;
      if (may.trangThai !== 'roi') {
        if (!tt.dangKeo) datTayTheoGoc();
        tayMay.an(camera.position.length() < 3);
        return;
      }
      const L = may.lich;
      may.T += dt * RS_MOI_GIAY;
      // Chỗ máy phát đang được thấy: sự kiện phát mà ánh sáng tới mắt đúng lúc này (trước khi tín hiệu đầu tới thì
      // vẫn thấy nó treo ở R, vì ánh sáng cũ còn đang bay tới).
      const th = L.thay(may.T);
      let r = may.R, g = L.bang[0].g, tauT = 0;
      if (th) { r = th.r; g = th.g; tauT = th.tau; }
      may.rThay = r; may.gThay = g; may.tauThay = tauT;
      const sang = 3 * Math.min(1, g) ** 1.5;
      if (g < 0.003 || th?.het) U.uMay.value.w = 0;
      else {
        U.uMay.value.set(may.huong.x * r, may.huong.y * r, may.huong.z * r, 1);
        mauBuocSong(BUOC_SONG_MAY / g, _mauMay);
        U.uMauMay.value.copy(_mauMay).multiplyScalar(sang);
      }
      // Tiếng: mỗi xung tới thì «bíp» ở g × 880 Hz; nốt kéo dài cùng tần số. Không phát dồn khi thời gian bị đẩy nhanh.
      let phat = 0;
      while (may.k < L.xung.length && L.xung[may.k].T <= may.T) {
        const x = L.xung[may.k++];
        if (dt > 0 && phat < 2 && may.T - x.T < 1.5 * RS_MOI_GIAY * 0.1 + dt * RS_MOI_GIAY) {
          am.not({ tanSo: TAN_SO_PHAT * x.g, dai: 0.32, doTo: 0.32 + 0.3 * Math.min(1, x.g), dang: 'chuong' });
          phat++;
        }
      }
      const coTieng = th && !th.het && g > 0.04 && dt > 0;
      if (coTieng) {
        if (!may.giong) may.giong = am.giong({ dang: 'day', tanSo: TAN_SO_PHAT * g, doTo: 0 });
        may.giong.dat({ tanSo: TAN_SO_PHAT * g, doTo: 0.07 * Math.min(1, g) ** 0.5 }, 0.08);
      } else if (may.giong) {
        if (dt === 0) may.giong.dat({ doTo: 0 }, 0.05);
        else { may.giong.tat(0.5); may.giong = null; }
      }
      if (th?.het && may.k >= L.xung.length) {
        if (!may.hetLuc) may.hetLuc = may.T;
        if (may.T - may.hetLuc > 2 * RS_MOI_GIAY) { may.hetLuc = 0; huyMay(); }
      }
    }

    // ======================================================================
    // Rê chuột: dò lại tia của điểm ảnh dưới con trỏ
    // ======================================================================
    const cv = app.renderer.domElement;
    const con = { x: 0, y: 0, trong: false };
    const diChuot = (e) => { const r = cv.getBoundingClientRect(); con.x = e.clientX - r.left; con.y = e.clientY - r.top; con.trong = true; };
    const roiChuot = () => { con.trong = false; };
    cv.addEventListener('pointermove', diChuot);
    cv.addEventListener('pointerleave', roiChuot);
    let tiaRe = null;
    const _d = [0, 0, 0], _c = [0, 0, 0];
    function doTiaTaiCon() {
      if (!con.trong || tt.dangKeo) { tiaRe = null; return; }
      const w = cv.clientWidth || app.rong, h = cv.clientHeight || app.cao;
      const ux = (2 * con.x) / w - 1 + U.uLech.value.x, uy = 1 - (2 * con.y) / h + U.uLech.value.y;
      const a = U.uTiSo.value * U.uTanNua.value * ux, b = U.uTanNua.value * uy;
      const T = U.uTruoc.value, P = U.uPhai.value, L = U.uLen.value;
      _d[0] = T.x + a * P.x + b * L.x; _d[1] = T.y + a * P.y + b * L.y; _d[2] = T.z + a * P.z + b * L.z;
      const l = Math.hypot(_d[0], _d[1], _d[2]); _d[0] /= l; _d[1] /= l; _d[2] /= l;
      _c[0] = U.uCam.value.x; _c[1] = U.uCam.value.y; _c[2] = U.uCam.value.z;
      tiaRe = doTia(_c, _d, { dia: U.uDia.value > 0.5, doppler: U.uDoppler.value > 0.5 });
      tiaRe.dLoc = [_d[0], _d[1], _d[2]];
    }
    function moTaTia() {
      const t = tiaRe;
      if (!t) return '';
      if (t.dia) {
        const d = t.dia;
        const cho = d.sauLoDen ? chuCanh("canh.phan-dia-nam-sau-lo-den", "phần đĩa nằm <b>sau</b> lỗ đen") : chuCanh("canh.phan-dia-nam-truoc-lo-den", "phần đĩa nằm trước lỗ đen");
        const bac = d.quet > 180 ? chuCanh("canh.anh-bac-cao-tia-da-quan-quanh-lo", "<br>Ảnh bậc cao: tia đã quấn quanh lỗ đen hơn nửa vòng.") : d.sauLoDen && d.quet > 60 ? chuCanh("canh.anh-sang-bi-be-vong-qua-lo-den", "<br>Ánh sáng bị bẻ vòng qua lỗ đen rồi mới tới mắt bạn.") : '';
        const gChu = U.uDoppler.value > 0.5
          ? chuCanh("canh.ti-so-tan-so-nhan-phat-g-sang", "Tỉ số tần số nhận / phát <span class=\"so\">g = {0}</span>: {1}, sáng gấp <span class=\"so\">{2}</span> lần (g⁴).", [so(d.g, 3), d.g > 1.005 ? chuCanh("canh.xanh-hon", "xanh hơn") : d.g < 0.995 ? chuCanh("canh.do-hon", "đỏ hơn") : chuCanh("canh.gan-nhu-khong-doi-mau", "gần như không đổi màu"), soNghia(d.sang, 2)])
          : chuCanh("canh.dang-tat-doppler-va-dich-do-g-1", "Đang tắt Doppler và dịch đỏ: g = 1.");
        return chuCanh("canh.khi-cua-dia-o-r-rs-khi-quay", "<b>Khí của đĩa ở r = {0} rs</b>, {1}; khí quay <span class=\"so\">{2} c</span>.<br>{3}{4}<br>Tia đã quét <span class=\"so\">{5}°</span> quanh tâm.", [so(d.rho, 2), cho, so(d.tocDo, 2), gChu, bac, so(d.quet, 0)]);
      }
      if (t.roi) return chuCanh("canh.tia-nay-roi-vao-chan-troi-lan-nguoc", "<b>Tia này rơi vào chân trời.</b><br>Lần ngược từ mắt bạn, nó xuống dưới r = rs nên điểm ảnh tối: đây là một hướng trong <b>bóng</b> của lỗ đen. Tia tới gần tâm nhất ở r = 1 rs sau khi quét <span class=\"so\">{0}°</span>.", [so(t.quet, 0)]);
      if (!t.thoat) return chuCanh("canh.tia-quan-quanh-mat-cau-photon-nhieu-vong", "<b>Tia quấn quanh mặt cầu photon nhiều vòng</b> trước khi thoát ra: một phần của vành photon, sát mép bóng.");
      const lech = (Math.acos(Math.max(-1, Math.min(1, t.dLoc[0] * t.huongCuoi[0] + t.dLoc[1] * t.huongCuoi[1] + t.dLoc[2] * t.huongCuoi[2]))) * 180) / Math.PI;
      const sau = t.be > 180 ? chuCanh("canh.hon-nua-vong-ngoi-sao-nay-that-ra", "<br><b>Hơn nửa vòng</b>: ngôi sao này thật ra nằm gần phía sau lưng bạn.") : '';
      return chuCanh("canh.anh-sang-tu-bau-troi-xa-tia-da", "<b>Ánh sáng từ bầu trời xa</b><br>Tia đã bị bẻ <span class=\"so\">{0}°</span>; ngôi sao thật nằm lệch <span class=\"so\">{1}°</span> so với chỗ bạn thấy. Tia đi sát tâm nhất ở <span class=\"so\">{2} rs</span>.{3}", [so(t.be, 1), so(lech, 1), so(t.rMin, 2), sau]);
    }
    // Một quả cầu lớn vô hình bao quanh người xem: khung tương tác dò trúng nó ở mọi điểm ảnh, ô chú giải đọc moTaTia.
    const vo = new THREE.Mesh(new THREE.SphereGeometry(400, 16, 8), new THREE.MeshBasicMaterial({ side: THREE.BackSide, visible: false }));
    vo.frustumCulled = false;
    scene.add(vo);
    tt.them(vo, { moTa: () => moTaTia(), noiBat: false, conTro: 'crosshair', mau: 0xf3c66f });
    // Rê lên đĩa: nốt kéo dài 440 × g Hz.
    let giongDia = null;
    function capNhatTiengDia(dt) {
      const g = tiaRe?.dia?.g;
      if (g && dt > 0 && U.uDia.value > 0.5) {
        if (!giongDia) giongDia = am.giong({ dang: 'mem', tanSo: 440 * g, doTo: 0 });
        giongDia.dat({ tanSo: 440 * g, doTo: 0.13 }, 0.06);
      } else if (giongDia) { giongDia.tat(0.25); giongDia = null; }
    }

    // Các bước của bài giảng gọi hàm này: { goc, dia, doppler, luoi, vong, ra, loDen, tocDo, may }.
    function cauHinh(o = {}) {
      if (o.dia != null) { dkDia.dat(o.dia); U.uDia.value = o.dia ? 1 : 0; }
      if (o.doppler != null) { dkDop.dat(o.doppler); U.uDoppler.value = o.doppler ? 1 : 0; }
      if (o.luoi != null) { dkLuoi.dat(o.luoi); U.uLuoi.value = o.luoi ? 1 : 0; }
      if (o.vong != null) { vong = o.vong; dkVong.dat(vong); chuVong.el.hidden = !vong; }
      if (o.ra != null) { nhinRa = o.ra; dkRa.dat(nhinRa); }
      if (o.loDen) { loDen = LO_DEN.find((l) => l.id === o.loDen); dkLD.dat(o.loDen); }
      if (o.tocDo != null) { tocDo = o.tocDo; dkTD.dat(tocDo); }
      if (o.goc) { huyMay(); const g = GOC[o.goc]; dkBay.dat(o.goc); bay(g[0], g[1], g[2], 0); }
      if (o.may != null) batMay(o.may);
    }
    // Độ nét: tự dò mức cao nhất mà máy vẫn chạy mượt (mỗi điểm ảnh là cả trăm bước tính)
    const MUC = [0.75, 1, 1.25, 1.5, 2].filter((m) => m <= app.tiLeGoc + 1e-6);
    let muc = Math.max(0, MUC.indexOf(1)), tuDong = true, tran = MUC.length - 1, dtTB = 0.016, choDo = 1.5, choThuLai = 0;
    const datMuc = (i) => { muc = Math.max(0, Math.min(MUC.length - 1, i)); app.renderer.setPixelRatio(MUC[muc]); app._doiKichThuoc(); };
    bang.chon({
      nhan: chuCanh("canh.do-net", "Độ nét"),
      luaChon: [{ giaTri: 'tu', nhan: chuCanh("canh.tu-dong", "Tự động") }, { giaTri: 'thap', nhan: chuCanh("canh.thuong", "Thường") }, { giaTri: 'cao', nhan: chuCanh("canh.cao-nhat", "Cao nhất") }],
      giaTri: 'tu',
      khiDoi: (v) => { tuDong = v === 'tu'; if (v === 'thap') datMuc(MUC.indexOf(1)); else if (v === 'cao') datMuc(MUC.length - 1); else tran = MUC.length - 1; },
    });
    function doNetTuDong(dtThuc) {
      if (!tuDong || app.imLang || dtThuc <= 0 || dtThuc > 0.09) return;       // bỏ qua lúc cửa sổ bị ẩn; khi kiểm thì giữ nguyên độ nét
      dtTB += (dtThuc - dtTB) * 0.08;
      choDo -= dtThuc; choThuLai -= dtThuc;
      if (choDo > 0) return;
      choDo = 1.2;
      if (dtTB > 0.021 && muc > 0) { tran = muc - 1; choThuLai = 25; datMuc(muc - 1); dtTB = 0.016; }
      else if (dtTB < 0.0175 && muc < MUC.length - 1 && (muc < tran || choThuLai <= 0)) { if (muc >= tran) tran = muc + 1; datMuc(muc + 1); dtTB = 0.016; }
    }

    // Tham số chụp ảnh khi kiểm (chỉ khi app.imLang): thu=roi | be180 | g1 | bong90 | keo.
    const thamThu = app.imLang ? new URLSearchParams(location.search) : null;
    const thu = thamThu?.get('thu') || null;
    let thuGio = 0, thuXong = !thu;
    function chayThu(dtThuc) {
      thuGio += dtThuc;
      if (thuXong || thuGio < 2.4) return;
      thuXong = true;
      camera.updateMatrixWorld();
      const rect = cv.getBoundingClientRect();
      const diToi = (x, y) => cv.dispatchEvent(new PointerEvent('pointermove', { clientX: rect.left + x, clientY: rect.top + y, pointerId: 1, pointerType: 'mouse', isPrimary: true, bubbles: true }));
      const tim = (dieuKien) => {
        // quét màn hình (trừ phần bị bảng bài giảng che) tìm điểm ảnh đầu tiên thoả điều kiện, từ giữa hình ra
        const w = cv.clientWidth, h = cv.clientHeight, cx = w / 2 - app.lech[0], cy = h / 2 - app.lech[1];
        for (let rr = 4; rr < Math.min(w, h) * 0.45; rr += 2) {
          for (let k = 0; k < 64; k++) {
            const a = (k / 64) * 2 * Math.PI + 0.3, x = Math.round(cx + rr * Math.cos(a)), y = Math.round(cy + rr * Math.sin(a));
            if (x < 10 || x > w - 470 || y < 10 || y > h - 10) continue;
            con.x = x; con.y = y; con.trong = true; doTiaTaiCon();
            if (tiaRe && dieuKien(tiaRe)) {
              // đi tiếp ra ngoài theo cùng hướng tới khi hết thoả, lấy điểm giữa (xa mép, chắc chắn hơn)
              let r2 = rr;
              for (; r2 < rr + 60; r2 += 1) {
                con.x = Math.round(cx + r2 * Math.cos(a)); con.y = Math.round(cy + r2 * Math.sin(a)); doTiaTaiCon();
                if (!tiaRe || !dieuKien(tiaRe)) break;
              }
              const rg = (rr + r2 - 1) / 2;
              con.x = Math.round(cx + rg * Math.cos(a)); con.y = Math.round(cy + rg * Math.sin(a)); doTiaTaiCon();
              return [con.x, con.y];
            }
          }
        }
        return null;
      };
      if (thu === 'roi') {
        const R0 = Number(thamThu.get('thuR')) || 4.64;
        may.R = R0; may.A = Number(thamThu.get('thuA')) || 2.4; thaMay();
        may.T = Number(thamThu.get('thuT')) || 0;
      } else if (thu === 'be180' || thu === 'g1') {
        const p = tim(thu === 'be180' ? (t) => t.thoat && !t.dia && t.be > 181 : (t) => t.dia && Math.abs(t.dia.g - 1) < 0.01);
        if (p) { diToi(p[0] - 6, p[1] - 4); diToi(p[0], p[1]); con.x = p[0]; con.y = p[1]; }
      } else if (thu === 'bong90') {
        app.bayToi([0, 3 * Math.sin(0.2), 3 * Math.cos(0.2)], [0, 0, 0], 0);
      } else if (thu === 'keo') {
        datTayTheoGoc();
        const v = tayMay.viTri.clone().project(camera);
        const x = rect.left + ((v.x + 1) / 2) * rect.width, y = rect.top + ((1 - v.y) / 2) * rect.height;
        diToi(x - 20, y + 5); diToi(x, y);
      }
    }

    const mw = new THREE.Matrix4();
    function capNhat(dt, dtThuc) {
      doNetTuDong(dtThuc);
      U.uT.value += dt * tocDo;
      camera.updateMatrixWorld();
      mw.copy(camera.matrixWorld);
      U.uCam.value.copy(camera.position);
      // Nhìn gần chính diện (bước 7, như ta nhìn M87*), bên khí lao tới chỉ sáng hơn bên kia chừng 2 lần (đúng g⁴ ở góc 17°),
      // nhỏ hơn độ chênh của vân khí và gần như không nhận ra. Ở góc nhìn này làm mịn vân, hạ phơi sáng và phóng đại độ chênh (minh hoạ).
      const kTren = THREE.MathUtils.smoothstep(Math.abs(camera.position.y) / Math.max(1e-6, camera.position.length()), 0.6, 0.9);
      U.uSangDia.value = 1 - (1 - K_SANG_DIA) * kTren;
      U.uMin.value = K_MIN * kTren;
      U.uMuThem.value = K_MU_THEM * kTren;   // độ sáng theo g¹⁰ thay cho g⁴: chênh lệch hai bên được phóng đại, lời giảng bước 7 có ghi chú
      U.uPhai.value.setFromMatrixColumn(mw, 0);
      U.uLen.value.setFromMatrixColumn(mw, 1);
      U.uTruoc.value.setFromMatrixColumn(mw, 2).negate();
      if (nhinRa) { U.uTruoc.value.negate(); U.uPhai.value.negate(); }
      // chia cho camera.zoom: màn hình hẹp khai mayAnh.hep thì khung thu nhỏ cả cảnh, tia nhìn tự tính ở đây cũng thu theo
      U.uTanNua.value = Math.tan((camera.fov * Math.PI) / 360) / camera.zoom;
      U.uTiSo.value = app.rong / app.cao;
      U.uLech.value.set((2 * app.lech[0]) / app.rong, (-2 * app.lech[1]) / app.cao);
      const r = camera.position.length();
      U.uVong.value = vong && !nhinRa ? 1 : 0;
      U.uBong.value = gocBong(r);
      U.uChanTroi.value = Math.asin(Math.min(1, 1 / r));
      U.uDiemAnh.value = (2 * U.uTanNua.value) / app.cao;
      if (thu) chayThu(dtThuc);
      capNhatMay(dt);
      doTiaTaiCon();
      capNhatTiengDia(dt);
    }

    function hud() {
      const r = camera.position.length();
      const rs = loDen.m * RS_MAT_TROI_M;                 // mét
      const nhip = nhipDongHo(r);
      const bong = (2 * gocBong(r) * 180) / Math.PI;
      // gia tốc kéo giãn giữa đầu và chân (người cao 2 m, nằm dọc theo phương rơi): 2GM·d/r³ = c²·rs·d/r³
      const keo = (C * C * 2) / (rs * rs * r * r * r);
      const g = keo / 9.81;
      const keoChu = g >= 100 ? chuCanh("canh.lan-trong-luc-trai-dat", "{0} lần trọng lực Trái Đất", [soNghia(g, 2)]) : g >= 0.01 ? `${soNghia(g, 2)} g` : chuCanh("canh.g-khong-cam-thay-gi", "{0} g (không cảm thấy gì)", [soNghia(g, 2)]);
      // Ô số liệu tối đa 5 dòng, mỗi dòng dưới 60 ký tự; dòng đầu là con số chính của bước.
      const dongCach = [chuCanh("canh.ban-cach-tam", "Bạn cách tâm"), chuCanh("canh.ban-kinh-chan-troi", "{0} rs = {1} ({2})", [so(r, 2), doDai(r * rs), loDen.ten])];
      const dongDongHo = [chuCanh("canh.dong-ho-cua-ban", "Đồng hồ của bạn"), r > 1.0005 ? chuCanh("canh.chay-bang-dong-ho-o-xa", "chạy bằng {0}% đồng hồ ở xa", [so(nhip * 100, 1)]) : chuCanh("canh.gan-nhu-dung-lai-so-voi-o-xa", "gần như đứng lại so với ở xa")];
      const dongBong = [chuCanh("canh.bong-den-chiem", "Bóng đen chiếm"), chuCanh("canh.tren-bau-troi", "{0}° trên bầu trời", [so(Math.min(360, bong), 1)])];
      const dongKeo = [chuCanh("canh.luc-keo-gian-co-the", "Lực kéo giãn cơ thể"), keoChu];
      // Máy phát đang rơi (bước chân trời): ô số liệu dành cho máy phát, kèm khoảng cách của bạn
      if (may.bat && may.trangThai === 'roi') {
        const L = may.lich;
        const truoc = may.T < L.bang[0].T;
        const dong = [[chuCanh("canh.ban-dang-thay-no", "Đang thấy nó"), truoc ? chuCanh("canh.van-treo-o-rs-tin-hieu-dau-tien", "vẫn ở {0} rs: tín hiệu đầu còn đang bay tới", [so(may.R, 2)]) : may.gThay < 0.003 ? chuCanh("canh.khong-con-thay-gi-anh-sang-da-do", "không còn thấy: ánh sáng đã đỏ và mờ hết") : chuCanh("canh.o-r-rs-luc-dong-ho-cua-no", "ở r = {0} rs, đồng hồ của nó chỉ τ = {1}", [so(may.rThay, may.rThay < 1.1 ? 4 : 2), so(may.tauThay, 2)])]];
        dong.push([chuCanh("canh.may-phat-dong-ho-cua-no", "Máy phát"), chuCanh("canh.tha-o-rs-qua-chan-troi-luc-toi", "thả ở {0} rs · τ chân trời {1} · τ kỳ dị {2}", [so(may.R, 2), so(L.roi.tauCT, 1), so(L.roi.tauHet, 1)])]);
        if (!truoc) dong.push([chuCanh("canh.tin-hieu-nhan", "Tín hiệu nhận"), chuCanh("canh.g-hz-nm-tieng-bip", "g = {0} · {1} Hz · {2} nm · bíp {3}/{4}", [so(may.gThay, 3), so(TAN_SO_PHAT * may.gThay, 0), soNghia(BUOC_SONG_MAY / Math.max(1e-9, may.gThay), 3), may.k, L.xung.length])]);
        dong.push([chuCanh("canh.dong-ho-cua-ban-tu-luc-tha", "Đồng hồ của bạn từ lúc thả"), chuCanh("canh.rs-c-1-giay-rs-c", "{0} rs/c (1 giây = {1} rs/c)", [so(may.T, 1), RS_MOI_GIAY])]);
        dong.push(dongCach);
        return dong;
      }
      // Bật hai vòng đo (bước cái bóng): cỡ bóng lên đầu, bỏ dòng đĩa khí (đĩa đang tắt)
      if (vong && !nhinRa) {
        return [dongBong,
          [chuCanh("canh.hai-vong-do", "Hai vòng đo"), chuCanh("canh.mep-bong-rong-chan-troi-neu-anh-sang", "mép bóng {0}° · chân trời nếu đi thẳng {1}°", [so(Math.min(360, bong), 1), so((2 * Math.asin(Math.min(1, 1 / r)) * 180) / Math.PI, 1)])],
          dongCach, dongDongHo, dongKeo];
      }
      const dong = [dongCach, dongDongHo, dongBong, dongKeo];
      if (U.uDia.value > 0.5) dong.push([chuCanh("canh.mot-vong-o-mep-trong-cua-dia", "Một vòng ở mép trong của đĩa"), thoiLuong((46.17 * rs) / C)]);
      return dong;
    }

    // Trạng thái cho các thử thách (gọi từ baiGiang).
    const thuThach = {
      may: () => may.daTha && may.trangThai === 'roi' && Math.abs(tauToiChanTroi(may.R) - TAU_DICH) < 0.75,
      bong90: () => Math.abs((2 * gocBong(camera.position.length()) * 180) / Math.PI - 90) < 3,
      be180: () => !!(tiaRe && tiaRe.thoat && !tiaRe.dia && tiaRe.be > 180),
      g1: () => !!(tiaRe && tiaRe.dia && U.uDoppler.value > 0.5 && Math.abs(tiaRe.dia.g - 1) < 0.02),
    };

    function ra() {
      batMay(false);
      giongDia?.tat(0.2); giongDia = null;
    }
    function huy() {
      ra();
      cv.removeEventListener('pointermove', diChuot);
      cv.removeEventListener('pointerleave', roiChuot);
      anhTroi.dispose();
      canhTroi.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    }

    return { scene, capNhat, hud, cauHinh, thaMay, huyMay, thuThach, ra, huy };
  },
};
