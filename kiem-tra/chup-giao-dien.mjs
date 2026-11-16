// Chụp bộ ảnh GIAO DIỆN (không phải ảnh từng bước của mô hình) để soát thiết kế: màn hình chào, thanh trên, bảng bài
// giảng (ba thẻ), sổ tay, mục lục, bảng tiếng và hình, thanh nghe giảng, hộp thử thách, dòng «Đang dựng mô hình 3D»,
// lúc nghe giảng có phụ đề (--man nghe).
// Chrome chạy ẩn, tắt tiếng, không mở cửa sổ. Lệnh nặng: chạy qua kiem-tra/co-khoa.sh.
//
//   node kiem-tra/chup-giao-dien.mjs <tệp HTML> <thư mục ra> [--tieng vi,en,zh-CN,ja] [--co 1600x1000,1280x800]
//                                    [--man chao,muc-luc] [--net 2] [--bai he-mat-troi] [--khong-ghep]
//
// Mỗi cỡ, mỗi tiếng một thư mục con; tên ảnh đọc là hiểu. Cuối lượt ghép mỗi thư mục thành một tấm tổng hợp để xem nhanh.
// --man lọc theo mã màn hình (xem bảng MAN bên dưới); --net 2 chụp nét gấp đôi như màn hình Retina.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moChrome } from './chrome-an.mjs';

const thamSo = process.argv.slice(2);
const [tepHtml, thuMucRa] = thamSo;
if (!tepHtml || !thuMucRa || tepHtml.startsWith('--') || thuMucRa.startsWith('--')) {
  throw Error('Dùng: node kiem-tra/chup-giao-dien.mjs <tệp HTML> <thư mục ra> [--tieng …] [--co …] [--man …] [--net 2]');
}
const lay = (co, macDinh) => { const i = thamSo.indexOf(co); return i >= 0 && thamSo[i + 1] ? thamSo[i + 1] : macDinh; };
const TEN_TIENG = { vi: 'Tiếng Việt', en: 'Tiếng Anh', 'zh-CN': 'Tiếng Trung', ja: 'Tiếng Nhật' };
const dsTieng = lay('--tieng', 'vi,en,zh-CN,ja').split(',').filter((m) => TEN_TIENG[m]);
const dsCo = lay('--co', '1600x1000,1280x800').split(',').map((s) => s.split('x').map(Number)).filter((c) => c[0] > 0 && c[1] > 0);
const chiMan = lay('--man', '').split(',').filter(Boolean);
const doNet = Number(lay('--net', '1')) || 1;
const baiChinh = lay('--bai', 'he-mat-troi');
const ghep = !thamSo.includes('--khong-ghep');
const cho = (ms) => new Promise((xong) => setTimeout(xong, ms));

// Chèn vào trang trước khi nạp: im lặng tuyệt đối, khoá đồng hồ và số ngẫu nhiên (hai lượt chụp ra cùng một hình),
// tắt hiệu ứng chuyển để ảnh luôn là trạng thái cuối, và đặt sẵn tiến độ học (nếu có) vào bộ nhớ của trang.
function chuanBi(luu) {
  window.__VT_IM_LANG = true;
  window.__mocAnh = 0;
  const moc = Date.UTC(2026, 0, 1);
  Date.now = () => moc + window.__mocAnh;
  Object.defineProperty(performance, 'now', { value: () => window.__mocAnh });
  let hat = 1403;
  Math.random = () => ((hat = (Math.imul(hat, 1664525) + 1013904223) >>> 0) / 4294967296);
  window.requestAnimationFrame = () => 0;
  try { localStorage.clear(); for (const k in luu) localStorage.setItem(k, luu[k]); } catch { /* không có bộ nhớ: bỏ qua */ }
  document.addEventListener('DOMContentLoaded', () => {
    const css = document.createElement('style');
    css.textContent = '*,*::before,*::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }';
    document.head.append(css);
  });
}

// Tiến độ giả của một người đã học dở: hai bài xong, vài thử thách đạt, đang ở Bài 15.
const DA_HOC = {
  'vu-tru-3d.bai': 'lo-den',
  'vu-tru-3d.da-hoc': 'he-mat-troi,ngan-ha',
  'vu-tru-3d.thu-thach': 'he-mat-troi:1,he-mat-troi:2,he-mat-troi:3,he-mat-troi:4,he-mat-troi:5,he-mat-troi:6,he-mat-troi:7,he-mat-troi:8,ngan-ha:2',
};

const CHAY = (n) => `for (let i = 0; i < ${n}; i++) { window.__mocAnh += 1000 / 60; __vt.buoc(1 / 60); }`;
const BUOC_TT = `(() => { const k = __vt._dsBuoc().findIndex((b) => b.thuThach); return k; })()`;

// Bảng màn hình: ma (để lọc), ten (tên tệp), mo (tham số đường dẫn), luu (tiến độ đặt sẵn), lam (mã chạy trong trang trước khi chụp),
// re (bộ chọn phần tử để rê chuột vào), khongRe (không rê chuột: rê là thanh phát hiện lại), cat (bộ chọn phần tử để chụp cận cảnh nét gấp đôi), chiTieng (chỉ chụp ở các tiếng này).
const MAN = [
  { ma: 'chao', ten: '01 - Màn hình chào', mo: {}, lam: CHAY(90) },
  { ma: 'chao', ten: '02 - Màn hình chào - rê vào một bài', mo: {}, lam: CHAY(90), re: '#chao .ct-bai[data-bai="5"]' },
  { ma: 'chao-hoc-tiep', ten: '03 - Màn hình chào - người đang học dở', mo: {}, luu: DA_HOC, lam: CHAY(90) },
  { ma: 'bai-giang', ten: '04 - Bài giảng - bước 1', mo: { canh: baiChinh, goiy: '1' }, lam: CHAY(300) },
  { ma: 'thanh-tren', ten: '05 - Thanh trên (cận cảnh)', mo: { canh: baiChinh }, lam: CHAY(300), cat: '#thanh-tren', le: 12 },
  { ma: 'nghe-giang', ten: '06 - Thanh nghe giảng (cận cảnh)', mo: { canh: baiChinh }, lam: CHAY(300), cat: '#giong-doc', le: 14, chiTieng: ['vi'] },
  { ma: 'bai-giang-cuoi', ten: '07 - Bài giảng - cuối bước, nút chuyển bước và điều khiển', mo: { canh: baiChinh }, lam: `${CHAY(300)} document.getElementById('bai-hoc-cuon').scrollTop = 1e6;` },
  { ma: 'bai-giang-giua', ten: '08 - Bài giảng - giữa bước (hộp, công thức, đi sâu)', mo: { canh: baiChinh, buoc: 4 }, lam: `${CHAY(300)} for (const d of document.querySelectorAll('#buoc-noi-dung details')) d.open = true; document.getElementById('bai-hoc-cuon').scrollTop = 420;` },
  { ma: 'tom-tat', ten: '09 - Thẻ Tóm tắt', mo: { canh: baiChinh }, lam: `${CHAY(300)} __vt.moTab('tom');` },
  { ma: 'tom-tat-cuoi', ten: '10 - Thẻ Tóm tắt - phần dưới', mo: { canh: baiChinh }, lam: `${CHAY(300)} __vt.moTab('tom'); document.getElementById('bai-hoc-cuon').scrollTop = 700;` },
  {
    ma: 'tu-kiem', ten: '11 - Thẻ Tự kiểm', mo: { canh: baiChinh },
    lam: `${CHAY(300)} __vt.moTab('hoi'); (() => { const ds = [...document.querySelectorAll('.ch[data-dung]')];
      if (ds[0]) { const d = Number(ds[0].dataset.dung); const nut = ds[0].querySelectorAll('.ch-chon button'); nut[(d + 1) % nut.length].click(); }
      if (ds[1]) { const d = Number(ds[1].dataset.dung); ds[1].querySelectorAll('.ch-chon button')[d].click(); } })();`,
  },
  { ma: 'muc-luc', ten: '12 - Mục lục', mo: { canh: baiChinh }, luu: DA_HOC, lam: `${CHAY(300)} __vt.el.mucLuc.hidden = false;` },
  { ma: 'muc-luc', ten: '13 - Mục lục - rê vào một bài', mo: { canh: baiChinh }, luu: DA_HOC, lam: `${CHAY(300)} __vt.el.mucLuc.hidden = false;`, re: '#muc-luc button[data-i="2"]' },
  { ma: 'muc-luc-cuoi', ten: '14 - Mục lục - cuộn xuống cuối', mo: { canh: baiChinh }, luu: DA_HOC, lam: `${CHAY(300)} __vt.el.mucLuc.hidden = false; __vt.el.mucLuc.scrollTop = 1e6;` },
  { ma: 'so-tay', ten: '15 - Sổ tay - thuật ngữ', mo: { canh: baiChinh }, lam: `${CHAY(300)} __vt.moThuatNgu(); document.activeElement?.blur?.();` },
  { ma: 'so-tay-cong-thuc', ten: '16 - Sổ tay - công thức', mo: { canh: baiChinh }, lam: `${CHAY(300)} __vt.moThuatNgu('', 'ct'); document.activeElement?.blur?.();` },
  { ma: 'bang-tieng', ten: '17 - Bảng tiếng và hình', mo: { canh: baiChinh }, lam: `${CHAY(300)} __vt.moBangTieng(true);` },
  {
    ma: 'thu-thach', ten: '18 - Hộp thử thách - chưa đạt', mo: { canh: baiChinh },
    lam: `__vt.moBuoc(${BUOC_TT}); ${CHAY(300)} document.getElementById('tt-nut-goi-y')?.click(); document.getElementById('thu-thach')?.scrollIntoView({ block: 'center' });`,
  },
  {
    ma: 'thu-thach', ten: '19 - Hộp thử thách - đã đạt', mo: { canh: baiChinh }, luu: DA_HOC,
    lam: `__vt.moBuoc(${BUOC_TT}); ${CHAY(300)} document.getElementById('thu-thach')?.scrollIntoView({ block: 'center' });`,
  },
  {
    ma: 'dang-dung', ten: '20 - Dòng Đang dựng mô hình 3D', mo: { canh: baiChinh },
    lam: `${CHAY(10)} (() => { const d = document.getElementById('dang-dung'), b = document.getElementById('bai-hoc');
      d.hidden = false; d.lastElementChild.textContent = '42%'; d.style.left = Math.round((innerWidth - b.offsetWidth) / 2) + 'px';
      __vt.renderer.domElement.style.visibility = 'hidden';
      for (const id of ['lop-nhan', 'hud']) document.getElementById(id).style.visibility = 'hidden';
      for (const e of document.querySelectorAll('.vt-lop')) e.style.visibility = 'hidden'; })();`,
  },
  { ma: 'an-bang', ten: '21 - Ẩn bài giảng, chỉ còn mô hình', mo: { canh: baiChinh }, lam: `__vt.anHienBang(true); ${CHAY(300)}` },
  { ma: 'luong-tu', ten: '22 - Bài lượng tử - điều khiển và đồ thị', mo: { canh: 'hai-khe', buoc: 3 }, lam: `${CHAY(300)} document.getElementById('bai-hoc-cuon').scrollTop = 1e6;` },
  { ma: 'tuong-doi', ten: '23 - Bài tương đối - bước giữa', mo: { canh: 'lorentz', buoc: 3 }, lam: CHAY(300) },
  { ma: 'cong-thuc-dai', ten: '23b - Công thức dài được co cho vừa bảng (Bài 8 bước 7)', mo: { canh: 'rindler', buoc: 7 }, lam: `${CHAY(120)} (() => { const e = [...document.querySelectorAll('#buoc-noi-dung .bg-toan')].find((x) => x.style.fontSize) || document.querySelector('#buoc-noi-dung .bg-toan'); e?.scrollIntoView({ block: 'center' }); })();` },
  { ma: 'o-so-lieu', ten: '23c - Ô số liệu thu gọn (Bài 18 bước 3)', mo: { canh: 'gian-no', buoc: 3 }, lam: `${CHAY(200)} __vt.hud.datGon(true, false); ${CHAY(40)}` },
  // Nhãn trên mô hình và ô số liệu: một bài mỗi phần, ở bước hay có nhãn sát mép hoặc chui dưới bảng (--man nhan).
  { ma: 'nhan', ten: '30 - Nhãn - Bài 1 bước 3', mo: { canh: 'he-mat-troi', buoc: 3 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '31 - Nhãn - Bài 1 bước 5', mo: { canh: 'he-mat-troi', buoc: 5 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '32 - Nhãn - Bài 1 bước 7', mo: { canh: 'he-mat-troi', buoc: 7 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '33 - Nhãn - Bài 2 bước 4', mo: { canh: 'ngan-ha', buoc: 4 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '34 - Nhãn - Bài 2 bước 7', mo: { canh: 'ngan-ha', buoc: 7 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '35 - Nhãn - Bài 5 bước 3', mo: { canh: 'non-anh-sang', buoc: 3 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '36 - Nhãn - Bài 9 bước 4', mo: { canh: 'thoi-gian', buoc: 4 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '37 - Nhãn - Bài 13 bước 3', mo: { canh: 'quy-dao', buoc: 3 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '38 - Nhãn - Bài 18 bước 3', mo: { canh: 'gian-no', buoc: 3 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '39 - Nhãn - Bài 26 bước 3', mo: { canh: 'spin-stern-gerlach', buoc: 3 }, lam: CHAY(300) },
  { ma: 'nhan', ten: '40 - Nhãn - Bài 1 bước 3 - ẩn bài giảng', mo: { canh: 'he-mat-troi', buoc: 3 }, lam: `__vt.anHienBang(true); ${CHAY(300)}` },
  // Nghe giảng có phụ đề (nghe-giang.js): đồng hồ đẩy bằng tien(giây); ảnh chụp ở trạng thái cuối.
  { ma: 'nghe', ten: '24 - Nghe giảng - màn hình thường, phụ đề trên mô hình', mo: { canh: baiChinh, buoc: 3 }, lam: `${CHAY(120)} __vt.nghe.phatDung(true); __vt.nghe.tien(10); ${CHAY(180)}` },
  { ma: 'nghe', ten: '25 - Nghe giảng - ẩn bảng, có thanh phát', mo: { canh: baiChinh, buoc: 5 }, lam: `${CHAY(120)} __vt.nghe.phatDung(true); __vt.anHienBang(true); __vt.nghe.tien(10); ${CHAY(180)} __vt.nghe._hienDieuKhien(true); ${CHAY(20)}` },
  { ma: 'nghe', ten: '26 - Nghe giảng - ẩn bảng, đầu bước, thẻ tên bước, thanh phát đã ẩn', khongRe: true, mo: { canh: baiChinh, buoc: 2 }, lam: `${CHAY(120)} __vt.nghe.phatDung(true); __vt.anHienBang(true); __vt.nghe.tien(2.4); ${CHAY(120)} document.body.classList.add('xv-an-dk'); __vt._vungCho = 0; ${CHAY(20)}` },
  { ma: 'nghe', ten: '27 - Nghe giảng - hết bài, mời học bài tiếp', mo: { canh: baiChinh, buoc: 8 }, lam: `${CHAY(120)} __vt.nghe.batTatTuSang(true); __vt.nghe.phatDung(true); __vt.nghe.tien(__vt.nghe.trangThai().dai + 2.2); ${CHAY(60)}` },
  { ma: 'nghe', ten: '28 - Nghe giảng - ẩn bảng, mở đầu bài, thẻ mở đầu', khongRe: true, mo: { canh: baiChinh, buoc: 1 }, lam: `${CHAY(120)} __vt.anHienBang(true); __vt.nghe.phatDung(true); __vt.chuyenBai(__vt.chiSo); __vt.nghe.tien(1.2); ${CHAY(90)} document.body.classList.add('xv-an-dk'); __vt._vungCho = 0; ${CHAY(20)}` },
  { ma: 'nghe', ten: '29 - Nghe giảng - màn hình thường, tạm dừng', mo: { canh: baiChinh, buoc: 3 }, lam: `${CHAY(120)} __vt.nghe.phatDung(true); __vt.nghe.tien(9); ${CHAY(120)} __vt.nghe.phatDung(false); ${CHAY(10)}` },
];

const dsMan = MAN.filter((m) => !chiMan.length || chiMan.includes(m.ma));
if (!dsMan.length) throw Error('Không có màn hình nào khớp --man.');

const c = await moChrome();
let maChen = null, soAnh = 0;
const canhBao = [];
try {
  for (const [rong, cao] of dsCo) {
    // Cỡ điện thoại (bề ngang dưới 600, hoặc cầm ngang với chiều cao dưới 500): giả lập máy chạm, như điện thoại thật.
    const dienThoai = rong < 600 || cao < 500;
    await c.goi('Emulation.setDeviceMetricsOverride', { width: rong, height: cao, deviceScaleFactor: doNet, mobile: dienThoai });
    await c.goi('Emulation.setTouchEmulationEnabled', { enabled: dienThoai, maxTouchPoints: dienThoai ? 5 : 1 });
    await c.goi('Emulation.setTimezoneOverride', { timezoneId: 'Asia/Ho_Chi_Minh' });
    for (const tieng of dsTieng) {
      const thuMuc = join(thuMucRa, `${rong}x${cao}`, TEN_TIENG[tieng]);
      mkdirSync(thuMuc, { recursive: true });
      await c.goi('Emulation.setLocaleOverride', { locale: tieng });
      const dsTep = [];
      for (const man of dsMan) {
        if (man.chiTieng && !man.chiTieng.includes(tieng)) continue;
        if (maChen) await c.goi('Page.removeScriptToEvaluateOnNewDocument', { identifier: maChen });
        ({ identifier: maChen } = await c.goi('Page.addScriptToEvaluateOnNewDocument', { source: `(${chuanBi})(${JSON.stringify(man.luu || {})})` }));
        const url = pathToFileURL(resolve(tepHtml));
        url.search = new URLSearchParams({ lang: tieng, im: '1', tua: '0', ...man.mo }).toString();
        c.loiTrang = null;
        // Rời hẳn trang cũ trước: hai màn hình liền nhau có thể cùng một đường dẫn, và điều hướng tới đúng đường dẫn đang mở
        // không nạp lại trang (tiến độ đặt sẵn sẽ không được áp).
        await c.goi('Page.navigate', { url: 'about:blank' });
        await c.goi('Page.navigate', { url: url.href });
        let xong = false;
        for (let i = 0; i < 1200 && !xong; i++) {
          if (c.loiTrang) throw Error(`${man.ten}: ${c.loiTrang}`);
          xong = await c.doc(`location.href === ${JSON.stringify(url.href)} && !!window.__vt?.canh`);
          if (!xong) await cho(50);
        }
        if (!xong) throw Error('Không mở được ' + url.href);
        await c.doc(`(() => { ${man.lam || ''} })(); document.fonts.ready.then(() => true)`);
        const trangThai = await c.doc(`(() => { const a = window.__vt; return { loi: a.loiGhi.slice(0, 3), lang: document.documentElement.lang, tran: document.documentElement.scrollWidth > innerWidth + 1 }; })()`);
        if (trangThai.lang !== tieng) throw Error(`${man.ten}: sai ngôn ngữ trên trang (${trangThai.lang})`);
        if (trangThai.loi.length) canhBao.push(`${rong}x${cao} ${tieng} «${man.ten}»: lỗi trong cảnh: ${trangThai.loi.join(' | ')}`);
        if (trangThai.tran) canhBao.push(`${rong}x${cao} ${tieng} «${man.ten}»: trang tràn ngang`);
        if (man.re) {
          const p = await c.doc(`(() => { const e = document.querySelector(${JSON.stringify(man.re)}); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
          if (p) await c.goi('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p[0], y: p[1] });
          else canhBao.push(`${rong}x${cao} ${tieng} «${man.ten}»: không thấy phần tử để rê (${man.re})`);
        } else if (!man.khongRe) await c.goi('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: cao - 2 });
        let clip;
        if (man.cat) {
          const r = await c.doc(`(() => { const e = document.querySelector(${JSON.stringify(man.cat)}); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()`);
          if (!r || r[2] < 2) { canhBao.push(`${rong}x${cao} ${tieng} «${man.ten}»: không có phần tử ${man.cat}`); continue; }
          const le = man.le ?? 10;
          const x = Math.max(0, r[0] - le), y = Math.max(0, r[1] - le);
          clip = { x, y, width: Math.min(rong - x, r[2] + 2 * le), height: Math.min(cao - y, r[3] + 2 * le), scale: 2 / doNet };
        }
        const { data } = await c.goi('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, ...(clip ? { clip } : {}) });
        const tep = join(thuMuc, man.ten + '.png');
        writeFileSync(tep, Buffer.from(data, 'base64'));
        if (!clip) dsTep.push(tep);
        soAnh++;
      }
      console.log(`Đã chụp ${rong}×${cao} · ${TEN_TIENG[tieng]}: ${thuMuc}`);
      if (ghep && dsTep.length > 1) {
        // Tấm tổng hợp để lướt nhanh cả bộ (mỗi ảnh thu còn 800 điểm ảnh bề ngang).
        const cot = 4, hang = Math.ceil(dsTep.length / cot);
        const vao = dsTep.flatMap((t) => ['-i', t]);
        const loc = dsTep.map((_, i) => `[${i}:v]scale=800:-1[a${i}]`).join(';') + ';' + dsTep.map((_, i) => `[a${i}]`).join('') +
          `xstack=inputs=${dsTep.length}:layout=${dsTep.map((_, i) => `${(i % cot) * 806}_${Math.floor(i / cot) * (Math.round(800 * cao / rong) + 6)}`).join('|')}:fill=0x202020[ra]`;
        try {
          execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...vao, '-filter_complex', loc, '-map', '[ra]', '-frames:v', '1', '-q:v', '3',
            join(thuMucRa, `Tổng hợp - ${rong}x${cao} - ${TEN_TIENG[tieng]}.jpg`)], { stdio: ['ignore', 'ignore', 'pipe'] });
        } catch (e) { canhBao.push(`Không ghép được tấm tổng hợp ${rong}x${cao} ${tieng} (${hang} hàng): ${String(e.stderr || e).slice(0, 200)}`); }
      }
    }
  }
} finally {
  await c.dong();
}
for (const cb of canhBao) console.log('LƯU Ý:', cb);
console.log(`Xong: ${soAnh} ảnh, ${canhBao.length} lưu ý.`);
