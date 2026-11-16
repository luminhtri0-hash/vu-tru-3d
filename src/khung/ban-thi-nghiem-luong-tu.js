// Bàn thí nghiệm lượng tử dùng chung cho chín bài của Phần 6 (và cho bài mới cần một «phòng thí nghiệm»).
//
// Cách gọi (luôn truyền `app` mà tao(app) của bài nhận được):
//   dungPhong(scene, app, { sanY, phanChieu })   phòng: vòm nền, sàn, ba đèn, phản chiếu mềm cho kim loại
//   taoBan(app, chu)                             cảnh + bàn dụng cụ: { scene, mat, hop, cau, vong, nhan, themThongTin,
//                                                thanhKeo, namCham, muiTen, hatBay, trucDoThi }
//   taoBanDoThi(app)                             cảnh + mặt bàn có lưới để vẽ đồ thị: { scene, hop, kim, nhan, net, nen,
//                                                dong, xam, muiTen, hatBay, trucDoThi }
// Các phần dùng chung, gọi rời cũng được (không cần bàn):
//   taoNamCham({ dai, mauBac, mauNam })          hai cực nam châm kiểu Stern–Gerlach (cực trên vát nhọn, cực dưới có rãnh)
//   taoMuiTen({ dai, mau, banKinh })             mũi tên 3D: datDai(d), datHuong(x, y, z), datMau(mau)
//   taoHatBay(soHat, { banKinh, mau })           nhóm hạt bay trong MỘT lượt vẽ: dat(i, x, y, z, tiLe), an(i), datMau(i, mau), xong()
//   taoTrucDoThi({ goc, rong, cao, x, y, … })    hai trục có vạch chia và nhãn số: X(gt), Y(gt), diem(gtX, gtY)
// Đổi màu một nhãn đã dựng: nhan.datMau('vang' | 0xff8a73 | null) (xem taoNhan trong ve.js).
//
// Mọi thứ dựng một lần lúc tạo cảnh: không thêm lượt hậu kỳ, chỉ dùng vật liệu cơ bản và vật liệu có ánh sáng tiêu chuẩn
// (cùng chương trình đổ bóng với các bài cũ dùng taoDenCanh).

import * as THREE from 'three';
import { taoNhan, DuongDay } from './ve.js';
import { layMoiTruong, taoKetCau, RoundedBoxGeometry } from './do-vat-chung.js';
import { appDangChay } from './app-dang-chay.js';

// ---------- Phòng ----------
let _vomG = null, _sanTex = null;
function vomNen() {
  if (!_vomG) {
    _vomG = new THREE.SphereGeometry(60, 32, 16);
    const p = _vomG.attributes.position, mau = new Float32Array(p.count * 3);
    const tren = new THREE.Color(0x0a1524), chan = new THREE.Color(0x152a3d), duoi = new THREE.Color(0x04070c), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 60;
      if (y >= 0) c.copy(chan).lerp(tren, Math.pow(y, 0.55)); else c.copy(chan).lerp(duoi, Math.min(1, -y * 3));
      mau.set([c.r, c.g, c.b], i * 3);
    }
    _vomG.setAttribute('color', new THREE.BufferAttribute(mau, 3));
  }
  const o = new THREE.Mesh(_vomG, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false }));
  o.renderOrder = -10; o.frustumCulled = false; o.name = 'vom-nen';
  return o;
}
function sanNen(y) {
  if (!_sanTex) {
    _sanTex = taoKetCau(512, 512, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, '#1d3346'); r.addColorStop(0.35, '#122233'); r.addColorStop(0.75, '#08111b'); r.addColorStop(1, 'rgba(5,9,14,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
      // Ô lát sàn mờ dần ra xa, để mắt có thước đo chiều sâu.
      g.globalCompositeOperation = 'source-atop';
      for (let i = 0; i <= 32; i++) {
        const x = (i / 32) * w, k = 1 - Math.abs(i / 32 - 0.5) * 2;
        g.strokeStyle = `rgba(120,170,200,${0.05 * k})`; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
        g.beginPath(); g.moveTo(0, x); g.lineTo(w, x); g.stroke();
      }
    });
  }
  const o = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), new THREE.MeshBasicMaterial({ map: _sanTex, transparent: true, depthWrite: false }));
  o.rotation.x = -Math.PI / 2; o.position.y = y; o.renderOrder = -9; o.name = 'san-nen';
  return o;
}
// «Phòng thí nghiệm»: vòm nền chuyển màu, sàn tối có vầng sáng dưới bàn, bộ ba đèn (chính ấm, viền lạnh phía sau, phụ
// yếu) và môi trường phản chiếu mềm cho kim loại. app: ứng dụng (lấy bộ dựng hình để tạo môi trường phản chiếu); bài cũ
// không truyền thì dùng ứng dụng đang chạy.
export function dungPhong(scene, app, { sanY = -1.2, phanChieu = 0.32 } = {}) {
  app = app || appDangChay();
  scene.background = new THREE.Color(0x060b13);
  scene.add(vomNen(), sanNen(sanY));
  scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x1b2532, 0.95));
  for (const [mau, cuongDo, x, y, z] of [[0xffe2bd, 2.5, -3, 7, 5], [0x6fb8ff, 2.3, 4, 4, -6], [0xa9c8ff, 0.55, 6, 2, 7]]) {
    const den = new THREE.DirectionalLight(mau, cuongDo);
    den.position.set(x, y, z); scene.add(den);
  }
  const env = layMoiTruong(app?.renderer);
  if (env) { scene.environment = env; scene.environmentIntensity = phanChieu; }
}

// ---------- Các phần dùng chung ----------
const HOP_G = new THREE.BoxGeometry(1, 1, 1);
let _thanG = null, _dauG = null, _hatG = null;
const sangLen = (mau, k = 1.25) => new THREE.Color(mau).multiplyScalar(k);

// Hai cực nam châm kiểu Stern–Gerlach. Mặt cắt nằm trong mặt phẳng z–y của nhóm (trục đo là y), kéo dài `dai` dọc chùm
// hạt (trục x). Cực trên vát nhọn, cực dưới có rãnh: từ trường mạnh dần về phía mũi nhọn nên có gradient dọc trục đo.
// Trả về { nhom, cucTren, cucDuoi, khung }; quay cả máy quanh chùm hạt bằng nhom.rotation.x.
const CUC_TREN = [[-0.46, 0.98], [0.46, 0.98], [0.46, 0.46], [0.07, 0.2], [-0.07, 0.2], [-0.46, 0.46]];
const CUC_DUOI = [[-0.46, -0.98], [0.46, -0.98], [0.46, -0.26], [0.15, -0.26], [0.15, -0.44], [-0.15, -0.44], [-0.15, -0.26], [-0.46, -0.26]];
function hinhCuc(diem, dai) {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(diem.map(([u, v]) => new THREE.Vector2(u, v))), { depth: dai, bevelEnabled: false });
  g.translate(0, 0, -dai / 2); g.rotateY(Math.PI / 2);
  return g;
}
export function taoNamCham({ dai = 1.3, mauBac = 0xffa975, mauNam = 0x71dbe9, khung = true, vatLieuKhung = null } = {}) {
  const nhom = new THREE.Group();
  // Màu cực tự sáng một phần để nhận ra từ xa, phần còn lại để đèn của phòng tạo khối (mặt vát, rãnh nhìn rõ).
  // Màu nền của vật liệu chỉ lấy 55% màu cực, bề mặt nhám: trước bản 3.8 dùng nguyên màu (màu phấn sáng) nên mặt trên của
  // cực, nơi ba ngọn đèn cùng chiếu, vượt ngưỡng sáng và loá thành trắng khi máy quay nghiêng xuống nhìn từ trên.
  const vl = (mau) => new THREE.MeshStandardMaterial({ color: new THREE.Color(mau).multiplyScalar(0.55), roughness: 0.72, metalness: 0.05, emissive: mau, emissiveIntensity: 0.3 });
  const cucTren = new THREE.Mesh(hinhCuc(CUC_TREN, dai), vl(mauBac));
  const cucDuoi = new THREE.Mesh(hinhCuc(CUC_DUOI, dai), vl(mauNam));
  nhom.add(cucTren, cucDuoi);
  let tamKhung = null;
  if (khung) {
    tamKhung = new THREE.Mesh(HOP_G, vatLieuKhung || new THREE.MeshStandardMaterial({ color: 0x7a98a8, roughness: 0.28, metalness: 0.75 }));
    tamKhung.scale.set(dai, 2.1, 0.16); tamKhung.position.z = -0.56;
    nhom.add(tamKhung);
  }
  return { nhom, cucTren, cucDuoi, khung: tamKhung };
}

// Mũi tên 3D (thân trụ, đầu nón): gốc ở (0, 0, 0) của nhóm, chỉ theo +y. Phát sáng nhẹ (màu nhân `sang`).
//   mt.datDai(d)            đổi độ dài (thân co giãn, đầu giữ cỡ)
//   mt.datHuong(x, y, z)    quay cho mũi tên chỉ theo véc-tơ này
//   mt.datMau(mau)          đổi màu
export function taoMuiTen({ dai = 1, mau = 0xf3c66f, banKinh = 0.03, sang = 1.25 } = {}) {
  if (!_thanG) { _thanG = new THREE.CylinderGeometry(1, 1, 1, 12); _thanG.translate(0, 0.5, 0); _dauG = new THREE.ConeGeometry(1, 1, 16); _dauG.translate(0, 0.5, 0); }
  const vl = new THREE.MeshBasicMaterial({ color: sangLen(mau, sang) });
  const than = new THREE.Mesh(_thanG, vl), dau = new THREE.Mesh(_dauG, vl);
  const mt = new THREE.Group();
  mt.add(than, dau);
  const daiDau = banKinh * 6.6, rongDau = banKinh * 2.8;
  dau.scale.set(rongDau, daiDau, rongDau);
  const _y = new THREE.Vector3(0, 1, 0), _h = new THREE.Vector3();
  mt.datDai = (d) => { const t = Math.max(0, d - daiDau); than.scale.set(banKinh, Math.max(1e-4, t), banKinh); dau.position.y = t; mt.visible = d > 1e-4; return mt; };
  mt.datHuong = (x, y, z) => { _h.set(x, y, z); if (_h.lengthSq() > 1e-12) mt.quaternion.setFromUnitVectors(_y, _h.normalize()); return mt; };
  mt.datMau = (m) => { vl.color.copy(sangLen(m, sang)); return mt; };
  mt.datDai(dai);
  return mt;
}

// Nhóm hạt bay (photon, electron, nguyên tử): mọi hạt vẽ trong MỘT lượt (InstancedMesh). Tâm của nhóm đứng yên trong khi
// hạt bay khắp bàn, nên phải tắt việc «cắt khi ra ngoài tầm nhìn» (frustumCulled = false), nếu không cả đám hạt biến mất
// khi tâm nhóm ra khỏi khung hình. Hạt chưa dùng nằm ẩn (cỡ 0).
//   hb.dat(i, x, y, z, tiLe = 1)   đặt hạt thứ i (tiLe: phóng to, thu nhỏ so với bán kính gốc)
//   hb.an(i)                       ẩn hạt thứ i
//   hb.datMau(i, mau)              màu riêng của hạt thứ i (THREE.Color hoặc số 0xRRGGBB)
//   hb.xong()                      gọi MỘT lần sau khi đặt xong các hạt trong khung hình
export function taoHatBay(soHat, { banKinh = 0.05, mau = 0xffffff, sang = 1 } = {}) {
  if (!_hatG) _hatG = new THREE.SphereGeometry(1, 10, 8);
  const vat = new THREE.InstancedMesh(_hatG, new THREE.MeshBasicMaterial({ color: 0xffffff }), soHat);
  vat.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  vat.frustumCulled = false;
  const m = new THREE.Matrix4(), c = new THREE.Color();
  const goc = sangLen(mau, sang);
  m.makeScale(0, 0, 0);
  for (let i = 0; i < soHat; i++) { vat.setMatrixAt(i, m); vat.setColorAt(i, goc); }
  let doiMau = true;
  const hb = {
    vat, soHat,
    dat(i, x, y, z, tiLe = 1) { const r = banKinh * tiLe; m.makeScale(r, r, r).setPosition(x, y, z); vat.setMatrixAt(i, m); return hb; },
    an(i) { m.makeScale(0, 0, 0); vat.setMatrixAt(i, m); return hb; },
    datMau(i, mauHat) { vat.setColorAt(i, mauHat?.isColor ? mauHat : c.set(mauHat)); doiMau = true; return hb; },
    xong() { vat.instanceMatrix.needsUpdate = true; if (doiMau && vat.instanceColor) { vat.instanceColor.needsUpdate = true; doiMau = false; } return hb; },
  };
  return hb;
}

// Hai trục đồ thị dựng trong cảnh: trục ngang dài `rong` (theo +x), trục đứng cao `cao` (theo +y), gốc ở `goc`.
//   x: [x0, x1], y: [y0, y1]      khoảng giá trị của hai trục
//   vachX, vachY                  các vạch chia: số, hoặc [giá trị, 'chữ hiện'] ; nhanX, nhanY: tên trục (đặt ở đầu trục)
// Trả về { nhom, X(gt), Y(gt), diem(gtX, gtY) → [x, y, z] trong cảnh, nhan: { x, y, vachX[], vachY[] } }.
export function taoTrucDoThi({ goc = [0, 0, 0], rong = 4, cao = 2, x = [0, 1], y = [0, 1], vachX = [], vachY = [], nhanX = '', nhanY = '', mau = 0x9fb6c4, lopNhan = 'mo tran' } = {}) {
  const nhom = new THREE.Group();
  nhom.position.set(goc[0], goc[1], goc[2]);
  const X = (gt) => ((gt - x[0]) / (x[1] - x[0])) * rong, Y = (gt) => ((gt - y[0]) / (y[1] - y[0])) * cao;
  const truc = new DuongDay(3, { mau, rong: 2, doMo: 0.9, cong: false });
  truc.dat(0, 0, cao, 0); truc.dat(1, 0, 0, 0); truc.dat(2, rong, 0, 0); truc.xong(3);
  nhom.add(truc.line);
  const vlVach = new THREE.MeshBasicMaterial({ color: mau });
  const nhan = { x: null, y: null, vachX: [], vachY: [] };
  const vach = (ngang, v) => {
    const [gt, chu] = Array.isArray(v) ? v : [v, String(v)];
    const o = new THREE.Mesh(HOP_G, vlVach);
    if (ngang) { o.scale.set(0.012, 0.07, 0.012); o.position.set(X(gt), -0.035, 0); } else { o.scale.set(0.07, 0.012, 0.012); o.position.set(-0.035, Y(gt), 0); }
    nhom.add(o);
    if (chu === '') return;
    const n = taoNhan(chu, lopNhan, { giua: ngang });
    if (ngang) { n.position.set(X(gt), -0.1, 0); n.center.set(0.5, 0); } else { n.position.set(-0.1, Y(gt), 0); n.center.set(1, 0.5); n.element.style.marginLeft = '0'; }
    nhom.add(n);
    (ngang ? nhan.vachX : nhan.vachY).push(n);
  };
  for (const v of vachX) vach(true, v);
  for (const v of vachY) vach(false, v);
  if (nhanX) { nhan.x = taoNhan(nhanX, lopNhan); nhan.x.position.set(rong + 0.05, 0, 0); nhom.add(nhan.x); }
  if (nhanY) { nhan.y = taoNhan(nhanY, lopNhan, { giua: true }); nhan.y.position.set(0, cao + 0.05, 0); nhan.y.center.set(0.5, 1); nhom.add(nhan.y); }
  return { nhom, X, Y, diem: (gtX, gtY) => [goc[0] + X(gtX), goc[1] + Y(gtY), goc[2]], nhan };
}

// ---------- Bàn dụng cụ ----------
// Bộ vật liệu và hình học dùng chung của các mô hình lượng tử trên bàn thí nghiệm.
export function taoBan(app, chu) {
  app = app || appDangChay();
  const scene = new THREE.Scene();
  dungPhong(scene, app, { sanY: -0.9 });
  const kim = (color, roughness = 0.34, metalness = 0.5) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const sang = (color) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.3) });
  const mat = { den: kim(0x152531, 0.5, 0.3), thep: kim(0x7a98a8, 0.28, 0.75), dong: kim(0xc08a50, 0.3, 0.8), do: sang(0xffa975), xanh: sang(0x71dbe9), tim: sang(0xa797f5) };
  const hopG = HOP_G;
  const cauG = new THREE.SphereGeometry(1,20,12);
  function dat(hinh, vl, x,y,z, nhom=scene) {
    const o = new THREE.Mesh(hinh,vl); o.position.set(x,y,z); nhom.add(o); return o;
  }
  function hop(w,h,d,x,y,z,vl,nhom) {
    const o=dat(hopG,vl,x,y,z,nhom); o.scale.set(w,h,d); return o;
  }
  function cau(r,x,y,z,vl,nhom) {
    const o=dat(cauG,vl,x,y,z,nhom); o.scale.setScalar(r); return o;
  }
  function vong(r,t,x,y,z,vl,nhom) {
    return dat(new THREE.TorusGeometry(r,t,8,64),vl,x,y,z,nhom);
  }
  function nhan(k,x,y,z,lop='xanh') {
    const el=taoNhan(chu(k),lop,{giua:true}); el.position.set(x,y,z); scene.add(el); return el;
  }
  function themThongTin(o,ten,moTa) {app.tt.them(o,{ten:chu(ten),moTa:chu(moTa),noiBat:false});}
  // Thanh kéo trên bàn: ray đồng có vạch chia, hai chặn đầu bằng thép, tay nắm to và sáng.
  const vachVl = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd79a).multiplyScalar(0.9) });
  function thanhKeo({k,x,y,z,min,max,dau,cuoi,buoc,doi,donVi}) {
    hop(cuoi-dau,.045,.075,(dau+cuoi)/2,y,z,mat.dong);
    hop(cuoi-dau,.012,.13,(dau+cuoi)/2,y-.03,z,mat.den);
    for (let i=0;i<=10;i++) hop(.012,i%5?.05:.09,.012,dau+(cuoi-dau)*i/10,y+.04,z-.05,vachVl);
    for (const xx of [dau,cuoi]) hop(.05,.17,.12,xx,y,z,mat.thep);
    const veX = v => dau + (v-min)/(max-min)*(cuoi-dau);
    const tay=app.tt.tayNam({
      viTri:[veX(x),y,z], ten:chu(k), nhan:chu(k), co:.15, mau:0xffbe68,
      rangBuoc:{kieu:'duong',qua:[0,y,z],huong:[1,0,0]},
      gioiHan:p=>{p.x=THREE.MathUtils.clamp(p.x,dau,cuoi);return p;},
      khiKeo:p=>doi(Math.min(max,Math.max(min,min+buoc*Math.round(((p.x-dau)/(cuoi-dau))*(max-min)/buoc))),true),
    });
    const inp=app.bang.thanhTruot({nhan:chu(k),min,max,buoc,giaTri:x,hienThi:donVi,khiDoi:v=>doi(v,true)});
    return v=>{tay.dat([veX(v),y,z]);inp.dat(v);};
  }
  // Các phần dùng chung, thêm thẳng vào cảnh (hoặc vào `nhom` nếu truyền).
  const them = (o, nhom = scene) => { nhom.add(o); return o; };
  const namCham = (tuyChon = {}, nhom) => { const nc = taoNamCham({ mauBac: 0xffa975, mauNam: 0x71dbe9, vatLieuKhung: mat.thep, ...tuyChon }); them(nc.nhom, nhom); return nc; };
  const muiTen = (tuyChon = {}, nhom) => them(taoMuiTen(tuyChon), nhom);
  const hatBay = (soHat, tuyChon = {}, nhom) => { const hb = taoHatBay(soHat, tuyChon); them(hb.vat, nhom); return hb; };
  const trucDoThi = (tuyChon = {}, nhom) => { const t = taoTrucDoThi(tuyChon); them(t.nhom, nhom); return t; };
  return {scene,mat,hop,cau,vong,nhan,themThongTin,thanhKeo,namCham,muiTen,hatBay,trucDoThi};
}

// ---------- Bàn vẽ đồ thị ----------
// Mặt bàn bo cạnh, viền đồng, lưới mờ, bốn chân xuống sàn của «phòng» dùng chung; mỗi cảnh vẫn tự điều khiển tham số và
// vật lý của mình. (Trước bản 3.7 hàm này nằm ở src/canh/ban-do-luong-tu.js dưới tên banVe và lấy bộ dựng hình qua biến
// dò lỗi window.__vt; tên cũ vẫn dùng được, xem tệp đó.)
export function taoBanDoThi(app) {
  app = app || appDangChay();
  const scene=new THREE.Scene();
  dungPhong(scene,app,{sanY:-1.25});
  const box=HOP_G;
  const kim=(color)=>new THREE.MeshStandardMaterial({color,metalness:0.42,roughness:0.36});
  const hop=(w,h,d,x,y,z,mat)=>{const o=new THREE.Mesh(box,mat);o.scale.set(w,h,d);o.position.set(x,y,z);scene.add(o);return o;};
  const nhan=(chu,x,y,z,lop)=>{const o=taoNhan(chu,lop,{giua:true});o.position.set(x,y,z);scene.add(o);return o;};
  const nen=kim(0x253e50),dong=kim(0xb27d4d),xam=kim(0x526e7b);
  const matBan=new THREE.MeshStandardMaterial({color:0x1b3040,metalness:0.25,roughness:0.55});
  const vienBan=new THREE.MeshStandardMaterial({color:0xc08a50,metalness:0.85,roughness:0.3});
  const ban=new THREE.Mesh(new RoundedBoxGeometry(8.9,0.28,5.4,2,0.06),matBan);ban.position.set(0,-0.3,0);scene.add(ban);
  for(const z of [-2.52,2.52])hop(8.8,0.05,0.06,0,-0.13,z,vienBan);
  for(const x of [-4.36,4.36])hop(0.06,0.05,5.0,x,-0.13,0,vienBan);
  for(const x of [-3.9,3.9])for(const z of [-2.2,2.2])hop(0.22,0.8,0.22,x,-0.84,z,xam);
  const luoi=new THREE.GridHelper(8,16,0x4f6a73,0x2a3e48);
  luoi.material.transparent=true;luoi.material.opacity=0.75;
  luoi.scale.z=0.61;luoi.position.y=-0.153;scene.add(luoi);
  function net(mau,soDiem=180,rong=3.5) {
    const d=new DuongDay(soDiem,{mau,rong,sang:1.7,quang:0.1});
    scene.add(d.line);
    return d;
  }
  const them = (o, nhom = scene) => { nhom.add(o); return o; };
  const muiTen = (tuyChon = {}, nhom) => them(taoMuiTen(tuyChon), nhom);
  const hatBay = (soHat, tuyChon = {}, nhom) => { const hb = taoHatBay(soHat, tuyChon); them(hb.vat, nhom); return hb; };
  const trucDoThi = (tuyChon = {}, nhom) => { const t = taoTrucDoThi(tuyChon); them(t.nhom, nhom); return t; };
  return {scene,hop,kim,nhan,net,nen,dong,xam,muiTen,hatBay,trucDoThi};
}
