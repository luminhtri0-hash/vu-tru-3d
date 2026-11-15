// Ứng dụng đang chạy của trang (lớp UngDung tự ghi vào đây ngay đầu hàm dựng).
// Dành cho mô-đun dùng chung cần tới bộ dựng hình, âm thanh, tương tác mà nơi gọi không truyền `app` vào, ví dụ bàn thí
// nghiệm lượng tử khi bài cũ gọi banVe() không tham số. Trước bản 3.7 các chỗ đó lấy qua biến dò lỗi `window.__vt`,
// biến ấy chỉ được gán SAU khi ứng dụng dựng xong và có thể bị công cụ kiểm ghi đè.
// Bài mới luôn truyền `app` tường minh (tham số của tao(app)); hàm này chỉ là đường lùi.

let app = null;

export function datAppDangChay(a) { app = a; }
export function appDangChay() { return app || globalThis.__vt || null; }
