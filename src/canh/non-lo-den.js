import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài — Nón ánh sáng quanh lỗ đen.
// Sơ đồ không-thời gian của lỗ đen Schwarzschild: hai chiều không gian (r, φ) nằm ngang, thời gian hướng lên.
// Đơn vị: rs = 1, c = 1 (bán kính đo bằng rs, thời gian đo bằng rs/c).
// Trục thời gian mặc định là t* của tọa độ Eddington–Finkelstein «đi vào» (t* = t + ln|r − 1|), không hỏng ở chân trời.
// Có thể trộn dần sang thời gian Schwarzschild: t_hiển_thị = t* − m·(ln|r − 1| − ln 6), m từ 0 tới 1
// (trừ thêm ln 6 để người đứng ở r = 7 không bị dời).
// Nửa bên trái (φ = π): bản đồ tia sáng và hàng nón. Nửa bên phải (φ = 0): người rơi, chớp sáng, người ở xa.
//
// Bản 3: nón là mặt kính vẽ bằng shader (viền sáng theo góc nhìn, các tia sáng mảnh dọc mặt nón, vòng sáng chạy),
// chân trời là một mặt sáng dệt bằng các tia sáng thẳng đứng, sàn là lưới cực mờ dần. Người học kéo đỉnh nón dò dọc
// bán kính (có tiếng: cao độ theo tốc độ đi ra của mép ngoài), kéo «bây giờ» dọc đường của người ở xa (có tiếng chớp
// phát và chớp nhận), rê chuột lên nón, chân trời, kỳ dị, chớp sáng để đọc số liệu.

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { so } from '../vat-ly/hang-so.js';
import * as EF from '../vat-ly/eddington-finkelstein.js';
import { taoNhan, taoNenSao, DuongDay, duongDayTinh } from '../khung/ve.js';
import { MAU_KTG, muiTen, nonAnhSang, suKien } from '../khung/ktg.js';
import { MAU, khungDoThi } from '../khung/giao-dien.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('non-lo-den', khoa, goc, thamSo);

const R = String.raw;

const Y_MAX = 26;            // chiều cao sơ đồ (rs/c)
const R_SAN = 7.6;           // bán kính sàn
const R_QS = 7, R0 = 6, D_TAU = 0.6;
const BAN_KINH = [0.35, 0.6, 0.85, 1, 1.25, 1.6, 2.2, 3, 4.2, 6];
const HANG_NON = [3, 10];    // t* của hai hàng nón chính
const T_DO = 17;             // t* của nón dò
const EPS_DO = 1.5;          // chiều cao nón dò
const CAT_GAN = 2e-5;       // cắt vùng |r − 1| nhỏ hơn thế này khi trộn sang thời gian Schwarzschild
const MAU_NGOAI = MAU_KTG.anhSang, MAU_TRONG = MAU_KTG.do, MAU_CT = 0xffffff, MAU_ROI = MAU_KTG.hong;
// Đích của các thử thách (kiểm trong kiem-tra/kiem-non-lo-den.mjs)
const TT_GOC_NGOAI = 20;     // bước 3: mép ngoài nghiêng 20° ra ngoài (± 1,5°)
const TT_GOC_TRONG = 5;      // bước 4: mép ngoài nghiêng 5° vào trong (± 2°)
const TT_TAU = 0.2;          // bước 5: người rơi từ xa còn 0,2 rs/c tới kỳ dị (± 0,03)
// Tiếng của nón dò: nốt gốc La 220 Hz tại chân trời, mỗi 0,5 c tốc độ đi ra của mép ngoài là một quãng tám.
const tanSoNon = (r) => 220 * 2 ** (2 * EF.docTiaRa(r));

const mauVung = (r) => (Math.abs(r - 1) < 0.02 ? MAU_CT : r > 1 ? MAU_NGOAI : MAU_TRONG);
// Màu của mặt kính: trắng thì dịu đi (trắng cộng sáng chói hơn hẳn vàng, đỏ cam ở cùng độ mờ)
const mauKinh = (mau) => (mau === MAU_CT ? 0x8a96b4 : mau);
const epsTai = (r) => Math.min(0.6, 0.32 + 0.1 * r, 0.85 * r);
const goc = (d) => (Math.atan(d) * 180) / Math.PI;

// Tập đoạn thẳng nét đậm, mỗi đoạn độc lập (để vẽ đường có chỗ đứt: vùng sát chân trời bị cắt).
// sang > 1: nét phát sáng (có quầng của bộ dựng hình).
class DoanDay {
  constructor(toiDa, { mau = 0xffffff, rong = 1.6, doMo = 1, cong = true, quang = 0, sang = 1 } = {}) {
    this.toiDa = toiDa;
    this.sang = sang;
    this.geo = new LineSegmentsGeometry();
    this.bo = new THREE.InstancedInterleavedBuffer(new Float32Array(toiDa * 6), 6, 1);
    this.bo.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('instanceStart', new THREE.InterleavedBufferAttribute(this.bo, 3, 0));
    this.geo.setAttribute('instanceEnd', new THREE.InterleavedBufferAttribute(this.bo, 3, 3));
    const m = new THREE.Color(mau).multiplyScalar(sang);
    this.mat = new LineMaterial({ color: m, linewidth: rong, transparent: true, opacity: doMo, depthWrite: false, blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.line = new LineSegments2(this.geo, this.mat);
    this.line.frustumCulled = false;
    if (quang > 0) {
      this.matQuang = new LineMaterial({ color: m, linewidth: rong * 4.5, transparent: true, opacity: quang, depthWrite: false, blending: THREE.AdditiveBlending });
      const q = new LineSegments2(this.geo, this.matQuang);
      q.frustumCulled = false; q.renderOrder = -1;
      this.line.add(q);
    }
    this.n = 0;
    this.geo.instanceCount = 0;
  }
  datMau(mau) { this.mat.color.set(mau).multiplyScalar(this.sang); this.matQuang?.color.copy(this.mat.color); }
  batDau() { this.n = 0; }
  them(x1, y1, z1, x2, y2, z2) {
    if (this.n >= this.toiDa) return;
    const a = this.bo.array, j = this.n * 6;
    a[j] = x1; a[j + 1] = y1; a[j + 2] = z1; a[j + 3] = x2; a[j + 4] = y2; a[j + 5] = z2;
    this.n++;
  }
  xong() { this.bo.needsUpdate = true; this.geo.instanceCount = this.n; }
}

// ---------- Mặt kính của nón ánh sáng (shader, màu tuyến tính, cộng sáng) ----------
// Pháp tuyến lấy từ đạo hàm vị trí trên màn hình, nên dùng được cho nón bị nghiêng, bị cắt xéo tuỳ ý.
const NON_DINH = /* glsl */ `
  attribute vec2 aUV; varying vec2 vUV; varying vec3 vP;
  void main() { vUV = aUV; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const NON_MANH = /* glsl */ `
  uniform vec3 uMau; uniform float uDoMo, uT, uSoTia, uXung; varying vec2 vUV; varying vec3 vP;
  void main() {
    vec3 n = normalize(cross(dFdx(vP), dFdy(vP)));
    vec3 v = normalize(cameraPosition - vP);
    float fr = pow(1.0 - abs(dot(n, v)), 1.5);                         // viền sáng theo góc nhìn
    float o = vUV.x * uSoTia;
    float tia = 1.0 - smoothstep(0.15, 1.25, abs(fract(o - 0.5) - 0.5) / max(fwidth(o), 1e-6));   // các tia sáng dọc mặt nón
    float h = vUV.y;                                                    // 0 ở đỉnh, 1 ở miệng nón
    float f = fract(h * 2.0 - uT * 0.32);
    float vong = smoothstep(0.86, 0.975, f) * (1.0 - smoothstep(0.975, 1.0, f)) * smoothstep(0.05, 0.25, h);
    float a = uDoMo * (0.5 + 3.0 * fr + 2.0 * tia * (0.25 + 0.75 * h) + 2.4 * vong * uXung) * (0.35 + 0.65 * smoothstep(0.0, 0.3, h));
    gl_FragColor = vec4(uMau * a, 1.0);
  }`;
const GIO = { value: 0 };   // đồng hồ chung cho các hiệu ứng chạy trên mặt kính
function vatLieuKinh(mau, doMo, xung = 1, soTia = 12) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uT: GIO, uSoTia: { value: soTia }, uXung: { value: xung } },
    vertexShader: NON_DINH, fragmentShader: NON_MANH,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  m.tuyenTinh = true;
  return m;
}

export default {
  id: 'non-lo-den',
  ten: 'Nón ánh sáng quanh lỗ đen',
  moTa: 'Nón nghiêng dần vào trong; chân trời là mặt do ánh sáng dệt nên',
  yChinh: 'Càng gần lỗ đen, nón ánh sáng càng nghiêng vào trong. Tại chân trời, mép ngoài của nón dựng đứng: ánh sáng hướng ra cũng chỉ đứng yên tại chỗ. Bên trong, cả nón chĩa về tâm: bán kính r đóng vai thời gian và kỳ dị là một thời điểm chắc chắn sẽ tới, không phải một nơi có thể tránh.',
  mayAnh: { viTri: [-2.6, 8.2, 19], dich: [-3.2, 5.6, 0], fov: 40, min: 3, max: 90, gan: 0.05, xa: 2000 },
  hinh: { quang: 0.3, nguong: 1.3, banKinh: 0.35 },

  baiGiang: {
    mucTieu: [
      'Đọc được sơ đồ không-thời gian của lỗ đen: trục thời gian, chân trời, kỳ dị, các nón ánh sáng.',
      'Giải thích được vì sao nón nghiêng dần vào trong và vì sao tại chân trời ánh sáng hướng ra đứng yên.',
      'Nói được vì sao bên trong chân trời mọi đường thế giới đều tới r = 0, và tính được thời gian riêng còn lại.',
      'Phân biệt kỳ dị do tọa độ (r = rs) với kỳ dị thật (r = 0) bằng bất biến độ cong.',
      'Tính được các con số thật cho Sgr A*, M87* và một lỗ đen cỡ sao.',
    ],
    buoc: [
      {
        ten: 'Ở xa lỗ đen: nón gần như 45°',
        noiDung: R`
          Đây là một {{sơ đồ không-thời gian}} quanh lỗ đen. Trục đứng là thời gian; mặt sàn là không gian hai chiều quanh lỗ đen (bỏ bớt một chiều như ở Bài 4). Lỗ đen nằm ở trục giữa: **trụ vàng** là {{chân trời sự kiện}}, **đường răng cưa đỏ** là {{kỳ dị}}.

          Mỗi cái phễu là {{nón ánh sáng}} tương lai của một sự kiện, như ở Bài 5: mọi đường thế giới đi ra từ đỉnh nón phải nằm trong lòng nón. Nhìn hàng nón bên trái, từ ngoài vào trong. Ở mép ngoài sàn ($r = 6\,r_s$) nón gần như đứng thẳng: mép trong nghiêng đúng 45°, mép ngoài 35,5°, chỉ hơi lệch so với nón phẳng. Không-thời gian ở đó gần phẳng.

          Đơn vị của bài: bán kính đo bằng {{bán kính Schwarzschild}} $r_s$, thời gian đo bằng $r_s/c$. Với lỗ đen giữa Ngân Hà (Sgr A*), $r_s \approx 12{,}7$ triệu km và $r_s/c \approx 42$ giây.

          > [Thử ngay] Đặt chồng nón «phẳng» của Bài 5 (khung trắng) lên mỗi nón để so. Ở $6\,r_s$ chúng gần trùng; vào gần lỗ đen thì lệch hẳn. Rê chuột lên một nón để đọc độ nghiêng hai mép của nó.
          > [[Chồng nón phẳng lên để so|phang]] [[Bỏ nón phẳng|boPhang]] [[Nhìn ngang|ngang]]

          > [Lưu ý] Nón vẽ to cho dễ thấy; thật ra nón ánh sáng chỉ cho biết các **hướng** được phép tại đúng một điểm. Mặt sàn vẽ $r$ và góc $\varphi$ như trên tờ giấy phẳng, không vẽ phần không gian cong (đã xem ở Bài 11).

          +++ Đi sâu: ở $6\,r_s$ nón đã lệch bao nhiêu?
          Bước 3 sẽ cho công thức. Thay số trước: ở $r = 6\,r_s$, mép trong nghiêng đúng 45°, mép ngoài có $\dd r/\dd t^* = 5/7$, tức nghiêng 35,5° so với trục thời gian. Ở $r = 100\,r_s$, mép ngoài nghiêng 44,4°: gần như nón phẳng. Lỗ đen chỉ làm nón lệch rõ trong vài chục $r_s$ quanh nó.
          +++`,
        vao: (c) => c.cauHinh({ hien: { non: true, nonPhu: true, tia: false, phang: false }, m: 0, rDo: null, mayAnh: 'xa' }),
        nut: { phang: (c) => c.datPhang(true), boPhang: (c) => c.datPhang(false), ngang: (c) => c.goc('ngang') },
        thuThach: {
          de: 'Rê chuột lên các nón ở hai hàng bên trái, tìm nón có **mép ngoài dựng thẳng đứng**: tia sáng hướng ra ở đó không tiến ra được chút nào.',
          goiY: 'Màu của nón cho biết vùng: vàng ở ngoài, trắng ở đúng chân trời, đỏ cam bên trong. Ô chú giải ghi dr/dt* của mép ngoài.',
          kiem: (c) => c.thuThach.reNonDung(),
          giu: 0.4,
        },
      },
      {
        ten: 'Vì sao cần một cách đo thời gian khác',
        noiDung: R`
          Các bài trước đo thời gian bằng $t$ của {{metric Schwarzschild}}: đồng hồ của một người đứng yên ở **rất xa** lỗ đen. Dùng đồng hồ đó, tia sáng chạy theo phương bán kính thỏa

          $$ \frac{c\,\dd t}{\dd r} = \pm \frac{r}{r - r_s} $$

          Tới gần chân trời, vế phải tiến tới vô hạn: tia sáng như «đứng lại», nón khép thành một sợi chỉ, và người rơi cần $t \to \infty$ mới chạm chân trời. Thay số: ở $r = 1{,}1\,r_s$, $c\,\dd t/\dd r = 11$; ở $1{,}01\,r_s$ đã là 101.

          Nhưng người rơi không thấy gì lạ: đồng hồ của chính họ (thời gian riêng) trôi bình thường và họ vượt qua chân trời sau một khoảng hữu hạn. Cái hỏng là **đồng hồ được chọn để đặt tọa độ**, không phải không-thời gian.

          Cách sửa: đặt một thời gian mới gắn theo tia sáng rơi vào, gọi là thời gian {{tọa độ Eddington–Finkelstein}}:

          $$ t^* = t + \frac{r_s}{c}\ln\left|\frac{r}{r_s} - 1\right| $$

          Với $t^*$, mọi tia sáng rơi vào đều là đường thẳng 45°, kể cả khi đi qua chân trời.

          > [Thử ngay] Bản đồ tia sáng ở nửa trái: vàng là tia «đi ra», trắng là tia «đi vào». Đổi qua lại và nhìn chúng dựng đứng rồi thẳng lại ở chân trời.
          > [[Đo bằng thời gian Schwarzschild|schw]] [[Đo bằng thời gian t*|ef]]

          +++ Đi sâu: từ metric Schwarzschild sang metric Eddington–Finkelstein
          Đặt $r_s = c = 1$ và bỏ chiều góc. Metric Schwarzschild: $\dd s^2 = -(1 - 1/r)\,\dd t^2 + \dd r^2/(1 - 1/r)$.

          Từ $t = t^* - \ln|r - 1|$ có $\dd t = \dd t^* - \dd r/(r - 1)$. Thay vào và dùng $(1 - 1/r)/(r - 1) = 1/r$:

          $$ \dd s^2 = -\left(1 - \tfrac{1}{r}\right)\dd t^{*2} + \tfrac{2}{r}\,\dd t^*\dd r + \left[\tfrac{r}{r-1} - \tfrac{1}{r(r-1)}\right]\dd r^2 $$

          Ngoặc vuông bằng $(r^2 - 1)/(r(r-1)) = 1 + 1/r$. Vậy

          $$ \dd s^2 = -\left(1 - \tfrac{1}{r}\right)\dd t^{*2} + \tfrac{2}{r}\,\dd t^*\dd r + \left(1 + \tfrac{1}{r}\right)\dd r^2 + r^2\dd\varphi^2 $$

          Không hệ số nào vô hạn tại $r = 1$. Tia rơi vào: thử $\dd r = -\dd t^*$, được $-(1 - 1/r) - 2/r + 1 + 1/r = 0$ với mọi $r$.
          +++`,
        vao: (c) => c.cauHinh({ hien: { non: true, nonPhu: false, tia: true, phang: false }, m: 1, rDo: null, mayAnh: 'trai' }),
        nut: { schw: (c) => c.datM(1), ef: (c) => c.datM(0) },
      },
      {
        ten: 'Lại gần: nón nghiêng dần vào trong',
        noiDung: R`
          Giờ ta dùng $t^*$. Nón lớn phía trên là **nón dò**: kéo thanh **Bán kính nón dò** ở dưới để đưa nó vào gần lỗ đen.

          Mép trong của nón (tia rơi vào) luôn nghiêng 45°. Mép ngoài (tia hướng ra) thì dựng dần lên:

          $$ \frac{\dd r}{\dd t^*} = c\,\frac{r - r_s}{r + r_s} $$

          Ở đây $r$ là bán kính nơi phát sáng, $r_s$ là bán kính chân trời. Thay số:

          | $r$ | $\dd r/\dd t^*$ của tia ra | Góc so với trục thời gian |
          |---|---|---|
          | $6\,r_s$ | $0{,}71\,c$ | 35,5° |
          | $3\,r_s$ | $0{,}50\,c$ | 26,6° |
          | $2\,r_s$ | $0{,}33\,c$ | 18,4° |
          | $1{,}25\,r_s$ | $0{,}11\,c$ | 6,3° |

          Cả nón vì vậy nghiêng về phía lỗ đen. Ánh sáng hướng ra vẫn đi ra được, nhưng mỗi lúc một chậm hơn tính theo $t^*$. Mọi vật có khối lượng phải đi trong lòng nón, nên còn chậm hơn nữa.

          > [Thử ngay] Kéo đốm vàng ở đỉnh nón dò sang trái, sang phải dọc bán kính và nhìn mép ngoài dựng dần lên. Hoặc bấm: [[Nón ở 6 rs|r6]] [[Ở 3 rs|r3]] [[Ở 1,6 rs|r16]] [[Ở 1,25 rs|r125]]
          > Bật tiếng thì nghe một nốt kéo dài khi nón dò di chuyển: cao độ theo tốc độ đi ra của mép ngoài (quy đổi cho tai: tại chân trời là nốt La 220 Hz, mỗi $0{,}5\,c$ nhanh hơn thì cao lên một quãng tám, chậm hơn thì trầm xuống). Khi đỉnh nón đi qua chân trời có một tiếng chuông.

          > [Lưu ý] Độ nghiêng của nón phụ thuộc cách chọn tọa độ thời gian. Điều không phụ thuộc là **hướng nào tới được, hướng nào không**: mép nón luôn gồm đúng những tia sáng, như bước 7 sẽ cho thấy.

          +++ Đi sâu: vì sao mặt cắt của nón là một elip lệch tâm
          Đặt $r_s = c = 1$. Lấy một bước nhỏ dài $\dd t^* = \varepsilon$ theo thời gian, dịch $\dd r$ theo bán kính và $\dd n = r\,\dd\varphi$ theo phương ngang. Nó nằm trên nón khi $\dd s^2 = 0$:

          $$ \left(1 + \tfrac{1}{r}\right)\dd r^2 + \tfrac{2\varepsilon}{r}\dd r + \dd n^2 = \left(1 - \tfrac{1}{r}\right)\varepsilon^2 $$

          Nhân hai vế với $r$ rồi thêm bớt cho đủ bình phương:

          $$ (r + 1)\left(\dd r + \tfrac{\varepsilon}{r + 1}\right)^2 + r\,\dd n^2 = \frac{\varepsilon^2 r^2}{r + 1} $$

          Đó là một elip: tâm lệch vào trong $\varepsilon/(r + 1)$, bán trục theo bán kính $\varepsilon r/(r + 1)$, bán trục ngang $\varepsilon\sqrt{r/(r + 1)}$. Mép ngoài ở $\dd r = \varepsilon(r - 1)/(r + 1)$, mép trong ở $\dd r = -\varepsilon$. Thay $r = 3$: tâm lệch $0{,}25\varepsilon$, bán trục $0{,}75\varepsilon$ và $0{,}87\varepsilon$, mép ngoài $0{,}5\varepsilon$.
          +++`,
        vao: (c) => c.cauHinh({ hien: { non: true, nonPhu: true, tia: false, phang: false }, m: 0, rDo: 3, mayAnh: 'do' }),
        ra: (c) => c.ra(),
        nut: { r6: (c) => c.datRDo(6), r3: (c) => c.datRDo(3), r16: (c) => c.datRDo(1.6), r125: (c) => c.datRDo(1.25) },
        thuThach: {
          de: 'Kéo nón dò tới chỗ mà mép ngoài nghiêng đúng **20°** so với trục thời gian (lệch dưới 1,5°).',
          goiY: 'Nhãn trên nón dò ghi góc nghiêng. Theo bảng, 18,4° ở 2 rs và 26,6° ở 3 rs, nên chỗ cần tìm ở giữa, gần 2 rs hơn.',
          kiem: (c) => c.thuThach.goc20(),
          giu: 0.5,
        },
      },
      {
        ten: 'Tại chân trời: ánh sáng hướng ra đứng yên',
        noiDung: R`
          Đưa nón dò tới đúng $r = r_s$. Mép ngoài của nón **dựng thẳng đứng**: $\dd r/\dd t^* = 0$. Một chớp sáng phát hướng ra từ đúng chân trời không tiến được chút nào; nó ở lại $r = r_s$ mãi mãi. Phần còn lại của nón đều chĩa vào trong.

          Những đường thẳng đứng chạy dọc trụ vàng chính là các tia sáng như vậy. Chân trời **không phải một bề mặt vật chất**: không có vỏ, không có tường. Nó là một mặt do ánh sáng dệt nên, ranh giới giữa những sự kiện còn gửi được tín hiệu ra ngoài và những sự kiện không còn gửi được nữa.

          Vì thế người rơi qua chân trời không gặp gì đặc biệt tại chỗ. Với lỗ đen lớn, lực thủy triều ở đó còn nhỏ: chênh lệch gia tốc giữa đầu và chân một người cao 2 m chỉ khoảng một phần vạn $g$ ở Sgr A*. Nhưng ở lỗ đen 10 khối lượng Mặt Trời, con số ấy là khoảng 21 triệu $g$.

          > [Thử ngay] [[Đặt nón dò đúng ở chân trời|r1]] [[Hơi ngoài: 1,05 rs|r105]] [[Hơi trong: 0,95 rs|r095]]
          > Kéo đỉnh nón dò qua lại chân trời: đỉnh hơi bám vào vòng chân trời để dễ đặt đúng chỗ, và có tiếng chuông mỗi khi đi qua.

          > [Hiểu sai thường gặp] «Chân trời là chỗ lực hấp dẫn bỗng mạnh vô hạn.» Không. Độ cong ở đó hữu hạn (bước 7). Thứ vô hạn ở chân trời là cái giá để **đứng yên** tại đó (bước 8), vì đứng yên ở chân trời đòi hỏi đi bằng tốc độ ánh sáng ra ngoài.

          +++ Đi sâu: lực thủy triều ở chân trời
          Chênh lệch gia tốc theo phương bán kính giữa hai điểm cách nhau $L$ là $\Delta a \approx 2GM L/r^3$ (Bài 12). Tại $r = r_s = 2GM/c^2$:

          $$ \Delta a = \frac{c^2}{r_s^2}\,L $$

          Nó tỉ lệ nghịch với bình phương $r_s$, tức với bình phương khối lượng: lỗ đen càng nặng, chân trời càng «êm». Sgr A*: $r_s = 1{,}27 \times 10^{10}$ m, $\Delta a \approx 1{,}1 \times 10^{-3}$ m/s² với $L = 2$ m. Lỗ đen 10 khối lượng Mặt Trời: $r_s = 29{,}5$ km, $\Delta a \approx 2{,}1 \times 10^{8}$ m/s².
          +++`,
        vao: (c) => c.cauHinh({ hien: { non: true, nonPhu: true, tia: false, phang: false, chanTroi: true }, m: 0, rDo: 1, mayAnh: 'trong' }),
        ra: (c) => c.ra(),
        nut: { r1: (c) => c.datRDo(1), r105: (c) => c.datRDo(1.05), r095: (c) => c.datRDo(0.95) },
        thuThach: {
          de: 'Kéo nón dò vào **bên trong** chân trời, tới chỗ mà ngay mép ngoài cũng đã nghiêng **5° vào trong** (lệch dưới 2°).',
          goiY: 'Ngay trong chân trời mép ngoài chỉ hơi nghiêng vào; càng vào sâu càng nghiêng nhiều. Chỗ cần tìm cách tâm khoảng 0,84 rs. Cuộn chuột để phóng to; bấm vào đốm vàng rồi dùng phím mũi tên để nhích từng chút.',
          kiem: (c) => c.thuThach.goc5Trong(),
          giu: 0.5,
        },
      },
      {
        ten: 'Bên trong: mọi tương lai dẫn về r = 0',
        noiDung: R`
          Đưa nón dò vào trong chân trời (nón đỏ cam). Giờ **cả hai mép** đều hướng vào tâm: tia «đi ra» cũng có $\dd r/\dd t^* \lt 0$. Mọi đường thế giới nằm trong nón, nên mọi vật, dù bật tên lửa theo hướng nào, đều có $r$ giảm dần. Ở $r = 0{,}6\,r_s$, ngay tia «đi ra» cũng rơi vào với $\dd r/\dd t^* = -0{,}25\,c$.

          Bên trong chân trời, $r$ đóng vai **thời gian**: giảm $r$ giống như đi tới ngày mai, không ai ngăn được. Vì vậy kỳ dị $r = 0$ không phải một nơi nằm phía trước mà ta có thể lách qua; nó là **một thời điểm** nằm trong tương lai của mọi người đã vào trong.

          Thời gian riêng còn lại là hữu hạn. Lâu nhất là

          $$ \tau_{\max} = \frac{\pi}{2}\,\frac{r_s}{c} $$

          đạt được khi thả rơi tự do từ đứng yên ngay tại chân trời. Bật tên lửa chỉ làm thời gian này **ngắn đi**: ở đây đường rơi tự do là đường có thời gian riêng dài nhất, giống chuyện anh em sinh đôi ở Bài 6.

          > [Thử ngay] [[Nón dò ở 0,85 rs|r085]] [[Ở 0,6 rs|r06]] [[Ở 0,35 rs|r035]]
          > Kéo nón dò vào sâu: ô số liệu ghi một người rơi từ rất xa, khi đi qua chỗ ấy, còn bao nhiêu thời gian riêng trước khi tới kỳ dị.

          +++ Đi sâu: vì sao lâu nhất là π/2
          Đặt $r_s = c = 1$. Bên trong, $1 - 1/r \lt 0$ nên trong metric Schwarzschild số hạng $\dd t^2$ đổi sang dấu dương và số hạng $\dd r^2$ đổi sang dấu âm: $r$ là tọa độ kiểu thời gian. Với vật rơi tự do có năng lượng riêng $E$:

          $$ \left(\frac{\dd r}{\dd\tau}\right)^2 = E^2 - \left(1 - \frac{1}{r}\right) \ge \frac{1}{r} - 1 $$

          nên $|\dd r/\dd\tau| \ge \sqrt{1/r - 1}$, và

          $$ \tau \le \int_0^1 \sqrt{\frac{r}{1 - r}}\,\dd r = \frac{\pi}{2} $$

          (đổi biến $r = \sin^2\theta$). Dấu bằng khi $E = 0$: vật đứng yên đúng tại chân trời rồi buông. Người rơi từ rất xa có $E = 1$ nên chỉ còn $2/3$.
          +++`,
        vao: (c) => c.cauHinh({ hien: { non: true, nonPhu: true, tia: false, phang: false }, m: 0, rDo: 0.6, mayAnh: 'trong' }),
        ra: (c) => c.ra(),
        nut: { r085: (c) => c.datRDo(0.85), r06: (c) => c.datRDo(0.6), r035: (c) => c.datRDo(0.35) },
        thuThach: {
          de: 'Kéo nón dò tới chỗ mà người rơi tự do từ rất xa, khi đi qua đó, chỉ còn đúng **0,2 rs/c** thời gian riêng trước khi tới kỳ dị (lệch dưới 0,03).',
          goiY: 'Người rơi từ rất xa còn $\\tau = \\tfrac{2}{3}\\,(r/r_s)^{3/2}$ (thẻ Tóm tắt, công thức 4). Đọc dòng «Người rơi từ xa đi qua đây» trong ô số liệu; cuộn chuột để phóng to cho dễ đặt.',
          kiem: (c) => c.thuThach.tau02(),
          giu: 0.5,
        },
      },
      {
        ten: 'Người rơi và người ở xa',
        noiDung: R`
          Sang nửa phải. **Đường hồng** là đường thế giới của một phi hành gia rơi tự do từ rất xa; lúc $t^* = 0$ họ đi qua $r = 6\,r_s$. Các chấm trắng trên đường đánh dấu mỗi $r_s/c$ thời gian riêng. Cứ mỗi $0{,}6\,r_s/c$ đồng hồ của họ, họ bật một **chớp sáng** (chấm vàng). Nét vàng đậm là phần ánh sáng hướng ra, nét mờ là phần hướng vào. **Đường xanh** thẳng đứng là một người đứng yên ở $r = 7\,r_s$.

          - 16 chớp đầu thoát ra. Khoảng cách giữa hai lần nhận, đo bằng đồng hồ người ở xa, tăng dần: 0,95; 0,96; 0,98; … ; 2,11; 4,23 $r_s/c$ (đồ thị ở dưới).
          - Chớp thứ 16 phát ở $r \approx 1{,}13\,r_s$ là chớp **cuối cùng** tới nơi. Phát càng sát chân trời thì tới càng muộn, không có giới hạn.
          - Chớp thứ 17 phát ở $r \approx 0{,}45\,r_s$, bên trong: cả hai nửa của nó đều rơi vào kỳ dị.

          Người ở xa thấy hình ảnh phi hành gia **chậm dần, đỏ dần, mờ dần**, không bao giờ thấy cảnh vượt chân trời. Còn phi hành gia thì vượt qua sau $9{,}13\,r_s/c$ thời gian riêng và tới kỳ dị sau $9{,}80$: chỉ thêm $2/3\,r_s/c$.

          > [Thử ngay] [[Chạy lại từ đầu|lai]] [[Hiện hết một lần|het]] [[Nhìn gần chân trời|gan]]
          > Kéo đốm xanh lục trên đường của người ở xa để tự dời tấm «bây giờ» lên xuống. Rê chuột lên một chấm vàng để đọc chớp ấy phát ở đâu, tới lúc nào.
          > Bật tiếng: tai trái nghe một tiếng «tích» lúc mỗi chớp được bật (theo $t^*$ của sơ đồ), tai phải nghe một nốt lúc người ở xa nhận được chớp ấy, cao độ $660 \times 0{,}6/\Delta t_{\text{nhận}}$ Hz, tức tỉ lệ với tần số nhận được (quy đổi cho tai). Bên phải thưa dần, trầm dần rồi im hẳn sau chớp 16, trong khi bên trái vẫn tích tới chớp 17.

          +++ Đi sâu: khi nào chớp tới nơi
          Đặt $r_s = c = 1$. Tia hướng ra thỏa $t^* = r + 2\ln|r - 1| + C$. Chớp phát ở $(t^*_e,\ r_e)$ tới $r = 7$ lúc

          $$ t^*_{\text{nhận}} = t^*_e + (7 - r_e) + 2\ln\frac{6}{r_e - 1} $$

          Số hạng logarit tăng không giới hạn khi $r_e \to 1$: mỗi lần phi hành gia tới gần chân trời thêm $e$ lần thì chớp tới muộn thêm 2 đơn vị. Người ở xa đứng yên nên đồng hồ của họ chạy theo $\sqrt{1 - 1/7} \approx 0{,}926$ lần $\dd t^*$. Tỉ số «khoảng nhận / khoảng phát» chính là $1 + z$: ánh sáng đỏ đi đúng bấy nhiêu lần.
          +++`,
        vao: (c) => c.cauHinh({ hien: { non: false, nonPhu: false, tia: false, phang: false, roi: true }, m: 0, rDo: null, T: 0, chay: true, mayAnh: 'phai' }),
        nut: { lai: (c) => c.chayLai(), het: (c) => c.hienHet(), gan: (c) => c.goc('gan') },
        thuThach: {
          de: 'Kéo tấm «bây giờ» (đốm xanh lục) tới đúng lúc người ở xa vừa nhận **chớp cuối cùng**, chớp 16 (chậm không quá 1 rs/c).',
          goiY: 'Chớp 16 phát ở r ≈ 1,13 rs nhưng tới r = 7 rs rất muộn, ở khoảng t* = 24,3. Ô số liệu ghi số chớp đã nhận.',
          kiem: (c) => c.thuThach.chopCuoi(),
          giu: 0.4,
        },
      },
      {
        ten: 'Hai hệ tọa độ, một không-thời gian',
        noiDung: R`
          Cùng những sự kiện ấy, giờ vẽ lại bằng thời gian Schwarzschild $t$ (kéo thanh **Trộn tọa độ** hoặc bấm nút). Đường thế giới của phi hành gia vọt lên vô hạn ngay trước chân trời; phần bên trong hiện ra như từ trên trời rơi xuống. Các nón gần chân trời bị kéo dài thành sợi chỉ; nón bên trong ngả hẳn sang ngang.

          Không sự kiện nào thay đổi: vẫn 17 chớp, vẫn 16 chớp tới nơi, vẫn tới kỳ dị sau $9{,}80\,r_s/c$ thời gian riêng. Chỉ có **nhãn thời gian** dán lên sự kiện là khác. Cảnh «đóng băng ở chân trời» là do cách đặt tọa độ.

          Muốn biết chỗ nào hỏng thật, phải dùng một đại lượng không phụ thuộc tọa độ. {{Bất biến Kretschmann}} đo độ mạnh của độ cong:

          $$ K = \frac{12\,r_s^2}{r^6} $$

          Tại chân trời $K = 12/r_s^4$: hữu hạn. Vậy $r = r_s$ chỉ là {{kỳ dị tọa độ}}, giống kinh độ mất nghĩa ở Bắc Cực dù Bắc Cực chẳng có gì lạ. Tại $r = 0$, $K \to \infty$: đó là kỳ dị thật. Ở $r = 0{,}1\,r_s$, $K$ đã lớn gấp một triệu lần ở chân trời.

          > [Thử ngay] [[Thời gian Schwarzschild|schw]] [[Thời gian t*|ef]] [[Dừng ở giữa|giua]]

          > [Lưu ý] Vùng sát chân trời ($|r - r_s| \lt 0{,}00002\,r_s$) bị cắt khi vẽ bằng thời gian Schwarzschild vì ở đó $t$ tiến tới vô hạn.`,
        vao: (c) => c.cauHinh({ hien: { non: true, nonPhu: false, tia: false, phang: false, roi: true }, m: 0, rDo: null, T: Y_MAX, chay: false, mayAnh: 'toan', mDich: 1 }),
        nut: { schw: (c) => c.datM(1), ef: (c) => c.datM(0), giua: (c) => c.datM(0.5) },
      },
      {
        ten: 'Con số thật',
        noiDung: R`
          Mọi kết quả trên tính theo đơn vị $r_s$ và $r_s/c$. Đổi sang lỗ đen thật bằng $r_s = 2GM/c^2$ (khoảng 2,95 km cho mỗi khối lượng Mặt Trời):

          Sgr A* nặng 4,3 triệu, M87* nặng 6,5 tỉ khối lượng Mặt Trời ($M_\odot$).

          | Lỗ đen | $r_s$ · $r_s/c$ | Rơi từ xa: chân trời → kỳ dị | Lâu nhất có thể |
          |---|---|---|---|
          | Sgr A* | 12,7 triệu km · 42 s | 28 s | 67 s |
          | M87* | 128 AU · 17,8 giờ | 12 giờ | 28 giờ |
          | 10 $M_\odot$ | 29,5 km · 98 µs | 66 µs | 155 µs |

          (µs: micro giây, một phần triệu giây.)

          Bên trong chân trời **không thể đứng yên**: đứng yên nghĩa là giữ $r$ không đổi, mà $r$ giờ là thời gian. Ngay bên ngoài thì đứng yên được, nhưng phải trả giá. Gia tốc riêng cần để lơ lửng ở $r_0$:

          $$ a = \frac{c^2}{r_s}\cdot\frac{r_s^2}{2r_0^2}\cdot\frac{1}{\sqrt{1 - r_s/r_0}} $$

          Thừa số cuối tiến tới vô hạn ở chân trời. Ở $r_0 = 1{,}01\,r_s$ cần $4{,}93\,c^2/r_s$; với Sgr A* là khoảng 3,6 triệu $g$.

          > [Tóm lại] Ngoài chân trời nón nghiêng dần; tại chân trời mép ngoài dựng đứng; bên trong cả nón chĩa về $r = 0$. Chân trời là mặt do ánh sáng dệt nên; kỳ dị là một thời điểm. Hai hệ tọa độ, cùng một không-thời gian.

          [[Toàn cảnh|toan]]`,
        vao: (c) => c.cauHinh({ hien: { non: true, nonPhu: true, tia: true, phang: false, roi: true }, m: 0, rDo: null, T: Y_MAX, chay: false, mayAnh: 'toan' }),
        nut: { toan: (c) => c.goc('toan') },
      },
    ],
    congThuc: [
      { ten: 'Thời gian Eddington–Finkelstein', tex: R`t^* = t + \frac{r_s}{c}\ln\left|\frac{r}{r_s} - 1\right|`, y: '$t$ là thời gian Schwarzschild (đồng hồ ở rất xa). Với $t^*$, tia sáng rơi vào luôn nghiêng 45°.' },
      { ten: 'Metric Eddington–Finkelstein (r_s = c = 1)', tex: R`\dd s^2 = -\left(1 - \tfrac{1}{r}\right)\dd t^{*2} + \tfrac{2}{r}\,\dd t^*\dd r + \left(1 + \tfrac{1}{r}\right)\dd r^2 + r^2\dd\varphi^2`, y: 'Không hệ số nào vô hạn tại $r = 1$: tọa độ dùng được cả trong lẫn ngoài chân trời.' },
      { ten: 'Tia sáng hướng ra', tex: R`\frac{\dd r}{\dd t^*} = c\,\frac{r - r_s}{r + r_s}`, y: 'Dương ở ngoài, bằng 0 tại chân trời, âm bên trong. Tia rơi vào luôn có $\\dd r/\\dd t^* = -c$.' },
      { ten: 'Thời gian riêng của người rơi từ rất xa', tex: R`\tau(r \to 0) = \frac{2}{3}\,\frac{r_s}{c}\left(\frac{r}{r_s}\right)^{3/2}`, y: 'Từ chân trời tới kỳ dị: $\\tfrac{2}{3}\\,r_s/c$. Lâu nhất có thể ở bên trong: $(\\pi/2)\\,r_s/c$.' },
      { ten: 'Bất biến Kretschmann', tex: R`K = R_{abcd}R^{abcd} = \frac{12\,r_s^2}{r^6}`, y: 'Hữu hạn tại $r = r_s$ (kỳ dị tọa độ), vô hạn tại $r = 0$ (kỳ dị thật).' },
    ],
    cauHoi: [
      {
        hoi: 'Trong tọa độ Eddington–Finkelstein, tại đúng chân trời, mép ngoài của nón ánh sáng thế nào?',
        chon: ['Nằm ngang: ánh sáng đi ra nhanh vô hạn', 'Nghiêng 45° ra ngoài như ở xa', 'Dựng thẳng đứng: ánh sáng hướng ra đứng yên tại r = rs', 'Biến mất: ở chân trời không có nón'],
        dung: 2,
        giai: R`$\dd r/\dd t^* = c(r - r_s)/(r + r_s) = 0$ tại $r = r_s$. Chớp sáng hướng ra phát ở đúng chân trời ở lại đó mãi; các tia như vậy dệt nên mặt chân trời. Chọn «biến mất» là nhầm với hình vẽ bằng thời gian Schwarzschild, nơi nón khép lại vì tọa độ hỏng.`,
      },
      {
        hoi: 'Phi hành gia rơi từ rất xa vào lỗ đen 10 khối lượng Mặt Trời. Theo đồng hồ của họ, từ lúc vượt chân trời tới lúc tới kỳ dị mất bao lâu?',
        chon: ['Vô hạn', 'Khoảng 66 micro giây', 'Khoảng 98 giây', 'Khoảng 28 giây'],
        dung: 1,
        giai: R`$\tau = \tfrac{2}{3}\,r_s/c$ với $r_s = 29{,}5$ km: $\tfrac{2}{3} \times 29\,500 / 299\,792\,458 \approx 6{,}6 \times 10^{-5}$ s. «Vô hạn» là thời gian theo đồng hồ người ở xa, không phải của người rơi. 28 giây là con số của Sgr A*.`,
      },
      {
        hoi: 'Vì sao người ở xa không bao giờ thấy phi hành gia vượt qua chân trời?',
        chon: ['Vì phi hành gia dừng lại trước chân trời', 'Vì ánh sáng phát càng sát chân trời tới càng muộn, và ánh sáng phát ngay tại chân trời không bao giờ ra được', 'Vì chân trời là bức tường chắn sáng', 'Vì lực thủy triều xé phi hành gia trước khi tới chân trời'],
        dung: 1,
        giai: 'Thời điểm nhận có số hạng $2\\ln(6/(r_e - 1))$ tăng không giới hạn khi $r_e \\to r_s$. Phi hành gia không hề dừng: họ vượt qua sau thời gian riêng hữu hạn. Với lỗ đen lớn, lực thủy triều ở chân trời rất nhỏ.',
      },
      {
        hoi: 'Đang ở bên trong chân trời, phi hành gia bật tên lửa hết cỡ hướng ra ngoài. Điều gì xảy ra?',
        chon: ['Họ thoát ra được nếu tên lửa đủ mạnh', 'Họ đứng yên được ở một bán kính', 'Họ vẫn tới r = 0, và thời gian riêng còn lại không dài hơn khi rơi tự do', 'Họ tới r = 0 ngay lập tức'],
        dung: 2,
        giai: 'Bên trong, cả nón ánh sáng chĩa vào tâm nên mọi đường thế giới có $r$ giảm. Bật tên lửa chỉ đổi đường thế giới sang một đường khác trong nón, và đường rơi tự do mới là đường có thời gian riêng dài nhất (tối đa $(\\pi/2)\\,r_s/c$).',
      },
      {
        hoi: 'Trong metric Schwarzschild, hệ số của dr² vô hạn tại r = rs. Điều đó có nghĩa gì?',
        chon: ['Độ cong không-thời gian vô hạn tại chân trời', 'Tọa độ Schwarzschild hỏng tại đó; độ cong vẫn hữu hạn (K = 12/rs⁴)', 'Không gian bị xé rách tại chân trời', 'Ánh sáng không đi qua được chân trời theo cả hai chiều'],
        dung: 1,
        giai: 'Bất biến Kretschmann $12\\,r_s^2/r^6$ không phụ thuộc tọa độ và hữu hạn tại $r = r_s$. Đổi sang $t^*$ thì mọi hệ số đều hữu hạn ở đó. Ánh sáng vẫn đi **vào** qua chân trời bình thường; chỉ không đi **ra** được.',
      },
      {
        hoi: 'Giải thích câu: «Bên trong lỗ đen, kỳ dị không phải một nơi mà là một thời điểm.»',
        dap: 'Bên trong chân trời, nón ánh sáng của mọi sự kiện đều chĩa về phía $r$ nhỏ hơn: $r$ giảm dọc mọi đường thế giới, giống như thời gian luôn tăng. Vì vậy $r = 0$ nằm trong **tương lai** của mọi người đã vào trong, chứ không nằm ở một hướng trong không gian mà ta có thể quay đi chỗ khác. Không thể tránh nó cũng như không thể tránh ngày mai; chỉ có thể tới đó sớm hơn (bật tên lửa) hoặc muộn nhất sau $(\\pi/2)\\,r_s/c$.',
      },
    ],
    docThem: [
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 12: tọa độ Eddington–Finkelstein, nón ánh sáng quanh lỗ đen, rơi vào lỗ đen.',
      'E. F. Taylor, J. A. Wheeler và E. Bertschinger, *Exploring Black Holes* (bản 2): người rơi tự do từ xa («rain frame»), bên trong chân trời.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): lịch sử khái niệm chân trời và kỳ dị, kể không cần toán.',
      'C. W. Misner, K. S. Thorne và J. A. Wheeler, *Gravitation* (1973): phần về hình học Schwarzschild và các hệ tọa độ phủ cả bên trong.',
    ],
    thuatNgu: [
      { vi: 'tọa độ Eddington–Finkelstein', en: 'Eddington–Finkelstein coordinates', nghia: 'Hệ tọa độ cho lỗ đen trong đó thời gian $t^* = t + (r_s/c)\\ln|r/r_s - 1|$ gắn theo tia sáng rơi vào. Không hỏng ở chân trời, nên vẽ được cả bên trong.' },
      { vi: 'kỳ dị tọa độ', en: 'coordinate singularity', nghia: 'Chỗ mà công thức viết trong một hệ tọa độ cho ra vô hạn, nhưng đổi tọa độ thì hết. Ví dụ $r = r_s$ trong metric Schwarzschild, hay kinh độ ở Bắc Cực.' },
      { vi: 'bất biến Kretschmann', en: 'Kretschmann scalar', nghia: 'Con số $R_{abcd}R^{abcd}$ đo độ mạnh của độ cong, giống nhau trong mọi hệ tọa độ. Quanh lỗ đen Schwarzschild bằng $12\\,r_s^2/r^6$.' },
      { vi: 'mặt kiểu ánh sáng', en: 'null surface', nghia: 'Mặt trong không-thời gian được dệt bằng các tia sáng, như chân trời sự kiện. Chỉ đi qua được theo một chiều.' },
    ],
  },

  conSo: [
    '**(π/2)·rs/c**: thời gian riêng dài nhất có thể sống bên trong chân trời; với Sgr A* là 67 giây.',
    '**2/3·rs/c**: người rơi từ rất xa đi từ chân trời tới kỳ dị; với Sgr A* là 28 giây, với lỗ đen 10 khối lượng Mặt Trời là 66 micro giây.',
    '**12 rs²/r⁶**: bất biến độ cong Kretschmann; hữu hạn ở chân trời, vô hạn ở tâm.',
    '**3,6 triệu g**: gia tốc cần để lơ lửng ở 1,01 rs quanh Sgr A*.',
  ],
  hieuDung: '**Người rơi không bị «đóng băng» ở chân trời.** Cảnh đóng băng chỉ là thứ người ở xa thấy, do ánh sáng phát gần chân trời tới muộn dần không giới hạn. Theo đồng hồ của chính mình, người rơi vượt qua chân trời và tới kỳ dị sau một thời gian hữu hạn.',
  nguon: 'Công thức: J. B. Hartle, Gravity (2003), ch. 12; Taylor, Wheeler và Bertschinger, Exploring Black Holes. Khối lượng Sgr A*: GRAVITY Collaboration (khoảng 4,3 triệu khối lượng Mặt Trời). Khối lượng M87*: Event Horizon Telescope 2019, ApJL 875, L1 (6,5 tỉ). Hằng số: CODATA 2018, IAU 2012. Mọi con số khác tính bằng mã và kiểm trong kiem-tra/kiem-non-lo-den.mjs.',

  tao(app) {
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 2600, hat: 16, doSang: 0.42 }));
    const am = app.am, tt = app.tt, camera = app.camera;

    const S = {
      m: 0, mDich: null, T: Y_MAX, chay: false, rDo: null, rDoDich: null, daKeoT: false,
      hien: { non: true, nonPhu: true, tia: false, phang: false, roi: false, chanTroi: false },
    };
    const CHOP = EF.chopSang({ r0: R0, dTau: D_TAU, rQS: R_QS });
    const lnSau = Math.log(6);
    // t hiển thị: trộn giữa t* (m = 0) và t Schwarzschild dời cho khớp ở r = 7 (m = 1)
    const yHien = (ts, r) => (S.m === 0 ? ts : ts - S.m * (Math.log(Math.abs(r - 1)) - lnSau));
    const hopLe = (r, y) => (S.m < 1e-4 || Math.abs(r - 1) > CAT_GAN) && y >= -0.02 && y <= Y_MAX + 0.4;

    // =====================================================================
    // Nền: sàn cực, trục, chân trời, kỳ dị, mặt cầu photon
    // =====================================================================
    const nhomNen = new THREE.Group();
    scene.add(nhomNen);
    {
      // Sàn: đĩa tối có lưới cực vẽ trong shader (vòng mỗi 1 rs đậm, mỗi 0,5 rs mờ, tia mỗi 15°), mờ dần ra mép,
      // quầng vàng nhẹ quanh vòng chân trời.
      const mat = new THREE.ShaderMaterial({
        uniforms: { uRMax: { value: R_SAN } },
        vertexShader: /* glsl */ `varying vec3 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uRMax; varying vec3 vP;
          float net(float x, float rong) { float d = abs(fract(x + 0.5) - 0.5) / max(fwidth(x), 1e-6); return 1.0 - smoothstep(rong * 0.5 - 0.3, rong * 0.5 + 0.8, d); }
          void main() {
            float r = length(vP.xz), phi = atan(vP.z, vP.x);
            float chinh = net(r, 1.6) * step(1.2, r);
            float phu = net(r * 2.0, 1.0) * (1.0 - chinh) * smoothstep(5.0, 14.0, 1.0 / max(fwidth(r * 2.0), 1e-6));
            float tia = net(phi / 0.2617994, 1.0) * smoothstep(1.05, 1.6, r);
            float mo = 1.0 - smoothstep(uRMax * 0.72, uRMax, r);
            vec3 c = vec3(0.010, 0.016, 0.036) * (0.55 + 0.45 * smoothstep(0.0, 5.0, r));
            c += vec3(0.32, 0.4, 0.62) * (0.26 * chinh + 0.07 * phu + 0.06 * tia) * mo;
            c += vec3(1.0, 0.72, 0.32) * 0.5 * exp(-(((r - 1.0) / 0.09) * ((r - 1.0) / 0.09)));
            c += vec3(0.55, 0.4, 1.0) * 0.12 * exp(-(((r - 1.5) / 0.03) * ((r - 1.5) / 0.03))) * step(0.5, fract(phi * 9.549));
            gl_FragColor = vec4(c, 0.92 * mo);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      mat.tuyenTinh = true;
      const san = new THREE.Mesh(new THREE.CircleGeometry(R_SAN, 128), mat);
      san.rotation.x = -Math.PI / 2; san.position.y = -0.02; san.renderOrder = -5;
      nhomNen.add(san);
      for (let k = 1; k <= 7; k++) {
        const n = taoNhan(k === 1 ? '1 rs' : String(k), 'mo tran giua');
        n.position.set(-k, 0, 0.42);
        nhomNen.add(n);
      }
      const nr = taoNhan(chuCanh("canh.r-don-vi-rs", "r (đơn vị rs)"), 'mo tran');
      nr.position.set(-R_SAN - 1.1, 0, 0.42);           // đứng riêng bên trái số 7, không đè lên số
      nhomNen.add(nr);
    }
    // trục thời gian
    const xTruc = -R_SAN - 0.4;
    nhomNen.add(muiTen([xTruc, 0, 0], [xTruc, Y_MAX + 1.2, 0], { mau: new THREE.Color(MAU_KTG.thoiGian).multiplyScalar(1.3), rong: 2, doMo: 0.9, dau: 0.5 }));
    const nhanTruc = taoNhan('', 'xanh tran');
    nhanTruc.position.set(xTruc, Y_MAX + 1.3, 0);
    nhomNen.add(nhanTruc);
    for (let y = 2; y <= Y_MAX; y += 2) {
      const chinh = y % 4 === 0;
      if (chinh) { const n = taoNhan(String(y), 'mo tran'); n.position.set(xTruc, y, 0); nhomNen.add(n); }
      nhomNen.add(duongDayTinh([xTruc - (chinh ? 0.2 : 0.1), y, 0, xTruc + (chinh ? 0.2 : 0.1), y, 0], { mau: MAU_KTG.thoiGian, rong: chinh ? 1.6 : 1.1, doMo: chinh ? 0.8 : 0.45 }).line);
    }

    // Chân trời: mặt trụ r = 1 dệt bằng các tia sáng thẳng đứng (tia «đi ra» đứng yên tại r = rs). Những chấm sáng chạy
    // lên dọc mỗi tia: ánh sáng ấy không tiến ra được chút nào, chỉ đi tới tương lai.
    const nhomCT = new THREE.Group();
    scene.add(nhomCT);
    const matCT = new THREE.ShaderMaterial({
      uniforms: { uT: GIO, uSang: { value: 1 }, uCao: { value: Y_MAX } },
      vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vP; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform float uT, uSang, uCao; varying vec2 vUv; varying vec3 vP;
        void main() {
          vec3 n = normalize(vec3(vP.x, 0.0, vP.z));
          vec3 v = normalize(cameraPosition - vP);
          float fr = pow(1.0 - abs(dot(n, v)), 2.2);
          float o = vUv.x * 36.0;
          float tia = 1.0 - smoothstep(0.2, 1.3, abs(fract(o - 0.5) - 0.5) / max(fwidth(o), 1e-6));
          float y = vUv.y * uCao;
          float xung = pow(0.5 + 0.5 * sin((y - uT * 1.1) * 0.9 + floor(o) * 2.39), 14.0);
          float mep = smoothstep(0.06, 0.0, vUv.y) + smoothstep(0.94, 1.0, vUv.y);
          vec3 mau = vec3(1.0, 0.84, 0.52);
          float a = uSang * (0.01 + 0.1 * fr + tia * (0.04 + 0.5 * xung) * (0.3 + 0.7 * fr) + 0.3 * mep);
          gl_FragColor = vec4(mau * a, 1.0);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    matCT.tuyenTinh = true;
    const truCT = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, Y_MAX, 96, 1, true), matCT);
    truCT.position.y = Y_MAX / 2;
    nhomCT.add(truCT);
    for (const y of [0.01, Y_MAX]) {
      const q = [];
      for (let i = 0; i <= 128; i++) { const a = (i / 128) * 2 * Math.PI; q.push(Math.cos(a), y, Math.sin(a)); }
      nhomCT.add(duongDayTinh(q, { mau: MAU_NGOAI, rong: 2.6, doMo: 1, quang: 0.14, sang: 1.8 }).line);
    }
    const nhanCT = taoNhan(chuCanh("canh.chan-troi-r-rs-mat-do-anh-sang", "Chân trời r = rs<small>mặt do ánh sáng dệt nên</small>"), 'vang dam');
    nhanCT.position.set(0.7, Y_MAX + 0.4, -0.7);
    nhomCT.add(nhanCT);
    // Mặt cầu photon (r = 1,5): chỉ hai vòng đứt nét ở đáy và đỉnh, không che hình
    const nhomPhoton = new THREE.Group();
    scene.add(nhomPhoton);
    for (const y of [0.02, Y_MAX]) {
      const q = [];
      for (let i = 0; i <= 120; i++) { const a = (i / 120) * 2 * Math.PI; q.push(1.5 * Math.cos(a), y, 1.5 * Math.sin(a)); }
      nhomPhoton.add(duongDayTinh(q, { mau: MAU_KTG.tim, rong: 1.3, doMo: 0.6, net: [0.12, 0.1] }).line);
    }
    {
      const n = taoNhan(chuCanh("canh.mat-cau-photon-1-5-rs", "mặt cầu photon 1,5 rs"), 'mo tran');
      n.element.style.color = '#c8aaff';
      n.position.set(1.5 * Math.cos(-1.2), 0.05, 1.5 * Math.sin(-1.2));   // lùi ra phía sau bên phải, tránh dãy số của trục r
      nhomPhoton.add(n);
    }
    // Kỳ dị: đường răng cưa phát sáng dọc trục
    {
      const q = [];
      for (let i = 0; i <= 150; i++) { const y = (i / 150) * Y_MAX; const s = i % 2 ? 0.065 : -0.065; q.push(s, y, -s); }
      scene.add(duongDayTinh(q, { mau: MAU_TRONG, rong: 2.2, doMo: 1, quang: 0.12, sang: 1.6 }).line);
      const n = taoNhan(chuCanh("canh.ky-di-r-0-mot-thoi-diem-khong", "Kỳ dị r = 0<small>một thời điểm, không phải một nơi</small>"), 'dam');
      n.element.style.color = '#ff8a73';
      n.position.set(-0.2, Y_MAX + 2.7, 0);
      scene.add(n);
    }
    // Vật vô hình để rê chuột: trục kỳ dị (trụ mảnh)
    const vatKyDi = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, Y_MAX, 8, 1, true), new THREE.MeshBasicMaterial({ visible: false }));
    vatKyDi.position.y = Y_MAX / 2;
    scene.add(vatKyDi);

    // Tấm «bây giờ» t* = T (chỉ hiện khi đo bằng t*): kính xanh lục mỏng, viền sáng
    const kinh = new THREE.Group();
    {
      const tam = new THREE.Mesh(new THREE.CircleGeometry(R_SAN, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(MAU_KTG.hienTai).multiplyScalar(0.5), transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      tam.rotation.x = -Math.PI / 2;
      kinh.add(tam);
      const q = [];
      for (let i = 0; i <= 128; i++) { const a = (i / 128) * 2 * Math.PI; q.push(R_SAN * Math.cos(a), 0, R_SAN * Math.sin(a)); }
      kinh.add(duongDayTinh(q, { mau: MAU_KTG.hienTai, rong: 1.6, doMo: 0.8, sang: 1.4 }).line);
      const nk = taoNhan(chuCanh("canh.bay-gio-t-hang-so", "«bây giờ» t* = hằng số"), 'tran');
      nk.element.style.color = '#8fe3a8';
      nk.position.set(-R_SAN * 0.45, 0.15, R_SAN * 0.88);
      kinh.userData.nhan = nk;
      kinh.add(nk);
    }
    scene.add(kinh);

    // =====================================================================
    // Bản đồ tia sáng ở nửa trái (mặt phẳng φ = π)
    // =====================================================================
    const nhomTia = new THREE.Group();
    scene.add(nhomTia);
    const tiaRaNen = new DoanDay(4000, { mau: MAU_NGOAI, rong: 1.5, doMo: 0.75, sang: 1.25, quang: 0.05 });
    const tiaVaoNen = new DoanDay(2000, { mau: 0xdfe6ff, rong: 1.1, doMo: 0.35 });
    nhomTia.add(tiaRaNen.line, tiaVaoNen.line);
    {
      const tam = new THREE.Mesh(new THREE.PlaneGeometry(R_SAN, Y_MAX), new THREE.MeshBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.02, side: THREE.DoubleSide, depthWrite: false }));
      tam.position.set(-R_SAN / 2, Y_MAX / 2, 0);
      nhomTia.add(tam);
    }
    const R_NGOAI = Array.from({ length: 110 }, (_, i) => 1 + Math.exp(Math.log(1e-3) + (i / 109) * (Math.log(R_SAN - 1) - Math.log(1e-3))));
    const R_TRONG = Array.from({ length: 70 }, (_, i) => 1 - Math.exp(Math.log(1e-3) + (i / 69) * (0 - Math.log(1e-3)))).concat([0]);
    function veDuongR(dd, dsR, tsCuaR, phi, tMax = Infinity) {
      const c = Math.cos(phi), s = Math.sin(phi);
      let truoc = null;
      for (const r of dsR) {
        const ts = tsCuaR(r);
        const y = yHien(ts, r);
        const ok = hopLe(r, y) && ts <= tMax;
        if (ok && truoc) dd.them(truoc[0], truoc[1], truoc[2], r * c, y, r * s);
        truoc = ok ? [r * c, y, r * s] : null;
      }
    }
    function veTiaNen() {
      tiaRaNen.batDau(); tiaVaoNen.batDau();
      for (let C = -12; C <= 26; C += 2) {
        veDuongR(tiaRaNen, R_NGOAI, (r) => r + 2 * Math.log(r - 1) + C, Math.PI);
        veDuongR(tiaRaNen, R_TRONG, (r) => r + 2 * Math.log(1 - r) + C + 0.0, Math.PI);
      }
      const rs = Array.from({ length: 80 }, (_, i) => (i / 79) * R_SAN);
      for (let C = 1; C <= 34; C += 2) veDuongR(tiaVaoNen, rs, (r) => C - r, Math.PI);
      tiaRaNen.xong(); tiaVaoNen.xong();
    }

    // =====================================================================
    // Nón ánh sáng: mặt kính (lưới tam giác từ đỉnh ra miệng), vành miệng sáng, hai mép theo phương bán kính
    // (mép ngoài = tia «đi ra», mép trong = tia «đi vào») vẽ đậm.
    // =====================================================================
    const N_VANH = 48, N_TANG = 6;
    function taoNon(r0, phi, ts, eps, { manh = true, doMo = 0.16, dac = false } = {}) {
      let r = r0;
      let n = EF.nonEF(r, eps);
      let mau = mauVung(r);
      const er = [Math.cos(phi), Math.sin(phi)], ep = [-Math.sin(phi), Math.cos(phi)];
      const soDinh = (N_VANH + 1) * (N_TANG + 1);
      const viTri = new Float32Array(soDinh * 3);
      const uv = new Float32Array(soDinh * 2);
      for (let k = 0; k <= N_TANG; k++) for (let i = 0; i <= N_VANH; i++) { const j = k * (N_VANH + 1) + i; uv[j * 2] = i / N_VANH; uv[j * 2 + 1] = k / N_TANG; }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(viTri, 3));
      geo.setAttribute('aUV', new THREE.BufferAttribute(uv, 2));
      const chiSo = [];
      for (let k = 0; k < N_TANG; k++) for (let i = 0; i < N_VANH; i++) {
        const a = k * (N_VANH + 1) + i, b = a + 1, c = a + N_VANH + 1, d = c + 1;
        chiSo.push(a, c, b, b, c, d);
      }
      geo.setIndex(chiSo);
      const matK = vatLieuKinh(mauKinh(mau), doMo, manh ? 1 : 0, dac ? 16 : 12);
      const mesh = new THREE.Mesh(geo, matK);
      mesh.renderOrder = dac ? 6 : 3;
      mesh.frustumCulled = false;
      const vanh = new DuongDay(N_VANH + 1, { mau, rong: dac ? 2.4 : manh ? 1.6 : 1, doMo: manh ? 0.95 : 0.35, sang: dac ? 1.8 : manh ? 1.4 : 1, quang: dac ? 0.12 : 0 });
      const mepRa = manh ? new DoanDay(1, { mau, rong: dac ? 3.4 : 2.4, doMo: 1, quang: 0.12, sang: dac ? 2.2 : 1.7 }) : null;
      const mepVao = manh ? new DoanDay(1, { mau: 0xe8eeff, rong: dac ? 2.2 : 1.5, doMo: 0.8, sang: 1.1 }) : null;
      const g = new THREE.Group();
      g.add(mesh, vanh.line);
      if (mepRa) g.add(mepRa.line, mepVao.line);
      const cuc = Array.from({ length: N_VANH }, () => [0, 0]);
      const tinhCuc = () => { for (let i = 0; i < N_VANH; i++) { const a = (i / N_VANH) * 2 * Math.PI; cuc[i][0] = n.tam + n.a * Math.cos(a); cuc[i][1] = n.b * Math.sin(a); } };
      tinhCuc();
      // Đổi bước (dr, dn, dt*) sang hiển thị: ở chế độ trộn, dt hiển thị = dt* − m·dr/(r − 1).
      // Rồi cắt nón bằng mặt phẳng vuông góc với hướng n = trộn(trục đứng, trục nón, m), cách đỉnh eps:
      // m = 0 cho đúng elip ở dt* = eps; m = 1 cho mặt cắt vuông góc với trục nón (nón không bị «xéo»).
      const V = cuc.map(() => [0, 0, 0]), VMep = [[0, 0, 0], [0, 0, 0]];
      const thoVec = (dr, dn, out) => {
        out[0] = dr * er[0] + dn * ep[0]; out[2] = dr * er[1] + dn * ep[1];
        out[1] = S.m === 0 ? eps : eps - S.m * dr / (r - 1);
      };
      const nTruc = [0, 1, 0];
      const tinhTruc = () => {
        let ax = 0, ay = 0, az = 0;
        for (const v of V) { const l = Math.hypot(v[0], v[1], v[2]) || 1; ax += v[0] / l; ay += v[1] / l; az += v[2] / l; }
        const la = Math.hypot(ax, ay, az) || 1;
        const nx = S.m * ax / la, ny = (1 - S.m) + S.m * ay / la, nz = S.m * az / la;
        const ln = Math.hypot(nx, ny, nz) || 1;
        nTruc[0] = nx / ln; nTruc[1] = ny / ln; nTruc[2] = nz / ln;
      };
      const ra = [0, 0, 0];
      const catRa = (v, P) => {
        const d = v[0] * nTruc[0] + v[1] * nTruc[1] + v[2] * nTruc[2];
        const dai = Math.hypot(v[0], v[1], v[2]) || 1;
        let k = d > 1e-9 ? eps / d : Infinity;
        k = Math.min(k, (1.6 * eps) / dai);
        ra[0] = P[0] + v[0] * k; ra[1] = P[1] + v[1] * k; ra[2] = P[2] + v[2] * k;
        return ra;
      };
      const vanhQ = new Float32Array((N_VANH + 1) * 3);
      const o = {
        g, mesh, phi, ts, eps, manh,
        get r() { return r; },
        datR(rMoi) {
          r = rMoi; n = EF.nonEF(r, eps); tinhCuc();
          const m2 = mauVung(r);
          if (m2 !== mau) { mau = m2; matK.uniforms.uMau.value.set(mauKinh(mau)); vanh.datMau(mau); mepRa?.datMau(mau); }
          o.dat();
        },
        dat() {
          const an = S.m > 1e-3 && Math.abs(r - 1) < 0.02;
          const y = yHien(ts, r);
          g.visible = !an && y > -0.5 && y < Y_MAX + 1;
          if (!g.visible) return;
          const P = [r * er[0], y, r * er[1]];
          for (let i = 0; i < N_VANH; i++) thoVec(cuc[i][0], cuc[i][1], V[i]);
          tinhTruc();
          for (let i = 0; i <= N_VANH; i++) {
            const q = catRa(V[i % N_VANH], P);
            vanhQ[i * 3] = q[0]; vanhQ[i * 3 + 1] = q[1]; vanhQ[i * 3 + 2] = q[2];
            vanh.dat(i, q[0], q[1], q[2]);
          }
          vanh.xong(N_VANH + 1);
          for (let k = 0; k <= N_TANG; k++) {
            const u = k / N_TANG;
            for (let i = 0; i <= N_VANH; i++) {
              const j = (k * (N_VANH + 1) + i) * 3;
              viTri[j] = P[0] + u * (vanhQ[i * 3] - P[0]); viTri[j + 1] = P[1] + u * (vanhQ[i * 3 + 1] - P[1]); viTri[j + 2] = P[2] + u * (vanhQ[i * 3 + 2] - P[2]);
            }
          }
          geo.attributes.position.needsUpdate = true;
          geo.computeBoundingSphere();
          if (mepRa) {
            [n.ngoai, n.trong].forEach((dr, j) => {
              thoVec(dr, 0, VMep[j]); const q = catRa(VMep[j], P);
              const dd = j === 0 ? mepRa : mepVao;
              dd.batDau(); dd.them(P[0], P[1], P[2], q[0], q[1], q[2]); dd.xong();
            });
          }
          o.dinh = P;
          let cx = 0, cy = 0, cz = 0;
          for (let i = 0; i < N_VANH; i++) { cx += vanhQ[i * 3]; cy += vanhQ[i * 3 + 1]; cz += vanhQ[i * 3 + 2]; }
          o.giua = [P[0] + 0.6 * (cx / N_VANH - P[0]), P[1] + 0.6 * (cy / N_VANH - P[1]), P[2] + 0.6 * (cz / N_VANH - P[2])];
        },
      };
      return o;
    }
    const moTaNon = (r) => {
      const d = EF.docTiaRa(r);
      const vung = r > 1.005 ? chuCanh("canh.ngoai-chan-troi-tia-huong-ra-van-di", "ngoài chân trời: tia hướng ra vẫn đi ra được, chậm dần") : r < 0.995 ? chuCanh("canh.ben-trong-ca-hai-mep-chia-vao-tam", "bên trong: cả hai mép chĩa vào tâm, mọi tương lai dẫn về r = 0") : chuCanh("canh.dung-chan-troi-tia-huong-ra-dung-yen", "đúng chân trời: tia hướng ra đứng yên tại chỗ");
      return chuCanh("canh.dinh-o-r-rs-mep-ngoai-tia-di", "Đỉnh ở <span class=\"so\">r = {0} rs</span>. Mép ngoài (tia đi ra): <span class=\"so\">dr/dt* = {1} c</span>, {2}. Mép trong (tia đi vào): luôn 45° vào trong.<br>{3}.", [so(r, 2), so(d, 3), Math.abs(d) < 1e-9 ? chuCanh("canh.dung-dung", "dựng đứng") : d > 0 ? chuCanh("canh.nghieng-ra-ngoai", "nghiêng {0}° ra ngoài", [so(goc(d), 1)]) : chuCanh("canh.nghieng-vao-trong", "nghiêng {0}° vào trong", [so(goc(-d), 1)]), vung]);
    };
    let reNon = null;      // nón đang được rê chuột (thử thách bước 1)
    const nhomNon = new THREE.Group(), nhomNonPhu = new THREE.Group(), nhomPhang = new THREE.Group();
    scene.add(nhomNon, nhomNonPhu, nhomPhang);
    const dsNon = [];
    for (const ts of HANG_NON) {
      for (const r of BAN_KINH) {
        const o = taoNon(r, Math.PI, ts, epsTai(r), { manh: true, doMo: ts === HANG_NON[0] ? 0.16 : 0.12 });
        nhomNon.add(o.g); dsNon.push(o);
        tt.them(o.mesh, { ten: chuCanh("canh.non-anh-sang-tuong-lai", "Nón ánh sáng tương lai"), moTa: () => moTaNon(r), khiRe: (d) => { if (d) reNon = o; else if (reNon === o) reNon = null; }, mau: mauVung(r) });
        if (ts === HANG_NON[0]) {
          const ph = nonAnhSang({ cao: epsTai(r), duoi: false, mau: 0xffffff, doMo: 0.035, soDuong: 10, xung: false });
          ph.position.set(-r, ts, 0);
          nhomPhang.add(ph);
        }
      }
    }
    for (const phi of [-Math.PI / 4, -Math.PI / 2, (-3 * Math.PI) / 4, (3 * Math.PI) / 4]) {
      for (const r of [0.6, 1, 1.6, 3, 4.2, 6]) {
        const o = taoNon(r, phi, 6.5, epsTai(r), { manh: false, doMo: 0.06 });
        nhomNonPhu.add(o.g); dsNon.push(o);
      }
    }
    // nhãn ba vùng
    const nhanVung = [
      [chuCanh("canh.o-xa-gan-nhu-45", "ở xa: gần như 45°"), -5.1, '#f3c66f'],
      [chuCanh("canh.tai-chan-troi-mep-ngoai-dung-dung", "tại chân trời: mép ngoài dựng đứng"), -1.0, '#ffffff'],
      [chuCanh("canh.ben-trong-ca-non-chia-vao-tam", "bên trong: cả nón chĩa vào tâm"), -0.45, '#ff8a73'],
    ].map(([chu, x, mau], i) => {
      const nn = taoNhan(chu, 'tran giua');
      nn.element.style.color = mau;
      nn.position.set(x, HANG_NON[0] - 0.55 - (i === 2 ? 0.55 : 0), 0);
      nhomNon.add(nn);
      return nn;
    });

    // ---------- Nón dò: kéo đỉnh của nó dọc bán kính ----------
    const nhomDo = new THREE.Group();
    scene.add(nhomDo);
    const nonDo = taoNon(3, Math.PI, T_DO, EPS_DO, { manh: true, doMo: 0.3, dac: true });
    nhomDo.add(nonDo.g);
    const nhanDo = taoNhan('', 'dam');
    nhomDo.add(nhanDo);
    function datRDoNgay(r) {
      S.rDo = r;
      nonDo.datR(r);
      const d = EF.docTiaRa(r);
      nhanDo.position.set(-r - EPS_DO * 0.95, T_DO + EPS_DO + 0.45, 0);
      nhanDo.element.style.color = r > 1.02 ? '#f3c66f' : r < 0.98 ? '#ff8a73' : '#ffffff';
      nhanDo.datChu(chuCanh("canh.non-do-o-r-rs-mep-ngoai-dr", "Nón dò ở r = {0} rs<small>mép ngoài dr/dt* = {1} c · {2}</small>", [so(r, 2), so(d, 2), Math.abs(d) < 0.005 ? chuCanh("canh.dung-dung", "dựng đứng") : d > 0 ? chuCanh("canh.nghieng-ra-ngoai", "nghiêng {0}° ra ngoài", [so(goc(d), 1)]) : chuCanh("canh.nghieng-vao-trong", "nghiêng {0}° vào trong", [so(goc(-d), 1)])]));
      if (!tt.dangKeo) tayDo.dat([-r, yHien(T_DO, r), 0]);
    }
    let giongDo = null, tatGiongSau = 0, rTruocTieng = null;
    const tayDo = tt.tayNam({
      viTri: [-3, T_DO, 0], mau: 0xf3c66f, co: 0.13,
      rangBuoc: { kieu: 'duong', qua: [0, T_DO, 0], huong: [1, 0, 0] },
      gioiHan: (p) => { p.x = Math.min(-0.3, Math.max(-6.5, p.x)); p.y = T_DO; p.z = 0; return p; },
      hut: [[-1, T_DO, 0]], khoangHut: 0.035,
      nhan: chuCanh("canh.keo-non-do-doc-ban-kinh", "Kéo nón dò dọc bán kính"),
      ten: chuCanh("canh.dinh-non-do", "Đỉnh nón dò"),
      moTa: () => moTaNon(S.rDo ?? 3),
      khiNam: () => { S.rDoDich = null; batTiengDo(); },
      khiKeo: (p) => { S.rDoDich = null; datRDoNgay(-p.x); dkDo.dat(-p.x); batTiengDo(); },
      khiTha: () => { tatGiongSau = 0.6; },
    });
    function batTiengDo() {
      if (!giongDo) giongDo = am.giong({ dang: 'kinh', tanSo: tanSoNon(S.rDo ?? 3), doTo: 0 });
      tatGiongSau = 0;
    }
    // Rê chuột lên chân trời: chỉ bắt ở hai đầu trụ (đáy và đỉnh), để phần giữa nhường cho các nón nằm sát chân trời.
    const vatCT = new THREE.Group();
    for (const y of [0.6, Y_MAX - 0.6]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.03, 1.03, 1.2, 32, 1, true), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
      m.position.y = y; vatCT.add(m);
    }
    scene.add(vatCT);
    tt.them(vatCT, { ten: chuCanh("canh.chan-troi-su-kien-r-rs", "Chân trời sự kiện r = rs"), mau: 0xf3c66f, noiBat: false, moTa: chuCanh("canh.mat-tru-det-bang-cac-tia-sang-di", "Mặt trụ dệt bằng các tia sáng «đi ra» đứng yên tại r = rs: chúng chỉ đi lên theo thời gian, không tiến ra được chút nào. Đi vào được, không đi ra được.") });
    tt.them(vatKyDi, { ten: chuCanh("canh.ky-di-r-0", "Kỳ dị r = 0"), mau: 0xff8a73, noiBat: false, moTa: () => chuCanh("canh.do-cong-vo-han-k-12-rs-r", "Độ cong vô hạn (K = 12 rs²/r⁶ → ∞). Bên trong chân trời, r đóng vai thời gian: r = 0 là một <b>thời điểm</b> nằm trong tương lai của mọi vật đã vào trong.") });

    // =====================================================================
    // Người rơi, chớp sáng, người ở xa (nửa phải, φ = 0)
    // =====================================================================
    const nhomRoi = new THREE.Group();
    scene.add(nhomRoi);
    // Bảng (τ, r, t*) dọc đường rơi; lấy mẫu theo r, dày ở sát chân trời để khi trộn tọa độ vẫn thấy đường vọt lên.
    const dsRRoi = [];
    for (let i = 0; i < 260; i++) dsRRoi.push(1 + Math.exp(Math.log(R0 - 1) + (i / 259) * (Math.log(1e-5) - Math.log(R0 - 1))));
    for (let i = 0; i < 240; i++) dsRRoi.push(1 - Math.exp(Math.log(1e-5) + (i / 239) * (0 - Math.log(1e-5))));
    const bangRoi = dsRRoi.map((r) => ({ r, tau: CHOP.tauHet - EF.tauToiTam(r), ts: EF.tsGiotMua(r, CHOP.T0) }));
    const N_ROI = bangRoi.length;
    const duongRoi = new DoanDay(N_ROI, { mau: MAU_ROI, rong: 3, doMo: 1, quang: 0.14, sang: 1.7 });
    const duongRoiMo = new DoanDay(N_ROI, { mau: MAU_ROI, rong: 1.2, doMo: 0.28 });
    const chamRoi = suKien(MAU_ROI, 0.42);
    const nhanRoi = taoNhan('', 'hong dam');
    nhomRoi.add(duongRoi.line, duongRoiMo.line, chamRoi, nhanRoi);
    const vachTau = [];
    for (let k = 1; k <= 9; k++) {
      const d = suKien(0xffffff, 0.26, { vong: false });
      const r = EF.rSauTau(R0, k);
      vachTau.push({ d, tau: k, r, ts: EF.tsGiotMua(r, CHOP.T0) });
      nhomRoi.add(d);
    }
    const nhanTauDau = taoNhan('τ = 0', 'mo tran');
    nhomRoi.add(nhanTauDau);

    const raChop = new DoanDay(17 * 80, { mau: MAU_NGOAI, rong: 2, doMo: 1, quang: 0.1, sang: 1.6 });
    const vaoChop = new DoanDay(17 * 40, { mau: MAU_NGOAI, rong: 1.1, doMo: 0.35 });
    nhomRoi.add(raChop.line, vaoChop.line);
    const chamPhat = CHOP.ds.map((c) => {
      const d = suKien(MAU_NGOAI, 0.42); nhomRoi.add(d);
      tt.them(d, { ten: chuCanh("canh.chop", "Chớp {0}", [c.k + 1]), banKinhPx: 12, mau: MAU_NGOAI, moTa: () => chuCanh("canh.phat-o-r-rs-luc-dong-ho-phi", "Phát ở <span class=\"so\">r = {0} rs</span>, lúc đồng hồ phi hành gia chỉ <span class=\"so\">τ = {1} rs/c</span>. {2}", [so(c.r, 2), so(c.tau, 1), c.thoat ? chuCanh("canh.toi-nguoi-o-xa-luc-t", "Tới người ở xa lúc <span class=\"so\">t* = {0}</span>.", [so(c.tsNhan, 2)]) : chuCanh("canh.phat-ben-trong-chan-troi-ca-hai-nua", "<b>Phát bên trong chân trời</b>: cả hai nửa đều rơi vào kỳ dị, không bao giờ tới người ở xa.")]) });
      return d;
    });
    const chamNhan = CHOP.ds.map(() => { const d = suKien(MAU_NGOAI, 0.48); d.visible = false; nhomRoi.add(d); return d; });
    const nhanNhan = CHOP.ds.map((c) => { const n = taoNhan(String(c.k + 1), 'vang tran'); n.visible = false; nhomRoi.add(n); return n; });
    // người ở xa
    nhomRoi.add(duongDayTinh([R_QS, 0, 0, R_QS, Y_MAX, 0], { mau: MAU_KTG.thoiGian, rong: 2.8, doMo: 1, quang: 0.12, sang: 1.5 }).line);
    const nhanQS = taoNhan(chuCanh("canh.nguoi-o-xa-dung-yen-o-r-7", "Người ở xa<small>đứng yên ở r = 7 rs</small>"), 'xanh dam');
    nhanQS.position.set(R_QS + 0.1, Y_MAX + 0.6, 0);
    nhomRoi.add(nhanQS);
    const nhanChopCuoi = taoNhan('', 'vang');
    nhomRoi.add(nhanChopCuoi);
    // Tay nắm «bây giờ» trên đường của người ở xa
    const tayT = tt.tayNam({
      viTri: [R_QS, S.T, 0], mau: MAU_KTG.hienTai, co: 0.2,
      rangBuoc: { kieu: 'duong', qua: [R_QS, 0, 0], huong: [0, 1, 0] },
      gioiHan: (p) => { p.x = R_QS; p.z = 0; p.y = Math.min(Y_MAX, Math.max(0, p.y)); return p; },
      nhan: chuCanh("canh.keo-bay-gio", "Kéo «bây giờ»"),
      ten: chuCanh("canh.bay-gio-theo-t", "Bây giờ (theo t*)"),
      moTa: () => chuCanh("canh.t-rs-c-nguoi-o-xa-da-nhan", "t* = <span class=\"so\">{0} rs/c</span>. Người ở xa đã nhận <span class=\"so\">{1}/16</span> chớp.", [so(S.T, 2), soNhan]),
      khiNam: () => { S.chay = false; },
      khiKeo: (p) => { S.T = p.y; S.chay = false; S.daKeoT = true; dkT.dat(S.T); },
    });

    const doanR = (r0, r1, n, mu = 2) => Array.from({ length: n }, (_, i) => r0 + (r1 - r0) * (i / (n - 1)) ** mu);
    // các mảng bán kính dọc mỗi tia chớp (tính sẵn một lần)
    const tiaChop = CHOP.ds.map((c) => ({
      c,
      ra: c.r > 1 ? (() => { const a = doanR(0, 1, 80, 1); return a.map((u) => 1 + (c.r - 1) * Math.exp(u * Math.log((R_QS - 1) / (c.r - 1)))); })() : doanR(c.r, 0, 80, 0.6),
      vao: doanR(c.r, 0, 40, 1),
    }));

    function veRoi() {
      const T = S.T;
      duongRoi.batDau(); duongRoiMo.batDau();
      let truoc = null, cuoi = null;
      for (const b of bangRoi) {
        const y = yHien(b.ts, b.r);
        const ok = hopLe(b.r, y);
        const dd = b.ts <= T ? duongRoi : duongRoiMo;
        if (ok && truoc) dd.them(truoc[0], truoc[1], 0, b.r, y, 0);
        truoc = ok ? [b.r, y] : null;
        if (b.ts <= T) cuoi = b;
      }
      duongRoi.xong(); duongRoiMo.xong();
      const conSong = cuoi && T < CHOP.T0 + 1e-9;
      if (cuoi) {
        const y = yHien(cuoi.ts, cuoi.r);
        chamRoi.visible = nhanRoi.visible = hopLe(cuoi.r, y) || S.m < 1e-4;
        chamRoi.position.set(cuoi.r, y, 0);
        nhanRoi.position.set(cuoi.r + 0.15, y + 0.15, 0);
        nhanRoi.datChu(conSong ? chuCanh("canh.nguoi-roi-r-rs", "Người rơi<small>τ = {0} · r = {1} rs</small>", [so(cuoi.tau, 2), so(cuoi.r, 2)]) : chuCanh("canh.toi-ky-di-rs-c", "tới kỳ dị<small>τ = {0} rs/c</small>", [so(CHOP.tauHet, 2)]));
      }
      for (const v of vachTau) { const y = yHien(v.ts, v.r); v.d.visible = hopLe(v.r, y) && v.ts <= T; v.d.position.set(v.r, y, 0); }
      nhanTauDau.position.set(R0 + 0.15, yHien(0, R0) - 0.25, 0);
      // chớp sáng
      raChop.batDau(); vaoChop.batDau();
      let soNhan = 0;
      for (const t of tiaChop) {
        const c = t.c;
        const coChop = c.ts <= T;
        const yp = yHien(c.ts, c.r);
        chamPhat[c.k].visible = coChop && hopLe(c.r, yp);
        chamPhat[c.k].position.set(c.r, yp, 0);
        if (coChop) {
          veDuongR(raChop, t.ra, (r) => EF.tsTiaRa(r, c.ts, c.r), 0, T);
          veDuongR(vaoChop, t.vao, (r) => EF.tsTiaVao(r, c.ts, c.r), 0, T);
        }
        const toi = c.thoat && c.tsNhan <= T && c.tsNhan <= Y_MAX + 0.3;
        if (toi) soNhan++;
        chamNhan[c.k].visible = nhanNhan[c.k].visible = toi;
        if (toi) {
          const y = yHien(c.tsNhan, R_QS);
          chamNhan[c.k].position.set(R_QS, y, 0);
          nhanNhan[c.k].position.set(R_QS + 0.22, y, 0);
        }
      }
      raChop.xong(); vaoChop.xong();
      const cc = CHOP.chopCuoi;
      nhanChopCuoi.visible = soNhan === 16;
      nhanChopCuoi.position.set(R_QS + 0.9, yHien(cc.tsNhan, R_QS) + 0.9, 0);
      nhanChopCuoi.datChu(chuCanh("canh.chop-cuoi-cung-toi-noi-phat-o-r", "chớp cuối cùng tới nơi<small>phát ở r ≈ 1,13 rs</small>"));
      return soNhan;
    }
    let soNhan = 0;

    // Tiếng của chớp sáng: tai trái «tích» lúc mỗi chớp được bật (theo t* của sơ đồ), tai phải một nốt lúc người ở xa
    // nhận được, cao độ 660 × (khoảng phát 0,6 / khoảng nhận) Hz: đúng tỉ số tần số nhận / phát (1/(1 + z)).
    const tanSoNhan = (k) => 660 * (D_TAU / CHOP.khoang[Math.max(0, Math.min(CHOP.khoang.length - 1, k - 1))]);
    let tTruocTieng = null;
    function tiengChop(dt) {
      const T = S.T, T0 = tTruocTieng;
      tTruocTieng = T;
      if (T0 === null || dt <= 0 || !(T > T0) || T - T0 > 1.5 || !S.hien.roi) return;
      let n = 0;
      for (const c of CHOP.ds) {
        if (n >= 3) break;
        if (c.ts > T0 && c.ts <= T) { am.tich({ tanSo: 1320, doTo: 0.3, lech: -0.65, dai: 0.04 }); n++; }
        if (c.thoat && c.tsNhan > T0 && c.tsNhan <= T) { am.not({ tanSo: tanSoNhan(c.k), dai: 0.5, doTo: 0.5, lech: 0.65, dang: 'chuong' }); n++; }
      }
    }

    // =====================================================================
    // Điều khiển
    // =====================================================================
    const bang = app.bang;
    const dkM = bang.thanhTruot({
      nhan: chuCanh("canh.tron-toa-do-thoi-gian-t-schwarzschild-t", "Trộn tọa độ (thời gian t* → Schwarzschild t)"), min: 0, max: 1, buoc: 0.01, giaTri: 0,
      hienThi: (v) => (v < 0.005 ? 'Eddington–Finkelstein t*' : v > 0.995 ? 'Schwarzschild t' : `${so(v * 100, 0)}% Schwarzschild`),
      khiDoi: (v) => { S.m = v; S.mDich = null; doiM(); },
    });
    const dkDo = bang.thanhTruot({
      nhan: chuCanh("canh.ban-kinh-non-do", "Bán kính nón dò"), min: 0.3, max: 6.5, buoc: 0.01, giaTri: 3,
      hienThi: (v) => `${so(v, 2)} rs`,
      khiDoi: (v) => { S.rDoDich = null; datRDoNgay(v); },
    });
    const dkT = bang.thanhTruot({
      nhan: chuCanh("canh.thoi-diem-t", "Thời điểm t*"), min: 0, max: Y_MAX, buoc: 0.05, giaTri: S.T,
      hienThi: (v) => `${so(v, 1)} rs/c`,
      khiDoi: (v) => { S.T = v; S.chay = false; S.daKeoT = true; },
    });
    const doThi = bang.doThi(132);
    const ghiChu = bang.chuThich('');
    let soNhanDaVe = -1;
    function veDoThi() {
      const { ctx: g } = doThi;
      const { X, Y } = khungDoThi(g, { rong: doThi.rong, cao: doThi.cao, x0: 0.5, x1: 15.5, y0: 0, y1: 4.6, nhanX: chuCanh("canh.lan-nhan", "lần nhận"), nhanY: chuCanh("canh.khoang-giua-hai-lan-nhan-rs-c", "khoảng giữa hai lần nhận (rs/c)"), vachY: [0, 1, 2, 3, 4], vachX: [[1, '1–2'], [5, '5–6'], [10, '10–11'], [15, '15–16']] });
      CHOP.khoang.forEach((k, i) => {
        const daNhan = i + 2 <= soNhan;
        g.fillStyle = daNhan ? MAU.vang : 'rgba(243,198,111,0.18)';
        const w = (X(1) - X(0)) * 0.7;
        g.fillRect(X(i + 1) - w / 2, Y(k), w, Y(0) - Y(k));
      });
      g.strokeStyle = MAU.hong; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(X(0.5), Y(D_TAU)); g.lineTo(X(15.5), Y(D_TAU)); g.stroke(); g.setLineDash([]);
      g.fillStyle = MAU.hong; g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillText(chuCanh("canh.khoang-phat-0-6", "khoảng phát 0,6"), X(0.7), Y(D_TAU) - 2);
    }

    const GOC = {
      xa: [[1.2, 9.6, 21.5], [-2.9, 6.3, 0]],
      ngang: [[-2.8, 3.6, 16], [-2.8, 4.2, 0]],
      trai: [[-0.6, 12.5, 32], [-3.4, 11.4, 0]],
      do: [[-0.4, 19.6, 13.6], [-3.0, 17.5, 0]],
      trong: [[2.2, 20.4, 12.8], [-1.3, 17.5, 0]],
      phai: [[13.35, 16.94, 54.05], [3.0, 13.6, 0]],   // lùi 15%: nhãn «Kỳ dị» ở đỉnh không chui dưới thanh trên cùng
      gan: [[4.5, 11.5, 15], [2.2, 10.2, 0]],
      toan: [[12.65, 18.72, 57.5], [0, 13.2, 0]],
    };
    const goc2 = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    function doiM() {
      dkM.dat(S.m);
      for (const o of dsNon) o.dat();
      if (S.rDo != null) datRDoNgay(S.rDo);
      veTiaNen();
      veRoi();
      nhanTruc.datChu(S.m < 0.005 ? chuCanh("canh.thoi-gian-t-rs-c", "thời gian t* (rs/c)") : S.m > 0.995 ? chuCanh("canh.thoi-gian-schwarzschild-t-rs-c", "thời gian Schwarzschild t (rs/c)") : chuCanh("canh.thoi-gian-dang-tron", "thời gian (đang trộn)"));
      kinh.visible = S.hien.roi && S.m < 0.005;
      for (const n of nhanVung) n.visible = !S.hien.roi && S.m < 0.005;
    }

    function capNhatGiaoDien() {
      nhomNon.visible = S.hien.non;
      nhomNonPhu.visible = S.hien.nonPhu;
      nhomPhang.visible = S.hien.phang && S.m < 0.005;
      nhomTia.visible = S.hien.tia;
      nhomRoi.visible = S.hien.roi;
      nhomDo.visible = S.rDo != null;
      tayDo.an(S.rDo == null || S.m > 0.005);
      tayT.an(!S.hien.roi || S.m > 0.005);
      dkDo.el.hidden = S.rDo == null;
      dkT.el.hidden = doThi.el.hidden = !S.hien.roi;
      matCT.uniforms.uSang.value = S.hien.chanTroi ? 1.35 : 1;
      kinh.visible = S.hien.roi && S.m < 0.005;
      ghiChu.dat(S.hien.roi
        ? chuCanh("canh.hong-duong-the-gioi-nguoi-roi-cham-trang", "Hồng: đường thế giới người rơi (chấm trắng: mỗi rs/c thời gian riêng). Vàng: chớp sáng. Xanh: người ở xa, đánh số các chớp nhận được. Tấm xanh lục là «bây giờ» theo t*: kéo đốm xanh lục trên đường của người ở xa để dời nó.")
        : chuCanh("canh.truc-dung-la-thoi-gian-san-la-khong", "Trục đứng là thời gian, sàn là không gian quanh lỗ đen. Vàng: nón ở ngoài chân trời; trắng: tại chân trời; đỏ cam: bên trong. Nón vẽ to để dễ nhìn. Rê chuột lên một nón để đọc độ nghiêng."));
    }

    function cauHinh(o = {}) {
      if (o.hien) S.hien = { non: false, nonPhu: false, tia: false, phang: false, roi: false, chanTroi: false, ...o.hien };
      if (o.T != null) { S.T = o.T; dkT.dat(S.T); tTruocTieng = null; }
      if (o.chay != null) S.chay = o.chay;
      if ('rDo' in o) { S.rDoDich = null; S.rDo = o.rDo; if (o.rDo != null) { dkDo.dat(o.rDo); datRDoNgay(o.rDo); } }
      if (o.m != null) { S.m = o.m; S.mDich = null; }
      if (o.mDich != null) S.mDich = o.mDich;
      S.daKeoT = false;
      reNon = null;
      capNhatGiaoDien();
      doiM();
      soNhan = veRoi(); veDoThi();
      if (o.mayAnh) goc2(o.mayAnh);
    }
    veTiaNen();
    cauHinh({ m: 0 });

    // Tham số chụp ảnh khi kiểm (chỉ khi app.imLang): thu=r:<bán kính nón dò> | T:<t*> | keo | re
    const thamThu = app.imLang ? new URLSearchParams(location.search) : null;
    const thu = thamThu?.get('thu') || null;
    let thuGio = 0, thuXong = !thu;
    function chayThu(dtThuc) {
      thuGio += dtThuc;
      if (thuXong || thuGio < 2.2) return;
      thuXong = true;
      const [ten, gt] = thu.split(':');
      camera.updateMatrixWorld();
      const cv = app.renderer.domElement, rect = cv.getBoundingClientRect();
      const manHinh = (p) => { const v = new THREE.Vector3(...p).project(camera); return [Math.round(rect.left + ((v.x + 1) / 2) * rect.width), Math.round(rect.top + ((1 - v.y) / 2) * rect.height)]; };
      const su = (loai, [x, y], nut = 0) => cv.dispatchEvent(new PointerEvent(loai, { clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, bubbles: true, cancelable: true, buttons: nut, button: loai === 'pointermove' ? -1 : 0 }));
      if (ten === 'r') { const r = Number(gt); S.rDoDich = null; datRDoNgay(r); dkDo.dat(r); }
      else if (ten === 'T') { S.chay = false; S.T = Number(gt); S.daKeoT = true; dkT.dat(S.T); }
      else if (ten === 'keo') {
        const p0 = manHinh([-(S.rDo ?? 3), T_DO, 0]);
        su('pointermove', p0); su('pointerdown', p0, 1);
        const p1 = manHinh([-Number(gt || 2.14), T_DO, 0]);
        for (let i = 1; i <= 4; i++) su('pointermove', [Math.round(p0[0] + ((p1[0] - p0[0]) * i) / 4), p0[1]], 1);
      } else if (ten === 're') {
        const o = dsNon.find((x) => Math.abs(x.r - Number(gt || 1)) < 1e-6);
        if (o) { const p = manHinh(o.giua); su('pointermove', [p[0] - 8, p[1]]); su('pointermove', p); }
      }
    }

    function capNhat(dt, dtThuc) {
      GIO.value += dt;
      if (thu) chayThu(dtThuc);
      if (S.mDich != null) {
        const d = S.mDich - S.m;
        const buoc = Math.sign(d) * Math.min(Math.abs(d), dt * 0.55);
        S.m += buoc;
        if (Math.abs(S.mDich - S.m) < 1e-4) { S.m = S.mDich; S.mDich = null; }
        nhomPhang.visible = S.hien.phang && S.m < 0.005;
        tayDo.an(S.rDo == null || S.m > 0.005);
        tayT.an(!S.hien.roi || S.m > 0.005);
        doiM();
      }
      // nón dò trôi mượt tới chỗ được chọn bằng nút
      if (S.rDoDich != null && S.rDo != null) {
        const k = 1 - Math.exp(-dtThuc * 7);
        let r = S.rDo + (S.rDoDich - S.rDo) * k;
        if (Math.abs(S.rDoDich - r) < 2e-4) { r = S.rDoDich; S.rDoDich = null; }
        datRDoNgay(r); dkDo.dat(r);
        if (dt > 0) batTiengDo();
        if (S.rDoDich == null) tatGiongSau = 0.5;
      }
      // tiếng nón dò: cao độ theo tốc độ đi ra của mép ngoài; chuông khi đỉnh đi qua chân trời
      if (S.rDo != null && rTruocTieng != null && dt > 0 && (S.rDo - 1) * (rTruocTieng - 1) < 0) am.not({ tanSo: S.rDo < 1 ? 196 : 330, dai: 1.2, doTo: 0.45, dang: 'kinh' });
      rTruocTieng = S.rDo;
      if (giongDo) {
        if (dt === 0) giongDo.dat({ doTo: 0 }, 0.05);
        else giongDo.dat({ tanSo: tanSoNon(S.rDo ?? 3), doTo: 0.16 }, 0.05);
        if (!tt.dangKeo && S.rDoDich == null) {
          if (tatGiongSau > 0) { tatGiongSau -= dtThuc; if (tatGiongSau <= 0) { giongDo.tat(0.4); giongDo = null; } }
        }
      }
      if (S.hien.roi && S.chay && dt > 0) {
        if (S.T >= Y_MAX) { tCho += dt; if (tCho > 2.5) { S.T = 0; tCho = 0; tTruocTieng = null; } }
        else S.T = Math.min(Y_MAX, S.T + dt * 2.6);
        dkT.dat(S.T);
      }
      if (S.hien.roi) {
        kinh.position.y = S.T;
        kinh.userData.nhan.visible = S.T < Y_MAX - 2.5;
        tayT.dat([R_QS, S.T, 0]);
        const n = veRoi();
        if (n !== soNhanDaVe) { soNhan = n; soNhanDaVe = n; veDoThi(); }
        tiengChop(dt);
      }
    }
    let tCho = 0;

    function hud() {
      const d = [[chuCanh("canh.thoi-gian", "Thời gian"), S.m < 0.005 ? chuCanh("canh.eddington-finkelstein-t-khong-hong-o-chan-troi", "Eddington–Finkelstein t* (không hỏng ở chân trời)") : S.m > 0.995 ? chuCanh("canh.schwarzschild-t-hong-o-chan-troi", "Schwarzschild t (hỏng ở chân trời)") : chuCanh("canh.tron", "trộn {0}%", [so(S.m * 100, 0)])]];
      if (S.rDo != null) {
        const r = S.rDo, dd = EF.docTiaRa(r);
        d.push([chuCanh("canh.non-do", "Nón dò"), chuCanh("canh.r-rs-tia-ra-dr-dt-c-tia", "r = {0} rs · tia ra dr/dt* = {1} c ({2}) · tia vào −1 c", [so(r, 2), so(dd, 3), Math.abs(dd) < 0.0005 ? chuCanh("canh.dung-dung", "dựng đứng") : dd > 0 ? chuCanh("canh.ra-ngoai", "{0}° ra ngoài", [so(goc(dd), 1)]) : chuCanh("canh.vao-trong", "{0}° vào trong", [so(goc(-dd), 1)])])]);
        d.push([chuCanh("canh.vung", "Vùng"), r > 1.005 ? chuCanh("canh.ngoai-chan-troi-con-huong-di-ra", "ngoài chân trời: còn hướng đi ra") : r < 0.995 ? chuCanh("canh.ben-trong-moi-huong-deu-ve-r-0", "bên trong: mọi hướng đều về r = 0") : chuCanh("canh.chan-troi-tia-ra-dung-yen", "chân trời: tia ra đứng yên")]);
        if (r < 1) d.push([chuCanh("canh.nguoi-roi-tu-xa-di-qua-day", "Người rơi từ xa đi qua đây"), chuCanh("canh.con-rs-c-toi-ky-di-toi-da", "còn τ = {0} rs/c tới kỳ dị (tối đa từ chân trời: π/2 ≈ 1,571)", [so(EF.tauToiTam(r), 3)])]);
      }
      if (S.hien.roi) {
        const songT = S.T < CHOP.T0;
        let b = bangRoi[0];
        for (const x of bangRoi) if (x.ts <= S.T) b = x;
        d.push([chuCanh("canh.nguoi-roi", "Người rơi"), songT ? chuCanh("canh.r-rs-thoi-gian-rieng-rs-c", "r = {0} rs · thời gian riêng τ = {1} rs/c{2}", [so(b.r, 2), so(b.tau, 2), b.r < 1 ? chuCanh("canh.da-vao-trong", " · đã vào trong") : '']) : chuCanh("canh.da-toi-ky-di-sau-rs-c", "đã tới kỳ dị sau τ = {0} rs/c", [so(CHOP.tauHet, 2)])]);
        d.push([chuCanh("canh.chop-da-nhan", "Chớp đã nhận"), chuCanh("canh.16-chop-17-phat-ben-trong-khong-bao", "{0} / 16 (chớp 17 phát bên trong, không bao giờ tới)", [soNhan])]);
        if (soNhan >= 2) d.push([chuCanh("canh.khoang-nhan-gan-nhat", "Khoảng nhận gần nhất"), chuCanh("canh.rs-c-dong-ho-nguoi-o-xa-phat", "{0} rs/c đồng hồ người ở xa (phát cách 0,6)", [so(CHOP.khoang[soNhan - 2], 2)])]);
      }
      return d;
    }

    // Trạng thái cho các thử thách (gọi từ baiGiang).
    const gocNgoai = () => (S.rDo == null ? NaN : goc(EF.docTiaRa(S.rDo)));
    const thuThach = {
      reNonDung: () => !!(reNon && Math.abs(reNon.r - 1) < 1e-9 && reNon.manh),
      goc20: () => S.rDoDich == null && Math.abs(gocNgoai() - TT_GOC_NGOAI) < 1.5,
      goc5Trong: () => S.rDoDich == null && Math.abs(-gocNgoai() - TT_GOC_TRONG) < 2,
      tau02: () => S.rDoDich == null && S.rDo != null && S.rDo < 1 && Math.abs(EF.tauToiTam(S.rDo) - TT_TAU) < 0.03,
      chopCuoi: () => S.daKeoT && soNhan === 16 && S.T - CHOP.chopCuoi.tsNhan < 1,
    };

    function ra() { giongDo?.tat(0.3); giongDo = null; }
    return {
      scene, capNhat, hud, cauHinh, thuThach, huy: ra, ra,
      goc: goc2,
      datM: (m) => { S.mDich = m; },
      datRDo: (r) => { if (S.rDo == null) { S.rDo = r; datRDoNgay(r); } S.rDoDich = r; capNhatGiaoDien(); },
      datPhang: (b) => { S.hien.phang = b; capNhatGiaoDien(); },
      chayLai: () => { S.T = 0; S.chay = true; tCho = 0; tTruocTieng = null; S.daKeoT = false; },
      hienHet: () => { S.T = Y_MAX; S.chay = false; dkT.dat(S.T); tTruocTieng = null; S.daKeoT = false; },
    };
  },
};
