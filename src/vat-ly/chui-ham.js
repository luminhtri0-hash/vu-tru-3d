// Electron tự do ngoài rào. E, U bằng eV, a và x bằng nm, ℏ²/(2m) bằng eV nm².
export const HE_SO_DONG=(6.62607015e-34/(2*Math.PI))**2/(2*9.1093837139e-31)/1.602176634e-19*1e18;
export function tinhRao(E,U,a) {
  const k=Math.sqrt(E/HE_SO_DONG),kappa=Math.sqrt((U-E)/HE_SO_DONG);
  const c=Math.cosh(kappa*a),s=Math.sinh(kappa*a);
  const T=1/(1+ U**2*s**2/(4*E*(U-E)));
  return {k,kappa,c,s,a,T};
}
export function matDoRao(x,{k,kappa,c,s,a,T}) {
  if(x>=a)return T;
  if(x>=0){const l=a-x;return T*(Math.cosh(kappa*l)**2+(k/kappa*Math.sinh(kappa*l))**2);}
  // Truyền ngược nghiệm từ mặt phải: ψ(a)=t, ψ′(a)=ikt.
  const C=Math.cos(k*x),S=Math.sin(k*x);
  return T*((c*C-kappa/k*s*S)**2+(-k/kappa*s*C+c*S)**2);
}

// Gần đúng rào dày (κa ≫ 1): sinh(κa) ≈ e^{κa}/2 nên T ≈ 16E(U − E)/U² · e^{−2κa}.
export function tGanDung(E,U,a){const kappa=Math.sqrt((U-E)/HE_SO_DONG);return 16*E*(U-E)/(U*U)*Math.exp(-2*kappa*a);}
