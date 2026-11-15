// Điều khiển một Chrome chạy ẩn qua ống cục bộ (không mở cổng mạng, không cửa sổ, tắt tiếng).
// Dùng chung cho các công cụ chụp ảnh giao diện. Mỗi lượt dùng một hồ sơ tạm riêng và tự dọn khi đóng.
//
//   const c = await moChrome();
//   await c.goi('Page.navigate', { url });          // một lệnh của giao thức DevTools
//   const v = await c.doc('document.title');        // tính một biểu thức trong trang, trả về giá trị
//   await c.dong();
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function moChrome({ choToiDa = 90000 } = {}) {
  const hoSo = mkdtempSync(join(tmpdir(), 'vu-tru-chrome-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--mute-audio', '--no-first-run', '--disable-extensions', '--disable-sync',
    '--disable-background-networking', '--disable-component-update', '--disable-breakpad',
    '--remote-debugging-pipe', '--hide-scrollbars', '--user-data-dir=' + hoSo, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  const daDong = new Promise((xong) => chrome.once('close', xong));
  const dangCho = new Map();
  const c = { loiTrang: null, phien: undefined };
  let dem = 0, du = '';
  c.goi = (method, params = {}, sessionId = c.phien) => {
    const id = ++dem;
    return new Promise((xong, loi) => {
      const hen = setTimeout(() => { dangCho.delete(id); loi(Error('Chrome chờ quá lâu ở ' + method)); }, choToiDa);
      dangCho.set(id, (m) => { clearTimeout(hen); m.error ? loi(Error(m.error.message)) : xong(m.result); });
      chrome.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
  };
  chrome.stdio[4].setEncoding('utf8').on('data', (s) => {
    const ds = (du + s).split('\0'); du = ds.pop();
    for (const dong of ds) {
      const m = JSON.parse(dong);
      if (m.method === 'Runtime.exceptionThrown') {
        const chiTiet = m.params.exceptionDetails;
        c.loiTrang = chiTiet.exception?.description || chiTiet.text;
      }
      if (dangCho.has(m.id)) { dangCho.get(m.id)(m); dangCho.delete(m.id); }
    }
  });
  chrome.on('close', () => {
    for (const xong of dangCho.values()) xong({ error: { message: 'Chrome đã thoát.' } });
    dangCho.clear();
  });
  c.doc = async (expression) => {
    const k = await c.goi('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (k.exceptionDetails) throw Error(k.exceptionDetails.exception?.description || k.exceptionDetails.text);
    return k.result.value;
  };
  c.dong = async () => {
    if (chrome.exitCode == null && chrome.signalCode == null) chrome.kill('SIGTERM');
    await daDong;
    // Chrome vừa thoát có thể còn ghi dở vào hồ sơ tạm: thử lại vài lần; dọn không được thì thôi, không làm hỏng lượt kiểm
    // (ngày 16/11/2026 một lượt soát 4 phút mất kết quả vì lệnh xoá này báo «thư mục chưa trống»).
    try { rmSync(hoSo, { recursive: true, force: true, maxRetries: 8, retryDelay: 250 }); } catch { /* hồ sơ tạm nằm trong thư mục tạm của hệ thống, tự được dọn sau */ }
  };
  try {
    const { targetId } = await c.goi('Target.createTarget', { url: 'about:blank' }, undefined);
    ({ sessionId: c.phien } = await c.goi('Target.attachToTarget', { targetId, flatten: true }, undefined));
    await c.goi('Page.enable');
    await c.goi('Runtime.enable');
  } catch (e) { await c.dong(); throw e; }
  return c;
}
