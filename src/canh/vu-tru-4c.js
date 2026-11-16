import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài — Không-thời gian của cả vũ trụ.
// Sơ đồ không-thời gian của vũ trụ giãn nở phẳng (Planck 2018): hai chiều không gian quanh ta nằm ngang, thời gian hướng lên.
// Ta (Ngân Hà) ở trên trục giữa. Các mặt tròn xoay: nón ánh sáng quá khứ của ta, mặt cầu Hubble, chân trời hạt, chân trời sự kiện.
// Ba hệ trục, nội suy mượt bằng một tham số s:
//   s = 0  khoảng cách thật D = a·χ        × thời gian vũ trụ t
//   s = 1  khoảng cách đồng chuyển χ        × thời gian vũ trụ t
//   s = 2  khoảng cách đồng chuyển χ        × thời gian bảo giác η   (ánh sáng nghiêng 45°)
// Mọi số liệu tính bằng src/vat-ly/chan-troi-vu-tru.js. Đơn vị: tỉ năm (Gyr), tỉ năm ánh sáng (Gly), c = 1.
// Bỏ một phần tư các mặt tròn xoay (phía máy quay) để thấy mặt cắt bên trong.
// Bản 3: các mặt là mặt kính vẽ bằng shader (viền sáng theo góc nhìn, vĩ tuyến mỗi tỉ năm, vòng sáng chạy trên nón ánh sáng),
// đường thế giới là ống sáng, thiên hà có hình, Vụ Nổ Lớn rực sáng, mặt tán xạ cuối lốm đốm như bản đồ bức xạ nền;
// kéo «bây giờ» dọc trục thời gian (nón quá khứ, nón tương lai, các con số tính lại cho thời điểm ấy), kéo thiên hà
// dọc tấm «bây giờ»; âm kéo dài 660/(1 + z) Hz khi kéo, nốt báo khi vượt mặt cầu Hubble và chân trời sự kiện; bốn thử thách.
// Tham số kiểm thử riêng (chỉ đọc khi app.imLang): thu=giot | v2 | nua | sk | qua-khu.

import * as THREE from 'three';
import { so } from '../vat-ly/hang-so.js';
import { taoVuTru, Z_BUC_XA_NEN } from '../vat-ly/chan-troi-vu-tru.js';
import { nhinTuLuc, THU_THACH_4C, TIENG_GOC_4C, tanSoTieng4c } from '../vat-ly/chan-troi-luc-bat-ky.js';
import { taoNhan, taoNenSao, taoDom, taoNgauNhien, DuongDay, duongDayTinh, kep, lamMuot, goNhanDeNhau } from '../khung/ve.js';
import { MAU_KTG } from '../khung/ktg.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('vu-tru-4c', khoa, goc, thamSo);

const R = String.raw;

const KX = 0.15;            // đơn vị hiển thị cho mỗi tỉ năm ánh sáng
const KT = 0.28;            // đơn vị hiển thị cho mỗi tỉ năm thời gian vũ trụ (hệ trục 1 và 2)
const KE = 0.15;            // đơn vị hiển thị cho mỗi tỉ năm thời gian bảo giác (hệ trục 3: bằng KX nên ánh sáng 45°)
const D_MAX = 60;           // cắt ở 60 tỉ năm ánh sáng
const T_SAU = 25;           // vẽ tới 25 tỉ năm sau hôm nay
const N_PHI = 54;           // số lát quanh trục (trên 3/4 vòng)
const PHI0 = Math.PI / 2, PHI1 = 2 * Math.PI;   // phần tư φ ∈ [0, π/2] bị cắt bỏ
const CHI_TH = [5, 10, 15, 20, 30, 40];
const MAU_HUBBLE = 0x7fcaff, MAU_HAT = 0xb48cff, MAU_SK = MAU_KTG.do, MAU_NON = MAU_KTG.anhSang, MAU_TH = MAU_KTG.hong;

const TEN_HE = [chuCanh("canh.khoang-cach-that-thoi-gian-vu-tru", "Khoảng cách thật × thời gian vũ trụ"), chuCanh("canh.khoang-cach-dong-chuyen-thoi-gian-vu-tru", "Khoảng cách đồng chuyển × thời gian vũ trụ"), chuCanh("canh.khoang-cach-dong-chuyen-thoi-gian-bao-giac", "Khoảng cách đồng chuyển × thời gian bảo giác")];

export default {
  id: 'vu-tru-4c',
  ten: 'Không-thời gian của cả vũ trụ',
  moTa: 'Nón ánh sáng hình giọt nước, mặt cầu Hubble, chân trời hạt và chân trời sự kiện',
  yChinh: 'Mọi thứ ta thấy nằm trên nón ánh sáng quá khứ của ta; vẽ bằng khoảng cách thật, nón có hình giọt nước rộng nhất 5,85 tỉ năm ánh sáng. Mép vũ trụ quan sát được (chân trời hạt) nay cách 46 tỉ năm ánh sáng, còn tín hiệu ta gửi hôm nay chỉ tới được các thiên hà gần hơn 16,7 tỉ năm ánh sáng (chân trời sự kiện). Đổi sang khoảng cách đồng chuyển và thời gian bảo giác, nón ánh sáng thẳng lại 45° như trong không-thời gian phẳng.',
  mayAnh: { viTri: [18, 10.8, 18], dich: [0, 4.6, 0], fov: 40, min: 2, max: 90, gan: 0.02, xa: 2000 },
  hinh: { quang: 0.4, nguong: 0.95 },

  baiGiang: {
    mucTieu: [
      'Đọc được sơ đồ không-thời gian của cả vũ trụ: trục thời gian vũ trụ, lát «vũ trụ lúc ấy», đường thế giới của thiên hà.',
      'Giải thích được vì sao nón ánh sáng quá khứ có hình giọt nước và vì sao ta vẫn thấy thiên hà lùi nhanh hơn ánh sáng.',
      'Phân biệt được mặt cầu Hubble, chân trời hạt và chân trời sự kiện, và nêu được con số của từng thứ hôm nay.',
      'Đổi được giữa khoảng cách thật, khoảng cách đồng chuyển và thời gian bảo giác, và thấy nón ánh sáng thẳng lại 45°.',
      'Đọc được các con số của bức xạ nền vi sóng: phát lúc nào, lúc đó cách ta bao xa, nay cách bao xa.',
    ],
    buoc: [
      {
        ten: 'Trục thời gian của cả vũ trụ',
        noiDung: R`
          Đây là {{sơ đồ không-thời gian}} của cả vũ trụ quan sát được. Ta (Ngân Hà) ở trên trục giữa; đường thẳng đứng ấy là {{đường thế giới}} của ta và cũng là trục thời gian. Đáy là Vụ Nổ Lớn. **Tấm xanh lục** là hôm nay, lúc vũ trụ 13,8 tỉ năm tuổi. Phía trên là 25 tỉ năm sắp tới.

          Thời gian ở đây là {{thời gian vũ trụ}}: số năm kể từ Vụ Nổ Lớn, đo bằng đồng hồ của một người trôi theo dòng giãn nở. Mọi thiên hà trôi theo dòng giãn nở đều thấy cùng một tuổi vũ trụ khi đo cùng một độ đặc của vũ trụ, nên mỗi **lát ngang** của khối là «vũ trụ lúc ấy», như tấm «bây giờ» ở Bài 4.

          Mặt ngang là khoảng cách tính từ ta. Ở hệ trục đầu tiên đó là {{khoảng cách thật}}: khoảng cách đo bằng thước, đặt nối nhau, ngay tại thời điểm đó.

          > [Thử ngay] Kéo đốm xanh lục trên trục thời gian để dời «bây giờ» lên xuống: tấm «bây giờ» đi theo, ô số liệu ghi tuổi vũ trụ lúc ấy. Mỗi tiếng tích nhỏ khi kéo là một tỉ năm trôi qua.
          > [[Nhìn ngang|ngang]] [[Nhìn chéo|toan]] [[Nhìn từ trên xuống|tren]]

          > [Lưu ý] Hình bỏ bớt một chiều không gian. Các mặt tròn xoay bị cắt bỏ một phần tư để thấy mặt cắt bên trong. Trục thời gian giãn gấp 1,87 lần trục khoảng cách cho dễ nhìn (0,28 so với 0,15 đơn vị hình cho mỗi tỉ năm), nên ở hệ trục này ánh sáng không nghiêng 45°. Mọi thứ xa hơn 60 tỉ năm ánh sáng bị cắt.`,
        vao: (c) => c.cauHinh({ aN: 1, s: 0, hien: { th: true, homNay: true }, mayAnh: 'toan', nhan: { vach: true, th: true, vuNo: true, kc: true }, hud: ['tuoi', 'he'] }),
        ra: (c) => c.im(),
        nut: { ngang: (c) => c.goc('ngang'), toan: (c) => c.goc('toan'), tren: (c) => c.goc('tren') },
      },
      {
        ten: 'Đường thế giới của các thiên hà',
        noiDung: R`
          Các đường trắng là đường thế giới của những thiên hà trôi theo dòng giãn nở, theo tám hướng quanh ta. Chúng bắt đầu cùng một chỗ ở Vụ Nổ Lớn rồi tản ra như một chùm pháo hoa. Không phải thiên hà bay đi trong không gian: chính không gian giữa chúng giãn ra.

          Mỗi thiên hà có một {{khoảng cách đồng chuyển}} $\chi$ không đổi (bằng khoảng cách thật của nó hôm nay). Khoảng cách thật lúc thời gian vũ trụ là $t$:

          $$ D(t) = a(t)\,\chi $$

          với $a(t)$ là {{hệ số tỉ lệ}} lấy từ phương trình Friedmann của Bài 18 (hôm nay $a = 1$). Thay số: lúc vũ trụ 4 tỉ năm tuổi $a \approx 0{,}38$, nên thiên hà nay cách 10 tỉ năm ánh sáng khi ấy chỉ cách 3,8 tỉ năm ánh sáng. Sau 25 tỉ năm nữa $a \approx 4{,}4$: nó sẽ cách 44 tỉ năm ánh sáng.

          Nhìn kỹ một đường: lúc đầu nó cong theo kiểu chậm dần (vật chất hãm giãn nở), rồi từ khi vũ trụ khoảng 7,7 tỉ năm tuổi thì cong theo kiểu nhanh dần ({{năng lượng tối}} thắng thế).

          > [Thử ngay] Kéo «bây giờ» xuống lúc vũ trụ khoảng 4 tỉ năm tuổi: các thiên hà trên tấm «bây giờ» nằm sát nhau hơn, mỗi khoảng cách chỉ còn chừng 0,38 lần hôm nay, đúng $D = a\chi$.
          > [[Chỉ để lại thiên hà|chi]] [[Hiện lại mọi mặt|mat]]

          +++ Đi sâu: định luật Hubble suy ra từ D = aχ
          Lấy đạo hàm theo $t$ với $\chi$ không đổi: tốc độ lùi $v = \dot a\,\chi = (\dot a/a)\,D = H(t)\,D$. Đó là định luật Hubble, đúng ở mọi thời điểm với $H(t)$ của thời điểm ấy. Hôm nay $H_0 = 67{,}4$ km/s/Mpc, tức cứ mỗi tỉ năm ánh sáng thì lùi thêm $1/14{,}51$ lần tốc độ ánh sáng.

          Giãn nở chuyển từ chậm dần sang nhanh dần khi $\ddot a = 0$, tức $\Omega_m/a^3 = 2\Omega_\Lambda$: $a = (0{,}315/1{,}37)^{1/3} \approx 0{,}61$, ứng với $z \approx 0{,}63$ và tuổi vũ trụ 7,7 tỉ năm.
          +++`,
        vao: (c) => c.cauHinh({ aN: 1, s: 0, hien: { th: true, homNay: true }, mayAnh: 'toan', nhan: { vach: true, th: true, vuNo: true, kc: true }, hud: ['tuoi', 'he'] }),
        ra: (c) => c.im(),
        nut: { chi: (c) => c.cauHinh({ hien: { th: true, homNay: true } }), mat: (c) => c.cauHinh({ hien: { th: true, homNay: true, non: true, hubble: true, hat: true, sk: true } }) },
      },
      {
        ten: 'Nón ánh sáng quá khứ hình giọt nước',
        noiDung: R`
          Mặt vàng là {{nón ánh sáng}} quá khứ của ta hôm nay: tập hợp mọi sự kiện mà ánh sáng của chúng đang tới mắt ta đúng lúc này. **Mọi thứ ta thấy trên bầu trời đều nằm trên mặt này.** Ở Bài 5, nón quá khứ là một nón thẳng. Ở đây, vẽ bằng khoảng cách thật, nó phình ra rồi khép lại thành hình **giọt nước**, rộng nhất 5,85 tỉ năm ánh sáng, ở dịch chuyển đỏ $z \approx 1{,}6$, khi vũ trụ 4,1 tỉ năm tuổi.

          Vì sao? Ánh sáng luôn chạy với tốc độ $c$ so với không gian ngay tại chỗ nó đi qua, nhưng không gian ấy đang lùi xa ta. Khoảng cách thật từ tia sáng tới ta đổi theo

          $$ \frac{\dd D}{\dd t} = H\,D - c $$

          Khi $H D \gt c$, tia sáng tuy hướng về ta mà vẫn bị cuốn ra xa. Chỉ khi giãn nở chậm bớt và $H D$ xuống dưới $c$, tia mới tiến lại gần được.

          > [Thử ngay] Chọn thiên hà $z = 3$: ánh sáng rời nó khi nó cách ta 5,3 tỉ năm ánh sáng, lúc đầu bị đẩy ra tới 5,85 tỉ năm ánh sáng rồi mới quay về, mất 11,7 tỉ năm. Kéo đốm hồng (thiên hà được chọn) dọc tấm «hôm nay»: tia vàng và đốm sáng chạy trên nó cho biết ánh sáng ta nhận hôm nay rời thiên hà lúc nào, ở đâu.
          > [[Phóng to giọt nước|giot]] [[Thiên hà z = 3|z3]] [[Thiên hà z = 1|z1]]

          +++ Đi sâu: từ dχ = −c dt/a tới hình giọt nước
          Ánh sáng đi về phía ta: mỗi khoảng $\dd t$ nó vượt một đoạn thật $c\,\dd t$, tức đoạn đồng chuyển $c\,\dd t/a$. Lấy tích phân từ lúc phát tới hôm nay: $\chi = \int c\,\dd t/a = \eta_0 - \eta(t)$, với $\eta$ là thời gian bảo giác (bước 7). Khoảng cách thật lúc phát là $D = a\,(\eta_0 - \eta)$.

          Khi $a \to 0$ thì $D \to 0$; khi $a = 1$ thì $\eta = \eta_0$ và $D = 0$. Giữa hai đầu $D$ phải đạt cực đại, đúng ở nơi $\dd D/\dd t = 0$, tức $H D = c$: đỉnh giọt nước nằm trên mặt cầu Hubble của bước sau.
          +++`,
        vao: (c) => c.cauHinh({ aN: 1, s: 0, z: 3, hien: { th: true, homNay: true, non: true, chon: true }, mayAnh: 'giot', nhan: { chinh: 'non' }, hud: ['z', 'phat', 'dPhat', 'dNay'] }),
        ra: (c) => c.im(),
        nut: { giot: (c) => c.goc('giot'), z3: (c) => c.datZ(3), z1: (c) => c.datZ(1) },
        thuThach: {
          de: 'Kéo thiên hà tới chỗ mà ánh sáng ta nhận hôm nay rời nó đúng lúc nó ở **xa ta nhất**, ở đỉnh giọt nước: khoảng cách lúc phát từ 5,82 tỉ năm ánh sáng trở lên.',
          kiem: (c) => { const s = c.trangThai(); return s.homNay && s.g.thay && s.g.dPhat >= THU_THACH_4C.giot.dPhat; },
          goiY: 'Đỉnh giọt nước ở $z \\approx 1{,}6$: thiên hà nay cách khoảng 15 tỉ năm ánh sáng. Đọc dòng «lúc phát cách» trên thẻ thiên hà.',
        },
      },
      {
        ten: 'Mặt cầu Hubble: nơi lùi đúng bằng c',
        noiDung: R`
          Mặt xanh lam là {{mặt cầu Hubble}}: những nơi mà tốc độ lùi $v = H D$ đúng bằng $c$. Bán kính thật của nó là $c/H(t)$; hôm nay

          $$ \frac{c}{H_0} = \frac{977{,}8}{67{,}4} \approx 14{,}51\ \text{tỉ năm ánh sáng} $$

          Thiên hà ở ngoài mặt cầu này lùi **nhanh hơn ánh sáng**. Điều đó không trái thuyết tương đối hẹp: thuyết tương đối hẹp chỉ cấm vượt ánh sáng **tại chỗ**, so với một tia sáng chạy ngang qua cùng nơi. Tốc độ lùi là tốc độ khoảng cách giãn ra, cộng dồn qua cả một vùng không gian rộng, không phải tốc độ của vật so với không gian quanh nó.

          Và ta vẫn thấy được rất nhiều thiên hà như thế. Thiên hà có $z \gt 1{,}48$ hôm nay đều lùi nhanh hơn $c$. Thiên hà $z = 3$ lúc phát lùi $1{,}67\,c$, nay lùi $1{,}46\,c$, mà ánh sáng của nó đang tới ta.

          > [Hiểu sai thường gặp] «Thiên hà lùi nhanh hơn ánh sáng thì không bao giờ thấy được; mặt cầu Hubble là mép của vũ trụ quan sát được.» Sai. Davis và Lineweaver (2004) chỉ ra đây là một trong những nhầm lẫn phổ biến nhất, kể cả trong sách giáo khoa. Mép thật là chân trời hạt (bước sau).

          > [Thử ngay] Kéo thiên hà qua lại mép mặt cầu Hubble trên tấm «hôm nay»: một nốt nhỏ vang lên mỗi lần nó vượt qua.
          > [[Thiên hà z = 3|z3]] [[Thiên hà z = 1,48|z148]] [[Thiên hà z = 0,5|z05]]`,
        vao: (c) => c.cauHinh({ aN: 1, s: 0, z: 3, hien: { th: true, homNay: true, non: true, hubble: true, chon: true }, mayAnh: 'gan', nhan: { chinh: 'hubble' }, hud: ['hubble', 'z', 'dNay', 'vNay'] }),
        ra: (c) => c.im(),
        nut: { z3: (c) => c.datZ(3), z148: (c) => c.datZ(1.48), z05: (c) => c.datZ(0.5) },
        thuThach: {
          de: 'Kéo thiên hà tới chỗ mà lúc phát ra ánh sáng ta nhận hôm nay, nó đang lùi nhanh **gấp đôi ánh sáng** ($2\\,c$, sai lệch dưới $0{,}08\\,c$). Ánh sáng ấy vẫn tới được ta.',
          kiem: (c) => { const s = c.trangThai(); return s.homNay && s.g.thay && Math.abs(s.g.vPhat - THU_THACH_4C.v2.v) < THU_THACH_4C.v2.sai; },
          goiY: 'Thiên hà $z = 3$ lúc phát lùi $1{,}67\\,c$; cần xa hơn một chút: khoảng $z \\approx 3{,}8$, nay cách chừng 23 tỉ năm ánh sáng.',
        },
      },
      {
        ten: 'Chân trời hạt: mép vũ trụ quan sát được',
        noiDung: R`
          Mặt tím nhạt là {{chân trời hạt}}: chỗ xa nhất mà ánh sáng phát từ thuở Vụ Nổ Lớn kịp tới ta tính tới lúc đó. Hôm nay nó cách ta

          $$ \chi_{\text{hạt}} = \int_0^{t_0}\frac{c\,\dd t}{a(t)} \approx 46{,}1\ \text{tỉ năm ánh sáng} $$

          dù vũ trụ mới 13,8 tỉ năm tuổi. Không có gì mâu thuẫn: trong lúc ánh sáng đi, quãng đường nó đã đi qua phía sau cứ thế giãn ra. Mép này nay lùi khoảng $3{,}2\,c$.

          Chân trời hạt lớn dần theo thời gian: mỗi năm trôi qua, ánh sáng từ những vùng xa hơn kịp tới. Bức xạ nền vi sóng phát từ một mặt cầu nay cách 45,2 tỉ năm ánh sáng, chỉ hơi bên trong chân trời hạt; phần còn lại là ánh sáng của 371 000 năm đầu, khi vũ trụ còn đục, không nhìn xuyên qua được.

          > [Thử ngay] Kéo «bây giờ» về quá khứ: chân trời hạt lúc ấy gần hơn, vì ánh sáng chưa kịp đi xa; thiên hà ở ngoài nó thì «chưa thấy được».
          > [[Phóng ra toàn cảnh|toan]] [[Thiên hà z = 11|z11]] [[Bức xạ nền z = 1090|z1090]]

          +++ Đi sâu: so với Davis và Lineweaver 2004
          Với mô hình của họ ($H_0 = 70$; $\Omega_m = 0{,}3$; $\Omega_\Lambda = 0{,}7$; không tính bức xạ), mã của bài cho tuổi 13,5 tỉ năm, chân trời hạt 46,2 tỉ năm ánh sáng và chân trời sự kiện 15,9 tỉ năm ánh sáng; bài báo nêu chân trời hạt 46 tỉ năm ánh sáng, chân trời sự kiện 16 tỉ năm ánh sáng. Với mô hình Planck 2018 dùng ở đây: tuổi 13,79 tỉ năm, chân trời hạt 46,1 tỉ năm ánh sáng, chân trời sự kiện 16,7 tỉ năm ánh sáng. Hai mô hình khác nhau ở $H_0$ và $\Omega_m$, nên các con số chỉ lệch vài phần trăm.
          +++`,
        vao: (c) => c.cauHinh({ aN: 1, s: 0, z: 11, hien: { th: true, homNay: true, non: true, hubble: true, hat: true, chon: true, cmb: true }, mayAnh: 'toan', nhan: { chinh: 'hat' }, hud: ['hat', 'z', 'phat', 'dNay'] }),
        ra: (c) => c.im(),
        nut: { toan: (c) => c.goc('toan'), z11: (c) => c.datZ(11), z1090: (c) => c.datZ(1090) },
        thuThach: {
          de: 'Kéo «bây giờ» về quá khứ tới lúc mép vũ trụ quan sát được chỉ cách ta **một nửa** hôm nay: chân trời hạt cách 23 tỉ năm ánh sáng (khoảng cách thật, sai lệch dưới 1).',
          kiem: (c) => { const s = c.trangThai(); return !s.homNay && Math.abs(s.dChanTroiHat - THU_THACH_4C.hatNua.d) < THU_THACH_4C.hatNua.sai; },
          goiY: 'Rê chuột lên đốm xanh lục để đọc khoảng cách tới chân trời hạt. Đích nằm quanh lúc vũ trụ 7,6 tỉ năm tuổi.',
        },
      },
      {
        ten: 'Chân trời sự kiện: tín hiệu không bao giờ tới',
        noiDung: R`
          Mặt đỏ cam là {{chân trời sự kiện}} của vũ trụ; mặt vàng mờ hướng lên là nón ánh sáng **tương lai** của ta hôm nay: đường đi của một tín hiệu ta phát ra ngay bây giờ. Vì giãn nở đang nhanh dần, tín hiệu ấy dù chạy mãi cũng chỉ tới được các thiên hà có khoảng cách đồng chuyển nhỏ hơn

          $$ \chi_{\text{sk}} = \int_{t_0}^{\infty}\frac{c\,\dd t}{a(t)} \approx 16{,}7\ \text{tỉ năm ánh sáng} $$

          tức các thiên hà có $z \lt 1{,}87$. Ngược lại, ánh sáng mà những thiên hà ở xa hơn phát **hôm nay** sẽ không bao giờ tới ta. Ta vẫn thấy chúng, nhưng chỉ thấy quá khứ của chúng, và hình ảnh ấy sẽ đỏ dần, mờ dần mãi.

          Chân trời sự kiện khác chân trời hạt: chân trời hạt hỏi «ánh sáng **đã** kịp tới ta chưa», chân trời sự kiện hỏi «ánh sáng **sẽ** có lúc nào tới ta không». Về lâu dài, bán kính thật của chân trời sự kiện tiến tới $c/(H_0\sqrt{\Omega_\Lambda}) \approx 17{,}5$ tỉ năm ánh sáng.

          > [Thử ngay] Ở hệ trục đồng chuyển, đường của tín hiệu tiến sát mãi tới đường thẳng đứng $\chi = 16{,}7$ mà không chạm.
          > [[Thiên hà z = 1,87 (đúng mép)|z187]] [[Thiên hà z = 1|z1]] [[Xem bằng khoảng cách đồng chuyển|he2]] [[Về khoảng cách thật|he1]]

          > [Lưu ý] Âm thanh là quy đổi cho tai nghe được. Khi kéo thiên hà, âm kéo dài có cao độ $660/(1 + z)$ Hz: càng xa, ánh sáng của nó tới ta càng bị kéo dài, âm càng trầm. Vượt ra ngoài chân trời sự kiện thì vang một nốt trầm (từ đó không bao giờ liên lạc được nữa); vào lại bên trong thì vang một nốt sáng.

          > [Lưu ý] Con số 16,7 tùy vào năng lượng tối có giữ nguyên mãi hay không. Mô hình ở đây giả sử nó là hằng số vũ trụ. Số liệu DESI (2024–2025) gợi ý năng lượng tối có thể yếu dần theo thời gian, nhưng chưa đủ chắc để khẳng định.`,
        vao: (c) => c.cauHinh({ aN: 1, s: 0, z: 1.87, hien: { th: true, homNay: true, non: true, nonTL: true, sk: true, hat: true, chon: true }, mayAnh: 'toan', nhan: { chinh: 'sk' }, hud: ['sk', 'z', 'dNay', 'lienLac'] }),
        ra: (c) => c.im(),
        nut: { z187: (c) => c.datZ(1.87), z1: (c) => c.datZ(1), he2: (c) => c.datHe(1), he1: (c) => c.datHe(0) },
        thuThach: {
          de: 'Kéo thiên hà ra **vừa ngoài** chân trời sự kiện: hôm nay ta vẫn thấy nó, nhưng ánh sáng nó phát hôm nay sẽ không bao giờ tới ta. Đích: khoảng cách đồng chuyển lớn hơn mép từ 0,2 tới 1,3 tỉ năm ánh sáng.',
          kiem: (c) => { const s = c.trangThai(); const d = s.chi - s.chanTroiSuKien; return s.homNay && d > THU_THACH_4C.sk.tren && d < THU_THACH_4C.sk.duoi; },
          goiY: 'Mép ở 16,7 tỉ năm ánh sáng ($z \\approx 1{,}87$). Kéo ra tới khi nghe nốt trầm và thẻ thiên hà ghi «Ngoài chân trời sự kiện», rồi dừng trước 18 tỉ năm ánh sáng ($z \\approx 2{,}1$).',
        },
      },
      {
        ten: 'Đổi hệ trục: nón ánh sáng thẳng lại',
        noiDung: R`
          Bấm lần lượt ba hệ trục. Hình biến đổi mượt từ cái này sang cái kia; không sự kiện nào mất đi.

          1. **Khoảng cách thật × thời gian vũ trụ**: hình như đã thấy.
          2. **Khoảng cách đồng chuyển × thời gian vũ trụ**: chia mọi khoảng cách cho $a(t)$. Đường thế giới của thiên hà thành **đường thẳng đứng**; giọt nước mở thành một cái phễu.
          3. **Khoảng cách đồng chuyển × thời gian bảo giác**: đổi thêm trục thời gian sang $\eta$ với $c\,\dd\eta = c\,\dd t/a$. Giờ ánh sáng đi theo $\dd\chi = \pm c\,\dd\eta$: **mọi tia sáng nghiêng đúng 45°** như ở Bài 5.

          Ở hệ trục 3, nón quá khứ của ta là một nón thẳng; chân trời sự kiện là một nón 45° **lộn ngược** có đỉnh ở $\eta_\infty = 62{,}8$ tỉ năm, mép trên của hình (cả tương lai vô hạn bị dồn vào một độ cao hữu hạn); chân trời hạt là nón 45° mọc lên từ ta lúc Vụ Nổ Lớn. Cấu trúc nhân quả đọc được bằng mắt như ở không-thời gian phẳng.

          > [Thử ngay] Ở hệ trục 3, kéo «bây giờ» lên tương lai: nón quá khứ 45° của ta rộng dần, tiến sát nón chân trời sự kiện lộn ngược nhưng không bao giờ vượt qua.
          > [[Khoảng cách thật|he1]] [[Đồng chuyển|he2]] [[Đồng chuyển + bảo giác|he3]]

          +++ Đi sâu: vì sao gọi là «bảo giác»
          Metric của vũ trụ phẳng là $\dd s^2 = -c^2\dd t^2 + a(t)^2(\dd\chi^2 + \chi^2\dd\Omega^2)$. Thay $c\,\dd t = a\,c\,\dd\eta$:

          $$ \dd s^2 = a(\eta)^2\left[-c^2\dd\eta^2 + \dd\chi^2 + \chi^2\dd\Omega^2\right] $$

          Trong ngoặc vuông là metric phẳng của Bài 5. Thừa số $a^2$ phía trước làm mọi khoảng cách co giãn như nhau theo mọi hướng, nên không đổi góc giữa các hướng («bảo toàn góc», tiếng Anh: conformal). Nón ánh sáng ($\dd s = 0$) vì thế giống hệt nón trong không-thời gian phẳng.
          +++`,
        vao: (c) => c.cauHinh({ aN: 1, s: 0, sDich: 2, z: 3, hien: { th: true, homNay: true, non: true, nonTL: true, sk: true, hat: true, hubble: true, chon: true }, mayAnh: 'xa', nhan: { vuNo: true, kc: true, tatMat: ['hubble', 'nonTL'] }, hud: ['he', 'z', 'dNay'] }),
        ra: (c) => c.im(),
        nut: { he1: (c) => c.datHe(0), he2: (c) => c.datHe(1), he3: (c) => c.datHe(2) },
      },
      {
        ten: 'Bức xạ nền vi sóng: bức ảnh xa nhất',
        noiDung: R`
          Vòng sát đáy là **mặt tán xạ cuối**, nơi phát ra {{bức xạ nền vi sóng vũ trụ}}: ánh sáng xưa nhất ta nhận được. Mô hình của bài tính ra:

          | Đại lượng | Giá trị tính được |
          |---|---|
          | Dịch chuyển đỏ | $z = 1090$ |
          | Tuổi vũ trụ lúc phát | 371 000 năm (sách thường làm tròn 380 000) |
          | Khoảng cách thật lúc phát | 41 triệu năm ánh sáng |
          | Khoảng cách hôm nay | 45,2 tỉ năm ánh sáng |
          | Ánh sáng đã đi | 13,79 tỉ năm |
          | Tốc độ lùi lúc phát / hôm nay | $66\,c$ / $3{,}1\,c$ |

          Lúc phát, vùng ấy chỉ cách chỗ sau này thành Ngân Hà 41 triệu năm ánh sáng, nhưng đã lùi nhanh gấp 66 lần ánh sáng; ánh sáng phải mất gần trọn tuổi vũ trụ mới thoát được dòng giãn nở để tới ta. Từ đó tới nay khoảng cách giãn đúng $1 + z = 1091$ lần.

          > [Tóm lại] Tuổi vũ trụ 13,79 tỉ năm; $c/H_0 = 14{,}51$; chân trời sự kiện 16,7 tỉ năm ánh sáng; chân trời hạt 46,1 tỉ năm ánh sáng. Nón quá khứ rộng nhất 5,85 tỉ năm ánh sáng ở $z \approx 1{,}6$. Ở hệ trục đồng chuyển và bảo giác, mọi thứ trở về hình học nón 45° của Bài 5.

          [[Bức xạ nền z = 1090|z1090]] [[Hệ trục thật|he1]] [[Hệ trục bảo giác|he3]]`,
        vao: (c) => c.cauHinh({ aN: 1, s: 2, z: 1090, hien: { th: true, homNay: true, non: true, hat: true, sk: true, chon: true, cmb: true }, mayAnh: 'xa', nhan: { chinh: 'cmb', vuNo: true }, hud: ['z', 'phat', 'dPhat', 'dNay'] }),
        ra: (c) => c.im(),
        nut: { z1090: (c) => c.datZ(1090), he1: (c) => c.datHe(0), he3: (c) => c.datHe(2) },
      },
    ],
    congThuc: [
      { ten: 'Tốc độ giãn nở (vũ trụ phẳng)', tex: R`H(a) = H_0\sqrt{\Omega_r a^{-4} + \Omega_m a^{-3} + \Omega_\Lambda}`, y: 'Planck 2018: $H_0 = 67{,}4$ km/s/Mpc, $\\Omega_m = 0{,}315$, $\\Omega_\\Lambda = 0{,}685$, $\\Omega_r = 9{,}2 \\times 10^{-5}$.' },
      { ten: 'Thời gian vũ trụ và thời gian bảo giác', tex: R`t(a) = \int_0^a \frac{\dd a}{a H}, \qquad \eta(a) = \int_0^a \frac{\dd a}{a^2 H}`, y: '$c\\,\\eta$ là quãng đường đồng chuyển ánh sáng đi được từ Vụ Nổ Lớn.' },
      { ten: 'Khoảng cách thật và đồng chuyển', tex: R`D(t) = a(t)\,\chi, \qquad v = \dot a\,\chi = H D`, y: '$\\chi$ không đổi với thiên hà trôi theo dòng giãn nở; $v$ là tốc độ lùi.' },
      { ten: 'Nón ánh sáng quá khứ của ta', tex: R`\chi = c\,(\eta_0 - \eta), \qquad D = a\,c\,(\eta_0 - \eta), \qquad \frac{\dd D}{\dd t} = H D - c`, y: 'Cực đại 5,85 tỉ năm ánh sáng, tại nơi $HD = c$.' },
      { ten: 'Hai chân trời (hôm nay)', tex: R`\chi_{\text{hạt}} = c\,\eta_0 \approx 46{,}1, \qquad \chi_{\text{sk}} = c\,(\eta_\infty - \eta_0) \approx 16{,}7`, y: 'Đơn vị: tỉ năm ánh sáng. Mặt cầu Hubble hôm nay: $c/H_0 = 14{,}51$.' },
    ],
    cauHoi: [
      {
        hoi: 'Thiên hà có z = 3 hôm nay lùi xa ta với tốc độ khoảng 1,46 c. Ta có thấy được nó không?',
        chon: ['Không, vì nó lùi nhanh hơn ánh sáng', 'Có: ánh sáng nó phát lúc vũ trụ 2,1 tỉ năm tuổi đang tới ta', 'Chỉ thấy nếu nó nằm trong mặt cầu Hubble', 'Không, vì nó nằm ngoài chân trời hạt'],
        dung: 1,
        giai: 'Thấy được hay không do chân trời hạt quyết định (46,1 tỉ năm ánh sáng), không do mặt cầu Hubble. Thiên hà z = 3 nay cách 21,2 tỉ năm ánh sáng, nằm trong chân trời hạt. Ánh sáng của nó lúc đầu bị cuốn ra xa rồi mới quay về, mất 11,7 tỉ năm.',
      },
      {
        hoi: 'Bán kính hôm nay của vũ trụ quan sát được (chân trời hạt) khoảng bao nhiêu?',
        chon: ['13,8 tỉ năm ánh sáng, vì vũ trụ 13,8 tỉ năm tuổi', '14,5 tỉ năm ánh sáng, bằng c/H0', '46 tỉ năm ánh sáng', 'Vô hạn'],
        dung: 2,
        giai: 'Ánh sáng đi 13,8 tỉ năm, nhưng quãng đường phía sau nó giãn ra trong lúc đó, nên nguồn sáng nay cách 46 tỉ năm ánh sáng. 14,5 là bán kính mặt cầu Hubble, một khái niệm khác.',
      },
      {
        hoi: 'Ánh sáng từ một thiên hà ở z = 11 rời thiên hà ấy khi nó cách ta bao xa (khoảng cách thật lúc phát)?',
        chon: ['Khoảng 2,7 tỉ năm ánh sáng', 'Khoảng 13,4 tỉ năm ánh sáng', 'Khoảng 32 tỉ năm ánh sáng', 'Khoảng 46 tỉ năm ánh sáng'],
        dung: 0,
        giai: 'Khoảng cách thật lúc phát là $a(\\eta_0 - \\eta)$: 2,7 tỉ năm ánh sáng, vì lúc ấy ($a = 1/12$) vũ trụ còn nhỏ. 32 là khoảng cách hôm nay; 13,4 là thời gian ánh sáng đã đi (tính bằng tỉ năm), không phải một khoảng cách.',
      },
      {
        hoi: 'Hôm nay ta gửi một tín hiệu vô tuyến tới một thiên hà đang cách ta 20 tỉ năm ánh sáng. Tín hiệu có tới nơi không?',
        chon: ['Có, chỉ cần chờ 20 tỉ năm', 'Có, nhưng phải chờ lâu hơn 20 tỉ năm', 'Không bao giờ, vì 20 lớn hơn chân trời sự kiện 16,7', 'Không, vì nó ở ngoài mặt cầu Hubble'],
        dung: 2,
        giai: 'Tín hiệu phát hôm nay chỉ tới được các thiên hà có khoảng cách đồng chuyển dưới 16,7 tỉ năm ánh sáng. Ngoài mặt cầu Hubble (14,5) chưa đủ để kết luận: thiên hà ở 15 tỉ năm ánh sáng vẫn nhận được, dù rất muộn.',
      },
      {
        hoi: 'Trong hệ trục khoảng cách đồng chuyển × thời gian bảo giác (cùng thang đo), tia sáng nghiêng bao nhiêu so với trục thời gian?',
        chon: ['Đúng 45°, ở mọi nơi và mọi lúc', 'Ít hơn 45° lúc vũ trụ còn trẻ', 'Nhiều hơn 45° ở ngoài mặt cầu Hubble', 'Tùy dịch chuyển đỏ'],
        dung: 0,
        giai: 'Thời gian bảo giác được định nghĩa để $\\dd\\chi = \\pm c\\,\\dd\\eta$ cho mọi tia sáng. Metric chỉ khác metric phẳng một thừa số $a^2$ chung nên nón ánh sáng y như ở Bài 5.',
      },
      {
        hoi: 'Vì sao vũ trụ mới 13,8 tỉ năm tuổi mà ta thấy được những nơi nay cách 46 tỉ năm ánh sáng? Giải thích bằng sơ đồ không-thời gian.',
        dap: 'Ánh sáng đi tới ta dọc nón ánh sáng quá khứ. Trên đường đi, ở mỗi chỗ nó chạy với tốc độ $c$ so với không gian tại chỗ, nhưng các đoạn đường nó đã vượt qua cứ giãn ra theo $a(t)$. Cộng tất cả các đoạn ấy theo khoảng cách hôm nay được $\\chi = \\int c\\,\\dd t/a = 46{,}1$ tỉ năm ánh sáng, lớn hơn $c \\times 13{,}8$ tỉ năm vì $a \\lt 1$ suốt quá khứ. Trên sơ đồ đồng chuyển × bảo giác điều này hiện ra trực tiếp: nón quá khứ 45° của ta chạm đáy (Vụ Nổ Lớn) ở $\\chi = c\\,\\eta_0 = 46{,}1$.',
      },
    ],
    docThem: [
      'T. M. Davis và C. H. Lineweaver, «Expanding Confusion», PASA 21, 97 (2004): hình không-thời gian ba hệ trục mà bài này dựng lại, và các hiểu lầm về vận tốc lùi, chân trời.',
      'B. Ryden, *Introduction to Cosmology* (bản 2, 2016): khoảng cách thật, khoảng cách đồng chuyển, chân trời hạt và chân trời sự kiện.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 17–18: vũ trụ học, metric FRW, sơ đồ bảo giác.',
      'Planck Collaboration 2020, A&A 641, A6: các tham số vũ trụ dùng trong bài.',
    ],
    thuatNgu: [
      { vi: 'thời gian vũ trụ', en: 'cosmic time', nghia: 'Thời gian tính từ Vụ Nổ Lớn, đo bằng đồng hồ của người trôi theo dòng giãn nở. Mỗi lát thời gian vũ trụ không đổi là «vũ trụ lúc ấy».' },
      { vi: 'thời gian bảo giác', en: 'conformal time', nghia: 'Đại lượng $\\eta$ với $c\\,\\dd\\eta = c\\,\\dd t/a(t)$. Dùng nó làm trục thời gian và khoảng cách đồng chuyển làm trục không gian thì mọi tia sáng nghiêng 45°.' },
      { vi: 'khoảng cách thật', en: 'proper distance', nghia: 'Khoảng cách đo bằng những cây thước đặt nối nhau ngay tại một thời điểm vũ trụ. Bằng $a(t)$ nhân khoảng cách đồng chuyển.' },
      { vi: 'nón ánh sáng quá khứ', en: 'past light cone', nghia: 'Tập hợp các sự kiện mà ánh sáng của chúng tới một người quan sát đúng lúc ấy. Mọi thứ ta thấy trên trời nằm trên nón quá khứ của ta.' },
    ],
  },

  conSo: [
    '**13,79 tỉ năm**: tuổi vũ trụ (mô hình Planck 2018, tính lại bằng mã của bài).',
    '**46,1 tỉ năm ánh sáng**: khoảng cách hôm nay tới chân trời hạt, mép vũ trụ quan sát được.',
    '**16,7 tỉ năm ánh sáng**: chân trời sự kiện; tín hiệu gửi hôm nay không bao giờ tới các thiên hà xa hơn.',
    '**14,51 tỉ năm ánh sáng**: bán kính mặt cầu Hubble hôm nay (c/H0).',
    '**5,85 tỉ năm ánh sáng**: chỗ rộng nhất của nón ánh sáng quá khứ hình giọt nước, ở z ≈ 1,6.',
    '**41 triệu năm ánh sáng**: khoảng cách lúc phát của vùng phát ra bức xạ nền mà ta thấy hôm nay.',
  ],
  hieuDung: '**Mặt cầu Hubble không phải mép vũ trụ quan sát được.** Ta vẫn thấy rất nhiều thiên hà đang lùi nhanh hơn ánh sáng (mọi thiên hà có z lớn hơn khoảng 1,5). Mép thật là chân trời hạt, nay cách 46 tỉ năm ánh sáng.',
  nguon: 'Tham số vũ trụ: Planck Collaboration 2020, A&A 641, A6 (H0 = 67,4; Ωm = 0,315). Hình ba hệ trục và các con số để so: Davis và Lineweaver 2004, PASA 21, 97. Mọi con số trong bài tính bằng src/vat-ly/chan-troi-vu-tru.js và kiểm trong kiem-tra/kiem-vu-tru-4c.mjs.',

  tao(app) {
    const scene = new THREE.Scene();
    const am = app.am, tt = app.tt;
    scene.add(taoNenSao({ soSao: 1800, hat: 19, doSang: 0.42 }));
    const V = taoVuTru();
    const T_MAX = V.tuoi + T_SAU;
    const A_MAX = V.aTuT(T_MAX);
    const A_CMB = 1 / (1 + Z_BUC_XA_NEN);
    const A_NAY_MIN = V.aTuT(0.8);      // «bây giờ» kéo được từ lúc vũ trụ 0,8 tỉ năm tuổi
    const A_NAY_MAX = V.aTuT(T_MAX - 1);

    const S = {
      s: 0, sDich: null, z: 3, chi: V.thienHa(3).chi, aN: 1,
      hien: { th: true, homNay: true, non: false, nonTL: false, hubble: false, hat: false, sk: false, chon: false, cmb: false },
      // nhãn phụ bước nào cần (vạch tuổi, «thiên hà trôi», Vụ Nổ Lớn, tên trục ngang) và vật chính của bước
      nhan: { vach: true, th: true, vuNo: true, kc: true, chinh: null },
      // các dòng ô số liệu, theo thứ tự ưu tiên (tối đa 5 dòng)
      hud: ['tuoi', 'he', 'am'],
    };
    let N = nhinTuLuc(V, 1);

    // ---------- lưới a dùng chung cho mọi đường, mặt ----------
    const dsA = (() => {
      const m = new Set();
      const tDau = V.tTai(1e-6);
      for (let i = 0; i <= 90; i++) m.add(V.aTuT(tDau + ((T_MAX - tDau) * i) / 90));
      const eMax = V.etaTai(A_MAX);
      for (let i = 1; i <= 90; i++) m.add(V.aTuEta((eMax * i) / 90));
      for (let i = 0; i <= 24; i++) m.add(Math.exp(Math.log(1e-6) + (i / 24) * (Math.log(0.02) - Math.log(1e-6))));
      m.add(1); m.add(A_CMB);
      return [...m].filter((a) => a <= A_MAX * (1 + 1e-9)).sort((x, y) => x - y);
    })();
    const NA = dsA.length;
    const tA = dsA.map((a) => V.tTai(a)), eA = dsA.map((a) => V.etaTai(a));

    // Đổi (χ, a) sang hiển thị (bán kính ngang, độ cao) theo tham số s ∈ [0, 2].
    const heSo = () => { const s1 = lamMuot(kep(S.s, 0, 1)), s2 = lamMuot(kep(S.s - 1, 0, 1)); return [s1, s2]; };
    let s1 = 0, s2 = 0;
    const rHien = (chi, a) => KX * chi * (a + (1 - a) * s1);
    const yHien = (t, eta) => KT * t * (1 - s2) + KE * eta * s2;
    const yTaiA = (a) => yHien(V.tTai(a), V.etaTai(a));
    const R_MAX = KX * D_MAX;
    // độ cao → hệ số tỉ lệ (chia đôi; yTaiA tăng theo a)
    const aTuY = (y) => {
      let lo = Math.log(A_NAY_MIN), hi = Math.log(A_NAY_MAX);
      for (let k = 0; k < 48; k++) { const m = (lo + hi) / 2; if (yTaiA(Math.exp(m)) < y) lo = m; else hi = m; }
      return Math.exp((lo + hi) / 2);
    };

    // =====================================================================
    // Các mặt tròn xoay (3/4 vòng), mặt kính vẽ bằng shader + đường viền mặt cắt phát sáng
    // =====================================================================
    const MAX_HANG = NA + 2;
    const gioMat = { value: 0 };
    function vatLieuMat(mau, doMo, xung) {
      const m = new THREE.ShaderMaterial({
        uniforms: { uMau: { value: new THREE.Color(mau) }, uDoMo: { value: doMo }, uGio: gioMat, uXung: { value: xung ? 1 : 0 } },
        vertexShader: /* glsl */ `
          attribute vec2 aTE; attribute float aPhi;
          varying vec3 vN, vV; varying vec2 vTE; varying float vPhi;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
            vTE = aTE; vPhi = aPhi;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uMau; uniform float uDoMo, uGio, uXung;
          varying vec3 vN, vV; varying vec2 vTE; varying float vPhi;
          float net(float o, float rong) { float d = max(fwidth(o), 1e-6); float g = abs(fract(o - 0.5) - 0.5) / d; return 1.0 - smoothstep(rong * 0.5 - 0.5, rong * 0.5 + 0.8, g); }
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
            float vi = max(net(vTE.x, 1.0) * 0.55, net(vTE.x / 5.0, 1.6));     // vĩ tuyến: mỗi tỉ năm tuổi vũ trụ, đậm mỗi 5 tỉ năm
            float ki = net(vPhi * 18.0, 1.0) * 0.8;                            // kinh tuyến: mỗi 15°
            float xung = 0.0;
            if (uXung > 0.5) {                                                 // vòng sáng chạy theo ánh sáng, về phía ta
              float q = fract(vTE.y * 0.11 - uGio * 0.16);
              xung = smoothstep(0.86, 0.985, q) * (1.0 - smoothstep(0.985, 1.0, q));
            }
            float a = uDoMo * (0.45 + 2.8 * f + 1.5 * max(vi, ki) * (0.45 + 0.55 * f) + 3.2 * xung);
            gl_FragColor = vec4(uMau * a, 1.0);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      });
      m.tuyenTinh = true;
      return m;
    }
    function taoMat({ mau, doMo, chiCuaA, hang, rongVien = 2.2, xung = false }) {
      const dsHang = new Float64Array(MAX_HANG);
      const nV = MAX_HANG * (N_PHI + 1);
      const viTri = new Float32Array(nV * 3), te = new Float32Array(nV * 2), phi = new Float32Array(nV);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(viTri, 3));
      geo.setAttribute('aTE', new THREE.BufferAttribute(te, 2));
      geo.setAttribute('aPhi', new THREE.BufferAttribute(phi, 1));
      const idx = [];
      for (let i = 0; i < MAX_HANG - 1; i++) for (let j = 0; j < N_PHI; j++) {
        const p = i * (N_PHI + 1) + j, q = p + N_PHI + 1;
        idx.push(p, q, p + 1, p + 1, q, q + 1);
      }
      geo.setIndex(idx);
      for (let i = 0; i < MAX_HANG; i++) for (let j = 0; j <= N_PHI; j++) phi[i * (N_PHI + 1) + j] = j / N_PHI;
      const mesh = new THREE.Mesh(geo, vatLieuMat(mau, doMo, xung));
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;
      const vien0 = new DuongDay(MAX_HANG, { mau, rong: rongVien, doMo: 1, quang: 0.14, sang: 1.5 });
      const vien1 = new DuongDay(MAX_HANG, { mau, rong: rongVien * 0.7, doMo: 0.8, sang: 1.2 });
      const g = new THREE.Group();
      g.add(mesh, vien0.line, vien1.line);
      const prof = new Float32Array(MAX_HANG * 2), tR = new Float32Array(MAX_HANG), eR = new Float32Array(MAX_HANG);
      return {
        g, mesh,
        dat() {
          const n = hang(dsHang);
          let cuoi = -1, dau = -1;
          for (let k = 0; k < n; k++) {
            const a = dsHang[k];
            tR[k] = V.tTai(a); eR[k] = V.etaTai(a);
            const r = rHien(chiCuaA(a), a), y = yHien(tR[k], eR[k]);
            if (r <= R_MAX && Number.isFinite(r) && r >= 0) { prof[k * 2] = Math.max(r, 0); prof[k * 2 + 1] = y; cuoi = k; if (dau < 0) dau = k; }
            else if (cuoi >= 0) { prof[k * 2] = prof[cuoi * 2]; prof[k * 2 + 1] = prof[cuoi * 2 + 1]; }
            else { prof[k * 2] = R_MAX; prof[k * 2 + 1] = y; }
          }
          if (dau > 0) for (let k = 0; k < dau; k++) { prof[k * 2] = prof[dau * 2]; prof[k * 2 + 1] = prof[dau * 2 + 1]; }
          for (let k = 0; k < n; k++) {
            const r = prof[k * 2], y = prof[k * 2 + 1];
            for (let j = 0; j <= N_PHI; j++) {
              const ph = PHI0 + ((PHI1 - PHI0) * j) / N_PHI, o = k * (N_PHI + 1) + j;
              viTri[o * 3] = r * Math.cos(ph); viTri[o * 3 + 1] = y; viTri[o * 3 + 2] = r * Math.sin(ph);
              te[o * 2] = tR[k]; te[o * 2 + 1] = eR[k];
            }
          }
          geo.setDrawRange(0, Math.max(0, n - 1) * N_PHI * 6);
          geo.attributes.position.needsUpdate = true;
          geo.attributes.aTE.needsUpdate = true;
          geo.computeVertexNormals();
          geo.computeBoundingSphere();
          const k0 = dau < 0 ? n : dau, k1 = cuoi;
          let m = 0;
          for (let k = k0; k <= k1; k++) { vien0.dat(m, prof[k * 2], prof[k * 2 + 1], 0); vien1.dat(m, 0, prof[k * 2 + 1], prof[k * 2]); m++; }
          vien0.xong(m); vien1.xong(m);
        },
      };
    }
    const hangToanBo = (o) => { for (let i = 0; i < NA; i++) o[i] = dsA[i]; return NA; };
    const hangQuaKhu = (o) => { let n = 0; for (let i = 0; i < NA && dsA[i] < S.aN * (1 - 1e-9); i++) o[n++] = dsA[i]; o[n++] = S.aN; return n; };
    const hangTuongLai = (o) => { let n = 0; o[n++] = S.aN; for (let i = 0; i < NA; i++) if (dsA[i] > S.aN * (1 + 1e-9)) o[n++] = dsA[i]; return n; };
    const mat = {
      non: taoMat({ mau: MAU_NON, doMo: 0.13, chiCuaA: (a) => Math.max(0, N.chiNon(a)), hang: hangQuaKhu, rongVien: 2.6, xung: true }),
      nonTL: taoMat({ mau: MAU_NON, doMo: 0.03, chiCuaA: (a) => Math.max(0, N.chiNonTL(a)), hang: hangTuongLai, rongVien: 1.6, xung: true }),
      hubble: taoMat({ mau: MAU_HUBBLE, doMo: 0.045, chiCuaA: (a) => V.chiHubble(a), hang: hangToanBo }),
      hat: taoMat({ mau: MAU_HAT, doMo: 0.045, chiCuaA: (a) => V.chiHat(a), hang: hangToanBo }),
      sk: taoMat({ mau: MAU_SK, doMo: 0.045, chiCuaA: (a) => V.chiSuKien(a), hang: hangToanBo }),
    };
    for (const m of Object.values(mat)) scene.add(m.g);
    // nhãn của các mặt: đặt ở viền φ = 0 tại một a chọn sẵn
    const nhanMat = [
      { m: 'non', a: () => S.aN * 0.36, chu: () => chuCanh("canh.non-anh-sang-qua-khu-moi-thu-ta", "Nón ánh sáng quá khứ<small>mọi thứ ta thấy {0}</small>", [S.aN === 1 ? chuCanh("canh.hom-nay", "hôm nay") : chuCanh("canh.luc-bay-gio", "lúc «bây giờ»")]), lop: 'vang dam', mau: null },
      { m: 'nonTL', a: () => Math.min(A_MAX * 0.92, S.aN * 2.4), chu: () => chuCanh("canh.tin-hieu-ta-gui", "Tín hiệu ta gửi {0}", [S.aN === 1 ? chuCanh("canh.hom-nay", "hôm nay") : chuCanh("canh.luc-bay-gio", "lúc «bây giờ»")]), lop: 'vang', mau: null },
      { m: 'hubble', a: () => 1.75, chu: () => chuCanh("canh.mat-cau-hubble-lui-dung-bang-c", "Mặt cầu Hubble<small>lùi đúng bằng c</small>"), lop: 'xanh dam', mau: null },
      { m: 'hat', a: () => 0.75, chu: () => chuCanh("canh.chan-troi-hat-mep-vu-tru-quan-sat", "Chân trời hạt<small>mép vũ trụ quan sát được</small>"), lop: 'dam', mau: '#c9a8ff' },
      { m: 'sk', a: () => 3.0, chu: () => chuCanh("canh.chan-troi-su-kien", "Chân trời sự kiện"), lop: 'dam', mau: '#ff8a73' },
    ].map((k) => {
      const n = taoNhan(k.chu(), k.lop);
      if (k.mau) n.element.style.color = k.mau;
      mat[k.m].g.add(n);
      return { ...k, n };
    });
    const chiCua = { non: (a) => N.chiNon(a), nonTL: (a) => N.chiNonTL(a), hubble: (a) => V.chiHubble(a), hat: (a) => V.chiHat(a), sk: (a) => V.chiSuKien(a) };

    // =====================================================================
    // Đường thế giới thiên hà (ống sáng), ta, «bây giờ», Vụ Nổ Lớn, mặt tán xạ cuối, trục
    // =====================================================================
    const nhomTH = new THREE.Group();
    scene.add(nhomTH);
    const texTH = texThienHa();
    const dsTH = [];
    for (const chi of CHI_TH) for (let k = 0; k < 8; k++) {
      const ph = (k / 8) * 2 * Math.PI;
      const gan = chi <= 15;
      const d = new DuongDay(NA, { mau: 0xc8d8ff, rong: gan ? 1.6 : 1.2, doMo: gan ? 0.34 : 0.2, quang: gan ? 0.035 : 0 });
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texTH, color: new THREE.Color(0xe8eeff).multiplyScalar(gan ? 1.5 : 1.1), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sp.material.rotation = k * 0.7 + chi * 0.13;
      sp.scale.setScalar(gan ? 0.5 : 0.4);
      nhomTH.add(d.line, sp);
      dsTH.push({ chi, ph, d, sp });
    }
    const nhanTH = taoNhan('', 'mo tran');
    nhomTH.add(nhanTH);
    // ta
    const duongTa = new DuongDay(2, { mau: MAU_KTG.hienTai, rong: 2.6, doMo: 0.9, quang: 0.08, sang: 1.15 });
    scene.add(duongTa.line);
    const spTa = new THREE.Sprite(new THREE.SpriteMaterial({ map: texTH, color: new THREE.Color(MAU_KTG.hienTai).multiplyScalar(2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    spTa.scale.setScalar(0.62);
    const nhanTa = taoNhan(chuCanh("canh.ta-ngan-ha-hom-nay", "Ta (Ngân Hà)<small>hôm nay</small>"), 'dam');
    nhanTa.element.style.color = '#8fe3a8';
    scene.add(spTa, nhanTa);
    // tấm «bây giờ»: đĩa kính tròn + các vòng thước 10, 20, …, 60 tỉ năm ánh sáng
    const nhomNay = new THREE.Group();
    scene.add(nhomNay);
    const nhanVong = [];
    let nhanNay;
    {
      const m = new THREE.ShaderMaterial({
        uniforms: { uMau: { value: new THREE.Color(MAU_KTG.hienTai) }, uGio: gioMat },
        vertexShader: /* glsl */ `varying vec2 vP; varying vec3 vN, vV; void main() { vP = position.xy; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uMau; uniform float uGio; varying vec2 vP; varying vec3 vN, vV;
          void main() {
            float r = length(vP) / ${R_MAX.toFixed(3)};
            float mep = smoothstep(0.8, 1.0, r) * (1.0 - smoothstep(0.995, 1.0, r));
            float nghieng = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
            float luot = exp(-pow((vP.x + vP.y) / ${R_MAX.toFixed(3)} - (fract(uGio * 0.05) * 4.0 - 2.0), 2.0) * 18.0);
            float a = 0.02 + 0.1 * mep + 0.04 * nghieng + 0.03 * luot;
            gl_FragColor = vec4(uMau * a, 1.0);
          }`,
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      });
      m.tuyenTinh = true;
      const dia = new THREE.Mesh(new THREE.CircleGeometry(R_MAX, 128), m);
      dia.rotation.x = -Math.PI / 2;
      dia.renderOrder = 1;
      nhomNay.add(dia);
      for (let d = 10; d <= D_MAX; d += 10) {
        const q = [];
        for (let i = 0; i <= 128; i++) { const a = (i / 128) * 2 * Math.PI; q.push(KX * d * Math.cos(a), 0, KX * d * Math.sin(a)); }
        nhomNay.add(duongDayTinh(q, { mau: MAU_KTG.hienTai, rong: d === D_MAX ? 1.6 : 1, doMo: d === D_MAX ? 0.6 : 0.22, sang: d === D_MAX ? 1.4 : 1 }).line);
        const n = taoNhan(String(d), 'mo tran giua');
        n.position.set(KX * d * Math.cos(-0.22), 0, KX * d * Math.sin(-0.22));
        nhomNay.add(n);
        nhanVong.push(n);
      }
      nhanNay = taoNhan('', 'dam');
      nhanNay.element.style.color = '#8fe3a8';
      nhanNay.position.set(R_MAX * Math.cos(3.5), 0, R_MAX * Math.sin(3.5));
      nhomNay.add(nhanNay);
    }
    // Vụ Nổ Lớn: ở hệ trục khoảng cách thật mọi khoảng cách thật → 0 (một điểm rực sáng); ở hệ đồng chuyển là cả một đáy nóng
    const nhomSan = new THREE.Group();
    scene.add(nhomSan);
    const matSan = new THREE.ShaderMaterial({
      uniforms: { uSang: { value: 0 } },
      vertexShader: /* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform float uSang; varying vec2 vP;
        void main() { float r = length(vP); float a = uSang * (0.05 + 0.12 * (1.0 - r) + 0.25 * smoothstep(0.93, 1.0, r) * (1.0 - smoothstep(0.995, 1.0, r))); gl_FragColor = vec4(vec3(1.0, 0.62, 0.36) * a, 1.0); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    matSan.tuyenTinh = true;
    {
      const dia = new THREE.Mesh(new THREE.CircleGeometry(1, 128), matSan);
      dia.rotation.x = -Math.PI / 2; dia.position.y = -0.005;
      nhomSan.add(dia);
    }
    const domVuNo = taoDom(new THREE.Color(0xffc27a).multiplyScalar(1.2), 0.32);
    scene.add(domVuNo);
    const nhanVuNo = taoNhan(chuCanh("canh.vu-no-lon", "Vụ Nổ Lớn"), 'mo tran');
    nhanVuNo.element.style.color = '#ffb27a';
    scene.add(nhanVuNo);
    // mặt tán xạ cuối: dải sáng lốm đốm như bản đồ bức xạ nền (vân minh hoạ, không phải bản đồ thật)
    const nhomCMB = new THREE.Group();
    scene.add(nhomCMB);
    const vongCMB = new DuongDay(129, { mau: 0xffa36b, rong: 2.4, doMo: 1, quang: 0.18, sang: 1.6 });
    const matCMB = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `varying vec2 vUv;
        float bam(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float nhieu(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(bam(i), bam(i + vec2(1, 0)), f.x), mix(bam(i + vec2(0, 1)), bam(i + vec2(1, 1)), f.x), f.y); }
        void main() {
          vec2 p = vec2(vUv.x * 90.0, vUv.y * 3.0);
          float n = nhieu(p) * 0.6 + nhieu(p * 2.3 + 7.1) * 0.3 + nhieu(p * 5.1 + 3.3) * 0.1;
          vec3 c = mix(vec3(0.25, 0.45, 1.0), vec3(1.0, 0.55, 0.2), smoothstep(0.35, 0.65, n));
          float mep = sin(vUv.y * 3.14159);
          gl_FragColor = vec4(c * (0.5 + 0.9 * n) * mep * 0.9, 1.0);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    matCMB.tuyenTinh = true;
    const daiCMB = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 160, 1, true), matCMB);
    const nhanCMB = taoNhan(chuCanh("canh.mat-tan-xa-cuoi-noi-phat-buc-xa", "Mặt tán xạ cuối<small>nơi phát bức xạ nền, z = 1090</small>"), 'dam');
    nhanCMB.element.style.color = '#ffb27a';
    nhomCMB.add(daiCMB, vongCMB.line, nhanCMB);
    // trục: vạch tuổi vũ trụ dọc đường thế giới của ta
    const MOC_T = [2, 5, 10, 20, 30];
    const vachT = MOC_T.map((t) => {
      const n = taoNhan(chuCanh("canh.ti-nam", "{0} tỉ năm", [t]), 'xanh tran');
      const gach = new DuongDay(2, { mau: MAU_KTG.thoiGian, rong: 1.4, doMo: 0.8, sang: 1.2 });
      scene.add(n, gach.line);
      return { t, a: V.aTuT(t), n, gach };
    });
    const nhanTruc = taoNhan('', 'xanh dam tran');
    scene.add(nhanTruc);
    const dauTruc = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.34, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(MAU_KTG.thoiGian).multiplyScalar(1.6), transparent: true, opacity: 0.95 }));
    const thanTruc = new DuongDay(2, { mau: MAU_KTG.thoiGian, rong: 1.6, doMo: 0.75, sang: 1.2 });
    scene.add(dauTruc, thanTruc.line);
    const nhanKC = taoNhan('', 'mo tran');
    scene.add(nhanKC);

    // thiên hà được chọn (hướng φ = 0): đường thế giới hồng, tia sáng vàng tới ta, một «photon» chạy dọc tia
    const nhomChon = new THREE.Group();
    scene.add(nhomChon);
    const dChon = new DuongDay(NA, { mau: MAU_TH, rong: 2.8, doMo: 1, quang: 0.16, sang: 1.6 });
    const tiaChon = new DuongDay(NA + 2, { mau: MAU_NON, rong: 3, doMo: 1, quang: 0.22, sang: 1.9 });
    const domPhat = taoDom(new THREE.Color(MAU_NON).multiplyScalar(2.5), 0.5);
    const spChon = new THREE.Sprite(new THREE.SpriteMaterial({ map: texTH, color: new THREE.Color(MAU_TH).multiplyScalar(2.2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    spChon.scale.setScalar(0.55);
    const photon = taoDom(new THREE.Color(0xfff0c0).multiplyScalar(5), 0.32);
    const nhanPhat = taoNhan('', 'vang dam'), nhanNayTH = taoNhan('', 'hong dam');
    nhomChon.add(dChon.line, tiaChon.line, domPhat, spChon, photon, nhanPhat, nhanNayTH);
    const tiaDai = new Float32Array(NA + 2);   // độ dài cộng dồn dọc tia (để photon chạy đều)
    let photonU = 0;

    function veMoi() {
      [s1, s2] = heSo();
      for (const k of Object.keys(mat)) if (mat[k].g.visible) mat[k].dat();
      for (const k of nhanMat) {
        const a = k.a(), r = rHien(chiCua[k.m](a), a);
        k.n._an = !(r <= R_MAX) || !(r >= 0);
        k.n.visible = !k.n._an;
        k.n.position.set(r * Math.cos(0.08), yTaiA(a), r * Math.sin(0.08) + 0.02);
        k.n.datChu(k.chu());
      }
      const aN = S.aN, yNay = yTaiA(aN), yDinh = yTaiA(A_MAX);
      // thiên hà
      for (const o of dsTH) {
        let n = 0;
        for (let i = 0; i < NA; i++) {
          const r = rHien(o.chi, dsA[i]);
          if (r > R_MAX) break;
          o.d.dat(n++, r * Math.cos(o.ph), yHien(tA[i], eA[i]), r * Math.sin(o.ph));
        }
        o.d.xong(n);
        const rN = rHien(o.chi, aN);
        o.sp.visible = rN <= R_MAX;
        o.sp.position.set(rN * Math.cos(o.ph), yNay, rN * Math.sin(o.ph));
      }
      nhanTH.position.set(KX * 30 * Math.cos(Math.PI / 4) + 0.1, yTaiA(1) + 0.25, KX * 30 * Math.sin(Math.PI / 4));
      nhanTH.datChu(chuCanh("canh.thien-ha-troi-theo-gian-no", "thiên hà trôi theo giãn nở"));
      // ta, «bây giờ»
      duongTa.dat(0, 0, 0, 0); duongTa.dat(1, 0, yDinh, 0); duongTa.xong(2);
      spTa.position.set(0, yNay, 0);
      nhanTa.position.set(0.12, yNay + 0.3, 0);
      nhanTa.datChu(chuCanh("canh.ta-ngan-ha", "Ta (Ngân Hà)<small>{0}</small>", [aN === 1 ? chuCanh("canh.hom-nay", "hôm nay") : chuCanh("canh.bay-gio", "«bây giờ»")]));
      nhomNay.position.y = yNay;
      nhanNay.datChu(aN === 1 ? chuCanh("canh.hom-nay-13-8-ti-nam-vong-10", "hôm nay · 13,8 tỉ năm<small>vòng: 10, 20, …, 60 tỉ năm ánh sáng</small>") : chuCanh("canh.bay-gio-ti-nam-vong-10-20-60", "«bây giờ» · {0} tỉ năm<small>vòng: 10, 20, …, 60 tỉ năm ánh sáng</small>", [so(N.tN, 1)]));
      thanTruc.dat(0, 0, yDinh, 0); thanTruc.dat(1, 0, yDinh + 0.9, 0); thanTruc.xong(2);
      dauTruc.position.set(0, yDinh + 1.0, 0);
      const rSan = R_MAX * s1;
      nhomSan.scale.set(Math.max(rSan, 1e-3), 1, Math.max(rSan, 1e-3));
      matSan.uniforms.uSang.value = s1;
      domVuNo.material.opacity = 1 - 0.75 * s1;
      nhanVuNo.position.set(rSan * Math.cos(-0.5), 0, rSan * Math.sin(-0.5) + 0.05);
      nhanVuNo.datChu(s1 < 0.5 ? chuCanh("canh.vu-no-lon-moi-khoang-cach-that-bang", "Vụ Nổ Lớn<small>mọi khoảng cách thật bằng 0</small>") : chuCanh("canh.vu-no-lon-t-0", "Vụ Nổ Lớn (t = 0)"));
      nhanTruc.position.set(0, yDinh + 1.2, 0);
      nhanTruc.datChu(s2 > 0.5 ? chuCanh("canh.thoi-gian-bao-giac-vach-tuoi-vu-tru", "thời gian bảo giác η (vạch: tuổi vũ trụ)") : chuCanh("canh.thoi-gian-vu-tru-t", "thời gian vũ trụ t"));
      for (const v of vachT) {
        const y = yTaiA(v.a);
        v.n.position.set(-0.25, y, 0.25);
        v.gach.dat(0, -0.18, y, 0); v.gach.dat(1, 0.18, y, 0); v.gach.xong(2);
      }
      nhanKC.position.set(0.2, yNay, R_MAX + 0.4);
      nhanKC.datChu(s1 < 0.5 ? chuCanh("canh.khoang-cach-that", "khoảng cách thật →") : chuCanh("canh.khoang-cach-dong-chuyen", "khoảng cách đồng chuyển →"));
      // mặt tán xạ cuối (nhìn từ hôm nay)
      const rC = Math.max(rHien(V.chiNonQuaKhu(A_CMB), A_CMB), 0.05), yC = yTaiA(A_CMB);
      for (let i = 0; i <= 128; i++) { const a = (i / 128) * 2 * Math.PI; vongCMB.dat(i, rC * Math.cos(a), yC + 0.01, rC * Math.sin(a)); }
      vongCMB.xong(129);
      daiCMB.scale.set(rC, 0.1, rC);
      daiCMB.position.y = yC + 0.06;
      nhanCMB.position.set(rC * Math.cos(-1.1), yC + 0.05, rC * Math.sin(-1.1));
      veChon();
    }

    function veChon() {
      const aN = S.aN, chi = S.chi, g = N.thienHa(chi);
      let n = 0;
      for (let i = 0; i < NA; i++) {
        const r = rHien(chi, dsA[i]);
        if (r > R_MAX) break;
        dChon.dat(n++, r, yHien(tA[i], eA[i]), 0);
      }
      dChon.xong(n);
      const rN = rHien(chi, aN), yN = yTaiA(aN);
      spChon.visible = rN <= R_MAX;
      spChon.position.set(rN, yN, 0);
      nhanNayTH._an = !(rN <= R_MAX);
      nhanNayTH.position.set(rN + 0.15, yN + 0.26, 0);
      nhanNayTH.datChu(chuCanh("canh.thien-ha-ay-cach", "thiên hà ấy {0}<small>cách {1}</small>", [aN === 1 ? chuCanh("canh.hom-nay", "hôm nay") : chuCanh("canh.luc-bay-gio", "lúc «bây giờ»"), kcChu(g.dNay)]));
      // tia sáng từ lúc phát tới ta lúc «bây giờ», dọc nón quá khứ, ở mặt phẳng φ = 0
      tiaChon.line.visible = domPhat.visible = photon.visible = g.thay;
      nhanPhat._an = !g.thay;
      if (g.thay) {
        let m = 0;
        tiaChon.dat(m++, rHien(chi, g.aPhat), yTaiA(g.aPhat), 0);
        for (let i = 0; i < NA; i++) {
          const a = dsA[i];
          if (a <= g.aPhat || a >= aN) continue;
          tiaChon.dat(m++, rHien(N.chiNon(a), a), yHien(tA[i], eA[i]), 0);
        }
        tiaChon.dat(m++, 0, yN, 0);
        tiaChon.xong(m);
        tiaDai[0] = 0;
        const d = tiaChon.diem;
        for (let i = 1; i < m; i++) tiaDai[i] = tiaDai[i - 1] + Math.hypot(d[i * 3] - d[i * 3 - 3], d[i * 3 + 1] - d[i * 3 - 2], d[i * 3 + 2] - d[i * 3 - 1]);
        const rP = rHien(chi, g.aPhat), yP = yTaiA(g.aPhat);
        domPhat.position.set(rP, yP, 0);
        nhanPhat.position.set(rP + 0.15, yP - 0.12, 0);
        nhanPhat.datChu(chuCanh("canh.phat-sang-z-luc-vu-tru", "phát sáng · z = {0}<small>lúc vũ trụ {1}</small>", [so(g.z, g.z < 10 ? 2 : 0), tuoiChu(g.tPhat)]));
      }
      datPhoton();
    }
    function datPhoton() {
      const n = tiaChon.n;
      if (n < 2) return;
      const L = tiaDai[n - 1] * photonU;
      let i = 1;
      while (i < n - 1 && tiaDai[i] < L) i++;
      const u = (L - tiaDai[i - 1]) / Math.max(1e-9, tiaDai[i] - tiaDai[i - 1]), d = tiaChon.diem;
      photon.position.set(d[i * 3 - 3] + (d[i * 3] - d[i * 3 - 3]) * u, d[i * 3 - 2] + (d[i * 3 + 1] - d[i * 3 - 2]) * u, d[i * 3 - 1] + (d[i * 3 + 2] - d[i * 3 - 1]) * u);
    }
    const tuoiChu = (t) => (t < 0.001 ? chuCanh("canh.nghin-nam-tuoi", "{0} nghìn năm tuổi", [so(t * 1e6, 0)]) : t < 1 ? chuCanh("canh.trieu-nam-tuoi", "{0} triệu năm tuổi", [so(t * 1000, 0)]) : chuCanh("canh.ti-nam-tuoi", "{0} tỉ năm tuổi", [so(t, 2)]));
    const kcChu = (d) => (d < 1 ? chuCanh("canh.trieu-nam-anh-sang", "{0} triệu năm ánh sáng", [so(d * 1000, 1)]) : chuCanh("canh.ti-nam-anh-sang", "{0} tỉ năm ánh sáng", [so(d, 2)]));

    // =====================================================================
    // Điều khiển
    // =====================================================================
    const bang = app.bang;
    const dkHe = bang.chon({
      nhan: chuCanh("canh.he-truc", "Hệ trục"),
      luaChon: [{ giaTri: 0, nhan: chuCanh("canh.that-vu-tru", "Thật × vũ trụ"), moTa: TEN_HE[0] }, { giaTri: 1, nhan: chuCanh("canh.dong-chuyen-vu-tru", "Đồng chuyển × vũ trụ"), moTa: TEN_HE[1] }, { giaTri: 2, nhan: chuCanh("canh.dong-chuyen-bao-giac", "Đồng chuyển × bảo giác"), moTa: TEN_HE[2] }],
      giaTri: 0,
      khiDoi: (v) => { S.sDich = v; },
    });
    const dkS = bang.thanhTruot({
      nhan: chuCanh("canh.tron-he-truc", "Trộn hệ trục"), min: 0, max: 2, buoc: 0.01, giaTri: 0,
      hienThi: (v) => (v < 0.01 ? chuCanh("canh.that-vu-tru-1d548d", "thật × vũ trụ") : v > 1.99 ? chuCanh("canh.dong-chuyen-bao-giac-518ffe", "đồng chuyển × bảo giác") : Math.abs(v - 1) < 0.01 ? chuCanh("canh.dong-chuyen-vu-tru-024bbb", "đồng chuyển × vũ trụ") : so(v, 2)),
      khiDoi: (v) => { S.s = v; S.sDich = null; veMoi(); },
    });
    const dkNay = bang.thanhTruot({
      nhan: chuCanh("canh.bay-gio-tuoi-vu-tru-hoac-keo-dom", "«Bây giờ»: tuổi vũ trụ (hoặc kéo đốm xanh lục trên trục)"), min: 0.8, max: T_MAX - 1, buoc: 0.01, giaTri: V.tuoi,
      hienThi: (t) => chuCanh("canh.ti-nam-bc707d", "{0} tỉ năm{1}", [so(t, 1), Math.abs(t - V.tuoi) < 0.02 ? chuCanh("canh.hom-nay-22f958", " (hôm nay)") : '']),
      khiDoi: (t) => datNay(Math.abs(t - V.tuoi) < 0.02 ? 1 : V.aTuT(t), false),
    });
    const dkZ = bang.thanhTruot({
      nhan: chuCanh("canh.thien-ha-duoc-chon-dich-chuyen-do-z", "Thiên hà được chọn: dịch chuyển đỏ z nhìn từ hôm nay"), min: 0.05, max: 1100, log: true, giaTri: S.z,
      hienThi: (v) => `z = ${so(v, v < 10 ? 2 : 0)}`,
      khiDoi: (v) => { S.z = v; S.chi = V.thienHa(v).chi; veChon(); veThe(); },
    });
    const the = bang.the('');
    const ghiChu = bang.chuThich('');
    function veThe() {
      const g = N.thienHa(S.chi), luc = S.aN === 1 ? chuCanh("canh.hom-nay", "hôm nay") : chuCanh("canh.luc-bay-gio-ti-nam", "lúc «bây giờ» ({0} tỉ năm)", [so(N.tN, 1)]);
      the.dat(g.thay
        ? chuCanh("canh.thien-ha-duoc-chon-z-nhin-anh-sang", "<b>Thiên hà được chọn</b> (z = {0} nhìn {1})<br>\n          Ánh sáng phát lúc vũ trụ <b>{2}</b>, đã đi <b>{3} tỉ năm</b>.<br>\n          Lúc phát cách ta <b>{4}</b>; {5} cách <b>{6}</b>.<br>\n          Tốc độ lùi lúc phát <b>{7} c</b>; {8} <b>{9} c</b>.<br>\n          {10}", [so(g.z, g.z < 10 ? 2 : 0), luc, tuoiChu(g.tPhat), so(g.tDiDuong, 2), kcChu(g.dPhat), luc, kcChu(g.dNay), so(g.vPhat, 2), luc, so(g.vNay, 2), g.lienLac ? chuCanh("canh.trong-chan-troi-su-kien-tin-hieu-ta", "Trong chân trời sự kiện: tín hiệu ta gửi lúc này còn tới được.") : chuCanh("canh.ngoai-chan-troi-su-kien-tin-hieu-ta", "Ngoài chân trời sự kiện: tín hiệu ta gửi lúc này không bao giờ tới.")])
        : chuCanh("canh.thien-ha-duoc-chon-nam-ngoai-chan-troi", "<b>Thiên hà được chọn</b> nằm ngoài chân trời hạt {0}: ánh sáng của nó <b>chưa kịp tới ta</b>. Kéo «bây giờ» lên để chờ ánh sáng tới.", [luc]));
    }

    const GOC = {
      toan: [[18, 10.8, 18], [0, 4.6, 0]],
      xa: [[18.5, 11, 18.5], [0, 4.4, 0]],
      ngang: [[4.2, 5.2, 27], [4.2, 5.2, 0]],
      tren: [[0.01, 32, 0.02], [0, 3, 0]],
      giot: [[2.4, 3.1, 9.2], [0.85, 2.3, 0]],
      gan: [[6.5, 6.6, 9.5], [1.8, 3.4, 0]],
    };
    const goc = (ten, giay = 1.4) => app.bayToi(GOC[ten][0], GOC[ten][1], giay);

    function capNhatGiaoDien() {
      nhomTH.visible = S.hien.th;
      nhomNay.visible = S.hien.homNay;
      nhomCMB.visible = S.hien.cmb;
      nhomChon.visible = S.hien.chon;
      for (const k of Object.keys(mat)) mat[k].g.visible = !!S.hien[k];
      dkZ.el.hidden = the.el.hidden = !S.hien.chon;
      tayTH.an(!S.hien.chon);
      ghiChu.dat(chuCanh("canh.truc-dung-thoi-gian-vach-xanh-ghi-tuoi", "Trục đứng: thời gian (vạch xanh ghi tuổi vũ trụ). Mặt ngang: khoảng cách quanh ta. Vàng: nón ánh sáng quá khứ; xanh lam: mặt cầu Hubble; tím nhạt: chân trời hạt; đỏ cam: chân trời sự kiện; trắng: thiên hà; hồng: thiên hà được chọn và (vàng đậm) tia sáng của nó tới ta. Kéo đốm xanh lục để dời «bây giờ», đốm hồng để đổi thiên hà."));
    }

    // ----- «Bây giờ» và thiên hà được chọn -----
    let gyCuoi = Math.floor(V.tuoi);
    function datNay(aN, coTieng = false) {
      aN = Math.abs(aN - 1) < 1e-6 ? 1 : kep(aN, A_NAY_MIN, A_NAY_MAX);
      if (aN === S.aN && N.aN === aN) return;
      S.aN = aN;
      N = nhinTuLuc(V, aN);
      dkNay.dat(N.tN);
      if (coTieng) { const gy = Math.floor(N.tN); if (gy !== gyCuoi) am.tich({ tanSo: 1500, doTo: 0.16, dai: 0.03 }); gyCuoi = gy; }
      else gyCuoi = Math.floor(N.tN);
      veMoi(); veThe();
    }
    // trạng thái để báo nốt khi thiên hà vượt mặt cầu Hubble hoặc chân trời sự kiện (lúc «bây giờ»)
    let phiaSK = true, phiaHB = true;
    function datChi(chi, coTieng = false) {
      chi = kep(chi, 0.3, Math.min(N.chanTroiHat * 0.998, D_MAX / Math.max(1e-6, S.aN + (1 - S.aN) * s1)));
      S.chi = chi;
      const z = V.zTaiChi(chi);
      S.z = Number.isFinite(z) ? kep(z, 0.05, 1100) : 1100;
      dkZ.dat(S.z);
      const trongSK = chi < N.chanTroiSuKien, trongHB = chi < N.chiHubble;
      if (coTieng) {
        if (trongSK !== phiaSK) am.not(trongSK ? { tanSo: 587.3, dai: 0.9, doTo: 0.4, dang: 'chuong' } : { tanSo: 146.8, dai: 1.4, doTo: 0.5, dang: 'day' });
        else if (trongHB !== phiaHB) am.not({ tanSo: trongHB ? 880 : 440, dai: 0.5, doTo: 0.22, dang: 'kinh' });
      }
      phiaSK = trongSK; phiaHB = trongHB;
      veChon(); veThe();
    }
    const _w0 = new THREE.Vector3(), _ra = new THREE.Vector3();
    // điểm trên đường ngang {(x, y«bây giờ», 0)} gần tia chuột nhất
    function chieuNgang(tia) {
      const yN = yTaiA(S.aN);
      _w0.set(0, yN, 0).sub(tia.origin);
      const b = tia.direction.x, dw = tia.direction.dot(_w0), uw = _w0.x;
      const mau = 1 - b * b;
      const s = mau > 1e-6 ? (b * dw - uw) / mau : -uw;
      return _ra.set(s, yN, 0);
    }
    const tayNay = tt.tayNam({
      viTri: [0, yTaiA(1), 0], mau: MAU_KTG.hienTai, co: 0.15,
      rangBuoc: { kieu: 'duong', qua: [0, 0, 0], huong: [0, 1, 0] },
      gioiHan: (p) => { p.x = 0; p.z = 0; p.y = kep(p.y, yTaiA(A_NAY_MIN), yTaiA(A_NAY_MAX)); return p; },
      nhan: chuCanh("canh.keo-bay-gio-len-xuong", "Kéo «bây giờ» lên xuống"), ten: chuCanh("canh.bay-gio-a60bf6", "«Bây giờ»"),
      moTa: () => chuCanh("canh.tuoi-vu-tru-ti-nam-a-chan-troi", "Tuổi vũ trụ <b>{0} tỉ năm</b> (a = {1})<br>Chân trời hạt cách <b>{2}</b>, chân trời sự kiện <b>{3}</b>, mặt cầu Hubble <b>{4}</b> tỉ năm ánh sáng (khoảng cách thật)", [so(N.tN, 2), so(S.aN, 3), so(N.dChanTroiHat, 1), so(N.dChanTroiSuKien, 1), so(N.dHubble, 1)]),
      khiKeo: (p) => datNay(aTuY(p.y), true),
    });
    let giong = null;
    const tatGiong = () => { if (giong) { giong.tat(0.35); giong = null; } };
    const tayTH = tt.tayNam({
      viTri: [rHien(S.chi, 1), yTaiA(1), 0], mau: MAU_TH, co: 0.13,
      rangBuoc: { kieu: 'ham', chieu: (tia) => chieuNgang(tia) },
      gioiHan: (p) => { p.z = 0; p.y = yTaiA(S.aN); p.x = kep(p.x, 0.02, R_MAX); return p; },
      nhan: chuCanh("canh.keo-thien-ha-ra-xa-lai-gan", "Kéo thiên hà"), ten: chuCanh("canh.thien-ha-duoc-chon", "Thiên hà được chọn"),
      moTa: () => { const g = N.thienHa(S.chi); return g.thay ? chuCanh("canh.z-luc-phat-cach-lui-c", "z = {0} · lúc phát cách {1}, lùi {2} c<br>{3}", [so(g.z, g.z < 10 ? 2 : 0), kcChu(g.dPhat), so(g.vPhat, 2), g.lienLac ? chuCanh("canh.con-lien-lac-duoc-voi-ta", "Còn liên lạc được với ta") : chuCanh("canh.ngoai-chan-troi-su-kien-khong-bao-gio", "Ngoài chân trời sự kiện: không bao giờ liên lạc được nữa")]) : chuCanh("canh.anh-sang-chua-kip-toi-ta", "Ánh sáng chưa kịp tới ta"); },
      khiNam: () => { if (!giong) giong = am.giong({ dang: 'mem', tanSo: TIENG_GOC_4C, doTo: 0 }); },
      khiKeo: (p) => datChi(p.x / (KX * (S.aN + (1 - S.aN) * s1)), true),
      khiTha: () => tatGiong(),
    });
    // rê chuột lên các mặt: tên và con số
    const moTaMat = {
      non: () => chuCanh("canh.moi-su-kien-ma-anh-sang-cua-chung", "Mọi sự kiện mà ánh sáng của chúng tới ta đúng {0}. Vẽ bằng khoảng cách thật thì phình ra rồi khép lại: hình giọt nước.", [S.aN === 1 ? chuCanh("canh.hom-nay", "hôm nay") : chuCanh("canh.luc-bay-gio", "lúc «bây giờ»")]),
      nonTL: () => chuCanh("canh.duong-di-cua-tin-hieu-ta-phat-ra", "Đường đi của tín hiệu ta phát ra lúc «bây giờ». Nó tiến sát mãi tới chân trời sự kiện mà không vượt qua."),
      hubble: () => chuCanh("canh.noi-toc-do-lui-bang-dung-c-luc", "Nơi tốc độ lùi bằng đúng c. Lúc «bây giờ»: c/H = <b>{0}</b> tỉ năm ánh sáng.", [so(N.dHubble, 2)]),
      hat: () => chuCanh("canh.mep-vu-tru-quan-sat-duoc-luc-bay", "Mép vũ trụ quan sát được. Lúc «bây giờ» cách ta <b>{0}</b> tỉ năm ánh sáng (khoảng cách thật).", [so(N.dChanTroiHat, 1)]),
      sk: () => chuCanh("canh.tin-hieu-gui-luc-bay-gio-chi-toi", "Tín hiệu gửi lúc «bây giờ» chỉ tới được thiên hà gần hơn <b>{0}</b> tỉ năm ánh sáng (khoảng cách thật).", [so(N.dChanTroiSuKien, 1)]),
    };
    const tenMat = { non: chuCanh("canh.non-anh-sang-qua-khu", "Nón ánh sáng quá khứ"), nonTL: chuCanh("canh.non-anh-sang-tuong-lai", "Nón ánh sáng tương lai"), hubble: chuCanh("canh.mat-cau-hubble", "Mặt cầu Hubble"), hat: chuCanh("canh.chan-troi-hat", "Chân trời hạt"), sk: chuCanh("canh.chan-troi-su-kien", "Chân trời sự kiện") };
    const mauMat = { non: MAU_NON, nonTL: MAU_NON, hubble: MAU_HUBBLE, hat: MAU_HAT, sk: MAU_SK };
    for (const k of Object.keys(mat)) tt.them(mat[k].mesh, { ten: tenMat[k], mau: mauMat[k], moTa: moTaMat[k], noiBat: false });

    function cauHinh(o = {}) {
      if (o.nhan) S.nhan = { vach: false, th: false, vuNo: false, kc: false, chinh: null, ...o.nhan };
      if (o.hud) S.hud = o.hud;
      if (o.hien) S.hien = { th: false, homNay: false, non: false, nonTL: false, hubble: false, hat: false, sk: false, chon: false, cmb: false, ...o.hien };
      if (o.s != null) { S.s = o.s; S.sDich = null; dkS.dat(S.s); dkHe.dat(Math.round(S.s)); }
      if (o.sDich != null) { S.sDich = o.sDich; dkHe.dat(o.sDich); }
      if (o.aN != null) { S.aN = -1; datNay(o.aN); }
      if (o.z != null) { S.z = o.z; S.chi = V.thienHa(o.z).chi; dkZ.dat(o.z); }
      capNhatGiaoDien();
      [s1, s2] = heSo();
      datChi(S.chi);
      veMoi(); veThe();
      if (o.mayAnh) goc(o.mayAnh);
    }
    cauHinh({});

    // gỡ nhãn đè nhau (vài lần mỗi giây)
    const hienThat = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    // Vật chính của bước: 90 và giữ; vật lời giảng nhắc: 60–80 (vạch tuổi chỉ hiện ở bước giảng trục thời gian nên cũng 65). Vòng số 10…60 đã ghi ở nhãn «hôm nay» nên tắt.
    const dsNhan = () => {
      const c = S.nhan.chinh;
      return [
        { nhan: nhanPhat, uuTien: 80 }, { nhan: nhanNayTH, uuTien: 78 },
        { nhan: nhanTa, uuTien: 75 }, { nhan: nhanTruc, uuTien: 65 },
        ...nhanMat.map((k) => ({ nhan: k.n, uuTien: k.m === c ? 90 : 70, giu: k.m === c, tat: S.nhan.tatMat?.includes(k.m) })),
        { nhan: nhanCMB, uuTien: c === 'cmb' ? 90 : 70, giu: c === 'cmb' }, { nhan: nhanNay, uuTien: 62 },
        { nhan: nhanVuNo, uuTien: 60, tat: !S.nhan.vuNo }, { nhan: nhanKC, uuTien: 60, tat: !S.nhan.kc },
        ...vachT.map((v) => ({ nhan: v.n, uuTien: 65, tat: !S.nhan.vach })),
        { nhan: nhanTH, uuTien: c === 'th' ? 90 : 60, giu: c === 'th', tat: !S.nhan.th },
        ...nhanVong.map((n) => ({ nhan: n, uuTien: 10, tat: true })),
      ];
    };
    let choNhan = 0;
    function goNhan() {
      const ds = dsNhan();
      for (const k of ds) { k.nhan.visible = true; k.tat = k.tat || !hienThat(k.nhan.parent) || k.nhan._an; }
      goNhanDeNhau(ds, app.camera, app.rong, app.cao);
    }

    // Tham số riêng khi chụp kiểm thử (chỉ đọc ở chế độ im lặng): thu=giot | v2 | nua | sk | qua-khu.
    let daThu = false;
    function datTrangThaiThu() {
      if (!app.imLang) return;
      const thu = new URLSearchParams(location.search).get('thu');
      if (!thu) return;
      const chiTheoZ = (ham, dich, lo = 0.5, hi = 20) => { for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2; if (ham(V.thienHa(m)) < dich) lo = m; else hi = m; } return V.thienHa((lo + hi) / 2).chi; };
      if (thu === 'giot') datChi(V.thienHa(V.cucDaiNon().z).chi);
      else if (thu === 'v2') datChi(chiTheoZ((g) => g.vPhat, THU_THACH_4C.v2.v));
      else if (thu === 'nua') { let lo = 0.05, hi = 1; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (m * V.etaTai(m) < THU_THACH_4C.hatNua.d) lo = m; else hi = m; } datNay(lo); }
      else if (thu === 'sk') datChi(V.chanTroiSuKien + 0.7);
      else if (thu === 'qua-khu') datNay(V.aTuT(5));
    }

    function capNhat(dt, dtThuc) {
      if (!daThu) { daThu = true; datTrangThaiThu(); }
      gioMat.value = performance.now() * 0.001;
      choNhan -= dtThuc || dt;
      if (choNhan <= 0) { choNhan = 0.2; goNhan(); }
      if (S.sDich != null) {
        const d = S.sDich - S.s;
        const b = Math.sign(d) * Math.min(Math.abs(d), (dtThuc || dt) * 0.6);
        S.s += b;
        if (Math.abs(S.sDich - S.s) < 1e-4) { S.s = S.sDich; S.sDich = null; }
        dkS.dat(S.s);
        veMoi();
      }
      // tay nắm bám theo mô hình khi không bị kéo
      if (!tt.dangKeo) {
        tayNay.dat([0, yTaiA(S.aN), 0]);
        tayTH.dat([rHien(S.chi, S.aN), yTaiA(S.aN), 0]);
      }
      // «photon» chạy dọc tia sáng từ thiên hà tới ta (minh hoạ, không theo tỉ lệ thời gian)
      if (dt > 0 && tiaChon.line.visible) { photonU = (photonU + dt * 0.22) % 1; datPhoton(); }
      // âm kéo dài khi kéo thiên hà: cao độ 660/(1 + z); im khi tạm dừng
      if (giong) {
        const g = N.thienHa(S.chi);
        giong.dat(dt > 0 ? { tanSo: g.thay ? tanSoTieng4c(g.z) : 60, doTo: g.thay ? 0.22 : 0 } : { doTo: 0 });
      }
    }

    function hud() {
      const g = N.thienHa(S.chi), nay = S.aN === 1;
      const d = [];
      for (const ten of S.hud) {
        if (d.length >= 5) break;
        if (ten === 'tuoi') d.push([nay ? chuCanh("canh.tuoi-vu-tru-hom-nay", "Tuổi vũ trụ hôm nay") : chuCanh("canh.tuoi-vu-tru-bay-gio", "Tuổi vũ trụ «bây giờ»"), chuCanh("canh.ti-nam-4c", "{0} tỉ năm", [so(N.tN, 2)])]);
        else if (ten === 'he') d.push([chuCanh("canh.he-truc", "Hệ trục"), S.s < 0.01 ? TEN_HE[0] : S.s > 1.99 ? TEN_HE[2] : Math.abs(S.s - 1) < 0.01 ? TEN_HE[1] : chuCanh("canh.dang-chuyen", "đang chuyển ({0})", [so(S.s, 2)])]);
        else if (ten === 'hubble') d.push([chuCanh("canh.mat-cau-hubble-c-h", "Mặt cầu Hubble (c/H)"), kcChu(N.dHubble)]);
        else if (ten === 'hat') d.push([chuCanh("canh.chan-troi-hat", "Chân trời hạt"), chuCanh("canh.ti-nam-anh-sang", "{0} tỉ năm ánh sáng", [so(N.dChanTroiHat, 1)])]);
        else if (ten === 'sk') d.push([chuCanh("canh.chan-troi-su-kien", "Chân trời sự kiện"), chuCanh("canh.ti-nam-anh-sang", "{0} tỉ năm ánh sáng", [so(N.dChanTroiSuKien, 1)])]);
        else if (!S.hien.chon) continue;
        else if (ten === 'z') d.push([chuCanh("canh.thien-ha-duoc-chon", "Thiên hà được chọn"), g.thay ? chuCanh("canh.z-bang", "z = {0}", [so(g.z, g.z < 10 ? 2 : 0)]) : chuCanh("canh.anh-sang-chua-kip-toi-ta-f7a0a3", "ánh sáng chưa kịp tới ta")]);
        else if (ten === 'phat' && g.thay) d.push([chuCanh("canh.phat-sang-luc-vu-tru", "Phát sáng lúc vũ trụ"), tuoiChu(g.tPhat)]);
        else if (ten === 'dPhat' && g.thay) d.push([chuCanh("canh.luc-phat-cach-ta", "Lúc phát, cách ta"), kcChu(g.dPhat)]);
        else if (ten === 'dNay') d.push([nay ? chuCanh("canh.hom-nay-cach-ta", "Hôm nay cách ta") : chuCanh("canh.bay-gio-cach-ta", "«Bây giờ» cách ta"), kcChu(g.dNay)]);
        else if (ten === 'vNay') d.push([nay ? chuCanh("canh.hom-nay-lui-xa", "Hôm nay lùi xa") : chuCanh("canh.bay-gio-lui-xa", "«Bây giờ» lùi xa"), chuCanh("canh.c-4c", "{0} c", [so(g.vNay, 2)])]);
        else if (ten === 'lienLac') d.push([chuCanh("canh.tin-hieu-ta-gui-toi", "Tín hiệu ta gửi tới"), g.lienLac ? chuCanh("canh.con-lien-lac-duoc", "còn liên lạc được") : chuCanh("canh.ngoai-chan-troi-su-kien", "ngoài chân trời sự kiện")]);
      }
      if (giong && d.length < 5) d.push([chuCanh("canh.am-khi-keo-quy-doi", "Âm khi kéo (quy đổi)"), g.thay ? `${so(tanSoTieng4c(g.z), 0)} Hz = 660/(1 + z)` : chuCanh("canh.im-chua-thay", "im: chưa thấy")]);
      return d;
    }

    // Trạng thái đọc được (thử thách và bộ kiểm dùng).
    function trangThai() {
      const g = N.thienHa(S.chi);
      return { homNay: S.aN === 1, aN: S.aN, tN: N.tN, chi: S.chi, g, dChanTroiHat: N.dChanTroiHat, chanTroiSuKien: N.chanTroiSuKien };
    }

    return {
      scene, capNhat, hud, cauHinh, goc, trangThai,
      datZ: (z) => { S.z = z; S.chi = V.thienHa(z).chi; dkZ.dat(z); datChi(S.chi); },
      datHe: (h) => { S.sDich = h; dkHe.dat(h); },
      im: () => tatGiong(),
      huy: () => tatGiong(),
    };
  },
};

// Ảnh thiên hà xoắn nhỏ (vẽ một lần bằng canvas): lõi vàng, hai nhánh xoắn lô-ga xanh trắng, vài đốm hồng; hơi nghiêng.
function texThienHa() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const rnd = taoNgauNhien(41);
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,238,205,1)');
  gr.addColorStop(0.08, 'rgba(255,224,170,0.65)');
  gr.addColorStop(0.3, 'rgba(160,180,255,0.14)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.translate(64, 64); g.scale(1, 0.62); g.translate(-64, -64);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1600; i++) {
    const nhanh = i % 2;
    const r = 5 + 52 * Math.pow(rnd(), 0.85);
    const th = nhanh * Math.PI + Math.log(r / 5) / 0.36 + (rnd() - 0.5 + (rnd() - 0.5)) * 0.42;
    const x = 64 + r * Math.cos(th), y = 64 + r * Math.sin(th);
    const hong = rnd() < 0.05;
    const k = 0.5 + 0.5 * (1 - r / 60);
    g.fillStyle = hong ? `rgba(255,120,170,${0.55 * k})` : `rgba(${190 + 50 * k | 0},${205 + 40 * k | 0},255,${0.22 * k})`;
    const s = hong ? 1.6 : 0.6 + rnd() * 1.1;
    g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
