import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 12 — Độ cong thật và phương trình Einstein.
// Mô hình: một đám khoảng 600 hạt (trên mặt cầu và bên trong), ban đầu đứng yên so với nhau, thả rơi tự do.
// Quỹ đạo từng hạt tính bằng cơ học Newton (Verlet vận tốc, bước nhỏ). Với trường yếu, đường này trùng đường
// trắc địa của Einstein tới sai số cỡ GM/(rc²). Bốn chế độ: ngoài vật chất (rơi về một hành tinh), trong vật chất
// đồng đều, năng lượng tối (hằng số vũ trụ), thủy triều của Mặt Trăng trên Trái Đất.
// Toán ở src/vat-ly/thuy-trieu.js; bộ kiểm ở kiem-tra/kiem-thuy-trieu.mjs.

import * as THREE from 'three';
import { so, soNghia } from '../vat-ly/hang-so.js';
import { hiepPhuong, det3, triRieng3, trieuCanBang } from '../vat-ly/thuy-trieu.js';
import {
  N_MAT, N_TRONG, N_DAU, N_HAT, RC, DT_MO_PHONG, GM_HANH_TINH, R_HANH_TINH, R_KHOI, R_THA_MAC_DINH, D_HINH,
  taoDamHat, truongCauDac, giaTocT, khoiGiaTocT, buocVerletT, vddvLucTha, doBienDang, taoKetQuaDo, huongDoc, tiSoCap,
  TT_TRUC_DOC, TT_KEO_GAP, TT_THE_TICH, TT_TRIEU, tiSoKeo, dinhBuou, F0_KEO_EP, tanSoTruc, tiengSong,
} from '../vat-ly/dam-hat-roi.js';
import { taoNhan, taoNenSao, taoDom, texDom, DuongDay, kep, lamMuot } from '../khung/ve.js';
import { MAU_KTG } from '../khung/ktg.js';
import { MAU, khungDoThi } from '../khung/giao-dien.js';
import { taoTraiDat, taoMatTrang } from '../khung/hanh-tinh.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('thuy-trieu', khoa, goc, thamSo);

const R = String.raw;

const RP = R_HANH_TINH;                            // bán kính hành tinh (và Trái Đất ở chế độ thủy triều)
const NLS = 220;                                   // số điểm của vệt đường đi
const DT = DT_MO_PHONG;                            // bước tích phân (đơn vị thời gian mô phỏng)

// Tham số các chế độ (đơn vị mô phỏng). Chế độ «trong» dùng trường của cả quả cầu vật chất đồng đều (trong và ngoài),
// nên kéo đám hạt ra khỏi quả cầu là đổi sang «ngoài vật chất»; bên trong, trường đúng như Bản 2 (a = −w²·r).
const CHE_DO = {
  ngoai: { ten: chuCanh("canh.ngoai-vat-chat", "Ngoài vật chất"), truong: { loai: 'ngoai', GM: GM_HANH_TINH }, tMax: 7.6, tocDo: 1 },
  trong: { ten: chuCanh("canh.trong-vat-chat", "Trong vật chất"), truong: truongCauDac(), tMax: 8, tocDo: 1 },
  toi: { ten: chuCanh("canh.nang-luong-toi", "Năng lượng tối"), truong: { loai: 'toi', H2: 0.25 * 0.25 }, tMax: 7, tocDo: 1 },
  trieu: { ten: chuCanh("canh.thuy-trieu", "Thủy triều"), truong: null, tMax: 48, tocDo: 4 },   // tMax tính bằng giờ
};
const EPS_TRIEU = 0.12;                            // độ phình của lớp nước trên hình (so với bán kính)
const CHU_KY_TRANG = 24.84;                        // giờ: Trái Đất quay một vòng so với hướng Mặt Trăng

export default {
  id: 'thuy-trieu',
  ten: 'Độ cong thật và phương trình Einstein',
  moTa: 'Cái rơi tự do không xoá được: lực thủy triều',
  yChinh: 'Rơi tự do xoá được trọng lực tại một chỗ, nhưng không xoá được **sự khác nhau** của trọng lực giữa hai chỗ gần nhau: lực thủy triều. Một đám hạt rơi tự do bị kéo dài theo phương bán kính và bóp lại theo hai phương ngang. Đó chính là **độ cong** của không-thời gian. Phương trình Einstein nói: ở nơi có vật chất, thể tích của đám hạt ấy bắt đầu co lại với gia tốc tỉ lệ với mật độ năng lượng cộng ba lần áp suất.',
  mayAnh: { viTri: [7.5, 7.8, 22.5], dich: [6.2, -0.4, 0], fov: 40, min: 2, max: 80, gan: 0.05, xa: 2000 },

  baiGiang: {
    mucTieu: [
      'Giải thích được vì sao rơi tự do xoá được trọng lực tại chỗ nhưng không xoá được lực thủy triều.',
      'Mô tả được đám hạt rơi tự do biến dạng thế nào ngoài vật chất, trong vật chất và với năng lượng tối.',
      'Nói được lực thủy triều chính là độ cong của không-thời gian (độ lệch trắc địa).',
      'Phát biểu được phương trình Einstein bằng lời: thể tích một quả cầu nhỏ các hạt rơi tự do co theo mật độ năng lượng cộng ba lần áp suất.',
      'Tính được thủy triều của Mặt Trăng, độ kéo trên trạm vũ trụ và tại chân trời lỗ đen.',
    ],
    buoc: [
      {
        ten: 'Rơi tự do xoá trọng lực, nhưng không xoá hết',
        noiDung: R`
          Một đám hạt nhỏ đứng yên so với nhau được thả rơi về phía một hành tinh. Ở Bài 7 và Bài 8 ta đã thấy: người {{rơi tự do}} cùng đám hạt không cảm thấy trọng lực, mọi hạt quanh mình đều lơ lửng. Đó là điều nguyên lý tương đương hứa hẹn.

          Nhưng chỉ **gần đúng**. Nhìn bốn hạt được tô đậm:

          - Hai hạt nằm **cạnh nhau** theo phương ngang (xanh lam) đều rơi về **tâm** hành tinh. Hai đường rơi chụm vào nhau, nên hai hạt **tiến lại gần nhau**.
          - Hai hạt nằm **trên dưới** theo phương bán kính (hồng): hạt gần hành tinh bị hút mạnh hơn hạt ở xa (trọng lực giảm theo $1/r^2$), nên chúng **giãn xa nhau**.

          Vệt mờ phía sau mỗi hạt là đường nó đã đi. Ban đầu các vệt song song; về sau chúng chụm lại (cặp ngang) hoặc tách ra (cặp dọc).

          > [Thử ngay] Kéo đốm vàng (chỗ thả) lại gần hay ra xa hành tinh rồi buông tay: đám hạt rơi lại từ chỗ mới. Thả càng gần, hai cặp hạt tách ra và chụm lại càng nhanh. Rê chuột lên hành tinh để xem số liệu.
          > [[Thả lại|tha]] [[Máy quay đi theo đám hạt|theo]] [[Nhìn toàn cảnh|toan]]

          Sự chênh lệch trọng lực giữa hai chỗ gần nhau gọi là {{lực thủy triều}}. Không cách rơi nào xoá được nó, vì hai hạt ở hai chỗ khác nhau thì «cần» hai cách rơi khác nhau.`,
        vao: (c) => c.cauHinh({ macDinh: true, che: 'ngoai', hien: { cap: true, vet: true, elip: false, mui: false }, theo: false, mayAnh: 'toan' }),
        ra: (c) => c.imTieng(),
        nut: { tha: (c) => c.thaLai(), theo: (c) => c.cauHinh({ theo: true }), toan: (c) => c.cauHinh({ theo: false, mayAnh: 'toan' }) },
      },
      {
        ten: 'Quả cầu thành quả trứng: kéo 2GM/r³, ép GM/r³',
        noiDung: R`
          Giờ nhìn cả đám. Quả cầu hạt biến thành một **elipxoit** (hình quả trứng thuôn): dài ra theo phương hướng về hành tinh, bóp lại theo hai phương ngang. Lưới dây là elipxoit khớp với đám hạt, tính lại mỗi khung hình theo ba trục chính.

          Các mũi tên là **gia tốc tương đối** của mỗi hạt so với tâm đám: hướng **ra** ở hai đầu (hồng), hướng **vào** ở vòng ngang (xanh). Với một hạt cách tâm đám một đoạn nhỏ $\xi$:

          $$ \ddot\xi_{\text{dọc}} = +\frac{2GM}{r^3}\,\xi_{\text{dọc}}, \qquad \ddot\xi_{\text{ngang}} = -\frac{GM}{r^3}\,\xi_{\text{ngang}} $$

          $G$ là hằng số hấp dẫn, $M$ là khối lượng hành tinh, $r$ là khoảng cách từ tâm hành tinh tới đám hạt. Kéo dọc $2GM/r^3$, ép mỗi phương ngang $GM/r^3$: **tổng của ba số bằng không**. Đám hạt dài ra bao nhiêu thì hẹp lại bấy nhiêu, thể tích lúc đầu giữ nguyên.

          > [Ví dụ] Trên Trạm Vũ trụ Quốc tế ($r = 6\,771$ km), hai giọt nước cách nhau 1 m theo phương thẳng đứng có gia tốc tương đối $2GM/r^3 = 2{,}6 \times 10^{-6}$ m/s². Nhỏ, nhưng cộng dồn: sau khoảng mười phút hai giọt đã xa nhau thêm cỡ nửa mét (tính gần đúng, chưa kể chuyển động quanh Trái Đất của trạm).

          > [Thử ngay] [[Thả lại|tha]] [[Đi theo đám hạt|theo]] [[Ẩn hiện mũi tên|mui]]

          > [Lưu ý] **Âm thanh**: hai nốt kéo dài cùng bắt đầu ở 330 Hz lúc thả. Nốt trong như thủy tinh đi theo trục dọc, nốt êm đi theo trục ngang; tần số tỉ lệ với độ dài trục, nên trục dài gấp đôi thì nốt cao lên đúng một quãng tám. Đám hạt càng biến dạng, hai nốt càng tách xa nhau. Đây là quy đổi cho tai nghe, không phải tiếng có thật.`,
        vao: (c) => c.cauHinh({ macDinh: true, che: 'ngoai', hien: { cap: false, vet: false, elip: true, mui: true }, theo: true, mayAnh: 'theo' }),
        ra: (c) => c.imTieng(),
        nut: { tha: (c) => c.thaLai(), theo: (c) => c.cauHinh({ theo: true, mayAnh: 'theo' }), mui: (c) => c.cauHinh({ hien: { mui: 'dao' } }) },
        thuThach: {
          de: 'Kéo chỗ thả rồi buông tay sao cho **đúng lúc t = 3** (đồng hồ ở ô số liệu), trục dọc của elipxoit dài **gấp rưỡi** lúc thả: 1,50 ± 0,05.',
          kiem: (c) => c.ttTrucDoc(),
          giu: 0.4,
          goiY: R`Lúc đầu trục dọc dài ra cỡ $1 + (GM/r^3)\,t^2$, nên muốn được 1,5 ở $t = 3$ thì $GM/r^3$ phải cỡ 0,06. Đám hạt còn rơi lại gần nên bị kéo mạnh dần: thử thả trong khoảng r = 8 đến 9 rồi chỉnh dần. Tắt «Máy quay đi theo đám hạt» cho dễ kéo.`,
        },
      },
      {
        ten: 'Đó chính là độ cong',
        noiDung: R`
          Mỗi hạt rơi tự do đi theo một {{đường trắc địa}} của không-thời gian (Bài 10). Hai hạt cạnh nhau lúc đầu đứng yên với nhau: hai đường trắc địa của chúng xuất phát **song song**. Trong không-thời gian phẳng, hai đường thẳng song song giữ mãi khoảng cách. Ở đây chúng không giữ được: cặp ngang chụm lại, cặp dọc tách ra. Đó đúng là dấu hiệu của **{{độ cong}}**, như hai kinh tuyến song song ở xích đạo gặp nhau ở Bắc Cực.

          Thuyết tương đối rộng viết điều này thành **phương trình độ lệch trắc địa**:

          $$ \frac{\dd^2 \xi^i}{\dd \tau^2} = -R^i_{\ 0j0}\,\xi^j $$

          $\xi$ là véc-tơ nối hai hạt gần nhau, $\tau$ là thời gian riêng, $R$ là **tenxơ Riemann**, thứ đo độ cong. So với bước trước: $-R^i_{\ 0j0}$ chính là ma trận kéo ép (kéo $2GM/r^3$, ép $GM/r^3$).

          > [Hiểu sai thường gặp] «Đổi sang khung rơi tự do thì mọi hiệu ứng trọng lực biến mất.» Chỉ phần **đều** biến mất (Bài 8). Phần **chênh lệch** giữa hai điểm thì không khung nào xoá được. Trọng lực đều trong một thang máy chỉ là do chọn khung; độ cong là thật.

          +++ Đi sâu: từ Newton tới tenxơ thủy triều
          Gia tốc của hạt ở vị trí $\vec r$ là $\vec a = -GM\vec r/r^3$. Hạt bên cạnh ở $\vec r + \vec\xi$ có gia tốc $\vec a(\vec r + \vec\xi) \approx \vec a(\vec r) + (\xi \cdot \nabla)\vec a$. Hiệu hai gia tốc là

          $$ \ddot\xi_i = T_{ij}\,\xi_j, \qquad T_{ij} = \frac{\partial a_i}{\partial x_j} = \frac{GM}{r^5}\big(3x_ix_j - r^2\delta_{ij}\big) $$

          Chọn trục $x$ theo phương bán kính ($\vec r = (r;\ 0;\ 0)$): $T = \tfrac{GM}{r^3}\,\mathrm{diag}(2;\ -1;\ -1)$. Tổng các phần tử trên đường chéo bằng 0, vì $\nabla \cdot \vec a = -4\pi G\rho = 0$ ngoài vật chất.

          Trong thuyết tương đối rộng, với người rơi tự do theo phương bán kính quanh một lỗ đen Schwarzschild, các thành phần độ cong đo trong khung của người ấy cho đúng $\mathrm{diag}(2;\ -1;\ -1)\,GM/r^3$, cả sát chân trời. Hartle (2003), chương 21, trình bày độ lệch trắc địa và tenxơ Riemann kỹ hơn. Cơ học Newton dùng trong mô hình chỉ lệch khỏi đường trắc địa của Einstein cỡ $GM/(rc^2)$, rất nhỏ với hành tinh.
          +++`,
        vao: (c) => c.cauHinh({ macDinh: true, che: 'ngoai', hien: { cap: true, vet: true, elip: true, mui: false }, theo: false, mayAnh: 'toan' }),
        ra: (c) => c.imTieng(),
        nut: {},
      },
      {
        ten: 'Thể tích: ngoài vật chất và trong vật chất',
        noiDung: R`
          Đồ thị dưới bảng điều khiển ghi lại ba đại lượng theo thời gian: trục dọc của elipxoit (hồng), trục ngang (xanh) và thể tích (vàng), đều so với lúc thả. Nét đứt là dự đoán bậc hai:

          $$ \frac{a_{\text{dọc}}}{a_0} = 1 + \frac{GM}{r^3}t^2, \qquad \frac{a_{\text{ngang}}}{a_0} = 1 - \frac{GM}{2r^3}t^2 $$

          $$ \frac{V}{V_0} = \frac{a_{\text{dọc}}}{a_0}\Big(\frac{a_{\text{ngang}}}{a_0}\Big)^2 = 1 + (\text{bậc } t^4) $$

          **Ngoài vật chất**, thể tích lúc đầu không đổi: đường vàng nằm ngang một lúc rồi mới tách ra (khi đám hạt đã rơi gần hành tinh và biến dạng lớn).

          Giờ đặt đám hạt **bên trong** một quả cầu vật chất đồng đều mật độ $\rho$ (như một đường hầm xuyên qua hành tinh, hay một đám bụi lớn). Bên trong, gia tốc tỉ lệ thuận với khoảng cách tới tâm: $\vec a = -\tfrac{4\pi G\rho}{3}\vec r$. Mọi phương bị ép như nhau, và thể tích **co ngay từ đầu**:

          $$ \frac{\ddot V}{V} = -4\pi G\rho $$

          > [Thử ngay] Ở chế độ trong vật chất, kéo đốm vàng ra hẳn ngoài quả cầu rồi buông tay: đường vàng trên đồ thị lại nằm ngang lúc đầu, vì ở đó không có vật chất.
          > [[Ngoài vật chất|ngoai]] [[Trong vật chất|trong]]

          > [Lưu ý] Trong quả cầu đồng đều, mọi hạt thả đứng yên tới tâm **cùng một lúc**, nên đám hạt co về một điểm rồi nở ra ở phía bên kia. Đường hầm và vật chất trong suốt chỉ để nhìn thấy; hạt không va chạm gì.`,
        vao: (c) => c.cauHinh({ macDinh: true, che: 'ngoai', hien: { cap: false, vet: false, elip: true, mui: true }, theo: false, mayAnh: 'toan' }),
        ra: (c) => c.imTieng(),
        nut: { ngoai: (c) => c.cauHinh({ che: 'ngoai', mayAnh: 'toan' }), trong: (c) => c.cauHinh({ che: 'trong', mayAnh: 'toan' }) },
        thuThach: {
          de: 'Bấm «Trong vật chất», rồi kéo chỗ thả ra **hẳn ngoài** quả cầu vật chất và buông tay. Đạt khi lúc t = 1,5 thể tích còn ít nhất **0,95** lần lúc thả (thả bên trong thì chỉ còn khoảng 0,57).',
          kiem: (c) => c.ttTheTich(),
          giu: 0.4,
          goiY: 'Quả cầu vật chất có bán kính 7,6, đám hạt có bán kính 1,1: tâm đám phải cách tâm quả cầu từ 8,7 trở lên thì cả đám mới nằm ngoài vật chất. Ở đó V̈/V lúc thả bằng 0.',
        },
      },
      {
        ten: 'Phương trình Einstein nói bằng lời',
        noiDung: R`
          Baez và Bunn (2005) chỉ ra rằng toàn bộ {{phương trình Einstein}} có thể nói gọn thành một câu về chính đám hạt này:

          > [Định nghĩa] Lấy một quả cầu nhỏ các hạt rơi tự do, ban đầu đứng yên với nhau. Thể tích $V$ của nó bắt đầu co với gia tốc tỉ lệ với **mật độ năng lượng cộng ba lần áp suất** tại đó:
          > $$ \frac{\ddot V}{V}\Big|_{t=0} = -4\pi G\left(\rho + \frac{3P}{c^2}\right) $$

          $\rho$ là mật độ khối lượng (năng lượng chia $c^2$), $P$ là áp suất. Ngoài vật chất cả hai bằng 0: thể tích không đổi lúc đầu (bước 4). Với bụi lạnh, $P \approx 0$: ra đúng $-4\pi G\rho$. Áp suất cũng **gây hấp dẫn**, điều Newton không có.

          Dạng đầy đủ là phương trình tenxơ:

          $$ G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}\,T_{\mu\nu} $$

          - $g_{\mu\nu}$: {{metric}}, cho biết cách đo khoảng cách và thời gian.
          - $G_{\mu\nu}$: tenxơ Einstein, dựng từ độ cong (tenxơ Riemann) của metric. Phần độ cong cho biết thể tích co hay nở gọi là tenxơ Ricci; câu «thể tích co» ở trên chính là một thành phần của nó.
          - $T_{\mu\nu}$: {{tenxơ năng-xung lượng}}: mật độ năng lượng, dòng năng lượng, áp suất, ứng suất.
          - $\Lambda$: {{hằng số vũ trụ}}.
          - $\mu, \nu$ chạy 0, 1, 2, 3; hai tenxơ đối xứng nên có **10 phương trình**.

          Wheeler tóm ý: vật chất bảo không-thời gian cong thế nào; không-thời gian bảo vật chất đi thế nào.

          > [Thử ngay] [[Trong vật chất|trong]] [[Ngoài vật chất|ngoai]]`,
        vao: (c) => c.cauHinh({ macDinh: true, che: 'trong', hien: { cap: false, vet: false, elip: true, mui: true }, theo: false, mayAnh: 'toan' }),
        ra: (c) => c.imTieng(),
        nut: { trong: (c) => c.cauHinh({ che: 'trong', mayAnh: 'toan' }), ngoai: (c) => c.cauHinh({ che: 'ngoai', mayAnh: 'toan' }) },
      },
      {
        ten: 'Ba hệ quả từ một phương trình',
        noiDung: R`
          Cùng một câu «thể tích co theo $\rho + 3P/c^2$» cho ra ba hiện tượng rất khác nhau:

          1. **Thủy triều.** Ngoài vật chất, đám hạt giữ thể tích nhưng bị kéo dài: Mặt Trăng kéo lớp nước quanh Trái Đất thành **hai bướu**, một bướu hướng về Mặt Trăng, một bướu ở phía đối diện. Trái Đất quay một vòng dưới hai bướu ấy trong 24 giờ 50 phút, nên mỗi nơi có **hai lần triều lên** mỗi ngày.
          2. **Co sập hấp dẫn.** Với các hạt rơi tự do trong vật chất thường ($\rho > 0$, $P \ge 0$), thể tích luôn co: đám bụi, đám mây khí tự co lại. Một ngôi sao đứng vững được là nhờ chênh lệch áp suất đẩy vật chất ra, tức vật chất trong sao không rơi tự do. Nhưng áp suất cũng góp vào hấp dẫn, nên khi sao bị nén quá mức (Bài 11) thì áp suất càng lớn chỉ càng làm hấp dẫn mạnh thêm, và sao sụp thành lỗ đen (Bài 15).
          3. **Giãn nở tăng tốc.** Nếu áp suất **âm** đủ lớn, $P \lt -\rho c^2/3$, thì $\rho + 3P/c^2 \lt 0$ và thể tích **nở ra nhanh dần**. Năng lượng tối (hằng số vũ trụ) có $P = -\rho c^2$, thỏa điều kiện này: gia tốc tương đối $+\tfrac{\Lambda c^2}{3}\vec r$ đẩy mọi hạt ra xa nhau. Bài 18 dùng đúng điều này cho cả vũ trụ.

          > [Thử ngay] Ở chế độ thủy triều, kéo Mặt Trăng quanh Trái Đất: hai bướu nước quay theo nó. Kéo ra xa: bướu thấp đi rất nhanh, vì lực thủy triều giảm theo $1/d^3$. Tiếng sóng ở thành phố to lên khi nước lên, nhỏ đi khi nước rút (âm thanh minh hoạ).
          > [[Thủy triều trên Trái Đất|trieu]] [[Co sập: trong vật chất|trong]] [[Năng lượng tối|toi]]

          > [Lưu ý] Ở chế độ thủy triều, bướu nước được **phóng đại khoảng 2 triệu lần** (đỉnh bướu thật chỉ cao khoảng 0,36 m so với mực nước trung bình, trên bán kính 6 371 km), và Mặt Trăng được kéo lại gần khoảng 15 lần cho vừa khung hình. Đây là thủy triều «cân bằng» lý tưởng; bờ biển thật còn chịu ảnh hưởng của đáy biển và lục địa.`,
        vao: (c) => c.cauHinh({ macDinh: true, che: 'trieu', hien: { cap: false, vet: false, elip: true, mui: true }, theo: false, mayAnh: 'toan' }),
        ra: (c) => c.imTieng(),
        nut: { trieu: (c) => c.cauHinh({ che: 'trieu', mayAnh: 'toan' }), trong: (c) => c.cauHinh({ che: 'trong', mayAnh: 'toan' }), toi: (c) => c.cauHinh({ che: 'toi', mayAnh: 'toan' }) },
        thuThach: {
          de: 'Ở chế độ thủy triều, kéo Mặt Trăng ra xa cho tới khi đỉnh bướu nước chỉ còn **một nửa** hôm nay: 0,18 ± 0,01 m (xem ô số liệu).',
          kiem: (c) => c.ttTrieu(),
          giu: 0.4,
          goiY: R`Độ cao bướu tỉ lệ $1/d^3$. Muốn còn một nửa thì $d^3$ phải gấp đôi, tức $d$ gấp $\sqrt[3]{2} \approx 1{,}26$ lần: trên hình là khoảng 12,6.`,
        },
      },
      {
        ten: 'Con số: từ đại dương tới lỗ đen',
        noiDung: R`
          Độ kéo thủy triều theo phương bán kính là $2GM/r^3$ cho mỗi mét. Thay số:

          | Ở đâu | Phép tính | Kết quả |
          |---|---|---|
          | Mặt Trăng kéo nước trên Trái Đất | $2GM_{\text{Trăng}}R/d^3$ | $1{,}1 \times 10^{-6}$ m/s² |
          | Trạm Vũ trụ Quốc tế, mỗi mét | $2GM_{\text{Đất}}/r^3$, $r = 6\,771$ km | $2{,}6 \times 10^{-6}$ m/s² |
          | Chân trời lỗ đen 10 lần Mặt Trời, người cao 2 m | $c^2 \times 2\,\text{m}/r_s^2$ | khoảng $2 \times 10^{8}$ m/s² |
          | Chân trời Sgr A* (4,3 triệu lần Mặt Trời), người cao 2 m | như trên | khoảng $10^{-3}$ m/s² |

          ($GM_{\text{Trăng}} = 4{,}9028 \times 10^{12}$ m³/s², $R = 6\,371$ km, $d = 384\,400$ km.)

          Tại chân trời $r = r_s = 2GM/c^2$ nên $2GM/r_s^3 = c^2/r_s^2$: lỗ đen **càng nhỏ** thì thủy triều ở chân trời **càng mạnh**. Lỗ đen 10 lần Mặt Trời có $r_s \approx 30$ km; chênh lệch hai trăm triệu m/s² giữa đầu và chân sẽ kéo người thành sợi mì từ lâu trước khi tới chân trời. Sgr A* có $r_s \approx 1{,}3 \times 10^{7}$ km: chênh lệch chỉ một phần nghìn m/s², nhỏ hơn rung lắc của thang máy. Ta có thể vượt qua chân trời của lỗ đen khổng lồ mà **không cảm thấy gì**.

          > [Thử ngay] [[Thủy triều trên Trái Đất|trieu]] [[Rơi về hành tinh|ngoai]]`,
        vao: (c) => c.cauHinh({ macDinh: true, che: 'ngoai', hien: { cap: false, vet: false, elip: true, mui: true }, theo: true, mayAnh: 'theo' }),
        ra: (c) => c.imTieng(),
        nut: { trieu: (c) => c.cauHinh({ che: 'trieu', theo: false, mayAnh: 'toan' }), ngoai: (c) => c.cauHinh({ che: 'ngoai', theo: true, mayAnh: 'theo' }) },
        thuThach: {
          de: 'Kéo chỗ thả lại gần hành tinh sao cho độ kéo $2GM/r^3$ lúc thả gấp **8 lần** ở chỗ thả mặc định r = 11 (8 ± 0,6; xem dòng «Chỗ thả» ở ô số liệu).',
          kiem: (c) => c.ttKeoGap(),
          giu: 0.4,
          goiY: R`Độ kéo tỉ lệ $1/r^3$: gấp 8 lần nghĩa là $r$ chỉ còn một nửa, $r \approx 5{,}5$. Tắt «Máy quay đi theo đám hạt» cho dễ kéo.`,
        },
      },
    ],
    congThuc: [
      { ten: 'Gia tốc tương đối ngoài một khối cầu', tex: R`\ddot\xi_{\text{dọc}} = \frac{2GM}{r^3}\xi_{\text{dọc}},\quad \ddot\xi_{\text{ngang}} = -\frac{GM}{r^3}\xi_{\text{ngang}}`, y: 'Kéo theo phương bán kính, ép theo hai phương ngang; tổng ba hệ số bằng 0.' },
      { ten: 'Phương trình độ lệch trắc địa', tex: R`\frac{\dd^2\xi^i}{\dd\tau^2} = -R^i_{\ 0j0}\,\xi^j`, y: '$R$ là tenxơ Riemann (độ cong). Ngoài một khối cầu, trong khung rơi tự do: $-R^i_{\\ 0j0} = \\frac{GM}{r^3}\\,\\mathrm{diag}(2;\\ -1;\\ -1)$.' },
      { ten: 'Phương trình Einstein bằng lời (Baez và Bunn 2005)', tex: R`\frac{\ddot V}{V}\Big|_{t=0} = -4\pi G\Big(\rho + \frac{3P}{c^2}\Big)`, y: 'Quả cầu nhỏ các hạt rơi tự do, ban đầu đứng yên với nhau. Có hằng số vũ trụ thì vế phải cộng thêm $\\Lambda c^2$.' },
      { ten: 'Phương trình Einstein', tex: R`G_{\mu\nu} + \Lambda g_{\mu\nu} = \frac{8\pi G}{c^4}T_{\mu\nu}`, y: 'Độ cong (trái) bằng nội dung năng lượng (phải); 10 phương trình.' },
      { ten: 'Thủy triều tại chân trời', tex: R`\frac{2GM}{r_s^3} = \frac{c^2}{r_s^2}`, y: 'Lỗ đen càng nhỏ, thủy triều ở chân trời càng mạnh.' },
    ],
    cauHoi: [
      {
        hoi: 'Một phi hành gia rơi tự do không cảm thấy trọng lực. Thứ gì vẫn còn, dù phi hành gia rơi kiểu gì?',
        chon: ['Trọng lượng', 'Lực thủy triều: các vật ở hai chỗ gần nhau vẫn có gia tốc tương đối', 'Lực quán tính li tâm', 'Không còn gì cả'],
        dung: 1,
        giai: 'Rơi tự do xoá phần trọng lực đều tại chỗ. Phần chênh lệch giữa hai chỗ khác nhau (lực thủy triều) không khung nào xoá được; nó chính là độ cong của không-thời gian.',
      },
      {
        hoi: 'Đám hạt rơi về một hành tinh bị kéo theo phương bán kính với hệ số 2GM/r³. Theo mỗi phương ngang, nó bị ép với hệ số bao nhiêu?',
        chon: ['2GM/r³', 'GM/r³', 'GM/(2r³)', '0'],
        dung: 1,
        giai: 'Ngoài vật chất, tổng ba hệ số bằng 0 (tenxơ thủy triều không có vết): 2 − 1 − 1 = 0. Nhầm GM/(2r³) là nhầm hệ số trong công thức bán trục $1 - GMt^2/(2r^3)$, vốn có thêm thừa số ½ do tích phân hai lần.',
      },
      {
        hoi: 'Một quả cầu nhỏ các hạt bụi đứng yên với nhau, nằm ngoài mọi vật chất, bắt đầu rơi tự do. Lúc đầu thể tích của nó:',
        chon: ['Co lại', 'Nở ra', 'Không đổi (gia tốc của thể tích bằng 0), dù hình dạng biến thành elipxoit', 'Co về một điểm ngay lập tức'],
        dung: 2,
        giai: R`Phương trình Einstein với $\rho = P = 0$ cho $\ddot V/V = 0$. Đám hạt dài ra theo một phương và hẹp lại theo hai phương kia đúng bù trừ. Chỉ khi có vật chất ($\rho > 0$) thì thể tích mới co ngay từ đầu.`,
      },
      {
        hoi: 'Vì sao năng lượng tối làm vũ trụ giãn nở nhanh dần?',
        chon: ['Vì nó có mật độ âm', 'Vì áp suất của nó âm và đủ lớn: P = −ρc² nhỏ hơn −ρc²/3, nên ρ + 3P/c² < 0', 'Vì nó đẩy các thiên hà bằng một lực mới', 'Vì nó làm ánh sáng chậm lại'],
        dung: 1,
        giai: R`Với $P = -\rho c^2$: $\rho + 3P/c^2 = -2\rho \lt 0$, nên $\ddot V/V = +8\pi G\rho > 0$: thể tích nở nhanh dần. Mật độ năng lượng của nó vẫn dương; chính áp suất âm làm đổi dấu.`,
      },
      {
        hoi: 'Lỗ đen nào nguy hiểm hơn cho người rơi qua chân trời: lỗ đen 10 lần khối lượng Mặt Trời hay Sgr A* (4,3 triệu lần)?',
        chon: ['Sgr A*, vì nặng hơn', 'Lỗ đen 10 lần Mặt Trời, vì thủy triều ở chân trời tỉ lệ c²/rs², lỗ đen nhỏ có rs nhỏ', 'Như nhau, vì chân trời nào cũng giống nhau', 'Không lỗ đen nào gây thủy triều'],
        dung: 1,
        giai: R`Tại chân trời $2GM/r_s^3 = c^2/r_s^2$. Với 10 lần Mặt Trời, chênh lệch cho người cao 2 m khoảng $2 \times 10^8$ m/s²; với Sgr A* chỉ khoảng $10^{-3}$ m/s².`,
      },
      {
        hoi: 'Vì sao mỗi ngày có hai lần triều lên chứ không phải một?',
        dap: 'Lực thủy triều kéo dài lớp nước theo đường nối Trái Đất với Mặt Trăng về CẢ HAI phía: phía gần Mặt Trăng bị hút mạnh hơn tâm Trái Đất, phía xa bị hút yếu hơn tâm Trái Đất, nên cả hai phía đều «tụt lại» so với tâm, tạo hai bướu đối xứng. Trái Đất quay một vòng dưới hai bướu đó trong khoảng 24 giờ 50 phút, nên mỗi nơi đi qua hai bướu, tức hai lần triều lên, cách nhau khoảng 12 giờ 25 phút.',
      },
    ],
    docThem: [
      'J. C. Baez và E. F. Bunn, «The Meaning of Einstein’s Equation», Am. J. Phys. 73, 644 (2005): phương trình Einstein phát biểu bằng thể tích của một quả cầu hạt rơi tự do.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 21: độ cong, độ lệch trắc địa, phương trình Einstein.',
      'C. W. Misner, K. S. Thorne và J. A. Wheeler, *Gravitation* (1973): lực thủy triều và độ cong.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): thủy triều quanh lỗ đen, «kéo thành sợi mì».',
    ],
    thuatNgu: [
      { vi: 'độ lệch trắc địa', en: 'geodesic deviation', nghia: 'Sự thay đổi khoảng cách giữa hai đường trắc địa gần nhau. Trong không-thời gian cong, hai đường lúc đầu song song sẽ chụm lại hoặc tách ra; phương trình độ lệch trắc địa nối điều đó với tenxơ Riemann.' },
      { vi: 'tenxơ Riemann', en: 'Riemann curvature tensor', nghia: 'Đại lượng đo đầy đủ độ cong của không-thời gian tại một điểm; trong khung rơi tự do, một phần của nó chính là ma trận gia tốc thủy triều.' },
      { vi: 'tenxơ thủy triều', en: 'tidal tensor', nghia: 'Ma trận cho gia tốc tương đối của hai hạt gần nhau theo véc-tơ nối chúng. Ngoài một khối cầu: kéo 2GM/r³ theo phương bán kính, ép GM/r³ mỗi phương ngang.' },
      { vi: 'tenxơ Einstein', en: 'Einstein tensor', nghia: 'Tổ hợp của độ cong (từ tenxơ Riemann) đứng ở vế trái phương trình Einstein.' },
      { vi: 'thủy triều cân bằng', en: 'equilibrium tide', nghia: 'Hình dạng lớp nước nếu Trái Đất phủ kín nước và nước kịp chảy theo lực thủy triều: hai bướu đối xứng, chênh cao khoảng nửa mét do Mặt Trăng.' },
    ],
  },

  conSo: [
    '**1,1 × 10⁻⁶ m/s²**: gia tốc thủy triều của Mặt Trăng trên mặt Trái Đất.',
    '**2,6 × 10⁻⁶ m/s² mỗi mét**: độ kéo thủy triều trên Trạm Vũ trụ Quốc tế.',
    '**2 × 10⁸ m/s²**: chênh lệch giữa đầu và chân người cao 2 m ở chân trời lỗ đen 10 lần Mặt Trời; với Sgr A* chỉ khoảng 10⁻³ m/s².',
    '**10**: số phương trình thành phần trong phương trình Einstein (mỗi vế là một bảng đối xứng 4 × 4).',
  ],
  hieuDung: '**Rơi tự do không xoá hết trọng lực.** Nó chỉ xoá phần đều tại chỗ. Lực thủy triều (độ chênh trọng lực giữa hai chỗ gần nhau) thì không khung nào xoá được; đó mới là độ cong thật của không-thời gian. Mô hình dùng cơ học Newton, đúng với trường yếu tới sai số cỡ GM/(rc²); bướu nước ở chế độ thủy triều phóng đại khoảng 2 triệu lần.',
  nguon: 'Phát biểu phương trình Einstein bằng thể tích: Baez và Bunn 2005, Am. J. Phys. 73, 644. Độ cong, độ lệch trắc địa và phương trình Einstein: Hartle 2003, ch. 21. Hằng số: GM Mặt Trăng 4,9028 × 10¹² m³/s², GM Trái Đất 3,986004418 × 10¹⁴ m³/s², GM Mặt Trời 1,32712440018 × 10²⁰ m³/s² (JPL); khoảng cách Mặt Trăng trung bình 384 400 km; Sgr A* 4,3 triệu khối lượng Mặt Trời (GRAVITY). Mô phỏng đám hạt: cơ học Newton, Verlet vận tốc.',

  tao(app) {
    const scene = new THREE.Scene();
    const am = app.am, tt = app.tt;
    const bau = taoNenSao({ soSao: 2200, hat: 41, doSang: 0.55 });
    scene.add(bau);
    // ánh sáng: một «Mặt Trời» chếch phía trước bên trái, đèn viền xanh lạnh phía sau, chút đèn môi trường
    scene.add(new THREE.AmbientLight(0x8090b0, 0.18));
    const den = new THREE.DirectionalLight(0xfff2e0, 2.4);
    den.position.copy(HUONG_SANG).multiplyScalar(30);
    const denVien = new THREE.DirectionalLight(0x7fa8ff, 1.3);
    denVien.position.set(8, 4, -14);
    scene.add(den, denVien);

    const S = {
      che: 'ngoai', t: 0, theo: false, hien: { cap: true, vet: true, elip: false, mui: false },
      lamda0: 1, V0: 1, kMui: 1, cho: 0, keo: false, vuaTha: false,
      tha: { ngoai: [R_THA_MAC_DINH, 0, 0], trong: [5.2, 0, 0], toi: [0, 0, 0] },
      daKeoTha: false, arTT: null, VTT: null,
      dTrang: D_HINH, gocTrang: 0, daKeoTrang: false,
      hienNhom: { ngoai: 1, trong: 0, toi: 0, trieu: 0 },
    };
    const CD = () => CHE_DO[S.che];
    const truong = () => CD().truong;
    const tamTha = () => S.tha[S.che] || [0, 0, 0];
    const huongTha = () => { const p = tamTha(); return Math.atan2(-p[2], p[0]); };   // góc trong mặt phẳng xz

    // ---------- Hành tinh (chế độ «ngoài»): Trái Đất thật, có khí quyển và đường sáng tối ----------
    const nhomHT = new THREE.Group();
    const ht = taoTraiDat({ banKinh: RP, tocDoQuay: 0.025 });
    ht.datHuongSang(HUONG_SANG);
    nhomHT.add(ht.nhom);
    const nhanHT = taoNhan(chuCanh("canh.hanh-tinh-khoi-luong-m-ve-theo-trai", "Hành tinh<small>khối lượng M · vẽ theo Trái Đất</small>"), 'dam');
    nhanHT.position.set(-RP * 0.75, RP + 0.55, 0);
    nhomHT.add(nhanHT);
    // vòng đo khoảng cách r (để chọn chỗ thả): mảnh, mờ, có số
    for (const r of [4, 6, 8, 10, 12, 14]) {
      const v = new DuongDay(161, { mau: 0xbfd2ff, rong: 1, doMo: r % 4 ? 0.1 : 0.16, cong: true });
      for (let i = 0; i <= 160; i++) { const a = (i / 160) * 2 * Math.PI; v.dat(i, r * Math.cos(a), 0, r * Math.sin(a)); }
      v.xong(161);
      nhomHT.add(v.line);
      if (r < 6) continue;
      const n = taoNhan(`r = ${r}`, 'mo tran giua');
      n.element.style.fontSize = '10.5px';
      n.position.set(r * Math.cos(1.62), 0, r * Math.sin(1.62));
      nhomHT.add(n);
    }
    scene.add(nhomHT);
    tt.them(ht.nhom, {
      ten: chuCanh("canh.hanh-tinh", "Hành tinh"), mau: 0x9fc7ff,
      moTa: () => chuCanh("canh.khoi-luong-m-gm-don-vi-mo-phong", "Khối lượng M, GM = {0} (đơn vị mô phỏng), bán kính {1}.<br>Hút mọi hạt về <b>tâm</b> với gia tốc GM/r²: hạt gần mạnh hơn hạt xa, hai hạt ngang thì bị hút theo hai hướng chụm vào nhau.", [so(GM_HANH_TINH, 0), so(RP, 1)]),
    });

    // ---------- Quả cầu vật chất đồng đều (chế độ «trong») ----------
    const nhomKhoi = new THREE.Group();
    const khoi = new THREE.Mesh(new THREE.SphereGeometry(R_KHOI, 96, 64), kinh({ mau: 0xc8aaff, nen: 0.004, vien: 0.2, luoi: 0.045, soVi: 12, soKinh: 24, mu: 3.2 }));
    const bui = taoBui(R_KHOI);
    const ham = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 2 * R_KHOI + 0.8, 64, 1, true), kinh({ mau: 0xc8aaff, nen: 0.006, vien: 0.22, luoi: 0, mu: 2.2 }));
    ham.rotation.z = Math.PI / 2;
    const huongHam = new THREE.Group();
    huongHam.add(ham);
    const nhanKhoi = taoNhan(chuCanh("canh.qua-cau-vat-chat-dong-deu-mat-do", "Quả cầu vật chất đồng đều<small>mật độ ρ · đường hầm xuyên qua tâm</small>"), 'dam');
    nhanKhoi.position.set(-R_KHOI * 0.92, R_KHOI * 0.55, 0);
    const tamKhoi = taoDom(new THREE.Color(0xc8aaff).multiplyScalar(1.6), 0.9);
    nhomKhoi.add(khoi, bui, huongHam, nhanKhoi, tamKhoi);
    scene.add(nhomKhoi);
    tt.them(khoi, {
      ten: chuCanh("canh.qua-cau-vat-chat-dong-deu", "Quả cầu vật chất đồng đều"), mau: 0xc8aaff, noiBat: false,
      moTa: () => chuCanh("canh.ban-kinh-ben-trong-gia-toc-ti-le", "Bán kính {0}. Bên trong: gia tốc <b>tỉ lệ thuận</b> với khoảng cách tới tâm, a = −(4πGρ/3)·r, nên V̈/V = −4πGρ.<br>Bên ngoài: hút như một khối lượng điểm GM/r², V̈/V lúc thả bằng 0.", [so(R_KHOI, 1)]),
    });

    // ---------- Năng lượng tối: lưới hạt thử giãn theo cùng nhịp với đám hạt ----------
    const nhomToi = new THREE.Group();
    const luoiToi = taoLuoiToi();
    luoiToi.position.y = -2.6;
    nhomToi.add(luoiToi);
    {
      const n = taoNhan(chuCanh("canh.khong-gian-trong-chi-co-nang-luong-toi", "Không gian trống, chỉ có năng lượng tối<small>gia tốc tương đối +(Λc²/3)·r ở mọi nơi · lưới: các hạt thử đứng yên lúc thả</small>"), 'dam giua');
      n.position.set(0, -3.4, 0);
      nhomToi.add(n);
    }
    scene.add(nhomToi);

    // ---------- Thủy triều: Trái Đất thật, lớp nước kính, Mặt Trăng thật ----------
    const nhomTrieu = new THREE.Group();
    const quayDat = new THREE.Group();                 // Trái Đất tự quay (trục thẳng đứng, Mặt Trăng ở mặt phẳng xích đạo)
    const datT = taoTraiDat({ banKinh: RP, nghieng: 0, tocDoQuay: 0 });
    datT.datHuongSang(HUONG_SANG);
    quayDat.add(datT.nhom);
    const thanhPho = taoDom(new THREE.Color(0xffd27a).multiplyScalar(2.6), 0.42);
    thanhPho.position.set(RP * 1.01, 0, 0);
    const nhanTP = taoNhan(chuCanh("canh.mot-thanh-pho-ven-bien", "Một thành phố ven biển"), 'tran');
    nhanTP.element.style.color = '#ffd27a';
    nhanTP.position.set(RP * 1.08, 0.12, 0);
    quayDat.add(thanhPho, nhanTP);
    const NU = 128, NV = 80;
    const geoNuoc = new THREE.SphereGeometry(1, NU, NV);
    const goc0 = Float32Array.from(geoNuoc.attributes.position.array);
    const nuoc = new THREE.Mesh(geoNuoc, kinh({ mau: 0x5fb4ff, nen: 0.02, vien: 0.55, luoi: 0, mu: 2.8 }));
    const huongTrieu = new THREE.Group();              // lớp nước, mũi tên, đường viền xoay theo hướng Mặt Trăng
    huongTrieu.add(nuoc);
    const tr = taoMatTrang({ banKinh: 0.68 });
    tr.datHuongSang(HUONG_SANG);
    const nhanTrang = taoNhan(chuCanh("canh.mat-trang-keo-lai-gan-khoang-15-lan", "Mặt Trăng<small>kéo lại gần khoảng 15 lần cho vừa hình</small>"), 'dam');
    nhanTrang.center.set(0.5, 1);   // đặt nhãn ngay trên Mặt Trăng, căn giữa, để cửa sổ hẹp không đẩy chữ xuống dưới bảng bài giảng
    const nhanBuou1 = taoNhan(chuCanh("canh.buou-huong-ve-mat-trang", "bướu hướng về Mặt Trăng"), 'tran');
    nhanBuou1.element.style.color = '#8fd4ff';
    nhanBuou1.position.set(RP * 1.22, 0.6, 0);
    const nhanBuou2 = taoNhan(chuCanh("canh.buou-phia-doi-dien", "bướu phía đối diện"), 'tran giua');
    nhanBuou2.element.style.color = '#8fd4ff';
    nhanBuou2.position.set(-RP * 1.5, 0.7, 0);
    huongTrieu.add(nhanBuou1, nhanBuou2);
    const nhanPD = taoNhan(chuCanh("canh.lop-nuoc-phong-dai-khoang-2-trieu-lan", "lớp nước phóng đại khoảng 2 triệu lần"), 'mo tran giua');
    nhanPD.position.set(0, -RP * 1.5, 0);
    nhomTrieu.add(quayDat, huongTrieu, tr.nhom, nhanTrang, nhanPD);
    // đường viền lớp nước ở mặt phẳng xích đạo và vòng bán kính trung bình (nét đứt) để so
    const vienNuoc = new DuongDay(161, { mau: 0x8fd4ff, rong: 2.2, quang: 0.12, sang: 1.4 });
    const vongTB = new DuongDay(161, { mau: 0xffffff, rong: 1.1, doMo: 0.4, cong: false, net: [0.15, 0.12] });
    huongTrieu.add(vienNuoc.line, vongTB.line);
    // mũi tên thủy triều quanh Trái Đất (mặt phẳng xích đạo), có khối
    const muiTrieu = [];
    for (let k = 0; k < 16; k++) {
      const th = (k / 16) * 2 * Math.PI, cx = Math.cos(th), sz = Math.sin(th);
      const ra = 2 * cx * cx - sz * sz > 0;            // gia tốc thủy triều ∝ (2cosθ, −sinθ)
      const m = taoMuiTen3D(ra ? MAU_KTG.hong : MAU_KTG.thoiGian, { day: 0.03, dau: 0.2 });
      m.th = th;
      huongTrieu.add(m.nhom);
      muiTrieu.push(m);
    }
    scene.add(nhomTrieu);
    tt.them(tr.nhom, {
      ten: chuCanh("canh.mat-trang", "Mặt Trăng"), mau: 0xdedad0, banKinhPx: 22,
      moTa: () => chuCanh("canh.tren-hinh-cach-trai-dat-khoang-cach-that", "Trên hình cách Trái Đất {0} (khoảng cách thật tương ứng: {1} km).<br>Đỉnh bướu nước: <b>{2} m</b>, tỉ lệ với 1/d³.", [so(S.dTrang, 1), so((384400 * S.dTrang) / D_HINH, 0), so(dinhBuou(S.dTrang), 3)]),
    });
    tt.them(thanhPho, {
      ten: chuCanh("canh.thanh-pho-ven-bien", "Thành phố ven biển"), mau: 0xffd27a, banKinhPx: 16,
      moTa: () => chuCanh("canh.muc-nuoc-luc-nay-m-so-voi-trung", "Mực nước lúc này: <b>{0} m</b> so với trung bình. Mỗi ngày đi qua hai bướu: hai lần triều lên.", [so(mucNuocTP(), 2)]),
    });

    // ---------- Đám hạt: hạt sáng có khối (vẽ như quả cầu nhỏ có ánh sáng), thêm một lớp quầng ----------
    const x0 = taoDamHat();
    const N = N_HAT;
    const x = new Float64Array(3 * N), v = new Float64Array(3 * N), a = new Float64Array(3 * N);
    const viTriDiem = new Float32Array(3 * N), mauDiem = new Float32Array(3 * N), coDiem = new Float32Array(N);
    {
      const c = new THREE.Color(), xanh = new THREE.Color(0x7fcaff), hong = new THREE.Color(0xff7aa8);
      for (let i = 0; i < N; i++) {
        const px = x0[3 * i] / RC, py = x0[3 * i + 1] / RC, pz = x0[3 * i + 2] / RC;
        const l = Math.hypot(px, py, pz) || 1;
        const doc = Math.abs(px) / l;                        // gần trục dọc (phương bán kính) → hồng
        const dau = i >= N_MAT + N_TRONG, mat = i < N_MAT;
        if (mat || dau) c.copy(xanh).lerp(hong, doc * doc);
        else c.setRGB(0.95, 0.86, 0.72).multiplyScalar(0.55);
        mauDiem[3 * i] = c.r; mauDiem[3 * i + 1] = c.g; mauDiem[3 * i + 2] = c.b;
        coDiem[i] = dau ? 0.07 : mat ? 0.04 : 0.03;
      }
    }
    const geoDiem = new THREE.BufferGeometry();
    geoDiem.setAttribute('position', new THREE.BufferAttribute(viTriDiem, 3).setUsage(THREE.DynamicDrawUsage));
    geoDiem.setAttribute('color', new THREE.BufferAttribute(mauDiem, 3));
    geoDiem.setAttribute('aCo', new THREE.BufferAttribute(coDiem, 1));
    const matHat = vatLieuHat(), matQuang = vatLieuQuangHat();
    const hat = new THREE.Points(geoDiem, matHat);
    const quangHat = new THREE.Points(geoDiem, matQuang);
    hat.frustumCulled = quangHat.frustumCulled = false;
    hat.onBeforeRender = (r) => matHat.datCo(r);
    quangHat.onBeforeRender = (r) => matQuang.datCo(r);
    const nhomDam = new THREE.Group();
    nhomDam.add(quangHat, hat);
    scene.add(nhomDam);
    const nhanDam = taoNhan(chuCanh("canh.dam-hat-roi-tu-do-luc-tha-dung", "Đám hạt rơi tự do<small>lúc thả: đứng yên với nhau</small>"), 'dam');
    nhomDam.add(nhanDam);

    // vỏ elipxoit kính khớp ba trục chính, và ba trục (hồng: dọc, xanh: hai trục ngang)
    const elip = new THREE.Group();
    const voElip = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), kinh({ mau: 0xffe2a8, nen: 0.025, vien: 0.5, luoi: 0.3, soVi: 6, soKinh: 16, mu: 2.6 }));
    elip.add(voElip);
    scene.add(elip);
    const trucElip = [0, 1, 2].map(() => { const d = new DuongDay(2, { mau: 0xffe2a8, rong: 2, quang: 0.12, sang: 1.5, cong: true }); scene.add(d.line); return d; });
    // quả cầu cỡ lúc thả (để so), đi theo tâm đám
    const cauGoc = new THREE.Group();
    {
      const g = new THREE.Mesh(new THREE.SphereGeometry(RC, 48, 32), kinh({ mau: 0xffffff, nen: 0, vien: 0.22, luoi: 0, mu: 3 }));
      cauGoc.add(g);
      const n = taoNhan(chuCanh("canh.co-luc-tha", "cỡ lúc thả"), 'mo tran');
      n.position.set(RC * 0.72, RC * 0.82, 0);
      cauGoc.add(n);
    }
    scene.add(cauGoc);

    // mũi tên gia tốc tương đối tại 14 hạt đánh dấu (có khối)
    const dsMui = Array.from({ length: N_DAU }, () => { const m = taoMuiTen3D(MAU_KTG.hong); scene.add(m.nhom); return m; });

    // cặp hạt tô đậm và vệt đường đi mờ dần (bước 1)
    const CAP = [
      { i: N_MAT + N_TRONG + 0, mau: MAU_KTG.hong }, { i: N_MAT + N_TRONG + 1, mau: MAU_KTG.hong },
      { i: N_MAT + N_TRONG + 2, mau: MAU_KTG.thoiGian }, { i: N_MAT + N_TRONG + 3, mau: MAU_KTG.thoiGian },
    ];
    const nhomCap = new THREE.Group();
    scene.add(nhomCap);
    for (const c of CAP) {
      c.dom = taoDom(new THREE.Color(c.mau).multiplyScalar(2.2), 0.55);
      c.vet = new DuongDay(NLS, { mau: c.mau, rong: 2.2, moDan: true, quang: 0.1, sang: 1.3 });
      c.ls = new Float32Array(NLS * 3);
      nhomCap.add(c.dom, c.vet.line);
    }
    const noiDoc = new DuongDay(2, { mau: MAU_KTG.hong, rong: 2.4, quang: 0.12, sang: 1.6 });
    const noiNgang = new DuongDay(2, { mau: MAU_KTG.thoiGian, rong: 2.4, quang: 0.12, sang: 1.6 });
    const nhanDoc = taoNhan('', 'tran'); nhanDoc.element.style.color = '#ff9cc0';
    const nhanNgang = taoNhan('', 'tran'); nhanNgang.element.style.color = '#9fd6ff';
    nhomCap.add(noiDoc.line, noiNgang.line, nhanDoc, nhanNgang);
    let soVet = 0, dauVet = 0, choVet = 0;

    // ---------- Tay nắm ----------
    const gioiHanTha = (p) => {
      p.y = 0;
      const r = Math.hypot(p.x, p.z) || 1e-9;
      const [rMin, rMax] = S.che === 'ngoai' ? [RP + RC + 0.45, 15] : [0, 13.5];
      const rr = kep(r, rMin, rMax);
      if (rr < 1e-6) { p.x = 0; p.z = 0; } else { p.x *= rr / r; p.z *= rr / r; }
      return p;
    };
    const tayTha = tt.tayNam({
      viTri: [R_THA_MAC_DINH, 0, 0], mau: 0xf3c66f, co: 0.09,
      rangBuoc: { kieu: 'mat-phang', phap: [0, 1, 0], qua: [0, 0, 0] },
      gioiHan: gioiHanTha,
      nhan: chuCanh("canh.keo-cho-tha-dam-hat", "Kéo chỗ thả đám hạt"), ten: chuCanh("canh.cho-tha-dam-hat", "Chỗ thả đám hạt"),
      moTa: () => moTaTha(),
      khiNam: () => { S.keo = true; },
      khiKeo: (p) => { S.tha[S.che] = [p.x, 0, p.z]; thaLai(); capNhatHam(); },
      khiTha: (p) => {
        S.keo = false; S.tha[S.che] = [p.x, 0, p.z];
        S.daKeoTha = true; S.arTT = null; S.VTT = null;
        thaLai(); capNhatHam();
        if (S.theo) S.vuaTha = true;
      },
    });
    const tayTrang = tt.tayNam({
      viTri: [D_HINH, 0, 0], mau: 0xdedad0, co: 0.07,
      rangBuoc: { kieu: 'mat-phang', phap: [0, 1, 0], qua: [0, 0, 0] },
      gioiHan: (p) => { p.y = 0; const r = Math.hypot(p.x, p.z) || 1e-9, rr = kep(r, 6.5, 16); p.x *= rr / r; p.z *= rr / r; return p; },
      nhan: chuCanh("canh.keo-mat-trang", "Kéo Mặt Trăng"), ten: chuCanh("canh.mat-trang", "Mặt Trăng"),
      moTa: () => chuCanh("canh.khoang-cach-tren-hinh-dinh-buou-nuoc-m", "Khoảng cách trên hình {0}. Đỉnh bướu nước {1} m.", [so(S.dTrang, 1), so(dinhBuou(S.dTrang), 3)]),
      khiKeo: (p) => { datTrang(Math.hypot(p.x, p.z), Math.atan2(-p.z, p.x)); },
      khiTha: (p) => { datTrang(Math.hypot(p.x, p.z), Math.atan2(-p.z, p.x)); S.daKeoTrang = true; },
    });
    function moTaTha() {
      const p = tamTha(), r = Math.hypot(p[0], p[2]);
      if (S.che === 'ngoai') return chuCanh("canh.cach-tam-hanh-tinh-r-do-keo-2gm", "Cách tâm hành tinh r = <b>{0}</b>.<br>Độ kéo 2GM/r³ = {1}, gấp <b>{2}</b> lần ở chỗ thả mặc định (r = {3}).", [so(r, 2), so((2 * GM_HANH_TINH) / r ** 3, 3), so(tiSoKeo(r), 2), R_THA_MAC_DINH]);
      const trong = r + RC < R_KHOI, ngoai = r - RC >= R_KHOI;
      return chuCanh("canh.cach-tam-qua-cau-r-ban-kinh-qua", "Cách tâm quả cầu r = <b>{0}</b> (bán kính quả cầu {1}).<br>{2}", [so(r, 2), so(R_KHOI, 1), trong ? chuCanh("canh.ca-dam-hat-nam-trong-vat-chat-v", "Cả đám hạt nằm <b>trong vật chất</b>: V̈/V lúc thả = −4πGρ.") : ngoai ? chuCanh("canh.ca-dam-hat-nam-ngoai-vat-chat-v", "Cả đám hạt nằm <b>ngoài vật chất</b>: V̈/V lúc thả = 0.") : chuCanh("canh.dam-hat-dang-vat-qua-mat-qua-cau", "Đám hạt đang vắt qua mặt quả cầu.")]);
    }

    // ---------- điều khiển ----------
    const bang = app.bang;
    const dkChe = bang.chon({
      nhan: chuCanh("canh.che-do", "Chế độ"),
      luaChon: [
        { giaTri: 'ngoai', nhan: chuCanh("canh.ngoai-vat-chat", "Ngoài vật chất"), moTa: chuCanh("canh.dam-hat-roi-ve-mot-hanh-tinh", "Đám hạt rơi về một hành tinh") },
        { giaTri: 'trong', nhan: chuCanh("canh.trong-vat-chat", "Trong vật chất"), moTa: chuCanh("canh.dam-hat-ben-trong-mot-qua-cau-vat", "Đám hạt bên trong một quả cầu vật chất đồng đều") },
        { giaTri: 'toi', nhan: chuCanh("canh.nang-luong-toi", "Năng lượng tối"), moTa: chuCanh("canh.hang-so-vu-tru", "Hằng số vũ trụ") },
        { giaTri: 'trieu', nhan: chuCanh("canh.thuy-trieu", "Thủy triều"), moTa: chuCanh("canh.mat-trang-keo-lop-nuoc-quanh-trai-dat", "Mặt Trăng kéo lớp nước quanh Trái Đất") },
      ],
      giaTri: S.che,
      khiDoi: (v2) => cauHinh({ che: v2, mayAnh: S.theo ? 'theo' : 'toan' }),
    });
    const dkTheo = bang.congTac({ nhan: chuCanh("canh.may-quay-di-theo-dam-hat", "Máy quay đi theo đám hạt"), giaTri: false, khiDoi: (b) => cauHinh({ theo: b, mayAnh: b ? 'theo' : 'toan' }) });
    const dkMui = bang.congTac({ nhan: chuCanh("canh.mui-ten-gia-toc-tuong-doi", "Mũi tên gia tốc tương đối"), giaTri: false, khiDoi: (b) => cauHinh({ hien: { mui: b } }) });
    const dkElip = bang.congTac({ nhan: chuCanh("canh.elipxoit-khop-ba-truc", "Elipxoit khớp ba trục"), giaTri: false, khiDoi: (b) => cauHinh({ hien: { elip: b } }) });
    bang.nut([{ nhan: chuCanh("canh.tha-lai", "Thả lại"), chinh: true, khiBam: () => thaLai() }, { nhan: chuCanh("canh.ve-cho-tha-mac-dinh", "Về chỗ thả mặc định"), khiBam: () => veMacDinh() }]);
    const doThi = bang.doThi(160);
    const ghiChu = bang.chuThich('');

    // ---------- lịch sử cho đồ thị ----------
    const NLSU = 500;
    const ls = { t: new Float32Array(NLSU), ar: new Float32Array(NLSU), at: new Float32Array(NLSU), V: new Float32Array(NLSU), n: 0 };
    let choGhi = 0;

    // ---------- trạng thái đo ----------
    const doDo = taoKetQuaDo();
    const M4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
    const _g = [0, 0, 0], _g0 = [0, 0, 0];
    let huongD = [1, 0, 0];

    function thaLai() {
      const cd = CD();
      S.t = 0; ls.n = 0; choGhi = 0; soVet = 0; dauVet = 0; choVet = 0; S.cho = 0;
      if (!cd.truong) return;
      const tam = tamTha(), g = huongTha(), c = Math.cos(g), sn = Math.sin(g);
      // xoay đám hạt quanh trục đứng cho hạt «+x» luôn nằm theo phương bán kính của chỗ thả
      for (let i = 0; i < N; i++) {
        const X = x0[3 * i], Y = x0[3 * i + 1], Z = x0[3 * i + 2];
        x[3 * i] = c * X + sn * Z + tam[0]; x[3 * i + 1] = Y + tam[1]; x[3 * i + 2] = -sn * X + c * Z + tam[2];
      }
      v.fill(0);
      khoiGiaTocT(cd.truong, x, a, N);
      hiepPhuong(x, N, doDo.cov, doDo.tam);
      triRieng3(doDo.cov, doDo.gt, doDo.vtr);
      S.lamda0 = (doDo.gt[0] + doDo.gt[1] + doDo.gt[2]) / 3;
      S.V0 = Math.sqrt(det3(doDo.cov));
      huongD = huongDoc(cd.truong, tam);
      // thang mũi tên: gia tốc tương đối lớn nhất lúc thả hiện dài 0,8
      giaTocT(cd.truong, doDo.tam[0], doDo.tam[1], doDo.tam[2], _g0);
      giaTocT(cd.truong, doDo.tam[0] + RC * huongD[0], doDo.tam[1], doDo.tam[2] + RC * huongD[2], _g);
      S.kMui = 0.8 / (Math.hypot(_g[0] - _g0[0], _g[1] - _g0[1], _g[2] - _g0[2]) || 1);
      do_();
      ghiLichSu(true);
      veDam();
    }
    function do_() { doBienDang(x, N, S.lamda0, S.V0, huongD, doDo); }

    function ghiLichSu(batBuoc = false) {
      if (!batBuoc && choGhi > 0) return;
      choGhi = CD().tMax / 300;
      if (ls.n >= NLSU) return;
      ls.t[ls.n] = S.t; ls.ar[ls.n] = doDo.ar; ls.at[ls.n] = doDo.at; ls.V[ls.n] = doDo.V; ls.n++;
    }

    function veDam() {
      for (let i = 0; i < 3 * N; i++) viTriDiem[i] = x[i];
      geoDiem.attributes.position.needsUpdate = true;
      const tam = doDo.tam, vtr = doDo.vtr, gt = doDo.gt;
      elip.position.set(tam[0], tam[1], tam[2]);
      _v1.set(vtr[0], vtr[3], vtr[6]); _v2.set(vtr[1], vtr[4], vtr[7]); _v3.crossVectors(_v1, _v2);
      M4.makeBasis(_v1, _v2, _v3);
      _q.setFromRotationMatrix(M4);
      elip.quaternion.copy(_q);
      const ti = (k) => RC * Math.sqrt(Math.max(1e-9, gt[k]) / S.lamda0);
      elip.scale.set(ti(0), ti(1), ti(2));
      for (let k = 0; k < 3; k++) {
        const l = ti(k) * 1.28, d = trucElip[k];
        // trục dài ra: hồng (kéo); ngắn lại: xanh (ép); gần như không đổi: vàng nhạt
        const tl = ti(k) / RC;
        d.datMau(tl > 1.003 ? MAU_KTG.hong : tl < 0.997 ? MAU_KTG.thoiGian : 0xffe2a8);
        d.dat(0, tam[0] - vtr[k] * l, tam[1] - vtr[3 + k] * l, tam[2] - vtr[6 + k] * l);
        d.dat(1, tam[0] + vtr[k] * l, tam[1] + vtr[3 + k] * l, tam[2] + vtr[6 + k] * l);
        d.xong(2);
      }
      cauGoc.position.set(tam[0], tam[1], tam[2]);
      nhanDam.position.set(tam[0] - 0.4, tam[1] + RC * 2.2 * Math.max(1, doDo.at), tam[2]);
      // mũi tên
      const cd = CD();
      if (S.hien.mui && S.che !== 'trieu' && cd.truong) {
        giaTocT(cd.truong, tam[0], tam[1], tam[2], _g0);
        for (let k = 0; k < N_DAU; k++) {
          const i = N_MAT + N_TRONG + k;
          const px = x[3 * i], py = x[3 * i + 1], pz = x[3 * i + 2];
          giaTocT(cd.truong, px, py, pz, _g);
          let dx = (_g[0] - _g0[0]) * S.kMui, dy = (_g[1] - _g0[1]) * S.kMui, dz = (_g[2] - _g0[2]) * S.kMui;
          // nén mềm độ dài để mũi tên không dài quá khi đám hạt tới gần hành tinh
          const l = Math.hypot(dx, dy, dz), lm = 1.1, l2 = lm * (1 - Math.exp(-l / lm));
          if (l > 1e-9) { dx *= l2 / l; dy *= l2 / l; dz *= l2 / l; }
          const ra = dx * (px - tam[0]) + dy * (py - tam[1]) + dz * (pz - tam[2]) > 0;
          dsMui[k].datMau(ra ? MAU_KTG.hong : MAU_KTG.thoiGian);
          dsMui[k].dat(px, py, pz, px + dx, py + dy, pz + dz);
        }
      }
      // cặp hạt
      if (nhomCap.visible) {
        for (const c of CAP) c.dom.position.set(x[3 * c.i], x[3 * c.i + 1], x[3 * c.i + 2]);
        const [d0, d1, n0, n1] = CAP.map((c) => c.dom.position);
        noiDoc.dat(0, d0.x, d0.y, d0.z); noiDoc.dat(1, d1.x, d1.y, d1.z); noiDoc.xong(2);
        noiNgang.dat(0, n0.x, n0.y, n0.z); noiNgang.dat(1, n1.x, n1.y, n1.z); noiNgang.xong(2);
        const lDoc = tiSoCap(x, CAP[0].i, CAP[1].i), lNgang = tiSoCap(x, CAP[2].i, CAP[3].i);
        nhanDoc.position.copy(d0).add(_v1.set(0.15, -0.75, 0));
        nhanDoc.datChu(chuCanh("canh.cap-doc-lan-luc-dau", "cặp dọc: {0} lần lúc đầu", [so(lDoc, 2)]));
        nhanNgang.position.copy(n0).add(_v1.set(-0.6, 0.55, 0));
        nhanNgang.datChu(chuCanh("canh.cap-ngang-lan-luc-dau", "cặp ngang: {0} lần lúc đầu", [so(lNgang, 2)]));
      }
      veVet();
    }

    // Vệt đường đi: vòng đệm, vẽ từ điểm mới nhất (sáng) về cũ nhất (mờ).
    function ghiVet() {
      if (!nhomCap.visible || !S.hien.vet) return;
      if (choVet > 0) return;
      choVet = CD().tMax / (NLS - 2);
      for (const c of CAP) { const k = ((dauVet + soVet) % NLS) * 3; c.ls[k] = x[3 * c.i]; c.ls[k + 1] = x[3 * c.i + 1]; c.ls[k + 2] = x[3 * c.i + 2]; }
      if (soVet < NLS) soVet++; else dauVet = (dauVet + 1) % NLS;
    }
    function veVet() {
      if (!nhomCap.visible || !S.hien.vet) return;
      for (const c of CAP) {
        c.vet.dat(0, x[3 * c.i], x[3 * c.i + 1], x[3 * c.i + 2]);
        for (let j = 0; j < soVet; j++) { const k = ((dauVet + soVet - 1 - j) % NLS) * 3; c.vet.dat(j + 1, c.ls[k], c.ls[k + 1], c.ls[k + 2]); }
        c.vet.xong(Math.min(NLS, soVet + 1), 1.1);
      }
    }

    // ---------- Thủy triều: Mặt Trăng, lớp nước theo hướng và khoảng cách ----------
    const kTrieu = () => (D_HINH / S.dTrang) ** 3;             // độ cao bướu tỉ lệ 1/d³
    function dungNuoc() {
      const p = geoNuoc.attributes.position.array, eps = EPS_TRIEU * kTrieu();
      for (let i = 0; i < p.length; i += 3) {
        const cx = goc0[i];                                    // cos góc so với hướng Mặt Trăng (trục x của nhóm)
        const rr = RP * (1.05 + eps * (3 * cx * cx - 1) / 2);
        p[i] = goc0[i] * rr; p[i + 1] = goc0[i + 1] * rr; p[i + 2] = goc0[i + 2] * rr;
      }
      geoNuoc.attributes.position.needsUpdate = true;
      geoNuoc.computeVertexNormals();
      for (let i = 0; i <= 160; i++) {
        const t = (i / 160) * 2 * Math.PI, c = Math.cos(t), sn = Math.sin(t);
        const rr = RP * (1.05 + eps * (3 * c * c - 1) / 2);
        vienNuoc.dat(i, rr * c, 0.01, rr * sn);
        vongTB.dat(i, RP * 1.05 * c, 0.01, RP * 1.05 * sn);
      }
      vienNuoc.xong(161); vongTB.xong(161);
      const k = Math.min(1.6, kTrieu());
      for (const m of muiTrieu) {
        const cx = Math.cos(m.th), sz = Math.sin(m.th);
        const goc = [RP * 1.38 * cx, 0, RP * 1.38 * sz];
        m.dat(goc[0], 0, goc[2], goc[0] + 2 * cx * 0.5 * k, 0, goc[2] - sz * 0.5 * k);
      }
      nhanBuou1.position.set(RP * (1.15 + eps * 0.9), 0.62, 0);
      nhanBuou2.position.set(-RP * (1.42 + eps * 0.9), 0.7, 0);
    }
    function datTrang(d, g) {
      S.dTrang = kep(d, 6.5, 16); S.gocTrang = g;
      const px = S.dTrang * Math.cos(g), pz = -S.dTrang * Math.sin(g);
      tr.nhom.position.set(px, 0, pz);
      nhanTrang.position.set(px, 1.0, pz);
      huongTrieu.rotation.y = g;
      if (!tt.dangKeo) tayTrang.dat([px, 0, pz]);
      dungNuoc();
    }
    // mực nước ở thành phố: góc giữa thành phố và hướng Mặt Trăng
    const gocThanhPho = () => quayDat.rotation.y;
    const mucNuocTP = () => trieuCanBang(gocThanhPho() - S.gocTrang, undefined, undefined, undefined, 384400e3 * (S.dTrang / D_HINH));

    // ---------- đồ thị ----------
    function veDoThi() {
      const { ctx: g, rong, cao } = doThi;
      if (S.che === 'trieu') {
        const y1 = 0.45;
        const { X, Y } = khungDoThi(g, { rong, cao, x0: 0, x1: 48, y0: -0.25, y1, nhanX: chuCanh("canh.gio", "giờ"), nhanY: chuCanh("canh.muc-nuoc-o-thanh-pho-m-so-voi", "mực nước ở thành phố (m, so với trung bình)"), vachX: [0, 12, 24, 36, 48], vachY: [[-0.2, chuCanh("canh.0-2", "−0,2")], [0, '0'], [0.2, chuCanh("canh.0-2-a7841e", "0,2")], [0.4, chuCanh("canh.0-4", "0,4")]] });
        const dThat = 384400e3 * (S.dTrang / D_HINH);
        g.strokeStyle = MAU.xanh; g.lineWidth = 2; g.beginPath();
        for (let i = 0; i <= 240; i++) {
          const h = (48 * i) / 240, y = trieuCanBang((2 * Math.PI * h) / CHU_KY_TRANG + S.gocTrang, undefined, undefined, undefined, dThat);
          if (i) g.lineTo(X(h), Y(y)); else g.moveTo(X(h), Y(y));
        }
        g.stroke();
        const h = S.t % 48;
        g.fillStyle = MAU.vang; g.beginPath(); g.arc(X(h), Y(mucNuocTP()), 4, 0, 2 * Math.PI); g.fill();
        return;
      }
      const cd = CD();
      const t1 = cd.tMax;
      const [y0, y1, vachY] = S.che === 'toi' ? [0.8, 3.2, [1, 2, 3]] : S.che === 'trong' ? [0, 1.2, [0, 0.5, 1]] : [0.4, 2.2, [0.5, 1, 1.5, 2]];
      const { X, Y } = khungDoThi(g, {
        rong, cao, x0: 0, x1: t1, y0, y1, nhanX: chuCanh("canh.thoi-gian-tu-luc-tha", "thời gian từ lúc thả"), nhanY: '',
        vachX: [], vachY: vachY.map((q) => [q, so(q, q % 1 ? 1 : 0)]),
      });
      // dự đoán bậc hai: ngoài vật chất (kéo 2k, ép k) hoặc đều mọi phương (k)
      const tr2 = cd.truong, rTha = Math.hypot(...tamTha());
      const ngoaiVC = tr2.loai === 'ngoai' || (tr2.loai === 'cau-dac' && rTha >= tr2.R);
      const k = ngoaiVC ? tr2.GM / Math.max(rTha, 1e-6) ** 3 : tr2.loai === 'toi' ? tr2.H2 : -tr2.w2;
      const duDoan = [
        [MAU.hong, (t) => (ngoaiVC ? 1 + k * t * t : 1 + 0.5 * k * t * t)],
        [MAU.xanh, (t) => (ngoaiVC ? 1 - 0.5 * k * t * t : 1 + 0.5 * k * t * t)],
        [MAU.vang, (t) => (ngoaiVC ? 1 : 1 + 1.5 * k * t * t)],
      ];
      g.setLineDash([4, 4]); g.lineWidth = 1.2;
      for (const [m, f] of duDoan) {
        g.strokeStyle = m; g.globalAlpha = 0.7; g.beginPath();
        let dau = true;
        for (let i = 0; i <= 80; i++) { const t = (t1 * i) / 80, y = f(t); if (y < y0 || y > y1) { dau = true; continue; } if (dau) { g.moveTo(X(t), Y(y)); dau = false; } else g.lineTo(X(t), Y(y)); }
        g.stroke();
      }
      g.setLineDash([]); g.globalAlpha = 1; g.lineWidth = 2;
      for (const [m, arr] of [[MAU.hong, ls.ar], [MAU.xanh, ls.at], [MAU.vang, ls.V]]) {
        g.strokeStyle = m; g.beginPath();
        let dau = true;
        for (let i = 0; i < ls.n; i++) { const y = kep(arr[i], y0, y1); if (dau) { g.moveTo(X(ls.t[i]), Y(y)); dau = false; } else g.lineTo(X(ls.t[i]), Y(y)); }
        g.stroke();
      }
      g.font = '10.5px -apple-system, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
      const chu = [[chuCanh("canh.truc-doc", "trục dọc"), MAU.hong], [chuCanh("canh.truc-ngang", "trục ngang"), MAU.xanh], [chuCanh("canh.the-tich", "thể tích"), MAU.vang], [chuCanh("canh.net-dut-du-doan-bac-hai", "nét đứt: dự đoán bậc hai"), MAU.mo]];
      let xc = 40;
      chu.forEach(([c, m]) => { g.fillStyle = m; g.fillText(c, xc, 16); xc += g.measureText(c).width + 10; });
    }

    // ---------- máy quay ----------
    const GOC = {
      toan: () => {
        if (S.che === 'ngoai') return [[7.5, 7.8, 22.5], [6.2, -0.4, 0]];
        if (S.che === 'trong') return [[3, 9.5, 30], [1.6, -0.6, 0]];
        if (S.che === 'toi') return [[2.5, 4.5, 14], [0, 0.2, 0]];
        return [[4.5, 9, 22], [4.2, 0, 0]];
      },
      theo: () => { const t = doDo.tam, r = Math.hypot(t[0], t[2]) || 1, ux = t[0] / r, uz = t[2] / r; return [[t[0] + 1.2 * ux + 1.5, t[1] + 3.4, t[2] + 1.2 * uz + 11], [t[0] - 1.3 * ux, t[1], t[2] - 1.3 * uz]]; },
    };
    const datGoc = (ten, giay = 1.4) => { const [p, d] = GOC[ten](); app.bayToi(p, d, giay); };
    const tamTruoc = [0, 0, 0];

    function capNhatHam() {
      // đường hầm luôn hướng về chỗ thả (để đám hạt rơi dọc theo nó)
      huongHam.rotation.y = huongTha();
    }

    function capNhatGiaoDien() {
      const trieu = S.che === 'trieu';
      elip.visible = cauGoc.visible = !trieu && S.hien.elip;
      for (const d of trucElip) d.line.visible = !trieu && S.hien.elip;
      for (const m of dsMui) m.nhom.visible = !trieu && S.hien.mui;
      nhomCap.visible = !trieu && S.hien.cap;
      for (const c of CAP) c.vet.line.visible = S.hien.vet;
      dkTheo.el.hidden = trieu;
      dkMui.dat(S.hien.mui); dkElip.dat(S.hien.elip); dkTheo.dat(S.theo); dkChe.dat(S.che);
      dkMui.el.hidden = dkElip.el.hidden = trieu;
      tayTha.an(!(S.che === 'ngoai' || S.che === 'trong'));
      tayTrang.an(!trieu);
      if (S.che === 'ngoai' || S.che === 'trong') { const p = tamTha(); tayTha.dat([p[0], 0, p[2]]); }
      ghiChu.dat({
        ngoai: chuCanh("canh.dam-hat-roi-ve-hanh-tinh-hat-hong", "Đám hạt rơi về hành tinh. Hạt hồng nằm gần phương bán kính, hạt xanh nằm gần vòng ngang. Mũi tên: gia tốc so với tâm đám (hồng: hướng ra, xanh: hướng vào). Kéo đốm vàng để đổi chỗ thả. Thời gian chạy theo đơn vị của mô phỏng."),
        trong: chuCanh("canh.dam-hat-ben-trong-mot-qua-cau-vat-9041f9", "Đám hạt bên trong một quả cầu vật chất đồng đều (như đi trong đường hầm xuyên tâm). Gia tốc tương đối hướng vào như nhau theo mọi phương: thể tích co ngay từ đầu. Kéo đốm vàng ra ngoài quả cầu để so."),
        toi: chuCanh("canh.chi-co-nang-luong-toi-hang-so-vu", "Chỉ có năng lượng tối (hằng số vũ trụ): gia tốc tương đối hướng ra như nhau theo mọi phương, đám hạt nở ra nhanh dần."),
        trieu: chuCanh("canh.trai-dat-quay-duoi-hai-buou-nuoc-do", "Trái Đất quay dưới hai bướu nước do Mặt Trăng kéo (phóng đại khoảng 2 triệu lần). Chấm vàng là một thành phố trên xích đạo; đồ thị là mực nước ở đó. Kéo Mặt Trăng để đổi hướng và khoảng cách."),
      }[S.che]);
    }

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      let thaMoi = false;
      if (o.che && o.che !== S.che) { S.che = o.che; thaMoi = true; }
      if (o.hien) {
        const h = { ...o.hien };
        if (h.mui === 'dao') h.mui = !S.hien.mui;
        S.hien = { ...S.hien, ...h };
      }
      if (o.theo != null) S.theo = o.theo && S.che !== 'trieu';
      if (o.macDinh) veMacDinh(false);
      if (thaMoi || o.tha || o.macDinh) thaLai();
      capNhatHam();
      capNhatGiaoDien();
      if (S.che !== 'trieu' && CD().truong) veDam();
      tamTruoc[0] = doDo.tam[0]; tamTruoc[1] = doDo.tam[1]; tamTruoc[2] = doDo.tam[2];
      if (o.mayAnh) datGoc(o.mayAnh === 'theo' && !S.theo ? 'toan' : o.mayAnh);
      veDoThi();
    }
    // Mỗi bước bắt đầu lại từ chỗ thả mặc định; thử thách chỉ tính sau khi người học tự kéo, tự thả.
    function veMacDinh(tha = true) {
      S.tha = { ngoai: [R_THA_MAC_DINH, 0, 0], trong: [5.2, 0, 0], toi: [0, 0, 0] };
      S.daKeoTha = false; S.arTT = null; S.VTT = null;
      S.daKeoTrang = false;
      datTrang(D_HINH, 0);
      if (tha) { thaLai(); capNhatHam(); capNhatGiaoDien(); }
    }

    datTrang(D_HINH, 0);
    thaLai();
    capNhatHam();
    capNhatGiaoDien();
    veDoThi();
    for (const k of Object.keys(S.hienNhom)) S.hienNhom[k] = k === S.che ? 1 : 0;

    // ---------- âm thanh ----------
    // Hai nốt kéo dài: nốt «kéo» theo trục dọc, nốt «ép» theo trục ngang (tần số tỉ lệ độ dài trục, cùng 330 Hz lúc thả).
    // Chế độ thủy triều: tiếng sóng ở thành phố, to và sáng lên khi nước lên.
    let gKeo = null, gEp = null, gSong = null;
    function imTieng(giay = 0.4) {
      gKeo?.tat(giay); gEp?.tat(giay); gSong?.tat(giay);
      gKeo = gEp = gSong = null;
    }
    function capNhatTieng(dt) {
      const chay = dt > 0 && S.cho <= 0 && !S.keo;
      if (S.che === 'trieu') {
        gKeo?.tat(0.3); gEp?.tat(0.3); gKeo = gEp = null;
        if (dt <= 0) { gSong?.dat({ doTo: 0 }, 0.2); return; }
        if (!gSong) gSong = am.tiengOn({ mau: 'hong', tanSoLoc: 600, doTo: 0 });
        const ts = tiengSong(mucNuocTP());
        gSong.dat({ doTo: ts.doTo * 0.8, tanSoLoc: ts.tanSoLoc }, 0.25);
        return;
      }
      gSong?.tat(0.3); gSong = null;
      if (!gKeo) gKeo = am.giong({ dang: 'kinh', tanSo: F0_KEO_EP, doTo: 0, lech: -0.3 });
      if (!gEp) gEp = am.giong({ dang: 'mem', tanSo: F0_KEO_EP, doTo: 0, lech: 0.3 });
      const nho = Math.min(1, doDo.ar * 3, doDo.at * 3);       // đám co về gần một điểm thì nhỏ tiếng dần
      const to = chay ? 0.11 * nho : 0;
      gKeo.dat({ tanSo: tanSoTruc(doDo.ar), doTo: to }, 0.08);
      gEp.dat({ tanSo: tanSoTruc(doDo.at), doTo: to }, 0.08);
    }

    // ---------- chuyển cảnh mượt giữa các chế độ ----------
    const NHOM = { ngoai: nhomHT, trong: nhomKhoi, toi: nhomToi, trieu: nhomTrieu };
    function chuyenCanh(dtThuc) {
      const buoc = Math.min(1, (dtThuc || 0.016) / 0.45);
      for (const k of Object.keys(NHOM)) {
        const dich = k === S.che ? 1 : 0;
        let h = S.hienNhom[k];
        if (h !== dich) { h += Math.sign(dich - h) * buoc; h = kep(h, 0, 1); S.hienNhom[k] = h; }
        datDoHien(NHOM[k], lamMuot(h));
      }
      ht.datCuong(lamMuot(S.hienNhom.ngoai));
      datT.datCuong(lamMuot(S.hienNhom.trieu));
      tr.datCuong?.(lamMuot(S.hienNhom.trieu));
      const hd = lamMuot(1 - S.hienNhom.trieu);
      nhomDam.visible = hd > 0.01;
      matHat.uniforms.uHien.value = hd; matQuang.uniforms.uHien.value = hd;
    }

    // ---------- mỗi khung hình ----------
    let choDoThi = 0;
    let daThu = false;
    const _vTP = new THREE.Vector3();
    function capNhat(dt, dtThuc) {
      const cd = CD();
      if (thu && !daThu) { daThu = true; datThu(); }
      chuyenCanh(dtThuc ?? dt);
      ht.capNhat(dt);
      datT.capNhat(dt);
      // hướng ánh sáng trong hệ nhìn cho các hạt
      _v1.copy(HUONG_SANG).transformDirection(app.camera.matrixWorldInverse);
      matHat.uniforms.uDen.value.copy(_v1);
      if (S.che === 'trieu') {
        S.t += dt * cd.tocDo;                       // giờ
        if (S.t > cd.tMax) S.t -= cd.tMax;
        quayDat.rotation.y = -(2 * Math.PI * S.t) / CHU_KY_TRANG;
        // nhãn thành phố chỉ hiện khi thành phố quay về phía người xem
        thanhPho.getWorldPosition(_vTP);
        nhanTP.visible = _vTP.clone().normalize().dot(_v2.copy(app.camera.position).sub(_vTP).normalize()) > 0.05;
      } else if (dt > 0 && !S.keo) {
        if (S.cho > 0) { S.cho -= dt; if (S.cho <= 0) { thaLai(); if (S.theo) S.vuaTha = true; } } else {
          let con = dt * cd.tocDo;
          const tTT = TT_TRUC_DOC.t, tV = TT_THE_TICH.t;
          while (con > 1e-9) {
            const h = Math.min(DT, con);
            buocVerletT(cd.truong, x, v, a, N, h);
            con -= h; S.t += h; choGhi -= h; choVet -= h;
            // ghi số đo đúng lúc chạm mốc của thử thách (chỉ sau khi người học tự thả)
            if (S.daKeoTha && S.arTT == null && S.che === 'ngoai' && S.t >= tTT) { do_(); S.arTT = doDo.ar; }
            if (S.daKeoTha && S.VTT == null && S.che === 'trong' && S.t >= tV) { do_(); S.VTT = doDo.V; }
          }
          do_();
          ghiLichSu();
          ghiVet();
          // dừng lại một chút rồi thả lại khi: chạm hành tinh, hết thời gian
          let chamDat = false;
          if (S.che === 'ngoai') for (let i = 0; i < N; i++) { const r = Math.hypot(x[3 * i], x[3 * i + 1], x[3 * i + 2]); if (r < RP + 0.05) { chamDat = true; break; } }
          if (chamDat || S.t >= cd.tMax) S.cho = 1.2;
        }
        veDam();
        // máy quay đi theo tâm đám (vừa thả lại thì bay mượt về chỗ thả, không nhảy)
        const tam = doDo.tam;
        if (S.theo && S.vuaTha) { S.vuaTha = false; datGoc('theo', 0.9); }
        else if (S.theo && !app._bay) {
          const d0 = tam[0] - tamTruoc[0], d1 = tam[1] - tamTruoc[1], d2 = tam[2] - tamTruoc[2];
          app.camera.position.x += d0; app.camera.position.y += d1; app.camera.position.z += d2;
          app.dk.target.x += d0; app.dk.target.y += d1; app.dk.target.z += d2;
        } else if (S.theo && app._bay) {
          app._bay.toiDich.set(tam[0], tam[1], tam[2]);
        }
        tamTruoc[0] = tam[0]; tamTruoc[1] = tam[1]; tamTruoc[2] = tam[2];
      } else if (S.keo) {
        veDam();
        tamTruoc[0] = doDo.tam[0]; tamTruoc[1] = doDo.tam[1]; tamTruoc[2] = doDo.tam[2];
      }
      // lưới năng lượng tối giãn theo cùng nhịp cosh(H t) với đám hạt
      if (S.che === 'toi') luoiToi.scale.setScalar(Math.cosh(Math.sqrt(CHE_DO.toi.truong.H2) * S.t));
      capNhatTieng(dt);
      choDoThi -= dt;
      if (choDoThi <= 0) { choDoThi = 0.1; veDoThi(); }
    }

    function hud() {
      const cd = CD();
      if (S.che === 'trieu') {
        return [
          [chuCanh("canh.che-do", "Chế độ"), chuCanh("canh.thuy-trieu-cua-mat-trang-tren-trai-dat", "Thủy triều của Mặt Trăng trên Trái Đất")],
          [chuCanh("canh.thoi-gian", "Thời gian"), chuCanh("canh.gio-phut", "{0} giờ {1} phút", [so(Math.floor(S.t), 0), so(Math.floor((S.t % 1) * 60), 0)])],
          [chuCanh("canh.muc-nuoc-o-thanh-pho", "Mực nước ở thành phố"), chuCanh("canh.m-so-voi-trung-binh", "{0} m so với trung bình", [so(mucNuocTP(), 2)])],
          [chuCanh("canh.mat-trang", "Mặt Trăng"), chuCanh("canh.dinh-buou-m", "{0} · đỉnh bướu {1} m", [S.dTrang === D_HINH ? chuCanh("canh.o-khoang-cach-that-trung-binh", "ở khoảng cách thật trung bình") : chuCanh("canh.xa-gap-lan-that", "xa gấp {0} lần thật", [so(S.dTrang / D_HINH, 2)]), so(dinhBuou(S.dTrang), 3)])],
        ];
      }
      const d = [[chuCanh("canh.che-do", "Chế độ"), cd.ten], [chuCanh("canh.thoi-gian-tu-luc-tha-c7eab9", "Thời gian từ lúc thả"), chuCanh("canh.don-vi-mo-phong", "{0} (đơn vị mô phỏng)", [so(S.t, 2)])]];
      d.push([chuCanh("canh.truc-doc-ngang-so-voi-luc-tha", "Trục dọc / ngang so với lúc thả"), `${so(doDo.ar, 3)} / ${so(doDo.at, 3)}`]);
      d.push([chuCanh("canh.the-tich-so-voi-luc-tha", "Thể tích so với lúc thả"), so(doDo.V, 3)]);
      const rTha = Math.hypot(...tamTha());
      if (S.che === 'ngoai') {
        const k = GM_HANH_TINH / Math.pow(doDo.r, 3);
        d.push([chuCanh("canh.thuy-trieu-luc-nay", "Thủy triều lúc này"), chuCanh("canh.keo-ep-moi-phuong-ngang-tong-0", "kéo {0} · ép mỗi phương ngang {1} · tổng 0", [soNghia(2 * k, 3), soNghia(k, 3)])]);
        d.push([chuCanh("canh.cho-tha", "Chỗ thả"), chuCanh("canh.r-keo-luc-tha-gap-lan-cho-mac", "r = {0} · kéo lúc thả gấp {1} lần chỗ mặc định", [so(rTha, 2), so(tiSoKeo(rTha), 2)])]);
      } else if (S.che === 'trong') {
        const vv = vddvLucTha(cd.truong, rTha);
        d.push([chuCanh("canh.v-v-luc-tha", "V̈/V lúc thả"), rTha + RC < R_KHOI ? `−4πGρ = −3·(4πGρ/3) = ${so(vv, 3)}` : rTha - RC >= R_KHOI ? chuCanh("canh.0-dam-hat-nam-ngoai-vat-chat", "0 (đám hạt nằm ngoài vật chất)") : chuCanh("canh.dam-hat-vat-qua-mat-qua-cau", "đám hạt vắt qua mặt quả cầu")]);
      } else d.push([chuCanh("canh.v-v-luc-tha", "V̈/V lúc thả"), `+Λc² = 3·(Λc²/3) = ${so(3 * cd.truong.H2, 3)}`]);
      return d;
    }

    // tham số riêng khi chụp ảnh kiểm thử (chỉ ở chế độ im lặng): ?thu=<tên>
    const thu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    const datThu = () => {
      if (!thu) return;
      if (thu === 'tt2') { S.tha.ngoai = [8.75, 0, 0]; S.daKeoTha = true; S.arTT = null; thaLai(); capNhatGiaoDien(); }
      if (thu === 'tt4') { S.che = 'trong'; S.tha.trong = [6.6, 0, 6.2]; S.daKeoTha = true; S.VTT = null; thaLai(); capNhatHam(); capNhatGiaoDien(); datGoc('toan', 0); }
      if (thu === 'tt6') { datTrang(12.6, 0.5); S.daKeoTrang = true; }
      if (thu === 'tt7') { S.tha.ngoai = [4.7, 0, -2.6]; S.daKeoTha = true; thaLai(); capNhatGiaoDien(); }
      if (thu === 'keo') { S.keo = true; S.tha.ngoai = [6.8, 0, 3.2]; thaLai(); capNhatGiaoDien(); }
    };

    return {
      scene, capNhat, hud, cauHinh, thaLai: () => cauHinh({ tha: true }), goc: datGoc, imTieng, datThu,
      macDinh: () => veMacDinh(false),
      // thử thách
      ttTrucDoc: () => S.daKeoTha && S.che === 'ngoai' && S.arTT != null && Math.abs(S.arTT - TT_TRUC_DOC.dich) <= TT_TRUC_DOC.dungSai,
      ttTheTich: () => S.daKeoTha && S.che === 'trong' && Math.hypot(...tamTha()) - RC >= R_KHOI && S.VTT != null && S.VTT >= TT_THE_TICH.nguong,
      ttTrieu: () => S.daKeoTrang && S.che === 'trieu' && Math.abs(dinhBuou(S.dTrang) - TT_TRIEU.dich) <= TT_TRIEU.dungSai,
      ttKeoGap: () => S.daKeoTha && S.che === 'ngoai' && Math.abs(tiSoKeo(Math.hypot(...tamTha())) - TT_KEO_GAP.dich) <= TT_KEO_GAP.dungSai,
      huy() { imTieng(0.2); },
    };
  },
};

// ---------------------------------------------------------------------------
// Hướng tới «Mặt Trời» chiếu sáng cảnh (hệ thế giới).
const HUONG_SANG = new THREE.Vector3(-0.55, 0.42, 0.72).normalize();

// Đặt độ hiện (0–1) cho cả một nhóm: vật liệu thường đổi opacity, vật liệu kính của bài đổi uHien, nhãn đổi độ mờ.
function datDoHien(nhom, k) {
  nhom.visible = k > 0.005;
  if (!nhom.visible) return;
  if (nhom.userData.kHien === k) return;
  nhom.userData.kHien = k;
  nhom.traverse((o) => {
    if (o.isCSS2DObject) { o.element.style.opacity = String(k); return; }
    const m = o.material;
    if (!m || Array.isArray(m)) return;
    if (m.uniforms?.uHien) { m.uniforms.uHien.value = k; return; }
    if (m.userData.doMoGoc == null) m.userData.doMoGoc = m.opacity;
    if (m.isLineMaterial || m.transparent) m.opacity = m.userData.doMoGoc * k;
  });
}

// Vật liệu kính: viền sáng theo góc nhìn (Fresnel), lớp phủ rất mỏng, lưới kinh vĩ mịn vẽ trong shader (theo trục x
// của vật), cộng sáng vào cảnh. Màu tuyến tính; viền sáng hơn 1 để có quầng nhẹ.
function kinh({ mau = 0xffffff, nen = 0.04, vien = 0.8, luoi = 0, soVi = 6, soKinh = 16, mu = 2.4 } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uMau: { value: new THREE.Color(mau) }, uNen: { value: nen }, uVien: { value: vien }, uLuoi: { value: luoi },
      uSoVi: { value: soVi }, uSoKinh: { value: soKinh }, uMu: { value: mu }, uHien: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        vP = normalize(position);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uNen, uVien, uLuoi, uSoVi, uSoKinh, uMu, uHien;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      float vach(float x) { float f = abs(fract(x + 0.5) - 0.5); return 1.0 - smoothstep(0.0, 1.3 * fwidth(x), f); }
      void main() {
        vec3 n = normalize(vN), v = normalize(vV);
        float fr = pow(max(1.0 - abs(dot(n, v)), 0.0), uMu);
        float l = 0.0;
        if (uLuoi > 0.0) {
          float vi = asin(clamp(vP.x, -1.0, 1.0)) / 3.14159265 * uSoVi;
          float ki = atan(vP.z, vP.y) / 6.2831853 * uSoKinh;
          l = max(vach(vi), vach(ki)) * uLuoi;
        }
        vec3 c = uMau * (uNen + uVien * 1.6 * fr) + uMau * l * (0.35 + 0.9 * fr);
        gl_FragColor = vec4(c * uHien, 1.0);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  m.tuyenTinh = true;
  return m;
}

// Hạt có khối: mỗi điểm vẽ thành một quả cầu nhỏ có sáng tối, viền và ánh bóng (cỡ theo đơn vị cảnh).
function vatLieuHat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uDen: { value: new THREE.Vector3(0, 0, 1) }, uTiLe: { value: 1 }, uCaoMH: { value: 800 }, uHien: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 color; attribute float aCo;
      uniform float uTiLe, uCaoMH; varying vec3 vMau;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(2.5, aCo * projectionMatrix[1][1] * uCaoMH / max(-mv.z, 1e-3)) * uTiLe;
        vMau = color;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uDen; uniform float uHien; varying vec3 vMau;
      void main() {
        vec2 q = gl_PointCoord * 2.0 - 1.0; q.y = -q.y;
        float d2 = dot(q, q);
        if (d2 > 1.0) discard;
        vec3 n = vec3(q, sqrt(1.0 - d2));
        float khuech = max(dot(n, uDen), 0.0);
        float vien = pow(max(1.0 - n.z, 0.0), 2.0);
        float bong = pow(max(dot(n, normalize(uDen + vec3(0.0, 0.0, 1.0))), 0.0), 28.0);
        vec3 c = vMau * (0.16 + 0.85 * khuech) + vMau * vien * 0.45 + vec3(1.0) * bong * 0.55;
        float aa = 1.0 - smoothstep(0.86, 1.0, d2);
        gl_FragColor = vec4(c, aa * uHien);
      }`,
    transparent: true, depthWrite: true,
  });
  m.tuyenTinh = true;
  m.datCo = (renderer) => { m.uniforms.uTiLe.value = renderer.getPixelRatio(); m.uniforms.uCaoMH.value = renderer.getSize(_kt).y; };
  return m;
}
// Quầng mờ quanh mỗi hạt (cộng sáng), cho đám hạt trông như phát sáng nhẹ.
function vatLieuQuangHat() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTiLe: { value: 1 }, uCaoMH: { value: 800 }, uHien: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 color; attribute float aCo;
      uniform float uTiLe, uCaoMH; varying vec3 vMau;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(5.0, 2.6 * aCo * projectionMatrix[1][1] * uCaoMH / max(-mv.z, 1e-3)) * uTiLe;
        vMau = color;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uHien; varying vec3 vMau;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float k = exp(-d * d * 5.0) * (1.0 - smoothstep(0.8, 1.0, d));
        gl_FragColor = vec4(vMau * k * 0.09 * uHien, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  m.tuyenTinh = true;
  m.datCo = (renderer) => { m.uniforms.uTiLe.value = renderer.getPixelRatio(); m.uniforms.uCaoMH.value = renderer.getSize(_kt).y; };
  return m;
}
const _kt = new THREE.Vector2();

// Bụi vật chất mờ bên trong quả cầu đồng đều (HÌNH MINH HOẠ cho «mật độ đều ρ»).
function taoBui(R) {
  const n = 2600, p = new Float32Array(n * 3);
  let s = 12345;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < n; i++) {
    let x, y, z;
    do { x = 2 * rnd() - 1; y = 2 * rnd() - 1; z = 2 * rnd() - 1; } while (x * x + y * y + z * z > 1);
    p[3 * i] = x * R; p[3 * i + 1] = y * R; p[3 * i + 2] = z * R;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ size: 0.07, map: texDom(), color: new THREE.Color(0xc8aaff).multiplyScalar(0.5), transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const b = new THREE.Points(g, m);
  b.frustumCulled = false;
  return b;
}

// Lưới hạt thử của chế độ năng lượng tối: mờ dần ra xa, điểm giao sáng hơn.
function taoLuoiToi() {
  const g = new THREE.Group();
  const p = [];
  for (let i = -6; i <= 6; i++) { p.push(i, 0, -6, i, 0, 6, -6, 0, i, 6, 0, i); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(0x7fcaff) }, uHien: { value: 1 } },
    vertexShader: /* glsl */ `varying float vR; void main() { vR = length(position.xz); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform vec3 uMau; uniform float uHien; varying float vR;
      void main() { gl_FragColor = vec4(uMau * 0.22 * exp(-vR * vR / 18.0) * uHien, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  m.tuyenTinh = true;
  g.add(new THREE.LineSegments(geo, m));
  const d = [];
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) if (i * i + j * j <= 30) d.push(i, 0, j);
  const gd = new THREE.BufferGeometry(); gd.setAttribute('position', new THREE.Float32BufferAttribute(d, 3));
  g.add(new THREE.Points(gd, new THREE.PointsMaterial({ size: 0.18, map: texDom(), color: new THREE.Color(0x9fd6ff).multiplyScalar(1.2), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })));
  return g;
}

// Mũi tên có khối (thân trụ, đầu nón), vật liệu có ánh sáng và phát sáng nhẹ; dời được từng khung hình.
const _geoThan = new THREE.CylinderGeometry(1, 1, 1, 12, 1).translate(0, 0.5, 0);
const _geoDau = new THREE.ConeGeometry(1, 1, 18, 1).translate(0, -0.5, 0);
function taoMuiTen3D(mau, { day = 0.026, dau = 0.19 } = {}) {
  const nhom = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: mau, emissive: mau, emissiveIntensity: 0.75, roughness: 0.35, metalness: 0.1 });
  const than = new THREE.Mesh(_geoThan, mat), non = new THREE.Mesh(_geoDau, mat);
  nhom.add(than, non);
  const huong = new THREE.Vector3(), truc = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  let mauCu = mau;
  return {
    nhom,
    datMau(m) { if (m !== mauCu) { mauCu = m; mat.color.set(m); mat.emissive.set(m); } },
    dat(x0, y0, z0, x1, y1, z1) {
      huong.set(x1 - x0, y1 - y0, z1 - z0);
      const l = huong.length();
      nhom.visible = l > 0.03;
      if (l < 1e-9) return;
      huong.divideScalar(l);
      q.setFromUnitVectors(truc, huong);
      const d = Math.min(dau, l * 0.55), r = Math.min(day, l * 0.12);
      than.position.set(x0, y0, z0); than.quaternion.copy(q); than.scale.set(r, Math.max(1e-4, l - d * 0.9), r);
      non.position.set(x1, y1, z1); non.quaternion.copy(q); non.scale.set(d * 0.38, d, d * 0.38);
    },
  };
}
