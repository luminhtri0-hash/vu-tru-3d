// Lõi ứng dụng, phần máy quay: bay mượt tới góc nhìn mới, về góc ban đầu, dời tâm hình sang phần màn hình không bị
// bảng bài giảng che. Trạng thái nằm trên app vì các bài đọc trực tiếp: app._bay (chuyến bay đang diễn ra, null khi
// đứng yên), app.lech (độ lệch tâm hình hiện tại, điểm ảnh), app._lechDich (độ lệch muốn tới).
// Các phương thức ở đây được gắn vào lớp UngDung (ung-dung.js).

import * as THREE from 'three';
import { lamMuot } from './ve.js';
import { coCongThucVua } from './bai-giang.js';
import { $ } from './ung-dung-luu.js';

export const PT_MAY_QUAY = {
  // ---------- Máy quay ----------
  // Bay mượt tới vị trí mới. Khoảng cách nội suy theo logarit để phóng to/thu nhỏ nhiều bậc vẫn êm.
  bayToi(viTri, dich = [0, 0, 0], giay = 1.8) {
    const tuDich = this.dk.target.clone();
    const toiDich = new THREE.Vector3(...dich);
    const o0 = this.camera.position.clone().sub(tuDich);
    const o1 = new THREE.Vector3(...viTri).sub(toiDich);
    if (giay <= 0) { this.dk.target.copy(toiDich); this.camera.position.copy(toiDich).add(o1); this._bay = null; return; }
    this._bay = { tuDich, toiDich, h0: o0.clone().normalize(), h1: o1.clone().normalize(), d0: o0.length(), d1: o1.length(), t: 0, giay };
  },
  _capNhatBay(dt) {
    const b = this._bay;
    b.t = Math.min(1, b.t + dt / b.giay);
    const k = lamMuot(b.t);
    const huong = b.h0.clone().lerp(b.h1, k);
    if (huong.lengthSq() < 1e-6) huong.copy(b.h1); else huong.normalize();
    const d = Math.exp(Math.log(b.d0) + (Math.log(b.d1) - Math.log(b.d0)) * k);
    this.dk.target.lerpVectors(b.tuDich, b.toiDich, k);
    this.camera.position.copy(this.dk.target).addScaledVector(huong, d);
    if (b.t >= 1) this._bay = null;
  },
  veGocBanDau() {
    const m = this.dsCanh[this.chiSo]?.mayAnh || {};
    this.bayToi(m.viTri ?? [0, 2, 6], m.dich ?? [0, 0, 0], 1.2);
  },

  // MÀN HÌNH HẸP (điện thoại cầm dọc). Phần trống cho mô hình chỉ rộng chừng 390 điểm ảnh, chưa bằng nửa màn hình máy
  // tính, mà cảnh vẫn vẽ cùng tỉ lệ: cảnh dàn ngang bị cắt hai bên. Bài khai `mayAnh.hep` (0,4 tới 1) thì trên màn hình
  // hẹp cả cảnh được thu nhỏ theo hệ số đó: bề ngang cửa sổ 400 điểm ảnh trở xuống dùng đúng hệ số, 700 trở lên không
  // thu, ở giữa chuyển dần. Không khai thì giữ nguyên như trước. Thu nhỏ bằng camera.zoom nên mọi vật vẽ qua ma trận
  // chiếu, nhãn, tay nắm đều theo; cảnh tự tính tia nhìn trong mã tô bóng thì đọc app.camera.zoom.
  _thuNhoHep(hep) {
    if (!(hep > 0 && hep < 1)) return 1;
    const t = Math.min(1, Math.max(0, (700 - this.rong) / 300));
    return 1 + (Math.max(0.4, hep) - 1) * t;
  },

  _tinhLech() {
    this._lechMoi = true;
    this._vungCho = 0;           // bố cục vừa đổi: khung hình tới đọc lại các vùng bị che
    clearTimeout(this._henCoCongThuc);       // bề rộng bảng có thể vừa đổi: lát nữa co lại các công thức dài
    this._henCoCongThuc = setTimeout(() => coCongThucVua(this.el.bang), 220);
    const b = $('bai-hoc');
    if (document.body.classList.contains('an-bang') || !b) { this._lechDich = [0, 0]; return; }
    const rong = b.offsetWidth, cao = b.offsetHeight;
    if (rong < this.rong * 0.6) this._lechDich = [(rong + 14) / 2, 0];        // bảng nằm bên phải
    else this._lechDich = [0, (cao + 14) / 2];                                // màn hình hẹp: bảng nằm dưới
  },
};
