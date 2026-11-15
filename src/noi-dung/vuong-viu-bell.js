// Lời giảng tiếng Việt là bản gốc. Các thao tác gọi trực tiếp mô hình của bài.
export default {
  "ten": "Vướng víu và bất đẳng thức Bell",
  "moTa": "Xoay hai máy phân tích spin và ghép kết quả của từng cặp để thử giới hạn CHSH.",
  "yChinh": "Trong trạng thái singlet của hai spin ½, mỗi bên nhận kết quả ngẫu nhiên. Khi hai bên ghép hồ sơ, các tương quan có thể vượt giới hạn của mô hình ẩn cục bộ với lựa chọn trục độc lập.",
  "giaiThich": "Nguồn ở giữa phát từng cặp hạt về hai trạm Alice và Bob; hai hạt của một cặp cùng màu. Mỗi trạm là một nam châm Stern–Gerlach quay quanh trục chùm, đèn đỏ cam báo +1, đèn xanh báo −1. Sổ ghi phía sau ghép kết quả hai trạm theo số thứ tự lần phát. Các hướng đo đều trong cùng một mặt phẳng. Ở chế độ «bốn cách», mỗi trạm chọn ngẫu nhiên giữa a = 0° và a′ = 90°, giữa b và b′ = −b, rồi S được tính từ chính số đếm. Khoảng cách và tốc độ bay đã được thu nhỏ, làm chậm.",
  "conSo": [
    "Cùng trục, mọi cặp cho hai dấu ngược nhau.",
    "Hai phía luôn có P(+) = ½.",
    "|S| = 2√2 ≈ 2,83 là giá trị lớn nhất cơ học lượng tử cho phép (giới hạn Tsirelson); mọi mô hình biến ẩn cục bộ bị chặn ở 2."
  ],
  "hieuDung": "Muốn thấy tương quan phải ghép hai dãy kết quả qua kênh liên lạc thông thường. Bên này không thể dùng lựa chọn góc để gửi thông điệp qua phân bố tại bên kia.",
  "nguon": "Trí Lữ soạn. Clauser, Horne, Shimony và Holt, Physical Review Letters 23 (1969), 880. Griffiths và Schroeter, Introduction to Quantum Mechanics, ấn bản 3, chương 12 (Afterword), mục định lý Bell. A. Aspect, P. Grangier và G. Roger, Physical Review Letters 49 (1982), 91. B. Hensen và cộng sự, Nature 526 (2015), 682.",
  "baiGiang": {
    "mucTieu": [
      "Tách phân bố cục bộ khỏi tương quan theo cặp.",
      "Tính đại lượng CHSH từ bốn cặp trục.",
      "Nêu giả thiết của giới hạn cục bộ và lý do kết quả không truyền tin tức thời."
    ],
    "buoc": [
      {
        "ten": "Một lần phát, hai dấu",
        "noiDung": "Nguồn tạo hai spin ½ trong {{trạng thái singlet}}. Mỗi trạm ghi +1 hoặc −1 theo trục mình chọn. Khi có đủ hai ghi nhận, chúng thuộc cùng một cặp. Tiếng cao biểu diễn hai dấu giống nhau, tiếng thấp biểu diễn hai dấu khác nhau.\n\n$$A,B\\in\\{-1,+1\\}$$\n\n+++ Đi sâu\nDấu chỉ kết quả đã chia cho ħ/2. Mô hình biểu diễn hai phép đo spin của hạt vật chất, vì vậy góc quay trong công thức là góc giữa các trục spin. Hai máy phải giữ cả số thứ tự lần phát hoặc dấu thời gian để biết dấu ở bên nào đi với dấu nào. Nếu trộn ngẫu nhiên thứ tự một danh sách trước khi so, xác suất tại mỗi bên vẫn như cũ nhưng sự ăn khớp theo cặp sẽ bị mất.\n+++\n\n> [Thử ngay] [[Đặt hai trục cùng hướng|thu]]",
        "vao": (c) => c.buoc(0),
        "nut": {
          "thu": (c) => c.lenh("song")
        }
      },
      {
        "ten": "Cùng trục, ngược dấu",
        "noiDung": "Đợi một số cặp đi tới máy. Mỗi bên có thể ghi hai dấu, nhưng biết dấu bên trái cùng trục sẽ cho biết chắc dấu bên phải. Tổng spin của trạng thái singlet bằng không.\n\n$$E(a,a)=\\langle AB\\rangle=-1$$\n\n+++ Đi sâu\nĐổi sang hai trục ngược hướng sẽ đổi quy ước dấu của một phía. Khi đó các dấu đọc ra luôn bằng nhau. Có thể hình dung hai phong bì mang sẵn hai dấu ngược để tái hiện riêng cặp trục này. Chỉ một cặp trục vì thế chưa đủ kiểm tra được sự khác biệt lượng tử. Phép thử Bell buộc cùng một cách giải thích phải phù hợp với nhiều cặp hướng đo khác nhau.\n+++\n\n> [Thử ngay] [[Đảo một trục|thu]]",
        "vao": (c) => c.buoc(1),
        "nut": {
          "thu": (c) => c.lenh("nguoc")
        }
      },
      {
        "ten": "Đo một tương quan",
        "noiDung": "Mỗi cặp cùng dấu đóng góp +1, cặp khác dấu đóng góp −1. Cộng các tích rồi chia số cặp cho một ước lượng E. Khi đổi góc, bộ đếm xóa các cặp cũ.\n\n$$E=P_{\\rm same}-P_{\\rm opp}=-\\cos(a-b)$$\n\n+++ Đi sâu\nỞ hai trục vuông góc, cùng dấu và ngược dấu có khả năng ngang nhau. Số đếm của mẫu ngắn có thể nghiêng về một phía. Giả sử bạn ghi lại toàn bộ cặp trong hai cột. Thêm cột thứ ba tính tích theo từng dòng; lấy trung bình cột thứ ba khác với nhân trung bình hai cột đầu. Ở đây từng cột đầu có thể trung bình gần không trong khi trung bình các tích gần âm một.\n+++\n\n> [Thử ngay] [[Xem trục vuông góc|thu]]",
        "vao": (c) => c.buoc(2),
        "nut": {
          "thu": (c) => c.lenh("vuong")
        },
        "thuThach": {
          "de": "Kéo một trục để độ lớn E nhỏ hơn 0,018.",
          "goiY": "Tìm hiệu góc gần 90°.",
          "giu": 0.4,
          "kiem": (c) => c.dat("zero")
        }
      },
      {
        "ten": "Mỗi bên nhìn thấy gì?",
        "noiDung": "Hai bộ đếm P(A+) và P(B+) tích lũy riêng. Khi chỉ nhìn một bộ đếm, ta luôn dự đoán được một nửa các kết quả là dấu cộng dù trục bên kia hướng đâu.\n\n$$P(A=+1)=P(B=+1)=\\tfrac12$$\n\n+++ Đi sâu\nDấu của từng phía ngẫu nhiên, nhưng hai dấu có thể gần như luôn giống nhau. Hai thông tin này diễn tả hai loại phân bố khác nhau. Hãy dự đoán trước khi kéo xem tỉ lệ cửa cộng của Alice có đi theo hướng xoay Bob không. Có thể thấy bộ đếm nhảy lên hoặc xuống do lượt mới bắt đầu từ một mẫu rất ngắn. Để nhiều cặp tới hơn rồi đối chiếu lại xác suất của mỗi bên.\n+++\n\n> [Thử ngay] [[Đặt lại trục gốc|thu]]",
        "vao": (c) => c.buoc(3),
        "nut": {
          "thu": (c) => c.lenh("song")
        },
        "thuThach": {
          "de": "Kéo một trục để tương quan E lớn hơn 0,995.",
          "goiY": "Cho hai trục gần ngược hướng.",
          "giu": 0.4,
          "kiem": (c) => c.dat("cung")
        }
      },
      {
        "ten": "Bốn cách đặt máy",
        "noiDung": "Alice chọn a hoặc a′, Bob chọn b hoặc b′. Ứng với mỗi tổ hợp, ta lấy trung bình tích hai dấu. Chỉ sau khi có đủ bốn trung bình mới tính tổ hợp CHSH.\n\n$$S=E(a,b)+E(a,b')+E(a',b)-E(a',b')$$\n\n+++ Đi sâu\nTrong dòng dự đoán cuối, a = 0°, a′ = 90°, b′ = −b. Khi đổi góc Bob, cả b và b′ của phép tính cùng đổi. Không thể lấy cùng một cặp hạt đã đo rồi gắn nó vào cả bốn nhóm như thể nó đã trải qua bốn phép đo. Mỗi cặp thật chỉ gặp một cách đặt máy. Ta dùng các cặp có cùng cách chuẩn bị ở nguồn để xây dựng những nhóm độc lập cho từng tổ hợp.\n+++\n\n> [Thử ngay] [[Chạy bốn cách đặt máy|thu]] Mỗi cặp, mỗi trạm tự chọn ngẫu nhiên một trong hai trục của mình; sổ ghi cho thấy trục của từng dòng, đồ thị hiện bốn chấm đỏ.",
        "vao": (c) => c.buoc(4),
        "nut": {
          "thu": (c) => c.lenh("chsh")
        }
      },
      {
        "ten": "Vì sao giới hạn cục bộ bằng hai?",
        "noiDung": "Thử giả sử mỗi hạt mang câu trả lời ±1 cho mỗi trục địa phương, độc lập với trục được chọn ở trạm xa. Trong mỗi lượt, một trong hai ngoặc của biểu thức dưới bằng không, ngoặc kia bằng ±2.\n\n$$A(B+B')+A'(B-B')=\\pm2$$\n\nMô hình đang chạy đúng một nguồn như thế. Mỗi cặp mang sẵn một hướng λ, vẽ bằng màu của cặp. Alice ghi +1 khi λ lệch trục của cô dưới 90°, Bob ghi theo cách ngược lại với trục của anh. Đồ thị tương quan thành đường gấp khúc màu hồng, và |S| đếm được tiến tới 2 nhưng không vượt.\n\n+++ Đi sâu\nBình quân trên cùng phân bố biến ẩn cho |S| ≤ 2. Điều này đòi hỏi cách chọn trục độc lập với biến ẩn tại nguồn. Có thể tự kiểm hai ngoặc trên bằng cách đặt thử B và B′ cùng dấu, rồi ngược dấu. Việc lấy trung bình nhiều lượt không thể đẩy giá trị ra ngoài khoảng từ âm hai đến dương hai. Giới hạn này cũng bao gồm mô hình trả lời ngẫu nhiên nếu đưa phần ngẫu nhiên địa phương vào biến ẩn.\n+++\n\n> [Thử ngay] [[Đổi sang nguồn singlet lượng tử|thu]]",
        "vao": (c) => c.buoc(5),
        "nut": {
          "thu": (c) => c.lenh("doiNguon")
        }
      },
      {
        "ten": "Trục cho độ vi phạm lớn nhất",
        "noiDung": "Đặt b gần giữa hai trục Alice. Những tương quan trái dấu kết hợp với dấu trừ của số hạng cuối, làm độ lớn tổng vượt giới hạn cục bộ.\n\n$$|S(45^\\circ)|=2\\sqrt{2}$$\n\n+++ Đi sâu\nVới các trục ghi trên dòng |S|, biểu thức cho S là −2(cos b + sin b). Các số đếm của riêng cặp đang xem chỉ đóng góp một số hạng. Di chuyển b về không để hai lựa chọn phía Bob trùng nhau. Số hạng có a′ sẽ tự triệt nhau. Khi ấy tổ hợp chỉ còn hai lần tương quan cùng hướng và độ lớn quay về giới hạn cục bộ. Thử thay đổi b từng ít một để thấy cần có nhiều hướng đo mới biểu lộ được sự khác biệt.\n+++\n\n> [Thử ngay] [[Xem bộ trục tối ưu|thu]]",
        "vao": (c) => c.buoc(6),
        "nut": {
          "thu": (c) => c.lenh("toiUu")
        },
        "thuThach": {
          "de": "Kéo núm Bob để |S| vượt 2,8.",
          "goiY": "Đặt b gần 45°.",
          "giu": 0.4,
          "kiem": (c) => c.dat("bell")
        }
      },
      {
        "ten": "Đọc kết quả thí nghiệm thật",
        "noiDung": "Một phép thử cần nhiều cặp, hai lựa chọn trục mỗi bên, thống kê sai số và cách ghép lượt không thiên lệch. Cần kiểm rằng các máy không kịp truyền thông tin về lựa chọn của nhau khi đang đo.\n\n$$\\widehat E=(N_{++}+N_{--}-N_{+-}-N_{-+})/N$$\n\n+++ Đi sâu\nMô hình lấy mẫu theo công thức lượng tử nên dùng để học cách phân tích. Bằng chứng thực nghiệm đến từ kết quả đo độc lập với giả định phân bố của mô hình. Không nên chỉ chọn các lượt hai bên cùng ghi được dấu như nhau rồi mới tính E. Thao tác ấy đã dùng chính kết quả cần nghiên cứu để lọc mẫu. Hãy quyết định cách ghép cặp và cách xử lý sự kiện bị bỏ lỡ từ trước khi xem các dấu.\n+++\n\n> [Lịch sử] John Bell chứng minh bất đẳng thức của mình năm 1964; Clauser, Horne, Shimony và Holt đưa ra dạng CHSH năm 1969. Freedman và Clauser đo lần đầu với cặp photon năm 1972. Năm 1982, nhóm Alain Aspect ở Orsay đo được S = 2,697 ± 0,015, rất gần dự đoán lượng tử, và làm thêm thí nghiệm đổi trục theo chu kỳ trong lúc photon đang bay. Năm 2015, ba nhóm ở Delft, Vienna và NIST cùng lúc đóng hai «kẽ hở» chính: hai trạm đủ xa để không kịp báo tin cho nhau, và đầu dò đủ nhạy để không phải bỏ bớt lượt. Nhóm Delft dùng spin electron trong kim cương, đo được S = 2,42 ± 0,20. Giải Nobel Vật lý 2022 trao cho Alain Aspect, John Clauser và Anton Zeilinger.\n\n> [Lưu ý] Các thí nghiệm photon đo phân cực chứ không đo spin. Tương quan khi đó theo cos 2(a − b), nên mọi góc chia đôi: bộ trục tối ưu cách nhau 22,5° thay vì 45°.\n\n> [Thử ngay] [[Đếm lại từ đầu|thu]]",
        "vao": (c) => c.buoc(7),
        "nut": {
          "thu": (c) => c.lenh("chsh")
        }
      }
    ],
    "congThuc": [
      {
        "ten": "Tương quan singlet",
        "tex": "E(a,b)=-\\cos(a-b)",
        "y": "Góc giữa trục spin trong cùng mặt phẳng."
      },
      {
        "ten": "Tổ hợp CHSH",
        "tex": "S=E(a,b)+E(a,b')+E(a',b)-E(a',b')",
        "y": "Mỗi số hạng là một trung bình của nhiều cặp."
      },
      {
        "ten": "Xác suất cùng dấu",
        "tex": "P_{\\rm same}=(1+E)/2",
        "y": "Hai kết quả mỗi bên có giá trị +1 hoặc −1."
      }
    ],
    "cauHoi": [
      {
        "hoi": "Bob xoay máy. Alice chỉ xem máy mình sẽ thấy gì?",
        "chon": [
          "P(+) vẫn bằng ½",
          "Biết đúng góc Bob chọn"
        ],
        "dung": 0,
        "giai": "Chỉ phân bố chung phụ thuộc vào hiệu góc."
      },
      {
        "hoi": "|S| lớn hơn 2 kiểm tra điều gì?",
        "chon": [
          "Tốc độ hạt vượt ánh sáng",
          "Giới hạn cho mô hình ẩn cục bộ với các giả thiết CHSH"
        ],
        "dung": 1,
        "giai": "Cần tính tương quan trên những mẫu có lựa chọn trục độc lập."
      },
      {
        "hoi": "Hai trục cùng hướng. E bằng mấy?",
        "chon": [
          "−1",
          "0",
          "+1"
        ],
        "dung": 0,
        "giai": "Hai dấu luôn đối nhau, nên mọi tích đều là −1."
      },
      {
        "hoi": "Bốn số hạng của S được lấy từ đâu?",
        "chon": [
          "Đo cùng một cặp theo bốn cách liên tiếp",
          "Dùng bốn nhóm cặp với bốn tổ hợp trục"
        ],
        "dung": 1,
        "giai": "Mỗi cặp chỉ cho kết quả ứng với hướng đã chọn của nó."
      },
      {
        "hoi": "Bạn gán nhầm dấu B của cặp này cho cặp khác. Đại lượng nào dễ bị phá hỏng?",
        "dap": "Tổng số dấu cộng ở mỗi bên vẫn giữ nguyên, nhưng tích AB không còn thuộc cùng cặp. Trung bình các tích và S suy ra từ đó mất ý nghĩa."
      }
    ],
    "thuatNgu": [
      {
        "vi": "trạng thái singlet",
        "en": "singlet state",
        "nghia": "Trạng thái hai spin có tổng mômen động lượng spin bằng không."
      }
    ],
    "docThem": [
      "Clauser et al., Proposed Experiment to Test Local Hidden-Variable Theories (1969). https://doi.org/10.1103/PhysRevLett.23.880",
      "Ủy ban Nobel Vật lý, Scientific Background on the Nobel Prize in Physics 2022, phần bất đẳng thức Bell."
    ]
  }
};
