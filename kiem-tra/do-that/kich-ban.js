// Kịch bản ĐO THẬT (chèn vào trang trước khi nạp, dùng với app-mac --do-that).
// Đi đúng đường của người dùng: màn hình chào → bấm «Bắt đầu học» (hoặc một bài) → để mô hình chạy → ghi lại TỪNG khung hình.
// Tham số qua window.__KB (đặt bằng --thu-js): { choChao: 2500, giay: 30, bai: null|số (1 là Bài 1), buoc: null|số, rePhut: true }
(function () {
  var KB = Object.assign({ choChao: 2500, giay: 30, bai: null, buoc: null, re: true }, window.__KB || {});
  window.__VT_THU = Object.assign(window.__VT_THU || {}, { ep60: true });      // cửa sổ đo không phải cửa sổ đang chọn: ép nhịp 60 như thật
  var D = { raf: [], buoc: [], tp: { capNhat: 0, ve: 0, nhan: 0, tt: 0, hud: 0 }, giay: [], moc: {}, loi: [] };
  var T0 = performance.now();
  // Bọc MỌI lệnh WebGL: đếm số lần gọi và thời gian trang phải chờ ở từng lệnh (lệnh «hỏi lại» card đồ hoạ là lệnh làm trang đứng).
  var GL = {};
  (function () {
    var P = window.WebGL2RenderingContext && WebGL2RenderingContext.prototype;
    if (!P) return;
    Object.getOwnPropertyNames(P).forEach(function (ten) {
      var d = Object.getOwnPropertyDescriptor(P, ten);
      if (!d || typeof d.value !== 'function' || ten === 'constructor') return;
      var goc = d.value;
      P[ten] = function () {
        var n = performance.now();
        try { return goc.apply(this, arguments); }
        finally { var ms = performance.now() - n; var g = GL[ten] || (GL[ten] = [0, 0, 0]); g[0]++; g[1] += ms; if (ms > g[2]) g[2] = ms; }
      };
    });
  })();
  function chupGL() { var o = {}; for (var k in GL) o[k] = [GL[k][0], GL[k][1]]; return o; }
  function hieuGL(truoc) {
    var ds = [];
    for (var k in GL) { var t = truoc[k] || [0, 0]; var ms = GL[k][1] - t[1], so = GL[k][0] - t[0]; if (ms >= 1) ds.push([k, so, Math.round(ms)]); }
    ds.sort(function (x, y) { return y[2] - x[2]; });
    return ds.slice(0, 8);
  }
  D.nang = [];       // các khung hình nặng: lúc nào, mất bao lâu, phần nào, lệnh WebGL nào
  D.suKien = [];     // mốc: mở bài, đổi độ nét…
  // Ghi cả lần bị che rồi hiện lại giữa hai lần chụp; WebKit có thể dừng hẳn rAF lúc đó.
  var hienAn = [[Math.round(performance.now()), document.visibilityState]];
  document.addEventListener('visibilitychange', function () {
    hienAn.push([Math.round(performance.now()), document.visibilityState]);
  });
  window.addEventListener('error', function (e) { D.loi.push(String(e.message).slice(0, 200)); });
  window.addEventListener('unhandledrejection', function (e) { D.loi.push('rej ' + String(e.reason).slice(0, 200)); });
  (function f() { D.raf.push(performance.now()); requestAnimationFrame(f); })();
  function goi(doiTuong, ten, khoa) {
    if (!doiTuong || typeof doiTuong[ten] !== 'function' || doiTuong[ten].__goi) return;
    var goc = doiTuong[ten];
    var moi = function () { var n = performance.now(); try { return goc.apply(this, arguments); } finally { D.tp[khoa] += performance.now() - n; } };
    moi.__goi = true; doiTuong[ten] = moi;
  }
  function goiCanh(a) { goi(a.canh, 'capNhat', 'capNhat'); goi(a.dungHinh, 've', 've'); goi(a.nhan, 'render', 'nhan'); goi(a.tt, 'capNhat', 'tt'); goi(a.hud, 'dat', 'hud'); }
  var daBocMo = false;
  var h0 = setInterval(function () {
    var a0 = window.__vt;
    if (!a0 || daBocMo) return;
    daBocMo = true; clearInterval(h0);
    D.suKien.push([Math.round(performance.now() - T0), 'có app']);
    var gocMo = a0.moBai.bind(a0);
    a0.moBai = function () { var n = performance.now(), g0 = chupGL(); var r = gocMo.apply(null, arguments); D.suKien.push([Math.round(n - T0), 'mở bài ' + (a0.soBai ? a0.soBai(arguments[0]) : arguments[0] + 1) + ': ' + Math.round(performance.now() - n) + ' ms ' + JSON.stringify(a0.moLanCuoi || {}), hieuGL(g0)]); return r; };
    if (a0._lamNong) { var gocNong = a0._lamNong.bind(a0); a0._lamNong = function () { var n0 = a0._nong; var x = gocNong(); if (x && n0) D.suKien.push([Math.round(performance.now() - T0), 'làm nóng xong: ' + Math.round(performance.now() - n0.tBatDau) + ' ms, ' + n0.tong + ' vật, ' + n0.soLuot + ' lượt, lượt lâu nhất ' + Math.round(n0.msLauNhat) + ' ms']); return x; }; }
    var hAm = setInterval(function () { if (a0.am && a0.am.sanSang) { clearInterval(hAm); D.suKien.push([Math.round(performance.now() - T0), 'tiếng bắt đầu chạy thật']); } }, 10);
    var gocKT = a0._doiKichThuoc.bind(a0);
    a0._doiKichThuoc = function () { var n = performance.now(); var r = gocKT(); D.suKien.push([Math.round(n - T0), 'đổi kích thước/độ nét ' + a0.renderer.getPixelRatio() + ': ' + Math.round(performance.now() - n) + ' ms']); return r; };
  }, 4);
  var h = setInterval(function () {
    var a = window.__vt;
    if (!a || a.chiSo < 0 || !a.canh) return;
    clearInterval(h);
    D.moc.baiSanSang = Math.round(performance.now() - T0);
    var goc = a.buoc.bind(a);
    a.buoc = function (dt) {
      goiCanh(a);
      var n = performance.now(), g0 = chupGL(), t0 = Object.assign({}, D.tp);
      var r = goc(dt);
      var ms = performance.now() - n;
      D.buoc.push(n, ms);
      if (ms > 24 && D.nang.length < 30) {
        var tp = {}; for (var k in D.tp) { var d = D.tp[k] - t0[k]; if (d >= 1) tp[k] = Math.round(d); }
        D.nang.push([Math.round(n - T0), Math.round(ms), tp, hieuGL(g0)]);
      }
      return r;
    };
    setTimeout(function () {
      var n = performance.now();
      D.moc.bam = n;
      setTimeout(function () { try { tongKet(a); } catch (e) { window.__doXong = JSON.stringify({ loiTongKet: String(e && e.stack || e).slice(0, 600), loi: D.loi }); } }, KB.giay * 1000);
      try {
        var thuTu = KB.canh ? a.dsCanh.findIndex(function (c) { return c.id === KB.canh; }) : KB.bai ? a.dsCanh.findIndex(function (c) { return c.so === KB.bai; }) : null;
        var nut = thuTu !== null ? document.querySelector('#chao .ct-bai[data-bai="' + thuTu + '"]') : document.getElementById('nut-bat-dau');
        if (nut) nut.click(); else D.loi.push('không thấy nút để bấm');
        if (KB.buoc) a.moBuoc(KB.buoc - 1);
      } catch (e) { D.loi.push('lúc bấm: ' + String(e && e.stack || e).slice(0, 400)); }
      D.moc.bamMs = Math.round((performance.now() - n) * 10) / 10;
      // Kiểm «mô hình còn chạy»: chụp vị trí mọi vật ở hai thời điểm gần cuối lượt đo, đếm số vật đã dời chỗ.
      var chup = function () { var m = {}; a.canh && a.canh.scene.traverse(function (o) { if (o.isMesh || o.isGroup) { var e = o.matrixWorld.elements; m[o.id] = [e[12], e[13], e[14]]; } }); return m; };
      setTimeout(function () { D.vt1 = chup(); }, (KB.giay - 2.5) * 1000);
      setTimeout(function () {
        var v2 = chup(), doi = 0, tong = 0;
        for (var id in v2) { var p1 = (D.vt1 || {})[id]; if (!p1) continue; tong++; var p2 = v2[id]; if (Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]) + Math.abs(p1[2] - p2[2]) > 1e-7) doi++; }
        var chu = (document.getElementById('bai-hoc') || document.body).innerText || '';
        var m = chu.match(/[^\n]*ước tính[^\n]*/);
        D.conChay = { vatDoiCho: doi, tongVat: tong, dongUocTinh: m ? m[0].slice(0, 80) : null, hud: (document.getElementById('hud') || {}).innerText };
      }, (KB.giay - 0.4) * 1000);
      // rê chuột như người thật đang nhìn mô hình
      if (KB.re) {
        var k = 0, cv = a.renderer.domElement;
        var hr = setInterval(function () { k++; cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 200 + (k * 37) % 700, clientY: 180 + (k * 23) % 500, pointerId: 1, pointerType: 'mouse' })); }, 50);
        setTimeout(function () { clearInterval(hr); }, KB.giay * 1000);
      }
    }, KB.choChao);
  }, 20);

  function thongKe(ds) {            // ds: các khoảng (ms)
    if (!ds.length) return null;
    var s = ds.slice().sort(function (x, y) { return x - y; });
    var tong = 0; for (var i = 0; i < s.length; i++) tong += s[i];
    var q = function (p) { return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10) / 10; };
    return { so: s.length, tb: Math.round((tong / s.length) * 10) / 10, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: Math.round(s[s.length - 1]) };
  }
  function tongKet(a) {
    var bam = D.moc.bam, het = performance.now();
    var theoGiay = [];
    for (var g = -Math.ceil(KB.choChao / 1000); g < KB.giay; g++) {
      var tu = bam + g * 1000, den = tu + 1000;
      var raf = D.raf.filter(function (t) { return t >= tu && t < den; });
      var kh = [], js = [], xau = 0;
      for (var i = 0; i < D.buoc.length; i += 2) if (D.buoc[i] >= tu && D.buoc[i] < den) { kh.push(D.buoc[i]); js.push(D.buoc[i + 1]); }
      for (var j = 1; j < D.raf.length; j++) if (D.raf[j] >= tu && D.raf[j] < den) { var kc = D.raf[j] - D.raf[j - 1]; if (kc > xau) xau = kc; }
      var tongJs = 0, jsMax = 0; for (var q2 = 0; q2 < js.length; q2++) { tongJs += js[q2]; if (js[q2] > jsMax) jsMax = js[q2]; }
      theoGiay.push([g, raf.length, kh.length, Math.round(xau), js.length ? Math.round((tongJs / js.length) * 10) / 10 : 0, Math.round(jsMax)]);
    }
    var khoang = [], jsSau = [], khungTruoc = bam;
    for (var i2 = 0; i2 < D.buoc.length; i2 += 2) {
      if (D.buoc[i2] < bam) continue;
      khoang.push(D.buoc[i2] - khungTruoc);
      jsSau.push(D.buoc[i2 + 1]);
      khungTruoc = D.buoc[i2];
    }
    var rafSau = [], rafTruoc = bam;
    for (var j2 = 0; j2 < D.raf.length; j2++) {
      if (D.raf[j2] < bam) continue;
      rafSau.push(D.raf[j2] - rafTruoc);
      rafTruoc = D.raf[j2];
    }
    // Tính cả thời gian không có khung ở cuối quãng đo.
    if (khoang.length) khoang.push(het - khungTruoc);
    if (rafSau.length) rafSau.push(het - rafTruoc);
    var soKhung = jsSau.length;
    var tp = {}; for (var kk in D.tp) tp[kk] = Math.round((D.tp[kk] / (D.buoc.length / 2)) * 100) / 100;
    var cham = []; for (var i3 = 2; i3 < D.buoc.length; i3 += 2) { var kc2 = D.buoc[i3] - D.buoc[i3 - 2]; if (D.buoc[i3] >= bam && kc2 > 50 && cham.length < 40) cham.push([Math.round(D.buoc[i3] - bam), Math.round(kc2), Math.round(D.buoc[i3 - 1])]); }
    var gl = a.renderer.getContext();
    window.__doXong = JSON.stringify({
      hienAn: hienAn, kb: KB, moc: { baiSanSang: D.moc.baiSanSang, bamMs: D.moc.bamMs }, bai: a.dsCanh[a.chiSo].so, id: a.dsCanh[a.chiSo].id, lang: document.documentElement.lang, buoc: a.chiSoBuoc + 1,
      dpr: window.devicePixelRatio, doNet: a.renderer.getPixelRatio(), bo: [gl.drawingBufferWidth, gl.drawingBufferHeight], cuaSo: [innerWidth, innerHeight], chon: document.hasFocus(), an: document.hidden,
      khung: thongKe(khoang), raf: thongKe(rafSau), js: thongKe(jsSau), khungMoiGiay: Math.round((soKhung / ((het - bam) / 1000)) * 10) / 10,
      tren33: khoang.filter(function (x) { return x > 33.5; }).length, tren50: khoang.filter(function (x) { return x > 50; }).length, tren100: khoang.filter(function (x) { return x > 100; }).length,
      conChay: D.conChay || null, thanhPhanMsMoiKhung: tp, khungCham: cham, khungNang: D.nang, suKien: D.suKien, bamLuc: Math.round(bam - T0),
      glTong: (function () { var ds = []; for (var k in GL) if (GL[k][1] >= 2) ds.push([k, GL[k][0], Math.round(GL[k][1]), Math.round(GL[k][2])]); ds.sort(function (x, y) { return y[2] - x[2]; }); return ds.slice(0, 14); })(),
      soChuongTrinh: (GL.linkProgram || [0])[0], moRong: !!a.renderer.getContext().getExtension('KHR_parallel_shader_compile'), theoGiay: theoGiay, am: { sanSang: a.am.sanSang, gio: Math.round(a.am.gio() * 100) / 100 }, loi: D.loi, loiGhi: (a.loiGhi || []).slice(0, 5), matNguCanh: !!a._matNguCanh,
    });
  }
})();
