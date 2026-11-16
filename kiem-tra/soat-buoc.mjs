// SOÁT MỌI BƯỚC của mọi bài bằng Chrome ẩn (im lặng, không cửa sổ) và lập bảng những chỗ chưa đạt chuẩn trình bày của
// «Hướng dẫn viết bài giảng.md»: ô số liệu quá nhiều dòng hoặc dòng quá dài, nhãn bị ẩn vì hết chỗ, nhãn đè nhau, nhãn
// quá dài, quá nhiều nhãn, công thức phải co, bảng tràn ngang, bước chưa có lời đọc. Không sửa gì; chỉ in bảng và ghi tệp JSON để người
// làm bài biết phải sửa ở đâu. Lệnh nặng: chạy qua kiem-tra/co-khoa.sh.
//
//   node kiem-tra/soat-buoc.mjs <tệp HTML> [--co 1280x800,390x844] [--bai id1,id2] [--ra tệp.json] [--tieng vi]
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moChrome } from './chrome-an.mjs';

const thamSo = process.argv.slice(2);
const tepHtml = thamSo[0];
if (!tepHtml || tepHtml.startsWith('--')) throw Error('Dùng: node kiem-tra/soat-buoc.mjs <tệp HTML> [--co 1280x800,390x844] [--bai id1,id2] [--ra tệp.json]');
const lay = (co, macDinh) => { const i = thamSo.indexOf(co); return i >= 0 && thamSo[i + 1] ? thamSo[i + 1] : macDinh; };
const dsCo = lay('--co', '1280x800,390x844').split(',').map((s) => s.split('x').map(Number));
const chiBai = lay('--bai', '').split(',').filter(Boolean);
const tieng = lay('--tieng', 'vi');
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));

function chuanBi() {
  window.__VT_IM_LANG = true;
  window.requestAnimationFrame = () => 0;
  try { localStorage.clear(); localStorage.setItem('vu-tru-3d.o-so-lieu.nho', 'mo'); } catch { /* bỏ qua */ }
}
// Chạy trong trang, ở bước đang mở (sau khi mô hình đã chạy vài giây).
const XET = `(() => {
  const a = __vt, W = innerWidth;
  const dong = [...document.querySelectorAll('#hud .dong')].map((d) => d.textContent);
  const nhan = a.boNhan.trangThai();
  const nd = document.getElementById('buoc-noi-dung');
  const tran = (q) => [...nd.querySelectorAll(q)].filter((e) => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1).length;
  // Nhãn bị ẩn chia ba loại theo chỗ của điểm neo: ngoài cửa sổ (bình thường, không kể); dưới bảng bài giảng (vật bị bảng
  // che: chỉ đáng lo nếu là vật chính của bước); còn lại là nhãn có vật nhìn thấy được mà không hiện (bị ô số liệu, thanh
  // trên che, hết chỗ, hoặc thua nhãn ưu tiên cao hơn): loại này người làm bài phải xem.
  const H = innerHeight, vung = a.boNhan.vung;
  const trongCuaSo = (n) => n.neo[0] >= 0 && n.neo[0] <= W && n.neo[1] >= 0 && n.neo[1] <= H;
  const duoiBang = (n) => vung.some((v) => !v[4] && v[3] - v[1] > H * 0.4 && n.neo[0] > v[0] && n.neo[0] < v[2] && n.neo[1] > v[1] && n.neo[1] < v[3]);
  const an = nhan.filter((n) => n.an && trongCuaSo(n));
  // Hai nhãn cùng hiện mà khung chữ chồng lên nhau quá 6 điểm ảnh mỗi chiều: bài chưa đưa chúng vào goNhanDeNhau.
  const hien = nhan.filter((n) => !n.an && n.x1 > Math.max(0, n.x0) && n.x0 < W && n.y1 > Math.max(0, n.y0) && n.y0 < H);
  const de = [];
  for (let i = 0; i < hien.length; i++) for (let j = i + 1; j < hien.length; j++) {
    const p = hien[i], q = hien[j];
    if (Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0) > 6 && Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0) > 6) de.push(p.chu.slice(0, 28) + ' ✕ ' + q.chu.slice(0, 28));
  }
  return {
    oDong: dong.length, oDai: Math.max(0, ...dong.map((s) => s.length)), oDongDai: dong.reduce((a, s) => (s.length > a.length ? s : a), '').slice(0, 160), nhanDe: de,
    nhanHien: nhan.filter((n) => !n.an).length, nhanAn: an.filter((n) => !duoiBang(n)).map((n) => n.chu.slice(0, 40)),
    nhanDuoiBang: an.filter(duoiBang).map((n) => n.chu.slice(0, 40)),
    nhanDai: nhan.filter((n) => !n.an && n.x1 - n.x0 > Math.min(260, W * 0.6)).map((n) => n.chu.slice(0, 90)),
    nhanRong: Math.round(Math.max(0, ...nhan.filter((n) => !n.an).map((n) => n.x1 - n.x0))),
    nhanDoi: nhan.filter((n) => !n.an && n.kieu !== 'gốc').length,
    goiY: [...document.querySelectorAll('.vt-nhan')].filter((e) => e.style.visibility !== 'hidden').map((e) => e.textContent.slice(1)),
    congThucCo: [...nd.querySelectorAll('.bg-toan')].filter((e) => e.style.fontSize).length, congThucCuon: nd.querySelectorAll('.bg-toan.cuon').length,
    bangTran: tran('.bg-bang'), thuThach: !!a._buocDangMo().thuThach, soNut: nd.querySelectorAll('.nut-thu').length,
    loi: a.loiGhi.splice(0, 5),
  };
})()`;

const c = await moChrome();
const ketQua = {};
try {
  await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: `(${chuanBi})()` });
  await c.goi('Emulation.setLocaleOverride', { locale: tieng });
  for (const [rong, cao] of dsCo) {
    const co = `${rong}x${cao}`;
    const dienThoai = rong < 600 || cao < 500;
    await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: 1, mobile: dienThoai });
    await c.goi('Emulation.setTouchEmulationEnabled', { enabled: dienThoai, maxTouchPoints: dienThoai ? 5 : 1 });
    const url = pathToFileURL(resolve(tepHtml));
    url.search = new URLSearchParams({ lang: tieng, im: '1', canh: 'he-mat-troi' }).toString();
    await c.goi('Page.navigate', { url: 'about:blank' });
    await c.goi('Page.navigate', { url: url.href });
    for (let i = 0; i < 1200 && !(await c.doc('!!window.__vt?.canh')); i++) await cho(50);
    const dsBai = await c.doc(`__vt.dsCanh.map((b, i) => ({ i, id: b.id, so: b.so, buoc: (b.baiGiang?.buoc || []).length, loiDoc: typeof __vt.nghe._loiDoc === 'function' }))`);
    for (const b of dsBai) {
      if (chiBai.length && !chiBai.includes(b.id)) continue;
      await c.doc(`__vt.moBai(${b.i}); true`);
      const coLoiDoc = await c.doc(`(() => { const k = __vt.nghe; return !!(k._loiDoc && k._loiDoc(0)); })()`);
      for (let k = 0; k < b.buoc; k++) {
        const kq = await c.doc(`(() => { __vt.moBuoc(${k}); for (let i = 0; i < 240; i++) __vt.buoc(1 / 60); return ${XET}; })()`);
        ((ketQua[b.id] ||= { so: b.so, coLoiDoc, buoc: [] }).buoc[k] ||= {})[co] = kq;
      }
      console.log(`${co} · Bài ${b.so} (${b.id}): ${b.buoc} bước`);
    }
  }
} finally {
  await c.dong();
}

// Bảng những chỗ chưa đạt.
const dong = [];
for (const [id, b] of Object.entries(ketQua)) {
  const viec = [];
  if (!b.coLoiDoc) viec.push('chưa có lời đọc (src/loi-doc/vi/' + id + '.json)');
  b.buoc.forEach((kq, k) => {
    for (const [co, x] of Object.entries(kq)) {
      const dt = !co.startsWith('1280');
      const v = [];
      if (!dt && x.oDong > 5) v.push(`ô số liệu ${x.oDong} dòng (chuẩn: tối đa 5)`);
      if (!dt && x.oDai > 60) v.push(`dòng ô số liệu dài ${x.oDai} ký tự (chuẩn: 60): «${x.oDongDai}»`);
      if (x.nhanDe.length) v.push(`${x.nhanDe.length} cặp nhãn đè nhau: ${x.nhanDe.slice(0, 3).join(' | ')}`);
      if (!dt && x.nhanHien > 12) v.push(`${x.nhanHien} nhãn cùng hiện (chuẩn: 12)`);
      if (!dt && x.nhanAn.length) v.push(`${x.nhanAn.length} nhãn có vật nhìn thấy được mà không hiện (hết chỗ, bị ô số liệu che, hoặc thua nhãn ưu tiên cao hơn): ${x.nhanAn.slice(0, 4).join(' · ')}`);
      if (!dt && x.nhanDuoiBang.length) v.push(`${x.nhanDuoiBang.length} vật có nhãn nằm dưới bảng bài giảng: ${x.nhanDuoiBang.slice(0, 4).join(' · ')}`);
      if (x.nhanDai.length) v.push(`nhãn quá dài: ${x.nhanDai.slice(0, 3).join(' · ')}`);
      if (!dt && x.goiY.some((g) => g.length > 28)) v.push(`gợi ý kéo dài quá 28 ký tự: ${x.goiY.filter((g) => g.length > 28).join(' · ')}`);
      if (x.congThucCuon) v.push(`${x.congThucCuon} công thức vẫn phải cuộn ngang`);
      else if (dt && x.congThucCo) v.push(`${x.congThucCo} công thức phải co chữ trên điện thoại`);
      if (x.bangTran) v.push(`${x.bangTran} bảng tràn ngang`);
      if (!dt && !x.soNut) v.push('bước không có nút «thử ngay» (chế độ video không có gì để trình diễn)');
      if (x.loi.length) v.push('lỗi trong cảnh: ' + x.loi.join(' | '));
      if (v.length) viec.push(`bước ${k + 1} (${co}): ${v.join('; ')}`);
    }
  });
  if (viec.length) dong.push(`Bài ${b.so} · ${id}\n${viec.map((s) => '  - ' + s).join('\n')}`);
}
console.log('\n' + (dong.join('\n') || 'Không có chỗ nào chưa đạt.'));
const tepRa = lay('--ra', '');
if (tepRa) { writeFileSync(tepRa, JSON.stringify(ketQua, null, 1)); console.log('\nĐã ghi ' + tepRa); }
