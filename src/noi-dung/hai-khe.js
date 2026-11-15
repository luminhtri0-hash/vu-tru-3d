// Bài 21. Các tham số vào bước đều được đặt lại bởi c.buoc(i).
const R = String.raw;
export const noiDungHaiKhe = {
  ten: 'Hai khe: từng electron tạo nên vân giao thoa',
  moTa: 'Tích từng chấm trên màn, thay khoảng cách khe và thử đánh dấu đường đi.',
  yChinh: 'Một electron để lại một chấm. Sau nhiều lần lặp với cùng cách chuẩn bị, mật độ chấm hiện thành vân. Khi hai đường qua khe không phân biệt được, ta cộng các biên độ rồi mới tính xác suất.',
  giaiThich: 'Hình mô phỏng một chùm electron đơn sắc tới vuông góc hai khe giống nhau. Người học điều chỉnh bước sóng, khoảng cách khe và mức phân biệt đường đi. Màn ghi những lần phát hiện riêng lẻ, còn đường cong cho thấy phân bố dự đoán. Cả nguồn, khe và màn đều được phóng đại theo những tỉ lệ khác nhau. Các thông số trong bài là lựa chọn cho thí nghiệm số.',
  conSo: ['Với bước sóng **50 pm**, hai tâm khe cách **200 nm** và màn cách **1 m**, chu kỳ vân là **0,25 mm** trong gần đúng góc nhỏ.', 'Khe rộng **50 nm** cho điểm triệt tiêu đầu tiên của bao nhiễu xạ ở **1 mm** tính từ tâm.'],
  hieuDung: 'Một hình vân cần nhiều electron. Từng electron vẫn được ghi ở một vị trí riêng. Mô hình cho phép tính phân bố các vị trí đó mà không cần gán cho mỗi hạt một quỹ đạo cổ điển từ nguồn đến màn.',
  nguon: 'Trí Lữ soạn. R. P. Feynman, R. B. Leighton và M. Sands, The Feynman Lectures on Physics, tập III, chương 1, mục 1–4 đến 1–7. OpenStax, University Physics, tập 3, mục 4.3 và 6.5. Các kích thước là tham số mô phỏng.',
  baiGiang: {
    mucTieu: ['Phân biệt một lần phát hiện với phân bố tích lũy sau nhiều lần.', 'Tính khoảng vân và vị trí triệt tiêu khi biết bước sóng, khoảng cách khe và khoảng cách đến màn.', 'Dự đoán sự thay đổi của phân bố khi thiết bị lưu được thông tin electron đi qua khe nào.'],
    buoc: [
      {
        ten: 'Mỗi lần phát hiện, một chấm',
        noiDung: R`Nguồn chuẩn bị các electron có cùng {{bước sóng de Broglie}}. Một tấm chắn có hai khe đặt trước màn ghi. Mỗi electron được ghi bằng **một chấm**. Tiếng tách minh họa một lần ghi nhận; khi chạy nhanh, mô hình chỉ phát một phần các tiếng để dễ nghe.

Nếu có $N$ lần ghi nhận và ô nhỏ thứ $j$ hứng được $n_j$ lần, tần suất của ô đó là $f_j=n_j/N$. Ta có thể đếm chính xác số chấm mà vẫn chưa biết chấm tiếp theo sẽ ở đâu.

+++ Đi sâu · Hình thể hiện điều gì?
Hai khe và màn được phóng đại để có thể nhìn và kéo. Chấm xuất hiện ngay ở nơi phát hiện. Độ cao của chấm chỉ giúp tách các dấu đếm; bài này tính phân bố theo phương ngang của màn.
+++

> [Thử ngay] [[Xóa màn và ghi 1 electron|mot]] rồi [[Ghi thêm 1 electron|them]]. Bấm lại vài lần và so vị trí các chấm.`,
        vao: (c) => c.buoc(0), nut: { mot: (c) => c.tungHat(true), them: (c) => c.tungHat(false) },
      },
      {
        ten: 'Từ chấm rời đến những dải sáng',
        noiDung: R`Để nguyên cả hai khe và cho nguồn phát liên tục. Ban đầu, các chấm có vẻ rải lộn xộn. Sau nhiều lượt, những dải có mật độ cao xuất hiện xen giữa những dải rất thưa. Hiện tượng đó là {{giao thoa lượng tử}}. Vân có thể hình thành ngay cả khi các electron lần lượt đi qua thiết bị.

+++ Đi sâu · Sai số đếm giảm chậm
Nếu xác suất vào một ô là $p$ và các lượt độc lập, độ lệch chuẩn của tần suất bằng $\sqrt{p(1-p)/N}$. Tăng số lượt lên bốn lần làm độ dao động điển hình của tần suất giảm còn một nửa. Màn chỉ giữ những dấu mới nhất khi đầy.
+++

> [Thử ngay] [[Ghi nhanh|nhanh]], quan sát các khoảng tối, rồi [[Bắt đầu tích lại|lai]].`,
        vao: (c) => c.buoc(1), nut: { nhanh: (c) => c.tocDo(120), lai: (c) => c.xoa() },
      },
      {
        ten: 'Che một khe, rồi mở lại',
        noiDung: R`Khi chỉ mở một khe rộng $a$, phân bố trên màn có một vùng cao ở giữa và các thùy nhỏ ở hai bên. Ta đang nhìn sự nhiễu xạ qua **một khe có bề rộng hữu hạn**. Với màn xa và góc nhỏ, khoảng cách từ tâm đến điểm tối đầu tiên là $x_0=\lambda L/a$.

+++ Đi sâu · Vết bao và các vân nhỏ
Đặt $\beta=\pi ax/(\lambda L)$. Mật độ tương đối của một khe là $(\sin\beta/\beta)^2$ với giá trị giới hạn bằng một tại tâm. Hệ số này cũng tạo thành đường bao ngoài cùng khi mở cả hai khe. Mỗi lần đổi cách bố trí, màn được xóa để các lượt đếm thuộc cùng một thí nghiệm.
+++

> [Thử ngay] [[Chỉ mở một khe|motkhe]] rồi [[Mở cả hai khe|haikhe]]. So khoảng cách giữa các vùng tối trong hai hình.`,
        vao: (c) => c.buoc(2), nut: { motkhe: (c) => c.doi({ hai: false }), haikhe: (c) => c.doi({ hai: true }) },
      },
      {
        ten: 'Vì sao có nơi không hứng được hạt?',
        noiDung: R`Tại một điểm trên màn, mỗi khe đóng góp một {{biên độ xác suất}}. Nếu không phân biệt hai khả năng qua khe, xác suất tỉ lệ với $|A_1+A_2|^2$. Hai biên độ bằng nhau và cùng pha cho kết quả lớn. Khi lệch pha nửa vòng, chúng triệt tiêu.

Ở cấu hình đầu bước, hai vân sáng của riêng thừa số giao thoa cách nhau **0,25 mm**. Đi sang phải nửa khoảng đó sẽ tới nút tối đầu tiên.

+++ Đi sâu · Dùng con trỏ để đọc pha
Với góc nhỏ, hiệu đường đi là $\delta\simeq dx/L$ và độ lệch pha là $\phi=2\pi\delta/\lambda$. Tại $x=0{,}125\ \mathrm{mm}$, $\delta=\lambda/2$ và $\phi=\pi$. Một khe mở riêng vẫn cho tín hiệu ở đây.
+++

> [Thử ngay] [[Nhìn thẳng vào màn|man]]. Kéo đầu đọc màu vàng dọc màn và theo dõi mật độ tương đối.`,
        vao: (c) => c.buoc(3), nut: { man: (c) => c.nhinMan() },
        thuThach: { de: 'Kéo đầu đọc tới nút tối gần tâm nhất về bên phải. Dung sai 0,015 mm.', goiY: 'Đầu đọc cần nằm ở nửa khoảng vân tính từ tâm màn.', giu: 0.45, kiem: (c) => c.dat('toi') },
      },
      {
        ten: 'Kéo hai khe, dự đoán khoảng vân',
        noiDung: R`Hai tâm khe cách nhau $d$. Ở vùng góc nhỏ, thừa số giao thoa lặp lại sau mỗi khoảng $\Delta x=\lambda L/d$. Khi hai khe xa nhau hơn, cùng một độ dời trên màn tạo ra độ lệch pha lớn hơn. Vì vậy các vân xích lại gần nhau.

+++ Đi sâu · Thử tính trước khi kéo
Ở $L=1\ \mathrm{m}$ và $\lambda=50\ \mathrm{pm}$, nếu $d$ tăng từ $200$ lên $400\ \mathrm{nm}$ thì $\Delta x$ giảm từ $0{,}25$ xuống $0{,}125\ \mathrm{mm}$. Vị trí chính xác của đỉnh dưới đường bao có thể xê dịch nhẹ; công thức cho chu kỳ của thừa số giao thoa.
+++

> [Thử ngay] [[Nhìn toàn bộ dụng cụ|toan]]. Kéo núm xanh ở tấm chắn để dời hai khe đối xứng.`,
        vao: (c) => c.buoc(4), nut: { toan: (c) => c.nhinToan() },
        thuThach: { de: 'Giữ bước sóng 50 pm và kéo hai khe để khoảng vân bằng 0,125 mm, sai lệch dưới 0,006 mm.', goiY: 'Để khoảng vân giảm một nửa, cần tăng gấp đôi khoảng cách hai tâm khe.', giu: 0.45, kiem: (c) => c.dat('khe') },
      },
      {
        ten: 'Bước sóng của electron',
        noiDung: R`Bước sóng liên hệ với động lượng của electron theo $\lambda=h/p$. Khi tăng động lượng, bước sóng ngắn lại. Giữ nguyên các kích thước của thiết bị thì khoảng vân cũng giảm.

+++ Đi sâu · Hai thay đổi dễ nhầm
Tăng khoảng cách hai khe chỉ làm các vân nhỏ sít hơn. Giảm bước sóng làm **cả khoảng vân và bề rộng vùng nhiễu xạ giữa** cùng giảm. Với cấu hình đầu bước, giảm bước sóng từ 50 xuống 25 pm làm khoảng vân đổi từ 0,25 xuống 0,125 mm và điểm tối của bao dịch từ 1 về 0,5 mm.
+++

> [Thử ngay] [[Tăng gấp đôi động lượng|nhan]] rồi [[Trở lại 50 pm|goc]]. So vị trí hai đường bao trước và sau khi đổi.`,
        vao: (c) => c.buoc(5), nut: { nhan: (c) => c.doi({ lambda: 25 }), goc: (c) => c.doi({ lambda: 50 }) },
      },
      {
        ten: 'Khi thiết bị lưu được đường đi',
        noiDung: R`Giả sử một bộ đánh dấu gắn hai trạng thái khác nhau vào hai đường. Nếu hai dấu phân biệt hoàn toàn, phát hiện electron ở cùng vị trí vẫn có thể đi kèm hai trạng thái đánh dấu khác nhau. Khi cộng các lượt ghi trên màn, số hạng giao thoa biến mất. Chẳng cần ai đọc dấu đã lưu.

+++ Đi sâu · Độ chồng lấp của hai dấu
Trong mô hình hai khe nhận cường độ bằng nhau, hệ số $V$ là độ lớn chồng lấp giữa hai trạng thái đánh dấu. Phân bố có dạng $P(x)\propto(\sin\beta/\beta)^2[1+V\cos\phi]$. Hai dấu giống nhau cho $V=1$; hai dấu trực giao cho $V=0$. Màn vẫn giữ đường bao nhiễu xạ một khe ở cả hai đầu thang.
+++

> [Thử ngay] [[Đánh dấu hoàn toàn|danh]] rồi [[Xóa khả năng phân biệt trước khi phát hạt mới|bo]]. Kéo đầu đọc để kiểm tra vùng từng là nút tối.`,
        vao: (c) => c.buoc(6), nut: { danh: (c) => c.doi({ v: 0 }), bo: (c) => c.doi({ v: 1 }) },
        thuThach: { de: 'Đặt hai dấu hoàn toàn phân biệt, rồi kéo đầu đọc về bên phải tới vị trí nút tối cũ 0,125 mm (dung sai 0,015 mm).', goiY: 'Ở V = 0, điểm này được lấp sáng. Vẫn phải đặt đầu đọc vào đúng tọa độ cũ.', giu: 0.45, kiem: (c) => c.dat('dau') },
      },
      {
        ten: 'Đọc kết quả của một thí nghiệm mù',
        noiDung: R`Nhìn vào các dấu đếm trước khi hiện đường dự đoán. Khoảng cách các dải cho biết tỉ số $\lambda/d$ khi đã biết $L$. Độ rõ của các dải cho biết hai đường còn có thể giao thoa đến mức nào.

+++ Đi sâu · Điều kiện để suy ra nguyên nhân
Trong thí nghiệm này ta điều khiển riêng từng tham số. Trong phòng thí nghiệm, vân mờ còn có thể do nguồn gồm nhiều bước sóng hoặc do máy rung. Muốn quy sự thay đổi cho phép đánh dấu đường đi, cần giữ ổn định các điều kiện còn lại và so sánh nhiều lượt phát hiện.
+++

> [Thử ngay] [[Chỉ nhìn các chấm|giau]] và dự đoán vị trí các đỉnh. Sau đó [[Đối chiếu với đường lý thuyết|hien]].`,
        vao: (c) => c.buoc(7), nut: { giau: (c) => c.duong(false), hien: (c) => c.duong(true) },
      },
    ],
    congThuc: [
      { ten: 'Bước sóng của hạt', tex: R`\lambda=h/p`, y: 'Động lượng lớn hơn cho bước sóng ngắn hơn.' },
      { ten: 'Cộng hai biên độ', tex: R`P(x)\propto |A_1(x)+A_2(x)|^2`, y: 'Áp dụng khi hai đường không phân biệt được.' },
      { ten: 'Khoảng vân', tex: R`\Delta x=\lambda L/d`, y: 'Hai khe cách nhau d, màn cách L. Dùng ở màn xa với góc nhỏ.' },
      { ten: 'Nút đầu của bao', tex: R`x_0=\lambda L/a`, y: 'a là bề rộng một khe chữ nhật.' },
    ],
    cauHoi: [
      { hoi: 'Giảm nguồn đến mức mỗi lần chỉ có một electron trong thiết bị. Sau rất nhiều lần phát, màn cho hình nào?', chon: ['Nhiều chấm riêng lẻ tích thành vân', 'Mỗi electron tự vẽ trọn một vân', 'Chỉ có hai vạch đúng sau hai khe'], dung: 0, giai: 'Xác suất của từng lần phát hiện phụ thuộc tổng hai biên độ. Các lượt riêng lẻ lấy mẫu từ cùng phân bố đó.' },
      { hoi: 'Giữ nguyên bước sóng và khoảng cách màn, tăng gấp đôi khoảng cách hai khe. Chu kỳ vân thay đổi thế nào?', chon: ['Tăng gấp đôi', 'Giảm còn một nửa', 'Giữ nguyên'], dung: 1, giai: 'Khoảng vân tỉ lệ nghịch với khoảng cách giữa hai khe.' },
      { hoi: 'Tại một nút tối của hai khe, mở riêng từng khe vẫn thu được electron. Đại lượng nào triệt tiêu khi mở cả hai?', chon: ['Điện tích của electron', 'Hai xác suất dương', 'Hai biên độ ngược pha'], dung: 2, giai: 'Các biên độ có pha. Bình phương độ lớn của tổng bằng không khi hai biên độ bằng nhau và ngược pha.' },
      { hoi: 'Vẫn mở hai khe nhưng lưu hai dấu đường đi trực giao. Dạng nào còn lại?', chon: ['Một dải phân bố theo bao nhiễu xạ', 'Các vân rõ hệt như trước', 'Màn ngừng ghi electron'], dung: 0, giai: 'Khi bỏ qua biến đánh dấu, đóng góp từ hai đường cộng theo xác suất. Nhiễu xạ của từng khe vẫn còn.' },
      { hoi: 'Hai cách đều làm khoảng vân giảm một nửa là tăng gấp đôi d và giảm một nửa λ. Dùng thêm dấu hiệu nào để phân biệt?', dap: 'So bề rộng bao nhiễu xạ. Khi a và L cố định, vị trí nút của bao chỉ phụ thuộc λ. Giảm λ làm cả bao hẹp lại, còn đổi d giữ nguyên bao.' },
    ],
    thuatNgu: [
      { vi: 'biên độ xác suất', en: 'probability amplitude', nghia: 'Đại lượng phức dùng để dự đoán xác suất bằng bình phương độ lớn của nó.' },
      { vi: 'giao thoa lượng tử', en: 'quantum interference', nghia: 'Sự tăng hoặc giảm xác suất do các biên độ của những khả năng không phân biệt được cộng với nhau.' },
      { vi: 'bước sóng de Broglie', en: 'de Broglie wavelength', nghia: 'Bước sóng gắn với động lượng p của một hạt theo hệ thức λ = h/p.' },
      { vi: 'thông tin đường đi', en: 'which-path information', nghia: 'Dấu vật lý cho phép phân biệt electron đi qua khe nào.' },
    ],
    docThem: ['Feynman, Leighton và Sands, The Feynman Lectures on Physics, tập III, chương 1, mục 1–4 đến 1–7 (Caltech).', 'OpenStax, University Physics, tập 3, mục 4.3 (hai khe có bề rộng hữu hạn) và mục 6.5 (sóng vật chất).'],
  },
};
