// Lõi ứng dụng, phần chất lượng hình: trần độ nét theo chế độ («Tự động», «Nhẹ», «Cao»), khử răng cưa, đổi màn hình.
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { luu, KHOA_HINH } from './ung-dung-luu.js';

export const PT_HINH = {
  // ---------- Chất lượng hình ----------
  _tranTheoCheDo() { return this.cheDoHinh === 'cao' ? this.tiLeMay : this.cheDoHinh === 'nhe' ? Math.min(1, this.tiLeMay) : Math.min(1.5, this.tiLeMay); },
  // Khử răng cưa 4 mẫu: chỉ khi độ nét trần dưới 1,5 (màn hình thường, mỗi điểm ảnh một chấm) và không ở chế độ «Nhẹ».
  // Bộ tự chỉnh độ nét đã phải tắt nó một lần vì máy chậm thì thôi không bật lại trong phiên này.
  _coKhuRangCua() { return this.tiLeGoc < 1.5 && this.cheDoHinh !== 'nhe' && !this._tatKhuRangCua; },
  // Cửa sổ vừa được kéo sang màn hình có mật độ điểm ảnh khác (ví dụ từ màn hình ngoài sang màn hình MacBook nét gấp
  // đôi): tính lại trần độ nét và cờ khử răng cưa. Tới bản 3.2 app giữ mãi độ nét của màn hình lúc mở, nên mở ở màn hình
  // ngoài rồi kéo sang MacBook thì hình bị mềm (độ nét 1 trên màn hình nét gấp đôi); thấy trong nhật ký lúc 20:14 ngày 12/11/2026.
  _doiManHinh(dpr) {
    this._dpr = dpr;
    this.tiLeMay = Math.min(dpr, 2);
    this.tiLeGoc = this._tranTheoCheDo();
    this._tiLeOnDinh = null;
    this._tatKhuRangCua = false;
    this._ghiNhatKy({ loai: 'doi-man-hinh', matDo: dpr, tranDoNet: this.tiLeGoc });
    const dn = this.dsCanh[this.chiSo];
    if (!dn || !this.canh) { this.doNet.datTran(this.tiLeGoc, this._coKhuRangCua()); this.doNet.tiLe = this.tiLeGoc; this.renderer.setPixelRatio(this.tiLeGoc); this._doiKichThuoc(); return; }
    if (dn.hinh?.tuQuanDoNet) { this.moBai(this.chiSo, Math.max(0, this.chiSoBuoc)); return; }    // bài tự quản độ nét: dựng lại cho gọn
    this.doNet.datTran(dn.tiLeDiemAnh ? Math.min(dn.tiLeDiemAnh, this.tiLeGoc) : this.tiLeGoc, this._coKhuRangCua());
    this.doNet.tiLe = this.doNet.toiDa;
    this.doNet.nghi(1.5);
    this.renderer.setPixelRatio(this.doNet.tiLe);
    this._doiKichThuoc();
  },
  datCheDoHinh(cheDo) {
    if (!['tu-dong', 'nhe', 'cao'].includes(cheDo) || cheDo === this.cheDoHinh) return;
    this.cheDoHinh = cheDo;
    this._tatKhuRangCua = false;
    luu.ghi(KHOA_HINH, cheDo);
    this.tiLeGoc = this._tranTheoCheDo();
    this._tiLeOnDinh = null;
    if (this.chiSo >= 0) this.moBai(this.chiSo, Math.max(0, this.chiSoBuoc));     // mở lại bài đang học ở độ nét mới
  },
};
