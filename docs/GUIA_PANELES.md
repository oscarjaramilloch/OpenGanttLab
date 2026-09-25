# Guía de estilo de los paneles de propiedades

Todos los paneles que editan un elemento (barra, hito, evento, año, agrupadores, leyenda, conectores, cuadros de texto, formas) se ven y se comportan igual. El modelo es el **panel de la barra** (`#presBarMenu`).

## Piezas comunes (CSS existente)

| Necesidad | Clase / pieza | Notas |
|---|---|---|
| Encabezado de sección | `.pop-label` | 11 px, semibold, atenuado |
| Etiqueta de un control | `.pop-unit` con `min-width:40px` | 10 px |
| Número | `.pop-num` | siempre con su unidad (`px`) en `.pop-unit` |
| Lista desplegable | `.rb-sel` | tamaños de fuente: 7–20 (y Auto donde aplique) |
| Negrita / cursiva / subrayado | `.rb-sm` (`.active` = activo) | orden **K S N**, mismas etiquetas y `title` |
| Alinear | `.pbm-seg` + `.pbm-seg-btn` con **íconos** | tres líneas: izquierda, centro, derecha; en bandas verticales el mismo ícono girado −90° |
| Posición del texto | `.pbm-seg` con los 5 íconos del panel de la barra | |
| Color | recuadro 22×16 (`border:1px solid var(--line)`) + «Auto» / «Restablecer» como `.rb-flat` | selector de color de la app (`#colorPicker`) |
| Interruptor | `label.toggle` + `.tg-track` | no usar casillas para opciones de este tipo |
| Eliminar | `.rb-flat` con ícono de papelera, color `#c0392b` | sin emojis |
| Contenedor | `.rb-menu-panel`, `background:var(--panel)`, ancho 228 px | |

## Orden de las secciones

**Texto · Fuente · Relleno · Borde · Alineación**, separadas por un divisor (`border-top:1px solid var(--grid)`), y después las secciones propias del elemento (trama, fechas, forma, tramo, posición…). Todo elemento editable ofrece como mínimo esas cinco.

## Cómo construir un panel nuevo

En el código hay constructores en JavaScript (`ppSec`, `ppRow`, `ppSel`, `ppSize`, `ppNum`, `ppText`, `ppSwatch`, `ppFlat`, `ppNKS`, `ppAlign`, `ppDiv`, `ppMenu`, `ppPlace`, `PP_AL`). Un panel nuevo debe armarse con ellos y no con estilos en línea. `ppSelectToSeg(id, items)` convierte un `<select>` heredado en una botonera de íconos sin tocar su código.

## Reglas de comportamiento

- Los cambios se aplican al instante (sin botón Aceptar) y son deshacibles con `Ctrl+Z` (`_presSnap()` antes de modificar).
- Un menú que se reconstruye desde un clic propio debe reabrirse con `setTimeout(...,0)`; de lo contrario el cierre global lo interpreta como un clic fuera y lo cierra.
- Estado «activo» con la clase `active`, nunca con colores en línea.

## Auditoría de referencia

La captura de todos los paneles se genera con `docs/manual/tools/capturar.js`. Para revisar la consistencia visual basta abrir cada panel y compararlo con el de la barra.
