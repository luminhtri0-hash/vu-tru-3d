import assert from 'node:assert/strict';
import { H_EV_THZ, nangLuongPhoton, tanSoNguong, dongNang, chuyenDong, viTriElectron, thoiGianTrongKhe, C_NM_THZ } from '../src/vat-ly/quang-dien.js';
const gan = (a,b,e = 1e-10) => assert(Math.abs(a-b) < e, `${a} ≠ ${b}`);
gan(nangLuongPhoton(600),2.4814006181543155);
gan(tanSoNguong(2),483.59785,0.0001);
gan(dongNang(600,2),0.481400618,1e-8);
gan(dongNang(800,2),1.3085341575,1e-8);
gan(nangLuongPhoton(800)-nangLuongPhoton(600),0.82713354,1e-8);
gan(dongNang(800,3),0.3085341575,1e-8);
gan(C_NM_THZ/600,499.6541,0.001);
gan(tanSoNguong(3),725.3968,0.01);
gan(tanSoNguong(2.5),604.4973,0.01);
gan(H_EV_THZ,4.1356676969e-3,1e-12);
assert.equal(dongNang(400,2),0);
assert.equal(chuyenDong(400,2,0).coHat,false);
assert.equal(chuyenDong(600,2,0.60).thuDuoc,false);
assert.equal(chuyenDong(600,2,0.30).thuDuoc,true);
assert.equal(chuyenDong(800,2,1.30).thuDuoc,true);
assert.equal(chuyenDong(800,2,1.32).thuDuoc,false);
for(const K of [0.01,0.4,1,2,3.1]) for(const U of [0,0.3,0.6,1,1.7,3]){
  const t=thoiGianTrongKhe(K,U);
  gan(viTriElectron(K,U,t),K>U ? 1 : 0);
  if(U>=K) gan(viTriElectron(K,U,2*Math.sqrt(K)/U),K/U);
}
console.log('Đạt: năng lượng, ngưỡng, bước sóng, thế hãm và chuyển động electron trong điện trường đều.');
