// Ném bóng thẳng đứng (Bài 10, Bản 3): quy đổi âm thanh và đích của các thử thách.
// Dùng cùng mặt nhúng của src/vat-ly/trac-dia.js. Phép kiểm: kiem-tra/kiem-trac-dia.mjs, mục «Bản 3».

// Cao độ của tiếng theo độ cao h của quả bóng: tỉ lệ thuận với nhịp đồng hồ đứng yên ở độ cao đó, phóng đại sao cho
// mặt đất là f0 và đỉnh khung hình (hMax) là 2·f0 (một quãng tám):
//   f(h) = f0·[1 + Δn(h)/Δn(hMax)],  Δn(h) = √(A(h)/A(R)) − 1 = √(1 + ψ(h)/A(R)) − 1  (độ chênh nhịp so với mặt đất).
// Không có trọng lực thì mọi đồng hồ cùng nhịp: tiếng đứng yên ở f0.
export function tanSoTheoDoCao(mat, h, { f0 = 220, trongLuc = true } = {}) {
  if (!trongLuc) return f0;
  // √(1 + ψ/A(R)) − 1 tính bằng log1p, expm1: với Trái Đất ψ/A(R) chỉ cỡ 10⁻¹⁵, trừ thẳng sẽ mất hết chữ số.
  const dn = (x) => Math.expm1(0.5 * Math.log1p(mat.psi(x) / mat.AR));
  const top = dn(mat.hMax);
  return f0 * (1 + (top > 0 ? dn(Math.min(Math.max(h, 0), mat.hMax)) / top : 0));
}

// Tốc độ đo tại chỗ (phần của c) để vật ném thẳng lên từ bán kính r0 dừng lại ở bán kính rDinh
// (metric Schwarzschild, rs = 1): A(rDinh) = A(r0)/(1 − β²).
export function betaChoDinh(r0, rDinh) {
  const A0 = 1 - 1 / r0, A1 = 1 - 1 / rDinh;
  return Math.sqrt(1 - A0 / A1);
}
