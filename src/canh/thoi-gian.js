import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài — Thời gian trôi chậm gần khối lượng.
// Các đồng hồ đứng yên ở những bán kính khác nhau; chớp sáng leo ra ngoài và bị dịch đỏ.
// Đơn vị: rs = 1, c = 1. Thời gian mô phỏng là thời gian của người ở rất xa.
// Mặt lưới chỉ là sân khấu để đặt đồng hồ (hình dạng của nó là phần không gian, xem Bài 11); màu là nhịp đồng hồ.

import * as THREE from 'three';
import { so, luyThua, NGAY_GIAY, R_TRAI_DAT_KM, DO } from '../vat-ly/hang-so.js';
import { nhipDongHo } from '../vat-ly/schwarzschild.js';
import { chenhDoCao, doCaoChoNsNgay, chenhVeTinh, usHapDan, usTocDo, vQuyDao, R_GPS } from '../vat-ly/dong-ho-trai-dat.js';
import { MatCong, mauNhip, vongTrenMat } from '../khung/mat-cong.js';
import { khungDoThi, MAU } from '../khung/giao-dien.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, kep } from '../khung/ve.js';
import { taoDenCanh, taoDongHo, taoPhiHanhGia, taoThap, taoVeTinh } from '../khung/do-vat.js';
import { LoXo, vlKimLoai, vlSang, ghep, dat, domSang } from '../khung/do-vat-chung.js';
import { taoTraiDat, taoLoDenNho } from '../khung/hanh-tinh.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('thoi-gian', khoa, goc, thamSo);

const R = String.raw;

const R_MAX = 10;
const VONG_GIAY = 8;      // kim quay một vòng sau 8 đơn vị thời gian riêng
const CHU_KY_CHOP = 2;    // phi hành gia phát chớp mỗi 2 đơn vị thời gian của mình
const DS_R = [1.06, 1.5, 2.5, 4.5, 8];

// Sân khấu Trái Đất (bước 4–6). Đơn vị cảnh: Trái Đất bán kính RE_C, tâm ở TAM_TD, tháp dựng ở đỉnh quả cầu (gốc toạ độ).
const RE_C = 2;
const TAM_TD = new THREE.Vector3(0, -RE_C, 0);
const TOKYO = [35.71, 139.81];                 // vĩ độ, kinh độ của Tokyo Skytree (độ)
const H_THAP = 634;                            // chiều cao tháp, mét
const TH = 1.2;                                // chiều cao tháp khi vẽ, đơn vị cảnh
const PHONG_DAI_THAP = TH / ((H_THAP * RE_C) / (R_TRAI_DAT_KM * 1000));   // ≈ 6 000 lần
const R_TD_KM = R_TRAI_DAT_KM;
const X_TAY_THAP = 0.27, X_DH_THAP = 0.45;     // tay nắm ở đầu giá, đồng hồ treo ngoài giá
const R_VT_MIN = 1.06, R_VT_MAX = 6;           // vệ tinh kéo được trong khoảng này (theo bán kính Trái Đất)
// Phóng đại độ chênh nhịp cho kim và tiếng tích (chênh lệch thật quá nhỏ để thấy, nghe): ghi rõ trong lời giảng.
const K_THAP = 4e12, K_VT = 4e8;
const chenhThap = (h) => chenhDoCao(h);
const chenhVT = (r) => chenhVeTinh(r);
const H_2NS = doCaoChoNsNgay(2);               // ≈ 212 m: đích của thử thách bước 4

const VI_DU = {
  gps: chuCanh("canh.ve-tinh-gps-bay-cao-khoang-20-200", "<span class=\"ten\">Vệ tinh GPS</span><br>Bay cao khoảng 20 200 km. Hấp dẫn ở đó yếu hơn nên đồng hồ <b>nhanh thêm 45,7 micro giây mỗi ngày</b>; nhưng vệ tinh chạy 3,9 km/s nên chậm đi 7,2. Tổng cộng nhanh hơn mặt đất <b>38,5 micro giây mỗi ngày</b>. Không bù phần này thì vị trí tính ra sai thêm khoảng 11,5 km mỗi ngày."),
  skytree: chuCanh("canh.thap-tokyo-skytree-nam-2020-takamoto-va-cong", "<span class=\"ten\">Tháp Tokyo Skytree</span><br>Năm 2020, Takamoto và cộng sự (nhóm của Katori Hidetoshi, RIKEN và Đại học Tokyo) đặt hai đồng hồ quang học ở chân tháp và ở đài quan sát cao hơn khoảng 450 m. Nhịp chênh gh/c² ≈ 4,9 × 10⁻¹⁴: đồng hồ trên cao nhanh hơn khoảng <b>4,2 phần tỉ giây mỗi ngày</b>, khớp với thuyết tương đối rộng."),
  everest: chuCanh("canh.dinh-everest-song-mot-nam-tren-dinh-cao", "<span class=\"ten\">Đỉnh Everest</span><br>Sống một năm trên đỉnh cao 8 849 m, bạn già hơn người ở mực nước biển khoảng <b>30 micro giây</b>."),
  matdat: chuCanh("canh.mat-dat-so-voi-o-rat-xa-dong", "<span class=\"ten\">Mặt đất so với ở rất xa</span><br>Đồng hồ trên mặt đất chậm hơn đồng hồ ở rất xa Trái Đất GM/(Rc²) ≈ 7 × 10⁻¹⁰, tức khoảng <b>22 mili giây mỗi năm</b> (chưa tính Mặt Trời)."),
  mattroi: chuCanh("canh.be-mat-mat-troi-dong-ho-o-do", "<span class=\"ten\">Bề mặt Mặt Trời</span><br>Đồng hồ ở đó chậm hơn ở xa <b>2,1 phần triệu</b>, tức <b>67 giây mỗi năm</b>. Ánh sáng rời Mặt Trời vì thế hơi lệch về phía đỏ, cỡ như của một nguồn sáng đang lùi xa 636 m/s."),
  neutron: chuCanh("canh.be-mat-sao-neutron-sao-nang-1-4", "<span class=\"ten\">Bề mặt sao neutron</span><br>Sao nặng 1,4 lần Mặt Trời, bán kính 12 km: bề mặt nằm ở khoảng 2,9 r<sub>s</sub>. Đồng hồ ở đó chỉ chạy bằng <b>81%</b> so với ở xa: mỗi giờ chậm khoảng 11 phút."),
};

// Kéo giả bằng sự kiện con trỏ, chỉ dùng khi chụp ảnh kiểm thử (tham số thu=keo-…): nắm tay nắm ở tuTG rồi kéo
// qua tám bước tới điểm denTG (toạ độ cảnh), thả ra. Đi qua đúng đường xử lý của khung tương tác.
function keoGia(app, tuTG, denTG) {
  const cv = app.renderer.domElement, r = cv.getBoundingClientRect();
  app.camera.updateMatrixWorld();
  const mh = (p) => { const v = p.clone().project(app.camera); return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]; };
  const [x0, y0] = mh(tuTG), [x1, y1] = mh(denTG);
  const su = (loai, x, y, nut) => cv.dispatchEvent(new PointerEvent(loai, {
    clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, bubbles: true, cancelable: true,
    buttons: nut, button: loai === 'pointermove' ? -1 : 0,
  }));
  su('pointermove', x0, y0, 0);
  su('pointerdown', x0, y0, 1);
  for (let i = 1; i <= 8; i++) su('pointermove', x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8, 1);
  su('pointerup', x1, y1, 0);
}

// nghịch đảo tọa độ "rùa" r* = r + ln(r − 1): dùng cho chớp sáng đi ra theo phương bán kính
function rTuRSao(rs) {
  let r = rs > 2 ? rs - Math.log(Math.max(1e-9, rs - 1)) : 1 + Math.exp(rs - 1);
  for (let i = 0; i < 30; i++) {
    const f = r + Math.log(r - 1) - rs;
    const d = (f * (r - 1)) / r;
    r = Math.max(1 + 1e-12, r - d);
    if (Math.abs(d) < 1e-10) break;
  }
  return r;
}

export default {
  id: 'thoi-gian',
  ten: 'Thời gian trôi chậm gần khối lượng',
  moTa: 'Đồng hồ ở sâu chạy chậm; chớp sáng leo ra bị đỏ đi; GPS phải tính đến',
  yChinh: 'Càng gần một khối lượng lớn, thời gian riêng trôi càng chậm so với ở xa: $\\dd\\tau/\\dd t = \\sqrt{1 - r_s/r}$. Không phải đồng hồ hỏng: mọi quá trình ở đó, từ nguyên tử tới nhịp tim, đều chậm như nhau. Gần mặt đất, hai độ cao cách nhau $h$ chênh nhịp $gh/c^2$; đồng hồ quang học đo được cả chênh lệch 1 mm, và GPS phải bù 38,5 micro giây mỗi ngày. Chính sự chênh nhịp này làm vật rơi.',
  mayAnh: { viTri: [2.5, 7.2, 15], dich: [0, -0.6, 0], fov: 42, min: 1.2, max: 50, gocMax: Math.PI * 0.6 },
  // mặt cong kính sáng lên ở góc nhìn sát: nâng ngưỡng quầng để mặt không bị mờ sữa
  hinh: { nguong: 1.05, quang: 0.45 },
  giaiThich: R`
    - Đồng hồ đứng yên ở bán kính $r$ chạy với nhịp $\sqrt{1 - r_s/r}$ so với đồng hồ ở rất xa, trong đó $r_s = 2GM/c^2$. Ở chân trời sự kiện nhịp tiến về 0.
    - Không phải đồng hồ hỏng: thời gian riêng ở đó trôi ít hơn. Hai người ở hai độ cao **đồng ý** với nhau rằng đồng hồ ở thấp chạy chậm (khác với giãn thời gian do tốc độ ở Bài 6).
    - Chớp sáng phát đều ở dưới tới trên cao thưa hơn, ánh sáng đỏ hơn: dịch chuyển đỏ hấp dẫn và chậm thời gian là một hiện tượng.
    - Gần mặt đất: chênh nhịp giữa hai độ cao là $gh/c^2$. Đo được: Pound và Rebka 1960 (22,5 m), Chou 2010 (33 cm), Skytree 2020 (450 m), Bothwell 2022 (1 mm).
    - GPS: +45,7 micro giây mỗi ngày do hấp dẫn, −7,2 do tốc độ, tổng +38,5.
    - Vật rơi tự do đi theo đường cho thời gian riêng dài nhất; chênh nhịp theo độ cao bẻ đường thế giới về phía khối lượng.`,

  baiGiang: {
    mucTieu: [
      'Dùng được công thức $\\dd\\tau/\\dd t = \\sqrt{1 - r_s/r}$ để tính nhịp đồng hồ ở gần một khối lượng.',
      'Giải thích được vì sao giãn thời gian do hấp dẫn và dịch chuyển đỏ hấp dẫn là một hiện tượng.',
      'Suy ra và dùng được công thức trường yếu $gh/c^2$ cho hai đồng hồ ở hai độ cao.',
      'Tính lại được từng phần của con số 38,5 micro giây mỗi ngày của GPS.',
      'Nói được vì sao chênh nhịp thời gian theo độ cao làm vật rơi.',
    ],
    buoc: [
      {
        ten: 'Năm chiếc đồng hồ đứng yên quanh một lỗ đen',
        noiDung: R`
          Năm chiếc đồng hồ trắng đứng yên ở năm độ sâu quanh một lỗ đen không quay. Chiếc đồng hồ xanh ở góc trên là **đồng hồ ở rất xa**, nơi hấp dẫn không đáng kể. Nhìn kim: đồng hồ càng gần chân trời quay càng chậm. Con số cạnh mỗi đồng hồ là nhịp của nó so với đồng hồ ở xa.

          $$ \frac{\dd\tau}{\dd t} = \sqrt{1 - \frac{r_s}{r}}, \qquad r_s = \frac{2GM}{c^2} $$

          - $\dd\tau$: thời gian đồng hồ đứng yên tại chỗ đếm được ({{thời gian riêng}} của nó, như ở Bài 6);
          - $\dd t$: thời gian đồng hồ ở rất xa đếm được trong cùng quãng ấy;
          - $r_s$: {{bán kính Schwarzschild}} của khối lượng $M$; $r$: vị trí của đồng hồ.

          > [Ví dụ] Ở $r = 2\,r_s$: $\sqrt{1 - 1/2} = 0{,}707$. Đồng hồ ở đó đếm 70,7 giây trong lúc đồng hồ ở xa đếm 100 giây. Ở $r = 1{,}5\,r_s$: 57,7%. Ở $r = 1{,}01\,r_s$: chưa tới 10%.

          > [Lưu ý] $r$ ở đây không phải khoảng cách đo bằng thước tới tâm, mà là **chu vi** vòng tròn qua chỗ đó chia cho $2\pi$. Bài 11 giải thích vì sao phải phân biệt. Mặt lưới chỉ là sân khấu để đặt đồng hồ; hình dạng của nó là phần không gian, cũng để Bài 11. Bài này chỉ cần nhìn **kim** và **màu**: xanh là gần như ở xa, vàng cam là chậm hẳn, đỏ sẫm là gần đứng lại.

          > [Thử ngay] Quả cầu đen trong họng mặt cong là lỗ đen; vòng đỏ cam phát sáng là chân trời sự kiện. Rê chuột lên một đồng hồ để đọc nhịp của nó, bấm vào đồng hồ để đưa phi hành gia (đồng hồ vàng) tới đúng bán kính ấy.
          > [[Nhìn gần chân trời|gan]] [[Nhìn toàn cảnh|tong]] [[Chiếu nhanh gấp 4|nhanh]]`,
        vao: (c) => c.cauHinh({ canh: 'loden', r: 2, tocDo: 1.6, viDu: 'gps', mayAnh: 'tong' }),
        nut: { gan: (c) => c.goc('gan'), tong: (c) => c.goc('tong'), nhanh: (c) => c.cauHinh({ tocDo: 4 }) },
      },
      {
        ten: 'Không phải đồng hồ hỏng',
        noiDung: R`
          Đồng hồ vàng to là của một **phi hành gia** đứng yên trên một bệ ở $r = 2\,r_s$ (bằng động cơ đẩy ngược ra ngoài, như người đứng trên sàn tên lửa ở Bài 7). Đồng hồ ấy chạy bằng 70,7% đồng hồ ở xa.

          Đồng hồ không hỏng. Mọi quá trình ở chỗ phi hành gia đều chậm như nhau: dao động của nguyên tử trong đồng hồ, nhịp tim, phản ứng hoá học trong tế bào. Vì thế phi hành gia **không thấy gì khác thường**: một giây của mình vẫn là một giây. Chỉ khi so với đồng hồ ở nơi khác mới thấy lệch. Nói đúng hơn: **thời gian riêng ở chỗ sâu trôi ít hơn**.

          Khác với giãn thời gian do tốc độ ở Bài 6, ở đây không có chuyện «mỗi người thấy người kia chậm». Phi hành gia nhìn ra ngoài thấy vũ trụ tua nhanh; người ở xa nhìn vào thấy phi hành gia như phim quay chậm. **Hai người đồng ý** đồng hồ nào chạy chậm. Nếu phi hành gia bay ra gặp người ở xa, người ấy sẽ già hơn.

          > [Thử ngay] Kéo chấm vàng ở chân bệ phi hành gia dọc mặt cong, lại gần hay ra xa lỗ đen. Kim đồng hồ vàng chậm lại khi xuống sâu.
          > [[Đưa phi hành gia ra 8 rs|xa]] [[Đưa vào 1,2 rs|gan12]] [[Về 2 rs|ve2]]

          > [Lưu ý] Âm thanh: tiếng tích cao bên trái là đồng hồ ở rất xa, tiếng tích trầm bên phải là đồng hồ của phi hành gia. Mỗi tiếng là một giây theo chính đồng hồ đó (đã chiếu nhanh theo thanh «Tốc độ chiếu»). Quanh lỗ đen chênh lệch đủ lớn nên tai nghe đúng tỉ lệ thật, không phóng đại: ở $2\,r_s$, cứ 10 tiếng cao thì có khoảng 7 tiếng trầm.

          +++ Đi sâu: công thức nhịp đồng hồ lấy từ đâu
          Bên ngoài một khối cầu không quay, không-thời gian được mô tả bằng {{metric Schwarzschild}} (Karl Schwarzschild tìm ra cuối năm 1915):

          $$ \dd s^2 = -\left(1 - \frac{r_s}{r}\right)c^2\dd t^2 + \frac{\dd r^2}{1 - r_s/r} + r^2\left(\dd\theta^2 + \sin^2\theta\,\dd\phi^2\right). $$

          Ở rất xa ($r \to \infty$) nó trở về khoảng không-thời gian phẳng của Bài 6, nên $t$ là thời gian của đồng hồ ở rất xa. Đồng hồ đứng yên có $\dd r = \dd\theta = \dd\phi = 0$, và thời gian riêng của nó là $c^2\dd\tau^2 = -\dd s^2$:

          $$ c^2\dd\tau^2 = \left(1 - \frac{r_s}{r}\right)c^2\dd t^2 \ \Rightarrow\ \dd\tau = \sqrt{1 - \frac{r_s}{r}}\;\dd t. $$

          Đó là toàn bộ phép tính. Thừa số đứng trước $c^2\dd t^2$ nhỏ hơn 1 ở gần khối lượng: đây là phần **thời gian** của độ cong.
          +++`,
        vao: (c) => c.cauHinh({ canh: 'loden', r: 2, tocDo: 1.6, viDu: 'gps', mayAnh: 'tong' }),
        nut: { xa: (c) => c.cauHinh({ r: 8 }), gan12: (c) => c.cauHinh({ r: 1.2 }), ve2: (c) => c.cauHinh({ r: 2 }) },
        thuThach: {
          de: 'Kéo phi hành gia tới chỗ đồng hồ vàng chạy bằng **đúng một nửa** đồng hồ ở xa (nhịp 50%, lệch không quá 2%).',
          kiem: (c) => Math.abs(c.nhipPhg() - 0.5) <= 0.02,
          goiY: R`Giải $\sqrt{1 - r_s/r} = 1/2$: $1 - r_s/r = 1/4$, tức $r = \tfrac43\,r_s \approx 1{,}33\,r_s$. Theo dõi số phần trăm cạnh đồng hồ vàng.`,
        },
      },
      {
        ten: 'Chớp sáng và dịch chuyển đỏ',
        noiDung: R`
          Cứ 2 giây theo đồng hồ của mình, phi hành gia phát một chớp sáng ra ngoài. Các chấm sáng leo dọc đường mờ tới **trạm thu ở xa** (chấm xanh ở mép lưới). Thẻ ở bảng điều khiển ghi khoảng cách giữa hai chớp tới trạm.

          Ở $r = 2\,r_s$, trạm nhận một chớp mỗi **2,83 giây**, đúng bằng $2 / 0{,}707$. Không phải ánh sáng đi chậm dần: mọi chớp đi cùng một con đường trong một không-thời gian không đổi theo thời gian, nên chớp nào cũng mất đúng một khoảng $t$ như nhau. Khoảng cách giữa hai chớp vì thế giữ nguyên trên đường đi, và đồng hồ ở xa đếm được $2 / \sqrt{1 - r_s/r}$ giây.

          Sóng ánh sáng cũng là một chiếc đồng hồ: mỗi đỉnh sóng là một «tích tắc». Trạm thu nhận các đỉnh sóng thưa hơn lúc phát, tức tần số thấp hơn, bước sóng dài hơn: ánh sáng **đỏ đi**. Đó là {{dịch chuyển đỏ hấp dẫn}}.

          $$ 1 + z = \frac{\lambda_{\text{nhận}}}{\lambda_{\text{phát}}} = \frac{1}{\sqrt{1 - r_s/r}} $$

          Ở $r = 2\,r_s$: $z = 0{,}414$. Thời gian chậm và ánh sáng đỏ đi là **một hiện tượng nhìn từ hai phía**.

          > [Lưu ý] Màu của chấm sáng (xanh lục ngả dần sang đỏ khi leo lên) chỉ để chỉ chiều dịch chuyển, không phải màu thật của ánh sáng.

          > [Thử ngay] Kéo phi hành gia lại gần lỗ đen rồi lắng nghe: tiếng «ting» mỗi khi một chớp tới trạm thu thưa dần và trầm dần.
          > [[Phi hành gia ở 1,1 rs|r11]] [[Ở 2 rs|r2]] [[Ở 5 rs|r5]]

          > [Lưu ý] Âm thanh: mỗi chớp tới trạm thu kêu một tiếng. Phi hành gia «phát» mọi tiếng ở cùng một cao độ, 880 Hz theo đồng hồ của mình; ở trạm thu tiếng trầm đi đúng theo tỉ số $\sqrt{1 - r_s/r}$ như ánh sáng (ở $2\,r_s$ còn 622 Hz). Con số 880 Hz chỉ chọn cho dễ nghe.`,
        vao: (c) => c.cauHinh({ canh: 'loden', r: 2, tocDo: 2.5, viDu: 'gps', mayAnh: 'chop' }),
        nut: { r11: (c) => c.cauHinh({ r: 1.1 }), r2: (c) => c.cauHinh({ r: 2 }), r5: (c) => c.cauHinh({ r: 5 }) },
        thuThach: {
          de: 'Kéo phi hành gia tới chỗ trạm thu nhận các chớp cách nhau **2,5 giây**, tức $z = 0{,}25$ (lệch không quá 0,05 giây).',
          kiem: (c) => Math.abs(c.khoangNhanLyThuyet() - 2.5) <= 0.05,
          goiY: R`Cần $1/\sqrt{1 - r_s/r} = 2{,}5/2 = 1{,}25$, tức nhịp 80%: $r = 1/(1 - 0{,}64) \approx 2{,}78\,r_s$.`,
        },
      },
      {
        ten: 'Gần mặt đất: chênh nhịp gh/c²',
        noiDung: R`
          Quanh Trái Đất, $r_s$ chỉ khoảng 9 mm trong khi bán kính là 6 371 km, nên $r_s/r$ cực nhỏ và nhịp rất gần 1. Khi đó dùng xấp xỉ $\sqrt{1 - x} \approx 1 - x/2$:

          $$ \frac{\dd\tau}{\dd t} \approx 1 - \frac{GM}{rc^2}. $$

          So hai đồng hồ, một ở mặt đất, một ở cao hơn $h$ (nhỏ so với bán kính Trái Đất): đồng hồ trên cao **nhanh hơn** một phần

          $$ \frac{\Delta\tau}{\tau} \approx \frac{gh}{c^2}, $$

          trong đó $g$ là gia tốc rơi ở đó. Đây đúng là kết quả của tên lửa ở Bài 8 (đồng hồ trần nhanh hơn sàn theo hệ số $1 + ah/c^2$), chỉ thay $a$ bằng $g$. Nguyên lý tương đương của Bài 7 đã báo trước điều này.

          > [Ví dụ] Nâng đồng hồ lên 1 m: $gh/c^2 \approx 1{,}09 \times 10^{-16}$, tức nhanh hơn 9,4 phần nghìn tỉ giây mỗi ngày. Mặt đất so với ở rất xa: chậm $7 \times 10^{-10}$, khoảng 22 mili giây mỗi năm. Sống một năm trên đỉnh Everest, bạn già hơn người ở mực nước biển khoảng 30 micro giây.

          > [Thử ngay] Mô hình chuyển sang Trái Đất. Kéo đồng hồ vàng lên xuống dọc tháp và lắng nghe: tiếng tích của nó (bên phải) nhanh hơn tiếng của đồng hồ chân tháp (bên trái), càng lên cao càng nhanh.
          > [[Mặt đất và ở rất xa|matdat]] [[Everest|everest]]

          > [Lưu ý] Chênh lệch thật quá nhỏ để thấy hay nghe. Trên hình tháp được vẽ cao gấp khoảng 6 000 lần so với Trái Đất, và độ chênh nhịp của đồng hồ trên tháp được phóng đại $4 \times 10^{12}$ lần: ở 450 m kim chạy nhanh hơn chân tháp khoảng 20%. Con số ghi cạnh đồng hồ là con số thật.

          +++ Đi sâu: từ √(1 − rs/r) tới gh/c², từng dòng
          Gọi $R$ là bán kính Trái Đất. Nhịp ở $R$ và ở $R + h$:

          $$ n(R) \approx 1 - \frac{GM}{Rc^2}, \qquad n(R+h) \approx 1 - \frac{GM}{(R+h)c^2}. $$

          Hiệu hai nhịp:

          $$ n(R+h) - n(R) \approx \frac{GM}{c^2}\left(\frac1R - \frac1{R+h}\right) = \frac{GM}{c^2}\cdot\frac{h}{R(R+h)} \approx \frac{GM}{R^2}\cdot\frac{h}{c^2} = \frac{gh}{c^2}. $$

          Bước cuối dùng $g = GM/R^2$ và $h \ll R$. Chia cho nhịp (gần bằng 1) được tỉ lệ chênh. Thay số với $h = 450$ m: công thức đầy đủ và công thức gần đúng khớp nhau tới một phần nghìn.

          Một cách nhìn khác: $GM/r$ chính là độ sâu của thế hấp dẫn Newton $\Phi = -GM/r$. Vậy nhịp đồng hồ là $1 + \Phi/c^2$: **thế hấp dẫn của Newton thật ra là độ chậm của thời gian**, nhân với $c^2$.
          +++`,
        vao: (c) => c.cauHinh({ canh: 'traidat', h: 450, rVT: R_GPS, soSanh: 'thap', tocDo: 1.6, viDu: 'matdat', mayAnh: 'thap' }),
        nut: { matdat: (c) => c.cauHinh({ viDu: 'matdat' }), everest: (c) => c.cauHinh({ viDu: 'everest' }) },
        thuThach: {
          de: 'Kéo đồng hồ trên tháp tới độ cao mà nó nhanh hơn đồng hồ chân tháp **2 phần tỉ giây mỗi ngày** (lệch không quá 0,1).',
          kiem: (c) => Math.abs(c.nsNgayThap() - 2) <= 0.1,
          goiY: R`Một ngày có 86 400 giây, nên cần $gh/c^2 = 2 \times 10^{-9}/86\,400 \approx 2{,}3 \times 10^{-14}$, tức $h \approx 212$ m.`,
        },
      },
      {
        ten: 'Đo được: từ tháp 22,5 m tới 1 mm',
        noiDung: R`
          Chênh lệch $gh/c^2$ nhỏ đến mức suốt nhiều chục năm sau khi Einstein tiên đoán, không ai đo được nó trên Trái Đất.

          > [Lịch sử] Năm 1960, Robert Pound và Glen Rebka bắn tia gamma của sắt-57 dọc một tháp cao 22,5 m ở Đại học Harvard. Chênh lệch cần đo là $gh/c^2 \approx 2{,}46 \times 10^{-15}$. Họ dùng hiệu ứng Mössbauer (tia gamma phát và hấp thụ với tần số cực kỳ sắc nét) để thấy được độ dịch ấy, và kết quả khớp với tiên đoán trong khoảng 10%.

          Ngày nay đồng hồ quang học đủ chính xác để đặt ngay trên bàn:

          | Năm | Ai, ở đâu | Chênh độ cao | $gh/c^2$ |
          |---|---|---|---|
          | 1960 | Pound và Rebka, tháp Harvard | 22,5 m | $2{,}46 \times 10^{-15}$ |
          | 2010 | Chou và cộng sự, NIST (Mỹ) | 33 cm | $3{,}6 \times 10^{-17}$ |
          | 2020 | Takamoto và cộng sự, Tokyo Skytree | 450 m | $4{,}9 \times 10^{-14}$ |
          | 2022 | Bothwell và cộng sự, JILA (Mỹ) | 1 mm | $1{,}1 \times 10^{-19}$ |

          Năm 2010, nâng một đồng hồ lên 33 cm, tức cỡ một bậc cầu thang, là đã thấy nó chạy nhanh hơn. Năm 2022, nhóm ở JILA đo được chênh nhịp giữa phần trên và phần dưới của **cùng một đám nguyên tử** chỉ dày 1 mm.

          > [Lịch sử] Năm 1971, Hafele và Keating mang đồng hồ nguyên tử bay vòng quanh Trái Đất trên máy bay chở khách, về hướng đông rồi về hướng tây (công bố năm 1972). Kết quả gộp cả hai phần: chậm do tốc độ (Bài 6) và nhanh do bay cao.

          > [Thử ngay] Rê chuột lên đồng hồ chân tháp và đồng hồ trên tháp để đọc số. Nút «Tokyo Skytree» đưa đồng hồ lên đúng đài quan sát 450 m, nơi nhóm Takamoto đặt đồng hồ thứ hai.
          > [[Tokyo Skytree|skytree]] [[Mặt đất và ở rất xa|matdat]]`,
        vao: (c) => c.cauHinh({ canh: 'traidat', h: 450, rVT: R_GPS, soSanh: 'thap', tocDo: 1.6, viDu: 'skytree', mayAnh: 'thap' }),
        nut: { skytree: (c) => c.cauHinh({ viDu: 'skytree', h: 450 }), matdat: (c) => c.cauHinh({ viDu: 'matdat' }) },
      },
      {
        ten: 'GPS: thuyết tương đối trong túi bạn',
        noiDung: R`
          Mỗi vệ tinh GPS mang đồng hồ nguyên tử và liên tục phát đi giờ của mình. Điện thoại so giờ từ bốn vệ tinh trở lên để tính khoảng cách tới từng vệ tinh, rồi suy ra vị trí. Sai 1 micro giây là sai gần 300 m.

          Đồng hồ trên vệ tinh lệch so với mặt đất vì hai lý do ngược chiều nhau:

          - **Hấp dẫn** (bài này): vệ tinh ở cao khoảng 20 200 km, nơi thời gian trôi nhanh hơn mặt đất: **+45,7 micro giây mỗi ngày**.
          - **Tốc độ** (Bài 6): vệ tinh bay 3,9 km/s nên đồng hồ chậm đi: **−7,2 micro giây mỗi ngày**.

          Tổng cộng đồng hồ trên vệ tinh nhanh hơn **38,5 micro giây mỗi ngày**. Hệ thống phải bù phần này cho đồng hồ trên vệ tinh. Không bù thì vị trí tính ra trôi thêm khoảng 11,5 km mỗi ngày.

          > [Hiểu sai thường gặp] «GPS chỉ cần thuyết tương đối hẹp.» Ngược lại: phần lớn hơn hẳn là của thuyết tương đối rộng, và hai phần ngược dấu nhau. Chỉ tính phần tốc độ thì kết quả sai cả dấu.

          > [Thử ngay] Kéo vệ tinh lại gần hay ra xa Trái Đất. Ở gần, phần tốc độ thắng: đồng hồ vệ tinh chậm hơn mặt đất. Ở xa, phần hấp dẫn thắng. Nhãn cạnh vệ tinh ghi cả hai phần.
          > [[Xem thẻ GPS|gps]]

          > [Lưu ý] Khoảng cách từ tâm Trái Đất tới vệ tinh vẽ đúng tỉ lệ (vòng nét đứt là quỹ đạo GPS thật); vệ tinh và đồng hồ vẽ to cho dễ nhìn. Kim và tiếng tích của đồng hồ vệ tinh phóng đại độ chênh $4 \times 10^{8}$ lần.

          +++ Đi sâu: tính lại 38,5 micro giây, từng dòng
          Số liệu: $GM_{\oplus} = 3{,}986 \times 10^{14}$ m³/s², bán kính Trái Đất $R = 6\,371$ km, bán kính quỹ đạo GPS $r = 26\,560$ km, $c^2 = 8{,}988 \times 10^{16}$ m²/s², một ngày $= 86\,400$ s.

          **1. Phần hấp dẫn.** Nhịp ở bán kính $r$ là $1 - GM/(rc^2)$. Hiệu nhịp giữa vệ tinh và mặt đất:

          $$ \frac{GM}{c^2}\left(\frac1R - \frac1r\right) = 4{,}435 \times 10^{-3}\ \text{m} \times \left(1{,}570 \times 10^{-7} - 3{,}765 \times 10^{-8}\right)\ \text{m}^{-1} \approx 5{,}29 \times 10^{-10}. $$

          Nhân với 86 400 s: **+45,7 micro giây mỗi ngày**.

          **2. Phần tốc độ.** Vận tốc quỹ đạo tròn $v = \sqrt{GM/r} \approx 3\,874$ m/s. Đồng hồ chuyển động chậm theo hệ số $1/\gamma \approx 1 - v^2/(2c^2)$ (Bài 6):

          $$ \frac{v^2}{2c^2} = \frac{GM}{2rc^2} \approx 8{,}35 \times 10^{-11}. $$

          Nhân với 86 400 s: **−7,2 micro giây mỗi ngày**.

          **3. Cộng lại:** $45{,}7 - 7{,}2 = 38{,}5$ micro giây mỗi ngày. Nhân với $c$: khoảng 11,5 km.

          Phép tính đã bỏ qua vài phần nhỏ: Trái Đất tự quay làm đồng hồ ở xích đạo chậm thêm cỡ 0,1 micro giây mỗi ngày; quỹ đạo vệ tinh hơi dẹt nên độ lệch dao động nhẹ quanh giá trị trung bình.
          +++`,
        vao: (c) => c.cauHinh({ canh: 'traidat', h: 450, rVT: R_GPS, soSanh: 'vetinh', tocDo: 1.6, viDu: 'gps', mayAnh: 'gps' }),
        nut: { gps: (c) => c.cauHinh({ viDu: 'gps' }) },
        thuThach: {
          de: 'Tìm quỹ đạo tròn mà đồng hồ vệ tinh chạy **bằng** đồng hồ mặt đất: phần nhanh lên do ở cao bù vừa hết phần chậm đi do tốc độ (bỏ qua Trái Đất tự quay). Đạt khi lệch dưới 2 micro giây mỗi ngày.',
          kiem: (c) => Math.abs(c.usNgayVT()) <= 2,
          goiY: R`Cho $\frac{GM}{c^2}\left(\frac1R - \frac1r\right) = \frac{GM}{2rc^2}$ rồi giải ra $r$: được $r = 1{,}5\,R$, tức cao khoảng 3 190 km.`,
        },
      },
      {
        ten: 'Mặt Trời, sao neutron, sát chân trời',
        noiDung: R`
          Trên Trái Đất, hiệu ứng chưa tới một phần tỉ. Ở những vật đặc hơn nó lớn dần. Cột giữa là độ đặc $r_s/r$ tại chỗ đặt đồng hồ:

          | Nơi | Độ đặc | Nhịp so với ở xa |
          |---|---|---|
          | Mặt đất | $1{,}4 \times 10^{-9}$ | chậm 22 mili giây mỗi năm |
          | Bề mặt Mặt Trời | $4{,}2 \times 10^{-6}$ | chậm 67 giây mỗi năm |
          | Bề mặt sao neutron (1,4 khối lượng Mặt Trời, bán kính 12 km) | 0,34 | 81%: mỗi giờ chậm khoảng 11 phút |
          | $r = 1{,}01\,r_s$ quanh lỗ đen | 0,99 | 9,95% |
          | Chân trời sự kiện | 1 | tiến về 0 |

          Ánh sáng rời bề mặt Mặt Trời đỏ đi 2,1 phần triệu. Các vạch quang phổ của Mặt Trời vì thế hơi lệch về phía đỏ, cỡ như của một nguồn sáng đang lùi xa 636 m/s. Đo được điều này rất khó, vì mặt Mặt Trời luôn sôi sục làm các vạch dịch qua lại.

          Sát chân trời, nhịp tiến về 0: nhìn từ xa, phi hành gia ở đó như đứng hình, chớp sáng tới cực thưa và đỏ sẫm. Bản thân phi hành gia vẫn sống bình thường.

          > [Thử ngay] Kéo phi hành gia lại gần chân trời và xem đồ thị nhịp ở bảng điều khiển.
          > [[Bề mặt sao neutron (2,9 rs)|nt]] [[Ở 1,01 rs|sat]] [[Xem thẻ Mặt Trời|mt]]`,
        vao: (c) => c.cauHinh({ canh: 'loden', r: 2.9, tocDo: 1.6, viDu: 'neutron', mayAnh: 'gan' }),
        nut: {
          nt: (c) => c.cauHinh({ r: 2.9, viDu: 'neutron' }),
          sat: (c) => c.cauHinh({ r: 1.01, mayAnh: 'gan' }),
          mt: (c) => c.cauHinh({ viDu: 'mattroi' }),
        },
      },
      {
        ten: 'Vì sao vật rơi: chênh nhịp bẻ cong đường thế giới',
        noiDung: R`
          Ở Bài 6, giữa hai sự kiện cho trước, đường thế giới **thẳng** là đường có thời gian riêng **dài nhất**; mọi đường vòng vèo đều cho ít thời gian riêng hơn (anh em sinh đôi). Thuyết tương đối rộng giữ nguyên quy tắc ấy cho không-thời gian cong:

          > [Định nghĩa] Vật rơi tự do đi theo đường thế giới có **thời gian riêng dài nhất** giữa hai sự kiện (xét các đường đủ ngắn và nằm sát nhau). Đường ấy gọi là {{đường trắc địa}}.

          Giờ thêm chuyện thời gian trôi nhanh hơn ở trên cao. Ném một quả bóng lên rồi bắt lại sau 2 giây. Đường nào cho đồng hồ trên quả bóng nhiều thời gian nhất?

          - Lên cao thì **lợi**: ở đó đồng hồ chạy nhanh hơn.
          - Nhưng muốn lên cao rồi về đúng hẹn thì phải bay nhanh, mà bay nhanh thì **thiệt** (giãn thời gian do tốc độ).

          Đường cân bằng đúng lợi và thiệt là **đường parabol** mà Newton tính được: bóng lên cao 4,9 m. Đồng hồ trên quả bóng lợi $7{,}1 \times 10^{-16}$ giây nhờ độ cao, thiệt $3{,}6 \times 10^{-16}$ giây vì tốc độ. Lên cao hơn hay thấp hơn đều cho tổng ít hơn.

          > [Tóm lại] Không cần lực nào kéo quả bóng xuống. Chỉ cần thời gian ở thấp trôi chậm hơn ở cao một chút xíu (cỡ $10^{-16}$ cho mỗi mét độ cao), đường thế giới «thẳng nhất» đã tự cong về phía mặt đất. Với vật chậm, gần như toàn bộ hấp dẫn đến từ **phần thời gian** của độ cong. Bài 10 vẽ đường ấy trên một mặt không-thời gian cong.

          [[Phi hành gia ở 2 rs|r2]] [[Nhìn toàn cảnh|tong]]

          +++ Đi sâu: thời gian riêng cực đại cho ra định luật Newton
          Với vật chậm ở độ cao $z$ gần mặt đất, nhịp đồng hồ trên vật gồm hai phần: lợi $gz/c^2$ do độ cao, thiệt $v^2/(2c^2)$ do tốc độ. Thời gian riêng đi từ lúc ném tới lúc bắt:

          $$ \tau \approx \int \left(1 + \frac{gz}{c^2} - \frac{v^2}{2c^2}\right)\dd t = T - \frac{1}{c^2}\int\left(\tfrac12 v^2 - gz\right)\dd t. $$

          $T$ cố định, nên làm $\tau$ lớn nhất cũng là làm $\int(\tfrac12 v^2 - gz)\,\dd t$ nhỏ nhất. Biểu thức trong tích phân là động năng trừ thế năng (trên một đơn vị khối lượng): đó đúng là **tác dụng** của cơ học Newton. Phương trình Euler–Lagrange cho

          $$ \frac{\dd v}{\dd t} = -g, $$

          tức định luật rơi của Galilei và Newton. Thay số với $T = 2$ s: $v_0 = 9{,}8$ m/s, đỉnh cao 4,9 m; lợi do độ cao $\frac{g}{c^2}\int z\,\dd t \approx 7{,}1 \times 10^{-16}$ s; thiệt do tốc độ $\frac{1}{2c^2}\int v^2\,\dd t \approx 3{,}6 \times 10^{-16}$ s. Lợi gấp đôi thiệt đúng trên đường parabol. Bộ kiểm số của bài thử thêm đường cao gấp rưỡi và đường thấp một nửa: cả hai đều cho thời gian riêng ít hơn.
          +++`,
        vao: (c) => c.cauHinh({ canh: 'loden', r: 2, tocDo: 1.6, viDu: 'gps', mayAnh: 'tong' }),
        nut: { r2: (c) => c.cauHinh({ r: 2 }), tong: (c) => c.goc('tong') },
      },
    ],
    congThuc: [
      { ten: 'Nhịp đồng hồ đứng yên ở bán kính r', tex: R`\frac{\dd\tau}{\dd t} = \sqrt{1 - \frac{r_s}{r}},\qquad r_s = \frac{2GM}{c^2}`, y: '$t$ là thời gian của đồng hồ ở rất xa. Ở $r = 2\\,r_s$: 70,7%.' },
      { ten: 'Dịch chuyển đỏ hấp dẫn (thu ở rất xa)', tex: R`1 + z = \frac{\lambda_{\text{nhận}}}{\lambda_{\text{phát}}} = \frac{1}{\sqrt{1 - r_s/r}}`, y: 'Cùng một thừa số với giãn thời gian: hai cách nhìn một hiện tượng.' },
      { ten: 'Trường yếu: hai độ cao cách nhau h', tex: R`\frac{\Delta\tau}{\tau} \approx \frac{gh}{c^2}`, y: 'Đồng hồ trên cao nhanh hơn. $h = 1$ m: $1{,}09 \\times 10^{-16}$.' },
      { ten: 'GPS: độ lệch mỗi giây của đồng hồ vệ tinh', tex: R`\frac{GM}{c^2}\left(\frac1R - \frac1r\right) - \frac{v^2}{2c^2} \approx 5{,}29 \times 10^{-10} - 0{,}83 \times 10^{-10}`, y: 'Nhân với 86 400 s: $45{,}7 - 7{,}2 = 38{,}5$ micro giây mỗi ngày.' },
      { ten: 'Thời gian riêng của vật chậm gần mặt đất', tex: R`\tau \approx \int\left(1 + \frac{gz}{c^2} - \frac{v^2}{2c^2}\right)\dd t`, y: 'Làm $\\tau$ lớn nhất cho ra định luật rơi của Newton.' },
    ],
    cauHoi: [
      {
        hoi: R`Phi hành gia đứng yên ở $r = 2\,r_s$ quanh một lỗ đen. Một giờ theo đồng hồ của phi hành gia ứng với bao nhiêu giờ của người ở rất xa?`,
        chon: ['0,71 giờ', '1,41 giờ', '2 giờ', '4 giờ'],
        dung: 1,
        giai: R`Nhịp là $\sqrt{1 - 1/2} = 0{,}707$, nên $\Delta t = \Delta\tau / 0{,}707 \approx 1{,}41$ giờ. Chọn 0,71 là nhầm chiều: người ở xa đếm **nhiều** hơn.`,
      },
      {
        hoi: 'Phi hành gia ở sát lỗ đen nhìn đồng hồ đeo tay của chính mình. Họ thấy gì?',
        chon: ['Kim chạy chậm hẳn lại', 'Kim chạy bình thường: một giây vẫn là một giây', 'Kim đứng yên', 'Kim chạy ngược'],
        dung: 1,
        giai: 'Mọi quá trình tại chỗ đều chậm như nhau, kể cả não và mắt của người xem, nên không có gì để so. Chỉ khi so với đồng hồ ở nơi khác (qua tín hiệu ánh sáng hoặc gặp lại) mới thấy chênh.',
      },
      {
        hoi: 'Hai anh em sống ở tầng 1 và tầng 50 của cùng một toà nhà suốt 70 năm. Câu nào đúng?',
        chon: ['Mỗi người thấy người kia già chậm hơn, như ở Bài 6', 'Người ở tầng 50 già nhanh hơn một chút, và cả hai đồng ý điều đó', 'Người ở tầng 1 già nhanh hơn vì gần mặt đất', 'Không ai khác ai vì cả hai đều đứng yên'],
        dung: 1,
        giai: 'Đồng hồ trên cao chạy nhanh hơn theo hệ số $gh/c^2$. Khác với giãn thời gian do tốc độ, ở đây không đối xứng: tín hiệu từ dưới lên bị dịch đỏ, từ trên xuống bị dịch xanh, nên cả hai cùng kết luận người ở tầng cao già nhanh hơn. Chênh lệch chỉ cỡ vài chục micro giây sau cả đời người (khoảng 36 micro giây sau 70 năm nếu tầng 50 cao hơn tầng 1 chừng 150 m).',
      },
      {
        hoi: 'Vệ tinh GPS bay 3,9 km/s, nhanh hơn mọi thứ trên mặt đất. Vậy mà đồng hồ trên đó lại chạy **nhanh** hơn đồng hồ mặt đất. Vì sao?',
        chon: ['Vì vệ tinh bay trong chân không', 'Vì phần nhanh lên do ở cao (+45,7 micro giây mỗi ngày) lớn hơn phần chậm đi do tốc độ (−7,2)', 'Vì đồng hồ trên vệ tinh được chế tạo tốt hơn', 'Vì giãn thời gian do tốc độ làm đồng hồ nhanh lên'],
        dung: 1,
        giai: 'Hai hiệu ứng ngược chiều nhau; phần hấp dẫn thắng. Tổng +38,5 micro giây mỗi ngày.',
      },
      {
        hoi: R`Pound và Rebka đo được chênh lệch $2{,}46 \times 10^{-15}$ trên tháp cao 22,5 m. Nếu tháp cao gấp đôi (45 m), chênh lệch là bao nhiêu?`,
        chon: [R`$1{,}23 \times 10^{-15}$`, R`$2{,}46 \times 10^{-15}$`, R`$4{,}9 \times 10^{-15}$`, R`$9{,}8 \times 10^{-15}$`],
        dung: 2,
        giai: R`$gh/c^2$ tỉ lệ thuận với $h$: gấp đôi độ cao thì gấp đôi chênh lệch. Chọn $9{,}8$ là nhầm thành tỉ lệ với $h^2$.`,
      },
      {
        hoi: 'Giải thích bằng lời, không dùng chữ «lực», vì sao một quả bóng thả ra thì rơi xuống đất.',
        dap: 'Thời gian trôi nhanh hơn một chút ở trên cao. Vật tự do luôn đi theo đường thế giới cho thời gian riêng dài nhất (đường trắc địa). Với một vật đang đứng yên, đường dài nhất về thời gian riêng không phải là cứ đứng yên mãi, mà là đường cong dần về phía mặt đất theo đúng cách đã cân bằng giữa «lợi do ở cao» và «thiệt do đi nhanh». Kết quả nhìn từ mặt đất là quả bóng rơi xuống nhanh dần với gia tốc $g$. Không gian quanh Trái Đất cũng hơi cong, nhưng với vật chậm phần ấy gần như không đáng kể (Bài 11).',
      },
    ],
    docThem: [
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 6: dịch chuyển đỏ hấp dẫn, GPS, nguyên lý thời gian riêng cực đại; chương 9: metric Schwarzschild.',
      'R. P. Feynman, *The Feynman Lectures on Physics*, tập II, chương 42 «Curved Space»: phần nhịp đồng hồ trong trường hấp dẫn.',
      'E. F. Taylor, J. A. Wheeler và E. Bertschinger, *Exploring Black Holes* (bản 2): đồng hồ quanh lỗ đen và GPS, kể rất kỹ bằng toán phổ thông.',
      'Pound và Rebka 1960, Phys. Rev. Lett. 4, 337; Chou và cộng sự 2010, Science 329, 1630; Takamoto và cộng sự 2020, Nature Photonics 14, 411; Bothwell và cộng sự 2022, Nature 602, 420.',
    ],
    thuatNgu: [
      { vi: 'giãn thời gian do hấp dẫn', en: 'gravitational time dilation', nghia: 'Đồng hồ ở gần khối lượng (thế hấp dẫn thấp hơn) đếm được ít thời gian riêng hơn đồng hồ ở xa. Nhịp: $\\sqrt{1 - r_s/r}$.' },
      { vi: 'đồng hồ quang học', en: 'optical clock', nghia: 'Đồng hồ nguyên tử dùng dao động của ánh sáng (cỡ $10^{15}$ lần mỗi giây) làm nhịp; sai số cỡ $10^{-18}$, đủ để thấy chênh lệch độ cao vài centimet.' },
      { vi: 'nguyên lý thời gian riêng cực đại', en: 'principle of maximal aging', nghia: 'Vật rơi tự do đi theo đường thế giới cho thời gian riêng dài nhất giữa hai sự kiện (với đường đủ ngắn).' },
      { vi: 'hiệu ứng Mössbauer', en: 'Mössbauer effect', nghia: 'Hạt nhân trong tinh thể phát và hấp thụ tia gamma mà không giật lùi, cho vạch phổ cực sắc nét. Nhờ nó Pound và Rebka đo được dịch chuyển cỡ $10^{-15}$.' },
    ],
  },

  conSo: [
    '**38,5 micro giây mỗi ngày**: đồng hồ vệ tinh GPS nhanh hơn mặt đất (+45,7 do hấp dẫn, −7,2 do tốc độ).',
    '**2,46 × 10⁻¹⁵**: chênh lệch Pound và Rebka đo trên tháp 22,5 m năm 1960.',
    '**22 mili giây mỗi năm**: đồng hồ trên mặt đất chậm hơn một đồng hồ ở rất xa Trái Đất.',
    '**1 mm**: năm 2022, đồng hồ quang học đã đo được chênh lệch nhịp giữa hai điểm chỉ cách nhau một milimét theo chiều cao.',
    '**81%**: nhịp đồng hồ trên bề mặt một sao neutron điển hình.',
    '**Ở chân trời sự kiện**, nhịp đồng hồ so với ở xa tiến về 0.',
  ],
  hieuDung: '**Bạn không bao giờ thấy thời gian của chính mình chậm lại.** Với phi hành gia ở sát lỗ đen, một giây vẫn là một giây. Chỉ khi so đồng hồ với người ở xa mới thấy lệch: phi hành gia thấy vũ trụ bên ngoài tua nhanh, còn người ở xa thấy phi hành gia chậm như phim quay chậm. Trong phim *Interstellar*, 1 giờ trên hành tinh Miller bằng 7 năm Trái Đất; tỉ lệ lớn như thế cần một lỗ đen quay cực nhanh, còn mô hình này là lỗ đen không quay.',
  nguon: 'Pound và Rebka 1960; Chou và cộng sự 2010; Takamoto và cộng sự 2020 (Tokyo Skytree); Bothwell và cộng sự 2022 (chênh lệch 1 mm); Hafele và Keating 1972. Các con số GPS, Everest, Mặt Trời, sao neutron tính lại từ hằng số CODATA 2018, IAU, xem kiem-tra/kiem-phan-3-cu.mjs.',

  tao(app) {
    const scene = new THREE.Scene();
    const camera = app.camera;
    const am = app.am, tt = app.tt;
    scene.add(taoNenSao({ soSao: 2600, hat: 9, doSang: 0.55 }));
    taoDenCanh(scene, { renderer: app.renderer, doPhanChieu: 0.45 });

    // ================= Sân khấu 1: quanh lỗ đen (bước 1–3, 7, 8) =================
    const nhomLD = new THREE.Group();
    scene.add(nhomLD);
    const mc = new MatCong({ doMoMat: 0.2, doMoLuoi: 0.6 });
    mc.dat({ rs: 1, R: null, rMax: R_MAX });
    nhomLD.add(mc.nhom);
    // Lỗ đen nằm trong họng mặt cong; vòng đỏ cam phát sáng là chân trời sự kiện (r = rs).
    const ld = taoLoDenNho({ banKinh: 0.8, dia: false, doSang: 0.8 });
    ld.nhom.position.set(0, mc.y(1) - 0.32, 0);
    nhomLD.add(ld.nhom);
    const vongCT = vongTrenMat(mc, 1.003, { mau: 0xff8a73, rong: 2.6, doMo: 1, nang: 0.02 });
    vongCT.material.color.multiplyScalar(1.7);
    nhomLD.add(vongCT);
    const nhanCT = taoNhan(chuCanh("canh.chan-troi-su-kien-r-r-s-nhip", "Chân trời sự kiện<small>r = r<sub>s</sub>: nhịp đồng hồ đứng yên tiến về 0</small>"), 'mo');
    nhanCT.position.set(1.3, mc.y(1) + 0.05, 0.9);
    nhomLD.add(nhanCT);
    tt.them(ld.nhom, {
      ten: chuCanh("canh.lo-den-khong-quay", "Lỗ đen không quay"), mau: 0xff8a73, banKinhPx: 30,
      moTa: chuCanh("canh.toan-bo-khoi-luong-nam-trong-chan-troi", "Toàn bộ khối lượng nằm trong chân trời sự kiện <span class=\"so\">r = r<sub>s</sub></span>. Đồng hồ càng xuống gần đây càng chậm so với ở xa."),
    });

    // vật liệu chung của cột đỡ, chân đế
    const vlCot = vlKimLoai(0xb4bcc8, 0.32);
    const geoCot = new THREE.CylinderGeometry(0.017, 0.024, 1, 10);
    geoCot.translate(0, 0.5, 0);
    const geoChan = new THREE.CylinderGeometry(0.075, 0.095, 0.035, 20);
    const geoDiaChan = new THREE.TorusGeometry(0.13, 0.012, 6, 40);
    geoDiaChan.rotateX(Math.PI / 2);
    // Cột đỡ đồng hồ: cột kim loại, chân đế, vòng sáng màu nhịp đồng hồ trên mặt cong.
    function taoCot(p0, cao, mau) {
      const g = new THREE.Group();
      g.position.copy(p0);
      const cot = new THREE.Mesh(geoCot, vlCot);
      cot.scale.y = cao;
      const chan = new THREE.Mesh(geoChan, vlCot);
      chan.position.y = 0.012;
      const vong = new THREE.Mesh(geoDiaChan, new THREE.MeshBasicMaterial({ color: new THREE.Color(mau).multiplyScalar(2.2), transparent: true, opacity: 0.9, depthWrite: false }));
      vong.position.y = 0.02;
      const dom = taoDom(new THREE.Color(mau).multiplyScalar(1.8), 0.34);
      dom.position.y = 0.04;
      g.add(cot, chan, vong, dom);
      g.cot = cot; g.vong = vong; g.dom = dom;
      return g;
    }

    // ----- Năm đồng hồ cố định (đồng hồ kim 3D, nháy sáng mỗi giây của chính nó) -----
    const CAO = 0.95;
    const dsDongHo = DS_R.map((r, i) => {
      const goc = i === 0 ? -2.05 : -1.25 - i * 0.56;   // đồng hồ sát chân trời đặt phía sau họng cho khỏi bị đồng hồ vàng che
      const dh = taoDongHo({ mauVien: 0xe9eef8, mauKim: 0xf3c66f, chuKy: VONG_GIAY });
      const p0 = new THREE.Vector3(r * Math.cos(goc), mc.y(r), r * Math.sin(goc));
      dh.nhom.position.copy(p0).add(new THREE.Vector3(0, CAO, 0));
      const nhip = mc.nhip(r);
      const cot = taoCot(p0, CAO - 0.42, mauNhip(nhip).getHex());
      const nhan = taoNhan(chuCanh("canh.cach-tam-r-s", "{0}%<small>cách tâm {1} r<sub>s</sub></small>", [so(nhip * 100, 0), so(r, 2)]), '');
      nhan.position.copy(dh.nhom.position);
      if (i === 0) { nhan.center.set(1, 0.5); nhan.element.style.marginLeft = '0'; nhan.element.style.marginRight = '28px'; }
      else nhan.element.style.marginLeft = '28px';
      nhomLD.add(dh.nhom, cot, nhan);
      tt.them(dh.nhom, {
        ten: chuCanh("canh.dong-ho-o-r-r-s", "Đồng hồ ở r = {0} r<sub>s</sub>", [so(r, 2)]), mau: 0xe9eef8, banKinhPx: 24,
        moTa: () => chuCanh("canh.nhip-so-voi-dong-ho-o-rat-xa", "Nhịp <span class=\"so\">{0}%</span> so với đồng hồ ở rất xa: 1 giờ ở đây bằng <span class=\"so\">{1} giờ</span> ở xa.<br>Bấm để đưa phi hành gia tới bán kính này.", [so(nhip * 100, 1), so(1 / nhip, 2)]),
        khiBam: () => { am.phat('bam'); cauHinh({ r }); },
      });
      return { dh, nhip, r };
    });
    // ----- Đồng hồ ở rất xa -----
    const xa = taoDongHo({ mauVien: 0x7fcaff, mauKim: 0x8fd0ff, chuKy: VONG_GIAY });
    xa.nhom.position.set(-8.4, 2.6, -6.5);
    xa.nhom.scale.setScalar(1.35);
    const nhanXa = taoNhan(chuCanh("canh.dong-ho-o-rat-xa-nhip-100", "Đồng hồ ở rất xa<small>nhịp 100%</small>"), 'xanh dam');
    nhanXa.position.copy(xa.nhom.position);
    nhanXa.element.style.marginLeft = '36px';
    nhomLD.add(xa.nhom, nhanXa);
    tt.them(xa.nhom, {
      ten: chuCanh("canh.dong-ho-o-rat-xa", "Đồng hồ ở rất xa"), mau: 0x7fcaff, banKinhPx: 30,
      moTa: chuCanh("canh.noi-hap-dan-khong-dang-ke-thoi-gian", "Nơi hấp dẫn không đáng kể. Thời gian <span class=\"so\">t</span> của nó là thời gian chung để so mọi đồng hồ khác. Tiếng tích cao, bên trái."),
    });

    // ----- Phi hành gia trên bệ đẩy, mang đồng hồ vàng -----
    const GOC_PHG = 0.95;
    const cs = Math.cos(GOC_PHG), sn = Math.sin(GOC_PHG);
    const phg = taoDongHo({ mauVien: 0xf3c66f, mauKim: 0xffffff, chuKy: VONG_GIAY });
    phg.nhom.scale.setScalar(1.3);
    const be = new THREE.Group();         // bệ: đĩa kim loại, bốn động cơ đẩy phụt xuống (giữ bệ đứng yên)
    {
      const ds = [new THREE.CylinderGeometry(0.3, 0.34, 0.06, 32)];
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const g = new THREE.CylinderGeometry(0.045, 0.07, 0.11, 12);
        g.translate(Math.cos(a) * 0.24, -0.08, Math.sin(a) * 0.24);
        ds.push(g);
      }
      be.add(new THREE.Mesh(ghep(ds), vlKimLoai(0x8d96a5, 0.3)));
      const vien = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.012, 6, 48), vlSang(0xf3c66f, 2.2));
      vien.rotation.x = Math.PI / 2; vien.position.y = 0.032;
      be.add(vien);
      be.lua = [];
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const l = domSang(0xff9a4a, 0.22, 3.2);
        l.position.set(Math.cos(a) * 0.24, -0.2, Math.sin(a) * 0.24);
        l.scale.set(0.12, 0.3, 1);
        be.add(l);
        be.lua.push(l);
      }
    }
    const nguoi = taoPhiHanhGia({ cao: 0.5, tuThe: 'dung' });
    nguoi.nhom.position.y = 0.03;
    be.add(nguoi.nhom);
    const cotPhg = new THREE.Mesh(geoCot, vlCot);
    const nhanPhg = taoNhan('', 'vang dam');
    nhanPhg.element.style.marginLeft = '38px';
    const chamPhg = taoDom(new THREE.Color(0xf3c66f).multiplyScalar(2), 0.42);
    // đường chớp sáng đi: từ chỗ phi hành gia ra mép ngoài
    const duongRa = new DuongDay(60, { mau: 0xffffff, rong: 1.3, doMo: 0.22, net: [0.12, 0.1] });
    nhomLD.add(phg.nhom, be, cotPhg, nhanPhg, chamPhg, duongRa.line);
    tt.them(phg.nhom, {
      ten: chuCanh("canh.dong-ho-cua-phi-hanh-gia", "Đồng hồ của phi hành gia"), mau: 0xf3c66f, banKinhPx: 32,
      moTa: () => chuCanh("canh.nhip-so-voi-o-xa-o-r-r", "Nhịp <span class=\"so\">{0}%</span> so với ở xa, ở r = <span class=\"so\">{1} r<sub>s</sub></span>. Tiếng tích trầm, bên phải. Kéo chấm vàng ở chân bệ để dời đi.", [so(mc.nhip(rPhg) * 100, 1), so(rPhg, 2)]),
    });

    // ----- Trạm thu ở xa: chảo ăng-ten nhỏ ở mép mặt cong -----
    const tramThu = new THREE.Group();
    {
      const pc = [];
      for (let i = 0; i <= 10; i++) { const r = (i / 10) * 0.26; pc.push(new THREE.Vector2(r, (r * r) / 0.22)); }
      const chao = new THREE.Mesh(new THREE.LatheGeometry(pc, 32), vlKimLoai(0xdfe5ee, 0.25, { side: THREE.DoubleSide }));
      chao.rotation.z = 0.9;
      chao.position.y = 0.42;
      const chan = new THREE.Mesh(dat(new THREE.CylinderGeometry(0.02, 0.05, 0.42, 10), { y: 0.21 }), vlKimLoai(0x8d96a5, 0.35));
      tramThu.add(chao, chan);
      tramThu.den = domSang(0x8fd0ff, 0.5, 2.4);
      tramThu.den.position.y = 0.45;
      tramThu.add(tramThu.den);
    }
    tramThu.position.set(R_MAX * cs, mc.y(R_MAX) + 0.02, R_MAX * sn);
    tramThu.rotation.y = -GOC_PHG + Math.PI;
    const nhanThu = taoNhan(chuCanh("canh.tram-thu-o-xa", "trạm thu ở xa"), 'xanh');
    nhanThu.position.copy(tramThu.position).add(new THREE.Vector3(0, 0.55, 0));
    nhomLD.add(tramThu, nhanThu);
    tt.them(tramThu, {
      ten: chuCanh("canh.tram-thu-o-xa-dd515d", "Trạm thu ở xa"), mau: 0x8fd0ff, banKinhPx: 26,
      moTa: () => chuCanh("canh.nhan-chop-sang-cua-phi-hanh-gia", "Nhận chớp sáng của phi hành gia. {0}", [khoangNhan ? chuCanh("canh.hai-chop-gan-nhat-toi-cach-nhau-giay", "Hai chớp gần nhất tới cách nhau <span class=\"so\">{0} giây</span>.", [so(khoangNhan, 2)]) : chuCanh("canh.dang-cho-chop-dau-tien", "Đang chờ chớp đầu tiên.")]),
    });

    const SO_CHOP = 40;
    const chop = Array.from({ length: SO_CHOP }, () => { const s = taoDom(0xffffff, 0.3); s.visible = false; nhomLD.add(s); return s; });
    let dsChop = [];           // { t0, rSao0, nhipPhat }

    // ================= Sân khấu 2: Trái Đất, tháp, vệ tinh GPS (bước 4–6) =================
    const nhomTD = new THREE.Group();
    scene.add(nhomTD);
    const traiDat = taoTraiDat({ banKinh: RE_C, nghieng: 0, tocDoQuay: 0 });
    // xoay để Tokyo nằm ở đỉnh quả cầu (kinh độ lon = atan(−z, x) theo quy ước của hanh-tinh-glsl.js)
    {
      const phi = TOKYO[0] * DO, lam = TOKYO[1] * DO;
      const p = new THREE.Vector3(Math.cos(phi) * Math.cos(lam), Math.sin(phi), -Math.cos(phi) * Math.sin(lam));
      traiDat.nhom.quaternion.setFromUnitVectors(p, new THREE.Vector3(0, 1, 0));
    }
    traiDat.nhom.position.copy(TAM_TD);
    traiDat.datHuongSang([0.75, 0.55, 0.55]);
    nhomTD.add(traiDat.nhom);
    tt.them(traiDat.cau, {
      ten: chuCanh("canh.trai-dat", "Trái Đất"), mau: 0x7fcaff,
      moTa: chuCanh("canh.ban-kinh-6-371-km-r-s-chi", "Bán kính <span class=\"so\">6 371 km</span>, r<sub>s</sub> chỉ khoảng <span class=\"so\">9 mm</span>. Đồng hồ ở mặt đất chậm hơn ở rất xa <span class=\"so\">7×10⁻¹⁰</span>. Bờ biển là thật (Natural Earth)."),
    });
    const thap = taoThap({ cao: TH });
    nhomTD.add(thap.nhom);
    const nhanThap = taoNhan(chuCanh("canh.thap-cao-634-m-dang-tokyo-skytree-thap", "Tháp cao 634 m (dáng Tokyo Skytree)<small>tháp vẽ cao gấp khoảng {0} lần tỉ lệ thật</small>", [so(Math.round(PHONG_DAI_THAP / 100) * 100, 0)]), 'mo');
    nhanThap.position.set(-0.32, TH + 0.12, 0);
    nhanThap.center.set(1, 0.5);
    nhanThap.element.style.marginLeft = '0';
    nhanThap.element.style.marginRight = '10px';
    nhomTD.add(nhanThap);

    const dhDat = taoDongHo({ mauVien: 0xe9eef8, mauKim: 0xf3c66f, chuKy: VONG_GIAY });
    dhDat.nhom.scale.setScalar(0.36);
    dhDat.nhom.position.set(-0.44, 0.17, 0.12);
    const nhanDat = taoNhan(chuCanh("canh.dong-ho-chan-thap-moc-de-so", "Đồng hồ chân tháp<small>mốc để so</small>"), 'mo');
    nhanDat.position.set(-0.44, 0.17, 0.12);
    nhanDat.center.set(1, 0.5);
    nhanDat.element.style.marginLeft = '0';
    nhanDat.element.style.marginRight = '68px';
    const dhThap = taoDongHo({ mauVien: 0xf3c66f, mauKim: 0xffffff, chuKy: VONG_GIAY });
    dhThap.nhom.scale.setScalar(0.36);
    const nhanDhThap = taoNhan('', 'vang giua');
    const giaThap = new THREE.Mesh(dat(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6), { rz: Math.PI / 2 }), vlCot);
    nhomTD.add(dhDat.nhom, nhanDat, dhThap.nhom, nhanDhThap, giaThap);
    tt.them(dhDat.nhom, {
      ten: chuCanh("canh.dong-ho-chan-thap", "Đồng hồ chân tháp"), mau: 0xe9eef8, banKinhPx: 18,
      moTa: chuCanh("canh.moc-de-so-moi-chenh-lech-tinh-so", "Mốc để so: mọi chênh lệch tính so với đồng hồ này. Tiếng tích bên trái."),
    });

    // quỹ đạo vệ tinh: mặt phẳng nghiêng cho dễ nhìn, khoảng cách tới tâm Trái Đất đúng tỉ lệ
    const PHAP_QD = new THREE.Vector3(0.22, 0.93, 0.3).normalize();
    const U_QD = new THREE.Vector3().crossVectors(PHAP_QD, new THREE.Vector3(0, 0, 1)).normalize();
    const V_QD = new THREE.Vector3().crossVectors(PHAP_QD, U_QD).normalize();
    const vongQD = new DuongDay(161, { mau: 0x8fd0ff, rong: 1.5, doMo: 0.5, quang: 0.06 });
    const vongGPS = new DuongDay(161, { mau: 0xffffff, rong: 1, doMo: 0.18, net: [0.25, 0.2] });
    const veTinh = taoVeTinh({ co: 0.5 });
    const dhVT = taoDongHo({ mauVien: 0xff7aa8, mauKim: 0xffffff, chuKy: VONG_GIAY });
    dhVT.nhom.scale.setScalar(0.95);
    const nhanVT = taoNhan('', 'hong');
    nhanVT.element.style.marginLeft = '44px';
    const nhanGPS = taoNhan(chuCanh("canh.quy-dao-gps-that-cach-tam-26-560", "quỹ đạo GPS thật<small>cách tâm 26 560 km</small>"), 'mo');
    nhomTD.add(vongQD.line, vongGPS.line, veTinh.nhom, dhVT.nhom, nhanVT, nhanGPS);
    {
      const q = new THREE.Vector3();
      const rG = RE_C * R_GPS;
      for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * Math.PI * 2;
        q.copy(TAM_TD).addScaledVector(U_QD, rG * Math.cos(a)).addScaledVector(V_QD, rG * Math.sin(a));
        vongGPS.dat(i, q.x, q.y, q.z);
      }
      vongGPS.xong(161);
      nhanGPS.position.copy(TAM_TD).addScaledVector(U_QD, -rG * 0.72).addScaledVector(V_QD, -rG * 0.72);
    }
    tt.them(veTinh.nhom, {
      ten: chuCanh("canh.ve-tinh", "Vệ tinh"), mau: 0xff7aa8, banKinhPx: 26,
      moTa: () => chuCanh("canh.cach-tam-trai-dat-r-cao-km-bay", "Cách tâm Trái Đất <span class=\"so\">{0} R</span> (cao {1} km), bay <span class=\"so\">{2} km/s</span>.<br>Hấp dẫn: <span class=\"so\">+{3}</span>, tốc độ: <span class=\"so\">−{4}</span> micro giây mỗi ngày.", [so(rVT, 2), so((rVT - 1) * R_TD_KM, 0), so(vQuyDao(rVT) / 1000, 2), so(usHapDan(rVT), 1), so(usTocDo(rVT), 1)]),
    });

    // ================= Trạng thái =================
    let rPhg = 2.0;
    let t = 0;                 // thời gian của người ở xa (sân khấu 1) hoặc của đồng hồ chân tháp (sân khấu 2)
    let tau = 0;               // thời gian riêng của phi hành gia
    let tauChopCuoi = 0;
    let tocDo = 1.6;
    let viDu = 'gps';
    let tNhanCuoi = null, khoangNhan = null, loe = 0;
    let canh = 'loden';
    let hThap = 450;           // độ cao đồng hồ trên tháp, mét
    let rVT = R_GPS;           // bán kính quỹ đạo vệ tinh, theo bán kính Trái Đất
    let soSanh = 'thap';       // đồng hồ nào kêu cùng đồng hồ chân tháp: 'thap' | 'vetinh'
    let tThap = 0, tVT = 0, gocVT = 0.55;
    const daKeo = { phg: false, thap: false, vt: false };
    const sLD = new LoXo(1, 0.8), sTD = new LoXo(0, 0.8);
    // nút bấm, bấm đồng hồ, đổi bước: phi hành gia bay mượt tới bán kính mới (theo log(r − 1) cho đều tay)
    const rLX = new LoXo(Math.log(rPhg - 1), 0.7);

    // ----- Tay nắm: kéo phi hành gia dọc mặt cong -----
    // Đường đi của chân bệ trên mặt cong, lấy mẫu dày theo log(r − 1) (dày ở gần chân trời, nơi mặt dốc).
    const R_MIN = 1.01, R_LON = 9.5, N_MAU = 360;
    const mauR = new Float64Array(N_MAU), mauP = Array.from({ length: N_MAU }, () => new THREE.Vector3());
    for (let i = 0; i < N_MAU; i++) {
      const r = 1 + Math.exp(Math.log(R_MIN - 1) + (Math.log(R_LON - 1) - Math.log(R_MIN - 1)) * (i / (N_MAU - 1)));
      mauR[i] = r;
      mauP[i].set(r * cs, mc.y(r) + 0.03, r * sn);
    }
    const _w = new THREE.Vector3();
    function rGanTia(ray) {
      let tot = 0, nho = Infinity;
      for (let i = 0; i < N_MAU; i++) {
        _w.copy(mauP[i]).sub(ray.origin);
        const s = _w.dot(ray.direction);
        if (s <= 0) continue;
        const d2 = (_w.lengthSq() - s * s) / (s * s);       // khoảng cách góc (bình phương) từ tia tới điểm
        if (d2 < nho) { nho = d2; tot = i; }
      }
      return mauR[tot];
    }
    const tayPhg = tt.tayNam({
      viTri: [rPhg * cs, mc.y(rPhg) + 0.03, rPhg * sn], mau: 0xf3c66f, co: 0.13,
      ten: chuCanh("canh.phi-hanh-gia", "Phi hành gia"), moTa: chuCanh("canh.keo-doc-mat-cong-lai-gan-hay-ra", "Kéo dọc mặt cong: lại gần hay ra xa lỗ đen"),
      rangBuoc: { kieu: 'ham', chieu: (ray) => { const r = rGanTia(ray); return new THREE.Vector3(r * cs, mc.y(r) + 0.03, r * sn); } },
      nhan: chuCanh("canh.keo-phi-hanh-gia-doc-mat-cong", "Kéo phi hành gia dọc mặt cong"),
      khiKeo: (p) => { const r = kep(Math.hypot(p.x, p.z), R_MIN, R_LON); daKeo.phg = true; dkR.dat(r); rLX.dat(Math.log(r - 1), true); datPhg(r, false); },
      khiTha: () => am.phat('tha'),
    });

    // ----- Tay nắm: kéo đồng hồ dọc tháp -----
    const tayThap = tt.tayNam({
      viTri: [X_TAY_THAP, (hThap / H_THAP) * TH, 0.12], mau: 0xf3c66f, co: 0.05,
      ten: chuCanh("canh.dong-ho-tren-thap", "Đồng hồ trên tháp"), moTa: chuCanh("canh.keo-len-xuong-doc-thap-0-toi-634", "Kéo lên xuống dọc tháp (0 tới 634 m)"),
      rangBuoc: { kieu: 'duong', qua: [X_TAY_THAP, 0, 0.12], huong: [0, 1, 0] },
      gioiHan: (p) => { p.y = kep(p.y, 0.02 * TH, TH); return p; },
      hut: [[X_TAY_THAP, (450 / H_THAP) * TH, 0.12]], khoangHut: 0.035,
      nhan: chuCanh("canh.keo-dong-ho-len-xuong", "Kéo đồng hồ lên xuống"),
      khiKeo: (p) => { daKeo.thap = true; const h = (p.y / TH) * H_THAP; dkH.dat(h); datThap(h, false); },
      khiTha: () => am.phat('tha'),
    });

    // ----- Tay nắm: kéo vệ tinh lại gần hay ra xa Trái Đất -----
    const _mp = new THREE.Plane().setFromNormalAndCoplanarPoint(PHAP_QD, TAM_TD);
    const huongVT = (out) => out.copy(U_QD).multiplyScalar(Math.cos(gocVT)).addScaledVector(V_QD, Math.sin(gocVT));
    const tayVT = tt.tayNam({
      viTri: [0, 0, 0], mau: 0xff7aa8, co: 0.11,
      ten: chuCanh("canh.ve-tinh", "Vệ tinh"), moTa: chuCanh("canh.keo-lai-gan-hay-ra-xa-trai-dat", "Kéo lại gần hay ra xa Trái Đất"),
      rangBuoc: {
        kieu: 'ham',
        chieu: (ray) => {
          const p = ray.intersectPlane(_mp, new THREE.Vector3());
          if (!p) return null;
          const r = kep(p.distanceTo(TAM_TD) / RE_C, R_VT_MIN, R_VT_MAX);
          return huongVT(new THREE.Vector3()).multiplyScalar(r * RE_C).add(TAM_TD);
        },
      },
      nhan: chuCanh("canh.keo-ve-tinh-lai-gan-ra-xa", "Kéo vệ tinh lại gần, ra xa"),
      khiKeo: (p) => { daKeo.vt = true; const r = kep(p.distanceTo(TAM_TD) / RE_C, R_VT_MIN, R_VT_MAX); dkVT.dat(r); datVT(r, false); },
      khiTha: () => am.phat('tha'),
    });

    // ================= Điều khiển =================
    const bang = app.bang;
    const dkR = bang.thanhTruot({
      nhan: chuCanh("canh.phi-hanh-gia-cach-tam", "Phi hành gia cách tâm"), min: R_MIN, max: R_LON, giaTri: rPhg, log: true,
      hienThi: (v) => `${so(v, 2)} r<sub>s</sub>`,
      khiDoi: (v) => { rLX.dat(Math.log(v - 1), true); datPhg(v); },
    });
    const dkH = bang.thanhTruot({
      nhan: chuCanh("canh.dong-ho-tren-thap-o-do-cao", "Đồng hồ trên tháp ở độ cao"), min: 0, max: H_THAP, buoc: 1, giaTri: hThap,
      hienThi: (v) => `${so(v, 0)} m`,
      khiDoi: (v) => datThap(v),
    });
    const dkVT = bang.thanhTruot({
      nhan: chuCanh("canh.ve-tinh-cach-tam-trai-dat", "Vệ tinh cách tâm Trái Đất"), min: R_VT_MIN, max: R_VT_MAX, buoc: 0.01, giaTri: rVT,
      hienThi: (v) => chuCanh("canh.r-cao-km", "{0} R (cao {1} km)", [so(v, 2), so((v - 1) * R_TD_KM, 0)]),
      khiDoi: (v) => datVT(v),
    });
    const dkTocDo = bang.thanhTruot({
      nhan: chuCanh("canh.toc-do-chieu", "Tốc độ chiếu"), min: 0, max: 6, buoc: 0.1, giaTri: tocDo,
      hienThi: (v) => (v === 0 ? chuCanh("canh.dung-yen", "đứng yên") : `×${so(v, 1)}`),
      khiDoi: (v) => { tocDo = v; },
    });
    const theSS = bang.the('');
    // đồ thị nhịp đồng hồ theo bán kính
    const dt2 = bang.doThi(150);
    function veDoThi() {
      const g = dt2.ctx;
      const { X, Y } = khungDoThi(g, {
        rong: dt2.rong, cao: dt2.cao, x0: 1, x1: 10, y0: 0, y1: 1,
        nhanX: 'r / rs', nhanY: chuCanh("canh.nhip-so-voi-o-xa", "nhịp so với ở xa"),
        vachX: [[1, '1'], [2, '2'], [4, '4'], [6, '6'], [8, '8'], [10, '10']],
        vachY: [[0, '0'], [0.5, '50%'], [1, '100%']],
      });
      g.strokeStyle = MAU.xanh; g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i <= 200; i++) { const r = 1 + (9 * i) / 200; const y = nhipDongHo(r); if (i) g.lineTo(X(r), Y(y)); else g.moveTo(X(r), Y(y)); }
      g.stroke();
      g.fillStyle = MAU.chu;
      for (const r of DS_R) { g.beginPath(); g.arc(X(r), Y(nhipDongHo(r)), 2.6, 0, 2 * Math.PI); g.fill(); }
      const n = nhipDongHo(rPhg);
      g.setLineDash([3, 3]); g.strokeStyle = MAU.vang; g.lineWidth = 1;
      g.beginPath(); g.moveTo(X(1), Y(n)); g.lineTo(X(rPhg), Y(n)); g.lineTo(X(rPhg), Y(0)); g.stroke();
      g.setLineDash([]);
      g.fillStyle = MAU.vang;
      g.beginPath(); g.arc(X(rPhg), Y(n), 4.5, 0, 2 * Math.PI); g.fill();
      g.font = '11px -apple-system, "Helvetica Neue", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'bottom';
      g.fillText(chuCanh("canh.phi-hanh-gia-e9a5fa", "phi hành gia {0}%", [so(n * 100, 1)]), Math.min(X(rPhg) + 7, dt2.rong - 120), Y(n) - 3);
    }
    const theVD = bang.the(VI_DU.gps);
    const dkVD = bang.chon({
      nhan: chuCanh("canh.vi-du-co-that", "Ví dụ có thật"),
      luaChon: [
        { giaTri: 'gps', nhan: chuCanh("canh.gps", "GPS") }, { giaTri: 'skytree', nhan: chuCanh("canh.tokyo-skytree", "Tokyo Skytree") }, { giaTri: 'everest', nhan: chuCanh("canh.everest", "Everest") },
        { giaTri: 'matdat', nhan: chuCanh("canh.mat-dat", "Mặt đất") }, { giaTri: 'mattroi', nhan: chuCanh("canh.mat-troi", "Mặt Trời") }, { giaTri: 'neutron', nhan: chuCanh("canh.sao-neutron", "Sao neutron") },
      ],
      giaTri: viDu,
      khiDoi: (v) => datViDu(v),
    });
    bang.el.append(theVD.el);
    bang.chuThich(chuCanh("canh.keo-cac-cham-sang-trong-canh-chan-be", "Kéo các chấm sáng trong cảnh: chân bệ phi hành gia, đồng hồ trên tháp, vệ tinh. Rê chuột lên đồng hồ để xem nhịp. Tiếng: đồng hồ mốc tích bên trái, đồng hồ đang so tích bên phải."));
    function datViDu(v) {
      viDu = v;
      dkVD.dat(v);
      theVD.dat(VI_DU[v]);
    }

    function datPhg(r, datTay = true) {
      rPhg = r;
      const y = mc.y(r);
      const p0 = new THREE.Vector3(r * cs, y, r * sn);
      be.position.set(p0.x, y + 0.24, p0.z);
      phg.nhom.position.set(p0.x, y + CAO + 0.55, p0.z);
      cotPhg.position.set(p0.x, y + 0.27, p0.z);
      cotPhg.scale.y = CAO + 0.55 - 0.27 - 0.5;
      chamPhg.position.set(p0.x, y + 0.03, p0.z);
      nhanPhg.position.copy(phg.nhom.position);
      if (datTay) tayPhg.dat([p0.x, y + 0.03, p0.z]);
      for (let i = 0; i < 60; i++) { const rr = r + ((R_MAX - r) * i) / 59; duongRa.dat(i, rr * cs, mc.y(rr) + 0.04, rr * sn); }
      duongRa.xong(60);
      dsChop = []; tNhanCuoi = null; khoangNhan = null;
      veDoThi();
    }
    function datThap(h, datTay = true) {
      hThap = h;
      const y = (h / H_THAP) * TH;
      dhThap.nhom.position.set(X_DH_THAP, y, 0.12);
      giaThap.position.set(0.17, y, 0.12);
      nhanDhThap.position.set(X_DH_THAP, y + 0.24, 0.12);
      if (datTay) tayThap.dat([X_TAY_THAP, y, 0.12]);
    }
    const _hv = new THREE.Vector3();
    function datVT(r, datTay = true) {
      rVT = r;
      const rr = r * RE_C;
      const q = new THREE.Vector3();
      for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * Math.PI * 2;
        q.copy(TAM_TD).addScaledVector(U_QD, rr * Math.cos(a)).addScaledVector(V_QD, rr * Math.sin(a));
        vongQD.dat(i, q.x, q.y, q.z);
      }
      vongQD.xong(161);
      viTriVT(datTay);
    }
    function viTriVT(datTay = true) {
      huongVT(_hv).multiplyScalar(rVT * RE_C).add(TAM_TD);
      veTinh.nhom.position.copy(_hv);
      // pin hướng theo quỹ đạo, ăng-ten (−y của vệ tinh) chĩa về Trái Đất
      const xuong = TAM_TD.clone().sub(_hv).normalize();
      veTinh.nhom.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), xuong);
      dhVT.nhom.position.copy(_hv).add(new THREE.Vector3(0, 0.75, 0));
      nhanVT.position.copy(dhVT.nhom.position);
      if (datTay && !tt.dangKeo) tayVT.dat(_hv);
    }

    const GOC = {
      tong: [[2.8, 6.9, 17.5], [-0.3, -1.3, 0]],   // nhìn đủ năm đồng hồ và họng lỗ đen, họng không bị bảng số liệu góc dưới che
      gan: [[7.4, 0.9, 5.4], [0.5, -3.8, 0.2]],
      chop: [[8.2, 10.5, 15.5], [2.6, -1.0, 3.4]],
      thap: [[1.45, 1.05, 3.3], [0.05, 0.5, 0]],
      gps: [[2.5, 9.5, 23.5], [0, -2.6, 0]],
    };
    const goc = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    function datCanh(ten, ngay = false) {
      canh = ten;
      sLD.dat(ten === 'loden' ? 1 : 0, ngay);
      sTD.dat(ten === 'traidat' ? 1 : 0, ngay);
      const ld1 = ten === 'loden';
      dkR.el.hidden = !ld1;
      dt2.el.hidden = !ld1;
      dkH.el.hidden = ld1;
      dkVT.el.hidden = ld1;
      tayPhg.an(!ld1);
      tayThap.an(ld1 || soSanh !== 'thap');
      tayVT.an(ld1 || soSanh !== 'vetinh');
      t = 0; tau = 0; tauChopCuoi = 0; tThap = 0; tVT = 0; dsChop = []; tNhanCuoi = null; khoangNhan = null;
    }

    // Xem tháp thì ẩn quỹ đạo và vệ tinh; xem vệ tinh thì ẩn nhãn, tay nắm của tháp cho đỡ rối.
    function datSoSanh(v) {
      soSanh = v;
      const thap1 = v === 'thap';
      for (const o of [vongQD.line, vongGPS.line, veTinh.nhom, dhVT.nhom, nhanVT, nhanGPS]) o.visible = !thap1;
      for (const o of [nhanThap, nhanDat, nhanDhThap]) o.visible = thap1;
      if (canh === 'traidat') { tayThap.an(!thap1); tayVT.an(thap1); }
    }

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      if (o.canh && o.canh !== canh) datCanh(o.canh);
      if (o.r != null) { dkR.dat(o.r); rLX.dat(Math.log(o.r - 1)); }
      if (o.h != null) { dkH.dat(o.h); datThap(o.h); }
      if (o.rVT != null) { dkVT.dat(o.rVT); datVT(o.rVT); }
      if (o.soSanh) datSoSanh(o.soSanh);
      if (o.tocDo != null) { tocDo = o.tocDo; dkTocDo.dat(o.tocDo); }
      if (o.viDu) datViDu(o.viDu);
      if (o.mayAnh) goc(o.mayAnh);
      if (o.datLaiKeo) { daKeo.phg = daKeo.thap = daKeo.vt = false; }
    }
    datPhg(rPhg);
    datThap(hThap);
    datVT(rVT);
    datViDu(viDu);
    datCanh('loden', true);
    datSoSanh('thap');

    // ----- Âm thanh: tiếng tích của hai đồng hồ, tiếng «ting» của chớp sáng tới trạm thu -----
    let gioTichCuoi = -1;
    function tich(tanSo, lech, doTo) {
      // không dồn tiếng: bỏ qua nếu vừa kêu cách đây chưa tới 25 ms
      const g = am.gio();
      if (g && g - gioTichCuoi < 0.025) return;
      gioTichCuoi = g;
      am.tich({ tanSo, lech, doTo, dai: 0.045 });
    }

    // Tham số thử riêng (chỉ khi chạy im lặng để chụp ảnh): đặt sẵn một trạng thái.
    const thu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    let demKhung = 0;
    function apDungThu() {
      if (thu === 'nua') { daKeo.phg = true; cauHinh({ r: 4 / 3 }); }
      else if (thu === 'z25') { daKeo.phg = true; cauHinh({ r: 2.78 }); }
      else if (thu === 'thap212') { daKeo.thap = true; cauHinh({ h: H_2NS }); }
      else if (thu === 'vt15') { daKeo.vt = true; cauHinh({ rVT: 1.5 }); }
      else if (thu === 'vtthap') { daKeo.vt = true; cauHinh({ rVT: 1.1 }); }
      else if (thu === 'keo-phg') { const r = 4 / 3; keoGia(app, tayPhg.viTri, new THREE.Vector3(r * cs, mc.y(r) + 0.03, r * sn)); }
      else if (thu === 'keo-thap') keoGia(app, tayThap.viTri, new THREE.Vector3(X_TAY_THAP, (H_2NS / H_THAP) * TH, 0.12));
      else if (thu === 'keo-vt') keoGia(app, tayVT.viTri, huongVT(new THREE.Vector3()).multiplyScalar(1.5 * RE_C).add(TAM_TD));
    }

    const mauChop = new THREE.Color(), xanhLuc = new THREE.Color(0.35, 1.0, 0.55), doTham = new THREE.Color(1.0, 0.12, 0.05);
    function capNhat(dt, dtThuc = dt) {
      if (thu && ++demKhung === (thu.startsWith('keo') ? 150 : 4)) apDungThu();
      // chuyển sân khấu: thu nhỏ cái cũ, phóng to cái mới
      if (!rLX.xong) datPhg(1 + Math.exp(rLX.buoc(dtThuc)));
      const a = sLD.buoc(dtThuc), b = sTD.buoc(dtThuc);
      nhomLD.scale.setScalar(Math.max(1e-3, a)); nhomLD.visible = a > 0.01;
      nhomTD.scale.setScalar(Math.max(1e-3, b)); nhomTD.visible = b > 0.01;
      nhomTD.position.set(0, (1 - b) * -1.5, 0);
      const dT = dt * tocDo;
      const choTieng = dt > 0 && dt < 0.25;
      if (canh === 'loden') {
        const t0 = t, tau0 = tau;
        t += dT;
        const nhipPhg = mc.nhip(rPhg);
        tau += dT * nhipPhg;
        // kim đồng hồ, nháy sáng mỗi giây của chính nó
        for (const d of dsDongHo) { d.dh.nhom.quaternion.copy(camera.quaternion); d.dh.datGio(t * d.nhip); d.dh.capNhat(dtThuc); }
        xa.nhom.quaternion.copy(camera.quaternion); xa.datGio(t); xa.capNhat(dtThuc);
        phg.nhom.quaternion.copy(camera.quaternion); phg.datGio(tau); phg.capNhat(dtThuc);
        if (choTieng) {
          if (Math.floor(t) !== Math.floor(t0)) tich(1250, -0.55, 0.32);
          if (Math.floor(tau) !== Math.floor(tau0)) tich(780, 0.55, 0.4);
        }
        // lửa đẩy dưới bệ: chập chờn
        const k = 0.85 + 0.15 * Math.sin(t * 37) * Math.sin(t * 23);
        for (const l of be.lua) l.scale.set(0.12 * k, 0.3 * k, 1);
        ld.capNhat(dtThuc, camera);
        nguoi.capNhat?.(dtThuc);
        // phát chớp
        if (tau - tauChopCuoi >= CHU_KY_CHOP) {
          tauChopCuoi += CHU_KY_CHOP * Math.floor((tau - tauChopCuoi) / CHU_KY_CHOP);
          dsChop.push({ t0: t, rSao0: rPhg + Math.log(rPhg - 1), nhipPhat: nhipPhg });
          if (dsChop.length > SO_CHOP) dsChop.shift();
        }
        // chớp đi ra: ánh sáng theo phương bán kính có r* = r*₀ + (t − t₀)
        let kk = 0;
        const con = [];
        for (const c of dsChop) {
          const r = rTuRSao(c.rSao0 + (t - c.t0));
          if (r >= R_MAX) {              // tới trạm thu
            if (tNhanCuoi != null) khoangNhan = t - tNhanCuoi;
            tNhanCuoi = t; loe = 1;
            // tiếng «ting»: phát ở 880 Hz theo đồng hồ phi hành gia, nghe ở xa trầm đi đúng tỉ số nhịp
            if (choTieng) am.not({ tanSo: 880 * c.nhipPhat, dai: 0.4, doTo: 0.22, lech: 0.35, dang: 'kinh' });
            continue;
          }
          con.push(c);
          const s = chop[kk++];
          s.visible = true;
          s.position.set(r * cs, mc.y(r) + 0.06, r * sn);
          // tần số mà người đứng yên tại r đo được, so với lúc phát
          const tiSo = c.nhipPhat / mc.nhip(r);
          mauChop.copy(doTham).lerp(xanhLuc, Math.pow(tiSo, 0.8)).multiplyScalar(1.7);
          s.material.color.copy(mauChop);
        }
        dsChop = con;
        for (; kk < SO_CHOP; kk++) chop[kk].visible = false;
        loe = Math.max(0, loe - dtThuc * 2.5);
        tramThu.den.scale.setScalar(0.5 + 1.2 * loe);

        nhanPhg.datChu(chuCanh("canh.phi-hanh-gia-cach-tam-r-s", "Phi hành gia: {0}%<small>cách tâm {1} r<sub>s</sub></small>", [so(nhipPhg * 100, nhipPhg < 0.2 ? 1 : 0), so(rPhg, 2)]));
        const lan = 1 / nhipPhg;
        theSS.dat(chuCanh("canh.1-gio-cua-phi-hanh-gia-gio-o", "<b>1 giờ của phi hành gia = {0} giờ ở xa.</b><br>Phát một chớp mỗi {1} giây (đồng hồ phi hành gia). Ở xa nhận một chớp mỗi <b>{2} giây</b>, và ánh sáng có bước sóng dài gấp {3} lần lúc phát (z = {4}).", [lan < 10 ? so(lan, 2) : so(lan, 0), CHU_KY_CHOP, so(CHU_KY_CHOP * lan, 2), so(lan, 2), so(lan - 1, 3)]));
      } else {
        // sân khấu Trái Đất: đồng hồ chân tháp là mốc; hai đồng hồ kia chạy nhanh hơn với độ chênh đã phóng đại
        const t0 = t, a0 = tThap, b0 = tVT;
        t += dT;
        tThap += dT * (1 + K_THAP * chenhThap(hThap));
        tVT += dT * (1 + K_VT * chenhVT(rVT));
        for (const [d, g] of [[dhDat, t], [dhThap, tThap], [dhVT, tVT]]) { d.nhom.quaternion.copy(camera.quaternion); d.datGio(g); d.capNhat(dtThuc); }
        if (choTieng) {
          if (Math.floor(t) !== Math.floor(t0)) tich(1250, -0.55, 0.32);
          if (soSanh === 'thap' && Math.floor(tThap) !== Math.floor(a0)) tich(780, 0.55, 0.4);
          if (soSanh === 'vetinh' && Math.floor(tVT) !== Math.floor(b0)) tich(780, 0.55, 0.4);
        }
        if (!tt.dangKeo) { gocVT += dT * 0.05; viTriVT(); }
        veTinh.capNhat(dtThuc);
        thap.capNhat(dtThuc);
        traiDat.capNhat(dtThuc);
        const chT = chenhThap(hThap);
        nhanDhThap.datChu(chuCanh("canh.m-nhanh-hon-phan-ti-giay-moi-ngay", "{0} m: nhanh hơn {1}<small>{2} phần tỉ giây mỗi ngày</small>", [so(hThap, 0), luyThua(chT, 2), so(chT * NGAY_GIAY * 1e9, 2)]));
        const us = usHapDan(rVT) - usTocDo(rVT);
        nhanVT.datChu(chuCanh("canh.dong-ho-ve-tinh-cao-km-hap-dan", "Đồng hồ vệ tinh: {0}<small>cao {1} km · hấp dẫn +{2}, tốc độ −{3}</small>", [Math.abs(us) < 0.05 ? chuCanh("canh.chay-bang-mat-dat", "chạy bằng mặt đất") : chuCanh("canh.s-moi-ngay", "{0} {1} µs mỗi ngày", [us >= 0 ? 'nhanh' : chuCanh("canh.cham", "chậm"), so(Math.abs(us), 1)]), so((rVT - 1) * R_TD_KM, 0), so(usHapDan(rVT), 1), so(usTocDo(rVT), 1)]));
        theSS.dat(soSanh === 'thap'
          ? chuCanh("canh.dong-ho-o-m-nhanh-hon-chan-thap", "<b>Đồng hồ ở {0} m nhanh hơn chân tháp {1}</b>, tức {2} phần tỉ giây mỗi ngày (gh/c², g = 9,8 m/s²).<br>Kim và tiếng tích của đồng hồ trên tháp: chênh lệch phóng đại {3} lần.", [so(hThap, 0), luyThua(chT, 2), so(chT * NGAY_GIAY * 1e9, 2), luyThua(K_THAP, 1)])
          : chuCanh("canh.dong-ho-ve-tinh-hon-mat-dat-micro", "<b>Đồng hồ vệ tinh {0} hơn mặt đất {1} micro giây mỗi ngày</b> (hấp dẫn +{2}, tốc độ −{3}; bỏ qua Trái Đất tự quay).<br>Kim và tiếng tích của đồng hồ vệ tinh: chênh lệch phóng đại {4} lần.", [us >= 0 ? 'nhanh' : chuCanh("canh.cham", "chậm"), so(Math.abs(us), 1), so(usHapDan(rVT), 1), so(usTocDo(rVT), 1), luyThua(K_VT, 1)]));
      }
    }

    function hud() {
      if (canh === 'traidat') {
        const us = usHapDan(rVT) - usTocDo(rVT);
        return [
          [chuCanh("canh.dong-ho-chan-thap", "Đồng hồ chân tháp"), chuCanh("canh.giay", "{0} giây", [so(t, 1)])],
          [chuCanh("canh.dong-ho-tren-thap", "Đồng hồ trên tháp"), chuCanh("canh.m-nhanh-hon", "{0} m · nhanh hơn {1}", [so(hThap, 0), luyThua(chenhThap(hThap), 2)])],
          [chuCanh("canh.dong-ho-ve-tinh", "Đồng hồ vệ tinh"), chuCanh("canh.r-s-moi-ngay", "{0} R · {1}{2} µs mỗi ngày", [so(rVT, 2), us >= 0 ? '+' : '−', so(Math.abs(us), 1)])],
          [chuCanh("canh.luu-y", "Lưu ý"), chuCanh("canh.thap-ve-cao-gap-lan-kim-phong-dai", "tháp vẽ cao gấp {0} lần; kim phóng đại chênh lệch (tháp {1}, vệ tinh {2} lần)", [so(PHONG_DAI_THAP, 0), luyThua(K_THAP, 1), luyThua(K_VT, 1)])],
        ];
      }
      const n = mc.nhip(rPhg);
      return [
        [chuCanh("canh.dong-ho-o-xa", "Đồng hồ ở xa"), chuCanh("canh.giay", "{0} giây", [so(t, 1)])],
        [chuCanh("canh.dong-ho-phi-hanh-gia", "Đồng hồ phi hành gia"), chuCanh("canh.giay-nhip", "{0} giây (nhịp {1}%)", [so(tau, 1), so(n * 100, 1)])],
        [chuCanh("canh.chop-sang-toi-tram-thu", "Chớp sáng tới trạm thu"), khoangNhan ? chuCanh("canh.cach-nhau-giay-phat-cach-nhau-giay", "cách nhau {0} giây (phát cách nhau {1} giây)", [so(khoangNhan, 2), CHU_KY_CHOP]) : chuCanh("canh.dang-cho", "đang chờ…")],
        [chuCanh("canh.luu-y", "Lưu ý"), chuCanh("canh.mat-luoi-la-lat-cat-khong-gian-bai", "mặt lưới là lát cắt không gian (Bài 11); ở bài này chỉ cần nhìn kim và màu")],
      ];
    }

    return {
      scene, capNhat, hud, cauHinh, goc,
      // cho thử thách
      nhipPhg: () => (canh === 'loden' ? mc.nhip(rPhg) : NaN),
      khoangNhanLyThuyet: () => (canh === 'loden' ? CHU_KY_CHOP / mc.nhip(rPhg) : NaN),
      nsNgayThap: () => (canh === 'traidat' ? chenhThap(hThap) * NGAY_GIAY * 1e9 : NaN),
      usNgayVT: () => (canh === 'traidat' ? usHapDan(rVT) - usTocDo(rVT) : NaN),
      huy() { am.dungHet?.(0.2); },
    };
  },
};
