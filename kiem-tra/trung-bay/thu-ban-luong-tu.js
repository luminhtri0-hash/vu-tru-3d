// Tệp thử cho phòng trưng bày: các phần dùng chung của bàn thí nghiệm lượng tử (src/khung/ban-thi-nghiem-luong-tu.js):
// hai cực nam châm, mũi tên, nhóm hạt bay, trục đồ thị có vạch chia, đổi màu nhãn đã dựng.
//   node kiem-tra/trung-bay.mjs kiem-tra/trung-bay/thu-ban-luong-tu.js "Dữ liệu làm việc/khung-fable/trung-bay"
//   bash kiem-tra/chup.sh "Dữ liệu làm việc/khung-fable/trung-bay/index.html" "…/ban-luong-tu.png" "tua=2" 1280 800
import { taoBan } from '../../src/khung/ban-thi-nghiem-luong-tu.js';

const CHU = { nguon: 'Nguồn nguyên tử', nam: 'Nam châm phân tích', man: 'Màn ghi', truc: 'Trục đồ thị có vạch chia', mui: 'Mũi tên: spin và trục đo' };

export default {
  mayAnh: { viTri: [5.2, 4.6, 9.6], dich: [0.2, 1.1, 0], fov: 40 },
  tao(app) {
    // Phòng trưng bày không có khung tương tác và bảng điều khiển: cho bản rỗng để taoBan dùng được.
    const gia = { ...app, tt: { them() {}, tayNam: () => ({ dat() {} }) }, bang: { thanhTruot: () => ({ dat() {} }) } };
    const { scene, mat, hop, nhan, namCham, muiTen, hatBay, trucDoThi } = taoBan(gia, (k) => CHU[k] ?? k);
    hop(9.4, 0.25, 3.8, 0.2, -0.1, 0, mat.den);
    hop(8.6, 0.15, 0.28, 0.1, 0.23, 0, mat.thep);
    // Hai cực nam châm, nghiêng 30° quanh chùm hạt.
    const nc = namCham({ dai: 1.3 });
    nc.nhom.position.set(0, 1.56, 0); nc.nhom.scale.set(1, 0.72, 0.72); nc.nhom.rotation.x = Math.PI / 6;
    nhan('nam', 0, 2.75, 0);
    // Mũi tên: spin đã chuẩn bị (vàng) và trục đo (đỏ cam), một mũi tên ngắn đổi màu.
    const a = muiTen({ dai: 0.9, mau: 0xf3c66f }); a.position.set(-2.2, 1.56, 0);
    const b = muiTen({ dai: 1.05, mau: 0xff8a73 }); b.position.set(-2.2, 1.56, 0); b.datHuong(0, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6));
    const c = muiTen({ dai: 0.5, mau: 0x7fcaff, banKinh: 0.02 }); c.position.set(-3.2, 1.2, 0); c.datHuong(1, 0.4, 0).datMau(0x8fe3a8);
    const nhanMui = nhan('mui', -2.2, 2.75, 0);
    nhanMui.datMau('vang');
    // Nhóm hạt bay: 60 hạt chạy dọc bàn, tách làm hai nhánh sau nam châm, mỗi nhánh một màu.
    const SO = 60, hb = hatBay(SO, { banKinh: 0.05, mau: 0xb5a8ff, sang: 1.3 });
    let t = 0;
    // Trục đồ thị dựng đứng ở cuối bàn.
    const truc = trucDoThi({ goc: [2.6, 0.5, -1.2], rong: 2.2, cao: 1.5, x: [0, 180], y: [0, 1], vachX: [0, 45, 90, 135, [180, '180°']], vachY: [0, [0.5, '½'], 1], nhanX: 'θ', nhanY: 'P(+)' });
    const cot = hop(0.12, 1, 0.12, ...truc.diem(60, 0), mat.do); cot.scale.y = truc.Y(0.75); cot.position.y += truc.Y(0.75) / 2;
    nhan('truc', 3.7, 2.45, -1.2, 'mo');
    return {
      scene,
      capNhat(dt) {
        t += dt;
        for (let i = 0; i < SO; i++) {
          const u = ((t * 0.25 + i / SO) % 1), x = -3.8 + 7 * u, len = i % 2 ? 1 : -1;
          const d = x < 0 ? 0 : 0.12 * x;
          hb.dat(i, x, 1.56 + len * d * Math.cos(Math.PI / 6), len * d * Math.sin(Math.PI / 6), x < 0 ? 1 : 1.15);
          hb.datMau(i, x < 0 ? 0xb5a8ff : len > 0 ? 0xffb27f : 0x7fe6f2);
        }
        hb.xong();
      },
    };
  },
};
