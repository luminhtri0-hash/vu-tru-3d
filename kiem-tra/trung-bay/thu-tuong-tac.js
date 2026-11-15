// Tệp thử khung tương tác (src/khung/tuong-tac.js) trong phòng trưng bày.
//
// Dựng:  node kiem-tra/trung-bay.mjs kiem-tra/trung-bay/thu-tuong-tac.js "Dữ liệu làm việc/tuong-tac"
// Tham số riêng (đọc ở app.tham):
//   dien=re      đưa con trỏ giả tới một vật rồi dừng (vat=sao | io | tay): thấy vòng nổi bật và ô chú giải
//   dien=keo     nắm tay nắm trên sàn, kéo qua vài điểm rồi giữ (tha=1 thì thả); tay=san | duong | cau
//   goiy=1       hiện một bong bóng gợi ý
//   bang=0       không có bảng bài giảng giả (mặc định có, và máy quay bị dời tâm như trong app)
//   xa=<số>      nhân khoảng cách máy quay (để xem cỡ tối thiểu của tay nắm)
//   kiem=1       chạy bộ tự kiểm bằng số, ghi kết quả vào <pre id="ket-qua-kiem"> và document.title

import * as THREE from 'three';
import { TuongTac } from '../../src/khung/tuong-tac.js';
import { taoDom, taoNenSao, taoNhan } from '../../src/khung/ve.js';
import { taoVanBeMat } from '../../src/khung/hanh-tinh.js';

const VANG = 0xf3c66f, XANH = 0x7fcaff, HONG = 0xff7aa8;
const TAM_SAO = new THREE.Vector3(-0.4, 0.15, -1.2);

// Bảng bài giảng giả, đúng kiểu của app (style.css), để kiểm ô chú giải không chui dưới bảng.
function taoBang() {
  const b = document.createElement('aside');
  b.id = 'bai-hoc';
  b.innerHTML = `<div id="bai-hoc-cuon"><div class="phan">Thử khung · Bản 3</div><h1>Tự tay kéo vật trong cảnh</h1>
    <p class="y-chinh">Rê chuột lên Sao Mộc hay vệ tinh Io để xem chú giải. Kéo các đốm sáng: đốm vàng trượt trên sàn, đốm xanh chạy dọc một đường, đốm hồng bám mặt cầu quanh hành tinh.</p>
    <h2>Điều khiển mô hình</h2><p>Bảng này chỉ để thử: khung tương tác phải tránh nó.</p></div>`;
  document.body.append(b);
  return b;
}

function datLech(app, bang) {
  if (!bang) { app.camera.clearViewOffset(); return 0; }
  const lx = (bang.offsetWidth + 14) / 2;
  app.camera.setViewOffset(app.rong, app.cao, lx, 0, app.rong, app.cao);
  return lx;
}

// Dựng cảnh mẫu và đăng ký vật, tay nắm. Đúng thứ tự của ứng dụng: bài đăng ký TRƯỚC khi datCanh.
function dungCanh(tt, dem) {
  const scene = new THREE.Scene();
  scene.add(taoNenSao({ soSao: 4000, hat: 5 }));
  const den = new THREE.DirectionalLight(0xfff2e0, 2.6); den.position.set(4, 3, 5);
  const vien = new THREE.DirectionalLight(0x7fa8ff, 1.4); vien.position.set(-5, 2, -6);
  scene.add(den, vien, new THREE.AmbientLight(0x404858, 0.35));

  const sao = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), new THREE.MeshStandardMaterial({ map: taoVanBeMat('moc'), roughness: 0.9, metalness: 0 }));
  sao.position.copy(TAM_SAO);
  sao.rotation.z = 0.05;
  scene.add(sao);

  const io = taoDom(new THREE.Color(0xffd9a0).multiplyScalar(2.2), 0.22);
  io.position.set(2.35, 0.55, -1.4);
  scene.add(io);
  const nIo = taoNhan('Io', 'mo');
  nIo.position.copy(io.position).add(new THREE.Vector3(0.08, 0, 0));
  scene.add(nIo);

  // Sàn: lưới mờ dần
  const san = new THREE.GridHelper(12, 24, 0x2a3348, 0x161c2a);
  san.position.y = -0.9;
  san.material.transparent = true; san.material.opacity = 0.55; san.material.depthWrite = false;
  scene.add(san);

  dem.reSao = []; dem.bamSao = 0; dem.bamIo = 0;
  const vSao = tt.them(sao, {
    ten: 'Sao Mộc', mau: VANG,
    moTa: () => 'Hành tinh khí khổng lồ<br>Khối lượng <span class="so">1,90·10²⁷ kg</span> · bán kính <span class="so">69 911 km</span>',
    khiRe: (d) => dem.reSao.push(d), khiBam: () => { dem.bamSao++; },
  });
  const vIo = tt.them(io, {
    ten: 'Io', mau: 0xffd9a0, banKinhPx: 16,
    moTa: 'Vệ tinh gần Sao Mộc nhất trong bốn vệ tinh Galileo; quay một vòng mất <b>1,77 ngày</b>.',
    khiBam: () => { dem.bamIo++; },
  });

  const goiDem = (ten) => {
    dem[ten] = { nam: 0, keo: 0, tha: 0, cuoi: null };
    return {
      khiNam: () => { dem[ten].nam++; },
      khiKeo: (p) => { dem[ten].keo++; dem[ten].cuoi = p; },
      khiTha: () => { dem[ten].tha++; },
    };
  };
  const tSan = tt.tayNam({
    viTri: [1.4, -0.9, 1.1], mau: VANG, co: 0.09, ten: 'Sự kiện P', moTa: 'Trượt trên sàn (mặt phẳng y = −0,9)',
    rangBuoc: { kieu: 'mat-phang', phap: [0, 1, 0], qua: [0, -0.9, 0] },
    hut: [[0, -0.9, 1.6]], khoangHut: 0.25,
    nhan: 'Kéo sự kiện P', ...goiDem('san'),
  });
  const tDuong = tt.tayNam({
    viTri: [-2.2, -0.9, 1.9], mau: XANH, co: 0.08, ten: 'Vận tốc', moTa: 'Chạy dọc trục x, kẹp trong [−3; −0,5]',
    rangBuoc: { kieu: 'duong', qua: [-2.5, -0.9, 1.9], huong: [1, 0, 0] },
    gioiHan: (p) => { p.x = Math.min(-0.5, Math.max(-3, p.x)); return p; },
    nhan: 'Kéo vận tốc', ...goiDem('duong'),
  });
  const tCau = tt.tayNam({
    viTri: TAM_SAO.clone().add(new THREE.Vector3(0.9, 1.1, 0.6).normalize().multiplyScalar(1.5)), mau: HONG, co: 0.08,
    ten: 'Vệ tinh nhân tạo', moTa: 'Bám mặt cầu bán kính 1,5 quanh Sao Mộc',
    rangBuoc: { kieu: 'mat-cau', tam: TAM_SAO.toArray(), banKinh: 1.5 },
    nhan: 'Kéo quanh hành tinh', ...goiDem('cau'),
  });
  // Đọc và đặt được ngay, trước khi datCanh (hợp đồng thứ tự gọi).
  dem.truocDatCanh = { viTri: tSan.viTri.clone(), coVat: !!tSan.vat?.isObject3D };
  tSan.dat([1.4, -0.9, 1.1]);
  return { scene, sao, io, vSao, vIo, tSan, tDuong, tCau };
}

export default {
  mayAnh: { viTri: [0.6, 2.6, 7.4], dich: [0.1, -0.2, 0], fov: 40 },
  hinh: { quang: 0.55 },
  tao(app) {
    const tham = app.tham;
    const bang = tham.get('bang') === '0' ? null : taoBang();
    const xa = Number(tham.get('xa')) || 1;
    if (xa !== 1) app.camera.position.sub(app.dk.target).multiplyScalar(xa).add(app.dk.target);
    app.dk.update();
    datLech(app, bang);

    // Chrome ẩn với thời gian ảo không chạy chuyển tiếp CSS: khi chụp thì tắt chuyển tiếp để thấy trạng thái cuối.
    if (tham.has('dien') || tham.has('goiy')) {
      const st = document.createElement('style');
      st.textContent = '.vt-cg-trong, .vt-gy, .vt-diem, .vt-nhan { transition: none !important; }';
      document.head.append(st);
    }
    const tt = new TuongTac(app);
    app.tt = tt;
    const dem = {};
    // Thứ tự của ứng dụng: xoaHet → tao (đăng ký) → datCanh
    tt.xoaHet();
    const c = dungCanh(tt, dem);
    tt.datCanh(c.scene);
    if (tham.get('goiy') === '1') tt.goiY('<b>Thử kéo</b> đốm vàng trên sàn: sự kiện P đi tới đâu, nón ánh sáng đi theo tới đó.', c.tSan.vat, { giay: 0 });

    const cv = app.renderer.domElement;
    const kq = { scene: c.scene, capNhat(dt) { c.sao.rotation.y += dt * 0.05; tt.capNhat(dt); } };

    const dien = tham.get('dien');
    if (dien) setTimeout(() => dienThu(app, tt, c, dien, tham), 700);
    if (tham.get('bao') === '1') setTimeout(() => {
      const p = document.createElement('pre'); p.id = 'trang-thai'; p.hidden = true;
      p.textContent = JSON.stringify({ lop: tt.cg.className, an: tt.cg.hidden, bien: tt.cg.style.transform, hop: tt.cg.getBoundingClientRect(), doMo: getComputedStyle(tt.cg.firstChild).opacity, re: tt._re?.tc?.ten ?? null, cg: { ...tt._cgTt, rec: undefined }, con: tt._con, gio: tt._gio });
      document.body.append(p);
    }, Number(tham.get('baoLuc')) || 2500);
    if (tham.get('kiem') === '1') setTimeout(() => chayKiem(app, tt, c, dem, bang, kq), 400);
    window.__tt = { tt, c, dem, cv };
    return kq;
  },
};

// ---------------- Sự kiện con trỏ giả ----------------
function su(cv, loai, x, y, { nut = 0, id = 1, kieu = 'mouse', button = 0 } = {}) {
  const e = new PointerEvent(loai, {
    clientX: x, clientY: y, pointerId: id, pointerType: kieu, isPrimary: true, bubbles: true, cancelable: true,
    buttons: nut, button: loai === 'pointermove' ? -1 : button,
  });
  cv.dispatchEvent(e);
  return e;
}
function manHinh(app, p) {
  const r = app.renderer.domElement.getBoundingClientRect();
  const v = (p.isVector3 ? p.clone() : new THREE.Vector3(...p)).project(app.camera);
  return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
}

function dienThu(app, tt, c, dien, tham) {
  const cv = app.renderer.domElement;
  app.camera.updateMatrixWorld();
  if (dien === 're') {
    const vat = tham.get('vat') || 'sao';
    let p;
    if (vat === 'io') p = manHinh(app, c.io.position);
    else if (vat === 'tay') p = manHinh(app, c.tSan.viTri);
    else { p = manHinh(app, TAM_SAO); p.x += 30; p.y -= 20; }
    su(cv, 'pointermove', p.x - 30, p.y + 10);
    su(cv, 'pointermove', p.x, p.y);
  } else if (dien === 'keo') {
    const ten = tham.get('tay') || 'san';
    const t = { san: c.tSan, duong: c.tDuong, cau: c.tCau }[ten];
    const p0 = manHinh(app, t.viTri);
    su(cv, 'pointermove', p0.x, p0.y);
    su(cv, 'pointerdown', p0.x, p0.y, { nut: 1 });
    const buoc = ten === 'cau' ? [[-30, -20], [-70, -40], [-110, -30]] : [[-30, 10], [-80, 30], [-140, 40]];
    for (const [dx, dy] of buoc) su(cv, 'pointermove', p0.x + dx, p0.y + dy, { nut: 1 });
    if (tham.get('tha') === '1') su(cv, 'pointerup', p0.x + buoc[2][0], p0.y + buoc[2][1]);
  }
  // Chrome ẩn chạy rất ít khung hình: đẩy thêm 0,7 giây cho các hiệu ứng (hiện dần, chú giải) kịp hiện.
  for (let i = 0; i < 42; i++) tt.capNhat(1 / 60);
}

// ---------------- Bộ tự kiểm ----------------
function chayKiem(app, tt, c, dem, bang, canh) {
  const kq = [];
  const ghi = (ten, dat, chiTiet = '') => kq.push({ ten, dat: !!dat, chiTiet: String(chiTiet) });
  const cv = app.renderer.domElement;
  const cam = app.camera, dk = app.dk;
  const khung = () => cam.updateMatrixWorld();
  const buoc = (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) tt.capNhat(dt); };
  let batDauDk = 0;
  dk.addEventListener('start', () => { batDauDk++; });
  // Móc cũ giả (như ung-dung.js): bấm không kéo thì gọi khiBam cũ, trừ khi sự kiện có cờ vtDaXuLy.
  let mocCu = 0, xuongCu = null;
  const coCo = { xuong: null, len: null, di: null };
  cv.addEventListener('pointerdown', (e) => { xuongCu = { x: e.clientX, y: e.clientY }; coCo.xuong = !!e.vtDaXuLy; });
  cv.addEventListener('pointermove', (e) => { coCo.di = !!e.vtDaXuLy; });
  cv.addEventListener('pointerup', (e) => {
    coCo.len = !!e.vtDaXuLy;
    if (xuongCu && Math.hypot(e.clientX - xuongCu.x, e.clientY - xuongCu.y) < 5 && !e.vtDaXuLy) mocCu++;
    xuongCu = null;
  });
  const loiCuaSo = [];
  const nghe = (e) => { loiCuaSo.push(String(e.message)); };
  window.addEventListener('error', nghe);

  try {
    khung();
    buoc(3);
    // 1. Thứ tự gọi của ứng dụng
    ghi('Tay nắm dùng được trước datCanh (đọc viTri, có vat)', dem.truocDatCanh.coVat && Math.abs(dem.truocDatCanh.viTri.x - 1.4) < 1e-9);
    ghi('Sau datCanh: tay nắm nằm trong cảnh và đang hiện', tt._hien(c.tSan.vat) && c.tSan.vat.children[0].visible);
    const soConTruoc = c.scene.children.length;
    tt.datCanh(c.scene);
    ghi('datCanh lần nữa với cùng cảnh: không làm gì', c.scene.children.length === soConTruoc && tt._tay.length === 3);

    // 2–7. Kéo theo từng ràng buộc, khi máy quay có dời tâm và khi không
    for (const coLech of [true, false]) {
      const nhan = coLech ? '[dời tâm]' : '[không dời tâm]';
      if (coLech) datLech(app, bang); else cam.clearViewOffset();
      khung(); buoc(1);
      const lech = cam.view?.enabled ? cam.view.offsetX : 0;
      if (coLech) ghi(`Máy quay đang dời tâm ${nhan}`, lech > 100, `offsetX = ${lech}`);

      // mặt phẳng
      c.tSan.dat([1.4, -0.9, 1.1]); khung();
      const d0 = dem.san.nam, k0 = dem.san.keo, t0 = dem.san.tha, s0 = batDauDk;
      const p0 = manHinh(app, c.tSan.viTri);
      const xuong = { x: p0.x + 3, y: p0.y - 2 };
      su(cv, 'pointermove', xuong.x, xuong.y);
      const eX = su(cv, 'pointerdown', xuong.x, xuong.y, { nut: 1 });
      ghi(`Nắm tay nắm: tắt máy quay ${nhan}`, dk.enabled === false && tt.dangKeo && eX.vtDaXuLy && coCo.xuong === true);
      ghi(`Lúc mới nắm không nhảy vị trí ${nhan}`, c.tSan.viTri.distanceTo(new THREE.Vector3(1.4, -0.9, 1.1)) < 1e-9);
      let saiPx = 0, saiMat = 0, coDi = true;
      const ds = [[-40, 10], [-90, 35], [60, -30], [120, 20], [-200, 60]];
      for (const [dx, dy] of ds) {
        const x = xuong.x + dx, y = xuong.y + dy;
        su(cv, 'pointermove', x, y, { nut: 1 });
        coDi = coDi && coCo.di === true;
        const q = manHinh(app, c.tSan.viTri);
        saiPx = Math.max(saiPx, Math.hypot(q.x - (x - 3), q.y - (y + 2)));
        saiMat = Math.max(saiMat, Math.abs(c.tSan.viTri.y + 0.9));
      }
      ghi(`Mặt phẳng: tay nắm nằm trên mặt phẳng ${nhan}`, saiMat < 1e-6, `lệch ${saiMat.toExponential(2)}`);
      ghi(`Mặt phẳng: tay nắm đúng dưới con trỏ, giữ độ lệch lúc nắm ${nhan}`, saiPx < 1, `sai ${saiPx.toFixed(3)} px`);
      ghi(`Sự kiện di chuyển khi kéo mang cờ vtDaXuLy ${nhan}`, coDi);
      const eL = su(cv, 'pointerup', xuong.x - 200, xuong.y + 60);
      ghi(`Thả: bật lại máy quay, cờ vtDaXuLy ${nhan}`, dk.enabled === true && !tt.dangKeo && eL.vtDaXuLy && coCo.len === true);
      ghi(`khiNam 1, khiKeo ${ds.length}, khiTha 1 ${nhan}`, dem.san.nam - d0 === 1 && dem.san.keo - k0 === ds.length && dem.san.tha - t0 === 1,
        `nam ${dem.san.nam - d0}, keo ${dem.san.keo - k0}, tha ${dem.san.tha - t0}`);
      ghi(`OrbitControls không bắt đầu xoay khi nắm tay nắm ${nhan}`, batDauDk === s0, `số lần start: ${batDauDk - s0}`);
      ghi(`Móc khiBam cũ bỏ qua lần nắm tay nắm ${nhan}`, mocCu === 0, `móc cũ chạy ${mocCu} lần`);

      // hút
      c.tSan.dat([1.4, -0.9, 1.1]); khung();
      let p = manHinh(app, c.tSan.viTri);
      su(cv, 'pointerdown', p.x, p.y, { nut: 1 });
      const dich = manHinh(app, [0.1, -0.9, 1.55]);
      su(cv, 'pointermove', dich.x, dich.y, { nut: 1 });
      const hutDung = c.tSan.viTri.distanceTo(new THREE.Vector3(0, -0.9, 1.6)) < 1e-9;
      const xa = manHinh(app, [0.9, -0.9, 0.6]);
      su(cv, 'pointermove', xa.x, xa.y, { nut: 1 });
      const roiHut = c.tSan.viTri.distanceTo(new THREE.Vector3(0, -0.9, 1.6)) > 0.3;
      su(cv, 'pointerup', xa.x, xa.y);
      ghi(`hut: bắt dính khi lại gần, rời khi đi xa ${nhan}`, hutDung && roiHut);

      // đường thẳng + giới hạn
      c.tDuong.dat([-2.2, -0.9, 1.9]); khung();
      p = manHinh(app, c.tDuong.viTri);
      su(cv, 'pointerdown', p.x, p.y, { nut: 1 });
      let saiDuong = 0;
      for (const [dx, dy] of [[30, 40], [60, -50], [-40, 20]]) {
        su(cv, 'pointermove', p.x + dx, p.y + dy, { nut: 1 });
        const v = c.tDuong.viTri;
        saiDuong = Math.max(saiDuong, Math.hypot(v.y + 0.9, v.z - 1.9));
      }
      const xTruoc = c.tDuong.viTri.x;
      su(cv, 'pointermove', p.x + 900, p.y, { nut: 1 });
      const kepPhai = Math.abs(c.tDuong.viTri.x + 0.5) < 1e-9;
      su(cv, 'pointermove', p.x - 900, p.y, { nut: 1 });
      const kepTrai = Math.abs(c.tDuong.viTri.x + 3) < 1e-9;
      su(cv, 'pointerup', p.x - 900, p.y);
      ghi(`Đường: tay nắm luôn trên đường ${nhan}`, saiDuong < 1e-6 && Math.abs(xTruoc + 2.2) > 0.01, `lệch ${saiDuong.toExponential(2)}, x = ${xTruoc.toFixed(3)}`);
      ghi(`gioiHan: kẹp x trong [−3; −0,5] ${nhan}`, kepPhai && kepTrai);
      // độ chính xác dọc đường: tay nắm nằm đúng chỗ gần con trỏ nhất trên đường (theo màn hình)
      c.tDuong.dat([-2.2, -0.9, 1.9]); khung();
      p = manHinh(app, c.tDuong.viTri);
      su(cv, 'pointerdown', p.x, p.y, { nut: 1 });
      const dDuong = manHinh(app, [-1.4, -0.9, 1.9]);
      su(cv, 'pointermove', dDuong.x, dDuong.y, { nut: 1 });
      const lechDuong = Math.abs(c.tDuong.viTri.x + 1.4);
      su(cv, 'pointerup', dDuong.x, dDuong.y);
      ghi(`Đường: tay nắm tới đúng điểm dưới con trỏ ${nhan}`, lechDuong < 1e-6, `lệch ${lechDuong.toExponential(2)}`);

      // mặt cầu
      p = manHinh(app, c.tCau.viTri);
      su(cv, 'pointerdown', p.x, p.y, { nut: 1 });
      let saiCau = 0;
      for (const [dx, dy] of [[-30, -20], [-80, 10], [40, 60], [400, -300]]) {
        su(cv, 'pointermove', p.x + dx, p.y + dy, { nut: 1 });
        saiCau = Math.max(saiCau, Math.abs(c.tCau.viTri.distanceTo(TAM_SAO) - 1.5));
      }
      su(cv, 'pointerup', p.x + 400, p.y - 300);
      ghi(`Mặt cầu: tay nắm luôn cách tâm đúng bán kính (cả khi con trỏ trượt ra ngoài) ${nhan}`, saiCau < 1e-6, `lệch ${saiCau.toExponential(2)}`);
      ghi(`Mặt cầu: khiNam ${dem.cau.nam}, khiKeo ${dem.cau.keo}, khiTha ${dem.cau.tha} ${nhan}`, dem.cau.keo >= 4 && dem.cau.nam === dem.cau.tha);
    }
    datLech(app, bang); khung(); buoc(1);

    // tự do và hàm riêng
    const demTd = { keo: 0 };
    const tTd = tt.tayNam({ viTri: [2.0, 1.0, 0.8], mau: VANG, co: 0.06, rangBuoc: { kieu: 'tu-do' }, khiKeo: () => { demTd.keo++; } });
    khung(); buoc(1);
    let p = manHinh(app, tTd.viTri);
    const doSau0 = -tTd.viTri.clone().applyMatrix4(cam.matrixWorldInverse).z;
    su(cv, 'pointerdown', p.x, p.y, { nut: 1 });
    let saiTd = 0;
    for (const [dx, dy] of [[-50, 30], [-120, -40]]) {
      su(cv, 'pointermove', p.x + dx, p.y + dy, { nut: 1 });
      const q = manHinh(app, tTd.viTri);
      saiTd = Math.max(saiTd, Math.hypot(q.x - p.x - dx, q.y - p.y - dy));
    }
    const doSau1 = -tTd.viTri.clone().applyMatrix4(cam.matrixWorldInverse).z;
    su(cv, 'pointerup', p.x - 120, p.y - 40);
    ghi('Tự do: dưới con trỏ, giữ độ sâu', saiTd < 1 && Math.abs(doSau1 - doSau0) < 1e-6 && demTd.keo === 2, `sai ${saiTd.toFixed(3)} px`);
    tTd.huy();

    let goiHam = 0;
    const tHam = tt.tayNam({
      viTri: [0.5, 1.6, 1.0], co: 0.06, mau: XANH,
      rangBuoc: { kieu: 'ham', chieu: (tia, hienTai) => { goiHam++; return hienTai && tia.at(6, new THREE.Vector3()); } },
    });
    khung(); buoc(1);
    p = manHinh(app, tHam.viTri);
    su(cv, 'pointerdown', p.x, p.y, { nut: 1 });
    su(cv, 'pointermove', p.x - 40, p.y + 20, { nut: 1 });
    const dHam = tHam.viTri.distanceTo(cam.position);
    su(cv, 'pointerup', p.x - 40, p.y + 20);
    ghi('Ràng buộc hàm riêng: dùng điểm hàm trả về', goiHam === 1 && Math.abs(dHam - 6) < 1e-6, `gọi ${goiHam} lần, cách máy quay ${dHam.toFixed(4)}`);
    tHam.huy();

    // 8. Bấm vật, kéo máy quay
    const pSao = manHinh(app, TAM_SAO);
    const b0 = dem.bamSao, moc0 = mocCu;
    su(cv, 'pointermove', pSao.x, pSao.y);
    su(cv, 'pointerdown', pSao.x, pSao.y, { nut: 1 });
    const eB = su(cv, 'pointerup', pSao.x + 1, pSao.y);
    ghi('Bấm vào vật: khiBam một lần, có cờ vtDaXuLy, móc cũ bỏ qua', dem.bamSao - b0 === 1 && eB.vtDaXuLy && mocCu === moc0, `khiBam ${dem.bamSao - b0}`);
    ghi('Bấm vào vật không tắt máy quay', dk.enabled === true);
    su(cv, 'pointerdown', pSao.x, pSao.y, { nut: 1 });
    su(cv, 'pointermove', pSao.x + 20, pSao.y + 5, { nut: 1 });
    su(cv, 'pointermove', pSao.x + 45, pSao.y + 9, { nut: 1 });
    su(cv, 'pointerup', pSao.x + 45, pSao.y + 9);
    ghi('Kéo máy quay bắt đầu trên vật: không gọi khiBam', dem.bamSao - b0 === 1 && dk.enabled === true);
    // bấm vào chỗ trống: móc cũ vẫn chạy như trước
    const trong = manHinh(app, [-3.5, 2.2, -2]);
    su(cv, 'pointerdown', trong.x, trong.y, { nut: 1 });
    su(cv, 'pointerup', trong.x, trong.y);
    ghi('Bấm chỗ trống: không có cờ, móc cũ chạy', mocCu === moc0 + 1);

    // 9. Bắt vật: vật nhỏ theo điểm ảnh, tay nắm thắng, vật gần thắng
    const pIo = manHinh(app, c.io.position);
    su(cv, 'pointermove', pIo.x + 11, pIo.y - 6);
    ghi('Vật nhỏ: bắt trong banKinhPx quanh tâm', tt._re?.vat === c.io);
    su(cv, 'pointermove', pIo.x + 40, pIo.y);
    ghi('Vật nhỏ: ngoài banKinhPx thì không bắt', tt._re?.vat !== c.io);
    const tTruoc = tt.tayNam({ viTri: TAM_SAO.clone().add(new THREE.Vector3(0, 0, 1.6)), co: 0.06, rangBuoc: { kieu: 'tu-do' } });
    khung(); buoc(1);
    const pT = manHinh(app, tTruoc.viTri);
    su(cv, 'pointermove', pT.x + 4, pT.y + 3);
    ghi('Tay nắm thắng vật thường nằm cùng chỗ', tt._re === tt._tay.at(-1));
    tTruoc.huy();
    const gan = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 12), new THREE.MeshBasicMaterial({ color: 0x334455 }));
    gan.position.copy(TAM_SAO).add(new THREE.Vector3(0, 0, 1.4));
    c.scene.add(gan);
    const vGan = tt.them(gan, { ten: 'Gần' });
    khung(); gan.updateMatrixWorld();
    const pG = manHinh(app, gan.position);
    su(cv, 'pointermove', pG.x, pG.y);
    ghi('Hai vật chồng nhau: vật gần máy quay hơn thắng', tt._re?.vat === gan);
    gan.visible = false;
    su(cv, 'pointermove', pG.x + 0.5, pG.y);
    ghi('Vật ẩn thì không bắt (rơi xuống vật phía sau)', tt._re?.vat === c.sao);
    vGan.huy(); c.scene.remove(gan); gan.geometry.dispose(); gan.material.dispose();

    // 10. Rê: khiRe, ô chú giải hiện sau 0,15 giây, tránh bảng và mép màn hình
    su(cv, 'pointermove', trong.x, trong.y);
    buoc(2);
    dem.reSao.length = 0;
    su(cv, 'pointermove', pSao.x, pSao.y);
    buoc(6);                                     // 0,1 giây
    const chuaHien = tt.cg.hidden || !tt.cg.classList.contains('hien');
    buoc(4);                                     // thêm 0,067 giây
    const daHien = !tt.cg.hidden && tt.cg.classList.contains('hien');
    ghi('Ô chú giải: chưa hiện lúc 0,1 giây, hiện lúc 0,17 giây', chuaHien && daHien);
    ghi('Rê vào gọi khiRe(true); con trỏ đổi kiểu', dem.reSao[0] === true && cv.style.cursor === 'pointer');
    ghi('Vòng nổi bật hiện quanh vật', tt._vong.visible && tt._vongRec?.vat === c.sao);
    su(cv, 'pointermove', trong.x, trong.y);
    buoc(30);
    ghi('Rời vật: khiRe(false), ô chú giải tắt, vòng tắt', dem.reSao[1] === false && dem.reSao.length === 2 && !tt.cg.classList.contains('hien') && !tt._vong.visible);
    const rb = bang.getBoundingClientRect();
    let chuiBang = 0, tranMH = 0;
    const timGoc = tt._tim;
    tt._tim = () => tt._ds[0];                                // ép coi như con trỏ ở đâu cũng đang trên Sao Mộc
    for (const [x, y] of [[rb.left - 30, 200], [rb.left - 4, 700], [rb.left - 200, innerHeight - 10], [20, 70]]) {
      su(cv, 'pointermove', x, y);
      buoc(15);
      const r = tt.cg.getBoundingClientRect();
      if (tt.cg.hidden || r.right > rb.left - 1) chuiBang++;
      if (r.left < 0 || r.top < 0 || r.bottom > innerHeight || r.right > innerWidth) tranMH++;
    }
    tt._tim = timGoc;
    tt._datRe(null); buoc(20);
    ghi('Ô chú giải không chui dưới bảng bài giảng, không tràn màn hình', chuiBang === 0 && tranMH === 0, `chui ${chuiBang}, tràn ${tranMH}`);

    // 11. Cỡ tối thiểu khi máy quay ra xa
    const viTriCu = cam.position.clone();
    cam.position.sub(dk.target).multiplyScalar(60).add(dk.target); khung(); buoc(1);
    const rNho = Math.min(...tt._tay.map((t) => t.rPx));
    cam.position.copy(viTriCu); khung(); buoc(1);
    ghi('Máy quay ra xa: lõi tay nắm vẫn ≥ 9 điểm ảnh đường kính', rNho * 2 >= 9 - 1e-9, `đường kính ${(rNho * 2).toFixed(2)} px`);

    // 12. Huỷ giữa chừng
    const huyGiua = (nhan, lam) => {
      c.tSan.dat([1.4, -0.9, 1.1]); khung();
      const q = manHinh(app, c.tSan.viTri);
      const t0 = dem.san.tha;
      su(cv, 'pointerdown', q.x, q.y, { nut: 1 });
      su(cv, 'pointermove', q.x - 20, q.y, { nut: 1 });
      const dangTat = dk.enabled === false;
      lam(q);
      ghi(`Huỷ giữa chừng (${nhan}): máy quay bật lại, khiTha được gọi`, dangTat && dk.enabled === true && !tt.dangKeo && dem.san.tha - t0 === 1);
    };
    huyGiua('pointercancel', (q) => su(cv, 'pointercancel', q.x - 20, q.y));
    huyGiua('cửa sổ mất tiêu điểm', () => window.dispatchEvent(new Event('blur')));
    huyGiua('mất bắt con trỏ', () => cv.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1 })));
    huyGiua('tay nắm bị khoá', () => { c.tSan.khoa(true); c.tSan.khoa(false); });
    huyGiua('tay nắm bị ẩn', () => { c.tSan.an(true); c.tSan.an(false); });

    // 13. Bàn phím: bấm chọn tay nắm rồi nhích
    c.tSan.dat([1.4, -0.9, 1.1]); khung(); buoc(1);
    let q = manHinh(app, c.tSan.viTri);
    su(cv, 'pointerdown', q.x, q.y, { nut: 1 });
    su(cv, 'pointerup', q.x, q.y);
    let phimApp = 0;
    const ngheApp = () => { phimApp++; };
    window.addEventListener('keydown', ngheApp);
    const k0 = dem.san.keo, x0 = c.tSan.viTri.x;
    const ePhim = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    document.body.dispatchEvent(ePhim);
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
    ghi('Phím mũi tên nhích tay nắm đang chọn, ứng dụng không nhận phím đó', tt._chon === tt._tay[0] && c.tSan.viTri.x > x0 && dem.san.keo === k0 + 1 && phimApp === 0 && ePhim.defaultPrevented && Math.abs(c.tSan.viTri.y + 0.9) < 1e-9);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    ghi('Esc bỏ chọn: phím mũi tên trả lại cho ứng dụng', tt._chon === null && phimApp === 2);
    window.removeEventListener('keydown', ngheApp);

    // 14. xoaHet gỡ sạch; mở đóng bài liên tục
    const demNut = () => document.getElementsByTagName('*').length;
    const demCon = (o) => { let n = 0; o.traverse(() => { n++; }); return n; };
    tt.goiY('Thử gợi ý', [0, 0, 0], { giay: 3 });
    buoc(5);
    tt.xoaHet();
    buoc(2);
    const nhomRong = demCon(tt.nhom);
    const nutRong = demNut();
    let lechNut = 0, lechCon = 0, loiDem = 0;
    const cuoi = { scene: c.scene };
    for (let lan = 0; lan < 40; lan++) {
      tt.xoaHet();
      const d2 = {};
      const c2 = dungCanh(tt, d2);
      const conRieng = demCon(c2.scene);
      tt.datCanh(c2.scene);
      tt.goiY('<b>Gợi ý</b> thử', c2.tSan.vat, { giay: lan % 2 ? 0.2 : 0 });
      khung(); buoc(3);
      q = manHinh(app, c2.tSan.viTri);
      su(cv, 'pointermove', q.x, q.y);
      su(cv, 'pointerdown', q.x, q.y, { nut: 1 });
      su(cv, 'pointermove', q.x - 30, q.y + 8, { nut: 1 });
      if (lan % 3) su(cv, 'pointerup', q.x - 30, q.y + 8);
      buoc(20);
      tt.xoaHet();
      if (dk.enabled !== true) loiDem++;
      lechNut = Math.max(lechNut, Math.abs(demNut() - nutRong));
      lechCon = Math.max(lechCon, Math.abs(demCon(c2.scene) - (conRieng + nhomRong)));
      c2.scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
      cuoi.scene = c2.scene;
    }
    ghi('xoaHet gỡ sạch DOM qua 40 lần mở, đóng bài', lechNut === 0, `chênh ${lechNut} nút`);
    ghi('xoaHet gỡ sạch hình phụ trong cảnh', lechCon === 0, `chênh ${lechCon} vật`);
    ghi('Máy quay luôn được bật lại sau xoaHet giữa lúc kéo', loiDem === 0);

    // 15. Rò sự kiện: tạo, dùng rồi huỷ một khung tương tác thứ hai
    const dem2 = new Map();
    const goc = { add: EventTarget.prototype.addEventListener, rem: EventTarget.prototype.removeEventListener };
    EventTarget.prototype.addEventListener = function (ten, f, o) { dem2.set(this, (dem2.get(this) || 0) + 1); return goc.add.call(this, ten, f, o); };
    EventTarget.prototype.removeEventListener = function (ten, f, o) { dem2.set(this, (dem2.get(this) || 0) - 1); return goc.rem.call(this, ten, f, o); };
    const nut0 = demNut();
    let tt2;
    try {
      tt2 = new TuongTac(app);
      tt2.datCanh(cuoi.scene);
      tt2.tayNam({ viTri: [0, 0, 0], nhan: 'thử' });
      tt2.goiY('thử', null);
      tt2.capNhat(1 / 60);
      tt2.huy();
    } finally {
      EventTarget.prototype.addEventListener = goc.add;
      EventTarget.prototype.removeEventListener = goc.rem;
    }
    const conLai = [...dem2.values()].reduce((s, v) => s + v, 0);
    ghi('huy(): gỡ hết sự kiện đã gắn', conLai === 0, `còn ${conLai}`);
    ghi('huy(): gỡ hết DOM', demNut() === nut0, `chênh ${demNut() - nut0}`);
    ghi('huy(): gỡ nhóm hình phụ khỏi cảnh', !tt2.nhom.parent);

    // Trả lại cảnh mẫu để chụp sau kiểm
    tt.xoaHet();
    const c3 = dungCanh(tt, {});
    tt.datCanh(c3.scene);
    canh.scene = c3.scene;
    ghi('Không có lỗi JavaScript trong lúc kiểm', loiCuaSo.length === 0, loiCuaSo.join(' | ').slice(0, 400));
  } catch (e) {
    ghi('Bộ kiểm chạy hết', false, e?.stack || e);
  }
  window.removeEventListener('error', nghe);
  const pre = document.createElement('pre');
  pre.id = 'ket-qua-kiem';
  pre.hidden = true;
  pre.textContent = JSON.stringify(kq);
  document.body.append(pre);
  document.title = kq.every((k) => k.dat) ? 'KIEM:DAT' : 'KIEM:LOI';
}
