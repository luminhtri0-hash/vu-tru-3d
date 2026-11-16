// Bộ kiểm việc NGHE GIẢNG CÓ PHỤ ĐỀ (src/khung/nghe-giang.js, src/khung/chia-phu-de.js). Từ bản 3.8 chỉ có một cách
// học: không còn chế độ «Xem như video» riêng; tên tệp giữ nguyên để các lệnh và tài liệu cũ vẫn chạy.
//
//   node kiem-tra/kiem-xem-video.mjs                 phần nhanh, không mở trình duyệt (npm run kiem chạy phần này):
//                                                    quy tắc chia phụ đề, dạng tệp lời đọc, mốc phụ đề khớp lời đọc
//   node kiem-tra/kiem-xem-video.mjs <tệp HTML>      thêm phần chạy trong Chrome ẩn (im lặng, đồng hồ tiếng giả), ở hai cỡ
//                                                    1280 × 800 và 390 × 844. Lệnh nặng: chạy qua kiem-tra/co-khoa.sh.
//
// Phần Chrome: bấm nghe ngay ở màn hình thường thì phụ đề hiện trên mô hình, không bị bảng che, không đè ô số liệu và
// nhãn; phím V chỉ ẩn bảng (cùng bước, lời không ngắt, có thêm thanh phát); phụ đề đúng câu ở thời điểm t; «Tự sang bước»
// tắt thì dừng, bật thì nối liền các bước; tạm dừng; đổi tốc độ; tắt phụ đề; nhảy bước; hết bài thì đếm ngược rồi sang
// bài sau; Esc hiện lại bảng mà lời vẫn chạy; nút lớn ở màn hình chào; đường dẫn ?nghe=1 và ?xem=1; tiếng chưa có giọng
// thì vẫn chạy, có dòng báo; đo phần tính mỗi khung hình khi đang nghe so với lúc không nghe. Cuối cùng là một lượt chạy
// thật (tiếng câm): lần bấm nghe đầu tiên cho phép phát tiếng, đổi bài qua màn tối.
import assert from 'node:assert/strict';
import { existsSync, lstatSync, readFileSync, readdirSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chiaPhuDe, datMocUocTinh, cauLucDo, doDai, laChuVuong } from '../src/khung/chia-phu-de.js';

const GOC = fileURLToPath(new URL('../', import.meta.url));
const gom = (s) => String(s).replace(/\s+/g, ' ').trim();
let soPhep = 0;
const dat = (dk, tin) => { soPhep++; assert(dk, tin); };

// ---------- 1. Chia phụ đề ----------
function kiemChia(loi, nhan, dai) {
  const cau = chiaPhuDe(loi);
  const vuong = laChuVuong(loi);
  dat(cau.length > 0, `${nhan}: không ra câu phụ đề nào`);
  const bo = (s) => (vuong ? s.replace(/\s+/g, '') : gom(s));
  dat(bo(cau.join(' ')) === bo(loi), `${nhan}: ghép các câu không ra lời gốc`);
  for (const c of cau) {
    const dong = c.split('\n');
    dat(dong.length <= 2, `${nhan}: câu quá 2 dòng «${c}»`);
    for (const d of dong) dat(doDai(d, vuong) <= dai + 2 || !/\s/.test(d), `${nhan}: dòng dài ${doDai(d, vuong)} «${d}»`);
  }
  return cau;
}
const DS_LOI = {};
const thuMucLoi = `${GOC}src/loi-doc/vi`;
const { docBai } = await import('../cong-cu/doc-bai.mjs');
const { bai: DS_BAI } = await docBai();
for (const ten of readdirSync(thuMucLoi).filter((t) => t.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(`${thuMucLoi}/${ten}`, 'utf8'));
  const id = ten.slice(0, -5);
  dat(d.bai === id, `${ten}: trường "bai" phải là «${id}»`);
  dat(Array.isArray(d.buoc) && d.buoc.every((x) => typeof x === 'string' && x.trim()), `${ten}: "buoc" phải là danh sách chuỗi`);
  const canh = DS_BAI.find((c) => c.id === id);
  dat(canh, `${ten}: không có bài «${id}»`);
  dat(d.buoc.length === canh.baiGiang.buoc.length, `${ten}: có ${d.buoc.length} lời đọc nhưng bài có ${canh.baiGiang.buoc.length} bước`);
  d.buoc.forEach((l, k) => kiemChia(l, `${id} bước ${k + 1}`, 42));
  DS_LOI[id] = d.buoc;
}
const { DS_TIENG_DICH, dongPhuDe } = await import('../cong-cu/ngon-ngu.mjs');
// Lời đọc đã dịch (src/loi-doc/<mã tiếng>/<id>.json), nếu có: đúng bài, đủ số bước như bản Việt, không còn chữ Việt,
// và chia được thành phụ đề hai dòng.
let soLoiDich = 0;
for (const ma of DS_TIENG_DICH) {
  const thuMuc = `${GOC}src/loi-doc/${ma}`;
  if (!existsSync(thuMuc)) continue;
  for (const ten of readdirSync(thuMuc).filter((t) => t.endsWith('.json'))) {
    const d = JSON.parse(readFileSync(`${thuMuc}/${ten}`, 'utf8'));
    const id = ten.slice(0, -5);
    dat(!d.bai || d.bai === id, `${ma}/${ten}: trường "bai" phải là «${id}»`);
    dat(DS_LOI[id], `${ma}/${ten}: không có lời đọc tiếng Việt của bài «${id}»`);
    dat(Array.isArray(d.buoc) && d.buoc.length === DS_LOI[id].length, `${ma}/${ten}: có ${d.buoc?.length} lời đọc nhưng bản Việt có ${DS_LOI[id]?.length}`);
    d.buoc.forEach((l, k) => {
      dat(typeof l === 'string' && l.trim(), `${ma}/${ten} bước ${k + 1}: lời đọc rỗng`);
      dat(!/[ăâđêôơưĂÂĐÊÔƠƯạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/.test(l), `${ma}/${ten} bước ${k + 1}: còn chữ tiếng Việt`);
      kiemChia(l, `${id} bước ${k + 1} (${ma})`, dongPhuDe(ma));
    });
    soLoiDich++;
  }
}
// Chữ Trung, Nhật, Anh: lời giảng của Bài 1 ở ba thứ tiếng (bản dịch có sẵn).
for (const ma of DS_TIENG_DICH) {
  const tep = `${GOC}src/ngon-ngu/${ma}/he-mat-troi.json`;
  if (!existsSync(tep)) continue;
  const d = JSON.parse(readFileSync(tep, 'utf8'));
  const loi = gom(String(d['bai.baiGiang.buoc.1.noiDung'] || '').replace(/<[^>]+>|\[\[[^\]]*\]\]|\$[^$]*\$|[*>#{}]/g, ' '));
  if (loi) kiemChia(loi, `Bài 1 bước 1 (${ma})`, dongPhuDe(ma));
}
dat(chiaPhuDe('').length === 0, 'lời rỗng phải ra danh sách rỗng');
// Mốc ước tính: tăng dần, khoảng 14 ký tự mỗi giây với chữ Latin, 6 chữ mỗi giây với chữ vuông.
{
  const m = datMocUocTinh(['a'.repeat(28), 'b'.repeat(14)]);
  dat(Math.abs(m[0].t1 - m[0].t0 - 2) < 0.05 && m[1].t0 > m[0].t1, 'mốc ước tính chữ Latin sai');
  const v = datMocUocTinh(['太'.repeat(12)], { vuong: true });
  dat(Math.abs(v[0].t1 - v[0].t0 - 2) < 0.05, 'mốc ước tính chữ vuông sai');
  const tong = datMocUocTinh(['x'.repeat(40), 'y'.repeat(40)], { tong: 10 });
  dat(tong[1].t1 <= 10 && tong[1].t1 > 9, 'dàn theo tổng thời lượng sai');
  dat(cauLucDo(m, m[0].t0 - 0.01) === -1 && cauLucDo(m, m[0].t0 + 0.1) === 0 && cauLucDo(m, m[1].t0 + 0.1) === 1 && cauLucDo(m, 99) === -1, 'cauLucDo sai');
}

// ---------- 2. Mốc phụ đề của các tệp tiếng ----------
const danhSach = JSON.parse(readFileSync(`${GOC}giong-doc/danh-sach.json`, 'utf8'));
let soTepMoc = 0;
const thieuMoc = [];
for (const [giong, muc] of Object.entries(danhSach)) {
  for (const [id, b] of Object.entries(muc.bai || {})) {
    for (const t of b.tep || []) {
      const tep = `${GOC}giong-doc/${t.tep.replace(/\.mp3$/, '.phu-de.json')}`;
      if (!existsSync(tep)) { thieuMoc.push(`${giong}/${id}-${t.buoc}`); continue; }
      const moc = JSON.parse(readFileSync(tep, 'utf8'));
      soTepMoc++;
      const nhan = `${giong}/${id} bước ${t.buoc}`;
      dat(moc.length > 0, `${nhan}: tệp mốc rỗng`);
      for (let i = 0; i < moc.length; i++) {
        dat(moc[i].t1 > moc[i].t0, `${nhan}: câu ${i + 1} có t1 ≤ t0`);
        if (i) dat(moc[i].t0 >= moc[i - 1].t0 + 0.2 && moc[i].t0 >= moc[i - 1].t1 - 1e-6, `${nhan}: câu ${i + 1} chồng lên câu trước`);
        dat(moc[i].t1 <= t.giay + 0.5, `${nhan}: câu ${i + 1} kết thúc sau khi hết tiếng`);
        dat(moc[i].chu.split('\n').length <= 2, `${nhan}: câu ${i + 1} quá 2 dòng`);
      }
      if (DS_LOI[id]) dat(gom(moc.map((m) => m.chu).join(' ')) === gom(DS_LOI[id][t.buoc - 1]), `${nhan}: chữ phụ đề khác lời đọc (lời đã sửa? chạy lại cong-cu/tao-phu-de.py)`);
      dat(moc[0].t0 < 2.5 && moc.at(-1).t1 > t.giay - 3, `${nhan}: phụ đề không phủ hết lời (${moc[0].t0}–${moc.at(-1).t1} trên ${t.giay} giây)`);
    }
  }
}
if (thieuMoc.length) console.log(`  (chưa có mốc phụ đề cho ${thieuMoc.length} tệp tiếng: ${thieuMoc.slice(0, 6).join(', ')}${thieuMoc.length > 6 ? '…' : ''}; trang sẽ dàn phụ đề theo độ dài)`);
console.log(`Xem như video, phần nhanh: ${soPhep} phép đạt (${Object.keys(DS_LOI).length} tệp lời đọc${soLoiDich ? `, ${soLoiDich} tệp lời đọc đã dịch` : ''}, ${soTepMoc} tệp mốc phụ đề).`);

// ---------- 3. Chạy trong Chrome ẩn ----------
const tepHtml = process.argv[2];
if (!tepHtml) process.exit(0);
// Trang tìm tệp tiếng ở thư mục giong-doc/ cạnh tệp HTML (như dist/, app Mac, bản web). Bản dựng ra thư mục riêng
// (build.mjs --ra …) không có thư mục ấy, nên lượt chạy thật (mục 4) báo «không mở được tệp tiếng». Nối tạm một liên
// kết tới giong-doc/ của dự án cho đúng như khi phát hành; xong lượt thì gỡ. Thư mục đã có sẵn thì để nguyên.
const tiengCanhTrang = join(dirname(resolve(tepHtml)), 'giong-doc');
const daCoTieng = (() => { try { lstatSync(tiengCanhTrang); return true; } catch { return false; } })();
const noiTieng = !daCoTieng && existsSync(join(GOC, 'giong-doc', 'danh-sach.json'));
if (noiTieng) symlinkSync(join(GOC, 'giong-doc'), tiengCanhTrang, 'dir');
const goTieng = () => { if (noiTieng) try { unlinkSync(tiengCanhTrang); } catch {} };
process.once('exit', goTieng);
for (const tin of ['SIGINT', 'SIGTERM']) process.once(tin, () => { goTieng(); process.exit(130); });
const { moChrome } = await import('./chrome-an.mjs');
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));
const moc1 = JSON.parse(readFileSync(`${GOC}giong-doc/algieba/he-mat-troi-1.phu-de.json`, 'utf8'));
const c = await moChrome();
const ketQua = [];
const muc = (ten, ok, chiTiet = '') => { ketQua.push({ ten, ok: !!ok, chiTiet }); console.log(`${ok ? '  đạt ' : '  LỖI '} ${ten}${chiTiet ? `  (${chiTiet})` : ''}`); };
async function mo(thamSo, coBai = true) {
  const url = pathToFileURL(resolve(tepHtml));
  url.search = new URLSearchParams(thamSo).toString();
  c.loiTrang = null;
  await c.goi('Page.navigate', { url: 'about:blank' });
  await c.goi('Page.navigate', { url: url.href });
  for (let i = 0; i < 600; i++) {
    if (c.loiTrang) throw Error(c.loiTrang);
    if (await c.doc(`location.href === ${JSON.stringify(url.href)} && !!window.__vt && ${coBai ? '!!window.__vt.canh' : 'true'}`)) return;
    await cho(50);
  }
  throw Error('Không mở được ' + url.href);
}
const phim = async (key, code = key) => {
  const text = key.length === 1 ? key : undefined;
  await c.goi('Input.dispatchKeyEvent', { type: 'keyDown', key, code, text, windowsVirtualKeyCode: key === 'Escape' ? 27 : key === ' ' ? 32 : key === 'ArrowRight' ? 39 : key === 'ArrowLeft' ? 37 : key.toUpperCase().charCodeAt(0) });
  await c.goi('Input.dispatchKeyEvent', { type: 'keyUp', key, code });
};
const tt = () => c.doc('__vt.nghe.trangThai()');
// tien(s): đẩy đồng hồ nghe giảng s giây KHÔNG KỂ thẻ mở đầu bài (nếu thẻ đang hiện thì cho nó qua trước), để các mục
// kiểm về lời và phụ đề không phải biết tới thẻ mở đầu. tienTho(s): đẩy đúng s giây đồng hồ, kể cả lúc thẻ mở đầu đang hiện.
const tien = (s) => c.doc(`(() => { const x = __vt.nghe, md = x.trangThai().moDau; x.tien(${s} + (md > 0 ? md + 0.001 : 0)); return true; })()`);
const tienTho = (s) => c.doc(`__vt.nghe.tien(${s}); true`);
const hop = (sel) => c.doc(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
const chay = (n) => c.doc(`(() => { for (let i = 0; i < ${n}; i++) __vt.buoc(1 / 60); return true; })()`);
const de = (a, b) => !!a && !!b && a.x < b.r - 0.5 && a.r > b.x + 0.5 && a.y < b.b - 0.5 && a.b > b.y + 0.5;
// Phần tính mỗi khung hình (trung vị, mili giây). Đang nghe thì cứ 6 khung (một phần mười giây) đẩy đồng hồ nghe giảng một nhịp.
const doMs = async (soKhung) => c.doc(`(() => { const a = __vt, ds = []; for (let i = 0; i < ${soKhung}; i++) { const t0 = performance.now(); a.buoc(1 / 60); if (a.nghe.dangPhat && i % 6 === 0) a.nghe.tien(0.1); ds.push(performance.now() - t0); } ds.sort((x, y) => x - y); return ds[ds.length >> 1]; })()`);
// Nhãn trên mô hình đang hiện mà đè một phần của việc nghe giảng (phụ đề, thẻ tên bước, thanh phát) hoặc ô số liệu.
const NHAN_DE = `(() => { const ds = __vt.boNhan.trangThai().filter((n) => !n.an); const vung = ['#xv-phu-de', '#xv-the.mo', '#xv-dk', '#hud'].map((q) => document.querySelector(q)).filter((e) => e && !e.hidden && e.textContent && getComputedStyle(e).display !== 'none').map((e) => e.getBoundingClientRect());
  return ds.filter((n) => vung.some((v) => n.x0 < v.right && n.x1 > v.left && n.y0 < v.bottom && n.y1 > v.top)).map((n) => n.chu); })()`;

try {
  for (const [rong, cao] of [[1280, 800], [390, 844]]) {
    const co = `${rong}×${cao}`;
    const dienThoai = rong < 600;
    await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: 1, mobile: dienThoai });
    await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });

    // ===== A. CHỈ CÓ MỘT CÁCH HỌC: nghe giảng ngay ở màn hình học thường =====
    await mo({ lang: 'vi', im: '1', canh: 'he-mat-troi', buoc: '3' });
    await c.doc(`localStorage.clear(); __vt.nghe.batTatTuSang(false); __vt.nghe.batTatPhuDe(true); __vt.nghe.datToc(1); true`);
    const khongCon = await c.doc(`['nut-xem-video', 'nut-chao-video', 'xem-video', 'xv-thoat'].filter((id) => document.getElementById(id))`);
    muc(`${co}: không còn nút hay màn hình riêng «Xem như video»`, khongCon.length === 0, khongCon.join(', '));
    const thanh = await c.doc(`(() => { const W = innerWidth, kq = {}; for (const id of ['gd-phat', 'gd-tu', 'gd-cc', 'gd-toc']) { const e = document.getElementById(id); const r = e?.getBoundingClientRect(); kq[id] = !!r && r.width > 20 && r.left >= 0 && r.right <= W; } return kq; })()`);
    muc(`${co}: thanh «Nghe giảng» trong bảng có nút nghe, tự sang bước, phụ đề, tốc độ`, Object.values(thanh).every(Boolean), JSON.stringify(thanh));
    await chay(120);
    const msThuong = Math.min(await doMs(240), await doMs(240));
    // a) Phím N: lời cất lên NGAY TRONG màn hình thường, bảng bài giảng và thanh trên vẫn còn, phụ đề hiện trên mô hình.
    await phim('n', 'KeyN');
    let s = await tt();
    muc(`${co}: phím N nghe giảng ở bước đang mở (3), bảng bài giảng vẫn còn`, s.dangPhat && s.buoc === 2 && s.coTieng && !s.anBang && !!(await hop('#bai-hoc')) && !!(await hop('#thanh-tren')), JSON.stringify({ dangPhat: s.dangPhat, buoc: s.buoc, coTieng: s.coTieng, anBang: s.anBang }));
    await tien(6);
    await chay(40);
    s = await tt();
    const pdT = await hop('#xv-phu-de'), bangT = await hop('#bai-hoc'), hudT = await hop('#hud'), trenT = await hop('#nut-phai');
    muc(`${co}: đang nghe ở màn hình thường thì có phụ đề`, !!s.phuDe && !!pdT, `«${String(s.phuDe).replace(/\n/g, ' | ')}»`);
    muc(`${co}: phụ đề nằm trong khung 3D, không bị bảng bài giảng che`, pdT && bangT && pdT.x >= 0 && pdT.r <= rong && pdT.b <= cao && !de(pdT, bangT) && (dienThoai ? pdT.b <= bangT.y : pdT.r <= bangT.x), JSON.stringify({ pdT, bangT }));
    muc(`${co}: phụ đề không đè ô số liệu và thanh trên`, pdT && !de(pdT, hudT) && !de(pdT, trenT), JSON.stringify({ pdT, hudT }));
    const deT = await c.doc(NHAN_DE);
    muc(`${co}: màn hình thường: nhãn trên mô hình không đè phụ đề, ô số liệu`, deT.length === 0, deT.join(' | '));
    const thanhNghe = await c.doc(`({ nut: document.getElementById('gd-phat').textContent, gio: document.getElementById('gd-gio').textContent, rong: document.querySelector('#gd-thanh i').style.width })`);
    muc(`${co}: thanh trong bảng chạy theo lời (nút tạm dừng, đồng hồ, vạch tiến độ)`, thanhNghe.nut === '❚❚' && /^0:0[5-7] \/ 0:\d\d$/.test(thanhNghe.gio) && parseFloat(thanhNghe.rong) > 5, JSON.stringify(thanhNghe));
    const msNghe = Math.min(await doMs(240), await doMs(240));
    muc(`${co}: phần tính mỗi khung hình khi đang nghe so với lúc không nghe (màn hình thường, trung vị)`, msNghe < msThuong * 1.3 + 0.3, `không nghe ${msThuong.toFixed(2)} ms; đang nghe ${msNghe.toFixed(2)} ms`);
    // a2) Phím V CHỈ ẩn bảng: cùng bước, lời không ngắt, phụ đề còn nguyên; có thêm thanh phát ở đáy và thẻ tên bước.
    const truocV = await tt();
    await phim('v', 'KeyV');
    await chay(30);
    s = await tt();
    const anBang = await c.doc(`({ lop: document.body.classList.contains('an-bang'), bang: getComputedStyle(document.getElementById('bai-hoc')).pointerEvents, tren: getComputedStyle(document.getElementById('thanh-tren')).display, goiY: getComputedStyle(document.getElementById('goi-y')).display, lech: __vt._lechDich })`);
    muc(`${co}: phím V chỉ ẩn bảng: vẫn bước 3, lời không ngắt, phụ đề còn nguyên`, s.anBang && s.dangPhat && s.buoc === 2 && s.t >= truocV.t && s.t > 5 && s.phuDe === truocV.phuDe, JSON.stringify({ anBang: s.anBang, dangPhat: s.dangPhat, buoc: s.buoc, t: [truocV.t, s.t] }));
    muc(`${co}: bảng ẩn thì mô hình chiếm cả cửa sổ, thanh trên vẫn còn, dòng gợi ý ẩn`, anBang.lop && anBang.bang === 'none' && anBang.tren !== 'none' && anBang.goiY === 'none' && anBang.lech[0] === 0 && anBang.lech[1] === 0, JSON.stringify(anBang));
    const dkV = await hop('#xv-dk');
    muc(`${co}: bảng ẩn thì có thanh phát ở đáy cửa sổ`, dkV && dkV.x <= 0.5 && dkV.r >= rong - 0.5 && dkV.b >= cao - 0.5, JSON.stringify(dkV));
    muc(`${co}: thẻ tên bước hiện «Bài 1 · Bước 3/8»`, /Bài 1 · Bước 3\/8/.test(s.the), s.the);
    const nutDk = await c.doc(`(() => { const W = innerWidth; return [...document.querySelectorAll('#xv-dk .xv-hang button')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => { const r = e.getBoundingClientRect(); return { id: e.id, ok: r.left >= 0 && r.right <= W + 0.5 && r.width >= 30 }; }).filter((n) => !n.ok).map((n) => n.id); })()`);
    muc(`${co}: mọi nút của thanh phát nằm gọn trong cửa sổ`, nutDk.length === 0, nutDk.join(', '));
    await c.doc(`__vt.nghe.phatDung(false); true`);
    await chay(120);
    const msAnThuong = Math.min(await doMs(240), await doMs(240));
    await c.doc(`__vt.nghe.phatDung(true); true`);
    await chay(60);
    const msAnNghe = Math.min(await doMs(240), await doMs(240));
    muc(`${co}: phần tính mỗi khung hình khi bảng ẩn, đang nghe so với không nghe (trung vị)`, msAnNghe < msAnThuong * 1.3 + 0.3, `không nghe ${msAnThuong.toFixed(2)} ms; đang nghe ${msAnNghe.toFixed(2)} ms`);

    // b) Về bước 1 bằng thanh tiến độ của thanh phát, phụ đề đúng câu ở thời điểm t.
    await c.doc(`document.querySelector('#xv-tien button[data-k="0"]').click(); true`);
    s = await tt();
    muc(`${co}: bấm đoạn 1 của thanh tiến độ nhảy về bước 1, nghe tiếp từ đầu`, s.buoc === 0 && s.t === 0 && s.dangPhat, `bước ${s.buoc + 1}`);
    let saiCau = 0, ktCau = [];
    // Điện thoại: câu dài được chia thành các câu ngắn hơn (vẫn tối đa hai dòng), nên chữ đang hiện là một phần của câu gốc.
    const giong = (p, chuan) => (dienThoai ? !!p && gom(chuan).includes(gom(p)) : gom(p) === gom(chuan));
    for (const i of [0, 3, 7, moc1.length - 1]) {
      const t = (moc1[i].t0 + Math.min(moc1[i].t1, moc1[i].t0 + 0.8)) / 2;
      await tien(t - (await tt()).t);
      const p = (await tt()).phuDe;
      if (!giong(p, moc1[i].chu)) { saiCau++; ktCau.push(`t=${t.toFixed(2)}: «${p}»`); }
      if (i !== 3) continue;
      // c) Ở một câu hai dòng: phụ đề trong khung, không đè thanh phát, tối đa 2 dòng, chữ ≥ 18 px.
      await c.doc(`__vt.nghe._hienDieuKhien(true); true`);
      await chay(20);
      const pd = await hop('#xv-phu-de'), dk = await hop('#xv-tien');
      const cao1 = await c.doc(`parseFloat(getComputedStyle(document.getElementById('xv-phu-de')).lineHeight)`);
      const soDong = pd ? Math.round(pd.h / cao1) : 0;
      muc(`${co}: bảng ẩn: phụ đề nằm trong khung, không đè thanh phát`, pd && pd.x >= 0 && pd.r <= rong && dk && pd.b <= dk.y + 1, JSON.stringify({ pd, dk }));
      muc(`${co}: phụ đề hiện tối đa 2 dòng, cỡ chữ ≥ 18 px`, soDong >= (dienThoai ? 1 : 2) && soDong <= 2 && cao1 / 1.32 >= 17.9, `${soDong} dòng, cỡ ${(cao1 / 1.32).toFixed(1)} px, «${p.replace(/\n/g, ' | ')}»`);
    }
    muc(`${co}: phụ đề đúng câu ở 4 thời điểm của bước 1`, saiCau === 0, ktCau.join(' | '));
    // d0) «Tự sang bước» đang tắt: hết lời thì dừng ở bước đó, phụ đề tắt, mô hình vẫn chạy.
    s = await tt();
    await tien(s.dai - s.t + 2.5);
    s = await tt();
    muc(`${co}: «Tự sang bước» tắt: hết lời thì dừng ở bước đang nghe, mô hình vẫn chạy`, s.buoc === 0 && !s.dangPhat && !s.tamDung && !s.phuDe && (await c.doc('__vt.dangChay')) === true, JSON.stringify({ buoc: s.buoc, dangPhat: s.dangPhat, phuDe: s.phuDe }));
    // d) Bật «Tự sang bước» (nút trên thanh phát; nút trong bảng đổi theo vì là cùng một trạng thái): hết lời nghỉ khoảng
    //    một giây rồi tự sang bước sau và đọc tiếp.
    await c.doc(`document.getElementById('xv-tu').click(); true`);
    const tuSang = await c.doc(`({ bat: __vt.nghe.tuSang, bang: document.getElementById('gd-tu').classList.contains('bat'), day: document.getElementById('xv-tu').classList.contains('bat') })`);
    muc(`${co}: bật «Tự sang bước» ở thanh phát thì nút trong bảng cũng bật (một trạng thái)`, tuSang.bat && tuSang.bang && tuSang.day, JSON.stringify(tuSang));
    await phim('n', 'KeyN');
    s = await tt();
    await tien(s.dai - s.t + 0.5);
    const giua = await tt();
    await tien(0.7);
    s = await tt();
    muc(`${co}: hết lời thì nghỉ rồi tự sang bước 2 và đọc tiếp`, giua.buoc === 0 && s.buoc === 1 && s.dangPhat, `sau 0,5 giây: bước ${giua.buoc + 1}; sau 1,2 giây: bước ${s.buoc + 1}`);
    // e) Tạm dừng bằng phím cách: đồng hồ đứng, mô hình cũng đứng.
    await tien(2);
    await phim(' ', 'Space');
    const t1 = (await tt()).t;
    await tien(4);
    s = await tt();
    muc(`${co}: phím cách tạm dừng (đồng hồ đứng yên)`, !s.dangPhat && s.tamDung && s.t === t1 && t1 > 1, `t ${t1} → ${s.t}`);
    muc(`${co}: tạm dừng thì mô hình cũng đứng, phát lại thì chạy tiếp`, (await c.doc('__vt.dangChay')) === false);
    await phim(' ', 'Space');
    s = await tt();
    muc(`${co}: phát lại thì mô hình chạy tiếp, lời đi tiếp từ chỗ dừng`, (await c.doc('__vt.dangChay')) === true && s.dangPhat && s.t === t1, `t ${s.t}`);
    // f) Đổi tốc độ: 1,25× thì 2 giây đồng hồ là 2,5 giây lời.
    await c.doc(`document.getElementById('xv-toc').click(); true`);
    const t2 = (await tt()).t;
    await tien(2);
    s = await tt();
    const chuToc = await c.doc(`document.getElementById('xv-toc').textContent + ' ' + document.getElementById('gd-toc').textContent`);
    muc(`${co}: đổi tốc độ 1,25×`, s.toc === 1.25 && Math.abs(s.t - t2 - 2.5) < 0.06 && chuToc === '1,25× 1,25×', `t tăng ${(s.t - t2).toFixed(2)}, nút «${chuToc}»`);
    await c.doc(`document.getElementById('xv-toc').click(); document.getElementById('xv-toc').click(); true`);
    // g) Phím C tắt phụ đề, bấm lại thì bật.
    await phim('c', 'KeyC');
    s = await tt();
    const tat = s.phuDe === null;
    await phim('c', 'KeyC');
    muc(`${co}: phím C tắt rồi bật phụ đề`, tat && (await tt()).phuDeBat);
    // h) Phím → sang bước (nghe tiếp), ← khi đã nghe quá 3 giây thì về đầu bước.
    await phim('ArrowRight', 'ArrowRight');
    const b3 = await tt();
    await tien(4);
    await phim('ArrowLeft', 'ArrowLeft');
    s = await tt();
    muc(`${co}: phím → sang bước và nghe tiếp, ← về đầu bước`, b3.buoc === 2 && b3.dangPhat && s.buoc === 2 && s.t < 0.2, `→ bước ${b3.buoc + 1}, ← bước ${s.buoc + 1} t=${s.t}`);
    // h2) Phím số nhảy tới bước; phím . và , đổi tốc độ; đang nghe mà sang bước thì máy quay bay tới (không nhảy cụp).
    await phim('5', 'Digit5');
    s = await tt();
    const dangBay = await c.doc('!!__vt._bay');
    muc(`${co}: phím số 5 nhảy tới bước 5`, s.buoc === 4 && s.t === 0, `bước ${s.buoc + 1}`);
    muc(`${co}: sang bước thì máy quay bay tới góc mới`, dangBay, `đang bay: ${dangBay}`);
    await phim('.', 'Period');
    const nhanh = (await tt()).toc;
    await phim(',', 'Comma');
    await phim(',', 'Comma');
    const cham = (await tt()).toc;
    await phim('.', 'Period');
    muc(`${co}: phím . nhanh hơn, phím , chậm hơn`, nhanh === 1.25 && cham === 0.75 && (await tt()).toc === 1, `. → ${nhanh}, , , → ${cham}`);
    // i) Hết bài: thẻ «Bài tiếp theo», đếm 5 giây rồi sang Bài 2 (theo thứ tự hiển thị).
    await c.doc(`document.querySelector('#xv-tien button[data-k="7"]').click(); true`);
    s = await tt();
    await tien(s.dai + 1.2);
    s = await tt();
    const het = await c.doc(`document.getElementById('xv-het').hidden ? '' : document.getElementById('xv-het').innerText`);
    muc(`${co}: hết bài hiện thẻ bài tiếp theo, có nút Xem tiếp và Dừng`, s.het && /Bài tiếp theo/i.test(het) && /Xem tiếp/.test(het) && /Dừng/.test(het), het.replace(/\s+/g, ' ').slice(0, 120));
    const hopHet = await hop('#xv-het');
    muc(`${co}: thẻ hết bài nằm gọn trong khung`, hopHet && hopHet.x >= 0 && hopHet.r <= rong && hopHet.y >= 0 && hopHet.b <= cao, JSON.stringify(hopHet));
    await tien(5.3);
    s = await tt();
    // Đầu bài mới (bảng đang ẩn): thẻ mở đầu («Phần · Bài · tên bài») hiện vài giây, lời chưa chạy; hết thẻ thì thẻ tên bước hiện.
    muc(`${co}: đầu bài có thẻ mở đầu, lời chưa chạy`, s.moDau > 1 && /Bài 2/.test(s.theMoDau) && s.t === 0 && !s.the, JSON.stringify({ moDau: s.moDau, the: s.theMoDau.slice(0, 60) }));
    const hopMoDau = await hop('#xv-mo-dau');
    muc(`${co}: thẻ mở đầu nằm gọn trong khung`, hopMoDau && hopMoDau.x >= 0 && hopMoDau.r <= rong && hopMoDau.y >= 0 && hopMoDau.b <= cao, JSON.stringify(hopMoDau));
    await tienTho(s.moDau + 0.05);
    const sauMoDau = await tt();
    muc(`${co}: hết thẻ mở đầu thì thẻ tên bước hiện`, sauMoDau.moDau === 0 && !sauMoDau.theMoDau && /Bài 2 · Bước 1/.test(sauMoDau.the), JSON.stringify({ moDau: sauMoDau.moDau, the: sauMoDau.the }));
    muc(`${co}: đếm 5 giây rồi tự sang bài sau, bước 1, vẫn đang nghe`, !s.het && s.bai === 1 && s.buoc === 0 && s.dangPhat, `bài thứ ${s.bai + 1}, bước ${s.buoc + 1}`);
    // Bài chưa có giọng đọc: vẫn chạy, có dòng báo, phụ đề lấy từ lời đọc hoặc lời giảng.
    // Bài sau có thể đã có giọng (Bài 2 có tiếng từ 16/11/2026): khi đó nhảy sang bài đầu tiên chưa có giọng theo thứ tự hiển thị.
    const baiKhongTieng = await c.doc(`(() => { const a = __vt, cu = a.chiSo; let j = -1;
      for (let i = 0; i < a.dsCanh.length; i++) { a.chiSo = i; if (!a._gdTep(0)) { j = i; break; } }
      a.chiSo = cu;
      if (j > 0 && a._gdTep(0)) { a.chiSo = j - 1; a.nghe._xemTiep(); }
      return j; })()`);
    // Khi mọi bài đã có giọng: đường không tiếng vẫn được kiểm ở mục tiếng Anh (k) bên dưới.
    if (baiKhongTieng > 0) {
      await tien(1.5);
      s = await tt();
      muc(`${co}: bài chưa có giọng (bài thứ ${baiKhongTieng + 1}) vẫn chạy, có phụ đề và dòng báo`, !s.coTieng && s.phuDe && s.bao && s.t > 1.4, `phụ đề «${String(s.phuDe).slice(0, 50)}», báo «${s.bao}»`);
      await c.doc(`__vt.nghe._hienDieuKhien(true); true`);
      await chay(20);
      const pd2 = await hop('#xv-phu-de'), bao = await hop('#xv-bao');
      muc(`${co}: dòng báo không đè phụ đề`, pd2 && bao && pd2.b <= bao.y + 1 && bao.r <= rong, JSON.stringify({ pd2, bao }));
    }
    await tien(2);
    // n) Bảng ẩn: nhãn trên mô hình không nằm đè phụ đề, thẻ tên bước, thanh phát, ô số liệu.
    await c.doc(`__vt.nghe._hienDieuKhien(true); true`);
    await chay(40);
    const deAn = await c.doc(NHAN_DE);
    muc(`${co}: bảng ẩn: nhãn trên mô hình không đè phụ đề, thẻ tên bước, thanh phát, ô số liệu`, deAn.length === 0, deAn.join(' | '));
    // j) Esc hiện lại bảng: đúng bài, đúng bước, lời VẪN chạy tiếp (không phải thoát một chế độ), phụ đề về lại phần trống.
    const dangXem = await tt();
    await phim('Escape', 'Escape');
    await cho(450);                  // bảng trượt vào, phụ đề dời chỗ: chờ hết hiệu ứng chuyển rồi mới đo
    await chay(30);
    s = await tt();
    const sau = await c.doc(`({ bang: getComputedStyle(document.getElementById('bai-hoc')).pointerEvents, lop: document.body.className, so: document.getElementById('buoc-so').textContent, dk: getComputedStyle(document.getElementById('xv-dk')).display })`);
    muc(`${co}: Esc hiện lại bảng bài giảng đúng bước, lời vẫn chạy tiếp`, !s.anBang && s.dangPhat && sau.bang !== 'none' && !/an-bang|xv-an-dk|xv-co-the/.test(sau.lop) && sau.dk === 'none' && s.bai === dangXem.bai && s.buoc === dangXem.buoc && s.t >= dangXem.t, JSON.stringify({ ...sau, t: [dangXem.t, s.t] }));
    const pdSau = await hop('#xv-phu-de'), bangSau = await hop('#bai-hoc');
    muc(`${co}: bảng hiện lại thì phụ đề lại nằm ngoài bảng`, !!pdSau && !de(pdSau, bangSau), JSON.stringify({ pdSau, bangSau }));
    await phim('n', 'KeyN');
    const loi = await c.doc('__vt.loiGhi.slice(0, 3)');
    muc(`${co}: không có lỗi trong cảnh suốt lượt`, !loi.length && !c.loiTrang && !(await tt()).dangPhat, loi.join(' | ') || c.loiTrang || '');

    // k) Tiếng Anh (chưa có giọng): phụ đề lấy từ lời giảng tiếng Anh, có dòng báo (ở thanh trong bảng).
    await c.goi('Emulation.setLocaleOverride', { locale: 'en' });
    await mo({ lang: 'en', im: '1', canh: 'he-mat-troi' });
    await c.doc(`document.getElementById('gd-phat').click(); true`);
    await tien(1.5);
    s = await tt();
    const baoBang = await c.doc(`(() => { const e = document.getElementById('gd-bao'); return e && !e.hidden ? e.textContent : ''; })()`);
    muc(`${co}: tiếng Anh: không tiếng, phụ đề tiếng Anh, dòng báo tiếng Anh ngay trong bảng`, s.dangPhat && !s.coTieng && /[a-z]/.test(s.phuDe || '') && !/[ăâđêôơư]/i.test(s.phuDe || '') && /narration/i.test(s.bao) && /narration/i.test(baoBang), `«${String(s.phuDe).slice(0, 60)}» · «${baoBang}»`);
    // Phụ đề lấy từ lời giảng: công thức trong dòng phải thành chữ đọc được. Bước 5 của Bài 1 có hai gạch đầu dòng mở đầu
    // bằng công thức («$\vec V$ is the same…»); trước bản 3.7 công thức bị bỏ trống nên câu mất chủ ngữ.
    const cauEn = await c.doc(`(() => { __vt.moBuoc(4); return __vt.nghe._b.mocGoc.map((m) => m.chu.replace(/\\n/g, ' ')); })()`);
    const cauHong = cauEn.filter((t) => /^\s*[:：,，;；.。)）]/.test(t) || /^(is|follows)\b/.test(t) || /[;；,，][.。]$/.test(t) || /[:：]\s*\S{1,12}[:：]$/.test(t));
    muc(`${co}: tiếng Anh, bước có công thức trong dòng: phụ đề giữ chữ của công thức, không câu nào mất chủ ngữ`,
      cauEn.length > 3 && !cauHong.length && cauEn.some((t) => /\bV is the same\b/.test(t)), cauHong.join(' | ') || cauEn.slice(0, 4).join(' | '));
    await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });
    // l) Màn hình chào: nút lớn «Bắt đầu học có giọng đọc» cạnh «Bắt đầu học»; bấm là vào bài, tự phát, tự sang bước.
    await mo({ lang: 'vi', im: '1' }, false);
    await c.doc(`localStorage.removeItem('vu-tru-3d.tu-sang-buoc'); true`);
    const nutChao = await hop('#nut-chao-nghe'), nutHoc = await hop('#nut-bat-dau');
    const chuChao = await c.doc(`document.getElementById('nut-chao-nghe')?.textContent || ''`);
    muc(`${co}: màn hình chào có nút «Bắt đầu học có giọng đọc» cạnh «Bắt đầu học», thấy ngay`, nutChao && nutHoc && nutChao.r <= rong && nutChao.x >= 0 && nutChao.b <= cao && nutChao.h >= 40 && /có giọng đọc/.test(chuChao), `${chuChao} ${JSON.stringify(nutChao)}`);
    await c.doc(`document.getElementById('nut-chao-nghe').click(); true`);
    for (let i = 0; i < 40 && !(await c.doc('!!__vt.canh')); i++) await cho(50);
    s = await tt();
    muc(`${co}: bấm nút đó là vào bài, lời tự phát, tự sang bước, bảng bài giảng vẫn hiện`, s.dangPhat && s.tuSang && !s.anBang && s.buoc === 0 && !(await c.doc(`document.body.classList.contains('dang-chao')`)), JSON.stringify({ dangPhat: s.dangPhat, tuSang: s.tuSang, anBang: s.anBang, buoc: s.buoc }));
    await tien(s.dai + 1.3);
    s = await tt();
    muc(`${co}: vào bằng nút đó thì hết lời bước 1 tự sang bước 2`, s.buoc === 1 && s.dangPhat, `bước ${s.buoc + 1}`);
    // m) Đường dẫn ?nghe=1 vào thẳng bài và nghe luôn; ?xem=1 (đường dẫn của bản 3.7) thì ẩn thêm bảng.
    await mo({ lang: 'vi', im: '1', canh: 'ngan-ha', nghe: '1' });
    s = await tt();
    muc(`${co}: đường dẫn ?nghe=1 vào thẳng bài được chọn và nghe luôn`, s.dangPhat && !s.anBang && s.bai === 1 && s.buoc === 0 && !(await c.doc(`!!document.getElementById('chao')`)), JSON.stringify({ dangPhat: s.dangPhat, bai: s.bai }));
    await mo({ lang: 'vi', im: '1', canh: 'ngan-ha', xem: '1' });
    s = await tt();
    muc(`${co}: đường dẫn cũ ?xem=1 vẫn dùng được: nghe luôn, bảng ẩn sẵn`, s.dangPhat && s.anBang && s.bai === 1 && s.buoc === 0, JSON.stringify({ dangPhat: s.dangPhat, anBang: s.anBang, bai: s.bai }));
    await c.doc(`localStorage.clear(); true`);
  }
  // ---------- 4. Lượt chạy THẬT, tiếng câm ----------
  // Các mục trên chạy im lặng (đồng hồ do bộ kiểm đẩy, đổi bài tức thì). Đoạn này chạy như người học thật: nhịp riêng của
  // phần nghe giảng, tệp tiếng phát thật nhưng câm, đổi bài qua màn tối và chờ cảnh mới làm nóng xong. Mất chừng 20 giây.
  await c.goi('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await c.goi('Emulation.setLocaleOverride', { locale: 'vi' });
  const { identifier: maThat } = await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__VT_THU = { tiengCam: true };' });
  const choToi = async (bieuThuc, ms = 8000) => { for (let i = 0; i < ms / 100; i++) { if (await c.doc(bieuThuc)) return true; await cho(100); } return false; };
  {
    const url = pathToFileURL(resolve(tepHtml));
    url.search = new URLSearchParams({ lang: 'vi', canh: 'he-mat-troi', buoc: '8' }).toString();
    c.loiTrang = null;
    await c.goi('Page.navigate', { url: 'about:blank' });
    await c.goi('Page.navigate', { url: url.href });
    const nap = await choToi(`!!window.__vt?.canh && !__vt._nong && !__vt.imLang`, 30000);
    muc('chạy thật: trang mở ở màn hình thường (không im lặng), cảnh đã làm nóng xong', nap, c.loiTrang || '');
    // Gọi nghe bằng mã (không có lần bấm nào của người dùng, như khi mở đường dẫn ?nghe=1): trình duyệt chặn tự phát
    // tiếng, lời phải tạm dừng và mời bấm ▶ ngay trong bảng chứ không chạy phụ đề suông.
    await c.doc('__vt.nghe.batDau({ tuSang: false }); true');
    const chan = await choToi(`(() => { const s = __vt.nghe.trangThai(); return !s.dangPhat && /▶/.test(s.bao || ''); })()`, 4000);
    let s = await tt();
    const baoBang = await c.doc(`(() => { const e = document.getElementById('gd-bao'); return e && !e.hidden ? e.textContent : ''; })()`);
    muc('chạy thật: chưa có lần bấm nào thì trình duyệt chặn tiếng, lời tạm dừng và mời bấm ▶ (ngay trong bảng)', chan && !s.anBang && s.buoc === 7 && s.coTieng && s.t === 0 && /▶/.test(baoBang) && (await c.doc('__vt.dangChay')) === true, JSON.stringify({ dangPhat: s.dangPhat, t: s.t, bao: baoBang }));
    // Lần BẤM NGHE đầu tiên (bấm thật vào nút ▶ của bảng) là thao tác cho phép phát tiếng: tệp tiếng chạy (câm), đồng hồ
    // đi theo nó, phụ đề hiện trên mô hình.
    const bamVao = async (x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await c.goi('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
    const nutNghe = await hop('#gd-phat');
    await bamVao(nutNghe.x + nutNghe.w / 2, nutNghe.y + nutNghe.h / 2);
    const chayLoi = await choToi(`__vt.nghe.trangThai().t > 0.4`, 6000);
    s = await tt();
    muc('chạy thật: lần bấm nghe đầu tiên cho phép phát tiếng, đồng hồ tự chạy theo tệp tiếng (câm)', chayLoi && s.dangPhat && !s.bao && !s.anBang, JSON.stringify({ t: s.t, dangPhat: s.dangPhat, bao: s.bao }));
    const coPd = await choToi(`!!__vt.nghe.trangThai().phuDe`, 6000);
    const pd = await hop('#xv-phu-de'), bang = await hop('#bai-hoc');
    muc('chạy thật: đang nghe ở màn hình thường thì phụ đề hiện trên mô hình, ngoài bảng bài giảng', coPd && pd && bang && pd.r <= bang.x && pd.x >= 0, JSON.stringify({ pd, bang }));
    // Ẩn bảng bằng phím V: lời không ngắt. Rồi bấm vào mô hình: tạm dừng (mô hình đứng); bấm lần nữa: chạy tiếp.
    const tTruoc = (await tt()).t;
    await phim('v', 'KeyV');
    await cho(300);
    s = await tt();
    muc('chạy thật: phím V ẩn bảng, lời vẫn chạy tiếp', s.anBang && s.dangPhat && s.t >= tTruoc, JSON.stringify({ anBang: s.anBang, t: [tTruoc, s.t] }));
    const bam = () => bamVao(640, 330);
    await bam();
    const dung = await c.doc(`({ dangPhat: __vt.nghe.dangPhat, dangChay: __vt.dangChay })`);
    await bam();
    const tiep = await c.doc(`({ dangPhat: __vt.nghe.dangPhat, dangChay: __vt.dangChay })`);
    muc('chạy thật: bảng ẩn: bấm vào mô hình thì tạm dừng, bấm lần nữa thì chạy tiếp', dung.dangPhat === false && dung.dangChay === false && tiep.dangPhat === true && tiep.dangChay === true, JSON.stringify({ dung, tiep }));
    // ⇧→ sang bài sau lúc đang nghe: màn tối phủ lên, cảnh mới dựng xong mới mở màn, có thẻ mở đầu.
    await c.goi('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, modifiers: 8 });
    await c.goi('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', modifiers: 8 });
    s = await tt();
    muc('chạy thật: ⇧→ đổi bài lúc đang nghe thì màn tối phủ lên trước', s.man === true && s.bai === 0, JSON.stringify({ man: s.man, bai: s.bai }));
    const moMan = await choToi(`(() => { const s = __vt.nghe.trangThai(); return !s.man && s.bai === 1 && s.buoc === 0 && !__vt._nong; })()`, 20000);
    s = await tt();
    muc('chạy thật: cảnh mới dựng xong thì mở màn ở bước 1 của bài sau, có thẻ mở đầu', moMan && s.dangPhat && (s.moDau > 0 || /Bài 2/.test(s.the)), JSON.stringify({ man: s.man, bai: s.bai, buoc: s.buoc, moDau: s.moDau, the: (s.theMoDau || s.the).slice(0, 50) }));
    const loi = await choToi(`(() => { const s = __vt.nghe.trangThai(); return s.moDau === 0 && s.t > 0.5 && !!s.phuDe; })()`, 12000);
    s = await tt();
    muc('chạy thật: hết thẻ mở đầu thì lời bài mới cất lên, phụ đề chạy', loi && s.dangPhat, JSON.stringify({ moDau: s.moDau, t: s.t, phuDe: String(s.phuDe).slice(0, 40) }));
    await phim('Escape', 'Escape');
    await cho(200);
    const ra = await c.doc(`({ tt: __vt.nghe.trangThai(), lop: document.body.className, loi: __vt.loiGhi.slice(0, 3), dangChay: __vt.dangChay })`);
    muc('chạy thật: Esc hiện lại bảng, lời vẫn chạy, không còn lớp của lúc ẩn bảng trên thân trang, không lỗi', !ra.tt.anBang && ra.tt.dangPhat && !/an-bang|xv-an-dk|xv-co-the|xv-dang-mo-dau|xv-dang-xem/.test(ra.lop) && !ra.loi.length && ra.dangChay && !c.loiTrang, JSON.stringify({ lop: ra.lop, loi: ra.loi, dangPhat: ra.tt.dangPhat }));
  }
  await c.goi('Page.removeScriptToEvaluateOnNewDocument', { identifier: maThat });
} finally {
  await c.dong();
}
const hong = ketQua.filter((k) => !k.ok).length;
console.log(`Nghe giảng có phụ đề, phần Chrome: ${ketQua.length - hong}/${ketQua.length} mục đạt.`);
process.exit(hong ? 1 : 0);
