// Thư viện đồ vật 3D của Bản 3: phi hành gia, buồng thí nghiệm, tên lửa, đồng hồ, đồng hồ ánh sáng,
// cân, bóng, đèn chiếu, vệ tinh, tháp; cùng bộ đèn cảnh chuẩn có môi trường phản chiếu.
//
// Mọi hàm tạo trả về { nhom, …các hàm điều khiển…, capNhat(dt)? }. Đặt nhom vào cảnh, gọi capNhat(dt) mỗi
// khung hình (nếu có). Đơn vị là mét: phi hành gia cao 1,8; buồng 3 × 4 × 3 như Bài 7 của Bản 2.
// Hình khối dựng hoàn toàn bằng mã, không nạp tệp mô hình; mỗi vật vài nghìn tam giác, không cấp phát
// bộ nhớ mỗi khung hình. Màu tuyến tính, thứ phát sáng có độ sáng lớn hơn 1 để có quầng.
//
// Cách dùng ngắn:
//   import { taoDenCanh, taoBuong, taoPhiHanhGia, taoCan } from '../khung/do-vat.js';
//   const den = taoDenCanh(scene, { renderer: app.renderer });
//   const buong = taoBuong({ mau: 0x8fd0ff }); scene.add(buong.nhom);
//   const nguoi = taoPhiHanhGia({ tuThe: 'gio-tay', tay: 'trai' }); buong.nhom.add(nguoi.nhom);
//   …trong capNhat(dt): nguoi.capNhat(dt); buong.capNhat(dt);
// Chi tiết từng hàm ghi ở đầu tệp do-vat-*.js tương ứng.

export { taoDenCanh, layMoiTruong, LoXo, demTamGiac } from './do-vat-chung.js';
export { taoPhiHanhGia } from './do-vat-nguoi.js';
export { taoBuong } from './do-vat-buong.js';
export { taoTenLua, taoLuaPhut } from './do-vat-ten-lua.js';
export { taoDongHo, taoDongHoAnhSang } from './do-vat-dong-ho.js';
export { taoCan, taoBong, taoDenChieu, taoVeTinh, taoThap } from './do-vat-nho.js';
