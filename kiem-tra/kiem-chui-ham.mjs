import {HE_SO_DONG,tinhRao,matDoRao,tGanDung} from '../src/vat-ly/chui-ham.js';
import {kiem,kiemDung,tongKet} from './khung-kiem.mjs';
kiem('ℏ²/(2mₑ) theo eV nm²',HE_SO_DONG,.0380998212,1e-9);
for(const a of [0,.1,.2,.3,.4,.5])for(const E of [.7,2,3]){
 const ts=tinhRao(E,4,a);kiemDung('T, R hợp lệ',ts.T>0&&ts.T<=1);kiem('Liên tục trái',matDoRao(-1e-8,ts),matDoRao(0,ts),3e-6);
 kiem('Liên tục phải',matDoRao(a-1e-8,ts),matDoRao(a,ts),3e-6);kiem('Mật độ ra',matDoRao(a+1,ts),ts.T,1e-14);
 const lo=(1-Math.sqrt(1-ts.T))**2,hi=(1+Math.sqrt(1-ts.T))**2;
 kiemDung('Giao thoa trong biên Fresnel',Array.from({length:50},(_,i)=>matDoRao(-i*.017,ts)).every(v=>v>=lo-1e-10&&v<=hi+1e-10));
}
kiem('Bỏ rào',tinhRao(2,4,0).T,1,1e-14);kiem('Ví dụ 19,8%',tinhRao(2,4,.2).T,.198,1e-4);
kiem('Dấu đích 1',tinhRao(2,4,.4).T,.01208,1e-4);kiemDung('T giảm khi tăng U',tinhRao(2,6,.2).T<tinhRao(2,4,.2).T);
// Con số ở Bước 2 và Bước 8: κ, gần đúng rào dày và ví dụ kính hiển vi quét chui hầm.
kiem('κ khi E = 2, U = 4 eV (nm⁻¹)',tinhRao(2,4,.2).kappa,7.245,.001);kiem('1/κ (nm)',1/tinhRao(2,4,.2).kappa,.138,.0005);
kiem('Gần đúng a = 0,4 nm',tGanDung(2,4,.4),.0122,.00005);kiem('Đúng a = 0,4 nm',tinhRao(2,4,.4).T,.0121,.00005);
kiem('Gần đúng a = 0,1 nm',tGanDung(2,4,.1),.94,.005);kiem('Đúng a = 0,1 nm',tinhRao(2,4,.1).T,.62,.005);
kiemDung('Gần đúng khớp dưới 1% khi κa ≈ 2,9',Math.abs(tGanDung(2,4,.4)/tinhRao(2,4,.4).T-1)<.01);
for(const a of [.6,.8,1])kiem('Gần đúng tiệm cận đúng, a = '+a,tGanDung(2,4,a)/tinhRao(2,4,a).T,1,.002);
const kSTM=Math.sqrt(4.5/HE_SO_DONG);kiem('κ khi rào 4,5 eV (nm⁻¹)',kSTM,10.87,.01);kiem('Dòng giảm khi khe rộng thêm 0,1 nm',Math.exp(2*kSTM*.1),8.8,.05);
tongKet();
