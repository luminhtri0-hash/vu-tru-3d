// Chia một đoạn lời thành các câu phụ đề, theo kiểu phụ đề video đã duyệt:
//   - mỗi câu phụ đề tối đa 2 dòng;
//   - mỗi dòng không quá khoảng 42 ký tự (chữ Việt, chữ Latin) hoặc khoảng 20 chữ (chữ Trung, chữ Nhật);
//   - ngắt theo cụm ý: ưu tiên sau dấu câu, rồi trước liên từ; tránh ngắt giữa một con số đọc bằng chữ.
// Mô-đun thuần (không đụng tới trang), dùng chung cho chế độ «Xem như video» (src/khung/xem-video.js) và cho công cụ
// mốc phụ đề (cong-cu/tao-phu-de.py gọi qua node), để hai bên chia câu giống hệt nhau.
// Quy ước quan trọng: chỉ đổi khoảng trắng thành xuống dòng, KHÔNG thêm bớt chữ, nên ghép các câu lại (thay «\n» bằng
// dấu cách) là ra đúng lời gốc đã gom khoảng trắng. Công cụ mốc phụ đề dựa vào điều này để biết câu nào gồm những từ nào.

export const DONG_LATIN = 42;
export const DONG_VUONG = 20;
// Tốc độ đọc ước tính khi chưa có giọng đọc (ký tự mỗi giây).
export const TOC_LATIN = 14;
export const TOC_VUONG = 6;

const VUONG = /[぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯　-〿]/;
const VUONG_G = new RegExp(VUONG.source, 'g');

// Đoạn lời là chữ Trung hoặc chữ Nhật khi phần lớn ký tự (không kể khoảng trắng) là chữ vuông.
export function laChuVuong(s) {
  const tong = String(s).replace(/\s/g, '').length;
  return tong > 0 && (String(s).match(VUONG_G) || []).length / tong > 0.3;
}

// Chữ rộng một ô vuông: chữ Trung, Nhật và chữ Hàn (Hangul).
const RONG = new RegExp(`${VUONG.source}|[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]`);
// Độ dài hiển thị. Chữ vuông (ngắt được giữa các chữ): mỗi chữ một đơn vị, ký tự Latin (số, đơn vị) nửa đơn vị.
// Chữ ngắt ở khoảng trắng (Việt, Anh, Hàn): mỗi ký tự Latin một đơn vị, chữ rộng (Hàn, chữ vuông lẫn vào) hai đơn vị,
// nên 42 đơn vị là 42 chữ Latin hoặc 21 chữ Hàn.
export function doDai(s, vuong) {
  if (!vuong) { let n = 0; for (const c of s) n += RONG.test(c) ? 2 : 1; return n; }
  let n = 0;
  for (const c of s) n += VUONG.test(c) ? 1 : 0.5;
  return n;
}

const HET_CAU_LATIN = /[.!?…]["»”’)\]]*$/;
const DAU_NGAT_LATIN = /[,;:–—]["»”’)\]]*$/;
const LIEN_TU = new Set(('và nhưng rồi nên vì thì mà còn khi để hay hoặc nếu tức là nghĩa cho nơi với từ tới đến trong ' +
  'sau trước giống như theo bằng của mỗi vừa đang đã sẽ được bị cũng chỉ ' +
  'and but so because which that when while or if then where with from to as of for in on by than is are was').split(' '));
// Từ không nên đứng cuối dòng (nó dẫn sang từ sau).
const KET_XAU = new Set(('một những các của cái con mỗi cả từ tới về với theo là và nhưng thì mà ở trong ngoài trên dưới cho rất ' +
  'the a an of to and in on at by for with from is are').split(' '));
// Từ ghép hay gặp trong bài giảng: không tách hai tiếng của nó ra hai dòng.
const TU_GHEP = new Set(('hành tinh|vũ trụ|thời gian|không gian|ánh sáng|lỗ đen|quỹ đạo|vận tốc|khối lượng|chuyển động|đường đi|' +
  'khác nhau|bằng nhau|hình dạng|vệt sáng|quãng đường|xoắn ốc|đơn vị|thiên văn|thiên hà|ngôi sao|hấp dẫn|trọng lực|' +
  'tương đối|gia tốc|năng lượng|mô hình|tỉ lệ|khoảng cách|kích thước|bán kính|đường kính|chu kỳ|diện tích|' +
  'phương trình|định luật|mặt phẳng|vành đai|trái đất|mặt trời|mặt trăng|ngân hà|đồng hồ|tín hiệu|sóng hấp|hạt nhân|' +
  'nguyên tử|điện tử|lượng tử|xác suất|thí nghiệm|quan sát|đo được|tính ra|vì sao|ví dụ').split('|'));
const SO_DEM = new Set('không một mốt hai ba bốn tư năm lăm sáu bảy tám chín mười mươi trăm nghìn ngàn triệu tỉ linh lẻ phẩy'.split(' '));
const thuong = (w) => w.toLowerCase().replace(/^[«"“'(]+|[»"”',.;:!?)]+$/g, '');

// Chi phí ngắt TRƯỚC phần tử thứ k (giữa k-1 và k). Số nhỏ là chỗ ngắt đẹp.
function chiPhiNgatLatin(ds, k) {
  const truoc = ds[k - 1], sau = ds[k];
  if (HET_CAU_LATIN.test(truoc)) return 0;
  if (DAU_NGAT_LATIN.test(truoc)) return 0.3;
  const a = thuong(truoc), b = thuong(sau);
  if (SO_DEM.has(a) && (SO_DEM.has(b) || /^\d/.test(b))) return 6;            // giữa một con số đọc bằng chữ
  if (/^\d/.test(a) && !/[,.]$/.test(truoc)) return 4;                        // giữa số và đơn vị
  if (TU_GHEP.has(a + ' ' + b)) return 6;
  if (/^\p{Lu}/u.test(truoc) && /^\p{Lu}/u.test(sau)) return 5;            // tên riêng nhiều tiếng (Mặt Trời, Thiên Nga)
  if (KET_XAU.has(a)) return 3.5;
  if (LIEN_TU.has(b)) return 1;
  if (a.length <= 2 && !SO_DEM.has(a)) return 3;                              // chừa một từ rất ngắn ở cuối dòng
  return 2;
}

const DAU_NGAT_VUONG = /[、，,；;：:]/;
const HET_CAU_VUONG = /[。！？!?]/;
const KHONG_DAU_DONG = /[、，,；;：:。！？!?）)」』】〉》・ー々〜…ぁぃぅぇぉっゃゅょァィゥェォッャュョ]/;
const TRO_TU = /[はがをにでとのもへや的了和是在把被也就]/;
// Ký tự của một cụm chữ La-tinh, số, đơn vị («230», «km/s», «3×10⁸», «−2.25», «26,700»): không ngắt giữa chúng.
const CUM_LATIN = /[A-Za-z0-9.,%\/·×+\-−=°′″²³⁰¹⁴⁵⁶⁷⁸⁹⁻^_~*]/;
function chiPhiNgatVuong(ds, k) {
  const truoc = ds[k - 1], sau = ds[k];
  if (KHONG_DAU_DONG.test(sau) || /\s/.test(sau)) return 50;                 // dấu câu không được đứng đầu dòng
  if (HET_CAU_VUONG.test(truoc) || /[」』]/.test(truoc)) return 0;
  // Khoảng trắng nằm giữa một con số và đơn vị của nó, hay giữa hai từ La-tinh («230 km/s», «169.8 AU», «Sagittarius A»):
  // không phải chỗ ngắt. (Trước bản 3.7 mọi khoảng trắng đều là chỗ ngắt đẹp, nên phụ đề tiếng Nhật ngắt «230 | km/s».)
  if (/\s/.test(truoc) && k >= 2 && CUM_LATIN.test(ds[k - 2]) && CUM_LATIN.test(sau) && !/[,.]/.test(sau)) return 20;
  if (/[、，；;：:]/.test(truoc) || /\s/.test(truoc)) return 0.3;
  if (CUM_LATIN.test(truoc) && CUM_LATIN.test(sau)) return 20;                // giữa một cụm chữ Latin, số
  if (/[0-9]/.test(truoc) && !/[\s、，。！？!?）)」』]/.test(sau)) return 8;        // giữa số và chữ đếm đi liền nó («26,700 | 光年», «8 | 惑星»)
  if (/[（(「『【〈《]/.test(truoc)) return 20;
  if (TRO_TU.test(truoc)) return 1;
  return 2.5;
}

// RANH GIỚI TỪ của chữ Trung, Nhật. Hai thứ chữ này viết liền không có khoảng trắng, nên luật dấu câu, số và trợ từ ở
// trên không biết đâu là giữa một từ: phụ đề từng ngắt «飞行方 | 向». Trình duyệt (kể cả WebKit của app Mac) và node đời
// mới có sẵn bộ tách từ Intl.Segmenter; có thì hỏi nó, không có thì trả về null và bộ chia giữ luật cũ.
// Trả về mảng ranh[k]: giữa phần tử k-1 và k là ranh giới từ.
const _boTach = {};
function ranhGioiTu(ds, tieng) {
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return null;
  try {
    const bo = _boTach[tieng] || (_boTach[tieng] = new Intl.Segmenter(tieng, { granularity: 'word' }));
    const dau = new Set();                    // vị trí (đơn vị mã UTF-16) mở đầu một từ
    for (const doan of bo.segment(ds.join(''))) dau.add(doan.index);
    const ranh = new Array(ds.length).fill(false);
    let vt = 0;
    for (let k = 0; k < ds.length; k++) { ranh[k] = dau.has(vt); vt += ds[k].length; }
    return ranh;
  } catch { return null; }
}
const NGAT_GIUA_TU = 12;                      // chi phí ngắt giữa một từ: chỉ chịu khi không còn chỗ nào khác

// Chia một câu (danh sách phần tử) thành các câu phụ đề tối đa 2 dòng. Quy hoạch động trên chỗ ngắt.
function chiaMotCau(ds, { noi, dai, vuong, tieng }) {
  const n = ds.length;
  const chiPhi = vuong ? chiPhiNgatVuong : chiPhiNgatLatin;
  const ranh = vuong ? ranhGioiTu(ds, tieng || (/[぀-ヿ]/.test(ds.join('')) ? 'ja' : 'zh')) : null;
  const ngat = [0];
  for (let k = 1; k < n; k++) { ngat[k] = chiPhi(ds, k); if (ranh && !ranh[k] && ngat[k] < NGAT_GIUA_TU) ngat[k] = NGAT_GIUA_TU; }
  const ghep = (i, j) => ds.slice(i, j).join(noi).trim();
  const tich = [0];
  for (let k = 0; k < n; k++) tich[k + 1] = tich[k] + doDai(ds[k], vuong);
  const len = (i, j) => tich[j] - tich[i] + (noi ? j - i - 1 : 0);
  // Câu phụ đề gồm ds[i..j): một dòng nếu vừa, không thì hai dòng ngắt ở chỗ đẹp nhất mà hai dòng đều vừa.
  const cache = new Map();
  const motCau = (i, j) => {
    const khoa = i * 4096 + j;
    if (cache.has(khoa)) return cache.get(khoa);
    let kq;
    const L = len(i, j);
    if (L <= dai) kq = { chiPhi: 0, dong: [ghep(i, j)] };
    else if (L > 2 * dai + 2) kq = null;
    else {
      let tot = null;
      for (let k = i + 1; k < j; k++) {
        const a = len(i, k), b = len(k, j);
        if (a > dai || b > dai) continue;
        const c = ngat[k] + (1.2 * Math.abs(a - b)) / dai + (a > b + 6 ? 0.4 : 0);
        if (!tot || c < tot.chiPhi) tot = { chiPhi: c, dong: [ghep(i, k), ghep(k, j)] };
      }
      kq = tot;
    }
    cache.set(khoa, kq);
    return kq;
  };
  const tot = new Array(n + 1).fill(null);
  tot[0] = { chiPhi: 0, cau: [] };
  for (let j = 1; j <= n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      if (!tot[i]) continue;
      if (len(i, j) > 2 * dai + 2 && j - i > 1) break;
      let c = motCau(i, j);
      if (!c && j - i === 1) c = { chiPhi: 10, dong: [ghep(i, j)] };                // một phần tử quá dài: đành để riêng
      if (!c) continue;
      const L = len(i, j);
      const chiPhi = tot[i].chiPhi + c.chiPhi + (i > 0 ? 2 * ngat[i] : 0) + 1.5 + (L < dai * 0.4 && n > 1 ? 1.5 : 0);
      if (!tot[j] || chiPhi < tot[j].chiPhi) tot[j] = { chiPhi, cau: [...tot[i].cau, c.dong.join('\n')] };
    }
  }
  return tot[n]?.cau || [ghep(0, n)];
}

// Tách đoạn lời thành các câu (theo dấu kết câu), mỗi câu là danh sách phần tử: từ (chữ Latin) hoặc ký tự (chữ vuông).
function tachCau(loi, vuong) {
  const cau = [];
  if (vuong) {
    let dang = [];
    const ds = [...loi];
    for (let i = 0; i < ds.length; i++) {
      const c = ds[i];
      if (/\s/.test(c)) { if (dang.length && dang[dang.length - 1] !== ' ') dang.push(' '); continue; }
      dang.push(c);
      if (HET_CAU_VUONG.test(c) && !HET_CAU_VUONG.test(ds[i + 1] || '') && !/[」』）)]/.test(ds[i + 1] || '')) { cau.push(dang); dang = []; }
      else if (/[」』]/.test(c) && HET_CAU_VUONG.test(dang[dang.length - 2] || '')) { cau.push(dang); dang = []; }
    }
    if (dang.length) cau.push(dang);
    return cau.map((d) => { while (d[0] === ' ') d.shift(); while (d[d.length - 1] === ' ') d.pop(); return d; }).filter((d) => d.length);
  }
  let dang = [];
  for (const w of loi.split(/\s+/).filter(Boolean)) {
    dang.push(w);
    if (HET_CAU_LATIN.test(w) && !/^\d+\.$/.test(w)) { cau.push(dang); dang = []; }
  }
  if (dang.length) cau.push(dang);
  return cau;
}

// Đoạn lời → danh sách câu phụ đề («dòng 1\ndòng 2»).
// tieng: mã thứ tiếng (zh-CN, ja…) cho bộ tách từ của chữ vuông; không nêu thì đoán theo chữ (có kana là tiếng Nhật).
export function chiaPhuDe(loi, { vuong = laChuVuong(loi), dai, tieng } = {}) {
  loi = String(loi || '').replace(/\s+/g, ' ').trim();
  if (!loi) return [];
  const tuyChon = { noi: vuong ? '' : ' ', dai: dai || (vuong ? DONG_VUONG : DONG_LATIN), vuong, tieng };
  return tachCau(loi, vuong).flatMap((ds) => chiaMotCau(ds, tuyChon));
}

// Đặt mốc thời gian ước tính cho các câu phụ đề: mỗi câu dài theo số ký tự (chữ vuông chậm hơn), nghỉ ngắn sau mỗi câu.
// Có tổng thời lượng (tệp tiếng có sẵn nhưng chưa có mốc từng câu) thì dàn đều theo tỉ lệ độ dài trên quãng đó.
export function datMocUocTinh(dsCau, { vuong = false, tong = null, dau = 0.3, toc: tocRieng = null } = {}) {
  const toc = tocRieng || (vuong ? TOC_VUONG : TOC_LATIN);
  const nghi = 0.25;
  const dai = dsCau.map((c) => Math.max(1.1, doDai(c.replace(/\n/g, vuong ? '' : ' '), vuong) / toc));
  let heSo = 1, batDau = dau;
  if (tong) {
    const can = dai.reduce((s, d) => s + d, 0) + nghi * Math.max(0, dsCau.length - 1);
    batDau = Math.min(dau, tong * 0.05);
    heSo = Math.max(0.2, (tong - batDau - 0.2) / can);
  }
  const kq = [];
  let t = batDau;
  for (let i = 0; i < dsCau.length; i++) {
    const d = dai[i] * heSo;
    kq.push({ t0: round(t), t1: round(t + d), chu: dsCau[i] });
    t += d + nghi * heSo;
  }
  return kq;
}
const round = (x) => Math.round(x * 100) / 100;

// Câu phụ đề đang hiện ở thời điểm t (giây), hoặc -1. Câu hiện từ t0 tới t1; giữa hai câu cách nhau dưới 0,6 giây thì
// giữ câu trước cho khỏi nháy.
export function cauLucDo(moc, t) {
  for (let i = 0; i < moc.length; i++) {
    const m = moc[i];
    if (t < m.t0) return -1;
    const ke = moc[i + 1];
    const het = ke && ke.t0 - m.t1 < 0.6 ? ke.t0 : m.t1;
    if (t < het) return i;
  }
  return -1;
}
