# Ghi công và giấy phép của bên thứ ba

«Vũ trụ 3D» dùng các thư viện, phông chữ và dữ liệu dưới đây. Bản dựng (`dist/index.html`, `dist/web/`) **nhúng** một phần của chúng; các gói chỉ dùng lúc dựng thì không nằm trong trang. Mỗi thứ giữ giấy phép riêng của nó; giấy phép của kho này (MIT cho mã, CC BY-NC-SA 4.0 cho nội dung) không thay đổi điều đó.

*Third-party libraries, fonts and data used by this project, with their licenses. Items marked "embedded" are bundled into the built page.*

## Thư viện mã

| Thành phần | Phiên bản | Dùng để | Nhúng vào trang | Giấy phép |
|---|---|---|---|---|
| [three.js](https://threejs.org) và các phần bổ sung trong `three/addons` (OrbitControls, Line2/LineSegments2, EffectComposer, UnrealBloomPass, CSS2DRenderer, RoomEnvironment, RoundedBoxGeometry, BufferGeometryUtils) | 0.187.0 | dựng hình 3D | có | MIT, © 2010–2026 three.js authors |
| [KaTeX](https://katex.org) | 0.16.11 | dựng công thức toán | có | MIT, © 2013–2020 Khan Academy and other contributors |
| [topojson-client](https://github.com/topojson/topojson-client) | 3.1.0 | đọc bản đồ bờ biển | có | ISC, © 2012–2019 Michael Bostock |
| [esbuild](https://esbuild.github.io) | 0.28.2 | đóng gói mã lúc dựng | không | MIT, © 2020 Evan Wallace |
| [d3-celestial](https://github.com/ofrohn/d3-celestial) | 0.7.35 | nguồn dữ liệu bầu trời (chỉ đọc lúc chạy `cong-cu/dong-goi-bau-troi.mjs`) | không (chỉ dữ liệu đã đóng gói lại, xem dưới) | BSD-3-Clause, © 2015 Olaf Frohn |

Văn bản giấy phép đầy đủ của từng gói nằm trong `node_modules/<tên gói>/LICENSE` sau khi chạy `npm install`.

## Phông chữ

| Phông | Ở đâu | Giấy phép |
|---|---|---|
| Phông KaTeX (KaTeX_Main, KaTeX_Math, KaTeX_AMS, KaTeX_Size1–4, KaTeX_Caligraphic Regular), định dạng woff2 | nhúng thẳng vào trang lúc dựng (`build.mjs`, hàm `cssKatex`); các phông KaTeX không dùng tới được bỏ | phát hành trong gói `katex` theo giấy phép MIT của KaTeX |
| Chữ thường của giao diện | phông hệ thống của máy người dùng (`system-ui`), không nhúng | — |

## Dữ liệu

| Dữ liệu | Ở đâu trong kho | Nguồn | Giấy phép, điều kiện |
|---|---|---|---|
| Vị trí, cấp sao, màu của 25 723 sao tới cấp 7,5 | `src/du-lieu/bau-troi.js` (đóng gói lại từ `stars.8.json` của d3-celestial) | XHIP: An Extended Hipparcos Compilation, Anderson và Francis (2012), Astronomy Letters 38, 331; danh mục VizieR V/137D | phân phối lại trong d3-celestial (BSD-3-Clause); danh mục gốc công bố qua CDS/VizieR |
| Đường viền dải Ngân Hà (5 mức sáng) | `src/du-lieu/bau-troi.js` (từ `mw.json` của d3-celestial) | Milky Way Outline Catalog, Jose R. Vieira (skymap.com) | phân phối lại trong d3-celestial (BSD-3-Clause) |
| Nét nối chòm sao, tên riêng của sao | `src/du-lieu/bau-troi.js` (từ `constellations.lines.json`, `starnames.json` của d3-celestial) | d3-celestial; theo readme của gói, tên sao tổng hợp từ các danh mục VizieR IV/27A (Kostjuk 2002), IV/22 (Smith 1996), GCVS, Gliese 1991 | BSD-3-Clause (chỉ dùng tên riêng tiếng Anh, không dùng các bản dịch tên sao trong gói) |
| Bờ biển Trái Đất tỉ lệ 1:50 triệu | nhúng lúc dựng từ gói `world-atlas` (`land-50m.json`) | [Natural Earth](https://www.naturalearthdata.com) 4.1.0, qua gói world-atlas của Mike Bostock | Natural Earth: phạm vi công cộng (public domain); gói world-atlas: ISC |
| Quỹ đạo gần đúng của các hành tinh | `src/vat-ly/he-mat-troi.js` | NASA/JPL, «Approximate Positions of the Planets» (E. M. Standish, J. G. Williams) | số liệu khoa học công bố, ghi nguồn |
| Vị trí và vận tốc hai tàu Voyager | `src/vat-ly/he-mat-troi.js` | NASA/JPL Horizons, lấy ngày 11/11/2026 | số liệu khoa học công bố, ghi nguồn |
| Hằng số vật lý và thiên văn | `src/vat-ly/hang-so.js` và các tệp trong `src/vat-ly/` | CODATA 2018 và 2022 (NIST), IAU 2012/2015, NASA/JPL; mô hình vũ trụ theo Planck 2018 | dữ kiện; nguồn ghi trong mã và trong mục «nguồn» của từng bài |
| Số liệu thí nghiệm và quan sát dẫn trong bài (EHT, GRAVITY, LIGO, MICROSCOPE…) | phần `nguon` của từng bài trong `src/canh/` và `src/noi-dung/` | các bài báo được dẫn tên ngay tại chỗ | dữ kiện, có trích dẫn |

## Giọng đọc

| Thứ | Cách tạo | Ghi chú |
|---|---|---|
| Tệp `giong-doc/algieba/*.mp3` (giọng «Algieba», tiếng Việt) | tạo bằng dịch vụ chuyển văn bản thành giọng nói Google Cloud Text-to-Speech, dòng giọng Chirp 3 HD, từ lời đọc trong `src/noi-dung/loi-doc.js`, bằng `cong-cu/tao-giong-doc-google.py`; chuẩn hoá độ to bằng FFmpeg | Lời đọc do Trí Lữ soạn. Tệp tiếng phân phối cùng nội dung bài theo CC BY-NC-SA 4.0, trong phạm vi điều khoản dịch vụ của Google Cloud. |
| `cong-cu/tao-giong-doc.py` (công cụ cũ) | dùng thư viện edge-tts (giọng Microsoft) | không có tệp tiếng nào trong kho được tạo bằng công cụ này |

Âm thanh giao diện, tiếng mô hình và nhạc nền đều được **tổng hợp bằng mã** lúc chạy (WebAudio, `src/khung/am-thanh.js`), không có tệp tiếng nào khác.

## Công cụ dùng khi phát triển (không phân phối)

Google Chrome (chạy ẩn để kiểm và chụp ảnh), FFmpeg, Google Cloud SDK, mlx-whisper (nghe lại giọng đọc để kiểm), Swift/Xcode Command Line Tools (vỏ app Mac). Các công cụ này không nằm trong kho và không nằm trong bản dựng.
