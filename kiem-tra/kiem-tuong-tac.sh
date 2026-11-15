#!/bin/bash
# Bộ kiểm khung tương tác (src/khung/tuong-tac.js): dựng trang thử trong phòng trưng bày, chạy bằng Chrome ẩn
# (không cửa sổ, không tiếng), in từng mục kiểm. Mã thoát 0 = đạt hết.
#
#   bash kiem-tra/kiem-tuong-tac.sh            (chạy từ thư mục dự án)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p "Dữ liệu làm việc"
RA="$(mktemp -d "Dữ liệu làm việc/tuong-tac-XXXXXX")"
node kiem-tra/trung-bay.mjs kiem-tra/trung-bay/thu-tuong-tac.js "$RA" > /dev/null
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Không thấy Google Chrome."; exit 1; }
TAM="$(mktemp -d)"; trap 'rm -rf "$TAM"' EXIT
URL="file://$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$(pwd)/$RA/index.html")?kiem=1"
"$CHROME" --headless=new --mute-audio --no-first-run --disable-extensions --user-data-dir="$TAM" \
  --window-size=1600,1000 --force-device-scale-factor=1 --virtual-time-budget=15000 --dump-dom "$URL" 2>/dev/null > "$TAM/dom.html" || true
python3 - "$TAM/dom.html" <<'PY'
import sys, re, json, html
dom = open(sys.argv[1], encoding='utf-8', errors='replace').read()
m = re.search(r'<pre id="ket-qua-kiem"[^>]*>(.*?)</pre>', dom, re.S)
if not m:
    loi = re.search(r'<div id="loi"[^>]*>(.*?)</div>', dom, re.S)
    print('KHÔNG có kết quả kiểm. Trang có thể đã hỏng khi nạp.')
    if loi and loi.group(1).strip(): print('Lỗi trên trang:', html.unescape(loi.group(1))[:1200])
    sys.exit(2)
kq = json.loads(html.unescape(m.group(1)))
hong = 0
for k in kq:
    print(f"{'  đạt ' if k['dat'] else '  LỖI '} {k['ten']}" + (f"  ({k['chiTiet']})" if k.get('chiTiet') else ''))
    hong += 0 if k['dat'] else 1
print(f"Tổng: {len(kq)} mục, {hong} lỗi.")
sys.exit(1 if hong or not kq else 0)
PY
