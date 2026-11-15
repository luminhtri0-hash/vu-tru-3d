// x bằng nm, p bằng ℏ/nm và tích theo đơn vị ℏ; thời gian bằng fs.
export const rongP=(s,C)=> Math.hypot(1,C)/(2*s);
export const gauss=(q,mu,s)=>Math.exp(-0.5*((q-mu)/s)**2)/(Math.sqrt(2*Math.PI)*s);
// ℏ/mₑ theo nm²/fs (h đúng theo SI; mₑ = 9,109 383 7139 × 10⁻³¹ kg, CODATA 2022).
export const HBAR_M=(6.62607015e-34/(2*Math.PI))/9.1093837139e-31*1e18/1e15;
// Gói Gauss ψ ∝ exp[−(1 − iC)(x − x₀)²/(4σ²) + ip₀x/ℏ] của electron trôi tự do trong thời gian t.
// Độ rộng động lượng không đổi; σx² = σ² + (ℏ/m)Ct + (σv t)²; hệ số pha mới C(t) = C + 2σk²(ℏ/m)t.
export function troiTuDo(s,C,x0,p0,t){
  const sk=rongP(s,C),D=HBAR_M;
  return {sx:Math.sqrt(s*s+D*C*t+(D*sk*t)**2),c:C+2*sk*sk*D*t,x0:x0+D*p0*t,sp:sk};
}
