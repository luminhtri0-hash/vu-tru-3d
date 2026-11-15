// Nhật ký tại máy: mở bài mất bao lâu, số khung hình mỗi giây, bấm vào đâu, phím gì, lỗi gì. Dùng để khi app chậm hay
// đứng hình thì biết chậm ở đâu, sau thao tác nào. Chỉ có trong app Mac (vỏ app ghi vào ~/Library/Logs/VuTru3D/hieu-nang.log
// trên chính máy đó, không gửi đi đâu); mở bằng trình duyệt thì không có chỗ ghi nên không bao giờ ghi.
//
// CÔNG TẮC. Vỏ app đặt window.__VT_NHAT_KY = true | false trước khi trang chạy:
//   - true: đang ghi; false: đang tắt (người dùng bật được trong bảng cài đặt); không có: không phải app Mac, hoặc đang là
//     lượt kiểm (tự kiểm, đo thật): không ghi và không hiện công tắc.
//   - Mặc định TẮT. Máy nào đã có thư mục nhật ký (bật từ bản 3.1) thì vỏ app giữ BẬT; người dùng gạt công
//     tắc thì vỏ app nhớ lựa chọn đó (xem app-mac/main.swift, nhatKyBat).
// Không ghi nội dung gõ: phím chữ chỉ ghi là «chữ».

const tenPhanTu = (t) => (t && t.nodeType === 1
  ? `${t.tagName.toLowerCase()}${t.id ? `#${t.id}` : ''}${typeof t.className === 'string' && t.className ? `.${t.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}`
  : '?');

export class NhatKy {
  constructor({ imLang = false } = {}) {
    const trangThai = typeof window !== 'undefined' ? window.__VT_NHAT_KY : undefined;
    this.cau = (typeof window !== 'undefined' && window.webkit?.messageHandlers?.vuTru) || null;   // cầu sang vỏ app Mac
    this.coCongTac = !imLang && !!this.cau && typeof trangThai === 'boolean';
    this.bat = this.coCongTac && trangThai;
  }

  // Ghi một mục (đối tượng nhỏ, có trường `loai`). Lệnh rỗng khi công tắc tắt.
  ghi(muc) {
    if (!this.bat) return;
    try { this.cau.postMessage(JSON.stringify(muc)); } catch { /* vỏ app đã đóng cầu: bỏ qua */ }
  }

  // Người dùng gạt công tắc trong bảng cài đặt: báo vỏ app để nó nhớ và bắt đầu (hoặc thôi) ghi.
  datBat(b) {
    if (!this.coCongTac) return;
    this.bat = !!b;
    window.__VT_NHAT_KY = this.bat;
    try { this.cau.postMessage(`nhat-ky:${this.bat ? 'bat' : 'tat'}`); } catch { /* */ }
  }

  // Thao tác và lỗi: bấm vào phần tử nào, gõ phím gì, lỗi gì. Móc luôn được gắn (rất nhẹ); có ghi hay không là do công tắc.
  ganSuKien() {
    if (!this.coCongTac) return;
    window.addEventListener('pointerdown', (e) => this.ghi({ loai: 'bam', vao: tenPhanTu(e.target), cha: tenPhanTu(e.target?.parentElement), x: Math.round(e.clientX), y: Math.round(e.clientY) }), true);
    window.addEventListener('keydown', (e) => this.ghi({ loai: 'phim', phim: e.key.length === 1 ? 'chữ' : e.key }), true);
    window.addEventListener('error', (e) => this.ghi({ loai: 'loi', tin: String(e.message || e.error).slice(0, 300), o: `${String(e.filename || '').slice(-30)}:${e.lineno}` }));
    window.addEventListener('unhandledrejection', (e) => this.ghi({ loai: 'loi-hua', tin: String(e.reason?.message || e.reason).slice(0, 300) }));
  }
}
