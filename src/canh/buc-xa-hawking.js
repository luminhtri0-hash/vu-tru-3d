import * as THREE from 'three';
import { taoBan } from '../khung/ban-thi-nghiem-luong-tu.js';
import { taoNgauNhien, DuongDay } from '../khung/ve.js';
import { so,luyThua,M_MAT_TROI,NAM_GIAY } from '../vat-ly/hang-so.js';
import {R_H,T_H,T_NEN,M_CAN_BANG,pho,DINH_X,P_LY_TUONG,THOI_GIAN_LY_TUONG,M_TRAI_DAT,phoBe} from '../vat-ly/buc-xa-hawking.js';
import { dich } from '../ngon-ngu/dich.js';
import goc from '../ngon-ngu/vi/buc-xa-hawking.json' with {type:'json'};
import noiDung from '../noi-dung/buc-xa-hawking.js';
const chu=k=>dich('buc-xa-hawking','canh.'+k,goc['canh.'+k]);
export default {id:'buc-xa-hawking',...noiDung,mayAnh:{viTri:[4.6,4.9,12.2],dich:[0,1.65,-.15],fov:37,min:4,max:24},nhacNen:null,
  tao(app){
    const {scene,mat,hop,cau,vong,nhan,themThongTin,thanhKeo}=taoBan(app,chu);
    const rng=taoNgauNhien(2801);
    hop(9.0,.23,4.1,0,-.21,0,mat.den);
    const tam=new THREE.Vector3(-2.05,1.85,0);
    // Chân trời: quả cầu đen, viền đồng.
    const black=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),new THREE.MeshBasicMaterial({color:0x010306}));
    black.position.copy(tam);scene.add(black);
    const rim=vong(1,.03,tam.x,tam.y,tam.z,mat.dong);
    const nhanBH=nhan('chan-troi',tam.x,3.6,0);
    const nhanT=nhan('chan-troi',tam.x,1.0,1.2,'vang');
    themThongTin(black,'chan-troi','tt-chan-troi');

    // Lượng tử bay ra (vàng). Chế độ «cặp hạt» chỉ là hình minh hoạ: một hạt rơi vào (hồng), một hạt bay ra.
    const SO=140, hG=new THREE.SphereGeometry(.045,8,6);
    const lt=new THREE.InstancedMesh(hG,new THREE.MeshBasicMaterial({color:0xffffff}),SO);
    lt.frustumCulled=false;lt.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(lt);
    const VANG=new THREE.Color(0xf3c66f).multiplyScalar(1.4),HONG=new THREE.Color(0xff7aa8).multiplyScalar(1.3),XANH=new THREE.Color(0x7fcaff).multiplyScalar(1.3);
    const ds=Array.from({length:SO},()=>({song:false,r:0,v:1,d:new THREE.Vector3(),mau:null}));
    const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),V=new THREE.Vector3(),S1=new THREE.Vector3(1,1,1),S0=new THREE.Vector3();
    for(let i=0;i<SO;i++){lt.setMatrixAt(i,M4.compose(V.set(0,-50,0),Q,S0));lt.setColorAt(i,VANG);}

    // Màn phổ: cột xanh là phổ của lỗ đen; đường vàng là phổ của bể photon trên cùng trục, cùng thang.
    const man=hop(3.8,2.4,.17,2.10,1.69,-.75,mat.thep);
    hop(3.55,2.16,.07,2.10,1.69,-.63,mat.den);
    themThongTin(man,'pho','tt-pho');nhan('pho',2.1,3.15,-.55);
    const xMan=x=>.47+.414*x, Y_DAY=.84, CAO=1.52, yMan=h=>Y_DAY+CAO*h;
    const cot=[];
    for(let j=0;j<=64;j++){const x=8*j/64;const c=hop(.034,1,.06,xMan(x),Y_DAY,-.52,mat.xanh);cot.push([x,c]);}
    const marker=cau(.075,xMan(1),yMan(1),-.41,mat.do);
    for(let x=0;x<=8;x+=2){hop(.018,.095,.06,xMan(x),.75,-.52,mat.thep);nhan('so-'+x,xMan(x),.6,-.45,'mo');}
    nhan('truc-x',xMan(7.2),.88+CAO*.95,-.45,'mo');
    const nhanDinh=nhan('dinh',xMan(DINH_X),Y_DAY+CAO+.12,-.45,'mo');
    const be=new DuongDay(81,{mau:0xf3c66f,rong:2.6,quang:.12});scene.add(be.line);
    const nhanBe=nhan('be',xMan(6.6),Y_DAY+CAO*.55,-.4,'vang');

    let logM=22,x=1,ngoai=true,keoM=false,keoX=false,t=0,lan=-2,tich=0,capHat=false;
    const datM=thanhKeo({k:'m',x:22,y:.18,z:1.45,min:12,max:32,dau:-3.65,cuoi:-.65,buoc:.01,donVi:v=>luyThua(10**v,2)+' kg',doi:(v,dr)=>{logM=v;keoM=dr;capM();}});
    const datX=thanhKeo({k:'x',x:1,y:.18,z:1.45,min:.1,max:8,dau:.52,cuoi:3.83,buoc:.01,donVi:v=>so(v,2),doi:(v,dr)=>{x=v;keoX=dr;capX();}});
    // Mốc khối lượng trên thước: Trái Đất, Mặt Trời và khối lượng cân bằng với nền 2,725 K.
    const xThuoc=v=>-3.65+(v-12)/20*3;
    for(const [k,m,vl] of [['moc-can',M_CAN_BANG(T_NEN),mat.do],['moc-dat',M_TRAI_DAT,mat.xanh],['moc-troi',M_MAT_TROI,mat.xanh]]){
      const v=Math.log10(m),tren=k==='moc-can';hop(.03,.22,.03,xThuoc(v),.18,1.62,vl);nhan(k,xThuoc(v),tren?.5:-.08,tren?1.62:1.98,'mo');}
    const chonNen=app.bang.chon({nhan:chu('moi-truong'),luaChon:[{giaTri:'be',nhan:chu('co-be')},{giaTri:'ck',nhan:chu('chan-khong')}],giaTri:'be',khiDoi:v=>{ngoai=v==='be';capPho();}});
    const chonHinh=app.bang.chon({nhan:chu('hinh-anh'),luaChon:[{giaTri:'dong',nhan:chu('dong-ra')},{giaTri:'cap',nhan:chu('cap-hat')}],giaTri:'dong',khiDoi:v=>{capHat=v==='cap';}});

    function capPho(){
      // Đơn vị: đỉnh phổ của lỗ đen = 1. Bể có r = T_nền/T_H: phổ bể theo x là x³/(e^{x/r} − 1), đỉnh r³.
      const r=T_NEN/T_H(10**logM), dinhBe=ngoai?r**3:0, thang=Math.max(1,dinhBe), p0=pho(DINH_X);
      for(const [xx,c] of cot){const h=Math.max(.002,pho(xx)/p0/thang);c.scale.y=CAO*h;c.position.y=Y_DAY+CAO*h/2;}
      marker.position.set(xMan(x),yMan(pho(x)/p0/thang),-.41);
      be.line.visible=ngoai;nhanBe.visible=ngoai;
      if(ngoai){for(let j=0;j<=80;j++){const xx=.1+7.9*j/80;be.dat(j,xMan(xx),yMan(Math.min(1.08,phoBe(xx,r)/p0/thang)),-.47);}be.xong(81);
        nhanBe.datChu(chu('be')+' · '+(r>1.0001?chu('be-nong'):r<.9999?chu('be-lanh'):chu('can')));}
      nhanDinh.visible=thang<1.5;
    }
    function capM(){datM(logM);const r=.59+.033*(logM-12);black.scale.setScalar(r);rim.scale.setScalar(r*1.025);capPho();}
    function capX(){datX(x);capPho();}
    function lenh(k){if(k==='sao')logM=Math.log10(M_MAT_TROI);else if(k==='nho')logM=12;
      else if(k==='gap')logM=Math.min(32,logM+Math.log10(2));else if(k==='dinh')x=DINH_X;
      else if(k==='nen'){ngoai=!ngoai;chonNen.dat(ngoai?'be':'ck');}else if(k==='nguoi')logM=Math.log10(M_CAN_BANG(T_NEN));
      else if(k==='cap'){capHat=!capHat;chonHinh.dat(capHat?'cap':'dong');}
      capM();capX();keoM=keoX=false;
    }
    function buoc(i){logM=[22,22,16,18,17,22,14,30][i];x=[1,1,2,1,1,2,1,1][i];ngoai=i===5;capHat=false;
      chonNen.dat(ngoai?'be':'ck');chonHinh.dat('dong');keoM=keoX=false;capM();capX();}

    function phat(){
      const R=black.scale.x;
      const ngauHuong=(d)=>{const u=2*rng()-1,f=rng()*Math.PI*2,s=Math.sqrt(1-u*u);return d.set(s*Math.cos(f),u,s*Math.sin(f));};
      const lay=()=>ds.find(o=>!o.song);
      if(capHat){const a=lay();if(!a)return;a.song=true;ngauHuong(a.d);a.r=R*1.12;a.v=.9;a.mau=VANG;
        const b=lay();if(b){b.song=true;b.d.copy(a.d);b.r=R*1.12;b.v=-.35;b.mau=HONG;}}
      else{const a=lay();if(!a)return;a.song=true;ngauHuong(a.d);a.r=R*1.02;a.v=.9;a.mau=VANG;}
    }
    function capNhat(dt){if(dt<=0)return;dt=Math.min(dt,.1);t+=dt;const R=black.scale.x;
      // Nhịp phát trên hình tăng theo bậc của công suất (thang logarit), không theo tỉ lệ thật.
      const nhip=Math.min(40,Math.max(3,3+1.6*(32-logM)));
      tich=Math.min(tich+dt*nhip,4);while(tich>=1){tich-=1;phat();}
      let doiMau=false;
      for(let i=0;i<SO;i++){const h=ds[i];if(!h.song)continue;
        h.r+=h.v*dt;
        if(h.r>R+2.1||(h.v<0&&h.r<R*.98)){h.song=false;lt.setMatrixAt(i,M4.compose(V.set(0,-50,0),Q,S0));continue;}
        if(h.mau){lt.setColorAt(i,h.mau);h.mau=null;doiMau=true;}
        const s=h.v<0?1:Math.max(.2,1-(h.r-R)/2.3);
        lt.setMatrixAt(i,M4.compose(V.copy(h.d).multiplyScalar(h.r).add(tam),Q,S1.set(s,s,s)));
      }
      S1.set(1,1,1);lt.instanceMatrix.needsUpdate=true;if(doiMau&&lt.instanceColor)lt.instanceColor.needsUpdate=true;
      if(t-lan>1.7){app.am.tich({tanSo:300+25*(32-logM),doTo:.13});lan=t;}
    }
    function dat(k){if(k==='com')return keoM&&Math.abs(logM-22)<.035;
      if(k==='pho')return keoX&&Math.abs(x-DINH_X)<.075;
      return k==='nen'&&ngoai&&keoM&&Math.abs(T_H(10**logM)/T_NEN-1)<.09;
    }
    function hud(){const m=10**logM;
      nhanT.datChu('T<sub>H</sub> = '+luyThua(T_H(m),3)+' K · r<sub>s</sub> = '+luyThua(R_H(m),3)+' m');
      return [['M',luyThua(m,3)+' kg'],['rₛ',luyThua(R_H(m),3)+' m'],['T_H',luyThua(T_H(m),3)+' K'],[chu('net'),ngoai?(Math.abs(T_H(m)/T_NEN-1)<1e-10?chu('can'):T_H(m)>T_NEN?chu('mat'):chu('nhan')):chu('chan-khong')],[chu('chon-x'),so(x,2)+' · '+so(pho(x)/pho(DINH_X),3)],[chu('cong'),luyThua(P_LY_TUONG(m),3)+' W'],[chu('doi'),luyThua(THOI_GIAN_LY_TUONG(m)/NAM_GIAY,3)+' '+chu('nam')]];}
    nhanBH.position.y=3.6;
    capM();capX();return {scene,buoc,capNhat,lenh,dat,hud};
  }
};
