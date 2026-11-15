// u = r/a₀. P(u) là mật độ xác suất đối với du.
export function xuyenTam(u,k) {
  if(u<0)return 0;
  if(k==='1s')return 4*u*u*Math.exp(-2*u);
  if(k==='2s')return u*u*(2-u)**2*Math.exp(-u)/8;
  return u**4*Math.exp(-u)/24;
}
export function trungBinhR(k){return k==='1s'?1.5:k==='2s'?6:5;}
// Đề xuất 2s bằng hỗn hợp Gamma(3,1) và Gamma(5,1) với tỉ trọng 1:3.
function gamma(ngau,so,rate){let r=0;for(let j=0;j<so;j++)r-=Math.log(1-ngau());return r/rate;}
export function banKinhMau(ngau,k){
  if(k==='1s')return gamma(ngau,3,2);
  if(k==='2p')return gamma(ngau,5,1);
  for(;;){const u=gamma(ngau,ngau()<.25?3:5,1);if(ngau()<(u-2)**2/(4+u*u))return u;}
}
export function cosGocMau(q,k){return k==='2p'?Math.cbrt(2*q-1):2*q-1;}

// Hằng số SI (h, e đúng theo định nghĩa; mₑ, ε₀ theo CODATA 2022). Hạt nhân coi là đứng yên.
const H=6.62607015e-34,HBAR=H/(2*Math.PI),QE=1.602176634e-19,ME=9.1093837139e-31,EPS0=8.8541878188e-12;
export const BAN_KINH_BOHR_NM=4*Math.PI*EPS0*HBAR**2/(ME*QE**2)*1e9;
export const E1_EV=-ME*QE**4/(2*(4*Math.PI*EPS0)**2*HBAR**2)/QE;
export const nangLuong=(n)=>E1_EV/(n*n);
