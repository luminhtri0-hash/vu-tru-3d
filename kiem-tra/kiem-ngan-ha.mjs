// Bộ kiểm số cho Bài 2 «Ngân Hà»: mọi con số trong lời giảng.
// Chạy: node kiem-tra/kiem-ngan-ha.mjs
import { registerHooks } from 'node:module';
import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import * as H from '../src/vat-ly/hang-so.js';

// Thư viện thiên thể (src/khung/hanh-tinh-ban-do.js) nạp tệp JSON bờ biển; Node cần ghi rõ kiểu «json».
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.json')) return nextLoad(url, { ...context, importAttributes: { ...context.importAttributes, type: 'json' } });
    return nextLoad(url, context);
  },
});
const {
  default: bai, R0, V0, OM_NHANH, omegaSao, CHU_KY_MT,
  vDoDuoc, vKepler, banKinhDongQuay, HZ_MOI_KM_S, M_SGR, chuKyQuanhSgr, E_S2, S2_DON_VI,
  TT_DONG_QUAY_SAI, TT_KEPLER_TI, TT_KEPLER_SAI, TT_S2_T, TT_S2_SAI,
} = await import('../src/canh/ngan-ha.js');

const KPC = H.PARSEC_M * 1000;
const TRIEU_NAM = 1e6 * H.NAM_GIAY;
const NAS_TREN_TRIEU_NAM_RA_KMS = (H.NAS_M / 1000) * 1000 / TRIEU_NAM;   // 1 nghìn năm ánh sáng mỗi triệu năm, ra km/s

muc('1. Hằng số của mô hình');
kiem('V0 ra km/s', V0 * NAS_TREN_TRIEU_NAM_RA_KMS, 230, 0.2, ' km/s');
kiem('R0 = 26 700 năm ánh sáng ra kpc', R0 * 1000 * H.NAS_M / KPC, 8.2, 0.05, ' kpc');
kiem('Một vòng của Mặt Trời trong mô hình', CHU_KY_MT, 219, 1, ' triệu năm');
kiem('Tốc độ góc hình mẫu nhánh ra km/s/kpc', OM_NHANH / TRIEU_NAM * KPC / 1000, 25, 0.05, ' km/s/kpc');
kiem('Hình mẫu nhánh: một vòng', 2 * Math.PI / OM_NHANH, 246, 1, ' triệu năm');
kiem('Tốc độ góc Mặt Trời (để so)', 230 / (R0 * 1000 * H.NAS_M / KPC), 28, 0.3, ' km/s/kpc');

muc('2. Nhánh xoắn ốc không thể là dây sao cố định');
const P13 = 2 * Math.PI / omegaSao(13), P0 = 2 * Math.PI / omegaSao(R0);
kiem('Sao ở 13 000 năm ánh sáng: một vòng', P13, 107, 1, ' triệu năm');
kiem('Mặt Trời: một vòng', P0, 219, 1, ' triệu năm');
kiem('Chênh lệch số vòng mỗi tỉ năm (gần 5)', 1000 / P13 - 1000 / P0, 4.8, 0.1, ' vòng');

muc('3. Đường cong quay và khối lượng');
const R = 8.2 * KPC, v = 230e3;
const M = v * v * R / H.G;
kiem('R = 8,2 kpc ra mét', R, 2.53e20, 0.01e20, ' m');
kiem('M = v²R/G (kg)', M, 2.0e41, 0.05e41, ' kg');
kiem('… ra khối lượng Mặt Trời', M / H.M_MAT_TROI, 1.0e11, 0.05e11);
for (const [Rx, vK] of [[38, 193], [50, 168]]) kiem(`Kepler ở ${Rx} 000 năm ánh sáng`, 230 * Math.sqrt(R0 / Rx), vK, 1, ' km/s');
kiem('Kepler ở xa gấp đôi (câu hỏi 2)', 230 / Math.SQRT2, 163, 0.5, ' km/s');
kiem('Mô hình: tốc độ ở 50 000 năm ánh sáng vẫn gần 230', V0 * Math.tanh(50 / 3) * NAS_TREN_TRIEU_NAM_RA_KMS, 230, 0.5, ' km/s');
kiem('Mô hình: tốc độ ở 26 700 năm ánh sáng', V0 * Math.tanh(R0 / 3) * NAS_TREN_TRIEU_NAM_RA_KMS, 230, 0.5, ' km/s');

muc('4. Sagittarius A* và sao S2');
kiem('Bán trục lớn quỹ đạo S2: (M T²)^(1/3)', Math.cbrt(H.M_SGR_A * 16 ** 2), 1030, 15, ' AU');
kiem('… với chu kỳ đo được 16,05 năm', Math.cbrt(H.M_SGR_A * 16.05 ** 2), 1035, 5, ' AU');
kiem('Bán kính chân trời sự kiện', H.RS_MAT_TROI_M * H.M_SGR_A / 1e9, 12.7, 0.05, ' triệu km');
kiem('So với khoảng cách Sao Thủy – Mặt Trời (khoảng 1/5)', H.RS_MAT_TROI_M * H.M_SGR_A / (0.387 * H.AU_M), 0.22, 0.02);
kiem('2GM/c² của Mặt Trời', H.RS_MAT_TROI_M / 1000, 2.95, 0.01, ' km');
kiem('Câu hỏi 4: M gấp 8 thì a gấp', Math.cbrt(8), 2, 1e-9);

muc('5. Hàng xóm');
const t = 2.5e6 * H.NAS_M / 110e3 / H.NAM_GIAY / 1e9;
kiem('Tiên Nữ: tính thô 2,5 triệu năm ánh sáng / 110 km/s', t, 6.8, 0.05, ' tỉ năm');
kiem('Mây Magellan Lớn: 50 kpc ra năm ánh sáng', 50 * KPC / H.NAS_M, 163000, 2000);
kiem('Tiên Nữ: 765 kpc ra triệu năm ánh sáng', 765 * KPC / H.NAS_M / 1e6, 2.5, 0.05);

muc('6. Bản 3: tương tác, âm thanh, thử thách');
// Bước 2: vòng đồng quay
const Rdq = banKinhDongQuay();
kiem('Vòng đồng quay (khoảng 30 000 năm ánh sáng)', Rdq, 30, 0.2, ' nghìn năm ánh sáng');
kiem('… ra kpc', Rdq * 1000 * H.NAS_M / KPC, 9.2, 0.1, ' kpc');
kiem('Ở đó một vòng của sao bằng hình mẫu nhánh', 2 * Math.PI / omegaSao(Rdq), 246, 1, ' triệu năm');
kiemDung('Vị trí ban đầu (13 000 năm ánh sáng) không đạt sẵn', Math.abs(omegaSao(13) / OM_NHANH - 1) > TT_DONG_QUAY_SAI);
kiem('Dung sai 3%: bán kính từ', (() => { let a = 10, b = 60; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (omegaSao(m) / OM_NHANH > 1 + TT_DONG_QUAY_SAI) a = m; else b = m; } return a; })(), 29.1, 0.2);
// Bước 4: Kepler còn 3/4 số đo
const R34 = 16 / 9 * R0;
kiem('R để v_Kepler / v_đo = 3/4', R34, 47.47, 0.02, ' nghìn năm ánh sáng');
kiem('Tỉ số ở đó', vKepler(R34) / vDoDuoc(R34), TT_KEPLER_TI, 1e-6);
kiem('Khối lượng bên trong so với ở quỹ đạo Mặt Trời: (4/3)²', (vDoDuoc(R34) ** 2 * R34) / (vDoDuoc(R0) ** 2 * R0), 1.78, 0.01);
kiemDung('Vị trí ban đầu (32 000 năm ánh sáng) không đạt sẵn', Math.abs(vKepler(32) / vDoDuoc(32) - TT_KEPLER_TI) > TT_KEPLER_SAI);
kiem('Nốt sao thật (230 km/s)', HZ_MOI_KM_S * 230, 460, 0, ' Hz');
kiem('Nốt theo Kepler ở 47 500 năm ánh sáng', HZ_MOI_KM_S * vKepler(R34), 345, 1, ' Hz');
kiem('Hai nốt ấy: quãng bốn đúng (3 : 4)', vKepler(R34) / vDoDuoc(R34), 0.75, 1e-6);
// Bước 5: sao thử quanh Sgr A*
kiem('Khối lượng Sgr A* dùng trong mô hình', M_SGR, H.M_SGR_A, 0.05e6);
kiem('a cho T = 16 năm', Math.cbrt(M_SGR * TT_S2_T ** 2), 1030, 15, ' AU');
kiem('Dung sai nửa năm: a từ', Math.cbrt(M_SGR * (TT_S2_T - TT_S2_SAI) ** 2), 1011, 3, ' AU');
kiem('… tới', Math.cbrt(M_SGR * (TT_S2_T + TT_S2_SAI) ** 2), 1054, 3, ' AU');
kiemDung('Vị trí ban đầu a = 600 AU không đạt sẵn', Math.abs(chuKyQuanhSgr(600) - TT_S2_T) > TT_S2_SAI);
kiem('Tâm sai S2 (GRAVITY 2018: 0,886)', E_S2, 0.886, 0.01);
kiem('Điểm gần nhất của quỹ đạo 1 030 AU, e = 0,88 (khoảng 120 AU)', 1030 * (1 - E_S2), 124, 5, ' AU');
const phongToS2 = 1030 * S2_DON_VI * 1000 / (1030 / H.NAS_AU);
kiem('Quỹ đạo vẽ phóng to (khoảng 130 000 lần)', phongToS2, 1.3e5, 0.05e5);
const phongToLD = 150 / (H.RS_MAT_TROI_M * H.M_SGR_A / H.NAS_M);
kiemDung(`Lỗ đen vẽ phóng to hàng trăm triệu lần (tính được: ${phongToLD.toExponential(2)})`, phongToLD >= 1e8 && phongToLD < 1e9);
kiemDung('Đủ 3–5 thử thách', (() => { const n = bai.baiGiang.buoc.filter((b) => b.thuThach).length; return n >= 3 && n <= 5; })());

muc('7. Bài giảng đủ phần');
const bg = bai.baiGiang;
kiemDung(`Số bước 6–9 (có ${bg.buoc.length})`, bg.buoc.length >= 6 && bg.buoc.length <= 9);
kiemDung('Mọi bước có vao()', bg.buoc.every((b) => typeof b.vao === 'function'));
kiemDung('Mọi nút [[…|tên]] đều có hàm', bg.buoc.every((b) => [...b.noiDung.matchAll(/\[\[[^\]|]+\|([^\]]+)\]\]/g)].every((m) => typeof b.nut?.[m[1].trim()] === 'function')));
kiemDung(`Câu hỏi 5–6 (có ${bg.cauHoi.length})`, bg.cauHoi.length >= 5 && bg.cauHoi.length <= 6);

tongKet();
