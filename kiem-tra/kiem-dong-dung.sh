#!/bin/bash
# Tìm bước mà mô hình đang chạy rồi TỰ ĐỨNG (trông như app bị đơ). Chạy bằng Chrome ẩn, không tiếng, không vẽ.
#   bash kiem-tra/kiem-dong-dung.sh <tệp html> [tham số thêm, ví dụ "tu=1&den=3"]
# In mọi bước đáng ngờ: giây thứ 6 có nhiều vật chuyển động mà tới giây thứ 46 hoặc 121 chỉ còn dưới một phần ba.
set -euo pipefail
HTML="${1:-dist/index.html}"; THEM="${2:-}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Không thấy Google Chrome."; exit 1; }
case "$HTML" in /*) ;; *) HTML="$(pwd)/$HTML";; esac
TAM="$(mktemp -d)"; trap 'rm -rf "$TAM"' EXIT
URL="file://$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$HTML")?dongdung=1${THEM:+&$THEM}"
"$CHROME" --headless=new --mute-audio --no-first-run --disable-extensions --user-data-dir="$TAM" \
  --window-size=1600,1000 --force-device-scale-factor=1 --virtual-time-budget=600000 --timeout=900000 --dump-dom "$URL" 2>/dev/null > "$TAM/dom.html" || true
python3 - "$TAM/dom.html" <<'PY'
import sys, re, json, html
dom = open(sys.argv[1], encoding='utf-8', errors='replace').read()
m = re.search(r'<pre id="ket-qua-kiem"[^>]*>(.*?)</pre>', dom, re.S)
if not m: print('KHÔNG có kết quả.'); sys.exit(2)
kq = json.loads(html.unescape(m.group(1)))
ngo = 0
for k in kq:
    if len(k) == 3: print(f"  LỖI Bài {k[0]}: {k[2]}"); ngo += 1; continue
    bai, buoc, d6, d46, d121, *sau = k
    if d6 >= 3 and (d46 * 3 < d6 or d121 * 3 < d6):
        if len(sau) == 1 and sau[0] * 3 >= d6:
            print(f"  Bài {bai} bước {buoc} còn lặp: {d6}/{d46}/{d121} vật, trong 12 giây kế tiếp có {sau[0]} vật chuyển động.")
            continue
        ngo += 1
        print(f"  ĐÁNG NGỜ Bài {bai} bước {buoc}: số vật đang chuyển động ở giây 6 / 46 / 121 = {d6} / {d46} / {d121}")
print(f"Đã xét {len(kq)} bước, {ngo} bước đáng ngờ.")
sys.exit(1 if ngo or not kq or len({tuple(k[:2]) for k in kq}) != len(kq) else 0)
PY
