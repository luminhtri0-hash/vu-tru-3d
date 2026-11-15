// Tệp thử phòng trưng bày cho thư viện thiên thể (src/khung/hanh-tinh.js).
// Tham số riêng (đọc ở app.tham):
//   vat=mat-troi | trai-dat | mat-trang | thuy | kim | hoa | moc | tho | thienVuong | haiVuong
//       | sao | lo-den | thien-ha | sao-choi | hang (xếp hàng mọi thiên thể) | cu (hàm Bản 2: vân nướng + vành + khí quyển)
//   sang=x,y,z   hướng tới nguồn sáng (hệ thế giới), mặc định 1,0.25,0.6
//   quay=<rad>   góc tự quay ban đầu của thiên thể (để chọn mặt nhìn thấy)
//   r=<số>       bán kính
//   dia=0        tắt đĩa bồi tụ của lỗ đen
//   nhietDo=<K>  màu sao theo nhiệt độ
import * as THREE from 'three';
import { taoNenSao } from '../../src/khung/ve.js';
import {
  taoMatTroi, taoTraiDat, taoMatTrang, taoHanhTinh, taoSao, taoLoDenNho, taoThienHaNho, taoSaoChoi,
  taoVanBeMat, veNetDan, taoVanhTho, taoKhiQuyen, khungDatLien,
} from '../../src/khung/hanh-tinh.js';

const so3 = (s, md) => (s ? s.split(',').map(Number) : md);

export default {
  mayAnh: { viTri: [0, 0.6, 4.2], dich: [0, 0, 0], fov: 40 },
  tao(app) {
    const tham = app.tham;
    const vat = tham.get('vat') || 'trai-dat';
    const sang = new THREE.Vector3(...so3(tham.get('sang'), [1, 0.25, 0.6])).normalize();
    const quay = Number(tham.get('quay') || 0);
    const r = Number(tham.get('r') || 1);
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 6000, hat: 3, doSang: 0.8 }));
    const ds = [];
    const t0 = performance.now();
    const them = (o, viTri = [0, 0, 0]) => {
      o.nhom.position.set(...viTri);
      scene.add(o.nhom);
      o.datHuongSang?.(sang);
      if (o.cau && o.datHuongSang) o.cau.rotation.y = quay;
      ds.push(o);
      return o;
    };
    let matTroi = null, tMT = 0;
    const HANH = ['thuy', 'kim', 'hoa', 'moc', 'tho', 'thienVuong', 'haiVuong'];
    if (vat === 'mat-troi') { matTroi = taoMatTroi({ banKinh: r }); scene.add(matTroi.nhom); }
    else if (vat === 'trai-dat') them(taoTraiDat({ banKinh: r }));
    else if (vat === 'mat-trang') them(taoMatTrang({ banKinh: r }));
    else if (HANH.includes(vat)) them(taoHanhTinh({ id: vat, banKinh: r }));
    else if (vat === 'sao') {
      them(taoSao({ nhietDo: Number(tham.get('nhietDo') || 20000), banKinh: 0.08 * r, doSang: 1.5 }), [-0.6, 0.1, 0]);
      them(taoSao({ nhietDo: 3600, banKinh: 0.05 * r, doSang: 1, hat: 2 }), [0.7, -0.25, 0]);
      them(taoSao({ nhietDo: 5800, banKinh: 0.03 * r, doSang: 0.8, tia: 6, hat: 3 }), [0.2, 0.5, -0.5]);
    } else if (vat === 'lo-den') them(taoLoDenNho({ banKinh: 0.32 * r, dia: tham.get('dia') !== '0' }));
    else if (vat === 'thien-ha') {
      const th = them(taoThienHaNho({ banKinh: 1.4 * r }));
      th.nhom.rotation.x = 0.55;
      const e = them(taoThienHaNho({ banKinh: 0.5 * r, kieu: 'elip', hat: 7, soSao: 6000 }), [1.9, 0.6, -1.5]);
      e.nhom.rotation.z = 0.4;
    } else if (vat === 'sao-choi') {
      const sc = them(taoSaoChoi({ banKinh: 0.12 * r, dai: 2.6 * r }), [-0.9, -0.2, 0]);
      sc.datHuongSang(new THREE.Vector3(-1, -0.1, 0.2));
      sc.datHuongBay(new THREE.Vector3(0.2, 0.8, 0.3));
    } else if (vat === 'cu') {
      // Hàm Bản 2 như Bài 1 đang gọi: vân nướng gắn vào MeshStandardMaterial, Mặt Trời (đèn điểm) ở gốc toạ độ.
      scene.add(new THREE.AmbientLight(0xffffff, 0.07));
      scene.add(new THREE.PointLight(0xfff4e6, 3.2, 0, 0));
      matTroi = taoMatTroi(); scene.add(matTroi.nhom);
      const dsTex = [];
      const geo = new THREE.SphereGeometry(1, 64, 32);
      const viTri = { dat: [3, 0, 0], tho: [5.5, 0, -3], moc: [2.6, 0, -4.2] };
      for (const id of ['dat', 'tho', 'moc']) {
        const truc = new THREE.Group();
        truc.position.set(...viTri[id]);
        truc.rotation.z = id === 'tho' ? 0.47 : 0.41;
        truc.scale.setScalar(id === 'dat' ? 0.5 : 0.9);
        const tex = taoVanBeMat(id); dsTex.push(tex);
        const cau = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 }));
        cau.rotation.y = quay;
        truc.add(cau);
        if (id === 'dat') {
          const tm = taoVanBeMat('may'); dsTex.push(tm);
          const may = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tm, transparent: true, depthWrite: false, roughness: 1 }));
          may.scale.setScalar(1.012); truc.add(may);
          truc.add(taoKhiQuyen(0x6fb2ff, 1.4, 1.06));
        } else truc.add(taoKhiQuyen(0xffe8c0, 0.35, 1.04));
        if (id === 'tho') truc.add(taoVanhTho());
        scene.add(truc);
      }
      ds.push({ capNhat: () => veNetDan(dsTex, 50) });
    } else if (vat === 'hang') {
      // xếp hàng: Mặt Trời bên trái, ánh sáng từ phía Mặt Trời
      matTroi = taoMatTroi({ banKinh: 1.3 });
      matTroi.nhom.position.set(-7.4, 0, 0);
      scene.add(matTroi.nhom);
      const hang = [['thuy', 0.32], ['kim', 0.48], ['dat', 0.5], ['trang', 0.2], ['hoa', 0.38], ['moc', 1.05], ['tho', 0.9], ['thienVuong', 0.62], ['haiVuong', 0.6]];
      let x = -5.4;
      for (const [id, rr] of hang) {
        const o = id === 'dat' ? taoTraiDat({ banKinh: rr }) : id === 'trang' ? taoMatTrang({ banKinh: rr }) : taoHanhTinh({ id, banKinh: rr });
        const lui = id === 'tho' ? 1.35 : 0;
        x += rr + 0.28 + lui;
        o.nhom.position.set(x, 0, 0);
        x += rr + lui;
        o.datNguonSang(matTroi.nhom.position);
        scene.add(o.nhom);
        ds.push(o);
      }
      them(taoSao({ nhietDo: 9500, banKinh: 0.06, doSang: 1.4 }), [-3.6, -2.4, 0]);
      them(taoSao({ nhietDo: 3400, banKinh: 0.05, doSang: 1, hat: 4 }), [-2.6, -2.1, 0]);
      const ld = them(taoLoDenNho({ banKinh: 0.32 }), [0.6, -2.3, 0]);
      ld.nhom.rotation.x = 0.18;
      const th = them(taoThienHaNho({ banKinh: 1.1, soSao: 12000 }), [4.4, -2.4, 0]);
      th.nhom.rotation.x = 0.7;
      const sc = them(taoSaoChoi({ banKinh: 0.1, dai: 2.2 }), [-0.9, 2.2, 0]);
      sc.datHuongSang(new THREE.Vector3(-1, -0.2, 0));
      sc.datHuongBay(new THREE.Vector3(0, -1, 0.2));
    }
    const msTao = performance.now() - t0;
    window.__thoiGianTao = msTao;
    document.body.dataset.thoiGianTao = msTao.toFixed(1) + " " + (khungDatLien.thoiGian || []).map((x) => x.toFixed(0)).join("/");
    console.log(`Tạo ${vat}: ${msTao.toFixed(1)} ms`);
    return {
      scene,
      capNhat(dt) {
        if (matTroi) { tMT += dt; matTroi.capNhat(tMT, matTroi.banKinh); }
        for (const o of ds) o.capNhat?.(dt, app.camera);
      },
    };
  },
};
