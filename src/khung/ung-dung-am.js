// Lõi ứng dụng, phần âm thanh của giao diện: nhạc nền theo phần, nút loa, bảng «Âm thanh» và «Hình».
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { chu } from '../ngon-ngu/giao-dien.js';
import { BangDieuKhien } from './giao-dien.js';
import { $ } from './ung-dung-luu.js';
import { DS_NEN } from 'ao:am-thanh';

export const PT_AM = {
  // ---------- Âm thanh ----------
  // Nhạc nền theo phần của khoá học (bài có thể ghi đè bằng trường nhacNen: tên kiểu hoặc null để tắt).
  _datNen() {
    const dn = this.dsCanh[this.chiSo];
    if (!dn) return;
    if (dn.nhacNen !== undefined) { this.am.nen(dn.nhacNen); return; }
    const i = this.khoaHoc.findIndex((p) => p.ten === dn.phan);
    this.am.nen(DS_NEN[i] ?? DS_NEN[0] ?? null);
  },
  batTatTieng(b = !this.am.bat) {
    this.am.datBat(b);
    if (b) { this.am.khoiDong(); this._datNen(); this.am.phat('gat'); } else this._gdAm?.pause();
    this._veNutTieng();
  },
  _veNutTieng() {
    const nut = $('nut-tieng');
    if (nut) nut.classList.toggle('tat', !this.am.bat);
  },
  moBangTieng(mo = $('bang-tieng').hidden) {
    const el = $('bang-tieng');
    el.hidden = !mo;
    if (!mo) return;
    el.innerHTML = `<h3>${chu("gd.am-thanh")}</h3>`;
    const b = new BangDieuKhien(el, { am: this.am });
    b.congTac({ nhan: chu("gd.bat-tieng"), giaTri: this.am.bat, khiDoi: (v) => this.batTatTieng(v) });
    b.thanhTruot({ nhan: chu("gd.muc-am"), min: 0, max: 1, buoc: 0.01, giaTri: this.am.mucAm, hienThi: (v) => `${Math.round(v * 100)}%`, khiDoi: (v) => { this.am.datMucAm(v); if (this._gdAm) this._gdAm.volume = this._gdMucAm(); } });
    b.congTac({ nhan: chu("gd.nhac-nen"), giaTri: this.am.batNen, khiDoi: (v) => { this.am.datBatNen(v); if (v) this._datNen(); } });
    b.chuThich(chu("gd.tieng-trong-mo-hinh-deu-mang-nghia-nhip-dong-ho-tin-"));
    const h = document.createElement('h3');
    h.textContent = chu("gd.hinh");
    el.append(h);
    b.chon({
      luaChon: [
        { giaTri: 'tu-dong', nhan: chu("gd.tu-dong"), moTa: chu("gd.net-vua-phai-tu-ha-do-net-khi-may-ve-khong-kip") },
        { giaTri: 'nhe', nhan: chu("gd.nhe"), moTa: chu("gd.do-net-thap-hon-dung-khi-may-dang-ban-hoac-dang-goi-") },
        { giaTri: 'cao', nhan: chu("gd.cao"), moTa: chu("gd.net-nhat-nang-may-nhat") },
      ],
      giaTri: this.cheDoHinh,
      khiDoi: (v) => this.datCheDoHinh(v),
    });
    b.chuThich(chu("gd.thay-hinh-giat-vi-du-khi-dang-day-qua-meet-thi-chon-"));
    // Công tắc nhật ký: chỉ có trong app Mac (trình duyệt không có chỗ ghi, các lượt kiểm không ghi).
    if (this.nhatKy.coCongTac) {
      const hNk = document.createElement('h3');
      hNk.textContent = chu("gd.nhat-ky");
      el.append(hNk);
      b.congTac({ nhan: chu("gd.ghi-nhat-ky-hieu-nang"), giaTri: this.nhatKy.bat, khiDoi: (v) => this.nhatKy.datBat(v) });
      b.chuThich(chu("gd.nhat-ky-chu-thich"));
    }
  },
};
