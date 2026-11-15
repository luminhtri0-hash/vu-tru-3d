import { NGON_NGU, ngonNgu, dich, nhoNgonNgu } from './dich.js';

export function nutNgonNgu(id, layApp) {
  const nut = document.createElement('select');
  nut.id = id;
  nut.className = 'chon-ngon-ngu';
  const nhan = dich('chung', 'chon-ngon-ngu', 'Chọn ngôn ngữ');
  nut.setAttribute('aria-label', nhan);
  nut.title = nhan;
  for (const [ma, ten] of Object.entries(NGON_NGU)) {
    const luaChon = new Option(ten, ma, false, ma === ngonNgu);
    luaChon.lang = ma;
    nut.add(luaChon);
  }
  nut.addEventListener('keydown', (e) => e.stopPropagation());
  nut.addEventListener('change', () => {
    const app = layApp();
    nhoNgonNgu(nut.value);
    const url = new URL(location.href);
    url.searchParams.set('lang', nut.value);
    if (app && !app.dangChao && app.chiSo >= 0) {
      url.searchParams.set('canh', app.dsCanh[app.chiSo].id);
      url.searchParams.set('buoc', String(app.chiSoBuoc + 1));
      const tab = document.querySelector('.tab .chon')?.dataset.tab;
      if (tab) url.searchParams.set('tab', tab);
    }
    location.replace(url.href);
  });
  return nut;
}
