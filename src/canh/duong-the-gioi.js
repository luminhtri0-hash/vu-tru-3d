import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 4 — Sự kiện và đường thế giới (Bản 3: vật có hình, đường thế giới là ống sáng, kéo «bây giờ» và vận tốc, có tiếng).
// Hai mô hình trong cùng một cảnh:
//   «cb»  ba kiểu chuyển động: khối không-thời gian (2 chiều không gian + thời gian), đơn vị giây và giây ánh sáng, c = 1.
//   «hmt» Hệ Mặt Trời thật: đường thế giới của Mặt Trời và các hành tinh, vị trí theo bảng NASA/JPL;
//         trục thời gian nén được từ khoảng 57 000 lần về đúng tỉ lệ thật (1 năm ứng với 63 241 AU).
// Quy ước trục: thời gian hướng lên (Y), không gian nằm ngang (X, Z); xem src/khung/ktg.js.

import * as THREE from 'three';
import { so, soNghia, NAS_AU, KM_S_SANG_AU_NAM, C } from '../vat-ly/hang-so.js';
import { HANH_TINH, viTriHanhTinh, phanTuQuyDao, diemTrenQuyDao, jdTuMs, ngayThang } from '../vat-ly/he-mat-troi.js';
import { gocNghiengDo, vTuGoc, R_TRAM, buocLoXo, vTuBuoc, TOC_BAY_GIO, TROI_HMT, gocTiaNangDo, THU_THACH_B4 } from '../vat-ly/duong-the-gioi.js';
import { taoNhan, taoNenSao, DuongDay, DuongDong, duongDayTinh, goNhanDeNhau, kep } from '../khung/ve.js';
import { MAU_KTG, trucKTG, luoiSan, matHienTai, suKien } from '../khung/ktg.js';
import { LoXo, taoDenCanh, vlSon, vlSang, vlKimLoai, hopBo, dat, ghep, domSang } from '../khung/do-vat-chung.js';
import { taoTenLua } from '../khung/do-vat-ten-lua.js';
import { taoVeTinh } from '../khung/do-vat-nho.js';
import { taoMatTroi, taoHanhTinh, taoTraiDat } from '../khung/hanh-tinh.js';
import { nguCung } from '../khung/am-thanh.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('duong-the-gioi', khoa, goc, thamSo);

const R = String.raw;

// ----- Mô hình «ba kiểu chuyển động» -----
const NUA = 6;          // nửa cạnh sàn không gian (giây ánh sáng)
const T_MAX = 10;       // khối cao 10 giây
const N_CB = 200;       // số điểm trên mỗi đường thế giới

// ----- Mô hình «Hệ Mặt Trời thật» -----
const K_AU = { trong: 2.0, ngoai: 0.2 };       // đơn vị hiển thị cho mỗi AU
const SO_HT = { trong: 4, ngoai: 8 };
const S_NEN = { trong: 2.2, ngoai: 0.25 };     // đơn vị hiển thị cho mỗi năm, khi nén nhiều nhất
const Y_DUOI = -7, Y_TREN = 2.6;               // khung hình theo trục thời gian («hôm nay» nằm ở 0)
const NUA_HMT = 6.4;
const N_QUA = 280, N_TOI = 70;
const nenToiDa = (pv) => (NAS_AU * K_AU[pv]) / S_NEN[pv];

// Chọn nấc chia thời gian sao cho các vạch cách nhau vừa mắt.
const NAC = [
  [1 / 525960, 1, (v) => chuCanh("canh.phut-truoc", "{0} phút trước", [v])], [10 / 525960, 10, (v) => chuCanh("canh.phut-truoc", "{0} phút trước", [v])], [1 / 8766, 1, (v) => chuCanh("canh.gio-truoc", "{0} giờ trước", [v])], [6 / 8766, 6, (v) => chuCanh("canh.gio-truoc", "{0} giờ trước", [v])], [1 / 365.25, 1, (v) => chuCanh("canh.ngay-truoc", "{0} ngày trước", [v])],
  [7 / 365.25, 1, (v) => chuCanh("canh.tuan-truoc", "{0} tuần trước", [v])], [1 / 12, 1, (v) => chuCanh("canh.thang-truoc", "{0} tháng trước", [v])], [0.25, 3, (v) => chuCanh("canh.thang-truoc", "{0} tháng trước", [v])], [1, 1, (v) => chuCanh("canh.nam-truoc", "{0} năm trước", [v])], [5, 5, (v) => chuCanh("canh.nam-truoc", "{0} năm trước", [v])], [10, 10, (v) => chuCanh("canh.nam-truoc", "{0} năm trước", [v])], [50, 50, (v) => chuCanh("canh.nam-truoc", "{0} năm trước", [v])],
];
const doiThoiGian = (nam) => {
  const phut = nam * 525960;
  if (phut < 90) return chuCanh("canh.phut", "{0} phút", [so(phut, phut < 10 ? 1 : 0)]);
  if (phut < 2880) return chuCanh("canh.gio", "{0} giờ", [so(phut / 60, 1)]);
  const ngay = nam * 365.25;
  if (ngay < 60) return chuCanh("canh.ngay", "{0} ngày", [so(ngay, ngay < 10 ? 1 : 0)]);
  if (nam < 2) return chuCanh("canh.thang", "{0} tháng", [so(nam * 12, 1)]);
  return chuCanh("canh.nam", "{0} năm", [so(nam, 1)]);
};

export default {
  id: 'duong-the-gioi',
  ten: 'Sự kiện và đường thế giới',
  moTa: 'Vật đứng yên vẫn vạch một đường trong không-thời gian',
  yChinh: 'Mỗi vật không phải là một điểm chạy trong không gian mà là một **đường** nằm trong không-thời gian: đường thế giới. Đứng yên là đường thẳng đứng, đi đều là đường nghiêng, quay vòng là đường xoắn ốc. Ở tỉ lệ thật, đường thế giới của Trái Đất gần như thẳng tắp.',
  mayAnh: { viTri: [12, 10, 14.5], dich: [0, 4.6, 0], fov: 40, min: 4, max: 70 },

  baiGiang: {
    mucTieu: [
      'Nói được sự kiện là gì và vì sao cần bốn con số để chỉ ra nó.',
      'Đọc được một sơ đồ không-thời gian: trục nào là thời gian, lát cắt «bây giờ» là gì.',
      'Nhận ra đường thế giới của vật đứng yên, đi đều, đi vòng tròn và của tia sáng.',
      'Giải thích được vì sao ở tỉ lệ thật, đường thế giới của Trái Đất gần như thẳng.',
    ],
    buoc: [
      {
        ten: 'Sự kiện: ở đâu và khi nào',
        noiDung: R`
          Hẹn gặp ai đó, bạn phải nói đủ hai điều: gặp ở **đâu** và gặp **lúc nào**. Thiếu một trong hai là lỡ hẹn. Vật lý gọi một cặp «nơi + lúc» như thế là một {{sự kiện}}: một tiếng pháo nổ, hai con tàu gặp nhau, một hồi chuông cửa.

          Nơi cần ba con số (dài, rộng, cao). Lúc cần một con số. Vậy mỗi sự kiện cần **bốn con số** $(t;\ x;\ y;\ z)$. Tập hợp mọi sự kiện là một thể bốn chiều, gọi là {{không-thời gian}}.

          > [Lưu ý] Màn hình chỉ vẽ được ba chiều. Vì thế trong mô hình này ta **bỏ bớt chiều cao** $z$ và lấy trục thẳng đứng làm **trục thời gian**. Mặt sàn có lưới là không gian (hai chiều $x$, $y$). Càng lên cao là càng về sau.

          Tấm kính màu xanh lục là **«bây giờ»**; nó đi lên đều đặn. Mỗi chấm sáng là một sự kiện. Sự kiện nằm yên một chỗ trong khối, và chỉ «xảy ra» đúng lúc tấm kính đi ngang qua nó.

          > [Thử ngay] Kéo đốm xanh lục ở góc tấm kính để tự đưa «bây giờ» lên xuống. Đi qua một sự kiện thì sự kiện chớp sáng và có tiếng chuông; đi qua mỗi vạch giây có một tiếng «tích». Rồi đổi góc nhìn: nhìn từ trên xuống, bạn thấy lại tấm bản đồ quen thuộc và mất hẳn thông tin «khi nào»; nhìn ngang, bạn thấy rõ sự kiện nào trước, sự kiện nào sau.
          > [[Nhìn từ trên xuống|tren]] [[Nhìn ngang|ngang]] [[Nhìn chéo|cheo]]

          > [Lưu ý] Tiếng «tích» chỉ để đếm thời gian của mô hình: khi tấm kính tự chạy, mỗi giây trong mô hình kéo dài 1,25 giây thật.`,
        vao: (c) => c.cauHinh({ che: 'cb', hien: { sk: true }, mayAnh: 'cheo' }),
        nut: { tren: (c) => c.goc('tren'), ngang: (c) => c.goc('ngang'), cheo: (c) => c.goc('cheo') },
        thuThach: {
          de: 'Kéo tấm «bây giờ» tới đúng lúc **hai tàu gặp nhau**, rồi thả tay.',
          kiem: (c) => { const s = c.trangThai(); return s.che === 'cb' && !s.chay && Math.abs(s.T - THU_THACH_B4.gap.t) <= THU_THACH_B4.gap.dungSai; },
          goiY: 'Rê chuột lên chấm xanh lam «Hai tàu gặp nhau» để đọc tọa độ: $t = 4{,}5$ giây, tức giữa vạch 4 và vạch 5 trên trục thời gian.',
        },
      },
      {
        ten: 'Đứng yên vẫn là đang đi',
        noiDung: R`
          Đặt vào khối một **ngôi nhà**. Nó không nhúc nhích trong không gian. Nhưng thời gian vẫn trôi, nên ngôi nhà có mặt ở sự kiện «nhà, lúc 1 giây», rồi «nhà, lúc 2 giây», cứ thế mãi. Nối tất cả lại, ta được một đường thẳng đứng: {{đường thế giới}} của ngôi nhà.

          > [Định nghĩa] **Đường thế giới** là tập hợp mọi sự kiện trong đời một vật. Mỗi vật, mỗi người, mỗi hạt đều có một đường thế giới.

          Ngôi nhà nhỏ đứng trên tấm kính là ngôi nhà «lúc này». Đoạn ống sáng dưới tấm kính là quá khứ của nó, đoạn mờ đứt khúc phía trên là tương lai.

          > [Thử ngay] Kéo tấm «bây giờ» xuống tận đáy rồi lên tận đỉnh. Ngôi nhà không dịch sang ngang chút nào: nó chỉ trượt dọc đường thế giới thẳng đứng của chính nó.

          Bạn đang ngồi yên đọc dòng này, nhưng trong không-thời gian bạn vẫn đang «đi»: đi dọc trục thời gian. Muốn so thời gian với độ dài, ta nhân thời gian với tốc độ ánh sáng $c$:

          $$ 1\ \text{giây} \times c = 299\,792{,}458\ \text{km} $$

          Trong mô hình, mỗi ô trên sàn dài **một giây ánh sáng** (gần 300 000 km) và mỗi nấc trên trục thời gian là một giây. Hai trục dùng chung một thước đo.`,
        vao: (c) => c.cauHinh({ che: 'cb', hien: { A: true }, mayAnh: 'cheo' }),
      },
      {
        ten: 'Đi đều: đường nghiêng',
        noiDung: R`
          Thêm một **con tàu** bay thẳng với tốc độ không đổi. Sau mỗi giây nó dịch đi một đoạn như nhau, nên đường thế giới của nó là một đường thẳng **nghiêng**.

          Đi càng nhanh, đường càng ngả về phía sàn. Gọi $\theta$ là góc giữa đường thế giới và trục thời gian:

          $$ \tan\theta = \frac{\text{quãng đường}}{c \times \text{thời gian}} = \frac{v}{c} $$

          > [Thử ngay] Kéo đốm xanh lam nằm trên đường thế giới của con tàu (hoặc thanh **Tốc độ con tàu** ở dưới). Cung nhỏ ở chân đường đánh dấu góc $\theta$; đường vàng đứt là tia sáng, nghiêng 45°. Ở $0{,}5\,c$ đường nghiêng 26,6°; ở $0{,}9\,c$ nghiêng 42°.
          > [[Cho tàu đứng yên|v0]] [[Bay 0,5 c|v5]] [[Bay 0,9 c|v9]]

          Vệt mờ trên sàn là **đường đi trong không gian** của con tàu, thứ ta vẫn quen gọi là quỹ đạo. Nó chỉ là cái bóng của đường thế giới đổ xuống sàn. Cái bóng không cho biết tàu đi nhanh hay chậm; đường thế giới thì có.

          > [Con số] Máy bay chở khách bay 900 km/h, tức $v/c \approx 8{,}3 \times 10^{-7}$. Đường thế giới của nó nghiêng chưa tới 0,00005°. Với mọi tốc độ đời thường, đường thế giới gần như dựng đứng.`,
        vao: (c) => c.cauHinh({ che: 'cb', hien: { A: true, B: true }, vB: 0.5, mayAnh: 'cheo' }),
        nut: { v0: (c) => c.datVB(0), v5: (c) => c.datVB(0.5), v9: (c) => c.datVB(0.9) },
        thuThach: {
          de: 'Chỉnh cho đường thế giới của con tàu nghiêng đúng **35°** so với trục thời gian. Khi đó tàu bay bao nhiêu phần tốc độ ánh sáng?',
          kiem: (c) => { const s = c.trangThai(); return s.che === 'cb' && Math.abs(gocNghiengDo(s.vB) - THU_THACH_B4.nghieng.goc) <= THU_THACH_B4.nghieng.dungSai; },
          goiY: R`Dùng $\tan\theta = v/c$: $v/c = \tan 35° \approx 0{,}70$. Ô số liệu ghi góc nghiêng hiện tại.`,
        },
      },
      {
        ten: 'Ánh sáng: đúng 45°, không gì ngả hơn',
        noiDung: R`
          Lúc $t = 1$ giây, ngôi nhà bật đèn. Tia sáng (màu vàng) đi được một giây ánh sáng sau mỗi giây, nên đường thế giới của nó nghiêng **đúng 45°**.

          Không vật nào đi nhanh hơn ánh sáng. Nói bằng hình: **không đường thế giới nào được nghiêng quá 45°** so với trục thời gian. Kéo tốc độ con tàu lên cao nhất: nó tiến sát góc 45° nhưng không bao giờ chạm tới.

          Giới hạn 45° chia không-thời gian quanh mỗi sự kiện thành vùng «tới được» và vùng «không tới được». Bài sau sẽ dựng nó thành {{nón ánh sáng}}.

          > [Thử ngay] Kéo tấm «bây giờ»: lúc nào khoảng cách từ đầu tia sáng tới ngôi nhà (tính bằng giây ánh sáng) cũng đúng bằng số giây kể từ khi bật đèn. Ô số liệu ghi khoảng cách ấy. Tiếng «keng» nhỏ là lúc đèn bật.
          > [[Nhìn ngang để so góc|ngang]] [[Tàu bay 0,95 c|v95]]

          +++ Đi sâu: vì sao chọn đơn vị để ánh sáng nghiêng 45°?
          Nếu đo thời gian bằng giây và độ dài bằng mét, tia sáng sẽ nghiêng 89,9999998°: gần như nằm ngang, còn mọi vật khác thì dựng đứng. Hình vẽ như thế vô dụng.

          Vì vậy trong thuyết tương đối người ta luôn đo thời gian bằng $ct$ (giây ánh sáng, năm ánh sáng), hoặc nói gọn là «đặt $c = 1$». Khi đó vận tốc là một con số không có đơn vị, nằm giữa 0 và 1, và ánh sáng luôn nghiêng 45°.
          +++`,
        vao: (c) => c.cauHinh({ che: 'cb', hien: { A: true, B: true, L: true }, vB: 0.6, mayAnh: 'cheo' }),
        nut: { ngang: (c) => c.goc('ngang'), v95: (c) => c.datVB(0.95) },
        thuThach: {
          de: 'Đưa tấm «bây giờ» tới lúc tia sáng đã cách ngôi nhà đúng **3 giây ánh sáng**, rồi thả tay.',
          kiem: (c) => { const s = c.trangThai(), q = THU_THACH_B4.tiaSang; return s.che === 'cb' && !s.chay && Math.abs(s.T - (q.tPhat + q.khoang)) <= q.dungSai; },
          goiY: 'Đèn bật lúc $t = 1$ giây và ánh sáng đi một giây ánh sáng mỗi giây. Vậy cần $t = 1 + 3 = 4$ giây.',
        },
      },
      {
        ten: 'Đi vòng tròn: đường xoắn ốc',
        noiDung: R`
          Thêm một **trạm quay** chạy vòng tròn. Trong không gian (cái bóng trên sàn), nó cứ đi mãi một vòng khép kín. Nhưng trong không-thời gian nó không bao giờ trở lại chỗ cũ: đi hết một vòng thì thời gian đã khác. Đường thế giới của nó là một **đường xoắn ốc**, như chiếc lò xo vươn lên theo trục thời gian.

          - **Bán kính** lò xo bằng bán kính quỹ đạo $R$.
          - **Bước** lò xo (khoảng cách giữa hai vòng liền nhau) bằng $c \times$ chu kỳ $T$.
          - Quay càng nhanh, lò xo càng nén; quay càng chậm, lò xo càng duỗi thẳng.

          $$ \frac{\text{bước lò xo}}{\text{chu vi quỹ đạo}} = \frac{cT}{2\pi R} = \frac{c}{v} $$

          > [Thử ngay] Kéo đốm hồng ở chân lò xo (hoặc thanh **Tốc độ trạm quay**) và nhìn lò xo nén lại, duỗi ra. Mỗi lần trạm đi hết một vòng có một tiếng ngân nhẹ: quay nhanh thì tiếng dày, quay chậm thì tiếng thưa.
          > [[Quay chậm 0,2 c|c2]] [[Quay nhanh 0,9 c|c9]] [[Nhìn từ trên xuống|tren]] [[Nhìn chéo|cheo]]

          Mặt Trăng quay quanh Trái Đất, Trái Đất quanh Mặt Trời, Mặt Trời quanh tâm Ngân Hà: tất cả đều là những chiếc lò xo như thế. Bước tiếp theo dựng lò xo thật của Hệ Mặt Trời.`,
        vao: (c) => c.cauHinh({ che: 'cb', hien: { A: true, B: true, C: true, L: true }, vB: 0.5, vC: 0.6, mayAnh: 'cheo' }),
        nut: { c2: (c) => c.datVC(0.2), c9: (c) => c.datVC(0.9), tren: (c) => c.goc('tren'), cheo: (c) => c.goc('cheo') },
        thuThach: {
          de: 'Chỉnh tốc độ trạm quay cho bước lò xo dài đúng **15 giây ánh sáng**.',
          kiem: (c) => { const s = c.trangThai(); return s.che === 'cb' && Math.abs(buocLoXo(R_TRAM, s.vC) - THU_THACH_B4.loXo.buoc) <= THU_THACH_B4.loXo.dungSai; },
          goiY: R`Bước lò xo $= cT = 2\pi R\,c/v$ với $R = 1{,}7$ giây ánh sáng. Giải ra $v = 2\pi \times 1{,}7/15 \approx 0{,}71\,c$. Ô số liệu ghi bước lò xo hiện tại.`,
        },
      },
      {
        ten: 'Hệ Mặt Trời thật trong không-thời gian',
        noiDung: R`
          Đây là bốn hành tinh vòng trong. Vị trí tính từ bảng quỹ đạo của NASA/JPL, y như ở Bài 1. Tấm lưới là **hôm nay**. Bên dưới là quá khứ: mỗi hành tinh kéo theo đường thế giới của mình, một chiếc lò xo quấn quanh đường thẳng đứng của Mặt Trời.

          - Sao Thủy quay một vòng mất 88 ngày: lò xo nén chặt nhất.
          - Trái Đất: mỗi vòng đúng một năm.
          - Sao Hỏa: 687 ngày, lò xo thưa nhất.

          Tấm lưới đứng yên còn các đường thế giới trôi dần xuống: thời gian đang chạy.

          > [Thử ngay] Nghe: mỗi khi một hành tinh đi hết một vòng quỹ đạo, nó ngân một nốt (hành tinh vòng trong cao, vòng ngoài trầm). Ở mức nén này một giây trôi qua là 3 tháng, nên Sao Thủy ngân gần như mỗi giây, Trái Đất 4 giây một lần, Sao Hỏa 7,5 giây một lần. Rê chuột lên một hành tinh để xem chu kỳ của nó. Khi xem cả tám hành tinh, chỉ bốn hành tinh khổng lồ ngân, vì bốn hành tinh trong quay quá nhanh.

          > [Lưu ý] Để thấy được hình lò xo, trục thời gian ở đây đã bị **nén khoảng 57 000 lần**. Một năm ánh sáng dài 63 241 AU, trong khi quỹ đạo Trái Đất chỉ rộng 1 AU. Vẽ đúng tỉ lệ thì mỗi vòng lò xo của Trái Đất phải cao gấp 63 241 lần bán kính của nó.

          Tia màu vàng nối Mặt Trời với Trái Đất là ánh nắng đang chạm vào bạn lúc này. Nó rời Mặt Trời 8,3 phút trước. Ở mức nén này 8,3 phút quá ngắn, nên tia trông như nằm ngang.

          [[Xem cả tám hành tinh|tam]] [[Về bốn hành tinh vòng trong|bon]]`,
        vao: (c) => c.cauHinh({ che: 'hmt', phamVi: 'trong', mucNen: 1, u: 0, mayAnh: 'hmt' }),
        nut: { tam: (c) => c.cauHinh({ phamVi: 'ngoai', mucNen: 1 }), bon: (c) => c.cauHinh({ phamVi: 'trong', mucNen: 1 }) },
      },
      {
        ten: 'Kéo về tỉ lệ thật: Trái Đất gần như đi thẳng',
        noiDung: R`
          Bấm nút dưới đây để nhả dần trục thời gian về đúng tỉ lệ. Lò xo duỗi ra, duỗi ra mãi, và cuối cùng thành những đường **gần như thẳng đứng**.

          [[Nhả về tỉ lệ thật|that]] [[Nén lại như cũ|nen]]

          Ở tỉ lệ thật, phần quá khứ dưới tấm «hôm nay» chỉ dài chừng nửa giờ. Trong nửa giờ, Trái Đất mới đi được khoảng 1/18 000 vòng quỹ đạo. Tia nắng giờ nghiêng đúng 45° như mọi tia sáng: nó vượt 1 AU trong 499 giây.

          Trái Đất bay quanh Mặt Trời 29,8 km/s. Nghe thì nhanh, nhưng

          $$ \frac{v}{c} = \frac{29{,}8}{299\,792} \approx 10^{-4} $$

          nên đường thế giới của nó chỉ nghiêng 0,0057° so với trục thời gian.

          > [Tóm lại] Trong không-thời gian, Trái Đất **gần như đi thẳng**. Vòng tròn quỹ đạo mà ta thấy chỉ là cái bóng trên sàn của một đường hầu như thẳng tắp.

          Đây là manh mối đầu tiên dẫn tới thuyết tương đối rộng. Mặt Trời không cần «kéo» Trái Đất đi vòng. Nó chỉ cần làm không-thời gian **cong đi một chút xíu**, và Trái Đất cứ thế đi «thẳng» trong không-thời gian cong ấy. Phần 3 sẽ làm rõ câu này.`,
        vao: (c) => c.cauHinh({ che: 'hmt', phamVi: 'trong', u: 0, mayAnh: 'hmt' }),
        nut: { that: (c) => c.nhaNen(0), nen: (c) => c.nhaNen(1) },
        thuThach: {
          de: 'Kéo thanh **Trục thời gian** tới mức tia nắng hợp với tấm «hôm nay» đúng **30°**. Khi đó trục thời gian còn bị nén bao nhiêu lần?',
          kiem: (c) => { const s = c.trangThai(); return s.che === 'hmt' && s.phamVi === 'trong' && Math.abs(gocTiaNangDo(s.nen) - THU_THACH_B4.tiaNang.goc) <= THU_THACH_B4.tiaNang.dungSai; },
          goiY: R`Nén trục thời gian $n$ lần thì phần đứng của tia nắng ngắn đi $n$ lần, nên tia hợp với tấm «hôm nay» một góc có $\tan = 1/n$. Cần $n = 1/\tan 30° = \sqrt 3 \approx 1{,}7$: thanh gần sát đầu trái. Ô số liệu ghi góc hiện tại.`,
        },
      },
      {
        ten: 'Đổi người quan sát: cả bó đường cùng nghiêng',
        noiDung: R`
          Từ đầu bài, ta vẽ mọi thứ theo cách nhìn của một người đứng yên so với Mặt Trời. Một người khác bay ngang qua Hệ Mặt Trời với tốc độ $u$ sẽ vẽ khác: với người ấy, Mặt Trời và cả đàn hành tinh đang trôi ngược lại với tốc độ $u$.

          > [Thử ngay] Kéo **Tốc độ người quan sát**. Đường thế giới của Mặt Trời hết dựng đứng, cả bó lò xo cùng ngả về một phía.
          > [[Người quan sát bay 10 km/s|u10]] [[Bay 30 km/s|u30]] [[Đứng yên so với Mặt Trời|u0]]

          Chú ý hai điều:

          1. **Không sự kiện nào thay đổi.** Các hành tinh vẫn gặp nhau, xa nhau đúng những lúc ấy. Chỉ cách gắn tọa độ cho các sự kiện là khác đi. Đường thế giới là thứ có thật; «đứng yên» hay «chuyển động» chỉ là cách mô tả.
          2. Tấm lưới «hôm nay» **vẫn nằm ngang**. Đó là cách đổi khung nhìn của Galilei và Newton: mọi người dùng chung một «bây giờ». Với tốc độ nhỏ so với ánh sáng, cách này đúng gần như tuyệt đối. Bài 6 sẽ cho thấy khi tốc độ lớn, chính tấm «bây giờ» cũng phải nghiêng.

          > [Lưu ý] Đoạn video Ngân Hà gợi ý cho khoá học này, và Bài 1, chính là phép đổi khung đó. Nhìn từ Ngân Hà, Mặt Trời trôi 230 km/s nên **vệt đi trong không gian** của các hành tinh thành hình xoắn ốc. Còn ở bài này, xoắn ốc là **đường thế giới**: nó có sẵn ngay cả khi nhìn từ Mặt Trời, vì thứ kéo giãn nó ra là thời gian.`,
        vao: (c) => c.cauHinh({ che: 'hmt', phamVi: 'trong', mucNen: 1, u: 6, mayAnh: 'hmt' }),
        nut: { u10: (c) => c.datU(10), u30: (c) => c.datU(30), u0: (c) => c.datU(0) },
      },
      {
        ten: '«Bây giờ» chỉ là một lát cắt',
        noiDung: R`
          Gom lại những gì vừa thấy:

          - Có thể xem vũ trụ không phải là một sân khấu ba chiều đổi thay theo thời gian, mà là **một khối bốn chiều** gồm mọi sự kiện.
          - Mỗi vật là một **đường** (hay một dải) nằm trong khối đó.
          - «Thế giới lúc này» là **một lát cắt ngang** của khối. Bộ phim ba chiều quen thuộc chỉ là dãy các lát cắt xếp nối nhau.

          [[Xem lại ba kiểu chuyển động|cb]] [[Xem lại Hệ Mặt Trời|hmt]]

          > [Hiểu sai thường gặp] «Vật chuyển động dọc theo đường thế giới của nó.» Không hẳn. Đường thế giới không nằm trong thời gian để mà chuyển động; nó **chứa sẵn** thời gian. Cả con đường nằm sẵn trong khối. Thứ «đang chạy» trong mô hình chỉ là tấm kính «bây giờ», thêm vào cho dễ hình dung.

          > [Lịch sử] Năm 1908, Hermann Minkowski, thầy dạy toán cũ của Einstein, dựng thuyết tương đối thành hình học của không-thời gian bốn chiều và đặt ra chữ «đường thế giới». Ông nói đại ý: từ nay không gian riêng rẽ và thời gian riêng rẽ sẽ lùi thành những cái bóng; chỉ sự hợp nhất của cả hai mới là thực tại độc lập.

          Ba câu hỏi mà phần này trả lời tiếp:

          1. Ánh sáng vạch ra giới hạn nào trong khối bốn chiều? (Bài 5: nón ánh sáng)
          2. Người chuyển động rất nhanh cắt «bây giờ» ra sao? (Bài 6: phép biến đổi Lorentz)
          3. «Độ dài» của một đường thế giới có nghĩa gì? (Bài 6: thời gian riêng)`,
        vao: (c) => c.cauHinh({ che: 'cb', hien: { A: true, B: true, C: true, L: true }, vB: 0.5, vC: 0.6, mayAnh: 'cheo' }),
        nut: {
          cb: (c) => c.cauHinh({ che: 'cb', hien: { A: true, B: true, C: true, L: true }, mayAnh: 'cheo' }),
          hmt: (c) => c.cauHinh({ che: 'hmt', phamVi: 'trong', mucNen: 1, u: 0, mayAnh: 'hmt' }),
        },
      },
    ],
    congThuc: [
      { ten: 'Tọa độ của một sự kiện', tex: R`(ct;\ x;\ y;\ z)`, y: 'Nhân thời gian với $c$ để cả bốn tọa độ cùng đo bằng độ dài.' },
      { ten: 'Độ nghiêng của đường thế giới', tex: R`\tan\theta = \frac{v}{c}`, y: '$\\theta$ là góc so với trục thời gian. Ánh sáng: 45°. Vật có khối lượng: luôn nhỏ hơn 45°.' },
      { ten: 'Lò xo của chuyển động tròn', tex: R`\frac{\text{bước}}{\text{chu vi}} = \frac{cT}{2\pi R} = \frac{c}{v}`, y: 'Với Trái Đất quanh Mặt Trời tỉ số này khoảng 10 000: lò xo gần như duỗi thẳng.' },
    ],
    cauHoi: [
      {
        hoi: 'Một hòn đá nằm yên trên bàn. Đường thế giới của nó trong sơ đồ không-thời gian là gì?',
        chon: ['Một điểm, vì nó không chuyển động', 'Một đường thẳng song song với trục thời gian', 'Một đường nằm ngang', 'Nó không có đường thế giới'],
        dung: 1,
        giai: 'Hòn đá không đổi chỗ nhưng thời gian vẫn trôi, nên nó có mặt ở cùng một nơi tại mọi thời điểm: đó là một đường thẳng dọc theo trục thời gian. Một điểm trong sơ đồ là một **sự kiện**, không phải một vật.',
      },
      {
        hoi: R`Trong sơ đồ dùng đơn vị $c = 1$, một đường thế giới thẳng nghiêng 30° so với trục thời gian. Vật ấy đi với tốc độ bao nhiêu?`,
        chon: [R`$0{,}30\,c$`, R`$0{,}50\,c$`, R`$0{,}58\,c$`, R`$0{,}87\,c$`],
        dung: 2,
        giai: R`$v/c = \tan 30° \approx 0{,}577$. Lưu ý: không phải $\sin 30°$ (bằng 0,5) cũng không phải $30/90$.`,
      },
      {
        hoi: 'Vì sao không thể có một vật mà đường thế giới nằm ngang?',
        chon: ['Vì sơ đồ sẽ quá rộng', 'Vì vật ấy phải có mặt ở nhiều nơi trong cùng một lúc, tức đi nhanh vô hạn', 'Vì vật ấy phải đứng yên', 'Vì trục thời gian luôn thẳng đứng'],
        dung: 1,
        giai: 'Đường nằm ngang nghĩa là mọi điểm trên đường có cùng thời điểm: vật ở nhiều nơi cùng lúc, ứng với tốc độ vô hạn. Giới hạn thật còn chặt hơn: không đường thế giới nào nghiêng quá 45°.',
      },
      {
        hoi: 'Mặt Trăng quay quanh Trái Đất trên quỹ đạo bán kính 384 400 km, mỗi vòng mất 27,3 ngày. Bước của «lò xo» đường thế giới Mặt Trăng dài gấp khoảng bao nhiêu lần bán kính quỹ đạo?',
        chon: ['Khoảng 6 lần', 'Khoảng 1 800 lần', 'Khoảng 1,8 triệu lần', 'Khoảng 63 241 lần'],
        dung: 2,
        giai: R`Bước lò xo $= cT = 299\,792\ \text{km/s} \times 27{,}3 \times 86\,400\ \text{s} \approx 7{,}07 \times 10^{11}$ km. Chia cho 384 400 km được khoảng $1{,}84 \times 10^{6}$. Lò xo của Mặt Trăng duỗi thẳng gần như tuyệt đối.`,
      },
      {
        hoi: 'Hai người mô tả cùng một con tàu. Người thứ nhất bảo nó đứng yên, người thứ hai bảo nó bay 10 km/s. Ai đúng? Điều gì là chung cho cả hai?',
        dap: 'Cả hai đều đúng: mỗi người dùng một khung nhìn. Thứ chung cho cả hai là **các sự kiện** và **đường thế giới** nối chúng: con tàu gặp trạm nào, lúc nào bật đèn, có va vào thiên thạch hay không. Đổi khung nhìn chỉ làm cả bó đường thế giới nghiêng đi, không tạo thêm hay xoá mất sự kiện nào.',
      },
    ],
    docThem: [
      'E. F. Taylor và J. A. Wheeler, *Spacetime Physics* (bản 2, 1992), chương 1 và chương 5: sự kiện, đường thế giới, cách đọc sơ đồ không-thời gian.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 4: sơ đồ không-thời gian.',
      'R. P. Feynman, *The Feynman Lectures on Physics*, tập I, chương 17 «Space-Time».',
      'H. Minkowski, bài giảng «Raum und Zeit» (Không gian và thời gian), Köln, 1908.',
    ],
    thuatNgu: [
      { vi: 'sơ đồ không-thời gian', en: 'spacetime diagram', nghia: 'Hình vẽ có một trục là thời gian (nhân với $c$) và các trục còn lại là không gian. Mỗi điểm là một sự kiện, mỗi vật là một đường.' },
      { vi: 'lát cắt đồng thời', en: 'surface of simultaneity', nghia: 'Tập hợp các sự kiện mà một người quan sát coi là xảy ra cùng một lúc; «thế giới lúc này» của người ấy.' },
    ],
  },

  conSo: [
    '**299 792,458 km**: độ dài ứng với một giây trên trục thời gian.',
    '**63 241 lần**: bước lò xo của Trái Đất (một năm ánh sáng) so với bán kính quỹ đạo của nó (1 AU).',
    '**0,0057°**: độ nghiêng thật của đường thế giới Trái Đất so với trục thời gian.',
    '**499 giây**: thời gian ánh sáng đi từ Mặt Trời tới Trái Đất.',
  ],
  hieuDung: '**Sơ đồ không-thời gian không phải ảnh chụp.** Không ai «đứng ngoài» mà nhìn thấy cả khối như thế. Nó là một tấm bản đồ: mỗi điểm là một sự kiện. Mô hình ở đây bỏ bớt một chiều không gian để vẽ được; khối thật có bốn chiều.',
  nguon: 'Vị trí hành tinh: bảng «Approximate Positions of the Planets» của NASA/JPL (Standish và Williams), như ở Bài 1. Hằng số: CODATA 2018, IAU 2012.',

  tao(app) {
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 1600, hat: 31, doSang: 0.42 }));
    const den = taoDenCanh(scene, { renderer: app.renderer, huongChinh: [6, 9, 8], huongVien: [-7, 4, -6] });
    const am = app.am, tt = app.tt;
    const nhomCB = new THREE.Group(), nhomHMT = new THREE.Group();
    scene.add(nhomCB, nhomHMT);

    const S = {
      che: 'cb',
      T: 0, chay: true, vB: 0.5, vC: 0.6, hien: { sk: true, A: false, B: false, C: false, L: false },
      jd: jdTuMs(Date.now()), phamVi: 'trong', mucNen: 1, mucNenDich: null, u: 0,
    };
    // Tốc độ đang vẽ chạy mượt tới tốc độ đích (bấm nút thì đường thế giới nghiêng dần, không nhảy).
    const loB = new LoXo(S.vB, 0.6), loC = new LoXo(S.vC, 0.6);
    let keoT = false, keoB = false, keoC = false;
    const dsOng = [];
    const ong = (n, tc) => { const o = new OngSang(n, tc); dsOng.push(o); return o; };

    // =====================================================================
    // Mô hình 1: ba kiểu chuyển động
    // =====================================================================
    nhomCB.add(luoiSan({ nua: NUA, o: 1, t: 0, doMo: 0.13 }));
    nhomCB.add(trucKTG({ x: [-NUA, NUA + 0.7], y: [-NUA, NUA + 0.7], t: [0, T_MAX + 0.9], goc: [-NUA, -NUA, 0], nhanX: 'x', nhanY: 'y', nhanT: chuCanh("canh.thoi-gian", "thời gian") }));
    for (let t = 1; t <= T_MAX; t++) {
      // vạch từng giây trên trục thời gian; vạch chẵn có số
      const gach = duongDayTinh([-NUA - 0.16, t, -NUA, -NUA + 0.16, t, -NUA], { mau: MAU_KTG.thoiGian, rong: t % 2 ? 1.2 : 2, doMo: t % 2 ? 0.45 : 0.8, sang: 1.3 });
      nhomCB.add(gach.line);
      if (t % 2 === 0) {
        const n = taoNhan(chuCanh("canh.giay", "{0} giây", [t]), 'mo tran');
        n.position.set(-NUA, t, -NUA);
        nhomCB.add(n);
      }
    }
    const oNhan = taoNhan(chuCanh("canh.moi-o-1-giay-anh-sang-300-000", "mỗi ô: 1 giây ánh sáng ≈ 300 000 km"), 'mo tran', { giua: true });
    oNhan.position.set(0, 0, NUA + 0.55);
    nhomCB.add(oNhan);
    const kinh = matHienTai({ nua: NUA, doMo: 0.032 });
    const nhanKinh = taoNhan('', 'tran');
    nhanKinh.element.style.color = '#8fe3a8';
    kinh.add(nhanKinh);
    nhanKinh.position.set(NUA, 0.02, NUA);
    nhanKinh.element.style.marginTop = '30px';
    nhomCB.add(kinh);

    const dsVat = [
      { id: 'A', ten: chuCanh("canh.ngoi-nha", "Ngôi nhà"), phu: chuCanh("canh.dung-yen", "đứng yên"), mau: 0xffe9cc, r: 0.07, ham: () => [-3.5, 2.2] },
      { id: 'B', ten: chuCanh("canh.con-tau", "Con tàu"), phu: chuCanh("canh.di-thang-deu", "đi thẳng đều"), mau: MAU_KTG.thoiGian, r: 0.07, ham: (t, v = loB.v) => [-5.2 + v * t, -2.8] },
      { id: 'C', ten: chuCanh("canh.tram-quay", "Trạm quay"), phu: chuCanh("canh.di-vong-tron", "đi vòng tròn"), mau: MAU_KTG.hong, r: 0.065, ham: (t, v = loC.v) => { const w = v / R_TRAM; return [2.3 + R_TRAM * Math.cos(w * t), 0.4 + R_TRAM * Math.sin(w * t)]; } },
      { id: 'L', ten: chuCanh("canh.tia-sang", "Tia sáng"), phu: chuCanh("canh.nghieng-dung-45", "nghiêng đúng 45°"), mau: MAU_KTG.anhSang, r: 0.05, tu: 1, ham: (t) => [-3.5 + Math.max(0, t - 1), 2.2] },
    ];
    for (const o of dsVat) {
      o.nhom = new THREE.Group();
      o.ong = ong(o.id === 'C' ? N_CB + 1 : 2, { mau: o.mau, banKinh: o.r, sang: o.id === 'L' ? 3.2 : 2.3 });
      o.bong = new DuongDay(N_CB + 2, { mau: o.mau, rong: 1.6, doMo: 0.45, cong: false });
      o.cham = suKien(o.mau, 0.3);
      o.day = new DuongDong(2, { mau: o.mau, doMo: 0.22 });
      o.nhan = taoNhan(`${o.ten}<small>${o.phu}</small>`, 'dam');
      o.vat = o.id === 'A' ? taoNha() : o.id === 'B' ? taoTau() : o.id === 'C' ? taoTram() : taoPhoton();
      o.nhom.add(o.ong.mesh, o.bong.line, o.cham, o.day.line, o.nhan, o.vat.nhom);
      nhomCB.add(o.nhom);
    }
    const [vA, vB, vC, vL] = dsVat;
    // Dựng lại ống của một vật (chỉ khi tốc độ đổi: ống phủ cả quãng 0–10 giây, phần trên «bây giờ» tự mờ trong shader).
    function dungOng(o) {
      const t0 = o.tu ?? 0;
      const n = o.ong.toiDa;
      for (let i = 0; i < n; i++) {
        const t = t0 + ((T_MAX - t0) * i) / (n - 1);
        const [x, y] = o.ham(t);
        o.ong.dat(i, x, t, y);
      }
      o.ong.xong(n);
    }
    function datVat(o, T) {
      const t0 = o.tu ?? 0;
      let n = 0;
      if (T > t0) {
        n = Math.max(2, Math.ceil((N_CB * (T - t0)) / T_MAX) + 1);
        for (let i = 0; i < n; i++) {
          const t = t0 + ((T - t0) * i) / (n - 1);
          const [x, y] = o.ham(t);
          o.bong.dat(i, x, 0.015, y);
        }
      }
      o.bong.xong(n);
      o.ong.mat.uniforms.uNay.value = T;
      const coMat = T >= t0 && T <= T_MAX;
      const [x, y] = o.ham(kep(T, t0, T_MAX));
      o.cham.visible = o.day.line.visible = o.vat.nhom.visible = coMat;
      o.nhan.visible = coMat;
      o.cham.position.set(x, T, y);
      o.day.dat(0, x, 0, y); o.day.dat(1, x, T, y); o.day.xong(2);
      o.vat.nhom.position.set(x, T, y);
      o.nhan.position.set(x + 0.5, T + 0.62, y);
    }

    // Mũi tên vận tốc trong không-thời gian: từ sự kiện xuất phát, đi theo đường thế giới H giây. Kéo đầu mũi tên để
    // đổi tốc độ; đường vàng đứt là tia sáng từ cùng chỗ (giới hạn 45°), cung nhỏ đánh dấu góc nghiêng θ.
    function taoMuiTenVanToc({ goc, huong, H, mau, ten, nhanAnhSang = true }) {
      const g = new THREE.Group();
      // mốc thẳng đứng (trục thời gian riêng của sự kiện xuất phát) để so góc
      const moc = duongDayTinh([goc[0], 0, goc[2], goc[0], H + 0.3, goc[2]], { mau: 0xffffff, rong: 1.3, doMo: 0.45, net: [0.1, 0.08] });
      const sang = duongDayTinh([goc[0], 0, goc[2], goc[0] + huong[0] * H, H, goc[2] + huong[2] * H], { mau: MAU_KTG.anhSang, rong: 1.5, doMo: 0.55, net: [0.12, 0.09], sang: 1.3 });
      const cung = new DuongDay(25, { mau, rong: 2.2, doMo: 0.95, sang: 1.8, quang: 0.1 });
      const nhanSang = taoNhan(chuCanh("canh.anh-sang-45", "ánh sáng: 45°"), 'vang tran');
      nhanSang.position.set(goc[0] + huong[0] * H, H + 0.25, goc[2] + huong[2] * H);
      const nhanGoc = taoNhan('', `${ten} tran`);
      nhanGoc.center.x = 1;                       // nhãn góc nằm bên kia mốc thẳng đứng, không đè lên đường thế giới
      g.add(moc.line, sang.line, cung.line, nhanGoc);
      if (nhanAnhSang) g.add(nhanSang);
      return {
        nhom: g,
        dat(v) {
          const th = Math.atan(v), rc = 1.4;
          for (let i = 0; i <= 24; i++) {
            const a = (th * i) / 24;
            cung.dat(i, goc[0] + huong[0] * rc * Math.sin(a), rc * Math.cos(a), goc[2] + huong[2] * rc * Math.sin(a));
          }
          cung.xong(v > 0.004 ? 25 : 0);
          nhanGoc.position.set(goc[0] - huong[0] * 0.12, rc + 0.05, goc[2] - huong[2] * 0.12);
          nhanGoc.datChu(`θ = ${so(gocNghiengDo(v), 1)}°`);
        },
      };
    }
    const H_B = 5, H_C = 2, GOC_B = [-5.2, 0, -2.8], GOC_C = [2.3 + R_TRAM, 0, 0.4];
    const mtB = taoMuiTenVanToc({ goc: GOC_B, huong: [1, 0, 0], H: H_B, mau: MAU_KTG.thoiGian, ten: 'xanh' });
    const mtC = taoMuiTenVanToc({ goc: GOC_C, huong: [0, 0, 1], H: H_C, mau: MAU_KTG.hong, ten: 'hong', nhanAnhSang: false });
    vB.nhom.add(mtB.nhom); vC.nhom.add(mtC.nhom);

    // các sự kiện mẫu (bước đầu)
    const nhomSK = new THREE.Group();
    nhomCB.add(nhomSK);
    const dsSK = [
      { ten: chuCanh("canh.chuong-cua-reo", "Chuông cửa reo"), x: -3.5, y: 2.2, t: 2, mau: MAU_KTG.anhSang, f: 1174.7 },
      { ten: chuCanh("canh.hai-tau-gap-nhau", "Hai tàu gặp nhau"), x: 2.5, y: -2, t: 4.5, mau: MAU_KTG.thoiGian, f: 880 },
      { ten: chuCanh("canh.phao-hoa-no", "Pháo hoa nổ"), x: -0.5, y: 4, t: 7.5, mau: MAU_KTG.hong, f: 1480 },
    ];
    for (const e of dsSK) {
      e.cham = suKien(e.mau, 0.55);
      e.cham.position.set(e.x, e.t, e.y);
      const san = suKien(e.mau, 0.2, { vong: false });
      san.position.set(e.x, 0.02, e.y);
      const day = new DuongDong(2, { mau: e.mau, doMo: 0.3 });
      day.dat(0, e.x, 0, e.y); day.dat(1, e.x, e.t, e.y); day.xong(2);
      const nhan = taoNhan(chuCanh("canh.x-y-t-giay", "{0}<small>x = {1} · y = {2} · t = {3} giây</small>", [e.ten, so(e.x, 1), so(e.y, 1), so(e.t, 1)]), 'dam');
      nhan.position.copy(e.cham.position);
      // chớp sáng và vòng loang trên tấm kính lúc «bây giờ» đi qua sự kiện
      e.chop = domSang(e.mau, 1, 3);
      e.chop.position.copy(e.cham.position);
      e.vong = new DuongDay(65, { mau: e.mau, rong: 2, sang: 1.6, quang: 0.12 });
      e.tuoi = 9;
      nhomSK.add(e.cham, san, day.line, nhan, e.chop, e.vong.line);
      tt.them(e.cham, {
        ten: e.ten, mau: e.mau, banKinhPx: 16,
        moTa: () => chuCanh("canh.su-kien-x-y-giay-anh-sang-t", "Sự kiện: <span class=\"so\">x = {0} · y = {1}</span> giây ánh sáng, <span class=\"so\">t = {2}</span> giây.<br>{3}", [so(e.x, 1), so(e.y, 1), so(e.t, 1), S.T < e.t - 0.02 ? chuCanh("canh.chua-xay-ra-tam-bay-gio-chua-toi", "Chưa xảy ra: tấm «bây giờ» chưa tới.") : chuCanh("canh.da-xay-ra-tam-bay-gio-da-di", "Đã xảy ra: tấm «bây giờ» đã đi qua.")]),
      });
    }

    // Tay nắm 1: kéo tấm «bây giờ» lên xuống dọc trục thời gian.
    const tayT = tt.tayNam({
      viTri: [NUA, 0, NUA], mau: MAU_KTG.hienTai, co: 0.17,
      rangBuoc: { kieu: 'duong', qua: [NUA, 0, NUA], huong: [0, 1, 0] },
      gioiHan: (p) => p.set(NUA, kep(p.y, 0, T_MAX), NUA),
      ten: chuCanh("canh.tam-bay-gio", "Tấm «bây giờ»"), moTa: () => chuCanh("canh.dang-o-t-giay-keo-len-la-di", "Đang ở <span class=\"so\">t = {0}</span> giây. Kéo lên là đi tới tương lai, kéo xuống là lùi về quá khứ.", [so(Math.min(S.T, T_MAX), 2)]),
      nhan: chuCanh("canh.keo-bay-gio-len-xuong", "Kéo «bây giờ» lên xuống"),
      khiNam: () => { keoT = true; datChay(false); },
      khiKeo: (p) => { S.T = p.y; },
      khiTha: () => { keoT = false; },
    });
    // Tay nắm 2, 3: đầu mũi tên vận tốc của con tàu và của trạm quay.
    const tayB = tt.tayNam({
      viTri: [GOC_B[0] + S.vB * H_B, H_B, GOC_B[2]], mau: MAU_KTG.thoiGian, co: 0.13,
      rangBuoc: { kieu: 'duong', qua: [GOC_B[0], H_B, GOC_B[2]], huong: [1, 0, 0] },
      gioiHan: (p) => p.set(kep(p.x, GOC_B[0], GOC_B[0] + 0.95 * H_B), H_B, GOC_B[2]),
      ten: chuCanh("canh.van-toc-cua-con-tau", "Vận tốc của con tàu"), moTa: () => chuCanh("canh.v-c-duong-the-gioi-nghieng-khong-keo", "<span class=\"so\">v = {0} c</span> · đường thế giới nghiêng <span class=\"so\">{1}°</span>. Không kéo quá được đường vàng 45°.", [so(S.vB, 2), so(gocNghiengDo(S.vB), 1)]),
      nhan: chuCanh("canh.keo-de-doi-toc-do-con-tau", "Kéo để đổi tốc độ con tàu"),
      khiNam: () => { keoB = true; },
      khiKeo: (p) => datVB((p.x - GOC_B[0]) / H_B, true),
      khiTha: () => { keoB = false; },
    });
    const tayC = tt.tayNam({
      viTri: [GOC_C[0], H_C, GOC_C[2] + S.vC * H_C], mau: MAU_KTG.hong, co: 0.13,
      rangBuoc: { kieu: 'duong', qua: [GOC_C[0], H_C, GOC_C[2]], huong: [0, 0, 1] },
      gioiHan: (p) => p.set(GOC_C[0], H_C, kep(p.z, GOC_C[2] + 0.1 * H_C, GOC_C[2] + 0.95 * H_C)),
      ten: chuCanh("canh.van-toc-cua-tram-quay", "Vận tốc của trạm quay"), moTa: () => chuCanh("canh.v-c-buoc-lo-xo-giay-anh-sang", "<span class=\"so\">v = {0} c</span> · bước lò xo <span class=\"so\">{1}</span> giây ánh sáng.", [so(S.vC, 2), so(buocLoXo(R_TRAM, S.vC), 1)]),
      nhan: chuCanh("canh.keo-de-doi-toc-do-tram", "Kéo để đổi tốc độ trạm"),
      khiNam: () => { keoC = true; },
      khiKeo: (p) => datVC((p.z - GOC_C[2]) / H_C, true),
      khiTha: () => { keoC = false; },
    });
    // Rê chuột lên vật để xem nó là gì.
    const MO_TA_VAT = {
      A: () => chuCanh("canh.dung-yen-o-x-3-5-y-2", "Đứng yên ở <span class=\"so\">x = −3,5 · y = 2,2</span>. Đường thế giới dựng đứng: chỉ đi theo thời gian."),
      B: () => chuCanh("canh.bay-deu-c-km-s-khong-bat-dong", "Bay đều <span class=\"so\">{0} c ≈ {1} km/s</span>. Không bật động cơ: đi đều thì không cần lực đẩy.", [so(S.vB, 2), so(S.vB * 299792.458, 0)]),
      C: () => chuCanh("canh.chay-vong-tron-ban-kinh-giay-anh-sang", "Chạy vòng tròn bán kính <span class=\"so\">{0}</span> giây ánh sáng với <span class=\"so\">{1} c</span>; một vòng mất <span class=\"so\">{2}</span> giây.", [so(R_TRAM, 1), so(S.vC, 2), so(buocLoXo(R_TRAM, S.vC), 1)]),
      L: () => chuCanh("canh.bat-tu-ngoi-nha-luc-t-1-giay", "Bật từ ngôi nhà lúc t = 1 giây. Mỗi giây đi đúng một giây ánh sáng: đường nghiêng 45°."),
    };
    for (const o of dsVat) tt.them(o.vat.nhom, { ten: o.ten, mau: o.mau, moTa: MO_TA_VAT[o.id], ...(o.id === 'L' ? { banKinhPx: 18 } : {}) });

    // =====================================================================
    // Mô hình 2: Hệ Mặt Trời thật
    // =====================================================================
    const luoiHMT = luoiSan({ nua: NUA_HMT - 0.4, o: 1, t: 0, doMo: 0.12 });
    const kinhHMT = matHienTai({ nua: NUA_HMT, doMo: 0.05 });
    nhomHMT.add(luoiHMT, kinhHMT);
    nhomHMT.add(trucKTG({ x: null, y: null, t: [Y_DUOI, Y_TREN + 0.7], goc: [-NUA_HMT, NUA_HMT, 0], nhanT: chuCanh("canh.thoi-gian", "thời gian") }));
    const nhanNay = taoNhan('', 'tran');
    nhanNay.element.style.color = '#8fe3a8';
    nhanNay.position.set(NUA_HMT, 0, NUA_HMT);
    const nhanO = taoNhan('', 'mo tran', { giua: true });
    nhanO.position.set(0, 0, NUA_HMT + 0.55);
    nhomHMT.add(nhanNay, nhanO);
    const dsVach = Array.from({ length: 6 }, () => {
      const n = taoNhan('', 'mo tran');
      const gach = new DuongDong(2, { mau: MAU_KTG.thoiGian, doMo: 0.5 });
      nhomHMT.add(n, gach.line);
      return { n, gach };
    });

    const matTroi = taoMatTroi({ banKinh: 0.3 });
    matTroi.datDoSang(0.8);
    const mt = {
      ong: ong(3, { mau: 0xffd27a, banKinh: 0.06, sang: 1.6, moTuongLai: 0.3 }),
      nhan: taoNhan(chuCanh("canh.mat-troi", "Mặt Trời"), 'vang dam'),
    };
    nhomHMT.add(mt.ong.mesh, matTroi.nhom, mt.nhan);
    tt.them(matTroi.cau ?? matTroi.nhom, { ten: chuCanh("canh.mat-troi", "Mặt Trời"), mau: 0xffd27a, moTa: chuCanh("canh.dung-yen-o-tam-trong-khung-cua-mat", "Đứng yên ở tâm (trong khung của Mặt Trời): đường thế giới dựng đứng, các hành tinh quấn quanh nó.") });
    const tiaNang = new DuongDay(2, { mau: MAU_KTG.anhSang, rong: 2.2, quang: 0.16, sang: 1.8 });
    const nhanNang = taoNhan('', 'vang tran');
    nhomHMT.add(tiaNang.line, nhanNang);

    const CO_HT = { trong: [0.13, 0.19, 0.2, 0.16], ngoai: [0.06, 0.08, 0.085, 0.07, 0.26, 0.22, 0.17, 0.17] };
    const NOT_HT = [8, 7, 5, 4, 2, 0, -2, -3];          // bậc ngũ cung: hành tinh trong cao, ngoài trầm
    const dsHT = HANH_TINH.map((ht, i) => {
      const vat = ht.id === 'dat' ? taoTraiDat({ banKinh: 1, chiTiet: 72 }) : taoHanhTinh({ id: ht.id, banKinh: 1, chiTiet: 64 });
      vat.datNguonSang?.([0, 0, 0]);
      const p = {
        ht, i, vat,
        ong: ong(N_QUA + N_TOI - 1, { mau: ht.mau, banKinh: 0.03, sang: 1.25, moTuongLai: 0.28 }),
        vong: new DuongDong(129, { mau: ht.mau, doMo: 0.28 }),
        nhan: taoNhan(ht.ten, 'dam'),
        nhom: new THREE.Group(),
        goc: null,
      };
      p.ong.mat.uniforms.uNay.value = 0;
      p.nhom.add(p.ong.mesh, p.vong.line, vat.nhom, p.nhan);
      nhomHMT.add(p.nhom);
      tt.them(vat.nhom, {
        ten: ht.ten, mau: ht.mau,
        moTa: () => chuCanh("canh.mot-vong-quy-dao-ngay-toc-do-trung", "Một vòng quỹ đạo: <span class=\"so\">{0} ngày</span> · tốc độ trung bình <span class=\"so\">{1} km/s</span><br>Ở tỉ lệ thật, đường thế giới chỉ nghiêng <span class=\"so\">{2}°</span>.", [so(ht.chuKyNam * 365.25, 0), so(ht.vKmS, 1), so((Math.atan(ht.vKmS / 299792.458) * 180) / Math.PI, 4)]),
      });
      return p;
    });
    mt.ong.mat.uniforms.uNay.value = 0;

    const tam = [0, 0, 0];
    const dsNhanHMT = [];
    let choVong = 0;
    function veHMT(coTieng) {
      const k = K_AU[S.phamVi];
      const nen = Math.pow(nenToiDa(S.phamVi), S.mucNen);
      const s = (NAS_AU * k) / nen;                 // đơn vị hiển thị cho mỗi năm
      const uAU = S.u * KM_S_SANG_AU_NAM;           // tốc độ người quan sát, AU/năm
      const namQua = -Y_DUOI / s, namToi = Y_TREN / s;
      const X = (x, dNam) => (x - uAU * dNam) * k;  // đổi khung kiểu Galilei rồi đổi sang đơn vị hiển thị
      // Mặt Trời
      mt.ong.dat(0, X(0, -namQua), Y_DUOI, 0); mt.ong.dat(1, 0, 0, 0); mt.ong.dat(2, X(0, namToi), Y_TREN, 0); mt.ong.xong(3);
      const rMT = S.phamVi === 'trong' ? 0.3 : 0.16;
      matTroi.capNhat(performance.now() * 0.001, rMT, rMT * 1.8);
      mt.nhan.position.set(0.1, rMT + 0.28, 0);
      // Hành tinh
      const soHT = SO_HT[S.phamVi];
      for (const p of dsHT) {
        p.nhom.visible = p.i < soHT;
        if (!p.nhom.visible) { p.goc = null; continue; }
        for (let j = 0; j < N_QUA; j++) {
          const dNam = -namQua * (1 - j / (N_QUA - 1));
          viTriHanhTinh(p.ht, S.jd + dNam * 365.25, tam);
          p.ong.dat(j, X(tam[0], dNam), dNam * s, -tam[1] * k);
        }
        for (let j = 1; j < N_TOI; j++) {
          const dNam = (namToi * j) / (N_TOI - 1);
          viTriHanhTinh(p.ht, S.jd + dNam * 365.25, tam);
          p.ong.dat(N_QUA - 1 + j, X(tam[0], dNam), dNam * s, -tam[1] * k);
        }
        p.ong.xong(N_QUA + N_TOI - 1);
        viTriHanhTinh(p.ht, S.jd, tam);
        const r = CO_HT[S.phamVi][p.i];
        p.vat.nhom.position.set(tam[0] * k, 0, -tam[1] * k);
        p.vat.nhom.scale.setScalar(r);
        p.nhan.position.set(tam[0] * k + r * 0.8, r + 0.12, -tam[1] * k);
        // Mỗi lần hành tinh đi hết một vòng (qua kinh độ hoàng đạo 0°) thì ngân một nốt.
        const g = Math.atan2(tam[1], tam[0]);
        if (coTieng && (S.phamVi === 'trong' || p.i >= 4) && p.goc != null && p.goc < 0 && g >= 0 && g - p.goc < 1) {
          am.not({ tanSo: nguCung(NOT_HT[p.i]), dai: 1.1, doTo: 0.26, dang: 'chuong', lech: kep(tam[0] * k / NUA_HMT, -0.8, 0.8) });
        }
        p.goc = g;
        if (p.ht.id === 'dat') {
          const d = Math.hypot(tam[0], tam[1], tam[2]);         // AU
          const yPhat = -(d / NAS_AU) * s;                      // ánh nắng rời Mặt Trời từ lúc đó
          tiaNang.dat(0, X(0, -d / NAS_AU), yPhat, 0);
          tiaNang.dat(1, tam[0] * k, 0, -tam[1] * k);
          tiaNang.xong(2);
          nhanNang.position.set(tam[0] * k * 0.5, yPhat * 0.5, -tam[1] * k * 0.5);
          nhanNang.datChu(chuCanh("canh.anh-nang-phut", "ánh nắng: {0} phút", [so((d * 149597870.7) / (C / 1000) / 60, 1)]));
          tiaNang.line.visible = nhanNang.visible = S.phamVi === 'trong';
        }
      }
      // vòng quỹ đạo trên tấm «hôm nay»: vài giây mới tính lại một lần
      if (choVong <= 0) {
        choVong = 1.5;
        for (const p of dsHT) {
          if (p.i >= soHT) continue;
          const el = phanTuQuyDao(p.ht, S.jd);
          for (let j = 0; j <= 128; j++) {
            diemTrenQuyDao(el, (j / 128) * 2 * Math.PI, tam);
            p.vong.dat(j, tam[0] * k, 0.01, -tam[1] * k);
          }
          p.vong.xong(129);
        }
      }
      // vạch chia trên trục thời gian
      let nac = NAC[NAC.length - 1];
      for (const q of NAC) if (q[0] * s >= 1.15) { nac = q; break; }
      dsVach.forEach((v, j) => {
        const y = -(j + 1) * nac[0] * s;
        const hien = y > Y_DUOI + 0.2;
        v.n.visible = v.gach.line.visible = hien;
        if (!hien) return;
        v.n.position.set(-NUA_HMT, y, NUA_HMT);
        v.n.datChu(nac[2]((j + 1) * nac[1]));
        v.gach.dat(0, -NUA_HMT - 0.12, y, NUA_HMT); v.gach.dat(1, -NUA_HMT + 0.12, y, NUA_HMT); v.gach.xong(2);
      });
      // nhãn đè nhau thì giấu bớt nhãn kém quan trọng
      dsNhanHMT.length = 0;
      dsNhanHMT.push({ nhan: mt.nhan, uuTien: 5 }, { nhan: nhanNang, uuTien: 1, tat: S.phamVi !== 'trong' });
      for (const p of dsHT) dsNhanHMT.push({ nhan: p.nhan, uuTien: p.ht.id === 'dat' ? 4 : 3 - p.i * 0.1, tat: !p.nhom.visible });
      goNhanDeNhau(dsNhanHMT, app.camera, app.rong, app.cao);
      nhanNay.datChu(chuCanh("canh.hom-nay", "hôm nay: {0}", [ngayThang(S.jd)]));
      nhanO.datChu(chuCanh("canh.moi-o-au-trieu-km", "mỗi ô: {0} AU ≈ {1} triệu km", [so(1 / k, 1), so((149.6 / k), 0)]));
      return { nen, s, namQua };
    }
    let thongTin = { nen: 1, s: 1, namQua: 1 };

    // =====================================================================
    // Điều khiển
    // =====================================================================
    const bang = app.bang;
    const dkChe = bang.chon({
      nhan: chuCanh("canh.mo-hinh", "Mô hình"),
      luaChon: [{ giaTri: 'cb', nhan: chuCanh("canh.ba-kieu-chuyen-dong", "Ba kiểu chuyển động") }, { giaTri: 'hmt', nhan: chuCanh("canh.he-mat-troi-that", "Hệ Mặt Trời thật") }],
      giaTri: S.che,
      khiDoi: (v) => cauHinh({ che: v, mayAnh: v === 'cb' ? 'cheo' : 'hmt' }),
    });
    const dkVB = bang.thanhTruot({
      nhan: chuCanh("canh.toc-do-con-tau", "Tốc độ con tàu"), min: 0, max: 0.95, buoc: 0.01, giaTri: S.vB,
      hienThi: (v) => chuCanh("canh.c-nghieng", "{0} c · nghiêng {1}°", [so(v, 2), so(gocNghiengDo(v), 1)]),
      khiDoi: (v) => datVB(v),
    });
    const dkVC = bang.thanhTruot({
      nhan: chuCanh("canh.toc-do-tram-quay", "Tốc độ trạm quay"), min: 0.1, max: 0.95, buoc: 0.01, giaTri: S.vC,
      hienThi: (v) => chuCanh("canh.c-mot-vong-giay", "{0} c · một vòng {1} giây", [so(v, 2), so(buocLoXo(R_TRAM, v), 1)]),
      khiDoi: (v) => datVC(v),
    });
    const dkT = bang.thanhTruot({
      nhan: chuCanh("canh.thoi-diem-bay-gio", "Thời điểm «bây giờ»"), min: 0, max: T_MAX, buoc: 0.05, giaTri: 0,
      hienThi: (v) => chuCanh("canh.t-giay", "t = {0} giây", [so(v, 1)]),
      khiDoi: (v) => { S.T = v; datChay(false); },
    });
    const dkChay = bang.congTac({ nhan: chuCanh("canh.bay-gio-tu-chay", "«Bây giờ» tự chạy"), giaTri: true, khiDoi: (v) => { S.chay = v; if (v && S.T >= T_MAX) S.T = 0; } });
    const dkPV = bang.chon({
      nhan: chuCanh("canh.pham-vi", "Phạm vi"),
      luaChon: [{ giaTri: 'trong', nhan: chuCanh("canh.bon-hanh-tinh-vong-trong", "Bốn hành tinh vòng trong") }, { giaTri: 'ngoai', nhan: chuCanh("canh.ca-tam-hanh-tinh", "Cả tám hành tinh") }],
      giaTri: S.phamVi,
      khiDoi: (v) => cauHinh({ phamVi: v }),
    });
    const dkNen = bang.thanhTruot({
      nhan: chuCanh("canh.truc-thoi-gian", "Trục thời gian"), min: 0, max: 1, buoc: 0.001, giaTri: S.mucNen,
      hienThi: (v) => { const n = Math.pow(nenToiDa(S.phamVi), v); return n < 1.5 ? chuCanh("canh.dung-ti-le-that", "đúng tỉ lệ thật") : chuCanh("canh.nen-lan", "nén {0} lần", [soNghia(n, 2)]); },
      khiDoi: (v) => { S.mucNen = v; S.mucNenDich = null; },
    });
    const dkU = bang.thanhTruot({
      nhan: chuCanh("canh.toc-do-nguoi-quan-sat", "Tốc độ người quan sát"), min: 0, max: 60, buoc: 0.5, giaTri: S.u,
      hienThi: (v) => (v === 0 ? chuCanh("canh.dung-yen-so-voi-mat-troi", "đứng yên so với Mặt Trời") : `${so(v, 1)} km/s`),
      khiDoi: (v) => { S.u = v; },
    });
    const ghiChu = bang.chuThich('');

    function datChay(b) { S.chay = b; dkChay.dat(b); }
    function datVB(v, ngay = false) { S.vB = kep(v, 0, 0.95); dkVB.dat(S.vB); loB.dat(S.vB, ngay); }
    function datVC(v, ngay = false) { S.vC = kep(v, 0.1, 0.95); dkVC.dat(S.vC); loC.dat(S.vC, ngay); }

    const GOC = {
      cheo: [[13.4, 10.9, 16.2], [0, 4.3, 0]],
      ngang: [[0.01, 5, 24], [0, 5, 0]],
      tren: [[0.01, 27, 0.02], [0, 4, 0]],
      hmt: [[11.4, 5.6, 16.6], [-1.2, -2.1, 0]],
    };
    const goc = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    function capNhatGiaoDien() {
      const cb = S.che === 'cb';
      nhomCB.visible = cb; nhomHMT.visible = !cb;
      dkVB.el.hidden = !cb || !S.hien.B;
      dkVC.el.hidden = !cb || !S.hien.C;
      dkT.el.hidden = dkChay.el.hidden = !cb;
      dkPV.el.hidden = dkNen.el.hidden = dkU.el.hidden = cb;
      for (const o of dsVat) o.nhom.visible = !!S.hien[o.id];
      nhomSK.visible = !!S.hien.sk;
      tayT.an(!cb);
      tayB.an(!cb || !S.hien.B);
      tayC.an(!cb || !S.hien.C);
      ghiChu.dat(cb
        ? chuCanh("canh.truc-dung-la-thoi-gian-tam-kinh-xanh", "Trục đứng là thời gian. Tấm kính xanh lục là «bây giờ» (kéo được); ống sáng dưới kính là quá khứ, phần mờ phía trên là tương lai. Vệt trên sàn là đường đi trong không gian.")
        : chuCanh("canh.tam-luoi-la-hom-nay-ben-duoi-la", "Tấm lưới là «hôm nay»; bên dưới là quá khứ. Mô hình bỏ chiều vuông góc với mặt phẳng quỹ đạo để lấy chỗ cho trục thời gian. Cỡ Mặt Trời và hành tinh phóng to để dễ thấy."));
    }

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      if (o.che && o.che !== S.che) { S.che = o.che; dkChe.dat(S.che); }
      if (o.hien) { S.hien = { sk: false, A: false, B: false, C: false, L: false, ...o.hien }; S.T = 0; datChay(true); }
      if (o.vB != null) datVB(o.vB);
      if (o.vC != null) datVC(o.vC);
      if (o.phamVi && o.phamVi !== S.phamVi) { S.phamVi = o.phamVi; dkPV.dat(S.phamVi); choVong = 0; for (const p of dsHT) p.goc = null; }
      if (o.mucNen != null) { S.mucNen = o.mucNen; S.mucNenDich = null; }
      if (o.u != null) { S.u = o.u; dkU.dat(o.u); }
      dkNen.dat(S.mucNen);
      capNhatGiaoDien();
      if (o.mayAnh) goc(o.mayAnh);
    }
    for (const o of dsVat) dungOng(o);
    mtB.dat(S.vB); mtC.dat(S.vC);
    capNhatGiaoDien();

    // Trạng thái đặt sẵn để chụp ảnh kiểm tra (chỉ trong chế độ im lặng): ?thu=<tên>
    let thu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    function apThu(ten) {
      if (ten === 'gap') { S.T = THU_THACH_B4.gap.t; datChay(false); }
      else if (ten === 'keo') { S.T = 6.2; datChay(false); }
      else if (ten === 'nghieng') datVB(vTuGoc(THU_THACH_B4.nghieng.goc), true);
      else if (ten === 'tia') { S.T = THU_THACH_B4.tiaSang.tPhat + THU_THACH_B4.tiaSang.khoang; datChay(false); }
      else if (ten === 'loxo') datVC(vTuBuoc(R_TRAM, THU_THACH_B4.loXo.buoc), true);
      else if (ten === 'tianang') { S.mucNen = Math.log(1 / Math.tan((THU_THACH_B4.tiaNang.goc * Math.PI) / 180)) / Math.log(nenToiDa('trong')); dkNen.dat(S.mucNen); }
    }

    let vbVe = -1, vcVe = -1, gioTram = 0;
    function capNhat(dt, dtThuc = dt) {
      if (thu) { apThu(thu); thu = null; }
      const dtm = Math.min(dtThuc, 0.1);
      if (S.che === 'cb') {
        const Tcu = Math.min(S.T, T_MAX);
        if (S.chay && !keoT) {
          S.T += dt * TOC_BAY_GIO;
          if (S.T > T_MAX + 1.4) S.T = 0;
        }
        const T = Math.min(S.T, T_MAX);
        const vb = loB.buoc(dtm), vc = loC.buoc(dtm);
        if (vb !== vbVe) { vbVe = vb; dungOng(vB); mtB.dat(vb); if (!keoB) tayB.dat([GOC_B[0] + vb * H_B, H_B, GOC_B[2]]); }
        if (vc !== vcVe) { vcVe = vc; dungOng(vC); mtC.dat(vc); if (!keoC) tayC.dat([GOC_C[0], H_C, GOC_C[2] + vc * H_C]); }
        kinh.datT(T);
        if (!keoT) tayT.dat([NUA, T, NUA]);
        nhanKinh.datChu(chuCanh("canh.bay-gio-t-giay", "bây giờ: t = {0} giây", [so(T, 1)]));
        dkT.dat(T);
        for (const o of dsVat) if (o.nhom.visible) datVat(o, T);
        // trạm quay: quay mặt theo hướng chuyển động; tàu và trạm có chuyển động nhỏ của riêng chúng
        if (vC.nhom.visible) { const a = (vc / R_TRAM) * T; vC.vat.nhom.rotation.y = -Math.PI / 2 - a; vC.vat.capNhat?.(dt); }
        vB.vat.capNhat?.(dt);
        if (nhomSK.visible) {
          for (const e of dsSK) {
            const gan = Math.max(0, 1 - Math.abs(T - e.t) / 0.45);
            e.cham.scale.setScalar(0.55 + 1.3 * gan);
            e.cham.material.opacity = T >= e.t ? 1 : 0.45;
            if ((Tcu < e.t) !== (T < e.t)) e.tuoi = 0;
            e.tuoi += dtm;
            const f = Math.min(1, e.tuoi / 0.9);
            e.chop.visible = e.vong.line.visible = f < 1;
            if (f < 1) {
              e.chop.scale.setScalar(0.6 + 2.2 * f);
              e.chop.material.opacity = (1 - f) * (1 - f);
              const r = 0.2 + 1.3 * f;
              for (let i = 0; i <= 64; i++) { const a = (i / 64) * 2 * Math.PI; e.vong.dat(i, e.x + r * Math.cos(a), e.t, e.y + r * Math.sin(a)); }
              e.vong.xong(65);
              e.vong.datDoMo(1 - f);
            }
          }
        }
        // Âm thanh: «tích» mỗi khi tấm «bây giờ» đi qua một vạch giây; chuông khi nó đi qua một sự kiện;
        // nốt mềm mỗi khi trạm quay đi hết một vòng. Bước nhảy lớn (quay về 0) thì im.
        const dT = T - Tcu;
        if (dT !== 0 && Math.abs(dT) < 0.6) {
          const lo = Math.min(T, Tcu), hi = Math.max(T, Tcu);
          const k = Math.floor(hi + 1e-9);
          if (k >= 1 && k > lo + 1e-9) am.tich({ tanSo: k % 2 ? 1050 : 1400, doTo: k % 2 ? 0.28 : 0.38, dai: 0.045 });
          if (nhomSK.visible) for (const e of dsSK) if (e.t > lo && e.t <= hi) am.not({ tanSo: e.f, dang: 'chuong', doTo: 0.32, dai: 1.2, lech: kep(e.x / NUA, -0.8, 0.8) });
          if (vL.nhom.visible && vL.tu > lo && vL.tu <= hi) am.not({ tanSo: 1318.5, dang: 'kinh', doTo: 0.22, dai: 0.8 });
          if (vC.nhom.visible) {
            const w = vc / R_TRAM, vongCu = Math.floor((w * Tcu) / (2 * Math.PI)), vongMoi = Math.floor((w * T) / (2 * Math.PI));
            if (vongCu !== vongMoi) am.not({ tanSo: 440, dang: 'mem', doTo: 0.3, dai: 0.9, lech: 0.4 });
          }
        }
      } else {
        if (S.mucNenDich != null) {
          const d = S.mucNenDich - S.mucNen;
          const nhay = d * (1 - Math.exp(-dt * 1.3)) + Math.sign(d) * dt * 0.04;
          if (Math.abs(nhay) >= Math.abs(d) || Math.abs(d) < 5e-4) { S.mucNen = S.mucNenDich; S.mucNenDich = null; } else S.mucNen += nhay;
          dkNen.dat(S.mucNen);
        }
        choVong -= dt;
        thongTin = veHMT(dt > 0 && dt < 0.2);
        S.jd += (dt * TROI_HMT * 365.25) / thongTin.s;
        for (const p of dsHT) if (p.nhom.visible) p.vat.capNhat(dt);
      }
      gioTram += dt;
    }

    function hud() {
      if (S.che === 'cb') {
        const d = [[chuCanh("canh.bay-gio", "Bây giờ"), chuCanh("canh.t-giay-1b1794", "t = {0} giây{1}", [so(Math.min(S.T, T_MAX), 1), S.chay ? '' : chuCanh("canh.dang-dung-bat-bay-gio-tu-chay-de", " · đang dừng (bật «Bây giờ» tự chạy để chạy tiếp)")])]];
        if (S.hien.B) d.push([chuCanh("canh.con-tau", "Con tàu"), chuCanh("canh.c-km-s-nghieng-so-voi-truc-thoi", "{0} c = {1} km/s · nghiêng {2}° so với trục thời gian", [so(S.vB, 2), so(S.vB * 299792.458, 0), so(gocNghiengDo(S.vB), 1)])]);
        if (S.hien.C) d.push([chuCanh("canh.tram-quay", "Trạm quay"), chuCanh("canh.c-buoc-lo-xo-giay-anh-sang-ban", "{0} c · bước lò xo {1} giây ánh sáng, bán kính {2}", [so(S.vC, 2), so(buocLoXo(R_TRAM, S.vC), 1), so(R_TRAM, 1)])]);
        if (S.hien.L) d.push([chuCanh("canh.tia-sang", "Tia sáng"), chuCanh("canh.1-c-nghieng-dung-45", "1 c · nghiêng đúng 45°{0}", [S.T > 1 ? chuCanh("canh.da-cach-nha-giay-anh-sang", " · đã cách nhà {0} giây ánh sáng", [so(Math.min(S.T, T_MAX) - 1, 2)]) : ''])]);
        return d;
      }
      const { nen, s, namQua } = thongTin;
      return [
        [chuCanh("canh.hom-nay-e6747a", "Hôm nay"), ngayThang(S.jd)],
        [chuCanh("canh.truc-thoi-gian", "Trục thời gian"), nen < 1.5 ? chuCanh("canh.dung-ti-le-that-1-nam-dai-63", "đúng tỉ lệ thật (1 năm dài 63 241 AU)") : chuCanh("canh.nen-lan", "nén {0} lần", [soNghia(nen, 2)])],
        [chuCanh("canh.khung-hinh-lui-ve-qua-khu", "Khung hình lùi về quá khứ"), doiThoiGian(namQua)],
        [chuCanh("canh.moi-giay-troi-qua", "Mỗi giây trôi qua"), doiThoiGian(TROI_HMT / s)],
        [chuCanh("canh.tia-nang", "Tia nắng"), chuCanh("canh.hop-voi-mat-hom-nay-tan-1", "hợp với mặt «hôm nay» {0}° (tan = 1/{1})", [nen > 50 ? soNghia(gocTiaNangDo(nen), 2) : so(gocTiaNangDo(nen), 2), soNghia(nen, 3)])],
        [chuCanh("canh.nguoi-quan-sat", "Người quan sát"), S.u === 0 ? chuCanh("canh.dung-yen-so-voi-mat-troi", "đứng yên so với Mặt Trời") : chuCanh("canh.bay-km-s-v-c", "bay {0} km/s (v/c = {1})", [so(S.u, 1), soNghia(S.u / 299792.458, 2)])],
      ];
    }

    return {
      scene, capNhat, hud, cauHinh, goc,
      datVB: (v) => datVB(v), datVC: (v) => datVC(v),
      datU: (v) => { S.u = v; dkU.dat(v); },
      nhaNen: (dich) => { S.mucNenDich = dich; },
      trangThai: () => ({ T: Math.min(S.T, T_MAX), chay: S.chay, vB: S.vB, vC: S.vC, che: S.che, phamVi: S.phamVi, nen: Math.pow(nenToiDa(S.phamVi), S.mucNen) }),
      huy() { den.huy(); },
    };
  },
};

// =====================================================================
// Đồ vật riêng của bài (dựng bằng mã, vật liệu có ánh sáng)
// =====================================================================

// Ngôi nhà nhỏ: tường vữa, mái ngói, ống khói, cửa gỗ, cửa sổ sáng đèn, đèn cửa. Gốc ở giữa đế, cao khoảng 0,9.
function taoNha() {
  const nhom = new THREE.Group();
  const g = new THREE.Group();
  g.scale.setScalar(1.45);
  g.rotation.y = 0.55;
  nhom.add(g);
  const W = 0.62, D = 0.48, H = 0.32;
  const vlTuong = vlSon(0xe9dfcc, 0.75), vlMai = vlSon(0xa04a30, 0.5), vlGo = vlSon(0x5d3b24, 0.6);
  const vlKhung = vlSon(0xf4f1ea, 0.45), vlDa = vlSon(0x6f6a64, 0.85);
  const de = new THREE.Mesh(hopBo(W + 0.12, 0.035, D + 0.12, 0.01), vlDa);
  de.position.y = 0.0175;
  const than = new THREE.Mesh(hopBo(W, H, D, 0.012), vlTuong);
  than.position.y = 0.035 + H / 2;
  // mái: lăng trụ tam giác, chìa ra hai đầu hồi
  const hinh = new THREE.Shape();
  hinh.moveTo(-W / 2 - 0.07, 0); hinh.lineTo(W / 2 + 0.07, 0); hinh.lineTo(0, 0.25); hinh.closePath();
  const geoMai = new THREE.ExtrudeGeometry(hinh, { depth: D + 0.1, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1 });
  geoMai.translate(0, 0.035 + H, -(D + 0.1) / 2);
  const mai = new THREE.Mesh(geoMai, vlMai);
  // vạch ngói chạy dọc mái
  const ngoi = [];
  for (let i = 1; i < 6; i++) {
    const f = i / 6;
    for (const s of [-1, 1]) {
      const x = s * (W / 2 + 0.07) * (1 - f), y = 0.035 + H + 0.25 * f + 0.014;
      ngoi.push(dat(new THREE.BoxGeometry(0.012, 0.012, D + 0.11), { x, y }));
    }
  }
  const vachNgoi = new THREE.Mesh(ghep(ngoi), vlSon(0x7a3522, 0.6));
  const khoi = new THREE.Mesh(hopBo(0.075, 0.17, 0.075, 0.008), vlSon(0x8d8379, 0.85));
  khoi.position.set(0.15, 0.035 + H + 0.2, -0.08);
  const cua = new THREE.Mesh(hopBo(0.12, 0.2, 0.025, 0.006), vlGo);
  cua.position.set(-0.13, 0.035 + 0.1, D / 2 + 0.005);
  const nam = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), vlKimLoai(0xd9b45a, 0.3));
  nam.position.set(-0.09, 0.035 + 0.1, D / 2 + 0.02);
  g.add(de, than, mai, vachNgoi, khoi, cua, nam);
  // cửa sổ sáng đèn: một ở mặt trước, hai ở hông
  const vlSo = vlSang(0xffbe6a, 2.6);
  const cuaSo = (x, z, quay) => {
    const o = new THREE.Group();
    o.position.set(x, 0.035 + 0.19, z);
    o.rotation.y = quay;
    const kinh = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.09), vlSo);
    const k = [
      dat(new THREE.BoxGeometry(0.13, 0.014, 0.012), { y: 0.052 }), dat(new THREE.BoxGeometry(0.13, 0.014, 0.012), { y: -0.052 }),
      dat(new THREE.BoxGeometry(0.014, 0.1, 0.012), { x: 0.062 }), dat(new THREE.BoxGeometry(0.014, 0.1, 0.012), { x: -0.062 }),
      dat(new THREE.BoxGeometry(0.008, 0.09, 0.008)), dat(new THREE.BoxGeometry(0.11, 0.008, 0.008)),
    ];
    o.add(kinh, new THREE.Mesh(ghep(k), vlKhung));
    g.add(o);
  };
  cuaSo(0.12, D / 2 + 0.004, 0);
  cuaSo(W / 2 + 0.004, 0.11, Math.PI / 2);
  cuaSo(W / 2 + 0.004, -0.11, Math.PI / 2);
  // đèn cửa: quầng ấm nhỏ
  const denCua = domSang(0xffc27a, 0.22, 2.2);
  denCua.position.set(-0.13, 0.035 + 0.25, D / 2 + 0.05);
  g.add(denCua);
  return { nhom };
}

// Con tàu: tên lửa của thư viện đồ vật, nằm ngang, mũi hướng +x (hướng bay). Không bật động cơ: tàu đi đều.
function taoTau() {
  const nhom = new THREE.Group();
  const tl = taoTenLua({ cao: 4.2, banKinh: 0.42, luc: 0 });
  const k = 0.25;
  tl.nhom.scale.setScalar(k);
  tl.nhom.rotation.z = -Math.PI / 2;
  tl.nhom.position.set(-(4.58 * k) / 2, 0.24, 0);
  nhom.add(tl.nhom);
  return { nhom, capNhat: (dt) => tl.capNhat?.(dt) };
}

// Trạm quay: vệ tinh của thư viện đồ vật, nổi trên tấm «bây giờ».
function taoTram() {
  const nhom = new THREE.Group();
  const vt = taoVeTinh({ co: 0.34 });
  vt.nhom.position.y = 0.28;
  nhom.add(vt.nhom);
  return { nhom, capNhat: (dt) => vt.capNhat?.(dt) };
}

// Đầu tia sáng: chấm vàng rực có lõi trắng.
function taoPhoton() {
  const nhom = new THREE.Group();
  const ngoai = domSang(MAU_KTG.anhSang, 0.75, 3.5);
  const loi = domSang(0xffffff, 0.22, 4);
  nhom.add(ngoai, loi);
  return { nhom };
}

// =====================================================================
// Ống sáng: đường thế giới dựng thành ống tròn phát sáng thay cho nét mảnh. Bộ nhớ cấp sẵn, cập nhật tại chỗ.
// Phần cao hơn mức uNay (trục Y của cảnh, tức thời gian) là tương lai: mờ hẳn đi (hệ số moTuongLai).
// =====================================================================
const _T = new THREE.Vector3(), _N = new THREE.Vector3(), _B = new THREE.Vector3(), _R = new THREE.Vector3();
class OngSang {
  constructor(toiDa, { mau = 0xffffff, banKinh = 0.05, sang = 2.2, canh = 10, moTuongLai = 0.13 } = {}) {
    this.toiDa = Math.max(2, toiDa);
    this.canh = canh;
    this.r = banKinh;
    this.diem = new Float32Array(this.toiDa * 3);
    const nv = this.toiDa * canh;
    this.pos = new Float32Array(nv * 3);
    this.phap = new Float32Array(nv * 3);
    this.cos = Float32Array.from({ length: canh }, (_, j) => Math.cos((j / canh) * 2 * Math.PI));
    this.sin = Float32Array.from({ length: canh }, (_, j) => Math.sin((j / canh) * 2 * Math.PI));
    const geo = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.aPhap = new THREE.BufferAttribute(this.phap, 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.aPos);
    geo.setAttribute('normal', this.aPhap);
    const chiSo = new (nv > 65535 ? Uint32Array : Uint16Array)((this.toiDa - 1) * canh * 6);
    let m = 0;
    for (let i = 0; i < this.toiDa - 1; i++) {
      for (let j = 0; j < canh; j++) {
        const a = i * canh + j, b = i * canh + ((j + 1) % canh), c = a + canh, d = b + canh;
        chiSo[m++] = a; chiSo[m++] = c; chiSo[m++] = b; chiSo[m++] = b; chiSo[m++] = c; chiSo[m++] = d;
      }
    }
    geo.setIndex(new THREE.BufferAttribute(chiSo, 1));
    geo.setDrawRange(0, 0);
    this.geo = geo;
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uMau: { value: new THREE.Color(mau).multiplyScalar(sang) }, uNay: { value: 1e9 }, uMo: { value: moTuongLai },
        uGio: { value: 0 }, uDoMo: { value: 1 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vY = w.y;
          vec4 mv = viewMatrix * w;
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uMau; uniform float uNay, uMo, uGio, uDoMo;
        varying vec3 vN; varying vec3 vV; varying float vY;
        void main() {
          float thang = abs(dot(normalize(vN), normalize(vV)));     // 1 ở giữa ống, 0 ở mép
          float loi = pow(thang, 2.4);
          float tl = smoothstep(uNay - 0.015, uNay + 0.05, vY);       // 1: tương lai
          float song = 0.93 + 0.07 * sin(vY * 5.0 - uGio * 2.2);      // gợn rất nhẹ chạy dọc ống
          float dut = 0.3 + 0.7 * smoothstep(0.35, 0.5, abs(fract(vY * 2.2) - 0.5) * 2.0);   // tương lai: đứt khúc
          vec3 c = uMau * (0.22 + 1.15 * loi) * mix(1.0, uMo * dut, tl) * mix(song, 1.0, tl) * uDoMo;
          gl_FragColor = vec4(c, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.mat.tuyenTinh = true;
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.onBeforeRender = () => { this.mat.uniforms.uGio.value = performance.now() * 0.001; };
    this.n = 0;
  }
  dat(i, x, y, z) { const k = i * 3; this.diem[k] = x; this.diem[k + 1] = y; this.diem[k + 2] = z; }
  xong(n) {
    n = Math.min(n, this.toiDa);
    this.n = n;
    if (n < 2) { this.geo.setDrawRange(0, 0); return; }
    const d = this.diem, P = this.pos, Q = this.phap, C = this.cos, Sn = this.sin, r = this.r, M = this.canh;
    let coN = false;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1) * 3, b = Math.min(n - 1, i + 1) * 3;
      _T.set(d[b] - d[a], d[b + 1] - d[a + 1], d[b + 2] - d[a + 2]);
      if (_T.lengthSq() < 1e-14) _T.set(0, 1, 0);
      _T.normalize();
      // Khung vận chuyển song song: pháp tuyến đi theo ống, không xoắn.
      if (coN) _N.addScaledVector(_T, -_N.dot(_T));
      if (!coN || _N.lengthSq() < 1e-8) {
        _R.set(Math.abs(_T.y) < 0.9 ? 0 : 1, Math.abs(_T.y) < 0.9 ? 1 : 0, 0);
        _N.copy(_R).addScaledVector(_T, -_R.dot(_T));
        coN = true;
      }
      _N.normalize();
      _B.crossVectors(_T, _N);
      const x = d[i * 3], y = d[i * 3 + 1], z = d[i * 3 + 2];
      for (let j = 0; j < M; j++) {
        const nx = C[j] * _N.x + Sn[j] * _B.x, ny = C[j] * _N.y + Sn[j] * _B.y, nz = C[j] * _N.z + Sn[j] * _B.z;
        const k = (i * M + j) * 3;
        P[k] = x + r * nx; P[k + 1] = y + r * ny; P[k + 2] = z + r * nz;
        Q[k] = nx; Q[k + 1] = ny; Q[k + 2] = nz;
      }
    }
    this.aPos.needsUpdate = true;
    this.aPhap.needsUpdate = true;
    this.geo.setDrawRange(0, (n - 1) * M * 6);
  }
}
