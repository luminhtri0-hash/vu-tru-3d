export const tuongQuan = (a,b) => -Math.cos((a-b)*Math.PI/180);
export const xacSuatCung = (a,b) => (1+tuongQuan(a,b))/2;
export const chsh = (b) => tuongQuan(0,b)+tuongQuan(0,-b)+tuongQuan(90,b)-tuongQuan(90,-b);
export function layCap(a,b,ngauNhien) {
  const trai=ngauNhien()<.5?1:-1;
  return [trai,ngauNhien()<xacSuatCung(a,b)?trai:-trai];
}

// Mô hình biến ẩn cục bộ để so sánh: mỗi cặp mang sẵn một hướng λ (độ), phân bố đều.
// Mỗi máy chỉ đọc λ và trục của chính mình: A = dấu cos(a − λ), B = −dấu cos(b − λ).
export function layCapAn(a,b,lambda) {
  const d=(x)=>Math.cos((x-lambda)*Math.PI/180)>=0?1:-1;
  return [d(a),-d(b)];
}
// Tương quan của mô hình trên: tuyến tính theo hiệu góc, E = −1 + 2|a − b|/180 (|a − b| quy về 0…180°).
export function tuongQuanAn(a,b) {
  let d=Math.abs(((a-b)%360+360)%360); if(d>180)d=360-d;
  return -1+2*d/180;
}
// Tổ hợp CHSH với a = 0°, a′ = 90°, b′ = −b cho một hàm tương quan bất kỳ.
export const chshVoi = (E,b) => E(0,b)+E(0,-b)+E(90,b)-E(90,-b);
// Sai số chuẩn của một tương quan ước lượng từ N cặp: căn của (1 − E²)/N.
export const saiSoE = (E,N) => N>0 ? Math.sqrt(Math.max(0,1-E*E)/N) : 0;
