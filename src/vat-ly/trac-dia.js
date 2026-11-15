// Mặt nhúng theo R. Jonsson, «Embedding spacetime via a geodesically equivalent metric of Euclidean
// signature», Gen. Rel. Grav. 33, 1207 (2001): phần (thời gian × độ cao) của không-thời gian
// Schwarzschild nhúng thành một mặt tròn xoay sao cho ĐƯỜNG TRẮC ĐỊA CỦA MẶT trùng đúng với đường thế giới
// của vật rơi tự do theo phương thẳng đứng (và của tia sáng đi thẳng đứng).
//
// Đơn vị: c = 1. Độ dài và thời gian đo bằng cùng một đơn vị (mét với Trái Đất, rs với lỗ đen).
// Mọi hàm nhận ĐỘ CAO h = r − R thay vì r, để khỏi mất chữ số khi R lớn (Trái Đất: R = 6,4 triệu mét
// mà vùng xét chỉ cao 10 mét).
//
//   Metric thật:   ds² = −A dt² + B dr²,   A = 1 − rs/r,  B = 1/A
//   ψ(r) = A(r) − A(R) = rs·(1/R − 1/r) = rs·h / (R·(R + h))
//   Metric đối ngẫu (dương xác định): dσ² = α dt² + β dr²,
//     α = A/(δ + ψ),  β = k·B/(δ + ψ)²,  k = A(R) − δ > 0
//   Dựng mặt: s = 1 + ψ/δ,  a = √(A/(A(R)·s)) (bán kính vòng, = 1 tại mặt đất),  b = √B / s
//     Θ = λ·min[b/|a′|],  dℓ/dr = b/Θ,  z′ = √((b/Θ)² − a′²),  góc quanh trục φ = t/T0,
//     T0 = Θ·√(k/(A(R)·δ)).
//   Kiểm chứng: với cảm sinh trên mặt  ds²_mặt = a² dφ² + (b/Θ)² dr² = [δ/(A(R)·T0²)]·dσ²,
//   tức chỉ khác dσ² một hằng số nhân, nên hai metric có cùng đường trắc địa.

// ψ(h) = A(R + h) − A(R), tính theo dạng không bị trừ hai số gần bằng nhau.
export const psiH = (rs, R, h) => (rs * h) / (R * (R + h));

// Dựng mặt. rs, R, hMax: bán kính Schwarzschild, bán kính mặt đất, độ cao lớn nhất (cùng đơn vị).
// eta = δ/ψ(hMax), lambda: hai tham số trình bày (chỉ đổi dáng mặt, không đổi tính chất trắc địa).
export function taoMat({ rs, R, hMax, eta = 0.25, lambda = 0.6, n = 2400 }) {
  const AR = 1 - rs / R;
  const psiMax = psiH(rs, R, hMax);
  const delta = eta * psiMax;
  const k = AR - delta;
  if (!(k > 0)) throw new Error('k = A(R) − δ phải dương: giảm eta.');
  const psi = (h) => psiH(rs, R, h);
  const A = (h) => AR + psi(h);
  const dpsi = (h) => rs / ((R + h) * (R + h));                    // ψ′ = A′ = rs/r²
  // a = √[(1 + ψ/A(R)) / (1 + ψ/δ)]
  const a = (h) => { const p = psi(h); return Math.sqrt((1 + p / AR) / (1 + p / delta)); };
  // (ln a)′ = ½ψ′·[1/(A(R) + ψ) − 1/(δ + ψ)]
  const da = (h) => { const p = psi(h); return 0.5 * dpsi(h) * (1 / (AR + p) - 1 / (delta + p)) * a(h); };
  const s = (h) => 1 + psi(h) / delta;
  const b = (h) => 1 / (Math.sqrt(A(h)) * s(h));

  // Θ = λ·min b/|a′| trên lưới dày
  let minTi = Infinity;
  for (let i = 0; i <= n; i++) {
    const h = (hMax * i) / n;
    const q = b(h) / Math.abs(da(h));
    if (q < minTi) minTi = q;
  }
  const Theta = lambda * minTi;
  const T0 = Theta * Math.sqrt(k / (AR * delta));

  // Bảng a(h), z(h), ℓ(h): tích phân hình thang trên lưới dày (Simpson cho từng ô hai nửa)
  const H = new Float64Array(n + 1), Ab = new Float64Array(n + 1), Z = new Float64Array(n + 1), L = new Float64Array(n + 1);
  const zp = (h) => Math.sqrt(Math.max(0, (b(h) / Theta) ** 2 - da(h) ** 2));
  const lp = (h) => b(h) / Theta;
  for (let i = 0; i <= n; i++) {
    const h = (hMax * i) / n;
    H[i] = h; Ab[i] = a(h);
    if (i > 0) {
      const h0 = H[i - 1], hm = 0.5 * (h0 + h), d = h - h0;
      Z[i] = Z[i - 1] + (d / 6) * (zp(h0) + 4 * zp(hm) + zp(h));
      L[i] = L[i - 1] + (d / 6) * (lp(h0) + 4 * lp(hm) + lp(h));
    }
  }
  const noiSuy = (M) => (h) => {
    const x = Math.min(n, Math.max(0, (h / hMax) * n));
    const i = Math.min(n - 1, Math.floor(x)), f = x - i;
    return M[i] + (M[i + 1] - M[i]) * f;
  };
  return {
    rs, R, hMax, eta, lambda, AR, delta, k, Theta, T0, psiMax,
    psi, A, dpsi, a, da, b, s,
    bang: { H, a: Ab, z: Z, l: L },
    aTai: noiSuy(Ab), zTai: noiSuy(Z), lTai: noiSuy(L),
    // dư của điều kiện nhúng: (b/Θ)² − a′² phải ≥ 0 trên cả miền
    duNhung: (h) => (b(h) / Theta) ** 2 - da(h) ** 2,
  };
}

// ---------- Đường thế giới thật của vật ném thẳng đứng ----------
// Vận tốc ban đầu v0 = dr/dt (c = 1) tại độ cao h0:
//   e0 = A0·v0²/(A0² − v0²),  E² = A0 + e0,  W(h) = e0 − (ψ(h) − ψ(h0)),  (dr/dt)² = A²·W/E²
//   d²r/dt² = A·A′·(2W − A)/(2E²)
export function nangLuong(rs, R, h0, v0) {
  const A0 = 1 - rs / R + psiH(rs, R, h0);
  const e0 = (A0 * v0 * v0) / (A0 * A0 - v0 * v0);
  return { A0, e0, E2: A0 + e0 };
}
// ψ(h) − ψ(h0) = rs·(h − h0)/((R + h)(R + h0))
const dPsi = (rs, R, h, h0) => (rs * (h - h0)) / ((R + h) * (R + h0));

export function giaTocToaDo(rs, R, h0, e0, E2, h) {
  const r = R + h;
  const A = 1 - rs / R + psiH(rs, R, h);
  const W = e0 - dPsi(rs, R, h, h0);
  return (A * (rs / (r * r)) * (2 * W - A)) / (2 * E2);
}

// Tích phân RK4 theo thời gian t (đồng hồ ở xa). Dừng khi chạm đất (h = 0), khi vượt hMax, hoặc hết tMax.
// Trả về mảng t, h, v (= dh/dt) và các thông tin: tBay (thời gian bay tới lúc chạm đất), hDinh.
export function quyDao({ rs, R, hMax, h0, v0, tMax, soBuoc = 4000 }) {
  const { e0, E2 } = nangLuong(rs, R, h0, v0);
  const f = (h) => giaTocToaDo(rs, R, h0, e0, E2, h);
  const dt = tMax / soBuoc;
  const T = [0], Hh = [h0], V = [v0];
  let t = 0, h = h0, v = v0, hDinh = h0, tDinh = 0, cham = false, ra = false;
  for (let i = 0; i < soBuoc; i++) {
    const k1h = v, k1v = f(h);
    const k2h = v + 0.5 * dt * k1v, k2v = f(h + 0.5 * dt * k1h);
    const k3h = v + 0.5 * dt * k2v, k3v = f(h + 0.5 * dt * k2h);
    const k4h = v + dt * k3v, k4v = f(h + dt * k3h);
    const hm = h + (dt / 6) * (k1h + 2 * k2h + 2 * k3h + k4h);
    const vm = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    if (v > 0 && vm <= 0) tDinh = t + (v / (v - vm)) * dt;     // lúc lên tới đỉnh (nội suy theo v)
    if (hm < 0 && (vm < 0 || h > 0)) {
      const u = h / (h - hm);              // nội suy tuyến tính tới lúc chạm đất
      t += u * dt; h = 0; v = v + u * (vm - v);
      T.push(t); Hh.push(0); V.push(v);
      cham = true; break;
    }
    t += dt; h = hm; v = vm;
    if (h > hDinh) hDinh = h;
    T.push(t); Hh.push(h); V.push(v);
    if (h > hMax) { ra = true; break; }
  }
  return { t: T, h: Hh, v: V, cham, ra, tBay: cham ? t : NaN, hDinhSo: hDinh, tDinh, e0, E2 };
}

// Độ cao đỉnh từ phương trình năng lượng (W = 0): rs·(1/r0 − 1/rDinh) = e0. Infinity nếu thoát.
export function hDinhNangLuong(rs, R, h0, e0) {
  const r0 = R + h0;
  const nghich = 1 / r0 - e0 / rs;
  if (nghich <= 0) return Infinity;
  // r − r0 = r0·x/(1 − x), x = e0·r0/rs   (dạng không mất chữ số)
  const x = (e0 * r0) / rs;
  return h0 + (r0 * x) / (1 - x);
}

// Thời gian bay (lên rồi về lại h0) từ phương trình năng lượng, ném từ h0 và rơi về h0.
//   dt/dr = E/(A·√W),  W = rs·(rD − r)/(r·rD)
// Đổi biến r = rD − (rD − r0)·u² cho hết điểm kỳ dị ở đỉnh, rồi tích phân Gauss–Legendre.
// newton = true: cùng tích phân đó cho cơ học Newton (E/A thay bằng 1, rs = 2GM/c²), dùng để so.
export function thoiGianBayNangLuong(rs, R, h0, e0, E2, n = 64, newton = false) {
  const hD = hDinhNangLuong(rs, R, h0, e0);
  if (!isFinite(hD)) return Infinity;
  const r0 = R + h0, rD = R + hD, D = hD - h0;
  const E = Math.sqrt(E2);
  let s = 0;
  const [x, w] = gaussLegendre(n);
  for (let i = 0; i < n; i++) {
    const u = 0.5 * (x[i] + 1);
    const hh = hD - D * u * u, r = R + hh;
    const A = 1 - rs / R + psiH(rs, R, hh);
    s += 0.5 * w[i] * (newton ? 2 : (2 * E) / A) * Math.sqrt((D * r * rD) / rs);
  }
  return 2 * s;
}

let _gl = null;
function gaussLegendre(n) {
  if (_gl && _gl[0].length === n) return _gl;
  const x = new Float64Array(n), w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5)), pp = 0;
    for (let it = 0; it < 100; it++) {
      let p1 = 1, p2 = 0;
      for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
      pp = (n * (z * p1 - p2)) / (z * z - 1);
      const z1 = z; z = z1 - p1 / pp;
      if (Math.abs(z - z1) < 1e-15) break;
    }
    x[i] = z; w[i] = 2 / ((1 - z * z) * pp * pp);
  }
  _gl = [x, w];
  return _gl;
}

// Đại lượng Clairaut của một đường trên mặt tròn xoay, tham số t:
//   C = a²·φ̇ / √((b·ṙ/Θ)² + a²·φ̇²),  φ̇ = 1/T0.
// Trên đường trắc địa của mặt, C không đổi.
export function clairaut(mat, h, v) {
  const a = mat.a(h), phiDot = 1 / mat.T0, l = (mat.b(h) * v) / mat.Theta;
  return (a * a * phiDot) / Math.sqrt(l * l + a * a * phiDot * phiDot);
}

// Tốc độ dr/dt (c = 1) ứng với tốc độ đo tại chỗ bởi người đứng yên ở đó: v_tại chỗ = (dr/dt)/A.
export const vToaDoTuTaiCho = (rs, R, h, beta) => (1 - rs / R + psiH(rs, R, h)) * beta;

// Gia tốc riêng của người đứng yên ở độ cao h (lực mặt đất phải đẩy, chia cho khối lượng), c = 1:
//   g = (rs/(2r²)) / √A.  Trường yếu: g ≈ GM/r².
export function giaTocDungYen(rs, R, h) {
  const r = R + h, A = 1 - rs / R + psiH(rs, R, h);
  return rs / (2 * r * r) / Math.sqrt(A);
}

// Cơ học Newton cho cùng phép ném (để so): độ cao đỉnh h = v²/(2g) với g đều, hoặc với trường 1/r²:
//   1/rĐỉnh = 1/R − v²/(2GM)  (GM = rs/2 khi c = 1).
export function hDinhNewton(rs, R, v) {
  const nghich = 1 / R - (v * v) / rs;
  return nghich <= 0 ? Infinity : (R * (v * v * R / rs)) / (1 - (v * v * R) / rs);
}
