# Giấy phép nội dung

© 2026 Trí Lữ.

Kho này dùng hai giấy phép:

- **Mã nguồn** theo giấy phép MIT (tệp [`LICENSE`](LICENSE)).
- **Nội dung học** theo giấy phép **Creative Commons Ghi công – Phi thương mại – Chia sẻ tương tự 4.0 Quốc tế** (CC BY-NC-SA 4.0). Văn bản đầy đủ: <https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.vi> (tiếng Việt), <https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode> (tiếng Anh).

## Những gì là «nội dung học»

| Ở đâu | Gồm những gì |
|---|---|
| `src/noi-dung/` | lời giảng, lời đọc, câu hỏi tự kiểm, bảng thuật ngữ, tên và mô tả các phần của khoá học |
| `src/ngon-ngu/en/`, `src/ngon-ngu/zh-CN/`, `src/ngon-ngu/ja/`, `src/ngon-ngu/vi/`, `src/ngon-ngu/thuat-ngu.json` | chữ của bài và giao diện ở bốn thứ tiếng (bản gốc và bản dịch) |
| `src/canh/*.js` | **chỉ phần chữ**: tên bài, mô tả, ý chính, các bước bài giảng (`baiGiang`), con số đáng nhớ (`conSo`), điều hay hiểu sai (`hieuDung`), nguồn (`nguon`) và các nhãn chữ hiện trên mô hình. Phần mã trong cùng tệp (hàm, cách dựng hình, mô phỏng) theo MIT. |
| `giong-doc/**/*.mp3` | tệp giọng đọc lời giảng |
| `tai-lieu/anh/`, `tai-nguyen-web/`, `app-mac/BieuTuong.icns` | ảnh chụp màn hình, ảnh chia sẻ, biểu tượng app |

Những thứ **không** thuộc giấy phép này:

- thư viện, phông chữ và dữ liệu của bên thứ ba (ví dụ dữ liệu sao trong `src/du-lieu/bau-troi.js`, bờ biển Natural Earth): giữ giấy phép riêng, xem [`NOTICE.md`](NOTICE.md);
- số liệu và hằng số vật lý tự thân (khối lượng Mặt Trời, tốc độ ánh sáng…): là dữ kiện, không thuộc quyền của ai; nguồn được ghi trong từng bài.

## Ghi công khi dùng lại

Ghi như sau (hoặc tương đương):

> «Vũ trụ 3D» của Trí Lữ, <https://trilu.edu.vn/vu-tru-3d/>, giấy phép CC BY-NC-SA 4.0.

Nếu bạn sửa, nói rõ là đã sửa. Bản sửa phải dùng cùng giấy phép. Không dùng cho mục đích thương mại (bán khoá học, đặt quảng cáo…) khi chưa được Trí Lữ đồng ý bằng văn bản. Dạy học trên lớp, chiếu cho học sinh, dịch sang thứ tiếng khác để dùng phi thương mại thì cứ dùng.

Muốn dùng theo điều kiện khác (thương mại, bỏ điều kiện chia sẻ tương tự): liên hệ qua <https://trilu.edu.vn>.

---

## Content license (English summary)

© 2026 Trí Lữ. Source code is under the MIT License (`LICENSE`). Lesson content is under **CC BY-NC-SA 4.0** (<https://creativecommons.org/licenses/by-nc-sa/4.0/>). "Lesson content" means: everything in `src/noi-dung/`; the text files in `src/ngon-ngu/` (all four languages); in `src/canh/*.js`, only the lesson text (titles, descriptions, lecture steps, key numbers, misconceptions, sources and on-screen labels), while the code in those files is MIT; the voice recordings in `giong-doc/`; and the images in `tai-lieu/anh/`, `tai-nguyen-web/` and `app-mac/BieuTuong.icns`. Third-party libraries, fonts and data keep their own licenses (see `NOTICE.md`). Physical constants and measured values are facts and are not covered.

Suggested attribution: *"3D Universe (Vũ trụ 3D) by Trí Lữ, https://trilu.edu.vn/vu-tru-3d/, CC BY-NC-SA 4.0."*
