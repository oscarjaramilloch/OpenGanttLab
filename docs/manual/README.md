# Manual de OpenGanttLab

Documentación de producto con capturas reales, diagramas, búsqueda y navegación por capítulos. Se abre con `index.html` (sin servidor, sin conexión).

## Estructura

```text
docs/manual/
├─ index.html            ← GENERADO (no editar a mano)
├─ assets/               manual.css (sistema visual) · manual.js (navegación, búsqueda, zoom, tema)
├─ content/              un archivo por capítulo (01-introduccion.html … 14-problemas.html)
├─ images/
│  ├─ screenshots/       capturas reales de la aplicación (fig-NN-slug.webp)
│  ├─ annotated/         capturas con recuadros numerados (fig-NN-slug.webp)
│  ├─ diagrams/          diagramas SVG (diag-NN-slug.svg)
│  └─ flows/             flujos SVG (flow-NN-slug.svg)
├─ figuras.json          número de cada figura (lo escribe build.js)
└─ tools/                demo-data.js · capturar.js · diagramas.js · build.js · figuras.js
```

## Cómo se actualiza

Requisitos: Node.js, Chrome y `puppeteer-core` (`npm i puppeteer-core`; con `NODE_PATH` si se instala fuera de `tools/`).

```bash
cd docs/manual/tools
node capturar.js            # todas las capturas de la aplicación real   (o: node capturar.js 06 35)
node diagramas.js           # diagramas y flujos SVG
node build.js               # ensambla index.html, numera las figuras y comprueba enlaces
```

Las capturas usan un **proyecto de ejemplo inventado** (`tools/demo-data.js`), nunca datos reales. Si cambia la interfaz de `src/OpenGanttLab 3.1.html`, se vuelve a ejecutar `capturar.js` y `build.js`.

## Escribir contenido

Cada capítulo empieza con un comentario JSON (`slug`, `title`, `group`, `lead`) y usa HTML con estos componentes:

| Componente | Ejemplo |
|---|---|
| Recuadro «En este capítulo aprenderás a» | `<learn><ul><li>…</li></ul></learn>` |
| Aviso | `<callout type="tip\|info\|warn\|danger\|result\|note" title="…">…</callout>` |
| Figura | `<fig slug="pantalla-principal" t="Título" legend="a\|b\|c" observe="x\|y">Descripción</fig>` |
| Figuras en cuadrícula | `<figs><fig …/><fig …/></figs>` |
| Pasos | `<ol class="steps"><li><b>Título</b>Texto</li></ol>` |
| Tarjetas | `<cards><card href="#/capitulo" icon="gantt" t="…">…</card></cards>` |
| Nombre de un control | `<ui>Capas</ui>` |

- El atributo `slug` de `<fig>` es el nombre semántico de la imagen (sin el prefijo `fig-NN-`). `build.js` numera las figuras **por orden de aparición** y renombra los archivos.
- `legend` explica las insignias numeradas de una captura anotada; `observe` genera el bloque «Qué observar».
- Enlaces internos: `#/capitulo` o `#/capitulo/ancla` (las anclas salen del `id` de los `<h2>`/`<h3>`).

## Reglas editoriales

- No documentar nada que no exista en la aplicación: se verifica en el código o en una captura.
- Verbos en imperativo formal («Pulse», «Seleccione») y nombres de controles tal como se ven en pantalla.
- Toda captura lleva figura numerada, título y descripción.

## PDF del manual completo

Botón de impresora del manual (imprime todos los capítulos) o, desde la línea de comandos:

```bash
chrome --headless=new --no-pdf-header-footer --virtual-time-budget=20000 \
  --print-to-pdf="C:/ruta/OpenGanttLab_Manual.pdf" "file:///…/docs/manual/index.html?print"
```

Pesa unos 12 MB por las imágenes, por eso no se versiona.
