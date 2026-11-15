// Bộ kiểm GIAO DIỆN của khung trong Chrome ẩn (im lặng, không cửa sổ), ở ba cỡ: màn hình rộng 1280 × 800, điện thoại
// cầm dọc 390 × 844 và cầm ngang 844 × 390 (hai cỡ sau giả lập máy chạm). Lệnh nặng: chạy qua kiem-tra/co-khoa.sh.
//
//   node kiem-tra/kiem-giao-dien.mjs <tệp HTML> [--co 1280x800,390x844,844x390] [--nhanh]
//   (gọi không tham số, như npm run kiem vẫn gọi, thì chỉ in một dòng nhắc rồi thoát êm)
//
// Kiểm những điều người học thấy ngay khi khung hỏng:
//   - nhãn trên mô hình và nhãn gợi ý kéo: không chui dưới bảng bài giảng, ô số liệu, thanh trên, không bị cắt ở mép cửa sổ
//     (xét ở một bài mỗi phần; --nhanh thì chỉ ba bài);
//   - Bài 2 bước 7: hai nhãn Mây Magellan cùng hiện (bộ tránh đè nhãn từng làm mất);
//   - thanh trên nằm gọn trong cửa sổ ở cả bốn thứ tiếng, các khối không đè nhau;
//   - màn hình chào: nút «Bắt đầu học» và «Xem như video» thấy được ngay, không phải cuộn;
//   - ô số liệu: điện thoại mặc định thu gọn, bấm thì mở; màn hình rộng mặc định mở, nút mũi tên thu gọn được;
//   - số có khoảng trắng hàng nghìn trong lời giảng không xuống dòng giữa số; công thức dài được co cho vừa bảng;
//   - trang không tràn ngang; không có lỗi trong cảnh.
// Phần không cần trình duyệt (xếp chỗ nhãn bằng số, khoá chữ) nằm ở kiem-tra/kiem-khung.mjs.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moChrome } from './chrome-an.mjs';

const thamSo = process.argv.slice(2);
const tepHtml = thamSo[0];
// Không có tệp HTML (npm run kiem gọi mọi tệp kiem-*.mjs không tham số): phần này cần trình duyệt nên bỏ qua, không lỗi.
if (!tepHtml || tepHtml.startsWith('--')) {
  console.log('Giao diện khung: cần tệp HTML đã dựng, bỏ qua (chạy: bash kiem-tra/co-khoa.sh node kiem-tra/kiem-giao-dien.mjs <tệp HTML>).');
  process.exit(0);
}
const lay = (co, macDinh) => { const i = thamSo.indexOf(co); return i >= 0 && thamSo[i + 1] ? thamSo[i + 1] : macDinh; };
const dsCo = lay('--co', '1280x800,390x844,844x390').split(',').map((s) => s.split('x').map(Number));
const nhanh = thamSo.includes('--nhanh');
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));

function chuanBi() {
  window.__VT_IM_LANG = true;
  window.requestAnimationFrame = () => 0;
  try { localStorage.clear(); } catch { /* không có bộ nhớ: bỏ qua */ }
  document.addEventListener('DOMContentLoaded', () => {
    const css = document.createElement('style');
    css.textContent = '*,*::before,*::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }';
    document.head.append(css);
  });
}

// Một bài mỗi phần, ở bước có nhãn sát mép hoặc nhiều tay nắm.
const DS_BUOC = nhanh
  ? [['he-mat-troi', 3], ['ngan-ha', 4], ['non-anh-sang', 3]]
  : [['he-mat-troi', 1], ['he-mat-troi', 3], ['he-mat-troi', 5], ['he-mat-troi', 7], ['ngan-ha', 4], ['ngan-ha', 7], ['lo-den', 2], ['song-hap-dan', 3],
    ['duong-the-gioi', 3], ['non-anh-sang', 3], ['lorentz', 3], ['tuong-duong', 2], ['rindler', 2], ['thoi-gian', 4], ['khong-thoi-gian', 3],
    ['quy-dao', 3], ['anh-sang', 3], ['gian-no', 3], ['vu-tru-4c', 3], ['hai-khe', 3], ['spin-stern-gerlach', 3]];

// Chạy trong trang: nhãn nào đang hiện mà đè vùng che hoặc ra ngoài cửa sổ.
const XET_NHAN = `(() => {
  const W = innerWidth, H = innerHeight;
  const hop = (q) => { const e = typeof q === 'string' ? document.querySelector(q) : q; if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 ? r : null; };
  const vung = [];
  if (!document.body.classList.contains('an-bang')) { const r = hop('#bai-hoc'); if (r) vung.push(['bảng bài giảng', r]); }
  for (const [ten, q] of [['ô số liệu', '#hud'], ['nút mục lục', '#nut-muc-luc'], ['khối chọn bài', '#chon-bai'], ['các nút bên phải', '#nut-phai']]) { const r = hop(q); if (r) vung.push([ten, r]); }
  const loi = [];
  const xet = (ten, x0, y0, x1, y1) => {
    if (x0 < -0.5 || y0 < -0.5 || x1 > W + 0.5 || y1 > H + 0.5) loi.push(ten + ': ra ngoài cửa sổ (' + [x0, y0, x1, y1].map(Math.round) + ')');
    for (const [tv, r] of vung) if (x0 < r.right - 0.5 && x1 > r.left + 0.5 && y0 < r.bottom - 0.5 && y1 > r.top + 0.5) loi.push(ten + ': đè ' + tv);
  };
  let soNhan = 0, soGoiY = 0;
  for (const n of __vt.boNhan.trangThai()) { if (n.an) continue; soNhan++; xet('nhãn «' + n.chu.slice(0, 28) + '»', n.x0, n.y0, n.x1, n.y1); }
  for (const e of document.querySelectorAll('.vt-nhan')) {
    if (e.style.visibility === 'hidden' || e.classList.contains('tat')) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2) continue;
    soGoiY++;
    if (r.left < -0.5 || r.right > W + 0.5 || r.top < -0.5 || r.bottom > H + 0.5) loi.push('gợi ý kéo «' + e.textContent.slice(0, 24) + '»: ra ngoài cửa sổ');
    const b = vung.find(([tv]) => tv === 'bảng bài giảng');
    if (b && r.left < b[1].right && r.right > b[1].left && r.top < b[1].bottom && r.bottom > b[1].top) loi.push('gợi ý kéo «' + e.textContent.slice(0, 24) + '»: đè bảng bài giảng');
  }
  return { loi, soNhan, soGoiY, an: __vt.boNhan.trangThai().filter((n) => n.an).length, loiCanh: __vt.loiGhi.slice(0, 3), tran: document.documentElement.scrollWidth > W + 1 };
})()`;

const c = await moChrome();
const ketQua = [];
const muc = (ten, ok, chiTiet = '') => { ketQua.push({ ten, ok: !!ok }); console.log(`${ok ? '  đạt ' : '  LỖI '} ${ten}${chiTiet ? `  (${chiTiet})` : ''}`); };
async function mo(tham, coBai = true) {
  const url = pathToFileURL(resolve(tepHtml));
  url.search = new URLSearchParams({ im: '1', ...tham }).toString();
  c.loiTrang = null;
  await c.goi('Page.navigate', { url: 'about:blank' });
  await c.goi('Page.navigate', { url: url.href });
  for (let i = 0; i < 1200; i++) {
    if (c.loiTrang) throw Error(c.loiTrang);
    if (await c.doc(`location.href === ${JSON.stringify(url.href)} && !!window.__vt && ${coBai ? '!!window.__vt.canh' : 'true'}`)) return;
    await cho(50);
  }
  throw Error('Không mở được ' + url.href);
}
const chay = (n) => c.doc(`(() => { for (let i = 0; i < ${n}; i++) __vt.buoc(1 / 60); return true; })()`);
const hop = (sel) => c.doc(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);

try {
  await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: `(${chuanBi})()` });
  for (const [rong, cao] of dsCo) {
    const co = `${rong}×${cao}`;
    const dienThoai = rong < 600 || cao < 500;
    await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: 1, mobile: dienThoai });
    await c.goi('Emulation.setTouchEmulationEnabled', { enabled: dienThoai, maxTouchPoints: dienThoai ? 5 : 1 });
    await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });

    // 1) Nhãn và gợi ý kéo ở một bài mỗi phần.
    let tongNhan = 0, tongGoiY = 0;
    const dsLoi = [];
    for (const [id, buoc] of DS_BUOC) {
      await mo({ lang: 'vi', canh: id, buoc: String(buoc) });
      await chay(300);
      const k = await c.doc(XET_NHAN);
      tongNhan += k.soNhan; tongGoiY += k.soGoiY;
      for (const l of k.loi) dsLoi.push(`${id} bước ${buoc}: ${l}`);
      for (const l of k.loiCanh) dsLoi.push(`${id} bước ${buoc}: lỗi trong cảnh: ${l}`);
      if (k.tran) dsLoi.push(`${id} bước ${buoc}: trang tràn ngang`);
    }
    muc(`${co}: ${tongNhan} nhãn và ${tongGoiY} gợi ý kéo ở ${DS_BUOC.length} bước không đè bảng, ô số liệu, thanh trên, không ra ngoài cửa sổ`, dsLoi.length === 0, dsLoi.slice(0, 6).join(' | '));

    // 2) Bài 2 bước 7 (bộ tránh đè nhãn cũ làm mất cả hai nhãn Mây Magellan): trên màn hình rộng, nhãn «Ngân Hà» và ít
    //    nhất một nhãn Mây Magellan phải cùng hiện. Hiện được mấy trong năm nhãn thiên hà còn tuỳ góc máy của bài (hai Mây
    //    Magellan chỉ cách nhau chừng mười điểm ảnh, lại nằm sát bảng bài giảng thì không đủ chỗ cho cả hai): in ra để biết.
    //    Việc xếp chỗ khi còn chỗ được kiểm bằng số ở kiem-khung.mjs.
    await mo({ lang: 'vi', canh: 'ngan-ha', buoc: '7' });
    await chay(300);
    const th = await c.doc(`(() => { const ds = __vt.boNhan.trangThai().filter((n) => !n.an).map((n) => n.chu); return { mag: ds.filter((s) => /Magellan/.test(s)).length, nh: ds.some((s) => /^Ngân Hà/.test(s)), tong: ds.length, m31: ds.some((s) => /M31/.test(s)) }; })()`);
    console.log(`        (${co}: Bài 2 bước 7 hiện ${th.tong} nhãn thiên hà, trong đó ${th.mag} nhãn Mây Magellan, Tiên Nữ ${th.m31 ? 'có' : 'KHÔNG'})`);
    if (!dienThoai) muc(`${co}: Bài 2 bước 7 hiện nhãn «Ngân Hà» cùng ít nhất một nhãn Mây Magellan`, th.nh && th.mag >= 1, JSON.stringify(th));

    // 3) Ô số liệu thu gọn được.
    await mo({ lang: 'vi', canh: 'gian-no', buoc: '3' });
    await chay(120);
    const o1 = await c.doc(`({ gon: __vt.hud.gon, dong: [...document.querySelectorAll('#hud .dong')].filter((d) => d.getClientRects().length).length, cao: document.getElementById('hud').offsetHeight, tong: document.querySelectorAll('#hud .dong').length })`);
    muc(`${co}: ô số liệu mặc định ${dienThoai ? 'thu gọn (một dòng)' : 'mở đủ dòng'}`, dienThoai ? (o1.gon && o1.dong === 1 && o1.cao < 48) : (!o1.gon && o1.dong === o1.tong && o1.tong > 3), JSON.stringify(o1));
    await c.doc(`document.querySelector('#hud .hud-nut').click(); true`);
    await chay(20);
    const o2 = await c.doc(`({ gon: __vt.hud.gon, dong: [...document.querySelectorAll('#hud .dong')].filter((d) => d.getClientRects().length).length })`);
    muc(`${co}: bấm nút của ô số liệu thì ${dienThoai ? 'mở ra' : 'thu gọn'}`, o2.gon === !o1.gon && (o2.gon ? o2.dong === 1 : o2.dong === o1.tong), JSON.stringify(o2));
    const hud = await hop('#hud');
    muc(`${co}: ô số liệu nằm gọn trong cửa sổ`, hud && hud.x >= 0 && hud.r <= rong && hud.y >= 0 && hud.b <= cao, JSON.stringify(hud));

    // 4) Số hàng nghìn không ngắt, công thức dài vừa bảng.
    await mo({ lang: 'vi', canh: 'ngan-ha', buoc: '4' });
    const chuBuoc = await c.doc(`document.getElementById('buoc-noi-dung').textContent`);
    muc(`${co}: số «38 000», «50 000» trong lời giảng dùng khoảng trắng không ngắt`, /38 000/.test(chuBuoc) && /50 000/.test(chuBuoc) && !/\d \d{3}(?!\d)/.test(chuBuoc.replace(/\d{4} \d{3}/g, '')), (chuBuoc.match(/\d[  ]\d{3}/g) || []).slice(0, 6).map((s) => JSON.stringify(s)).join(' '));
    await mo({ lang: 'vi', canh: 'rindler', buoc: '7' });
    await chay(10);
    const tran = await c.doc(`[...document.querySelectorAll('#buoc-noi-dung .bg-toan')].filter((e) => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1).map((e) => e.scrollWidth + '>' + e.clientWidth)`);
    muc(`${co}: công thức đứng riêng dài ở Bài 8 bước 7 được co cho vừa bảng`, tran.length === 0, tran.join(', '));

    // 5) Thanh trên ở bốn thứ tiếng: nằm trong cửa sổ, các khối không đè nhau.
    for (const tieng of ['vi', 'en', 'zh-CN', 'ja']) {
      await c.goi('Emulation.setLocaleOverride', { locale: tieng });
      await mo({ lang: tieng, canh: 'thoi-gian' });
      const tt = await c.doc(`(() => { const ds = ['#nut-muc-luc', '#chon-bai', '#ngon-ngu-tren', '#nut-phai'].map((q) => document.querySelector(q).getBoundingClientRect()); const W = innerWidth;
        const de = ds.some((a, i) => ds.some((b, j) => i < j && a.left < b.right - 0.5 && a.right > b.left + 0.5));
        return { ngoai: ds.some((r) => r.left < 0 || r.right > W + 0.5 || r.width < 20), de, rong: ds.map((r) => Math.round(r.width)), tran: document.documentElement.scrollWidth > W + 1 }; })()`);
      muc(`${co}: thanh trên (${tieng}) nằm gọn, các khối không đè nhau`, !tt.ngoai && !tt.de && !tt.tran, JSON.stringify(tt));
    }
    await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });

    // 6) Màn hình chào: hai nút vào học thấy ngay.
    await mo({ lang: 'vi' }, false);
    const nut = await hop('#nut-bat-dau'), nutVideo = await hop('#nut-chao-video');
    muc(`${co}: màn hình chào: «Bắt đầu học» và «Xem như video» thấy ngay, không phải cuộn`, nut && nutVideo && nut.b <= cao && nutVideo.b <= cao && nut.x >= 0 && nutVideo.r <= rong, JSON.stringify({ nut, nutVideo }));

    // 7) Bài khai mayAnh.hep: màn hình hẹp thu nhỏ cả cảnh đúng hệ số, màn hình rộng giữ nguyên; bài không khai thì luôn
    //    giữ nguyên. Thử bằng cách đặt tạm hệ số 0,6 cho bài đang mở rồi mở lại bài (không sửa tệp bài nào).
    await mo({ lang: 'vi', canh: 'ngan-ha', buoc: '7' });
    const thu = await c.doc(`(() => { const a = __vt, dn = a.dsCanh[a.chiSo], goc = a.camera.zoom;
      dn.mayAnh = { ...dn.mayAnh, hep: 0.6 }; a.moBai(a.chiSo, 6); for (let i = 0; i < 30; i++) a.buoc(1 / 60);
      const co = a.camera.zoom, P = a.camera.projectionMatrix.elements[5];
      delete dn.mayAnh.hep; a.moBai(a.chiSo, 6); for (let i = 0; i < 30; i++) a.buoc(1 / 60);
      return { goc, co, sau: a.camera.zoom, tiLe: P / a.camera.projectionMatrix.elements[5], loi: a.loiGhi.slice(0, 2) }; })()`);
    const mong = rong <= 400 ? 0.6 : rong >= 700 ? 1 : 1 - 0.4 * (700 - rong) / 300;
    muc(`${co}: bài khai mayAnh.hep = 0,6 thì cảnh thu còn ${mong.toFixed(2)} lần; bài không khai giữ nguyên`,
      thu.goc === 1 && thu.sau === 1 && Math.abs(thu.co - mong) < 1e-6 && Math.abs(thu.tiLe - mong) < 1e-6 && !thu.loi.length, JSON.stringify(thu));
  }
} finally {
  await c.dong();
}
const hong = ketQua.filter((k) => !k.ok).length;
console.log(`Giao diện khung: ${ketQua.length - hong}/${ketQua.length} mục đạt.`);
process.exit(hong ? 1 : 0);
