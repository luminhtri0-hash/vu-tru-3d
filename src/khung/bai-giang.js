import { ngonNgu } from '../ngon-ngu/dich.js';
import { chu } from '../ngon-ngu/giao-dien.js';
// Dựng chữ bài giảng: đổi "chữ có đánh dấu" thành HTML, công thức toán viết kiểu LaTeX (KaTeX dựng).
//
// Cú pháp (xem «Hướng dẫn viết bài giảng.md» ở thư mục gốc dự án):
//   Đoạn văn cách nhau một dòng trống.        **đậm**   *nhấn*   $công thức trong dòng$
//   $$ công thức đứng riêng $$                (cả khối nằm giữa hai dấu $$)
//   ### Tiêu đề nhỏ
//   - gạch đầu dòng            1. đánh số
//   > [Ví dụ] …                hộp ghi chú; loại: Ví dụ, Lưu ý, Thử ngay, Hiểu sai thường gặp, Con số, Định nghĩa, Lịch sử
//   +++ Đi sâu: tiêu đề        khối gập lại được (bấm mới mở); kết thúc bằng một dòng chỉ có +++
//   | cột 1 | cột 2 |          bảng; dòng thứ hai là |---|---|
//   [[Nhãn nút|tên]]           nút bấm gọi hàm nut.<tên>(canh, app) của bước đang mở
//   {{thuật ngữ}}              gạch chân, rê chuột hiện nghĩa (nếu có trong bảng thuật ngữ)

import katex from 'katex';
import { noiSo } from './chu-so.js';

const MACRO = { '\\dd': '\\mathrm{d}', '\\tg': '\\operatorname{tg}', '\\dv': '\\dfrac{\\mathrm{d}#1}{\\mathrm{d}#2}' };

const thoat = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Công thức LaTeX → HTML. Số thập phân viết kiểu Việt (3,14) không bị chèn khoảng trắng sau dấu phẩy.
export function toan(tex, dungRieng = false) {
  const t = tex.trim().replace(/(\d),(?=\d)/g, '$1{,}');
  try {
    return katex.renderToString(t, { displayMode: dungRieng, throwOnError: false, strict: false, output: 'html', macros: { ...MACRO } });
  } catch (e) {
    return `<code class="loi-toan" title="${thoat(String(e.message || e))}">${thoat(tex)}</code>`;
  }
}

const LOAI_HOP = {
  'ví dụ': 'vi-du', 'lưu ý': 'luu-y', 'thử ngay': 'thu-ngay', 'hiểu sai thường gặp': 'hieu-sai',
  'con số': 'con-so', 'định nghĩa': 'dinh-nghia', 'lịch sử': 'lich-su', 'tóm lại': 'tom-lai',
};

let traThuatNgu = () => null;
// Ứng dụng gắn hàm tra nghĩa thuật ngữ vào đây sau khi gom thuật ngữ của mọi bài.
export function datTraThuatNgu(ham) { traThuatNgu = ham; }

// Phần trong dòng: công thức, nút, thuật ngữ, đậm, nhấn.
export function trongDong(s) {
  const kho = [];
  const cat = (html) => { kho.push(html); return `\u0001${kho.length - 1}\u0002`; };
  s = s.replace(/\\\$/g, () => cat('$'));
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, t) => cat(toan(t, true)));
  s = s.replace(/\$([^$]+?)\$/g, (_, t) => cat(toan(t, false)));
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, nhan, ten) => cat(`<button class="nut-thu" data-nut="${thoat(ten.trim())}">${trongDong(nhan)}</button>`));
  s = s.replace(/\{\{([^}|]+)(?:\|([^}]+))?\}\}/g, (_, tn, hien) => {
    const nghia = traThuatNgu(tn.trim());
    const chu = trongDong(hien || tn);
    return cat(nghia ? `<span class="tn" data-tn="${thoat(tn.trim())}" title="${thoat(nghia)}">${chu}</span>` : chu);
  });
  s = noiSo(s);          // «38 000» không xuống dòng giữa số (công thức, nút, thuật ngữ đã cất ở trên nên không bị đụng)
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
  return s.replace(/\u0001(\d+)\u0002/g, (_, i) => kho[Number(i)]);
}

function veBang(dong) {
  const hang = dong.map((d) => d.trim().replace(/^\||\|$/g, '').split('|').map((o) => o.trim()));
  const coDau = hang.length > 1 && hang[1].every((o) => /^:?-{2,}:?$/.test(o));
  const than = coDau ? hang.slice(2) : hang;
  const dau = coDau ? `<thead><tr>${hang[0].map((o) => `<th>${trongDong(o)}</th>`).join('')}</tr></thead>` : '';
  return `<div class="bg-bang"><table>${dau}<tbody>${than.map((h) => `<tr>${h.map((o) => `<td>${trongDong(o)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function veKhoi(khoi) {
  const dong = khoi.split('\n');
  const dau = dong[0];
  if (/^\$\$/.test(dau.trim()) && /\$\$\s*$/.test(khoi)) {
    return `<div class="bg-toan">${toan(khoi.trim().replace(/^\$\$/, '').replace(/\$\$$/, ''), true)}</div>`;
  }
  if (/^###\s+/.test(dau)) return `<h3>${trongDong(dau.replace(/^###\s+/, ''))}</h3>${dong.length > 1 ? veKhoi(dong.slice(1).join('\n')) : ''}`;
  if (dong.every((d) => /^>/.test(d))) {
    let trong = dong.map((d) => d.replace(/^> ?/, '')).join('\n');
    let lop = 'luu-y', nhan = '';
    const m = trong.match(/^\[([^\]]+)\]\s*/);
    if (m) {
      nhan = m[1];
      lop = LOAI_HOP[nhan.toLowerCase()] || 'luu-y';
      trong = trong.slice(m[0].length);
    }
    return `<div class="hop ${lop}">${nhan ? `<div class="hop-ten">${thoat(ngonNgu !== 'vi' && LOAI_HOP[nhan.toLowerCase()] ? chu('hop.' + lop) : nhan)}</div>` : ''}${dinhDang(trong)}</div>`;
  }
  if (dong.every((d) => /^\|.*\|\s*$/.test(d.trim()))) return veBang(dong);
  const laMuc = (d) => /^- /.test(d), laSo = (d) => /^\d+[.)] /.test(d), laNoi = (d) => /^\s{2,}\S/.test(d);
  if (laMuc(dau) || laSo(dau)) {
    const the = laMuc(dau) ? 'ul' : 'ol';
    const muc = [];
    for (const d of dong) {
      if (laMuc(d) || laSo(d)) muc.push(d.replace(/^- |^\d+[.)] /, ''));
      else if (laNoi(d) && muc.length) muc[muc.length - 1] += ` ${d.trim()}`;
      else muc.push(d);
    }
    return `<${the}>${muc.map((m) => `<li>${trongDong(m)}</li>`).join('')}</${the}>`;
  }
  if (/^<(p|div|ul|ol|table|figure|h[1-6]|details|blockquote|section)[\s>]/i.test(dau.trim())) return trongDong(khoi);
  return `<p>${trongDong(dong.join(' '))}</p>`;
}

// Cả một đoạn bài giảng → HTML.
export function dinhDang(nguon) {
  if (!nguon) return '';
  const dong = String(nguon).replace(/\r/g, '').split('\n');
  // bỏ thụt đầu dòng chung (bài viết nằm trong mã nguồn thường bị thụt vào)
  const thut = Math.min(...dong.filter((d) => d.trim()).map((d) => d.match(/^ */)[0].length));
  const sach = dong.map((d) => d.slice(Math.min(thut, d.match(/^ */)[0].length)).replace(/\s+$/, ''));
  const ra = [];
  let tam = [];
  const xa = () => { if (tam.length) { ra.push(veKhoi(tam.join('\n'))); tam = []; } };
  for (let i = 0; i < sach.length; i++) {
    const d = sach[i];
    const mo = d.match(/^\+\+\+\s+(.+)$/);
    if (mo) {
      xa();
      const trong = [];
      for (i++; i < sach.length && sach[i].trim() !== '+++'; i++) trong.push(sach[i]);
      ra.push(`<details class="di-sau"><summary>${trongDong(mo[1])}</summary><div class="di-sau-than">${dinhDang(trong.join('\n'))}</div></details>`);
      continue;
    }
    // công thức đứng riêng trải nhiều dòng: gom tới dòng kết thúc bằng $$
    if (!tam.length && /^\$\$/.test(d.trim()) && !/\$\$\s*$/.test(d.trim().slice(2))) {
      const cum = [d];
      for (i++; i < sach.length; i++) { cum.push(sach[i]); if (/\$\$\s*$/.test(sach[i])) break; }
      ra.push(veKhoi(cum.join('\n')));
      continue;
    }
    if (!d.trim()) { xa(); continue; }
    // danh sách viết liền ngay sau một dòng chữ (không có dòng trống): tách thành hai khối
    const laMuc = /^(- |\d+[.)] )/.test(d);
    const dangDs = tam.length > 0 && /^(- |\d+[.)] )/.test(tam[0]);
    if (tam.length && ((laMuc && !dangDs) || (!laMuc && dangDs && !/^\s{2,}\S/.test(d)))) xa();
    tam.push(d);
  }
  xa();
  return ra.join('');
}

// Công thức đứng riêng dài hơn bề rộng của bảng bài giảng (hay sổ tay): co cỡ chữ cho vừa, không dưới 70%; co hết mức
// mà vẫn dài thì để cuộn ngang (lớp `cuon`). Gọi sau khi chữ đã vào trang và mỗi khi bề rộng bảng đổi. Phần đang ẩn
// (thẻ chưa mở, khối «Đi sâu» còn gập) có bề rộng 0 nên được bỏ qua, tới lúc mở ra thì gọi lại.
// Đọc hết bố cục rồi mới ghi, không xen kẽ.
export function coCongThucVua(goc) {
  if (!goc?.querySelectorAll) return;
  const ds = [...goc.querySelectorAll('.bg-toan, .ct-tex, .cong-thuc')];
  if (!ds.length) return;
  for (const el of ds) { if (el.style.fontSize) el.style.fontSize = ''; el.classList.remove('cuon'); }
  // Đọc hết rồi mới ghi. Cỡ chữ mới tính bằng điểm ảnh từ cỡ đang dùng của chính khung công thức (trên điện thoại khung này
  // có cỡ gốc riêng, khác cỡ của đoạn văn chứa nó, nên ghi bằng phần trăm sẽ lệch).
  const soDo = ds.map((el) => { const co = el.clientWidth; return co > 0 && el.scrollWidth > co + 1 ? { tiLe: (co - 18) / el.scrollWidth, px: parseFloat(getComputedStyle(el).fontSize) || 15, co } : null; });
  ds.forEach((el, i) => {
    const d = soDo[i];
    if (!d) return;
    // Co tối đa tới 70%; bảng rất hẹp (điện thoại bề ngang 360) thì cho co tới 62% để khỏi phải cuộn ngang.
    const san = d.co < 330 ? 0.62 : 0.7;
    el.style.fontSize = `${(d.px * Math.max(san, d.tiLe)).toFixed(2)}px`;
    if (d.tiLe < san) el.classList.add('cuon');
  });
}

// Bảng công thức của một bài: [{ ten, tex, y }]
export function veCongThuc(ds) {
  return ds.map((c) => `<div class="ct"><div class="ct-ten">${trongDong(c.ten)}</div><div class="ct-tex">${toan(c.tex, true)}</div>${c.y ? `<div class="ct-y">${trongDong(c.y)}</div>` : ''}</div>`).join('');
}

// Câu hỏi tự kiểm: [{ hoi, chon: [..], dung: chỉ số, giai }] hoặc [{ hoi, dap }]
export function veCauHoi(ds) {
  const nhanDapAn = 'ABCDEF';
  return ds.map((c, i) => {
    const hoi = `<div class="ch-hoi"><span class="ch-so">${i + 1}</span><div>${dinhDang(c.hoi)}</div></div>`;
    if (Array.isArray(c.chon)) {
      return `<div class="ch" data-dung="${c.dung}">${hoi}<div class="ch-chon">${c.chon.map((lc, k) => `<button data-k="${k}"><span class="ch-chu">${nhanDapAn[k]}</span><span>${trongDong(lc)}</span></button>`).join('')}</div><div class="ch-giai" hidden>${dinhDang(c.giai || '')}</div></div>`;
    }
    return `<div class="ch">${hoi}<details class="ch-dap"><summary>${chu("gd.xem-loi-giai")}</summary><div>${dinhDang(c.dap || '')}</div></details></div>`;
  }).join('');
}

// Gắn hành vi cho các câu hỏi chọn đáp án bên trong một phần tử. khiTraLoi(dung): gọi mỗi lần người học chọn.
export function ganCauHoi(goc, khiTraLoi = null) {
  for (const ch of goc.querySelectorAll('.ch[data-dung]')) {
    const dung = Number(ch.dataset.dung);
    for (const b of ch.querySelectorAll('.ch-chon button')) {
      b.addEventListener('click', () => {
        const k = Number(b.dataset.k);
        for (const q of ch.querySelectorAll('.ch-chon button')) q.classList.remove('sai', 'dung');
        b.classList.add(k === dung ? 'dung' : 'sai');
        if (k === dung) { ch.querySelector('.ch-giai').hidden = false; ch.classList.add('xong'); }
        khiTraLoi?.(k === dung);
      });
    }
  }
}
