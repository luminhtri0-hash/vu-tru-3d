import * as THREE from 'three';
import { taoNgauNhien, DuongDay } from '../khung/ve.js';
import { taoBan } from '../khung/ban-thi-nghiem-luong-tu.js';
import { khungDoThi, MAU } from '../khung/giao-dien.js';
import { xacSuatCong, giaTriTrungBinh, saiSoChuan } from '../vat-ly/spin-stern-gerlach.js';
import { so } from '../vat-ly/hang-so.js';
import { dich } from '../ngon-ngu/dich.js';
import goc from '../ngon-ngu/vi/spin-stern-gerlach.json' with { type:'json' };
import noiDung from '../noi-dung/spin-stern-gerlach.js';

const chu=k=>dich('spin-stern-gerlach','canh.'+k,goc['canh.'+k]);

// Mặt cắt hai cực nam châm (trong mặt phẳng z–y của cảnh), kéo dài dọc chùm (trục x).
// Cực trên vát nhọn, cực dưới có rãnh: từ trường mạnh dần về phía mũi nhọn nên có gradient dọc trục đo.
function cucNamChau(diem, dai) {
  const hinh=new THREE.Shape(diem.map(([u,v])=>new THREE.Vector2(u,v)));
  const g=new THREE.ExtrudeGeometry(hinh,{depth:dai,bevelEnabled:false});
  g.translate(0,0,-dai/2); g.rotateY(Math.PI/2);
  return g;
}
const CUC_TREN=[[-.46,.98],[.46,.98],[.46,.46],[.07,.2],[-.07,.2],[-.46,.46]];
const CUC_DUOI=[[-.46,-.98],[.46,-.98],[.46,-.26],[.15,-.26],[.15,-.44],[-.15,-.44],[-.15,-.26],[-.46,-.26]];

// Mũi tên trong nhóm: gốc ở (0,0,0), hướng theo +y của nhóm.
function muiTen(dai,mau,nhom) {
  const vl=new THREE.MeshBasicMaterial({color:new THREE.Color(mau).multiplyScalar(1.25)});
  const than=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,dai-.16,10),vl); than.position.y=(dai-.16)/2;
  const dau=new THREE.Mesh(new THREE.ConeGeometry(.085,.2,14),vl); dau.position.y=dai-.1;
  const g=new THREE.Group(); g.add(than,dau); nhom.add(g); return g;
}

export default {
  id:'spin-stern-gerlach', ...noiDung, mayAnh:{viTri:[6.6,5.6,10.6],dich:[.1,1.25,0],fov:42,min:4,max:24}, nhacNen:null,
  tao(app) {
    const {scene,mat,hop,vong,nhan,themThongTin,thanhKeo}=taoBan(app,chu);
    const rng=taoNgauNhien(2601);
    const Y0=1.56, X_LO=-3.85, X_MAN=3.1;
    // Bàn và đường ray.
    hop(9.4,.25,3.8,.2,-.1,0,mat.den);
    hop(8.6,.15,.28,.1,.23,0,mat.thep);
    // Lò nung bạc.
    const lo=hop(.95,.9,.9,X_LO-.25,Y0,0,mat.thep);
    for(const x of [-4.35,-4.1,-3.85]) hop(.055,.98,1.02,x,Y0,0,mat.dong);
    hop(.12,.16,.16,X_LO+.28,Y0,0,mat.dong);
    nhan('nguon',X_LO-.25,2.42,0); themThongTin(lo,'nguon','tt-nguon');

    // Máy chuẩn bị: một nam châm nhỏ cố định theo trục z và một tấm chắn có hai lỗ.
    const vlCuc=[mat.do,mat.xanh];
    const chuanBi=new THREE.Group(); chuanBi.position.set(-2.95,Y0,0); chuanBi.scale.setScalar(.5); scene.add(chuanBi);
    for(const [i,d] of [CUC_TREN,CUC_DUOI].entries()) chuanBi.add(new THREE.Mesh(cucNamChau(d,1.3),vlCuc[i]));
    const khung0=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.1,.16),mat.thep); khung0.position.z=-.56; chuanBi.add(khung0);
    themThongTin(khung0,'chuan-bi','tt-chuan-bi');
    const tam=hop(.08,1.0,.7,-2.35,Y0,0,mat.den); themThongTin(tam,'chuan-bi','tt-chuan-bi');
    const nut=[1,-1].map(s=>{const o=hop(.1,.11,.11,-2.35,Y0+s*.22,0,mat.thep);return o;});
    nhan('chuan-bi',-2.7,2.45,0);

    // Mặt số góc: mũi tên vàng là hướng spin đã chuẩn bị, mũi tên đỏ cam là trục đo n.
    const XD=-1.35;
    const matSo=new THREE.Group(); matSo.position.set(XD,Y0,0); scene.add(matSo);
    const vongSo=vong(.8,.012,0,0,0,mat.thep,matSo); vongSo.rotation.y=Math.PI/2;
    const tenChuanBi=[muiTen(.74,0xf3c66f,matSo),muiTen(.74,0xf3c66f,matSo)]; tenChuanBi[1].rotation.x=Math.PI;
    const tenN=muiTen(.86,0xff8a73,matSo);
    const cung=new DuongDay(64,{mau:0xf3c66f,rong:2.4,quang:.12});
    cung.line.position.set(XD,Y0,0); scene.add(cung.line);
    const nhanTheta=nhan('goc-ngan',XD,Y0+1.12,0,'vang');
    const nhanN=nhan('truc-n',XD,Y0,0,'hong');

    // Nam châm phân tích: quay quanh trục chùm một góc θ.
    const nam=new THREE.Group(); nam.position.set(0,Y0,0); nam.scale.set(1,.72,.72); scene.add(nam);
    const cucTren=new THREE.Mesh(cucNamChau(CUC_TREN,1.3),mat.do), cucDuoi=new THREE.Mesh(cucNamChau(CUC_DUOI,1.3),mat.xanh);
    const khung=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.1,.16),mat.thep); khung.position.z=-.56;
    nam.add(cucTren,cucDuoi,khung);
    themThongTin(cucTren,'nam','tt-nam'); themThongTin(cucDuoi,'nam','tt-nam');
    nhan('nam',0,2.75,0);

    // Màn ghi quay cùng nam châm; các vết bám đọng lại trên màn.
    const man=new THREE.Group(); man.position.set(X_MAN,Y0,0); scene.add(man);
    const tamMan=hop(.1,1.6,1.25,.04,0,0,mat.thep,man); themThongTin(tamMan,'man','tt-man');
    hop(.03,1.5,1.15,-.03,0,0,mat.den,man);
    for(const [h,vl] of [[1,mat.do],[-1,mat.xanh]]) hop(.02,.04,.9,-.06,h*.7,0,vl,man);
    nhan('man',X_MAN,2.62,0);
    const SO_VET=900, vetG=new THREE.CircleGeometry(.026,8); vetG.rotateY(-Math.PI/2);
    const vet=new THREE.InstancedMesh(vetG,new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}),SO_VET);
    vet.count=0; vet.frustumCulled=false; man.add(vet);
    let soVet=0;

    // Cột đếm: tỉ lệ đếm được (cột) và xác suất lý thuyết (vạch vàng).
    const XC=4.25, CAO=1.5, Y_DAY=.3;
    const cot=[[1,mat.do,-.75],[-1,mat.xanh,-.35]].map(([k,vl,z])=>{
      hop(.3,.02,.3,XC,Y_DAY,z,mat.thep);
      const c=hop(.2,1,.2,XC,Y_DAY,z,vl); c.scale.y=.001;
      const v=hop(.32,.03,.32,XC,Y_DAY,z,new THREE.MeshBasicMaterial({color:0xf3c66f}));
      const n=nhan(k>0?'cua-cong':'cua-tru',XC,Y_DAY+(k>0?CAO+.25:.0)+(k>0?0:-.25),z,'mo');
      return {k,c,v,n,z};
    });
    hop(.02,CAO,.02,XC+.2,Y_DAY+CAO/2,-1.0,mat.thep);
    nhan('cot-dem',XC,Y_DAY+CAO+.65,-.55);

    // Nguyên tử đang bay: lượng lớn, dùng một InstancedMesh.
    const SO_NT=90, ntG=new THREE.SphereGeometry(.05,10,8);
    const nt=new THREE.InstancedMesh(ntG,new THREE.MeshBasicMaterial({color:0xffffff}),SO_NT);
    nt.instanceMatrix.setUsage(THREE.DynamicDrawUsage); nt.frustumCulled=false; scene.add(nt);
    const MAU_CHUA=new THREE.Color(0xb5a8ff), MAU_K={1:new THREE.Color(0xffb27f).multiplyScalar(1.3),'-1':new THREE.Color(0x7fe6f2).multiplyScalar(1.3)};
    const ds=Array.from({length:SO_NT},()=>({song:false,t:0,s:1,k:1,chan:false,mau:-9}));
    const M4=new THREE.Matrix4(), Q=new THREE.Quaternion(), V=new THREE.Vector3(), S1=new THREE.Vector3(1,1,1), S0=new THREE.Vector3(0,0,0);
    for(let i=0;i<SO_NT;i++){nt.setMatrixAt(i,M4.compose(V.set(0,-50,0),Q,S0));nt.setColorAt(i,MAU_CHUA);}

    let theta=0,pol=1,keo=false,dem=0,cong=0,tu=0,lanAm=-2,tichPhat=0,cos=1,sin=0;
    const datTay=thanhKeo({k:'goc',x:0,y:.33,z:1.3,min:0,max:180,dau:-1.82,cuoi:1.82,buoc:1,donVi:v=>so(v,0)+'°',doi:(v,nguoi)=>{keo=nguoi;datGoc(v);}});
    app.bang.nut(['duong','am','tron'].map(k=>({nhan:chu(k),khiBam:()=>lenh(k)})));
    const ghiChu=app.bang.chuThich(chu('do-thi'));
    const dt2=app.bang.doThi(150);

    function lamMoi(){dem=0;cong=0;soVet=0;vet.count=0;}
    function veCung(){
      const n=Math.max(2,Math.round(2+theta/3)), r=.62;
      for(let i=0;i<n;i++){const a=theta*Math.PI/180*i/(n-1);cung.dat(i,0,r*Math.cos(a),r*Math.sin(a));}
      cung.xong(n);cung.line.visible=theta>.5 && pol!==0;
      const a=theta*Math.PI/360;nhanTheta.position.set(XD,Y0+.98*Math.cos(a)+.1,.98*Math.sin(a));
      nhanTheta.datChu('θ = '+so(theta,0)+'°');
      nhanN.position.set(XD,Y0+1.12*Math.cos(2*a),1.12*Math.sin(2*a));
    }
    function datChuanBi(){
      tenChuanBi[0].visible=pol>=0;tenChuanBi[1].visible=pol<=0;
      nut[0].visible=pol<0;nut[1].visible=pol>0;
    }
    function datGoc(v){theta=v;datTay(v);nam.rotation.x=v*Math.PI/180;man.rotation.x=nam.rotation.x;tenN.rotation.x=nam.rotation.x;
      cos=Math.cos(nam.rotation.x);sin=Math.sin(nam.rotation.x);veCung();lamMoi();}
    function lenh(k) {
      if(k==='tron')pol=0;else if(k==='duong')pol=1;else if(k==='am')pol=-1;
      else if(k==='goc-0')datGoc(0);else if(k==='goc-90')datGoc(90);else if(k==='goc-180')datGoc(180);else if(k==='goc-60')datGoc(60);
      datChuanBi();veCung();lamMoi();keo=false;
    }
    function buoc(i){pol=[0,1,1,1,1,-1,0,1][i];datGoc([0,0,45,15,180,0,45,85][i]);datChuanBi();veCung();keo=false;}

    // Đường bay: lệch ở máy chuẩn bị (rồi dồn lại về giữa cho dễ nhìn), sau đó lệch dọc trục đo n.
    const muot=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
    function viTri(h){
      const x=X_LO+.35+(X_MAN-.06-X_LO-.35)*h.t;
      const yChuanBi=h.s*.22*muot((x+3.27)/.92)*(1-muot((x+2.35)/.7));
      const d=x<-.65?0:x<.65?.1*((x+.65)/1.3)**2:.1+(x-.65)*.15;
      return [x,Y0+yChuanBi+h.k*d*cos,h.k*d*sin,d];
    }
    function phat(){
      const h=ds.find(o=>!o.song); if(!h)return;
      const s=rng()<.5?1:-1;
      h.song=true;h.t=0;h.s=s;h.chan=pol!==0&&s!==pol;
      h.k=rng()<xacSuatCong(theta,s)?1:-1;h.mau=-9;
    }
    function ghiVet(k){
      const i=soVet%SO_VET; soVet++;
      const g=()=>{let a=0;for(let j=0;j<4;j++)a+=rng();return a-2;};
      vet.setMatrixAt(i,M4.compose(V.set(.1,k*(.47+.045*g()),.17*g()),Q,S1));
      vet.setColorAt(i,MAU_K[k]); vet.count=Math.min(SO_VET,soVet);
      vet.instanceMatrix.needsUpdate=true; if(vet.instanceColor)vet.instanceColor.needsUpdate=true;
    }
    function capNhat(dt) {
      if(dt<=0)return; dt=Math.min(dt,.1); tu+=dt;
      tichPhat=Math.min(tichPhat+dt*36,4); while(tichPhat>=1){tichPhat-=1;phat();}
      let doiMau=false;
      for(let i=0;i<SO_NT;i++){const h=ds[i];
        if(!h.song)continue;
        h.t+=dt*.52;
        const [x,y,z,d]=viTri(h);
        if(h.chan && x>=-2.38){h.song=false;nt.setMatrixAt(i,M4.compose(V.set(0,-50,0),Q,S0));continue;}
        if(h.t>=1){h.song=false;dem++;if(h.k===1)cong++;ghiVet(h.k);
          if(tu-lanAm>.9){app.am.tich({tanSo:h.k===1?760:420,doTo:.15,lech:.4*h.k});lanAm=tu;}
          nt.setMatrixAt(i,M4.compose(V.set(0,-50,0),Q,S0));continue;}
        const m=d>.03?h.k:0; if(m!==h.mau){h.mau=m;nt.setColorAt(i,m?MAU_K[m]:MAU_CHUA);doiMau=true;}
        nt.setMatrixAt(i,M4.compose(V.set(x,y,z),Q,S1));
      }
      nt.instanceMatrix.needsUpdate=true; if(doiMau&&nt.instanceColor)nt.instanceColor.needsUpdate=true;
    }
    function veCot(){
      const p=xacSuatCong(theta,pol);
      for(const c of cot){const ly=c.k>0?p:1-p, f=dem?(c.k>0?cong:dem-cong)/dem:0;
        c.c.scale.y=Math.max(.001,CAO*f);c.c.position.y=Y_DAY+CAO*f/2;c.v.position.y=Y_DAY+CAO*ly;
        c.n.datChu((c.k>0?'+ ':'− ')+(dem?so(100*f,0)+' %':'—'));}
    }
    function veDoThi(){
      const g=dt2.ctx,{X,Y}=khungDoThi(g,{rong:dt2.rong,cao:dt2.cao,x0:0,x1:180,y0:0,y1:1,nhanX:'θ',nhanY:'P(+)',
        vachX:[[0,'0°'],[60,'60°'],[90,'90°'],[120,'120°'],[180,'180°']],vachY:[[0,'0'],[.25,'¼'],[.5,'½'],[.75,'¾'],[1,'1']]});
      for(const [p,mau] of [[1,MAU.vang],[-1,MAU.xanh],[0,MAU.luc]]){
        g.strokeStyle=mau;g.globalAlpha=p===pol?1:.25;g.lineWidth=p===pol?2.2:1.2;g.beginPath();
        for(let a=0;a<=180;a+=3){const yy=Y(xacSuatCong(a,p));a?g.lineTo(X(a),yy):g.moveTo(X(a),yy);}g.stroke();
      }
      g.globalAlpha=1;g.strokeStyle=MAU.mo;g.setLineDash([3,3]);g.beginPath();g.moveTo(X(theta),Y(0));g.lineTo(X(theta),Y(1));g.stroke();g.setLineDash([]);
      if(dem){const f=cong/dem,e=saiSoChuan(f,dem);g.strokeStyle=MAU.do;g.lineWidth=1.5;g.beginPath();g.moveTo(X(theta),Y(Math.max(0,f-e)));g.lineTo(X(theta),Y(Math.min(1,f+e)));g.stroke();
        g.fillStyle=MAU.do;g.beginPath();g.arc(X(theta),Y(f),3.5,0,7);g.fill();}
    }
    function dat(k){return keo && pol===1 && Math.abs(xacSuatCong(theta,pol)-({can:.5,baTu:.75,motTu:.25})[k])<.014;}
    datChuanBi();veCung();
    return {scene,buoc,lenh,capNhat,dat,hud:()=>{veCot();veDoThi();const f=dem?cong/dem:0;return [
      [chu('chuan-bi'),pol===0?chu('tron'):chu(pol>0?'duong':'am')],[chu('goc'),so(theta,0)+'°'],['P(+) '+chu('ly-thuyet'),so(100*xacSuatCong(theta,pol),1)+' %'],
      [chu('dem'),so(cong,0)+' / '+so(dem,0)],[chu('ti-le'),dem?so(100*f,1)+' ± '+so(100*saiSoChuan(f,dem),1)+' %':'—'],['⟨S⟩ / ħ',so(giaTriTrungBinh(theta,pol),3)]];}};
  },
};
