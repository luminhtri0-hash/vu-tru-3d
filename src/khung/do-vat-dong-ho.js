// Đồng hồ kim 3D và đồng hồ ánh sáng.
//
// taoDongHo({ banKinh = 0.385, mauVien = 0x7fcaff, mauKim = 0xf3c66f, nhip = 1, chuKy = 60, kimPhut = true, so = true })
//   → { nhom, kim, datGio(giay), tich(), datMau(vien, kim), capNhat(dt) }
//   Mặt số nằm trong mặt phẳng xy, nhìn về +z, tâm ở gốc (cùng cỡ và cùng hướng với đồng hồ phẳng của Bản 2:
//   có thể quay nhom theo máy quay như cũ). Vỏ kim loại, vành sáng màu mauVien (nhận ra từ xa), mặt số tối có
//   vạch phát sáng nhẹ, kim giờ, kim phút, kim giây chạy mượt (một vòng = chuKy giây), mặt kính phản chiếu.
//   Mỗi nhịp (nhip giây theo đồng hồ này) vành và quầng nháy sáng một cái. kim = trục kim giây (rotation.z).
//
// taoDongHoAnhSang({ cao = 1, banKinh = 0.2, mau = 0xf3c66f, mauKhung = 0x7fcaff })
//   → { nhom, datThoiGian(t, chuKy?), datPha(p), capNhat(dt) }
//   Hai gương tròn song song (gương dưới ở y = 0, gương trên ở y = cao), hai cột đỡ, đế; một xung sáng nảy qua
//   lại có vệt đuôi. Mỗi lần xung về gương dưới là một «tích»: gương dưới nháy sáng.

import * as THREE from 'three';
import { vlKimLoai, vlSang, vlKinh, taoKetCau, hopBo, ghep, dat, domSang, demTamGiac } from './do-vat-chung.js';

function matSo(mauVien, so) {
  const N = 512;
  return taoKetCau(N, N, (g) => {
    const c = N / 2;
    const gr = g.createRadialGradient(c, c * 0.8, 0, c, c, c);
    gr.addColorStop(0, '#16203a'); gr.addColorStop(0.7, '#0a1022'); gr.addColorStop(1, '#04060c');
    g.fillStyle = gr; g.fillRect(0, 0, N, N);
    // vòng chia phút
    g.strokeStyle = 'rgba(200,215,240,0.28)'; g.lineWidth = 2;
    g.beginPath(); g.arc(c, c, c * 0.9, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, lon = i % 5 === 0;
      const r0 = lon ? c * 0.72 : c * 0.84, r1 = c * 0.94;
      g.strokeStyle = lon ? '#f4f7ff' : 'rgba(225,232,248,0.75)';
      g.lineWidth = lon ? (i % 15 === 0 ? 17 : 11) : 3.5;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); g.stroke();
    }
    if (so) {
      g.fillStyle = 'rgba(235,240,252,0.92)';
      g.font = '600 64px "Inter", "Helvetica Neue", Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const [t, k] of [['12', 0], ['3', 3], ['6', 6], ['9', 9]]) {
        const a = (k / 12) * Math.PI * 2;
        g.fillText(t, c + Math.sin(a) * c * 0.53, c - Math.cos(a) * c * 0.53 + 3);
      }
    }
    // vòng trong mảnh màu vành
    g.strokeStyle = `#${new THREE.Color(mauVien).getHexString()}`; g.globalAlpha = 0.55; g.lineWidth = 3;
    g.beginPath(); g.arc(c, c, c * 0.3, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;
  });
}

// Kim: hình thoi thon, đùn mỏng; gốc ở trục quay, chĩa theo +y.
function hinhKim(dai, rong, duoi, day) {
  const s = new THREE.Shape();
  s.moveTo(0, -duoi);
  s.lineTo(rong * 0.5, 0);
  s.lineTo(rong * 0.32, dai * 0.82);
  s.lineTo(0, dai);
  s.lineTo(-rong * 0.32, dai * 0.82);
  s.lineTo(-rong * 0.5, 0);
  s.lineTo(0, -duoi);
  return new THREE.ExtrudeGeometry(s, { depth: day, bevelEnabled: false });
}

export function taoDongHo({ banKinh = 0.385, mauVien = 0x7fcaff, mauKim = 0xf3c66f, nhip = 1, chuKy = 60, kimPhut = true, so = true } = {}) {
  const R = banKinh;
  const nhom = new THREE.Group();
  nhom.name = 'dong-ho';
  // vỏ: mặt cắt bo tròn, tiện quanh trục z
  const p = [[0, -0.16], [0.9, -0.16], [1.02, -0.12], [1.1, -0.04], [1.11, 0.04], [1.07, 0.1], [1.0, 0.115], [0.955, 0.09], [0.94, 0.03]]
    .map(([r, z]) => new THREE.Vector2(r * R, z * R));
  const vo = new THREE.LatheGeometry(p, 56); vo.rotateX(Math.PI / 2);
  nhom.add(new THREE.Mesh(vo, vlKimLoai(0x9aa2ae, 0.3)));
  // vành sáng
  const vlVien = vlSang(mauVien, 1.35);
  const vien = new THREE.Mesh(new THREE.TorusGeometry(R * 1.0, R * 0.022, 8, 72), vlVien);
  vien.position.z = R * 0.118;
  nhom.add(vien);
  // mặt số
  const vlMat = new THREE.MeshBasicMaterial({ map: matSo(mauVien, so), color: new THREE.Color(0.95, 0.95, 0.95) });
  const mat = new THREE.Mesh(new THREE.CircleGeometry(R * 0.945, 64), vlMat);
  mat.position.z = R * 0.03;
  nhom.add(mat);
  // kim
  const day = R * 0.012;
  const vlKimTrang = vlKimLoai(0xe9edf5, 0.25, { emissive: 0xffffff, emissiveIntensity: 0.18 });
  const truc = (z) => { const g = new THREE.Group(); g.position.z = z; nhom.add(g); return g; };
  const kimGio = truc(R * 0.045), kimPh = truc(R * 0.06), kimGiay = truc(R * 0.075);
  if (kimPhut) {
    kimGio.add(new THREE.Mesh(hinhKim(R * 0.5, R * 0.085, R * 0.08, day), vlKimTrang));
    kimPh.add(new THREE.Mesh(hinhKim(R * 0.78, R * 0.062, R * 0.1, day), vlKimTrang));
  }
  const vlKim = vlSang(mauKim, 1.5);
  {
    const ds = [hinhKim(R * 0.9, R * 0.03, R * 0.26, day)];
    ds.push(dat(new THREE.CylinderGeometry(R * 0.05, R * 0.05, day, 16), { rx: Math.PI / 2, y: -R * 0.2, z: day / 2 }));
    ds.push(dat(new THREE.CylinderGeometry(R * 0.045, R * 0.045, day * 2.5, 16), { rx: Math.PI / 2, z: day }));
    kimGiay.add(new THREE.Mesh(ghep(ds), vlKim));
  }
  // kính: chỏm cầu rất dẹt
  const rC = R * 4;
  const kinhG = new THREE.SphereGeometry(rC, 40, 3, 0, Math.PI * 2, 0, Math.asin(0.95 / 4));
  kinhG.rotateX(Math.PI / 2); kinhG.translate(0, 0, R * 0.11 - rC);
  const kinh = new THREE.Mesh(kinhG, vlKinh(0xe6f2ff, 0.05, { side: THREE.FrontSide, envMapIntensity: 0.7 }));
  kinh.renderOrder = 3;
  nhom.add(kinh);
  // quầng nháy mỗi nhịp
  const quang = domSang(mauVien, R * 3.4, 1.4);
  quang.material.opacity = 0;
  quang.position.z = -R * 0.05;
  nhom.add(quang);

  const mauVienGoc = vlVien.color.clone();
  let nhay = 0, kCu = null;
  const ketQua = {
    nhom, kim: kimGiay,
    datGio(giay) {
      const g = giay / chuKy;
      kimGiay.rotation.z = -2 * Math.PI * (g - Math.floor(g));
      kimPh.rotation.z = (-2 * Math.PI * g) / 60;
      kimGio.rotation.z = (-2 * Math.PI * g) / 720;
      const k = Math.floor(giay / nhip);
      if (kCu !== null && k !== kCu) nhay = 1;
      kCu = k;
    },
    tich() { nhay = 1; },
    datMau(vienMoi, kimMoi) {
      if (vienMoi != null) { mauVienGoc.set(vienMoi).multiplyScalar(1.35); quang.material.color.set(vienMoi).multiplyScalar(1.4); }
      if (kimMoi != null) vlKim.color.set(kimMoi).multiplyScalar(1.5);
    },
    capNhat(dt) {
      nhay *= Math.exp(-dt * 7);
      vlVien.color.copy(mauVienGoc).multiplyScalar(1 + 1.8 * nhay);
      quang.material.opacity = 0.75 * nhay;
    },
    soTamGiac: 0,
  };
  ketQua.datGio(0);
  ketQua.capNhat(0);
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}

export function taoDongHoAnhSang({ cao = 1, banKinh = 0.2, mau = 0xf3c66f, mauKhung = 0x7fcaff } = {}) {
  const r = banKinh;
  const nhom = new THREE.Group();
  nhom.name = 'dong-ho-anh-sang';
  const vlKhung = vlKimLoai(0x7d8594, 0.32);
  const ds = [];
  const xC = r + 0.07;
  ds.push(dat(hopBo(2 * xC + 0.14, 0.05, 2 * r + 0.1, 0.015), { y: -0.075 }));          // đế
  for (const s of [-1, 1]) {
    ds.push(dat(new THREE.CylinderGeometry(0.022, 0.026, cao + 0.16, 12), { x: s * xC, y: cao / 2 + 0.03 }));
    for (const y of [-0.016, cao + 0.016]) ds.push(dat(hopBo(0.07, 0.03, 0.05, 0.008), { x: s * (xC - 0.035), y }));
  }
  nhom.add(new THREE.Mesh(ghep(ds), vlKhung));
  // hai gương: mặt bạc nhẵn, gờ kim loại, vành sáng
  const vlGuong = vlKimLoai(0xf2f4f8, 0.05, { envMapIntensity: 1.8 });
  const vlGo = vlKimLoai(0x5c6370, 0.35);
  const vlVanh = vlSang(mauKhung, 1.4);
  const guong = [];
  for (const [y, lat] of [[0, false], [cao, true]]) {
    const g = new THREE.Group();
    g.position.y = y;
    const de = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.012, r + 0.012, 0.035, 40), vlGo);
    de.position.y = lat ? 0.0175 : -0.0175;
    const mat = new THREE.Mesh(new THREE.CircleGeometry(r, 40), vlGuong);
    mat.rotation.x = lat ? Math.PI / 2 : -Math.PI / 2;
    mat.position.y = lat ? -0.001 : 0.001;
    const vanh = new THREE.Mesh(new THREE.TorusGeometry(r + 0.008, 0.006, 6, 56), vlVanh.clone());
    vanh.rotation.x = Math.PI / 2;
    g.add(de, mat, vanh);
    nhom.add(g);
    guong.push(vanh);
  }
  // xung sáng và vệt đuôi
  const N = 7;
  const xung = [];
  for (let i = 0; i < N; i++) {
    const d = domSang(mau, (i === 0 ? 0.16 : 0.12 * (1 - i / N)) * Math.max(0.6, cao), i === 0 ? 4 : 2.2);
    d.material.opacity = i === 0 ? 1 : 0.7 * Math.pow(1 - i / N, 1.4);
    nhom.add(d);
    xung.push(d);
  }
  const mauVanh = vlVanh.color.clone();
  let T = 1.2, kCu = null, knCu = null;
  const nhay = [0, 0];
  const yTai = (t) => { const p = ((t / T) % 1 + 1) % 1; return cao * (1 - Math.abs(1 - 2 * p)); };
  const ketQua = {
    nhom,
    // t: thời gian riêng của đồng hồ (giây); chuKy: thời gian một tích (đi lên rồi về).
    datThoiGian(t, chuKy = T) {
      T = chuKy;
      for (let i = 0; i < N; i++) xung[i].position.set(0, yTai(t - i * T * 0.018), 0);
      const k = Math.floor(t / T), kn = Math.floor(t / T + 0.5);
      if (kCu !== null) { if (k !== kCu) nhay[0] = 1; if (kn !== knCu) nhay[1] = 1; }
      kCu = k; knCu = kn;
    },
    datPha(p) { this.datThoiGian(p * T, T); },
    capNhat(dt) {
      for (let i = 0; i < 2; i++) {
        nhay[i] *= Math.exp(-dt * 8);
        guong[i].material.color.copy(mauVanh).multiplyScalar(1 + 2.5 * nhay[i]);
      }
    },
    soTamGiac: 0,
  };
  ketQua.datThoiGian(0);
  ketQua.soTamGiac = demTamGiac(nhom);
  return ketQua;
}
