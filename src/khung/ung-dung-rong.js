// Bản rỗng của khung âm thanh và khung tương tác: dùng khi mô-đun tuỳ chọn chưa có (xem build.mjs, «ao:am-thanh» và
// «ao:tuong-tac»), để bài học gọi app.am, app.tt không lỗi.

import * as THREE from 'three';

const giongRong = { dat() {}, tat() {} };
export const AM_RONG = {
  bat: false, mucAm: 0, batNen: false, sanSang: false,
  khoa() {}, khoiDong() {}, datBat() {}, datMucAm() {}, datBatNen() {}, phat() {}, nen() {}, tich() {}, not() {},
  giong: () => giongRong, tiengOn: () => giongRong, quet() {}, gio: () => 0, dungHet() {},
};
export const TT_RONG = {
  dangKeo: false,
  them: () => ({ huy() {}, an() {} }),
  tayNam: (t = {}) => {
    const v = new THREE.Vector3(...(t.viTri || [0, 0, 0]));
    return { vat: new THREE.Object3D(), viTri: v, dat(p) { if (Array.isArray(p)) v.set(...p); else v.copy(p); }, an() {}, khoa() {}, huy() {} };
  },
  goiY() {}, datCanh() {}, xoaHet() {}, capNhat() {}, huy() {},
};
