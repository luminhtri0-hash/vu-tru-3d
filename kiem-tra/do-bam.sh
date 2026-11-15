#!/bin/bash
# Đo riêng LẦN BẤM «Bắt đầu học» nhiều lượt liền (cửa sổ gần như trong suốt, tiếng câm): lần bấm mất bao lâu, lệnh mở
# thiết bị âm thanh (AudioContext.resume) chiếm bao nhiêu, trang có trả lời vỏ app không, và cửa sổ có bị hệ điều hành
# che không. Dùng được cả khi màn hình đang khoá (lúc đó WebKit không cấp khung hình, nhưng mã của trang vẫn chạy).
#   bash kiem-tra/do-bam.sh [số lượt, mặc định 5] [ngôn ngữ, mặc định vi] [đường dẫn .app] [giây nghỉ giữa hai lượt, mặc định 0]
# Đây là phép đo: chạy một mình, không qua co-khoa.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
SO="${1:-5}"; MA="${2:-vi}"; APP="${3:-Dữ liệu làm việc/App thử/Vũ trụ 3D.app}"; NGHI="${4:-0}"
JS='window.__KB={giay:3,re:false};(function(){var ds=window.__KB.pha=[];function boc(o,ten){var g=o[ten];o[ten]=function(){var n=performance.now();try{return g.apply(this,arguments)}finally{ds.push([ten,Math.round(n),Math.round((performance.now()-n)*10)/10])}}}boc(AudioContext.prototype,"resume");var AC=window.AudioContext;window.AudioContext=new Proxy(AC,{construct:function(C,a){var n=performance.now();try{return Reflect.construct(C,a)}finally{ds.push(["new AudioContext",Math.round(n),Math.round((performance.now()-n)*10)/10])}}});})();'
for i in $(seq 1 "$SO"); do
  TAI="$(uptime | sed 's/.*load averages: //')"
  RA="$( (NGON_NGU_KIEM="$MA" bash kiem-tra/do-that.sh "$APP" "$JS" 2>/dev/null || true) | sed -n 's/^Kết quả: //p')"
  python3 - "$RA/do-that.json" "$i" "$MA" "$TAI" <<'PY'
import json, sys
try: d = json.load(open(sys.argv[1], encoding='utf-8'))
except Exception as e: print(f'lượt {sys.argv[2]}: không có kết quả ({e})'); sys.exit(0)
t = d.get('trang') or {}
pha = (t.get('kb') or {}).get('pha') or []
moc = t.get('moc') or {}
am = [sk for sk in t.get('suKien', []) if 'tiếng' in sk[1]]
raf = (t.get('raf') or {}).get('so', 0)
print(f"lượt {sys.argv[2]} [{sys.argv[3]}] tải {sys.argv[4]} | bấm mất {moc.get('bamMs')} ms | bấm lúc {t.get('bamLuc')} | âm thanh: {pha} | tiếng chạy lúc {am[0][0] if am else '?'} | trang trả lời chậm nhất {d.get('treTraLoiLonNhatMs')} ms | khung sau bấm: {raf}, tệ nhất {(t.get('khung') or {}).get('max')} ms | trang ẩn: {t.get('hienAn')} | cửa sổ: {d.get('cuaSo')}")
PY
  [ "$NGHI" = 0 ] || sleep "$NGHI"
done
