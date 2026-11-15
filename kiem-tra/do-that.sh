#!/bin/bash
# Đo app như người dùng thật: cửa sổ cỡ thật trên màn hình nét gấp đôi, gần như trong suốt (không che việc đang làm), tiếng câm.
#   bash kiem-tra/do-that.sh [đường dẫn .app] [mã chèn thêm, ví dụ 'window.__KB={giay:40,bai:15}']
# In bảng tóm tắt; số liệu đầy đủ nằm ở «Dữ liệu làm việc/Đo thật/do-that.json».
set -euo pipefail
cd "$(dirname "$0")/.."
APP="${1:-Dữ liệu làm việc/App thử/Vũ trụ 3D.app}"
case "${NGON_NGU_KIEM:-vi}" in vi|en|zh-CN|ja) ;; *) echo "Ngôn ngữ đo không hợp lệ."; exit 2 ;; esac
JS="localStorage.setItem('vu-tru-3d.ngon-ngu','${NGON_NGU_KIEM:-vi}'); ${2:-}"
GOC="$(pwd)/Dữ liệu làm việc/Đo thật"
mkdir -p "$GOC"
RA="$(mktemp -d "$GOC/luot-XXXXXX")"
echo "Kết quả: $RA"
"$APP/Contents/MacOS/vu-tru-3d" --do-that "$RA" --kich-ban "$(pwd)/kiem-tra/do-that/kich-ban.js" --thu-js "$JS" ${DO_THAT_THEM:-} || true
python3 - "$RA/do-that.json" "${NGON_NGU_KIEM:-vi}" <<'PY'
import json, sys
try: d = json.load(open(sys.argv[1], encoding='utf-8'))
except Exception as e: print('KHÔNG có kết quả đo:', e); sys.exit(1)
v = d['vo']; print(f"Màn hình {v['manHinh'][0]}×{v['manHinh'][1]}, nét ×{v['tiLeManHinh']}, {v['hz']} Hz · cửa sổ {v['khung'][2]}×{v['khung'][3]} · trang trả lời chậm nhất {d['treTraLoiLonNhatMs']} ms")
if d.get('hetGio'): print('HẾT GIỜ: trang không báo xong'); sys.exit(2)
t = d['trang']
if any(trang_thai == 'hidden' for _, trang_thai in t.get('hienAn', [])):
    print('WebKit báo cửa sổ bị che, cần đo lại khi hiển thị:', t['hienAn'])
    sys.exit(2)
if t.get('loiTongKet'): print('KỊCH BẢN ĐO LỖI:', t['loiTongKet'], t.get('loi')); sys.exit(2)
print(f"Bài {t['bai']} · dpr {t['dpr']} · độ nét {t['doNet']} · bộ đệm {t['bo'][0]}×{t['bo'][1]} · bấm mất {t['moc']['bamMs']} ms · tiếng chạy: {t['am']['sanSang']}")
k, j, r = t['khung'], t['js'], t['raf']
if not k or not j or not r:
    sys.exit('KHÔNG ĐẠT: thiếu mẫu khung hình sau khi bấm. Không tính được FPS và khoảng khựng. Xem JSON của lượt đo.')

print(f"Khung hình sau khi bấm: {t['khungMoiGiay']} khung/giây · khoảng cách giữa hai khung: giữa {k['p50']} ms, 95% dưới {k['p95']} ms, 99% dưới {k['p99']} ms, tệ nhất {k['max']} ms")
print(f"  số khung chậm: >33 ms: {t['tren33']} · >50 ms: {t['tren50']} · >100 ms: {t['tren100']} (trên {k['so']} khung)")
print(f"Phần tính toán mỗi khung: trung bình {j['tb']} ms, 95% dưới {j['p95']} ms, tệ nhất {j['max']} ms · chia ra: {t['thanhPhanMsMoiKhung']}")
print(f"Nhịp trình duyệt gọi: giữa {r['p50']} ms, tệ nhất {r['max']} ms")
print('Theo giây (giây tính từ lúc bấm | số lần trình duyệt gọi | số khung vẽ | khoảng trống dài nhất ms | tính toán TB ms | tính toán tệ nhất ms):')
print('  ' + '  '.join(f"{g[0]:>3}s:{g[1]}/{g[2]}/{g[3]}/{g[4]}/{g[5]}" for g in t['theoGiay']))
print(f"Số chương trình đổ bóng đã biên dịch: {t.get('soChuongTrinh')} · biên dịch song song: {t.get('moRong')} · bấm lúc {t.get('bamLuc')} ms sau khi trang chạy")
print('Mốc (ms từ lúc trang chạy):')
for sk in t.get('suKien', []): print('   ', sk[0], sk[1], (sk[2] if len(sk) > 2 else ''))
print('Khung hình nặng (ms từ lúc trang chạy | mất bao lâu | theo phần | lệnh WebGL phải chờ [tên, số lần, ms]):')
for kn in t.get('khungNang', []): print('   ', kn[0], '|', kn[1], 'ms |', kn[2], '|', kn[3])
print('Lệnh WebGL tốn thời gian chờ nhất cả lượt [tên, số lần, tổng ms, lần lâu nhất ms]:')
for g in t.get('glTong', []): print('   ', g)
if t.get('conChay'): print('Cuối lượt đo, mô hình còn chạy không:', t['conChay'])
if t['khungCham']: print('Khung chậm (ms sau khi bấm, khoảng cách, tính toán của khung trước):', t['khungCham'][:25])
if t.get("lang") != sys.argv[2]: sys.exit("Đo nhầm ngôn ngữ.")
if t['loi'] or t['loiGhi'] or t['matNguCanh']:
    print('LỖI:', t['loi'], t['loiGhi'], 'mất ngữ cảnh' if t['matNguCanh'] else '')
    sys.exit(1)
if t['khungMoiGiay'] < 57 or max(k['max'], r['max'], t['moc']['bamMs'], d['treTraLoiLonNhatMs']) > 300:
    sys.exit('Chưa đạt 57 khung/giây hoặc có lần khựng quá 300 ms.')
PY
