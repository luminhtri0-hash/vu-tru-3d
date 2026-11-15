// Lời giảng tiếng Việt là bản gốc. Các thao tác gọi trực tiếp mô hình của bài.
export default {
  "ten": "Spin và thí nghiệm Stern–Gerlach",
  "moTa": "Xoay nam châm để đổi trục đo và đếm các nguyên tử ở hai cửa ra.",
  "yChinh": "Chùm nguyên tử có spin hiệu dụng ½ cho hai kết quả khi đo một thành phần spin. Góc giữa trục chuẩn bị và trục đo quyết định xác suất mỗi kết quả.",
  "giaiThich": "Lò bên trái phát nguyên tử bạc. Máy chuẩn bị gồm một nam châm nhỏ theo trục z và một tấm chắn: bịt một lỗ thì chỉ chùm +z hoặc −z đi qua, mở cả hai là hỗn hợp đều. Mũi tên vàng là hướng spin đã chuẩn bị, mũi tên đỏ cam là trục đo n của nam châm phân tích. Màn ghi giữ vết của từng nguyên tử; hai cột bên phải so tỉ lệ đếm được với xác suất lý thuyết (vạch vàng). Kích thước, độ lệch và tốc độ bay đã được phóng to hoặc làm chậm; sau máy chuẩn bị, chùm được vẽ dồn về giữa cho gọn.",
  "conSo": [
    "Góc 60° cho 75% ở cửa cộng với chùm +z.",
    "Góc 90° cho hai cửa bằng nhau, mỗi cửa 50%."
  ],
  "hieuDung": "Spin không phải là một quả cầu nhỏ đang tự quay. Nó là mômen động lượng nội tại, không ứng với vật chất nào quay quanh một trục. Hai vệt cho thấy phép đo một thành phần spin chỉ có hai kết quả; một vệt riêng lẻ không cho biết kết quả mà phép đo theo trục khác lẽ ra đã cho.",
  "nguon": "Trí Lữ soạn. W. Gerlach và O. Stern, Zeitschrift für Physik 9 (1922), 349. Feynman, Leighton và Sands, The Feynman Lectures on Physics, tập III, chương 6, Spin One-Half.",
  "baiGiang": {
    "mucTieu": [
      "Giải thích vì sao một trục đo cho hai cửa.",
      "Tính xác suất và giá trị trung bình từ góc giữa hai trục.",
      "Phân biệt hỗn hợp đều với chùm đã lọc bằng nhiều trục đo."
    ],
    "buoc": [
      {
        "ten": "Hai vệt bạc",
        "noiDung": "Chùm nguyên tử bạc trung hòa đi qua hai cực nam châm có hình khác nhau. Từ trường mạnh yếu theo vị trí tạo lực lên mômen từ. Màn ghi hai chùm tách rời, ứng với hai giá trị của thành phần spin hiệu dụng.\n\n$$S_n=\\pm\\hbar/2$$\n\n+++ Đi sâu\nLực lên nguyên tử là $F_z=\\mu_z\\,\\partial B/\\partial z$: trong từ trường đều, mômen từ chỉ bị xoay chứ không bị đẩy lệch, nên cực nam châm phải có hình khác nhau để từ trường mạnh dần về một phía. Mô hình dùng hệ hai mức, bỏ qua spin hạt nhân. Tiếng cao và thấp minh họa hai kết quả đã hiệu chuẩn. Âm thanh chỉ báo một số lần ghi nhận để các tiếng không chồng lên nhau. Hãy nhìn hai cực ở giữa bàn. Gradient từ trường làm các nhánh lệch dần, còn khoảng cách hai máy dò chỉ được vẽ để tách hình cho rõ. Ở thí nghiệm thực, độ lệch còn phụ thuộc vận tốc nguyên tử và thời gian nó ở trong vùng từ trường.\n+++\n\n> [Lịch sử] Otto Stern và Walther Gerlach làm thí nghiệm này năm 1922 ở Frankfurt, với chùm nguyên tử bạc bay qua khe hẹp của một nam châm. Trên tấm kính thu, lớp bạc đọng thành hai vệt rời nhau chứ không nhoè thành một dải liên tục. Khái niệm spin của electron chỉ ra đời năm 1925 (Uhlenbeck và Goudsmit); về sau người ta hiểu hai vệt đến từ spin của electron lẻ ở lớp ngoài cùng của nguyên tử bạc.\n\n> [Thử ngay] [[Phát chùm không phân cực|thu]]",
        "vao": (c) => c.buoc(0),
        "nut": {
          "thu": (c) => c.lenh("tron")
        }
      },
      {
        "ten": "Lọc trạng thái lên",
        "noiDung": "Chọn chùm đã ra ở cửa cộng trên trục z. Đưa nguyên tử vào máy thứ hai cùng trục sẽ cho lại cửa cộng. Việc lặp lại kết quả dựa trên trạng thái đầu đã được chọn.\n\n$$P(+z\\mid+z)=1$$\n\n+++ Đi sâu\nNếu chỉ chọn cửa trừ của máy đầu thì kết quả lặp cũng chắc chắn nhưng mang dấu trừ. Màu của cực chỉ giúp nhận ra trục đã hiệu chuẩn. Đây là thí nghiệm có điều kiện. Ta chỉ xét các hạt vượt qua bộ chuẩn bị và bỏ các hạt bị chặn từ trước. Nếu đếm cả chùm chưa lọc ngay từ lò rồi đem so với chùm đã chọn, ta đã thay đổi mẫu đang nghiên cứu.\n+++\n\n> [Thử ngay] [[Thay bằng chùm −z|thu]]",
        "vao": (c) => c.buoc(1),
        "nut": {
          "thu": (c) => c.lenh("am")
        }
      },
      {
        "ten": "Xoay trục đo",
        "noiDung": "Giữ chùm +z và xoay máy phân tích. Nếu góc giữa hai trục là θ, biên độ ở nhánh cộng là cos(θ/2). Bình phương biên độ đó cho xác suất đến cửa cộng.\n\n$$P(+)=\\cos^2(\\theta/2),\\quad P(-)=1-P(+)$$\n\n> [Ví dụ] θ = 90° cho cos²45° = ½: hai cửa ngang nhau. θ = 60° cho cos²30° = ¾: ba phần tư nguyên tử vào cửa cộng.\n\n+++ Đi sâu\nTổng hai xác suất bằng một vì mô hình coi mỗi nguyên tử đều được một trong hai máy đếm thu nhận. Vì sao phải lấy nửa góc? Hai trạng thái +z và −z chỉ hai hướng ngược nhau, lệch 180° trong không gian thường, nhưng trong không gian trạng thái chúng là hai vectơ vuông góc, chỉ «lệch 90°». Góc trong không gian thường vì thế bị chia đôi khi chuyển sang không gian trạng thái, và biên độ là cos(θ/2). Kiểm hai đầu: θ = 0 cho biên độ 1, θ = 180° cho biên độ 0.\n+++\n\n> [Thử ngay] [[Đặt máy nằm ngang|thu]]",
        "vao": (c) => c.buoc(2),
        "nut": {
          "thu": (c) => c.lenh("goc-90")
        },
        "thuThach": {
          "de": "Kéo trục đo để P(+) đạt 50%, sai số dưới 1,4 điểm phần trăm.",
          "goiY": "Thử hai trục vuông góc.",
          "giu": 0.4,
          "kiem": (c) => c.dat("can")
        }
      },
      {
        "ten": "Trung bình khác một lần đo",
        "noiDung": "Mỗi hạt vẫn đi vào một trong hai cửa. Lấy giá trị từng cửa nhân xác suất tương ứng rồi cộng lại, ta thu được một đại lượng biến đổi liên tục khi xoay nam châm.\n\n$$\\langle S_n\\rangle=(\\hbar/2)\\cos\\theta$$\n\n+++ Đi sâu\nKhi P(+) bằng ba phần tư, hiệu hai xác suất là một nửa. Trung bình thành phần spin khi đó bằng ħ/4. Nếu ai báo đã đo được ħ/4 trên một nguyên tử bằng chính thiết bị này, hãy kiểm xem con số được đọc ở đâu. Nó có thể là giá trị từ nhiều lần đo trộn cả hai nhánh. Còn một lần ghi nhận riêng chỉ ứng với một trong hai trị riêng của thành phần spin.\n+++\n\n> [Thử ngay] [[Đối chiếu cùng trục|thu]]",
        "vao": (c) => c.buoc(3),
        "nut": {
          "thu": (c) => c.lenh("goc-0")
        },
        "thuThach": {
          "de": "Kéo trục để 75% nguyên tử vào cửa cộng theo lý thuyết, sai số dưới 1,4 điểm phần trăm.",
          "goiY": "So xác suất ở 0° và 90°, rồi thử một góc ở giữa.",
          "giu": 0.4,
          "kiem": (c) => c.dat("baTu")
        }
      },
      {
        "ten": "Đổi hướng nam châm",
        "noiDung": "Quay máy nửa vòng làm đổi chỗ hai cửa trên hình. Một nguyên tử +z chắc chắn cho kết quả âm khi trục đo hướng về −z. Hãy theo dõi chỉ báo xác suất cùng với vị trí cửa thu.\n\n$$P(+;180^\\circ)=0$$\n\n+++ Đi sâu\nGiảm góc từ 180° sẽ cho tín hiệu ở cửa cộng xuất hiện trở lại. Hai vệt cho biết nhãn của máy đang dùng. Hãy tưởng tượng giữ nguyên vị trí màn rồi quay cả trục đo và hai nhãn cửa đi cùng nó. Một vết nằm trên màn chưa đủ để gọi là cộng hoặc trừ. Cần biết cực nào ứng với nhãn nào lúc phép đo được thực hiện. Đó là lý do góc và cách chuẩn bị đều phải ghi trong sổ thí nghiệm.\n+++\n\n> [Thử ngay] [[Đưa trục về 180°|thu]]",
        "vao": (c) => c.buoc(4),
        "nut": {
          "thu": (c) => c.lenh("goc-180")
        },
        "thuThach": {
          "de": "Kéo để P(+) còn 25%, sai số dưới 1,4 điểm phần trăm.",
          "goiY": "Chọn góc bù của góc cho 75%.",
          "giu": 0.4,
          "kiem": (c) => c.dat("motTu")
        }
      },
      {
        "ten": "Chuẩn bị trạng thái ngược",
        "noiDung": "Nguồn chuẩn bị −z. Với cùng một hướng nam châm, hai xác suất đổi chỗ so với nguồn +z. Chỉ dấu của giá trị trung bình đổi theo.\n\n$$P(+\\mid-z)=\\sin^2(\\theta/2)$$\n\n+++ Đi sâu\nTại trục vuông góc, hai trạng thái chuẩn bị đều cho xác suất bằng nhau. Đo theo z trên các hạt được chuẩn bị giống nhau sẽ tách bạch được hai trường hợp. Một cách kiểm là giữ nguyên hướng máy rồi lần lượt chọn hai đầu ra của bộ lọc ban đầu. Nếu thu đủ nhiều hạt tại mỗi lần đặt và hai dãy số đếm được chuẩn hóa riêng, tỉ lệ cửa cộng trong dãy thứ nhất phải khớp với tỉ lệ cửa trừ trong dãy thứ hai trong phạm vi sai số thống kê.\n+++\n\n> [Thử ngay] [[Đổi sang nguồn +z|thu]]",
        "vao": (c) => c.buoc(5),
        "nut": {
          "thu": (c) => c.lenh("duong")
        }
      },
      {
        "ten": "Hỗn hợp không phân cực",
        "noiDung": "Trộn đều hai chùm +z và −z mà không theo dõi chùm gốc. Phải lấy trung bình hai xác suất vì các nguyên tử được chuẩn bị theo hai cách khác nhau. Mọi góc đo đều cho hai cửa ngang nhau.\n\n$$P_{\\rm mix}(+)=\\tfrac12[\\cos^2(\\theta/2)+\\sin^2(\\theta/2)]=\\tfrac12$$\n\n+++ Đi sâu\nMột nguyên tử thuần +z cũng có thể chia đều ở một góc đặc biệt. Để phân biệt hai cách chuẩn bị, cần dùng nhiều hướng đo. Khác biệt nằm ở cách các lần phát được chuẩn bị. Với chùm đã lọc, mỗi nguyên tử mang cùng một trạng thái lượng tử. Với hỗn hợp, thiết bị trộn đã chọn một trong hai trạng thái cho từng nguyên tử rồi bỏ thông tin ấy. Trộn hai dãy sự kiện kiểu này làm mất dấu phân cực khi tính trung bình.\n+++\n\n> [Thử ngay] [[Thử hỗn hợp dọc z|thu]]",
        "vao": (c) => c.buoc(6),
        "nut": {
          "thu": (c) => c.lenh("goc-0")
        }
      },
      {
        "ten": "Từ dự đoán tới số đếm",
        "noiDung": "Đặt một góc, đợi các nguyên tử tích lũy rồi so tỉ lệ đếm được với xác suất. Đổi góc sẽ khởi động một loạt đếm mới vì phân bố đã thay đổi.\n\n$$f_+=N_+/(N_++N_-)$$\n\n+++ Đi sâu\nỞ loạt ngắn, tỉ lệ đếm có thể khác nhiều so với xác suất. Với các lần độc lập, sai số chuẩn của tần suất là $\\sqrt{f(1-f)/N}$: với N = 100 và f = 0,5, sai số khoảng 0,05; muốn sai số nhỏ đi một nửa phải đếm gấp bốn lần. Vạch đỏ trên đồ thị là sai số này. Ghi lại góc, cách chuẩn bị, số hạt vào cửa cộng và tổng số hạt đã đến. Nếu thử một góc mới, tách các lượt phát ấy thành một dòng khác. Chỉ nên gộp các nhóm có cùng điều kiện; gộp nhiều góc có thể che mất chính quan hệ phụ thuộc góc mà ta đang tìm.\n+++\n\n> [Thử ngay] [[Bắt đầu loạt ở 90°|thu]]",
        "vao": (c) => c.buoc(7),
        "nut": {
          "thu": (c) => c.lenh("goc-90")
        }
      }
    ],
    "congThuc": [
      {
        "ten": "Xác suất ở cửa cộng",
        "tex": "P(+)=\\cos^2(\\theta/2)",
        "y": "Chùm đầu được chuẩn bị theo +z."
      },
      {
        "ten": "Trung bình",
        "tex": "\\langle S_n\\rangle=\\frac{\\hbar}{2}\\cos\\theta",
        "y": "Lấy trung bình qua nhiều nguyên tử +z."
      },
      {
        "ten": "Hai trị riêng",
        "tex": "S_n=\\pm\\hbar/2",
        "y": "Một lần đo cho một trong hai giá trị theo trục n."
      }
    ],
    "cauHoi": [
      {
        "hoi": "Chùm +z, nam châm quay 90°. Kết quả nào?",
        "chon": [
          "Tất cả vào cửa cộng",
          "Hai cửa đều có xác suất ½",
          "Tất cả đi thẳng giữa hai cửa"
        ],
        "dung": 1,
        "giai": "P(+) = cos²(90°/2) = cos²45° = ½. Mỗi nguyên tử vẫn vào một trong hai cửa, ứng với +ħ/2 hoặc −ħ/2; không có nguyên tử nào đi thẳng ở giữa dù trung bình bằng không."
      },
      {
        "hoi": "Cần đổi gì để phân biệt chùm +z với hỗn hợp đều khi phép đo ngang cho cùng kết quả thống kê?",
        "chon": [
          "Đo trên nhiều nguyên tử dọc z",
          "Chỉ đếm một nguyên tử"
        ],
        "dung": 0,
        "giai": "Trên trục z, chùm +z vào cửa cộng chắc chắn, còn hỗn hợp đều tiếp tục chia đôi."
      },
      {
        "hoi": "Chùm +z, hai trục lệch 60°. Tỉ lệ vào cửa trừ bằng bao nhiêu?",
        "chon": [
          "25%",
          "50%",
          "75%"
        ],
        "dung": 0,
        "giai": "Cửa cộng nhận 75%, nên phần còn lại là 25%."
      },
      {
        "hoi": "Tại sao nam châm phải có gradient từ trường?",
        "chon": [
          "Để tạo lực tách chùm theo mômen từ",
          "Để nguyên tử trung hòa có điện tích"
        ],
        "dung": 0,
        "giai": "Thế năng của mômen từ phụ thuộc từ trường tại vị trí của hạt, nên khi năng lượng thay đổi theo vị trí mới xuất hiện lực tách chùm."
      },
      {
        "hoi": "Đo góc vuông và được trung bình gần không. Vì sao chưa đủ để kết luận chùm không phân cực?",
        "dap": "Chùm +z thuần cũng cho trung bình bằng không dọc trục ngang. Hãy dùng cùng cách chuẩn bị cho các nguyên tử mới rồi đo dọc z: trạng thái thuần cho cùng một dấu, hỗn hợp đều cho hai dấu ngang nhau."
      }
    ],
    "thuatNgu": [
      {
        "vi": "spin",
        "en": "spin",
        "nghia": "Mômen động lượng nội tại của một hệ lượng tử."
      }
    ],
    "docThem": [
      "Feynman Lectures III, chương 6. https://www.feynmanlectures.caltech.edu/III_06.html",
      "Griffiths và Schroeter, Introduction to Quantum Mechanics, ấn bản 3, chương 4, phần Spin."
    ]
  }
};
