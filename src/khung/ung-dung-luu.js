// Bộ nhớ của trang (localStorage) và vài tiện ích nhỏ dùng chung cho các mô-đun của lõi ứng dụng (ung-dung*.js).
// (Âm thanh tự giữ ba khoá của nó trong am-thanh.js; lựa chọn ngôn ngữ nằm ở ngon-ngu/dich.js.)

export const $ = (id) => document.getElementById(id);
export const KHOA_LUU = 'vu-tru-3d.bai';                 // id bài đang học dở
export const KHOA_RONG = 'vu-tru-3d.rong-bang';          // bề rộng bảng bài giảng (điểm ảnh)
export const KHOA_XONG = 'vu-tru-3d.da-hoc';             // các bài đã đi hết bước (id cách nhau dấu phẩy)
export const KHOA_TT = 'vu-tru-3d.thu-thach';            // các thử thách đã đạt («id bài:số bước»)
export const KHOA_HINH = 'vu-tru-3d.hinh';               // chế độ hình: tu-dong | nhe | cao
export const KHOA_GIONG = 'vu-tru-3d.giong-doc';         // giọng đọc đang chọn
export const KHOA_TU_SANG = 'vu-tru-3d.tu-sang-buoc';    // đọc xong tự sang bước sau

export const luu = {
  doc(k) { try { return localStorage.getItem(k); } catch { return null; } },
  ghi(k, v) { try { localStorage.setItem(k, v); } catch { /* chế độ riêng tư: bỏ qua */ } },
};
export const boDau = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export const phutGiay = (s) => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// Gắn các nhóm phương thức (mỗi mô-đun ung-dung-*.js một nhóm) vào lớp UngDung, như thể chúng được viết ngay trong lớp:
// cùng `this`, cùng tên, không liệt kê được (giống phương thức của lớp).
export function ghepPhuongThuc(Lop, ...nhom) {
  for (const n of nhom) {
    for (const ten of Object.getOwnPropertyNames(n)) {
      Object.defineProperty(Lop.prototype, ten, { value: n[ten], writable: true, configurable: true, enumerable: false });
    }
  }
}
