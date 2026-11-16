// Bộ kiểm GIAO DIỆN của khung trong Chrome ẩn (im lặng, không cửa sổ), ở năm cỡ: màn hình rộng 1280 × 800, điện thoại
// cầm dọc 390 × 844 và 360 × 740, cầm ngang 844 × 390, máy tính bảng 768 × 1024 (bốn cỡ sau giả lập máy chạm thật:
// mobile: true, có sự kiện cảm ứng; KHÔNG phải thu nhỏ cửa sổ). Lệnh nặng: chạy qua kiem-tra/co-khoa.sh.
//
//   node kiem-tra/kiem-giao-dien.mjs <tệp HTML> [--co 1280x800,390x844,360x740,844x390,768x1024] [--nhanh]
//   (gọi không tham số, như npm run kiem vẫn gọi, thì chỉ in một dòng nhắc rồi thoát êm)
//
// Kiểm những điều người học thấy ngay khi khung hỏng:
//   - nhãn trên mô hình và nhãn gợi ý kéo: không chui dưới bảng bài giảng, ô số liệu, thanh trên, không bị cắt ở mép cửa sổ
//     (xét ở một bài mỗi phần; --nhanh thì chỉ ba bài);
//   - Bài 2 bước 7: hai nhãn Mây Magellan cùng hiện (bộ tránh đè nhãn từng làm mất);
//   - thanh trên nằm gọn trong cửa sổ ở mọi thứ tiếng, các khối không đè nhau;
//   - màn hình chào: nút «Bắt đầu học» và «Bắt đầu học có giọng đọc» thấy được ngay, không phải cuộn;
//   - ô số liệu: điện thoại mặc định thu gọn, bấm thì mở; màn hình rộng mặc định mở, nút mũi tên thu gọn được;
//   - số có khoảng trắng hàng nghìn trong lời giảng không xuống dòng giữa số; công thức dài được co cho vừa bảng;
//   - trang không tràn ngang; không có lỗi trong cảnh;
//   - HỌC TRỌN MỘT BÀI TRÊN MÁY CHẠM (mục 8, mọi thao tác là chạm thật): vào bài từ màn hình chào, đọc lời giảng (chữ từ
//     16 px, bảng kéo lên xuống được, không che mô hình quá nửa), nghe giảng có phụ đề, tự sang bước, xoay và phóng mô
//     hình bằng ngón tay, kéo tay nắm, Tóm tắt, Tự kiểm, thử thách, sổ tay, mục lục, đổi thứ tiếng, chọn giọng; vùng chạm
//     của mọi nút từ 44 px; thanh trên không che nội dung; tôn trọng vùng an toàn của máy (tai thỏ, thanh thao tác).
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
const dsCo = lay('--co', '1280x800,390x844,360x740,844x390,768x1024').split(',').map((s) => s.split('x').map(Number));
const { DS_TIENG } = await import('../cong-cu/ngon-ngu.mjs');
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
  for (const [ten, q] of [['ô số liệu', '#hud'], ['nút mục lục', '#nut-muc-luc'], ['khối chọn bài', '#chon-bai'], ['nút chọn tiếng', '#ngon-ngu-tren'], ['các nút bên phải', '#nut-phai']]) { const r = hop(q); if (r) vung.push([ten, r]); }
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

// Danh sách tiếng thử cho mục chọn giọng: Aoede mới có bước 1, Achird có bước 1–2, Algieba (giọng dự phòng) đủ 8 bước.
const tepThu = (giong, soBuoc) => Array.from({ length: soBuoc }, (_, i) => ({ buoc: i + 1, tep: `${giong}/he-mat-troi-${i + 1}.mp3`, giay: 40 }));
const GIONG_THU = {
  algieba: { bai: { 'he-mat-troi': { tep: tepThu('algieba', 8) } } },
  aoede: { giong: 'aoede', ngonNgu: 'vi', bai: { 'he-mat-troi': { tep: tepThu('aoede', 1) } } },
  achird: { giong: 'achird', ngonNgu: 'vi', bai: { 'he-mat-troi': { tep: tepThu('achird', 2) } } },
};
// Chạy trong trang: nút đang hiện mà VÙNG CHẠM chưa đủ 44 × 44 điểm ảnh. Đo bằng cách hỏi trình duyệt «chạm vào điểm
// cách tâm nút 21,5 px thì trúng ai» ở bốn phía, nên tính cả phần vùng chạm nới thêm bằng CSS và phần bị nút khác chen.
// Ngoại lệ có chủ ý: vạch tiến độ (rộng mà mảnh); chấm bước và thanh trượt chỉ xét chiều dọc (chấm bước xếp sát nhau
// theo chiều ngang, thanh trượt kéo theo chiều ngang); chữ thuật ngữ và liên kết nằm trong câu văn.
const VUNG_CHAM = `(() => {
  const W = innerWidth, H = innerHeight, loi = [];
  const thay = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { if (x.hidden) return false; const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } return true; };
  const trongCuon = (e, x, y) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/auto|scroll|hidden/.test(cs.overflowY + cs.overflowX)) { const r = p.getBoundingClientRect(); if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false; } } return true; };
  const ds = new Set();
  for (const e of document.querySelectorAll('button, select, summary, input, #hud, #keo-bang')) { if (!e.disabled) ds.add(e.matches('input') ? (e.closest('label') || e) : e); }
  for (const e of ds) {
    if (!thay(e) || getComputedStyle(e).pointerEvents === 'none') continue;
    if (e.matches('#gd-thanh, .xv-tien button') || e.closest('.bg a, .nguon, .chan-trang-web')) continue;
    const chiDoc = e.matches('#buoc-cham button, input[type=range]');
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // Điểm thử lấy toạ độ nguyên: trình duyệt dò điểm lẻ theo cả ô điểm ảnh quanh nó, sát mép là trúng sang nút bên cạnh.
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2), d = 21.5;
    const tx = r.left + r.width / 2, ty = r.top + r.height / 2;
    const diem = chiDoc ? [[cx, Math.ceil(ty - d)], [cx, Math.floor(ty + d)]] : [[Math.ceil(tx - d), cy], [Math.floor(tx + d), cy], [cx, Math.ceil(ty - d)], [cx, Math.floor(ty + d)]];
    if (![[cx, cy], ...diem].every(([x, y]) => x >= 0 && x <= W && y >= 0 && y <= H && trongCuon(e, x, y))) continue;      // đang cuộn khuất một phần
    const trung = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t)); };
    // Đang bị một bảng nổi (mục lục, sổ tay, bảng âm thanh, thẻ hết bài) che cả hay che một phần: không xét.
    const biChe = (x, y) => { const b = document.elementFromPoint(x, y)?.closest?.('#bang-tieng, #muc-luc, #thuat-ngu, #xv-het'); return !!b && !b.contains(e); };
    if (!trung(cx, cy) || diem.some(([x, y]) => biChe(x, y))) continue;
    if (diem.some(([x, y]) => !trung(x, y))) loi.push((e.id ? '#' + e.id : e.className ? '.' + String(e.className).split(' ')[0] : e.tagName.toLowerCase()) + ' «' + (e.textContent || e.title || '').trim().slice(0, 18) + '» ' + Math.round(r.width) + '×' + Math.round(r.height));
  }
  return [...new Set(loi)];
})()`;
// Chạy trong trang: phần giao diện ghim mép cửa sổ mà lấn vào vùng an toàn của máy (khoảng lùi `an`, điểm ảnh).
const VUNG_AN_TOAN = (an) => `(() => {
  const W = innerWidth, H = innerHeight, loi = [];
  const thay = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { if (x.hidden) return false; const cs = getComputedStyle(x); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } return true; };
  for (const q of ['#thanh-tren > *:not(.gian)', '#ngon-ngu-tren', '#bai-hoc', '#hud', '#xv-phu-de', '#xv-the.mo', '#xv-dk .xv-hang > button', '#xv-tien', '#nut-bat-dau', '#nut-chao-nghe', '#ngon-ngu-chao', '#chao .lo-trinh']) {
    for (const e of document.querySelectorAll(q)) {
      if (!thay(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const trongChao = !!e.closest('#chao');           // màn hình chào cuộn dọc: chỉ xét mép trên, trái, phải
      if (r.top < ${an.top} - 0.5 || r.left < ${an.left} - 0.5 || r.right > W - ${an.right} + 0.5 || (!trongChao && r.bottom > H - ${an.bottom} + 0.5)) loi.push(q + ' [' + [r.left, r.top, r.right, r.bottom].map(Math.round) + ']');
    }
  }
  return loi;
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
const de = (a, b) => !!a && !!b && a.x < b.r - 0.5 && a.r > b.x + 0.5 && a.y < b.b - 0.5 && a.b > b.y + 0.5;
// Chạm một điểm, và vuốt qua một dãy vị trí. Mỗi vị trí là [x, y] (một ngón) hoặc [[x1, y1], [x2, y2]] (hai ngón).
const chamDiem = async (x, y) => { await c.goi('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] }); await c.goi('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cho(70); };
const vuot = async (ds, giua) => {
  const diem = (v) => (Array.isArray(v[0]) ? v.map(([x, y], i) => ({ x, y, id: i + 1 })) : [{ x: v[0], y: v[1], id: 1 }]);
  await c.goi('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: diem(ds[0]) });
  for (const v of ds.slice(1)) { await c.goi('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: diem(v) }); if (giua) await giua(); }
  await c.goi('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cho(70);
};
const hop = (sel) => c.doc(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);

try {
  await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: `(${chuanBi})()` });
  for (const [rong, cao] of dsCo) {
    const co = `${rong}×${cao}`;
    const dienThoai = rong < 600 || cao < 500;       // cỡ điện thoại: ô số liệu mặc định thu gọn
    const cham = rong < 1100;                        // máy chạm (điện thoại, máy tính bảng): giả lập máy thật, có cảm ứng
    await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: cham ? 2 : 1, mobile: cham });
    await c.goi('Emulation.setTouchEmulationEnabled', { enabled: cham, maxTouchPoints: cham ? 5 : 1 });
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
    if (!cham) muc(`${co}: Bài 2 bước 7 hiện nhãn «Ngân Hà» cùng ít nhất một nhãn Mây Magellan`, th.nh && th.mag >= 1, JSON.stringify(th));

    // 3) Ô số liệu thu gọn được. Cần một bước có hơn 3 dòng: Bài 18 bước 3 (5 dòng). Bản dựng riêng của một gói bài
    //    (build.mjs --chi …) có thể không có Bài 18; khi đó trang tự mở bài khác (Bài 2, 3 dòng) và mục này hỏng oan.
    //    Nên chọn bước theo các bài có trong bản dựng (Bài 1 bước 1 có 4 dòng, gói nào cũng dựng kèm), và đòi trang mở
    //    đúng bài đã chọn.
    const dsCo1 = await c.doc('__vt.dsCanh.map((b) => b.id)');
    const [idHud, buocHud] = dsCo1.includes('gian-no') ? ['gian-no', 3] : ['he-mat-troi', 1];
    await mo({ lang: 'vi', canh: idHud, buoc: String(buocHud) });
    await chay(120);
    const moDung = await c.doc(`__vt.dsCanh[__vt.chiSo].id === ${JSON.stringify(idHud)} && __vt.chiSoBuoc === ${buocHud - 1}`);
    if (!moDung) muc(`${co}: mở được ${idHud} bước ${buocHud} để kiểm ô số liệu`, false);
    const o1 = await c.doc(`({ bai: ${JSON.stringify(idHud + ' bước ' + buocHud)}, gon: __vt.hud.gon, dong: [...document.querySelectorAll('#hud .dong')].filter((d) => d.getClientRects().length).length, cao: document.getElementById('hud').offsetHeight, tong: document.querySelectorAll('#hud .dong').length })`);
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
    //    Trên điện thoại nút mục lục gộp vào khối chọn bài (bấm số bài là mở mục lục), nên ở đó chỉ còn ba khối.
    for (const tieng of DS_TIENG) {
      await c.goi('Emulation.setLocaleOverride', { locale: tieng });
      await mo({ lang: tieng, canh: 'buc-xa-hawking' });
      const tt = await c.doc(`(() => { const ds = ['#nut-muc-luc', '#chon-bai', '#ngon-ngu-tren', '#nut-phai'].map((q) => document.querySelector(q)).filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.getBoundingClientRect()); const W = innerWidth;
        const de = ds.some((a, i) => ds.some((b, j) => i < j && a.left < b.right - 0.5 && a.right > b.left + 0.5));
        const ten = document.getElementById('ten-bai');
        return { so: ds.length, ngoai: ds.some((r) => r.left < 0 || r.right > W + 0.5 || r.width < 20), de, rong: ds.map((r) => Math.round(r.width)), cao: ds.map((r) => Math.round(r.height)), tran: document.documentElement.scrollWidth > W + 1, catChu: ten.scrollWidth > ten.clientWidth + 1 && !ten.querySelector('.ten')?.getClientRects().length }; })()`);
      muc(`${co}: thanh trên (${tieng}) nằm gọn, các khối không đè nhau${cham ? ', cao 44 px, số bài không bị cắt' : ''}`, tt.so >= 3 && !tt.ngoai && !tt.de && !tt.tran && (!cham || (tt.cao.every((h) => h >= 44) && !tt.catChu)), JSON.stringify(tt));
    }
    await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });

    // 6) Màn hình chào: hai nút vào học thấy ngay.
    await mo({ lang: 'vi' }, false);
    const nut = await hop('#nut-bat-dau'), nutNghe = await hop('#nut-chao-nghe');
    muc(`${co}: màn hình chào: «Bắt đầu học» và «Bắt đầu học có giọng đọc» thấy ngay, không phải cuộn`, nut && nutNghe && nut.b <= cao && nutNghe.b <= cao && nut.x >= 0 && nutNghe.r <= rong, JSON.stringify({ nut, nutNghe }));

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

    // 8) HỌC TRỌN MỘT BÀI TRÊN MÁY CHẠM (điện thoại cầm dọc, cầm ngang, máy tính bảng): giả lập máy thật (mobile: true, có
    //    chạm), mọi thao tác dưới đây là CHẠM bằng sự kiện cảm ứng, không phải gọi hàm. Yêu cầu: vào bài từ màn hình chào,
    //    đọc lời giảng (chữ từ 16 px, bảng kéo lên xuống được, không che mô hình quá nửa), nghe giảng có phụ đề, tự sang
    //    bước, xoay và phóng mô hình bằng ngón tay, kéo tay nắm, mở Tóm tắt, Tự kiểm, sổ tay, mục lục, đổi thứ tiếng,
    //    chọn giọng; vùng chạm từ 44 px; không tràn ngang; thanh trên không che nội dung; tôn trọng vùng an toàn của máy.
    if (cham) {
      const dsVungCham = [];
      const xetVungCham = async (manHinh) => { for (const l of await c.doc(VUNG_CHAM)) dsVungCham.push(`${manHinh}: ${l}`); if (await c.doc('document.documentElement.scrollWidth > innerWidth + 1')) dsVungCham.push(`${manHinh}: trang tràn ngang`); };
      const tam = (sel) => c.doc(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView?.({ block: 'nearest' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      const chamVao = async (sel) => { const p = await tam(sel); if (!p) throw Error('Không thấy phần tử để chạm: ' + sel); await chamDiem(p[0], p[1]); };
      // 8.1 Màn hình chào: chạm «Bắt đầu học có giọng đọc».
      await mo({ lang: 'vi' }, false);
      const mt = await c.doc(`({ tho: matchMedia('(pointer: coarse)').matches, thanh: getComputedStyle(document.documentElement).getPropertyValue('--cao-thanh').trim(), vp: document.querySelector('meta[name=viewport]').content })`);
      muc(`${co}: máy chạm được nhận ra (pointer: coarse), thanh trên cao 44 px, trang vẽ tràn mép (viewport-fit=cover)`, mt.tho && mt.thanh === '44px' && /viewport-fit=cover/.test(mt.vp), JSON.stringify(mt));
      await xetVungCham('màn hình chào');
      const chuCat = await c.doc(`[...document.querySelectorAll('#chao .dk-nut, #chao .ct-bai .ten, #chao .phan-dau b')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.slice(0, 30))`);
      muc(`${co}: màn hình chào: không chữ nào của nút, tên phần, tên bài bị cắt`, chuCat.length === 0, chuCat.slice(0, 4).join(' | '));
      await chamVao('#nut-chao-nghe');
      for (let i = 0; i < 60 && !(await c.doc(`!!__vt.canh && !document.body.classList.contains('dang-chao')`)); i++) await cho(50);
      await chay(60);
      let n = await c.doc('__vt.nghe.trangThai()');
      muc(`${co}: chạm «Bắt đầu học có giọng đọc» ở màn hình chào là vào bài, lời tự chạy, tự sang bước`, n.dangPhat && n.tuSang && !n.anBang && n.buoc === 0 && !(await c.doc(`document.body.classList.contains('dang-chao')`)), JSON.stringify({ dangPhat: n.dangPhat, tuSang: n.tuSang, buoc: n.buoc }));
      // 8.2 Bảng bài giảng không che mô hình quá nửa; thanh trên không che ô số liệu, bảng, phụ đề.
      await c.doc('__vt.nghe.tien(5); true');
      await chay(40);
      const bc = await c.doc(`(() => { const r = (q) => { const e = document.querySelector(q); if (!e || e.hidden) return null; const b = e.getBoundingClientRect(); return b.width > 1 ? { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } : null; };
        const tren = ['#chon-bai', '#ngon-ngu-tren', '#nut-phai', '#nut-muc-luc'].map(r).filter(Boolean);
        return { bang: r('#bai-hoc'), hud: r('#hud'), pd: r('#xv-phu-de'), dayTren: Math.max(...tren.map((t) => t.b)), W: innerWidth, H: innerHeight }; })()`);
      const ngang = rong > cao && cao < 500;
      muc(`${co}: bảng bài giảng không che mô hình quá nửa màn hình`, bc.bang && (ngang ? bc.bang.w <= rong * 0.5 + 1 : bc.bang.h <= cao * 0.5 + 1), JSON.stringify(bc.bang));
      muc(`${co}: thanh trên không che ô số liệu, bảng bài giảng, phụ đề`, bc.hud && bc.hud.y >= bc.dayTren && bc.bang.y >= bc.dayTren && bc.pd && bc.pd.y >= bc.dayTren, JSON.stringify({ dayTren: bc.dayTren, hud: bc.hud?.y, bang: bc.bang?.y, pd: bc.pd?.y }));
      muc(`${co}: đang nghe: phụ đề nằm trong phần mô hình, ngoài bảng bài giảng và ô số liệu`, bc.pd && bc.pd.x >= 0 && bc.pd.r <= rong && !de(bc.pd, bc.bang) && !de(bc.pd, bc.hud), JSON.stringify({ pd: bc.pd, bang: bc.bang }));
      await xetVungCham('bài giảng, đang nghe');
      // 8.3 Chữ đọc từ 16 px; bảng cuộn được, không tràn ngang.
      const chu = await c.doc(`(() => { const co = (q) => { const e = document.querySelector(q); return e ? parseFloat(getComputedStyle(e).fontSize) : null; }; const cuon = document.getElementById('bai-hoc-cuon');
        return { loi: co('#buoc-noi-dung p'), ten: co('#buoc-ten'), cuonDuoc: cuon.scrollHeight > cuon.clientHeight + 20 && getComputedStyle(cuon).overflowY === 'auto', tranNgang: cuon.scrollWidth > cuon.clientWidth + 1 }; })()`);
      muc(`${co}: lời giảng cỡ chữ từ 16 px, bảng cuộn lên xuống được, không tràn ngang`, chu.loi >= 16 && chu.ten >= 16 && chu.cuonDuoc && !chu.tranNgang, JSON.stringify(chu));
      // 8.4 Tự sang bước: hết lời bước 1 thì sang bước 2; trên bảng nằm dưới thì bảng cuộn tới ngay tên bước.
      await c.doc(`(() => { const x = __vt.nghe, s = x.trangThai(); x.tien(s.dai - s.t + 1.3); return true; })()`);
      await chay(20);
      n = await c.doc(`({ ...__vt.nghe.trangThai(), tenBuoc: (() => { const e = document.querySelector('.buoc-thanh'), k = document.getElementById('bai-hoc-cuon'); const a = e.getBoundingClientRect(), b = k.getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; })() })`);
      muc(`${co}: hết lời thì tự sang bước 2, đọc tiếp, tên bước nằm ngay trong tầm mắt`, n.buoc === 1 && n.dangPhat && n.tenBuoc, JSON.stringify({ buoc: n.buoc, dangPhat: n.dangPhat, tenBuoc: n.tenBuoc }));
      // Chạm nút tạm dừng của thanh «Nghe giảng»: lời dừng.
      await chamVao('#gd-phat');
      await cho(80);
      n = await c.doc('__vt.nghe.trangThai()');
      muc(`${co}: chạm nút của thanh «Nghe giảng» thì lời tạm dừng`, !n.dangPhat && n.tamDung, JSON.stringify({ dangPhat: n.dangPhat }));
      await chamVao('#gd-phat');
      await cho(80);
      // 8.5 Kéo thanh nắm của bảng (khi bảng nằm dưới): bảng cao lên, mô hình và phụ đề dời theo; chạm nhẹ thì đổi nhanh.
      if (!ngang) {
        const b0 = await hop('#bai-hoc'), nam = await tam('#keo-bang');
        await vuot([[nam[0], nam[1]], [nam[0], nam[1] - 40], [nam[0], nam[1] - 110]]);
        await chay(20);
        const b1 = await hop('#bai-hoc');
        await vuot([[nam[0], b1.y + 4], [nam[0], b1.y + 60], [nam[0], b1.y + 170]]);
        await chay(20);
        const b2 = await hop('#bai-hoc');
        muc(`${co}: kéo thanh nắm của bảng bằng ngón tay: kéo lên bảng cao thêm, kéo xuống bảng thấp đi`, b1.h > b0.h + 80 && b1.h < b0.h + 140 && b2.h < b1.h - 120 && b2.h >= 130, `cao ${Math.round(b0.h)} → ${Math.round(b1.h)} → ${Math.round(b2.h)}`);
        const nam2 = await tam('#keo-bang');
        await chamDiem(nam2[0], nam2[1]);
        await chay(20);
        const b3 = await hop('#bai-hoc'), pd3 = await hop('#xv-phu-de');
        muc(`${co}: chạm nhẹ thanh nắm thì bảng nâng lên để đọc cho rộng; phụ đề vẫn nằm ngoài bảng`, b3.h > cao * 0.6 && b3.h < cao * 0.85 && (!pd3 || pd3.b <= b3.y + 1), `cao ${Math.round(b3.h)}`);
        await c.doc(`document.documentElement.style.removeProperty('--cao-bang'); __vt._tinhLech(); true`);
        await chay(20);
      }
      // 8.6 Ngón tay trên mô hình: một ngón kéo là xoay, hai ngón chụm xoè là phóng.
      const vungMoHinh = await c.doc(`(() => { const b = document.getElementById('bai-hoc').getBoundingClientRect(), W = innerWidth, H = innerHeight; return b.width < W * 0.6 ? [b.left / 2, H * 0.55] : [W / 2, (60 + b.top) / 2 + 20]; })()`);
      const [mx, my] = vungMoHinh;
      const goc = () => c.doc(`(() => { const a = __vt, p = a.camera.position, d = a.dk.target; return { phi: Math.atan2(p.x - d.x, p.z - d.z), xa: p.distanceTo(d) }; })()`);
      await c.doc('__vt.nghe.phatDung(false); __vt.datChay(true); true');
      await chay(150);                 // máy quay bay tới góc của bước xong đã
      const g0 = await goc();
      await vuot([[mx - 40, my], [mx - 10, my], [mx + 20, my], [mx + 50, my]]);
      await chay(30);
      const g1 = await goc();
      muc(`${co}: một ngón tay kéo ngang trên mô hình thì mô hình xoay`, Math.abs(g1.phi - g0.phi) > 0.05 && Math.abs(g1.xa - g0.xa) < g0.xa * 0.02, `góc ${g0.phi.toFixed(3)} → ${g1.phi.toFixed(3)}`);
      await vuot([[[mx - 20, my], [mx + 20, my]], [[mx - 40, my], [mx + 40, my]], [[mx - 70, my], [mx + 70, my]]]);
      await chay(30);
      const g2 = await goc();
      muc(`${co}: hai ngón tay xoè ra trên mô hình thì phóng to (máy quay lại gần)`, g2.xa < g1.xa * 0.9, `khoảng cách ${g1.xa.toPrecision(4)} → ${g2.xa.toPrecision(4)}`);
      // 8.7 Kéo một tay nắm bằng ngón tay (bước đầu tiên của Bài 1 có tay nắm nằm trong phần mô hình còn trống).
      await c.doc('__vt.veGocBanDau(); true');
      await chay(120);
      const tayNam = await c.doc(`(() => { const a = __vt, V = a.camera.position.constructor, b = document.getElementById('bai-hoc').getBoundingClientRect(), W = innerWidth, H = innerHeight;
        const x1 = b.width < W * 0.6 ? b.left - 30 : W - 30, y1 = b.width < W * 0.6 ? H - 30 : b.top - 30;
        for (let k = 0; k < a._dsBuoc().length; k++) { a.moBuoc(k); for (let i = 0; i < 150; i++) a.buoc(1 / 60);
          for (let i = 0; i < a.tt._tay.length; i++) { const t = a.tt._tay[i]; if (t.an || t.khoa || !a.tt._hien(t.vat)) continue; const v = t.vat.getWorldPosition(new V()).project(a.camera);
            const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H; if (v.z > -1 && v.z < 1 && x > 40 && x < x1 && y > 110 && y < y1) return { k, i, x, y }; } }
        return null; })()`);
      if (!tayNam) muc(`${co}: tìm được một tay nắm nằm trong phần mô hình để thử kéo`, false);
      else {
        await c.doc(`window.__keoThu = 0; const t = __vt.tt._tay[${tayNam.i}]; const cu = t.tc.khiKeo; t.tc.khiKeo = (...a) => { window.__keoThu++; return cu?.(...a); }; true`);
        await vuot([[tayNam.x, tayNam.y], [tayNam.x + 8, tayNam.y - 6], [tayNam.x + 22, tayNam.y - 16], [tayNam.x + 34, tayNam.y - 24]], async () => { await chay(3); });
        const keo = await c.doc(`({ soLan: window.__keoThu, loi: __vt.loiGhi.slice(0, 2) })`);
        muc(`${co}: kéo một tay nắm bằng ngón tay (Bài 1 bước ${tayNam.k + 1}) thì tay nắm nhận, không lỗi`, keo.soLan >= 1 && !keo.loi.length, JSON.stringify(keo));
        // Chạm lệch tâm 18 px vẫn bắt được tay nắm (vùng chạm của tay nắm từ 44 px).
        const lech = await c.doc(`(() => { const a = __vt, t = a.tt._tay[${tayNam.i}], V = a.camera.position.constructor, v = t.vat.getWorldPosition(new V()).project(a.camera); const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight;
          a.tt._con.cham = true; const r = a.tt._tim(x + 18, y); a.tt._con.cham = false; a.tt._con.cham = false; const chuot = a.tt._tim(x + 18, y); return { cham: r === t, chuot: chuot === t }; })()`);
        muc(`${co}: chạm lệch tâm tay nắm 18 px vẫn bắt được (vùng chạm của tay nắm từ 44 px)`, lech.cham, JSON.stringify(lech));
      }
      // 8.8 Thẻ Tóm tắt, Tự kiểm: chạm vào thẻ thì mở; chọn một đáp án bằng ngón tay.
      await c.doc('__vt.moBuoc(0); true');
      await chamVao('#bai-hoc .tab button[data-tab="tom"]');
      await cho(80);
      const tom = await c.doc(`(() => { const s = document.querySelector('#bai-hoc .trang[data-trang="tom"]'), k = document.getElementById('bai-hoc-cuon'); return { mo: !s.hidden, co: parseFloat(getComputedStyle(s.querySelector('.y-chinh')).fontSize), tran: k.scrollWidth > k.clientWidth + 1 }; })()`);
      muc(`${co}: chạm thẻ Tóm tắt thì mở, chữ từ 16 px, không tràn ngang`, tom.mo && tom.co >= 16 && !tom.tran, JSON.stringify(tom));
      await xetVungCham('thẻ Tóm tắt');
      await chamVao('#bai-hoc .tab button[data-tab="hoi"]');
      await cho(80);
      await xetVungCham('thẻ Tự kiểm');
      await chamVao('#bai-hoc .trang[data-trang="hoi"] .ch-chon button');
      await cho(80);
      const hoi = await c.doc(`(() => { const s = document.querySelector('#bai-hoc .trang[data-trang="hoi"]'); return { mo: !s.hidden, daChon: !!s.querySelector('.ch-chon button.dung, .ch-chon button.sai'), co: parseFloat(getComputedStyle(s.querySelector('.ch-chon button')).fontSize) }; })()`);
      muc(`${co}: chạm thẻ Tự kiểm rồi chạm một đáp án thì được chấm, chữ từ 16 px`, hoi.mo && hoi.daChon && hoi.co >= 16, JSON.stringify(hoi));
      await chamVao('#bai-hoc .tab button[data-tab="hoc"]');
      await cho(60);
      // 8.9 Thử thách của bước (nếu bước có): hộp nằm gọn trong bảng.
      const tt = await c.doc(`(() => { const a = __vt, k = a._dsBuoc().findIndex((b) => b.thuThach); if (k < 0) return null; a.moBuoc(k); const h = document.querySelector('#buoc-noi-dung .hop.thu-thach'), b = document.getElementById('bai-hoc-cuon'); if (!h) return { k, co: false };
        h.scrollIntoView({ block: 'nearest' }); const r = h.getBoundingClientRect(), rb = b.getBoundingClientRect(); return { k, co: true, gon: r.left >= rb.left - 1 && r.right <= rb.right + 1, coChu: parseFloat(getComputedStyle(h.querySelector('p') || h).fontSize) }; })()`);
      if (tt) { muc(`${co}: hộp thử thách (bước ${tt.k + 1}) nằm gọn trong bảng, chữ từ 16 px`, tt.co && tt.gon && tt.coChu >= 16, JSON.stringify(tt)); await xetVungCham('bước có thử thách'); }
      // 8.10 Sổ tay thuật ngữ, mục lục: chạm nút trên thanh trên thì mở, nằm gọn trong cửa sổ.
      await chamVao('#nut-thuat-ngu');
      await cho(100);
      const st = await hop('#thuat-ngu');
      muc(`${co}: chạm «Aa» mở sổ tay, nằm gọn trong cửa sổ`, st && st.x >= 0 && st.r <= rong + 0.5 && st.y >= 0 && st.b <= cao + 0.5, JSON.stringify(st));
      await c.doc('document.activeElement?.blur?.(); true');
      await xetVungCham('sổ tay');
      await c.doc(`__vt.el.thuatNgu.hidden = true; true`);
      await chamVao(await c.doc(`getComputedStyle(document.getElementById('nut-muc-luc')).display === 'none' ? '#ten-bai' : '#nut-muc-luc'`));
      await cho(100);
      const ml = await hop('#muc-luc');
      muc(`${co}: chạm nút mục lục thì mở, nằm gọn trong cửa sổ`, ml && ml.x >= 0 && ml.r <= rong + 0.5 && ml.y >= 0 && ml.b <= cao + 0.5, JSON.stringify(ml));
      await xetVungCham('mục lục');
      await chamVao('#muc-luc button[data-i="1"]');
      for (let i = 0; i < 40 && (await c.doc('__vt.chiSo')) !== 1; i++) await cho(50);
      muc(`${co}: chạm một bài trong mục lục thì sang bài đó`, (await c.doc('__vt.chiSo')) === 1 && (await c.doc('document.getElementById("muc-luc").hidden')));
      await chay(60);
      // 8.11 Ẩn bảng bằng nút trên thanh trên: thanh phát ở đáy, mọi nút đủ lớn.
      await chamVao('#nut-bang');
      await chay(30);
      await c.doc(`__vt.nghe.phatDung(true); __vt.nghe.tien(4); __vt.nghe._hienDieuKhien(true); true`);
      await chay(30);
      n = await c.doc('__vt.nghe.trangThai()');
      const dk = await hop('#xv-dk'), pdAn = await hop('#xv-phu-de');
      muc(`${co}: chạm nút ẩn bảng: mô hình chiếm cả màn hình, lời chạy, phụ đề nằm trên thanh phát`, n.anBang && n.dangPhat && dk && pdAn && pdAn.b <= dk.y + 40 && pdAn.x >= 0 && pdAn.r <= rong, JSON.stringify({ anBang: n.anBang, pd: pdAn, dk }));
      await xetVungCham('ẩn bảng, thanh phát');
      await chamVao('#xv-bang');
      await chay(20);
      muc(`${co}: chạm nút hiện bảng trên thanh phát thì bảng hiện lại`, !(await c.doc('__vt.nghe.trangThai().anBang')));
      await c.doc('__vt.nghe.phatDung(false); true');
      // 8.12 Bảng âm thanh.
      await chamVao('#nut-tieng');
      await cho(100);
      const bt = await hop('#bang-tieng');
      muc(`${co}: chạm nút loa mở bảng âm thanh và hình, nằm gọn trong cửa sổ`, bt && bt.x >= 0 && bt.r <= rong + 0.5 && bt.b <= cao + 0.5, JSON.stringify(bt));
      await xetVungCham('bảng âm thanh');
      await c.doc(`document.getElementById('bang-tieng').hidden = true; true`);
      muc(`${co}: vùng chạm của mọi nút đang hiện từ 44 px (chào, bài giảng, Tóm tắt, Tự kiểm, thử thách, sổ tay, mục lục, thanh phát, bảng âm thanh), không màn hình nào tràn ngang`, dsVungCham.length === 0, dsVungCham.slice(0, 8).join(' | ') + (dsVungCham.length > 8 ? ` … (${dsVungCham.length})` : ''));
      const loiCham = await c.doc('__vt.loiGhi.slice(0, 3)');
      muc(`${co}: không có lỗi trong cảnh suốt lượt chạm`, !loiCham.length && !c.loiTrang, loiCham.join(' | ') || c.loiTrang || '');
      // 8.13 Đổi thứ tiếng bằng ô chọn tiếng: trang nạp lại đúng thứ tiếng, đúng bài và bước đang học.
      await c.doc(`(() => { __vt.moBuoc(2); const s = document.getElementById('ngon-ngu-tren'); s.value = 'en'; s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
      let doi = null;
      for (let i = 0; i < 400 && !doi; i++) { await cho(50); doi = await c.doc(`document.documentElement.lang === 'en' && !!window.__vt?.canh ? { bai: __vt.chiSo, buoc: __vt.chiSoBuoc, ten: document.getElementById('buoc-so').textContent } : null`).catch(() => null); }
      muc(`${co}: đổi sang tiếng Anh bằng ô chọn tiếng: trang nạp lại ở đúng bài, đúng bước`, doi && doi.bai === 1 && doi.buoc === 2 && /step/i.test(doi.ten), JSON.stringify(doi));
      await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });
      // 8.14 Chọn giọng đọc trong bảng âm thanh (danh sách tiếng thử: Aoede mới có bước 1, Achird có bước 1–2, Algieba đủ).
      const { identifier: maGiong } = await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: `window.__VT_THU = { ...(window.__VT_THU || {}), giongDoc: ${JSON.stringify(GIONG_THU)} };` });
      await mo({ lang: 'vi', canh: 'he-mat-troi' });
      const g = await c.doc(`(() => { const a = __vt; return { chon: a._gdGiong, ds: a._gdDsGiong(), b1: a._gdTep(0)?.tep, b2: a._gdTep(1)?.tep, b3: a._gdTep(2)?.tep }; })()`);
      muc(`${co}: giọng mặc định là giọng nữ Aoede; bước chưa có giọng đó thì lấy giọng còn lại, rồi tới giọng dự phòng`, g.chon === 'aoede' && g.ds.join() === 'aoede,achird' && /^aoede\//.test(g.b1) && /^achird\//.test(g.b2) && /^algieba\//.test(g.b3), JSON.stringify(g));
      await chamVao('#nut-tieng');
      await cho(100);
      const dsNutGiong = await c.doc(`[...document.querySelectorAll('#bang-tieng button')].map((b) => b.textContent.trim()).filter((t) => /Giọng|Algieba/i.test(t))`);
      muc(`${co}: bảng âm thanh có chỗ chọn giọng với đúng hai giọng «Giọng nữ», «Giọng nam»`, dsNutGiong.length === 2 && dsNutGiong.includes('Giọng nữ') && dsNutGiong.includes('Giọng nam'), dsNutGiong.join(', '));
      await xetVungCham('bảng âm thanh có chọn giọng');
      const nutNam = await c.doc(`(() => { const b = [...document.querySelectorAll('#bang-tieng button')].find((x) => x.textContent.trim() === 'Giọng nam'); if (!b) return null; b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
      if (nutNam) await chamDiem(nutNam[0], nutNam[1]);
      await cho(100);
      const g2b = await c.doc(`(() => { const a = __vt; return { chon: a._gdGiong, nho: localStorage.getItem('vu-tru-3d.giong-doc'), b1: a._gdTep(0)?.tep }; })()`);
      muc(`${co}: chạm «Giọng nam» thì đổi sang giọng Achird và nhớ lựa chọn`, g2b.chon === 'achird' && g2b.nho === 'achird' && /^achird\//.test(g2b.b1), JSON.stringify(g2b));
      muc(`${co}: vùng chạm ở bảng chọn giọng từ 44 px`, dsVungCham.filter((l) => /chọn giọng/.test(l)).length === 0, dsVungCham.filter((l) => /chọn giọng/.test(l)).slice(0, 4).join(' | '));
      await c.goi('Page.removeScriptToEvaluateOnNewDocument', { identifier: maGiong });
      // 8.15 Vùng an toàn của máy (tai thỏ, thanh thao tác): giả lập khoảng lùi như iPhone, mọi thứ ghim mép phải lùi vào.
      const an = ngang ? { top: 0, bottom: 21, left: 47, right: 47 } : { top: 47, bottom: 34, left: 0, right: 0 };
      let coAn = true;
      try { await c.goi('Emulation.setSafeAreaInsetsOverride', { insets: an }); } catch { coAn = false; }
      if (!coAn) console.log(`        (${co}: Chrome này không giả lập được vùng an toàn; mục này bỏ qua)`);
      else {
        await mo({ lang: 'vi', canh: 'he-mat-troi', buoc: '2' });
        await c.doc('__vt.nghe.phatDung(true); __vt.nghe.tien(4); true');
        await chay(40);
        const v1 = await c.doc(VUNG_AN_TOAN(an));
        await c.doc('__vt.anHienBang(true); __vt.nghe._hienDieuKhien(true); true');
        await chay(40);
        const v2 = await c.doc(VUNG_AN_TOAN(an));
        await mo({ lang: 'vi' }, false);
        const v3 = await c.doc(VUNG_AN_TOAN(an));
        const dsAn = [...v1.map((l) => 'bài giảng: ' + l), ...v2.map((l) => 'ẩn bảng: ' + l), ...v3.map((l) => 'màn hình chào: ' + l)];
        muc(`${co}: tôn trọng vùng an toàn của máy (trên ${an.top}, dưới ${an.bottom}, trái ${an.left}, phải ${an.right} px): không nút, bảng, phụ đề nào lấn vào`, dsAn.length === 0, dsAn.slice(0, 6).join(' | '));
        await c.goi('Emulation.setSafeAreaInsetsOverride', { insets: {} });
      }
    }
  }
} finally {
  await c.dong();
}
const hong = ketQua.filter((k) => !k.ok).length;
console.log(`Giao diện khung: ${ketQua.length - hong}/${ketQua.length} mục đạt.`);
process.exit(hong ? 1 : 0);
