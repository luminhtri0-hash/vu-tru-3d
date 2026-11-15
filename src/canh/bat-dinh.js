import * as THREE from 'three';
import loi from '../noi-dung/bat-dinh.js';
import goc from '../ngon-ngu/vi/bat-dinh.json' with {type:'json'};
import {banVe,gocBan,chuCuaBai,ghepBuoc} from './ban-do-luong-tu.js';
import {kep,taoNgauNhien} from '../khung/ve.js';
import {so} from '../vat-ly/hang-so.js';
import {gauss,troiTuDo} from '../vat-ly/bat-dinh.js';
const id='bat-dinh',chu=chuCuaBai(id,goc);
const thu=[c=>c.xoa(),c=>c.set('sx',1),c=>c.set('sx',1),c=>c.set('x0',1),c=>c.set('p0',0),c=>c.set('sx',1.75),c=>c.set('c',1),c=>c.set('c',0),c=>c.chay()];
const thach={2:c=>c.dat(2),4:c=>c.dat(4),7:c=>c.dat(7),8:c=>c.dat(8)};
const T_MAX=50;
export default{id,...ghepBuoc(loi,thu,thach),mayAnh:gocBan,hinh:{quang:.22},nhacNen:null,
tao(app){
  const {scene,hop,kim,net,nhan}=banVe(), rand=taoNgauNhien(2302);
  // S là cách chuẩn bị lúc t = 0; D là trạng thái sau thời gian trôi tự do S.t (fs).
  const S={sx:1,x0:0,p0:0,c:0,t:0};let D=troiTuDo(1,0,0,0,0);
  let keoX=false,keoP=false,keoT=false,chayT=false,tCuoi=0,N=0,du=0,gio=0,cuoi=-2;
  const bo=[[-1.18,0x75ddff],[1.15,0xffc376]].map(([z,color],k)=>{
    const vl=kim(color);hop(8.2,.07,.65,0,-.01,z,kim(0x385061));
    const moc=[-1,1].map(()=>hop(.055,.13,.4,0,.12,z,vl));
    const geo=new THREE.BufferGeometry(),a=new THREE.Float32BufferAttribute(new Float32Array(320*3),3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position',a); geo.setDrawRange(0,0);
    const p=new THREE.Points(geo,new THREE.PointsMaterial({color,size:.055}));p.frustumCulled=false;scene.add(p);
    nhan(k?'p (ℏ/nm)':'x (nm)',3.7,.45,z,k?'vang':'xanh');
    for(const v of [-3,-2,-1,0,1,2,3]){hop(.018,.09,.55,v,.05,z,vl);if(v%2===0)nhan(String(v),v,-.02,z+.45,'mo');}
    // Nhãn «±σ» đi theo dấu bên phải để người học biết hai dấu đo cái gì.
    const nhanS=nhan(k?'σp':'σx',0,.42,z-.12,k?'vang':'xanh');
    return {z,net:net(color),moc,geo,a,nhanS};});
  const dk={};
  function ve(){
    D=troiTuDo(S.sx,S.c,S.x0,S.p0,S.t);
    bo.forEach((b,k)=>{const mu=k?S.p0:D.x0,s=k?D.sp:D.sx;
      for(let i=0;i<180;i++){const q=-4+8*i/179;b.net.dat(i,q,.14+2.3*gauss(q,mu,s),b.z);}
      b.net.xong(180);b.moc[0].position.x=mu-s;b.moc[1].position.x=mu+s;
      const x=kep(mu+s,-3.6,3.6);b.nhanS.position.set(x,.46,b.z-.12);b.nhanS.visible=Math.abs(mu+s)<4;});
    tayX.dat([S.x0+S.sx,.22,bo[0].z]);tayP.dat([S.p0,.22,bo[1].z]);
    tayX.an(S.t>0);}
  function xoa(){N=0;du=0;for(const b of bo)b.geo.setDrawRange(0,0);}
  // Đổi cách chuẩn bị thì đưa đồng hồ về 0; riêng thanh thời gian chỉ cho gói trôi.
  function set(k,v){if(k!=='t'){S.t=0;chayT=false;dk.t.dat(0);}S[k]=v;dk[k].dat(v);xoa();ve();}
  const tayX=app.tt.tayNam({viTri:[1,.22,bo[0].z],rangBuoc:{kieu:'duong',qua:[0,.22,bo[0].z],huong:[1,0,0]},mau:0x77daff,nhan:chu('sx'),ten:chu('sx'),
    gioiHan:p=>{p.x=kep(p.x,S.x0+.35,S.x0+1.8);return p;},khiKeo:p=>{keoX=true;set('sx',p.x-S.x0);}});
  const tayP=app.tt.tayNam({viTri:[0,.22,bo[1].z],rangBuoc:{kieu:'duong',qua:[0,.22,bo[1].z],huong:[1,0,0]},mau:0xffc376,nhan:chu('p0'),ten:chu('p0'),
    gioiHan:p=>{p.x=kep(p.x,-1.5,1.5);return p;},khiKeo:p=>{keoP=true;set('p0',p.x);}});
  for(const [k,min,max,unit,buoc] of [['sx',.35,1.8,' nm',.01],['x0',-1.5,1.5,' nm',.01],['p0',-1.5,1.5,' ℏ/nm',.01],['c',-2,2,'',.01],['t',0,T_MAX,' fs',.1]]){
    dk[k]=app.bang.thanhTruot({nhan:chu(k),min,max,buoc,giaTri:S[k],hienThi:v=>so(v,k==='t'?1:2)+unit,
      khiDoi:v=>{if(k==='sx')keoX=true;if(k==='p0')keoP=true;if(k==='t'){keoT=true;chayT=false;}set(k,v);}});}
  app.bang.nut([{nhan:chu('mau'),khiBam:xoa},{nhan:chu('chay'),khiBam:()=>chay()}]);
  function echantillon(k){for(let i=0;i<k;i++){for(let j=0;j<2;j++){const b=bo[j],mu=j?S.p0:D.x0,s=j?D.sp:D.sx;
    const q=mu+s*rand.chuan();b.a.setXYZ(N%320,q,.09,Math.abs(q)<=4?b.z+.48+rand()*.36:-500);}
    N++;}for(const b of bo){b.a.needsUpdate=true;b.geo.setDrawRange(0,Math.min(N,320));}}
  // Thả gói trôi tự do từ cách chuẩn bị hiện tại, đồng hồ chạy 5 fs mỗi giây.
  function chay(){S.t=0;tCuoi=0;chayT=true;keoT=true;dk.t.dat(0);xoa();ve();echantillon(45);}
  return{scene,set,xoa,chay,buoc(i){Object.assign(S,{sx:1,x0:0,p0:i===4?-.65:0,c:i===7?1:0,t:0});keoX=keoP=keoT=chayT=false;for(const k in dk)dk[k].dat(S[k]);xoa();ve();echantillon(45);},
    dat(i){if(i===4)return keoP&&Math.abs(S.p0-1)<.08&&Math.abs(S.sx-1)<1e-6&&!S.t;
      if(i===8)return keoT&&Math.abs(S.sx-1)<1e-6&&!S.c&&Math.abs(D.sx-2)<.05;
      return keoX&&!S.c&&!S.t&&(i===2?Math.abs(D.sp-1)<.05:Math.abs(S.sx-1.5)<.06);},
    capNhat(dt){if(dt<=0)return;gio+=dt;
      if(chayT){S.t=Math.min(T_MAX,S.t+5*dt);dk.t.dat(S.t);ve();
        // Mỗi 1 fs đo lại hai nhóm mới, để chấm luôn thuộc trạng thái của lúc đó.
        if(S.t-tCuoi>=1||S.t>=T_MAX){tCuoi=S.t;xoa();echantillon(40);}if(S.t>=T_MAX)chayT=false;}
      du+=24*dt;const k=Math.floor(du);if(k){du-=k;echantillon(k);if(gio-cuoi>.9){app.am.tich({tanSo:680,doTo:.15});cuoi=gio;}}},
    hud(){return[[chu('sx'),so(D.sx,2)+' nm'],[chu('sp'),so(D.sp,3)+' ℏ/nm'],[chu('p0'),so(S.p0,2)+' ℏ/nm'],[chu('tich'),so(D.sp*D.sx,3)+' ℏ'],[chu('t'),so(S.t,1)+' fs'],[chu('dem'),so(N,0)]];}};
}};
