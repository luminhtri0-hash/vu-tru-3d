#!/bin/bash
# Đo app lúc máy CHƯA có bộ nhớ đệm chương trình đổ bóng (như lần mở đầu tiên của một bài): chép app thử sang một bản mang
# mã định danh riêng (macOS giữ bộ nhớ đệm theo mã định danh, nên bản này bắt đầu từ con số không), đo, rồi dọn sạch.
#   bash kiem-tra/do-lanh.sh [mã chèn, ví dụ 'window.__KB={giay:15}']
set -euo pipefail
cd "$(dirname "$0")/.."
GOC="Dữ liệu làm việc/${THU_MUC_THU:-App thử}/Vũ trụ 3D.app"
MA="vn.trilu.vu-tru-3d.lanh-$$-$RANDOM"
TAM="Dữ liệu làm việc/App thử lạnh"
rm -rf "$TAM"; mkdir -p "$TAM"
ditto "$GOC" "$TAM/Vũ trụ 3D.app"
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier $MA" "$TAM/Vũ trụ 3D.app/Contents/Info.plist"
codesign --force --sign - "$TAM/Vũ trụ 3D.app" >/dev/null 2>&1
bash kiem-tra/do-that.sh "$TAM/Vũ trụ 3D.app" "${1:-}" || true
# dọn: bản chép và mọi thư mục đệm mang mã định danh tạm này
rm -rf "$TAM"
C="$(getconf DARWIN_USER_CACHE_DIR)"
for d in "$C"/*"$MA"* "$HOME/Library/Caches/$MA" "$HOME/Library/WebKit/$MA" "$HOME/Library/HTTPStorages/$MA" "$HOME/Library/Saved Application State/$MA.savedState"; do [ -e "$d" ] && rm -rf "$d"; done
exit 0
