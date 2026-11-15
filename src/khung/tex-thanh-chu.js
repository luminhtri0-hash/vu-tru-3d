// CÔNG THỨC LaTeX NGẮN → CHỮ ĐỌC ĐƯỢC. Dùng ở những chỗ không dựng công thức được mà vẫn phải hiện nội dung của nó:
// phụ đề của chế độ «Xem như video» khi bài chưa có lời đọc (mọi bài ở tiếng Anh, Trung, Nhật), thẻ tên bước, tên bài
// báo cho hệ điều hành. Trước bản 3.7 những chỗ đó XOÁ hẳn công thức, nên phụ đề có câu «: phần quay quanh Mặt Trời»
// (mất chủ ngữ là ký hiệu vận tốc) và tên bước «Hệ số tỉ lệ  và dịch chuyển đỏ».
//
// Không dựng hình, không cần trình duyệt: đổi ký hiệu thường gặp sang chữ Unicode, phân số thành «a/b», chỉ số và số mũ
// thành chữ nhỏ khi có, bỏ lệnh trình bày. Gặp lệnh lạ thì bỏ lệnh, giữ chữ. Không bao giờ ném lỗi.
//
//   texThanhChu('\\vec v_{\\text{quỹ đạo}}')        → 'v quỹ đạo'
//   texThanhChu('r_s = \\dfrac{2GM}{c^2}')           → 'rs = 2GM/c²'
//   chuCoCongThuc('Hệ số tỉ lệ $a(t)$ hôm nay')      → 'Hệ số tỉ lệ a(t) hôm nay'

const KY_HIEU = {
  alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', Theta: 'Θ', vartheta: 'θ', kappa: 'κ', lambda: 'λ', Lambda: 'Λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', Pi: 'Π',
  rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', phi: 'φ', varphi: 'φ', Phi: 'Φ', chi: 'χ', psi: 'ψ', Psi: 'Ψ', omega: 'ω', Omega: 'Ω',
  hbar: 'ℏ', ell: 'ℓ', infty: '∞', partial: '∂', nabla: '∇', odot: '☉', oplus: '⊕', circ: '°', degree: '°', prime: '′', star: '*', ast: '*',
  times: ' × ', cdot: '·', cdots: '…', ldots: '…', dots: '…', div: ' ÷ ', pm: ' ± ', mp: ' ∓ ',
  approx: ' ≈ ', simeq: ' ≈ ', sim: ' ~ ', propto: ' ∝ ', equiv: ' ≡ ', ne: ' ≠ ', neq: ' ≠ ', le: ' ≤ ', leq: ' ≤ ', ge: ' ≥ ', geq: ' ≥ ',
  ll: ' ≪ ', gg: ' ≫ ', lt: ' < ', gt: ' > ', to: ' → ', rightarrow: ' → ', Rightarrow: ' ⇒ ', longrightarrow: ' → ', leftarrow: ' ← ',
  leftrightarrow: ' ↔ ', mapsto: ' → ', in: ' ∈ ', sum: 'Σ', int: '∫', prod: 'Π', langle: '⟨', rangle: '⟩', lVert: '‖', rVert: '‖', vert: '|', mid: ' | ',
  quad: ' ', qquad: ' ', dd: 'd', sin: 'sin ', cos: 'cos ', tan: 'tan ', tg: 'tg ', cot: 'cot ', sinh: 'sinh ', cosh: 'cosh ', tanh: 'tanh ',
  arcsin: 'arcsin ', arccos: 'arccos ', arctan: 'arctan ', ln: 'ln ', log: 'log ', lg: 'lg ', exp: 'exp ', min: 'min ', max: 'max ', lim: 'lim ', det: 'det ',
};
// Lệnh chỉ bọc một nhóm để đổi dáng chữ hoặc thêm dấu trên đầu: giữ phần chữ bên trong.
const BOC = new Set(('text textrm textbf textit textsf mathrm mathbf mathit mathsf mathcal mathbb mathscr boldsymbol bm operatorname ' +
  'vec hat bar dot ddot tilde widetilde widehat overline underline overrightarrow mbox boxed').split(' '));
// Lệnh trình bày: bỏ, không mang chữ.
const BO = new Set(('left right big Big bigg Bigg bigl bigr Bigl Bigr biggl biggr displaystyle textstyle scriptstyle limits nolimits ' +
  'nonumber notag hfill smallskip medskip bigskip').split(' '));
const SO_MU = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', n: 'ⁿ' };
const CHI_SO = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋', '−': '₋' };

// Đọc một đối số TeX bắt đầu ở s[i]: một nhóm {…}, một lệnh \tên, hoặc một ký tự. Trả về [nội dung, vị trí kế tiếp].
function docNhom(s, i) {
  while (s[i] === ' ') i++;
  if (i >= s.length) return ['', i];
  if (s[i] === '{') {
    let sau = 1, j = i + 1;
    for (; j < s.length && sau > 0; j++) {
      if (s[j] === '\\') j++;
      else if (s[j] === '{') sau++;
      else if (s[j] === '}') sau--;
    }
    return [s.slice(i + 1, sau === 0 ? j - 1 : j), j];
  }
  if (s[i] === '\\') {
    const m = /^\\([A-Za-z]+|[\s\S])/.exec(s.slice(i));
    if (!m) return ['', i + 1];
    let j = i + m[0].length;
    // «_\text{…}», «^\mathrm{…}»: lệnh bọc thì lấy luôn nhóm của nó.
    if (BOC.has(m[1])) { const [, k] = docNhom(s, j); j = k; }
    return [s.slice(i, j), j];
  }
  const kyTu = String.fromCodePoint(s.codePointAt(i));
  return [kyTu, i + kyTu.length];
}

// Biểu thức có phép tính bên trong thì bọc ngoặc khi đứng làm tử, mẫu, số mũ («(r − rs)/(r + rs)»).
const ngoac = (a) => { a = a.trim(); return /[+\-−±×÷/= ]/.test(a) && !/^[√∛]?\([^()]*\)$/.test(a) ? `(${a})` : a; };

function doi(s) {
  let ra = '';
  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (c === '\\') {
      const m = /^\\([A-Za-z]+|[\s\S])/.exec(s.slice(i));
      if (!m) { i++; continue; }
      const ten = m[1];
      i += m[0].length;
      const laTen = /^[A-Za-z]+$/.test(ten);
      if (laTen) while (s[i] === ' ') i++;                                   // TeX bỏ khoảng trắng sau tên lệnh
      if (ten === 'frac' || ten === 'dfrac' || ten === 'tfrac' || ten === 'dv') {
        const [a, j] = docNhom(s, i);
        const [b, k] = docNhom(s, j);
        i = k;
        ra += ten === 'dv' ? `d${doi(a).trim()}/d${doi(b).trim()}` : `${ngoac(doi(a))}/${ngoac(doi(b))}`;
      } else if (ten === 'sqrt') {
        let bac = '';
        if (s[i] === '[') { const d = s.indexOf(']', i); if (d > 0) { bac = doi(s.slice(i + 1, d)).trim(); i = d + 1; } }
        const [a, j] = docNhom(s, i);
        i = j;
        ra += `${bac === '3' ? '∛' : '√'}${ngoac(doi(a))}`;
      } else if (BOC.has(ten)) {
        const [a, j] = docNhom(s, i);
        i = j;
        ra += doi(a);
      } else if (BO.has(ten)) {
        if (s[i] === '.') i++;                                                // «\right.»: ngoặc vô hình
      } else if (Object.hasOwn(KY_HIEU, ten)) ra += KY_HIEU[ten];
      else if (ten === ',' || ten === ';' || ten === ':' || ten === '>' || ten === ' ' || ten === '\\') ra += ' ';
      else if (ten === '!') { /* khoảng âm: bỏ */ }
      else if (!laTen) ra += ten;                                             // «\%», «\{», «\$», «\_»: chính ký tự đó
      // lệnh có tên mà không biết: bỏ lệnh, phần chữ theo sau vẫn được đọc tiếp
    } else if (c === '^' || c === '_') {
      const [a, j] = docNhom(s, i + 1);
      i = j;
      const A = doi(a).trim();
      const bang = c === '^' ? SO_MU : CHI_SO;
      const ds = [...A];
      if (!ds.length) continue;
      if (ds.every((k) => Object.hasOwn(bang, k))) ra += ds.map((k) => bang[k]).join('');
      else if (c === '^') ra += /^[°′″*]+$/.test(A) ? A : `^${ngoac(A)}`;
      else ra += ds.length <= 3 ? A : ` ${A} `;
    } else if (c === '{') {
      const [a, j] = docNhom(s, i);
      i = j;
      ra += doi(a);
    } else if (c === '}') i++;
    else if (c === '~' || c === '&') { ra += ' '; i++; }
    else { ra += c; i++; }
  }
  return ra;
}

// Dọn khoảng trắng: một khoảng trắng quanh dấu so sánh, không có khoảng trắng sát trong ngoặc hay trước dấu câu.
const gon = (s) => s.replace(/\s+/g, ' ').replace(/ ?([=≈≤≥≠≡∝→←⇒↔≪≫<>]) ?/g, ' $1 ').replace(/([([⟨]) /g, '$1')
  .replace(/ ([)\]⟩,.;:!?%°])/g, '$1').replace(/\s+/g, ' ').trim();

export function texThanhChu(tex) {
  try { return gon(doi(String(tex ?? ''))); } catch { return ''; }
}

// Một dòng chữ có công thức trong dòng «$…$» → chữ thường. Công thức khối «$$…$$» bị bỏ (không đọc thành câu được).
export function chuCoCongThuc(s) {
  return String(s ?? '').replace(/\\\$|\$\$[\s\S]+?\$\$|\$[^$]+?\$/g, (m) => {
    if (m === '\\$') return '$';
    return m.startsWith('$$') ? '' : texThanhChu(m.slice(1, -1));
  });
}
