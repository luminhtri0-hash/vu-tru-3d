import * as THREE from 'three';
import { banVe, chuCuaBai } from './ban-do-luong-tu.js';
import { kep, goNhanDeNhau } from '../khung/ve.js';
import { domSang } from '../khung/do-vat-chung.js';
import { so } from '../vat-ly/hang-so.js';
import { khungDoThi } from '../khung/giao-dien.js';
import { nangLuongPhoton, tanSoNguong, dongNang, chuyenDong, viTriElectron, thoiGianTrongKhe, C_NM_THZ } from '../vat-ly/quang-dien.js';
import { baiQuangDien } from '../noi-dung/quang-dien.js';
import goc from '../ngon-ngu/vi/quang-dien.json' with { type: 'json' };

const id = 'quang-dien', chu = chuCuaBai(id, goc);
const thaoTac = [
  ['mot', c => c.phatMot()], ['chon', c => c.dat({ f: 600 })], ['thu', c => c.dat({ f: 400 })],
  ['doi', c => c.dat({ luong: 2 })], ['tang', c => c.dat({ f: 800 })], ['ham', c => c.dat({ U: 0.30 })],
  ['thay', c => c.dat({ W: 3 })], ['goc', c => c.dat({ f: 600, W: 2, U: 0, luong: 1 })],
];
const buoc = baiQuangDien.baiGiang.buoc.map((b, i) => {
  const [ten, ham] = thaoTac[i];
  const k = { ...b, vao: c => c.moBuoc(i), nut: { [ten]: ham } };
  if (b.thuThach) k.thuThach = { ...b.thuThach, giu: 0.45, kiem: c => c.datThach(i) };
  return k;
});

// Màu nhìn thấy của bước sóng trong chân không (xấp xỉ quen dùng của D. Bruton), màu sRGB.
// Ngoài miền nhìn thấy chỉ là màu minh hoạ: tử ngoại tím, hồng ngoại đỏ thẫm.
export function mauBuocSong(nm, c = new THREE.Color()) {
  let r = 0, g = 0, b = 0;
  if (nm < 380) { r = 0.5; b = 0.85; }
  else if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else r = 1;
  let k = 1;
  if (nm > 700) k = 0.35 + 0.65 * kep((780 - nm) / 80, 0, 1);
  else if (nm < 420) k = 0.45 + 0.55 * kep((nm - 380) / 40, 0, 1);
  return c.setRGB(r * k, g * k, b * k, THREE.SRGBColorSpace);
}

export default {
  ...baiQuangDien, id, baiGiang: { ...baiQuangDien.baiGiang, buoc },
  mayAnh: { viTri: [4.4, 5.0, 12.6], dich: [-0.4, 0.95, 0.45], fov: 37, min: 5, max: 20, hep: 0.5 },
  hinh: { quang: 0.32, nguong: 1.0 }, nhacNen: null,
  tao(app) {
    const { scene, hop, kim, nhan, dong, xam } = banVe(app);
    // Nhãn tránh nhau (trên điện thoại cảnh thu nhỏ nên nhãn hai đầu ray và nhãn điểm quay đầu dễ chạm nhau):
    // tên dụng cụ và điểm quay đầu ngang hàng nhau, số đếm, điện áp, ngưỡng ở giữa, nhãn hai đầu ray thấp nhất.
    const nhomNhan = [];
    const kimToi = kim(0x233844);
    const bac = new THREE.MeshStandardMaterial({ color: 0xc9d3dc, metalness: 1, roughness: 0.22 });
    const thepToi = new THREE.MeshStandardMaterial({ color: 0x4d6372, metalness: 0.8, roughness: 0.35 });
    const kinh = new THREE.MeshStandardMaterial({ color: 0xa8d8ff, metalness: 0, roughness: 0.4, envMapIntensity: 0.12, transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide });
    const X0 = -1.38, X1 = 2.55, Y = 1.45, XS = -3.65;
    // Chân đỡ: nguồn, catốt, bản thu.
    for (const x of [XS, X0, X1]) {
      hop(0.58, 0.23, 1.6, x, 0.02, 0, xam);
      hop(0.12, 0.62, 0.12, x, 0.42, 0, dong);
    }
    // Ống chân không bằng thủy tinh bao catốt và bản thu; hai vành đồng ở hai đầu.
    const XO0 = X0 - 0.62, XO1 = X1 + 0.45, RO = 1.08;
    const ong = new THREE.Mesh(new THREE.CylinderGeometry(RO, RO, XO1 - XO0, 48, 1, true), kinh);
    ong.rotation.z = Math.PI / 2; ong.position.set((XO0 + XO1) / 2, Y, 0); ong.renderOrder = 2; scene.add(ong);
    for (const x of [XO0, XO1]) {
      const v = new THREE.Mesh(new THREE.TorusGeometry(RO, 0.05, 10, 64), dong);
      v.rotation.y = Math.PI / 2; v.position.set(x, Y, 0); scene.add(v);
    }
    const nap = new THREE.Mesh(new THREE.CircleGeometry(RO, 48), kinh);
    nap.rotation.y = -Math.PI / 2; nap.position.set(XO0, Y, 0); nap.renderOrder = 2; scene.add(nap);
    const napSau = nap.clone(); napSau.position.x = XO1; scene.add(napSau);
    // Nguồn sáng: thân trụ tối, vành đồng, kính phát màu theo bước sóng.
    const than = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.49, 0.9, 40), kimToi);
    than.rotation.z = Math.PI / 2; than.position.set(XS, Y, 0); scene.add(than);
    for (const dx of [-0.3, 0.05, 0.4]) {
      const v = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.025, 8, 48), dong);
      v.rotation.y = Math.PI / 2; v.position.set(XS + dx, Y, 0); scene.add(v);
    }
    const mauNguon = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const kinhNguon = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 40), mauNguon);
    kinhNguon.rotation.z = Math.PI / 2; kinhNguon.position.set(XS + 0.46, Y, 0); scene.add(kinhNguon);
    // Chùm sáng hình nón mờ từ nguồn tới catốt; độ đậm theo thông lượng.
    const chumVl = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const chum = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, X0 - XS - 0.55, 32, 1, true), chumVl);
    chum.rotation.z = Math.PI / 2; chum.position.set((XS + 0.49 + X0 - 0.06) / 2, Y, 0); scene.add(chum);
    // Catốt kim loại sáng bóng; bản thu là lưới thép.
    const catot = hop(0.1, 1.3, 1.3, X0, Y, 0, bac);
    const thu = hop(0.1, 1.55, 1.55, X1, Y, 0, thepToi);
    for (let j = -3; j <= 3; j++) hop(0.03, 1.42, 0.03, X1 - 0.07, Y, 0.2 * j, kimToi);
    for (let j = -3; j <= 3; j++) hop(0.03, 0.03, 1.42, X1 - 0.07, Y + 0.2 * j, 0, kimToi);
    // Mạch ngoài: hộp nguồn điện áp hãm trên bàn, hai dây nối catốt và bản thu.
    const hopDien = hop(1.0, 0.42, 0.6, 0.6, 0.06, -1.9, kimToi);
    hop(0.62, 0.2, 0.02, 0.6, 0.1, -1.59, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x0d2420) }));
    const day = new THREE.MeshStandardMaterial({ color: 0xb04a3a, roughness: 0.6 });
    const dayXanh = new THREE.MeshStandardMaterial({ color: 0x3a6fb0, roughness: 0.6 });
    for (const [x, vl] of [[X0, day], [X1, dayXanh]]) {
      hop(0.04, 0.04, 1.9, x, 0.14, -0.95, vl);
      hop(Math.abs(x - 0.6) - 0.5, 0.04, 0.04, (x + 0.6) / 2 + (x < 0.6 ? -0.25 : 0.25), 0.14, -1.9, vl);
    }
    const nhanU = nhan('', 0.6, 0.55, -1.9, 'tran');
    // Mốc «điểm quay đầu» của electron nhanh nhất: một khung mảnh màu cam trong khe.
    const mocVl = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a73).multiplyScalar(1.6), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
    const moc = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.46, 40), mocVl);
    moc.rotation.y = Math.PI / 2; moc.position.set(X1, Y, 0); moc.visible = false; scene.add(moc);
    const nhanMoc = nhan(chu('diem-quay'), X1, Y + 0.68, 0, 'hong'); nhanMoc.hien(false);

    const demNguon = nhan('', XS, 0.78, 0.72, 'tran'), demThu = nhan('', X1 + 0.35, 0.78, 0.9, 'tran');
    const nhanQuay = { nhan: nhanMoc, uuTien: 70, tat: true };
    nhomNhan.push({ nhan: nhan(chu('nguon'), XS, 2.2, 0, 'mo'), uuTien: 70 }, { nhan: nhan(chu('catot'), X0, 2.35, 0, 'vang'), uuTien: 70 },
      { nhan: nhan(chu('ban-thu'), X1, 2.45, 0, 'xanh'), uuTien: 70 }, nhanQuay,
      { nhan: demNguon, uuTien: 50 }, { nhan: demThu, uuTien: 50 }, { nhan: nhanU, uuTien: 50 });
    app.tt.them(than, { ten: chu('nguon'), moTa: chu('nguon-tip') });
    app.tt.them(catot, { ten: chu('catot'), moTa: chu('catot-tip') });
    app.tt.them(thu, { ten: chu('ban-thu'), moTa: chu('thu-tip') });
    app.tt.them(ong, { ten: chu('ong'), moTa: chu('ong-tip'), noiBat: false });
    app.tt.them(hopDien, { ten: chu('dien-ap'), moTa: chu('mach-tip'), noiBat: false });

    // Photon: vệt sáng dài màu theo bước sóng. Electron: chấm tròn hồng sáng, khác hẳn hình dạng.
    const mauPhoton = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mauE = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff7aa8).multiplyScalar(2.4) });
    const geoP = new THREE.SphereGeometry(0.07, 14, 10), geoE = new THREE.SphereGeometry(0.075, 14, 10);
    const hat = Array.from({ length: 24 }, () => {
      const p = new THREE.Mesh(geoP, mauPhoton), e = new THREE.Mesh(geoE, mauE);
      p.scale.set(3, 0.7, 0.7); p.visible = e.visible = false; scene.add(p, e);
      return { p, e, tuoi: 0, kenh: 0, z: 0, y: Y };
    });
    // Chớp hấp thụ trên mặt catốt.
    const chop = Array.from({ length: 10 }, () => { const s = domSang(0xffffff, 0.5, 2.2); s.visible = false; scene.add(s); return { s, t: 9 }; });
    let chopI = 0;
    const ts = { f: 600, W: 2, U: 0, luong: 1 };
    let chay = true, dem = 0, daThu = 0, du = 0, t = 0, amCuoi = -2, keoF = false, keoU = false, hudCho = 0;
    let hieuUng = chuyenDong(ts.f, ts.W, ts.U);
    let nutF, nutU;
    const XN = -2.55, D = 4.8, ZF = 1.25, ZU = 2.05, YR = 0.16;
    const Xf = f => XN + D * (f - 350) / 650, Xu = u => XN + D * u / 2;
    const vachVl = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd8e6ee).multiplyScalar(0.7) });
    function ray(z, nhanTrai, nhanPhai, vach) {
      hop(D, 0.045, 0.10, XN + D / 2, YR, z, xam);
      hop(D, 0.012, 0.16, XN + D / 2, YR - 0.03, z, kimToi);
      for (const v of vach) hop(0.014, 0.07, 0.014, v, YR + 0.05, z - 0.08, vachVl);
      for (const x of [XN, XN + D]) hop(0.05, 0.16, 0.14, x, YR, z, dong);
      nhomNhan.push({ nhan: nhan(nhanTrai, XN - 0.55, YR + 0.02, z, 'tran'), uuTien: 20 },
        { nhan: nhan(nhanPhai, XN + D + 0.6, YR + 0.02, z, 'tran'), uuTien: 20 });
    }
    ray(ZF, '350 THz', '1000 THz', [400, 500, 600, 700, 800, 900].map(Xf));
    ray(ZU, '0 V', '2 V', [0.5, 1, 1.5].map(Xu));
    // Vạch ngưỡng trên ray tần số: sáng xanh lục, dời theo công thoát đang chọn.
    const vachNguong = hop(0.03, 0.2, 0.2, Xf(tanSoNguong(2)), YR + 0.06, ZF, new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8fe3a8).multiplyScalar(1.8) }));
    const nhanNguong = nhan(chu('nguong'), Xf(tanSoNguong(2)), YR + 0.32, ZF - 0.32, 'tran');
    nhomNhan.push({ nhan: nhanNguong, uuTien: 50 });
    function tay(z, khoa, mau, x, doiGiaTri) {
      return app.tt.tayNam({ viTri: [x, YR, z], mau, co: 0.17, ten: chu(khoa), nhan: chu(khoa),
        rangBuoc: { kieu: 'duong', qua: [0, YR, z], huong: [1, 0, 0] },
        gioiHan: p => { p.x = kep(p.x, XN, XN + D); return p; }, khiKeo: p => doiGiaTri((p.x - XN) / D) });
    }
    nutF = tay(ZF, 'keo-f', 0x79aaff, Xf(ts.f), v => { keoF = true; dat({ f: Math.round(350 + 650 * v) }); });
    nutU = tay(ZU, 'keo-u', 0xffc371, Xu(ts.U), v => { keoU = true; dat({ U: Math.round(200 * v) / 100 }); });
    const bang = app.bang;
    const fUI = bang.thanhTruot({ nhan: chu('tan-so'), min: 350, max: 1000, buoc: 1, giaTri: ts.f, hienThi: v => so(v, 0) + ' THz', khiDoi: v => { keoF = true; dat({ f: v }); } });
    const uUI = bang.thanhTruot({ nhan: chu('dien-ap'), min: 0, max: 2, buoc: 0.01, giaTri: 0, hienThi: v => so(v, 2) + ' V', khiDoi: v => { keoU = true; dat({ U: v }); } });
    const wUI = bang.chon({ nhan: chu('cong-thoat'), giaTri: 2, luaChon: [2, 2.5, 3].map(v => ({ giaTri: v, nhan: so(v, 1) + ' eV' })), khiDoi: v => dat({ W: v }) });
    const lUI = bang.thanhTruot({ nhan: chu('thong-luong'), min: 1, max: 4, buoc: 1, giaTri: 1, hienThi: v => '×' + so(v, 0), khiDoi: v => dat({ luong: v }) });
    const doThi = bang.doThi(145);
    function veDoThi() {
      const g = doThi.ctx;
      const { X, Y } = khungDoThi(g, { rong: doThi.rong, cao: doThi.cao,
        x0: 350, x1: 1000, y0: 0, y1: 2.3, nhanX: 'f (THz)', nhanY: 'K (eV)',
        vachX: [400, 600, 800, 1000], vachY: [0, 1, 2], le: [36, 16, 20, 26] });
      for (const W of [2, 2.5, 3]) {
        g.strokeStyle = W === ts.W ? '#79e0d8' : '#617986';
        g.lineWidth = W === ts.W ? 2.5 : 1;
        g.beginPath(); g.moveTo(X(tanSoNguong(W)), Y(0)); g.lineTo(X(1000), Y(dongNang(1000, W))); g.stroke();
      }
      g.fillStyle = '#ffcc80';
      g.beginPath(); g.arc(X(ts.f), Y(hieuUng.K), 4, 0, 2 * Math.PI); g.fill();
    }
    const mauTam = new THREE.Color();
    function dat(chon) {
      Object.assign(ts, chon); hieuUng = chuyenDong(ts.f, ts.W, ts.U);
      fUI.dat(ts.f); uUI.dat(ts.U); wUI.dat(ts.W); lUI.dat(ts.luong);
      nutF.dat([Xf(ts.f), YR, ZF]); nutU.dat([Xu(ts.U), YR, ZU]);
      mauBuocSong(C_NM_THZ / ts.f, mauTam);
      mauPhoton.color.copy(mauTam).multiplyScalar(2.6);
      mauNguon.color.copy(mauTam).multiplyScalar(2.2);
      chumVl.color.copy(mauTam); chumVl.opacity = 0.05 + 0.03 * ts.luong;
      for (const c of chop) c.s.material.color.copy(mauTam).multiplyScalar(2.4);
      const xNg = Xf(tanSoNguong(ts.W));
      vachNguong.position.x = xNg; nhanNguong.position.x = xNg;
      // Điểm quay đầu chỉ có nghĩa khi electron không tới được bản thu.
      const quay = hieuUng.coHat && ts.U > 0 && !hieuUng.thuDuoc;
      moc.visible = quay; nhanMoc.hien(quay); nhanQuay.tat = !quay;
      if (quay) { const x = X0 + 0.06 + (X1 - X0 - 0.12) * hieuUng.diemQuay; moc.position.x = x; nhanMoc.position.x = x; }
      nhanU.datChu('U = ' + so(ts.U, 2) + ' V');
      for (const h of hat) h.p.visible = h.e.visible = false;
      dem = 0; daThu = 0; du = 0; hudCho = 0; veDoThi();
    }
    function phat() {
      const h = hat.find(h => !h.p.visible && !h.e.visible); if (!h) return;
      h.kenh = 0; h.tuoi = 0; h.z = 0.26 * Math.sin(dem * 2.4); h.y = Y + 0.32 * Math.cos(dem * 2.4);
      h.p.visible = true; h.p.position.set(XS + 0.55, h.y, h.z); dem++;
    }
    function phatMot() { chay = false; phat(); }
    function chopTai(y, z) {
      const c = chop[chopI++ % chop.length]; c.t = 0; c.s.visible = true; c.s.position.set(X0 - 0.07, y, z);
    }
    function capNhat(dt) {
      goNhanDeNhau(nhomNhan);
      if (dt <= 0) return;
      t += dt; du += chay ? dt * ts.luong * 2 : 0;
      while (du >= 1) { du--; phat(); }
      for (const h of hat) {
        if (h.kenh === 0) {
          if (!h.p.visible) continue;
          h.tuoi += dt;
          const XA = XS + 0.55;
          h.p.position.x = XA + (X0 - 0.08 - XA) * Math.min(1, h.tuoi / 0.55);
          if (h.tuoi < 0.55) continue;
          h.p.visible = false; chopTai(h.y, h.z);
          if (!hieuUng.coHat) continue;
          h.tuoi -= 0.55; h.kenh = 1; h.e.visible = true; h.e.position.set(X0, h.y, h.z);
        }
        if (!h.e.visible) continue;
        h.tuoi += dt;
        const { K, thuDuoc } = hieuUng;
        if (h.tuoi >= thoiGianTrongKhe(K, ts.U)) {
          h.e.visible = false;
          if (thuDuoc) { daThu++; if (t - amCuoi > 0.9) { app.am.tich({ tanSo: 720, dai: 0.04, doTo: 0.20 }); amCuoi = t; } }
        } else h.e.position.x = X0 + 0.06 + (X1 - X0 - 0.12) * viTriElectron(K, ts.U, h.tuoi);
      }
      for (const c of chop) {
        if (!c.s.visible) continue;
        c.t += dt; const k = 1 - c.t / 0.3;
        if (k <= 0) c.s.visible = false; else c.s.scale.setScalar(0.25 + 0.4 * k);
      }
      hudCho -= dt;
      if (hudCho <= 0) {
        hudCho = 0.1;
        demNguon.datChu(chu('photon') + ': <b>' + so(dem, 0) + '</b>');
        demThu.datChu(chu('electron') + ': <b>' + so(daThu, 0) + '</b>');
      }
    }
    // Ô số liệu theo bước (tối đa 5 dòng): dòng đầu là số chính của bước. Số photon tới đã có nhãn đếm cạnh nguồn
    // nên không lặp lại ở đây. Chỉ số trỏ vào mảng dòng trong hud():
    // 0 photon tới · 1 electron đã thu · 2 bước sóng · 3 năng lượng photon · 4 động năng cực đại · 5 điện áp hãm
    const HUD_BUOC = [[3, 1, 4, 2, 5], [3, 2, 4, 1, 5], [4, 3, 2, 1, 5], [1, 4, 3, 2, 5], [4, 3, 2, 1, 5], [5, 4, 3, 1, 2], [4, 3, 2, 1, 5], [5, 4, 3, 2, 1]];
    let buocNay = 0;
    function moBuoc(i) {
      buocNay = i;
      chay = true; keoF = false; keoU = false;
      dat({ f: [600, 500, 400, 600, 600, 600, 800, 600][i], W: i === 6 ? 3 : 2, U: i === 5 ? 0.70 : 0, luong: 1 });
      phat();
    }
    return { scene, capNhat, dat, phatMot, moBuoc,
      datThach(i) {
        if (i === 2) return keoF && ts.W === 2 && hieuUng.K >= 0.03 && hieuUng.K <= 0.09;
        if (i === 5) return keoU && ts.U > 0 && hieuUng.diemQuay >= 0.75 && hieuUng.diemQuay <= 0.85;
        return i === 6 && keoF && ts.W === 3 && hieuUng.K >= 0.45 && hieuUng.K <= 0.55;
      },
      hud() {
        const ds = [[chu('photon'), so(dem, 0)], [chu('electron'), so(daThu, 0)], [chu('buoc-song'), so(C_NM_THZ / ts.f, 0) + ' nm'], [chu('nang-luong'), so(nangLuongPhoton(ts.f), 2) + ' eV'], [chu('dong-nang'), so(hieuUng.K, 2) + ' eV'], [chu('dien-ap'), so(ts.U, 2) + ' V']];
        return (HUD_BUOC[buocNay] || HUD_BUOC[0]).map((k) => ds[k]);
      },
    };
  },
};
