// Màn xa, gần đúng góc nhỏ. lambda dùng pm, a và d dùng nm, L dùng m, x dùng mm.
// λ(pm) / d(nm) × L(m) có cùng giá trị số với khoảng vân tính bằng mm.
export const MAC_DINH = Object.freeze({ lambda: 50, d: 200, a: 50, L: 1, hai: true, v: 1 });
export const RONG_NUA_MAN = 1.25;
export const khoangVan = ({ lambda, L, d }) => lambda * L / d;
export const nutBao = ({ lambda, L, a }) => lambda * L / a;
export const lechPha = (x, ts) => 2 * Math.PI * x / khoangVan(ts);

export function bao(x, ts) {
  const beta = Math.PI * x / nutBao(ts);
  if (Math.abs(beta) < 1e-9) return 1;
  const sinc = Math.sin(beta) / beta;
  return sinc * sinc;
}

// Mật độ tương đối so với tâm trong chính cấu hình đang chọn.
// Mẫu lấy bên dưới được chuẩn hoá theo tổng xác suất trên phần màn hữu hạn.
export function matDo(x, ts) {
  const nen = bao(x, ts);
  if (!ts.hai) return nen;
  return nen * (1 + ts.v * Math.cos(lechPha(x, ts))) / (1 + ts.v);
}

export function lapBangTichLuy(bang, ts) {
  let tong = 0;
  const buoc = 2 * RONG_NUA_MAN / bang.length;
  for (let i = 0; i < bang.length; i++) {
    const x = -RONG_NUA_MAN + (i + 0.5) * buoc;
    tong += matDo(x, ts);
    bang[i] = tong;
  }
  for (let i = 0; i < bang.length; i++) bang[i] /= tong;
}

export function viTriHat(bang, soNgauNhien, lechTrongO) {
  let trai = 0, phai = bang.length - 1;
  while (trai < phai) {
    const giua = (trai + phai) >>> 1;
    if (soNgauNhien < bang[giua]) phai = giua;
    else trai = giua + 1;
  }
  return -RONG_NUA_MAN + 2 * RONG_NUA_MAN * (trai + lechTrongO) / bang.length;
}

export function datThuThach(ten, ts, x, daKeoKhe, daKeoDau) {
  if (ten === 'khe') return daKeoKhe && ts.hai && ts.v === 1 && ts.lambda === 50 && Math.abs(khoangVan(ts) - 0.125) < 0.006;
  const dungViTri = daKeoDau && ts.hai && ts.lambda === 50 && ts.d === 200 && Math.abs(x - 0.125) <= 0.015;
  return dungViTri && (ten === 'toi' ? ts.v === 1 : ten === 'dau' && ts.v === 0);
}

