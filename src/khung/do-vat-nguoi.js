// Phi hành gia: bộ đồ trắng có nếp gấp ở khớp, vòng khớp kim loại, mũ có kính phản chiếu ánh vàng, đèn mũ,
// ba lô dưỡng sinh, hộp điều khiển trước ngực, ống dẫn, găng, giày. Có xương khớp và tư thế, chuyển mượt.
//
// Gốc toạ độ: giữa hai đế giày, trên mặt sàn. Người quay mặt về +z, đầu hướng +y. Cao mặc định 1,8 (mét).
// «Trái», «phải» là tay chân trái, phải của chính phi hành gia: khi người nhìn về +z thì tay trái ở phía +x.

import * as THREE from 'three';
import { LoXo, vlKimLoai, vlSon, vlBong, vlSang, ketCau, hopBo, demTamGiac } from './do-vat-chung.js';

const D = Math.PI / 180;
const H0 = 1.8;                 // chiều cao mẫu; thu phóng theo tuỳ chọn cao
const CHAN = 0.085;             // khớp cổ chân cách mặt đất
const L_DUI = 0.43, L_CANG = 0.43;
const Y_HONG = CHAN + L_DUI + L_CANG;   // khớp háng khi đứng thẳng
const Y_EO = 0.13;              // eo (khớp thân) so với háng
const Y_VAI = 0.38;             // khớp vai so với eo
const X_VAI = 0.215, X_HONG = 0.095;
const L_CANH = 0.28, L_CANGTAY = 0.255;
const ZT = 0.68;                // thân dẹt theo chiều trước sau

// ---------------------------------------------------------------- tư thế
// Góc tính bằng độ, chiều dương là chiều tự nhiên: vaiX: đưa tay ra trước; vaiZ: dang tay sang bên;
// khuyu, goi: gập; coTay: ngửa bàn tay lên; nam: nắm ngón (0 duỗi, 1 nắm); hongX: đưa đùi ra trước;
// than: cúi người; dau: cúi đầu.
const THAN = {
  dung: { hongX: 2, hongZ: 3, goi: 4, than: 0, dau: 0, loLung: 0, tay: { vaiX: 4, vaiZ: 9, vaiY: 0, khuyu: 14, coTay: 0, nam: 0.35 } },
  'lo-lung': { hongX: 28, hongZ: 8, goi: 54, than: 6, dau: -6, loLung: 1, tay: { vaiX: 36, vaiZ: 34, vaiY: -10, khuyu: 62, coTay: 12, nam: 0.45 } },
  nhun: { hongX: 32, hongZ: 6, goi: 62, than: 22, dau: -14, loLung: 0, tay: { vaiX: -6, vaiZ: 20, vaiY: 0, khuyu: 32, coTay: -6, nam: 0.6 } },
};
const TAY = {
  cam: { vaiX: 38, vaiZ: 70, vaiY: -8, khuyu: 26, coTay: -8, nam: 0.92 },     // giơ tay, bàn tay úp, ngón nắm quanh vật
  tha: { vaiX: 38, vaiZ: 74, vaiY: -8, khuyu: 18, coTay: 26, nam: -0.12 },    // vừa buông: ngửa cổ tay, xoè ngón
};
const KHOA_TAY = ['vaiX', 'vaiZ', 'vaiY', 'khuyu', 'coTay', 'nam'];

// Mặt cắt dọc của một đoạn chi: [t (0 ở khớp trên, 1 ở khớp dưới), bán kính]. Trả về hình tiện tròn.
function doanChi(L, mau, { canh = 11, nap = true } = {}) {
  const p = [];
  const r0 = mau[0][1], r1 = mau[mau.length - 1][1];
  if (nap) { p.push(new THREE.Vector2(0, r0 * 0.5), new THREE.Vector2(r0 * 0.62, r0 * 0.4), new THREE.Vector2(r0 * 0.93, r0 * 0.18)); }
  for (const [t, r] of mau) p.push(new THREE.Vector2(r, -t * L));
  if (nap) { p.push(new THREE.Vector2(r1 * 0.93, -L - r1 * 0.18), new THREE.Vector2(r1 * 0.62, -L - r1 * 0.4), new THREE.Vector2(0, -L - r1 * 0.5)); }
  p.reverse();                                  // LatheGeometry cần điểm đi từ dưới lên để pháp tuyến hướng ra
  return new THREE.LatheGeometry(p, canh);
}
// Nếp gấp dạng ống xếp quanh khớp: chèn các gờ vào mặt cắt.
function nep(t0, t1, r, soGo, cao) {
  const ds = [];
  for (let i = 0; i <= soGo * 2; i++) {
    const t = t0 + ((t1 - t0) * i) / (soGo * 2);
    ds.push([t, r + (i % 2 ? cao : 0)]);
  }
  return ds;
}

export function taoPhiHanhGia({ cao = H0, tuThe = 'dung', tay = 'phai', mauNhan = null, mauDo = 0xbdbab2 } = {}) {
  const nhom = new THREE.Group();
  nhom.name = 'phi-hanh-gia';
  nhom.scale.setScalar(cao / H0);
  const goc = new THREE.Group();            // lớp trôi nhẹ khi lơ lửng
  nhom.add(goc);

  // ---- vật liệu
  const vai = ketCau('vai');
  const vlDo = vlSon(mauDo, 0.78, { bumpMap: vai, bumpScale: 0.35 });
  const vlDoToi = vlSon(0xb4b2ab, 0.7, { bumpMap: vai, bumpScale: 0.35 });
  const vlVo = vlBong(0xc9c7c0, 0.32);       // vỏ cứng: mũ, ba lô, hộp ngực
  const vlXam = vlBong(0x9ea3ad, 0.38);
  const vlKhop = vlKimLoai(0xa9b0bc, 0.28);
  const vlKhopMau = mauNhan != null ? vlKimLoai(mauNhan, 0.3) : vlKimLoai(0x7f8da6, 0.3);
  const vlGang = vlSon(0x8f939b, 0.62, { bumpMap: vai, bumpScale: 1 });
  const vlDe = vlSon(0x26282e, 0.85);
  const vlGiay = vlSon(0x9b9ea5, 0.6, { bumpMap: vai, bumpScale: 1 });
  const vlKinhMu = new THREE.MeshPhysicalMaterial({
    color: 0xd9a646, metalness: 1, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03,
    emissive: 0x3a2405, emissiveIntensity: 0.25, envMapIntensity: 1.4,
  });
  const vlDen = vlSang(0xfff4dc, 1.7);
  const vlDenXanh = vlSang(0x8fe3a8, 1.8);
  const vlNhan = mauNhan != null ? vlSon(mauNhan, 0.55, { emissive: mauNhan, emissiveIntensity: 0.18 }) : null;

  const mesh = (g, m, cha, vi = null) => {
    const o = new THREE.Mesh(g, m);
    if (vi) o.position.set(...vi);
    cha.add(o);
    return o;
  };
  const vong = (r, ong, m, cha, y = 0, sx = 1, sz = 1, canh = 16) => {
    const g = new THREE.TorusGeometry(r, ong, 4, canh);
    g.rotateX(Math.PI / 2); g.scale(sx, 1, sz); g.translate(0, y, 0);
    return mesh(g, m, cha);
  };

  // ---- hông (chậu) — gốc của cả thân
  const hong = new THREE.Group();
  goc.add(hong);
  {
    const p = [[0, -0.075], [0.07, -0.078], [0.125, -0.06], [0.15, -0.02], [0.156, 0.05], [0.15, 0.12], [0.0, 0.13]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(p, 20); g.scale(1.12, 1, 0.74);
    mesh(g, vlDo, hong);
  }

  // ---- thân trên
  const than = new THREE.Group();
  than.position.y = Y_EO;
  hong.add(than);
  {
    const p = [[0, -0.07], [0.12, -0.065], [0.15, -0.035], [0.155, 0.0], [0.152, 0.04], [0.162, 0.1], [0.185, 0.19],
      [0.2, 0.28], [0.2, 0.33], [0.186, 0.385], [0.152, 0.425], [0.1, 0.452], [0.0, 0.462]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(p, 22); g.scale(1.12, 1, ZT);
    mesh(g, vlDo, than);
    vong(0.157, 0.013, vlKhop, than, 0.0, 1.12, ZT, 24);         // vòng ổ bi ở eo
    // hộp điều khiển trước ngực, có núm và đèn báo
    const hop = new THREE.Group();
    hop.position.set(0, 0.235, 0.152); hop.rotation.x = -0.22;
    mesh(hopBo(0.2, 0.105, 0.075, 0.016), vlVo, hop);
    mesh(hopBo(0.17, 0.02, 0.06, 0.006), vlXam, hop, [0, 0.06, 0.004]);
    for (let i = 0; i < 3; i++) {
      const n = new THREE.CylinderGeometry(0.011, 0.011, 0.016, 10);
      n.rotateX(Math.PI / 2);
      mesh(n, vlKhop, hop, [-0.05 + i * 0.05, -0.01, 0.042]);
    }
    mesh(new THREE.SphereGeometry(0.006, 8, 6), vlDenXanh, hop, [0.075, 0.03, 0.039]);
    than.add(hop);
    // ba lô dưỡng sinh
    const bl = new THREE.Group();
    bl.position.set(0, 0.215, -0.212);
    mesh(hopBo(0.36, 0.5, 0.16, 0.04, 3), vlVo, bl);
    mesh(hopBo(0.3, 0.07, 0.13, 0.02), vlXam, bl, [0, 0.27, 0.0]);
    mesh(hopBo(0.26, 0.2, 0.02, 0.008), vlXam, bl, [0, -0.08, -0.083]);
    for (const x of [-0.185, 0.185]) mesh(hopBo(0.02, 0.4, 0.1, 0.008), vlXam, bl, [x, -0.02, 0]);
    than.add(bl);
    // hai ống dẫn từ ba lô vòng ra hộp ngực
    for (const s of [-1, 1]) {
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.15 * s, 0.11, -0.14), new THREE.Vector3(0.245 * s, 0.07, -0.02),
        new THREE.Vector3(0.2 * s, 0.13, 0.13), new THREE.Vector3(0.1 * s, 0.205, 0.175),
      ]);
      mesh(new THREE.TubeGeometry(c, 14, 0.013, 5), vlXam, than);
    }
  }

  // ---- đầu: vòng cổ, mũ, kính vàng, đèn mũ
  const dau = new THREE.Group();
  dau.position.y = 0.45;
  than.add(dau);
  {
    vong(0.112, 0.024, vlKhop, dau, 0.0, 1, 0.92, 24);
    const yM = 0.13, rM = 0.155;
    mesh(new THREE.SphereGeometry(rM, 22, 14), vlVo, dau, [0, yM, 0]);
    const t0 = 0.66, t1 = 1.86, p0 = Math.PI / 2 - 0.98, p1 = Math.PI / 2 + 0.98, rK = rM + 0.005;
    mesh(new THREE.SphereGeometry(rK, 18, 10, p0, p1 - p0, t0, t1 - t0), vlKinhMu, dau, [0, yM, 0]);
    // viền kính: ống chạy theo mép tấm kính
    const ds = [];
    const diem = (ph, th) => new THREE.Vector3(-rK * Math.cos(ph) * Math.sin(th), yM + rK * Math.cos(th), rK * Math.sin(ph) * Math.sin(th));
    const N = 10;
    for (let i = 0; i < N; i++) ds.push(diem(p0 + ((p1 - p0) * i) / N, t0));
    for (let i = 0; i < N / 2; i++) ds.push(diem(p1, t0 + ((t1 - t0) * i) / (N / 2)));
    for (let i = 0; i < N; i++) ds.push(diem(p1 - ((p1 - p0) * i) / N, t1));
    for (let i = 0; i < N / 2; i++) ds.push(diem(p0, t1 - ((t1 - t0) * i) / (N / 2)));
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ds, true, 'centripetal'), 52, 0.0085, 4, true), vlVo, dau);
    // đèn mũ hai bên
    for (const s of [-1, 1]) {
      const g = new THREE.Group();
      g.position.set(0.138 * s, yM + 0.06, 0.035);
      g.rotation.y = 0.12 * s;
      const v = new THREE.CylinderGeometry(0.021, 0.024, 0.075, 12); v.rotateX(Math.PI / 2);
      mesh(v, vlXam, g);
      const k = new THREE.CircleGeometry(0.017, 14); k.translate(0, 0, 0.0377);
      mesh(k, vlDen, g);
      mesh(hopBo(0.018, 0.05, 0.05, 0.006), vlXam, g, [-0.012 * s, -0.03, -0.01]);
      dau.add(g);
    }
  }

  // ---- tay
  const taoTay = (s) => {
    const vai = new THREE.Group();
    vai.position.set(X_VAI * s, Y_VAI, 0);
    than.add(vai);
    mesh(new THREE.SphereGeometry(0.084, 12, 8), vlDo, vai);
    vong(0.071, 0.012, vlKhopMau, vai, -0.03, 1, 1, 18);
    mesh(doanChi(L_CANH, [[0, 0.07], [0.12, 0.068], [0.5, 0.064], ...nep(0.66, 0.98, 0.058, 3, 0.012), [1, 0.056]]), vlDo, vai);
    if (vlNhan) vong(0.068, 0.01, vlNhan, vai, -0.12, 1, 1, 18);
    const khuyu = new THREE.Group();
    khuyu.position.y = -L_CANH;
    vai.add(khuyu);
    mesh(doanChi(L_CANGTAY, [[0, 0.057], ...nep(0.03, 0.26, 0.056, 2, 0.011), [0.5, 0.054], [1, 0.049]]), vlDo, khuyu);
    const coTay = new THREE.Group();
    coTay.position.y = -L_CANGTAY;
    khuyu.add(coTay);
    vong(0.052, 0.012, vlKhopMau, coTay, 0.004, 1, 1, 18);
    // găng: cổ găng, lòng bàn tay, ngón (một khối, gập được), ngón cái
    const coGang = new THREE.CylinderGeometry(0.05, 0.055, 0.05, 14); coGang.translate(0, -0.022, 0);
    mesh(coGang, vlGang, coTay);
    mesh(hopBo(0.042, 0.09, 0.082, 0.018), vlGang, coTay, [0, -0.085, 0]);
    const ngon = new THREE.Group();
    ngon.position.y = -0.125;
    coTay.add(ngon);
    mesh(hopBo(0.036, 0.078, 0.078, 0.016), vlGang, ngon, [0, -0.035, 0]);
    const cai = new THREE.Group();
    cai.position.set(-0.01 * s, -0.07, 0.04);
    cai.rotation.set(0.5, 0, -0.35 * s);
    mesh(hopBo(0.028, 0.06, 0.028, 0.012), vlGang, cai, [0, -0.025, 0]);
    coTay.add(cai);
    // điểm neo giữa lòng bàn tay (lòng tay hướng về −x·s cục bộ)
    const neo = new THREE.Object3D();
    neo.position.set(-0.021 * s, -0.11, 0);
    coTay.add(neo);
    return { vai, khuyu, coTay, ngon, cai, neo, s };
  };
  const tayT = taoTay(1), tayP = taoTay(-1);

  // ---- chân
  const taoChan = (s) => {
    const hongK = new THREE.Group();
    hongK.position.set(X_HONG * s, 0, 0);
    hong.add(hongK);
    mesh(doanChi(L_DUI, [[0, 0.088], [0.25, 0.085], [0.6, 0.077], ...nep(0.74, 1.0, 0.07, 3, 0.014)]), vlDo, hongK);
    vong(0.086, 0.011, vlKhop, hongK, -0.045, 1, 1, 16);           // ổ bi đùi
    if (vlNhan) vong(0.086, 0.01, vlNhan, hongK, -0.13, 1, 1, 18);
    const goi = new THREE.Group();
    goi.position.y = -L_DUI;
    hongK.add(goi);
    mesh(doanChi(L_CANG, [...nep(0, 0.16, 0.068, 2, 0.012), [0.35, 0.071], [0.6, 0.066], [1, 0.06]]), vlDo, goi);
    const coChan = new THREE.Group();
    coChan.position.y = -L_CANG;
    goi.add(coChan);
    // giày: cổ giày, mũi giày, đế
    const coGiay = new THREE.CylinderGeometry(0.068, 0.074, 0.11, 14); coGiay.translate(0, 0.0, 0);
    mesh(coGiay, vlGiay, coChan);
    mesh(hopBo(0.124, 0.07, 0.25, 0.03), vlGiay, coChan, [0, -0.035, 0.045]);
    mesh(hopBo(0.13, 0.03, 0.105, 0.012), vlDe, coChan, [0, -0.04, 0.13]);   // mũi giày bọc
    mesh(hopBo(0.136, 0.032, 0.275, 0.01), vlDe, coChan, [0, -0.069, 0.047]);
    vong(0.071, 0.009, vlKhop, coChan, 0.05, 1, 1, 16);
    return { hongK, goi, coChan, s };
  };
  const chanT = taoChan(1), chanP = taoChan(-1);

  // ---- trạng thái và lò xo
  const KHOA = ['hongX', 'hongZ', 'goi', 'than', 'dau', 'loLung'];
  const lx = {};
  const moiLx = (k, v) => { lx[k] = new LoXo(v, 0.5); };
  for (const k of KHOA) moiLx(k, 0);
  for (const k of KHOA_TAY) { moiLx(k + 'T', 0); moiLx(k + 'P', 0); }
  const nhunDong = new LoXo(0, 0.6);
  // danh sách dựng sẵn để vòng cập nhật mỗi khung hình không cấp phát gì
  const CHAN_DS = [chanT, chanP], TAY_DS = [tayT, tayP];
  for (const [c, h] of [[tayT, 'T'], [tayP, 'P']]) { c.lx = {}; for (const k of KHOA_TAY) c.lx[k] = lx[k + h]; }
  const LX_DS = Object.values(lx);

  const S = { than: 'dung', tayT: null, tayP: null, gio: 0 };
  function apDich(giay, ngay) {
    const b = THAN[S.than] || THAN.dung;
    for (const k of KHOA) lx[k].datGiay(giay).dat(k === 'loLung' ? b[k] : b[k] * D, ngay);
    for (const [hau, ten] of [['T', S.tayT], ['P', S.tayP]]) {
      const t = (ten && TAY[ten]) || b.tay;
      for (const k of KHOA_TAY) lx[k + hau].datGiay(giay).dat(k === 'nam' ? t[k] : t[k] * D, ngay);
    }
  }

  // Đặt tư thế cả người: 'dung' | 'lo-lung' | 'nhun' | 'gio-tay' | 'tha'
  // ('gio-tay' = đứng + một tay giơ ra cầm vật; 'tha' = đứng + tay đó vừa buông).
  function datTuThe(ten, { giay = 0.55, tay: ben = tay, ngay = false } = {}) {
    if (ten === 'gio-tay' || ten === 'tha') {
      S.than = 'dung';
      S.tayT = S.tayP = null;
      if (ben === 'trai') S.tayT = ten === 'gio-tay' ? 'cam' : 'tha'; else S.tayP = ten === 'gio-tay' ? 'cam' : 'tha';
    } else {
      S.than = THAN[ten] ? ten : 'dung';
    }
    S.ten = ten;
    apDich(giay, ngay);
  }
  // Chỉ đổi một tay, giữ tư thế thân: 'cam' | 'tha' | null (thả lỏng theo thân).
  function datTay(ten, { tay: ben = tay, giay = 0.45 } = {}) {
    if (ben === 'trai') S.tayT = ten; else S.tayP = ten;
    apDich(giay, false);
  }
  // Nhún một cái (khi bị ép xuống sàn: tên lửa vừa phụt lửa, buồng vừa chạm đất…). manh 0–1,5.
  function nhun(manh = 1) { nhunDong.day(manh * nhunDong.w * Math.E); }

  // ---- đặt góc khớp từ lò xo
  function apKhop(dt) {
    S.gio += dt;
    const t = S.gio;
    for (let i = 0; i < LX_DS.length; i++) LX_DS[i].buoc(dt);
    const nd = Math.max(0, nhunDong.buoc(dt));
    const L = lx.loLung.v;
    const tho = 0.012 * Math.sin(t * 1.7) * (1 - L);
    const trX = L * 0.05 * Math.sin(t * 0.73), trZ = L * 0.06 * Math.sin(t * 0.47 + 1.3);
    // chân
    const hongX = lx.hongX.v + nd * 24 * D, goiG = lx.goi.v + nd * 46 * D;
    for (const c of CHAN_DS) {
      const lech = c.s * L * 0.07 * Math.sin(t * 0.61 + c.s);
      const a = hongX + lech, b = goiG + lech * 0.6;
      c.hongK.rotation.set(-a, 0, c.s * lx.hongZ.v);
      c.goi.rotation.x = b;
      c.coChan.rotation.x = (a - b) * (1 - L) + L * (0.3 + 0.5 * (a - b));
    }
    // chiều cao hông: đứng trên sàn thì bàn chân chạm sàn; lơ lửng thì giữ ở độ cao đứng thẳng
    const a = hongX, b = goiG;
    const yDat = CHAN + L_DUI * Math.cos(a) + L_CANG * Math.cos(a - b);
    const zChan = L_DUI * Math.sin(a) + L_CANG * Math.sin(a - b);
    hong.position.set(0, yDat + (Y_HONG - yDat) * L, -zChan * (1 - L) * 0.85);
    // thân, đầu
    than.rotation.set(lx.than.v + nd * 14 * D + tho, 0, 0);
    dau.rotation.set(lx.dau.v - nd * 6 * D - tho * 0.5, L * 0.08 * Math.sin(t * 0.37), 0);
    // tay
    for (const c of TAY_DS) {
      const L2 = c.lx;
      const s = c.s;
      const tr = L * 0.07 * Math.sin(t * 0.83 + s * 0.9);
      c.vai.rotation.set(-(L2.vaiX.v + tr - nd * 6 * D), s * L2.vaiY.v, s * (L2.vaiZ.v + tr * 0.6 + nd * 5 * D));
      c.khuyu.rotation.x = -(L2.khuyu.v + tr * 0.8);
      c.coTay.rotation.set(0, 0, s * L2.coTay.v);
      const n = L2.nam.v;
      c.ngon.rotation.z = -s * n * 1.45;
      c.cai.rotation.z = -0.35 * s - s * n * 0.6;
    }
    // trôi nhẹ khi lơ lửng
    goc.position.set(L * 0.025 * Math.sin(t * 0.53), L * 0.05 * Math.sin(t * 0.9), 0);
    goc.rotation.set(trX, 0, trZ);
  }

  datTuThe(tuThe, { ngay: true });
  apKhop(0);

  const ketQua = {
    nhom,
    datTuThe, datTay, nhun,
    get tuThe() { return S.ten; },
    // Độ cao (đặt lại kích cỡ).
    datCao(c) { nhom.scale.setScalar(c / H0); },
    // Điểm neo trong lòng bàn tay (Object3D): gắn vật vào đây để vật đi theo tay.
    neoTay(ben = tay) { return (ben === 'trai' ? tayT : tayP).neo; },
    // Toạ độ thế giới của tâm một quả bóng bán kính r đang được bàn tay này cầm (bàn tay úp lên quả bóng).
    viTriCam(out = new THREE.Vector3(), r = 0.13, ben = tay) {
      const c = ben === 'trai' ? tayT : tayP;
      c.coTay.updateWorldMatrix(true, false);
      out.set(-c.s * (0.021 + r * 0.9), -0.1, 0);
      return c.coTay.localToWorld(out);
    },
    capNhat(dt) { apKhop(Math.min(dt, 0.1)); },
    soTamGiac: 0,
    huy() { nhom.traverse((o) => { o.geometry?.dispose(); }); },
  };
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}
