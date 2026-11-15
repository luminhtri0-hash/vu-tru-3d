// Tiện ích chữ và số dùng chung cho giao diện (lời giảng, ô số liệu, phụ đề).

export const KT_HEP = ' ';      // khoảng trắng hẹp KHÔNG NGẮT, dùng ngăn hàng nghìn («26 700»)

// Số viết tay trong lời giảng hay ô số liệu có khoảng trắng thường ngăn hàng nghìn («38 000», «1 391 400») sẽ bị trình
// duyệt xuống dòng giữa số khi hết chỗ. Hàm này đổi các khoảng trắng đó thành khoảng trắng hẹp không ngắt.
// Chỉ nhận dạng đúng kiểu viết hàng nghìn: nhóm đầu 1–3 chữ số, các nhóm sau đúng 3 chữ số, không dính số hay dấu
// thập phân ở trước, nên «năm 2020 123 người» hay «3,5 000» không bị đụng tới.
// (Số do mã sinh ra bằng so(), soNghia() của src/vat-ly/hang-so.js đã dùng sẵn khoảng trắng không ngắt.)
export function noiSo(s) {
  if (typeof s !== 'string' || s.length < 5) return s;
  return s.replace(/(^|[^\d.,])(\d{1,3})((?:[  ]\d{3})+)(?!\d)/g, (m, a, b, c) => a + b + c.replace(/[  ]/g, KT_HEP));
}
