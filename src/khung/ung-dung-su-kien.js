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

    $('bai-truoc').addEventListener('click', () => this.chuyenBai(this.chiSo - 1));
    $('bai-sau').addEventListener('click', () => this.chuyenBai(this.chiSo + 1));
    const moMucLuc = () => { this.el.mucLuc.hidden = !this.el.mucLuc.hidden; this.am.phat(this.el.mucLuc.hidden ? 'dong' : 'mo'); };
    $('nut-muc-luc').addEventListener('click', moMucLuc);
    $('ten-bai').addEventListener('click', moMucLuc);
    $('nut-tam-dung').addEventListener('click', () => { this.am.phat('gat'); this.tamDungChay(); });
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
      // Bảng nằm dưới (điện thoại, máy tính bảng cầm dọc): thanh nắm nằm ở mép TRÊN của bảng, kéo là đổi bề cao (nâng lên
      // đọc cho rộng, hạ xuống xem mô hình); chạm nhẹ vào thanh nắm thì đổi nhanh giữa vừa và cao.
      const bangDuoi = () => this._lechDich[1] > 0;
      const datCao = (px) => {
        const cao = Math.round(Math.max(132, Math.min(window.innerHeight * 0.82, px)));
        document.documentElement.style.setProperty('--cao-bang', `${cao}px`);
        this._tinhLech();
      };
      let dang = false, r = 0, doc = false, y0 = 0, daKeo = false;
      keo.addEventListener('pointerdown', (e) => { dang = true; doc = bangDuoi(); y0 = e.clientY; daKeo = false; keo.setPointerCapture(e.pointerId); document.body.classList.add('dang-keo'); e.preventDefault(); });
      keo.addEventListener('pointermove', (e) => {
        if (!dang) return;
        if (!doc) { r = dat(window.innerWidth - e.clientX - 14); return; }
        if (Math.abs(e.clientY - y0) > 4) daKeo = true;
        if (daKeo) datCao(window.innerHeight - e.clientY - 8);
      });
      const tha = (e) => {
        if (!dang) return;
        dang = false;
        document.body.classList.remove('dang-keo');
        if (doc) { if (!daKeo && e.type === 'pointerup') datCao($('bai-hoc').offsetHeight > window.innerHeight * 0.6 ? window.innerHeight * 0.46 : window.innerHeight * 0.74); return; }
        if (r) luu.ghi(KHOA_RONG, String(r));
      };
      keo.addEventListener('pointerup', tha);
      keo.addEventListener('pointercancel', tha);
      keo.addEventListener('dblclick', () => { if (bangDuoi()) return; r = dat($('bai-hoc').offsetWidth > 520 ? 440 : 640); luu.ghi(KHOA_RONG, String(r)); });
    }

    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dangGo = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
      const k = e.key;
      const ng = this.nghe;
      if (k === 'Escape') {
        // Esc: đóng bảng nổi đang mở; không có bảng nổi nào mà bảng bài giảng đang ẩn thì hiện lại bảng.
        const coBangNoi = ng._coBangNoi();
        this.el.mucLuc.hidden = true; if (this.el.thuatNgu) this.el.thuatNgu.hidden = true; if ($('bang-tieng')) $('bang-tieng').hidden = true;
        if (!coBangNoi && document.body.classList.contains('an-bang') && !this.dangChao) this.anHienBang(false);
        return;
      }
      if (dangGo) return;
      if (k === 's' || k === 'S') { this.batTatTieng(); return; }
      if (k === 'f' || k === 'F') { this.toanManHinh(); return; }
      if (this.dangChao) return;           // màn hình chào: chỉ phím tiếng và toàn màn hình (Enter có chỗ riêng ở main.js)
      // Phím cách, Enter trên một nút của phần nghe giảng: để nút tự nhận (bấm nút bằng bàn phím), không xử lý hai lần.
      if ((k === ' ' || k === 'Enter') && e.target instanceof HTMLButtonElement && e.target.closest('#xv-lop, #giong-doc')) return;
      if (k === 'ArrowRight') { if (e.shiftKey) this.chuyenBai(this.chiSo + 1); else ng.toi(); }
      else if (k === 'ArrowLeft') { if (e.shiftKey) this.chuyenBai(this.chiSo - 1); else ng.lui(); }
      else if (k === 'PageDown') this.chuyenBai(this.chiSo + 1);
      else if (k === 'PageUp') this.chuyenBai(this.chiSo - 1);
      else if (k === 'Home') { this.moTab('hoc'); this.moBuoc(0); }
      else if (k >= '1' && k <= '9') { const n = Number(k) - 1; if (n < this._dsBuoc().length) { this.moTab('hoc'); this.moBuoc(n); } }
      else if (k === 'n' || k === 'N') ng.phatDung();
      else if (k === ' ' || k === 'k' || k === 'K') { e.preventDefault(); this.tamDungChay(); }
      else if (k === 'Enter' && ng._het) ng._xemTiep();
      else if (k === 'c' || k === 'C') ng.batTatPhuDe();
      else if (k === ',' || k === '<') ng.tocKe(-1);
      else if (k === '.' || k === '>') ng.tocKe(1);
      else if (k === 'b' || k === 'B' || k === 'v' || k === 'V') this.anHienBang();
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
