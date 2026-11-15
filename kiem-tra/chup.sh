#!/bin/bash
# Chụp ảnh một bài bằng Chrome chạy ẩn (không hiện cửa sổ, không phát tiếng), để tự xem mô hình trông thế nào.
#
#   bash kiem-tra/chup.sh <tệp html> <ảnh ra .png> [tham số đường dẫn] [rộng] [cao] [số mili giây cho hình chạy]
#
# Tham số đường dẫn thường dùng: canh=<id bài> hoặc bai=<SỐ CỦA BÀI> (Bài 15 là bai=15, không phải thứ tự hiển thị),
# buoc=<số từ 1>, tua=<giây cho mô hình chạy trước, mặc định 4>, nut=<tên nút thử ngay>, tab=tom|hoi, lang=vi|en|zh-CN|ja.
#
# Ví dụ:
#   bash kiem-tra/chup.sh "Dữ liệu làm việc/thu/index.html" "Dữ liệu làm việc/thu/b3.png" "canh=lorentz&buoc=3"
#   bash kiem-tra/chup.sh dist/index.html /tmp/a.png "bai=4&buoc=2" 1600 1000 6000
set -euo pipefail
HTML="$1"; ANH="$2"; THAM="${3:-}"; RONG="${4:-1600}"; CAO="${5:-1000}"; MS="${6:-5000}"
# Trình duyệt chạy ẩn gần như không cho hoạt hình chạy. Thiếu tua= thì máy quay CHƯA BAY TỚI CHỖ và mô hình chưa tới
# trạng thái của bước: ảnh trông lệch dù app vẫn đúng (đã có người sửa nhầm góc máy vì ảnh như vậy). Vì thế khi tham số
# không có tua= thì tự thêm tua=4 (mô hình chạy trước 4 giây). Muốn chụp đúng khung hình đầu tiên thì ghi rõ tua=0.
case "$THAM" in
  *tua=*) ;;
  *) THAM="${THAM:+$THAM&}tua=4"; echo "  (tham số không có tua=: tự thêm tua=4 để máy quay bay xong; muốn khung hình đầu thì ghi tua=0)" ;;
esac
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Không thấy Google Chrome."; exit 1; }
case "$HTML" in /*) ;; *) HTML="$(pwd)/$HTML";; esac
case "$ANH" in /*) ;; *) ANH="$(pwd)/$ANH";; esac
mkdir -p "$(dirname "$ANH")"
# Cỡ điện thoại cầm dọc: cửa sổ Chrome không hẹp dưới 500 điểm ảnh, chụp thường sẽ dựng trang rộng 500 rồi cắt mất mép
# phải (thanh trên, bảng bài giảng, nhãn trông như bị cụt dù app vẫn đúng). Bề ngang dưới 500 thì chuyển sang bộ chụp có
# giả lập điện thoại, dựng trang đúng bề rộng yêu cầu.
if [ "$RONG" -lt 500 ]; then
  exec node "$(dirname "$0")/chup-hep.mjs" "$HTML" "$ANH" "$THAM" "$RONG" "$CAO" "$MS"
fi
TAM="$(mktemp -d)"; trap 'rm -rf "$TAM"' EXIT
URL="file://$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$HTML")"
[ -n "$THAM" ] && URL="$URL?$THAM"
"$CHROME" --headless=new --mute-audio --no-first-run --disable-extensions --hide-scrollbars \
  --user-data-dir="$TAM" --window-size="$RONG,$CAO" --force-device-scale-factor=1 \
  --virtual-time-budget="$MS" --screenshot="$ANH" "$URL" 2>&1 | grep -E "written to file|ERROR:.*(console|CONSOLE)" | sed 's/^.*bytes written/  đã chụp:/' || true
[ -f "$ANH" ] || { echo "Không chụp được."; exit 1; }
