import { kiem, kiemDung, tongKet } from './khung-kiem.mjs';
import { xacSuatCong, giaTriTrungBinh, saiSoChuan } from '../src/vat-ly/spin-stern-gerlach.js';
import { taoNgauNhien } from '../src/khung/ve.js';
for (const [theta,p] of [[0,1],[60,.75],[90,.5],[120,.25],[180,0]]) {
  kiem('Xác suất ở góc '+theta,xacSuatCong(theta),p,1e-12);
  kiem('Đảo trạng thái',xacSuatCong(theta,-1),1-p,1e-12);
  kiem('Hỗn hợp không phân cực',xacSuatCong(theta,0),.5,1e-12);
  kiem('Trung bình đơn vị ħ',giaTriTrungBinh(theta),(p-(1-p))/2,1e-12);
}
for(let theta=0;theta<=180;theta++) {
  kiemDung('Miền và chuẩn hóa '+theta,Math.abs(xacSuatCong(theta)-Math.cos(theta*Math.PI/360)**2)<1e-12);
}
// Sai số chuẩn nêu ở Bước 8: N = 100, f = 0,5 cho 0,05; đếm gấp bốn thì sai số còn một nửa.
kiem('Sai số chuẩn N = 100',saiSoChuan(.5,100),.05,1e-12);
kiem('Đếm gấp bốn, sai số giảm một nửa',saiSoChuan(.5,400)/saiSoChuan(.5,100),.5,1e-12);
// Cảnh lấy mẫu từng nguyên tử như ở capNhat: hỗn hợp = mỗi nguyên tử mang +z hoặc −z ngẫu nhiên.
{const rng=taoNgauNhien(7);let cong=0,N=200000;
 for(let i=0;i<N;i++){const s=rng()<.5?1:-1;if(rng()<xacSuatCong(60,s))cong++;}
 kiem('Hỗn hợp lấy mẫu từng nguyên tử ở 60°',cong/N,.5,4*saiSoChuan(.5,N));
 let c2=0;for(let i=0;i<N;i++)if(rng()<xacSuatCong(60,1))c2++;
 kiem('Nguồn +z lấy mẫu ở 60°',c2/N,.75,4*saiSoChuan(.75,N));}
tongKet();
