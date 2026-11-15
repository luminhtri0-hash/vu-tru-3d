// Lõi ứng dụng, phần bố cục màn hình: các vùng của cửa sổ đang bị giao diện che (để nhãn trên mô hình và nhãn gợi ý kéo
// tránh, xem bo-nhan.js) và dòng gợi ý thao tác dưới thanh trên.
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { boNhan } from './bo-nhan.js';
import { $ } from './ung-dung-luu.js';

export const PT_BO_CUC = {
  // Đọc lại các vùng đang bị che: bảng bài giảng, các khối của thanh trên, ô số liệu, dòng gợi ý; ở chế độ «Xem như
  // video» là thẻ tên bước, phụ đề, thanh điều khiển, thẻ hết bài. Việc này đọc bố cục của trang nên chỉ làm vài lần mỗi
  // giây, ở ĐẦU khung hình (lúc trang chưa bị sửa gì, đọc không tốn), và ngay khi bố cục đổi (đổi cỡ cửa sổ, ẩn hiện bảng).
  // Vùng «mềm» (số 1 ở cuối) là vùng nhỏ: nhãn có điểm neo nằm dưới nó được đẩy ra mép vùng thay vì ẩn.
  _capNhatVungChe() {
    const ds = [];
    const them = (el, mem = 0) => {
      if (!el || el.hidden) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.right <= 0 || r.bottom <= 0 || r.left >= this.rong || r.top >= this.cao) return;
      ds.push([r.left, r.top, r.right, r.bottom, mem]);
    };
    const lop = document.body.classList;
    if (lop.contains('xem-video')) {
      const xv = this.xemVideo?.el;
      if (xv) {
        if (xv.the.classList.contains('mo')) them(xv.the, 1);
        if (!xv.phuDe.hidden && xv.phuDe.textContent) them(xv.phuDe, 1);
        if (!xv.het.hidden) them(xv.het, 1);
        if (!lop.contains('xv-an-dk')) { them(xv.dk); them(xv.thoat); }
      }
    } else if (!lop.contains('dang-chao')) {
      if (!lop.contains('an-bang')) them($('bai-hoc'));
      them($('nut-muc-luc')); them($('chon-bai')); them($('ngon-ngu-tren')); them($('nut-phai'));
      if (!this.el.goiY.classList.contains('mo')) them(this.el.goiY, 1);
    }
    them(this.el.hud, 1);
    boNhan.datVung(ds, this.rong, this.cao);
    boNhan.doLai();
  },

  // Dòng gợi ý thao tác («Kéo để xoay · Cuộn để phóng to…»): hiện vài giây khi người học vừa vào bài lần đầu, tắt ngay
  // khi họ bắt đầu kéo mô hình. Trong lúc hiện, nó là một vùng che nên nhãn của bài không nằm đè lên.
  // Lượt chạy im lặng (chụp ảnh, tự kiểm) không hiện, để ảnh soát bài không dính dòng này; thêm ?goiy=1 nếu muốn chụp nó.
  hienGoiY(giay = 9) {
    if (this.imLang && !new URLSearchParams(location.search).has('goiy')) return;
    clearTimeout(this._henGoiY);
    this.el.goiY.classList.remove('mo');
    this._vungCho = 0;
    this._henGoiY = setTimeout(() => { this.el.goiY.classList.add('mo'); this._vungCho = 0; }, giay * 1000);
  },
};
