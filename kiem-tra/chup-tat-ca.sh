#!/bin/bash
# Chụp tuần tự ở thời điểm cố định bằng Chrome ẩn, tắt tiếng. Chọn theo số bài gốc hoặc id.
# bash kiem-tra/chup-tat-ca.sh <tệp HTML> <thư mục mới> [số bài hoặc id…]
# Dùng NGON_NGU_KIEM=vi, en, zh-CN hoặc ja để chụp một bản dịch.
set -euo pipefail
HTML="$1"; RA="$2"; shift 2
mkdir -p "$(dirname "$RA")"
# Ảnh để XEM: cho mô hình chạy 4 giây (240 khung hình) ở mỗi bước trước khi chụp, để máy quay bay xong và mô hình tới
# đúng trạng thái của bước. (Trước bản 3.7 chỉ chạy 4 khung hình nên ảnh hay trông lệch dù app đúng.)
# Muốn bộ ảnh để SO từng điểm ảnh giữa hai bản dựng thì gọi thẳng kiem-tra/anh-hoi-quy.mjs (mặc định 4 khung hình).
SO_KHUNG_MOI_BUOC="${SO_KHUNG_MOI_BUOC:-240}" node kiem-tra/anh-hoi-quy.mjs chụp "$HTML" "$RA" "${NGON_NGU_KIEM:-vi}" "$@"
python3 - "$RA" <<'PY'
from pathlib import Path
import json, subprocess, sys
ra = Path(sys.argv[1])
for b in json.loads((ra / "anh.json").read_text())["bai"]:
    col = 4 if b["buoc"] <= 8 else 3
    rows = (b["buoc"] + col - 1) // col
    subprocess.run(["ffmpeg", "-n", "-loglevel", "error", "-framerate", "1", "-start_number", "1",
                    "-i", str(ra / f"bai-{b['so']:02}-buoc-%d.png"), "-vf",
                    f"scale=800:-1,tile={col}x{rows}:padding=6:color=0x202020",
                    "-frames:v", "1", "-q:v", "4", str(ra / f"Bài {b['so']:02} - mọi bước.jpg")], check=True)
PY
