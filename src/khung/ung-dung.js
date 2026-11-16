// Lõi ứng dụng: bộ vẽ WebGL, máy quay, vòng lặp, chuyển bài, các bước của bài giảng.
// Lớp UngDung là một; phần thân được chia theo việc ra các tệp ung-dung-*.js cùng thư mục (làm nóng, thử thách, giọng
// đọc, chất lượng hình, âm thanh, máy quay, bảng bài học, sổ tay, tự kiểm, sự kiện). Mỗi tệp xuất một nhóm phương thức,
// cuối tệp này gắn tất cả vào lớp: mọi tên hàm và thuộc tính (app.bayToi, app.moBuoc, app._bay, app.lech…) vẫn như cũ.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { chu } from '../ngon-ngu/giao-dien.js';
import { BangDieuKhien, Hud } from './giao-dien.js';
import { DungHinh, TuChinhDoNet } from './dung-hinh.js';
import { CHIA_NHIP } from './bau-troi.js';
import { huyCanh } from './ve.js';
import { dinhDang, trongDong, coCongThucVua } from './bai-giang.js';
import { NhatKy } from './nhat-ky.js';
import { NgheGiang } from './nghe-giang.js';
import { boNhan } from './bo-nhan.js';
import { datAppDangChay } from './app-dang-chay.js';
import { amThanh } from 'ao:am-thanh';
import { TuongTac } from 'ao:tuong-tac';
import { $, luu, ghepPhuongThuc, KHOA_LUU, KHOA_RONG, KHOA_XONG, KHOA_TT, KHOA_HINH } from './ung-dung-luu.js';
import { AM_RONG, TT_RONG } from './ung-dung-rong.js';
import { PT_LAM_NONG } from './ung-dung-lam-nong.js';
import { PT_THU_THACH } from './ung-dung-thu-thach.js';
import { PT_GIONG_DOC } from './ung-dung-giong-doc.js';
import { PT_HINH } from './ung-dung-hinh.js';
import { PT_AM } from './ung-dung-am.js';
import { PT_MAY_QUAY } from './ung-dung-may-quay.js';
import { PT_BANG } from './ung-dung-bang.js';
import { PT_SO_TAY } from './ung-dung-so-tay.js';
import { PT_TU_KIEM } from './ung-dung-tu-kiem.js';
import { PT_SU_KIEN } from './ung-dung-su-kien.js';
import { PT_BO_CUC } from './ung-dung-bo-cuc.js';

export class UngDung {
  constructor(dsCanh, khoaHoc = []) {
    datAppDangChay(this);        // cho mô-đun dùng chung không được truyền `app` (xem app-dang-chay.js)
    this.boNhan = boNhan;        // bộ bố trí nhãn trên mô hình (bo-nhan.js)
    this._vungCho = 0;           // số khung hình còn lại trước lần đọc lại các vùng bị che
    this.dsCanh = dsCanh;
    this.khoaHoc = khoaHoc;
    this.el = {
      sanKhau: $('san-khau'), lopNhan: $('lop-nhan'), bang: $('bai-hoc-cuon'), hud: $('hud'),
      mucLuc: $('muc-luc'), tenBai: $('ten-bai'), loi: $('loi'), goiY: $('goi-y'), tamDung: $('nut-tam-dung'),
      thuatNgu: $('thuat-ngu'),
    };
    // Khử răng cưa làm ở bộ đệm của DungHinh (4 mẫu), nên khung vẽ chính không cần bật.
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    // Chất lượng hình: «tu-dong» (mặc định: độ nét tới 1,5, tự hạ khi máy chậm), «nhe» (độ nét 1, cho lúc máy bận hay đang
    // gọi video), «cao» (độ nét tới 2). Độ nét 2 trên màn hình Retina nặng gấp 1,8 lần độ nét 1,5 mà mắt khó thấy khác.
    this._dpr = window.devicePixelRatio || 1;       // mật độ điểm ảnh của màn hình đang chứa cửa sổ (đổi khi kéo sang màn hình khác)
    this.tiLeMay = Math.min(this._dpr, 2);
    const hinhLuu = luu.doc(KHOA_HINH);
    this.cheDoHinh = ['tu-dong', 'nhe', 'cao'].includes(hinhLuu) ? hinhLuu : 'tu-dong';
    this.tiLeGoc = this._tranTheoCheDo();
    this.renderer.setPixelRatio(this.tiLeGoc);
    this.renderer.setClearColor(0x010206, 1);
    this.el.sanKhau.append(this.renderer.domElement);
    this.loiGhi = [];            // lỗi gặp khi chạy (bộ tự kiểm đọc)
    // Shader hỏng (không biên dịch được) thì ghi lại để bộ tự kiểm bắt được, không chỉ in ra bảng dò lỗi.
    this.renderer.debug.onShaderError = (gl, chuongTrinh, vs, fs) => {
      const tin = `${gl.getProgramInfoLog(chuongTrinh) || ''} ${gl.getShaderInfoLog(vs) || ''} ${gl.getShaderInfoLog(fs) || ''}`.trim().slice(0, 400);
      console.error('Shader hỏng:', tin);
      this.loiGhi.push(`shader hỏng: ${tin}`);
    };
    // Card đồ hoạ quá tải (hoặc máy ngủ dậy) có thể làm mất ngữ cảnh WebGL: khi có lại thì dựng lại bài đang mở.
    const khungVe = this.renderer.domElement;
    khungVe.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this._matNguCanh = true; console.warn('Mất ngữ cảnh WebGL'); this._ghiNhatKy({ loai: 'mat-ngu-canh-do-hoa' }); });
    khungVe.addEventListener('webglcontextrestored', () => {
      this._matNguCanh = false;
      setTimeout(() => { try { this._doiKichThuoc(); this.moBai(this.chiSo, Math.max(0, this.chiSoBuoc)); } catch (e) { console.error(e); } }, 60);
    });
    this.dungHinh = new DungHinh(this.renderer);
    this.doNet = new TuChinhDoNet({ toiDa: this.tiLeGoc, toiThieu: 0.75 });
    this.doNet.khuRangCua = this._coKhuRangCua();
    this._msTinh = 0;            // phần tính toán của trang trong khung hình vừa rồi (mili giây)
    // Dòng «Đang dựng mô hình»: chỉ hiện khi việc làm nóng cảnh kéo dài (máy chưa có bộ nhớ đệm chương trình đổ bóng).
    this._nong = null;
    this.el.dangDung = document.createElement('div');
    this.el.dangDung.id = 'dang-dung';
    this.el.dangDung.hidden = true;
    this.el.dangDung.innerHTML = `<span class="vong"></span><b>${chu("gd.dang-dung-mo-hinh-3d")}</b><i></i>`;
    this.el.sanKhau.append(this.el.dangDung);
    this._veLanCuoi = 0;
    this.tuChinhDoNet = true;
    this.nhan = new CSS2DRenderer({ element: this.el.lopNhan });

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1e5);
    this.dk = new OrbitControls(this.camera, this.renderer.domElement);
    this.dk.enableDamping = true;
    this.dk.dampingFactor = 0.08;
    this.dk.rotateSpeed = 0.55;
    this.dk.zoomSpeed = 0.9;
    this.dk.addEventListener('start', () => { this._bay = null; if (!this.el.goiY.classList.contains('mo')) { this.el.goiY.classList.add('mo'); this._vungCho = 0; } });

    // Chế độ im lặng (kiểm thử, chụp ảnh): không bao giờ phát tiếng.
    const tham = new URLSearchParams(location.search);
    this.imLang = !window.__VT_THU?.tiengCam && !!(window.__VT_IM_LANG || navigator.webdriver || tham.has('tukiem') || tham.has('tua') || tham.has('im') || tham.has('dotim') || tham.has('dongdung'));
    this.nhatKy = new NhatKy({ imLang: this.imLang });      // nhật ký tại máy, có công tắc (xem nhat-ky.js)
    this.am = amThanh || AM_RONG;
    if (this.imLang) this.am.khoa();
    CHIA_NHIP.bat = !this.imLang;       // chạy thật: ảnh dải Ngân Hà dựng từng nhịp, không chặn cửa sổ (xem bau-troi.js)
    this.tt = TuongTac ? new TuongTac(this) : TT_RONG;
    this.thuThachDat = new Set((luu.doc(KHOA_TT) || '').split(',').filter(Boolean));
    this._tt = null;             // thử thách của bước đang mở
    this._gdGiong = this._gdGiongLuu();                    // giọng đọc đang chọn (ung-dung-giong-doc.js)

    this.hud = new Hud(this.el.hud);
    this.hud.datChuNut(chu("gd.o-so-lieu-thu-gon"));
    this.bang = new BangDieuKhien(document.createElement('div'), { am: this.am });
    this.canh = null;
    this.chiSo = -1;
    this.chiSoBuoc = 0;
    this.dangChay = true;
    this.rong = 1; this.cao = 1;
    this._bay = null;
    this._truoc = performance.now();
    this._hudCho = 0;
    // Độ lệch tâm hình (điểm ảnh): dời tâm cảnh vào giữa phần màn hình không bị bảng bài học che.
    this.lech = [0, 0];
    this._lechDich = [0, 0];
    this.daHoc = new Set((luu.doc(KHOA_XONG) || '').split(',').filter(Boolean));

    const rongLuu = Number(luu.doc(KHOA_RONG));
    if (rongLuu >= 340) document.documentElement.style.setProperty('--rong-bang', `${rongLuu}px`);

    this._gomThuatNgu();
    this._ganSuKien();
    this.nghe = new NgheGiang(this);         // nghe giảng: giọng đọc, phụ đề trên mô hình, tự sang bước (nghe-giang.js)
    this._veMucLuc();
    this._doiKichThuoc();
    this._vong = this._vong.bind(this);
    requestAnimationFrame(this._vong);
    this.el.goiY.classList.add('mo');      // dòng gợi ý thao tác chỉ hiện khi người học vừa vào bài (hienGoiY, ung-dung-bo-cuc.js)
  }

  // ---------- Chuyển bài ----------
  moBai(i, buoc = 0, coTieng = false) {
    const tMo = performance.now();
    i = Math.max(0, Math.min(this.dsCanh.length - 1, i | 0));
    if (coTieng) this.am.phat('bai');
    this.tt.xoaHet();            // trước khi huỷ cảnh cũ: hình phụ của khung tương tác đang nằm trong cảnh đó
    if (this.canh) {
      try { this._buocDangMo()?.ra?.(this.canh, this); } catch (e) { console.error(e); }
      try { this.canh.huy?.(); } catch (e) { console.error(e); }
      huyCanh(this.canh.scene);
      this.canh = null;
    }
    this.am.dungHet();
    this.nghe.khiMoBai();
    this._tt = null;
    this.el.lopNhan.innerHTML = '';
    boNhan.xoaHet();
    this.el.loi.hidden = true;
    this.hud.dat(null);
    this._bay = null;
    this.chiSo = i;
    this.chiSoBuoc = -1;
    const dn = this.dsCanh[i];
    const tBang = performance.now();
    this._veBang(dn, i);
    const msBang = performance.now() - tBang;

    const m = dn.mayAnh || {};
    this.camera.fov = m.fov ?? 45;
    this.camera.zoom = this._thuNhoHep(m.hep);          // màn hình hẹp: thu nhỏ cả cảnh nếu bài khai mayAnh.hep
    this.camera.near = m.gan ?? 0.01;
    this.camera.far = m.xa ?? 1e5;
    this.camera.up.set(0, 1, 0);
    this.camera.position.set(...(m.viTri ?? [0, 2, 6]));
    this.dk.target.set(...(m.dich ?? [0, 0, 0]));
    this.dk.minDistance = m.min ?? 0.1;
    this.dk.maxDistance = m.max ?? 1e4;
    this.dk.enablePan = m.doi ?? true;
    this.dk.minPolarAngle = m.gocMin ?? 0;
    this.dk.maxPolarAngle = m.gocMax ?? Math.PI;
    this.dk.autoRotate = false;
    this.camera.updateProjectionMatrix();
    // Hình ảnh của bài: quầng sáng, phơi sáng… (trường `hinh`), và trần độ nét (trường `tiLeDiemAnh`).
    this.dungHinh.datCauHinh(dn.hinh);
    this.tuChinhDoNet = !dn.hinh?.tuQuanDoNet;
    this.doNet.datTran(dn.tiLeDiemAnh ? Math.min(dn.tiLeDiemAnh, this.tiLeGoc) : this.tiLeGoc, this._coKhuRangCua());
    // Bài mới bắt đầu ở độ nét mà bài trước vừa chạy ổn (máy đang bận thì khỏi phải dò lại từ đầu), không vượt trần.
    this.doNet.tiLe = Math.min(this.doNet.toiDa, Math.max(this.doNet.toiThieu, this._tiLeOnDinh ?? this.doNet.toiDa));
    this.doNet.nghi(1.5);
    this.renderer.setPixelRatio(this.doNet.tiLe);
    this.datChay(true);
    const tTao = performance.now();
    try {
      this.canh = dn.tao(this);
    } catch (e) {
      console.error(e);
      this.baoLoi(`${chu("gd.loi-bai", [dn.ten, e?.stack || e])}`);
    }
    const msTao = performance.now() - tTao;
    if (this.canh) this.tt.datCanh(this.canh.scene);
    this._datNen();
    this.dk.update();
    this._doiKichThuoc();
    luu.ghi(KHOA_LUU, dn.id);
    for (const b of this.el.mucLuc.querySelectorAll('button[data-i]')) b.classList.toggle('dang-mo', Number(b.dataset.i) === i);
    this.el.tenBai.innerHTML = `<span class="so">${chu("gd.bai-so", [dn.so ?? i + 1])}</span><span class="ten">${dn.ten}</span>`;
    const tBuoc = performance.now();
    this.moBuoc(buoc);
    const msBuoc = performance.now() - tBuoc;
    this._batDauLamNong();
    // Trong nhật ký và mọi kết quả kiểm, «bai» luôn là SỐ CỦA BÀI (Bài 15, Bài 17), «thuTu» là thứ tự hiển thị từ 1.
    this.moLanCuoi = { bai: this.soBai(i), thuTu: i + 1, so: dn.so, id: dn.id, ms: Math.round(performance.now() - tMo), bang: Math.round(msBang), tao: Math.round(msTao), buoc: Math.round(msBuoc) };
    this._ghiNhatKy({ loai: 'mo-bai', ...this.moLanCuoi });
  }

  // Số của bài (số in trên giao diện: Bài 15 đứng thứ ba nhưng vẫn là 15). Mọi chỗ ghi số bài ra ngoài (nhật ký, tự
  // kiểm, tên ảnh, tham số ?bai=) dùng số này; thứ tự hiển thị (chiSo, từ 0) chỉ dùng bên trong.
  soBai(i = this.chiSo) { return this.dsCanh[i]?.so ?? i + 1; }

  baiDaLuu() {
    const id = luu.doc(KHOA_LUU);
    const i = this.dsCanh.findIndex((c) => c.id === id);
    return i >= 0 ? i : 0;
  }

  baoLoi(chu) {
    this.el.loi.textContent = chu;
    this.el.loi.hidden = false;
    this.loiGhi.push(String(chu).slice(0, 600));
  }

  datChay(b) {
    this.dangChay = b;
    this.el.tamDung.textContent = b ? '❚❚' : '▶';
    this.el.tamDung.classList.toggle('bat', !b);
  }

  // ---------- Các bước của bài giảng ----------
  _dsBuoc(dn = this.dsCanh[this.chiSo]) {
    const ds = dn?.baiGiang?.buoc;
    if (ds?.length) return ds;
    return [{ ten: chu("gd.tong-quan"), noiDung: `<p class="y-chinh">${dn?.yChinh ?? ''}</p>\n\n${dn?.giaiThich ?? ''}` }];
  }
  _buocDangMo() { return this._dsBuoc()[this.chiSoBuoc]; }

  moBuoc(k) {
    const ds = this._dsBuoc();
    k = Math.max(0, Math.min(ds.length - 1, k | 0));
    const truocNghe = this.nghe.truocMoBuoc();       // đang nghe giảng: ghi góc máy để lát nữa bay tới góc mới cho êm
    const cu = ds[this.chiSoBuoc];
    if (cu && this.chiSoBuoc !== k && this.canh) {
      try { cu.ra?.(this.canh, this); } catch (e) { console.error(e); this.loiGhi.push(`ra(): ${e?.message || e}`); }
    }
    this.chiSoBuoc = k;
    this.doNet?.nghi(1.0);       // dựng chữ, hiện vật mới làm khựng một nhịp: bộ tự chỉnh độ nét đừng tính nhịp đó
    const b = ds[k];
    const n = ds.length;
    const so = $('buoc-so');
    if (!so) return;
    so.textContent = n > 1 ? `${chu("gd.buoc-so", [k + 1, n])}` : '';
    $('buoc-cham').innerHTML = n > 1 ? ds.map((x, j) => `<button class="${j === k ? 'dang' : j < k ? 'qua' : ''}${x.thuThach ? ` co-tt${this.thuThachDat.has(this._khoaTT(j)) ? ' tt-dat' : ''}` : ''}" data-buoc="${j}" title="${chu("gd.buoc-muc", [j + 1])} ${String(x.ten).replace(/[$*{}\\]/g, '').replace(/"/g, '&quot;')}${x.thuThach ? chu("gd.co-thu-thach") : ''}"></button>`).join('') : '';
    for (const c of $('buoc-cham').children) c.addEventListener('click', () => { const j = Number(c.dataset.buoc); this.am.phat(j >= this.chiSoBuoc ? 'buoc' : 'buoc-lui'); this.moBuoc(j); });
    $('buoc-ten').innerHTML = trongDong(b.ten || '');
    const nd = $('buoc-noi-dung');
    nd.innerHTML = dinhDang(b.noiDung || '') + this._htmlThuThach(b, k);
    coCongThucVua(nd);           // công thức dài hơn bảng thì co cho vừa
    this._ganThuThach(b, k);
    for (const nut of nd.querySelectorAll('.nut-thu')) {
      nut.addEventListener('click', () => {
        this.am.phat('bam');
        this.nghe.daThu();
        const ham = b.nut?.[nut.dataset.nut];
        if (!ham) { console.warn(`Bước «${b.ten}» không có nút «${nut.dataset.nut}»`); this.loiGhi.push(`thiếu nút «${nut.dataset.nut}»`); return; }
        try { ham(this.canh, this); } catch (e) { console.error(e); this.loiGhi.push(`nút «${nut.dataset.nut}»: ${e?.message || e}`); }
      });
    }
    this._ganThuatNgu(nd);
    const truoc = $('buoc-truoc'), sau = $('buoc-sau');
    truoc.disabled = k === 0;
    const baiSau = this.dsCanh[this.chiSo + 1];
    if (k < n - 1) { sau.innerHTML = chu("gd.buoc-sau"); sau.disabled = false; }
    else if (baiSau) { sau.innerHTML = `${chu("gd.bai-sau-ten", [baiSau.ten])}`; sau.disabled = false; }
    else { sau.innerHTML = chu("gd.het-khoa-hoc"); sau.disabled = true; }
    if (k === n - 1) this._danhDauXong(this.dsCanh[this.chiSo].id);
    // Bảng nằm dưới (điện thoại): sang bước thì cuộn tới ngay tên bước, khỏi phải vuốt qua tên bài và hàng thẻ mỗi lần.
    // Vừa mở bài thì ở đầu bảng, để thấy tên bài một lần.
    const toiBuoc = this._lechDich[1] > 0 && !this.nghe._baiMoi;
    this.el.bang.scrollTop = toiBuoc ? Math.max(0, (so.closest('.buoc-thanh')?.offsetTop ?? 0) - this.el.bang.offsetTop - 8) : 0;
    if (this.canh) {
      try { b.vao?.(this.canh, this); } catch (e) { console.error(e); this.loiGhi.push(`vao(): ${e?.stack || e}`); }
    }
    this.nghe.khiMoBuoc(k, truocNghe);       // thanh «Nghe giảng» của bước mới; đang nghe thì nghe tiếp (nghe-giang.js)
  }
  buocSau() {
    this.moTab('hoc');
    if (this.chiSoBuoc < this._dsBuoc().length - 1) { this.am.phat('buoc'); this.moBuoc(this.chiSoBuoc + 1); }
    else if (this.chiSo < this.dsCanh.length - 1) this.chuyenBai(this.chiSo + 1);
  }
  buocTruoc() {
    this.moTab('hoc');
    if (this.chiSoBuoc > 0) { this.am.phat('buoc-lui'); this.moBuoc(this.chiSoBuoc - 1); }
    else if (this.chiSo > 0) this.chuyenBai(this.chiSo - 1);
  }
  // Người học đổi bài (nút, phím, mục lục). Đang nghe giảng thì đổi qua một nhịp màn tối và nghe tiếp ở bài mới
  // (nghe-giang.js); không thì mở bài như thường, có tiếng báo.
  chuyenBai(i, buoc = 0) {
    if (this.nghe.dangPhat) this.nghe._doiBai(Math.max(0, Math.min(this.dsCanh.length - 1, i | 0)), buoc);
    else this.moBai(i, buoc, true);
  }
  // Phím cách và nút tạm dừng trên thanh trên: đang trong một lượt nghe giảng thì tạm dừng hoặc chạy tiếp cả lời lẫn mô
  // hình; chưa nghe thì chỉ là mô hình.
  tamDungChay() {
    if (this.nghe.dangPhat || this.nghe.tamDung) this.nghe.phatDung();
    else this.datChay(!this.dangChay);
  }

  // ---------- Vòng lặp ----------
  _vong(now) {
    requestAnimationFrame(this._vong);
    // Giới hạn tốc độ vẽ: 60 khung hình mỗi giây là đủ (màn hình 120 Hz không cần vẽ gấp đôi); còn 30 khi đang ở màn hình
    // chào hoặc khi cửa sổ không được chọn (người dùng đang ở app khác), trừ lúc đang kéo vật.
    const nhip = (this.dangChao || !document.hasFocus()) && !this.tt.dangKeo && !this._nong && !window.__VT_THU?.ep60 ? 1000 / 30 : 1000 / 60;
    // Nhịp WebKit có thể dao động 13–20 ms dù vẫn cấp đủ 60 lần mỗi giây.
    // Chỉ bỏ khung khi nhịp gọi thực sự nhanh hơn nhịp muốn vẽ.
    const khoang = now - (this._rafTruoc ?? now);
    this._rafTruoc = now;
    if (khoang > 0) {
      this._nhipRaf = this._nhipRaf == null || khoang > 100 ? khoang : this._nhipRaf * 0.9 + khoang * 0.1;
    }
    if (this._nhipHen !== nhip || this._khungKe == null || now > this._khungKe + nhip) {
      this._khungKe = now;
      this._nhipHen = nhip;
    }
    const canGioiHan = this._nhipRaf < nhip * 0.88;
    if (canGioiHan && now < this._khungKe - this._nhipRaf / 2) return;
    this._khungKe = (canGioiHan ? this._khungKe : now) + nhip;
    this.doNet.nhip = nhip / 1000;
    const matDo = window.devicePixelRatio || 1;
    if (matDo !== this._dpr) this._doiManHinh(matDo);
    const tho = Math.max(0, (now - this._truoc) / 1000);
    const dtThuc = Math.min(0.1, tho);
    this._truoc = now;
    // Máy vẽ không kịp (dưới khoảng 42 khung hình mỗi giây) thì hạ độ nét một nấc; dư sức thì nâng lại.
    if (this.tuChinhDoNet && this.canh && !this._nong && !document.hidden && this.doNet.do(tho, this._msTinh)) {
      this._tiLeOnDinh = this.doNet.tiLe;
      if (!this.doNet.khuRangCua) this._tatKhuRangCua = true;
      this._ghiNhatKy({ loai: 'doi-do-net', doNet: this.doNet.tiLe, khuRangCua: this.doNet.khuRangCua, bai: this.soBai(), buoc: this.chiSoBuoc + 1 });
      this.renderer.setPixelRatio(this.doNet.tiLe);
      this._doiKichThuoc();
    }
    const tTinh = performance.now();
    this.buoc(dtThuc);
    this._msTinh = performance.now() - tTinh;
    // Nhật ký hiệu năng (chỉ trong app Mac, chỉ ghi vào máy này): mỗi 10 giây một dòng gồm số khung hình mỗi giây,
    // khung chậm nhất, độ nét đang dùng, bài và bước đang mở. Để khi app chậm thì biết chậm ở đâu, lúc nào.
    if (this._hnSo == null) this._hnSo = 0;
    const hn = this._hn || (this._hn = { t0: now, so: 0, xau: 0 });
    hn.so++;
    if (tho * 1000 > hn.xau && tho < 30) hn.xau = tho * 1000;
    if (now - hn.t0 >= (this._hnSo < 15 ? 2000 : 10000)) {
      this._hnSo = (this._hnSo || 0) + 1;
      this._ghiNhatKy({ loai: 'hieu-nang', khungMoiGiay: Math.round((hn.so / ((now - hn.t0) / 1000)) * 10) / 10, khungChamNhatMs: Math.round(hn.xau), doNet: this.renderer.getPixelRatio(), cheDo: this.cheDoHinh, bai: this.soBai(), buoc: this.chiSoBuoc + 1, cuaSo: [this.rong, this.cao], duocChon: document.hasFocus(), chao: !!this.dangChao, tieng: !!this.am.bat });
      hn.t0 = now; hn.so = 0; hn.xau = 0;
    }
  }
  _ghiNhatKy(muc) {
    this.nhatKy?.ghi(muc);
  }
  // Tách riêng để bộ kiểm có thể đẩy thời gian bằng tay.
  buoc(dtThuc) {
    // Vài lần mỗi giây, ở đầu khung hình: đọc lại các vùng đang bị giao diện che và cỡ các nhãn (ung-dung-bo-cuc.js).
    if (--this._vungCho <= 0) { this._vungCho = 15; this._capNhatVungChe(); }
    if (this._bay) this._capNhatBay(dtThuc);
    this.dk.update();
    const c = this.canh;
    if (!c) return;
    if (this._nong && !this._lamNong()) return;        // cảnh còn đang được làm nóng: chưa vẽ, chưa cho thời gian chạy
    const k = 1 - Math.exp(-dtThuc * 9);
    const lx = this.lech[0] + (this._lechDich[0] - this.lech[0]) * k;
    const ly = this.lech[1] + (this._lechDich[1] - this.lech[1]) * k;
    if (Math.abs(lx - this.lech[0]) > 0.01 || Math.abs(ly - this.lech[1]) > 0.01 || this._lechMoi) {
      this.lech[0] = lx; this.lech[1] = ly; this._lechMoi = false;
      if (Math.abs(lx) < 0.5 && Math.abs(ly) < 0.5) this.camera.clearViewOffset();
      else this.camera.setViewOffset(this.rong, this.cao, lx, ly, this.rong, this.cao);
    }
    if (c.tuChinhGanXa) {
      const d = this.camera.position.distanceTo(this.dk.target);
      this.camera.near = Math.max(1e-4, d * c.tuChinhGanXa[0]);
      this.camera.far = Math.max(d * c.tuChinhGanXa[1], c.tuChinhGanXa[2] ?? 0);
      this.camera.updateProjectionMatrix();
    }
    try {
      c.capNhat?.(this.dangChay ? dtThuc : 0, dtThuc);
    } catch (e) {
      console.error(e);
      this.baoLoi(String(e?.stack || e));
      this.canh = null;
      return;
    }
    this.tt.capNhat(dtThuc);
    if (this._tt) this._kiemThuThach(dtThuc);
    if (this._matNguCanh) return;                 // đang mất ngữ cảnh đồ hoạ: chờ khôi phục
    this.dungHinh.ve(c.scene, this.camera, dtThuc);
    this.nhan.render(c.scene, this.camera);
    boNhan.sapXep(this.camera, this.rong, this.cao);      // nhãn né bảng bài giảng, ô số liệu, mép cửa sổ; nhãn trong nhóm tránh nhau
    this._hudCho -= dtThuc;
    if (this._hudCho <= 0) { this._hudCho = 0.1; this.hud.dat(c.hud ? c.hud() : null); }
  }

  _doiKichThuoc() {
    const w = window.innerWidth, h = window.innerHeight;
    this.rong = w; this.cao = h;
    this.renderer.setSize(w, h);
    this.dungHinh.datKichThuoc(w, h, this.renderer.getPixelRatio(), !!this.doNet?.khuRangCua);
    this.nhan.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.zoom = this._thuNhoHep(this.dsCanh?.[this.chiSo]?.mayAnh?.hep);
    this.camera.updateProjectionMatrix();
    this._tinhLech();
    this.canh?.khiDoiKichThuoc?.(w, h);
  }

  // Ẩn bảng bài giảng cho mô hình chiếm cả cửa sổ (phím V hoặc B), hoặc hiện lại. Đây không phải một chế độ khác: bài,
  // bước, lời đang nghe và phụ đề giữ nguyên; lúc bảng ẩn có thêm thanh phát ở đáy (nghe-giang.js).
  anHienBang(an = !document.body.classList.contains('an-bang')) {
    an = !!an;
    document.body.classList.toggle('an-bang', an);
    this.nghe.khiAnHienBang(an);
    this._tinhLech();
  }

  toanManHinh() {
    // Trong app Mac, cửa sổ tự lo việc toàn màn hình; trong trình duyệt dùng Fullscreen API.
    const cau = window.webkit?.messageHandlers?.vuTru;
    if (cau) { cau.postMessage('toan-man-hinh'); return; }
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }
}

// Phần thân còn lại của lớp, chia theo việc (xem đầu tệp).
ghepPhuongThuc(UngDung, PT_LAM_NONG, PT_THU_THACH, PT_GIONG_DOC, PT_HINH, PT_AM, PT_MAY_QUAY, PT_BANG, PT_SO_TAY, PT_TU_KIEM, PT_SU_KIEN, PT_BO_CUC);
