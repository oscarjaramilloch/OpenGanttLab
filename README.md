# OpenGanttLab

**OpenGanttLab — Plataforma abierta para planificación, análisis y visualización de cronogramas**

Herramienta HTML standalone para comparar escenarios de plan de actividades, con Gantt interactivo y Línea de Tiempo ejecutiva exportable (PNG/PDF/PPTX).

## Archivos

- `src/OpenGanttLab 3.1.html` — **versión vigente** (código fuente, un solo HTML). Es la que se descarga desde `index.html` (GitHub Pages).
- `src/OpenGanttLab.html` — versión anterior (v2.x), conservada como referencia.
- `dist/OpenGanttLab_v2.0_RTM.html` — build ofuscada v2.0 para distribución (no incluye las funciones de la serie 3.x).
- `docs/OpenGanttLab_Presentacion_v2.html` — presentación del proyecto.
- `index.html` — página de descarga para GitHub Pages; `SOURCE_PATH` apunta a la versión vigente.
- La **Ayuda** dentro de la aplicación (sección «Ayuda») documenta la interfaz y trae el historial de cambios por versión.

## Novedades recientes (v3.1.1 · 2026-09-18)

- **Project XML grandes:** lectura por partes (streaming) — un XML de 1.7 GB se procesa con memoria acotada; solo se conserva el proyecto, los campos personalizados, las tareas y las líneas base 0–10 (sin asignaciones ni time phasing). Incluye barra de avance y «LB actual» (la de fecha de guardado más reciente).
- **Tabla de Datos:** ventana virtual desde 250 filas, repintado diferido del Gantt, «Avance Real», columnas personalizadas de fecha y deshacer/rehacer/restaurar XML.
- **Gestión de XML:** mapeos personalizados por archivo, duplicar y eliminar escenario, nombre de la carga editable y «Valor fijo» que renombra el escenario.
- **Gantt:** clic derecho en un encabezado para mostrar/ocultar todas las columnas de la Tabla de Datos, ajustar texto por columna y altura de fila automática con barras e hitos de 12 px.

> Nota: la carpeta raíz del proyecto conserva el nombre histórico `Activity Plan` (evita romper accesos directos/rutas externas); el nombre del producto es **OpenGanttLab**.

## Licencia

Este proyecto está licenciado bajo la [GNU General Public License v3.0](LICENSE) — © 2026 Oscar Fernando Jaramillo Chamorro.

Esto significa que cualquiera puede usar, estudiar, modificar y redistribuir este software, pero las versiones modificadas o derivadas que se distribuyan deben también publicarse bajo GPLv3, incluyendo su código fuente.
