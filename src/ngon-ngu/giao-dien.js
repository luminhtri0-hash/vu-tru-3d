import { dich, ngonNgu } from './dich.js';
import goc from './vi/chung.json' with { type: 'json' };

// Văn bản chung có sẵn trong gói ngoại tuyến. Khoá thiếu luôn dùng câu tiếng Việt.
export function chu(khoa, thamSo) {
  return dich('chung', khoa, goc[khoa], thamSo);
}
export function dichTrang() {
  document.documentElement.lang = ngonNgu;
  for (const el of document.querySelectorAll('[data-dich]')) el.textContent = chu(el.dataset.dich);
  for (const attr of ['title', 'aria-label']) {
    for (const el of document.querySelectorAll('[data-dich-' + attr + ']')) {
      el.setAttribute(attr, chu(el.getAttribute('data-dich-' + attr)));
    }
  }
}
