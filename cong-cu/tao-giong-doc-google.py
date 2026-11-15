#!/usr/bin/env python3
"""Tạo giọng đọc lời giảng bằng giọng Google Chirp 3 HD (giọng dùng cho mọi lời giảng tiếng Việt của Trí Lữ).

Giọng đã chọn sau khi nghe thử (12/11/2026): giọng nam «Algieba», tốc độ 1,2.
Giọng Microsoft (edge-tts, tệp tao-giong-doc.py) nghe còn máy: không dùng cho lời giảng nữa.

Chạy (từ thư mục dự án; máy đã đăng nhập gcloud, có ffmpeg):
    uvx --from mlx-whisper python cong-cu/tao-giong-doc-google.py              mọi bài có lời trong src/loi-doc/vi/
    … --bai he-mat-troi      chỉ một bài            … --lam-lai      tạo lại hết
    … --tran 230000          trần số ký tự gửi đi mỗi tháng (mặc định 230 000; chạm trần thì dừng, không gửi)
    … --khong-phu-de         không tạo mốc phụ đề sau khi tạo tiếng
Lời đọc: mỗi bài một tệp src/loi-doc/vi/<id>.json = {"bai": id, "buoc": [lời bước 1, …]}.
Mỗi bước gửi một lần, đọc liền cả đoạn cho tự nhiên. Giọng này mỗi lần đọc một khác và đôi khi lệch dấu một chữ, nên
mỗi bước được Whisper nghe lại: lệch từ NGUONG chỗ trở lên (mặc định 3) thì đọc lại, tối đa LUOT lượt (mặc định 2), giữ
lượt ít chỗ khác nhất. Lệch 1–2 chỗ thường là máy nghe sai số hay tên riêng, không đáng tốn thêm ký tự.
Sổ đếm ký tự theo tháng: giong-doc/so-ky-tu.json (ghi ngay sau mỗi lần gửi). Gói miễn phí của Google cho giọng Chirp 3 HD
là 1 triệu ký tự mỗi tháng; trần mặc định giữ xa mức đó, ngân sách ký tự ghi trong sổ giong-doc/so-ky-tu.json.
Tạo xong tiếng thì tự gọi cong-cu/tao-phu-de.py cho các tệp vừa tạo (mốc phụ đề cho chế độ «Xem như video»).
Chỉ gửi đi lời đọc, không gửi tên hay thông tin cá nhân. KHÔNG phát tiếng trên máy: công cụ chỉ ghi tệp.
"""
import argparse, base64, difflib, hashlib, importlib.util, json, os, re, subprocess, sys, time, types, unicodedata, urllib.error, urllib.request, wave
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
sys.modules.setdefault('edge_tts', types.ModuleType('edge_tts'))        # công cụ cũ nạp edge_tts; ở đây không cần tới
_spec = importlib.util.spec_from_file_location('cong_cu_cu', GOC / 'cong-cu' / 'tao-giong-doc.py')
cu = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(cu)

GIONG = os.environ.get('GIONG', 'Algieba')            # tên giọng Chirp 3 HD
TOC_DO = float(os.environ.get('TOCDO', '1.2'))
LUOT = int(os.environ.get('LUOT', '2'))
NGUONG = int(os.environ.get('NGUONG', '3'))      # số chỗ lệch từ đó trở lên mới đọc lại
KHOA = GIONG.lower()
TEN_MAY = f'vi-VN-Chirp3-HD-{GIONG}'
PHIEN_BAN = 'google-chirp3hd-ca-doan-loudnorm2-mono-44k-96k'
cu.MA_HOA = ['-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '96k']     # giọng tốt thì giữ dải cao, đừng nén 24 kHz
ENV = dict(os.environ, PATH='/opt/homebrew/share/google-cloud-sdk/bin:/opt/homebrew/bin:' + os.environ.get('PATH', ''))
TAM = GOC / 'Dữ liệu làm việc' / 'giong-doc' / ('google-' + KHOA)


def lenh(*a):
    return subprocess.run(a, capture_output=True, text=True, env=ENV).stdout.strip()


TK = PRJ = None
SO_KY_TU = 0
SO_KY_TU_THANG = GOC / 'giong-doc' / 'so-ky-tu.json'
TRAN = 230000


class ChamTran(Exception):
    pass


def thang_nay():
    return time.strftime('%Y-%m')


def doc_so():
    try:
        return json.loads(SO_KY_TU_THANG.read_text('utf-8'))
    except Exception:
        return {}


def ghi_so(them):
    so = doc_so()
    so[thang_nay()] = so.get(thang_nay(), 0) + them
    SO_KY_TU_THANG.write_text(json.dumps(so, ensure_ascii=False, indent=1) + '\n', 'utf-8')


def goi_google(loi):
    """Một lần gọi: trả về các khung âm thanh PCM 16 bit, 48 kHz, một kênh."""
    global TK, PRJ, SO_KY_TU
    da_dung = doc_so().get(thang_nay(), 0)
    if da_dung + len(loi) > TRAN:
        raise ChamTran(f'Tháng {thang_nay()} đã gửi {da_dung} ký tự; gửi thêm {len(loi)} sẽ vượt trần {TRAN}. Dừng, không gửi.')
    if TK is None:
        TK = lenh('gcloud', 'auth', 'print-access-token'); PRJ = lenh('gcloud', 'config', 'get-value', 'project')
        if not TK: sys.exit('Không lấy được đăng nhập gcloud.')
    than = {'input': {'text': loi}, 'voice': {'languageCode': 'vi-VN', 'name': TEN_MAY},
            'audioConfig': {'audioEncoding': 'LINEAR16', 'sampleRateHertz': 48000, 'speakingRate': TOC_DO}}
    loi_cuoi = ''
    for lan in range(5):
        try:
            yc = urllib.request.Request('https://texttospeech.googleapis.com/v1/text:synthesize', data=json.dumps(than).encode(),
                                        headers={'Authorization': 'Bearer ' + TK, 'x-goog-user-project': PRJ, 'Content-Type': 'application/json'})
            kq = json.load(urllib.request.urlopen(yc, timeout=180))
            SO_KY_TU += len(loi)
            ghi_so(len(loi))
            du = base64.b64decode(kq['audioContent'])
            tep = TAM / '_mot-lan.wav'; tep.write_bytes(du)
            with wave.open(str(tep)) as w: return w.readframes(w.getnframes())
        except urllib.error.HTTPError as e:
            loi_cuoi = f'{e.code} {e.read().decode()[:200]}'
            if e.code == 400: raise ValueError(loi_cuoi)
        except Exception as e:
            loi_cuoi = str(e)[:160]
        time.sleep(3 + 3 * lan)
    raise RuntimeError('Google không trả lời: ' + loi_cuoi)


def doc(loi, tep_wav):
    """Đọc cả đoạn một lần; nếu dịch vụ chê câu quá dài thì chia theo câu thành các khúc khoảng 400 ký tự."""
    try:
        khung = goi_google(loi)
    except ValueError:
        khuc, dang = [], ''
        for cau in re.split(r'(?<=[.!?])\s+', loi):
            if dang and len(dang) + len(cau) > 400: khuc.append(dang); dang = cau
            else: dang = (dang + ' ' + cau).strip()
        if dang: khuc.append(dang)
        khung = b''.join(goi_google(k) for k in khuc)
    with wave.open(str(tep_wav), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000); w.writeframes(khung)


def chuan(s):
    return re.sub(r'[^\w\s]', ' ', unicodedata.normalize('NFC', s.lower())).split()


def nghe_va_cham(tep_wav, loi):
    """Cho Whisper nghe rồi đếm chỗ khác với lời (bỏ qua con số, vì máy nghe ghi số bằng chữ số)."""
    import numpy as np, mlx_whisper
    with wave.open(str(tep_wav)) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    x16 = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype(np.float32)
    kq = mlx_whisper.transcribe(x16, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='vi', condition_on_previous_text=False)
    co_so = lambda t: any(c.isdigit() for c in t)
    goc = [t for t in chuan(loi) if not co_so(t)]; nghe = [t for t in chuan(kq['text']) if not co_so(t)]
    sm = difflib.SequenceMatcher(None, goc, nghe, autojunk=False)
    sai = [f"[{' '.join(goc[a:b])} → {' '.join(nghe[c:d])}]" for the, a, b, c, d in sm.get_opcodes() if the != 'equal']
    return len(sai), sai


def main():
    ap = argparse.ArgumentParser(description='Tạo giọng đọc lời giảng bằng giọng Google Chirp 3 HD.')
    ap.add_argument('--bai', action='append'); ap.add_argument('--lam-lai', action='store_true'); ap.add_argument('--khong-nghe', action='store_true')
    ap.add_argument('--tran', type=int, default=230000, help='trần số ký tự gửi đi mỗi tháng (mặc định 230 000)')
    ap.add_argument('--khong-phu-de', action='store_true', help='không tạo mốc phụ đề sau khi tạo tiếng')
    tham = ap.parse_args()
    global TRAN
    TRAN = tham.tran
    print(f'Tháng {thang_nay()}: đã gửi {doc_so().get(thang_nay(), 0)} ký tự, trần {TRAN}.', flush=True)
    vua_tao = []        # (lời, tệp mp3) vừa tạo, để làm mốc phụ đề
    try:
        _chay(tham, vua_tao)
    except ChamTran as e:
        print('DỪNG:', e, flush=True)
    if vua_tao and not tham.khong_phu_de:
        _sp = importlib.util.spec_from_file_location('tao_phu_de', GOC / 'cong-cu' / 'tao-phu-de.py')
        pd = importlib.util.module_from_spec(_sp); _sp.loader.exec_module(pd)
        cau = pd.chia_cau([l for l, _ in vua_tao])
        for (loi, mp3), c in zip(vua_tao, cau):
            ra, ti_le = pd.tao_cho_tep(loi, mp3, c)
            print(f'  mốc phụ đề {ra.name}: {len(c)} câu, khớp {ti_le * 100:.0f}% số từ', flush=True)
    print(f'Xong. Số ký tự đã gửi đi lần này: {SO_KY_TU}. Giọng: {TEN_MAY}, tốc độ {TOC_DO}.')


def _chay(tham, vua_tao):
    loi_doc = cu.doc_loi_doc()
    ds_bai = tham.bai or list(loi_doc)
    TAM.mkdir(parents=True, exist_ok=True)
    danh_sach = json.loads(cu.DANH_SACH.read_text('utf-8')) if cu.DANH_SACH.exists() else {}
    muc = danh_sach.setdefault(KHOA, {'bai': {}})
    muc.update({'giongMay': TEN_MAY, 'tocDo': TOC_DO, 'ten': 'Giọng đọc'})
    for id_bai in ds_bai:
        if id_bai not in loi_doc: sys.exit(f'Không có bài «{id_bai}» trong src/loi-doc/vi/')
        cu_tep = {b['buoc']: b for b in muc['bai'].get(id_bai, {}).get('tep', [])}
        moi = []
        for i, loi in enumerate(loi_doc[id_bai], 1):
            loi_may = cu.loi_cho_may(loi)
            bam = hashlib.sha256('\n'.join([loi_may, TEN_MAY, str(TOC_DO), PHIEN_BAN]).encode()).hexdigest()[:16]
            ten = f'{id_bai}-{i}.mp3'; ra = cu.THU_MUC_RA / KHOA / ten
            c = cu_tep.get(i)
            if not tham.lam_lai and c and c.get('bam') == bam and ra.exists(): moi.append(c); continue
            tot = None
            for luot in range(1, LUOT + 1):
                tep = TAM / f'{id_bai}-{i}.luot{luot}.wav'
                doc(loi_may, tep)
                diem, sai = (0, []) if tham.khong_nghe else nghe_va_cham(tep, loi_may)
                print(f'  {id_bai} bước {i}, lượt {luot}: {diem} chỗ khác {" ".join(sai)[:300]}', flush=True)
                if tot is None or diem < tot[0]: tot = (diem, tep, sai)
                if diem < NGUONG: break
            cu.chuan_hoa(tot[1], ra)
            vua_tao.append((re.sub(r'\s+', ' ', loi).strip(), ra))
            moi.append({'buoc': i, 'tep': f'{KHOA}/{ten}', 'giay': cu.thoi_luong(ra), 'soChu': len(loi.split()), 'bam': bam, 'choKhac': tot[0]})
            print(f'  → giữ lượt có {tot[0]} chỗ khác · {moi[-1]["giay"]} giây', flush=True)
            # Ghi ngay sau mỗi bước (chạm trần ký tự giữa chừng thì các tệp đã tạo vẫn có trong danh sách).
            ghi_ds(danh_sach, muc, id_bai, moi + [cu_tep[j] for j in sorted(cu_tep) if j > i])
        ghi_ds(danh_sach, muc, id_bai, moi)


def ghi_ds(danh_sach, muc, id_bai, ds):
    muc['bai'][id_bai] = {'soBuoc': len(ds), 'tongGiay': round(sum(b['giay'] for b in ds), 1), 'tep': ds}
    cu.DANH_SACH.write_text(json.dumps(danh_sach, ensure_ascii=False, indent=1), 'utf-8')


if __name__ == '__main__':
    main()
