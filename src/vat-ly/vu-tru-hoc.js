// Vũ trụ học: phương trình Friedmann cho vũ trụ đồng nhất và đẳng hướng.
//
//   (ȧ/a)² = H0² [ Ωr/a⁴ + Ωm/a³ + Ωk/a² + ΩΛ ],   Ωk = 1 − Ωr − Ωm − ΩΛ
//   ä/a   = −H0² [ Ωr/a⁴ + Ωm/(2a³) − ΩΛ ]
//
// a(t) là hệ số tỉ lệ (hôm nay a = 1). Thời gian tính bằng tỉ năm (Gyr).

export const GYR_TREN_H0 = 977.7922216807891; // 1/H0 [Gyr] = 977,79 / H0 [km/s/Mpc]

// Mô hình chuẩn ΛCDM theo Planck 2018 (TT,TE,EE+lowE+lensing): H0 = 67,4; Ωm = 0,315; tuổi 13,8 tỉ năm.
export const PLANCK = { H0: 67.4, Om: 0.315, OL: 0.685, Or: 9.2e-5 };

// Tích phân lịch sử giãn nở. Trả về bảng (t, a) với t = 0 là hôm nay.
// tSau: tích phân tới bao nhiêu tỉ năm sau hôm nay.
export function lichSuGianNo({ H0 = 67.4, Om = 0.315, OL = 0.685, Or = 9.2e-5 } = {}, { tSau = 60, aMin = 2e-4 } = {}) {
  const h = H0 / GYR_TREN_H0; // 1/Gyr
  const Ok = 1 - Or - Om - OL;
  const gia = (a) => -h * h * (Or / (a * a * a) + (0.5 * Om) / (a * a) - OL * a);
  const buoc = (s, dt) => {
    const a1 = s.a, v1 = s.v, g1 = gia(a1);
    const a2 = a1 + 0.5 * dt * v1, v2 = v1 + 0.5 * dt * g1, g2 = gia(a2);
    const a3 = a1 + 0.5 * dt * v2, v3 = v1 + 0.5 * dt * g2, g3 = gia(a3);
    const a4 = a1 + dt * v3, v4 = v1 + dt * g3, g4 = gia(a4);
    s.a = a1 + (dt / 6) * (v1 + 2 * v2 + 2 * v3 + v4);
    s.v = v1 + (dt / 6) * (g1 + 2 * g2 + 2 * g3 + g4);
    s.t += dt;
  };
  // Lùi về quá khứ từ hôm nay (a = 1, ȧ = H0).
  const truoc = [];
  let s = { a: 1, v: h, t: 0 };
  let coVuNo = true;
  for (let i = 0; i < 200000 && s.a > aMin; i++) {
    const dt = -Math.min(0.02, (0.004 * s.a) / Math.max(1e-9, Math.abs(s.v)));
    const cu = { ...s };
    buoc(s, dt);
    if (!(s.a > 0) || s.v <= 0) { s = cu; coVuNo = s.a <= aMin * 5; break; } // vũ trụ "bật nảy": không có Vụ Nổ Lớn
    truoc.push({ t: s.t, a: s.a });
    if (s.t < -200) { coVuNo = false; break; }
  }
  // Đoạn cuối sát a = 0: bức xạ + vật chất trội, t ≈ ∫ a da / (H0 √(Ωr + Ωm a)).
  let tVuNo = s.t;
  if (coVuNo) {
    const a = s.a;
    const dtCuoi = Or > 0
      ? (2 / (3 * h * Om * Om)) * ((Om * a - 2 * Or) * Math.sqrt(Or + Om * a) + 2 * Math.pow(Or, 1.5))
      : (2 / (3 * h)) * Math.pow(a, 1.5) / Math.sqrt(Om);
    tVuNo = s.t - (isFinite(dtCuoi) ? dtCuoi : 0);
    truoc.push({ t: tVuNo, a: 0 });
  }
  // Tiến tới tương lai.
  const sau = [];
  s = { a: 1, v: h, t: 0 };
  let coLai = false;
  for (let i = 0; i < 400000 && s.t < tSau; i++) {
    const dt = Math.min(0.02, (0.004 * s.a) / Math.max(1e-9, Math.abs(s.v)) + 1e-4);
    buoc(s, dt);
    if (!(s.a > aMin)) { coLai = true; sau.push({ t: s.t, a: 0 }); break; }
    if (s.a > 1e4) break;
    sau.push({ t: s.t, a: s.a });
  }
  const bang = truoc.reverse().concat([{ t: 0, a: 1 }], sau);
  const tuoi = -tVuNo;
  const ts = bang.map((k) => k.t), as = bang.map((k) => k.a);
  // Nội suy tuyến tính a(t) với t tính từ hôm nay (Gyr).
  const aTai = (t) => {
    if (t <= ts[0]) return as[0];
    if (t >= ts[ts.length - 1]) return as[as.length - 1];
    let lo = 0, hi = ts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
    const u = (t - ts[lo]) / (ts[hi] - ts[lo]);
    return as[lo] + u * (as[hi] - as[lo]);
  };
  const H = (a) => H0 * Math.sqrt(Math.max(0, Or / a ** 4 + Om / a ** 3 + Ok / (a * a) + OL)); // km/s/Mpc
  return {
    bang, ts, as, aTai, H, tuoi, coVuNo, coLai, Ok,
    tDau: ts[0], tCuoi: ts[ts.length - 1],
    // a tại đó giãn nở chuyển từ chậm dần sang nhanh dần (ä = 0), nếu có
    aTangToc: OL > 0 && Om > 0 ? Math.cbrt(Om / (2 * OL)) : null,
  };
}

// Nghiệm giải tích cho vũ trụ phẳng chỉ có vật chất + hằng số vũ trụ (dùng để kiểm phép tích phân).
export function tuoiPhangGiaiTich(H0, Om) {
  const OL = 1 - Om;
  return (GYR_TREN_H0 / H0) * (2 / (3 * Math.sqrt(OL))) * Math.asinh(Math.sqrt(OL / Om));
}
