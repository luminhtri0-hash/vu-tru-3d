// Lõi ứng dụng, phần sự kiện: nút trên thanh trên, phím tắt, kéo mép bảng bài giảng, bấm và rê trên khung 3D.
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import * as THREE from 'three';
import { coCongThucVua } from './bai-giang.js';
import { $, luu, KHOA_RONG } from './ung-dung-luu.js';

export const PT_SU_KIEN = {
  _ganSuKien() {
    window.addEventListener('resize', () => this._doiKichThuoc());
    // Khối «Đi sâu» vừa mở: công thức bên trong giờ mới có bề rộng, co lại cho vừa bảng nếu dài.
    this.el.bang.addEventListener('toggle', (e) => { if (e.target?.open) coCongThucVua(e.target); }, true);
    // Trình duyệt chỉ cho phát tiếng sau một thao tác của người dùng: lần bấm hay gõ phím đầu tiên thì khởi động âm thanh.
    const danhThuc = () => {
      if (this.imLang) return;
      const truoc = this.am.sanSang;
      this.am.khoiDong();
      if (!truoc) setTimeout(() => this._datNen(), 80);
    };
    window.addEventListener('pointerdown', danhThuc, true);
    window.addEventListener('keydown', danhThuc, true);
    // Nhật ký thao tác và lỗi (chỉ ghi tại máy, trong app Mac): bấm vào đâu, gõ phím gì, lỗi gì. Để khi app đứng hình thì
    // biết thao tác cuối cùng trước đó là gì.
    this.nhatKy.ganSuKien();
    $('nut-tieng')?.addEventListener('click', () => this.moBangTieng());
    this._veNutTieng();

    $('bai-truoc').addEventListener('click', () => this.moBai(this.chiSo - 1, 0, true));
    $('bai-sau').addEventListener('click', () => this.moBai(this.chiSo + 1, 0, true));
    const moMucLuc = () => { this.el.mucLuc.hidden = !this.el.mucLuc.hidden; this.am.phat(this.el.mucLuc.hidden ? 'dong' : 'mo'); };
    $('nut-muc-luc').addEventListener('click', moMucLuc);
    $('ten-bai').addEventListener('click', moMucLuc);
    $('nut-tam-dung').addEventListener('click', () => { this.am.phat('gat'); this.datChay(!this.dangChay); });
    $('nut-goc-nhin').addEventListener('click', () => this.veGocBanDau());
    $('nut-toan-man').addEventListener('click', () => this.toanManHinh());
    $('nut-bang').addEventListener('click', () => this.anHienBang());
    $('nut-thuat-ngu')?.addEventListener('click', () => { if (this.el.thuatNgu.hidden) this.moThuatNgu(); else this.el.thuatNgu.hidden = true; });
    window.addEventListener('pointerdown', (e) => {
      if (!this.el.mucLuc.hidden && !e.target.closest('#muc-luc, #nut-muc-luc, #ten-bai')) this.el.mucLuc.hidden = true;
      if (this.el.thuatNgu && !this.el.thuatNgu.hidden && !e.target.closest('#thuat-ngu, #nut-thuat-ngu, .tn')) this.el.thuatNgu.hidden = true;
      const bt = $('bang-tieng');
      if (bt && !bt.hidden && !e.target.closest('#bang-tieng, #nut-tieng')) bt.hidden = true;
    });

    // Kéo mép trái của bảng bài học để đổi bề rộng; bấm đúp để đổi nhanh giữa rộng và vừa.
    const keo = $('keo-bang');
    if (keo) {
      const dat = (px) => {
        const r = Math.round(Math.max(340, Math.min(Math.min(860, window.innerWidth * 0.62), px)));
        document.documentElement.style.setProperty('--rong-bang', `${r}px`);
        this._tinhLech();
        return r;
      };
      let dang = false, r = 0;
      keo.addEventListener('pointerdown', (e) => { dang = true; keo.setPointerCapture(e.pointerId); document.body.classList.add('dang-keo'); e.preventDefault(); });
      keo.addEventListener('pointermove', (e) => { if (dang) r = dat(window.innerWidth - e.clientX - 14); });
      const tha = () => { if (!dang) return; dang = false; document.body.classList.remove('dang-keo'); if (r) luu.ghi(KHOA_RONG, String(r)); };
      keo.addEventListener('pointerup', tha);
      keo.addEventListener('pointercancel', tha);
      keo.addEventListener('dblclick', () => { r = dat($('bai-hoc').offsetWidth > 520 ? 440 : 640); luu.ghi(KHOA_RONG, String(r)); });
    }

    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dangGo = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      const k = e.key;
      if (k === 'Escape') { this.el.mucLuc.hidden = true; if (this.el.thuatNgu) this.el.thuatNgu.hidden = true; if ($('bang-tieng')) $('bang-tieng').hidden = true; return; }
      if (dangGo) return;
      if (k === 'ArrowRight') { if (e.shiftKey) this.moBai(this.chiSo + 1, 0, true); else this.buocSau(); }
      else if (k === 'ArrowLeft') { if (e.shiftKey) this.moBai(this.chiSo - 1, 0, true); else this.buocTruoc(); }
      else if (k === 'PageDown') this.moBai(this.chiSo + 1, 0, true);
      else if (k === 'PageUp') this.moBai(this.chiSo - 1, 0, true);
      else if (k === 's' || k === 'S') this.batTatTieng();
      else if (k === 'n' || k === 'N') this.ngheGiang();
      else if (k === ' ') { e.preventDefault(); this.datChay(!this.dangChay); }
      else if (k === 'f' || k === 'F') this.toanManHinh();
      else if (k === 'b' || k === 'B') this.anHienBang();
      else if (k === 'm' || k === 'M') moMucLuc();
      else if (k === 'g' || k === 'G') { if (this.el.thuatNgu.hidden) this.moThuatNgu(); else this.el.thuatNgu.hidden = true; e.preventDefault(); }
      else if (k === 'r' || k === 'R') this.veGocBanDau();
    });

    // Bấm (không kéo) vào khung 3D: báo cho cảnh biết để chọn vật.
    let xuong = null;
    const cv = this.renderer.domElement;
    cv.addEventListener('pointerdown', (e) => { xuong = e.vtDaXuLy ? null : { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cv.addEventListener('pointerup', (e) => {
      if (!xuong) return;
      if (e.vtDaXuLy || this.tt.dangKeo) { xuong = null; return; }   // khung tương tác đã nhận lần bấm này
      const xa = Math.hypot(e.clientX - xuong.x, e.clientY - xuong.y);
      if (xa < 5 && performance.now() - xuong.t < 500) {
        const ndc = new THREE.Vector2((e.clientX / this.rong) * 2 - 1, -(e.clientY / this.cao) * 2 + 1);
        this.canh?.khiBam?.(ndc, e);
      }
      xuong = null;
    });
    cv.addEventListener('pointermove', (e) => {
      if (!this.canh?.khiRe || e.vtDaXuLy) return;
      const ndc = new THREE.Vector2((e.clientX / this.rong) * 2 - 1, -(e.clientY / this.cao) * 2 + 1);
      this.canh.khiRe(ndc, e);
    });
  },
};
