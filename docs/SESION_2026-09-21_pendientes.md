# OpenGanttLab — Nota de traspaso entre sesiones (2026-09-19 → 2026-09-21)

Archivo vigente: `src/OpenGanttLab 3.1.html` (NO usar `data/OpenGanttLab_compartir.html`).
Regla del proyecto: tras cada commit, `git push origin master:main`. Último commit de la sesión: `1849786`.
Ojo: hay **otra edición en paralelo** sobre el mismo HTML (p. ej. apareció la capa «Dependencias» en el popover de la LdT); antes de editar, leer el estado actual del archivo.

## Pendientes

1. **LdT — flechas de Dependencias que "no se veían"**: con datos de ejemplo funcionan (también con Vista C1, Ruta crítica y Marca Activity). Hipótesis del usuario: con *Marca Activity* activo las tareas marcadas no tienen relación de predecesoras entre sí (las flechas solo se dibujan entre dos tareas visibles). El usuario iba a probar con otro cronograma. Si vuelve a fallar: pedir los pasos exactos.
2. **Comprobar la página nueva en su URL de GitHub Pages** (`https://oscarjaramilloch.github.io/OpenGanttLab/`): solo se probó abriendo `index.html` desde disco. Verificar que la descarga por `fetch` funciona allí.
3. **¿Importar/devolver XML a Microsoft Project?** Hoy la app SOLO lee XML (no hay exportador). Se analizó (sin tocar código) el caso "devolver a Project el mismo archivo importado":
   - Viable con un **parcheo en streaming**: el usuario vuelve a elegir el XML original, se copia por partes cambiando solo lo editado, y se escribe un archivo nuevo con `showSaveFilePicker` (Chrome/Edge). El importador ya conserva `UID` y los `PredecessorLink`; usa `file.stream().getReader()` (~línea 8234).
   - Fácil: `PercentComplete`, nombres, campos personalizados. Medio: predecesoras (ID→UID, tipo y desfase). Difícil: **fechas** (Project recalcula al abrir; hay que usar programación manual o restricciones, y mantener coherentes `Duration`, trabajo restante y asignaciones).
   - No se puede probar sin Microsoft Project: el usuario tendría que abrir cada versión y reportar.
   - Recomendación: empezar solo con avance + predecesoras, con aviso de lo que no se puede devolver. **Falta que el usuario diga qué cambios quiere devolver** (fechas, avance o predecesoras).
4. Carpeta `prueba-mpp/` sin seguimiento (no es de la sesión; no se ha incluido en ningún commit).

## Lo hecho en la sesión (todo en GitHub)

| Commit | Cambio |
|---|---|
| `5145f0a` `7901f98` `825880d` `af5fd95` | Barra del Gantt rediseñada: botón **Capas** con contador (popover con 8 capas), accesos rápidos sincronizados (Avance real, Línea base, Ruta crítica), grupos con divisores, menú **⋯ Más** responsive, íconos nuevos, estado activo solo en el ícono, opciones de Fecha de estado/Ruta crítica como panel lateral sin cerrar Capas |
| `e28ba64` | Misma barra en la **Línea de Tiempo**: Capas con «Contenido» y «Modo de vista»; accesos rápidos Marca Activity, Vista C1, Ruta crítica; «Restablecer capas» solo restablece el contenido |
| `1c3ffc0` | XML: el avance se normaliza a 0–100 (antes 76 → 0.76). Los cargues ya hechos hay que reimportarlos |
| `ad9f223` | LdT «Seleccionar escenarios y tareas» con las mismas opciones que el Gantt (Escenarios/Cat 1/Cat 2 en cascada, Cancelar/Aceptar); estado independiente del Gantt (`PRES_HIDDEN_KEYS`) |
| `374b973` `2b39615` `70d2c6f` | Dependencias: la cadena azul solo se dibuja con el interruptor encendido y apaga el resto de flechas (LdT y Gantt); en el Gantt, cambiar el interruptor reinicia la selección; ir a una tarea desde un aviso enciende el interruptor |
| `68e5732` | LdT: opción **Ubicación** del hito (sobre el eje, por defecto / dentro de una banda C1, con selector de banda); solo en Vista C1 |
| `b827fbe` | LdT Vista C1: el rectángulo con el nombre de Cat 1 se ciñe al texto (`_rapLblEnd`) |
| `869180e` `1849786` | Página de descarga: créditos y **landing completa** (hero, pilares, pestañas de vistas con capturas, características, pasos, FAQ, modo claro/oscuro). Capturas de un proyecto de ejemplo **inventado** en `assets/` |

## Notas técnicas para retomar

- Barra de herramientas: `tbInit(cfg)` (una llamada por barra: `mainRibbon` y `presRibbon`), `syncLayerUI()`, `toggleCapasMenu`, `toggleLayerOptions`. Fuente de verdad de cada capa = su checkbox (`showXxx` / `presShowXxx`); los accesos rápidos solo los reflejan. `toggleDropMenu` mide el botón antes de cerrar paneles.
- Filtro LdT: `openPresFilter`, `presFilterBuildScen`, `presFilterPopulate`, `presFilterCat2Change`, `presFilterCancel/Close`.
- Dependencias: `ganttDrawDeps` (Gantt) y `presDrawDeps` (LdT).
- Hito en banda: `PRES_OPTS[...].miBand`; `_presLayersRaP` acepta `__bandC1`; funciones `presSetMitoLoc`, `presSetMitoBand`, `_pbmSyncMitoLoc`; el arrastre por filas reutiliza el `mousedown` de barras (`data-in-band`).
- Página: `index.html` + `assets/*.webp|svg`. La única línea a actualizar al subir versión es `SOURCE_PATH`. Las capturas se regeneran con `/c/tmp/pptr/shots.js` (fuera del repo; requiere `puppeteer-core` y Chrome).
- Pruebas puppeteer en `/c/tmp/pptr/` (fuera del repo): `toolbar.js`, `gear2.js`, `pf.js`, `dep2.js`, `gdep.js`, `gdep2.js`, `hb.js`, `hb3.js`, `c1w.js`, `av.js`. Ojo: hay otra sesión que también escribe ahí (p. ej. `ldt.js` fue sobrescrito).
- Convenciones del usuario: íconos siempre outline; paneles con secciones expandidas; preferir arrastre directo sobre inputs numéricos; commit + push a `main` cada vez.
