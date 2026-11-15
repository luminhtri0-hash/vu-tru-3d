import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 13 — Quỹ đạo: đường trắc địa của vật có khối lượng quanh một lỗ đen (hay một ngôi sao).
// Đơn vị: rs = 1 (M = 1/2), c = 1. Tích phân theo thời gian riêng của vật (vat-ly/schwarzschild.js).
// Hai cách xem:
//   «mat»  quỹ đạo vẽ trên mặt Flamm (hình dạng thật của không gian, Bài 11);
//   «ktg»  bỏ độ cong của không gian, lấy chiều đứng làm thời gian của đồng hồ ở xa:
//          quỹ đạo hiện ra là một đường thế giới hình lò xo, chân trời là một ống thẳng đứng.

import * as THREE from 'three';
import { so, soNghia, R_MAT_TROI_KM, RS_MAT_TROI_M } from '../vat-ly/hang-so.js';
import { LEtuPE, buocHat, tienDongChinhXac, tienDongXapXi, nhipDongHoQuyDao } from '../vat-ly/schwarzschild.js';
import { phanLoai, tuVanToc, vanTocNgangTuEL, vanTocTron, vanTocThoat, TT_XOAY_90, TT_ROI_RA, F_GOC, tanSoTocDo } from '../vat-ly/phong-quy-dao.js';
import { MatCong, vongTrenMat } from '../khung/mat-cong.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, donViMoiDiemAnh, kep } from '../khung/ve.js';
import { khungDoThi, MAU } from '../khung/giao-dien.js';
import { muiTen } from '../khung/ktg.js';
import { taoLoDenNho, taoMatTroi, taoSao, taoHanhTinh } from '../khung/hanh-tinh.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('quy-dao', khoa, goc, thamSo);

const R = String.raw;
const M = 0.5;
const DO = Math.PI / 180;
const MAU_SAN = [
  { id: 'manh', ten: chuCanh("canh.sat-lo-den", "Sát lỗ đen"), p: 14, e: 0.45 },
  { id: 'hoa', ten: chuCanh("canh.hoa-thi", "Hoa thị"), p: 9.4, e: 0.6 },
  { id: 'xoay', ten: chuCanh("canh.luon-sat-roi-vang-ra", "Lượn sát rồi văng ra"), p: 7.26, e: 0.6 },
  { id: 'isco', ten: chuCanh("canh.quy-dao-tron-trong-cung", "Quỹ đạo tròn trong cùng"), p: 6.004, e: 0 },
  { id: 'roi', ten: chuCanh("canh.roi-vao-lo-den", "Rơi vào lỗ đen"), roi: { r0: 12, L: 1.75 } },
  { id: 's2', ten: chuCanh("canh.sao-s2-quanh-sgr-a", "Sao S2 quanh Sgr A*"), p: 5331, e: 0.8846, chuKyNam: 16.05, tam: chuCanh("canh.sagittarius-a", "Sagittarius A*"), vong: 20 },
  { id: 'thuy', ten: chuCanh("canh.sao-thuy-quanh-mat-troi", "Sao Thủy quanh Mặt Trời"), p: 3.755e7, e: 0.2056, chuKyNam: 0.2408467, tam: chuCanh("canh.mat-troi", "Mặt Trời"), vong: 2e5 },
];
const N_LS = 4195;          // số điểm tối đa của vệt (và của đường thế giới)
const PHI0 = 2.6;           // quỹ đạo sát lỗ đen bắt đầu (và tự phóng) ở phía trái, xa người xem: tránh bảng bài giảng

function goc(rad) {
  const d = Math.abs(rad) / DO;
  if (d >= 1) return `${so(d, 1)}°`;
  if (d * 60 >= 1) return `${so(d * 60, 1)}′`;
  return `${soNghia(d * 3600, 3)}″`;
}

export default {
  id: 'quy-dao',
  ten: 'Quỹ đạo: đi thẳng trong không-thời gian cong',
  moTa: 'Elip của Newton tự xoay dần: Sao Thủy, sao S2, quỹ đạo sát lỗ đen',
  yChinh: 'Hành tinh không bị «kéo» vào Mặt Trời; nó đi theo **đường trắc địa**, đường thẳng nhất có thể trong không-thời gian cong. Vòng quỹ đạo ta thấy là bóng của một đường thế giới hình lò xo. Newton nói quỹ đạo là elip khép kín; Einstein thêm một số hạng nhỏ làm elip tự xoay dần, và sát lỗ đen thì không còn quỹ đạo tròn bền nào bên trong 3 rs.',
  giaiThich: R`
    - Quỹ đạo là bóng trong không gian của một đường trắc địa bốn chiều (Bài 10).
    - Metric Schwarzschild không đổi theo thời gian và khi quay quanh tâm, nên có hai đại lượng bảo toàn: năng lượng $E$ và mô-men động lượng $L$.
    - Thế hiệu dụng của Einstein có thêm số hạng $-GML^2/(c^2r^3)$. Nó làm elip xoay một góc $\Delta\varphi = 6\pi GM/[c^2a(1-e^2)]$ sau mỗi vòng.
    - Sao Thủy: 42,98″ mỗi thế kỷ (Einstein, tháng 11/1915). Sao S2: khoảng 12′ mỗi vòng (GRAVITY 2020).
    - Quanh lỗ đen không quay, quỹ đạo tròn bền trong cùng ở 3 rs; khí xoáy vào tới đó giải phóng 5,7% khối lượng nghỉ.`,
  mayAnh: { viTri: [0, 14, 22], dich: [0, -1, 0], fov: 42, min: 1, max: 1e9 },

  baiGiang: {
    mucTieu: [
      'Giải thích được vì sao quỹ đạo là bóng của một đường trắc địa trong không-thời gian bốn chiều.',
      'Nói được hai đại lượng bảo toàn $E$, $L$ đến từ đâu và đọc được đồ thị thế hiệu dụng.',
      'Tính được tiến động cận điểm của Sao Thủy bằng công thức $6\\pi GM/[c^2a(1-e^2)]$.',
      'Giải thích được vì sao quanh lỗ đen có quỹ đạo tròn bền trong cùng ở 3 rs và vì sao đĩa khí có mép trong.',
      'Phân biệt được thời gian của đồng hồ ở xa và thời gian riêng của vật khi nó rơi vào lỗ đen.',
    ],
    buoc: [
      {
        ten: 'Quỹ đạo là bóng của một đường thế giới',
        noiDung: R`
          Bạn đang nhìn một vật bay quanh lỗ đen, vẽ theo cách của Bài 4. Mặt lưới nằm ngang là không gian **lúc này** (bỏ bớt một chiều). Chiều đứng là **thời gian** đo bằng đồng hồ ở rất xa; càng xuống thấp là càng về quá khứ.

          Đường xanh sáng chui xuống dưới là {{đường thế giới}} của vật: một chiếc lò xo. Ống màu đỏ cam ở giữa là {{chân trời sự kiện}} theo thời gian. Vệt mờ trên mặt lưới là cái bóng của lò xo, thứ ta vẫn gọi là quỹ đạo.

          Bài 10 đã cho thấy: vật {{rơi tự do}} đi theo {{đường trắc địa}}, đường «thẳng nhất» của không-thời gian, tức đường làm thời gian riêng dài nhất. Hành tinh cũng chỉ đang rơi tự do. Không có sợi dây nào kéo nó; nó đi thẳng trong không-thời gian cong, và cái bóng của đường thẳng ấy trong không gian là một vòng gần kín.

          > [Lưu ý] Hình bỏ một chiều không gian và **nén trục thời gian** để mỗi vòng lò xo vừa khung hình. Ở tỉ lệ thật, lò xo duỗi gần như thẳng như ở Bài 4.

          > [Thử ngay] [[Xem đường thế giới|ktg]] [[Xem bóng trên mặt Flamm|mat]] [[Nhìn từ trên xuống|tren]]`,
        vao: (c) => c.cauHinh({ mau: 'manh', che: 'ktg', goc: 'cheo', phong: false }),
        ra: (c) => c.imTieng(),
        nut: {
          ktg: (c) => c.cauHinh({ che: 'ktg', goc: 'cheo' }),
          mat: (c) => c.cauHinh({ che: 'mat', goc: 'cheo' }),
          tren: (c) => c.cauHinh({ goc: 'tren' }),
        },
      },
      {
        ten: 'Metric Schwarzschild và hai đại lượng bảo toàn',
        noiDung: R`
          Giờ quỹ đạo nằm trên **mặt Flamm** của Bài 11. Muốn tính đường đi, ta cần «bản đồ khoảng cách» của không-thời gian quanh khối lượng: {{metric Schwarzschild}}. Trong mặt phẳng quỹ đạo:

          $$ \dd s^2 = -\Big(1-\frac{r_s}{r}\Big)c^2\dd t^2 + \frac{\dd r^2}{1-r_s/r} + r^2\dd\varphi^2 $$

          $t$ là thời gian của đồng hồ ở rất xa, $r$ là bán kính (chu vi vòng tròn chia $2\pi$), $\varphi$ là góc quanh tâm, $r_s = 2GM/c^2$ là bán kính Schwarzschild. Số hạng đầu là thời gian cong (Bài 9), số hạng thứ hai là không gian cong (Bài 11).

          Các hệ số không đổi theo $t$ và không đổi theo $\varphi$. Hai sự đối xứng ấy cho hai đại lượng **giữ nguyên suốt quỹ đạo**:

          $$ E = \Big(1-\frac{r_s}{r}\Big)\frac{\dd t}{\dd\tau}, \qquad L = r^2\,\frac{\dd\varphi}{\dd\tau} $$

          $\tau$ là {{thời gian riêng}} của vật. $E$ là {{năng lượng riêng}} (tính theo $mc^2$), $L$ là {{mô-men động lượng riêng}}. Với quỹ đạo đang chạy: $E = 0{,}973$ và $L = 2{,}13\,r_s c$. $E$ nhỏ hơn 1 nghĩa là vật **bị giữ lại**, không bay ra xa được.

          > [Thử ngay] Ô số liệu góc dưới trái so đồng hồ của vật với đồng hồ ở xa: đồng hồ của vật luôn chậm hơn. [[Nhìn từ trên xuống|tren]] [[Nhìn chéo|cheo]]

          > [Lưu ý] **Âm thanh**: một nốt kéo dài đi theo tốc độ của vật. Tần số bằng 200 Hz nhân với tỉ số tốc độ (so với lúc ở điểm xa nhất) mũ 0,6, nên nốt vút lên mỗi lần vật lao qua điểm gần nhất và trầm xuống khi ra xa. Mỗi lần qua điểm gần nhất có thêm một tiếng chuông. Đây là quy đổi cho tai nghe; mũ 0,6 nén dải tốc độ cho dễ nghe.

          +++ Đi sâu: vì sao đối xứng sinh ra đại lượng bảo toàn
          Đường trắc địa là đường làm thời gian riêng $\tau = \int \sqrt{-\dd s^2}/c$ dài nhất. Viết $\dot{x} = \dd x/\dd\tau$ và dùng đơn vị $c = 1$. Hàm cần làm cực trị là

          $$ \mathcal{L} = -\Big(1-\frac{r_s}{r}\Big)\dot t^2 + \frac{\dot r^2}{1-r_s/r} + r^2\dot\varphi^2 $$

          Phương trình Euler–Lagrange cho $t$: $\frac{\dd}{\dd\tau}\big(\partial\mathcal{L}/\partial\dot t\big) = \partial\mathcal{L}/\partial t = 0$, vì $\mathcal{L}$ không chứa $t$. Vậy $(1-r_s/r)\,\dot t$ không đổi: đó là $E$. Lập luận y hệt cho $\varphi$ cho $r^2\dot\varphi = L$.

          Còn một hệ thức nữa: vận tốc bốn chiều có «độ dài» cố định, $\mathcal{L} = -1$. Thay $\dot t = E/(1-r_s/r)$ và $\dot\varphi = L/r^2$ vào:

          $$ \dot r^2 = E^2 - \Big(1-\frac{r_s}{r}\Big)\Big(1+\frac{L^2}{r^2}\Big) $$

          Kiểm bằng số ở điểm gần nhất $r = 4{,}83\,r_s$: $(1 - 1/4{,}83)(1 + 4{,}54/23{,}3) = 0{,}947 = 0{,}973^2$. Đúng: ở đó vật thôi đi vào, $\dot r = 0$.
          +++`,
        vao: (c) => c.cauHinh({ mau: 'manh', che: 'mat', goc: 'cheo', phong: false }),
        ra: (c) => c.imTieng(),
        nut: { tren: (c) => c.cauHinh({ goc: 'tren' }), cheo: (c) => c.cauHinh({ goc: 'cheo' }) },
      },
      {
        ten: 'Thế hiệu dụng: Einstein thêm một số hạng',
        noiDung: R`
          Nhìn đồ thị nhỏ ở mục **Điều khiển mô hình** bên dưới. Hệ thức cuối của bước trước viết lại được như chuyển động của một hòn bi trên một con dốc:

          $$ \frac12\Big(\frac{\dd r}{\dd\tau}\Big)^2 + V(r) = \frac{E^2-1}{2} $$

          $$ V(r) = -\frac{GM}{r} + \frac{L^2}{2r^2} - \frac{GML^2}{c^2r^3} $$

          $V(r)$ là {{thế hiệu dụng}}. Hai số hạng đầu y hệt Newton: hút vào $-GM/r$ và «ly tâm» $L^2/2r^2$ đẩy ra. Số hạng thứ ba là **phần mới của Einstein**. Nó luôn kéo vào và mạnh rất nhanh khi $r$ nhỏ.

          Trên đồ thị: đường xám là Newton, đường xanh là Einstein, vạch vàng là mức năng lượng. Vật chỉ ở được nơi đường xanh nằm dưới vạch vàng, và chạy qua lại giữa hai mép ấy.

          > [Con số] Số hạng mới chia số hạng ly tâm đúng bằng $r_s/r$. Ở 7 rs nó bằng 1/7. Ở Sao Thủy nó chỉ bằng khoảng **một phần hai mươi triệu**.

          > [Thử ngay] Kéo đầu mũi tên vàng (vận tốc lúc phóng) rồi buông tay để tự phóng vật; kéo đốm vàng ở gốc mũi tên để đổi chỗ phóng. Trong lúc kéo, nét đứt cho thấy đường vật sẽ đi; buông tay thì vạch năng lượng trên đồ thị đổi theo.
          > [[Quỹ đạo hoa thị|hoa]] [[Quỹ đạo sát lỗ đen|manh]]

          +++ Đi sâu: từ hệ thức của bước trước tới $V(r)$, và vì sao elip không khép
          Khai triển: $(1-r_s/r)(1+L^2/r^2) = 1 - r_s/r + L^2/r^2 - r_sL^2/r^3$. Trừ 1, chia 2, thay $r_s = 2GM/c^2$ (ở đây $c = 1$) là ra $V(r)$ ở trên.

          Theo Newton, thời gian vật đi từ điểm gần nhất ra điểm xa nhất rồi quay về **đúng bằng** thời gian quay một vòng. Đây là tính chất riêng của lực tỉ lệ $1/r^2$, nên elip khép kín.

          Với quỹ đạo gần tròn bán kính $r$, Einstein cho: tần số dao động ra vào $\kappa$ và tần số quay $\Omega$ thỏa

          $$ \kappa^2 = \Omega^2\Big(1 - \frac{3r_s}{r}\Big) $$

          Dao động ra vào chậm hơn vòng quay, nên giữa hai lần qua điểm gần nhất vật quét được góc $2\pi/\sqrt{1-3r_s/r}$, nhiều hơn một vòng. Phần dư xấp xỉ $3\pi r_s/r = 6\pi GM/(c^2r)$. Ở $r = 3\,r_s$ thì $\kappa = 0$: dao động ra vào không còn, quỹ đạo tròn hết bền (bước 7).
          +++`,
        vao: (c) => c.cauHinh({ mau: 'manh', che: 'mat', goc: 'cheo', phong: true }),
        ra: (c) => c.imTieng(),
        nut: { hoa: (c) => c.cauHinh({ mau: 'hoa' }), manh: (c) => c.cauHinh({ mau: 'manh' }) },
        thuThach: {
          de: 'Tự phóng vật cho nó chạy **gần tròn**: tâm sai dưới 0,08 (xem thẻ «Tự phóng» ở bảng điều khiển).',
          kiem: (c) => c.ttTron(),
          giu: 0.4,
          goiY: 'Mũi tên phải nằm ngang (vuông góc với bán kính) và dài đúng tốc độ quỹ đạo tròn ở chỗ phóng; rê chuột lên đốm gốc mũi tên để xem con số. Ở chỗ phóng mặc định (12,7 r<sub>s</sub>) là khoảng 20,6% c. Khi đạt, vạch năng lượng trên đồ thị nằm sát đáy hố.',
        },
      },
      {
        ten: 'Tiến động cận điểm: Sao Thủy',
        noiDung: R`
          Mô hình đang chiếu **Sao Thủy**. Đường xám đứt nét là elip Newton; đường xanh là elip Einstein, đang xoay rất chậm. Điểm gần Mặt Trời nhất (cận nhật) dịch dần: đó là {{tiến động cận điểm}}.

          $$ \Delta\varphi = \frac{6\pi GM}{c^2a(1-e^2)} $$

          $\Delta\varphi$ là góc xoay sau mỗi vòng, $a$ là bán trục lớn, $e$ là tâm sai (độ dẹt), $GM/c^2$ của Mặt Trời là 1,477 km.

          > [Ví dụ] Sao Thủy: $a = 57{,}9$ triệu km, $e = 0{,}2056$. Thay số: $\Delta\varphi = 6\pi \times 1{,}477 / (57{,}9\times10^6 \times 0{,}958) \approx 5{,}0\times10^{-7}$ rad $= 0{,}1035″$ mỗi vòng. Một thế kỷ có 415,2 vòng, cộng lại **42,98″**. Phải khoảng 3 triệu năm elip mới xoay đủ một vòng.

          > [Lịch sử] Năm 1859 Urbain Le Verrier, người đã tiên đoán ra Sao Hải Vương, thấy cận nhật Sao Thủy xoay nhanh hơn mức mà các hành tinh khác kéo được theo Newton. Phần dư, về sau chốt ở khoảng 43″ mỗi thế kỷ, không ai giải thích được; ông còn đoán có một hành tinh ẩn tên Vulcan, nhưng không ai tìm thấy. Tháng 11/1915 Einstein tính bằng lý thuyết mới và ra đúng 43″, không cần chỉnh tham số nào.

          > [Lưu ý] Mô hình đang tua cực nhanh: hàng trăm nghìn vòng mỗi giây. Hình dạng elip đúng tỉ lệ thật; Mặt Trời và Sao Thủy vẽ to hơn thật nhiều lần để nhìn thấy. Vệt sáng mờ dần sau elip là những chỗ elip vừa đi qua. Chấm Sao Thủy chạy nhanh ở gần Mặt Trời, chậm ở xa như thật, nhưng nhịp chạy đã làm chậm hẳn so với tốc độ tua của elip.
          > [[Tua 200 000 vòng mỗi giây|cham]] [[Tua 5 triệu vòng mỗi giây|nhanh]]

          +++ Đi sâu: suy ra công thức từ phương trình quỹ đạo
          Đặt $u = 1/r$, đổi biến từ $\tau$ sang $\varphi$ nhờ $\dd\varphi/\dd\tau = Lu^2$, rồi lấy đạo hàm hệ thức của bước 2 theo $\varphi$. Đơn vị $G = c = 1$. Phương trình quỹ đạo thành

          $$ u'' + u = \frac{M}{L^2} + 3Mu^2 $$

          Bỏ số hạng $3Mu^2$ là phương trình của Newton, nghiệm $u_0 = \frac{M}{L^2}(1 + e\cos\varphi)$: elip khép kín.

          Số hạng $3Mu^2$ rất nhỏ. Thay $u_0$ vào nó, phần đáng kể duy nhất là $\frac{6M^3e}{L^4}\cos\varphi$, nó «cộng hưởng» với vế trái và cho nghiệm gần đúng

          $$ u \approx \frac{M}{L^2}\Big[1 + e\cos\Big(\varphi\big(1 - \tfrac{3M^2}{L^2}\big)\Big)\Big] $$

          Vật quay về điểm gần nhất khi góc trong ngoặc tăng $2\pi$, tức $\varphi$ tăng $2\pi/(1-3M^2/L^2) \approx 2\pi + 6\pi M^2/L^2$. Với elip, $L^2/M = a(1-e^2)$, nên phần dư là $6\pi M/[a(1-e^2)]$. Trả lại $G$, $c$ là ra công thức trên.
          +++`,
        vao: (c) => c.cauHinh({ mau: 'thuy', tua: 2e5, phong: false }),
        ra: (c) => c.imTieng(),
        nut: { cham: (c) => c.datTua(2e5), nhanh: (c) => c.datTua(5e6) },
      },
      {
        ten: 'Sao S2: kiểm lại quanh lỗ đen ở tâm Ngân Hà',
        noiDung: R`
          Giờ là **sao S2**, một ngôi sao quay quanh Sagittarius A*, lỗ đen nặng khoảng 4,3 triệu lần Mặt Trời ở tâm Ngân Hà (Bài 2). Quỹ đạo rất dẹt ($e = 0{,}88$): một vòng 16,05 năm, điểm gần nhất chỉ cách lỗ đen khoảng **120 AU**, tức khoảng 1 400 rs.

          Ở điểm gần nhất S2 chạy khoảng **7 700 km/s**, bằng 2,6% tốc độ ánh sáng. Thế hấp dẫn ở đó mạnh hơn ở Sao Thủy nhiều, nên elip xoay **khoảng 12′ mỗi vòng**: gấp khoảng 7 000 lần Sao Thủy.

          > [Lịch sử] Nhóm GRAVITY ghép bốn kính thiên văn lớn ở Chile thành một. Năm 2018 họ đo được ánh sáng của S2 bị dịch về phía đỏ đúng như giãn thời gian do hấp dẫn (Bài 9) cộng với hiệu ứng Doppler. Năm 2020 họ đo được elip xoay: tỉ số giữa số đo và tiên đoán của Einstein là 1,10 ± 0,19.

          > [Thử ngay] Mô hình tua 20 vòng mỗi giây, tức 320 năm mỗi giây. Nghe nốt kéo dài: nó vút lên mỗi lần S2 lao qua điểm gần nhất. [[Tua chậm 2 vòng mỗi giây|cham]] [[Tua 20 vòng mỗi giây|nhanh]]

          > [Lưu ý] Ở đây nhìn từ rất xa: lỗ đen thật chỉ là một chấm; hình vẽ lỗ đen và sao S2 to hơn thật để nhìn thấy. Mặt Flamm hầu như phẳng ở khoảng cách này.`,
        vao: (c) => c.cauHinh({ mau: 's2', tua: 20, phong: false }),
        ra: (c) => c.imTieng(),
        nut: { cham: (c) => c.datTua(2), nhanh: (c) => c.datTua(20) },
      },
      {
        ten: 'Sát lỗ đen: hoa thị và lượn vòng',
        noiDung: R`
          Lại gần lỗ đen, công thức của bước 4 không còn đủ. Mô hình tính đường trắc địa trực tiếp, và quỹ đạo thành hình **hoa thị**: mỗi lần quay về, điểm gần nhất (chấm vàng) đã xoay đi một góc lớn.

          - Quỹ đạo **sát lỗ đen** (gần nhất 4,83 rs): xoay 117,4° mỗi vòng. Công thức $6\pi GM/[c^2a(1-e^2)]$ chỉ cho 77,1°.
          - Quỹ đạo **hoa thị** (gần nhất 2,94 rs): cánh hoa xoay rất nhanh.
          - Quỹ đạo **lượn sát rồi văng ra** (gần nhất 2,27 rs): vật quấn **hơn hai vòng rưỡi** quanh lỗ đen rồi mới ra xa.

          Đồ thị thế hiệu dụng giải thích kiểu thứ ba. Mức năng lượng (vạch vàng) chỉ hơi thấp hơn đỉnh của đường xanh. Gần đỉnh, con dốc gần như phẳng, nên vật đi vào rất chậm theo phương bán kính trong khi vẫn quay nhanh. Nó «lơ lửng» nhiều vòng ở đó rồi mới trượt ra. Người ta gọi đây là {{quỹ đạo lượn sát}}.

          > [Thử ngay] Kéo mũi tên vận tốc ở bên trái để tự phóng: bớt tốc độ một chút là hoa thị xoay nhanh hơn, bớt thêm nữa là rơi vào.
          > [[Hoa thị|hoa]] [[Lượn sát rồi văng ra|xoay]] [[Sát lỗ đen|manh]] [[Xem đường thế giới|ktg]]

          > [Hiểu sai thường gặp] «Sát lỗ đen, vật bị hút mạnh nên phải rơi vào.» Không đúng: vật có đủ mô-men động lượng thì vẫn bay ra được, kể cả từ 2,27 rs. Lỗ đen ở xa không hút mạnh hơn một ngôi sao cùng khối lượng. Chỉ khi xuống dưới đỉnh thế năng thì mới hết đường quay ra.`,
        vao: (c) => c.cauHinh({ mau: 'hoa', che: 'mat', goc: 'tren', phong: true }),
        ra: (c) => c.imTieng(),
        nut: {
          hoa: (c) => c.cauHinh({ mau: 'hoa' }), xoay: (c) => c.cauHinh({ mau: 'xoay' }), manh: (c) => c.cauHinh({ mau: 'manh' }),
          ktg: (c) => c.cauHinh({ che: 'ktg', goc: 'cheo' }),
        },
        thuThach: {
          de: 'Tự phóng sao cho cận điểm xoay đúng **90° mỗi vòng** (± 8°): quỹ đạo vẽ thành bông hoa bốn cánh.',
          kiem: (c) => c.ttXoay90(),
          giu: 0.4,
          goiY: 'Vật vào càng sát lỗ đen thì cận điểm xoay càng nhiều. Từ chỗ phóng mặc định (11,75 r<sub>s</sub>), giữ mũi tên nằm ngang và thử tốc độ quanh 19% c; trong lúc kéo, nhãn dưới mũi tên báo góc xoay.',
        },
      },
      {
        ten: 'Quỹ đạo tròn trong cùng: 3 rs',
        noiDung: R`
          Vật đang chạy vòng tròn ở đúng **3 rs**, với tốc độ bằng **nửa tốc độ ánh sáng** (người đứng yên tại chỗ đo). Đồng hồ của nó chạy bằng 70,7% đồng hồ ở xa.

          Trên đồ thị, cái hố và cái đỉnh của đường xanh đã nhập làm một: không còn chỗ trũng nào để vật nằm yên. Đây là {{quỹ đạo tròn ổn định trong cùng}}. Bên trong 3 rs vẫn có quỹ đạo tròn, xuống tới 1,5 rs, nhưng chúng đều **không bền**: chạm nhẹ là rơi.

          > [Thử ngay] [[Chạm nhẹ vào trong|cham]] rồi xem vật xoáy vào. [[Đặt lại quỹ đạo tròn|isco]]
          > Hoặc kéo đốm gốc mũi tên vào dưới 3 rs rồi thử phóng cho vật chạy vòng tròn: dù chỉnh khéo đến đâu, nó cũng chỉ vòng được ít lâu rồi rơi vào hoặc văng ra.

          Vì thế khí quay quanh lỗ đen không đi vòng tròn được ở dưới 3 rs. Đĩa khí có **mép trong** ở đó (Bài 15). Khí xoáy từ rất xa vào tới mép trong đã tỏa ra năng lượng bằng

          $$ 1 - \sqrt{8/9} = 5{,}7\% $$

          khối lượng nghỉ của nó. Phản ứng tổng hợp hạt nhân hydro trong lòng Mặt Trời chỉ giải phóng 0,7%. Hiệu suất gấp 8 lần ấy là lý do các lỗ đen đang «ăn» khí sáng hơn cả thiên hà.

          +++ Đi sâu: tìm 3 rs và $\sqrt{8/9}$
          Quỹ đạo tròn nằm ở đỉnh hoặc đáy của $V(r)$. Dùng $G = c = 1$, đặt $\dd V/\dd r = 0$:

          $$ \frac{M}{r^2} - \frac{L^2}{r^3} + \frac{3ML^2}{r^4} = 0 \;\Rightarrow\; Mr^2 - L^2r + 3ML^2 = 0 $$

          $$ r = \frac{L^2}{2M}\Big(1 \pm \sqrt{1 - 12M^2/L^2}\Big) $$

          Dấu cộng là đáy (bền), dấu trừ là đỉnh (không bền). Ví dụ $L = 2{,}13\,r_sc$: đáy ở 7,18 rs, đỉnh ở 1,90 rs. Khi $L^2 = 12M^2$ hai nghiệm trùng nhau ở $r = L^2/2M = 6M = 3\,r_s$. Nhỏ hơn nữa thì không còn nghiệm: hết quỹ đạo tròn.

          Năng lượng ở đó: $E^2 = (1 - r_s/r)(1 + L^2/r^2) = \frac23\cdot\frac43 = \frac89$. Ở rất xa, đứng yên, $E = 1$. Phần mất đi là $1 - \sqrt{8/9} = 0{,}057$.
          +++`,
        vao: (c) => c.cauHinh({ mau: 'isco', che: 'mat', goc: 'cheo', phong: true }),
        ra: (c) => c.imTieng(),
        nut: { cham: (c) => c.cham(), isco: (c) => c.cauHinh({ mau: 'isco' }) },
      },
      {
        ten: 'Rơi vào: đường thế giới không quay đầu',
        noiDung: R`
          Lần này vật được thả từ 12 rs với quá ít mô-men động lượng. Trên đồ thị, vạch vàng nằm **cao hơn đỉnh** đường xanh: không có bức tường nào chặn lại. Vật lượn gần một vòng rồi đi qua chân trời.

          Nhìn đường thế giới. Càng gần ống chân trời, lò xo càng dựng đứng và bám sát vào ống. Theo đồng hồ ở xa, vật **không bao giờ** tới được chân trời; ánh sáng từ nó tới mắt ta chậm dần, đỏ dần, mờ dần.

          Nhưng đồng hồ của chính vật (ô số liệu) chỉ chạy thêm một khoảng hữu hạn. Theo đồng hồ ấy, vật đi qua chân trời và không thấy gì đặc biệt ở đó. Hai câu không mâu thuẫn: tọa độ $t$ của đồng hồ ở xa không dùng được ở ngay chân trời. Bài 16 sẽ đổi sang tọa độ khác để vẽ trọn đường thế giới đi xuyên qua.

          > [Thử ngay] Kéo mũi tên vận tốc để tự phóng: hướng ra xa mà chậm, vật vẫn quay lại rơi vào; ngang mà đủ nhanh, nó lượn quanh rồi thoát.
          > [[Xem đường thế giới|ktg]] [[Xem trên mặt Flamm|mat]]

          > [Tóm lại]
          > | Kiểu quỹ đạo | Trên đồ thị thế hiệu dụng |
          > |---|---|
          > | Elip xoay dần | vạch năng lượng cắt hố ở hai điểm |
          > | Tròn bền | vạch năng lượng chạm đáy hố |
          > | Lượn sát rồi văng ra | vạch năng lượng sát đỉnh |
          > | Rơi vào | vạch năng lượng cao hơn đỉnh |`,
        vao: (c) => c.cauHinh({ mau: 'roi', che: 'ktg', goc: 'cheo', phong: true }),
        ra: (c) => c.imTieng(),
        nut: { ktg: (c) => c.cauHinh({ che: 'ktg', goc: 'cheo' }), mat: (c) => c.cauHinh({ che: 'mat', goc: 'cheo' }) },
        thuThach: {
          de: 'Phóng vật **hướng ra xa** lỗ đen (mũi tên chếch ra ngoài, thành phần hướng ra ít nhất 5% c) mà nó vẫn quay lại rơi qua chân trời.',
          kiem: (c) => c.ttRoiRa(),
          giu: 0.4,
          goiY: 'Bay ra mà không đủ năng lượng (E nhỏ hơn 1) thì vật phải quay lại. Nếu thành phần ngang cũng nhỏ, mô-men động lượng ít, vạch năng lượng nằm cao hơn đỉnh thế và không gì chặn nó lại. Thử hướng ra 10% c, ngang 8% c.',
        },
      },
    ],
    congThuc: [
      { ten: 'Metric Schwarzschild trong mặt phẳng quỹ đạo', tex: R`\dd s^2 = -\Big(1-\frac{r_s}{r}\Big)c^2\dd t^2 + \frac{\dd r^2}{1-r_s/r} + r^2\dd\varphi^2`, y: '$r_s = 2GM/c^2$; $t$ là thời gian của đồng hồ ở rất xa.' },
      { ten: 'Hai đại lượng bảo toàn', tex: R`E = \Big(1-\frac{r_s}{r}\Big)\frac{\dd t}{\dd\tau}, \qquad L = r^2\frac{\dd\varphi}{\dd\tau}`, y: 'Có được vì metric không đổi theo thời gian và khi quay quanh tâm.' },
      { ten: 'Thế hiệu dụng', tex: R`V(r) = -\frac{GM}{r} + \frac{L^2}{2r^2} - \frac{GML^2}{c^2r^3}`, y: 'Số hạng cuối là phần Einstein thêm vào; nó làm elip không khép kín.' },
      { ten: 'Tiến động mỗi vòng (trường yếu)', tex: R`\Delta\varphi = \frac{6\pi GM}{c^2a(1-e^2)}`, y: 'Sao Thủy: 0,1035″ mỗi vòng, 42,98″ mỗi thế kỷ.' },
      { ten: 'Quỹ đạo tròn bền trong cùng', tex: R`r = \frac{6GM}{c^2} = 3\,r_s, \qquad E = \sqrt{8/9}`, y: 'Hiệu suất giải phóng năng lượng của đĩa khí: $1-\\sqrt{8/9} = 5{,}7\\%$.' },
    ],
    cauHoi: [
      {
        hoi: 'Vì sao theo thuyết tương đối rộng, elip của một hành tinh không khép kín?',
        chon: [
          'Vì Mặt Trời cũng chuyển động quanh tâm Ngân Hà',
          'Vì số hạng $-GML^2/(c^2r^3)$ làm chu kỳ đi ra đi vào dài hơn một vòng quay',
          'Vì các hành tinh khác kéo hành tinh ấy',
          'Vì ánh sáng từ hành tinh cần thời gian để tới Trái Đất',
        ],
        dung: 1,
        giai: 'Theo Newton, đi ra đi vào và quay một vòng mất đúng cùng một thời gian, nên elip khép kín. Số hạng của Einstein làm dao động ra vào chậm lại một chút, nên vật quay hơn một vòng mới về lại điểm gần nhất. Các hành tinh khác **cũng** làm cận nhật Sao Thủy xoay, nhưng phần đó Newton đã tính được; 43″ là phần còn dư.',
      },
      {
        hoi: 'Một hành tinh có cùng tâm sai với Sao Thủy nhưng bán trục lớn gấp 4 lần. Tiến động do thuyết tương đối rộng **mỗi thế kỷ** của nó là bao nhiêu?',
        chon: ['Khoảng 43″/4 ≈ 10,7″', 'Khoảng 43″/8 ≈ 5,4″', 'Khoảng 43″/32 ≈ 1,3″', 'Vẫn khoảng 43″'],
        dung: 2,
        giai: R`Mỗi vòng, góc xoay tỉ lệ với $1/a$: nhỏ đi 4 lần. Nhưng chu kỳ tỉ lệ với $a^{3/2}$ (định luật Kepler 3): dài gấp 8 lần, nên mỗi thế kỷ có ít vòng hơn 8 lần. Cộng lại: nhỏ đi $4 \times 8 = 32$ lần. Hay quên phần số vòng mỗi thế kỷ.`,
      },
      {
        hoi: 'Quỹ đạo trong mô hình có năng lượng riêng $E = 0{,}973$. Con số này nói gì?',
        chon: [
          'Vật chạy bằng 97,3% tốc độ ánh sáng',
          'Vật bị giữ lại quanh lỗ đen, không thể bay ra rất xa',
          'Vật sắp rơi vào lỗ đen',
          'Đồng hồ của vật chạy bằng 97,3% đồng hồ ở xa',
        ],
        dung: 1,
        giai: R`$E$ tính theo năng lượng nghỉ $mc^2$. Muốn ra tới rất xa (và dừng ở đó) cần $E \ge 1$. $E \lt 1$ nghĩa là quỹ đạo bị liên kết. $E$ không phải tốc độ, cũng không phải nhịp đồng hồ: nhịp đồng hồ của vật thay đổi liên tục dọc quỹ đạo.`,
      },
      {
        hoi: 'Vì sao đĩa khí quanh một lỗ đen không quay có mép trong ở khoảng 3 rs?',
        chon: [
          'Vì nhiệt độ ở đó cao tới mức khí bốc hơi hết',
          'Vì bên trong 3 rs không còn quỹ đạo tròn bền: khí xoáy thẳng vào trong',
          'Vì 3 rs chính là chân trời sự kiện',
          'Vì ánh sáng không thoát ra được từ dưới 3 rs',
        ],
        dung: 1,
        giai: 'Chân trời ở 1 rs, mặt cầu photon ở 1,5 rs; ánh sáng vẫn thoát được từ 3 rs. Mép trong do cơ học quỹ đạo: dưới 3 rs đáy và đỉnh của thế hiệu dụng đã nhập làm một, quỹ đạo tròn nào cũng không bền.',
      },
      {
        hoi: 'Một vật rơi vào lỗ đen. Câu nào đúng?',
        chon: [
          'Theo đồng hồ của vật, nó mất thời gian vô hạn mới tới chân trời',
          'Theo đồng hồ ở xa, vật đi qua chân trời sau một khoảng hữu hạn',
          'Theo đồng hồ của vật, nó qua chân trời sau một khoảng hữu hạn; người ở xa thì thấy nó chậm dần mãi',
          'Vật bị lực rất lớn chặn lại ở chân trời',
        ],
        dung: 2,
        giai: 'Thời gian riêng của vật tới chân trời là hữu hạn. Thời gian $t$ của đồng hồ ở xa thì tăng mãi, vì tọa độ $t$ hỏng ở đúng chân trời. Không có bức tường nào ở chân trời; với lỗ đen lớn, vật đi qua mà không cảm thấy gì đặc biệt.',
      },
      {
        hoi: 'Giải thích bằng lời của bạn câu: «Sao Thủy đi thẳng, nhưng ta thấy nó đi vòng».',
        dap: 'Sao Thủy rơi tự do, nên đường thế giới của nó là một đường trắc địa: đường «thẳng nhất» trong không-thời gian cong quanh Mặt Trời, theo nghĩa làm thời gian riêng dài nhất. Đường ấy là một lò xo vươn theo trục thời gian, gần như duỗi thẳng ở tỉ lệ thật. Thứ ta gọi là quỹ đạo chỉ là bóng của nó trong không gian ba chiều: một elip gần khép kín. Vì không-thời gian cong theo đúng metric Schwarzschild, bóng ấy xoay chậm 43″ mỗi thế kỷ.',
      },
    ],
    docThem: [
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 9: quỹ đạo trong hình học Schwarzschild, thế hiệu dụng, quỹ đạo tròn bền trong cùng; chương 10: tiến động cận nhật Sao Thủy.',
      'E. F. Taylor, J. A. Wheeler và E. Bertschinger, *Exploring Black Holes* (bản 2): năng lượng, mô-men động lượng và quỹ đạo quanh lỗ đen, viết cho người mới học.',
      'B. Schutz, *A First Course in General Relativity* (bản 2, 2009): phần quỹ đạo của hạt có khối lượng trong hình học Schwarzschild.',
      'GRAVITY Collaboration 2020, A&A 636, L5: đo tiến động của sao S2 quanh Sagittarius A*.',
    ],
    thuatNgu: [
      { vi: 'thế hiệu dụng', en: 'effective potential', nghia: 'Hàm $V(r)$ gom cả lực hút và phần «ly tâm» do quay, để chuyển động theo bán kính trông như hòn bi lăn trên một con dốc. Einstein thêm số hạng $-GML^2/(c^2r^3)$.' },
      { vi: 'năng lượng riêng', en: 'specific energy', nghia: 'Năng lượng của vật chia cho $mc^2$, giữ nguyên dọc đường trắc địa vì metric không đổi theo thời gian. Nhỏ hơn 1: vật bị giữ lại.' },
      { vi: 'mô-men động lượng riêng', en: 'specific angular momentum', nghia: 'Mô-men động lượng của vật chia cho khối lượng, $L = r^2\\,\\dd\\varphi/\\dd\\tau$; giữ nguyên vì metric không đổi khi quay quanh tâm.' },
      { vi: 'quỹ đạo lượn sát', en: 'zoom-whirl orbit', nghia: 'Quỹ đạo có năng lượng sát đỉnh thế hiệu dụng: vật lượn nhiều vòng sát lỗ đen rồi mới bay ra xa. Newton không có kiểu quỹ đạo này.' },
    ],
  },

  conSo: [
    '**42,98″ mỗi thế kỷ**: tiến động của Sao Thủy do thuyết tương đối rộng (0,1035″ mỗi vòng). Elip phải mất khoảng 3 triệu năm mới xoay đủ một vòng.',
    '**12′ mỗi vòng**: tiến động của sao S2 quanh Sagittarius A*, gấp khoảng 7 000 lần Sao Thủy.',
    '**3 rs**: quỹ đạo tròn bền trong cùng quanh lỗ đen không quay; vật ở đó chạy bằng nửa tốc độ ánh sáng.',
    '**5,7%**: phần khối lượng nghỉ tỏa ra khi khí xoáy từ xa vào tới 3 rs, gấp 8 lần phản ứng tổng hợp hydro (0,7%).',
  ],
  hieuDung: '**«Đi thẳng» nghĩa là gì?** Máy bay từ Tokyo sang Los Angeles bay vòng lên phía Alaska: đó là đường ngắn nhất trên mặt cầu, tức là «thẳng» theo nghĩa của mặt cong. Hành tinh cũng vậy: nó không rẽ, không bị đẩy, chỉ đi thẳng trong không-thời gian bốn chiều. Và đừng hình dung nó như hòn bi lăn trên mặt Flamm: hòn bi lăn được là nhờ trọng lực Trái Đất kéo xuống. Hình elip của quỹ đạo chủ yếu đến từ **thời gian cong**; còn sự tiến động thì cả thời gian cong lẫn không gian cong cùng góp vào.',
  nguon: 'Quỹ đạo Sao Thủy: bảng quỹ đạo của NASA/JPL (Standish và Williams). Sao S2: GRAVITY Collaboration 2018, A&A 615, L15 và 2020, A&A 636, L5. Hằng số: CODATA 2018, IAU 2012. Đường đi trong mô hình là nghiệm số của phương trình đường trắc địa Schwarzschild.',

  tao(app) {
    const scene = new THREE.Scene();
    const camera = app.camera, am = app.am, tt = app.tt;
    scene.add(taoNenSao({ soSao: 2200, hat: 21, doSang: 0.55 }));
    scene.add(new THREE.AmbientLight(0x8090b0, 0.25));
    const den = new THREE.DirectionalLight(0xfff2e0, 2.2);
    den.position.set(-6, 10, 8);
    const denVien = new THREE.DirectionalLight(0x7fa8ff, 1.2);
    denVien.position.set(6, 3, -10);
    scene.add(den, denVien);
    // Mặt Flamm lùi về sau làm nền: kính mờ, lưới mảnh
    const mc = new MatCong({ doMoMat: 0.11, doMoLuoi: 0.34 });
    // Vá tại chỗ (chỉ cho bài này) lỗi của chất liệu mặt cong trong khung: khi nhìn thẳng góc vào mặt, dot(n, v) có thể
    // vượt 1 một chút do làm tròn, pow(số âm, 2,4) cho NaN, và quầng sáng của bộ dựng hình lan NaN ra cả khung hình
    // (nhìn từ trên xuống thì màn hình đen kịt). Đã ghi trong báo cáo để sửa ở src/khung/mat-cong.js.
    {
      const m = mc.mat.material;
      m.fragmentShader = m.fragmentShader.replace('pow(1.0 - dot(n, v), 2.4)', 'pow(max(1.0 - dot(n, v), 0.0), 2.4)');
      m.needsUpdate = true;
    }
    scene.add(mc.nhom);
    const phu = new THREE.Group();     // các vòng, nhãn phụ dựng lại theo từng quỹ đạo
    scene.add(phu);

    // ----- Thiên thể ở tâm -----
    const loDen = taoLoDenNho({ banKinh: 1, dia: false, doSang: 1.2 });
    scene.add(loDen.nhom);
    const matTroi = taoMatTroi({ banKinh: 1 });
    scene.add(matTroi.nhom);
    const nhanTam = taoNhan('', 'vang dam');
    scene.add(nhanTam);
    // ----- Vật bay quanh: một ngôi sao nhỏ xanh trắng (quỹ đạo sát lỗ đen); Sao Thủy; sao S2 -----
    const vat = taoSao({ mau: 0xcfe9ff, banKinh: 1, doSang: 1.25, tia: 4, doDaiTia: 16 });
    const saoThuy = taoHanhTinh({ id: 'thuy', banKinh: 1, khiQuyen: false });
    const saoS2 = taoSao({ nhietDo: 22000, banKinh: 1, doSang: 1.6, tia: 4, doDaiTia: 18 });
    scene.add(vat.nhom, saoThuy.nhom, saoS2.nhom);
    const nhanVat = taoNhan('', 'tran');
    nhanVat.element.style.color = '#cfe9ff';
    scene.add(nhanVat);

    // ----- Vệt quỹ đạo: dải sáng mờ dần -----
    const vet = new DuongDay(N_LS + 1, { mau: 0x8fd6ff, rong: 2.4, moDan: true, quang: 0.14, sang: 1.6 });
    const elipNewton = new DuongDay(361, { mau: 0xb8bcc8, rong: 1.2, doMo: 0.5, cong: false, net: [1, 1] });
    const elipXoay = new DuongDay(361, { mau: 0x8fd6ff, rong: 2.4, quang: 0.14, sang: 1.8 });
    const SO_MA = 16;
    const boMa = Array.from({ length: SO_MA }, (_, i) => new DuongDay(361, { mau: 0x8fd6ff, rong: 1.8, doMo: 0.5 * Math.pow(1 - (i + 1) / (SO_MA + 1), 1.6), sang: 1.3 }));
    const tiaCan = new DuongDay(2, { mau: 0xf3c66f, rong: 1.6, doMo: 0.95, sang: 1.6, quang: 0.1 });
    const tiaCanDau = new DuongDay(2, { mau: 0xb8bcc8, rong: 1.0, doMo: 0.5, cong: false });
    const nhanNewton = taoNhan(chuCanh("canh.elip-newton-khep-kin-khong-xoay", "Elip Newton<small>khép kín, không xoay</small>"), 'mo');
    const nhanCan = taoNhan(chuCanh("canh.diem-gan-nhat", "điểm gần nhất"), 'vang');
    scene.add(vet.line, elipNewton.line, elipXoay.line, tiaCan.line, tiaCanDau.line, nhanNewton, nhanCan);
    for (const m of boMa) scene.add(m.line);
    const dauCan = Array.from({ length: 14 }, () => { const d = taoDom(new THREE.Color(0xffc24a).multiplyScalar(3), 1); d.visible = false; scene.add(d); return d; });

    // ----- Cách xem «không-thời gian»: đường thế giới và ống chân trời (mặt sáng) -----
    const nhomKTG = new THREE.Group();
    scene.add(nhomKTG);
    const ongGeo = new THREE.CylinderGeometry(1, 1, 1, 96, 1, true);
    ongGeo.translate(0, -0.5, 0);                     // đỉnh ống ở y = 0, thân chạy xuống dưới
    const ong = new THREE.Mesh(ongGeo, kinh({ mau: 0xff7a50, nen: 0.05, vien: 1.0, mu: 1.8 }));
    const ongVach = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 2 * Math.PI;
      const d = new DuongDay(2, { mau: 0xff8a73, rong: 1.0, doMo: 0.3, cong: false });
      d.dat(0, Math.cos(a), 0, Math.sin(a)); d.dat(1, Math.cos(a), -1, Math.sin(a)); d.xong(2);
      ongVach.add(d.line);
    }
    const ongIsco = new THREE.Mesh(ongGeo, kinh({ mau: 0x9fe3a8, nen: 0.006, vien: 0.28, mu: 2.4 }));
    const duongTG = new DuongDay(N_LS + 1, { mau: 0x8fd6ff, rong: 2.8, quang: 0.14, sang: 1.6 });
    const nhanTG = taoNhan(chuCanh("canh.duong-the-gioi-cua-vat-lo-xo-vuon", "Đường thế giới của vật<small>lò xo vươn theo thời gian</small>"), 'xanh');
    const nhanOng = taoNhan(chuCanh("canh.chan-troi-theo-thoi-gian-mot-ong-thang", "Chân trời theo thời gian<small>một ống thẳng đứng</small>"), 'mo');
    const nhanNay = taoNhan(chuCanh("canh.luc-nay", "lúc này"), 'tran');
    nhanNay.element.style.color = '#8fe3a8';
    let trucT = null;
    nhomKTG.add(ong, ongVach, ongIsco, duongTG.line, nhanTG, nhanOng, nhanNay);

    // ----- Tự phóng: chỗ phóng, mũi tên vận tốc, đường dự báo -----
    let K_V = 13;                                     // một c dài bao nhiêu rs trên hình (theo cỡ khung)
    // hướng bán kính và hướng tiếp tuyến (φ tăng) ở chỗ phóng φ = PHI0, trong mặt phẳng xz: viTri(r, φ) = (r cos φ, ·, −r sin φ)
    const UR = [Math.cos(PHI0), -Math.sin(PHI0)], UT = [-Math.sin(PHI0), -Math.cos(PHI0)];
    const muiPhong = taoMuiTen3D(0xf3c66f, { day: 0.06, dau: 0.55 });
    const duongThu = new DuongDay(1601, { mau: 0xffffff, rong: 1.3, doMo: 0.55, cong: false, net: [0.35, 0.25] });
    const nhanPhong = taoNhan('', 'tran giua');
    nhanPhong.element.style.color = '#ffe2a8';
    scene.add(muiPhong.nhom, duongThu.line, nhanPhong);

    // ----- Trạng thái -----
    let mau = MAU_SAN[0];
    let p = mau.p, e = mau.e, L = 1, E = 1, rA = 1, rP = 1, rMax = 12, vrDau = 0;
    let cheDo = 'mo-phong';        // 'mo-phong' | 'tua' | 'roi'
    let che = 'mat';               // cách xem: 'mat' | 'ktg'
    let gocDang = 'cheo';
    let s = null;                   // trạng thái hạt
    let tocDo = 1;
    let chuKy = 1;                  // chu kỳ Newton (đơn vị rs/c) để định tốc độ chiếu
    let tdChinhXac = 0, tdXapXi = 0, tdDo = null;
    let phiCanTruoc = null, soCan = 0, daRoi = 0, daThoat = 0;
    let soVongTua = 0, vongMoiGiay = 20, phaTB = 0;
    const lichSu = new Float32Array(N_LS * 3);   // vòng đệm (r, φ, t)
    let lsDau = 0, lsSo = 0;
    let phiVetCuoi = 0, tVetCuoi = 0;
    let kT = 0.05, sau = 15;        // nén trục thời gian, độ sâu phần quá khứ vẽ ra
    let doThiCho = 0;
    // tự phóng
    let phongBat = false, keoPhong = false, daPhong = false, kqPhong = null;
    const phongDat = { r0: 12, vr: 0, vphi: 0.2 };
    let keoLoai = null;
    let coNewton = true, vGoc = 0.2;
    const lsPsi = new Float32Array(SO_MA); let soPsi = 0, choPsi = 0;
    const viTri = (r, phi, out, nang = 0.04) => out.set(r * Math.cos(phi), mc.y(r) + nang, -r * Math.sin(phi));
    const v3 = new THREE.Vector3(), v3b = new THREE.Vector3(), v3c = new THREE.Vector3();
    const ktgDung = () => che === 'ktg' && cheDo !== 'tua';
    const lsLay = (i) => ((lsDau + i) % N_LS) * 3;   // i = 0 là điểm cũ nhất
    const laThuy = () => mau.id === 'thuy', laS2 = () => mau.id === 's2';

    // Mặt cong, các vòng mốc và elip Newton (phụ thuộc cách xem).
    function dungMat() {
      while (phu.children.length) { const o = phu.children.pop(); o.geometry?.dispose(); o.material?.dispose(); o.element?.remove(); }
      // quỹ đạo rất lớn: thưa vòng lưới ra (mặt cong ở đó gần như phẳng, chỉ làm nền)
      const buocVong = rMax <= 16 ? 1 : rMax <= 40 ? 2 : 2.5 * Math.pow(10, Math.floor(Math.log10(rMax / 4)));
      const vong = [];
      for (let r = buocVong; r <= rMax; r += buocVong) if (r >= 1) vong.push(r);
      if (rMax <= 40 && !vong.includes(1)) vong.unshift(1);
      // cách xem không-thời gian: dẹt mặt cong ra để lấy chiều đứng cho thời gian
      mc.dat({ rs: ktgDung() ? 0 : 1, R: null, rMax, vong });
      const gan = rMax <= 60;
      // mặt cong lùi xa hơn nữa khi quỹ đạo rất lớn (Sao Thủy, S2): ở đó nó gần như phẳng, chỉ làm nền
      mc.mat.material.opacity = gan ? 0.075 : 0.04;
      if (ktgDung()) mc.mat.material.opacity = 0.045;
      mc.luoi.material.opacity = gan ? (ktgDung() ? 0.2 : 0.28) : 0.05;
      if (gan) {
        const them = (r, chu, lop, mauVong, a) => {
          phu.add(vongTrenMat(mc, r, { mau: mauVong, doMo: 0.9, nang: 0.02, rong: 1.8 }));
          if (ktgDung() && r < 2) return;            // ống chân trời đã có nhãn riêng
          const n = taoNhan(chu, lop);
          n.position.set(r * Math.cos(a), mc.y(r) + 0.05, r * Math.sin(a));
          phu.add(n);
        };
        them(1, chuCanh("canh.chan-troi-su-kien", "Chân trời sự kiện"), 'mo', 0xff7a50, 2.5);
        them(1.5, chuCanh("canh.mat-cau-photon-1-5-r-s", "Mặt cầu photon · 1,5 r<sub>s</sub>"), 'mo', 0xffc65c, -0.9);
        them(3, chuCanh("canh.quy-dao-tron-ben-trong-cung-3-r", "Quỹ đạo tròn bền trong cùng · 3 r<sub>s</sub>"), 'mo', 0x9fe3a8, 0.6);
      }
      loDen.nhom.visible = gan || laS2();
      matTroi.nhom.visible = laThuy();
      nhanTam.visible = !gan;
      nhanTam.datChu(mau.tam || '');
      coNewton = cheDo !== 'roi' && (mau.id !== 'phong' || (kqPhong && (kqPhong.loai === 'elip' || kqPhong.loai === 'tron')));
      elipNewton.line.visible = coNewton;
      nhanNewton.visible = coNewton && e >= 0.01;      // quỹ đạo tròn: «elip Newton» trùng vòng tròn, nhãn chỉ thêm rối
      if (coNewton) {
        const g0 = cheDo === 'tua' ? 0 : PHI0;            // elip Newton bắt đầu từ điểm xa nhất, cùng chỗ với vật
        for (let i = 0; i <= 360; i++) { const f = i * DO; viTri((p * M) / (1 - e * Math.cos(f)), f + g0, v3, 0.02); elipNewton.dat(i, v3.x, v3.y, v3.z); }
        elipNewton.mat.dashSize = rMax * 0.02; elipNewton.mat.gapSize = rMax * 0.014;
        elipNewton.xong(361);
        viTri((p * M) / (1 - e * Math.cos(1.2)), 1.2 + g0, v3, 0.02);
        nhanNewton.position.copy(v3);
      }
      // nhóm không-thời gian
      nhomKTG.visible = ktgDung();
      ong.scale.set(1, sau, 1); ongVach.scale.set(1, sau, 1);
      ongIsco.scale.set(3, sau, 3);
      if (trucT) { nhomKTG.remove(trucT); trucT.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); o.element?.remove(); }); }
      const xT = -rMax * 0.92, zT = rMax * 0.92;
      trucT = new THREE.Group();
      trucT.add(muiTen([xT, -sau, zT], [xT, rMax * 0.22, zT], { mau: 0x7fcaff, rong: 1.6, doMo: 0.7, dau: rMax * 0.04 }));
      const nT = taoNhan(chuCanh("canh.thoi-gian-dong-ho-o-xa-da-nen", "thời gian<small>đồng hồ ở xa, đã nén</small>"), 'xanh tran');
      nT.position.set(xT, rMax * 0.22, zT);
      const nQ = taoNhan(chuCanh("canh.qua-khu", "quá khứ"), 'mo tran');
      nQ.position.set(xT, -sau * 0.92, zT);
      trucT.add(nT, nQ);
      nhomKTG.add(trucT);
      nhanOng.position.set(Math.cos(2.4), -sau * 0.82, Math.sin(2.4));
      nhanNay.position.set(-rMax * 0.98, 0, rMax * 0.4);
      ve.dungDoThi();
    }

    // Đặt lại hạt và vệt (không đụng tới máy quay).
    function batDau() {
      lsDau = 0; lsSo = 0; soCan = 0; phiCanTruoc = null; tdDo = null; daRoi = 0; daThoat = 0; soVongTua = 0; phaTB = 0; soPsi = 0;
      for (const d of dauCan) d.visible = false;
      if (mau.phong) ({ E, L, vrTau: vrDau } = tuVanToc(mau.phong.r0, mau.phong.vr, mau.phong.vphi));
      else if (mau.roi) { E = Math.sqrt((1 - 1 / rA) * (1 + (L * L) / (rA * rA))); vrDau = 0; }
      else { ({ L, E } = LEtuPE(p, e, M)); vrDau = 0; }
      s = { r: rA, phi: PHI0, vr: vrDau, t: 0, tau: 0 };
      vGoc = tocDoTaiCho();
      phiVetCuoi = 0; tVetCuoi = 0;
    }
    // tốc độ đo bởi người đứng yên tại chỗ: v = √(1 − (1 − rs/r)/E²)
    function tocDoTaiCho() { const f = 1 - 1 / Math.max(1.0001, s.r); return Math.sqrt(Math.max(0, 1 - f / (E * E))); }

    function tinhQuyDao() {
      if (mau.phong) {
        const k = kqPhong;
        rA = mau.phong.r0;
        if (k.loai === 'elip' || k.loai === 'tron') {
          cheDo = 'mo-phong';
          rP = k.rP; p = k.p; e = k.e;
          tdChinhXac = k.td; tdXapXi = tienDongXapXi(p);
          const a = (k.rP + k.rA) / 2;
          chuKy = 2 * Math.PI * Math.sqrt((a * a * a) / M);
        } else {
          cheDo = k.loai === 'roi' ? 'roi' : 'mo-phong';
          rP = k.rP ?? 1; tdChinhXac = tdXapXi = 0;
          chuKy = 2 * Math.PI * Math.sqrt((rA * rA * rA) / M) * 0.6;
        }
        rMax = 18;                                    // giữ cỡ khung khi tự phóng: máy quay không nhảy
      } else if (mau.roi) {
        cheDo = 'roi';
        L = mau.roi.L; rA = mau.roi.r0; rP = 1;
        tdChinhXac = tdXapXi = 0;
        chuKy = 2 * Math.PI * Math.sqrt((rA * rA * rA) / M) * 0.6;
        rMax = Math.max(8, rA * 1.28);
      } else {
        rA = (p * M) / (1 - e); rP = (p * M) / (1 + e);
        tdChinhXac = tienDongChinhXac(p, e);
        tdXapXi = tienDongXapXi(p);
        const a = (p * M) / (1 - e * e);
        chuKy = 2 * Math.PI * Math.sqrt((a * a * a) / M);
        cheDo = tdChinhXac > 0.01 ? 'mo-phong' : 'tua';
        rMax = Math.max(8, rA * 1.28);
      }
      sau = rMax * 1.25;
      kT = (0.55 * rMax) / chuKy * (cheDo === 'roi' ? 1.6 : 1);
    }

    // Góc máy quay, tính theo cỡ quỹ đạo.
    function viTriGoc(ten) {
      if (ten === 'tren') return [[0, rMax * 2.7, rMax * 0.02], [0, mc.y(rMax * 0.3), 0]];
      if (ktgDung()) return [[rMax * 0.6, rMax * 0.3, rMax * 2.6], [0, -sau * 0.45, 0]];
      // Sao Thủy, S2: elip dài, xoay dần quanh tiêu điểm; lùi máy quay để điểm xa nhất không chui dưới bảng bài giảng
      const k = cheDo === 'tua' ? 1.3 : 1;
      return [[0, rMax * 1.02 * k, rMax * 1.68 * k], [0, mc.y(rMax * 0.4), 0]];
    }
    function datGoc(ten = gocDang, giay = 1.3) {
      gocDang = ten;
      app.dk.minDistance = rMax * 0.06;
      app.dk.maxDistance = rMax * 7;
      const [vt, dich] = viTriGoc(ten);
      app.bayToi(vt, dich, giay);
    }

    // Đổi quỹ đạo: tính lại mọi thứ, máy quay nhảy tới góc hợp với cỡ mới.
    function dung(giay = 0) {
      const rCu = rMax;
      tinhQuyDao();
      batDau();
      dungMat();
      chayTruoc();
      const tua = cheDo === 'tua';
      elipXoay.line.visible = tua;
      for (const m of boMa) m.line.visible = false;
      vet.line.visible = !tua;
      tiaCan.line.visible = tiaCanDau.line.visible = tua;
      nhanCan.visible = tua && rP > 0.08 * rMax;
      vat.nhom.visible = !tua;
      saoThuy.nhom.visible = tua && laThuy();
      saoS2.nhom.visible = tua && laS2();
      const tiLe = rMax / rCu;
      datGoc(gocDang, tiLe > 3 || tiLe < 1 / 3 ? 0 : giay);
      if (dkP) { dkP.dat(Math.max(6.1, p)); dkE.dat(e); }
      datTayPhong();
      veThe();
    }

    // ----- Điều khiển -----
    const bang = app.bang;
    let dkP = null, dkE = null;
    const dkMau = bang.chon({
      nhan: chuCanh("canh.chon-quy-dao", "Chọn quỹ đạo"),
      luaChon: MAU_SAN.map((m) => ({ giaTri: m.id, nhan: m.ten })),
      giaTri: mau.id,
      khiDoi: (id) => chonMau(id, 0),
    });
    function chonMau(id, giay = 1.3) {
      mau = MAU_SAN.find((m) => m.id === id);
      dkMau.dat(id);
      daPhong = false; kqPhong = null;
      if (!mau.roi) { p = mau.p; e = mau.e; }
      if (mau.vong) { vongMoiGiay = mau.vong; dkTua.dat(vongMoiGiay); }
      dung(giay);
    }
    const dkChe = bang.chon({
      nhan: chuCanh("canh.cach-xem", "Cách xem"),
      luaChon: [
        { giaTri: 'mat', nhan: chuCanh("canh.tren-mat-flamm", "Trên mặt Flamm"), moTa: chuCanh("canh.quy-dao-ve-tren-hinh-dang-that-cua", "Quỹ đạo vẽ trên hình dạng thật của không gian") },
        { giaTri: 'ktg', nhan: chuCanh("canh.duong-the-gioi", "Đường thế giới"), moTa: chuCanh("canh.bo-do-cong-khong-gian-lay-chieu-dung", "Bỏ độ cong không gian, lấy chiều đứng làm thời gian") },
      ],
      giaTri: che,
      khiDoi: (v) => doiChe(v),
    });
    function doiChe(v, giay = 1.3) {
      che = v; dkChe.dat(v);
      dungMat();
      datGoc(gocDang, giay);
      datTayPhong();
      veThe();
    }
    const tuChon = () => { mau = { id: 'tu-chon', ten: chuCanh("canh.tu-chon", "Tự chọn"), p, e }; daPhong = false; kqPhong = null; dkMau.dat(null); dung(0.6); };
    dkP = bang.thanhTruot({
      nhan: chuCanh("canh.co-quy-dao-p-tinh-theo-gm-c", "Cỡ quỹ đạo <span class=\"toan\">p</span> (tính theo <span class=\"toan\">GM/c²</span>)"), min: 6.1, max: 5e7, giaTri: p, log: true,
      hienThi: (v) => (v < 20 ? so(v, 2) : v < 1e4 ? so(v, 0) : soNghia(v, 3)),
      khiDoi: (v) => { p = Math.max(v, 6 + 2 * e + 0.05); tuChon(); },
    });
    dkE = bang.thanhTruot({
      nhan: chuCanh("canh.do-det-tam-sai-e", "Độ dẹt (tâm sai <span class=\"toan\">e</span>)"), min: 0, max: 0.9, buoc: 0.01, giaTri: e,
      hienThi: (v) => so(v, 2),
      khiDoi: (v) => { e = v; p = Math.max(p, 6 + 2 * e + 0.05); tuChon(); },
    });
    const dkTocDo = bang.thanhTruot({
      nhan: chuCanh("canh.toc-do-chieu", "Tốc độ chiếu"), min: 0, max: 4, buoc: 0.05, giaTri: tocDo,
      hienThi: (v) => (v === 0 ? chuCanh("canh.dung-yen", "đứng yên") : `×${so(v, 2)}`),
      khiDoi: (v) => { tocDo = v; },
    });
    const dkTua = bang.thanhTruot({
      nhan: chuCanh("canh.tua-nhanh-sao-thuy-s2-so-vong-moi", "Tua nhanh (Sao Thủy, S2): số vòng mỗi giây"), min: 1, max: 5e6, giaTri: vongMoiGiay, log: true,
      hienThi: (v) => so(v, 0),
      khiDoi: (v) => { vongMoiGiay = v; },
    });
    function cham() {
      if (cheDo === 'tua' || !s || daRoi > 0) return;
      s.vr -= 0.012;
      E = Math.sqrt(s.vr * s.vr + (1 - (2 * M) / s.r) * (1 + (L * L) / (s.r * s.r)));
      ve.dungDoThi();
    }
    bang.nut([{ nhan: chuCanh("canh.cham-nhe-vao-trong", "Chạm nhẹ vào trong"), moTa: chuCanh("canh.day-vat-mot-cu-rat-nhe-ve-phia", "Đẩy vật một cú rất nhẹ về phía tâm"), khiBam: cham }]);
    const the = bang.the('');
    bang.chuThich(chuCanh("canh.the-hieu-dung-duong-xanh-einstein-duong-xam", "<b>Thế hiệu dụng.</b> Đường xanh: Einstein. Đường xám đứt nét: Newton. Vạch vàng: mức năng lượng của vật; chấm trắng: vật đang ở đâu. Vật chỉ ở được nơi đường xanh nằm dưới vạch vàng."));
    const doThi = bang.doThi(150);

    // Đồ thị thế hiệu dụng: dựng khung khi đổi quỹ đạo, chấm vị trí vẽ lại 10 lần mỗi giây.
    const ve = {
      x0: 1, x1: 12, y0: -0.1, y1: 0.1,
      dungDoThi() {
        doThi.el.hidden = cheDo === 'tua';
        if (cheDo === 'tua') return;
        this.x1 = Math.min(rMax, Math.max(8, rA * 1.2));
        // đỉnh của đường Einstein, đáy hố bên ngoài đỉnh, đáy của đường Newton
        const N = 400, r = (i) => this.x0 + ((this.x1 - this.x0) * i) / N;
        let iDinh = 1, dinh = -Infinity, loN = Infinity;
        for (let i = 1; i <= N; i++) { const v = VE(r(i)); if (v > dinh) { dinh = v; iDinh = i; } loN = Math.min(loN, VN(r(i))); }
        const eps = (E * E - 1) / 2;
        let loE = eps;
        if (iDinh < N) for (let i = iDinh; i <= N; i++) loE = Math.min(loE, VE(r(i)));
        const lo = Math.min(loE, loN, eps);
        const hi = Math.max(eps, Math.min(dinh, eps + 2.5 * (eps - lo) + 0.004));
        const nhip = Math.max(0.004, hi - lo);
        this.y0 = lo - 0.3 * nhip - 0.001; this.y1 = hi + 0.45 * nhip + 0.001;
        this.veLai();
      },
      veLai() {
        if (cheDo === 'tua' || !s) return;
        const g = doThi.ctx, { rong, cao } = doThi;
        const vach = [];
        for (const r of [1, 1.5, 3, 6, 10, 15, 20, 30]) if (r <= this.x1) vach.push([r, r === 1.5 ? chuCanh("canh.1-5", "1,5") : String(r)]);
        const { X, Y } = khungDoThi(g, { rong, cao, x0: this.x0, x1: this.x1, y0: this.y0, y1: this.y1, nhanX: chuCanh("canh.r-don-vi-rs", "r (đơn vị rs)"), nhanY: chuCanh("canh.the-hieu-dung-v-r", "thế hiệu dụng V(r)"), vachX: vach, le: [12, 10, 8, 24] });
        g.save();
        g.beginPath(); g.rect(12, 8, rong - 22, cao - 32); g.clip();
        const duong = (f, mauNet, net, w) => {
          g.strokeStyle = mauNet; g.lineWidth = w; g.setLineDash(net);
          g.beginPath();
          for (let i = 0; i <= 240; i++) { const r = this.x0 + ((this.x1 - this.x0) * i) / 240; const x = X(r), y = Y(f(r)); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
          g.stroke(); g.setLineDash([]);
        };
        duong(VN, MAU.mo, [4, 3], 1.2);
        duong(VE, MAU.xanh, [], 2);
        const eps = (E * E - 1) / 2;
        g.strokeStyle = MAU.vang; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(X(this.x0), Y(eps)); g.lineTo(X(this.x1), Y(eps)); g.stroke();
        const r = Math.max(1, Math.min(this.x1, s.r));
        g.fillStyle = '#fff'; g.beginPath(); g.arc(X(r), Y(eps), 4, 0, 2 * Math.PI); g.fill();
        g.restore();
        g.font = '10.5px -apple-system, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'bottom';
        g.fillStyle = MAU.vang; g.fillText(chuCanh("canh.nang-luong", "năng lượng"), rong - 12, Y(eps) - 3);
      },
    };
    const VE = (r) => -M / r + (L * L) / (2 * r * r) - (M * L * L) / (r * r * r);
    const VN = (r) => -M / r + (L * L) / (2 * r * r);

    const TEN_LOAI = { tron: chuCanh("canh.gan-tron", "Gần tròn"), elip: chuCanh("canh.elip-xoay-dan", "Elip xoay dần"), roi: chuCanh("canh.roi-vao-lo-den", "Rơi vào lỗ đen"), thoat: chuCanh("canh.bay-ra-xa-mai", "Bay ra xa mãi"), 'luot-thoat': chuCanh("canh.luon-sat-roi-bay-ra-xa", "Lượn sát rồi bay ra xa"), 'khong-ben': chuCanh("canh.tron-nhung-khong-ben-duoi-3-rs", "Tròn nhưng không bền (dưới 3 rs)") };
    function veThe() {
      if (mau.phong && kqPhong) {
        const k = kqPhong, ten = TEN_LOAI[k.loai];
        const vv = Math.hypot(mau.phong.vr, mau.phong.vphi);
        let dong = chuCanh("canh.tu-phong-phong-tu-r-s-voi-toc", "<span class=\"ten\">Tự phóng: {0}</span><br>Phóng từ <b>{1} r<sub>s</sub></b> với tốc độ <b>{2}% c</b> (hướng ra {3}%, ngang {4}%)<br>Năng lượng <b>E = {5}</b>, mô-men động lượng <b>L = {6} r<sub>s</sub>c</b>", [ten, so(mau.phong.r0, 2), so(vv * 100, 1), so(mau.phong.vr * 100, 1), so(mau.phong.vphi * 100, 1), so(k.E, 3), so(Math.abs(k.L), 2)]);
        if (k.loai === 'elip' || k.loai === 'tron') dong += chuCanh("canh.gan-nhat-r-s-xa-nhat-r-s", "<br>Gần nhất <b>{0} r<sub>s</sub></b>, xa nhất <b>{1} r<sub>s</sub></b>, tâm sai {2}<br>Cận điểm xoay mỗi vòng: <b>{3}</b>", [so(k.rP, 2), so(k.rA, 2), so(k.e, 3), goc(k.td)]);
        else if (k.loai === 'luot-thoat') dong += chuCanh("canh.gan-nhat-r-s-roi-bay-ra-xa", "<br>Gần nhất <b>{0} r<sub>s</sub></b> rồi bay ra xa (E ≥ 1)", [so(k.rP, 2)]);
        the.dat(dong);
        return;
      }
      if (cheDo === 'roi') {
        the.dat(chuCanh("canh.roi-vao-lo-den-vat-duoc-tha-voi", "<span class=\"ten\">Rơi vào lỗ đen</span><br>Vật được thả với ít mô-men động lượng hơn mức cần để quay tròn. Nó lượn gần một vòng rồi đi qua chân trời sự kiện. Theo đồng hồ của vật, việc này diễn ra trong thời gian hữu hạn; người ở xa thì thấy vật chậm dần và mờ đỏ đi mãi ở sát chân trời."));
        return;
      }
      const ghiKTG = che === 'ktg' && cheDo === 'tua' ? chuCanh("canh.quy-dao-nay-qua-lon-de-ve-duong", "<br><small>Quỹ đạo này quá lớn để vẽ đường thế giới; đang xem trên mặt phẳng.</small>") : '';
      if (e < 0.01) {
        const r = p * M, v = Math.sqrt(M / (r - 2 * M));
        the.dat(chuCanh("canh.quy-dao-tron-o-r-s-toc-do", "<span class=\"ten\">{0}</span><br>Quỹ đạo tròn ở <b>{1} r<sub>s</sub></b>, tốc độ <b>{2}% tốc độ ánh sáng</b>, đồng hồ của vật chạy bằng <b>{3}%</b> đồng hồ ở xa.{4}", [mau.ten, so(r, 2), so(v * 100, 0), so(nhipDongHoQuyDao(r) * 100, 1), r < 3.2 ? chuCanh("canh.o-dung-3-r-s-quy-dao-chi", " Ở đúng 3 r<sub>s</sub> quỹ đạo chỉ vừa đủ bền. Bấm «Chạm nhẹ vào trong» để xem điều gì xảy ra.") : '']));
        return;
      }
      the.dat(chuCanh("canh.gan-nhat-r-s-xa-nhat-r-s-4c9a9e", "<span class=\"ten\">{0}</span><br>\n        Gần nhất <b>{1} r<sub>s</sub></b>, xa nhất <b>{2} r<sub>s</sub></b><br>\n        Năng lượng <b>E = {3}</b>, mô-men động lượng <b>L = {4} r<sub>s</sub>c</b><br>\n        Cận điểm xoay mỗi vòng: <b>{5}</b> (tính chính xác)<br>\n        Công thức 6πGM/[c²a(1−e²)] cho: {6}{7}\n        {8}{9}", [mau.ten, soNghia(rP, 3), soNghia(rA, 3), so(E, 3), so(L, 2), goc(tdChinhXac), goc(tdXapXi), tdChinhXac > 0.2 ? chuCanh("canh.sat-lo-den-thi-cong-thuc-nay-khong", " (sát lỗ đen thì công thức này không còn đủ)") : '', mau.chuKyNam ? chuCanh("canh.moi-the-ky", "<br>Mỗi thế kỷ: <b>{0}</b>", [goc((tdChinhXac * 100) / mau.chuKyNam)]) : '', ghiKTG]));
    }

    // ----- Tự phóng: tay nắm, mũi tên, dự báo -----
    const yPhong = (r) => (ktgDung() ? 0.06 : mc.y(r) + 0.06);
    const _mp = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), _gd = new THREE.Vector3();
    const catMatNgang = (tia, y) => { _mp.constant = -y; return tia.intersectPlane(_mp, _gd); };
    const tayGoc = tt.tayNam({
      viTri: [12, 0, 0], mau: 0xf3c66f, co: 0.12, ten: chuCanh("canh.cho-phong", "Chỗ phóng"),
      moTa: () => chuCanh("canh.phong-tu-r-r-s-toc-do-quy", "Phóng từ r = <b>{0} r<sub>s</sub></b>. Tốc độ quỹ đạo tròn ở đây: {1}% c; tốc độ thoát: {2}% c.", [so(phongDat.r0, 2), so(vanTocTron(Math.max(1.6, phongDat.r0)) * 100, 1), so(vanTocThoat(phongDat.r0) * 100, 1)]),
      rangBuoc: { kieu: 'ham', chieu: (tia) => { const q = catMatNgang(tia, yPhong(phongDat.r0)); if (!q) return null; const r = kep(q.x * UR[0] + q.z * UR[1], 1.6, 14); return [r * UR[0], yPhong(r), r * UR[1]]; } },
      nhan: chuCanh("canh.keo-cho-phong", "Kéo chỗ phóng"),
      khiNam: () => batDauKeo('goc'),
      khiKeo: (q) => { phongDat.r0 = kep(q.x * UR[0] + q.z * UR[1], 1.6, 14); veMuiPhong(); },
      khiTha: () => phong(),
    });
    const tayVT = tt.tayNam({
      viTri: [12, 0, -3], mau: 0xffd27a, co: 0.12, ten: chuCanh("canh.mui-ten-van-toc", "Mũi tên vận tốc"),
      moTa: () => chuCanh("canh.van-toc-luc-phong-nguoi-dung-yen-tai", "Vận tốc lúc phóng (người đứng yên tại chỗ đo): <b>{0}% c</b>.<br>Kéo rồi buông tay để phóng.", [so(Math.hypot(phongDat.vr, phongDat.vphi) * 100, 1)]),
      rangBuoc: {
        kieu: 'ham',
        chieu: (tia) => {
          const y = yPhong(phongDat.r0), q = catMatNgang(tia, y);
          if (!q) return null;
          let vx = (q.x - phongDat.r0 * UR[0]) / K_V, vz = (q.z - phongDat.r0 * UR[1]) / K_V;
          const v = Math.hypot(vx, vz), vm = 0.9;
          if (v > vm) { vx *= vm / v; vz *= vm / v; }
          return [phongDat.r0 * UR[0] + vx * K_V, y, phongDat.r0 * UR[1] + vz * K_V];
        },
      },
      nhan: chuCanh("canh.keo-mui-ten-van-toc-roi-buong-tay", "Kéo mũi tên vận tốc rồi buông tay để phóng"),
      khiNam: () => batDauKeo('vt'),
      khiKeo: (q) => {
        const vx = (q.x - phongDat.r0 * UR[0]) / K_V, vz = (q.z - phongDat.r0 * UR[1]) / K_V;
        phongDat.vr = vx * UR[0] + vz * UR[1]; phongDat.vphi = vx * UT[0] + vz * UT[1];
        veMuiPhong();
      },
      khiTha: () => phong(),
    });
    function batDauKeo(loai) { keoPhong = true; keoLoai = loai; veMuiPhong(); }
    function phong() {
      keoPhong = false; keoLoai = null;
      kqPhong = phanLoai(phongDat.r0, phongDat.vr, phongDat.vphi);
      mau = { id: 'phong', ten: chuCanh("canh.tu-phong", "Tự phóng"), phong: { r0: phongDat.r0, vr: phongDat.vr, vphi: phongDat.vphi } };
      dkMau.dat(null);
      daPhong = true;
      duongThu.line.visible = false;
      dung(0.6);
    }
    // Đặt tay nắm theo quỹ đạo đang chạy: chỗ phóng là điểm bắt đầu, vận tốc là vận tốc lúc bắt đầu.
    function datTayPhong() {
      const hien = phongBat && cheDo !== 'tua';
      tayGoc.an(!hien); tayVT.an(!hien);
      muiPhong.nhom.visible = hien; nhanPhong.visible = hien;
      if (!hien) { duongThu.line.visible = false; return; }
      if (keoPhong) return;
      K_V = 0.8 * rMax;
      if (mau.phong) Object.assign(phongDat, { r0: mau.phong.r0, vr: mau.phong.vr, vphi: mau.phong.vphi });
      else { phongDat.r0 = rA; phongDat.vr = 0; phongDat.vphi = vanTocNgangTuEL(rA, E, L); }
      duongThu.line.visible = false;
      veMuiPhong();
    }
    function veMuiPhong() {
      const y = yPhong(phongDat.r0);
      const x0 = phongDat.r0 * UR[0], z0 = phongDat.r0 * UR[1];
      const x1 = x0 + (phongDat.vr * UR[0] + phongDat.vphi * UT[0]) * K_V, z1 = z0 + (phongDat.vr * UR[1] + phongDat.vphi * UT[1]) * K_V;
      muiPhong.dat(x0, y, z0, x1, y, z1);
      if (keoLoai !== 'goc') tayGoc.dat([x0, y, z0]);
      if (keoLoai !== 'vt') tayVT.dat([x1, y, z1]);
      nhanPhong.position.set(x1, y, z1 + rMax * 0.09);
      if (keoPhong) {
        const k = phanLoai(phongDat.r0, phongDat.vr, phongDat.vphi);
        let chu = `<b>${TEN_LOAI[k.loai]}</b>`;
        if (k.loai === 'elip' || k.loai === 'tron') chu += chuCanh("canh.tam-sai-can-diem-xoay-moi-vong", "<br><small>tâm sai {0} · cận điểm xoay {1} mỗi vòng</small>", [so(k.e, 2), goc(k.td)]);
        else if (k.loai === 'luot-thoat') chu += chuCanh("canh.gan-nhat-r-s", "<br><small>gần nhất {0} r<sub>s</sub></small>", [so(k.rP, 2)]);
        nhanPhong.datChu(chu);
        duBao();
      } else nhanPhong.datChu(`<small>${mau.phong ? chuCanh("canh.da-phong", "đã phóng") : mau.ten}: ${so(Math.hypot(phongDat.vr, phongDat.vphi) * 100, 1)}% c</small>`);
    }
    // Đường dự báo khi đang kéo: tích phân đường trắc địa vài vòng (đứt nét, mờ).
    function duBao() {
      const { E: Ex, L: Lx, vrTau } = tuVanToc(phongDat.r0, phongDat.vr, phongDat.vphi);
      const q = { r: phongDat.r0, phi: PHI0, vr: vrTau, t: 0, tau: 0 };
      let n = 0, phiCuoi = -1;
      viTri(q.r, PHI0, v3, 0.05); duongThu.dat(n++, v3.x, ktgDung() ? 0.06 : v3.y, v3.z);
      for (let i = 0; i < 9000 && n < 1600; i++) {
        const h = Math.min(0.012 * Math.sqrt((q.r * q.r * q.r) / M), Math.max(2e-5, 0.15 * (q.r - 1)));
        buocHat(q, h, Lx, Ex, M);
        if (q.r < 1.002 || q.r > 3 * rMax || Math.abs(q.phi - PHI0) > 6 * Math.PI) break;
        if (Math.abs(q.phi - phiCuoi) > 0.02) {
          phiCuoi = q.phi;
          viTri(q.r, q.phi, v3, 0.05);
          duongThu.dat(n++, v3.x, ktgDung() ? 0.06 : v3.y, v3.z);
        }
      }
      duongThu.xong(n);
      duongThu.line.visible = true;
    }

    // Tích phân đường trắc địa thêm một khoảng thời gian riêng «con», ghi vệt và các điểm gần nhất.
    let choPhepChuong = false, choChuong = 0;
    function tichPhan(con) {
      for (let i = 0; i < 4000 && con > 0; i++) {
        // bước nhỏ dần khi tới sát chân trời để thấy đường thế giới bám vào ống
        const h = Math.min(con, 0.012 * Math.sqrt((s.r * s.r * s.r) / M), Math.max(2e-5, 0.15 * (s.r - 1)));
        const vrTruoc = s.vr, phiTruoc = s.phi;
        buocHat(s, h, L, E, M);
        con -= h;
        if (s.r < 1.0004 || !Number.isFinite(s.t)) { daRoi = 2.8; break; }
        if (s.r > rMax * 2.4 && s.vr > 0) { daThoat = 1.2; break; }
        if (vrTruoc < 0 && s.vr >= 0) {                       // vừa qua điểm gần nhất
          const u = vrTruoc / (vrTruoc - s.vr);
          const phiCan = phiTruoc + u * (s.phi - phiTruoc);
          if (phiCanTruoc != null) tdDo = phiCan - phiCanTruoc - 2 * Math.PI;
          phiCanTruoc = phiCan;
          const d = dauCan[soCan % dauCan.length];
          d.userData.r = s.r; d.userData.phi = phiCan; d.userData.lan = soCan + 1; d.userData.td = soCan > 0 ? tdDo : null;
          d.visible = true;
          soCan++;
          // tiếng chuông ở mỗi lần qua điểm gần nhất (chỉ khi đang chạy thật, không khi chạy trước)
          if (choPhepChuong && choChuong <= 0) { am.not({ tanSo: 1174.66, dai: 1.1, doTo: 0.16, dang: 'chuong' }); choChuong = 0.25; }
        }
        if (Math.abs(s.phi - phiVetCuoi) > 0.012 || s.t - tVetCuoi > chuKy * 0.004) {
          phiVetCuoi = s.phi; tVetCuoi = s.t;
          const k = ((lsDau + lsSo) % N_LS) * 3;
          lichSu[k] = s.r; lichSu[k + 1] = s.phi; lichSu[k + 2] = s.t;
          if (lsSo < N_LS) lsSo++; else lsDau = (lsDau + 1) % N_LS;
        }
      }
    }
    // Chạy trước vài vòng để vừa mở đã thấy cả hình hoa thị và lò xo đường thế giới.
    function chayTruoc() {
      if (cheDo !== 'mo-phong') return;
      for (let k = 0; k < 400 && s.t < chuKy * 2.4 && daRoi <= 0 && daThoat <= 0; k++) tichPhan(chuKy / 60);
    }

    // ----- rê chuột, bấm -----
    tt.them(loDen.cau, {
      ten: chuCanh("canh.lo-den", "Lỗ đen"), mau: 0xffc65c, banKinhPx: 18,
      moTa: () => (laS2() ? chuCanh("canh.sagittarius-a-khoang-4-3-trieu-lan-khoi", "Sagittarius A*: khoảng 4,3 triệu lần khối lượng Mặt Trời, r<sub>s</sub> ≈ 12,7 triệu km. Vẽ to hơn thật rất nhiều: ở cỡ thật nó chỉ là một chấm.")
        : chuCanh("canh.lo-den-khong-quay-chan-troi-su-kien", "Lỗ đen không quay. Chân trời sự kiện ở 1 r<sub>s</sub>, mặt cầu photon (vòng sáng) ở 1,5 r<sub>s</sub>, quỹ đạo tròn bền trong cùng ở 3 r<sub>s</sub>.")),
    });
    tt.them(matTroi.cau, {
      ten: chuCanh("canh.mat-troi", "Mặt Trời"), mau: 0xffd27a, banKinhPx: 22,
      moTa: chuCanh("canh.gm-c-1-477-km-ban-kinh-schwarzschild", "GM/c² = 1,477 km, bán kính Schwarzschild khoảng 2,95 km. Vẽ to hơn thật để nhìn thấy (Sao Thủy cách Mặt Trời khoảng 83 lần bán kính Mặt Trời)."),
    });
    tt.them(vat.nhom, {
      ten: chuCanh("canh.vat-dang-bay", "Vật đang bay"), mau: 0xcfe9ff, banKinhPx: 16,
      moTa: () => chuCanh("canh.cach-tam-r-s-toc-do-c-nguoi", "Cách tâm {0} r<sub>s</sub> · tốc độ {1}% c (người đứng yên tại chỗ đo).<br>Nó không bị kéo: nó đi theo đường trắc địa.", [so(s.r, 2), so(tocDoTaiCho() * 100, 1)]),
    });
    tt.them(saoThuy.nhom, { ten: chuCanh("canh.sao-thuy", "Sao Thủy"), mau: 0xc8c0b8, banKinhPx: 16, moTa: chuCanh("canh.ban-truc-lon-57-9-trieu-km-tam", "Bán trục lớn 57,9 triệu km, tâm sai 0,2056, một vòng 88 ngày. Vẽ to hơn thật.") });
    tt.them(saoS2.nhom, { ten: chuCanh("canh.sao-s2", "Sao S2"), mau: 0xbfd6ff, banKinhPx: 16, moTa: chuCanh("canh.ngoi-sao-nong-nang-khoang-10-15-lan", "Ngôi sao nóng, nặng khoảng 10–15 lần Mặt Trời, quay quanh Sagittarius A* mỗi 16,05 năm. Vẽ to hơn thật.") });
    for (const d of dauCan) {
      tt.them(d, {
        ten: chuCanh("canh.diem-gan-nhat-2a1ecd", "Điểm gần nhất"), mau: 0xf3c66f, banKinhPx: 12,
        moTa: () => chuCanh("canh.lan-qua-diem-gan-nhat-thu-o-r", "Lần qua điểm gần nhất thứ {0}, ở {1} r<sub>s</sub>.{2}", [d.userData.lan ?? '?', so(d.userData.r ?? 0, 2), d.userData.td != null ? chuCanh("canh.da-xoay-so-voi-lan-truoc", "<br>Đã xoay {0} so với lần trước.", [goc(d.userData.td)]) : '']),
      });
    }

    dung();

    // ---------- âm thanh: cao độ theo tốc độ ----------
    let gTD = null;
    function imTieng(giay = 0.4) { gTD?.tat(giay); gTD = null; }
    function capNhatTieng(dt, v, vRef) {
      if (dt <= 0 || keoPhong || daRoi > 0 || daThoat > 0) { gTD?.dat({ doTo: 0 }, 0.15); return; }
      if (!gTD) gTD = am.giong({ dang: 'kinh', tanSo: F_GOC, doTo: 0 });
      gTD.dat({ tanSo: tanSoTocDo(v, vRef), doTo: 0.1 }, 0.05);
    }
    let daQuet = false;

    const upp = (o) => donViMoiDiemAnh(camera, camera.position.distanceTo(o), app.cao);
    let tMT = 0;
    function capNhat(dt) {
      choChuong -= dt;
      // thiên thể ở tâm
      const yTam = ktgDung() ? 0 : mc.y(1);
      loDen.nhom.position.set(0, yTam, 0);
      const gan = rMax <= 60;
      loDen.nhom.scale.setScalar(gan ? 1 : 14 * upp(loDen.nhom.position));
      loDen.capNhat(dt, camera);
      if (laThuy()) {
        matTroi.nhom.position.set(0, yTam, 0);
        const rThat = (R_MAT_TROI_KM * 1000) / RS_MAT_TROI_M;          // bán kính Mặt Trời tính theo rs
        tMT += dt;
        matTroi.capNhat(tMT, Math.max(rThat, 20 * upp(matTroi.nhom.position)));
      }
      nhanTam.position.set(0, yTam, 0);

      let v = 0, vRef = 1;
      if (cheDo === 'tua') {
        soVongTua += dt * vongMoiGiay * tocDo;
        const psi = tdChinhXac * soVongTua;
        for (let i = 0; i <= 360; i++) { const f = i * DO; viTri((p * M) / (1 - e * Math.cos(f)), f + psi, v3, 0.04); elipXoay.dat(i, v3.x, v3.y, v3.z); }
        elipXoay.xong(361);
        // dải sáng mờ dần: các vị trí elip vừa đi qua, mỗi 0,07 giây ghi một lần
        choPsi -= dt;
        if (choPsi <= 0 && dt > 0) {
          choPsi = 0.07;
          for (let k = SO_MA - 1; k > 0; k--) lsPsi[k] = lsPsi[k - 1];
          lsPsi[0] = psi;
          soPsi = Math.min(SO_MA, soPsi + 1);
          for (let k = 0; k < SO_MA; k++) {
            const m = boMa[k];
            m.line.visible = k < soPsi - 1 && Math.abs(psi - lsPsi[k]) > 1e-4;
            if (!m.line.visible) continue;
            for (let i = 0; i <= 360; i += 2) { const f = i * DO; viTri((p * M) / (1 - e * Math.cos(f)), f + lsPsi[k], v3, 0.03); m.dat(i / 2, v3.x, v3.y, v3.z); }
            m.xong(181);
          }
        }
        // vật chạy trên elip theo định luật Kepler 2 (nhanh ở cận điểm), nhịp đã chậm lại để nhìn thấy
        phaTB += dt * tocDo * 1.6;
        const nu = gocThat(phaTB % (2 * Math.PI), e);          // góc tính từ điểm gần nhất
        const f = nu + Math.PI;                                  // viTri đo góc từ điểm xa nhất
        const rr = (p * M) / (1 - e * Math.cos(f));
        viTri(rr, f + psi, v3, 0.05);
        const than = laThuy() ? saoThuy : saoS2;
        than.nhom.position.copy(v3);
        if (laThuy()) { than.nhom.scale.setScalar(8 * upp(v3)); saoThuy.datNguonSang([0, yTam, 0]); saoThuy.capNhat(dt); }
        else { saoS2.datBanKinh(9 * upp(v3)); saoS2.capNhat(dt); }
        const a = (p * M) / (1 - e * e);
        v = Math.sqrt(Math.max(0, 2 / rr - 1 / a)); vRef = Math.sqrt(Math.max(1e-12, 2 / rA - 1 / a));
        viTri(rP, Math.PI + psi, v3b, 0.05);
        tiaCan.dat(0, 0, yTam, 0); tiaCan.dat(1, v3b.x, v3b.y, v3b.z); tiaCan.xong(2);
        nhanCan.position.copy(v3b);
        viTri(rP, Math.PI, v3b, 0.03);
        tiaCanDau.dat(0, 0, yTam, 0); tiaCanDau.dat(1, v3b.x, v3b.y, v3b.z); tiaCanDau.xong(2);
        nhanVat.visible = false;
      } else {
        if (daRoi > 0) {
          daRoi -= dt;
          if (!daQuet && dt > 0) { daQuet = true; imTieng(0.9); }
          if (daRoi <= 0) { batDau(); ve.dungDoThi(); daQuet = false; }
        } else if (daThoat > 0) {
          daThoat -= dt;
          if (daThoat <= 0) { batDau(); ve.dungDoThi(); }
        } else if (!keoPhong) {
          choPhepChuong = dt > 0;
          tichPhan(dt * tocDo * (chuKy / 7));
          choPhepChuong = false;
        }
        viTri(Math.max(1, s.r), s.phi, v3, 0.05);
        if (ktgDung()) v3.y = 0.05;
        vat.nhom.position.copy(v3);
        vat.datBanKinh(Math.max(0.1, 7 * upp(v3)));
        vat.capNhat(dt);
        vet.dat(0, v3.x, v3.y, v3.z);
        for (let i = 0; i < lsSo; i++) { const k = lsLay(lsSo - 1 - i); viTri(lichSu[k], lichSu[k + 1], v3b); if (ktgDung()) v3b.y = 0.04; vet.dat(i + 1, v3b.x, v3b.y, v3b.z); }
        vet.xong(lsSo + 1, 0.9);
        vet.datDoMo(ktgDung() ? 0.4 : 1);
        if (ktgDung()) {
          // đường thế giới: điểm mới nhất ở mặt «lúc này», quá khứ chìm xuống theo thời gian của đồng hồ ở xa
          duongTG.dat(0, v3.x, 0.05, v3.z);
          let n = 1;
          for (let i = lsSo - 1; i >= 0; i--) {
            const k = lsLay(i);
            const y = -kT * (s.t - lichSu[k + 2]);
            if (y < -sau) break;
            viTri(lichSu[k], lichSu[k + 1], v3b);
            duongTG.dat(n++, v3b.x, y, v3b.z);
          }
          duongTG.xong(n);
          const giua = Math.min(n - 1, Math.floor(n * 0.45));
          nhanTG.position.set(duongTG.diem[giua * 3], duongTG.diem[giua * 3 + 1], duongTG.diem[giua * 3 + 2]);
          nhanTG.visible = n > 20;
        }
        v = tocDoTaiCho(); vRef = vGoc;
        nhanVat.visible = !phongBat;
        if (nhanVat.visible) { nhanVat.position.copy(v3).add(v3c.set(0.35, 0.35, 0)); nhanVat.datChu(`${so(v * 100, 0)}% c`); }
      }
      for (const d of dauCan) if (d.visible) { viTri(d.userData.r, d.userData.phi, d.position, 0.06); if (ktgDung()) d.position.y = 0.06; }
      for (const d of dauCan) if (d.visible) d.scale.setScalar(Math.max(0.12, 13 * donViMoiDiemAnh(camera, camera.position.distanceTo(d.position), app.cao)));
      capNhatTieng(dt, v, vRef);
      doThiCho -= dt > 0 ? dt : 0.016;
      if (doThiCho <= 0) { doThiCho = 0.1; ve.veLai(); }
      if (thu && !daThu) { daThu = true; datThu(); }
    }

    function hud() {
      if (cheDo === 'tua') {
        const psi = tdChinhXac * soVongTua;
        const nam = soVongTua * (mau.chuKyNam || 0);
        return [
          [chuCanh("canh.da-quay", "Đã quay"), chuCanh("canh.vong", "{0} vòng{1}", [so(soVongTua, 0), nam ? ` = ${nam >= 1e6 ? chuCanh("canh.trieu-nam", "{0} triệu năm", [so(nam / 1e6, 2)]) : chuCanh("canh.nam", "{0} năm", [so(nam, 0)])}` : ''])],
          [chuCanh("canh.can-diem-da-xoay", "Cận điểm đã xoay"), `${goc(psi)}${psi > 2 * Math.PI ? chuCanh("canh.vong-3d5ea1", " ({0} vòng)", [so(psi / (2 * Math.PI), 2)]) : ''}`],
          [chuCanh("canh.moi-vong-xoay", "Mỗi vòng xoay"), goc(tdChinhXac)],
          [chuCanh("canh.hinh-ve", "Hình vẽ"), chuCanh("canh.elip-einstein-sang-xoay-dan-so-voi-elip", "elip Einstein (sáng) xoay dần so với elip Newton (xám); vệt mờ: các vị trí elip vừa đi qua")],
        ];
      }
      const f = 1 - 1 / Math.max(1.0001, s.r);
      const v = Math.sqrt(Math.max(0, 1 - f / (E * E)));
      const dong = [
        [chuCanh("canh.cach-tam", "Cách tâm"), `${so(s.r, 2)} r<sub>s</sub>`],
        [chuCanh("canh.toc-do-nguoi-dung-yen-tai-cho-do", "Tốc độ (người đứng yên tại chỗ đo)"), chuCanh("canh.toc-do-anh-sang", "{0}% tốc độ ánh sáng", [so(v * 100, 1)])],
        [chuCanh("canh.dong-ho-cua-vat", "Đồng hồ của vật"), chuCanh("canh.dong-ho-o-xa-don-vi-r-s", "{0} · đồng hồ ở xa: {1} (đơn vị r<sub>s</sub>/c)", [so(s.tau, 0), daRoi > 0 ? chuCanh("canh.tang-mai-khong-dung", "tăng mãi không dừng") : so(s.t, 0)])],
      ];
      if (cheDo === 'mo-phong' && e >= 0.01 && coNewton) dong.push([chuCanh("canh.can-diem-xoay-moi-vong", "Cận điểm xoay mỗi vòng"), chuCanh("canh.do-trong-mo-phong-ly-thuyet", "đo trong mô phỏng {0} · lý thuyết {1}", [tdDo == null ? chuCanh("canh.cho-du-mot-vong", "(chờ đủ một vòng)") : goc(tdDo), goc(tdChinhXac)])]);
      else dong.push([chuCanh("canh.trang-thai", "Trạng thái"), daRoi > 0 ? chuCanh("canh.da-di-qua-chan-troi-su-kien", "đã đi qua chân trời sự kiện") : daThoat > 0 ? chuCanh("canh.da-bay-ra-xa", "đã bay ra xa") : cheDo === 'roi' ? chuCanh("canh.dang-xoay-vao", "đang xoáy vào") : mau.phong && !coNewton ? TEN_LOAI[kqPhong?.loai] || '' : chuCanh("canh.quay-tron", "quay tròn")]);
      if (ktgDung()) dong.push([chuCanh("canh.hinh-ve", "Hình vẽ"), chuCanh("canh.chieu-dung-la-thoi-gian-cua-dong-ho", "chiều đứng là thời gian của đồng hồ ở xa (đã nén), không gian bị dẹt phẳng")]);
      return dong;
    }

    // Các bước của bài giảng gọi hàm này: { mau, che, goc, tua, tocDo, phong }.
    function cauHinh(o = {}) {
      if (o.tocDo != null) { tocDo = o.tocDo; dkTocDo.dat(tocDo); }
      else if (o.mau) { tocDo = 1; dkTocDo.dat(1); }
      if (o.phong != null) { phongBat = o.phong; keoPhong = false; }
      if (o.goc) gocDang = o.goc;
      const doiCach = o.che && o.che !== che;
      if (doiCach) { che = o.che; dkChe.dat(che); if (!o.mau) doiChe(che, 1.3); }
      if (o.mau) chonMau(o.mau, 1.3);
      else if (o.goc && !doiCach) datGoc(o.goc);
      if (o.tua != null) { vongMoiGiay = o.tua; dkTua.dat(o.tua); }
      datTayPhong();
    }

    // tham số riêng khi chụp ảnh kiểm thử (chỉ ở chế độ im lặng): ?thu=<tên>
    const thu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    let daThu = false;
    function datThu() {
      const phongThu = (r0, vr, vphi) => { Object.assign(phongDat, { r0, vr, vphi }); phong(); };
      if (thu === 'tron') phongThu(12.73, 0, 0.2065);
      if (thu === 'xoay90') phongThu(11.75, 0, 0.1895);
      if (thu === 'roira') phongThu(12, 0.12, 0.09);
      if (thu === 'keo') { Object.assign(phongDat, { r0: 9, vr: -0.05, vphi: 0.215 }); keoPhong = true; veMuiPhong(); }
    }

    return {
      scene, capNhat, hud, cauHinh, cham, imTieng, tuChinhGanXa: [0.005, 60, 100],
      datTua: (v) => { vongMoiGiay = v; dkTua.dat(v); },
      // thử thách
      ttTron: () => daPhong && kqPhong?.loai === 'tron',
      ttXoay90: () => daPhong && (kqPhong?.loai === 'elip' || kqPhong?.loai === 'tron') && Math.abs(kqPhong.td - TT_XOAY_90.dich) <= TT_XOAY_90.dungSai,
      ttRoiRa: () => daPhong && kqPhong?.loai === 'roi' && (mau.phong?.vr ?? 0) >= TT_ROI_RA.vr,
      huy() { imTieng(0.2); },
    };
  },
};

// Góc thật (tính từ điểm gần nhất) của elip Kepler tâm sai e ứng với góc trung bình Mtb: giải phương trình Kepler.
function gocThat(Mtb, e) {
  let Ek = e > 0.8 ? Math.PI : Mtb;
  for (let i = 0; i < 12; i++) Ek -= (Ek - e * Math.sin(Ek) - Mtb) / (1 - e * Math.cos(Ek));
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(Ek / 2), Math.sqrt(1 - e) * Math.cos(Ek / 2));
}

// Vật liệu kính: viền sáng theo góc nhìn (Fresnel), lớp phủ rất mỏng, cộng sáng vào cảnh. Màu tuyến tính.
function kinh({ mau = 0xffffff, nen = 0.04, vien = 0.8, mu = 2.4 } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uNen: { value: nen }, uVien: { value: vien }, uMu: { value: mu } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz; vY = position.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uNen, uVien, uMu;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float fr = pow(max(1.0 - abs(dot(n, v)), 0.0), uMu);
        float moDuoi = 0.35 + 0.65 * exp(vY * 1.6);         // ống chân trời mờ dần về quá khứ
        gl_FragColor = vec4(uMau * (uNen + uVien * 1.6 * fr) * moDuoi, 1.0);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  m.tuyenTinh = true;
  return m;
}

// Mũi tên có khối (thân trụ, đầu nón), vật liệu có ánh sáng và phát sáng nhẹ; dời được từng khung hình.
const _geoThan = new THREE.CylinderGeometry(1, 1, 1, 12, 1).translate(0, 0.5, 0);
const _geoDau = new THREE.ConeGeometry(1, 1, 18, 1).translate(0, -0.5, 0);
function taoMuiTen3D(mau, { day = 0.026, dau = 0.19 } = {}) {
  const nhom = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: mau, emissive: mau, emissiveIntensity: 0.9, roughness: 0.35, metalness: 0.1 });
  const than = new THREE.Mesh(_geoThan, mat), non = new THREE.Mesh(_geoDau, mat);
  nhom.add(than, non);
  const huong = new THREE.Vector3(), truc = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  return {
    nhom,
    dat(x0, y0, z0, x1, y1, z1) {
      huong.set(x1 - x0, y1 - y0, z1 - z0);
      const l = huong.length();
      than.visible = non.visible = l > 0.03;
      if (l < 1e-9) return;
      huong.divideScalar(l);
      q.setFromUnitVectors(truc, huong);
      const d = Math.min(dau, l * 0.45), r = Math.min(day, l * 0.1);
      than.position.set(x0, y0, z0); than.quaternion.copy(q); than.scale.set(r, Math.max(1e-4, l - d * 0.9), r);
      non.position.set(x1, y1, z1); non.quaternion.copy(q); non.scale.set(d * 0.38, d, d * 0.38);
    },
  };
}
