import * as THREE from 'three';
import { taoBan } from '../khung/ban-thi-nghiem-luong-tu.js';
import { taoNgauNhien, DuongDay, goNhanDeNhau } from '../khung/ve.js';
import { so,luyThua,M_MAT_TROI,NAM_GIAY } from '../vat-ly/hang-so.js';
import {R_H,T_H,T_NEN,M_CAN_BANG,pho,DINH_X,P_LY_TUONG,THOI_GIAN_LY_TUONG,M_TRAI_DAT,phoBe} from '../vat-ly/buc-xa-hawking.js';
import { dich } from '../ngon-ngu/dich.js';
import goc from '../ngon-ngu/vi/buc-xa-hawking.json' with {type:'json'};
import noiDung from '../noi-dung/buc-xa-hawking.js';
const chu=k=>dich('buc-xa-hawking','canh.'+k,goc['canh.'+k]);
export default {id:'buc-xa-hawking',...noiDung,mayAnh:{viTri:[4.6,4.9,12.2],dich:[0,1.65,-.15],fov:37,min:4,max:24,hep:.45},nhacNen:null,
  tao(app){
    const {scene,mat,hop,cau,vong,nhan,themThongTin,thanhKeo,hatBay}=taoBan(app,chu);
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
    // Nhóm hạt bay của bàn chung: mọi lượng tử trong một lượt vẽ.
    const SO=140;
    const VANG=new THREE.Color(0xf3c66f).multiplyScalar(1.4),HONG=new THREE.Color(0xff7aa8).multiplyScalar(1.3);
    const lt=hatBay(SO,{banKinh:.045,mau:0xf3c66f,sang:1.4});
    const ds=Array.from({length:SO},()=>({song:false,r:0,v:1,d:new THREE.Vector3(),mau:null}));
    const V=new THREE.Vector3();

    // Màn phổ: cột xanh là phổ của lỗ đen; đường vàng là phổ của bể photon trên cùng trục, cùng thang.
    const man=hop(3.8,2.4,.17,2.10,1.69,-.75,mat.thep);
    hop(3.55,2.16,.07,2.10,1.69,-.63,mat.den);
    themThongTin(man,'pho','tt-pho');const nhanPho=nhan('pho',2.1,3.15,-.55);
    const xMan=x=>.47+.414*x, Y_DAY=.84, CAO=1.52, yMan=h=>Y_DAY+CAO*h;
    const cot=[];
    for(let j=0;j<=64;j++){const x=8*j/64;const c=hop(.034,1,.06,xMan(x),Y_DAY,-.52,mat.xanh);cot.push([x,c]);}
    const marker=cau(.075,xMan(1),yMan(1),-.41,mat.do);
    const nhanSo=[];
    // Vạch chia mỗi 2 đơn vị, chữ số mỗi 4 đơn vị (bớt nhãn cho cảnh không quá 12 nhãn).
    for(let x=0;x<=8;x+=2){hop(.018,.095,.06,xMan(x),.75,-.52,mat.thep);if(x%4===0)nhanSo.push(nhan('so-'+x,xMan(x),.6,-.45,'mo'));}
    const nhanTrucX=nhan('truc-x',xMan(7.2),.88+CAO*.95,-.45,'mo');
    const nhanDinh=nhan('dinh',xMan(DINH_X),Y_DAY+CAO+.12,-.45,'mo');
    const be=new DuongDay(81,{mau:0xf3c66f,rong:2.6,quang:.12});scene.add(be.line);
    const nhanBe=nhan('be',xMan(5.2),Y_DAY+CAO*.62,-.4,'vang');

    let buocHien=-1,logM=22,x=1,ngoai=true,keoM=false,keoX=false,t=0,lan=-2,tich=0,capHat=false;
    const datM=thanhKeo({k:'m',x:22,y:.18,z:1.45,min:12,max:32,dau:-3.65,cuoi:-.65,buoc:.01,donVi:v=>luyThua(10**v,2)+' kg',doi:(v,dr)=>{logM=v;keoM=dr;capM();}});
    const datX=thanhKeo({k:'x',x:1,y:.18,z:1.45,min:.1,max:8,dau:.52,cuoi:3.83,buoc:.01,donVi:v=>so(v,2),doi:(v,dr)=>{x=v;keoX=dr;capX();}});
    // Mốc khối lượng trên thước: Trái Đất, Mặt Trời và khối lượng cân bằng với nền 2,725 K.
    const nhanMoc=[];
    const xThuoc=v=>-3.65+(v-12)/20*3;
    for(const [k,m,vl] of [['moc-can',M_CAN_BANG(T_NEN),mat.do],['moc-dat',M_TRAI_DAT,mat.xanh],['moc-troi',M_MAT_TROI,mat.xanh]]){
      const v=Math.log10(m),tren=k==='moc-can';hop(.03,.22,.03,xThuoc(v),.18,1.62,vl);nhanMoc.push(nhan(k,xThuoc(v),tren?.5:-.08,tren?1.62:1.98,'mo'));}
    // Nhãn tránh nhau: chân trời là vật chính; vạch số và mốc trên thước là nhãn phụ.
    const kBe={nhan:nhanBe,uuTien:76,tat:true}, kDinh={nhan:nhanDinh,uuTien:60,tat:false};
    const dsNhan=[{nhan:nhanBH,uuTien:92,giu:true},{nhan:nhanT,uuTien:80},{nhan:nhanPho,uuTien:70},kBe,kDinh,
      {nhan:nhanTrucX,uuTien:25},...nhanSo.map(n=>({nhan:n,uuTien:20})),{nhan:nhanMoc[0],uuTien:40},
      ...nhanMoc.slice(1).map(n=>({nhan:n,uuTien:30}))];
    const chonNen=app.bang.chon({nhan:chu('moi-truong'),luaChon:[{giaTri:'be',nhan:chu('co-be')},{giaTri:'ck',nhan:chu('chan-khong')}],giaTri:'be',khiDoi:v=>{ngoai=v==='be';capPho();}});
    const chonHinh=app.bang.chon({nhan:chu('hinh-anh'),luaChon:[{giaTri:'dong',nhan:chu('dong-ra')},{giaTri:'cap',nhan:chu('cap-hat')}],giaTri:'dong',khiDoi:v=>{capHat=v==='cap';}});

    function capPho(){
      // Đơn vị: đỉnh phổ của lỗ đen = 1. Bể có r = T_nền/T_H: phổ bể theo x là x³/(e^{x/r} − 1), đỉnh r³.
      const r=T_NEN/T_H(10**logM), dinhBe=ngoai?r**3:0, thang=Math.max(1,dinhBe), p0=pho(DINH_X);
      for(const [xx,c] of cot){const h=Math.max(.002,pho(xx)/p0/thang);c.scale.y=CAO*h;c.position.y=Y_DAY+CAO*h/2;}
      marker.position.set(xMan(x),yMan(pho(x)/p0/thang),-.41);
      be.line.visible=ngoai;kBe.tat=!ngoai;
      if(ngoai){for(let j=0;j<=80;j++){const xx=.1+7.9*j/80;be.dat(j,xMan(xx),yMan(Math.min(1.08,phoBe(xx,r)/p0/thang)),-.47);}be.xong(81);
        nhanBe.datChu(chu('be')+' · '+(r>1.0001?chu('be-nong'):r<.9999?chu('be-lanh'):chu('can')));}
      kDinh.tat=thang>=1.5;
    }
    function capM(){datM(logM);const r=.59+.033*(logM-12);black.scale.setScalar(r);rim.scale.setScalar(r*1.025);capPho();}
    function capX(){datX(x);capPho();}
    function lenh(k){if(k==='sao')logM=Math.log10(M_MAT_TROI);else if(k==='nho')logM=12;
      else if(k==='gap')logM=Math.min(32,logM+Math.log10(2));else if(k==='dinh')x=DINH_X;
      else if(k==='nen'){ngoai=!ngoai;chonNen.dat(ngoai?'be':'ck');}else if(k==='nguoi')logM=Math.log10(M_CAN_BANG(T_NEN));
      else if(k==='cap'){capHat=!capHat;chonHinh.dat(capHat?'cap':'dong');}
      capM();capX();keoM=keoX=false;
    }
    function buoc(i){buocHien=i;logM=[22,22,16,18,17,22,14,30][i];x=[1,1,2,1,1,2,1,1][i];ngoai=i===5;capHat=false;
      chonNen.dat(ngoai?'be':'ck');chonHinh.dat('dong');keoM=keoX=false;capM();capX();}

    function phat(){
      const R=black.scale.x;
      const ngauHuong=(d)=>{const u=2*rng()-1,f=rng()*Math.PI*2,s=Math.sqrt(1-u*u);return d.set(s*Math.cos(f),u,s*Math.sin(f));};
      const lay=()=>ds.find(o=>!o.song);
      if(capHat){const a=lay();if(!a)return;a.song=true;ngauHuong(a.d);a.r=R*1.12;a.v=.9;a.mau=VANG;
        const b=lay();if(b){b.song=true;b.d.copy(a.d);b.r=R*1.12;b.v=-.35;b.mau=HONG;}}
      else{const a=lay();if(!a)return;a.song=true;ngauHuong(a.d);a.r=R*1.02;a.v=.9;a.mau=VANG;}
    }
    function capNhat(dt){goNhanDeNhau(dsNhan,app.camera,app.rong,app.cao);if(dt<=0)return;dt=Math.min(dt,.1);t+=dt;const R=black.scale.x;
      // Nhịp phát trên hình tăng theo bậc của công suất (thang logarit), không theo tỉ lệ thật.
      const nhip=Math.min(40,Math.max(3,3+1.6*(32-logM)));
      tich=Math.min(tich+dt*nhip,4);while(tich>=1){tich-=1;phat();}
      for(let i=0;i<SO;i++){const h=ds[i];if(!h.song)continue;
        h.r+=h.v*dt;
        if(h.r>R+2.1||(h.v<0&&h.r<R*.98)){h.song=false;lt.an(i);continue;}
        if(h.mau){lt.datMau(i,h.mau);h.mau=null;}
        const s=h.v<0?1:Math.max(.2,1-(h.r-R)/2.3);
        V.copy(h.d).multiplyScalar(h.r).add(tam);lt.dat(i,V.x,V.y,V.z,s);
      }
      lt.xong();
      if(t-lan>1.7){app.am.tich({tanSo:300+25*(32-logM),doTo:.13});lan=t;}
    }
    function dat(k){if(k==='com')return keoM&&Math.abs(logM-22)<.035;
      if(k==='pho')return keoX&&Math.abs(x-DINH_X)<.075;
      return k==='nen'&&ngoai&&keoM&&Math.abs(T_H(10**logM)/T_NEN-1)<.09;
    }
    function hud(){const m=10**logM;
      nhanT.datChu('T<sub>H</sub> = '+luyThua(T_H(m),3)+' K · r<sub>s</sub> = '+luyThua(R_H(m),3)+' m');
      // Ô số liệu 5 dòng: T_H, M, rₛ luôn có; hai dòng còn lại theo việc đang làm (dò phổ, bể photon, công suất,
      // tuổi thọ). Dòng đầu là số chính của bước: công suất ở bước 5, tuổi thọ ở bước 7, còn lại là T_H.
      const dong={T:['T_H',luyThua(T_H(m),3)+' K'],M:['M',luyThua(m,3)+' kg'],r:['rₛ',luyThua(R_H(m),3)+' m'],
        net:[chu('net'),ngoai?(Math.abs(T_H(m)/T_NEN-1)<1e-10?chu('can'):T_H(m)>T_NEN?chu('mat'):chu('nhan')):chu('chan-khong')],
        x:[chu('chon-x'),so(x,2)+' · '+so(pho(x)/pho(DINH_X),3)],cong:[chu('cong'),luyThua(P_LY_TUONG(m),3)+' W'],
        doi:[chu('doi'),luyThua(THOI_GIAN_LY_TUONG(m)/NAM_GIAY,3)+' '+chu('nam')]};
      const them=[];if(buocHien===3||keoX)them.push('x');if(ngoai)them.push('net');them.push('cong','doi');
      const chon=['T','M','r',...them.slice(0,2)];
      const chinh=buocHien===4?'cong':buocHien===6?'doi':'T';
      if(!chon.includes(chinh))chon[4]=chinh;
      return [chinh,...chon.filter(k=>k!==chinh)].map(k=>dong[k]);}
    nhanBH.position.y=3.6;
    capM();capX();return {scene,buoc,capNhat,lenh,dat,hud};
  }
};
