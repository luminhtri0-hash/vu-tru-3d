import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài — Không gian cong quanh một khối lượng (id giữ tên cũ «khong-thoi-gian»).
// Mặt cong ở đây là PHẦN KHÔNG GIAN của độ cong: lát cắt «cùng lúc» (t = hằng số) qua mặt phẳng xích đạo,
// nhúng vào không gian ba chiều tưởng tượng (mặt Flamm bên ngoài, chỏm cầu bên trong ngôi sao đặc đều).
// Cùng một khối lượng, nén càng nhỏ thì lát cắt càng cong. Đơn vị: bán kính vật thể R = 1 (lỗ đen: rs = 1).
//
// Bản 3: thiên thể ở tâm có hình (Trái Đất thật, Mặt Trời, sao đặc phát sáng, lỗ đen); hai cây thước là dải có bề dày,
// vạch tính trong shader theo chiều dài đo bằng thước; kéo hai đầu thước ngay trên mặt; thang «Nén» kéo được trong cảnh;
// tiếng «tích» theo từng vạch thước; mọi thay đổi chuyển dần.

import * as THREE from 'three';
import { so, soNghia } from '../vat-ly/hang-so.js';
import { khoangCachThat, nhungSao, nhipDongHo, nhipDongHoTrongSao } from '../vat-ly/schwarzschild.js';
import { rTheoThuoc, doDacTheoDu, rLoDenTheoTiSo } from '../vat-ly/khong-gian-cong.js';
import { MatCong } from '../khung/mat-cong.js';
import { taoNhan, taoNenSao, duongTron, DuongDay, kep, goNhanDeNhau } from '../khung/ve.js';
import { muiTen } from '../khung/ktg.js';
import { taoTraiDat, taoMatTroi, taoSao, taoLoDenNho } from '../khung/hanh-tinh.js';
import { GLSL_NHIEU } from '../khung/hanh-tinh-glsl.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('khong-thoi-gian', khoa, goc, thamSo);

const R = String.raw;

const R_MAX = 6;
const A_PH = -0.26;      // góc đặt thước «không gian phẳng» (xanh), thước thật nằm ở góc 0
const NANG = 0.035;      // nâng thước khỏi mặt một chút cho khỏi chìm vào lưới
const DO = Math.PI / 180;
const VAT = [
  { id: 'dat', ten: chuCanh("canh.trai-dat", "Trái Đất"), C: 0.00887 / 6.371e6, Rkm: 6371, mau: 0x4f8dff, moTa: chuCanh("canh.ban-kinh-6-371-km", "bán kính 6 371 km") },
  { id: 'mt', ten: chuCanh("canh.mat-troi", "Mặt Trời"), C: 2.953 / 695700, Rkm: 695700, mau: 0xffc65c, moTa: chuCanh("canh.ban-kinh-695-700-km", "bán kính 695 700 km") },
  { id: 'lt', ten: chuCanh("canh.sao-lun-trang", "Sao lùn trắng"), C: 3.012 / 5900, Rkm: 5900, mau: 0xdfeaff, moTa: chuCanh("canh.nhu-sao-sirius-b-nang-co-mat-troi", "như sao Sirius B: nặng cỡ Mặt Trời, to cỡ Trái Đất") },
  { id: 'nt', ten: chuCanh("canh.sao-neutron", "Sao neutron"), C: 4.134 / 12, Rkm: 12, mau: 0x9fe8ff, moTa: chuCanh("canh.nang-1-4-mat-troi-ban-kinh-chi", "nặng 1,4 Mặt Trời, bán kính chỉ 12 km") },
  { id: 'ld', ten: chuCanh("canh.lo-den", "Lỗ đen"), C: 1, Rkm: null, mau: 0x000000, moTa: chuCanh("canh.toan-bo-khoi-luong-nam-trong-chan-troi", "toàn bộ khối lượng nằm trong chân trời sự kiện") },
];
const C_NT = VAT[3].C;
// Đích của các thử thách (tính lại trong kiem-tra/kiem-phan-3-cu.mjs)
const R_X_L2 = rTheoThuoc(1, 2, C_NT);      // sao neutron: thước 2,00 từ bề mặt → r ≈ 2,79
const C_DU10 = doDacTheoDu(0.1);            // độ đặc để đoạn vòng 1 → vòng 2 dư đúng 10% → ≈ 0,249
const R_LD_2 = rLoDenTheoTiSo(2);           // lỗ đen: từ chân trời tới r ≈ 2,45 thì thước dài gấp đôi hiệu bán kính

// Thang «Nén» dựng trong cảnh: trục đứng, độ đặc theo thang log từ 10⁻⁹ (trên) tới 0,86 (dưới); dưới cùng là lỗ đen.
const G_X = -5.7, G_Z = -4.4, G_TREN = 1.9, G_CAO = 3.6;
const LOG0 = Math.log10(1e-9), LOG1 = Math.log10(0.86);
const Y_LD = G_TREN - G_CAO - 0.6;
const yTuC = (c) => G_TREN - (G_CAO * (Math.log10(c) - LOG0)) / (LOG1 - LOG0);
const CtuY = (y) => 10 ** (LOG0 + ((G_TREN - y) / G_CAO) * (LOG1 - LOG0));

function doDaiKm(km) {
  if (km >= 1e6) return chuCanh("canh.trieu-km", "{0} triệu km", [soNghia(km / 1e6, 3)]);
  if (km >= 1) return `${soNghia(km, 3)} km`;
  if (km >= 1e-3) return `${soNghia(km * 1e3, 3)} m`;
  return `${soNghia(km * 1e6, 3)} mm`;
}

// Ghi các vạch rời (mỗi vạch 2 điểm) thẳng vào bộ đệm đoạn của DuongDay.
function ghiVach(duong, soDiem) {
  const a = duong.bo.array;
  for (let k = 0; k < soDiem / 2; k++) for (let q = 0; q < 6; q++) a[k * 6 + q] = duong.diem[k * 6 + q];
  duong.bo.needsUpdate = true;
  duong.geo.instanceCount = soDiem / 2;
}

// ---------------------------------------------------------------------------
// Cây thước có bề dày nằm trên mặt cong. Vạch được vẽ trong shader theo aS (chiều dài tính dọc thước):
// vạch nhỏ mỗi 0,5, vạch lớn mỗi 1, nên vạch luôn đúng chỗ dù mặt cong tới đâu. Hai mép sáng, lòng thước mờ.
// ---------------------------------------------------------------------------
const DINH_THUOC = /* glsl */ `
  attribute float aS; attribute float aV;
  varying float vS; varying float vV;
  void main() { vS = aS; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MANH_THUOC = /* glsl */ `
  uniform vec3 uMau; uniform float uDoMo, uBuoc, uMo;
  varying float vS; varying float vV;
  void main() {
    float f = vS / uBuoc;
    float idx = floor(f + 0.5);
    float w = max(fwidth(f), 1e-5);
    float dpx = abs(f - idx) / w;                       // khoảng cách tới vạch gần nhất, tính bằng điểm ảnh
    float lon = 1.0 - step(0.5, mod(idx, 2.0));         // vạch lớn ở mỗi đơn vị
    float day = mix(0.05, -0.85, lon);                  // vạch mọc từ mép trên xuống
    float vach = (1.0 - smoothstep(0.8, 1.9, dpx)) * smoothstep(day - 0.06, day + 0.06, vV);
    float wv = max(fwidth(vV), 1e-4);
    float mep = 1.0 - smoothstep(0.0, 2.2 * wv, 1.0 - abs(vV));
    // lòng thước sẫm màu (nổi trên mặt kính sáng), hai mép và vạch sáng
    vec3 nen = vec3(0.012, 0.018, 0.035) + uMau * 0.05;
    vec3 c = mix(nen, uMau * 1.25, mep);
    c = mix(c, uMau * mix(1.1, 1.6, lon), vach);
    float a = max(uDoMo, max(mep, vach));
    gl_FragColor = vec4(c * uMo, a * uMo);
  }`;

class ThuocDai {
  constructor(N, mau, { doMo = 0.6, rong = 0.46 } = {}) {
    this.N = N; this.rong = rong;
    this.vt = new Float32Array(N * 6);
    this.s = new Float32Array(N * 2);
    this.rr = new Float32Array(N);
    this.ss = new Float32Array(N);
    const v = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) { v[2 * i] = -1; v[2 * i + 1] = 1; }
    const cs = [];
    for (let i = 0; i < N - 1; i++) { const a = 2 * i; cs.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    this.geo = new THREE.BufferGeometry();
    this.ttVt = new THREE.BufferAttribute(this.vt, 3).setUsage(THREE.DynamicDrawUsage);
    this.ttS = new THREE.BufferAttribute(this.s, 1).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.ttVt);
    this.geo.setAttribute('aS', this.ttS);
    this.geo.setAttribute('aV', new THREE.BufferAttribute(v, 1));
    this.geo.setIndex(cs);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uBuoc: { value: 0.5 }, uMo: { value: 1 } },
      vertexShader: DINH_THUOC, fragmentShader: MANH_THUOC, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.mat.tuyenTinh = true;
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.renderOrder = 2;
  }

  // Đặt thước dọc kinh tuyến «goc» từ bán kính a tới b; hamS(r) là chiều dài tính từ đầu a.
  dung(mc, goc, a, b, hamS, laLoDen) {
    const N = this.N, h = this.rong / 2, ca = Math.cos(goc), sa = Math.sin(goc);
    // tham số u = √(r − c): dày điểm ở chỗ mặt dốc gắt (gần chân trời, gần mép sao)
    const c0 = laLoDen ? 1 : 0;
    const u0 = Math.sqrt(Math.max(0, a - c0)), u1 = Math.sqrt(Math.max(0, b - c0));
    for (let i = 0; i < N; i++) {
      const u = u0 + ((u1 - u0) * i) / (N - 1);
      const r = Math.min(b, c0 + u * u);
      const s = hamS(Math.max(a, r));
      const y = mc.y(Math.hypot(r, h)) + NANG;
      const x0 = r * ca, z0 = r * sa, px = -sa * h, pz = ca * h, k = i * 6;
      this.vt[k] = x0 - px; this.vt[k + 1] = y; this.vt[k + 2] = z0 - pz;
      this.vt[k + 3] = x0 + px; this.vt[k + 4] = y; this.vt[k + 5] = z0 + pz;
      this.s[2 * i] = this.s[2 * i + 1] = s;
      this.rr[i] = r; this.ss[i] = s;
    }
    this.ttVt.needsUpdate = true; this.ttS.needsUpdate = true;
    this.geo.computeBoundingSphere();
  }

  // Bán kính chu vi tại chỗ thước chỉ s (nội suy trên các điểm đã dựng).
  rTaiS(s) {
    const { ss, rr, N } = this;
    if (s <= ss[0]) return rr[0];
    for (let i = 1; i < N; i++) if (ss[i] >= s) { const t = (s - ss[i - 1]) / Math.max(1e-9, ss[i] - ss[i - 1]); return rr[i - 1] + t * (rr[i] - rr[i - 1]); }
    return rr[N - 1];
  }
}

// ---------------------------------------------------------------------------
// Sao đặc (sao lùn trắng, sao neutron), HÌNH MINH HOẠ: quả cầu phát sáng có hạt sôi rất mịn, tối dần ở rìa,
// viền sáng, cộng quầng sáng của taoSao. Bán kính 1.
// ---------------------------------------------------------------------------
function taoSaoDac(mau, sang = 3) {
  const nhom = new THREE.Group();
  const uT = { value: 0 };
  const m = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uSang: { value: sang }, uT },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        vP = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uSang, uT;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      ${GLSL_NHIEU}
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float mu = max(dot(n, v), 0.0);
        float rua = 0.42 + 0.58 * pow(mu, 0.6);                       // tối dần ở rìa
        float hat = 0.82 + 0.18 * nhieuG(vP * 9.0 + vec3(0.0, uT * 0.15, 0.0)) + 0.08 * nhieuG(vP * 26.0 - uT * 0.3);
        float vien = pow(1.0 - mu, 3.0);
        vec3 c = mix(uMau, vec3(1.0), 0.25 * mu) * rua * hat * uSang + uMau * vien * 0.9;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  m.tuyenTinh = true;
  const cau = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), m);
  nhom.add(cau);
  const quang = taoSao({ mau, banKinh: 0.3, doSang: 0.22, tia: 4, doDaiTia: 9 });
  nhom.add(quang.nhom);
  return { nhom, capNhat(dt = 0) { uT.value += dt; quang.capNhat(dt); } };
}

export default {
  id: 'khong-thoi-gian',
  ten: 'Không gian cong quanh một khối lượng',
  moTa: 'Phần không gian của độ cong: mặt Flamm, thước đo dài hơn hiệu bán kính',
  yChinh: 'Quanh một khối lượng, chu vi vòng tròn vẫn là $2\\pi r$, nhưng khoảng cách đo bằng thước giữa hai vòng **dài hơn** hiệu hai bán kính: $\\dd\\ell = \\dd r/\\sqrt{1 - r_s/r}$. Mặt cong trên hình (mặt Flamm) là lát cắt «cùng lúc» qua xích đạo, nhúng vào không gian ba chiều để thấy được phần dư ấy. Nó là phần **không gian** của độ cong; phần thời gian (Bài 9, Bài 10) mới là thứ chính làm vật chậm rơi.',
  mayAnh: { viTri: [0, 6.6, 13.6], dich: [0, -0.7, 0], fov: 42, min: 2.5, max: 40, gocMax: Math.PI * 0.62 },
  giaiThich: R`
    - Mặt cong là **lát cắt «cùng lúc»** ($t$ = hằng số) qua mặt phẳng xích đạo của không gian quanh khối lượng, nhúng vào không gian ba chiều tưởng tượng. Chiều đứng chỉ để vẽ, không có thật.
    - $r$ được định nghĩa qua chu vi: vòng tròn có chu vi $2\pi r$. Nhưng khoảng cách thật theo phương bán kính là $\dd\ell = \dd r/\sqrt{1 - r_s/r}$, dài hơn $\dd r$.
    - Phần dư: Trái Đất 3,1 mm trên 6 371 km; Mặt Trời 1,02 km trên 695 700 km; sao neutron 1,78 km trên 12 km.
    - Bên ngoài là mặt Flamm $z = 2\sqrt{r_s(r - r_s)}$; bên trong ngôi sao đặc đều là chỏm cầu.
    - Không gian cong góp một nửa độ lệch của ánh sáng, nhưng gần như không ảnh hưởng tới vật chậm (cỡ $(v/c)^2$ so với phần thời gian).
    - Hình «tấm cao su có viên bi lăn» gây hiểu nhầm: mặt Flamm không có «phía dưới», không phải cái phễu để vật lăn xuống, và nó bỏ mất phần thời gian.`,

  baiGiang: {
    mucTieu: [
      'Nói được mặt cong trong bài là lát cắt nào của không-thời gian, và chiều nào trên hình không có thật.',
      'Phân biệt được bán kính định nghĩa qua chu vi với khoảng cách đo bằng thước theo phương bán kính.',
      'Tính được khoảng cách thật giữa hai mặt cầu quanh Trái Đất, Mặt Trời, sao neutron.',
      'Giải thích được vì sao không gian cong góp một nửa độ lệch ánh sáng nhưng gần như không ảnh hưởng tới vật chậm.',
      'Chỉ ra được ba chỗ hình «tấm cao su» gây hiểu nhầm.',
    ],
    buoc: [
      {
        ten: 'Mặt cong này là gì: một lát cắt không gian',
        noiDung: R`
          Bài 9 và Bài 10 nói về phần **thời gian** của độ cong: đồng hồ ở thấp chạy chậm, và chính điều đó làm vật rơi. Bài này nói về phần còn lại: hình dạng của **không gian** quanh một khối lượng.

          Mặt lưới bạn đang thấy được dựng như sau:

          1. Lấy không-thời gian bốn chiều quanh một ngôi sao.
          2. Chọn **một thời điểm** $t$ của người ở rất xa: một lát cắt «cùng lúc», như tấm «bây giờ» ở Bài 4. Còn lại không gian ba chiều.
          3. Chỉ giữ **mặt phẳng xích đạo** đi qua tâm sao. Còn lại một mặt hai chiều.

          Mặt hai chiều ấy cong. Muốn thấy độ cong, ta «nhúng» nó vào một không gian ba chiều tưởng tượng, để khoảng cách đo dọc theo mặt đúng bằng khoảng cách thật. Phần màu ở giữa là vật chất của ngôi sao; vòng trắng là bề mặt sao.

          > [Lưu ý] Hình đã bỏ chiều thời gian và một chiều không gian. **Chiều đứng (mũi tên tím) chỉ để vẽ**, không phải một chiều thật của vũ trụ. Thứ có thật là khoảng cách đo dọc theo mặt.

          > [Thử ngay] Quả cầu ở giữa là ngôi sao vẽ ba chiều cho dễ nhận ra; trên lát cắt, chính ngôi sao là phần màu, và xích đạo của quả cầu nằm đúng vòng trắng. Rê chuột lên quả cầu để xem số liệu của nó.
          > [[Nhìn ngang|ngang]] [[Nhìn từ trên xuống|tren]] [[Toàn cảnh|tong]]`,
        vao: (c) => { c.cauHinh({ vat: 'nt', phongDai: true, toMau: false, mayAnh: 'tong', tay: false, thuoc: [1, 5], cau: true }); },
        nut: { ngang: (c) => c.goc('ngang'), tren: (c) => c.goc('tren'), tong: (c) => c.goc('tong') },
      },
      {
        ten: 'Chu vi vẫn là 2πr',
        noiDung: R`
          Nhìn từ trên xuống, lưới chỉ là những vòng tròn đồng tâm bình thường. Đó là điều một sinh vật hai chiều sống trên mặt này thấy khi đi vòng quanh ngôi sao: các vòng tròn có chu vi
          $2\pi \times 1$, $2\pi \times 2$, …, $2\pi \times 6$ (đơn vị là bán kính sao).

          Quanh một khối lượng, người ta **định nghĩa** $r$ của một vòng tròn bằng cách đo chu vi rồi chia cho $2\pi$. Cách này đo được từ bên ngoài: chỉ cần căng một sợi dây quanh ngôi sao. Ta không thể thò thước vào tâm của một ngôi sao, càng không thể với lỗ đen. Đại lượng $r$ này đôi khi gọi là {{bán kính chu vi}}; nó chính là $r$ trong công thức nhịp đồng hồ ở Bài 9.

          Trong không gian phẳng, hai vòng có chu vi $2\pi \times 1$ và $2\pi \times 2$ phải cách nhau đúng **1 đơn vị**. Câu hỏi của bài: quanh một khối lượng, có đúng vậy không?

          > [Thử ngay] Nhìn ngang để thấy các vòng ấy thật ra nằm ở những độ cao khác nhau trên một mặt cong.
          > [[Nhìn từ trên xuống|tren]] [[Nhìn ngang|ngang]] [[Toàn cảnh|tong]]`,
        vao: (c) => { c.cauHinh({ vat: 'nt', phongDai: true, toMau: false, mayAnh: 'tren', tay: false, thuoc: [1, 5], cau: true }); },
        nut: { tren: (c) => c.goc('tren'), ngang: (c) => c.goc('ngang'), tong: (c) => c.goc('tong') },
      },
      {
        ten: 'Thước đo dài hơn hiệu hai bán kính',
        noiDung: R`
          Không đúng. Cây thước **trắng** nằm dọc theo mặt, mỗi vạch cách nhau 0,5 đơn vị đo bằng thước. Cây thước **xanh** bên cạnh đánh dấu chỗ các vạch sẽ nằm nếu không gian phẳng (cách nhau 0,5 theo hiệu bán kính). Vạch trắng tụt lại sau vạch xanh: giữa hai vòng tròn có **nhiều thước hơn** hiệu bán kính.

          Với sao neutron trên hình, từ bề mặt (vòng 1) tới vòng 2, thước đo được **1,148 đơn vị** thay vì 1: dư gần 15%. Quy tắc chung cho một đoạn ngắn theo phương bán kính:

          $$ \dd\ell = \frac{\dd r}{\sqrt{1 - r_s/r}} $$

          - $\dd r$: hiệu hai «bán kính chu vi»;
          - $\dd\ell$: {{khoảng cách riêng}}, đo bằng thước đứng yên tại chỗ.

          Càng gần khối lượng, thừa số $1/\sqrt{1 - r_s/r}$ càng lớn: ở mặt sao neutron là 1,235; ở $r = 2\,r_s$ quanh lỗ đen là 1,414. Đó là lý do mặt lưới phải dốc dần về phía tâm: phần dốc chứa phần chiều dài dư.

          > [Thử ngay] Kéo hai đốm trắng ở hai đầu thước, ngay trên mặt cong: nhãn ở đầu thước ghi chiều dài đo bằng thước $\ell$ và hiệu bán kính $\Delta r$. Mỗi lần thước trắng đi qua một vạch có một tiếng «tích» cao, thước xanh một tiếng «tích» trầm. Kéo đầu ngoài ra từ sát ngôi sao: tiếng cao dày hơn tiếng trầm, đó là phần chiều dài dư (tiếng chỉ để minh hoạ, không phải âm thanh có thật).
          > [[Sao neutron|nt]] [[Nén mạnh hơn (rs/R = 0,6)|nen6]] [[Lỗ đen|ld]] [[Nhìn gần thước|gan]]

          +++ Đi sâu: lấy công thức từ metric Schwarzschild
          Metric Schwarzschild (Bài 9) là

          $$ \dd s^2 = -\left(1 - \frac{r_s}{r}\right)c^2\dd t^2 + \frac{\dd r^2}{1 - r_s/r} + r^2\left(\dd\theta^2 + \sin^2\theta\,\dd\phi^2\right). $$

          Lát cắt «cùng lúc» có $\dd t = 0$; mặt phẳng xích đạo có $\theta = 90°$, $\dd\theta = 0$. Còn lại hình học của một mặt hai chiều:

          $$ \dd\ell^2 = \frac{\dd r^2}{1 - r_s/r} + r^2\,\dd\phi^2. $$

          - Đi vòng ($\dd r = 0$): $\dd\ell = r\,\dd\phi$, nên chu vi là $2\pi r$, đúng như định nghĩa.
          - Đi theo bán kính ($\dd\phi = 0$): $\dd\ell = \dd r/\sqrt{1 - r_s/r}$.

          Lấy tích phân từ $r_1$ tới $r_2$ (cả hai ở ngoài khối lượng):

          $$ \ell = \Big[\sqrt{r(r - r_s)} + r_s \ln\!\left(\sqrt{r} + \sqrt{r - r_s}\right)\Big]_{r_1}^{r_2}. $$

          Mô hình dùng đúng công thức này cho bảng số liệu, và đặt từng vạch thước bằng cách cộng dần $\dd\ell$ theo từng bước rất nhỏ.
          +++`,
        vao: (c) => { c.cauHinh({ vat: 'nt', phongDai: true, toMau: false, mayAnh: 'tong', tay: true, thuoc: [1, 5], cau: true }); c.thu('b3'); },
        nut: {
          nt: (c) => c.cauHinh({ vat: 'nt' }), nen6: (c) => c.cauHinh({ C: 0.6 }), ld: (c) => c.cauHinh({ vat: 'ld' }),
          gan: (c) => c.goc('gan'),
        },
        thuThach: {
          de: R`Với **sao neutron**, đặt đầu trong của thước sát bề mặt (vòng trắng) rồi kéo đầu ngoài sao cho thước đo được đúng **2,00 đơn vị** (sai lệch 0,03). Nhìn nhãn ở đầu thước: hiệu bán kính lúc ấy là bao nhiêu?`,
          kiem: (c) => { const t = c.trangThai(); return !t.laLoDen && Math.abs(t.C - C_NT) < 0.01 && t.a < 1.03 && Math.abs(t.l - 2) <= 0.03; },
          giu: 0.6,
          goiY: R`Đầu trong tự bắt dính vào vòng trắng khi kéo lại gần. Lúc thước chỉ 2,00 thì hiệu bán kính chỉ khoảng 1,79: hơn 0,2 đơn vị chiều dài nằm trong phần mặt dốc gần ngôi sao.`,
        },
      },
      {
        ten: 'Thay số: Trái Đất, Mặt Trời, sao neutron',
        noiDung: R`
          Chọn từng vật thể ở bảng điều khiển hoặc bấm nút dưới đây. Ô số liệu góc dưới trái ghi phần dư thật. Với vật thể bình thường, phần dư nhỏ đến mức tấm lưới gần như phẳng lì, nên mô hình **phóng đại độ trũng** (ô số liệu ghi bao nhiêu lần).

          | Đo theo bán kính | Hiệu bán kính | Thước dài hơn |
          |---|---|---|
          | Trái Đất: từ mặt đất lên $r = 2R$ | 6 371 km | 3,1 mm |
          | Mặt Trời: từ bề mặt lên $r = 2R$ | 695 700 km | 1,02 km |
          | Từ bề mặt Mặt Trời tới quỹ đạo Trái Đất | 149,6 triệu km | 7,9 km |
          | Sao neutron: từ bề mặt lên $r = 2R$ | 12 km | 1,78 km |
          | Lỗ đen: từ chân trời lên $r = 2\,r_s$ | $r_s$ | thêm 1,30 $r_s$ |

          Khi trường yếu ($r_s \ll r$), phần dư có một công thức gọn:

          $$ \Delta\ell - (r_2 - r_1) \approx \frac{r_s}{2}\ln\frac{r_2}{r_1}. $$

          Với Trái Đất $r_s = 8{,}87$ mm, $r_2/r_1 = 2$: phần dư $\approx 4{,}43\ \text{mm} \times 0{,}693 \approx 3{,}1$ mm.

          > [Con số] Độ cong không gian quanh Mặt Trời làm quãng đường thật từ bề mặt Mặt Trời tới quỹ đạo Trái Đất dài hơn hiệu bán kính khoảng 7,9 km, trên tổng số 149,6 triệu km: chừng năm phần trăm triệu.

          > [Thử ngay] Kéo đốm hồng trên thang «Nén» bên trái cảnh: lên trên là vật thể loãng (Trái Đất), xuống dưới là đặc (sao neutron), tận cùng là lỗ đen. Đi qua mỗi vật thể có một tiếng chuông, càng đặc càng trầm.
          > [[Trái Đất|dat]] [[Mặt Trời|mt]] [[Sao neutron|nt]] [[Lỗ đen|ld]]

          +++ Đi sâu: công thức trường yếu
          Khi $r_s/r$ nhỏ, $1/\sqrt{1 - x} \approx 1 + x/2$, nên

          $$ \dd\ell \approx \left(1 + \frac{r_s}{2r}\right)\dd r \ \Rightarrow\ \ell \approx (r_2 - r_1) + \frac{r_s}{2}\ln\frac{r_2}{r_1}. $$

          Với Mặt Trời ($r_s = 2{,}95$ km) đi từ bề mặt ($695\,700$ km) tới 1 AU: $\ln(149{,}6 \times 10^6 / 695\,700) \approx 5{,}37$, phần dư $\approx 1{,}48\ \text{km} \times 5{,}37 \approx 7{,}9$ km.
          +++`,
        vao: (c) => { c.cauHinh({ vat: 'mt', phongDai: true, toMau: false, mayAnh: 'tong', tay: true, thuoc: [1, 5], cau: true }); c.thu('b4'); },
        nut: { dat: (c) => c.cauHinh({ vat: 'dat' }), mt: (c) => c.cauHinh({ vat: 'mt' }), nt: (c) => c.cauHinh({ vat: 'nt' }), ld: (c) => c.cauHinh({ vat: 'ld' }) },
        thuThach: {
          de: R`Kéo thang «Nén» (hoặc thanh trượt) tới độ đặc mà từ bề mặt lên vòng 2, thước dài hơn hiệu bán kính đúng **10%** (ô số liệu «Từ vòng 1 tới vòng 2» chỉ 1,100, sai lệch 0,005).`,
          kiem: (c) => { const t = c.trangThai(); return !t.laLoDen && Math.abs(khoangCachThat(1, 2, t.C) - 1.1) <= 0.005; },
          giu: 0.6,
          goiY: R`Phần dư nằm giữa Mặt Trời (gần như 0) và sao neutron (14,8%). Độ đặc cần tìm khoảng 0,25: một ngôi sao chỉ to gấp 4 lần bán kính Schwarzschild của nó.`,
        },
      },
      {
        ten: 'Mặt Flamm: hình dạng thật của lát cắt',
        noiDung: R`
          Mặt nhúng nào chứa đúng phần chiều dài dư ấy? Năm 1916, ngay sau khi Schwarzschild tìm ra nghiệm của mình, Ludwig Flamm tính được câu trả lời: bên ngoài khối lượng, mặt nhúng có độ cao

          $$ z(r) = 2\sqrt{r_s\,(r - r_s)}. $$

          Đó là một **paraboloid** nằm ngang ({{mặt Flamm}}). Gần khối lượng nó dốc, ra xa nó thoải dần nhưng không bao giờ phẳng hẳn: độ dốc giảm theo $\sqrt{r_s/r}$.

          Với lỗ đen, mặt Flamm đi xuống tới tận $r = r_s$, nơi nó **dựng đứng**: đó là chỗ thắt (họng) ở chân trời sự kiện. Từ chân trời ra tới vòng có chu vi $2\pi \times 2\,r_s$, thước đo được 2,30 $r_s$ chứ không phải 1.

          > [Lưu ý] Với lỗ đen, hình chỉ vẽ phần bên ngoài chân trời. Lát cắt «cùng lúc» theo đồng hồ ở xa không đi vào bên trong chân trời được; Bài 16 dùng cách vẽ khác cho vùng ấy.

          > [Thử ngay] Kéo hai đầu thước trên mặt Flamm của lỗ đen. Đặt đầu trong sát chân trời: đoạn đầu tiên dốc đứng, thước chỉ tăng vọt trong khi hiệu bán kính gần như đứng yên.
          > [[Lỗ đen, nhìn ngang|ldNgang]] [[Sao neutron|nt]] [[Toàn cảnh|tong]]

          +++ Đi sâu: suy ra mặt Flamm
          Đặt một mặt tròn xoay $z(r)$ trong không gian phẳng ba chiều với tọa độ trụ $(r;\ \phi;\ z)$. Khoảng cách trên mặt:

          $$ \dd\ell^2 = \dd r^2 + \dd z^2 + r^2\dd\phi^2 = \left(1 + z'^2\right)\dd r^2 + r^2\dd\phi^2. $$

          Muốn khớp với lát cắt Schwarzschild $\dd\ell^2 = \dd r^2/(1 - r_s/r) + r^2\dd\phi^2$, cần

          $$ 1 + z'^2 = \frac{1}{1 - r_s/r} \ \Rightarrow\ z'^2 = \frac{r_s}{r - r_s} \ \Rightarrow\ z' = \sqrt{\frac{r_s}{r - r_s}}. $$

          Tích phân: $z = 2\sqrt{r_s(r - r_s)}$, tức $r = r_s + z^2/(4r_s)$: một parabol quay quanh trục đứng. Ví dụ $z(2\,r_s) = 2\,r_s$, $z(5\,r_s) = 4\,r_s$. Phần chiều dài dư nằm hết ở độ dốc $z'$; phần xa tâm thoải nên gần như không dư.
          +++`,
        vao: (c) => { c.cauHinh({ vat: 'ld', phongDai: true, toMau: false, mayAnh: 'tong', tay: true, thuoc: [1, 5], cau: true }); c.thu('b5'); },
        nut: { ldNgang: (c) => c.cauHinh({ vat: 'ld', mayAnh: 'ngang' }), nt: (c) => c.cauHinh({ vat: 'nt' }), tong: (c) => c.goc('tong') },
        thuThach: {
          de: R`Với **lỗ đen**, kéo hai đầu thước sao cho thước dài **gấp đôi** hiệu bán kính: $\ell / \Delta r = 2{,}00$ (sai lệch 0,05), với $\Delta r$ ít nhất 1 $r_s$.`,
          kiem: (c) => { const t = c.trangThai(); return t.laLoDen && t.b - t.a >= 1 && Math.abs(t.l / (t.b - t.a) - 2) <= 0.05; },
          giu: 0.6,
          goiY: R`Đặt đầu trong sát chân trời: phần dư dồn cả ở đoạn dốc đứng gần đó. Từ chân trời ra tới $r = 2\,r_s$ tỉ số là 2,30; ra tới $r = 5\,r_s$ chỉ còn 1,48. Đích nằm ở khoảng $r \approx 2{,}45\,r_s$.`,
        },
      },
      {
        ten: 'Bên trong ngôi sao: chỏm cầu',
        noiDung: R`
          Mặt Flamm chỉ đúng bên ngoài khối lượng. Bên trong ngôi sao, càng vào sâu thì phần khối lượng nằm bên trong vòng tròn càng ít, nên độ cong khác đi. Với một ngôi sao có **mật độ đều** (một mô hình đơn giản mà Schwarzschild cũng giải năm 1916), lát cắt bên trong là một **chỏm cầu** bán kính

          $$ A = \sqrt{\frac{R^3}{r_s}}, $$

          nối trơn với mặt Flamm ở bề mặt sao. Phần màu trên hình là chỏm cầu đó. Với sao neutron trên hình, $A \approx 1{,}70\,R$.

          Kéo thanh **Nén vật thể** sang phải: cùng một khối lượng bị ép vào bán kính nhỏ dần, chỏm cầu sâu dần. Có một giới hạn: khi $r_s/R$ vượt $8/9$ (tức $R < \tfrac98 r_s$), không ngôi sao tĩnh nào đứng vững được, vì áp suất ở tâm phải lớn vô hạn mới chống nổi sức nén. Ngôi sao ấy phải sụp thành lỗ đen. Thanh trượt vì thế dừng ở 0,86.

          > [Thử ngay] Kéo đốm hồng trên thang «Nén» xuống dần và nhìn ngang: chỏm cầu sâu dần, mép sao dốc dần. Ô số liệu ghi độ dốc ở mép sao.
          > [[Sao lùn trắng|lt]] [[Sao neutron|nt]] [[Nén sát giới hạn (0,86)|max]] [[Nhìn ngang|ngang]]

          > [Lưu ý] Sao neutron thật không có mật độ đều; chỏm cầu ở đây là mô hình minh hoạ. Phần bên ngoài (mặt Flamm) thì đúng cho mọi ngôi sao cầu không quay.`,
        vao: (c) => { c.cauHinh({ vat: 'nt', phongDai: true, toMau: false, mayAnh: 'ngang', tay: true, thuoc: [1, 5], cau: false }); c.thu('b6'); },
        nut: { lt: (c) => c.cauHinh({ vat: 'lt' }), nt: (c) => c.cauHinh({ vat: 'nt' }), max: (c) => c.cauHinh({ C: 0.86 }), ngang: (c) => c.goc('ngang') },
        thuThach: {
          de: R`Nén ngôi sao cho tới khi mặt cong ở mép sao dốc đúng **45°** (sai lệch khoảng 1°). Khi ấy, ngay tại bề mặt, thước dài gấp $\sqrt2 \approx 1{,}414$ lần hiệu bán kính.`,
          kiem: (c) => { const t = c.trangThai(); return !t.laLoDen && Math.abs(t.C - 0.5) <= 0.02; },
          giu: 0.6,
          goiY: R`Độ dốc ở mép là $\tan\theta = \sqrt{C/(1 - C)}$ với $C = r_s/R$. Dốc 45° nghĩa là $\tan\theta = 1$, tức $C = 0{,}5$: bán kính ngôi sao bằng đúng hai lần bán kính Schwarzschild.`,
        },
      },
      {
        ten: 'Không gian cong tác động tới ai?',
        noiDung: R`
          Bước này tô thêm màu theo nhịp đồng hồ (đã phóng đại cho dễ thấy; vàng là chỗ đồng hồ chậm hẳn): đó là phần **thời gian** của Bài 9, nằm chồng lên phần **không gian** của bài này. Cả hai đều cỡ $r_s/r$. Vậy sao Bài 9 nói vật rơi chủ yếu vì thời gian?

          Vì một vật chậm đi rất ít trong không gian so với trong thời gian. Trong một giây, Trái Đất đi 29,8 km trên quỹ đạo, nhưng «đi» 299 792 km dọc trục thời gian ($c \times 1$ giây). Độ cong của thời gian tác động lên phần đi dọc thời gian; độ cong của không gian chỉ tác động lên phần đi trong không gian. Tỉ lệ đóng góp của không gian so với thời gian vào cỡ $(v/c)^2$:

          - Trái Đất quanh Mặt Trời: $(v/c)^2 \approx 10^{-8}$;
          - vệ tinh GPS: $1{,}7 \times 10^{-10}$.

          **Ánh sáng** thì khác: nó đi trong không gian nhiều đúng bằng trong thời gian ($v = c$). Hai phần góp ngang nhau, nên ánh sáng lệch **gấp đôi** con số chỉ tính phần thời gian. Đó đúng là chỗ Einstein năm 1911 chỉ tính được một nửa (khoảng 0,83 giây cung theo số liệu của ông, 0,87 theo số liệu ngày nay) cho tia sáng sát Mặt Trời (bằng lập luận buồng kín của Bài 7, chỉ thấy phần thời gian), còn năm 1915 tính lại được 1,75 giây cung. Bài 14 kể chuyện đo nó.

          [[Tô màu theo nhịp đồng hồ|mau]] [[Bỏ màu|khongMau]]

          +++ Đi sâu: so hai phần trong metric trường yếu
          Ở trường yếu, viết trong một hệ tọa độ thuận tiện (Hartle, chương 6), metric quanh khối lượng có dạng

          $$ \dd s^2 = -\left(1 + \frac{2\Phi}{c^2}\right)c^2\dd t^2 + \left(1 - \frac{2\Phi}{c^2}\right)\left(\dd x^2 + \dd y^2 + \dd z^2\right), \qquad \Phi = -\frac{GM}{r}. $$

          Hai chỗ lệch khỏi phẳng có cùng độ lớn $2|\Phi|/c^2$. Với một vật đi quãng $\dd x = v\,\dd t$:

          - phần thời gian lệch $\dfrac{2|\Phi|}{c^2} \cdot c^2\dd t^2$;
          - phần không gian lệch $\dfrac{2|\Phi|}{c^2} \cdot v^2\dd t^2$.

          Tỉ số đúng bằng $v^2/c^2$. Với vật chậm chỉ cần giữ phần thời gian, và ta được lại toàn bộ cơ học Newton (Bài 9, bước cuối). Với ánh sáng $v = c$, phần không gian góp đúng bằng phần thời gian. Góc lệch sát mép Mặt Trời: chỉ phần thời gian cho $r_s/R \approx 0{,}875''$, cả hai phần cho $2r_s/R \approx 1{,}75''$.
          +++`,
        vao: (c) => { c.cauHinh({ vat: 'nt', phongDai: true, toMau: true, mayAnh: 'tong', tay: true, thuoc: [1, 5], cau: true }); },
        nut: { mau: (c) => c.cauHinh({ toMau: true }), khongMau: (c) => c.cauHinh({ toMau: false }) },
      },
      {
        ten: 'Gỡ hiểu sai: tấm cao su và viên bi',
        noiDung: R`
          Hình quen thuộc trên sách báo: một quả bóng nặng đè lõm tấm cao su, viên bi nhỏ lăn vòng rồi rơi vào chỗ trũng. Mặt cong của bài này trông giống thế, nhưng khác ở ba chỗ quan trọng.

          1. **Dùng hấp dẫn để giải thích hấp dẫn.** Viên bi lăn xuống chỗ trũng vì Trái Đất kéo nó xuống. Bỏ trọng lực của Trái Đất đi thì tấm cao su lõm đến đâu viên bi cũng không lăn.
          2. **Không có «phía dưới».** Chiều đứng của mặt Flamm chỉ để vẽ. Một sinh vật sống trên mặt chỉ đo được khoảng cách dọc theo mặt; không có hướng nào để «lăn xuống». Đặt một viên bi đứng yên trên mặt này, phần không gian cong không cho nó lý do gì để chuyển động.
          3. **Bỏ mất phần thời gian.** Viên bi thật đứng yên rồi rơi là do thời gian trôi chậm hơn ở gần khối lượng (Bài 9, Bài 10). Đó là phần chính của hấp dẫn với mọi vật chậm, và tấm cao su không có nó.

          > [Hiểu sai thường gặp] «Hành tinh quay quanh Mặt Trời như viên bi lăn quanh miệng phễu.» Với Trái Đất, phần không gian cong chỉ góp cỡ $10^{-8}$ so với phần thời gian. Quỹ đạo gần như hoàn toàn do thời gian cong.

          > [Tóm lại] Độ cong quanh một khối lượng có hai phần: thời gian (đồng hồ chậm ở gần) và không gian (thước dài hơn hiệu bán kính). Vật chậm gần như chỉ cảm nhận phần thời gian; ánh sáng cảm nhận cả hai như nhau. Bài 12 gom cả hai thành độ cong của không-thời gian bốn chiều và phương trình Einstein.

          [[Nhìn ngang|ngang]] [[Bật màu thời gian|mau]] [[Toàn cảnh|tong]]`,
        vao: (c) => { c.cauHinh({ vat: 'nt', phongDai: true, toMau: false, mayAnh: 'ngang', tay: true, thuoc: [1, 5], cau: false }); },
        nut: { ngang: (c) => c.goc('ngang'), mau: (c) => c.cauHinh({ toMau: true }), tong: (c) => c.goc('tong') },
      },
    ],
    congThuc: [
      { ten: 'Khoảng cách riêng theo phương bán kính', tex: R`\dd\ell = \frac{\dd r}{\sqrt{1 - r_s/r}}`, y: '$r$ định nghĩa qua chu vi $2\\pi r$. Ở $r = 2\\,r_s$ thước dài gấp 1,414 lần $\\dd r$.' },
      { ten: 'Hình học của lát cắt xích đạo', tex: R`\dd\ell^2 = \frac{\dd r^2}{1 - r_s/r} + r^2\,\dd\phi^2`, y: 'Lấy từ metric Schwarzschild với $\\dd t = 0$, $\\theta = 90°$.' },
      { ten: 'Mặt Flamm (bên ngoài khối lượng)', tex: R`z(r) = 2\sqrt{r_s\,(r - r_s)}`, y: '$z$ là chiều phụ chỉ để vẽ. Bên trong sao đặc đều: chỏm cầu bán kính $\\sqrt{R^3/r_s}$.' },
      { ten: 'Phần dư khi trường yếu', tex: R`\ell - (r_2 - r_1) \approx \frac{r_s}{2}\ln\frac{r_2}{r_1}`, y: 'Trái Đất, từ mặt đất lên $2R$: 3,1 mm.' },
      { ten: 'Metric trường yếu', tex: R`\dd s^2 = -\left(1 + \tfrac{2\Phi}{c^2}\right)c^2\dd t^2 + \left(1 - \tfrac{2\Phi}{c^2}\right)\dd\vec x^{\,2}`, y: 'Phần không gian góp cỡ $(v/c)^2$ so với phần thời gian: không đáng kể với vật chậm, ngang bằng với ánh sáng.' },
    ],
    cauHoi: [
      {
        hoi: R`Người ta căng một sợi dây quanh Mặt Trời ở xa bề mặt và đo được chu vi $2\pi \times 10^6$ km. Đại lượng $r$ trong các công thức của bài ở chỗ đó bằng bao nhiêu?`,
        chon: ['Đúng $10^6$ km, vì $r$ được định nghĩa qua chu vi', 'Lớn hơn $10^6$ km một chút, vì không gian cong', 'Nhỏ hơn $10^6$ km một chút', 'Không biết được nếu không đo từ tâm'],
        dung: 0,
        giai: 'Đó chính là định nghĩa của $r$ (bán kính chu vi). Cái lệch khỏi hình học phẳng là khoảng cách đo theo phương bán kính, không phải chu vi.',
      },
      {
        hoi: 'Quanh một sao neutron bán kính 12 km, đo bằng thước từ bề mặt ra tới vòng tròn có chu vi $2\\pi \\times 24$ km. Thước chỉ khoảng bao nhiêu?',
        chon: ['12 km', '13,8 km', '10,2 km', '24 km'],
        dung: 1,
        giai: 'Hiệu bán kính là 12 km, cộng phần dư 1,78 km (khoảng 14,8%). Thước luôn dài hơn, không bao giờ ngắn hơn, hiệu bán kính.',
      },
      {
        hoi: 'Chiều thẳng đứng của mặt Flamm trên hình là gì?',
        chon: ['Chiều thời gian', 'Chiều thứ ba của không gian (chiều cao thật)', 'Một chiều phụ chỉ để vẽ cho thấy độ cong; không có thật', 'Hướng mà vật bị kéo xuống'],
        dung: 2,
        giai: 'Mặt hai chiều được nhúng vào không gian ba chiều tưởng tượng để mắt thấy được phần chiều dài dư. Chỉ khoảng cách đo dọc theo mặt là có thật. Chọn «hướng vật bị kéo xuống» là đúng cái bẫy của hình tấm cao su.',
      },
      {
        hoi: 'Vì sao độ cong của không gian hầu như không ảnh hưởng tới quỹ đạo của Trái Đất quanh Mặt Trời?',
        chon: ['Vì quanh Mặt Trời không gian không cong', 'Vì Trái Đất đi trong không gian rất ít so với đi dọc trục thời gian; phần không gian chỉ góp cỡ $(v/c)^2 \\approx 10^{-8}$', 'Vì Trái Đất quá nặng', 'Vì độ cong không gian chỉ có bên trong Mặt Trời'],
        dung: 1,
        giai: 'Trong một giây Trái Đất đi 29,8 km trong không gian nhưng 299 792 km dọc trục thời gian. Độ cong của thời gian tác động lên phần lớn hơn hẳn.',
      },
      {
        hoi: 'Năm 1911 Einstein tính được tia sáng sát Mặt Trời lệch khoảng 0,87 giây cung (theo số liệu ngày nay); năm 1915 ông tính lại được gấp đôi, 1,75. Phần thêm vào đến từ đâu?',
        chon: ['Từ sai số tính toán năm 1911', 'Từ độ cong của không gian, phần mà lập luận buồng kín không thấy được; với ánh sáng nó góp ngang bằng phần thời gian', 'Từ khối lượng của ánh sáng', 'Từ khí quyển của Mặt Trời'],
        dung: 1,
        giai: 'Lập luận năm 1911 chỉ dùng nguyên lý tương đương, tức phần thời gian. Thuyết hoàn chỉnh có thêm phần không gian; ánh sáng đi với $v = c$ nên hai phần bằng nhau.',
      },
      {
        hoi: 'Một bạn nói: «Hấp dẫn giống quả bóng đè lõm tấm cao su, viên bi lăn vào chỗ trũng.» Hãy chỉ ra cách nói này đúng ở đâu và sai ở đâu.',
        dap: 'Đúng ở chỗ: khối lượng làm hình học quanh nó cong, và mặt cong trông giống tấm cao su lõm (mặt Flamm là phần không gian thật của độ cong). Sai ở ba chỗ: (1) viên bi lăn vì có trọng lực Trái Đất kéo xuống, tức dùng hấp dẫn giải thích hấp dẫn; (2) mặt Flamm không có «phía dưới», chiều đứng chỉ để vẽ; (3) hình bỏ mất phần thời gian, mà với vật chậm phần thời gian mới là thứ làm vật rơi và giữ hành tinh trên quỹ đạo. Không gian cong chỉ đóng vai đáng kể với vật nhanh như ánh sáng.',
      },
    ],
    docThem: [
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 7: mặt nhúng; chương 9: hình học ngoài một ngôi sao cầu, khoảng cách theo phương bán kính.',
      'E. F. Taylor, J. A. Wheeler và E. Bertschinger, *Exploring Black Holes* (bản 2): khoảng cách bằng thước và «bán kính chu vi» quanh lỗ đen, có mặt nhúng.',
      'R. P. Feynman, *The Feynman Lectures on Physics*, tập II, chương 42 «Curved Space»: không gian cong hai chiều, phần «bán kính dư» quanh một khối lượng.',
      'Jonsson 2005, «Visualizing curved spacetime», Am. J. Phys. 73, 248: vì sao hình tấm cao su gây hiểu nhầm, và cách vẽ cả phần thời gian.',
    ],
    thuatNgu: [
      { vi: 'bán kính chu vi', en: 'reduced circumference', nghia: 'Chu vi của vòng tròn quanh khối lượng chia cho $2\\pi$. Đây là $r$ trong metric Schwarzschild; nó không bằng khoảng cách đo từ tâm.' },
      { vi: 'khoảng cách riêng', en: 'proper distance', nghia: 'Khoảng cách đo bằng thước đứng yên tại chỗ, trên một lát cắt «cùng lúc». Theo phương bán kính quanh khối lượng: $\\dd\\ell = \\dd r/\\sqrt{1 - r_s/r}$.' },
      { vi: 'mặt nhúng', en: 'embedding diagram', nghia: 'Cách vẽ một mặt cong hai chiều như một mặt trong không gian ba chiều tưởng tượng, sao cho khoảng cách đo dọc theo mặt là đúng. Chiều thêm vào chỉ để vẽ.' },
      { vi: 'mặt Flamm', en: 'Flamm’s paraboloid', nghia: 'Mặt nhúng của lát cắt xích đạo bên ngoài một khối lượng cầu: $z = 2\\sqrt{r_s(r - r_s)}$. Ludwig Flamm tìm ra năm 1916.' },
    ],
  },

  conSo: [
    '**3,1 mm**: đi từ mặt đất lên tới vòng có bán kính gấp đôi (thêm 6 371 km), thước đo được dài hơn hình học phẳng chừng ấy.',
    '**1,02 km** trên 695 700 km: phần dư tương tự quanh Mặt Trời. Từ bề mặt Mặt Trời tới quỹ đạo Trái Đất: 7,9 km.',
    '**Khoảng 15%**: phần dư quanh một sao neutron (1,78 km trên 12 km). Không gian ở đó cong thấy rõ.',
    '**8/9**: không ngôi sao nào đứng yên được nếu bị nén quá mức này (bán kính nhỏ hơn 9/8 bán kính Schwarzschild); nó phải sụp thành lỗ đen.',
    '**Cỡ 10⁻⁸**: phần không gian cong góp vào quỹ đạo Trái Đất, so với phần thời gian.',
  ],
  hieuDung: '**Mặt lưới này không phải «tấm cao su» có quả bóng đè lên.** Hình tấm cao su gợi ý rằng vật lăn xuống chỗ trũng vì bị trọng lực kéo, tức là dùng hấp dẫn để giải thích hấp dẫn. Mặt Flamm chỉ là bản đồ khoảng cách của không gian tại một thời điểm; nó không có «phía dưới». Quả táo rơi chủ yếu vì *thời gian* trôi chậm hơn ở gần mặt đất (Bài 9, Bài 10), chứ không phải vì không gian trũng.',
  hinh: { quang: 0.42, nguong: 0.85 },
  css: '.nhan.so-thuoc { font-size: 10px; padding: 0 2px; color: rgba(240, 246, 255, 0.85); font-variant-numeric: tabular-nums; }',
  nguon: 'Nghiệm Schwarzschild ngoài và trong (1916); mặt nhúng Flamm (1916); Hartle 2003, chương 6, 7, 9. Sao neutron lấy cỡ điển hình 1,4 khối lượng Mặt Trời, bán kính 12 km. Mọi phần dư khoảng cách tính lại từ hằng số CODATA 2018, IAU, xem kiem-tra/kiem-phan-3-cu.mjs.',

  tao(app) {
    const scene = new THREE.Scene();
    const am = app.am, tt = app.tt;
    scene.add(taoNenSao({ soSao: 2600, hat: 5, doSang: 0.5 }));
    const mc = new MatCong({ doMoMat: 0.24 });
    scene.add(mc.nhom);
    const doMoMat0 = mc.mat.material.opacity, doMoLuoi0 = mc.luoi.material.opacity;
    // Chống NaN của shader mặt cong khi nhìn thẳng từ trên xuống: dot(n, v) có thể nhỉnh hơn 1 một chút, pow của số âm
    // ra NaN, rồi quầng sáng lan NaN ra cả khung hình (màn hình đen). Kẹp lại ngay trên vật liệu của bài này.
    // (Đã ghi vào báo cáo để sửa hẳn trong src/khung/mat-cong.js.)
    mc.mat.material.fragmentShader = mc.mat.material.fragmentShader.replace('pow(1.0 - dot(n, v), 2.4)', 'pow(max(1.0 - dot(n, v), 0.0), 2.4)');
    // mặt phẳng tham chiếu: không gian phẳng trông sẽ thế này
    const phang = new THREE.Group();
    for (let r = 1; r <= R_MAX; r++) phang.add(duongTron(r, { mau: 0xffffff, doMo: 0.07 }));
    scene.add(phang);
    // nhãn lát cắt và mũi tên «chiều phụ chỉ để vẽ»
    const nhanLat = taoNhan(chuCanh("canh.lat-cat-cung-luc-t-hang-so-qua", "Lát cắt «cùng lúc» (t = hằng số) qua mặt phẳng xích đạo<small>hai chiều không gian; chiều thời gian và một chiều không gian đã bỏ</small>"), 'mo', { giua: true });
    nhanLat.position.set(0, 0.3, -R_MAX - 0.3);
    const chieuPhu = muiTen([4.9, -2.0, -4.9], [4.9, 1.0, -4.9], { mau: 0xc8aaff, rong: 2, dau: 0.28 });
    const nhanChieuPhu = taoNhan(chuCanh("canh.chieu-phu-chi-de-ve-khong-phai-mot", "chiều phụ chỉ để vẽ<small>không phải một chiều thật</small>"), 'tran');
    nhanChieuPhu.element.style.color = '#c8aaff';
    nhanChieuPhu.position.set(4.9, 1.25, -4.9); nhanChieuPhu.center.set(0.5, 1);
    scene.add(nhanLat, chieuPhu, nhanChieuPhu);

    // ----- Phần vật chất của ngôi sao trên lát cắt (chỏm cầu bên trong), phát sáng theo màu ngôi sao -----
    const N1 = 24, N2 = 96;
    const vtSao = new Float32Array((N1 + 1) * (N2 + 1) * 3);
    const rSao = new Float32Array((N1 + 1) * (N2 + 1));
    const csSao = [];
    for (let i = 0; i < N1; i++) for (let j = 0; j < N2; j++) { const a = i * (N2 + 1) + j, b = a + 1, c = a + N2 + 1, d = c + 1; csSao.push(a, c, b, b, c, d); }
    for (let i = 0; i <= N1; i++) for (let j = 0; j <= N2; j++) rSao[i * (N2 + 1) + j] = i / N1;
    const geoSao = new THREE.BufferGeometry();
    geoSao.setAttribute('position', new THREE.BufferAttribute(vtSao, 3));
    geoSao.setAttribute('aR', new THREE.BufferAttribute(rSao, 1));
    geoSao.setIndex(csSao);
    const matLoi = new THREE.ShaderMaterial({
      uniforms: { uMau: { value: new THREE.Color(0xffc65c) }, uMo: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aR; varying float vR;
        void main() { vR = aR; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uMau; uniform float uMo; varying float vR;
        void main() {
          float tam = 1.0 - vR * vR;
          float mep = smoothstep(0.82, 1.0, vR);
          vec3 c = uMau * (0.35 + 1.1 * tam) + uMau * mep * 0.8;
          gl_FragColor = vec4(c * uMo, 0.62 * uMo);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    matLoi.tuyenTinh = true;
    const loiSao = new THREE.Mesh(geoSao, matLoi);
    loiSao.renderOrder = -1;
    scene.add(loiSao);
    // vòng mép: bề mặt sao (trắng) hoặc chân trời (cam đỏ)
    const N_MEP = 161;
    const mep = new DuongDay(N_MEP, { mau: 0xffffff, rong: 2.4, doMo: 0.95, cong: false, quang: 0.12, sang: 1.4 });
    scene.add(mep.line);

    // ----- Thiên thể ở tâm: hình ba chiều để dễ nhận ra; xích đạo của nó nằm đúng trên vòng mép -----
    const nhomVat = new THREE.Group();
    scene.add(nhomVat);
    const traiDat = taoTraiDat({ banKinh: 1, tocDoQuay: 0.05 });
    traiDat.datHuongSang([0.55, 0.55, 0.65]);
    const matTroi = taoMatTroi({ banKinh: 1 });
    matTroi.datDoSang(0.45);
    const saoLun = taoSaoDac(0xdfeaff, 1.15);
    const saoNt = taoSaoDac(0x9fe8ff, 1.35);
    const loDen = taoLoDenNho({ banKinh: 1, dia: false, doSang: 1.2 });
    const HINH_VAT = { dat: traiDat.nhom, mt: matTroi.nhom, lt: saoLun.nhom, nt: saoNt.nhom, ld: loDen.nhom };
    for (const k in HINH_VAT) { HINH_VAT[k].visible = false; nhomVat.add(HINH_VAT[k]); }
    let gioMT = 0;

    // ----- Hai cây thước: dải có bề dày, vạch tính trong shader theo chiều dài đo bằng thước -----
    const thuoc = new ThuocDai(220, 0xf2f6ff, { doMo: 0.78 });
    const thuocPh = new ThuocDai(220, 0x7fcaff, { doMo: 0.7, rong: 0.36 });
    scene.add(thuoc.mesh, thuocPh.mesh);

    const nhanVat = taoNhan('', 'vang dam', { giua: true });
    const nhanThuoc = taoNhan(chuCanh("canh.thuoc-do-that-vach-cach-nhau-0-5", "thước đo thật<small>vạch cách nhau 0,5 đo bằng thước</small>"), 'mo');
    const nhanPh = taoNhan(chuCanh("canh.neu-khong-gian-phang-vach-cach-nhau-0", "nếu không gian phẳng<small>vạch cách nhau 0,5 theo hiệu bán kính</small>"), 'xanh');
    const nhanDo = taoNhan('', 'dam', { giua: true });
    nhanDo.center.set(0.5, 1);
    const nhanVong = [];
    for (let r = 2; r <= R_MAX; r += 1) { const n = taoNhan(chuCanh("canh.chu-vi-2", "chu vi 2π·{0}", [r]), 'mo'); nhanVong.push([n, r]); scene.add(n); }
    const nhanSo = Array.from({ length: 8 }, (_, i) => { const n = taoNhan(String(i + 1), 'tran so-thuoc', { giua: true }); scene.add(n); return n; });
    const nhanSoTat = nhanSo.map(() => true);
    scene.add(nhanVat, nhanThuoc, nhanPh, nhanDo);

    // ----- Thang «Nén» trong cảnh: kéo xuống là nén cùng khối lượng vào bán kính nhỏ hơn -----
    const ong = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, G_CAO + 0.75, 20, 1, true),
      new THREE.ShaderMaterial({
        uniforms: { uTren: { value: G_TREN + 0.1 }, uDuoi: { value: Y_LD - 0.1 } },
        vertexShader: /* glsl */ `
          varying float vY; varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y;
            vec4 mv = viewMatrix * w; vN = normalize(normalMatrix * normal); vV = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTren, uDuoi; varying float vY; varying vec3 vN; varying vec3 vV;
          void main() {
            float t = clamp((uTren - vY) / (uTren - uDuoi), 0.0, 1.0);
            vec3 c = mix(vec3(0.5, 0.78, 1.0), vec3(1.0, 0.8, 0.32), smoothstep(0.15, 0.7, t));
            c = mix(c, vec3(1.0, 0.32, 0.18), smoothstep(0.72, 0.95, t));
            float vien = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.6);
            gl_FragColor = vec4(c * (0.35 + 1.6 * vien), 0.35 + 0.6 * vien);
          }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    );
    ong.material.tuyenTinh = true;
    ong.position.set(G_X, (G_TREN + Y_LD) / 2, G_Z);
    scene.add(ong);
    const vachNen = new DuongDay(2 * (VAT.length + 1), { mau: 0xffffff, rong: 1.6, doMo: 0.7, cong: false });
    const MOC_NEN = [...VAT.slice(0, 4).map((v) => [v, yTuC(v.C)]), [VAT[4], Y_LD]];
    MOC_NEN.forEach(([, y], i) => { vachNen.dat(2 * i, G_X - 0.18, y, G_Z); vachNen.dat(2 * i + 1, G_X + 0.18, y, G_Z); });
    { const y = yTuC(0.86) - 0.14; vachNen.dat(10, G_X - 0.26, y, G_Z); vachNen.dat(11, G_X + 0.26, y, G_Z); }  // giới hạn 8/9
    ghiVach(vachNen, 12);
    scene.add(vachNen.line);
    const nhanMoc = MOC_NEN.map(([v, y]) => { const n = taoNhan(v.ten, 'tran mo'); n.position.set(G_X + 0.22, y, G_Z); scene.add(n); return n; });
    const nhanGioiHan = taoNhan(chuCanh("canh.gioi-han-8-9", "giới hạn 8/9"), 'tran');
    nhanGioiHan.element.style.color = '#ff8a73';
    nhanGioiHan.position.set(G_X - 0.3, yTuC(0.86) - 0.14, G_Z); nhanGioiHan.center.set(1, 0.5);
    const nhanOng = taoNhan(chuCanh("canh.nen-vat-the-cung-khoi-luong-ban-kinh", "Nén vật thể<small>cùng khối lượng, bán kính nhỏ dần</small>"), 'mo', { giua: true });
    nhanOng.position.set(G_X, G_TREN + 0.55, G_Z); nhanOng.center.set(0.3, 1);   // lệch sang phải để cửa sổ hẹp không cắt mất chữ
    scene.add(nhanGioiHan, nhanOng);

    // ----- Trạng thái logic (bài giảng, ô số liệu, thử thách đọc ở đây) -----
    let C = VAT[3].C;       // độ đặc rs/R
    let laLoDen = false;
    let phongDai = true;
    let toMau = false;
    let rA = 1, rB = R_MAX; // hai đầu thước (bán kính chu vi)
    let coTay = false;
    let coCau = true;       // hiện thiên thể ba chiều ở tâm
    // Trạng thái đang vẽ: đuổi theo trạng thái logic trong khoảng nửa giây cho khỏi giật
    const hien = { lc: Math.log(C), laLoDen: false, k: 1, kMau: 0, mo: 1, can: true };

    const kDich = (rs, laLD) => {
      if (!phongDai) return 1;
      const sau = laLD ? 2 * Math.sqrt(rs * (R_MAX - rs)) : nhungSao(R_MAX, 1, rs) - nhungSao(0, 1, rs);
      return sau < 1.5 ? 1.5 / Math.max(1e-12, sau) : 1;
    };
    const kMauDich = (rs, laLD) => {
      if (!toMau) return 0;
      const lech = 1 - (laLD ? nhipDongHo(1.0001, 1) : nhipDongHoTrongSao(0, 1, rs));
      return phongDai && lech < 0.75 ? 0.75 / Math.max(1e-14, lech) : 1;
    };
    const rsHien = () => (hien.laLoDen ? 1 : Math.exp(hien.lc));
    const doDaiThuoc = (a, b, rs) => khoangCachThat(Math.min(a, b), Math.max(a, b), rs);

    // Dựng lại toàn bộ hình theo trạng thái đang vẽ.
    function dung() {
      const laLD = hien.laLoDen, rs = rsHien();
      mc.dat({ rs, R: laLD ? null : 1, rMax: R_MAX, phongDai: hien.k, kMau: hien.kMau });
      const mo = hien.mo;
      mc.mat.material.opacity = doMoMat0 * mo;
      mc.luoi.material.opacity = doMoLuoi0 * mo;

      const vat = laLD ? VAT[4] : VAT.reduce((a, b) => (Math.abs(Math.log(b.C / rs)) < Math.abs(Math.log(a.C / rs)) ? b : a), VAT[0]);
      for (const k in HINH_VAT) HINH_VAT[k].visible = coCau && k === vat.id;
      const yMep = mc.y(1);
      nhomVat.position.y = yMep;
      nhomVat.scale.setScalar(0.25 + 0.75 * mo);
      loiSao.visible = !laLD;
      if (!laLD) {
        let p = 0;
        for (let i = 0; i <= N1; i++) {
          const r = i / N1, y = mc.y(r) + 0.012;
          for (let j = 0; j <= N2; j++) { const a = (j / N2) * 2 * Math.PI; vtSao[p++] = r * Math.cos(a); vtSao[p++] = y; vtSao[p++] = r * Math.sin(a); }
        }
        geoSao.attributes.position.needsUpdate = true;
        geoSao.computeBoundingSphere();
        matLoi.uniforms.uMau.value.set(vat.mau).multiplyScalar(vat.id === 'dat' ? 0.9 : 1.3);
        matLoi.uniforms.uMo.value = mo;
      }
      for (let i = 0; i < N_MEP; i++) { const a = (i / (N_MEP - 1)) * 2 * Math.PI; mep.dat(i, Math.cos(a), yMep + 0.02, Math.sin(a)); }
      mep.xong(N_MEP);
      mep.datMau(laLD ? 0xff7a50 : 0xffffff);
      mep.datDoMo(0.95 * mo);

      // hai cây thước giữa rA và rB
      const a = Math.min(rA, rB), b = Math.max(rA, rB);
      thuoc.dung(mc, 0, a, b, (r) => khoangCachThat(a, r, rs), laLD);
      thuocPh.dung(mc, A_PH, a, b, (r) => r - a, laLD);
      thuoc.mat.uniforms.uMo.value = thuocPh.mat.uniforms.uMo.value = mo;
      const ell = khoangCachThat(a, b, rs);
      // nhãn số nguyên dọc thước thật (đo bằng thước, tính từ đầu trong)
      for (let i = 0; i < nhanSo.length; i++) {
        const s = i + 1, n = nhanSo[i];
        nhanSoTat[i] = !(s < ell - 0.12);
        if (nhanSoTat[i]) continue;
        const r = thuoc.rTaiS(s);
        n.position.set(r, mc.y(r) + NANG + 0.02, 0.36);
      }
      nhanVat.datChu(`${vat.ten}<small>${vat.moTa}</small>`);
      nhanVat.position.set(0, yMep + (laLD ? -1.25 : 1.35), 0);
      const rTg = (a + b) / 2;
      nhanThuoc.position.set(rTg, mc.y(rTg) - 0.05, 0.62);
      const rPh = a + 0.55 * (b - a), ca = Math.cos(A_PH), sa = Math.sin(A_PH);
      nhanPh.position.set(rPh * ca, mc.y(rPh) + 0.15, rPh * sa - 0.45);
      nhanDo.datChu(chuCanh("canh.hieu-ban-kinh-r", "ℓ = {0}<small>hiệu bán kính Δr = {1}</small>", [so(ell, 2), so(b - a, 2)]));
      nhanDo.position.set(b, mc.y(b) + 0.42, 0);
      for (const [n, rr] of nhanVong) n.position.set(rr * Math.cos(2.2), mc.y(rr) + 0.05, rr * Math.sin(2.2));
      // tay nắm bám theo mặt đang vẽ
      if (!tt.dangKeo) {
        tayA.dat([rA, mc.y(rA) + NANG + 0.03, 0]);
        tayB.dat([rB, mc.y(rB) + NANG + 0.03, 0]);
      }
    }

    // ----- Tương tác -----
    // Chiếu tia chuột lên mặt cong, rồi đưa về kinh tuyến của thước (góc 0): kéo ra xa, lại gần tâm.
    function chieuLenMat(ray) {
      const o = ray.origin, d = ray.direction;
      const rMin = hien.laLoDen ? 1 : 0;
      const F = (t) => { const x = o.x + d.x * t, z = o.z + d.z * t; return o.y + d.y * t - mc.y(Math.max(rMin, Math.hypot(x, z))); };
      let t0 = 0, f0 = F(0), hit = -1;
      for (let i = 1; i <= 480; i++) {
        const t1 = i * 0.12, f1 = F(t1);
        if (f0 * f1 <= 0) { let a = t0, b = t1; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (F(a) * F(m) <= 0) b = m; else a = m; } hit = (a + b) / 2; break; }
        t0 = t1; f0 = f1;
      }
      let r;
      if (hit >= 0) r = Math.hypot(o.x + d.x * hit, o.z + d.z * hit);
      else if (Math.abs(d.z) > 1e-4) { const t = -o.z / d.z; if (t <= 0) return null; r = Math.abs(o.x + d.x * t); }
      else return null;
      r = kep(r, 1, R_MAX);
      return new THREE.Vector3(r, mc.y(r) + NANG + 0.03, 0);
    }
    let demVach = -1, demVachPh = -1;
    function amThuoc() {
      // mỗi vạch thước thật đi qua: «tích» cao; mỗi vạch thước phẳng: «tích» trầm (âm thanh minh hoạ)
      const a = Math.min(rA, rB), b = Math.max(rA, rB);
      const v = Math.floor(doDaiThuoc(a, b, laLoDen ? 1 : C) / 0.5), vp = Math.floor((b - a) / 0.5);
      if (demVach >= 0 && v !== demVach) am.tich({ tanSo: 1480, doTo: 0.42, lech: 0.25, dai: 0.04 });
      if (demVachPh >= 0 && vp !== demVachPh) am.tich({ tanSo: 620, doTo: 0.42, lech: -0.25, dai: 0.06 });
      demVach = v; demVachPh = vp;
    }
    const khiKeoThuoc = (dau) => (p) => {
      if (dau === 'a') rA = p.x; else rB = p.x;
      daKeoThuoc = true;
      amThuoc();
      dung();
    };
    let daKeoThuoc = false;
    const tayA = tt.tayNam({
      viTri: [1, 0, 0], mau: 0xeef4ff, co: 0.12, ten: chuCanh("canh.dau-trong-cua-thuoc", "Đầu trong của thước"), moTa: chuCanh("canh.keo-doc-theo-mat-cong-bat-dinh-vao", "Kéo dọc theo mặt cong. Bắt dính vào bề mặt sao (hoặc chân trời)."),
      rangBuoc: { kieu: 'ham', chieu: (ray) => chieuLenMat(ray) },
      gioiHan: (p) => { if (p.x < 1.06) { p.x = 1; p.y = mc.y(1) + NANG + 0.03; } return p; },
      khiNam: () => { demVach = demVachPh = -1; amThuoc(); }, khiKeo: khiKeoThuoc('a'),
    });
    const tayB = tt.tayNam({
      viTri: [R_MAX, 0, 0], mau: 0xeef4ff, co: 0.12, ten: chuCanh("canh.dau-ngoai-cua-thuoc", "Đầu ngoài của thước"), moTa: chuCanh("canh.keo-doc-theo-mat-cong-de-doi-doan", "Kéo dọc theo mặt cong để đổi đoạn đo."),
      rangBuoc: { kieu: 'ham', chieu: (ray) => chieuLenMat(ray) },
      gioiHan: (p) => { if (p.x < 1.06) { p.x = 1; p.y = mc.y(1) + NANG + 0.03; } return p; },
      nhan: chuCanh("canh.keo-dau-thuoc", "Kéo đầu thước"), khiNam: () => { demVach = demVachPh = -1; amThuoc(); }, khiKeo: khiKeoThuoc('b'),
    });
    let mocNen = -1;
    const tayNen = tt.tayNam({
      viTri: [G_X, yTuC(C), G_Z], mau: 0xff7aa8, co: 0.13, ten: chuCanh("canh.thang-nen", "Thang nén"), moTa: () => chuCanh("canh.keo-xuong-cung-khoi-luong-bi-ep-vao", "Kéo xuống: cùng khối lượng bị ép vào bán kính nhỏ hơn.<br>Độ đặc r<sub>s</sub>/R hiện tại: <b>{0}</b>", [laLoDen ? chuCanh("canh.1-lo-den", "1 (lỗ đen)") : C < 1e-3 ? soNghia(C, 3) : so(C, 3)]),
      rangBuoc: { kieu: 'duong', qua: [G_X, 0, G_Z], huong: [0, 1, 0] },
      gioiHan: (p) => { p.x = G_X; p.z = G_Z; p.y = kep(p.y, Y_LD, G_TREN); return p; },
      hut: MOC_NEN.map(([, y]) => [G_X, y, G_Z]), khoangHut: 0.09,
      nhan: chuCanh("canh.keo-xuong-de-nen", "Kéo xuống để nén"),
      khiKeo: (p) => {
        const laLD = p.y < Y_LD + 0.28;
        if (laLD) cauHinh({ vat: 'ld', ngay: true });
        else cauHinh({ C: CtuY(Math.max(p.y, G_TREN - G_CAO)), ngay: true });
        const moc = MOC_NEN.findIndex(([, y]) => Math.abs(p.y - y) < 0.1);
        if (moc >= 0 && moc !== mocNen) am.not({ tanSo: 880 / Math.pow(1.5, moc), dai: 1.1, doTo: 0.35, dang: 'chuong' });
        mocNen = moc;
      },
    });

    tt.them(nhomVat, {
      ten: chuCanh("canh.thien-the-o-tam", "Thiên thể ở tâm"), mau: 0xf3c66f,
      moTa: () => {
        const v = laLoDen ? VAT[4] : VAT.find((x) => Math.abs(Math.log(x.C / C)) < 0.02);
        const cHien = laLoDen ? '1' : C < 1e-3 ? soNghia(C, 3) : so(C, 3);
        return chuCanh("canh.do-dac-r-s-r", "<b>{0}</b>{1}<br>Độ đặc r<sub>s</sub>/R: <b>{2}</b><br>{3}", [v ? v.ten : chuCanh("canh.vat-the-da-nen", "Vật thể đã nén"), v ? `<br>${v.moTa}` : '', cHien, laLoDen ? chuCanh("canh.hinh-cau-den-la-chan-troi-su-kien", "Hình cầu đen là chân trời sự kiện.") : chuCanh("canh.hinh-cau-chi-de-de-nhan-ra-tren", "Hình cầu chỉ để dễ nhận ra; trên lát cắt, ngôi sao là phần màu, xích đạo trùng vòng trắng.")]);
      },
    });
    tt.them(thuoc.mesh, {
      ten: chuCanh("canh.thuoc-do-that", "Thước đo thật"), mau: 0xeef4ff,
      moTa: () => { const a = Math.min(rA, rB), b = Math.max(rA, rB), l = doDaiThuoc(a, b, laLoDen ? 1 : C); return chuCanh("canh.do-doc-theo-mat-hieu-ban-kinh-chu", "Đo dọc theo mặt: <b>ℓ = {0}</b><br>Hiệu bán kính chu vi: Δr = {1}<br>Thước dài hơn {2}%", [so(l, 3), so(b - a, 3), so((l / (b - a) - 1) * 100, 1)]); },
    });
    tt.them(thuocPh.mesh, { ten: chuCanh("canh.thuoc-neu-khong-gian-phang", "Thước «nếu không gian phẳng»"), mau: 0x7fcaff, moTa: chuCanh("canh.vach-cach-nhau-0-5-theo-hieu-ban", "Vạch cách nhau 0,5 theo hiệu bán kính chu vi. Đây là chỗ các vạch sẽ nằm nếu không gian quanh khối lượng là phẳng.") });

    // ----- Điều khiển -----
    const bang = app.bang;
    const tenGan = () => (laLoDen ? 'ld' : VAT.find((v) => Math.abs(Math.log(v.C / C)) < 0.02)?.id ?? null);
    const dkVat = bang.chon({
      nhan: chuCanh("canh.chon-vat-the", "Chọn vật thể"),
      luaChon: VAT.map((v) => ({ giaTri: v.id, nhan: v.ten, moTa: v.moTa })),
      giaTri: 'nt',
      khiDoi: (id) => cauHinh({ vat: id }),
    });
    const dkNen = bang.thanhTruot({
      nhan: chuCanh("canh.nen-vat-the-ban-kinh-schwarzschild-ban-kinh", "Nén vật thể: bán kính Schwarzschild / bán kính"), min: 1e-9, max: 0.86, giaTri: C, log: true,
      hienThi: (v) => (v < 1e-3 ? soNghia(v, 2) : so(v, 3)),
      khiDoi: (v) => cauHinh({ C: v }),
    });
    const dkPhong = bang.congTac({ nhan: chuCanh("canh.phong-dai-do-trung-khi-no-qua-nho", "Phóng đại độ trũng khi nó quá nhỏ"), giaTri: phongDai, khiDoi: (v) => cauHinh({ phongDai: v }) });
    const dkMau = bang.congTac({ nhan: chuCanh("canh.to-mau-theo-nhip-dong-ho-phan-thoi", "Tô màu theo nhịp đồng hồ (phần thời gian, Bài 9)"), giaTri: toMau, khiDoi: (v) => cauHinh({ toMau: v }) });
    bang.chuThich(chuCanh("canh.keo-thanh-truot-hoac-dom-hong-tren-thang", "Kéo thanh trượt (hoặc đốm hồng trên thang «Nén» trong cảnh) là đang nén cùng một khối lượng vào bán kính nhỏ dần. Trên hình, bán kính vật thể luôn được vẽ bằng 1 đơn vị (lỗ đen: chân trời bằng 1). Thước trắng đo thật; thước xanh là chỗ các vạch sẽ nằm nếu không gian phẳng. Kéo hai đốm trắng để đổi đoạn đo."));

    const GOC = {
      tong: [[0, 6.6, 13.6], [0, -0.7, 0]],
      tren: [[0.01, 16.5, 0.02], [0, -0.6, 0]],
      ngang: [[0.01, -0.4, 15.5], [0, -1.0, 0]],
      gan: [[3.4, 2.4, 6.2], [2.4, -1.0, 0]],
    };
    const goc = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    // ngay: true thì hình theo ngay (đang kéo), không chuyển dần.
    function cauHinh(o = {}) {
      if (o.vat) {
        laLoDen = o.vat === 'ld';
        if (!laLoDen) { C = VAT.find((k) => k.id === o.vat).C; dkNen.dat(C); }
      }
      if (o.C != null) { C = o.C; laLoDen = false; dkNen.dat(C); }
      if (o.phongDai != null) { phongDai = o.phongDai; dkPhong.dat(phongDai); }
      if (o.toMau != null) { toMau = o.toMau; dkMau.dat(toMau); }
      if (o.thuoc) { [rA, rB] = o.thuoc; daKeoThuoc = false; }
      if (o.cau != null) coCau = o.cau;
      if (o.tay != null) {
        coTay = o.tay;
        tayA.an(!coTay); tayB.an(!coTay); tayNen.an(!coTay);
        ong.visible = vachNen.line.visible = coTay;
      }
      dkVat.dat(tenGan());
      if (!tt.dangKeo || o.vat || o.C != null) tayNen.dat([G_X, laLoDen ? Y_LD : yTuC(C), G_Z]);
      if (o.ngay) { hien.lc = Math.log(laLoDen ? 1 : C); hien.k = kDich(laLoDen ? 1 : C, laLoDen); if (hien.laLoDen === laLoDen) hien.mo = 1; }
      hien.can = true;
      if (o.mayAnh) goc(o.mayAnh);
    }

    // Chuyển dần: độ đặc theo thang log, độ phóng đại, màu; đổi sao ↔ lỗ đen thì mờ đi rồi hiện lại.
    function capNhat(dt, dtThuc = dt) {
      const k = 1 - Math.exp(-Math.min(dtThuc, 0.1) * 7);
      const rsD = laLoDen ? 1 : C;
      let doi = hien.can;
      if (hien.laLoDen !== laLoDen) {
        const m = Math.max(0, hien.mo - Math.min(dtThuc, 0.1) * 5);
        if (m !== hien.mo) { hien.mo = m; doi = true; }
        if (hien.mo <= 0) { hien.laLoDen = laLoDen; hien.lc = Math.log(rsD); hien.k = kDich(rsD, laLoDen); hien.kMau = kMauDich(rsD, laLoDen); doi = true; }
      } else {
        if (hien.mo < 1) { hien.mo = Math.min(1, hien.mo + Math.min(dtThuc, 0.1) * 4); doi = true; }
        const lc = Math.log(rsD), kd = kDich(rsD, laLoDen), km = kMauDich(rsD, laLoDen);
        if (Math.abs(lc - hien.lc) > 1e-4) { hien.lc += (lc - hien.lc) * k; doi = true; } else if (hien.lc !== lc) { hien.lc = lc; doi = true; }
        if (Math.abs(kd - hien.k) > 1e-4 * kd) { hien.k += (kd - hien.k) * k; doi = true; } else if (hien.k !== kd) { hien.k = kd; doi = true; }
        if (Math.abs(km - hien.kMau) > 1e-4 * Math.max(1, km)) { hien.kMau += (km - hien.kMau) * k; doi = true; } else if (hien.kMau !== km) { hien.kMau = km; doi = true; }
      }
      if (doi) { hien.can = false; dung(); }
      // thiên thể sống động (dt = 0 khi tạm dừng)
      gioMT += dt;
      traiDat.capNhat(dt);
      matTroi.capNhat(gioMT);
      saoLun.capNhat(dt); saoNt.capNhat(dt);
      loDen.capNhat(dt, app.camera);
      // nhãn đè nhau thì nhãn kém quan trọng tạm ẩn
      choNhan -= dtThuc;
      if (choNhan <= 0) {
        choNhan = 0.15;
        const ds = [
          { nhan: nhanDo, uuTien: 10, tat: !coTay, giu: true }, { nhan: nhanVat, uuTien: 9 },
          { nhan: nhanThuoc, uuTien: 6 }, { nhan: nhanPh, uuTien: 6 }, { nhan: nhanOng, uuTien: 5, tat: !coTay },
          { nhan: nhanGioiHan, uuTien: 4, tat: !coTay }, ...nhanMoc.map((n) => ({ nhan: n, uuTien: 4, tat: !coTay })),
          // nhìn từ trên xuống: nhãn lát cắt chạm mép trên khung hình, mũi tên chiều phụ chĩa thẳng vào mắt nên ẩn cả hai
          { nhan: nhanLat, uuTien: 3, tat: app.camera.position.y > 12 }, { nhan: nhanChieuPhu, uuTien: 3, tat: app.camera.position.y > 12 }, ...nhanVong.map(([n]) => ({ nhan: n, uuTien: 2 })),
          ...nhanSo.map((n, i) => ({ nhan: n, uuTien: 1, tat: nhanSoTat[i] })),
        ];
        goNhanDeNhau(ds, app.camera, app.rong, app.cao);
      }
    }
    let choNhan = 0;

    // Tham số riêng khi chụp ảnh kiểm thử (chỉ ở chế độ im lặng): ?thu=b3 | b4 | b5 | b6 đặt mô hình vào trạng thái đạt thử thách.
    const thuChup = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    function thu(ten) {
      if (thuChup !== ten) return;
      if (ten === 'b3') { rA = 1; rB = R_X_L2; daKeoThuoc = true; }
      if (ten === 'b4') cauHinh({ C: C_DU10, ngay: true });
      if (ten === 'b5') { rA = 1; rB = R_LD_2; daKeoThuoc = true; }
      if (ten === 'b6') cauHinh({ C: 0.5, ngay: true });
      hien.can = true;
    }

    cauHinh({ tay: false });
    dung();

    function hud() {
      const vat = laLoDen ? VAT[4] : VAT.find((v) => Math.abs(Math.log(v.C / C)) < 0.02);
      const rs = laLoDen ? 1 : C;
      const d12 = khoangCachThat(1, 2, rs);
      const du = d12 - 1;
      const dong = [
        [chuCanh("canh.do-dac-ban-kinh-schwarzschild-ban-kinh", "Độ đặc (bán kính Schwarzschild / bán kính)"), laLoDen ? chuCanh("canh.1-lo-den", "1 (lỗ đen)") : (C < 1e-3 ? soNghia(C, 3) : so(C, 3))],
        [chuCanh("canh.tu-vong-1-toi-vong-2", "Từ vòng 1 tới vòng 2"), chuCanh("canh.phang-1-don-vi-do-bang-thuoc-don", "phẳng: 1 đơn vị · đo bằng thước: {0} đơn vị", [du < 1e-3 ? `1 + ${soNghia(du, 2)}` : so(d12, 3)])],
      ];
      if (vat?.Rkm) dong.push([chuCanh("canh.voi-that", "Với {0} thật", [vat.ten]), chuCanh("canh.thuoc-dai-hon-tren-quang", "thước dài hơn {0} trên quãng {1}", [doDaiKm(du * vat.Rkm), doDaiKm(vat.Rkm)])]);
      if (coTay) {
        const a = Math.min(rA, rB), b = Math.max(rA, rB), l = doDaiThuoc(a, b, rs);
        dong.push([chuCanh("canh.thuoc-keo-hai-dau", "Thước (kéo hai đầu)"), `ℓ = ${so(l, 3)} · Δr = ${so(b - a, 3)} · ${b - a > 1e-6 ? chuCanh("canh.dai-hon", "dài hơn {0}%", [so((l / (b - a) - 1) * 100, 1)]) : ''}`]);
      }
      if (!laLoDen && coTay) dong.push([chuCanh("canh.do-doc-o-mep-sao", "Độ dốc ở mép sao"), chuCanh("canh.thuoc-hieu-ban-kinh", "{0}° · thước/hiệu bán kính = {1}", [so(Math.atan(Math.sqrt(C / (1 - C))) / DO, 1), so(1 / Math.sqrt(1 - C), 3)])]);
      dong.push([chuCanh("canh.dong-ho-o-be-mat", "Đồng hồ ở bề mặt"), laLoDen ? chuCanh("canh.dung-lai-o-chan-troi-so-voi-o", "đứng lại ở chân trời (so với ở xa)") : (1 - nhipDongHo(1, C) < 1e-3 ? chuCanh("canh.cham", "chậm {0}%", [soNghia((1 - nhipDongHo(1, C)) * 100, 2)]) : chuCanh("canh.chay-bang-dong-ho-o-xa", "chạy bằng {0}% đồng hồ ở xa", [so(nhipDongHo(1, C) * 100, 1)]))]);
      if (kDich(rs, laLoDen) > 1.01) dong.push([chuCanh("canh.do-trung-tren-hinh", "Độ trũng trên hình"), chuCanh("canh.dang-phong-dai-lan", "đang phóng đại {0} lần", [soNghia(kDich(rs, laLoDen), 2)])]);
      return dong;
    }

    // Đọc trạng thái cho thử thách.
    const trangThai = () => {
      const a = Math.min(rA, rB), b = Math.max(rA, rB);
      return { C, laLoDen, a, b, l: doDaiThuoc(a, b, laLoDen ? 1 : C), daKeoThuoc };
    };

    return {
      scene, capNhat, hud, cauHinh, goc, thu, trangThai,
    };
  },
};
