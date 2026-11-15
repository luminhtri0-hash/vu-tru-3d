// Bộ kiểm số cho Bài 1 «Hệ Mặt Trời đang bay»: mọi con số trong lời giảng.
// Chạy: node kiem-tra/kiem-he-mat-troi.mjs
import { registerHooks } from 'node:module';
import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { HANH_TINH, VOYAGER, TRUC_NGAN_HA, JD_J2000, viTriHanhTinh, viTriVoyager, jdTuMs, ngayThang } from '../src/vat-ly/he-mat-troi.js';
import * as H from '../src/vat-ly/hang-so.js';

// Thư viện thiên thể (src/khung/hanh-tinh-ban-do.js) nạp tệp JSON bờ biển; Node cần ghi rõ kiểu «json».
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.json')) return nextLoad(url, { ...context, importAttributes: { ...context.importAttributes, type: 'json' } });
    return nextLoad(url, context);
  },
});
const {
  default: bai, TRUC_QUAY, doNghiengTruc, rHienThi, R_MAT_TROI_TOI_THIEU,
  kinhDoTrungBinh, chuKyKepler, V_TRAI_DAT, HZ_MOI_KM_S, tanSoNot,
  TT_LECH_NHIN, TT_LECH_XUNG_DOI, TT_CHU_KY, TT_SAI_CHU_KY, TT_V1_SAI,
} = await import('../src/canh/he-mat-troi.js');

const ht = Object.fromEntries(HANH_TINH.map((h) => [h.id, h]));
const NAM_AS_KM = H.NAS_M / 1000;

muc('1. Tốc độ Mặt Trời');
kiem('230 km/s ra km/h', H.V_MAT_TROI_KM_S * 3600, 828000, 0.5, ' km/h');
kiem('Quãng đi trong 5 giây (hơn 1 000 km)', 230 * 5, 1150, 0.5, ' km');
kiem('Quãng đi mỗi năm', H.V_MAT_TROI_AU_NAM, 48.5, 0.05, ' AU');
kiem('230 km/s × 1 năm', 230 * H.NAM_GIAY, 7.26e9, 0.01e9, ' km');
kiem('Năm Julius (giây)', H.NAM_GIAY, 3.156e7, 0.001e7, ' s');
kiem('Chu vi quỹ đạo Trái Đất', 2 * Math.PI * ht.dat.a[0], 6.28, 0.01, ' AU');
kiem('Bước lò xo / chu vi (gần 8 lần)', H.V_MAT_TROI_AU_NAM / (2 * Math.PI), 7.72, 0.02);
kiem('Bước lò xo khi nén 10 lần', H.V_MAT_TROI_AU_NAM / 10, 4.85, 0.01, ' AU');
kiem('Mặt Trời đi trong một vòng Sao Hải Vương (gần 8 000 AU)', H.V_MAT_TROI_AU_NAM * ht.haiVuong.chuKyNam, 7995, 10, ' AU');
kiem('Chu vi quỹ đạo Sao Hải Vương', 2 * Math.PI * ht.haiVuong.a[0], 189, 0.5, ' AU');
kiem('Năm ánh sáng / 48,5 AU (khoảng 1 300 lần)', H.NAS_AU / H.V_MAT_TROI_AU_NAM, 1303, 2);
kiem('Năm ánh sáng ra AU', H.NAS_AU, 63241, 1, ' AU');

muc('2. Góc giữa hướng bay và mặt phẳng hoàng đạo (khoảng 60°)');
const goc = Math.asin(TRUC_NGAN_HA.quay[2]) / H.DO;
kiem('Góc', goc, 60, 0.6, '°');
kiem('230 × sin 60° (khoảng 200 km/s)', 230 * Math.sin(goc * H.DO), 200, 3, ' km/s');
kiem('230 × cos 60° (khoảng 115 km/s)', 230 * Math.cos(goc * H.DO), 115, 3, ' km/s');
const ca = Math.cos(goc * H.DO), v = 29.78, V = 230;
kiem('Tốc độ Trái Đất lớn nhất so với tâm Ngân Hà', Math.sqrt(V * V + v * v + 2 * V * v * ca), 246, 1, ' km/s');
kiem('Tốc độ Trái Đất nhỏ nhất so với tâm Ngân Hà', Math.sqrt(V * V + v * v - 2 * V * v * ca), 216, 1, ' km/s');
kiem('Chênh lệch theo hướng bay (chừng 15 km/s)', v * ca, 15, 0.5, ' km/s');

muc('3. Tỉ lệ thật (Mặt Trời là quả bóng 1,4 m)');
const k = 1.4 / (2 * H.R_MAT_TROI_KM);   // mét mô hình trên mỗi km thật
kiem('Đường kính Mặt Trời', 2 * H.R_MAT_TROI_KM, 1391400, 1, ' km');
kiem('Đường kính Trái Đất', 2 * ht.dat.banKinhKm, 12742, 1, ' km');
kiem('Viên bi Trái Đất', 2 * ht.dat.banKinhKm * k * 100, 1.3, 0.05, ' cm');
kiem('Trái Đất cách', H.AU_KM * k, 150, 1, ' m');
kiem('Đường kính Sao Mộc', 2 * ht.moc.banKinhKm, 139822, 1, ' km');
kiem('Quả cam Sao Mộc', 2 * ht.moc.banKinhKm * k * 100, 14, 0.2, ' cm');
kiem('Sao Mộc cách', ht.moc.a[0] * H.AU_KM * k, 780, 5, ' m');
kiem('Sao Hải Vương cách', ht.haiVuong.a[0] * H.AU_KM * k / 1000, 4.5, 0.05, ' km');
kiem('Voyager 1 cách (172 AU)', Math.hypot(...VOYAGER[0].r0) * H.AU_KM * k / 1000, 26, 0.5, ' km');
kiem('Ngôi sao gần nhất cách (4,25 năm ánh sáng)', 4.25 * NAM_AS_KM * k / 1000, 40000, 600, ' km');
kiem('Chu vi Trái Đất (để so)', 2 * Math.PI * 6378.137, 40075, 1, ' km');
kiem('Ánh sáng đi 1 AU', H.AU_M / H.C, 499, 0.1, ' s');
kiem('… tính bằng phút', H.AU_M / H.C / 60, 8.3, 0.05, ' phút');
kiem('Sao Mộc: phút ánh sáng', ht.moc.a[0] * H.AU_M / H.C / 60, 43, 0.5, ' phút');
kiem('Sao Hải Vương: giờ ánh sáng', ht.haiVuong.a[0] * H.AU_M / H.C / 3600, 4.2, 0.05, ' giờ');
kiem('Một ngày ánh sáng', H.NGAY_ANH_SANG_AU, 173, 0.2, ' AU');

muc('4. Mức phóng to trên hình (ghi ở bước 3)');
const phongTo = (h) => rHienThi(h.banKinhKm) / (h.banKinhKm / H.AU_KM);
kiem('Mặt Trời: ít nhất 7 lần', R_MAT_TROI_TOI_THIEU / (H.R_MAT_TROI_KM / H.AU_KM), 7.5, 0.1);
kiem('Trái Đất: khoảng 330 lần', phongTo(ht.dat), 330, 5);
kiem('Sao Mộc: khoảng 80 lần (nhỏ nhất)', phongTo(ht.moc), 82, 3);
kiem('Sao Thủy: gần 600 lần (lớn nhất)', phongTo(ht.thuy), 575, 15);
kiemDung('Không hành tinh nào phóng to dưới 80 hay trên 600 lần', HANH_TINH.every((h) => phongTo(h) >= 80 && phongTo(h) <= 600));

muc('5. Định luật Kepler thứ ba (bảng ở bước 4)');
const BANG = { thuy: [0.387, 0.241, 1.0], kim: [0.723, 0.615, 1.0], dat: [1.0, 1.0, 1.0], hoa: [1.524, 1.881, 1.0], moc: [5.203, 11.86, 0.999], tho: [9.537, 29.45, 1.0], thienVuong: [19.19, 84.02, 0.999], haiVuong: [30.07, 164.8, 0.999] };
for (const h of HANH_TINH) {
  const [a, T, q] = BANG[h.id];
  kiem(`${h.ten}: a`, h.a[0], a, Math.max(0.0005, a * 0.0005), ' AU');
  kiem(`${h.ten}: T`, h.chuKyNam, T, Math.max(0.0005, T * 0.0005), ' năm');
  kiem(`${h.ten}: T²/a³`, h.chuKyNam ** 2 / h.a[0] ** 3, q, 0.0006);
}
kiemDung('Mọi T²/a³ lệch 1 dưới 0,2%', HANH_TINH.every((h) => Math.abs(h.chuKyNam ** 2 / h.a[0] ** 3 - 1) < 0.002));
kiem('Sao Mộc: 5,203^1,5', 5.203 ** 1.5, 11.87, 0.005, ' năm');
kiem('Sao Hỏa: 1,524^1,5 (câu hỏi 2)', 1.524 ** 1.5, 1.88, 0.005, ' năm');
kiem('Sao Hỏa: chu kỳ ra ngày', ht.hoa.chuKyNam * 365.25, 687, 0.5, ' ngày');
const GMnam = H.GM_MAT_TROI * H.NAM_GIAY ** 2 / H.AU_M ** 3;
kiem('GM Mặt Trời theo AU³/năm² so với 4π² (lệch 0,004%)', Math.abs(GMnam / (4 * Math.PI ** 2) - 1) * 100, 0.004, 0.003, ' %');
kiem('Sao Mộc nặng 1/1 047 Mặt Trời: T²/a³ dự đoán', 1 / (1 + 1 / 1047), 0.99905, 0.0001);

muc('6. Voyager (bước 7)');
const [v1, v2] = VOYAGER;
const r1 = Math.hypot(...v1.r0), r2 = Math.hypot(...v2.r0);
const s1 = Math.hypot(...v1.v) * H.AU_KM / 86400, s2 = Math.hypot(...v2.v) * H.AU_KM / 86400;
kiem('Voyager 1 cách Mặt Trời', r1, 172, 0.5, ' AU');
kiem('… tính bằng ngày ánh sáng', r1 / H.NGAY_ANH_SANG_AU, 0.995, 0.001);
kiem('Voyager 1 tốc độ', s1, 16.9, 0.05, ' km/s');
kiem('Voyager 1 mỗi năm xa thêm', Math.hypot(...v1.v) * 365.25, 3.57, 0.01, ' AU');
const ngayToi = (H.NGAY_ANH_SANG_AU - r1) / (Math.hypot(...v1.v));
const den = new Date((v1.jd0 + ngayToi - 2440587.5) * 86400000);
kiemDung(`Voyager 1 tròn một ngày ánh sáng vào đầu tháng 2/2027 (tính được: ${den.toISOString().slice(0, 10)})`, den.getUTCFullYear() === 2027 && den.getUTCMonth() <= 1);
kiem('Voyager 2 cách Mặt Trời', r2, 144, 0.5, ' AU');
kiem('Voyager 2 tốc độ', s2, 15.3, 0.05, ' km/s');
kiem('Tới Proxima (4,25 năm ánh sáng) với tốc độ Voyager 1', 4.25 * H.NAS_AU / (Math.hypot(...v1.v) * 365.25), 75000, 1000, ' năm');
const namBay = (v1.jd0 - v1.jdPhong) / 365.25;
kiem('Số năm đã bay', namBay, 49, 0.3, ' năm');
kiem('Mặt Trời chở đi trong thời gian ấy', namBay * H.V_MAT_TROI_AU_NAM, 2400, 30, ' AU');
kiem('… gấp bao nhiêu lần quãng Voyager 1', namBay * H.V_MAT_TROI_AU_NAM / r1, 14, 0.3);
// ngoại suy thẳng ngược về lúc qua ranh giới nhật quyển: phải ra đúng năm NASA công bố
for (const [vv, rRa, namDung] of [[v1, 121, 2012.6], [v2, 119, 2018.85]]) {
  const a = vv.v.reduce((s, x) => s + x * x, 0), b = 2 * vv.r0.reduce((s, x, i) => s + x * vv.v[i], 0), c = vv.r0.reduce((s, x) => s + x * x, 0) - rRa * rRa;
  const dt = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  kiem(`${vv.ten} qua ${rRa} AU (năm)`, 2000 + (vv.jd0 + dt - JD_J2000) / 365.25, namDung, 0.3);
}

muc('7. Năm thiên hà (bước 8)');
const T = (2 * Math.PI * H.R0_NGAN_HA_NAS * H.NAS_M) / (230e3) / H.NAM_GIAY;
kiem('Một vòng quanh Ngân Hà', T / 1e6, 219, 1, ' triệu năm');
kiem('v/c', 230 / 299792.458, 7.67e-4, 0.005e-4);
kiem('Số năm để đi 1 năm ánh sáng', 299792.458 / 230, 1303, 1);
kiem('Chu vi vòng (năm ánh sáng)', 2 * Math.PI * 26700, 167800, 100);
kiem('Số vòng trong 4,6 tỉ năm', 4.6e9 / T, 21, 0.2);
kiem('8,2 kpc ra năm ánh sáng', 8.2 * H.PARSEC_M * 1000 / H.NAS_M, 26700, 100);

muc('8. Trục quay hành tinh (thẻ số liệu): độ nghiêng so với quỹ đạo, chu kỳ tự quay');
const NGHIENG = { thuy: 0.03, kim: 177.4, dat: 23.44, hoa: 25.19, moc: 3.13, tho: 26.73, thienVuong: 97.77, haiVuong: 28.32 };
for (const h of HANH_TINH) kiem(`${h.ten}: trục nghiêng`, doNghiengTruc(h), NGHIENG[h.id], 0.6, '°');
const QUAY_GIO = { dat: 23.93, hoa: 24.62, moc: 9.93, tho: 10.66, thienVuong: 17.24, haiVuong: 15.97 };
for (const [id, g] of Object.entries(QUAY_GIO)) kiem(`${ht[id].ten}: tự quay`, 360 / Math.abs(TRUC_QUAY[id][3]) * 24, g, 0.05, ' giờ');
kiem('Sao Kim: tự quay', 360 / Math.abs(TRUC_QUAY.kim[3]), 243, 0.5, ' ngày');

muc('9. Bản 3: tương tác, âm thanh, thử thách');
// Một vòng = kinh độ trung bình tăng 360°: đúng bằng chu kỳ trong bảng
for (const h of HANH_TINH) kiem(`${h.ten}: kinh độ trung bình tăng 360° sau đúng một chu kỳ`, kinhDoTrungBinh(h, JD_J2000 + h.chuKyNam * 365.25) - kinhDoTrungBinh(h, JD_J2000), 360, 0.2, '°');
// Âm thanh: cao độ tỉ lệ với tốc độ quỹ đạo, 22 Hz cho mỗi km/s
kiem('Nốt của Sao Thủy (47 km/s)', tanSoNot(HANH_TINH[0].vKmS), 1042, 2, ' Hz');
kiem('Nốt của Sao Hải Vương (5,4 km/s)', tanSoNot(HANH_TINH[7].vKmS), 119.5, 0.5, ' Hz');
kiemDung('Mọi nốt nằm trong khoảng tai nghe rõ (100–1 200 Hz)', HANH_TINH.every((h) => tanSoNot(h.vKmS) > 100 && tanSoNot(h.vKmS) < 1200));
kiem('Tốc độ quỹ đạo tròn ở 1 AU (hành tinh thử)', V_TRAI_DAT, 29.78, 0.01, ' km/s');
kiem('Tốc độ tròn ở 1 AU tính từ GM Mặt Trời', Math.sqrt(H.GM_MAT_TROI / H.AU_M) / 1000, 29.78, 0.01, ' km/s');
kiem('Hệ số quy đổi âm thanh', HZ_MOI_KM_S, 22, 0);
// Thử thách bước 1: nhìn dọc hướng bay; vòng khép kín nhìn nghiêng có tỉ lệ sin 60°
kiem('Ngưỡng lệch hướng nhìn', TT_LECH_NHIN, 6, 0, '°');
kiem('Quỹ đạo tròn nhìn dọc hướng bay: tỉ lệ hai trục = sin(góc nghiêng)', Math.sin(Math.asin(TRUC_NGAN_HA.quay[2])), 0.86, 0.005);
// Thử thách bước 2: xung đối Sao Hỏa kế tiếp (heliocentric) theo mô hình
{
  const [dat, hoa] = [HANH_TINH[2], HANH_TINH[3]];
  const lam = (h, jd) => { const p = viTriHanhTinh(h, jd); return Math.atan2(p[1], p[0]); };
  const lech = (jd) => { const d = lam(dat, jd) - lam(hoa, jd); return Math.atan2(Math.sin(d), Math.cos(d)); };
  let jd = jdTuMs(Date.UTC(2026, 10, 12)), truoc = lech(jd), xd = null;
  for (let i = 0; i < 4000 && !xd; i++) { jd += 0.25; const d = lech(jd); if (truoc < 0 && d >= 0) xd = jd; truoc = d; }
  kiemDung(`Xung đối kế tiếp rơi vào khoảng 20/02/2027 (tính được: ${ngayThang(xd)})`, Math.abs(xd - jdTuMs(Date.UTC(2027, 1, 20))) < 3);
  kiem('Từ 12/11/2026 tới xung đối, Trái Đất đi thêm khoảng một phần tư vòng', (lam(dat, xd) - lam(dat, jdTuMs(Date.UTC(2026, 10, 12)))) / H.DO, 101, 3, '°');
  kiem('Ngưỡng lệch Trái Đất – Sao Hỏa', TT_LECH_XUNG_DOI, 1.5, 0, '°');
  kiemDung('Hôm nay (12/11/2026) còn lệch xa ngưỡng: thử thách không đạt sẵn', Math.abs(lech(jdTuMs(Date.UTC(2026, 10, 12)))) / H.DO > 10 * TT_LECH_XUNG_DOI);
}
// Thử thách bước 4: hành tinh thử 8 năm
kiem('a để T = 8 năm', Math.cbrt(TT_CHU_KY ** 2), 4, 1e-12, ' AU');
kiem('T ở a = 4 AU', chuKyKepler(4), 8, 1e-12, ' năm');
kiem('Dung sai 0,25 năm ứng với a từ', Math.cbrt((TT_CHU_KY - TT_SAI_CHU_KY) ** 2), 3.92, 0.01, ' AU');
kiem('… tới', Math.cbrt((TT_CHU_KY + TT_SAI_CHU_KY) ** 2), 4.08, 0.01, ' AU');
kiemDung('Vị trí ban đầu a = 2,5 AU không đạt sẵn', Math.abs(chuKyKepler(2.5) - TT_CHU_KY) > TT_SAI_CHU_KY);
// Thử thách bước 7: Voyager 1 cách đúng một ngày ánh sáng
{
  const v1 = VOYAGER[0], toc = Math.hypot(...v1.v);
  kiem('Dung sai 0,6 AU ứng với số ngày đường bay (chừng hai tháng)', TT_V1_SAI / toc, 61, 2, ' ngày');
  let jd = v1.jd0; while (Math.hypot(...viTriVoyager(v1, jd)) < H.NGAY_ANH_SANG_AU) jd += 0.25;
  kiemDung(`Voyager 1 cách đúng một ngày ánh sáng vào đầu tháng 2/2027 (tính được: ${ngayThang(jd)})`, ngayThang(jd).endsWith('/02/2027'));
  kiem('Từ 12/11/2026 cần kéo tới thêm', (jd - jdTuMs(Date.UTC(2026, 10, 12))) / 365.25 * 12, 2.8, 0.3, ' tháng');
}
kiemDung('Đủ 3–5 thử thách', (() => { const n = bai.baiGiang.buoc.filter((b) => b.thuThach).length; return n >= 3 && n <= 5; })());
kiemDung('Mọi thử thách có đề và hàm kiểm', bai.baiGiang.buoc.every((b) => !b.thuThach || (b.thuThach.de && typeof b.thuThach.kiem === 'function')));

muc('10. Bài giảng đủ phần');
const bg = bai.baiGiang;
kiemDung(`Số bước 6–9 (có ${bg.buoc.length})`, bg.buoc.length >= 6 && bg.buoc.length <= 9);
kiemDung('Mọi bước có vao()', bg.buoc.every((b) => typeof b.vao === 'function'));
kiemDung('Mọi nút [[…|tên]] đều có hàm', bg.buoc.every((b) => [...b.noiDung.matchAll(/\[\[[^\]|]+\|([^\]]+)\]\]/g)].every((m) => typeof b.nut?.[m[1].trim()] === 'function')));
kiemDung('Không có «${» trong chữ', bg.buoc.every((b) => !b.noiDung.includes('${')));
kiemDung(`Câu hỏi 5–6 (có ${bg.cauHoi.length})`, bg.cauHoi.length >= 5 && bg.cauHoi.length <= 6);
kiemDung('Công thức 3–6', bg.congThuc.length >= 3 && bg.congThuc.length <= 6);

tongKet();
