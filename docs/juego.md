# Cómo está hecho el juego

## Regla de oro

El juego no intenta ser un diagnóstico real. Cada enfermedad tiene **dos síntomas
reconocibles** que se dibujan en la hoja y una pista corta; la gracia es aprender a
mirar, no memorizar nombres raros.

## Catálogo (`js/specimens.js`)

| Clave | Nombre | Tipo | Qué se dibuja |
|---|---|---|---|
| `roya` | Roya del café | Hongo | Manchas amarillas con polvo anaranjado y motas |
| `mancha_hierro` | Mancha de hierro | Hongo | Círculos con centro gris claro y borde marrón |
| `antracnosis` | Antracnosis | Hongo | Lesiones negras hundidas, grietas y perforaciones |
| `minador` | Minador de la hoja | Plaga | Galerías serpenteantes color papel + parches secos |
| `aranita` | Arañita roja | Plaga | Punteado amarillo, brillo bronceado y telarañas |
| `ojo_gallo` | Ojo de gallo | Hongo | Manchas con anillo oscuro y sombrilla amarilla |
| `nitrogeno` | Deficiencia de nitrógeno | Nutrición | Hoja pálida con nervadura verde |
| `sana` | Hoja sana | Ninguna | Verde uniforme, sin lesiones |

Cada entrada tiene además `pista`, `manejo`, `dato` y `similar`: la lista de
enfermedades que se parecen y que por eso se usan como distractores.

## Generador de hojas

Todo el dibujado es procedural, dentro de un cuadrado:

1. **Silueta**: `halfWidth(u)` define el ancho de la hoja a lo largo de su eje con
   una función suave; el borde lleva dos ondas para que no sea un óvalo perfecto.
2. **Textura**: cientos de motas claras y oscuras con `mulberry32(seed)`, un
   generador pseudoaleatorio reproducible. La misma semilla dibuja la misma hoja.
3. **Nervaduras**: una central y ocho secundarias por lado.
4. **Síntoma**: cada enfermedad tiene su pintor (`rust`, `ironSpot`,
   `anthracnose`, `leafMiner`, `redMite`, `gallEye`, `nitrogen`, `healthy`).
   Recibe `severity` (0–1) y usa el mismo azar, así que dos hojas de roya nunca
   salen iguales.
5. **Acabado**: brillo, viñeta, sombra y contorno para que parezca una foto de la
   cámara de la cajita.

El escenario (`drawScene`) pinta el fondo de la pantalla, la hoja centrada y una
viñeta. El canvas se redimensiona al tamaño real del contenedor con
`devicePixelRatio`, por eso se ve nítido en celular y en monitor.

## Flujo del juego (`js/game.js`)

```
menú ──► jugar ──(responder)──► análisis ──(siguiente)──► jugar
  ▲         │                        │
  │         └── Esc ► pausa ─────────┘
  │
  └──── fin de partida ◄── sin vidas / muestras completadas
```

- `state` guarda modo, ronda, puntaje, vidas, racha y la muestra actual.
- Una bolsa barajada evita que salga la misma enfermedad dos veces seguidas.
- Las 4 opciones se arman con `buildOptions`: la correcta + 3 similares, barajadas.
- Puntaje: `(100 + tiempo restante × 4 + racha × 20) × multiplicador del modo`.
- La pista descarta una opción equivocada y en modo Campo cuesta 40 pts.
- Los récords por modo se guardan en `localStorage` con la clave `cafescan:best:...`.

## Interfaz

- `js/ui.js` centraliza pantalla, LEDs, cámara y avisos: el juego solo pide
  `UI.showPanel('play')`, `UI.leds([1,1,0,0,0])` o `UI.scanningLeds()`.
- Los LEDs de la carcasa y los del encabezado comparten estado.
- El botón **ACERCAR** hace el barrido verde y aplica un zoom; el texto del
  `vf-readout` muestra un hallazgo inventado pero coherente ("3 galerías · 12 mm").
- `js/sfx.js` sintetiza los sonidos con osciladores y ruido: no hay archivos de audio.

## Detalles que se probaron

- 480 renders del generador sin valores `NaN` ni `Infinity`.
- Las opciones siempre son 4, sin repetir y con la correcta incluida.
- Recorrido completo en navegador headless: menú → juego → escaneo → pista →
  respuesta → análisis → pausa → tutorial → fin de partida → récord guardado.
- Vistas revisadas a 1440×900, 1280×720 y 390×844 (móvil).

## Ideas para después

- Modo "lote": varias hojas seguidas y un resumen de incidencia.
- Fichas de enfermedad desbloqueables al acertar tres veces.
- Traer hojas reales: subir una foto y compararla con la guía de síntomas.
