import { dich, ngonNgu, TIENG } from './dich.js';
import goc from './vi/chung.json' with { type: 'json' };

// Văn bản chung có sẵn trong gói ngoại tuyến. Khoá thiếu luôn dùng câu tiếng Việt.
export function chu(khoa, thamSo) {
  return dich('chung', khoa, goc[khoa], thamSo);
}
export function dichTrang() {
  const goc = document.documentElement;
  goc.lang = ngonNgu;
  // Kiểu chữ của thứ tiếng (danh-sach.json): chữ vuông thì lời giảng thoáng dòng hơn; phông thêm; luật ngắt dòng.
  if (TIENG.chu) goc.dataset.chu = TIENG.chu;
  if (TIENG.phong) goc.style.setProperty('--chu-rieng', TIENG.phong);
  if (TIENG.ngatDong?.tieuDe) goc.style.setProperty('--ngat-tieu-de', TIENG.ngatDong.tieuDe);
  if (TIENG.ngatDong?.than) goc.style.setProperty('--ngat-than', TIENG.ngatDong.than);
  for (const el of document.querySelectorAll('[data-dich]')) el.textContent = chu(el.dataset.dich);
  for (const attr of ['title', 'aria-label']) {
    for (const el of document.querySelectorAll('[data-dich-' + attr + ']')) {
      el.setAttribute(attr, chu(el.getAttribute('data-dich-' + attr)));
    }
  }
}
