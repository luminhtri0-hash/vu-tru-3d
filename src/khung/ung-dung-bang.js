// Lõi ứng dụng, phần bảng bài học: ba thẻ (Bài giảng, Tóm tắt, Tự kiểm), mục lục, dấu «đã học».
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { chu } from '../ngon-ngu/giao-dien.js';
import { BangDieuKhien } from './giao-dien.js';
import { dinhDang, trongDong, veCongThuc, veCauHoi, ganCauHoi, coCongThucVua } from './bai-giang.js';
import { $, luu, KHOA_XONG } from './ung-dung-luu.js';

export const PT_BANG = {
  moTab(ten) {
    for (const b of this.el.bang.querySelectorAll('.tab button')) b.classList.toggle('chon', b.dataset.tab === ten);
    for (const s of this.el.bang.querySelectorAll('.trang')) s.hidden = s.dataset.trang !== ten;
    this.el.bang.scrollTop = 0;
    coCongThucVua(this.el.bang.querySelector('.trang:not([hidden])'));
  },
  _danhDauXong(id) {
    if (this.daHoc.has(id)) return;
    this.daHoc.add(id);
    luu.ghi(KHOA_XONG, [...this.daHoc].join(','));
    const b = this.el.mucLuc.querySelector(`button[data-id="${id}"]`);
    if (b) b.classList.add('xong');
  },

  // ---------- Bảng bài học ----------
  _veBang(dn, i) {
    const truoc = this.dsCanh[i - 1], sau = this.dsCanh[i + 1];
    const bg = dn.baiGiang || {};
    const li = (s) => `<li>${trongDong(s)}</li>`;
    const tom = [
      `<p class="y-chinh">${trongDong(dn.yChinh || '')}</p>`,
      bg.mucTieu?.length ? `<h2>${chu("gd.hoc-xong-bai-nay-ban-se")}</h2><ul class="muc-tieu">${bg.mucTieu.map(li).join('')}</ul>` : '',
      bg.congThuc?.length ? `<h2>${chu("gd.cong-thuc-can-nho")}</h2>${veCongThuc(bg.congThuc)}` : '',
      dn.conSo?.length ? `<h2>${chu("gd.con-so-dang-nho")}</h2><ul class="con-so">${dn.conSo.map(li).join('')}</ul>` : '',
      dn.hieuDung ? `<h2>${chu("gd.hieu-cho-dung")}</h2><div class="hieu-dung">${trongDong(dn.hieuDung)}</div>` : '',
      bg.buoc?.length && dn.giaiThich ? `<h2>${chu("gd.tom-tat-nhanh")}</h2><div class="bg">${dinhDang(dn.giaiThich)}</div>` : '',
      bg.docThem?.length ? `<h2>${chu("gd.doc-them")}</h2><ul class="doc-them">${bg.docThem.map(li).join('')}</ul>` : '',
      // Nguồn số liệu (dn.nguon) vẫn giữ trong dữ liệu bài, không hiện cho người học để
      // giao diện gọn. Sách nên đọc vẫn hiện ở mục «Đọc thêm».
    ].join('');
    this.el.bang.innerHTML = `
      <div class="phan">${dn.phan || ''} · ${chu("gd.bai-so", [dn.so ?? i + 1])}</div>
      <h1>${dn.ten}</h1>
      <div class="tab">
        <button data-tab="hoc" class="chon">${chu("gd.bai-giang")}</button>
        <button data-tab="tom">${chu("gd.tom-tat")}</button>
        ${bg.cauHoi?.length ? `<button data-tab="hoi">${chu("gd.tu-kiem")}</button>` : ''}
      </div>
      <section class="trang" data-trang="hoc">
        <div class="buoc-thanh"><span id="buoc-so"></span><div id="buoc-cham"></div></div>
        <div id="buoc-ten"></div>
        <div class="giong-doc" id="giong-doc" hidden></div>
        <div class="bg" id="buoc-noi-dung"></div>
        <div class="buoc-nut"><button id="buoc-truoc">${chu("gd.buoc-truoc")}</button><button id="buoc-sau" class="chinh">${chu("gd.buoc-sau")}</button></div>
        <h2>${chu("gd.dieu-khien-mo-hinh")}</h2>
        <div class="dieu-khien" id="dieu-khien"></div>
      </section>
      <section class="trang" data-trang="tom" hidden>${tom}</section>
      ${bg.cauHoi?.length ? `<section class="trang" data-trang="hoi" hidden><p class="y-chinh">${chu("gd.thu-tra-loi-truoc-khi-xem-loi-giai-sai-cung-khong-sa")}</p>${veCauHoi(bg.cauHoi)}</section>` : ''}
      <div class="chan-bai">
        ${truoc ? `<button data-di="${i - 1}"><small>${chu("gd.bai-truoc")}</small>${truoc.ten}</button>` : '<span style="flex:1"></span>'}
        ${sau ? `<button class="sau" data-di="${i + 1}"><small>${chu("gd.bai-sau")}</small>${sau.ten}</button>` : '<span style="flex:1"></span>'}
      </div>`;
    this.el.bang.scrollTop = 0;
    for (const b of this.el.bang.querySelectorAll('button[data-di]')) b.addEventListener('click', () => this.chuyenBai(Number(b.dataset.di)));
    for (const b of this.el.bang.querySelectorAll('.tab button')) b.addEventListener('click', () => { this.am.phat('gat'); this.moTab(b.dataset.tab); });
    $('buoc-truoc').addEventListener('click', () => this.buocTruoc());
    $('buoc-sau').addEventListener('click', () => this.buocSau());
    ganCauHoi(this.el.bang, (dung) => this.am.phat(dung ? 'dung' : 'sai'));
    this._ganThuatNgu(this.el.bang);
    this.bang = new BangDieuKhien($('dieu-khien'), { am: this.am });
    // Kiểu riêng của bài (nếu có): chèn một lần.
    if (dn.css && !document.querySelector(`style[data-canh="${dn.id}"]`)) {
      const st = document.createElement('style');
      st.dataset.canh = dn.id;
      st.textContent = dn.css;
      document.head.append(st);
    }
  },

  _veMucLuc() {
    let html = '', phan = '';
    this.dsCanh.forEach((c, i) => {
      if (c.phan !== phan) {
        phan = c.phan;
        const p = this.khoaHoc.find((x) => x.ten === phan);
        html += `<div class="phan">${phan}${p?.moTa ? `<span class="phan-mo-ta">${p.moTa}</span>` : ''}</div>`;
      }
      const dsB = c.baiGiang?.buoc || [];
      const tongTT = dsB.filter((b) => b.thuThach).length;
      const datTT = dsB.filter((b, k) => b.thuThach && this.thuThachDat.has(this._khoaTT(k, c.id))).length;
      const tt = tongTT ? `<span class="so-tt${datTT === tongTT ? ' du' : ''}" title="${chu("gd.thu-thach-da-dat")}">◆ ${datTT}/${tongTT}</span>` : '';
      html += `<button data-i="${i}" data-id="${c.id}" class="${this.daHoc.has(c.id) ? 'xong' : ''}"><span class="so">${c.so ?? i + 1}</span><span>${c.ten}<span class="mo-ta">${c.moTa || ''}</span></span>${tt}<span class="dau-xong" title="${chu("gd.da-hoc-het-cac-buoc")}">✓</span></button>`;
    });
    // Không còn dòng «do Trí Lữ soạn…» ở chân mục lục để giao diện gọn.
    html += `<div class="chan">${chu("gd.phim-tat-kbd-kbd-kbd-kbd-buoc-truoc-buoc-sau-kbd-kbd")}</div>`;
    this.el.mucLuc.innerHTML = html;
    for (const b of this.el.mucLuc.querySelectorAll('button[data-i]')) {
      b.addEventListener('click', () => { this.chuyenBai(Number(b.dataset.i)); this.el.mucLuc.hidden = true; });
    }
  },
};
