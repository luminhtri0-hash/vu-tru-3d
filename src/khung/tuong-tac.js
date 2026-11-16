import { dich as dichChu } from '../ngon-ngu/dich.js';
// Khung tương tác của Bản 3: rê chuột lên vật (con trỏ đổi kiểu, vòng sáng nổi bật, ô chú giải),
// bấm vào vật, kéo tay nắm trong cảnh theo ràng buộc (mặt phẳng, đường thẳng, mặt cầu, tự do, hàm riêng),
// nhích tay nắm bằng phím mũi tên, bong bóng gợi ý.
// Hợp đồng cách gọi: «Hướng dẫn hình, tiếng, tương tác - Bản 3.md» mục 7.
//
//   const tt = new TuongTac(app);           // app: { camera, dk, renderer, rong, cao, am?, loiGhi? }
//   tt.xoaHet();                            // khi rời bài (trước khi huỷ cảnh cũ)
//   tt.datCanh(scene);                      // sau bai.tao(app): gắn nhóm hình phụ (kể cả tay nắm vừa tạo) vào cảnh mới
//   tt.capNhat(dt);                         // mỗi khung hình, trước khi vẽ
//   tt.them(vat, { ten, moTa, banKinhPx, khiRe, khiBam, conTro, noiBat, mau })     → { huy(), an(b) }
//   tt.tayNam({ viTri, mau, co, rangBuoc, gioiHan, hut, khoangHut, nhan, ten, moTa, khiNam, khiKeo, khiTha })
//                                           → { vat, viTri, dat(p, goi), an(b), khoa(b), huy() }
//   tt.goiY(html, viTri, { giay })          → { huy() }
//   tt.dangKeo                              // true khi đang kéo một tay nắm
//
// Quy ước:
//   - Toạ độ (viTri, rangBuoc, hut) là toạ độ của cảnh; cảnh không bị dời, xoay hay co giãn.
//   - Các hàm khiNam, khiKeo, khiTha nhận một bản sao vị trí (THREE.Vector3), giữ lại thoải mái.
//     khiKeo(p, e): e là sự kiện con trỏ hoặc phím; là null khi tay nắm được chỉnh lại vì máy quay vừa trôi.
//   - Sự kiện con trỏ mà khung này đã xử lý (nắm tay nắm, kéo, thả, bấm vật có khiBam) mang cờ e.vtDaXuLy = true,
//     để móc khiBam cũ của ứng dụng bỏ qua.
//   - khoangHut: khoảng bắt dính tính bằng đơn vị cảnh; bỏ trống thì bắt dính khi cách điểm hút dưới 14 điểm ảnh.
//   - xoaHet() dọn im lặng: không gọi khiRe(false), khiTha của bài cũ (bài đang bị huỷ).

import * as THREE from 'three';
import { DuongDay } from './ve.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('chung', khoa, goc, thamSo);

const MAU_MAC_DINH = 0xf3c66f;
const NGUONG_BAM_PX = 5;        // dịch dưới mức này mới tính là bấm (không phải kéo máy quay)
const NGUONG_BAM_MS = 500;
const TRE_CHU_GIAI = 0.15;      // giây rê yên trên vật trước khi hiện ô chú giải
const LOI_TOI_THIEU_PX = 4.5;   // bán kính lõi tay nắm tối thiểu (đường kính 9 điểm ảnh)
const HE_SO_O = 3.2;            // nửa cạnh tấm vẽ tay nắm / bán kính lõi
const HUT_PX = 14;              // khoảng bắt dính mặc định (điểm ảnh)
const PHIM_MUI_TEN = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

// Biến tạm dùng chung (không cấp phát mỗi khung hình).
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _q = new THREE.Vector3();               // kết quả chiếu lên màn hình: x, y (điểm ảnh trong khung vẽ), z (NDC)
const _ndc = new THREE.Vector2();
const _hop = [0, 0, 0, 0];                    // hình chữ nhật thử khi chọn chỗ đặt nhãn gợi ý
const _cau = new THREE.Sphere(), _cau2 = new THREE.Sphere();
const TRUC_X = new THREE.Vector3(1, 0, 0), TRUC_Y = new THREE.Vector3(0, 1, 0), TRUC_Z = new THREE.Vector3(0, 0, 1);

const veVector = (p, out) => {
  if (Array.isArray(p)) return out.set(+p[0] || 0, +p[1] || 0, +p[2] || 0);
  if (p?.isVector3) return out.copy(p);
  if (p?.isObject3D) return p.getWorldPosition(out);
  return null;
};
const thoatHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------- Shader ----------------
// Cả hai tấm vẽ dùng màu tuyến tính và «alpha nhân sẵn»: rgb là phần phát sáng cộng vào, alpha là phần làm tối nền
// phía sau (một quầng tối mỏng để tay nắm, vòng sáng nổi trên cả nền sáng như Mặt Trời).
const DINH_TAM = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const MANH_TAY = /* glsl */ `
  uniform vec3 uMau;
  uniform float uLoi, uPx, uGio, uRe, uKeo, uChon, uKhoa, uHien, uMoi;
  varying vec2 vUv;
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float d = length(q);
    float rc = uLoi, aa = uPx;
    vec3 mau = mix(uMau, vec3(dot(uMau, vec3(0.3, 0.59, 0.11))), uKhoa * 0.85);
    float sang = mix(1.0, 0.4, uKhoa);
    // lõi: đĩa khử răng cưa, tâm trắng nóng, viền sáng mảnh
    float loi = 1.0 - smoothstep(rc - aa, rc + aa, d);
    float tam = 1.0 - smoothstep(0.0, rc * 0.62, d);
    float vien = 1.0 - smoothstep(0.0, 1.3 * aa, abs(d - rc + 0.9 * aa));
    vec3 c = mau * loi * (1.1 + 0.9 * uRe + 1.4 * uKeo) * sang;
    c += vec3(1.0) * tam * loi * (0.8 + 0.9 * uKeo + 0.4 * uRe) * sang;
    c += mau * vien * 1.4 * sang;
    // quầng mềm quanh lõi
    float ngoai = max(d - rc, 0.0) / rc;
    c += mau * exp(-ngoai * ngoai * 2.6) * (1.0 - loi) * (0.2 + 0.3 * uRe + 0.25 * uKeo) * sang;
    // vòng ngoài «mời kéo»: thở chậm; rê tới thì sáng hẳn và nở ra
    float nhip = 0.5 + 0.5 * sin(uGio * 2.4);
    float rr = rc * (1.8 + 0.12 * nhip + 0.22 * uRe);
    float vr = 1.0 - smoothstep(0.45 * aa, 1.5 * aa, abs(d - rr));
    float doVong = mix((0.3 + 0.5 * nhip) * uMoi, 1.25, uRe) * (1.0 - 0.75 * uKeo) * (1.0 - uKhoa);
    c += mau * vr * doVong * 1.5;
    // gợn sóng loang ra mỗi 2,4 giây, chỉ khi chưa ai đụng tới
    float t = fract(uGio / 2.4);
    float rg = rc * (1.25 + 1.6 * t);
    float vg = 1.0 - smoothstep(0.4 * aa, 1.4 * aa, abs(d - rg));
    c += mau * vg * (1.0 - t) * (1.0 - t) * 1.1 * (1.0 - uRe) * (1.0 - uKeo) * uMoi * (1.0 - uKhoa);
    // đang được chọn (dùng phím mũi tên): vòng gạch quay chậm
    float goc = atan(q.y, q.x);
    float gach = smoothstep(-0.15, 0.15, sin(goc * 9.0 - uGio * 1.4));
    float vs = 1.0 - smoothstep(0.45 * aa, 1.4 * aa, abs(d - rc * 2.45));
    c += mau * vs * gach * uChon * 1.5;
    // nền tối mỏng sau lõi cho dễ nhìn trên nền sáng
    float bong = (1.0 - smoothstep(rc * 0.9, rc * 1.9, d)) * 0.5;
    gl_FragColor = vec4(c * uHien, bong * uHien);
  }`;

const MANH_VONG = /* glsl */ `
  uniform vec3 uMau;
  uniform float uR, uPx, uHien, uGio, uManh, uCung;
  varying vec2 vUv;
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float d = length(q);
    float dp = (d - uR) / uPx;                         // khoảng cách tới vòng, tính bằng điểm ảnh
    float loi = 1.0 - smoothstep(0.5, 1.4, abs(dp));
    float quang = exp(-dp * dp / 46.0);
    float goc = atan(q.y, q.x);
    float cung = mix(1.0, 0.45 + 0.55 * smoothstep(-0.3, 0.9, sin(goc * 3.0 + uGio * 0.9)), uCung);
    vec3 c = uMau * (loi * 2.1 * cung + quang * 0.34) * uManh;
    float a = exp(-dp * dp / 16.0) * 0.42 * min(uManh, 1.0);
    gl_FragColor = vec4(c * uHien, a * uHien);
  }`;

// Đĩa lưới mờ trên mặt phẳng ràng buộc quanh tay nắm (hiện khi rê tới và khi kéo).
const DINH_DIA = /* glsl */ `
  varying vec2 vP;
  void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MANH_DIA = /* glsl */ `
  uniform vec3 uMau;
  uniform vec2 uDoi;
  uniform float uR, uO, uHien;
  varying vec2 vP;
  void main() {
    float r = length(vP);
    if (r > 1.0) discard;
    float mo = 1.0 - smoothstep(0.2, 1.0, r);
    vec2 g = (vP * uR + uDoi) / uO;
    vec2 w = max(fwidth(g), vec2(1e-5));
    vec2 a = abs(fract(g - 0.5) - 0.5) / w;
    float net = 1.0 - min(min(a.x, a.y), 1.0);
    float vong = 1.0 - smoothstep(0.0, fwidth(r) * 1.5, abs(r - 0.55));
    vec3 c = uMau * (net * 0.55 + 0.05 + vong * 0.4) * mo;
    gl_FragColor = vec4(c * uHien, 0.0);
  }`;

function vatLieuNhanSan(uniforms, vertexShader, fragmentShader, { sauTest = false } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    transparent: true, depthWrite: false, depthTest: sauTest, premultipliedAlpha: true, blending: THREE.NormalBlending,
  });
  m.tuyenTinh = true;
  return m;
}
const taoVatLieuTay = (mau) => vatLieuNhanSan({
  uMau: { value: mau.clone() }, uLoi: { value: 1 / HE_SO_O }, uPx: { value: 0.02 }, uGio: { value: 0 },
  uRe: { value: 0 }, uKeo: { value: 0 }, uChon: { value: 0 }, uKhoa: { value: 0 }, uHien: { value: 0 }, uMoi: { value: 1 },
}, DINH_TAM, MANH_TAY);
const taoVatLieuVong = (mau) => vatLieuNhanSan({
  uMau: { value: new THREE.Color(mau) }, uR: { value: 0.7 }, uPx: { value: 0.02 }, uHien: { value: 0 },
  uGio: { value: 0 }, uManh: { value: 1 }, uCung: { value: 1 },
}, DINH_TAM, MANH_VONG);

// ---------------- Kiểu trình bày (chèn một lần) ----------------
const CSS = `
.vt-lop { position: fixed; inset: 0; pointer-events: none; z-index: var(--lop-tuong-tac, 18); overflow: hidden; }
.vt-lop > * { position: absolute; left: 0; top: 0; will-change: transform; }
.vt-cg { position: fixed; left: 0; top: 0; z-index: var(--lop-chu-giai, 24); pointer-events: none; will-change: transform; }
.vt-cg[hidden] { display: none !important; }
.vt-cg-trong { min-width: 128px; max-width: 290px; padding: 8px 12px 9px; border-radius: 11px;
  background: linear-gradient(180deg, rgba(20, 22, 34, 0.9), rgba(9, 10, 17, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.13);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  color: var(--chu, #eceae4); font: 12.5px/1.5 var(--chu-he, -apple-system, system-ui, sans-serif);
  opacity: 0; transform: translateY(5px) scale(0.97); transform-origin: 0 0;
  transition: opacity 0.16s ease-out, transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1); }
.vt-cg.hien .vt-cg-trong { opacity: 1; transform: none; }
.vt-cg.trai .vt-cg-trong { transform-origin: 100% 0; }
.vt-cg-ten { display: flex; align-items: center; gap: 8px; font-weight: 650; font-size: 13px; color: #fff; letter-spacing: 0.005em; white-space: nowrap; }
.vt-cg-ten i { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--m); box-shadow: 0 0 0 3px color-mix(in srgb, var(--m) 22%, transparent), 0 0 10px var(--m); }
.vt-cg-mo-ta { color: var(--chu-mo, #b0b2bd); margin-top: 3px; }
.vt-cg-ten + .vt-cg-mo-ta { padding-left: 16px; }
.vt-cg-mo-ta b, .vt-cg-mo-ta strong { color: var(--chu, #eceae4); font-weight: 600; }
.vt-cg-mo-ta .so { font-variant-numeric: tabular-nums; color: var(--chu, #eceae4); font-weight: 600; white-space: nowrap; }
.vt-cg-goi { margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255, 255, 255, 0.07); font-size: 11px; color: var(--chu-nhat, #7a7d8b); white-space: nowrap; }
.vt-cg-goi kbd { font: 10.5px var(--chu-so, ui-monospace, monospace); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 4px; padding: 0 4px; color: var(--chu-mo, #b0b2bd); }
.vt-nhan { display: flex; align-items: center; gap: 6px; padding: 3px 11px 4px 8px; border-radius: 999px; white-space: nowrap;
  background: rgba(10, 11, 19, 0.76); border: 1px solid color-mix(in srgb, var(--m) 40%, rgba(255, 255, 255, 0.08));
  color: #f4f2ec; font: 600 12px/1.3 var(--chu-he, -apple-system, system-ui, sans-serif); letter-spacing: 0.005em;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45), 0 0 14px color-mix(in srgb, var(--m) 14%, transparent); transition: opacity 0.4s ease; }
.vt-nhan .mui { color: var(--m); font-size: 11px; display: inline-block; animation: vt-moi 1.7s ease-in-out infinite; text-shadow: 0 0 6px var(--m); }
.vt-nhan.tat { opacity: 0; }
.vt-nhan.b1 { flex-direction: row-reverse; padding: 3px 8px 4px 11px; }
.vt-nhan.b1 .mui { animation-name: vt-moi-phai; }
.vt-nhan.b2 .mui { animation-name: vt-moi-len; }
.vt-nhan.b3 .mui { animation-name: vt-moi-xuong; }
body.xv-dang-xem .vt-nhan { display: none !important; }
@keyframes vt-moi { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-3px); } }
@keyframes vt-moi-phai { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
@keyframes vt-moi-len { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
@keyframes vt-moi-xuong { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(2px); } }
.vt-gy { max-width: 300px; padding: 9px 13px 10px; border-radius: 12px;
  background: linear-gradient(180deg, rgba(24, 22, 16, 0.92), rgba(11, 11, 17, 0.92));
  border: 1px solid rgba(243, 198, 111, 0.42); color: var(--chu, #eceae4);
  font: 13px/1.5 var(--chu-he, -apple-system, system-ui, sans-serif);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.5), 0 0 26px rgba(243, 198, 111, 0.1); transition: opacity 0.35s ease; opacity: 0; }
.vt-gy b { color: var(--vang, #f3c66f); font-weight: 650; }
.vt-gy.hien { opacity: 1; }
.vt-gy::after { content: ""; position: absolute; left: var(--duoi, 50%); bottom: -6px; width: 10px; height: 10px; margin-left: -6px;
  background: rgba(11, 11, 17, 0.96); border: solid rgba(243, 198, 111, 0.6); border-width: 0 1px 1px 0; transform: rotate(45deg); }
.vt-gy.duoi::after { bottom: auto; top: -6px; border-width: 1px 0 0 1px; background: rgba(24, 22, 16, 0.96); }
.vt-gy.khong-duoi::after { display: none; }
.vt-diem { width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; background: var(--vang, #f3c66f);
  box-shadow: 0 0 10px var(--vang, #f3c66f); transition: opacity 0.35s ease; opacity: 0; }
.vt-diem.hien { opacity: 1; }
.vt-diem::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 1.5px solid var(--vang, #f3c66f); animation: vt-loang 1.8s ease-out infinite; }
@keyframes vt-loang { from { transform: scale(0.5); opacity: 0.9; } to { transform: scale(2.2); opacity: 0; } }
`;

let soPhien = 0;
let theKieu = null;

export class TuongTac {
  constructor(app) {
    this.app = app;
    this.cv = app.renderer.domElement;
    this.scene = null;
    this.nhom = new THREE.Group();
    this.nhom.name = 'tuong-tac';
    this._ds = [];          // vật rê, bấm được
    this._tay = [];         // tay nắm
    this._gy = [];          // bong bóng gợi ý
    this._gio = 0;
    this._re = null;        // bản ghi đang được rê
    this._keo = null;       // { t, id, offX, offY, diXa, dkCu, x, y }
    this._bam = null;       // lần ấn xuống trên vật (chờ xem có thành cú bấm không)
    this._chon = null;      // tay nắm đang được chọn (phím mũi tên)
    this._nhich = null;     // tay nắm đang được nhích bằng phím
    this._con = { x: 0, y: 0, trong: false, nut: 0, cham: false };
    this._khung = { x: 0, y: 0, w: 1, h: 1 };
    this._bang = null;      // hình chữ nhật bảng bài giảng (nếu có)
    this._choDo = 0;        // đếm giờ đọc lại khung vẽ, bảng
    this._choTim = 0;       // đếm giờ dò lại vật dưới con trỏ
    this._amRe = 0;
    this._conTro = null;
    this.ray = new THREE.Raycaster();
    this._kq = [];
    this._mCam = new THREE.Matrix4();
    this._mChieu = new THREE.Matrix4();

    // Hình phụ dùng chung.
    this._vuong = new THREE.PlaneGeometry(2, 2);
    this._vong = new THREE.Mesh(this._vuong, taoVatLieuVong(MAU_MAC_DINH));
    this._vong.renderOrder = 950;
    this._vong.frustumCulled = false;
    this._vong.visible = false;
    this._vongRec = null;
    this._vongHien = 0;
    this._vongCau = new THREE.Mesh(this._vuong, taoVatLieuVong(MAU_MAC_DINH));
    this._vongCau.material.uniforms.uCung.value = 0;
    this._vongCau.material.uniforms.uManh.value = 0.4;
    this._vongCau.renderOrder = 940;
    this._vongCau.frustumCulled = false;
    this._vongCau.visible = false;
    this._dia = new THREE.Mesh(new THREE.CircleGeometry(1, 72), vatLieuNhanSan({
      uMau: { value: new THREE.Color(MAU_MAC_DINH) }, uDoi: { value: new THREE.Vector2() },
      uR: { value: 1 }, uO: { value: 0.25 }, uHien: { value: 0 },
    }, DINH_DIA, MANH_DIA, { sauTest: true }));
    this._dia.renderOrder = 900;
    this._dia.frustumCulled = false;
    this._dia.visible = false;
    this._duong = [0, 1].map(() => {
      const d = new DuongDay(2, { mau: MAU_MAC_DINH, rong: 1.4, moDan: true, doMo: 0 });
      d.line.renderOrder = 905;
      d.line.visible = false;
      return d;
    });
    this._huongDanRec = null;
    this._huongDanHien = 0;
    this.nhom.add(this._vong, this._vongCau, this._dia, ...this._duong.map((d) => d.line));

    // DOM: lớp nhãn, ô chú giải, kiểu trình bày.
    if (soPhien++ === 0 || !theKieu?.isConnected) {
      theKieu = document.createElement('style');
      theKieu.dataset.vt = 'tuong-tac';
      theKieu.textContent = CSS;
      document.head.append(theKieu);
    }
    this.lop = document.createElement('div');
    this.lop.className = 'vt-lop';
    this.cg = document.createElement('div');
    this.cg.className = 'vt-cg';
    this.cg.hidden = true;
    this.cg.innerHTML = '<div class="vt-cg-trong"></div>';
    this._cgTrong = this.cg.firstChild;
    this._cgTt = { rec: null, cho: -1, hien: false, x: 0, y: 0, w: 0, h: 0, viet: '' };
    document.body.append(this.lop, this.cg);

    // Sự kiện. Gắn ở pha bắt (capture) để chạy TRƯỚC OrbitControls và móc cũ của ứng dụng trên cùng khung vẽ.
    this._h = {
      xuong: (e) => this._xuong(e),
      di: (e) => this._di(e),
      len: (e) => this._len(e),
      huyCon: (e) => this._huyCon(e),
      matBat: (e) => { if (this._keo && e.pointerId === this._keo.id) this._ketThucKeo(e, true); },
      roi: (e) => this._roi(e),
      mo: () => { if (this._keo) this._ketThucKeo(null, true); this._xongNhich(); },
      phim: (e) => this._phim(e),
      phimLen: (e) => this._phimLen(e),
      doi: () => { this._choDo = 0; },
    };
    const cv = this.cv, h = this._h;
    cv.addEventListener('pointerdown', h.xuong, true);
    cv.addEventListener('pointermove', h.di, true);
    cv.addEventListener('pointerup', h.len, true);
    cv.addEventListener('pointercancel', h.huyCon, true);
    cv.addEventListener('lostpointercapture', h.matBat);
    cv.addEventListener('pointerleave', h.roi);
    window.addEventListener('blur', h.mo);
    window.addEventListener('keydown', h.phim, true);
    window.addEventListener('keyup', h.phimLen, true);
    window.addEventListener('resize', h.doi);
    this._daHuy = false;
  }

  get dangKeo() { return !!this._keo; }

  // ================= Vòng đời =================
  // Ứng dụng gọi theo thứ tự: xoaHet() → bai.tao(app) (bài gọi them, tayNam ngay trong đó) → datCanh(canh.scene).
  // Vì vậy datCanh KHÔNG xoá đăng ký: tay nắm tạo trước đó đã nằm sẵn trong nhóm hình phụ, chỉ cần gắn nhóm vào cảnh.
  datCanh(scene) {
    scene = scene || null;
    if (scene === this.scene && (!scene || this.nhom.parent === scene)) return;
    if (this._keo) this._ketThucKeo(null, true, true);
    this.nhom.removeFromParent();
    this.scene = scene;
    if (scene) scene.add(this.nhom);
    this._choDo = 0;
  }

  xoaHet() {
    if (this._keo) this._ketThucKeo(null, true, true);
    this._nhich = null;
    this._chon = null;
    this._bam = null;
    this._re = null;
    for (const t of this._tay) this._goTay(t);
    this._tay.length = 0;
    this._ds.length = 0;
    for (const g of this._gy) g.el.remove(), g.diem?.remove();
    this._gy.length = 0;
    this._anChuGiai(true);
    this._vong.visible = false; this._vongRec = null; this._vongHien = 0;
    this._anHuongDan(true);
    this._datConTro();
  }

  huy() {
    if (this._daHuy) return;
    this.xoaHet();
    this._daHuy = true;
    const cv = this.cv, h = this._h;
    cv.removeEventListener('pointerdown', h.xuong, true);
    cv.removeEventListener('pointermove', h.di, true);
    cv.removeEventListener('pointerup', h.len, true);
    cv.removeEventListener('pointercancel', h.huyCon, true);
    cv.removeEventListener('lostpointercapture', h.matBat);
    cv.removeEventListener('pointerleave', h.roi);
    window.removeEventListener('blur', h.mo);
    window.removeEventListener('keydown', h.phim, true);
    window.removeEventListener('keyup', h.phimLen, true);
    window.removeEventListener('resize', h.doi);
    cv.style.cursor = '';
    this.lop.remove();
    this.cg.remove();
    if (--soPhien <= 0) { soPhien = 0; theKieu?.remove(); theKieu = null; }
    this.nhom.removeFromParent();
    this._vuong.dispose();
    this._dia.geometry.dispose();
    for (const m of [this._vong, this._vongCau, this._dia]) m.material.dispose();
    for (const d of this._duong) { d.geo.dispose(); d.mat.dispose(); }
    this.scene = null;
  }

  // ================= Đăng ký =================
  them(vat, tc = {}) {
    const rec = {
      loai: 'vat', vat, tc, an: false, mau: new THREE.Color(tc.mau ?? MAU_MAC_DINH),
      cuc: new THREE.Vector3(), rCuc: 0,
    };
    this._ds.push(rec);
    return {
      vat,
      huy: () => {
        const i = this._ds.indexOf(rec);
        if (i < 0) return;
        this._ds.splice(i, 1);
        this._boRec(rec);
      },
      an: (b = true) => { rec.an = !!b; if (rec.an) this._boRec(rec); },
    };
  }

  tayNam(tc = {}) {
    const mau = new THREE.Color(tc.mau ?? MAU_MAC_DINH);
    const goc = new THREE.Group();
    goc.name = 'tay-nam';
    veVector(tc.viTri ?? [0, 0, 0], goc.position);
    const mat = taoVatLieuTay(mau);
    const mesh = new THREE.Mesh(this._vuong, mat);
    mesh.renderOrder = 1000;
    mesh.frustumCulled = false;
    goc.add(mesh);
    this.nhom.add(goc);
    const t = {
      loai: 'tay', vat: goc, mesh, mat, tc, mau, co: tc.co ?? 0.16,
      an: false, khoa: false, daKeo: false, reK: 0, keoK: 0, chonK: 0, hienK: 0, rPx: LOI_TOI_THIEU_PX,
      rb: this._chuanRangBuoc(tc.rangBuoc), matTuDo: new THREE.Plane(), matSau: false,
      hut: (tc.hut || []).map((p) => veVector(p, new THREE.Vector3())).filter(Boolean),
      khoangHut: tc.khoangHut, hutDang: -1, mocHut: null,
      nhanEl: null, nhanW: 0, nhanH: 0, nhanTat: 0, nhanX: NaN, nhanY: NaN, nhanHien: null, nhanBen: null, nhanHop: [0, 0, 0, 0],
    };
    if (tc.nhan) {
      const el = document.createElement('div');
      el.className = 'vt-nhan';
      el.style.setProperty('--m', `#${mau.getHexString()}`);
      el.innerHTML = `<span class="mui">◀</span><span>${tc.nhan}</span>`;
      el.style.visibility = 'hidden';
      this.lop.append(el);
      t.nhanEl = el;
    }
    this._tay.push(t);
    const tt = this;
    const api = {
      vat: goc,
      get viTri() { return goc.position; },
      dat(p, goi = false) {
        if (!veVector(p, goc.position)) return api;
        if (goi) tt._goi(tc.khiKeo, goc.position.clone(), null);
        return api;
      },
      an(b = true) {
        t.an = !!b;
        goc.visible = !t.an;
        if (t.an) tt._boRec(t);
        return api;
      },
      khoa(b = true) {
        t.khoa = !!b;
        if (t.khoa) tt._boRec(t);
        return api;
      },
      huy() {
        const i = tt._tay.indexOf(t);
        if (i < 0) return;
        tt._boRec(t);
        tt._tay.splice(i, 1);
        tt._goTay(t);
      },
    };
    t.api = api;
    return api;
  }

  goiY(html, viTri = null, { giay = 6 } = {}) {
    const el = document.createElement('div');
    el.className = 'vt-gy';
    el.innerHTML = html;
    this.lop.append(el);
    // Gợi ý chỉ vào một tay nắm: đặt bong bóng cao hơn vòng của tay nắm, không cần đốm đánh dấu.
    const tay = viTri?.isObject3D ? this._tay.find((t) => t.vat === viTri) || null : null;
    let diem = null;
    if (viTri != null && !tay) {
      diem = document.createElement('div');
      diem.className = 'vt-diem';
      this.lop.append(diem);
    } else el.classList.add('khong-duoi');
    const g = {
      el, diem, nguon: viTri, tay, viTri: new THREE.Vector3(), con: giay > 0 ? giay : Infinity, tat: -1,
      w: el.offsetWidth, h: el.offsetHeight, x: NaN, y: NaN, dx: NaN, dy: NaN, duoi: null, vao: 0,
    };
    el.style.visibility = 'hidden';
    if (diem) diem.style.visibility = 'hidden';
    this._gy.push(g);
    return {
      huy: () => {
        const i = this._gy.indexOf(g);
        if (i >= 0) { this._gy.splice(i, 1); el.remove(); diem?.remove(); }
      },
    };
  }

  // ================= Mỗi khung hình =================
  capNhat(dt = 0) {
    if (!this.scene || this._daHuy) return;
    dt = Math.min(Math.max(+dt || 0, 0), 0.25);
    this._gio += dt;
    const cam = this.app.camera;
    cam.updateMatrixWorld();
    this._choDo -= dt;
    if (this._choDo <= 0) { this._docKhung(); this._choDo = 0.5; }

    // Máy quay còn trôi (quán tính) hay tâm hình đang dời trong lúc kéo: đặt lại tay nắm dưới con trỏ.
    const k = this._keo;
    if (k) {
      if (!this._mCam.equals(cam.matrixWorld) || !this._mChieu.equals(cam.projectionMatrix)) {
        this._mCam.copy(cam.matrixWorld); this._mChieu.copy(cam.projectionMatrix);
        this._apDungKeo(k.x, k.y, null);
      }
    } else if (this._con.trong && this._con.nut === 0 && !this._con.cham) {
      this._choTim -= dt;
      if (this._choTim <= 0) { this._choTim = 0.1; this._datRe(this._tim(this._con.x, this._con.y)); }
    }

    const m = 1 - Math.exp(-dt * 14);
    for (const t of this._tay) this._veTay(t, dt, m);
    this._veVongNoiBat(m);
    this._veHuongDan(m);
    this._veChuGiai(dt);
    for (let i = this._gy.length - 1; i >= 0; i--) this._veGoiY(this._gy[i], dt, i);
  }

  // ================= Con trỏ =================
  _docKhung() {
    const r = this.cv.getBoundingClientRect();
    const kh = this._khung;
    kh.x = r.left; kh.y = r.top; kh.w = r.width || this.app.rong || 1; kh.h = r.height || this.app.cao || 1;
    const b = document.getElementById('bai-hoc');
    if (!b || document.body.classList.contains('an-bang')) { this._bang = null; return; }
    const rb = b.getBoundingClientRect();
    this._bang = rb.width > 0 && rb.right > 0 && rb.left < window.innerWidth ? rb : null;
  }

  _toaDo(e) {
    const r = this.cv.getBoundingClientRect();
    const kh = this._khung;
    kh.x = r.left; kh.y = r.top; kh.w = r.width || 1; kh.h = r.height || 1;
    this._con.x = e.clientX - r.left;
    this._con.y = e.clientY - r.top;
  }

  _xuong(e) {
    if (!this.scene || this._daHuy) return;
    this._toaDo(e);
    this._con.trong = true;
    this._con.nut = e.buttons || 1;
    this._con.cham = e.pointerType === 'touch';
    if (this._keo) { if (e.pointerId !== this._keo.id) e.vtDaXuLy = true; return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;     // chuột phải, giữa: để máy quay dời, xoay
    this.app.camera.updateMatrixWorld();
    const rec = this._tim(this._con.x, this._con.y);
    if (this._chon && rec !== this._chon) this._boChon();
    if (rec?.loai === 'tay') {
      e.vtDaXuLy = true;
      this._batDauKeo(rec, e);
      return;
    }
    if (rec?.loai === 'vat') {
      this._bam = { rec, id: e.pointerId, x: this._con.x, y: this._con.y, t: performance.now() };
      if (this._con.cham) this._datRe(rec);
    } else if (this._con.cham) this._datRe(null);
    this._anChuGiai();
  }

  _di(e) {
    if (!this.scene || this._daHuy) return;
    const k = this._keo;
    if (k && e.pointerId !== k.id) return;
    this._toaDo(e);
    this._con.trong = true;
    this._con.nut = e.buttons;
    if (k) {
      e.vtDaXuLy = true;
      if (Math.hypot(this._con.x - k.x0, this._con.y - k.y0) > 2) k.diXa = true;
      k.x = this._con.x; k.y = this._con.y;
      this._apDungKeo(k.x, k.y, e);
      return;
    }
    if (e.pointerType === 'touch') return;
    if (e.buttons) {                                     // đang xoay máy quay: tạm thôi nổi bật
      if (this._bam && Math.hypot(this._con.x - this._bam.x, this._con.y - this._bam.y) >= NGUONG_BAM_PX) this._bam = null;
      if (this._re) this._datRe(null);
      return;
    }
    this._con.cham = false;
    // Không dò vật ở MỌI lần chuột nhúc nhích (màn hình 120 Hz bắn hơn trăm lần mỗi giây, mỗi lần dò phải thử hàng chục
    // nghìn tam giác): nhiều nhất khoảng 30 lần mỗi giây, lần bị bỏ thì hẹn dò ở khung hình tới.
    // (Sự kiện do bộ kiểm tự phát, isTrusted = false, vẫn dò ngay để bộ kiểm xét được kết quả tức thì.)
    const luc = performance.now();
    if (!e.isTrusted || luc - (this._lucTim || 0) >= 30) {
      this._lucTim = luc;
      this._datRe(this._tim(this._con.x, this._con.y));
      this._choTim = 0.1;
    } else if (this._choTim > 0.03) this._choTim = 0.03;
  }

  _len(e) {
    if (!this.scene || this._daHuy) return;
    this._toaDo(e);
    this._con.nut = 0;
    const k = this._keo;
    if (k) {
      if (e.pointerId !== k.id) return;
      e.vtDaXuLy = true;
      this._ketThucKeo(e, false);
      return;
    }
    const b = this._bam;
    this._bam = null;
    if (!b || b.id !== e.pointerId) return;
    if (Math.hypot(this._con.x - b.x, this._con.y - b.y) >= NGUONG_BAM_PX || performance.now() - b.t > NGUONG_BAM_MS) return;
    if (!b.rec.tc.khiBam || !this._ds.includes(b.rec)) return;
    this.app.camera.updateMatrixWorld();
    if (this._tim(this._con.x, this._con.y) !== b.rec) return;
    e.vtDaXuLy = true;
    this._am('bam', { doTo: 0.6 });
    this._goi(b.rec.tc.khiBam, e);
  }

  _huyCon(e) {
    this._con.nut = 0;
    this._bam = null;
    if (this._keo && e.pointerId === this._keo.id) { e.vtDaXuLy = true; this._ketThucKeo(e, true); }
  }

  _roi(e) {
    if (this._keo || e.pointerType === 'touch') return;
    this._con.trong = false;
    this._datRe(null);
  }

  // ================= Dò vật dưới con trỏ =================
  // Tay nắm thắng vật thường; cùng loại thì vật gần máy quay hơn thắng.
  _tim(x, y) {
    if (!this.scene) return null;
    const cam = this.app.camera;
    let tot = null, sau = Infinity;
    for (const t of this._tay) {
      if (t.an || t.khoa || !this._hien(t.vat)) continue;
      t.vat.getWorldPosition(_v1);
      if (!this._manHinh(_v1)) continue;
      // Ngón tay che mất chỗ chạm và kém chính xác hơn chuột: vùng bắt tay nắm rộng ít nhất 48 điểm ảnh (chuột: 30).
      const r = Math.max(this._con.cham ? 24 : 15, this._rLoiPx(t, _v1) * 2.1 + 5);
      if (Math.hypot(_q.x - x, _q.y - y) > r) continue;
      const s = cam.position.distanceTo(_v1);
      if (s < sau) { sau = s; tot = t; }
    }
    if (tot) return tot;
    if (!this._ds.length) return null;
    this._datTia(x, y);
    const ray = this.ray;
    const wpp = this._wpp(cam.position.distanceTo(this.app.dk?.target ?? _v2.set(0, 0, 0)));
    ray.params.Line.threshold = wpp * 4;
    ray.params.Points.threshold = wpp * 5;
    if (ray.params.Line2) ray.params.Line2.threshold = 4;
    for (const v of this._ds) {
      if (v.an || !this._hien(v.vat)) continue;
      let s = Infinity;
      if (v.tc.banKinhPx > 0) {
        v.vat.getWorldPosition(_v1);
        if (this._manHinh(_v1) && Math.hypot(_q.x - x, _q.y - y) <= v.tc.banKinhPx) s = cam.position.distanceTo(_v1);
      }
      if (s === Infinity) {
        this._kq.length = 0;
        try { ray.intersectObject(v.vat, true, this._kq); } catch { /* vật lạ không dò tia được: bỏ qua */ }
        for (const h of this._kq) if (this._hien(h.object)) { s = h.distance; break; }
        this._kq.length = 0;
      }
      if (s < sau) { sau = s; tot = v; }
    }
    return tot;
  }

  _hien(o) {
    while (o) {
      if (!o.visible) return false;
      if (o === this.scene) return true;
      o = o.parent;
    }
    return false;
  }

  // Chiếu điểm thế giới lên khung vẽ: _q.x, _q.y (điểm ảnh), _q.z (NDC). false nếu sau lưng máy quay.
  _manHinh(p) {
    _q.copy(p).project(this.app.camera);
    if (!(_q.z > -1 && _q.z < 1)) return false;
    const kh = this._khung;
    _q.x = (_q.x + 1) * 0.5 * kh.w;
    _q.y = (1 - _q.y) * 0.5 * kh.h;
    return true;
  }

  _datTia(x, y) {
    const kh = this._khung;
    _ndc.set((x / kh.w) * 2 - 1, -(y / kh.h) * 2 + 1);
    this.ray.setFromCamera(_ndc, this.app.camera);
    return this.ray.ray;
  }

  // Đơn vị thế giới trên một điểm ảnh, ở độ sâu d trước máy quay.
  _wpp(d) {
    const cam = this.app.camera;
    if (cam.isOrthographicCamera) return (cam.top - cam.bottom) / cam.zoom / this._khung.h;
    return (2 * Math.max(d, 1e-9) * Math.tan((cam.fov * Math.PI) / 360)) / (cam.zoom * this._khung.h);
  }
  _doSau(p) { return -_v4.copy(p).applyMatrix4(this.app.camera.matrixWorldInverse).z; }
  _rLoiPx(t, p) {
    const d = this._doSau(p);
    if (d <= 0) return LOI_TOI_THIEU_PX;
    return Math.max(t.co / this._wpp(d), LOI_TOI_THIEU_PX) * (1 + 0.2 * t.reK);
  }

  // ================= Rê =================
  _datRe(rec) {
    if (rec === this._re) return;
    const cu = this._re;
    this._re = rec;
    if (cu) this._goi(cu.tc.khiRe, false);
    if (rec) {
      this._goi(rec.tc.khiRe, true);
      const bay = performance.now();
      if (bay - this._amRe > 90) { this._amRe = bay; this._am('re', { doTo: 0.45 }); }
      if (rec.loai === 'vat') this._doCau(rec);
    }
    this._anChuGiai();
    if (rec && this._noiDungChuGiai(rec)) this._cgTt.cho = TRE_CHU_GIAI;
    this._datConTro();
  }

  _datConTro() {
    let c = '';
    if (this._keo) c = 'grabbing';
    else if (this._re?.loai === 'tay') c = 'grab';
    else if (this._re) c = this._re.tc.conTro || 'pointer';
    if (c !== this._conTro) { this._conTro = c; this.cv.style.cursor = c; }
  }

  // Bỏ một bản ghi khỏi mọi trạng thái (rê, chọn, kéo) khi nó bị ẩn, khoá hay huỷ.
  _boRec(rec, goiTha = true) {
    if (this._keo?.t === rec) this._ketThucKeo(null, true, !goiTha);
    if (this._nhich === rec) this._xongNhich();
    if (this._chon === rec) this._chon = null;
    if (this._bam?.rec === rec) this._bam = null;
    if (this._re === rec) this._datRe(null);
    if (this._vongRec === rec) { this._vongRec = null; this._vongHien = 0; this._vong.visible = false; }
    if (this._huongDanRec === rec) this._anHuongDan(true);
  }

  _goTay(t) {
    t.vat.removeFromParent();
    t.mat.dispose();
    if (t.mocHut) for (const m of t.mocHut) { m.removeFromParent(); m.material.dispose(); }
    t.mocHut = null;
    t.nhanEl?.remove();
    t.nhanEl = null;
  }

  // Khối cầu bao của vật, tính trong hệ toạ độ riêng của vật (để vòng sáng bám theo vật đang chuyển động).
  _doCau(rec) {
    rec.vat.updateWorldMatrix(true, true);
    // Hợp các khối cầu bao của từng hình (đúng hơn hộp bao: hộp của quả cầu xoay sẽ phình ra √3 lần).
    let co = false;
    rec.vat.traverse((o) => {
      const g = o.geometry;
      if (!g || !o.visible || o.isCSS2DObject) return;
      if (!g.boundingSphere) { try { g.computeBoundingSphere(); } catch { return; } }
      const bs = g.boundingSphere;
      if (!bs || !Number.isFinite(bs.radius) || bs.radius < 0) return;
      const s = _cau2.copy(bs).applyMatrix4(o.matrixWorld);
      if (!co) { _cau.copy(s); co = true; } else _cau.union(s);
    });
    if (!co) { rec.cuc.set(0, 0, 0); rec.rCuc = 0; return; }
    rec.cuc.copy(_cau.center);
    rec.vat.worldToLocal(rec.cuc);
    rec.rCuc = _cau.radius / Math.max(rec.vat.matrixWorld.getMaxScaleOnAxis(), 1e-12);
  }

  // ================= Kéo =================
  _chuanRangBuoc(rb = {}) {
    const kieu = rb?.kieu || 'tu-do';
    const r = { kieu };
    if (kieu === 'mat-phang') {
      const n = veVector(rb.phap ?? [0, 1, 0], new THREE.Vector3()).normalize();
      if (n.lengthSq() < 0.5) n.set(0, 1, 0);
      r.phap = n;
      r.qua = veVector(rb.qua ?? [0, 0, 0], new THREE.Vector3());
      r.mat = new THREE.Plane().setFromNormalAndCoplanarPoint(n, r.qua);
    } else if (kieu === 'duong') {
      r.qua = veVector(rb.qua ?? [0, 0, 0], new THREE.Vector3());
      r.huong = veVector(rb.huong ?? [1, 0, 0], new THREE.Vector3()).normalize();
      if (r.huong.lengthSq() < 0.5) r.huong.set(1, 0, 0);
    } else if (kieu === 'mat-cau') {
      r.tam = veVector(rb.tam ?? [0, 0, 0], new THREE.Vector3());
      r.banKinh = Math.max(+rb.banKinh || 1, 1e-9);
    } else if (kieu === 'ham') {
      r.chieu = typeof rb.chieu === 'function' ? rb.chieu : null;
    } else r.kieu = 'tu-do';
    return r;
  }

  _batDauKeo(t, e) {
    const dk = this.app.dk;
    const p = t.vat.position;
    this._manHinh(t.vat.getWorldPosition(_v1));
    const cam = this.app.camera;
    this._keo = {
      t, id: e.pointerId, offX: _q.x - this._con.x, offY: _q.y - this._con.y,
      x0: this._con.x, y0: this._con.y, x: this._con.x, y: this._con.y, diXa: false, dkCu: dk ? dk.enabled : true,
      xa: Math.max(cam.position.distanceTo(p), cam.position.distanceTo(dk?.target ?? p)) * 40 + 1e-6,
    };
    if (dk) dk.enabled = false;
    try { this.cv.setPointerCapture(e.pointerId); } catch { /* con trỏ tổng hợp: không bắt được, không sao */ }
    this._mCam.copy(cam.matrixWorld); this._mChieu.copy(cam.projectionMatrix);
    if (t.rb.kieu === 'tu-do') {
      cam.getWorldDirection(_v2);
      t.matTuDo.setFromNormalAndCoplanarPoint(_v2, p);
    } else if (t.rb.kieu === 'mat-cau') {
      _v2.subVectors(p, t.rb.tam); _v3.subVectors(p, cam.position);
      t.matSau = _v2.dot(_v3) > 0;
    }
    t.hutDang = -1;
    this._datRe(t);
    this._anChuGiai();
    this._datConTro();
    if (t.hut.length && !t.mocHut) this._taoMocHut(t);
    this._am('nam', { doTo: 0.7 });
    this._goi(t.tc.khiNam, p.clone());
  }

  // Áp vị trí con trỏ (sx, sy: điểm ảnh trong khung vẽ) lên tay nắm đang kéo.
  _apDungKeo(sx, sy, e) {
    const k = this._keo;
    if (!k) return;
    const t = k.t;
    if (!this._chieu(t, sx + k.offX, sy + k.offY, _v3, k.xa)) return;
    this._hoanTat(t, _v3, sx + k.offX, sy + k.offY, true);
    t.vat.position.copy(_v3);
    this._goi(t.tc.khiKeo, _v3.clone(), e);
  }

  // Ray từ điểm màn hình → điểm trên ràng buộc. Trả về false nếu không chiếu được (giữ vị trí cũ).
  _chieu(t, sx, sy, out, xa = Infinity) {
    const ray = this._datTia(sx, sy);
    const rb = t.rb;
    const cam = this.app.camera;
    let ok = false;
    if (rb.kieu === 'mat-phang' || rb.kieu === 'tu-do') {
      ok = !!ray.intersectPlane(rb.kieu === 'mat-phang' ? rb.mat : t.matTuDo, out);
    } else if (rb.kieu === 'duong') {
      // điểm gần nhau nhất giữa tia (o + s·d) và đường (q + u·huong)
      const d = ray.direction, u = rb.huong;
      _v1.subVectors(ray.origin, rb.qua);
      const b = d.dot(u), dd = d.dot(_v1), ee = u.dot(_v1);
      const mau = 1 - b * b;
      if (mau > 1e-6) {
        const tu = (ee - b * dd) / mau;
        out.copy(rb.qua).addScaledVector(u, tu);
        ok = true;
      }
    } else if (rb.kieu === 'mat-cau') {
      const r = rb.banKinh;
      _v1.subVectors(ray.origin, rb.tam);
      const b = _v1.dot(ray.direction), c = _v1.lengthSq() - r * r, dt = b * b - c;
      if (dt >= 0) {
        const can = Math.sqrt(dt);
        let s = t.matSau ? -b + can : -b - can;
        if (s < 0) s = -b + can;
        if (s >= 0) { ray.at(s, out); ok = true; }
      }
      if (!ok) {
        // tia trượt khỏi mặt cầu: lấy điểm trên đường viền gần tia nhất
        ray.closestPointToPoint(rb.tam, _v2);
        _v2.sub(rb.tam);
        if (_v2.lengthSq() > 1e-18) { out.copy(rb.tam).addScaledVector(_v2.normalize(), r); ok = true; }
      }
    } else if (rb.kieu === 'ham' && rb.chieu) {
      const kq = this._goi(rb.chieu, ray, _v2.copy(t.vat.position));
      ok = !!veVector(kq, out);
    }
    if (!ok || !Number.isFinite(out.x + out.y + out.z)) return false;
    if (rb.kieu !== 'ham' && cam.position.distanceTo(out) > xa) return false;
    return true;
  }

  // Áp gioiHan rồi bắt dính hut. sx, sy: điểm màn hình đang nhắm (để đo khoảng hút theo điểm ảnh).
  _hoanTat(t, out, sx, sy, choHut) {
    if (t.tc.gioiHan) {
      const kq = this._goi(t.tc.gioiHan, out);
      if (kq && kq !== out) veVector(kq, out);
    }
    if (!choHut || !t.hut.length) return;
    let chon = -1, tot = Infinity;
    for (let i = 0; i < t.hut.length; i++) {
      const h = t.hut[i];
      let d;
      if (t.khoangHut > 0) { d = h.distanceTo(out); if (d > t.khoangHut) continue; }
      else { if (!this._manHinh(h)) continue; d = Math.hypot(_q.x - sx, _q.y - sy); if (d > HUT_PX) continue; }
      if (d < tot) { tot = d; chon = i; }
    }
    if (chon >= 0) out.copy(t.hut[chon]);
    if (chon !== t.hutDang) {
      if (chon >= 0) this._am('gat', { doTo: 0.5 });
      t.hutDang = chon;
    }
  }

  _ketThucKeo(e, biHuy, imLang = false) {
    const k = this._keo;
    if (!k) return;
    this._keo = null;
    const t = k.t;
    try { this.cv.releasePointerCapture(k.id); } catch { /* đã nhả */ }
    const dk = this.app.dk;
    if (dk) dk.enabled = k.dkCu === false ? false : true;
    if (k.diXa) t.daKeo = true;
    if (!biHuy && !k.diXa && !this._con.cham) this._chon = t;     // bấm mà không kéo: chọn để nhích bằng phím
    t.hutDang = -1;
    this._datConTro();
    if (imLang) return;
    this._am('tha', { doTo: 0.6 });
    this._goi(t.tc.khiTha, t.vat.position.clone());
    this._choTim = 0;
    if (this._re === t && this._noiDungChuGiai(t)) this._cgTt.cho = TRE_CHU_GIAI * 2;
  }

  _taoMocHut(t) {
    t.mocHut = t.hut.map(() => {
      const m = new THREE.Mesh(this._vuong, taoVatLieuVong(t.mau));
      m.material.uniforms.uCung.value = 0;
      m.renderOrder = 960;
      m.frustumCulled = false;
      m.visible = false;
      this.nhom.add(m);
      return m;
    });
  }

  // ================= Bàn phím: nhích tay nắm đang chọn =================
  _phim(e) {
    const t = this._chon;
    if (!t || this._keo) return;
    if (e.key === 'Escape') { this._boChon(); return; }
    const huong = PHIM_MUI_TEN[e.key];
    if (!huong || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    if (t.an || t.khoa || !this._tay.includes(t) || !this.scene) { this._boChon(); return; }
    e.preventDefault();
    e.stopPropagation();
    const buoc = e.shiftKey ? 24 : 6;
    this.app.camera.updateMatrixWorld();
    const p = t.vat.position;
    if (!this._manHinh(t.vat.getWorldPosition(_v1))) return;
    const sx = _q.x, sy = _q.y;
    let ok = false;
    if (t.rb.kieu === 'duong') {
      // dọc đường: mũi tên nào gần hướng của đường trên màn hình thì đi theo chiều đó
      const u = t.rb.huong;
      const wpp = this._wpp(Math.max(this._doSau(p), 1e-6));
      _v2.copy(p).addScaledVector(u, wpp * 20);
      if (this._manHinh(_v2)) {
        const ux = _q.x - sx, uy = _q.y - sy, dai = Math.hypot(ux, uy);
        if (dai > 1e-3) {
          let dau = (huong[0] * ux + huong[1] * uy) / dai;
          if (Math.abs(dau) < 0.25) dau = huong[0] !== 0 ? huong[0] : -huong[1];
          _v3.copy(p).addScaledVector(u, Math.sign(dau) * buoc * (wpp * 20) / dai);
          ok = true;
        }
      }
    } else {
      ok = this._chieu(t, sx + huong[0] * buoc, sy + huong[1] * buoc, _v3);
    }
    if (!ok) return;
    if (!this._nhich) { this._nhich = t; this._goi(t.tc.khiNam, p.clone()); }
    this._hoanTat(t, _v3, 0, 0, false);
    p.copy(_v3);
    t.daKeo = true;
    this._goi(t.tc.khiKeo, _v3.clone(), e);
  }

  _phimLen(e) { if (this._nhich && PHIM_MUI_TEN[e.key]) this._xongNhich(); }
  _xongNhich() {
    const t = this._nhich;
    if (!t) return;
    this._nhich = null;
    this._goi(t.tc.khiTha, t.vat.position.clone());
  }
  _boChon() { this._xongNhich(); this._chon = null; }

  // ================= Vẽ =================
  _veTay(t, dt, m) {
    const u = t.mat.uniforms;
    const dangKeo = this._keo?.t === t;
    t.hienK += ((t.an ? 0 : 1) - t.hienK) * (1 - Math.exp(-dt * 8));
    t.reK += ((this._re === t || dangKeo ? 1 : 0) - t.reK) * m;
    t.keoK += ((dangKeo ? 1 : 0) - t.keoK) * m;
    t.chonK += ((this._chon === t ? 1 : 0) - t.chonK) * m;
    const cam = this.app.camera;
    const p = t.vat.getWorldPosition(_v1);
    const d = this._doSau(p);
    let thay = !t.an && d > cam.near && this._hien(t.vat);
    if (thay) {
      const wpp = this._wpp(d);
      const rc = Math.max(t.co / wpp, LOI_TOI_THIEU_PX) * (1 + 0.2 * t.reK + 0.08 * t.keoK);
      t.rPx = rc;
      const nua = rc * HE_SO_O;
      t.mesh.scale.setScalar(nua * wpp);
      t.mesh.quaternion.copy(cam.quaternion);
      u.uPx.value = 1 / nua;
      u.uGio.value = this._gio;
      u.uRe.value = t.reK;
      u.uKeo.value = t.keoK;
      u.uChon.value = t.chonK;
      u.uKhoa.value += ((t.khoa ? 1 : 0) - u.uKhoa.value) * m;
      u.uHien.value = t.hienK;
      u.uMoi.value = t.daKeo ? 0.45 : 1;
    }
    t.mesh.visible = thay;

    // Mốc hút: hiện khi đang kéo tay nắm này.
    if (t.mocHut) {
      for (let i = 0; i < t.mocHut.length; i++) {
        const mh = t.mocHut[i];
        const hu = mh.material.uniforms;
        hu.uHien.value += ((dangKeo ? 1 : 0) - hu.uHien.value) * m;
        const dh = this._doSau(t.hut[i]);
        mh.visible = hu.uHien.value > 0.01 && dh > cam.near;
        if (!mh.visible) continue;
        const wpp = this._wpp(dh);
        const R = t.hutDang === i ? 11 : 7, nua = R + 16;
        mh.position.copy(t.hut[i]);
        mh.quaternion.copy(cam.quaternion);
        mh.scale.setScalar(nua * wpp);
        hu.uR.value = R / nua; hu.uPx.value = 1 / nua;
        hu.uManh.value = t.hutDang === i ? 1.3 : 0.55;
      }
    }

    // Nhãn gợi ý cạnh tay nắm: hiện tới lần kéo đầu, hoặc tự ẩn sau khi đã hiện đủ 8 giây (để khỏi che nhãn số liệu của bài).
    const el = t.nhanEl;
    if (!el) return;
    if (t.daKeo || t.nhanLau > 8) {
      if (!t.nhanTat) { el.classList.add('tat'); t.nhanTat = this._gio; }
      else if (this._gio - t.nhanTat > 0.6) { el.remove(); t.nhanEl = null; }
      return;
    }
    // Bảng đang ẩn và lời giảng đang chạy (người học đang ngồi xem): không cần lời mời kéo (CSS ẩn hẳn lớp nhãn này).
    thay = thay && !t.khoa && !dangKeo && !this.app.nghe?.dangXem && this._manHinh(p);
    const cx = this._khung.x + _q.x, cy = this._khung.y + _q.y;
    // Tay nắm nằm dưới bảng bài giảng hoặc ngoài cửa sổ thì không mời kéo.
    if (thay) { const bo = this.app.boNhan; if (cx < 0 || cy < 0 || cx > Math.min(this._khung.x + this._khung.w, bo?.phai ?? Infinity) || cy > Math.min(this._khung.y + this._khung.h, bo?.day ?? Infinity)) thay = false; }
    if (thay) {
      if (!t.nhanW) { t.nhanW = el.offsetWidth; t.nhanH = el.offsetHeight; }
      // Chọn bên đặt nhãn (phải, trái, dưới, trên tay nắm) sao cho không đè nhãn của bài, ô số liệu, bảng bài giảng và
      // nhãn gợi ý của tay nắm khác. Xét lại khoảng 10 lần mỗi giây; chỉ đổi bên khi bên mới thoáng hơn hẳn.
      if (t.nhanBen == null || (t.nhanDem = (t.nhanDem || 0) + 1) % 6 === 0) this._chonBenNhan(t, cx, cy);
      this._hopNhan(t, t.nhanBen, cx, cy, _hop);
      const x = Math.round(_hop[0]), y = Math.round(_hop[1]);
      t.nhanHop[0] = x; t.nhanHop[1] = y; t.nhanHop[2] = x + t.nhanW; t.nhanHop[3] = y + t.nhanH;
      if (x !== t.nhanX || y !== t.nhanY) { t.nhanX = x; t.nhanY = y; el.style.transform = `translate3d(${x}px,${y}px,0)`; }
      el.style.opacity = String(Math.round(t.hienK * 100) / 100);
      t.nhanLau = (t.nhanLau || 0) + Math.min(0.1, Math.max(0, this._gio - (t.nhanGio ?? this._gio)));
    }
    t.nhanGio = this._gio;
    if (thay !== t.nhanHien) { t.nhanHien = thay; el.style.visibility = thay ? '' : 'hidden'; }
  }

  // Hình chữ nhật của nhãn gợi ý nếu đặt ở bên k của tay nắm: 0 phải, 1 trái, 2 dưới, 3 trên.
  _hopNhan(t, k, cx, cy, ra) {
    const xa = t.rPx * 2.3 + 6, W = t.nhanW, H = t.nhanH;
    let x = cx + xa, y = cy - H / 2;
    if (k === 1) x = cx - xa - W;
    else if (k === 2) { x = cx - W / 2; y = cy + xa; }
    else if (k === 3) { x = cx - W / 2; y = cy - xa - H; }
    // Nhích vào phần màn hình còn trống (trong cửa sổ, không chui dưới bảng bài giảng).
    const bo = this.app.boNhan, kh = this._khung;
    x = Math.max(kh.x + 6, Math.min(x, Math.min(kh.x + kh.w - 6, bo?.phai ?? Infinity) - W));
    y = Math.max(kh.y + 6, Math.min(y, Math.min(kh.y + kh.h - 6, bo?.day ?? Infinity) - H));
    ra[0] = x; ra[1] = y; ra[2] = x + W; ra[3] = y + H;
    return ra;
  }

  _chonBenNhan(t, cx, cy) {
    const bo = this.app.boNhan;
    if (!t.nhanHop) t.nhanHop = [0, 0, 0, 0];
    if (!bo?.chong) { t.nhanBen = 0; return; }
    let totBen = 0, totDiem = Infinity, diemDang = Infinity;
    for (let k = 0; k < 4; k++) {
      this._hopNhan(t, k, cx, cy, _hop);
      let d = bo.chong(_hop[0] - 3, _hop[1] - 3, _hop[2] + 3, _hop[3] + 3);
      // Sau khi nhích vào trong mà nhãn lại trùm lên chính tay nắm thì bên này coi như hỏng.
      const r = t.rPx + 4;
      if (cx > _hop[0] - r && cx < _hop[2] + r && cy > _hop[1] - r && cy < _hop[3] + r) d += 6000;
      for (const q of this._tay) {              // nhãn gợi ý của các tay nắm khác đang hiện, và chính các tay nắm đó
        if (q === t || q.an) continue;
        const h = q.nhanHop;
        if (q.nhanHien && h) {
          const w = Math.min(_hop[2], h[2]) - Math.max(_hop[0], h[0]), c = Math.min(_hop[3], h[3]) - Math.max(_hop[1], h[1]);
          if (w > 0 && c > 0) d += 2 * w * c;
        }
      }
      d += k * 0.01;                            // bằng điểm thì ưu tiên phải, trái, dưới, trên
      if (k === t.nhanBen) diemDang = d;
      if (d < totDiem) { totDiem = d; totBen = k; }
    }
    if (t.nhanBen == null || (diemDang > 40 && totDiem < diemDang * 0.5)) {
      if (totBen !== t.nhanBen) {
        t.nhanBen = totBen;
        const el = t.nhanEl;
        el.classList.remove('b1', 'b2', 'b3');
        if (totBen) el.classList.add(`b${totBen}`);
        el.firstChild.textContent = ['◀', '▶', '▲', '▼'][totBen];
      }
    }
  }

  _veVongNoiBat(m) {
    const re = this._re;
    if (re && re.loai === 'vat' && re.tc.noiBat !== false && !re.an) {
      if (this._vongRec !== re) { this._vongRec = re; this._vong.material.uniforms.uMau.value.copy(re.mau); }
    }
    const rec = this._vongRec;
    const v = this._vong;
    if (!rec) { v.visible = false; return; }
    this._vongHien += ((rec === re ? 1 : 0) - this._vongHien) * m;
    if (rec !== re && this._vongHien < 0.01) { this._vongRec = null; v.visible = false; return; }
    const cam = this.app.camera;
    const tam = rec.vat.localToWorld(_v1.copy(rec.cuc));
    const d = this._doSau(tam);
    if (d <= cam.near || !this._hien(rec.vat)) { v.visible = false; return; }
    const wpp = this._wpp(d);
    const rPx = (rec.rCuc * rec.vat.matrixWorld.getMaxScaleOnAxis()) / wpp;
    const R = Math.max(rPx, rec.tc.banKinhPx || 0, 7) + 6;
    const tran = 0.46 * Math.min(this._khung.w, this._khung.h);
    const u = v.material.uniforms;
    u.uHien.value = this._vongHien * (1 - Math.min(1, Math.max(0, (R - tran) / 40)));
    v.visible = u.uHien.value > 0.01;
    if (!v.visible) return;
    const nua = R + 18;
    v.position.copy(tam);
    v.quaternion.copy(cam.quaternion);
    v.scale.setScalar(nua * wpp);
    u.uR.value = R / nua;
    u.uPx.value = 1 / nua;
    u.uGio.value = this._gio;
  }

  // Hình hướng dẫn ràng buộc của tay nắm đang rê hoặc đang kéo: đĩa lưới (mặt phẳng), vệt dọc đường, viền mặt cầu.
  _veHuongDan(m) {
    const t = this._keo?.t || (this._re?.loai === 'tay' ? this._re : null);
    if (t && t !== this._huongDanRec) { this._anHuongDan(true); this._huongDanRec = t; }
    const rec = this._huongDanRec;
    if (!rec) return;
    const muc = rec === t ? (this._keo?.t === t ? 1 : 0.55) : 0;
    this._huongDanHien += (muc - this._huongDanHien) * m;
    if (!t && this._huongDanHien < 0.01) { this._anHuongDan(true); return; }
    const h = this._huongDanHien;
    const cam = this.app.camera;
    const p = rec.vat.getWorldPosition(_v1);
    const d = Math.max(this._doSau(p), cam.near);
    const wpp = this._wpp(d);
    const rb = rec.rb;
    if (rb.kieu === 'mat-phang') {
      const dia = this._dia, u = dia.material.uniforms;
      dia.visible = true;
      const R = 120 * wpp;
      dia.position.copy(p);
      dia.quaternion.setFromUnitVectors(TRUC_Z, rb.phap);
      dia.scale.setScalar(R);
      _v2.copy(TRUC_X).applyQuaternion(dia.quaternion);
      _v3.copy(TRUC_Y).applyQuaternion(dia.quaternion);
      _v4.subVectors(p, rb.qua);
      u.uDoi.value.set(_v4.dot(_v2), _v4.dot(_v3));
      u.uR.value = R;
      // bước lưới tròn số (1, 2, 5 × 10ⁿ), khoảng một phần ba bán kính đĩa
      const muc0 = R / 3.2, mu = Math.pow(10, Math.floor(Math.log10(muc0)));
      u.uO.value = muc0 <= mu ? mu : muc0 <= 2 * mu ? 2 * mu : muc0 <= 5 * mu ? 5 * mu : 10 * mu;
      u.uMau.value.copy(rec.mau);
      u.uHien.value = h;
    } else if (rb.kieu === 'duong') {
      const L = 260 * wpp;
      for (let i = 0; i < 2; i++) {
        const dd = this._duong[i];
        dd.line.visible = true;
        dd.datMau(rec.mau);
        dd.dat(0, p.x, p.y, p.z);
        const s = i ? -L : L;
        dd.dat(1, p.x + rb.huong.x * s, p.y + rb.huong.y * s, p.z + rb.huong.z * s);
        dd.xong(2, 1);
        dd.datDoMo(0.75 * h);
      }
    } else if (rb.kieu === 'mat-cau') {
      const v = this._vongCau, u = v.material.uniforms;
      const dc = this._doSau(rb.tam);
      if (dc > cam.near) {
        const w2 = this._wpp(dc);
        const R = rb.banKinh / w2, nua = R + 16;
        v.visible = true;
        v.position.copy(rb.tam);
        v.quaternion.copy(cam.quaternion);
        v.scale.setScalar(nua * w2);
        u.uR.value = R / nua; u.uPx.value = 1 / nua;
        u.uMau.value.copy(rec.mau);
        u.uHien.value = h;
      } else v.visible = false;
    }
  }

  _anHuongDan(hetHan) {
    this._dia.visible = false;
    this._vongCau.visible = false;
    for (const d of this._duong) d.line.visible = false;
    if (hetHan) { this._huongDanRec = null; this._huongDanHien = 0; }
  }

  // ================= Ô chú giải =================
  _noiDungChuGiai(rec) {
    const tc = rec.tc;
    let moTa = '';
    if (typeof tc.moTa === 'function') moTa = this._goi(tc.moTa) ?? '';
    else if (tc.moTa != null) moTa = tc.moTa;
    const ten = tc.ten ?? (rec.loai === 'tay' ? tc.nhan : null);
    let goi = '';
    if (rec.loai === 'tay') goi = this._chon === rec ? chuCanh("canh.dang-chon-de-nhich-nhich-xa", "Đang chọn · <kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> để nhích, <kbd>⇧</kbd> nhích xa") : rec.khoa ? chuCanh("canh.dang-khoa", "Đang khoá") : chuCanh("canh.keo-de-di-chuyen-bam-de-chon", "Kéo để di chuyển · bấm để chọn");
    if (!ten && !moTa) return '';
    const m = `#${rec.mau.getHexString()}`;
    return `${ten ? `<div class="vt-cg-ten" style="--m:${m}"><i></i>${ten}</div>` : ''}${moTa ? `<div class="vt-cg-mo-ta">${moTa}</div>` : ''}${goi ? `<div class="vt-cg-goi">${goi}</div>` : ''}`;
  }

  _anChuGiai(ngay = false) {
    const c = this._cgTt;
    c.cho = -1;
    if (!c.hien && !ngay) return;
    c.hien = false;
    this.cg.classList.remove('hien');
    if (ngay) { this.cg.hidden = true; c.viet = ''; this._cgTrong.textContent = ''; }
    else c.an = 0.2;
  }

  _veChuGiai(dt) {
    const c = this._cgTt;
    if (c.an > 0) { c.an -= dt; if (c.an <= 0 && !c.hien) this.cg.hidden = true; }
    const rec = this._re;
    if (!rec || this._keo || !this._con.trong && !this._con.cham) { if (c.hien) this._anChuGiai(); return; }
    if (!c.hien) {
      if (c.cho < 0) return;
      c.cho -= dt;
      if (c.cho > 0) return;
      const html = this._noiDungChuGiai(rec);
      if (!html) { c.cho = -1; return; }
      if (html !== c.viet) { this._cgTrong.innerHTML = html; c.viet = html; }
      this.cg.hidden = false;
      c.w = this.cg.offsetWidth; c.h = this.cg.offsetHeight;
      c.hien = true; c.an = 0; c.rec = rec;
      this._datViTriChuGiai(1);
      this.cg.classList.add('hien');
      c.lamMoi = 0.25;
      return;
    }
    // Nội dung động (moTa là hàm): đọc lại vài lần mỗi giây.
    c.lamMoi -= dt;
    if (c.lamMoi <= 0) {
      c.lamMoi = 0.25;
      const html = this._noiDungChuGiai(rec);
      if (html && html !== c.viet) { this._cgTrong.innerHTML = html; c.viet = html; c.w = this.cg.offsetWidth; c.h = this.cg.offsetHeight; }
    }
    this._datViTriChuGiai(1 - Math.exp(-dt * 26));
  }

  // Cạnh con trỏ (dưới bên phải); lật sang trái hay lên trên khi chạm mép màn hình hoặc bảng bài giảng.
  _datViTriChuGiai(k) {
    const c = this._cgTt, kh = this._khung;
    const cx = kh.x + this._con.x, cy = kh.y + this._con.y;
    const W = window.innerWidth, H = window.innerHeight;
    let phai = W - 10, duoi = H - 10;
    const b = this._bang;
    if (b) {
      if (b.left > W * 0.35) phai = Math.min(phai, b.left - 10);          // bảng nằm bên phải
      else if (b.top > H * 0.3) duoi = Math.min(duoi, b.top - 10);        // bảng nằm dưới
    }
    let x = cx + 16, y = cy + 20, trai = false;
    if (x + c.w > phai) { x = cx - 14 - c.w; trai = true; }
    if (y + c.h > duoi) y = cy - 14 - c.h;
    x = Math.max(10, Math.min(x, phai - c.w));
    y = Math.max(10, Math.min(y, duoi - c.h));
    if (k >= 1 || !Number.isFinite(c.x)) { c.x = x; c.y = y; } else { c.x += (x - c.x) * k; c.y += (y - c.y) * k; }
    if (trai !== c.trai) { c.trai = trai; this.cg.classList.toggle('trai', trai); }
    const rx = Math.round(c.x), ry = Math.round(c.y);
    if (rx !== c.rx || ry !== c.ry) { c.rx = rx; c.ry = ry; this.cg.style.transform = `translate3d(${rx}px,${ry}px,0)`; }
  }

  // ================= Bong bóng gợi ý =================
  _veGoiY(g, dt, i) {
    g.vao += dt;
    if (g.tat < 0) {
      g.con -= dt;
      if (g.con <= 0) { g.tat = 0.4; g.el.classList.remove('hien'); g.diem?.classList.remove('hien'); }
    } else {
      g.tat -= dt;
      if (g.tat <= 0) { this._gy.splice(i, 1); g.el.remove(); g.diem?.remove(); return; }
    }
    const kh = this._khung, W = window.innerWidth;
    let phai = W - 10;
    const b = this._bang;
    if (b && b.left > W * 0.35) phai = Math.min(phai, b.left - 10);
    let x, y, duoi = false, thay = true, px = 0, py = 0;
    if (g.nguon != null) {
      const p = veVector(g.nguon, g.viTri);
      thay = !!p && this._manHinh(p);
      px = kh.x + _q.x; py = kh.y + _q.y;
      const cach = g.tay ? g.tay.rPx * 2.6 + 12 : 16;
      x = px - g.w / 2;
      y = py - g.h - cach;
      if (y < 64) { y = py + cach; duoi = true; }
    } else {
      x = kh.x + (Math.min(phai, kh.x + kh.w) - kh.x) / 2 - g.w / 2;
      y = kh.y + 70;
    }
    x = Math.round(Math.max(10, Math.min(x, phai - g.w)));
    y = Math.round(Math.max(10, y));
    if (thay && (x !== g.x || y !== g.y)) {
      g.x = x; g.y = y;
      g.el.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (g.nguon != null) g.el.style.setProperty('--duoi', `${Math.round(Math.max(16, Math.min(g.w - 16, px - x)))}px`);
    }
    if (duoi !== g.duoi) { g.duoi = duoi; g.el.classList.toggle('duoi', duoi); }
    if (g.diem && thay) {
      const dx = Math.round(px), dy = Math.round(py);
      if (dx !== g.dx || dy !== g.dy) { g.dx = dx; g.dy = dy; g.diem.style.transform = `translate3d(${dx}px,${dy}px,0)`; }
    }
    const v = thay ? '' : 'hidden';
    if (g.el.style.visibility !== v) { g.el.style.visibility = v; if (g.diem) g.diem.style.visibility = v; }
    if (g.tat < 0 && g.vao > 0.05 && !g.el.classList.contains('hien')) { g.el.classList.add('hien'); g.diem?.classList.add('hien'); }
  }

  // ================= Tiện ích =================
  _am(ten, tc) { try { this.app.am?.phat?.(ten, tc); } catch { /* tiếng hỏng không được làm hỏng tương tác */ } }

  _goi(ham, ...ts) {
    if (typeof ham !== 'function') return undefined;
    try { return ham(...ts); } catch (e) {
      console.error(e);
      this.app.loiGhi?.push?.(chuCanh("canh.tuong-tac", "tương tác: {0}", [e?.message || e]));
      return undefined;
    }
  }
}

export default TuongTac;
