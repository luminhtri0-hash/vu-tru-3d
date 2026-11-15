// Bộ kiểm số cho mô-đun bầu trời (src/khung/bau-troi.js) và dữ liệu đóng gói (src/du-lieu/bau-troi.js).
// Chạy: node kiem-tra/kiem-bau-troi.mjs
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
import {
  XD_SANG_TH, vecXichDao, sangThienHa, giaiMaSao, giaiMaNganHa, giaiMaChomSao, huongSaoXichDao, capSao, tenSaoCo,
  mauSao, nhietDoTuBV, doSangLoi, maTranXichDaoSangCanh, huongMacDinh, toNganHa, NH_RONG, NH_CAO, NH_B, taoBauTroi,
} from '../src/khung/bau-troi.js';
import { SO_SAO, CAP_MO_NHAT, TEN_SAO } from '../src/du-lieu/bau-troi.js';

const D = Math.PI / 180;
const raDec = (v) => { let ra = Math.atan2(v[1], v[0]) / D; if (ra < 0) ra += 360; return [ra, Math.asin(v[2]) / D]; };
const lechL = (a, b) => ((a - b + 540) % 360) - 180;

muc('1. Ma trận xích đạo → thiên hà');
const R = XD_SANG_TH;
let lechTruc = 0;
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) lechTruc = Math.max(lechTruc, Math.abs(R[i][0] * R[j][0] + R[i][1] * R[j][1] + R[i][2] * R[j][2] - (i === j ? 1 : 0)));
kiem('Ma trận trực chuẩn (sai lệch lớn nhất)', lechTruc, 0, 1e-9);
const det = R[0][0] * (R[1][1] * R[2][2] - R[1][2] * R[2][1]) - R[0][1] * (R[1][0] * R[2][2] - R[1][2] * R[2][0]) + R[0][2] * (R[1][0] * R[2][1] - R[1][1] * R[2][0]);
kiem('Định thức = +1 (phép xoay, không lật)', det, 1, 1e-9);
const [raTam, decTam] = raDec(R[0]);
kiem('Tâm Ngân Hà (l = 0, b = 0): xích kinh', raTam, 266.405, 0.003, '°');
kiem('Tâm Ngân Hà: xích vĩ', decTam, -28.936, 0.003, '°');
const [raCuc, decCuc] = raDec(R[2]);
kiem('Cực bắc thiên hà: xích kinh', raCuc, 192.8595, 0.003, '°');
kiem('Cực bắc thiên hà: xích vĩ', decCuc, 27.1283, 0.003, '°');
const sgrA = sangThienHa(vecXichDao(266.41684, -29.00781));
kiem('Sgr A* (266,41684°; −29,00781°): l', lechL(sgrA.l, 359.9442), 0, 0.002, '°');
kiem('Sgr A*: b', sangThienHa(vecXichDao(266.41684, -29.00781)).b, -0.0462, 0.002, '°');

muc('2. Toạ độ thiên hà của các sao quen (theo vị trí trong dữ liệu đã đóng gói)');
const SAO_QUEN = [   // tên, l, b (SIMBAD)
  ['Sirius', 227.2303, -8.8903], ['Vega', 67.4482, 19.2373], ['Polaris', 123.2804, 26.4614], ['Deneb', 84.2847, 1.9975],
  ['Betelgeuse', 199.7873, -8.9586], ['Rigel', 209.2412, -25.2454], ['Antares', 351.9469, 15.0640],
];
for (const [ten, l, b] of SAO_QUEN) {
  const v = huongSaoXichDao(ten);
  const g = sangThienHa(v);
  kiem(`${ten}: l`, lechL(g.l, l), 0, 0.02, '°');
  kiem(`${ten}: b`, g.b, b, 0.02, '°');
}

muc('3. Dữ liệu đóng gói giải mã đúng');
const goc = JSON.parse(readFileSync('node_modules/d3-celestial/data/stars.8.json', 'utf8')).features;
const tenGoc = JSON.parse(readFileSync('node_modules/d3-celestial/data/starnames.json', 'utf8'));
const s = giaiMaSao();
kiem('Số sao = số sao tới cấp 7,5 trong stars.8.json', s.n, goc.filter((f) => f.properties.mag <= CAP_MO_NHAT).length, 0);
kiem('SO_SAO khớp số đã giải mã', SO_SAO, s.n, 0);
let tangDan = true;
for (let i = 1; i < s.n; i++) if (s.cap[i] < s.cap[i - 1] - 1e-6) { tangDan = false; break; }
kiemDung('Sao xếp từ sáng tới mờ', tangDan);
kiemDung('Sao sáng nhất là Sirius', TEN_SAO.Sirius === 0);
const timGoc = (ten) => goc.find((f) => tenGoc[f.id]?.name === ten);
for (const ten of ['Sirius', 'Canopus', 'Vega', 'Betelgeuse', 'Rigel', 'Polaris', 'Deneb', 'Altair', 'Alnitak', 'Alnilam', 'Mintaka']) {
  const f = timGoc(ten), i = TEN_SAO[ten];
  const [ra, dec] = f.geometry.coordinates;
  // Góc lệch theo công thức haversine trên toạ độ đã giải mã (tránh sai số làm tròn của acos gần 1).
  const ra2 = s.ra[i], dec2 = s.dec[i];
  const h = Math.sin((dec2 - dec) * D / 2) ** 2 + Math.cos(dec * D) * Math.cos(dec2 * D) * Math.sin(lechL(ra2, ra) * D / 2) ** 2;
  const goc2 = 2 * Math.asin(Math.sqrt(h)) / D;
  kiem(`${ten}: lệch vị trí so với bản gốc`, goc2, 0, 0.006, '°');
  kiem(`${ten}: cấp sao`, s.cap[i], f.properties.mag, 0.021);
  kiem(`${ten}: B–V`, s.bv[i], parseFloat(f.properties.bv), 0.007);
}
kiemDung(`Có ${tenSaoCo().length} tên riêng (≥ 300)`, tenSaoCo().length >= 300);
kiem('Polaris: xích vĩ', raDec(huongSaoXichDao('Polaris'))[1], 89.2641, 0.005, '°');
kiem('Vega: cấp sao', capSao('Vega'), 0.03, 0.021);

muc('4. Màu và độ sáng');
kiem('Nhiệt độ Mặt Trời từ B–V = 0,65', nhietDoTuBV(0.65), 5700, 150, ' K');
const cB = mauSao(1.5), cR = mauSao(-0.03);
kiemDung(`Betelgeuse ngả cam đỏ (đỏ/lam = ${(cB[0] / cB[2]).toFixed(2)} > 2)`, cB[0] / cB[2] > 2);
kiemDung(`Rigel ngả xanh lam (lam/đỏ = ${(cR[2] / cR[0]).toFixed(2)} > 1,2)`, cR[2] / cR[0] > 1.2);
kiem('Độ sáng lõi cấp 1,5 ≈ ngưỡng quầng 0,8', doSangLoi(1.5), 0.8, 0.05);
const soVuot = Array.from(s.sang).filter((x) => x > 0.8).length;
kiemDung(`Chỉ vài chục sao vượt ngưỡng quầng 0,8 (có ${soVuot})`, soVuot >= 10 && soVuot <= 60);

muc('5. Dải Ngân Hà');
const vong = giaiMaNganHa();
kiemDung(`Đủ 5 mức đường viền (${vong.length} vòng)`, new Set(vong.map((v) => v.muc)).size === 5);
const anh = toNganHa();
const doc = (l, b) => {
  const x = Math.floor(((((l + 180) % 360) + 360) % 360) / 360 * NH_RONG);
  const y = Math.floor((b + NH_B) / (2 * NH_B) * NH_CAO);
  return y < 0 || y >= NH_CAO ? 0 : anh[y * NH_RONG + x];
};
const lTam = (l) => (l > 180 ? l - 360 : l);   // ảnh có tâm Ngân Hà ở giữa
kiemDung(`Đám mây sao Nhân Mã (l = 1,5°, b = −3,5°) ở mức 4–5 (${doc(1.5, -3.5).toFixed(2)} ≥ 0,5)`, doc(1.5, -3.5) >= 0.5 - 1e-6);
kiemDung(`Thiên Nga (l = 78°, b = +2°) nằm trong dải (${doc(78, 2).toFixed(2)} > 0)`, doc(78, 2) > 0);
kiemDung(`Hướng ngược tâm (l = 180°, b = 0) vẫn có dải mờ (${doc(180, 0).toFixed(2)} > 0)`, doc(180, 0) > 0);
kiemDung(`Xa mặt phẳng (b = +35°) tối hẳn (${doc(30, 35)})`, doc(30, 35) === 0 && doc(-120, -30) === 0);
const bao = doc(lTam(301), -1), canh = Math.max(doc(lTam(306), -1), doc(lTam(296), -1));
kiemDung(`Túi Than (l = 301°, b = −1°) tối hơn xung quanh (${bao.toFixed(2)} < ${canh.toFixed(2)})`, bao < canh);
let tongDai = 0; for (let x = 0; x < NH_RONG; x++) tongDai += anh[Math.floor(NH_CAO / 2) * NH_RONG + x] > 0 ? 1 : 0;
// Bản đồ gốc có khe hở thật ở b = 0 (vùng bụi Thiên Đà – Anh Tiên, l ≈ 140–150°), nên chỉ đòi ≥ 80%.
kiemDung(`Dải gần như bao trọn vòng trời ở b = 0 (${(100 * tongDai / NH_RONG).toFixed(0)}% kinh độ ≥ 80%)`, tongDai / NH_RONG >= 0.8);

muc('6. Đặt bầu trời vào cảnh');
const tam = new THREE.Vector3(0.3, -0.2, -1).normalize();
const cucBac = new THREE.Vector3(0, 1, 0).addScaledVector(tam, -tam.y).normalize().applyAxisAngle(tam, 0.4);
const M = maTranXichDaoSangCanh({ tam: tam.toArray(), cucBac: cucBac.toArray() });
kiem('det(M) = +1', M.determinant(), 1, 1e-9);
const vTam = new THREE.Vector3(...R[0]).applyMatrix3(M), vCuc = new THREE.Vector3(...R[2]).applyMatrix3(M);
kiem('Tâm Ngân Hà rơi đúng hướng tam', vTam.angleTo(tam) / D, 0, 1e-6, '°');
kiem('Cực bắc thiên hà rơi đúng hướng cucBac', vCuc.angleTo(cucBac) / D, 0, 1e-6, '°');
const bt = taoBauTroi({ daiNganHa: { tam: tam.toArray(), cucBac: cucBac.toArray() } });
const vVega = bt.huongSao('Vega'), vVega2 = new THREE.Vector3(...huongSaoXichDao('Vega')).applyMatrix3(M);
kiem('huongSao("Vega") khớp phép xoay', vVega.angleTo(vVega2) / D, 0, 1e-4, '°');
kiem('Góc Vega – Deneb (24,0°)', bt.huongSao('Vega').angleTo(bt.huongSao('Deneb')) / D, 23.85, 0.1, '°');
kiem('Góc Betelgeuse – Rigel (18,6°)', bt.huongSao('Betelgeuse').angleTo(bt.huongSao('Rigel')) / D, 18.6, 0.1, '°');
kiemDung('huongSao tên lạ trả null', bt.huongSao('Không có') === null);
kiemDung('Hướng chòm Lạp Hộ gần thắt lưng Alnilam (< 10°)', bt.huongChomSao('Ori').angleTo(bt.huongSao('Alnilam')) / D < 10);
kiemDung('Có đủ 88 chòm trở lên trong nét chòm sao', Object.keys(giaiMaChomSao()).length >= 88);
const bt2 = taoBauTroi({ soSao: 5000 });
kiem('soSao 5000 → vẽ 15 000 sao', bt2.soSaoVe, 15000, 0);
kiem('soSao 1500 → vẽ 4 500 sao', taoBauTroi({ soSao: 1500, doSang: 0.45 }).soSaoVe, 4500, 0);
kiemDung('Vật vẽ sau mọi thứ: renderOrder rất âm, không thử độ sâu, không bị cắt', bt2.children.every((o) => o.renderOrder <= -1000 && o.material.depthTest === false && o.material.depthWrite === false && o.frustumCulled === false));
const md = huongMacDinh(7), md2 = huongMacDinh(7), md3 = huongMacDinh(8);
kiemDung('Hướng mặc định xác định theo hat', md.tam.join() === md2.tam.join() && md.tam.join() !== md3.tam.join());
kiem('Hướng mặc định: tam ⟂ cucBac', new THREE.Vector3(...md.tam).dot(new THREE.Vector3(...md.cucBac)), 0, 1e-9);

tongKet();
