#!/bin/bash
# Đóng gói Vũ trụ 3D thành app Mac.
#   bash dong-goi-app.sh            → dựng trang, biên dịch, cài vào ~/Applications/Vũ trụ 3D.app
#   bash dong-goi-app.sh --kiem     → dựng xong cho app tự kiểm (mở ẩn từng bài, đi qua mọi bước, chụp ảnh);
#                                     chỉ cài khi không có lỗi nào
#   bash dong-goi-app.sh --kiem --khong-cai   → như trên nhưng KHÔNG cài: để app vừa dựng ở «Dữ liệu làm việc/App thử/»
#                                     cho người làm xem ảnh, số đo rồi mới quyết định cài
#                                     (đặt THU_MUC_THU="App thử 2" để dựng sang thư mục khác khi «App thử» đang được dùng)
set -euo pipefail
cd "$(dirname "$0")"

TEN="Vũ trụ 3D"
DICH="$HOME/Applications/$TEN.app"
mkdir -p "Dữ liệu làm việc"
TAM="$(mktemp -d "$(pwd)/Dữ liệu làm việc/dung-XXXXXX")"
APP="$TAM/$TEN.app"
trap 'rm -rf "$TAM"' EXIT

echo "1. Dựng trang (một tệp HTML tự chứa)"
[ -d node_modules ] || npm ci --no-audit --no-fund --cache "Dữ liệu làm việc/npm" >/dev/null
node build.mjs

echo "2. Biên dịch vỏ app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
# Một số swift-driver trên macOS gặp SIGTRAP khi xử lý đường dẫn tạm có dấu.
# Chỉ đặt đệm, tệp liên kết và tệp thực thi trung gian ở đường dẫn ASCII cạnh bản dựng.
mkdir -p dist/cache-swift dist/tmp-swift
env TMPDIR="$(pwd)/dist/tmp-swift/" swiftc -O -module-cache-path "$(pwd)/dist/cache-swift" \
  -o dist/vu-tru-3d app-mac/main.swift -framework Cocoa -framework WebKit
cp dist/vu-tru-3d "$APP/Contents/MacOS/vu-tru-3d"
node --input-type=module - "$APP/Contents/Resources/thuc-don.json" <<'JS'
import fs from 'node:fs';
const bo = {};
for (const ma of ['vi', 'en', 'zh-CN', 'ja']) {
  const d = JSON.parse(fs.readFileSync('src/ngon-ngu/' + ma + '/chung.json', 'utf8'));
  bo[ma] = Object.fromEntries(Object.entries(d).filter(([k, v]) => k.startsWith('mac.') && typeof v === 'string' && v.trim()));
}
fs.writeFileSync(process.argv[2], JSON.stringify(bo));
JS
cp app-mac/Info.plist "$APP/Contents/Info.plist"
cp dist/index.html "$APP/Contents/Resources/index.html"
# Giọng đọc lời giảng (nếu đã tạo): tệp tiếng nằm cạnh trang trong app.
if [ -f giong-doc/danh-sach.json ]; then
  mkdir -p "$APP/Contents/Resources/giong-doc"
  rsync -a --include='*/' --include='*.mp3' --include='danh-sach.json' --exclude='*' giong-doc/ "$APP/Contents/Resources/giong-doc/"
fi
[ -f app-mac/BieuTuong.icns ] && cp app-mac/BieuTuong.icns "$APP/Contents/Resources/BieuTuong.icns"
codesign --force --sign - "$APP" >/dev/null 2>&1

if [ ! -f app-mac/BieuTuong.icns ]; then
  echo "3. Tạo biểu tượng từ cảnh lỗ đen"
  "$APP/Contents/MacOS/vu-tru-3d" --chup-bieu-tuong "$TAM/bieu-tuong.png"
  if [ -f "$TAM/bieu-tuong.png" ]; then
    BO="$TAM/BieuTuong.iconset"; mkdir -p "$BO"
    for c in 16 32 128 256 512; do
      sips -z $c $c "$TAM/bieu-tuong.png" --out "$BO/icon_${c}x${c}.png" >/dev/null
      sips -z $((c * 2)) $((c * 2)) "$TAM/bieu-tuong.png" --out "$BO/icon_${c}x${c}@2x.png" >/dev/null
    done
    iconutil -c icns "$BO" -o app-mac/BieuTuong.icns
    cp app-mac/BieuTuong.icns "$APP/Contents/Resources/BieuTuong.icns"
    codesign --force --sign - "$APP" >/dev/null 2>&1
  else
    echo "   (không chụp được biểu tượng; app vẫn chạy, chỉ thiếu hình biểu tượng)"
  fi
fi

KHONG_CAI=0; for ts in "$@"; do [ "$ts" = "--khong-cai" ] && KHONG_CAI=1; done
if [ "${1:-}" = "--kiem" ]; then
  KQ="$(pwd)/Dữ liệu làm việc/Tự kiểm app"
  if [ -e "$KQ" ]; then KQ="$(mktemp -d "$KQ-XXXXXX")"; else mkdir -p "$KQ"; fi
  echo "4. App tự kiểm trước khi cài (chạy ẩn): mở từng bài, đi qua mọi bước, bấm thử mọi nút, chụp ảnh"
  "$APP/Contents/MacOS/vu-tru-3d" --tu-kiem "$KQ"
  python3 - "$KQ/nhat-ky.txt" <<'PY'
import sys, json
hong = 0; so = 0; buoc = 0; dong = ""
for dong in open(sys.argv[1], encoding='utf-8'):
    dong = dong.strip()
    if not dong.startswith('{'): continue
    k = json.loads(dong); so += 1; buoc += k.get('soBuoc', 0) or 0
    loi = k.get('loi') or []
    print(f"  {'đạt ' if not loi else 'LỖI '} Bài {k.get('bai', '?')} «{k.get('ten', '?')}»: {k.get('soBuoc', '?')} bước · {k.get('kichThuoc')} · {k.get('msKhung', '?')} ms mỗi khung hình ở độ nét {k.get('tiLe', '?')} (máy tính {k.get('msMay', '?')} ms) · khung đầu {k.get('msMo', '?')} ms · làm nóng sẵn {(k.get('nong') or {}).get('vat', '?')} vật trong {(k.get('nong') or {}).get('ms', '?')} + {(k.get('nong') or {}).get('msKhuRangCua', '?')} ms")
    for l in loi: hong += 1; print('       -', str(l)[:600])
print(f"  Tổng: {so} bài, {buoc} bước, {hong} lỗi.")
if not so or not buoc or not dong.strip() == "XONG":
    sys.exit("Thiếu bài, bước hoặc dấu kết thúc của bộ tự kiểm.")
sys.exit(1 if hong else 0)
PY
  echo "   Ảnh từng bài: $KQ"
fi

if [ "$KHONG_CAI" = 1 ]; then
  THU="$(pwd)/Dữ liệu làm việc/${THU_MUC_THU:-App thử}"
  if [ -e "$THU" ]; then THU="$(mktemp -d "$THU-XXXXXX")"; else mkdir -p "$THU"; fi
  ditto "$APP" "$THU/$TEN.app"
  echo "Không cài (theo yêu cầu). App vừa dựng: $THU/$TEN.app"
  exit 0
fi

echo "5. Cài vào $DICH"
mkdir -p "$HOME/Applications"
# Kiểm đúng ứng dụng trước khi đổi chỗ. Giữ bản trước khi cài trong Bản cũ, cả khi đổi tên thất bại.
if [ -e "$DICH" ] && [ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$DICH/Contents/Info.plist" 2>/dev/null)" != "vn.trilu.vu-tru-3d" ]; then
  echo "Đích cài thuộc ứng dụng khác."; exit 1
fi
# Tệp dựng trong cùng ổ với nơi cài để đổi tên nhanh. Không dùng tên tạm cố định có thể trùng tệp đang có.
GIAI_DOAN="$(mktemp -d "$HOME/Applications/.vu-tru-3d-XXXXXX")"
MOI="$GIAI_DOAN/$TEN.app"
ditto "$APP" "$MOI"
if [ -d "$DICH" ]; then
  mkdir -p "Bản cũ"
  GIU="$(mktemp -d "$(pwd)/Bản cũ/Trước khi cài-XXXXXX")"
  BAN_TRUOC="$GIU/$TEN.app"
  ditto "$DICH" "$BAN_TRUOC"
  diff -qr "$DICH" "$BAN_TRUOC"
  codesign --verify --deep --strict "$MOI"
  # Giữ nguyên thư mục .app mà Dock đã ghim. Hai thư mục Contents nằm
  # trên cùng ổ, đổi chỗ trong một thao tác macOS, kể cả khi ngắt giữa chừng.
  python3 - "$MOI/Contents" "$DICH/Contents" <<'PY_SWAP'
import ctypes, os, sys
libc = ctypes.CDLL(None, use_errno=True)
swap = libc.renamex_np
swap.argtypes = (ctypes.c_char_p, ctypes.c_char_p, ctypes.c_uint)
swap.restype = ctypes.c_int
if swap(os.fsencode(sys.argv[1]), os.fsencode(sys.argv[2]), 2) != 0:  # RENAME_SWAP
    err = ctypes.get_errno()
    raise OSError(err, os.strerror(err))
PY_SWAP
  # Bản cũ thứ hai vừa được đổi ra vẫn được giữ trong vùng sao lưu.
  mv "$MOI" "$GIU/Gói trước khi đổi.app"
  echo "   Bản sao trước khi cài: $BAN_TRUOC"
else
  mv "$MOI" "$DICH"
fi
rmdir "$GIAI_DOAN"
touch "$DICH"
if [ -n "$(lsappinfo find bundleid=vn.trilu.vu-tru-3d 2>/dev/null)" ]; then echo "   Lưu ý: app đang mở vẫn là bản cũ; đóng rồi mở lại để dùng bản mới."; fi
echo "Xong: $DICH"
