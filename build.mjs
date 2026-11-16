// Đóng gói toàn bộ ứng dụng thành MỘT tệp HTML tự chứa (mở được bằng cách bấm đúp, không cần mạng).
// Chạy: node build.mjs                      → dist/index.html (đã nén, đủ mọi bài)
//       node build.mjs --tho                → không nén, dễ dò lỗi
//       node build.mjs --ra <thư mục>       → ghi ra <thư mục>/index.html thay cho dist/
//       node build.mjs --chi id1,id2        → chỉ đóng gói các bài có id nêu ra (dựng nhanh, không vướng bài đang viết dở)

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { KHOA_HOC } from './src/noi-dung/khoa-hoc.js';
import { DS_TIENG_DICH } from './cong-cu/ngon-ngu.mjs';

const thamSo = process.argv.slice(2);
const lay = (co) => { const i = thamSo.indexOf(co); return i >= 0 ? thamSo[i + 1] : null; };
const tho = thamSo.includes('--tho');
const thuMucRa = lay('--ra') || 'dist';
const chi = lay('--chi')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;

// Danh sách bài theo thứ tự khoá học; bài chưa có tệp thì bỏ qua (báo ra màn hình).
const moiId = KHOA_HOC.flatMap((p) => p.bai);
const thieu = [];
const ids = moiId.filter((id) => {
  if (chi && !chi.includes(id)) return false;
  if (existsSync(`src/canh/${id}.js`)) return true;
  thieu.push(id);
  return false;
});
if (chi) for (const id of chi) if (!moiId.includes(id)) console.warn(`  (bỏ qua «${id}»: không có trong src/noi-dung/khoa-hoc.js)`);
if (thieu.length) console.warn(`  (chưa có tệp cho: ${thieu.join(', ')})`);
if (!ids.length) { console.error('Không có bài nào để đóng gói.'); process.exit(1); }

// Mô-đun ảo «ao:ds-canh»: nạp đúng những bài được chọn.
const dsCanh = {
  name: 'ds-canh',
  setup(b) {
    b.onResolve({ filter: /^ao:ds-canh$/ }, () => ({ path: 'ds-canh', namespace: 'ao' }));
    b.onLoad({ filter: /.*/, namespace: 'ao' }, () => ({
      contents: `${ids.map((id, k) => `import c${k} from './src/canh/${id}.js';`).join('\n')}
        export default { ${ids.map((id, k) => `'${id}': c${k}`).join(', ')} };`,
      resolveDir: process.cwd(),
      loader: 'js',
    }));
  },
};

// Mô-đun tuỳ chọn của Bản 3: có tệp thì nạp, chưa có thì thay bằng bản rỗng (để dựng được khi tệp đang viết dở).
const TUY_CHON = { 'ao:am-thanh': ['src/khung/am-thanh.js', 'export const amThanh = null; export const DS_NEN = [];'], 'ao:tuong-tac': ['src/khung/tuong-tac.js', 'export const TuongTac = null;'] };
const tuyChon = {
  name: 'tuy-chon',
  setup(b) {
    b.onResolve({ filter: /^ao:(am-thanh|tuong-tac)$/ }, (a) => (existsSync(TUY_CHON[a.path][0]) ? { path: join(process.cwd(), TUY_CHON[a.path][0]) } : { path: a.path, namespace: 'rong' }));
    b.onLoad({ filter: /.*/, namespace: 'rong' }, (a) => ({ contents: TUY_CHON[a.path][1], loader: 'js' }));
  },
};

// Giọng đọc lời giảng: tệp tiếng nằm ngoài trang (thư mục giong-doc/ cạnh tệp HTML). Trang chỉ cần biết bài nào,
// bước nào, giọng nào có tệp và dài bao nhiêu giây; lấy từ giong-doc/danh-sach.json nếu có.
let giongDoc = null;
try { if (existsSync('giong-doc/danh-sach.json')) giongDoc = JSON.parse(readFileSync('giong-doc/danh-sach.json', 'utf8')); } catch (e) { console.warn(`  (bỏ qua giong-doc/danh-sach.json: ${e.message})`); }

// Lời đọc tiếng Việt (chế độ «Xem như video»): mỗi bài một tệp src/loi-doc/vi/<id>.json = { bai, buoc: [...] }. Tự nhận
// mọi tệp trong thư mục, chỉ gói bài được dựng.
const loiDoc = {};
if (existsSync('src/loi-doc/vi')) {
  for (const ten of readdirSync('src/loi-doc/vi').filter((t) => t.endsWith('.json')).sort()) {
    try {
      const d = JSON.parse(readFileSync(join('src/loi-doc/vi', ten), 'utf8'));
      const id = d.bai || ten.slice(0, -5);
      if (id !== ten.slice(0, -5)) throw Error(`trường "bai" (${id}) phải trùng tên tệp`);
      if (!Array.isArray(d.buoc) || !d.buoc.every((x) => typeof x === 'string' && x.trim())) throw Error('"buoc" phải là danh sách lời đọc');
      if (ids.includes(id)) loiDoc[id] = d.buoc;
    } catch (e) { console.warn(`  (bỏ qua src/loi-doc/vi/${ten}: ${e.message})`); }
  }
}
// Lời đọc ĐÃ DỊCH (Anh, Trung, Nhật): src/loi-doc/<mã tiếng>/<id>.json, cùng dạng với bản Việt. Các thứ tiếng này chưa có
// tiếng; chế độ «Xem như video» dùng lời đã dịch làm phụ đề (chạy theo nhịp đọc ước tính) thay cho chữ rút từ lời giảng.
// Chưa có thư mục thì không gói gì; bước nào thiếu hoặc rỗng thì trang tự quay về lời giảng của bước đó.
const loiDocDich = {};
for (const ma of DS_TIENG_DICH) {
  const thuMuc = join('src/loi-doc', ma);
  if (!existsSync(thuMuc)) continue;
  for (const ten of readdirSync(thuMuc).filter((t) => t.endsWith('.json')).sort()) {
    try {
      const d = JSON.parse(readFileSync(join(thuMuc, ten), 'utf8'));
      const id = ten.slice(0, -5);
      if (d.bai && d.bai !== id) throw Error(`trường "bai" (${d.bai}) phải trùng tên tệp`);
      if (!Array.isArray(d.buoc)) throw Error('"buoc" phải là danh sách lời đọc');
      if (ids.includes(id)) (loiDocDich[ma] ||= {})[id] = d.buoc.map((x) => (typeof x === 'string' ? x.trim() : ''));
    } catch (e) { console.warn(`  (bỏ qua ${thuMuc}/${ten}: ${e.message})`); }
  }
}
// Mốc phụ đề của từng tệp tiếng (giong-doc/<giọng>/<id>-<bước>.phu-de.json, do cong-cu/tao-phu-de.py tạo): gói vào trang
// (vài KB mỗi bài) để chạy được cả app Mac (file://) lẫn web. Mốc lệch với lời đọc hiện tại (lời đã sửa mà chưa tạo lại
// tiếng) thì bỏ, trang sẽ tự dàn phụ đề theo độ dài.
const gom = (s) => String(s).replace(/\s+/g, ' ').trim();
for (const [giong, muc] of Object.entries(giongDoc || {})) {
  for (const [id, bai] of Object.entries(muc.bai || {})) {
    for (const t of bai.tep || []) {
      const tep = join('giong-doc', t.tep.replace(/\.mp3$/, '.phu-de.json'));
      if (!existsSync(tep)) continue;
      try {
        const moc = JSON.parse(readFileSync(tep, 'utf8'));
        const loi = loiDoc[id]?.[t.buoc - 1];
        if (loi && gom(moc.map((m) => m.chu).join(' ')) !== gom(loi)) { console.warn(`  (bỏ mốc phụ đề ${tep}: chữ không khớp lời đọc hiện tại, cần chạy lại cong-cu/tao-phu-de.py)`); continue; }
        t.phuDe = moc.map((m) => ({ t0: m.t0, t1: m.t1, chu: m.chu }));
      } catch (e) { console.warn(`  (bỏ qua ${tep}: ${e.message} · giọng ${giong})`); }
    }
  }
}

// Chỉ nhúng các bản dịch đích. Bản Việt đã có trong chính mã bài và khung.
const banDich = {};
for (const ngonNgu of DS_TIENG_DICH) {
  banDich[ngonNgu] = {};
  for (const phamVi of ['chung', ...ids]) {
    const tep = join('src/ngon-ngu', ngonNgu, phamVi + '.json');
    if (existsSync(tep)) banDich[ngonNgu][phamVi] = JSON.parse(readFileSync(tep, 'utf8'));
  }
}

const kq = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: !tho,
  format: 'iife',
  target: ['es2020', 'safari15', 'chrome100'],
  write: false,
  legalComments: 'none',
  loader: { '.glsl': 'text', '.json': 'json' },
  define: { __BAN_DICH__: JSON.stringify(banDich), __GIONG_DOC__: JSON.stringify(giongDoc), __LOI_DOC__: JSON.stringify(loiDoc), __LOI_DOC_DICH__: JSON.stringify(loiDocDich) },
  plugins: [dsCanh, tuyChon],
});
const js = kq.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// Kiểu chữ công thức toán (KaTeX): nhúng thẳng phông .woff2 vào trang, bỏ các phông không dùng tới.
function cssKatex() {
  const goc = 'node_modules/katex/dist';
  let css = readFileSync(join(goc, 'katex.min.css'), 'utf8');
  const BO = /Fraktur|SansSerif|Script|Typewriter|Caligraphic-Bold/;
  css = css.replace(/@font-face\{[^}]*\}/g, (khoi) => {
    const m = khoi.match(/url\(fonts\/([A-Za-z0-9_-]+)\.woff2\)/);
    if (!m || BO.test(m[1])) return '';
    const b64 = readFileSync(join(goc, 'fonts', `${m[1]}.woff2`)).toString('base64');
    return khoi.replace(/src:[^;}]*/, `src:url(data:font/woff2;base64,${b64}) format("woff2")`);
  });
  return css;
}

const css = `${cssKatex()}\n${readFileSync('src/style.css', 'utf8')}`;
const html = readFileSync('src/index.html', 'utf8')
  .replace('/*__CSS__*/', () => css)
  .replace('/*__JS__*/', () => js);
mkdirSync(thuMucRa, { recursive: true });
const tep = join(thuMucRa, 'index.html');
writeFileSync(tep, html);
console.log(`Đã dựng ${tep}: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, ${ids.length} bài${chi ? ` (chỉ: ${ids.join(', ')})` : ''}`);
