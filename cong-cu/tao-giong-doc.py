#!/usr/bin/env python3
"""Tạo tệp tiếng giọng đọc lời giảng cho Vũ trụ 3D.

Đọc src/loi-doc/vi/<id>.json, với mỗi bài, mỗi bước, mỗi giọng thì tạo
giong-doc/<giọng>/<id bài>-<số bước từ 1>.mp3 bằng edge-tts (giọng Microsoft, miễn phí),
rồi chuẩn hoá độ to bằng ffmpeg (loudnorm hai lượt, khoảng -18 LUFS, đỉnh -2 dBTP)
và mã hoá mp3 đơn kênh 64 kbps.

Ghi giong-doc/danh-sach.json: số bước, thời lượng từng tệp, mã băm của lời.
Lần sau chỉ tạo lại bước nào lời (hoặc bảng cách đọc, hoặc cài đặt giọng) đã đổi;
không có gì đổi thì không gọi mạng.

Chạy (từ thư mục dự án):
    "Dữ liệu làm việc/venv-giong-doc/bin/python" cong-cu/tao-giong-doc.py
    ... --bai he-mat-troi          chỉ làm một bài
    ... --giong hoai-my            chỉ làm một giọng
    ... --lam-lai                  tạo lại hết, bỏ qua mã băm
    ... --xem                      chỉ in lời đưa cho máy đọc (sau khi thay cách đọc), không tạo tiếng

Công cụ chỉ ghi tệp, không phát tiếng.
"""
import argparse
import asyncio
import hashlib
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
THU_MUC_LOI = GOC / 'src' / 'loi-doc' / 'vi'
THU_MUC_RA = GOC / 'giong-doc'
THU_MUC_TAM = GOC / 'Dữ liệu làm việc' / 'giong-doc'
DANH_SACH = THU_MUC_RA / 'danh-sach.json'
FFMPEG = shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg'
FFPROBE = shutil.which('ffprobe') or '/opt/homebrew/bin/ffprobe'

GIONG = {
    'hoai-my': {'ten': 'vi-VN-HoaiMyNeural', 'toc_do': '+0%'},   # nữ
    'nam-minh': {'ten': 'vi-VN-NamMinhNeural', 'toc_do': '+0%'},  # nam
}

SO_LAN_THU = 200     # máy chủ giọng tiếng Việt từ chối khoảng hai phần ba số lần (12/11/2026)
NGHI_GIUA_YEU_CAU = 1.0   # giây chờ giữa hai lần gửi, cho đỡ bị từ chối
NGHI_GIUA_CAU = 0.35  # giây lặng sau mỗi câu khi nối (đã cắt khoảng lặng cuối câu của máy;
                      # cộng khoảng lặng đầu câu sau, chỗ nghỉ giữa hai câu khoảng 0,55 giây)

# Chuẩn hoá độ to và mã hoá.
DO_TO = {'I': -18.0, 'TP': -2.0, 'LRA': 11.0}
MA_HOA = ['-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '64k']

# Bảng cách đọc: chữ trong lời (hiển thị) -> chữ đưa cho máy đọc.
# Chỉ thay nguyên từ (có ranh giới từ). Mục dài đặt trước mục ngắn.
CACH_DOC = [
    ('Proxima Centauri', 'Prốc-xi-ma Xen-tau-ri'),
    ('Tycho Brahe', 'Ti-cô Bra-hê'),
    ('Voyager', 'Voi-a-giơ'),
    ('Kepler', 'Kép-lơ'),
    ('Kuiper', 'Cai-pơ'),
    ('NASA', 'Na-xa'),
    ('JPL', 'Giây Pi Eo'),
    ('logarit', 'lô-ga-rít'),
    ('elip', 'e-líp'),
]

# Đổi chuỗi này (hoặc bảng cách đọc, hoặc giọng) thì mọi tệp được ghép lại.
PHIEN_BAN_CACH_LAM = 'tung-cau-catlang-nghi0.35-loudnorm2-I-18-TP-2-mono-24k-64k'
# Khoá của kho câu đã tải trong «Dữ liệu làm việc/giong-doc/cau». Giữ cố định để đổi cách ghép
# không phải tải lại từ mạng; chỉ đổi khi muốn tải lại mọi câu.
PHIEN_BAN_TAI_CAU = 'tung-cau-nghi0.2-loudnorm2-I-18-TP-2-mono-24k-64k'


def doc_loi_doc():
    """Đọc lời đọc của mọi bài: mỗi bài một tệp src/loi-doc/vi/<id>.json = {"bai": id, "buoc": [lời bước 1, …]}."""
    kq = {}
    for tep in sorted(THU_MUC_LOI.glob('*.json')):
        d = json.loads(tep.read_text('utf-8'))
        id_bai = d.get('bai') or tep.stem
        if id_bai != tep.stem:
            sys.exit(f'{tep.name}: trường "bai" ({id_bai}) phải trùng tên tệp')
        if not isinstance(d.get('buoc'), list) or not all(isinstance(x, str) and x.strip() for x in d['buoc']):
            sys.exit(f'{tep.name}: "buoc" phải là danh sách lời đọc (chuỗi khác rỗng)')
        kq[id_bai] = d['buoc']
    return kq


def loi_cho_may(loi):
    """Áp bảng cách đọc, gom khoảng trắng."""
    for chu, doc in CACH_DOC:
        loi = re.sub(r'(?<!\w)' + re.escape(chu) + r'(?!\w)', doc, loi)
    return re.sub(r'\s+', ' ', loi).strip()


def ma_bam(loi_may, giong, phien_ban=PHIEN_BAN_CACH_LAM):
    g = GIONG[giong]
    s = '\n'.join([loi_may, g['ten'], g['toc_do'], phien_ban])
    return hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]


def thoi_luong(tep):
    kq = subprocess.run(
        [FFPROBE, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(tep)],
        capture_output=True, text=True, check=True,
    )
    return round(float(kq.stdout.strip()), 2)


def tach_cau(loi_may):
    """Tách lời thành từng câu. Máy chủ hay từ chối đoạn dài, nên gửi từng câu một."""
    return [c for c in re.split(r'(?<=[.!?])\s+', loi_may) if c.strip()]


async def doc_mot_cau(cau, giong, tep):
    import edge_tts  # chỉ nạp khi thật sự cần gọi mạng
    g = GIONG[giong]
    lan = 0
    while True:
        lan += 1
        try:
            # Luân phiên vài cách viết tương đương của câu (bỏ dấu chấm cuối...) khi bị từ chối.
            # Thử 12/11/2026 cho thấy lỗi phần lớn do máy chủ giọng tiếng Việt chập chờn chứ
            # không do chữ, nhưng đổi cách viết cũng không hại: chỗ nghỉ do bước nối thêm vào.
            bien_the = [cau, cau.rstrip('.!?'), cau.rstrip('.!?') + ';', cau + ' ']
            tam = tep.with_suffix('.dang-tai')
            # Giới hạn 90 giây mỗi lần gửi: từng gặp tiến trình treo gần một giờ sau lỗi mạng.
            await asyncio.wait_for(
                edge_tts.Communicate(bien_the[(lan - 1) % len(bien_the)], g['ten'], rate=g['toc_do']).save(str(tam)),
                timeout=90)
            if tam.stat().st_size < 1000:
                raise RuntimeError('tệp tiếng nhận về quá nhỏ')
            thoi_luong(tam)   # ffprobe đọc được thì mới nhận
            tam.replace(tep)
            return
        except Exception as loi:
            # Máy chủ đôi lúc trả «No audio was received» thất thường (đã gặp 12/11/2026),
            # chờ lâu dần rồi thử lại.
            tam = tep.with_suffix('.dang-tai')
            if tam.exists():
                tam.unlink()
            if lan >= SO_LAN_THU:
                raise
            cho = 3 if lan % 20 else 60   # thử dồn, cứ 20 lần thì nghỉ một phút
            print(f'    lỗi lần {lan} ({cau[:30]}…): {type(loi).__name__}; chờ {cho} giây', file=sys.stderr)
            await asyncio.sleep(cho)


def doc_bang_may(loi_may, giong, tep_tho):
    """Đọc từng câu (giữ lại câu đã có trong thư mục tạm), rồi nối thành một tệp wav."""
    thu_muc_cau = THU_MUC_TAM / 'cau' / giong
    thu_muc_cau.mkdir(parents=True, exist_ok=True)
    ds = []
    for cau in tach_cau(loi_may):
        tep = thu_muc_cau / (ma_bam(cau, giong, PHIEN_BAN_TAI_CAU) + '.mp3')
        if tep.exists():
            try:
                thoi_luong(tep)
            except Exception:
                tep.unlink()   # tệp hỏng (lần trước bị ngắt giữa chừng): tải lại
        if not tep.exists():
            asyncio.run(doc_mot_cau(cau, giong, tep))
            time.sleep(NGHI_GIUA_YEU_CAU)
        ds.append(tep)
    # Nối các câu: cắt khoảng lặng cuối mỗi câu (máy để dư gần 0,85 giây), rồi thêm một quãng nghỉ cố định.
    vao = []
    for t in ds:
        vao += ['-i', str(t)]
    loc = ''.join(f'[{k}:a]aresample=24000,aformat=channel_layouts=mono,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur={NGHI_GIUA_CAU}[a{k}];' for k in range(len(ds)))
    loc += ''.join(f'[a{k}]' for k in range(len(ds))) + f'concat=n={len(ds)}:v=0:a=1[ra]'
    subprocess.run(
        [FFMPEG, '-hide_banner', '-nostdin', '-loglevel', 'error', '-y', *vao,
         '-filter_complex', loc, '-map', '[ra]', str(tep_tho)],
        check=True,
    )


def chuan_hoa(tep_tho, tep_ra):
    """loudnorm hai lượt: lượt 1 đo, lượt 2 chỉnh tuyến tính theo số đo."""
    dich = f"I={DO_TO['I']}:TP={DO_TO['TP']}:LRA={DO_TO['LRA']}"
    kq = subprocess.run(
        [FFMPEG, '-hide_banner', '-nostdin', '-i', str(tep_tho),
         '-af', f'loudnorm={dich}:print_format=json', '-f', 'null', '-'],
        capture_output=True, text=True, check=True,
    )
    khoi = kq.stderr[kq.stderr.rindex('{'):kq.stderr.rindex('}') + 1]
    do = json.loads(khoi)
    loc = (
        f"loudnorm={dich}:measured_I={do['input_i']}:measured_TP={do['input_tp']}"
        f":measured_LRA={do['input_lra']}:measured_thresh={do['input_thresh']}"
        f":offset={do['target_offset']}:linear=true"
    )
    tep_ra.parent.mkdir(parents=True, exist_ok=True)
    tam = tep_ra.with_suffix('.dang-ghi.mp3')
    subprocess.run(
        [FFMPEG, '-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', str(tep_tho),
         '-af', loc, *MA_HOA, '-map_metadata', '-1', str(tam)],
        check=True,
    )
    tam.replace(tep_ra)


def main():
    ap = argparse.ArgumentParser(description='Tạo giọng đọc lời giảng (edge-tts).')
    ap.add_argument('--bai', action='append', help='id bài (lặp được); mặc định mọi bài')
    ap.add_argument('--giong', action='append', choices=list(GIONG), help='giọng (lặp được); mặc định cả hai')
    ap.add_argument('--lam-lai', action='store_true', help='tạo lại hết')
    ap.add_argument('--xem', action='store_true', help='chỉ in lời đưa cho máy, không tạo tiếng')
    tham = ap.parse_args()

    loi_doc = doc_loi_doc()
    ds_bai = tham.bai or list(loi_doc)
    ds_giong = tham.giong or list(GIONG)
    for id_bai in ds_bai:
        if id_bai not in loi_doc:
            sys.exit(f'Không có bài «{id_bai}» trong src/loi-doc/vi/')

    if tham.xem:
        for id_bai in ds_bai:
            for i, loi in enumerate(loi_doc[id_bai], 1):
                print(f'--- {id_bai} bước {i}\n{loi_cho_may(loi)}\n')
        return

    danh_sach = json.loads(DANH_SACH.read_text('utf-8')) if DANH_SACH.exists() else {}
    da_tao = da_giu = 0
    loi_con = []
    for giong in ds_giong:
        muc_giong = danh_sach.setdefault(giong, {'giongMay': GIONG[giong]['ten'], 'bai': {}})
        muc_giong['giongMay'] = GIONG[giong]['ten']
        for id_bai in ds_bai:
            ds_loi = loi_doc[id_bai]
            cu = {b['buoc']: b for b in muc_giong['bai'].get(id_bai, {}).get('tep', [])}
            moi = []
            for i, loi in enumerate(ds_loi, 1):
                loi_may = loi_cho_may(loi)
                bam = ma_bam(loi_may, giong)
                ten_tep = f'{id_bai}-{i}.mp3'
                tep_ra = THU_MUC_RA / giong / ten_tep
                c = cu.get(i)
                if not tham.lam_lai and c and c.get('bam') == bam and tep_ra.exists():
                    moi.append(c)
                    da_giu += 1
                    continue
                print(f'  tạo {giong}/{ten_tep}')
                tep_tho = THU_MUC_TAM / giong / ten_tep.replace('.mp3', '.wav')
                tep_tho.parent.mkdir(parents=True, exist_ok=True)
                try:
                    doc_bang_may(loi_may, giong, tep_tho)
                except Exception as loi:
                    print(f'  KHÔNG tạo được {giong}/{ten_tep}: {loi}. Chạy lại công cụ sau.', file=sys.stderr)
                    loi_con.append(f'{giong}/{ten_tep}')
                    if c:
                        moi.append(c)   # giữ mục cũ (nếu có) cho tới khi tạo lại được
                    continue
                chuan_hoa(tep_tho, tep_ra)
                moi.append({
                    'buoc': i,
                    'tep': f'{giong}/{ten_tep}',
                    'giay': thoi_luong(tep_ra),
                    'soChu': len(loi.split()),
                    'bam': bam,
                })
                da_tao += 1
            # Bước thừa (lời bị bớt bước): báo để người dọn, không tự xoá.
            for so in sorted(set(cu) - set(range(1, len(ds_loi) + 1))):
                print(f'  lưu ý: {giong}/{id_bai}-{so}.mp3 không còn lời tương ứng, có thể bỏ', file=sys.stderr)
            muc_giong['bai'][id_bai] = {
                'soBuoc': len(ds_loi),
                'tongGiay': round(sum(b['giay'] for b in moi), 2),
                'tep': moi,
            }
            # Ghi sau mỗi bài để lỡ đứt mạng giữa chừng thì lần sau không làm lại phần đã xong.
            THU_MUC_RA.mkdir(parents=True, exist_ok=True)
            DANH_SACH.write_text(json.dumps(danh_sach, ensure_ascii=False, indent=2) + '\n', 'utf-8')

    print(f'Xong: tạo mới {da_tao} tệp, giữ nguyên {da_giu} tệp.')
    if loi_con:
        sys.exit(f'Còn {len(loi_con)} tệp chưa tạo được: ' + ', '.join(loi_con))


if __name__ == '__main__':
    main()
