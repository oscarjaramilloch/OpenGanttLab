/* Ensambla el manual: docs/manual/content/*.html  →  docs/manual/index.html
   - numera las figuras por orden de aparición y renombra sus archivos (fig-NN-slug / diag-NN-slug / flow-NN-slug)
   - expande los componentes (<callout>, <fig>, <figs>, <learn>, <cards>, <ui>) y las tablas
   - comprueba enlaces internos, figuras faltantes/sobrantes y ancla duplicadas
   Uso: node build.js */
const fs = require('fs');
const path = require('path');
const figuras = require('./figuras.js');

const DIR = path.resolve(__dirname, '..');
const CONTENT = path.join(DIR, 'content');
const IMG = path.join(DIR, 'images');
const VERSION = '3.1.2';
const KIND = { screenshots: 'fig', annotated: 'fig', diagrams: 'diag', flows: 'flow' };
const warn = [];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ── Iconos (contorno, un solo trazo, coherentes con la aplicación) ── */
const ICONS = {
  tip: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger: '<path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z"/><path d="M12 8v5"/><path d="M12 16h.01"/>',
  result: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/>',
  note: '<path d="M12 17v5"/><path d="M9 3h6l-1 6 3 3H7l3-3z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
  rocket: '<path d="M5 15c-1.5 1.3-2 4-2 6 2 0 4.7-.5 6-2"/><path d="M9 15l-3-3c1-4 4-8 12-9 0 8-5 11-9 12z"/><circle cx="15" cy="9" r="1.5"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M9 9v11"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 9 5-5 5 5"/><path d="M12 4v12"/>',
  gantt: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M7 13h6"/><path d="M11 17h7"/>',
  clock: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/><circle cx="12" cy="15" r="2"/>',
  compare: '<path d="M4 7h12"/><path d="m13 4 3 3-3 3"/><path d="M20 17H8"/><path d="m11 14-3 3 3 3"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/>',
  filter: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-4-4 8-8z"/><path d="M4 20l4-4"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7"/><path d="M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  up: '<path d="m6 15 6-6 6 6"/>',
  ext: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  x: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.info}</svg>`;

/* ── Imágenes: búsqueda por slug, dimensiones y renombrado ── */
function dimsOf(file) {
  const b = fs.readFileSync(file), ext = path.extname(file).toLowerCase();
  if (ext === '.svg') { const m = /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/.exec(b.toString('utf8', 0, 600)); return m ? [Math.round(+m[1]), Math.round(+m[2])] : [0, 0]; }
  if (ext === '.png') return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (ext === '.webp') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  return [0, 0];
}
function findImage(slug) {
  const found = [];
  for (const dir of Object.keys(KIND)) {
    const d = path.join(IMG, dir); if (!fs.existsSync(d)) continue;
    fs.readdirSync(d).filter(x => /\.(webp|svg|png)$/.test(x) && figuras.quitarPrefijo(x.replace(/\.(webp|svg|png)$/, '')) === slug)
      .forEach(f => found.push({ dir, file: f, full: path.join(d, f), t: fs.statSync(path.join(d, f)).mtimeMs }));
  }
  if (!found.length) return null;
  found.sort((a, b) => b.t - a.t);                       // gana la captura más reciente; las anteriores se eliminan
  found.slice(1).forEach(x => fs.unlinkSync(x.full));
  return found[0];
}

/* ── Lectura de capítulos ── */
const files = fs.readdirSync(CONTENT).filter(f => /^\d+.*\.html$/.test(f)).sort();
const chapters = files.map((f, i) => {
  let src = fs.readFileSync(path.join(CONTENT, f), 'utf8').replace(/^﻿/, '');
  const m = /^\s*<!--(\{[\s\S]*?\})-->/.exec(src);
  if (!m) throw new Error(f + ': falta el comentario JSON de metadatos');
  const meta = JSON.parse(m[1]);
  return { ...meta, n: i + 1, src: src.slice(m[0].length) };
});
const groups = [...new Set(chapters.map(c => c.group))];

/* ── Componentes ── */
let figN = 0; const figMap = {}; const used = new Set();
function expand(src, ch) {
  // callouts
  src = src.replace(/<callout type="(\w+)"(?: title="([^"]*)")?>([\s\S]*?)<\/callout>/g, (_, type, title, body) =>
    `<div class="callout ${type}" role="note">${icon(type)}<div class="cb">${title ? `<div class="ct">${title}</div>` : ''}${body.trim()}</div></div>`);
  // recuadro «En este capítulo aprenderás a»
  src = src.replace(/<learn>([\s\S]*?)<\/learn>/g, (_, body) => `<div class="learn"><b>En este capítulo aprenderás a:</b>${body.trim()}</div>`);
  // tarjetas
  src = src.replace(/<cards>([\s\S]*?)<\/cards>/g, (_, body) => `<div class="cards">${body}</div>`);
  src = src.replace(/<card href="([^"]*)" icon="(\w+)" t="([^"]*)">([\s\S]*?)<\/card>/g, (_, href, ic, t, d) =>
    `<a class="card" href="${href}"><div class="ci">${icon(ic)}</div><b>${t}</b><span>${d.trim()}</span></a>`);
  // figuras
  src = src.replace(/<fig slug="([\w-]+)" t="([^"]*)"(?: legend="([^"]*)")?(?: observe="([^"]*)")?>([\s\S]*?)<\/fig>/g, (_, slug, t, legend, observe, desc) => {
    const im = findImage(slug);
    if (!im) { warn.push(`${ch.slug}: figura sin imagen «${slug}»`); return `<p><b>[falta figura ${slug}]</b></p>`; }
    if (used.has(slug)) warn.push(`${ch.slug}: la figura «${slug}» se usa más de una vez`);
    used.add(slug);
    const n = ++figN; figMap[slug] = n;
    const pre = KIND[im.dir], nn = String(n).padStart(2, '0'), ext = path.extname(im.file);
    const want = `${pre}-${nn}-${slug}${ext}`;
    if (im.file !== want) { fs.renameSync(im.full, path.join(IMG, im.dir, want)); im.file = want; im.full = path.join(IMG, im.dir, want); }
    const [w, h] = dimsOf(im.full), cw = ext === '.webp' ? Math.round(w / 2) : w, chh = ext === '.webp' ? Math.round(h / 2) : h;
    const ol = legend ? `<ol class="legend">${legend.split('|').map(x => `<li>${x}</li>`).join('')}</ol>` : '';
    const ob = observe ? `<div class="observe"><b>Qué observar</b><ul>${observe.split('|').map(x => `<li>${x}</li>`).join('')}</ul></div>` : '';
    return `<figure class="fig" id="figura-${nn}"><div class="imgbox"><img src="images/${im.dir}/${im.file}" width="${cw}" height="${chh}" alt="${esc(t)}" loading="lazy" decoding="async"></div>` +
      `<figcaption><span class="fn">Figura ${nn} — ${t}</span><span class="fd">${desc.trim()}</span>${ol}${ob}</figcaption></figure>`;
  });
  src = src.replace(/<figs>/g, '<div class="figgrid">').replace(/<\/figs>/g, '</div>');
  // elementos de interfaz
  src = src.replace(/<ui>([\s\S]*?)<\/ui>/g, '<span class="ui">$1</span>');
  // tablas con desplazamiento horizontal
  src = src.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  // ids de encabezados
  const seen = new Set();
  src = src.replace(/<h([23])(?: id="([\w-]+)")?>([\s\S]*?)<\/h\1>/g, (_, l, id, txt) => {
    let a = id || slugify(txt), k = a, i = 2; while (seen.has(k)) k = a + '-' + i++; seen.add(k);
    return `<h${l} id="${ch.slug}--${k}">${txt}</h${l}>`;
  });
  return src;
}

const articles = chapters.map(ch => {
  const body = expand(ch.src, ch);
  return `<article data-slug="${ch.slug}" id="${ch.slug}" hidden aria-labelledby="${ch.slug}--h1"><p class="kicker">Capítulo ${ch.n} · ${esc(ch.group)}</p><h1 id="${ch.slug}--h1">${ch.title}</h1>${ch.lead ? `<p class="lead">${ch.lead}</p>` : ''}${body}</article>`;
}).join('\n\n');

/* ── Comprobaciones ── */
const ids = new Set([...articles.matchAll(/ id="([\w-]+)"/g)].map(m => m[1]));
const slugs = new Set(chapters.map(c => c.slug));
for (const m of articles.matchAll(/href="#\/([\w-]+)(?:\/([\w-]+))?"/g)) {
  if (!slugs.has(m[1])) warn.push(`enlace roto → capítulo «${m[1]}»`);
  else if (m[2] && !ids.has(`${m[1]}--${m[2]}`)) warn.push(`enlace roto → ancla «${m[1]}/${m[2]}»`);
}
for (const dir of Object.keys(KIND)) { const d = path.join(IMG, dir); if (!fs.existsSync(d)) continue; fs.readdirSync(d).forEach(f => { const s = figuras.quitarPrefijo(f.replace(/\.(webp|svg|png)$/, '')); if (!used.has(s)) warn.push(`imagen sin usar: ${dir}/${f}`); }); }
fs.writeFileSync(figuras.FILE, JSON.stringify(figMap, null, 1));

/* ── Plantilla ── */
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</defs></svg>`;
const use = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const APP = '../../src/OpenGanttLab%203.1.html';
const page = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manual de OpenGanttLab</title>
<meta name="description" content="Manual de usuario de OpenGanttLab: importar cronogramas, comparar escenarios, dependencias, Línea de Tiempo, exportación y solución de problemas.">
<link rel="icon" href="../../assets/logo.svg" type="image/svg+xml">
<script>try{var t=localStorage.getItem('ogl-manual-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="stylesheet" href="assets/manual.css">
</head>
<body>
<!-- Generado por tools/build.js a partir de content/*.html — no editar a mano. -->
${sprite}
<a class="skip" href="#main">Saltar al contenido</a>
<header class="top">
  <button class="iconbtn" id="menuBtn" aria-label="Abrir el menú">${use('menu')}</button>
  <a class="brand" href="#/${chapters[0].slug}"><img src="../../assets/logo.svg" alt="" width="30" height="30"><span>Open<b>Gantt</b>Lab</span><small>Manual de usuario</small></a>
  <span class="spacer"></span>
  <div class="search" role="search">${use('search')}<input id="q" type="search" placeholder="Buscar en el manual…" aria-label="Buscar en el manual" autocomplete="off"><kbd>Ctrl K</kbd><div class="results" id="results" role="listbox"></div></div>
  <span class="spacer"></span>
  <a class="btn primary" href="${APP}" target="_blank" rel="noopener">${use('ext')}<span class="lbl">Abrir la aplicación</span></a>
  <button class="iconbtn" id="printBtn" title="Imprimir o guardar todo el manual como PDF" aria-label="Imprimir el manual">${use('print')}</button>
  <button class="iconbtn" id="themeBtn" title="Cambiar entre tema claro y oscuro" aria-label="Cambiar tema">${use('moon')}</button>
</header>
<div class="layout">
  <nav class="side" id="side" aria-label="Capítulos del manual"></nav>
  <main id="main">
    <div class="crumbs" id="crumbs" aria-label="Ruta"></div>
${articles}
    <div class="pager" id="pager"></div>
    <footer class="foot">Manual de OpenGanttLab v${VERSION} · © 2026 Oscar Fernando Jaramillo Chamorro · Software libre bajo licencia GNU GPLv3 · <a href="mailto:oscar.jaramillo@outlook.com">oscar.jaramillo@outlook.com</a></footer>
  </main>
  <aside class="toc" id="toc" aria-label="En esta página"></aside>
</div>
<button class="iconbtn" id="toTop" aria-label="Volver arriba">${use('up')}</button>
<div id="lightbox" role="dialog" aria-label="Figura ampliada"><button class="iconbtn" aria-label="Cerrar">${use('x')}</button><img alt=""></div>
<noscript><p style="padding:20px">Este manual necesita JavaScript para mostrar los capítulos.</p></noscript>
<script>window.MANUAL=${JSON.stringify({ groups, chapters: chapters.map(c => ({ slug: c.slug, title: c.title.replace(/<[^>]+>/g, ''), group: c.group, n: c.n })) })};</script>
<script src="assets/manual.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(DIR, 'index.html'), page);
console.log(`✓ index.html — ${chapters.length} capítulos, ${figN} figuras, ${(page.length / 1024).toFixed(0)} KB`);
if (warn.length) { console.log('\nAVISOS (' + warn.length + '):'); warn.forEach(w => console.log(' · ' + w)); }
else console.log('Sin avisos.');
