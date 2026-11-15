// Dụng cụ chung của các bài lượng tử vẽ đồ thị trên bàn thí nghiệm. Mỗi cảnh vẫn điều khiển các tham số và vật lý của mình.
// Bàn và các phần dùng chung (nam châm, mũi tên, nhóm hạt bay, trục đồ thị) nằm ở src/khung/ban-thi-nghiem-luong-tu.js.
import { taoBanDoThi } from '../khung/ban-thi-nghiem-luong-tu.js';
import { dich } from '../ngon-ngu/dich.js';
export const gocBan = { viTri:[4.4,6.6,11], dich:[0,0.95,0], fov:38, min:4.0,max:28 };
export function chuCuaBai(id,goc) { return (khoa,thamSo) => dich(id,'canh.'+khoa,goc['canh.'+khoa],thamSo); }
export function ghepBuoc(noiDung, cacThu, cacThach) {
  const buoc=noiDung.baiGiang.buoc.map((b,i)=>{
    const k={...b,vao:c=>c.buoc(i),nut:{thu:c=>cacThu[i](c)}};
    if(b.thuThach) k.thuThach={...b.thuThach,giu:0.45,kiem:c=>cacThach[i](c)};
    return k;
  });
  return {...noiDung,baiGiang:{...noiDung.baiGiang,buoc}};
}
// Bàn thí nghiệm chung. Tên cũ của taoBanDoThi(app), giữ cho các bài đang gọi banVe(app) hoặc banVe() không tham số:
// thiếu `app` thì khung tự lấy ứng dụng đang chạy (src/khung/app-dang-chay.js), không còn dựa vào biến dò lỗi window.__vt.
// Bài mới gọi taoBanDoThi(app) và truyền `app` tường minh.
export function banVe(app) { return taoBanDoThi(app); }
