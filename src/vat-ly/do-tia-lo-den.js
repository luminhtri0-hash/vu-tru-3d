// Dò ngược MỘT tia sáng quanh lỗ đen Schwarzschild bằng đúng thuật toán mà shader của Bài 15 dùng cho mỗi điểm ảnh
// (để ô chú giải khi rê chuột nói đúng điều điểm ảnh ấy đang vẽ). Không dùng three.js.
// Đơn vị rs = c = 1. Người xem đứng yên ở vị trí cam; dLoc là hướng nhìn đo bằng thước, đồng hồ của người ấy.

const SQ = Math.sqrt;
const cham = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const goc = (a, b) => {
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return Math.atan2(SQ(cham(c, c)), cham(a, b));
};

// Tỉ số tần số nhận / phát của khí quay tròn (Kepler) ở bán kính rho, với tia có ell = L_y/E, người xem có can = √(1 − 1/r0).
export function gDia(rho, ell, can) {
  const om = SQ(0.5 / (rho * rho * rho));
  return SQ(1 - 1.5 / rho) / Math.max(0.05, 1 - om * ell) / can;
}

// Nhiệt độ tương đối của đĩa mỏng theo bán kính (bằng 1 ở chỗ nóng nhất, r = 49/36 · 3 ≈ 4,08 rs).
export const nhietDoDia = (rho, rTrong = 3) => (Math.pow(rho / rTrong, -0.75) * Math.pow(Math.max(0, 1 - SQ(rTrong / rho)), 0.25)) / 0.4879;

export function doTia(cam, dLoc, { dia = true, doppler = true, rTrong = 3, rNgoai = 12, soBuoc = 300 } = {}) {
  let p = [cam[0], cam[1], cam[2]];
  const r0 = SQ(cham(p, p));
  const er = [p[0] / r0, p[1] / r0, p[2] / r0];
  const can = SQ(Math.max(1e-4, 1 - 1 / r0));
  const dr = cham(dLoc, er);
  let v = [dr * can * er[0] + dLoc[0] - dr * er[0], dr * can * er[1] + dLoc[1] - dr * er[1], dr * can * er[2] + dLoc[2] - dr * er[2]];
  const lv = SQ(cham(v, v)); v = [v[0] / lv, v[1] / lv, v[2] / lv];
  // L_y / E của photon tới mắt (photon đi theo −dLoc)
  const ell = (p[2] * -dLoc[0] - p[0] * -dLoc[2]) / can;
  const hv = [p[1] * v[2] - p[2] * v[1], p[2] * v[0] - p[0] * v[2], p[0] * v[1] - p[1] * v[0]];
  const h2 = cham(hv, hv);
  const xa = Math.max(40, r0 * 1.02);
  let roi = false, thoat = false, be = 0, quet = 0, rMin = r0, soLanCat = 0;
  let trungDia = null;
  for (let i = 0; i < soBuoc; i++) {
    const r2 = cham(p, p), r = SQ(r2);
    if (r < rMin) rMin = r;
    if (r < 1) { roi = true; break; }
    if (r > xa && cham(p, v) > 0) { thoat = true; break; }
    const dl = Math.max(0.02, Math.min(0.1 * r, Math.max(0.06 * r, (0.003 * r2 * r2) / Math.max(1e-9, h2))));
    let k = (0.75 * dl * h2) / (r2 * r2 * r);
    const vn = [v[0] - k * p[0], v[1] - k * p[1], v[2] - k * p[2]];
    const pn = [p[0] + dl * vn[0], p[1] + dl * vn[1], p[2] + dl * vn[2]];
    const n2 = cham(pn, pn);
    k = (0.75 * dl * h2) / (n2 * n2 * SQ(n2));
    vn[0] -= k * pn[0]; vn[1] -= k * pn[1]; vn[2] -= k * pn[2];
    if (p[1] * pn[1] < 0) {
      soLanCat++;
      if (dia && !trungDia) {
        const u = p[1] / (p[1] - pn[1]);
        const c = [p[0] + u * (pn[0] - p[0]), 0, p[2] + u * (pn[2] - p[2])];
        const rho = Math.hypot(c[0], c[2]);
        if (rho > rTrong && rho < rNgoai) {
          const g = doppler ? gDia(rho, ell, can) : 1;
          trungDia = {
            rho, phi: Math.atan2(c[2], c[0]), x: c[0], z: c[2], g, sang: g ** 4, nhiet: nhietDoDia(rho, rTrong),
            tocDo: SQ(0.5 / rho) / SQ(1 - 1 / rho),   // tốc độ quỹ đạo tròn đo bởi người đứng yên tại chỗ: √(M/r)/√(1 − 2M/r)
            sauLoDen: c[0] * er[0] + c[2] * er[2] < 0, quet: (quet + goc(p, pn) * u) * 180 / Math.PI, lanCat: soLanCat,
          };
        }
      }
    }
    be += goc(v, vn);
    quet += goc(p, pn);
    p = pn; v = [vn[0], vn[1], vn[2]];
  }
  const lv2 = SQ(cham(v, v));
  return {
    roi, thoat, ell, can, rMin,
    be: (be * 180) / Math.PI,             // tổng góc hướng bay của tia đã xoay (độ)
    quet: (quet * 180) / Math.PI,         // tổng góc tia đã quét quanh tâm (độ)
    huongCuoi: [v[0] / lv2, v[1] / lv2, v[2] / lv2],
    dia: trungDia,
  };
}
