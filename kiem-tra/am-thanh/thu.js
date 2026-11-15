// Trang kiểm âm thanh (chạy trong Chrome ẩn, tắt tiếng): dựng từng tiếng trên OfflineAudioContext, đo, vẽ ảnh phổ.
// Không phát gì ra loa: OfflineAudioContext chỉ tính ra mảng số.
// Kết quả: window.__ketQua = { xong, hang: [{ nhom, ten, dat, so: {...}, loi: [...] }], wav: { ten: base64 } }
//          và <pre id="ket-qua-kiem"> (JSON) cho kiểu đọc giống tu-kiem.sh.

import { LoiAmThanh, AmThanh, DS_TIENG, DS_NEN, nguCung } from '../../src/khung/am-thanh.js';

const SR = 48000;
let TRE = 0; // độ trễ cố định của chuỗi đầu ra (bộ giới hạn đỉnh nhìn trước), đo ở kiemChuoi()
const hang = [];
const wav = {};
const anhPho = [];
const dB = (x) => (x > 0 ? 20 * Math.log10(x) : -999);
const lam = (x, k = 1) => (Number.isFinite(x) ? Number(x.toFixed(k)) : x);

// ───────── dựng ─────────
async function dung(giay, ham, tuyChon = {}) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * giay), SR);
  const loi = new LoiAmThanh(ctx, { hatGiong: 20261112, ...tuyChon });
  loi.datMucAm(0.7, 0.001);
  await ham(loi, ctx);
  const t0 = performance.now();
  const buf = await ctx.startRendering();
  const msDung = performance.now() - t0;
  await new Promise((r) => setTimeout(r, 60)); // cho các sự kiện onended kịp chạy
  return { buf, loi, l: buf.getChannelData(0), r: buf.getChannelData(1), msDung };
}

// ───────── đo ─────────
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    const wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const HANN = new Map();
function hann(n) {
  if (!HANN.has(n)) HANN.set(n, Float32Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
  return HANN.get(n);
}
function mono(l, r) { const m = new Float32Array(l.length); for (let i = 0; i < l.length; i++) m[i] = (l[i] + r[i]) / 2; return m; }

// STFT: trả về [{ pho: Float32Array (biên độ), nl: năng lượng khung }]
function stft(x, n = 2048, buoc = 1024) {
  const w = hann(n);
  const ds = [];
  for (let s = 0; s + n <= x.length; s += buoc) {
    const re = new Float32Array(n), im = new Float32Array(n);
    let nl = 0;
    for (let i = 0; i < n; i++) { re[i] = x[s + i] * w[i]; nl += x[s + i] * x[s + i]; }
    fft(re, im);
    const pho = new Float32Array(n / 2);
    for (let k = 0; k < n / 2; k++) pho[k] = Math.hypot(re[k], im[k]);
    ds.push({ pho, nl, s });
  }
  return ds;
}
// Trọng tâm phổ (Hz), lấy trung bình các khung theo năng lượng khung.
function trongTam(x, tu = 0, den = x.length) {
  const n = 2048;
  const ds = stft(x.subarray(tu, den), n, 1024);
  let tuSo = 0, mau = 0;
  for (const { pho, nl } of ds) {
    if (nl < 1e-12) continue;
    let a = 0, b = 0;
    for (let k = 1; k < n / 2; k++) { a += k * pho[k]; b += pho[k]; }
    if (b > 0) { tuSo += (a / b) * (SR / n) * nl; mau += nl; }
  }
  return mau ? tuSo / mau : 0;
}
// Tỉ lệ năng lượng trên `fc` Hz.
function tiLeCao(x, fc) {
  const n = 4096;
  const ds = stft(x, n, 2048);
  let cao = 0, tong = 0;
  const k0 = Math.floor((fc * n) / SR);
  for (const { pho } of ds) for (let k = 1; k < n / 2; k++) { const p = pho[k] * pho[k]; tong += p; if (k >= k0) cao += p; }
  return tong ? cao / tong : 0;
}
function do_(l, r, { tu = 0, den = null } = {}) {
  const n = l.length;
  let nan = 0, dinh = 0, tb = 0, maxD2 = 0;
  for (const x of [l, r]) {
    for (let i = 0; i < n; i++) {
      const v = x[i];
      if (!Number.isFinite(v)) { nan++; continue; }
      const a = Math.abs(v);
      if (a > dinh) dinh = a;
      tb += v;
      if (i > 1) { const d2 = Math.abs(v - 2 * x[i - 1] + x[i - 2]); if (d2 > maxD2) maxD2 = d2; }
    }
  }
  tb /= 2 * n;
  const i0 = Math.floor(tu * SR), i1 = den === null ? n : Math.min(n, Math.floor(den * SR));
  let e = 0;
  for (let i = i0; i < i1; i++) e += l[i] * l[i] + r[i] * r[i];
  const rms = Math.sqrt(e / (2 * Math.max(1, i1 - i0)));
  // thời lượng: từ mẫu đầu tới mẫu cuối vượt −60 dB so với đỉnh
  const nguong = dinh * 1e-3;
  let dau = -1, cuoi = -1;
  for (let i = 0; i < n; i++) if (Math.abs(l[i]) > nguong || Math.abs(r[i]) > nguong) { dau = i; break; }
  for (let i = n - 1; i >= 0; i--) if (Math.abs(l[i]) > nguong || Math.abs(r[i]) > nguong) { cuoi = i; break; }
  return {
    nan, dinh, dinhDb: dB(dinh), rmsDb: dB(rms), dcTi: dinh ? Math.abs(tb) / dinh : 0,
    mauDau: Math.max(Math.abs(l[0]), Math.abs(r[0])), mauCuoi: Math.max(Math.abs(l[n - 1]), Math.abs(r[n - 1])),
    tachTi: dinh ? maxD2 / dinh : 0,
    batDau: dau / SR, ketThuc: cuoi / SR,
  };
}
// Tần số theo cửa sổ, đo bằng đếm điểm cắt không đi lên (nội suy tuyến tính).
function tanSoCatKhong(x, tu, den) {
  const i0 = Math.max(1, Math.floor(tu * SR)), i1 = Math.min(x.length, Math.floor(den * SR));
  let dau = -1, cuoi = -1, dem = 0;
  for (let i = i0; i < i1; i++) {
    if (x[i - 1] < 0 && x[i] >= 0) {
      const t = i - 1 + x[i - 1] / (x[i - 1] - x[i]);
      if (dau < 0) dau = t;
      cuoi = t; dem++;
    }
  }
  return dem >= 2 ? ((dem - 1) * SR) / (cuoi - dau) : NaN;
}

function ghi(nhom, ten, so, loi, ghiChu = '') {
  hang.push({ nhom, ten, dat: !loi.length, so, loi, ghiChu });
}
function kiem(loi, dk, thongBao) { if (!dk) loi.push(thongBao); }

// WAV 16 bit hai kênh, base64.
function wavB64(l, r) {
  const n = l.length;
  const b = new ArrayBuffer(44 + n * 4);
  const v = new DataView(b);
  const chu = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  chu(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); chu(8, 'WAVE'); chu(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, SR, true);
  v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); chu(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, l[i])) * 32767, true);
    v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, r[i])) * 32767, true);
  }
  const u = new Uint8Array(b);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}

// ───────── các mục kiểm ─────────
async function kiemChuoi() {
  {
    // Độ trễ cố định: một xung sin bắt đầu đúng 0,1 giây đi vào mức chung.
    const { l, r } = await dung(0.5, (loi, ctx) => {
      const o = ctx.createOscillator(); o.frequency.value = 440;
      const g = ctx.createGain(); g.gain.value = 0.05;
      o.connect(g); g.connect(loi.tong); o.start(0.1); o.stop(0.3);
    }, { vang: false });
    const m = mono(l, r);
    let i = 0;
    while (i < m.length && Math.abs(m[i]) < 1e-6) i++;
    TRE = (i - 1) / SR - 0.1;
    const loi = [];
    kiem(loi, TRE >= 0 && TRE < 0.012, `trễ ${(TRE * 1000).toFixed(2)} ms`);
    ghi('chuỗi', 'độ trễ cố định của chuỗi', { 'ms': lam(TRE * 1000, 2) }, loi, 'bộ giới hạn đỉnh của WebAudio nhìn trước 6 ms; mọi tiếng trễ như nhau');
  }
  // Độ lợi chuỗi đầu ra cho tiếng nhỏ phải là 1 (0 dB); tiếng rất to phải bị giữ dưới 0,9.
  for (const [ten, bienDo, ham] of [['tiếng nhỏ −40 dBFS', 0.01, (d) => Math.abs(d) < 0.5], ['tiếng rất to +10 dBFS', 3.16, null]]) {
    const { l, r } = await dung(1.5, (loi, ctx) => {
      const o = ctx.createOscillator(); o.frequency.value = 440;
      const g = ctx.createGain(); g.gain.value = bienDo;
      o.connect(g); g.connect(loi.tong); o.start(0); o.stop(1.0);
    }, { vang: false });
    const s = do_(l, r, { tu: 0.5, den: 0.9 });
    const loi = [];
    const doLoi = s.rmsDb - dB(bienDo / Math.SQRT2);
    if (ham) kiem(loi, ham(doLoi), `độ lợi ${doLoi.toFixed(2)} dB, cần 0 ± 0,5 dB`);
    else kiem(loi, s.dinh <= 0.9, `đỉnh ${s.dinh.toFixed(3)} vượt 0,9`);
    ghi('chuỗi', ten, { 'độ lợi dB': lam(doLoi, 2), 'đỉnh dBFS': lam(s.dinhDb) }, loi);
  }
}

const KHOANG_DINH_GD = { re: [-34, -26], _: [-22.5, -17.5] };
async function kiemKhoiDau() {
  // Tiếng phát ngay lúc ngữ cảnh vừa chạy phải to như tiếng phát muộn (bộ giới hạn đỉnh không được «nuốt» tiếng đầu).
  const ds = [];
  for (const tre of [0, 0.02, 0.05, 0.1, 0.2, 0.4]) {
    const { l, r } = await dung(tre + 1.2, (loi) => loi.phat('bam', { tre }), { vang: false });
    ds.push([tre, do_(l, r).dinhDb]);
  }
  const chuan = ds[ds.length - 1][1];
  const loi = [];
  for (const [tre, d] of ds) kiem(loi, Math.abs(d - chuan) < 1, `phát lúc ${tre} s: đỉnh ${d.toFixed(1)} dBFS, phát muộn ${chuan.toFixed(1)}`);
  ghi('chuỗi', 'tiếng đầu tiên sau khi ngữ cảnh chạy', Object.fromEntries(ds.map(([t, d]) => [`lúc ${t} s`, lam(d)])), loi);
}

async function kiemGiaoDien() {
  for (const ten of DS_TIENG) {
    const giay = ten === 'bat-dau' ? 6.5 : 4;
    const { l, r, loi: lo } = await dung(giay, (loi) => loi.phat(ten, { tre: 0.1 }));
    const s = do_(l, r);
    const m = mono(l, r);
    const tt = trongTam(m);
    const loi = [];
    const [a, b] = KHOANG_DINH_GD[ten] || KHOANG_DINH_GD._;
    kiem(loi, s.nan === 0, `${s.nan} mẫu NaN`);
    kiem(loi, s.dinhDb >= a && s.dinhDb <= b, `đỉnh ${s.dinhDb.toFixed(1)} dBFS ngoài [${a}, ${b}]`);
    kiem(loi, s.dcTi < 0.01, `lệch một chiều ${(s.dcTi * 100).toFixed(2)}% đỉnh`);
    kiem(loi, s.mauDau < 1e-4 && s.mauCuoi < 1e-4, `mẫu đầu/cuối ${s.mauDau.toExponential(1)} / ${s.mauCuoi.toExponential(1)}`);
    kiem(loi, s.tachTi < 0.35, `có thể có tiếng tách (độ gắt ${s.tachTi.toFixed(2)})`);
    kiem(loi, tt < 3000, `trọng tâm phổ ${tt.toFixed(0)} Hz ≥ 3 kHz`);
    kiem(loi, Math.abs(s.batDau - 0.1 - TRE) < (ten === 'bat-dau' ? 0.03 : 0.004), `bắt đầu lúc ${s.batDau.toFixed(3)} giây, cần 0,1`);
    kiem(loi, lo.soTiengSong() === 0, `còn ${lo.soTiengSong()} tiếng chưa ngắt nối`);
    ghi('giao diện', ten, {
      'đỉnh dBFS': lam(s.dinhDb), 'trọng tâm Hz': Math.round(tt), 'dài giây': lam(s.ketThuc - s.batDau, 2),
      'độ gắt': lam(s.tachTi, 3), 'một chiều %': lam(s.dcTi * 100, 3),
    }, loi);
    wav[`giao-dien-${ten}`] = wavB64(l, r);
    anhPho.push({ ten: `Giao diện «${ten}»`, m, giay });
  }
}

async function kiemNen() {
  for (const kieu of DS_NEN) {
    const { l, r, msDung } = await dung(20, (loi) => { loi.nen(kieu, { giay: 4 }); loi.lap(20); });
    const s = do_(l, r, { tu: 6, den: 20 });
    const m = mono(l, r);
    const tt = trongTam(m, 6 * SR);
    // RMS từng giây (6–20 s) để xem độ đều
    const rmsGiay = [];
    for (let k = 6; k < 20; k++) rmsGiay.push(do_(l.subarray(k * SR, (k + 1) * SR), r.subarray(k * SR, (k + 1) * SR)).rmsDb);
    const loi = [];
    kiem(loi, s.nan === 0, `${s.nan} mẫu NaN`);
    kiem(loi, s.rmsDb >= -35 && s.rmsDb <= -29, `RMS ${s.rmsDb.toFixed(1)} dBFS ngoài [−35, −29]`);
    kiem(loi, s.dinhDb < -14, `đỉnh ${s.dinhDb.toFixed(1)} dBFS quá cao`);
    kiem(loi, s.dcTi < 0.01, `lệch một chiều ${(s.dcTi * 100).toFixed(2)}%`);
    kiem(loi, s.tachTi < 0.2, `độ gắt ${s.tachTi.toFixed(2)}`);
    kiem(loi, tt < 2000, `trọng tâm phổ ${tt.toFixed(0)} Hz`);
    kiem(loi, s.mauDau < 1e-4, `mẫu đầu ${s.mauDau}`);
    kiem(loi, Math.max(...rmsGiay) - Math.min(...rmsGiay) < 10, `RMS từng giây dao động ${(Math.max(...rmsGiay) - Math.min(...rmsGiay)).toFixed(1)} dB`);
    ghi('nhạc nền', kieu, {
      'RMS dBFS (6–20 s)': lam(s.rmsDb), 'đỉnh dBFS': lam(s.dinhDb), 'trọng tâm Hz': Math.round(tt),
      'RMS từng giây min…max': `${lam(Math.min(...rmsGiay))}…${lam(Math.max(...rmsGiay))}`,
      'thời gian dựng 20 s (ms)': Math.round(msDung),
    }, loi);
    wav[`nhac-nen-${kieu}`] = wavB64(l, r);
    anhPho.push({ ten: `Nhạc nền «${kieu}» (20 giây)`, m, giay: 20, rong: true });
  }
  // Chuyển kiểu giữa chừng: vu-tru → he-qua lúc 8 giây, hoà chuyển 4 giây; rồi tắt lúc 18 giây.
  const { l, r } = await dung(24, (loi, ctx) => {
    loi.nen('vu-tru', { giay: 4 }); loi.lap(8.5);
    ctx.suspend(8).then(() => { loi.nen('he-qua', { giay: 4 }); loi.lap(24); ctx.resume(); });
    ctx.suspend(18).then(() => { loi.nen(null, { giay: 3 }); loi.lap(24); ctx.resume(); });
  });
  const s = do_(l, r);
  const cs = [];
  for (let k = 10; k < 48; k++) cs.push(do_(l.subarray(k * SR / 2, (k + 1) * SR / 2), r.subarray(k * SR / 2, (k + 1) * SR / 2)).rmsDb);
  let nhay = 0;
  for (let k = 1; k < 26; k++) nhay = Math.max(nhay, Math.abs(cs[k] - cs[k - 1])); // 5–18 s
  const cuoi = do_(l.subarray(23 * SR), r.subarray(23 * SR));
  const loi = [];
  kiem(loi, s.nan === 0, 'NaN');
  kiem(loi, nhay < 4, `mức nhảy ${nhay.toFixed(1)} dB giữa hai nửa giây liền nhau`);
  kiem(loi, s.tachTi < 0.2, `độ gắt ${s.tachTi.toFixed(2)}`);
  kiem(loi, cuoi.dinh < 1e-3, `sau khi tắt vẫn còn tiếng (${cuoi.dinhDb.toFixed(1)} dBFS)`);
  ghi('nhạc nền', 'chuyển vu-tru → he-qua → tắt', { 'nhảy lớn nhất dB/0,5 s': lam(nhay), 'còn lại lúc 23 s dBFS': lam(cuoi.dinhDb) }, loi);
  wav['nhac-nen-chuyen-kieu'] = wavB64(l, r);
}

async function kiemMoHinh() {
  // tich: mặc định, một tiếng
  {
    const { l, r, loi: lo } = await dung(0.6, (loi) => loi.tich({ tre: 0.1 }), { vang: false });
    const s = do_(l, r);
    const loi = [];
    kiem(loi, s.nan === 0, 'NaN');
    kiem(loi, s.dinhDb > -23 && s.dinhDb < -15, `đỉnh ${s.dinhDb.toFixed(1)} dBFS (mong −18)`);
    kiem(loi, Math.abs(s.batDau - 0.1 - TRE) < 0.002, `bắt đầu ${s.batDau.toFixed(4)}`);
    kiem(loi, Math.abs(s.ketThuc - 0.15 - TRE) < 0.01, `kết thúc ${s.ketThuc.toFixed(3)}, mong 0,15`);
    kiem(loi, s.mauDau < 1e-4 && s.mauCuoi < 1e-4, 'mẫu đầu/cuối khác 0');
    kiem(loi, lo.soTiengSong() === 0, 'chưa ngắt nối');
    ghi('mô hình', 'tich (mặc định)', { 'đỉnh dBFS': lam(s.dinhDb), 'dài giây': lam(s.ketThuc - s.batDau, 3), 'độ gắt': lam(s.tachTi, 2) }, loi, 'tích cố ý vào nhanh 1,5 ms nên độ gắt cao là đúng dạng');
    anhPho.push({ ten: 'tich mặc định', m: mono(l, r), giay: 0.6 });
  }
  // tich: chuỗi 20 nhịp cách 0,25 giây, xếp lịch bằng tre: kiểm độ chính xác thời điểm
  {
    const { l, r } = await dung(5.6, (loi) => { for (let k = 0; k < 20; k++) loi.tich({ tre: 0.1 + k * 0.25, tanSo: 1200, doTo: 0.6 }); }, { vang: false });
    const s = do_(l, r);
    const m = mono(l, r);
    let lech = 0;
    for (let k = 0; k < 20; k++) {
      const mong = 0.1 + k * 0.25 + TRE;
      let i = Math.floor((mong - 0.01) * SR);
      while (i < m.length && Math.abs(m[i]) < s.dinh * 0.05) i++;
      lech = Math.max(lech, Math.abs(i / SR - mong));
    }
    const loi = [];
    kiem(loi, lech < 0.0015, `lệch thời điểm ${(lech * 1000).toFixed(2)} ms`);
    ghi('mô hình', 'tich: 20 nhịp xếp lịch', { 'lệch lớn nhất ms': lam(lech * 1000, 2) }, loi);
    wav['mo-hinh-tich-20-nhip'] = wavB64(l, r);
  }
  // not: bốn dạng
  for (const dang of ['chuong', 'mem', 'day', 'kinh']) {
    const { l, r } = await dung(1.4, (loi) => loi.not({ tanSo: 440, dai: 0.8, tre: 0.1, dang }), { vang: false });
    const s = do_(l, r);
    const m = mono(l, r);
    const tt = trongTam(m);
    const loi = [];
    kiem(loi, s.nan === 0, 'NaN');
    kiem(loi, s.dinhDb > -24 && s.dinhDb < -17, `đỉnh ${s.dinhDb.toFixed(1)} dBFS (mong −20)`);
    const dai = s.ketThuc - 0.1 - TRE;
    kiem(loi, dai > 0.8 * 0.85 && dai < 0.8 * 1.05, `dài ${dai.toFixed(3)} giây, mong 0,8`);
    kiem(loi, s.tachTi < 0.35, `độ gắt ${s.tachTi.toFixed(2)}`);
    kiem(loi, s.dcTi < 0.01, 'lệch một chiều');
    kiem(loi, s.mauDau < 1e-4 && s.mauCuoi < 1e-4, 'mẫu đầu/cuối khác 0');
    ghi('mô hình', `not '${dang}' 440 Hz`, { 'đỉnh dBFS': lam(s.dinhDb), 'dài giây': lam(dai, 3), 'trọng tâm Hz': Math.round(tt), 'độ gắt': lam(s.tachTi, 3) }, loi);
    wav[`mo-hinh-not-${dang}`] = wavB64(l, r);
    anhPho.push({ ten: `not '${dang}'`, m, giay: 1.4 });
  }
  // giong: chỉnh mỗi khung hình (60 lần mỗi giây) — cao độ lượn 165–330 Hz, độ to lượn; tắt lúc 2,6 giây
  for (const dang of ['mem', 'day', 'kinh']) {
    let tay = null;
    const mucTieu = (t) => 247 + 82 * Math.sin(2 * Math.PI * 0.4 * t);
    const { l, r } = await dung(3.4, (loi, ctx) => {
      tay = loi.giong({ dang, tanSo: mucTieu(0), doTo: 0 });
      for (let k = 1; k < 156; k++) {
        const t = (k * 128 * 6) / SR; // mỗi 6 khối 128 mẫu ≈ 1/62 giây
        ctx.suspend(t).then(() => { tay.dat({ tanSo: mucTieu(t), doTo: 0.5 + 0.25 * Math.sin(2 * Math.PI * 0.7 * t) }); ctx.resume(); });
      }
      ctx.suspend(2.6).then(() => { tay.tat(0.4); ctx.resume(); });
    }, { vang: false });
    const s = do_(l, r);
    const m = mono(l, r);
    let saiF = 0;
    for (const t of [0.5, 1, 1.5, 2, 2.4]) {
      const f = tanSoCatKhong(m, t - 0.02, t + 0.02);
      saiF = Math.max(saiF, Math.abs(f / mucTieu(t) - 1));
    }
    const hf = tiLeCao(m, 8000);
    const loi = [];
    kiem(loi, s.nan === 0, 'NaN');
    kiem(loi, s.tachTi < 0.12, `độ gắt ${s.tachTi.toFixed(3)} (có thể lạo xạo)`);
    kiem(loi, hf < 1e-4, `năng lượng trên 8 kHz ${hf.toExponential(1)}`);
    kiem(loi, saiF < 0.06, `bám cao độ sai ${(saiF * 100).toFixed(1)}%`);
    kiem(loi, s.ketThuc < 3.05 + TRE && s.mauCuoi < 1e-5, `tắt chưa hết (${s.ketThuc.toFixed(2)} giây)`);
    kiem(loi, s.dinhDb < -10, `đỉnh ${s.dinhDb.toFixed(1)}`);
    ghi('mô hình', `giong '${dang}' chỉnh 155 lần`, {
      'đỉnh dBFS': lam(s.dinhDb), 'độ gắt': lam(s.tachTi, 4), 'trên 8 kHz': hf.toExponential(1), 'sai cao độ %': lam(saiF * 100, 2), 'hết lúc giây': lam(s.ketThuc, 2),
    }, loi);
    wav[`mo-hinh-giong-${dang}`] = wavB64(l, r);
    anhPho.push({ ten: `giong '${dang}' (chỉnh mỗi khung hình)`, m, giay: 3.4 });
  }
  // tiengOn: bộ lọc quét 300 → 3000 Hz, tắt lúc 2,5 giây
  for (const mau of ['hong', 'nau', 'trang']) {
    let tay = null;
    const { l, r } = await dung(3.2, (loi, ctx) => {
      tay = loi.tiengOn({ mau, tanSoLoc: 300, doTo: 0 });
      for (let k = 1; k < 140; k++) {
        const t = (k * 128 * 7) / SR;
        ctx.suspend(t).then(() => {
          if (t < 2.5) tay.dat({ tanSoLoc: 300 * 10 ** (t / 2.5), doTo: 0.6, lech: Math.sin(t * 2) * 0.5 });
          else tay.tat(0.4);
          ctx.resume();
        });
      }
    }, { vang: false });
    const s = do_(l, r, { tu: 0.5, den: 2.4 });
    const loi = [];
    kiem(loi, s.nan === 0, 'NaN');
    kiem(loi, s.dinhDb < -6, `đỉnh ${s.dinhDb.toFixed(1)}`);
    kiem(loi, s.rmsDb > -40 && s.rmsDb < -16, `RMS ${s.rmsDb.toFixed(1)}`);
    kiem(loi, s.dcTi < 0.02, 'lệch một chiều');
    kiem(loi, s.mauCuoi < 1e-5 && s.ketThuc < 3.0, `tắt chưa hết (${s.ketThuc.toFixed(2)} giây)`);
    ghi('mô hình', `tiengOn '${mau}'`, { 'RMS dBFS': lam(s.rmsDb), 'đỉnh dBFS': lam(s.dinhDb), 'hết lúc giây': lam(s.ketThuc, 2) }, loi);
    if (mau === 'hong') { wav['mo-hinh-tieng-on-hong'] = wavB64(l, r); anhPho.push({ ten: "tiengOn 'hong' lọc 300→3000 Hz", m: mono(l, r), giay: 3.2 }); }
  }
  // quet
  for (const [tenK, o] of [
    ['200→800 Hz, 1,5 s, mu 1', { tu: 200, den: 800, giay: 1.5, mu: 1 }],
    ['40→400 Hz, 2 s, mu 3 (kiểu chirp)', { tu: 40, den: 400, giay: 2, mu: 3 }],
    ['900→300 Hz, 0,8 s, đi xuống', { tu: 900, den: 300, giay: 0.8, mu: 1 }],
  ]) {
    const tre = 0.1;
    const { l, r } = await dung(o.giay + 0.5, (loi) => loi.quet({ ...o, tre, doTo: 0.5 }), { vang: false });
    const s = do_(l, r);
    const m = mono(l, r);
    const fMong = (tau) => o.tu + (o.den - o.tu) * (tau / o.giay) ** o.mu;
    let saiLon = 0, dieuDo = true, truoc = null, soCua = 0;
    for (let tau = 0.05; tau < o.giay - 0.07; tau += 0.02) {
      const fm = fMong(tau);
      const nua = Math.max(0.02, 1.6 / fm);
      if (tau - nua < 0.02 || tau + nua > o.giay - 0.06) continue;
      const f = tanSoCatKhong(m, tre + tau - nua, tre + tau + nua);
      saiLon = Math.max(saiLon, Math.abs(f / fm - 1));
      if (truoc !== null && (o.den > o.tu ? f < truoc * 0.97 : f > truoc * 1.03)) dieuDo = false;
      truoc = f; soCua++;
    }
    const loi = [];
    kiem(loi, s.nan === 0, 'NaN');
    kiem(loi, soCua >= 10, `chỉ đo được ${soCua} cửa sổ`);
    kiem(loi, saiLon < 0.08, `tần số lệch đường mong muốn ${(saiLon * 100).toFixed(1)}%`);
    kiem(loi, dieuDo, 'tần số không đổi đều một chiều');
    kiem(loi, Math.abs(s.batDau - tre - TRE) < 0.004, `bắt đầu ${s.batDau.toFixed(3)}`);
    kiem(loi, Math.abs(s.ketThuc - (tre + o.giay + TRE)) < 0.015, `kết thúc ${s.ketThuc.toFixed(3)}, mong ${(tre + o.giay).toFixed(3)}`);
    kiem(loi, s.mauDau < 1e-4 && s.mauCuoi < 1e-4, 'mẫu đầu/cuối khác 0');
    kiem(loi, s.tachTi < 0.2, `độ gắt ${s.tachTi.toFixed(3)}`);
    ghi('mô hình', `quet ${tenK}`, { 'đỉnh dBFS': lam(s.dinhDb), 'sai tần số %': lam(saiLon * 100, 2), 'số cửa sổ': soCua, 'dài giây': lam(s.ketThuc - s.batDau, 3) }, loi);
    wav[`mo-hinh-quet-${o.tu}-${o.den}`] = wavB64(l, r);
    anhPho.push({ ten: `quet ${tenK}`, m, giay: o.giay + 0.5 });
  }
}

async function kiemDon() {
  const ngau = (() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
  const tinhHuong = [
    ['1 000 tiếng giao diện cùng một lúc', (loi) => { for (let k = 0; k < 1000; k++) loi.phat(DS_TIENG[k % DS_TIENG.length]); }],
    ['1 000 tiếng giao diện rải trong 1 giây', (loi) => { for (let k = 0; k < 1000; k++) loi.phat(DS_TIENG[Math.floor(ngau() * DS_TIENG.length)], { tre: ngau(), lech: ngau() * 2 - 1, cao: 0.5 + ngau() }); }],
    ['1 «bam» lúc 0 (đối chiếu)', (loi) => loi.phat('bam')],
    ['1 000 «bam» cùng một lúc', (loi) => { for (let k = 0; k < 1000; k++) loi.phat('bam'); }],
    ['1 000 not + 1 000 tich doTo 1, rải trong 1 giây', (loi) => {
      for (let k = 0; k < 1000; k++) {
        loi.not({ tanSo: nguCung(Math.floor(ngau() * 12)), doTo: 1, tre: ngau(), dang: ['chuong', 'mem', 'day', 'kinh'][k % 4] });
        loi.tich({ doTo: 1, tre: ngau() });
      }
    }],
    ['mọi thứ cùng lúc + nhạc nền + 30 giong', (loi) => {
      loi.nen('vu-tru-hoc', { giay: 0.5 }); loi.lap(6);
      for (let k = 0; k < 30; k++) loi.giong({ tanSo: 100 + k * 37, doTo: 1, dang: 'day' });
      for (let k = 0; k < 10; k++) loi.tiengOn({ doTo: 1, tanSoLoc: 5000 });
      for (let k = 0; k < 1000; k++) { loi.phat(DS_TIENG[k % 15], { tre: ngau() * 2 }); loi.quet({ tu: 100, den: 2000, giay: 0.5, doTo: 1, tre: ngau() * 2 }); }
    }],
  ];
  for (const [ten, ham] of tinhHuong) {
    let lonNhat = 0;
    const { l, r, loi: lo } = await dung(6, (loi) => {
      const goc = loi.moTieng.bind(loi);
      loi.moTieng = (...a) => { const v = goc(...a); lonNhat = Math.max(lonNhat, loi.dangPhat.gd.length, loi.dangPhat.mh.length); return v; };
      ham(loi);
      if (!ten.includes('nhạc nền')) return;
      for (const t of [...loi.keoDai]) t.dat({ doTo: 1 });
    });
    const s = do_(l, r);
    const loi = [];
    kiem(loi, s.nan === 0, 'NaN');
    kiem(loi, s.dinh <= 0.9, `đỉnh ${s.dinh.toFixed(3)} vượt 0,9`);
    kiem(loi, lonNhat <= 48, `có lúc ${lonNhat} tiếng cùng chạy`);
    if (!ten.includes('giong')) kiem(loi, lo.soTiengSong() === 0, `còn ${lo.soTiengSong()} tiếng chưa ngắt nối sau khi xong`);
    ghi('dồn dập', ten, { 'đỉnh dBFS': lam(s.dinhDb), 'số tiếng cùng chạy tối đa': lonNhat, 'còn nút sau khi xong': lo.soTiengSong() }, loi);
    if (ten.startsWith('1 000 tiếng giao diện rải')) wav['don-1000-tieng'] = wavB64(l, r);
  }
}

async function kiemLopApp() {
  // Đếm số AudioContext được tạo.
  const Goc = window.AudioContext;
  let soTao = 0;
  window.AudioContext = class extends Goc { constructor(...a) { super(...a); soTao++; } };
  const goiHet = (a, n) => {
    let loiNem = 0;
    for (let k = 0; k < n; k++) {
      try {
        a.phat(DS_TIENG[k % 15], { tre: 0.01 }); a.tich({}); a.not({ tanSo: 300 }); a.quet({ tu: 100, den: 200, giay: 0.2 });
        const g = a.giong({ tanSo: 200 }); g.dat({ tanSo: 210, doTo: 0.3 }); g.tat(0.1);
        const o = a.tiengOn({}); o.dat({ doTo: 0.2 }); o.tat();
        a.nen(DS_NEN[k % 5]); a.gio(); a.dungHet(0.05);
        a.phat('khong-co'); a.nen('khong-co'); a.not(); a.quet(); a.tich(null);
      } catch (e) { loiNem++; if (loiNem === 1) console.error(e); }
    }
    return loiNem;
  };
  {
    const a = new AmThanh();
    a.khoa(); a.khoiDong(); a.datBat(true); a.datBatNen(true);
    const t0 = performance.now();
    const loiNem = goiHet(a, 20000);
    const loi = [];
    kiem(loi, soTao === 0, `đã tạo ${soTao} AudioContext`);
    kiem(loi, loiNem === 0, `${loiNem} lần ném lỗi`);
    kiem(loi, a.sanSang === false && a.gio() === 0, 'khoá rồi mà vẫn báo sẵn sàng');
    ghi('lớp app', 'khoa() rồi gọi mọi hàm 20 000 lượt', { 'AudioContext tạo ra': soTao, 'ms': Math.round(performance.now() - t0) }, loi);
  }
  {
    const a = new AmThanh();
    const loiNem = goiHet(a, 20000);
    const loi = [];
    kiem(loi, soTao === 0, `đã tạo ${soTao} AudioContext dù chưa khoiDong()`);
    kiem(loi, loiNem === 0, `${loiNem} lần ném lỗi`);
    ghi('lớp app', 'chưa khoiDong(), gọi mọi hàm 20 000 lượt', { 'AudioContext tạo ra': soTao }, loi);
  }
  {
    // Lưu lựa chọn
    const cu = {};
    const khoa = ['vu-tru-3d.tieng', 'vu-tru-3d.muc-am', 'vu-tru-3d.nhac-nen'];
    for (const k of khoa) cu[k] = localStorage.getItem(k);
    for (const k of khoa) localStorage.removeItem(k);
    const a = new AmThanh();
    const loi = [];
    kiem(loi, a.bat === true && a.mucAm === 0.7 && a.batNen === true, `mặc định sai: ${a.bat} ${a.mucAm} ${a.batNen}`);
    a.datBat(false); a.datMucAm(0.35); a.datBatNen(false);
    const b = new AmThanh();
    kiem(loi, b.bat === false && b.mucAm === 0.35 && b.batNen === false, `đọc lại sai: ${b.bat} ${b.mucAm} ${b.batNen}`);
    kiem(loi, localStorage.getItem('vu-tru-3d.muc-am') === '0.35', 'khoá «vu-tru-3d.muc-am» sai');
    a.datMucAm(7); kiem(loi, a.mucAm === 1, 'không kẹp mức âm');
    for (const k of khoa) { if (cu[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, cu[k]); }
    ghi('lớp app', 'lưu lựa chọn (localStorage)', { khoá: khoa.join(', ') }, loi);
  }
  {
    // Ngữ cảnh thật (Chrome ẩn có --mute-audio và cho tự phát): khởi động, phát, tay cầm tạo trước khi sẵn sàng, khoá.
    for (const k of ['vu-tru-3d.tieng', 'vu-tru-3d.muc-am', 'vu-tru-3d.nhac-nen']) localStorage.removeItem(k);
    const a = new AmThanh();
    const tay = a.giong({ tanSo: 220 });
    a.nen('he-qua');
    a.khoiDong();
    for (let k = 0; k < 40 && a._ctx?.state !== 'running'; k++) await new Promise((r) => setTimeout(r, 50));
    const loi = [];
    const trangThai = a._ctx?.state;
    kiem(loi, soTao === 1, `tạo ${soTao} AudioContext, mong 1`);
    kiem(loi, a.sanSang, `chưa sẵn sàng (trạng thái ${trangThai})`);
    tay.dat({ doTo: 0.3 });
    const coThat = a._loi?.keoDai.size === 1;
    kiem(loi, coThat, 'tay cầm tạo trước khi sẵn sàng không thành tiếng thật');
    a.khoiDong(); // gọi lại không tạo thêm
    kiem(loi, soTao === 1, 'gọi khoiDong() lần hai lại tạo thêm AudioContext');
    const t0 = performance.now();
    let lonNhat = 0;
    for (let k = 0; k < 10000; k++) {
      a.phat(DS_TIENG[k % 15]); a.tich({ tre: (k % 50) * 0.01 }); a.not({ tanSo: 440 });
      lonNhat = Math.max(lonNhat, a._loi.dangPhat.gd.length, a._loi.dangPhat.mh.length);
    }
    const ms = performance.now() - t0;
    kiem(loi, lonNhat <= 48, `có lúc ${lonNhat} tiếng`);
    a.dungHet();
    kiem(loi, a._loi.keoDai.size === 0, 'dungHet() không tắt hết âm kéo dài');
    a.datBat(false);
    kiem(loi, !a.sanSang, 'tắt tiếng mà vẫn sẵn sàng');
    a.datBat(true);
    a.khoa();
    kiem(loi, a._ctx === null && !a.sanSang, 'khoa() không đóng ngữ cảnh');
    ghi('lớp app', 'ngữ cảnh thật: khởi động, 30 000 lượt gọi, khoá', { 'trạng thái': trangThai, 'ms cho 30 000 lượt': Math.round(ms), 'tiếng cùng chạy tối đa': lonNhat }, loi);
  }
  window.AudioContext = Goc;
}

// ───────── vẽ ảnh phổ ─────────
function mauNhiet(v) {
  // v 0..1 → màu kiểu «magma»
  const ds = [[0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99], [212, 72, 66], [245, 125, 21], [250, 193, 39], [252, 255, 164]];
  const x = Math.max(0, Math.min(0.9999, v)) * (ds.length - 1);
  const i = Math.floor(x), f = x - i;
  return ds[i].map((c, k) => Math.round(c + (ds[i + 1][k] - c) * f));
}
function vePho({ ten, m, giay, rong }) {
  const W = rong ? 1360 : 440, H = 200, D = 50;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H + D + 22;
  const g = cv.getContext('2d');
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, cv.width, cv.height);
  const n = 2048;
  const buoc = Math.max(64, Math.floor(m.length / W));
  const w = hann(n);
  const img = g.createImageData(W, H);
  const fMin = 40, fMax = 16000;
  let dinh = 1e-9;
  const cot = [];
  for (let x = 0; x < W; x++) {
    const s = Math.floor((x * m.length) / W) - n / 2;
    const re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 0; i < n; i++) { const j = s + i; re[i] = j >= 0 && j < m.length ? m[j] * w[i] : 0; }
    fft(re, im);
    const c = new Float32Array(H);
    for (let y = 0; y < H; y++) {
      const f = fMin * (fMax / fMin) ** (1 - y / (H - 1));
      const k = Math.min(n / 2 - 1, Math.round((f * n) / SR));
      c[y] = Math.hypot(re[k], im[k]);
      if (c[y] > dinh) dinh = c[y];
    }
    cot.push(c);
  }
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) {
    const v = (dB(cot[x][y] / dinh) + 90) / 90;
    const [r_, g_, b_] = mauNhiet(v);
    const o = (y * W + x) * 4;
    img.data[o] = r_; img.data[o + 1] = g_; img.data[o + 2] = b_; img.data[o + 3] = 255;
  }
  g.putImageData(img, 0, 22);
  // vạch tần số
  g.font = '10px sans-serif'; g.fillStyle = 'rgba(255,255,255,.55)';
  for (const f of [100, 300, 1000, 3000, 10000]) {
    const y = 22 + (1 - Math.log(f / fMin) / Math.log(fMax / fMin)) * (H - 1);
    g.fillRect(0, y, 6, 1); g.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, 8, y + 3);
  }
  // dạng sóng (bao biên độ)
  const y0 = 22 + H + D / 2;
  let dinhSong = 1e-9;
  for (let i = 0; i < m.length; i++) dinhSong = Math.max(dinhSong, Math.abs(m[i]));
  g.fillStyle = '#7fb8ff';
  for (let x = 0; x < W; x++) {
    let a = 0;
    const i0 = Math.floor((x * m.length) / W), i1 = Math.floor(((x + 1) * m.length) / W);
    for (let i = i0; i < i1; i++) a = Math.max(a, Math.abs(m[i]));
    const h = (a / dinhSong) * (D / 2 - 2);
    g.fillRect(x, y0 - h, 1, Math.max(1, 2 * h));
  }
  g.fillStyle = '#fff'; g.font = '13px sans-serif';
  g.fillText(`${ten} · ${giay} giây · đỉnh ${dB(dinhSong).toFixed(1)} dBFS`, 6, 15);
  const o = document.createElement('div');
  o.className = rong ? 'o rong' : 'o';
  o.append(cv);
  return o;
}

// ───────── chạy ─────────
async function chay() {
  document.body.innerHTML = '<h1>Kiểm âm thanh Vũ trụ 3D</h1><div id="luoi"></div>';
  const st = document.createElement('style');
  st.textContent = 'body{background:#05060a;color:#ddd;font:14px sans-serif;margin:16px}#luoi{display:flex;flex-wrap:wrap;gap:12px}.o{width:440px}.o.rong{width:1360px}';
  document.head.append(st);
  const kq = { xong: false, hang, wav };
  window.__ketQua = kq;
  try {
    // Hợp đồng: danh sách tên
    const loi = [];
    const mongTieng = 'bam re buoc buoc-lui bai mo dong dung sai dat nam tha gat bat-dau loi'.split(' ');
    const mongNen = 'vu-tru khong-thoi-gian trong-luc he-qua vu-tru-hoc'.split(' ');
    kiem(loi, JSON.stringify(DS_TIENG) === JSON.stringify(mongTieng), 'DS_TIENG khác hợp đồng');
    kiem(loi, JSON.stringify(DS_NEN) === JSON.stringify(mongNen), 'DS_NEN khác hợp đồng');
    ghi('hợp đồng', 'DS_TIENG, DS_NEN', { 'số tiếng': DS_TIENG.length, 'số kiểu nền': DS_NEN.length }, loi);
    await kiemChuoi();
    await kiemKhoiDau();
    await kiemGiaoDien();
    await kiemMoHinh();
    await kiemNen();
    await kiemDon();
    await kiemLopApp();
  } catch (e) {
    hang.push({ nhom: 'lỗi', ten: 'bộ kiểm dừng giữa chừng', dat: false, so: {}, loi: [String(e?.stack || e)] });
  }
  const luoi = document.getElementById('luoi');
  for (const a of anhPho) luoi.append(vePho(a));
  const pre = document.createElement('pre');
  pre.id = 'ket-qua-kiem'; pre.hidden = true;
  pre.textContent = JSON.stringify(hang);
  document.body.append(pre);
  kq.xong = true;
  document.title = hang.every((h) => h.dat) ? 'KIEM:DAT' : 'KIEM:LOI';
}
chay();
