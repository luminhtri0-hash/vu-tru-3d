// Khung nhỏ dùng chung cho các bộ kiểm số của từng bài.
//   import { kiem, kiemDung, muc, tongKet } from './khung-kiem.mjs';
//   muc('1. Hệ số Lorentz');
//   kiem('γ tại 0,6 c', gamma(0.6), 1.25, 1e-12);
//   tongKet();

let dat = 0, hong = 0;

export function muc(ten) { console.log(`\n${ten}`); }

// So giá trị tính được với giá trị mong đợi, trong sai số tuyệt đối cho phép.
export function kiem(ten, giaTri, mongDoi, saiSo, donVi = '') {
  const ok = Number.isFinite(giaTri) && Math.abs(giaTri - mongDoi) <= saiSo;
  ok ? dat++ : hong++;
  console.log(`${ok ? '  đạt ' : '  HỎNG'}  ${ten}: ${Number(Number(giaTri).toPrecision(8))}${donVi} (mong đợi ${mongDoi}${donVi} ± ${saiSo})`);
  return ok;
}

// So theo sai số tương đối.
export function kiemTiLe(ten, giaTri, mongDoi, tiLe, donVi = '') {
  return kiem(ten, giaTri, mongDoi, Math.abs(mongDoi) * tiLe, donVi);
}

// Kiểm một điều kiện đúng/sai.
export function kiemDung(ten, dieuKien) {
  dieuKien ? dat++ : hong++;
  console.log(`${dieuKien ? '  đạt ' : '  HỎNG'}  ${ten}`);
  return !!dieuKien;
}

export function tongKet() {
  console.log(`\nTổng: ${dat} đạt, ${hong} hỏng.`);
  if (hong) process.exitCode = 1;
}
