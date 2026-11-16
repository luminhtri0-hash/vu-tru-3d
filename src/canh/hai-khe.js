import * as THREE from 'three';
import { taoNhan, taoNgauNhien, kep } from '../khung/ve.js';
import { dungPhong } from '../khung/ban-thi-nghiem-luong-tu.js';
import { so } from '../vat-ly/hang-so.js';
import { MAC_DINH, RONG_NUA_MAN, khoangVan, nutBao, lechPha, bao, matDo, lapBangTichLuy, viTriHat, datThuThach } from '../vat-ly/hai-khe.js';
import { noiDungHaiKhe } from '../noi-dung/hai-khe.js';
import { dich } from '../ngon-ngu/dich.js';
import banGoc from '../ngon-ngu/vi/hai-khe.json' with { type: 'json' };

const chu = (khoa, giaTri) => dich('hai-khe', 'canh.' + khoa, banGoc['canh.' + khoa], giaTri);
const GOC = { viTri: [6.3, 4.4, 9.2], dich: [0, 1.45, -0.55], fov: 36, min: 3.5, max: 23, hep: 0.4 };
const Z_MAN = -2.8, Z_KHE = 0.45;
const NUA_MAN = 3.1, CAO_MAN = 3.1, Y_MAN = 2.03;
const SO_DIEM = 2400;

function taoBangVe() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  function ve(ts, coDuong) {
    const w = canvas.width, h = canvas.height;
    const co = ctx.createLinearGradient(0, 0, 0, h);
    co.addColorStop(0, '#102a36'); co.addColorStop(0.60, '#08161c'); co.addColorStop(1, '#09131a');
    ctx.fillStyle = co; ctx.fillRect(0, 0, w, h);
    const X = (x) => w * (x / RONG_NUA_MAN + 1) / 2;
    const nen = h - 33, bienDo = 0.27 * h;
    ctx.lineWidth = 1;
    for (let i = -12; i <= 12; i++) {
      const x = X(i / 10);
      ctx.strokeStyle = i % 5 === 0 ? '#38515a' : '#1c363f';
      ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x, nen + 3); ctx.stroke();
    }
    ctx.font = '17px system-ui, sans-serif'; ctx.fillStyle = '#b2cbd0'; ctx.textAlign = 'center';
    for (const x of [-1, -0.5, 0, 0.5, 1]) ctx.fillText(so(x, x % 1 ? 1 : 0), X(x), h - 9);
    ctx.fillText('mm', w - 22, h - 9);
    ctx.strokeStyle = '#65909c'; ctx.beginPath(); ctx.moveTo(0, nen); ctx.lineTo(w, nen); ctx.stroke();
    if (coDuong) {
      for (const [ham, mau, net] of [[bao, '#d8aa68', [5, 5]], [matDo, '#6ee9e9', []]]) {
        ctx.strokeStyle = mau; ctx.lineWidth = 2.8; ctx.setLineDash(net); ctx.beginPath();
        for (let i = 0; i <= w; i += 2) {
          const x = (2 * i / w - 1) * RONG_NUA_MAN;
          const y = nen - ham(x, ts) * bienDo;
          if (i === 0) ctx.moveTo(i, y); else ctx.lineTo(i, y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    tex.needsUpdate = true;
  }
  return { tex, ve };
}

export default {
  id: 'hai-khe', ...noiDungHaiKhe, mayAnh: GOC,
  hinh: { quang: 0.26, nguong: 1.1 }, nhacNen: null,
  tao(app) {
    const scene = new THREE.Scene();
    // Phòng thí nghiệm dùng chung của các bài lượng tử: vòm nền, sàn, ba đèn, phản chiếu mềm.
    dungPhong(scene, app, { sanY: -1.3 });

    const kim = (color, metalness = 0.4) => new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.38 });
    const than = kim(0x293b49), chan = kim(0x101e2c), dong = kim(0xb67a43), nhom = kim(0x84a8b0);
    const xanh = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x73e4ed).multiplyScalar(1.55) });
    const vang = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffcb76).multiplyScalar(1.4) });
    const khoi = new THREE.BoxGeometry(1, 1, 1);
    function hop(w, h, sau, x, y, z, mat) {
      const o = new THREE.Mesh(khoi, mat);
      o.scale.set(w, h, sau); o.position.set(x, y, z); scene.add(o); return o;
    }
    function tru(r1, r2, len, x, y, z, mat, docZ = false) {
      const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 32), mat);
      if (docZ) o.rotation.x = Math.PI / 2;
      o.position.set(x, y, z); scene.add(o); return o;
    }
    function nhan(text, x, y, z, lop) {
      const o = taoNhan(chu(text), lop, { giua: true });
      o.position.set(x, y, z); scene.add(o); return o;
    }

    // Bàn quang học và hai thanh dẫn. Khe và khoảng cách dọc bàn được phóng theo các tỉ lệ khác nhau.
    hop(7.25, 0.26, 7.8, 0, -0.25, 0.0, chan);
    for (const x of [-3.3, 3.3]) for (const z of [-3.6, 3.6]) hop(0.24, 0.92, 0.24, x, -0.84, z, than);
    for (const x of [-1.0, 1.0]) {
      hop(0.14, 0.12, 6.8, x, -0.05, 0.0, nhom);
      hop(0.035, 0.02, 6.8, x, 0.02, 0.0, than);
    }
    for (const x of [-2.75, 2.75]) {
      hop(0.52, 0.25, 0.88, x, 0.03, Z_MAN, than);
      hop(0.19, 0.52, 0.21, x, 0.33, Z_MAN, nhom);
    }
    // Màn phẳng có mép kim loại, thước mm và đường dự đoán sơn trên mặt màn.
    const bangVe = taoBangVe();
    hop(2 * NUA_MAN + 0.22, CAO_MAN + 0.20, 0.16, 0, Y_MAN, Z_MAN - 0.13, than);
    const tamMan = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * NUA_MAN, CAO_MAN),
      new THREE.MeshBasicMaterial({ map: bangVe.tex, toneMapped: false }),
    );
    tamMan.position.set(0, Y_MAN, Z_MAN); scene.add(tamMan);
    for (const x of [-NUA_MAN - 0.055, NUA_MAN + 0.055]) hop(0.038, CAO_MAN, 0.045, x, Y_MAN, Z_MAN - 0.02, dong);
    nhan('man', 1.35, Y_MAN + CAO_MAN/2 + 0.15, Z_MAN, 'xanh');
    app.tt.them(tamMan, { ten: chu('man'), moTa: chu('phat-hien'), noiBat: false });

    const Y_NGUON = 1.58;
    tru(0.72, 0.81, 0.22, 0, 0.10, 2.95, than);
    tru(0.13, 0.2, 1.4, 0, 0.87, 2.95, nhom);
    const sung = tru(0.42, 0.45, 1.15, 0, Y_NGUON, 3.03, than, true);
    for (const z of [2.59, 2.8, 3.32, 3.52]) tru(0.46, 0.46, 0.085, 0, Y_NGUON, z, dong, true);
    tru(0.23, 0.36, 0.38, 0, Y_NGUON, 2.35, nhom, true);
    const denNguon = tru(0.18, 0.18, 0.075, 0, Y_NGUON, 2.13, xanh, true);
    nhan('nguon', 0, 2.26, 3.17, 'dam');
    // Chùm electron mờ từ súng tới tấm chắn (chỉ cho biết chùm chiếu cả hai khe, không vẽ quỹ đạo từng hạt).
    const chum = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.9, 2.13 - Z_KHE - 0.1, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x73e4ed, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    chum.rotation.x = Math.PI / 2; chum.position.set(0, Y_NGUON, (2.13 + Z_KHE + 0.1) / 2); scene.add(chum);
    app.tt.them(sung, { ten: chu('nguon'), moTa: chu('mo-ta-nguon'), khiBam: () => tungHat(false) });

    // Ba lá chắn đặc, hai khoảng trống là các khe thật trong hình học.
    const tiLeKhe = 0.0024;
    const mep = 1.34, nuaRongKhe = MAC_DINH.a * tiLeKhe;
    const la = [-1, 0, 1].map(() => hop(1, 1.58, 0.13, 0, 1.58, Z_KHE, than));
    const canhKhe = [-1, 1].map(() => hop(0.027, 1.58, 0.03, 0, 1.58, Z_KHE + 0.08, xanh));
    const napKhe = hop(2*nuaRongKhe, 1.58, 0.16, 0, 1.58, Z_KHE, dong);
    for (const y of [0.75,2.41]) hop(2*mep+0.2, 0.09, 0.22, 0, y, Z_KHE, dong);
    for (const x of [-mep,mep]) tru(0.07,0.1,0.8,x,0.37,Z_KHE,nhom);
    nhan('khe', -0.62, 2.65, Z_KHE, 'dam');

    const ts = { ...MAC_DINH };
    const phanBo = new Float64Array(1024), ngauNhien = taoNgauNhien(41021);
    const mang = new Float32Array(3 * SO_DIEM);
    const geoDiem = new THREE.BufferGeometry();
    const toaDo = new THREE.BufferAttribute(mang,3).setUsage(THREE.DynamicDrawUsage);
    geoDiem.setAttribute('position', toaDo); geoDiem.setDrawRange(0,0);
    const diem = new THREE.Points(geoDiem, new THREE.PointsMaterial({ color: new THREE.Color(0x83f4ed).multiplyScalar(1.55), size: 0.035, sizeAttenuation: true }));
    diem.frustumCulled = false; scene.add(diem);
    const dauDoc = hop(0.018, CAO_MAN - 0.08, 0.025, 0, Y_MAN, Z_MAN + 0.049, vang);
    let xDoc = 0, daKeoKhe = false, daKeoDau = false;
    let soHat = 0, toc = 0, duHat = 0, lanTieng = -Infinity, gio = 0, coDuong = true;
    function layViTriKhe() { return ts.d * tiLeKhe; }
    const tayKhe = app.tt.tayNam({
      viTri: [layViTriKhe(),2.42,Z_KHE + 0.12], mau: 0x6cd4f1, co: 0.10,
      rangBuoc: { kieu:'duong', qua:[0,2.42,Z_KHE+0.12], huong:[1,0,0] },
      gioiHan: (p) => { p.x = kep(p.x,100*tiLeKhe,450*tiLeKhe); return p; },
      ten: chu('d'), nhan: chu('keo-khe'), moTa: () => chu('mo-ta-khe',[so(ts.d,0)]),
      khiKeo: (p) => { daKeoKhe = true; doi({ d: Math.round(p.x / tiLeKhe) }); },
    });
    const tayDoc = app.tt.tayNam({
      viTri: [0,0.59,Z_MAN+0.1], mau: 0xffbc5a, co: 0.11,
      rangBuoc: { kieu:'duong', qua:[0,0.59,Z_MAN+0.1], huong:[1,0,0] },
      gioiHan: (p) => { p.x = kep(p.x,-NUA_MAN,NUA_MAN); return p; },
      ten: chu('dau-doc'), nhan: chu('keo-doc'), moTa: () => chu('mo-ta-doc',[so(xDoc,3),so(matDo(xDoc,ts),3)]),
      khiKeo: (p) => { xDoc=p.x*RONG_NUA_MAN/NUA_MAN; dauDoc.position.x=p.x; daKeoDau=true; },
    });
    function viTriLa() {
      const d = layViTriKhe();
      const trai = [-mep, -d + nuaRongKhe, d + nuaRongKhe];
      const phai = [-d - nuaRongKhe, d - nuaRongKhe, mep];
      for (let i=0;i<3;i++) {
        la[i].scale.x=phai[i]-trai[i]; la[i].position.x=(trai[i]+phai[i])/2;
      }
      canhKhe[0].position.x= -d - nuaRongKhe;
      canhKhe[1].position.x= d + nuaRongKhe;
      napKhe.position.x=d; napKhe.visible=!ts.hai;
      tayKhe.dat([d,2.42,Z_KHE+0.12]);
    }
    function xoa() {
      soHat=0; duHat=0; geoDiem.setDrawRange(0,0);
    }
    function themHat(n, coTieng = true) {
      for(let j=0;j<n;j++) {
        const i=soHat % SO_DIEM;
        const x=viTriHat(phanBo,ngauNhien(),ngauNhien());
        toaDo.setXYZ(i,x*NUA_MAN/RONG_NUA_MAN,Y_MAN + 0.42 + (ngauNhien()-0.5)*1.84,Z_MAN+0.027);
        soHat++;
        if (coTieng && gio-lanTieng>=0.90) {
          app.am.tich({tanSo: 820, dai:0.03, doTo:0.22, lech:x/RONG_NUA_MAN});
          lanTieng=gio;
        }
      }
      toaDo.needsUpdate=true;
      geoDiem.setDrawRange(0,Math.min(soHat,SO_DIEM));
    }

    const bang = app.bang;
    const dkD = bang.thanhTruot({ nhan:chu('d'), min:100, max:450, buoc:1, giaTri:200,
      hienThi:v=>so(v,0)+' nm', khiDoi:v=>{ daKeoKhe=true; doi({d:v}); } });
    const dkL = bang.thanhTruot({ nhan:chu('lambda'), min:25,max:100,buoc:1,giaTri:50,
      hienThi:v=>so(v,0)+' pm', khiDoi:v=>doi({lambda:v}) });
    const dkV = bang.thanhTruot({ nhan:chu('v'), min:0,max:1,buoc:0.05,giaTri:1,
      hienThi:v=>so(v,2),khiDoi:v=>doi({v}) });
    const dkHai = bang.congTac({ nhan:chu('hai'),giaTri:true,khiDoi:hai=>doi({hai}) });
    const dkToc = bang.thanhTruot({ nhan:chu('toc-do'),min:0,max:120,buoc:1,giaTri:6,
      hienThi:v=>so(v,0),khiDoi:v=>tocDo(v) });
    const dkDuong = bang.congTac({nhan:chu('duong'),giaTri:true,khiDoi:v=>duong(v)});
    bang.nut([{nhan:chu('mot'),khiBam:()=>tungHat(false)},{nhan:chu('xoa'),khiBam:xoa},
      {nhan:chu('can'),khiBam:nhinMan},{nhan:chu('toan'),khiBam:nhinToan}]);
    bang.chuThich(chu('chu-thich'));
    function capNhatThietBi() {
      lapBangTichLuy(phanBo,ts); bangVe.ve(ts,coDuong); viTriLa();
      dkD.dat(ts.d); dkL.dat(ts.lambda); dkV.dat(ts.v); dkHai.dat(ts.hai);
    }
    function doi(changes) {
      if (Object.entries(changes).every(([k,v])=>ts[k]===v)) return;
      Object.assign(ts,changes); xoa(); capNhatThietBi();
    }
    function duong(b) { coDuong=b; dkDuong.dat(b); bangVe.ve(ts,b); }
    function tocDo(v) { toc=v; dkToc.dat(v); }
    function tungHat(reset) { tocDo(0); if(reset)xoa(); themHat(1); }
    function nhinMan() { app.bayToi([0,4.75,3.1],[0,2.0,Z_MAN],0.65); }
    function nhinToan() { app.bayToi(GOC.viTri,GOC.dich,0.65); }
    // Ô số liệu theo bước (tối đa 5 dòng): dòng đầu là số chính của bước; chỉ số trỏ vào mảng dòng trong hud().
    // 0 đã ghi · 1 khoảng vân · 2 nút đầu của bao · 3 đầu đọc · 4 mật độ tại đầu đọc · 5 độ lệch pha
    const HUD_BUOC=[[0,1,3,4,5],[0,1,4,3,2],[2,1,0,4,3],[3,4,5,1,0],[1,0,2,3,4],[1,2,0,3,4],[3,4,1,2,0],[0,1,2,3,4]];
    let buocNay=0;
    function buoc(i) {
      buocNay=i;
      Object.assign(ts,MAC_DINH); ts.hai=i!==2; coDuong=i!==0&&i!==1&&i!==7;
      daKeoDau=false; daKeoKhe=false; xDoc=0; dauDoc.position.x=0;
      tayDoc.dat([0,0.59,Z_MAN+0.1]);
      xoa(); capNhatThietBi(); dkDuong.dat(coDuong);
      tocDo(i===0 ? 6 : 100); themHat([1,16,220,410,410,460,380,1250][i],false);
      nhinToan();
    }
    function capNhat(dt) {
      if (!(dt>0)) return;
      gio+=dt; duHat+=dt*toc;
      const n=Math.floor(duHat);
      if(n>0) { duHat-=n; themHat(n); }
      denNguon.scale.setScalar(1+0.055*Math.sin(gio*3.6));
    }
    function hud() {
      const ds=[[chu('tong'),so(soHat,0)], [chu('van'),ts.hai&&ts.v>0 ? so(khoangVan(ts),3)+' mm' : chu(ts.hai?'mat-van':'chi-mot')],
        [chu('nut-bao'),so(nutBao(ts),2)+' mm'], [chu('dau-doc'),'x = '+so(xDoc,3)+' mm'],
        [chu('mat-do'),so(matDo(xDoc,ts),3)], [chu('pha'),so(lechPha(xDoc,ts)/Math.PI,2)+' π']];
      return (HUD_BUOC[buocNay]||HUD_BUOC[0]).map(k=>ds[k]);
    }
    return {scene,buoc,capNhat,hud,xoa,tungHat,tocDo,duong,doi,nhinToan,nhinMan,
      dat:ten=>datThuThach(ten,ts,xDoc,daKeoKhe,daKeoDau)};
  },
};
