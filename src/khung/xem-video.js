// Chế độ «Xem như video»: mô hình chiếm cả cửa sổ, giọng đọc từng bước, phụ đề chạy theo giọng, tự sang bước, hết bài
// thì mời xem bài tiếp. Mục đích: người xem nghe và nhìn mô hình như xem một video, đỡ phải đọc chữ.
//
// Nguồn dữ liệu (đều gói sẵn vào trang lúc dựng, chạy được cả app Mac lẫn web):
//   - tệp tiếng: app._gdTep(k) (từ giong-doc/danh-sach.json), mốc phụ đề nằm trong trường `phuDe` của từng tệp
//     (build.mjs đọc giong-doc/<giọng>/<id>-<bước>.phu-de.json);
//   - lời đọc tiếng Việt: __LOI_DOC__ (build.mjs đọc src/loi-doc/vi/*.json);
//   - không có giọng đọc: phụ đề lấy từ lời đọc (tiếng Việt) hoặc lời giảng của bước (thứ tiếng đang chọn), thời lượng ước
//     theo độ dài chữ (xem chia-phu-de.js).
//
// Một lượt xem đi như một video:
//   - đầu mỗi bài: màn tối mở dần, thẻ mở đầu («Phần · Bài · tên bài») hiện vài giây rồi lời mới cất lên;
//   - mỗi bước: thẻ nhỏ «Bài 1 · Bước 2/8 · tên bước», giọng đọc, phụ đề, nút «thử ngay» đầu tiên tự chạy làm trình diễn;
//     sang bước thì máy quay BAY tới góc mới (kể cả khi bài đặt máy quay tức thì) và hình sáng dần lên từ tối;
//   - hết bài: thẻ «Bài tiếp theo» đếm ngược; đổi bài qua một nhịp màn tối, không cắt cụp.
// Không đụng vòng vẽ 3D: mọi việc của chế độ chạy trong một nhịp riêng 10 lần mỗi giây, chỉ đổi chữ khi câu đổi; các hiệu
// ứng chuyển cảnh chỉ là độ mờ của một lớp phủ (trình duyệt tự ghép, không thêm lượt vẽ nào cho card đồ hoạ).
// Bộ kiểm (kiem-tra/kiem-xem-video.mjs) và lượt chụp ảnh chạy im lặng: không có nhịp tự chạy, không phát tiếng, đổi bài
// tức thì; bộ kiểm tự đẩy đồng hồ bằng tien(giây).

import { chu } from '../ngon-ngu/giao-dien.js';
import { ngonNgu } from '../ngon-ngu/dich.js';
import { dinhDang } from './bai-giang.js';
import { chiaPhuDe, datMocUocTinh, cauLucDo, laChuVuong, doDai } from './chia-phu-de.js';
import { texThanhChu, chuCoCongThuc } from './tex-thanh-chu.js';

/* global __LOI_DOC__, __LOI_DOC_DICH__ */
const LOI_DOC = (typeof __LOI_DOC__ !== 'undefined' && __LOI_DOC__) || {};
// Lời đọc đã dịch: { en: { <id bài>: [lời bước 1, …] }, 'zh-CN': …, ja: … } (build.mjs đọc src/loi-doc/<mã tiếng>/*.json).
const LOI_DOC_DICH = (typeof __LOI_DOC_DICH__ !== 'undefined' && __LOI_DOC_DICH__) || {};
const DS_TOC = [1, 1.25, 1.5];             // nút tốc độ đi vòng qua ba mức này
const DS_TOC_PHIM = [0.75, 1, 1.25, 1.5, 2];   // phím , và . đi qua đủ năm mức
const NGHI_SAU_LOI = 1.0;        // giây nghỉ sau khi hết lời, rồi mới sang bước
const GIAY_THE = 4.5;            // thẻ «Bài 1 · Bước 2/8 · tên» hiện bấy nhiêu giây
const GIAY_MO_DAU = 2.6;         // thẻ mở đầu bài hiện bấy nhiêu giây rồi lời mới cất lên
const DEM_NGUOC = 5;             // hết bài: đếm ngược trước khi sang bài tiếp
const AN_DIEU_KHIEN = 3000;      // điều khiển tự ẩn sau 3 giây không rê chuột
const NHIP = 100;                // mili giây: phụ đề cập nhật tối đa 10 lần mỗi giây
const GIAY_BAY = 1.4;            // sang bước: máy quay bay tới góc mới trong bấy nhiêu giây
const KHOA_LUU = 'vu-tru-3d.xem-video';
const $ = (id) => document.getElementById(id);
const so = (x) => (ngonNgu === 'vi' ? String(x).replace('.', ',') : String(x));
const phutGiay = (s) => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const thoat = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Tên bài, tên bước thành chữ thường: công thức trong dòng đổi thành chữ đọc được (trước bản 3.7 bị xoá hẳn, nên bước
// «Hệ số tỉ lệ $a(t)$ và dịch chuyển đỏ» hiện thành «Hệ số tỉ lệ  và dịch chuyển đỏ»).
const chuTran = (s) => chuCoCongThuc(s || '').replace(/[*{}\\]/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

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

export class XemVideo {
  constructor(app) {
    this.app = app;
    this.mo = false;
    this.dangPhat = false;
    this.toc = 1;
    this.phuDeBat = true;
    try {                        // nhớ tốc độ và lựa chọn phụ đề của người xem
      const luu = JSON.parse(localStorage.getItem(KHOA_LUU) || 'null');
      if (luu && DS_TOC_PHIM.includes(luu.toc)) this.toc = luu.toc;
      if (luu && luu.phuDe === false) this.phuDeBat = false;
    } catch { /* chế độ riêng tư: bỏ qua */ }
    // Chạy im lặng (bộ kiểm, chụp ảnh): không nhịp tự chạy, không phát tiếng; đồng hồ do bộ kiểm đẩy.
    this.dongHoGia = !!(app.imLang || window.__VT_THU?.dongHoGia);
    this._b = null;            // bước đang chiếu: { k, moc, dai, tep, t, … }
    this._het = null;          // thẻ hết bài: { dem }
    this._choCanh = null;      // đang đổi bài: chờ cảnh mới dựng xong rồi mới mở màn
    $('nut-xem-video')?.addEventListener('click', () => this.vao());
    window.addEventListener('keydown', (e) => this._phim(e), true);
  }

  // ---------- Vào, ra ----------
  vao() {
    if (this.mo) return;
    const app = this.app;
    if (app.chiSo < 0) app.moBai(app.baiDaLuu(), 0);
    this.mo = true;
    this._bangCu = document.body.classList.contains('an-bang');
    app.el.mucLuc.hidden = true;
    if (app.el.thuatNgu) app.el.thuatNgu.hidden = true;
    if ($('bang-tieng')) $('bang-tieng').hidden = true;
    app._gdDung?.();
    app.datChay(true);
    app.moTab('hoc');
    this._dungDom();
    document.body.classList.add('xem-video');
    app.anHienBang(true);
    this.el.goc.hidden = false;
    this.el.toc.textContent = `${so(this.toc)}×`;
    this.el.phuDe.hidden = !this.phuDeBat;
    this.el.cc.classList.toggle('bat', this.phuDeBat);
    this.dangPhat = true;
    this._veNutPhat();
    this._tinhCaBai();
    const k = Math.max(0, app.chiSoBuoc);
    this._chieuBuoc(k, { moDau: k === 0 });
    if (!this.dongHoGia) { this._tTruoc = performance.now(); this._hen = setInterval(() => this._nhip(), NHIP); this._giuManHinh(true); }
    app._ghiNhatKy?.({ loai: 'xem-video', vao: true, bai: app.soBai?.() ?? app.chiSo + 1, buoc: app.chiSoBuoc + 1 });
  }

  ra() {
    if (!this.mo) return;
    const app = this.app;
    this.mo = false;
    clearInterval(this._hen); this._hen = null;
    clearTimeout(this._henAn); clearTimeout(this._henBai);
    this._dungTieng();
    this._giuManHinh(false);
    this._b = null; this._het = null; this._choCanh = null;
    this.el.goc.hidden = true;
    this.el.man.classList.remove('mo');
    this._datThe(false, false);
    document.body.classList.remove('xem-video', 'xv-an-dk', 'xv-co-bao');
    app.datChay(true);
    app.anHienBang(this._bangCu);
    app._veGiongDoc?.();          // thanh «Nghe giảng» của bước đang mở, về trạng thái thường
    app._ghiNhatKy?.({ loai: 'xem-video', vao: false, bai: app.soBai?.() ?? app.chiSo + 1, buoc: app.chiSoBuoc + 1 });
  }

  // ---------- Dữ liệu một bước ----------
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
      const moc = tep.phuDe?.length ? tep.phuDe : datMocUocTinh(chiaPhuDe(this._loiDoc(k) || ''), { tong: tep.giay });
      return { tep, moc, dai: tep.giay, uoc: !tep.phuDe?.length };
    }
    const loi = this._loiDoc(k);
    const khoi = loi ? [loi] : khoiCuaBuoc(app._dsBuoc()[k]);
    const vuong = laChuVuong(khoi.join(' '));
    const moc = datMocUocTinh(khoi.flatMap((s) => chiaPhuDe(s, { vuong })), { vuong });
    return { tep: null, moc, dai: Math.max(4, (moc.at(-1)?.t1 ?? 0) + 0.3), uoc: true };
  }
  // Cửa sổ hẹp (điện thoại cầm dọc): dòng 42 ký tự không vừa bề ngang ở cỡ chữ tối thiểu. Chia lại từng câu phụ đề theo bề
  // ngang thật mà vẫn tối đa HAI dòng mỗi lần hiện: câu dài thành hai ba câu ngắn nối nhau, thời gian của câu gốc chia theo
  // độ dài. (Bản đầu ghép lại thành một câu ba bốn dòng, che mất mô hình.)
  _mocTheoManHinh(moc) {
    if (innerWidth >= 700 || !moc?.length) return moc;
    const co = Math.max(18, Math.min(innerHeight * 0.032, innerWidth * 0.046));
    const ra = [];
    for (const m of moc) {
      const vuong = laChuVuong(m.chu);
      const suc = Math.floor((innerWidth * 0.92) / (co * (vuong ? 1.02 : 0.53)));
      if (!m.chu.split('\n').some((d) => doDai(d, vuong) > suc)) { ra.push(m); continue; }
      const ds = chiaPhuDe(m.chu.replace(/\n/g, vuong ? '' : ' '), { vuong, dai: suc });
      const tong = ds.reduce((s, c) => s + c.length, 0) || 1;
      let t = m.t0;
      for (const c of ds) { const d = ((m.t1 - m.t0) * c.length) / tong; ra.push({ t0: Math.round(t * 100) / 100, t1: Math.round((t + d) * 100) / 100, chu: c }); t += d; }
    }
    return ra;
  }
  _tinhCaBai() {
    const n = this.app._dsBuoc().length;
    this._dsDai = [];
    for (let k = 0; k < n; k++) this._dsDai.push(this._duLieu(k).dai);
    const dn = this.app.dsCanh[this.app.chiSo];
    this.el.tien.innerHTML = this._dsDai.map((d, k) => `<button style="flex:${d.toFixed(1)}" data-k="${k}" title="${thoat(chu('xv.di-buoc', [k + 1, chuTran(this.app._dsBuoc()[k]?.ten)]))}"><i></i></button>`).join('');
    for (const b of this.el.tien.children) b.addEventListener('click', (e) => { e.stopPropagation(); this._chieuBuoc(Number(b.dataset.k)); });
    this._baiDang = dn?.id;
  }

  // ---------- Chiếu một bước ----------
  // moDau: đây là lúc bắt đầu một bài (hiện thẻ mở đầu vài giây rồi lời mới cất lên).
  _chieuBuoc(k, { moDau = false } = {}) {
    const app = this.app;
    const ds = app._dsBuoc();
    k = Math.max(0, Math.min(ds.length - 1, k));
    this._anHet();
    this._dungTieng();
    // Mở lại từ đầu bước: cảnh về trạng thái đầu của bước (vao() của bước chạy lại). Bài nào đặt máy quay tức thì thì ở
    // chế độ này máy quay bay tới chỗ đó cho êm, hình sáng dần lên từ tối thay cho một cú cắt.
    const cam = app.camera, dk = app.dk;
    const p0 = cam.position.clone(), d0 = dk.target.clone();
    app.moBuoc(k);
    app._gdDung?.();
    if (!moDau && !app._bay) {
      const p1 = cam.position, d1 = dk.target;
      const xa = p0.distanceTo(p1) + d0.distanceTo(d1), co = Math.max(1e-9, p1.distanceTo(d1));
      if (xa > co * 1e-3) {
        const toi = p1.toArray(), dich = d1.toArray();
        cam.position.copy(p0); dk.target.copy(d0);
        app.bayToi(toi, dich, GIAY_BAY);
      }
    }
    if (!moDau) this._sangDan();
    if (this.app.dsCanh[app.chiSo]?.id !== this._baiDang) this._tinhCaBai();
    const d = this._duLieu(k);
    const b = ds[k];
    this._b = { k, ...d, mocGoc: d.moc, moc: this._mocTheoManHinh(d.moc), t: 0, nghi: 0, xongLoi: false, trinhDien: b?.trinhDien === false, iCau: -2, tTieng: false, moDau: moDau ? GIAY_MO_DAU : 0, anThe: 0 };
    const dn = app.dsCanh[app.chiSo];
    // Thẻ tên bước (góc trên trái) và thẻ mở đầu bài (giữa màn hình).
    this.el.the.innerHTML = `<small>${thoat(chu('xv.the', [dn.so ?? app.chiSo + 1, k + 1, ds.length]))}</small><b>${thoat(chuTran(b?.ten))}</b>`;
    if (moDau) {
      this.el.moDau.innerHTML = `<small>${thoat(chuTran(dn.phan))}</small><b>${thoat(chu('gd.bai-so', [dn.so ?? app.chiSo + 1]))} · ${thoat(chuTran(dn.ten))}</b>${dn.moTa ? `<span>${thoat(chuTran(dn.moTa))}</span>` : ''}`;
      this._datThe(false, true);
    } else {
      this._datThe(true, false);
      this._b.anThe = GIAY_THE;
    }
    // Dòng báo nhỏ khi không có tiếng.
    this._bao(d.tep ? '' : chu(ngonNgu === 'vi' ? 'xv.chua-co-giong' : 'xv.chua-co-giong-tieng'));
    this._veCau(-1);
    this._veTien();
    this._baoHeThong();
    app._vungCho = 0;            // thẻ, phụ đề vừa đổi: nhãn trên mô hình tránh lại
    // Tệp tiếng của bước được đặt ngay (trình duyệt bắt đầu tải); mở đầu bài thì chờ thẻ mở đầu xong mới phát.
    if (d.tep && !this.dongHoGia) { this._datTieng(); if (!moDau && this.dangPhat) this._choPhat(); }
    if (!this.dongHoGia) this._taiTruoc(app._gdTep(k + 1));
  }

  // Hiện, ẩn thẻ tên bước (góc trên trái) và thẻ mở đầu bài (giữa màn hình). Ô số liệu nằm cùng góc với thẻ tên bước nên
  // nhường chỗ khi thẻ đang hiện; lúc thẻ mở đầu hiện thì mô hình tối bớt và nhãn trên mô hình tạm ẩn cho chữ dễ đọc.
  _datThe(the, moDau) {
    this.el.the.classList.toggle('mo', !!the);
    this.el.moDau.classList.toggle('mo', !!moDau);
    this.el.man.classList.toggle('nua', !!moDau);
    document.body.classList.toggle('xv-co-the', !!the || !!moDau);
    document.body.classList.toggle('xv-dang-mo-dau', !!moDau);
    this.app._vungCho = 0;
  }

  // Hình sáng dần lên từ tối trong chưa tới nửa giây (một cú «chớp mắt» khi sang bước).
  _sangDan() {
    if (this.dongHoGia || !this.el?.man.animate) return;
    try { this.el.man.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 450, easing: 'ease-out' }); } catch { /* trình duyệt cũ: bỏ qua */ }
  }

  // Đặt tệp tiếng của bước đang chiếu vào trình phát (chưa phát).
  _datTieng() {
    const b = this._b;
    if (!b?.tep) return;
    if (!this._am) {
      const a = new Audio();
      a.preload = 'auto';
      a.muted = !!window.__VT_THU?.tiengCam;
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
    const a = this._am;
    const app = this.app;
    if (!app.am.bat && app.am.datBat) app.batTatTieng(true);
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
      // Trình duyệt chặn tự phát (chưa có lần bấm): tạm dừng, chờ người xem bấm ▶.
      if (!this._b?.tTieng) return;
      this.dangPhat = false;
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

  // ---------- Đồng hồ ----------
  _nhip() {
    const now = performance.now();
    const dt = Math.min(0.5, (now - (this._tTruoc ?? now)) / 1000);
    this._tTruoc = now;
    // Đang đổi bài: cảnh mới dựng xong (làm nóng xong) thì mới chiếu bước đầu và mở màn.
    const cho = this._choCanh;
    if (cho) {
      if (this.app._nong || !this.app.canh) return;
      this._choCanh = null;
      this._tinhCaBai();
      this._chieuBuoc(cho.k, { moDau: cho.k === 0 });
      this.el.man.classList.remove('mo');
      return;
    }
    this.tien(dt);
  }
  // Đẩy đồng hồ của chế độ thêm `giay` giây đồng hồ thật (bộ kiểm gọi thẳng hàm này). Chia nhỏ để không bỏ sót mốc.
  tien(giay) {
    let con = giay;
    while (this.mo && con > 1e-9) { const d = Math.min(0.1, con); this._buoc(d); con -= d; }
  }
  _buoc(dt) {
    const b = this._b;
    if (this._het) {
      if (this.dangPhat) {
        this._het.dem -= dt;
        const s = this.el.het.querySelector('.xv-dem');
        if (s) s.textContent = chu('xv.tu-chuyen-sau', [Math.max(0, Math.ceil(this._het.dem))]);
        if (this._het.dem <= 0) this._xemTiep();
      }
      return;
    }
    if (!b) return;
    if (b.anThe > 0) { b.anThe -= dt; if (b.anThe <= 0) this._datThe(false, false); }
    if (!this.dangPhat) return;
    // Mở đầu bài: thẻ mở đầu hiện vài giây, rồi thẻ tên bước hiện và lời cất lên.
    if (b.moDau > 0) {
      b.moDau -= dt;
      if (b.moDau > 0) return;
      b.moDau = 0;
      this._datThe(true, false);
      b.anThe = GIAY_THE;
      if (b.tTieng && !this.dongHoGia) this._choPhat();
      return;
    }
    // Thời điểm trong lời: theo tệp tiếng nếu đang phát thật, không thì theo đồng hồ của chế độ (nhân tốc độ).
    const a = this._am;
    if (b.tTieng && a && !this.dongHoGia) {
      b.t = a.currentTime || 0;
      if (a.ended) b.xongLoi = true;
    } else {
      b.t += dt * this.toc;
      if (b.t >= b.dai) b.xongLoi = true;
    }
    // Trình diễn của bước (nút «thử ngay» đầu tiên): chạy một lần, khi lời đã đi được khoảng một phần ba.
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
    const app = this.app;
    const k = this._b.k;
    if (k < app._dsBuoc().length - 1) { this._chieuBuoc(k + 1); return; }
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
      : `<b>${thoat(chu('xv.het-khoa'))}</b><div><button class="xv-nut-chinh" id="xv-ra-het">${thoat(chu('xv.thoat-ngan'))}</button><button id="xv-xem-lai">${thoat(chu('xv.xem-lai'))}</button></div>`;
    this.el.het.hidden = false;
    $('xv-xem-tiep')?.addEventListener('click', () => this._xemTiep());
    $('xv-dung')?.addEventListener('click', () => { this._anHet(); this.phatDung(false); this._hienDieuKhien(true); });
    $('xv-ra-het')?.addEventListener('click', () => this.ra());
    $('xv-xem-lai')?.addEventListener('click', () => { this.dangPhat = true; this._veNutPhat(); this.app.datChay(true); this._chieuBuoc(0, { moDau: true }); });
    this.app._vungCho = 0;
    this._hienDieuKhien();
  }
  _anHet() { this._het = null; if (this.el) this.el.het.hidden = true; }
  _xemTiep() {
    const app = this.app;
    this._anHet();
    if (app.chiSo >= app.dsCanh.length - 1) return;
    this.dangPhat = true;
    this._veNutPhat();
    app.datChay(true);
    this._doiBai(app.chiSo + 1, 0);
  }
  // Đổi sang bài thứ i (thứ tự hiển thị) rồi chiếu bước k (-1 = bước cuối). Chạy thật: màn tối phủ lên, đổi bài, chờ cảnh
  // mới dựng xong mới mở màn (không để người xem thấy cú cắt và dòng «Đang dựng mô hình 3D»). Chạy im lặng: đổi ngay.
  _doiBai(i, k = 0) {
    const app = this.app;
    this._anHet();
    this._dungTieng();
    const mo = () => {
      app.moBai(i, 0, false);
      const buoc = k < 0 ? app._dsBuoc().length - 1 : k;
      return buoc;
    };
    if (this.dongHoGia) { const buoc = mo(); this._tinhCaBai(); this._chieuBuoc(buoc, { moDau: buoc === 0 }); return; }
    this._b = null;
    this._veCau(-1);
    this._datThe(false, false);
    this.el.man.classList.add('mo');
    clearTimeout(this._henBai);
    this._henBai = setTimeout(() => { if (this.mo) this._choCanh = { k: mo() }; }, 340);
  }

  // ---------- Điều khiển ----------
  phatDung(phat = !this.dangPhat) {
    if (!this.mo) return;
    if (this._het && phat) { this._het.dem = Math.max(this._het.dem, 0); }
    this.dangPhat = phat;
    this._veNutPhat();
    this.app.datChay(phat);          // tạm dừng thì mô hình cũng đứng, như một video
    this._giuManHinh(phat);
    const a = this._am;
    if (this._b?.tTieng && a && !this.dongHoGia) {
      if (phat) { if (this._b.xongLoi) this._sauBuoc(); else this._choPhat(); } else a.pause();
    }
    if (phat && this._b && !this._b.tep) this._bao(chu(ngonNgu === 'vi' ? 'xv.chua-co-giong' : 'xv.chua-co-giong-tieng'));
    else if (phat && this._b?.tTieng) this._bao('');
    this._baoHeThong();
  }
  buocSau() {
    const app = this.app;
    if (this._het) { this._xemTiep(); return; }
    if (this._b && this._b.k < app._dsBuoc().length - 1) this._chieuBuoc(this._b.k + 1);
    else if (this._b) this._hienHet();
  }
  buocTruoc() {
    const app = this.app;
    if (this._het) { this._chieuBuoc(app._dsBuoc().length - 1); return; }
    if (!this._b) return;
    // Đã nghe quá 3 giây thì về đầu bước này, không thì về bước trước (như nút lùi của trình xem video).
    if (this._b.t > 3) { this._chieuBuoc(this._b.k); return; }
    if (this._b.k > 0) this._chieuBuoc(this._b.k - 1);
    else if (app.chiSo > 0) this._doiBai(app.chiSo - 1, -1);
    else this._chieuBuoc(0);
  }
  baiSau() { if (this.app.chiSo < this.app.dsCanh.length - 1) this._xemTiep(); }
  baiTruoc() { if (this.app.chiSo > 0) this._doiBai(this.app.chiSo - 1, 0); else this._chieuBuoc(0, { moDau: true }); }
  datToc(toc) {
    this.toc = toc;
    if (this._am) this._am.playbackRate = toc;
    this.el.toc.textContent = `${so(toc)}×`;
    this._nho();
  }
  doiToc() { this.datToc(DS_TOC[(DS_TOC.indexOf(this.toc) + 1) % DS_TOC.length]); }
  batTatPhuDe(bat = !this.phuDeBat) {
    this.phuDeBat = bat;
    this.el.phuDe.hidden = !bat;
    this.el.cc.classList.toggle('bat', bat);
    this.app._vungCho = 0;
    this._nho();
  }
  _nho() { try { localStorage.setItem(KHOA_LUU, JSON.stringify({ toc: this.toc, phuDe: this.phuDeBat })); } catch { /* bỏ qua */ } }

  _phim(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const dangGo = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement;
    if (dangGo) return;
    const k = e.key;
    // Phím cách, Enter trên một nút của chế độ: để nút tự nhận (bấm nút bằng bàn phím), không xử lý hai lần.
    if (this.mo && (k === ' ' || k === 'Enter') && e.target instanceof HTMLButtonElement && e.target.closest('#xem-video')) { e.stopPropagation(); return; }
    if (!this.mo) {
      if ((k === 'v' || k === 'V') && !document.body.classList.contains('dang-chao')) { e.preventDefault(); this.vao(); }
      return;
    }
    // Trong chế độ: giữ phím F (toàn màn hình) và S (bật, tắt tiếng) của app, chặn các phím khác của chế độ thường.
    if (k === 'f' || k === 'F' || k === 's' || k === 'S' || k === 'Shift') return;
    e.preventDefault();
    e.stopPropagation();
    this._hienDieuKhien();
    if (k === 'Escape' || k === 'v' || k === 'V') this.ra();
    else if (this._choCanh) return;                                          // đang đổi bài: chờ màn mở
    else if (k === ' ' || k === 'k' || k === 'K') this.phatDung();
    else if (k === 'ArrowRight') { if (e.shiftKey) this.baiSau(); else this.buocSau(); }
    else if (k === 'ArrowLeft') { if (e.shiftKey) this.baiTruoc(); else this.buocTruoc(); }
    else if (k === 'PageDown') this.baiSau();
    else if (k === 'PageUp') this.baiTruoc();
    else if (k === 'Home') this._chieuBuoc(0);
    else if (k === 'r' || k === 'R') { if (this._b) this._chieuBuoc(this._b.k); }
    else if (k === 'c' || k === 'C') this.batTatPhuDe();
    else if (k === ',' || k === '<') this.datToc(DS_TOC_PHIM[Math.max(0, DS_TOC_PHIM.indexOf(this.toc) - 1)]);
    else if (k === '.' || k === '>') this.datToc(DS_TOC_PHIM[Math.min(DS_TOC_PHIM.length - 1, DS_TOC_PHIM.indexOf(this.toc) + 1)]);
    else if (k >= '1' && k <= '9' && this._b) { const n = Number(k) - 1; if (n < this.app._dsBuoc().length) this._chieuBuoc(n); }
    else if (k === 'Enter' && this._het) this._xemTiep();
  }

  // ---------- Vẽ ----------
  _dungDom() {
    if (this.el) return;
    const goc = document.createElement('div');
    goc.id = 'xem-video';
    goc.hidden = true;
    const coToanMan = !!(window.webkit?.messageHandlers?.vuTru || document.documentElement.requestFullscreen);
    goc.innerHTML = `
      <div class="xv-man" id="xv-man" aria-hidden="true"></div>
      <div class="xv-dau" aria-hidden="true">${thoat(chu('xv.dau'))}</div>
      <div class="xv-mo-dau" id="xv-mo-dau"></div>
      <div class="xv-the" id="xv-the"></div>
      <div class="xv-nhay" id="xv-nhay" aria-hidden="true"></div>
      <div class="xv-phu-de" id="xv-phu-de" aria-live="polite"></div>
      <div class="xv-het" id="xv-het" hidden></div>
      <button class="xv-thoat" id="xv-thoat" title="${thoat(chu('xv.thoat'))}" aria-label="${thoat(chu('xv.thoat'))}">✕</button>
      <div class="xv-dk" id="xv-dk">
        <div class="xv-bao" id="xv-bao" hidden></div>
        <div class="xv-tien" id="xv-tien"></div>
        <div class="xv-hang">
          <button id="xv-phat" class="xv-phat" title="${thoat(chu('xv.phat-dung'))}" aria-label="${thoat(chu('xv.phat-dung'))}"></button>
          <button id="xv-lui" class="xv-lui" title="${thoat(chu('xv.buoc-truoc'))}" aria-label="${thoat(chu('xv.buoc-truoc'))}"></button>
          <button id="xv-toi" class="xv-toi" title="${thoat(chu('xv.buoc-sau'))}" aria-label="${thoat(chu('xv.buoc-sau'))}"></button>
          <span class="xv-gio" id="xv-gio" title="${thoat(chu('xv.phim-tat'))}"></span>
          <span class="xv-gian"></span>
          <button id="xv-toc" class="xv-chu" title="${thoat(chu('xv.toc-do'))}">1×</button>
          <button id="xv-cc" class="xv-chu bat" title="${thoat(chu('xv.phu-de'))}">CC</button>
          ${coToanMan ? `<button id="xv-toan-man" class="xv-toan-man" title="${thoat(chu('gd.toan-man-hinh-phim-f'))}" aria-label="${thoat(chu('gd.toan-man-hinh-phim-f'))}"></button>` : ''}
        </div>
      </div>`;
    document.body.append(goc);
    this.el = { goc, man: $('xv-man'), moDau: $('xv-mo-dau'), the: $('xv-the'), nhay: $('xv-nhay'), bao: $('xv-bao'), phuDe: $('xv-phu-de'), het: $('xv-het'), dk: $('xv-dk'), thoat: $('xv-thoat'), tien: $('xv-tien'), gio: $('xv-gio'), phat: $('xv-phat'), toc: $('xv-toc'), cc: $('xv-cc') };
    this.el.thoat.addEventListener('click', () => this.ra());
    this.el.phat.addEventListener('click', () => this.phatDung());
    $('xv-lui').addEventListener('click', () => this.buocTruoc());
    $('xv-toi').addEventListener('click', () => this.buocSau());
    this.el.toc.addEventListener('click', () => this.doiToc());
    this.el.cc.addEventListener('click', () => this.batTatPhuDe());
    $('xv-toan-man')?.addEventListener('click', () => this.app.toanManHinh());
    // Rê chuột hay chạm: hiện điều khiển, 3 giây không động thì ẩn (kể cả con trỏ).
    window.addEventListener('pointermove', () => { if (this.mo) this._hienDieuKhien(); }, { passive: true });
    window.addEventListener('pointerdown', () => { if (!this.mo) return; this._anLucXuong = document.body.classList.contains('xv-an-dk'); this._hienDieuKhien(); }, { passive: true, capture: true });
    // Bấm (không kéo) vào mô hình: phát hoặc tạm dừng, như bấm vào khung của một trình xem video. Trên màn hình chạm,
    // lần chạm lúc điều khiển đang ẩn chỉ làm hiện điều khiển. Bấm đúp: toàn màn hình.
    const cv = this.app.renderer.domElement;
    let xuong = null;
    cv.addEventListener('pointerdown', (e) => { xuong = this.mo ? { x: e.clientX, y: e.clientY, t: performance.now(), an: this._anLucXuong } : null; });
    cv.addEventListener('pointerup', (e) => {
      const x = xuong; xuong = null;
      if (!x || !this.mo || e.vtDaXuLy || this.app.tt?.dangKeo || this._het || this._choCanh) return;
      if (Math.hypot(e.clientX - x.x, e.clientY - x.y) > 6 || performance.now() - x.t > 450) return;
      if (e.pointerType === 'touch' && x.an) return;
      this.phatDung();
      this._nhay();
    });
    cv.addEventListener('dblclick', () => { if (this.mo) this.app.toanManHinh(); });
    // Xoay điện thoại, đổi cỡ cửa sổ: chia lại phụ đề của bước đang chiếu theo bề ngang mới.
    window.addEventListener('resize', () => { const b = this._b; if (this.mo && b) { b.moc = this._mocTheoManHinh(b.mocGoc); b.iCau = -2; } });
    this._veNutPhat();
  }
  // Biểu tượng phát / tạm dừng loé lên giữa màn hình khi bấm vào mô hình.
  _nhay() {
    const el = this.el.nhay;
    el.classList.toggle('dang', this.dangPhat);
    if (!el.animate) return;
    try { el.animate([{ opacity: 0.85, transform: 'translate(-50%, -50%) scale(0.8)' }, { opacity: 0, transform: 'translate(-50%, -50%) scale(1.25)' }], { duration: 520, easing: 'ease-out' }); } catch { /* bỏ qua */ }
  }
  _hienDieuKhien(giu = false) {
    if (document.body.classList.contains('xv-an-dk')) { document.body.classList.remove('xv-an-dk'); this.app._vungCho = 0; }
    clearTimeout(this._henAn);
    if (giu || !this.dangPhat) return;
    this._henAn = setTimeout(() => { if (this.mo && this.dangPhat && !this.el.dk.matches(':hover')) { document.body.classList.add('xv-an-dk'); this.app._vungCho = 0; } }, AN_DIEU_KHIEN);
  }
  _veNutPhat() {
    this.el?.phat.classList.toggle('dang', this.dangPhat);
    if (this.dangPhat) this._hienDieuKhien(); else this._hienDieuKhien(true);
  }
  // Dòng báo nhỏ (chưa có giọng đọc…): nằm trong thanh điều khiển, ẩn hiện cùng thanh, không đè phụ đề.
  _bao(s) {
    this.el.bao.textContent = s;
    this.el.bao.title = s;
    this.el.bao.hidden = !s;
    document.body.classList.toggle('xv-co-bao', !!s);
  }
  _veCau(i) {
    const b = this._b;
    if (b) b.iCau = i;
    const s = i >= 0 && b ? b.moc[i].chu : '';
    if (this.el.phuDe.textContent !== s) { const coTruoc = !!this.el.phuDe.textContent; this.el.phuDe.textContent = s; if (coTruoc !== !!s) this.app._vungCho = 0; }
  }
  _veTien() {
    const b = this._b;
    if (!b || !this.el) return;
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
      navigator.wakeLock.request('screen').then((k) => { if (this.mo && this.dangPhat) this._khoaSang = k; else k.release().catch(() => {}); }).catch(() => {});
    } else if (!bat && this._khoaSang) { this._khoaSang.release().catch(() => {}); this._khoaSang = null; }
  }
  _baoHeThong() {
    const ms = navigator.mediaSession;
    if (this.dongHoGia || !ms || !this._b || typeof MediaMetadata === 'undefined') return;
    try {
      const app = this.app, dn = app.dsCanh[app.chiSo];
      ms.metadata = new MediaMetadata({ title: chuTran(app._dsBuoc()[this._b.k]?.ten), artist: chu('xv.dau'), album: `${chu('gd.vu-tru-3d')} · ${chu('gd.bai-so', [dn.so ?? app.chiSo + 1])} · ${chuTran(dn.ten)}` });
      ms.playbackState = this.dangPhat ? 'playing' : 'paused';
      if (!this._daGanMs) {
        this._daGanMs = true;
        const gan = (ten, ham) => { try { ms.setActionHandler(ten, ham); } catch { /* trình duyệt không có hành động này */ } };
        gan('play', () => this.phatDung(true));
        gan('pause', () => this.phatDung(false));
        gan('nexttrack', () => { if (this.mo) this.buocSau(); });
        gan('previoustrack', () => { if (this.mo) this.buocTruoc(); });
      }
    } catch { /* bỏ qua */ }
  }

  // Trạng thái cho bộ kiểm.
  trangThai() {
    const b = this._b;
    return {
      mo: this.mo, dangPhat: this.dangPhat, toc: this.toc, phuDeBat: this.phuDeBat,
      bai: this.app.chiSo, buoc: b?.k ?? -1, t: b ? Math.round(b.t * 100) / 100 : 0, dai: b?.dai ?? 0, coTieng: !!b?.tep, uoc: !!b?.uoc,
      phuDe: this.el?.phuDe.hidden ? null : this.el?.phuDe.textContent ?? '', het: !!this._het, bao: this.el?.bao.hidden ? '' : this.el?.bao.textContent,
      the: this.el?.the.classList.contains('mo') ? this.el.the.textContent : '',
      moDau: b?.moDau > 0 ? Math.round(b.moDau * 100) / 100 : 0, theMoDau: this.el?.moDau.classList.contains('mo') ? this.el.moDau.textContent : '',
      man: !!this.el?.man.classList.contains('mo'),
    };
  }
}
