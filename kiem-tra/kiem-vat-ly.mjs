// Bộ kiểm số cho phần vật lý: so với số liệu NASA/JPL Horizons và các kết quả giải tích đã biết.
// Chạy: node kiem-tra/kiem-vat-ly.mjs

import { HANH_TINH, viTriHanhTinh, VOYAGER, viTriVoyager, TRUC_NGAN_HA, V_MAT_TROI, jdTuMs } from '../src/vat-ly/he-mat-troi.js';
import * as S from '../src/vat-ly/schwarzschild.js';
import { lichSuGianNo, tuoiPhangGiaiTich, GYR_TREN_H0 } from '../src/vat-ly/vu-tru-hoc.js';
import { khoiLuongChirp, thoiGianConLai, tanSoSong, bienDo, xoanVao } from '../src/vat-ly/song-hap-dan.js';
import * as H from '../src/vat-ly/hang-so.js';

let dat = 0, hong = 0;
function kiem(ten, giaTri, mongDoi, saiSo, donVi = '') {
  const ok = Math.abs(giaTri - mongDoi) <= saiSo;
  ok ? dat++ : hong++;
  console.log(`${ok ? '  đạt ' : '  HỎNG'}  ${ten}: ${Number(giaTri.toPrecision(7))}${donVi} (mong đợi ${mongDoi}${donVi} ± ${saiSo})`);
}
const DO = Math.PI / 180;

console.log('\n1. Vị trí hành tinh ngày 11/11/2026 so với JPL Horizons (AU, hoàng đạo J2000, tâm Mặt Trời)');
const JD = 2461355.5;
const HORIZONS = {
  thuy: [4.588549675932382e-2, 3.034909753219628e-1, 2.059411562161352e-2],
  kim: [3.72039607848517e-1, 6.184571740584853e-1, -1.296727898383379e-2],
  dat: [6.59593957142657e-1, 7.385499330545104e-1, -4.961173542009994e-5],
  hoa: [-4.194175940284416e-1, 1.548453045947005, 4.273397148838778e-2],
  moc: [-3.721356535311192, 3.801324080485542, 6.746974524773358e-2],
  tho: [9.200859878458132, 1.990251048656116, -4.00912219285885e-1],
  thienVuong: [8.785773771350568, 17.3344151046553, -4.953862960622906e-2],
  haiVuong: [29.83027245220631, 1.509362212376617, -7.185145558351612e-1],
};
for (const ht of HANH_TINH) {
  const p = viTriHanhTinh(ht, JD);
  const q = HORIZONS[ht.id];
  const lech = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const r = Math.hypot(...q);
  // sai số cho phép: 0,3% khoảng cách (bảng JPL gần đúng: vài phút cung cho hành tinh trong, ~0,1° cho Mộc/Thổ)
  kiem(`${ht.ten} lệch so với Horizons`, lech / r, 0, 0.004, ' (tỉ lệ)');
}

console.log('\n2. Trái Đất lúc xuân phân 20/03/2026 14:46 UTC: kinh độ nhật tâm phải ≈ 180°');
{
  const jd = jdTuMs(Date.UTC(2026, 2, 20, 14, 46));
  const p = viTriHanhTinh(HANH_TINH[2], jd);
  let lon = Math.atan2(p[1], p[0]) / DO; if (lon < 0) lon += 360;
  // J2000 lệch với điểm xuân phân của ngày khoảng 0,37° do tuế sai sau 26 năm
  kiem('Kinh độ nhật tâm Trái Đất', lon, 180 - 0.366, 0.05, '°');
}

console.log('\n3. Hướng trong Ngân Hà (viết trong hệ hoàng đạo)');
{
  const q = TRUC_NGAN_HA.quay, t = TRUC_NGAN_HA.tam, c = TRUC_NGAN_HA.cucBac;
  kiem('Vĩ độ hoàng đạo của hướng Mặt Trời bay', Math.asin(q[2]) / DO, 59.57, 0.05, '°');
  kiem('Kinh độ hoàng đạo của tâm Ngân Hà', (Math.atan2(t[1], t[0]) / DO + 360) % 360, 266.84, 0.05, '°');
  kiem('Vĩ độ hoàng đạo của tâm Ngân Hà', Math.asin(t[2]) / DO, -5.54, 0.05, '°');
  kiem('Góc giữa mặt phẳng hoàng đạo và mặt phẳng Ngân Hà', Math.acos(c[2]) / DO, 60.19, 0.05, '°');
  kiem('Tốc độ Mặt Trời', Math.hypot(...V_MAT_TROI), 48.52, 0.02, ' AU/năm');
  kiem('828 000 km/h', H.V_MAT_TROI_KM_S * 3600, 828000, 1, ' km/h');
}

console.log('\n4. Voyager ngày 11/11/2026');
{
  const v1 = viTriVoyager(VOYAGER[0], JD), v2 = viTriVoyager(VOYAGER[1], JD);
  kiem('Voyager 1 cách Mặt Trời', Math.hypot(...v1), 172.3, 0.1, ' AU');
  kiem('Voyager 2 cách Mặt Trời', Math.hypot(...v2), 144.4, 0.1, ' AU');
  kiem('Voyager 1 tốc độ', Math.hypot(...VOYAGER[0].v) * H.AU_KM / 86400, 16.9, 0.1, ' km/s');
  kiem('Voyager 2 tốc độ', Math.hypot(...VOYAGER[1].v) * H.AU_KM / 86400, 15.3, 0.1, ' km/s');
  kiem('1 ngày ánh sáng', H.NGAY_ANH_SANG_AU, 173.14, 0.01, ' AU');
  // ngoại suy lùi về 14/02/1990, lúc Voyager 1 chụp ảnh "Đốm xanh mờ" ở cách Mặt Trời 40,5 AU
  const jdDom = jdTuMs(Date.UTC(1990, 1, 14));
  kiem('Voyager 1 ngày 14/02/1990 (ngoại suy thẳng, chỉ gần đúng)', Math.hypot(...viTriVoyager(VOYAGER[0], jdDom)), 40.5, 3, ' AU');
}

console.log('\n5. Tiến động điểm cận nhật');
{
  const M = H.GM_MAT_TROI / (H.C * H.C); // mét
  const a = 0.38709927 * H.AU_M, e = 0.20563593;
  const p = (a * (1 - e * e)) / M;
  const moiVong = S.tienDongChinhXac(p, e);
  const vongMoiTheKy = 36525 / 87.9691;
  kiem('Sao Thủy: tiến động mỗi thế kỷ', (moiVong * vongMoiTheKy) / H.GIAY_CUNG, 42.98, 0.02, '″');
  kiem('Sao Thủy: công thức 6π/p', (S.tienDongXapXi(p) * vongMoiTheKy) / H.GIAY_CUNG, 42.98, 0.02, '″');
  // Sao S2 quanh Sgr A* (GRAVITY 2020): a = 125,058 mas ở 8246,7 pc; e = 0,884649; M = 4,261 triệu M☉
  const aS2 = 0.125058 * 8246.7 * H.AU_M, eS2 = 0.884649, MS2 = 4.261e6 * M;
  const pS2 = (aS2 * (1 - eS2 * eS2)) / MS2;
  kiem('Sao S2: tiến động mỗi vòng', S.tienDongChinhXac(pS2, eS2) / DO * 60, 12.1, 0.2, "'");
  // Kiểm bộ tích phân quỹ đạo: p = 12, e = 0,5 (trường mạnh), M = 1/2
  const pp = 12, ee = 0.5, Mm = 0.5;
  const { L, E } = S.LEtuPE(pp, ee, Mm);
  const ra = (pp * Mm) / (1 - ee), rp = (pp * Mm) / (1 + ee);
  const s = { r: ra, phi: 0, vr: 0, t: 0, tau: 0 };
  let phiCan = [], rTruoc = s.r, vrTruoc = 0, rMin = Infinity;
  for (let i = 0; i < 400000 && phiCan.length < 3; i++) {
    const dtau = 0.002 * Math.pow(s.r, 1.5);
    const cu = { ...s };
    S.buocHat(s, dtau, L, E, Mm);
    rMin = Math.min(rMin, s.r);
    if (cu.vr < 0 && s.vr >= 0) { // vừa qua cận điểm: nội suy pha
      const u = cu.vr / (cu.vr - s.vr);
      phiCan.push(cu.phi + u * (s.phi - cu.phi));
    }
  }
  kiem('Bộ tích phân: cận điểm', rMin, rp, 1e-3, ' rs');
  kiem('Bộ tích phân: tiến động mỗi vòng (p=12, e=0,5)', phiCan[1] - phiCan[0] - 2 * Math.PI, S.tienDongChinhXac(pp, ee), 2e-4, ' rad');
  console.log(`         (chính xác ${(S.tienDongChinhXac(pp, ee) / DO).toFixed(2)}°, công thức trường yếu 6π/p cho ${(S.tienDongXapXi(pp) / DO).toFixed(2)}°)`);
  // Năng lượng bảo toàn: E² = vr² + (1 − 2M/r)(1 + L²/r²)
  const E2 = s.vr * s.vr + (1 - (2 * Mm) / s.r) * (1 + (L * L) / (s.r * s.r));
  kiem('Bộ tích phân: bảo toàn năng lượng', E2, E * E, 1e-7);
  // ISCO: p = 6, e = 0 → L = √12·M, E = √(8/9)
  const isco = S.LEtuPE(6.0000001, 0, 1);
  kiem('ISCO: L/M', isco.L, Math.sqrt(12), 1e-3);
  kiem('ISCO: E', isco.E, Math.sqrt(8 / 9), 1e-6);
}

console.log('\n6. Ánh sáng bị bẻ cong');
{
  const rsMT = H.RS_MAT_TROI_M / 1000, RMT = H.R_MAT_TROI_KM;
  kiem('Sát mép Mặt Trời (công thức 2rs/b)', (2 * rsMT / RMT) / H.GIAY_CUNG, 1.75, 0.01, '″');
  kiem('b = 1000 rs: tích phân số', S.gocLechAnhSang(1000, { xa: 2e5 }), S.gocLechXapXi(1000), 2e-7, ' rad');
  // thêm số hạng bậc ba (16/3)(rs/b)³ của khai triển trường yếu
  kiem('b = 50 rs', S.gocLechAnhSang(50, { xa: 2e4 }), S.gocLechXapXi(50) + (16 / 3) / 50 ** 3, 3e-6, ' rad');
  const bat = S.gocLechAnhSang(S.B_TOI_HAN - 0.002), thoat = S.gocLechAnhSang(S.B_TOI_HAN + 0.002);
  kiem('b ngay dưới tới hạn 2,598 rs: bị nuốt', bat === null ? 1 : 0, 1, 0);
  kiem('b ngay trên tới hạn: thoát (và quấn hơn 1 vòng)', thoat !== null && thoat > 2 * Math.PI ? 1 : 0, 1, 0);
  // Giá trị chính xác đã biết: b = 3√3/2·... dùng tích phân eliptic; ở đây so shader với RK4 bước mịn
  for (const b of [2.65, 3, 4, 6, 10, 20, 35]) {
    const chuan = S.gocLechAnhSang(b, { xa: 60, heSo: 0.002 });
    const shader = S.gocLechAnhSang(b, { xa: 60, shader: true });
    // sát tới hạn góc lệch tăng vô hạn nên rất nhạy; cho phép 3% ở b = 2,65
    kiem(`Thuật toán shader, b = ${b} rs (lệch ${(chuan / DO).toFixed(1)}°)`, shader / chuan, 1, b < 2.9 ? 0.03 : 0.01, ' (tỉ số)');
  }
  { // kích thước bóng lỗ đen mà shader vẽ ra: tìm b tới hạn bằng chia đôi
    let lo = 2.3, hi = 2.9;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      (S.gocLechAnhSang(m, { xa: 60, shader: true }) === null) ? (lo = m) : (hi = m);
    }
    kiem('Thuật toán shader: bán kính bóng lỗ đen', (lo + hi) / 2 / S.B_TOI_HAN, 1, 0.002, ' (tỉ số)');
  }
  kiem('Bóng lỗ đen nhìn từ mặt cầu photon: đúng nửa bầu trời', S.gocBong(1.5) / DO, 90, 1e-6, '°');
  kiem('Bóng lỗ đen nhìn từ 100 rs', S.gocBong(100), S.B_TOI_HAN / 100 * Math.sqrt(0.99), 1e-4, ' rad');
}

console.log('\n7. Thời gian và hình dạng không gian');
{
  const ep = H.GM_TRAI_DAT / (H.R_TRAI_DAT_KM * 1000 * H.C * H.C);
  kiem('Mặt đất: đồng hồ chậm so với ở rất xa, mỗi năm', ep * H.NAM_GIAY * 1000, 21.9, 0.2, ' ms');
  // GPS: bán kính quỹ đạo 26 571 km. Hấp dẫn: +45,7 µs/ngày; chuyển động: −7,2 µs/ngày
  const rGPS = 26571e3, R = H.R_TRAI_DAT_KM * 1000;
  const hapDan = (H.GM_TRAI_DAT / (H.C * H.C)) * (1 / R - 1 / rGPS) * 86400 * 1e6;
  const vGPS2 = H.GM_TRAI_DAT / rGPS;
  const chuyenDong = -(vGPS2 / (2 * H.C * H.C)) * 86400 * 1e6;
  kiem('GPS: nhanh lên do hấp dẫn yếu hơn', hapDan, 45.7, 0.3, ' µs/ngày');
  kiem('GPS: chậm đi do chuyển động', chuyenDong, -7.2, 0.1, ' µs/ngày');
  kiem('GPS: tổng cộng', hapDan + chuyenDong, 38.5, 0.4, ' µs/ngày');
  kiem('GPS: sai vị trí nếu không hiệu chỉnh', (hapDan + chuyenDong) * 1e-6 * H.C / 1000, 11.5, 0.2, ' km/ngày');
  kiem('Tháp Tokyo Skytree 450 m', (9.80 * 450 / (H.C * H.C)) * 86400 * 1e9, 4.24, 0.05, ' ns/ngày');
  kiem('Bề mặt Mặt Trời: chậm mỗi năm', (H.GM_MAT_TROI / (H.R_MAT_TROI_KM * 1000 * H.C * H.C)) * H.NAM_GIAY, 66.9, 0.5, ' s');
  kiem('Sao neutron 1,4 M☉, R = 12 km', S.nhipDongHo(12, 1.4 * H.RS_MAT_TROI_M / 1000), 0.81, 0.01);
  // mặt nhúng: nối trơn tại bề mặt sao
  const R0 = 3, rs = 1, d = 1e-6;
  kiem('Mặt nhúng liên tục tại bề mặt sao', S.nhungSao(R0 + d, R0, rs) - S.nhungSao(R0 - d, R0, rs), 0, 1e-5);
  const docTrong = (S.nhungSao(R0, R0, rs) - S.nhungSao(R0 - d, R0, rs)) / d;
  const docNgoai = (S.nhungSao(R0 + d, R0, rs) - S.nhungSao(R0, R0, rs)) / d;
  kiem('Mặt nhúng: độ dốc hai phía bằng nhau', docTrong, docNgoai, 1e-4);
  kiem('Độ dốc = √(rs/(R−rs))', docNgoai, Math.sqrt(rs / (R0 - rs)), 1e-4);
  kiem('Khoảng cách thật từ 2rs tới 3rs (lớn hơn 1)', S.khoangCachThat(2, 3), 1.29, 0.02, ' rs');
  kiem('Nhịp đồng hồ trong sao khớp ngoài sao tại bề mặt', S.nhipDongHoTrongSao(R0, R0, rs), S.nhipDongHo(R0, rs), 1e-12);
}

console.log('\n8. Vũ trụ giãn nở');
{
  const chuan = lichSuGianNo({ H0: 67.4, Om: 0.315, OL: 0.685, Or: 0 });
  kiem('ΛCDM không bức xạ: tuổi so với nghiệm giải tích', chuan.tuoi, tuoiPhangGiaiTich(67.4, 0.315), 0.005, ' tỉ năm');
  const thuc = lichSuGianNo();
  kiem('ΛCDM Planck 2018: tuổi vũ trụ', thuc.tuoi, 13.79, 0.03, ' tỉ năm');
  kiem('Hệ số tỉ lệ lúc bắt đầu giãn nhanh dần', thuc.aTangToc, 0.613, 0.002);
  const eds = lichSuGianNo({ H0: 67.4, Om: 1, OL: 0, Or: 0 });
  kiem('Vũ trụ chỉ có vật chất: tuổi = 2/(3H0)', eds.tuoi, (2 / 3) * GYR_TREN_H0 / 67.4, 0.005, ' tỉ năm');
  kiem('Chỉ có vật chất: a(t) ∝ t^(2/3)', eds.aTai(-eds.tuoi / 2), Math.pow(0.5, 2 / 3), 0.002);
  const dong = lichSuGianNo({ H0: 67.4, Om: 3, OL: 0, Or: 0 }, { tSau: 400 });
  kiem('Quá nhiều vật chất (Ωm = 3): co lại', dong.coLai ? 1 : 0, 1, 0);
  // vũ trụ đóng chỉ có vật chất: a_max = Ωm/(Ωm−1)
  kiem('Ωm = 3: kích thước cực đại', Math.max(...dong.as), 1.5, 0.005);
  kiem('1/H0', GYR_TREN_H0 / 67.4, 14.51, 0.01, ' tỉ năm');
  kiem('H(a=1) = H0', thuc.H(1), 67.4, 1e-9);
  // a = 1/1090 (bức xạ nền): tuổi ≈ 370–380 nghìn năm
  const lo = thuc.bang.findIndex((k) => k.a >= 1 / 1090);
  kiem('Tuổi vũ trụ lúc phát bức xạ nền (z = 1090)', (thuc.bang[lo].t + thuc.tuoi) * 1e6, 373, 15, ' nghìn năm');
}

console.log('\n9. Sóng hấp dẫn (GW150914)');
{
  kiem('Khối lượng chirp của 36 + 29 M☉', khoiLuongChirp(36, 29), 28.1, 0.1, ' M☉');
  // trong hệ máy dò (dịch đỏ z = 0,09) khối lượng chirp ≈ 30,4 M☉
  kiem('Từ 35 Hz tới lúc sáp nhập', thoiGianConLai(35, 30.4), 0.17, 0.02, ' s');
  kiem('Tần số 0,05 s trước sáp nhập', tanSoSong(0.05, 30.4), 55, 6, ' Hz');
  // công thức cho hướng nhìn thuận lợi nhất (dọc trục quỹ đạo): 2,4×10⁻²¹.
  // LIGO đo được đỉnh 1,0×10⁻²¹ vì hệ nằm nghiêng và máy dò không hướng thẳng vào nguồn.
  kiem('Biên độ h ở 410 Mpc, f = 150 Hz (hướng thuận lợi nhất)', bienDo(150, 30.4, 410) * 1e21, 2.42, 0.05, '×10⁻²¹');
  const a = xoanVao(-2), b = xoanVao(-2.001);
  kiem('Pha và tần số nhất quán (dΦ/dt = Ω)', (a.pha - b.pha) / 0.001, a.omega, 1e-3);
}

console.log(`\nTổng: ${dat} đạt, ${hong} hỏng.`);
process.exit(hong ? 1 : 0);
