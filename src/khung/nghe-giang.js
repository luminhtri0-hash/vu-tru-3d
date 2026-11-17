// NGHE GIẢNG: giọng đọc lời giảng, phụ đề chạy theo giọng ngay trên mô hình, tự sang bước, hết bài thì mời học bài tiếp.
//
// CHỈ CÓ MỘT CÁCH HỌC. Tới bản 3.7 app có hai chế độ: chế độ thường (nút «Nghe giảng bước này» chỉ phát tiếng, không phụ
// đề) và chế độ «Xem như video» riêng (ẩn bảng, phụ đề, tự sang bước). Người học mở app ở chế độ thường, bấm nghe, không
// thấy phụ đề đâu. Từ bản 3.8 gộp làm một, mọi thứ dưới đây là của màn hình học bình thường:
//   - bấm nghe (nút ▶ trong bảng bài giảng, phím N, nút lớn «Bắt đầu học có giọng đọc» ở màn hình chào) thì phụ đề chạy
//     theo giọng ở mép dưới phần khung 3D còn trống: không bị bảng bài giảng che, nằm trên ô số liệu, nhãn tự tránh;
//   - «Tự sang bước» nối liền các bước như một video; hết bài thì thẻ «Bài tiếp theo» đếm ngược;
//   - «Ẩn bảng, xem toàn màn hình» (phím V hoặc B) CHỈ ẩn bảng cho mô hình rộng ra. Đó vẫn là cùng một lượt nghe: cùng
//     trạng thái phát, cùng phụ đề. Lúc bảng ẩn có thêm thanh phát ở đáy (tự ẩn sau 3 giây), thẻ tên bước, thẻ mở đầu
//     bài và chữ «Trí Lữ» mờ; thanh trên vẫn còn và ẩn hiện cùng thanh phát.
// Tạm dừng lời giảng thì mô hình cũng đứng (như một video); bấm một nút «thử ngay» hoặc sang bước khác thì mô hình chạy lại.
//
// Nguồn dữ liệu (đều gói sẵn vào trang lúc dựng, chạy được cả app Mac lẫn web):
//   - tệp tiếng: app._gdTep(k) (từ giong-doc/danh-sach.json), mốc phụ đề nằm trong trường `phuDe` của từng tệp
//     (build.mjs đọc giong-doc/<giọng>/<id>-<bước>.phu-de.json);
//   - lời đọc: __LOI_DOC__ (tiếng Việt, src/loi-doc/vi/*.json) và __LOI_DOC_DICH__ (bản dịch, nếu có);
//   - chưa có giọng đọc: phụ đề lấy từ lời đọc hoặc lời giảng của bước (thứ tiếng đang chọn), thời lượng ước theo độ dài
//     chữ (xem chia-phu-de.js). Mọi thứ vẫn chạy, chỉ không có tiếng.
//
// Không đụng vòng vẽ 3D: đồng hồ của phần này là một nhịp riêng 10 lần mỗi giây, chỉ chạy khi đang nghe, chỉ đổi chữ khi
// câu đổi; các hiệu ứng chuyển cảnh chỉ là độ mờ của một lớp phủ (trình duyệt tự ghép, không thêm lượt vẽ nào cho card đồ
// hoạ, không backdrop-filter). Chưa nghe thì mở một bước chỉ tốn việc vẽ lại thanh «Nghe giảng» trong bảng.
// Bộ kiểm (kiem-tra/kiem-xem-video.mjs) và lượt chụp ảnh chạy im lặng: không có nhịp tự chạy, không phát tiếng, đổi bài
// tức thì; bộ kiểm tự đẩy đồng hồ bằng tien(giây) và đọc trangThai().
//
// Tiền tố «xv» ở tên lớp CSS, id và khoá chữ (xv-phu-de, xv.the…) giữ từ tên cũ «xem như video» để khỏi đổi hàng loạt.

import { chu } from '../ngon-ngu/giao-dien.js';
import { ngonNgu, TIENG } from '../ngon-ngu/dich.js';
import { dinhDang } from './bai-giang.js';
import { chiaPhuDe, datMocUocTinh, cauLucDo, laChuVuong, doDai } from './chia-phu-de.js';
import { texThanhChu, chuCoCongThuc } from './tex-thanh-chu.js';
import { $, luu, phutGiay, KHOA_TU_SANG } from './ung-dung-luu.js';

/* global __LOI_DOC__, __LOI_DOC_DICH__ */
const LOI_DOC = (typeof __LOI_DOC__ !== 'undefined' && __LOI_DOC__) || {};
// Lời đọc đã dịch: { en: { <id bài>: [lời bước 1, …] }, 'zh-CN': …, ja: … } (build.mjs đọc src/loi-doc/<mã tiếng>/*.json).
const LOI_DOC_DICH = (typeof __LOI_DOC_DICH__ !== 'undefined' && __LOI_DOC_DICH__) || {};
const DS_TOC = [1, 1.25, 1.5];             // nút tốc độ đi vòng qua ba mức này
const DS_TOC_PHIM = [0.75, 1, 1.25, 1.5, 2];   // phím , và . đi qua đủ năm mức
const NGHI_SAU_LOI = 1.0;        // giây nghỉ sau khi hết lời, rồi mới sang bước
const GIAY_THE = 4.5;            // thẻ «Bài 1 · Bước 2/8 · tên» hiện bấy nhiêu giây (chỉ khi bảng đang ẩn)
const GIAY_MO_DAU = 2.6;         // thẻ mở đầu bài hiện bấy nhiêu giây rồi lời mới cất lên (chỉ khi bảng đang ẩn)
const DEM_NGUOC = 5;             // hết bài: đếm ngược trước khi sang bài tiếp
const AN_DIEU_KHIEN = 3000;      // bảng đang ẩn: thanh phát và thanh trên tự ẩn sau 3 giây không rê chuột
const NHIP = 100;                // mili giây: phụ đề cập nhật tối đa 10 lần mỗi giây
const GIAY_BAY = 1.4;            // đang nghe mà sang bước: máy quay bay tới góc mới trong bấy nhiêu giây
const KHOA_LUU = 'vu-tru-3d.xem-video';      // tốc độ và lựa chọn phụ đề (tên khoá giữ từ bản 3.7 để người học không mất lựa chọn)
const so = (x) => (ngonNgu === 'vi' ? String(x).replace('.', ',') : String(x));
const thoat = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Tên bài, tên bước thành chữ thường: công thức trong dòng đổi thành chữ đọc được (trước bản 3.7 bị xoá hẳn, nên bước
// «Hệ số tỉ lệ $a(t)$ và dịch chuyển đỏ» hiện thành «Hệ số tỉ lệ  và dịch chuyển đỏ»).
const chuTran = (s) => chuCoCongThuc(s || '').replace(/[*{}\\]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const lamTron = (x) => Math.round(x * 100) / 100;
// Luật chia phụ đề của thứ tiếng đang dùng (src/ngon-ngu/danh-sach.json, trường phuDe): ngắt ở khoảng trắng hay giữa các
// chữ, sức chứa một dòng, tốc độ đọc ước tính. Mục không ghi thì tự nhận theo chữ viết (xem chia-phu-de.js).
const LUAT = TIENG.phuDe ? { vuong: TIENG.phuDe.tach === 'ky-tu', dai: TIENG.phuDe.dong, toc: TIENG.phuDe.toc } : null;
const laVuong = (s) => (LUAT ? LUAT.vuong : laChuVuong(s));

// Lời giảng của một bước thành chữ thường để làm phụ đề khi chưa có lời đọc: bỏ phần «Đi sâu», nút, công thức khối,
// hộp thử; công thức trong dòng đổi thành chữ đọc được («$\vec v_{\text{quỹ đạo}}$: phần quay quanh Mặt Trời» thành
// «v quỹ đạo: phần quay quanh Mặt Trời»). Công thức được cất ra trước khi định dạng rồi trả về sau cùng, vì bộ dựng
// công thức chỉ xuất hình, không kèm chữ: trước bản 3.7 chỗ của công thức bị bỏ trống, phụ đề mất chủ ngữ.
// Trả về DANH SÁCH KHỐI (mỗi đoạn văn, mỗi gạch đầu dòng một khối): phụ đề chia riêng từng khối, để câu dẫn kết bằng dấu
// hai chấm không dính sang đầu gạch đầu dòng kế tiếp («…là tổng của hai phần: V:»).
function khoiCuaBuoc(b) {
  const kho = [];
  const nguon = String(b?.noiDung || '').replace(/\\\$|\$\$[\s\S]+?\$\$|\$[^$]+?\$/g, (m) => {
    if (m === '\\$') return m;
    if (m.startsWith('$$')) return '';
    kho.push(texThanhChu(m.slice(1, -1)));
    return `\u0003${kho.length - 1}\u0004`;
  });
  const d = document.createElement('div');
  d.innerHTML = dinhDang(nguon);
  for (const e of d.querySelectorAll('details, .nut-thu, .cong-thuc, .hop, .katex-display, button, script, style, svg')) e.remove();
  for (const e of d.querySelectorAll('.katex')) {
    const m = e.querySelector('.katex-mathml math');
    e.replaceWith(document.createTextNode(m ? (m.querySelector('semantics > :first-child') || m).textContent : ''));
  }
  const khoi = [...d.querySelectorAll('p, li')].map((e) => e.textContent.trim()).filter(Boolean);
  return (khoi.length ? khoi : [d.textContent]).map((s) => {
    // Gạch đầu dòng kết bằng dấu phẩy, chấm phẩy («…kéo vòng tròn thành lò xo;»): thay bằng dấu chấm, không viết «;.».
    s = s.replace(/\u0003(\d+)\u0004/g, (_, i) => kho[Number(i)] ?? '').replace(/\s+/g, ' ').trim().replace(/[;；,，、]+$/, '');
    return !s || /[.!?。！？:：]$/.test(s) ? s : `${s}${laChuVuong(s) ? '。' : '.'}`;
  }).filter(Boolean);
}

export class NgheGiang {
  constructor(app) {
    this.app = app;
    this.dangPhat = false;       // lời giảng đang chạy (tiếng đang phát, hoặc đồng hồ ước tính đang chạy khi chưa có tiếng)
    this.tamDung = false;        // người học tạm dừng giữa chừng: mô hình đứng theo, phím cách hoặc ▶ thì chạy tiếp
    this.toc = 1;
    this.phuDeBat = true;
    this.tuSang = luu.doc(KHOA_TU_SANG) === '1';       // đọc xong tự sang bước sau, hết bài thì mời sang bài sau
    try {                        // nhớ tốc độ và lựa chọn phụ đề của người học
      const nho = JSON.parse(localStorage.getItem(KHOA_LUU) || 'null');
      if (nho && DS_TOC_PHIM.includes(nho.toc)) this.toc = nho.toc;
      if (nho && nho.phuDe === false) this.phuDeBat = false;
    } catch { /* chế độ riêng tư: bỏ qua */ }
    // Chạy im lặng (bộ kiểm, chụp ảnh): không nhịp tự chạy, không phát tiếng; đồng hồ do bộ kiểm đẩy.
    this.dongHoGia = !!(app.imLang || window.__VT_THU?.dongHoGia);
    this._b = null;            // lời của bước đang mở: { bai, k, tep, moc, dai, t, … }; chỉ dựng khi sắp nghe hoặc khi bảng đang ẩn
    this._het = null;          // thẻ hết bài: { dem }
    this._choNong = false;     // vừa đổi bài lúc đang nghe: chờ cảnh mới dựng xong rồi lời mới cất lên
    this._baiMoi = false;      // app.moBai đang chạy: lần mở bước sắp tới là bước đầu của một bài
    this._anBang = false;      // bảng bài giảng đang ẩn (xem toàn màn hình)
    this._rong = 0;            // bề ngang phần khung 3D còn trống (datCho ghi)
    this._chuBao = '';
    this._dungDom();
  }

  // Đang ngồi xem: bảng ẩn và lời đang chạy. Khi đó lời mời kéo của các tay nắm tạm ẩn (tuong-tac.js đọc).
  get dangXem() { return this.dangPhat && this._anBang; }

  // ---------- Lời của một bước ----------
  // Lời đọc của bước k ở thứ tiếng đang chọn; chưa có (hoặc rỗng) thì trả về null và nơi gọi lấy chữ từ lời giảng.
  _loiDoc(k) {
    const id = this.app.dsCanh[this.app.chiSo]?.id;
    return (ngonNgu === 'vi' ? LOI_DOC[id] : LOI_DOC_DICH[ngonNgu]?.[id])?.[k] || null;
  }
  // Câu phụ đề và thời lượng của bước k (không phát gì).
  _duLieu(k) {
    const app = this.app;
    const tep = app._gdTep(k);
    if (tep) {
      const loiCoTieng = this._loiDoc(k) || '';
      const moc = tep.phuDe?.length ? tep.phuDe : datMocUocTinh(chiaPhuDe(loiCoTieng, { vuong: laVuong(loiCoTieng), dai: LUAT?.dai, tieng: ngonNgu }), { vuong: laVuong(loiCoTieng), tong: tep.giay });
      return { tep, moc, dai: tep.giay, uoc: !tep.phuDe?.length };
    }
    const loi = this._loiDoc(k);
    const khoi = loi ? [loi] : khoiCuaBuoc(app._dsBuoc()[k]);
    const vuong = laVuong(khoi.join(' '));
    const moc = datMocUocTinh(khoi.flatMap((s) => chiaPhuDe(s, { vuong, dai: LUAT?.dai, tieng: ngonNgu })), { vuong, toc: LUAT?.toc });
    return { tep: null, moc, dai: Math.max(4, (moc.at(-1)?.t1 ?? 0) + 0.3), uoc: true };
  }
  // Bề ngang phần khung 3D còn trống: cả cửa sổ khi bảng ẩn hoặc bảng nằm dưới (điện thoại cầm dọc), phần bên trái bảng
  // khi bảng nằm bên phải.
  _rongTrong() {
    const b = $('bai-hoc');
    if (this._anBang || !b || !b.offsetWidth || b.offsetWidth >= innerWidth * 0.6) return innerWidth;
    return Math.max(160, b.offsetLeft - 8);
  }
  // Phần trống hẹp (điện thoại cầm dọc, cửa sổ nhỏ có bảng bên phải): dòng 42 ký tự không vừa bề ngang ở cỡ chữ tối thiểu.
  // Chia lại từng câu phụ đề theo bề ngang thật mà vẫn tối đa HAI dòng mỗi lần hiện: câu dài thành hai ba câu ngắn nối
  // nhau, thời gian của câu gốc chia theo độ dài. (Bản đầu ghép lại thành một câu ba bốn dòng, che mất mô hình.)
  _mocTheoManHinh(moc) {
    const rong = this._rong || this._rongTrong();
    if (rong >= 700 || !moc?.length) return moc;
    const co = Math.max(18, Math.min(innerHeight * 0.032, rong * 0.046));
    const ra = [];
    for (const m of moc) {
      const vuong = laVuong(m.chu);
      const suc = Math.max(8, Math.floor((rong * 0.92) / (co * (vuong ? 1.02 : 0.53))));
      if (!m.chu.split('\n').some((d) => doDai(d, vuong) > suc)) { ra.push(m); continue; }
      const ds = chiaPhuDe(m.chu.replace(/\n/g, vuong ? '' : ' '), { vuong, dai: suc, tieng: ngonNgu });
      const tong = ds.reduce((s, c) => s + c.length, 0) || 1;
      let t = m.t0;
      for (const c of ds) { const d = ((m.t1 - m.t0) * c.length) / tong; ra.push({ t0: lamTron(t), t1: lamTron(t + d), chu: c }); t += d; }
    }
    return ra;
  }
  // Thời lượng từng bước của bài đang mở và thanh tiến độ chia đoạn (thanh phát ở đáy, hiện khi bảng ẩn).
  _tinhCaBai() {
    const app = this.app, ds = app._dsBuoc();
    this._dsDai = ds.map((_, k) => this._duLieu(k).dai);
    this.el.tien.innerHTML = this._dsDai.map((d, k) => `<button style="flex:${d.toFixed(1)}" data-k="${k}" title="${thoat(chu('xv.di-buoc', [k + 1, chuTran(ds[k]?.ten)]))}"><i></i></button>`).join('');
    for (const b of this.el.tien.children) b.addEventListener('click', (e) => { e.stopPropagation(); app.moTab('hoc'); app.moBuoc(Number(b.dataset.k)); });
    this._baiDang = app.dsCanh[app.chiSo]?.id;
  }
  // Dựng lời của bước đang mở nếu chưa có. LƯỜI: chỉ gọi khi sắp nghe hoặc khi bảng đang ẩn (thanh phát cần số liệu), để
  // người chỉ đọc chữ không phải trả công chia phụ đề mỗi lần sang bước.
  _chuanBi() {
    const app = this.app, k = app.chiSoBuoc;
    if (app.chiSo < 0 || k < 0) return null;
    if (this._b && this._b.k === k && this._b.bai === app.chiSo) return this._b;
    if (app.dsCanh[app.chiSo]?.id !== this._baiDang) this._tinhCaBai();
    const d = this._duLieu(k);
    this._b = { bai: app.chiSo, k, ...d, mocGoc: d.moc, moc: this._mocTheoManHinh(d.moc), t: 0, nghi: 0, xongLoi: false, batDau: false,
      trinhDien: app._dsBuoc()[k]?.trinhDien === false, iCau: -2, tTieng: false, moDau: 0, anThe: 0 };
    return this._b;
  }

  // ---------- Ứng dụng báo: sắp đổi bài, sắp mở và vừa mở một bước, vừa ẩn hiện bảng ----------
  khiMoBai() {
    this._baiMoi = true;
    this._anHet();
    this._dungTieng();
    this._b = null;
    this._veCau(-1);
  }
  // Gọi ở đầu app.moBuoc: đang nghe thì ghi lại góc máy, để sau khi bước mới đặt máy quay ta cho nó BAY tới thay vì nhảy cụp.
  truocMoBuoc() {
    if (!this.dangPhat || this._baiMoi) return null;
    return { p: this.app.camera.position.clone(), d: this.app.dk.target.clone() };
  }
  // Gọi ở cuối app.moBuoc (mọi đường sang bước đều đi qua đây: nút, phím, chấm bước, mục lục, tự sang bước).
  // Đang nghe thì nghe tiếp ở bước mới; chưa nghe thì chỉ vẽ lại thanh «Nghe giảng» của bảng.
  khiMoBuoc(k, truoc) {
    const app = this.app;
    const baiMoi = this._baiMoi; this._baiMoi = false;
    const tiep = this.dangPhat;
    if (this.tamDung) { this.tamDung = false; app.datChay(true); }      // đang tạm dừng mà sang bước khác: bước mới không đứng hình
    this._anHet();
    this._dungTieng();
    this._b = null;
    this._veCau(-1);
    this._bao('');
    if (truoc && !app._bay) {
      // Bước mới vừa đặt máy quay tức thì: trả về góc cũ rồi cho bay tới góc mới (bài không phải sửa gì).
      const cam = app.camera, dk = app.dk, p1 = cam.position, d1 = dk.target;
      const xa = truoc.p.distanceTo(p1) + truoc.d.distanceTo(d1), co = Math.max(1e-9, p1.distanceTo(d1));
      if (xa > co * 1e-3) { const toi = p1.toArray(), dich = d1.toArray(); cam.position.copy(truoc.p); dk.target.copy(truoc.d); app.bayToi(toi, dich, GIAY_BAY); }
    }
    if (tiep && !baiMoi) this._sangDan();
    if (tiep || this._anBang) {
      const b = this._chuanBi();
      if (b && this._anBang) {
        this._veThe();
        if (!(tiep && baiMoi)) { this._datThe(true, false); b.anThe = GIAY_THE; }
      }
    }
    if (!this._anBang) this._datThe(false, false);
    this.veThanh();
    if (tiep) this._batDauLoi(baiMoi);
    this._veTien();
    this._baoHeThong();
    if (tiep || this._anBang) this._chayNhip();
    app._vungCho = 0;            // thẻ, phụ đề vừa đổi: nhãn trên mô hình tránh lại
  }
  // Gọi từ app.anHienBang. Ẩn bảng KHÔNG phải vào một chế độ khác: lời đang đọc cứ đọc tiếp, phụ đề dời xuống đáy cửa sổ.
  khiAnHienBang(an) {
    this._anBang = !!an;
    const nut = $('nut-bang');
    if (nut) nut.title = chu(an ? 'xv.hien-bang' : 'gd.an-hien-bai-giang-phim-b');
    if (an) {
      const b = this._chuanBi();
      if (b) { this._veThe(); if (!(b.moDau > 0)) { this._datThe(true, false); b.anThe = GIAY_THE; } }
      this._veTien();
      this._chayNhip();
      this._hienDieuKhien();
    } else {
      clearTimeout(this._henAn);
      document.body.classList.remove('xv-an-dk');
      this._datThe(false, false);
      if (this._b) this._b.anThe = 0;
    }
    this._veNutPhat();
  }

  // ---------- Bắt đầu, tạm dừng ----------
  // Nút lớn «Bắt đầu học có giọng đọc» ở màn hình chào, đường dẫn ?nghe=1, trình đơn của app Mac: vào bài, tự phát,
  // tự sang bước.
  batDau({ tuSang = true } = {}) {
    const app = this.app;
    if (app.chiSo < 0) app.moBai(app.baiDaLuu(), 0);
    if (tuSang) this.batTatTuSang(true);
    app.moTab('hoc');
    this.phatDung(true);
  }
  // Nghe hoặc tạm dừng lời giảng của bước đang mở (nút ▶ trong bảng, thanh phát, phím N; phím cách khi đang nghe).
  // Trên web, lần bấm này chính là thao tác trình duyệt cần để cho phát tiếng: tệp tiếng được phát ngay trong lần bấm.
  phatDung(phat = !this.dangPhat) {
    const app = this.app;
    phat = !!phat;
    if (app.chiSo < 0 || phat === this.dangPhat) return;
    if (phat && !this.dongHoGia && !app.am.bat && app.am.datBat) app.batTatTieng(true);      // đang tắt tiếng mà bấm nghe: bật lại
    this.dangPhat = phat;
    this.tamDung = !phat;
    app.datChay(phat);               // tạm dừng thì mô hình cũng đứng, như một video
    if (!phat) {
      if (this._b?.tTieng && this._am && !this.dongHoGia) this._am.pause();
    } else if (!this._het) {
      let b = this._b;
      if (!b || b.k !== app.chiSoBuoc || b.bai !== app.chiSo || b.xongLoi) { this._b = null; b = this._chuanBi(); }
      if (!b) { this.dangPhat = false; this.tamDung = false; return; }
      if (!b.batDau) this._batDauLoi(false);
      else {
        if (b.tTieng && !this.dongHoGia) this._choPhat();
        this._bao(b.tep ? (b.tTieng ? '' : this._chuBao) : this._chuChuaCoGiong());
      }
    }
    this._veNutPhat();
    this._veTien();
    this._giuManHinh(phat);
    this._baoHeThong();
    this._chayNhip();
  }
  // Bài hay thứ tiếng chưa có giọng: phụ đề vẫn chạy theo nhịp ước tính, không hiện câu giải thích, giao diện gọn.
  _chuChuaCoGiong() { return ''; }
  // Cho lời của bước đang mở cất lên. baiMoi: đây là bước đầu của một bài vừa đổi (bảng ẩn thì hiện thẻ mở đầu vài giây;
  // chạy thật thì chờ cảnh mới dựng xong).
  _batDauLoi(baiMoi) {
    const app = this.app, b = this._b;
    if (!b) return;
    b.batDau = true;
    b.moDau = baiMoi && this._anBang ? GIAY_MO_DAU : 0;
    if (baiMoi && !this.dongHoGia) this._choNong = true;
    if (b.moDau) {
      const dn = app.dsCanh[app.chiSo];
      this.el.moDau.innerHTML = `<small>${thoat(chuTran(dn.phan))}</small><b>${thoat(chu('gd.bai-so', [dn.so ?? app.chiSo + 1]))} · ${thoat(chuTran(dn.ten))}</b>${dn.moTa ? `<span>${thoat(chuTran(dn.moTa))}</span>` : ''}`;
      this._datThe(false, true);
      b.anThe = 0;
    }
    this._bao(b.tep ? '' : this._chuChuaCoGiong());
    // Tệp tiếng của bước được đặt ngay (trình duyệt bắt đầu tải); có thẻ mở đầu hoặc đang chờ cảnh thì lát nữa mới phát.
    if (b.tep && !this.dongHoGia) { this._datTieng(); if (!b.moDau && !this._choNong) this._choPhat(); }
    if (!this.dongHoGia) this._taiTruoc(app._gdTep(b.k + 1));
  }
  // Hết lời mà không tự sang bước (hoặc người học bấm «Dừng» ở thẻ hết bài): về trạng thái nghỉ, mô hình vẫn chạy.
  _xongBuoc() {
    this.dangPhat = false;
    this.tamDung = false;
    this._veCau(-1);
    this._veNutPhat();
    this._veTien();
    this._giuManHinh(false);
    this._baoHeThong();
  }
  // Người học vừa bấm một nút «thử ngay»: bước này khỏi tự trình diễn nữa; đang tạm dừng thì cho mô hình chạy lại để
  // thấy kết quả (lời vẫn dừng).
  daThu() {
    if (this._b) this._b.trinhDien = true;
    if (this.tamDung && !this.app.dangChay) this.app.datChay(true);
  }

  // Hiện, ẩn thẻ tên bước (góc trên trái) và thẻ mở đầu bài (giữa màn hình); chỉ dùng khi bảng đang ẩn. Ô số liệu nằm cùng
  // góc với thẻ tên bước nên nhường chỗ khi thẻ đang hiện; lúc thẻ mở đầu hiện thì mô hình tối bớt và nhãn tạm ẩn.
  _datThe(the, moDau) {
    const lop = document.body.classList;
    this.el.the.classList.toggle('mo', !!the);
    this.el.moDau.classList.toggle('mo', !!moDau);
    this.el.man.classList.toggle('nua', !!moDau);
    lop.toggle('xv-co-the', !!the || !!moDau);
    lop.toggle('xv-dang-mo-dau', !!moDau);
    this.app._vungCho = 0;
  }
  _veThe() {
    const app = this.app, dn = app.dsCanh[app.chiSo], ds = app._dsBuoc(), k = app.chiSoBuoc;
    this.el.the.innerHTML = `<small>${thoat(chu('xv.the', [dn.so ?? app.chiSo + 1, k + 1, ds.length]))}</small><b>${thoat(chuTran(ds[k]?.ten))}</b>`;
  }
  // Hình sáng dần lên từ tối trong chưa tới nửa giây (một cú «chớp mắt» khi đang nghe mà sang bước).
  _sangDan() {
    if (this.dongHoGia || !this.el.man.animate) return;
    try { this.el.man.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 450, easing: 'ease-out' }); } catch { /* trình duyệt cũ: bỏ qua */ }
  }

  // ---------- Tệp tiếng ----------
  // Đặt tệp tiếng của bước đang mở vào trình phát (chưa phát).
  _datTieng() {
    const b = this._b;
    if (!b?.tep) return;
    if (!this._am) {
      const a = new Audio();
      a.preload = 'auto';
      a.addEventListener('ended', () => { if (this._b && this._am === a) this._b.xongLoi = true; });
      a.addEventListener('waiting', () => { if (this._b?.tTieng && this.dangPhat) this._bao(chu('xv.dang-tai')); });
      a.addEventListener('playing', () => { if (this._b?.tTieng) this._bao(''); });
      a.addEventListener('error', () => {
        // Chỉ tính lỗi của tệp đang đặt (networkState 3: không có nguồn dùng được), không tính lần gỡ tệp cũ khi đổi bước.
        if (!this._b?.tTieng || !a.getAttribute('src') || a.networkState !== 3) return;
        this._b.tTieng = false;         // không mở được tệp: chạy tiếp theo đồng hồ ước tính
        this._bao(chu('xv.khong-mo-tieng'));
      });
      this._am = a;
    }
    const a = this._am, app = this.app;
    a.muted = this._cam();
    a.src = `giong-doc/${b.tep.tep}`;
    a.playbackRate = this.toc;
    a.volume = app._gdMucAm ? app._gdMucAm() : 0.8;
    b.tTieng = true;
  }
  _choPhat() {
    const a = this._am;
    if (!a || !this._b?.tTieng || this._b.moDau > 0) return;
    a.playbackRate = this.toc;
    a.play().catch(() => {
      // Trình duyệt chặn tự phát (chưa có lần bấm nào, ví dụ mở bằng đường dẫn ?nghe=1): tạm dừng lời, mời bấm ▶.
      // Mô hình vẫn chạy.
      if (!this._b?.tTieng || !this.dangPhat) return;
      this.dangPhat = false;
      this.tamDung = true;
      this._veNutPhat();
      this._bao(chu('xv.bi-chan'));
      this._hienDieuKhien(true);
    });
  }
  _dungTieng() {
    const a = this._am;
    if (a) { a.pause(); a.removeAttribute('src'); try { a.load(); } catch { /* bỏ qua */ } }
  }
  // Tải sẵn tệp tiếng của bước sắp tới (trên web: để sang bước không phải chờ mạng).
  _taiTruoc(tep) {
    if (!tep || this.dongHoGia) return;
    if (!this._amSau) { this._amSau = new Audio(); this._amSau.preload = 'auto'; this._amSau.muted = true; }
    const src = `giong-doc/${tep.tep}`;
    if (this._amSau.getAttribute('src') !== src) this._amSau.src = src;
  }
  // Mức âm vừa đổi trong bảng «Âm thanh».
  datMucAm() { if (this._am) this._am.volume = this.app._gdMucAm(); }
  // Tiếng của app đang tắt (phím S, nút loa) thì giọng đọc cũng câm; phụ đề vẫn chạy theo.
  _cam() { const am = this.app.am; return !!window.__VT_THU?.tiengCam || !!(am.datBat && !am.bat); }
  datCam() { if (this._am) this._am.muted = this._cam(); }

  // ---------- Đồng hồ ----------
  // Nhịp riêng 10 lần mỗi giây; chỉ chạy khi có việc (đang nghe, thẻ đang đếm, đang chờ cảnh), hết việc thì tự tắt.
  _chayNhip() {
    if (this.dongHoGia || this._hen) return;
    this._tTruoc = performance.now();
    this._hen = setInterval(() => this._nhip(), NHIP);
  }
  _nhip() {
    const now = performance.now();
    const dt = Math.min(0.5, (now - (this._tTruoc ?? now)) / 1000);
    this._tTruoc = now;
    // Vừa đổi bài lúc đang nghe: cảnh mới dựng xong (làm nóng xong) thì mới mở màn và cho lời cất lên.
    if (this._choNong) {
      if (this.app._nong) return;
      this._choNong = false;
      this.el.man.classList.remove('mo');
      const b = this._b;
      if (b?.batDau && !b.moDau && b.tTieng && this.dangPhat) this._choPhat();
      return;
    }
    this.tien(dt);
    if (!this.dangPhat && !this._het && !(this._b?.anThe > 0)) { clearInterval(this._hen); this._hen = null; }
  }
  // Đẩy đồng hồ thêm `giay` giây đồng hồ thật (bộ kiểm gọi thẳng hàm này). Chia nhỏ để không bỏ sót mốc.
  tien(giay) {
    let con = giay;
    while (con > 1e-9) { const d = Math.min(0.1, con); this._buoc(d); con -= d; }
  }
  _buoc(dt) {
    if (this._het) {
      if (this.dangPhat) {
        this._het.dem -= dt;
        const s = this.el.het.querySelector('.xv-dem');
        if (s) s.textContent = chu('xv.tu-chuyen-sau', [Math.max(0, Math.ceil(this._het.dem))]);
        if (this._het.dem <= 0) this._xemTiep();
      }
      return;
    }
    const b = this._b;
    if (!b) return;
    if (b.anThe > 0) { b.anThe -= dt; if (b.anThe <= 0) this._datThe(false, false); }
    if (!this.dangPhat || !b.batDau) return;
    // Mở đầu bài (bảng ẩn): thẻ mở đầu hiện vài giây, rồi thẻ tên bước hiện và lời cất lên.
    if (b.moDau > 0) {
      b.moDau -= dt;
      if (b.moDau > 0) return;
      b.moDau = 0;
      if (this._anBang) { this._datThe(true, false); b.anThe = GIAY_THE; } else this._datThe(false, false);
      if (b.tTieng && !this.dongHoGia) this._choPhat();
      return;
    }
    // Thời điểm trong lời: theo tệp tiếng nếu đang phát thật, không thì theo đồng hồ riêng (nhân tốc độ).
    const a = this._am;
    if (b.tTieng && a && !this.dongHoGia) {
      b.t = a.currentTime || 0;
      if (a.ended) b.xongLoi = true;
    } else {
      b.t += dt * this.toc;
      if (b.t >= b.dai) b.xongLoi = true;
    }
    // Trình diễn của bước (nút «thử ngay» đầu tiên): chạy một lần, khi lời đã đi được khoảng một phần ba; người học đã tự
    // bấm một nút của bước thì thôi.
    if (!b.trinhDien && b.t >= Math.min(b.dai * 0.35, Math.max(2.5, b.dai * 0.2))) { b.trinhDien = true; this._trinhDien(); }
    const i = cauLucDo(b.moc, b.t);
    if (i !== b.iCau) this._veCau(i);
    this._veTien();
    if (b.xongLoi) {
      b.nghi += dt;
      if (b.nghi >= NGHI_SAU_LOI) this._sauBuoc();
    }
  }
  _trinhDien() {
    const app = this.app;
    const b = app._dsBuoc()[this._b.k];
    if (!b || !app.canh) return;
    let ten = typeof b.trinhDien === 'string' ? b.trinhDien : null;
    if (!ten) ten = $('buoc-noi-dung')?.querySelector('.nut-thu')?.dataset.nut;
    const ham = typeof b.trinhDien === 'function' ? b.trinhDien : b.nut?.[ten];
    if (!ham) return;
    try { ham(app.canh, app); } catch (e) { console.error(e); app.loiGhi.push(`trình diễn ở bước ${this._b.k + 1}: ${e?.message || e}`); }
  }
  _sauBuoc() {
    const app = this.app, k = this._b.k;
    if (!this.tuSang) { this._xongBuoc(); return; }
    if (k < app._dsBuoc().length - 1) { app.moBuoc(k + 1); return; }
    this._hienHet();
  }

  // ---------- Hết bài, đổi bài ----------
  _hienHet() {
    const app = this.app;
    const sau = app.dsCanh[app.chiSo + 1];
    this._b.xongLoi = true;
    this._veCau(-1);
    this._het = { dem: sau ? DEM_NGUOC : Infinity };
    this.el.het.innerHTML = sau
      ? `<small>${thoat(chu('xv.bai-tiep'))}</small><b>${thoat(chu('gd.bai-so', [sau.so ?? app.chiSo + 2]))} · ${thoat(chuTran(sau.ten))}</b>
         <span class="xv-dem">${thoat(chu('xv.tu-chuyen-sau', [DEM_NGUOC]))}</span>
         <div><button class="xv-nut-chinh" id="xv-xem-tiep">${thoat(chu('xv.xem-tiep'))}</button><button id="xv-dung">${thoat(chu('xv.dung'))}</button></div>
         <button class="xv-nut-phu" id="xv-xem-lai">${thoat(chu('xv.xem-lai'))}</button>`
      : `<b>${thoat(chu('xv.het-khoa'))}</b><div><button class="xv-nut-chinh" id="xv-dung">${thoat(chu('xv.dung'))}</button><button id="xv-xem-lai">${thoat(chu('xv.xem-lai'))}</button></div>`;
    this.el.het.hidden = false;
    $('xv-xem-tiep')?.addEventListener('click', () => this._xemTiep());
    $('xv-dung')?.addEventListener('click', () => { this._anHet(); this._xongBuoc(); this._hienDieuKhien(true); });
    $('xv-xem-lai')?.addEventListener('click', () => { this._anHet(); this.dangPhat = true; this.tamDung = false; app.datChay(true); this._baiMoi = true; app.moBuoc(0); this._veNutPhat(); });
    app._vungCho = 0;
    this._hienDieuKhien();
  }
  _anHet() { this._het = null; if (this.el) this.el.het.hidden = true; }
  _xemTiep() {
    const app = this.app;
    this._anHet();
    if (app.chiSo >= app.dsCanh.length - 1) return;
    this.dangPhat = true;
    this.tamDung = false;
    this._veNutPhat();
    this._doiBai(app.chiSo + 1, 0);
  }
  // Đang nghe mà đổi sang bài thứ i (thứ tự hiển thị), bước k. Chạy thật: màn tối phủ lên phần mô hình, đổi bài, chờ cảnh
  // mới dựng xong mới mở màn (người xem không thấy cú cắt và dòng «Đang dựng mô hình 3D»). Chạy im lặng: đổi ngay.
  // Lời tự cất lên ở bài mới vì app.moBai đi qua khiMoBuoc.
  _doiBai(i, k = 0) {
    const app = this.app;
    this._anHet();
    this._dungTieng();
    if (this.dongHoGia) { app.moBai(i, k, false); return; }
    this._b = null;
    this._veCau(-1);
    this._datThe(false, false);
    this.el.man.classList.add('mo');
    this._chayNhip();
    clearTimeout(this._henBai);
    this._henBai = setTimeout(() => app.moBai(i, k, false), 340);
  }

  // ---------- Điều khiển ----------
  // Nút lùi của thanh phát và phím ←: đang nghe quá 3 giây thì về đầu bước này, không thì về bước trước.
  lui() {
    const app = this.app;
    if (this._het) { this._anHet(); app.moBuoc(app.chiSoBuoc); return; }
    if (this.dangPhat && this._b?.t > 3) { app.moBuoc(app.chiSoBuoc); return; }
    app.buocTruoc();
  }
  toi() {
    if (this._het) { this._xemTiep(); return; }
    this.app.buocSau();
  }
  datToc(toc) {
    this.toc = toc;
    if (this._am) this._am.playbackRate = toc;
    this._veNutChon();
    this._nho();
  }
  doiToc() { this.datToc(DS_TOC[(DS_TOC.indexOf(this.toc) + 1) % DS_TOC.length]); }
  tocKe(huong) { this.datToc(DS_TOC_PHIM[Math.max(0, Math.min(DS_TOC_PHIM.length - 1, DS_TOC_PHIM.indexOf(this.toc) + huong))]); }
  batTatPhuDe(bat = !this.phuDeBat) {
    this.phuDeBat = !!bat;
    this.el.phuDe.hidden = !bat;
    this._veNutChon();
    this.app._vungCho = 0;
    this._nho();
  }
  batTatTuSang(bat = !this.tuSang) {
    this.tuSang = !!bat;
    luu.ghi(KHOA_TU_SANG, bat ? '1' : '0');
    this._veNutChon();
  }
  // Tua tới một chỗ trong lời của bước đang nghe (bấm thanh tiến độ trong bảng). phan: 0 tới 1.
  tuaToi(phan) {
    const b = this._b;
    if (!b?.batDau) return;
    phan = Math.min(1, Math.max(0, phan));
    const a = this._am;
    if (b.tTieng && a && a.duration && !this.dongHoGia) a.currentTime = a.duration * phan;
    b.t = b.dai * phan;
    b.xongLoi = false; b.nghi = 0; b.iCau = -2;
    this._veCau(cauLucDo(b.moc, b.t));
    this._veTien();
  }
  _nho() { try { localStorage.setItem(KHOA_LUU, JSON.stringify({ toc: this.toc, phuDe: this.phuDeBat })); } catch { /* bỏ qua */ } }

  // ---------- Thanh «Nghe giảng» trong bảng bài giảng (dưới tên bước) ----------
  // Luôn có, kể cả khi bước chưa có giọng đọc: khi đó bấm ▶ thì phụ đề chạy theo nhịp đọc ước tính.
  veThanh() {
    const el = $('giong-doc');
    if (!el) return;
    const app = this.app;
    const t = app._gdTep();
    const ds = app._gdDsGiong ? app._gdDsGiong() : [];
    el.hidden = false;
    el.innerHTML = `<button class="gd-phat" id="gd-phat" title="${thoat(chu('gd.nghe-giang-buoc-nay-phim-n'))}" aria-label="${thoat(chu('gd.nghe-giang-buoc-nay-phim-n'))}">▶</button>
      <div class="gd-giua"><div class="gd-ten"><span>${chu('gd.nghe-giang-buoc-nay')}</span><span id="gd-gio">${t ? phutGiay(t.giay) : ''}</span></div><div class="gd-thanh" id="gd-thanh"><i></i></div></div>
      <div class="gd-hang">
        <button class="gd-chon" id="gd-tu" title="${thoat(chu('gd.doc-xong-thi-tu-sang-buoc-sau-va-doc-tiep'))}">${chu('gd.tu-sang-buoc')}</button>
        <button class="gd-chon" id="gd-cc" title="${thoat(chu('xv.phu-de'))}">${chu('xv.phu-de-ngan')}</button>
        <button class="gd-chon" id="gd-toc" title="${thoat(chu('xv.toc-do'))}"></button>
        ${ds.length > 1 ? `<button class="gd-chon" id="gd-giong" title="${thoat(chu('gd.doi-giong-doc'))}">${thoat(app._gdTenGiong(app._gdGiong))}</button>` : ''}
        <button class="gd-chon gd-an" id="gd-an-bang" title="${thoat(chu('gd.an-hien-bai-giang-phim-b'))}"><i></i><span class="gd-dai">${chu('xv.an-bang')}</span><span class="gd-ngan">${chu('xv.an-bang-ngan')}</span></button>
      </div>
      <div class="gd-bao" id="gd-bao" hidden></div>`;
    $('gd-phat').addEventListener('click', () => this.phatDung());
    $('gd-tu').addEventListener('click', () => this.batTatTuSang());
    $('gd-cc').addEventListener('click', () => this.batTatPhuDe());
    $('gd-toc').addEventListener('click', () => this.doiToc());
    $('gd-an-bang').addEventListener('click', () => app.anHienBang(true));
    $('gd-giong')?.addEventListener('click', () => app.datGiongDoc(ds[(ds.indexOf(app._gdGiong) + 1) % ds.length]));
    $('gd-thanh').addEventListener('click', (e) => { const r = e.currentTarget.getBoundingClientRect(); this.tuaToi((e.clientX - r.left) / Math.max(1, r.width)); });
    this._veNutChon();
    this._veNutPhat();
    this._bao(this._chuBao);
  }
  // Giọng đọc vừa đổi (bảng «Âm thanh», nút giọng trong thanh nghe): vẽ lại thanh; đang nghe thì đọc lại bước này bằng giọng mới.
  khiDoiGiong() {
    const dang = this.dangPhat;
    this._dungTieng();
    this._b = null;
    this._baiDang = null;
    this._veCau(-1);
    if (this._anBang) this._chuanBi();
    this.veThanh();
    if (dang) { this.dangPhat = false; this.phatDung(true); }
    this._veTien();
  }

  // ---------- Vẽ ----------
  _dungDom() {
    const man = document.createElement('div');       // màn tối: phủ phần mô hình, nằm DƯỚI bảng bài giảng và thanh trên
    man.id = 'xv-man';
    man.className = 'xv-man';
    man.setAttribute('aria-hidden', 'true');
    const goc = document.createElement('div');
    goc.id = 'xv-lop';
    const coToanMan = !!(window.webkit?.messageHandlers?.vuTru || document.documentElement.requestFullscreen);
    const nut = (id, lop, khoa) => `<button id="${id}" class="${lop}" title="${thoat(chu(khoa))}" aria-label="${thoat(chu(khoa))}"></button>`;
    goc.innerHTML = `
      <div class="xv-dau" aria-hidden="true">${thoat(chu('xv.dau'))}</div>
      <div class="xv-mo-dau" id="xv-mo-dau"></div>
      <div class="xv-the" id="xv-the"></div>
      <div class="xv-nhay" id="xv-nhay" aria-hidden="true"></div>
      <div class="xv-phu-de" id="xv-phu-de" aria-live="off"></div>
      <div class="xv-het" id="xv-het" hidden></div>
      <div class="xv-dk" id="xv-dk">
        <div class="xv-bao" id="xv-bao" hidden></div>
        <div class="xv-tien" id="xv-tien"></div>
        <div class="xv-hang">
          ${nut('xv-phat', 'xv-phat', 'xv.phat-dung')}${nut('xv-lui', 'xv-lui', 'xv.buoc-truoc')}${nut('xv-toi', 'xv-toi', 'xv.buoc-sau')}
          <span class="xv-gio" id="xv-gio" title="${thoat(chu('xv.phim-tat'))}"></span>
          <span class="xv-gian"></span>
          <button id="xv-tu" class="xv-chu" title="${thoat(chu('gd.doc-xong-thi-tu-sang-buoc-sau-va-doc-tiep'))}">${thoat(chu('gd.tu-sang-buoc'))}</button>
          <button id="xv-toc" class="xv-chu" title="${thoat(chu('xv.toc-do'))}">1×</button>
          <button id="xv-cc" class="xv-chu" title="${thoat(chu('xv.phu-de'))}">CC</button>
          ${coToanMan ? nut('xv-toan-man', 'xv-toan-man', 'gd.toan-man-hinh-phim-f') : ''}
          ${nut('xv-bang', 'xv-bang', 'xv.hien-bang')}
        </div>
      </div>`;
    document.body.append(man, goc);
    this.el = { goc, man, moDau: $('xv-mo-dau'), the: $('xv-the'), nhay: $('xv-nhay'), bao: $('xv-bao'), phuDe: $('xv-phu-de'), het: $('xv-het'), dk: $('xv-dk'), tien: $('xv-tien'), gio: $('xv-gio'), phat: $('xv-phat'), toc: $('xv-toc'), cc: $('xv-cc'), tu: $('xv-tu') };
    this.el.phuDe.hidden = !this.phuDeBat;
    const app = this.app;
    this.el.phat.addEventListener('click', () => this.phatDung());
    $('xv-lui').addEventListener('click', () => this.lui());
    $('xv-toi').addEventListener('click', () => this.toi());
    this.el.tu.addEventListener('click', () => this.batTatTuSang());
    this.el.toc.addEventListener('click', () => this.doiToc());
    this.el.cc.addEventListener('click', () => this.batTatPhuDe());
    $('xv-toan-man')?.addEventListener('click', () => app.toanManHinh());
    $('xv-bang').addEventListener('click', () => app.anHienBang(false));
    // Bảng đang ẩn: rê chuột hay chạm thì hiện thanh phát và thanh trên, 3 giây không động thì ẩn (kể cả con trỏ).
    window.addEventListener('pointermove', () => { if (this._anBang) this._hienDieuKhien(); }, { passive: true });
    window.addEventListener('pointerdown', () => { if (!this._anBang) return; this._anLucXuong = document.body.classList.contains('xv-an-dk'); this._hienDieuKhien(); }, { passive: true, capture: true });
    // Bảng đang ẩn và đang trong một lượt nghe: bấm (không kéo) vào mô hình là tạm dừng hoặc nghe tiếp, như bấm vào khung
    // của một trình xem video. Chưa bấm nghe lần nào thì bấm vào mô hình không làm lời cất lên. Trên màn hình chạm, lần
    // chạm lúc thanh phát đang ẩn chỉ làm hiện thanh phát. Bấm đúp: toàn màn hình.
    const cv = app.renderer.domElement;
    let xuong = null;
    cv.addEventListener('pointerdown', (e) => { xuong = this._anBang ? { x: e.clientX, y: e.clientY, t: performance.now(), an: this._anLucXuong } : null; });
    cv.addEventListener('pointerup', (e) => {
      const x = xuong; xuong = null;
      if (!x || !this._anBang || e.vtDaXuLy || app.tt?.dangKeo || this._het || this._choNong) return;
      if (!this.dangPhat && !this.tamDung) return;
      if (Math.hypot(e.clientX - x.x, e.clientY - x.y) > 6 || performance.now() - x.t > 450) return;
      if (e.pointerType === 'touch' && x.an) return;
      this.phatDung();
      this._nhay();
    });
    cv.addEventListener('dblclick', () => { if (this._anBang) app.toanManHinh(); });
    this._veNutChon();
    this._veNutPhat();
  }

  // Ứng dụng gọi vài lần mỗi giây ở ĐẦU khung hình (ung-dung-bo-cuc.js), cùng lúc đọc các vùng bị che: đặt phụ đề, thẻ
  // hết bài, thẻ mở đầu vào giữa phần khung 3D còn trống, phụ đề nằm trên bảng (điện thoại), trên thanh phát và trên ô
  // số liệu. Đọc bố cục trước, ghi sau cùng, chỉ ghi khi có gì đổi. Trả về các vùng nhãn trên mô hình phải tránh.
  datCho() {
    const el = this.el, app = this.app, W = app.rong, H = app.cao, lop = document.body.classList;
    if (!el || lop.contains('dang-chao')) return [];
    const anBang = lop.contains('an-bang');
    let x1 = W, dayBang = 0;
    const bang = $('bai-hoc');
    if (!anBang && bang?.offsetWidth) {
      if (bang.offsetWidth < W * 0.6) x1 = Math.max(160, bang.offsetLeft - 8);       // bảng nằm bên phải
      else dayBang = Math.max(0, H - bang.offsetTop);                               // bảng nằm dưới (điện thoại cầm dọc)
    }
    const coDk = anBang && !lop.contains('xv-an-dk');
    let day = dayBang;
    if (coDk) day = Math.max(day, el.dk.offsetHeight - 18);
    const xc = x1 / 2, rongToiDa = Math.min(x1 * 0.92, 1180);
    const hud = app.el.hud;
    if (!hud.hidden && hud.offsetHeight > 2) {
      // Ô số liệu nằm ở nửa dưới và chạm dải ngang của phụ đề: phụ đề nằm trên nó.
      const t = hud.offsetTop, l = hud.offsetLeft;
      if (t > H * 0.5 && l < xc + rongToiDa / 2 && l + hud.offsetWidth > xc - rongToiDa / 2) day = Math.max(day, H - t);
    }
    const dayPx = Math.round(day > 0 ? day + 10 : Math.max(22, H * 0.05));
    const yc = Math.round((H - dayBang) / 2);
    const pd = el.phuDe, coPd = !pd.hidden && !!pd.textContent;
    const pw = coPd ? pd.offsetWidth : 0, ph = coPd ? pd.offsetHeight : 0;
    const vung = [];
    const them = (e, mem) => { const r = e.getBoundingClientRect(); if (r.width > 2 && r.height > 2) vung.push([r.left, r.top, r.right, r.bottom, mem]); };
    if (el.the.classList.contains('mo')) them(el.the, 1);
    if (!el.het.hidden) them(el.het, 1);
    if (coDk) them(el.dk, 0);
    if (coPd) vung.push([xc - pw / 2, H - dayPx - ph, xc + pw / 2, H - dayPx, 1]);
    // Ghi (chỉ khi đổi).
    const khoa = `${Math.round(xc)}|${Math.round(x1)}|${dayPx}|${yc}`;
    if (khoa !== this._choCu) {
      this._choCu = khoa;
      const s = el.goc.style;
      s.setProperty('--xv-x', `${Math.round(xc)}px`);
      s.setProperty('--xv-y', `${yc}px`);
      s.setProperty('--xv-rong', `${Math.round(x1)}px`);
      s.setProperty('--xv-day', `${dayPx}px`);
      if (Math.abs(x1 - this._rong) > 8) {
        // Bề ngang phần trống vừa đổi (ẩn hiện bảng, xoay điện thoại, đổi cỡ cửa sổ): chia lại phụ đề của bước đang nghe.
        this._rong = x1;
        const b = this._b;
        if (b) { b.moc = this._mocTheoManHinh(b.mocGoc); b.iCau = -2; if (!this.dangPhat) this._veCau(b.batDau && !b.xongLoi ? cauLucDo(b.moc, b.t) : -1); }
      }
    }
    return vung;
  }
  // Biểu tượng phát / tạm dừng loé lên giữa màn hình khi bấm vào mô hình.
  _nhay() {
    const el = this.el.nhay;
    el.classList.toggle('dang', this.dangPhat);
    if (!el.animate) return;
    try { el.animate([{ opacity: 0.85, transform: 'translate(-50%, -50%) scale(0.8)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(1.25)' }], { duration: 520, easing: 'ease-out' }); } catch { /* bỏ qua */ }
  }
  _coBangNoi() { const a = this.app.el; return !a.mucLuc.hidden || (a.thuatNgu && !a.thuatNgu.hidden) || ($('bang-tieng') && !$('bang-tieng').hidden); }
  _hienDieuKhien(giu = false) {
    const lop = document.body.classList;
    if (lop.contains('xv-an-dk')) { lop.remove('xv-an-dk'); this.app._vungCho = 0; }
    clearTimeout(this._henAn);
    if (giu || !this.dangPhat || !this._anBang) return;
    this._henAn = setTimeout(() => {
      if (!this._anBang || !this.dangPhat || this._het || this._coBangNoi() || this.el.dk.matches(':hover') || $('thanh-tren')?.matches(':hover')) return;
      lop.add('xv-an-dk');
      this.app._vungCho = 0;
    }, AN_DIEU_KHIEN);
  }
  _veNutPhat() {
    const dang = this.dangPhat;
    this.el.phat.classList.toggle('dang', dang);
    const nut = $('gd-phat');
    if (nut) { nut.textContent = dang ? '❚❚' : '▶'; nut.classList.toggle('dang', dang); }
    document.body.classList.toggle('xv-dang-xem', this.dangXem);
    if (dang) this._hienDieuKhien(); else this._hienDieuKhien(true);
  }
  // Các nút bật tắt (tự sang bước, phụ đề) và nút tốc độ, ở cả thanh trong bảng lẫn thanh phát.
  _veNutChon() {
    const chuToc = `${so(this.toc)}×`;
    for (const [e, bat] of [[this.el.tu, this.tuSang], [$('gd-tu'), this.tuSang], [this.el.cc, this.phuDeBat], [$('gd-cc'), this.phuDeBat]]) {
      if (!e) continue;
      e.classList.toggle('bat', bat);
      e.setAttribute('aria-pressed', bat ? 'true' : 'false');
    }
    this.el.toc.textContent = chuToc;
    const t = $('gd-toc');
    if (t) t.textContent = chuToc;
  }
  // Dòng báo nhỏ (chưa có giọng đọc, trình duyệt chưa cho phát tiếng…): hiện ở thanh trong bảng và ở thanh phát.
  _bao(s) {
    this._chuBao = s || '';
    for (const e of [this.el.bao, $('gd-bao')]) {
      if (!e) continue;
      e.textContent = this._chuBao;
      e.title = this._chuBao;
      e.hidden = !this._chuBao;
    }
    document.body.classList.toggle('xv-co-bao', !!this._chuBao);
  }
  _veCau(i) {
    const b = this._b;
    if (b) b.iCau = i;
    const s = i >= 0 && b ? b.moc[i].chu : '';
    if (this.el.phuDe.textContent !== s) { const coTruoc = !!this.el.phuDe.textContent; this.el.phuDe.textContent = s; if (coTruoc !== !!s) this.app._vungCho = 0; }
  }
  _veTien() {
    const b = this._b, app = this.app;
    // Thanh trong bảng.
    const thanh = $('gd-thanh')?.firstElementChild, gio = $('gd-gio');
    const dangNghe = !!b?.batDau && b.k === app.chiSoBuoc;
    if (thanh) { const w = dangNghe ? Math.round(Math.min(1, b.t / Math.max(0.1, b.dai)) * 1000) / 10 : 0; if (thanh._w !== w) { thanh._w = w; thanh.style.width = `${w}%`; } }
    if (gio) {
      const tep = dangNghe ? null : app._gdTep();
      const chuGio = dangNghe ? `${phutGiay(Math.min(b.t, b.dai))} / ${phutGiay(b.dai)}` : tep ? phutGiay(tep.giay) : '';
      if (gio.textContent !== chuGio) gio.textContent = chuGio;
    }
    // Thanh phát ở đáy (chỉ thấy khi bảng ẩn).
    if (!b || !this._anBang) return;
    const ds = this._dsDai || [];
    const phan = Math.min(1, b.t / Math.max(0.1, b.dai));
    const nut = this.el.tien.children;
    for (let k = 0; k < nut.length; k++) {
      const w = k < b.k ? 100 : k > b.k ? 0 : Math.round(phan * 1000) / 10;
      const i = nut[k].firstElementChild;
      if (i._w !== w) { i._w = w; i.style.width = `${w}%`; }
      nut[k].classList.toggle('dang', k === b.k);
    }
    const daQua = ds.slice(0, b.k).reduce((s, d) => s + d, 0) + Math.min(b.t, b.dai);
    const tong = ds.reduce((s, d) => s + d, 0);
    const chuGio = `${phutGiay(daQua)} / ${phutGiay(tong)}`;
    if (this.el.gio.textContent !== chuGio) this.el.gio.textContent = chuGio;
  }

  // ---------- Hệ thống: giữ màn hình sáng, nút phát trên tai nghe và màn hình khoá ----------
  _giuManHinh(bat) {
    if (this.dongHoGia || !navigator.wakeLock) return;
    if (bat && !this._khoaSang) {
      navigator.wakeLock.request('screen').then((k) => { if (this.dangPhat) this._khoaSang = k; else k.release().catch(() => {}); }).catch(() => {});
    } else if (!bat && this._khoaSang) { this._khoaSang.release().catch(() => {}); this._khoaSang = null; }
  }
  _baoHeThong() {
    const ms = navigator.mediaSession;
    if (this.dongHoGia || !ms || !this._b?.batDau || typeof MediaMetadata === 'undefined') return;
    try {
      const app = this.app, dn = app.dsCanh[app.chiSo];
      ms.metadata = new MediaMetadata({ title: chuTran(app._dsBuoc()[this._b.k]?.ten), artist: chu('xv.dau'), album: `${chu('gd.vu-tru-3d')} · ${chu('gd.bai-so', [dn.so ?? app.chiSo + 1])} · ${chuTran(dn.ten)}` });
      ms.playbackState = this.dangPhat ? 'playing' : 'paused';
      if (!this._daGanMs) {
        this._daGanMs = true;
        const gan = (ten, ham) => { try { ms.setActionHandler(ten, ham); } catch { /* trình duyệt không có hành động này */ } };
        gan('play', () => this.phatDung(true));
        gan('pause', () => this.phatDung(false));
        gan('nexttrack', () => this.toi());
        gan('previoustrack', () => this.lui());
      }
    } catch { /* bỏ qua */ }
  }

  // Trạng thái cho bộ kiểm.
  trangThai() {
    const b = this._b, app = this.app;
    return {
      anBang: this._anBang, dangPhat: this.dangPhat, tamDung: this.tamDung, tuSang: this.tuSang, toc: this.toc, phuDeBat: this.phuDeBat,
      bai: app.chiSo, buoc: app.chiSoBuoc, t: b ? lamTron(b.t) : 0, dai: b?.dai ?? 0, coTieng: !!(b ? b.tep : app._gdTep()), uoc: !!b?.uoc,
      phuDe: this.el.phuDe.hidden ? null : this.el.phuDe.textContent ?? '', het: !!this._het, bao: this._chuBao,
      the: this.el.the.classList.contains('mo') ? this.el.the.textContent : '',
      moDau: b?.moDau > 0 ? lamTron(b.moDau) : 0, theMoDau: this.el.moDau.classList.contains('mo') ? this.el.moDau.textContent : '',
      man: this.el.man.classList.contains('mo'),
    };
  }
}
