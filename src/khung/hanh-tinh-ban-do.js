// Mặt nạ đất liền thật của Trái Đất: bờ biển Natural Earth 1:50 triệu (gói world-atlas/land-50m.json),
// đọc bằng topojson-client, tô vào khung vẽ 2D theo phép chiếu kinh-vĩ đều (equirectangular) lúc chạy.
// Trắng = đất, đen = nước. Ảnh khớp toạ độ ảnh của THREE.SphereGeometry (trái là kinh tuyến 180° tây, trên là bắc).

import * as THREE from 'three';
import { feature } from 'topojson-client';
import duLieu from 'world-atlas/land-50m.json';

let _khung = null;
let _tex = null;

// Vẽ một vòng (ring) đa giác: nối liền kinh độ qua kinh tuyến 180° (cộng/trừ 360°), vòng bao quanh cực
// (Nam Cực) thì khép qua cực. Vẽ ba lần lệch -360°, 0, +360° để phần tràn ra mép này hiện ở mép kia.
function veVong(g, vong, X, Y) {
  const n = vong.length;
  if (n < 3) return;
  const lon = new Float64Array(n);
  lon[0] = vong[0][0];
  let tongLat = 0;
  for (let i = 1; i < n; i++) {
    let d = vong[i][0] - vong[i - 1][0];
    if (d > 180) d -= 360; else if (d < -180) d += 360;
    lon[i] = lon[i - 1] + d;
    tongLat += vong[i][1];
  }
  const quanhCuc = Math.abs(lon[n - 1] - lon[0]) > 180;
  const cuc = tongLat / n < 0 ? -90 : 90;
  let nho = lon[0], lon1 = lon[0];
  for (let i = 1; i < n; i++) { if (lon[i] < nho) nho = lon[i]; if (lon[i] > lon1) lon1 = lon[i]; }
  // chỉ vẽ thêm bản lệch ±360° cho vòng tràn qua mép bản đồ
  const dsLech = nho < -180 || lon1 > 180 ? [-360, 0, 360] : [0];
  for (const lech of dsLech) {
    let x0 = X(lon[0] + lech), y0 = Y(vong[0][1]);
    g.moveTo(x0, y0);
    for (let i = 1; i < n; i++) {
      const x = X(lon[i] + lech), y = Y(vong[i][1]);
      // bỏ đỉnh cách đỉnh trước dưới 0,8 điểm ảnh: không đổi hình, vẽ nhanh hơn nhiều
      if (i < n - 1 && Math.abs(x - x0) + Math.abs(y - y0) < 0.8) continue;
      g.lineTo(x, y); x0 = x; y0 = y;
    }
    if (quanhCuc) { g.lineTo(X(lon[n - 1] + lech), Y(cuc)); g.lineTo(X(lon[0] + lech), Y(cuc)); }
    g.closePath();
  }
}

// Khung vẽ mặt nạ (dùng chung, vẽ một lần). rong: bề ngang điểm ảnh (cao = rong / 2).
export function khungDatLien(rong = 2048) {
  if (_khung) return _khung;
  const cao = rong / 2;
  const c = document.createElement('canvas');
  c.width = rong; c.height = cao;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, rong, cao);
  const X = (lon) => ((lon + 180) / 360) * rong;
  const Y = (lat) => ((90 - lat) / 180) * cao;
  const t0 = performance.now();
  const fc = feature(duLieu, duLieu.objects.land);
  const t1 = performance.now();
  g.fillStyle = '#fff';
  g.beginPath();
  for (const f of fc.features || [fc]) {
    const hinh = f.geometry;
    const dsDaGiac = hinh.type === 'Polygon' ? [hinh.coordinates] : hinh.coordinates;
    for (const daGiac of dsDaGiac) for (const vong of daGiac) veVong(g, vong, X, Y);
  }
  g.fill('evenodd');
  khungDatLien.thoiGian = [t1 - t0, performance.now() - t1];
  _khung = c;
  return c;
}

// Texture mặt nạ đất liền (kênh đỏ), có mipmap: shader lấy mẫu ở bậc mip cao để biết «gần bờ», «sâu trong lục địa».
export function texDatLien() {
  if (_tex) return _tex;
  _tex = new THREE.CanvasTexture(khungDatLien());
  _tex.colorSpace = THREE.NoColorSpace;
  _tex.wrapS = THREE.RepeatWrapping;
  _tex.anisotropy = 8;
  return _tex;
}
