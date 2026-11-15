import {kiem,kiemDung,tongKet} from './khung-kiem.mjs';
import {psiHop,rhoHop,nangHop,xacSuatHop,mauHop,E1_THAM_CHIEU_EV,heSoPha} from '../src/vat-ly/hat-trong-hop.js';
for(const L of [.65,1,2])for(let n=1;n<=5;n++){
  kiem('Biên trái',psiHop(0,n,L),0,1e-12);kiem('Biên phải',psiHop(1,n,L),0,1e-12);
  let t=0;for(let i=0;i<1000;i++)t+=rhoHop((i+.5)/1000,n,L)*L/1000;
  kiem('Chuẩn hóa',t,1,1e-9);kiem('Xác suất nửa hộp',xacSuatHop(.5,n),.5,1e-12);
  for(const q of [.01,.25,.75,.99])kiem('Đảo hàm phân bố',xacSuatHop(mauHop(q,n),n),q,.00004);
  kiem('Đổi bề rộng',nangHop(n,2*L)/nangHop(n,L),.25,1e-12);
}
kiem('Nút n=2',rhoHop(.5,2,1),0,1e-12);kiem('Nút n=3',rhoHop(1/3,3,1),0,1e-12);
kiemDung('Dãy năng lượng', [1,2,3].map(n=>nangHop(n,1)).join(',')==='1,4,9');
kiem('E₁ của electron trong hộp 1 nm (eV)',E1_THAM_CHIEU_EV,0.37603,0.00001);
kiem('E₂ ≈ 1,50 eV',4*E1_THAM_CHIEU_EV,1.504,0.001);kiem('E₃ ≈ 3,38 eV',9*E1_THAM_CHIEU_EV,3.384,0.001);
// Pha chung không đổi mật độ: |ψ cos ωt|² chỉ là phần thực; mật độ |ψ e^{-iωt}|² = |ψ|² ở mọi t.
for(const t of [0,.3,1.7])kiem('Mật độ không đổi theo pha',rhoHop(.27,3,1)*(heSoPha(3,1,t)**2+Math.sin(9*t)**2),rhoHop(.27,3,1),1e-12);
kiem('Mức 3 quay pha nhanh gấp 9 lần',Math.acos(heSoPha(3,1,0.1)),0.9,1e-12);
tongKet();
