// Lõi ứng dụng, phần giọng đọc lời giảng: thanh «Nghe giảng» dưới tên bước, phát và tạm dừng, đọc xong tự sang bước.
// (Chế độ «Xem như video» có trình phát riêng trong xem-video.js và dùng lại _gdTep, _gdMucAm, _gdDung ở đây.)
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { chu } from '../ngon-ngu/giao-dien.js';
import { ngonNgu } from '../ngon-ngu/dich.js';
import { $, luu, phutGiay, KHOA_GIONG, KHOA_TU_SANG } from './ung-dung-luu.js';
import { AM_RONG } from './ung-dung-rong.js';

// Danh sách tệp tiếng (bài nào, bước nào, giọng nào, dài bao nhiêu giây) do build.mjs chèn vào từ giong-doc/danh-sach.json.
// Tệp tiếng nằm ngoài trang, trong thư mục giong-doc/ cạnh tệp HTML.
/* global __GIONG_DOC__ */
const GIONG_DOC = (typeof __GIONG_DOC__ !== 'undefined' && __GIONG_DOC__) || null;
// Giọng đọc lời giảng: giọng Google Chirp 3 HD «Algieba» (đã nghe thử và chọn; giọng Microsoft nghe còn máy).
const TEN_GIONG = { algieba: chu("gd.giong-nam"), 'hoai-my': chu("gd.giong-nu-cu"), 'nam-minh': chu("gd.giong-nam-cu") };

export const PT_GIONG_DOC = {
  // ---------- Giọng đọc lời giảng ----------
  _gdTep(k = this.chiSoBuoc, giong = this._gdGiong) {
    const id = this.dsCanh[this.chiSo]?.id;
    if ((GIONG_DOC?.[giong]?.ngonNgu || 'vi') !== ngonNgu) return null;
    return GIONG_DOC?.[giong]?.bai?.[id]?.tep?.find((t) => t.buoc === k + 1) || null;
  },
  _gdDsGiong(k = this.chiSoBuoc) { return Object.keys(GIONG_DOC || {}).filter((g) => this._gdTep(k, g)); },
  _veGiongDoc() {
    const el = $('giong-doc');
    if (!el) return;
    this._gdDung();
    const ds = this._gdDsGiong();
    if (!ds.length) { el.hidden = true; el.innerHTML = ''; return; }
    if (!ds.includes(this._gdGiong)) this._gdGiong = ds[0];
    const t = this._gdTep();
    el.hidden = false;
    el.innerHTML = `<button class="gd-phat" id="gd-phat" title="${chu("gd.nghe-giang-buoc-nay-phim-n")}">▶</button>
      <div class="gd-giua"><div class="gd-ten"><span>${chu("gd.nghe-giang-buoc-nay")}</span><span id="gd-gio">${phutGiay(t.giay)}</span></div><div class="gd-thanh" id="gd-thanh"><i></i></div></div>
      ${ds.length > 1 ? `<button class="gd-chon" id="gd-giong" title="${chu("gd.doi-giong-doc")}">${TEN_GIONG[this._gdGiong] || this._gdGiong}</button>` : ''}
      <button class="gd-chon${this._gdTuSang ? ' bat' : ''}" id="gd-tu" title="${chu("gd.doc-xong-thi-tu-sang-buoc-sau-va-doc-tiep")}">${chu("gd.tu-sang-buoc")}</button>`;
    $('gd-phat').addEventListener('click', () => this.ngheGiang());
    $('gd-giong')?.addEventListener('click', () => {
      const dang = this._gdDangPhat;
      this._gdGiong = ds[(ds.indexOf(this._gdGiong) + 1) % ds.length];
      luu.ghi(KHOA_GIONG, this._gdGiong);
      this._veGiongDoc();
      if (dang) this.ngheGiang(true);
    });
    $('gd-tu').addEventListener('click', (e) => {
      this._gdTuSang = !this._gdTuSang;
      luu.ghi(KHOA_TU_SANG, this._gdTuSang ? '1' : '0');
      e.currentTarget.classList.toggle('bat', this._gdTuSang);
    });
    $('gd-thanh').addEventListener('click', (e) => {
      const a = this._gdAm;
      if (!a || !a.duration) return;
      const r = e.currentTarget.getBoundingClientRect();
      a.currentTime = a.duration * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    });
  },
  // Phát hoặc tạm dừng giọng đọc của bước đang mở. Chế độ kiểm thì không bao giờ phát.
  ngheGiang(phat = !this._gdDangPhat) {
    if (this.imLang) return;
    const t = this._gdTep();
    if (!t) return;
    if (!this._gdAm) {
      const a = new Audio();
      a.muted = !!window.__VT_THU?.tiengCam;
      a.preload = 'auto';
      a.addEventListener('timeupdate', () => this._gdCapNhat());
      a.addEventListener('ended', () => this._gdHet());
      a.addEventListener('pause', () => this._gdTrangThai(false));
      a.addEventListener('play', () => this._gdTrangThai(true));
      a.addEventListener('error', () => { this._gdTrangThai(false); const g = $('gd-gio'); if (g) g.textContent = chu("gd.khong-mo-duoc-tep-tieng"); });
      this._gdAm = a;
    }
    const a = this._gdAm;
    if (!phat) { a.pause(); return; }
    if (!this.am.bat && this.am !== AM_RONG) this.batTatTieng(true);      // đang tắt tiếng mà bấm nghe giảng: bật lại
    if (this._gdTepDang !== t.tep) { this._gdTepDang = t.tep; a.src = `giong-doc/${t.tep}`; }
    a.volume = this._gdMucAm();
    a.play().catch(() => this._gdTrangThai(false));
  },
  _gdMucAm() { return this.am === AM_RONG ? 0.8 : Math.min(1, Math.max(0, this.am.mucAm * 1.3)); },
  _gdDung() {
    clearTimeout(this._gdHen);
    const a = this._gdAm;
    if (a) { a.pause(); this._gdTepDang = null; a.removeAttribute('src'); }
    this._gdTrangThai(false);
  },
  _gdTrangThai(dang) {
    this._gdDangPhat = dang;
    const nut = $('gd-phat');
    if (nut) nut.textContent = dang ? '❚❚' : '▶';
  },
  _gdCapNhat() {
    const a = this._gdAm;
    if (!a || !a.duration) return;
    const thanh = $('gd-thanh')?.firstElementChild, gio = $('gd-gio');
    if (thanh) thanh.style.width = `${(100 * a.currentTime) / a.duration}%`;
    if (gio) gio.textContent = `${phutGiay(a.currentTime)} / ${phutGiay(a.duration)}`;
  },
  _gdHet() {
    this._gdTrangThai(false);
    if (!this._gdTuSang) return;
    const bai = this.chiSo, k = this.chiSoBuoc;
    if (k >= this._dsBuoc().length - 1 || !this._gdTep(k + 1)) return;       // hết bài hoặc bước sau chưa có giọng đọc
    this._gdHen = setTimeout(() => {
      if (this.chiSo !== bai || this.chiSoBuoc !== k) return;                  // người học đã tự chuyển chỗ khác
      this.buocSau();
      this.ngheGiang(true);
    }, 900);
  },
};
