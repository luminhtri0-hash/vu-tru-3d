// Lõi ứng dụng, phần «thử thách» của một bước: vẽ hộp, chấm khoảng 5 lần mỗi giây, lưu thử thách đã đạt.
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { chu } from '../ngon-ngu/giao-dien.js';
import { dinhDang } from './bai-giang.js';
import { $, luu, KHOA_TT } from './ung-dung-luu.js';

export const PT_THU_THACH = {
  // ---------- Thử thách của một bước ----------
  // Bước có trường thuThach: { de, kiem: (c, app) => boolean, giu = 0.5, goiY, khiDat } thì cuối bước có hộp «Thử thách».
  // Ứng dụng gọi kiem() khoảng 5 lần mỗi giây; đạt liên tục đủ «giu» giây thì tính là đạt, phát tiếng, lưu lại.
  _khoaTT(k, id = this.dsCanh[this.chiSo]?.id) { return `${id}:${k + 1}`; },
  _htmlThuThach(b, k) {
    const t = b.thuThach;
    if (!t) return '';
    const dat = this.thuThachDat.has(this._khoaTT(k));
    return `<div class="hop thu-thach${dat ? ' dat' : ''}" id="thu-thach"><div class="hop-ten">${chu("gd.thu-thach")}<span class="tt-trang-thai">${dat ? chu("gd.da-dat") : chu("gd.chua-dat")}</span></div>${dinhDang(t.de || '')}${t.goiY ? `<button class="tt-nut" id="tt-nut-goi-y">${chu("gd.goi-y")}</button><div class="tt-goi-y" id="tt-goi-y" hidden>${dinhDang(t.goiY)}</div>` : ''}<i class="tt-tien"></i></div>`;
  },
  _ganThuThach(b, k) {
    this._tt = null;
    if (!b.thuThach) return;
    const el = $('thu-thach');
    this._tt = { t: b.thuThach, k, el, giu: 0, cho: 0.6, xong: false, loi: false };
    $('tt-nut-goi-y')?.addEventListener('click', (e) => { this.am.phat('bam'); $('tt-goi-y').hidden = false; e.currentTarget.hidden = true; });
  },
  _kiemThuThach(dt) {
    const s = this._tt;
    if (!this.canh || s.xong) return;
    s.cho -= dt;
    if (s.cho > 0) return;
    const nhip = 0.2;
    s.cho = nhip;
    let ok = false;
    try { ok = !!s.t.kiem(this.canh, this); } catch (e) {
      if (!s.loi) { s.loi = true; console.error(e); this.loiGhi.push(`thử thách ở bước ${s.k + 1}: ${e?.message || e}`); }
    }
    const can = Math.max(nhip, s.t.giu ?? 0.5);
    s.giu = ok ? s.giu + nhip : 0;
    const tien = s.el?.querySelector('.tt-tien');
    if (tien) tien.style.width = `${Math.min(100, (100 * s.giu) / can)}%`;
    if (s.giu < can - 1e-9) return;
    s.xong = true;
    const khoa = this._khoaTT(s.k);
    if (!this.thuThachDat.has(khoa)) {
      this.thuThachDat.add(khoa);
      luu.ghi(KHOA_TT, [...this.thuThachDat].join(','));
      this._veMucLuc();
      for (const b of this.el.mucLuc.querySelectorAll('button[data-i]')) b.classList.toggle('dang-mo', Number(b.dataset.i) === this.chiSo);
    }
    if (s.el) {
      s.el.classList.add('dat', 'vua-dat');
      const tt = s.el.querySelector('.tt-trang-thai');
      if (tt) tt.textContent = chu("gd.dat");
    }
    $('buoc-cham')?.children[s.k]?.classList.add('tt-dat');
    this.am.phat('dat');
    try { s.t.khiDat?.(this.canh, this); } catch (e) { console.error(e); this.loiGhi.push(`khiDat của thử thách bước ${s.k + 1}: ${e?.message || e}`); }
  },
};
