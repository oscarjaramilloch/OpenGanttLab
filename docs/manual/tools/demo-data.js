/* Datos de ejemplo INVENTADOS para las capturas del manual (no son datos de ninguna empresa).
   Planta industrial ficticia: ingeniería → compras → construcción → puesta en marcha. */
const H = ['id', 'Escenario', 'Categoría 1', 'Categoría 2', 'Nombre de Tarea', 'Start LB', 'End LB', 'Avance %', 'Start R/P', 'End R/P', 'Clase', 'Ruta Crítica', 'Predecesoras'];
const T = (id, c1, c2, n, lb1, lb2, av, rp1, rp2, cl, cr, pr) => [id, '', c1, c2, n, lb1, lb2, av, rp1, rp2, cl || 'Tarea', cr || 'No', pr || ''];

const ROWS = [H,
  T(1, 'Ingeniería', 'Conceptual', 'Ingeniería conceptual', '2026-01-05', '2026-04-30', 100, '2026-01-05', '2026-05-15'),
  T(2, 'Ingeniería', 'Básica', 'Ingeniería básica', '2026-05-01', '2026-09-30', 100, '2026-05-16', '2026-10-20', 'Tarea', 'No', '1'),
  T(3, 'Ingeniería', 'Básica', 'FID — Decisión de inversión', '2026-09-30', '2026-09-30', 100, '2026-10-20', '2026-10-20', 'Hito', 'Si', '2'),
  T(4, 'Ingeniería', 'Detalle', 'Ingeniería de detalle', '2026-10-01', '2027-04-30', 85, '2026-10-21', '2027-06-10', 'Tarea', 'Si', '3'),
  T(5, 'Compras', 'Licitación', 'Especificaciones y licitación', '2026-08-01', '2026-12-15', 100, '2026-09-01', '2027-01-20', 'Tarea', 'No', '2'),
  T(6, 'Compras', 'Licitación', 'Adjudicación de contratos', '2026-12-16', '2027-02-28', 100, '2027-01-21', '2027-04-05', 'Tarea', 'No', '5'),
  T(7, 'Compras', 'Equipos críticos', 'Fabricación de equipos críticos', '2027-03-01', '2027-12-15', 60, '2027-04-06', '2028-02-10', 'Tarea', 'Si', '6'),
  T(8, 'Compras', 'Equipos críticos', 'Entrega en sitio', '2027-12-16', '2028-02-28', 10, '2028-02-11', '2028-04-30', 'Tarea', 'No', '7'),
  T(9, 'Construcción', 'Movilización', 'Movilización de contratistas', '2027-01-15', '2027-03-15', 100, '2027-02-01', '2027-04-15', 'Tarea', 'No', '4'),
  T(10, 'Construcción', 'Obras civiles', 'Obras civiles y cimentaciones', '2027-03-16', '2027-11-30', 70, '2027-04-16', '2028-01-15', 'Tarea', 'Si', '9'),
  T(11, 'Construcción', 'Montaje', 'Montaje electromecánico', '2027-12-01', '2028-06-30', 20, '2028-02-01', '2028-08-15', 'Tarea', 'Si', '10;8'),
  T(12, 'Construcción', 'Montaje', 'Instalaciones auxiliares', '2027-09-01', '2028-03-31', 30, '2027-10-01', '2028-05-15', 'Tarea', 'No', '10'),
  T(13, 'Puesta en marcha', 'Comisionado', 'Precomisionado', '2028-05-01', '2028-08-31', 0, '2028-07-01', '2028-10-15', 'Tarea', 'No', '11'),
  T(14, 'Puesta en marcha', 'Comisionado', 'Comisionado y pruebas', '2028-09-01', '2028-11-30', 0, '2028-10-16', '2029-01-10', 'Tarea', 'Si', '13'),
  T(15, 'Puesta en marcha', 'Comisionado', 'Arranque de la planta', '2028-12-15', '2028-12-15', 0, '2029-02-01', '2029-02-01', 'Hito', 'Si', '14'),
  T(16, 'Compras', 'Licitación', 'Contratos principales adjudicados', '2027-02-28', '2027-02-28', 100, '2027-04-05', '2027-04-05', 'Hito', 'No', '6'),
  T(17, 'Construcción', 'Montaje', 'Inicio de montaje', '2027-12-01', '2027-12-01', 0, '2028-02-01', '2028-02-01', 'Hito', 'Si', '10'),
  T(18, 'Compras', 'Equipos críticos', 'Equipos críticos en sitio', '2028-02-28', '2028-02-28', 0, '2028-04-30', '2028-04-30', 'Hito', 'No', '8'),
  T(19, 'Construcción', 'Montaje', 'Mecánica completa', '2028-06-30', '2028-06-30', 0, '2028-08-15', '2028-08-15', 'Hito', 'Si', '11'),
];

/* XML mínimo con la estructura de un archivo de Project (UID/ID, líneas base y PredecessorLink). */
function demoXml(nombre) {
  const t = [
    [1, 'Ingeniería básica', '2026-05-16', '2026-10-20', 0, []],
    [2, 'FID — Decisión de inversión', '2026-10-20', '2026-10-20', 1, [[1, 1, 0]]],
    [3, 'Ingeniería de detalle', '2026-10-21', '2027-06-10', 0, [[2, 1, 0]]],
    [4, 'Movilización de contratistas', '2027-02-01', '2027-04-15', 0, [[3, 1, 9600]]],
    [5, 'Obras civiles y cimentaciones', '2027-04-16', '2028-01-15', 0, [[4, 1, 0]]],
    [6, 'Montaje electromecánico', '2028-02-01', '2028-08-15', 0, [[5, 1, 0], [4, 3, 0]]],
  ];
  const x = t.map(([id, n, s, f, ms, pl]) => `<Task><UID>${id * 10}</UID><ID>${id}</ID><Name>${n}</Name><Milestone>${ms}</Milestone>` +
    `<Start>${s}T08:00:00</Start><Finish>${f}T17:00:00</Finish><PercentComplete>${id < 3 ? 100 : 40}</PercentComplete>` +
    `<Baseline><Number>0</Number><Start>${s}T08:00:00</Start><Finish>${f}T17:00:00</Finish></Baseline>` +
    pl.map(([u, ty, lag]) => `<PredecessorLink><PredecessorUID>${u * 10}</PredecessorUID><Type>${ty}</Type><LinkLag>${lag}</LinkLag><LagFormat>7</LagFormat></PredecessorLink>`).join('') +
    `</Task>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><Project><Name>${nombre}</Name><Tasks>${x}</Tasks></Project>`;
}

module.exports = { ROWS, demoXml };
