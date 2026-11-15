// Làm nóng dần một cảnh trước khi đưa nó lên màn hình (Bản 3.2).
//
// Vì sao phải có: lần đầu một vật được vẽ, three.js và card đồ hoạ phải biên dịch chương trình đổ bóng của nó. Nếu để cả
// cảnh lên màn hình trong MỘT khung hình thì mấy chục chương trình bị biên dịch dồn một lúc và cửa sổ đứng hình: đo trên máy
// thật ngày 12/11/2026, khung hình đầu của Bài 1 mất 2,7 giây khi máy chưa có bộ nhớ đệm (0,17 giây khi đã có), trong lúc
// đó bấm gì cũng không ăn. Cảnh này đã gặp ba lần liền, vì lần nào cũng là lần mở đầu tiên sau khi cài bản mới.
//
// Cách làm: trước khi cho cảnh hiện, vẽ thử từng nhóm nhỏ vật vào một góc 8 × 8 điểm ảnh của chính bộ đệm cảnh (không ai
// thấy), mỗi khung hình chỉ làm trong khoảng chín mili giây rồi nhường lại cho cửa sổ. Sau mỗi nhóm hỏi lại card đồ hoạ một
// câu (gl.getError) để chờ nó làm xong và đo được nhóm đó mất bao lâu: nhanh thì gộp nhóm to dần (máy đã có bộ nhớ đệm:
// xong trong một hai khung hình), chậm thì chia nhỏ tới từng vật. Kể cả vật đang ẩn cũng làm nóng, để lúc bài giảng cho nó
// hiện ra (đổi bước, bấm nút «thử ngay») không bị khựng.

const LOP = 31;     // lớp riêng của lượt vẽ thử: máy quay chỉ nhìn lớp này, vật nào tới lượt mới được bật

export class LamNong {
  constructor(renderer, dungHinh, scene, camera) {
    this.renderer = renderer; this.dungHinh = dungHinh; this.scene = scene; this.camera = camera;
    this.gl = renderer.getContext();
    const daCo = new Set();
    const ds = [];
    scene.traverse((o) => {
      if (o.isLight) { o.layers.enable(LOP); return; }       // đèn phải có mặt trong lượt vẽ thử, kẻo chương trình biên dịch ra khác
      if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite) || !o.material) return;
      const vl = Array.isArray(o.material) ? o.material.map((m) => m?.uuid).join(',') : o.material.uuid;
      const khoa = `${vl}|${o.geometry?.uuid ?? ''}|${o.isInstancedMesh ? 'i' : ''}${o.isSkinnedMesh ? 's' : ''}${o.isPoints ? 'p' : ''}${o.isLine ? 'l' : ''}`;
      if (daCo.has(khoa)) return;                            // cùng vật liệu, cùng hình: vẽ thử một lần là đủ
      daCo.add(khoa);
      ds.push(o);
    });
    this.ds = ds; this.i = 0; this.moiLuot = 1;
    this.hauKy = dungHinh.cacBuocLamNong();
    this.tong = ds.length + this.hauKy.length;
    this.xong = 0;
    this.tBatDau = performance.now();
    this.msLauNhat = 0;      // nhóm lâu nhất (mili giây): chính là cú khựng dài nhất trong lúc làm nóng
    this.soLuot = 0;
  }

  get tiLe() { return this.tong ? Math.min(1, this.xong / this.tong) : 1; }

  // Làm thêm một ít, không quá `nganSach` mili giây (trừ khi riêng một vật đã lâu hơn thế). Trả về true khi đã xong hết.
  buoc(nganSach = 9) {
    const t0 = performance.now();
    for (;;) {
      if (!this.hauKy.length && this.i >= this.ds.length) return true;
      const t1 = performance.now();
      if (this.hauKy.length) {
        const viec = this.hauKy.shift();
        try { viec(); } catch (e) { console.warn('Làm nóng (hậu kỳ):', e); }
        this.xong++;
      } else {
        const lo = this.ds.slice(this.i, this.i + this.moiLuot);
        this.i += lo.length; this.xong += lo.length;
        try { this._ve(lo); } catch (e) { console.warn('Làm nóng:', e); }
      }
      this.gl.getError();              // chờ card đồ hoạ làm xong phần vừa gửi (kể cả biên dịch), để đo được nó mất bao lâu
      this.soLuot++;
      const ms = performance.now() - t1;
      if (ms > this.msLauNhat) this.msLauNhat = ms;
      // Nhóm không quá 4 vật: kể cả khi máy đã có bộ nhớ đệm, mỗi chương trình đổ bóng mới vẫn mất chừng 5–6 mili giây để
      // nạp (đo trên máy thật: một nhóm 17 chương trình làm khựng 131 mili giây), nên nhóm to là lại khựng.
      if (ms <= 2) this.moiLuot = Math.min(4, this.moiLuot * 2);
      else if (ms > 7) this.moiLuot = Math.max(1, this.moiLuot >> 1);
      if (performance.now() - t0 >= nganSach) break;
    }
    return !this.hauKy.length && this.i >= this.ds.length;
  }

  _ve(lo) {
    const cam = this.camera;
    const lopCu = cam.layers.mask;
    const an = [];
    for (const o of lo) {
      o.layers.enable(LOP);
      o.__nongFC = o.frustumCulled; o.frustumCulled = false;          // nằm ngoài tầm nhìn cũng phải vẽ thử
      for (let p = o; p; p = p.parent) if (p.visible === false) { an.push(p); p.visible = true; }   // đang ẩn: hiện tạm
    }
    cam.layers.set(LOP);
    try { this.dungHinh.veThu(this.scene, cam); }
    finally {
      cam.layers.mask = lopCu;
      for (const o of lo) { o.layers.disable(LOP); o.frustumCulled = o.__nongFC; delete o.__nongFC; }
      for (const p of an) p.visible = false;
    }
  }
}
