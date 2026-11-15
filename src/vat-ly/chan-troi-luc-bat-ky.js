// Nón ánh sáng và các chân trời nhìn từ một thời điểm «bây giờ» bất kỳ (hệ số tỉ lệ aN), cho vũ trụ phẳng
// tạo bởi taoVuTru() (src/vat-ly/chan-troi-vu-tru.js). Dùng cho phần kéo «bây giờ» của Bài 19 (Bản 3).
// Đơn vị: tỉ năm (Gyr), tỉ năm ánh sáng (Gly), c = 1. Khoảng cách đồng chuyển χ quy về hôm nay (a = 1).
//
//   nón quá khứ của «bây giờ»:  χ(a) = η(aN) − η(a)        (a ≤ aN)
//   nón tương lai:              χ(a) = η(a) − η(aN)        (a ≥ aN)
//   chân trời hạt lúc aN:       χ = η(aN),        khoảng cách thật aN·η(aN)
//   chân trời sự kiện lúc aN:   χ = η(∞) − η(aN), khoảng cách thật aN·(η(∞) − η(aN))
//   mặt cầu Hubble lúc aN:      khoảng cách thật c/H(aN), đồng chuyển c/(aN·H(aN))
// Chỉ có công thức, không dùng three.js, để bộ kiểm số đọc được (kiem-tra/kiem-vu-tru-4c.mjs, mục 9).

export function nhinTuLuc(V, aN = 1) {
  const etaN = V.etaTai(aN);
  const tN = V.tTai(aN);
  const sk = V.etaVoCung - etaN;
  return {
    aN, etaN, tN,
    chiNon: (a) => etaN - V.etaTai(a),
    chiNonTL: (a) => V.etaTai(a) - etaN,
    chanTroiHat: etaN,                    // đồng chuyển
    dChanTroiHat: aN * etaN,              // thật
    chanTroiSuKien: sk,
    dChanTroiSuKien: aN * sk,
    dHubble: 1 / V.H(aN),
    chiHubble: 1 / (aN * V.H(aN)),
    // Thiên hà ở khoảng cách đồng chuyển chi: ánh sáng tới ta lúc aN rời nó lúc nào (nếu đã kịp tới).
    thienHa(chi) {
      const lienLac = chi < sk;            // tín hiệu ta gửi lúc aN còn tới được nó (và ánh sáng nó phát lúc aN còn tới ta)
      if (!(chi < etaN)) return { thay: false, chi, lienLac, dNay: aN * chi, vNay: V.vLui(aN, chi) };
      const aP = V.aTuEta(etaN - chi);
      return {
        thay: true, chi, lienLac, aPhat: aP, z: aN / aP - 1,
        tPhat: V.tTai(aP), tDiDuong: tN - V.tTai(aP),
        dPhat: aP * chi, dNay: aN * chi, vPhat: V.vLui(aP, chi), vNay: V.vLui(aN, chi),
      };
    },
  };
}

// Thử thách của Bài 19 (đích và dung sai) và quy đổi âm thanh.
export const THU_THACH_4C = {
  giot: { dPhat: 5.82 },                   // bước 3: ánh sáng rời thiên hà khi nó ở gần đỉnh giọt nước (cực đại 5,85)
  v2: { v: 2, sai: 0.08 },                 // bước 4: lúc phát, thiên hà lùi nhanh gấp đôi ánh sáng
  hatNua: { d: 23.05, sai: 1 },            // bước 5: chân trời hạt (khoảng cách thật) bằng nửa hôm nay
  sk: { tren: 0.2, duoi: 1.3 },            // bước 6: vừa ra ngoài chân trời sự kiện, χ_sk + 0,2 … χ_sk + 1,3
};
// Âm kéo dài khi kéo thiên hà: cao độ 660/(1 + z) Hz, z là dịch chuyển đỏ của ánh sáng nó tới ta lúc «bây giờ».
export const TIENG_GOC_4C = 660;
export const tanSoTieng4c = (z) => TIENG_GOC_4C / (1 + z);
