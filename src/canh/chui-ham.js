import * as THREE from 'three';
import loi from '../noi-dung/chui-ham.js';
import goc from '../ngon-ngu/vi/chui-ham.json' with {type:'json'};
import {banVe,gocBan,chuCuaBai,ghepBuoc} from './ban-do-luong-tu.js';
import {taoNgauNhien,kep} from '../khung/ve.js';
import {so} from '../vat-ly/hang-so.js';
import {tinhRao,matDoRao,tGanDung} from '../vat-ly/chui-ham.js';
const id='chui-ham',chu=chuCuaBai(id,goc);
const thu=[c=>c.xoa(),c=>c.set('a',.4),c=>c.dem(100),c=>c.set('a',.1),c=>c.set('U',4),c=>c.dem(100),c=>c.set('a',.4),c=>c.set('a',.1)];
const thach={3:c=>c.dat(3),4:c=>c.dat(4),7:c=>c.dat(7)};
export default{id,...ghepBuoc(loi,thu,thach),mayAnh:{...gocBan,viTri:[3.8,5.2,10.8]},hinh:{quang:.22},nhacNen:null,
tao(app){
 const {scene,nhan,net,kim,hop}=banVe(),rand=taoNgauNhien(2503);
 const S={E:2,U:4,a:.2};let param=tinhRao(S.E,S.U,S.a);
 const X0=-.75,scaleX=5,scaleE=.38;
 const verre=new THREE.MeshStandardMaterial({color:0x9872a8,transparent:true,opacity:.53,roughness:.35,depthWrite:false});
 const bar=hop(1,1,1.42,0,0,0,verre);
 const sommet=hop(1,.06,1.48,0,1,0,kim(0xc694c1));
 const bord=hop(.065,1,1.45,0,1,0,kim(0x835f83));
 const eLine=net(0xffc66b,2,3.5),rho=net(0x63dcff,180,3);
 const tagE=nhan(chu('den'),-3.02,1.2,-.7,'vang'),tagU=nhan(chu('cao'),.3,2.6,-.15,'dam');
 nhan(chu('mat'),-2.7,2.45,1.3,'xanh');
 // Thước nm dọc theo chùm: gốc ở mặt trái của rào, để đọc bề rộng a và chiều dài suy giảm trên hình.
 for(const v of [-.6,-.4,-.2,0,.2,.4,.6,.8]){const x=X0+v*scaleX;hop(.02,.05,.22,x,-.13,-1.0,kim(0xb99a67));nhan(so(v,1),x,-.13,-1.28,'mo');}
 nhan('x (nm)',X0+.93*scaleX,-.13,-1.28,'mo');
 const det=[-2.8,2.75].map((x,j)=>{
  hop(1.7,.14,1.05,x,.04,1.76,kim(j?0x315761:0x664b40));nhan(chu(j?'truyen':'phan'),x,.08,2.42,j?'xanh':'vang');
  const a=new THREE.Float32BufferAttribute(new Float32Array(240*3),3).setUsage(THREE.DynamicDrawUsage);
  const g=new THREE.BufferGeometry();g.setAttribute('position',a);g.setDrawRange(0,0);
  const pts=new THREE.Points(g,new THREE.PointsMaterial({color:j?0x7ff4ff:0xffa665,size:.061}));pts.frustumCulled=false;scene.add(pts);return{x,a,g,count:0};});
 const dk={};let daKeoA=false,daKeoU=false,du=0,gio=0,denAm=-2;
 function xoa(){du=0;for(const d of det){d.count=0;d.g.setDrawRange(0,0);}}
 function dem(n,am=true){for(let i=0;i<n;i++){const tr=rand()<param.T?1:0,d=det[tr];
   d.a.setXYZ(d.count%240,d.x+(rand()-.5)*1.54,.14,1.76+(rand()-.5)*.86);d.count++;
   if(tr&&am&&gio-denAm>=.9){app.am.tich({tanSo:900,doTo:.18,dai:.035});denAm=gio;}}
   for(const d of det){d.a.needsUpdate=true;d.g.setDrawRange(0,Math.min(240,d.count));}}
 function set(k,v){S[k]=v;dk[k].dat(v);xoa();ve();}
 const tayA=app.tt.tayNam({viTri:[0,.22,.85],rangBuoc:{kieu:'duong',qua:[0,.22,.85],huong:[1,0,0]},mau:0x76d7e8,ten:chu('rong'),nhan:chu('rong'),
  gioiHan:p=>{p.x=kep(p.x,X0+.04*scaleX,X0+.55*scaleX);return p;},khiKeo:p=>{daKeoA=true;set('a',(p.x-X0)/scaleX);}});
 const tayU=app.tt.tayNam({viTri:[X0,1.52,-.15],rangBuoc:{kieu:'duong',qua:[X0,0,-.15],huong:[0,1,0]},mau:0xf2b86e,ten:chu('cao'),nhan:chu('cao'),
  gioiHan:p=>{p.y=kep(p.y,3.5*scaleE,7*scaleE);return p;},khiKeo:p=>{daKeoU=true;set('U',p.y/scaleE);}});
 for(const [k,lab,min,max,step,unit] of [['a','rong',.04,.55,.005,' nm'],['U','cao',3.5,7,.05,' eV'],['E','den',.7,3,.05,' eV']]){
 dk[k]=app.bang.thanhTruot({nhan:chu(lab),min,max,buoc:step,giaTri:S[k],hienThi:v=>so(v,k==='a'?3:2)+unit,khiDoi:v=>{if(k==='a')daKeoA=true;if(k==='U')daKeoU=true;set(k,v);}});}
 app.bang.nut([{nhan:chu('dem'),khiBam:()=>dem(100)},{nhan:chu('xoa'),khiBam:xoa}]);
 function ve(){param=tinhRao(S.E,S.U,S.a);const w=S.a*scaleX,h=S.U*scaleE;
  bar.scale.set(w,h,1.42);bar.position.set(X0+w/2,h/2,0);sommet.scale.x=w;sommet.position.set(X0+w/2,h,0);
  bord.scale.y=h;bord.position.set(X0+w,h/2,0);tagU.position.set(X0+w/2,h+.37,-.15);tagU.datChu('U = '+so(S.U,2)+' eV');tagE.datChu('E = '+so(S.E,2)+' eV');
  tayA.dat([X0+w,.22,.85]);tayU.dat([X0,h,-.15]);
  eLine.dat(0,-4.0,S.E*scaleE,-.75);eLine.dat(1,4.0,S.E*scaleE,-.75);eLine.xong(2);tagE.position.y=S.E*scaleE+.22;
  for(let i=0;i<180;i++){const x=-4+8*i/179;rho.dat(i,x,.17+.54*matDoRao((x-X0)/scaleX,param),.97);}rho.xong(180);}
 return{scene,set,xoa,dem,dat(i){if(i===4)return daKeoU&&Math.abs(S.E-2)<1e-6&&Math.abs(S.U-S.E-4)<.12;
  return daKeoA&&S.E===2&&S.U===4&&(i===3?Math.abs(param.T-.20)<.015:param.T<.02);},
  buoc(i){Object.assign(S,{E:2,U:4,a:i===3||i===7?.1:.2});daKeoA=daKeoU=false;for(const k in dk)dk[k].dat(S[k]);ve();xoa();dem(28,false);},
  capNhat(dt){if(dt<=0)return;gio+=dt;du+=dt*18;const n=Math.floor(du);if(n){du-=n;dem(n);}},
  hud(){const tr=det[1].count,n=det[0].count+tr;return[[chu('tin'),so(param.T,4)],[chu('truyen'),so(tr,0)],[chu('phan'),so(det[0].count,0)],[chu('thu'),n?so(tr/n,3):'—'],[chu('suy'),so(1/param.kappa,3)+' nm'],[chu('gan'),so(tGanDung(S.E,S.U,S.a),4)]];}};
}};
