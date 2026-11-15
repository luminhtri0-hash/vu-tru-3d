import {kiem,kiemDung,tongKet} from './khung-kiem.mjs';
import {tuongQuan,xacSuatCung,chsh,layCap,layCapAn,tuongQuanAn,chshVoi,saiSoE} from '../src/vat-ly/vuong-viu-bell.js';
import {taoNgauNhien} from '../src/khung/ve.js';
for(const [b,e] of [[0,-1],[45,-1/Math.sqrt(2)],[90,0],[120,.5],[180,1]]){
 kiem('Tương quan singlet góc '+b,tuongQuan(0,b),e,1e-12);
 kiem('Xác suất cùng dấu',xacSuatCung(0,b),(1+e)/2,1e-12);
 let aPlus=0,bPlus=0,ab=0;
 for(let i=0;i<2;i++)for(let j=0;j<2000;j++){
   const u=[(i+.5)/2,(j+.5)/2000];const [x,y]=layCap(0,b,()=>u.shift());
   aPlus+=x>0;bPlus+=y>0;ab+=x*y;
 }
 kiem('Biên A',aPlus/4000,.5,1e-12);kiem('Biên B',bPlus/4000,.5,1e-12);kiem('Mô phỏng E',ab/4000,e,.001);
}
for(const x of [-1,1])for(const X of [-1,1])for(const y of [-1,1])for(const Y of [-1,1])kiemDung('Chặn cổ điển',Math.abs(x*(y+Y)+X*(y-Y))===2);
kiem('CHSH tối ưu',Math.abs(chsh(45)),2*Math.SQRT2,1e-12);
kiem('Trục B trùng',Math.abs(chsh(0)),2,1e-12);
for(let b=-180;b<=180;b++)kiemDung('Giới hạn lượng tử góc '+b,Math.abs(chsh(b))<=2*Math.SQRT2+1e-12);
// Nguồn biến ẩn cục bộ của mô hình: lấy mẫu λ đều phải ra đúng công thức tuyến tính, và |S| không vượt 2.
for(const b of [0,30,45,90,135,180]){let t=0;const n=36000;for(let i=0;i<n;i++){const [x,y]=layCapAn(0,b,(i+.5)/100);t+=x*y;}
  kiem('Biến ẩn: E lấy mẫu ở '+b+'°',t/n,tuongQuanAn(0,b),2e-3);}
kiem('Biến ẩn: |S| ở bộ trục tối ưu bằng đúng 2',Math.abs(chshVoi(tuongQuanAn,45)),2,1e-12);
for(let b=-180;b<=180;b++)kiemDung('Biến ẩn không vượt 2 ở '+b+'°',Math.abs(chshVoi(tuongQuanAn,b))<=2+1e-12);
kiem('chshVoi trùng chsh',chshVoi(tuongQuan,30),chsh(30),1e-12);
// Chế độ «bốn cách» của cảnh: mỗi cặp chọn ngẫu nhiên một trong bốn tổ hợp, S tính từ số đếm.
{const rng=taoNgauNhien(11),G=[[0,90],[45,-45]],N=[0,0,0,0],T=[0,0,0,0],TH=[[0,0],[0,1],[1,0],[1,1]];
 for(let i=0;i<400000;i++){const k=Math.floor(rng()*4),[x,y]=layCap(G[0][TH[k][0]],G[1][TH[k][1]],rng);N[k]++;T[k]+=x*y;}
 const E=T.map((t,k)=>t/N[k]),S=E[0]+E[1]+E[2]-E[3],e=Math.sqrt(E.reduce((s,v,k)=>s+saiSoE(v,N[k])**2,0));
 kiem('S đếm được ở bộ trục tối ưu',Math.abs(S),2*Math.SQRT2,4*e);}
kiem('Sai số E',saiSoE(0,100),.1,1e-12);
// Số liệu lịch sử ghi trong Bước 8 (Aspect 1982: 2,697 ± 0,015; Delft 2015: 2,42 ± 0,20) đều vượt 2 nhưng dưới 2√2.
for(const [s,e] of [[2.697,.015],[2.42,.2]])kiemDung('Số liệu thí nghiệm '+s+' nằm giữa 2 và 2√2',s-2>2*e&&s<2*Math.SQRT2);
tongKet();
