// Cấu trúc khoá học: các phần và thứ tự bài. Mỗi id ứng với một tệp src/canh/<id>.js.
// Tệp này chỉ chứa dữ liệu (không nạp three.js) để build.mjs và bộ kiểm cũng đọc được.

// SỐ CỦA TỪNG BÀI. Lời giảng nhắc nhau bằng số này («như ở Bài 9», hơn 80 chỗ), nên số KHÔNG đổi khi xếp lại thứ tự hiển thị.
export const SO_BAI = ['he-mat-troi', 'ngan-ha', 'chieu-thu-tu', 'duong-the-gioi', 'non-anh-sang', 'lorentz', 'tuong-duong', 'rindler', 'thoi-gian',
  'trac-dia', 'khong-thoi-gian', 'thuy-trieu', 'quy-dao', 'anh-sang', 'lo-den', 'non-lo-den', 'song-hap-dan', 'gian-no', 'vu-tru-4c',
  'quang-dien', 'hai-khe', 'hat-trong-hop', 'bat-dinh', 'orbital-hydro', 'chui-ham',
  'spin-stern-gerlach', 'vuong-viu-bell', 'buc-xa-hawking'];

// THỨ TỰ HIỂN THỊ. Từ 12/11/2026 Bài 15 (Lỗ đen) và Bài 17 (Sóng hấp dẫn) được đưa lên Phần 1, ngay sau Bài 2; các bài
// khác giữ thứ tự cũ.
export const KHOA_HOC = [
  {
    ten: 'Phần 1 · Vũ trụ quanh ta',
    moTa: 'Ta đang ở đâu và đang chuyển động thế nào, rồi hai cảnh ngoạn mục nhất: lỗ đen và sóng hấp dẫn (Bài 15 và Bài 17 đưa lên xem trước; phần lý giải nằm ở các phần sau).',
    bai: ['he-mat-troi', 'ngan-ha', 'lo-den', 'song-hap-dan'],
  },
  {
    ten: 'Phần 2 · Không-thời gian bốn chiều',
    moTa: 'Ba chiều không gian và một chiều thời gian gộp thành một thể thống nhất. Đây là sân khấu của thuyết tương đối.',
    bai: ['chieu-thu-tu', 'duong-the-gioi', 'non-anh-sang', 'lorentz'],
  },
  {
    ten: 'Phần 3 · Trọng lực là hình học',
    moTa: 'Từ nguyên lý tương đương tới phương trình Einstein: vật rơi vì không-thời gian cong, không phải vì bị kéo.',
    bai: ['tuong-duong', 'rindler', 'thoi-gian', 'trac-dia', 'khong-thoi-gian', 'thuy-trieu'],
  },
  {
    ten: 'Phần 4 · Những hệ quả đo được',
    moTa: 'Quỹ đạo xoay dần, ánh sáng bị bẻ cong, nón ánh sáng nghiêng dần quanh lỗ đen: các tiên đoán đã được kiểm chứng. (Lỗ đen và sóng hấp dẫn đã ở Phần 1.)',
    bai: ['quy-dao', 'anh-sang', 'non-lo-den'],
  },
  {
    ten: 'Phần 5 · Vũ trụ học',
    moTa: 'Áp dụng cho cả vũ trụ: không gian giãn nở, chân trời, quá khứ và tương lai.',
    bai: ['gian-no', 'vu-tru-4c'],
  },
  {
    ten: 'Phần 6 · Vật lý lượng tử',
    moTa: 'Từ một hạt tới một phân bố xác suất. Dùng các thí nghiệm để tìm hiểu cách vật chất và ánh sáng hành xử ở thang lượng tử.',
    bai: ['quang-dien', 'hai-khe', 'hat-trong-hop', 'bat-dinh', 'orbital-hydro', 'chui-ham',
      'spin-stern-gerlach', 'vuong-viu-bell', 'buc-xa-hawking'],
  },
];
