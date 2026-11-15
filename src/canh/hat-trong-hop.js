import * as THREE from 'three';
import loi from '../noi-dung/hat-trong-hop.js';
import goc from '../ngon-ngu/vi/hat-trong-hop.json' with {type:'json'};
import {gocBan,banVe,chuCuaBai,ghepBuoc} from './ban-do-luong-tu.js';
import {kep,taoNgauNhien} from '../khung/ve.js';
import {so} from '../vat-ly/hang-so.js';
import {psiHop,rhoHop,nangHop,xacSuatHop,mauHop,heSoPha} from '../vat-ly/hat-trong-hop.js';
const id='hat-trong-hop',chu=chuCuaBai(id,goc);
const thu=[c=>c.datMuc(1),c=>c.datMuc(2),c=>c.datMuc(2),c=>c.datDoc(0.5),c=>c.datMuc(3),c=>c.datRong(1),c=>c.xoa(),c=>{c.datMuc(3);c.xoa();}];
const thach={2:c=>c.thu('giua'),5:c=>c.thu('rong'),7:c=>c.thu('nut')};
export default {id,...ghepBuoc(loi,thu,thach),mayAnh:gocBan,hinh:{quang:0.25},nhacNen:null,
  tao(app){
    const {scene,hop,kim,nhan,net,nen,dong}=banVe(app);
    const left=-3.45,scale=3.45;
    let L=1,n=1,u=0.18,keoDoc=false,keoRong=false,N=0,du=0,gio=0,cuoi=-2,buocNay=0,tPha=0;
    const rand=taoNgauNhien(2207),blue=net(0x75d4ff),gold=net(0xffc577);
    const vachTrai=hop(0.14,2.4,3.4,left,1,0,kim(0x467a8d));
    const vach=hop(0.14,2.4,3.4,0,1,0,kim(0x37647a));
    const B=1.15;
    // Thang năng lượng ở góc phải phía trước bàn: năm mức đầu của hộp đang chọn, chiều cao tỉ lệ E_n (đơn vị E₁ tham chiếu).
    const XT=3.95, ZT=2.3, YT0=0.05, KT=0.09, YT1=2.4;
    hop(0.03,YT1-YT0,0.03,XT-0.33,(YT0+YT1)/2,ZT,kim(0x7e98a6));
    const vlMuc=new THREE.MeshBasicMaterial({color:new THREE.Color(0x5d7684)});
    const vlMucChon=new THREE.MeshBasicMaterial({color:new THREE.Color(0xffc577).multiplyScalar(2.2)});
    const mucBac=[1,2,3,4,5].map(k=>({o:hop(0.62,0.028,0.05,XT,0,ZT,vlMuc),nh:nhan('n = '+k,XT+0.62,0,ZT,'tran')}));
    hop(0.62,0.008,0.05,XT,YT0+KT,ZT,new THREE.MeshBasicMaterial({color:0x8fe3a8}));
    nhan('E',XT-0.33,YT1+0.18,ZT,'tran');
    function veThang(){for(let k=1;k<=5;k++){const E=nangHop(k,L),y=YT0+KT*E,m=mucBac[k-1],hien=y<=YT1;
      m.o.visible=hien;m.nh.hien(hien);m.o.position.y=y;m.nh.position.y=y;m.o.material=k===n?vlMucChon:vlMuc;}}
    const nenChon=hop(1,0.022,0.42,0,-0.10,1.0,kim(0xc18a46));
    const chi=hop(.035,2.0,0.04,0,0.9,1.02,dong);
    nhan(chu('bien'),-2.6,2.35,-1.05,'xanh');nhan(chu('mat'),-2.6,2.15,1.45,'vang');
    const hinh=new THREE.BufferGeometry(),a=new THREE.Float32BufferAttribute(new Float32Array(600*3),3).setUsage(THREE.DynamicDrawUsage);
    hinh.setAttribute('position',a);hinh.setDrawRange(0,0);
    const mau=new THREE.Points(hinh,new THREE.PointsMaterial({color:0xffcc79,size:0.052}));mau.frustumCulled=false;scene.add(mau);
    function datDoc(v){u=kep(v,0,1);chi.position.x=left+u*L*scale;nenChon.scale.x=Math.max(0.003,u*L*scale);nenChon.position.x=left+u*L*scale/2;doc.dat([chi.position.x,0.12,1.52]);}
    function ve(){vach.position.x=left+L*scale;tay.dat([vach.position.x,2.25,0]);datDoc(u);
      for(let i=0;i<180;i++){const z=i/179,x=left+z*L*scale;blue.dat(i,x,B+.62*psiHop(z,n,L),-.86);gold.dat(i,x,.15+.55*rhoHop(z,n,L),.9);}
      blue.xong(180);gold.xong(180);veThang();}
    const tay=app.tt.tayNam({viTri:[0,2.25,0],rangBuoc:{kieu:'duong',qua:[0,2.25,0],huong:[1,0,0]},ten:chu('vach'),nhan:chu('rong'),mau:0x6ad8fa,
      gioiHan:p=>{p.x=kep(p.x,left+.65*scale,left+2.1*scale);return p;},khiKeo:p=>{keoRong=true;datRong((p.x-left)/scale);}});
    const doc=app.tt.tayNam({viTri:[left,0.12,1.52],rangBuoc:{kieu:'duong',qua:[0,0.12,1.52],huong:[1,0,0]},ten:chu('doc'),nhan:chu('giua'),mau:0xffc071,
      gioiHan:p=>{p.x=kep(p.x,left,left+L*scale);return p;},khiKeo:p=>{keoDoc=true;datDoc((p.x-left)/(L*scale));}});
    app.tt.them(vachTrai,{ten:'x = 0',moTa:()=> 'ψ(0) = 0',noiBat:false});
    const dkL=app.bang.thanhTruot({nhan:chu('rong'),min:.65,max:2.1,buoc:.01,giaTri:1,hienThi:v=>so(v,2)+' nm',khiDoi:v=>{keoRong=true;datRong(v);}});
    const dkN=app.bang.thanhTruot({nhan:chu('muc'),min:1,max:5,buoc:1,giaTri:1,khiDoi:datMuc});
    function xoa(){N=0;du=0;hinh.setDrawRange(0,0);}
    function datMuc(v){n=Math.round(kep(v,1,5));dkN.dat(n);xoa();ve();}
    function datRong(v){L=kep(v,.65,2.1);dkL.dat(L);xoa();ve();}
    function hat(k,am=true){for(let i=0;i<k;i++){const x=mauHop(rand(),n);a.setXYZ(N%600,left+L*scale*x,0.02,1.73+rand()*.56);N++;}
      a.needsUpdate=true;hinh.setDrawRange(0,Math.min(N,600));
      if(am&&gio-cuoi>=.9){app.am.tich({tanSo:770,doTo:.19,dai:.03});cuoi=gio;}}
    app.bang.nut([{nhan:chu('thu'),khiBam:()=>hat(1)}]);
    return{scene,datMuc,datRong,datDoc,xoa,
      buoc(i){buocNay=i;tPha=0;L=1;n=[1,1,2,1,1,1,2,3][i];u=.18;keoDoc=keoRong=false;dkN.dat(n);dkL.dat(L);xoa();ve();hat(40,false);},
      thu(k){if(k==='rong')return keoRong&&n===1&&Math.abs(nangHop(n,L)-.25)<.02;return keoDoc&&(k==='giua'?n===2&&Math.abs(u-.5)<.03:n===3&&Math.abs(u-1/3)<.025);},
      capNhat(dt){if(dt<=0)return;gio+=dt;du+=dt*26;const k=Math.floor(du);if(k){du-=k;hat(k);}
        // Bước 8: đường lam là phần thực của ψ·e^{-iEt/ħ}, phập phồng tại chỗ; mức 3 có chu kỳ khoảng 3 giây trên hình.
        if(buocNay===7){tPha+=dt;const c=heSoPha(n,L,tPha,0.233);
          for(let i=0;i<180;i++){const z=i/179;blue.dat(i,left+z*L*scale,B+.62*psiHop(z,n,L)*c,-.86);}blue.xong(180);}},
      hud(){return [[chu('muc'),so(n,0)],[chu('rong'),so(L,2)+' nm'],[chu('doc'),'b/L = '+so(u,3)],[chu('dien'),so(xacSuatHop(u,n),3)],[chu('nang'),so(nangHop(n,L),3)],[chu('dem'),so(N,0)]];}};
  }};
