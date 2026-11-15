import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 10 — Rơi tự do là đường thẳng nhất.
// Mô hình: phần (thời gian × độ cao) của không-thời gian quanh Trái Đất (hoặc lỗ đen) nhúng thành một mặt
// tròn xoay theo cách của R. Jonsson (Gen. Rel. Grav. 33, 1207, 2001): thời gian chạy vòng quanh trục, độ cao
// đi dọc mặt, và đường trắc địa của mặt trùng ĐÚNG với đường thế giới của vật rơi tự do theo phương thẳng đứng.
// Toán ở src/vat-ly/trac-dia.js; phép kiểm (đại lượng Clairaut không đổi) ở kiem-tra/kiem-trac-dia.mjs.
// Bên cạnh mặt là một cột đứng: khung nhìn không gian quen thuộc, quả bóng bay lên rơi xuống đồng bộ
// với giao điểm của đường thế giới và kinh tuyến «bây giờ».

import * as THREE from 'three';
import { so, soNghia, luyThua, C, GM_TRAI_DAT, R_TRAI_DAT_KM } from '../vat-ly/hang-so.js';
import { taoMat, quyDao, hDinhNangLuong, thoiGianBayNangLuong, giaTocDungYen, hDinhNewton, psiH } from '../vat-ly/trac-dia.js';
import { tanSoTheoDoCao, betaChoDinh } from '../vat-ly/nem-bong.js';
import { taoNhan, taoNenSao, taoDom, DuongDay, huyCanh, kep, lamMuot } from '../khung/ve.js';
import { MAU_KTG, muiTen } from '../khung/ktg.js';
import { mauNhip } from '../khung/mat-cong.js';
import { taoDenCanh, taoPhiHanhGia, taoBong } from '../khung/do-vat.js';
import { vlKimLoai, vlSon, vlSang, hopBo, dat, taoKetCau, ngauNhien } from '../khung/do-vat-chung.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('trac-dia', khoa, goc, thamSo);

const R = String.raw;

const G_CHUAN = 9.80665;                 // gia tốc rơi tự do chuẩn, m/s²
const RE = R_TRAI_DAT_KM * 1000;
const SC = 2.6;                          // bán kính đáy mặt khi vẽ (đơn vị cảnh)
const NH = 96, NP = 160;                 // lưới mặt: số hàng theo độ cao, số cột quanh trục
const NQ = 420;                          // số điểm trên mỗi đường thế giới
const PHI_TRUOC = 1.32;                  // góc quanh trục của phía đối diện máy quay mặc định
const MAU_DO = 0xff8a73;
const MAU_BONG = [0xffd27a, 0x7fcaff, 0xff7aa8, 0xc8aaff, 0x8fe3a8];

// Ba cỡ đặt sẵn. Đơn vị bên trong: c = 1; độ dài tính bằng mét (Trái Đất) hoặc bằng rs (lỗ đen).
const CO = {
  san: {
    ten: chuCanh("canh.san-nha", "Sân nhà"), rs: (2 * G_CHUAN * RE * RE) / (C * C), R: RE, hMax: 10, eta: 0.25, lambda: 0.6,
    // thanh trượt vận tốc: m/s
    v: { min: 0, max: 14, buoc: 0.1, macDinh: 9.9, doi: (v) => v / C, chu: (v) => `${so(v, 1)} m/s` },
    caoTha: { min: 1, max: 10, macDinh: 5 },
    tocDo: 0.5 * C,                       // đơn vị thời gian mỗi giây thật: chạy chậm 2 lần
    buocT: 0.25 * C, nhanT: 0.5 * C,      // kinh tuyến mỗi 0,25 s, ghi nhãn mỗi 0,5 s
    vachH: [0, 2, 4, 6, 8, 10], buocHPhu: 0.5, tauHuong: 0.25 * C,
    tg: (t) => `${so(t / C, 2)} s`, tgNgan: (t) => `${so(t / C, 1)} s`,
    cao: (h) => `${so(h, h < 10 ? 1 : 0)} m`, caoNgan: (h) => (h === 0 ? chuCanh("canh.mat-dat", "mặt đất") : `${so(h, 0)} m`),
    kMau: true,
  },
  td: {
    ten: chuCanh("canh.quanh-trai-dat", "Quanh Trái Đất"), rs: (2 * GM_TRAI_DAT) / (C * C), R: RE, hMax: 3 * RE, eta: 1, lambda: 0.9,
    v: { min: 0, max: 12, buoc: 0.05, macDinh: 7.9, doi: (v) => (v * 1000) / C, chu: (v) => `${so(v, 2)} km/s` },
    caoTha: { min: 1000, max: 19000, macDinh: 6371 },
    tocDo: 700 * C,
    buocT: 600 * C, nhanT: 1200 * C,
    vachH: [0, 0.5 * RE, RE, 1.5 * RE, 2 * RE, 3 * RE], buocHPhu: 0.25 * RE, tauHuong: 600 * C,
    tg: (t) => chuCanh("canh.phut", "{0} phút", [so(t / C / 60, 1)]), tgNgan: (t) => chuCanh("canh.phut", "{0} phút", [so(t / C / 60, 0)]),
    cao: (h) => `${so(h / 1000, 0)} km`, caoNgan: (h) => (h === 0 ? chuCanh("canh.mat-dat", "mặt đất") : `r = ${so(1 + h / RE, 1)} R`),
    kMau: true,
  },
  ld: {
    ten: chuCanh("canh.gan-lo-den", "Gần lỗ đen"), rs: 1, R: 1.5, hMax: 6.5, eta: 0.25, lambda: 0.6,
    // thanh trượt: tốc độ đo tại chỗ, phần của c
    v: { min: 0, max: 0.8, buoc: 0.01, macDinh: 0.6, doi: (v) => v, chu: (v) => `${so(v, 2)} c` },
    caoTha: { min: 0.5, max: 6.5, macDinh: 2.5 },
    tocDo: 2.2,
    buocT: 1, nhanT: 2,
    vachH: [0, 0.5, 1, 1.5, 2.5, 3.5, 4.5, 6.5], buocHPhu: 0.25, tauHuong: 1.5,
    tg: (t) => `${so(t, 1)} rs/c`, tgNgan: (t) => `${so(t, 0)}`,
    cao: (h) => `r = ${so(1.5 + h, 2)} rs`, caoNgan: (h) => `${so(1.5 + h, 1)} rs`,
    kMau: false,
  },
};
for (const k of Object.keys(CO)) CO[k].mat = taoMat(CO[k]);

// ---------- chất liệu (Bản 3) ----------
// Mặt kính có khối: màu theo nhịp đồng hồ (màu đỉnh), sáng tối theo một ngọn đèn, viền sáng khi nhìn sát mặt,
// lưới mịn vẽ ngay trong shader: vĩ tuyến (độ cao) ở các vạch chính và vạch phụ, kinh tuyến (thời gian) mỗi buocT
// và vạch phụ mỗi 1/5 buocT, chỉ trong một vòng. Lớp «truoc» là mặt ngoài trong suốt; lớp còn lại là lòng trong tối.
function taoVatLieuMat(truoc) {
  const vl = new THREE.ShaderMaterial({
    uniforms: {
      uDoMo: { value: truoc ? 0.4 : 0.8 }, uTruoc: { value: truoc ? 1 : 0 },
      uPhi0: { value: 0 }, uT0: { value: 1 }, uBuocT: { value: 1 }, uVong: { value: 1 }, uBuocH: { value: 1 }, uHMax: { value: 1 },
      uVach: { value: new Array(8).fill(-1) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 color; attribute vec2 aHT;
      varying vec3 vMau; varying vec3 vN; varying vec3 vV; varying vec2 vHT;
      void main() {
        vMau = color; vHT = aHT;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalMatrix * normal; vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDoMo, uTruoc, uPhi0, uT0, uBuocT, uVong, uBuocH, uHMax;
      uniform float uVach[8];
      varying vec3 vMau; varying vec3 vN; varying vec3 vV; varying vec2 vHT;
      float duongLuoi(float x, float w, float rong) {
        float d = abs(fract(x - 0.5) - 0.5) / max(w, 1e-7);
        return 1.0 - smoothstep(rong, rong + 1.0, d);
      }
      void main() {
        vec3 v = normalize(vV);
        vec3 n = normalize(vN); if (dot(n, v) < 0.0) n = -n;
        vec3 den = normalize(vec3(-0.3, 0.8, 0.5));
        float sang = 0.5 + 0.5 * dot(n, den);
        float vien = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.4);
        float bong = pow(max(dot(n, normalize(den + v)), 0.0), 48.0);
        float h = vHT.x;
        float t = mod(vHT.y - uPhi0, 6.2831853) * uT0;
        float wt = fwidth(t);
        float trong = step(t, uVong - 0.35 * uBuocT);
        float kt = duongLuoi(t / uBuocT, wt / uBuocT, 0.55) * trong;
        float ktPhu = duongLuoi(t / (0.2 * uBuocT), wt / (0.2 * uBuocT), 0.2) * trong;
        float kt0 = kt * step(t, 0.5 * uBuocT);
        float wh = fwidth(h);
        float vt = 0.0;
        for (int i = 0; i < 8; i++) {
          if (uVach[i] < 0.0) continue;
          float d = abs(h - uVach[i]) / max(wh, 1e-9);
          vt = max(vt, 1.0 - smoothstep(0.6, 1.6, d));
        }
        float vtPhu = duongLuoi(h / uBuocH, wh / uBuocH, 0.2);
        float chinh = max(vt, kt);
        float phu = max(vtPhu, ktPhu) * (1.0 - chinh);
        vec3 mauLuoi = vMau * 1.5 + vec3(0.1);
        vec3 c;
        float a;
        if (uTruoc > 0.5) {
          c = vMau * (0.14 + 0.4 * sang) + vMau * 1.05 * vien + vec3(0.92, 0.96, 1.0) * 0.3 * bong;
          c += mauLuoi * (chinh * 0.8 + phu * 0.26 + kt0 * 0.5);
          a = uDoMo * (0.6 + 1.6 * vien) + 0.3 * bong + chinh * 0.42 + phu * 0.1;
        } else {
          c = vMau * (0.08 + 0.16 * sang) + mauLuoi * (chinh * 0.3 + phu * 0.1);
          a = uDoMo;
        }
        gl_FragColor = vec4(c, clamp(a, 0.0, 0.94));
      }`,
    side: truoc ? THREE.FrontSide : THREE.BackSide,
    transparent: true, depthWrite: true,
  });
  vl.tuyenTinh = true;
  return vl;
}

// Dải băng dán theo đường thế giới: hai mép sáng, ruột trong mờ; phần đã qua (t ≤ bây giờ) sáng, phần chưa tới mờ.
function taoVatLieuBang(mau) {
  const vl = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uNow: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aT; attribute float aS; varying float vT; varying float vS;
      void main() { vT = aT; vS = aS; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uNow; varying float vT; varying float vS;
      void main() {
        float w = max(fwidth(vT), 1e-12);
        float qua = 1.0 - smoothstep(-w, w, vT - uNow);
        float ws = max(fwidth(vS), 1e-4);
        float mep = 1.0 - smoothstep(0.8, 2.2, (1.0 - abs(vS)) / ws);
        float k = mix(0.3, 1.0, qua);
        gl_FragColor = vec4(uMau * (0.3 + 1.5 * mep) * k, (0.34 + 0.62 * mep) * k);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  vl.tuyenTinh = true;
  return vl;
}

// Ống sáng ở lõi dải băng: lõi rực (độ sáng > 1 nên có quầng), phần chưa tới mờ.
function taoVatLieuOng(mau) {
  const vl = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) }, uNow: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aT; varying float vT; varying vec3 vN; varying vec3 vV;
      void main() {
        vT = aT;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalMatrix * normal; vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uNow; varying float vT; varying vec3 vN; varying vec3 vV;
      void main() {
        float w = max(fwidth(vT), 1e-12);
        float qua = 1.0 - smoothstep(-w, w, vT - uNow);
        float loi = pow(abs(dot(normalize(vN), normalize(vV))), 1.3);
        vec3 c = uMau * (0.5 + 2.3 * loi) * mix(0.2, 1.0, qua) + vec3(1.0) * 0.6 * pow(loi, 6.0) * qua;
        gl_FragColor = vec4(c, mix(0.3, 1.0, qua));
      }`,
    transparent: true, depthWrite: false,
  });
  vl.tuyenTinh = true;
  return vl;
}

// Mặt sân trong cột: đá cỏ sẫm, có vân, tối dần ra mép.
let _coSan = null;
function ketCauCo() {
  if (_coSan) return _coSan;
  _coSan = taoKetCau(256, 256, (g, w, h) => {
    const r = ngauNhien(31);
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, '#7d8a5e'); gr.addColorStop(0.75, '#5d6a45'); gr.addColorStop(1, '#3a4230');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = r() < 0.5 ? `rgba(30,40,20,${0.25 * r()})` : `rgba(190,200,150,${0.18 * r()})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
  });
  return _coSan;
}


// Kéo giả bằng sự kiện con trỏ, chỉ dùng khi chụp ảnh kiểm thử (tham số thu=keo-…): nắm tay nắm ở tuTG rồi kéo
// qua tám bước tới điểm denTG (toạ độ cảnh), thả ra. Đi qua đúng đường xử lý của khung tương tác.
function keoGia(app, tuTG, denTG) {
  const cv = app.renderer.domElement, r = cv.getBoundingClientRect();
  app.camera.updateMatrixWorld();
  const mh = (p) => { const v = p.clone().project(app.camera); return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]; };
  const [x0, y0] = mh(tuTG), [x1, y1] = mh(denTG);
  const su = (loai, x, y, nut) => cv.dispatchEvent(new PointerEvent(loai, {
    clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true, bubbles: true, cancelable: true,
    buttons: nut, button: loai === 'pointermove' ? -1 : 0,
  }));
  su('pointermove', x0, y0, 0);
  su('pointerdown', x0, y0, 1);
  for (let i = 1; i <= 8; i++) su('pointermove', x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8, 1);
  su('pointerup', x1, y1, 0);
}

export default {
  id: 'trac-dia',
  ten: 'Rơi tự do là đường thẳng nhất',
  moTa: 'Quả bóng ném lên đi «thẳng» trên một không-thời gian cong',
  yChinh: 'Nhúng phần «thời gian × độ cao» của không-thời gian quanh Trái Đất thành một mặt cong, ta thấy đường thế giới của quả bóng ném lên rồi rơi xuống chính là **đường thẳng nhất** (đường trắc địa) trên mặt ấy. Không có lực hấp dẫn nào kéo quả bóng; người đứng trên mặt đất mới là người bị đẩy lệch khỏi đường thẳng nhất. Phần lớn hiệu ứng đến từ việc **thời gian** trôi nhanh chậm khác nhau theo độ cao.',
  mayAnh: { viTri: [2.6, 5.2, 10.2], dich: [-0.8, 1.45, 0], fov: 40, min: 3, max: 40, gan: 0.2, xa: 400 },

  baiGiang: {
    mucTieu: [
      'Đọc được mặt không-thời gian (thời gian × độ cao): vòng quanh trục là thời gian, dọc mặt là độ cao.',
      'Giải thích được vì sao đường thế giới của quả bóng ném lên là đường trắc địa, còn của người đứng yên thì không.',
      'Nói được vì sao mọi vật, nặng hay nhẹ, rơi theo cùng một đường.',
      'Suy ra được g = (c²/2)·dA/dr từ độ chênh nhịp đồng hồ theo độ cao, và tính được g/c² ≈ 1,09 × 10⁻¹⁶ mỗi mét.',
      'Biết mô hình giữ đúng điều gì và không giữ đúng điều gì.',
    ],
    buoc: [
      {
        ten: 'Không có trọng lực: thời gian cuộn quanh ống trụ',
        noiDung: R`
          Bạn đang nhìn một **ống trụ**. Nó là một mảnh {{không-thời gian}} chỉ có hai chiều: **độ cao** (đi dọc ống, từ dưới lên) và **thời gian** (đi vòng quanh ống). Mỗi điểm trên ống là một {{sự kiện}}: «ở độ cao này, vào lúc này». Ở Bài 4 ta để trục thời gian dựng đứng; ở đây ta **cuộn** nó quanh ống, để lát nữa ống có thể đổi dáng.

          Đường xanh lục là kinh tuyến **«bây giờ»**; nó quay đều quanh ống. Cột bên trái là khung nhìn quen thuộc: chỉ có độ cao, không có thời gian. Quả bóng trên cột ở đúng độ cao nơi đường thế giới của nó cắt kinh tuyến «bây giờ».

          - Người đứng yên ở mặt đất: độ cao không đổi, thời gian vẫn trôi. Đường thế giới là **một vòng tròn** quanh chân ống.
          - Quả bóng ném lên 9,9 m/s ở nơi **không có trọng lực**: cứ mỗi giây lên thêm 9,9 m. Đường thế giới là **một đường xoắn** đi lên mãi, không bao giờ trở lại.

          Cắt ống theo một đường dọc rồi trải phẳng, đường xoắn thành **đường thẳng nghiêng**, vòng tròn thành **đường thẳng ngang**. Cả hai đều là đường thẳng: đó là chuyển động đều của Bài 4.

          > [Thử ngay] Kéo đầu mũi tên vàng ở cột bên trái để ném mạnh hay nhẹ, hoặc kéo đốm trắng trên ống để đổi hướng xuất phát của đường thế giới: dốc hơn là ném nhanh hơn.
          > [[Ném 9,9 m/s|nem]] [[Ném chậm 4 m/s|cham]] [[Nhìn từ trên xuống|tren]] [[Nhìn chéo|cheo]]

          > [Lưu ý] Âm thanh: khi quả bóng bay, bạn nghe một tiếng ngân có cao độ theo nhịp đồng hồ đứng yên ở độ cao của nó. Ở đây chưa có trọng lực, mọi đồng hồ cùng nhịp, nên tiếng giữ nguyên một cao độ dù bóng lên cao.`,
        vao: (c) => c.cauHinh({ co: 'san', trongLuc: false, bong: [{ v: 9.9 }], dungYen: true, giu: null, nhanNhip: false, mayAnh: 'cheo', ngay: true }),
        ra: (c) => c.tatTieng(),
        nut: { nem: (c) => c.cauHinh({ bong: [{ v: 9.9 }] }), cham: (c) => c.cauHinh({ bong: [{ v: 4 }] }), tren: (c) => c.goc('tren'), cheo: (c) => c.goc('cheo') },
        thuThach: {
          de: 'Ném từ mặt đất sao cho đường xoắn lên tới miệng ống (10 m) sau **đúng một vòng** quanh ống (2,69 giây). Đạt khi vận tốc lệch không quá 0,12 m/s.',
          kiem: (c) => { const b = c.bongTay(); return !!b && !b.trongLuc && b.co === 'san' && b.h0 < 0.05 && Math.abs(b.v - 10 / b.vong) <= 0.12; },
          goiY: R`Trên ống trụ đường thế giới là đường thẳng, nên vận tốc không đổi: $v = 10\ \text{m} / 2{,}69\ \text{s} \approx 3{,}71$ m/s.`,
        },
      },
      {
        ten: 'Bật trọng lực: mặt loe ra ở dưới',
        noiDung: R`
          Giờ bật trọng lực của Trái Đất. Ống trụ **loe ra ở phía dưới** và thu nhỏ dần lên trên. Vì sao lại loe ở dưới? Bài 9 cho biết: đồng hồ ở thấp chạy **chậm hơn** đồng hồ ở cao. Mặt được dựng sao cho đường thẳng nhất trên nó trùng với đường rơi thật, và muốn vậy thì vòng tròn ở thấp phải rộng hơn vòng ở cao. Ngoài hai tham số vẽ tự chọn (bước 7), mức loe do một thứ quyết định: nhịp đồng hồ đổi nhanh hay chậm theo độ cao. Trọng lực càng mạnh thì mặt loe càng gắt; không có trọng lực thì mặt trở lại là ống trụ. Màu của mặt cho biết nhịp đồng hồ: vàng cam ở dưới (chậm), xanh ở trên (nhanh).

          > [Lưu ý] Chiều dài cung trên mặt **không phải** số giây mà đồng hồ ở độ cao đó đếm được. Mặt này chỉ giữ đúng một điều là đường đi của vật rơi tự do; bước 7 nói rõ.

          Ném quả bóng y như cũ, 9,9 m/s. Lần này quả bóng không đi xoắn mãi lên nữa. Nó leo lên tới 5 m rồi **quay về** mặt đất sau 2,02 giây. Dải băng màu vàng là đường thế giới thật của nó, tính từ thuyết tương đối rộng.

          Điều đáng kinh ngạc: ta **không thêm lực nào** vào mô hình. Ta chỉ đổi dáng của mặt. Quả bóng vẫn đi «thẳng» như trên ống trụ; chính mặt cong làm cho đường thẳng ấy quay đầu.

          > [Lưu ý] Độ loe đã được **phóng đại khổng lồ**. Trên 10 m độ cao, nhịp đồng hồ thật chỉ chênh nhau khoảng một phần triệu tỉ ($1{,}09 \times 10^{-15}$). Mục 7 nói rõ mô hình được phóng đại theo cách nào mà vẫn giữ đúng đường đi của quả bóng.

          > [Thử ngay] Kéo đầu mũi tên vàng ở cột bên trái để ném lại: mỗi cú ném là một hướng xuất phát mới, và đường nào chưa vượt tốc độ thoát cũng quay về mặt đất.
          > [[Tắt trọng lực|tat]] [[Bật trọng lực|bat]] [[Ném 9,9 m/s|nem]]

          > [Lưu ý] Âm thanh: tiếng ngân khi quả bóng bay có cao độ theo nhịp đồng hồ đứng yên ở độ cao của bóng. Lên cao tiếng cao dần, rơi xuống tiếng trầm dần, chạm đất có tiếng «bịch». Chênh nhịp thật trên 10 m chỉ $1{,}09 \times 10^{-15}$; tiếng đã phóng đại sao cho mặt đất là 220 Hz, độ cao 10 m là 440 Hz (cao hơn một quãng tám), ở giữa tỉ lệ với độ chênh nhịp.`,
        vao: (c) => c.cauHinh({ co: 'san', trongLuc: true, bong: [{ v: 9.9 }], dungYen: false, giu: null, nhanNhip: false, mayAnh: 'cheo' }),
        ra: (c) => c.tatTieng(),
        nut: { tat: (c) => c.cauHinh({ trongLuc: false }), bat: (c) => c.cauHinh({ trongLuc: true }), nem: (c) => c.cauHinh({ bong: [{ v: 9.9 }] }) },
      },
      {
        ten: '«Đường thẳng nhất» trên mặt cong là gì',
        noiDung: R`
          Trên mặt cong không có đường thẳng theo nghĩa thước kẻ. Nhưng vẫn có một cách đi «thẳng»: **không bẻ lái** sang trái hay sang phải. Con kiến bò trên quả bóng mà mỗi bước đều đặt chân thẳng phía trước thì vạch ra một đường như thế. Đường đó gọi là {{đường trắc địa}}.

          Một cách thử bằng tay: lấy **một dải băng dính thẳng** dán lên mặt. Băng dính không chịu bị uốn ngang, nên nó tự nằm theo một đường trắc địa. Đường thế giới của quả bóng được vẽ thành một dải băng hẹp có hai mép cách đều nhau để gợi đúng hình ảnh ấy: dán thử một dải băng thẳng từ chân mặt, theo đúng hướng xuất phát, nó sẽ trùng với đường này.

          > [Ví dụ] Máy bay từ New York đi Hồng Kông bay vòng lên gần Bắc Cực, tới vĩ độ 84°. Trên bản đồ phẳng đường ấy trông cong, nhưng trên quả địa cầu nó là **cung tròn lớn**, đường trắc địa của mặt cầu: đường ngắn nhất và không bẻ lái.

          Trên mặt của ta, một đường trắc địa đi lên phía hẹp thì ngả dần rồi quay xuống phía rộng, dù không có ai lái: đó là hệ quả của việc mặt hẹp dần (định lý Clairaut ở khối «Đi sâu» bên dưới). Còn chuyện hai quả bóng ném cạnh nhau dần chụm lại hay tách ra mới là dấu hiệu của độ cong thật; Bài 12 nói về nó.

          > [Thử ngay] Rê chuột lên quả bóng nhỏ đang chạy trên mặt để đọc thời gian bay; xoay mặt để nhìn dải băng từ nhiều phía.
          > [[Nhìn sát dải băng|gan]] [[Nhìn toàn cảnh|cheo]]

          +++ Đi sâu: kiểm tra đường trắc địa bằng định lý Clairaut
          Trên mặt tròn xoay có một cách kiểm đường trắc địa rất gọn. Gọi $\rho$ là bán kính vòng tròn tại một điểm của đường, và $\gamma$ là góc giữa đường với kinh tuyến tại đó. Định lý Clairaut nói: dọc một đường trắc địa,

          $$ C = \rho \sin\gamma $$

          **không đổi**. Đi lên chỗ hẹp, $\rho$ nhỏ đi nên $\sin\gamma$ phải lớn lên: đường ngả dần sang nằm ngang (vận tốc giảm). Tới chỗ $\sin\gamma = 1$ thì đường song song với vòng tròn: đó là đỉnh, quả bóng dừng lại. Sau đó đường quay xuống.

          Bộ kiểm số của bài tính $C$ dọc đường thế giới thật của quả bóng (giải từ thuyết tương đối rộng, không dùng gì của mặt). $C$ không đổi tới khoảng $10^{-14}$ phần, cả với Trái Đất lẫn sát lỗ đen. Vì thế dải băng trên hình đúng là một đường trắc địa của mặt.
          +++`,
        vao: (c) => c.cauHinh({ co: 'san', trongLuc: true, bong: [{ v: 9.9 }], dungYen: false, giu: null, nhanNhip: false, mayAnh: 'cheo' }),
        ra: (c) => c.tatTieng(),
        nut: { gan: (c) => c.goc('gan'), cheo: (c) => c.goc('cheo') },
      },
      {
        ten: 'Người đứng yên KHÔNG đi đường thẳng nhất',
        noiDung: R`
          Vòng tròn đỏ cam ở chân mặt là đường thế giới của **người đứng yên trên mặt đất**. Trên ống trụ, vòng tròn ấy là đường thẳng. Trên mặt loe thì không: vòng tròn ở chỗ mặt đang loe ra luôn phải **bẻ lái** về một phía. Muốn đi trên nó, phải có cái gì đẩy liên tục.

          Cái đẩy đó là **mặt đất** (sàn nhà, đế giày). Các mũi tên đỏ cam chỉ hướng đẩy: hướng lên trên, với gia tốc 9,8 m/s². Ta gọi cảm giác bị đẩy ấy là **trọng lượng**.

          Nếu mặt đất biến mất, không còn ai đẩy, ta đi theo đường thẳng nhất: rơi xuống. Thử với một quả bóng được giữ ở độ cao 5 m (vòng tròn đỏ cam phía trên). Thả tay, đường thế giới tách khỏi vòng tròn theo đúng hướng của nó, rồi đi «thẳng» xuống đất.

          > [Tóm lại] Rơi tự do là trạng thái **không chịu lực nào**, đúng như phi hành gia trôi lơ lửng (Bài 7). Đứng yên trên mặt đất mới là trạng thái **đang bị đẩy**, giống như đứng trong tên lửa đang tăng tốc (Bài 8).

          > [Thử ngay] Kéo quả bóng mờ ở cột bên trái lên xuống để đổi độ cao thả.
          > [[Thả rơi từ 5 m|tha5]] [[Thả rơi từ 9 m|tha9]] [[Tắt trọng lực: vòng tròn lại thẳng|tat]] [[Bật lại|bat]]`,
        vao: (c) => c.cauHinh({ co: 'san', trongLuc: true, bong: [{ h0: 5 }], dungYen: true, giu: 5, nhanNhip: false, mayAnh: 'cheo' }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: 'Kéo quả bóng mờ ở cột bên trái tới độ cao mà thả ra nó chạm đất sau **đúng 1,2 giây** (lệch không quá 0,03 giây).',
          kiem: (c) => { const b = c.bongTay(); return !!b && b.trongLuc && b.co === 'san' && b.v === 0 && Math.abs(b.tBay - 1.2) <= 0.03; },
          goiY: R`Newton cho $h = \tfrac12 g t^2 = \tfrac12 \times 9{,}8 \times 1{,}2^2 \approx 7{,}1$ m. Đọc thời gian bay ở ô số liệu góc dưới.`,
        },
        nut: {
          tha5: (c) => c.cauHinh({ bong: [{ h0: 5 }], giu: 5 }), tha9: (c) => c.cauHinh({ bong: [{ h0: 9 }], giu: 9 }),
          tat: (c) => c.cauHinh({ trongLuc: false }), bat: (c) => c.cauHinh({ trongLuc: true }),
        },
      },
      {
        ten: 'Ném mạnh, ném nhẹ, nặng hay nhẹ',
        noiDung: R`
          Mỗi cách ném là một hướng xuất phát khác nhau từ cùng một sự kiện ở chân mặt. Ném càng mạnh, dải băng xuất phát càng dốc, leo càng cao, đi càng lâu mới quay về.

          > [Thử ngay] Kéo đầu mũi tên vàng để tự ném một quả.
          > [[Ném 4, 7, 10 và 13 m/s|bon]] [[Quả nặng và quả nhẹ|nang]] [[Thả rơi từ 8 m|tha]]

          Bấm nút «Quả nặng và quả nhẹ»: một quả tạ và một quả bóng bàn ném cùng tốc độ. Hai dải băng **trùng khít**. Đường đi do hình học của mặt quyết định, mà hình học thì không biết vật nặng hay nhẹ. Đây chính là điều Galilei thấy: mọi vật (bỏ qua sức cản không khí) rơi như nhau. Với Newton đó là một sự trùng hợp lạ (khối lượng quán tính bằng khối lượng hấp dẫn); với Einstein nó là điều hiển nhiên.

          Chuyển sang cỡ **Quanh Trái Đất** (từ mặt đất tới 4 lần bán kính Trái Đất) để ném rất mạnh:

          - 7,9 km/s thẳng lên: quả bóng lên tới độ cao khoảng 6 340 km rồi rơi về, sau 69 phút.
          - 11,2 km/s là {{tốc độ thoát}}: dải băng đi lên mãi, không quay về.

          > [Thử ngay] [[Ném 7,9 km/s|v79]] [[Ném 11,2 km/s|v112]] [[Về sân nhà|san]]`,
        vao: (c) => c.cauHinh({ co: 'san', trongLuc: true, bong: [{ v: 4 }, { v: 7 }, { v: 10 }, { v: 13 }], dungYen: false, giu: null, nhanNhip: false, mayAnh: 'cheo' }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: 'Ở cỡ «Sân nhà», ném thẳng lên từ mặt đất sao cho quả bóng bay **đúng 2 giây** rồi chạm đất (lệch không quá 0,03 giây).',
          kiem: (c) => { const b = c.bongTay(); return !!b && b.trongLuc && b.co === 'san' && b.h0 < 0.05 && b.v > 0 && Math.abs(b.tBay - 2) <= 0.03; },
          goiY: R`Lên mất một nửa thời gian, mỗi giây mất 9,8 m/s vận tốc: $v \approx 9{,}8$ m/s.`,
        },
        nut: {
          bon: (c) => c.cauHinh({ co: 'san', bong: [{ v: 4 }, { v: 7 }, { v: 10 }, { v: 13 }], giu: null }),
          nang: (c) => c.cauHinh({ co: 'san', bong: [{ v: 9.9, ten: chuCanh("canh.qua-ta-5-kg", "quả tạ 5 kg"), co: 1.5 }, { v: 9.9, ten: chuCanh("canh.qua-bong-ban-2-7-g", "quả bóng bàn 2,7 g"), co: 0.7 }], giu: null }),
          tha: (c) => c.cauHinh({ co: 'san', bong: [{ h0: 8 }], giu: 8 }),
          v79: (c) => c.cauHinh({ co: 'td', trongLuc: true, bong: [{ v: 7.9 }], giu: null, mayAnh: 'cheo' }),
          v112: (c) => c.cauHinh({ co: 'td', trongLuc: true, bong: [{ v: 7.9 }, { v: 11.19 }], giu: null, mayAnh: 'cheo' }),
          san: (c) => c.cauHinh({ co: 'san', bong: [{ v: 9.9 }], giu: null, mayAnh: 'cheo' }),
        },
      },
      {
        ten: 'Vì sao chỉ cần thời gian cong',
        noiDung: R`
          Các vòng chữ trên mặt giờ ghi **nhịp đồng hồ** ở mỗi độ cao, so với mặt đất. Ở 10 m, đồng hồ chạy nhanh hơn mặt đất chỉ một phần rất nhỏ: $1{,}09 \times 10^{-15}$, tức khoảng một phần triệu tỉ. Con số nhỏ đến thế làm sao bẻ cong được quả bóng?

          Câu trả lời nằm ở đơn vị. Trong không-thời gian, mỗi giây ta đi **300 000 km** dọc trục thời gian ($c \times 1$ giây), trong khi quả bóng chỉ đi vài mét trong không gian. Đường thế giới của nó gần như nằm dọc theo trục thời gian, nên một độ chênh rất nhỏ của nhịp thời gian, nhân với quãng đường khổng lồ ấy, đủ làm nó lệch thấy rõ.

          Kết quả gọn: gia tốc rơi bằng $c^2/2$ nhân với độ chênh của $A = 1 - r_s/r$ trên mỗi mét:

          $$ g = \frac{c^2}{2}\,\frac{\dd A}{\dd r} = c^2 \times \frac{\dd}{\dd r}\big(\text{nhịp đồng hồ}\big) $$

          Thay số: nhịp đồng hồ chênh $1{,}09 \times 10^{-16}$ mỗi mét, nhân $c^2 = 8{,}99 \times 10^{16}$ m²/s², được $g = 9{,}8$ m/s².

          > [Con số] Đồng hồ nguyên tử quang học ngày nay đo được chênh lệch này khi nâng đồng hồ lên chỉ vài chục xăng-ti-mét (Chou và cộng sự 2010), hoặc một milimét (Bothwell và cộng sự 2022).

          > [Thử ngay] Ném rồi lắng nghe: tiếng ngân lên cao rồi trầm xuống theo nhịp đồng hồ ở độ cao của quả bóng, đúng như các vòng chữ trên mặt (chênh lệch đã phóng đại, xem bước 2).
          > [[Ném 9,9 m/s|nem]] [[Thả rơi từ 10 m|tha]]

          +++ Đi sâu: suy ra g từ phương trình chuyển động, từng dòng
          Với $c = 1$, đường thế giới thật của vật ném thẳng đứng thoả (xem mục Công thức):

          $$ \frac{\dd^2 r}{\dd t^2} = \frac{A\,A'\,(2W - A)}{2E^2}, \qquad A' = \frac{\dd A}{\dd r} = \frac{r_s}{r^2} $$

          trong đó $W = E^2 - A$ và $(\dd r/\dd t)^2 = A^2 W/E^2$.

          1. **Vận tốc nhỏ**: $(\dd r/\dd t)^2 = A^2W/E^2 \ll 1$ nên $W \ll A$, bỏ $2W$ cạnh $A$: $\ \ddot r \approx -A^2 A'/(2E^2)$.
          2. Cũng vì $W \ll A$ nên $E^2 = A + W \approx A$: $\ \ddot r \approx -A\,A'/2$.
          3. **Trường yếu**: $A = 1 - r_s/r \approx 1$ (với Trái Đất $r_s/R = 1{,}4 \times 10^{-9}$): $\ \ddot r \approx -A'/2 = -r_s/(2r^2)$.
          4. Thay $r_s = 2GM/c^2$ và khôi phục $c$: $\ \ddot r = -\dfrac{c^2}{2}\,\dfrac{\dd A}{\dd r} = -\dfrac{GM}{r^2}$. Đây đúng là định luật Newton.

          Nhịp đồng hồ của người đứng yên là $\sqrt{A} \approx 1 - r_s/(2r)$, nên độ chênh nhịp mỗi mét là $\tfrac12 \dd A/\dd r = g/c^2 = 9{,}807/(2{,}998 \times 10^8)^2 = 1{,}09 \times 10^{-16}$ mỗi mét.

          Phần không gian của metric ($B = 1/A$) chỉ góp vào số hạng chứa $(\dd r/\dd t)^2$, tức nhỏ hơn cỡ $v^2/c^2 \approx 10^{-15}$ lần. Vì thế với mọi chuyển động chậm, **độ cong của thời gian** sinh ra gần như toàn bộ trọng lực.
          +++`,
        vao: (c) => c.cauHinh({ co: 'san', trongLuc: true, bong: [{ v: 9.9 }], dungYen: false, giu: null, nhanNhip: true, mayAnh: 'cheo' }),
        ra: (c) => { c.cauHinh({ nhanNhip: false }); c.tatTieng(); },
        nut: { nem: (c) => c.cauHinh({ bong: [{ v: 9.9 }], giu: null }), tha: (c) => c.cauHinh({ bong: [{ h0: 10 }], giu: null }) },
      },
      {
        ten: 'Hiểu cho đúng mô hình',
        noiDung: R`
          Mô hình này giữ đúng **một điều**: đường trắc địa của mặt trùng với đường thế giới của vật rơi tự do theo phương thẳng đứng (và của tia sáng đi thẳng đứng). Mọi điều khác là cách vẽ.

          - Mặt **không giữ đúng khoảng không-thời gian**: chiều dài trên mặt không phải là thời gian riêng. Mặt được dựng từ một metric «đối ngẫu» khác metric thật nhưng có cùng đường trắc địa (cách của Jonsson, 2001).
          - Dáng mặt có **hai tham số tự chọn** (độ loe và độ cao). Đổi chúng, mặt béo ra hay gầy đi, nhưng quả bóng vẫn đi đúng đường trắc địa.
          - Thời gian **cuộn vòng**: sau một vòng mặt trùng lên chính nó. Chỉ nên đọc những đường ngắn hơn một vòng.
          - Với Trái Đất thật, độ cong cực nhỏ; hình đã phóng đại để nhìn thấy.

          Gần lỗ đen thì độ cong thật đã lớn: từ $r = 1{,}5\,r_s$ tới $8\,r_s$ nhịp đồng hồ đổi từ 0,58 tới 0,94 lần nhịp ở xa, và màu trên mặt là màu thật, không phóng đại.

          > [Thử ngay] Ở cỡ «Gần lỗ đen», kéo mũi tên vàng để ném từ $1{,}5\,r_s$ và xem dải băng quay đầu ở đâu.
          > [[Gần lỗ đen|ld]] [[Quanh Trái Đất|td]] [[Sân nhà|san]]

          Mặt này chỉ có thời gian và một chiều độ cao. **Bài 11** nói về phần không gian của độ cong (thước đo dài ra quanh một khối lượng). **Bài 12** nói về độ cong thật, thứ không phép đổi khung nào xoá được: lực thủy triều.`,
        vao: (c) => c.cauHinh({ co: 'ld', trongLuc: true, bong: [{ v: 0.65 }, { v: 0.55 }, { v: 0.45 }], dungYen: true, giu: null, nhanNhip: false, mayAnh: 'cheo' }),
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: R`Ở cỡ «Gần lỗ đen», ném thẳng lên từ $1{,}5\,r_s$ sao cho quả bóng lên tới **đúng $3\,r_s$** rồi rơi về (lệch không quá $0{,}2\,r_s$).`,
          kiem: (c) => { const b = c.bongTay(); return !!b && b.trongLuc && b.co === 'ld' && b.h0 < 0.02 && Math.abs(b.hDinh + 1.5 - 3) <= 0.2; },
          goiY: R`Năng lượng bảo toàn: $A(r_{\text{đỉnh}}) = A(r_0)/(1 - \beta^2)$ với $A = 1 - r_s/r$. Thay $r_0 = 1{,}5\,r_s$, $r_{\text{đỉnh}} = 3\,r_s$: $1 - \beta^2 = \tfrac12$, $\beta \approx 0{,}71\,c$ (đo tại chỗ).`,
        },
        nut: {
          ld: (c) => c.cauHinh({ co: 'ld', bong: [{ v: 0.65 }, { v: 0.55 }, { v: 0.45 }], mayAnh: 'cheo' }),
          td: (c) => c.cauHinh({ co: 'td', bong: [{ v: 6 }, { v: 7.9 }], mayAnh: 'cheo' }),
          san: (c) => c.cauHinh({ co: 'san', bong: [{ v: 9.9 }], mayAnh: 'cheo' }),
        },
      },
    ],
    congThuc: [
      { ten: 'Metric thật (thời gian và độ cao)', tex: R`\dd s^2 = -A\,c^2\dd t^2 + \frac{\dd r^2}{A}, \quad A = 1 - \frac{r_s}{r}`, y: '$t$ là thời gian của đồng hồ ở rất xa, $r$ là bán kính, $r_s = 2GM/c^2$ (Trái Đất: 8,9 mm). Nhịp đồng hồ đứng yên tại $r$ là $\\sqrt A$.' },
      { ten: 'Đường thế giới của vật ném thẳng đứng', tex: R`\Big(\frac{\dd r}{\dd t}\Big)^2 = \frac{A^2 W}{E^2},\quad \frac{\dd^2 r}{\dd t^2} = \frac{A A'(2W - A)}{2E^2}`, y: '$c = 1$. $E^2 = A_0 + e_0$, $W = E^2 - A$; $e_0 = A_0v_0^2/(A_0^2 - v_0^2)$ với $v_0 = \\dd r/\\dd t$ lúc ném.' },
      { ten: 'Trọng lực từ nhịp đồng hồ (trường yếu)', tex: R`g = \frac{c^2}{2}\frac{\dd A}{\dd r} = \frac{GM}{r^2}`, y: 'Trái Đất: $g/c^2 = 1{,}09 \\times 10^{-16}$ mỗi mét.' },
      { ten: 'Mặt nhúng (Jonsson 2001)', tex: R`\dd\sigma^2 = \frac{A}{\delta + \psi}\dd t^2 + \frac{k\,B}{(\delta + \psi)^2}\dd r^2`, y: '$\\psi = A(r) - A(R)$, $B = 1/A$, $\\delta > 0$, $k = A(R) - \\delta$. Metric dương này có cùng đường trắc địa với metric thật; mặt tròn xoay có bán kính $a = \\sqrt{A/(A(R)(1 + \\psi/\\delta))}$ và góc $\\varphi = t/T_0$.' },
      { ten: 'Định lý Clairaut', tex: R`\rho\,\sin\gamma = \text{hằng số}`, y: 'Dọc một đường trắc địa trên mặt tròn xoay: $\\rho$ là bán kính vòng tròn, $\\gamma$ là góc giữa đường với kinh tuyến.' },
    ],
    cauHoi: [
      {
        hoi: 'Trên mặt không-thời gian của bài, đường thế giới của người đứng yên trên mặt đất là vòng tròn ở chân mặt. Vì sao nó KHÔNG phải đường trắc địa khi có trọng lực?',
        chon: ['Vì người đứng yên không có đường thế giới', 'Vì ở chỗ mặt đang loe, vòng tròn phải bẻ lái liên tục; cần mặt đất đẩy thì mới đi được trên nó', 'Vì vòng tròn khép kín', 'Vì người đứng yên chuyển động nhanh hơn quả bóng'],
        dung: 1,
        giai: 'Vòng tròn ở nơi mặt có bán kính thay đổi luôn cong về một phía so với mặt (định lý Clairaut: chỉ vòng tròn ở chỗ bán kính đạt cực trị mới là đường trắc địa). Trên ống trụ (không trọng lực) vòng tròn lại là đường trắc địa. Vòng tròn khép kín chỉ vì thời gian được cuộn lại khi vẽ.',
      },
      {
        hoi: 'Một quả tạ và một quả bóng bàn được ném lên cùng tốc độ, bỏ qua không khí. Mô hình cho thấy gì?',
        chon: ['Quả tạ lên thấp hơn vì nặng hơn', 'Quả bóng bàn rơi chậm hơn', 'Hai đường thế giới trùng nhau vì đường trắc địa chỉ phụ thuộc vào điểm và hướng xuất phát', 'Hai đường cắt nhau ở đỉnh'],
        dung: 2,
        giai: 'Đường trắc địa được xác định hoàn toàn bởi sự kiện xuất phát và hướng xuất phát (tức vận tốc). Khối lượng không có mặt trong hình học. Đây là cách thuyết tương đối rộng giải thích quan sát của Galilei.',
      },
      {
        hoi: R`Đồng hồ ở độ cao $h$ chạy nhanh hơn đồng hồ ở mặt đất một tỉ lệ $gh/c^2$. Tỉ lệ ấy bằng bao nhiêu nếu $h = 100$ m?`,
        chon: [R`$1{,}09 \times 10^{-16}$`, R`$1{,}09 \times 10^{-14}$`, R`$1{,}09 \times 10^{-12}$`, R`$9{,}8 \times 10^{-2}$`],
        dung: 1,
        giai: R`$g/c^2 = 9{,}81/(3 \times 10^8)^2 \approx 1{,}09 \times 10^{-16}$ mỗi mét; nhân 100 m được $1{,}09 \times 10^{-14}$. Lựa chọn đầu là con số cho một mét.`,
      },
      {
        hoi: 'Một phi hành gia trôi lơ lửng trong trạm vũ trụ và một người đứng trên mặt đất. Ai đang đi theo đường trắc địa của không-thời gian?',
        chon: ['Người đứng trên mặt đất, vì người ấy đứng yên', 'Phi hành gia, vì người ấy không chịu lực nào ngoài «trọng lực», mà trọng lực không phải là lực', 'Cả hai', 'Không ai cả'],
        dung: 1,
        giai: 'Phi hành gia đang rơi tự do (quanh Trái Đất) nên đi theo đường trắc địa và không cảm thấy trọng lượng. Người đứng trên mặt đất bị mặt đất đẩy lệch khỏi đường trắc địa với gia tốc 9,8 m/s² hướng lên; cảm giác bị đẩy ấy là trọng lượng.',
      },
      {
        hoi: 'Mô hình mặt cong này có cho đo được thời gian riêng của quả bóng bằng cách đo chiều dài dải băng không?',
        chon: ['Có, chiều dài dải băng chính là thời gian riêng', 'Không: mặt chỉ giữ đúng đường trắc địa, không giữ đúng khoảng không-thời gian', 'Có, nhưng phải nhân với c', 'Chỉ đúng gần lỗ đen'],
        dung: 1,
        giai: 'Mặt được dựng từ một metric dương xác định khác metric thật, chỉ có chung đường trắc địa. Độ dài trên mặt không phải thời gian riêng. Muốn tính thời gian riêng phải dùng metric thật.',
      },
      {
        hoi: 'Vì sao một chênh lệch nhịp đồng hồ nhỏ cỡ 10⁻¹⁶ mỗi mét lại đủ sinh ra gia tốc 9,8 m/s²?',
        dap: R`Vì quả bóng đi trong không-thời gian chủ yếu theo chiều thời gian: mỗi giây là 300 000 km dọc trục thời gian, so với vài mét trong không gian. Gia tốc bằng $c^2$ nhân với độ chênh nhịp đồng hồ trên mỗi mét: $g = c^2 \times 1{,}09 \times 10^{-16}\ \text{m}^{-1} = 8{,}99 \times 10^{16} \times 1{,}09 \times 10^{-16} \approx 9{,}8$ m/s². Thừa số $c^2$ khổng lồ bù cho độ cong nhỏ xíu.`,
      },
    ],
    docThem: [
      'R. Jonsson, «Embedding spacetime via a geodesically equivalent metric of Euclidean signature», Gen. Rel. Grav. 33, 1207 (2001): cách dựng mặt dùng trong bài.',
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 6 (trọng lực là hình học) và chương 8 (đường trắc địa).',
      'E. F. Taylor, J. A. Wheeler và E. Bertschinger, *Exploring Black Holes* (bản 2): vật rơi thẳng đứng quanh lỗ đen.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): vì sao độ cong của thời gian sinh ra trọng lực.',
    ],
    thuatNgu: [
      { vi: 'mặt nhúng', en: 'embedding diagram', nghia: 'Một mặt vẽ trong không gian ba chiều quen thuộc để biểu diễn một phần của không-thời gian cong, giữ đúng một tính chất được chọn (ở Bài 10: đường trắc địa).' },
      { vi: 'tốc độ thoát', en: 'escape velocity', nghia: 'Tốc độ ném lên nhỏ nhất để vật đi ra xa mãi không rơi về. Trên mặt Trái Đất: 11,2 km/s.' },
      { vi: 'định lý Clairaut', en: 'Clairaut’s relation', nghia: 'Dọc một đường trắc địa trên mặt tròn xoay, tích của bán kính vòng tròn với sin góc giữa đường và kinh tuyến không đổi.' },
      { vi: 'gia tốc riêng', en: 'proper acceleration', nghia: 'Gia tốc mà chính vật cảm thấy và gia tốc kế đo được: bằng 0 khi rơi tự do, bằng 9,8 m/s² hướng lên khi đứng trên mặt đất.' },
    ],
  },

  conSo: [
    '**1,09 × 10⁻¹⁶ mỗi mét**: độ chênh nhịp đồng hồ theo độ cao ở mặt đất (g/c²).',
    '**2,02 giây, 5,0 m**: quả bóng ném 9,9 m/s lên rồi rơi về; thuyết tương đối rộng và Newton khớp tới phần triệu.',
    '**11,19 km/s**: tốc độ thoát ở mặt Trái Đất.',
    '**6 340 km**: độ cao đạt tới khi ném thẳng lên 7,9 km/s.',
  ],
  hieuDung: '**Trọng lực không kéo quả bóng xuống.** Quả bóng đi đường thẳng nhất trong không-thời gian cong; chính người đứng trên mặt đất mới bị đẩy (mặt đất đẩy lên 9,8 m/s²). Mặt cong trong bài chỉ giữ đúng đường trắc địa, không giữ đúng khoảng không-thời gian, và đã được phóng đại rất nhiều.',
  nguon: 'Cách dựng mặt: R. Jonsson, «Embedding spacetime via a geodesically equivalent metric of Euclidean signature», Gen. Rel. Grav. 33, 1207 (2001). Đường thế giới tính từ metric Schwarzschild (Hartle 2003, ch. 9). Hằng số: CODATA 2018, GM Trái Đất 3,986004418 × 10¹⁴ m³/s², g chuẩn 9,80665 m/s². Đồng hồ quang học: Chou và cộng sự 2010, Science 329, 1630; Bothwell và cộng sự 2022, Nature 602, 420.',

  tao(app) {
    const scene = new THREE.Scene();
    const am = app.am, tt = app.tt;
    scene.add(taoNenSao({ soSao: 1800, hat: 23, doSang: 0.5 }));
    taoDenCanh(scene, { renderer: app.renderer, doPhanChieu: 0.4, huongChinh: [3, 8, 7] });
    const goc = new THREE.Group();
    scene.add(goc);

    const S = {
      co: 'san', trongLuc: true, m: 1, mLin: 1, mDich: 1, phi0: 0, t: 0, bong: [], dungYen: false, giu: null, nhanNhip: false,
      vNem: CO.san.v.macDinh, hTha: CO.san.caoTha.macDinh,
      nem: { h0: 0, v: CO.san.v.macDinh },        // cú ném người học đang chỉnh bằng tay nắm
    };
    const P = () => CO[S.co];
    const M = () => CO[S.co].mat;

    // ---------- ánh xạ (h, φ) → điểm trên mặt; trộn giữa ống trụ (m = 0) và mặt cong (m = 1) ----------
    let zTop = 1;
    const yTru = (h) => (zTop * h) / P().hMax;                      // ống trụ: độ cao tuyến tính
    const rho = (h) => SC * (1 + (M().aTai(h) - 1) * S.m);
    const yy = (h) => SC * (yTru(h) + (M().zTai(h) - yTru(h)) * S.m);
    const _p = new THREE.Vector3();
    // ghi điểm (cách mặt «noi» theo pháp tuyến ra ngoài) vào out
    function diem(h, phi, noi, out) {
      const hm = P().hMax, e = hm * 2e-3;
      const h0 = Math.max(0, h - e), h1 = Math.min(hm, h + e);
      const dr = rho(h1) - rho(h0), dy = yy(h1) - yy(h0);
      const l = Math.hypot(dr, dy) || 1;
      const nr = dy / l, ny = -dr / l;
      const r = rho(h) + nr * noi;
      out.set(r * Math.cos(phi), yy(h) + ny * noi, r * Math.sin(phi));
      return out;
    }
    const phiT = (t) => S.phi0 + t / M().T0;
    const hHang = (i) => P().hMax * Math.pow(i / NH, S.co === 'san' ? 1 : 1.6);
    // nghịch đảo yy (đơn điệu tăng) bằng chia đôi
    function hTuY(y) {
      let a = 0, b = P().hMax;
      if (y <= yy(a)) return a;
      if (y >= yy(b)) return b;
      for (let i = 0; i < 40; i++) { const c = 0.5 * (a + b); if (yy(c) < y) a = c; else b = c; }
      return 0.5 * (a + b);
    }

    // ---------- mặt kính: hai lớp (lòng trong tối, mặt ngoài trong suốt), lưới mịn vẽ trong shader ----------
    const nV = (NH + 1) * (NP + 1);
    const vt = new Float32Array(nV * 3), mauDinh = new Float32Array(nV * 3), ht = new Float32Array(nV * 2);
    const chiSo = [];
    for (let i = 0; i < NH; i++) for (let j = 0; j < NP; j++) {
      const a = i * (NP + 1) + j, b = a + 1, c = a + NP + 1, d = c + 1;
      chiSo.push(a, b, c, b, d, c);
    }
    const geoMat = new THREE.BufferGeometry();
    geoMat.setAttribute('position', new THREE.BufferAttribute(vt, 3));
    geoMat.setAttribute('color', new THREE.BufferAttribute(mauDinh, 3));
    geoMat.setAttribute('aHT', new THREE.BufferAttribute(ht, 2));
    geoMat.setIndex(chiSo);
    const geoTrong = new THREE.BufferGeometry();
    for (const k of ['position', 'color', 'aHT']) geoTrong.setAttribute(k, geoMat.getAttribute(k));
    geoTrong.setIndex(geoMat.getIndex());
    const vlNgoai = taoVatLieuMat(true), vlTrong = taoVatLieuMat(false);
    const matNgoai = new THREE.Mesh(geoMat, vlNgoai);
    const matTrong = new THREE.Mesh(geoTrong, vlTrong);
    matTrong.renderOrder = 0; matNgoai.renderOrder = 1;
    goc.add(matTrong, matNgoai);
    // viền miệng trên và đáy: vành sáng mảnh
    const vienDuoi = new DuongDay(NP + 1, { mau: 0xffffff, rong: 1.6, doMo: 0.5, cong: false, sang: 1.2 });
    const vienTren = new DuongDay(NP + 1, { mau: 0xffffff, rong: 1.6, doMo: 0.6, cong: false, sang: 1.3 });
    goc.add(vienDuoi.line, vienTren.line);

    // nhãn của lưới: độ cao (vĩ tuyến) và thời gian (kinh tuyến); nét lưới do shader vẽ
    const MAX_VT = 10, MAX_KT = 40;
    const nhanVT = Array.from({ length: MAX_VT }, () => { const n = taoNhan('', 'mo tran'); goc.add(n); return n; });
    const nhanKT = Array.from({ length: MAX_KT }, () => { const n = taoNhan('', 'xanh tran', { giua: true }); n.userData.coChu = false; goc.add(n); return n; });
    const nhanTruc = taoNhan('', 'xanh tran', { giua: true });
    goc.add(nhanTruc);

    // kinh tuyến «bây giờ»
    const bayGio = new DuongDay(NH + 1, { mau: MAU_KTG.hienTai, rong: 2.6, quang: 0.12, sang: 1.5 });
    bayGio.line.renderOrder = 4;
    const bayGioMa = new DuongDay(NH + 1, { mau: MAU_KTG.hienTai, rong: 1.4, doMo: 0.28 });
    bayGioMa.mat.depthTest = false; bayGioMa.line.renderOrder = 5;
    goc.add(bayGioMa.line);
    const nhanBayGio = taoNhan('', 'tran');
    nhanBayGio.element.style.color = '#8fe3a8';
    goc.add(bayGio.line, nhanBayGio);

    // vòng đứng yên trên mặt đất và vòng «giữ ở độ cao»
    const vongDung = new DuongDay(NP + 1, { mau: MAU_DO, rong: 3, quang: 0.1, sang: 1.6 });
    const vongGiu = new DuongDay(NP + 1, { mau: MAU_DO, rong: 2, quang: 0.08, net: [0.12, 0.08], sang: 1.4 });
    vongDung.line.renderOrder = vongGiu.line.renderOrder = 3;
    const nhanDung = taoNhan('', 'dam tran');
    const nhanGiu = taoNhan('', 'tran');
    nhanGiu.element.style.color = '#ff8a73';
    const nhomMuiTen = new THREE.Group();
    // sự kiện «bây giờ» của người đứng yên: đốm đỏ cam chạy vòng theo thời gian
    const chamDung = taoDom(new THREE.Color(MAU_DO).multiplyScalar(2.2), 0.34);
    goc.add(vongDung.line, vongGiu.line, nhanDung, nhanGiu, nhomMuiTen, chamDung);

    // ---------- cột: khung nhìn không gian quen thuộc (sân, thước đo, người đứng yên, các quả bóng) ----------
    const COT = new THREE.Vector3(-SC - 1.5, 0, 1.0);
    const cot = new THREE.Group();
    cot.position.copy(COT);
    goc.add(cot);
    const vlThep = vlKimLoai(0xc7ced8, 0.3);
    {
      // nền sân: đĩa đá sẫm có vành kim loại
      const nen = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.74, 0.08, 56), vlSon(0x3a3f36, 0.85));
      nen.position.y = -0.04;
      const mat = new THREE.Mesh(new THREE.CircleGeometry(0.7, 56), vlSon(0x55613f, 0.95, { map: ketCauCo() }));
      mat.rotation.x = -Math.PI / 2; mat.position.y = 0.002;
      const vanh = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.016, 8, 72), vlThep);
      vanh.rotation.x = Math.PI / 2;
      cot.add(nen, mat, vanh);
    }
    const thanCot = new THREE.Mesh(dat(new THREE.CylinderGeometry(0.022, 0.026, 1, 12), { y: 0.5 }), vlThep);
    const dauCot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), vlSang(0xffffff, 1.6));
    const vachCot = Array.from({ length: MAX_VT }, () => { const v = new THREE.Mesh(hopBo(0.16, 0.014, 0.03, 0.005), vlSon(0xe8ecf2, 0.4, { emissive: 0xffffff, emissiveIntensity: 0.25 })); cot.add(v); return v; });
    const nguoi = taoPhiHanhGia({ cao: 1, tuThe: 'dung' });
    nguoi.nhom.position.set(0.48, 0, -0.32);
    nguoi.nhom.rotation.y = 0.2;
    const nhanCot = taoNhan(chuCanh("canh.khung-nhin-quen-thuoc-chi-co-do-cao", "Khung nhìn quen thuộc<small>chỉ có độ cao</small>"), 'dam giua');
    const nhanNguoi = taoNhan(chuCanh("canh.nguoi-dung-yen", "người đứng yên"), 'mo');
    const nhanCotVach = Array.from({ length: MAX_VT }, () => { const n = taoNhan('', 'mo tran'); cot.add(n); return n; });
    cot.add(thanCot, dauCot, nguoi.nhom, nhanCot, nhanNguoi);
    tt.them(nguoi.nhom, {
      ten: chuCanh("canh.nguoi-dung-yen-tren-mat-dat", "Người đứng yên trên mặt đất"), mau: MAU_DO,
      moTa: () => chuCanh("canh.do-cao-khong-doi-thoi-gian-van-troi", "Độ cao không đổi, thời gian vẫn trôi: đường thế giới là vòng tròn đỏ cam ở chân mặt. Mặt đất đẩy lên <span class=\"so\">{0}</span>.", [S.co === 'ld' ? `${so(giaTocDungYen(M().rs, M().R, 0), 2)} c²/rs` : `${so(giaTocDungYen(M().rs, M().R, 0) * C * C, 2)} m/s²`]),
    });

    // điểm xuất phát của cú ném (bóng mờ), mũi tên vận tốc đầu
    const mauBan = new THREE.Color(MAU_BONG[0]);
    const X_BONG = -0.3;
    const bongMo = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 14), new THREE.MeshBasicMaterial({ color: mauBan.clone().multiplyScalar(0.9), transparent: true, opacity: 0.28, depthWrite: false }));
    const vongMo = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.006, 6, 40), vlSang(MAU_BONG[0], 1.8));
    const muiNem = new THREE.Group();
    const vlMui = vlSang(MAU_BONG[0], 1.7);
    const thanMui = new THREE.Mesh(dat(new THREE.CylinderGeometry(0.014, 0.014, 1, 10), { y: 0.5 }), vlMui);
    const dauMui = new THREE.Mesh(dat(new THREE.ConeGeometry(0.045, 0.12, 16), { y: -0.06 }), vlMui);
    muiNem.add(thanMui, dauMui);
    const nhanNem = taoNhan('', 'tran');
    nhanNem.element.style.color = '#ffd27a';
    cot.add(bongMo, vongMo, muiNem, nhanNem);
    const L_MUI = 1.5;      // chiều dài mũi tên thêm vào ứng với vận tốc lớn nhất của thanh trượt
    const L0_MUI = 0.3;     // đoạn gốc của mũi tên (ứng với vận tốc 0, chỉ để có chỗ nắm)

    // ---------- các quả bóng ----------
    const MAX_B = 5;
    const NR = 8;             // số cạnh của ống sáng
    const dsB = Array.from({ length: MAX_B }, (_, k) => {
      const mau = MAU_BONG[k];
      // dải băng (băng dính dán theo đường trắc địa): hai mép sáng, lõi sáng, phần chưa tới mờ
      const nV2 = NQ * 2;
      const pos = new Float32Array(nV2 * 3), aT = new Float32Array(nV2), aS = new Float32Array(nV2);
      const idx = [];
      for (let i = 0; i < NQ - 1; i++) { const a = 2 * i, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
      for (let i = 0; i < NQ; i++) { aS[2 * i] = -1; aS[2 * i + 1] = 1; }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
      geo.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
      geo.setIndex(idx);
      const vlBang = taoVatLieuBang(mau);
      const bang = new THREE.Mesh(geo, vlBang);
      bang.renderOrder = 3;
      bang.frustumCulled = false;
      // ống sáng ở lõi dải băng
      const posO = new Float32Array(NQ * NR * 3), nO = new Float32Array(NQ * NR * 3), tO = new Float32Array(NQ * NR);
      const idxO = [];
      for (let i = 0; i < NQ - 1; i++) for (let j = 0; j < NR; j++) {
        const a = i * NR + j, b = i * NR + ((j + 1) % NR), c = a + NR, d = b + NR;
        idxO.push(a, c, b, b, c, d);
      }
      const geoO = new THREE.BufferGeometry();
      geoO.setAttribute('position', new THREE.BufferAttribute(posO, 3));
      geoO.setAttribute('normal', new THREE.BufferAttribute(nO, 3));
      geoO.setAttribute('aT', new THREE.BufferAttribute(tO, 1));
      geoO.setIndex(idxO);
      const vlOng = taoVatLieuOng(mau);
      const ong = new THREE.Mesh(geoO, vlOng);
      ong.renderOrder = 4;
      ong.frustumCulled = false;
      const ma = new DuongDay(NQ, { mau, rong: 1.4, doMo: 0.3, cong: true });
      ma.mat.depthTest = false; ma.line.renderOrder = 5;
      // quả bóng nhỏ ở sự kiện «bây giờ» trên mặt, và quả bóng trong cột
      const qua = taoBong({ banKinh: 0.06, mau });
      const quang = taoDom(new THREE.Color(mau).multiplyScalar(1.8), 0.3);
      qua.nhom.add(quang);
      const bongCot = taoBong({ banKinh: 0.07, mau });
      const bongDo = new THREE.Mesh(new THREE.CircleGeometry(0.08, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }));
      bongDo.rotation.x = -Math.PI / 2;
      const nhan = taoNhan('', 'tran');
      nhan.element.style.color = `#${new THREE.Color(mau).getHexString()}`;
      const nhom = new THREE.Group();
      nhom.add(bang, ong, ma.line, qua.nhom, nhan);
      goc.add(nhom);
      cot.add(bongCot.nhom, bongDo);
      return { k, mau: new THREE.Color(mau), pos, aT, geo, bang, vlBang, posO, nO, tO, geoO, ong, vlOng, ma, qua, bongCot, bongDo, nhan, nhom, qd: null, n: 0, tArr: new Float64Array(NQ), hArr: new Float64Array(NQ), hCu: 0, daCham: false };
    });
    for (const b of dsB) {
      tt.them(b.qua.nhom, {
        ten: chuCanh("canh.duong-the-gioi-cua-qua", "Đường thế giới của quả {0}", [b.k + 1]), mau: MAU_BONG[b.k], banKinhPx: 16,
        moTa: () => moTaBong(b),
      });
    }
    function moTaBong(b) {
      if (!b.dat || !b.qd) return '';
      const p = P();
      if (!S.trongLuc) return chuCanh("canh.khong-trong-luc-di-len-deu-mai-duong", "Không trọng lực: đi lên đều mãi, đường thế giới là đường xoắn (một đường thẳng trên ống trụ).");
      if (b.qd.cham) return chuCanh("canh.bay-khong-co-luc-nao-keo-xuong-no", "Bay <span class=\"so\">{0}</span>{1}. Không có lực nào kéo xuống: nó đi đường thẳng nhất trên mặt cong.", [p.tg(b.qd.tBay), (b.dat.v ?? 0) > 0 ? chuCanh("canh.len-cao-nhat", ", lên cao nhất <span class=\"so\">{0}</span>", [p.cao(b.hDinh)]) : '']);
      return isFinite(b.hDinh) ? chuCanh("canh.bay-ra-ngoai-khung-hinh", "Bay ra ngoài khung hình.") : chuCanh("canh.vuot-toc-do-thoat-di-len-mai-khong", "Vượt tốc độ thoát: đi lên mãi, không quay về.");
    }

    // ---------- dựng lại hình khi đổi cỡ, đổi m ----------
    const cTam = new THREE.Color();
    function mauTai(h, out) {
      const m = M();
      if (P().kMau) {
        const f = m.psi(h) / m.psi(m.hMax);       // 0 ở mặt đất, 1 ở đỉnh (tỉ lệ thuận với độ chênh nhịp)
        return mauNhip(0.58 + 0.405 * f, out);
      }
      return mauNhip(Math.sqrt(m.A(h)), out);
    }
    const MAU_TRU = new THREE.Color(0.42, 0.6, 0.86);     // ống trụ (không trọng lực): mọi đồng hồ cùng nhịp
    const q = new THREE.Vector3();
    function dungMat() {
      const m = M(), p = P();
      zTop = m.zTai(m.hMax);
      let k = 0, k2 = 0;
      for (let i = 0; i <= NH; i++) {
        const h = hHang(i);
        mauTai(h, cTam);
        if (S.m < 1) cTam.lerp(MAU_TRU, 1 - S.m);
        for (let j = 0; j <= NP; j++) {
          const phi = (j / NP) * 2 * Math.PI;
          diem(h, phi, 0, q);
          vt[k] = q.x; vt[k + 1] = q.y; vt[k + 2] = q.z;
          mauDinh[k] = cTam.r; mauDinh[k + 1] = cTam.g; mauDinh[k + 2] = cTam.b;
          ht[k2] = h; ht[k2 + 1] = phi;
          k += 3; k2 += 2;
        }
      }
      geoMat.attributes.position.needsUpdate = true;
      geoMat.attributes.color.needsUpdate = true;
      geoMat.attributes.aHT.needsUpdate = true;
      geoMat.computeVertexNormals();
      if (geoTrong.getAttribute('normal') !== geoMat.getAttribute('normal')) geoTrong.setAttribute('normal', geoMat.getAttribute('normal'));
      geoMat.computeBoundingSphere();
      geoTrong.boundingSphere = geoMat.boundingSphere;
      // đồng phục lưới
      const vong = 2 * Math.PI * m.T0;
      for (const vl of [vlNgoai, vlTrong]) {
        const u = vl.uniforms;
        u.uT0.value = m.T0; u.uBuocT.value = p.buocT; u.uVong.value = vong; u.uBuocH.value = p.buocHPhu;
        u.uHMax.value = m.hMax;
        for (let i = 0; i < 8; i++) u.uVach.value[i] = p.vachH[i] ?? -1;
      }
      datPhi0();

      for (let j = 0; j <= NP; j++) {
        const phi = (j / NP) * 2 * Math.PI;
        diem(0, phi, 0.004, q); vienDuoi.dat(j, q.x, q.y, q.z);
        diem(m.hMax, phi, 0.004, q); vienTren.dat(j, q.x, q.y, q.z);
      }
      vienDuoi.xong(NP + 1); vienTren.xong(NP + 1);

      // nhãn độ cao
      const vach = p.vachH;
      nhanVT.forEach((n, k3) => {
        const h = vach[k3];
        n.visible = h != null && h > 0;
        nhanCotVach[k3].visible = h != null;
        vachCot[k3].visible = h != null;
        if (h == null) return;
        diem(h, Math.PI * 0.62, 0.1, q);
        n.position.copy(q);
        nhanCotVach[k3].position.set(0.14, yy(h), 0);
        vachCot[k3].position.set(0, yy(h), 0);
      });
      nhanTruc.datChu(chuCanh("canh.thoi-gian-chay-vong-quanh-truc-mot-vong", "thời gian chạy vòng quanh trục<small>một vòng = {0}</small>", [p.tg(vong)]));

      // cột
      const yT = yy(m.hMax);
      thanCot.scale.y = yT + 0.25;
      dauCot.position.y = yT + 0.25;
      nhanCot.position.set(0, yT + 0.75, 0);
      const caoNguoi = S.co === 'san' ? yy(1.8) - yy(0) : 0.62;
      nguoi.datCao(caoNguoi);
      nhanNguoi.position.set(0.62, caoNguoi * 0.8, -0.32);

      dungVongDung();
      for (const b of dsB) if (b.dat) dungBang(b);
      chinhNhanTrung();
      ghiNhan();
      datTayNem();
    }
    // Xoay lưới thời gian, nhãn kinh tuyến theo φ₀ (rẻ: không dựng lại mặt).
    function datPhi0() {
      const m = M(), p = P();
      for (const vl of [vlNgoai, vlTrong]) vl.uniforms.uPhi0.value = ((S.phi0 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const vong = 2 * Math.PI * m.T0;
      nhanKT.forEach((n, k) => {
        const t = k * p.buocT;
        const hien = t < vong - 0.35 * p.buocT && Math.abs((t / p.nhanT) - Math.round(t / p.nhanT)) < 1e-6;
        n.userData.coChu = hien;
        n.visible = hien;
        if (!hien) return;
        n.datChu(k === 0 ? chuCanh("canh.t-0-luc-nem", "t = 0<small>lúc ném</small>") : p.tgNgan(t));
        diem(0, phiT(t), 0.32, q);
        n.position.set(q.x, q.y - 0.2, q.z);
      });
      diem(0, PHI_TRUOC - 0.75, 0.45, q);
      nhanTruc.position.set(q.x, q.y - 0.55, q.z);
    }

    function ghiNhan() {
      const vach = P().vachH, m = M();
      vach.forEach((h, k) => {
        let chu = P().caoNgan(h);
        if (S.nhanNhip && h > 0) {
          // độ chênh nhịp so với mặt đất: √A(h)/√A(0) − 1 ≈ ψ/(2A(R))
          const d = m.psi(h) / (Math.sqrt(m.A(h)) * Math.sqrt(m.AR) + m.AR);
          chu = chuCanh("canh.nhanh-hon-mat-dat", "{0}<small>nhanh hơn mặt đất {1}</small>", [chu, luyThua(d, 3)]);
        }
        nhanVT[k].datChu(chu);
        nhanCotVach[k].datChu(P().caoNgan(h));
      });
    }

    // vòng tròn đứng yên, vòng giữ, mũi tên «mặt đất đẩy lên»
    function dungVongDung() {
      const q2 = new THREE.Vector3();
      for (let j = 0; j <= NP; j++) { diem(0, (j / NP) * 2 * Math.PI, 0.016, q2); vongDung.dat(j, q2.x, q2.y, q2.z); }
      vongDung.xong(NP + 1);
      const cong = S.m > 0.5;
      vongDung.datMau(cong ? MAU_DO : 0xffffff);
      vongDung.line.visible = S.dungYen;
      nhanDung.visible = S.dungYen;
      chamDung.visible = S.dungYen;
      vienDuoi.line.visible = !S.dungYen;
      diem(0, PHI_TRUOC + 0.95, 0.25, q2);
      nhanDung.position.set(q2.x, q2.y - 0.3, q2.z);
      const gLoc = giaTocDungYen(M().rs, M().R, 0);
      const chuG = S.co === 'ld' ? `${so(gLoc, 2)} c²/rs` : `${so(gLoc * C * C, 2)} m/s²`;
      nhanDung.datChu(cong
        ? chuCanh("canh.nguoi-dung-yen-tren-mat-dat-khong-phai", "<span style=\"color:#ff8a73\">Người đứng yên trên mặt đất</span><small>không phải đường thẳng nhất · mặt đất đẩy lên {0}</small>", [chuG])
        : chuCanh("canh.nguoi-dung-yen-vong-tron-mot-duong-thang", "Người đứng yên<small>vòng tròn: một đường thẳng trên ống trụ</small>"));
      // mũi tên dọc kinh tuyến, hướng lên
      while (nhomMuiTen.children.length) { const o = nhomMuiTen.children.pop(); huyCanh(o); }
      if (S.dungYen && cong) {
        const a = new THREE.Vector3(), b = new THREE.Vector3();
        const hMui = P().hMax * (S.co === 'san' ? 0.11 : 0.05);
        for (let k = 0; k < 7; k++) {
          const phi = (k / 7) * 2 * Math.PI + 0.25;
          diem(0, phi, 0.03, a); diem(hMui, phi, 0.03, b);
          nhomMuiTen.add(muiTen(a.toArray(), b.toArray(), { mau: MAU_DO, rong: 2.2, doMo: 0.95, dau: 0.16 }));
        }
      }
      // vòng giữ ở độ cao
      vongGiu.line.visible = nhanGiu.visible = S.giu != null;
      if (S.giu != null) {
        for (let j = 0; j <= NP; j++) { diem(S.giu, (j / NP) * 2 * Math.PI, 0.016, q2); vongGiu.dat(j, q2.x, q2.y, q2.z); }
        vongGiu.xong(NP + 1);
        diem(S.giu, PHI_TRUOC - 0.55, 0.12, q2);
        nhanGiu.position.copy(q2);
        nhanGiu.datChu(chuCanh("canh.duoc-giu-o-tay-giu-day-len", "được giữ ở {0}<small>(tay giữ đẩy lên)</small>", [P().cao(S.giu)]));
      }
    }

    // ---------- đường thế giới của từng quả bóng ----------
    function tinhQuyDao(b) {
      const p = P(), m = M(), d = b.dat;
      const h0 = d.h0 ?? 0, vTaiCho = d.v != null ? p.v.doi(d.v) : 0;
      const A0 = m.A(h0);
      const v0 = A0 * vTaiCho;                    // dr/dt = A·(tốc độ đo tại chỗ)
      const vong = 2 * Math.PI * m.T0;
      let qd;
      if (S.trongLuc) {
        // ước lượng thời gian bay để chọn bước tích phân
        const e0 = (A0 * v0 * v0) / (A0 * A0 - v0 * v0);
        const E2 = A0 + e0;
        const hD = v0 > 0 ? hDinhNangLuong(m.rs, m.R, h0, e0) : h0;
        let tUoc = isFinite(hD) && hD < m.hMax ? thoiGianBayNangLuong(m.rs, m.R, h0, e0, E2, 32) : 3 * vong;
        if (v0 === 0 && h0 > 0) tUoc = thoiGianBayNangLuong(m.rs, m.R, 0, m.rs * (1 / m.R - 1 / (m.R + h0)), m.AR + m.rs * (1 / m.R - 1 / (m.R + h0)), 32);
        if (v0 === 0 && h0 === 0) {
          // đặt nằm yên trên mặt đất: không rời mặt đất
          qd = { t: [0, vong * 0.98], h: [0, 0], cham: false, ra: false, tBay: NaN };
          b.hDinh = 0;
        } else {
          qd = quyDao({ rs: m.rs, R: m.R, hMax: m.hMax, h0, v0, tMax: Math.max(tUoc * 1.2, 1e-9), soBuoc: 3000 });
          b.hDinh = Math.min(hD, Infinity);
        }
        b.e0 = e0; b.E2 = E2;
      } else {
        // không trọng lực: chuyển động đều, h = h0 + v·t (ống trụ phẳng)
        const tRa = v0 > 0 ? (m.hMax - h0) / v0 : vong * 0.98;
        const T = [], H = [];
        for (let i = 0; i <= 200; i++) { const t = (Math.min(tRa, 3 * vong) * i) / 200; T.push(t); H.push(h0 + v0 * t); }
        qd = { t: T, h: H, cham: false, ra: v0 > 0, tBay: NaN };
        b.hDinh = v0 > 0 ? Infinity : h0;
      }
      b.qd = qd;
      // lấy mẫu đều theo t
      const tEnd = qd.t[qd.t.length - 1];
      b.tEnd = tEnd;
      let j = 0;
      for (let i = 0; i < NQ; i++) {
        const t = (tEnd * i) / (NQ - 1);
        while (j < qd.t.length - 2 && qd.t[j + 1] < t) j++;
        const f = kep((t - qd.t[j]) / ((qd.t[j + 1] - qd.t[j]) || 1), 0, 1);
        b.tArr[i] = t; b.hArr[i] = Math.min(m.hMax, Math.max(0, qd.h[j] + (qd.h[j + 1] - qd.h[j]) * f));
      }
      b.n = NQ;
    }

    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _tg = new THREE.Vector3(), _bn = new THREE.Vector3(), _n2 = new THREE.Vector3();
    const RONG_BANG = 0.05, R_ONG = 0.017;
    function dungBang(b) {
      if (!b.qd) return;
      const n = b.n;
      b.diem = b.diem || new Float32Array(NQ * 3);
      for (let i = 0; i < n; i++) {
        diem(b.hArr[i], phiT(b.tArr[i]), 0.014, _p);
        b.diem[i * 3] = _p.x; b.diem[i * 3 + 1] = _p.y; b.diem[i * 3 + 2] = _p.z;
      }
      for (let i = 0; i < n; i++) {
        const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
        _tg.set(b.diem[i1 * 3] - b.diem[i0 * 3], b.diem[i1 * 3 + 1] - b.diem[i0 * 3 + 1], b.diem[i1 * 3 + 2] - b.diem[i0 * 3 + 2]);
        if (_tg.lengthSq() < 1e-14) _tg.set(0, 1, 0);
        _tg.normalize();
        _a.set(b.diem[i * 3], b.diem[i * 3 + 1], b.diem[i * 3 + 2]);
        diem(b.hArr[i], phiT(b.tArr[i]), 0.114, _b);
        _n.copy(_b).sub(_a).normalize();
        _bn.crossVectors(_tg, _n).normalize();
        const k = i * 6;
        b.pos[k] = _a.x + _bn.x * RONG_BANG; b.pos[k + 1] = _a.y + _bn.y * RONG_BANG; b.pos[k + 2] = _a.z + _bn.z * RONG_BANG;
        b.pos[k + 3] = _a.x - _bn.x * RONG_BANG; b.pos[k + 4] = _a.y - _bn.y * RONG_BANG; b.pos[k + 5] = _a.z - _bn.z * RONG_BANG;
        b.aT[2 * i] = b.aT[2 * i + 1] = b.tArr[i];
        // ống: tâm nhô khỏi mặt một chút, vòng tròn vuông góc với hướng đi
        _n2.crossVectors(_bn, _tg).normalize();
        const cx = _a.x + _n.x * R_ONG * 1.2, cy = _a.y + _n.y * R_ONG * 1.2, cz = _a.z + _n.z * R_ONG * 1.2;
        for (let j = 0; j < NR; j++) {
          const th = (j / NR) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
          const nx = _n2.x * c + _bn.x * s, ny = _n2.y * c + _bn.y * s, nz = _n2.z * c + _bn.z * s;
          const o = (i * NR + j) * 3;
          b.posO[o] = cx + nx * R_ONG; b.posO[o + 1] = cy + ny * R_ONG; b.posO[o + 2] = cz + nz * R_ONG;
          b.nO[o] = nx; b.nO[o + 1] = ny; b.nO[o + 2] = nz;
          b.tO[i * NR + j] = b.tArr[i];
        }
        b.ma.dat(i, _a.x, _a.y, _a.z);
      }
      b.geo.attributes.position.needsUpdate = true;
      b.geo.attributes.aT.needsUpdate = true;
      b.geo.setDrawRange(0, Math.max(0, (n - 1) * 6));
      b.geoO.attributes.position.needsUpdate = true;
      b.geoO.attributes.normal.needsUpdate = true;
      b.geoO.attributes.aT.needsUpdate = true;
      b.ma.xong(n);
      // nhãn ở đỉnh (hoặc ở cuối nếu bay ra ngoài)
      let iD = 0;
      for (let i = 0; i < n; i++) if (b.hArr[i] > b.hArr[iD]) iD = i;
      if (b.qd.ra || iD === n - 1) iD = Math.min(n - 1, Math.round(n * 0.55));
      diem(b.hArr[iD], phiT(b.tArr[iD]), 0.2, _p);
      b.nhan.position.copy(_p);
      const d = b.dat, p = P();
      const ten = d.ten ? `${d.ten}: ` : '';
      const v = d.v ?? 0, h0 = d.h0 ?? 0;
      b.nhan.datChu(v > 0 ? chuCanh("canh.nem", "{0}ném {1}{2}", [ten, p.v.chu(v), h0 > 0 ? chuCanh("canh.tu", " từ {0}", [p.cao(h0)]) : '']) : h0 > 0 ? chuCanh("canh.tha-tu", "{0}thả từ {1}", [ten, p.cao(h0)]) : chuCanh("canh.nam-yen-tren-mat-dat", "{0}nằm yên trên mặt đất", [ten]));
    }

    // giuPhi: giữ nguyên chỗ xoay của lưới (khi đang kéo tay nắm, để mặt không quay dưới con trỏ)
    function datBong(ds, giuPhi = false) {
      S.bong = ds.slice(0, MAX_B);
      const dau = S.bong[0];
      dsB.forEach((b, k) => {
        b.dat = S.bong[k] || null;
        b.nhom.visible = b.bongCot.nhom.visible = b.bongDo.visible = !!b.dat;
        b.daCham = false;
        if (!b.dat) { b.qd = null; return; }
        b.bongCot.nhom.scale.setScalar(b.dat.co ?? 1);
        b.qua.nhom.scale.setScalar(Math.sqrt(b.dat.co ?? 1));
        tinhQuyDao(b);
      });
      if (dau) S.nem = { h0: dau.h0 ?? 0, v: dau.v ?? 0 };
      if (giuPhi) return;
      // xoay để đường của quả đầu tiên nằm giữa phía trước
      const b0 = dsB[0], vong = 2 * Math.PI * M().T0;
      S.phi0 = PHI_TRUOC - (dau && b0.qd ? Math.min(b0.tEnd, vong) : 0.5 * vong) / (2 * M().T0);
    }
    // bóng trùng đường (quả nặng, quả nhẹ): chỉ ghi nhãn một lần
    function chinhNhanTrung() {
      dsB.forEach((b, k) => {
        if (!b.dat || k === 0) return;
        const a = dsB[k - 1];
        if (a.dat && a.dat.v === b.dat.v && (a.dat.h0 ?? 0) === (b.dat.h0 ?? 0)) {
          b.nhan.visible = true;
          b.nhan.position.copy(a.nhan.position).add(new THREE.Vector3(0, -0.32, 0));
          b.nhan.datChu(chuCanh("canh.cung-mot-duong", "{0}: cùng một đường", [b.dat.ten ?? '']));
          return;
        }
        // hai đỉnh quá gần nhau (ví dụ ném 0,55 c và 0,45 c sát lỗ đen): dời nhãn sau xuống dưới cho khỏi chồng chữ
        for (let j = 0; j < k; j++) {
          const q = dsB[j];
          const dy = b.nhan.position.y - q.nhan.position.y;
          if (q.dat && b.nhan.position.distanceTo(q.nhan.position) < 1.5 && Math.abs(dy) < 0.4) {
            b.nhan.position.y = q.nhan.position.y - 1.2;
          }
        }
      });
    }

    // ---------- tay nắm: ném bằng tay ----------
    // τ: khoảng thời gian dùng để đặt tay nắm «hướng xuất phát» trên mặt (đủ ngắn để đường gần như thẳng)
    const tau = () => P().tauHuong;
    const vToaDo = (v, h0) => M().A(h0) * P().v.doi(v);                 // dr/dt lúc ném
    const vTuToaDo = (vc, h0) => vc / (M().A(h0) * P().v.doi(1));
    const huongNem = new DuongDay(24, { mau: 0xffffff, rong: 1.6, doMo: 0.75, net: [0.06, 0.05], sang: 1.4 });
    huongNem.line.renderOrder = 5;
    goc.add(huongNem.line);
    function hDauHuong() { const { h0, v } = S.nem; return Math.min(P().hMax, h0 + vToaDo(v, h0) * tau()); }
    function datTayNem() {
      const p = P(), { h0, v } = S.nem;
      const y0 = yy(h0);
      bongMo.position.set(X_BONG, y0 + 0.07, 0);
      vongMo.position.set(X_BONG, y0 + 0.07, 0);
      vongMo.rotation.x = Math.PI / 2;
      const L = L0_MUI + (L_MUI * v) / p.v.max;
      muiNem.visible = v > 0;
      muiNem.position.set(X_BONG, y0 + 0.14, 0);
      thanMui.scale.y = Math.max(0.001, L - 0.1);
      dauMui.position.y = Math.max(0.001, L - 0.1) + 0.06;
      nhanNem.position.set(X_BONG - 0.08, y0 + 0.14 + L + 0.12, 0);
      nhanNem.datChu(v > 0 ? chuCanh("canh.nem-2c98f5", "ném {0}", [p.v.chu(v)]) : h0 > 0 ? chuCanh("canh.tha-roi", "thả rơi") : '');
      cot.updateMatrixWorld();
      if (!tt.dangKeo || tayDangKeo !== 'cao') tayCao.dat(cot.localToWorld(_a.set(X_BONG, y0 + 0.07, 0)));
      if (!tt.dangKeo || tayDangKeo !== 'v') tayV.dat(cot.localToWorld(_a.set(X_BONG, y0 + 0.14 + L, 0)));
      // hướng xuất phát trên mặt: đoạn thẳng trong toạ độ (t, h) từ sự kiện ném tới thời điểm τ
      const hT = hDauHuong();
      for (let i = 0; i < 24; i++) { const s = i / 23; diem(h0 + (hT - h0) * s, phiT(tau() * s), 0.05, _p); huongNem.dat(i, _p.x, _p.y, _p.z); }
      huongNem.xong(24);
      if (!tt.dangKeo || tayDangKeo !== 'huong') tayHuong.dat(diem(hT, phiT(tau()), 0.05, _b));
    }
    let tayDangKeo = null;
    // ném lại với (h0, v) mới: một quả «của bạn» thay cho các quả cũ
    function nemTay(h0, v) {
      const p = P();
      h0 = kep(h0, 0, p.hMax * 0.98);
      v = kep(v, 0, p.v.max);
      S.nem = { h0, v };
      S.vNem = v; S.hTha = kep(h0, p.caoTha.min, p.caoTha.max);
      dkV.dat(S.vNem); dkH.dat(S.hTha);
      S.giu = v === 0 && h0 > 0 ? h0 : null;
      datBong([{ v, h0, ten: chuCanh("canh.qua-cua-ban", "quả của bạn"), tuTay: true }], true);
      dungVongDung();
      for (const b of dsB) if (b.dat) dungBang(b);
      S.t = 0;
      datTayNem();
    }
    const tayCao = tt.tayNam({
      viTri: [0, 0, 0], mau: 0xffd27a, co: 0.06, ten: chuCanh("canh.cho-nem-tha", "Chỗ ném, thả"), moTa: chuCanh("canh.keo-len-xuong-de-chon-do-cao-luc", "Kéo lên xuống để chọn độ cao lúc ném hay thả"),
      rangBuoc: { kieu: 'duong', qua: COT.clone().add(new THREE.Vector3(X_BONG, 0, 0)).toArray(), huong: [0, 1, 0] },
      nhan: chuCanh("canh.keo-de-chon-do-cao-tha", "Kéo để chọn độ cao thả"),
      khiNam: () => { tayDangKeo = 'cao'; },
      khiKeo: (p) => { nemTay(hTuY(p.y - COT.y - 0.07), S.nem.v); },
      khiTha: () => { tayDangKeo = null; datTayNem(); },
    });
    const tayV = tt.tayNam({
      viTri: [0, 0, 0], mau: 0xffd27a, co: 0.06, ten: chuCanh("canh.van-toc-nem", "Vận tốc ném"), moTa: chuCanh("canh.keo-dau-mui-ten-len-xuong-mui-ten", "Kéo đầu mũi tên lên xuống: mũi tên càng dài, ném càng mạnh"),
      rangBuoc: { kieu: 'duong', qua: COT.clone().add(new THREE.Vector3(X_BONG, 0, 0)).toArray(), huong: [0, 1, 0] },
      nhan: chuCanh("canh.keo-mui-ten-de-nem", "Kéo mũi tên để ném"),
      khiNam: () => { tayDangKeo = 'v'; },
      khiKeo: (p) => { const L = p.y - COT.y - yy(S.nem.h0) - 0.14 - L0_MUI; nemTay(S.nem.h0, (Math.max(0, L) / L_MUI) * P().v.max); },
      khiTha: () => { tayDangKeo = null; datTayNem(); },
    });
    // tay nắm trên mặt: chọn hướng xuất phát của đường thế giới (dốc hơn = ném mạnh hơn)
    const _r = new THREE.Vector3();
    const tayHuong = tt.tayNam({
      viTri: [0, 0, 0], mau: 0xffffff, co: 0.07, ten: chuCanh("canh.huong-xuat-phat", "Hướng xuất phát"), moTa: chuCanh("canh.keo-doc-kinh-tuyen-duong-the-gioi-xuat", "Kéo dọc kinh tuyến: đường thế giới xuất phát càng dốc, quả bóng được ném càng mạnh"),
      rangBuoc: {
        kieu: 'ham',
        chieu: (ray) => {
          const m = M(), phi = phiT(tau());
          let tot = 0, nho = Infinity;
          for (let i = 0; i <= 160; i++) {
            const h = (m.hMax * i) / 160;
            diem(h, phi, 0.05, _r);
            _r.sub(ray.origin);
            const s = _r.dot(ray.direction);
            if (s <= 0) continue;
            const d2 = (_r.lengthSq() - s * s) / (s * s);
            if (d2 < nho) { nho = d2; tot = h; }
          }
          return diem(Math.max(tot, S.nem.h0), phi, 0.05, new THREE.Vector3());
        },
      },
      nhan: chuCanh("canh.keo-huong-xuat-phat", "Kéo hướng xuất phát"),
      khiNam: () => { tayDangKeo = 'huong'; },
      khiKeo: (p) => {
        // tìm h của điểm vừa kéo tới (điểm nằm trên kinh tuyến t = τ)
        const m = M(), phi = phiT(tau());
        let tot = 0, nho = Infinity;
        for (let i = 0; i <= 320; i++) { const h = (m.hMax * i) / 320; const d = diem(h, phi, 0.05, _r).distanceToSquared(p); if (d < nho) { nho = d; tot = h; } }
        const h0 = S.nem.h0;
        nemTay(h0, vTuToaDo(Math.max(0, tot - h0) / tau(), h0));
      },
      khiTha: () => { tayDangKeo = null; datTayNem(); },
    });

    // ---------- điều khiển ----------
    const bang = app.bang;
    const dkCo = bang.chon({
      nhan: chuCanh("canh.co", "Cỡ"),
      luaChon: [
        { giaTri: 'san', nhan: chuCanh("canh.san-nha", "Sân nhà"), moTa: chuCanh("canh.mat-dat-toi-do-cao-10-m", "Mặt đất tới độ cao 10 m") },
        { giaTri: 'td', nhan: chuCanh("canh.quanh-trai-dat", "Quanh Trái Đất"), moTa: chuCanh("canh.mat-dat-toi-4-lan-ban-kinh-trai", "Mặt đất tới 4 lần bán kính Trái Đất") },
        { giaTri: 'ld', nhan: chuCanh("canh.gan-lo-den", "Gần lỗ đen"), moTa: chuCanh("canh.tu-1-5-rs-toi-8-rs", "Từ 1,5 rs tới 8 rs") },
      ],
      giaTri: S.co,
      khiDoi: (v) => cauHinh({ co: v, bong: [{ v: CO[v].v.macDinh }], giu: null }),
    });
    const dkTL = bang.congTac({ nhan: chuCanh("canh.trong-luc", "Trọng lực"), giaTri: true, khiDoi: (v) => cauHinh({ trongLuc: v }) });
    const dkV = bang.thanhTruot({
      nhan: chuCanh("canh.van-toc-nem", "Vận tốc ném"), min: 0, max: 14, buoc: 0.1, giaTri: S.vNem,
      hienThi: (v) => P().v.chu(v) + (S.co === 'ld' ? chuCanh("canh.do-tai-cho", " (đo tại chỗ)") : ''),
      khiDoi: (v) => nemTay(S.nem.h0, v),         // thanh trượt làm đúng việc của mũi tên vàng
    });
    const dkH = bang.thanhTruot({
      nhan: chuCanh("canh.do-cao-tha", "Độ cao thả"), min: 1, max: 10, buoc: 0.1, giaTri: S.hTha,
      hienThi: (v) => P().cao(v),
      khiDoi: (v) => nemTay(v, S.nem.v),          // thanh trượt làm đúng việc của quả bóng mờ
    });
    const themBong = (d) => cauHinh({ bong: [...S.bong, d].slice(-MAX_B) });
    bang.nut([
      { nhan: chuCanh("canh.nem-7c9fc3", "Ném"), chinh: true, khiBam: () => themBong({ v: S.vNem, tuTay: true }) },
      { nhan: chuCanh("canh.tha-roi-tu-do-cao-h", "Thả rơi từ độ cao h"), khiBam: () => themBong({ h0: S.hTha, tuTay: true }) },
      { nhan: chuCanh("canh.xoa-cac-qua", "Xoá các quả"), khiBam: () => cauHinh({ bong: [], giu: null }) },
    ]);
    const dkDung = bang.congTac({ nhan: chuCanh("canh.nguoi-dung-yen-tren-mat-dat", "Người đứng yên trên mặt đất"), giaTri: false, khiDoi: (v) => cauHinh({ dungYen: v }) });
    bang.chuThich(chuCanh("canh.keo-trong-canh-qua-bong-mo-o-cot", "Kéo trong cảnh: quả bóng mờ ở cột bên trái (độ cao thả), đầu mũi tên vàng (vận tốc ném), đốm trắng trên mặt (hướng xuất phát của đường thế giới). Dải băng có lõi sáng là đường thế giới của quả bóng (đường trắc địa của mặt); phần đã qua sáng, phần chưa tới mờ. Vòng quanh trục là thời gian; dọc mặt là độ cao. Màu mặt: nhịp đồng hồ (vàng cam: chậm, xanh: nhanh; với Trái Đất màu được phóng đại). Tiếng: cao độ theo độ cao của quả bóng."));

    function capNhatDieuKhien() {
      const p = P();
      // đổi thang thanh trượt theo cỡ: dựng lại thuộc tính của ô nhập
      const inpV = dkV.el.querySelector('input'), inpH = dkH.el.querySelector('input');
      inpV.min = p.v.min; inpV.max = p.v.max; inpV.step = p.v.buoc;
      inpH.min = p.caoTha.min; inpH.max = p.caoTha.max; inpH.step = (p.caoTha.max - p.caoTha.min) / 200;
      dkV.dat(S.vNem); dkH.dat(S.hTha);
      dkCo.dat(S.co); dkTL.dat(S.trongLuc); dkDung.dat(S.dungYen);
    }

    const GOC = {
      cheo: () => [[2.6, 5.2, 10.2], [-0.8, yy(M().hMax) * 0.46, 0]],
      tren: () => [[0.01, 13, 0.6], [-0.9, 0, 0]],
      gan: () => {
        const b = dsB[0];
        if (!b.qd) return GOC.cheo();
        const i = Math.round(b.n * 0.22);
        diem(b.hArr[i], phiT(b.tArr[i]), 0, _p);
        const huong = new THREE.Vector3(_p.x, 0, _p.z).normalize();
        return [[_p.x + huong.x * 4.6, _p.y + 1.4, _p.z + huong.z * 4.6], [_p.x * 0.8, _p.y + 0.3, _p.z * 0.8]];
      },
    };
    const datGoc = (ten, giay = 1.4) => {
      const [v, d] = GOC[ten]();
      // mặt cao (lỗ đen) thì lùi máy quay ra cho vừa khung
      const k = ten === 'cheo' ? Math.sqrt(Math.max(1, yy(M().hMax) / 3.3)) : 1;
      app.bayToi(v.map((x, i) => d[i] + (x - d[i]) * k), d, giay);
    };

    // Đặt nhiều thông số một lúc (các bước của bài giảng gọi hàm này).
    function cauHinh(o = {}) {
      let dung = false;
      if (o.co && o.co !== S.co) {
        S.co = o.co; S.vNem = CO[o.co].v.macDinh; S.hTha = CO[o.co].caoTha.macDinh; S.t = 0; dung = true;
      }
      if (o.trongLuc != null && o.trongLuc !== S.trongLuc) {
        S.trongLuc = o.trongLuc; S.mDich = o.trongLuc ? 1 : 0;
        if (o.ngay) S.m = S.mLin = S.mDich;
        S.t = 0; dung = true;
      } else if (o.ngay) { S.m = S.mLin = S.mDich = S.trongLuc ? 1 : 0; dung = true; }
      if (o.dungYen != null) { S.dungYen = o.dungYen; dung = true; }
      if (o.giu !== undefined) { S.giu = o.giu; dung = true; }
      if (o.nhanNhip != null) { S.nhanNhip = o.nhanNhip; ghiNhan(); }
      if (o.bong) S.t = 0;
      if (o.bong || dung) { datBong(o.bong ?? S.bong); dungMat(); }
      capNhatDieuKhien();
      if (o.mayAnh) datGoc(o.mayAnh);
    }
    datBong([{ v: 9.9 }]);
    dungMat();
    capNhatDieuKhien();

    // ---------- âm thanh: cao độ theo độ cao của quả bóng đầu tiên; tiếng chạm đất ----------
    let giong = null;
    function tatTieng() { if (giong) { giong.tat(0.25); giong = null; } }

    // Tham số thử riêng (chỉ khi chạy im lặng để chụp ảnh): đặt sẵn một trạng thái.
    const thu = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    let demKhung = 0;
    function apDungThu() {
      if (thu === 'xoan') nemTay(0, 10 / (2 * Math.PI * M().T0 / C));
      else if (thu === 'tha12') nemTay((G_CHUAN * 1.2 * 1.2) / 2, 0);
      else if (thu === 'nem2s') nemTay(0, G_CHUAN);
      else if (thu === 'ld3') nemTay(0, betaChoDinh(1.5, 3));
      else if (thu === 'keo-v' || thu === 'keo-ld') {
        const v = thu === 'keo-v' ? G_CHUAN : betaChoDinh(1.5, 3);
        keoGia(app, tayV.viTri, cot.localToWorld(new THREE.Vector3(X_BONG, yy(S.nem.h0) + 0.14 + L0_MUI + (L_MUI * v) / P().v.max, 0)));
      } else if (thu === 'keo-cao') keoGia(app, tayCao.viTri, cot.localToWorld(new THREE.Vector3(X_BONG, yy((G_CHUAN * 1.44) / 2) + 0.07, 0)));
      else if (thu === 'keo-huong') {
        const h0 = S.nem.h0, v = 10 / ((2 * Math.PI * M().T0) / C);
        keoGia(app, tayHuong.viTri, diem(h0 + vToaDo(v, h0) * tau(), phiT(tau()), 0.05, new THREE.Vector3()));
      }
    }

    // ---------- mỗi khung hình ----------
    function capNhat(dt, dtThuc = dt) {
      if (thu && ++demKhung === (thu.startsWith('keo') ? 150 : 4)) apDungThu();
      // đổi dáng mặt mượt khi bật/tắt trọng lực
      if (S.mLin !== S.mDich) {
        const buoc = dtThuc * 0.8;
        S.mLin = Math.abs(S.mDich - S.mLin) <= buoc ? S.mDich : S.mLin + Math.sign(S.mDich - S.mLin) * buoc;
        S.m = lamMuot(S.mLin);
        dungMat();
      }
      const m = M(), p = P();
      const vong = 2 * Math.PI * m.T0;
      let tLap = vong;
      for (const b of dsB) if (b.dat && b.qd) tLap = Math.max(tLap, Math.min(b.tEnd, 3 * vong));
      tLap += 0.18 * vong;
      const tCu = S.t;
      S.t += dt * p.tocDo;
      let vongLai = false;
      if (S.t > tLap) { S.t = 0; vongLai = true; }
      const t = S.t;
      // kinh tuyến «bây giờ»
      const phi = phiT(t);
      for (let i = 0; i <= NH; i++) { diem(hHang(i), phi, 0.02, _p); bayGio.dat(i, _p.x, _p.y, _p.z); bayGioMa.dat(i, _p.x, _p.y, _p.z); }
      bayGio.xong(NH + 1); bayGioMa.xong(NH + 1);
      // nhãn thời gian ở phía sau mặt thì ẩn đi cho khỏi rối
      const cx = app.camera.position.x, cz = app.camera.position.z, cl = Math.hypot(cx, cz) || 1;
      nhanKT.forEach((n) => {
        if (!n.userData.coChu) return;
        const n0 = n.position, l = Math.hypot(n0.x, n0.z) || 1;
        n.visible = (n0.x * cx + n0.z * cz) / (l * cl) > -0.05;
      });
      diem(m.hMax, phi, 0.15, _p);
      nhanBayGio.position.set(_p.x, _p.y + 0.3, _p.z);
      nhanBayGio.datChu(chuCanh("canh.bay-gio-t", "bây giờ<small>t = {0}{1}</small>", [p.tg(t), t >= vong ? chuCanh("canh.vong", " (vòng {0})", [Math.floor(t / vong) + 1]) : '']));
      if (S.dungYen) { diem(0, phi, 0.03, _p); chamDung.position.copy(_p); }
      // từng quả bóng
      const choTieng = dt > 0 && dt < 0.25;
      let hTieng = null;
      for (const b of dsB) {
        if (!b.dat || !b.qd) continue;
        b.vlBang.uniforms.uNow.value = t;
        b.vlOng.uniforms.uNow.value = t;
        const n = b.n;
        let h;
        const dangBay = t <= b.tEnd;
        if (dangBay) {
          const x = (t / (b.tEnd || 1)) * (n - 1), i = Math.min(n - 2, Math.floor(x)), f = x - i;
          h = b.hArr[i] + (b.hArr[i + 1] - b.hArr[i]) * f;
        } else h = b.qd.cham ? 0 : b.hArr[n - 1];
        const ra = !dangBay && b.qd.ra;
        b.qua.nhom.visible = dangBay;
        if (dangBay) { diem(h, phi, 0.07, _p); b.qua.nhom.position.copy(_p); }
        b.bongCot.nhom.visible = !ra;
        b.bongCot.nhom.position.set(X_BONG + 0.16 * b.k, yy(h) + 0.07 * (b.dat.co ?? 1), 0.0);
        b.bongDo.position.set(X_BONG + 0.16 * b.k, 0.006, 0);
        const cao = h / p.hMax;
        b.bongDo.material.opacity = 0.45 * (1 - Math.min(1, cao * 1.4));
        b.bongDo.scale.setScalar(1 + cao * 0.8);
        b.bongDo.visible = !ra;
        // tiếng chạm đất khi đường thế giới về lại mặt đất
        if (b.qd.cham && !b.daCham && tCu < b.qd.tBay && t >= b.qd.tBay && !vongLai) {
          b.daCham = true;
          if (choTieng && b.k === 0) am.not({ tanSo: 98, dai: 0.22, doTo: 0.45, dang: 'day', lech: -0.3 });
        }
        if (vongLai) b.daCham = false;
        b.hCu = h;
        if (b.k === 0 && dangBay && !ra) hTieng = h;
      }
      // cao độ: f = 220 Hz·(1 + Δn(h)/Δn(hMax)), Δn: độ chênh nhịp đồng hồ ở độ cao h so với mặt đất (phóng đại)
      if (dt > 0 && hTieng != null) {
        if (!giong) giong = am.giong({ dang: 'mem', tanSo: 220, doTo: 0 });
        giong.dat({ tanSo: tanSoTheoDoCao(m, hTieng, { trongLuc: S.trongLuc }), doTo: 0.13, lech: -0.25 });
      } else if (giong) giong.dat({ doTo: 0 }, 0.08);
      nguoi.capNhat?.(dtThuc);
    }

    function hud() {
      const p = P(), m = M();
      const d = [[chuCanh("canh.co", "Cỡ"), `${p.ten}${S.trongLuc ? '' : chuCanh("canh.khong-trong-luc", " · không trọng lực")}`], [chuCanh("canh.bay-gio", "Bây giờ"), `t = ${p.tg(S.t)}`]];
      const b = dsB.find((x) => x.dat && x.qd);
      if (!b) return d;
      const dat = b.dat;
      if (!S.trongLuc) {
        d.push([chuCanh("canh.qua-bong", "Quả bóng"), dat.v > 0 ? chuCanh("canh.len-deu-khong-bao-gio-quay-ve", "lên đều {0}, không bao giờ quay về", [p.v.chu(dat.v)]) : chuCanh("canh.dung-yen-giua-khoang-khong", "đứng yên giữa khoảng không")]);
        return d;
      }
      const h0 = dat.h0 ?? 0;
      if (b.qd.cham) {
        d.push([chuCanh("canh.thoi-gian-bay", "Thời gian bay"), `${p.tg(b.qd.tBay)}`]);
        if (dat.v > 0) d.push([chuCanh("canh.do-cao-cuc-dai", "Độ cao cực đại"), `${p.cao(b.hDinh)}`]);
      } else if ((dat.v ?? 0) === 0 && h0 === 0) d.push([chuCanh("canh.qua-bong", "Quả bóng"), chuCanh("canh.nam-yen-tren-mat-dat-ad4bf1", "nằm yên trên mặt đất")]);
      else d.push([chuCanh("canh.qua-bong", "Quả bóng"), isFinite(b.hDinh) ? chuCanh("canh.bay-ra-ngoai-khung-hinh-646014", "bay ra ngoài khung hình") : chuCanh("canh.thoat-ra-xa-mai-vuot-toc-do-thoat", "thoát ra xa mãi (vượt tốc độ thoát)")]);
      if (S.co === 'san') {
        const v = dat.v ?? 0;
        if (v > 0 && b.qd.cham && h0 === 0) {
          const hN = (v * v) / (2 * G_CHUAN), tN = (2 * v) / G_CHUAN;
          d.push([chuCanh("canh.newton-g-9-81-m-s", "Newton (g = 9,81 m/s²)"), chuCanh("canh.bay-s-cao-m-lech", "bay {0} s, cao {1} m · lệch {2}", [so(tN, 3), so(hN, 3), luyThua(Math.abs(b.qd.tBay / C - tN) / tN, 1)])]);
        } else if (v === 0 && b.qd.cham) {
          const tN = Math.sqrt((2 * h0) / G_CHUAN);
          d.push([chuCanh("canh.newton-g-9-81-m-s", "Newton (g = 9,81 m/s²)"), chuCanh("canh.roi-s-lech", "rơi {0} s · lệch {1}", [so(tN, 3), luyThua(Math.abs(b.qd.tBay / C - tN) / tN, 1)])]);
        }
      } else if (S.co === 'td' && (dat.v ?? 0) > 0) {
        const hN = hDinhNewton(m.rs, m.R, p.v.doi(dat.v));
        d.push([chuCanh("canh.newton-luat-1-r", "Newton (luật 1/r²)"), isFinite(hN) ? chuCanh("canh.cao-km", "cao {0} km", [so(hN / 1000, 0)]) : chuCanh("canh.thoat-ra-xa-mai", "thoát ra xa mãi")]);
      } else if (S.co === 'ld') {
        d.push([chuCanh("canh.newton", "Newton"), chuCanh("canh.khong-dung-duoc-sat-lo-den", "không dùng được sát lỗ đen")]);
      }
      return d;
    }

    // quả «của bạn» (ném bằng tay nắm, thanh trượt hay nút Ném của bảng điều khiển), cho thử thách
    function bongTay() {
      const b = dsB.find((x) => x.dat && x.dat.tuTay && x.qd);
      if (!b) return null;
      const p = P();
      return {
        co: S.co, trongLuc: S.trongLuc, h0: b.dat.h0 ?? 0, v: b.dat.v ?? 0,
        tBay: b.qd.cham ? b.qd.tBay / (S.co === 'ld' ? 1 : C) : NaN,
        hDinh: b.hDinh, ra: b.qd.ra, vong: (2 * Math.PI * M().T0) / (S.co === 'ld' ? 1 : C), hMax: p.hMax,
      };
    }

    return {
      scene, capNhat, hud, cauHinh,
      goc: datGoc,
      bongTay, tatTieng,
      huy() { tatTieng(); },
    };
  },
};
