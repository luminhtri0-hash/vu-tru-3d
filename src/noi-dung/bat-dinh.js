// Lời giảng tiếng Việt. Nút và thử thách do cảnh đảm nhiệm.
export default {
  "ten": "Nguyên lý bất định: bó sóng Gauss",
  "moTa": "Thu hẹp gói vị trí và xem phổ động lượng trải rộng.",
  "yChinh": "Vị trí và động lượng là hai cách biểu diễn cùng một trạng thái. Với gói Gauss không có pha bậc hai, tích hai độ lệch chuẩn đạt giới hạn nhỏ nhất.",
  "giaiThich": "Hai đường là hai mật độ chuẩn hóa trên trục riêng. Đường xanh đo vị trí bằng nm, đường vàng đo động lượng theo đơn vị ℏ/nm. Hai dãy chấm được lấy từ hai nhóm hạt chuẩn bị giống nhau.",
  "conSo": [
    "Với σx = 1 nm, gói cực tiểu có σp = 0,5 ℏ/nm.",
    "Electron có σx = 1 nm thì độ lệch chuẩn vận tốc khoảng 58 km/s; để trôi tự do khoảng 30 fs gói rộng gấp đôi."
  ],
  "hieuDung": "Độ bất định là độ phân tán nội tại của các lần đo trên cùng cách chuẩn bị. Từng thiết bị còn có thể có sai số riêng.",
  "nguon": "Trí Lữ soạn. OpenStax, University Physics, tập 3, mục 7.2. D. J. Griffiths và D. F. Schroeter, Introduction to Quantum Mechanics, chương 1 và 2.",
  "baiGiang": {
    "mucTieu": [
      "Đọc giá trị trung bình và độ lệch chuẩn trên hai trục.",
      "Dự đoán tác dụng của việc dịch tâm và đổi độ rộng.",
      "Tạo một gói có tích bất định lớn hơn giới hạn ℏ/2 mà mật độ vị trí không đổi.",
      "Giải thích vì sao gói tự do loang ra theo thời gian trong khi độ rộng động lượng giữ nguyên."
    ],
    "buoc": [
      {
        "ten": "Hai nhóm hạt, một trạng thái",
        "noiDung": "Chuẩn bị nhiều bản của một trạng thái. Đo vị trí trên một nhóm, động lượng trên nhóm kia. Mỗi chấm là kết quả của một lần đo; tiếng tách minh họa số đếm và được giới hạn nhịp.\n\nCó thể chuẩn bị bằng cùng một nguồn và đặt detector khác nhau trong những lượt thử khác nhau. Hai chấm nằm thẳng hàng trên hình không tạo thành một cặp kết quả của cùng hạt. Hãy quan sát độ dày của cả dãy điểm quanh tâm và so nó với khoảng giữa hai dấu trên từng trục.\n\n$$ \\int \\rho_x(x)\\,dx=\\int \\rho_p(p)\\,dp=1 $$\n\n+++ Đi sâu · Các trục\nCả hai phân bố đều có diện tích bằng một. Chiều cao thuộc hai đơn vị khác nhau, nên hãy so bề rộng trên đúng trục.\n+++\n\n> [Thử ngay] [[Đo lại hai nhóm|thu]]"
      },
      {
        "ten": "Đo bề rộng",
        "noiDung": "Hai dấu hai bên tâm cách tâm đúng một độ lệch chuẩn. Một kết quả riêng lẻ có thể nằm ngoài hai dấu này.\n\nGiả sử em chỉ nhìn khoảng cách giữa chấm ngoài cùng bên trái và chấm ngoài cùng bên phải. Giá trị này dễ tăng khi chạy lâu vì có thêm cơ hội xuất hiện một chấm xa tâm. Độ lệch chuẩn dùng toàn bộ phân bố nên diễn tả đặc trưng của cách chuẩn bị tốt hơn hai chấm hiếm ấy.\n\n$$ \\sigma_x^2=\\langle(x-\\langle x\\rangle)^2\\rangle $$\n\n+++ Đi sâu · Vì sao bình phương?\nĐộ lệch trái và phải có thể triệt nhau khi lấy trung bình. Bình phương giữ lại độ lớn của cả hai phía.\n+++\n\n> [Thử ngay] [[Đặt σx = 1 nm|thu]]"
      },
      {
        "ten": "Ép gói hẹp lại",
        "noiDung": "Dải vị trí hẹp cần nhiều sóng thành phần với các số sóng khác nhau để chồng lên nhau. Do động lượng tỉ lệ với số sóng, phổ động lượng rộng ra.\n\nKéo dấu bên phải của dải vị trí về sát tâm. Đường xanh phải cao lên, vì số hạt không đổi mà tập trung hơn. Nếu tưởng phổ vàng cũng co lại, hãy nhìn hai dấu vàng cách nhau bao xa trước và sau khi kéo. Từ hình em có thể chỉ ra đại lượng nào trở nên dễ dự đoán hơn.\n\n$$ p=\\hbar k $$\n\n+++ Đi sâu · Gói cực tiểu\nỞ pha bậc hai bằng không, giảm một nửa σx làm σp tăng gấp đôi. Đỉnh xanh nhô cao để giữ nguyên diện tích.\n+++\n\n> [Thử ngay] [[So với gói ban đầu|thu]]",
        "thuThach": {
          "de": "Kéo dấu xanh để σp = 1 ℏ/nm, với sai lệch dưới 0,05 ℏ/nm.",
          "goiY": "Khi pha bậc hai bằng không, thử σx gần 0,5 nm."
        }
      },
      {
        "ten": "Dịch tâm vị trí",
        "noiDung": "Dời toàn bộ trạng thái sang phải làm tâm vị trí dịch theo. Phân bố động lượng giữ nguyên hình và tâm.\n\nTa có thể kiểm điều này ngay bằng hai lần quan sát bảng số. Lần đầu ghi độ rộng động lượng; lần sau dời tâm vị trí sang phải rồi đọc lại cùng ô. Các chấm mới được lấy mẫu nên không còn trùng với chấm cũ. Dạng phân bố và ô độ rộng mới là những thứ cần đối chiếu.\n\n$$ \\psi(x)\\longrightarrow\\psi(x-x_0) $$\n\n+++ Đi sâu · Pha trong phổ\nPhép tịnh tiến nhân biên độ trong không gian động lượng với một thừa số pha. Mật độ động lượng lấy bình phương độ lớn nên thừa số ấy biến mất.\n+++\n\n> [Thử ngay] [[Dời tâm thêm 1 nm|thu]]"
      },
      {
        "ten": "Thêm động lượng trung bình",
        "noiDung": "Nhân hàm sóng vị trí với một pha tuyến tính đẩy phổ động lượng sang bên. Bề rộng vị trí không đổi. Hai phân bố trên bàn luôn được tính từ cùng trạng thái.\n\nTay nắm vàng nằm ở tâm phổ động lượng. Kéo nó là dời cả đường vàng sang bên: đỉnh đổi chỗ, còn hai dấu vàng đi theo đỉnh mà không xa nhau thêm. Đường xanh không đổi chút nào, vì mật độ vị trí không thấy được pha tuyến tính. Pha ấy vẫn có hậu quả thật: gói nhận vận tốc trung bình p₀/m và sẽ trôi đi khi cho thời gian chạy ở Bước 9.\n\n$$ \\psi(x)\\longrightarrow e^{ip_0x/\\hbar}\\psi(x) $$\n\n+++ Đi sâu · Tâm và độ rộng\nTăng động lượng trung bình không nhất thiết tăng độ bất định động lượng. Độ bất định đo độ lệch quanh tâm mới.\n+++\n\n> [Thử ngay] [[Trả tâm động lượng về 0|thu]]",
        "thuThach": {
          "de": "Kéo tâm vàng đến +1 ℏ/nm, giữ σx = 1 nm. Dung sai động lượng 0,08 ℏ/nm.",
          "goiY": "Tay nắm vàng dời tâm của phổ dưới."
        }
      },
      {
        "ten": "Tích nhỏ nhất",
        "noiDung": "Mọi trạng thái thỏa bất đẳng thức vị trí và động lượng. Gói Gauss có pha tuyến tính có thể chạm dấu bằng. Đổi chiều rộng chỉ chuyển độ phân tán từ đại lượng này sang đại lượng kia.\n\nThử tạo hai gói nằm ở hai điểm rất khác nhau trên trục vị trí rồi trả về cùng độ rộng. Khi C bằng không, các tích trong bảng giống nhau. Hãy dùng thí nghiệm này để phân biệt “không biết tâm được đặt ở đâu” với “đã biết tâm nhưng các kết quả vẫn phân tán khi lặp lại”.\n\n$$ \\sigma_x\\sigma_p\\geq\\hbar/2 $$\n\n+++ Đi sâu · Giới hạn đến từ đâu?\nVị trí và động lượng là các toán tử không giao hoán. Với độ lệch chuẩn, hệ thức giao hoán xác định giới hạn này cho bất kỳ trạng thái chuẩn hóa nào có phương sai hữu hạn.\n+++\n\n> [Thử ngay] [[Chọn gói rộng|thu]]"
      },
      {
        "ten": "Tích lớn hơn giới hạn",
        "noiDung": "Đặt hệ số pha bậc hai C khác không. Pha biến đổi nhanh hơn ở xa tâm. Mật độ vị trí vẫn là Gauss cũ nhưng phổ động lượng rộng hơn.\n\nĐây là một cách tạo hai trạng thái có ảnh chụp mật độ vị trí giống nhau nhưng khác về vật lý. Trước khi gạt C, ghi lại khoảng giữa hai dấu vàng. Khi tăng độ lớn của C, phổ động lượng trải rộng trong khi dải xanh giữ nguyên. Pha chứa thông tin mà ảnh vị trí đã bỏ đi.\n\n$$ \\sigma_x\\sigma_p=\\frac{\\hbar}{2}\\sqrt{1+C^2} $$\n\n+++ Đi sâu · Định nghĩa C\nThừa số pha thêm vào là $e^{iC(x-x_0)^2/(4\\sigma_x^2)}$. Cả hai dấu của C đều tạo cùng tích bất định, nhưng C dương ứng với gói đang loang ra, C âm ứng với gói đang hội tụ (xem Bước 9).\n+++\n\n> [Thử ngay] [[Thử C = 1|thu]]"
      },
      {
        "ten": "Phân biệt hai thao tác chuẩn bị",
        "noiDung": "Thay đổi bề rộng và thêm pha là hai thao tác khác nhau. Chỉ nhìn đường vị trí có thể bỏ sót pha; đọc cả phổ động lượng giúp phân biệt những trạng thái có mật độ vị trí như nhau.\n\nĐưa mô hình về gói cực tiểu, kéo để có bề rộng vị trí mong muốn, rồi lưu ý cả hai ô độ rộng. Tiếp theo giữ bề rộng xanh và chỉnh C. Nếu chỉ một độ rộng tăng thì điều này vẫn phù hợp với nguyên lý: bất đẳng thức chỉ đặt một cận dưới, chứ không buộc mọi trạng thái phải chạm cận đó.\n\n$$ \\sigma_p=\\frac{\\hbar}{2\\sigma_x}\\sqrt{1+C^2} $$\n\n+++ Đi sâu · Đại lượng phụ thuộc cách chuẩn bị\nC thuộc pha của trạng thái. Gạt C về không đưa mô hình về họ gói cực tiểu, sau đó kéo độ rộng để thử lại giới hạn.\n+++\n\n> [Thử ngay] [[Đưa C về 0|thu]]",
        "thuThach": {
          "de": "Đưa C về 0 rồi kéo dấu xanh đến σx = 1,5 nm, trong 0,06 nm.",
          "goiY": "Đọc σx trên thanh độ rộng và tích ở bảng số liệu."
        }
      },
      {
        "ten": "Gói tự do loang ra theo thời gian",
        "noiDung": "Thả gói cực tiểu cho electron bay tự do, không có lực nào tác dụng. Đường vàng đứng yên: không có lực thì động lượng của từng thành phần không đổi, nên σp giữ nguyên. Đường xanh thì bè ra và thấp xuống.\n\nLý do nằm ngay ở độ rộng động lượng. Gói chứa cả thành phần nhanh lẫn thành phần chậm, vận tốc lệch nhau cỡ $\\sigma_v=\\sigma_p/m$. Sau thời gian t, chúng tách xa nhau thêm cỡ $\\sigma_v t$. Trong lúc đó pha bậc hai tự sinh ra: C tăng dần từ 0, nên tích σxσp lớn dần hơn ℏ/2, đúng như ở Bước 7.\n\n$$ \\sigma_x(t)=\\sigma_x\\sqrt{1+\\left(\\frac{\\hbar t}{2m\\sigma_x^2}\\right)^2} $$\n\n> [Ví dụ] Electron có σx = 1 nm thì σv khoảng 58 km/s. Sau khoảng 17 fs gói rộng $\\sqrt2$ nm, sau khoảng 30 fs rộng 2 nm. Gói hẹp 0,5 nm loang nhanh gấp bốn lần: thời gian đặc trưng chỉ còn khoảng 4,3 fs.\n\n> [Hiểu sai thường gặp] Gói loang ra không phải vì electron «bị nhòe» hay vì máy đo kém đi. Phân bố động lượng có sẵn từ lúc chuẩn bị; thời gian chỉ biến độ phân tán động lượng thành độ phân tán vị trí.\n\n+++ Đi sâu · C âm: gói hội tụ trước khi loang\nKhi C dương, các thành phần ở rìa có vận tốc hướng ra ngoài: gói đang loang. Khi C âm, vận tốc ở rìa hướng vào tâm: gói hẹp lại tới đúng giới hạn ℏ/2 rồi mới loang. Công thức chung là $\\sigma_x^2(t)=\\sigma_x^2+(\\hbar/m)Ct+(\\sigma_p t/m)^2$, còn hệ số pha mới là $C(t)=C+2(\\sigma_p/\\hbar)^2(\\hbar/m)t$. Bộ kiểm số của bài tính lại cả hai bằng biến đổi Fourier số.\n+++\n\n> [Thử ngay] [[Thả gói trôi tự do|thu]]",
        "thuThach": {
          "de": "Giữ σx = 1 nm và C = 0 lúc đầu, kéo thời gian tới lúc σx(t) = 2 nm, sai lệch dưới 0,05 nm.",
          "goiY": "Độ rộng gấp đôi khi ℏt/(2mσx²) bằng căn ba, tức khoảng 30 fs."
        }
      }
    ],
    "congThuc": [
      {
        "ten": "Độ rộng động lượng",
        "tex": "\\sigma_p=\\hbar\\sqrt{1+C^2}/(2\\sigma_x)",
        "y": "C là hệ số pha bậc hai."
      },
      {
        "ten": "Mật độ Gauss",
        "tex": "\\rho(x)=\\frac{1}{\\sqrt{2\\pi}\\sigma_x}e^{-(x-x_0)^2/(2\\sigma_x^2)}",
        "y": "x₀ là tâm."
      },
      {
        "ten": "Giới hạn bất định",
        "tex": "\\sigma_x\\sigma_p\\ge\\hbar/2",
        "y": "Dấu bằng cho gói cực tiểu."
      },
      {
        "ten": "Gói tự do loang ra",
        "tex": "\\sigma_x(t)=\\sigma_x\\sqrt{1+\\left(\\frac{\\hbar t}{2m\\sigma_x^2}\\right)^2}",
        "y": "Gói cực tiểu lúc t = 0; σp không đổi theo thời gian."
      }
    ],
    "cauHoi": [
      {
        "hoi": "Giảm một nửa σx của gói cực tiểu. σp thế nào?",
        "chon": [
          "Tăng gấp đôi",
          "Không đổi",
          "Giảm một nửa"
        ],
        "dung": 0,
        "giai": "Tích giữ bằng ℏ/2."
      },
      {
        "hoi": "Dời tâm vị trí thì độ rộng động lượng thay đổi thế nào?",
        "chon": [
          "Tăng",
          "Không đổi",
          "Giảm"
        ],
        "dung": 1,
        "giai": "Phổ chỉ nhận thêm pha."
      },
      {
        "hoi": "Đổi dấu C làm tích thay đổi thế nào?",
        "chon": [
          "Đổi dấu",
          "Bằng 0",
          "Không đổi"
        ],
        "dung": 2,
        "giai": "Tích phụ thuộc C bình phương."
      },
      {
        "hoi": "Gói electron cực tiểu rộng 1 nm trôi tự do khoảng 30 fs. Điều gì đúng?",
        "chon": [
          "σx gấp đôi, σp không đổi",
          "σx gấp đôi, σp giảm một nửa",
          "σx và σp đều không đổi"
        ],
        "dung": 0,
        "giai": "Không có lực nên phân bố động lượng giữ nguyên. Thành phần nhanh và chậm tách xa dần nên σx tăng, và tích lớn hơn ℏ/2. Chọn «σp giảm một nửa» là tưởng tích luôn bằng ℏ/2."
      },
      {
        "hoi": "Vì sao cần hai nhóm hạt?",
        "dap": "Để mỗi phân bố được đo trên cùng cách chuẩn bị ban đầu."
      },
      {
        "hoi": "Dấu bằng có đúng cho mọi trạng thái?",
        "dap": "Chỉ một số trạng thái đạt cực tiểu. C khác không làm tích lớn hơn trong mô hình này."
      }
    ],
    "docThem": [
      "OpenStax, University Physics, Vol. 3, §7.2, The Heisenberg Uncertainty Principle.",
      "D. J. Griffiths & D. F. Schroeter, Introduction to Quantum Mechanics, 3rd ed., Chs. 1–2."
    ],
    "thuatNgu": []
  }
};
