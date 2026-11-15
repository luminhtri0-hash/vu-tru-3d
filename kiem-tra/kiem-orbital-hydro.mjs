import {banKinhMau,cosGocMau,xuyenTam,trungBinhR,BAN_KINH_BOHR_NM,E1_EV,nangLuong} from '../src/vat-ly/orbital-hydro.js';
import {kiem,kiemDung,tongKet} from './khung-kiem.mjs';
let hat=88001;function ngau(){hat=(Math.imul(hat,1664525)+1013904223)>>>0;return hat/4294967296;}
for(const k of ['1s','2s','2p']){
 let tong=0,m1=0;for(let i=0;i<20000;i++){const r=(i+.5)*.002,d=xuyenTam(r,k)*.002;tong+=d;m1+=r*d;}
 kiem(k+' chuẩn hóa',tong,1,1e-8);kiem(k+' bán kính TB',m1,trungBinhR(k),1e-8);
 let t=0,g=0;for(let i=0;i<30000;i++){t+=banKinhMau(ngau,k);g+=cosGocMau(ngau(),k)**2;}
 kiem(k+' mẫu bán kính',t/30000,trungBinhR(k),.08);kiem(k+' mẫu góc',g/30000,k==='2p'?.6:1/3,.01);
}
kiem('Nút 2s',xuyenTam(2,'2s'),0,1e-15);kiemDung('Đỉnh 1s',[.95,1.05].every(r=>xuyenTam(1,'1s')>xuyenTam(r,'1s')));
kiemDung('Đỉnh 2p',[3.95,4.05].every(r=>xuyenTam(4,'2p')>xuyenTam(r,'2p')));kiem('Tỉ số năng lượng',1/2**2,.25,1e-12);
// Con số trong lời giảng: so với CODATA 2022 (a₀ = 5,291 772 105 44 × 10⁻¹¹ m; R∞hc = 13,605 693 122 990 eV).
kiem('Bán kính Bohr (nm)',BAN_KINH_BOHR_NM,.0529177210544,1e-12);kiem('E₁ (eV)',E1_EV,-13.605693122990,1e-8);
kiem('E₂ (eV)',nangLuong(2),-3.4014,1e-4);kiem('Photon 2p → 1s (eV)',nangLuong(2)-nangLuong(1),10.204,1e-3);
kiem('Bước sóng Lyman-alpha của mô hình (nm)',1239.84198/(nangLuong(2)-nangLuong(1)),121.5,.1);
// Số nút xuyên tâm n − l − 1: đếm số lần đổi dấu của hàm xuyên tâm (2s: 2 − u; 1s, 2p: không đổi dấu).
const doiDau=(f)=>{let d=0,t=f(.001);for(let u=.01;u<30;u+=.01){const v=f(u);if(v*t<0)d++;t=v;}return d;};
kiem('Nút 1s',doiDau(u=>Math.exp(-u)),0,0);kiem('Nút 2s',doiDau(u=>(2-u)*Math.exp(-u/2)),1,0);kiem('Nút 2p',doiDau(u=>u*Math.exp(-u/2)),0,0);
tongKet();
