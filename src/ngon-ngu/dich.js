// Bản dịch nằm trong trang HTML để mọi thứ tiếng đều dùng được ngoại tuyến.
// DANH SÁCH THỨ TIẾNG nằm ở danh-sach.json: mỗi thứ tiếng một mục (tên hiển thị, mã vùng của giọng đọc, kiểu chữ, phông,
// luật ngắt dòng, luật chia phụ đề). Thêm một thứ tiếng là thêm một mục ở đó và một thư mục src/ngon-ngu/<mã>/; không
// phải sửa mã ở đây. Trong trang, thứ tiếng chỉ hiện khi bản dịch của nó đã được gói vào (build.mjs gói mọi thư mục có sẵn).
import cauHinh from './danh-sach.json' with { type: 'json' };

const KHOA = 'vu-tru-3d.ngon-ngu';
const boDich = typeof __BAN_DICH__ === 'undefined' ? null : __BAN_DICH__;
const GOC = cauHinh.goc;
// Chạy bằng node (bộ kiểm, không có bản dịch gói sẵn): tính mọi mục của danh sách.
const DS = cauHinh.ngonNgu.filter((n) => n.ma === GOC || !boDich || boDich[n.ma]);
export const NGON_NGU = Object.fromEntries(DS.map((n) => [n.ma, n.ten]));

// Mã ngôn ngữ bất kỳ (của trình duyệt, của đường dẫn ?lang=) thành mã thứ tiếng của app, hoặc null.
export function khopNgonNgu(ma) {
  if (typeof ma !== 'string' || !ma) return null;
  const thuong = ma.toLowerCase();
  const dung = DS.find((n) => n.ma.toLowerCase() === thuong);
  if (dung) return dung.ma;
  const dau = thuong.split(/[-_]/)[0];
  return DS.find((n) => (n.khop || [n.ma.toLowerCase()]).includes(dau))?.ma || null;
}

function docNgonNgu() {
  if (typeof window === 'undefined') return GOC;
  const tham = khopNgonNgu(new URLSearchParams(location.search).get('lang'));
  if (tham) return tham;
  try {
    const luu = khopNgonNgu(localStorage.getItem(KHOA));
    if (luu) return luu;
  } catch { /* Trình duyệt riêng tư vẫn dùng được. */ }
  return (navigator.languages || [navigator.language]).map(khopNgonNgu).find(Boolean) || GOC;
}
export const ngonNgu = docNgonNgu();
// Mục cấu hình của thứ tiếng đang dùng: { ma, ten, giong, chu, phong, ngatDong, phuDe }.
export const TIENG = cauHinh.ngonNgu.find((n) => n.ma === ngonNgu) || cauHinh.ngonNgu[0];

export function dich(phamVi, khoa, goc, thamSo) {
  const ban = boDich?.[ngonNgu]?.[phamVi]?.[khoa];
  const mau = typeof ban === 'string' && ban.trim() ? ban : goc;
  if (!thamSo?.length) return mau;
  return mau.replace(/\{(\d+)\}/g, (match, i) => i < thamSo.length ? String(thamSo[i]) : match);
}

export function nhoNgonNgu(ma) {
  if (Object.prototype.hasOwnProperty.call(NGON_NGU, ma)) {
    try { localStorage.setItem(KHOA, ma); } catch { /* URL giữ lựa chọn cho lần mở này. */ }
  }
}
