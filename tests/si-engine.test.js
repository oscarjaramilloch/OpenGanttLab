/* Pruebas del motor de Schedule Intelligence (bloque SI:ENGINE de src/OpenGanttLab 3.1.html).
   Uso: node tests/si-engine.test.js   (sin dependencias) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.resolve(__dirname, '../src/OpenGanttLab 3.1.html'), 'utf8');
const a = html.indexOf('/*SI:ENGINE:BEGIN*/'), b = html.indexOf('/*SI:ENGINE:END*/');
if (a < 0 || b < 0) throw new Error('No se encontró el bloque SI:ENGINE');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(html.slice(a, b) + ';this.SI=SI;', ctx);
const SI = ctx.SI;

let fail = 0, ok = 0;
const eq = (got, want, msg) => { if (JSON.stringify(got) !== JSON.stringify(want)) { fail++; console.log('  ✗', msg, '\n     obtuvo', JSON.stringify(got), '\n     esperaba', JSON.stringify(want)); } else ok++; };
const D = (y, m, d) => new Date(y, m - 1, d);
const T = (o) => Object.assign({ c1: 'F', c2: 'X', hito: false, evento: false, summary: false, crit: false }, o);
const task = (name, s, f, extra) => T(Object.assign({ tarea: name, iRP: D(...s), fRP: D(...(f || s)), iLB: D(...s), fLB: D(...(f || s)) }, extra));
const row = (res, name) => res.rows.find(r => r.name === name);

console.log('fechas y duración');
eq(SI.dayNo(D(2026, 9, 1)), SI.dayNo(D(2026, 8, 31)) + 1, 'dayNo consecutivo');
eq(SI.dayNo(D(2026, 10, 25)) - SI.dayNo(D(2026, 10, 24)), 1, 'dayNo estable en cambio de hora');
eq(SI.dayNo(null), null, 'fecha ausente = null (no cero)');
eq(SI.dayNo(new Date('x')), null, 'fecha inválida = null');
eq(SI.iso(SI.dayNo(D(2026, 9, 1))), '2026-09-01', 'iso ida y vuelta');

console.log('delta de hito: CV0 2026-09-01 → 2026-10-01 = 30 días');
{
    const A = [task('CV0', [2026, 9, 1], null, { hito: true, puid: '5', pscope: 'x.xml' })];
    const B = [task('CV0', [2026, 10, 1], null, { hito: true, puid: '5', pscope: 'x.xml' })];
    const r = SI.compare(A, B, { scenarioA: 'A', scenarioB: 'B' });
    const c = row(r, 'CV0');
    eq(c.deltaFinishDays, 30, 'delta fin'); eq(c.deltaStartDays, 30, 'delta inicio');
    eq(c.status, 'retrasado', 'estado retrasado'); eq(c.method, 'uid', 'emparejado por UID');
    eq(c.durationA, 0, 'duración hito = 0'); eq(c.percentChange, null, '% con duración A=0 no aplica');
    eq(r.summary.milestones.delayed, 1, 'resumen hitos retrasados');
    eq(r.summary.finishDeltaDays, 30, 'delta fin de proyecto');
}

console.log('delta de duración y adelanto');
{
    const A = [task('T1', [2026, 1, 1], [2026, 1, 10], { puid: '1', pscope: 'p' }), task('T2', [2026, 2, 1], [2026, 2, 10], { puid: '2', pscope: 'p' })];
    const B = [task('T1', [2026, 1, 1], [2026, 1, 20], { puid: '1', pscope: 'p' }), task('T2', [2026, 1, 25], [2026, 2, 3], { puid: '2', pscope: 'p' })];
    const r = SI.compare(A, B);
    eq(row(r, 'T1').deltaDurationDays, 10, 'duración +10'); eq(row(r, 'T1').percentChange, 100, '+100 %');
    eq(row(r, 'T1').status, 'retrasado', 'T1 retrasada por fin');
    eq(row(r, 'T2').status, 'adelantado', 'T2 adelantada'); eq(row(r, 'T2').deltaFinishDays, -7, 'T2 fin -7');
}

console.log('modificado: mismo fin, distinto inicio');
{
    const r = SI.compare([task('T', [2026, 1, 1], [2026, 1, 10], { puid: '1', pscope: 'p' })], [task('T', [2026, 1, 3], [2026, 1, 10], { puid: '1', pscope: 'p' })]);
    eq(row(r, 'T').status, 'modificado', 'estado modificado'); eq(row(r, 'T').changes, ['inicio', 'duracion'], 'tipos de cambio');
}

console.log('agregadas y eliminadas');
{
    const A = [task('Solo A', [2026, 1, 1], [2026, 1, 5]), task('Común', [2026, 1, 1], [2026, 1, 5])];
    const B = [task('Común', [2026, 1, 1], [2026, 1, 5]), task('Solo B', [2026, 2, 1], [2026, 2, 5])];
    const r = SI.compare(A, B);
    eq(row(r, 'Solo A').status, 'eliminado', 'eliminado'); eq(row(r, 'Solo B').status, 'agregado', 'agregado');
    eq(row(r, 'Común').status, 'sin_cambio', 'sin cambio'); eq(r.summary.counts.added, 1, 'cuenta agregadas'); eq(r.summary.counts.removed, 1, 'cuenta eliminadas');
}

console.log('emparejamiento');
{
    // mismo UID en archivos distintos NO debe emparejar por UID (colisión casual)
    const A = [task('Alfa', [2026, 1, 1], [2026, 1, 5], { puid: '7', pscope: 'a.xml', c1: 'P' })];
    const B = [task('Beta', [2026, 1, 1], [2026, 1, 5], { puid: '7', pscope: 'b.xml', c1: 'P' })];
    const r = SI.compare(A, B);
    eq(r.rows.filter(x => x.matchStatus === 'MATCHED').length, 0, 'UID igual en archivos distintos no empareja');
    // mismo nombre único → emparejar por nombre aunque cambie la categoría
    const r2 = SI.compare([task('Perforación', [2026, 1, 1], [2026, 1, 5], { c1: 'X1' })], [task('Perforación', [2026, 1, 8], [2026, 1, 12], { c1: 'Y1' })]);
    eq(row(r2, 'Perforación').method, 'nombre', 'emparejado por nombre único');
    // nombre repetido y sin contexto común: no adivinar
    const r3 = SI.compare([task('Dup', [2026, 1, 1], [2026, 1, 2], { c1: 'a' }), task('Dup', [2026, 2, 1], [2026, 2, 2], { c1: 'a' })], [task('Dup', [2026, 3, 1], [2026, 3, 2], { c1: 'z' })]);
    eq(r3.rows.filter(x => x.matchStatus === 'MATCHED').length, 0, 'nombre ambiguo no se empareja');
    // contexto con nombres repetidos: por orden de aparición
    const r4 = SI.compare([task('Rep', [2026, 1, 1], [2026, 1, 2]), task('Rep', [2026, 2, 1], [2026, 2, 2])], [task('Rep', [2026, 1, 1], [2026, 1, 2]), task('Rep', [2026, 2, 11], [2026, 2, 12])]);
    eq(r4.rows.map(x => x.deltaFinishDays), [0, 10], 'repetidas emparejadas por orden');
    eq(r4.rows.every(x => x.method === 'contexto' && !x.metadata.ambiguous), true, 'método contexto sin ambigüedad');
    // copia de escenario (mismo UID y archivo) empareja por UID aunque cambie el nombre
    const r5 = SI.compare([task('Nombre viejo', [2026, 1, 1], [2026, 1, 2], { puid: '9', pscope: 'f' })], [task('Nombre nuevo', [2026, 1, 1], [2026, 1, 2], { puid: '9', pscope: 'f' })]);
    eq(r5.rows[0].matchStatus, 'MATCHED', 'UID + archivo empareja con nombre distinto');
}

console.log('datos incompletos');
{
    const bad = T({ tarea: 'Sin fecha', iRP: null, fRP: null });
    const r = SI.compare([bad], [task('Sin fecha', [2026, 1, 1])]);
    eq(row(r, 'Sin fecha').status, 'no_comparable', 'fechas ausentes = no comparable');
    eq(row(r, 'Sin fecha').deltaFinishDays, null, 'sin delta inventado');
    const r2 = SI.compare([T({ tarea: 'Inv', iRP: D(2026, 5, 10), fRP: D(2026, 5, 1) })], [task('Inv', [2026, 5, 1])]);
    eq(row(r2, 'Inv').status, 'no_comparable', 'fin anterior a inicio = no comparable');
}

console.log('hitos clave');
{
    eq(SI.isKey('FID W.O', { auto: true }), true, 'FID por nombre'); eq(SI.isKey('CN2', {}), true, 'CN2 por nombre');
    eq(SI.isKey('Cargue de recursos CV0', {}), true, 'CV0 por nombre'); eq(SI.isKey('Ing Sup Detalle', {}), false, 'tarea normal no es clave');
    eq(SI.isKey('FID', { auto: false }), false, 'detección automática apagada');
    eq(SI.isKey('Ing Sup', { manual: { 'ing sup': true } }), true, 'marca manual');
    eq(SI.isKey('FID', { manual: { fid: false } }), false, 'exclusión manual gana a la detección');
}

console.log('resumen: fin de proyecto y hitos');
{
    const A = [task('I', [2026, 1, 1], [2026, 1, 10], { puid: '1', pscope: 'p' }), task('H', [2026, 12, 1], null, { hito: true, puid: '2', pscope: 'p' }), task('H2', [2027, 1, 1], null, { hito: true, puid: '3', pscope: 'p' })];
    const B = [task('I', [2026, 1, 1], [2026, 1, 10], { puid: '1', pscope: 'p' }), task('H', [2027, 1, 1], null, { hito: true, puid: '2', pscope: 'p' }), task('H2', [2026, 12, 20], null, { hito: true, puid: '3', pscope: 'p' })];
    const r = SI.compare(A, B), s = r.summary;
    eq(s.milestones, { total: 2, changed: 2, delayed: 1, advanced: 1, unchanged: 0, added: 0, removed: 0, incomparable: 0 }, 'conteo de hitos');
    eq(s.maxMilestoneShift.name, 'H', 'mayor desplazamiento de hito'); eq(s.maxMilestoneShift.deltaFinishDays, 31, 'valor del mayor desplazamiento');
    eq(s.counts.unchanged, 1, 'una sin cambio'); eq(s.finishDeltaDays, 0, 'fin de proyecto igual (2027-01-01 en A y B)');
}

console.log(fail ? `\n${fail} fallo(s), ${ok} correctas` : `\nTodas correctas (${ok})`);
process.exit(fail ? 1 : 0);
