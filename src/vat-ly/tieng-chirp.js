// Mô hình «chiếu chậm» của Bài 17 và cách quy đổi tín hiệu sóng hấp dẫn thành tiếng nghe được.
// Hàm thuần: không đụng tới three.js hay WebAudio, để bộ kiểm số (kiem-tra/kiem-song-va-gian-no.mjs) kiểm được.
//
// Mô hình trên hình: hai vật xoắn vào theo công thức tứ cực (xem song-hap-dan.js), nhưng chiếu chậm sao cho
// 14 giây trên hình là đoạn cuối của tín hiệu thật. Gọi τ là thời gian TRÊN HÌNH còn lại tới lúc sáp nhập.
//   Tốc độ góc quỹ đạo trên hình:   ω_h(τ) = AV·τ^(−3/8)          (AV chọn để lúc τ = 14 thì ω_h = 1,5 rad/s)
//   Tốc độ góc thật:                Ω(τ_t) = A·τ_t^(−3/8),  A = [(256/5)(G·Mc/c³)^{5/3}]^(−3/8)
//   Hai cách viết khớp nhau khi     τ_t = sTL·τ,  sTL = (AV/A)^{8/5}    (1 giây trên hình = sTL giây thật)
// Công thức tứ cực chỉ đúng khi hai vật còn xa nhau. Mô hình dừng tăng tần số ở f_nhap = 2,2 × tần số sóng ở quỹ đạo
// tròn trong cùng (ISCO), giữ nguyên tới lúc chạm nhau, rồi cho lỗ đen mới «rung tắt dần» ở 0,95 f_nhap. Đoạn cuối
// này chỉ là minh hoạ (lời giảng nói rõ ở bước 5).

import { T_MAT_TROI, khoiLuongChirp } from './song-hap-dan.js';
import { GM_MAT_TROI } from './hang-so.js';

export const T0 = 14;                 // giây trên hình trước lúc sáp nhập
export const OM_DAU = 1.5;            // tốc độ góc quỹ đạo trên hình lúc τ = T0 (rad/giây)
export const AV = OM_DAU * Math.pow(T0, 0.375);
export const OM_TRAN = 11;            // trần tốc độ góc trên hình (để hình không quay loạn)
export const HE_ISCO = 2.2;           // tần số sóng lúc nhập = 2,2 × tần số sóng ở ISCO
export const RUNG_TAT = 0.42;         // thời gian tắt dần (giây trên hình) của pha rung sau khi nhập
export const RUNG_TAN_SO = 0.95;      // tần số pha rung = 0,95 × tần số lúc nhập
export const DO_TO_DINH = 0.8;        // độ to tiếng (0–1, trước mức âm chung) lúc biên độ lớn nhất, nhìn dọc trục quay

// Tần số sóng (Hz) khi hai vật ở quỹ đạo tròn trong cùng: f = 1 / (6^{3/2} π G M / c³). M theo M☉.
export function tanSoISCO(M) {
  return 1 / (Math.pow(6, 1.5) * Math.PI * M * T_MAT_TROI);
}

// Mọi thông số của mô hình chiếu chậm cho một cặp khối lượng (M☉).
export function thongSoMoHinh(m1, m2) {
  const mc = khoiLuongChirp(m1, m2), M = m1 + m2;
  const A = Math.pow((256 / 5) * Math.pow(mc * T_MAT_TROI, 5 / 3), -3 / 8);
  const sTL = Math.pow(AV / A, 1.6);
  const omMax = Math.min(OM_TRAN, Math.PI * HE_ISCO * tanSoISCO(M) * sTL);
  const tauM = Math.pow(omMax / AV, -8 / 3);               // lúc tần số chạm trần
  const phaM = -1.6 * AV * Math.pow(tauM, 0.625);
  const pha0 = phaM + omMax * tauM;                          // pha quỹ đạo đúng lúc chạm nhau
  return {
    m1, m2, M, mc, A, sTL, omMax, tauM, phaM, pha0,
    fDau: OM_DAU / (Math.PI * sTL),                          // tần số sóng thật lúc τ = T0
    fNhap: omMax / (Math.PI * sTL),                          // tần số sóng thật lúc nhập (trong mô hình)
  };
}

// Pha quỹ đạo và tốc độ góc trên hình tại thời gian còn lại τ (τ < 0: sau lúc nhập, pha của pha rung).
export function phaMoHinh(tau, ts) {
  if (tau > ts.tauM) return [-1.6 * AV * Math.pow(tau, 0.625), AV * Math.pow(tau, -0.375)];
  if (tau > 0) return [ts.phaM + ts.omMax * (ts.tauM - tau), ts.omMax];
  return [ts.pha0 + RUNG_TAN_SO * ts.omMax * -tau, RUNG_TAN_SO * ts.omMax];
}

// Tần số sóng thật (Hz) ứng với thời điểm τ trên hình.
export function tanSoThat(tau, ts) {
  if (tau <= 0) return RUNG_TAN_SO * ts.fNhap;
  return Math.min(ts.A * Math.pow(tau * ts.sTL, -3 / 8), ts.omMax / ts.sTL) / Math.PI;
}

// Biên độ sóng so với biên độ lúc nhập (0–1). Trước lúc nhập h ∝ f^{2/3}; sau đó tắt dần theo hàm mũ.
export function bienDoTuongDoi(tau, ts) {
  if (tau <= 0) return Math.exp(tau / RUNG_TAT);
  return Math.pow(tanSoThat(tau, ts) / ts.fNhap, 2 / 3);
}

// Biên độ theo hướng nhìn: cosI = cos của góc giữa hướng tới máy dò và trục quay của quỹ đạo.
//   h₊ ∝ (1 + cos²ι)/2,  h× ∝ cos ι.  Dọc trục (ι = 0): cả hai bằng 1 (phân cực tròn); trong mặt phẳng quỹ đạo
//   (ι = 90°): h₊ còn 1/2, h× = 0. Máy dò hình chữ L đặt thẳng hàng với kiểu «+» đo đúng h₊.
export function heSoHuong(cosI) {
  const c = Math.max(-1, Math.min(1, cosI));
  return { cong: (1 + c * c) / 2, cheo: c };
}

// Biến dạng ở máy dò (chưa nhân hệ số phóng đại của hình), theo pha quỹ đạo lúc phát và góc phương vị của máy dò.
export function bienDangMayDo(pha, phiMayDo, bienDo, cosI) {
  const { cong, cheo } = heSoHuong(cosI);
  const g = 2 * (pha - phiMayDo);
  return [bienDo * cong * Math.cos(g), bienDo * cheo * Math.sin(g)];
}

// Hai cánh tay vuông góc xoay một góc θ so với phương «ngang»: chênh lệch độ dài tương đối của hai cánh tay
// là h₊cos2θ + h×sin2θ (đổi trục cho ma trận biến dạng, xem bước 3).
export function chenhLechCanhTay(hp, hx, theta) {
  return hp * Math.cos(2 * theta) + hx * Math.sin(2 * theta);
}

// ---------------------------------------------------------------------------------------------------------------
// Quy đổi thành tiếng.
//
//   tần số tiếng  = f_thật(τ) × heSoCao        heSoCao = 1: đúng tần số thật; = 4: nâng hai quãng tám cho loa nhỏ
//   độ to         = DO_TO_DINH × (h/h_nhap) × hệ số hướng
//
// «Giữ cao độ»: khi mô hình chiếu chậm k lần, ta KHÔNG hạ cao độ đi k lần (35 Hz chia 73 lần là 0,5 Hz, tai không
// nghe được). Mỗi khung hình, tiếng có đúng tần số mà sóng thật có ở thời điểm tương ứng; chỉ có độ dài bị kéo ra
// k lần. Khi chạy nhanh như thật (1 giây trên hình = sTL giây thật được bù lại bằng tốc độ 1/sTL) thì cả cao độ lẫn
// nhịp đều đúng như tín hiệu thật.
// ---------------------------------------------------------------------------------------------------------------
export function quyDoiTieng(tau, ts, { heSoCao = 1, huong = 1 } = {}) {
  const f = tanSoThat(tau, ts);
  return {
    tanSoThat: f,
    tanSo: Math.min(12000, Math.max(20, f * heSoCao)),
    doTo: DO_TO_DINH * Math.max(0, Math.min(1, bienDoTuongDoi(tau, ts) * huong)),
  };
}

// Số lần chiếu chậm khi mô hình chạy ở tốc độ «×tocDo» trên thanh trượt.
export function soLanChamLai(ts, tocDo = 1) {
  return tocDo > 0 ? 1 / (ts.sTL * tocDo) : Infinity;
}

// Tốc độ trên hình cần đặt để mô hình chạy nhanh như thật (1 giây đồng hồ = 1 giây thật của tín hiệu).
export function tocDoNhuThat(ts) {
  return 1 / ts.sTL;
}

// Tổng khối lượng (M☉) để tần số lúc nhập của mô hình bằng f (Hz). Đúng khi trần OM_TRAN không chặn,
// điều luôn xảy ra vì Mc/M ≤ 0,435.
export function tongKhoiLuongChoTanSoNhap(f) {
  return HE_ISCO / (Math.pow(6, 1.5) * Math.PI * T_MAT_TROI * f);
}

// Khoảng cách hai vật (km) khi tần số sóng là f (định luật Kepler, quỹ đạo tròn). M theo M☉.
export function khoangCachKm(f, M) {
  const w = Math.PI * f;                      // tần số góc quỹ đạo = π × tần số sóng
  return Math.cbrt((GM_MAT_TROI * M) / (w * w)) / 1000;
}
