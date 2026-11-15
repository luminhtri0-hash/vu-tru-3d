// Bản dịch nằm trong trang HTML để cả bốn ngôn ngữ đều dùng được ngoại tuyến.
export const NGON_NGU = { vi: 'Tiếng Việt', en: 'English', 'zh-CN': '简体中文', ja: '日本語' };
const KHOA = 'vu-tru-3d.ngon-ngu';
const boDich = typeof __BAN_DICH__ === 'undefined' ? {} : __BAN_DICH__;

export function khopNgonNgu(ma) {
  if (typeof ma !== 'string') return null;
  const goc = ma.toLowerCase().split(/[-_]/)[0];
  return goc === 'zh' ? 'zh-CN' : Object.prototype.hasOwnProperty.call(NGON_NGU, goc) ? goc : null;
}

function docNgonNgu() {
  if (typeof window === 'undefined') return 'vi';
  const tham = khopNgonNgu(new URLSearchParams(location.search).get('lang'));
  if (tham) return tham;
  try {
    const luu = khopNgonNgu(localStorage.getItem(KHOA));
    if (luu) return luu;
  } catch { /* Trình duyệt riêng tư vẫn dùng được. */ }
  return (navigator.languages || [navigator.language]).map(khopNgonNgu).find(Boolean) || 'vi';
}
export const ngonNgu = docNgonNgu();

export function dich(phamVi, khoa, goc, thamSo) {
  const ban = boDich[ngonNgu]?.[phamVi]?.[khoa];
  const mau = typeof ban === 'string' && ban.trim() ? ban : goc;
  if (!thamSo?.length) return mau;
  return mau.replace(/\{(\d+)\}/g, (match, i) => i < thamSo.length ? String(thamSo[i]) : match);
}

export function nhoNgonNgu(ma) {
  if (Object.prototype.hasOwnProperty.call(NGON_NGU, ma)) {
    try { localStorage.setItem(KHOA, ma); } catch { /* URL giữ lựa chọn cho lần mở này. */ }
  }
}
