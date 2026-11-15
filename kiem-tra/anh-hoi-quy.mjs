// node kiem-tra/anh-hoi-quy.mjs chụp <tệp HTML> <thư mục mới> <vi|en|zh-CN|ja> [số bài hoặc id…]
// node kiem-tra/anh-hoi-quy.mjs so <thư mục mốc> <thư mục vừa chụp>
// Chrome dùng hồ sơ riêng, chạy ẩn, tắt tiếng, giao tiếp qua ống cục bộ. Chụp tuần tự để máy còn nhẹ.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [lenh, dau, dich, ngonNgu = 'vi', ...chon] = process.argv.slice(2);
const rong = 1280, cao = 800;
// Số khung hình cho mô hình chạy sau khi mở mỗi bước rồi mới chụp. Mặc định 4 (đủ để so hai bản dựng từng điểm ảnh, nhanh).
// Để XEM hình thì phải cho chạy lâu hơn (máy quay bay xong, mô hình tới trạng thái của bước): chup-tat-ca.sh đặt 240 (4 giây).
const soKhung = Math.max(1, Number(process.env.SO_KHUNG_MOI_BUOC) || 4);
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));

// Khoá thời điểm, hạt ngẫu nhiên và đồng hồ mô hình để hai lượt có cùng khung hình.
// Mã này chỉ được Chrome chèn vào trang đang kiểm.
function dongHoKiem() {
  window.__VT_IM_LANG = true;
  window.__mocAnh = 0;
  const moc = Date.UTC(2026, 0, 1);
  Date.now = () => moc + window.__mocAnh;
  Object.defineProperty(performance, 'now', { value: () => window.__mocAnh });
  let hat = 1403;
  Math.random = () => ((hat = (Math.imul(hat, 1664525) + 1013904223) >>> 0) / 4294967296);
  window.requestAnimationFrame = () => 0;
  try { localStorage.clear(); } catch {}
  document.addEventListener('DOMContentLoaded', () => {
    const css = document.createElement('style');
    css.textContent = '*,*::before,*::after { animation-duration: 0s !important; transition-duration: 0s !important; }';
    document.head.append(css);
  });
}

async function chup() {
  if (!['vi', 'en', 'zh-CN', 'ja'].includes(ngonNgu)) throw Error('Ngôn ngữ ảnh không hợp lệ.');
  mkdirSync(dich); // mỗi lượt dùng thư mục mới, tránh lẫn ảnh cũ
  const hoSo = mkdtempSync(join(tmpdir(), 'vu-tru-anh-'));
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--mute-audio', '--no-first-run', '--disable-extensions', '--disable-sync',
    '--disable-background-networking', '--disable-component-update', '--disable-breakpad',
    '--remote-debugging-pipe', '--hide-scrollbars', '--user-data-dir=' + hoSo, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  const daDong = new Promise((xong) => chrome.once('close', xong));
  const dangCho = new Map();
  let loiTrang;
  let dem = 0, du = '', phien;
  function goi(method, params = {}, sessionId = phien) {
    const id = ++dem;
    return new Promise((xong, loi) => {
      const hen = setTimeout(() => { dangCho.delete(id); loi(Error('Chrome chờ quá lâu ở ' + method)); }, 90000);
      dangCho.set(id, (m) => { clearTimeout(hen); m.error ? loi(Error(m.error.message)) : xong(m.result); });
      chrome.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
  }
  chrome.stdio[4].setEncoding('utf8').on('data', (s) => {
    const ds = (du + s).split('\0'); du = ds.pop();
    for (const dong of ds) {
      const m = JSON.parse(dong);
      if (m.method === 'Runtime.exceptionThrown') {
        const chiTiet = m.params.exceptionDetails;
        loiTrang = chiTiet.exception?.description || chiTiet.text;
      }
      if (dangCho.has(m.id)) { dangCho.get(m.id)(m); dangCho.delete(m.id); }
    }
  });
  chrome.on('close', () => {
    for (const xong of dangCho.values()) xong({ error: { message: 'Chrome đã thoát.' } });
    dangCho.clear();
  });
  async function doc(expression) {
    const k = await goi('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (k.exceptionDetails) throw Error(k.exceptionDetails.exception?.description || k.exceptionDetails.text);
    return k.result.value;
  }
  async function mo(thamSo) {
    const url = pathToFileURL(resolve(dau));
    url.search = new URLSearchParams({ lang: ngonNgu, im: '1', tua: '0', ...thamSo }).toString();
    loiTrang = null;
    await goi('Page.navigate', { url: url.href });
    for (let i = 0; i < 1200; i++) {
      if (loiTrang) throw Error(loiTrang);
      if (await doc('location.href === ' + JSON.stringify(url.href) + ' && !!window.__vt?.canh')) return;
      const loi = await doc('document.getElementById("loi")?.innerText');
      if (loi) throw Error(loi);
      await cho(50);
    }
    throw Error('Không mở được ' + url.href);
  }
  const dsAnh = {};
  async function luu(ten) {
    await doc('document.fonts.ready.then(() => true)');
    const kq = await doc(`(() => {
      const a = window.__vt;
      if (a.loiGhi.length || a._matNguCanh || !a.canh) throw Error('Lỗi trong cảnh: ' + a.loiGhi);
      if (document.documentElement.lang !== ${JSON.stringify(ngonNgu)}) throw Error('Sai ngôn ngữ trên trang');
      // Chỉ bỏ qua chính hai nút mới khi so điểm ảnh giữa hai phiên bản.
      return Array.from(document.querySelectorAll('#ngon-ngu-tren, #ngon-ngu-chao')).map(e => {
        const r = e.getBoundingClientRect();
        return [Math.floor(r.left), Math.floor(r.top), Math.ceil(r.right), Math.ceil(r.bottom)];
      }).filter(([x,y,X,Y]) => X>x && Y>y);
    })()`);
    const { data } = await goi('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    writeFileSync(join(dich, ten + '.png'), Buffer.from(data, 'base64'), { flag: 'wx' });
    dsAnh[ten] = kq;
  }
  try {
    const { targetId } = await goi('Target.createTarget', { url: 'about:blank' });
    ({ sessionId: phien } = await goi('Target.attachToTarget', { targetId, flatten: true }));
    await goi('Page.enable');
    await goi('Runtime.enable');
    await goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: 1, mobile: false });
    await goi('Emulation.setLocaleOverride', { locale: ngonNgu });
    await goi('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Ho_Chi_Minh' });
    await goi('Page.addScriptToEvaluateOnNewDocument', { source: '(' + dongHoKiem + ')()' });
    await mo({});
    const bai = await doc('__vt.dsCanh.map(c => ({id: c.id, so: c.so, buoc: c.baiGiang?.buoc?.length || 1}))');
    await doc('__vt.buoc(1/60)');
    await luu('chao');
    const ds = chon.length ? bai.filter(b => chon.includes(String(b.so)) || chon.includes(b.id)) : bai;
    if (chon.some(x => !ds.some(b => String(b.so) === x || b.id === x))) throw Error('Có bài không tìm thấy.');
    for (const b of ds) {
      await mo({ canh: b.id });
      if (await doc('__vt.dsCanh[__vt.chiSo].id') !== b.id) throw Error('Mở nhầm bài ' + b.id);
      const ten = 'bai-' + String(b.so).padStart(2, '0');
      for (let k = 0; k < b.buoc; k++) {
        await doc(`__vt.moBuoc(${k}); for (let n=0; n<${soKhung}; n++) { window.__mocAnh += 1000/60; __vt.buoc(1/60); }`);
        await luu(ten + '-buoc-' + (k + 1));
      }
      for (const the of ['tom', 'hoi']) {
        if (!await doc('!!document.querySelector(' + JSON.stringify('[data-tab="' + the + '"]') + ')')) continue;
        await doc('__vt.moTab(' + JSON.stringify(the) + ')');
        await luu(ten + '-' + the);
      }
      console.log('Đã chụp Bài', b.so, '·', b.buoc, 'bước.');
    }
    writeFileSync(join(dich, 'anh.json'), JSON.stringify({ rong, cao, ngonNgu, bai: ds, anh: dsAnh }, null, 2));
  } finally {
    if (chrome.exitCode == null && chrome.signalCode == null) chrome.kill('SIGTERM');
    await daDong;
    try { rmSync(hoSo, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); } catch { /* hồ sơ tạm: dọn không được thì thôi */ }
  }
}

function so() {
  const doc = (thuMuc) => JSON.parse(readFileSync(join(thuMuc, 'anh.json'), 'utf8'));
  const cu = doc(dau), moi = doc(dich);
  if (cu.ngonNgu !== moi.ngonNgu || cu.rong !== moi.rong || cu.cao !== moi.cao ||
      JSON.stringify(Object.keys(cu.anh).sort()) !== JSON.stringify(Object.keys(moi.anh).sort()))
    throw Error('Khác ngôn ngữ, kích thước hoặc danh sách ảnh.');
  const giaiMa = (tep) => execFileSync('ffmpeg', ['-v', 'error', '-i', tep, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: cu.rong * cu.cao * 3 + 1024 });
  let loi = 0, trongNut = 0;
  for (const ten of Object.keys(cu.anh)) {
    const tepCu = join(dau, ten + '.png'), tepMoi = join(dich, ten + '.png');
    if (readFileSync(tepCu).equals(readFileSync(tepMoi))) continue;
    const a = giaiMa(tepCu), b = giaiMa(tepMoi);
    if (a.length !== b.length || a.length !== cu.rong * cu.cao * 3) throw Error('Sai kích thước ảnh ' + ten);
    const nut = [...cu.anh[ten], ...moi.anh[ten]];
    if (nut.some(([x,y,X,Y]) => X-x > 220 || Y-y > 65)) throw Error('Nút ngôn ngữ quá lớn ở ' + ten);
    let lech = 0;
    for (let p = 0; p < a.length; p += 3) {
      if (a[p] === b[p] && a[p+1] === b[p+1] && a[p+2] === b[p+2]) continue;
      const x = (p/3) % cu.rong, y = Math.floor(p/3/cu.rong);
      if (nut.some(([l,t,r,d]) => x >= l && x < r && y >= t && y < d)) trongNut++;
      else lech++;
    }
    if (lech) { loi++; console.log(ten, '·', lech, 'điểm ảnh khác ngoài nút ngôn ngữ'); }
  }
  console.log(Object.keys(cu.anh).length, 'ảnh đối chiếu;', loi, 'ảnh khác ngoài nút;', trongNut, 'điểm khác trong nút.');
  if (loi) process.exitCode = 1;
}

if (lenh === 'chụp' && dau && dich) await chup();
else if (lenh === 'so' && dau && dich) so();
else throw Error('Dùng chụp <HTML> <thư mục mới> <ngôn ngữ> [bài…] hoặc so <mốc> <mới>.');
