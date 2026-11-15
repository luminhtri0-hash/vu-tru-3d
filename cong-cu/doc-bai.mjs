import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { KHOA_HOC } from '../src/noi-dung/khoa-hoc.js';

// Một số cảnh nạp bản đồ JSON. Dùng cùng trình đóng gói với bản web để đọc
// mô-đun mà không mở trình duyệt, khởi tạo GPU hay phát tiếng.
export async function docBai() {
  const goc = fileURLToPath(new URL('../', import.meta.url));
  const cacBai = KHOA_HOC.flatMap((phan) => phan.bai);
  const ketQua = await build({
    stdin: {
      resolveDir: goc,
      contents: [
        ...cacBai.map((id, i) => 'import c' + i + ' from "./src/canh/' + id + '.js";'),
        'export { dichBai, dichPhan, dichThuatNguChung } from "./src/ngon-ngu/noi-dung.js";',
        'export const bai = [' + cacBai.map((_, i) => 'c' + i).join(',') + '];',
      ].join('\n'),
    },
    platform: 'node', format: 'esm', bundle: true, write: false,
  });
  const ma = Buffer.from(ketQua.outputFiles[0].contents).toString('base64');
  return import('data:text/javascript;base64,' + ma);
}
