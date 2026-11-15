#!/bin/bash
# Kiểm âm thanh tổng hợp (src/khung/am-thanh.js), hoàn toàn im lặng:
# dựng trang kiểm bằng esbuild, chạy trong Chrome ẩn có --mute-audio, mọi tiếng được tính trên OfflineAudioContext.
#
#   bash kiem-tra/kiem-am-thanh.sh [thư mục ra]       mặc định «Dữ liệu làm việc/am-thanh»
#
# In bảng kết quả; ghi ảnh phổ (anh-pho.png), số liệu (so-lieu.json) và tệp WAV nghe thử (nghe-thu/).
# Mã thoát 0 = mọi mục đạt.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p "Dữ liệu làm việc"
RA="${1:-$(mktemp -d "Dữ liệu làm việc/am-thanh-XXXXXX")}"
exec node kiem-tra/am-thanh/chay.mjs "$RA"
