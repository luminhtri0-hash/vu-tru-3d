#!/bin/bash
# Quét mọi bước của mọi bài trên màn hình thật (cửa sổ gần như trong suốt, tiếng câm), tìm bước nặng.
#   bash kiem-tra/quet-buoc.sh [đường dẫn .app] [mã chèn, ví dụ 'window.__KB={tuBai:2,denBai:3}']
set -euo pipefail
cd "$(dirname "$0")/.."
APP="${1:-Dữ liệu làm việc/App thử/Vũ trụ 3D.app}"
case "${NGON_NGU_KIEM:-vi}" in vi|en|zh-CN|ja) ;; *) echo "Ngôn ngữ đo không hợp lệ."; exit 2 ;; esac
JS="localStorage.setItem('vu-tru-3d.ngon-ngu','${NGON_NGU_KIEM:-vi}'); ${2:-}"
GOC="$(pwd)/Dữ liệu làm việc/Đo thật/quet"
mkdir -p "$GOC"
RA="$(mktemp -d "$GOC/luot-XXXXXX")"
echo "Kết quả: $RA"
"$APP/Contents/MacOS/vu-tru-3d" --do-that "$RA" --kich-ban "$(pwd)/kiem-tra/do-that/quet-buoc.js" --thu-js "$JS" --toi-da "${TOI_DA:-900}" || true
python3 - "$RA/do-that.json" "${NGON_NGU_KIEM:-vi}" <<'PY'
import json, sys
d = json.load(open(sys.argv[1], encoding='utf-8'))
v = d['vo']; print(f"Màn hình {v['manHinh'][0]}×{v['manHinh'][1]}, nét ×{v['tiLeManHinh']}, {v['hz']} Hz")
if d.get('hetGio'):
    print('HẾT GIỜ: chỉ có phần đã đo xong')
    t = {'kq': d.get('dang') or []}
else: t = d['trang']
if any(trang_thai == 'hidden' for _, trang_thai in t.get('hienAn', [])):
    print('WebKit báo cửa sổ bị che, cần đo lại khi hiển thị:', t['hienAn'])
    sys.exit(2)
if t.get('loiKichBan'): sys.exit('KỊCH BẢN LỖI: ' + t['loiKichBan'])
kq = t['kq']
print(f"Đã đo {len(kq)} bước · bộ đệm {t.get('bo')} · lỗi: {t.get('loi')} {t.get('loiGhi')}")
print('bài.bước | khung/giây | 95% khoảng cách ms | tệ nhất ms | tính toán ms | trọn khung (kể cả card) ms | mở mất ms | độ nét | khung lâu nhất khi đổi bước (ms)')
nang = [k for k in kq if k[2] < 57 or k[6] > 9 or k[5] > 4 or k[4] > 60]
for k in kq:
    co = '  <-- nặng' if k in nang else ''
    print(f"  {k[0]:>2}.{k[1]:<2} {k[2]:>5} {k[3]:>4} {k[4]:>5} {k[5]:>6} {k[6]:>6} {k[7]:>5} {k[8]} {k[9] if len(k) > 9 else '?'}{co}")
print(f"Số bước nặng: {len(nang)} / {len(kq)}")
if len(kq) != t.get("soBuocCanDo") or t.get("lang") != sys.argv[2]:
    sys.exit("Chưa đo đủ số bước hoặc sai ngôn ngữ.")
if not kq or d.get("hetGio") or t.get("matNguCanh") or t.get("loi") or t.get("loiGhi"):
    sys.exit("Chưa quét đủ hoặc có lỗi trong cảnh.")
if any(k[2] < 57 or max(k[4], k[7], k[9] if len(k) > 9 else 0) > 300 for k in kq):
    sys.exit("Có bước dưới 57 khung/giây hoặc khựng quá 300 ms.")
PY
