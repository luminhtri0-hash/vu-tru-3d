import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 7 — Nguyên lý tương đương (Bản 3).
// Hai buồng kín dựng bằng thư viện đồ vật (src/khung/do-vat.js): buồng trái đứng trên bệ bê tông trên một Trái Đất
// thu nhỏ (bờ biển thật), hoặc đứt cáp rơi về phía nó; buồng phải chở trong một tên lửa giữa
// trời sao, động cơ chỉnh bằng cần ga. Trong mỗi buồng: phi hành gia đứng trên cân số, quả bóng cầm trong tay,
// đèn chiếu tia sáng ngang về phía vòng đích; tuỳ bước có thêm viên bi nhẹ và bốn viên bi thử lực thủy triều.
//
// Hai cách nhìn:
//   - Trong buồng: buồng đứng yên trên hình; quả bóng chạy theo vật lý thật của buồng (gia tốc «rơi» đo trong buồng,
//     nảy lên khi chạm sàn, chạm tường). Người học kéo quả bóng rồi thả.
//   - Nhìn từ ngoài: chiếu lại một lần thả bóng trong khung đứng yên với thước mốc, rồi tua lại (không nhảy hình).
// Gia tốc và ánh sáng trên hình đã được làm chậm (G, C_HINH); Trái Đất thu nhỏ rất nhiều. Ghi rõ trong lời giảng.
//
// Tham số riêng khi chụp ảnh (chỉ đọc khi app.imLang): thu=bong (thả bóng lơ lửng giữa buồng), thu=ga1 | ga05
// (đặt cần ga 1 g hoặc nửa g), thu=keo (đang kéo bóng lên cao).

import * as THREE from 'three';
import { taoNhan, taoNenSao, taoDom, DuongDay, DuongDong, goNhanDeNhau } from '../khung/ve.js';
import { taoDenCanh, taoBuong, taoPhiHanhGia, taoTenLua, taoCan, taoBong, taoDenChieu, LoXo } from '../khung/do-vat.js';
import { vlKimLoai, vlSon, vlBong, vlSang, hopBo, ghep, dat, domSang } from '../khung/do-vat-chung.js';
import { taoTraiDat } from '../khung/hanh-tinh.js';
import { so } from '../vat-ly/hang-so.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('tuong-duong', khoa, goc, thamSo);

const R = String.raw;

const G = 2.4;             // gia tốc 1 g trên hình (đơn vị/giây²): chậm hơn thật để dễ theo dõi
const C_HINH = 2.6;        // tốc độ "ánh sáng" trên hình: đã làm chậm cỡ trăm triệu lần
const T_CHAY = 2.1, T_GIU = 0.7, TOC_TUA = 3, T_CHO = 0.5;   // chiếu lại khi nhìn từ ngoài: chạy, dừng, tua, chờ
const CHU_KY_TIA = 2.6;    // trong buồng: mỗi chừng ấy giây đèn chiếu một xung sáng
const R_BONG = 0.13, R_NHE = 0.065;
const Y_TIA = 3.3, X_DEN = -1.24, Z_TIA = -0.7, X_DAU_TIA = -1.17, X_TUONG = 1.47;
const L_TIA = X_TUONG - X_DAU_TIA;
const W_TRIEU = 0.35;      // tần số của lực thủy triều trên hình (đã phóng đại rất nhiều)
const X_BI = 1.05, Y_GIUA = 2.25, DY_BI = 0.6, Z_BI = 0.95;
const XA = -3.45, XB = 3.75;
const RD = 6.5;            // bán kính Trái Đất trên hình (thu nhỏ khoảng một triệu lần)
const Y_DAT = { nang: -0.3, roi: -3.35 };       // đỉnh Trái Đất ngay dưới buồng trái
const KG = 70;
// Cần ga gắn bên hông tên lửa (toạ độ của tên lửa): k = 0…1,5 (1 = 1 g) chạy dọc đoạn thẳng đứng.
const GA_X = -2.66, GA_Z = 0.95, GA_Y0 = -0.95, GA_DAI = 2.4, GA_MAX = 1.5;
const MAU_A = 0x8fd0ff, MAU_B = 0xf3c66f, MAU_TIA = 0x7fd6ff, MAU_HONG = 0xff7aa8;
// Biên trong lòng buồng (rộng 3, cao 4, sâu 3)
const BX = 1.5, BY = 4, BZ = 1.5;

// Thước mốc: cột thép có vạch mỗi 0,5 (vạch lớn mỗi 2), đứng yên trong khung nhìn từ ngoài.
function taoThuoc(yDuoi, yTren) {
  const nhom = new THREE.Group();
  const cot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, yTren - yDuoi, 10), vlKimLoai(0xaeb6c4, 0.3));
  cot.position.y = (yDuoi + yTren) / 2;
  const nho = [], lon = [];
  for (let y = Math.ceil(yDuoi * 2) / 2; y <= yTren; y += 0.5) {
    const to = Math.abs(y / 2 - Math.round(y / 2)) < 1e-6;
    (to ? lon : nho).push(dat(hopBo(to ? 0.34 : 0.18, to ? 0.03 : 0.018, 0.04, 0.007), { y }));
  }
  const mNho = new THREE.Mesh(ghep(nho), vlKimLoai(0x8d96a5, 0.35));
  const mLon = new THREE.Mesh(ghep(lon), vlSang(0xc8d4ea, 0.8));
  nhom.add(cot, mNho, mLon);
  return nhom;
}

// Mũi tên đổi được chiều dài mỗi khung hình: thân là nét sáng, đầu là chóp phát sáng.
function taoMuiTenDong(mau, { rong = 3, doSang = 1.6 } = {}) {
  const than = new DuongDay(2, { mau, rong, doMo: 0.95, quang: 0.12, sang: doSang, cong: false });
  const dau = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.32, 20), vlSang(mau, doSang));
  const nhom = new THREE.Group();
  nhom.add(than.line, dau);
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _u = new THREE.Vector3(0, 1, 0);
  return {
    nhom,
    dat(x0, y0, z0, x1, y1, z1) {
      _a.set(x0, y0, z0); _b.set(x1, y1, z1);
      const d = _b.distanceTo(_a);
      nhom.visible = d > 0.08;
      if (!nhom.visible) return;
      _b.sub(_a).normalize();
      const dDau = Math.min(0.32, d * 0.45);
      than.dat(0, x0, y0, z0); than.dat(1, x1 - _b.x * dDau * 0.8, y1 - _b.y * dDau * 0.8, z1 - _b.z * dDau * 0.8); than.xong(2);
      dau.scale.set(1, dDau / 0.32, 1);
      dau.position.set(x1 - _b.x * dDau * 0.5, y1 - _b.y * dDau * 0.5, z1 - _b.z * dDau * 0.5);
      dau.quaternion.setFromUnitVectors(_u, _b);
    },
  };
}

// Âm kéo dài tạo lại được sau khi tắt (am.giong, am.tiengOn trả về tay cầm dùng một lần).
function amKeoDai(am, loai, goc) {
  let h = null;
  return {
    dat(q, muot) { if (!h) h = am[loai]({ ...goc, ...q }); h.dat(q, muot); },
    tat(giay = 0.3) { if (h) { h.tat(giay); h = null; } },
  };
}

export default {
  id: 'tuong-duong',
  ten: 'Nguyên lý tương đương',
  moTa: 'Rơi tự do xoá trọng lực; vì thế ánh sáng phải cong',
  yChinh: 'Năm 1907 Einstein chợt nghĩ: **người đang rơi tự do không cảm thấy trọng lượng của mình**. Từ đó suy ra: trong một buồng kín đủ nhỏ, không thí nghiệm nào phân biệt được đứng yên trên mặt đất với ngồi trong tên lửa tăng tốc, và rơi tự do giống hệt trôi giữa không gian trống. Hệ quả đầu tiên: ánh sáng phải cong trong trường hấp dẫn. Giới hạn: buồng phải nhỏ, nếu không sẽ thấy lực thủy triều.',
  mayAnh: { viTri: [0.4, 3.0, 14.5], dich: [0, 1.7, 0], fov: 40, min: 5, max: 60, hep: 0.6 },
  giaiThich: R`
    - Buồng đứng yên trên mặt đất và buồng trong tên lửa tăng tốc 9,8 m/s² cho cùng kết quả với mọi thí nghiệm tại chỗ: bóng rơi như nhau, cân chỉ như nhau.
    - Nhìn từ ngoài tên lửa, quả bóng thả ra đứng yên; chính sàn lao lên đón nó. Vì thế mọi vật «rơi» như nhau, nặng hay nhẹ. Thí nghiệm xác nhận khối lượng quán tính bằng khối lượng hấp dẫn tới cỡ $10^{-15}$.
    - Rơi tự do là trạng thái tự nhiên: cân chỉ 0, buồng rơi là một khung quán tính cục bộ. Cái ta gọi là trọng lượng là mặt đất đẩy ta lên.
    - Tia sáng đi ngang buồng tên lửa thì cong xuống đối với người trong buồng; vậy ánh sáng cũng phải cong trong trường hấp dẫn.
    - Chỉ đúng **tại chỗ**: trong buồng rộng, hai viên bi rơi cạnh nhau xích lại gần nhau. Lực thủy triều ấy không xoá được, và nó chính là độ cong của không-thời gian (Bài 12).`,

  baiGiang: {
    mucTieu: [
      'Phát biểu được nguyên lý tương đương và nói rõ chữ «tại chỗ» trong đó nghĩa là gì.',
      'Giải thích được vì sao trong tên lửa tăng tốc mọi vật «rơi» như nhau, và liên hệ với khối lượng quán tính bằng khối lượng hấp dẫn.',
      'Suy ra được bằng lập luận buồng kín rằng ánh sáng phải cong trong trường hấp dẫn, và tính được độ võng của tia sáng qua một căn phòng.',
      'Nhận ra lực thủy triều là thứ duy nhất buồng rơi tự do không xoá được, và vì sao nó dẫn tới độ cong của không-thời gian.',
    ],
    buoc: [
      {
        ten: 'Ý nghĩ hạnh phúc nhất: người rơi không thấy mình nặng',
        noiDung: R`
          Bạn đang nhìn hai buồng kín. Buồng trái bị đứt cáp, đang rơi về phía Trái Đất. Buồng phải là khoang của một con tàu tắt máy, trôi giữa khoảng không xa mọi hành tinh. Trong cả hai, người đứng trên cân thấy cân chỉ **0 kg**, quả bóng lơ lửng cạnh bàn tay, tia sáng chiếu ngang đi thẳng tắp tới vòng tròn đích.

          Đây chính là ý nghĩ đến với Einstein năm 1907, khi ông còn làm ở Sở cấp bằng sáng chế tại Bern: một người rơi tự do từ mái nhà xuống sẽ **không cảm thấy trọng lượng của mình**. Mọi thứ quanh người ấy rơi cùng một kiểu, nên so với người ấy chúng đứng yên. Về sau ông kể lại rằng đó là ý nghĩ hạnh phúc nhất đời mình.

          Câu hỏi then chốt: nếu bị nhốt trong một buồng như thế, không cửa sổ, bạn có cách nào biết mình đang rơi về phía Trái Đất hay đang trôi giữa không gian không? Thả bóng, chiếu đèn, đứng lên cân: hai buồng cho cùng một kết quả.

          > [Thử ngay] Kéo quả bóng (đốm đỏ) ra giữa buồng rồi buông tay: nó đứng yên ngay chỗ đó. Ném nhẹ thì nó trôi thẳng đều tới vách rồi nảy lại. Rồi ra ngoài để xem thật ra hai buồng đang làm gì.
          > [[Nhìn từ bên ngoài|ngoai]] [[Về trong buồng|trong]]

          > [Lưu ý] Trên hình, mọi chuyển động đã được làm chậm để mắt theo kịp; riêng ánh sáng bị làm chậm cỡ trăm triệu lần.`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'roi', ngoai: false, haiVat: false, trieu: false, mayAnh: 'chinh' }),
        nut: { ngoai: (c) => c.cauHinh({ ngoai: true, mayAnh: 'ngoai' }), trong: (c) => c.cauHinh({ ngoai: false, mayAnh: 'chinh' }) },
        thuThach: {
          de: 'Kéo quả bóng ở một trong hai buồng ra giữa buồng, cao hơn sàn 1 m, rồi buông tay thật nhẹ cho nó **lơ lửng yên** suốt 2 giây.',
          kiem: (c) => c.bongLoLung(),
          giu: 2,
          goiY: 'Kéo chậm, dừng tay một chút rồi mới thả. Nếu bóng trôi đi, nghĩa là lúc buông tay bạn vẫn còn đang kéo: trong buồng rơi tự do, bóng giữ nguyên vận tốc bạn trao cho nó.',
        },
      },
      {
        ten: 'Hai buồng có trọng lượng: mặt đất và tên lửa',
        noiDung: R`
          Giờ buồng trái đứng yên trên mặt đất. Buồng phải nằm trong một tên lửa đang **tăng tốc đều 9,8 m/s²** giữa không gian trống. Mũi tên bên cạnh mỗi buồng cho biết điều đang xảy ra: bên trái có trọng lực kéo xuống, bên phải có động cơ đẩy lên.

          Người bên trong thì thấy y hệt nhau ở hai nơi:

          - cân chỉ **70 kg**;
          - quả bóng thả ra rơi xuống sàn với cùng gia tốc 9,8 m/s²;
          - tia sáng chiếu ngang chạm tường đối diện ở cùng một chỗ.

          > [Định nghĩa] **{{Nguyên lý tương đương}}** (dạng Einstein): trong một buồng đủ nhỏ và trong thời gian đủ ngắn, không thí nghiệm nào phân biệt được buồng đứng yên trong trường hấp dẫn $g$ với buồng tăng tốc đều $a = g$ ở nơi không có hấp dẫn.

          Chữ «không thí nghiệm nào» rất mạnh: không chỉ cơ học mà cả quang học, điện từ, đồng hồ nguyên tử. Chữ «đủ nhỏ» cũng quan trọng; bước 7 sẽ cho thấy vì sao.

          > [Thử ngay] Kéo quả bóng lên gần trần rồi thả, ở buồng nào cũng được: nó rơi như nhau ở cả hai nơi. Kéo **cần ga** bên hông tên lửa: lực đẩy mạnh hơn thì cân chỉ quá 70 kg và bóng rơi nhanh hơn, y như đứng trên một hành tinh có trọng lực mạnh hơn. Thả thêm một vật nhẹ cạnh quả bóng nặng: ở cả hai buồng chúng chạm sàn cùng lúc.
          > [[Thả thêm vật nhẹ|haiVat]] [[Chỉ một quả bóng|motVat]]

          > [Lưu ý] Về âm thanh: tiếng ù trầm là tiếng động cơ mà người trong buồng nghe qua thân tàu (ngoài không gian không có không khí để truyền tiếng); nó to và gắt dần theo lực đẩy của cần ga. Tiếng «bộp» là quả bóng chạm sàn: chạm càng mạnh, tiếng càng to.`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'nang', ngoai: false, haiVat: false, trieu: false, mayAnh: 'chinh' }),
        nut: { haiVat: (c) => c.cauHinh({ haiVat: true }), motVat: (c) => c.cauHinh({ haiVat: false }) },
      },
      {
        ten: 'Nhìn từ ngoài: sàn lao lên đón quả bóng',
        noiDung: R`
          Giờ ta đứng ngoài, cạnh hai cây thước mốc màu trắng. Hai cây thước này đứng yên, nên nhìn vào vạch của chúng là biết buồng nào đang chuyển động.

          - Trên mặt đất: buồng đứng yên, quả bóng rơi xuống sàn. Newton bảo: vì trọng lực kéo nó.
          - Trong tên lửa: vừa rời tay, quả bóng **không còn lực nào tác dụng**. Nó đứng yên đúng chỗ đó. Còn sàn buồng thì vẫn được động cơ đẩy lên nhanh dần, và lao tới đón quả bóng.

          Hệ quả rất lớn: trong tên lửa, việc «rơi» không phụ thuộc gì vào quả bóng. Sắt hay gỗ, nặng hay nhẹ, mọi vật thả ra đều đứng yên và đều bị sàn đuổi kịp cùng lúc. **Mọi vật rơi như nhau là chuyện đương nhiên trong tên lửa.** Nếu buồng trên mặt đất không phân biệt được với tên lửa, thì trên mặt đất mọi vật cũng phải rơi như nhau. Đó đúng là điều Galilei đã thấy.

          [[Thả thêm vật nhẹ|haiVat]] [[Về trong buồng|trong]]

          > [Lưu ý] Khi nhìn từ ngoài, hình chiếu lại một lần thả bóng rồi tua ngược về đầu, để tên lửa không bay mất khỏi khung hình. Trái Đất trên hình nhỏ hơn thật khoảng một triệu lần.

          +++ Đi sâu: vẽ quả bóng và sàn trong sơ đồ không-thời gian
          Lấy trục thời gian hướng lên, trục độ cao nằm ngang, như ở Phần 2. Trong hệ đứng ngoài tên lửa:

          - Quả bóng sau khi thả có độ cao không đổi $y = h$: đường thế giới của nó là một **đường thẳng đứng**. Không có lực, đường thế giới thẳng.
          - Sàn có độ cao $y = \tfrac12 a t^2$ (khi tốc độ còn nhỏ so với ánh sáng): đường thế giới của sàn **cong**.

          Hai đường gặp nhau ở sự kiện «bóng chạm sàn», khi $\tfrac12 a t^2 = h$, tức $t = \sqrt{2h/a}$. Với $h = 1{,}55$ m và $a = 9{,}8$ m/s² thì $t \approx 0{,}56$ giây. Thời điểm này không chứa khối lượng của quả bóng: vật nào thả từ cùng độ cao cũng chạm sàn cùng lúc.

          Thật ra đường của sàn luôn là một nhánh hyperbol; parabol $\tfrac12 at^2$ chỉ là xấp xỉ khi tốc độ còn nhỏ so với ánh sáng. Bài 8 vẽ kỹ hình này và rút ra từ đó rằng đồng hồ ở trần tên lửa chạy nhanh hơn đồng hồ ở sàn.
          +++`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'nang', ngoai: true, haiVat: false, trieu: false, mayAnh: 'ngoai' }),
        nut: { haiVat: (c) => c.cauHinh({ haiVat: true }), trong: (c) => c.cauHinh({ ngoai: false, mayAnh: 'chinh' }) },
      },
      {
        ten: 'Khối lượng quán tính bằng khối lượng hấp dẫn',
        noiDung: R`
          Hai vật trong mỗi buồng (quả bóng đỏ nặng và viên bi trắng nhẹ) chạm sàn cùng lúc. Với Newton, đó là một sự trùng hợp đáng ngờ, vì khối lượng đóng **hai vai khác nhau**:

          - {{khối lượng quán tính}} $m_{\text{qt}}$: vật ì đến đâu, khó đẩy cho tăng tốc đến đâu, trong $F = m_{\text{qt}}\,a$;
          - {{khối lượng hấp dẫn}} $m_{\text{hd}}$: Trái Đất kéo vật mạnh đến đâu, trong $F = m_{\text{hd}}\,g$.

          Gộp lại: $a = \dfrac{m_{\text{hd}}}{m_{\text{qt}}}\,g$. Mọi vật rơi như nhau chỉ khi tỉ số $m_{\text{hd}}/m_{\text{qt}}$ như nhau với mọi vật, mọi chất. Lý thuyết của Newton không bắt buộc điều đó; người ta phải đo.

          > [Lịch sử] Galilei (đầu thế kỷ 17) dùng mặt phẳng nghiêng và con lắc. Newton dùng con lắc làm bằng nhiều chất khác nhau. Đầu thế kỷ 20, Loránd Eötvös dùng cân xoắn và đẩy độ chính xác tới cỡ một phần trăm triệu, rồi một phần tỉ ($10^{-8}$ tới $10^{-9}$). Năm 1971, phi hành gia David Scott (Apollo 15) thả một chiếc búa và một chiếc lông chim trên Mặt Trăng, nơi không có không khí: chúng chạm đất cùng lúc. Vệ tinh MICROSCOPE của Pháp (phóng năm 2016, kết quả cuối công bố năm 2022) so hai khối titan và bạch kim rơi quanh Trái Đất: chúng rơi như nhau tới cỡ $10^{-15}$.

          Einstein đọc ngược lại: hai thứ bằng nhau không phải vì may, mà vì **việc rơi không phải là chuyện của vật**. Rơi là chuyện của chính không gian và thời gian quanh vật, giống như trong tên lửa rơi là chuyện của sàn.

          [[Thả hai vật trong tên lửa, nhìn từ ngoài|ngoai]] [[Nhìn trong buồng|trong]]

          +++ Đi sâu: đo «như nhau» chính xác đến đâu
          Người ta đo bằng {{tham số Eötvös}}: thả cùng lúc hai vật làm bằng hai chất khác nhau, đo gia tốc $a_1$, $a_2$ của chúng, rồi lập

          $$ \eta = \frac{2\,|a_1 - a_2|}{a_1 + a_2}. $$

          $\eta = 10^{-15}$ nghĩa là nếu hai vật rơi cùng nhau một nghìn kilômét thì chúng lệch nhau chưa tới một phần triệu tỉ của quãng đường ấy, tức khoảng một nanomet. MICROSCOPE không thả vật từ trên cao xuống: hai khối thử nằm lồng nhau trong vệ tinh đang bay vòng quanh Trái Đất, tức là đang rơi tự do liên tục, và máy đo xem có lực nào phải giữ chúng ở đúng chỗ của nhau hay không.
          +++`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'nang', ngoai: false, haiVat: true, trieu: false, mayAnh: 'chinh' }),
        nut: { ngoai: (c) => c.cauHinh({ ngoai: true, mayAnh: 'ngoai' }), trong: (c) => c.cauHinh({ ngoai: false, mayAnh: 'chinh' }) },
      },
      {
        ten: 'Rơi tự do: trọng lực biến mất',
        noiDung: R`
          Quay lại hai buồng không trọng lượng ở bước 1, lần này nhìn từ ngoài. Buồng trái lao xuống phía mặt đất; người, cân, quả bóng lao xuống cùng nó, cùng một gia tốc. Vì cân rơi cùng với chân người, nó không bị đè: **cân chỉ 0**.

          Vậy cái ta cảm thấy là «trọng lượng» là gì? Đó là **mặt đất đẩy ta lên**, không cho ta đi theo đường {{rơi tự do}}. Lúc đứng trên cân ở nhà, ta mới là người đang bị đẩy, giống hệt người đứng trên sàn tên lửa.

          Einstein lật ngược cách nhìn của Newton:

          - Buồng rơi tự do (đủ nhỏ) là một {{khung quán tính cục bộ}}: trong đó vật tự do đứng yên hoặc đi thẳng đều, và mọi định luật của thuyết tương đối hẹp (Phần 2) đúng nguyên vẹn.
          - Người đứng yên trên mặt đất **không** ở trong khung quán tính. Họ đang tăng tốc lên trên 9,8 m/s² so với khung quán tính cục bộ ở chỗ họ.

          > [Hiểu sai thường gặp] «Phi hành gia trên trạm vũ trụ lơ lửng vì ở đó không còn trọng lực.» Sai. Ở độ cao chừng 400 km, gia tốc hấp dẫn vẫn còn khoảng 8,7 m/s², gần 90% so với mặt đất. Họ lơ lửng vì cả trạm lẫn người đang **rơi tự do** quanh Trái Đất: rơi liên tục nhưng bay ngang đủ nhanh để không bao giờ chạm đất.

          > [Thử ngay] Kéo cần ga bên hông tên lửa lên: sàn bắt đầu đẩy người, người đứng xuống sàn, cân chỉ khác 0. Cái cân đo được chính là lực đẩy ấy.
          > [[Nhìn từ bên ngoài|ngoai]] [[Về trong buồng|trong]]`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'roi', ngoai: true, haiVat: false, trieu: false, mayAnh: 'ngoai' }),
        nut: { ngoai: (c) => c.cauHinh({ ngoai: true, mayAnh: 'ngoai' }), trong: (c) => c.cauHinh({ ngoai: false, mayAnh: 'chinh' }) },
        thuThach: {
          de: 'Tên lửa bên phải đang tắt máy, người trong đó không trọng lượng. Kéo **cần ga** cho cân dưới chân người ấy chỉ lại **70 kg** như khi đứng ở nhà (lệch dưới 3 kg).',
          kiem: (c) => Math.abs(c.ga() - 1) <= 0.043 && Math.abs(c.gaDich() - 1) <= 0.043,
          giu: 0.8,
          goiY: 'Cân chỉ 70 kg nhân với a/g. Vạch vàng «1 g» trên cần ga ứng với a = 9,8 m/s². Không có gì đẩy người lên thì không có trọng lượng.',
        },
      },
      {
        ten: 'Ánh sáng phải cong',
        noiDung: R`
          Nhìn tia sáng xanh trong hai buồng có trọng lượng. Vòng tròn trên tường đối diện là chỗ tia sẽ tới nếu nó đi thẳng (đường đứt nét). Nhưng tia chạm tường **thấp hơn**: với người trong buồng, đường đi của nó võng xuống.

          Trong tên lửa thì dễ hiểu. Bấm «nhìn từ bên ngoài»: tia sáng đi thẳng tắp, nhưng trong lúc nó bay ngang thì cả buồng đã vọt lên một đoạn, nên tia gặp tường ở chỗ thấp hơn vòng tròn.

          Nguyên lý tương đương nói buồng trên mặt đất không khác gì buồng tên lửa. Vậy **trên mặt đất tia sáng cũng phải võng xuống**: ánh sáng bị hấp dẫn bẻ cong. Einstein suy ra điều này chỉ bằng lập luận, trước khi có bất kỳ phương trình nào của thuyết tương đối rộng.

          > [Con số] Tia sáng vượt căn phòng rộng 3 m mất 10 nano giây. Trong thời gian đó nó võng xuống $\tfrac12 g t^2 \approx 4{,}9 \times 10^{-16}$ m, nhỏ hơn cả một hạt proton. Trên hình, ánh sáng đã bị làm chậm khoảng trăm triệu lần mới thấy được đường cong.

          > [Thử ngay] Kéo cần ga của tên lửa: lực đẩy càng mạnh, tia càng võng nhiều; tắt máy thì tia thẳng tắp.
          > [[Nhìn từ bên ngoài|ngoai]] [[Nhìn trong buồng|trong]] [[Buồng rơi tự do, nhìn từ mặt đất|roiNgoai]]

          +++ Đi sâu: từ lập luận buồng kín tới độ lệch ánh sáng sát Mặt Trời
          Gọi bề rộng buồng là $L$. Tia sáng đi ngang mất $t = L/c$. Trong hệ của buồng (tăng tốc $g$), mọi vật tự do có gia tốc $g$ hướng xuống, kể cả ánh sáng, nên tia võng

          $$ \Delta y = \tfrac12 g \left(\frac{L}{c}\right)^2. $$

          Với $L = 3$ m, $g = 9{,}8$ m/s²: $t = 1{,}0 \times 10^{-8}$ s và $\Delta y \approx 4{,}9 \times 10^{-16}$ m.

          Nhìn từ mặt đất vào một buồng đang rơi tự do cũng ra cùng kết luận: trong buồng rơi, tia sáng thẳng; nhưng buồng đang rơi, nên so với mặt đất tia phải cong xuống theo buồng.

          Năm 1911, Einstein dùng đúng lập luận này để tính góc lệch của tia sáng sao đi sát mép Mặt Trời và được khoảng 0,83 giây cung (tính lại với số liệu ngày nay là 0,87). Năm 1915, thuyết tương đối rộng hoàn chỉnh cho con số **gấp đôi**, khoảng 1,75 giây cung. Phần thêm vào đến từ chỗ không gian quanh Mặt Trời cũng cong, điều mà lập luận buồng kín không thấy được. Bài 11 dựng phần không gian cong ấy; Bài 14 kể chuyện đo nó năm 1919.
          +++`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'nang', ngoai: false, haiVat: false, trieu: false, mayAnh: 'chinh' }),
        nut: {
          ngoai: (c) => c.cauHinh({ cheDo: 'nang', ngoai: true, mayAnh: 'ngoai' }),
          trong: (c) => c.cauHinh({ cheDo: 'nang', ngoai: false, mayAnh: 'chinh' }),
          roiNgoai: (c) => c.cauHinh({ cheDo: 'roi', ngoai: true, mayAnh: 'ngoai' }),
        },
        thuThach: {
          de: 'Kéo **cần ga** cho tia sáng trong tên lửa chạm tường thấp hơn vòng đích **đúng một nửa** so với tia trong buồng trên mặt đất.',
          kiem: (c) => Math.abs(c.ga() - 0.5) <= 0.04 && Math.abs(c.gaDich() - 0.5) <= 0.04,
          giu: 0.8,
          goiY: R`Độ võng $\Delta y = \tfrac12 a (L/c)^2$ tỉ lệ thuận với gia tốc $a$. Ô số liệu góc dưới bên trái ghi độ võng của hai buồng.`,
        },
      },
      {
        ten: 'Giới hạn: chỉ đúng tại chỗ',
        noiDung: R`
          Mỗi buồng giờ có thêm bốn viên bi hồng, thả cùng lúc: hai viên nằm ngang hai bên, hai viên xếp trên dưới. Trong buồng tên lửa (phải), chúng đứng yên với nhau mãi. Trong buồng đang rơi về Trái Đất (trái):

          - hai viên hai bên **xích lại gần nhau**, vì mỗi viên rơi thẳng về tâm Trái Đất, mà hai đường ấy chụm vào nhau;
          - hai viên trên dưới **tách xa nhau**, vì viên dưới gần Trái Đất hơn nên bị hút mạnh hơn một chút.

          Đây là {{lực thủy triều}}. Không cách chọn buồng nào xoá được nó: buồng rơi chỉ xoá được phần gia tốc chung, không xoá được phần **chênh lệch** giữa hai chỗ. Vì thế một buồng đủ rộng, quan sát đủ lâu, sẽ phân biệt được Trái Đất với tên lửa. Nguyên lý tương đương chỉ đúng **tại chỗ**.

          > [Lưu ý] Trên hình, lực thủy triều đã được phóng đại hàng triệu lần. Thật ra hai viên bi cách nhau 3 m, rơi 1,55 m trong phòng, chỉ xích lại khoảng 0,73 micromet. Hai viên cách nhau 1 km, thả rơi 500 m, xích lại khoảng 7,8 cm.

          Thứ còn sót lại sau khi đã rơi tự do mới là hấp dẫn «thật». Trong thuyết tương đối rộng, nó chính là **độ cong của không-thời gian**: các đường thế giới ban đầu song song tiến lại gần nhau. Bài 12 đi tiếp từ đây.

          > [Thử ngay] [[Tắt bi thử|khongTrieu]] [[Bật bi thử|trieu]] [[Nhìn từ bên ngoài|ngoai]] [[Nhìn trong buồng|trong]]

          +++ Đi sâu: tính gia tốc thủy triều
          Đặt hai viên bi cách nhau $d$ theo phương ngang, ở khoảng cách $R$ tới tâm Trái Đất. Mỗi viên bị kéo về tâm với gia tốc $g$. Hai hướng kéo lệch nhau một góc $d/R$, nên phần gia tốc ngang kéo chúng lại gần nhau là

          $$ \Delta a_{\text{ngang}} \approx g\,\frac{d}{R}. $$

          Với $d = 3$ m, $R = 6\,371$ km: $\Delta a \approx 4{,}6 \times 10^{-6}$ m/s². Rơi một quãng $h$ (mất thời gian $t$, với $h = \tfrac12 g t^2$), hai viên xích lại $\tfrac12 \Delta a\, t^2 = d\,h/R$. Thay $d = 3$ m, $h = 1{,}55$ m: khoảng $7{,}3 \times 10^{-7}$ m.

          Theo phương thẳng đứng, gia tốc $g = GM/r^2$ đổi theo độ cao; lấy đạo hàm được $\Delta a_{\text{dọc}} \approx 2g\,d/R$, hướng làm hai viên tách ra. Thủy triều kéo dãn theo phương đứng, ép lại theo phương ngang: đó cũng là lý do nước biển phồng lên ở hai phía của Trái Đất dưới sức kéo của Mặt Trăng.
          +++`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'roi', ngoai: false, haiVat: false, trieu: true, mayAnh: 'chinh' }),
        nut: {
          trieu: (c) => c.cauHinh({ cheDo: 'roi', trieu: true }), khongTrieu: (c) => c.cauHinh({ trieu: false }),
          ngoai: (c) => c.cauHinh({ ngoai: true, mayAnh: 'ngoai' }), trong: (c) => c.cauHinh({ ngoai: false, mayAnh: 'chinh' }),
        },
      },
      {
        ten: 'Từ ý nghĩ tới lý thuyết',
        noiDung: R`
          Gom lại những gì một buồng kín dạy ta:

          1. **Mọi vật rơi như nhau.** Vậy rơi là tính chất của không gian và thời gian nơi vật đi qua, không phải của vật.
          2. **Rơi tự do là trạng thái tự nhiên**, không chịu lực nào. Đứng yên trên mặt đất mới là bị đẩy.
          3. **Ánh sáng cong** trong trường hấp dẫn.
          4. Dùng cùng lập luận cho đồng hồ: trong tên lửa tăng tốc, đồng hồ ở trần chạy nhanh hơn đồng hồ ở sàn; vậy trên mặt đất, **đồng hồ ở cao chạy nhanh hơn** đồng hồ ở thấp. Bài 8 chứng minh điều này, Bài 9 đo nó.
          5. Phần không xoá được là **lực thủy triều**, tức độ cong.

          > [Lịch sử] Từ ý nghĩ năm 1907 tới thuyết tương đối rộng hoàn chỉnh, Einstein mất tám năm. Khó khăn lớn nhất là phải học một thứ toán mới, hình học của không gian cong. Ông công bố phương trình trường hoàn chỉnh vào tháng 11 năm 1915.

          > [Tóm lại] Hấp dẫn không phải là một lực theo nghĩa thường. Tại mỗi chỗ, ta luôn xoá được nó bằng cách rơi tự do. Cái không xoá được là cách các khung rơi tự do ở những chỗ khác nhau khớp với nhau, và đó là hình học của không-thời gian.

          [[Xem lại buồng rơi tự do|roi]] [[Xem lại tên lửa tăng tốc|nang]]`,
        ra: (c) => c.tatAm(),
        vao: (c) => c.cauHinh({ cheDo: 'nang', ngoai: false, haiVat: false, trieu: false, mayAnh: 'chinh' }),
        nut: {
          roi: (c) => c.cauHinh({ cheDo: 'roi', ngoai: false, trieu: false, mayAnh: 'chinh' }),
          nang: (c) => c.cauHinh({ cheDo: 'nang', ngoai: true, trieu: false, mayAnh: 'ngoai' }),
        },
      },
    ],
    congThuc: [
      { ten: 'Hai vai của khối lượng', tex: R`F = m_{\text{qt}}\,a,\quad F = m_{\text{hd}}\,g \ \Rightarrow\ a = \frac{m_{\text{hd}}}{m_{\text{qt}}}\,g`, y: R`Mọi vật rơi như nhau khi và chỉ khi tỉ số $m_{\text{hd}}/m_{\text{qt}}$ như nhau với mọi vật.` },
      { ten: 'Tham số Eötvös', tex: R`\eta = \frac{2\,|a_1 - a_2|}{a_1 + a_2}`, y: 'Độ chênh gia tốc rơi của hai vật khác chất. MICROSCOPE (2022): cỡ $10^{-15}$.' },
      { ten: 'Độ võng của tia sáng qua buồng rộng L', tex: R`\Delta y = \tfrac12\,g\left(\frac{L}{c}\right)^2`, y: 'Với $L = 3$ m trên mặt đất: $4{,}9 \\times 10^{-16}$ m.' },
      { ten: 'Gia tốc thủy triều (hai vật cách nhau d)', tex: R`\Delta a_{\text{ngang}} \approx g\,\frac{d}{R},\qquad \Delta a_{\text{dọc}} \approx 2g\,\frac{d}{R}`, y: '$R$ là khoảng cách tới tâm hút. Theo phương ngang hai vật xích lại, theo phương đứng tách ra.' },
    ],
    cauHoi: [
      {
        hoi: 'Bạn tỉnh dậy trong một buồng kín không cửa sổ. Cân dưới chân chỉ 70 kg như ở nhà, quả bóng thả ra rơi xuống sàn. Bạn kết luận được gì chắc chắn?',
        chon: ['Mình đang ở trên mặt đất', 'Mình đang trong một tên lửa tăng tốc', 'Mình có thể ở trên mặt đất hoặc trong tên lửa tăng tốc 9,8 m/s²; thí nghiệm tại chỗ không phân biệt được', 'Mình đang rơi tự do'],
        dung: 2,
        giai: 'Đó chính là nội dung nguyên lý tương đương. Muốn phân biệt phải có buồng rất rộng (để thấy lực thủy triều) hoặc nhìn ra ngoài.',
      },
      {
        hoi: 'Trên Mặt Trăng, chiếc búa và chiếc lông chim thả cùng lúc chạm đất cùng lúc. Vì sao?',
        chon: ['Vì Mặt Trăng không có hấp dẫn', 'Vì khối lượng hấp dẫn của mỗi vật tỉ lệ đúng với khối lượng quán tính của nó, nên gia tốc rơi như nhau', 'Vì búa nặng hơn nên phải rơi nhanh hơn, chỉ là đo không đủ chính xác', 'Vì hai vật có cùng khối lượng'],
        dung: 1,
        giai: R`$a = (m_{\text{hd}}/m_{\text{qt}})\,g$. Lực kéo búa lớn hơn, nhưng búa cũng ì hơn đúng bấy nhiêu lần. Trên Trái Đất lông chim rơi chậm chỉ vì sức cản không khí; Mặt Trăng không có không khí.`,
      },
      {
        hoi: 'Phi hành gia trên trạm vũ trụ quỹ đạo thấp (cao khoảng 400 km) lơ lửng trong khoang. Câu nào đúng?',
        chon: ['Ở độ cao đó không còn trọng lực', 'Trọng lực ở đó vẫn gần 90% so với mặt đất, nhưng trạm và người cùng rơi tự do', 'Lực đẩy của động cơ trạm cân bằng trọng lực', 'Trạm có lớp vỏ chắn trọng lực'],
        dung: 1,
        giai: R`$g$ ở 400 km khoảng 8,7 m/s². Không trọng lượng là dấu hiệu của rơi tự do, không phải dấu hiệu của «hết trọng lực». Cách nói «lực ly tâm cân bằng trọng lực» chỉ là mô tả cùng chuyện ấy trong một khung quay theo trạm.`,
      },
      {
        hoi: 'Trong tên lửa tăng tốc, tia sáng chiếu ngang chạm tường đối diện ở chỗ thấp hơn. Kết hợp với nguyên lý tương đương, ta suy ra được gì?',
        chon: ['Ánh sáng có khối lượng nên bị kéo xuống', 'Ánh sáng phải cong trong trường hấp dẫn', 'Tên lửa làm ánh sáng chậm lại', 'Không suy ra được gì, vì hiện tượng chỉ xảy ra trong tên lửa'],
        dung: 1,
        giai: 'Buồng trên mặt đất không phân biệt được với buồng tên lửa, nên điều gì xảy ra với ánh sáng trong tên lửa cũng phải xảy ra trên mặt đất. Lập luận không cần ánh sáng có khối lượng.',
      },
      {
        hoi: 'Trong một buồng rộng đang rơi tự do về phía Trái Đất, hai viên bi được thả lơ lửng cạnh nhau theo phương ngang, cách nhau 3 m. Theo thời gian chúng sẽ:',
        chon: ['Đứng yên với nhau tuyệt đối', 'Xích lại gần nhau một chút, vì cả hai cùng hướng về tâm Trái Đất', 'Tách xa nhau', 'Cùng rơi xuống sàn buồng'],
        dung: 1,
        giai: 'Đây là lực thủy triều, rất nhỏ (khoảng 0,73 micromet sau khi rơi 1,55 m) nhưng có thật và không xoá được. Theo phương thẳng đứng thì ngược lại: hai viên tách ra. Nếu chọn «cùng rơi xuống sàn» là quên rằng sàn cũng rơi cùng chúng.',
      },
      {
        hoi: 'Vì sao nói việc khối lượng quán tính bằng khối lượng hấp dẫn là chìa khoá để Einstein coi hấp dẫn là hình học?',
        dap: 'Nếu mọi vật, bất kể khối lượng và chất liệu, đều rơi theo cùng một cách từ cùng một chỗ với cùng vận tốc đầu, thì đường đi của vật rơi không mang thông tin gì về vật. Nó chỉ phụ thuộc vào nơi chốn và thời điểm, tức là vào không-thời gian. Vậy có thể coi đường rơi là một tính chất hình học của không-thời gian (đường «thẳng nhất» trong đó), thay vì kết quả của một lực tác dụng lên từng vật. Lực điện thì không thế: hạt mang điện khác nhau đi những đường khác nhau.',
      },
    ],
    docThem: [
      'A. Einstein, *Relativity: The Special and the General Theory* (1916), phần hai: buồng kín, sự bằng nhau của khối lượng quán tính và khối lượng hấp dẫn, ánh sáng cong, kể bằng lời thường.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 6: phép thử Eötvös, nguyên lý tương đương, khung rơi tự do.',
      'R. P. Feynman, *The Feynman Lectures on Physics*, tập II, chương 42 «Curved Space»: phần nguyên lý tương đương và tên lửa tăng tốc.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): chuyện Einstein đi từ ý nghĩ năm 1907 tới thuyết tương đối rộng.',
    ],
    thuatNgu: [
      { vi: 'khối lượng quán tính', en: 'inertial mass', nghia: 'Khối lượng trong $F = ma$: cho biết vật khó tăng tốc đến đâu.' },
      { vi: 'khối lượng hấp dẫn', en: 'gravitational mass', nghia: 'Khối lượng quyết định vật bị hấp dẫn kéo mạnh đến đâu. Thí nghiệm cho thấy nó tỉ lệ đúng với khối lượng quán tính.' },
      { vi: 'khung quán tính cục bộ', en: 'local inertial frame', nghia: 'Hệ quy chiếu gắn với một buồng nhỏ đang rơi tự do. Trong vùng nhỏ và thời gian ngắn, nó là một khung quán tính đúng nghĩa của thuyết tương đối hẹp.' },
      { vi: 'tham số Eötvös', en: 'Eötvös parameter', nghia: 'Độ chênh tương đối gia tốc rơi của hai vật làm bằng hai chất khác nhau, $\\eta = 2|a_1 - a_2|/(a_1 + a_2)$.' },
    ],
  },

  conSo: [
    '**Cỡ 10⁻¹⁵**: vệ tinh MICROSCOPE (kết quả cuối cùng, công bố năm 2022) cho thấy khối titan và khối bạch kim rơi như nhau tới mức chính xác đó.',
    '**1971**: trên Mặt Trăng, phi hành gia David Scott thả cùng lúc một chiếc búa và một chiếc lông chim. Chúng chạm đất cùng lúc.',
    '**4,9 × 10⁻¹⁶ m**: độ võng thật của tia sáng khi đi ngang một căn phòng rộng 3 m trên mặt đất.',
    '**8,7 m/s²**: gia tốc hấp dẫn ở độ cao 400 km, nơi phi hành gia «không trọng lượng».',
    '**0,73 micromet**: hai viên bi cách nhau 3 m, thả rơi 1,55 m, xích lại chừng ấy vì lực thủy triều.',
  ],
  hieuDung: '**Nguyên lý tương đương chỉ đúng trong một vùng nhỏ.** Trong một buồng rất rộng trên mặt đất, hai quả bóng thả cách xa nhau sẽ rơi hơi chụm lại, vì cả hai đều hướng về tâm Trái Đất; trong tên lửa thì chúng rơi song song. Sự chụm lại ấy (lực thủy triều) không thể xoá đi bằng cách chuyển sang buồng đang rơi. Đó mới là hấp dẫn «thật», và trong thuyết tương đối rộng nó chính là *độ cong của không-thời gian*.',
  nguon: 'Einstein 1907 và 1911; Touboul và cộng sự 2022 (MICROSCOPE, kết quả cuối); NASA, Apollo 15 (1971). Gia tốc, độ võng, lực thủy triều tính lại từ hằng số CODATA 2018 và GM Trái Đất (IAU), xem kiem-tra/kiem-phan-3-cu.mjs.',

  tao(app) {
    const scene = new THREE.Scene();
    const am = app.am, tt = app.tt;
    scene.add(taoNenSao({ soSao: 2600, hat: 61, doSang: 0.6 }));
    const denCanh = taoDenCanh(scene, { renderer: app.renderer, huongChinh: [5, 8, 7], huongVien: [-6, 3, -7] });
    const _v = new THREE.Vector3(), _w = new THREE.Vector3();
    const kep = (x, a, b) => Math.min(b, Math.max(a, x));

    // ---------------------------------------------------------------- Trái Đất thu nhỏ và bệ dưới buồng trái
    // Gốc của nhomDat là đỉnh Trái Đất ngay dưới tâm buồng trái; trượt xuống khi buồng đứt cáp.
    const nhomDat = new THREE.Group();
    nhomDat.position.set(XA, Y_DAT.nang, 0);
    scene.add(nhomDat);
    const traiDat = taoTraiDat({ banKinh: RD, nghieng: 74, tocDoQuay: 0, chiTiet: 192 });
    traiDat.cau.rotation.y = (-107 * Math.PI) / 180;     // định hướng để Việt Nam (16° B, 107° Đ) ở đỉnh (chưa soát bằng ảnh)
    traiDat.nhom.position.y = -RD;
    traiDat.datHuongSang([0.5, 0.62, 0.6]);
    nhomDat.add(traiDat.nhom);
    // bệ bê tông có viền thép, vạch cảnh báo và đèn quanh mép
    const be = new THREE.Group();
    const thanBe = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.3, 0.62, 72), vlSon(0x7d828c, 0.9));
    thanBe.position.y = -0.15;
    const matBe = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 0.02, 72), vlSon(0x30343c, 0.75));
    matBe.position.y = 0.165;
    const vanhBe = new THREE.Mesh(new THREE.TorusGeometry(2.03, 0.035, 8, 96), vlKimLoai(0xb7bec9, 0.3));
    vanhBe.rotation.x = Math.PI / 2; vanhBe.position.y = 0.16;
    const vach = new THREE.Mesh(new THREE.RingGeometry(1.72, 1.86, 96), vlSon(0xd8a531, 0.6, { emissive: 0x3a2a08 }));
    vach.rotation.x = -Math.PI / 2; vach.position.y = 0.178;
    const dsDen = [];
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; dsDen.push(dat(new THREE.SphereGeometry(0.03, 8, 6), { x: Math.cos(a) * 2.13, y: 0.1, z: Math.sin(a) * 2.13 })); }
    const denBe = new THREE.Mesh(ghep(dsDen), vlSang(0x9fd8ff, 2.2));
    be.add(thanBe, matBe, vanhBe, vach, denBe);
    nhomDat.add(be);
    const nhanDat = taoNhan(chuCanh("canh.trai-dat-thu-nho-khoang-mot-trieu-lan", "Trái Đất<small>thu nhỏ khoảng một triệu lần</small>"), 'mo', { giua: true });
    nhanDat.position.set(-1.2, -2.15, 3.2);
    nhomDat.add(nhanDat);
    // thước mốc đứng yên so với mặt đất (cắm vào Trái Đất, bên trái buồng)
    const thuocA = taoThuoc(-0.9, 13);
    thuocA.position.set(-2.55, 0, -0.3);
    nhomDat.add(thuocA);

    // ---------------------------------------------------------------- hai buồng
    const taoPhong = (mau, lech) => {
      const buong = taoBuong({ mau, cuaSo: null });
      const can = taoCan();
      can.nhom.position.set(-0.55, 0, 0.2); can.datSo('70.0');
      const nguoi = taoPhiHanhGia({ tuThe: 'gio-tay', tay: 'trai', mauNhan: mau });
      nguoi.nhom.position.set(-0.55, 0.1, 0.2);
      const den = taoDenChieu({ mau: MAU_TIA, doDai: L_TIA });
      den.datChum(false);
      den.nhom.position.set(X_DEN, Y_TIA, Z_TIA);
      // vòng đích trên tường đối diện: chỗ tia sẽ tới nếu đi thẳng
      const bia = new THREE.Group();
      bia.position.set(X_TUONG + 0.012, Y_TIA, Z_TIA);
      bia.rotation.y = -Math.PI / 2;
      const vong = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 8, 48), vlSang(MAU_TIA, 1.7));
      const nen = new THREE.Mesh(new THREE.CircleGeometry(0.12, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(MAU_TIA).multiplyScalar(0.18), transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      const chu = new THREE.Mesh(ghep([dat(new THREE.PlaneGeometry(0.34, 0.008)), dat(new THREE.PlaneGeometry(0.008, 0.34))]), new THREE.MeshBasicMaterial({ color: new THREE.Color(MAU_TIA).multiplyScalar(0.9), side: THREE.DoubleSide, transparent: true, opacity: 0.7, depthWrite: false }));
      const domDich = domSang(MAU_TIA, 0.26, 0.9);
      domDich.position.set(X_TUONG - 0.02, Y_TIA, Z_TIA);
      bia.add(nen, vong, chu);
      const vetCham = domSang(MAU_TIA, 0.36, 2.8);
      vetCham.visible = false;
      // quả bóng nặng, viên bi nhẹ, bi thử thủy triều (toạ độ trong buồng)
      const bong = taoBong({ banKinh: R_BONG });
      const nhe = new THREE.Mesh(new THREE.SphereGeometry(R_NHE, 24, 14), vlBong(0xf4f4f0, 0.25, { emissive: 0xffffff, emissiveIntensity: 0.12 }));
      const bi = Array.from({ length: 4 }, () => new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 14), vlBong(MAU_HONG, 0.3, { emissive: MAU_HONG, emissiveIntensity: 0.55 })));
      const chamGoc = Array.from({ length: 4 }, () => domSang(MAU_HONG, 0.2, 0.8));
      buong.nhom.add(can.nhom, nguoi.nhom, den.nhom, bia, domDich, vetCham, bong.nhom, nhe, ...bi, ...chamGoc);
      // tia sáng (toạ độ thế giới: khi nhìn từ ngoài, mỗi điểm của tia ứng với một thời điểm khác nhau của buồng)
      const vet = new DuongDay(56, { mau: MAU_TIA, rong: 2.6, doMo: 1, quang: 0.16, sang: 1.9, moDan: true });
      const thang = new DuongDay(2, { mau: MAU_TIA, rong: 1.1, doMo: 0.35, cong: false, net: [0.12, 0.1] });
      const dauTia = domSang(0xd8f3ff, 0.42, 3.2);
      scene.add(vet.line, thang.line, dauTia);
      const st = {
        che: 'cam', t: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), pN: new THREE.Vector3(), vN: new THREE.Vector3(),
        pTruoc: new THREE.Vector3(), vKeo: new THREE.Vector3(), nguoiTha: false, nghi: 0, p0: new THREE.Vector3(), daCham: false,
      };
      return { mau, lech, buong, can, nguoi, den, bia, vetCham, bong, nhe, bi, chamGoc, vet, thang, dauTia, st, tuThe: 'gio-tay', cam: true, lxNoi: new LoXo(0, 0.7), lxCan: new LoXo(KG, 0.35), soCan: '' };
    };
    const PA = taoPhong(MAU_A, -0.45), PB = taoPhong(MAU_B, 0.45);
    PA.buong.nhom.position.set(XA, 0, 0);
    scene.add(PA.buong.nhom);
    const tenLua = taoTenLua({ choBuong: { rong: 3, cao: 4, sau: 3 }, mauNhan: MAU_B, luc: 1 });
    tenLua.nhom.position.set(XB, 0, 0);
    tenLua.neoBuong.add(PB.buong.nhom);
    scene.add(tenLua.nhom);
    PA.goc = PA.buong.nhom.position;
    PB.goc = tenLua.nhom.position;
    // mặt phẳng kéo bóng: ngang tầm bàn tay (theo chiều sâu)
    PA.nguoi.capNhat(0);
    PA.nguoi.viTriCam(_v, R_BONG, 'trai');
    const Z_KEO = _v.z - PA.goc.z;

    // thước mốc trôi tự do cạnh tên lửa (đứng yên trong khung quán tính)
    const thuocB = taoThuoc(-12, 15);
    thuocB.position.set(XB + 3.15, 0, -0.5);
    scene.add(thuocB);
    const nhanMoc = taoNhan(chuCanh("canh.thuoc-moc-dung-yen-nhin-vach-de-biet", "thước mốc đứng yên<small>nhìn vạch để biết buồng nào chuyển động</small>"), 'mo tran', { giua: true });
    nhanMoc.position.set(XB + 3.15, 8.5, -0.5);
    scene.add(nhanMoc);

    // ---------------------------------------------------------------- cần ga bên hông tên lửa
    const ga = new THREE.Group();
    let nhan1g, nhanTat;   // vạch «1 g» và «tắt»: ẩn khi núm cần ga đứng ngay đó, để nhãn của núm không đè lên
    ga.position.set(GA_X, 0, GA_Z);
    tenLua.nhom.add(ga);
    {
      const ray = new THREE.Mesh(hopBo(0.08, GA_DAI + 0.2, 0.08, 0.03, 2), vlKimLoai(0x3e434c, 0.4));
      ray.position.y = GA_Y0 + GA_DAI / 2;
      const khe = new THREE.Mesh(hopBo(0.022, GA_DAI, 0.02, 0.008), vlSang(0xff9a4a, 0.55));
      khe.position.set(0, GA_Y0 + GA_DAI / 2, 0.045);
      const nho = [], lon = [];
      for (let i = 0; i <= 6; i++) {
        const k = (i / 6) * GA_MAX, y = GA_Y0 + (k / GA_MAX) * GA_DAI;
        (Math.abs(k - 1) < 1e-6 ? lon : nho).push(dat(hopBo(Math.abs(k - 1) < 1e-6 ? 0.3 : 0.16, 0.022, 0.03, 0.006), { x: -0.06, y, z: 0.03 }));
      }
      const mNho = new THREE.Mesh(ghep(nho), vlSang(0xc9d2e0, 0.9));
      const mLon = new THREE.Mesh(ghep(lon), vlSang(MAU_B, 2.2));
      const gia = [];
      for (const y of [GA_Y0 + 0.12, GA_Y0 + GA_DAI - 0.12]) gia.push(dat(hopBo(0.62, 0.05, 0.05, 0.015), { x: 0.28, y, z: -0.1, ry: 0.34 }));
      const mGia = new THREE.Mesh(ghep(gia), vlKimLoai(0x6b727e, 0.35));
      ga.add(ray, khe, mNho, mLon, mGia);
      const n1 = taoNhan('1 g', 'vang tran'); n1.position.set(-0.24, GA_Y0 + GA_DAI / GA_MAX, 0.03); n1.center.set(1, 0.5);
      const n0 = taoNhan(chuCanh("canh.tat", "tắt"), 'mo tran'); n0.position.set(-0.24, GA_Y0, 0.03); n0.center.set(1, 0.5);
      ga.add(n1, n0);
      nhan1g = n1; nhanTat = n0;
    }
    const numGa = new THREE.Group();
    numGa.add(new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 14), vlBong(0xff8a3c, 0.3, { emissive: 0xff6a20, emissiveIntensity: 0.35 })));
    const canNum = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 10), vlKimLoai(0x9aa1ad, 0.3));
    canNum.rotation.x = Math.PI / 2; canNum.position.z = -0.08;
    numGa.add(canNum);
    ga.add(numGa);
    const nhanGa = taoNhan('', 'tran');
    nhanGa.center.set(1, 0.5);
    ga.add(nhanGa);

    // ---------------------------------------------------------------- mũi tên, nhãn, dây cáp, thủy triều
    const muiG = taoMuiTenDong(MAU_A), muiA = taoMuiTenDong(MAU_B);
    scene.add(muiG.nhom, muiA.nhom);
    const nhanMuiG = taoNhan(chuCanh("canh.trong-luc-g-9-8-m-s", "trọng lực<small>g = 9,8 m/s²</small>"), 'xanh tran');
    nhanMuiG.center.set(1, 0.5);
    const nhanMuiA = taoNhan('', 'vang tran');
    scene.add(nhanMuiG, nhanMuiA);
    const capTren = new DuongDay(2, { mau: 0xc9ccd6, rong: 1.6, doMo: 0.85, cong: false });
    const capDuoi = new DuongDay(2, { mau: 0xc9ccd6, rong: 1.6, doMo: 0.85, cong: false });
    scene.add(capTren.line, capDuoi.line);
    const huongTam = [new DuongDong(2, { mau: MAU_HONG, doMo: 0.45 }), new DuongDong(2, { mau: MAU_HONG, doMo: 0.45 })];
    const nhanTam = taoNhan(chuCanh("canh.huong-ve-tam-trai-dat", "hướng về tâm Trái Đất"), 'hong tran', { giua: true });
    scene.add(huongTam[0].line, huongTam[1].line, nhanTam);
    const nhanA = taoNhan('', 'xanh dam', { giua: true }), nhanB = taoNhan('', 'vang dam');
    const canA = taoNhan('', '', { giua: true }), canB = taoNhan('', '', { giua: true });
    scene.add(nhanA, nhanB, canA, canB);

    // ---------------------------------------------------------------- trạng thái
    const S = { cheDo: 'nang', ngoai: false, haiVat: false, trieu: false, k: 1 };
    const lxK = new LoXo(1, 0.45);                // lực đẩy thật (theo đơn vị 1 g), chuyển mượt
    const lxDat = new LoXo(Y_DAT.nang, 0.9);      // độ cao đỉnh Trái Đất
    const lxNenB = new LoXo(0, 0.6);              // chỗ bắt đầu của tên lửa khi nhìn từ ngoài
    const tl = { pha: 'chay', t: 0, tg: 0 };     // dòng thời gian chiếu lại (nhìn từ ngoài)
    const tlTrieu = { pha: 'chay', t: 0, tg: 0 }; // bi thử thủy triều khi nhìn trong buồng
    // Chạy tới tChay giây, dừng, tua lại nhanh, chờ, rồi chạy lại: lặp mà không nhảy hình.
    const buocTG = (d, dt, tChay) => {
      if (d.pha === 'chay') { d.t += dt; if (d.t >= tChay) { d.t = tChay; d.pha = 'giu'; d.tg = 0; } }
      else if (d.pha === 'giu') { d.tg += dt; if (d.tg >= T_GIU) d.pha = 'tua'; }
      else if (d.pha === 'tua') { d.t -= dt * TOC_TUA; if (d.t <= 0) { d.t = 0; d.pha = 'cho'; d.tg = 0; } }
      else { d.tg += dt; if (d.tg >= T_CHO) { d.pha = 'chay'; d.tg = 0; } }
    };
    let tTia = 0, tong = 0, dangKeoGa = false, nacGa = 10, daThu = false;
    const aA = () => (S.cheDo === 'nang' ? G : 0);
    const aB = () => G * Math.max(0, lxK.v);
    const thamThu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;

    const bang = app.bang;
    const dkCheDo = bang.chon({
      nhan: chuCanh("canh.tinh-huong", "Tình huống"),
      luaChon: [
        { giaTri: 'nang', nhan: chuCanh("canh.mat-dat-ten-lua-tang-toc", "Mặt đất ↔ tên lửa tăng tốc"), moTa: chuCanh("canh.ca-hai-buong-deu-co-trong-luong", "Cả hai buồng đều có «trọng lượng»") },
        { giaTri: 'roi', nhan: chuCanh("canh.roi-tu-do-troi-trong-khong-gian", "Rơi tự do ↔ trôi trong không gian"), moTa: chuCanh("canh.ca-hai-buong-deu-khong-trong-luong", "Cả hai buồng đều không trọng lượng") },
      ],
      giaTri: S.cheDo,
      khiDoi: (v) => cauHinh({ cheDo: v }),
    });
    const dkNgoai = bang.chon({
      nhan: chuCanh("canh.dung-o-dau-de-nhin", "Đứng ở đâu để nhìn?"),
      luaChon: [{ giaTri: false, nhan: chuCanh("canh.trong-buong", "Trong buồng") }, { giaTri: true, nhan: chuCanh("canh.nhin-tu-ben-ngoai", "Nhìn từ bên ngoài") }],
      giaTri: S.ngoai,
      khiDoi: (v) => cauHinh({ ngoai: v, mayAnh: v ? 'ngoai' : 'chinh' }),
    });
    const dkGa = bang.thanhTruot({
      nhan: chuCanh("canh.luc-day-cua-ten-lua-can-ga", "Lực đẩy của tên lửa (cần ga)"), min: 0, max: GA_MAX, buoc: 0.01, giaTri: S.k,
      hienThi: (v) => `${so(9.8 * v, 1)} m/s²`,
      khiDoi: (v) => datGa(v, false),
    });
    const dkHaiVat = bang.congTac({ nhan: chuCanh("canh.tha-them-mot-vat-nhe-canh-qua-bong", "Thả thêm một vật nhẹ cạnh quả bóng"), giaTri: S.haiVat, khiDoi: (v) => cauHinh({ haiVat: v }) });
    const dkTrieu = bang.congTac({ nhan: chuCanh("canh.bi-thu-luc-thuy-trieu-phong-dai-rat", "Bi thử lực thủy triều (phóng đại rất mạnh)"), giaTri: S.trieu, khiDoi: (v) => cauHinh({ trieu: v }) });
    const the = bang.the('');

    const GOC = {
      chinh: [[0.3, 2.9, 20.5], [0.2, 2.15, 0]],
      ngoai: [[0.3, 2.6, 23.5], [0.2, 2.2, 0]],
    };
    // Buồng rơi tự do: hạ tâm nhìn một chút để thấy Trái Đất ở dưới.
    const goc = (ten, giay = 1.3) => {
      const [p, d] = GOC[ten], h = S.cheDo === 'roi' ? 0.55 : 0;
      app.bayToi([p[0], p[1] - h, p[2]], [d[0], d[1] - h, d[2]], giay);
    };

    // ---------------------------------------------------------------- tay nắm: hai quả bóng và cần ga
    const viTriThe = (P, x, y, z, out) => out.set(P.goc.x + x, P.goc.y + y, P.goc.z + z);
    const taoTayBong = (P, nhan) => tt.tayNam({
      viTri: [P.goc.x, 1.4, Z_KEO], mau: 0xff8a73, co: 0.075, ten: chuCanh("canh.qua-bong", "Quả bóng"),
      moTa: () => (P === PA ? aA() : aB()) > 0.05 * G ? chuCanh("canh.keo-len-roi-tha-trong-buong-nay-moi", "Kéo lên rồi thả: trong buồng này mọi vật thả ra đều «rơi» xuống sàn.") : chuCanh("canh.keo-roi-tha-trong-buong-nay-vat-tha", "Kéo rồi thả: trong buồng này vật thả ra đứng yên, hoặc trôi thẳng đều nếu bạn ném nhẹ."),
      rangBuoc: { kieu: 'mat-phang', phap: [0, 0, 1], qua: [0, 0, Z_KEO] },
      gioiHan: (p) => {
        p.x = kep(p.x, P.goc.x - BX + R_BONG, P.goc.x + BX - R_BONG);
        p.y = kep(p.y, P.goc.y + R_BONG, P.goc.y + BY - R_BONG);
        p.z = Z_KEO;
        return p;
      },
      nhan,
      khiNam: () => { P.st.che = 'keo'; P.st.vKeo.set(0, 0, 0); P.st.pTruoc.copy(P.st.p); },
      khiKeo: (p) => { P.st.che = 'keo'; P.st.p.set(p.x - P.goc.x, p.y - P.goc.y, p.z - P.goc.z); },
      khiTha: () => {
        const st = P.st;
        st.che = 'roi'; st.t = 0; st.nghi = 0; st.nguoiTha = true;
        st.v.copy(st.vKeo);
        if (st.v.length() > 4) st.v.setLength(4);
        st.v.z = 0;
      },
    });
    const tayA = taoTayBong(PA, '');
    const tayB = taoTayBong(PB, chuCanh("canh.keo-qua-bong-roi-tha", "Kéo quả bóng rồi thả"));
    const yNumGa = (k) => GA_Y0 + (k / GA_MAX) * GA_DAI;
    const tayGa = tt.tayNam({
      viTri: [XB + GA_X, yNumGa(S.k), GA_Z], mau: 0xffb86b, co: 0.1, ten: chuCanh("canh.can-ga", "Cần ga"),
      moTa: () => chuCanh("canh.luc-day-cho-gia-toc-m-s-keo", "Lực đẩy cho gia tốc <b>{0} m/s²</b>. Kéo lên, xuống để đổi; vạch vàng là 1 g.", [so(9.8 * lxK.v, 1)]),
      rangBuoc: { kieu: 'duong', qua: [XB + GA_X, 0, GA_Z], huong: [0, 1, 0] },
      gioiHan: (p) => { p.x = XB + GA_X; p.z = GA_Z; p.y = kep(p.y, PB.goc.y + GA_Y0, PB.goc.y + GA_Y0 + GA_DAI); return p; },
      nhan: chuCanh("canh.keo-can-ga", "Kéo cần ga"),
      khiNam: () => { dangKeoGa = true; },
      khiKeo: (p) => datGa(((p.y - PB.goc.y - GA_Y0) / GA_DAI) * GA_MAX, true),
      khiTha: () => { dangKeoGa = false; if (S.ngoai) { tl.pha = 'cho'; tl.t = 0; tl.tg = 0; } },
    });
    // rê chuột xem thông tin
    tt.them(PA.can.nhom, { ten: chuCanh("canh.can-trong-buong-trai", "Cân trong buồng trái"), mau: MAU_A, moTa: () => chuCanh("canh.chi-kg-can-do-luc-san-day-len", "Chỉ <b>{0} kg</b>. Cân đo lực sàn đẩy lên người, không đo «trọng lực».", [so(PA.lxCan.v, 1)]) });
    tt.them(PB.can.nhom, { ten: chuCanh("canh.can-trong-ten-lua", "Cân trong tên lửa"), mau: MAU_B, moTa: () => chuCanh("canh.chi-kg-tuc-kg-a-g-voi-a", "Chỉ <b>{0} kg</b>, tức {1} kg × a/g với a = {2} m/s².", [so(PB.lxCan.v, 1), so(KG, 0), so(9.8 * lxK.v, 1)]) });
    tt.them(traiDat.cau, { ten: chuCanh("canh.trai-dat", "Trái Đất"), mau: 0x7fcaff, moTa: chuCanh("canh.bo-bien-that-natural-earth-buong-trai-dung", "Bờ biển thật (Natural Earth). Buồng trái đứng trên một bệ bê tông. Trên hình Trái Đất thu nhỏ khoảng một triệu lần.") });
    for (const P of [PA, PB]) tt.them(P.bia, { ten: chuCanh("canh.vong-dich", "Vòng đích"), mau: MAU_TIA, banKinhPx: 14, moTa: () => chuCanh("canh.cho-tia-sang-se-toi-neu-di-thang", "Chỗ tia sáng sẽ tới nếu đi thẳng. Ở buồng này tia chạm tường thấp hơn <b>{0}</b> (đơn vị hình).", [so(P.vong ?? 0, 2)]) });

    function datGa(k, tuTay) {
      k = kep(Math.round(k * 100) / 100, 0, GA_MAX);
      if (tuTay) {
        const n = Math.round(k * 10);
        if (n !== nacGa) { am.tich({ tanSo: 520 + 420 * k, doTo: 0.16, lech: 0.35, dai: 0.03 }); nacGa = n; }
      }
      S.k = k;
      lxK.dat(k);
      tenLua.datLucDay(k);
      dkGa.dat(k);
      if (S.ngoai) lxNenB.dat(-2.4 * Math.min(1, k));
      datNhan();
    }

    function datNhan() {
      const nang = S.cheDo === 'nang', ngoai = S.ngoai, k = S.k;
      const coLuc = k > 0.02;
      nhanA.datChu(nang ? chuCanh("canh.dung-yen-tren-mat-dat", "Đứng yên trên mặt đất") : chuCanh("canh.roi-tu-do-dut-cap", "Rơi tự do (đứt cáp)"));
      nhanB.datChu(coLuc
        ? chuCanh("canh.ten-lua-tang-toc-m-s-giua-khong", "Tên lửa tăng tốc {0} m/s²<small>giữa không gian, xa mọi hành tinh</small>", [so(9.8 * k, 1)])
        : chuCanh("canh.troi-tu-do-trong-khong-gian-dong-co", "Trôi tự do trong không gian<small>động cơ tắt</small>"));
      nhanMuiA.datChu(chuCanh("canh.luc-day-a-m-s", "lực đẩy<small>a = {0} m/s²</small>", [so(9.8 * k, 1)]));
      muiG.nhom.visible = nhanMuiG.visible = nang;
      thuocA.visible = thuocB.visible = nhanMoc.visible = ngoai;
      for (const P of [PA, PB]) {
        P.nhe.visible = S.haiVat;
        for (const b of P.bi) b.visible = S.trieu;
        for (const b of P.chamGoc) b.visible = S.trieu;
      }
      for (const h of huongTam) h.line.visible = S.trieu && !nang;
      nhanTam.visible = S.trieu && !nang;
      tayA.an(ngoai); tayB.an(ngoai);
      dkHaiVat.dat(S.haiVat); dkTrieu.dat(S.trieu);
      dkCheDo.dat(S.cheDo); dkNgoai.dat(S.ngoai);
      const lechGa = Math.abs(k - (nang ? 1 : 0)) > 0.02;
      let chu;
      if (S.trieu && !nang) chu = chuCanh("canh.bi-thu-luc-thuy-trieu-trong-buong-dang", "<b>Bi thử lực thủy triều.</b> Trong buồng đang rơi về Trái Đất (trái), hai viên bi ngang xích lại, hai viên trên dưới tách ra; chấm mờ là chỗ chúng được thả. Trong buồng giữa không gian (phải), bốn viên đứng yên. Hình phóng đại hiệu ứng hàng triệu lần.");
      else if (nang) chu = ngoai
        ? chuCanh("canh.nhin-tu-ben-ngoai-tren-mat-dat-qua", "<b>Nhìn từ bên ngoài.</b> Trên mặt đất: quả bóng rơi xuống sàn. Trong tên lửa: quả bóng ở yên, sàn lao lên đón nó; tia sáng đi thẳng, nhưng tường đã vọt lên nên tia chạm tường ở chỗ thấp hơn. Hai câu chuyện khác nhau, nhưng người ở <em>trong buồng</em> đo được y hệt nhau.")
        : chuCanh("canh.nhin-tu-trong-buong-hai-buong-giong-nhau", "<b>Nhìn từ trong buồng.</b> Hai buồng giống nhau như đúc: bóng rơi cùng một kiểu, cân cùng chỉ 70 kg, tia sáng cùng võng xuống một đoạn (vòng tròn xanh trên tường là chỗ tia sẽ tới nếu đi thẳng). Kéo quả bóng lên rồi thả để thử.");
      else chu = ngoai
        ? chuCanh("canh.nhin-tu-mat-dat-buong-trai-dang-roi", "<b>Nhìn từ mặt đất.</b> Buồng trái đang rơi, người và bóng rơi cùng nó nên bóng vẫn nằm cạnh bàn tay. Tia sáng thẳng đối với buồng đang rơi, vậy đối với mặt đất nó phải <em>cong xuống</em>: hấp dẫn bẻ cong ánh sáng.")
        : chuCanh("canh.nhin-tu-trong-buong-khong-trong-luong-o", "<b>Nhìn từ trong buồng.</b> Không trọng lượng ở cả hai nơi: bóng lơ lửng, cân chỉ 0, tia sáng thẳng tắp. Người trong buồng đang rơi không thể biết mình đang rơi về phía Trái Đất hay đang trôi giữa không gian. Kéo quả bóng rồi thả: nó đứng yên ở đó.");
      if (lechGa && !(S.trieu && !nang)) chu += chuCanh("canh.can-ga-dang-o-m-s-g-can", " <br><b>Cần ga đang ở {0} m/s²</b> ({1} g): cân trong tên lửa chỉ {2} kg; bóng rơi nhanh và tia sáng võng nhiều theo đúng tỉ lệ ấy.", [so(9.8 * k, 1), so(k, 2), so(KG * k, 1)]);
      the.dat(chu);
    }

    // Đặt bóng về tay (chuyển mượt), xoá dấu «người học đã thả».
    function nhatLai() {
      for (const P of [PA, PB]) { const st = P.st; if (st.che !== 'keo') st.che = 'nhat'; st.nguoiTha = false; st.nghi = 0; st.daCham = false; }
    }

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      let doi = false;
      const cheCu = S.cheDo;
      for (const k of ['cheDo', 'ngoai', 'haiVat', 'trieu']) if (o[k] != null && o[k] !== S[k]) { S[k] = o[k]; doi = true; }
      if (o.k != null) datGa(o.k, false);
      else if (S.cheDo !== cheCu || o.cheDo != null) datGa(S.cheDo === 'nang' ? 1 : 0, false);
      lxDat.dat(Y_DAT[S.cheDo]);
      lxNenB.dat(S.ngoai ? -2.4 * Math.min(1, S.k) : 0);
      if (doi) { tl.pha = 'cho'; tl.t = 0; tl.tg = 0; tlTrieu.pha = 'cho'; tlTrieu.t = 0; tlTrieu.tg = 0; tTia = 0; nhatLai(); }
      datNhan();
      if (o.mayAnh) goc(o.mayAnh);
    }

    // ---------------------------------------------------------------- vật lý trong buồng
    // Một vật tròn bán kính r trong lòng buồng: gia tốc a hướng xuống (đo trong buồng), nảy ở sàn, trần, vách.
    // Trả về tốc độ va chạm lớn nhất trong bước (để phát tiếng).
    function buocVat(p, v, r, a, h, e) {
      let va = 0;
      v.y -= a * h;
      p.addScaledVector(v, h);
      if (p.y < r) {
        p.y = r;
        if (v.y < 0) { va = Math.max(va, -v.y); v.y = -v.y * e; if (v.y < 0.12 * Math.sqrt(Math.max(a, 0.01))) v.y = 0; v.x *= 0.86; v.z *= 0.86; }
      }
      if (p.y > BY - r) { p.y = BY - r; if (v.y > 0) { va = Math.max(va, v.y); v.y = -v.y * e; } }
      if (Math.abs(p.x) > BX - r) { p.x = Math.sign(p.x) * (BX - r); va = Math.max(va, Math.abs(v.x)); v.x = -v.x * e; }
      if (Math.abs(p.z) > BZ - r) { p.z = Math.sign(p.z) * (BZ - r); va = Math.max(va, Math.abs(v.z)); v.z = -v.z * e; }
      if (p.y <= r + 1e-4 && v.y === 0) { const ms = Math.exp(-2.2 * h); v.x *= ms; v.z *= ms; }
      return va;
    }

    function tuTheNguoi(P, a, cam, dt) {
      const nang = a > 0.12 * G;
      const ten = nang ? (cam ? 'gio-tay' : 'tha') : 'lo-lung';
      if (P.tuThe !== ten) {
        if (ten === 'lo-lung') { P.nguoi.datTuThe('lo-lung', { giay: 0.9 }); P.nguoi.datTay(cam ? 'cam' : null, { tay: 'trai' }); }
        else {
          P.nguoi.datTuThe(ten, { tay: 'trai', giay: 0.5 });
          if (P.tuThe === 'lo-lung' && dt > 0) P.nguoi.nhun(Math.min(1.3, 0.4 + a / G));
        }
        P.tuThe = ten; P.cam = cam;
      } else if (ten === 'lo-lung' && P.cam !== cam) { P.nguoi.datTay(cam ? 'cam' : null, { tay: 'trai' }); P.cam = cam; }
      P.lxNoi.dat(nang ? 0 : 0.14);
      P.nguoi.nhom.position.y = 0.1 + P.lxNoi.buoc(dt);
      P.lxCan.dat(nang ? (KG * a) / G : 0);
      const v = P.lxCan.buoc(dt);
      const chu = v.toFixed(1);
      if (chu !== P.soCan) { P.soCan = chu; P.can.datSo(chu); }
    }

    const _tay = new THREE.Vector3();
    const tayCuc = (P) => { P.nguoi.viTriCam(_tay, R_BONG, 'trai'); return _tay.sub(P.goc); };

    function trongBuong(P, a, dt) {
      const st = P.st;
      if (st.che === 'cam') {
        st.p.copy(tayCuc(P)); st.v.set(0, 0, 0);
        st.t += dt;
        if (st.t > 1.0) { st.che = 'roi'; st.t = 0; st.nghi = 0; st.daCham = false; st.pN.copy(st.p).add(_w.set(0.34, 0, 0)); st.vN.set(0, 0, 0); }
        else st.pN.copy(st.p).add(_w.set(0.34, 0, 0));
      } else if (st.che === 'keo') {
        if (dt > 0) { _w.copy(st.p).sub(st.pTruoc).divideScalar(dt); st.vKeo.lerp(_w, 0.35); }
        st.pTruoc.copy(st.p);
      } else if (st.che === 'nhat') {
        const tay = tayCuc(P);
        const k = 1 - Math.exp(-7 * dt);
        st.p.lerp(tay, k);
        st.pN.lerp(_w.copy(tay).add(_v.set(0.34, 0, 0)), k);
        if (st.p.distanceTo(tay) < 0.012) { st.che = 'cam'; st.t = 0; }
      }
      if (dt > 0 && (st.che === 'roi' || (st.che === 'keo' && S.haiVat))) {
        const n = Math.ceil(dt / 0.008), h = dt / n;
        let va = 0, vaN = 0;
        for (let i = 0; i < n; i++) {
          if (st.che === 'roi') va = Math.max(va, buocVat(st.p, st.v, R_BONG, a, h, 0.5));
          if (S.haiVat) vaN = Math.max(vaN, buocVat(st.pN, st.vN, R_NHE, a, h, 0.32));
        }
        if (va > 0.35) am.not({ tanSo: 150, dai: 0.32, doTo: Math.min(0.55, 0.1 + 0.17 * va), lech: P.lech, dang: 'mem' });
        if (vaN > 0.35) am.not({ tanSo: 520, dai: 0.18, doTo: Math.min(0.3, 0.05 + 0.08 * vaN), lech: P.lech, dang: 'kinh' });
        if (st.che === 'roi') {
          st.t += dt;
          st.bong = st.p.y <= R_BONG + 1e-3 && st.v.lengthSq() < 0.0025;
          st.nghi = st.bong ? st.nghi + dt : 0;
          if (!st.nguoiTha && (st.nghi > 1.3 || (a < 0.05 * G && st.t > 3.4))) st.che = 'nhat';
          P.bong.qua.rotation.z -= (st.v.x / R_BONG) * dt;
        }
      }
      tuTheNguoi(P, a, st.che === 'cam', dt);
    }

    // Nhìn từ ngoài: chiếu lại một lần thả bóng (công thức đúng của chuyển động trong buồng), rồi tua lại.
    function ngoaiBuong(P, a, dt) {
      const st = P.st;
      if (tl.pha === 'cho' && tl.tg === 0) st.daCham = false;
      if (tl.t === 0) st.p0.copy(tayCuc(P));
      const s = tl.t;
      const y = Math.max(R_BONG, st.p0.y - 0.5 * a * s * s);
      st.p.set(st.p0.x, y, st.p0.z);
      st.pN.set(st.p0.x + 0.34, Math.max(R_NHE, st.p0.y - 0.5 * a * s * s), st.p0.z);
      if (tl.pha === 'chay' && y <= R_BONG && !st.daCham && a > 0.05 * G) {
        st.daCham = true;
        am.not({ tanSo: 150, dai: 0.32, doTo: Math.min(0.55, 0.1 + 0.17 * Math.sqrt(2 * a * (st.p0.y - R_BONG))), lech: P.lech, dang: 'mem' });
      }
      tuTheNguoi(P, a, s <= 0.02 && tl.pha !== 'chay', dt);
    }

    // ---------------------------------------------------------------- âm thanh động cơ
    // Tiếng ù người trong buồng nghe qua thân tàu (ngoài không gian không có tiếng): to và gắt dần theo lực đẩy.
    const amDongCo = amKeoDai(am, 'tiengOn', { mau: 'nau', tanSoLoc: 300, doTo: 0 });
    const tatAm = () => amDongCo.tat(0.25);

    datNhan();

    const dsNhanDat = [{ nhan: nhanDat, uuTien: 60, tat: false, giu: false }, { nhan: nhanTam, uuTien: 75, tat: true, giu: false }];
    function capNhat(dt) {
      tong += dt;
      const nang = S.cheDo === 'nang', ngoai = S.ngoai;
      if (thamThu && !daThu && tong > 0.4) { daThu = true; apThu(thamThu); }
      lxK.buoc(dt); lxDat.buoc(dt); lxNenB.buoc(dt);
      tenLua.datLucDay(S.k);
      const a1 = aA(), a2 = aB();
      // dòng thời gian chiếu lại (chỉ khi nhìn từ ngoài; đứng yên khi đang kéo cần ga)
      if (ngoai && !dangKeoGa) buocTG(tl, dt, T_CHAY);
      if (!ngoai && S.trieu) buocTG(tlTrieu, dt, 2.6);
      const s = ngoai ? tl.t : 0;
      const doiA = (q) => (ngoai && !nang ? 2.6 - 0.5 * G * q * q : 0);
      const doiB = (q) => (ngoai ? lxNenB.v + 0.5 * a2 * q * q : 0);
      PA.goc.set(XA, doiA(s), 0);
      PB.goc.set(XB, doiB(s), 0);
      nhomDat.position.y = lxDat.v;
      // Khi buồng trái đứt cáp, Trái Đất tụt xuống dưới ô số liệu: đưa nhãn lên mép trên, cạnh bệ.
      const kDat = kep((Y_DAT.nang - lxDat.v) / (Y_DAT.nang - Y_DAT.roi), 0, 1);
      nhanDat.position.set(-1.2 + 3.95 * kDat, -2.15 + 2.4 * kDat, 3.2 - 2.6 * kDat);
      // Hai nhãn gần mặt đất tránh nhau: «hướng về tâm» (bước bi thử) ưu tiên hơn nhãn Trái Đất.
      dsNhanDat[1].tat = !nhanTam.visible;
      goNhanDeNhau(dsNhanDat, app.camera, app.rong, app.cao);

      // bóng và người
      if (ngoai) { ngoaiBuong(PA, a1, dt); ngoaiBuong(PB, a2, dt); }
      else { trongBuong(PA, a1, dt); trongBuong(PB, a2, dt); }
      for (const P of [PA, PB]) {
        P.bong.nhom.position.copy(P.st.p);
        P.nhe.position.copy(P.st.pN);
        P.nguoi.capNhat(dt); P.buong.capNhat(dt); P.bong.capNhat(dt);
      }
      // tay nắm đi theo quả bóng (khi không bị kéo)
      if (!ngoai) {
        for (const [P, T] of [[PA, tayA], [PB, tayB]]) if (P.st.che !== 'keo') T.dat(viTriThe(P, P.st.p.x, P.st.p.y, Z_KEO, _v));
      }
      if (!dangKeoGa) tayGa.dat(_v.set(XB + GA_X, PB.goc.y + yNumGa(lxK.v), GA_Z));
      numGa.position.set(0, yNumGa(lxK.v), 0);
      nhanGa.position.set(-0.2, yNumGa(lxK.v) + 0.02, 0.05);
      nhan1g.visible = Math.abs(lxK.v - 1) > 0.15; nhanTat.visible = lxK.v > 0.15;
      nhanGa.datChu(chuCanh("canh.can-ga-m-s", "cần ga<small>{0} m/s²</small>", [so(9.8 * lxK.v, 1)]));
      tenLua.capNhat(dt);
      traiDat.capNhat(dt);

      // tia sáng: bay ngang với tốc độ C_HINH; trong hệ buồng nó võng xuống ½·a·s²
      if (!ngoai && dt > 0) tTia = (tTia + dt) % CHU_KY_TIA;
      const tT = ngoai ? s : tTia;
      const sToi = Math.min(tT, L_TIA / C_HINH);
      const moTia = 1 - kep((tT - L_TIA / C_HINH - (ngoai ? 0.3 : 0.9)) / (ngoai ? 0.35 : 0.5), 0, 1);
      const veTia = (P, a, doi) => {
        const n = 56;
        for (let i = 0; i < n; i++) {
          const q = (sToi * i) / (n - 1);
          P.vet.dat(n - 1 - i, P.goc.x + X_DAU_TIA + C_HINH * q, Y_TIA - 0.5 * a * q * q + doi(q), Z_TIA);
        }
        P.vet.xong(n);
        P.vet.datDoMo(moTia);
        P.dauTia.position.set(P.goc.x + X_DAU_TIA + C_HINH * sToi, Y_TIA - 0.5 * a * sToi * sToi + doi(sToi), Z_TIA);
        P.dauTia.visible = sToi < L_TIA / C_HINH - 1e-3 && tT > 0.01;
        P.thang.dat(0, P.goc.x + X_DAU_TIA, P.goc.y + Y_TIA, Z_TIA); P.thang.dat(1, P.goc.x + X_TUONG, P.goc.y + Y_TIA, Z_TIA); P.thang.xong(2);
        const tSau = L_TIA / C_HINH;
        P.vong = 0.5 * a * tSau * tSau;
        const toi = sToi >= tSau - 1e-3;
        P.vetCham.visible = toi && moTia > 0.05;
        P.vetCham.position.set(X_TUONG - 0.01, Y_TIA - P.vong, Z_TIA);
        P.vetCham.material.opacity = moTia;
      };
      veTia(PA, a1, doiA);
      veTia(PB, a2, doiB);

      // bi thử: ngang co lại theo cos, dọc giãn ra theo cosh (chỉ khi buồng rơi gần Trái Đất)
      if (S.trieu) {
        const tb = ngoai ? s : tlTrieu.t;
        for (const [P, coTrieu] of [[PA, !nang], [PB, false]]) {
          const kx = coTrieu ? Math.cos(W_TRIEU * tb) : 1, ky = coTrieu ? Math.cosh(Math.SQRT2 * W_TRIEU * tb) : 1;
          P.bi[0].position.set(-X_BI * kx, Y_GIUA, Z_BI); P.bi[1].position.set(X_BI * kx, Y_GIUA, Z_BI);
          P.bi[2].position.set(0.45, Y_GIUA + DY_BI * ky, Z_BI); P.bi[3].position.set(0.45, Y_GIUA - DY_BI * ky, Z_BI);
          P.chamGoc[0].position.set(-X_BI, Y_GIUA, Z_BI); P.chamGoc[1].position.set(X_BI, Y_GIUA, Z_BI);
          P.chamGoc[2].position.set(0.45, Y_GIUA + DY_BI, Z_BI); P.chamGoc[3].position.set(0.45, Y_GIUA - DY_BI, Z_BI);
        }
        if (!nang) {
          const cy = lxDat.v - RD, yMat = lxDat.v - 0.2;
          for (let i = 0; i < 2; i++) {
            const b = PA.bi[i].position;
            const x0 = PA.goc.x + b.x, y0 = PA.goc.y + b.y;
            const f = (y0 - yMat) / (y0 - cy);
            huongTam[i].dat(0, x0, y0, Z_BI); huongTam[i].dat(1, x0 + (XA - x0) * f, yMat, Z_BI * (1 - f)); huongTam[i].xong(2);
          }
          nhanTam.position.set(XA, lxDat.v + 0.35, 1.6);
        }
      }

      // mũi tên, dây cáp, nhãn
      if (nang) muiG.dat(XA - 1.95, 3.05 + PA.goc.y, 0.6, XA - 1.95, 1.35 + PA.goc.y, 0.6);
      else muiG.nhom.visible = false;
      nhanMuiG.position.set(XA - 2.1, 2.2 + PA.goc.y, 0.6);
      const kv = Math.max(0, lxK.v);
      muiA.dat(XB + 2.55, 1.3 + PB.goc.y, 0.75, XB + 2.55, 1.3 + 1.7 * Math.min(kv, 1.5) + PB.goc.y, 0.75);
      muiA.nhom.visible = kv > 0.03;
      nhanMuiA.visible = kv > 0.03;
      nhanMuiA.position.set(XB + 2.7, 1.5 + 1.7 * Math.min(kv, 1.5) + PB.goc.y, 0.75);
      const coCap = !nang;
      capTren.line.visible = capDuoi.line.visible = coCap;
      if (coCap) {
        const yCat = ngoai ? 10.5 : 7.4;
        capTren.dat(0, XA, 16, 0); capTren.dat(1, XA, yCat, 0); capTren.xong(2);
        capDuoi.dat(0, XA, 4.16 + PA.goc.y, 0); capDuoi.dat(1, XA, 4.85 + PA.goc.y, 0); capDuoi.xong(2);
      }
      nhanA.position.set(XA, 4.85 + PA.goc.y, 0);
      nhanB.position.set(XB + 1.75, 6.2 + PB.goc.y, 0);
      canA.position.set(XA - 0.55, -0.5 + PA.goc.y, 1.7);
      canB.position.set(XB + 0.45, -0.62 + PB.goc.y, 2.5);
      canA.datChu(chuCanh("canh.can-chi-kg", "cân chỉ {0} kg", [so(PA.lxCan.v, 1)]));
      canB.datChu(chuCanh("canh.can-chi-kg", "cân chỉ {0} kg", [so(PB.lxCan.v, 1)]));

      // tiếng động cơ: chỉ khi động cơ chạy và hình đang chạy
      if (dt > 0 && kv > 0.01) amDongCo.dat({ tanSoLoc: 170 + 520 * Math.min(kv, 1.5), doTo: Math.min(0.42, 0.24 * kv), lech: 0.4 }, 0.08);
      else amDongCo.dat({ doTo: 0 }, 0.08);
    }

    // Trạng thái dựng sẵn để chụp ảnh và kiểm thử thách (chỉ khi app.imLang).
    function apThu(ten) {
      if (ten === 'ga1') datGa(1, false);
      else if (ten === 'ga05') datGa(0.5, false);
      else if (ten === 'bong' || ten === 'keo') {
        for (const P of [PA, PB]) {
          const st = P.st;
          st.p.set(0.3, ten === 'keo' ? 3.1 : 2.3, Z_KEO - P.goc.z); st.v.set(0, 0, 0);
          st.che = ten === 'keo' ? 'keo' : 'roi'; st.nguoiTha = true; st.t = 0; st.pTruoc.copy(st.p);
        }
      }
    }

    function hud() {
      const nang = S.cheDo === 'nang';
      const d = [
        [chuCanh("canh.buong-trai", "Buồng trái"), nang ? chuCanh("canh.dung-yen-tren-mat-dat-bong-roi-9", "đứng yên trên mặt đất: bóng rơi 9,8 m/s²") : chuCanh("canh.roi-tu-do-bong-lo-lung", "rơi tự do: bóng lơ lửng")],
        [chuCanh("canh.ten-lua", "Tên lửa"), S.k > 0.02 ? chuCanh("canh.tang-toc-m-s-can-chi-kg", "tăng tốc {0} m/s²: cân chỉ {1} kg", [so(9.8 * lxK.v, 1), so(PB.lxCan.v, 1)]) : chuCanh("canh.dong-co-tat-khong-trong-luong", "động cơ tắt: không trọng lượng")],
        [chuCanh("canh.tia-sang-vong-tren-hinh", "Tia sáng võng (trên hình)"), chuCanh("canh.trai-phai", "trái {0} · phải {1}", [so(PA.vong ?? 0, 2), so(PB.vong ?? 0, 2)])],
        [chuCanh("canh.goc-nhin", "Góc nhìn"), S.ngoai ? chuCanh("canh.tu-ben-ngoai-dung-yen-so-voi-thuoc", "từ bên ngoài (đứng yên so với thước mốc)") : chuCanh("canh.tu-trong-buong", "từ trong buồng")],
      ];
      if (S.trieu) d.push([chuCanh("canh.bi-thu", "Bi thử"), nang ? chuCanh("canh.chi-co-y-nghia-khi-buong-roi-tu", "chỉ có ý nghĩa khi buồng rơi tự do") : chuCanh("canh.luc-thuy-trieu-phong-dai-hang-trieu-lan", "lực thủy triều phóng đại hàng triệu lần")]);
      // Lời dặn «hình đã làm chậm» nằm ở hộp «Lưu ý» của bước 1, không lặp ở ô số liệu.
      return d;
    }

    // Cho thử thách: có quả bóng nào người học thả ra mà đang lơ lửng yên giữa buồng không trọng lượng?
    function bongLoLung() {
      if (S.ngoai) return false;
      for (const [P, a] of [[PA, aA()], [PB, aB()]]) {
        const st = P.st;
        if (st.che === 'roi' && st.nguoiTha && a < 0.03 * G && st.p.y > 1 && st.v.length() < 0.12) return true;
      }
      return false;
    }

    return {
      scene, capNhat, hud, cauHinh, goc, tatAm, bongLoLung,
      ga: () => lxK.v, gaDich: () => S.k,
      huy() { tatAm(); denCanh.huy(); },
    };
  },
};
