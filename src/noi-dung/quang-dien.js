// Lời giảng gốc. Số liệu minh hoạ dùng catốt có công thoát giả định.
export const baiQuangDien = {
  "ten": "Hiệu ứng quang điện: đo năng lượng của ánh sáng",
  "moTa": "Đổi màu chùm sáng, đếm electron và dùng điện áp hãm để đo động năng.",
  "yChinh": "Ánh sáng truyền năng lượng theo lượng tử. Với một bề mặt cho trước, tần số quyết định động năng cực đại của electron bật ra. Tăng số photon tới mỗi giây làm thay đổi số lần phát xạ.",
  "giaiThich": "Ánh sáng truyền năng lượng theo lượng tử. Với một bề mặt cho trước, tần số quyết định động năng cực đại của electron bật ra. Tăng số photon tới mỗi giây làm thay đổi số lần phát xạ.",
  "hieuDung": "Một electron bật ra có thể mất năng lượng trong kim loại. Mô hình theo dõi những electron nhanh nhất, bay vuông góc hai bản, để xác định thế hãm. Hình cầu biểu diễn sự kiện hấp thụ và chuyển động ở thang minh họa.",
  "nguon": "Trí Lữ · OpenStax, University Physics, Vol. 3, §6.2 · NIST CODATA 2022.",
  "baiGiang": {
    "mucTieu": [
      "Tìm tần số ngưỡng của một catốt bằng cách thay đổi tần số.",
      "Phân biệt tác dụng của số photon tới và năng lượng của từng photon.",
      "Suy ra động năng cực đại và công thoát từ điện áp hãm."
    ],
    "buoc": [
      {
        "ten": "Theo một lần hấp thụ",
        "noiDung": "Một xung sáng đi từ nguồn tới tấm kim loại. Khi một electron tới bản thu, máy phát một tiếng tách. Hãy theo dõi một xung từ đầu đến cuối. Chấm màu ở ngoài tấm kim loại biểu diễn electron; xung đi tới catốt biểu diễn một photon. Electron đã có sẵn trong kim loại trước khi hấp thụ ánh sáng.\n\nHãy phân biệt hai bộ đếm. Con số ở nguồn tăng ngay khi một photon xuất phát, trong khi số ở bản thu chỉ tăng sau khi một electron vượt hết khoảng trống. Khoảng chờ trên hình là thời gian bay minh họa, không phải độ trễ tích năng lượng của electron bên trong kim loại.\n\n$$E_\\gamma=hf$$\n\n+++ Đi sâu · Theo một lần hấp thụ\n\n$E_\\gamma$ là năng lượng một photon, $f$ là tần số ánh sáng và $h$ là hằng số Planck. Cả chùm có thể mang nhiều năng lượng, nhưng một electron trong thí nghiệm một photon mỗi lần hấp thụ chỉ nhận trọn năng lượng của đúng một photon, tức một lượng tử $hf$.\n\n+++\n\n> [Thử ngay] [[Phát một photon|mot]]"
      },
      {
        "ten": "Mỗi photon mang bao nhiêu năng lượng?",
        "noiDung": "Bước này mở với ánh sáng màu cam, khoảng 500 THz. Đổi sang ánh sáng có tần số cao hơn. Thang màu của nguồn giúp nhận biết sự thay đổi; ở ngoài miền nhìn thấy, màu tím là màu minh họa. Đại lượng cần đọc là tần số trên thanh chỉnh. Tần số càng lớn, mỗi photon càng mang nhiều năng lượng. Bước sóng trong chân không khi đó ngắn hơn.\n\nHãy nhìn điểm vàng trên đồ thị trước và sau khi đổi màu. Trục ngang ghi tần số của nguồn, trục đứng ghi động năng lớn nhất còn lại khi electron đã ra ngoài kim loại. Đó là hai đại lượng có thể đo độc lập. Không nên lấy độ sáng của chấm trên màn hình để đo năng lượng photon.\n\n$$\\lambda=c/f$$\n\n+++ Đi sâu · Mỗi photon mang bao nhiêu năng lượng?\n\nỞ $600\\,\\mathrm{THz}$, một photon mang khoảng $2{,}48\\,\\mathrm{eV}$, và bước sóng gần $500\\,\\mathrm{nm}$. Đơn vị electronvolt là năng lượng điện tích nguyên tố nhận được khi đi qua hiệu điện thế một volt.\n\n+++\n\n> [Thử ngay] [[Chọn 600 THz|chon]]"
      },
      {
        "ten": "Một ngưỡng cho mỗi bề mặt",
        "noiDung": "Ở thiết lập này, photon tới catốt nhưng bản thu im lặng. Kim loại giữ electron bằng một hàng rào năng lượng. Công thoát là năng lượng nhỏ nhất cần để đưa một electron từ mức Fermi ra ngoài bề mặt. Ngay dưới ngưỡng, tăng số photon đến vẫn không giải phóng electron trong mô hình một photon.\n\nHãy tăng thông lượng nhưng giữ tần số dưới ngưỡng rồi nhìn bộ đếm ở bản thu. Sau đó chỉ tăng tần số qua ngưỡng. Hai phép thử này giúp phân biệt một nguyên nhân do năng lượng của từng photon với một nguyên nhân do tổng năng lượng chùm gửi tới trong cả giây.\n\n$$f_0=\\frac{W}{h}$$\n\n+++ Đi sâu · Một ngưỡng cho mỗi bề mặt\n\nCatốt mô phỏng có công thoát $W=2\\,\\mathrm{eV}$. Tần số ngưỡng là khoảng $484\\,\\mathrm{THz}$. Ở đúng ngưỡng, mô hình cho động năng cực đại bằng không; phải tăng tần số thêm mới có electron bay qua khe.\n\n+++\n\n> [Thử ngay] [[Thử dưới ngưỡng|thu]]",
        "thuThach": {
          "de": "Kéo núm tần số tới vùng vừa phát electron với động năng cực đại từ 0,03 đến 0,09 eV.",
          "goiY": "Tìm ngưỡng của catốt 2 eV rồi tăng tần số thêm một ít."
        }
      },
      {
        "ten": "Tăng thông lượng ở cùng một tần số",
        "noiDung": "Giữ nguyên tần số và nhìn số chớp đến catốt. Khi gấp đôi thông lượng, trong cùng một khoảng thời gian sẽ có gấp đôi số photon tới. Nếu xác suất giải phóng và thu nhận không đổi, dòng quang điện tăng tương ứng. Màu và động năng cực đại của từng electron vẫn như trước.\n\nTrong phép so sánh này, giữ điện áp hãm bằng không để điện trường không loại bớt electron. Nếu đếm trong hai khoảng thời gian không bằng nhau, số đếm thô không dùng để so cường độ dòng; cần lấy số electron thu được chia cho thời gian quan sát.\n\n$$I=e\\eta\\dot N_\\gamma$$\n\n+++ Đi sâu · Tăng thông lượng ở cùng một tần số\n\nTrong biểu thức ở trên, $I$ là dòng bão hòa, $e$ là độ lớn điện tích electron, $\\eta$ là hiệu suất lượng tử và $\\dot N_\\gamma$ là số photon tới mỗi giây. Trong ống thật, dòng bão hòa được đo khi bản thu có điện thế cao hơn catốt một chút để hút hết electron; ở đây điện áp bằng không và mọi electron mô hình đều bay thẳng tới bản thu. Nhịp tách minh họa tốc độ thu hạt. Khi dày sự kiện, chỉ một phần số tách được phát.\n\n+++\n\n> [Thử ngay] [[Gấp đôi thông lượng|doi]]"
      },
      {
        "ten": "Sổ năng lượng của electron nhanh nhất",
        "noiDung": "Photon truyền năng lượng cho electron. Muốn vượt khỏi bề mặt, electron phải dùng một phần năng lượng đó cho công thoát. Đối với electron nhanh nhất, phần còn lại là động năng cực đại. Các electron đi sâu trong vật liệu có thể mất thêm năng lượng trước khi thoát.\n\nTrên đồ thị, điểm vàng chạy dọc đường của catốt đang chọn. Một phần năng lượng photon dùng để đưa electron qua bề mặt ngay cả khi không mắc điện áp ngoài. Vì vậy không thể lấy toàn bộ năng lượng photon làm động năng của electron sau hấp thụ.\n\n$$K_{\\max}=hf-W\\quad (f\\ge f_0)$$\n\n+++ Đi sâu · Sổ năng lượng của electron nhanh nhất\n\nVới catốt $W=2\\,\\mathrm{eV}$ và nguồn $600\\,\\mathrm{THz}$, động năng cực đại gần $0{,}48\\,\\mathrm{eV}$. Nếu tăng tần số lên $800\\,\\mathrm{THz}$ mà vẫn dùng catốt ấy, kết quả gần $1{,}31\\,\\mathrm{eV}$. Khoảng chênh là do năng lượng photon tăng.\n\n+++\n\n> [Thử ngay] [[Đổi từ 600 lên 800 THz|tang]]"
      },
      {
        "ten": "Dùng điện trường để hãm electron",
        "noiDung": "Bản thu được đặt ở điện thế thấp hơn catốt. Điện trường làm electron chậm dần khi nó hướng về bản thu. Tăng độ lớn điện áp hãm để quan sát electron dừng rồi quay về. Hạ điện áp xuống, nó lại tới được bản thu.\n\nHãy nhìn vị trí quay đầu thay vì chỉ nhìn đồng hồ đếm. Với điện trường đều, công của lực điện tích lũy theo quãng đường đã đi. Điện áp càng lớn, electron càng sớm dùng hết động năng. Nhịp tách mất khi electron không tới được điện cực nhận.\n\n$$eU_s=K_{\\max}$$\n\n+++ Đi sâu · Dùng điện trường để hãm electron\n\nĐiện trường lấy đi năng lượng $eU$ khi electron vượt hết khe. Khi phần năng lượng đó bằng động năng nhanh nhất ban đầu, dòng thu vừa triệt tiêu. Với động năng tính bằng electronvolt, trị số thế hãm tính bằng volt bằng đúng trị số động năng.\n\n+++\n\n> [Thử ngay] [[Đặt điện áp hãm 0,30 V|ham]]",
        "thuThach": {
          "de": "Kéo điện áp hãm sao cho electron quay lại khi đã qua 75–85% quãng đường tới bản thu.",
          "goiY": "Quãng đường lớn nhất chia cho bề rộng khe bằng động năng ban đầu (eV) chia điện áp hãm (V)."
        }
      },
      {
        "ten": "Thay catốt mà giữ nguyên nguồn",
        "noiDung": "Chọn catốt giả định có công thoát lớn hơn. Cùng một photon có thể đủ năng lượng giải phóng electron ở bề mặt này và thiếu năng lượng ở bề mặt kia. Vì vậy một bảng ghi tần số ngưỡng chỉ có ý nghĩa khi đi kèm vật liệu và trạng thái bề mặt.\n\nĐường đang chọn được làm nổi trên đồ thị; hai đường mờ cho thấy hai catốt còn lại. Mỗi đường chỉ được vẽ từ ngưỡng phát xạ tương ứng. Phần kéo dài tưởng tượng tới giá trị âm chỉ phục vụ việc tìm công thoát; ở đó không có electron bay ra với động năng âm.\n\n$$K_{\\max}=hf-W\\quad (f\\ge f_0)$$\n\n+++ Đi sâu · Thay catốt mà giữ nguyên nguồn\n\nỞ $800\\,\\mathrm{THz}$, đổi công thoát từ $W=2\\,\\mathrm{eV}$ thành $W=3\\,\\mathrm{eV}$ làm động năng cực đại giảm đúng $1\\,\\mathrm{eV}$, còn gần $0{,}31\\,\\mathrm{eV}$. Trên đồ thị động năng theo tần số, hai vật liệu có cùng độ dốc $h$ và có giao điểm với trục tần số khác nhau.\n\n+++\n\n> [Thử ngay] [[Chuyển sang catốt 3 eV|thay]]",
        "thuThach": {
          "de": "Kéo tần số sao cho electron của catốt 3 eV có động năng cực đại từ 0,45 đến 0,55 eV.",
          "goiY": "Cộng lại công thoát và động năng mong muốn để tìm năng lượng photon."
        }
      },
      {
        "ten": "Đọc ngược một phép đo",
        "noiDung": "Trong thí nghiệm thực, có thể đo thế hãm bằng cách chỉnh điện áp tới khi dòng quang điện mất hẳn. Lặp phép đo ở các tần số khác nhau và dùng độ dốc để suy ra hằng số Planck. Kéo dài đường thẳng, nó cắt trục đứng tại $-W$, nên tung độ gốc cho biết công thoát; còn bên dưới ngưỡng thì không có dòng phát xạ.\n\nKhi ghi kết quả, hãy ghi cả tần số, chất làm catốt và cách xác định điểm dòng vừa biến mất. Những thông tin đó cho phép người khác kiểm lại suy luận. Ở đây ta đã giả sử bề mặt sạch, ánh sáng đơn sắc và mỗi electron chỉ hấp thụ một photon.\n\n$$\\frac{\\Delta K_{\\max}}{\\Delta f}=h$$\n\n+++ Đi sâu · Đọc ngược một phép đo\n\nThử khôi phục catốt ban đầu rồi dùng các mức $600\\,\\mathrm{THz}$ và $800\\,\\mathrm{THz}$. Hiệu động năng cực đại xấp xỉ $0{,}83\\,\\mathrm{eV}$. Lấy hiệu hai đại lượng giúp loại công thoát khỏi phép tính độ dốc. Kiểu suy luận này cần ít nhất hai phép đo ở trên ngưỡng.\n\n+++\n\n> [Thử ngay] [[Trở về thí nghiệm gốc|goc]]"
      }
    ],
    "congThuc": [
      {
        "ten": "Năng lượng photon",
        "tex": "E_\\gamma=hf"
      },
      {
        "ten": "Tần số ngưỡng",
        "tex": "f_0=\\frac{W}{h}"
      },
      {
        "ten": "Phương trình Einstein",
        "tex": "K_{\\max}=hf-W\\quad (f\\ge f_0)"
      },
      {
        "ten": "Thế hãm",
        "tex": "eU_s=K_{\\max}"
      },
      {
        "ten": "Đo độ dốc",
        "tex": "\\frac{\\Delta K_{\\max}}{\\Delta f}=h"
      }
    ],
    "cauHoi": [
      {
        "hoi": "Với nguồn đơn sắc dưới ngưỡng, tăng gấp đôi số photon tới sẽ làm gì?",
        "chon": [
          "Vẫn không có quang electron",
          "Tăng gấp đôi động năng",
          "Hạ công thoát"
        ],
        "dung": 0,
        "giai": "Photon đơn lẻ vẫn thiếu năng lượng để electron vượt bề mặt."
      },
      {
        "hoi": "Hai nguồn cùng tần số chiếu vào cùng catốt, nguồn nào cho động năng cực đại lớn hơn?",
        "chon": [
          "Nguồn sáng mạnh hơn",
          "Bằng nhau",
          "Nguồn yếu hơn"
        ],
        "dung": 1,
        "giai": "Ở chế độ một photon, hiệu giữa năng lượng photon và công thoát như nhau."
      },
      {
        "hoi": "Vì sao điện áp hãm cho biết động năng cực đại?",
        "chon": [
          "Vì điện trường cản được cả electron nhanh nhất",
          "Vì nó thay công thoát",
          "Vì nó làm photon chậm lại"
        ],
        "dung": 0,
        "giai": "Dòng điện mất khi electron nhanh nhất cũng không đủ năng lượng để tới bản thu."
      },
      {
        "hoi": "Đổi catốt, đường thẳng động năng cực đại theo tần số thay đổi như thế nào?",
        "chon": [
          "Đổi độ dốc nhưng giữ ngưỡng",
          "Giữ độ dốc và đổi ngưỡng",
          "Hai đại lượng đều giữ nguyên"
        ],
        "dung": 1,
        "giai": "Độ dốc là h; phần năng lượng tiêu tốn cho công thoát phụ thuộc bề mặt."
      },
      {
        "hoi": "Tại sao đo số hạt tới mà không đo thế hãm chưa thể suy ra năng lượng từng photon?",
        "dap": "Số hạt tới phụ thuộc thông lượng và hiệu suất thu. Cần số liệu về tần số hoặc động năng để suy ra năng lượng từng photon."
      }
    ],
    "docThem": [
      "OpenStax, University Physics, Vol. 3, §6.2. https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect",
      "NIST, CODATA 2022. https://physics.nist.gov/cuu/Constants/"
    ]
  }
};
