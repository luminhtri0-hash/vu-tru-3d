import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import { MAC_DINH as goc, RONG_NUA_MAN as r, khoangVan, nutBao, lechPha, bao, matDo, lapBangTichLuy, viTriHat, datThuThach } from '../src/vat-ly/hai-khe.js';
muc('Hai khe: đơn vị, pha, nhiễu xạ và mất kết hợp');
kiem('Khoảng vân từ các đơn vị SI', khoangVan(goc), 50e-12 * 1 / 200e-9 * 1000, 1e-12, ' mm');
kiem('Nút bao đầu', nutBao(goc), 1, 1e-12, ' mm');
kiem('Pha tại nửa khoảng vân', lechPha(0.125, goc), Math.PI, 1e-12);
kiem('Cùng pha tại tâm', matDo(0, goc), 1, 1e-12);
kiem('Ngược pha tại nút', matDo(0.125, goc), 0, 1e-12);
kiem('Đóng một khe còn bao', matDo(0.125, { ...goc, hai: false }), (Math.sin(Math.PI/8)/(Math.PI/8))**2, 1e-12);
kiem('Đánh dấu trực giao còn bao', matDo(0.125, { ...goc, v: 0 }), bao(0.125,goc), 1e-12);
kiem('Độ rõ giảm một phần', matDo(0.125, { ...goc, v: 0.5 }), bao(0.125,goc)/3, 1e-12);
kiem('Nút bao triệt vân bậc bốn', matDo(1,goc), 0, 1e-12);
kiem('Tăng d gấp đôi', khoangVan({ ...goc, d:400 }), 0.125, 1e-12, ' mm');
kiem('Tăng p gấp đôi', khoangVan({ ...goc, lambda:25 }), 0.125, 1e-12, ' mm');
kiem('Bề rộng bao thay đổi theo λ', nutBao({ ...goc, lambda:25 }), 0.5, 1e-12, ' mm');
kiem('Tăng số mẫu gấp bốn giảm sai số còn một nửa', Math.sqrt(0.2*0.8/400)/Math.sqrt(0.2*0.8/100), 0.5, 1e-12);
kiemDung('Không chấm thử thách mới mở', !datThuThach('toi',goc,0.125,false,false) && !datThuThach('khe',{...goc,d:400},0,false,false));
kiemDung('Kéo đầu đọc vào nút tối đúng cấu hình', datThuThach('toi',goc,0.125,false,true) && !datThuThach('toi',goc,0.15,false,true));
kiemDung('Kéo khe tới chu kỳ mới', datThuThach('khe',{...goc,d:400},0,true,false) && !datThuThach('khe',{...goc,d:300},0,true,false));
kiemDung('Tách hai dấu và kéo đầu đọc', datThuThach('dau',{...goc,v:0},0.125,false,true) && !datThuThach('dau',goc,0.125,false,true));

muc('Lấy mẫu vị trí electron trên phần màn được quan sát');
for (const ts of [goc,{...goc,d:400,lambda:25},{...goc,v:0},{...goc,hai:false}]) {
  const cdf = new Float64Array(1024);
  lapBangTichLuy(cdf,ts);
  kiemDung('Bảng tích lũy hữu hạn, không giảm', cdf.every((p,i)=>Number.isFinite(p)&&p>=0&&p<=1&&(!i||p>=cdf[i-1])));
  kiem('Tổng xác suất trong cửa sổ',cdf.at(-1),1,1e-12);
  kiem('Hai nửa màn đối xứng',cdf[511],0.5,1e-12);
  let khoangLech=0, thuHai=0, chuan=0;
  for(let i=0;i<cdf.length;i++) {
    const x=r*((2*i+1)/cdf.length-1);
    thuHai+=x*x*matDo(x,ts); chuan+=matDo(x,ts);
  }
  for(let k=0;k<8192;k++) khoangLech+=viTriHat(cdf,(k+0.5)/8192,0.5)**2/8192;
  kiem('Phương sai mẫu khớp mật độ lý thuyết',khoangLech,thuHai/chuan,0.0005);
}
tongKet();
