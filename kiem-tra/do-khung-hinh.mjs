// Đo PHẦN TÍNH mỗi khung hình của trang (mã của bài, khung tương tác, bố trí nhãn, lệnh vẽ gửi cho card đồ hoạ) ở một
// số bài, bằng Chrome ẩn, im lặng. Dùng để so trước và sau một thay đổi của khung: cùng máy, cùng lúc, chạy xen kẽ.
// Số đo KHÔNG gồm thời gian card đồ hoạ vẽ và không phải số khung hình mỗi giây trên màn hình thật (cái đó đo bằng
// kiem-tra/do-that.sh trên app). Máy đang bận thì số nhiễu mạnh: mỗi bài đo nhiều lượt, lấy trung vị nhỏ nhất.
// Lệnh nặng: chạy qua kiem-tra/co-khoa.sh.
//
//   node kiem-tra/do-khung-hinh.mjs <tệp HTML> [<tệp HTML thứ hai để so>] [--bai id1,id2] [--buoc 3] [--co 1280x800]
//                                   [--luot 3] [--khung 480] [--video] [--ra tệp.json]
//
// --video: đo khi đang nghe giảng, bảng bài giảng ẩn (đồng hồ nghe giảng được đẩy đều 10 lần mỗi giây).
// --nghe: đo khi đang nghe giảng ở màn hình thường (bảng bài giảng còn hiện, phụ đề trên mô hình).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moChrome } from './chrome-an.mjs';

const thamSo = process.argv.slice(2);
const dsTep = [];
for (let i = 0; i < thamSo.length; i++) { if (thamSo[i].startsWith('--')) { if (!['--video', '--nghe'].includes(thamSo[i])) i++; } else dsTep.push(thamSo[i]); }
if (!dsTep.length) throw Error('Dùng: node kiem-tra/do-khung-hinh.mjs <tệp HTML> [<tệp HTML thứ hai>] [--bai …] [--buoc 3] [--video]');
const lay = (co, macDinh) => { const i = thamSo.indexOf(co); return i >= 0 && thamSo[i + 1] ? thamSo[i + 1] : macDinh; };
const dsBai = lay('--bai', 'he-mat-troi,ngan-ha,lo-den,non-anh-sang,thoi-gian,quy-dao,gian-no,vu-tru-4c,hai-khe,spin-stern-gerlach').split(',').filter(Boolean);
const buoc = Number(lay('--buoc', '3'));
const [rong, cao] = lay('--co', '1280x800').split('x').map(Number);
const soLuot = Number(lay('--luot', '3')), soKhung = Number(lay('--khung', '480'));
const video = thamSo.includes('--video'), nghe = thamSo.includes('--nghe');
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));

// Chèn trước khi nạp trang: im lặng, và tắt vòng khung hình riêng của trang để chỉ có các khung do bộ đo gọi.
function chuanBi() {
  window.__VT_IM_LANG = true;
  window.requestAnimationFrame = () => 0;
  try { localStorage.clear(); } catch { /* không có bộ nhớ: bỏ qua */ }
}
// Đồng hồ của trình duyệt chỉ nhích từng 0,1 mili giây, nên số chính là TRUNG BÌNH (tổng thời gian chia số khung);
// mức 95% và khung chậm nhất lấy từ từng khung.
const DO = (n, coVideo) => `(() => { const a = __vt, ds = new Float64Array(${n}); const dau = performance.now();
  for (let i = 0; i < ${n}; i++) { const t0 = performance.now(); a.buoc(1 / 60); ${coVideo ? 'if (a.nghe.dangPhat && i % 6 === 0) a.nghe.tien(0.1);' : ''} ds[i] = performance.now() - t0; }
  const tong = performance.now() - dau;
  const s = Array.from(ds).sort((x, y) => x - y);
  return { giua: tong / ${n}, p95: s[Math.floor(s.length * 0.95)], xau: s[s.length - 1] }; })()`;

const c = await moChrome();
const ketQua = {};
try {
  await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: 1, mobile: rong < 600 });
  await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });
  await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: `(${chuanBi})()` });
  for (const id of dsBai) {
    for (let luot = 0; luot < soLuot; luot++) {
      for (const tep of dsTep) {            // xen kẽ các tệp trong từng lượt để nhiễu của máy chia đều
        const url = pathToFileURL(resolve(tep));
        url.search = new URLSearchParams({ lang: 'vi', im: '1', canh: id, buoc: String(buoc) }).toString();
        c.loiTrang = null;
        await c.goi('Page.navigate', { url: 'about:blank' });
        await c.goi('Page.navigate', { url: url.href });
        let xong = false;
        for (let i = 0; i < 1200 && !xong; i++) {
          if (c.loiTrang) throw Error(`${id}: ${c.loiTrang}`);
          xong = await c.doc(`location.href === ${JSON.stringify(url.href)} && !!window.__vt?.canh`);
          if (!xong) await cho(50);
        }
        if (!xong) throw Error('Không mở được ' + url.href);
        if (video) await c.doc('__vt.anHienBang(true); __vt.nghe.batDau(); true');
        else if (nghe) await c.doc('__vt.nghe.batDau(); true');
        await c.doc(DO(120, video || nghe));                       // cho cảnh chạy ổn (biên dịch chương trình đổ bóng, máy quay bay xong)
        const k = await c.doc(DO(soKhung, video || nghe));
        const o = ((ketQua[tep] ||= {})[id] ||= { giua: Infinity, p95: Infinity, xau: Infinity });
        o.giua = Math.min(o.giua, k.giua); o.p95 = Math.min(o.p95, k.p95); o.xau = Math.min(o.xau, k.xau);
      }
    }
    console.log(`${id.padEnd(20)} ${dsTep.map((t) => { const o = ketQua[t][id]; return `trung bình ${o.giua.toFixed(3)} ms · 95% ${o.p95.toFixed(2)} ms · chậm nhất ${o.xau.toFixed(1)} ms`; }).join('   |   ')}`);
  }
} finally {
  await c.dong();
}
const tb = (tep, truong) => dsBai.reduce((s, id) => s + ketQua[tep][id][truong], 0) / dsBai.length;
for (const tep of dsTep) console.log(`Trung bình ${dsBai.length} bài (${tep}): ${tb(tep, 'giua').toFixed(3)} ms mỗi khung · 95% ${tb(tep, 'p95').toFixed(2)} ms`);
const tepRa = lay('--ra', '');
if (tepRa) writeFileSync(tepRa, JSON.stringify({ luc: new Date().toISOString(), co: [rong, cao], buoc, video, soLuot, soKhung, ketQua }, null, 2));
