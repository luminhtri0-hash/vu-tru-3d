// Lõi ứng dụng, phần giọng đọc lời giảng: danh sách giọng, tệp tiếng của từng bước, mức âm.
// Việc phát tiếng, phụ đề, tự sang bước nằm cả ở nghe-giang.js (app.nghe); ở đây chỉ là phần dữ liệu mà nó hỏi.
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { chu } from '../ngon-ngu/giao-dien.js';
import { ngonNgu } from '../ngon-ngu/dich.js';
import { luu, KHOA_GIONG } from './ung-dung-luu.js';
import { AM_RONG } from './ung-dung-rong.js';

// Danh sách tệp tiếng (bài nào, bước nào, giọng nào, dài bao nhiêu giây) do build.mjs chèn vào từ giong-doc/danh-sach.json.
// Tệp tiếng nằm ngoài trang, trong thư mục giong-doc/<giọng>/ cạnh tệp HTML. Bộ kiểm có thể đưa một danh sách thử qua
// window.__VT_THU.giongDoc.
/* global __GIONG_DOC__ */
const GIONG_DOC = window.__VT_THU?.giongDoc || (typeof __GIONG_DOC__ !== 'undefined' && __GIONG_DOC__) || null;

// GIỌNG ĐỌC NGƯỜI HỌC CHỌN ĐƯỢC (bảng «Âm thanh và hình», nút giọng trên thanh «Nghe giảng»). Chủ dự án duyệt ngày
// 16/11/2026: hai giọng Google Chirp 3 HD, tốc độ 1,05, dùng cho MỌI thứ tiếng (tên giọng đầy đủ ghép từ mã vùng của thứ
// tiếng trong src/ngon-ngu/danh-sach.json, ví dụ vi-VN-Chirp3-HD-Aoede, ko-KR-Chirp3-HD-Aoede). Muốn thêm, bớt giọng: sửa
// đúng danh sách này (và bảng GIONG trong cong-cu/tao-giong-doc-google.py).
export const DS_GIONG = [
  { ma: 'aoede', ten: 'gd.giong-nu' },         // …-Chirp3-HD-Aoede
  { ma: 'achird', ten: 'gd.giong-nam' },       // …-Chirp3-HD-Achird
];
// Giọng mặc định cho người chưa chọn (chủ dự án chốt ngày 16/11/2026: giọng nữ Aoede). Đổi đúng một dòng này là đủ.
export const GIONG_MAC_DINH = 'aoede';
// Giọng dự phòng: giọng «Algieba» của bản 3.7. Không nằm trong danh sách chọn; chỉ đọc thay khi giọng đang chọn (và giọng
// còn lại) chưa có tiếng cho bước đó. Khi hai giọng mới đã thu đủ thì xoá thư mục giong-doc/algieba là xong.
export const GIONG_DU_PHONG = 'algieba';

// Mỗi mục của giong-doc/danh-sach.json là tiếng của MỘT giọng ở MỘT thứ tiếng: { giong, ngonNgu, bai: { <id>: { tep: […] } } }.
// Tên mục cũng là tên thư mục tiếng: tiếng Việt là tên giọng (giong-doc/aoede/), thứ tiếng khác thêm mã tiếng
// (giong-doc/aoede-en/, giong-doc/aoede-ko/). Mục cũ không ghi `giong`, `ngonNgu` thì hiểu là tên mục và tiếng Việt.
const MUC = {};
for (const [ten, m] of Object.entries(GIONG_DOC || {})) {
  if ((m.ngonNgu || 'vi') === ngonNgu && Object.keys(m.bai || {}).length) MUC[m.giong || ten] = m;
}
const tepCua = (giong, id, k) => MUC[giong]?.bai?.[id]?.tep?.find((t) => t.buoc === k + 1) || null;
// Giọng đã có ít nhất một bài ở thứ tiếng đang chọn.
const coTieng = (giong) => !!MUC[giong];

export const PT_GIONG_DOC = {
  // Giọng đang chọn lúc mở app: lựa chọn đã nhớ nếu còn trong danh sách, không thì giọng mặc định.
  _gdGiongLuu() {
    const nho = luu.doc(KHOA_GIONG);
    return DS_GIONG.some((g) => g.ma === nho) ? nho : GIONG_MAC_DINH;
  },
  // Tệp tiếng của bước k: { tep, giay, phuDe } hoặc null. Không nêu giọng thì lấy giọng đang chọn; giọng đó chưa có tiếng
  // cho bước này thì lấy giọng còn lại trong danh sách, rồi tới giọng dự phòng.
  _gdTep(k = this.chiSoBuoc, giong) {
    const id = this.dsCanh[this.chiSo]?.id;
    if (giong) return tepCua(giong, id, k);
    for (const g of [this._gdGiong, ...DS_GIONG.map((x) => x.ma), GIONG_DU_PHONG]) { const t = tepCua(g, id, k); if (t) return t; }
    return null;
  },
  // Các giọng người học chọn được lúc này: giọng trong DS_GIONG đã có tiếng. Chưa có giọng mới nào thì danh sách rỗng,
  // app đọc bằng giọng dự phòng và không hiện chỗ chọn.
  _gdDsGiong() { return DS_GIONG.filter((g) => coTieng(g.ma)).map((g) => g.ma); },
  _gdTenGiong(ma) { const g = DS_GIONG.find((x) => x.ma === ma); return g ? chu(g.ten) : ma; },
  datGiongDoc(ma) {
    if (!DS_GIONG.some((g) => g.ma === ma) || ma === this._gdGiong) return;
    this._gdGiong = ma;
    luu.ghi(KHOA_GIONG, ma);
    this.nghe.khiDoiGiong();
  },
  // Nghe hoặc tạm dừng lời giảng của bước đang mở (giữ tên cũ cho mã ngoài khung gọi).
  ngheGiang(phat) { this.nghe.phatDung(phat); },
  _gdMucAm() { return this.am === AM_RONG ? 0.8 : Math.min(1, Math.max(0, this.am.mucAm * 1.3)); },
};
