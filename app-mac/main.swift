// Vỏ app Mac cho Vũ trụ 3D: một cửa sổ chứa trang HTML tự chứa (Resources/index.html).
// Không dùng mạng. Có tiếng (tổng hợp ngay trong trang, và giọng đọc lời giảng nếu có tệp); các chế độ kiểm thì im lặng tuyệt đối.
//
// Chế độ thường:           mở cửa sổ, chạy như một app bình thường.
// --tu-kiem <thư mục>:      mở ẩn, lần lượt mở từng bài, đi qua mọi bước của bài giảng, chụp ảnh và ghi nhật ký vào thư mục rồi thoát.
// --chup-bieu-tuong <tệp>:  mở ẩn, chụp cảnh lỗ đen thành ảnh vuông bo góc 1024 điểm ảnh để làm biểu tượng.
// --thu-mo:                 mở như thật (có thực đơn) nhưng nằm dưới các cửa sổ khác, không giành bàn phím,
//                           in kết quả rồi tự thoát sau vài giây. Dùng để kiểm đường khởi động thường.

import Cocoa
import WebKit

final class UngDung: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var ngonNgu = Locale.preferredLanguages.first ?? "vi"
    var tuDienMac: [String: [String: String]] = [:]
    func chuMac(_ khoa: String, _ goc: String) -> String {
        let ma = ngonNgu.lowercased().hasPrefix("zh") ? "zh-CN" : String(ngonNgu.prefix(2))
        return tuDienMac[ma]?["mac." + khoa] ?? goc
    }
    var cuaSo: NSWindow!
    var web: WKWebView!
    let thamSo = CommandLine.arguments
    // CÔNG TẮC NHẬT KÝ (bấm, phím, hiệu năng; chỉ ghi tại máy này). Mặc định TẮT. Máy đã có thư mục nhật ký (máy dùng từ bản 3.1,
    // bật từ bản 3.1) thì giữ BẬT. Người dùng gạt công tắc trong bảng cài đặt của app thì nhớ lựa chọn đó (NhatKyHieuNang).
    // Ép cho một lần chạy: --nhat-ky-hieu-nang (bật) hoặc --khong-nhat-ky (tắt). Các lượt kiểm không bao giờ ghi.
    lazy var nhatKyBat: Bool = {
        if thamSo.contains("--khong-nhat-ky") { return false }
        if thamSo.contains("--nhat-ky-hieu-nang") { return true }
        if UserDefaults.standard.object(forKey: "NhatKyHieuNang") != nil { return UserDefaults.standard.bool(forKey: "NhatKyHieuNang") }
        return FileManager.default.fileExists(atPath: NSHomeDirectory() + "/Library/Logs/VuTru3D")
    }()
    var choGhiNhatKy: Bool { nhatKyBat && !chayAn && !thuMo }
    var suKienCuaSo: [String] = []      // lượt đo thật: các lần cửa sổ bị che rồi hiện lại (mili giây từ lúc trang nạp xong)
    var thuMucKiem: String? { giaTri("--tu-kiem") }
    var tepBieuTuong: String? { giaTri("--chup-bieu-tuong") }
    var chayAn: Bool { thuMucKiem != nil || tepBieuTuong != nil }
    var thuMo: Bool { thamSo.contains("--thu-mo") || thuThat != nil || doThat != nil }
    // --do-that <thư mục> --kich-ban <tệp.js>: ĐO như người dùng thật. Cửa sổ cỡ thật, đặt ở màn hình nét gấp đôi (hoặc theo
    // --khung x,y,rộng,cao), gần như trong suốt và không nhận chuột nên không che việc của người đang dùng máy; âm thanh chạy
    // thật nhưng đầu ra câm. Tệp kịch bản được chèn vào trang trước khi nạp; khi nó đặt window.__doXong (chuỗi JSON) thì app
    // ghi chuỗi đó vào <thư mục>/do-that.json rồi thoát. --ro: cho cửa sổ hiện rõ. --toi-da 90: số giây chờ tối đa.
    var doThat: String? { giaTri("--do-that") }
    var treLonNhat = 0.0
    var dangHetGio = false
    // --thu-that <thư mục>: chạy đúng đường của người dùng thật (âm thanh chạy thật nhưng đầu ra câm), tự bấm «Bắt đầu học»,
    // tự rê chuột, đổi bài, canh xem trang có bị treo không, ghi kết quả vào <thư mục>/thu-that.txt. Thêm --hien để cửa sổ hiện thật.
    var thuThat: String? { giaTri("--thu-that") }
    var ketQuaThu: [String] = []
    var buocThu = "chưa bắt đầu"
    var lanTraLoi = Date()
    // --chi-bai 4,9: chỉ tự kiểm các bài này (đo nhanh). --thu-js "…": chèn một dòng mã vào trang trước khi nạp (đo thử cấu hình).
    var chiBai: Set<Int>? { giaTri("--chi-bai").map { Set($0.split(separator: ",").compactMap { Int($0) }) } }
    var nhatKy: [String] = []

    func giaTri(_ co: String) -> String? {
        guard let i = thamSo.firstIndex(of: co), i + 1 < thamSo.count else { return nil }
        return thamSo[i + 1]
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        if let duong = Bundle.main.url(forResource: "thuc-don", withExtension: "json"),
           let data = try? Data(contentsOf: duong),
           let bang = try? JSONDecoder().decode([String: [String: String]].self, from: data) {
            tuDienMac = bang
        }
        let cauHinh = WKWebViewConfiguration()
        cauHinh.userContentController.add(self, name: "vuTru")
        if chayAn || thuMo {
            // Lần chạy kiểm: không để lại dấu vết, và báo cho trang biết phải im lặng tuyệt đối (không tạo âm thanh nào).
            cauHinh.websiteDataStore = .nonPersistent()
            cauHinh.mediaTypesRequiringUserActionForPlayback = .all
            let nhuThat = thuThat != nil || doThat != nil
            let dau = nhuThat ? "window.__VT_THU = { tiengCam: true };" : "window.__VT_IM_LANG = true;"
            if nhuThat { cauHinh.mediaTypesRequiringUserActionForPlayback = [] }
            // Giọng giảng chạy bằng HTMLMediaElement, độc lập với gain câm của Web Audio.
            let camTepTieng = "const phatGoc = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { this.muted = true; return phatGoc.call(this); };"
            var kichBan = ""
            if let tep = giaTri("--kich-ban") { kichBan = (try? String(contentsOfFile: tep, encoding: .utf8)) ?? "" }
            cauHinh.userContentController.addUserScript(WKUserScript(source: dau + camTepTieng + (giaTri("--thu-js") ?? "") + "\n;\n" + kichBan, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        } else {
            // Báo cho trang biết công tắc nhật ký đang bật hay tắt (trang hiện công tắc này trong bảng cài đặt).
            cauHinh.userContentController.addUserScript(WKUserScript(source: "window.__VT_NHAT_KY = \(choGhiNhatKy ? "true" : "false");", injectionTime: .atDocumentStart, forMainFrameOnly: true))
            // Chạy thật: trang tự quyết lúc nào phát (chỉ sau khi người dùng bấm «Bắt đầu học»); cho phép giọng đọc tự sang bước.
            cauHinh.mediaTypesRequiringUserActionForPlayback = []
        }
        web = WKWebView(frame: .zero, configuration: cauHinh)
        web.navigationDelegate = self
        web.setValue(false, forKey: "drawsBackground")

        let manHinh = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        var rong = min(1600, manHinh.width * 0.92), cao = min(1000, manHinh.height * 0.92)
        if thuMucKiem != nil { rong = 1440; cao = 900 }
        if tepBieuTuong != nil { rong = 880; cao = 880 }
        cuaSo = NSWindow(contentRect: NSRect(x: 0, y: 0, width: rong, height: cao),
                         styleMask: [.titled, .closable, .miniaturizable, .resizable],
                         backing: .buffered, defer: false)
        cuaSo.title = chuMac("ten", "Vũ trụ 3D")
        cuaSo.appearance = NSAppearance(named: .darkAqua)
        cuaSo.backgroundColor = .black
        cuaSo.minSize = NSSize(width: 720, height: 520)
        cuaSo.collectionBehavior = [.fullScreenPrimary]
        cuaSo.isReleasedWhenClosed = false
        cuaSo.contentView = web
        cuaSo.center()
        if !chayAn && !thuMo { cuaSo.setFrameAutosaveName("VuTru3D.CuaSoChinh") }   // nhớ vị trí cửa sổ cho lần sau

        if chayAn {
            // Trong suốt hoàn toàn, nằm dưới mọi cửa sổ, không nhận chuột: người dùng không thấy gì.
            cuaSo.alphaValue = 0
            cuaSo.ignoresMouseEvents = true
            cuaSo.orderBack(nil)
        } else if thuMo {
            dungThucDon()
            if doThat != nil {
                // Đặt ở màn hình nét gấp đôi (màn hình MacBook) nếu có, vì đó là nơi nặng nhất; hoặc đúng khung được chỉ định.
                if let k = giaTri("--khung")?.split(separator: ",").compactMap({ Double($0) }), k.count == 4 {
                    cuaSo.setFrame(NSRect(x: k[0], y: k[1], width: k[2], height: k[3]), display: false)
                } else if let net = NSScreen.screens.first(where: { $0.backingScaleFactor >= 2 }) ?? NSScreen.screens.first {
                    let v = net.visibleFrame
                    let r = min(1600, v.width * 0.92), c = min(1032, v.height * 0.96)
                    cuaSo.setFrame(NSRect(x: v.minX + (v.width - r) / 2, y: v.minY + (v.height - c) / 2, width: r, height: c), display: false)
                }
                // Ở Space đang dùng, một cửa sổ thường có thể bị cửa sổ toàn màn hình che kín.
                // WebKit ngừng requestAnimationFrame khi bị che, dù JavaScript vẫn trả lời.
                // Giữ cửa sổ đo ở lớp nổi và trên mọi Space, không nhận chuột hoặc lấy bàn phím.
                cuaSo.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .ignoresCycle]
                cuaSo.level = .floating
                cuaSo.alphaValue = thamSo.contains("--ro") ? 1 : 0.02
                cuaSo.ignoresMouseEvents = true
                cuaSo.orderFrontRegardless()
            } else if thamSo.contains("--hien") { cuaSo.alphaValue = 0.02; cuaSo.ignoresMouseEvents = true; cuaSo.orderFrontRegardless() } else { cuaSo.orderBack(nil) }
        } else {
            dungThucDon()
            ghiNhatKy("{\"loai\":\"mo-app\",\"ban\":\"\(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?")\",\"cuaSo\":[\(Int(cuaSo.frame.width)),\(Int(cuaSo.frame.height))],\"manHinh\":\(NSScreen.screens.count)}")
            theoDoiCuaSo()      // các móc luôn gắn; có ghi hay không do công tắc quyết lúc ghi
            cuaSo.makeKeyAndOrderFront(nil)
            cuaSo.makeFirstResponder(web)
            NSApp.activate(ignoringOtherApps: true)
        }

        guard let tep = Bundle.main.url(forResource: "index", withExtension: "html") else {
            baoLoi(chuMac("thieu-trang", "Thiếu tệp index.html trong app."))
            return
        }
        if let chu = giaTri("--bai"), let so = Int(chu), so > 0,
           var url = URLComponents(url: tep, resolvingAgainstBaseURL: false) {
            url.queryItems = [URLQueryItem(name: "bai", value: String(so))]
            web.loadFileURL(url.url ?? tep, allowingReadAccessTo: tep.deletingLastPathComponent())
        } else {
            web.loadFileURL(tep, allowingReadAccessTo: tep.deletingLastPathComponent())
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ notification: Notification) { ghiNhatKy("{\"loai\":\"thoat-app\"}") }

    // Tiến trình hiển thị trang bị hệ thống tắt (thiếu bộ nhớ, card đồ hoạ quá tải…): cửa sổ sẽ đứng hình hoặc trắng.
    // Ghi lại và tự nạp lại trang (tối đa hai lần) thay vì để người dùng nhìn cửa sổ chết.
    var soLanNapLai = 0
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        ghiNhatKy("{\"loai\":\"tien-trinh-trang-bi-tat\",\"lan\":\(soLanNapLai + 1)}")
        if chayAn { return }
        soLanNapLai += 1
        if soLanNapLai <= 2 { webView.reload() }
    }
    func theoDoiCuaSo() {
        let tt = NotificationCenter.default
        tt.addObserver(forName: NSWindow.didBecomeKeyNotification, object: cuaSo, queue: .main) { _ in self.ghiNhatKy("{\"loai\":\"cua-so-duoc-chon\"}") }
        tt.addObserver(forName: NSWindow.didResignKeyNotification, object: cuaSo, queue: .main) { _ in self.ghiNhatKy("{\"loai\":\"cua-so-thoi-duoc-chon\"}") }
        tt.addObserver(forName: NSWindow.willCloseNotification, object: cuaSo, queue: .main) { _ in self.ghiNhatKy("{\"loai\":\"dong-cua-so\"}") }
        tt.addObserver(forName: NSWindow.didChangeOcclusionStateNotification, object: cuaSo, queue: .main) { _ in
            self.ghiNhatKy(self.cuaSo.occlusionState.contains(.visible) ? "{\"loai\":\"cua-so-hien\"}" : "{\"loai\":\"cua-so-bi-che-het\"}")
        }
    }

    // Trang web nhờ app làm việc mà trình duyệt nhúng không tự làm được (toàn màn hình).
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let lenh = message.body as? String else { return }
        if lenh.hasPrefix("ngon-ngu:") {
            let ma = String(lenh.dropFirst("ngon-ngu:".count))
            guard ["vi", "en", "zh-CN", "ja"].contains(ma) else { return }
            ngonNgu = ma
            cuaSo.title = chuMac("ten", "Vũ trụ 3D")
            if !chayAn { dungThucDon() }
            return
        }
        if lenh == "nhat-ky:bat" || lenh == "nhat-ky:tat" {
            guard !chayAn && !thuMo else { return }
            nhatKyBat = lenh == "nhat-ky:bat"
            UserDefaults.standard.set(nhatKyBat, forKey: "NhatKyHieuNang")
            ghiNhatKy("{\"loai\":\"bat-nhat-ky\"}")
            return
        }
        if lenh == "toan-man-hinh" { cuaSo.toggleFullScreen(nil) }
        else if lenh.hasPrefix("{") { ghiNhatKy(lenh) }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if thuMucKiem != nil { DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { self.kiemBai(0) } }
        else if tepBieuTuong != nil { DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) { self.chupBieuTuong() } }
        else if doThat != nil { chayDoThat() }
        else if thuThat != nil { chayThuThat() }
        else if thuMo {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                self.chay("JSON.stringify({ ungDung: !!window.__vt, bai: window.__vt ? (window.__vt.soBai ? window.__vt.soBai() : window.__vt.chiSo + 1) : null, chao: !!document.getElementById('chao'), loi: document.getElementById('loi').hidden ? null : document.getElementById('loi').textContent, thucDon: true })") { kq in
                    print("THU-MO: \(kq) | cửa sổ \(Int(self.cuaSo.frame.width))×\(Int(self.cuaSo.frame.height)) | thực đơn \(NSApp.mainMenu?.items.count ?? 0) mục")
                    NSApp.terminate(nil)
                }
            }
        }
    }

    // Nhật ký hiệu năng: mỗi dòng là một mục JSON do trang gửi, kèm giờ. Chỉ nằm trên máy này; quá 1 MB thì ghi lại từ đầu.
    func ghiNhatKy(_ muc: String) {
        guard choGhiNhatKy else { return }
        let thuMuc = NSHomeDirectory() + "/Library/Logs/VuTru3D"
        let tep = thuMuc + "/hieu-nang.log"
        let fm = FileManager.default
        try? fm.createDirectory(atPath: thuMuc, withIntermediateDirectories: true)
        if let co = (try? fm.attributesOfItem(atPath: tep))?[.size] as? Int, co > 1_000_000 { try? fm.removeItem(atPath: tep) }
        let dinhDang = DateFormatter(); dinhDang.dateFormat = "dd/MM/yyyy HH:mm:ss"
        let dong = dinhDang.string(from: Date()) + " " + String(muc.prefix(600)) + "\n"
        if let tay = FileHandle(forWritingAtPath: tep) { tay.seekToEndOfFile(); tay.write(dong.data(using: .utf8)!); tay.closeFile() }
        else { try? dong.write(toFile: tep, atomically: true, encoding: .utf8) }
    }

    func baoLoi(_ chu: String) {
        if chayAn { FileHandle.standardError.write((chu + "\n").data(using: .utf8)!); NSApp.terminate(nil); return }
        let hop = NSAlert()
        hop.messageText = chuMac("ten", "Vũ trụ 3D")
        hop.informativeText = chu
        hop.runModal()
    }

    // ---------- Thực đơn ----------
    func dungThucDon() {
        let chinh = NSMenu()
        let mucApp = NSMenuItem(); chinh.addItem(mucApp)
        let app = NSMenu()
        app.addItem(withTitle: chuMac("gioi-thieu", "Giới thiệu Vũ trụ 3D"), action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        app.addItem(.separator())
        app.addItem(withTitle: chuMac("an", "Ẩn Vũ trụ 3D"), action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        app.addItem(withTitle: chuMac("thoat", "Thoát Vũ trụ 3D"), action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        mucApp.submenu = app

        let mucXem = NSMenuItem(); chinh.addItem(mucXem)
        let xem = NSMenu(title: chuMac("xem", "Xem"))
        let luongTu = xem.addItem(withTitle: chuMac("luong-tu", "Vật lý lượng tử"), action: #selector(moLuongTu), keyEquivalent: "")
        luongTu.target = self
        let xemVideo = xem.addItem(withTitle: chuMac("xem-video", "Xem như video"), action: #selector(xemNhuVideo), keyEquivalent: "")
        xemVideo.target = self
        xem.addItem(.separator())
        let toan = xem.addItem(withTitle: chuMac("toan-man-hinh", "Toàn màn hình"), action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        toan.keyEquivalentModifierMask = [.control, .command]
        xem.addItem(withTitle: chuMac("nap-lai", "Nạp lại"), action: #selector(napLai), keyEquivalent: "r")
        mucXem.submenu = xem

        let mucCuaSo = NSMenuItem(); chinh.addItem(mucCuaSo)
        let cs = NSMenu(title: chuMac("cua-so", "Cửa sổ"))
        cs.addItem(withTitle: chuMac("thu-nho", "Thu nhỏ"), action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        cs.addItem(withTitle: chuMac("dong", "Đóng"), action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        mucCuaSo.submenu = cs
        NSApp.mainMenu = chinh
        NSApp.windowsMenu = cs
    }
    @objc func moLuongTu() {
        guard let tep = Bundle.main.url(forResource: "index", withExtension: "html"),
              var duong = URLComponents(url: tep, resolvingAgainstBaseURL: false) else { return }
        duong.queryItems = [URLQueryItem(name: "canh", value: "hai-khe")]
        if let url = duong.url { web.loadFileURL(url, allowingReadAccessTo: tep.deletingLastPathComponent()) }
    }
    // Vào hoặc thoát chế độ «Xem như video» của trang (như phím V). Đang ở màn hình chào thì bấm nút của màn hình chào,
    // để lần bấm đó cũng đóng màn hình chào và khởi động âm thanh.
    @objc func xemNhuVideo() {
        chay("(function(){var a=window.__vt;if(!a||!a.xemVideo)return 'chua-san-sang';if(a.xemVideo.mo){a.xemVideo.ra();return 'ra';}var n=document.getElementById('nut-chao-video');if(n&&document.body.classList.contains('dang-chao')){n.click();}else{a.xemVideo.vao();}return 'vao';})()") { _ in }
    }
    @objc func napLai() { web.reload() }

    // ---------- Tự kiểm ----------
    func chay(_ js: String, xong: @escaping (String) -> Void) {
        web.evaluateJavaScript(js) { kq, loi in
            if let loi = loi { xong("LỖI JS: \(loi.localizedDescription)") } else { xong(kq as? String ?? String(describing: kq ?? "nil")) }
        }
    }

    func chup(rong: CGFloat, xong: @escaping (NSImage?) -> Void) {
        let ch = WKSnapshotConfiguration()
        ch.rect = web.bounds
        ch.snapshotWidth = NSNumber(value: Double(rong))
        web.takeSnapshot(with: ch) { anh, _ in xong(anh) }
    }

    func luuPNG(_ anh: NSImage, _ duong: String) {
        guard let tiff = anh.tiffRepresentation, let bm = NSBitmapImageRep(data: tiff), let png = bm.representation(using: .png, properties: [:]) else { return }
        try? png.write(to: URL(fileURLWithPath: duong))
    }

    func kiemBai(_ i: Int) {
        guard let thuMuc = thuMucKiem else { return }
        if let chi = chiBai, !chi.contains(i + 1), i < 60 { kiemBai(i + 1); return }
        if i == 0 || nhatKy.isEmpty {
            try? FileManager.default.createDirectory(atPath: thuMuc, withIntermediateDirectories: true)
            nhatKy.append("Tự kiểm app Vũ trụ 3D — \(Date())")
        }
        let js = """
        (function () {
          try {
            var a = window.__vt;
            if (!a) return JSON.stringify({ loi: ['không thấy ứng dụng (window.__vt)'] });
            // Gỡ màn hình chào cho sạch: cả lớp phủ lẫn trạng thái «đang chào» (trạng thái này làm ô số liệu, nhãn, thanh
            // trên trong suốt; trước bản 3.7 chỉ gỡ lớp phủ nên ảnh tự kiểm thiếu ô số liệu khi ô được tạo sau).
            var c = document.getElementById('chao'); if (c) c.remove();
            document.body.classList.remove('dang-chao'); a.dangChao = false; if (a.dk) a.dk.autoRotate = false;
            if (\(i) >= a.dsCanh.length) return 'HET';
            a.tiLeGoc = 2; a.doNet.toiDa = 2;   // đo ở độ nét cao nhất, như cửa sổ thật trên màn hình Retina
            var gl0 = a.renderer.getContext(), px0 = new Uint8Array(4), tMo = performance.now();
            a.moBai(\(i));
            // Làm nóng sẵn: vẽ thử mọi vật của bài (kể cả vật đang ẩn) để bộ nhớ đệm chương trình đổ bóng của máy có đủ,
            // lần đầu người dùng mở bài này không phải chờ biên dịch. Làm ở cả hai kiểu bộ đệm (có và không khử răng cưa).
            var nong = null;
            if (a.lamNongNgay) {
              nong = a.lamNongNgay();
              var tlCu = a.renderer.getPixelRatio();     // kiểu có khử răng cưa: làm ở độ nét 1 cho nhẹ bộ nhớ (chương trình không phụ thuộc cỡ)
              a.doNet.khuRangCua = true; a.renderer.setPixelRatio(1); a._doiKichThuoc(); var nong2 = a.lamNongNgay();
              a.doNet.khuRangCua = false; a.renderer.setPixelRatio(tlCu); a._doiKichThuoc();
              if (nong && nong2) nong.msKhuRangCua = nong2.ms;
            }
            tMo = performance.now();
            a.buoc(1 / 60); gl0.readPixels(0, 0, 1, 1, gl0.RGBA, gl0.UNSIGNED_BYTE, px0);
            var msMo = Math.round(performance.now() - tMo);
            for (var w = 0; w < 5; w++) a.buoc(1 / 60);
            gl0.readPixels(0, 0, 1, 1, gl0.RGBA, gl0.UNSIGNED_BYTE, px0);
            var kq = a.tuKiem(24);
            kq.msMo = msMo;              // đi qua mọi bước, bấm thử mọi nút «thử ngay»
            kq.nong = nong;
            var giua = (window.__VT_THU && window.__VT_THU.buoc != null) ? window.__VT_THU.buoc : Math.floor(kq.soBuoc / 2);
            a.moBuoc(giua);                      // chụp ảnh ở bước giữa bài
            for (var k = 0; k < 360; k++) a.buoc(1 / 60);
            var g = a.renderer.getContext();
            // Đo thời gian vẽ một khung hình ở cỡ cửa sổ thật (ép card đồ hoạ vẽ xong bằng cách đọc lại một điểm ảnh).
            var px = new Uint8Array(4);
            g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px);     // chờ card vẽ hết mấy trăm khung vừa gửi, kẻo số đo bị dồn
            var t0 = performance.now();
            for (var q = 0; q < 40; q++) { a.buoc(1 / 60); g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px); }
            kq.msKhung = Math.round((performance.now() - t0) / 40 * 10) / 10;
            // Riêng phần máy tính (JS của bài + khung, không chờ card đồ hoạ): 120 khung liền
            g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px);
            var t1 = performance.now();
            for (var q2 = 0; q2 < 120; q2++) a.buoc(1 / 60);
            kq.msMay = Math.round((performance.now() - t1) / 120 * 100) / 100;
            g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px);
            // Lỗi phát sinh SAU lượt tự kiểm (lúc chạy 360 khung hình và lúc đo) cũng phải tính: cảnh chết, lỗi ghi lại, mất ngữ cảnh đồ hoạ.
            if (!a.canh) kq.loi.push('Cảnh dừng vì lỗi sau lượt tự kiểm: ' + (a.el.loi.hidden ? '(không có thông báo)' : a.el.loi.textContent.slice(0, 400)));
            for (var z = 0; z < a.loiGhi.length && z < 3; z++) kq.loi.push('Sau lượt tự kiểm: ' + a.loiGhi[z]);
            a.loiGhi.length = 0;
            if (g.isContextLost()) kq.loi.push('Mất ngữ cảnh WebGL');
            kq.tiLe = a.renderer.getPixelRatio();
            var dbg = g.getExtension('WEBGL_debug_renderer_info');
            kq.buocChup = giua + 1;
            kq.gpu = dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?';
            kq.kichThuoc = [g.drawingBufferWidth, g.drawingBufferHeight];
            return JSON.stringify(kq);
          } catch (x) { return JSON.stringify({ bai: \(i) + 1, loi: [String(x && x.stack || x).slice(0, 500)] }); }
        })()
        """
        chay(js) { kq in
            if kq == "HET" {
                self.nhatKy.append("XONG")
                try? self.nhatKy.joined(separator: "\n").write(toFile: thuMuc + "/nhat-ky.txt", atomically: true, encoding: .utf8)
                NSApp.terminate(nil)
                return
            }
            self.nhatKy.append(kq)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.chup(rong: 1440) { anh in
                    if let anh = anh { self.luuPNG(anh, String(format: "%@/bai-%02d.png", thuMuc, i + 1)) } else { self.nhatKy.append("  (không chụp được ảnh bài \(i + 1))") }
                    self.kiemBai(i + 1)
                }
            }
        }
    }

    // ---------- Thử như người dùng thật ----------
    func buocJS(_ ten: String, sau: Double, _ js: String) {
        DispatchQueue.main.asyncAfter(deadline: .now() + sau) {
            self.buocThu = ten
            let t0 = Date()
            self.chay(js) { kq in
                self.lanTraLoi = Date()
                self.ketQuaThu.append(String(format: "%@ [%.0f ms]: %@", ten, Date().timeIntervalSince(t0) * 1000, String(kq.prefix(500))))
            }
        }
    }
    func ghiKetQuaThu(_ cuoi: String) {
        guard let thuMuc = thuThat else { return }
        try? FileManager.default.createDirectory(atPath: thuMuc, withIntermediateDirectories: true)
        ketQuaThu.append(cuoi)
        try? ketQuaThu.joined(separator: "\n").write(toFile: thuMuc + "/thu-that.txt", atomically: true, encoding: .utf8)
    }
    func chayThuThat() {
        lanTraLoi = Date()
        buocJS("1 gắn bộ đếm", sau: 1.5, "(function(){var a=window.__vt;window.__d={khung:0,xau:0,truoc:performance.now(),loi:[]};var goc=a.buoc.bind(a);a.buoc=function(dt){var n=performance.now(),g=n-window.__d.truoc;if(g>window.__d.xau)window.__d.xau=g;window.__d.truoc=n;window.__d.khung++;return goc(dt);};window.addEventListener('error',function(e){window.__d.loi.push(String(e.message));});var nb=document.getElementById('nut-bat-dau'),r=nb?nb.getBoundingClientRect():null,e1=r?document.elementFromPoint(r.left+r.width/2,r.top+r.height/2):null,cb=document.querySelector('#chao .ct-bai'),r2=cb?cb.getBoundingClientRect():null,e2=r2?document.elementFromPoint(r2.left+20,r2.top+8):null;return JSON.stringify({chao:!!document.getElementById('chao'),bai:a.chiSo+1,im:a.imLang,doNet:a.renderer.getPixelRatio(),dpr:window.devicePixelRatio,chon:document.hasFocus(),an:document.hidden,cuaSo:[innerWidth,innerHeight],duoiNut:e1?(e1.id||e1.className||e1.tagName):null,duoiBai:e2?(e2.id||e2.className||e2.tagName):null});})()")
        buocJS("2 bấm Bắt đầu học", sau: 2.6, "(function(){var t=performance.now();var n=document.getElementById('nut-bat-dau');if(n)n.click();var a=window.__vt;return JSON.stringify({ms:Math.round(performance.now()-t),coNut:!!n,sanSang:a.am.sanSang,bat:a.am.bat});})()")
        for k in 0..<8 {
            buocJS("3 rê chuột \(k)", sau: 3.6 + Double(k) * 0.5, "(function(){var a=window.__vt,cv=a.renderer.domElement,t=performance.now();for(var i=0;i<12;i++){cv.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:120+70*i+\(k)*13,clientY:200+30*i,pointerId:1,pointerType:'mouse'}));}return JSON.stringify({ms:Math.round((performance.now()-t)*10)/10,khung:window.__d.khung,xau:Math.round(window.__d.xau),gio:Math.round(a.am.gio()*100)/100,sanSang:a.am.sanSang});})()")
        }
        buocJS("4 mở Bài 7", sau: 8.0, "(function(){var a=window.__vt,t=performance.now();a.moBai(6,0,true);return JSON.stringify({ms:Math.round(performance.now()-t)});})()")
        buocJS("5 mở Bài 2", sau: 10.0, "(function(){var a=window.__vt,t=performance.now();a.moBai(1,0,true);return JSON.stringify({ms:Math.round(performance.now()-t)});})()")
        buocJS("6 tổng kết", sau: 12.5, "(function(){var a=window.__vt;return JSON.stringify({khung:window.__d.khung,xauMs:Math.round(window.__d.xau),loi:window.__d.loi,loiGhi:a.loiGhi.slice(0,5),am:{sanSang:a.am.sanSang,gio:a.am.gio()},doNet:a.renderer.getPixelRatio(),matNguCanh:!!a._matNguCanh});})()")
        // Canh treo: mỗi giây hỏi trang một câu; quá 5 giây không trả lời thì coi là treo, ghi lại rồi chờ thêm để người làm kịp lấy mẫu.
        var daBaoTreo = false
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            self.web.evaluateJavaScript("1") { _, _ in self.lanTraLoi = Date() }
            let im = Date().timeIntervalSince(self.lanTraLoi)
            if im > 5, !daBaoTreo {
                daBaoTreo = true
                self.ghiKetQuaThu(String(format: "TREO: trang không trả lời %.1f giây, đang ở bước «%@»", im, self.buocThu))
                DispatchQueue.main.asyncAfter(deadline: .now() + 14) { exit(2) }
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 14.5) {
            if !daBaoTreo { self.ghiKetQuaThu("XONG: không treo"); NSApp.terminate(nil) }
        }
    }

    // ---------- Đo như người dùng thật ----------
    func chayDoThat() {
        guard let thuMuc = doThat else { return }
        try? FileManager.default.createDirectory(atPath: thuMuc, withIntermediateDirectories: true)
        let toiDa = Double(giaTri("--toi-da") ?? "90") ?? 90
        let t0 = Date()
        let man = cuaSo.screen
        let thongTin = "{\"manHinh\":[\(Int(man?.frame.width ?? 0)),\(Int(man?.frame.height ?? 0))],\"tiLeManHinh\":\(man?.backingScaleFactor ?? 0),\"hz\":\(man?.maximumFramesPerSecond ?? 0),\"khung\":[\(Int(cuaSo.frame.minX)),\(Int(cuaSo.frame.minY)),\(Int(cuaSo.frame.width)),\(Int(cuaSo.frame.height))]}"
        // Ghi mọi lần hệ điều hành báo cửa sổ đo bị che hoặc hiện lại: WebKit ngừng cấp khung hình cho cửa sổ bị che dù trang
        // vẫn trả lời, nên một «khoảng trống» trùng lúc bị che là do cửa sổ, không phải do app.
        let ghiCuaSo: (String) -> Void = { ten in self.suKienCuaSo.append("[\(Int(Date().timeIntervalSince(t0) * 1000)),\"\(ten)\"]") }
        NotificationCenter.default.addObserver(forName: NSWindow.didChangeOcclusionStateNotification, object: cuaSo, queue: .main) { _ in
            ghiCuaSo(self.cuaSo.occlusionState.contains(.visible) ? "hien" : "bi-che")
        }
        // --che-thu 9.5,4.2: PHÉP THỬ. Sau 9,5 giây thì cất cửa sổ đo đi 4,2 giây rồi đưa lại, để xem trang phản ứng ra sao khi bị che.
        if let c = giaTri("--che-thu")?.split(separator: ",").compactMap({ Double($0) }), c.count == 2 {
            DispatchQueue.main.asyncAfter(deadline: .now() + c[0]) {
                ghiCuaSo("cat-di (phep thu)"); self.cuaSo.orderOut(nil)
                DispatchQueue.main.asyncAfter(deadline: .now() + c[1]) { ghiCuaSo("dua-lai (phep thu)"); self.cuaSo.orderFrontRegardless() }
            }
        }
        Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { _ in
            let gui = Date()
            self.web.evaluateJavaScript("window.__doXong || ''") { kq, _ in
                let tre = Date().timeIntervalSince(gui)
                if tre > self.treLonNhat { self.treLonNhat = tre }
                if let s = kq as? String, !s.isEmpty, !self.dangHetGio {
                    self.dangHetGio = true
                    let ra = "{\"vo\":\(thongTin),\"cuaSo\":[\(self.suKienCuaSo.joined(separator: ","))],\"treTraLoiLonNhatMs\":\(Int(self.treLonNhat * 1000)),\"trang\":\(s)}"
                    try? ra.write(toFile: thuMuc + "/do-that.json", atomically: true, encoding: .utf8)
                    // Chụp lại khung hình cuối của đường chạy thật (để người làm xem bằng mắt), rồi thoát.
                    self.chup(rong: 1600) { anh in
                        if let anh = anh { self.luuPNG(anh, thuMuc + "/anh-cuoi.png") }
                        NSApp.terminate(nil)
                    }
                }
            }
            if Date().timeIntervalSince(t0) > toiDa, !self.dangHetGio {
                // Hết giờ: cố lấy phần kết quả dở dang (kịch bản để ở window.__kqTam) rồi mới thoát.
                self.dangHetGio = true
                let ghi: (String) -> Void = { dang in
                    let ra = "{\"vo\":\(thongTin),\"treTraLoiLonNhatMs\":\(Int(self.treLonNhat * 1000)),\"hetGio\":true,\"dang\":\(dang)}"
                    try? ra.write(toFile: thuMuc + "/do-that.json", atomically: true, encoding: .utf8)
                    exit(3)
                }
                self.web.evaluateJavaScript("JSON.stringify(window.__kqTam || null)") { kq, _ in ghi((kq as? String) ?? "null") }
                DispatchQueue.main.asyncAfter(deadline: .now() + 4) { ghi("null") }
            }
        }
    }

    // ---------- Biểu tượng ----------
    func chupBieuTuong() {
        guard let tep = tepBieuTuong else { return }
        let js = """
        (function () {
          var a = window.__vt;
          var nut = document.getElementById('nut-bat-dau'); if (nut) nut.click();
          var c = document.getElementById('chao'); if (c) c.remove();
          var iLoDen = a.dsCanh.findIndex(function (c) { return c.id === 'lo-den'; });
          a.moBai(iLoDen >= 0 ? iLoDen : 0);
          a.anHienBang(true);
          ['thanh-tren', 'hud', 'goi-y'].forEach(function (id) { var e = document.getElementById(id); if (e) e.style.display = 'none'; });
          a.renderer.setPixelRatio(2); a._doiKichThuoc();
          a.camera.position.set(0, 2.1, 12.2); a.dk.target.set(0, 0, 0);
          for (var k = 0; k < 30; k++) a.buoc(0.05);
          return 'ok';
        })()
        """
        chay(js) { _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.7) {
                self.chup(rong: 1024) { anh in
                    guard let anh = anh else { self.baoLoi("Không chụp được biểu tượng."); return }
                    // bo góc theo kiểu biểu tượng macOS: hình vuông 824 trong khung 1024, bán kính góc 185
                    let kq = NSImage(size: NSSize(width: 1024, height: 1024))
                    kq.lockFocus()
                    let khung = NSRect(x: 100, y: 100, width: 824, height: 824)
                    NSBezierPath(roundedRect: khung, xRadius: 185, yRadius: 185).addClip()
                    NSColor.black.setFill(); khung.fill()
                    anh.draw(in: khung, from: .zero, operation: .sourceOver, fraction: 1)
                    kq.unlockFocus()
                    self.luuPNG(kq, tep)
                    NSApp.terminate(nil)
                }
            }
        }
    }
}

let ungDung = NSApplication.shared
let daiDien = UngDung()
ungDung.delegate = daiDien
ungDung.setActivationPolicy(daiDien.chayAn || daiDien.thuMo ? .accessory : .regular)
ungDung.run()
