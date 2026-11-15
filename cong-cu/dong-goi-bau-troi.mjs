// Đóng gói dữ liệu bầu trời thật cho src/khung/bau-troi.js.
//
//   node cong-cu/dong-goi-bau-troi.mjs
//
// Đọc dữ liệu của d3-celestial (đã có trong node_modules, không tải thêm):
//   - stars.8.json: sao tới cấp 8 (danh mục XHIP, Anderson và Francis 2012): xích kinh, xích vĩ J2000, cấp sao, chỉ số màu B–V;
//   - mw.json: đường viền 5 mức sáng của dải Ngân Hà (Milky Way Outline Catalog, Jose R. Vieira);
//   - constellations.lines.json: nét nối các chòm sao;
//   - starnames.json: tên riêng của sao (theo IAU).
// Ghi ra src/du-lieu/bau-troi.js: các mảng số đã lượng tử hoá, mã base64, để nhúng gọn vào trang.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const NGUON = 'node_modules/d3-celestial/data/';
const doc = (t) => JSON.parse(readFileSync(NGUON + t, 'utf8'));
const CAP_TOI_DA = 7.5;            // sao mờ nhất được đóng gói
const SAI_SO_DUONG_VIEN = 0.035;   // độ: làm gọn đường viền Ngân Hà (Douglas–Peucker)

// Ma trận đổi xích đạo J2000 (ICRS) sang thiên hà (Hipparcos, ESA 1997, quyển 1 mục 1.5.3).
const R = [
  [-0.0548755604162154, -0.8734370902348850, -0.4838350155487132],
  [0.4941094278755837, -0.4448296299600112, 0.7469822444972189],
  [-0.8676661490190047, -0.1980763734312015, 0.4559837761750669],
];
const D = Math.PI / 180;
function sangThienHa(ra, dec) {
  const c = Math.cos(dec * D), e = [c * Math.cos(ra * D), c * Math.sin(ra * D), Math.sin(dec * D)];
  const g = R.map((h) => h[0] * e[0] + h[1] * e[1] + h[2] * e[2]);
  let l = Math.atan2(g[1], g[0]) / D;
  if (l < 0) l += 360;
  return [l, Math.asin(Math.max(-1, Math.min(1, g[2]))) / D];
}

const u16 = (x) => Math.max(0, Math.min(65535, Math.round(x)));
const raU = (ra) => u16((((ra % 360) + 360) % 360) / 360 * 65536) % 65536;
const decU = (dec) => u16((dec + 90) / 180 * 65535);
const b64 = (typed) => Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength).toString('base64');

// 1. Sao: xếp từ sáng tới mờ, để «dày hay thưa» chỉ là lấy bao nhiêu sao đầu mảng.
const sao = doc('stars.8.json').features
  .map((f) => ({ id: String(f.id), ra: f.geometry.coordinates[0], dec: f.geometry.coordinates[1], mag: f.properties.mag, bv: parseFloat(f.properties.bv) }))
  .filter((s) => s.mag <= CAP_TOI_DA)
  .sort((a, b) => a.mag - b.mag);
const boSao = new Uint8Array(sao.length * 6);
sao.forEach((s, i) => {
  const r = raU(s.ra), d = decU(s.dec), k = i * 6;
  boSao[k] = r & 255; boSao[k + 1] = r >> 8; boSao[k + 2] = d & 255; boSao[k + 3] = d >> 8;
  boSao[k + 4] = Math.max(0, Math.min(255, Math.round((s.mag + 2) * 25)));
  boSao[k + 5] = Number.isFinite(s.bv) ? Math.max(0, Math.min(254, Math.round((s.bv + 0.4) * 85))) : 255; // 255: không có B–V
});

// 2. Tên riêng → chỉ số sao trong mảng đã xếp.
const tenGoc = doc('starnames.json');
const viTri = new Map(sao.map((s, i) => [s.id, i]));
const tenSao = {};
for (const [id, t] of Object.entries(tenGoc)) if (t.name && viTri.has(id) && !(t.name in tenSao)) tenSao[t.name] = viTri.get(id);

// 3. Dải Ngân Hà: các vòng đường viền của từng mức, đổi sang toạ độ thiên hà (l, b), làm gọn.
function lamGon(vong, saiSo) {
  // Douglas–Peucker trên mặt phẳng (l, b) đã nối liền qua chỗ l = 0/360.
  const p = [[vong[0][0], vong[0][1]]];
  for (let i = 1; i < vong.length; i++) {
    let l = vong[i][0];
    const t = p[i - 1][0];
    while (l - t > 180) l -= 360;
    while (l - t < -180) l += 360;
    p.push([l, vong[i][1]]);
  }
  const giu = new Uint8Array(p.length);
  giu[0] = giu[p.length - 1] = 1;
  const ngan = [[0, p.length - 1]];
  while (ngan.length) {
    const [a, b] = ngan.pop();
    const [ax, ay] = p[a], [bx, by] = p[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    let xa = -1, k = -1;
    for (let i = a + 1; i < b; i++) {
      const cosB = Math.cos(p[i][1] * D);
      const d = Math.abs((p[i][0] - ax) * dy - (p[i][1] - ay) * dx) / L * Math.max(cosB, 0.2);
      if (d > xa) { xa = d; k = i; }
    }
    if (xa > saiSo) { giu[k] = 1; ngan.push([a, k], [k, b]); }
  }
  return vong.filter((_, i) => giu[i]);
}
const mw = doc('mw.json').features.sort((a, b) => a.id.localeCompare(b.id));
const boNH = [mw.length];
let soDiemGoc = 0, soDiem = 0, bMax = 0;
for (const f of mw) {
  const vong = f.geometry.coordinates.flat(1).filter((v) => v.length >= 4);
  boNH.push(vong.length);
  for (const v of vong) {
    soDiemGoc += v.length;
    const g = v.slice(0, -1).map(([ra, dec]) => sangThienHa(ra, dec));   // bỏ điểm cuối trùng điểm đầu
    const gon = g.length > 8 ? lamGon(g, SAI_SO_DUONG_VIEN) : g;
    soDiem += gon.length;
    boNH.push(gon.length);
    for (const [l, b] of gon) { boNH.push(u16(l / 360 * 65536) % 65536, decU(b)); bMax = Math.max(bMax, Math.abs(b)); }
  }
}
const mangNH = Uint16Array.from(boNH);

// 4. Nét chòm sao.
const chom = doc('constellations.lines.json').features;
const boCS = [chom.length];
const maCS = [];
for (const f of chom) {
  maCS.push(f.id);
  const ds = f.geometry.coordinates;
  boCS.push(ds.length);
  for (const d of ds) { boCS.push(d.length); for (const [ra, dec] of d) boCS.push(raU(ra), decU(dec)); }
}
const mangCS = Uint16Array.from(boCS);

const ra = `// TỆP SINH TỰ ĐỘNG bởi cong-cu/dong-goi-bau-troi.mjs. Đừng sửa tay; sửa lệnh đóng gói rồi chạy lại.
//
// Nguồn (gói d3-celestial, giấy phép BSD-3):
//   - sao: XHIP, An Extended Hipparcos Compilation (Anderson và Francis 2012, VizieR V/137D), tới cấp ${CAP_TOI_DA};
//   - dải Ngân Hà: Milky Way Outline Catalog (Jose R. Vieira, skymap.com), 5 mức sáng;
//   - nét chòm sao và tên sao: d3-celestial (tên riêng theo IAU).
//
// Định dạng:
//   SAO: ${sao.length} sao, mỗi sao 6 byte: xích kinh (uint16, 0–360°), xích vĩ (uint16, −90…90°),
//        cấp sao (uint8: cấp = x/25 − 2), B–V (uint8: x/85 − 0,4; 255 = không có). Xếp từ sáng tới mờ.
//   NGAN_HA: uint16 [số mức, rồi mỗi mức: số vòng, rồi mỗi vòng: số điểm n, rồi n cặp (l, b) thiên hà]
//            l: x/65536·360°, b: x/65535·180° − 90°. Mức 1 mờ nhất, mức 5 sáng nhất.
//   CHOM_SAO: uint16 [số chòm, rồi mỗi chòm: số nét, rồi mỗi nét: số điểm n, rồi n cặp (xích kinh, xích vĩ)]
//   TEN_SAO: tên riêng → chỉ số sao trong SAO.
export const SO_SAO = ${sao.length};
export const CAP_MO_NHAT = ${CAP_TOI_DA};
export const B_MAX_NGAN_HA = ${bMax.toFixed(2)};
export const SAO = '${b64(boSao)}';
export const NGAN_HA = '${b64(mangNH)}';
export const MA_CHOM_SAO = ${JSON.stringify(maCS)};
export const CHOM_SAO = '${b64(mangCS)}';
export const TEN_SAO = ${JSON.stringify(tenSao)};
`;
mkdirSync('src/du-lieu', { recursive: true });
writeFileSync('src/du-lieu/bau-troi.js', ra);
console.log(`Sao: ${sao.length} (tới cấp ${CAP_TOI_DA}), tên riêng: ${Object.keys(tenSao).length}`);
console.log(`Ngân Hà: ${mw.length} mức, ${soDiemGoc} điểm gốc → ${soDiem} điểm sau khi làm gọn; |b| lớn nhất ${bMax.toFixed(1)}°`);
console.log(`Chòm sao: ${chom.length}, ${mangCS.length} số`);
console.log(`Đã ghi src/du-lieu/bau-troi.js: ${(Buffer.byteLength(ra) / 1024).toFixed(0)} KB`);
