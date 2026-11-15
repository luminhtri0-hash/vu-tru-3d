// Lời giảng tiếng Việt là bản gốc. Các thao tác gọi trực tiếp mô hình của bài.
export default {
  "ten": "Bức xạ Hawking và nhiệt độ của lỗ đen",
  "moTa": "Đổi khối lượng, đọc nhiệt độ, dò phổ và so lỗ đen với môi trường xung quanh.",
  "yChinh": "Trường lượng tử trên nền không-thời gian của một lỗ đen hình thành do suy sụp cho một thông lượng bức xạ ở xa. Lỗ đen Schwarzschild càng nhẹ thì nhiệt độ Hawking càng cao.",
  "giaiThich": "Hình cầu đen đánh dấu chân trời của lỗ đen không quay và không mang điện. Các điểm màu ngoài cầu minh họa thông lượng. Biểu đồ cho dạng phổ vật đen lý tưởng theo tần số, với trục ngang không thứ nguyên. Độ lớn và nhịp hình được phóng để dễ nhìn.",
  "conSo": [
    "Một lỗ đen khối lượng bằng Mặt Trời có nhiệt độ khoảng 6,17 × 10⁻⁸ K.",
    "Trong nền photon 2,725 K, khối lượng cho cùng nhiệt độ xấp xỉ 4,5 × 10²² kg."
  ],
  "hieuDung": "Hình cặp hạt ảo không cung cấp quỹ đạo của các hạt trong lời giải Hawking. Lời giải dùng các mode của trường trên không-thời gian cong. Các dấu ở ngoài chân trời trong hình chỉ giúp quan sát dòng năng lượng đã dự đoán.",
  "nguon": "Trí Lữ soạn. S. W. Hawking, Particle Creation by Black Holes, Communications in Mathematical Physics 43 (1975), 199–220. B. J. Carr, K. Kohri, Y. Sendouda và J. Yokoyama, Physical Review D 81 (2010), 104019. NIST, giá trị hằng số CODATA 2022.",
  "baiGiang": {
    "mucTieu": [
      "Tính nhiệt độ của lỗ đen Schwarzschild theo khối lượng.",
      "Nhận diện các giả thiết khi dùng phổ, công suất và thời gian bay hơi lý tưởng.",
      "Giải thích chiều trao đổi năng lượng giữa lỗ đen và bể photon."
    ],
    "buoc": [
      {
        "ten": "Từ chân trời tới người quan sát ở xa",
        "noiDung": "Ở Bài 15, ánh sáng từ bên trong chân trời không thể ra ngoài. Ở đây vẫn dùng cùng hình học Schwarzschild, nhưng đặt một trường lượng tử trên nền hình học ấy. Sau suy sụp, trạng thái chân không ban đầu có thể cho một dòng lượng tử ra xa khi phân tích các mode ở thời gian muộn.\n\n$$r_s=2GM/c^2$$\n\n+++ Đi sâu\nThử đổi sang khối lượng Mặt Trời. Số đo bán kính trong bảng là giá trị vật lý, xấp xỉ 2,95 km. Đường viền trên hình được nén theo logarit để nhiều khối lượng cùng lọt vào màn hình. Các chấm minh họa thông lượng ngoài chân trời. Đừng dùng khoảng cách giữa hai điểm sáng để suy ra tần số thật. Nhiệt độ và phổ trong bảng mới là các đại lượng gắn với phép đo ở xa.\n+++\n\n> [Hiểu sai thường gặp] Lời kể quen thuộc: «sát chân trời, chân không liên tục sinh cặp hạt ảo; một hạt rơi vào, hạt kia bay ra». Chính Hawking dùng hình ảnh này để kể cho dễ hình dung, nhưng phép tính thật không theo dõi quỹ đạo của cặp hạt nào. Nó so cách chia trường lượng tử thành các mode trước khi lỗ đen hình thành và rất lâu sau đó. Bật hình cặp hạt để xem lời kể ấy; đừng đọc nó như chuyển động thật.\n\n> [Thử ngay] [[Chọn khối lượng Mặt Trời|thu]] [[Bật hoặc tắt hình cặp hạt|cap]]",
        "vao": (c) => c.buoc(0),
        "nut": {
          "thu": (c) => c.lenh("sao"),
          "cap": (c) => c.lenh("cap")
        }
      },
      {
        "ten": "Khối lượng quyết định nhiệt độ",
        "noiDung": "Một lỗ đen đứng yên, không quay, không điện tích có {{nhiệt độ Hawking}} chỉ phụ thuộc khối lượng. Đây là nhiệt độ suy ra từ phổ ở rất xa lỗ đen. Người ở gần trong một trường hấp dẫn mạnh không dùng cùng một đồng hồ và cùng một cách hiệu chuẩn năng lượng.\n\n$$T_H=\\hbar c^3/(8\\pi G M k_B)$$\n\n+++ Đi sâu\nTrong công thức, ħ nối với vật lý lượng tử, G nối với hấp dẫn và k_B đổi năng lượng thành nhiệt độ. Bấm tăng gấp đôi M và nhìn bán kính tăng, nhiệt độ giảm. Âm cao minh họa nhiệt độ cao hơn bằng phép quy đổi để tai nghe được. So hai lần đọc tại cùng một nơi giúp tách ảnh hưởng của khối lượng khỏi ảnh hưởng của vị trí quan sát. Giữ nguyên quy ước người quan sát ở xa khi đọc toàn bộ bài.\n+++\n\n> [Thử ngay] [[Tăng gấp đôi M|thu]]",
        "vao": (c) => c.buoc(1),
        "nut": {
          "thu": (c) => c.lenh("gap")
        }
      },
      {
        "ten": "Một thước cho nhiều bậc độ lớn",
        "noiDung": "Kéo núm khối lượng ra xa phía phải làm giá trị tăng theo lũy thừa của mười. Vì bán kính tỉ lệ với M còn T tỉ lệ với nghịch đảo M, tích của hai đại lượng này không đổi. Đây là cách so hai phép đo mà không cần biết trước khối lượng.\n\n$$T_H r_s=\\hbar c/(4\\pi k_B)$$\n\n+++ Đi sâu\nMột lỗ đen giả định khối lượng 10¹² kg nóng khoảng 1,23 × 10¹¹ K. Độ nóng này lớn vì bán kính chân trời rất nhỏ. Mô hình chỉ thay tham số. Nó không mô phỏng một thiên thể thực đang bị nén từ khối lượng này sang khối lượng khác. Một phép kiểm nhanh là kéo tăng khối lượng rồi thử dự đoán nhiệt độ sẽ tăng hay giảm trước khi nhìn bảng số liệu. Khi suy luận cần dùng giá trị khối lượng thật của mỗi lần đặt.\n+++\n\n> [Thử ngay] [[So với lỗ đen 10¹² kg|thu]]",
        "vao": (c) => c.buoc(2),
        "nut": {
          "thu": (c) => c.lenh("nho")
        },
        "thuThach": {
          "de": "Kéo khối lượng tới gần 10²² kg, sai số dưới khoảng 8%.",
          "goiY": "Theo dõi số mũ trên thước.",
          "giu": 0.4,
          "kiem": (c) => c.dat("com")
        }
      },
      {
        "ten": "Dò đỉnh của phổ",
        "noiDung": "Mỗi cột xanh cho biết công suất bức xạ trong một khoảng tần số hẹp. Chọn tọa độ x bằng năng lượng photon chia cho k_B T. Bằng cách dùng x, ta vẽ được một đường chung cho mọi nhiệt độ của vật đen lý tưởng.\n\n$$x=h\\nu/(k_BT),\\qquad B_\\nu\\propto x^3/(e^x-1)$$\n\n+++ Đi sâu\nĐỉnh theo tần số ở x ≈ 2,821. Khi khối lượng giảm, tần số ở đỉnh tăng dù đỉnh trên trục không thứ nguyên vẫn đứng yên. Nếu đổi sang mật độ công suất theo bước sóng, cả trục và phần tử khoảng đo đều đổi nên đỉnh có giá trị khác. Nút đầu dò làm sáng một điểm trên đường đang khảo sát. Hãy dời đầu dò qua hai phía đỉnh thay vì chỉ tìm cột cao nhất rồi ghi số.\n+++\n\n> [Thử ngay] [[Đặt đầu dò vào đỉnh|thu]]",
        "vao": (c) => c.buoc(3),
        "nut": {
          "thu": (c) => c.lenh("dinh")
        },
        "thuThach": {
          "de": "Kéo đầu dò tới đỉnh phổ, sai lệch x dưới 0,075.",
          "goiY": "Thử gần x = 2,8 rồi so độ cao hai phía.",
          "giu": 0.4,
          "kiem": (c) => c.dat("pho")
        }
      },
      {
        "ten": "Từ nhiệt độ tới công suất",
        "noiDung": "Lấy diện tích chân trời và giả định nó có công suất photon như một vật đen lý tưởng. Nhân diện tích với σT⁴ cho công suất trên bảng. Đây là một phép ước lượng có chủ ý, thuận tiện cho việc theo dõi sự phụ thuộc vào khối lượng.\n\n$$P_{\\rm id}=4\\pi r_s^2\\sigma T_H^4\\propto M^{-2}$$\n\n+++ Đi sâu\nTăng M lên hai lần làm diện tích tăng bốn lần nhưng T⁴ giảm mười sáu lần. Công suất còn một phần tư. Trong bài toán trường thực, thế tán xạ quanh lỗ đen cho hệ số truyền phụ thuộc tần số và spin, thường gọi là hệ số vật xám. Vì vậy bảng công suất được ghi rõ là lý tưởng. Muốn chuyển sang tính phát xạ thực, còn phải cho biết những trường hạt nào được kích thích ở nhiệt độ đang xét.\n+++\n\n> [Thử ngay] [[So công suất khi gấp đôi M|thu]]",
        "vao": (c) => c.buoc(4),
        "nut": {
          "thu": (c) => c.lenh("gap")
        }
      },
      {
        "ten": "Đặt trong một bể photon",
        "noiDung": "Chọn nền lý tưởng 2,725 K, gần nhiệt độ bức xạ nền vi sóng vũ trụ hôm nay. Lỗ đen vừa hấp thụ photon đến vừa phát photon. Hướng trao đổi ròng phụ thuộc bên nào nóng hơn. Khi bằng nhiệt độ, hai hướng cân bằng trong mô hình này. Khối lượng cân bằng khoảng 4,5 × 10²² kg, chừng sáu phần mười khối lượng Mặt Trăng, nhưng chân trời của nó chỉ rộng khoảng 0,07 mm.\n\n$$T_H(M_{\\rm eq})=T_{\\rm bath}$$\n\n+++ Đi sâu\nMột lỗ đen khối lượng Mặt Trời lạnh hơn nền rất nhiều. Nó vẫn có nhiệt độ Hawking dù dòng trao đổi ròng mang năng lượng vào. Để thử tính cân bằng ở đây, giữ nền bật và điều chỉnh M cho đến khi hai nhiệt độ bằng nhau. Cân bằng này không bền. Nếu lỗ đen nhận thêm một chút khối lượng, nó lạnh đi, hút ròng nhiều hơn, nặng thêm và càng lạnh. Nếu mất một chút, nó nóng lên, phát ròng, nhẹ đi và càng nóng. Lý do là lỗ đen có nhiệt dung âm: mất năng lượng thì nóng lên, ngược với một vật thường.\n+++\n\n> [Thử ngay] [[Bật hoặc tắt bể photon|thu]]",
        "vao": (c) => c.buoc(5),
        "nut": {
          "thu": (c) => c.lenh("nen")
        },
        "thuThach": {
          "de": "Giữ nền bật và kéo M sao cho T_H sai khác 2,725 K dưới 9%.",
          "goiY": "M mục tiêu gần 4,5 × 10²² kg.",
          "giu": 0.4,
          "kiem": (c) => c.dat("nen")
        }
      },
      {
        "ten": "Thời gian bay hơi lý tưởng",
        "noiDung": "Đặt lỗ đen trong chân không và dùng công suất lý tưởng của bước trước. Năng lượng mất đi bằng khối lượng mất đi nhân c². Vì công suất tăng khi M giảm, lấy tổng năng lượng ban đầu chia cho công suất ban đầu sẽ cho thời gian dài gấp ba đáp số đúng.\n\n$$\\frac{dM}{dt}=-\\frac{P_{\\rm id}}{c^2},\\qquad t_{\\rm id}=\\frac{5120\\pi G^2M_0^3}{\\hbar c^4}$$\n\n> [Ví dụ] Lỗ đen khối lượng Mặt Trời phát công suất photon lý tưởng chỉ khoảng 9 × 10⁻²⁹ W và cần khoảng 2 × 10⁶⁷ năm để bốc hơi hết, lâu hơn tuổi vũ trụ (1,38 × 10¹⁰ năm) hơn 10⁵⁷ lần. Theo cùng công thức, lỗ đen chỉ khoảng 1,7 × 10¹¹ kg mới bốc hơi hết trong 13,8 tỉ năm. Tính đủ các loại hạt và hệ số vật xám, các tính toán chi tiết cho con số cỡ 5 × 10¹¹ kg (Carr và cộng sự, 2010).\n\n+++ Đi sâu\nTích phân M² dM từ khối lượng đầu xuống không cho quy luật lập phương. Gấp đôi khối lượng làm tuổi thọ lý tưởng tăng tám lần. Ngoại suy đến không nằm ngoài miền đáng tin của mô tả bán cổ điển. Đọc kết quả theo giả thiết ban đầu. Một lỗ đen thực có thể hấp thụ khí hoặc bức xạ, quay và phát thêm các loại hạt. Mỗi yếu tố sẽ thay đổi diễn tiến.\n+++\n\n> [Thử ngay] [[Đối chiếu tuổi thọ khi M gấp đôi|thu]]",
        "vao": (c) => c.buoc(6),
        "nut": {
          "thu": (c) => c.lenh("gap")
        }
      },
      {
        "ten": "Ranh giới của mô hình",
        "noiDung": "Tính nhiệt độ nói trên bằng cách lượng tử hóa trường vật chất trên một hình học cổ điển. Trong quá trình bốc hơi chậm, ta lần lượt dùng những lỗ đen có khối lượng hơi khác nhau. Xấp xỉ này có cơ sở khi năng lượng của một lượng tử điển hình nhỏ so với toàn bộ năng lượng của lỗ đen.\n\n$$k_BT_H/(Mc^2)=\\hbar c/(8\\pi G M^2)$$\n\n+++ Đi sâu\nGần khối lượng Planck, sự thay đổi hình học và hấp dẫn lượng tử trở nên thiết yếu. Các chấm trong cảnh là minh họa thống kê, và công thức tuổi thọ không xác định được kết cục cuối cùng của lỗ đen. Khi thay đổi khối lượng, tự hỏi đại lượng nào đến trực tiếp từ nhiệt độ Hawking và đại lượng nào cần thêm giả thiết vật đen hoàn hảo. Câu trả lời quyết định nên hiểu chính xác đến đâu các cột công suất và tuổi thọ.\n+++\n\n> [Thử ngay] [[Trở về thang khối lượng sao|thu]]",
        "vao": (c) => c.buoc(7),
        "nut": {
          "thu": (c) => c.lenh("sao")
        }
      }
    ],
    "congThuc": [
      {
        "ten": "Nhiệt độ Hawking của lỗ đen Schwarzschild",
        "tex": "T_H=\\frac{\\hbar c^3}{8\\pi G M k_B}",
        "y": "Nhiệt độ gán cho phổ do người ở xa đo."
      },
      {
        "ten": "Công suất vật đen lý tưởng",
        "tex": "P_{\\rm id}=\\frac{\\hbar c^6}{15360\\pi G^2M^2}",
        "y": "Chỉ xét photon, dùng diện tích chân trời."
      },
      {
        "ten": "Thời gian bay hơi lý tưởng",
        "tex": "t_{\\rm id}=\\frac{5120\\pi G^2 M_0^3}{\\hbar c^4}",
        "y": "Tích phân công suất photon vật đen tới M = 0, bỏ hấp thụ ngoài."
      }
    ],
    "cauHoi": [
      {
        "hoi": "Cùng điều kiện chân không, khối lượng giảm một nửa. T thay đổi thế nào?",
        "chon": [
          "Tăng đôi",
          "Giảm nửa",
          "Không đổi"
        ],
        "dung": 0,
        "giai": "Nhiệt độ tỉ lệ nghịch với khối lượng."
      },
      {
        "hoi": "Lỗ đen lạnh hơn bể photon ở xung quanh. Dòng năng lượng ròng hướng nào?",
        "chon": [
          "Ra khỏi lỗ đen",
          "Vào lỗ đen"
        ],
        "dung": 1,
        "giai": "Trong bể đồng nhất lý tưởng, hấp thụ thắng phát xạ khi nhiệt độ bể cao hơn."
      },
      {
        "hoi": "Khối lượng tăng gấp đôi. Trong mô hình vật đen, công suất bằng bao nhiêu lần ban đầu?",
        "chon": [
          "Một phần tư",
          "Hai lần",
          "Tám lần"
        ],
        "dung": 0,
        "giai": "Các yếu tố diện tích và T⁴ gộp lại cho công suất tỉ lệ nghịch với M²."
      },
      {
        "hoi": "Khi nhiệt độ tăng, vì sao đỉnh trên trục x vẫn đứng yên?",
        "chon": [
          "Đỉnh theo tần số không đổi",
          "x đã chia năng lượng photon cho k_B T"
        ],
        "dung": 1,
        "giai": "Đỉnh x cố định tương ứng với tần số thật tỉ lệ thuận với nhiệt độ."
      },
      {
        "hoi": "Mô hình ngoại suy M về không. Vì sao điều đó chưa xác định trạng thái cuối cùng?",
        "dap": "Ở khối lượng rất nhỏ, năng lượng một lượng tử không còn là nhiễu nhỏ và hình học cổ điển cho sẵn không còn là nền đáng tin. Cần mô tả hấp dẫn lượng tử cho miền cuối đó."
      }
    ],
    "thuatNgu": [
      {
        "vi": "nhiệt độ Hawking",
        "en": "Hawking temperature",
        "nghia": "Nhiệt độ đặc trưng cho bức xạ lượng tử của lỗ đen đối với người quan sát ở xa."
      }
    ],
    "docThem": [
      "Hawking (1975), Particle Creation by Black Holes. https://doi.org/10.1007/BF02345020",
      "NIST, CODATA 2022, hằng số vật lý cơ bản. https://physics.nist.gov/cuu/Constants/"
    ]
  }
};
