/* Genera los diagramas y flujos del manual como SVG autónomos (paleta de la guía de marca).
   Uso: node diagramas.js   →   ../images/diagrams  y  ../images/flows */
const fs = require('fs');
const figuras = require('./figuras.js');
const path = require('path');
const OUT = path.resolve(__dirname, '../images');
fs.mkdirSync(OUT + '/diagrams', { recursive: true });
fs.mkdirSync(OUT + '/flows', { recursive: true });

const NAVY = '#0f2d5b', BLUE = '#2563eb', GREEN = '#16a34a', ORANGE = '#f59e0b', GRAY = '#e5e7eb', INK = '#172b3a', MUTED = '#5a6b78', TINT = '#e8f0ff', RED = '#d63031';
const FONT = "Inter,'Segoe UI',Arial,sans-serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = (w, h, body, title, desc) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<defs>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,1 L10,5 L0,9 z" fill="${MUTED}"/></marker>
<marker id="ab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,1 L10,5 L0,9 z" fill="${BLUE}"/></marker>
<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#d0d0d0"/><line x1="0" y1="0" x2="0" y2="6" stroke="#8a8a8a" stroke-width="1.4"/></pattern>
</defs>
<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="14" fill="#fff" stroke="#dde5ee"/>
${body}
</svg>
`;
/* Texto centrado multilínea */
const tx = (x, y, lines, { size = 14, weight = 500, fill = INK, anchor = 'middle', lh = 1.25 } = {}) => {
  lines = Array.isArray(lines) ? lines : [lines];
  const y0 = y - ((lines.length - 1) * size * lh) / 2;
  return `<text x="${x}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">` +
    lines.map((l, i) => `<tspan x="${x}" y="${(y0 + i * size * lh + size * 0.35).toFixed(1)}">${esc(l)}</tspan>`).join('') + '</text>';
};
const box = (x, y, w, h, lines, { fill = '#fff', stroke = '#c9d5e3', color = INK, size = 14, weight = 600, r = 10, sw = 1.5 } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>` + tx(x + w / 2, y + h / 2, lines, { size, weight, fill: color });
const arrow = (x1, y1, x2, y2, { color = MUTED, mk = 'ah', dash = '', w = 2 } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${mk})"/>`;
const path2 = (d, { color = MUTED, mk = 'ah', w = 2, dash = '' } = {}) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#${mk})"/>`;
const badge = (x, y, n, fill = BLUE) => `<circle cx="${x}" cy="${y}" r="13" fill="${fill}"/>` + tx(x, y, String(n), { size: 13, weight: 700, fill: '#fff' });
const write = (dir, name, content) => { const f = figuras.nombre(dir === 'flows' ? 'flow' : 'diag', name); fs.writeFileSync(path.join(OUT, dir, f + '.svg'), content); console.log('✓', dir + '/' + f); };

/* ── D1 · Arquitectura conceptual ── */
write('diagrams', 'diag-01-arquitectura', svg(940, 400, [
  tx(470, 34, 'De los datos al resultado', { size: 17, weight: 700, fill: NAVY }),
  tx(120, 78, 'ENTRADA', { size: 11, weight: 700, fill: MUTED }), tx(470, 78, 'DATOS DE LA APLICACIÓN', { size: 11, weight: 700, fill: MUTED }),
  tx(770, 78, 'VISTAS', { size: 11, weight: 700, fill: MUTED }),
  box(30, 100, 180, 78, ['Excel (.xlsx)', 'Escenarios y tareas'], { fill: '#ecfdf3', stroke: GREEN, color: '#0f5132' }),
  box(30, 220, 180, 78, ['Project XML (.xml)', 'Incluso de más de 1 GB'], { fill: '#fff7e6', stroke: ORANGE, color: '#7a4a00' }),
  arrow(212, 139, 320, 190), arrow(212, 259, 320, 210),
  box(322, 140, 296, 120, ['Tabla de Datos', 'Escenario · Categoría 1 · Categoría 2', 'Tarea · fechas LB y R/P · avance', 'ID · Predecesoras'], { fill: TINT, stroke: BLUE, color: NAVY, size: 13, r: 14, sw: 2 }),
  arrow(620, 175, 690, 128), arrow(620, 200, 690, 200), arrow(620, 225, 690, 272),
  box(692, 100, 220, 56, ['Gantt', 'Comparador de Escenarios'], { size: 13 }),
  box(692, 172, 220, 56, ['Línea de Tiempo', 'Vista ejecutiva'], { size: 13 }),
  box(692, 244, 220, 56, ['Análisis', 'Barra de estado · avisos'], { size: 13 }),
  path2('M802 302 V338 H470 V322', { color: BLUE, mk: 'ab' }),
  box(300, 322, 340, 56, ['Exportar y compartir', 'PNG · PDF · PPTX · Excel · HTML autónomo'], { fill: '#f0f6ff', stroke: BLUE, color: NAVY, size: 13 }),
].join('\n'), 'Arquitectura conceptual', 'Excel y Project XML alimentan la Tabla de Datos, que alimenta el Gantt, la Línea de Tiempo y el análisis; el resultado se exporta o se comparte.'));

/* ── F1 · Flujo de trabajo ── */
{
  const steps = [['IMPORTAR', 'Datos → Cargar archivo'], ['REVISAR', 'Tabla de Datos'], ['COMPARAR', 'Gantt · Línea base'], ['PRESENTAR', 'Línea de Tiempo'], ['EXPORTAR', 'PNG · PDF · PPTX · HTML']];
  const w = 172, gap = 12, x0 = 24;
  const b = steps.map(([t, s], i) => {
    const x = x0 + i * (w + gap);
    return `<path d="M${x} 70 h${w - 18} l18 40 l-18 40 h-${w - 18} l18 -40 z" fill="${i === 4 ? GREEN : i % 2 ? BLUE : NAVY}"/>` +
      tx(x + w / 2 + 4, 100, t, { size: 15, weight: 800, fill: '#fff' }) + tx(x + w / 2 + 4, 122, s, { size: 11, weight: 500, fill: '#dbe7ff' }) + badge(x + 22, 62, i + 1, ORANGE);
  }).join('\n');
  write('flows', 'flow-01-flujo-trabajo', svg(940, 200, tx(470, 32, 'Flujo de trabajo en OpenGanttLab', { size: 17, weight: 700, fill: NAVY }) + b +
    tx(470, 178, 'Cada etapa se puede repetir: al corregir un dato, el Gantt y la Línea de Tiempo se actualizan.', { size: 12, fill: MUTED }), 'Flujo de trabajo', 'Importar, revisar, comparar, presentar y exportar.'));
}

/* ── D2 · Jerarquía de datos ── */
{
  const lv = [['Escenario', 'Versión del cronograma', 'p. ej. Plan base', '#0d2137'], ['Categoría 1', 'Agrupación mayor', 'p. ej. Compras', '#1f6f54'], ['Categoría 2', 'Fase o agrupación', 'p. ej. Licitación', '#8e7cc3'], ['Tarea / Hito', 'Fila del Gantt', 'p. ej. Adjudicación de contratos', '#2563eb']];
  const b = lv.map(([t, s, e, c], i) => {
    const x = 30 + i * 218;
    return box(x, 80, 190, 84, [t, s], { fill: c, stroke: c, color: '#fff', size: 15 }) + tx(x + 95, 194, e, { size: 12, fill: MUTED }) + (i < 3 ? arrow(x + 192, 122, x + 216, 122) : '');
  }).join('\n');
  write('diagrams', 'diag-02-jerarquia', svg(940, 240, tx(470, 34, 'Cómo se organizan las tareas', { size: 17, weight: 700, fill: NAVY }) + b +
    tx(470, 222, 'Cada nivel agrupa al siguiente. Sin columna Escenario, cada archivo XML (o cada Categoría 1) cuenta como un escenario.', { size: 12, fill: MUTED }), 'Jerarquía de datos', 'Escenario, Categoría 1, Categoría 2 y Tarea o Hito.'));
}

/* ── D3 · Tipos de dependencia ── */
{
  // a = [x, ancho] de A, b2 = [x, ancho] de B (relativos al panel); type define el conector
  const panel = (x, y, code, name, desc, a, b2, type) => {
    const yA = y + 76, yB = y + 116, al = x + a[0], ar = al + a[1], bl = x + b2[0], br = bl + b2[1];
    const A = `<rect x="${al}" y="${yA - 9}" width="${a[1]}" height="18" rx="4" fill="${BLUE}"/>` + tx(al - 30, yA, 'A', { size: 12, weight: 700, fill: NAVY });
    const B = `<rect x="${bl}" y="${yB - 9}" width="${b2[1]}" height="18" rx="4" fill="${GREEN}"/>` + tx(bl - 30, yB, 'B', { size: 12, weight: 700, fill: '#0f5132' });
    const cn = {
      FC: `M${ar} ${yA} h12 V${yB} H${bl}`,
      CC: `M${al} ${yA} h-14 V${yB} H${bl - 2}`,
      FF: `M${ar} ${yA} h14 V${yB} H${br + 2}`,
      CF: `M${al} ${yA} h-14 V${yB} H${br + 2}`,
    }[type];
    return `<rect x="${x}" y="${y}" width="420" height="150" rx="12" fill="#f8fafc" stroke="#dde5ee"/>` + tx(x + 16, y + 26, `${code}  ·  ${name}`, { size: 14, weight: 700, fill: NAVY, anchor: 'start' }) + tx(x + 16, y + 46, desc, { size: 11.5, fill: MUTED, anchor: 'start' }) + A + B + path2(cn, { color: BLUE, mk: 'ab' });
  };
  const body = [
    tx(470, 32, 'Los cuatro tipos de vínculo (formato de Project)', { size: 17, weight: 700, fill: NAVY }),
    panel(30, 54, 'FC', 'Fin a Comienzo (FS)', 'B empieza cuando termina A. Es el tipo por defecto.', [50, 150], [230, 150], 'FC'),
    panel(490, 54, 'CC', 'Comienzo a Comienzo (SS)', 'B empieza cuando empieza A.', [90, 220], [90, 150], 'CC'),
    panel(30, 224, 'FF', 'Fin a Fin (FF)', 'B termina cuando termina A.', [50, 220], [130, 140], 'FF'),
    panel(490, 224, 'CF', 'Comienzo a Fin (SF)', 'B termina cuando empieza A.', [230, 150], [50, 140], 'CF'),
  ].join('\n');
  write('diagrams', 'diag-03-tipos-dependencia', svg(940, 400, body, 'Tipos de dependencia', 'FC, CC, FF y CF entre una tarea A (predecesora) y una tarea B (sucesora).'));
}

/* ── D4 · Anatomía de la columna Predecesoras ── */
{
  const parts = [['12', ['id de la', 'predecesora'], NAVY, 150], ['CC', ['tipo de vínculo', '(FC · CC · FF · CF)'], BLUE, 170], ['+2 días', ['desfase', '(+ retraso · − adelanto)'], GREEN, 210]];
  let x = (940 - (150 + 170 + 210 + 40)) / 2;
  const b = parts.map(([t, l, c, w]) => { const bx = x; x += w + 20;
    return `<rect x="${bx}" y="70" width="${w}" height="56" rx="10" fill="${c}"/>` + tx(bx + w / 2, 98, t, { size: 26, weight: 800, fill: '#fff' }) + path2(`M${bx + w / 2} 130 v22`, { color: c, mk: 'ah', w: 1.5 }) + tx(bx + w / 2, 178, l, { size: 12, fill: INK }); }).join('\n');
  write('diagrams', 'diag-04-formato-predecesoras', svg(940, 250, tx(470, 32, 'Cómo se escribe una predecesora', { size: 17, weight: 700, fill: NAVY }) + b +
    tx(470, 224, 'Varias predecesoras se separan con «;»   →   12;15FC+3 días;7FF-1 día', { size: 13, weight: 600, fill: MUTED }), 'Formato de predecesoras', 'El id, el tipo y el desfase, con el mismo formato que Microsoft Project.'));
}

/* ── F2 · Lectura de un XML de Project ── */
write('flows', 'flow-02-lectura-xml', svg(940, 330, [
  tx(470, 32, 'Cómo se lee un archivo XML de Project', { size: 17, weight: 700, fill: NAVY }),
  box(24, 120, 150, 70, ['Archivo .xml', 'hasta más de 1 GB'], { fill: '#fff7e6', stroke: ORANGE, color: '#7a4a00', size: 13 }),
  arrow(176, 155, 214, 155),
  box(216, 120, 150, 70, ['Lectura', 'por partes'], { fill: TINT, stroke: BLUE, color: NAVY, size: 14 }),
  arrow(368, 140, 418, 90), arrow(368, 170, 418, 240),
  box(420, 52, 240, 100, ['SE CONSERVA', 'Proyecto y campos personalizados', 'Tareas · líneas base 0–10', 'Predecesoras (UID → ID)'], { fill: '#ecfdf3', stroke: GREEN, color: '#0f5132', size: 12, weight: 600 }),
  box(420, 190, 240, 100, ['SE DESCARTA', 'Asignaciones · recursos', 'Calendarios', 'Time phasing'], { fill: '#fdf2f2', stroke: '#e57373', color: '#7a1f1f', size: 12, weight: 600 }),
  arrow(662, 102, 712, 155),
  box(714, 120, 200, 70, ['Mapeo de columnas', 'y Tabla de Datos'], { fill: TINT, stroke: BLUE, color: NAVY, size: 14 }),
  tx(470, 312, 'La memoria depende del número de tareas, no del tamaño del archivo.', { size: 12, fill: MUTED }),
].join('\n'), 'Lectura de un XML', 'El XML se lee por partes: se conservan proyecto, tareas, líneas base y predecesoras; se descartan asignaciones, recursos, calendarios y time phasing.'));

/* ── D5 · Línea base vs Real/Proyectado ── */
{
  const b = [
    tx(470, 32, 'Comparar Línea Base y Real/Proyectado', { size: 17, weight: 700, fill: NAVY }),
    `<line x1="60" y1="60" x2="60" y2="230" stroke="#c9d5e3" stroke-dasharray="4 4"/><line x1="600" y1="60" x2="600" y2="230" stroke="#c9d5e3" stroke-dasharray="4 4"/>`,
    `<rect x="60" y="80" width="360" height="22" rx="3" fill="url(#hatch)" stroke="#999"/>`, tx(30, 91, 'LB', { size: 12, weight: 700, fill: MUTED }),
    `<rect x="120" y="112" width="480" height="22" rx="3" fill="${BLUE}"/>`, tx(30, 123, 'R/P', { size: 12, weight: 700, fill: NAVY }),
    tx(60, 62, 'inicio LB', { size: 11, fill: MUTED }), tx(600, 62, 'fin R/P', { size: 11, fill: MUTED }),
    `<line x1="420" y1="156" x2="600" y2="156" stroke="${RED}" stroke-width="2" marker-end="url(#ah)"/>`, tx(510, 176, 'Desplazamiento del fin', { size: 12, weight: 600, fill: RED }),
    `<line x1="60" y1="156" x2="120" y2="156" stroke="${ORANGE}" stroke-width="2" marker-end="url(#ah)"/>`, tx(90, 176, 'Inicio', { size: 12, weight: 600, fill: '#b45309' }),
    `<rect x="120" y="112" width="288" height="22" rx="3" fill="rgba(0,0,0,.22)"/>`, tx(264, 123, 'avance real', { size: 11, weight: 600, fill: '#fff' }),
    tx(470, 216, 'La barra rayada es la Línea Base; la barra de color es lo Real/Proyectado, con el avance como relleno más oscuro.', { size: 12, fill: MUTED }),
  ].join('\n');
  write('diagrams', 'diag-05-lb-vs-rp', svg(940, 250, b, 'Línea base frente a real proyectado', 'La barra rayada de la línea base frente a la barra de color de lo real o proyectado, con su desplazamiento.'));
}

/* ── F3 · Escenarios ── */
write('flows', 'flow-03-escenarios', svg(940, 250, [
  tx(470, 32, 'Trabajar con escenarios', { size: 17, weight: 700, fill: NAVY }),
  box(24, 70, 170, 60, ['Cargar cada versión', 'p. ej. P10 · P50 · P90'], { fill: '#fff7e6', stroke: ORANGE, color: '#7a4a00', size: 13 }),
  arrow(196, 100, 246, 100),
  box(248, 70, 170, 60, ['Nombrar el escenario', 'variante o columna Escenario'], { fill: TINT, stroke: BLUE, color: NAVY, size: 13 }),
  arrow(420, 100, 470, 100),
  box(472, 70, 170, 60, ['Filtrar y comparar', 'segmentador · Selección'], { fill: TINT, stroke: BLUE, color: NAVY, size: 13 }),
  arrow(644, 100, 694, 100),
  box(696, 70, 220, 60, ['Ver en el Gantt', 'y presentar en la LdT'], { fill: '#ecfdf3', stroke: GREEN, color: '#0f5132', size: 13 }),
  tx(470, 172, 'Duplicar escenario (Datos → Gestión de escenarios) crea una copia idéntica para simular cambios sin tocar el original.', { size: 12, fill: MUTED }),
  tx(470, 198, 'Eliminar escenario quita también sus tareas de la tabla; se puede deshacer.', { size: 12, fill: MUTED }),
].join('\n'), 'Flujo de escenarios', 'Cargar variantes, nombrarlas, elegir escenarios y compararlos.'));

/* ── D6 · Ciclo con Excel ── */
write('diagrams', 'diag-06-ciclo-excel', svg(940, 300, [
  tx(470, 32, 'Ciclo de trabajo con un Excel vinculado', { size: 17, weight: 700, fill: NAVY }),
  box(50, 100, 220, 110, ['Excel vinculado', 'Escenarios.xlsx'], { fill: '#ecfdf3', stroke: GREEN, color: '#0f5132', size: 15, r: 14 }),
  box(670, 100, 220, 110, ['OpenGanttLab', 'Gantt · LdT · Tabla'], { fill: TINT, stroke: BLUE, color: NAVY, size: 15, r: 14 }),
  path2('M272 130 H668', { color: BLUE, mk: 'ab' }), tx(470, 116, 'Actualizar', { size: 13, weight: 700, fill: NAVY }), tx(470, 150, 'recarga los últimos cambios del Excel', { size: 11, fill: MUTED }),
  path2('M668 182 H272', { color: GREEN, mk: 'ah' }).replace('url(#ah)', 'url(#ah)'), tx(470, 168, 'Guardar cambios', { size: 13, weight: 700, fill: '#0f5132' }), tx(470, 202, 'escribe la Tabla de Datos en el mismo archivo', { size: 11, fill: MUTED }),
  path2('M780 212 V260 H600', { color: MUTED }), tx(470, 262, 'Descargar .xlsx · Compartir (HTML autónomo)', { size: 12, weight: 600, fill: INK, anchor: 'end' }),
  tx(470, 288, 'Guardar en el Excel requiere Chrome o Edge (API File System Access).', { size: 11, fill: MUTED }),
].join('\n'), 'Ciclo con Excel', 'Actualizar carga el Excel, Guardar cambios lo escribe; Descargar y Compartir generan archivos nuevos.'));

/* ── D7 · Conflicto de fechas ── */
{
  const b = [
    tx(470, 32, 'Qué es un conflicto de fechas', { size: 17, weight: 700, fill: NAVY }),
    tx(30, 84, 'A', { size: 13, weight: 700, fill: NAVY, anchor: 'start' }), `<rect x="70" y="72" width="360" height="22" rx="4" fill="${BLUE}"/>`,
    tx(30, 132, 'B', { size: 13, weight: 700, fill: '#0f5132', anchor: 'start' }), `<rect x="240" y="120" width="330" height="22" rx="4" fill="${GREEN}" stroke="${ORANGE}" stroke-width="2.5" stroke-dasharray="5 3"/>`,
    path2('M430 94 h14 v14 h-214 v12', { color: ORANGE, mk: 'ah', dash: '5 3' }),
    `<line x1="430" y1="60" x2="430" y2="160" stroke="${RED}" stroke-dasharray="3 3"/>`, tx(430, 176, 'fin de A', { size: 11, fill: RED, weight: 600 }), tx(240, 176, 'inicio de B', { size: 11, fill: '#b45309', weight: 600 }),
    box(610, 70, 300, 80, ['Vínculo FC: B no puede empezar', 'antes de que termine A.', 'Aquí empieza antes → aviso.'], { fill: '#fffbeb', stroke: ORANGE, color: '#7a4a00', size: 12, weight: 600 }),
    tx(470, 214, 'Puede ser intencional (por estrategia): el aviso es opcional y viene apagado (Configuración).', { size: 12, fill: MUTED }),
  ].join('\n');
  write('diagrams', 'diag-07-conflicto-fechas', svg(940, 240, b, 'Conflicto de fechas', 'B empieza antes de que termine su predecesora A en un vínculo FC.'));
}
