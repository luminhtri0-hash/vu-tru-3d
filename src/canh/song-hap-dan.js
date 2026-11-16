import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 17 — Sóng hấp dẫn từ hai vật xoáy vào nhau.
// Pha và tần số theo công thức tứ cực của Einstein (vat-ly/song-hap-dan.js, vat-ly/tieng-chirp.js):
//   Ω(τ) = A·τ^(−3/8),  Φ(τ) = −(8/5)·A·τ^(5/8),  τ = thời gian còn lại tới lúc sáp nhập.
// Hình được chiếu chậm: 14 giây trên hình ứng với vài phần mười giây (lỗ đen) hay vài mili giây (sao neutron).
// Bản 2: «trạm đo» đặt tại máy dò gồm vòng hạt thử (vuông góc với hướng sóng, có mũi tên lực thủy triều)
// và giao thoa kế kiểu LIGO; cả hai vẽ biến dạng phóng đại khoảng 10²⁰ lần.
// Bản 3:
//   - Mặt không-thời gian là một tấm liền vẽ bằng shader: gợn sóng mịn như mặt nước, viền sáng theo góc nhìn,
//     lưới mịn mờ dần theo khoảng cách, chớp sáng lan ra lúc nhập. Sóng trễ đúng r/c, tần số gấp đôi tần số quỹ đạo,
//     biên độ giảm theo 1/r.
//   - Hai lỗ đen có vòng photon (taoLoDenNho); lỗ đen mới rung tắt dần; sao neutron là quả cầu nóng sáng.
//   - Máy dò hình chữ L kéo được quanh nguồn (mặt cầu): biên độ và phân cực đổi theo hướng (1 + cos²ι)/2, cos ι.
//   - Thước khoảng cách kéo được (cũng là kéo thời gian), hai cột khối lượng kéo được, cặp cánh tay đo xoay được.
//   - Tiếng «chirp» theo đúng công thức, tính lại từng khung hình từ trạng thái mô hình (tieng-chirp.js: quyDoiTieng).
//   - Tham số đường dẫn thu=<tên> (chỉ khi app.imLang) đặt sẵn một trạng thái để chụp ảnh kiểm tra.

import * as THREE from 'three';
import { so, soNghia, C, G, M_MAT_TROI, DO } from '../vat-ly/hang-so.js';
import { khoiLuongChirp } from '../vat-ly/song-hap-dan.js';
import * as TC from '../vat-ly/tieng-chirp.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, DuongDong, duongTron, goNhanDeNhau } from '../khung/ve.js';
import { muiTen } from '../khung/ktg.js';
import { taoLoDenNho } from '../khung/hanh-tinh.js';
import { MAU } from '../khung/giao-dien.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('song-hap-dan', khoa, goc, thamSo);

const R = String.raw;

// Nhiều đoạn thẳng rời nhau (vạch chia), cập nhật được: dat(i, x1, y1, z1, x2, y2, z2), xong(n).
class DoanRoi {
  constructor(toiDa, { mau = 0xffffff, doMo = 0.5 } = {}) {
    this.mang = new Float32Array(toiDa * 6);
    this.geo = new THREE.BufferGeometry();
    this.thuocTinh = new THREE.BufferAttribute(this.mang, 3);
    this.thuocTinh.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', this.thuocTinh);
    this.line = new THREE.LineSegments(this.geo, new THREE.LineBasicMaterial({ color: mau, transparent: true, opacity: doMo, depthWrite: false }));
    this.line.frustumCulled = false;
    this.geo.setDrawRange(0, 0);
  }
  dat(i, x1, y1, z1, x2, y2, z2) { const k = i * 6, m = this.mang; m[k] = x1; m[k + 1] = y1; m[k + 2] = z1; m[k + 3] = x2; m[k + 4] = y2; m[k + 5] = z2; }
  xong(n) { this.geo.setDrawRange(0, 2 * n); this.thuocTinh.needsUpdate = true; }
}

const T0 = TC.T0;              // giây trên hình trước lúc sáp nhập
const T_SAU = 5;               // giây trên hình sau lúc sáp nhập
const OM_DAU = TC.OM_DAU;      // tốc độ góc quỹ đạo trên hình lúc bắt đầu (rad/giây)
const AV = TC.AV;
const C_HINH = (16 * OM_DAU) / Math.PI;      // tốc độ sóng trên hình: bước sóng đầu = 16 đơn vị
const A_DAU = 7;               // khoảng cách hai vật lúc bắt đầu (đơn vị hình)
const NUA = 36;                // bán kính tấm không-thời gian
const R_MAY_DO = 24;
const Y_VAT = 1.5;             // độ cao mặt phẳng quỹ đạo trên hình

// Trạm đo: vòng hạt thử và giao thoa kế, nằm trong mặt phẳng vuông góc với hướng sóng (trục X của trạm).
const Y_TRAM = 6.5;            // độ cao tâm trạm so với lưới
const R_VONG = 3.6;            // bán kính vòng hạt thử
const SO_HAT = 24;
const SO_MT = 12;              // số mũi tên lực thủy triều
const N_VIEN = 97;             // số điểm của đường viền vòng bị méo
const L_TAY = 6.2;             // chiều dài cánh tay giao thoa kế trên hình
const BD_MAU = 0.3;            // biên độ biến dạng khi chạy dao động mẫu (đã phóng đại)
const W_MAU = 2 * Math.PI * 0.42;   // tần số góc dao động mẫu trên hình
const K_HIEN = 0.32;           // biến dạng vẽ trên vòng ứng với biên độ «+» bằng 1 (sóng thật, đã phóng đại)

// Máy dò mặc định nằm trong mặt phẳng quỹ đạo, ở góc phương vị PHI0 (phía trước, bên trái của khung nhìn tổng).
const PHI0 = (205 * Math.PI) / 180;
const quay = ([x, y, z]) => [x * Math.cos(PHI0) - z * Math.sin(PHI0), y, x * Math.sin(PHI0) + z * Math.cos(PHI0)];

// Thước khoảng cách nằm trên mặt phẳng quỹ đạo, hướng về phía người xem.
const HUONG_THUOC = new THREE.Vector3(-0.42, 0, 0.91).normalize();
const Y_THUOC = Y_VAT;
const R0_THUOC = 4.6;          // thước bắt đầu cách tâm 4,6 đơn vị (ngoài vùng hai vật quay); dài đúng bằng khoảng cách hai vật
// Hai cột khối lượng (thang logarit 1,2–80 M☉).
const M_MIN = 1.2, M_MAX = 80, Y_COT0 = 2.2, Y_COT1 = 10.5;
const COT = [[-9.5, 0, 7.5], [9.5, 0, 7.5]];
const yTuKL = (m) => Y_COT0 + ((Y_COT1 - Y_COT0) * Math.log(m / M_MIN)) / Math.log(M_MAX / M_MIN);
const klTuY = (y) => M_MIN * Math.pow(M_MAX / M_MIN, (y - Y_COT0) / (Y_COT1 - Y_COT0));

const HE = [
  { id: 'gw150914', ten: chuCanh("canh.gw150914", "GW150914"), m1: 36, m2: 29, xa: chuCanh("canh.1-3-ti-nam-anh-sang", "1,3 tỉ năm ánh sáng"), moTa: chuCanh("canh.hai-lo-den-tin-hieu-dau-tien-14", "Hai lỗ đen, tín hiệu đầu tiên (14/9/2015)"), loai: 'ld' },
  { id: 'gw170817', ten: chuCanh("canh.gw170817", "GW170817"), m1: 1.46, m2: 1.27, xa: chuCanh("canh.130-trieu-nam-anh-sang", "130 triệu năm ánh sáng"), moTa: chuCanh("canh.hai-sao-neutron-co-ca-anh-sang-17", "Hai sao neutron, có cả ánh sáng (17/8/2017)"), loai: 'nt' },
];

const GOC = {
  tong: [[-6, 28, 62], [-5, 7.5, 0]],
  tren: [[0.01, 58, 0.02], [-1, 0, 1.5]],
  gan: [[0, 11, 17], [0, 0.6, 0]],
  nghieng: [[30, 13, 42], [6, 0, 0]],
  tram: [quay([R_MAY_DO + 19, Y_TRAM + 2.6, -11.5]), quay([R_MAY_DO - 1.2, Y_TRAM - 0.6, -0.4])],
  khoiLuong: [[4, 15, 38], [0, 3.6, 2]],
  thuoc: [[6, 30, 30], [-1, 0, 2.5]],
};

// Mặt không-thời gian: tấm tròn dày đặc ở giữa, thưa dần ra ngoài.
function taoTam(nr = 200, na = 360) {
  const pos = new Float32Array((nr + 1) * (na + 1) * 3);
  let k = 0;
  for (let i = 0; i <= nr; i++) {
    const r = NUA * Math.pow(i / nr, 1.25);
    for (let j = 0; j <= na; j++) {
      const a = (j / na) * 2 * Math.PI;
      pos[k++] = r * Math.cos(a); pos[k++] = 0; pos[k++] = r * Math.sin(a);
    }
  }
  const chiSo = new Uint32Array(nr * na * 6);
  k = 0;
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < na; j++) {
      const a = i * (na + 1) + j, b = a + 1, c = a + na + 1, d = c + 1;
      chiSo[k++] = a; chiSo[k++] = c; chiSo[k++] = b; chiSo[k++] = b; chiSo[k++] = c; chiSo[k++] = d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(chiSo, 1));
  return geo;
}

// Biểu thức GLSL của sóng tại một điểm (x; z) của tấm: trễ r/c, tần số gấp đôi tần số quỹ đạo, biên độ ∝ f^(2/3)/r.
const GLSL_SONG = /* glsl */ `
  uniform float uTau, uAv, uOmMax, uTauM, uPhaM, uPha0, uC, uCao;
  float songTai(vec2 q) {
    float r = length(q);
    float tau = uTau + r / uC;              // thời điểm sóng tại đây được phát ra (trễ r/c)
    float bd, pha;
    if (tau > uTauM) { float om = uAv * pow(tau, -0.375); pha = -1.6 * uAv * pow(tau, 0.625); bd = pow(om / ${OM_DAU.toFixed(2)}, 0.6667); }
    else if (tau > 0.0) { pha = uPhaM + uOmMax * (uTauM - tau); bd = pow(uOmMax / ${OM_DAU.toFixed(2)}, 0.6667); }
    else { pha = uPha0 + ${TC.RUNG_TAN_SO.toFixed(2)} * uOmMax * (-tau); bd = pow(uOmMax / ${OM_DAU.toFixed(2)}, 0.6667) * exp(tau / ${TC.RUNG_TAT.toFixed(2)}); }
    float phi = atan(q.y, q.x);
    return bd * cos(2.0 * (phi - pha)) * min(1.0, 5.0 / max(r, 0.01)) * smoothstep(2.6, 6.5, r);
  }`;

export default {
  id: 'song-hap-dan',
  ten: 'Sóng hấp dẫn: không-thời gian rung lên',
  moTa: 'Gợn của độ cong lan đi với tốc độ ánh sáng; LIGO nghe được năm 2015',
  yChinh: 'Khi hai khối lượng lớn quay quanh nhau, độ cong của không-thời gian quanh chúng thay đổi liên tục, và sự thay đổi ấy lan ra với tốc độ ánh sáng: đó là **sóng hấp dẫn**. Đi qua đâu, sóng kéo giãn khoảng cách theo một phương và ép theo phương vuông góc, như một lực thủy triều đổi chiều. Sóng mang năng lượng đi, nên hai vật xoáy vào nhau ngày càng nhanh rồi nhập làm một. Ngày 14/9/2015, LIGO lần đầu đo được một tín hiệu như thế.',
  giaiThich: R`
Sóng hấp dẫn là độ cong thay đổi lan đi với tốc độ $c$. Nó là **lực thủy triều đổi chiều**: vòng hạt thử bị kéo theo một phương, ép theo phương vuông góc, rồi ngược lại. Biên độ $h = \Delta L/L$; có hai kiểu phân cực «+» và «×» lệch nhau 45°.

Nguồn phải có **tứ cực** khối lượng thay đổi: không có khối lượng âm, và bảo toàn xung lượng cấm bức xạ lưỡng cực. Hai vật quay quanh nhau phát sóng có tần số **gấp đôi** tần số quỹ đạo. Mất năng lượng, chúng xoắn vào, tần số và biên độ cùng tăng: tiếng «chirp». Tốc độ tăng tần số chỉ phụ thuộc **khối lượng chirp**.

GW150914: 36 + 29 M☉ thành 62 M☉, khoảng 3 M☉c² thành sóng trong chừng 0,2 giây; cánh tay 4 km của LIGO đổi khoảng $4 \times 10^{-18}$ m. GW170817: sóng và tia gamma tới cách nhau 1,7 giây sau 130 triệu năm. Pulsar Hulse–Taylor đã cho bằng chứng gián tiếp từ thập niên 1970–1980.`,

  baiGiang: {
    mucTieu: [
      'Giải thích được sóng hấp dẫn là lực thủy triều đổi chiều lan đi với tốc độ ánh sáng, và đọc được biên độ $h = \\Delta L / L$.',
      'Phân biệt hai kiểu phân cực «+» và «×» trên một vòng hạt thử.',
      'Nói được vì sao nguồn sóng phải là tứ cực, và vì sao tần số sóng gấp đôi tần số quỹ đạo.',
      'Dùng công thức tốc độ tăng tần số để hiểu tiếng «chirp» và khối lượng chirp.',
      'Thuật lại được các con số chính của GW150914, cách LIGO đo, và các bằng chứng khác (pulsar đôi, GW170817).',
    ],
    buoc: [
      {
        ten: 'Gợn sóng của độ cong',
        noiDung: R`
Bạn đang nhìn hai lỗ đen nặng 36 và 29 lần Mặt Trời quay quanh nhau, theo số liệu thật của vụ GW150914. Tấm lưới gợn những vòng xoắn màu vàng và xanh lan ra ngoài. Đó là {{sóng hấp dẫn}}.

Ở Bài 12 ta đã thấy độ cong của không-thời gian lộ ra qua {{lực thủy triều}}. Khi nguồn đứng yên, độ cong quanh nó đứng yên. Khi hai vật quay quanh nhau, độ cong quanh chúng thay đổi liên tục. Thuyết tương đối không cho sự thay đổi ấy báo đi tức thời: nó lan ra từng lớp, **với đúng tốc độ ánh sáng**, giống như điện tích rung lên phát ra sóng điện từ.

Mô hình tính đúng điều đó: mỗi điểm trên lưới ở cách nguồn $r$ vẽ trạng thái mà nguồn có từ $r/c$ trước. Vì vậy gợn ở xa là «tiếng vọng» của lúc hai vật còn quay chậm.

> [Lưu ý] Lưới nhô lên hay lõm xuống **chỉ là cách vẽ** độ mạnh của sóng; không gian không phồng lên theo chiều nào cả. Hai vật vẽ to hơn thật so với bước sóng, và mọi thứ được **chiếu chậm** (số lần ghi ở ô số liệu).

> [Thử ngay] [[Nhìn từ trên xuống|tren]] [[Nhìn nghiêng|nghieng]] [[Xem lại từ đầu|lai]]
> Kéo đốm xanh lục (máy dò) quanh nguồn, lên cả phía trên hai lỗ đen. Vòng hạt nhỏ ở máy dò và bảng tín hiệu phía trên nó cho thấy sóng tới đó mạnh hay yếu.

> [Lưu ý] **Tiếng bạn nghe** là tín hiệu ở máy dò: cao độ bằng tần số thật của sóng, độ to theo biên độ. Hình chiếu chậm nhưng cao độ được giữ nguyên (bước 5 nói rõ cách quy đổi).

+++ Đi sâu: sóng là nghiệm của phương trình Einstein trong chân không
Ở xa nguồn, không-thời gian gần phẳng. Viết metric thành metric phẳng cộng một phần nhỏ: $g = \eta + h$, với $|h| \ll 1$. Đưa vào {{phương trình Einstein}} và chỉ giữ số hạng bậc nhất theo $h$; ở chân không, với cách chọn tọa độ thích hợp, ta được đúng phương trình sóng

$$ \Big(\frac{1}{c^2}\frac{\partial^2}{\partial t^2} - \nabla^2\Big) h = 0 . $$

Phương trình sóng này có tốc độ lan truyền là $c$, không có tham số nào để chỉnh. Einstein tìm ra điều này năm 1916, và năm 1918 ông có công thức cho lượng sóng một nguồn phát ra (công thức tứ cực, bước 4). Suốt mấy chục năm sau, giới vật lý còn tranh luận sóng có mang năng lượng thật hay chỉ là ảo ảnh của cách chọn tọa độ. Câu trả lời dứt khoát đến từ đo đạc: pulsar đôi (bước 8) và LIGO (bước 6).
+++`,
        vao: (c) => c.cauHinh({ he: 'gw150914', tocDo: 1, vong: false, ligo: false, luoi: 1, tau: 'dau', mayAnh: 'tong', tay: ['mayDo'], mayDo: 'dau' }),
        ra: (c) => c.tatTieng(),
        nut: { tren: (c) => c.goc('tren'), nghieng: (c) => c.goc('nghieng'), lai: (c) => c.cauHinh({ tau: 'dau' }) },
        thuThach: {
          de: 'Kéo máy dò lên thẳng phía trên hai lỗ đen, lệch trục quay của quỹ đạo dưới **10°**. Ở đó sóng mạnh nhất: biên độ kiểu «+» gấp đôi lúc máy dò nằm trong mặt phẳng quỹ đạo, vòng hạt méo theo kiểu quay tròn, tiếng to hơn.',
          kiem: (c) => c.lechTruc() < 10,
          giu: 0.5,
          goiY: 'Kéo đốm xanh lục lên cao theo đường chấm xanh. Ô số liệu ghi góc lệch của máy dò so với trục quay (đường tím).',
        },
      },
      {
        ten: 'Sóng đi qua: lực thủy triều đổi chiều',
        noiDung: R`
Máy quay đã bay tới chỗ máy dò. Phía trên nó là một **vòng hạt thử** rơi tự do, nằm trong mặt phẳng **vuông góc** với hướng sóng đi (mũi tên vàng). Sóng tới, vòng bị kéo dài theo phương ngang và ép lại theo phương dọc; nửa chu kỳ sau thì ngược lại.

Đây chính là hình ở Bài 12: vòng hạt rơi quanh Trái Đất bị lực thủy triều kéo dài theo phương thẳng đứng và ép theo phương ngang. Khác ở chỗ lực thủy triều của sóng **đổi chiều liên tục**. Mũi tên hồng là lực thủy triều lên từng hạt lúc này.

Độ mạnh của sóng đo bằng {{biến dạng h}}: hai hạt cách nhau $L$ thì khoảng cách đổi một lượng cỡ $\Delta L$, với

$$ h = \frac{\Delta L}{L}. $$

> [Ví dụ] Sóng của GW150914 khi tới Trái Đất có $h \approx 10^{-21}$. Hai hạt cách nhau 1 mét chỉ xê dịch $10^{-21}$ m, nhỏ hơn hạt nhân nguyên tử cả triệu lần.

Sóng là **sóng ngang**: dọc theo hướng sóng đi, khoảng cách không đổi.

> [Lưu ý] Vòng trên hình méo tới 15%, tức $h \approx 0{,}3$: đã **phóng đại khoảng $10^{20}$ lần** so với sóng thật.

> [Thử ngay] [[Dao động mẫu, chậm và đều|mau]] [[Cho vòng hạt theo sóng thật|that]] [[Ẩn hoặc hiện lực thủy triều|tt]]
> Rê chuột lên vòng hạt để xem nó đang dài ra bao nhiêu theo mỗi phương. Khi vòng theo sóng thật, bạn nghe chính tín hiệu ấy ở đúng tần số thật; vòng trên hình co giãn chậm hơn chừng 73 lần vì hình được chiếu chậm.

+++ Đi sâu: độ lệch của từng hạt và lực thủy triều
Đặt trục $x$ ngang, $y$ dọc trong mặt phẳng vòng, sóng đi theo $z$. Với sóng phân cực «+» biên độ $h_+(t)$, hạt ở vị trí $(x;\ y)$ lệch đi

$$ \delta x = \tfrac12 h_+ x, \qquad \delta y = -\tfrac12 h_+ y . $$

Đạo hàm hai lần theo thời gian ra gia tốc, tức lực thủy triều trên một đơn vị khối lượng:

$$ a_x = \tfrac12 \ddot h_+ x, \qquad a_y = -\tfrac12 \ddot h_+ y . $$

Với sóng hình sin, $\ddot h_+ = -\omega^2 h_+$: lực luôn kéo hạt về vòng tròn, như con lắc. Đó là lý do mũi tên hồng chỉ ngược với độ lệch.

Một chi tiết nối thẳng với Bài 12: kéo theo $x$ bao nhiêu thì ép theo $y$ bấy nhiêu, nên diện tích vòng không đổi (ở bậc nhất). Ở Bài 12, thể tích quả cầu hạt rơi tự do chỉ co lại theo $\rho + 3P/c^2$; trong chân không $\rho = P = 0$, độ cong chỉ còn phần **làm méo hình mà không đổi thể tích**. Sóng hấp dẫn là phần độ cong ấy, tách khỏi nguồn và bay đi.
+++`,
        vao: (c) => c.cauHinh({ he: 'gw150914', tocDo: 1, vong: true, ligo: false, lucTT: true, phanCuc: 'p', luoi: 0.35, mayAnh: 'tram', tay: [], mayDo: 'dau' }),
        ra: (c) => c.tatTieng(),
        nut: { mau: (c) => c.cauHinh({ phanCuc: 'p' }), that: (c) => c.cauHinh({ phanCuc: 'that', tau: 'dau' }), tt: (c) => c.datLucTT() },
      },
      {
        ten: 'Hai kiểu phân cực: «+» và «×»',
        noiDung: R`
Vòng hạt có thể bị kéo theo hai kiểu. Kiểu {{phân cực sóng hấp dẫn|«+»}}: kéo ngang, ép dọc, rồi ngược lại. Kiểu «×»: y hệt nhưng xoay đi **45°**, kéo theo một đường chéo và ép theo đường chéo kia. Mọi sóng hấp dẫn là tổng của hai kiểu này.

> [Thử ngay] [[Phân cực +|p]] [[Phân cực ×|x]] [[Cả hai lệch nhau một phần tư chu kỳ|tron]]
> Kéo đốm vàng trên vành để xoay cặp cánh tay đo (hai đoạn vàng vuông góc). Số «chênh lệch» trên hình là độ dài cánh này trừ cánh kia: đó chính là thứ một máy hình chữ L đo được.

Với nút thứ ba, vòng méo thành một hình elip **quay tròn**: đó là sóng {{phân cực tròn}}. Hai vật quay quanh nhau phát đúng loại sóng này theo hướng trục quay. Theo hướng nằm trong mặt phẳng quỹ đạo, sóng chỉ còn kiểu «+». Máy dò trong mô hình nằm trên mặt phẳng quỹ đạo, nên nó chỉ nhận kiểu «+».

So với ánh sáng: sóng điện từ cũng có hai phân cực, nhưng lệch nhau **90°**. Sóng hấp dẫn lệch 45° vì thứ nó làm thay đổi không phải một mũi tên (điện trường) mà là một cách kéo giãn: xoay vòng đi 90° thì kiểu «+» thành chính nó đổi dấu, xoay 180° thì trở lại y nguyên.

> [Lưu ý] Máy LIGO hình chữ L nhạy nhất với kiểu «+» khi hai cánh tay trùng hai phương kéo và ép. Với kiểu «×» thẳng hàng như vậy, độ dài hai cánh tay không đổi (biến dạng nằm theo hai đường chéo) nên máy không thấy gì; vì thế người ta cần nhiều máy đặt lệch hướng nhau.

+++ Đi sâu: vì sao hai phân cực lệch nhau 45°
Trong mặt phẳng vuông góc với hướng sóng, sóng là một ma trận đối xứng, tổng đường chéo bằng 0:

$$ h = \begin{pmatrix} h_+ & h_\times \\ h_\times & -h_+ \end{pmatrix}. $$

Ma trận như thế chỉ có hai số tự do: đó là hai phân cực. Xoay hệ trục một góc $\theta$, hai thành phần đổi theo

$$ h_+' = h_+\cos 2\theta + h_\times \sin 2\theta, $$

$$ h_\times' = -h_+\sin 2\theta + h_\times\cos 2\theta . $$

Góc xuất hiện dưới dạng $2\theta$: xoay $45°$ biến «+» thành «×», xoay $90°$ đổi dấu, xoay $180°$ về như cũ. Với sóng điện từ, điện trường là một vectơ và đổi theo $\theta$ chứ không phải $2\theta$, nên hai phân cực của nó lệch $90°$.
+++`,
        vao: (c) => c.cauHinh({ he: 'gw150914', tocDo: 1, vong: true, ligo: false, lucTT: false, phanCuc: 'x', luoi: 0.35, mayAnh: 'tram', tay: ['canh'], mayDo: 'dau', theta: 0 }),
        ra: (c) => c.tatTieng(),
        nut: { p: (c) => c.cauHinh({ phanCuc: 'p' }), x: (c) => c.cauHinh({ phanCuc: 'x' }), tron: (c) => c.cauHinh({ phanCuc: 'tron' }) },
        thuThach: {
          de: 'Với kiểu «×», cặp cánh tay nằm ngang và dọc không đo được gì. Xoay cặp cánh tay tới góc mà chênh lệch giữa hai cánh **lớn nhất** (sai không quá 4°). Góc ấy là bao nhiêu độ?',
          kiem: (c) => c.phanCuc() === 'x' && Math.abs(Math.sin(2 * c.theta())) >= 0.99,
          giu: 0.5,
          goiY: 'Kiểu «×» kéo và ép theo hai đường chéo của vòng (các vạch mờ chéo). Giữ chế độ «Mẫu «×»» trong bảng điều khiển.',
        },
      },
      {
        ten: 'Nguồn phải là tứ cực; quay một vòng, sóng hai nhịp',
        noiDung: R`
Nhìn từ trên xuống: gợn sóng có **hai cánh** xoắn ra ngoài. Hai vật quay được nửa vòng thì cả hệ trông y như cũ, giống một quả tạ quay. Vì thế mỗi vòng quỹ đạo phát ra **hai** chu kỳ sóng:

$$ f_\text{sóng} = 2 f_\text{quỹ đạo}. $$

Ô số liệu cho thấy điều này: số vòng mỗi giây luôn bằng nửa tần số sóng.

Vì sao không có kiểu sóng đơn giản hơn? Sóng điện từ phát ra từ {{lưỡng cực}}: điện tích dương và âm rung ngược nhau. Với hấp dẫn:

- **Đơn cực** là tổng khối lượng (tính cả năng lượng). Nó bảo toàn, không rung được.
- **Lưỡng cực** khối lượng bằng tổng khối lượng nhân vị trí khối tâm. Không có khối lượng âm để tách cực; muốn nó «rung», khối tâm phải tự gia tốc, tức tổng xung lượng thay đổi. Bảo toàn xung lượng cấm điều đó.
- **Tứ cực** mô tả *hình dạng* phân bố khối lượng (dẹt hay dài, dài theo hướng nào). Đây là bậc thấp nhất được phép rung. Quả tạ quay làm nó đổi liên tục.

> [Thử ngay] [[Chạy chậm lại|cham]] [[Dừng hình|dung]] [[Chạy bình thường|thuong]] [[Nhìn gần hai vật|gan]]
> Kéo đốm vàng trên thước để đặt khoảng cách hai vật; mô hình đứng yên trong lúc kéo. Rê chuột lên một lỗ đen để xem nó lao đi nhanh cỡ nào.

> [Con số] Trái Đất quay quanh Mặt Trời cũng phát sóng hấp dẫn: tần số hai chu kỳ mỗi năm, công suất chừng **200 W**, cỡ một bóng đèn. Muốn phát mạnh, cần khối lượng lớn quay rất nhanh ở rất gần nhau.

+++ Đi sâu: công thức tứ cực và vì sao sóng yếu đến thế
Einstein (1918) tìm ra: ở khoảng cách $r$, biên độ sóng tỉ lệ với đạo hàm bậc hai theo thời gian của tứ cực khối lượng $Q$,

$$ h \sim \frac{2G}{c^4}\,\frac{\ddot Q}{r}. $$

Hệ số $G/c^4 \approx 8 \times 10^{-45}$ (đơn vị SI) nhỏ khủng khiếp: không-thời gian rất «cứng». Với hai vật khối lượng $m_1$, $m_2$ quay tròn cách nhau $a$, công suất phát ra là

$$ P = \frac{32}{5}\,\frac{G^4}{c^5}\,\frac{(m_1 m_2)^2 (m_1 + m_2)}{a^5}. $$

Thay số Trái Đất ($6{,}0 \times 10^{24}$ kg), Mặt Trời ($2{,}0 \times 10^{30}$ kg), $a = 1{,}5 \times 10^{11}$ m: $P \approx 196$ W. Với cả hành trình 4,6 tỉ năm, Trái Đất mất vì sóng hấp dẫn một lượng năng lượng không đáng kể so với năng lượng quỹ đạo. Nhưng $P$ tỉ lệ với $1/a^5$: hai lỗ đen cách nhau vài trăm kilômét phát mạnh hơn hàng chục bậc độ lớn.
+++`,
        vao: (c) => c.cauHinh({ he: 'gw150914', tocDo: 0.4, vong: false, ligo: false, luoi: 1, tau: 'dau', mayAnh: 'tren', tay: ['thuoc'], mayDo: 'dau' }),
        ra: (c) => c.tatTieng(),
        nut: {
          cham: (c) => c.cauHinh({ tocDo: 0.25 }), dung: (c) => c.cauHinh({ tocDo: 0 }), thuong: (c) => c.cauHinh({ tocDo: 1 }),
          gan: (c) => c.goc('gan'),
        },
        thuThach: {
          de: 'Kéo thước cho tới khi hai lỗ đen quay đúng **25 vòng mỗi giây** (sai không quá 1 vòng), rồi giữ yên ở đó. Tần số sóng lúc ấy là bao nhiêu hertz?',
          kiem: (c) => c.daKeoThuoc() && c.dungYen() && Math.abs(c.fNguon() / 2 - 25) <= 1,
          giu: 0.5,
          goiY: 'Ô số liệu ghi «tần số sóng = 2 × số vòng quay mỗi giây». Đích nằm ở khoảng cách chừng 700 km. Giữ chuột yên nửa giây, hoặc thả ra rồi bấm «Dừng hình».',
        },
      },
      {
        ten: 'Mất năng lượng nên xoắn vào: tiếng «chirp»',
        noiDung: R`
Sóng mang năng lượng đi. Hai vật mất năng lượng thì tụt xuống quỹ đạo thấp hơn, mà quỹ đạo thấp thì **quay nhanh hơn** (định luật Kepler: $\omega^2 = GM/a^3$). Quay nhanh hơn lại phát mạnh hơn, nên tụt càng nhanh. Vòng lặp ấy chạy đà tới lúc hai vật chạm nhau.

Kết quả là tín hiệu tăng **cả tần số lẫn biên độ**, vút lên ở cuối: các nhà vật lý gọi là tiếng «chirp» (tiếng chim hót). Đồ thị dưới bảng điều khiển ghi đúng hình dạng đó. Tốc độ tăng tần số là

$$ \frac{\dd f}{\dd t} = \frac{96}{5}\,\pi^{8/3} \left(\frac{G\mathcal{M}}{c^3}\right)^{5/3} f^{11/3}, $$

$$ \mathcal{M} = \frac{(m_1 m_2)^{3/5}}{(m_1+m_2)^{1/5}} . $$

$f$ là tần số sóng, $\mathcal{M}$ là {{khối lượng chirp}}. Hai khối lượng chỉ xuất hiện qua đúng một tổ hợp ấy, nên **đo $f$ và $\dd f/\dd t$ là suy ra $\mathcal{M}$**.

> [Ví dụ] GW150914 ở 35 Hz có $\dd f/\dd t \approx 79$ Hz mỗi giây, ứng với $\mathcal{M} \approx 30$ M☉ (đo tại máy dò). Từ 35 Hz tới lúc sáp nhập chỉ còn khoảng 0,17 giây.

> [Thử ngay] Đổi cặp vật và nghe tiếng chirp bằng cả mắt lẫn tai. Sao neutron nhẹ hơn nên xoắn vào chậm hơn nhiều.
> [[GW150914 (lỗ đen)|ld]] [[GW170817 (sao neutron)|nt]] [[Hai lỗ đen 10 + 10 M☉|muoi]]
> Kéo hai đốm trên hai cột để đổi khối lượng từng vật (thang chia theo lô-ga). Mỗi lần đổi, mô hình chạy lại từ đầu.

> [Lưu ý] **Âm thanh là quy đổi, không phải tiếng trong không gian** (sóng hấp dẫn không phải sóng âm). Mỗi khung hình, tiếng có tần số bằng đúng tần số $f$ mà sóng thật có ở thời điểm tương ứng, độ to tỉ lệ $f^{2/3}$ như biên độ $h$. Mô hình chiếu chậm khoảng 73 lần (GW150914), nhưng cao độ **giữ nguyên** chứ không hạ 73 lần (35 Hz chia 73 chỉ còn 0,5 Hz, tai không nghe được): chỉ độ dài bị kéo ra. Nút «Nghe nhanh như thật» trong bảng điều khiển phát đúng 0,2 giây cuối, đúng cả cao độ lẫn nhịp. Loa máy tính nhỏ khó phát âm dưới 100 Hz; khi đó chọn «Nâng hai quãng tám» (tần số nhân 4).

+++ Đi sâu: suy ra công thức từ ba dòng
Năng lượng quỹ đạo tròn: $E = -\dfrac{G m_1 m_2}{2a}$. Định luật Kepler: $\omega^2 = \dfrac{GM}{a^3}$ với $M = m_1 + m_2$. Khử $a$:

$$ E = -\tfrac12 \,\mu\, (GM\omega)^{2/3}, \qquad \mu = \frac{m_1 m_2}{M}. $$

Viết công suất tứ cực ở bước 4 theo $\omega$: $P = \dfrac{32}{5}\dfrac{G}{c^5}\mu^2 a^4 \omega^6$. Để ý $\mu M^{2/3} = \mathcal{M}^{5/3}$, ta được

$$ E = -\tfrac12 (G\mathcal{M}\omega)^{2/3}\,\mathcal{M}, $$

$$ P = \frac{32}{5}\,\frac{(G\mathcal{M}\omega)^{10/3}}{G\,c^5}. $$

Cho $\dd E/\dd t = -P$:

$$ \frac{\dd \omega}{\dd t} = \frac{96}{5}\left(\frac{G\mathcal{M}}{c^3}\right)^{5/3} \omega^{11/3}. $$

Tần số sóng $f = 2 \times \dfrac{\omega}{2\pi} = \omega/\pi$; thay vào ra công thức ở trên. Giải phương trình này: gọi $\tau$ là thời gian còn lại tới lúc chạm nhau, thì $f \propto \tau^{-3/8}$. Thời gian còn lại giảm 256 lần thì tần số chỉ tăng 8 lần; vì thế tín hiệu dài lê thê ở tần số thấp rồi vọt lên rất nhanh ở cuối. Biên độ thì $h \propto \mathcal{M}^{5/3} f^{2/3}/d$.

Công thức chỉ đúng khi hai vật còn xa nhau. Vài vòng cuối và lúc nhập làm một phải giải phương trình Einstein bằng máy tính; mô hình ở đây giữ tần số không đổi trong đoạn cuối và cho lỗ đen mới rung tắt dần, chỉ để minh hoạ.
+++`,
        vao: (c) => c.cauHinh({ he: 'gw150914', tocDo: 1, vong: false, ligo: false, luoi: 1, tau: 'dau', mayAnh: 'khoiLuong', tay: ['cot'], mayDo: 'dau' }),
        ra: (c) => c.tatTieng(),
        nut: { ld: (c) => c.cauHinh({ he: 'gw150914' }), nt: (c) => c.cauHinh({ he: 'gw170817' }), muoi: (c) => c.cauHinh({ he: [10, 10] }) },
        thuThach: {
          de: 'Đổi khối lượng hai lỗ đen sao cho tiếng chirp lúc nhập lên tới **250 Hz** (sai không quá 10 Hz). Ô số liệu và thẻ trong bảng điều khiển ghi «tần số lúc nhập». Tổng khối lượng khi ấy là bao nhiêu?',
          kiem: (c) => Math.abs(c.fNhap() - 250) <= 10,
          giu: 0.5,
          goiY: 'Trong mô hình, tần số lúc nhập tỉ lệ nghịch với tổng khối lượng: lỗ đen nặng thì lớn, chạm nhau khi còn quay chậm. GW150914 (65 M☉) nhập ở khoảng 150 Hz.',
        },
      },
      {
        ten: 'GW150914: lần đầu nghe thấy',
        noiDung: R`
Ngày **14/9/2015**, hai máy LIGO ở Livingston và Hanford (Mỹ), cách nhau 3 000 km, cùng ghi được một tiếng chirp; máy Livingston nhận trước khoảng 7 mili giây, ít hơn thời gian ánh sáng đi giữa hai nơi (10 mili giây), đúng như sóng đi với tốc độ $c$.

| Đại lượng | Giá trị |
|---|---|
| Hai lỗ đen | 36 và 29 M☉ |
| Lỗ đen mới | 62 M☉ |
| Hoá thành sóng | khoảng 3 M☉, tức $5{,}4 \times 10^{47}$ J |
| Tần số | 35 → 150 Hz trong khoảng 0,2 s, chừng 8 chu kỳ |
| Công suất đỉnh | khoảng $3{,}6 \times 10^{49}$ W |
| Khoảng cách | khoảng 410 Mpc, chừng 1,3 tỉ năm ánh sáng |
| Biên độ đỉnh tại Trái Đất | $h \approx 10^{-21}$ |

Công suất đỉnh ứng với gần **200 khối lượng Mặt Trời mỗi giây**, gấp Mặt Trời cỡ $10^{23}$ lần. Lúc sóng 150 Hz, hai lỗ đen cách nhau chỉ chừng 340 km và lao quanh nhau với khoảng nửa tốc độ ánh sáng. Bước sóng lúc ấy $c/f \approx 2\,000$ km, dài gấp năm trăm lần cánh tay LIGO.

> [Thử ngay] [[Xem lại từ đầu|lai]] [[Tới gần lúc sáp nhập|cuoi]] [[Chiếu chậm hơn nữa|cham]] [[Nghe nhanh như thật|that]]
> Nút cuối cho mô hình chạy nhanh như thật: 0,2 giây cuối lướt qua trong chớp mắt, tiếng là một tiếng «vút» ngắn từ 35 Hz lên khoảng 150 Hz. Kéo thước khoảng cách để tua tới lui.

> [Hiểu sai thường gặp] «3 khối lượng Mặt Trời đã biến mất.» Không: chúng đổi thành **năng lượng của sóng**, $E = mc^2$, và năng lượng ấy bay đi khắp vũ trụ. Tổng năng lượng vẫn bảo toàn.

> [Lịch sử] Kết quả công bố ngày 11/2/2016 (Abbott và cộng sự, Phys. Rev. Lett. 116, 061102). Giải Nobel Vật lý 2017 trao cho Rainer Weiss, Barry Barish và Kip Thorne vì đóng góp quyết định cho LIGO và việc đo được sóng hấp dẫn.

+++ Đi sâu: các số trong bảng ăn khớp với nhau ra sao
- **Khối lượng chirp.** Với 36 và 29 M☉, $\mathcal{M} = (36 \cdot 29)^{3/5}/65^{1/5} \approx 28{,}1$ M☉. Sóng tới ta bị giãn bước sóng theo vũ trụ giãn nở ($z \approx 0{,}09$, xem Bài 18) nên máy dò đo được $\mathcal{M}$ lớn hơn chừng 9%, khoảng 30 M☉. Đó là con số dùng ở bước 5.
- **Thời gian.** Công thức tiếng chirp cho từ 35 Hz lên 150 Hz mất 0,16 giây và khoảng 8,5 chu kỳ sóng, khớp với tín hiệu đo được.
- **Năng lượng.** $3\ \text{M☉} \times c^2 = 3 \times 1{,}99 \times 10^{30} \times (3 \times 10^8)^2 \approx 5{,}4 \times 10^{47}$ J. Chia đều cho 0,2 giây được $2{,}7 \times 10^{48}$ W; công suất đỉnh lớn hơn chừng mười lần vì phần lớn năng lượng toả ra trong vài chu kỳ cuối.
- **Biên độ.** Công thức $h \propto \mathcal{M}^{5/3} f^{2/3}/d$ cho $h \approx 2{,}4 \times 10^{-21}$ ở 150 Hz nếu nhìn thẳng dọc trục quỹ đạo. Hệ thật nằm nghiêng và máy dò không quay thẳng về nguồn, nên đỉnh đo được nhỏ hơn: $1{,}0 \times 10^{-21}$.
+++`,
        vao: (c) => c.cauHinh({ he: 'gw150914', tocDo: 1, vong: false, ligo: false, luoi: 1, tau: 'dau', mayAnh: 'thuoc', tay: ['thuoc'], mayDo: 'dau' }),
        ra: (c) => c.tatTieng(),
        nut: { lai: (c) => c.cauHinh({ tau: 'dau', tocDo: 1 }), cuoi: (c) => c.cauHinh({ tau: 2.2, tocDo: 0.5 }), cham: (c) => c.cauHinh({ tocDo: 0.3 }), that: (c) => c.ngheNhuThat() },
        thuThach: {
          de: 'Kéo thước (hoặc dừng hình) để giữ mô hình đúng lúc sóng đạt **100 Hz** (sai không quá 4 Hz). Ô số liệu cho biết lúc ấy còn bao nhiêu mili giây tới lúc chạm nhau. So với 0,2 giây của cả tín hiệu thì sao?',
          kiem: (c) => c.dungYen() && Math.abs(c.fNguon() - 100) <= 4,
          giu: 0.6,
          goiY: 'Ở đoạn cuối, tần số tăng rất nhanh: kéo thật chậm khi hai lỗ đen đã gần nhau.',
        },
      },
      {
        ten: 'Giao thoa kế LIGO: đo nhỏ hơn proton',
        noiDung: R`
Trên máy dò giờ là một {{giao thoa kế}} kiểu LIGO. Tia laser (vàng) tới **bộ tách chùm**, chia làm hai, đi dọc hai **cánh tay** vuông góc, dội lại ở hai **gương cuối** rồi gặp nhau. Người ta chỉnh sao cho hai tia triệt tiêu nhau: cổng ra **tối**.

Khi sóng kiểu «+» đi qua, một cánh tay dài ra, cánh tay kia ngắn lại. Hai tia về lệch nhau, không còn triệt tiêu hẳn, và **có ánh sáng lọt ra** ở máy đo. Độ sáng ấy theo đúng nhịp của sóng.

> [Thử ngay] [[Cho giao thoa kế theo sóng thật|that]] [[Dao động mẫu chậm|mau]] [[Dừng hình|dung]]

Mỗi cánh tay LIGO dài **4 km**. Với $h = 10^{-21}$, chênh lệch giữa hai cánh tay là

$$ \Delta L = h L = 10^{-21} \times 4\,000\ \text{m} = 4 \times 10^{-18}\ \text{m}, $$

nhỏ hơn đường kính proton ($1{,}7 \times 10^{-15}$ m) khoảng **400 lần**.

Đo được vì: ánh sáng dội qua lại vài trăm lần trong mỗi cánh tay trước khi ra, nên lệch pha được cộng dồn; laser rất mạnh và ổn định; gương nặng hàng chục kilôgam treo trên hệ chống rung; và có hai máy cách xa nhau, chỉ tin tín hiệu cả hai cùng thấy.

> [Lưu ý] Hình phóng đại độ dài cánh tay khoảng $10^{20}$ lần. Độ sáng ở máy đo chỉ minh hoạ «tối khi yên, sáng lên khi có sóng», không phải độ sáng thật.

> [Hiểu sai thường gặp] «Sóng kéo giãn cả ánh sáng, nên dùng ánh sáng làm thước thì không đo được gì.» Ánh sáng đang bay trong cánh tay cũng bị kéo, nhưng laser liên tục bơm vào ánh sáng mới với tần số cố định. Thứ LIGO so sánh là **thời gian đi về** của ánh sáng ở hai cánh tay, và thời gian ấy thay đổi thật.`,
        vao: (c) => c.cauHinh({ he: 'gw150914', tocDo: 1, vong: false, ligo: true, phanCuc: 'that', luoi: 0.35, tau: 'dau', mayAnh: 'tram', tay: [], mayDo: 'dau' }),
        ra: (c) => c.tatTieng(),
        nut: { that: (c) => c.cauHinh({ phanCuc: 'that', tau: 'dau', tocDo: 1 }), mau: (c) => c.cauHinh({ phanCuc: 'p', tocDo: 1 }), dung: (c) => c.cauHinh({ tocDo: 0 }) },
      },
      {
        ten: 'Bằng chứng khác và những «tai nghe» mới',
        noiDung: R`
**Pulsar đôi Hulse–Taylor.** Năm 1974 Russell Hulse và Joseph Taylor tìm ra một pulsar quay quanh một sao neutron khác, chu kỳ quỹ đạo **7,75 giờ**. Pulsar là chiếc đồng hồ cực đều, nên quỹ đạo đo được rất chính xác. Theo dõi nhiều năm, chu kỳ ngắn dần khoảng **76 micro giây mỗi năm**, khớp với công thức tứ cực. Đó là bằng chứng gián tiếp đầu tiên rằng sóng hấp dẫn mang năng lượng đi (Nobel 1993).

**GW170817.** Ngày 17/8/2017, hai sao neutron ở cách 130 triệu năm ánh sáng sáp nhập. Khối lượng chirp nhỏ (khoảng 1,19 M☉) nên tiếng chirp kéo dài **khoảng 100 giây** trong dải nghe của LIGO. Rồi **1,7 giây** sau lúc sáp nhập, vệ tinh bắt được chớp tia gamma từ cùng hướng. Sau 130 triệu năm đường đi mà chỉ lệch 1,7 giây: tốc độ sóng hấp dẫn bằng $c$ tới cỡ $10^{-15}$. Kính thiên văn còn thấy vụ nổ kilonova, nơi sinh ra nhiều nguyên tố nặng như vàng và bạch kim.

> [Thử ngay] [[Chọn GW170817|nt]] [[Về GW150914|ld]]
> Nghe thử: hai sao neutron nhẹ nên tiếng chirp cao hơn hẳn, trên 800 Hz ngay từ đầu đoạn mô hình.

| Máy dò | Tần số nghe | Nguồn |
|---|---|---|
| LIGO, Virgo, KAGRA (mặt đất) | khoảng 10 Hz – vài nghìn Hz | lỗ đen và sao neutron nặng từ một tới vài chục M☉ |
| LISA (ba vệ tinh cách nhau 2,5 triệu km, dự kiến phóng giữa thập niên 2030) | phần nghìn hertz | lỗ đen siêu nặng sáp nhập |
| Mảng định thời pulsar | phần tỉ hertz (chu kỳ nhiều năm) | cặp lỗ đen siêu nặng ở tâm thiên hà |

Năm 2023, các mảng định thời pulsar công bố bằng chứng về một **nền sóng hấp dẫn** chu kỳ nhiều năm. Bài sau rời các vụ va chạm để nhìn cả vũ trụ: sóng của GW150914 đã bị giãn bước sóng trên đường tới ta, vì chính không gian đang giãn nở.

+++ Đi sâu: tính lại hai con số
**Pulsar đôi.** Với quỹ đạo elip, công thức tứ cực được Peters và Mathews mở rộng bằng một thừa số theo độ lệch tâm $e$. Thay khối lượng hai sao (1,44 và 1,39 M☉), $e = 0{,}617$ và chu kỳ 7,75 giờ, ta được chu kỳ ngắn đi $2{,}40 \times 10^{-12}$ giây mỗi giây, tức khoảng 76 micro giây mỗi năm.

**GW170817.** 130 triệu năm bằng $130 \times 10^6 \times 3{,}16 \times 10^{7} \approx 4{,}1 \times 10^{15}$ giây. Nếu toàn bộ 1,7 giây là do sóng hấp dẫn đi nhanh hoặc chậm hơn ánh sáng, chênh lệch tốc độ chỉ là $1{,}7 / 4{,}1 \times 10^{15} \approx 4 \times 10^{-16}$. Thật ra tia gamma có thể phát ra trễ hơn một chút sau lúc sáp nhập, nên các nhà khoa học nêu giới hạn thận trọng hơn, cỡ $10^{-15}$.
+++`,
        vao: (c) => c.cauHinh({ he: 'gw170817', tocDo: 1, vong: false, ligo: false, luoi: 1, tau: 'dau', mayAnh: 'tong', tay: ['mayDo'], mayDo: 'dau' }),
        ra: (c) => c.tatTieng(),
        nut: { nt: (c) => c.cauHinh({ he: 'gw170817' }), ld: (c) => c.cauHinh({ he: 'gw150914' }) },
      },
    ],
    congThuc: [
      { ten: 'Biên độ biến dạng', tex: R`h = \frac{\Delta L}{L}`, y: 'Khoảng cách $L$ đổi một lượng cỡ $\\Delta L$. Sóng tới Trái Đất có $h$ cỡ $10^{-21}$.' },
      { ten: 'Tần số sóng gấp đôi tần số quỹ đạo', tex: R`f_\text{sóng} = 2 f_\text{quỹ đạo}`, y: 'Hai vật quay nửa vòng thì hệ trông như cũ.' },
      { ten: 'Công suất tứ cực của hai vật quay tròn', tex: R`P = \frac{32}{5}\,\frac{G^4}{c^5}\,\frac{(m_1 m_2)^2 (m_1+m_2)}{a^5}`, y: 'Trái Đất quanh Mặt Trời: khoảng 200 W. Tỉ lệ với $1/a^5$ nên chỉ đáng kể khi hai vật đặc và rất gần nhau.' },
      { ten: 'Khối lượng chirp', tex: R`\mathcal{M} = \frac{(m_1 m_2)^{3/5}}{(m_1+m_2)^{1/5}}`, y: '36 và 29 M☉ cho $\\mathcal{M} \\approx 28{,}1$ M☉.' },
      { ten: 'Tốc độ tăng tần số («chirp»)', tex: R`\frac{\dd f}{\dd t} = \frac{96}{5}\,\pi^{8/3}\left(\frac{G\mathcal{M}}{c^3}\right)^{5/3} f^{11/3}`, y: 'Đo $f$ và $\\dd f/\\dd t$ là suy ra khối lượng chirp.' },
    ],
    cauHoi: [
      {
        hoi: 'Một sóng hấp dẫn phân cực «+» đi theo trục $z$ qua một vòng hạt nằm trong mặt phẳng $xy$. Đúng lúc vòng dài nhất theo $x$, thì theo $y$ nó thế nào?',
        chon: ['Cũng dài nhất', 'Ngắn nhất', 'Không đổi', 'Không đổi theo $y$ nhưng dài ra theo $z$'],
        dung: 1,
        giai: 'Kiểu «+» kéo theo một phương thì ép theo phương vuông góc cùng lúc, nên diện tích vòng không đổi. Theo $z$ (hướng sóng đi) không có gì thay đổi: sóng hấp dẫn là sóng ngang.',
      },
      {
        hoi: 'Hai sao neutron quay quanh nhau 100 vòng mỗi giây. Sóng hấp dẫn chúng phát ra có tần số bao nhiêu?',
        chon: ['50 Hz', '100 Hz', '200 Hz', '400 Hz'],
        dung: 2,
        giai: 'Hệ hai vật quay nửa vòng đã trông như cũ, nên mỗi vòng cho hai chu kỳ sóng: $f_\\text{sóng} = 2 \\times 100 = 200$ Hz.',
      },
      {
        hoi: 'Vì sao không có bức xạ hấp dẫn kiểu lưỡng cực, như sóng điện từ phát từ một ăng-ten?',
        chon: ['Vì hằng số $G$ quá nhỏ', 'Vì lưỡng cực khối lượng chỉ phụ thuộc vị trí khối tâm, mà bảo toàn xung lượng không cho khối tâm tự gia tốc', 'Vì sóng hấp dẫn đi chậm hơn ánh sáng', 'Vì mọi vật trong vũ trụ đều quay'],
        dung: 1,
        giai: 'Không có khối lượng âm, nên lưỡng cực khối lượng chỉ là tổng khối lượng nhân vị trí khối tâm. Đạo hàm hai lần của nó là tốc độ đổi của tổng xung lượng, luôn bằng 0. $G$ nhỏ làm sóng yếu, nhưng không cấm kiểu lưỡng cực.',
      },
      {
        hoi: 'Sóng có $h = 10^{-21}$ đi qua một cánh tay dài 4 km. Độ dài thay đổi cỡ bao nhiêu?',
        chon: ['$4 \\times 10^{-24}$ m', '$4 \\times 10^{-21}$ m', '$4 \\times 10^{-18}$ m', '$4 \\times 10^{-15}$ m'],
        dung: 2,
        giai: '$\\Delta L = hL = 10^{-21} \\times 4 \\times 10^{3}$ m $= 4 \\times 10^{-18}$ m. Lỗi hay gặp là quên đổi 4 km ra 4 000 m.',
      },
      {
        hoi: 'Một vụ sáp nhập y hệt GW150914 nhưng ở xa gấp đôi. Biên độ $h$ tới Trái Đất thay đổi thế nào?',
        chon: ['Còn một nửa', 'Còn một phần tư', 'Không đổi', 'Còn một phần tám'],
        dung: 0,
        giai: 'Biên độ giảm theo $1/d$; năng lượng (tỉ lệ với $h^2$) mới giảm theo $1/d^2$. Vì thế máy dò nhạy gấp đôi sẽ nghe xa gấp đôi, tức quét được thể tích gấp tám.',
      },
      {
        hoi: 'Giải thích bằng lời vì sao tín hiệu của hai lỗ đen xoắn vào nhau càng về cuối càng cao và càng to, chứ không giữ đều.',
        dap: 'Sóng mang năng lượng đi nên hai lỗ đen tụt xuống quỹ đạo thấp hơn. Quỹ đạo thấp hơn thì quay nhanh hơn (Kepler), nên tần số sóng (gấp đôi tần số quay) tăng lên. Quay nhanh hơn và gần nhau hơn thì phát mạnh hơn nhiều (công suất tỉ lệ $1/a^5$), nên mất năng lượng còn nhanh hơn nữa. Vòng lặp chạy đà: tần số và biên độ cùng vọt lên tới lúc hai lỗ đen chạm nhau.',
      },
    ],
    docThem: [
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 16: sóng hấp dẫn, công thức tứ cực, pulsar đôi, giao thoa kế.',
      'B. Schutz, *A First Course in General Relativity* (bản 2, 2009): chương về bức xạ hấp dẫn, có cách đo bằng giao thoa kế.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): lịch sử ý tưởng sóng hấp dẫn và những ngày đầu của LIGO, kể bởi một trong những người lập ra nó.',
      'Abbott và cộng sự (LIGO) 2016, Phys. Rev. Lett. 116, 061102: bài báo công bố GW150914.',
    ],
    thuatNgu: [
      { vi: 'biến dạng h', en: 'strain', nghia: 'Độ mạnh của sóng hấp dẫn: tỉ số $\\Delta L / L$ giữa độ thay đổi khoảng cách và khoảng cách. Sóng tới Trái Đất có $h$ cỡ $10^{-21}$.' },
      { vi: 'phân cực sóng hấp dẫn', en: 'polarization (+, ×)', nghia: 'Hai kiểu biến dạng độc lập của sóng hấp dẫn: «+» kéo ngang ép dọc, «×» giống thế nhưng xoay 45°.' },
      { vi: 'phân cực tròn', en: 'circular polarization', nghia: 'Tổng hai phân cực bằng nhau lệch một phần tư chu kỳ: vòng hạt méo thành elip quay tròn. Hai vật quay quanh nhau phát kiểu này theo hướng trục quay.' },
      { vi: 'lưỡng cực', en: 'dipole', nghia: 'Phân bố có hai cực ngược dấu, như điện tích dương và âm. Sóng điện từ chủ yếu phát từ lưỡng cực rung; sóng hấp dẫn thì không có kiểu này.' },
      { vi: 'bức xạ tứ cực', en: 'quadrupole radiation', nghia: 'Sóng phát ra do hình dạng phân bố khối lượng (tứ cực) thay đổi theo thời gian. Đây là kiểu bức xạ hấp dẫn bậc thấp nhất.' },
      { vi: 'khối lượng chirp', en: 'chirp mass', nghia: 'Tổ hợp $(m_1 m_2)^{3/5}/(m_1+m_2)^{1/5}$ quyết định tần số của hai vật xoắn vào nhau tăng nhanh tới đâu. Đo được trực tiếp từ tín hiệu.' },
      { vi: 'giao thoa kế', en: 'interferometer', nghia: 'Dụng cụ chia một tia sáng làm hai, cho đi hai đường rồi gộp lại; chênh lệch rất nhỏ giữa hai đường làm đổi độ sáng ở lối ra.' },
    ],
  },

  conSo: [
    '**10⁻²¹**: biên độ đỉnh của GW150914 tại Trái Đất. Cánh tay 4 km của LIGO đổi khoảng 4 × 10⁻¹⁸ m, nhỏ hơn đường kính proton chừng 400 lần.',
    '**0,2 giây**: tiếng chirp của GW150914 đi từ 35 Hz lên 150 Hz, khoảng 8 chu kỳ.',
    '**3 M☉**: khối lượng hoá thành năng lượng sóng (5,4 × 10⁴⁷ J). Công suất đỉnh khoảng 3,6 × 10⁴⁹ W, gần 200 khối lượng Mặt Trời mỗi giây.',
    '**200 W**: công suất sóng hấp dẫn của Trái Đất quay quanh Mặt Trời.',
    '**76 micro giây mỗi năm**: chu kỳ quỹ đạo của pulsar đôi Hulse–Taylor ngắn đi đúng như tiên đoán.',
    '**1,7 giây** sau 130 triệu năm đường đi: tia gamma tới sau sóng hấp dẫn của GW170817.',
  ],
  hieuDung: '**Tấm lưới chỉ là cách vẽ.** Sóng hấp dẫn không làm không gian «nhô lên» theo chiều nào; nó làm khoảng cách giãn và co theo các phương **vuông góc** với hướng sóng đi, như vòng hạt thử ở trạm đo. Độ cao của lưới chỉ cho biết sóng mạnh hay yếu. Vòng hạt và giao thoa kế được phóng đại khoảng 10²⁰ lần; hai vật được vẽ to hơn thật so với bước sóng; mọi thứ được chiếu chậm.',
  nguon: 'GW150914: Abbott và cộng sự (LIGO và Virgo) 2016, Phys. Rev. Lett. 116, 061102 (khối lượng, năng lượng, công suất đỉnh, khoảng cách, biên độ, tần số, độ trễ giữa hai máy). GW170817: LIGO và Virgo 2017, cùng các đài quan sát tia gamma (khối lượng, khoảng cách, độ trễ 1,7 giây). Pulsar đôi và công thức tứ cực: Hartle (2003) ch. 16. Hằng số: CODATA 2018, IAU 2015. Các con số tính lại trong kiem-tra/kiem-song-va-gian-no.mjs.',
  mayAnh: { viTri: [0, 30, 50], dich: [0, -1, 0], fov: 42, min: 8, max: 200, gocMax: Math.PI * 0.62, hep: 0.55 },

  tao(app) {
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 2200, hat: 41, doSang: 0.45 }));
    // đèn cho các vật có chất liệu (máy dò, gương, hạt thử)
    const denChinh = new THREE.DirectionalLight(0xfff0e0, 2.4); denChinh.position.set(18, 30, 26);
    const denVien = new THREE.DirectionalLight(0x7fa8ff, 1.5); denVien.position.set(-24, 12, -30);
    scene.add(denChinh, denVien, new THREE.AmbientLight(0x404858, 0.5));
    const tt = app.tt, am = app.am;

    // ----- Mặt không-thời gian -----
    const U = {
      uTau: { value: T0 }, uAv: { value: AV }, uOmMax: { value: 6 }, uTauM: { value: 0.3 }, uPhaM: { value: 0 }, uPha0: { value: 0 },
      uC: { value: C_HINH }, uCao: { value: 1.35 }, uMo: { value: 1 }, uChop: { value: 0 }, uMat: { value: 0 },
      uDen: { value: new THREE.Vector3(-0.3, 0.62, -0.72).normalize() },
    };
    const matTam = new THREE.ShaderMaterial({
      uniforms: U,
      vertexShader: /* glsl */ `
        ${GLSL_SONG}
        varying float vSong; varying float vR; varying vec3 vN; varying vec3 vW;
        void main() {
          vec3 p = position;
          float s = songTai(p.xz);
          float e = 0.05 + 0.006 * length(p.xz);
          float sx = songTai(p.xz + vec2(e, 0.0)), sz = songTai(p.xz + vec2(0.0, e));
          p.y += uCao * s;
          vN = normalize(vec3(-(sx - s) * uCao / e, 1.0, -(sz - s) * uCao / e));
          vSong = s; vR = length(p.xz);
          vec4 w = modelMatrix * vec4(p, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uMo, uChop, uMat, uTau, uC;
        uniform vec3 uDen;
        varying float vSong; varying float vR; varying vec3 vN; varying vec3 vW;
        float net(vec2 g, float day) {
          vec2 w = max(fwidth(g), vec2(1e-5));
          vec2 a = abs(fract(g - 0.5) - 0.5) / w;
          float n = 1.0 - smoothstep(day - 0.5, day + 0.5, min(a.x, a.y));
          return n * (1.0 - smoothstep(0.16, 0.45, max(w.x, w.y)));      // ô nhỏ hơn vài điểm ảnh thì lưới tan dần
        }
        void main() {
          vec3 N = normalize(vN);
          vec3 V = normalize(cameraPosition - vW);
          if (dot(N, V) < 0.0) N = -N;
          float ndv = clamp(dot(N, V), 0.0, 1.0);
          float fres = pow(1.0 - ndv, 3.0);
          float k = clamp(abs(vSong) * 1.35, 0.0, 1.0);
          vec3 am = vSong > 0.0 ? vec3(1.0, 0.64, 0.25) : vec3(0.26, 0.56, 1.0);
          float luoi = net(vW.xz / 1.2, 0.55) * 0.3 + net(vW.xz / 6.0, 0.85) * 0.32;
          float diff = max(dot(N, uDen), 0.0);
          vec3 H = normalize(uDen + V);
          float spec = pow(max(dot(N, H), 0.0), 140.0);
          float bong = pow(max(dot(N, H), 0.0), 18.0);
          vec3 c = vec3(0.006, 0.011, 0.026) * (0.6 + diff);
          c += am * (0.012 + 0.32 * k * k + 0.22 * k * k * k * k);           // màu sóng: đỉnh vàng, đáy xanh; sáng nhất ở sống sóng
          c += mix(vec3(0.09, 0.13, 0.25), am * 0.85, k) * luoi;
          c += vec3(0.25, 0.4, 0.8) * fres * 0.24;                          // viền sáng theo góc nhìn
          c += vec3(1.0, 0.94, 0.84) * (spec * (0.2 + 0.45 * k) + bong * 0.012);
          // lỗ đen hắt ánh vòng photon xuống mặt tấm (nhẹ, chỉ cho có chiều sâu)
          c += vec3(1.0, 0.75, 0.45) * 0.05 * exp(-vR * vR / 18.0) * uMat;
          // chớp sáng lúc nhập: mặt sóng phát ra đúng lúc chạm nhau, lan đi với tốc độ c
          float tSau = -uTau;
          float mat = exp(-pow((vR - uC * tSau) / 1.4, 2.0)) * uChop * step(0.0, tSau);
          c += vec3(1.0, 0.86, 0.62) * mat * 1.6;
          float mep = 1.0 - smoothstep(${(NUA * 0.7).toFixed(1)}, ${NUA.toFixed(1)}, vR);
          float a = clamp(0.38 + 0.3 * k + 0.3 * fres + spec * 0.2 + mat * 0.3, 0.0, 1.0) * mep * uMo;
          gl_FragColor = vec4(c * mep * uMo, a);
        }`,
      transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
    });
    matTam.tuyenTinh = true;
    const tam = new THREE.Mesh(taoTam(), matTam);
    tam.frustumCulled = false;
    tam.renderOrder = -2;
    scene.add(tam);

    // mũi tên «lan ra với tốc độ ánh sáng» trên tấm
    const nhomLan = new THREE.Group();
    nhomLan.add(muiTen([0, 3.2, -13], [0, 3.2, -24], { mau: 0xf3c66f, rong: 2, dau: 1.1, doMo: 0.85 }));
    const nhanLan = taoNhan(chuCanh("canh.lan-ra-voi-toc-do-anh-sang-gon", "lan ra với tốc độ ánh sáng<small>gợn ở xa phát ra từ lúc còn quay chậm</small>"), 'vang tran');
    nhanLan.position.set(0.8, 3.6, -21);
    nhomLan.add(nhanLan);
    scene.add(nhomLan);

    // ----- Hai vật: lỗ đen (vòng photon) hoặc sao neutron (quả cầu nóng) -----
    const taoVat = (mauSao) => {
      const ld = taoLoDenNho({ banKinh: 1, dia: false, doSang: 0.95 });
      const g = new THREE.Group();
      g.add(ld.nhom);
      const sao = new THREE.Group();
      const loi = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(mauSao).multiplyScalar(1.05) }));
      sao.add(loi, taoDom(new THREE.Color(mauSao).multiplyScalar(0.7), 3, { doMo: 0.45 }));
      g.add(sao);
      g.ld = ld; g.sao = sao;
      g.laSao = (b) => { ld.nhom.visible = !b; sao.visible = b; };
      g.laSao(false);
      return g;
    };
    const vat1 = taoVat(0xcfe6ff), vat2 = taoVat(0xcfe6ff), vatCuoi = taoVat(0xffb070);
    const nhan1 = taoNhan('', 'dam'), nhan2 = taoNhan('', 'dam'), nhanCuoi = taoNhan('', 'vang dam');
    const vet1 = new DuongDay(160, { mau: 0xffc98a, rong: 2, moDan: true, quang: 0.1, sang: 1.5 });
    const vet2 = new DuongDay(160, { mau: 0x9fd4ff, rong: 2, moDan: true, quang: 0.1, sang: 1.5 });
    // chớp sáng lúc nhập
    const chop = taoDom(new THREE.Color(0xfff0d8).multiplyScalar(5), 1, { doMo: 0 });
    const chopRong = taoDom(new THREE.Color(0xffc890).multiplyScalar(1.6), 1, { doMo: 0 });
    chop.position.set(0, Y_VAT, 0); chopRong.position.set(0, Y_VAT, 0);
    scene.add(vat1, vat2, vatCuoi, nhan1, nhan2, nhanCuoi, vet1.line, vet2.line, chop, chopRong);

    // ----- Máy dò hình chữ L, đặt được ở mọi hướng quanh nguồn -----
    // Nhóm của máy dò: trục X cục bộ hướng ra xa nguồn (hướng sóng đi), Z là phương «ngang» (song song mặt phẳng
    // quỹ đạo), Y là phương «dọc» (chiều tăng góc nâng). Ở vị trí mặc định, nhóm trùng hướng với trạm đo.
    const huongMD = new THREE.Vector3(Math.cos(PHI0), 0, Math.sin(PHI0));
    const mayDo = new THREE.Group();
    const matKL = new THREE.MeshStandardMaterial({ color: 0xc9d3e2, metalness: 0.85, roughness: 0.32 });
    const matToi = new THREE.MeshStandardMaterial({ color: 0x252b38, metalness: 0.6, roughness: 0.5 });
    const L_MD = 2.7;
    const tayNgang = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, L_MD), matKL); tayNgang.position.set(0, 0, L_MD / 2);
    const tayDoc = new THREE.Mesh(new THREE.BoxGeometry(0.16, L_MD, 0.16), matKL); tayDoc.position.set(0, L_MD / 2, 0);
    const nhaGiua = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), matToi);
    const dau1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 20), matToi); dau1.rotation.x = Math.PI / 2; dau1.position.set(0, 0, L_MD);
    const dau2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 20), matToi); dau2.position.set(0, L_MD, 0);
    const denMD = taoDom(new THREE.Color(0x8fe3a8).multiplyScalar(1.6), 1.1);
    const tiaMD1 = new DuongDay(2, { mau: 0xf3c66f, rong: 1.6, sang: 1.8 }); tiaMD1.dat(0, 0.12, 0, 0); tiaMD1.dat(1, 0.12, 0, L_MD); tiaMD1.xong(2);
    const tiaMD2 = new DuongDay(2, { mau: 0xf3c66f, rong: 1.6, sang: 1.8 }); tiaMD2.dat(0, 0.12, 0, 0); tiaMD2.dat(1, 0.12, L_MD, 0); tiaMD2.xong(2);
    mayDo.add(tayNgang, tayDoc, nhaGiua, dau1, dau2, denMD, tiaMD1.line, tiaMD2.line);
    // vòng hạt thử nhỏ ở máy dò (phóng đại mạnh hơn trạm đo để nhìn rõ từ xa)
    const R_NHO = 1.9, N_NHO = 18;
    const vongNho = new THREE.Group();
    const vienNho = new DuongDay(65, { mau: 0x8fe3a8, rong: 2, quang: 0.12, sang: 1.4 });
    const hatNho = Array.from({ length: N_NHO }, () => { const s = taoDom(new THREE.Color(0xc9ffd9).multiplyScalar(1.5), 0.36); vongNho.add(s); return s; });
    vongNho.add(vienNho.line);
    mayDo.add(vongNho);
    const nhanMayDo = taoNhan('', 'mo');
    mayDo.scale.setScalar(1.45);
    scene.add(mayDo, nhanMayDo);
    // trục quay của quỹ đạo và cung kinh tuyến chỉ đường kéo máy dò
    const nhomHuongMD = new THREE.Group();
    const trucQuay = new DuongDay(2, { mau: 0xc8aaff, rong: 1.6, doMo: 0.75, sang: 1.3 });
    trucQuay.dat(0, 0, Y_VAT + 1.5, 0); trucQuay.dat(1, 0, 17, 0); trucQuay.xong(2);
    const nhanTruc = taoNhan(chuCanh("canh.truc-quay-cua-quy-dao-doc-truc-song", "trục quay của quỹ đạo<small>dọc trục: sóng mạnh gấp đôi, phân cực tròn</small>"), 'tran');
    nhanTruc.position.set(0.6, 17.4, 0);
    const cung = new DuongDay(49, { mau: 0x8fe3a8, rong: 1.2, doMo: 0.45, net: [0.6, 0.5] });
    nhomHuongMD.add(trucQuay.line, nhanTruc, cung.line);
    scene.add(nhomHuongMD);

    // bảng tín hiệu nổi phía trên máy dò, luôn quay mặt về máy quay
    const bangTH = new THREE.Group();
    const RONG_TH = 11, CAO_TH = 1.7, N_TH = 260;
    const vachTH = new DuongDong(5, { mau: 0x8fe3a8, doMo: 0.16 });
    vachTH.dat(0, -RONG_TH / 2, -CAO_TH - 0.5, 0); vachTH.dat(1, RONG_TH / 2, -CAO_TH - 0.5, 0); vachTH.dat(2, RONG_TH / 2, CAO_TH + 0.5, 0);
    vachTH.dat(3, -RONG_TH / 2, CAO_TH + 0.5, 0); vachTH.dat(4, -RONG_TH / 2, -CAO_TH - 0.5, 0); vachTH.xong(5);
    const truc0TH = new DuongDong(2, { mau: 0xffffff, doMo: 0.12 });
    truc0TH.dat(0, -RONG_TH / 2, 0, 0); truc0TH.dat(1, RONG_TH / 2, 0, 0); truc0TH.xong(2);
    const duongTH = new DuongDay(N_TH, { mau: 0x8fe3a8, rong: 2.2, moDan: true, quang: 0.16, sang: 1.9 });
    const dauTH = taoDom(new THREE.Color(0xd8ffe4).multiplyScalar(3), 0.7);
    const nhanTH = taoNhan('', 'mo tran');
    nhanTH.position.set(-RONG_TH / 2, CAO_TH + 1.2, 0);
    bangTH.add(vachTH.line, truc0TH.line, duongTH.line, dauTH, nhanTH);
    scene.add(bangTH);

    // =====================================================================
    // Trạm đo tại máy dò. Tọa độ trong nhóm: X dọc hướng sóng, Z là phương «ngang», Y là phương «dọc».
    // =====================================================================
    const tram = new THREE.Group();
    tram.position.set(...quay([R_MAY_DO, Y_TRAM, 0]));
    tram.rotation.y = -PHI0;
    scene.add(tram);
    // mũi tên hướng sóng đi và cột nối xuống máy dò
    const nhomHuong = new THREE.Group();
    const Y_MT = -R_VONG - 1.4, Z_MT = 6;
    nhomHuong.add(muiTen([-9, Y_MT, Z_MT], [3, Y_MT, Z_MT], { mau: 0xf3c66f, rong: 2.2, dau: 0.6, doMo: 0.9 }));
    const nhanHuong = taoNhan(chuCanh("canh.huong-song-di-tu-hai-lo-den-toi", "hướng sóng đi<small>từ hai lỗ đen tới, tốc độ c</small>"), 'vang tran');
    nhanHuong.position.set(-8, Y_MT + 0.8, Z_MT);
    nhomHuong.add(nhanHuong);
    const cot = new DuongDong(2, { mau: 0x8fe3a8, doMo: 0.35 });
    cot.dat(0, 0, 0.6 - Y_TRAM, 0); cot.dat(1, 0, -R_VONG - 0.9, 0); cot.xong(2);
    nhomHuong.add(cot.line);
    tram.add(nhomHuong);

    // vòng hạt thử: tấm kính mỏng (mặt phẳng vuông góc với hướng sóng), vòng gốc, hạt có khối, mũi tên lực
    const nhomVong = new THREE.Group();
    tram.add(nhomVong);
    const matKinh = new THREE.ShaderMaterial({
      uniforms: { uR: { value: R_VONG * 1.45 } },
      vertexShader: /* glsl */ `
        varying vec2 vP; varying vec3 vN; varying vec3 vW;
        void main() {
          vP = position.xy; vN = normalize(mat3(modelMatrix) * normal);
          vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uR;
        varying vec2 vP; varying vec3 vN; varying vec3 vW;
        void main() {
          float r = length(vP) / uR;
          if (r > 1.0) discard;
          vec3 V = normalize(cameraPosition - vW);
          float fres = pow(1.0 - abs(dot(normalize(vN), V)), 2.5);
          vec2 g = vP / 0.6;
          vec2 w = max(fwidth(g), vec2(1e-5));
          vec2 a = abs(fract(g - 0.5) - 0.5) / w;
          float luoi = (1.0 - min(min(a.x, a.y), 1.0)) * (1.0 - smoothstep(0.2, 0.5, max(w.x, w.y)));
          float vien = smoothstep(0.965, 0.99, r) * (1.0 - smoothstep(0.99, 1.0, r));
          float mo = 1.0 - smoothstep(0.55, 1.0, r);
          vec3 c = vec3(0.04, 0.09, 0.075) * mo + vec3(0.5, 0.95, 0.7) * (luoi * 0.12 * mo + vien * 0.32 + fres * 0.2 * mo);
          gl_FragColor = vec4(c, 0.26 * mo + vien * 0.25);
        }`,
      transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
    });
    matKinh.tuyenTinh = true;
    const kinh = new THREE.Mesh(new THREE.CircleGeometry(R_VONG * 1.45, 96), matKinh);
    kinh.rotation.y = Math.PI / 2;                    // từ mặt XY sang mặt YZ
    kinh.renderOrder = -1;
    nhomVong.add(kinh);
    const vongGoc = duongTron(R_VONG, { mau: 0xffffff, doMo: 0.28, net: true });
    vongGoc.rotation.z = Math.PI / 2;                 // đưa đường tròn từ mặt XZ sang mặt YZ
    nhomVong.add(vongGoc);
    for (let k = 0; k < 4; k++) {                     // bốn phương: ngang, dọc, hai đường chéo
      const a = (k * Math.PI) / 4, r = R_VONG * 1.42;
      const l = new DuongDong(2, { mau: 0xffffff, doMo: k % 2 ? 0.08 : 0.16 });
      l.dat(0, 0, -r * Math.sin(a), -r * Math.cos(a)); l.dat(1, 0, r * Math.sin(a), r * Math.cos(a)); l.xong(2);
      nhomVong.add(l.line);
    }
    const vien = new DuongDay(N_VIEN, { mau: 0x8fe3a8, rong: 2.6, quang: 0.14, sang: 1.5 });
    nhomVong.add(vien.line);
    const matHat = new THREE.MeshStandardMaterial({ color: 0xb8f5cc, metalness: 0.55, roughness: 0.28, emissive: 0x2a8a50, emissiveIntensity: 0.9 });
    const geoHat = new THREE.SphereGeometry(0.17, 20, 12);
    const hat = Array.from({ length: SO_HAT }, () => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(geoHat, matHat), taoDom(new THREE.Color(0x9fffc0).multiplyScalar(1.2), 0.9, { doMo: 0.8 }));
      nhomVong.add(g);
      return g;
    });
    const dsMT = Array.from({ length: SO_MT }, () => {
      const l = new DuongDay(2, { mau: 0xff7aa8, rong: 2.4, sang: 1.3 });
      const dau = taoDom(new THREE.Color(0xff7aa8).multiplyScalar(1.4), 0.45);
      nhomVong.add(l.line, dau);
      return { l, dau };
    });
    const nhanVong = taoNhan(chuCanh("canh.vong-hat-thu-roi-tu-do-nam-vuong", "Vòng hạt thử rơi tự do<small>nằm vuông góc với hướng sóng</small>"), 'dam');
    nhanVong.position.set(0, R_VONG * 1.42 + 0.6, 0);
    const nhanNgang = taoNhan('ngang', 'mo tran'), nhanDoc = taoNhan(chuCanh("canh.doc", "dọc"), 'mo tran');
    nhanNgang.position.set(0, 0.3, -R_VONG * 1.42 - 0.2); nhanDoc.position.set(0, R_VONG * 1.42 - 0.4, 0.3);
    const nhanTT = taoNhan(chuCanh("canh.mui-ten-hong-luc-thuy-trieu", "mũi tên hồng: lực thủy triều"), 'hong tran');
    nhanTT.position.set(0, -R_VONG * 1.25, -R_VONG * 0.9);
    nhomVong.add(nhanVong, nhanNgang, nhanDoc, nhanTT);
    // cặp cánh tay đo xoay được (bước 3): hai cánh vuông góc, góc θ tính từ phương ngang
    const nhomCanh = new THREE.Group();
    const canhA = new DuongDay(2, { mau: 0xf3c66f, rong: 2.6, quang: 0.14, sang: 1.7 });
    const canhB = new DuongDay(2, { mau: 0xf3c66f, rong: 2.6, quang: 0.14, sang: 1.7 });
    const dauA = taoDom(new THREE.Color(0xffe2a8).multiplyScalar(2.2), 0.6), dauB = taoDom(new THREE.Color(0xffe2a8).multiplyScalar(2.2), 0.6);
    const nhanCanh = taoNhan('', 'vang');
    nhomCanh.add(canhA.line, canhB.line, dauA, dauB, nhanCanh);
    nhomVong.add(nhomCanh);

    // giao thoa kế kiểu LIGO: bộ tách chùm ở góc, hai cánh tay theo phương ngang (+Z) và dọc (+Y)
    const nhomLigo = new THREE.Group();
    tram.add(nhomLigo);
    const BS = [0, -2.8, -2.8];
    const matGuong = new THREE.MeshStandardMaterial({ color: 0xdfe8fa, metalness: 0.35, roughness: 0.18, emissive: 0x30405c, emissiveIntensity: 0.8 });
    const matKinhBS = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.55, emissive: 0x1a4060, emissiveIntensity: 0.6 });
    const tachChum = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 1.1), matKinhBS);
    tachChum.position.set(...BS); tachChum.rotation.x = Math.PI / 4;
    const geoGuong = new THREE.CylinderGeometry(0.62, 0.62, 0.22, 40);
    const guong1 = new THREE.Mesh(geoGuong, matGuong); guong1.rotation.x = Math.PI / 2;      // cuối cánh ngang, mặt hướng Z
    const guong2 = new THREE.Mesh(geoGuong, matGuong);                                      // cuối cánh dọc, mặt hướng Y
    const moc1 = taoDom(0xffffff, 0.35, { doMo: 0.5 }), moc2 = taoDom(0xffffff, 0.35, { doMo: 0.5 });
    moc1.position.set(0, BS[1], BS[2] + L_TAY); moc2.position.set(0, BS[1] + L_TAY, BS[2]);
    const laser = new THREE.Group();
    laser.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.66, 1.3), matToi));
    const mieng = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a73).multiplyScalar(3) }));
    mieng.position.set(0, 0, 0.66); laser.add(mieng);
    laser.position.set(0, BS[1], BS[2] - 3.6);
    const mayDoSang = new THREE.Group();
    mayDoSang.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.7, 0.7), matToi));
    const matCam = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8fe3a8).multiplyScalar(0.4) });
    const camBien = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), matCam); camBien.rotation.x = -Math.PI / 2; camBien.position.y = 0.36;
    mayDoSang.add(camBien);
    mayDoSang.position.set(0, BS[1] - 3, BS[2]);
    const domRa = taoDom(new THREE.Color(0xfff3c0).multiplyScalar(2.4), 2.2, { doMo: 0 });
    domRa.position.set(0, BS[1] - 2.2, BS[2]);
    const tiaVao = new DuongDay(2, { mau: 0xf3c66f, rong: 2.2, quang: 0.12, sang: 1.6 });
    tiaVao.dat(0, 0, BS[1], BS[2] - 2.95); tiaVao.dat(1, ...BS); tiaVao.xong(2);
    const tay1 = new DuongDay(2, { mau: 0xf3c66f, rong: 2.4, quang: 0.14, sang: 1.6 });
    const tay2 = new DuongDay(2, { mau: 0xf3c66f, rong: 2.4, quang: 0.14, sang: 1.6 });
    const tiaRa = new DuongDay(2, { mau: 0xfff3c0, rong: 2.6, quang: 0.2, sang: 1.8 });
    tiaRa.dat(0, ...BS); tiaRa.dat(1, 0, BS[1] - 2.6, BS[2]); tiaRa.xong(2);
    const nhanLaser = taoNhan(chuCanh('canh.laser', 'laser'), 'mo tran'); nhanLaser.position.set(0, BS[1] + 0.8, BS[2] - 3.6);
    const nhanBS = taoNhan(chuCanh("canh.bo-tach-chum", "bộ tách chùm"), 'mo tran'); nhanBS.position.set(0, BS[1] - 0.9, BS[2] - 0.6);
    const nhanG1 = taoNhan(chuCanh("canh.guong-cuoi", "gương cuối"), 'mo tran'), nhanG2 = taoNhan(chuCanh("canh.guong-cuoi", "gương cuối"), 'mo tran');
    const nhanRa = taoNhan('', 'tran'); nhanRa.position.set(0, BS[1] - 3.6, BS[2] + 0.6);
    const nhanTay = taoNhan(chuCanh("canh.moi-canh-tay-that-dai-4-km-do", "mỗi cánh tay thật dài 4 km<small>độ dài trên hình phóng đại ~10²⁰ lần</small>"), 'vang');
    nhanTay.position.set(0, BS[1] + L_TAY + 1.3, BS[2] - 0.4);
    nhomLigo.add(tachChum, guong1, guong2, moc1, moc2, laser, mayDoSang, domRa, tiaVao.line, tay1.line, tay2.line, tiaRa.line,
      nhanLaser, nhanBS, nhanG1, nhanG2, nhanRa, nhanTay);

    // ----- Thước khoảng cách và cột khối lượng (đồ vẽ; tay nắm tạo sau) -----
    const nhomThuoc = new THREE.Group();
    const thuoc = new DuongDay(2, { mau: 0xf3c66f, rong: 3, quang: 0.18, sang: 2 });
    const nenThuoc = new DuongDay(2, { mau: 0xf3c66f, rong: 1.4, doMo: 0.35 });
    const dauThuoc = taoDom(new THREE.Color(0xffe0a0).multiplyScalar(2), 0.7);
    const vachThuoc = new DoanRoi(24, { mau: 0xffe0a0, doMo: 0.95 });
    const nhanThuoc = taoNhan('', 'vang');
    for (const m of [thuoc.mat, thuoc.matQuang, nenThuoc.mat, vachThuoc.line.material, dauThuoc.material]) m.depthTest = false;
    thuoc.line.renderOrder = nenThuoc.line.renderOrder = vachThuoc.line.renderOrder = dauThuoc.renderOrder = 5;
    nhomThuoc.add(thuoc.line, nenThuoc.line, vachThuoc.line, dauThuoc, nhanThuoc);
    scene.add(nhomThuoc);
    const dsNhan = [];
    const nhomCot = new THREE.Group();
    const dsCot = COT.map((p, i) => {
      const truc = new DuongDay(2, { mau: i ? 0x9fd4ff : 0xffc98a, rong: 1.8, doMo: 0.7, sang: 1.2 });
      truc.dat(0, p[0], Y_COT0, p[2]); truc.dat(1, p[0], Y_COT1, p[2]); truc.xong(2);
      const vach = new DoanRoi(5, { mau: 0xffffff, doMo: 0.45 });
      const moc = [2, 5, 10, 20, 50];
      moc.forEach((m, k) => { const y = yTuKL(m); vach.dat(k, p[0] - 0.35, y, p[2], p[0] + 0.35, y, p[2]); });
      vach.xong(5);
      const nhanMoc = moc.map((m) => { const n = taoNhan(`${m}`, 'mo tran'); n.position.set(p[0] + (i ? 0.55 : -1.3), yTuKL(m), p[2]); return n; });
      const day = new DuongDay(2, { mau: i ? 0x9fd4ff : 0xffc98a, rong: 1.2, doMo: 0.3, net: [0.4, 0.4] });
      const nhanKL = taoNhan('', 'dam');
      nhomCot.add(truc.line, vach.line, day.line, nhanKL, ...nhanMoc);
      return { day, nhanKL, nhanMoc };
    });
    scene.add(nhomCot);

    // ----- Trạng thái -----
    let he = HE[0];
    let m1 = he.m1, m2 = he.m2;
    let ts = TC.thongSoMoHinh(m1, m2);
    let tau = T0;                 // giây trên hình còn lại tới lúc sáp nhập
    let tocDo = 1;
    let nhuThat = false;          // đang chạy nhanh như thật (nút «Nghe nhanh như thật»)
    let aSap = 2.5;
    const lichSu = new Float32Array(600);   // tín hiệu ở máy dò, mới nhất ở cuối
    let demLS = 0;
    const hien = { vong: false, ligo: false, lucTT: true, lan: true, mayDo: false, thuoc: false, cot: false, canh: false };
    let phanCuc = 'that';         // 'that' | 'p' | 'x' | 'tron'
    let tMau = 0;                 // đồng hồ của dao động mẫu
    let hpMD = 0, hxMD = 0;       // biến dạng ở máy dò (biên độ «+» bằng 1 khi nhìn dọc trục lúc nhập)
    let theta = 0;                // góc cặp cánh tay đo (rad, từ phương ngang)
    let batTieng = true, heSoCao = 1;
    let giong = null;             // âm kéo dài của tiếng chirp
    let dangKeoThuoc = false, dangKeoCot = -1;
    const dem = { thuoc: 0 };     // số lần đã kéo thước trong bước đang mở

    const pha = (t) => TC.phaMoHinh(t, ts);
    const aTuOm = (om) => A_DAU * Math.pow(om / OM_DAU, -2 / 3);
    const cosI = () => huongMD.y;                    // cos góc giữa hướng tới máy dò và trục quay (+Y)
    const phiMD = () => Math.atan2(huongMD.z, huongMD.x);
    function tinhHe() {
      ts = TC.thongSoMoHinh(m1, m2);
      aSap = aTuOm(ts.omMax);
      U.uOmMax.value = ts.omMax; U.uTauM.value = ts.tauM; U.uPhaM.value = ts.phaM; U.uPha0.value = ts.pha0;
      const M = m1 + m2;
      const laNT = Math.max(m1, m2) < 3;
      const r1 = (aSap * m1) / M, r2 = (aSap * m2) / M;
      vat1.scale.setScalar(r1); vat2.scale.setScalar(r2);
      vatCuoi.scale.setScalar(laNT ? (r1 + r2) * 0.75 : ((M - matNangLuong()) / M) * aSap);
      for (const v of [vat1, vat2, vatCuoi]) v.laSao(laNT);
      nhan1.datChu(`${so(m1, m1 < 5 ? 2 : 0)} M☉`); nhan2.datChu(`${so(m2, m2 < 5 ? 2 : 0)} M☉`);
      lichSu.fill(0); tau = T0;
    }
    function matNangLuong() { const M = m1 + m2, eta = (m1 * m2) / (M * M); return 0.048 * M * 16 * eta * eta; }

    // ----- Điều khiển -----
    const bang = app.bang;
    const dkHe = bang.chon({
      nhan: chuCanh("canh.chon-vu-sap-nhap", "Chọn vụ sáp nhập"),
      luaChon: HE.map((h) => ({ giaTri: h.id, nhan: h.ten, moTa: h.moTa })),
      giaTri: he.id,
      khiDoi: (id) => { he = HE.find((h) => h.id === id); m1 = he.m1; m2 = he.m2; dk1.dat(m1); dk2.dat(m2); tinhHe(); veThe(); },
    });
    const tuChon = () => { he = { id: 'tu', ten: chuCanh("canh.tu-chon", "Tự chọn"), m1, m2, loai: Math.max(m1, m2) < 3 ? 'nt' : 'ld' }; dkHe.dat(null); tinhHe(); veThe(); };
    const dk1 = bang.thanhTruot({ nhan: chuCanh("canh.khoi-luong-vat-thu-nhat", "Khối lượng vật thứ nhất"), min: M_MIN, max: M_MAX, giaTri: m1, log: true, hienThi: (v) => `${so(v, v < 5 ? 2 : 0)} M☉`, khiDoi: (v) => { m1 = v; tuChon(); } });
    const dk2 = bang.thanhTruot({ nhan: chuCanh("canh.khoi-luong-vat-thu-hai", "Khối lượng vật thứ hai"), min: M_MIN, max: M_MAX, giaTri: m2, log: true, hienThi: (v) => `${so(v, v < 5 ? 2 : 0)} M☉`, khiDoi: (v) => { m2 = v; tuChon(); } });
    const dkTocDo = bang.thanhTruot({ nhan: chuCanh("canh.toc-do-chieu", "Tốc độ chiếu"), min: 0, max: 3, buoc: 0.05, giaTri: tocDo, hienThi: (v) => (v === 0 ? chuCanh("canh.dung-yen", "đứng yên") : `×${so(v, 2)}`), khiDoi: (v) => { tocDo = v; nhuThat = false; } });
    bang.nut([
      { nhan: chuCanh("canh.xem-lai-tu-dau", "Xem lại từ đầu"), khiBam: () => { tau = T0; nhuThat = false; lichSu.fill(0); } },
      { nhan: chuCanh("canh.nghe-nhanh-nhu-that", "Nghe nhanh như thật"), moTa: chuCanh("canh.phat-0-2-giay-cuoi-voi-dung-nhip", "Phát 0,2 giây cuối với đúng nhịp và cao độ của tín hiệu thật"), khiBam: () => ngheNhuThat() },
    ]);
    const dkTieng = bang.congTac({ nhan: chuCanh("canh.tieng-chirp-tin-hieu-o-may-do", "Tiếng chirp (tín hiệu ở máy dò)"), giaTri: batTieng, khiDoi: (v) => { batTieng = v; if (!v) tatTieng(); } });
    const dkCao = bang.chon({
      nhan: chuCanh("canh.cao-do-tieng", "Cao độ tiếng"),
      luaChon: [
        { giaTri: 1, nhan: chuCanh("canh.tan-so-that", "Tần số thật"), moTa: chuCanh("canh.tieng-co-dung-tan-so-cua-song-gw150914", "Tiếng có đúng tần số của sóng (GW150914: 35 Hz lên khoảng 150 Hz)") },
        { giaTri: 4, nhan: chuCanh("canh.nang-hai-quang-tam", "Nâng hai quãng tám"), moTa: chuCanh("canh.nhan-tan-so-voi-4-de-loa-may", "Nhân tần số với 4 để loa máy tính nhỏ phát rõ hơn") },
      ],
      giaTri: heSoCao,
      khiDoi: (v) => { heSoCao = v; },
    });
    const dkPC = bang.chon({
      nhan: chuCanh("canh.tram-do-song-tac-dung-len-vong-hat", "Trạm đo: sóng tác dụng lên vòng hạt"),
      luaChon: [
        { giaTri: 'that', nhan: chuCanh("canh.theo-song-that", "Theo sóng thật"), moTa: chuCanh("canh.may-do-nam-trong-mat-phang-quy-dao", "Máy dò nằm trong mặt phẳng quỹ đạo nên chỉ nhận kiểu «+»") },
        { giaTri: 'p', nhan: chuCanh("canh.mau", "Mẫu «+»") }, { giaTri: 'x', nhan: chuCanh("canh.mau-c6c6de", "Mẫu «×»") }, { giaTri: 'tron', nhan: chuCanh("canh.tron", "Tròn") },
      ],
      giaTri: phanCuc,
      khiDoi: (v) => { phanCuc = v; },
    });
    const dkTT = bang.congTac({ nhan: chuCanh("canh.mui-ten-luc-thuy-trieu", "Mũi tên lực thủy triều"), giaTri: hien.lucTT, khiDoi: (v) => { hien.lucTT = v; capNhatHien(); } });
    const the = bang.the('');
    function veThe() {
      const dong = he.moTa ? chuCanh("canh.cach-trai-dat", "<span class=\"ten\">{0}</span> · {1}<br>Cách Trái Đất {2}.<br>", [he.ten, he.moTa, he.xa]) : chuCanh("canh.tu-chon-6b74d7", "<span class=\"ten\">Tự chọn</span><br>");
      the.dat(chuCanh("canh.khoi-luong-chirp-m-14-giay-tren-hinh", "{0}Khối lượng «chirp»: <b>{1} M☉</b><br>\n        14 giây trên hình = <b>{2}</b> thật (chiếu chậm {3} lần).<br>\n        Tiếng chirp trong mô hình: <b>{4} Hz → {5} Hz</b> lúc nhập.\n        {6}", [dong, so(khoiLuongChirp(m1, m2), 2), thoiGian(T0 * ts.sTL), soNghia(1 / ts.sTL, 2), so(ts.fDau, 0), so(ts.fNhap, 0), Math.max(m1, m2) >= 3 ? chuCanh("canh.nang-luong-phat-ra-thanh-song-khoang-m", "<br>Năng lượng phát ra thành sóng: khoảng <b>{0} M☉</b> (ước lượng cho lỗ đen không tự quay).", [so(matNangLuong(), 1)]) : '']));
    }
    const thoiGian = (s) => (s >= 1 ? chuCanh("canh.giay", "{0} giây", [so(s, 2)]) : s >= 1e-3 ? chuCanh("canh.mili-giay", "{0} mili giây", [so(s * 1e3, 1)]) : chuCanh("canh.micro-giay", "{0} micro giây", [so(s * 1e6, 0)]));
    bang.chuThich(chuCanh("canh.may-do-o-xa-ghi-duoc-gi-ben", "<b>Máy dò ở xa ghi được gì?</b> Bên trái: vòng hạt thử bị sóng kéo giãn (phóng đại rất nhiều lần). Bên phải: độ co giãn theo thời gian; tiếng «chirp» là đoạn tần số và biên độ cùng vọt lên ở cuối."));
    const dt = bang.doThi(150);
    tinhHe(); veThe();

    function veMayDo() {
      const { ctx: g, rong, cao } = dt;
      g.clearRect(0, 0, rong, cao);
      // nền tối có chiều sâu
      const nen = g.createLinearGradient(0, 0, 0, cao);
      nen.addColorStop(0, 'rgba(14,20,34,0.9)'); nen.addColorStop(1, 'rgba(5,8,15,0.9)');
      g.fillStyle = nen; g.fillRect(0, 0, rong, cao);
      // vòng hạt thử
      const cx = 58, cy = cao / 2 + 4, Rv = 34;
      g.strokeStyle = MAU.luoi; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.arc(cx, cy, Rv, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
      g.save(); g.shadowColor = MAU.luc; g.shadowBlur = 6; g.fillStyle = MAU.luc;
      const kp = 0.7 * hpMD, kx = 0.7 * hxMD;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 2 * Math.PI, u = Math.cos(a), v = Math.sin(a);
        const du = 0.5 * (kp * u + kx * v), dv = 0.5 * (-kp * v + kx * u);
        g.beginPath(); g.arc(cx + Rv * (u + du), cy - Rv * (v + dv), 2.6, 0, 2 * Math.PI); g.fill();
      }
      g.restore();
      // tín hiệu theo thời gian: đường sáng, cũ mờ dần, đầu bút sáng
      const x0 = 124, x1 = rong - 12, giua = cy, bd = cao * 0.36;
      g.strokeStyle = MAU.luoi; g.beginPath(); g.moveTo(x0, giua); g.lineTo(x1, giua); g.stroke();
      const n = lichSu.length;
      const toaDo = (i) => {
        const v = lichSu[(demLS + i) % n];
        return [x0 + ((x1 - x0) * i) / (n - 1), giua - bd * Math.max(-1.15, Math.min(1.15, v))];
      };
      const mau = g.createLinearGradient(x0, 0, x1, 0);
      mau.addColorStop(0, 'rgba(127,202,255,0.15)'); mau.addColorStop(0.7, 'rgba(143,227,168,0.75)'); mau.addColorStop(1, 'rgba(230,255,236,1)');
      g.save();
      g.lineJoin = 'round';
      for (const [rongNet, mo, mo2] of [[5, 0.16, 8], [1.6, 1, 3]]) {
        g.strokeStyle = mau; g.lineWidth = rongNet; g.globalAlpha = mo; g.shadowColor = MAU.luc; g.shadowBlur = mo2;
        g.beginPath();
        for (let i = 0; i < n; i++) { const [x, y] = toaDo(i); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.stroke();
      }
      g.globalAlpha = 1;
      const [xd, yd] = toaDo(n - 1);
      g.fillStyle = '#eafff0'; g.shadowBlur = 10; g.beginPath(); g.arc(xd, yd, 3, 0, 2 * Math.PI); g.fill();
      g.restore();
      g.font = '10.5px -apple-system, sans-serif'; g.fillStyle = MAU.mo; g.textAlign = 'left';
      g.fillText(chuCanh("canh.vong-hat-o-may-do", "vòng hạt ở máy dò"), 14, 13); g.fillText(chuCanh("canh.do-co-gian-h-t-tai-may-do", "độ co giãn h(t) tại máy dò"), x0, 13);
      g.textAlign = 'right';
      g.fillText(chuCanh("canh.bay-gio", "bây giờ"), x1, cao - 6);
      if (tinTieng.f > 0) { g.fillStyle = MAU.chu; g.fillText(`${so(tinTieng.f, 0)} Hz`, x1, 13); }
    }

    // ----- Trạm đo: tính biến dạng hiển thị và vẽ -----
    function bienDangHienThi() {
      if (phanCuc === 'that') return [K_HIEN * hpMD, K_HIEN * hxMD];
      const c = Math.cos(W_MAU * tMau), s = Math.sin(W_MAU * tMau);
      if (phanCuc === 'p') return [BD_MAU * c, 0];
      if (phanCuc === 'x') return [0, BD_MAU * c];
      return [BD_MAU * c, BD_MAU * s];
    }
    // điểm (u ngang, v dọc) trên vòng → độ lệch [du, dv]
    const lech = (u, v, hp, hx, ra) => { ra[0] = 0.5 * (hp * u + hx * v); ra[1] = 0.5 * (-hp * v + hx * u); return ra; };
    const tamL = [0, 0];
    function veTram() {
      const [hp, hx] = bienDangHienThi();
      if (nhomVong.visible) {
        for (let i = 0; i < N_VIEN; i++) {
          const a = (i / (N_VIEN - 1)) * 2 * Math.PI, u = R_VONG * Math.cos(a), v = R_VONG * Math.sin(a);
          lech(u, v, hp, hx, tamL);
          vien.dat(i, 0, v + tamL[1], u + tamL[0]);
        }
        vien.xong(N_VIEN);
        for (let i = 0; i < SO_HAT; i++) {
          const a = (i / SO_HAT) * 2 * Math.PI, u = R_VONG * Math.cos(a), v = R_VONG * Math.sin(a);
          lech(u, v, hp, hx, tamL);
          hat[i].position.set(0, v + tamL[1], u + tamL[0]);
        }
        for (let k = 0; k < SO_MT; k++) {
          const i = k * (SO_HAT / SO_MT), p = hat[i].position;
          const a = (i / SO_HAT) * 2 * Math.PI, u = R_VONG * Math.cos(a), v = R_VONG * Math.sin(a);
          lech(u, v, hp, hx, tamL);
          // lực thủy triều ngược pha với độ lệch (ḧ = −ω²h), vẽ dài gấp 3,2 lần độ lệch
          const ex = p.z - 3.2 * tamL[0], ey = p.y - 3.2 * tamL[1];
          dsMT[k].l.dat(0, 0, p.y, p.z); dsMT[k].l.dat(1, 0, ey, ex); dsMT[k].l.xong(2);
          dsMT[k].dau.position.set(0, ey, ex);
        }
        if (nhomCanh.visible) {
          const ch = TC.chenhLechCanhTay(hp, hx, theta);
          const cA = Math.cos(theta), sA = Math.sin(theta);
          const LA = R_VONG * 1.25 * (1 + 0.5 * ch), LB = R_VONG * 1.25 * (1 - 0.5 * ch);
          canhA.dat(0, 0.05, 0, 0); canhA.dat(1, 0.05, LA * sA, LA * cA); canhA.xong(2);
          canhB.dat(0, 0.05, 0, 0); canhB.dat(1, 0.05, LB * cA, -LB * sA); canhB.xong(2);
          dauA.position.set(0.05, LA * sA, LA * cA); dauB.position.set(0.05, LB * cA, -LB * sA);
          nhanCanh.position.set(0.1, LB * cA - 0.9, -LB * sA - 0.4);
          nhanCanh.datChu(chuCanh("canh.hai-canh-tay-do-xoay-chenh-lech-do", "hai cánh tay đo · xoay {0}°<small>chênh lệch độ dài: {1}%</small>", [so(((theta / DO) % 180 + 180) % 180, 0), so(Math.abs(ch) * 100, 0)]));
        }
      }
      if (nhomLigo.visible) {
        const k = hp;                                // giao thoa kế chỉ nhạy với kiểu «+» thẳng hàng
        const L1 = L_TAY * (1 + 0.5 * k), L2 = L_TAY * (1 - 0.5 * k);
        guong1.position.set(0, BS[1], BS[2] + L1 + 0.11);
        guong2.position.set(0, BS[1] + L2 + 0.11, BS[2]);
        tay1.dat(0, ...BS); tay1.dat(1, 0, BS[1], BS[2] + L1); tay1.xong(2);
        tay2.dat(0, ...BS); tay2.dat(1, 0, BS[1] + L2, BS[2]); tay2.xong(2);
        nhanG1.position.set(0, BS[1] + 0.9, BS[2] + L1 + 0.3);
        nhanG2.position.set(0, BS[1] + L2 + 0.6, BS[2] + 0.9);
        const sang = Math.pow(Math.sin(Math.min(Math.PI / 2, (Math.abs(k) / 0.2) * (Math.PI / 2))), 2);
        domRa.material.opacity = sang;
        matCam.color.setHex(0x8fe3a8).multiplyScalar(0.4 + 3 * sang);
        tiaRa.datDoMo(0.08 + 0.92 * sang);
        nhanRa.datChu(chuCanh("canh.may-do-anh-sang", "máy đo ánh sáng<small>{0}</small>", [sang < 0.04 ? chuCanh("canh.toi-hai-tia-triet-tieu", "tối: hai tia triệt tiêu") : chuCanh("canh.sang-len-hai-canh-tay-lech-nhau", "sáng lên: hai cánh tay lệch nhau")]));
      }
    }

    // ----- Máy dò: đặt vị trí, hướng; vẽ vòng hạt nhỏ -----
    const _m = new THREE.Matrix4(), _eB = new THREE.Vector3(), _eP = new THREE.Vector3(), _v = new THREE.Vector3();
    function datMayDo(p) {
      huongMD.copy(p).normalize();
      if (huongMD.y < 0) { huongMD.y = 0; huongMD.normalize(); }
      const phi = phiMD(), beta = Math.asin(Math.min(1, huongMD.y));
      _eP.set(-Math.sin(phi), 0, Math.cos(phi));
      _eB.set(-Math.sin(beta) * Math.cos(phi), Math.cos(beta), -Math.sin(beta) * Math.sin(phi));
      _m.makeBasis(huongMD, _eB, _eP);
      mayDo.quaternion.setFromRotationMatrix(_m);
      mayDo.position.copy(huongMD).multiplyScalar(R_MAY_DO);
      nhanMayDo.position.copy(mayDo.position).addScaledVector(_eB, -1.4).addScaledVector(_eP, 1.2);
      // cung kinh tuyến từ mặt phẳng quỹ đạo lên tới trục quay, qua máy dò
      for (let i = 0; i <= 48; i++) {
        const b = (i / 48) * (Math.PI / 2);
        cung.dat(i, R_MAY_DO * Math.cos(b) * Math.cos(phi), R_MAY_DO * Math.sin(b), R_MAY_DO * Math.cos(b) * Math.sin(phi));
      }
      cung.xong(49);
    }
    function veVongNho() {
      const kp = 0.55 * hpMD, kx = 0.55 * hxMD;
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * 2 * Math.PI, u = R_NHO * Math.cos(a), v = R_NHO * Math.sin(a);
        lech(u, v, kp, kx, tamL);
        vienNho.dat(i, 0.25, v + tamL[1], u + tamL[0]);
      }
      vienNho.xong(65);
      for (let i = 0; i < N_NHO; i++) {
        const a = (i / N_NHO) * 2 * Math.PI, u = R_NHO * Math.cos(a), v = R_NHO * Math.sin(a);
        lech(u, v, kp, kx, tamL);
        hatNho[i].position.set(0.25, v + tamL[1], u + tamL[0]);
      }
    }

    // ----- Tay nắm trong cảnh -----
    // 1. Máy dò: kéo trên mặt cầu quanh nguồn (chỉ nửa trên: góc nâng 0–90°).
    const tayMD = tt.tayNam({
      viTri: huongMD.clone().multiplyScalar(R_MAY_DO), mau: 0x8fe3a8, co: 0.5,
      ten: chuCanh("canh.may-do", "Máy dò"), moTa: () => chuCanh("canh.keo-quanh-nguon-lech-truc-quay-bien-do", "Kéo quanh nguồn. Lệch trục quay <span class=\"so\">{0}°</span>; biên độ «+» <span class=\"so\">{1}%</span> so với nhìn dọc trục.", [so(Math.acos(cosI()) / DO, 0), so(TC.heSoHuong(cosI()).cong * 100, 0)]),
      rangBuoc: { kieu: 'mat-cau', tam: [0, 0, 0], banKinh: R_MAY_DO },
      gioiHan: (p) => { if (p.y < 0) { p.y = 0; p.setLength(R_MAY_DO); } return p; },
      hut: [[0, R_MAY_DO, 0]], khoangHut: 1.2,
      nhan: chuCanh("canh.keo-may-do-quanh-nguon", "Kéo máy dò quanh nguồn"),
      khiKeo: (p) => datMayDo(p),
    });
    // 2. Thước khoảng cách: kéo dọc thước để đặt khoảng cách hai lỗ đen (cũng là đặt thời gian còn lại).
    const tayThuoc = tt.tayNam({
      viTri: HUONG_THUOC.clone().multiplyScalar(R0_THUOC + A_DAU).setY(Y_THUOC), mau: 0xf3c66f, co: 0.34,
      ten: chuCanh("canh.khoang-cach-hai-lo-den", "Khoảng cách hai lỗ đen"), moTa: () => chuCanh("canh.keo-vao-gan-la-tua-toi-luc-sap", "Kéo vào gần là tua tới lúc sáp nhập, kéo ra xa là lùi về trước. Mô hình đứng yên trong lúc kéo."),
      rangBuoc: { kieu: 'duong', qua: [0, Y_THUOC, 0], huong: HUONG_THUOC.toArray() },
      gioiHan: (p) => { const d = Math.min(A_DAU, Math.max(aSap * 1.0005, p.dot(HUONG_THUOC) - R0_THUOC)); return p.copy(HUONG_THUOC).multiplyScalar(R0_THUOC + d).setY(Y_THUOC); },
      nhan: chuCanh("canh.keo-de-doi-khoang-cach", "Kéo để đổi khoảng cách"),
      khiNam: () => { dangKeoThuoc = true; nhuThat = false; },
      khiKeo: (p) => { datKhoangCach(p.dot(HUONG_THUOC) - R0_THUOC); dem.thuoc++; },
      khiTha: () => { dangKeoThuoc = false; },
    });
    function datKhoangCach(a) {
      a = Math.min(A_DAU, Math.max(aSap * 1.0005, a));
      const om = OM_DAU * Math.pow(a / A_DAU, -1.5);
      tau = Math.max(ts.tauM + 1e-4, Math.pow(om / AV, -8 / 3));
    }
    // 3. Hai cột khối lượng: kéo lên xuống, thang logarit.
    const _tia = new THREE.Vector3();
    const chieuCot = (i) => (ray) => {
      // điểm trên đường thẳng đứng (x; t; z) của cột gần tia o + s·d nhất
      const [x, , z] = COT[i];
      const o = ray.origin, d = ray.direction;
      const wx = o.x - x, wz = o.z - z;
      const a = d.dot(d), b = d.y, dw = d.x * wx + d.y * o.y + d.z * wz;
      const den = a - b * b;
      if (Math.abs(den) < 1e-9) return null;
      const t = (a * o.y - b * dw) / den;
      return _tia.set(x, Math.min(Y_COT1, Math.max(Y_COT0, t)), z).clone();
    };
    const tayCot = COT.map((p, i) => tt.tayNam({
      viTri: [p[0], yTuKL(i ? m2 : m1), p[2]], mau: i ? 0x9fd4ff : 0xffc98a, co: 0.3,
      ten: chuCanh("canh.khoi-luong-lo-den", "Khối lượng lỗ đen {0}", [i ? chuCanh("canh.thu-hai", "thứ hai") : chuCanh("canh.thu-nhat", "thứ nhất")]), moTa: chuCanh("canh.keo-len-de-nang-hon-thang-logarit-1", "Kéo lên để nặng hơn (thang logarit 1,2–80 M☉). Mô hình chạy lại từ đầu với cặp mới."),
      rangBuoc: { kieu: 'ham', chieu: chieuCot(i) },
      nhan: i ? '' : chuCanh("canh.keo-de-doi-khoi-luong", "Kéo để đổi khối lượng"),
      khiNam: () => { dangKeoCot = i; nhuThat = false; },
      khiKeo: (q) => {
        const m = klTuY(q.y);
        if (i) { m2 = m; dk2.dat(m); } else { m1 = m; dk1.dat(m); }
        tuChon();
      },
      khiTha: () => { dangKeoCot = -1; },
    }));
    // 4. Cặp cánh tay đo: kéo đốm vàng quanh vành để xoay (bước 3).
    const _mi = new THREE.Matrix4(), _mp = new THREE.Plane(), _o = new THREE.Vector3(), _nx = new THREE.Vector3(), _q2 = new THREE.Vector3();
    const R_TAY_XOAY = R_VONG * 1.6;
    const viTriTayXoay = (th, ra = new THREE.Vector3()) => ra.set(0, R_TAY_XOAY * Math.sin(th), R_TAY_XOAY * Math.cos(th)).applyMatrix4(nhomVong.matrixWorld);
    const tayXoay = tt.tayNam({
      viTri: [0, 0, 0], mau: 0xf3c66f, co: 0.3,
      ten: chuCanh("canh.cap-canh-tay-do", "Cặp cánh tay đo"), moTa: () => chuCanh("canh.keo-quanh-vanh-de-xoay-hai-canh-tay", "Kéo quanh vành để xoay hai cánh tay. Số «chênh lệch» là độ dài cánh này trừ cánh kia."),
      rangBuoc: {
        kieu: 'ham',
        chieu: (ray) => {
          nhomVong.updateMatrixWorld();
          _o.setFromMatrixPosition(nhomVong.matrixWorld);
          _nx.set(1, 0, 0).transformDirection(nhomVong.matrixWorld);
          _mp.setFromNormalAndCoplanarPoint(_nx, _o);
          if (!ray.intersectPlane(_mp, _q2)) return null;
          _q2.applyMatrix4(_mi.copy(nhomVong.matrixWorld).invert());
          theta = Math.atan2(_q2.y, _q2.z);
          return viTriTayXoay(theta);
        },
      },
      nhan: chuCanh("canh.keo-de-xoay-hai-canh-tay", "Kéo để xoay hai cánh tay"),
    });

    // ----- Rê chuột xem thông tin -----
    const moTaVat = (k) => () => {
      const m = k ? m2 : m1, M = m1 + m2;
      const om = pha(Math.max(tau, 1e-6))[1] / ts.sTL;
      const v = Math.cbrt(G * M * M_MAT_TROI * om) / C * (k ? m1 : m2) / M;
      const laSaoNeutron = Math.max(m1, m2) < 3;
      const loai = laSaoNeutron ? chuCanh("canh.sao-neutron", "Sao neutron") : chuCanh("canh.lo-den", "Lỗ đen");
      const rs = (2 * G * m * M_MAT_TROI) / (C * C) / 1000;
      return chuCanh("canh.m-luc-nay-lao-di-voi-toc-do", "{0} <span class=\"so\">{1} M☉</span>{2}.<br>Lúc này lao đi với <span class=\"so\">{3}%</span> tốc độ ánh sáng.", [loai, so(m, m < 5 ? 2 : 0), !laSaoNeutron ? chuCanh("canh.ban-kinh-chan-troi-km", ", bán kính chân trời <span class=\"so\">{0} km</span>", [so(rs, 0)]) : chuCanh("canh.ban-kinh-chung-12-km", ", bán kính chừng 12 km"), so(v * 100, 0)]);
    };
    tt.them(vat1.ld.cau, { ten: chuCanh("canh.vat-thu-nhat", "Vật thứ nhất"), mau: 0xffc98a, moTa: moTaVat(0) });
    tt.them(vat2.ld.cau, { ten: chuCanh("canh.vat-thu-hai", "Vật thứ hai"), mau: 0x9fd4ff, moTa: moTaVat(1) });
    tt.them(vatCuoi.ld.cau, { ten: chuCanh("canh.lo-den-moi", "Lỗ đen mới"), mau: 0xf3c66f, moTa: () => chuCanh("canh.khoang-m-no-rung-len-roi-lang-dan", "Khoảng <span class=\"so\">{0} M☉</span>. Nó rung lên rồi lặng dần như một quả chuông bị gõ: pha «rung tắt dần».", [so(m1 + m2 - matNangLuong(), 0)]) });
    tt.them(nhaGiua, { ten: chuCanh("canh.may-do", "Máy dò"), mau: 0x8fe3a8, banKinhPx: 22, moTa: () => chuCanh("canh.bien-do-o-huong-nay-so-voi-nhin", "Biên độ «+» ở hướng này: <span class=\"so\">{0}%</span>, «×»: <span class=\"so\">{1}%</span> (so với nhìn dọc trục quay).", [so(TC.heSoHuong(cosI()).cong * 100, 0), so(Math.abs(TC.heSoHuong(cosI()).cheo) * 100, 0)]) });
    tt.them(kinh, { ten: chuCanh("canh.vong-hat-thu", "Vòng hạt thử"), mau: 0x8fe3a8, moTa: () => { const [hp, hx] = bienDangHienThi(); return chuCanh("canh.luc-nay-dai-ra-theo-ngang-theo-duong", "Lúc này: dài ra theo ngang <span class=\"so\">{0}%</span>, theo đường chéo <span class=\"so\">{1}%</span> (đã phóng đại ~10²⁰ lần).", [so(50 * hp, 0), so(50 * hx, 0)]); } });

    // ----- Âm thanh: tiếng chirp theo trạng thái mô hình -----
    const tinTieng = { f: 0, doTo: 0, tR: 0 };
    let ghi = null;                 // thu=ghiTieng: ghi lại tiếng từng khung hình để kiểm bằng số (chế độ im lặng)
    function tatTieng() { if (giong) { giong.tat(0.25); giong = null; } }
    function datTieng(chay, muot) {
      const coSongThat = phanCuc === 'that' || !(hien.vong || hien.ligo);
      const tR = tau + R_MAY_DO / C_HINH;
      const q = TC.quyDoiTieng(tR, ts, { heSoCao, huong: TC.heSoHuong(cosI()).cong });
      const doTo = batTieng && coSongThat && chay && tR > -6 * TC.RUNG_TAT ? q.doTo : 0;
      tinTieng.f = q.tanSo; tinTieng.doTo = doTo; tinTieng.tR = tR;
      if (ghi && ghi.length < 6000) ghi.push([+tR.toFixed(6), +q.tanSo.toFixed(4), +doTo.toFixed(5)]);
      if (doTo <= 0) { if (giong) giong.dat({ doTo: 0 }, 0.08); return; }
      if (!giong) giong = am.giong({ dang: 'chuong', tanSo: q.tanSo, doTo: 0 });
      giong.dat({ tanSo: q.tanSo, doTo }, muot);
    }
    function ngheNhuThat() {
      nhuThat = true;
      tau = T0 - R_MAY_DO / C_HINH;        // máy dò bắt đầu nhận đúng lúc τ = 14 s
      lichSu.fill(0);
    }

    const GOC_MAY = (ten, giay = 1.6) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);
    function capNhatHien() {
      nhomVong.visible = hien.vong;
      nhomLigo.visible = hien.ligo;
      nhomHuong.visible = hien.vong || hien.ligo;
      cot.line.visible = hien.vong;
      nhomLan.visible = hien.lan && !hien.vong && !hien.ligo && !hien.cot && !hien.thuoc;
      for (const m of dsMT) m.l.line.visible = m.dau.visible = hien.lucTT;
      nhanTT.visible = hien.lucTT;
      nhomCanh.visible = hien.canh;
      vongNho.visible = !(hien.vong || hien.ligo);
      bangTH.visible = hien.mayDo;
      nhomHuongMD.visible = hien.mayDo;
      nhanMayDo.visible = hien.mayDo;
      mayDo.visible = hien.mayDo || hien.vong || hien.ligo;
      for (const o of [tayNgang, tayDoc, nhaGiua, dau1, dau2, denMD, tiaMD1.line, tiaMD2.line]) o.visible = !(hien.vong || hien.ligo);
      nhomThuoc.visible = hien.thuoc;
      nhomCot.visible = hien.cot;
      tayMD.an(!hien.mayDo);
      tayThuoc.an(!hien.thuoc);
      for (const t of tayCot) t.an(!hien.cot);
      tayXoay.an(!hien.canh);
      dkPC.el.hidden = !(hien.vong || hien.ligo);
      dkTT.el.hidden = !hien.vong;
    }

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      if (o.he) {
        if (Array.isArray(o.he)) { m1 = o.he[0]; m2 = o.he[1]; dk1.dat(m1); dk2.dat(m2); tuChon(); }
        else dkHe.dat(o.he, true);
      }
      if (o.tocDo != null) { tocDo = o.tocDo; dkTocDo.dat(o.tocDo); nhuThat = false; }
      if (o.vong != null) hien.vong = o.vong;
      hien.lan = o.lan ?? (o.mayAnh ? o.mayAnh !== 'tren' : hien.lan);
      if (o.ligo != null) hien.ligo = o.ligo;
      if (o.lucTT != null) { hien.lucTT = o.lucTT; dkTT.dat(o.lucTT); }
      if (o.phanCuc) { phanCuc = o.phanCuc; dkPC.dat(o.phanCuc); tMau = 0; }
      if (o.luoi != null) U.uMo.value = o.luoi;
      if (o.tau != null) { tau = o.tau === 'dau' ? T0 : o.tau; nhuThat = false; lichSu.fill(0); }
      if (o.tay) {
        hien.mayDo = o.tay.includes('mayDo'); hien.thuoc = o.tay.includes('thuoc'); hien.cot = o.tay.includes('cot'); hien.canh = o.tay.includes('canh');
        dem.thuoc = 0;
      }
      if (o.mayDo === 'dau') { datMayDo(new THREE.Vector3(Math.cos(PHI0), 0, Math.sin(PHI0))); tayMD.dat(mayDo.position); }
      if (o.theta != null) theta = o.theta;
      capNhatHien();
      if (o.mayAnh) GOC_MAY(o.mayAnh);
    }
    datMayDo(huongMD);
    capNhatHien();

    // ----- Trạng thái đặt sẵn để chụp ảnh kiểm tra (chỉ trong chế độ im lặng) -----
    let thu = null;
    if (app.imLang) { try { thu = new URLSearchParams(location.search).get('thu'); } catch { thu = null; } }
    function apThu() {
      const p = new THREE.Vector3();
      switch (thu) {
        case 'xoay': cauHinh({ tau: 2.5, tocDo: 0 }); break;
        case 'nhap': cauHinh({ tau: -0.12, tocDo: 0 }); break;
        case 'sau': cauHinh({ tau: -1.4, tocDo: 0 }); break;
        case 'cuoi': cauHinh({ tau: 0.6, tocDo: 0 }); break;
        case 'truc': p.set(0.1, 1, 0.03); datMayDo(p); tayMD.dat(mayDo.position); break;
        case 'nang': p.set(Math.cos(PHI0), 0.9, Math.sin(PHI0)); datMayDo(p); tayMD.dat(mayDo.position); break;
        case 'canh45': theta = Math.PI / 4; break;
        case 'tt4': cauHinh({ tocDo: 0 }); dem.thuoc = 1; tau = Math.pow((50 * Math.PI * ts.sTL) / AV, -8 / 3); break;
        case 'tt5': cauHinh({ he: [20.5, 18.2] }); break;
        case 'tt6': cauHinh({ tocDo: 0 }); tau = Math.pow((100 * Math.PI * ts.sTL) / AV, -8 / 3); break;
        case 'that': ngheNhuThat(); break;
        case 'ghiTieng': case 'ghiThat':
          ghi = [];
          if (thu === 'ghiThat') ngheNhuThat();
          setTimeout(() => {
            const el = document.createElement('pre');
            el.id = 'b17-tieng'; el.hidden = true;
            el.textContent = JSON.stringify({ m1, m2, R: R_MAY_DO, C: C_HINH, mau: ghi });
            document.body.append(el);
          }, 0);
          break;
        default: break;
      }
    }

    let choMau = 0;
    const _p = new THREE.Vector3();
    function capNhat(dtg) {
      if (thu) { apThu(); thu = null; }
      const giu = dangKeoThuoc || dangKeoCot >= 0;          // đang kéo thước hoặc cột: mô hình đứng yên
      const v = nhuThat ? TC.tocDoNhuThat(ts) : tocDo;
      const buocT = giu ? 0 : dtg * v;
      tau -= buocT;
      tMau += giu ? 0 : dtg * tocDo;
      if (nhuThat && tau + R_MAY_DO / C_HINH < -1.2) { nhuThat = false; tau = T0; lichSu.fill(0); }
      if (tau < -T_SAU) { tau = T0; lichSu.fill(0); }
      U.uTau.value = tau;
      const [ph, om] = pha(Math.max(tau, 0));
      const M = m1 + m2;
      const daNhap = tau <= 0;
      vat1.visible = vat2.visible = vet1.line.visible = vet2.line.visible = !daNhap;
      nhan1.visible = nhan2.visible = !daNhap && !(hien.vong || hien.ligo);
      vatCuoi.visible = nhanCuoi.visible = daNhap;
      const laNT = Math.max(m1, m2) < 3;
      U.uMat.value = laNT ? 0.4 : 1;
      if (!daNhap) {
        const a = aTuOm(om);
        const r1 = (a * m2) / M, r2 = (a * m1) / M;
        vat1.position.set(r1 * Math.cos(ph), Y_VAT, r1 * Math.sin(ph));
        vat2.position.set(-r2 * Math.cos(ph), Y_VAT, -r2 * Math.sin(ph));
        nhan1.position.copy(vat1.position).y += vat1.scale.x * 1.3 + 0.5;
        nhan2.position.copy(vat2.position).y += vat2.scale.x * 1.3 + 0.5;
        for (let i = 0; i < 160; i++) {       // vệt: vị trí trong 1,6 giây vừa qua
          const [p2, o2] = pha(tau + i * 0.01);
          const a2 = aTuOm(o2);
          vet1.dat(i, ((a2 * m2) / M) * Math.cos(p2), Y_VAT, ((a2 * m2) / M) * Math.sin(p2));
          vet2.dat(i, ((-a2 * m1) / M) * Math.cos(p2), Y_VAT, ((-a2 * m1) / M) * Math.sin(p2));
        }
        vet1.xong(160); vet2.xong(160);
      } else {
        vatCuoi.position.set(0, Y_VAT, 0);
        nhanCuoi.position.set(0, Y_VAT + vatCuoi.scale.x * 1.3 + 0.6, 0);
        nhanCuoi.datChu(!laNT ? chuCanh("canh.lo-den-moi-m-phan-con-lai-da", "Lỗ đen mới ≈ {0} M☉<small>phần còn lại đã thành sóng hấp dẫn</small>", [so(M - matNangLuong(), 0)]) : chuCanh("canh.da-sap-nhap-vu-no-kilonova-noi-sinh", "Đã sáp nhập<small>vụ nổ kilonova: nơi sinh ra nhiều nguyên tố nặng</small>"));
      }
      // chớp sáng lúc nhập và mặt sóng sáng lan ra
      const tSau = -tau;
      if (tSau > 0 && tSau < 3) {
        const k = Math.exp(-tSau / 0.35);
        chop.material.opacity = k; chop.scale.setScalar(aSap * (2.5 + 7 * (1 - k)));
        chopRong.material.opacity = 0.45 * Math.exp(-tSau / 0.45); chopRong.scale.setScalar(aSap * (5 + 9 * tSau));
        U.uChop.value = Math.exp(-tSau / 1.6);
      } else { chop.material.opacity = 0; chopRong.material.opacity = 0; U.uChop.value = 0; }
      // lỗ đen mới rung: vòng photon «thở» theo pha rung tắt dần
      if (daNhap && !laNT) {
        const rung = 1 + 0.07 * Math.exp(tau / TC.RUNG_TAT) * Math.cos(2 * (ts.pha0 + TC.RUNG_TAN_SO * ts.omMax * tSau));
        const goc = ((M - matNangLuong()) / M) * aSap;
        vatCuoi.scale.setScalar(goc * rung);
      }
      for (const vt of [vat1, vat2, vatCuoi]) if (vt.visible) vt.ld.capNhat(dtg, app.camera);

      // tín hiệu tại máy dò: trạng thái của nguồn từ r/c trước, theo hướng của máy dò
      const tR = tau + R_MAY_DO / C_HINH;
      const [p2] = pha(tR);
      [hpMD, hxMD] = TC.bienDangMayDo(p2, phiMD(), TC.bienDoTuongDoi(tR, ts), cosI());
      choMau -= buocT;
      if (buocT > 0 && (choMau <= 0 || nhuThat)) { choMau = 0.015; lichSu[demLS] = hpMD; demLS = (demLS + 1) % lichSu.length; }
      veMayDo();
      if (hien.vong || hien.ligo) veTram();
      else veVongNho();
      // nhãn máy dò
      const huong = TC.heSoHuong(cosI());
      nhanMayDo.datChu(chuCanh("canh.may-do-lech-truc-quay-bien-do", "Máy dò<small>lệch trục quay {0}° · biên độ «+» {1}%</small>", [so(Math.acos(cosI()) / DO, 0), so(huong.cong * 100, 0)]));
      // bảng tín hiệu nổi: quay mặt về máy quay
      if (bangTH.visible) {
        // máy dò ở thấp: bảng nằm phía trên; máy dò ở cao (gần trục quay): bảng nằm sang bên phải màn hình
        const cao = Math.min(1, Math.max(0, (huongMD.y - 0.35) / 0.4));
        _p.set(1, 0, 0).applyQuaternion(app.camera.quaternion).multiplyScalar(10 * cao);
        bangTH.position.copy(mayDo.position).add(_p).y += 7.2 * (1 - cao);
        bangTH.quaternion.copy(app.camera.quaternion);
        const n = lichSu.length, buoc = n / N_TH;
        for (let i = 0; i < N_TH; i++) {     // điểm 0 là mới nhất (sáng nhất), ở bên phải
          const v2 = lichSu[(demLS - 1 - Math.floor(i * buoc) + 2 * n) % n];
          duongTH.dat(i, RONG_TH / 2 - (RONG_TH * i) / (N_TH - 1), CAO_TH * Math.max(-1.2, Math.min(1.2, v2)), 0);
        }
        duongTH.xong(N_TH);
        dauTH.position.set(RONG_TH / 2, CAO_TH * Math.max(-1.2, Math.min(1.2, lichSu[(demLS - 1 + n) % n])), 0);
        nhanTH.datChu(chuCanh("canh.tin-hieu-o-may-do-h-t", "tín hiệu ở máy dò h(t)<small>{0}</small>", [tinTieng.f > 0 ? `${so(tinTieng.f / heSoCao, 0)} Hz` : '']));
      }
      // thước khoảng cách
      if (hien.thuoc) {
        const a = daNhap ? aSap : aTuOm(om);
        const kmMoiDV = Math.cbrt(G * M * M_MAT_TROI) * Math.pow(ts.sTL, 2 / 3) / (A_DAU * Math.pow(OM_DAU, 2 / 3)) / 1000;
        const H = HUONG_THUOC, x0 = H.x * R0_THUOC, z0 = H.z * R0_THUOC;
        nenThuoc.dat(0, x0, Y_THUOC, z0); nenThuoc.dat(1, H.x * (R0_THUOC + A_DAU), Y_THUOC, H.z * (R0_THUOC + A_DAU)); nenThuoc.xong(2);
        thuoc.dat(0, x0, Y_THUOC, z0); thuoc.dat(1, H.x * (R0_THUOC + a), Y_THUOC, H.z * (R0_THUOC + a)); thuoc.xong(2);
        dauThuoc.position.set(x0, Y_THUOC, z0);
        const buocKm = kmMoiDV * A_DAU > 1500 ? 200 : kmMoiDV * A_DAU > 600 ? 100 : 20;
        let nv = 0;
        for (let km = buocKm; km / kmMoiDV <= A_DAU && nv < 24; km += buocKm, nv++) {
          const lon = (km / buocKm) % 5 === 0, d = R0_THUOC + km / kmMoiDV, ox = -H.z * (lon ? 0.6 : 0.36), oz = H.x * (lon ? 0.6 : 0.36);
          vachThuoc.dat(nv, H.x * d - ox, Y_THUOC, H.z * d - oz, H.x * d + ox, Y_THUOC, H.z * d + oz);
        }
        vachThuoc.xong(nv);
        if (!dangKeoThuoc) tayThuoc.dat(_p.copy(H).multiplyScalar(R0_THUOC + a).setY(Y_THUOC));
        nhanThuoc.position.copy(H).multiplyScalar(R0_THUOC + A_DAU + 1.4).setY(Y_THUOC - 1.2);
        nhanThuoc.datChu(chuCanh("canh.hai-lo-den-cach-nhau-km-vach-cach", "hai lỗ đen cách nhau {0} km<small>vạch cách nhau {1} km</small>", [so(a * kmMoiDV, 0), buocKm]));
      }
      // cột khối lượng
      if (hien.cot) {
        [m1, m2].forEach((m, i) => {
          const y = yTuKL(m), p = COT[i];
          if (dangKeoCot !== i) tayCot[i].dat([p[0], y, p[2]]);
          const vt = i ? vat2 : vat1;
          dsCot[i].day.dat(0, p[0], y, p[2]); dsCot[i].day.dat(1, vt.visible ? vt.position.x : 0, Y_VAT, vt.visible ? vt.position.z : 0); dsCot[i].day.xong(2);
          // phía trong cột (phía hai vật), bên kia các chữ số của vạch chia, để không che số 50
          dsCot[i].nhanKL.position.set(p[0] + (i ? -0.8 : 0.8), y + 0.9, p[2]);
          dsCot[i].nhanKL.datChu(`${so(m, m < 5 ? 2 : m < 10 ? 1 : 0)} M☉`);
        });
      }
      if (hien.canh && !tt.dangKeo) { nhomVong.updateMatrixWorld(true); tayXoay.dat(viTriTayXoay(theta)); }

      // Nhãn tránh nhau: vật chính (hai vật, khối lượng đang kéo) giữ chỗ; nhãn của dụng cụ ở 50–85; chữ số trên cột,
      // chú thích phụ ở 15–40. Bước cột khối lượng: mỗi khối lượng chỉ một nhãn (ở tay nắm của cột), nhãn cạnh hai vật tắt.
      const oTram = hien.vong || hien.ligo;
      dsNhan.length = 0;
      dsNhan.push({ nhan: nhanCuoi, uuTien: 95, giu: true, tat: !daNhap });
      dsNhan.push({ nhan: nhan1, uuTien: 90, tat: daNhap || oTram || hien.cot }, { nhan: nhan2, uuTien: 90, tat: daNhap || oTram || hien.cot });
      for (const c of dsCot) {
        dsNhan.push({ nhan: c.nhanKL, uuTien: 92, giu: true, tat: !hien.cot });
        for (const n of c.nhanMoc) dsNhan.push({ nhan: n, uuTien: 15, tat: !hien.cot });
      }
      dsNhan.push({ nhan: nhanThuoc, uuTien: 85, tat: !hien.thuoc });
      dsNhan.push({ nhan: nhanMayDo, uuTien: 80, tat: !hien.mayDo }, { nhan: nhanTH, uuTien: 70, tat: !hien.mayDo }, { nhan: nhanTruc, uuTien: 40, tat: !hien.mayDo });
      dsNhan.push({ nhan: nhanLan, uuTien: 30, tat: !nhomLan.visible });
      dsNhan.push({ nhan: nhanHuong, uuTien: 55, tat: !oTram });
      dsNhan.push({ nhan: nhanVong, uuTien: 75, tat: !hien.vong }, { nhan: nhanCanh, uuTien: 85, tat: !hien.vong || !hien.canh }, { nhan: nhanTT, uuTien: 60, tat: !hien.vong || !hien.lucTT });
      dsNhan.push({ nhan: nhanNgang, uuTien: 50, tat: !hien.vong }, { nhan: nhanDoc, uuTien: 50, tat: !hien.vong });
      dsNhan.push({ nhan: nhanRa, uuTien: 85, tat: !hien.ligo }, { nhan: nhanTay, uuTien: 70, tat: !hien.ligo }, { nhan: nhanBS, uuTien: 60, tat: !hien.ligo });
      dsNhan.push({ nhan: nhanLaser, uuTien: 50, tat: !hien.ligo }, { nhan: nhanG1, uuTien: 50, tat: !hien.ligo }, { nhan: nhanG2, uuTien: 50, tat: !hien.ligo });
      goNhanDeNhau(dsNhan, app.camera, app.rong, app.cao);

      // tiếng: chỉ khi mô hình đang chạy (hoặc đang kéo thước, cột: tiếng theo tay kéo); im khi tạm dừng
      const chay = dtg > 0 && (v > 0 || giu);
      datTieng(chay, nhuThat ? 0.012 : Math.min(0.08, Math.max(0.02, dtg * 1.5)));
    }

    function tanSoNguon() { return tau > 0 ? TC.tanSoThat(tau, ts) : 0; }
    function hud() {
      // Ô số liệu tối đa 5 dòng: bốn dòng đổi theo thời gian, rồi một dòng riêng của bước (trạm đo, máy dò hay cột khối
      // lượng). «Chiếu chậm» và «Tiếng» chỉ hiện khi còn chỗ; lời giảng đã nói hai điều này.
      const rieng = [];
      if (hien.vong || hien.ligo) {
        const [hp, hx] = bienDangHienThi();
        rieng.push([chuCanh("canh.tram-do", "Trạm đo"), chuCanh("canh.bien-dang-ve-tren-hinh-song-that-chi", "biến dạng vẽ trên hình {0}%, sóng thật chỉ cỡ 10⁻¹⁹ %", [so(Math.max(Math.abs(hp), Math.abs(hx)) * 50, 0)])]);
      }
      if (hien.mayDo) {
        const h = TC.heSoHuong(cosI());
        rieng.push([chuCanh("canh.may-do", "Máy dò"), chuCanh("canh.lech-truc-quay-bien-do-so-voi-doc", "lệch trục {0}° · biên độ «+» {1}%, «×» {2}%", [so(Math.acos(cosI()) / DO, 0), so(h.cong * 100, 0), so(Math.abs(h.cheo) * 100, 0)])]);
      }
      const cham = [chuCanh("canh.chieu-cham", "Chiếu chậm"), nhuThat ? chuCanh("canh.khong-nhanh-nhu-that", "không: nhanh như thật") : chuCanh("canh.lan", "{0} lần", [soNghia(TC.soLanChamLai(ts, 1), 2)])];
      const tieng = batTieng && tinTieng.doTo > 0.001 ? [[chuCanh("canh.tieng", "Tiếng"), `${so(tinTieng.f, 0)} Hz${heSoCao > 1 ? chuCanh("canh.da-nang-4", " (đã nâng ×4)") : chuCanh("canh.dung-tan-so-that", " (đúng tần số thật)")}${nhuThat ? chuCanh("canh.nhanh-nhu-that", " · nhanh như thật") : ''}`]] : [];
      if (tau <= 0) return [[chuCanh("canh.trang-thai", "Trạng thái"), chuCanh("canh.da-sap-nhap-song-cuoi-cung-dang-lan", "đã sáp nhập; sóng cuối cùng đang lan ra")], [chuCanh("canh.tan-so-luc-nhap-mo-hinh", "Tần số lúc nhập (mô hình)"), `${so(ts.fNhap, 0)} Hz`], ...rieng, cham, ...tieng].slice(0, 5);
      const tThat = tau * ts.sTL;                            // giây thật còn lại
      const f = tanSoNguon();
      const omT = Math.PI * f;                               // tốc độ góc quỹ đạo thật
      const MM = (m1 + m2) * M_MAT_TROI;
      const a = Math.cbrt((G * MM) / (omT * omT));
      const v = Math.cbrt(G * MM * omT) / C;
      return [
        [chuCanh("canh.con-lai-toi-luc-cham-nhau", "Còn lại tới lúc chạm nhau"), chuCanh("canh.thoi-gian-that", "{0} (thời gian thật)", [thoiGian(tThat)])],
        [chuCanh("canh.tan-so-song-hap-dan", "Tần số sóng hấp dẫn"), chuCanh("canh.hz-2-vong-quay-moi-giay", "{0} Hz = 2 × {1} vòng quay mỗi giây", [so(f, 0), so(f / 2, 1)])],
        [chuCanh("canh.hai-vat-cach-nhau", "Hai vật cách nhau"), `${so(a / 1000, 0)} km`],
        [chuCanh("canh.toc-do-tuong-doi", "Tốc độ tương đối"), chuCanh("canh.toc-do-anh-sang", "{0}% tốc độ ánh sáng", [so(v * 100, 0)])],
        ...(hien.cot ? [[chuCanh("canh.tan-so-luc-nhap-mo-hinh", "Tần số lúc nhập (mô hình)"), chuCanh("canh.hz-tong-m", "{0} Hz · tổng {1} M☉", [so(ts.fNhap, 0), so(m1 + m2, 1)])]] : []),
        ...rieng, cham, ...tieng,
      ].slice(0, 5);
    }

    return {
      scene, capNhat, hud, cauHinh,
      goc: (ten) => cauHinh({ mayAnh: ten }),
      datLucTT: () => cauHinh({ lucTT: !hien.lucTT }),
      ngheNhuThat, tatTieng,
      huy() { tatTieng(); },
      // cho các thử thách
      lechTruc: () => Math.acos(cosI()) / DO,
      phanCuc: () => phanCuc,
      theta: () => theta,
      fNguon: tanSoNguon,
      fNhap: () => ts.fNhap,
      dungYen: () => dangKeoThuoc || tocDo === 0 || !app.dangChay,
      daKeoThuoc: () => dem.thuoc > 0,
    };
  },
};
