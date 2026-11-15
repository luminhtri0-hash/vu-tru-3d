// Mã GLSL dùng chung cho thư viện thiên thể (hanh-tinh*.js): nhiễu, nhiễu phân dạng có khử răng cưa,
// ô Voronoi, hố va chạm có bóng đổ, và công thức vân bề mặt của từng thiên thể.
//
// Mọi vân bề mặt ở đây là HÌNH MINH HOẠ tự sinh bằng mã, không phải bản đồ thật, TRỪ bờ biển Trái Đất
// (lấy từ Natural Earth qua world-atlas/land-50m.json, xem hanh-tinh-trai-dat.js).
// Một vài nét lớn đặt đúng chỗ cho dễ nhận ra (Vết Đỏ Lớn của Sao Mộc, Valles Marineris của Sao Hỏa,
// các vùng sa mạc lớn của Trái Đất), còn chi tiết là nhiễu.
//
// Quy ước: p là điểm trên mặt cầu đơn vị trong hệ của vật (trục cực là y, bắc ở y = +1),
// trùng với vị trí đỉnh của THREE.SphereGeometry(1). Kinh độ: lon = atan(-p.z, p.x) (khớp với toạ độ ảnh
// của SphereGeometry: u = 0,5 là kinh tuyến 0, phía đông là -z). w: bề rộng một điểm ảnh tính theo đơn vị
// bán kính (để làm mờ các bậc nhiễu nhỏ hơn điểm ảnh, tránh lấp lánh khi lùi xa).
// Màu trả về là màu TUYẾN TÍNH (hệ số phản xạ, dưới 1).

export const GLSL_NHIEU = /* glsl */ `
  // Băm không dùng sin (Dave Hoskins, «Hash without Sine», giấy phép MIT).
  vec3 bam33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float bam13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  // Nhiễu gradient ba chiều, giá trị khoảng -1..1.
  float nhieuG(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = dot(bam33(i) * 2.0 - 1.0, f);
    float b = dot(bam33(i + vec3(1, 0, 0)) * 2.0 - 1.0, f - vec3(1, 0, 0));
    float c = dot(bam33(i + vec3(0, 1, 0)) * 2.0 - 1.0, f - vec3(0, 1, 0));
    float d = dot(bam33(i + vec3(1, 1, 0)) * 2.0 - 1.0, f - vec3(1, 1, 0));
    float e = dot(bam33(i + vec3(0, 0, 1)) * 2.0 - 1.0, f - vec3(0, 0, 1));
    float g = dot(bam33(i + vec3(1, 0, 1)) * 2.0 - 1.0, f - vec3(1, 0, 1));
    float h = dot(bam33(i + vec3(0, 1, 1)) * 2.0 - 1.0, f - vec3(0, 1, 1));
    float k = dot(bam33(i + vec3(1, 1, 1)) * 2.0 - 1.0, f - vec3(1, 1, 1));
    return 1.6 * mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
  }
  // Nhiễu phân dạng n bậc; w = bề rộng điểm ảnh theo đơn vị của p: bậc nào nhỏ hơn điểm ảnh thì tắt dần.
  float fbm(vec3 p, int n, float w) {
    float s = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 10; i++) {
      if (i >= n) break;
      float k = 1.0 - smoothstep(0.18, 0.5, f * w);
      if (k <= 0.0) break;
      s += a * k * nhieuG(p * f + float(i) * 17.31);
      f *= 2.03; a *= 0.5;
    }
    return s;
  }
  // Nhiễu gợn (ridged): đường sống núi, vệt nứt.
  float fbmGon(vec3 p, int n, float w) {
    float s = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= n) break;
      float k = 1.0 - smoothstep(0.18, 0.5, f * w);
      if (k <= 0.0) break;
      float r = 1.0 - abs(nhieuG(p * f + float(i) * 9.7));
      s += a * k * r * r;
      f *= 2.1; a *= 0.5;
    }
    return s;
  }
  // Ô Voronoi chuyển động: trả (F1, F2), khoảng cách tới điểm gần nhất và gần nhì.
  vec2 oVoronoi(vec3 p, float t) {
    vec3 i = floor(p), f = fract(p);
    float d1 = 9.0, d2 = 9.0;
    for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec3 o = vec3(float(x), float(y), float(z));
      vec3 h = bam33(i + o);
      vec3 c = o + 0.5 + 0.38 * sin(t * (0.6 + 0.8 * h.zxy) + 6.2831 * h) - f;
      float d = dot(c, c);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    return sqrt(vec2(d1, d2));
  }
  vec3 xoayY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  float kinhDo(vec3 p) { return atan(-p.z, p.x); }
  float viDo(vec3 p) { return asin(clamp(p.y, -1.0, 1.0)); }
  // Chênh kinh độ, gói về -pi..pi.
  float chenhKinh(float a, float b) { return mod(a - b + 3.14159265, 6.2831853) - 3.14159265; }
  // Khoảng cách elip trên bản đồ kinh-vĩ (độ): < 1 là ở trong.
  float elipDo(float lonDo, float latDo, vec4 e) {
    float dl = mod(lonDo - e.x + 180.0, 360.0) - 180.0;
    return length(vec2(dl / e.z, (latDo - e.y) / e.w));
  }
  vec3 raSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
`;

// Hố va chạm ở một bậc tỉ lệ. Mỗi ô của lưới ba chiều có thể chứa một hố; chỉ xét 8 ô quanh điểm
// nên bán kính hố (kể cả vành) không quá nửa ô. Cộng dồn: g (độ dốc, để lệch pháp tuyến),
// bong (1 = được chiếu, 0 = nằm trong bóng của vành hố phía Mặt Trời), tuoi (độ sáng của hố mới, có tia).
// Lo: hướng tới nguồn sáng (hệ vật, đã chuẩn hoá). doSau: độ sâu / bán kính.
export const GLSL_HO = /* glsl */ `
  void hoVaCham(vec3 p, float tanSo, float matDo, float hat, float doSau, vec3 Lo, float w,
                inout vec3 g, inout float bong, inout float tuoi, inout float day) {
    float mo = 1.0 - smoothstep(0.08, 0.3, w * tanSo);         // hố nhỏ hơn vài điểm ảnh: bỏ
    if (mo <= 0.0) return;
    vec3 q = p * tanSo;
    vec3 b = floor(q - 0.5);
    float sinE = dot(Lo, p);
    vec3 Lt = Lo - p * sinE;
    float lenLt = length(Lt);
    vec3 lt = Lt / max(lenLt, 1e-4);
    float tanE = sinE / max(lenLt, 1e-3);
    for (int k = 0; k < 8; k++) {
      vec3 c = b + vec3(float(k & 1), float((k >> 1) & 1), float((k >> 2) & 1));
      vec3 h = bam33(c + hat);
      if (h.x > matDo) continue;
      float R = 0.07 + 0.235 * h.y * h.y;                       // nhiều hố nhỏ, ít hố lớn
      vec3 tam = c + 0.5 + (bam33(c + hat + 7.7) - 0.5) * (1.0 - 2.0 * R * 1.55);
      vec3 u = q - tam;
      float d = length(u);
      float x = d / R;
      if (x > 1.6) continue;
      vec3 huong = u / max(d, 1e-5);
      float D = doSau * mo;
      float lon = step(0.62, h.y);                              // hố lớn: đáy phẳng, có núi giữa
      float dhdx;
      if (x < 1.0) {
        float day0 = mix(1.0, 0.72, lon);
        dhdx = (x * x - 1.0 > -day0) ? 2.0 * x : 0.0;
        dhdx -= lon * 0.9 * (x / 0.03) * exp(-x * x / 0.03);  // núi giữa
        // bóng của vành hố phía nguồn sáng đổ vào lòng hố
        vec3 ut = u - p * dot(u, p);
        float a = dot(ut, lt);
        float s = -a + sqrt(max(a * a - dot(ut, ut) + R * R, 0.0));
        float sau = D * R * (1.0 - max(x * x, 1.0 - day0));
        float bongHo = smoothstep(-0.05, 0.05, (s * tanE - sau) / R);
        bong = min(bong, mix(1.0, bongHo, mo));
        day += (1.0 - x * x) * mo * 0.5;
      } else {
        dhdx = -0.5 * 4.0 * exp(-(x - 1.0) * 4.0) * smoothstep(1.6, 1.25, x);
      }
      g += D * dhdx * huong;
      // hố mới: lòng và quầng văng ra sáng hơn, có tia
      if (h.z > 0.86) {
        float tia = 0.5 + 0.5 * nhieuG(huong * 9.0 + c);
        tuoi += mo * (x < 1.0 ? 0.8 : exp(-(x - 1.0) * 3.0) * (0.4 + 0.6 * tia * tia));
      }
    }
  }
`;

// Vân bề mặt từng thiên thể (hệ số phản xạ tuyến tính). uBang: dải màu theo vĩ độ (ảnh 256×1, sRGB).
// uDat: mặt nạ đất liền (Trái Đất). t: thời gian (giây) cho mây trôi, dải mây chảy.
export const GLSL_VAN = /* glsl */ `
  uniform sampler2D uBang;
  uniform sampler2D uDat;
  vec3 bangMau(float lat) { return texture(uBang, vec2(lat / 3.14159265 + 0.5, 0.5)).rgb; }

  // Hệ trục tiếp tuyến tại p: đông, bắc.
  void tiepTuyen(vec3 p, out vec3 dong, out vec3 bac) {
    vec3 d = vec3(p.z, 0.0, -p.x);
    dong = dot(d, d) > 1e-8 ? normalize(d) : vec3(0.0, 0.0, -1.0);
    bac = cross(p, dong);
  }

  // ----- Sao Thủy: đá xám nâu, các bồn trũng phẳng hơi tối, hố mới có tia sáng (thêm ở GLSL_HO) -----
  vec3 vanThuy(vec3 p, float w) {
    float lon = fbm(p * 1.8 + 3.0, 4, w * 1.8);
    float vua = fbm(p * 7.0, 5, w * 7.0);
    float k = 0.85 + 0.25 * vua;
    vec3 c = mix(vec3(0.20, 0.185, 0.165), vec3(0.15, 0.14, 0.125), smoothstep(0.05, 0.3, lon));
    return c * k;
  }

  // ----- Mặt Trăng: cao nguyên sáng, «biển» bazan tối (tự sinh, không phải bản đồ thật) -----
  float bienTrang(vec3 p, float w) {
    vec3 q = p + 0.35 * vec3(fbm(p * 1.3 + 1.0, 3, w), fbm(p * 1.3 + 5.0, 3, w), fbm(p * 1.3 + 9.0, 3, w));
    float m = fbm(q * 1.6 + 2.0, 6, w * 1.6) + 0.12 * fbm(q * 9.0, 4, w * 9.0);
    m += 0.22 * smoothstep(-0.2, 1.0, p.x);                    // nửa hướng về Trái Đất nhiều biển hơn
    return smoothstep(0.06, 0.3, m);
  }
  vec3 vanTrang(vec3 p, float w) {
    float bien = bienTrang(p, w);
    float chiTiet = fbm(p * 12.0, 6, w * 12.0);
    vec3 cao = vec3(0.33, 0.32, 0.30) * (0.88 + 0.24 * chiTiet);
    vec3 thap = vec3(0.105, 0.102, 0.098) * (0.9 + 0.35 * fbm(p * 5.0 + 4.0, 5, w * 5.0));
    thap = mix(thap, vec3(0.16, 0.155, 0.15), smoothstep(0.6, 0.0, bien) * 0.6);
    return mix(cao, thap, bien);
  }

  // ----- Sao Kim: lớp mây axit dày màu kem, vệt mây kéo dài theo vĩ tuyến -----
  vec3 vanKim(vec3 p, float w, float t) {
    vec3 q = xoayY(p, t * 0.01);
    vec3 dong, bac; tiepTuyen(q, dong, bac);
    float a = fbm(q * vec3(2.0, 5.0, 2.0), 4, w * 5.0) * 6.283;
    q += (dong * cos(a) + bac * sin(a) * 0.4) * 0.06;
    float d = fbm(q * vec3(1.6, 9.0, 1.6) + 2.0, 6, w * 9.0);
    float y = abs(q.y);
    vec3 c = mix(vec3(0.62, 0.50, 0.30), vec3(0.80, 0.70, 0.50), smoothstep(-0.35, 0.35, d));
    c = mix(c, vec3(0.82, 0.76, 0.62), smoothstep(0.75, 0.98, y) * 0.6);
    return c;
  }

  // ----- Trái Đất: bờ biển thật (mặt nạ uDat), màu đất theo khí hậu gần đúng -----
  // Trả rgb = hệ số phản xạ, a = 1 nếu là nước (để có ánh phản chiếu Mặt Trời).
  vec4 vanDat(vec3 p, vec2 uv, float w) {
    float latD = (uv.y - 0.5) * 180.0, lonD = (uv.x - 0.5) * 360.0;
    float aLat = abs(latD);
    float nho = fbm(p * 60.0, 4, w * 60.0);
    float mk = texture(uDat, uv).r;
    float gan = textureLod(uDat, uv, 3.0).r;                   // gần bờ (thềm lục địa)
    float sauNoi = textureLod(uDat, uv, 5.5).r;                // sâu trong lục địa
    float dat = smoothstep(0.38, 0.62, mk + 0.18 * nho * (1.0 - abs(mk - 0.5) * 2.0));
    // --- biển ---
    vec3 bien = vec3(0.006, 0.022, 0.060);
    bien = mix(bien, vec3(0.010, 0.040, 0.085), smoothstep(30.0, 0.0, aLat) * 0.6);
    bien = mix(bien, vec3(0.020, 0.085, 0.110), smoothstep(0.08, 0.6, gan) * 0.8);
    // băng biển Bắc Cực và thềm băng Nam Cực
    float bangBien = smoothstep(77.0, 82.0, latD + 4.0 * fbm(p * 8.0, 4, w * 8.0)) + smoothstep(-74.0, -77.0, latD + 3.0 * fbm(p * 8.0, 3, w * 8.0));
    bien = mix(bien, vec3(0.55, 0.60, 0.66), clamp(bangBien, 0.0, 1.0));
    // --- đất ---
    float n1 = fbm(p * 5.0 + 3.0, 5, w * 5.0);
    float n2 = fbm(p * 22.0, 5, w * 22.0);
    // độ ẩm theo vĩ độ: xích đạo ẩm, cận nhiệt khô, ôn đới ẩm vừa
    float am = 0.85 * exp(-pow(latD / 13.0, 2.0)) + 0.55 * smoothstep(34.0, 48.0, aLat) + 0.25;
    am -= 0.55 * smoothstep(14.0, 22.0, aLat) * (1.0 - smoothstep(32.0, 40.0, aLat));
    am -= 0.35 * smoothstep(0.55, 0.95, sauNoi);
    am += 0.25 * n1;
    // sa mạc lớn (vị trí gần đúng)
    float kho = 0.0;
    kho = max(kho, 1.0 - smoothstep(0.6, 1.0, elipDo(lonD, latD, vec4(12.0, 23.0, 26.0, 8.0))));     // Sahara
    kho = max(kho, 1.0 - smoothstep(0.6, 1.0, elipDo(lonD, latD, vec4(47.0, 22.0, 10.0, 8.0))));     // bán đảo Ả Rập
    kho = max(kho, 1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(60.0, 31.0, 9.0, 5.0))));      // Iran
    kho = max(kho, 1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(71.0, 27.0, 4.0, 3.0))));      // Thar
    kho = max(kho, 0.85 * (1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(92.0, 41.0, 20.0, 5.0))))); // Gobi, Taklamakan
    kho = max(kho, 0.6 * (1.0 - smoothstep(0.4, 1.0, elipDo(lonD, latD, vec4(62.0, 45.0, 14.0, 4.0))))); // thảo nguyên Trung Á
    kho = max(kho, 1.0 - smoothstep(0.55, 1.0, elipDo(lonD, latD, vec4(132.0, -25.0, 13.0, 8.0))));  // Úc
    kho = max(kho, 0.9 * (1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(19.0, -24.0, 6.0, 7.0))))); // Kalahari, Namib
    kho = max(kho, 1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(-70.0, -23.0, 2.5, 8.0))));    // Atacama
    kho = max(kho, 0.75 * (1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(-112.0, 34.0, 7.0, 6.0))))); // tây nam Bắc Mỹ
    kho = max(kho, 0.6 * (1.0 - smoothstep(0.4, 1.0, elipDo(lonD, latD, vec4(-68.0, -44.0, 3.5, 6.0))))); // Patagonia
    am -= 1.1 * kho;
    // rừng mưa nhiệt đới
    float rung = 0.0;
    rung = max(rung, 1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(-62.0, -5.0, 14.0, 10.0))));
    rung = max(rung, 1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(21.0, 0.0, 10.0, 6.0))));
    rung = max(rung, 1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(112.0, 0.0, 18.0, 9.0))));
    am += 0.7 * rung;
    am = clamp(am + 0.12 * n2, 0.0, 1.0);
    vec3 saMac = mix(vec3(0.46, 0.33, 0.17), vec3(0.36, 0.19, 0.08), smoothstep(110.0, 125.0, lonD) * step(latD, -10.0));
    saMac *= 0.85 + 0.3 * n2;
    vec3 coKho = vec3(0.17, 0.15, 0.07);
    vec3 thaoNguyen = vec3(0.075, 0.095, 0.035);
    vec3 rungRam = vec3(0.022, 0.050, 0.016);
    vec3 dc = mix(saMac, coKho, smoothstep(0.08, 0.3, am));
    dc = mix(dc, thaoNguyen, smoothstep(0.3, 0.55, am));
    dc = mix(dc, rungRam, smoothstep(0.55, 0.85, am));
    // rừng lá kim phương bắc tối hơn, rồi đài nguyên
    dc = mix(dc, vec3(0.028, 0.040, 0.026), smoothstep(48.0, 56.0, latD) * (1.0 - smoothstep(64.0, 70.0, latD)));
    dc = mix(dc, vec3(0.11, 0.105, 0.085), smoothstep(64.0, 72.0, aLat));
    // núi: sống núi tối, tuyết trên cao (Himalaya, Andes, Rocky gần đúng theo nhiễu gợn)
    float nui = fbmGon(p * 9.0, 5, w * 9.0);
    float vungNui = 1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(86.0, 32.0, 14.0, 6.0)));
    vungNui = max(vungNui, 1.0 - smoothstep(0.4, 1.0, elipDo(lonD, latD, vec4(-70.0, -20.0, 5.0, 32.0))));
    vungNui = max(vungNui, 0.7 * (1.0 - smoothstep(0.4, 1.0, elipDo(lonD, latD, vec4(-113.0, 45.0, 8.0, 14.0)))));
    dc = mix(dc, vec3(0.12, 0.10, 0.08), smoothstep(0.35, 0.7, nui) * (0.25 + 0.5 * vungNui));
    dc = mix(dc, vec3(0.7, 0.72, 0.76), smoothstep(0.55, 0.75, nui) * vungNui * 0.85);
    // băng: Nam Cực, Greenland, đảo vùng cực
    float bang = smoothstep(-58.0, -64.0, latD);
    bang = max(bang, 1.0 - smoothstep(0.75, 1.0, elipDo(lonD, latD, vec4(-41.0, 73.0, 22.0, 13.0))));
    bang = max(bang, smoothstep(74.0, 80.0, latD + 3.0 * n1));
    dc = mix(dc, vec3(0.78, 0.81, 0.86) * (0.95 + 0.08 * n2), bang);
    return vec4(mix(bien, dc, dat), 1.0 - dat);
  }

  // Mây Trái Đất (0–1), trôi chậm, nhiều ở dải hội tụ xích đạo và đới gió tây ôn đới, ít ở cận nhiệt.
  // xoáy thuận ôn đới: quay q quanh trục qua tâm xoáy một góc giảm dần theo khoảng cách (công thức Rodrigues)
  vec3 xoayQuanh(vec3 q, vec3 k, float goc) { float c = cos(goc), s = sin(goc); return q * c + cross(k, q) * s + k * dot(k, q) * (1.0 - c); }
  // Góc mây đã trôi tới lúc t ở vĩ độ latDo (độ): trôi chung về đông, cộng trôi lệch theo vĩ độ (gió mậu dịch về
  // tây, gió tây ôn đới về đông). Phép trôi chỉ là quay quanh trục cực nên vĩ độ không đổi; phần còn lại của mây
  // (mayDatGoc) không phụ thuộc thời gian, nên có thể «nướng» sẵn thành ảnh rồi chỉ dời ảnh theo kinh độ.
  float gocMayTroi(float latDo, float t) { return t * 0.004 + t * 0.006 * (smoothstep(25.0, 45.0, abs(latDo)) * 2.0 - 1.0); }
  float mayDatGoc(vec3 q, float w);
  float mayDat(vec3 p, float w, float t) {
    return mayDatGoc(xoayY(p, gocMayTroi(viDo(p) * 57.2958, t)), w);
  }
  // Mây trong hệ đã trôi (q): xoáy thuận, xoáy nhỏ, mây vụn.
  float mayDatGoc(vec3 q, float w) {
    float lat = viDo(q) * 57.2958;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float la = (44.0 + 12.0 * fract(fi * 0.618)) * (mod(fi, 2.0) < 0.5 ? 1.0 : -1.0) * 0.01745;
      float lo = fi * 1.9 + 0.7;
      vec3 k = vec3(cos(la) * cos(lo), sin(la), -cos(la) * sin(lo));
      float d = length(q - k);
      q = xoayQuanh(q, k, 2.3 * exp(-d * d / 0.012) * sign(la));
    }
    vec3 dong, bac; tiepTuyen(q, dong, bac);
    // xoáy nhỏ: vặn miền theo góc lấy từ nhiễu
    float g = fbm(q * 2.6 + 11.0, 3, w * 2.6) * 9.0;
    q += (dong * cos(g) + bac * sin(g) * 0.7) * 0.04;
    float g2 = fbm(q * 7.0 + 4.0, 3, w * 7.0) * 7.0;
    q += (dong * cos(g2) + bac * sin(g2)) * 0.012;
    float m = fbm(q * vec3(4.5, 5.5, 4.5), 8, w * 5.5);
    float vung = 0.24 * exp(-(((lat - 6.0) / 6.0) * ((lat - 6.0) / 6.0))) + 0.26 * exp(-pow((abs(lat) - 55.0) / 12.0, 2.0)) - 0.18 * exp(-pow((abs(lat) - 24.0) / 9.0, 2.0)) + 0.1 * smoothstep(70.0, 85.0, abs(lat));
    float c = smoothstep(0.04, 0.4, m + vung);
    c *= 0.55 + 0.45 * smoothstep(-0.3, 0.4, fbm(q * 26.0, 5, w * 26.0));   // mây vụn, mây tích
    return c;
  }

  // ----- Sao Hỏa: bụi gỉ sắt, vùng tối, chỏm băng hai cực, hẻm Valles Marineris, bồn Hellas -----
  vec3 vanHoa(vec3 p, vec2 uv, float w) {
    float latD = (uv.y - 0.5) * 180.0, lonD = (uv.x - 0.5) * 360.0;
    vec3 q = p + 0.25 * vec3(fbm(p * 2.0, 3, w * 2.0), fbm(p * 2.0 + 4.0, 3, w * 2.0), fbm(p * 2.0 + 8.0, 3, w * 2.0));
    float toi = fbm(q * 2.2 + 1.5, 6, w * 2.2);
    toi += 0.25 * (1.0 - smoothstep(0.4, 1.0, elipDo(lonD, latD, vec4(70.0, 10.0, 12.0, 14.0))));     // Syrtis Major
    toi += 0.12 * smoothstep(5.0, -25.0, latD);                                                         // nửa nam cao nguyên tối hơn
    toi -= 0.35 * (1.0 - smoothstep(0.3, 1.0, elipDo(lonD, latD, vec4(-110.0, 5.0, 30.0, 22.0))));    // Tharsis sáng
    float chiTiet = fbm(p * 16.0, 6, w * 16.0);
    vec3 sang = vec3(0.42, 0.19, 0.075), vua = vec3(0.30, 0.13, 0.055), sam = vec3(0.12, 0.065, 0.040);
    vec3 c = mix(sang, vua, smoothstep(-0.25, 0.1, toi));
    c = mix(c, sam, smoothstep(0.06, 0.32, toi));
    c *= 0.88 + 0.24 * chiTiet;
    // hẻm Valles Marineris
    float vm = elipDo(lonD, latD + 1.5 * sin(lonD * 0.08), vec4(-72.0, -9.0, 28.0, 1.6));
    c = mix(c, vec3(0.13, 0.06, 0.035), (1.0 - smoothstep(0.5, 1.0, vm)) * 0.85);
    // bồn Hellas: nền sáng
    c = mix(c, vec3(0.47, 0.25, 0.12), (1.0 - smoothstep(0.5, 1.0, elipDo(lonD, latD, vec4(70.0, -42.0, 15.0, 10.0)))) * 0.7);
    // núi Olympus
    float ol = elipDo(lonD, latD, vec4(-134.0, 18.5, 6.0, 5.5));
    c = mix(c, vec3(0.36, 0.17, 0.08), (1.0 - smoothstep(0.7, 1.0, ol)) * 0.6);
    c = mix(c, vec3(0.16, 0.08, 0.05), (1.0 - smoothstep(0.08, 0.16, ol)));
    // chỏm băng
    float bacCuc = smoothstep(70.0, 75.0, latD + 4.0 * fbm(p * 6.0, 4, w * 6.0));
    float namCuc = smoothstep(-80.0, -84.0, latD + 3.0 * fbm(p * 6.0 + 2.0, 4, w * 6.0));
    c = mix(c, vec3(0.80, 0.78, 0.76), max(bacCuc, namCuc));
    return c;
  }

  // ----- Hành tinh khí: dải mây theo vĩ độ, chảy vi sai, xoáy bằng cách vặn miền nhiều tầng -----
  // manh: độ cuộn của xoáy; sanDai: độ đậm nét dải.
  vec3 vanKhi(vec3 p, float w, float t, float manh, float tocDo, out float lat0) {
    float lat = viDo(p);
    float v = 0.6 * cos(lat * 14.0) + 0.35 * cos(lat * 6.0 + 1.0);   // dòng phun xen kẽ
    vec3 q = xoayY(p, t * tocDo * v);
    vec3 dong, bac; tiepTuyen(q, dong, bac);
    float a1 = fbm(q * vec3(2.5, 11.0, 2.5) + 1.0, 4, w * 11.0) * 6.283;
    q += (dong * cos(a1) + bac * sin(a1) * 0.6) * 0.035 * manh;
    float a2 = fbm(q * vec3(6.0, 22.0, 6.0) + 5.0, 4, w * 22.0) * 6.283;
    q += (dong * cos(a2) + bac * sin(a2) * 0.6) * 0.012 * manh;
    float a3 = fbm(q * vec3(14.0, 40.0, 14.0) + 9.0, 3, w * 40.0) * 6.283;
    q += (dong * cos(a3) + bac * sin(a3) * 0.6) * 0.004 * manh;
    float a4 = fbm(q * vec3(34.0, 90.0, 34.0) + 2.0, 3, w * 90.0) * 6.283;
    q += (dong * cos(a4) + bac * sin(a4) * 0.6) * 0.0014 * manh;
    lat0 = viDo(q) + 0.02 * manh * fbm(q * vec3(2.0, 18.0, 2.0), 5, w * 18.0);
    return q;
  }

  vec3 vanMoc(vec3 p, float w, float t) {
    float latS;
    float lon = kinhDo(p);
    float lat = viDo(p);
    // Vết Đỏ Lớn (22° nam): làm lệch dải mây quanh nó
    float lonV = 0.9 + t * 0.0012;
    float dx = chenhKinh(lon, lonV) * cos(lat) / 0.20, dy = (lat + 0.384) / 0.085;
    float rr = length(vec2(dx, dy));
    vec3 pp = p;
    pp.y += 0.03 * exp(-rr * rr * 0.35) * sign(dy) * smoothstep(0.0, 1.2, abs(dy));
    pp = normalize(pp);
    vec3 q = vanKhi(pp, w, t, 1.0, 0.004, latS);
    vec3 c = bangMau(latS);
    float hat = fbm(q * vec3(12.0, 40.0, 12.0), 6, w * 40.0);
    c *= 0.86 + 0.3 * hat;
    // mây sáng cuộn và gợn tối nhỏ trong dải
    c = mix(c, vec3(0.86, 0.80, 0.70), smoothstep(0.25, 0.6, fbm(q * vec3(18.0, 50.0, 18.0) + 5.0, 5, w * 50.0)) * 0.35);
    // vệt «lông chim» xanh xám ở mép bắc đới xích đạo
    float fes = smoothstep(0.45, 0.75, nhieuG(q * vec3(9.0, 26.0, 9.0) + 3.0)) * exp(-(((latS - 0.12) / 0.03) * ((latS - 0.12) / 0.03)));
    c = mix(c, vec3(0.18, 0.20, 0.24), fes * 0.8);
    // bão trắng nhỏ ở đới ôn đới nam
    for (int i = 0; i < 5; i++) {
      float L0 = 1.3 * float(i) + 0.4 + t * 0.002;
      float ex = chenhKinh(lon, L0) * cos(lat) / 0.035, ey = (lat + 0.59) / 0.026;
      float r2 = ex * ex + ey * ey;
      c = mix(c, vec3(0.80, 0.76, 0.70), exp(-r2 * 1.6) * 0.85);
    }
    // xoáy trong Vết Đỏ Lớn
    if (rr < 1.8) {
      float goc = atan(dy, dx) + 2.4 * (1.0 - rr) * (1.0 - rr) - t * 0.05;
      vec2 xo = vec2(cos(goc), sin(goc)) * rr;
      float vxo = fbm(vec3(xo * 3.0, 1.7), 4, w * 30.0);
      vec3 mauDo = mix(vec3(0.42, 0.12, 0.05), vec3(0.62, 0.30, 0.15), smoothstep(-0.3, 0.4, vxo + rr * 0.3));
      float vien = exp(-(((rr - 1.12) / 0.16) * ((rr - 1.12) / 0.16)));
      c = mix(c, vec3(0.78, 0.70, 0.60), vien * 0.55);
      c = mix(c, mauDo, 1.0 - smoothstep(0.8, 1.05, rr));
    }
    return c;
  }

  vec3 vanTho(vec3 p, float w, float t) {
    float latS;
    vec3 q = vanKhi(p, w, t, 0.45, 0.003, latS);
    vec3 c = bangMau(latS);
    c *= 0.93 + 0.14 * fbm(q * vec3(10.0, 50.0, 10.0), 5, w * 50.0);
    // lục giác ở cực bắc
    float lon = kinhDo(q);
    float rc = 1.5708 - viDo(q);
    float goc = mod(lon + t * 0.001, 1.0472) - 0.5236;
    float rHex = 0.24 / cos(goc);
    c = mix(c, vec3(0.30, 0.34, 0.36), smoothstep(rHex + 0.01, rHex - 0.01, rc) * 0.55);
    return c;
  }

  vec3 vanThienVuong(vec3 p, float w, float t) {
    float latS;
    vec3 q = vanKhi(p, w, t, 0.25, 0.002, latS);
    vec3 c = mix(vec3(0.36, 0.62, 0.66), vec3(0.42, 0.70, 0.72), 0.5 + 0.5 * sin(latS * 9.0));
    c *= 0.97 + 0.06 * fbm(q * vec3(4.0, 30.0, 4.0), 4, w * 30.0);
    c = mix(c, vec3(0.55, 0.78, 0.78), smoothstep(0.9, 1.3, abs(latS)) * 0.6);
    return c;
  }

  vec3 vanHaiVuong(vec3 p, float w, float t) {
    float latS;
    vec3 q = vanKhi(p, w, t, 0.6, 0.004, latS);
    vec3 c = mix(vec3(0.07, 0.17, 0.55), vec3(0.12, 0.26, 0.66), 0.5 + 0.5 * sin(latS * 7.0 + 0.5 * fbm(q * 6.0, 3, w * 6.0)));
    // Vết Tối Lớn và mây trắng đi kèm
    float lon = kinhDo(p), lat = viDo(p);
    float dx = chenhKinh(lon, -1.0 + t * 0.002) * cos(lat) / 0.13, dy = (lat + 0.35) / 0.07;
    float rr = length(vec2(dx, dy));
    c = mix(c, vec3(0.03, 0.07, 0.26), 1.0 - smoothstep(0.6, 1.0, rr));
    float mayTrang = smoothstep(0.35, 0.65, fbm(q * vec3(5.0, 34.0, 5.0) + 2.0, 5, w * 34.0));
    mayTrang *= exp(-(((latS + 0.18) / 0.12) * ((latS + 0.18) / 0.12))) + 0.7 * exp(-(((latS - 0.5) / 0.08) * ((latS - 0.5) / 0.08))) + exp(-pow((dx - 0.2) * 0.8, 2.0) - pow((dy + 1.4) * 1.6, 2.0));
    c = mix(c, vec3(0.75, 0.82, 0.92), clamp(mayTrang, 0.0, 1.0) * 0.9);
    return c;
  }

  // Bộ chọn: loai 1 Thủy, 2 Kim, 3 Trái Đất, 4 Hỏa, 5 Mộc, 6 Thổ, 7 Thiên Vương, 8 Hải Vương, 9 Mặt Trăng, 10 mây Trái Đất.
  vec4 vanTheoLoai(int loai, vec3 p, vec2 uv, float w, float t) {
    if (loai == 1) return vec4(vanThuy(p, w), 1.0);
    if (loai == 2) return vec4(vanKim(p, w, t), 1.0);
    if (loai == 3) return vanDat(p, uv, w);
    if (loai == 4) return vec4(vanHoa(p, uv, w), 1.0);
    if (loai == 5) return vec4(vanMoc(p, w, t), 1.0);
    if (loai == 6) return vec4(vanTho(p, w, t), 1.0);
    if (loai == 7) return vec4(vanThienVuong(p, w, t), 1.0);
    if (loai == 8) return vec4(vanHaiVuong(p, w, t), 1.0);
    if (loai == 9) return vec4(vanTrang(p, w), 1.0);
    if (loai == 10) return vec4(1.0, 1.0, 1.0, mayDat(p, w, t));
    if (loai == 11) return vec4(1.0, 1.0, 1.0, mayDatGoc(p, w));   // mây Trái Đất lúc t = 0, chưa trôi (để nướng)
    return vec4(0.5, 0.5, 0.5, 1.0);
  }
`;

export const LOAI = { thuy: 1, kim: 2, dat: 3, hoa: 4, moc: 5, tho: 6, thienVuong: 7, haiVuong: 8, trang: 9, may: 10, mayGoc: 11 };

// Đỉnh chung cho mặt cầu: vị trí trên mặt cầu đơn vị (hệ vật), toạ độ ảnh, và các véc-tơ hướng sáng, hướng nhìn
// viết trong hệ vật (để tính sáng ngay trong hệ vật, pháp tuyến lệch theo hố va chạm không cần đổi hệ).
// uNguon: xyz là hướng tới nguồn sáng (w = 0) hoặc vị trí nguồn sáng (w = 1), trong hệ thế giới.
export const GLSL_DINH_CAU = /* glsl */ `
  uniform vec4 uNguon;
  varying vec3 vP; varying vec2 vUv; varying vec3 vLo; varying vec3 vVo;
  void main() {
    vP = position; vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    mat3 nguoc = transpose(mat3(modelMatrix));
    vec3 L = uNguon.w > 0.5 ? uNguon.xyz - w.xyz : uNguon.xyz;
    vLo = nguoc * L;
    vVo = nguoc * (cameraPosition - w.xyz);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
