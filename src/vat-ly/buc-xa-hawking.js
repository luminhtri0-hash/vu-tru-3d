import { C, G } from './hang-so.js';
// h và k_B mang giá trị SI xác định chính xác từ năm 2019.
export const HBAR = 6.62607015e-34/(2*Math.PI);
export const KB = 1.380649e-23;
export const R_H = m=>2*G*m/(C*C);
export const T_H = m=>HBAR*C**3/(8*Math.PI*G*m*KB);
export const M_CAN_BANG = t=>HBAR*C**3/(8*Math.PI*G*KB*t);
export const T_NEN=2.725;
export const M_PLANCK=Math.sqrt(HBAR*C/G);
export const DINH_X=2.821439372122;
export const pho = x=>x>0?x**3/Math.expm1(x):0;
// Minh họa một diện tích chân trời phát photon như vật đen lý tưởng, chưa có hệ số truyền.
export const P_LY_TUONG=m=>HBAR*C**6/(15360*Math.PI*G**2*m**2);
export const THOI_GIAN_LY_TUONG=m=>5120*Math.PI*G**2*m**3/(HBAR*C**4);
// Khối lượng Trái Đất (IAU 2015: GM⊕ = 3,986004e14 m³/s²), chỉ để đặt mốc trên thước.
export const M_TRAI_DAT = 3.986004e14/G;
// Phổ của bể nhiệt độ T_nền trên cùng trục x = hν/(k_B T_H), cùng thang với pho(): r = T_nền/T_H.
export const phoBe = (x,r) => x>0&&r>0 ? x**3/Math.expm1(x/r) : 0;
