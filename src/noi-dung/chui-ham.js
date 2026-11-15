// Lời giảng tiếng Việt. Nút và thử thách do cảnh đảm nhiệm.
export default {
  "ten": "Chui hầm qua rào thế",
  "moTa": "Thay bề rộng rào và so dòng hạt xuyên qua với dự đoán.",
  "yChinh": "Ngay khi năng lượng thấp hơn đỉnh rào, nghiệm sóng có thể nối sang phía bên kia với biên độ khác không. Tỉ số dòng truyền qua và dòng tới cho xác suất truyền.",
  "giaiThich": "Chùm electron đơn sắc tới rào chữ nhật một chiều. Hai miền ngoài có thế năng bằng nhau. Đường lam là mật độ trạng thái tán xạ dừng, chuẩn theo sóng tới; các dấu ghi hai phía mô phỏng kết quả phát hiện độc lập.",
  "conSo": [
    "Với E = 2 eV, U = 4 eV, rào rộng 0,20 nm cho T xấp xỉ 0,198.",
    "Rào dày: T ≈ 16E(U − E)/U² · e^(−2κa). Với E = 2 eV, U = 4 eV, a = 0,40 nm, gần đúng cho 0,0122, đúng là 0,0121."
  ],
  "hieuDung": "Động lượng cổ điển trong rào không có giá trị thực khi E < U. Hàm sóng trong rào vẫn được xác định; năng lượng của electron truyền qua bằng năng lượng tới.",
  "nguon": "Trí Lữ soạn. OpenStax, University Physics, tập 3, mục 7.6. Griffiths và Schroeter, Introduction to Quantum Mechanics, chương 2. NIST CODATA 2022, khối lượng electron; h và e theo SI.",
  "baiGiang": {
    "mucTieu": [
      "Đọc sơ đồ thế năng và năng lượng tới.",
      "Dự đoán tác dụng của độ rộng và độ cao rào.",
      "Phân biệt mật độ và dòng xác suất."
    ],
    "buoc": [
      {
        "ten": "Đến trước một rào thế",
        "noiDung": "Hãy đọc hai mức năng lượng trước khi nhìn chấm đếm. Vạch ngang vàng là năng lượng của chùm tới, khối ở giữa là thế năng của electron. Hai đại lượng dùng cùng một thang eV. Trong cơ học cổ điển, động năng là hiệu của hai mức ấy. Nếu hiệu âm ở giữa, một hạt cổ điển đi từ bên trái phải quay lại trước khi vào vùng rào.\n\nKéo chậm đỉnh rào xuống nhưng vẫn giữ nó cao hơn năng lượng tới. Một lập luận chỉ dùng động năng cổ điển cho cùng một dự đoán ở mọi độ rộng của rào. Hãy giữ dự đoán đó để đối chiếu ngay ở bước kế tiếp với cách giải bằng sóng.\n\n$$ K=E-U $$\n\n+++ Đi sâu · Vai trò hai detector\nĐiểm xanh bên phải ghi hạt truyền qua; điểm cam bên trái ghi hạt phản xạ. Vị trí ngang trong mỗi khay chỉ để tách các dấu đếm.\n+++\n\n> [Thử ngay] [[Đếm lại từ đầu|thu]]"
      },
      {
        "ten": "Sóng ở vùng cấm cổ điển",
        "noiDung": "Bên trong rào, hệ số trong phương trình Schrödinger đổi dấu khi E thấp hơn U. Nghiệm khi ấy là tổ hợp của hai hàm mũ thực. Cần cả hai để khớp với điều kiện ở hai đầu rào hữu hạn. Trên bàn, đường lam cho thấy mật độ xuyên vào vùng rào. Trục cao của đường mật độ dùng một thang riêng với trục eV.\n\nBắt đầu ở mặt trái rồi lần theo đường lam đến mặt phải. Không có bước nhảy về mật độ ở biên của một rào hữu hạn. Dù rào rộng làm giá trị phía phải nhỏ đến khó nhìn bằng mắt, con số T vẫn cho phép phân biệt tín hiệu nhỏ với giá trị bằng không.\n\n$$ \\kappa=\\sqrt{2m(U-E)}/\\hbar $$\n\n+++ Đi sâu · Chiều dài suy giảm\nNghịch đảo κ có đơn vị độ dài. Trong rào dày, đi thêm độ dài này làm thành phần biên độ giảm còn 1/e; bình phương độ lớn giảm nhanh hơn. Với E = 2 eV và U = 4 eV, κ ≈ 7,25 nm⁻¹, nên chiều dài suy giảm 1/κ ≈ 0,138 nm, đúng ô cuối của bảng số.\n+++\n\n> [Thử ngay] [[Chọn rào dày|thu]]"
      },
      {
        "ten": "Vì sao phía sau có hạt?",
        "noiDung": "Bên phải chỉ có sóng đi ra, do ta chỉ chiếu tới từ trái. Khớp hàm sóng và đạo hàm ở cả hai mặt phân cách xác định biên độ truyền. Dải điểm phía sau là nhiều kết quả có thể xảy ra theo hệ số truyền T. Từng electron xuất hiện nguyên vẹn ở một trong hai detector. Tiếng tách minh họa sự kiện truyền qua và được giới hạn nhịp.\n\nNút ghi nhanh thêm nhiều lần thử độc lập cùng điều kiện. Nếu bấm lại, số hai phía thường không giống chính xác lượt trước. Điều cần so với lý thuyết là tần suất truyền trong tổng số tới; một chấm riêng lẻ chỉ cho một trong hai kết quả.\n\n$$ T=j_{\\rm trans}/j_{\\rm in}=|t|^2 $$\n\n+++ Đi sâu · Vận tốc hai bên\nĐẳng thức cuối dùng thế ngoài rào bằng nhau nên vận tốc hai sóng ngoài cũng bằng nhau. Nếu thế hai bên khác, còn phải nhân tỉ số vận tốc.\n+++\n\n> [Thử ngay] [[Ghi 100 lần tới|thu]]"
      },
      {
        "ten": "Độ rộng thay đổi xác suất",
        "noiDung": "Kéo mặt phải của rào ra xa mặt trái. Đỉnh rào và mức năng lượng tới giữ nguyên. Bây giờ hàm sóng phải nối qua một quãng rộng hơn mới tới miền truyền tự do. Hãy dự đoán khay nào nhận ít hạt dần rồi so với T hiển thị. Số đếm trên màn được xóa khi điều kiện thay đổi để các mẫu thuộc cùng một cấu hình.\n\nKiểm tác dụng của chiều rộng bằng cách chỉ di chuyển núm nằm ngang gần chân rào. Nếu đồng thời tăng chiều cao, chính thay đổi đó cũng có thể hạ số đếm và khiến ta khó xác định riêng vai trò của bề rộng.\n\n$$ T=\\left[1+\\frac{U^2\\sinh^2(\\kappa a)}{4E(U-E)}\\right]^{-1} $$\n\n+++ Đi sâu · So một giá trị\nVới E = 2 eV, U = 4 eV và a = 0,20 nm, khoảng 19,8% truyền qua trong giới hạn nhiều hạt. Từng nhóm nhỏ có thể lệch rõ khỏi con số ấy.\n+++\n\n> [Thử ngay] [[Đặt lại a = 0,10 nm|thu]]",
        "thuThach": {
          "de": "Kéo bề rộng cho T gần 0,20, dung sai 0,015 khi E = 2 eV và U = 4 eV.",
          "goiY": "Khi T quá lớn, tăng khoảng cách hai mặt rào."
        }
      },
      {
        "ten": "Nâng đỉnh rào",
        "noiDung": "Giữ nguyên bề rộng và nâng đỉnh. Khoảng chênh U − E tăng, hằng số suy giảm tăng và chiều dài suy giảm ngắn đi. Hình màu lam phía sau thấp hơn. Hãy đọc cả T và số lần truyền rồi giải thích vì sao ở một nhóm rất ít hạt có thể chưa thấy lần nào truyền dù lý thuyết cho T dương.\n\nKhi khay phải rỗng, hãy đọc ô lý thuyết trước khi kết luận là không thể truyền. Để lâu hơn hoặc bấm ghi thêm, vẫn giữ nguyên điều kiện. Mô hình cố ý giữ hai số đếm riêng để phép so sánh không bị ảnh hưởng bởi màu sáng khác nhau giữa hai khay.\n\n$$ \\ell=1/\\kappa $$\n\n+++ Đi sâu · Hai cách làm T nhỏ\nTăng độ cao và tăng bề rộng đều làm giảm truyền dưới đỉnh, nhưng chỉ độ cao làm đổi κ nếu giữ nguyên E.\n+++\n\n> [Thử ngay] [[Hạ lại U = 4 eV|thu]]",
        "thuThach": {
          "de": "Nâng rào cho U − E = 4 eV, trong 0,12 eV.",
          "goiY": "Giữ E = 2 eV, kéo tay nắm trên đỉnh."
        }
      },
      {
        "ten": "Hai khay nhận đủ dòng",
        "noiDung": "Trong mô hình, rào đứng yên và không hấp thụ. Dòng tới chỉ chia thành dòng phản xạ và dòng truyền. Biên độ bên trái là tổng sóng tới và sóng dội, nên đường mật độ ở đó có gợn. Giá trị của một đỉnh gợn có thể lớn hơn một dù tổng xác suất của hai kết quả vẫn bằng một.\n\nĐể tự kiểm, thử cộng hai số đếm rồi so tỉ lệ bên phải với T. Nếu bấm thêm nhiều lần, số tuyệt đối tăng trong khi tỉ lệ thường biến động nhỏ hơn. Điều kiện bảo toàn chỉ ràng buộc tổng số và dòng, không ấn định kết quả của từng lượt.\n\n$$ R+T=1 $$\n\n+++ Đi sâu · Mật độ hay xác suất?\nĐường lam chia cho mật độ của sóng tới. T và R là tỉ số của các dòng tách biệt. Hai phép chuẩn hóa này trả lời hai câu hỏi khác nhau.\n+++\n\n> [Thử ngay] [[Ghi thêm 100 hạt|thu]]"
      },
      {
        "ten": "Hạt truyền đi mang năng lượng nào?",
        "noiDung": "Quan sát vạch năng lượng khi tăng bề rộng. Rào làm thay đổi cơ hội xuất hiện ở phía sau. Hạt đã truyền đến vùng có cùng thế năng với vùng tới sẽ có cùng động năng như ban đầu. Giải thích bằng việc vay năng lượng trong một lát sẽ dự đoán sai cách đọc detector năng lượng ở miền ra.\n\nThay năng lượng tới tạo ra một lần chuẩn bị khác. Nếu nguồn thực tế phát hỗn hợp nhiều năng lượng, tỉ lệ qua của từng thành phần có thể khác nhau. Bài này dùng nguồn đơn sắc để tránh lẫn sự thay đổi thành phần của chùm với thay đổi năng lượng của một electron.\n\n$$ E_{\\rm out}=E_{\\rm in} $$\n\n+++ Đi sâu · Đọc miền bên phải\nBên phải chỉ có sóng truyền theo một chiều, mật độ phẳng trong trạng thái dừng. Các chấm trong khay không mô tả một quỹ đạo trong rào.\n+++\n\n> [Thử ngay] [[So với rào rộng|thu]]"
      },
      {
        "ten": "Dự đoán kết quả hiếm",
        "noiDung": "Khi rào đủ dày, một thay đổi nhỏ của a có thể làm tốc độ đếm ở phía ra thay đổi nhiều. Trước khi chỉnh, hãy dự đoán thao tác cần làm để biến một chùm có nhiều lần truyền thành một chùm rất hiếm khi truyền. So với bộ đếm lý thuyết và lặp nhiều lần mới đánh giá kết quả thực nghiệm.\n\nTrước khi nhìn bộ đếm, ghi dự đoán bằng một khoảng tỉ lệ thay vì một số hạt cố định. Điều khiển U và a xác định khả năng truyền của trạng thái đã chuẩn bị, còn mỗi chấm sáng là một kết quả ngẫu nhiên rút từ khả năng đó.\n\n> [Ví dụ] Với E = 2 eV, U = 4 eV: ở a = 0,40 nm (κa ≈ 2,9) công thức gần đúng cho T ≈ 0,0122, công thức đầy đủ cho 0,0121, lệch chưa tới 1%. Ở a = 0,10 nm (κa ≈ 0,72) gần đúng cho 0,94 trong khi đúng là 0,62: sai hẳn. Bảng số hiện cả hai giá trị để so.\n\n> [Ví dụ] Kính hiển vi quét chui hầm (STM) dựa đúng vào độ nhạy mũ này. Electron chui qua khe chân không giữa mũi dò và mặt kim loại, rào cao cỡ công thoát 4,5 eV nên κ ≈ 10,9 nm⁻¹. Khe rộng thêm 0,1 nm thì dòng giảm khoảng 9 lần, nên máy đo được độ cao bề mặt nhỏ hơn cỡ nguyên tử.\n\n$$ T\\approx\\frac{16E(U-E)}{U^2}\\,e^{-2\\kappa a}\\quad(\\kappa a\\gg1) $$\n\n+++ Đi sâu · Điều kiện của gần đúng\nQuy luật mũ là giới hạn rào dày. Khi rào rất mỏng dùng biểu thức đầy đủ của bước trước để T tiến đúng về một.\n+++\n\n> [Thử ngay] [[Thử rào mỏng|thu]]",
        "thuThach": {
          "de": "Giữ U = 4 eV, E = 2 eV và kéo a cho T dưới 0,02.",
          "goiY": "Tăng bề rộng tới khoảng 0,4 nm."
        }
      }
    ],
    "congThuc": [
      {
        "ten": "Sóng suy giảm",
        "tex": "\\kappa=\\sqrt{2m(U-E)}/\\hbar",
        "y": "Với U > E."
      },
      {
        "ten": "Dòng truyền",
        "tex": "T=|t|^2",
        "y": "Hai miền ngoài có cùng thế."
      },
      {
        "ten": "Bảo toàn dòng",
        "tex": "R=1-T",
        "y": "Rào không hấp thụ."
      },
      {
        "ten": "Gần đúng rào dày",
        "tex": "T\\approx\\frac{16E(U-E)}{U^2}\\,e^{-2\\kappa a}",
        "y": "Dùng khi κa lớn hơn hẳn 1; rào mỏng phải dùng công thức đầy đủ."
      }
    ],
    "cauHoi": [
      {
        "hoi": "E thấp hơn U, rào hữu hạn. T có thể thế nào?",
        "chon": [
          "Bắt buộc bằng 0",
          "Lớn hơn 0",
          "Lớn hơn 1"
        ],
        "dung": 1,
        "giai": "Nghiệm khớp có sóng truyền hữu hạn."
      },
      {
        "hoi": "Năng lượng của electron đã truyền thế nào?",
        "chon": [
          "Bằng năng lượng tới",
          "Giảm một nửa",
          "Bằng đỉnh rào"
        ],
        "dung": 0,
        "giai": "Rào thế đứng yên nên tán xạ đàn hồi."
      },
      {
        "hoi": "Khi a tiến về 0, T tiến tới đâu?",
        "chon": [
          "0",
          "1",
          "1/2"
        ],
        "dung": 1,
        "giai": "Rào có bề rộng triệt tiêu."
      },
      {
        "hoi": "Rào dày (κa ≫ 1). Bề rộng tăng thêm 1/κ thì T thay đổi thế nào?",
        "chon": [
          "Giảm khoảng e lần",
          "Giảm khoảng e² ≈ 7,4 lần",
          "Giảm một nửa"
        ],
        "dung": 1,
        "giai": "T tỉ lệ với e^(−2κa): thêm 1/κ vào a làm số mũ giảm thêm 2. Chọn «e lần» là nhầm biên độ (giảm e lần) với xác suất (bình phương biên độ)."
      },
      {
        "hoi": "Vì sao có vân mật độ bên trái?",
        "dap": "Sóng tới và sóng phản xạ giao thoa."
      },
      {
        "hoi": "Nhóm hạt nhỏ không truyền lần nào. Có kết luận được T = 0 không?",
        "dap": "Không. Với T nhỏ vẫn có xác suất không có lần truyền nào trong hữu hạn lượt."
      }
    ],
    "docThem": [
      "OpenStax, University Physics, Vol. 3, §7.6, The Quantum Tunneling of Particles through Potential Barriers.",
      "D. J. Griffiths & D. F. Schroeter, Introduction to Quantum Mechanics, 3rd ed., Ch. 2."
    ],
    "thuatNgu": []
  }
};
