#!/bin/bash
# Cho trang tự đi qua mọi bước của một bài (hoặc mọi bài), bấm thử mọi nút, rồi in kết quả.
# Chạy bằng Chrome ẩn, không tiếng.
#
#   bash kiem-tra/tu-kiem.sh <tệp html> [tham số]     tham số mặc định: tukiem=tat-ca
#
# Ví dụ:
#   bash kiem-tra/tu-kiem.sh "Dữ liệu làm việc/thu/index.html" "canh=lorentz&tukiem=1"
#   bash kiem-tra/tu-kiem.sh dist/index.html
# Kết quả: mỗi bài một dòng; dòng «lỗi» liệt kê bước nào hỏng. Mã thoát 0 = không lỗi.
set -euo pipefail
HTML="${1:-dist/index.html}"; THAM="${2:-tukiem=tat-ca}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Không thấy Google Chrome."; exit 1; }
case "$HTML" in /*) ;; *) HTML="$(pwd)/$HTML";; esac
TAM="$(mktemp -d)"; trap 'rm -rf "$TAM"' EXIT
URL="file://$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$HTML")?$THAM"
"$CHROME" --headless=new --mute-audio --no-first-run --disable-extensions --user-data-dir="$TAM" \
  --window-size=1600,1000 --force-device-scale-factor=1 --virtual-time-budget=20000 --dump-dom "$URL" 2>/dev/null > "$TAM/dom.html" || true
python3 - "$TAM/dom.html" <<'PY'
import sys, re, json, html
dom = open(sys.argv[1], encoding='utf-8', errors='replace').read()
m = re.search(r'<pre id="ket-qua-kiem"[^>]*>(.*?)</pre>', dom, re.S)
if not m:
    loi = re.search(r'<div id="loi"[^>]*>(.*?)</div>', dom, re.S)
    print('KHÔNG có kết quả tự kiểm. Trang có thể đã hỏng khi nạp.')
    if loi and loi.group(1).strip(): print('Thông báo lỗi trên trang:', html.unescape(loi.group(1))[:800])
    sys.exit(2)
kq = json.loads(html.unescape(m.group(1)))
hong = sum(1 for k in kq if not k.get("id") or not k.get("soBuoc"))
if not kq or len({k.get("id") for k in kq}) != len(kq):
    sys.exit("Thiếu kết quả hoặc có bài bị kiểm hai lần.")
for k in kq:
    loi = k.get('loi') or []
    print(f"{'  đạt ' if not loi else '  LỖI '} Bài {k.get('bai', '?')} «{k.get('ten', '?')}» ({k.get('id', '?')}): {k.get('soBuoc', '?')} bước")
    for l in loi:
        hong += 1
        print('        -', l[:700])
print(f"Tổng: {len(kq)} bài, {hong} lỗi.")
sys.exit(1 if hong else 0)
PY
