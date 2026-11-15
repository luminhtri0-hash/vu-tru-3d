// Dựng «phòng trưng bày» cho một tệp thử: một trang HTML tự chứa để xem riêng một mô-đun hình
// bằng đúng bộ dựng hình của app (xem kiem-tra/trung-bay/khung.js).
//
//   node kiem-tra/trung-bay.mjs <tệp thử .js> <thư mục ra>
//   bash kiem-tra/chup.sh "<thư mục ra>/index.html" "<thư mục ra>/a.png" "tua=2&goc=3,2,6"
//
// Ví dụ: node kiem-tra/trung-bay.mjs kiem-tra/trung-bay/thu-mau.js "Dữ liệu làm việc/trung-bay-mau"

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [tepThu, thuMucRa] = process.argv.slice(2);
if (!tepThu || !thuMucRa) { console.error('Cách dùng: node kiem-tra/trung-bay.mjs <tệp thử .js> <thư mục ra>'); process.exit(1); }

const thu = {
  name: 'thu',
  setup(b) { b.onResolve({ filter: /^ao:thu$/ }, () => ({ path: resolve(tepThu) })); },
};
const kq = await build({
  entryPoints: ['kiem-tra/trung-bay/khung.js'], bundle: true, minify: false, format: 'iife',
  target: ['es2020', 'safari15', 'chrome100'], write: false, legalComments: 'none',
  loader: { '.glsl': 'text', '.json': 'json' }, plugins: [thu],
});
const js = kq.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync('src/style.css', 'utf8');
const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="color-scheme" content="dark"><title>Trưng bày</title>
<style>${css}
#loi { top: 20px; left: 20px; transform: none; max-width: 80vw; }</style></head><body>
<div id="san-khau"></div><div id="lop-nhan"></div><div id="loi" hidden></div>
<script>${js}</script></body></html>`;
mkdirSync(thuMucRa, { recursive: true });
writeFileSync(join(thuMucRa, 'index.html'), html);
console.log(`Đã dựng ${join(thuMucRa, 'index.html')}: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
