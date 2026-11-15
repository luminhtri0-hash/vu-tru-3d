import { dich as dichChu } from '../ngon-ngu/dich.js';
// Bài 14 — Ánh sáng bị bẻ cong.
// Chùm tia song song đi ngang qua một khối lượng; mỗi tia là một đường trắc địa kiểu ánh sáng
// tích phân bằng RK4 (vat-ly/schwarzschild.js). Tính trong đơn vị rs = 1 rồi nhân với rsW để vẽ.
//
// Bản 3: tia đang xét là nhân vật chính (dày, sáng, có quầng), các tia khác lùi về sau; bầu trời sao thật phía sau bị
// bẻ cong bằng đúng góc lệch Schwarzschild (bảng tính sẵn, xem vat-ly/anh-sang-cong.js); thiên hà nền kéo được để tự tạo
// vòng Einstein; kéo tia để đổi khoảng ngắm; âm thanh theo góc lệch, độ phóng đại, độ trễ.

import * as THREE from 'three';
import { so } from '../vat-ly/hang-so.js';
import { taoTia, buocTiaRK4, gocLechAnhSang, B_TOI_HAN } from '../vat-ly/schwarzschild.js';
import { taoBangGocLech, SO_O_BANG, W_MAX, banKinhEinstein, doPhongDai } from '../vat-ly/anh-sang-cong.js';
import { taoNhan, taoNenSao, texDom, taoDom, DuongDay, huyCanh, kep } from '../khung/ve.js';
import { MAU } from '../khung/giao-dien.js';

const chuCanh = (khoa, goc, thamSo) => dichChu('anh-sang', khoa, goc, thamSo);

const R = String.raw;
const X0 = -32;          // nơi chùm tia xuất phát (đơn vị thế giới)
const BIEN = 36;         // tia ra khỏi vùng này thì thôi vẽ
const N_DIEM = 640;
const DO = Math.PI / 180;
const MAU_TIA = 0xf3c66f;
const B_MIN = 1, B_MAX = 14;
const D_LS = 30;         // thiên hà nền nằm sau lỗ đen 30 đơn vị (mặt phẳng nguồn)
const R_TH = 0.28;       // bán kính thiên hà nền, tính theo bán kính Einstein trên mặt phẳng nguồn
// Đích của thử thách (kiểm lại bằng bTheoGocLech trong kiem-tra/kiem-phan-4-cu.mjs)
const B_20_DO = 7.2866;  // góc lệch 20°
const B_90_DO = 3.0838;  // góc lệch 90°
const GOC = {
  cheo: [[-4, 17, 54], [2, 0, 0]],
  phang: [[2, 0.4, 56], [2, 0, 0]],
  gan: [[1.5, 0.4, 24], [1.5, 0, 0]],
  sau: [[46, 6, 12], [0, 0, 0]],
  truoc: [[-62, 10, 26], [-18, 0, 0]],
};
// Hoành độ đặt tay nắm của tia đang xét, theo góc nhìn (để tay nắm luôn trong khung hình)
const X_TAY = { cheo: -20, phang: -22, gan: -8.5, sau: -20, truoc: -20 };

let _bang = null;
const bangGocLech = () => (_bang ??= taoBangGocLech());
const _tam = { diem: new Float32Array(N_DIEM * 3), tg: new Float32Array(N_DIEM) };

// Lần theo một tia. Trả về số điểm; ghi điểm (đơn vị thế giới) và thời gian tọa độ vào mảng.
// xDung: dừng sớm khi tia đã qua hoành độ này (dùng khi kéo tay nắm).
function lanTia(y, z, rsW, diem, thoiGian, xDung = Infinity) {
  if (rsW < 1e-4) {
    diem[0] = X0; diem[1] = y; diem[2] = z; diem[3] = BIEN; diem[4] = y; diem[5] = z;
    thoiGian[0] = 0; thoiGian[1] = BIEN - X0;
    return { n: 2, bat: false };
  }
  const s = taoTia(X0 / rsW, y / rsW, z / rsW, 1, 0, 0);
  const bien = BIEN / rsW;
  let n = 0, bat = false;
  for (; n < N_DIEM; n++) {
    diem[n * 3] = s.x * rsW; diem[n * 3 + 1] = s.y * rsW; diem[n * 3 + 2] = s.z * rsW;
    thoiGian[n] = s.t * rsW;
    const r = Math.hypot(s.x, s.y, s.z);
    if (r < 1.0) { bat = true; n++; break; }
    if (r > bien && s.x * s.vx + s.y * s.vy + s.z * s.vz > 0 && n > 2) { n++; break; }
    if (s.x * rsW > xDung && n > 1) { n++; break; }
    buocTiaRK4(s, Math.max(0.012, 0.035 * r));
  }
  return { n, bat };
}

// Tung độ của tia (đã lần, n điểm) tại hoành độ x; nếu tia chưa tới x thì trả macDinh.
function yTaiX(diem, n, x, macDinh) {
  for (let i = 1; i < n; i++) {
    const x0 = diem[i * 3 - 3], x1 = diem[i * 3];
    if ((x0 - x) * (x1 - x) <= 0 && x1 !== x0) { const u = (x - x0) / (x1 - x0); return diem[i * 3 - 2] + u * (diem[i * 3 + 1] - diem[i * 3 - 2]); }
  }
  return macDinh;
}

// Điểm trên đường dựng đứng (x = xd, z = 0) gần tia chuột nhất.
function ganDuongDung(ray, xd) {
  const o = ray.origin, d = ray.direction;
  const wx = o.x - xd, wz = o.z;
  // đường: (xd, s, 0); tối thiểu |o + t·d − (xd, s, 0)|²
  const a = d.x * d.x + d.z * d.z;
  if (a < 1e-9) return null;
  const t = -(wx * d.x + wz * d.z) / a;
  return new THREE.Vector3(xd, o.y + t * d.y, 0);
}

// Đường đi theo Newton của một "viên đạn ánh sáng" bay với tốc độ c (M = 1/2 trong đơn vị rs).
function lanNewton(y, rsW, diem) {
  let x = X0 / rsW, yy = y / rsW, vx = 1, vy = 0, n = 0;
  const bien = BIEN / rsW;
  for (; n < N_DIEM; n++) {
    diem[n * 3] = x * rsW; diem[n * 3 + 1] = yy * rsW; diem[n * 3 + 2] = 0;
    const r = Math.hypot(x, yy);
    if (r > bien && x * vx + yy * vy > 0 && n > 2) { n++; break; }
    if (r < 0.05) { n++; break; }
    const h = Math.max(0.006, 0.03 * r);
    let a = -0.5 / (r * r * r);
    const hx = vx + 0.5 * h * a * x, hy = vy + 0.5 * h * a * yy;
    x += h * hx; yy += h * hy;
    const r2 = Math.hypot(x, yy);
    a = -0.5 / (r2 * r2 * r2);
    vx = hx + 0.5 * h * a * x; vy = hy + 0.5 * h * a * yy;
  }
  return n;
}

// Viền sáng theo góc nhìn (Fresnel), cộng vào ảnh: dùng cho mép chân trời.
function vatLieuVienSang(mau, sang = 2, mu = 3) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau).multiplyScalar(sang) }, uMu: { value: mu } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; uniform float uMu; varying vec3 vN; varying vec3 vV;
      void main() { float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), uMu); gl_FragColor = vec4(uMau * f, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  m.tuyenTinh = true;
  return m;
}

// Vỏ kính của mặt cầu photon: viền sáng theo góc nhìn và kinh vĩ tuyến mảnh mỗi 15°, vẽ trong shader.
function vatLieuVoKinh(mau) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uMau: { value: new THREE.Color(mau) } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() { vP = normalize(position); vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uMau; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.2);
        float vi = asin(clamp(vP.z, -1.0, 1.0)) / 0.2618, kinh = atan(vP.y, vP.x) / 0.2618;
        vec2 g = abs(fract(vec2(vi, kinh) - 0.5) - 0.5) / max(fwidth(vec2(vi, kinh)), vec2(1e-4));
        float luoi = 1.0 - min(min(g.x, g.y), 1.0);
        gl_FragColor = vec4(uMau * (0.012 + 0.32 * f + 0.13 * luoi), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  m.tuyenTinh = true;
  return m;
}

export default {
  id: 'anh-sang',
  ten: 'Ánh sáng bị bẻ cong',
  moTa: 'Nhật thực 1919, trễ Shapiro, thấu kính hấp dẫn, mặt cầu photon',
  yChinh: 'Ánh sáng không có khối lượng nhưng vẫn đi theo đường trắc địa của không-thời gian cong, loại đường có $\\dd s^2 = 0$. Đi ngang qua một khối lượng, tia sáng bị bẻ về phía nó, góc lệch **gấp đôi** con số tính theo Newton vì cả thời gian lẫn không gian đều cong. Nó cũng tới chậm hơn (trễ Shapiro), tạo ra vòng Einstein, và sát lỗ đen có thể chạy vòng tròn ở 1,5 rs.',
  giaiThich: R`
    - Ánh sáng đi theo đường trắc địa kiểu ánh sáng: $\dd s^2 = 0$ ở mọi nơi dọc đường.
    - Góc lệch khi hấp dẫn yếu: $\alpha = 4GM/(c^2b) = 2r_s/b$. Sát mép Mặt Trời: 1,75″; Newton chỉ cho 0,88″. Một nửa do thời gian cong, một nửa do không gian cong.
    - Đoàn nhật thực 1919 của Dyson và Eddington đo được 1,98″ (Sobral) và 1,61″ (Príncipe).
    - Tín hiệu rađa đi sát Mặt Trời tới trễ khoảng 250 micro giây (trễ Shapiro); tàu Cassini năm 2002 kiểm điều này tới 2 phần trăm nghìn.
    - Thấu kính hấp dẫn: khi thẳng hàng, ảnh thành vòng Einstein bán kính $\theta_E = \sqrt{4GM D_{LS}/(c^2 D_L D_S)}$.
    - Mặt cầu photon ở 1,5 rs; tia có khoảng ngắm dưới $(3\sqrt3/2)\,r_s \approx 2{,}6\,r_s$ bị nuốt.`,
  mayAnh: { viTri: [-4, 17, 54], dich: [2, 0, 0], fov: 42, min: 4, max: 160 },

  baiGiang: {
    mucTieu: [
      'Nói được vì sao ánh sáng không có khối lượng vẫn bị bẻ cong, bằng ý «đường trắc địa kiểu ánh sáng».',
      'Tính được góc lệch $2r_s/b$ sát mép Mặt Trời và giải thích vì sao nó gấp đôi con số kiểu Newton.',
      'Kể được phép đo nhật thực 1919 và phép đo trễ Shapiro, kèm con số.',
      'Dùng được công thức bán kính Einstein để ước lượng cỡ vòng Einstein.',
      'Giải thích được mặt cầu photon 1,5 rs và khoảng ngắm tới hạn 2,6 rs.',
    ],
    buoc: [
      {
        ten: 'Ánh sáng cũng đi đường trắc địa',
        noiDung: R`
          Một chùm tia sáng song song đi từ trái sang, ngang qua một lỗ đen. Mỗi sợi vàng là **một tia tính từ phương trình**, không phải nét vẽ tay. Tia càng sượt gần càng bị bẻ mạnh; tia nào đi quá gần thì rơi vào (tô đỏ).

          Ở Bài 5, ánh sáng có đường thế giới nghiêng đúng 45°: khoảng không-thời gian dọc theo nó bằng 0. Trong không-thời gian cong vẫn thế, nhưng chỉ đúng **từng chút một**, tại mọi điểm dọc đường đi:

          $$ \dd s^2 = 0 $$

          Đường thỏa điều đó và «thẳng nhất» có thể là một {{đường trắc địa kiểu ánh sáng}}. Ánh sáng không cần có khối lượng mới bị bẻ: nó chỉ đi thẳng trong một không-thời gian cong.

          Nguyên lý tương đương (Bài 7) đã gợi ý điều này: trong buồng thang máy đang tăng tốc, tia sáng bắn ngang trông như cong xuống. Năm 1911 Einstein dùng đúng ý đó và tính ra góc lệch. Con số ấy chỉ bằng **một nửa** giá trị đúng; bước sau giải thích vì sao.

          > [Thử ngay] Kéo đốm xanh trên tia đang xét lên xuống để đổi chỗ tia đi qua. Phía sau, cả bầu trời sao cũng bị bẻ theo đúng góc lệch ấy: vòng sao dày đặc quanh cái bóng đen là ảnh của những ngôi sao nằm ngay sau lỗ đen. Khi kéo, tiếng ngân cao dần theo góc lệch (mỗi 90° lên một quãng tám) và trượt xuống khi tia bị nuốt; tiếng chỉ để minh hoạ.
          > [[Tắt khối lượng|m0]] [[Khối lượng vừa|m1]] [[Khối lượng lớn|m2]]

          +++ Đi sâu: mô hình tính từng tia thế nào
          Với ánh sáng trong hình học Schwarzschild, đặt $u = 1/r$. Đường đi thỏa

          $$ \frac{\dd^2u}{\dd\varphi^2} + u = \frac32\,r_s\,u^2 $$

          Không có khối lượng ($r_s = 0$) thì nghiệm là $u = \sin\varphi/b$: một đường thẳng cách tâm $b$. Vế phải là phần độ cong bẻ tia.

          Phương trình này cho cùng hình dạng đường đi với một «hạt» bay trong không gian phẳng dưới gia tốc $\vec a = -\frac32 r_s h^2\,\vec x/r^5$, với $h$ là khoảng ngắm nhân tốc độ. Mô hình giải phương trình đó bằng phương pháp Runge–Kutta bậc 4 cho từng tia, mỗi tia vài trăm bước.
          +++`,
        vao: (c) => c.cauHinh({ rsW: 1, b: 5, newton: false, ba: true, goc: 'cheo', chop: false, th: false, moTia: 1, tay: true, moi: true, troi: 0.6, chinh: true }),
        ra: (c) => c.tatTieng(),
        nut: { m0: (c) => c.cauHinh({ rsW: 0 }), m1: (c) => c.cauHinh({ rsW: 1 }), m2: (c) => c.cauHinh({ rsW: 2.2 }) },
      },
      {
        ten: 'Góc lệch: gấp đôi Newton',
        noiDung: R`
          Giờ ta nhìn thẳng vào mặt phẳng chứa chùm tia. Tia xanh là tia đang xét. Đường xám đứt nét là đường mà Newton tính, nếu coi ánh sáng là viên đạn bay với tốc độ $c$. Đường xanh mờ thẳng là đường nếu không có khối lượng.

          Khi tia đi xa khối lượng (hấp dẫn yếu), Einstein cho góc lệch

          $$ \alpha = \frac{4GM}{c^2b} = \frac{2r_s}{b} $$

          $b$ là {{khoảng ngắm}}: khoảng cách từ tâm tới đường bay ban đầu. Newton chỉ cho $r_s/b$, đúng một nửa.

          > [Ví dụ] Với $b = 8\,r_s$: công thức cho 14,3°; mô hình tính chính xác được 17,8° (gần lỗ đen công thức gần đúng hụt đi); Newton chỉ 7,2°. Với $b = 14\,r_s$: công thức 8,2°, tính chính xác 9,2°.

          Vì sao gấp đôi? Một nửa góc lệch đến từ **thời gian cong** (Bài 9), phần mà nguyên lý tương đương và Newton đều «thấy». Nửa kia đến từ **không gian cong** (Bài 11): thước đo dài ra gần khối lượng. Vật chậm không thấy nửa sau, vì nó đi trong không gian ít mà đi trong thời gian nhiều; ánh sáng thì đi trong không gian nhiều đúng bằng trong thời gian.

          > [Thử ngay] Kéo đốm xanh ở đầu tia đang xét: kéo xa ra, góc lệch nhỏ dần gần đúng theo $1/b$; kéo vào gần, con số tính chính xác vượt xa công thức.
          > [[Khoảng ngắm 4 rs|b4]] [[8 rs|b8]] [[14 rs|b14]]

          +++ Đi sâu: hai nửa của góc lệch
          Khi hấp dẫn yếu, metric gần đúng là ($\Phi = -GM/r$ là thế Newton)

          $$ \dd s^2 = -\Big(1+\frac{2\Phi}{c^2}\Big)c^2\dd t^2 + \Big(1-\frac{2\Phi}{c^2}\Big)\dd\ell^2 $$

          Với ánh sáng $\dd s = 0$, nên tốc độ «biểu kiến» theo tọa độ là $\dd\ell/\dd t \approx c\,(1 + 2\Phi/c^2)$. Giống ánh sáng đi trong kính có chiết suất $n \approx 1 - 2\Phi/c^2$: một phần $-\Phi/c^2$ từ hệ số của $\dd t^2$, một phần bằng thế từ hệ số của $\dd\ell^2$.

          Tia bị bẻ về phía chiết suất lớn, góc lệch là tích phân của độ dốc chiết suất theo phương ngang dọc đường bay:

          $$ \alpha = \int_{-\infty}^{\infty} \frac{2GMb}{c^2(b^2+x^2)^{3/2}}\,\dd x = \frac{4GM}{c^2b} $$

          Chỉ giữ hệ số của $\dd t^2$ (như Einstein năm 1911) thì được một nửa: $2GM/(c^2b)$.
          +++`,
        vao: (c) => { c.cauHinh({ rsW: 1, b: 8, newton: true, ba: false, goc: 'phang', chop: false, th: false, moTia: 0.55, tay: true, moi: true, troi: 0.5, chinh: true }); c.thu('b2'); },
        ra: (c) => c.tatTieng(),
        nut: { b4: (c) => c.cauHinh({ b: 4 }), b8: (c) => c.cauHinh({ b: 8 }), b14: (c) => c.cauHinh({ b: 14 }) },
        thuThach: {
          de: R`Kéo tia đang xét cho tới khi góc lệch tính số (ô số liệu, dòng «Einstein») đạt **20°** (sai lệch 1°). Khi ấy công thức $2r_s/b$ cho bao nhiêu, và Newton cho bao nhiêu?`,
          kiem: (c) => { const t = c.trangThai(); return t.rsW > 0.9 && t.rsW < 1.1 && t.lech != null && Math.abs(t.lech / DO - 20) <= 1; },
          giu: 0.6,
          goiY: R`Với $b = 8\,r_s$ tia lệch 17,8°; cần vào gần hơn một chút, khoảng $b \approx 7{,}3\,r_s$. Lúc đó công thức cho khoảng 15,7°, Newton chỉ khoảng 7,9°.`,
        },
      },
      {
        ten: 'Nhật thực 1919',
        noiDung: R`
          Áp công thức vào Mặt Trời. Bán kính Mặt Trời bằng khoảng **235 600 lần** bán kính Schwarzschild của nó (2,95 km). Tia sáng của một ngôi sao sượt mép Mặt Trời lệch

          $$ \alpha = \frac{2r_s}{b} = \frac{2\times 2{,}95\ \text{km}}{695\,700\ \text{km}} = 8{,}5\times10^{-6}\ \text{rad} = 1{,}75″ $$

          Chừng một phần hai nghìn độ. Newton cho 0,88″.

          Ánh sáng bị bẻ **về phía** Mặt Trời, nên ta thấy ngôi sao **lệch ra xa** Mặt Trời so với chỗ quen thuộc của nó. Muốn chụp được sao sát Mặt Trời thì phải chờ nhật thực toàn phần.

          > [Lịch sử] Ngày 29/5/1919, hai đoàn do Frank Dyson tổ chức và Arthur Eddington dẫn một đoàn, chụp các ngôi sao quanh Mặt Trời lúc nhật thực ở Sobral (Brazil) và đảo Príncipe (ngoài khơi châu Phi). Họ đem so với ảnh chụp cùng vùng trời vào ban đêm, lúc Mặt Trời đã ở chỗ khác (chụp trước hoặc sau nhật thực vài tháng). Kết quả công bố năm 1920: **1,98″ ± 0,12″** ở Sobral và **1,61″ ± 0,30″** ở Príncipe. Cả hai khớp Einstein, không khớp Newton. Einstein nổi tiếng khắp thế giới sau tin này.

          > [Lưu ý] Sai số năm 1919 còn lớn và có bộ ảnh phải bỏ vì lỗi kỹ thuật. Các phép đo về sau bằng kính thiên văn vô tuyến mới chốt chắc chắn kết quả. Trong mô hình, «khối lượng» mạnh hơn Mặt Trời rất nhiều để góc lệch đủ lớn mà nhìn.

          > [Thử ngay] [[Bật so sánh với Newton|nbat]] [[Tắt|ntat]]`,
        vao: (c) => c.cauHinh({ rsW: 0.5, b: 14, newton: true, ba: false, goc: 'phang', chop: false, th: false, moTia: 0.55, tay: true, moi: true, troi: 0.5, chinh: true }),
        ra: (c) => c.tatTieng(),
        nut: { nbat: (c) => c.cauHinh({ newton: true }), ntat: (c) => c.cauHinh({ newton: false }) },
      },
      {
        ten: 'Trễ Shapiro: ánh sáng tới muộn',
        noiDung: R`
          Các **chấm sáng** là những chớp phát cùng một lúc ở bên trái, chạy dọc các tia. Nối các chấm của cùng một lần chớp được **mặt sóng**. Xem mặt sóng khi đi qua khối lượng: phần đi gần bị **lõm lại phía sau**. Tính theo đồng hồ ở xa, ánh sáng đi qua vùng hấp dẫn mạnh mất nhiều thời gian hơn.

          Năm 1964 Irwin Shapiro đề nghị đo điều này: bắn rađa tới một hành tinh nằm gần như sau Mặt Trời và đo thời gian tiếng vọng quay về. Thời gian trễ thêm cả đi lẫn về là

          $$ \Delta t \approx \frac{4GM}{c^3}\,\ln\frac{4r_1r_2}{b^2} $$

          $r_1$, $r_2$ là khoảng cách từ Mặt Trời tới Trái Đất và tới hành tinh, $b$ là khoảng cách gần nhất của tín hiệu tới tâm Mặt Trời.

          > [Ví dụ] $4GM/c^3$ của Mặt Trời là 19,7 micro giây. Với Sao Hỏa ($r_2 = 1{,}52$ AU) và tín hiệu sượt mép Mặt Trời, logarit bằng khoảng 12,5, nên tín hiệu tới trễ khoảng **250 micro giây**.

          > [Lịch sử] Cuối thập niên 1960, nhóm của Shapiro đo được độ trễ bằng rađa dội từ Sao Kim và Sao Thủy. Năm 2002, tín hiệu vô tuyến của tàu Cassini (đang bay tới Sao Thổ) khớp tiên đoán của Einstein tới khoảng **2 phần trăm nghìn** (công bố năm 2003).

          > [Thử ngay] Nghe «máy thu» tưởng tượng ở bên phải: tiếng «tích» cao là lúc một chớp lẽ ra tới nếu không có khối lượng, tiếng trầm là lúc chớp trên tia đang xét tới thật. Tiếng trầm luôn tới sau tiếng cao; khoảng lặng giữa hai tiếng là độ trễ của tia ấy (gồm cả quãng đường vòng và trễ Shapiro; tiếng chỉ để minh hoạ, chớp trong mô hình chạy chậm đi rất nhiều).
          > [[Chớp chạy chậm|cham]] [[Dừng chớp lại|dung]] [[Chạy bình thường|chay]]

          > [Hiểu sai thường gặp] «Ánh sáng chậm lại gần Mặt Trời.» Ai đo tốc độ ánh sáng ngay cạnh mình cũng được đúng $c$. Độ trễ đến từ chỗ đồng hồ và thước gần Mặt Trời khác với ở xa.`,
        vao: (c) => c.cauHinh({ rsW: 2, b: 8, newton: false, ba: false, tocDo: 0.6, goc: 'phang', chop: true, th: false, moTia: 0.8, tay: false, moi: true, troi: 0.45, chinh: true }),
        ra: (c) => c.cauHinh({ chop: false }),
        nut: { cham: (c) => c.cauHinh({ tocDo: 0.25 }), dung: (c) => c.cauHinh({ tocDo: 0 }), chay: (c) => c.cauHinh({ tocDo: 1 }) },
      },
      {
        ten: 'Thấu kính hấp dẫn và vòng Einstein',
        noiDung: R`
          Nhìn từ phía sau khối lượng: các tia ở mọi phía đều bị bẻ vào trong và chụm lại, như qua một thấu kính. Đó là {{thấu kính hấp dẫn}}.

          Hình nhỏ **«Bầu trời người quan sát thấy»** ở mục Điều khiển mô hình cho thấy kết quả: một thiên hà xa (chấm vàng nhỏ là vị trí thật) nằm sau khối lượng hiện thành **hai ảnh**, một ở ngoài, một ở trong phía bên kia. Khi thẳng hàng, hai ảnh nhòe thành một **{{vòng Einstein}}**, bán kính

          $$ \theta_E = \sqrt{\frac{4GM}{c^2}\,\frac{D_{LS}}{D_L\,D_S}} $$

          $D_L$: khoảng cách tới thấu kính, $D_S$: tới nguồn, $D_{LS}$: từ thấu kính tới nguồn.

          > [Ví dụ] Một ngôi sao nặng bằng Mặt Trời ở cách 4 kpc, nằm trước một ngôi sao ở 8 kpc: $\theta_E \approx 1$ phần nghìn giây cung, quá nhỏ để thấy vòng, chỉ thấy ngôi sao phía sau **sáng bừng lên** vài tuần. Một thiên hà $10^{12}$ lần Mặt Trời ở 1 Gpc, nguồn ở 2 Gpc: $\theta_E \approx 2″$, đủ lớn để kính Hubble và James Webb chụp rõ vòng.

          > [Thử ngay] Ta đang đứng đúng chỗ người quan sát của hình nhỏ. Kéo đốm vàng (vị trí thật của thiên hà nền, sau lỗ đen) vào giữa: trên bầu trời phía sau, ảnh của thiên hà uốn thành hai cung rồi khép thành vòng. Tiếng ngân cao dần theo độ sáng tổng của hai ảnh; thẳng hàng thì có một tiếng chuông (tiếng chỉ để minh hoạ).
          > [[Thẳng hàng|thang]] [[Lệch 0,35 bán kính Einstein|lech]] [[Lệch xa|xa]]

          > [Lưu ý] Hình nhỏ tính bằng phương trình thấu kính của khối lượng điểm khi hấp dẫn yếu, $\beta = \theta - \theta_E^2/\theta$, đo bằng đơn vị $\theta_E$. Với nguồn lệch 0,35 $\theta_E$, hai ảnh nằm ở 1,19 và −0,84 $\theta_E$.`,
        vao: (c) => { c.cauHinh({ rsW: 1, b: 6, newton: false, ba: true, tocDo: 1, beta: 0.35, goc: 'sau', chop: false, th: true, moTia: 0.6, tay: false, moi: true, troi: 0.6, chinh: false }); c.thu('b5'); },
        ra: (c) => { c.tatTieng(); c.cauHinh({ th: false, chinh: true }); },
        nut: { thang: (c) => c.cauHinh({ beta: 0 }), lech: (c) => c.cauHinh({ beta: 0.35 }), xa: (c) => c.cauHinh({ beta: 1.2 }) },
        thuThach: {
          de: R`Tự tay **kéo thiên hà nền** (đốm vàng) vào đúng sau lỗ đen, lệch không quá 0,06 bán kính Einstein, để ảnh của nó khép thành **vòng Einstein**.`,
          kiem: (c) => { const t = c.trangThai(); return t.daKeoTH && t.rsW > 0.02 && t.beta <= 0.06; },
          giu: 0.6,
          goiY: R`Đường đứt nét màu xanh nối người quan sát với lỗ đen và kéo dài ra phía sau: đưa đốm vàng tới chỗ đường ấy cắt mặt phẳng nguồn. Hình nhỏ ở mục Điều khiển cho thấy cùng cảnh ấy.`,
        },
      },
      {
        ten: 'Mặt cầu photon: ánh sáng chạy vòng',
        noiDung: R`
          Phóng to sát lỗ đen. Hạ khoảng ngắm xuống gần **2,6 rs**: góc lệch tăng vọt. Với $b = 2{,}62\,r_s$ tia quặt 252°, gần quay ngược lại. Với $b = 2{,}6005\,r_s$ tia quấn **hơn một vòng** rồi mới thoát. Dưới $2{,}598\,r_s$ thì tia bị nuốt.

          Tia quấn quanh ở bán kính **1,5 rs**: {{mặt cầu photon}} (lưới vàng mờ). Ở đó ánh sáng có thể chạy vòng tròn. Nhưng vòng tròn ấy **không bền**, như hòn bi đặt trên đỉnh đồi: lệch một chút là tia hoặc rơi vào, hoặc văng ra.

          $$ r_{\text{photon}} = \frac32\,r_s, \qquad b_c = \frac{3\sqrt3}{2}\,r_s \approx 2{,}598\,r_s $$

          $b_c$ là khoảng ngắm tới hạn. Để ý $b_c$ lớn hơn 1,5 rs: tia đi tới từ xa bị bẻ vào trong trên đường đi, nên điểm gần nhất của nó nằm sâu hơn khoảng ngắm ban đầu.

          > [Thử ngay] Kéo đốm xanh thật chậm về phía lỗ đen và nghe tiếng ngân: gần ngưỡng, chỉ nhích một chút mà góc lệch đã vọt lên. Dùng phím mũi tên để nhích từng chút.
          > [[b = 2,62 rs|s262]] [[b = 2,6005 rs: quấn một vòng|s26]] [[b = 2,58 rs: bị nuốt|s258]]

          +++ Đi sâu: tìm 1,5 rs và $3\sqrt3/2$
          Với ánh sáng, làm như Bài 13 nhưng không có số hạng khối lượng nghỉ. Gọi $\lambda$ là tham số dọc tia:

          $$ \Big(\frac{\dd r}{\dd\lambda}\Big)^2 + L^2\,\frac{1-r_s/r}{r^2} = E^2 $$

          Hàm $W(r) = (1-r_s/r)/r^2$ đóng vai thế hiệu dụng. Đạo hàm bằng 0: $-2/r^3 + 3r_s/r^4 = 0$, nên $r = \frac32 r_s$. Giá trị đỉnh: $W = \frac{1/3}{9/4}\,r_s^{-2} = \frac{4}{27}\,r_s^{-2}$.

          Tia tới từ xa có $b = L/E$. Nó vượt qua đỉnh (và rơi vào) khi $1/b^2 > 4/(27r_s^2)$, tức $b \lt \sqrt{27/4}\,r_s = \frac{3\sqrt3}{2}\,r_s$.
          +++`,
        vao: (c) => { c.cauHinh({ rsW: 2, b: 2.62, newton: false, ba: false, tocDo: 1, goc: 'gan', chop: false, th: false, moTia: 0.45, tay: true, moi: true, troi: 0.75, chinh: true }); c.thu('b6'); },
        ra: (c) => c.tatTieng(),
        nut: { s262: (c) => c.cauHinh({ b: 2.62 }), s26: (c) => c.cauHinh({ b: 2.6005 }), s258: (c) => c.cauHinh({ b: 2.58 }) },
        thuThach: {
          de: R`Kéo tia đang xét để nó **rẽ đúng một góc vuông**: lệch 90° (sai lệch 4°). Khoảng ngắm khi ấy còn cách ngưỡng $b_c \approx 2{,}6\,r_s$ bao xa?`,
          kiem: (c) => { const t = c.trangThai(); return t.lech != null && Math.abs(t.lech / DO - 90) <= 4; },
          giu: 0.6,
          goiY: R`Từ $b = 2{,}62\,r_s$ (lệch 252°) kéo ra xa dần. Góc vuông ở khoảng $b \approx 3{,}08\,r_s$, chỉ hơn ngưỡng chừng 0,5 $r_s$, trong khi theo công thức trường yếu $2r_s/b$ phải tới $b \approx 1{,}3\,r_s$.`,
        },
      },
      {
        ten: 'Bị nuốt: vòng tới hạn và cái bóng',
        noiDung: R`
          Nhìn dọc theo chùm tia từ phía nguồn sáng. Vòng tròn đỏ ở chỗ chùm tia xuất phát có bán kính đúng $b_c \approx 2{,}6\,r_s$. **Mọi tia đi vào bên trong vòng này đều rơi vào lỗ đen**, kể cả những tia lẽ ra đi sượt qua ngoài chân trời nếu không gian phẳng. Các tia đỏ là những tia ấy.

          Diện tích của vòng là $\pi b_c^2 = 6{,}75\,\pi r_s^2$: lỗ đen «bắt» ánh sáng như một cái đĩa rộng gần **gấp bảy** tiết diện chân trời của nó.

          Giờ đảo chiều: đứng ở phía bên phải và nhìn về lỗ đen. Theo những hướng nằm trong vòng tới hạn, nhìn ngược theo tia sáng ta chỉ gặp chân trời, không gặp ngôi sao nào. Đó là **cái bóng** của lỗ đen, đường kính $2b_c = 3\sqrt3\,r_s \approx 5{,}2\,r_s$. Bài 15 dựng đúng cái bóng ấy.

          > [Thử ngay] Bầu trời phía sau cũng có cái bóng ấy: một đĩa đen rộng gần gấp ba quả cầu chân trời, viền bằng ảnh của các ngôi sao bị bẻ quanh mặt cầu photon.
          > [[Nhìn từ phía nguồn sáng|truoc]] [[Nhìn từ phía sau|sau]] [[Nhìn chéo|cheo]]`,
        vao: (c) => { c.cauHinh({ rsW: 1.6, b: 5, newton: false, ba: true, tocDo: 1, goc: 'truoc', chop: false, th: false, moTia: 1, tay: true, moi: true, troi: 0.7, chinh: true }); c.thu('b7'); },
        ra: (c) => c.tatTieng(),
        thuThach: {
          de: R`Kéo tia đang xét vào trong vòng đỏ sao cho nó **bị nuốt dù khoảng ngắm còn lớn hơn $2{,}2\,r_s$**, tức lớn hơn hẳn bán kính chân trời ($r_s$) và bán kính mặt cầu photon ($1{,}5\,r_s$).`,
          kiem: (c) => { const t = c.trangThai(); return t.lech == null && t.b > 2.2 && t.rsW > 0.02; },
          giu: 0.6,
          goiY: R`Vòng đỏ có bán kính $b_c \approx 2{,}6\,r_s$. Đặt đốm xanh vào trong vòng, gần mép: mọi khoảng ngắm từ 2,2 tới 2,59 $r_s$ đều đạt.`,
        },
        nut: { truoc: (c) => c.cauHinh({ goc: 'truoc' }), sau: (c) => c.cauHinh({ goc: 'sau' }), cheo: (c) => c.cauHinh({ goc: 'cheo' }) },
      },
      {
        ten: 'Tóm lại: ánh sáng đo độ cong',
        noiDung: R`
          Mọi hiện tượng trong bài đến từ một điều: ánh sáng đi theo đường trắc địa có $\dd s^2 = 0$ trong không-thời gian Schwarzschild.

          | Hiện tượng | Con số | Đo được |
          |---|---|---|
          | Lệch sát mép Mặt Trời | 1,75″ (Newton 0,88″) | nhật thực 1919 |
          | Trễ Shapiro | khoảng 250 µs (rađa tới Sao Hỏa) | cuối thập niên 1960; Cassini 2002 |
          | Vòng Einstein | khoảng 1″ đến vài giây cung với thiên hà | ảnh của Hubble, James Webb |
          | Mặt cầu photon | 1,5 rs; khoảng ngắm tới hạn 2,6 rs | bóng lỗ đen, EHT 2019 và 2022 (Bài 15) |

          > [Hiểu sai thường gặp] «Ánh sáng có năng lượng, mà năng lượng tương đương khối lượng, nên ánh sáng bị hút như hòn đá.» Lập luận ấy chỉ cho **một nửa** góc lệch, đúng bằng con số Newton. Nửa kia không có trong bất kỳ bức tranh «lực hút» nào: nó là độ cong của không gian.

          > [Thử ngay] [[Xem lại cả chùm tia|cheo]] [[Khối lượng lớn hơn|m2]]`,
        vao: (c) => c.cauHinh({ rsW: 1, b: 5, newton: true, ba: true, tocDo: 1, beta: 0.35, goc: 'cheo', chop: false, th: false, moTia: 1, tay: true, moi: true, troi: 0.6, chinh: true }),
        ra: (c) => c.tatTieng(),
        nut: { cheo: (c) => c.cauHinh({ rsW: 1, goc: 'cheo' }), m2: (c) => c.cauHinh({ rsW: 2.2 }) },
      },
    ],
    congThuc: [
      { ten: 'Đường đi của ánh sáng', tex: R`\dd s^2 = 0`, y: 'Ánh sáng đi theo đường trắc địa kiểu ánh sáng.' },
      { ten: 'Góc lệch khi hấp dẫn yếu', tex: R`\alpha = \frac{4GM}{c^2b} = \frac{2r_s}{b}`, y: '$b$: khoảng ngắm. Sát mép Mặt Trời: 1,75″. Newton chỉ cho một nửa.' },
      { ten: 'Trễ Shapiro (đi và về)', tex: R`\Delta t \approx \frac{4GM}{c^3}\ln\frac{4r_1r_2}{b^2}`, y: 'Với Mặt Trời $4GM/c^3 = 19{,}7$ micro giây.' },
      { ten: 'Bán kính Einstein', tex: R`\theta_E = \sqrt{\frac{4GM}{c^2}\frac{D_{LS}}{D_LD_S}}`, y: 'Bán kính góc của vòng khi nguồn, thấu kính và người quan sát thẳng hàng.' },
      { ten: 'Mặt cầu photon và khoảng ngắm tới hạn', tex: R`r = \tfrac32 r_s, \qquad b_c = \tfrac{3\sqrt3}{2}r_s \approx 2{,}6\,r_s`, y: 'Tia có $b \\lt b_c$ bị nuốt.' },
    ],
    cauHoi: [
      {
        hoi: 'Một tia sáng đi qua Mặt Trời ở khoảng cách gấp đôi bán kính Mặt Trời. Góc lệch là bao nhiêu?',
        chon: ['1,75″', '0,88″', '3,5″', '0,44″'],
        dung: 1,
        giai: R`$\alpha = 2r_s/b$ tỉ lệ nghịch với $b$: gấp đôi $b$ thì góc lệch còn một nửa, $1{,}75″/2 \approx 0{,}88″$. Trùng với con số Newton cho tia sát mép chỉ là tình cờ.`,
      },
      {
        hoi: 'Vì sao góc lệch theo Einstein gấp đôi con số tính theo Newton?',
        chon: [
          'Vì ánh sáng chạy nhanh gấp đôi viên đạn của Newton',
          'Vì cả thời gian cong lẫn không gian cong đều bẻ tia, mỗi phần một nửa',
          'Vì Mặt Trời nặng gấp đôi so với Newton tưởng',
          'Vì ánh sáng bị bẻ hai lần: lúc tới gần và lúc đi xa',
        ],
        dung: 1,
        giai: 'Phần do thời gian cong cho đúng con số Newton (và con số Einstein tính năm 1911 chỉ bằng nguyên lý tương đương). Phần do không gian cong cho thêm một lượng bằng thế. Bẻ «lúc tới và lúc đi» đã nằm sẵn trong cả hai cách tính.',
      },
      {
        hoi: 'Lúc nhật thực, một ngôi sao nhìn thấy sát mép Mặt Trời sẽ hiện ra ở đâu so với vị trí thường ngày của nó?',
        chon: ['Gần Mặt Trời hơn', 'Xa Mặt Trời hơn', 'Đúng chỗ cũ', 'Bị nhân đôi thành hai ngôi sao rõ rệt'],
        dung: 1,
        giai: 'Tia sáng bị bẻ về phía Mặt Trời. Mắt nhìn ngược theo hướng tia tới mắt, nên thấy ngôi sao ở xa Mặt Trời hơn. Ảnh thứ hai (phía bên kia) có tồn tại nhưng nằm sâu trong đĩa Mặt Trời và cực mờ.',
      },
      {
        hoi: 'Tín hiệu rađa đi sát Mặt Trời tới trễ vài trăm micro giây. Giải thích nào đúng?',
        chon: [
          'Ánh sáng bị chậm lại khi đi gần Mặt Trời, ai đo tại chỗ cũng thấy nhỏ hơn $c$',
          'Khí quyển Mặt Trời làm chậm sóng vô tuyến, thuyết tương đối không liên quan',
          'Tính theo đồng hồ ở xa, đường đi qua vùng thời gian cong và không gian cong mất nhiều thời gian hơn; tại chỗ ánh sáng vẫn đi đúng $c$',
          'Tín hiệu phải đi đường vòng dài hơn hàng chục km',
        ],
        dung: 2,
        giai: 'Người đứng yên ở đâu đo tốc độ ánh sáng tại chỗ cũng được $c$. Độ trễ là hiệu ứng của hình học: đồng hồ gần Mặt Trời chạy chậm và thước ở đó dài ra so với tọa độ của người ở xa. Phần đường vòng do bẻ cong chỉ đóng góp không đáng kể. Khí quyển Mặt Trời có ảnh hưởng thật, nhưng người ta tách nó ra bằng cách dùng hai tần số.',
      },
      {
        hoi: 'Một thấu kính hấp dẫn nặng gấp 4 lần thấu kính khác, cùng các khoảng cách. Vòng Einstein của nó lớn gấp mấy lần?',
        chon: ['4 lần', '2 lần', '16 lần', 'Bằng nhau'],
        dung: 1,
        giai: R`$\theta_E \propto \sqrt{M}$, nên khối lượng gấp 4 thì bán kính vòng gấp $\sqrt4 = 2$ lần. Vì thế đo cỡ vòng Einstein là cách cân thiên hà, kể cả phần vật chất tối không phát sáng.`,
      },
      {
        hoi: 'Một tia sáng có khoảng ngắm 2,5 rs. Nếu không gian phẳng, nó sẽ đi qua cách tâm 2,5 rs, tức ngoài chân trời. Vì sao nó vẫn bị nuốt?',
        dap: 'Khoảng ngắm tới hạn là $b_c = (3\\sqrt3/2)\\,r_s \\approx 2{,}6\\,r_s$. Trên đường tới, tia bị bẻ vào trong mỗi lúc một mạnh, nên điểm gần nhất của nó tụt sâu hơn 2,5 rs. Theo «thế hiệu dụng» của ánh sáng, tia có $b \\lt b_c$ có năng lượng cao hơn đỉnh thế ở mặt cầu photon (1,5 rs): không có gì đẩy nó quay ra, nên nó đi thẳng tới chân trời.',
      },
    ],
    docThem: [
      'J. B. Hartle, *Gravity: An Introduction to Einstein’s General Relativity* (2003), chương 9: đường đi của ánh sáng quanh khối cầu; chương 10: ánh sáng bị bẻ cong, trễ Shapiro, thấu kính hấp dẫn.',
      'F. W. Dyson, A. S. Eddington và C. Davidson, báo cáo về đoàn nhật thực 29/5/1919 (1920).',
      'E. F. Taylor, J. A. Wheeler và E. Bertschinger, *Exploring Black Holes* (bản 2): đường đi của ánh sáng quanh lỗ đen, mặt cầu photon.',
      'K. S. Thorne, *Black Holes and Time Warps* (1994): câu chuyện về các phép thử và về hình ảnh lỗ đen, viết cho người đọc phổ thông.',
    ],
    thuatNgu: [
      { vi: 'đường trắc địa kiểu ánh sáng', en: 'null geodesic', nghia: 'Đường trắc địa mà dọc theo nó $\\dd s^2 = 0$ ở mọi điểm: đường đi của ánh sáng trong không-thời gian cong.' },
      { vi: 'khoảng ngắm', en: 'impact parameter', nghia: 'Khoảng cách từ tâm khối lượng tới đường bay ban đầu (đường thẳng) của tia sáng hay của vật tới từ xa.' },
      { vi: 'trễ Shapiro', en: 'Shapiro time delay', nghia: 'Tín hiệu đi qua gần một khối lượng tới muộn hơn, tính theo đồng hồ ở xa. Sát Mặt Trời cỡ vài trăm micro giây.' },
      { vi: 'vòng Einstein', en: 'Einstein ring', nghia: 'Ảnh hình vòng của một nguồn sáng nằm thẳng hàng phía sau một thấu kính hấp dẫn.' },
    ],
  },

  conSo: [
    '**1,75″**: góc lệch của tia sáng sượt mép Mặt Trời, khoảng 1/2000 độ. Newton: 0,88″.',
    '**29/5/1919**: nhật thực ở Sobral và Príncipe; đo được 1,98″ ± 0,12″ và 1,61″ ± 0,30″.',
    '**Khoảng 250 micro giây**: tín hiệu rađa tới Sao Hỏa đi sát Mặt Trời tới trễ chừng ấy (cả đi lẫn về).',
    '**2,6 rs** (chính xác $3\\sqrt3/2$): khoảng ngắm tới hạn. **1,5 rs**: mặt cầu photon.',
  ],
  hieuDung: '**Ánh sáng không «chậm lại» tại chỗ.** Ai đo tốc độ ánh sáng ngay cạnh mình cũng được đúng $c$, kể cả ở sát lỗ đen. Độ trễ Shapiro có là vì đồng hồ và thước ở vùng hấp dẫn mạnh khác với ở xa. Và ánh sáng bị bẻ không phải vì nó «có trọng lượng»: nó đi thẳng trong không-thời gian cong.',
  hinh: { quang: 0.45, nguong: 0.85 },
  nguon: 'Nhật thực 1919: Dyson, Eddington và Davidson 1920. Đề xuất trễ Shapiro: Shapiro 1964. Phép đo Cassini: Bertotti, Iess và Tortora 2003, Nature 425, 374. Hằng số: CODATA 2018, IAU 2012. Các tia trong mô hình là nghiệm số của phương trình đường trắc địa kiểu ánh sáng Schwarzschild.',

  tao(app) {
    const scene = new THREE.Scene();
    const am = app.am, tt = app.tt;

    // ----- Bầu trời bị bẻ cong: vẽ bầu trời thật vào một ảnh lập phương, rồi mỗi điểm ảnh nhìn qua lỗ đen -----
    const troiGoc = new THREE.Scene();
    const nenGoc = taoNenSao({ soSao: 7000, hat: 33, doSang: 0.75 });
    troiGoc.add(nenGoc);
    // Trong ảnh lập phương một điểm ảnh rộng gấp đôi trên màn hình: hạ cỡ điểm sao cho đúng cỡ góc.
    nenGoc.traverse((o) => {
      if (!o.isPoints) return;
      const cu = o.onBeforeRender;
      o.onBeforeRender = (...a) => { cu?.(...a); if (o.material.uniforms?.uTiLe) o.material.uniforms.uTiLe.value = 0.6; };
    });
    const anhTroi = new THREE.WebGLCubeRenderTarget(1024, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const mayTroi = new THREE.CubeCamera(0.1, 10, anhTroi);
    troiGoc.add(mayTroi);
    try { mayTroi.update(app.renderer, troiGoc); } catch (e) { console.error(e); }
    const bang = bangGocLech();
    const uTroi = {
      uTroi: { value: anhTroi.texture }, uRs: { value: 1 }, uBang: { value: bang }, uBC: { value: B_TOI_HAN },
      uTH: { value: 0 }, uS: { value: new THREE.Vector3() }, uS0: { value: new THREE.Vector3() }, uN: { value: new THREE.Vector3(1, 0, 0) },
      uE1: { value: new THREE.Vector3(0, 0, 1) }, uE2: { value: new THREE.Vector3(0, 1, 0) }, uRho: { value: 1 }, uSangTroi: { value: 0.6 },
    };
    const matTroi = new THREE.ShaderMaterial({
      uniforms: uTroi,
      vertexShader: /* glsl */ `
        varying vec3 vHuong;
        void main() {
          vHuong = position;
          vec4 q = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
          gl_Position = vec4(q.xy, q.w * 0.99999, q.w);
        }`,
      fragmentShader: /* glsl */ `
        uniform samplerCube uTroi;
        uniform float uRs, uBC, uTH, uRho, uSangTroi;
        uniform float uBang[${SO_O_BANG}];
        uniform vec3 uS, uS0, uN, uE1, uE2;
        varying vec3 vHuong;
        float gocLech(float bn) {
          float w = -log(max(1.0 - uBC / bn, 1e-7));
          float k = w / ${W_MAX.toFixed(1)} * ${(SO_O_BANG - 1).toFixed(1)};
          if (k >= ${(SO_O_BANG - 1).toFixed(1)}) return uBang[${SO_O_BANG - 1}] + (w - ${W_MAX.toFixed(1)});
          int i = int(floor(k));
          return mix(uBang[i], uBang[i + 1], k - float(i));
        }
        // Thiên hà nền xoắn hai nhánh, nghiêng 50°: l là toạ độ trên mặt phẳng nguồn, đơn vị bán kính thiên hà.
        vec3 thienHa(vec2 l) {
          l.y /= 0.64;
          float r = length(l);
          if (r > 1.6) return vec3(0.0);
          float th = atan(l.y, l.x);
          float nhanh = 0.5 + 0.5 * cos(2.0 * th - 5.5 * log(r + 0.08));
          float dia = exp(-r / 0.32) * (0.35 + 1.1 * nhanh * smoothstep(0.08, 0.3, r));
          float loi = exp(-r * r / 0.012);
          vec3 c = vec3(0.62, 0.74, 1.0) * dia * 1.25 + vec3(1.0, 0.86, 0.62) * loi * 3.0;
          c += vec3(1.0, 0.45, 0.6) * pow(nhanh, 8.0) * exp(-r / 0.5) * 0.9 * smoothstep(0.15, 0.4, r);
          return c * smoothstep(1.6, 1.1, r);
        }
        void main() {
          vec3 d = normalize(vHuong);
          vec3 P = cameraPosition;
          vec3 d2 = d;
          vec3 c0 = P;
          if (uRs > 1e-4) {
            float x0 = dot(P, d);
            c0 = P - x0 * d;
            float b = length(c0);
            float bn = b / uRs;
            if (bn < uBC && x0 < 0.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }   // bị nuốt: bóng đen
            float a = gocLech(max(bn, uBC * 1.0000001)) * 0.5 * (1.0 - x0 / sqrt(x0 * x0 + b * b));
            vec3 h = c0 / max(b, 1e-6);
            d2 = d * cos(a) - h * sin(a);
          }
          vec3 col = textureCube(uTroi, d2).rgb * uSangTroi;
          if (uTH > 0.5) {
            float dn = dot(d2, uN);
            if (dn < -1e-4) {
              float t = dot(uS0 - c0, uN) / dn;
              if (t > 0.0) { vec3 q = c0 + t * d2 - uS; col += thienHa(vec2(dot(q, uE1), dot(q, uE2)) / uRho); }
            }
          }
          gl_FragColor = vec4(col, 1.0);
        }`,
      side: THREE.BackSide, depthTest: false, depthWrite: false,
    });
    matTroi.tuyenTinh = true;
    const troi = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), matTroi);
    troi.frustumCulled = false;
    troi.renderOrder = -1000;
    scene.add(troi);

    // ----- Lỗ đen: chân trời (cầu đen, viền cam), mặt cầu photon (vỏ kính vàng có kinh vĩ tuyến), vòng tới hạn -----
    const loDen = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    const vien = new THREE.Mesh(new THREE.SphereGeometry(1.025, 64, 32), vatLieuVienSang(0xff7a4a, 1.3, 5));
    const photon = new THREE.Mesh(new THREE.SphereGeometry(1.5, 72, 36), vatLieuVoKinh(0xffc65c));
    const vongPhoton = new DuongDay(161, { mau: 0xffc65c, rong: 1.8, doMo: 0.85, sang: 1.15 });
    for (let i = 0; i <= 160; i++) { const a = (i / 160) * 2 * Math.PI; vongPhoton.dat(i, 1.5 * Math.cos(a), 1.5 * Math.sin(a), 0); }
    vongPhoton.xong(161);
    const nhomLD = new THREE.Group();
    nhomLD.add(loDen, vien, photon, vongPhoton.line);
    scene.add(nhomLD);
    // vòng tới hạn ở chỗ chùm tia xuất phát: đĩa đỏ mờ có viền sáng
    const vongToiHan = new DuongDay(161, { mau: 0xff6a4a, rong: 2.4, doMo: 0.95, sang: 1.6, quang: 0.12 });
    for (let i = 0; i <= 160; i++) { const a = (i / 160) * 2 * Math.PI; vongToiHan.dat(i, 0, Math.cos(a), Math.sin(a)); }
    vongToiHan.xong(161);
    const diaToiHan = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshBasicMaterial({ color: 0xff6a4a, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
    diaToiHan.rotation.y = Math.PI / 2;
    const nhomToiHan = new THREE.Group();
    nhomToiHan.add(vongToiHan.line, diaToiHan);
    nhomToiHan.position.x = X0;
    scene.add(nhomToiHan);
    const nhanLoDen = taoNhan(chuCanh("canh.chan-troi-su-kien", "Chân trời sự kiện"), 'mo', { giua: true });
    const nhanPhoton = taoNhan(chuCanh("canh.mat-cau-photon-1-5-r-s", "Mặt cầu photon · 1,5 r<sub>s</sub>"), 'mo');
    const nhanToiHan = taoNhan(chuCanh("canh.tia-di-trong-vong-nay-se-bi-nuot", "Tia đi trong vòng này sẽ bị nuốt<small>khoảng ngắm dưới 2,6 r<sub>s</sub></small>"), 'hong');
    scene.add(nhanLoDen, nhanPhoton, nhanToiHan);

    // ----- Chùm tia: tia phụ mờ, lùi về sau; tia đang xét sáng, dày, có quầng -----
    const dsTia = [];
    const themTia = (y, z, phang) => {
      const d = new DuongDay(N_DIEM, { mau: MAU_TIA, rong: phang ? 1.1 : 0.9, doMo: phang ? 0.24 : 0.07 });
      d.line.renderOrder = 1;
      scene.add(d.line);
      dsTia.push({ y, z, phang, d, tg: new Float32Array(N_DIEM), n: 0, bat: false });
    };
    for (let i = -20; i <= 20; i++) themTia(i * 0.65, 0, true);
    for (const [Rv, m] of [[3.2, 10], [5.6, 12], [8.6, 14]]) {
      for (let k = 0; k < m; k++) { const a = ((k + 0.5) / m) * 2 * Math.PI; themTia(Rv * Math.cos(a), Rv * Math.sin(a), false); }
    }
    const tiaChon = new DuongDay(N_DIEM, { mau: 0x7fd6ff, rong: 3.4, doMo: 1, sang: 1.9, quang: 0.16 });
    tiaChon.line.renderOrder = 3;
    const tiaNewton = new DuongDay(N_DIEM, { mau: 0xc4c7d2, rong: 1.6, doMo: 0.85, cong: false, net: [0.7, 0.5] });
    const tiaThang = new DuongDay(2, { mau: 0x7fcaff, rong: 1.0, doMo: 0.35, cong: false, net: [0.5, 0.5] });
    const nhanChon = taoNhan(chuCanh("canh.tia-dang-xet", "tia đang xét"), 'xanh');
    const nhanNewton = taoNhan(chuCanh("canh.theo-newton", "theo Newton"), 'mo');
    const nhanThang = taoNhan(chuCanh("canh.neu-khong-co-khoi-luong", "nếu không có khối lượng"), 'mo tran');
    const nhanLech = taoNhan('', 'xanh dam');
    scene.add(tiaChon.line, tiaNewton.line, tiaThang.line, nhanChon, nhanNewton, nhanThang, nhanLech);
    const tgChon = new Float32Array(N_DIEM);

    // ----- Chớp sáng và mặt sóng (bước trễ Shapiro) -----
    const SO_CHOP = 7, KHOANG_CHOP = 11;
    const geoChop = new THREE.BufferGeometry();
    const vtChop = new Float32Array(dsTia.length * SO_CHOP * 3);
    geoChop.setAttribute('position', new THREE.BufferAttribute(vtChop, 3));
    const diemChop = new THREE.Points(geoChop, new THREE.PointsMaterial({ size: 0.42, map: texDom(), color: new THREE.Color(0xfff3c8).multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    diemChop.frustumCulled = false;
    scene.add(diemChop);
    const matSong = Array.from({ length: SO_CHOP }, () => { const d = new DuongDay(42, { mau: 0xfff3c8, rong: 1.8, doMo: 0.6, sang: 1.3 }); scene.add(d.line); return d; });

    // ----- Thiên hà nền và người quan sát (bước thấu kính hấp dẫn) -----
    const O = new THREE.Vector3(...GOC.sau[0]);
    const nTruc = O.clone().normalize();                       // từ thấu kính về phía người quan sát
    const DL = O.length();
    const S0 = nTruc.clone().multiplyScalar(-D_LS);            // tâm mặt phẳng nguồn, sau lỗ đen
    const e1 = new THREE.Vector3().crossVectors(nTruc.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();   // bên phải màn hình của người quan sát
    const e2 = new THREE.Vector3().crossVectors(e1, nTruc.clone().negate()).normalize();                           // phía trên màn hình
    uTroi.uN.value.copy(nTruc); uTroi.uS0.value.copy(S0); uTroi.uE1.value.copy(e1); uTroi.uE2.value.copy(e2);
    const viTriTH = new THREE.Vector3();
    const vongTH = new DuongDay(97, { mau: 0xf3c66f, rong: 1.4, doMo: 0.7, cong: false, net: [0.35, 0.3] });
    const nhanTH = taoNhan(chuCanh("canh.vi-tri-that-cua-thien-ha-nen-ta", "vị trí thật của thiên hà nền<small>ta chỉ thấy ảnh của nó qua thấu kính</small>"), 'vang');
    const quanSat = taoDom(new THREE.Color(0x7fcaff).multiplyScalar(2), 1.2);
    quanSat.position.copy(O);
    const nhanQS = taoNhan(chuCanh("canh.nguoi-quan-sat-cua-hinh-nho", "người quan sát của hình nhỏ"), 'xanh');
    nhanQS.position.copy(O).add(new THREE.Vector3(0, 1.2, 0));
    const trucQS = new DuongDay(2, { mau: 0x7fcaff, rong: 1, doMo: 0.3, cong: false, net: [0.6, 0.6] });
    trucQS.dat(0, O.x, O.y, O.z); trucQS.dat(1, S0.x, S0.y, S0.z); trucQS.xong(2);
    const nhomTH = new THREE.Group();
    nhomTH.add(vongTH.line, nhanTH, quanSat, nhanQS, trucQS.line);
    scene.add(nhomTH);

    // ----- Trạng thái -----
    let rsW = 1.0;
    let bChon = 5;           // khoảng ngắm của tia đang xét, tính theo rs
    let hien3D = true, hienNewton = true;
    let tocDo = 1;
    let tau = 0;
    let lech = null;
    let coChop = false, coTH = false;
    let betaX = 0.35, betaY = 0;
    let daKeoTH = false, daKeoTia = false;
    let xTay = -22;
    let moTia = 1;           // độ đậm của các tia phụ (bước cần nhìn kỹ tia đang xét thì hạ xuống)
    let thetaE = 0, rhoTH = 1;
    let coChinh = true;      // hiện tia đang xét (bước thấu kính tạm ẩn cho khỏi rối)

    function dungTia() {
      for (const t of dsTia) {
        const kq = lanTia(t.y, t.z, rsW, t.d.diem, t.tg);
        t.n = kq.n; t.bat = kq.bat;
        t.d.datMau(kq.bat ? 0xff6a4a : MAU_TIA);
        t.d.xong(kq.n);
        t.d.line.visible = t.phang || hien3D;
        t.d.datDoMo((t.phang ? 0.24 : 0.07) * moTia);
      }
      const cs = Math.max(0.001, rsW);
      nhomLD.scale.setScalar(cs);
      nhomLD.visible = rsW > 0.02;
      nhomToiHan.visible = rsW > 0.02 && !coTH;
      nhanLoDen.visible = nhanPhoton.visible = rsW > 0.3;
      nhanToiHan.visible = rsW > 0.3 && !coTH;
      nhomToiHan.scale.setScalar(B_TOI_HAN * cs);
      nhomToiHan.scale.x = 1;
      nhanLoDen.position.set(0, -cs - 0.7, 0);
      nhanPhoton.position.set(1.06 * cs, 1.06 * cs, 0);
      nhanToiHan.position.set(X0, -B_TOI_HAN * cs - 0.6, 0);
      uTroi.uRs.value = rsW;
      dungThienHa();
      dungTiaChon();
    }
    function dungTiaChon() {
      const y = bChon * rsW;
      const kq = lanTia(y, 0, rsW, tiaChon.diem, tgChon);
      tiaChon.xong(kq.n);
      tiaChon.datMau(kq.bat ? 0xff8a73 : 0x7fd6ff);
      tiaThang.dat(0, X0, y, 0); tiaThang.dat(1, BIEN, y, 0); tiaThang.xong(2);
      nhanChon.position.set(X0 + 4, y + 0.5, 0);
      nhanThang.position.set(18, y + 0.45, 0);
      nhanThang.visible = rsW > 1e-4 && kq.bat === false;
      lech = rsW > 1e-4 ? gocLechAnhSang(y / rsW, { xa: 400, heSo: 0.02 }) : 0;
      // nhãn góc lệch đặt ở đoạn tia đi ra, chỗ x ≈ 14
      let k = kq.n - 1;
      for (let i = 1; i < kq.n; i++) if (tiaChon.diem[i * 3] > 14) { k = i; break; }
      nhanLech.position.set(tiaChon.diem[k * 3], tiaChon.diem[k * 3 + 1], tiaChon.diem[k * 3 + 2]);
      nhanLech.datChu(rsW < 1e-4 ? chuCanh("canh.di-thang", "đi thẳng") : lech == null ? chuCanh("canh.bi-nuot", "bị nuốt") : chuCanh("canh.lech", "lệch {0}°", [so(lech / DO, lech / DO < 10 ? 1 : 0)]));
      tiaChon.line.visible = tiaThang.line.visible = nhanChon.visible = nhanLech.visible = coChinh;
      if (!coChinh) nhanThang.visible = false;
      const coNewton = hienNewton && rsW > 1e-4 && coChinh;
      tiaNewton.line.visible = nhanNewton.visible = coNewton;
      if (coNewton) {
        const n = lanNewton(y, rsW, tiaNewton.diem);
        tiaNewton.xong(n);
        let j = Math.max(0, n - 1);
        for (let i = 1; i < n; i++) if (tiaNewton.diem[i * 3] > 22) { j = i; break; }
        nhanNewton.position.set(tiaNewton.diem[j * 3], tiaNewton.diem[j * 3 + 1] - 0.4, 0);
      }
      if (!tt.dangKeo) tayTia.dat([xTay, yTaiX(tiaChon.diem, kq.n, xTay, y), 0]);
    }
    // Thiên hà nền: vị trí thật trên mặt phẳng nguồn, bán kính Einstein, cỡ thiên hà theo θ_E.
    function dungThienHa() {
      thetaE = banKinhEinstein(Math.max(rsW, 1e-6), DL, D_LS);
      const k = thetaE * (DL + D_LS);                   // 1 bán kính Einstein trên mặt phẳng nguồn (đơn vị cảnh)
      rhoTH = R_TH * k;
      viTriTH.copy(S0).addScaledVector(e1, betaX * k).addScaledVector(e2, betaY * k);
      uTroi.uS.value.copy(viTriTH);
      uTroi.uRho.value = rhoTH;
      uTroi.uTH.value = coTH && rsW > 1e-4 ? 1 : 0;
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * 2 * Math.PI;
        const p = viTriTH.clone().addScaledVector(e1, Math.cos(a) * rhoTH).addScaledVector(e2, Math.sin(a) * rhoTH * 0.64);
        vongTH.dat(i, p.x, p.y, p.z);
      }
      vongTH.xong(97);
      nhanTH.position.copy(viTriTH).addScaledVector(e2, -rhoTH - 0.6);
      nhomTH.visible = coTH;
      if (!tt.dangKeo) tayTH.dat(viTriTH);
      tayTH.an(!coTH);
    }

    // ----- Tương tác -----
    // Tay nắm của tia đang xét: nằm ngay trên tia, ở hoành độ xTay; kéo lên xuống để đổi khoảng ngắm b.
    let giongTia = null, batTruoc = false;
    const tayTia = tt.tayNam({
      viTri: [xTay, bChon * rsW, 0], mau: 0x7fd6ff, co: 0.32, ten: chuCanh("canh.tia-dang-xet-7fde60", "Tia đang xét"),
      moTa: () => chuCanh("canh.keo-len-xuong-de-doi-khoang-ngam-b", "Kéo lên xuống để đổi khoảng ngắm.<br>b = <b>{0} r<sub>s</sub></b> · {1}", [so(bChon, bChon < 2.7 ? 4 : 2), lech == null ? chuCanh("canh.bi-nuot", "bị nuốt") : chuCanh("canh.lech", "lệch {0}°", [so(lech / DO, 1)])]),
      rangBuoc: { kieu: 'ham', chieu: (ray) => ganDuongDung(ray, xTay) },
      nhan: chuCanh("canh.keo-tia-de-doi-khoang-ngam", "Kéo tia để đổi khoảng ngắm"),
      khiNam: () => { if (am.sanSang) giongTia = am.giong({ dang: 'mem', tanSo: 220, doTo: 0 }); batTruoc = lech == null; },
      khiKeo: (p) => {
        // tìm b sao cho tia đi qua đúng chỗ con trỏ ở hoành độ xTay (vài bước lặp, tia gần như thẳng ở đó)
        const yDich = p.y;
        let b = kep(yDich / Math.max(rsW, 1e-6), B_MIN, B_MAX);
        for (let i = 0; i < 4 && rsW > 1e-4; i++) {
          const kq = lanTia(b * rsW, 0, rsW, _tam.diem, _tam.tg, xTay + 0.5);
          b = kep(b + (yDich - yTaiX(_tam.diem, kq.n, xTay, b * rsW)) / rsW, B_MIN, B_MAX);
        }
        bChon = b; dkB.dat(bChon); daKeoTia = true;
        dungTiaChon();
        tayTia.dat([xTay, yTaiX(tiaChon.diem, tiaChon.n, xTay, bChon * rsW), 0]);
        amTia();
      },
      khiTha: () => { giongTia?.tat(0.3); giongTia = null; },
    });
    // Âm thanh của tia: cao độ theo góc lệch (mỗi 90° lên một quãng tám, chỉ để minh hoạ); bị nuốt thì một tiếng trượt xuống.
    function amTia() {
      const bat = lech == null;
      if (bat && !batTruoc) am.quet({ tu: 520, den: 70, giay: 0.7, doTo: 0.4, dang: 'mem' });
      batTruoc = bat;
      if (!giongTia) return;
      if (bat) giongTia.dat({ doTo: 0 }, 0.08);
      else giongTia.dat({ tanSo: Math.min(1760, 220 * Math.pow(2, (lech / DO) / 90)), doTo: 0.28, lech: 0.2 });
    }

    // Tay nắm thiên hà nền: trượt trên mặt phẳng nguồn (vuông góc với trục người quan sát – lỗ đen).
    let giongTH = null, thangHang = false;
    const tayTH = tt.tayNam({
      viTri: S0.clone(), mau: 0xf3c66f, co: 0.5, ten: chuCanh("canh.thien-ha-nen-vi-tri-that", "Thiên hà nền (vị trí thật)"),
      moTa: () => chuCanh("canh.keo-tren-mat-phang-sau-lo-den-lech", "Kéo trên mặt phẳng sau lỗ đen.<br>Lệch khỏi đường ngắm: <b>{0} θ<sub>E</sub></b>", [so(Math.hypot(betaX, betaY), 2)]),
      rangBuoc: { kieu: 'mat-phang', phap: nTruc.toArray(), qua: S0.toArray() },
      nhan: chuCanh("canh.keo-thien-ha-ra-sau-lo-den", "Kéo thiên hà ra sau lỗ đen"),
      khiNam: () => { if (am.sanSang) giongTH = am.giong({ dang: 'mem', tanSo: 196, doTo: 0 }); },
      khiKeo: (p) => {
        const k = thetaE * (DL + D_LS);
        const q = p.clone().sub(S0);
        betaX = kep(q.dot(e1) / k, -2.4, 2.4); betaY = kep(q.dot(e2) / k, -2.4, 2.4);
        daKeoTH = true;
        dkBeta.dat(Math.sign(betaX || 1) * Math.min(2, Math.hypot(betaX, betaY)));
        dungThienHa(); veThauKinh();
        amTH();
      },
      khiTha: () => { giongTH?.tat(0.4); giongTH = null; },
    });
    // Âm thanh của thấu kính: cao độ theo độ phóng đại tổng của hai ảnh; thẳng hàng thì một tiếng chuông.
    function amTH() {
      const b = Math.hypot(betaX, betaY);
      if (b < 0.06 && !thangHang) { thangHang = true; am.not({ tanSo: 1174.66, dai: 2.2, doTo: 0.45, dang: 'chuong' }); }
      if (b > 0.15) thangHang = false;
      giongTH?.dat({ tanSo: Math.min(880, 196 * Math.pow(doPhongDai(b), 0.5)), doTo: 0.22 });
    }

    tt.them(nhomLD, {
      ten: chuCanh("canh.lo-den", "Lỗ đen"), mau: 0xff8a73,
      moTa: () => chuCanh("canh.chan-troi-su-kien-r-s-don-vi", "Chân trời sự kiện: r<sub>s</sub> = {0} đơn vị trên hình<br>Mặt cầu photon: 1,5 r<sub>s</sub><br>Bóng đen trên bầu trời phía sau: khoảng ngắm dưới {1} r<sub>s</sub>", [so(rsW, 2), so(B_TOI_HAN, 3)]),
    });

    // ----- Điều khiển -----
    const bangDK = app.bang;
    const dkM = bangDK.thanhTruot({
      nhan: chuCanh("canh.khoi-luong-ban-kinh-chan-troi-tren-hinh", "Khối lượng (bán kính chân trời trên hình)"), min: 0, max: 2.6, buoc: 0.02, giaTri: rsW,
      hienThi: (v) => (v === 0 ? chuCanh("canh.khong-co-khoi-luong", "không có khối lượng") : chuCanh("canh.don-vi", "{0} đơn vị", [so(v, 2)])),
      khiDoi: (v) => { rsW = v; dungTia(); veThauKinh(); },
    });
    const dkB = bangDK.thanhTruot({
      nhan: chuCanh("canh.tia-dang-xet-khoang-ngam-b", "Tia đang xét: khoảng ngắm <span class=\"toan\">b</span>"), min: 1, max: 14, buoc: 0.0005, giaTri: bChon,
      hienThi: (v) => `${so(v, v < 2.7 ? 4 : 2)} r<sub>s</sub>`,
      khiDoi: (v) => { bChon = v; dungTiaChon(); },
    });
    bangDK.nut([
      { nhan: chuCanh("canh.sat-nguong-bi-nuot", "Sát ngưỡng bị nuốt"), khiBam: () => cauHinh({ b: 2.62 }) },
      { nhan: chuCanh("canh.quan-mot-vong", "Quấn một vòng"), khiBam: () => cauHinh({ b: 2.6005 }) },
    ]);
    const dkNewton = bangDK.congTac({ nhan: chuCanh("canh.so-voi-newton-duong-xam", "So với Newton (đường xám)"), giaTri: true, khiDoi: (v) => { hienNewton = v; dungTiaChon(); } });
    const dkBa = bangDK.congTac({ nhan: chuCanh("canh.chum-tia-ba-chieu", "Chùm tia ba chiều"), giaTri: true, khiDoi: (v) => { hien3D = v; dungTia(); } });
    const dkTocDo = bangDK.thanhTruot({
      nhan: chuCanh("canh.toc-do-chop-sang", "Tốc độ chớp sáng"), min: 0, max: 3, buoc: 0.05, giaTri: tocDo,
      hienThi: (v) => (v === 0 ? chuCanh("canh.dung-yen", "đứng yên") : `×${so(v, 2)}`),
      khiDoi: (v) => { tocDo = v; },
    });

    // Thấu kính hấp dẫn: người quan sát thấy gì khi một nguồn sáng nằm sau khối lượng
    bangDK.chuThich(chuCanh("canh.thau-kinh-hap-dan-mot-thien-ha-xa", "<b>Thấu kính hấp dẫn.</b> Một thiên hà xa (chấm vàng nhỏ là vị trí thật) nằm phía sau khối lượng. Kéo để dời nó (thanh trượt, hoặc kéo thiên hà ngay trong cảnh ở bước 5): khi thẳng hàng, ảnh của nó thành một vòng tròn."));
    const dt = bangDK.doThi(170);
    function veThauKinh() {
      const { ctx: g, rong, cao } = dt;
      g.clearRect(0, 0, rong, cao);
      const cx = rong / 2, cy = cao / 2, tl = 36;           // 1 bán kính Einstein = 36 điểm ảnh
      const anh = g.createImageData(Math.round(rong), Math.round(cao));
      const W = anh.width, H = anh.height, rNguon = R_TH;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const tx = (i - cx) / tl, ty = (cy - j) / tl, t2 = tx * tx + ty * ty + 1e-9;
        // phương trình thấu kính điểm: β = θ − θ/|θ|² (đơn vị bán kính Einstein)
        const bx = tx - tx / t2 - betaX, by = ty - ty / t2 - betaY;
        const d = Math.hypot(bx, by) / rNguon;
        const sang = d < 1 ? 1 - 0.6 * d * d : Math.exp(-(d - 1) * 5) * 0.4;
        const k = (j * W + i) * 4;
        anh.data[k] = 255 * Math.min(1, sang * 1.0); anh.data[k + 1] = 255 * Math.min(1, sang * 0.85); anh.data[k + 2] = 255 * Math.min(1, sang * 0.6); anh.data[k + 3] = 255;
      }
      const tam = document.createElement('canvas');
      tam.width = W; tam.height = H;
      tam.getContext('2d').putImageData(anh, 0, 0);
      g.drawImage(tam, 0, 0, rong, cao);
      g.setLineDash([3, 4]); g.strokeStyle = 'rgba(127,202,255,0.5)'; g.lineWidth = 1;
      g.beginPath(); g.arc(cx, cy, tl, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, 5, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = MAU.do; g.beginPath(); g.arc(cx, cy, 5, 0, 2 * Math.PI); g.stroke();
      g.fillStyle = MAU.vang; g.beginPath(); g.arc(cx + betaX * tl, cy - betaY * tl, 2.5, 0, 2 * Math.PI); g.fill();
      g.font = '10.5px -apple-system, sans-serif'; g.fillStyle = MAU.mo; g.textAlign = 'left';
      g.fillText(chuCanh("canh.bau-troi-nguoi-quan-sat-thay", "Bầu trời người quan sát thấy"), 8, 14);
      g.fillStyle = 'rgba(127,202,255,0.8)'; g.fillText(chuCanh("canh.vong-einstein", "vòng Einstein"), cx + tl * 0.75, cy - tl * 0.8);
    }
    const dkBeta = bangDK.thanhTruot({
      nhan: chuCanh("canh.nguon-sang-lech-khoi-duong-ngam", "Nguồn sáng lệch khỏi đường ngắm"), min: -2, max: 2, buoc: 0.01, giaTri: betaX,
      hienThi: (v) => (Math.abs(v) < 0.006 ? chuCanh("canh.thang-hang", "thẳng hàng") : chuCanh("canh.ban-kinh-einstein", "{0} bán kính Einstein", [so(Math.abs(v), 2)])),
      khiDoi: (v) => { betaX = v; betaY = 0; dungThienHa(); veThauKinh(); },
    });

    // Các bước của bài giảng gọi hàm này: { rsW, b, newton, ba, tocDo, beta, goc, chop, th, moTia }.
    function cauHinh(o = {}) {
      let tia = false, chon = false;
      if (o.rsW != null && o.rsW !== rsW) { rsW = o.rsW; dkM.dat(rsW); tia = true; }
      if (o.ba != null && o.ba !== hien3D) { hien3D = o.ba; dkBa.dat(hien3D); tia = true; }
      if (o.moTia != null && o.moTia !== moTia) { moTia = o.moTia; tia = true; }
      if (o.b != null) { bChon = o.b; dkB.dat(bChon); chon = true; }
      if (o.newton != null) { hienNewton = o.newton; dkNewton.dat(hienNewton); chon = true; }
      if (o.tocDo != null) { tocDo = o.tocDo; dkTocDo.dat(tocDo); }
      if (o.beta != null) { betaX = o.beta; betaY = 0; dkBeta.dat(betaX); veThauKinh(); }
      if (o.chop != null) coChop = o.chop;
      if (o.th != null && o.th !== coTH) { coTH = o.th; tia = true; }
      if (o.goc) { xTay = X_TAY[o.goc] ?? xTay; chon = true; }
      if (o.tay != null) tayTia.an(!o.tay);
      if (o.troi != null) uTroi.uSangTroi.value = o.troi;
      if (o.chinh != null) { coChinh = o.chinh; chon = true; }
      if (o.moi) { daKeoTH = false; daKeoTia = false; thangHang = Math.hypot(betaX, betaY) < 0.06; }
      diemChop.visible = coChop;
      for (const m of matSong) m.line.visible = coChop;
      if (tia) dungTia(); else { dungThienHa(); if (chon) dungTiaChon(); }
      if (o.beta != null || o.th != null) dungThienHa();
      if (o.goc) app.bayToi(GOC[o.goc][0], GOC[o.goc][1], 1.4);
    }

    // vị trí của chớp sáng trên một tia ở thời điểm t (nội suy theo thời gian tọa độ)
    function viTriChop(diem, tg, n, t, out, k) {
      if (t < 0 || n < 2 || t > tg[n - 1]) return false;
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tg[m] <= t) lo = m; else hi = m; }
      const u = (t - tg[lo]) / Math.max(1e-9, tg[hi] - tg[lo]);
      out[k] = diem[lo * 3] + u * (diem[hi * 3] - diem[lo * 3]);
      out[k + 1] = diem[lo * 3 + 1] + u * (diem[hi * 3 + 1] - diem[lo * 3 + 1]);
      out[k + 2] = diem[lo * 3 + 2] + u * (diem[hi * 3 + 2] - diem[lo * 3 + 2]);
      return true;
    }
    // thời gian tọa độ lúc tia tới hoành độ x (để nghe chớp sáng tới «máy thu»)
    function tgTaiX(diem, tg, n, x) {
      for (let i = 1; i < n; i++) if (diem[i * 3] >= x) { const u = (x - diem[i * 3 - 3]) / Math.max(1e-9, diem[i * 3] - diem[i * 3 - 3]); return tg[i - 1] + u * (tg[i] - tg[i - 1]); }
      return null;
    }
    const X_THU = 24;        // «máy thu» tưởng tượng ở hoành độ này: tiếng tích khi chớp sáng tới
    let demXa = null, demGan = null;
    function capNhat(dtg) {
      if (dtg === 0) { giongTia?.dat({ doTo: 0 }, 0.05); giongTH?.dat({ doTo: 0 }, 0.05); }
      tau += dtg * tocDo * 7;
      if (coChop && dtg > 0 && tocDo > 0) {
        // tiếng cao: lúc chớp lẽ ra tới «máy thu» nếu không có khối lượng (đường thẳng, tốc độ c);
        // tiếng trầm: lúc chớp trên tia đang xét tới thật. Khoảng lặng giữa hai tiếng là độ trễ của tia ấy.
        const tXa = X_THU - X0;
        const tGan = lech == null ? null : tgTaiX(tiaChon.diem, tgChon, tiaChon.n, X_THU);
        const kXa = tXa == null ? null : Math.floor((tau - tXa) / KHOANG_CHOP), kGan = tGan == null ? null : Math.floor((tau - tGan) / KHOANG_CHOP);
        if (demXa != null && kXa != null && kXa > demXa) am.tich({ tanSo: 1320, doTo: 0.35, lech: 0.4 });
        if (demGan != null && kGan != null && kGan > demGan) am.tich({ tanSo: 660, doTo: 0.45, lech: 0.4, dai: 0.07 });
        demXa = kXa; demGan = kGan;
      }
      if (!coChop) return;
      const pha = tau % KHOANG_CHOP;
      let p = 0;
      for (let c = 0; c < SO_CHOP; c++) {
        const t = pha + c * KHOANG_CHOP;
        const ms = matSong[c];
        let nDoan = 0, truoc = false, tx = 0, ty = 0;
        for (const tia of dsTia) {
          const co = (tia.phang || hien3D) && viTriChop(tia.d.diem, tia.tg, tia.n, t, vtChop, p);
          if (!co) { vtChop[p] = vtChop[p + 1] = vtChop[p + 2] = 1e6; }
          if (tia.phang) {
            const x = vtChop[p], y = vtChop[p + 1];
            // nối hai tia kề nhau thành mặt sóng nếu cả hai còn chớp và không quá xa nhau
            if (co && truoc && Math.hypot(x - tx, y - ty) < 2.4) {
              const a = ms.bo.array, j = nDoan * 6;
              a[j] = tx; a[j + 1] = ty; a[j + 2] = 0; a[j + 3] = x; a[j + 4] = y; a[j + 5] = 0;
              nDoan++;
            }
            truoc = co; tx = x; ty = y;
          }
          p += 3;
        }
        ms.bo.needsUpdate = true;
        ms.geo.instanceCount = nDoan;
      }
      geoChop.attributes.position.needsUpdate = true;
    }

    function hud() {
      if (rsW < 1e-4) return [[chuCanh("canh.khong-co-khoi-luong-0e858f", "Không có khối lượng"), chuCanh("canh.khong-gian-phang-anh-sang-di-thang", "không gian phẳng, ánh sáng đi thẳng")]];
      const b = bChon;
      const dong = [[chuCanh("canh.tia-dang-xet-7fde60", "Tia đang xét"), chuCanh("canh.khoang-ngam-b-r-s", "khoảng ngắm b = {0} r<sub>s</sub>", [so(b, b < 2.7 ? 4 : 2)])]];
      if (lech == null) dong.push([chuCanh("canh.ket-qua", "Kết quả"), chuCanh("canh.bi-lo-den-nuot-b-nho-hon-r", "bị lỗ đen nuốt (b nhỏ hơn {0} r<sub>s</sub>)", [so(B_TOI_HAN, 3)])]);
      else {
        dong.push([chuCanh("canh.einstein-tinh-so", "Einstein (tính số)"), chuCanh("canh.lech-ef6e38", "lệch {0}°{1}", [so(lech / DO, lech / DO < 10 ? 2 : 1), lech > 2 * Math.PI ? chuCanh("canh.quan-vong", " (quấn {0} vòng)", [so(lech / (2 * Math.PI), 2)]) : ''])]);
        dong.push([chuCanh("canh.cong-thuc-2r-s-b", "Công thức 2r<sub>s</sub>/b"), chuCanh("canh.chi-dung-khi-b-lon", "{0}° (chỉ đúng khi b lớn)", [so(2 / b / DO, 2)])]);
        dong.push([chuCanh("canh.newton", "Newton"), `${so((2 * Math.atan(0.5 / b)) / DO, 2)}°`]);
      }
      if (coTH) dong.push([chuCanh("canh.thien-ha-nen", "Thiên hà nền"), chuCanh("canh.lech-e-e-nhin-tu-cho-nguoi-quan", "lệch {0} θ<sub>E</sub> · θ<sub>E</sub> = {1}° nhìn từ chỗ người quan sát", [so(Math.hypot(betaX, betaY), 2), so(thetaE / DO, 1)])]);
      dong.push([chuCanh("canh.suot-mep-mat-troi-b-235-600-r", "Sượt mép Mặt Trời (b = 235 600 r<sub>s</sub>)"), chuCanh("canh.einstein-1-75-newton-0-88", "Einstein 1,75″ · Newton 0,88″")]);
      return dong;
    }

    // Tham số riêng khi chụp ảnh kiểm thử (chỉ ở chế độ im lặng): ?thu=b2 | b5 | b6 | b7 đặt mô hình vào trạng thái đạt thử thách.
    const thuChup = app.imLang ? new URLSearchParams(location.search).get('thu') : null;
    function thu(ten) {
      if (thuChup !== ten) return;
      if (ten === 'b2') { cauHinh({ b: B_20_DO }); daKeoTia = true; }
      if (ten === 'b5') { cauHinh({ beta: 0.02 }); daKeoTH = true; }
      if (ten === 'b6') { cauHinh({ b: B_90_DO }); daKeoTia = true; }
      if (ten === 'b7') { cauHinh({ b: 2.4 }); daKeoTia = true; }
    }
    const trangThai = () => ({ rsW, b: bChon, lech, beta: Math.hypot(betaX, betaY), daKeoTH, daKeoTia });

    veThauKinh();
    dungTia();
    cauHinh({ chop: false, th: false });

    return {
      scene, capNhat, hud, cauHinh, thu, trangThai,
      tatTieng() { giongTia?.tat(0.2); giongTia = null; giongTH?.tat(0.2); giongTH = null; },
      huy() {
        giongTia?.tat(0.1); giongTH?.tat(0.1);
        anhTroi.dispose();
        huyCanh(troiGoc);
      },
    };
  },
};
