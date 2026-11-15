// Bố trí nhãn trên mô hình. Mọi nhãn tạo bằng taoNhan() (ve.js) tự vào sổ ở đây. Mỗi khung hình, sau khi CSS2DRenderer
// của three.js đặt nhãn vào chỗ chiếu của điểm neo, bộ này xét lại từng nhãn:
//
//   1. Nhãn phải nằm trong phần màn hình nhìn thấy được: không chui dưới bảng bài giảng, thanh trên, ô số liệu, điều
//      khiển của chế độ video, không bị cắt ở mép cửa sổ. Chạm vào thì lật sang bên kia điểm neo, rồi thử lên trên,
//      xuống dưới, rồi nhích vào trong; hết chỗ thì ẩn.
//   2. Điểm neo bị che (vật nằm dưới bảng bài giảng, ngoài cửa sổ) thì nhãn ẩn: nhãn không đứng một mình khi vật của
//      nó không còn thấy. Riêng vùng che nhỏ (ô số liệu, thẻ tên bước): nhãn được đẩy ra sát mép vùng đó.
//   3. Các nhãn mà bài đưa vào goNhanDeNhau() tránh nhau theo mức ưu tiên: nhãn ưu tiên cao đặt trước. Nhãn thấp hơn
//      mà chạm vào nhãn đã đặt thì được dời sang chỗ khác quanh điểm neo. Ngoại lệ: vật của nó nằm sát (dưới 24 điểm
//      ảnh) vật của một nhãn ưu tiên cao hơn hẳn (hơn từ 15 bậc), ví dụ một hành tinh lọt trong quầng Mặt Trời khi lùi
//      xa: lúc đó nhãn thấp hơn ẩn, không bày quanh vật chính. Hai nhãn ngang hàng nằm sát nhau (hai Mây Magellan) thì
//      vẫn được dời để cùng hiện. Nhãn có giu = true luôn được dời và không bao giờ bị ẩn vì đè.
//
// Cách làm cho nhẹ: không đọc bố cục của trang trong lúc vẽ (cỡ nhãn đo lại vài lần mỗi giây, ở đầu khung hình), dời
// nhãn bằng thuộc tính CSS `translate` (không đụng `transform` mà CSS2DRenderer ghi mỗi khung), ẩn bằng lớp `vt-an`
// (không đụng o.visible và kiểu riêng của bài), và chỉ ghi vào trang khi cách đặt đổi.
//
// Bài không phải gọi gì: taoNhan() tự đăng ký, ứng dụng tự gọi sapXep(). Tuỳ chọn cho bài:
//   taoNhan(html, lop, { uuTien: 80, giu: true })   mức ưu tiên và «không được ẩn vì đè» ngay từ lúc tạo
//   taoNhan(html, lop, { tuDo: true })              nhãn tự do: bộ này không dời, không ẩn (bài tự lo)
//   nhan.datUuTien(80), nhan.datMau('vang' | 0xff8a73 | '#7fcaff'), nhan.datChu(html), nhan.hien(b)

import * as THREE from 'three';

const LE = 6;              // nhãn cách mép cửa sổ ít nhất bấy nhiêu điểm ảnh
const HO = 4;              // nhãn cách một vùng che ít nhất bấy nhiêu
const CACH = 9;            // nhãn đặt trên hoặc dưới điểm neo thì cách điểm neo bấy nhiêu
const VE_GOC = 14;         // đang ở chỗ khác: chỗ gốc phải thoáng thêm bấy nhiêu mới quay về (cho khỏi nháy qua lại)
const DAY_XA = 150;        // điểm neo nằm trong một vùng che nhỏ: nhãn được đẩy ra mép vùng nếu không xa quá mức này
const SAT_NHAU = 24;       // hai điểm neo gần hơn mức này là «sát nhau»
const HON_HAN = 15;        // nhãn đã đặt hơn nhãn đang xét từ bấy nhiêu bậc ưu tiên mà vật lại sát nhau: nhãn đang xét ẩn, không dời
// Các cách đặt, thử theo thứ tự này. Từ 1 tới 8 là dời quanh điểm neo; 9 chỉ dùng khi điểm neo nằm dưới một vùng che nhỏ.
const TEN_KIEU = ['gốc', 'lật', 'trên', 'dưới', 'chếch dưới', 'chếch trên', 'lật, chếch dưới', 'lật, chếch trên', 'nhích', 'đẩy ra mép vùng'];
const K_NHICH = 8, K_DAY = 9;

const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _c = [0, 0, 0, 0];   // hình chữ nhật thử: x0, y0, x1, y1

export class BoNhan {
  constructor() {
    this.ds = [];            // mọi nhãn của bài đang mở
    this.vung = [];          // vùng đang bị che: [x0, y0, x1, y1, mem]; mem = vùng nhỏ, nhãn có thể đẩy ra mép
    this.khung = 0;
    this.rong = 0; this.cao = 0;
    this.phai = Infinity; this.day = Infinity;      // mép phải và mép dưới của phần còn trống (bảng bài giảng chiếm phần kia)
    this.bat = true;         // tắt (false) thì nhãn đứng nguyên chỗ CSS2DRenderer đặt, như trước khi có bộ này
    this._nhom = [];
    this._daDat = [];
  }

  // taoNhan() gọi. Trả về sổ của nhãn (gắn ở o._vtNhan).
  dangKy(o, { uuTien = null, giu = false, tuDo = false } = {}) {
    const el = o.element;
    const r = {
      o, el, w: 0, h: 0, lx: 0, ly: 0, ax: 0, ay: 0, x0: 0, y0: 0, x1: 0, y1: 0,
      dx: 0, dy: 0, kieu: 0, an: false, thay: false, nhom: false, giu: !!giu, tuDo: !!tuDo,
      uuTien: uuTien ?? (el.classList.contains('dam') ? 60 : el.classList.contains('mo') ? 20 : 40), i: this.ds.length,
    };
    o._vtNhan = r;
    this.ds.push(r);
    return r;
  }

  // Ứng dụng gọi khi đổi bài (nhãn của bài cũ đã bị gỡ khỏi trang).
  xoaHet() { this.ds.length = 0; this._nhom.length = 0; this._daDat.length = 0; }

  // Ứng dụng báo các vùng đang bị che (toạ độ cửa sổ): [[x0, y0, x1, y1, mem], …] và cỡ cửa sổ.
  datVung(ds, rong, cao) {
    this.vung = ds;
    this.phai = Infinity; this.day = Infinity;
    for (let i = 0; i < ds.length; i++) {
      const v = ds[i];
      if (v[4]) continue;
      // Vùng lớn áp mép phải (bảng bài giảng trên màn hình rộng) hoặc áp đáy (bảng trên điện thoại): phần trống co lại.
      if (v[2] >= rong - 20 && v[3] - v[1] > cao * 0.5) this.phai = Math.min(this.phai, v[0] - HO);
      else if (v[3] >= cao - 20 && v[2] - v[0] > rong * 0.5) this.day = Math.min(this.day, v[1] - HO);
    }
  }

  // goNhanDeNhau() của bài gọi mỗi khung hình: các nhãn này tránh nhau theo mức ưu tiên.
  vaoNhom(ds) {
    for (let i = 0; i < ds.length; i++) {
      const k = ds[i], o = k.nhan;
      if (!o) continue;
      o.visible = !k.tat;
      const r = o._vtNhan;
      if (!r) continue;
      r.nhom = true;
      if (k.uuTien != null) r.uuTien = k.uuTien;
      r.giu = !!k.giu;
    }
  }

  // Đo nhãn tại chỗ nó đang đứng (CSS2DRenderer vừa đặt, cộng phần bộ này đang dời): bề rộng, bề cao, và độ lệch của
  // hộp so với điểm neo do lề CSS (ví dụ .nhan có margin-left 10 px).
  _do(r) {
    const b = r.el.getBoundingClientRect();
    if (b.width < 1 || b.height < 1) return false;
    r.w = b.width; r.h = b.height;
    r.lx = b.left - r.ax - r.dx + r.o.center.x * b.width;
    r.ly = b.top - r.ay - r.dy + r.o.center.y * b.height;
    return true;
  }

  // Ứng dụng gọi vài lần mỗi giây ở ĐẦU khung hình (trang chưa bị sửa gì nên đọc bố cục không tốn): đo lại cỡ các
  // nhãn đang hiện, phòng khi chữ của nhãn đã đổi. Lúc này nhãn còn đứng đúng chỗ của khung hình trước.
  doLai() {
    const ds = this.ds;
    for (let i = 0; i < ds.length; i++) { const r = ds[i]; if (r.thay && r.el.style.display !== 'none') this._do(r); }
    // Bài tạo nhãn mới ở mỗi bước rồi gỡ nhãn cũ khỏi cảnh: sổ không được phình mãi. Nhãn đã từng hiện mà nay không còn
    // trong trang thì rút khỏi sổ; nếu bài đưa nó vào cảnh lại, taoNhan() tự ghi lại (xem dangKyLai).
    if (ds.length > 96) {
      let n = 0;
      for (let i = 0; i < ds.length; i++) { const r = ds[i]; if (r.daThay && !r.el.parentNode) { r.go = true; continue; } r.i = n; ds[n++] = r; }
      ds.length = n;
    }
  }
  // Nhãn đã bị rút khỏi sổ nay được vẽ lại: ghi lại.
  dangKyLai(r) { r.go = false; r.daThay = false; r.i = this.ds.length; this.ds.push(r); }

  // Vùng che chứa điểm (x, y), hoặc null.
  _vungChua(x, y) {
    const ds = this.vung;
    for (let i = 0; i < ds.length; i++) { const v = ds[i]; if (x > v[0] && x < v[2] && y > v[1] && y < v[3]) return v; }
    return null;
  }

  // Hình chữ nhật _c có nằm trọn trong cửa sổ và không chạm vùng che nào không (ho: khoảng hở đòi thêm).
  _thoang(ho) {
    if (_c[0] < LE || _c[1] < LE || _c[2] > this.rong - LE || _c[3] > this.cao - LE) return false;
    const ds = this.vung, h = HO + ho;
    for (let i = 0; i < ds.length; i++) { const v = ds[i]; if (_c[0] < v[2] + h && _c[2] > v[0] - h && _c[1] < v[3] + h && _c[3] > v[1] - h) return false; }
    return true;
  }

  // Diện tích _c chồng lên các nhãn của nhóm đã đặt (0 = không chạm; có đệm 6 × 2 điểm ảnh như bộ cũ, cộng `them`).
  _dienTichDe(them = 0) {
    let s = 0;
    const ds = this._daDat, px = 6 + them, py = 2 + them;
    for (let i = 0; i < ds.length; i++) {
      const q = ds[i];
      const w = Math.min(_c[2], q.x1 + px) - Math.max(_c[0], q.x0 - px), h = Math.min(_c[3], q.y1 + py) - Math.max(_c[1], q.y0 - py);
      if (w > 0 && h > 0) s += w * h;
    }
    return s;
  }

  // Điểm neo của r có nằm sát điểm neo của một nhãn đã đặt và ưu tiên cao hơn hẳn không.
  _satNhanKhac(r) {
    const ds = this._daDat;
    for (let i = 0; i < ds.length; i++) { const q = ds[i]; if (q.uuTien - r.uuTien >= HON_HAN && Math.hypot(q.ax - r.ax, q.ay - r.ay) < SAT_NHAU) return true; }
    return false;
  }

  // Đặt _c vào cách đặt thứ k của nhãn r. Trả về false nếu cách đó không dùng được.
  _cach(r, k, vungNeo) {
    const bx = r.ax + r.lx - r.o.center.x * r.w, by = r.ay + r.ly - r.o.center.y * r.h;
    const xToiDa = Math.min(this.rong - LE, this.phai) - r.w, yToiDa = Math.min(this.cao - LE, this.day) - r.h;
    let x = bx, y = by;
    if (k === 1) {                                   // lật sang bên kia điểm neo
      x = 2 * r.ax - bx - r.w;
      if (Math.abs(x - bx) < 6) return false;        // nhãn nằm giữa điểm neo: lật cũng như không
    } else if (k === 2 || k === 3) {                 // trên, dưới điểm neo (căn giữa, nhích vào phần trống nếu cần)
      x = Math.max(Math.min(r.ax - r.w / 2, xToiDa), LE);
      y = k === 2 ? r.ay - r.h - CACH : r.ay + CACH;
    } else if (k >= 4 && k <= 7) {                   // chếch: giữ bên (4, 5) hoặc lật bên (6, 7), hộp nằm hẳn dưới hoặc trên điểm neo
      if (k >= 6) { x = 2 * r.ax - bx - r.w; if (Math.abs(x - bx) < 6) return false; }
      y = k % 2 === 0 ? r.ay + 3 : r.ay - r.h - 3;
      if (Math.abs(y - by) < 4) return false;
    } else if (k === K_NHICH) {                      // nhích vào phần trống, không quá bề rộng của nhãn
      x = Math.max(Math.min(bx, xToiDa), LE);
      y = Math.max(Math.min(by, yToiDa), LE);
      if (Math.abs(x - bx) > r.w || Math.abs(y - by) > r.h * 2 || (x === bx && y === by)) return false;
    } else if (k === K_DAY) {                        // điểm neo nằm dưới một vùng che nhỏ: đẩy nhãn ra mép gần nhất của vùng
      if (!vungNeo) return false;
      x = Math.max(Math.min(r.ax - r.w / 2, xToiDa), LE);
      const yTren = vungNeo[1] - HO - r.h - 1, yDuoi = vungNeo[3] + HO + 1;
      const trenVua = yTren >= LE, duoiVua = yDuoi <= yToiDa;
      const len = r.ay - vungNeo[1], xuong = vungNeo[3] - r.ay;
      if (trenVua && (len <= xuong || !duoiVua)) { if (len > DAY_XA) return false; y = yTren; }
      else if (duoiVua) { if (xuong > DAY_XA) return false; y = yDuoi; }
      else return false;
    }
    _c[0] = x; _c[1] = y; _c[2] = x + r.w; _c[3] = y + r.h;
    return true;
  }

  // Chọn cách đặt cho một nhãn. coNhom: xét cả va chạm với các nhãn của nhóm đã đặt.
  _dat(r, coNhom) {
    const trongCuaSo = r.ax >= -2 && r.ay >= -2 && r.ax <= this.rong + 2 && r.ay <= this.cao + 2;
    const vungNeo = trongCuaSo ? this._vungChua(r.ax, r.ay) : null;
    let chon = -1;
    if (trongCuaSo && !(vungNeo && !vungNeo[4])) {
      const dau = vungNeo ? K_DAY : 1, cuoi = vungNeo ? K_DAY : K_NHICH;
      // Chỗ gốc: dùng được thì dùng. Không dùng được vì chạm vùng che hay mép cửa sổ: thử các chỗ khác. Không dùng được
      // vì đè nhãn ưu tiên cao hơn: chỉ thử chỗ khác khi vật của nhãn không nằm sát vật của nhãn đã đặt (xem đầu tệp).
      let gocThoang = false, gocDe = 0, gocRong = false;
      if (!vungNeo && this._cach(r, 0, null)) {
        gocThoang = this._thoang(0);
        gocDe = coNhom ? this._dienTichDe() : 0;
        // Đang đứng chỗ khác thì chỗ gốc phải thoáng hẳn mới quay về (nhãn không nháy qua lại khi máy quay nhích).
        gocRong = gocThoang && gocDe === 0 && (r.kieu === 0 || r.an || (this._thoang(VE_GOC) && (!coNhom || this._dienTichDe(VE_GOC / 2) === 0)));
      }
      const cu = r.kieu;
      if (gocRong) chon = 0;
      else if (!coNhom || gocDe === 0 || r.giu || !this._satNhanKhac(r)) {
        // Giữ cách đặt của khung trước nếu còn dùng được.
        if (cu >= dau && cu <= cuoi && !r.an && this._cach(r, cu, vungNeo) && this._thoang(0) && (!coNhom || this._dienTichDe() === 0)) chon = cu;
        else {
          for (let k = dau; k <= cuoi; k++) {
            if (this._cach(r, k, vungNeo) && this._thoang(0) && (!coNhom || this._dienTichDe() === 0)) { chon = k; break; }
          }
        }
        // Chỗ gốc dùng được nhưng chưa «thoáng hẳn», mà cũng không còn chỗ nào khác: về chỗ gốc.
        if (chon < 0 && gocThoang && gocDe === 0) chon = 0;
        // Nhãn «giữ»: không chỗ nào trống thì nhận chỗ đè lên nhãn khác ít nhất (miễn không chui vào vùng che).
        if (chon < 0 && coNhom && r.giu) {
          let itNhat = Infinity;
          for (let k = vungNeo ? K_DAY : 0; k <= cuoi; k++) {
            if (!this._cach(r, k, vungNeo) || !this._thoang(0)) continue;
            const s = this._dienTichDe();
            if (s < itNhat) { itNhat = s; chon = k; }
          }
        }
      }
    }
    const an = chon < 0;
    let dx = 0, dy = 0;
    if (!an) {
      this._cach(r, chon, vungNeo);
      r.x0 = _c[0]; r.y0 = _c[1]; r.x1 = _c[2]; r.y1 = _c[3];
      dx = Math.round(_c[0] - (r.ax + r.lx - r.o.center.x * r.w));
      dy = Math.round(_c[1] - (r.ay + r.ly - r.o.center.y * r.h));
      r.kieu = chon;
      if (coNhom) this._daDat.push(r);
    }
    if (dx !== r.dx || dy !== r.dy) { r.dx = dx; r.dy = dy; r.el.style.translate = dx || dy ? `${dx}px ${dy}px` : ''; }
    if (an !== r.an) { r.an = an; r.el.classList.toggle('vt-an', an); }
  }

  // Ứng dụng gọi mỗi khung hình, ngay sau khi CSS2DRenderer vẽ.
  sapXep(camera, rong, cao) {
    if (!this.bat || !this.ds.length) return;
    this.khung++;
    this.rong = rong; this.cao = cao;
    _m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const ds = this.ds, nhom = this._nhom;
    nhom.length = 0; this._daDat.length = 0;
    for (let i = 0; i < ds.length; i++) {
      const r = ds[i], el = r.el;
      r.thay = false;
      if (r.tuDo || el.style.display === 'none' || !el.parentNode) continue;      // vật ẩn, ngoài tầm nhìn, hoặc chưa vào cảnh
      _v.setFromMatrixPosition(r.o.matrixWorld).applyMatrix4(_m);
      r.ax = (_v.x * 0.5 + 0.5) * rong; r.ay = (-_v.y * 0.5 + 0.5) * cao;
      if (!r.w && !this._do(r)) continue;      // nhãn mới thấy lần đầu: đo ngay; sau đó ứng dụng gọi doLai() vài lần mỗi giây
      r.thay = true; r.daThay = true;
      if (r.nhom) nhom.push(r); else this._dat(r, false);
    }
    if (nhom.length) {
      nhom.sort(theoUuTien);
      for (let i = 0; i < nhom.length; i++) this._dat(nhom[i], true);
    }
  }

  // Cho khung tương tác: diện tích mà hình chữ nhật (toạ độ cửa sổ) chồng lên các nhãn đang hiện và các vùng che;
  // phần thò ra ngoài cửa sổ cũng tính. 0 = chỗ trống.
  chong(x0, y0, x1, y1) {
    let s = 0;
    const ds = this.ds, vung = this.vung;
    for (let i = 0; i < ds.length; i++) {
      const r = ds[i];
      if (!r.thay || r.an) continue;
      const w = Math.min(x1, r.x1) - Math.max(x0, r.x0), h = Math.min(y1, r.y1) - Math.max(y0, r.y0);
      if (w > 0 && h > 0) s += w * h;
    }
    for (let i = 0; i < vung.length; i++) {
      const v = vung[i];
      const w = Math.min(x1, v[2]) - Math.max(x0, v[0]), h = Math.min(y1, v[3]) - Math.max(y0, v[1]);
      if (w > 0 && h > 0) s += 3 * w * h;
    }
    if (this.rong) {
      const trong = Math.max(0, Math.min(x1, this.rong - LE) - Math.max(x0, LE)) * Math.max(0, Math.min(y1, this.cao - LE) - Math.max(y0, LE));
      s += 3 * ((x1 - x0) * (y1 - y0) - trong);
    }
    return s;
  }

  // Cho bộ kiểm: mọi nhãn đang được vẽ, chỗ đứng và cách đặt.
  trangThai() {
    return this.ds.filter((r) => r.thay).map((r) => ({
      chu: r.el.textContent.slice(0, 60), x0: Math.round(r.x0), y0: Math.round(r.y0), x1: Math.round(r.x1), y1: Math.round(r.y1),
      an: r.an, kieu: TEN_KIEU[r.kieu], nhom: r.nhom, uuTien: r.uuTien, giu: r.giu, neo: [Math.round(r.ax), Math.round(r.ay)],
    }));
  }
}

function theoUuTien(a, b) { return b.uuTien - a.uuTien || a.i - b.i; }

// Một bộ dùng chung cho cả trang (mỗi lúc chỉ có một bài đang mở).
export const boNhan = new BoNhan();
