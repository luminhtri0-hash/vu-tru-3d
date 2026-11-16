import * as THREE from 'three';
import loi from '../noi-dung/orbital-hydro.js';
import goc from '../ngon-ngu/vi/orbital-hydro.json' with {type:'json'};
import {gocBan,chuCuaBai,ghepBuoc} from './ban-do-luong-tu.js';
import {taoBanDoThi} from '../khung/ban-thi-nghiem-luong-tu.js';
import {taoNgauNhien,kep,goNhanDeNhau} from '../khung/ve.js';
import {so} from '../vat-ly/hang-so.js';
import {banKinhMau,cosGocMau,xuyenTam,nangLuong} from '../vat-ly/orbital-hydro.js';
const id='orbital-hydro',chu=chuCuaBai(id,goc);
const thu=[c=>c.xoa(),c=>c.chon('1s'),c=>c.chon('1s'),c=>c.chon('2s'),c=>c.chon('2p'),c=>c.doiSP(),c=>c.chon('2p'),c=>c.chon('1s')];
const thach={2:c=>c.dat('1s',1,.12),3:c=>c.dat('2s',2,.12),6:c=>c.dat('2p',4,.15)};
export default {id,...ghepBuoc(loi,thu,thach),mayAnh:{...gocBan,viTri:[4.9,5.0,11.6],dich:[0.9,1.1,0],hep:.6},hinh:{quang:.27},nhacNen:null,
tao(app){
  const {scene,nhan,net,kim,hop}=taoBanDoThi(app),rand=taoNgauNhien(2435);
  const cx=-1.72,cy=1.65,donVi=.28,boDem=2200;
  const c1=new THREE.Color(0x80dfff).multiplyScalar(1.2),c2=new THREE.Color(0xffb073).multiplyScalar(1.2);
  const datHat=new THREE.Mesh(new THREE.SphereGeometry(.1,18,12),new THREE.MeshBasicMaterial({color:0xffdf95}));
  datHat.position.set(cx,cy,0);scene.add(datHat);
  app.tt.them(datHat,{ten:chu('hat'),moTa:()=> 'r = 0',noiBat:false});
  const viTri=new THREE.Float32BufferAttribute(new Float32Array(boDem*3),3).setUsage(THREE.DynamicDrawUsage);
  const mau=new THREE.Float32BufferAttribute(new Float32Array(boDem*3),3).setUsage(THREE.DynamicDrawUsage);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',viTri);geo.setAttribute('color',mau);
  const cloud=new THREE.Points(geo,new THREE.PointsMaterial({vertexColors:true,size:.042,transparent:true,opacity:.86,depthWrite:false}));
  cloud.frustumCulled=false;scene.add(cloud);
  const tron=new THREE.Mesh(new THREE.TorusGeometry(1,.009,6,96),new THREE.MeshBasicMaterial({color:0xffd172}));
  tron.position.set(cx,cy,0);tron.rotation.x=Math.PI/2;scene.add(tron);
  // Vỏ cầu thử mờ: cùng bán kính với vòng vàng, để thấy «vỏ cầu mỏng» mà phân bố bán kính đếm.
  const vo=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),new THREE.MeshBasicMaterial({color:0xffd172,transparent:true,opacity:.07,depthWrite:false}));
  vo.position.copy(tron.position);scene.add(vo);
  const truc=hop(.023,4.8,.023,cx,cy,0,kim(0x779aa9));
  const nhanTruc=nhan(chu('truc'),cx,cy+2.48,0,'mo');
  const line=net(0xffc878,180,3);
  const X0=.45,Xscale=.34,Y0=.3,Yscale=3.9;
  hop(3.65,.075,.48,2.2,Y0-.08,1.15,kim(0x527180));
  const nhanMat=nhan(chu('mat'),2.35,2.72,1.15,'vang');
  for(const u of [0,2,4,6,8,10]){hop(.018,.12,.12,X0+u*Xscale,Y0,1.15,kim(0xb99a67));nhan(u===10?'10 a₀':String(u),X0+u*Xscale,Y0-.08,1.55,'mo');}
  // Đơn vị ghi luôn vào vạch cuối (10 a₀) thay cho nhãn trục riêng, để bước có 2p không quá 12 nhãn.
  // Thang năng lượng E_n = −13,6 eV/n²: vạch n = 1…4 và mức 0 (electron vừa thoát), vạch sáng là mức đang chọn.
  const LX=2.55,LZ=-2.15,LY=(E)=>2.95+E*(2.55/13.6);
  hop(.04,2.75,.04,LX+.7,1.6,LZ,kim(0x6f8796));
  const vach=[1,2,3,4].map(n=>{const o=hop(1.2,.035,.07,LX,LY(nangLuong(n)),LZ,kim(0x6f8796));return o;});
  hop(1.2,.02,.05,LX,LY(0),LZ,kim(0x47606c));
  nhan('0 eV',LX-.95,LY(0)+.1,LZ,'mo');
  const nhanN1=nhan('n = 1 · '+so(nangLuong(1),1)+' eV',LX-1.45,LY(nangLuong(1)),LZ,'mo');
  const nhanN2=nhan('n = 2 · '+so(nangLuong(2),1)+' eV',LX-1.45,LY(nangLuong(2))-.14,LZ,'mo');
  const nhanThang=nhan(chu('thang'),LX,LY(nangLuong(1))-.32,LZ,'vang');
  // Nhãn đồ thị và thang năng lượng nằm sát nhau khi nhìn trên điện thoại: cho chúng tránh nhau, ngang hàng.
  const dsNhan=[nhanMat,nhanN1,nhanN2,nhanThang].map(o=>({nhan:o,uuTien:70}));
  const vlSang=kim(0xffc878),vlTat=vach[0].material;
  const dau=hop(.028,1.4,.06,X0,.96,1.15,kim(0xeabd83));
  let k='1s',r=.35,keo=false,n=0,du=0,gio=0,cuoi=-2;
  const dk=app.bang.chon({nhan:chu('chon'),luaChon:['1s','2s','2p'].map(x=>({giaTri:x,nhan:x})),giaTri:k,khiDoi:chon});
  const tay=app.tt.tayNam({viTri:[X0,Y0,1.15],rangBuoc:{kieu:'duong',qua:[0,Y0,1.15],huong:[1,0,0]},mau:0xffbc68,ten:chu('ban'),nhan:chu('ban'),
    gioiHan:p=>{p.x=kep(p.x,X0,X0+10*Xscale);return p;},khiKeo:p=>{keo=true;datR((p.x-X0)/Xscale);}});
  const dkR=app.bang.thanhTruot({nhan:chu('ban'),min:0,max:10,buoc:.01,giaTri:r,hienThi:x=>so(x,2)+' a₀',khiDoi:v=>{keo=true;datR(v);}});
  function datR(v){r=kep(v,0,10);dkR.dat(r);dau.position.x=X0+r*Xscale;tay.dat([dau.position.x,Y0,1.15]);tron.scale.setScalar(Math.max(.002,r*donVi));vo.scale.setScalar(Math.max(.002,r*donVi));}
  function xoa(){n=0;du=0;geo.setDrawRange(0,0);}
  function them(soHat,am=false){
    for(let j=0;j<soHat;j++){
      const rad=banKinhMau(rand,k),co=cosGocMau(rand(),k),si=Math.sqrt(1-co*co),phi=2*Math.PI*rand();
      const i=n%boDem,rr=rad*donVi;
      viTri.setXYZ(i,cx+rr*si*Math.cos(phi),cy+rr*co,rr*si*Math.sin(phi));
      const c=k==='2s'&&rad>2||k==='2p'&&co<0?c2:c1;mau.setXYZ(i,c.r,c.g,c.b);n++;
    }
    viTri.needsUpdate=true;mau.needsUpdate=true;geo.setDrawRange(0,Math.min(boDem,n));
    if(am&&gio-cuoi>=.9){app.am.tich({tanSo:620,doTo:.14});cuoi=gio;}
  }
  function chon(v){k=v;dk.dat(k);xoa();them(900);truc.visible=nhanTruc.visible=k==='2p';
    const n=k==='1s'?1:2;vach.forEach((o,i)=>{o.material=i+1===n?vlSang:vlTat;o.scale.y=i+1===n?.075:.035;});
    [nhanN1,nhanN2].forEach((o,i)=>{o.element.classList.toggle('vang',i+1===n);o.element.classList.toggle('mo',i+1!==n);});
    for(let i=0;i<180;i++){const u=10*i/179;line.dat(i,X0+u*Xscale,Y0+xuyenTam(u,k)*Yscale,1.15);}line.xong(180);}
  app.bang.nut([{nhan:chu('do'),khiBam:xoa}]);
  return{scene,chon,xoa,doiSP:()=>chon(k==='2s'?'2p':'2s'),dat:(m,v,t)=>keo&&k===m&&Math.abs(r-v)<t,
    buoc(i){keo=false;datR(.35);chon(['1s','1s','1s','2s','2p','2s','2p','2s'][i]);},
    capNhat(dt){goNhanDeNhau(dsNhan.slice(),app.camera,app.rong,app.cao);if(dt<=0)return;gio+=dt;du+=dt*130;const m=Math.floor(du);if(m){du-=m;them(m,true);}},
    hud(){return [[chu('chon'),k],[chu('ban'),so(r,2)+' a₀'],[chu('mat'),so(xuyenTam(r,k),3)+' /a₀'],[chu('e'),so(nangLuong(k==='1s'?1:2),2)+' eV'],[chu('nut'),k==='2s'?'1':'0']];}};
}};
