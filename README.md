# OpenGanttLab

**OpenGanttLab — Plataforma abierta para planificación, análisis y visualización de cronogramas**

Aplicación web HTML standalone para comparar escenarios de plan de actividades, con Gantt interactivo y Línea de Tiempo ejecutiva exportable (PNG/PDF/PPTX).

## Archivos

- `src/OpenGanttLab 3.1.html` — **versión vigente** (código fuente, un solo HTML). Es la que se descarga desde `index.html` (GitHub Pages).
- `src/OpenGanttLab.html` — versión anterior (v2.x), conservada como referencia.
- `dist/OpenGanttLab_v2.0_RTM.html` — build ofuscada v2.0 para distribución (no incluye las funciones de la serie 3.x).
- `docs/OpenGanttLab_Presentacion_v2.html` — presentación del proyecto.
- `docs/manual/` — **manual de usuario** con capturas reales, diagramas, búsqueda y navegación por capítulos (abrir `docs/manual/index.html`). Se regenera con `docs/manual/tools/` (ver `docs/manual/README.md`).
- `index.html` — página de descarga para GitHub Pages; `SOURCE_PATH` apunta a la versión vigente.
- La **Ayuda** dentro de la aplicación (sección «Ayuda») documenta la interfaz y trae el historial de cambios por versión.

## Novedades recientes (v3.2.0 · 2026-09-25)

- **Línea de Tiempo:** Agrupador vertical y **horizontal** (subprocesos sobre los años), borde configurable por clic derecho, tramos en la franja de años, forma y texto adicional en los hitos, leyenda configurable e imágenes/íconos.
- **Timeline Delta:** compara los hitos de dos escenarios con su desviación en días. **Vista Hitos** muestra los días desplazados entre escenarios.
- **Conectores y medidas de tiempo:** une dos elementos visibles (recta, escuadra, L) o mide el tiempo entre dos fechas; Impacto ahora dibuja la medición.
- **Análisis de escenarios**, Guardar sesión/Compartir, XML modificado y fechas dd/mm/aaaa en la Tabla de Datos. Detalle completo en Ayuda → Historial y en el manual (`docs/manual`).

### v3.1.2 · 2026-09-19

- **Dependencias en el Gantt:** predecesoras y sucesoras en el formato de Project (`12FC+2 días;15CC`), desde el XML o desde el Excel (columnas «Predecesoras» / «Sucesoras»). Interruptor «Dependencias» con flechas FC/CC/FF/CF, resaltado de la cadena al hacer clic en una barra y avisos de conflictos de fechas, predecesoras inexistentes y ciclos.
- **Ayuda:** nuevo Manual de usuario (pestañas Manual / Referencia / Historial); el PDF descargable es el manual.

### v3.1.1 · 2026-09-18

- **Project XML grandes:** lectura por partes (streaming) — un XML de 1.7 GB se procesa con memoria acotada; solo se conserva el proyecto, los campos personalizados, las tareas y las líneas base 0–10 (sin asignaciones ni time phasing). Incluye barra de avance y «LB actual» (la de fecha de guardado más reciente).
- **Tabla de Datos:** ventana virtual desde 250 filas, repintado diferido del Gantt, «Avance Real», columnas personalizadas de fecha y deshacer/rehacer/restaurar XML.
- **Gestión de XML:** mapeos personalizados por archivo, duplicar y eliminar escenario, nombre de la carga editable y «Valor fijo» que renombra el escenario.
- **Gantt:** clic derecho en un encabezado para mostrar/ocultar todas las columnas de la Tabla de Datos, ajustar texto por columna y altura de fila automática con barras e hitos de 12 px.

> Nota: la carpeta raíz del proyecto conserva el nombre histórico `Activity Plan` (evita romper accesos directos/rutas externas); el nombre del producto es **OpenGanttLab**.

## Licencia

Este proyecto está licenciado bajo la [GNU General Public License v3.0](LICENSE) — © 2026 Oscar Fernando Jaramillo Chamorro.

Esto significa que cualquiera puede usar, estudiar, modificar y redistribuir este software, pero las versiones modificadas o derivadas que se distribuyan deben también publicarse bajo GPLv3, incluyendo su código fuente.
