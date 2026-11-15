// Lõi ứng dụng, phần tự kiểm: đi qua mọi bước của bài đang mở, bấm thử mọi nút, gom lỗi (kiem-tra/tu-kiem.sh đọc kết quả).
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { $ } from './ung-dung-luu.js';

export const PT_TU_KIEM = {
  // ---------- Tự kiểm: đi qua mọi bước của bài đang mở, bấm thử mọi nút, gom lỗi ----------
  tuKiem(soKhung = 60) {
    const dn = this.dsCanh[this.chiSo];
    const ds = this._dsBuoc(dn);
    const kq = { bai: this.soBai(), id: dn.id, ten: dn.ten, soBuoc: ds.length, loi: [] };      // số của bài (Bài 15, 17), không phải thứ tự hiển thị
    const gom = (nhan) => {
      if (!this.el.loi.hidden) this.loiGhi.push(this.el.loi.textContent.slice(0, 500));
      for (const l of this.loiGhi) kq.loi.push(`${nhan}: ${l}`);
      this.loiGhi.length = 0;
    };
    const loiToan = (goc, nhan) => {
      for (const e of goc.querySelectorAll('.katex-error, .loi-toan')) kq.loi.push(`${nhan}: công thức hỏng «${e.textContent.slice(0, 80)}» (${(e.title || '').slice(0, 120)})`);
    };
    this.loiGhi.length = 0;
    for (let j = 0; j < 10; j++) this.buoc(1 / 60);
    gom('Mở bài');
    for (let k = 0; k < ds.length && this.canh; k++) {
      this.moBuoc(k);
      for (let j = 0; j < soKhung; j++) this.buoc(1 / 60);
      if (ds[k].thuThach) {
        if (typeof ds[k].thuThach.kiem !== 'function' || !ds[k].thuThach.de) kq.loi.push(`Bước ${k + 1}: thử thách thiếu «de» hoặc «kiem»`);
        else if (this._tt?.xong) kq.loi.push(`Bước ${k + 1}: thử thách đạt ngay khi vừa vào bước (phải cần thao tác của người học mới đạt)`);
      }
      for (const nut of [...$('buoc-noi-dung').querySelectorAll('.nut-thu')]) {
        nut.click();
        for (let j = 0; j < 30; j++) this.buoc(1 / 60);
      }
      loiToan($('buoc-noi-dung'), `Bước ${k + 1}`);
      gom(`Bước ${k + 1} «${ds[k].ten}»`);
    }
    for (const s of this.el.bang.querySelectorAll('.trang:not([data-trang="hoc"])')) loiToan(s, `Trang ${s.dataset.trang}`);
    if (!this.canh) kq.loi.push('Cảnh đã dừng vì lỗi.');
    kq.hud = this.el.hud.innerText.slice(0, 300);
    return kq;
  },
};
