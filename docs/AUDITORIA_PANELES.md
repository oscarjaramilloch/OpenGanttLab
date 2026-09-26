# Auditoría de los paneles de propiedades

Medida automática con `docs/manual/tools`-style (Chrome + demo-data): se abre cada panel, se leen los estilos reales (tamaño de letra, ancho, tipo de encabezado, control de alinear, botones N K S, restablecer y eliminar) y se compara con el **panel de la barra**, que es la referencia.

Criterios (la referencia cumple todos): ancho 228 px · etiquetas 10 px · encabezados 11 px semi-negrita y colapsables · alinear con íconos · N K S como cápsulas · «Restablecer» con ícono · «Eliminar» con papelera · sin emojis.

## Resultado

| Panel | Antes | Después |
|---|---|---|
| Tarea (panel de la barra) — REFERENCIA | encabezados 11/12 | conforme |
| Hito | encabezados 11/12 | conforme |
| Evento | encabezados 11/12 | conforme |
| Año | encabezados sin secciones colapsables | conforme |
| Cuadro de texto (LdT) | ancho 230; encabezados sin secciones colapsables; emojis 1 | conforme |
| Forma libre | ancho 210; encabezados sin secciones colapsables | conforme |
| Agrupador vertical | encabezados sin secciones colapsables | conforme |
| Agrupador horizontal | encabezados sin secciones colapsables | conforme |
| Medida de tiempo | encabezados sin secciones colapsables | conforme |
| Conector | encabezados sin secciones colapsables | conforme |
| Leyenda (opciones) | ancho 250 | conforme |
| Agrupador horizontal (opciones) | ancho 244 | conforme |
| Segmentación / divisor de año (opciones) | ancho 200 | conforme |
| Fechas (opciones) | ancho 220 | conforme |

## Medidas después de la normalización

| Panel | Ancho | Etiquetas | Encabezados | Colapsables | Selects | Inputs | Alinear (íconos) | N K S |
|---|---|---|---|---|---|---|---|---|
| Tarea (panel de la barra) — REFERENCIA | 228 | 10 | 11 | 15/17 | 12 | 11 | sí | cápsula |
| Hito | 228 | 10 | 11 | 15/17 | 12 | 11 | sí | cápsula |
| Evento | 228 | 10 | 11 | 15/17 | 12 | 11 | sí | cápsula |
| Año | 228 | 10 | 11 | 6/7 | 12 | 10/11.5 | sí | cápsula |
| Cuadro de texto (LdT) | 228 | 10 | 11 | 2/3 |  |  | sí | cápsula |
| Forma libre | 228 | 10 | 11 | 2/3 | 12 | 10/11.5 | sí | cápsula |
| Agrupador vertical | 228 | 10 | 11 | 5/6 | 12 | 10 | sí | cápsula |
| Agrupador horizontal | 228 | 10 | 11 | 5/6 |  | 10 | sí | cápsula |
| Medida de tiempo | 228 | 10 | 11 | 3/4 | 12 | 10 | sí | — |
| Conector | 228 | 10 | 11 | 3/4 | 12 | 10 | sí | — |
| Leyenda (opciones) | 228 | 10 | 11 | 7/7 | 12 | 10 | sí | cápsula |
| Agrupador horizontal (opciones) | 228 | 10 |  | 0/0 | 12 | 11.5 | sí | — |
| Segmentación / divisor de año (opciones) | 228 | 10 |  | 0/0 | 12 | 11.5 | — | — |
| Fechas (opciones) | 228 |  |  | 0/0 |  |  | — | — |

## Alcance y pendientes

- **Cubierto:** paneles de propiedades y de opciones de la Línea de Tiempo (tarea, hito, evento, año, cuadro de texto, forma, agrupadores vertical y horizontal, conector y medida de tiempo, leyenda, opciones de Capas).
- **Sin auditar todavía:** cuadro de texto del Gantt, ventanas de la Tabla de Datos, Gestión de escenarios, Configuración, Análisis, filtros y diálogos modales. Están fuera de esta pasada.
- Las casillas de verificación («Sin fondo», «Sin borde», «Texto completo») siguen siendo casillas en el cuadro de texto y la forma.
- Los paneles de opciones de Capas (Segmentación, Fechas, Agrupador) no tienen encabezados de sección; comparten ancho, radio y controles pero no el patrón colapsable.

Guía para paneles nuevos: `docs/GUIA_PANELES.md`.
