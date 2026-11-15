// Kịch bản QUÉT MỌI BƯỚC (dùng với app-mac --do-that): mở lần lượt từng bài, từng bước trên màn hình thật, để mỗi bước chạy
// khoảng hai giây rồi ghi: số khung hình mỗi giây, khoảng cách khung tệ nhất, phần tính toán (JS) mỗi khung, và thời gian
// trọn một khung hình kể cả card đồ hoạ (msKhung). Tìm các bước nặng mà bộ tự kiểm ẩn không thấy.
// Tham số qua window.__KB: { tuBai: 1, denBai: 19, doNet: 1.5, nghi: 700, do: 1800 }
(function () {
  var KB = Object.assign({ tuBai: 1, denBai: 99, doNet: null, nghi: 700, do: 1800 }, window.__KB || {});
  window.__VT_THU = Object.assign(window.__VT_THU || {}, { ep60: true });
  var D = { buoc: [], loi: [] };
  window.__kqTam = [['giai-doan', 'kịch bản đã nạp']];
  // Ghi cả lần bị che rồi hiện lại giữa hai lần chụp; WebKit có thể dừng hẳn rAF lúc đó.
  var hienAn = [[Math.round(performance.now()), document.visibilityState]];
  document.addEventListener('visibilitychange', function () {
    hienAn.push([Math.round(performance.now()), document.visibilityState]);
  });
  window.addEventListener('error', function (e) { D.loi.push(String(e.message).slice(0, 160)); });
  function cho(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var h = setInterval(function () {
    var a = window.__vt;
    if (!a || a.chiSo < 0 || !a.canh) return;
    clearInterval(h);
    window.__kqTam = [['giai-doan', 'đã có cảnh']];
    var goc = a.buoc.bind(a);
    a.buoc = function (dt) { var n = performance.now(); var r = goc(dt); D.buoc.push(n, performance.now() - n); return r; };
    D.goc = goc;
    setTimeout(function () { chay(a).catch(function (e) { window.__doXong = JSON.stringify({ loiKichBan: (String(e) + ' | ' + String(e && e.stack)).slice(0, 500), kq: window.__kqTam || [] }); }); }, 1200);
  }, 20);
  async function chay(a) {
    window.__kqTam = [['giai-doan', 'vào chay()']];
    var nut = document.getElementById('nut-bat-dau'); if (nut) nut.click();
    window.__kqTam = [['giai-doan', 'đã bấm']];
    await cho(600);
    var kq = []; window.__kqTam = kq;
    var gl = a.renderer.getContext(), px = new Uint8Array(4);
    var ids = KB.danhSach || (KB.canh ? [KB.canh] : null);
    var chon = a.dsCanh.filter(function (bai) {
      return ids ? ids.includes(bai.id) : bai.so >= KB.tuBai && bai.so <= KB.denBai;
    });
    if (ids && chon.length !== new Set(ids).size) throw Error('Có bài yêu cầu không tìm thấy trong bản đang đo.');
    var soBuocCanDo = 0;
    for (var bai of chon) {
      var i = a.dsCanh.indexOf(bai);
      soBuocCanDo += bai.baiGiang && bai.baiGiang.buoc ? bai.baiGiang.buoc.length : 1;
      var iMo = D.buoc.length, tMo = performance.now();
      // Nút Bắt đầu học giữ bài đã dựng ở màn chào; chỉ bấm một bài
      // khác trong mục lục mới xây lại cả cảnh. Giữ đúng đường đi đó.
      if (a.chiSo !== i) a.moBai(i, 0, false);
      else if (a.chiSoBuoc !== 0) a.moBuoc(0);
      var msMo = Math.round(performance.now() - tMo);
      // Đường chạy thật dùng thiết lập tự động của ứng dụng. Chỉ khoá độ nét
      // cho lượt chẩn đoán mà người đo chỉ đích danh mức điểm ảnh cần so.
      if (KB.doNet) {
        a.tuChinhDoNet = false;
        if (a.renderer.getPixelRatio() !== KB.doNet) { a.renderer.setPixelRatio(KB.doNet); a._doiKichThuoc(); }
      }
      var soBuoc = (a._dsBuoc && a._dsBuoc().length) || 1;
      for (var k = 0; k < soBuoc; k++) {
        var iDoi = k === 0 ? iMo : D.buoc.length;
        var tB = performance.now();
        if (k > 0) a.moBuoc(k);
        var msBuoc = Math.round(performance.now() - tB);
        await cho(KB.nghi);
        // Đo cả lúc vừa mở bài/bước. Khoảng nghỉ cho máy quay chuyển góc
        // không được phép bỏ qua một lần đứng hình trước khi đo FPS ổn định.
        var i0 = D.buoc.length, t0 = performance.now();
        var truoc = k === 0 ? tMo : tB, xauKhiDoi = 0;
        for (var m = iDoi; m < i0; m += 2) {
          xauKhiDoi = Math.max(xauKhiDoi, D.buoc[m] - truoc);
          truoc = D.buoc[m];
        }
        xauKhiDoi = Math.max(xauKhiDoi, t0 - truoc);
        await cho(KB.do);
        var kc = [], js = 0, n = 0, xau = 0;
        for (var j = i0 + 2; j < D.buoc.length; j += 2) { var d = D.buoc[j] - D.buoc[j - 2]; kc.push(d); if (d > xau) xau = d; }
        for (var j2 = i0; j2 < D.buoc.length; j2 += 2) { js += D.buoc[j2 + 1]; n++; }
        kc.sort(function (x, y) { return x - y; });
        var ketThuc = performance.now();
        var giay = (ketThuc - t0) / 1000;
        // Một lần khựng ở đầu/cuối quãng đo vẫn cần tính, kể cả khi WebKit
        // chưa gọi lại khung tiếp theo trước lúc bộ hẹn giờ kết thúc.
        if (n) xau = Math.max(xau, D.buoc[i0] - t0, ketThuc - D.buoc[D.buoc.length - 2]);
        else xau = giay * 1000;
        // trọn một khung hình kể cả card đồ hoạ: vẽ rồi đọc lại một điểm ảnh để chờ card xong
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        var t1 = performance.now();
        for (var q = 0; q < 8; q++) { D.goc(1 / 60); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
        var msKhung = (performance.now() - t1) / 8;
        kq.push([bai.so, k + 1, Math.round((n / giay) * 10) / 10, kc.length ? Math.round(kc[Math.floor(kc.length * 0.95)]) : 0, Math.round(xau), n ? Math.round((js / n) * 100) / 100 : 0, Math.round(msKhung * 10) / 10, k === 0 ? msMo : msBuoc, a.renderer.getPixelRatio(), Math.round(xauKhiDoi)]);
        if (!a.canh) { D.loi.push('Bài ' + bai.so + ' bước ' + (k + 1) + ': cảnh dừng vì lỗi'); break; }
      }
    }
    window.__doXong = JSON.stringify({ hienAn: hienAn, kq: kq, soBuocCanDo: soBuocCanDo, lang: document.documentElement.lang, loi: D.loi, loiGhi: (a.loiGhi || []).slice(0, 8), dpr: window.devicePixelRatio, bo: [gl.drawingBufferWidth, gl.drawingBufferHeight], matNguCanh: !!a._matNguCanh });
  }
})();
