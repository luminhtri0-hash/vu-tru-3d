// Lõi ứng dụng, phần «làm nóng dần»: cảnh vừa dựng được vẽ thử từng ít một để biên dịch chương trình đổ bóng mà không
// làm đứng cửa sổ (xem lam-nong.js). Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { LamNong } from './lam-nong.js';
import { $ } from './ung-dung-luu.js';

export const PT_LAM_NONG = {
  // ---------- Làm nóng dần (xem lam-nong.js) ----------
  // Cảnh vừa dựng chưa lên màn hình ngay: các khung hình tới vẽ thử từng nhóm vật để biên dịch chương trình đổ bóng từng ít
  // một, cửa sổ vẫn nhận bấm. Máy đã có bộ nhớ đệm thì xong trong vài khung hình (không ai kịp thấy); chưa có thì hiện dòng
  // «Đang dựng mô hình 3D» kèm phần trăm. Các lượt kiểm im lặng (chụp ảnh, tự kiểm) bỏ qua bước này để vẽ được ngay.
  _batDauLamNong() {
    this._nong = null;
    this.el.dangDung.hidden = true;
    if (!this.canh || this.imLang || this._matNguCanh || window.__VT_THU?.khongNong) return;
    try { this.canh.capNhat?.(0, 0); } catch (e) { console.warn('capNhat lúc làm nóng:', e); }   // đặt vật vào chỗ, cấp điểm cho các đường
    try { this._nong = new LamNong(this.renderer, this.dungHinh, this.canh.scene, this.camera); } catch (e) { console.warn('Làm nóng:', e); this._nong = null; }
    this._nongDaXoa = false;
  },
  // Làm nóng cả cảnh đang mở NGAY, một hơi (đứng hình trong lúc làm). Chỉ dùng cho lượt chạy ẩn lúc cài app: nhờ đó bộ nhớ
  // đệm chương trình đổ bóng của máy có sẵn mọi thứ, lần đầu người dùng mở bài không phải biên dịch nữa.
  lamNongNgay() {
    if (!this.canh) return null;
    const t0 = performance.now();
    try { this.canh.capNhat?.(0, 0); } catch (e) { /* lỗi thật sẽ hiện ở lượt tự kiểm */ }
    const n = new LamNong(this.renderer, this.dungHinh, this.canh.scene, this.camera);
    let vong = 0;
    while (!n.buoc(1000) && vong++ < 10000) { /* làm tới khi hết */ }
    return { vat: n.tong, luot: n.soLuot, ms: Math.round(performance.now() - t0), lauNhatMs: Math.round(n.msLauNhat) };
  },

  // Trả về true khi đã làm nóng xong (khung hình này được vẽ cảnh thật).
  _lamNong() {
    const n = this._nong;
    let xong = true;
    try { xong = n.buoc(9); } catch (e) { console.warn('Làm nóng:', e); }
    const da = performance.now() - n.tBatDau;
    if (!xong) {
      if (da > 150 && !this._nongDaXoa) {
        // Lâu quá mức «tức thì»: xoá hình của bài trước (đang đứng yên trên màn hình) và báo cho người dùng biết đang dựng.
        this._nongDaXoa = true;
        this.renderer.setRenderTarget(null);
        this.renderer.setClearColor(this.dungHinh.mauNen, 1);
        this.renderer.clear();
        const bangHoc = $('bai-hoc');
        const che = bangHoc && this.rong > 900 && !document.body.classList.contains('an-bang') ? bangHoc.offsetWidth : 0;
        this.el.dangDung.style.left = `${Math.round((this.rong - che) / 2)}px`;
        this.el.dangDung.hidden = false;
      }
      if (this._nongDaXoa) this.el.dangDung.lastElementChild.textContent = `${Math.round(n.tiLe * 100)}%`;
      return false;
    }
    this._nong = null;
    this.el.dangDung.hidden = true;
    this.doNet.nghi(1.2);
    this._ghiNhatKy({ loai: 'lam-nong', bai: this.soBai(), ms: Math.round(da), vat: n.tong, luot: n.soLuot, lauNhatMs: Math.round(n.msLauNhat) });
    return true;
  },
};
