// Bảng điều khiển trong bài học (thanh trượt, nút chọn, công tắc, đồ thị) và ô số liệu (HUD).

import { noiSo } from './chu-so.js';

const tao = (the, lop, html) => {
  const el = document.createElement(the);
  if (lop) el.className = lop;
  if (html != null) el.innerHTML = html;
  return el;
};

export class BangDieuKhien {
  // am: khung âm thanh (tuỳ chọn) để các điều khiển có tiếng chạm nhẹ.
  constructor(el, { am = null } = {}) { this.el = el; this.am = am; this._tiengTruot = 0; }
  xoa() { this.el.innerHTML = ''; }

  // Thanh trượt. log = true: trượt theo thang logarit (cần min > 0).
  thanhTruot({ nhan, min, max, buoc = null, giaTri, hienThi = (v) => String(v), khiDoi, log = false }) {
    const hang = tao('div', 'dk-hang');
    const dong = tao('div', 'dk-nhan');
    const ten = tao('span', '', nhan);
    const gt = tao('span', 'gia-tri');
    dong.append(ten, gt);
    const inp = tao('input');
    inp.type = 'range';
    const ra = (v) => (log ? Math.exp(v) : v);
    const vao = (v) => (log ? Math.log(v) : v);
    inp.min = vao(min); inp.max = vao(max);
    inp.step = buoc != null && !log ? buoc : 'any';
    const ve = (v) => {
      gt.innerHTML = hienThi(v);
      inp.style.setProperty('--muc', `${(100 * (vao(v) - vao(min))) / (vao(max) - vao(min))}%`);
    };
    inp.value = vao(giaTri);
    ve(giaTri);
    inp.addEventListener('input', () => {
      const v = ra(parseFloat(inp.value)); ve(v); khiDoi?.(v);
      const luc = performance.now();
      if (luc - this._tiengTruot > 70) { this._tiengTruot = luc; this.am?.phat('re', { cao: 0.8 + 0.5 * (vao(v) - vao(min)) / (vao(max) - vao(min) || 1) }); }
    });
    hang.append(dong, inp);
    this.el.append(hang);
    return {
      el: hang,
      dat: (v, goi = false) => { const k = Math.min(max, Math.max(min, v)); inp.value = vao(k); ve(k); if (goi) khiDoi?.(k); },
      lay: () => ra(parseFloat(inp.value)),
      datNhan: (h) => { ten.innerHTML = h; },
    };
  }

  // Dãy nút chọn một trong nhiều.
  chon({ nhan = null, luaChon, giaTri, khiDoi }) {
    const hang = tao('div', 'dk-hang');
    if (nhan) hang.append(tao('div', 'dk-nhan', `<span>${nhan}</span>`));
    const day = tao('div', 'dk-nut-day');
    const nuts = new Map();
    const dat = (v, goi = false) => {
      for (const [k, b] of nuts) b.classList.toggle('chon', k === v);
      if (goi) khiDoi?.(v);
    };
    for (const lc of luaChon) {
      const b = tao('button', 'dk-nut', lc.nhan);
      if (lc.moTa) b.title = lc.moTa;
      b.addEventListener('click', () => { this.am?.phat('bam'); dat(lc.giaTri, true); });
      nuts.set(lc.giaTri, b);
      day.append(b);
    }
    hang.append(day);
    this.el.append(hang);
    dat(giaTri);
    return { el: hang, dat };
  }

  // Dãy nút hành động.
  nut(ds) {
    const day = tao('div', 'dk-nut-day');
    for (const n of ds) {
      const b = tao('button', `dk-nut${n.chinh ? ' chinh' : ''}`, n.nhan);
      if (n.moTa) b.title = n.moTa;
      b.addEventListener('click', () => { this.am?.phat('bam'); n.khiBam(b); });
      day.append(b);
    }
    this.el.append(day);
    return day;
  }

  congTac({ nhan, giaTri, khiDoi }) {
    const l = tao('label', 'dk-cong-tac');
    const inp = tao('input');
    inp.type = 'checkbox';
    inp.checked = !!giaTri;
    inp.addEventListener('change', () => { this.am?.phat('gat', { cao: inp.checked ? 1.12 : 0.9 }); khiDoi?.(inp.checked); });
    l.append(tao('span', '', nhan), inp);
    this.el.append(l);
    return { el: l, dat: (v, goi = false) => { inp.checked = !!v; if (goi) khiDoi?.(!!v); }, lay: () => inp.checked };
  }

  chuThich(html) { const d = tao('div', 'dk-chu-thich', html); this.el.append(d); return { el: d, dat: (h) => { if (d.innerHTML !== h) d.innerHTML = h; } }; }
  the(html = '') { const d = tao('div', 'dk-the', html); this.el.append(d); return { el: d, dat: (h) => { if (d.innerHTML !== h) d.innerHTML = h; }, hien: (b) => { d.hidden = !b; } }; }

  // Khung vẽ 2D cho đồ thị nhỏ. Trả về { ctx, rong, cao } tính theo điểm CSS; đã tính tỉ lệ điểm ảnh.
  doThi(cao = 150) {
    const c = tao('canvas', 'dk-do-thi');
    this.el.append(c);
    const rong = Math.max(200, this.el.clientWidth || 340);
    const tl = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(rong * tl); c.height = Math.round(cao * tl);
    c.style.height = `${cao}px`;
    const ctx = c.getContext('2d');
    ctx.setTransform(tl, 0, 0, tl, 0, 0);
    return { el: c, ctx, rong, cao };
  }
}

// Ô số liệu của bài (góc dưới trái; trên điện thoại nằm trên cùng). Bài trả về các dòng qua hud() của cảnh.
// Ô thu gọn được: chỉ còn dòng đầu và số dòng đang ẩn («+3»). Điện thoại mặc định thu gọn (ô mở che gần hết mô hình),
// chạm vào ô để mở; màn hình rộng mặc định mở, bấm mũi tên ở góc ô để thu gọn. Lựa chọn được nhớ riêng cho từng loại màn hình.
const KHOA_O_SO_LIEU = 'vu-tru-3d.o-so-lieu';
const manHinhNho = () => window.innerWidth <= 600 || window.innerHeight <= 500;
export class Hud {
  constructor(el) {
    this.el = el; this.cu = '';
    this.than = document.createElement('div');
    this.than.className = 'hud-than';
    this.nut = document.createElement('button');
    this.nut.className = 'hud-nut';
    this.nut.type = 'button';
    el.textContent = '';
    el.append(this.than, this.nut);
    el.hidden = true;
    this._nho = manHinhNho();
    this.gon = this._docGon();
    el.classList.toggle('gon', this.gon);
    el.addEventListener('click', (e) => { e.stopPropagation(); this.datGon(!this.gon); });
    window.addEventListener('resize', () => { const nho = manHinhNho(); if (nho !== this._nho) { this._nho = nho; this.datGon(this._docGon(), false); } });
  }
  _docGon() {
    let luu = null;
    try { luu = localStorage.getItem(`${KHOA_O_SO_LIEU}.${this._nho ? 'nho' : 'rong'}`); } catch { /* chế độ riêng tư */ }
    return luu ? luu === 'gon' : this._nho;
  }
  datGon(gon, nho = true) {
    this.gon = !!gon;
    this.el.classList.toggle('gon', this.gon);
    if (nho) { try { localStorage.setItem(`${KHOA_O_SO_LIEU}.${this._nho ? 'nho' : 'rong'}`, this.gon ? 'gon' : 'mo'); } catch { /* bỏ qua */ } }
  }
  // Đặt chú thích cho nút thu gọn (ứng dụng gọi một lần, sau khi có bộ dịch).
  datChuNut(chu) { this.nut.title = chu; this.nut.setAttribute('aria-label', chu); }
  // dong: mảng [nhãn, giá trị] hoặc chuỗi html.
  dat(dong) {
    if (!dong || !dong.length) { if (this.cu !== '') { this.than.innerHTML = ''; this.cu = ''; this.el.hidden = true; } return; }
    const html = noiSo(dong.map((d) => `<div class="dong">${Array.isArray(d) ? `${d[0]}: <b>${d[1]}</b>` : d}</div>`).join(''));
    if (html !== this.cu) {
      this.than.innerHTML = html; this.cu = html;
      if (this.el.hidden) this.el.hidden = false;
      const con = dong.length - 1;
      if (con !== this._con) { this._con = con; this.el.dataset.con = con > 0 ? `+${con}` : ''; this.el.classList.toggle('mot-dong', con <= 0); }
    }
  }
}

// Bảng màu chung cho đồ thị nhỏ.
export const MAU = {
  chu: '#eceae4', mo: '#8a8d9a', luoi: 'rgba(255,255,255,0.09)', truc: 'rgba(255,255,255,0.28)',
  vang: '#f3c66f', xanh: '#7fcaff', do: '#ff8a73', hong: '#ff7aa8', luc: '#8fe3a8',
};

// Vẽ khung đồ thị: lưới, trục, nhãn trục. Trả về hàm đổi tọa độ dữ liệu → điểm ảnh.
export function khungDoThi(g, { rong, cao, x0, x1, y0, y1, nhanX = '', nhanY = '', vachX = [], vachY = [], le = [34, 10, 10, 24] }) {
  const [trai, phai, tren, duoi] = le;
  const X = (x) => trai + ((x - x0) / (x1 - x0)) * (rong - trai - phai);
  const Y = (y) => cao - duoi - ((y - y0) / (y1 - y0)) * (cao - tren - duoi);
  g.clearRect(0, 0, rong, cao);
  g.font = '10.5px -apple-system, "Helvetica Neue", sans-serif';
  g.lineWidth = 1;
  g.strokeStyle = MAU.luoi;
  g.fillStyle = MAU.mo;
  g.textBaseline = 'top'; g.textAlign = 'center';
  for (const v of vachX) {
    const [gt, chu] = Array.isArray(v) ? v : [v, String(v)];
    g.beginPath(); g.moveTo(X(gt), tren); g.lineTo(X(gt), cao - duoi); g.stroke();
    g.fillText(chu, X(gt), cao - duoi + 4);
  }
  g.textBaseline = 'middle'; g.textAlign = 'right';
  for (const v of vachY) {
    const [gt, chu] = Array.isArray(v) ? v : [v, String(v)];
    g.beginPath(); g.moveTo(trai, Y(gt)); g.lineTo(rong - phai, Y(gt)); g.stroke();
    g.fillText(chu, trai - 5, Y(gt));
  }
  g.strokeStyle = MAU.truc;
  g.beginPath(); g.moveTo(trai, tren); g.lineTo(trai, cao - duoi); g.lineTo(rong - phai, cao - duoi); g.stroke();
  g.fillStyle = MAU.mo;
  if (nhanX) { g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(nhanX, rong - phai, cao - duoi - 3); }
  if (nhanY) { g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(nhanY, trai + 5, tren + 1); }
  return { X, Y };
}
