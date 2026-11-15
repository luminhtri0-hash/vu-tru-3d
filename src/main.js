// Điểm vào: nạp danh sách bài học, dựng ứng dụng, hiện màn hình chào.
//
// Tham số trên đường dẫn (dùng khi kiểm thử):
//   ?bai=4            mở thẳng bài 4, bỏ màn hình chào
//   ?bai=4&buoc=3     mở bài 4 ở bước 3
//   ?canh=lorentz     mở bài theo id (tiện khi dựng với --chi)
//   ?tua=5            cho mô hình chạy trước 5 giây (để chụp ảnh đúng lúc cần xem)
//   ?nut=ten          bấm sẵn nút «thử ngay» có tên đó trong bước đang mở
//   ?tab=tom          mở sẵn thẻ Tóm tắt (tom) hoặc Tự kiểm (hoi); ?cuon=600 cuộn bảng bài giảng xuống 600 điểm ảnh
//   ?tukiem=1         đi qua mọi bước của bài đang mở, bấm thử mọi nút, ghi kết quả vào <pre id="ket-qua-kiem">
//   ?tukiem=tat-ca    như trên nhưng cho mọi bài
//   ?im=1             chế độ im lặng: không bao giờ phát tiếng (các tham số tukiem, tua cũng tự bật chế độ này)
//   ?xem=1            vào thẳng chế độ «Xem như video» (dùng được cho người xem thật, kèm ?bai= hoặc ?canh=)
//   ?goiy=1           lượt im lặng vẫn hiện dòng gợi ý thao tác dưới thanh trên (mặc định ẩn để ảnh soát bài không dính)

import { UngDung } from './khung/ung-dung.js';
import { KHOA_HOC, SO_BAI } from './noi-dung/khoa-hoc.js';
import CANH_GOC from 'ao:ds-canh';
import { dichBai, dichPhan } from './ngon-ngu/noi-dung.js';
import { ngonNgu } from './ngon-ngu/dich.js';
import { chu, dichTrang } from './ngon-ngu/giao-dien.js';
import { nutNgonNgu } from './ngon-ngu/chon.js';
import { appDangChay } from './khung/app-dang-chay.js';

const CANH = Object.fromEntries(Object.entries(CANH_GOC).map(([id, bai]) => [id, dichBai(bai)]));

// Xếp các bài theo thứ tự khoá học; gắn tên phần cho từng bài.
const DS_CANH = [];
const PHAN = [];
for (const p of KHOA_HOC.map((p, i) => dichPhan(p, i))) {
  const bai = p.bai.map((id) => CANH[id]).filter(Boolean);
  if (!bai.length) continue;
  PHAN.push({ ...p, soBai: bai.length });
  for (const c of bai) { c.phan = p.ten; c.so = SO_BAI.indexOf(c.id) + 1 || DS_CANH.length + 1; DS_CANH.push(c); }   // c.so: số của bài, không đổi theo thứ tự hiển thị
}

function khoiDong() {
  dichTrang();
  document.querySelector('.gian').append(nutNgonNgu('ngon-ngu-tren', appDangChay));
  window.webkit?.messageHandlers?.vuTru?.postMessage('ngon-ngu:' + ngonNgu);
  const kiemGL = document.createElement('canvas').getContext('webgl2');
  if (!kiemGL) {
    const loi = document.getElementById('loi');
    loi.textContent = chu("gd.loi-webgl");
    loi.hidden = false;
    return;
  }
  const app = new UngDung(DS_CANH, PHAN);
  window.__vt = app; // để dò lỗi và cho bộ kiểm tự động
  // App Mac cho phép trang tự phát tiếng: mở sẵn thiết bị âm thanh ngay lúc nạp trang, hoàn toàn im lặng, để lần bấm đầu
  // tiên («Bắt đầu học») không phải gánh việc đó (xem AmThanh.moSan). Trình duyệt thường thì chờ người dùng bấm.
  if (window.webkit?.messageHandlers?.vuTru && !app.imLang) app.am.moSan?.();
  const tham = new URLSearchParams(location.search);
  let bai = app.baiDaLuu();
  if (tham.has('bai')) {
    const i = DS_CANH.findIndex((c) => c.so === Number(tham.get('bai')));
    if (i >= 0) bai = i;
  }
  if (tham.has('canh')) { const i = DS_CANH.findIndex((c) => c.id === tham.get('canh')); if (i >= 0) bai = i; }
  const buoc = tham.has('buoc') ? Number(tham.get('buoc')) - 1 : 0;
  // Chạy thật (không có tham số kiểm): hiện màn hình chào TRƯỚC rồi mới dựng bài sau một nhịp, vì dựng bài phải biên dịch
  // shader, có thể mất gần một giây (lâu hơn nữa khi máy đang bận) và trong lúc đó cửa sổ không vẽ được gì.
  const chayThat = !['bai', 'canh', 'vao', 'xem', 'tukiem', 'tua', 'nut', 'tab', 'cuon', 'dotim', 'dongdung'].some((k) => tham.has(k));
  if (chayThat) setTimeout(() => { if (app.chiSo < 0) app.moBai(bai, buoc); }, 80);
  else { app.moBai(bai, buoc); app.hienGoiY(); }
  // ?nut=tên: bấm sẵn một nút «thử ngay» của bước đang mở. ?tua=giây: cho mô hình chạy trước bấy nhiêu giây
  // (dùng khi chụp ảnh kiểm thử, vì trình duyệt chạy ẩn gần như không cho hoạt hình chạy).
  if (tham.has('nut')) document.querySelector(`.nut-thu[data-nut="${tham.get('nut')}"]`)?.click();
  if (tham.has('tua')) { const n = Math.round(Number(tham.get('tua')) * 60); for (let i = 0; i < n; i++) app.buoc(1 / 60); }
  // ?tab=tom|hoi: mở sẵn thẻ Tóm tắt hoặc Tự kiểm. ?cuon=600: cuộn bảng bài giảng xuống 600 điểm ảnh (để chụp phần dưới).
  if (tham.has('tab')) app.moTab(tham.get('tab'));
  if (tham.has('cuon')) document.getElementById('bai-hoc-cuon').scrollTop = Number(tham.get('cuon'));
  // ?xem=1: vào thẳng chế độ «Xem như video» (đường dẫn chia sẻ kiểu …/vu-tru-3d/?bai=1&xem=1). Trình duyệt chưa cho
  // phát tiếng khi chưa có lần bấm nào thì chế độ tự tạm dừng và mời bấm ▶.
  if (tham.has('xem')) app.xemVideo.vao();

  // ?dotim=1: đo thời gian DÒ VẬT DƯỚI CON TRỎ (việc khung tương tác làm mỗi khi chuột nhúc nhích) ở từng bài, tại 25 điểm
  // trên màn hình. Viết sau khi app bị đơ trên máy thật: phần này chưa từng được đo vì bộ tự kiểm không có chuột.
  if (tham.has('dotim')) {
    const kq = [];
    for (let i = 0; i < DS_CANH.length; i++) {
      try {
        app.moBai(i);
        for (let j = 0; j < 20; j++) app.buoc(1 / 60);
        const tt = app.tt;
        let tong = 0, xau = 0, so = 0;
        for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) {
          const x = app.rong * (0.08 + 0.14 * a), y = app.cao * (0.15 + 0.17 * b);
          const t0 = performance.now();
          tt._tim(x, y);
          const ms = performance.now() - t0;
          tong += ms; so++; if (ms > xau) xau = ms;
        }
        kq.push({ bai: i + 1, id: DS_CANH[i].id, soVat: tt._ds?.length ?? -1, soTay: tt._tay?.length ?? tt._dsTay?.length ?? -1, tbMs: Math.round((tong / so) * 100) / 100, xauMs: Math.round(xau * 100) / 100 });
      } catch (e) { kq.push({ bai: i + 1, loi: String(e?.message || e).slice(0, 200) }); }
    }
    const pre = document.createElement('pre');
    pre.id = 'ket-qua-kiem'; pre.hidden = true; pre.textContent = JSON.stringify(kq);
    document.body.append(pre);
    document.title = 'DO-TIM';
    return;
  }

  // ?dongdung=1: tìm bước mà mô hình ĐANG CHẠY RỒI TỰ ĐỨNG. Viết sau khi Bài 1 tự đứng hình ở giây thứ 23 (dòng thời gian
  // chạm mốc cuối bảng số liệu) mà bộ tự kiểm không thấy, vì nó chỉ cho mỗi bước chạy vài giây. Ở mỗi bước, cho thời gian
  // chạy 121 giây (không vẽ) và đếm số vật đang dời chỗ hoặc đổi hình trong giây thứ 6, thứ 46 và thứ 121.
  if (tham.has('dongdung')) {
    const kq = [];
    const chup = (scene) => {
      const m = new Map();
      scene.traverse((o) => {
        const p = o.position, q = o.quaternion, sc = o.scale;
        let ban = 0;
        const g = o.geometry;
        if (g) for (const ten in g.attributes) { const a = g.attributes[ten]; ban += (a.data ? a.data.version : a.version) || 0; }
        m.set(o.id, [p.x, p.y, p.z, q.x, q.y, q.z, q.w, sc.x, sc.y, sc.z, ban, o.visible ? 1 : 0]);
      });
      return m;
    };
    const soDoi = (a, b) => { let n = 0; for (const [id, x] of b) { const y = a.get(id); if (!y) continue; for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) > 1e-9) { n++; break; } } return n; };
    const chay = (c, giay) => { const n = Math.round(giay * 30); for (let i = 0; i < n; i++) { c.capNhat?.(1 / 30, 1 / 30); app.tt.capNhat?.(1 / 30); } };
    const tu = tham.has('tu') ? Number(tham.get('tu')) - 1 : 0, den = tham.has('den') ? Number(tham.get('den')) : DS_CANH.length;
    for (let i = tu; i < Math.min(den, DS_CANH.length); i++) {
      try {
        app.moBai(i);
        const soBuoc = app._dsBuoc().length;
        for (let k = 0; k < soBuoc; k++) {
          if (k > 0) app.moBuoc(k);
          const c = app.canh; if (!c) throw Error("Không tạo được cảnh ở bước " + (k + 1));
          chay(c, 5); let a = chup(c.scene); chay(c, 1); const d6 = soDoi(a, chup(c.scene));
          chay(c, 39); a = chup(c.scene); chay(c, 1); const d46 = soDoi(a, chup(c.scene));
          chay(c, 74); a = chup(c.scene); chay(c, 1); const d121 = soDoi(a, chup(c.scene));
          // Số vật chuyển động có thể giảm trong một pha của chu kỳ (xung sáng,
          // đám hạt nghỉ rồi thả lại). Giữ mẫu ban đầu và kiểm có phục hồi ở 12 giây tiếp.
          const hang = [DS_CANH[i].so, k + 1, d6, d46, d121];
          if (d6 >= 3 && (d46 * 3 < d6 || d121 * 3 < d6)) {
            let nhieuNhat = d121;
            for (let giay = 0; giay < 12; giay++) {
              const truoc = chup(c.scene);
              chay(c, 1);
              nhieuNhat = Math.max(nhieuNhat, soDoi(truoc, chup(c.scene)));
            }
            hang.push(nhieuNhat);
          }
          kq.push(hang);
        }
      } catch (e) { kq.push([DS_CANH[i].so, 0, String(e?.message || e).slice(0, 200)]); }
    }
    const pre = document.createElement('pre');
    pre.id = 'ket-qua-kiem'; pre.hidden = true; pre.textContent = JSON.stringify(kq);
    document.body.append(pre);
    document.title = 'DONG-DUNG';
    return;
  }

  if (tham.has('tukiem')) {
    const kq = [];
    try {
      if (tham.get('tukiem') === 'tat-ca') for (let i = 0; i < DS_CANH.length; i++) { app.moBai(i); kq.push(app.tuKiem()); }
      else kq.push(app.tuKiem());
    } catch (e) { kq.push({ loi: [`Bộ tự kiểm dừng: ${e?.stack || e}`] }); }
    const pre = document.createElement('pre');
    pre.id = 'ket-qua-kiem';
    pre.hidden = true;
    pre.textContent = JSON.stringify(kq);
    document.body.append(pre);
    document.title = kq.every((k) => !k.loi?.length) ? 'KIEM:DAT' : 'KIEM:LOI';
    return;
  }

  if (!tham.has('bai') && !tham.has('canh') && !tham.has('vao') && !tham.has('xem')) {
    const soBuoc = DS_CANH.reduce((s, c) => s + (c.baiGiang?.buoc?.length || 1), 0);
    // Lộ trình: mỗi phần một thẻ BẤM ĐƯỢC (vào bài đầu của phần), bên dưới là từng bài của phần đó, cũng bấm được.
    // (Bản 2 các thẻ này chỉ để đọc; người dùng bấm vào không thấy gì.)
    let dem = 0;
    const loTrinh = PHAN.map((p) => {
      const [so, ten] = p.ten.split(' · ');
      const dau = dem;
      const ds = p.bai.map((id) => CANH[id]).filter(Boolean).map((c) => {
        const i = dem++;
        return `<button class="ct-bai${app.daHoc.has(c.id) ? ' xong' : ''}${i === bai ? ' dang' : ''}" data-bai="${i}" title="${chu("gd.mo-bai-0", [c.so])}"><span class="so">${c.so}</span><span class="ten">${c.ten}</span></button>`;
      }).join('');
      return `<div class="phan-the"><button class="phan-dau" data-bai="${dau}" title="${chu("gd.vao-bai-dau-cua-phan-nay")}"><i>${chu("gd.phan-so-bai", [so, p.soBai])}</i><b>${ten}</b><span>${p.moTa}</span></button><div class="phan-bai">${ds}</div></div>`;
    }).join('');
    const chao = document.createElement('div');
    chao.id = 'chao';
    chao.innerHTML = `
      <div class="khoi">
        <div class="tren">${chu("gd.khoa-hoc-tuong-tac-bang-mo-hinh-3d")}</div>
        <h1>${chu("gd.vu-tru-3d")}</h1>
        <p>${chu("gd.chao-gioi-thieu", [DS_CANH.length, soBuoc])}</p>
        <div class="lo-trinh">${loTrinh}</div>
        <div class="chao-nut"><button class="dk-nut chinh" id="nut-bat-dau">${bai > 0 ? `${chu("gd.hoc-tiep-bai-0", [DS_CANH[bai].so])}` : chu("gd.bat-dau-hoc")}</button><button class="dk-nut xem-video" id="nut-chao-video" title="${chu("xv.nut-tren")}">${chu("xv.xem-nhu-video")}</button></div>
        <div class="chon-goi-y">${chu("gd.bam-vao-mot-phan-hoac-mot-bai-o-tren-de-vao-thang-ch")}${bai > 0 ? ` · <button class="hoc-tu-dau" data-bai="0">${chu("gd.hoc-lai-tu-bai-1")}</button>` : ''}</div>
        <div class="phu">${chu("gd.keo-chuot-de-xoay-cuon-de-phong-to-thu-nho-re-chuot-")}</div>
      </div>`;
    chao.prepend(nutNgonNgu('ngon-ngu-chao', () => app));
    document.body.append(chao);
    document.body.classList.add('dang-chao');
    // Trong lúc chờ ở màn hình chào, mô hình xoay rất chậm phía sau cho thấy đây là cảnh 3D sống (vẽ thưa hơn cho nhẹ máy).
    app.dangChao = true;
    app.dk.autoRotate = true; app.dk.autoRotateSpeed = 0.35;
    const dong = () => { if (chao.classList.contains('tat')) return; app.dangChao = false; document.body.classList.remove('dang-chao'); app.dk.autoRotate = false; app.am.khoiDong(); app.am.phat('bat-dau'); app._datNen(); chao.classList.add('tat'); app.hienGoiY(); setTimeout(() => chao.remove(), 800); };
    document.getElementById('nut-bat-dau').addEventListener('click', dong);
    // «Xem như video»: lần bấm này cũng là lần bấm trình duyệt cần để cho phát tiếng (xem xem-video.js).
    document.getElementById('nut-chao-video').addEventListener('click', () => { dong(); app.xemVideo.vao(); });
    for (const nut of chao.querySelectorAll('[data-bai]')) {
      nut.addEventListener('click', () => { const i = Number(nut.dataset.bai); dong(); if (i !== app.chiSo) app.moBai(i, 0, true); });
    }
    // Phím Enter ở màn hình chào: vào học. (Bản trước gắn kiểu «một lần» nên gõ nhầm phím khác trước là Enter hết tác dụng.)
    const khiEnter = (e) => { if (e.key !== 'Enter' || e.target instanceof HTMLSelectElement) return; window.removeEventListener('keydown', khiEnter); if (!chao.classList.contains('tat')) dong(); };
    window.addEventListener('keydown', khiEnter);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
else khoiDong();
