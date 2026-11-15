// Tệp thử mẫu cho phòng trưng bày: Mặt Trời của Bản 2 trên nền sao, để kiểm khung trưng bày chạy được.
import * as THREE from 'three';
import { taoNenSao, taoNhan } from '../../src/khung/ve.js';
import { taoMatTroi } from '../../src/khung/hanh-tinh.js';

export default {
  mayAnh: { viTri: [0, 1.2, 6], dich: [0, 0, 0], fov: 40 },
  tao() {
    const scene = new THREE.Scene();
    scene.add(taoNenSao({ soSao: 5000, hat: 3 }));
    const mt = taoMatTroi();
    scene.add(mt.nhom);
    const n = taoNhan('Mặt Trời<small>tệp thử mẫu</small>', 'vang');
    n.position.set(1.3, 0.6, 0);
    scene.add(n);
    return { scene, capNhat(dt) { mt.capNhat?.(dt); } };
  },
};
