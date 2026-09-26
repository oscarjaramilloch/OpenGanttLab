# Guía de estilo de los paneles de propiedades

Todos los paneles que editan un elemento (barra, hito, evento, año, agrupadores, leyenda, conectores, cuadros de texto, formas) se ven y se comportan igual. El modelo es el **panel de la barra** (`#presBarMenu`).

## Piezas comunes (CSS existente)

| Necesidad | Clase / pieza | Notas |
|---|---|---|
| Encabezado de la ventana (nombre) | texto en línea | 12 px, negrita; «· ID n» 12 px normal |
| Título de sección | `.pop-label` (botón o div) | **12 px, semi-negrita**, atenuado, con flecha |
| Etiqueta de acción | `.pop-unit` con `min-width:40px` | **10 px**, normal, **gris** (`--muted`); lo mismo para el texto de los interruptores (`.tg-label`) y de las casillas: todas las etiquetas de acción y subsección comparten color, tamaño y peso |
| Número (grosor, distancia) | `.pop-num` | campo numérico con **flechas arriba/abajo** visibles; unidad `px` en `.pop-unit` |
| Tamaño de fuente | `select.pp-size` → campo numérico con flechas (`ppSelectToSpin`) | el `select` queda oculto como fuente del dato y admite cualquier valor 6–72 |
| Estilo de línea | `select.pp-dash` → lista con muestras (continua, punteada, rayada, mixta) | va en la misma fila que el color |
| Trama | `#pbmPattern` → botón con muestra + paleta | va en la misma fila que el color de fondo |
| Lista con muchas opciones de texto | `.rb-sel` | solo cuando no hay ícono posible (formato, campo, fechas) |
| Negrita / cursiva / subrayado | `.rb-sm` (`.active` = activo) | orden **K S N**, mismas etiquetas y `title` |
| Alinear | `.pbm-seg` + `.pbm-seg-btn` con **íconos** (el activo solo cambia el color de sus líneas, sin fondo) | tres líneas: izquierda, centro, derecha; en bandas verticales el mismo ícono girado −90° |
| Posición del texto | `.pbm-seg` con los 5 íconos del panel de la barra | |
| Color | recuadro 22×16 (`border:1px solid var(--line)`) + «Auto» / «Restablecer» como `.rb-flat` | selector de color de la app (`#colorPicker`) |
| Interruptor | `label.toggle` + `.tg-track` | no usar casillas para opciones de este tipo |
| Eliminar | `.rb-flat` con ícono de papelera, color `#c0392b` | sin emojis |
| Contenedor | `.rb-menu-panel`, `background:var(--panel)`, ancho 228 px | |

## Jerarquía tipográfica

**Solo dos tamaños de texto:** sección y encabezado **12** · etiquetas de acción, subsecciones (p. ej. «Fuente») y el texto de todos los controles **10**. Una regla CSS los impone en los paneles de propiedades y de opciones (`#presBarMenu`, `#presYearMenu`, `.tb-opt-panel`…). Controles de ícono de 24 px de alto.

**Texto:** el nombre solo se muestra al activar el lápiz de la sección (`pbmToggleNombre`).

## Estructura del panel (Panel de Tarea, y todos los demás)

```
Encabezado:  nombre · ID · tipo · restablecer · ocultar
Sección plegable (título + flecha)
   etiqueta —— íconos de acción      (una fila por acción; dos acciones afines pueden compartir fila:
                                      Color + Trama, Color + Estilo, Comienzo + Fin)
```

El **Panel de Tarea** (`#presBarMenu`) también sirve de Panel de Hito y de Evento.

## Orden de las secciones

**Texto · Fuente · Relleno · Borde · Alineación**, separadas por un divisor (`border-top:1px solid var(--grid)`), y después las secciones propias del elemento (trama, fechas, forma, tramo, posición…). Todo elemento editable ofrece como mínimo esas cinco.

## Cómo construir un panel nuevo

En el código hay constructores en JavaScript (`ppSec`, `ppRow`, `ppSel`, `ppSize`, `ppNum`, `ppText`, `ppSwatch`, `ppFlat`, `ppNKS`, `ppAlign`, `ppDiv`, `ppMenu`, `ppPlace`, `PP_AL`). Un panel nuevo debe armarse con ellos y no con estilos en línea. `ppEnhance(panel)` convierte los `select`/`input` marcados (`pp-size`, `pp-stepper`, `pp-dash`) en controles de íconos sin cambiar el código que lee su valor. `ppSelectToSeg(id, items)` convierte un `<select>` heredado en una botonera de íconos sin tocar su código.

## Reglas de comportamiento

- Los cambios se aplican al instante (sin botón Aceptar) y son deshacibles con `Ctrl+Z` (`_presSnap()` antes de modificar).
- Un menú que se reconstruye desde un clic propio debe reabrirse con `setTimeout(...,0)`; de lo contrario el cierre global lo interpreta como un clic fuera y lo cierra.
- Estado «activo» con la clase `active`, nunca con colores en línea.

## Auditoría de referencia

La captura de todos los paneles se genera con `docs/manual/tools/capturar.js`. Para revisar la consistencia visual basta abrir cada panel y compararlo con el de la barra.
