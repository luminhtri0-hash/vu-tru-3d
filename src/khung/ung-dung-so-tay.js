// Lõi ứng dụng, phần sổ tay: gom thuật ngữ của mọi bài, tra nghĩa khi rê chuột, bảng «Thuật ngữ» và «Công thức».
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import { chu } from '../ngon-ngu/giao-dien.js';
import { ngonNgu } from '../ngon-ngu/dich.js';
import { dichThuatNguChung } from '../ngon-ngu/noi-dung.js';
import { THUAT_NGU } from '../noi-dung/thuat-ngu.js';
import { trongDong, veCongThuc, datTraThuatNgu, coCongThucVua } from './bai-giang.js';
import { $, boDau } from './ung-dung-luu.js';

export const PT_SO_TAY = {
  // ---------- Thuật ngữ ----------
  _gomThuatNgu() {
    const bang = new Map();
    const them = (t, bai) => {
      if (!t?.vi) return;
      const k = t.vi.toLowerCase();
      if (!bang.has(k)) bang.set(k, { ...t, bai });
    };
    for (const t of dichThuatNguChung(THUAT_NGU)) them(t, null);
    this.dsCanh.forEach((c, i) => { for (const t of c.baiGiang?.thuatNgu || []) them(t, i); });
    this.thuatNgu = [...bang.values()].sort((a, b) => a.hienThi.localeCompare(b.hienThi, ngonNgu));
    const tim = new Map(this.thuatNgu.map((t) => [t.vi.toLowerCase(), t]));
    datTraThuatNgu((tn) => {
      const t = tim.get(tn.toLowerCase());
      return t ? `${t.en ? `${t.en}: ` : ''}${String(t.nghia).replace(/<[^>]+>/g, '').replace(/\$/g, '')}` : null;
    });
  },
  _ganThuatNgu(goc) {
    for (const s of goc.querySelectorAll('.tn')) s.addEventListener('click', () => this.moThuatNgu(s.dataset.tn));
  },
  // Sổ tay: hai thẻ «Thuật ngữ» và «Công thức» (công thức gom từ mọi bài).
  moThuatNgu(loc = '', the = 'tn') {
    const el = this.el.thuatNgu;
    if (!el) return;
    el.hidden = false;
    el.innerHTML = `<div class="tn-dau"><div class="tn-the"><button data-the="tn">${chu("gd.thuat-ngu")}</button><button data-the="ct">${chu("gd.cong-thuc")}</button></div><input type="search" id="tn-tim" placeholder="${chu("gd.tim")}" autocomplete="off"><button id="tn-dong" title="${chu("gd.dong-phim-esc")}">✕</button></div><div class="tn-ds" id="tn-ds"></div>`;
    const inp = $('tn-tim');
    const ve = () => {
      const k = boDau(inp.value.trim());
      for (const b of el.querySelectorAll('.tn-the button')) b.classList.toggle('chon', b.dataset.the === the);
      inp.placeholder = the === 'tn' ? chu("gd.tim-tieng-viet-hoac-tieng-anh") : chu("gd.tim-ten-cong-thuc");
      let html = '';
      if (the === 'tn') {
        const ds = this.thuatNgu.filter((t) => !k || boDau(t.hienThi).includes(k) || boDau(t.vi).includes(k) || boDau(t.en || '').includes(k));
        html = ds.map((t) => `<div class="tn-muc"><div class="tn-ten">${t.hienThi}${t.en && t.en !== t.hienThi ? ` <span class="tn-en">${t.en}</span>` : ''}</div><div class="tn-nghia">${trongDong(String(t.nghia))}${t.bai != null ? ` <button class="tn-bai" data-di="${t.bai}">${chu("gd.bai-so", [this.dsCanh[t.bai]?.so ?? t.bai + 1])}</button>` : ''}</div></div>`).join('');
      } else {
        this.dsCanh.forEach((c, i) => {
          const ds = (c.baiGiang?.congThuc || []).filter((f) => !k || boDau(f.ten).includes(k) || boDau(c.ten).includes(k));
          if (ds.length) html += `<div class="tn-nhom"><button class="tn-bai" data-di="${i}">${chu("gd.bai-so", [c.so ?? i + 1])}</button> ${c.ten}</div>${veCongThuc(ds)}`;
        });
      }
      $('tn-ds').innerHTML = html || `<div class="tn-muc"><div class="tn-nghia">${chu("gd.khong-thay-muc-nao-khop")}</div></div>`;
      $('tn-ds').scrollTop = 0;
      if (the === 'ct') coCongThucVua($('tn-ds'));
      for (const b of $('tn-ds').querySelectorAll('.tn-bai')) b.addEventListener('click', () => { el.hidden = true; this.moBai(Number(b.dataset.di)); });
    };
    inp.value = loc;
    inp.addEventListener('input', ve);
    for (const b of el.querySelectorAll('.tn-the button')) b.addEventListener('click', () => { the = b.dataset.the; ve(); });
    $('tn-dong').addEventListener('click', () => { el.hidden = true; });
    ve();
    if (!loc) inp.focus();
  },
};
