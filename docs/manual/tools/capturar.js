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
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* sin almacenamiento */ } });
  await page.goto(APP, { waitUntil: 'load' });
  await page.evaluate(rows => { document.getElementById('splashModal').style.display = 'none'; if (rows) { parseRows(rows); render(); } }, datos ? ROWS : null);
  await sleep(300);
  return page;
}
const set = async (page, id, v) => { await page.evaluate((id, v) => { const c = document.getElementById(id); if (c && c.checked !== v) { c.checked = v; c.dispatchEvent(new Event('change', { bubbles: true })); } }, id, v); await sleep(250);
  // Al activar el Agrupador sin escenarios aparece un aviso modal: se acepta para que no tape la captura
  await page.evaluate(() => { const ok = document.querySelector('#ogDlg .og-ok'); if (ok) ok.click(); }); await sleep(150); };
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

/* Recorte alrededor de un modal centrado */
async function modalShot(page, name, modalSel, { ann = null, margin = 28 } = {}) {
  const r = await rectOf(page, modalSel);
  await shot(page, name, { clip: C(Math.max(0, r.x - margin), Math.max(0, r.y - margin), Math.min(W, r.w + 2 * margin), Math.min(H, r.h + 2 * margin)), ann: ann && await ann(r) });
}
/* Página sin datos + XML de ejemplo cargado en Gestión de XML */
async function conXml(b) {
  const p = await abrir(b, { datos: false });
  await click(p, '#navDatos'); await p.evaluate(() => datosSwitchView('xml')); await sleep(300);
  await p.evaluate(async xml => {
    const f = new File([xml], 'Planta_ejemplo.xml', { type: 'text/xml' });
    await pxmlLoadFiles([f]);
    const db = PXML_DB[0]; db.mapping.c1 = '__FIXED__'; db.mapping.c1_fixed = 'Plan base'; db.mapping.c2 = '__FIXED__'; db.mapping.c2_fixed = 'Planta';
    db.variantName = 'Plan base'; pxmlApplyMapping(true);
  }, demoXml('Planta de ejemplo'));
  await sleep(700);
  return p;
}

/* 07 — Gestión de XML: cargar */
FIGS['07'] = async b => {
  const p = await abrir(b, { datos: false });
  await click(p, '#navDatos'); await p.evaluate(() => { datosSwitchView('xml'); pxmlTab('load'); }); await sleep(400);
  await shot(p, 'fig-07-xml-cargar', { clip: C(NAV, 0, W - NAV, 520) });
  await p.close();
};
/* 08 — Gestión de XML: base de datos */
FIGS['08'] = async b => {
  const p = await conXml(b);
  await p.evaluate(() => pxmlTab('db')); await sleep(400);
  await shot(p, 'fig-08-xml-base-datos', { clip: C(NAV, 0, W - NAV, 520) });
  await p.close();
};
/* 09 — Gestión de XML: mapeo de columnas (anotada) */
FIGS['09'] = async b => {
  const p = await conXml(b);
  await p.evaluate(() => pxmlTab('map')); await sleep(600);
  const info = await p.evaluate(() => {
    const d = document.querySelector('#pxmlMapGrid details'); const r = e => { const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
    const sum = d.querySelector('summary'); const name = sum.querySelector('input'); const btns = [...sum.querySelectorAll('button')];
    const f0 = d.querySelector('#pxmlFields_0 > div');
    const bb = btns.map(r);
    return { name: r(name), btns: { x: bb[0].x, y: bb[0].y, w: bb[bb.length - 1].x + bb[bb.length - 1].w - bb[0].x, h: bb[0].h }, field: r(f0), grid: r(d) };
  });
  await shot(p, 'fig-09-xml-mapeo', { clip: C(NAV, 60, W - NAV, 560), ann: [
    { n: 1, rect: info.name, at: 'tl', dy: 2, pad: 2 }, { n: 2, rect: info.btns, at: 'tc', dy: -4, pad: 2 }, { n: 3, rect: info.field, at: 'tl' },
  ] });
  await p.close();
};
/* 10 — Gantt con dependencias */
FIGS['10'] = async b => {
  const p = await abrir(b); await gantt(p);
  const gh = await tableBottom(p);
  await shot(p, 'fig-10-gantt-dependencias', { clip: C(NAV, 62, W - NAV, Math.min(gh, 700) - 62) });
  await p.close();
};
/* 11 — Gantt: cadena de una tarea seleccionada */
FIGS['11'] = async b => {
  const p = await abrir(b); await gantt(p);
  await p.evaluate(() => { const el = document.querySelector('[data-di="9"]'); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await sleep(400);
  const gh = await tableBottom(p);
  await shot(p, 'fig-11-gantt-cadena', { clip: C(NAV, 62, W - NAV, Math.min(gh, 700) - 62) });
  await p.close();
};
/* 12 — Avisos de dependencias */
FIGS['12'] = async b => {
  const p = await abrir(b); await gantt(p);
  await p.evaluate(() => { TASKS[12].preds = '11;99'; render(); }); await sleep(500);
  await p.evaluate(() => openDepIssues()); await sleep(300);
  await modalShot(p, 'fig-12-avisos-dependencias', '#depIssuesModal > div');
  await p.close();
};
/* 13 — Menú de columnas (clic derecho en un encabezado) */
FIGS['13'] = async b => {
  const p = await abrir(b); await gantt(p);
  const r = await rectOf(p, '#wrap th.hcat3');
  await p.evaluate(() => { const th = document.querySelector('#wrap th.hcat3'); const b = th.getBoundingClientRect(); th.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: b.left + 60, clientY: b.top + 14 })); }); await sleep(400);
  const m = await rectOf(p, '#colMenu');
  await shot(p, 'fig-13-menu-columnas', { clip: C(r.x - 260, r.y - 6, 620, Math.min(H - r.y, m.h + 56)) });
  await p.close();
};
/* 14 — Filtro por columna */
FIGS['14'] = async b => {
  const p = await abrir(b); await gantt(p);
  await click(p, '#btnFiltroMenu'); await click(p, '#btnHdrFilter'); await sleep(300);
  await p.evaluate(() => document.querySelector('.hdr-filter-btn[data-hcol="c2"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await sleep(500);
  await shot(p, 'fig-14-filtro-columna', { clip: C(NAV, 62, 760, 560) });
  await p.close();
};
/* 15 — Tooltip de una barra */
FIGS['15'] = async b => {
  const p = await abrir(b); await gantt(p);
  const r = await p.evaluate(() => { const e = document.querySelector('[data-di="9"]').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; });
  await p.mouse.move(r.x, r.y); await sleep(500);
  await shot(p, 'fig-15-tooltip-tarea', { clip: C(Math.max(NAV, r.x - 520), Math.max(62, r.y - 120), 900, 330) });
  await p.close();
};
/* 16 — Selección de tareas */
FIGS['16'] = async b => {
  const p = await abrir(b); await gantt(p);
  await click(p, '#btnFiltroMenu'); await click(p, '#btnFilter'); await sleep(400);
  const vis = await p.evaluate(() => [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed' && d.getBoundingClientRect().width > 300 && d.getBoundingClientRect().width < 900 && d.offsetHeight > 250 && getComputedStyle(d).display !== 'none' && d.id).map(d => d.id));
  console.log('  paneles fijos visibles:', vis.join(','));
  await p.screenshot({ path: path.join(IMG, 'screenshots', 'fig-16-seleccion-tareas.webp'), type: 'webp', quality: 88 });
  await p.close();
};
/* 17 — Mover en bloque */
FIGS['17'] = async b => {
  const p = await abrir(b); await gantt(p);
  await p.evaluate(() => openShiftBlock()); await sleep(400);
  await modalShot(p, 'fig-17-mover-en-bloque', '#shiftBlockModal > div');
  await p.close();
};
/* 18 — Reordenar grupos */
FIGS['18'] = async b => {
  const p = await abrir(b); await gantt(p);
  await p.evaluate(() => openReorder()); await sleep(400);
  await modalShot(p, 'fig-18-reordenar-grupos', '#reorderModal > div');
  await p.close();
};
/* 19 — Menú Edición (Gantt) */
FIGS['19'] = async b => {
  const p = await abrir(b); await gantt(p);
  await click(p, '#btnEdicionMenu');
  const r = await rectOf(p, '#btnEdicionMenu');
  await shot(p, 'fig-19-menu-edicion', { clip: C(r.x - 60, r.y - 20, 420, 210) });
  await p.close();
};

/* ── Línea de Tiempo ── */
async function ldt(b, { deps = false } = {}) {
  const p = await abrir(b); await gantt(p);
  await p.evaluate(() => document.getElementById('btnPres').click()); await sleep(700);
  await set(p, 'presShowDates', true); await set(p, 'presShowDeps', deps);
  return p;
}
async function ldtShot(p, name, tool = true) {
  const r = await p.evaluate(() => { const sv = [...document.querySelectorAll('#presBody svg')]; return { top: Math.floor(Math.min(...sv.map(x => x.getBoundingClientRect().top))), bottom: Math.ceil(Math.max(...sv.map(x => x.getBoundingClientRect().bottom))) + 8 }; });
  const y0 = tool ? 62 : Math.max(62, r.top - 14);
  await shot(p, name, { clip: C(NAV, y0, W - NAV, Math.min(r.bottom, H) - y0) });
}
FIGS['20'] = async b => { const p = await ldt(b); await ldtShot(p, 'fig-20-ldt-normal'); await p.close(); };
FIGS['21'] = async b => { const p = await ldt(b); await set(p, 'presShowLB', true); await ldtShot(p, 'fig-21-ldt-comparador', false); await p.close(); };
FIGS['22'] = async b => { const p = await ldt(b); await set(p, 'presShowExecutive', true); await ldtShot(p, 'fig-22-ldt-ejecutivo', false); await p.close(); };
FIGS['23'] = async b => { const p = await ldt(b); await set(p, 'presShowRaP', true); await ldtShot(p, 'fig-23-ldt-vista-c1'); await p.close(); };
FIGS['24'] = async b => { const p = await ldt(b); await set(p, 'presShowHitos', true); await ldtShot(p, 'fig-24-ldt-hitos', false); await p.close(); };
FIGS['25'] = async b => {
  const p = await ldt(b); await click(p, '#btnPresCapasMenu');
  const rp = await rectOf(p, '#presCapasMenuPanel');
  await shot(p, 'fig-25-capas-ldt', { clip: C(rp.x - 360, 60, rp.w + 420, rp.h + 90) });
  await p.close();
};
FIGS['26'] = async b => {
  const p = await ldt(b, { deps: true });
  await p.evaluate(() => { const els = [...document.querySelectorAll('#presBody [data-pres-bar]')]; const el = els.find(e => /Obras civiles/.test(e.dataset.presBar)) || els[3]; el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await sleep(500);
  await ldtShot(p, 'fig-26-ldt-dependencias');
  await p.close();
};
FIGS['27'] = async b => {
  const p = await ldt(b);
  await p.evaluate(() => { const els = [...document.querySelectorAll('#presBody [data-pres-bar]')]; const el = els.find(e => /Obras civiles/.test(e.dataset.presBar)) || els[3]; el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: el.getBoundingClientRect().left + 40, clientY: el.getBoundingClientRect().top + 10 })); }); await sleep(600);
  const m = await rectOf(p, '#presBarMenu');
  console.log('  presBarMenu', JSON.stringify(m));
  await shot(p, 'fig-27-ldt-panel-edicion', { clip: C(NAV, 62, W - NAV, 800) });
  await p.close();
};
FIGS['28'] = async b => {
  const p = await ldt(b, { w: 1800 }); await click(p, '#btnPresEdicionMenu');
  await p.evaluate(() => { const t = [...document.querySelectorAll('#presEdicionMenuPanel *')].find(e => /Insertar forma/.test(e.textContent) && e.children.length < 3 && e.tagName === 'BUTTON'); t && t.click(); }); await sleep(400);
  const r = await rectOf(p, '#btnPresEdicionMenu');
  await shot(p, 'fig-28-ldt-edicion-formas', { clip: C(r.x - 200, r.y - 12, 620, 420) });
  await p.close();
};
FIGS['29'] = async b => {
  const p = await ldt(b); await click(p, '#btnPresExportMenu').catch(() => {});
  const vis = await p.evaluate(() => { const m = document.getElementById('presExportMenuPanel'); const bt = document.getElementById('btnPresExportMenu'); if (m && m.style.display === 'none' && bt) bt.click(); return m ? m.style.display : 'x'; });
  await sleep(300);
  const r = await p.evaluate(() => { const b = (document.getElementById('btnPresExportMenu').offsetParent ? document.getElementById('btnPresExportMenu') : document.getElementById('btnPresMasMenu')).getBoundingClientRect(); return { x: b.left, y: b.top }; });
  console.log('  export visible', vis, JSON.stringify(r));
  await shot(p, 'fig-29-ldt-exportar', { clip: C(Math.max(NAV, r.x - 320), r.y - 12, 560, 260) });
  await p.close();
};
FIGS['30'] = async b => {
  const p = await abrir(b); await click(p, '#navConfig'); await sleep(600);
  await shot(p, 'fig-30-configuracion', { clip: C(NAV, 0, W - NAV, H) });
  await p.close();
};
FIGS['32'] = async b => {
  const p = await abrir(b, { datos: false }); await sleep(200);
  await p.evaluate(() => { document.getElementById('splashModal').style.display = 'flex'; }); await sleep(300);
  await shot(p, 'fig-32-bienvenida', { clip: C(0, 0, W, H) });
  await p.close();
};
FIGS['31'] = async b => {
  const p = await abrir(b); await click(p, '#navAyuda'); await sleep(600);
  const r = await rectOf(p, '#docModal > div');
  const btn = await rectOf(p, '#docModal a[href*="docs/manual"], #docModal a[href*="OpenGanttLab/docs/manual"]'), tabs = await rectOf(p, '#docTabs');
  const banner = await p.evaluate(() => { const e = document.querySelector('#docManual > div').getBoundingClientRect(); return { x: e.left, y: e.top, w: e.width, h: e.height }; });
  await shot(p, 'fig-31-ayuda', { clip: C(r.x - 24, r.y - 24, r.w + 48, Math.min(r.h, 560) + 24), ann: [
    { n: 1, rect: btn, at: 'tc', dy: -6, pad: 2 }, { n: 2, rect: tabs, at: 'tl', dx: -2, dy: 8, pad: 1 }, { n: 3, rect: banner, at: 'tl', dx: -2, dy: 2, pad: 2 },
  ] });
  await p.close();
};
FIGS['33'] = async b => {
  const p = await abrir(b); await click(p, '#navDatos'); await sleep(500);
  await click(p, '#btnDatosImportMenu');
  await shot(p, 'fig-33-datos-cargar-menu', { clip: C(NAV, 0, 940, 330) });
  await p.close();
};


/* ══ Ajustes de encuadre (sobrescriben las figuras anteriores con el mismo número) ══ */
const LDT_H = 1300;                       // ventana alta: el ajuste automático de la LdT amplía el dibujo
async function ldt(b, { deps = false, w = W, h = LDT_H } = {}) {
  const p = await abrir(b, { w, h }); await gantt(p);
  await p.evaluate(() => document.getElementById('btnPres').click()); await sleep(800);
  await set(p, 'presShowDates', true); await set(p, 'presShowDeps', deps);
  await p.evaluate(() => renderPres()); await sleep(500);
  return p;
}
async function ldtShot(p, name, tool = true, maxH = LDT_H) {
  const r = await p.evaluate(() => { const sv = [...document.querySelectorAll('#presBody svg')].map(x => x.getBoundingClientRect()); return { left: Math.floor(Math.min(...sv.map(x => x.left))), right: Math.ceil(Math.max(...sv.map(x => x.right))), top: Math.floor(Math.min(...sv.map(x => x.top))), bottom: Math.ceil(Math.max(...sv.map(x => x.bottom))) + 8 }; });
  const y0 = tool ? 62 : Math.max(62, r.top - 14);
  const x0 = tool ? NAV : Math.max(NAV, r.left - 14), x1 = tool ? W : Math.min(W, r.right + 14);
  await shot(p, name, { clip: C(x0, y0, x1 - x0, Math.min(r.bottom, maxH) - y0) });
}
FIGS['20'] = async b => { const p = await ldt(b); await ldtShot(p, 'fig-20-ldt-normal'); await p.close(); };
FIGS['21'] = async b => { const p = await ldt(b, { h: 2300 }); await set(p, 'presShowLB', true); await ldtShot(p, 'fig-21-ldt-comparador', false, 2300); await p.close(); };
FIGS['22'] = async b => { const p = await ldt(b); await set(p, 'presShowExecutive', true); await ldtShot(p, 'fig-22-ldt-ejecutivo', false); await p.close(); };
FIGS['23'] = async b => { const p = await ldt(b); await set(p, 'presShowRaP', true); await ldtShot(p, 'fig-23-ldt-vista-c1'); await p.close(); };
FIGS['24'] = async b => { const p = await ldt(b); await set(p, 'presShowHitos', true); await ldtShot(p, 'fig-24-ldt-hitos', false); await p.close(); };
FIGS['25'] = async b => {
  const p = await ldt(b); await click(p, '#btnPresCapasMenu');
  const rp = await rectOf(p, '#presCapasMenuPanel'), bt = await rectOf(p, '#btnPresCapasMenu');
  await shot(p, 'fig-25-capas-ldt', { clip: C(rp.x - 24, bt.y - 12, rp.w + 48, rp.y + rp.h - bt.y + 36) });
  await p.close();
};
FIGS['26'] = async b => {
  const p = await ldt(b, { deps: true });
  await p.evaluate(() => { const els = [...document.querySelectorAll('#presBody [data-pres-bar]')]; const el = els.find(e => /Obras civiles/.test(e.dataset.presBar)) || els[3]; el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await sleep(500);
  await ldtShot(p, 'fig-26-ldt-dependencias');
  await p.close();
};
FIGS['27'] = async b => {
  const p = await ldt(b);
  await p.evaluate(() => { const els = [...document.querySelectorAll('#presBody [data-pres-bar]')]; const el = els.find(e => /Obras civiles/.test(e.dataset.presBar)) || els[3]; const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + 40, clientY: r.top + 10 })); }); await sleep(600);
  const m = await rectOf(p, '#presBarMenu'), bar = await p.evaluate(() => { const e = [...document.querySelectorAll('#presBody [data-pres-bar]')].find(e => /Obras civiles/.test(e.dataset.presBar)); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const x0 = Math.max(NAV, Math.min(bar.x - 260, m.x - 620)), y0 = Math.max(62, Math.min(bar.y - 80, m.y - 10));
  await shot(p, 'fig-27-ldt-panel-edicion', { clip: C(x0, y0, m.x + m.w + 30 - x0, Math.max(bar.y + bar.h + 60, m.y + m.h + 10) - y0), ann: [{ n: 1, rect: bar, at: 'tl' }, { n: 2, rect: m, at: 'tr', dx: -6, dy: 10 }] });
  await p.close();
};
FIGS['28'] = async b => {
  const p = await ldt(b, { w: 1800 }); await click(p, '#btnPresEdicionMenu');
  await p.evaluate(() => { const t = [...document.querySelectorAll('#presEdicionMenuPanel button')].find(e => /Insertar forma/.test(e.textContent)); t && t.click(); }); await sleep(400);
  const r = await rectOf(p, '#btnPresEdicionMenu');
  await shot(p, 'fig-28-ldt-edicion-formas', { clip: C(r.x - 80, r.y - 14, 420, 420) });
  await p.close();
};
FIGS['29'] = async b => {
  const p = await ldt(b, { w: 1900 });
  await click(p, '#btnPresExportMenu');
  const r = await rectOf(p, '#btnPresExportMenu'), m = await rectOf(p, '#presExportMenuPanel');
  await shot(p, 'fig-29-ldt-exportar', { clip: C(r.x - 250, r.y - 14, r.w + 290, m.y + m.h - r.y + 30) });
  await p.close();
};
FIGS['30'] = async b => {
  const p = await abrir(b); await click(p, '#navConfig'); await sleep(600);
  const r = await p.evaluate(() => { const hs = [...document.querySelectorAll('#configModal h2')].map(h => h.closest('div').getBoundingClientRect()); const x = Math.min(...hs.map(a => a.left)), y = 70; return { x, y, w: Math.max(...hs.map(a => a.right)) - x, h: 830 }; });
  await shot(p, 'fig-30-configuracion', { clip: C(r.x - 24, 0, r.w + 48, 900) });
  await p.close();
};
FIGS['16'] = async b => {
  const p = await abrir(b); await gantt(p);
  await click(p, '#btnFiltroMenu'); await click(p, '#btnFilter'); await sleep(400);
  await modalShot(p, 'fig-16-seleccion-tareas', '#filterPanel > .edPanel', { margin: 20 });
  await p.close();
};
FIGS['32'] = async b => {
  const p = await abrir(b, { datos: false }); await p.evaluate(() => { document.getElementById('splashModal').style.display = 'flex'; }); await sleep(300);
  await shot(p, 'fig-32-bienvenida', { clip: C(W / 2 - 320, H / 2 - 300, 640, 600) });
  await p.close();
};
/* 03 — barra completa a 1900 px (con Compartir y Actualizar visibles) */
FIGS['03'] = async b => {
  const p = await abrir(b, { w: 1900 }); await gantt(p);
  const r = await rectOf(p, '#mainRibbon');
  const q = await p.evaluate(() => { const t = [...document.querySelectorAll('#mainRibbon .tb-pill')].map(e => e.getBoundingClientRect()); const x = Math.min(...t.map(a => a.left)), y = Math.min(...t.map(a => a.top)); return { x, y, w: Math.max(...t.map(a => a.right)) - x, h: Math.max(...t.map(a => a.bottom)) - y }; });
  const ids = ['#btnGanttRefresh', '#btnCapasMenu', null, '#btnOrdenMenu', '#btnFiltroMenu', '#btnEdicionMenu', '#btnFontMenu', '#btnSaveGantt', '#btnMasMenu'];
  const ann = [], usados = [];
  for (const id of ids) { const rr = id ? await rectOf(p, id) : q; if (rr.w > 0) { ann.push({ n: ann.length + 1, rect: rr, at: 'tc', dy: -6, pad: 1 }); usados.push(id || 'accesos'); } }
  console.log('  numeración:', usados.join(' > '));
  await shot(p, 'fig-03-barra-herramientas', { clip: C(NAV, r.y - 26, 1900 - NAV, r.h + 44), ann });
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
    { n: 3, rect: await R('#btnDatosDlMenu'), at: 'tc', dy: -4, pad: 2 },
    { n: 4, rect: await R('#btnAddRow'), at: 'tc', dy: -4, pad: 2 },
    { n: 5, rect: await R('#btnEdFiltroMenu'), at: 'tc', dy: -4, pad: 2 },
    { n: 6, rect: await un('#btnSaveSession', '#btnSave'), at: 'tc', dy: -4, pad: 2 },
    { n: 7, rect: tabs, at: 'tl', dy: 4, pad: 2 },
    { n: 8, rect: await R('#edSchedWrap'), at: 'tc', dy: -4, pad: 3 },
    { n: 9, rect: await R('#edSegWrap'), at: 'tc', dy: -4, pad: 3 },
    { n: 10, rect: th, at: 'tl', dy: 2, pad: 1 },
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

/* ══ Figuras adicionales (capítulos Análisis, Casos de uso, Referencia, Problemas, Filtros) ══ */
const gClip = async (p, extra = 0) => { const gh = await tableBottom(p); return C(NAV, 62, W - NAV, Math.min(gh, 640 + extra) - 62); };

FIGS['50'] = async b => {           // Ruta crítica: solo tareas críticas
  const p = await abrir(b); await gantt(p, { dep: false }); await set(p, 'showOnlyCrit', true); await sleep(700);
  await shot(p, 'fig-50-gantt-ruta-critica', { clip: await gClip(p) }); await p.close();
};
FIGS['51'] = async b => {           // Fecha de estado con su panel de opciones
  const p = await abrir(b); await gantt(p, { dep: false });
  await p.evaluate(() => { document.getElementById('estDate').value = '2027-06-30'; updateEstDateDisplay(); }); await set(p, 'showHoy', true); await sleep(500);
  await click(p, '#btnCapasMenu'); await click(p, '#btnFechaEstadoMenu'); await sleep(400);
  await shot(p, 'fig-51-gantt-fecha-estado', { clip: C(NAV, 62, W - NAV, 520) }); await p.close();
};
FIGS['52'] = async b => {           // Desplazamiento: Línea Base + columnas de fechas exactas
  const p = await abrir(b); await gantt(p, { dep: false });
  await p.evaluate(() => { ['iLB', 'fLB', 'iRP', 'fRP'].forEach(c => toggleColVisibility(c, true)); toggleColVisibility('c1', false); }); await sleep(900);
  await shot(p, 'fig-52-gantt-desplazamiento', { clip: await gClip(p) }); await p.close();
};
FIGS['53'] = async b => {           // Lámina para un comité: Vista C1 + Leyenda + Fecha de estado
  const p = await ldt(b); await set(p, 'presShowRaP', true); await set(p, 'presShowLegend', true); await set(p, 'presShowHoy', true); await sleep(600);
  await ldtShot(p, 'fig-53-ldt-lamina-comite', true); await p.close();
};
FIGS['54'] = async b => {           // XML con problemas de secuencia → aviso en el Gantt
  const p = await conXml(b);
  await p.evaluate(() => { TASKS[4].preds = '4;99'; document.getElementById('navGantt').click(); }); await sleep(400);
  await set(p, 'showDeps', true); await p.evaluate(() => { render(); }); await sleep(900);
  const gh = await tableBottom(p);
  await shot(p, 'fig-54-gantt-xml-avisos', { clip: C(NAV, 62, W - NAV, Math.min(gh, 460) - 62) }); await p.close();
};
FIGS['55'] = async b => {           // XML sin campos obligatorios mapeados
  const p = await abrir(b, { datos: false });
  await click(p, '#navDatos'); await p.evaluate(() => datosSwitchView('xml')); await sleep(300);
  await p.evaluate(async xml => { await pxmlLoadFiles([new File([xml], 'Planta_ejemplo.xml', { type: 'text/xml' })]); pxmlTab('map'); }, demoXml('Planta de ejemplo'));
  await sleep(1400);
  await shot(p, 'fig-55-xml-campos-obligatorios', { clip: C(NAV, 0, W - NAV, 520) }); await p.close();
};
FIGS['56'] = async b => {           // Gantt vacío: menú para vincular o importar
  const p = await abrir(b, { datos: false }); await sleep(300);
  await p.evaluate(() => { const e = document.getElementById('ganttEmptyState'); const r = e.getBoundingClientRect(); e.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); }); await sleep(600);
  await shot(p, 'fig-56-gantt-vacio-menu', { clip: C(NAV, 62, W - NAV, 520) }); await p.close();
};
FIGS['57'] = async b => {           // Símbolos del Gantt (anotada)
  const p = await abrir(b); await gantt(p);
  const q = await p.evaluate(() => {
    const R = e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    const byDi = i => document.querySelector('[data-di="' + i + '"]');
    const crit = byDi(3), hito = byDi(2), rp = byDi(0);
    const lb = [...document.querySelectorAll('.lb-bar')][0], path = document.querySelector('#depSvg path');
    const av = rp.firstElementChild ? R(rp.firstElementChild) : R(rp);
    return { lb: R(lb), rp: R(rp), av, crit: R(crit), hito: R(hito), path: R(path) };
  });
  const gh = await tableBottom(p);
  await shot(p, 'fig-57-gantt-simbolos', { clip: C(NAV, 62, W - NAV, Math.min(gh, 460) - 62), ann: [
    { n: 1, rect: q.lb, at: 'tl', pad: 2 }, { n: 2, rect: q.rp, at: 'tr', pad: 2 }, { n: 3, rect: q.av, at: 'bc', pad: 1 },
    { n: 4, rect: q.crit, at: 'tc', dy: -6, pad: 3 }, { n: 5, rect: q.hito, at: 'tl', pad: 4 }, { n: 6, rect: q.path, at: 'tr', pad: 3 },
  ] }); await p.close();
};
FIGS['58'] = async b => {           // Menú Ordenar
  const p = await abrir(b); await gantt(p);
  await click(p, '#btnOrdenMenu'); const r = await rectOf(p, '#btnOrdenMenu');
  await shot(p, 'fig-58-menu-ordenar', { clip: C(r.x - 40, r.y - 16, 420, 150) }); await p.close();
};

/* ══ Figuras de secciones con interacción (Vistas, Escenarios, Avanzadas) ══ */
const ESC2 = p => p.evaluate(() => { TASKS.forEach(t => { t.escenario = ['Ingeniería', 'Compras'].includes(t.c1) ? 'Plan base' : 'Plan replanificado'; }); });

FIGS['60'] = async b => {           // Ejecutivo: tareas ocultas
  const p = await ldt(b); await set(p, 'presShowExecutive', true);
  await p.evaluate(() => { [3, 6, 10].forEach(i => PRES_EXEC_HIDDEN_KEYS.add(pkOf(TASKS[i]))); renderPres(); }); await sleep(600);
  await p.evaluate(() => document.getElementById('execHiddenBtn').click()); await sleep(500);
  await modalShot(p, 'fig-60-ldt-tareas-ocultas', '#execHiddenModal > div');
  await p.close();
};
FIGS['61'] = async b => {           // Vista C1: elementos interactivos (anotada)
  const p = await ldt(b); await set(p, 'presShowRaP', true); await sleep(600);
  const q = await p.evaluate(() => {
    const R = e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    const lab = document.querySelector('[data-rap-reorder]'), band = document.querySelector('[data-rap-band-border]');
    const sv = document.querySelector('#presBody svg').getBoundingClientRect();
    return { lab: lab ? R(lab) : null, band: band ? R(band) : null, sv: { x: sv.left, y: sv.top, w: sv.width, h: sv.height } };
  });
  console.log('  c1:', JSON.stringify(q.lab), JSON.stringify(q.band));
  const y0 = 62, x0 = NAV;
  await shot(p, 'fig-61-ldt-c1-bandas', { clip: C(q.sv.x - 14, q.sv.y - 6, q.sv.w + 28, Math.min(q.sv.h, 760)), ann: [
    ...(q.lab ? [{ n: 1, rect: q.lab, at: 'tl', dx: -4, pad: 2 }] : []), ...(q.band ? [{ n: 2, rect: q.band, at: 'tr', dx: -8, dy: 4, pad: 1 }] : []),
  ] });
  await p.close();
};
FIGS['62'] = async b => {           // Ajustes de la Línea de Tiempo
  const p = await ldt(b, { w: 1900 }); await click(p, '#btnPresAreaMenu'); await sleep(400);
  const m = await rectOf(p, '#presAreaMenuPanel'), t = await rectOf(p, '#btnPresAreaMenu');
  const x0 = Math.min(t.x, m.x) - 24, x1 = Math.max(t.x + t.w, m.x + m.w) + 24;
  await shot(p, 'fig-62-ldt-ajustes', { clip: C(x0, t.y - 16, x1 - x0, m.y + m.h - t.y + 40) });
  await p.close();
};
FIGS['63'] = async b => {           // Dos escenarios comparados en el Gantt
  const p = await abrir(b); await ESC2(p); await gantt(p, { dep: false });
  await p.evaluate(() => {
    TASKS.filter(t => t.escenario === 'Plan replanificado').forEach(t => { const d = 45 * 864e5; t.iRP = new Date(+t.iRP + d); t.fRP = new Date(+t.fRP + d); });
    toggleColVisibility('esc', true); toggleColVisibility('c1', false); toggleColVisibility('m2', false); render();
  }); await sleep(900);
  await shot(p, 'fig-63-gantt-dos-escenarios', { clip: await gClip(p) }); await p.close();
};
FIGS['64'] = async b => {           // Dos XML cargados como variantes
  const p = await abrir(b, { datos: false });
  await click(p, '#navDatos'); await p.evaluate(() => datosSwitchView('xml')); await sleep(300);
  await p.evaluate(async (a, c) => { await pxmlLoadFiles([new File([a], 'Planta_P50.xml', { type: 'text/xml' }), new File([c], 'Planta_P90.xml', { type: 'text/xml' })]); pxmlTab('db'); PXML_DB[0].variantName = 'P50'; PXML_DB[1].variantName = 'P90'; pxmlRefreshDb(); }, demoXml('Planta P50'), demoXml('Planta P90'));
  await sleep(1200);
  await shot(p, 'fig-64-xml-dos-cargas', { clip: C(NAV, 0, W - NAV, 560) }); await p.close();
};
FIGS['65'] = async b => {           // Segmentador de escenario en la Tabla de Datos (anotada)
  const p = await abrir(b); await ESC2(p);
  await click(p, '#navDatos'); await sleep(600);
  await p.evaluate(() => { populateEditor(); const s = document.getElementById('edSegSel'); s.value = '0'; edSegChange('0'); }); await sleep(600);
  await shot(p, 'fig-65-tabla-segmentador', { clip: C(NAV, 0, W - NAV, 520), ann: [{ n: 1, rect: await rectOf(p, '#edSegWrap'), at: 'tc', dy: -6, pad: 3 }] });
  await p.close();
};
FIGS['66'] = async b => {           // Ajustes del Gantt: fuente y tamaños
  const p = await abrir(b, { w: 1700 }); await gantt(p); await click(p, '#btnFontMenu'); await sleep(400);
  const m = await rectOf(p, '#fontMenuPanel'), t = await rectOf(p, '#btnFontMenu');
  await shot(p, 'fig-66-gantt-ajustes-fuente', { clip: C(Math.max(0, Math.min(t.x, m.x) - 40), t.y - 20, Math.max(m.w, 340) + 100, m.y + m.h - t.y + 50) }); await p.close();
};
FIGS['67'] = async b => {           // Mapeo personalizado (botón +)
  const p = await conXml(b); await p.evaluate(() => { pxmlTab('map'); pxmlAddCustom(); }); await sleep(800);
  await p.evaluate(() => { const el = document.querySelector('#pxmlFields_0 input[type=text][oninput*="pxmlRenameCustom"]'); if (el) { el.value = 'Responsable'; el.dispatchEvent(new Event('input', { bubbles: true })); el.scrollIntoView({ block: 'center' }); } }); await sleep(500);
  const r = await p.evaluate(() => { const el = document.querySelector('#pxmlFields_0 input[oninput*="pxmlRenameCustom"]'); const c = el ? el.closest('div[style*="flex-direction:column"]').getBoundingClientRect() : null; return c ? { x: c.left, y: c.top, w: c.width, h: c.height } : null; });
  const y0 = r ? Math.max(0, r.y - 380) : 60;
  await shot(p, 'fig-67-xml-mapeo-personalizado', { clip: C(NAV, y0, W - NAV, 560), ann: r ? [{ n: 1, rect: r, at: 'tl', dx: 2, dy: 2, pad: 3 }] : null }); await p.close();
};
FIGS['68'] = async b => {           // Ubicación de un hito en Vista C1
  const p = await ldt(b); await set(p, 'presShowRaP', true); await sleep(600);
  await p.evaluate(() => { const el = document.querySelector('#presBody [data-pres-mito]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + 4, clientY: r.top + 4 })); }); await sleep(700);
  const m = await rectOf(p, '#presBarMenu');
  await p.evaluate(() => { const e = [...document.querySelectorAll('#presBarMenu *')].find(x => /Ubicación/.test(x.textContent) && x.children.length < 3); if (e) e.scrollIntoView({ block: 'center' }); }); await sleep(300);
  await shot(p, 'fig-68-ldt-hito-ubicacion', { clip: C(Math.max(0, m.x - 60), Math.max(0, m.y - 10), Math.min(W, m.w + 120), Math.min(H, m.h + 20)) }); await p.close();
};
FIGS['69'] = async b => {           // Selección de barras (una y varias)
  const p = await ldt(b); await sleep(300);
  const info = await p.evaluate(() => {
    const els = [...document.querySelectorAll('#presBody [data-pres-bar]')];
    const a = els[3], c = els[6];
    a.dispatchEvent(new MouseEvent('click', { bubbles: true })); c.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    const R = e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    return { a: R(a), c: R(c) };
  }); await sleep(400);
  const y = Math.max(62, info.a.y - 90);
  await shot(p, 'fig-69-ldt-seleccion', { clip: C(info.a.x - 200 > NAV ? info.a.x - 200 : NAV, y, 640, Math.min(H, info.c.y - y + 120)), ann: [{ n: 1, rect: info.a, at: 'tl', pad: 3 }, { n: 2, rect: info.c, at: 'tl', pad: 3 }] });
  await p.close();
};


/* ══ Devolver los cambios a Project (XML) ══ */
FIGS['70'] = async b => {           // Botón en la Base de datos de XML (anotada)
  const p = await conXml(b); await p.evaluate(() => pxmlTab('db')); await sleep(500);
  const r = await rectOf(p, '#pxmlDbList button[onclick^="pxmlWriteBack"]');
  await shot(p, 'fig-70-xml-guardar-cambios', { clip: C(NAV, 0, W - NAV, 420), ann: [{ n: 1, rect: r, at: 'tc', dy: -6, pad: 3 }] });
  await p.close();
};
FIGS['71'] = async b => {           // Cuadro de confirmación previo
  const p = await conXml(b); await p.evaluate(() => { pxmlWriteBack(0); }); await sleep(700);
  await modalShot(p, 'fig-71-xml-guardar-dialogo', '#ogDlg .og-card');
  await p.close();
};
FIGS['72'] = async b => {           // Resumen tras guardar (estadísticas de una escritura real de prueba)
  const p = await conXml(b);
  await p.evaluate(async xml => {
    const leaf = TASKS.filter(t => t.puid && !t.summary && !t.hito);
    leaf[1].av = 60; leaf[2].tarea = leaf[2].tarea + ' (revisada)'; leaf[3].preds = '2;1CC+2 días';
    const ctx = pxmlBuildWriteCtx(0), S = await pxmlPatchStream(new File([xml], 'Planta_ejemplo.xml'), ctx, { write: async () => {} }, null);
    ogDialog({ title: 'XML guardado', msg: pxmlWriteSummary(S), ok: 'Aceptar', cancel: false });
  }, demoXml('Planta de ejemplo'));
  await sleep(700);
  await modalShot(p, 'fig-72-xml-guardado-resumen', '#ogDlg .og-card');
  await p.close();
};

/* Nuevas: menú Descargar, diálogo de Guardar sesión y Agrupador de varios niveles */
FIGS['80'] = async b => {
  const p = await abrir(b); await click(p, '#navDatos'); await sleep(500);
  await p.evaluate(() => { document.getElementById('btnXmlExport').style.display = 'flex'; });
  await click(p, '#btnDatosDlMenu');
  const bt = await rectOf(p, '#btnDatosDlMenu'), pn = await rectOf(p, '#datosDlMenuPanel');
  await shot(p, 'fig-80-menu-descargar', { clip: C(bt.x - 40, bt.y - 10, Math.max(pn.w, bt.w) + 80, pn.y + pn.h - bt.y + 30) });
  await p.close();
};
FIGS['81'] = async b => {
  const p = await abrir(b);
  await p.evaluate(() => { saveSession(); }); await sleep(500);
  await p.evaluate(() => { const i = document.querySelector('#ogDlg .og-in'); i.value = 'RaP SubB — escenario P50'; }); await sleep(200);
  await modalShot(p, 'fig-81-guardar-sesion-dialogo', '#ogDlg .og-card');
  await p.close();
};
FIGS['82'] = async b => {
  const p = await ldt(b); await set(p, 'presShowRaP', true);
  await p.evaluate(() => { PRES_GROUP_FIELDS = ['c1', 'c2']; renderPres(); }); await sleep(600);
  await ldtShot(p, 'fig-82-ldt-agrupador-niveles');
  await p.close();
};


/* ══ Figuras nuevas (v3.2.0): agrupador horizontal, tramos, hitos, conectores, medidas, Timeline Delta, leyenda, íconos ══ */
const DUP = () => {   // segundo escenario inventado: mismos datos desplazados 45 días
  TASKS.forEach(t => { if (!t.escenario) t.escenario = 'Escenario A'; });
  const cp = TASKS.map(x => Object.assign(Object.create(Object.getPrototypeOf(x)), x, { escenario: 'Escenario B', iRP: new Date(+x.iRP + 864e5 * 45), fRP: new Date(+x.fRP + 864e5 * 45) }));
  cp.forEach(x => TASKS.push(x));
  renderPres();
};
const barEl = (re) => (re2 => { const els = [...document.querySelectorAll('#presBody [data-pres-bar],#presBody [data-pres-mito]')]; return els.find(e => re2.test(e.dataset.presBar || e.dataset.presMito)); })(new RegExp(re));
const clipAround = async (p, sels, pad = 24) => {
  const rs = []; for (const s of sels) { try { rs.push(await rectOf(p, s)); } catch (e) { /* sin elemento */ } }
  const x0 = Math.min(...rs.map(r => r.x)) - pad, y0 = Math.min(...rs.map(r => r.y)) - pad;
  const x1 = Math.max(...rs.map(r => r.x + r.w)) + pad, y1 = Math.max(...rs.map(r => r.y + r.h)) + pad;
  return C(Math.max(0, x0), Math.max(0, y0), Math.min(W, x1) - Math.max(0, x0), Math.min(1300, y1) - Math.max(0, y0));
};
FIGS['90'] = async b => {   // Agrupador horizontal + vertical
  const p = await ldt(b); await set(p, 'presShowRaP', true); await set(p, 'presShowSubproc', true);
  await p.evaluate(() => { PRES_GROUP_FIELDS = ['c2']; renderPres(); }); await sleep(700);
  await ldtShot(p, 'fig-90-ldt-agrupador-horizontal');
  await p.close();
};
FIGS['9e'] = async b => {   // Agrupador horizontal pegado a la franja de años
  const p = await ldt(b); await set(p, 'presShowSubproc', true);
  await p.evaluate(() => { document.getElementById('presSubprocPos').value = 'axis'; renderPres(); }); await sleep(700);
  await ldtShot(p, 'fig-905-ldt-agrupador-horizontal-eje', false);
  await p.close();
};
FIGS['9f'] = async b => {   // Copiar formato
  const p = await ldt(b, { h: 900 });
  await p.evaluate(() => { const bs = [...document.querySelectorAll('#presBody [data-pres-bar]')]; const o = bs.find(e => /Obras civiles/.test(e.dataset.presBar)) || bs[3]; PRES_OPTS[o.dataset.presBar] = Object.assign(PRES_OPTS[o.dataset.presBar] || {}, { color: '#f4a261', textBold: true, borderW: 2, borderColor: '#9c4f00' }); renderPres(); _presBarKey = o.dataset.presBar; document.getElementById('btnPresFmt').click(); }); await sleep(700);
  await shot(p, 'fig-906-ldt-copiar-formato', { clip: C(NAV, 62, W - NAV, 838) });
  await p.close();
};
FIGS['91'] = async b => {   // opciones del agrupador horizontal
  const p = await ldt(b); await set(p, 'presShowSubproc', true); await click(p, '#btnPresCapasMenu');
  await click(p, '#btnPresSubprocMenu');
  await shot(p, 'fig-91-agrupador-horizontal-opciones', { clip: await clipAround(p, ['#presCapasMenuPanel', '#presSubprocMenuPanel'], 14) });
  await p.close();
};
FIGS['92'] = async b => {   // tramo en la franja de años
  const p = await ldt(b);
  await p.evaluate(() => { PRES_YEAR_MERGE = { 2027: { to: 2028, label: '' } }; renderPres(); }); await sleep(500);
  await p.evaluate(() => { const y = document.querySelector('#presBody [data-pres-year="2027"]'); const r = y.getBoundingClientRect(); y.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + 30, clientY: r.top + 10 })); }); await sleep(500);
  const m = await rectOf(p, '#presYearMenu'), sv = await p.evaluate(() => { const r = document.querySelector('#presBody svg').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await shot(p, 'fig-92-ldt-tramos-anos', { clip: C(NAV, 62, Math.max(m.x + m.w + 20, sv.x + sv.w) - NAV, Math.max(m.y + m.h + 20, 300) - 62) });
  await p.close();
};
FIGS['93'] = async b => {   // forma y texto adicional del hito
  const p = await ldt(b);
  await p.evaluate(() => { const m = TASKS.find(t => t.hito && /FID/.test(t.tarea)); const k = pkOf(m); PRES_OPTS[k] = Object.assign(PRES_OPTS[k] || { color: '#c0392b', miAbove: true }, { miShape: 'triangleDown', miNote: '$2,25 MUSD\nReservas 2,4 – 6,5 mbls' }); renderPres(); }); await sleep(600);
  await p.evaluate(() => { const el = [...document.querySelectorAll('#presBody [data-pres-mito]')].find(e => /FID/.test(e.dataset.presMito)); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + 4, clientY: r.top + 4 })); }); await sleep(700);
  const m = await rectOf(p, '#presBarMenu'), hito = await p.evaluate(() => { const e = [...document.querySelectorAll('#presBody [data-pres-mito]')].find(e => /FID/.test(e.dataset.presMito)); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const x0 = Math.max(NAV, Math.min(hito.x - 200, m.x - 20)), y0 = Math.max(62, Math.min(hito.y - 80, m.y - 10));
  await shot(p, 'fig-93-hito-forma-texto', { clip: C(x0, y0, m.x + m.w + 20 - x0, Math.min(1300, Math.max(hito.y + hito.h + 120, m.y + m.h + 10)) - y0), ann: [{ n: 1, rect: hito, at: 'tl' }, { n: 2, rect: m, at: 'tr', dx: -6, dy: 10 }] });
  await p.close();
};
FIGS['94'] = async b => {   // días desplazados entre escenarios (Vista Hitos + Agrupador por escenario)
  const p = await ldt(b, { h: 1500 }); await p.evaluate(DUP);
  await set(p, 'presShowRaP', true); await set(p, 'presShowHitos', true);
  await p.evaluate(() => { PRES_GROUP_FIELDS = ['escenario']; renderPres(); }); await sleep(800);
  await ldtShot(p, 'fig-94-ldt-dias-desplazados', false, 1500);
  await p.close();
};
FIGS['95'] = async b => {   // Timeline Delta
  const p = await ldt(b, { h: 1500 }); await p.evaluate(DUP); await set(p, 'presShowDelta', true); await sleep(800);
  const r = await rectOf(p, '#presZoomInner');
  await shot(p, 'fig-95-ldt-timeline-delta', { clip: C(Math.max(0, r.x - 8), Math.max(0, r.y - 8), Math.min(W, r.w + 16), Math.min(1500, r.h + 16)) });
  await p.close();
};
FIGS['96'] = async b => {   // conectores + tarjeta de tipos
  const p = await ldt(b);
  await p.evaluate(() => {
    const K = re => { const e = [...document.querySelectorAll('#presBody [data-pres-bar]')].find(x => re.test(x.dataset.presBar)); return e && e.dataset.presBar; };
    const a = K(/Ingeniería básica/), c = K(/Especificaciones/), d = K(/Adjudicación/), e = K(/Obras civiles/), f = K(/Montaje electro/);
    PRES_CONNECTORS = [{ id: 'a', a, b: c, type: 'z', color: '#1f6f8b', w: 1.5, dash: 'solid', arrow: true }, { id: 'b', a: d, b: e, type: 'l1', color: '#c0392b', w: 1.5, dash: 'dashed', arrow: true }, { id: 'c', a: e, b: f, type: 'straight', color: '#2c3e50', w: 1.5, dash: 'solid', arrow: true }];
    presConnToggle(); renderPres();
  }); await sleep(700);
  await ldtShot(p, 'fig-96-ldt-conectores');
  const r = await rectOf(p, '#presConnCard');
  await shot(p, 'fig-97-conector-tipos', { clip: C(r.x - 12, r.y - 12, r.w + 24, r.h + 24) });
  await p.close();
};
FIGS['98'] = async b => {   // medida de tiempo + su menú
  const p = await ldt(b);
  await p.evaluate(() => {
    const K = re => { const e = [...document.querySelectorAll('#presBody [data-pres-bar],#presBody [data-pres-mito]')].find(x => re.test(x.dataset.presBar || x.dataset.presMito)); return e && (e.dataset.presBar || e.dataset.presMito); };
    PRES_CONNECTORS = [{ id: 'm1', a: K(/FID/), b: K(/Arranque/), type: 'dim', fromEdge: 'end', toEdge: 'end', fmt: 'ym', text: 'Del FID al arranque:', color: '#1f6f8b', w: 1.5, fs: 12 }];
    renderPres();
  }); await sleep(700);
  await ldtShot(p, 'fig-98-ldt-medida-tiempo');
  await p.evaluate(() => { const ln = document.querySelector('#presBody [data-con-drag]'); const r = ln.getBoundingClientRect(); ln.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + 6 })); }); await sleep(500);
  const m = await rectOf(p, '#presConnMenu');
  await shot(p, 'fig-99-medida-menu', { clip: C(m.x - 14, m.y - 14, m.w + 28, m.h + 28) });
  await p.close();
};
FIGS['9a'] = async b => {   // Impacto dibujado
  const p = await ldt(b);
  await p.evaluate(() => { document.getElementById('btnPresImpact').click(); }); await sleep(300);
  await p.evaluate(() => { const els = [...document.querySelectorAll('#presBody [data-pres-bar]')]; const fire = el => ['mousedown', 'mouseup', 'click'].forEach(t => el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true }))); fire(els.find(e => /Obras civiles/.test(e.dataset.presBar))); fire([...document.querySelectorAll('#presBody [data-pres-bar]')].find(e => /Montaje electro/.test(e.dataset.presBar))); }); await sleep(800);
  const c = await rectOf(p, '#presImpactCard');
  await shot(p, 'fig-901-ldt-impacto', { clip: C(NAV, 62, W - NAV, Math.min(1300, c.y + c.h + 20) - 62) });
  await p.close();
};
FIGS['9b'] = async b => {   // menú de borde de un agrupador (clic derecho)
  const p = await ldt(b); await set(p, 'presShowRaP', true);
  await p.evaluate(() => { PRES_GROUP_FIELDS = ['c1']; renderPres(); }); await sleep(600);
  await p.evaluate(() => { const l = document.querySelector('#presBody [data-rap-reorder]'); const r = l.getBoundingClientRect(); l.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 10, clientY: r.top + 30 })); }); await sleep(500);
  await shot(p, 'fig-902-agrupador-borde-menu', { clip: await clipAround(p, ['#presBorderMenu', '#presBody [data-rap-reorder]'], 40) });
  await p.close();
};
FIGS['9c'] = async b => {   // leyenda configurada + su panel
  const p = await ldt(b); await set(p, 'presShowLegend', true);
  await p.evaluate(() => { PRES_LEGEND_CFG.style = 'chip'; PRES_LEGEND_CFG.titleOn = true; PRES_LEGEND_CFG.title = 'Categoría 2'; renderPres(); }); await sleep(500);
  await click(p, '#btnPresCapasMenu'); await p.evaluate(() => presLegendFill()); await click(p, '#btnPresLegendMenu');
  await shot(p, 'fig-903-leyenda-config', { clip: await clipAround(p, ['#presCapasMenuPanel', '#presLegendMenuPanel'], 14) });
  await p.close();
};
FIGS['9d'] = async b => {   // selector de íconos e íconos insertados
  const p = await ldt(b, { w: 1800 }); await click(p, '#btnPresEdicionMenu');
  await p.evaluate(() => { const t = [...document.querySelectorAll('#presEdicionMenuPanel button')].find(e => /Insertar imagen/.test(e.textContent)); t && t.click(); }); await sleep(500);
  const r = await rectOf(p, '#btnPresEdicionMenu'), pk = await rectOf(p, '#presIconPicker');
  await shot(p, 'fig-904-iconos', { clip: C(r.x - 80, r.y - 14, Math.max(420, pk.x + pk.w - r.x + 100), Math.max(pk.y + pk.h - r.y + 40, 380)) });
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
