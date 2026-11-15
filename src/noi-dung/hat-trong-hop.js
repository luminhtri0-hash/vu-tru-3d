// Lời giảng tiếng Việt. Nút và thử thách do cảnh đảm nhiệm.
export default {
  "ten": "Hàm sóng và xác suất: electron trong hộp",
  "moTa": "Kéo vách giếng, đọc nút sóng và lấy mẫu vị trí.",
  "yChinh": "Điều kiện ở hai vách chọn ra những sóng dừng rời rạc. Bình phương độ lớn của hàm sóng cho mật độ xác suất.",
  "giaiThich": "Hộp là một giếng thế vô hạn một chiều. Đường lam là phần thực của hàm sóng ở một pha đã chọn. Dải vàng là mật độ. Các chấm lấy mẫu từ nhiều electron được chuẩn bị độc lập trong cùng trạng thái.",
  "conSo": [
    "Ở mức n = 2, chính giữa hộp là một nút.",
    "Hộp rộng gấp đôi có năng lượng cơ bản bằng 1/4 ban đầu."
  ],
  "hieuDung": "Dấu âm của biên độ vẫn cho mật độ dương. Năng lượng thấp nhất khác không ngay cả khi không có lực trong lòng giếng.",
  "nguon": "Trí Lữ soạn. Mô hình và nghiệm theo OpenStax, University Physics, tập 3, mục 7.4. Griffiths và Schroeter, Introduction to Quantum Mechanics, chương 2.",
  "baiGiang": {
    "mucTieu": [
      "Từ hai biên suy ra các bước sóng cho phép.",
      "Dùng diện tích dưới đường mật độ để dự đoán số lần phát hiện.",
      "Dự đoán năng lượng khi đổi độ rộng hộp."
    ],
    "buoc": [
      {
        "ten": "Hai vách chọn sóng",
        "noiDung": "Trong giếng, electron chuyển động tự do giữa hai vách lý tưởng. Vách vô hạn buộc hàm sóng bằng không ở mỗi đầu. Một sóng có biên độ khác không ở vách sẽ không thỏa điều kiện của mô hình.\n\nNếu coi hộp như một đoạn dây cố định hai đầu, ta dễ hình dung điều kiện biên. Nhưng dây thật rung lên xuống trong không gian, còn electron được mô tả bằng một biên độ tại mỗi vị trí. Khi em kéo vách, hãy theo dõi chỗ đường xanh chạm trục và chỗ nó đạt độ lớn cao nhất.\n\n$$ \\psi(0)=\\psi(L)=0 $$\n\n+++ Đi sâu · Biên của giếng\nTrục ngang biểu diễn vị trí trong hộp. Trục cao của đường cong biểu diễn giá trị hàm; đây là đồ thị được dựng nổi để có thể xoay và đọc.\n+++\n\n> [Thử ngay] [[Chọn trạng thái cơ bản|thu]]"
      },
      {
        "ten": "Đếm nửa bước sóng",
        "noiDung": "Ở trạng thái cơ bản, một nửa bước sóng vừa vào hộp. Ở trạng thái kế tiếp, một bước sóng trọn nằm giữa hai vách. Mỗi nửa bước sóng thêm vào tạo thêm một bụng.\n\nĐể kiểm tra bằng hình, giữ vách đứng yên và đếm số đoạn nằm hoàn toàn trên hoặc dưới trục xanh. Mỗi đoạn nằm giữa hai nút liên tiếp. Nếu cố nhét thêm một phần của nửa bước sóng, đầu cuối sẽ không rơi đúng vào vách phải. Đây là lý do giá trị n phải gián đoạn.\n\n$$ L=n\\lambda_n/2 $$\n\n+++ Đi sâu · Các giá trị của n\nn là số nguyên dương. Chọn n bằng không cho hàm bằng không ở mọi nơi nên không thể chuẩn hóa thành một hạt.\n+++\n\n> [Thử ngay] [[Chuyển sang n = 2|thu]]"
      },
      {
        "ten": "Bình phương biên độ",
        "noiDung": "Đường lam có thể ở dưới trục. Lấy bình phương độ lớn của nó cho đường mật độ vàng, luôn không âm. Ở một nút, dù đo rất nhiều lần, mật độ vẫn bằng không.\n\nSo một điểm ở giữa bụng dương với điểm đối xứng giữa bụng âm. Máy đo vị trí được đặt ở hai vùng nhỏ có cùng chiều rộng sẽ ghi hai tần suất gần bằng nhau. Nếu chỉ nhìn đường xanh rồi kết luận phía âm có ít hạt hơn, hãy kiểm lại bằng dải vàng và các chấm đếm.\n\n$$ \\rho(x)=|\\psi_n(x)|^2 $$\n\n+++ Đi sâu · Đọc điểm giữa\nĐặt n = 2 rồi kéo đầu đọc dọc hộp. Hai thùy có dấu ngược nhau nhưng hình dạng mật độ đối xứng qua giữa hộp.\n+++\n\n> [Thử ngay] [[Chọn mức có nút giữa|thu]]",
        "thuThach": {
          "de": "Kéo đầu đọc về nút giữa của n = 2, trong 0,03 lần chiều rộng.",
          "goiY": "Nút ở x/L = 0,5."
        }
      },
      {
        "ten": "Diện tích là xác suất",
        "noiDung": "Tô một đoạn trên trục vị trí. Xác suất đo thấy electron trong đoạn là diện tích dưới đường mật độ trên đoạn đó. Đọc mật độ tại một điểm chưa cho biết diện tích này.\n\nĐầu đọc xác định mép phải của đoạn, còn vách trái giữ nguyên. Kéo đầu đọc từ trái sang phải, số đo xác suất chỉ có thể tăng hoặc giữ nguyên. Gần một bụng, cùng một độ dời sẽ lấy thêm diện tích lớn hơn gần một nút. Hãy kiểm điều này bằng cách kéo thật chậm qua cả hai vùng.\n\n$$ P(0<x<b)=\\int_0^b|\\psi_n(x)|^2\\,dx $$\n\n+++ Đi sâu · Vì sao đổi đơn vị được?\nMật độ có đơn vị nghịch đảo độ dài. Nhân với vi phân độ dài rồi cộng lại cho xác suất không có đơn vị. Cả hộp có tổng xác suất bằng một.\n+++\n\n> [Thử ngay] [[Đọc khoảng nửa hộp|thu]]"
      },
      {
        "ten": "Các bậc thang năng lượng",
        "noiDung": "Trạng thái có nhiều bụng hơn mang động lượng đặc trưng lớn hơn. Vì động năng tỉ lệ với bình phương động lượng, mức năng lượng tăng theo bình phương chỉ số n.\n\nĐọc chỉ số mức trong bảng nhỏ, sau đó đọc năng lượng theo đơn vị mức cơ bản của hộp tham chiếu. Nếu em tăng n thêm một đơn vị, số bụng chỉ thêm một nhưng mức năng lượng nhảy xa hơn ở những n lớn. Hình dáng trơn của một đường sóng bên trong hộp vẫn đi cùng một dãy năng lượng rời rạc.\n\n$$ E_n=n^2h^2/(8mL^2) $$\n\n+++ Đi sâu · Khoảng cách hai mức\nTại một chiều rộng cố định, các năng lượng đầu tiên tỉ lệ 1, 4, 9. Hiệu giữa hai mức liên tiếp lớn dần. Với electron trong hộp rộng $1\\,\\mathrm{nm}$, mức cơ bản $E_1=h^2/(8mL^2)\\approx0{,}376\\,\\mathrm{eV}$; vì vậy $E_2\\approx1{,}50\\,\\mathrm{eV}$ và $E_3\\approx3{,}38\\,\\mathrm{eV}$.\n+++\n\n> [Thử ngay] [[Chọn n = 3|thu]]"
      },
      {
        "ten": "Dời vách hộp",
        "noiDung": "Kéo vách phải ra xa và so mức cơ bản với mức của hộp tham chiếu rộng 1 nm. Khi giữ cùng n, một hộp rộng hơn cho phép bước sóng dài hơn và động năng nhỏ hơn.\n\nHãy giữ con trỏ ở cùng phần chiều dài hộp khi kéo vách. Số bụng và tỉ phần xác suất nằm bên trái con trỏ giữ nguyên, nhưng đỉnh mật độ thấp xuống vì diện tích phải trải trên đoạn dài hơn. Nếu chỉ nhìn đỉnh thấp hơn rồi nghĩ electron đã biến mất, hãy kiểm xác suất của cả hộp.\n\n$$ E_n(2L)/E_n(L)=1/4 $$\n\n+++ Đi sâu · So hai cấu hình\nMỗi lần đổi vách, mô hình chuẩn bị lại trạng thái riêng trong giếng mới. Chuyển động tức thời của một vách thật có thể tạo chồng chập các mức.\n+++\n\n> [Thử ngay] [[Khôi phục hộp 1 nm|thu]]",
        "thuThach": {
          "de": "Kéo vách để mức cơ bản còn 1/4 mức tham chiếu, sai số 0,02 theo đơn vị mức tham chiếu.",
          "goiY": "Hãy tăng chiều rộng lên khoảng hai lần."
        }
      },
      {
        "ten": "Đếm vị trí từng lượt",
        "noiDung": "Các dấu sáng là những lượt đo vị trí trên những bản chuẩn bị độc lập. Sau nhiều lượt, các cụm dấu tập trung dọc theo các bụng mật độ. Tiếng tách minh họa phát hiện; khi phát nhanh chỉ lấy một phần nhịp để nghe.\n\nNếu hai người bắt đầu với màn sạch, vị trí vài chấm đầu của họ thường khác nhau. Điều hai người có thể so là tỷ lệ ở cùng một khoảng. Khi số mẫu tăng, tần suất thường tiến gần diện tích lý thuyết; một dãy chấm ngắn chưa thể cho dạng mây hoàn chỉnh.\n\n$$ f_j=N_j/N $$\n\n+++ Đi sâu · Một phép lấy mẫu\nCác chấm ở độ sâu khác nhau chỉ để tách chấm trên hình. Chỉ tọa độ dọc theo chiều dài hộp là kết quả của phép đo một chiều.\n+++\n\n> [Thử ngay] [[Xóa mẫu và đếm lại|thu]]"
      },
      {
        "ten": "Hình đứng yên, pha vẫn đổi",
        "noiDung": "Một trạng thái riêng năng lượng có mật độ không đổi theo thời gian. Toàn bộ hàm sóng được nhân với cùng một pha, nên bình phương độ lớn triệt mọi phụ thuộc pha đó.\n\nMuốn quan sát ảnh hưởng vật lý của pha theo thời gian, có thể so các thành phần khác năng lượng trong một trạng thái chồng chập. Trong bài này mỗi lần chuẩn bị luôn chọn một mức duy nhất, vì thế đừng chờ các bụng mật độ chuyển qua chuyển lại. Trên bàn, đường lam phập phồng nhưng dải vàng đứng yên; thứ thay đổi theo từng lần đo là các dấu đếm mới.\n\n$$ \\Psi(x,t)=\\psi_n(x)e^{-iE_nt/\\hbar} $$\n\n+++ Đi sâu · Đối chiếu với số đếm\nỞ bước này, đường lam là phần thực của $\\Psi$: nó phập phồng tại chỗ theo pha $e^{-iE_nt/\\hbar}$, nhịp trên hình được làm chậm rất nhiều. Các nút đứng yên và dải vàng không đổi. Pha chung này không đo được bằng phép đo vị trí. Tần suất của các phép đo lặp vẫn dao động quanh xác suất; sự dao động thống kê ấy khác với sự tiến triển pha.\n+++\n\n> [Thử ngay] [[Đếm lại ở n = 3|thu]]",
        "thuThach": {
          "de": "Ở n = 3, kéo đầu đọc đến nút trong bên trái, sai lệch dưới 0,025 lần chiều rộng.",
          "goiY": "Tìm chỗ đổi dấu đầu tiên sau vách trái."
        }
      }
    ],
    "congThuc": [
      {
        "ten": "Hàm sóng",
        "tex": "\\psi_n(x)=\\sqrt{2/L}\\sin(n\\pi x/L)",
        "y": "Chuẩn hóa trong hộp."
      },
      {
        "ten": "Mật độ",
        "tex": "\\rho_n=|\\psi_n|^2",
        "y": "Diện tích dưới mật độ là xác suất."
      },
      {
        "ten": "Năng lượng",
        "tex": "E_n=n^2h^2/(8mL^2)",
        "y": "Mức tham chiếu dùng n = 1, L = 1 nm."
      }
    ],
    "cauHoi": [
      {
        "hoi": "Tăng n từ 1 lên 3 khi giữ L. Năng lượng tăng bao nhiêu lần?",
        "chon": [
          "3",
          "9",
          "6"
        ],
        "dung": 1,
        "giai": "Năng lượng tỉ lệ với n bình phương."
      },
      {
        "hoi": "Ở n = 2, mật độ tại tâm bằng bao nhiêu?",
        "chon": [
          "0",
          "1/L",
          "2/L"
        ],
        "dung": 0,
        "giai": "Tại tâm có một nút hàm sóng."
      },
      {
        "hoi": "Giữ n, tăng gấp đôi L. Năng lượng đổi theo hệ số nào?",
        "chon": [
          "2",
          "1/2",
          "1/4"
        ],
        "dung": 2,
        "giai": "Năng lượng tỉ lệ nghịch với bình phương bề rộng."
      },
      {
        "hoi": "Vì sao một nhánh âm vẫn có nhiều hạt được phát hiện?",
        "dap": "Vì mật độ là bình phương độ lớn, phụ thuộc độ lớn của nhánh."
      },
      {
        "hoi": "Đại lượng nào quyết định xác suất trong một đoạn?",
        "dap": "Tích phân mật độ trên đoạn đó."
      }
    ],
    "docThem": [
      "OpenStax, University Physics, Vol. 3, §7.4, The Quantum Particle in a Box.",
      "D. J. Griffiths & D. F. Schroeter, Introduction to Quantum Mechanics, 3rd ed., Ch. 2."
    ],
    "thuatNgu": []
  }
};
