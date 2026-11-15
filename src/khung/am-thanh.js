// Âm thanh tổng hợp của Vũ trụ 3D (Bản 3). Hợp đồng cách gọi: «Hướng dẫn hình, tiếng, tương tác - Bản 3.md», mục 6.
//
// Mọi tiếng đều tổng hợp bằng WebAudio, không có tệp tiếng. Sơ đồ chung:
//
//   tiếng giao diện ─┐                     ┌─► vang ngắn (2,2 giây) ─┐
//   tiếng mô hình  ──┼─► nhóm (mức riêng) ─┤                         ├─► mức chung ─► giới hạn đỉnh ─► bù ─► cắt mềm ─► loa
//   nhạc nền       ──┘                     └─► vang dài (6 giây) ────┘
//
// Mức ở mức âm mặc định 0,7: tiếng giao diện đỉnh quanh −20 dBFS, tiếng mô hình đỉnh −12 dBFS khi doTo = 1
// (−18 dBFS với doTo = 0,5), nhạc nền quanh −32 dBFS RMS. Bộ giới hạn chỉ chạm khi rất nhiều tiếng chồng nhau;
// tầng cắt mềm cuối cùng bảo đảm đầu ra không bao giờ vượt 0,9.
//
// Mọi cao độ của tiếng giao diện và nhạc nền lấy từ một thang ngũ cung Rê trưởng (Rê, Mi, Fa thăng, La, Si),
// nên tiếng nào cũng hợp với nhau và với nhạc nền.
//
// Có hai lớp:
//   LoiAmThanh(ctx)  lõi, nhận một AudioContext hoặc OfflineAudioContext bất kỳ (bộ kiểm dùng OfflineAudioContext).
//   AmThanh          lớp dùng trong app: tự tạo AudioContext khi khoiDong(), lưu lựa chọn, an toàn khi chưa sẵn sàng.

export const DS_TIENG = ['bam', 're', 'buoc', 'buoc-lui', 'bai', 'mo', 'dong', 'dung', 'sai', 'dat', 'nam', 'tha', 'gat', 'bat-dau', 'loi'];
export const DS_NEN = ['vu-tru', 'khong-thoi-gian', 'trong-luc', 'he-qua', 'vu-tru-hoc'];

const KHOA_LUU = { bat: 'vu-tru-3d.tieng', muc: 'vu-tru-3d.muc-am', nen: 'vu-tru-3d.nhac-nen' };

const db = (x) => 10 ** (x / 20);
const kep = (x, a, b) => Math.min(b, Math.max(a, x));
const so = (x, macDinh) => (typeof x === 'number' && Number.isFinite(x) ? x : macDinh);

// Thang ngũ cung Rê trưởng: n = 0 là Rê 4 (293,66 Hz); n = 5 là Rê 5, n = −5 là Rê 3. Si thứ dùng chung thang này.
const BAC_NGU_CUNG = [0, 2, 4, 7, 9];
export function nguCung(n) {
  const quang = Math.floor(n / 5);
  const bac = ((n % 5) + 5) % 5;
  return 293.6648 * 2 ** (quang + BAC_NGU_CUNG[bac] / 12);
}
const N = nguCung;

// Mức của từng nhóm (đỉnh thiết kế của một tiếng là 1 trước khi nhân mức nhóm).
const MUC_NHOM = { gd: db(-20), mh: db(-12) };
const GUI_VANG = { gd: 0.22, mh: 0.16, nen: 0.6 };
const TOI_DA = { gd: 10, mh: 48, keoDai: 24 };
// Bộ giới hạn đỉnh của WebAudio tự cộng «độ lợi bù» (makeup gain); tầng bù hạ lại đúng chừng ấy để tiếng nhỏ đi qua
// chuỗi với độ lợi 1. Con số đo bằng bộ kiểm (kiem-tra/am-thanh/thu.js, mục «độ lợi chuỗi»).
const BU_GIOI_HAN = db(-5.43);

// Số ngẫu nhiên có hạt giống (nhạc nền lặp lại được khi kiểm).
function taoNgauNhien(hat) {
  let a = hat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Đường cắt mềm: giữ nguyên dưới 0,6; trên đó uốn dần, không bao giờ vượt 0,9.
function duongCatMem() {
  const n = 4097;
  const d = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    const y = a < 0.6 ? a : 0.6 + 0.3 * Math.tanh((a - 0.6) / 0.3);
    d[i] = Math.sign(x) * y;
  }
  return d;
}

// Vang tạo bằng mã: tiếng ồn hai kênh độc lập, tắt dần theo hàm mũ (giảm 60 dB sau `giay`),
// càng về sau càng tối (âm cao tắt nhanh hơn âm trầm, như phòng thật). Năng lượng chuẩn hoá về 1.
function taoVang(ctx, giay, sang, ngauNhien) {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * giay);
  const buf = ctx.createBuffer(2, n, sr);
  for (let k = 0; k < 2; k++) {
    const d = buf.getChannelData(k);
    let y = 0;
    let nangLuong = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const fc = 350 + sang * Math.exp((-2.2 * t) / giay);
      const a = Math.exp((-2 * Math.PI * fc) / sr);
      y = (1 - a) * (ngauNhien() * 2 - 1) + a * y;
      let bao = Math.exp((-6.91 * t) / giay);
      if (t < 0.004) bao *= t / 0.004;
      if (i > n * 0.9) bao *= (n - i) / (n * 0.1);
      d[i] = y * bao;
      nangLuong += d[i] * d[i];
    }
    const he = 1 / Math.sqrt(nangLuong || 1);
    for (let i = 0; i < n; i++) d[i] *= he;
  }
  return buf;
}

// Tiếng ồn ba màu, 3 giây, lặp được; RMS chuẩn 0,2, không lệch một chiều.
function taoTiengOn(ctx, mau, ngauNhien) {
  const sr = ctx.sampleRate;
  const n = sr * 3;
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, nau = 0;
  for (let i = 0; i < n; i++) {
    const w = ngauNhien() * 2 - 1;
    if (mau === 'trang') d[i] = w;
    else if (mau === 'nau') { nau = (nau + 0.02 * w) * 0.998; d[i] = nau; }
    else {
      // Hồng (bộ lọc của Paul Kellet).
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
    }
  }
  // Nối đầu cuối cho êm khi lặp: trộn 50 ms cuối vào đầu.
  const m = Math.floor(sr * 0.05);
  for (let i = 0; i < m; i++) { const a = i / m; d[i] = d[i] * a + d[n - m + i] * (1 - a); }
  const dung = n - m;
  let tb = 0;
  for (let i = 0; i < dung; i++) tb += d[i];
  tb /= dung;
  let e = 0;
  for (let i = 0; i < dung; i++) { d[i] -= tb; e += d[i] * d[i]; }
  const he = 0.2 / Math.sqrt(e / dung || 1);
  for (let i = 0; i < dung; i++) d[i] *= he;
  // Bộ đệm dùng phần đầu (đã nối mép) để lặp.
  const ra = ctx.createBuffer(1, dung, sr);
  ra.getChannelData(0).set(d.subarray(0, dung));
  return ra;
}

// Dạng sóng (theo bậc hoạ âm). Đều trơn, không có góc nhọn như sóng vuông, răng cưa.
const HOA_AM = {
  mem: [1, 0.12, 0.04],
  chuong: [1, 0.25, 0.08, 0.03],
  kinh: [1, 0, 0.09, 0, 0.02],
  day: Array.from({ length: 14 }, (_, k) => 1 / (k + 1) ** 1.45),
};

// ───────────────────────────── Một tiếng ngắn ─────────────────────────────
// Gom mọi nút của một lần phát; tự ngắt nối khi phát xong.
class Tieng {
  constructor(loi, nhom, t0, muc, lech) {
    this.loi = loi;
    this.c = loi.ctx;
    this.nhom = nhom;
    this.t0 = t0;
    this.t1 = t0;
    this.nguon = [];
    this.nut = [];
    this.xong = false;
    this.ra = this.g(muc);
    this.cat = this.g(1);
    this.ra.connect(this.cat);
    const p = loi.taoPan(lech);
    if (p) { this.nut.push(p); this.cat.connect(p); p.connect(nhom.vao); } else this.cat.connect(nhom.vao);
  }
  g(v = 0) { const n = this.c.createGain(); n.gain.value = v; this.nut.push(n); return n; }
  loc(kieu, f, q = 0.707) {
    const n = this.c.createBiquadFilter();
    n.type = kieu; n.frequency.value = kep(f, 10, this.c.sampleRate * 0.45); n.Q.value = q;
    this.nut.push(n);
    return n;
  }
  dao(song, f, t) {
    const o = this.c.createOscillator();
    if (typeof song === 'string' && !HOA_AM[song]) o.type = song; else o.setPeriodicWave(this.loi.song(song));
    o.frequency.value = f;
    o.start(t);
    this.nguon.push(o); this.nut.push(o);
    return o;
  }
  on(mau, t) {
    const s = this.c.createBufferSource();
    s.buffer = this.loi.tiengOnDem(mau);
    s.loop = true;
    s.start(t, this.loi.ngauNhien() * s.buffer.duration * 0.9);
    this.nguon.push(s); this.nut.push(s);
    return s;
  }
  het(t) { if (t > this.t1) this.t1 = t; }
  // Phong bì: vào tuyến tính trong `vao` giây, giữ `giu` giây, tắt theo hàm mũ tới −60 dB sau `tat` giây, rồi về đúng 0.
  bao(p, t, vao, dinh, giu, tat) {
    if (!(dinh > 0)) { p.setValueAtTime(0, t); return t; }
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(dinh, t + vao);
    if (giu > 0) p.setValueAtTime(dinh, t + vao + giu);
    const tk = t + vao + giu + Math.max(tat, 0.004);
    p.exponentialRampToValueAtTime(dinh * 1e-3, tk);
    p.linearRampToValueAtTime(0, tk + 0.008);
    this.het(tk + 0.008);
    return tk + 0.008;
  }
  ket() {
    const tDung = this.t1 + 0.02;
    let con = this.nguon.length;
    if (!con) { this.huy(); return; }
    const xong = () => { if (--con <= 0) this.huy(); };
    for (const s of this.nguon) { s.onended = xong; s.stop(tDung); }
    this.loi.song_.add(this);
  }
  tatNhanh(t) {
    if (this.xong) return;
    this.cat.gain.setTargetAtTime(0, t, 0.006);
    for (const s of this.nguon) { try { s.stop(t + 0.05); } catch { /* trình duyệt cũ không cho gọi stop hai lần */ } }
    this.biTat = true;
  }
  huy() {
    if (this.xong) return;
    this.xong = true;
    for (const n of this.nut) { try { n.disconnect(); } catch { /* đã ngắt */ } }
    for (const s of this.nguon) s.onended = null;
    this.nut.length = 0; this.nguon.length = 0;
    this.loi.song_.delete(this);
  }
}

// ── Các mảnh tiếng dùng chung ──
// Chuông điều tần: sóng mang sin, bộ điều biến sin; độ điều biến tắt nhanh hơn tiếng nên đầu tiếng sáng, đuôi trong.
function chuong(v, ra, t, f, { tat = 0.4, chiSo = 1, tiLe = 2, a = 1, vao = 0.005, lap = 0 } = {}) {
  const o = v.dao('sine', f, t);
  const g = v.g(0);
  o.connect(g); g.connect(ra);
  const tk = v.bao(g.gain, t, vao, a, 0, tat);
  if (chiSo > 0) {
    const m = v.dao('sine', f * tiLe, t);
    const mg = v.g(0);
    m.connect(mg); mg.connect(o.frequency);
    const d = chiSo * f * tiLe;
    mg.gain.setValueAtTime(d, t);
    mg.gain.exponentialRampToValueAtTime(d * 0.03, t + Math.max(0.02, tat * 0.3));
    mg.gain.linearRampToValueAtTime(0, tk);
  }
  // Hoạ âm lệch (2,76 lần) rất khẽ, tắt nhanh: cho chất kim loại, thuỷ tinh.
  if (lap > 0) {
    const o2 = v.dao('sine', f * 2.756, t);
    const g2 = v.g(0);
    o2.connect(g2); g2.connect(ra);
    v.bao(g2.gain, t, vao, a * lap, 0, tat * 0.3);
  }
  return tk;
}

// Nốt mềm: sóng gần sin, có thể trượt cao độ từ `tu` tới f trong `truot` giây.
function nhe(v, ra, t, f, { vao = 0.012, giu = 0, tat = 0.3, a = 1, tu = 0, truot = 0.06, song = 'mem', locHe = 6 } = {}) {
  const o = v.dao(song, tu || f, t);
  if (tu) { o.frequency.setValueAtTime(tu, t); o.frequency.exponentialRampToValueAtTime(f, t + truot); }
  const lp = v.loc('lowpass', Math.max(f, tu) * locHe, 0.5);
  const g = v.g(0);
  o.connect(lp); lp.connect(g); g.connect(ra);
  return v.bao(g.gain, t, vao, a, giu, tat);
}

// Tiếng gió: tiếng ồn qua bộ lọc dải quét tần số.
function gio(v, ra, t, { mau = 'hong', tu = 300, den = 1800, q = 1.2, vao = 0.12, giu = 0, tat = 0.3, a = 1, panTu = 0, panDen = 0 } = {}) {
  const s = v.on(mau, t);
  const bp = v.loc('bandpass', tu, q);
  bp.frequency.setValueAtTime(tu, t);
  bp.frequency.exponentialRampToValueAtTime(den, t + vao + giu + tat * 0.6);
  const g = v.g(0);
  s.connect(bp); bp.connect(g);
  const p = v.loi.taoPan(panTu);
  if (p && (panTu || panDen)) {
    v.nut.push(p);
    p.pan.setValueAtTime(panTu, t);
    p.pan.linearRampToValueAtTime(panDen, t + vao + giu + tat);
    g.connect(p); p.connect(ra);
  } else g.connect(ra);
  return v.bao(g.gain, t, vao, a, giu, tat);
}

// Nốt gảy dây: hoạ âm giảm dần qua bộ lọc thông thấp đóng dần.
function gay(v, ra, t, f, { tat = 0.6, a = 1 } = {}) {
  const o = v.dao('day', f, t);
  const lp = v.loc('lowpass', Math.min(f * 8, 7000), 0.6);
  lp.frequency.setValueAtTime(Math.min(f * 8, 7000), t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 60), t + tat * 0.5);
  const g = v.g(0);
  o.connect(lp); lp.connect(g); g.connect(ra);
  return v.bao(g.gain, t, 0.004, a, 0, tat);
}

// Gõ thuỷ tinh: hoạ âm lệch 1 : 2,756 : 5,404, hoạ âm cao tắt nhanh hơn.
function kinh(v, ra, t, f, { tat = 0.6, a = 1 } = {}) {
  let tk = t;
  for (const [he, muc, nhanh] of [[1, 1, 1], [2.756, 0.28, 3], [5.404, 0.09, 6]]) {
    if (f * he > v.c.sampleRate * 0.45) continue;
    const o = v.dao('sine', f * he, t);
    const g = v.g(0);
    o.connect(g); g.connect(ra);
    tk = Math.max(tk, v.bao(g.gain, t, 0.006, a * muc, 0, tat / nhanh));
  }
  return tk;
}

// ───────────────────────────── Công thức tiếng giao diện ─────────────────────────────
// Mỗi công thức vẽ tiếng với đỉnh xấp xỉ 1; `chuan` hiệu chỉnh cho đúng đỉnh (đo bằng bộ kiểm).
const TIENG_GD = {
  // Chạm nhẹ: chuông Rê 5 ngắn, có thân trầm một quãng tám.
  bam: { chuan: 1.008, ham(v, t, c) {
    chuong(v, v.ra, t, N(5) * c, { tat: 0.2, chiSo: 1.1, tiLe: 2, a: 0.75, vao: 0.005 });
    nhe(v, v.ra, t, N(0) * c, { vao: 0.005, tat: 0.07, a: 0.35, song: 'mem' });
  } },
  // Rê chuột qua: rất khẽ, rất ngắn.
  re: { chuan: 1.062, ham(v, t, c) {
    chuong(v, v.ra, t, N(8) * c, { tat: 0.08, chiSo: 0.4, tiLe: 2, a: 0.3, vao: 0.006 });
  } },
  // Bước sau: Rê 5 → La 5 (quãng năm đi lên).
  buoc: { chuan: 1.127, ham(v, t, c) {
    chuong(v, v.ra, t, N(5) * c, { tat: 0.22, chiSo: 0.9, a: 0.7 });
    chuong(v, v.ra, t + 0.075, N(8) * c, { tat: 0.32, chiSo: 0.9, a: 0.8 });
  } },
  // Bước trước: La 5 → Rê 5.
  'buoc-lui': { chuan: 1.102, ham(v, t, c) {
    chuong(v, v.ra, t, N(8) * c, { tat: 0.22, chiSo: 0.9, a: 0.7 });
    chuong(v, v.ra, t + 0.075, N(5) * c, { tat: 0.32, chiSo: 0.9, a: 0.8 });
  } },
  // Sang bài: luồng gió lướt từ trái qua phải, đáp xuống một nốt Rê 4 và La 4 ấm.
  bai: { chuan: 1.38, ham(v, t, c) {
    gio(v, v.ra, t, { tu: 280 * c, den: 1700 * c, q: 1.1, vao: 0.16, tat: 0.34, a: 0.9, panTu: -0.45, panDen: 0.45 });
    chuong(v, v.ra, t + 0.2, N(0) * c, { tat: 0.8, chiSo: 0.5, a: 0.5, vao: 0.012 });
    chuong(v, v.ra, t + 0.2, N(3) * c, { tat: 0.6, chiSo: 0.4, a: 0.28, vao: 0.012 });
  } },
  // Mở bảng: trượt lên La 4 → Rê 5, có chuông khẽ ở đích.
  mo: { chuan: 1.678, ham(v, t, c) {
    nhe(v, v.ra, t, N(5) * c, { tu: N(3) * c, truot: 0.08, vao: 0.008, tat: 0.2, a: 0.6 });
    chuong(v, v.ra, t + 0.06, N(5) * c, { tat: 0.25, chiSo: 0.6, a: 0.4 });
  } },
  // Đóng bảng: trượt xuống Rê 5 → La 4.
  dong: { chuan: 1.678, ham(v, t, c) {
    nhe(v, v.ra, t, N(3) * c, { tu: N(5) * c, truot: 0.08, vao: 0.008, tat: 0.18, a: 0.6 });
    chuong(v, v.ra, t + 0.05, N(3) * c, { tat: 0.22, chiSo: 0.5, a: 0.35 });
  } },
  // Đúng: hợp âm Rê trưởng rải nhanh (Rê 5, Fa thăng 5, La 5).
  dung: { chuan: 1.109, ham(v, t, c) {
    chuong(v, v.ra, t, N(5) * c, { tat: 0.45, chiSo: 0.8, a: 0.55 });
    chuong(v, v.ra, t + 0.07, N(7) * c, { tat: 0.5, chiSo: 0.8, a: 0.55 });
    chuong(v, v.ra, t + 0.14, N(8) * c, { tat: 0.65, chiSo: 0.8, a: 0.6 });
  } },
  // Chưa đúng: hai nốt trầm, mềm (Si 3 trượt xuống La 3, có Fa thăng 3 bên dưới), không gắt.
  sai: { chuan: 0.767, ham(v, t, c) {
    nhe(v, v.ra, t, N(-2) * c, { tu: N(-1) * c, truot: 0.18, vao: 0.015, giu: 0.04, tat: 0.32, a: 0.7, locHe: 3 });
    nhe(v, v.ra, t, N(-3) * c, { vao: 0.02, giu: 0.04, tat: 0.3, a: 0.4, locHe: 3 });
  } },
  // Đạt thử thách: Rê–Fa thăng–La–Rê rải lên, lấp lánh hai chuông cao rất khẽ, có lớp đệm ấm bên dưới.
  dat: { chuan: 0.923, ham(v, t, c) {
    const ds = [5, 7, 8, 10];
    ds.forEach((n, k) => chuong(v, v.ra, t + k * 0.065, N(n) * c, { tat: 0.9 - k * 0.05, chiSo: 0.75, a: 0.42, lap: 0.08 }));
    chuong(v, v.ra, t + 0.27, N(11) * c, { tat: 0.6, chiSo: 0.3, a: 0.13 });
    chuong(v, v.ra, t + 0.34, N(13) * c, { tat: 0.5, chiSo: 0.2, a: 0.09 });
    nhe(v, v.ra, t, N(0) * c, { vao: 0.08, tat: 0.9, a: 0.22, locHe: 3 });
    nhe(v, v.ra, t, N(3) * c, { vao: 0.08, tat: 0.8, a: 0.16, locHe: 3 });
  } },
  // Nắm tay nắm: tiếng «bụp» trầm trượt xuống.
  nam: { chuan: 1.273, ham(v, t, c) {
    nhe(v, v.ra, t, N(-1) * c, { tu: N(0) * 1.12 * c, truot: 0.04, vao: 0.005, tat: 0.13, a: 0.8, locHe: 4 });
    gio(v, v.ra, t, { mau: 'hong', tu: 900, den: 600, q: 0.8, vao: 0.004, tat: 0.03, a: 0.25 });
  } },
  // Thả tay nắm: nhẹ hơn, trượt lên.
  tha: { chuan: 1.659, ham(v, t, c) {
    nhe(v, v.ra, t, N(3) * c, { tu: N(0) * c, truot: 0.05, vao: 0.006, tat: 0.15, a: 0.6, locHe: 4 });
  } },
  // Công tắc: hai tiếng gõ nhỏ liền nhau, nốt sau cao hơn.
  gat: { chuan: 2.213, ham(v, t, c) {
    gio(v, v.ra, t, { mau: 'trang', tu: 2200, den: 2000, q: 3, vao: 0.002, tat: 0.012, a: 0.35 });
    chuong(v, v.ra, t, N(5) * c, { tat: 0.05, chiSo: 0.3, a: 0.4, vao: 0.004 });
    gio(v, v.ra, t + 0.04, { mau: 'trang', tu: 2600, den: 2400, q: 3, vao: 0.002, tat: 0.012, a: 0.3 });
    chuong(v, v.ra, t + 0.04, N(8) * c, { tat: 0.07, chiSo: 0.3, a: 0.45, vao: 0.004 });
  } },
  // Mở đầu khoá học: hợp âm Rê (Rê 3, La 3, Fa thăng 4, La 4) dâng lên ấm, bộ lọc mở dần, đỉnh có chuông Rê 5 và La 5.
  'bat-dau': { chuan: 0.851, ham(v, t, c) {
    const lp = v.loc('lowpass', 350, 0.6);
    lp.frequency.setValueAtTime(350, t);
    lp.frequency.exponentialRampToValueAtTime(2200, t + 1.0);
    lp.frequency.exponentialRampToValueAtTime(700, t + 3.0);
    lp.connect(v.ra);
    for (const [n, a, lech] of [[-5, 0.32, -3], [-2, 0.26, 4], [2, 0.2, -5], [3, 0.16, 6]]) {
      const f = N(n) * c;
      for (const [song, he, m] of [['sine', 1, 1], ['triangle', 2 ** (lech / 1200), 0.4]]) {
        const o = v.dao(song, f * he, t);
        const g = v.g(0);
        o.connect(g); g.connect(lp);
        v.bao(g.gain, t, 0.9, a * m, 0.1, 2.2);
      }
    }
    chuong(v, v.ra, t + 0.85, N(5) * c, { tat: 1.6, chiSo: 0.6, a: 0.32, vao: 0.01 });
    chuong(v, v.ra, t + 0.95, N(8) * c, { tat: 1.4, chiSo: 0.5, a: 0.2, vao: 0.01 });
  } },
  // Lỗi (thao tác không làm được): hai nốt mềm Fa thăng 4 → Rê 4, hơi rung phách.
  loi: { chuan: 1.072, ham(v, t, c) {
    for (const [k, n] of [[0, 2], [1, 0]]) {
      const tk = t + k * 0.13;
      nhe(v, v.ra, tk, N(n) * c, { vao: 0.01, giu: 0.03, tat: 0.16, a: 0.45, locHe: 3 });
      nhe(v, v.ra, tk, N(n) * c * 2 ** (9 / 1200), { vao: 0.01, giu: 0.03, tat: 0.16, a: 0.3, locHe: 3 });
    }
  } },
};

// ───────────────────────────── Nhạc nền ─────────────────────────────
// Vài giọng đệm dài (sin + tam giác lệch vài cent) chồng nhau, mỗi giọng sống 12–34 giây, vào ra rất chậm;
// một giọng gốc luôn giữ nền; tất cả qua bộ lọc thông thấp có dao động rất chậm, vang dài; thỉnh thoảng một chuông xa.
// Không có giai điệu: mỗi giọng chọn ngẫu nhiên một nốt trong tập nốt của kiểu, tránh trùng và tránh chen sát ở âm trầm.
const KIEU_NEN = {
  // Ấm và rộng: Rê trưởng, nền Rê 2.
  'vu-tru': { muc: 0.0329, goc: -10, bac: [-5, -2, 0, 1, 2, 3, 5], trong: [3, 3, 2, 1, 2, 2, 1], soGiong: 3, dai: [16, 28], tam: 0.35, lechCent: 5,
    loc: [550, 1500], chuKyLoc: 53, chuong: { moi: [10, 22], bac: [5, 6, 7, 8], tiLe: 2, chiSo: 0.5, a: 0.5, tat: 5 } },
  // Trong, tinh thể: nốt cao, quãng bốn quãng năm, chuông thuỷ tinh thường hơn.
  'khong-thoi-gian': { muc: 0.0451, mucGoc: 0.3, goc: -5, bac: [0, 1, 3, 5, 6, 8], trong: [2, 2, 3, 2, 2, 1], soGiong: 3, dai: [12, 22], tam: 0.12, lechCent: 3,
    loc: [1300, 3000], chuKyLoc: 41, chuong: { moi: [5, 11], bac: [8, 10, 11, 13], tiLe: 2.756, chiSo: 0.3, a: 0.35, tat: 4 } },
  // Trầm, vững: nền Rê 2 và La 2, ít nốt cao.
  'trong-luc': { muc: 0.0314, goc: -10, bac: [-7, -5, -2, 0, 2], trong: [3, 3, 2, 2, 1], soGiong: 3, dai: [20, 34], tam: 0.5, lechCent: 4,
    loc: [300, 850], chuKyLoc: 67, chuong: { moi: [16, 30], bac: [0, 3, 5], tiLe: 2, chiSo: 0.4, a: 0.45, tat: 6 } },
  // Tối, bí ẩn (lỗ đen): xoay về Si thứ, nền Si 1, phách lệch rộng hơn, có tiếng ồn nâu rất trầm như tiếng ù xa.
  'he-qua': { muc: 0.0282, goc: -11, bac: [-6, -4, -3, -1, 0, 2], trong: [3, 2, 2, 3, 2, 1], soGiong: 3, dai: [18, 30], tam: 0.45, lechCent: 9,
    loc: [230, 720], chuKyLoc: 59, chuong: { moi: [14, 26], bac: [-1, 2, 4], tiLe: 1.414, chiSo: 0.7, a: 0.4, tat: 7 }, u: { loc: 160, a: 0.35 } },
  // Sáng, mênh mông: nhiều giọng, nốt rộng, bộ lọc mở.
  'vu-tru-hoc': { muc: 0.027, goc: -5, bac: [-2, 0, 1, 2, 3, 5, 6, 7], trong: [2, 3, 2, 2, 2, 2, 1, 1], soGiong: 4, dai: [14, 26], tam: 0.25, lechCent: 6,
    loc: [900, 2400], chuKyLoc: 47, chuong: { moi: [8, 16], bac: [7, 8, 10, 12], tiLe: 2, chiSo: 0.45, a: 0.42, tat: 5 } },
};

class NhacNen {
  constructor(loi, kieu, t0, giay) {
    const c = loi.ctx;
    this.loi = loi; this.c = c; this.kieu = kieu; this.cfg = KIEU_NEN[kieu];
    this.r = loi.ngauNhien;
    this.nguon = new Set();
    this.dangKet = false;
    this.tKet = Infinity;
    const cfg = this.cfg;
    // bus → lọc thông cao 40 Hz → lọc thông thấp có dao động chậm → nhóm nhạc nền
    this.bus = c.createGain();
    this.bus.gain.setValueAtTime(0, t0);
    this.bus.gain.setTargetAtTime(cfg.muc, t0, Math.max(giay, 0.05) / 4);
    this.hp = c.createBiquadFilter(); this.hp.type = 'highpass'; this.hp.frequency.value = 40; this.hp.Q.value = 0.5;
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.Q.value = 0.45;
    const [l0, l1] = cfg.loc;
    this.lp.frequency.value = (l0 + l1) / 2;
    this.lfo = c.createOscillator(); this.lfo.frequency.value = 1 / cfg.chuKyLoc;
    this.lfoG = c.createGain(); this.lfoG.gain.value = (l1 - l0) / 2;
    this.lfo.connect(this.lfoG); this.lfoG.connect(this.lp.frequency);
    this.lfo.start(t0);
    this.bus.connect(this.hp); this.hp.connect(this.lp); this.lp.connect(loi.nhom.nen.vao);
    // chuông đi thẳng thêm vào vang dài (xa hơn)
    this.guiChuong = c.createGain();
    this.guiChuong.gain.setValueAtTime(0, t0);
    this.guiChuong.gain.setTargetAtTime(cfg.muc * 0.9, t0, Math.max(giay, 0.05) / 4);
    this.guiChuong.connect(loi.nhom.nen.uot);
    if (cfg.u) {
      const s = c.createBufferSource(); s.buffer = loi.tiengOnDem('nau'); s.loop = true;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cfg.u.loc; lp.Q.value = 0.5;
      const g = c.createGain(); g.gain.value = cfg.u.a;
      s.connect(lp); lp.connect(g); g.connect(this.bus);
      s.start(t0, this.r() * 2);
      this.u = { s, lp, g };
    }
    this.tiepGoc = t0;
    this.tiepNot = t0 + 0.4;
    this.tiepChuong = t0 + 3 + this.r() * cfg.chuong.moi[0];
    this.soNot = 0;
    this.dangVang = []; // [{f, t1}]
  }
  ngau(a, b) { return a + (b - a) * this.r(); }
  chon() {
    const { bac, trong } = this.cfg;
    const tong = trong.reduce((s, x) => s + x, 0);
    for (let thu = 0; thu < 8; thu++) {
      let x = this.r() * tong, k = 0;
      while (x > trong[k] && k < bac.length - 1) { x -= trong[k]; k++; }
      const f = N(bac[k]);
      // tránh trùng nốt và tránh hai nốt trầm sát nhau (đục)
      const sat = this.dangVang.some((d) => Math.abs(12 * Math.log2(f / d.f)) < (f < 260 ? 4.5 : 0.5));
      if (!sat) return f;
    }
    return N(this.cfg.bac[0]);
  }
  // Một giọng đệm dài.
  giongDem(t, f, L, a, vaoTi, ra) {
    const c = this.c, cfg = this.cfg;
    const vao = L * vaoTi, tat = L * this.ngau(0.35, 0.5), giu = Math.max(0, L - vao - tat);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + vao);
    g.gain.setValueAtTime(a, t + vao + giu);
    g.gain.linearRampToValueAtTime(0, t + L);
    const p = this.loi.taoPan(this.ngau(-0.5, 0.5));
    const nut = [g];
    if (p) { g.connect(p); p.connect(ra); nut.push(p); } else g.connect(ra);
    const lech = 2 ** ((cfg.lechCent * (this.r() < 0.5 ? -1 : 1)) / 1200);
    const ds = [['sine', f, 1], ['triangle', f * lech, cfg.tam]];
    if (f < 130) ds.push(['sine', f * 2 * (2 - lech), 0.3]); // nốt rất trầm: thêm quãng tám để loa nhỏ vẫn nghe
    let cuoi = null;
    for (const [song, ft, m] of ds) {
      const o = c.createOscillator(); o.type = song; o.frequency.value = ft;
      const gm = c.createGain(); gm.gain.value = m;
      o.connect(gm); gm.connect(g);
      o.start(t); o.stop(t + L + 0.05);
      nut.push(o, gm);
      this.nguon.add(o);
      cuoi = o;
    }
    for (const o of nut) if (o instanceof OscillatorNode) {
      o.onended = () => { this.nguon.delete(o); if (o === cuoi) for (const n of nut) { try { n.disconnect(); } catch { /* */ } } };
    }
    this.dangVang.push({ f, t1: t + L });
  }
  chuongXa(t) {
    const cfg = this.cfg.chuong;
    const c = this.c;
    const f = N(cfg.bac[Math.floor(this.r() * cfg.bac.length)]);
    const o = c.createOscillator(); o.frequency.value = f;
    const m = c.createOscillator(); m.frequency.value = f * cfg.tiLe;
    const mg = c.createGain();
    const d = cfg.chiSo * f * cfg.tiLe;
    mg.gain.setValueAtTime(d, t);
    mg.gain.exponentialRampToValueAtTime(d * 0.03, t + cfg.tat * 0.25);
    const g = c.createGain();
    const a = cfg.a * this.ngau(0.6, 1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + 0.012);
    g.gain.exponentialRampToValueAtTime(a * 1e-3, t + cfg.tat);
    g.gain.linearRampToValueAtTime(0, t + cfg.tat + 0.01);
    m.connect(mg); mg.connect(o.frequency); o.connect(g);
    const p = this.loi.taoPan(this.ngau(-0.7, 0.7));
    const nut = [o, m, mg, g];
    if (p) { g.connect(p); nut.push(p); p.connect(this.bus); p.connect(this.guiChuong); } else { g.connect(this.bus); g.connect(this.guiChuong); }
    o.start(t); m.start(t); o.stop(t + cfg.tat + 0.05); m.stop(t + cfg.tat + 0.05);
    this.nguon.add(o); this.nguon.add(m);
    o.onended = () => { this.nguon.delete(o); this.nguon.delete(m); for (const n of nut) { try { n.disconnect(); } catch { /* */ } } };
  }
  lap(den) {
    if (this.dangKet) return;
    const bay = this.c.currentTime;
    const cfg = this.cfg;
    // Sau khi bộ hẹn giờ bị trình duyệt hãm lâu (tab ẩn), không bù dồn các nốt đã lỡ.
    if (this.tiepGoc < bay - 1) this.tiepGoc = bay + 0.1;
    if (this.tiepNot < bay - 1) this.tiepNot = bay + 0.1;
    if (this.tiepChuong < bay - 1) this.tiepChuong = bay + 1 + this.r() * 4;
    this.dangVang = this.dangVang.filter((d) => d.t1 > bay);
    let an = 0;
    while (this.tiepGoc < den && an++ < 8) {
      const L = this.ngau(28, 36);
      const dau = this.tiepGoc === this.tGocDau || this.tGocDau === undefined;
      this.tGocDau ??= this.tiepGoc;
      this.giongDem(this.tiepGoc, N(cfg.goc), L, cfg.mucGoc ?? 0.55, dau ? 0.1 : 0.3, this.bus);
      this.tiepGoc += L * 0.62;
    }
    an = 0;
    while (this.tiepNot < den && an++ < 16) {
      const L = this.ngau(cfg.dai[0], cfg.dai[1]);
      const f = this.chon();
      const a = 0.42 * this.ngau(0.65, 1) * (220 / f) ** 0.25;
      const dau = this.soNot < cfg.soGiong;
      this.giongDem(this.tiepNot, f, L, a, dau ? this.ngau(0.12, 0.2) : this.ngau(0.3, 0.42), this.bus);
      this.soNot++;
      this.tiepNot += dau ? this.ngau(1.2, 3) : (L / cfg.soGiong) * this.ngau(0.7, 1.2);
    }
    an = 0;
    while (this.tiepChuong < den && an++ < 8) {
      this.chuongXa(this.tiepChuong);
      this.tiepChuong += this.ngau(cfg.chuong.moi[0], cfg.chuong.moi[1]);
    }
  }
  ket(t, giay) {
    if (this.dangKet) return;
    this.dangKet = true;
    // kiểu cũ tắt chậm hơn kiểu mới vào một chút, để chỗ giao nhau không bị hụt
    this.bus.gain.setTargetAtTime(0, t, Math.max(giay, 0.05) / 3);
    this.guiChuong.gain.setTargetAtTime(0, t, Math.max(giay, 0.05) / 3);
    this.tKet = t + Math.max(giay, 0.05) * 2.2 + 0.05;
    for (const o of this.nguon) { try { o.stop(this.tKet); } catch { /* */ } }
    try { this.lfo.stop(this.tKet); } catch { /* */ }
    if (this.u) try { this.u.s.stop(this.tKet); } catch { /* */ }
  }
  huy() {
    for (const o of this.nguon) { try { o.stop(); o.disconnect(); } catch { /* */ } }
    this.nguon.clear();
    for (const n of [this.bus, this.hp, this.lp, this.lfo, this.lfoG, this.guiChuong, this.u?.s, this.u?.lp, this.u?.g]) {
      if (n) try { n.disconnect(); } catch { /* */ }
    }
    try { this.lfo.stop(); } catch { /* */ }
  }
}

// ───────────────────────────── Lõi ─────────────────────────────
export class LoiAmThanh {
  // tuyChon: { vang = true (có vang), hatGiong (số nguyên, cho nhạc nền lặp lại được) }
  constructor(ctx, tuyChon = {}) {
    this.ctx = ctx;
    const c = ctx;
    this.ngauNhien = taoNgauNhien(tuyChon.hatGiong ?? Math.floor(Math.random() * 2 ** 32));
    this.co = { vang: tuyChon.vang !== false };
    this._song = {};
    this._on = {};
    this.song_ = new Set(); // các tiếng ngắn còn sống (chưa ngắt nối)
    this.dangPhat = { gd: [], mh: [] };
    this.keoDai = new Set();
    this.lanCuoi = {};
    this.dsNen = [];
    this.kieuNen = null;
    this.mucAm = 0.7;
    this.bat = true;

    // Đầu ra: mức chung → giới hạn đỉnh → bù → cắt mềm → loa.
    this.tong = c.createGain();
    this.tong.gain.value = this.heSoMuc();
    this.han = c.createDynamicsCompressor();
    this.han.threshold.value = -12; this.han.knee.value = 6; this.han.ratio.value = 12;
    this.han.attack.value = 0.002; this.han.release.value = 0.25;
    this.bu = c.createGain(); this.bu.gain.value = BU_GIOI_HAN;
    this.cat = c.createWaveShaper(); this.cat.curve = duongCatMem(); this.cat.oversample = 'none';
    this.tong.connect(this.han); this.han.connect(this.bu); this.cat.connect(c.destination);
    // Bộ giới hạn của WebAudio khởi đầu ở trạng thái đang nén rồi nhả dần (~0,3 giây): tiếng đầu tiên sẽ bị nuốt.
    // Nên 0,5 giây đầu cho tiếng đi đường thẳng (trễ 6 ms cho khớp đường kia), rồi hoà sang đường có giới hạn.
    // Trong lúc đó tầng cắt mềm vẫn giữ đầu ra dưới 0,9.
    const t0 = c.currentTime;
    const vaoHan = c.createGain();
    vaoHan.gain.setValueAtTime(0, t0); vaoHan.gain.setValueAtTime(0, t0 + 0.45); vaoHan.gain.linearRampToValueAtTime(1, t0 + 0.6);
    this.bu.connect(vaoHan); vaoHan.connect(this.cat);
    const treThang = c.createDelay(0.05); treThang.delayTime.value = 0.006;
    const thang = c.createGain();
    thang.gain.setValueAtTime(1, t0); thang.gain.setValueAtTime(1, t0 + 0.45); thang.gain.linearRampToValueAtTime(0, t0 + 0.6);
    this.tong.connect(treThang); treThang.connect(thang); thang.connect(this.cat);
    this._duongThang = [treThang, thang];

    // Vang.
    if (this.co.vang) {
      const taoDuong = (giay, sang, tre) => {
        const gui = c.createGain();
        const d = c.createDelay(0.1); d.delayTime.value = tre;
        const v = c.createConvolver(); v.normalize = false; v.buffer = taoVang(c, giay, sang, this.ngauNhien);
        gui.connect(d); d.connect(v); v.connect(this.tong);
        return gui;
      };
      this.guiNgan = taoDuong(2.2, 5000, 0.012);
      this.guiDai = taoDuong(6, 2600, 0.03);
    }
    const taoNhom = (muc, gui, ti) => {
      const vao = c.createGain();
      const kho = c.createGain(); kho.gain.value = muc;
      vao.connect(kho); kho.connect(this.tong);
      if (gui) { const g = c.createGain(); g.gain.value = muc * ti; vao.connect(g); g.connect(gui); }
      return { vao, kho };
    };
    this.nhom = {
      gd: taoNhom(MUC_NHOM.gd, this.guiNgan, GUI_VANG.gd),
      mh: taoNhom(MUC_NHOM.mh, this.guiNgan, GUI_VANG.mh),
      nen: taoNhom(1, this.guiDai, GUI_VANG.nen),
    };
    // Đường vào vang dài riêng cho chuông xa của nhạc nền (cũng hạ về 0 khi tab ẩn).
    this.nhom.nen.uot = c.createGain();
    if (this.guiDai) this.nhom.nen.uot.connect(this.guiDai);
  }

  bay() { return this.ctx.currentTime; }
  heSoMuc() { return this.bat ? (kep(this.mucAm, 0, 1) / 0.7) ** 1.6 : 0; }
  datMucAm(v, muot = 0.04) {
    this.mucAm = kep(so(v, 0.7), 0, 1);
    this.tong.gain.setTargetAtTime(this.heSoMuc(), this.bay(), Math.max(muot, 0.001) / 3);
  }
  datBat(b, muot = 0.08) {
    this.bat = !!b;
    this.tong.gain.setTargetAtTime(this.heSoMuc(), this.bay(), Math.max(muot, 0.001) / 3);
  }
  // Tab bị ẩn: hạ nhạc nền về 0; hiện lại thì đưa lên từ từ.
  datAnTab(an) {
    for (const g of [this.nhom.nen.vao, this.nhom.nen.uot]) g.gain.setTargetAtTime(an ? 0 : 1, this.bay(), an ? 0.15 : 0.6);
  }

  song(ten) {
    if (!this._song[ten]) {
      const h = HOA_AM[ten] || HOA_AM.mem;
      const thuc = new Float32Array(h.length + 1);
      const ao = new Float32Array(h.length + 1);
      h.forEach((a, k) => { ao[k + 1] = a; });
      this._song[ten] = this.ctx.createPeriodicWave(thuc, ao);
    }
    return this._song[ten];
  }
  tiengOnDem(mau) {
    const m = mau === 'trang' || mau === 'nau' ? mau : 'hong';
    if (!this._on[m]) this._on[m] = taoTiengOn(this.ctx, m, this.ngauNhien);
    return this._on[m];
  }
  taoPan(lech) {
    if (!lech || !this.ctx.createStereoPanner) return null;
    const p = this.ctx.createStereoPanner();
    p.pan.value = kep(lech, -1, 1);
    return p;
  }

  // Dọn danh sách các tiếng đã hết.
  don() {
    const bay = this.bay();
    for (const k of ['gd', 'mh']) {
      const ds = this.dangPhat[k];
      if (ds.length && ds.some((v) => v.xong || v.biTat || v.t1 < bay)) this.dangPhat[k] = ds.filter((v) => !v.xong && !v.biTat && v.t1 >= bay);
    }
  }
  // Mở một tiếng mới trong nhóm; giới hạn số tiếng cùng lúc, hạ mức khi nhiều tiếng dồn một lúc.
  moTieng(nhom, t, muc, lech) {
    this.don();
    const ds = this.dangPhat[nhom];
    let dong = 0;
    for (const v of ds) if (Math.abs(v.t0 - t) < 0.08) dong++;
    if (ds.length >= TOI_DA[nhom]) {
      const cu = ds[0];
      // Tiếng cũ nhất mới bắt đầu (cả loạt dồn cùng lúc): bỏ tiếng mới, đằng nào cũng không nghe ra.
      if (t - cu.t0 < 0.1) return null;
      cu.tatNhanh(Math.max(this.bay(), cu.t0, t - 0.01));
      ds.shift();
    }
    const v = new Tieng(this, this.nhom[nhom], t, muc / Math.sqrt(1 + 0.6 * dong), kep(so(lech, 0), -1, 1));
    ds.push(v);
    return v;
  }

  phat(ten, o = {}) {
    const ct = TIENG_GD[ten];
    if (!ct) return;
    const doTo = kep(so(o.doTo, 1), 0, 1);
    if (doTo <= 0) return;
    const cao = kep(so(o.cao, 1), 0.25, 4);
    const t = this.bay() + Math.max(0, so(o.tre, 0));
    const truoc = this.lanCuoi[ten];
    if (truoc !== undefined && Math.abs(t - truoc) < 0.03) return; // cùng tiếng gọi dồn trong 30 ms: chỉ phát một
    this.lanCuoi[ten] = t;
    const v = this.moTieng('gd', t, doTo * ct.chuan, o.lech);
    if (!v) return;
    ct.ham(v, t, cao);
    v.ket();
  }

  tich(o = {}) {
    const doTo = kep(so(o.doTo, 0.5), 0, 1);
    if (doTo <= 0) return;
    const f = kep(so(o.tanSo, 900), 30, 12000);
    const dai = kep(so(o.dai, 0.05), 0.008, 2);
    const t = this.bay() + Math.max(0, so(o.tre, 0));
    const v = this.moTieng('mh', t, doTo, o.lech);
    if (!v) return;
    // thân: sin trượt nhanh từ 1,5f về f (tiếng gõ gỗ), tắt theo hàm mũ trong `dai`
    const osc = v.dao('sine', f * 1.5, t);
    osc.frequency.setValueAtTime(f * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.008, dai * 0.3));
    const g = v.g(0); osc.connect(g); g.connect(v.ra);
    v.bao(g.gain, t, 0.0015, 1, 0, dai - 0.0015);
    // tiếng gõ: tiếng ồn qua bộ lọc dải, rất ngắn
    const s = v.on('trang', t);
    const bp = v.loc('bandpass', Math.min(f * 2, 5000), 1.5);
    const g2 = v.g(0); s.connect(bp); bp.connect(g2); g2.connect(v.ra);
    v.bao(g2.gain, t, 0.001, 0.6, 0, Math.min(0.012, dai));
    v.ket();
  }

  not(o = {}) {
    const doTo = kep(so(o.doTo, 0.4), 0, 1);
    if (doTo <= 0) return;
    const f = kep(so(o.tanSo, 440), 20, 12000);
    const dai = kep(so(o.dai, 0.5), 0.02, 20);
    const t = this.bay() + Math.max(0, so(o.tre, 0));
    const v = this.moTieng('mh', t, doTo, o.lech);
    if (!v) return;
    const dang = o.dang;
    if (dang === 'mem') nhe(v, v.ra, t, f, { vao: 0.015, giu: dai * 0.25, tat: Math.max(0.01, dai * 0.75 - 0.015), a: 0.95 });
    else if (dang === 'day') gay(v, v.ra, t, f, { tat: dai, a: 0.88 });
    else if (dang === 'kinh') kinh(v, v.ra, t, f, { tat: dai, a: 0.82 });
    else chuong(v, v.ra, t, f, { tat: dai, chiSo: 1.2, tiLe: 2, a: 0.96, vao: 0.005, lap: 0.1 });
    v.ket();
  }

  quet(o = {}) {
    const doTo = kep(so(o.doTo, 0.4), 0, 1);
    if (doTo <= 0) return;
    const tu = kep(so(o.tu, 200), 20, 12000);
    const den = kep(so(o.den, 800), 20, 12000);
    const giay = kep(so(o.giay, 1), 0.03, 60);
    const mu = kep(so(o.mu, 1), 0.05, 20);
    const t = this.bay() + Math.max(0, so(o.tre, 0));
    const v = this.moTieng('mh', t, doTo, o.lech);
    if (!v) return;
    const dang = HOA_AM[o.dang] ? o.dang : 'mem';
    const osc = v.dao(dang, tu, t);
    const n = Math.max(64, Math.min(2048, Math.ceil(giay * 200)));
    const duong = new Float32Array(n);
    for (let i = 0; i < n; i++) duong[i] = tu + (den - tu) * (i / (n - 1)) ** mu;
    osc.frequency.setValueCurveAtTime(duong, t, giay);
    const lp = v.loc('lowpass', Math.min(Math.max(tu, den) * (dang === 'day' ? 5 : 8), 16000), 0.5);
    const g = v.g(0);
    osc.connect(lp); lp.connect(g); g.connect(v.ra);
    const vao = Math.min(0.012, giay * 0.2), tat = Math.min(0.06, giay * 0.2);
    v.bao(g.gain, t, vao, 0.9, giay - vao - tat - 0.008, tat);
    v.ket();
  }

  // Âm kéo dài, chỉnh được mỗi khung hình.
  giong(o = {}) {
    const c = this.ctx;
    const t = this.bay();
    const dang = HOA_AM[o.dang] ? o.dang : 'mem';
    let f = kep(so(o.tanSo, 220), 20, 12000);
    let doTo = kep(so(o.doTo, 0), 0, 1);
    let lech = kep(so(o.lech, 0), -1, 1);
    const osc = c.createOscillator(); osc.setPeriodicWave(this.song(dang)); osc.frequency.value = f;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    const heLoc = dang === 'day' ? 4 : 6;
    lp.frequency.value = Math.min(f * heLoc, 16000);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(doTo * 0.9, t, 0.02);
    const cat = c.createGain();
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) p.pan.value = lech;
    osc.connect(lp); lp.connect(g); g.connect(cat);
    if (p) { cat.connect(p); p.connect(this.nhom.mh.vao); } else cat.connect(this.nhom.mh.vao);
    // rung nhẹ (vibrato) cho dây và thuỷ tinh
    let rung = null;
    if (dang === 'day' || dang === 'kinh') {
      const r = c.createOscillator(); r.frequency.value = dang === 'day' ? 5.1 : 4.3;
      const rg = c.createGain(); rg.gain.value = f * 0.003;
      r.connect(rg); rg.connect(osc.frequency); r.start(t);
      rung = { r, rg };
    }
    osc.start(t);
    const nut = [osc, lp, g, cat, p, rung?.r, rung?.rg].filter(Boolean);
    let xong = false;
    const loi = this;
    const tay = {
      dat(q = {}, muot = 0.06) {
        if (xong) return;
        const bay = loi.bay();
        const tau = Math.max(so(muot, 0.06), 0.003) / 3;
        if (typeof q.tanSo === 'number' && Number.isFinite(q.tanSo)) {
          const fm = kep(q.tanSo, 20, 12000);
          if (fm !== f) {
            f = fm;
            osc.frequency.setTargetAtTime(f, bay, tau);
            lp.frequency.setTargetAtTime(Math.min(f * heLoc, 16000), bay, tau);
            if (rung) rung.rg.gain.setTargetAtTime(f * 0.003, bay, tau);
          }
        }
        if (typeof q.doTo === 'number' && Number.isFinite(q.doTo)) {
          const d = kep(q.doTo, 0, 1);
          if (d !== doTo) { doTo = d; g.gain.setTargetAtTime(d * 0.9, bay, tau); }
        }
        if (p && typeof q.lech === 'number' && Number.isFinite(q.lech)) {
          const l = kep(q.lech, -1, 1);
          if (l !== lech) { lech = l; p.pan.setTargetAtTime(l, bay, tau); }
        }
      },
      tat(giay = 0.4) {
        if (xong) return;
        xong = true;
        loi.keoDai.delete(tay);
        const bay = loi.bay();
        const gi = kep(so(giay, 0.4), 0.01, 30);
        cat.gain.setValueAtTime(1, bay);
        cat.gain.exponentialRampToValueAtTime(1e-3, bay + gi);
        cat.gain.linearRampToValueAtTime(0, bay + gi + 0.01);
        osc.onended = () => { for (const n of nut) { try { n.disconnect(); } catch { /* */ } } };
        osc.stop(bay + gi + 0.03);
        if (rung) rung.r.stop(bay + gi + 0.03);
      },
    };
    this.themKeoDai(tay);
    return tay;
  }

  tiengOn(o = {}) {
    const c = this.ctx;
    const t = this.bay();
    let fl = kep(so(o.tanSoLoc, 800), 20, 18000);
    let doTo = kep(so(o.doTo, 0), 0, 1);
    let lech = kep(so(o.lech, 0), -1, 1);
    const s = c.createBufferSource(); s.buffer = this.tiengOnDem(o.mau); s.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = fl; lp.Q.value = 0.7;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 25; hp.Q.value = 0.5;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(doTo * 2, t, 0.03);
    const cat = c.createGain();
    const p = c.createStereoPanner ? c.createStereoPanner() : null;
    if (p) p.pan.value = lech;
    s.connect(lp); lp.connect(hp); hp.connect(g); g.connect(cat);
    if (p) { cat.connect(p); p.connect(this.nhom.mh.vao); } else cat.connect(this.nhom.mh.vao);
    s.start(t, this.ngauNhien() * 2);
    const nut = [s, lp, hp, g, cat, p].filter(Boolean);
    let xong = false;
    const loi = this;
    const tay = {
      dat(q = {}, muot = 0.06) {
        if (xong) return;
        const bay = loi.bay();
        const tau = Math.max(so(muot, 0.06), 0.003) / 3;
        if (typeof q.tanSoLoc === 'number' && Number.isFinite(q.tanSoLoc)) {
          const x = kep(q.tanSoLoc, 20, 18000);
          if (x !== fl) { fl = x; lp.frequency.setTargetAtTime(x, bay, tau); }
        }
        if (typeof q.doTo === 'number' && Number.isFinite(q.doTo)) {
          const d = kep(q.doTo, 0, 1);
          if (d !== doTo) { doTo = d; g.gain.setTargetAtTime(d * 2, bay, tau); }
        }
        if (p && typeof q.lech === 'number' && Number.isFinite(q.lech)) {
          const l = kep(q.lech, -1, 1);
          if (l !== lech) { lech = l; p.pan.setTargetAtTime(l, bay, tau); }
        }
      },
      tat(giay = 0.4) {
        if (xong) return;
        xong = true;
        loi.keoDai.delete(tay);
        const bay = loi.bay();
        const gi = kep(so(giay, 0.4), 0.01, 30);
        cat.gain.setValueAtTime(1, bay);
        cat.gain.exponentialRampToValueAtTime(1e-3, bay + gi);
        cat.gain.linearRampToValueAtTime(0, bay + gi + 0.01);
        s.onended = () => { for (const n of nut) { try { n.disconnect(); } catch { /* */ } } };
        s.stop(bay + gi + 0.03);
      },
    };
    this.themKeoDai(tay);
    return tay;
  }

  themKeoDai(tay) {
    if (this.keoDai.size >= TOI_DA.keoDai) {
      const cu = this.keoDai.values().next().value;
      cu.tat(0.08);
    }
    this.keoDai.add(tay);
  }

  dungHet(giay = 0.3) {
    for (const tay of [...this.keoDai]) tay.tat(giay);
    this.keoDai.clear();
  }

  // Đổi nhạc nền, hoà chuyển trong `giay` giây. kieu = null: tắt dần.
  nen(kieu, o = {}) {
    if (kieu !== null && kieu !== undefined && !KIEU_NEN[kieu]) return;
    const k = kieu || null;
    if (k === this.kieuNen) return;
    const giay = kep(so(o.giay, 4), 0.05, 30);
    const t = this.bay();
    for (const n of this.dsNen) if (!n.dangKet) n.ket(t, giay);
    this.kieuNen = k;
    if (k) this.dsNen.push(new NhacNen(this, k, t, giay));
    this.lap(t + 4);
  }

  // Lên lịch nhạc nền tới thời điểm `den` (giây, đồng hồ âm thanh) và dọn các kiểu đã tắt hẳn.
  lap(den) {
    const bay = this.bay();
    const con = [];
    for (const n of this.dsNen) {
      if (n.dangKet && bay > n.tKet + 0.3) n.huy();
      else { n.lap(den); con.push(n); }
    }
    this.dsNen = con;
    this.don();
    if (this._duongThang && bay > 1) { for (const n of this._duongThang) { try { n.disconnect(); } catch { /* */ } } this._duongThang = null; }
  }

  // Số tiếng ngắn còn giữ nút (để kiểm rò bộ nhớ).
  soTiengSong() { return this.song_.size; }

  huy() {
    this.dungHet(0.01);
    for (const n of this.dsNen) n.huy();
    this.dsNen = [];
    for (const v of [...this.song_]) v.huy();
    try { this.cat.disconnect(); } catch { /* */ }
  }
}

// ───────────────────────────── Lớp dùng trong app ─────────────────────────────
function docLuu(khoa, macDinh, kieu) {
  try {
    const s = globalThis.localStorage?.getItem(khoa);
    if (s === null || s === undefined) return macDinh;
    if (kieu === 'bool') return s === '1' || s === 'true' ? true : s === '0' || s === 'false' ? false : macDinh;
    const x = Number(s);
    return Number.isFinite(x) ? kep(x, 0, 1) : macDinh;
  } catch { return macDinh; }
}
function ghiLuu(khoa, giaTri) {
  try { globalThis.localStorage?.setItem(khoa, String(giaTri)); } catch { /* chế độ riêng tư, bị chặn */ }
}

const TAY_RONG = Object.freeze({ dat() {}, tat() {} });

export class AmThanh {
  constructor() {
    this._ctx = null;
    this._loi = null;
    this._khoa = false;
    this._daYeuCau = false;
    this._dangMo = null;
    this._kieuNen = null;
    this._tay = new Set();
    this._hen = null;
    this._henTatNgu = null;
    this.bat = docLuu(KHOA_LUU.bat, true, 'bool');
    this.mucAm = docLuu(KHOA_LUU.muc, 0.7, 'so');
    this.batNen = docLuu(KHOA_LUU.nen, true, 'bool');
    this._anHien = () => {
      if (!this._loi || typeof document === 'undefined') return;
      try { this._loi.datAnTab(document.hidden); if (!document.hidden) this._nhip(); } catch { /* */ }
    };
  }

  get sanSang() { return !!(this._loi && !this._khoa && !this._chuaMo && this.bat && this._ctx.state === 'running'); }
  // Được phép xếp tiếng (kể cả khi AudioContext đang chờ chạy tiếp sau khoiDong: tiếng sẽ phát khi nó chạy).
  _duoc() { return !!(this._loi && !this._khoa && !this._chuaMo && this.bat && this._ctx.state !== 'closed' && (this._ctx.state === 'running' || this._daYeuCau)); }

  // MỞ SẴN thiết bị âm thanh trước thao tác đầu tiên, hoàn toàn im lặng (mức ra bằng 0, chưa có nhạc nền, mọi lệnh phát
  // còn bị chặn) cho tới lần khoiDong() thật. Vì sao: lệnh mở thiết bị của WebKit (AudioContext.resume) chạy ngay trên
  // luồng giao diện; thiết bị đang nghỉ thì nó chiếm 320–350 mili giây (đo 13/11/2026: ba trong năm lượt, lần bấm «Bắt đầu
  // học» mất 353–386 mili giây, riêng lệnh này 324–348), còn dựng bộ vang mất thêm chừng 15. Làm sẵn lúc trang vừa nạp
  // thì lần bấm đầu tiên chỉ còn việc mở mức âm. Chỉ gọi ở nơi được phép tự phát (app Mac); trình duyệt thường không cho
  // mở thiết bị trước khi người dùng bấm. Không ai bấm trong 5 phút thì cho thiết bị nghỉ lại.
  moSan() {
    if (this._khoa || !this.bat || this._ctx) return;
    this._chuaMo = true;
    this.khoiDong();
    if (!this._loi) { this._chuaMo = false; return; }      // máy không có âm thanh hoặc mở hỏng: lần bấm thật sẽ thử lại như cũ
    this._henNghi = setTimeout(() => { if (this._chuaMo && this._ctx?.state === 'running') this._ctx.suspend()?.catch?.(() => {}); }, 300000);
  }

  khoa() {
    this._khoa = true;
    this._dangMo = null;
    this._daYeuCau = false;
    for (const h of [...this._tay]) h.tat(0.01);
    this._tay.clear();
    if (this._hen) { clearInterval(this._hen); this._hen = null; }
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this._anHien);
    if (this._ctx) {
      try { this._loi.huy(); } catch { /* */ }
      try { this._ctx.close(); } catch { /* */ }
      this._ctx = null; this._loi = null;
    }
  }

  // WKWebView có thể chặn luồng giao diện hàng trăm ms khi resume() một
  // graph đã nối hai bộ vang. Mở ngay trong thao tác người dùng, trước khi nối
  // graph; các nốt vẫn được xếp trên cùng đồng hồ âm thanh của context này.
  _danhThuc(ctx, ep = false) {
    if ((this._dangMo && !ep) || ctx.state === 'running' || ctx.state === 'closed') return;
    this._daYeuCau = true;
    const hen = ctx.resume();
    this._dangMo = hen;
    const xong = () => {
      if (this._dangMo !== hen) return;
      this._dangMo = null;
      this._daYeuCau = ctx.state === 'running';
    };
    hen.then(xong, xong);
  }

  khoiDong() {
    if (this._khoa || !this.bat) return;
    try {
      if (!this._ctx) {
        const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) return;
        let ctx;
        try { ctx = new AC({ latencyHint: 'interactive' }); } catch { ctx = new AC(); }
        this._ctx = ctx;
        this._danhThuc(ctx);
        this._loi = new LoiAmThanh(ctx);
        // Chế độ «tiếng câm» (chỉ dùng khi thử trong app thật): mọi thứ chạy như thật nhưng đầu ra nhân với 0, loa không kêu.
        if (globalThis.__VT_THU?.tiengCam) {
          try { this._loi.cat.disconnect(); const cam = ctx.createGain(); cam.gain.value = 0; this._loi.cat.connect(cam); cam.connect(ctx.destination); } catch (e) { console.warn(e); }
        }
        this._loi.datMucAm(this.mucAm, 0.001);
        this._loi.datBat(this.bat && !this._chuaMo, 0.001);
        if (!this._chuaMo && this.batNen && this._kieuNen) this._loi.nen(this._kieuNen, { giay: 3 });
        this._hen = setInterval(() => this._nhip(), 1000);
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', this._anHien);
          this._anHien();
        }
      } else if (this._chuaMo && this._loi) {
        // Thao tác thật đầu tiên sau lượt mở sẵn: thiết bị đã chạy, chỉ còn mở mức âm và cho nhạc nền vào.
        this._chuaMo = false;
        clearTimeout(this._henNghi);
        this._danhThuc(this._ctx, true);       // lượt mở sẵn bị từ chối hoặc thiết bị đã nghỉ lại: mở ngay trong thao tác này
        this._loi.datBat(this.bat, 0.02);
        if (this.batNen && this._kieuNen) this._loi.nen(this._kieuNen, { giay: 3 });
      }
      this._danhThuc(this._ctx);
    } catch (e) {
      console.warn('Âm thanh: không khởi động được', e);
    }
  }

  _nhip() {
    if (!this._loi || this._ctx.state !== 'running') return;
    try { this._loi.lap(this._ctx.currentTime + 4); } catch (e) { console.warn('Âm thanh:', e); }
  }

  datBat(b) {
    this.bat = !!b;
    ghiLuu(KHOA_LUU.bat, this.bat ? 1 : 0);
    if (!this._loi || this._chuaMo) return;      // đang mở sẵn (im lặng): lần khoiDong() thật sẽ đặt mức theo lựa chọn này
    this._loi.datBat(this.bat);
    clearTimeout(this._henTatNgu);
    if (this.bat) {
      if (this._ctx.state === 'suspended') this._danhThuc(this._ctx);
    } else {
      // tắt tiếng: hạ mức xong thì cho AudioContext nghỉ để đỡ tốn máy
      this._henTatNgu = setTimeout(() => {
        if (!this.bat && this._ctx?.state === 'running') this._ctx.suspend()?.catch?.(() => {});
      }, 400);
    }
  }

  datMucAm(v) {
    this.mucAm = kep(so(Number(v), 0.7), 0, 1);
    ghiLuu(KHOA_LUU.muc, this.mucAm);
    this._loi?.datMucAm(this.mucAm);
  }

  datBatNen(b) {
    this.batNen = !!b;
    ghiLuu(KHOA_LUU.nen, this.batNen ? 1 : 0);
    if (this._loi && !this._khoa && !this._chuaMo) this._loi.nen(this.batNen ? this._kieuNen : null, { giay: 1.5 });
  }

  phat(ten, o) { if (this._duoc()) try { this._loi.phat(ten, o || {}); } catch (e) { console.warn('Âm thanh:', e); } }

  nen(kieu, o) {
    if (kieu !== null && kieu !== undefined && !DS_NEN.includes(kieu)) return;
    this._kieuNen = kieu || null;
    if (this._loi && !this._khoa && !this._chuaMo && this.batNen) try { this._loi.nen(this._kieuNen, o || {}); } catch (e) { console.warn('Âm thanh:', e); }
  }

  tich(o) { if (this._duoc()) try { this._loi.tich(o || {}); } catch (e) { console.warn('Âm thanh:', e); } }
  not(o) { if (this._duoc()) try { this._loi.not(o || {}); } catch (e) { console.warn('Âm thanh:', e); } }
  quet(o) { if (this._duoc()) try { this._loi.quet(o || {}); } catch (e) { console.warn('Âm thanh:', e); } }

  // Âm kéo dài: trả về tay cầm ngay cả khi chưa sẵn sàng; tiếng thật được tạo ở lần dat() đầu tiên sau khi âm thanh chạy.
  _tayCam(loai, o) {
    if (this._khoa) return TAY_RONG;
    const self = this;
    const ts = { ...(o || {}) };
    let that = null;
    let xong = false;
    const thu = () => {
      if (!that && !xong && self._duoc()) {
        try { that = self._loi[loai](ts); } catch (e) { console.warn('Âm thanh:', e); xong = true; }
      }
      return that;
    };
    const h = {
      dat(q, muot) {
        if (xong) return;
        if (q) Object.assign(ts, q);
        const moi = !that;
        const v = thu();
        if (v && !moi) try { v.dat(q || {}, muot); } catch { /* */ }
      },
      tat(giay) {
        if (xong) return;
        xong = true;
        self._tay.delete(h);
        try { that?.tat(giay); } catch { /* */ }
      },
    };
    this._tay.add(h);
    thu();
    return h;
  }
  giong(o) { return this._tayCam('giong', o); }
  tiengOn(o) { return this._tayCam('tiengOn', o); }

  gio() { return this.sanSang ? this._ctx.currentTime : 0; }

  dungHet(giay = 0.3) {
    for (const h of [...this._tay]) h.tat(giay);
    this._tay.clear();
    try { this._loi?.dungHet(giay); } catch { /* */ }
  }
}

export const amThanh = new AmThanh();
export default amThanh;
