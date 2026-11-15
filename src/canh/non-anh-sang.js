import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 5 — Nón ánh sáng và nhân quả.
// Sơ đồ không-thời gian 2 chiều không gian + thời gian (thời gian hướng lên, c = 1; xem src/khung/ktg.js).
// Sự kiện O ở gốc; nón tương lai, nón quá khứ; tấm «bây giờ» cắt nón thành vòng sóng ánh sáng.
// Sự kiện P di chuyển được: phân loại khoảng (kiểu thời gian, ánh sáng, không gian), mặt hyperboloid
// «cùng khoảng» đi qua P. Một con tàu tăng tốc rồi hãm kèm các nón nhỏ dọc đường.
// «Nhìn xa là nhìn về quá khứ»: nón quá khứ của ta cắt đường thế giới của thiên thể ở t = −d/c.

import * as THREE from 'three';
import { so, luyThua, NAM_GIAY } from '../vat-ly/hang-so.js';
import { jdTuMs } from '../vat-ly/he-mat-troi.js';
import {
  binhPhuongKhoang, phanLoai, thoiGianRieng, khoangCachRieng, viTriTau, vanTocTau, thoiGianRiengTau,
  giayAnhSangKm, giayAnhSangAU, giayTuNam, khoangCachTraiDatHoa, khoangCachVoyager1,
  R_MAT_TRANG_KM, NAS_ALPHA_CEN, NAS_TAM_NGAN_HA, NAS_ANDROMEDA,
} from '../vat-ly/khoang-cach-anh-sang.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, DuongDong, duongDayTinh } from '../khung/ve.js';
import { MAU_KTG, trucKTG, luoiSan, matHienTai, nonAnhSang, suKien, vongNgang } from '../khung/ktg.js';
import { taoTraiDat, taoMatTrang, taoMatTroi, taoHanhTinh, taoSao, taoLoDenNho, taoThienHaNho } from '../khung/hanh-tinh.js';
import { bienDoi } from '../vat-ly/lorentz.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('non-anh-sang', khoa, goc, thamSo);

const R = String.raw;

const H = 6;            // nón cao 6 đơn vị (mỗi đơn vị: 1 năm, 1 năm ánh sáng)
const NUA = 6.5;        // nửa cạnh sàn
const T_TAU = 6, V_TAU = 0.8;
const D_XA = 4.5;       // khoảng cách vẽ của thiên thể ở bước «nhìn xa»
// Thời điểm ở nhà khi đồng hồ trên tàu chỉ đúng 2 năm (đích của thử thách bước 5; kiểm trong kiem-non-anh-sang.mjs)
// MOC_TAU[k]: thời điểm ở nhà khi đồng hồ trên tàu chỉ đúng k năm.
const MOC_TAU = [0, 1, 2, 3, 4].map((k) => { let a = 0, b = T_TAU; for (let i = 0; i < 50; i++) { const c = (a + b) / 2; if (thoiGianRiengTau(c, T_TAU, V_TAU) < k) a = c; else b = c; } return a; });
const T_TAU_2 = MOC_TAU[2];
const MAU_LOAI = {
  tuongLai: 0xffb86b, quaKhu: 0x8fb0ff, anhSangTL: MAU_KTG.anhSang, anhSangQK: MAU_KTG.anhSang, khongGian: MAU_KTG.tim, trung: 0xffffff,
};
const MO_TA_LOAI = {
  tuongLai: [chuCanh("canh.kieu-thoi-gian-p-o-tuong-lai-cua", "kiểu thời gian, P ở tương lai của O"), chuCanh("canh.o-co-the-anh-huong-toi-p", "O có thể ảnh hưởng tới P")],
  quaKhu: [chuCanh("canh.kieu-thoi-gian-p-o-qua-khu-cua", "kiểu thời gian, P ở quá khứ của O"), chuCanh("canh.p-co-the-da-anh-huong-toi-o", "P có thể đã ảnh hưởng tới O")],
  anhSangTL: [chuCanh("canh.kieu-anh-sang-tren-non-tuong-lai", "kiểu ánh sáng (trên nón tương lai)"), chuCanh("canh.chi-anh-sang-noi-duoc-o-voi-p", "chỉ ánh sáng nối được O với P")],
  anhSangQK: [chuCanh("canh.kieu-anh-sang-tren-non-qua-khu", "kiểu ánh sáng (trên nón quá khứ)"), chuCanh("canh.chi-anh-sang-noi-duoc-p-voi-o", "chỉ ánh sáng nối được P với O")],
  khongGian: [chuCanh("canh.kieu-khong-gian-p-o-noi-khac", "kiểu không gian, P ở nơi khác"), chuCanh("canh.khong-tin-hieu-nao-noi-duoc-khong-co", "không tín hiệu nào nối được; không có quan hệ nhân quả")],
  trung: [chuCanh("canh.p-trung-o", "P trùng O"), ''],
};

// Đổi số giây ánh sáng thành chữ dễ đọc.
function doiGiay(s) {
  if (s < 90) return chuCanh("canh.giay", "{0} giây", [so(s, s < 10 ? 2 : 0)]);
  if (s < 3 * 3600) return chuCanh("canh.phut", "{0} phút", [so(s / 60, 1)]);
  if (s < 3 * 86400) return chuCanh("canh.gio", "{0} giờ", [so(s / 3600, 1)]);
  const nam = s / NAM_GIAY;
  if (nam < 2) return chuCanh("canh.ngay", "{0} ngày", [so(s / 86400, 0)]);
  if (nam < 1e6) return chuCanh("canh.nam", "{0} năm", [so(nam, nam < 100 ? 2 : 0)]);
  return chuCanh("canh.trieu-nam", "{0} triệu năm", [so(nam / 1e6, 1)]);
}

export default {
  id: 'non-anh-sang',
  ten: 'Nón ánh sáng và nhân quả',
  moTa: 'Ánh sáng chia không-thời gian quanh mỗi sự kiện thành quá khứ, tương lai và «nơi khác»',
  yChinh: 'Ánh sáng phát ra từ một sự kiện vạch nên một **nón** trong không-thời gian. Sự kiện trong nón tương lai có thể chịu ảnh hưởng của nó; sự kiện trong nón quá khứ có thể đã ảnh hưởng tới nó; sự kiện ngoài nón không có quan hệ nhân quả nào với nó. Đại lượng $s^2 = -c^2\\Delta t^2 + \\Delta x^2$ cho biết hai sự kiện thuộc loại nào, và mọi người quan sát đều tính ra cùng một giá trị.',
  mayAnh: { viTri: [17.5, 6.5, 20.5], dich: [0.3, -0.2, 0], fov: 40, min: 5, max: 70 },
  hinh: { quang: 0.45, nguong: 0.9 },

  baiGiang: {
    mucTieu: [
      'Dựng được nón ánh sáng của một sự kiện từ vòng sóng ánh sáng lan ra trong không gian.',
      'Phân loại được khoảng giữa hai sự kiện (kiểu thời gian, ánh sáng, không gian) bằng dấu của s².',
      'Tính được thời gian riêng τ và khoảng cách riêng σ giữa hai sự kiện.',
      'Giải thích được vì sao mọi đường thế giới đều nằm trong nón của chính nó.',
      'Tính được ta đang nhìn thấy một thiên thể «của bao lâu trước».',
    ],
    buoc: [
      {
        ten: 'Một chớp sáng',
        noiDung: R`
          Tại gốc tọa độ, một ngọn đèn chớp lên đúng một lần. Đó là sự kiện **O**: «ở đây, lúc này». Như ở Bài 4, trục đứng là thời gian, mặt sàn là không gian (bỏ bớt một chiều), mỗi ô dài **1 năm ánh sáng** và mỗi nấc trên trục là **1 năm**, nên ánh sáng nghiêng đúng 45°.

          Ánh sáng từ chớp đèn lan ra mọi hướng với cùng tốc độ $c$. Sau thời gian $t$, mặt sóng là một **vòng tròn** bán kính $r = ct$: sau 1 năm, bán kính 1 năm ánh sáng; sau 3 năm, 3 năm ánh sáng. Trên sàn bạn thấy vòng sóng ấy lớn dần.

          Trong không-thời gian, mỗi vòng nằm ở đúng độ cao $t$ của nó. Chồng tất cả các vòng lên nhau, bán kính tăng đều theo độ cao, ta được một **mặt nón** có đỉnh ở O, sườn nghiêng 45°. Đó là {{nón ánh sáng}} của O.

          > [Thử ngay] Tấm xanh lục là «bây giờ». Chỗ nó cắt nón (vòng vàng) chính là vòng sóng lúc đó.
          > [[Nhìn từ trên xuống (chỉ thấy không gian)|tren]] [[Nhìn ngang (thấy 45°)|ngang]] [[Nhìn chéo|cheo]]
          >
          > Hoặc kéo đốm xanh lục ở góc tấm để tự đưa «bây giờ» lên xuống. Mỗi khi tấm đi qua O có một tiếng chuông: đó là lúc đèn chớp.

          > [Lưu ý] Không-thời gian thật có ba chiều không gian. Khi đó mặt sóng là **mặt cầu** lớn dần, và «nón» là một mặt ba chiều trong không-thời gian bốn chiều. Hình bỏ một chiều để vẽ được, nhưng mọi tính toán vẫn đúng.`,
        vao: (c) => c.cauHinh({ hien: { vongXep: true, nonTren: true, nonDuoi: false }, chay: true, vao: true, mayAnh: 'cheo' }),
        nut: { tren: (c) => c.goc('tren'), ngang: (c) => c.goc('ngang'), cheo: (c) => c.goc('cheo') },
      },
      {
        ten: 'Nón tương lai, nón quá khứ, và «nơi khác»',
        noiDung: R`
          Giờ cho tấm «bây giờ» chạy từ dưới lên. Ở phía dưới O, vòng ánh sáng màu xanh **thu nhỏ dần** về O: đó là ánh sáng từ khắp nơi đang bay tới, đúng lúc chớp đèn thì chạm vào O. Những vòng ấy dựng nên nón thứ hai, chúc xuống dưới.

          - {{nón tương lai}} (vàng, mở lên trên): mọi sự kiện mà một tín hiệu xuất phát từ O, đi chậm hơn hoặc bằng ánh sáng, có thể tới. O có thể **ảnh hưởng** tới chúng.
          - {{nón quá khứ}} (xanh, mở xuống dưới): mọi sự kiện có thể đã gửi tín hiệu tới O. Chúng có thể đã **ảnh hưởng** tới O.
          - Phần còn lại, ngoài cả hai nón: vùng {{ở nơi khác}}. Không tín hiệu nào nối chúng với O, kể cả ánh sáng.

          > [Thử ngay] Đặt sự kiện P vào từng vùng. Màu của P và của đoạn O–P đổi theo vùng.
          > [[P trong nón tương lai|tl]] [[P trong nón quá khứ|qk]] [[P ở nơi khác|nk]] [[Nhìn ngang|ngang]]
          >
          > Hoặc kéo thẳng sự kiện P trong hình. Mỗi khi P đi qua mặt nón có một nốt nhạc: trong nón một tiếng trầm ấm, đúng trên mặt nón một tiếng trong như kính, ở nơi khác một tiếng chuông. Nốt nhạc chỉ để tai nhận ra P vừa đổi vùng.

          > [Hiểu sai thường gặp] «Ở nơi khác» không có nghĩa là xa. Sự kiện cách ta 1 mét nhưng xảy ra sớm hoặc muộn hơn ta chưa tới 3,3 phần tỉ giây (thời gian ánh sáng đi 1 mét) là đã nằm ngoài nón của ta.`,
        vao: (c) => c.cauHinh({ hien: { nonTren: true, nonDuoi: true, P: true, vungNhan: true }, chay: true, dx: 2, dt: 4.5, vao: true, mayAnh: 'cheo' }),
        thuThach: {
          de: 'Kéo P vào vùng «ở nơi khác» mà vẫn thật gần O: cách O không quá **1 năm ánh sáng**.',
          kiem: (c) => c.dat.gan(),
          goiY: R`Ở nơi khác nghĩa là $|\Delta t| \lt \Delta x$. Đặt P sát mặt sàn, ngay cạnh O.`,
        },
        nut: { tl: (c) => c.datP(2, 4.5), qk: (c) => c.datP(2.5, -4.5), nk: (c) => c.datP(5, 1.5), ngang: (c) => c.goc('ngang') },
      },
      {
        ten: 'Ba loại khoảng giữa hai sự kiện',
        noiDung: R`
          Hai sự kiện O và P cách nhau $\Delta t$ về thời gian và $\Delta x$ về không gian. Chúng ta gộp hai số đó thành một đại lượng gọi là {{khoảng không-thời gian}}:

          $$ s^2 = -c^2\Delta t^2 + \Delta x^2 + \Delta y^2 + \Delta z^2 $$

          Trong mô hình chỉ có một hướng không gian và $c = 1$, nên $s^2 = -\Delta t^2 + \Delta x^2$. Dấu của $s^2$ cho biết P nằm ở đâu so với nón của O:

          | | Dấu | Vị trí của P | Ví dụ $(\Delta x;\ \Delta t)$ |
          |---|---|---|---|
          | {{kiểu thời gian}} | $s^2 \lt 0$ | trong nón | $(3;\ 5)$: $s^2 = -16$ |
          | {{kiểu ánh sáng}} | $s^2 = 0$ | trên mặt nón | $(4;\ 4)$: $s^2 = 0$ |
          | {{kiểu không gian}} | $s^2 \gt 0$ | ngoài nón | $(5;\ 3)$: $s^2 = 16$ |

          > [Thử ngay] [[P = (3; 5)|p35]] [[P = (4; 4)|p44]] [[P = (5; 3)|p53]] Hoặc kéo hai thanh **Δx** và **Δt** ở dưới và xem số $s^2$ trong ô số liệu.
          >
          > Cũng có thể kéo thẳng P trong hình; P bắt dính vào mặt nón khi lại gần. Kéo đốm xanh lam ở đầu trục $t'$ để thêm một người quan sát thứ hai bay với vận tốc $v$: hai trục nghiêng của người ấy hiện ra, cùng hai số $\Delta t'$, $\Delta x'$ người ấy đo cho P. Hai số ấy đổi theo $v$, còn $s^2$ thì không. Khi P ở nơi khác, mỗi lần thứ tự O, P đổi theo người quan sát có một tiếng kính.

          Điều quan trọng nhất: hai người quan sát chuyển động khác nhau sẽ đo ra $\Delta t$ khác nhau, $\Delta x$ khác nhau, nhưng **cùng một $s^2$**. Bài 6 sẽ chứng minh bằng phép biến đổi Lorentz. Vì thế việc P nằm trong, trên hay ngoài nón là sự thật chung cho mọi người.

          +++ Đi sâu: vì sao dấu của s² quyết định ai ảnh hưởng được ai
          Muốn gửi một vật hay tín hiệu từ O tới P, nó phải đi quãng $\Delta x$ trong thời gian $\Delta t > 0$, tức với tốc độ $v = \Delta x / \Delta t$. Vì không gì nhanh hơn ánh sáng, cần $v \le c$:

          $$ \frac{\Delta x}{\Delta t} \le c \iff \Delta x^2 \le c^2 \Delta t^2 \iff s^2 \le 0 $$

          Nếu $s^2 \gt 0$, mọi tín hiệu nối O với P đều phải nhanh hơn ánh sáng. Không có tín hiệu nào như thế, nên O và P không thể là nguyên nhân và kết quả của nhau.
          +++`,
        vao: (c) => c.cauHinh({ hien: { nonTren: true, nonDuoi: true, P: true, catNgang: true, anKinh: true, nqs: true }, chay: false, dx: 3, dt: 5, v: 0, vao: true, mayAnh: 'ngang' }),
        thuThach: {
          de: 'Đặt P ở nơi khác (ví dụ bấm P = (5; 3)), rồi kéo người quan sát thứ hai tới khi người ấy thấy O và P **xảy ra cùng lúc**: Δt′ = 0 (sai số 0,1). Khi đó Δx′ bằng bao nhiêu?',
          kiem: (c) => c.dat.cungLuc(),
          goiY: R`$\Delta t' = 0$ khi trục $x'$ (đường «bây giờ» của người ấy) đi qua P, tức $v = \Delta t / \Delta x$. Với P = (5; 3): $v = 0{,}6$, và $\Delta x' = \sigma = 4$.`,
        },
        nut: { p35: (c) => c.datP(3, 5), p44: (c) => c.datP(4, 4), p53: (c) => c.datP(5, 3) },
      },
      {
        ten: 'Thời gian riêng: đồng hồ của người đi từ O tới P',
        noiDung: R`
          P nằm trong nón tương lai của O, ở $\Delta x = 3$ năm ánh sáng và $\Delta t = 5$ năm. Một phi hành gia rời O, bay thẳng đều tới P. Tốc độ cần có: $v = \Delta x / \Delta t = 0{,}6\,c$.

          Đồng hồ mang theo người đó đo được {{thời gian riêng}}:

          $$ \tau = \sqrt{\Delta t^2 - \frac{\Delta x^2}{c^2}} = \sqrt{25 - 9} = 4\ \text{năm} $$

          Ở nhà trôi qua 5 năm, đồng hồ của phi hành gia chỉ 4 năm. Đó không phải đồng hồ chạy sai: $\tau$ là «độ dài» của đường thế giới O–P, đo bằng thước của không-thời gian. Với người đứng yên ở O ($\Delta x = 0$), $\tau = \Delta t$.

          Mặt lưới màu cam gồm **mọi** sự kiện có cùng $\tau = 4$ tính từ O: $(0;\ 4)$, $(3;\ 5)$, $(4;\ 5{,}66)$… Nó không phải mặt cầu mà là một **hyperboloid**, vì phương trình của nó là $t^2 - x^2 - y^2 = 16$. Mỗi điểm trên đó là nơi một người rời O, đi thẳng đều, đúng 4 năm theo đồng hồ của mình.

          > [Thử ngay] [[P = (3; 5)|p35]] [[P = (4; 5,66)|p4]] [[P = (0; 4)|p04]] [[Kiểu không gian: P = (5; 3)|p53]]
          >
          > Hoặc kéo P trong hình: mặt lưới đi theo P. Kéo người quan sát thứ hai tới khi trục $t'$ của người ấy đi qua P: người ấy chính là phi hành gia, đo được $\Delta x' = 0$ và $\Delta t' = \tau$.

          Với P ngoài nón, không ai đi được từ O tới P. Thay vào đó có {{khoảng cách riêng}} $\sigma = \sqrt{\Delta x^2 - c^2\Delta t^2}$: với $(5;\ 3)$, $\sigma = 4$ năm ánh sáng. Đó là khoảng cách đo bởi người quan sát thấy O và P **xảy ra cùng lúc**. Mặt «cùng $\sigma$» là hyperboloid một tầng bao quanh nón.

          +++ Đi sâu: vì sao τ² = Δt² − Δx²
          Người bay từ O tới P mang theo đồng hồ. Trong khung của chính người đó, O và P xảy ra **cùng một chỗ** (ngay tại phi hành gia), nên $\Delta x' = 0$ và $\Delta t' = \tau$. Khoảng $s^2$ như nhau cho mọi người quan sát, nên

          $$ -\tau^2 = s^2 = -\Delta t^2 + \Delta x^2 \quad\Rightarrow\quad \tau = \sqrt{\Delta t^2 - \Delta x^2} $$

          Tương tự, với P kiểu không gian, có một người quan sát thấy O và P cùng lúc ($\Delta t' = 0$); với người đó $s^2 = \sigma^2$. Có người khác lại thấy P xảy ra **trước** O, và có người thấy **sau** O: thứ tự thời gian của hai sự kiện ở nơi khác tuỳ người quan sát. Bài 6 vẽ rõ điều này.
          +++`,
        vao: (c) => c.cauHinh({ hien: { nonTren: true, nonDuoi: true, P: true, hyp: true, anKinh: true, nqs: true }, chay: false, dx: 3, dt: 5, v: 0, vao: true, mayAnh: 'cheo' }),
        thuThach: {
          de: 'Kéo P tới một sự kiện cách O ít nhất 2 năm ánh sáng mà thời gian riêng tính từ O đúng **τ = 3 năm** (sai số 0,05).',
          kiem: (c) => c.dat.tau3(),
          goiY: R`Cần $\Delta t^2 - \Delta x^2 = 9$, ví dụ $\Delta x = 4$, $\Delta t = 5$. Khi kéo, ô số liệu cho τ của P.`,
        },
        nut: { p35: (c) => c.datP(3, 5), p4: (c) => c.datP(4, Math.sqrt(32)), p04: (c) => c.datP(0, 4), p53: (c) => c.datP(5, 3) },
      },
      {
        ten: 'Đường thế giới luôn nằm trong nón của chính nó',
        noiDung: R`
          Một con tàu rời O lúc $t = 0$, tăng tốc lên tối đa $0{,}8\,c$ rồi hãm lại, dừng hẳn sau 6 năm, cách chỗ cũ 3,06 năm ánh sáng. Đường thế giới của nó (màu hồng) cong.

          Dọc đường, ở 6 sự kiện, ta vẽ nón ánh sáng nhỏ của chính sự kiện đó. Đoạn trắng là hướng đi của tàu lúc ấy. Ở mọi chỗ, đoạn trắng nằm **trong** nón nhỏ: tàu không bao giờ đi nhanh bằng ánh sáng. Lúc nhanh nhất ($0{,}8\,c$) đường nghiêng $38{,}7°$ so với trục thời gian, vẫn dốc hơn sườn nón $45°$.

          Một vật có khối lượng luôn có đường thế giới **kiểu thời gian**: mọi sự kiện xảy ra sau trên đường của nó nằm trong nón tương lai của mọi sự kiện xảy ra trước đó. Đường đứt nét đỏ là thứ không được phép: nó bay nhanh hơn ánh sáng, đâm ra ngoài nón.

          > [Thử ngay] [[Xem con tàu|tau]] [[Nhìn ngang|ngang]]
          >
          > Hoặc kéo con tàu dọc đường đi của nó. Các chấm hồng trên đường đánh dấu τ = 1, 2, 3, 4 năm theo đồng hồ trên tàu. Có hai đồng hồ để nghe: tiếng tích bên trái là đồng hồ ở nhà, mỗi năm một tiếng; tiếng trong bên phải là đồng hồ trên tàu. Cả chặng, ở nhà tích 6 lần, trên tàu chỉ 4 lần.

          > [Con số] Đồng hồ trên tàu đo được $\tau = \int \sqrt{1 - v^2/c^2}\,\dd t \approx 4{,}88$ năm cho chặng 6 năm. Đường cong trong không-thời gian **ngắn hơn** đường thẳng đứng của người ở nhà (6 năm): ngược với hình học quen thuộc, ở đây đường thẳng (kiểu thời gian) là đường **dài nhất**. Bài 6 dùng điều này cho nghịch lý anh em sinh đôi.

          Vì mọi vật phải ở trong nón tương lai của chính mình, không gì thoát khỏi nón ấy: tương lai của bạn bị giới hạn bởi ánh sáng.`,
        vao: (c) => c.cauHinh({ hien: { nonTren: true, nonDuoi: true, tau: true, anKinh: true }, chay: true, vao: true, mayAnh: 'tau' }),
        thuThach: {
          de: 'Kéo con tàu tới lúc đồng hồ trên tàu chỉ đúng **2 năm** (sai số 0,03). Ở nhà khi đó là bao nhiêu năm?',
          kiem: (c) => c.dat.tau2(),
          goiY: 'Chấm hồng «τ = 2» trên đường thế giới đánh dấu chỗ ấy. Ở nhà khi đó khoảng 2,30 năm: đồng hồ trên tàu đã chậm hơn chừng 0,3 năm.',
        },
        nut: { tau: (c) => c.cauHinh({ hien: { nonTren: true, nonDuoi: true, tau: true, anKinh: true }, chay: true, mayAnh: 'tau' }), ngang: (c) => c.goc('ngang') },
      },
      {
        ten: 'Nhìn xa là nhìn về quá khứ',
        noiDung: R`
          Đường xanh thẳng đứng qua O là ta. Đường trắng bên phải là một thiên thể cách ta khoảng $d$. Ánh sáng ta nhận được **lúc này** đi dọc theo **nón quá khứ** của O. Nón ấy cắt đường thế giới của thiên thể tại $t = -d/c$: ta đang thấy nó của $d/c$ trước. Sự kiện «nó lúc này» nằm ở nơi khác, ta chưa thể biết gì về nó.

          > [Thử ngay] Chọn thiên thể (đơn vị trên trục đổi theo từng ví dụ):
          > [[Mặt Trăng|trang]] [[Mặt Trời|troi]] [[Sao Hỏa hôm nay|hoa]] [[Voyager 1|voyager]]
          > [[Alpha Centauri|alpha]] [[Tâm Ngân Hà|tam]] [[Thiên hà Andromeda|andromeda]]
          >
          > Rê chuột vào hai sự kiện trên đường của thiên thể (chấm vàng và chấm trắng) để xem chú giải.

          | Thiên thể | Khoảng cách | Ta đang thấy nó của |
          |---|---|---|
          | Mặt Trăng | 384 400 km | 1,28 giây trước |
          | Mặt Trời | 1 AU | 499 giây = 8,3 phút trước |
          | Sao Hỏa | 0,37 tới 2,68 AU, tuỳ ngày | 3 tới 22 phút trước |
          | Voyager 1 | khoảng 172 AU (tháng 11/2026) | gần 24 giờ trước |
          | Alpha Centauri | 4,37 năm ánh sáng | 4,37 năm trước |
          | tâm Ngân Hà | 26 700 năm ánh sáng | 26 700 năm trước |
          | thiên hà Andromeda | 2,5 triệu năm ánh sáng | 2,5 triệu năm trước |

          Nếu Mặt Trời biến mất ngay lúc này, **8,3 phút** nữa ta mới biết: ánh sáng cuối cùng của nó vẫn đang trên đường, và Trái Đất vẫn bay theo quỹ đạo cũ thêm 8,3 phút, vì sự thay đổi của **trọng lực** cũng lan đi với tốc độ $c$.

          > [Con số] Ngày 17/8/2017, sóng hấp dẫn từ hai sao neutron va nhau (sự kiện GW170817) và chớp tia gamma từ cùng vụ va chạm tới Trái Đất cách nhau chưa đầy 2 giây, sau hành trình khoảng 130 triệu năm. Vậy tốc độ của sóng hấp dẫn và tốc độ ánh sáng khác nhau không quá cỡ một phần triệu tỉ ($10^{-15}$).`,
        vao: (c) => c.cauHinh({ hien: { nonTren: false, nonDuoi: true, xa: true }, chay: false, tt: 'troi', vao: true, mayAnh: 'xa' }),
        nut: Object.fromEntries(['trang', 'troi', 'hoa', 'voyager', 'alpha', 'tam', 'andromeda'].map((k) => [k, (c) => c.chonThienThe(k)])),
      },
      {
        ten: 'Bộ khung nhân quả của vũ trụ',
        noiDung: R`
          Gom lại: mỗi sự kiện mang theo một nón ánh sáng, và các nón ấy quyết định sự kiện nào có thể là nguyên nhân của sự kiện nào.

          - Trong nón: có quan hệ nhân quả; mọi người quan sát đồng ý sự kiện nào xảy ra trước.
          - Trên nón: chỉ ánh sáng (và sóng hấp dẫn) nối được.
          - Ngoài nón: không có quan hệ nhân quả; thứ tự trước sau tuỳ người quan sát.

          Mọi vật có khối lượng đi trong nón của chính mình. Nón không phụ thuộc người quan sát: ai cũng vẽ ra đúng những nón ấy, vì ai cũng đo được cùng một tốc độ ánh sáng và cùng một $s^2$.

          > [Thử ngay] [[Xem cả bộ khung|tat]]
          >
          > Hoặc kéo P và kéo con tàu: P đổi màu theo vùng so với O, còn tàu đi tới đâu cũng nằm trong nón nhỏ của chính nó.

          Trong không-thời gian phẳng ở đây, mọi nón đều dựng thẳng và giống hệt nhau. Thuyết tương đối rộng thay đổi đúng chỗ này: gần một khối lượng lớn, **trọng lực làm các nón nghiêng đi**. Càng gần lỗ đen nón càng nghiêng; vượt qua chân trời sự kiện thì cả nón tương lai chúc vào trong: mọi tương lai đều dẫn tới tâm. Bài 16 sẽ vẽ những chiếc nón nghiêng ấy.

          > [Lịch sử] Hình nón ánh sáng đã có trong bài giảng «Raum und Zeit» (Không gian và thời gian) của Hermann Minkowski năm 1908, bài giảng nổi tiếng trình bày thuyết tương đối như hình học của không-thời gian bốn chiều.`,
        vao: (c) => c.cauHinh({ hien: { nonTren: true, nonDuoi: true, P: true, tau: true, vungNhan: true, anKinh: true }, chay: true, dx: 5, dt: 2, vao: true, mayAnh: 'cheo' }),
        nut: { tat: (c) => c.cauHinh({ hien: { nonTren: true, nonDuoi: true, P: true, tau: true, vungNhan: true, anKinh: true }, chay: true, dx: 5, dt: 2, mayAnh: 'cheo' }) },
      },
    ],
    congThuc: [
      { ten: 'Khoảng không-thời gian', tex: R`s^2 = -c^2\Delta t^2 + \Delta x^2 + \Delta y^2 + \Delta z^2`, y: R`Như nhau với mọi người quan sát quán tính. $s^2 \lt 0$: kiểu thời gian; $= 0$: kiểu ánh sáng; $\gt 0$: kiểu không gian.` },
      { ten: 'Thời gian riêng (kiểu thời gian)', tex: R`\tau = \sqrt{\Delta t^2 - \frac{\Delta x^2}{c^2}}`, y: R`Thời gian đồng hồ của người đi thẳng đều từ O tới P đo được. Ví dụ $(3;\ 5)$: $\tau = 4$.` },
      { ten: 'Khoảng cách riêng (kiểu không gian)', tex: R`\sigma = \sqrt{\Delta x^2 - c^2\Delta t^2}`, y: R`Khoảng cách đo bởi người thấy O và P cùng lúc. Ví dụ $(5;\ 3)$: $\sigma = 4$.` },
      { ten: 'Nón ánh sáng của O', tex: R`c^2 t^2 = x^2 + y^2 + z^2`, y: R`Nửa trên ($t \gt 0$): nón tương lai; nửa dưới: nón quá khứ.` },
      { ten: 'Nhìn xa là nhìn về quá khứ', tex: R`t_{\text{phát}} = -\frac{d}{c}`, y: 'Ánh sáng ta thấy lúc này rời vật ở khoảng cách $d$ từ $d/c$ trước.' },
    ],
    cauHoi: [
      {
        hoi: 'Hai sự kiện cách nhau Δt = 2 năm và Δx = 3 năm ánh sáng. Điều nào đúng?',
        chon: ['Sự kiện đầu có thể là nguyên nhân của sự kiện sau', 'Chỉ ánh sáng nối được hai sự kiện', 'Không tín hiệu nào nối được; chúng không có quan hệ nhân quả', 'Một người đi 1,5 c có thể có mặt ở cả hai'],
        dung: 2,
        giai: R`$s^2 = -4 + 9 = 5 \gt 0$: kiểu không gian. Muốn nối hai sự kiện cần tốc độ $3/2 = 1{,}5\,c$, nhanh hơn ánh sáng. Lựa chọn cuối sai vì không gì đi nhanh hơn ánh sáng.`,
      },
      {
        hoi: 'Một phi hành gia đi thẳng đều từ O tới sự kiện cách O 8 năm ánh sáng và 10 năm. Đồng hồ của người đó chỉ bao nhiêu?',
        chon: ['10 năm', '8 năm', '6 năm', '2 năm'],
        dung: 2,
        giai: R`$\tau = \sqrt{10^2 - 8^2} = \sqrt{36} = 6$ năm; tốc độ $0{,}8\,c$. Chọn 2 năm là lấy $10 - 8$ thay vì công thức có dấu trừ trong căn.`,
      },
      {
        hoi: 'Nếu Mặt Trời đột nhiên biến mất, khi nào Trái Đất bắt đầu bay khỏi quỹ đạo?',
        chon: ['Ngay lập tức, vì trọng lực tác dụng tức thời', 'Khoảng 8,3 phút sau, cùng lúc ta thấy Mặt Trời tắt', 'Khoảng 1 năm sau', 'Không bao giờ'],
        dung: 1,
        giai: 'Thay đổi của trọng lực lan đi với tốc độ ánh sáng (đã đo trực tiếp qua sự kiện GW170817). Trái Đất nằm ngoài nón tương lai của sự kiện «Mặt Trời biến mất» cho tới khi tín hiệu kịp tới, khoảng 499 giây sau. Newton cho rằng trọng lực tức thời; thuyết tương đối không cho phép điều đó.',
      },
      {
        hoi: 'Sự kiện P ở ngoài nón ánh sáng của O. Điều nào đúng?',
        chon: ['Mọi người quan sát đều thấy O xảy ra trước P', 'Có người thấy O trước P, có người thấy P trước O', 'P ở rất xa O', 'P nằm trong nón quá khứ của O'],
        dung: 1,
        giai: 'Với hai sự kiện kiểu không gian, thứ tự thời gian tuỳ người quan sát (Bài 6). Điều đó không gây mâu thuẫn vì chúng không thể ảnh hưởng tới nhau. «Ở nơi khác» không nhất thiết là xa: chỉ cần khoảng cách lớn hơn c nhân với khoảng thời gian.',
      },
      {
        hoi: 'Bạn nhìn thấy thiên hà Andromeda trên bầu trời đêm. Bạn đang thấy sự kiện nào trong không-thời gian?',
        dap: 'Ánh sáng tới mắt bạn lúc này đi dọc nón quá khứ của sự kiện «bạn, lúc này». Nón ấy cắt đường thế giới của Andromeda vào khoảng 2,5 triệu năm trước. Bạn thấy Andromeda của 2,5 triệu năm trước; «Andromeda lúc này» nằm ở vùng nơi khác, chưa thể biết gì về nó.',
      },
      {
        hoi: 'Vì sao đường thế giới của mọi vật có khối lượng phải nằm trong nón ánh sáng của từng sự kiện trên chính nó?',
        dap: 'Ở mỗi sự kiện, hướng của đường thế giới cho biết vận tốc tức thời của vật. Vật có khối lượng luôn đi chậm hơn ánh sáng, nên hướng đó dốc hơn 45°, tức nằm trong nón tương lai của sự kiện ấy. Điều này đúng ở mọi điểm, kể cả khi vật tăng tốc hay hãm lại: đường có thể cong, nhưng không lúc nào ngả ra ngoài nón.',
      },
    ],
    docThem: [
      'E. F. Taylor và J. A. Wheeler, *Spacetime Physics* (bản 2, 1992), chương 6: các vùng của không-thời gian, nón ánh sáng, nhân quả.',
      'E. F. Taylor và J. A. Wheeler, *Spacetime Physics* (bản 2, 1992), chương 5: đường thế giới và thời gian riêng.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 4: khoảng không-thời gian, nón ánh sáng, thời gian riêng.',
      'H. Minkowski, bài giảng «Raum und Zeit» (Không gian và thời gian), Köln, 1908.',
    ],
    thuatNgu: [
      { vi: 'nón tương lai', en: 'future light cone', nghia: 'Các sự kiện mà một tín hiệu từ sự kiện đang xét (đi chậm hơn hoặc bằng ánh sáng) có thể tới. Sự kiện đang xét có thể ảnh hưởng tới chúng.' },
      { vi: 'nón quá khứ', en: 'past light cone', nghia: 'Các sự kiện có thể đã gửi tín hiệu tới sự kiện đang xét. Ánh sáng ta thấy lúc này đi dọc nón quá khứ của ta.' },
      { vi: 'ở nơi khác', en: 'elsewhere', nghia: 'Vùng ngoài cả nón tương lai lẫn nón quá khứ của một sự kiện: không có quan hệ nhân quả với nó.' },
      { vi: 'kiểu thời gian', en: 'timelike', nghia: 'Khoảng có s² < 0: hai sự kiện nằm trong nón của nhau, một vật có thể có mặt ở cả hai.' },
      { vi: 'kiểu ánh sáng', en: 'lightlike, null', nghia: 'Khoảng có s² = 0: hai sự kiện nằm trên nón của nhau, chỉ ánh sáng nối được.' },
      { vi: 'kiểu không gian', en: 'spacelike', nghia: 'Khoảng có s² > 0: hai sự kiện ở ngoài nón của nhau, không tín hiệu nào nối được.' },
      { vi: 'khoảng cách riêng', en: 'proper distance', nghia: 'σ = √(Δx² − c²Δt²) cho hai sự kiện kiểu không gian: khoảng cách đo bởi người quan sát thấy chúng xảy ra cùng lúc.' },
    ],
  },

  conSo: [
    '**1,28 giây**: ánh sáng đi từ Mặt Trăng tới ta.',
    '**499 giây ≈ 8,3 phút**: ánh sáng (và sự thay đổi trọng lực) đi từ Mặt Trời tới Trái Đất.',
    '**gần 24 giờ**: tín hiệu từ Voyager 1, cách Mặt Trời khoảng 172 AU (11/2026).',
    '**2,5 triệu năm**: tuổi của ánh sáng thiên hà Andromeda mà mắt thường thấy được.',
    '**τ = 4**: thời gian riêng giữa O và sự kiện cách 3 năm ánh sáng, 5 năm.',
  ],
  hieuDung: '**Nón ánh sáng không phải thứ ánh sáng «tạo ra» khi có đèn.** Mọi sự kiện đều có nón, kể cả khi không có tia sáng nào: nón chỉ ra giới hạn mà mọi tín hiệu phải tuân theo. Và «ngoài nón» không có nghĩa là xa; nó nghĩa là quá gần nhau về thời gian so với khoảng cách giữa chúng.',
  nguon: 'Tốc độ ánh sáng: CODATA 2018; đơn vị thiên văn: IAU 2012. Quỹ đạo Mặt Trăng: bán trục lớn 384 400 km (NASA, Moon Fact Sheet). Sao Hỏa: tính từ bảng «Approximate Positions of the Planets» của NASA/JPL. Voyager 1: JPL Horizons ngày 11/11/2026. Alpha Centauri 4,37 năm ánh sáng; tâm Ngân Hà 8,2 kpc (GRAVITY Collaboration); Andromeda khoảng 2,5 triệu năm ánh sáng (khoảng 770 kpc). GW170817: LIGO, Virgo và vệ tinh Fermi, 17/8/2017 (độ trễ 1,7 giây, khoảng cách 40 Mpc).',

  tao(app) {
    const am = app.am, tt = app.tt;
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 1600, hat: 57, doSang: 0.4 }));
    scene.add(new THREE.AmbientLight(0x8a96b8, 0.5));
    const den1 = new THREE.DirectionalLight(0xfff1e0, 2.2);
    den1.position.set(6, 9, 7);
    const den2 = new THREE.DirectionalLight(0x7fa8ff, 1.1);
    den2.position.set(-7, 3, -8);
    scene.add(den1, den2);

    const jdNay = jdTuMs(Date.now());
    const auHoa = khoangCachTraiDatHoa(jdNay);
    const auVoyager = khoangCachVoyager1(jdNay, 'traiDat');
    const auVoyagerMT = khoangCachVoyager1(jdNay, 'matTroi');
    const THIEN_THE = {
      trang: { ten: chuCanh("canh.mat-trang", "Mặt Trăng"), kc: '384 400 km', giay: giayAnhSangKm(R_MAT_TRANG_KM) },
      troi: { ten: chuCanh("canh.mat-troi", "Mặt Trời"), kc: chuCanh("canh.1-au-149-6-trieu-km", "1 AU ≈ 149,6 triệu km"), giay: giayAnhSangAU(1) },
      hoa: { ten: chuCanh("canh.sao-hoa", "Sao Hỏa"), kc: chuCanh("canh.au-hom-nay", "{0} AU (hôm nay)", [so(auHoa, 2)]), giay: giayAnhSangAU(auHoa) },
      voyager: { ten: chuCanh("canh.voyager-1", "Voyager 1"), kc: chuCanh("canh.au-tu-trai-dat-au-tu-mat-troi", "{0} AU từ Trái Đất ({1} AU từ Mặt Trời)", [so(auVoyager, 1), so(auVoyagerMT, 1)]), giay: giayAnhSangAU(auVoyager) },
      alpha: { ten: chuCanh("canh.alpha-centauri", "Alpha Centauri"), kc: chuCanh("canh.4-37-nam-anh-sang", "4,37 năm ánh sáng"), giay: giayTuNam(NAS_ALPHA_CEN) },
      tam: { ten: chuCanh("canh.tam-ngan-ha", "Tâm Ngân Hà"), kc: chuCanh("canh.26-700-nam-anh-sang", "26 700 năm ánh sáng"), giay: giayTuNam(NAS_TAM_NGAN_HA) },
      andromeda: { ten: chuCanh("canh.thien-ha-andromeda", "Thiên hà Andromeda"), kc: chuCanh("canh.2-5-trieu-nam-anh-sang", "2,5 triệu năm ánh sáng"), giay: giayTuNam(NAS_ANDROMEDA) },
    };

    const S = {
      hien: {}, chay: true, T: -H, dx: 3, dt: 5, tt: 'troi', thoiGian: 0, v: 0,
      pTay: false, vTay: false, tTay: false,
    };
    const cA = new THREE.Color();
    const hexCss = (m) => `#${new THREE.Color(m).getHexString(THREE.SRGBColorSpace)}`;

    // ----- Khung: sàn, trục, nón -----
    const nhomKhung = new THREE.Group();
    scene.add(nhomKhung);
    nhomKhung.add(luoiSan({ nua: NUA, o: 1, t: 0, doMo: 0.16 }));
    const truc = trucKTG({ x: [-NUA, NUA + 0.8], y: [-NUA, NUA + 0.8], t: [-H - 0.6, H + 1.0], goc: [0, 0, 0], nhanX: 'x', nhanY: 'y', nhanT: chuCanh("canh.thoi-gian-nam", "thời gian (năm)") });
    nhomKhung.add(truc);
    const nhomVach = new THREE.Group();
    nhomKhung.add(nhomVach);
    for (const t of [-6, -4, -2, 2, 4, 6]) {
      const n = taoNhan(`${t > 0 ? '' : '−'}${Math.abs(t)}`, 'mo tran');
      n.position.set(0.05, t, 0);
      const g = duongDayTinh([-0.14, t, 0, 0.14, t, 0], { mau: MAU_KTG.thoiGian, rong: 1.4, doMo: 0.8, cong: true, sang: 1.2 });
      nhomVach.add(n, g.line);
    }
    for (const t of [-5, -3, -1, 1, 3, 5]) nhomVach.add(duongDayTinh([-0.08, t, 0, 0.08, t, 0], { mau: MAU_KTG.thoiGian, rong: 1.1, doMo: 0.55, cong: true }).line);
    const nhanO2 = taoNhan(chuCanh("canh.moi-o-1-nam-anh-sang", "mỗi ô: 1 năm ánh sáng"), 'mo tran', { giua: true });
    nhanO2.position.set(NUA * 0.45, 0, NUA + 0.6);
    nhomVach.add(nhanO2);
    const nonTren = nonAnhSang({ cao: H, tren: true, duoi: false, mau: MAU_KTG.anhSang, doMo: 0.07, soDuong: 24 });
    const nonDuoi = nonAnhSang({ cao: H, tren: false, duoi: true, mau: 0x8fb8ff, doMo: 0.07, soDuong: 24 });
    nhomKhung.add(nonTren, nonDuoi);
    const domO = suKien(0xffffff, 0.75);
    const nhanO = taoNhan(chuCanh("canh.o-o-day-luc-nay", "O<small>ở đây, lúc này</small>"), 'dam');
    nhomKhung.add(domO, nhanO);
    const nhomVung = new THREE.Group();
    nhomKhung.add(nhomVung);
    const nhanTL = taoNhan(chuCanh("canh.non-tuong-lai-o-co-the-anh-huong", "nón tương lai<small>O có thể ảnh hưởng tới</small>"), 'vang dam');
    nhanTL.position.set(H * 0.75, H * 0.97, -H * 0.3);
    const nhanQK = taoNhan(chuCanh("canh.non-qua-khu-co-the-da-anh-huong", "nón quá khứ<small>có thể đã ảnh hưởng tới O</small>"), 'xanh dam');
    nhanQK.position.set(H * 0.75, -H * 0.97, -H * 0.3);
    const nhanNK = taoNhan(chuCanh("canh.o-noi-khac-khong-quan-he-nhan-qua", "ở nơi khác<small>không quan hệ nhân quả với O</small>"), 'dam');
    nhanNK.element.style.color = '#c8aaff';
    nhanNK.position.set(-NUA, 0.8, NUA * 0.55);
    nhomVung.add(nhanTL, nhanQK, nhanNK);

    // ----- Tấm «bây giờ» và vòng sóng -----
    const kinh = matHienTai({ nua: NUA, doMo: 0.05 });
    nhomKhung.add(kinh);
    const vongNon = new DuongDay(129, { mau: MAU_KTG.anhSang, rong: 3.2, quang: 0.18, sang: 1.8 });
    const vongSan = new DuongDay(129, { mau: MAU_KTG.anhSang, rong: 1.8, doMo: 0.7, net: [0.2, 0.12] });
    const nhanVong = taoNhan('', 'tran');
    nhanVong.center.set(1, 0.5);
    nhomKhung.add(vongNon.line, vongSan.line, nhanVong);
    const nhomVongXep = new THREE.Group();
    for (let t = 1; t <= 5; t++) nhomVongXep.add(vongNgang(t, t, { mau: MAU_KTG.anhSang, rong: 1.3, doMo: 0.45 }).line);
    for (let t = 1; t <= 5; t++) {
      const n = taoNhan(`t = ${t}: r = ${t}`, 'vang tran');
      n.position.set(t, t, 0);
      nhomVongXep.add(n);
    }
    nhomKhung.add(nhomVongXep);
    // chớp sáng ở O: loé lên khi tấm «bây giờ» đi qua t = 0
    const chopO = taoDom(new THREE.Color(0xfff2d0).multiplyScalar(3), 1.6);
    chopO.material.opacity = 0;
    nhomKhung.add(chopO);

    // ----- Sự kiện P -----
    const nhomP = new THREE.Group();
    scene.add(nhomP);
    const domP = suKien(0xffffff, 0.7);
    const doanOP = new DuongDay(2, { mau: 0xffffff, rong: 3.2, quang: 0.16, sang: 1.6 });
    const doiP = new DuongDong(2, { mau: 0xffffff, doMo: 0.35 });
    const chanP = suKien(0xffffff, 0.25, { vong: false });
    const nhanP = taoNhan('', 'dam');
    // hạt đánh dấu thời gian riêng: mỗi năm đồng hồ của người đi thẳng đều O → P chỉ thêm 1
    const hatTau = Array.from({ length: 8 }, () => taoDom(0xffffff, 0.2));
    nhomP.add(domP, doanOP.line, doiP.line, chanP, nhanP, ...hatTau);
    const nhomCatNgang = new THREE.Group();
    nhomCatNgang.add(duongDayTinh([-H, -H, 0, H, H, 0], { mau: MAU_KTG.anhSang, rong: 1.8, doMo: 0.8, quang: 0.08, sang: 1.3 }).line);
    nhomCatNgang.add(duongDayTinh([-H, H, 0, H, -H, 0], { mau: MAU_KTG.anhSang, rong: 1.8, doMo: 0.8, quang: 0.08, sang: 1.3 }).line);
    const nhanCN = taoNhan(chuCanh("canh.t-x-anh-sang", "t = x: ánh sáng"), 'vang tran');
    nhanCN.position.set(H * 0.92, H * 0.92 + 0.25, 0);
    nhomCatNgang.add(nhanCN);
    nhomP.add(nhomCatNgang);

    // Mặt «cùng khoảng» qua P: hyperboloid kính, lưới mịn vẽ trong shader. Hình dạng tính ngay trong shader từ τ (hoặc σ),
    // nên kéo P không phải dựng lại hình học.
    const geoHyp = new THREE.PlaneGeometry(1, 1, 48, 128);
    const taoMatHyp = (doMo) => {
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uLoai: { value: 0 }, uK: { value: 4 }, uSg: { value: 1 }, uMax: { value: 6 }, uMau: { value: new THREE.Color(MAU_LOAI.tuongLai) },
          uDoMo: { value: doMo }, uDen: { value: new THREE.Vector3(0.4, 0.8, 0.45).normalize() },
        },
        vertexShader: /* glsl */ `
          uniform float uLoai, uK, uSg, uMax;
          varying vec3 vPos; varying vec3 vN; varying vec2 vQ; varying float vMep;
          void main() {
            float phi = uv.y * 6.28318530718;
            vec3 p;
            if (uLoai < 0.5) {
              float r = uv.x * uMax;
              p = vec3(r * cos(phi), uSg * sqrt(uK * uK + r * r), r * sin(phi));
              vMep = uv.x;
            } else {
              float t = (uv.x * 2.0 - 1.0) * uMax;
              float r = sqrt(uK * uK + t * t);
              p = vec3(r * cos(phi), t, r * sin(phi));
              vMep = abs(uv.x * 2.0 - 1.0);
            }
            vQ = vec2(p.y, uv.y * 24.0);
            vec4 w = modelMatrix * vec4(p, 1.0);
            vPos = w.xyz;
            vN = vec3(p.x, -p.y, p.z);
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uMau, uDen; uniform float uDoMo;
          varying vec3 vPos; varying vec3 vN; varying vec2 vQ; varying float vMep;
          float net(float o, float rong) { float d = max(fwidth(o), 1e-5); return 1.0 - smoothstep(rong * 0.5, rong * 0.5 + 1.0, abs(fract(o - 0.5) - 0.5) / d); }
          void main() {
            vec3 n = normalize(vN);
            vec3 v = normalize(cameraPosition - vPos);
            float nv = abs(dot(n, v));
            float fr = pow(1.0 - nv, 2.4);
            float kh = 0.45 + 0.55 * abs(dot(n, uDen));
            float pc = pow(abs(dot(n, normalize(uDen + v))), 60.0);
            float vongNam = net(vQ.x, 1.4);                 // vòng ở mỗi năm (t nguyên)
            float kinhTuyen = net(vQ.y, 1.0) * 0.6;          // 24 kinh tuyến
            float luoi = max(vongNam, kinhTuyen);
            float mo = 1.0 - smoothstep(0.78, 1.0, vMep);    // mờ dần ra mép
            vec3 c = uMau * (uDoMo * (kh * 1.1 + fr * 2.6) + luoi * uDoMo * 5.0) + vec3(1.0) * pc * 0.25;
            gl_FragColor = vec4(c * mo, 1.0);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      });
      mat.tuyenTinh = true;
      const m = new THREE.Mesh(geoHyp, mat);
      m.frustumCulled = false;
      m.renderOrder = 2;
      return m;
    };
    const hypA = taoMatHyp(0.07), hypB = taoMatHyp(0.022);
    const nhanHyp = taoNhan('', 'tran');
    nhanHyp.center.set(1, 0.5);
    nhomP.add(hypA, hypB, nhanHyp);

    // ----- Người quan sát thứ hai (bay với vận tốc v dọc trục x) -----
    const nhomNQS = new THREE.Group();
    scene.add(nhomNQS);
    const trucT2 = new DuongDay(2, { mau: MAU_KTG.thoiGian, rong: 2.4, quang: 0.14, sang: 1.5 });
    const trucX2 = new DuongDay(2, { mau: 0xbfd8ff, rong: 1.6, doMo: 0.8, net: [0.18, 0.12], sang: 1.1 });
    const chieuT2 = new DuongDay(2, { mau: 0xffffff, rong: 1.4, doMo: 0.7, net: [0.1, 0.08] });
    const chieuX2 = new DuongDay(2, { mau: 0xffffff, rong: 1.4, doMo: 0.7, net: [0.1, 0.08] });
    const domT2 = suKien(MAU_KTG.thoiGian, 0.32, { vong: false }), domX2 = suKien(0xbfd8ff, 0.32, { vong: false });
    const nhanT2 = taoNhan('', 'xanh tran'), nhanX2 = taoNhan('', 'tran');
    const nhanNQS = taoNhan('', 'xanh dam');
    nhanX2.element.style.color = '#bfd8ff';
    nhomNQS.add(trucT2.line, trucX2.line, chieuT2.line, chieuX2.line, domT2, domX2, nhanT2, nhanX2, nhanNQS);
    const T_NQS = 5.6;

    // ----- Con tàu tăng tốc rồi hãm -----
    const nhomTau = new THREE.Group();
    scene.add(nhomTau);
    const xTau = (t) => -viTriTau(t, T_TAU, V_TAU);
    {
      const q = [];
      for (let i = 0; i <= 120; i++) { const t = (T_TAU * i) / 120; q.push(xTau(t), t, 0); }
      nhomTau.add(duongDayTinh(q, { mau: MAU_KTG.hong, rong: 3, quang: 0.16, sang: 1.6 }).line);
      for (let k = 0; k < 6; k++) {
        const t = 0.5 + k;
        const x = xTau(t), v = vanTocTau(t, T_TAU, V_TAU);
        const n = nonAnhSang({ cao: 0.75, mau: MAU_KTG.anhSang, doMo: 0.16, soDuong: 10 });
        n.position.set(x, t, 0);
        nhomTau.add(n);
        const l = 0.95 / Math.hypot(v, 1);
        nhomTau.add(duongDayTinh([x, t, 0, x - v * l, t + l, 0], { mau: 0xffffff, rong: 2.2, doMo: 0.95, cong: true, sang: 1.3 }).line);
        const e = suKien(MAU_KTG.hong, 0.3, { vong: false });
        e.position.set(x, t, 0);
        nhomTau.add(e);
      }
      // dấu mỗi năm theo đồng hồ của tàu (τ = 1, 2, 3, 4): thưa hơn dấu mỗi năm ở nhà
      for (let k = 1; k <= 4; k++) {
        const a = MOC_TAU[k];
        const d = taoDom(new THREE.Color(MAU_KTG.hong).multiplyScalar(2.2), 0.24);
        d.position.set(xTau(a), a, 0);
        const n = taoNhan(`τ = ${k}`, 'hong tran');
        n.center.set(1, 0.5);
        n.position.set(xTau(a) - 0.12, a, 0);
        nhomTau.add(d, n);
      }
      nhomTau.add(duongDayTinh([0, 0, 0, 0, 2.2, 3.74], { mau: MAU_KTG.do, rong: 2, doMo: 0.9, net: [0.14, 0.1] }).line);
      const nCam = taoNhan(chuCanh("canh.nhanh-hon-anh-sang-ra-ngoai-non-khong", "nhanh hơn ánh sáng<small>ra ngoài nón: không thể</small>"), 'dam');
      nCam.element.style.color = '#ff8a73';
      nCam.position.set(0, 2.2, 3.74);
      const nTau = taoNhan(chuCanh("canh.con-tau-toi-da-c-di-nam-anh", "con tàu<small>tối đa {0} c, đi {1} năm ánh sáng</small>", [so(V_TAU, 1), so(viTriTau(T_TAU), 2)]), 'hong dam');
      nTau.position.set(xTau(T_TAU), T_TAU + 0.2, 0);
      nhomTau.add(nCam, nTau);
    }
    const domTau = suKien(MAU_KTG.hong, 0.62);
    const vetTau = new DuongDay(30, { mau: MAU_KTG.hong, rong: 5, moDan: true, sang: 1.8 });
    const nhanDongHo = taoNhan('', 'hong tran');
    nhomTau.add(domTau, vetTau.line, nhanDongHo);

    // ----- Nhìn xa là nhìn về quá khứ -----
    const nhomXa = new THREE.Group();
    scene.add(nhomXa);
    const e1 = suKien(MAU_KTG.anhSang, 0.7), e2 = suKien(0xffffff, 0.45);
    const photon = Array.from({ length: 4 }, () => taoDom(new THREE.Color(MAU_KTG.anhSang).multiplyScalar(2.6), 0.32));
    {
      nhomXa.add(duongDayTinh([0, -H, 0, 0, H, 0], { mau: 0x5b9bff, rong: 3, quang: 0.16, sang: 1.6 }).line);
      nhomXa.add(duongDayTinh([D_XA, -H, 0, D_XA, H, 0], { mau: 0xffffff, rong: 2.6, quang: 0.1, sang: 1.2 }).line);
      nhomXa.add(duongDayTinh([D_XA, -D_XA, 0, 0.12, -0.12, 0], { mau: MAU_KTG.anhSang, rong: 3.4, quang: 0.22, sang: 1.8 }).line);
      nhomXa.add(duongDayTinh([0, 0.02, 0, D_XA, 0.02, 0], { mau: 0xffffff, rong: 1.4, doMo: 0.6, net: [0.15, 0.1] }).line);
      nhomXa.add(duongDayTinh([0, -D_XA, 0, D_XA, -D_XA, 0], { mau: MAU_KTG.thoiGian, rong: 1.2, doMo: 0.5, net: [0.12, 0.1] }).line);
      e1.position.set(D_XA, -D_XA, 0);
      e2.position.set(D_XA, 0, 0);
      e2.material.opacity = 0.5;
      nhomXa.add(e1, e2, ...photon);
    }
    // Trái Đất trên đỉnh đường thế giới của ta; thiên thể đang chọn trên đỉnh đường của nó (hình minh hoạ, không theo tỉ lệ)
    const HUONG_SANG = new THREE.Vector3(1, 0.4, 0.8).normalize();
    const thuTao = (ham) => { try { return ham(); } catch (e) { console.warn('Không tạo được thiên thể:', e); return null; } };
    const datTD = thuTao(() => { const v = taoTraiDat({ banKinh: 0.42, chiTiet: 96 }); v.datHuongSang?.(HUONG_SANG); return v; });
    if (datTD) { datTD.nhom.position.set(0, H + 0.75, 0); nhomXa.add(datTD.nhom); }
    const moHinhTT = {};
    const mhChung = { nhom: null };
    const taoMoHinh = (k) => {
      if (k in moHinhTT) return moHinhTT[k];
      let v = null;
      if (k === 'trang') v = thuTao(() => { const m = taoMatTrang({ banKinh: 0.3, chiTiet: 96 }); m.datHuongSang?.(HUONG_SANG); return m; });
      else if (k === 'troi') v = thuTao(() => taoMatTroi({ banKinh: 0.42 }));
      else if (k === 'hoa') v = thuTao(() => { const m = taoHanhTinh({ id: 'hoa', banKinh: 0.32, chiTiet: 96 }); m.datHuongSang?.(HUONG_SANG); return m; });
      else if (k === 'alpha') v = thuTao(() => taoSao({ nhietDo: 5800, banKinh: 0.12, doSang: 2.2 }));
      else if (k === 'tam') v = thuTao(() => taoLoDenNho({ banKinh: 0.22 }));
      else if (k === 'andromeda') v = thuTao(() => { const m = taoThienHaNho({ banKinh: 0.85, soSao: 9000, hat: 31 }); m.nhom.rotation.x = 0.5; m.nhom.rotation.z = 0.35; return m; });
      if (!v) v = { nhom: taoDom(new THREE.Color(0xffffff).multiplyScalar(2.4), 0.28), capNhat() {} };   // Voyager 1: một đốm sáng
      v.nhom.position.set(D_XA, H + 0.75, 0);
      v.nhom.visible = false;
      nhomXa.add(v.nhom);
      moHinhTT[k] = v;
      return v;
    };
    void mhChung;
    const nhanTT = taoNhan('', 'dam'); nhanTT.position.set(D_XA + 0.7, H + 0.75, 0);
    const nhanPhat = taoNhan('', 'vang dam'); nhanPhat.position.set(D_XA, -D_XA, 0);
    const nhanLucNay = taoNhan('', 'mo'); nhanLucNay.position.set(D_XA, 0.15, 0);
    const nhanKC = taoNhan('', 'mo tran giua'); nhanKC.position.set(D_XA / 2, 0.35, 0);
    const nhanTruc = taoNhan('', 'xanh tran'); nhanTruc.position.set(-0.1, -D_XA, 0);
    nhanTruc.center.set(1, 0.5);
    const nTa = taoNhan(chuCanh("canh.ta-trai-dat", "ta (Trái Đất)"), 'xanh dam'); nTa.position.set(0.55, H + 0.75, 0);
    nhomXa.add(nhanTT, nhanPhat, nhanLucNay, nhanKC, nhanTruc, nTa);
    // rê chuột vào hai sự kiện để xem chú giải
    tt.them(e1, {
      ten: chuCanh("canh.anh-sang-roi-thien-the", "Ánh sáng rời thiên thể"), banKinhPx: 16, mau: MAU_KTG.anhSang,
      moTa: () => { const v = THIEN_THE[S.tt]; return chuCanh("canh.su-kien-phat-ra-anh-sang-ma-ta", "Sự kiện «{0} phát ra ánh sáng mà ta thấy lúc này».<br>Nó nằm trên <b>nón quá khứ</b> của O, lúc <b>t = −d/c</b>: <b>{1}</b> trước.", [v.ten, doiGiay(v.giay)]); },
    });
    tt.them(e2, {
      ten: chuCanh("canh.thien-the-luc-nay", "Thiên thể «lúc này»"), banKinhPx: 16, mau: 0xffffff,
      moTa: () => chuCanh("canh.su-kien-luc-nay-nam-ngoai-non-cua", "Sự kiện «{0} lúc này» nằm ngoài nón của O, ở vùng <b>nơi khác</b>: chưa tín hiệu nào từ nó kịp tới ta.", [THIEN_THE[S.tt].ten]),
    });

    // =====================================================================
    // Vẽ
    // =====================================================================
    function veP() {
      const loai = phanLoai(S.dx, S.dt);
      const mau = MAU_LOAI[loai];
      domP.position.set(S.dx, S.dt, 0);
      domP.material.color.set(mau).multiplyScalar(1.8);
      doanOP.datMau(mau);
      doanOP.dat(0, 0, 0, 0); doanOP.dat(1, S.dx, S.dt, 0); doanOP.xong(2);
      doiP.mat.color.set(mau);
      doiP.dat(0, S.dx, 0, 0); doiP.dat(1, S.dx, S.dt, 0); doiP.xong(2);
      chanP.position.set(S.dx, 0.02, 0);
      chanP.material.color.set(mau);
      const s2 = binhPhuongKhoang(S.dx, S.dt);
      nhanP.position.set(S.dx, S.dt, 0);
      nhanP.element.style.color = hexCss(mau);
      nhanP.datChu(`P<small>Δx = ${so(S.dx, 2)} · Δt = ${so(S.dt, 2)} · s² = ${so(s2, 2)}</small>`);
      // hạt thời gian riêng dọc O–P
      const tl = loai === 'tuongLai' || loai === 'quaKhu';
      const tau = tl ? thoiGianRieng(S.dx, S.dt) : 0;
      for (let k = 0; k < hatTau.length; k++) {
        const h = hatTau[k], f = (k + 1) / Math.max(tau, 1e-6);
        h.visible = tl && k + 1 < tau - 0.05;
        if (!h.visible) continue;
        h.position.set(S.dx * f, S.dt * f, 0);
        h.material.color.set(mau).multiplyScalar(2.2);
      }
      veHyp(loai);
      veNQS();
    }

    function veHyp(loai) {
      const TM = 6.4, RM = 7.2;
      hypA.visible = hypB.visible = nhanHyp.visible = false;
      if (!S.hien.hyp) return;
      const uA = hypA.material.uniforms, uB = hypB.material.uniforms;
      if (loai === 'tuongLai' || loai === 'quaKhu') {
        const tau = thoiGianRieng(S.dx, S.dt);
        if (tau >= TM - 0.05) return;
        const sg = Math.sign(S.dt);
        const rMax = Math.sqrt(TM * TM - tau * tau);
        for (const [u, tang] of [[uA, sg], [uB, -sg]]) {
          u.uLoai.value = 0; u.uK.value = tau; u.uSg.value = tang; u.uMax.value = rMax;
          u.uMau.value.set(tang > 0 ? MAU_LOAI.tuongLai : MAU_LOAI.quaKhu);
        }
        hypA.visible = hypB.visible = true;
        nhanHyp.visible = true;
        const r = rMax * 0.75;
        nhanHyp.position.set(-r, sg * Math.hypot(tau, r), 0);
        nhanHyp.element.style.color = sg > 0 ? '#ffb86b' : '#8fb0ff';
        nhanHyp.datChu(chuCanh("canh.mat-moi-su-kien-cung-thoi-gian-rieng", "mặt τ = {0}<small>mọi sự kiện cùng thời gian riêng tính từ O</small>", [so(tau, 2)]));
      } else if (loai === 'khongGian') {
        const sig = khoangCachRieng(S.dx, S.dt);
        if (sig >= RM - 0.05) return;
        const tm = Math.min(TM, Math.sqrt(RM * RM - sig * sig));
        uA.uLoai.value = 1; uA.uK.value = sig; uA.uSg.value = 1; uA.uMax.value = tm;
        uA.uMau.value.set(MAU_LOAI.khongGian);
        hypA.visible = true;
        nhanHyp.visible = true;
        nhanHyp.position.set(-Math.hypot(sig, 1.5), -1.5, 0);
        nhanHyp.element.style.color = '#c8aaff';
        nhanHyp.datChu(chuCanh("canh.mat-moi-su-kien-cung-khoang-cach-rieng", "mặt σ = {0}<small>mọi sự kiện cùng khoảng cách riêng tới O</small>", [so(sig, 2)]));
      }
    }

    // Người quan sát thứ hai: trục thời gian x = v·t, trục không gian t = v·x (đồng thời với O theo người đó).
    // Toạ độ người ấy đo được cho P: (Δt′; Δx′) theo phép biến đổi Lorentz; chân các đường chiếu song song với trục kia.
    function veNQS() {
      nhomNQS.visible = !!S.hien.nqs;
      if (!nhomNQS.visible) return;
      const v = S.v;
      const L = H + 0.3;
      const kT = L / Math.hypot(1, v);
      trucT2.dat(0, -v * kT, -kT, 0); trucT2.dat(1, v * kT, kT, 0); trucT2.xong(2);
      trucX2.dat(0, -kT, -v * kT, 0); trucX2.dat(1, kT, v * kT, 0); trucX2.xong(2);
      const [tp, xp] = bienDoi(S.dt, S.dx, v);
      // chân trên trục t′: (v·s; s) với s = (Δt − vΔx)/(1 − v²); chân trên trục x′: (u; v·u) với u = (Δx − vΔt)/(1 − v²)
      const sA = (S.dt - v * S.dx) / (1 - v * v), uB = (S.dx - v * S.dt) / (1 - v * v);
      chieuT2.dat(0, S.dx, S.dt, 0); chieuT2.dat(1, v * sA, sA, 0); chieuT2.xong(2);
      chieuX2.dat(0, S.dx, S.dt, 0); chieuX2.dat(1, uB, v * uB, 0); chieuX2.xong(2);
      domT2.position.set(v * sA, sA, 0); domX2.position.set(uB, v * uB, 0);
      nhanT2.position.set(v * sA - 0.15, sA, 0); nhanT2.center.set(1, 0.5);
      nhanT2.datChu(`Δt′ = ${so(tp, 2)}`);
      nhanX2.position.set(uB, v * uB - 0.4, 0); nhanX2.center.set(0.5, 0.5);
      nhanX2.datChu(`Δx′ = ${so(xp, 2)}`);
      // Nhãn đặt bên trái đốm kéo, để không đè lên tên trục thời gian ở đỉnh hình.
      nhanNQS.position.set(v * kT - 0.3, kT, 0); nhanNQS.center.set(1, 0.5);
      nhanNQS.datChu(chuCanh("canh.nguoi-quan-sat-2-v-c-truc-t", "người quan sát 2<small>v = {0} c · trục t′ và trục x′</small>", [so(v, 2)]));
    }

    function veVong(T) {
      const r = Math.abs(T);
      const tren = T >= 0;
      const mau = tren ? MAU_KTG.anhSang : 0x8fb8ff;
      vongNon.datMau(mau); vongSan.datMau(mau);
      const coVong = !S.hien.xa && !S.hien.anKinh && (tren ? S.hien.nonTren : S.hien.nonDuoi) && r > 0.02 && r <= H;
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * 2 * Math.PI;
        vongNon.dat(i, r * Math.cos(a), T, r * Math.sin(a));
        vongSan.dat(i, r * Math.cos(a), 0.02, r * Math.sin(a));
      }
      vongNon.xong(coVong ? 129 : 0);
      vongSan.xong(coVong ? 129 : 0);
      nhanVong.visible = coVong;
      nhanVong.position.set(-r, T, 0);
      nhanVong.element.style.color = tren ? '#f3c66f' : '#8fb8ff';
      nhanVong.datChu(tren ? chuCanh("canh.mat-song-luc-t-r", "mặt sóng lúc t = {0}: r = {1}", [so(T, 1), so(r, 1)]) : chuCanh("canh.anh-sang-dang-toi-o-con-nam", "ánh sáng đang tới O: còn {0} năm", [so(r, 1)]));
    }

    function veXa() {
      const tt2 = THIEN_THE[S.tt];
      const tg = doiGiay(tt2.giay);
      nhanTT.datChu(chuCanh("canh.cach-ta", "{0}<small>cách ta {1}</small>", [tt2.ten, tt2.kc]));
      nhanPhat.datChu(chuCanh("canh.ta-dang-thay-no-cua-truoc-anh-sang", "ta đang thấy nó của {0} trước<small>ánh sáng rời nó lúc t = −d/c</small>", [tg]));
      nhanLucNay.datChu(chuCanh("canh.luc-nay-ta-chua-the-thay", "{0} «lúc này»: ta chưa thể thấy", [tt2.ten]));
      nhanKC.datChu(`d = ${tt2.kc}`);
      nhanTruc.datChu(`−${tg}`);
      for (const k of Object.keys(moHinhTT)) moHinhTT[k].nhom.visible = false;
      if (S.hien.xa) taoMoHinh(S.tt).nhom.visible = true;
    }

    // =====================================================================
    // Tay nắm
    // =====================================================================
    const _v = new THREE.Vector3();
    const dangKeo = { P: false, T: false, V: false, tau: false };
    // 1. Sự kiện P: kéo trong mặt phẳng (x; t). Bắt dính vào mặt nón khi lại gần (để đặt được khoảng kiểu ánh sáng).
    const tayP = tt.tayNam({
      viTri: [3, 5, 0], mau: 0xffffff, co: 0.2, ten: chuCanh("canh.su-kien-p", "Sự kiện P"),
      moTa: () => `${MO_TA_LOAI[phanLoai(S.dx, S.dt)][0]}<br>s² = <b>${so(binhPhuongKhoang(S.dx, S.dt), 2)}</b>`,
      nhan: chuCanh("canh.keo-su-kien-p", "Kéo sự kiện P"),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 0, 1], qua: [0, 0, 0] },
      gioiHan: (p) => {
        let x = Math.min(6, Math.max(0, p.x)), t = Math.min(6, Math.max(-6, p.y));
        if (Math.abs(Math.abs(t) - x) < 0.1 && x > 0.3) t = Math.sign(t || 1) * x;
        else if (S.hien.hyp && Math.abs(t) > x + 0.3) {
          // ở bước có mặt τ: bắt dính vào thời gian riêng nguyên (τ = 1, 2, 3…) khi lại gần
          const tau = Math.sqrt(t * t - x * x), k = Math.round(tau);
          if (k >= 1 && Math.abs(tau - k) < 0.06) t = Math.sign(t) * Math.sqrt(k * k + x * x);
        }
        p.set(x, t, 0);
        return p;
      },
      khiNam: () => { dangKeo.P = true; },
      khiKeo: (p) => datPTay(p.x, p.y),
      khiTha: () => { dangKeo.P = false; },
    });
    function datPTay(x, t) {
      S.dx = x; S.dt = t; dkDx.dat(x); dkDt.dat(t); S.pTay = true; veP();
    }
    // 2. Tấm «bây giờ»: kéo đốm xanh lục ở góc tấm lên xuống.
    const tayT = tt.tayNam({
      viTri: [-NUA, 0, NUA], mau: MAU_KTG.hienTai, co: 0.2, ten: chuCanh("canh.tam-bay-gio", "Tấm «bây giờ»"),
      moTa: () => chuCanh("canh.keo-len-xuong-de-chon-thoi-diem-hien", "Kéo lên xuống để chọn thời điểm. Hiện tại <b>t = {0} năm</b>.", [so(Math.min(S.T, H), 1)]),
      nhan: chuCanh("canh.keo-bay-gio", "Kéo «bây giờ»"),
      rangBuoc: { kieu: 'duong', qua: [-NUA, 0, NUA], huong: [0, 1, 0] },
      gioiHan: (p) => { p.set(-NUA, Math.min(H, Math.max(-H, p.y)), NUA); return p; },
      khiNam: () => { dangKeo.T = true; S.chay = false; dkChay.dat(false); },
      khiKeo: (p) => { S.T = p.y; dkT.dat(S.T); S.tTay = true; },
      khiTha: () => { dangKeo.T = false; },
    });
    // 3. Con tàu: kéo dọc đường thế giới của nó (chọn thời điểm ở nhà t, tàu tự nằm đúng chỗ).
    const tayTau = tt.tayNam({
      viTri: [0, 0, 0], mau: MAU_KTG.hong, co: 0.2, ten: chuCanh("canh.con-tau", "Con tàu"),
      moTa: () => { const t = Math.max(0, Math.min(T_TAU, S.T)); return chuCanh("canh.o-nha-t-nam-dong-ho-tau-nam", "Ở nhà <b>t = {0}</b> năm, đồng hồ tàu <b>τ = {1}</b> năm.", [so(t, 2), so(thoiGianRiengTau(t, T_TAU, V_TAU), 2)]); },
      nhan: chuCanh("canh.keo-con-tau-doc-duong-di", "Kéo con tàu dọc đường đi"),
      rangBuoc: {
        kieu: 'ham',
        chieu: (tia) => {
          let tot = Infinity, chon = 0;
          for (let i = 0; i <= 240; i++) {
            const t = (T_TAU * i) / 240;
            const d = tia.distanceSqToPoint(_v.set(xTau(t), t, 0));
            if (d < tot) { tot = d; chon = t; }
          }
          // bắt dính vào các mốc τ = 1, 2, 3, 4 của đồng hồ tàu
          const tau = thoiGianRiengTau(chon, T_TAU, V_TAU), k = Math.round(tau);
          if (k >= 1 && k <= 4 && Math.abs(tau - k) < 0.04) chon = MOC_TAU[k];
          tayTau.tMoi = chon;
          return _v.set(xTau(chon), chon, 0);
        },
      },
      khiNam: () => { dangKeo.tau = true; S.chay = false; dkChay.dat(false); },
      khiKeo: () => { if (tayTau.tMoi != null) { S.T = tayTau.tMoi; dkT.dat(S.T); S.tTay = true; } },
      khiTha: () => { dangKeo.tau = false; },
    });
    // 4. Người quan sát thứ hai: kéo đầu trục t′ sang trái, phải để đổi vận tốc v.
    const V_MAX = 0.9;
    const tayV = tt.tayNam({
      viTri: [0, T_NQS, 0], mau: MAU_KTG.thoiGian, co: 0.2, ten: chuCanh("canh.nguoi-quan-sat-2", "Người quan sát 2"),
      moTa: () => chuCanh("canh.van-toc-v-c-keo-sang-trai-phai", "Vận tốc <b>v = {0} c</b>. Kéo sang trái, phải để đổi.", [so(S.v, 2)]),
      nhan: chuCanh("canh.keo-de-doi-van-toc", "Kéo để đổi vận tốc"),
      rangBuoc: { kieu: 'duong', qua: [0, T_NQS, 0], huong: [1, 0, 0] },
      gioiHan: (p) => {
        let v = Math.max(-V_MAX, Math.min(V_MAX, p.x / T_NQS));
        if (Math.abs(v) < 0.02) v = 0;
        // bắt dính khi trục t′ đi qua P (Δx′ = 0) hoặc trục x′ đi qua P (Δt′ = 0)
        const vHut = Math.abs(S.dt) > Math.abs(S.dx) ? S.dx / S.dt : Math.abs(S.dx) > Math.abs(S.dt) ? S.dt / S.dx : null;
        if (vHut !== null && Math.abs(vHut) <= V_MAX && Math.abs(v - vHut) < 0.012) v = vHut;
        p.set(v * T_NQS, T_NQS, 0);
        return p;
      },
      khiNam: () => { dangKeo.V = true; },
      khiKeo: (p) => { S.v = p.x / T_NQS; S.vTay = true; dkV.dat(S.v); veNQS(); },
      khiTha: () => { dangKeo.V = false; },
    });

    function datTayNam() {
      const h = S.hien;
      tayP.an(!h.P);
      tayT.an(!(!h.xa && !h.anKinh && !h.tau));
      tayTau.an(!h.tau);
      tayV.an(!h.nqs);
    }
    function capNhatTayNam() {
      if (S.hien.P && !dangKeo.P) tayP.dat(_v.set(S.dx, S.dt, 0));
      if (!dangKeo.T) tayT.dat(_v.set(-NUA, Math.min(S.T, H), NUA));
      if (S.hien.tau && !dangKeo.tau) { const t = Math.max(0, Math.min(T_TAU, S.T)); tayTau.dat(_v.set(xTau(t), t, 0)); }
      if (S.hien.nqs && !dangKeo.V) tayV.dat(_v.set(S.v * T_NQS, T_NQS, 0));
    }

    // =====================================================================
    // Âm thanh (mang nghĩa): một nốt khi P qua mặt nón (mỗi loại khoảng một tiếng), tiếng chuông khi tấm «bây giờ»
    // đi qua chớp sáng O, hai đồng hồ tích ở bước con tàu, và một tiếng khi thứ tự O, P đổi theo người quan sát.
    // =====================================================================
    const NOT_LOAI = {
      tuongLai: { tanSo: 440, dang: 'mem' }, quaKhu: { tanSo: 329.63, dang: 'mem' },
      anhSangTL: { tanSo: 880, dang: 'kinh' }, anhSangQK: { tanSo: 880, dang: 'kinh' },
      khongGian: { tanSo: 659.25, dang: 'chuong' }, trung: null,
    };
    const am5 = { loai: null, cho: 0, T: null, dauT2: 0 };
    function amThanh(dt) {
      if (!dt) return;
      am5.cho = Math.max(0, am5.cho - dt);
      if (S.hien.P) {
        const loai = phanLoai(S.dx, S.dt);
        if (am5.loai !== null && loai !== am5.loai && am5.cho <= 0) {
          const n = NOT_LOAI[loai];
          if (n) am.not({ tanSo: n.tanSo, dai: 0.9, doTo: 0.32, dang: n.dang, lech: 0.25 });
          am5.cho = 0.12;
        }
        am5.loai = loai;
      } else am5.loai = null;
      const T = Math.min(S.T, H);
      const coKinh = !S.hien.xa && !S.hien.anKinh;
      // chớp đèn ở O: tấm «bây giờ» đi lên qua t = 0, hoặc vòng chạy bắt đầu lại đúng từ t = 0 (bước 1)
      if (coKinh && am5.T !== null && ((am5.T < 0 && T >= 0) || (T >= 0 && T < 1e-6 && am5.T > 0.5))) am.not({ tanSo: 587.33, dai: 1.6, doTo: 0.3, dang: 'chuong' });
      if (am5.T !== null && T > am5.T) {
        if (S.hien.tau) {
          const a = Math.max(0, Math.min(T_TAU, am5.T)), b = Math.max(0, Math.min(T_TAU, T));
          if (Math.floor(b) > Math.floor(a)) am.tich({ tanSo: 1250, doTo: 0.32, lech: -0.45 });                  // đồng hồ ở nhà
          const ta = thoiGianRiengTau(a, T_TAU, V_TAU), tb = thoiGianRiengTau(b, T_TAU, V_TAU);
          if (Math.floor(tb) > Math.floor(ta)) am.not({ tanSo: 659.25, dai: 0.35, doTo: 0.3, dang: 'kinh', lech: 0.45 });   // đồng hồ trên tàu
        }
      }
      am5.T = T;
      if (S.hien.nqs && S.hien.P) {
        const tp = (S.dt - S.v * S.dx) / Math.sqrt(1 - S.v * S.v);   // Δt′ theo Lorentz (không cấp phát mảng mỗi khung hình)
        const dau = Math.abs(tp) < 1e-3 ? 0 : Math.sign(tp);
        if (dangKeo.V && am5.dauT2 && dau && dau !== am5.dauT2) am.not({ tanSo: 1174.66, dai: 0.8, doTo: 0.28, dang: 'kinh' });
        if (dau) am5.dauT2 = dau;
      }
    }

    // =====================================================================
    // Điều khiển
    // =====================================================================
    const bang = app.bang;
    const dkDx = bang.thanhTruot({
      nhan: chuCanh("canh.khoang-cach-khong-gian-x-cua-p", "Khoảng cách không gian Δx của P"), min: 0, max: 6, buoc: 0.05, giaTri: S.dx,
      hienThi: (v) => chuCanh("canh.nam-anh-sang", "{0} năm ánh sáng", [so(v, 2)]),
      khiDoi: (v) => { S.dx = v; S.pTay = true; veP(); },
    });
    const dkDt = bang.thanhTruot({
      nhan: chuCanh("canh.khoang-thoi-gian-t-cua-p", "Khoảng thời gian Δt của P"), min: -6, max: 6, buoc: 0.05, giaTri: S.dt,
      hienThi: (v) => chuCanh("canh.nam", "{0} năm", [so(v, 2)]),
      khiDoi: (v) => { S.dt = v; S.pTay = true; veP(); },
    });
    const dkV = bang.thanhTruot({
      nhan: chuCanh("canh.van-toc-nguoi-quan-sat-2", "Vận tốc người quan sát 2"), min: -V_MAX, max: V_MAX, buoc: 0.01, giaTri: 0,
      hienThi: (v) => `${so(v, 2)} c`,
      khiDoi: (v) => { S.v = v; S.vTay = true; veNQS(); },
    });
    const dkHyp = bang.congTac({ nhan: chuCanh("canh.mat-cung-khoang-qua-p", "Mặt «cùng khoảng» qua P"), giaTri: false, khiDoi: (v) => { S.hien.hyp = v; veP(); } });
    const dkTT = bang.chon({
      nhan: chuCanh("canh.thien-the-o-xa", "Thiên thể ở xa"),
      luaChon: Object.entries(THIEN_THE).map(([k, v]) => ({ giaTri: k, nhan: v.ten })),
      giaTri: S.tt,
      khiDoi: (v) => { S.tt = v; veXa(); },
    });
    const dkChay = bang.congTac({ nhan: chuCanh("canh.cho-tam-bay-gio-chay", "Cho tấm «bây giờ» chạy"), giaTri: S.chay, khiDoi: (v) => { S.chay = v; } });
    const dkT = bang.thanhTruot({
      nhan: chuCanh("canh.thoi-diem-bay-gio", "Thời điểm «bây giờ»"), min: -H, max: H, buoc: 0.05, giaTri: S.T,
      hienThi: (v) => chuCanh("canh.t-nam", "t = {0} năm", [so(v, 1)]),
      khiDoi: (v) => { S.T = v; S.chay = false; dkChay.dat(false); S.tTay = true; },
    });
    const ghiChu = bang.chuThich('');

    const GOC = {
      cheo: [[17.5, 6.5, 20.5], [0.3, -0.2, 0]],
      ngang: [[0.3, 0.2, 26], [0.3, 0, 0]],
      tren: [[0.01, 26, 0.02], [0, 0, 0]],
      tau: [[5.5, 4.5, 19], [-1.3, 2.6, 0]],
      xa: [[4, 2.6, 25.5], [2.0, 0.3, 0]],
    };
    const goc = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    function capNhatGiaoDien() {
      const h = S.hien;
      nonTren.visible = !!h.nonTren;
      nonDuoi.visible = !!h.nonDuoi;
      nhomVongXep.visible = !!h.vongXep;
      nhomVung.visible = !!h.vungNhan;
      nhomP.visible = !!h.P;
      nhomCatNgang.visible = !!h.catNgang;
      nhomTau.visible = !!h.tau;
      nhomXa.visible = !!h.xa;
      nhomVach.visible = !h.xa;
      truc.visible = !h.xa;           // bước «nhìn xa»: đường xanh của ta đã là trục thời gian, đơn vị đổi theo ví dụ
      kinh.visible = !h.xa && !h.anKinh;
      dkDx.el.hidden = dkDt.el.hidden = dkHyp.el.hidden = !h.P;
      dkV.el.hidden = !h.nqs;
      dkTT.el.hidden = !h.xa;
      dkChay.el.hidden = dkT.el.hidden = !!h.xa;
      dkHyp.dat(!!h.hyp);
      ghiChu.dat(h.xa
        ? chuCanh("canh.duong-xanh-ta-duong-trang-thien-the-tia", "Đường xanh: ta. Đường trắng: thiên thể. Tia vàng: ánh sáng ta đang nhận, đi dọc nón quá khứ của ta. Đơn vị hai trục đổi theo từng ví dụ, ánh sáng luôn nghiêng 45°. Trái Đất và thiên thể ở đỉnh hai đường là hình minh hoạ, không theo tỉ lệ. Rê chuột vào hai sự kiện để xem chú giải.")
        : chuCanh("canh.thoi-gian-huong-len-c-1-moi-o", "Thời gian hướng lên, c = 1: mỗi ô 1 năm ánh sáng, mỗi nấc 1 năm. Nón vàng: tương lai của O; nón xanh: quá khứ của O. Màu của P: cam (tương lai), xanh (quá khứ), vàng (trên nón), tím (nơi khác). Kéo các đốm sáng trong hình để tự thử."));
      if (h.P) veP();
      else veNQS();
      if (h.xa) veXa();
      datTayNam();
    }

    function cauHinh(o = {}) {
      if (o.hien) S.hien = { ...o.hien };
      if (o.chay != null) { S.chay = o.chay; dkChay.dat(o.chay); if (!o.chay) { S.T = H * 0.6; dkT.dat(S.T); } }
      if (o.dx != null) { S.dx = o.dx; dkDx.dat(o.dx); }
      if (o.dt != null) { S.dt = o.dt; dkDt.dat(o.dt); }
      if (o.v != null) { S.v = o.v; dkV.dat(o.v); }
      if (o.tt) { S.tt = o.tt; dkTT.dat(o.tt); }
      if (o.vao) { S.pTay = false; S.vTay = false; S.tTay = false; }
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
      if (ten === 'p') keoGia(tayP, [V(2, 3, 0), V(1.2, 1.5, 0), V(0.7, 0.35, 0)]);
      else if (ten === 'p-non') keoGia(tayP, [V(3.5, 4.5, 0), V(4.42, 4.4, 0)]);
      else if (ten === 'v') keoGia(tayV, [V(1, T_NQS, 0), V(2.5, T_NQS, 0), V(0.605 * T_NQS, T_NQS, 0)]);
      else if (ten === 'tau') keoGia(tayTau, [V(xTau(1), 1, 0), V(xTau(2.29), 2.29, 0)]);
      else if (ten === 'T') keoGia(tayT, [V(-NUA, 1, NUA), V(-NUA, 3, NUA)]);
    }
    function apThu() {
      const ten = thu;
      thu = null;
      if (ten && ten.startsWith('keo:')) { thuKeo = ten.slice(4); return; }
      if (ten === 'p-gan') datPTay(0.7, 0.35);
      else if (ten === 'p-non') datPTay(4.4, 4.4);
      else if (ten === 'nqs') { datPTay(5, 3); S.v = 0.6; S.vTay = true; dkV.dat(0.6); veNQS(); }
      else if (ten === 'nqs-tl') { S.v = 0.45; S.vTay = true; dkV.dat(0.45); veNQS(); }
      else if (ten === 'tau3') datPTay(2.5, Math.sqrt(9 + 6.25));
      else if (ten === 'tau2') { S.chay = false; dkChay.dat(false); S.T = T_TAU_2; dkT.dat(S.T); S.tTay = true; }
      else if (ten === 'bay-gio') { S.chay = false; dkChay.dat(false); S.T = 3.2; dkT.dat(S.T); S.tTay = true; }
    }

    function capNhat(dt) {
      if (thu) apThu();
      if (thuKeo && S.thoiGian > 2.2) apKeoThat();
      S.thoiGian += dt;
      if (S.chay && !dangKeo.T && !dangKeo.tau) {
        S.T += dt * 0.9;
        const duoi = S.hien.nonDuoi && !S.hien.tau ? -H : 0;
        if (S.T > H + 0.6) S.T = duoi;
        if (S.T < duoi) S.T = duoi;
        dkT.dat(Math.min(S.T, H));
      }
      const T = Math.min(S.T, H);
      kinh.datT(T);
      veVong(T);
      domO.scale.setScalar(0.75 + 0.9 * Math.max(0, 1 - Math.abs(T) / 0.5));
      const chop = !S.hien.xa && !S.hien.anKinh ? Math.max(0, 1 - Math.abs(T) / 0.35) : 0;
      chopO.material.opacity = chop;
      chopO.scale.setScalar(0.6 + 2.2 * chop);
      if (S.hien.tau) {
        const t = Math.max(0, Math.min(T_TAU, T));
        domTau.position.set(xTau(t), t, 0);
        for (let i = 0; i < 30; i++) { const ti = Math.max(0, t - i * 0.03); vetTau.dat(i, xTau(ti), ti, 0); }
        vetTau.xong(30);
        // Nhãn nằm bên trái con tàu (tàu đi sang phải), không chồng lên nhãn O lúc tàu mới rời gốc.
        nhanDongHo.position.copy(domTau.position); nhanDongHo.position.x -= 0.25; nhanDongHo.center.set(1, 0.5);
        nhanDongHo.datChu(chuCanh("canh.dong-ho-tau-nam-toc-do-c-o", "đồng hồ tàu: τ = {0} năm<small>tốc độ {1} c, ở nhà t = {2} năm</small>", [so(thoiGianRiengTau(t, T_TAU, V_TAU), 2), so(vanTocTau(t, T_TAU, V_TAU), 2), so(t, 2)]));
      }
      if (S.hien.xa) {
        // các hạt sáng chạy dọc tia từ thiên thể tới ta (vệt chuyển động chỉ để thấy hướng đi của ánh sáng)
        for (let i = 0; i < photon.length; i++) {
          const f = (S.thoiGian * 0.18 + i / photon.length) % 1;
          photon[i].position.set(D_XA * (1 - f), -D_XA * (1 - f), 0);
          photon[i].material.opacity = Math.min(1, f * 6, (1 - f) * 6);
        }
        const mh = moHinhTT[S.tt];
        if (mh && dt) {
          // mỗi thiên thể của thư viện có cách gọi capNhat riêng: Mặt Trời nhận thời gian tích luỹ, lỗ đen cần máy quay
          try { if (S.tt === 'troi') mh.capNhat(S.thoiGian); else if (S.tt === 'tam') mh.capNhat(dt, app.camera); else mh.capNhat?.(dt); } catch { /* */ }
        }
        if (datTD && dt) datTD.capNhat(dt);
      }
      capNhatTayNam();
      amThanh(dt);
    }

    function hud() {
      const d = [];
      if (S.hien.xa) {
        const tt2 = THIEN_THE[S.tt];
        d.push([tt2.ten, chuCanh("canh.cach", "cách {0}", [tt2.kc])]);
        d.push([chuCanh("canh.anh-sang-ta-thay-luc-nay-roi-no", "Ánh sáng ta thấy lúc này rời nó"), chuCanh("canh.truoc-giay", "{0} trước ({1} giây)", [doiGiay(tt2.giay), tt2.giay < 1e6 ? so(tt2.giay, 1) : luyThua(tt2.giay, 3)])]);
        return d;
      }
      if (!S.hien.tau && !S.hien.anKinh) d.push([chuCanh("canh.bay-gio", "Bây giờ"), chuCanh("canh.t-nam", "t = {0} năm", [so(Math.min(S.T, H), 1)])]);
      if (S.hien.P) {
        const loai = phanLoai(S.dx, S.dt);
        const s2 = binhPhuongKhoang(S.dx, S.dt);
        d.push(['P', `Δx = ${so(S.dx, 2)}, Δt = ${so(S.dt, 2)} · s² = ${so(s2, 2)}`]);
        d.push([chuCanh("canh.loai", "Loại"), MO_TA_LOAI[loai][0]]);
        if (MO_TA_LOAI[loai][1]) d.push([chuCanh("canh.nghia-la", "Nghĩa là"), MO_TA_LOAI[loai][1]]);
        if (loai === 'tuongLai' || loai === 'quaKhu') {
          d.push([chuCanh("canh.di-thang-deu-o-p", "Đi thẳng đều O–P"), chuCanh("canh.v-c-nam", "v = {0} c · τ = {1} năm", [so(S.dx / Math.abs(S.dt), 3), so(thoiGianRieng(S.dx, S.dt), 3)])]);
        } else if (loai === 'khongGian') {
          d.push([chuCanh("canh.khoang-cach-rieng", "Khoảng cách riêng"), chuCanh("canh.nam-anh-sang-aa89b6", "σ = {0} năm ánh sáng", [so(khoangCachRieng(S.dx, S.dt), 3)])]);
          d.push([chuCanh("canh.thu-tu-o-p", "Thứ tự O, P"), chuCanh("canh.tuy-nguoi-quan-sat-bai-6", "tuỳ người quan sát (Bài 6)")]);
        }
        if (S.hien.nqs) {
          const [tp, xp] = bienDoi(S.dt, S.dx, S.v);
          d.push([chuCanh("canh.nguoi-quan-sat-2", "Người quan sát 2"), `v = ${so(S.v, 2)} c: Δt′ = ${so(tp, 2)}, Δx′ = ${so(xp, 2)} · s² = ${so(-tp * tp + xp * xp, 2)}`]);
        }
      }
      if (S.hien.tau) {
        d.push([chuCanh("canh.con-tau", "Con tàu"), chuCanh("canh.toi-da-c-nghieng-toi-da-anh-sang", "tối đa {0} c, nghiêng tối đa {1}° (ánh sáng: 45°)", [so(V_TAU, 1), so((Math.atan(V_TAU) * 180) / Math.PI, 1)])]);
        d.push([chuCanh("canh.ca-chang", "Cả chặng"), chuCanh("canh.o-nha-nam-dong-ho-tau-nam", "ở nhà {0} năm · đồng hồ tàu {1} năm", [so(T_TAU, 0), so(thoiGianRiengTau(T_TAU, T_TAU, V_TAU), 2)])]);
      }
      return d;
    }

    return {
      scene, capNhat, hud, cauHinh, goc,
      // Trạng thái cho thử thách
      dat: {
        gan: () => S.hien.P && phanLoai(S.dx, S.dt) === 'khongGian' && S.dx >= 0.05 && S.dx <= 1,
        cungLuc: () => S.hien.nqs && S.vTay && phanLoai(S.dx, S.dt) === 'khongGian' && Math.abs(bienDoi(S.dt, S.dx, S.v)[0]) <= 0.1,
        tau3: () => S.hien.P && phanLoai(S.dx, S.dt) === 'tuongLai' && S.dx >= 2 && Math.abs(thoiGianRieng(S.dx, S.dt) - 3) <= 0.05,
        tau2: () => S.hien.tau && S.tTay && !S.chay && Math.abs(thoiGianRiengTau(Math.max(0, Math.min(T_TAU, S.T)), T_TAU, V_TAU) - 2) <= 0.03,
      },
      datP: (dx, dt) => { S.dx = dx; S.dt = dt; dkDx.dat(dx); dkDt.dat(dt); veP(); },
      chonThienThe: (k) => { S.tt = k; dkTT.dat(k); veXa(); },
    };
  },
};
