// Chạy bộ kiểm âm thanh: dựng trang kiểm bằng esbuild, mở bằng Chrome chạy ẩn có --mute-audio (không phát ra loa,
// không hiện cửa sổ), chờ trang đo xong, in bảng kết quả, lưu ảnh phổ, số liệu và các tệp WAV nghe thử.
//
//   node kiem-tra/am-thanh/chay.mjs [thư mục ra]      (mặc định «Dữ liệu làm việc/am-thanh»)
//
// Mã thoát 0 khi mọi mục đạt.
import { build } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const RA = resolve(process.argv[2] || 'Dữ liệu làm việc/am-thanh');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!existsSync(CHROME)) { console.error('Không thấy Google Chrome.'); process.exit(1); }
mkdirSync(join(RA, 'nghe-thu'), { recursive: true });

const kq = await build({ entryPoints: ['kiem-tra/am-thanh/thu.js'], bundle: true, format: 'iife', write: false, target: ['chrome100'] });
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Kiểm âm thanh</title></head><body>
<script>${kq.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
const tepHtml = join(RA, 'trang-kiem.html');
writeFileSync(tepHtml, html);

const tam = mkdtempSync(join(tmpdir(), 'kiem-am-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--mute-audio', '--no-first-run', '--disable-extensions', '--hide-scrollbars',
  '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling',
  `--user-data-dir=${tam}`, '--remote-debugging-port=0', '--window-size=1400,900', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
const don = () => { try { chrome.kill('SIGKILL'); } catch { /* */ } try { rmSync(tam, { recursive: true, force: true }); } catch { /* */ } };
process.on('exit', don);

const wsUrl = await new Promise((ok, hong) => {
  let s = '';
  const hen = setTimeout(() => hong(new Error('Chrome không mở cổng gỡ lỗi')), 20000);
  chrome.stderr.on('data', (d) => { s += d; const m = s.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(hen); ok(m[1]); } });
});

const ws = new WebSocket(wsUrl);
await new Promise((ok) => ws.addEventListener('open', ok, { once: true }));
let id = 0;
const cho = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && cho.has(m.id)) { const { ok, hong } = cho.get(m.id); cho.delete(m.id); m.error ? hong(new Error(m.error.message)) : ok(m.result); }
});
const goi = (method, params = {}, sessionId) => new Promise((ok, hong) => { const k = ++id; cho.set(k, { ok, hong }); ws.send(JSON.stringify({ id: k, method, params, sessionId })); });

const { targetId } = await goi('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await goi('Target.attachToTarget', { targetId, flatten: true });
await goi('Page.enable', {}, sessionId);
await goi('Runtime.enable', {}, sessionId);
await goi('Page.navigate', { url: pathToFileURL(tepHtml).href }, sessionId);
const danhGia = async (bieuThuc) => (await goi('Runtime.evaluate', { expression: bieuThuc, returnByValue: true, awaitPromise: true }, sessionId)).result.value;

const batDau = Date.now();
while (!(await danhGia('!!(window.__ketQua && window.__ketQua.xong)'))) {
  if (Date.now() - batDau > 300000) { console.error('Quá 5 phút chưa xong.'); process.exit(2); }
  await new Promise((r) => setTimeout(r, 500));
}
const hang = await danhGia('window.__ketQua.hang');
const tenWav = await danhGia('Object.keys(window.__ketQua.wav)');
for (const ten of tenWav) {
  const b64 = await danhGia(`window.__ketQua.wav[${JSON.stringify(ten)}]`);
  writeFileSync(join(RA, 'nghe-thu', `${ten}.wav`), Buffer.from(b64, 'base64'));
}
writeFileSync(join(RA, 'so-lieu.json'), JSON.stringify(hang, null, 2));

// Ảnh phổ: chụp cả trang.
const cao = await danhGia('document.documentElement.scrollHeight');
await goi('Emulation.setDeviceMetricsOverride', { width: 1400, height: Math.min(cao, 16000), deviceScaleFactor: 1, mobile: false }, sessionId);
const anh = await goi('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, sessionId);
writeFileSync(join(RA, 'anh-pho.png'), Buffer.from(anh.data, 'base64'));

// Bảng kết quả.
let hong = 0;
let nhomTruoc = '';
for (const h of hang) {
  if (h.nhom !== nhomTruoc) { console.log(`\n── ${h.nhom} ──`); nhomTruoc = h.nhom; }
  const so = Object.entries(h.so || {}).map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`${h.dat ? '  đạt ' : '  LỖI '} ${h.ten.padEnd(34)} ${so}${h.ghiChu ? `  (${h.ghiChu})` : ''}`);
  for (const l of h.loi || []) { hong++; console.log(`         - ${l}`); }
}
console.log(`\nTổng: ${hang.length} mục, ${hang.filter((h) => !h.dat).length} mục lỗi (${hong} điều kiện hỏng).`);
console.log(`Ảnh phổ: ${join(RA, 'anh-pho.png')}\nSố liệu: ${join(RA, 'so-lieu.json')}\nTệp nghe thử: ${join(RA, 'nghe-thu')} (${tenWav.length} tệp, mở khi muốn nghe; bộ kiểm không phát)`);
ws.close();
don();
process.exit(hang.length && hang.every((h) => h.dat) ? 0 : 1);
