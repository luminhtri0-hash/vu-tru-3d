import * as THREE from 'three';
import { taoBan } from '../khung/ban-thi-nghiem-luong-tu.js';
import { taoNgauNhien } from '../khung/ve.js';
import { khungDoThi, MAU } from '../khung/giao-dien.js';
import { tuongQuan,xacSuatCung,chsh,layCap,layCapAn,tuongQuanAn,chshVoi,saiSoE } from '../vat-ly/vuong-viu-bell.js';
import { so } from '../vat-ly/hang-so.js';
import { dich } from '../ngon-ngu/dich.js';
import goc from '../ngon-ngu/vi/vuong-viu-bell.json' with {type:'json'};
import noiDung from '../noi-dung/vuong-viu-bell.js';
const chu=k=>dich('vuong-viu-bell','canh.'+k,goc['canh.'+k]);

const TO_HOP=[[0,0],[0,1],[1,0],[1,1]]; // (a hoặc a′, b hoặc b′)

export default {id:'vuong-viu-bell', ...noiDung, mayAnh:{viTri:[3.6,5.6,12.6],dich:[0,1.75,0],fov:38,min:4,max:24,hep:.55},nhacNen:null,
  tao(app) {
    const {scene,mat,hop,cau,vong,nhan,themThongTin,thanhKeo,namCham,hatBay}=taoBan(app,chu);
    const Y0=1.62, XM=3.1, XD=3.95;
    hop(10.2,.24,3.7,0,-.1,0,mat.den);hop(8.6,.13,.27,0,.22,0,mat.thep);
    const source=cau(.36,0,Y0,0,mat.tim);vong(.47,.05,0,Y0,0,mat.dong);hop(.5,1.25,.5,0,.85,0,mat.thep);
    nhan('nguon',0,2.42,0);themThongTin(source,'nguon','tt-nguon');

    // Hai trạm đo: nam châm quay quanh trục chùm, hai đèn báo ở hai cửa ra.
    const may=[-1,1].map((side,i)=>{
      const x=side*XM;
      hop(.8,1.0,.7,x,.55,0,mat.thep);
      const o=new THREE.Group();o.position.set(x,Y0,0);scene.add(o);
      // Hai cực nam châm của bàn chung (cùng kiểu Bài 26), giữ màu tự sáng mat.do, mat.xanh như Bài 26.
      const {nhom:nam,cucTren:tren,cucDuoi:duoi}=namCham({dai:.9},o);nam.scale.set(1,.55,.55);
      for(const [c,vl] of [[tren,mat.do],[duoi,mat.xanh]]){c.material.dispose();c.material=vl;}
      const ring=vong(.62,.025,0,0,0,mat.dong,o);ring.rotation.y=Math.PI/2;
      const den=[1,-1].map(k=>{const d=cau(.09,side*(XD-x),k*.45,0,k>0?mat.do:mat.xanh,o);return d;});
      for(const k of [1,-1])hop(.05,.05,.05,side*(XD-x+.12),k*.45,0,mat.thep,o);
      nhan(i?'bob':'alice',x,2.75,0);themThongTin(tren,i?'bob':'alice','tt-may');themThongTin(duoi,i?'bob':'alice','tt-may');
      return {o,den,sang:[0,0]};
    });

    // Sổ ghi: hai trạm ghi riêng; chỉ khi ghép theo số thứ tự lần phát mới thấy tương quan.
    const cv=document.createElement('canvas');cv.width=1024;cv.height=360;
    const g2=cv.getContext('2d'),tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
    const so0=new THREE.Mesh(new THREE.PlaneGeometry(5.4,1.9),new THREE.MeshBasicMaterial({map:tex,transparent:true}));
    so0.position.set(0,3.75,-1.4);scene.add(so0);themThongTin(so0,'so-ghi','tt-so-ghi');

    // Cặp hạt đang bay: hai hạt cùng một màu. Nguồn biến ẩn: màu chính là hướng λ mang theo.
    // Nhóm hạt bay của bàn chung: mọi hạt trong một lượt vẽ.
    const K=48, hat=hatBay(2*K,{banKinh:.065});
    const C=new THREE.Color();
    const cap=Array.from({length:K},()=>({song:false,t:0,kq:[1,-1],g:[0,0],to:0,da:[false,false],so:0}));
    const rng=taoNgauNhien(2703);

    let a=0,b=0,che='mot',an=false,gio=0,cuoi=-1,tich=0,soPhat=0,keo=[false,false];
    let N=0,tong=0,nA=0,nB=0; const N4=[0,0,0,0],T4=[0,0,0,0];
    const ghi=[];
    const tay=[];
    const goc4=()=>[[0,90],[b,-b]];
    // Đếm lại từ đầu: bỏ cả các cặp đang bay, vì kết quả của chúng đã rút theo nguồn và trục cũ.
    function xoaDem(){N=tong=nA=nB=0;N4.fill(0);T4.fill(0);ghi.length=0;
      for(let i=0;i<K;i++)if(cap[i].song){cap[i].song=false;hat.an(2*i).an(2*i+1);}
      hat.xong();veSo();}
    function quay(i,v){may[i].o.rotation.x=v*Math.PI/180;}
    const doi=(i,v,drag)=>{if(i===0){a=v;if(che==='chsh'&&drag){che='mot';chonChe.dat('mot');}}else b=v;
      if(drag)keo[i]=true;tay[i](v);quay(0,che==='chsh'?0:a);quay(1,b);xoaDem();};
    for (const [i,x] of [[0,-2.2],[1,2.2]]) {
      tay.push(thanhKeo({k:i?'goc-b':'goc-a',x:0,y:.31,z:1.3,min:-180,max:180,dau:x-1.55,cuoi:x+1.55,buoc:1,donVi:v=>so(v,0)+'°',doi:(v,dr)=>doi(i,v,dr)}));
    }
    const chonChe=app.bang.chon({nhan:chu('che-do'),luaChon:[{giaTri:'mot',nhan:chu('mot-cap')},{giaTri:'chsh',nhan:chu('bon-cach')}],giaTri:'mot',khiDoi:v=>{che=v;quay(0,che==='chsh'?0:a);xoaDem();}});
    const chonNguon=app.bang.chon({nhan:chu('loai-nguon'),luaChon:[{giaTri:'lt',nhan:chu('luong-tu')},{giaTri:'an',nhan:chu('bien-an')}],giaTri:'lt',khiDoi:v=>{an=v==='an';xoaDem();}});
    app.bang.chuThich(chu('do-thi'));
    const dt2=app.bang.doThi(160);

    function datTatCa({aa=a,bb=b,ch=che,nguon=an}){a=aa;b=bb;che=ch;an=nguon;tay[0](a);tay[1](b);chonChe.dat(che);chonNguon.dat(an?'an':'lt');
      quay(0,che==='chsh'?0:a);quay(1,b);keo=[false,false];xoaDem();
      // Bốn cách đặt máy: đếm sẵn một loạt cặp (cùng mô hình, cùng bộ số ngẫu nhiên) để |S| đếm được đã ổn định ngay khi
      // vào bước. Với vài chục cặp, sai số còn cỡ ±0,4 nên nguồn biến ẩn có thể ra |S| > 2 chỉ vì thăng giáng.
      if(che==='chsh')demSan(an?DEM_SAN_AN:DEM_SAN);}
    const DEM_SAN=1200, DEM_SAN_AN=4000, N_DU=100;
    function demSan(n){const G=goc4();
      for(let k=0;k<n;k++){const to=Math.floor(rng()*4),ga=G[0][TO_HOP[to][0]],gb=G[1][TO_HOP[to][1]];
        const [A,B]=an?layCapAn(ga,gb,rng()*360):layCap(ga,gb,rng);
        N++;tong+=A*B;nA+=A>0;nB+=B>0;N4[to]++;T4[to]+=A*B;soPhat++;
        if(k>=n-7)ghi.unshift([soPhat,ga,A,gb,B]);}
      if(ghi.length>7)ghi.length=7;veSo();}
    function lenh(k){
      const g={song:[0,0],vuong:[0,90],nguoc:[0,180],toiUu:[0,45],doiA:[90,b],latB:[a,-b]};
      if(g[k])datTatCa({aa:g[k][0],bb:g[k][1]});
      if(k==='toiUu')datTatCa({bb:45,ch:che});
      if(k==='chsh')datTatCa({bb:45,ch:'chsh'});
      if(k==='doiNguon')datTatCa({nguon:!an});
    }
    function buoc(i){
      const g=[[0,0],[0,0],[0,30],[0,90],[0,45],[0,45],[0,10],[0,45]][i];
      datTatCa({aa:g[0],bb:g[1],ch:i>=5?'chsh':'mot',nguon:i===5});
    }

    function phat(){
      const p=cap.find(o=>!o.song);if(!p)return;
      let ga=a,gb=b,to=-1;
      if(che==='chsh'){to=Math.floor(rng()*4);const G=goc4();ga=G[0][TO_HOP[to][0]];gb=G[1][TO_HOP[to][1]];}
      const lambda=rng()*360;
      p.kq=an?layCapAn(ga,gb,lambda):layCap(ga,gb,rng);
      p.g=[ga,gb];p.to=to;p.t=0;p.song=true;p.da=[false,false];p.so=++soPhat;
      const i=cap.indexOf(p);C.setHSL(an?lambda/360:rng(),.75,.68);hat.datMau(2*i,C).datMau(2*i+1,C);
    }
    function ghiCap(p){
      const [A,B]=p.kq;N++;tong+=A*B;nA+=A>0;nB+=B>0;
      if(p.to>=0){N4[p.to]++;T4[p.to]+=A*B;}
      ghi.unshift([p.so,p.g[0],A,p.g[1],B]);if(ghi.length>7)ghi.length=7;
      veSo();
      if(gio-cuoi>.9){app.am.tich({tanSo:A===B?750:420,doTo:.15});cuoi=gio;}
    }
    function veSo(){
      const W=cv.width,H=cv.height;g2.clearRect(0,0,W,H);
      g2.fillStyle='rgba(10,22,34,.86)';g2.strokeStyle='rgba(127,202,255,.35)';g2.lineWidth=3;
      g2.beginPath();g2.roundRect(4,4,W-8,H-8,18);g2.fill();g2.stroke();
      const cot=[70,230,370,560,700,880];
      g2.font='600 26px -apple-system, "Helvetica Neue", sans-serif';g2.textAlign='center';g2.textBaseline='middle';
      g2.fillStyle='#8a8d9a';
      ['#',chu('truc')+' A','A',chu('truc')+' B','B','A·B'].forEach((t,j)=>g2.fillText(t,cot[j],34));
      g2.fillStyle='rgba(255,255,255,.12)';g2.fillRect(470,16,2,H-32);
      g2.font='500 28px "SF Mono", Menlo, monospace';
      ghi.forEach((r,k)=>{const y=76+k*39,mo=1-k*.11;g2.globalAlpha=mo;
        g2.fillStyle='#8a8d9a';g2.fillText(String(r[0]),cot[0],y);
        g2.fillStyle='#eceae4';g2.fillText(so(r[1],0)+'°',cot[1],y);g2.fillText(so(r[3],0)+'°',cot[3],y);
        for(const [j,v] of [[2,r[2]],[4,r[4]]]){g2.fillStyle=v>0?'#ffa975':'#71dbe9';g2.fillText(v>0?'+1':'−1',cot[j],y);}
        const t=r[2]*r[4];g2.fillStyle=t>0?'#f3c66f':'#ff7aa8';g2.fillText(t>0?'+1':'−1',cot[5],y);
      });
      g2.globalAlpha=1;tex.needsUpdate=true;
    }
    veSo();

    function capNhat(dt){
      if(dt<=0)return;dt=Math.min(dt,.1);gio+=dt;
      tich=Math.min(tich+dt*16,3);while(tich>=1){tich-=1;phat();}
      for(const m of may)for(let k=0;k<2;k++){m.sang[k]=Math.max(0,m.sang[k]-dt*3);m.den[k].scale.setScalar(.09*(1+.5*m.sang[k]));}
      for(let i=0;i<K;i++){const p=cap[i];
        if(!p.song)continue;
        p.t+=dt*.95;
        if(p.t>=1.25){p.song=false;ghiCap(p);
          for(const j of [0,1]){hat.an(2*i+j);may[j].sang[p.kq[j]>0?0:1]=1;}
          continue;}
        for(const j of [0,1]){const side=j?1:-1;
          if(p.t>=1&&!p.da[j]){p.da[j]=true;quay(j,p.g[j]);}
          const th=p.g[j]*Math.PI/180;
          const x=side*(p.t<1?XM*p.t:XM+(XD-XM)*(p.t-1)/.25), d=p.t<1?0:.45*(p.t-1)/.25*p.kq[j];
          hat.dat(2*i+j,x,Y0+d*Math.cos(th),d*Math.sin(th));
        }
      }
      hat.xong();
    }
    const Ef=()=>an?tuongQuanAn:tuongQuan;
    function veDoThi(){
      const g=dt2.ctx,{X,Y}=khungDoThi(g,{rong:dt2.rong,cao:dt2.cao,x0:-180,x1:180,y0:-1,y1:1,nhanX:'a − b',nhanY:'E',
        vachX:[[-180,'−180°'],[-90,'−90°'],[0,'0°'],[90,'90°'],[180,'180°']],vachY:[[-1,'−1'],[0,'0'],[1,'1']]});
      for(const [f,mau,dam] of [[tuongQuan,MAU.vang,!an],[tuongQuanAn,MAU.hong,an]]){
        g.strokeStyle=mau;g.globalAlpha=dam?1:.35;g.lineWidth=dam?2.2:1.2;g.setLineDash(f===tuongQuanAn?[5,3]:[]);g.beginPath();
        for(let d=-180;d<=180;d+=4){const yy=Y(f(d,0));d>-180?g.lineTo(X(d),yy):g.moveTo(X(d),yy);}g.stroke();
      }
      g.setLineDash([]);g.globalAlpha=1;
      const diem=(d,E,n)=>{const e=saiSoE(E,n);g.strokeStyle=MAU.do;g.lineWidth=1.5;g.beginPath();g.moveTo(X(d),Y(Math.max(-1,E-e)));g.lineTo(X(d),Y(Math.min(1,E+e)));g.stroke();
        g.fillStyle=MAU.do;g.beginPath();g.arc(X(d),Y(E),3.5,0,7);g.fill();};
      const hieu=d=>{d=((d+180)%360+360)%360-180;return d;};
      if(che==='chsh'){const G=goc4();TO_HOP.forEach(([i,j],k)=>{if(N4[k])diem(hieu(G[0][i]-G[1][j]),T4[k]/N4[k],N4[k]);});}
      else if(N)diem(hieu(a-b),tong/N,N);
    }
    function sDem(){const E=TO_HOP.map((_,k)=>N4[k]?T4[k]/N4[k]:0);const S=E[0]+E[1]+E[2]-E[3];
      const e=Math.sqrt(TO_HOP.reduce((s,_,k)=>s+saiSoE(E[k],N4[k])**2,0));return [S,e,Math.min(...N4)];}
    function dat(k){const e=tuongQuan(a,b);
      if(k==='zero')return keo.some(Boolean)&&Math.abs(e)<.018;
      if(k==='cung')return keo.some(Boolean)&&e>.995;
      return k==='bell'&&keo[1]&&!an&&Math.abs(chsh(b))>2.8;
    }
    const qt=v=>N?so(v/N,3):'—';
    // Ô số liệu 5 dòng, dòng đầu là đại lượng lý thuyết của bước; số cặp đã ghi đi kèm giá trị đếm được (N = …).
    const soCap=()=>' (N = '+so(N,0)+')';
    function hud(){veDoThi();
      if(che==='chsh'){const [S,e,nMin]=sDem();
        return [['|S| '+chu('ly-thuyet'),so(Math.abs(chshVoi(Ef(),b)),3)],[chu('loai-nguon'),chu(an?'bien-an':'luong-tu')],
          [chu('truc')+' A',"0° / 90°"],[chu('truc')+' B',so(b,0)+'° / '+so(-b,0)+'°'],
          // Chưa đủ mỗi cách đặt máy N_DU cặp thì chưa hiện |S|: sai số lớn, con số dễ làm hiểu sai.
          ['|S| ('+chu('dem')+')',nMin>=N_DU?so(Math.abs(S),3)+' ± '+so(e,3)+soCap():N?chu('chua-du')+soCap():'—']];
      }
      const E=Ef()(a,b);
      return [['E(a,b) '+chu('ly-thuyet'),so(E,3)],[chu('goc-a'),so(a,0)+'°'],[chu('goc-b'),so(b,0)+'°'],
        ['E ('+chu('dem')+')',N?so(tong/N,3)+' ± '+so(saiSoE(tong/N,N),3)+soCap():'—'],['P(A+) / P(B+) ('+chu('dem')+')',qt(nA)+' / '+qt(nB)]];
    }
    return {scene,buoc,capNhat,lenh,dat,hud};
  }
};
