// u = x/L. Độ dài tính bằng nm. Mức tham chiếu: n = 1, L = 1 nm.
export const psiHop = (u,n,L) => Math.sqrt(2/L)*Math.sin(n*Math.PI*u);
export const rhoHop = (u,n,L) => psiHop(u,n,L)**2;
export const nangHop = (n,L) => (n/L)**2;
export const xacSuatHop = (u,n) => u-Math.sin(2*n*Math.PI*u)/(2*n*Math.PI);
export function mauHop(q,n) {
  let a=0,b=1;
  for(let i=0;i<15;i++) {
    const u=(a+b)/2;
    if(xacSuatHop(u,n)<q)a=u;else b=u;
  }
  return (a+b)/2;
}
// Mức cơ bản của electron trong hộp rộng 1 nm, tính bằng eV (h, e chính xác theo định nghĩa SI; mₑ theo CODATA 2022).
const H_SI = 6.62607015e-34, E_SI = 1.602176634e-19, ME_SI = 9.1093837139e-31;
export const E1_THAM_CHIEU_EV = H_SI ** 2 / (8 * ME_SI * 1e-18) / E_SI;
// Pha theo thời gian của trạng thái riêng: phần thực của ψ·e^{-iEt/ħ} = ψ·cos(ω t), ω tỉ lệ với E_n.
export const heSoPha = (n, L, t, omega1 = 1) => Math.cos(omega1 * nangHop(n, L) * t);
