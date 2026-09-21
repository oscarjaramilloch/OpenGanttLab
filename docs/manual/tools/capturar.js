/* Genera las capturas del manual a partir de la aplicación REAL (src/OpenGanttLab 3.1.html) con el
   proyecto de ejemplo inventado de demo-data.js. Uso:
     npm i puppeteer-core            (una vez, en cualquier carpeta accesible por NODE_PATH)
     node capturar.js                (todas)   |   node capturar.js 07 12   (solo esas figuras)
   Salida: ../images/screenshots (capturas) y ../images/annotated (con recuadros numerados). */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { ROWS, demoXml } = require('./demo-data.js');
const figuras = require('./figuras.js');

const ROOT = path.resolve(__dirname, '../../..');
const APP = 'file:///' + path.join(ROOT, 'src', 'OpenGanttLab 3.1.html').replace(/\\/g, '/').replace(/ /g, '%20');
const IMG = path.resolve(__dirname, '../images');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 1440, H = 900;
const sleep = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(IMG + '/screenshots', { recursive: true });
fs.mkdirSync(IMG + '/annotated', { recursive: true });

/* ── anotaciones: recuadro fino + insignia numerada (sobre la página, se quitan después) ── */
const ANN_JS = items => {
  document.getElementById('__ann')?.remove();
  const o = document.createElement('div');
  o.id = '__ann'; o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none';
  items.forEach(it => {
    let r = it.rect;
    if (!r) { const el = document.querySelector(it.sel); if (!el) { console.warn('sin elemento', it.sel); return; } const b = el.getBoundingClientRect(); r = { x: b.left, y: b.top, w: b.width, h: b.height }; }
    const p = it.pad ?? 3;
    const box = document.createElement('div');
    box.style.cssText = `position:absolute;left:${r.x - p}px;top:${r.y - p}px;width:${r.w + 2 * p}px;height:${r.h + 2 * p}px;border:2px solid #2563eb;border-radius:8px;background:rgba(37,99,235,.07);box-sizing:border-box`;
    const bd = document.createElement('div');
    const at = it.at || 'tl';
    const bx = at.includes('r') ? r.x + r.w + p - 12 : at.includes('c') ? r.x + r.w / 2 - 12 : r.x - p - 12;
    const by = at.includes('b') ? r.y + r.h + p - 12 : r.y - p - 12;
    bd.textContent = it.n;
    const cx = Math.min(innerWidth - 28, Math.max(4, bx + (it.dx || 0))), cy = Math.min(innerHeight - 28, Math.max(4, by + (it.dy || 0)));
    bd.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:24px;height:24px;border-radius:50%;background:#2563eb;color:#fff;font:700 13px/24px Inter,Segoe UI,Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(15,45,91,.35)`;
    o.append(box, bd);
  });
  document.body.appendChild(o);
};

async function abrir(browser, { datos = true, w = W, h = H } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  page.on('pageerror', e => console.log('  PAGEERR', e.message));
  await page.goto(APP, { waitUntil: 'load' });
  await page.evaluate(rows => { document.getElementById('splashModal').style.display = 'none'; if (rows) { parseRows(rows); render(); } }, datos ? ROWS : null);
  await sleep(300);
  return page;
}
const set = async (page, id, v) => { await page.evaluate((id, v) => { const c = document.getElementById(id); if (c && c.checked !== v) { c.checked = v; c.dispatchEvent(new Event('change', { bubbles: true })); } }, id, v); await sleep(250); };
const click = async (page, sel) => { await page.click(sel); await sleep(350); };
const rectOf = (page, sel) => page.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }, sel);
async function shot(page, name, { clip, ann, dir = ann ? 'annotated' : 'screenshots', q = 88 } = {}) {
  if (ann) await page.evaluate(ANN_JS, ann);
  const file = path.join(IMG, dir, figuras.nombre('fig', name) + '.webp');
  await page.screenshot({ path: file, type: 'webp', quality: q, ...(clip ? { clip } : {}) });
  if (ann) await page.evaluate(() => document.getElementById('__ann')?.remove());
  console.log('  ✓', dir + '/' + name, (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
}
const C = (x, y, width, height) => ({ x, y, width, height });
const NAV = 252;                       // ancho del riel de navegación expandido

/* Prepara el Gantt "de presentación": Línea Base + avance + dependencias, trimestres */
async function gantt(page, { dep = true, lb = true } = {}) {
  await page.evaluate(() => { toggleColVisibility('esc', false); toggleColVisibility('m2', false); });
  await set(page, 'showLB', lb); await set(page, 'showPct', true); await set(page, 'showDeps', dep); await set(page, 'showDates', true);
  await page.evaluate(() => { document.querySelector('.sb-scaleBtn[data-scale="trimestres"]').click(); const z = document.getElementById('sbZoomInput'); z.value = 80; z.dispatchEvent(new Event('change', { bubbles: true })); document.getElementById('wrap').scrollLeft = 0; });
  await sleep(900);
}
const tableBottom = page => page.evaluate(() => Math.ceil(document.querySelector('#wrap table').getBoundingClientRect().bottom) + 14);

const FIGS = {};

/* 01 — Pantalla principal (anotada) */
FIGS['01'] = async b => {
  const p = await abrir(b); await gantt(p);
  const wr = await rectOf(p, '#wrap'), c3 = await rectOf(p, '#wrap th.hcat3');
  await shot(p, 'fig-01-pantalla-principal', { clip: C(0, 0, W, H), ann: [
    { n: 1, rect: await rectOf(p, '#navrail'), at: 'tl', dx: 30, dy: 74 },
    { n: 2, rect: await rectOf(p, '#mainRibbon'), at: 'tl', dx: 4, dy: 4 },
    { n: 3, rect: { x: wr.x, y: wr.y, w: c3.x + c3.w - wr.x, h: 440 }, at: 'tl', dx: 4, dy: 30 },
    { n: 4, rect: { x: c3.x + c3.w + 4, y: wr.y, w: wr.x + wr.w - (c3.x + c3.w) - 6, h: 440 }, at: 'tr', dx: -6, dy: 40 },
    { n: 5, rect: await rectOf(p, '#legend'), at: 'tl', dx: 4, dy: -4 },
    { n: 6, rect: await rectOf(p, '#statusbar'), at: 'tl', dx: 4, dy: 4 },
  ] });
  await p.close();
};

/* 02 — Riel de navegación */
FIGS['02'] = async b => {
  const p = await abrir(b); await gantt(p);
  const r = await rectOf(p, '#navrail');
  const items = ['#navGantt', '#navLdt', '#navDatos', '#navConfig', '#navAyuda'];
  await shot(p, 'fig-02-riel-navegacion', { clip: C(0, 0, r.w, 420), ann: [
    ...(await Promise.all(items.map(async (s, i) => ({ n: i + 1, rect: await rectOf(p, s), at: 'tr', dx: -4, dy: 8, pad: 2 })))),
    { n: 6, rect: await rectOf(p, '#navrailToggleTop'), at: 'tr', dx: -4, dy: 8, pad: 2 },
  ] });
  await p.close();
};

/* 03 — Barra de herramientas del Gantt */
FIGS['03'] = async b => {
  const p = await abrir(b); await gantt(p);
  const r = await rectOf(p, '#mainRibbon');
  const q = await p.evaluate(() => { const t = [...document.querySelectorAll('#mainRibbon .tb-pill')].map(e => e.getBoundingClientRect()); const x = Math.min(...t.map(a => a.left)), y = Math.min(...t.map(a => a.top)); return { x, y, w: Math.max(...t.map(a => a.right)) - x, h: Math.max(...t.map(a => a.bottom)) - y }; });
  const ids = ['#btnGanttRefresh', '#btnCapasMenu', null, '#btnOrdenMenu', '#btnFiltroMenu', '#btnEdicionMenu', '#btnFontMenu', '#btnMasMenu'];
  const ann = [];
  for (const id of ids) { const rr = id ? await rectOf(p, id) : q; if (rr.w > 0) ann.push({ n: ann.length + 1, rect: rr, at: 'tc', dy: -6, pad: 1 }); }
  await shot(p, 'fig-03-barra-herramientas', { clip: C(NAV, r.y - 26, W - NAV, r.h + 44), ann });
  await p.close();
};

/* 04 — Popover Capas (Gantt) */
FIGS['04'] = async b => {
  const p = await abrir(b); await gantt(p);
  await click(p, '#btnCapasMenu');
  const rp = await rectOf(p, '#capasMenuPanel');
  await shot(p, 'fig-04-capas-gantt', { clip: C(rp.x - 340, 60, rp.w + 400, rp.h + 90) });
  await p.close();
};

/* 05 — Barra inferior (escala, zoom, formato, hoy) */
FIGS['05'] = async b => {
  const p = await abrir(b); await gantt(p);
  const r = await rectOf(p, '#statusbar');
  await shot(p, 'fig-05-barra-estado', { clip: C(NAV, r.y - 4, W - NAV, r.h + 8) });
  console.log('  statusbar', JSON.stringify(r));
  await p.close();
};

/* 06 — Tabla de Datos (anotada) */
FIGS['06'] = async b => {
  const p = await abrir(b); await click(p, '#navDatos'); await sleep(600);
  const R = sel => rectOf(p, sel);
  const un = async (a, z) => { const x = await R(a), y = await R(z); return { x: x.x, y: x.y, w: y.x + y.w - x.x, h: x.h }; };
  const byTitle = t => p.evaluate(t => { const e = document.querySelector('[title="' + t + '"]').getBoundingClientRect(); return { x: e.left, y: e.top, w: e.width, h: e.height }; }, t);
  const tabs = await p.evaluate(() => { const A = document.getElementById('datosViewTabTable').getBoundingClientRect(), Z = document.getElementById('datosViewTabXml').getBoundingClientRect(); return { x: A.left, y: A.top, w: Z.right - A.left, h: A.height }; });
  const th = await p.evaluate(() => { const r = document.querySelector('#edTableHeadRow').getBoundingClientRect(); return { x: r.left, y: r.top, w: Math.min(r.width, innerWidth - r.left - 10), h: r.height }; });
  await shot(p, 'fig-06-tabla-datos', { clip: C(NAV, 0, W - NAV, 520), ann: [
    { n: 1, rect: await un('#btnEdResetXml', '#btnEdRedo'), at: 'tc', dy: -4, pad: 2 },
    { n: 2, rect: await un('#btnLink', '#btnDatosImportMenu'), at: 'tc', dy: -4, pad: 2 },
    { n: 3, rect: await byTitle('Descargar plantilla'), at: 'tc', dy: -4, pad: 2 },
    { n: 4, rect: await byTitle('Descargar .xlsx'), at: 'tc', dy: -4, pad: 2 },
    { n: 5, rect: await R('#btnAddRow'), at: 'tc', dy: -4, pad: 2 },
    { n: 6, rect: await R('#btnEdFiltroMenu'), at: 'tc', dy: -4, pad: 2 },
    { n: 7, rect: await R('#btnSave'), at: 'tc', dy: -4, pad: 2 },
    { n: 8, rect: tabs, at: 'tl', dy: 4, pad: 2 },
    { n: 9, rect: await R('#edSchedWrap'), at: 'tc', dy: -4, pad: 3 },
    { n: 10, rect: await R('#edSegWrap'), at: 'tc', dy: -4, pad: 3 },
    { n: 11, rect: th, at: 'tl', dy: 2, pad: 1 },
  ] });
  await p.close();
};
/* 35 — Gestión de escenarios */
FIGS['35'] = async b => {
  const p = await abrir(b);
  await p.evaluate(() => { TASKS.forEach(t => { t.escenario = ['Ingeniería', 'Compras'].includes(t.c1) ? 'Plan base' : 'Plan replanificado'; }); });
  await click(p, '#navDatos'); await p.evaluate(() => datosSwitchView('scen')); await sleep(600);
  const list = await rectOf(p, '#scenList'), first = await p.evaluate(() => { const e = document.querySelector('#scenList > div').getBoundingClientRect(); const bs = [...document.querySelectorAll('#scenList > div:first-child button')].map(x => x.getBoundingClientRect()); return { row: { x: e.left, y: e.top, w: e.width, h: e.height }, btns: { x: bs[0].left, y: bs[0].top, w: bs[bs.length - 1].right - bs[0].left, h: bs[0].height } }; });
  await shot(p, 'fig-35-gestion-escenarios', { clip: C(NAV, 0, W - NAV, 330), ann: [
    { n: 1, rect: first.row, at: 'tl', dx: 2, dy: 2, pad: 2 }, { n: 2, rect: first.btns, at: 'tc', dy: -6, pad: 2 },
  ] });
  await p.close();
};
/* 36 — Duplicar escenario (diálogo) */
FIGS['36'] = async b => {
  const p = await abrir(b);
  await p.evaluate(() => { TASKS.forEach(t => { t.escenario = ['Ingeniería', 'Compras'].includes(t.c1) ? 'Plan base' : 'Plan replanificado'; }); });
  await click(p, '#navDatos'); await p.evaluate(() => { datosSwitchView('scen'); }); await sleep(500);
  await p.evaluate(() => { scenDuplicate(0); }); await sleep(600);
  const r = await p.evaluate(() => { const ok = document.querySelector('.og-ok'); let e = ok; while (e && !(getComputedStyle(e).position === 'fixed' && e.parentElement === document.body)) e = e.parentElement; const card = e ? (e.firstElementChild || e) : ok; const b = card.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
  await shot(p, 'fig-36-duplicar-escenario', { clip: C(r.x - 24, r.y - 24, r.w + 48, r.h + 48) });
  await p.close();
};
/* 37 — Reprogramación de sucesoras */
FIGS['37'] = async b => {
  const p = await abrir(b);
  await click(p, '#navDatos'); await sleep(600);
  await p.evaluate(() => { const r = _edRows.findIndex(m => m.tar === 'Ingeniería básica'); const tr = document.querySelectorAll('#editorBody tr.ed-r')[r]; const inp = tr.querySelector('.efrp'); inp.value = '2026-12-20'; inp.dispatchEvent(new Event('change', { bubbles: true })); }); await sleep(700);
  await p.evaluate(() => { const s = document.getElementById('datosTablePane'); s.scrollLeft = 260; }); await sleep(300);
  const info = await p.evaluate(() => { const trs = [...document.querySelectorAll('#editorBody tr.ed-r')]; const ed = trs.find(t => t._m && t._m.tar === 'Ingeniería básica'); const mv = trs.filter(t => t.classList.contains('ed-mv')); const box = t => { const b = t.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; }; const cell = ed.querySelector('.efrp').getBoundingClientRect(); return { ed: { x: cell.left, y: cell.top, w: cell.width, h: cell.height }, mv: mv.map(box), n: mv.length }; });
  console.log('  filas reprogramadas:', info.n);
  const ann = [{ n: 1, rect: info.ed, at: 'tc', dy: -6, pad: 2 }];
  if (info.mv.length) { const y0 = Math.min(...info.mv.map(m => m.y)), y1 = Math.max(...info.mv.map(m => m.y + m.h)); ann.push({ n: 2, rect: { x: info.mv[0].x, y: y0, w: info.mv[0].w, h: y1 - y0 }, at: 'tl', dx: -2, dy: 2, pad: 1 }); }
  await shot(p, 'fig-37-reprogramar-sucesoras', { clip: C(NAV, 60, W - NAV, 560), ann });
  await p.close();
};

/* 34 — Tabla de Datos: columnas de dependencias */
FIGS['34'] = async b => {
  const p = await abrir(b); await click(p, '#navDatos'); await sleep(600);
  await p.evaluate(() => { const s = document.getElementById('datosTablePane'); s.scrollLeft = s.scrollWidth; }); await sleep(400);
  const cols = await p.evaluate(() => { const ths = [...document.querySelectorAll('#edTableHeadRow th')]; const f = n => ths.find(t => t.textContent.trim().startsWith(n)).getBoundingClientRect(); const a = f('ID'), c = f('Sucesoras'); return { x: a.left, y: a.top, w: c.right - a.left, h: 440 }; });
  await shot(p, 'fig-34-tabla-dependencias', { clip: C(NAV, 0, W - NAV, 520), ann: [{ n: 1, rect: cols, at: 'tl', dy: -6, pad: 2 }] });
  await p.close();
};

(async () => {
  const want = process.argv.slice(2);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  for (const k of Object.keys(FIGS).sort()) {
    if (want.length && !want.includes(k)) continue;
    console.log('Figura', k);
    try { await FIGS[k](browser); } catch (e) { console.log('  ✗ ERROR', e.message); }
  }
  await browser.close();
})();
