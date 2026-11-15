// Xác suất đo +ħ/2 trên trục lệch góc θ so với trạng thái chuẩn bị +z.
export function xacSuatCong(gocDo, phanCuc=1) {
  return (1+phanCuc*Math.cos(gocDo*Math.PI/180))/2;
}
export const giaTriTrungBinh = (gocDo, phanCuc=1) => xacSuatCong(gocDo,phanCuc)-0.5; // đơn vị ħ
export const xacSuatLap = (gocDo,hieuTruoc) => xacSuatCong(gocDo,hieuTruoc);
// Sai số chuẩn của tần suất đếm f sau N lần độc lập: căn của f(1 − f)/N.
export const saiSoChuan = (f, N) => N > 0 ? Math.sqrt(Math.max(0, f*(1-f))/N) : 0;
