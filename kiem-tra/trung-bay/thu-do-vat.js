// Tệp thử cho thư viện đồ vật (src/khung/do-vat.js) trong phòng trưng bày.
//   node kiem-tra/trung-bay.mjs kiem-tra/trung-bay/thu-do-vat.js "Dữ liệu làm việc/do-vat"
//   bash kiem-tra/chup.sh "Dữ liệu làm việc/do-vat/index.html" "Dữ liệu làm việc/do-vat/a.png" "vat=phi-hanh-gia&tuThe=lo-lung&tua=2"
// Tham số riêng:
//   vat = phi-hanh-gia | buong | ten-lua | ten-lua-buong | dong-ho | dong-ho-anh-sang | can | bong | den-chieu
//         | ve-tinh | thap | tat-ca | bai-7
//   tuThe = dung | gio-tay | tha | lo-lung | nhun     tay = trai | phai
//   tuThe2 = … (đổi sang tư thế này lúc t = doiLuc giây, mặc định 1), nhun = 1 (nhún một cái lúc doiLuc)
//   luc = 0…1 (lực đẩy tên lửa), luc2 (đổi lúc doiLuc)
//   gio = <giây> (đồng hồ), so = <chữ trên cân>, nen = 0 (bỏ nền sao), thongTin = 0 (ẩn ô số liệu)
import * as THREE from 'three';
import { taoNenSao, taoNhan } from '../../src/khung/ve.js';
import {
  taoDenCanh, taoPhiHanhGia, taoBuong, taoTenLua, taoDongHo, taoDongHoAnhSang,
  taoCan, taoBong, taoDenChieu, taoVeTinh, taoThap,
} from '../../src/khung/do-vat.js';

const GOC = {
  'phi-hanh-gia': [[1.6, 1.5, 3.6], [0, 0.95, 0]],
  buong: [[5.5, 3.6, 9.5], [0, 1.9, 0]],
  'ten-lua': [[3.2, 2.6, 6.8], [0, 2.1, 0]],
  'ten-lua-buong': [[7, 3, 15], [0, 1.4, 0]],
  'dong-ho': [[0.25, 0.25, 1.6], [0, 0, 0]],
  'dong-ho-anh-sang': [[0.9, 0.9, 2.2], [0, 0.45, 0]],
  can: [[0.55, 0.55, 0.95], [0, 0.05, 0]],
  bong: [[0.25, 0.15, 0.6], [0, 0, 0]],
  'den-chieu': [[0.5, 0.35, 1.0], [0.25, 0, 0]],
  've-tinh': [[2.2, 1.4, 3.2], [0, 0, 0]],
  thap: [[4.5, 3.2, 7.5], [0, 2.1, 0]],
  'tat-ca': [[0, 2.6, 11], [0, 1.2, 0]],
  'bai-7': [[0.4, 2.6, 17.5], [0, 1.4, 0]],
};

export default {
  mayAnh: { viTri: [3, 2, 6], dich: [0, 1, 0], fov: 40, gan: 0.02, xa: 2000 },
  tao(app) {
    const t = app.tham;
    const vat = t.get('vat') || 'phi-hanh-gia';
    const scene = new THREE.Scene();
    if (t.get('nen') !== '0') scene.add(taoNenSao({ soSao: 2600, hat: 61, doSang: 0.6 }));
    const t0 = performance.now();
    const den = taoDenCanh(scene, { renderer: app.renderer });
    const msDen = performance.now() - t0;
    if (!t.has('goc') && GOC[vat]) {
      app.camera.position.set(...GOC[vat][0]);
      app.dk.target.set(...GOC[vat][1]);
    }
    const ds = [];          // các vật có capNhat
    const tt = [];          // dòng số liệu
    const doLuc = (ten, f) => { const a = performance.now(); const v = f(); tt.push(`${ten}: ${v.soTamGiac} tam giác, ${(performance.now() - a).toFixed(1)} ms`); if (v.capNhat) ds.push(v); return v; };
    const tuThe = t.get('tuThe') || 'dung', tay = t.get('tay') || 'phai';
    const luc = Number(t.get('luc') ?? 1);
    const hen = [];         // việc hẹn giờ: [giây, hàm]
    const doiLuc = Number(t.get('doiLuc') ?? 1);

    const sanDat = (r = 2.2) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.9, metalness: 0.1 }));
      m.rotation.x = -Math.PI / 2;
      scene.add(m);
      return m;
    };

    if (vat === 'phi-hanh-gia') {
      sanDat(1.6);
      const p = doLuc('phi hành gia', () => taoPhiHanhGia({ tuThe, tay }));
      scene.add(p.nhom);
      if (t.has('tuThe2')) hen.push([doiLuc, () => p.datTuThe(t.get('tuThe2'), { tay })]);
      if (t.get('nhun') === '1') hen.push([doiLuc, () => p.nhun(1)]);
      if (tuThe === 'gio-tay' || tuThe === 'tha') {
        const b = taoBong();
        scene.add(b.nhom);
        ds.push({ capNhat: () => { p.viTriCam(b.nhom.position, 0.13, tay); } });
      }
    } else if (vat === 'buong') {
      const b = doLuc('buồng', () => taoBuong({ mau: Number(t.get('mau') || 0x8fd0ff) }));
      scene.add(b.nhom);
    } else if (vat === 'ten-lua') {
      const r = doLuc('tên lửa', () => taoTenLua({ luc }));
      scene.add(r.nhom);
      if (t.has('luc2')) hen.push([doiLuc, () => r.datLucDay(Number(t.get('luc2')))]);
    } else if (vat === 'ten-lua-buong') {
      const r = doLuc('tên lửa chở buồng', () => taoTenLua({ luc, choBuong: { rong: 3, cao: 4, sau: 3 } }));
      scene.add(r.nhom);
      const b = doLuc('buồng', () => taoBuong({ mau: 0xf3c66f }));
      r.neoBuong.add(b.nhom);
    } else if (vat === 'dong-ho') {
      const d = doLuc('đồng hồ', () => taoDongHo());
      scene.add(d.nhom);
      let g = Number(t.get('gio') ?? 7.3);
      ds.push({ capNhat: (dt) => { g += dt; d.datGio(g); } });
      const d2 = taoDongHo({ mauVien: 0xf3c66f, mauKim: 0xffffff, banKinh: 0.2 });
      d2.nhom.position.set(0.75, 0.15, -0.3);
      scene.add(d2.nhom); ds.push(d2);
      ds.push({ capNhat: () => d2.datGio(g * 0.7) });
    } else if (vat === 'dong-ho-anh-sang') {
      const d = doLuc('đồng hồ ánh sáng', () => taoDongHoAnhSang());
      scene.add(d.nhom);
      let g = 0;
      ds.push({ capNhat: (dt) => { g += dt; d.datThoiGian(g, 1.2); } });
    } else if (vat === 'can') {
      sanDat(0.8);
      const c = doLuc('cân', () => taoCan());
      c.datSo(t.get('so') || '70.0');
      scene.add(c.nhom);
    } else if (vat === 'bong') {
      const b = doLuc('bóng', () => taoBong());
      scene.add(b.nhom);
    } else if (vat === 'den-chieu') {
      const d = doLuc('đèn chiếu', () => taoDenChieu({ doDai: 1.2 }));
      scene.add(d.nhom);
    } else if (vat === 've-tinh') {
      const v = doLuc('vệ tinh', () => taoVeTinh());
      scene.add(v.nhom);
    } else if (vat === 'thap') {
      sanDat(2.5);
      const th = doLuc('tháp', () => taoThap());
      scene.add(th.nhom);
      for (const [ten, banKinh] of [['dai1', 0.16], ['dai2', 0.16]]) {
        const d = taoDongHo({ banKinh });
        th.neo(ten, d.nhom.position).add(new THREE.Vector3(0.62, 0.05, 0.2));
        scene.add(d.nhom); ds.push(d);
        let g = 3;
        ds.push({ capNhat: (dt) => { g += dt; d.datGio(g); } });
      }
    } else if (vat === 'tat-ca') {
      const xs = [-4.2, -2.6, -1.2, 0, 1.3, 2.6, 4.2];
      const chi = t.has('chi') ? t.get('chi').split(',') : null;  // chỉ dựng vài vật (để dò lỗi)
      const co = (k) => !chi || chi.includes(k);
      if (co('nguoi')) { const p = doLuc('phi hành gia', () => taoPhiHanhGia({ tuThe: 'gio-tay', tay: 'trai' })); p.nhom.position.x = xs[0]; scene.add(p.nhom); }
      if (co('can')) { const c = doLuc('cân', () => taoCan()); c.nhom.position.x = xs[1]; c.datSo('70.0'); scene.add(c.nhom); }
      if (co('bong')) { const b = doLuc('bóng', () => taoBong()); b.nhom.position.set(xs[1], 0.6, 0); scene.add(b.nhom); }
      let g = 9;
      ds.push({ capNhat: (dt) => { g += dt; } });
      if (co('dongho')) { const d = doLuc('đồng hồ', () => taoDongHo({ banKinh: 0.45 })); d.nhom.position.set(xs[2], 1.4, 0); scene.add(d.nhom); ds.push({ capNhat: () => d.datGio(g) }); }
      if (co('dhas')) { const da = doLuc('đồng hồ ánh sáng', () => taoDongHoAnhSang()); da.nhom.position.set(xs[3], 0.2, 0); scene.add(da.nhom); ds.push({ capNhat: () => da.datThoiGian(g, 1.2) }); }
      if (co('den')) { const dc = doLuc('đèn chiếu', () => taoDenChieu({ doDai: 1.0 })); dc.nhom.position.set(xs[3] - 0.2, 1.8, 0); scene.add(dc.nhom); }
      if (co('vetinh')) { const v = doLuc('vệ tinh', () => taoVeTinh({ co: 0.55 })); v.nhom.position.set(xs[4], 2.4, 0); scene.add(v.nhom); }
      if (co('thap')) { const th = doLuc('tháp', () => taoThap({ cao: 3 })); th.nhom.position.x = xs[5]; scene.add(th.nhom); }
      if (co('tenlua')) { const r = doLuc('tên lửa', () => taoTenLua({ luc, cao: 3.2, banKinh: 0.32 })); r.nhom.position.set(xs[6], 0.8, 0); scene.add(r.nhom); }
    } else if (vat === 'bai-7') {
      // Cảnh ghép giống Bài 7: buồng trái đứng trên mặt đất, buồng phải chở trên tên lửa đang phụt lửa.
      const XA = -2.7, XB = 2.7;
      const dat = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.5, 64), new THREE.MeshStandardMaterial({ color: 0x2f5f4a, roughness: 0.95 }));
      dat.position.set(XA, -0.39, 0);
      scene.add(dat);
      const A = doLuc('buồng A', () => taoBuong({ mau: 0x8fd0ff, cuaSo: 'sau' }));
      A.nhom.position.x = XA; scene.add(A.nhom);
      const R = doLuc('tên lửa chở buồng', () => taoTenLua({ luc, choBuong: { rong: 3, cao: 4, sau: 3 }, mauNhan: 0xf3c66f }));
      R.nhom.position.x = XB; scene.add(R.nhom);
      const B = doLuc('buồng B', () => taoBuong({ mau: 0xf3c66f, cuaSo: 'sau' }));
      R.neoBuong.add(B.nhom);
      for (const [buong, mauNhan] of [[A, 0x8fd0ff], [B, 0xf3c66f]]) {
        const c = doLuc('cân', () => taoCan());
        c.nhom.position.set(-0.55, 0, 0.2); c.datSo(t.get('so') || '70.0');
        buong.nhom.add(c.nhom);
        const p = doLuc('phi hành gia', () => taoPhiHanhGia({ tuThe: tuThe === 'dung' ? 'gio-tay' : tuThe, tay: 'trai', mauNhan }));
        p.nhom.position.set(-0.55, 0.1, 0.2);
        buong.nhom.add(p.nhom);
        if (t.get('nhun') === '1') hen.push([doiLuc, () => p.nhun(1)]);
        if (t.has('tuThe2')) hen.push([doiLuc, () => p.datTuThe(t.get('tuThe2'), { tay: 'trai' })]);
        const b = doLuc('bóng', () => taoBong());
        scene.add(b.nhom);
        ds.push({ capNhat: () => { p.viTriCam(b.nhom.position, 0.13, 'trai'); } });
        const dc = doLuc('đèn chiếu', () => taoDenChieu({ mau: 0x7fd6ff, doDai: 2.85 }));
        dc.nhom.position.set(-1.24, 3.3, -0.7);
        buong.nhom.add(dc.nhom);
      }
      if (t.has('luc2')) hen.push([doiLuc, () => R.datLucDay(Number(t.get('luc2')))]);
      const nA = taoNhan('Đứng yên trên mặt đất', 'xanh dam', { giua: true }); nA.position.set(XA, 4.75, 0); scene.add(nA);
      const nB = taoNhan('Tên lửa tăng tốc 9,8 m/s²', 'vang dam', { giua: true }); nB.position.set(XB, 7.0, 0); scene.add(nB);
    }

    // an=ten1,ten2: ẩn các nhóm có tên này (dò lỗi)
    if (t.has('an')) { const an = t.get('an').split(','); scene.traverse((o) => { if (an.includes(o.name)) o.visible = false; }); }
    const tong = performance.now() - t0;
    if (t.get('thongTin') !== '0') {
      const o = document.createElement('div');
      o.style.cssText = 'position:fixed;left:12px;bottom:10px;font:12px/1.45 ui-monospace,Menlo,monospace;color:#9aa3b5;background:rgba(5,8,16,.6);padding:6px 9px;border-radius:6px;white-space:pre;z-index:9';
      o.textContent = `${tt.join('\n')}\nbộ đèn + môi trường: ${msDen.toFixed(1)} ms · tổng ${tong.toFixed(1)} ms`;
      document.body.append(o);
    }
    console.log(tt.join('\n'));

    let gio = 0;
    return {
      scene,
      capNhat(dt) {
        gio += dt;
        for (let i = hen.length - 1; i >= 0; i--) if (gio >= hen[i][0]) { hen[i][1](); hen.splice(i, 1); }
        for (const v of ds) v.capNhat(dt);
      },
      den,
    };
  },
};
