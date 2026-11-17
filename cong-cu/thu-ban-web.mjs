// Thử bản web như người học mở trên mạng: máy chủ tĩnh tại máy (nén br/gzip như Cloudflare, hỗ trợ tải từng đoạn cho tệp tiếng),
// trang đặt dưới một thư mục con, mở bằng Chrome chạy ẩn và TẮT TIẾNG (không phát gì ra loa).
//
//   node cong-cu/thu-ban-web.mjs dist/web                          → thử ở http://127.0.0.1:8763/vu-tru-3d/
//   node cong-cu/thu-ban-web.mjs <web>/_site/vu-tru-3d --anh <thư mục>   → thử bản dựng của trang web chính, chụp ảnh ra <thư mục>
//   node cong-cu/thu-ban-web.mjs https://trilu.edu.vn/vu-tru-3d/ --cac may-tinh-vi   → đọc lại trang thật trên mạng (không mở máy chủ)
//   tuỳ chọn: --cong 8763 · --tien-to /vu-tru-3d/ · --cac may-tinh-vi,dien-thoai-vi (mặc định: cả bảy cách mở dưới đây)
//
// Mỗi cách mở: chờ màn hình chào, đo thời gian tới lúc bấm được, đọc tiêu đề, chân trang, bấm «Bắt đầu học» (chuột hoặc chạm),
// vào Bài 1; với tiếng Việt thì bấm nghe giảng và xem tệp tiếng bước 1, bước 2 có tải và chạy không. Mã thoát 0 = mọi cách đều đạt.
import http from 'node:http';
import zlib from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { moChrome } from '../kiem-tra/chrome-an.mjs';

const thamSo = process.argv.slice(2);
const lay = (co, macDinh) => { const i = thamSo.indexOf(co); return i >= 0 && thamSo[i + 1] ? thamSo[i + 1] : macDinh; };
const DIA_CHI = /^https?:\/\//.test(thamSo[0] || '') ? thamSo[0].replace(/\/?$/, '/') : null;
const WEB = DIA_CHI ? null : resolve(thamSo[0] && !thamSo[0].startsWith('--') ? thamSo[0] : 'dist/web');
const TIEN_TO = lay('--tien-to', '/vu-tru-3d/').replace(/\/?$/, '/');
const CONG = Number(lay('--cong', '8763'));
const ANH = lay('--anh', null);
if (WEB && !existsSync(join(WEB, 'index.html'))) { console.error(`Không thấy ${join(WEB, 'index.html')}`); process.exit(1); }
if (ANH) mkdirSync(ANH, { recursive: true });

const LOAI = { '.html': 'text/html; charset=utf-8', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.json': 'application/json' };
const daNen = new Map();
const mayChu = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === TIEN_TO.slice(0, -1)) { res.writeHead(308, { location: TIEN_TO + u.search }); return res.end(); }
  if (!u.pathname.startsWith(TIEN_TO)) { res.writeHead(404); return res.end(); }
  const rel = normalize(decodeURIComponent(u.pathname.slice(TIEN_TO.length)) || 'index.html');
  const p = join(WEB, rel);
  if (rel.startsWith('..') || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); return res.end(); }
  const loai = LOAI[extname(p)] || 'application/octet-stream';
  let body = readFileSync(p);
  if (/\.(html|js|json)$/.test(p)) {
    const ae = req.headers['accept-encoding'] || '';
    const ma = ae.includes('br') ? 'br' : ae.includes('gzip') ? 'gzip' : null;
    if (ma) {
      if (!daNen.has(p + ma)) daNen.set(p + ma, ma === 'br' ? zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }) : zlib.gzipSync(body));
      body = daNen.get(p + ma);
    }
    res.writeHead(200, { 'content-type': loai, ...(ma ? { 'content-encoding': ma } : {}), 'content-length': body.length });
    return res.end(body);
  }
  const r = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (r) {
    const dau = r[1] ? +r[1] : 0, cuoi = r[2] ? Math.min(+r[2], body.length - 1) : body.length - 1;
    res.writeHead(206, { 'content-type': loai, 'accept-ranges': 'bytes', 'content-range': `bytes ${dau}-${cuoi}/${body.length}`, 'content-length': cuoi - dau + 1 });
    return res.end(body.subarray(dau, cuoi + 1));
  }
  res.writeHead(200, { 'content-type': loai, 'accept-ranges': 'bytes', 'content-length': body.length });
  res.end(body);
});
if (WEB) await new Promise((xong) => mayChu.listen(CONG, '127.0.0.1', xong));
const GOC = DIA_CHI || `http://127.0.0.1:${CONG}${TIEN_TO}`;
const cho = (ms) => new Promise((x) => setTimeout(x, ms));

async function choDen(c, bieuThuc, toiDa = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < toiDa) { try { if (await c.doc(bieuThuc)) return true; } catch { /* trang đang tải */ } await cho(150); }
  return false;
}
// window.__VT_THU.tiengCam: app vẫn chạy như thật nhưng thẻ <audio> bị tắt tiếng; Chrome cũng chạy với --mute-audio.
const DAU_TRANG = `window.__VT_THU = { tiengCam: true };
window.__do = { nut: null, dai: [] };
try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__do.dai.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch {}
new MutationObserver((m, o) => { if (document.getElementById('nut-bat-dau')) { window.__do.nut = performance.now(); o.disconnect(); } }).observe(document, { childList: true, subtree: true });`;

async function chup(c, ten) {
  if (!ANH) return;
  const { data } = await c.goi('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(ANH, ten + '.png'), Buffer.from(data, 'base64'));
}
async function bam(c, chon, cham) {
  const r = await c.doc(`(() => { const e = document.querySelector(${JSON.stringify(chon)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
  if (!r) return false;
  const [x, y] = r;
  if (cham) {
    await c.goi('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await c.goi('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await c.goi('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
  return true;
}

const TIEU_DE = { vi: 'Vũ trụ 3D', en: '3D Universe', 'zh-CN': '3D宇宙', ja: '3D宇宙' };
const CACH_MO = {
  'may-tinh-vi': { rong: 1280, cao: 800, ngonNgu: 'vi' },
  'may-tinh-en': { rong: 1280, cao: 800, ngonNgu: 'en' },
  'may-tinh-zh': { rong: 1280, cao: 800, ngonNgu: 'zh-CN' },
  'may-tinh-ja': { rong: 1280, cao: 800, ngonNgu: 'ja' },
  'dien-thoai-vi': { rong: 390, cao: 844, dien: true, ngonNgu: 'vi' },
  'dien-thoai-ja': { rong: 390, cao: 844, dien: true, ngonNgu: 'ja' },
  // mạng 10 Mbit/s, trễ 70 ms: gần với 4G hay wifi yếu
  'mang-cham': { rong: 1280, cao: 800, ngonNgu: 'vi', mang: { tre: 70, tai: (10 * 1e6) / 8 } },
};

async function thu(ten, { rong, cao, dien = false, ngonNgu, mang = null }) {
  const c = await moChrome();
  const kq = { ten, loi: [] };
  const hong = (s) => kq.loi.push(s);
  try {
    await c.goi('Network.enable');
    await c.goi('Network.setCacheDisabled', { cacheDisabled: true });
    if (mang) await c.goi('Network.emulateNetworkConditions', { offline: false, latency: mang.tre, downloadThroughput: mang.tai, uploadThroughput: mang.tai / 4 });
    await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: dien ? 3 : 1, mobile: dien });
    if (dien) {
      await c.goi('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await c.goi('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36' });
    }
    await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: DAU_TRANG });
    await c.goi('Page.navigate', { url: `${GOC}?lang=${ngonNgu}` });
    if (!(await choDen(c, `!!document.getElementById('nut-bat-dau') && !!window.__vt`, 60000))) hong('không thấy màn hình chào');
    await cho(2000);
    kq.do = await c.doc(`(() => { const n = performance.getEntriesByType('navigation')[0]; const cuoi = window.__do.dai.reduce((m, [s, d]) => Math.max(m, s + d), 0);
      return { msChaoHien: Math.round(window.__do.nut), msHetViecDai: Math.round(cuoi), viecDaiLauNhat: Math.round(Math.max(0, ...window.__do.dai.map((x) => x[1]))), kbTaiTrang: Math.round(n.encodedBodySize / 1024), kbTrangGoc: Math.round(n.decodedBodySize / 1024) }; })()`);
    const tt = await c.doc(`({ tieuDe: document.title, lang: document.documentElement.lang, chanTrang: document.querySelector('.chan-trang-web')?.textContent || null, tranNgang: document.documentElement.scrollWidth > innerWidth })`);
    kq.tieuDe = tt.tieuDe;
    if (tt.lang !== ngonNgu) hong(`thứ tiếng là ${tt.lang}, cần ${ngonNgu}`);
    if (!tt.tieuDe.startsWith(TIEU_DE[ngonNgu])) hong(`tiêu đề «${tt.tieuDe}»`);
    if (!tt.chanTrang) hong('không thấy chân trang «Trí Lữ soạn · Giấy phép · Mã nguồn»');
    if (tt.tranNgang) hong('màn hình chào tràn ngang');
    await chup(c, `${ten}-1-chao`);
    if (!(await bam(c, '#nut-bat-dau', dien))) hong('không bấm được «Bắt đầu học»');
    await choDen(c, `!document.getElementById('chao') || document.getElementById('chao').classList.contains('tat')`, 10000);
    await cho(2500);
    const bai = await c.doc(`({ chiSo: window.__vt?.chiSo, loi: document.getElementById('loi')?.hidden === false ? document.getElementById('loi').textContent : null, gd: !!document.getElementById('gd-phat'), tranNgang: document.documentElement.scrollWidth > innerWidth })`);
    if (bai.chiSo !== 0) hong(`không vào Bài 1 (chiSo = ${bai.chiSo})`);
    if (bai.loi) hong('trang báo lỗi: ' + bai.loi);
    if (bai.tranNgang) hong('bài 1 tràn ngang');
    await chup(c, `${ten}-2-bai-1`);
    if (ngonNgu === 'vi') {
      if (!bai.gd) hong('không thấy thanh nghe giảng');
      else {
        await bam(c, '#gd-phat', dien);
        if (!(await choDen(c, `(window.__vt?.nghe?._am || window.__vt?._gdAm)?.currentTime > 0.3`, 20000))) hong('tệp tiếng bước 1 không chạy');
        kq.tieng1 = await c.doc(`(window.__vt.nghe?._am || window.__vt._gdAm) && { tep: (window.__vt.nghe?._am || window.__vt._gdAm).src.replace(location.origin, ''), giay: Math.round((window.__vt.nghe?._am || window.__vt._gdAm).duration) }`);
        await chup(c, `${ten}-3-nghe-giang`);
        await c.doc(`window.__vt.buocSau()`); await cho(800);
        await bam(c, '#gd-phat', dien);
        if (!(await choDen(c, `(window.__vt?.nghe?._am || window.__vt?._gdAm)?.currentTime > 0.3 && /-2\\.mp3/.test((window.__vt.nghe?._am || window.__vt._gdAm).src)`, 20000))) hong('tệp tiếng bước 2 không chạy');
        await c.doc(`(window.__vt.nghe?._am || window.__vt._gdAm)?.pause()`);
      }
    }
    if (c.loiTrang) hong('lỗi mã trong trang: ' + c.loiTrang);
  } catch (e) { hong(String(e.message || e)); } finally { await c.dong(); }
  console.log(`${kq.loi.length ? 'HỎNG' : 'đạt '}  ${ten.padEnd(14)} ${JSON.stringify(kq.do || {})}${kq.loi.length ? '\n      ' + kq.loi.join('\n      ') : ''}`);
  return kq;
}

const cac = lay('--cac', Object.keys(CACH_MO).join(',')).split(',');
const ketQua = [];
try { for (const ten of cac) ketQua.push(await thu(ten, CACH_MO[ten])); } finally { if (WEB) mayChu.close(); }
if (ANH) writeFileSync(join(ANH, 'ket-qua.json'), JSON.stringify(ketQua, null, 1));
const soHong = ketQua.filter((k) => k.loi.length).length;
console.log(soHong ? `${soHong}/${ketQua.length} cách mở bị hỏng.` : `Cả ${ketQua.length} cách mở đều đạt.`);
process.exit(soHong ? 1 : 0);
