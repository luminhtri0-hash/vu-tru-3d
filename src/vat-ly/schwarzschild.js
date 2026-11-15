// Không-thời gian Schwarzschild: quanh một khối cầu không quay, không tích điện.
// Đơn vị hình học G = c = 1. Trừ khi ghi khác, bán kính Schwarzschild rs = 1 (tức M = 1/2).
//
//   ds² = −(1 − rs/r) dt² + dr²/(1 − rs/r) + r² dΩ²

// ---------- Vật có khối lượng (đường trắc địa kiểu thời gian), mặt phẳng xích đạo ----------

// Quỹ đạo liên kết mô tả bằng p (bán thông số, tính theo M) và tâm sai e:
// cận điểm r = pM/(1+e), viễn điểm r = pM/(1−e). Điều kiện ổn định: p > 6 + 2e.
export function LEtuPE(p, e, M = 0.5) {
  const mau = p - 3 - e * e;
  const L = (p * M) / Math.sqrt(mau);                                    // mô-men động lượng riêng
  const E = Math.sqrt(((p - 2) * (p - 2) - 4 * e * e) / (p * mau));      // năng lượng riêng
  return { L, E };
}

// Góc tiến động của cận điểm sau mỗi vòng (radian), tính chính xác bằng tích phân
//   Δφ = ∫₀^{2π} [p / (p − 6 − 2e·cosχ)]^{1/2} dχ − 2π
export function tienDongChinhXac(p, e, n = 2000) {
  if (p <= 6 + 2 * e) return Infinity;
  let s = 0;
  const h = (2 * Math.PI) / n;
  for (let i = 0; i <= n; i++) {
    const f = Math.sqrt(p / (p - 6 - 2 * e * Math.cos(i * h)));
    s += f * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
  }
  return (s * h) / 3 - 2 * Math.PI;
}
// Công thức trường yếu của Einstein (1915): Δφ ≈ 6πGM/(c²a(1−e²)) = 6π/p.
export const tienDongXapXi = (p) => (6 * Math.PI) / p;

// Một bước RK4 cho trạng thái s = {r, phi, vr, t, tau}; tham số là thời gian riêng τ.
//   d²r/dτ² = −M/r² + L²/r³ − 3ML²/r⁴     (số hạng cuối là phần mới của Einstein)
//   dφ/dτ  = L/r²,   dt/dτ = E/(1 − 2M/r)
export function buocHat(s, dtau, L, E, M = 0.5, einstein = true) {
  const k = einstein ? 3 * M * L * L : 0;
  const acc = (r) => -M / (r * r) + (L * L) / (r * r * r) - k / (r * r * r * r);
  const dphi = (r) => L / (r * r);
  const dt = (r) => (einstein ? E / (1 - (2 * M) / r) : 1);
  const r1 = s.r, v1 = s.vr;
  const a1 = acc(r1);
  const r2 = r1 + 0.5 * dtau * v1, v2 = v1 + 0.5 * dtau * a1;
  const a2 = acc(r2);
  const r3 = r1 + 0.5 * dtau * v2, v3 = v1 + 0.5 * dtau * a2;
  const a3 = acc(r3);
  const r4 = r1 + dtau * v3, v4 = v1 + dtau * a3;
  const a4 = acc(r4);
  s.r = r1 + (dtau / 6) * (v1 + 2 * v2 + 2 * v3 + v4);
  s.vr = v1 + (dtau / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
  s.phi += (dtau / 6) * (dphi(r1) + 2 * dphi(r2) + 2 * dphi(r3) + dphi(r4));
  s.t += (dtau / 6) * (dt(r1) + 2 * dt(r2) + 2 * dt(r3) + dt(r4));
  s.tau += dtau;
  return s;
}

// Thế hiệu dụng: ½(dr/dτ)² + V(r) = ½(E² − 1).
export const theHieuDung = (r, L, M = 0.5, einstein = true) =>
  -M / r + (L * L) / (2 * r * r) - (einstein ? (M * L * L) / (r * r * r) : 0);

// ---------- Ánh sáng (đường trắc địa kiểu ánh sáng) ----------
// Hình dạng tia sáng thỏa u'' + u = (3/2)·rs·u² với u = 1/r. Phương trình này tương đương với
// chuyển động trong không gian phẳng dưới "gia tốc" a = −(3/2)·rs·h²·x/r⁵, trong đó h = |x × v|.
// Đây cũng chính là phép tính mà shader lỗ đen dùng cho từng điểm ảnh.

export function taoTia(x, y, z, vx, vy, vz) {
  const n = Math.hypot(vx, vy, vz);
  vx /= n; vy /= n; vz /= n;
  const hx = y * vz - z * vy, hy = z * vx - x * vz, hz = x * vy - y * vx;
  return { x, y, z, vx, vy, vz, h2: hx * hx + hy * hy + hz * hz, t: 0 };
}

// RK4 – dùng để vẽ tia sáng chính xác ở phía JavaScript. rs = 1.
export function buocTiaRK4(s, dl) {
  const k = -1.5 * s.h2;
  const A = (x, y, z) => {
    const r2 = x * x + y * y + z * z;
    const f = k / (r2 * r2 * Math.sqrt(r2));
    return [f * x, f * y, f * z];
  };
  const { x, y, z, vx, vy, vz } = s;
  const a1 = A(x, y, z);
  const x2 = x + 0.5 * dl * vx, y2 = y + 0.5 * dl * vy, z2 = z + 0.5 * dl * vz;
  const u2 = vx + 0.5 * dl * a1[0], v2 = vy + 0.5 * dl * a1[1], w2 = vz + 0.5 * dl * a1[2];
  const a2 = A(x2, y2, z2);
  const x3 = x + 0.5 * dl * u2, y3 = y + 0.5 * dl * v2, z3 = z + 0.5 * dl * w2;
  const u3 = vx + 0.5 * dl * a2[0], v3 = vy + 0.5 * dl * a2[1], w3 = vz + 0.5 * dl * a2[2];
  const a3 = A(x3, y3, z3);
  const x4 = x + dl * u3, y4 = y + dl * v3, z4 = z + dl * w3;
  const u4 = vx + dl * a3[0], v4 = vy + dl * a3[1], w4 = vz + dl * a3[2];
  const a4 = A(x4, y4, z4);
  const nx = x + (dl / 6) * (vx + 2 * u2 + 2 * u3 + u4);
  const ny = y + (dl / 6) * (vy + 2 * v2 + 2 * v3 + v4);
  const nz = z + (dl / 6) * (vz + 2 * w2 + 2 * w3 + w4);
  // Thời gian tọa độ (đồng hồ của người ở rất xa) trôi qua trên đoạn này:
  //   dt² = dr²/(1 − 1/r)² + r²dφ²/(1 − 1/r)
  const r0 = Math.hypot(x, y, z), r1 = Math.hypot(nx, ny, nz);
  const dr = r1 - r0;
  const d2 = (nx - x) ** 2 + (ny - y) ** 2 + (nz - z) ** 2;
  const ngang2 = Math.max(0, d2 - dr * dr);
  const f = 1 - 2 / (r0 + r1);
  if (f > 1e-6) s.t += Math.sqrt((dr * dr) / (f * f) + ngang2 / f);
  s.x = nx; s.y = ny; s.z = nz;
  s.vx = vx + (dl / 6) * (a1[0] + 2 * a2[0] + 2 * a3[0] + a4[0]);
  s.vy = vy + (dl / 6) * (a1[1] + 2 * a2[1] + 2 * a3[1] + a4[1]);
  s.vz = vz + (dl / 6) * (a1[2] + 2 * a2[2] + 2 * a3[2] + a4[2]);
  return s;
}

// Bản sao đúng thuật toán của shader (velocity Verlet) để kiểm sai số bằng số.
// Cỡ bước: nhỏ ở gần lỗ đen (0,06·r), lớn dần ở nơi tia gần như thẳng (tới 0,1·r),
// sao cho mỗi bước tia chỉ bị bẻ một góc nhỏ: dl ≈ eps·r⁴/h². Sai số góc lệch dưới 0,3%.
export function buocTiaShader(s, kMin = 0.06, eps = 0.003, kMax = 0.1) {
  const k = -1.5 * s.h2;
  let r2 = s.x * s.x + s.y * s.y + s.z * s.z;
  const r = Math.sqrt(r2);
  const dl = Math.max(0.02, Math.min(kMax * r, Math.max(kMin * r, (eps * r2 * r2) / Math.max(1e-9, s.h2))));
  let f = k / (r2 * r2 * r);
  const hvx = s.vx + 0.5 * dl * f * s.x, hvy = s.vy + 0.5 * dl * f * s.y, hvz = s.vz + 0.5 * dl * f * s.z;
  s.x += dl * hvx; s.y += dl * hvy; s.z += dl * hvz;
  r2 = s.x * s.x + s.y * s.y + s.z * s.z;
  f = k / (r2 * r2 * Math.sqrt(r2));
  s.vx = hvx + 0.5 * dl * f * s.x; s.vy = hvy + 0.5 * dl * f * s.y; s.vz = hvz + 0.5 * dl * f * s.z;
  s.buoc = (s.buoc || 0) + 1;
  return s;
}

// Bắn một tia từ rất xa với tham số va chạm b (đơn vị rs). Trả về góc lệch (radian) hoặc null nếu bị nuốt.
export function gocLechAnhSang(b, { xa = 2000, shader = false, heSo = 0.01 } = {}) {
  const s = taoTia(-xa, b, 0, 1, 0, 0);
  const r0 = Math.hypot(s.x, s.y);
  let tong = 0; // tổng góc tia quét quanh tâm (cộng dồn nên đếm được cả khi tia quấn nhiều vòng)
  for (let i = 0; i < 5e6; i++) {
    const px = s.x, py = s.y;
    const r = Math.hypot(px, py);
    if (r < 1.0) return null;
    if (r > r0 * 1.0001 && px * s.vx + py * s.vy > 0) break;
    if (shader) buocTiaShader(s);
    else buocTiaRK4(s, Math.max(0.002, heSo * r));
    tong += Math.atan2(px * s.y - py * s.x, px * s.x + py * s.y);
  }
  // Trong không gian phẳng tia quét đúng π − asin(b/r0) − asin(b/r1); phần dư là góc lệch.
  const r1 = Math.hypot(s.x, s.y);
  return Math.abs(tong) - Math.PI + Math.asin(b / r0) + Math.asin(b / r1);
}

export const B_TOI_HAN = (3 * Math.sqrt(3)) / 2;   // tham số va chạm tới hạn ≈ 2,598 rs
export const R_PHOTON = 1.5;                        // mặt cầu photon
export const R_ISCO = 3;                            // quỹ đạo tròn ổn định trong cùng
// Trường yếu: α ≈ 2rs/b (+ bậc hai 15π/16·(rs/b)²). Newton thuần túy chỉ cho một nửa: rs/b.
export const gocLechXapXi = (b) => 2 / b + ((15 * Math.PI) / 16) / (b * b);

// Góc bán kính của "bóng" lỗ đen với người đứng yên ở bán kính r (đơn vị rs).
export function gocBong(r) {
  const s = Math.min(1, (B_TOI_HAN * Math.sqrt(Math.max(0, 1 - 1 / r))) / r);
  return r >= R_PHOTON ? Math.asin(s) : Math.PI - Math.asin(s);
}

// ---------- Thời gian ----------
// Đồng hồ đứng yên ở bán kính r chạy chậm so với đồng hồ ở rất xa theo tỉ lệ √(1 − rs/r).
export const nhipDongHo = (r, rs = 1) => Math.sqrt(Math.max(0, 1 - rs / r));
// Đồng hồ trên quỹ đạo tròn: √(1 − 3rs/(2r)).
export const nhipDongHoQuyDao = (r, rs = 1) => Math.sqrt(Math.max(0, 1 - (1.5 * rs) / r));
// Bên trong ngôi sao mật độ đều bán kính R (nghiệm Schwarzschild trong).
export const nhipDongHoTrongSao = (r, R, rs) =>
  1.5 * Math.sqrt(1 - rs / R) - 0.5 * Math.sqrt(1 - (rs * r * r) / (R * R * R));

// ---------- Hình dạng không gian (mặt nhúng) ----------
// Lát cắt xích đạo tại một thời điểm có hình học dl² = dr²/(1 − rs/r) + r²dφ².
// Nhúng nó vào không gian Euclid 3 chiều được mặt paraboloid Flamm: z(r) = 2√(rs(r − rs)).
export const flamm = (r, rs = 1) => 2 * Math.sqrt(Math.max(0, rs * (r - rs)));

// Độ sâu mặt nhúng quanh ngôi sao mật độ đều bán kính R, khối lượng ứng với rs (cần R > 9rs/8).
// Bên trong là chỏm cầu bán kính A = √(R³/rs); bên ngoài là paraboloid Flamm, nối trơn tại r = R.
export function nhungSao(r, R, rs) {
  if (rs <= 0) return 0;
  const A = Math.sqrt((R * R * R) / rs);
  const trong = (x) => A - Math.sqrt(Math.max(0, A * A - x * x));
  if (r <= R) return trong(r);
  return trong(R) + flamm(r, rs) - flamm(R, rs);
}

// Khoảng cách đo thật (bằng thước) theo phương bán kính giữa r1 và r2 ở ngoài khối lượng.
export function khoangCachThat(r1, r2, rs = 1) {
  const F = (r) => Math.sqrt(r * (r - rs)) + rs * Math.log(Math.sqrt(r) + Math.sqrt(r - rs));
  return F(r2) - F(r1);
}
