// Bộ kiểm phần KHUNG không cần trình duyệt (npm run kiem chạy tệp này):
//   1. noiSo: số có khoảng trắng ngăn hàng nghìn không bị ngắt dòng giữa số;
//   2. chia phụ đề chữ Trung, Nhật: không ngắt giữa số và đơn vị («230 | km/s»);
//   3. bộ bố trí nhãn (src/khung/bo-nhan.js): né bảng bài giảng, ô số liệu, mép cửa sổ; nhãn trong nhóm tránh nhau theo
//      mức ưu tiên; không nháy qua lại ở ranh giới;
//   4. mọi khoá chữ mà khung gọi bằng chu('…') đều có trong src/ngon-ngu/vi/chung.json, và bốn tệp chung.json của bốn
//      thứ tiếng có cùng bộ khoá gd.*, xv.*.
//   5. công thức trong dòng thành chữ đọc được (src/khung/tex-thanh-chu.js): mẫu thường gặp, công thức viết dở không
//      ném lỗi, và mọi công thức trong dòng của khoá học đổi ra không còn sót ký hiệu LaTeX.
// Phần cần trình duyệt (nhãn thật trên trang, ô số liệu, điện thoại) nằm ở kiem-tra/kiem-giao-dien.mjs.
import { DS_TIENG_DICH } from '../cong-cu/ngon-ngu.mjs';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { noiSo } from '../src/khung/chu-so.js';
import { chiaPhuDe } from '../src/khung/chia-phu-de.js';
import { BoNhan } from '../src/khung/bo-nhan.js';
import { texThanhChu, chuCoCongThuc } from '../src/khung/tex-thanh-chu.js';

const GOC = fileURLToPath(new URL('../', import.meta.url));
let soPhep = 0;
const dat = (dk, tin) => { soPhep++; assert(dk, tin); };

// ---------- 1. Số hàng nghìn không ngắt ----------
const H = ' ';
for (const [vao, ra] of [
  ['ở 26 700, 38 000 và 50 000 năm', `ở 26${H}700, 38${H}000 và 50${H}000 năm`],
  ['đường kính 1 391 400 km', `đường kính 1${H}391${H}400 km`],
  ['năm 2020 123 người', 'năm 2020 123 người'],
  ['3,5 000', '3,5 000'],
  ['Bài 15 và 17', 'Bài 15 và 17'],
  ['1 000', `1${H}000`],
  ['<b>12 742 km</b>, cách 1 AU', `<b>12${H}742 km</b>, cách 1 AU`],
  ['299 792,458 km', `299${H}792,458 km`],
  ['12 3456', '12 3456'],
  ['t = 5 300 s', `t = 5${H}300 s`],
  [`đã có sẵn 26${H}700`, `đã có sẵn 26${H}700`],
]) dat(noiSo(vao) === ra, `noiSo(«${vao}») ra «${noiSo(vao)}», cần «${ra}»`);

// ---------- 2. Phụ đề chữ vuông: số và đơn vị đi cùng nhau ----------
for (const [loi, cum] of [
  ['はくちょう座の方向へ230 km/s（黄色い矢印）。太陽は銀河系の中心のまわりを回っています。', ['230 km/s']],
  ['太阳正以每秒230 km的速度朝天鹅座方向飞行，同时带着八大行星一起运动。', ['230 km']],
  ['ボイジャー1号は太陽から169.8 AU、光で24時間の距離にあります。そして毎年3.57 AUずつ遠ざかっています。', ['169.8 AU', '3.57 AU']],
  ['距离银河系中心26,700光年，绕一圈大约需要2.2亿年，速度约为828,000 km/h。', ['828,000 km/h', '26,700']],
]) {
  for (const dai of [20, 16, 12]) {
    const cau = chiaPhuDe(loi, { dai });
    const ghep = cau.join('\u0001').replace(/\n/g, '\u0001');
    for (const c of cum) dat(ghep.includes(c), `phụ đề chữ vuông (dòng ${dai} chữ) ngắt giữa «${c}»: ${cau.join(' | ').replace(/\n/g, ' / ')}`);
    dat(cau.join('').replace(/\s+/g, '') === loi.replace(/\s+/g, ''), 'ghép các câu phụ đề không ra lời gốc');
  }
}

// Phụ đề chữ vuông không ngắt giữa một từ (bộ tách từ Intl.Segmenter; máy không có bộ này thì bỏ qua mục kiểm). Trước bản
// 3.8 câu đầu ngắt «飞行方 | 向». Mọi chỗ ngắt dòng và ngắt câu phải rơi đúng ranh giới từ.
if (typeof Intl.Segmenter === 'function') {
  let soNgat = 0;
  for (const [loi, tieng] of [
    ['太阳正带着八大行星朝天鹅座的飞行方向运动，我们从银河系外面观察它的轨迹。', 'zh-CN'],
    ['每颗行星的速度都是两部分之和：一部分是太阳的飞行速度，另一部分是行星自己的轨道速度。', 'zh-CN'],
    ['太陽は八つの惑星を連れて、はくちょう座の方向へ飛んでいます。その軌跡を銀河系の外から見てみましょう。', 'ja'],
    ['それぞれの惑星の速度は、太陽の飛行速度と惑星自身の軌道速度という二つの部分の和になります。', 'ja'],
  ]) {
    const dau = new Set([...new Intl.Segmenter(tieng, { granularity: 'word' }).segment(loi)].map((d) => d.index));
    for (const dai of [20, 16, 12, 9]) {
      const cau = chiaPhuDe(loi, { dai, tieng });
      dat(cau.join('').replace(/\n/g, '') === loi, 'ghép các câu phụ đề không ra lời gốc');
      let vt = 0;
      for (const dong of cau.flatMap((c) => c.split('\n'))) {
        if (vt > 0) { soNgat++; dat(dau.has(vt), `phụ đề ${tieng} (dòng ${dai} chữ) ngắt giữa một từ, trước «${loi.slice(vt, vt + 4)}»: ${cau.join(' | ').replace(/\n/g, ' / ')}`); }
        vt += dong.length;
      }
    }
  }
  dat(soNgat > 20, 'mục kiểm ranh giới từ không xét được chỗ ngắt nào');
}

// ---------- 3. Bộ bố trí nhãn ----------
const RONG = 1280, CAO = 800;
const mayQuay = { projectionMatrix: new THREE.Matrix4(), matrixWorldInverse: new THREE.Matrix4() };
function taoBo(vung, rong = RONG, cao = CAO) { const bo = new BoNhan(); bo.rong = rong; bo.cao = cao; bo.datVung(vung, rong, cao); return bo; }
// Nhãn giả: hộp w × h, lề trái ml (như .nhan có margin-left 10 px), neo ở (x, y) điểm ảnh.
function nhanGia(bo, x, y, { w = 100, h = 20, ml = 10, cx = 0, cy = 0.5, rong = RONG, cao = CAO, ...tuyChon } = {}) {
  const lop = new Set();
  const o = { center: { x: cx, y: cy }, matrixWorld: new THREE.Matrix4(), visible: true };
  const el = {
    style: { display: '', translate: '' }, parentNode: {}, textContent: 'nhãn',
    classList: { contains: (c) => lop.has(c), toggle: (c, b) => { if (b) lop.add(c); else lop.delete(c); } },
    getBoundingClientRect: () => { const r = o._vtNhan; const left = r.ax - o.center.x * w + ml + r.dx, top = r.ay - o.center.y * h + r.dy; return { left, top, width: w, height: h }; },
  };
  o.element = el;
  o.dat = (px, py) => { o.matrixWorld.setPosition((px / rong) * 2 - 1, 1 - (py / cao) * 2, 0); return o; };
  o.dat(x, y);
  bo.dangKy(o, tuyChon);
  return o;
}
const xep = (bo, rong = RONG, cao = CAO, lan = 1) => { for (let i = 0; i < lan; i++) bo.sapXep(mayQuay, rong, cao); };
const so = (o) => o._vtNhan;
const chamNhau = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
const BANG = [826, 64, 1266, 786, 0], O_SO_LIEU = [16, 690, 370, 784, 1];
{
  const bo = taoBo([BANG, O_SO_LIEU]);
  const a = nhanGia(bo, 700, 300), b = nhanGia(bo, 760, 300), c = nhanGia(bo, 900, 300), d = nhanGia(bo, 100, 740), e = nhanGia(bo, -50, 300);
  const f = nhanGia(bo, 800, 300, { w: 60, tuDo: true });
  xep(bo);
  dat(!so(a).an && so(a).kieu === 0 && so(a).dx === 0, 'nhãn còn chỗ bên phải phải đứng chỗ gốc');
  dat(!so(b).an && so(b).kieu === 1 && so(b).x1 <= 760 && so(b).dx === -120, `nhãn chạm bảng bài giảng phải lật sang trái điểm neo (đang: kiểu ${so(b).kieu}, dx ${so(b).dx})`);
  dat(b.element.style.translate === '-120px 0px', `nhãn lật phải được dời bằng translate (đang «${b.element.style.translate}»)`);
  dat(so(c).an && c.element.classList.contains('vt-an'), 'nhãn có điểm neo dưới bảng bài giảng phải ẩn');
  dat(!so(d).an && so(d).kieu === 9 && so(d).y1 <= 690 - 4, `nhãn có điểm neo dưới ô số liệu phải được đẩy lên trên ô (đang y1 = ${so(d).y1})`);
  dat(so(e).an, 'nhãn có điểm neo ngoài cửa sổ phải ẩn');
  dat(!so(f).thay && f.element.style.translate === '', 'nhãn tự do không bị đụng tới');
  dat(bo.chong(700, 290, 760, 310) > 0 && bo.chong(300, 100, 380, 120) === 0 && bo.chong(830, 100, 900, 120) > 0, 'chong(): chỗ có nhãn hay vùng che phải ra số dương, chỗ trống ra 0');
  // Không nháy: nhãn đã lật chỉ quay về khi chỗ gốc thoáng hẳn.
  b.dat(706, 300); xep(bo);
  dat(so(b).kieu === 1, 'điểm neo vừa đủ chỗ (hở 6 điểm ảnh): nhãn đã lật phải giữ nguyên bên, không nháy về');
  b.dat(690, 300); xep(bo);
  dat(so(b).kieu === 0 && b.element.style.translate === '', 'chỗ gốc thoáng hẳn thì nhãn quay về');
  // Điểm neo đi vào dưới bảng rồi đi ra: ẩn rồi hiện lại.
  a.dat(860, 300); xep(bo); dat(so(a).an, 'điểm neo vào dưới bảng: ẩn');
  a.dat(600, 300); xep(bo); dat(!so(a).an && !a.element.classList.contains('vt-an'), 'điểm neo ra khỏi bảng: hiện lại');
}
{
  // Nhóm tránh nhau theo mức ưu tiên.
  const bo = taoBo([BANG]);
  const A = nhanGia(bo, 400, 400), B = nhanGia(bo, 405, 404), C = nhanGia(bo, 440, 404), D = nhanGia(bo, 402, 398), E = nhanGia(bo, 600, 200);
  const nhom = [{ nhan: A, uuTien: 90 }, { nhan: B, uuTien: 50 }, { nhan: C, uuTien: 60 }, { nhan: D, uuTien: 40, giu: true }, { nhan: E, uuTien: 10, tat: true }];
  bo.vaoNhom(nhom); xep(bo);
  dat(!so(A).an && so(A).kieu === 0, 'nhãn ưu tiên cao nhất đứng chỗ gốc');
  dat(so(B).an, 'nhãn thấp hơn hẳn có vật nằm sát vật của nhãn cao hơn (cách dưới 24 điểm ảnh) phải ẩn');
  dat(!so(C).an && so(C).kieu > 0 && !chamNhau(so(C), so(A)), `nhãn thấp hơn có vật cách xa đủ phải được dời sang chỗ không đè (đang: ẩn ${so(C).an}, kiểu ${so(C).kieu})`);
  dat(!so(D).an, 'nhãn «giữ» không bao giờ bị ẩn vì đè');
  dat(E.visible === false, 'nhãn có tat = true phải được tắt hẳn (o.visible = false)');
  // Ổn định: xếp thêm vài khung hình, cách đặt không đổi.
  const truoc = [A, B, C, D].map((o) => `${so(o).an}/${so(o).kieu}`).join(' ');
  bo.vaoNhom(nhom); xep(bo, RONG, CAO, 5);
  dat([A, B, C, D].map((o) => `${so(o).an}/${so(o).kieu}`).join(' ') === truoc, 'cách đặt của nhóm phải ổn định qua các khung hình');
  // Ba «thiên hà hàng xóm» quanh nhãn chính (trường hợp Bài 2 bước 7): cả ba phải hiện.
  const bo2 = taoBo([BANG]);
  const NH = nhanGia(bo2, 510, 380, { w: 126, h: 36 }), LMC = nhanGia(bo2, 495, 406, { w: 132, h: 35 }), SMC = nhanGia(bo2, 504, 416, { w: 133, h: 35 }), M31 = nhanGia(bo2, 385, 330, { w: 170, h: 35 });
  bo2.vaoNhom([{ nhan: NH, uuTien: 95 }, { nhan: LMC, uuTien: 70 }, { nhan: SMC, uuTien: 69 }, { nhan: M31, uuTien: 68 }]); xep(bo2);
  dat([NH, LMC, SMC, M31].every((o) => !so(o).an), `bốn nhãn thiên hà gần nhau phải cùng hiện (ẩn: ${[NH, LMC, SMC, M31].map((o) => so(o).an)})`);
  const ds = [NH, LMC, SMC, M31].map(so);
  dat(ds.every((x, i) => ds.every((y, j) => i >= j || !chamNhau(x, y))), 'bốn nhãn thiên hà không được đè nhau');
}
{
  // Điện thoại cầm dọc: bảng bài giảng nằm dưới, ô số liệu nằm trên.
  const R = 390, C = 844;
  const bo = taoBo([[8, 456, 382, 836, 0], [8, 52, 382, 80, 1]], R, C);
  const a = nhanGia(bo, 300, 200, { w: 150, rong: R, cao: C }), b = nhanGia(bo, 200, 440, { w: 120, cx: 0.5, cy: 0, ml: 0, rong: R, cao: C }), c = nhanGia(bo, 200, 600, { rong: R, cao: C });
  const d = nhanGia(bo, 195, 250, { w: 372, rong: R, cao: C });
  xep(bo, R, C);
  dat(!so(a).an && so(a).x0 >= 6 && so(a).x1 <= R - 6, `điện thoại: nhãn chạm mép phải phải lật vào trong (x ${so(a).x0}–${so(a).x1})`);
  dat(!so(b).an && so(b).y1 <= 456 - 4, `điện thoại: nhãn nằm dưới điểm neo sát bảng phải chuyển lên trên (y1 ${so(b).y1})`);
  dat(so(c).an, 'điện thoại: điểm neo dưới bảng bài giảng thì ẩn');
  dat(!so(d).an && so(d).x0 >= 6 && so(d).x1 <= R - 6, 'điện thoại: nhãn rất rộng được căn vào giữa, phía trên hoặc dưới điểm neo');
}

{
  // Bài tạo nhãn mới liên tục rồi gỡ nhãn cũ: sổ nhãn không phình mãi, nhãn đưa lại vào cảnh thì được ghi lại.
  const bo = taoBo([BANG]);
  const ds = [];
  for (let i = 0; i < 150; i++) ds.push(nhanGia(bo, 100 + (i % 10) * 60, 100 + Math.floor(i / 10) * 30, { w: 40, h: 12 }));
  xep(bo);
  for (let i = 0; i < 120; i++) ds[i].element.parentNode = null;      // 120 nhãn bị gỡ khỏi cảnh
  xep(bo); bo.doLai();
  dat(bo.ds.length === 30, `sổ nhãn phải rút còn 30 nhãn đang sống (đang ${bo.ds.length})`);
  dat(so(ds[0]).go === true && so(ds[149]).go !== true, 'nhãn đã gỡ được đánh dấu, nhãn còn sống thì không');
  ds[0].element.parentNode = {}; bo.dangKyLai(so(ds[0])); xep(bo);
  dat(bo.ds.length === 31 && so(ds[0]).thay, 'nhãn đưa lại vào cảnh được ghi lại và xếp chỗ');
}

// ---------- 4. Khoá chữ của khung ----------
const doc = (ma) => JSON.parse(readFileSync(`${GOC}src/ngon-ngu/${ma}/chung.json`, 'utf8'));
const vi = doc('vi');
const dsTep = [...readdirSync(`${GOC}src/khung`).filter((t) => t.endsWith('.js')).map((t) => `src/khung/${t}`), 'src/main.js', 'src/ngon-ngu/chon.js'];
const daDung = new Set();
for (const tep of dsTep) {
  const ma = readFileSync(GOC + tep, 'utf8');
  for (const m of ma.matchAll(/\bchu\(\s*(["'])((?:gd|xv|hop)\.[^"']+)\1/g)) { daDung.add(m[2]); dat(Object.hasOwn(vi, m[2]), `${tep}: khoá chữ «${m[2]}» không có trong src/ngon-ngu/vi/chung.json`); }
}
const html = readFileSync(`${GOC}src/index.html`, 'utf8');
for (const m of html.matchAll(/data-dich(?:-title|-aria-label)?="([^"]+)"/g)) dat(Object.hasOwn(vi, m[1]), `src/index.html: khoá chữ «${m[1]}» không có trong vi/chung.json`);
const khoaKhung = Object.keys(vi).filter((k) => /^(gd|xv|hop)\./.test(k));
for (const ma of DS_TIENG_DICH) {
  const d = doc(ma);
  const thieu = khoaKhung.filter((k) => !d[k]?.trim());
  dat(thieu.length === 0, `src/ngon-ngu/${ma}/chung.json thiếu ${thieu.length} khoá giao diện: ${thieu.slice(0, 8).join(', ')}`);
}

// ---------- 5. Công thức trong dòng thành chữ đọc được (phụ đề khi chưa có lời đọc, thẻ tên bước) ----------
for (const [tex, ra] of [
  ['\\vec V', 'V'],
  ['\\vec v_{\\text{quỹ đạo}}', 'v quỹ đạo'],
  ['E = mc^2', 'E = mc²'],
  ['230 \\times \\sin 60^\\circ \\approx 200', '230 × sin 60° ≈ 200'],
  ['r_s = \\dfrac{2GM}{c^2}', 'rs = 2GM/c²'],
  ['\\frac{\\dd r}{\\dd t^*} = c\\,\\frac{r - r_s}{r + r_s}', 'dr/dt* = c (r - rs)/(r + rs)'],
  ['\\gamma = \\frac{1}{\\sqrt{1 - \\beta^2}}', 'γ = 1/√(1 - β²)'],
  ['\\Delta x\\,\\Delta p \\ge \\hbar/2', 'Δx Δp ≥ ℏ/2'],
  ['T_{\\mu\\nu}', 'Tμν'], ['H_0', 'H₀'], ['10^{-35}', '10⁻³⁵'], ['3{,}14', '3,14'], ['M_\\odot', 'M☉'], ['|\\psi|^2', '|ψ|²'],
  ['\\left(1 - \\frac{r_s}{r}\\right)', '(1 - rs/r)'], ['d = a(t)\\,D', 'd = a(t) D'], ['1\\,391\\,400', '1 391 400'],
  ['\\lenhLa{x} + y', 'x + y'], ['\\text{km/s}', 'km/s'], ['90^\\circ', '90°'], ['v \\ll c', 'v ≪ c'],
]) dat(texThanhChu(tex) === ra, `texThanhChu(«${tex}») ra «${texThanhChu(tex)}», cần «${ra}»`);
// Công thức viết dở không được làm hỏng trang: trả về chữ, không ném lỗi.
for (const tex of ['\\frac{a', '^', '_', '\\', '{{{', '\\sqrt[3', '\\left(', null, undefined, 12]) dat(typeof texThanhChu(tex) === 'string', `texThanhChu(${JSON.stringify(tex)}) phải trả về chuỗi`);
dat(chuCoCongThuc('Hệ số tỉ lệ $a(t)$ và dịch chuyển đỏ') === 'Hệ số tỉ lệ a(t) và dịch chuyển đỏ', 'chuCoCongThuc: công thức trong dòng thành chữ');
dat(chuCoCongThuc('giá \\$5, khối $$ x = 1 $$ hết') === 'giá $5, khối  hết', 'chuCoCongThuc: giữ dấu đô la thật, bỏ công thức khối');
// Mọi công thức trong dòng của cả khoá (bản tiếng Việt) đổi ra chữ không còn sót ký hiệu LaTeX và không rỗng.
{
  let tong = 0;
  const sot = [];
  for (const tep of readdirSync(`${GOC}src/ngon-ngu/vi`).filter((f) => f.endsWith('.json'))) {
    for (const v of Object.values(JSON.parse(readFileSync(`${GOC}src/ngon-ngu/vi/${tep}`, 'utf8')))) {
      if (typeof v !== 'string') continue;
      for (const m of v.replace(/\$\$[\s\S]+?\$\$/g, '').matchAll(/\$([^$]+?)\$/g)) {
        tong++;
        const r = texThanhChu(m[1]);
        if (!r || /[\\{}]/.test(r)) sot.push(`${tep}: ${m[1]} → ${r}`);
      }
    }
  }
  dat(tong > 1000 && sot.length === 0, `texThanhChu: ${sot.length}/${tong} công thức trong dòng của khoá học đổi ra còn sót ký hiệu: ${sot.slice(0, 5).join(' | ')}`);
}

console.log(`Khung (bố trí nhãn, số, phụ đề chữ vuông, khoá chữ, công thức thành chữ): ${soPhep} phép đạt.`);
