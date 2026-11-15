// Tệp thử cho mô-đun bầu trời (src/khung/bau-troi.js).
//
// Máy quay đứng ở tâm bầu trời, nhìn về một hướng. Hệ trục cảnh của tệp thử: Y lên là cực bắc thiên cầu,
// X tới điểm xuân phân (xích kinh 0h), Z = −(xích kinh 6h); nên ảnh có hướng bắc lên trên như khi ngửa mặt nhìn trời.
//
// Tham số riêng (app.tham):
//   huong=Sgr | Ori | Cyg | UMa | … (mã IAU của chòm sao) | Bac (vùng Bắc Cực) | tam (tâm Ngân Hà) | sao:<tên sao>
//   doSang=1          độ sáng bầu trời
//   soSao=5000        mức dày thưa
//   chom=1            vẽ nét chòm sao (chom=Ori,Tau để chọn chòm)
//   soDo=1            dựng thêm một cảnh giống bài sơ đồ (vài nét DuongDay sáng) để xem nền có tranh với hình chính không
//   macDinh=1         không truyền daiNganHa (dùng hướng mặc định theo hat)
//   hat=7
import * as THREE from 'three';
import { taoBauTroi, XD_SANG_TH } from '../../src/khung/bau-troi.js';
import { DuongDay, taoNhan } from '../../src/khung/ve.js';

const xdSangCanh = (v) => new THREE.Vector3(v[0], v[2], -v[1]);   // xích đạo → hệ cảnh của tệp thử

export default {
  mayAnh: { viTri: [0, 0, 0], dich: [0, 0, -1], fov: 50, gan: 0.01, xa: 100 },
  tao(app) {
    const t = app.tham;
    const scene = new THREE.Scene();
    const doSang = Number(t.get('doSang') ?? 1);
    const chom = t.get('chom');
    const bt = taoBauTroi({
      soSao: Number(t.get('soSao') ?? 5000), hat: Number(t.get('hat') ?? 7), doSang,
      daiNganHa: t.get('macDinh') === '1' ? null : { tam: xdSangCanh(XD_SANG_TH[0]).toArray(), cucBac: xdSangCanh(XD_SANG_TH[2]).toArray() },
      chomSao: chom ? (chom === '1' ? true : chom.split(',')) : null,
    });
    scene.add(bt);

    // Hướng nhìn.
    const h = t.get('huong') || 'Sgr';
    let dir;
    if (h === 'tam') dir = xdSangCanh(XD_SANG_TH[0]);
    else if (h === 'Bac') dir = new THREE.Vector3(0, Math.sin(1.33), -Math.cos(1.33)).normalize();   // xích vĩ ~76°, Bắc Cực ở mép trên
    else if (h.startsWith('sao:')) dir = bt.huongSao(decodeURIComponent(h.slice(4)));
    else dir = bt.huongChomSao(h);
    if (!dir) dir = new THREE.Vector3(0, 0, -1);
    if (!t.has('goc')) {
      app.camera.position.set(0, 0, 0);
      app.dk.target.copy(dir);
      app.dk.minDistance = 0; app.dk.update();
    }

    // Nhãn vài sao để tự kiểm vị trí trên ảnh.
    if (t.get('nhan') === '1') {
      for (const ten of ['Betelgeuse', 'Rigel', 'Sirius', 'Aldebaran', 'Vega', 'Deneb', 'Altair', 'Polaris', 'Antares', 'Dubhe']) {
        const v = bt.huongSao(ten);
        if (!v) continue;
        const n = taoNhan(ten, 'nho');
        n.position.copy(v).multiplyScalar(20);
        scene.add(n);
      }
    }

    // Cảnh giống bài sơ đồ: quỹ đạo elip sáng, trục, một nét phụ mờ, đặt trước máy quay.
    if (t.get('soDo') === '1') {
      const truoc = dir.clone().normalize();
      const phai = new THREE.Vector3().crossVectors(truoc, new THREE.Vector3(0, 1, 0)).normalize();
      const len = new THREE.Vector3().crossVectors(phai, truoc);
      const tam = truoc.clone().multiplyScalar(6);
      const nhom = new THREE.Group();
      const n = 160;
      const elip = new DuongDay(n + 1, { mau: new THREE.Color(0xf3c66f).multiplyScalar(2.2), rong: 2.4, quang: 0.25 });
      const phu = new DuongDay(n + 1, { mau: 0x6fb7f3, rong: 1.4, doMo: 0.55 });
      const p = new THREE.Vector3();
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        p.copy(tam).addScaledVector(phai, 2.2 * Math.cos(a)).addScaledVector(len, 0.9 * Math.sin(a) + 0.2 * Math.cos(a));
        elip.dat(i, p.x, p.y, p.z);
        p.copy(tam).addScaledVector(phai, 1.3 * Math.cos(a)).addScaledVector(len, 1.3 * Math.sin(a));
        phu.dat(i, p.x, p.y, p.z);
      }
      elip.xong(n + 1); phu.xong(n + 1);
      const truc = new DuongDay(2, { mau: new THREE.Color(0x7ee0a0).multiplyScalar(1.6), rong: 2 });
      const a1 = tam.clone().addScaledVector(len, -1.8), a2 = tam.clone().addScaledVector(len, 1.8);
      truc.dat(0, a1.x, a1.y, a1.z); truc.dat(1, a2.x, a2.y, a2.z); truc.xong(2);
      nhom.add(elip.line, phu.line, truc.line);
      const qua = new THREE.Mesh(new THREE.SphereGeometry(0.28, 48, 24), new THREE.MeshStandardMaterial({ color: 0x4f86c6, roughness: 0.6 }));
      qua.position.copy(tam).addScaledVector(phai, 2.2);
      nhom.add(qua);
      const den = new THREE.DirectionalLight(0xffffff, 2.5); den.position.copy(tam).addScaledVector(phai, -5).addScaledVector(truoc, -4);
      scene.add(den, new THREE.AmbientLight(0xffffff, 0.08));
      scene.add(nhom);
      const nh = taoNhan('Quỹ đạo<small>cảnh sơ đồ thử</small>', 'vang');
      nh.position.copy(tam).addScaledVector(phai, -2.4).addScaledVector(len, 1.1);
      scene.add(nh);
    }
    return { scene, capNhat() {} };
  },
};
