import {rongP,gauss,HBAR_M,troiTuDo} from '../src/vat-ly/bat-dinh.js';
import {kiem,kiemDung,muc,tongKet} from './khung-kiem.mjs';
muc('1. Mật độ Gauss và giới hạn bất định');
for(const s of [.35,.5,1,1.5,1.8])for(const c of [-2,-1,0,1,2]){
 const p=rongP(s,c);kiemDung('Bất đẳng thức',s*p>=.5-1e-14);kiem('Đổi dấu pha',p,rongP(s,-c),1e-12);
 const mu=.7,dx=20*s/4000;let t=0,v=0,mean=0;for(let i=0;i<4000;i++){const x=mu-10*s+dx*(i+.5),a=gauss(x,mu,s)*dx;t+=a;mean+=x*a;v+=(x-mu)**2*a;}
 kiem('Chuẩn hóa',t,1,1e-10);kiem('Tâm',mean,mu,1e-10);kiem('Phương sai',v,s*s,1e-10);
}
kiem('Gói 1 nm',rongP(1,0),.5,1e-12);kiem('Hẹp một nửa',rongP(.5,0),1,1e-12);
kiem('Pha bậc hai',rongP(1,1),Math.sqrt(2)/2,1e-12);

// Kiểm độc lập: biến đổi Fourier số của hàm sóng có pha bậc hai và pha tuyến tính,
// rồi cho trôi tự do bằng thừa số pha exp(−i(ℏ/m)k²t/2) trong không gian số sóng.
muc('2. Biến đổi Fourier số và trôi tự do');
function boSong(s,C,x0,p0){
  const N=700,L=40,dx=L/N,xs=[],re=[],im=[];
  for(let i=0;i<N;i++){const x=-L/2+dx*(i+.5),u=x-x0,bien=Math.exp(-u*u/(4*s*s)),pha=C*u*u/(4*s*s)+p0*x;
    xs.push(x);re.push(bien*Math.cos(pha));im.push(bien*Math.sin(pha));}
  return {xs,re,im,dx};
}
function moment(q,w){let t=0,m=0;for(let i=0;i<q.length;i++){t+=w[i];m+=q[i]*w[i];}m/=t;let v=0;for(let i=0;i<q.length;i++)v+=(q[i]-m)**2*w[i];return [m,Math.sqrt(v/t)];}
function pho(b,ks){return ks.map(k=>{let r=0,i=0;for(let j=0;j<b.xs.length;j++){const c=Math.cos(k*b.xs[j]),s=Math.sin(k*b.xs[j]);r+=b.re[j]*c+b.im[j]*s;i+=b.im[j]*c-b.re[j]*s;}return [r*b.dx,i*b.dx];});}
for(const [s,C,x0,p0] of [[1,0,0,0],[.5,1,.4,0],[1.5,-2,0,.6],[.8,.5,-.3,-.4]]){
  const b=boSong(s,C,x0,p0),N=500,K=16,dk=K/N,ks=Array.from({length:N},(_,i)=>-K/2+dk*(i+.5));
  const phi=pho(b,ks),[pm,pw]=moment(ks,phi.map(([r,i])=>r*r+i*i));
  kiem(`σp số (σx=${s}, C=${C})`,pw,rongP(s,C),1e-6);kiem('Tâm p số',pm,p0,1e-6);
  for(const t of [0,8,25]){
    const xs=Array.from({length:600},(_,i)=>-30+60*(i+.5)/600);
    const w=xs.map(x=>{let r=0,im=0;for(let j=0;j<N;j++){const k=ks[j],ph=k*x-HBAR_M*k*k*t/2,c=Math.cos(ph),sn=Math.sin(ph);
      r+=phi[j][0]*c-phi[j][1]*sn;im+=phi[j][0]*sn+phi[j][1]*c;}return r*r+im*im;});
    const [xm,xw]=moment(xs,w),d=troiTuDo(s,C,x0,p0,t);
    kiem(`σx(t=${t} fs) số`,xw,d.sx,2e-4*d.sx);kiem(`Tâm x(t=${t} fs)`,xm,d.x0,1e-4);
    kiem('Tích theo C(t)',d.sx*d.sp,Math.hypot(1,d.c)/2,1e-12);
  }
}
muc('3. Con số trong lời giảng');
kiem('ℏ/mₑ (nm²/fs)',HBAR_M,.115767636,1e-8);
kiem('σv khi σx = 1 nm (km/s)',HBAR_M*rongP(1,0)*1e6/1e3,57.88,.01);
kiem('Gói 1 nm: τ = 1 sau (fs)',2/HBAR_M,17.28,.01);
kiem('Gói 1 nm gấp đôi sau (fs)',2*Math.sqrt(3)/HBAR_M,29.92,.01);
kiem('σx(30 fs) khi σ₀ = 1 nm',troiTuDo(1,0,0,0,29.92).sx,2,1e-3);
kiem('Gói 0,5 nm: τ = 1 sau (fs)',2*.25/HBAR_M,4.32,.01);
kiem('σx(40 fs) khi σ₀ = 1 nm',troiTuDo(1,0,0,0,40).sx,2.52,.01);
kiemDung('C < 0 làm gói hẹp lại trước',troiTuDo(1,-2,0,0,10).sx<1);
tongKet();
