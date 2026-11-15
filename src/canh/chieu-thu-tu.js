import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 3 — Chiều thứ tư.
// Một «máy xem bốn chiều»: dữ liệu là điểm và đoạn thẳng trong không gian (x, y, z, w). Mỗi khung hình
// nhân với ma trận quay bốn chiều rồi chiếu về ba chiều: phối cảnh (x, y, z)·d/(d − w), hoặc chiếu thẳng
// (bỏ w). Lát cắt bởi siêu phẳng w = w0 được tính thật (src/vat-ly/bon-chieu.js).
// Bốn vật: siêu lập phương, siêu cầu, «phim Trái Đất – Mặt Trăng» (trục w là thời gian) và
// sơ đồ so sánh vòng tròn (quay trong 4 chiều không gian) với hyperbol (quay trong không-thời gian).

import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { so, soNghia } from '../vat-ly/hang-so.js';
import { DINH_LP, CANH_LP, MAT_LP, demPhanTu, maTranQuay, nhanVec, catLapPhuong4, taoBoCat, banKinhLatCat, tenKhoi, doDaiCanhCat } from '../vat-ly/bon-chieu.js';
import { R_MAT_TRANG_KM, CHU_KY_MAT_TRANG_NGAY, giayAnhSangKm } from '../vat-ly/khoang-cach-anh-sang.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, duongDayTinh, kep } from '../khung/ve.js';
import { MAU_KTG, luoi, matHienTai } from '../khung/ktg.js';
import { taoTraiDat, taoMatTrang } from '../khung/hanh-tinh.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('chieu-thu-tu', khoa, goc, thamSo);

const R = String.raw;
const DO = Math.PI / 180;

// ----- Thông số hình -----
const D = 3.2;              // khoảng cách «mắt bốn chiều» trong phép chiếu phối cảnh
const S3 = 1.7;             // phóng to chung sau khi chiếu
const K_VAT = { lp: 0.62, cau: 0.85, phim: 0.8 };   // tỉ lệ đưa từng vật vào khung nhìn (trước khi chiếu)
// Phim Trái Đất – Mặt Trăng: thời gian w từ −2 tới 2, Mặt Trăng quay 2,5 vòng, bán kính quỹ đạo 0,7.
const PHIM_W = 2, PHIM_VONG = 2.5, PHIM_R = 0.7, N_PHIM = 360, SO_ANH = 6;
const BUOC_PHIM = (2 * PHIM_W) / PHIM_VONG;          // bước xoắn trong hình (đơn vị dữ liệu)
const BUOC_THAT = (299792.458 * CHU_KY_MAT_TRANG_NGAY * 86400) / R_MAT_TRANG_KM; // bước xoắn thật / bán kính
const NEN_PHIM = BUOC_THAT / (BUOC_PHIM / PHIM_R);   // trục thời gian đã nén bấy nhiêu lần
// Siêu cầu: 9 «vĩ tuyến» w = sin θ, mỗi vĩ tuyến là mặt cầu bán kính cos θ vẽ bằng 3 vòng tròn lớn.
const VI_TUYEN = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => (k * Math.PI) / 10);
const N_VONG = 64;

// Màu theo hướng của cạnh: x trắng, y xanh lam, z hồng, w vàng (cạnh «mới»).
const MAU_HUONG = [0xffffff, MAU_KTG.thoiGian, MAU_KTG.hong, MAU_KTG.anhSang].map((h) => new THREE.Color(h));
const XANH_QUA = new THREE.Color(0x6f8cff), CAM_TOI = new THREE.Color(0xffa04d), TRANG_GIUA = new THREE.Color(0xe6ecff);
const LUC = new THREE.Color(MAU_KTG.hienTai);
const TEN_GIAI_DOAN = [chuCanh("canh.diem", "Điểm"), chuCanh("canh.doan-thang", "Đoạn thẳng"), chuCanh("canh.hinh-vuong", "Hình vuông"), chuCanh("canh.khoi-lap-phuong", "Khối lập phương"), chuCanh("canh.sieu-lap-phuong", "Siêu lập phương")];
const TEN_PHAN_TU = [chuCanh("canh.dinh", "đỉnh"), chuCanh("canh.canh", "cạnh"), chuCanh("canh.mat", "mặt"), chuCanh("canh.o", "ô")];
const THU_TAM_GIAC = [0, 1, 2, 0, 2, 3];     // một mặt vuông = hai tam giác

// Màu theo vị trí trên chiều thứ tư: f = −1 xanh lam, 0 trắng, +1 cam.
function mauTheoW(f, out) {
  f = kep(f, -1, 1);
  if (f < 0) out.copy(TRANG_GIUA).lerp(XANH_QUA, -f);
  else out.copy(TRANG_GIUA).lerp(CAM_TOI, f);
  return out;
}

// Bộ đoạn thẳng rời nhau, mỗi đầu một màu, cập nhật được mỗi khung hình (nét đậm theo điểm ảnh).
class BoDoan {
  // sang: nhân độ sáng của màu (lớn hơn 1 thì nét có quầng của bộ dựng hình).
  constructor(toiDa, { rong = 2, doMo = 1, quang = 0, cong = false, sang = 1 } = {}) {
    this.toiDa = toiDa;
    this.sang = sang;
    this.geo = new LineSegmentsGeometry();
    this.bo = new THREE.InstancedInterleavedBuffer(new Float32Array(toiDa * 6), 6, 1);
    this.bo.setUsage(THREE.DynamicDrawUsage);
    this.boMau = new THREE.InstancedInterleavedBuffer(new Float32Array(toiDa * 6), 6, 1);
    this.boMau.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('instanceStart', new THREE.InterleavedBufferAttribute(this.bo, 3, 0));
    this.geo.setAttribute('instanceEnd', new THREE.InterleavedBufferAttribute(this.bo, 3, 3));
    this.geo.setAttribute('instanceColorStart', new THREE.InterleavedBufferAttribute(this.boMau, 3, 0));
    this.geo.setAttribute('instanceColorEnd', new THREE.InterleavedBufferAttribute(this.boMau, 3, 3));
    this.mat = new LineMaterial({
      color: 0xffffff, linewidth: rong, vertexColors: true, transparent: true, opacity: doMo, depthWrite: false,
      blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.line = new LineSegments2(this.geo, this.mat);
    this.line.frustumCulled = false;
    if (quang > 0) {
      this.matQuang = new LineMaterial({ color: 0xffffff, linewidth: rong * 4.5, vertexColors: true, transparent: true, opacity: quang, depthWrite: false, blending: THREE.AdditiveBlending });
      const q = new LineSegments2(this.geo, this.matQuang);
      q.frustumCulled = false;
      q.renderOrder = -1;
      this.line.add(q);
    }
    this.geo.instanceCount = 0;
    this.n = 0;
  }
  batDau() { this.n = 0; }
  them(ax, ay, az, bx, by, bz, ca, cb = ca) {
    if (this.n >= this.toiDa) return;
    const j = this.n * 6, a = this.bo.array, m = this.boMau.array, k = this.sang;
    a[j] = ax; a[j + 1] = ay; a[j + 2] = az; a[j + 3] = bx; a[j + 4] = by; a[j + 5] = bz;
    m[j] = ca.r * k; m[j + 1] = ca.g * k; m[j + 2] = ca.b * k; m[j + 3] = cb.r * k; m[j + 4] = cb.g * k; m[j + 5] = cb.b * k;
    this.n++;
  }
  xong() { this.bo.needsUpdate = true; this.boMau.needsUpdate = true; this.geo.instanceCount = this.n; }
}

// Vật liệu kính (Bản 3): viền sáng theo góc nhìn (Fresnel), ánh phản chiếu của một nguồn sáng, mép mặt sáng dần
// (theo toạ độ uv của mặt), lưới mịn vẽ trong shader. Xuất màu tuyến tính.
//   cong = true: cộng sáng (không cần sắp thứ tự, dùng cho nhiều mặt chồng nhau);
//   cong = false: kính thật (làm tối nhẹ phía sau), dùng cho một khối lồi, vẽ mặt sau trước rồi mặt trước.
//   phang = true: pháp tuyến lấy theo đạo hàm màn hình (mặt phẳng ghép từ tam giác); false: dùng thuộc tính normal.
//   luoi = [số ô theo u, số ô theo v]; mauDinh = true: nhân thêm màu theo đỉnh.
function vatLieuKinh({ mau = 0xffffff, doMo = 0.15, vien = 1, phanChieu = 0.5, mep = 0, luoi = null, phang = true, cong = false, side = THREE.DoubleSide, mauDinh = false } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uVien: { value: vien }, uPC: { value: phanChieu },
      uMep: { value: mep }, uLuoi: { value: new THREE.Vector2(luoi ? luoi[0] : 0, luoi ? luoi[1] : 0) },
      uPhang: { value: phang ? 1 : 0 }, uCong: { value: cong ? 1 : 0 },
      uDen: { value: new THREE.Vector3(0.45, 0.8, 0.4).normalize() },
    },
    vertexColors: mauDinh,
    vertexShader: /* glsl */ `
      varying vec3 vPos; varying vec3 vN; varying vec3 vMau; varying vec2 vUv;
      void main() {
        vec4 p = modelMatrix * vec4(position, 1.0);
        vPos = p.xyz; vN = mat3(modelMatrix) * normal; vUv = uv;
        #ifdef USE_COLOR
          vMau = color;
        #else
          vMau = vec3(1.0);
        #endif
        gl_Position = projectionMatrix * viewMatrix * p;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau, uDen; uniform float uDoMo, uVien, uPC, uMep, uPhang, uCong; uniform vec2 uLuoi;
      varying vec3 vPos; varying vec3 vN; varying vec3 vMau; varying vec2 vUv;
      void main() {
        vec3 n = uPhang > 0.5 ? normalize(cross(dFdx(vPos), dFdy(vPos))) : normalize(vN);
        vec3 v = normalize(cameraPosition - vPos);
        float nv = dot(n, v);
        if (nv < 0.0) { n = -n; nv = -nv; }
        float fr = pow(1.0 - clamp(nv, 0.0, 1.0), 2.6);
        float kh = 0.4 + 0.6 * abs(dot(n, uDen));
        float pc = pow(max(dot(n, normalize(uDen + v)), 0.0), 70.0);
        vec3 c = uMau * vMau;
        float mep = 0.0;
        if (uMep > 0.0) {
          vec2 q = min(vUv, 1.0 - vUv);
          vec2 w = max(fwidth(vUv), vec2(1e-5));
          float px = min(q.x / w.x, q.y / w.y);
          mep = uMep * (exp(-px / 5.0) + 0.3 * exp(-min(q.x, q.y) * 7.0));
        }
        float l = 0.0;
        if (uLuoi.x > 0.0) {
          vec2 o = vec2(vUv.x * uLuoi.x, vUv.y * uLuoi.y);
          vec2 d = max(fwidth(o), vec2(1e-5));
          vec2 g = abs(fract(o - 0.5) - 0.5) / d;
          l = (1.0 - smoothstep(0.3, 1.3, min(g.x, g.y))) * smoothstep(0.02, 0.12, min(vUv.y, 1.0 - vUv.y));
        }
        vec3 ra = c * (uDoMo * kh * 1.3 + uVien * fr * 0.9 + mep + l * 0.45) + vec3(1.0) * pc * uPC;
        if (uCong > 0.5) { gl_FragColor = vec4(ra, 1.0); return; }
        float a = clamp(uDoMo * kh + uVien * fr * 0.5 + l * 0.25 + pc * uPC * 0.5, 0.02, 0.9);
        gl_FragColor = vec4(ra / a, a);
      }`,
    transparent: true, depthWrite: false, side,
    blending: cong ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  m.tuyenTinh = true;
  return m;
}

export default {
  id: 'chieu-thu-tu',
  ten: 'Chiều thứ tư',
  moTa: 'Từ điểm tới siêu lập phương; chiếu và cắt lát vật bốn chiều',
  yChinh: 'Mỗi chiều mới là một hướng vuông góc với mọi hướng cũ. Ta không nhìn thấy trọn một vật bốn chiều, chỉ thấy **hình chiếu** (bóng) và **lát cắt** của nó. Thời gian có thể đóng vai chiều thứ tư, và «bây giờ» là một lát cắt; nhưng thời gian khác chiều không gian ở một **dấu trừ**.',
  mayAnh: { viTri: [4.6, 3.4, 8.6], dich: [0, 0, 0], fov: 40, min: 3, max: 40 },
  hinh: { quang: 0.4, nguong: 0.95 },

  baiGiang: {
    mucTieu: [
      'Nói được «số chiều» là gì và dựng được khối lập phương n chiều bằng cách kéo khối n − 1 chiều.',
      'Đếm được đỉnh, cạnh, mặt, ô của siêu lập phương và giải thích quy luật đếm.',
      'Phân biệt hình chiếu và lát cắt của một vật bốn chiều; tính được bán kính lát cắt của siêu cầu.',
      'Giải thích được vì sao có thể coi thời gian là chiều thứ tư, và «bây giờ» là một lát cắt.',
      'Chỉ ra chỗ khác nhau giữa thời gian và chiều không gian: dấu trừ trong khoảng cách, vòng tròn thành hyperbol.',
    ],
    buoc: [
      {
        ten: 'Chiều là gì: kéo điểm thành khối',
        noiDung: R`
          Trên màn hình là một khối lập phương màu trắng, xanh, hồng. Nó được dựng từ một điểm, bằng ba lần **kéo**.

          Số chiều của một không gian là **số con số cần có để chỉ ra một điểm** trong đó. Trên sợi dây cần một số (cách đầu dây bao xa). Trên mặt bàn cần hai số. Trong căn phòng cần ba số: dài, rộng, cao. Mỗi con số như thế gọi là một {{tọa độ}}.

          Mỗi lần thêm một chiều, ta có thêm một hướng mới **vuông góc với mọi hướng cũ**. Kéo một điểm theo hướng $x$ được đoạn thẳng. Kéo đoạn thẳng theo hướng $y$ (vuông góc với nó) được hình vuông. Kéo hình vuông theo hướng $z$ được khối lập phương.

          > [Thử ngay] Xem lại từng lần kéo. Màu của cạnh cho biết nó được kéo theo hướng nào: $x$ trắng, $y$ xanh lam, $z$ hồng.
          > [[Điểm|k0]] [[Đoạn thẳng|k1]] [[Hình vuông|k2]] [[Lập phương|k3]] [[Xem kéo từ đầu|chay]]
          >
          > Hoặc tự tay kéo đỉnh vàng dọc đường mờ: lùi về thành điểm, rồi kéo ra đoạn thẳng, hình vuông, lập phương. Mỗi lần xong một chiều có một tiếng chuông, cao dần theo số chiều (tiếng chỉ để đánh dấu).

          | Hình | Số chiều | Đỉnh | Cạnh | Mặt | Ô (khối) |
          |---|---|---|---|---|---|
          | điểm | 0 | 1 | | | |
          | đoạn thẳng | 1 | 2 | 1 | | |
          | hình vuông | 2 | 4 | 4 | 1 | |
          | lập phương | 3 | 8 | 12 | 6 | 1 |

          > [Lưu ý] «Chiều» ở đây là chiều của không gian, không phải kích thước. Một sợi tóc rất mảnh vẫn là vật ba chiều; ta coi nó là một chiều chỉ khi bỏ qua bề dày.`,
        vao: (c) => c.cauHinh({ vat: 'lp', keo: 3, keoDich: null, huong: 'mat', goc: [0, 0, 0], tuQuay: false, cat: false, chieu: 'phoi', mau: 'huong', tay: { keo: true }, vao: true, mayAnh: 'cheo' }),
        ra: (c) => c.tatTieng(),
        nut: { k0: (c) => c.keoToi(0), k1: (c) => c.keoToi(1), k2: (c) => c.keoToi(2), k3: (c) => c.keoToi(3), chay: (c) => c.keoTuDau(3) },
      },
      {
        ten: 'Kéo thêm lần nữa: siêu lập phương',
        noiDung: R`
          Giờ kéo khối lập phương theo một hướng thứ tư, $w$, vuông góc với cả $x$, $y$, $z$. Không gian của ta không có chỗ cho hướng ấy, nhưng toán học thì không ngại: điểm chỉ cần thêm một tọa độ, $(x;\ y;\ z;\ w)$. Kết quả là {{siêu lập phương}}.

          > [Thử ngay] [[Kéo theo hướng thứ tư|k4]] [[Về khối lập phương|k3]] [[Xem kéo từ đầu|chay]]
          >
          > Hoặc tự kéo đỉnh vàng: đoạn đường mờ cuối cùng, màu vàng, chính là hướng $w$ trong hình chiếu.

          Cái bạn thấy là **khối nhỏ nằm trong khối lớn**, nối với nhau bằng 8 cạnh vàng. Các cạnh vàng là vết kéo theo hướng $w$: chúng dài bằng mọi cạnh khác, chỉ trông ngắn đi vì bị chiếu.

          ### Đếm

          Mỗi lần kéo, mọi thứ cũ có **hai bản** (bản đầu và bản cuối), và mỗi phần tử thấp hơn một bậc để lại một **vết kéo**. Từ lập phương (8 đỉnh, 12 cạnh, 6 mặt, 1 ô):

          - đỉnh: $2 \times 8 = 16$;
          - cạnh: $2 \times 12 + 8 = 32$ (8 cạnh vàng là vết của 8 đỉnh);
          - mặt: $2 \times 6 + 12 = 24$;
          - ô: $2 \times 1 + 6 = 8$ khối lập phương.

          > [Lưu ý] Đây là **hình chiếu**, giống cái bóng của một khối lập phương in lên tường: bóng của khối 3 chiều trên tường 2 chiều trông như «hình vuông nhỏ trong hình vuông lớn». Bóng làm sai độ dài và góc, nhưng giữ đúng cái gì nối với cái gì.

          +++ Đi sâu: công thức đếm cho n chiều, và phép chiếu phối cảnh
          Khối lập phương $n$ chiều (cạnh 2, tâm ở gốc) có đỉnh là mọi bộ $(\pm 1;\ \pm 1;\ \dots;\ \pm 1)$. Một phần tử $k$ chiều được chọn bằng cách: chọn $k$ tọa độ được tự do chạy (có $\binom{n}{k}$ cách), rồi gán $\pm 1$ cho $n - k$ tọa độ còn lại ($2^{n-k}$ cách). Vậy

          $$ N_k(n) = \binom{n}{k}\, 2^{\,n-k} $$

          Với $n = 4$: $N_0 = 16$, $N_1 = 4 \times 8 = 32$, $N_2 = 6 \times 4 = 24$, $N_3 = 4 \times 2 = 8$. Kiểm lại bằng công thức Euler cho vật 4 chiều: $16 - 32 + 24 - 8 = 0$.

          Phép chiếu ở đây là **phối cảnh**: đặt «mắt» trên trục $w$ ở khoảng cách $d = 3{,}2$, mỗi điểm được vẽ tại $(x;\ y;\ z) \cdot \dfrac{d}{d - w}$. Phần nào có $w$ lớn (gần mắt) trông to ra; phần nào có $w$ nhỏ trông nhỏ đi. Vì thế ô $w = -1$ trông như khối nhỏ ở trong, ô $w = +1$ là khối lớn bao ngoài.
          +++`,
        vao: (c) => c.cauHinh({ vat: 'lp', keo: 3, keoDich: 4, huong: 'mat', goc: [0, 0, 0], tuQuay: false, cat: false, chieu: 'phoi', mau: 'huong', tay: { keo: true }, vao: true, mayAnh: 'chinh' }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: 'Kéo đỉnh vàng về lại khối lập phương, rồi tự kéo nó theo hướng thứ tư cho tới khi đủ siêu lập phương: 16 đỉnh, 32 cạnh.',
          kiem: (c) => c.dat.sieuLapPhuong(),
          goiY: 'Đoạn đường mờ cuối cùng (màu vàng) chĩa ra ngoài theo đường chéo: đó là hướng w sau khi chiếu. Kéo đỉnh vàng tới hết đoạn ấy.',
        },
        nut: { k4: (c) => c.keoToi(4), k3: (c) => c.keoToi(3), chay: (c) => c.keoTuDau(4) },
      },
      {
        ten: 'Quay trong bốn chiều',
        noiDung: R`
          Siêu lập phương đang quay. Có lúc khối trong phình ra, khối ngoài co lại, rồi chúng **đổi chỗ** cho nhau. Không khối nào thật sự to hay nhỏ hơn: cả 8 ô đều là khối lập phương bằng nhau. Chỉ phép chiếu phối cảnh làm ô gần «mắt bốn chiều» trông to hơn.

          Trong ba chiều ta quen nói «quay quanh một trục». Nói cho đúng hơn: phép quay xảy ra **trong một mặt phẳng**. Bánh xe quay trong mặt phẳng của nó; trục chỉ là hướng còn lại không bị đụng tới. Trong ba chiều, mỗi mặt phẳng chỉ còn đúng một hướng vuông góc, nên gọi theo trục cũng được. Trong bốn chiều, mặt phẳng $xw$ có tới hai hướng vuông góc ($y$ và $z$), nên không còn «trục quay» nữa.

          Bốn trục cho $\binom{4}{2} = 6$ mặt phẳng tọa độ: $xy$, $xz$, $yz$ (ba phép quay ta quen), và $xw$, $yw$, $zw$ (ba phép quay mới).

          > [Thử ngay] Chọn mặt phẳng để quay. La bàn bốn mũi tên ở phía trên bên trái cho biết bốn trục đang chĩa về đâu sau khi quay.
          > [[Quay trong xw|xw]] [[Quay trong yw|yw]] [[Quay trong xy (quay thường)|xy]] [[Dừng quay|dung]]
          >
          > Hoặc tự kéo đốm tím quanh vòng dưới vật: góc trên vòng là góc quay trong mặt phẳng đang chọn. Cạnh và đỉnh giờ tô theo tọa độ $w$: xanh lam phía âm, cam phía dương. Khi kéo, mỗi nấc 15° có một tiếng tích, mỗi 90° một tiếng chuông.

          +++ Đi sâu: ma trận quay trong mặt phẳng xw
          Quay góc $\alpha$ trong mặt phẳng $xw$ chỉ đổi hai tọa độ $x$ và $w$, còn $y$, $z$ giữ nguyên:

          $$ x' = x\cos\alpha - w\sin\alpha, \qquad w' = x\sin\alpha + w\cos\alpha $$

          Phép quay giữ nguyên khoảng cách $\sqrt{x^2 + y^2 + z^2 + w^2}$, vì $x'^2 + w'^2 = x^2 + w^2$. Khi $\alpha = 90°$, ô $x = +1$ chuyển sang chỗ của ô $w = +1$: khối «trong» và khối «ngoài» là hai ô bất kỳ, tuỳ hướng ta nhìn.
          +++`,
        vao: (c) => c.cauHinh({ vat: 'lp', keo: 4, keoDich: null, huong: 'mat', goc: [0, 0, 0], tuQuay: true, matQuay: 'xw', cat: false, chieu: 'phoi', mau: 'w', tay: { quay: true }, vao: true, mayAnh: 'chinh' }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: R`Kéo đốm tím để quay trong mặt phẳng $xw$ đúng 90° (theo chiều nào cũng được, sai số 4°). Khi đó một ô vốn nằm bên cạnh ($x = \pm 1$) đã thành khối ngoài.`,
          kiem: (c) => c.dat.quay90(),
          goiY: 'Nắm đốm tím là vật tự dừng quay. Đốm bắt dính khi tới đúng 90°; tiếng chuông báo bội số của 90°.',
        },
        nut: {
          xw: (c) => c.quay('xw'), yw: (c) => c.quay('yw'), xy: (c) => c.quay('xy'), dung: (c) => c.quay(null),
        },
      },
      {
        ten: 'Cắt lát: sinh vật phẳng gặp quả cầu',
        noiDung: R`
          Bên trái là một **thế giới phẳng**: tấm lưới xanh lục. Năm 1884, Edwin Abbott viết truyện *Flatland* kể về những sinh vật sống trên một mặt phẳng như thế. Một quả cầu đi xuyên qua thế giới của chúng. Chúng không thấy quả cầu; chúng chỉ thấy **chỗ quả cầu cắt mặt phẳng**: một chấm, rồi vòng tròn lớn dần, nhỏ dần, rồi biến mất.

          Bên phải là chuyện y hệt, nâng lên một chiều. Một {{siêu cầu}} (mặt cầu ba chiều nằm trong bốn chiều) đi xuyên qua không gian của ta. Ta thấy **một quả cầu** hiện ra từ một điểm, phồng lên, xẹp đi, rồi biến mất. Thứ ta thấy được gọi là {{lát cắt}} của vật bốn chiều với {{siêu phẳng}} $w = w_0$.

          $$ r = \sqrt{R^2 - w_0^2} $$

          $R$ là bán kính siêu cầu, $w_0$ là vị trí lát cắt trên trục thứ tư, $r$ là bán kính quả cầu ta thấy. Ví dụ $R = 1$, $w_0 = 0{,}6$: $r = \sqrt{1 - 0{,}36} = 0{,}8$.

          > [Thử ngay] [[Cho vật đi xuyên qua|chay]] [[Dừng ở w₀ = 0,6|w06]] [[Cắt ngay giữa|w0]]
          >
          > Hoặc kéo đốm xanh lục dọc thước $w$ bên phải để tự dời lát cắt. Khi lát cắt di chuyển có một tiếng ngân: quả cầu càng nhỏ, tiếng càng cao. Cao độ chỉ là cách cho tai theo dõi bán kính $r$, không phải âm thanh của vật.

          Phần siêu cầu đã đi qua lát cắt ($w \lt w_0$) tô ngả xanh lam, phần chưa tới ngả cam.

          > [Lưu ý] Vòng dây của siêu cầu là 9 «vĩ tuyến», mỗi vĩ tuyến là một mặt cầu thường (vẽ bằng 3 vòng tròn) nằm ở một mức $w$. Hình chiếu phối cảnh làm các vĩ tuyến có $w$ lớn trông to hơn.`,
        vao: (c) => c.cauHinh({ vat: 'cau', huong: 'mat', goc: [0, 0, 0], tuQuay: false, cat: true, chayCat: true, f: -1.05, phang: true, chieu: 'phoi', tay: { w: true }, vao: true, mayAnh: 'phang' }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: R`Kéo lát cắt tới chỗ quả cầu ta thấy có bán kính đúng $r = 0{,}6$ (sai số 0,02). Lát cắt khi đó nằm ở $w_0$ bằng bao nhiêu?`,
          kiem: (c) => c.dat.cau06(),
          goiY: R`$r = \sqrt{1 - w_0^2} = 0{,}6$ nên $w_0^2 = 0{,}64$, tức $w_0 = \pm 0{,}8$. Đốm bắt dính khi tới gần.`,
        },
        nut: { chay: (c) => c.chayCat(true), w06: (c) => c.datW0(0.6), w0: (c) => c.datW0(0) },
      },
      {
        ten: 'Cắt siêu lập phương',
        noiDung: R`
          Giờ cho siêu lập phương đi xuyên qua không gian của ta. Khối xanh lục là lát cắt; các đốm sáng là chỗ các cạnh xuyên qua siêu phẳng. Hình lát cắt **tuỳ hướng** vật đi tới.

          ### Mặt trước

          Đặt siêu lập phương thẳng, một ô (khối lập phương) đi trước. Lát cắt là một **khối lập phương** hiện ra đột ngột, giữ nguyên cỡ suốt chặng đường, rồi biến mất đột ngột. Giống một hình vuông đi qua Flatland theo mặt: sinh vật phẳng thấy một đoạn thẳng không đổi.

          ### Đỉnh trước

          Quay sao cho một đỉnh đi trước. Lát cắt bắt đầu từ **một điểm**, thành **tứ diện** lớn dần, bị cắt cụt các góc thành **tứ diện cụt**, tới giữa đường thành **bát diện đều**, rồi diễn lại theo chiều ngược.

          > [Thử ngay] [[Mặt trước, cho đi qua|mat]] [[Đỉnh trước, cho đi qua|dinh]]
          > [[Tứ diện (s = −3)|s3]] [[Tứ diện cụt (s = −1)|s1]] [[Bát diện (s = 0)|s0]]
          >
          > Hoặc kéo đốm xanh lục trên thước $w$ để tự cắt, kéo đốm tím để quay vật trước khi cắt. Mỗi khi lát cắt đổi dạng có một tiếng chuông; khối càng nhiều đỉnh, chuông càng cao.

          +++ Đi sâu: vì sao lại là tứ diện, tứ diện cụt, bát diện?
          Ở hướng «đỉnh trước», trục $w$ mới chạy dọc đường chéo lớn của siêu lập phương: $w = \tfrac{1}{2}(x_1 + x_2 + x_3 + x_4)$. Gọi $s = x_1 + x_2 + x_3 + x_4$. Mỗi đỉnh có các tọa độ $\pm 1$, nên $s$ chỉ nhận 5 giá trị:

          | $s$ | −4 | −2 | 0 | 2 | 4 |
          |---|---|---|---|---|---|
          | số đỉnh | 1 | 4 | 6 | 4 | 1 |

          (đó là $\binom{4}{0}, \binom{4}{1}, \dots$ theo số tọa độ bằng +1).

          - $s = -3$: siêu phẳng cắt 4 cạnh đi ra từ đỉnh $s = -4$: **4 đỉnh**, tứ diện.
          - $s = -1$: cắt 12 cạnh nối tầng $s = -2$ với tầng $s = 0$: **12 đỉnh**, 4 mặt tam giác và 4 mặt lục giác, mọi cạnh dài $\sqrt{2}$: tứ diện cụt.
          - $s = 0$: siêu phẳng đi đúng qua 6 đỉnh tầng giữa: **6 đỉnh**, 12 cạnh dài bằng nhau ($2\sqrt{2}$): bát diện đều.
          +++`,
        vao: (c) => c.cauHinh({ vat: 'lp', keo: 4, keoDich: null, huong: 'mat', goc: [0, 0, 0], tuQuay: false, cat: true, chayCat: true, f: -1.05, phang: false, chieu: 'phoi', mau: 'huong', tay: { w: true, quay: true }, vao: true, mayAnh: 'chinh' }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: 'Chọn hướng «Đỉnh trước», rồi tự kéo lát cắt tới đúng chỗ nó thành **bát diện đều**.',
          kiem: (c) => c.dat.batDien(),
          goiY: R`Bát diện đều chỉ có ở đúng giữa đường, $s = 0$, tức $w_0 = 0$. Lệch một chút là thành tứ diện cụt; đốm bắt dính khi tới gần.`,
        },
        nut: {
          mat: (c) => c.cauHinh({ huong: 'mat', goc: [0, 0, 0], tuQuay: false, cat: true, chayCat: true, f: -1.05 }),
          dinh: (c) => c.cauHinh({ huong: 'dinh', goc: [0, 0, 0], tuQuay: false, cat: true, chayCat: true, f: -1.05 }),
          s3: (c) => { c.cauHinh({ huong: 'dinh', goc: [0, 0, 0], tuQuay: false, cat: true }); c.datW0(-1.5); },
          s1: (c) => { c.cauHinh({ huong: 'dinh', goc: [0, 0, 0], tuQuay: false, cat: true }); c.datW0(-0.5); },
          s0: (c) => { c.cauHinh({ huong: 'dinh', goc: [0, 0, 0], tuQuay: false, cat: true }); c.datW0(0); },
        },
      },
      {
        ten: 'Thời gian làm chiều thứ tư',
        noiDung: R`
          Lấy một cuộn phim Trái Đất và Mặt Trăng. Mỗi khung hình là một ảnh chụp ba chiều. Giờ xếp các khung chồng lên nhau theo một hướng mới $w$, mỗi khung ở mức $w = ct$ ứng với lúc chụp. Đó là một vật bốn chiều.

          Lúc đầu, trục $w$ chĩa thẳng vào chiều thứ tư nên ta không thấy nó: 6 ảnh chụp **chồng khít lên nhau**, như một tấm ảnh phơi sáng nhiều lần. Trái Đất nằm một chỗ, Mặt Trăng để lại 6 vị trí trên cùng một vòng tròn.

          > [Thử ngay] Quay trong mặt phẳng $xw$ để trục thời gian lộ ra.
          > [[Quay trục thời gian ra (xw = −90°)|lo]] [[Về 0°|ve]] [[Cắt lát «bây giờ»|nay]]
          >
          > Hoặc tự kéo đốm tím quanh vòng để quay trục thời gian ra. Khi đã cắt lát, kéo đốm xanh lục để dời «bây giờ»: mỗi lần lát cắt đi qua một ảnh chụp có một tiếng tích.

          Khi trục thời gian lộ ra, Trái Đất là một đường thẳng, Mặt Trăng là một đường xoắn ốc quấn quanh nó. Mỗi vật là một «con sâu» bốn chiều, tức {{đường thế giới}} của nó (Bài 4 học kỹ). «Thế giới lúc này» chỉ là **một lát cắt** ngang qua con sâu: hai quả cầu nhỏ.

          > [Con số] Quỹ đạo Mặt Trăng bán kính 384 400 km, tức 1,28 giây ánh sáng. Mỗi vòng mất 27,32 ngày, trong lúc đó ánh sáng đi được $c \times 27{,}32$ ngày $\approx 7{,}08 \times 10^{11}$ km. Vậy bước xoắn thật dài gấp khoảng **1,84 triệu lần** bán kính.

          > [Lưu ý] Trong hình, trục thời gian đã bị **nén khoảng 800 000 lần** để thấy được 2,5 vòng xoắn. Vẽ đúng tỉ lệ, con sâu của Mặt Trăng gần như một đường thẳng.`,
        vao: (c) => c.cauHinh({ vat: 'phim', huong: 'mat', goc: [0, 0, 0], tuQuay: false, cat: false, chieu: 'thang', tay: { quay: true, w: true }, matQuay: 'xw', vao: true, mayAnh: 'phim' }),
        ra: (c) => c.tatTieng(),
        nut: {
          lo: (c) => c.datGoc('xw', -90, true), ve: (c) => c.datGoc('xw', 0, true),
          nay: (c) => { c.datGoc('xw', -72, true); c.cauHinh({ cat: true, chayCat: true, f: -1 }); },
        },
      },
      {
        ten: 'Nhưng thời gian không phải chiều không gian thứ tư',
        noiDung: R`
          Phép xếp phim cho ta trực giác, nhưng nó giấu một điểm quan trọng. Trong không gian bốn chiều thường, khoảng cách giữa hai điểm tính theo Pythagoras, bốn dấu cộng:

          $$ s^2 = \Delta x^2 + \Delta y^2 + \Delta z^2 + \Delta w^2 $$

          Trong {{không-thời gian}}, thời gian vào công thức với **dấu trừ** (đo $t$ bằng $ct$ cho cùng đơn vị độ dài):

          $$ s^2 = -(c\Delta t)^2 + \Delta x^2 + \Delta y^2 + \Delta z^2 $$

          Dấu trừ ấy đổi hẳn hình học. Bên trái: một điểm quay trong mặt phẳng $(x;\ w)$ chạy trên **vòng tròn** $x^2 + w^2 =$ hằng số; nó lần lượt chĩa lên, sang ngang, rồi chúc xuống. Bên phải: phép «quay» của không-thời gian (đổi sang một người quan sát đang bay, Bài 6) giữ $-t^2 + x^2$ không đổi, nên điểm chạy trên **hyperbol**.

          Chấm hồng trên nhánh trên của hyperbol (một sự kiện ở tương lai của gốc) trượt qua lại nhưng **không bao giờ xuống dưới** trục $x$. Không phép đổi người quan sát nào xoay được tương lai thành quá khứ. Hai đường chéo vàng là ánh sáng; không gì vượt qua chúng.

          > [Thử ngay] [[Xem hai đường|xem]] [[Trở lại siêu lập phương|lp]]
          >
          > Hoặc tự kéo chấm trắng quanh vòng tròn và kéo chấm hồng dọc hyperbol: chấm trắng xuống được dưới trục $x$, chấm hồng thì không.

          > [Tóm lại] Bốn chiều là đúng: cần bốn con số để chỉ một sự kiện. Nhưng thời gian là một chiều **khác loại**: nó mang dấu trừ. Chính dấu trừ ấy sinh ra nón ánh sáng (Bài 5), giãn thời gian và co độ dài (Bài 6).`,
        vao: (c) => c.cauHinh({ vat: 'soSanh', mayAnh: 'soSanh', cat: false, tuQuay: false, tay: { ss: true }, vao: true }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: R`Kéo chấm hồng dọc hyperbol tới $x = 2$ (sai số 0,1). Trước khi nhìn ô số liệu, tự tính $t$ từ $-t^2 + x^2 = -1$.`,
          kiem: (c) => c.dat.hyp2(),
          goiY: R`$t^2 = 1 + x^2 = 5$, nên $t = \sqrt{5} \approx 2{,}24$: vẫn dương, sự kiện vẫn ở tương lai.`,
        },
        nut: {
          xem: (c) => c.cauHinh({ vat: 'soSanh', mayAnh: 'soSanh' }),
          lp: (c) => c.cauHinh({ vat: 'lp', keo: 4, keoDich: null, huong: 'mat', goc: [0, 0, 0], tuQuay: true, matQuay: 'xw', cat: false, chieu: 'phoi', mayAnh: 'chinh' }),
        },
      },
    ],
    congThuc: [
      { ten: 'Số phần tử của khối lập phương n chiều', tex: R`N_k(n) = \binom{n}{k}\,2^{\,n-k}`, y: '$k = 0$ đỉnh, $1$ cạnh, $2$ mặt, $3$ ô. Siêu lập phương ($n = 4$): 16, 32, 24, 8.' },
      { ten: 'Quay trong mặt phẳng xw', tex: R`x' = x\cos\alpha - w\sin\alpha,\quad w' = x\sin\alpha + w\cos\alpha`, y: 'Hai tọa độ còn lại ($y$, $z$) không đổi. Bốn chiều có 6 mặt phẳng quay: $xy, xz, yz, xw, yw, zw$.' },
      { ten: 'Chiếu phối cảnh từ 4 chiều về 3 chiều', tex: R`(x;\ y;\ z) \mapsto (x;\ y;\ z)\cdot\frac{d}{d - w}`, y: '$d$ là khoảng cách từ «mắt» tới gốc dọc theo trục $w$. Phần có $w$ lớn trông to hơn.' },
      { ten: 'Lát cắt của siêu cầu', tex: R`r = \sqrt{R^2 - w_0^2}`, y: 'Siêu phẳng $w = w_0$ cắt siêu cầu bán kính $R$ theo một mặt cầu bán kính $r$.' },
      { ten: 'Khoảng cách: không gian 4 chiều và không-thời gian', tex: R`\Delta x^2 + \Delta y^2 + \Delta z^2 + \Delta w^2 \quad\text{và}\quad -(c\Delta t)^2 + \Delta x^2 + \Delta y^2 + \Delta z^2`, y: 'Chỉ khác một dấu, nhưng vòng tròn thành hyperbol.' },
    ],
    cauHoi: [
      {
        hoi: 'Khối lập phương năm chiều có bao nhiêu đỉnh và bao nhiêu cạnh?',
        chon: ['32 đỉnh, 40 cạnh', '32 đỉnh, 80 cạnh', '25 đỉnh, 50 cạnh', '20 đỉnh, 64 cạnh'],
        dung: 1,
        giai: R`Đỉnh: $2^5 = 32$. Cạnh: $\binom{5}{1} 2^4 = 80$, hay theo lối kéo: hai bản siêu lập phương ($2 \times 32 = 64$ cạnh) cộng 16 vết kéo của 16 đỉnh. Chọn 40 là chỉ lấy một nửa số cạnh đúng; quên vết kéo thì được 64, quên nhân đôi thì được 48.`,
      },
      {
        hoi: 'Một siêu cầu bán kính 5 đi xuyên qua không gian của ta. Khi lát cắt ở w₀ = 3, ta thấy gì?',
        chon: ['Một quả cầu bán kính 2', 'Một quả cầu bán kính 4', 'Một vòng tròn bán kính 4', 'Một quả cầu bán kính 5 nhưng mờ hơn'],
        dung: 1,
        giai: R`$r = \sqrt{25 - 9} = 4$. Lát cắt của vật bốn chiều với siêu phẳng là một vật **ba chiều** (quả cầu), không phải vòng tròn. Chọn 2 là lấy $5 - 3$ thay cho Pythagoras.`,
      },
      {
        hoi: 'Hình chiếu phối cảnh của siêu lập phương trông như «khối nhỏ trong khối lớn». Điều nào đúng?',
        chon: ['Ô bên trong thật sự nhỏ hơn các ô khác', 'Mọi ô đều là khối lập phương bằng nhau; ô trong trông nhỏ vì nằm xa «mắt» hơn theo hướng w', 'Siêu lập phương chỉ có 2 ô', 'Các cạnh vàng ngắn hơn các cạnh khác'],
        dung: 1,
        giai: 'Cả 8 ô bằng nhau, mọi cạnh dài bằng nhau. Phép chiếu phối cảnh thu nhỏ phần ở xa (w nhỏ), như đường ray ở xa trông hẹp lại. Quay trong mặt phẳng xw là thấy khối trong và khối ngoài đổi chỗ.',
      },
      {
        hoi: 'Siêu lập phương đi xuyên qua không gian của ta theo hướng «đỉnh trước». Lát cắt ở chính giữa là gì?',
        chon: ['Khối lập phương', 'Tứ diện', 'Bát diện đều', 'Quả cầu'],
        dung: 2,
        giai: R`Ở giữa, siêu phẳng $x_1 + x_2 + x_3 + x_4 = 0$ đi qua 6 đỉnh có hai tọa độ bằng $+1$, hai tọa độ bằng $-1$. Sáu đỉnh đó tạo thành bát diện đều (12 cạnh bằng nhau). Khối lập phương là lát cắt theo hướng «mặt trước».`,
      },
      {
        hoi: 'Trong không gian bốn chiều thường, quay một vật 180° trong mặt phẳng xw thì phía w dương thành phía w âm. Vì sao không làm được như thế với thời gian, tức xoay một sự kiện ở tương lai thành quá khứ?',
        dap: R`Vì thời gian vào khoảng cách với dấu trừ: phép «quay» của không-thời gian giữ $-t^2 + x^2$ không đổi chứ không giữ $t^2 + x^2$. Điểm chạy trên hyperbol chứ không trên vòng tròn. Một sự kiện ở tương lai của gốc (nằm trên nhánh trên, $t^2 - x^2 > 0$) luôn ở nhánh trên, nên $t$ luôn dương: không người quan sát nào thấy nó ở quá khứ.`,
      },
      {
        hoi: 'Phim Trái Đất – Mặt Trăng trong hình đã nén trục thời gian. Vẽ đúng tỉ lệ thì đường thế giới của Mặt Trăng trông thế nào, và vì sao?',
        dap: R`Gần như thẳng. Bước xoắn thật bằng $c \times 27{,}32$ ngày $\approx 7{,}1 \times 10^{11}$ km, gấp khoảng 1,84 triệu lần bán kính quỹ đạo 384 400 km. Một lò xo có bước dài gấp gần hai triệu lần bán kính thì trông như sợi chỉ căng thẳng.`,
      },
    ],
    docThem: [
      'E. A. Abbott, *Flatland* (1884): sinh vật hai chiều gặp một quả cầu; cách nghĩ «nâng lên một chiều» dùng suốt bài này.',
      'E. F. Taylor và J. A. Wheeler, *Spacetime Physics* (bản 2, 1992), chương 1: không-thời gian, và chỗ khác nhau giữa khoảng cách thường với khoảng không-thời gian.',
      'R. P. Feynman, *The Feynman Lectures on Physics*, tập I, chương 17 «Space-Time»: thời gian như một chiều, và dấu trừ trong khoảng.',
      'H. Minkowski, bài giảng «Raum und Zeit» (Không gian và thời gian), Köln, 1908.',
    ],
    thuatNgu: [
      { vi: 'chiều', en: 'dimension', nghia: 'Số con số (tọa độ) cần có để chỉ ra một điểm. Mỗi chiều mới là một hướng vuông góc với mọi hướng cũ.' },
      { vi: 'hình chiếu', en: 'projection', nghia: 'Ảnh của vật trên một không gian ít chiều hơn, như bóng trên tường. Giữ đúng cái gì nối với cái gì, nhưng làm sai độ dài và góc.' },
      { vi: 'lát cắt', en: 'cross-section, slice', nghia: 'Phần chung của vật với một mặt phẳng (hay siêu phẳng). Lát cắt của vật bốn chiều là một vật ba chiều.' },
      { vi: 'siêu phẳng', en: 'hyperplane', nghia: 'Trong không gian bốn chiều: tập hợp các điểm thoả một phương trình bậc nhất, ví dụ w = w0. Bản thân nó là một không gian ba chiều.' },
      { vi: 'siêu cầu', en: 'hypersphere, 3-sphere', nghia: 'Tập hợp các điểm trong không gian bốn chiều cách tâm một khoảng R: x² + y² + z² + w² = R². Lát cắt của nó là các quả cầu.' },
      { vi: 'ô', en: 'cell', nghia: 'Phần tử ba chiều của một vật bốn chiều. Siêu lập phương có 8 ô, mỗi ô là một khối lập phương.' },
    ],
  },

  conSo: [
    '**16 · 32 · 24 · 8**: số đỉnh, cạnh, mặt, ô của siêu lập phương.',
    '**6**: số mặt phẳng quay trong bốn chiều (xy, xz, yz, xw, yw, zw).',
    '**1,28 giây ánh sáng**: bán kính quỹ đạo Mặt Trăng, 384 400 km.',
    '**1,84 triệu lần**: bước xoắn thật của đường thế giới Mặt Trăng so với bán kính quỹ đạo.',
  ],
  hieuDung: '**«Chiều thứ tư là thời gian» chỉ đúng một nửa.** Cần bốn con số để chỉ một sự kiện, nên không-thời gian có bốn chiều. Nhưng thời gian không phải một hướng không gian bị giấu đi: nó vào công thức khoảng cách với dấu trừ, nên không thể «quay» tương lai thành quá khứ như quay một vật trong bốn chiều không gian.',
  nguon: 'Hình học siêu lập phương và siêu cầu: tính trực tiếp (src/vat-ly/bon-chieu.js). Mặt Trăng: bán trục lớn 384 400 km, tháng thiên văn 27,32 ngày (NASA, Moon Fact Sheet). Tốc độ ánh sáng: CODATA 2018.',

  tao(app) {
    const am = app.am, tt = app.tt;
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 1500, hat: 43, doSang: 0.42 }));
    scene.add(new THREE.AmbientLight(0x8a96b8, 0.45));
    const den1 = new THREE.DirectionalLight(0xfff1e0, 2.4);
    den1.position.set(4, 6, 5);
    const den2 = new THREE.DirectionalLight(0x7fa8ff, 1.3);
    den2.position.set(-5, 2, -6);
    scene.add(den1, den2);

    const S = {
      vat: 'lp', keo: 3, keoDich: null, huong: 'mat', chieu: 'phoi', mau: 'huong',
      goc: { xy: 0, xw: 0, yw: 0, zw: 0 }, gocDich: null, tuQuay: false, matQuay: 'xw',
      cat: false, chayCat: false, f: 0, phang: false, thoiGian: 0,
      tay: { keo: false, quay: false, w: false, ss: false },
      // Nguồn của thay đổi gần nhất (để thử thách chỉ tính thao tác của người học, không tính nút «thử ngay»).
      keoTay: false, daVe3: false, gocTay: false, wTay: false,
      ssTay: false, phaTron: 0.6, etaHyp: 0.4,
    };
    const M = new Float64Array(16);
    const W = new Float64Array(64);                      // 16 đỉnh siêu lập phương sau khi quay
    const boCat = taoBoCat();
    const v4 = [0, 0, 0, 0], o4 = [0, 0, 0, 0], p3 = [0, 0, 0], q3 = [0, 0, 0];
    const cA = new THREE.Color(), cB = new THREE.Color();
    let tamVuon = 1;                                     // độ vươn lớn nhất của vật theo w (sau khi quay)
    const dai2 = [0, 0];
    let tenCat = '';
    let w0 = 0;

    const nhom4 = new THREE.Group();                     // mọi thứ thuộc máy xem bốn chiều
    scene.add(nhom4);

    // Phép chiếu (đơn vị dữ liệu → tọa độ trong nhom4). k: tỉ lệ riêng của vật.
    function chieu(x, y, z, w, k, out) {
      const f = S.chieu === 'phoi' ? D / Math.max(0.35, D - w * k) : 1;
      const m = S3 * k * f;
      out[0] = x * m; out[1] = y * m; out[2] = z * m;
      return out;
    }
    const heSoPhoi = (w, k) => (S.chieu === 'phoi' ? D / Math.max(0.35, D - w * k) : 1);

    // ----- Siêu lập phương: cạnh phát sáng, mặt kính, đỉnh là hạt sáng -----
    const nhomLP = new THREE.Group();
    nhom4.add(nhomLP);
    const canhLP = new BoDoan(80, { rong: 2.5, quang: 0.1, cong: true, sang: 1.2 });
    nhomLP.add(canhLP.line);
    const domLP = DINH_LP.map(() => { const d = taoDom(0xffffff, 0.3); nhomLP.add(d); return d; });
    const loiLP = DINH_LP.map(() => { const d = taoDom(0xffffff, 0.09); nhomLP.add(d); return d; });   // lõi trắng nóng của mỗi đỉnh
    // 24 mặt vuông, mỗi mặt 2 tam giác, có toạ độ uv để vẽ mép sáng
    const viTriMat = new Float32Array(24 * 6 * 3), mauMat = new Float32Array(24 * 6 * 3), uvMat = new Float32Array(24 * 6 * 2);
    {
      const UV = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
      for (let f = 0; f < 24; f++) for (let q = 0; q < 6; q++) { uvMat[(f * 6 + q) * 2] = UV[q][0]; uvMat[(f * 6 + q) * 2 + 1] = UV[q][1]; }
    }
    const geoMat = new THREE.BufferGeometry();
    geoMat.setAttribute('position', new THREE.BufferAttribute(viTriMat, 3).setUsage(THREE.DynamicDrawUsage));
    geoMat.setAttribute('color', new THREE.BufferAttribute(mauMat, 3).setUsage(THREE.DynamicDrawUsage));
    geoMat.setAttribute('uv', new THREE.BufferAttribute(uvMat, 2));
    const matKinhLP = vatLieuKinh({ doMo: 0.035, vien: 0.3, phanChieu: 0.25, mep: 0.35, cong: true, mauDinh: true });
    const luoiMat = new THREE.Mesh(geoMat, matKinhLP);
    luoiMat.frustumCulled = false;
    luoiMat.renderOrder = 1;
    nhomLP.add(luoiMat);
    const nhanLP = taoNhan('', 'dam giua');
    nhomLP.add(nhanLP);
    // Đường đi của đỉnh sáng khi kéo (x, rồi y, rồi z, rồi w): hiện mờ khi có tay nắm «kéo».
    const duongKeo = new BoDoan(4 * 24, { rong: 1.3, doMo: 0.55, cong: true, sang: 0.8 });
    nhomLP.add(duongKeo.line);
    const nhanHuongKeo = taoNhan('', 'tran');
    nhomLP.add(nhanHuongKeo);

    // ----- Siêu cầu -----
    const nhomCau = new THREE.Group();
    nhom4.add(nhomCau);
    const SO_DOAN_CAU = VI_TUYEN.length * 3 * N_VONG;
    const canhCau = new BoDoan(SO_DOAN_CAU + 200, { rong: 1.5, quang: 0.1, cong: true, sang: 1.25 });
    nhomCau.add(canhCau.line);
    const diemCau = new Float64Array((SO_DOAN_CAU + VI_TUYEN.length * 3) * 4); // điểm 4 chiều gốc của các vòng
    {
      let j = 0;
      for (const th of VI_TUYEN) {
        const w = Math.sin(th), r = Math.cos(th);
        for (let mp = 0; mp < 3; mp++) {
          for (let i = 0; i <= N_VONG; i++) {
            const a = (i / N_VONG) * 2 * Math.PI, u = r * Math.cos(a), v = r * Math.sin(a);
            const p = mp === 0 ? [u, v, 0] : mp === 1 ? [0, u, v] : [u, 0, v];
            diemCau[j++] = p[0]; diemCau[j++] = p[1]; diemCau[j++] = p[2]; diemCau[j++] = w;
          }
        }
      }
    }
    const nhanCau = taoNhan(chuCanh("canh.sieu-cau-mat-cau-ba-chieu-trong-bon", "Siêu cầu<small>mặt cầu ba chiều trong bốn chiều</small>"), 'dam giua');
    nhomCau.add(nhanCau);

    // ----- Phim Trái Đất – Mặt Trăng -----
    const nhomPhim = new THREE.Group();
    nhom4.add(nhomPhim);
    const canhPhim = new BoDoan(N_PHIM + 60, { rong: 2.6, quang: 0.12, cong: true, sang: 1.1 });
    const khungPhim = new BoDoan(SO_ANH * 4 + 8, { rong: 1.2, doMo: 0.7, cong: true });
    nhomPhim.add(canhPhim.line, khungPhim.line);
    const omega = (2 * Math.PI * PHIM_VONG) / (2 * PHIM_W);
    const traiDat = (t, out) => { out[0] = 0; out[1] = 0; out[2] = 0; out[3] = t; return out; };
    const matTrang = (t, out) => { out[0] = 0; out[1] = PHIM_R * Math.cos(omega * t); out[2] = PHIM_R * Math.sin(omega * t); out[3] = t; return out; };
    const tAnh = Array.from({ length: SO_ANH }, (_, k) => -PHIM_W + (2 * PHIM_W * (k + 0.5)) / SO_ANH);
    // Mỗi ảnh chụp: một Trái Đất, một Mặt Trăng thật nhỏ (thư viện thiên thể), và một khung kính mờ.
    const HUONG_SANG = new THREE.Vector3(1, 0.5, 0.7).normalize();
    const taoThienThe = (ham, banKinh) => {
      try { const v = ham({ banKinh, chiTiet: 48 }); v.datHuongSang(HUONG_SANG); return v; } catch (e) {
        console.warn('Không tạo được thiên thể:', e);
        const nhom = new THREE.Mesh(new THREE.SphereGeometry(banKinh, 24, 16), new THREE.MeshStandardMaterial({ color: 0x8899bb, roughness: 0.8 }));
        return { nhom, capNhat() {}, datHuongSang() {} };
      }
    };
    const anh = tAnh.map((t, k) => {
      const dat = taoThienThe(taoTraiDat, 0.14), trang = taoThienThe(taoMatTrang, 0.06);
      const quangDat = taoDom(new THREE.Color(0x4f8dff).multiplyScalar(1.2), 0.42);
      const nhan = taoNhan(`${k + 1}`, 'mo tran');
      nhomPhim.add(dat.nhom, trang.nhom, quangDat, nhan);
      return { t, dat, trang, quangDat, nhan };
    });
    const viTriKhung = new Float32Array(SO_ANH * 6 * 3), uvKhung = new Float32Array(SO_ANH * 6 * 2);
    {
      const UV = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
      for (let f = 0; f < SO_ANH; f++) for (let q = 0; q < 6; q++) { uvKhung[(f * 6 + q) * 2] = UV[q][0]; uvKhung[(f * 6 + q) * 2 + 1] = UV[q][1]; }
    }
    const geoKhung = new THREE.BufferGeometry();
    geoKhung.setAttribute('position', new THREE.BufferAttribute(viTriKhung, 3).setUsage(THREE.DynamicDrawUsage));
    geoKhung.setAttribute('uv', new THREE.BufferAttribute(uvKhung, 2));
    const kinhKhung = new THREE.Mesh(geoKhung, vatLieuKinh({ mau: 0x9fb8ff, doMo: 0.022, vien: 0.2, phanChieu: 0.15, mep: 0.3, cong: true }));
    kinhKhung.frustumCulled = false;
    nhomPhim.add(kinhKhung);
    const nhanDat = taoNhan(chuCanh("canh.trai-dat", "Trái Đất"), 'xanh');
    const nhanTrang = taoNhan(chuCanh("canh.mat-trang", "Mặt Trăng"), 'dam');
    const nhanTruc = taoNhan('', 'vang tran');
    nhomPhim.add(nhanDat, nhanTrang, nhanTruc);

    // ----- Lát cắt: khối kính xanh lục -----
    const nhomCat = new THREE.Group();
    nhom4.add(nhomCat);
    const viTriCat = new Float32Array(8 * 10 * 3 * 3), phapCat = new Float32Array(8 * 10 * 3 * 3);
    const geoCat = new THREE.BufferGeometry();
    geoCat.setAttribute('position', new THREE.BufferAttribute(viTriCat, 3).setUsage(THREE.DynamicDrawUsage));
    geoCat.setAttribute('normal', new THREE.BufferAttribute(phapCat, 3).setUsage(THREE.DynamicDrawUsage));
    const khoiCatSau = new THREE.Mesh(geoCat, vatLieuKinh({ mau: MAU_KTG.hienTai, doMo: 0.1, vien: 0.25, phanChieu: 0.1, side: THREE.BackSide }));
    const khoiCat = new THREE.Mesh(geoCat, vatLieuKinh({ mau: MAU_KTG.hienTai, doMo: 0.12, vien: 0.75, phanChieu: 0.7, side: THREE.FrontSide }));
    khoiCatSau.frustumCulled = khoiCat.frustumCulled = false;
    khoiCatSau.renderOrder = 4; khoiCat.renderOrder = 5;
    const vienCat = new BoDoan(64, { rong: 2.4, quang: 0.14, cong: true, sang: 1.7 });
    vienCat.line.renderOrder = 6;
    const domCat = Array.from({ length: 16 }, () => taoDom(new THREE.Color(0xd8ffe4).multiplyScalar(2), 0.18));
    const geoCau = new THREE.SphereGeometry(1, 72, 36);
    const cauCatSau = new THREE.Mesh(geoCau, vatLieuKinh({ mau: MAU_KTG.hienTai, doMo: 0.12, vien: 0.25, phanChieu: 0.1, phang: false, luoi: [24, 12], side: THREE.BackSide }));
    const cauCat = new THREE.Mesh(geoCau, vatLieuKinh({ mau: MAU_KTG.hienTai, doMo: 0.16, vien: 1.0, phanChieu: 0.9, phang: false, luoi: [24, 12], side: THREE.FrontSide }));
    cauCatSau.renderOrder = 4; cauCat.renderOrder = 5;
    const nhomCauCat = new THREE.Group();
    nhomCauCat.add(cauCatSau, cauCat);
    // «Thế giới lúc này» của phim: Trái Đất và Mặt Trăng to hơn
    const datCat = taoThienThe(taoTraiDat, 0.17);
    const quangCat = taoDom(new THREE.Color(MAU_KTG.hienTai).multiplyScalar(1.6), 0.9);   // quầng xanh lục đánh dấu «lúc này»
    datCat.nhom.add(quangCat);
    const trangCat = Array.from({ length: 3 }, () => taoThienThe(taoMatTrang, 0.075));
    const nhanCat = taoNhan('', 'dam');
    nhanCat.element.style.color = '#8fe3a8';
    nhomCat.add(khoiCatSau, khoiCat, vienCat.line, ...domCat, nhomCauCat, datCat.nhom, ...trangCat.map((m) => m.nhom), nhanCat);

    // ----- La bàn bốn trục -----
    const nhomLaBan = new THREE.Group();
    nhom4.add(nhomLaBan);
    const laBan = new BoDoan(4, { rong: 2.6, quang: 0.16, cong: true, sang: 1.6 });
    nhomLaBan.add(laBan.line);
    const muiLB = MAU_HUONG.map((m) => { const d = taoDom(m.clone().multiplyScalar(2.2), 0.12); nhomLaBan.add(d); return d; });
    const nhanTrucLB = ['x', 'y', 'z', 'w'].map((t, k) => {
      const n = taoNhan(t, 'tran dam giua');
      n.element.style.color = `#${MAU_HUONG[k].getHexString(THREE.SRGBColorSpace)}`;
      nhomLaBan.add(n);
      return n;
    });
    const nhanLB = taoNhan(chuCanh("canh.bon-truc-sau-khi-quay", "bốn trục sau khi quay"), 'mo tran giua');
    nhomLaBan.add(nhanLB);
    const doaLB = taoDom(new THREE.Color(0xffffff).multiplyScalar(1.6), 0.1);
    nhomLaBan.add(doaLB);

    // ----- Flatland: quả cầu đi qua thế giới phẳng -----
    const nhomPhang = new THREE.Group();
    scene.add(nhomPhang);
    const R_PHANG = 1.25, NUA_PHANG = 1.9;
    {
      nhomPhang.add(matHienTai({ nua: NUA_PHANG, doMo: 0.06 }));
      nhomPhang.add(luoi({ goc: [-NUA_PHANG, 0, -NUA_PHANG], u: [0.38, 0, 0], v: [0, 0, 0.38], soU: 10, soV: 10, mau: MAU_KTG.hienTai, doMo: 0.32, chinh: 5 }));
      const n = taoNhan(chuCanh("canh.the-gioi-phang-sinh-vat-hai-chieu-chi", "Thế giới phẳng<small>sinh vật hai chiều chỉ thấy chỗ cắt</small>"), 'dam');
      n.element.style.color = '#8fe3a8';
      n.position.set(-NUA_PHANG, 0, NUA_PHANG);
      nhomPhang.add(n);
    }
    const cauPhang = new THREE.Group();
    {
      const sau = new THREE.Mesh(geoCau, vatLieuKinh({ mau: 0x9fb8ff, doMo: 0.06, vien: 0.2, phanChieu: 0.05, phang: false, luoi: [16, 8], side: THREE.BackSide }));
      const truoc = new THREE.Mesh(geoCau, vatLieuKinh({ mau: 0x9fb8ff, doMo: 0.08, vien: 0.75, phanChieu: 0.8, phang: false, luoi: [16, 8], side: THREE.FrontSide }));
      sau.scale.setScalar(R_PHANG); truoc.scale.setScalar(R_PHANG);
      sau.renderOrder = 1; truoc.renderOrder = 3;
      cauPhang.add(sau, truoc);
      const n = taoNhan(chuCanh("canh.qua-cau-ba-chieu", "quả cầu ba chiều"), 'mo');
      n.center.set(1, 0.5);
      n.position.set(-R_PHANG * 0.75, R_PHANG * 0.8, 0);
      cauPhang.add(n);
    }
    nhomPhang.add(cauPhang);
    const vongPhang = new DuongDay(97, { mau: MAU_KTG.hienTai, rong: 3.2, quang: 0.22, sang: 2.4 });
    vongPhang.line.renderOrder = 6;
    nhomPhang.add(vongPhang.line);
    const nhanVongPhang = taoNhan('', 'tran');
    nhanVongPhang.element.style.color = '#8fe3a8';
    nhomPhang.add(nhanVongPhang);

    // ----- So sánh: vòng tròn (4 chiều không gian) và hyperbol (không-thời gian) -----
    const nhomSS = new THREE.Group();
    scene.add(nhomSS);
    const SS_X = 3.1, SS_N = 2.3, R_TRON = 1.7, A_HYP = 1.0;
    const dongSS = {};
    {
      for (const [dx, tTruc, tieuDe, phu] of [
        [-SS_X, 'w', chuCanh("canh.bon-chieu-khong-gian", "Bốn chiều không gian"), chuCanh("canh.quay-trong-mat-phang-x-w", "quay trong mặt phẳng (x; w)")],
        [SS_X, 'ct', chuCanh("canh.khong-thoi-gian", "Không-thời gian"), chuCanh("canh.quay-trong-mat-phang-x-ct", "«quay» trong mặt phẳng (x; ct)")],
      ]) {
        const tam = matHienTai({ nua: SS_N + 0.15, mau: 0x6f8cff, doMo: 0.025, vien: 0.22 });
        tam.rotation.x = Math.PI / 2;
        tam.position.set(dx, 0, -0.02);
        nhomSS.add(tam);
        nhomSS.add(luoi({ goc: [dx - SS_N, -SS_N, 0], u: [0.4, 0, 0], v: [0, 0.4, 0], soU: 12, soV: 12, doMo: 0.16, chinh: 3 }));
        nhomSS.add(duongDayTinh([dx - SS_N - 0.1, 0, 0, dx + SS_N + 0.2, 0, 0], { mau: 0xffffff, rong: 1.3, doMo: 0.6, cong: false }).line);
        nhomSS.add(duongDayTinh([dx, -SS_N - 0.1, 0, dx, SS_N + 0.2, 0], { mau: MAU_KTG.thoiGian, rong: 1.3, doMo: 0.75, cong: false }).line);
        const nx = taoNhan('x', 'mo tran'); nx.position.set(dx + SS_N + 0.2, 0, 0);
        const nt = taoNhan(tTruc, 'xanh tran'); nt.position.set(dx, SS_N + 0.2, 0);
        const td = taoNhan(`${tieuDe}<small>${phu}</small>`, 'dam giua'); td.position.set(dx, SS_N + 0.75, 0);
        nhomSS.add(nx, nt, td);
      }
      // đĩa mờ trong vòng tròn và vùng «tương lai» (trong nón) mờ trong sơ đồ hyperbol
      {
        const dia = new THREE.Mesh(new THREE.CircleGeometry(R_TRON, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9fb8ff).multiplyScalar(0.09), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
        dia.position.set(-SS_X, 0, 0.005);
        const tl = new THREE.BufferGeometry();
        tl.setAttribute('position', new THREE.Float32BufferAttribute([SS_X, 0, 0.005, SS_X + SS_N, SS_N, 0.005, SS_X - SS_N, SS_N, 0.005, SS_X, 0, 0.005, SS_X - SS_N, -SS_N, 0.005, SS_X + SS_N, -SS_N, 0.005], 3));
        const vung = new THREE.Mesh(tl, new THREE.MeshBasicMaterial({ color: new THREE.Color(MAU_KTG.hong).multiplyScalar(0.06), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        nhomSS.add(dia, vung);
      }
      const q = [];
      for (let i = 0; i <= 128; i++) { const a = (i / 128) * 2 * Math.PI; q.push(-SS_X + R_TRON * Math.cos(a), R_TRON * Math.sin(a), 0.01); }
      nhomSS.add(duongDayTinh(q, { mau: 0xffffff, rong: 2.4, doMo: 0.9, quang: 0.14, sang: 1.4 }).line);
      const nTron = taoNhan(chuCanh("canh.x-w-hang-so", "x² + w² = hằng số"), 'tran giua'); nTron.position.set(-SS_X, -R_TRON - 0.35, 0);
      nhomSS.add(nTron);
      const nhanh = (ham, mau, doMo, sang) => {
        const h = [];
        for (let i = 0; i <= 96; i++) { const e = -1.55 + (3.1 * i) / 96; const [x, t] = ham(e); h.push(SS_X + x, t, 0.01); }
        nhomSS.add(duongDayTinh(h, { mau, rong: 2.4, doMo, quang: 0.12, sang }).line);
      };
      nhanh((e) => [A_HYP * Math.sinh(e), A_HYP * Math.cosh(e)], MAU_KTG.hong, 0.95, 1.5);
      nhanh((e) => [A_HYP * Math.sinh(e), -A_HYP * Math.cosh(e)], MAU_KTG.hong, 0.3, 1);
      nhanh((e) => [A_HYP * Math.cosh(e), A_HYP * Math.sinh(e)], 0xffffff, 0.85, 1.3);
      nhanh((e) => [-A_HYP * Math.cosh(e), A_HYP * Math.sinh(e)], 0xffffff, 0.3, 1);
      for (const s of [1, -1]) nhomSS.add(duongDayTinh([SS_X - SS_N, -SS_N * s, 0.01, SS_X + SS_N, SS_N * s, 0.01], { mau: MAU_KTG.anhSang, rong: 1.6, doMo: 0.85, net: [0.12, 0.09], sang: 1.3 }).line);
      const nAS = taoNhan(chuCanh("canh.anh-sang", "ánh sáng"), 'vang tran'); nAS.position.set(SS_X + SS_N - 0.2, SS_N - 0.2, 0);
      const nHyp = taoNhan(chuCanh("canh.t-x-hang-so", "−t² + x² = hằng số"), 'tran giua'); nHyp.position.set(SS_X, -SS_N - 0.35, 0);
      const nTren = taoNhan(chuCanh("canh.nhanh-tren-luon-o-tuong-lai", "nhánh trên<small>luôn ở tương lai</small>"), 'hong tran giua'); nTren.position.set(SS_X, 0.55, 0);
      nhomSS.add(nAS, nHyp, nTren);
      const mauSang = (m, k) => new THREE.Color(m).multiplyScalar(k);
      dongSS.tron = { dom: taoDom(mauSang(0xffffff, 2.4), 0.42), tia: new DuongDay(2, { mau: 0xffffff, rong: 2, doMo: 0.8 }), vet: new DuongDay(40, { mau: 0xffffff, rong: 3.2, moDan: true, sang: 1.6 }) };
      dongSS.tren = { dom: taoDom(mauSang(MAU_KTG.hong, 2.4), 0.42), tia: new DuongDay(2, { mau: MAU_KTG.hong, rong: 2, doMo: 0.8 }), vet: new DuongDay(40, { mau: MAU_KTG.hong, rong: 3.2, moDan: true, sang: 1.6 }) };
      dongSS.phai = { dom: taoDom(mauSang(0xffffff, 2), 0.38), tia: new DuongDay(2, { mau: 0xffffff, rong: 2, doMo: 0.6 }), vet: new DuongDay(40, { mau: 0xffffff, rong: 3, moDan: true, sang: 1.4 }) };
      for (const d of Object.values(dongSS)) nhomSS.add(d.dom, d.tia.line, d.vet.line);
      dongSS.nhanTron = taoNhan('', 'tran');
      dongSS.nhanTren = taoNhan('', 'hong tran');
      nhomSS.add(dongSS.nhanTron, dongSS.nhanTren);
    }
    let pha = 0;
    const tronTai = (p) => [R_TRON * Math.cos(p), R_TRON * Math.sin(p)];
    const trenTai = (e) => [A_HYP * Math.sinh(e), A_HYP * Math.cosh(e)];
    const phaiTai = (e) => [A_HYP * Math.cosh(e), A_HYP * Math.sinh(e)];
    function veSoSanh(dt) {
      pha += dt * 0.6;
      if (!S.ssTay) { S.phaTron = pha; S.etaHyp = 1.25 * Math.sin(pha * 0.8); }
      const veDiem = (d, ham, cx, x0, buocVet) => {
        const [x, y] = ham(x0);
        d.dom.position.set(cx + x, y, 0.02);
        d.tia.dat(0, cx, 0, 0.02); d.tia.dat(1, cx + x, y, 0.02); d.tia.xong(2);
        for (let i = 0; i < 40; i++) { const [a, b] = ham(x0 - i * buocVet); d.vet.dat(i, cx + a, b, 0.02); }
        d.vet.xong(S.ssTay ? 1 : 40);
      };
      veDiem(dongSS.tron, tronTai, -SS_X, S.phaTron, 0.04);
      const buocEta = 0.03 * 0.8 * 1.25 * Math.cos(pha * 0.8);
      veDiem(dongSS.tren, trenTai, SS_X, S.etaHyp, buocEta);
      veDiem(dongSS.phai, phaiTai, SS_X, S.etaHyp, buocEta);
      const wTron = R_TRON * Math.sin(S.phaTron);
      dongSS.nhanTron.position.copy(dongSS.tron.dom.position);
      dongSS.nhanTron.datChu(wTron >= 0 ? `w = ${so(wTron, 2)}` : chuCanh("canh.w-da-chuc-xuong", "w = {0} (đã chúc xuống)", [so(wTron, 2)]));
      const [xh, th] = trenTai(S.etaHyp);
      dongSS.nhanTren.position.copy(dongSS.tren.dom.position);
      dongSS.nhanTren.datChu(`x = ${so(xh, 2)} · t = ${so(th, 2)}`);
    }

    // =====================================================================
    // Cập nhật hình
    // =====================================================================
    function toMau(goc, wTb, out) {
      if (!S.cat) return out.copy(goc);
      return out.copy(goc).lerp(wTb < w0 ? XANH_QUA : CAM_TOI, 0.62);
    }
    const _a = [0, 0, 0], _b = [0, 0, 0], _m = [0, 0, 0];
    function themDoan(bo, A, B, k, mauGoc, mauGocB = mauGoc) {
      chieu(A[0], A[1], A[2], A[3], k, _a);
      chieu(B[0], B[1], B[2], B[3], k, _b);
      const da = A[3] - w0, db = B[3] - w0;
      if (S.cat && da * db < 0) {
        const t = da / (da - db);
        chieu(A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1]), A[2] + t * (B[2] - A[2]), w0, k, _m);
        toMau(mauGoc, A[3], cA); toMau(mauGocB, B[3], cB);
        bo.them(_a[0], _a[1], _a[2], _m[0], _m[1], _m[2], cA, cA);
        bo.them(_m[0], _m[1], _m[2], _b[0], _b[1], _b[2], cB, cB);
      } else {
        toMau(mauGoc, (A[3] + B[3]) / 2, cA); toMau(mauGocB, (A[3] + B[3]) / 2, cB);
        bo.them(_a[0], _a[1], _a[2], _b[0], _b[1], _b[2], cA, cB);
      }
    }

    const A4 = [0, 0, 0, 0], B4 = [0, 0, 0, 0], mauTmp = new THREE.Color(), mauTmp2 = new THREE.Color(), mauMatTmp = new THREE.Color();
    const keoE = (keo, out) => { for (let i = 0; i < 4; i++) out[i] = kep(keo - i, 0, 1); return out; };
    const eTmp = [0, 0, 0, 0];
    function veLapPhuong() {
      const k = K_VAT.lp;
      const e = keoE(S.keo, eTmp);
      const xep = [e[0] < 1e-3, e[1] < 1e-3, e[2] < 1e-3, e[3] < 1e-3];   // chiều chưa kéo: chỉ vẽ một bản
      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 4; j++) v4[j] = DINH_LP[i][j] * e[j];
        nhanVec(M, v4, o4);
        for (let j = 0; j < 4; j++) W[4 * i + j] = o4[j];
      }
      tamVuon = 0;
      for (let i = 0; i < 16; i++) tamVuon = Math.max(tamVuon, Math.abs(W[4 * i + 3]));
      tamVuon = Math.max(tamVuon, 0.05);
      const chuanW = Math.max(1, tamVuon);
      const chuan = (i) => { for (let j = 0; j < 4; j++) if (xep[j] && ((i >> j) & 1)) return false; return true; };
      canhLP.batDau();
      for (const [a, b, h] of CANH_LP) {
        if (xep[h] || !chuan(a)) continue;
        for (let j = 0; j < 4; j++) { A4[j] = W[4 * a + j]; B4[j] = W[4 * b + j]; }
        if (S.mau === 'w') themDoan(canhLP, A4, B4, k, mauTheoW(A4[3] / chuanW, mauTmp), mauTheoW(B4[3] / chuanW, mauTmp2));
        else themDoan(canhLP, A4, B4, k, MAU_HUONG[h]);
      }
      canhLP.xong();
      for (let i = 0; i < 16; i++) {
        const d = domLP[i], l = loiLP[i];
        d.visible = l.visible = chuan(i);
        if (!d.visible) continue;
        const wi = W[4 * i + 3];
        chieu(W[4 * i], W[4 * i + 1], W[4 * i + 2], wi, k, p3);
        d.position.set(p3[0], p3[1], p3[2]);
        l.position.copy(d.position);
        const f = heSoPhoi(wi, k);
        d.scale.setScalar(0.24 * f);
        l.scale.setScalar(0.085 * f);
        if (S.cat) d.material.color.copy(wi < w0 ? XANH_QUA : CAM_TOI);
        else mauTheoW(wi / chuanW, d.material.color);
        d.material.color.multiplyScalar(S.cat ? 0.9 : 1.8);
        l.material.color.setScalar(2.6);
      }
      // mặt kính
      let n = 0;
      for (const m of MAT_LP) {
        if (xep[m.a] || xep[m.b] || !chuan(m.dinh[0])) continue;
        if (S.mau !== 'w') mauMatTmp.copy(MAU_HUONG[m.a]).lerp(MAU_HUONG[m.b], 0.5);
        for (const t of THU_TAM_GIAC) {
          const i = m.dinh[t];
          const wi = W[4 * i + 3];
          chieu(W[4 * i], W[4 * i + 1], W[4 * i + 2], wi, k, p3);
          viTriMat[3 * n] = p3[0]; viTriMat[3 * n + 1] = p3[1]; viTriMat[3 * n + 2] = p3[2];
          if (S.mau === 'w') mauTheoW(wi / chuanW, mauTmp); else mauTmp.copy(mauMatTmp);
          if (S.cat) mauTmp.lerp(wi < w0 ? XANH_QUA : CAM_TOI, 0.55);
          mauMat[3 * n] = mauTmp.r; mauMat[3 * n + 1] = mauTmp.g; mauMat[3 * n + 2] = mauTmp.b;
          n++;
        }
      }
      geoMat.setDrawRange(0, n);
      geoMat.attributes.position.needsUpdate = true;
      geoMat.attributes.color.needsUpdate = true;
      matKinhLP.uniforms.uDoMo.value = S.cat ? 0.012 : 0.035;
      matKinhLP.uniforms.uMep.value = S.cat ? 0.12 : 0.35;
      matKinhLP.uniforms.uVien.value = S.cat ? 0.12 : 0.3;
      canhLP.mat.opacity = S.cat ? 0.42 : 1;
      canhLP.matQuang.opacity = S.cat ? 0.04 : 0.1;
      // nhãn đếm
      const gd = Math.round(kep(S.keo, 0, 4));
      const dem = [];
      for (let q = 0; q <= Math.min(gd, 3); q++) dem.push(`${demPhanTu(gd, q)} ${TEN_PHAN_TU[q]}`);
      nhanLP.datChu(`${TEN_GIAI_DOAN[gd]}<small>${dem.join(' · ')}</small>`);
      let yMax = 0;
      for (let i = 0; i < 16; i++) { chieu(W[4 * i], W[4 * i + 1], W[4 * i + 2], W[4 * i + 3], k, p3); yMax = Math.max(yMax, p3[1]); }
      nhanLP.position.set(0, yMax + 0.5, 0);
    }

    // Vị trí (trong nhom4) của đỉnh sáng (+1, +1, +1, +1) khi đã kéo «keo» lần: đường đi của tay nắm «kéo».
    function dinhKeo(keo, out) {
      keoE(keo, v4);
      nhanVec(M, v4, o4);
      return chieu(o4[0], o4[1], o4[2], o4[3], K_VAT.lp, out);
    }
    function veDuongKeo() {
      duongKeo.batDau();
      for (let h = 0; h < 4; h++) {
        for (let i = 0; i < 24; i++) {
          dinhKeo(h + i / 24, p3); dinhKeo(h + (i + 1) / 24, q3);
          if (i % 2 === 0) duongKeo.them(p3[0], p3[1], p3[2], q3[0], q3[1], q3[2], MAU_HUONG[h]);
        }
      }
      duongKeo.xong();
      const h = Math.min(3, Math.floor(kep(S.keo, 0, 3.999)));
      dinhKeo(Math.min(4, h + 0.5), p3);
      nhanHuongKeo.position.set(p3[0], p3[1], p3[2]);
      nhanHuongKeo.element.style.color = `#${MAU_HUONG[h].getHexString(THREE.SRGBColorSpace)}`;
      nhanHuongKeo.datChu(chuCanh("canh.keo-theo", "kéo theo {0}", ['xyzw'[h]]));
    }

    function veCau() {
      const k = K_VAT.cau;
      tamVuon = 1;
      canhCau.batDau();
      const soVong = VI_TUYEN.length * 3;
      for (let v = 0; v < soVong; v++) {
        for (let i = 0; i < N_VONG; i++) {
          const j = (v * (N_VONG + 1) + i) * 4;
          for (let q = 0; q < 4; q++) { v4[q] = diemCau[j + q]; o4[q] = diemCau[j + 4 + q]; }
          nhanVec(M, v4, A4); nhanVec(M, o4, B4);
          mauTheoW(A4[3], mauTmp); mauTheoW(B4[3], mauTmp2);
          if (S.cat) { mauTmp.multiplyScalar(0.75); mauTmp2.multiplyScalar(0.75); }
          themDoan(canhCau, A4, B4, k, mauTmp, mauTmp2);
        }
      }
      canhCau.xong();
      canhCau.mat.opacity = S.cat ? 0.55 : 0.85;
      nhanCau.position.set(0, 2.45, 0);
    }

    function vePhim(dt) {
      const k = K_VAT.phim;
      canhPhim.batDau();
      mauTmp.set(0x5b9bff); mauTmp2.set(0xd8d8e4);
      tamVuon = 0.05;
      for (let i = 0; i < N_PHIM; i++) {
        const t0 = -PHIM_W + (2 * PHIM_W * i) / N_PHIM, t1 = -PHIM_W + (2 * PHIM_W * (i + 1)) / N_PHIM;
        nhanVec(M, matTrang(t0, v4), A4); nhanVec(M, matTrang(t1, o4), B4);
        tamVuon = Math.max(tamVuon, Math.abs(A4[3]), Math.abs(B4[3]));
        themDoan(canhPhim, A4, B4, k, mauTmp2);
      }
      for (let i = 0; i < 40; i++) {
        const t0 = -PHIM_W + (2 * PHIM_W * i) / 40, t1 = -PHIM_W + (2 * PHIM_W * (i + 1)) / 40;
        nhanVec(M, traiDat(t0, v4), A4); nhanVec(M, traiDat(t1, o4), B4);
        themDoan(canhPhim, A4, B4, k, mauTmp);
      }
      canhPhim.xong();
      // khung của từng ảnh chụp: hình vuông trong mặt phẳng (y; z) đặt ở mức w = t
      khungPhim.batDau();
      const L = 0.98;
      const goc = [[-L, -L], [L, -L], [L, L], [-L, L]];
      let nk = 0;
      for (const a of anh) {
        const sang = S.cat ? (Math.abs(a.t * M[15] - w0) < 0.2 ? 1 : 0.45) : 0.8;
        mauTmp.set(0x9fb8ff).multiplyScalar(sang);
        for (let q = 0; q < 4; q++) {
          const [y0, z0] = goc[q], [y1, z1] = goc[(q + 1) % 4];
          v4[0] = 0; v4[1] = y0; v4[2] = z0; v4[3] = a.t; o4[0] = 0; o4[1] = y1; o4[2] = z1; o4[3] = a.t;
          nhanVec(M, v4, A4); nhanVec(M, o4, B4);
          chieu(A4[0], A4[1], A4[2], A4[3], k, p3); chieu(B4[0], B4[1], B4[2], B4[3], k, q3);
          khungPhim.them(p3[0], p3[1], p3[2], q3[0], q3[1], q3[2], mauTmp);
        }
        for (const q of THU_TAM_GIAC) {
          const [y0, z0] = goc[q];
          v4[0] = 0; v4[1] = y0; v4[2] = z0; v4[3] = a.t;
          nhanVec(M, v4, A4);
          chieu(A4[0], A4[1], A4[2], A4[3], k, p3);
          viTriKhung[3 * nk] = p3[0]; viTriKhung[3 * nk + 1] = p3[1]; viTriKhung[3 * nk + 2] = p3[2];
          nk++;
        }
      }
      khungPhim.xong();
      geoKhung.setDrawRange(0, nk);
      geoKhung.attributes.position.needsUpdate = true;
      for (const a of anh) {
        nhanVec(M, traiDat(a.t, v4), A4);
        chieu(A4[0], A4[1], A4[2], A4[3], k, p3);
        a.dat.nhom.position.set(p3[0], p3[1], p3[2]);
        a.quangDat.position.copy(a.dat.nhom.position);
        nhanVec(M, matTrang(a.t, v4), B4);
        chieu(B4[0], B4[1], B4[2], B4[3], k, q3);
        a.trang.nhom.position.set(q3[0], q3[1], q3[2]);
        a.nhan.position.set(q3[0], q3[1] + 0.2, q3[2]);
        const gan = S.cat ? Math.abs(A4[3] - w0) < 0.25 : true;
        const co = gan ? 1 : 0.6;
        a.dat.nhom.scale.setScalar(co); a.trang.nhom.scale.setScalar(co);
        a.quangDat.material.opacity = gan ? 0.55 : 0.2;
        if (dt) { a.dat.capNhat(dt); a.trang.capNhat(dt); }
      }
      nhanVec(M, traiDat(PHIM_W, v4), A4); chieu(A4[0], A4[1], A4[2], A4[3], k, p3);
      nhanDat.position.set(p3[0], p3[1] - 0.5, p3[2]);
      nhanVec(M, matTrang(PHIM_W, v4), B4); chieu(B4[0], B4[1], B4[2], B4[3], k, q3);
      nhanTrang.position.set(q3[0], q3[1], q3[2]);
      const lo = Math.hypot(M[3], M[7], M[11]);        // độ lộ của trục w trong không gian ta thấy
      nhanTruc.visible = lo > 0.3;
      nhanVec(M, traiDat(PHIM_W * 1.08, v4), A4); chieu(A4[0], A4[1], A4[2], A4[3], k, p3);
      nhanTruc.position.set(p3[0], p3[1] + 0.35, p3[2]);
      nhanTruc.datChu(chuCanh("canh.w-ct-thoi-gian", "w = ct (thời gian) →"));
    }

    // Lát cắt cho vật đang chọn.
    const ux = [0, 0, 0], vx = [0, 0, 0];
    function veCat(dt) {
      nhomCat.visible = S.cat && S.vat !== 'soSanh';
      if (!nhomCat.visible) { tenCat = ''; return; }
      khoiCat.visible = khoiCatSau.visible = vienCat.line.visible = S.vat === 'lp';
      nhomCauCat.visible = S.vat === 'cau';
      datCat.nhom.visible = S.vat === 'phim';
      for (const d of domCat) d.visible = false;
      for (const m of trangCat) m.nhom.visible = false;
      if (S.vat === 'lp') {
        const k = K_VAT.lp;
        catLapPhuong4(W, w0, boCat);
        let n = 0;
        vienCat.batDau();
        mauTmp.set(0xc9ffd9);
        for (let a = 0; a < boCat.soDa; a++) {
          const da = boCat.da[a];
          const P = (q, out) => chieu(da.p[3 * q], da.p[3 * q + 1], da.p[3 * q + 2], w0, k, out);
          P(0, p3);
          P(1, ux); P(2, vx);
          let nx = (ux[1] - p3[1]) * (vx[2] - p3[2]) - (ux[2] - p3[2]) * (vx[1] - p3[1]);
          let ny = (ux[2] - p3[2]) * (vx[0] - p3[0]) - (ux[0] - p3[0]) * (vx[2] - p3[2]);
          let nz = (ux[0] - p3[0]) * (vx[1] - p3[1]) - (ux[1] - p3[1]) * (vx[0] - p3[0]);
          const ln = Math.hypot(nx, ny, nz) || 1;
          nx /= ln; ny /= ln; nz /= ln;
          chieu(boCat.tam[0], boCat.tam[1], boCat.tam[2], w0, k, q3);
          if ((p3[0] - q3[0]) * nx + (p3[1] - q3[1]) * ny + (p3[2] - q3[2]) * nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
          // tam giác hoá kiểu quạt, xếp đỉnh sao cho mặt trước quay ra ngoài (để tách mặt trước, mặt sau của kính)
          for (let q = 1; q < da.n - 1; q++) {
            P(q, ux); P(q + 1, vx);
            const cx = (ux[1] - p3[1]) * (vx[2] - p3[2]) - (ux[2] - p3[2]) * (vx[1] - p3[1]);
            const cy = (ux[2] - p3[2]) * (vx[0] - p3[0]) - (ux[0] - p3[0]) * (vx[2] - p3[2]);
            const cz = (ux[0] - p3[0]) * (vx[1] - p3[1]) - (ux[1] - p3[1]) * (vx[0] - p3[0]);
            const thuan = cx * nx + cy * ny + cz * nz >= 0;
            for (let j = 0; j < 3; j++) {
              const r = j === 0 ? 0 : thuan ? q + j - 1 : q + 2 - j;
              P(r, ux);
              viTriCat[3 * n] = ux[0]; viTriCat[3 * n + 1] = ux[1]; viTriCat[3 * n + 2] = ux[2];
              phapCat[3 * n] = nx; phapCat[3 * n + 1] = ny; phapCat[3 * n + 2] = nz;
              n++;
            }
          }
          for (let q = 0; q < da.n; q++) {
            P(q, ux); P((q + 1) % da.n, vx);
            vienCat.them(ux[0], ux[1], ux[2], vx[0], vx[1], vx[2], mauTmp);
          }
        }
        geoCat.setDrawRange(0, n);
        geoCat.attributes.position.needsUpdate = true;
        geoCat.attributes.normal.needsUpdate = true;
        vienCat.xong();
        for (let r = 0; r < Math.min(boCat.soDinh, domCat.length); r++) {
          chieu(boCat.dinh[3 * r], boCat.dinh[3 * r + 1], boCat.dinh[3 * r + 2], w0, k, p3);
          domCat[r].position.set(p3[0], p3[1], p3[2]);
          domCat[r].visible = true;
        }
        doDaiCanhCat(boCat, dai2);
        tenCat = tenKhoi(boCat.soDinh, boCat.soDa, dai2[1] - dai2[0] < 1e-6 * Math.max(1, dai2[1]));
        nhanCat.visible = boCat.soDinh > 0;
        chieu(boCat.tam[0], boCat.tam[1], boCat.tam[2], w0, k, p3);
        let rMax = 0;
        for (let r = 0; r < boCat.soDinh; r++) { chieu(boCat.dinh[3 * r], boCat.dinh[3 * r + 1], boCat.dinh[3 * r + 2], w0, k, q3); rMax = Math.max(rMax, Math.hypot(q3[0] - p3[0], q3[1] - p3[1], q3[2] - p3[2])); }
        if (S.tay.w) {
          // cạnh thước w, bên trái tay nắm: tên của lát cắt ngay chỗ người học đang kéo
          viTriThuoc(_t3);
          nhanCat.center.set(1, 0.5);
          nhanCat.position.set(_t3.x - nhom4.position.x - 0.3, S.f * HR, _t3.z);
        } else {
          nhanCat.center.set(0, 0.5);
          nhanCat.position.set(p3[0] + rMax * 0.75, p3[1] + rMax * 0.85, p3[2]);
        }
        nhanCat.datChu(chuCanh("canh.lat-cat-dinh-canh-mat", "Lát cắt: {0}<small>{1} đỉnh · {2} cạnh · {3} mặt</small>", [tenCat, boCat.soDinh, boCat.soCanh, boCat.soDa]));
      } else if (S.vat === 'cau') {
        const k = K_VAT.cau;
        const r = banKinhLatCat(1, w0);
        tenCat = r > 1e-3 ? chuCanh("canh.qua-cau", "quả cầu") : chuCanh("canh.khong-co-gi", "không có gì");
        nhomCauCat.visible = r > 1e-3;
        chieu(r, 0, 0, w0, k, p3);
        nhomCauCat.scale.setScalar(Math.max(1e-3, p3[0]));
        nhomCauCat.position.set(0, 0, 0);
        nhanCat.visible = true;
        nhanCat.center.set(0, 0.5);
        nhanCat.position.set(0.15, -Math.max(p3[0], 0.3) - 0.45, 0);
        nhanCat.datChu(r > 1e-3 ? chuCanh("canh.lat-cat-qua-cau-r-1", "Lát cắt: quả cầu<small>r = √(1 − {0}²) = {1}</small>", [so(Math.abs(w0), 2), so(r, 2)]) : chuCanh("canh.lat-cat-khong-co-gi", "Lát cắt: không có gì"));
      } else if (S.vat === 'phim') {
        const k = K_VAT.phim;
        const m33 = M[15];
        let co = false;
        if (Math.abs(m33) > 1e-4) {
          const t = w0 / m33;
          if (Math.abs(t) <= PHIM_W) {
            nhanVec(M, traiDat(t, v4), A4);
            chieu(A4[0], A4[1], A4[2], A4[3], k, p3);
            datCat.nhom.position.set(p3[0], p3[1], p3[2]);
            co = true;
          }
        }
        datCat.nhom.visible = co;
        let soNghiem = 0;
        let truocG = 0, truocT = 0, coTruoc = false;
        for (let i = 0; i <= N_PHIM && soNghiem < trangCat.length; i++) {
          const t = -PHIM_W + (2 * PHIM_W * i) / N_PHIM;
          nhanVec(M, matTrang(t, v4), A4);
          const g = A4[3] - w0;
          if (coTruoc && truocG * g < 0) {
            const u = truocG / (truocG - g);
            const tt2 = truocT + u * (t - truocT);
            nhanVec(M, matTrang(tt2, v4), B4);
            chieu(B4[0], B4[1], B4[2], B4[3], k, q3);
            trangCat[soNghiem].nhom.position.set(q3[0], q3[1], q3[2]);
            trangCat[soNghiem].nhom.visible = true;
            soNghiem++;
          }
          coTruoc = true; truocG = g; truocT = t;
        }
        if (dt) { datCat.capNhat(dt); for (const m of trangCat) m.capNhat(dt); }
        tenCat = co ? chuCanh("canh.phim", "phim {0}", [soNghiem]) : '';
        nhanCat.visible = co;
        nhanCat.center.set(0, 0.5);
        nhanCat.position.set(datCat.nhom.position.x, datCat.nhom.position.y + 0.6, datCat.nhom.position.z);
        nhanCat.datChu(chuCanh("canh.the-gioi-luc-nay-lat-cat-w", "Thế giới lúc này<small>lát cắt w = {0}</small>", [so(w0, 2)]));
      }
    }

    function veLaBan() {
      laBan.batDau();
      const L = 0.62;
      for (let k = 0; k < 4; k++) {
        const x = M[k] * L, y = M[4 + k] * L, z = M[8 + k] * L;
        laBan.them(0, 0, 0, x, y, z, MAU_HUONG[k]);
        const dai = Math.hypot(x, y, z);
        muiLB[k].position.set(x, y, z);
        muiLB[k].visible = dai > 0.08;
        nhanTrucLB[k].position.set(x * 1.3, y * 1.3, z * 1.3);
        nhanTrucLB[k].datChu(dai < 0.08 ? chuCanh("canh.an", "{0} (ẩn)", ['xyzw'[k]]) : 'xyzw'[k]);
      }
      laBan.xong();
      nhanLB.position.set(0, -0.85, 0);
    }

    function veFlatland() {
      nhomPhang.visible = S.phang && S.vat === 'cau';
      if (!nhomPhang.visible) return;
      const h = w0;
      cauPhang.position.y = -h * R_PHANG;
      const r = banKinhLatCat(1, h) * R_PHANG;
      for (let i = 0; i <= 96; i++) { const a = (i / 96) * 2 * Math.PI; vongPhang.dat(i, r * Math.cos(a), 0.01, r * Math.sin(a)); }
      vongPhang.xong(r > 1e-3 ? 97 : 0);
      nhanVongPhang.visible = r > 1e-3;
      nhanVongPhang.position.set(r, 0.02, 0);
      nhanVongPhang.datChu(chuCanh("canh.vong-tron-r", "vòng tròn r = {0}", [so(r / R_PHANG, 2)]));
    }

    // =====================================================================
    // Vòng quay và thước w (vẽ trong cảnh, đi kèm tay nắm)
    // =====================================================================
    const R_VONG = 1.95;
    const nhomVong = new THREE.Group();
    scene.add(nhomVong);
    const vongQuay = new DuongDay(161, { mau: 0xc8aaff, rong: 1.8, doMo: 0.7, quang: 0.1, sang: 0.9 });
    const vachVong = new BoDoan(24, { rong: 1.4, doMo: 0.8, cong: true, sang: 1.2 });
    const cungGoc = new DuongDay(121, { mau: 0xc8aaff, rong: 3.4, quang: 0.16, sang: 1.5 });
    const nhanVong = taoNhan('', 'tran');
    nhanVong.element.style.color = '#c8aaff';
    nhomVong.add(vongQuay.line, vachVong.line, cungGoc.line, nhanVong);
    for (let i = 0; i <= 160; i++) { const a = (i / 160) * 2 * Math.PI; vongQuay.dat(i, R_VONG * Math.sin(a), 0, R_VONG * Math.cos(a)); }
    vongQuay.xong(161);
    vachVong.batDau();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 2 * Math.PI, chinh = i % 6 === 0;
      const r0 = R_VONG * (chinh ? 0.9 : 0.95), r1 = R_VONG * (chinh ? 1.1 : 1.05);
      mauTmp.set(chinh ? 0xffffff : 0xc8aaff).multiplyScalar(chinh ? 1.2 : 0.6);
      vachVong.them(r0 * Math.sin(a), 0, r0 * Math.cos(a), r1 * Math.sin(a), 0, r1 * Math.cos(a), mauTmp);
    }
    vachVong.xong();
    const nhanVach = [0, 90, -90].map((d) => {
      const n = taoNhan(`${d}°`, 'mo tran giua');
      const a = d * DO;
      n.position.set(R_VONG * 1.2 * Math.sin(a), 0, R_VONG * 1.2 * Math.cos(a));
      nhomVong.add(n);
      return n;
    });
    void nhanVach;

    const HR = 1.9;                                       // nửa chiều cao của thước w ứng với f = 1
    const nhomThuoc = new THREE.Group();
    scene.add(nhomThuoc);
    const thuoc = new BoDoan(40, { rong: 3, quang: 0.16, cong: true, sang: 1.4 });
    nhomThuoc.add(thuoc.line);
    thuoc.batDau();
    for (let i = 0; i < 24; i++) {
      const f0 = -1.12 + (2.24 * i) / 24, f1 = -1.12 + (2.24 * (i + 1)) / 24;
      mauTheoW(f0, mauTmp); mauTheoW(f1, mauTmp2);
      thuoc.them(0, f0 * HR, 0, 0, f1 * HR, 0, mauTmp, mauTmp2);
    }
    for (const f of [-1, -0.5, 0, 0.5, 1]) { mauTmp.setScalar(0.8); thuoc.them(-0.12, f * HR, 0, 0.12, f * HR, 0, mauTmp); }
    thuoc.xong();
    const nhanThuoc = taoNhan(chuCanh("canh.truc-w", "trục w"), 'vang tran giua');
    const nhanW0 = taoNhan('', 'tran');
    nhanW0.element.style.color = '#8fe3a8';
    nhomThuoc.add(nhanThuoc, nhanW0);
    const vachCat = new BoDoan(2, { rong: 2.5, cong: true, sang: 2 });     // vạch ngang tại w₀ trên thước
    nhomThuoc.add(vachCat.line);

    function viTriVong(out) {
      out.set(nhom4.position.x, -2.55, 0);
      return out;
    }
    function viTriThuoc(out) {
      const x = S.vat === 'cau' ? nhom4.position.x + 1.95 : S.vat === 'phim' ? 3.9 : 2.95;
      out.set(x, 0, 0);
      return out;
    }

    // =====================================================================
    // Tay nắm (kéo trực tiếp trong cảnh)
    // =====================================================================
    const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _t3 = new THREE.Vector3();
    const dangKeo = { keo: false, quay: false, w: false, tron: false, hyp: false };
    const am4 = { dim: -1, ten: null, nac: null, gocCu: null, giong: null, choNot: 0, gioAnh: null, wCu: null };

    // 1. Đỉnh sáng: kéo dọc đường x → y → z → w để dựng khối n chiều.
    const tayKeo = tt.tayNam({
      viTri: [0, 0, 0], mau: 0xf3c66f, co: 0.12, ten: chuCanh("canh.dinh-sang", "Đỉnh sáng"), moTa: chuCanh("canh.keo-doc-duong-mo-lan-luot-theo-x", "Kéo dọc đường mờ: lần lượt theo x, y, z rồi theo hướng thứ tư w."),
      nhan: chuCanh("canh.keo-dinh-nay", "Kéo đỉnh này"),
      rangBuoc: {
        kieu: 'ham',
        chieu: (tia) => {
          let tot = Infinity, chon = 0;
          for (let i = 0; i <= 160; i++) {
            dinhKeo(i / 40, p3);
            _t1.set(p3[0], p3[1], p3[2]).add(nhom4.position);
            const d = tia.distanceSqToPoint(_t1);
            if (d < tot) { tot = d; chon = i; }
          }
          let keo = chon / 40;
          for (let j = -10; j <= 10; j++) {
            const kk = kep((chon + j / 10) / 40, 0, 4);
            dinhKeo(kk, p3);
            _t1.set(p3[0], p3[1], p3[2]).add(nhom4.position);
            const d = tia.distanceSqToPoint(_t1);
            if (d < tot) { tot = d; keo = kk; }
          }
          tayKeo.keoMoi = keo;
          dinhKeo(keo, p3);
          return _t2.set(p3[0], p3[1], p3[2]).add(nhom4.position);
        },
      },
      khiNam: () => { dangKeo.keo = true; nhanHuongKeo.visible = true; },
      khiKeo: () => { if (tayKeo.keoMoi != null) datKeoTay(tayKeo.keoMoi); },
      khiTha: () => { dangKeo.keo = false; nhanHuongKeo.visible = false; },
    });
    function datKeoTay(keo) {
      S.keo = kep(keo, 0, 4); S.keoDich = null; dkKeo.dat(S.keo);
      S.keoTay = true;
      if (S.keo <= 3.05) S.daVe3 = true;
    }

    // 2. Vòng quay: kéo đốm tím quanh vòng để quay vật trong mặt phẳng đang chọn (mặc định xw).
    const tayQuay = tt.tayNam({
      viTri: [0, -2.55, R_VONG], mau: 0xc8aaff, co: 0.13, ten: chuCanh("canh.vong-quay-bon-chieu", "Vòng quay bốn chiều"),
      moTa: () => chuCanh("canh.keo-quanh-vong-de-quay-vat-trong-mat", "Kéo quanh vòng để quay vật trong mặt phẳng <b>{0}</b>. Góc hiện tại: <b>{1}°</b>.", [S.matQuay, so(S.goc[S.matQuay] / DO, 0)]),
      nhan: chuCanh("canh.keo-quanh-vong-de-quay", "Kéo quanh vòng để quay"),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 1, 0], qua: [0, -2.55, 0] },
      gioiHan: (p) => {
        viTriVong(_t3);
        const dx = p.x - _t3.x, dz = p.z - _t3.z;
        const a = Math.atan2(dx, dz);
        p.set(_t3.x + R_VONG * Math.sin(a), _t3.y, _t3.z + R_VONG * Math.cos(a));
        return p;
      },
      khiNam: () => { dangKeo.quay = true; S.tuQuay = false; dkTuQuay.dat(false); S.gocDich = null; },
      khiKeo: (p) => {
        viTriVong(_t3);
        let a = Math.atan2(p.x - _t3.x, p.z - _t3.z);
        // bắt dính vào bội số của 90° khi lại gần (dưới 2°)
        const gan = Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
        if (Math.abs(a - gan) < 2 * DO) a = gan;
        datGocTay(a);
      },
      khiTha: () => { dangKeo.quay = false; },
    });
    function datGocTay(a) {
      const m = S.matQuay;
      if (a > Math.PI) a -= 2 * Math.PI;
      S.goc[m] = a; S.gocDich = null; S.tuQuay = false; dkTuQuay.dat(false);
      const i = ['xw', 'yw', 'zw'].indexOf(m);
      if (i >= 0) dkGoc[i].dat(a / DO);
      S.gocTay = true;
    }

    // 3. Thước w: kéo đốm xanh lục dọc thước để đặt lát cắt w = w₀.
    const DICH_HUT = () => (S.vat === 'lp' && S.huong === 'dinh' ? [-0.75, -0.25, 0, 0.25, 0.75] : S.vat === 'cau' ? [-0.8, 0, 0.8, -0.6, 0.6] : [0]);
    const tayW = tt.tayNam({
      viTri: [2.95, 0, 0], mau: MAU_KTG.hienTai, co: 0.13, ten: chuCanh("canh.lat-cat-w-w", "Lát cắt w = w₀"),
      moTa: () => chuCanh("canh.keo-len-xuong-de-doi-sieu-phang-cat", "Kéo lên xuống để dời siêu phẳng cắt dọc trục thứ tư. Hiện tại <b>w₀ = {0}</b>{1}.", [so(w0, 2), tenCat && S.vat !== 'phim' ? `: ${tenCat}` : '']),
      nhan: chuCanh("canh.keo-de-cat-lat", "Kéo để cắt lát"),
      rangBuoc: { kieu: 'duong', qua: [2.95, 0, 0], huong: [0, 1, 0] },
      gioiHan: (p) => {
        viTriThuoc(_t3);
        let f = kep(p.y / HR, -1.12, 1.12);
        for (const h of DICH_HUT()) if (Math.abs(f - h) < 0.022) f = h;
        p.set(_t3.x, f * HR, _t3.z);
        return p;
      },
      khiNam: () => { dangKeo.w = true; S.chayCat = false; dkChay.dat(false); },
      khiKeo: (p) => datFTay(p.y / HR),
      khiTha: () => { dangKeo.w = false; },
    });
    function datFTay(f) {
      S.f = kep(f, -1.12, 1.12); S.chayCat = false; dkChay.dat(false); dkW0.dat(S.f);
      S.wTay = true;
    }

    // 4. Hai chấm của sơ đồ so sánh: chấm trắng trên vòng tròn, chấm hồng trên nhánh trên của hyperbol.
    const tayTron = tt.tayNam({
      viTri: [-SS_X + R_TRON, 0, 0.02], mau: 0xffffff, co: 0.12, ten: chuCanh("canh.diem-quay-trong-x-w", "Điểm quay trong (x; w)"),
      moTa: chuCanh("canh.keo-quanh-vong-tron-diem-di-qua-w", "Kéo quanh vòng tròn: điểm đi qua w âm, tức «chúc xuống»."), nhan: chuCanh("canh.keo-quanh-vong-tron", "Kéo quanh vòng tròn"),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 0, 1], qua: [0, 0, 0.02] },
      gioiHan: (p) => { const a = Math.atan2(p.y, p.x + SS_X); p.set(-SS_X + R_TRON * Math.cos(a), R_TRON * Math.sin(a), 0.02); return p; },
      khiNam: () => { dangKeo.tron = true; batSSTay(); },
      khiKeo: (p) => { S.phaTron = Math.atan2(p.y, p.x + SS_X); },
      khiTha: () => { dangKeo.tron = false; },
    });
    const ETA_MAX = 1.55;
    const tayHyp = tt.tayNam({
      viTri: [SS_X, A_HYP, 0.02], mau: MAU_KTG.hong, co: 0.12, ten: chuCanh("canh.su-kien-o-tuong-lai-cua-goc", "Sự kiện ở tương lai của gốc"),
      moTa: chuCanh("canh.keo-doc-nhanh-tren-doi-nguoi-quan-sat", "Kéo dọc nhánh trên: đổi người quan sát chỉ trượt điểm trên hyperbol, không đưa được nó xuống dưới trục x."),
      nhan: chuCanh("canh.keo-doc-hyperbol", "Kéo dọc hyperbol"),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 0, 1], qua: [0, 0, 0.02] },
      gioiHan: (p) => {
        let e = kep(Math.asinh((p.x - SS_X) / A_HYP), -ETA_MAX, ETA_MAX);
        const xg = Math.round(A_HYP * Math.sinh(e));                    // bắt dính vào x nguyên khi lại gần
        if (Math.abs(A_HYP * Math.sinh(e) - xg) < 0.06) e = Math.asinh(xg / A_HYP);
        const [x, t] = trenTai(e);
        p.set(SS_X + x, t, 0.02);
        return p;
      },
      khiNam: () => { dangKeo.hyp = true; batSSTay(); },
      khiKeo: (p) => { S.etaHyp = kep(Math.asinh((p.x - SS_X) / A_HYP), -ETA_MAX, ETA_MAX); },   // p đã qua gioiHan (đã bắt dính)
      khiTha: () => { dangKeo.hyp = false; },
    });
    function batSSTay() {
      if (!S.ssTay) { S.ssTay = true; }
    }

    // Đặt vị trí các tay nắm theo trạng thái (trừ tay nắm đang được kéo), và ẩn hiện theo bước.
    function datTayNam() {
      const lp = S.vat === 'lp', ss = S.vat === 'soSanh';
      tayKeo.an(!(S.tay.keo && lp));
      tayQuay.an(!(S.tay.quay && !ss && S.vat !== 'cau'));
      tayW.an(!(S.tay.w && S.cat && !ss));
      tayTron.an(!(S.tay.ss && ss));
      tayHyp.an(!(S.tay.ss && ss));
      nhomVong.visible = S.tay.quay && !ss && S.vat !== 'cau';
      nhomThuoc.visible = S.tay.w && S.cat && !ss;
      duongKeo.line.visible = S.tay.keo && lp;
      nhanHuongKeo.visible = S.tay.keo && lp && dangKeo.keo;
    }
    function capNhatTayNam() {
      if (S.tay.keo && S.vat === 'lp') {
        veDuongKeo();
        if (!dangKeo.keo) { dinhKeo(S.keo, p3); tayKeo.dat(_t1.set(p3[0], p3[1], p3[2]).add(nhom4.position)); }
      }
      if (nhomVong.visible) {
        viTriVong(_t3);
        nhomVong.position.copy(_t3);
        const a = S.goc[S.matQuay];
        if (!dangKeo.quay) tayQuay.dat(_t1.set(_t3.x + R_VONG * Math.sin(a), _t3.y, _t3.z + R_VONG * Math.cos(a)));
        const n = Math.max(2, Math.round((Math.abs(a) / Math.PI) * 120) + 1);
        for (let i = 0; i < n; i++) { const b = (a * i) / (n - 1); cungGoc.dat(i, R_VONG * Math.sin(b), 0.005, R_VONG * Math.cos(b)); }
        cungGoc.xong(Math.abs(a) > 0.01 ? n : 0);
        nhanVong.position.set(R_VONG * 1.08 * Math.sin(a), 0.32, R_VONG * 1.08 * Math.cos(a));
        nhanVong.datChu(chuCanh("canh.quay-trong", "quay trong {0}: {1}°", [S.matQuay, so(a / DO, 0)]));
      }
      if (nhomThuoc.visible) {
        viTriThuoc(_t3);
        nhomThuoc.position.copy(_t3);
        if (!dangKeo.w) tayW.dat(_t1.set(_t3.x, S.f * HR, _t3.z));
        nhanThuoc.position.set(0, 1.12 * HR + 0.3, 0);
        nhanW0.position.set(0.22, S.f * HR, 0);
        nhanW0.datChu(`w₀ = ${so(w0, 2)}`);
        vachCat.batDau();
        mauTmp.set(MAU_KTG.hienTai);
        vachCat.them(-0.3, S.f * HR, 0, 0.3, S.f * HR, 0, mauTmp);
        vachCat.xong();
      }
      if (S.vat === 'soSanh' && S.tay.ss) {
        if (!dangKeo.tron) tayTron.dat(dongSS.tron.dom.position);
        if (!dangKeo.hyp) tayHyp.dat(dongSS.tren.dom.position);
      }
    }

    // =====================================================================
    // Âm thanh (mang nghĩa): nốt khi xong một chiều, chuông khi lát cắt đổi dạng, tích khi quay qua từng 15°,
    // giọng kéo dài theo bán kính quả cầu lát cắt, tích khi lát cắt «bây giờ» đi qua một ảnh chụp.
    // =====================================================================
    const NOT_CHIEU = [293.66, 369.99, 440.0, 587.33, 739.99];
    const NOT_DINH = { 4: 587.33, 6: 739.99, 8: 880.0, 12: 1174.66 };
    function tatGiong() { if (am4.giong) { am4.giong.tat(0.35); am4.giong = null; } }
    function amThanh(dt) {
      if (!dt) { if (am4.giong) am4.giong.dat({ doTo: 0 }, 0.08); return; }
      am4.choNot = Math.max(0, am4.choNot - dt);
      // số chiều vừa dựng xong
      if (S.vat === 'lp') {
        const dim = Math.floor(S.keo + 1e-6);
        if (am4.dim >= 0 && dim !== am4.dim && dim >= 0 && dim <= 4) am.not({ tanSo: NOT_CHIEU[dim], dai: 0.9, doTo: 0.35, dang: 'chuong' });
        am4.dim = dim;
      } else am4.dim = -1;
      // dạng lát cắt của siêu lập phương
      if (S.cat && S.vat === 'lp') {
        if (am4.ten !== null && tenCat !== am4.ten && am4.choNot <= 0) {
          const f = NOT_DINH[boCat.soDinh];
          if (f) am.not({ tanSo: f, dai: 1.4, doTo: 0.32, dang: 'kinh', lech: 0.3 });
          else if (boCat.soDinh === 0) am.not({ tanSo: 220, dai: 0.6, doTo: 0.2, dang: 'mem', lech: 0.3 });
          else am.not({ tanSo: 987.77, dai: 1.2, doTo: 0.26, dang: 'kinh', lech: 0.3 });
          am4.choNot = 0.12;
        }
        am4.ten = tenCat;
      } else am4.ten = null;
      // quay bằng tay: tích mỗi 15°, chuông ở bội số 90° (ô trong và ô ngoài đổi chỗ trọn vẹn)
      if (dangKeo.quay) {
        const a = S.goc[S.matQuay] / DO;
        const nac = Math.round(a / 15);
        if (am4.nac !== null && nac !== am4.nac) {
          if (nac % 6 === 0) am.not({ tanSo: 880, dai: 1.2, doTo: 0.3, dang: 'chuong' });
          else am.tich({ tanSo: 1500, doTo: 0.22, dai: 0.03 });
        }
        am4.nac = nac;
      } else am4.nac = null;
      // siêu cầu: cao độ theo bán kính lát cắt (cầu to thì trầm), chỉ khi lát cắt đang chuyển động
      if (S.vat === 'cau' && S.cat) {
        const r = banKinhLatCat(1, w0);
        const dong = am4.wCu !== null && Math.abs(w0 - am4.wCu) > 1e-5;
        am4.wCu = w0;
        if (!am4.giong) am4.giong = am.giong({ dang: 'mem', tanSo: 200, doTo: 0 });
        am4.giong.dat({ tanSo: tanSoCau(r), doTo: dong && r > 1e-3 ? 0.16 : 0, lech: 0.2 }, 0.08);
      } else { am4.wCu = null; if (am4.giong) am4.giong.dat({ doTo: 0 }, 0.1); }
      // phim: lát cắt đi qua một ảnh chụp
      if (S.vat === 'phim' && S.cat) {
        let gan = -1;
        for (let i = 0; i < anh.length; i++) if (Math.abs(anh[i].t * M[15] - w0) < 0.05) gan = i;
        if (gan >= 0 && gan !== am4.gioAnh) am.tich({ tanSo: 1200, doTo: 0.3, dai: 0.04 });
        am4.gioAnh = gan;
      }
    }

    // =====================================================================
    // Điều khiển
    // =====================================================================
    const bang = app.bang;
    const dkVat = bang.chon({
      nhan: chuCanh("canh.vat-bon-chieu", "Vật bốn chiều"),
      luaChon: [
        { giaTri: 'lp', nhan: chuCanh("canh.sieu-lap-phuong", "Siêu lập phương") }, { giaTri: 'cau', nhan: chuCanh("canh.sieu-cau", "Siêu cầu") },
        { giaTri: 'phim', nhan: chuCanh("canh.phim-trai-dat-mat-trang", "Phim Trái Đất – Mặt Trăng") }, { giaTri: 'soSanh', nhan: chuCanh("canh.vong-tron-va-hyperbol", "Vòng tròn và hyperbol") },
      ],
      giaTri: S.vat,
      khiDoi: (v) => cauHinh({ vat: v, chieu: v === 'phim' ? 'thang' : 'phoi', mayAnh: v === 'phim' ? 'phim' : v === 'soSanh' ? 'soSanh' : 'chinh' }),
    });
    const dkKeo = bang.thanhTruot({
      nhan: chuCanh("canh.so-lan-keo-so-chieu", "Số lần kéo (số chiều)"), min: 0, max: 4, buoc: 0.01, giaTri: S.keo,
      hienThi: (v) => `${so(v, 2)} · ${TEN_GIAI_DOAN[Math.round(v)].toLowerCase()}`,
      khiDoi: (v) => { S.keo = v; S.keoDich = null; },
    });
    const dkMau = bang.chon({
      nhan: chuCanh("canh.to-mau-canh", "Tô màu cạnh"),
      luaChon: [{ giaTri: 'huong', nhan: chuCanh("canh.theo-huong-keo", "Theo hướng kéo"), moTa: chuCanh("canh.x-trang-y-xanh-z-hong-w-vang", "x trắng, y xanh, z hồng, w vàng") }, { giaTri: 'w', nhan: chuCanh("canh.theo-toa-do-w", "Theo tọa độ w"), moTa: chuCanh("canh.xanh-lam-w-am-cam-w-duong", "xanh lam w âm, cam w dương") }],
      giaTri: S.mau,
      khiDoi: (v) => { S.mau = v; capNhatGiaoDien(); },
    });
    const dkHuong = bang.chon({
      nhan: chuCanh("canh.huong-dat-sieu-lap-phuong", "Hướng đặt siêu lập phương"),
      luaChon: [{ giaTri: 'mat', nhan: chuCanh("canh.mat-o-truoc", "Mặt (ô) trước") }, { giaTri: 'dinh', nhan: chuCanh("canh.dinh-truoc", "Đỉnh trước") }],
      giaTri: S.huong,
      khiDoi: (v) => { S.huong = v; },
    });
    const dkChieu = bang.chon({
      nhan: chuCanh("canh.cach-chieu-xuong-ba-chieu", "Cách chiếu xuống ba chiều"),
      luaChon: [{ giaTri: 'phoi', nhan: chuCanh("canh.phoi-canh", "Phối cảnh"), moTa: '(x, y, z)·d/(d − w)' }, { giaTri: 'thang', nhan: chuCanh("canh.chieu-thang", "Chiếu thẳng"), moTa: chuCanh("canh.bo-toa-do-w", "bỏ tọa độ w") }],
      giaTri: S.chieu,
      khiDoi: (v) => { S.chieu = v; },
    });
    const gocHien = (v) => `${so(v, 0)}°`;
    const dkGoc = ['xw', 'yw', 'zw'].map((m) => bang.thanhTruot({
      nhan: chuCanh("canh.goc-quay-trong-mat-phang", "Góc quay trong mặt phẳng {0}", [m]), min: -180, max: 180, buoc: 1, giaTri: 0, hienThi: gocHien,
      khiDoi: (v) => { S.goc[m] = v * DO; S.gocDich = null; if (m === S.matQuay) S.gocTay = true; },
    }));
    const dkTuQuay = bang.congTac({ nhan: chuCanh("canh.tu-quay-cham", "Tự quay chậm"), giaTri: S.tuQuay, khiDoi: (v) => { S.tuQuay = v; } });
    const dkCat = bang.congTac({ nhan: chuCanh("canh.cat-lat-bang-sieu-phang-w-w", "Cắt lát bằng siêu phẳng w = w₀"), giaTri: S.cat, khiDoi: (v) => { S.cat = v; capNhatGiaoDien(); } });
    const dkW0 = bang.thanhTruot({
      nhan: chuCanh("canh.vi-tri-lat-cat", "Vị trí lát cắt"), min: -1.12, max: 1.12, buoc: 0.005, giaTri: 0,
      hienThi: (v) => `w₀ = ${so(v * tamVuon, 2)}`,
      khiDoi: (v) => { S.f = v; S.chayCat = false; dkChay.dat(false); S.wTay = true; },
    });
    const dkChay = bang.congTac({ nhan: chuCanh("canh.cho-vat-di-xuyen-qua-w-tu-chay", "Cho vật đi xuyên qua (w₀ tự chạy)"), giaTri: S.chayCat, khiDoi: (v) => { S.chayCat = v; } });
    const ghiChu = bang.chuThich('');

    const GOC = {
      cheo: [[4.6, 3.4, 8.6], [0.3, -0.3, 0]],
      chinh: [[3.2, 2.9, 10.6], [0.2, -0.25, 0]],
      phang: [[0.8, 4.4, 12.6], [-0.2, -0.1, 0]],
      phim: [[5.4, 3.9, 9.2], [0.4, -0.35, 0]],
      soSanh: [[0, 0.4, 16.5], [0, 0.35, 0]],
    };
    const goc = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    function capNhatGiaoDien() {
      const ss = S.vat === 'soSanh';
      nhomLP.visible = S.vat === 'lp';
      nhomCau.visible = S.vat === 'cau';
      nhomPhim.visible = S.vat === 'phim';
      nhomSS.visible = ss;
      nhomLaBan.visible = !ss;
      nhomPhang.visible = S.phang && S.vat === 'cau';
      nhomCat.visible = S.cat && !ss;
      nhom4.position.x = S.phang && S.vat === 'cau' ? 2.1 : 0;
      nhomPhang.position.x = -2.7;
      dkKeo.el.hidden = dkMau.el.hidden = S.vat !== 'lp';
      dkHuong.el.hidden = S.vat !== 'lp';
      for (const d of dkGoc) d.el.hidden = ss;
      dkChieu.el.hidden = dkTuQuay.el.hidden = dkCat.el.hidden = ss;
      dkW0.el.hidden = dkChay.el.hidden = ss || !S.cat;
      ghiChu.dat({
        lp: S.mau === 'w'
          ? chuCanh("canh.canh-mat-va-dinh-to-theo-toa-do", "Cạnh, mặt và đỉnh tô theo tọa độ w: xanh lam phía âm (xa «mắt bốn chiều»), trắng ở giữa, cam phía dương. Khi cắt lát: phần đã qua lát cắt ngả xanh lam, phần chưa tới ngả cam.")
          : chuCanh("canh.mau-canh-theo-huong-keo-x-trang-y", "Màu cạnh theo hướng kéo: x trắng, y xanh lam, z hồng, w vàng. Màu đỉnh theo tọa độ w: xanh lam phía âm, cam phía dương. Khi cắt lát: phần đã qua lát cắt ngả xanh lam, phần chưa tới ngả cam."),
        cau: chuCanh("canh.sieu-cau-ve-bang-9-vi-tuyen-mau", "Siêu cầu vẽ bằng 9 vĩ tuyến; màu theo w. Lát cắt bởi siêu phẳng w = w₀ là quả cầu kính xanh lục. Kéo đốm xanh lục trên thước để dời lát cắt."),
        phim: chuCanh("canh.truc-w-la-thoi-gian-da-nen-khoang", "Trục w là thời gian (đã nén khoảng 800 000 lần). Mỗi khung kính là một ảnh chụp ba chiều; Trái Đất và Mặt Trăng vẽ to hơn thật nhiều lần để dễ nhìn. Kéo đốm tím quanh vòng để quay trục thời gian ra."),
        soSanh: chuCanh("canh.trai-quay-trong-khong-gian-bon-chieu-giu", "Trái: quay trong không gian bốn chiều giữ x² + w². Phải: phép đổi người quan sát trong không-thời gian giữ −t² + x². Kéo hai chấm để tự đẩy điểm đi."),
      }[S.vat]);
      datTayNam();
    }

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      if (o.vat) { S.vat = o.vat; dkVat.dat(S.vat); }
      if (o.keo != null) { S.keo = o.keo; dkKeo.dat(o.keo); }
      if (o.keoDich !== undefined) S.keoDich = o.keoDich;
      if (o.huong) { S.huong = o.huong; dkHuong.dat(o.huong); }
      if (o.chieu) { S.chieu = o.chieu; dkChieu.dat(o.chieu); }
      if (o.mau) { S.mau = o.mau; dkMau.dat(o.mau); }
      if (o.goc) { ['xw', 'yw', 'zw'].forEach((m, i) => { S.goc[m] = o.goc[i] * DO; dkGoc[i].dat(o.goc[i]); }); S.goc.xy = 0; S.gocDich = null; }
      if (o.tuQuay != null) { S.tuQuay = o.tuQuay; dkTuQuay.dat(o.tuQuay); }
      if (o.matQuay) S.matQuay = o.matQuay;
      if (o.cat != null) { S.cat = o.cat; dkCat.dat(o.cat); }
      if (o.chayCat != null) { S.chayCat = o.chayCat; dkChay.dat(o.chayCat); }
      if (o.f != null) { S.f = o.f; dkW0.dat(o.f); }
      if (o.phang != null) S.phang = o.phang;
      if (o.vat && o.vat !== 'cau') S.phang = o.phang ?? false;
      if (o.tay) S.tay = { keo: !!o.tay.keo, quay: !!o.tay.quay, w: !!o.tay.w, ss: !!o.tay.ss };
      if (o.vao) {
        // vào bước mới: xoá dấu thao tác tay của bước trước
        S.keoTay = false; S.daVe3 = false; S.gocTay = false; S.wTay = false; S.ssTay = false;
      }
      if (o.vat === 'soSanh' || o.ssLai) S.ssTay = false;
      capNhatGiaoDien();
      if (o.mayAnh) goc(o.mayAnh);
    }
    capNhatGiaoDien();

    // Kéo giả bằng sự kiện con trỏ thật trên khung vẽ (chỉ dùng khi chụp ảnh kiểm): nắm tay nắm rồi rê qua các điểm đích
    // (toạ độ cảnh), để kiểm cả đường đi của khung tương tác chứ không chỉ gọi thẳng hàm của bài.
    function keoGia(tay, dsDich, tha = true) {
      const cv = app.renderer.domElement;
      app.camera.updateMatrixWorld();
      const r = cv.getBoundingClientRect();
      const manHinh = (p) => { const v = p.clone().project(app.camera); return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]; };
      const su = (loai, [x, y], nut) => cv.dispatchEvent(new PointerEvent(loai, {
        clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, bubbles: true, cancelable: true, buttons: nut, button: loai === 'pointermove' ? -1 : 0,
      }));
      const p0 = manHinh(tay.vat.getWorldPosition(new THREE.Vector3()));
      su('pointermove', p0, 0);
      su('pointerdown', p0, 1);
      let cuoi = p0;
      for (const d of dsDich) { cuoi = manHinh(d); su('pointermove', cuoi, 1); }
      if (tha) su('pointerup', cuoi, 0);
    }
    // Tham số riêng khi chụp ảnh kiểm (chỉ đọc ở chế độ im lặng): thu=<tên> đặt mô hình vào một trạng thái cần xem.
    let thu = null;
    if (app.imLang) { try { thu = new URLSearchParams(location.search).get('thu'); } catch { thu = null; } }
    let thuKeo = null;
    function apKeoThat() {
      const ten = thuKeo;
      thuKeo = null;
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      const theo = (keo) => { dinhKeo(keo, p3); return V(p3[0], p3[1], p3[2]).add(nhom4.position); };
      if (ten === 'keo') keoGia(tayKeo, [theo(2.8), theo(2.2), theo(1.6), theo(1.5)]);
      else if (ten === 'keo-w') keoGia(tayKeo, [theo(3.4), theo(3.7), theo(4)]);
      else if (ten === 'quay') { viTriVong(_t3); keoGia(tayQuay, [30, 60, 88].map((d) => V(_t3.x + R_VONG * Math.sin(d * DO), _t3.y, _t3.z + R_VONG * Math.cos(d * DO)))); }
      else if (ten === 'w') { viTriThuoc(_t3); keoGia(tayW, [0.3, 0.6, 0.79].map((f) => V(_t3.x, f * HR, _t3.z))); }
      else if (ten === 'hyp') keoGia(tayHyp, [1, 1.6, 2.02].map((x) => V(SS_X + x, Math.hypot(1, x), 0.02)));
    }
    function apThu() {
      const ten = thu;
      thu = null;
      if (!ten) return;
      if (ten.startsWith('keo:')) { thuKeo = ten.slice(4); return; }
      if (ten === 'keo-giua') { datKeoTay(1.55); }
      else if (ten === 'keo-w') { datKeoTay(3.55); }
      else if (ten === 'keo-dat') { datKeoTay(3.0); datKeoTay(4); }
      else if (ten === 'quay90') { datGocTay(90 * DO); }
      else if (ten === 'quay35') { datGocTay(35 * DO); }
      else if (ten === 'cau06') { datFTay(0.8); }
      else if (ten === 'bat-dien') { cauHinh({ huong: 'dinh', goc: [0, 0, 0], tuQuay: false, cat: true }); maTranQuay(S.goc, 'dinh', M); veLapPhuong(); datFTay(0); }
      else if (ten === 'tu-dien-cut') { cauHinh({ huong: 'dinh', goc: [0, 0, 0], tuQuay: false, cat: true }); datFTay(-0.25); }
      else if (ten === 'tu-dien') { cauHinh({ huong: 'dinh', goc: [0, 0, 0], tuQuay: false, cat: true }); datFTay(-0.75); }
      else if (ten === 'phim-cat') { S.goc.xw = -72 * DO; dkGoc[0].dat(-72); cauHinh({ cat: true, chayCat: false, f: 0.2 }); S.wTay = true; }
      else if (ten === 'hyp2') { batSSTay(); S.etaHyp = Math.asinh(2 / A_HYP); S.phaTron = -1.1; }
    }

    function tanSoCau(r) { return 196 * 2 ** ((1 - r) * 1.6); }

    function capNhat(dt) {
      if (thu) apThu();
      if (thuKeo && S.thoiGian > 2.2) apKeoThat();
      S.thoiGian += dt;
      if (S.vat === 'soSanh') {
        veSoSanh(dt);
        capNhatTayNam();
        amThanh(dt);
        return;
      }
      if (S.keoDich != null) {
        const d = S.keoDich - S.keo;
        const b = Math.sign(d) * Math.min(Math.abs(d), dt * 0.75);
        S.keo += b;
        if (Math.abs(S.keoDich - S.keo) < 1e-4) { S.keo = S.keoDich; S.keoDich = null; }
        dkKeo.dat(S.keo);
      }
      if (S.gocDich) {
        const [m, dich] = S.gocDich;
        const d = dich - S.goc[m];
        const b = Math.sign(d) * Math.min(Math.abs(d), dt * 1.1);
        S.goc[m] += b;
        if (Math.abs(dich - S.goc[m]) < 1e-5) { S.goc[m] = dich; S.gocDich = null; }
        const i = ['xw', 'yw', 'zw'].indexOf(m);
        if (i >= 0) dkGoc[i].dat(S.goc[m] / DO);
      }
      if (S.tuQuay && !dangKeo.quay) {
        const m = S.matQuay;
        S.goc[m] += dt * 0.45;
        if (S.goc[m] > Math.PI) S.goc[m] -= 2 * Math.PI;
        const i = ['xw', 'yw', 'zw'].indexOf(m);
        if (i >= 0) dkGoc[i].dat(S.goc[m] / DO);
      }
      if (S.cat && S.chayCat && !dangKeo.w) {
        S.f += dt * 0.24;
        if (S.f > 1.12) S.f = -1.12;
        dkW0.dat(S.f);
      }
      maTranQuay(S.goc, S.vat === 'lp' ? S.huong : 'mat', M);
      if (S.vat === 'lp') veLapPhuong();
      w0 = S.f * tamVuon;
      if (S.vat === 'lp') veLapPhuong();         // vẽ lại với w0 đúng (rẻ: 32 cạnh)
      else if (S.vat === 'cau') { tamVuon = 1; w0 = S.f; veCau(); }
      else if (S.vat === 'phim') { vePhim(0); w0 = S.f * tamVuon; vePhim(dt); }
      veCat(dt);
      veLaBan();
      veFlatland();
      nhomLaBan.position.set(S.phang && S.vat === 'cau' ? -2.0 : -4.1, S.phang && S.vat === 'cau' ? -2.3 : 1.5, S.phang && S.vat === 'cau' ? 0.6 : 0);
      capNhatTayNam();
      amThanh(dt);
    }

    function hud() {
      if (S.vat === 'soSanh') {
        const [xh, th] = trenTai(S.etaHyp);
        return [
          [chuCanh("canh.quay-trong-x-w", "Quay trong (x; w)"), chuCanh("canh.x-w-luc-nay-w", "x² + w² = {0}, lúc này w = {1}", [so(R_TRON * R_TRON, 2), so(R_TRON * Math.sin(S.phaTron), 2)])],
          [chuCanh("canh.quay-trong-x-ct", "«Quay» trong (x; ct)"), chuCanh("canh.t-x-luon-co-t", "−t² + x² = −{0}, luôn có t ≥ {1}", [so(A_HYP * A_HYP, 0), so(A_HYP, 0)])],
          [chuCanh("canh.cham-hong", "Chấm hồng"), `x = ${so(xh, 2)}, t = ${so(th, 2)} = √(1 + x²)`],
        ];
      }
      const d = [];
      if (S.vat === 'lp') {
        const gd = Math.round(kep(S.keo, 0, 4));
        d.push([chuCanh("canh.vat", "Vật"), chuCanh("canh.chieu", "{0} {1} chiều: {2}", [TEN_GIAI_DOAN[gd].toLowerCase(), gd, [0, 1, 2, 3, 4].filter((q) => q <= gd).map((q) => `${demPhanTu(gd, q)} ${q === 4 ? chuCanh("canh.sieu-khoi", "siêu khối") : TEN_PHAN_TU[q]}`).slice(0, 4).join(', ')])]);
      } else if (S.vat === 'cau') d.push([chuCanh("canh.vat", "Vật"), chuCanh("canh.sieu-cau-ban-kinh-1-x-y-z", "siêu cầu bán kính 1: x² + y² + z² + w² = 1")]);
      else d.push([chuCanh("canh.vat", "Vật"), chuCanh("canh.phim-trai-dat-mat-trang-w-thoi-gian", "phim Trái Đất – Mặt Trăng (w = thời gian, nén khoảng {0} lần)", [soNghia(NEN_PHIM, 1)])]);
      d.push([chuCanh("canh.goc-quay", "Góc quay"), `xw ${so(S.goc.xw / DO, 0)}° · yw ${so(S.goc.yw / DO, 0)}° · zw ${so(S.goc.zw / DO, 0)}°${S.tuQuay ? chuCanh("canh.dang-quay-trong", " · đang quay trong {0}", [S.matQuay]) : ''}`]);
      d.push([chuCanh("canh.chieu-587cfe", "Chiếu"), S.chieu === 'phoi' ? chuCanh("canh.phoi-canh-d", "phối cảnh, d = {0}", [so(D, 1)]) : chuCanh("canh.chieu-thang-bo-w", "chiếu thẳng (bỏ w)")]);
      if (S.cat) {
        if (S.vat === 'lp') d.push([chuCanh("canh.lat-cat", "Lát cắt"), chuCanh("canh.w-dinh-canh-mat", "w₀ = {0}: {1} ({2} đỉnh, {3} cạnh, {4} mặt)", [so(w0, 2), tenCat, boCat.soDinh, boCat.soCanh, boCat.soDa])]);
        if (S.vat === 'cau') d.push([chuCanh("canh.lat-cat", "Lát cắt"), chuCanh("canh.w-qua-cau-ban-kinh", "w₀ = {0}: quả cầu bán kính {1}", [so(w0, 2), so(banKinhLatCat(1, w0), 3)])]);
        if (S.vat === 'phim') d.push([chuCanh("canh.lat-cat", "Lát cắt"), chuCanh("canh.w-the-gioi-luc-nay", "w₀ = {0}: «thế giới lúc này»", [so(w0, 2)])]);
      }
      return d;
    }

    return {
      scene, capNhat, hud, cauHinh,
      tuChinhGanXa: [0.01, 60, 200],
      huy() { tatGiong(); },
      tatTieng: () => tatGiong(),
      // Trạng thái cho thử thách
      dat: {
        sieuLapPhuong: () => S.vat === 'lp' && S.keoTay && S.daVe3 && S.keo >= 3.98,
        quay90: () => S.vat === 'lp' && S.gocTay && !S.tuQuay && S.matQuay === 'xw' && Math.abs(Math.abs(S.goc.xw / DO) - 90) <= 4,
        cau06: () => S.vat === 'cau' && S.cat && S.wTay && Math.abs(banKinhLatCat(1, w0) - 0.6) <= 0.02,
        batDien: () => S.vat === 'lp' && S.cat && S.wTay && S.huong === 'dinh' && tenCat === chuCanh('canh.bat-dien-deu', 'bát diện đều'),
        hyp2: () => S.vat === 'soSanh' && S.ssTay && Math.abs(trenTai(S.etaHyp)[0] - 2) <= 0.1,
      },
      keoToi: (n) => { S.vat !== 'lp' && cauHinh({ vat: 'lp' }); S.keoDich = n; S.keoTay = false; },
      keoTuDau: (n) => { S.keo = 0; dkKeo.dat(0); S.keoDich = n; S.keoTay = false; },
      quay: (m) => {
        if (!m) { S.tuQuay = false; dkTuQuay.dat(false); return; }
        S.matQuay = m; S.tuQuay = true; dkTuQuay.dat(true); S.gocTay = false;
      },
      datGoc: (m, doGoc, muot = false) => {
        if (muot) S.gocDich = [m, doGoc * DO];
        else { S.goc[m] = doGoc * DO; const i = ['xw', 'yw', 'zw'].indexOf(m); if (i >= 0) dkGoc[i].dat(doGoc); }
        S.tuQuay = false; dkTuQuay.dat(false); S.gocTay = false;
      },
      chayCat: (b) => { S.cat = true; dkCat.dat(true); S.chayCat = b; dkChay.dat(b); if (b) S.f = -1.05; S.wTay = false; capNhatGiaoDien(); },
      // Đặt lát cắt tại w0 (đơn vị dữ liệu) và dừng tự chạy.
      datW0: (w) => {
        S.cat = true; dkCat.dat(true); S.chayCat = false; dkChay.dat(false);
        maTranQuay(S.goc, S.vat === 'lp' ? S.huong : 'mat', M);
        if (S.vat === 'lp') veLapPhuong();
        const vuon = S.vat === 'cau' ? 1 : tamVuon;
        S.f = w / vuon; dkW0.dat(S.f);
        S.wTay = false;
        capNhatGiaoDien();
      },
    };
  },
};
