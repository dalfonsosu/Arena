# CaféScan MK-II

**Un juego de navegador para tu cajita con cámara y pantalla LED.**
La cajita se convierte en una lupa fitosanitaria: enfoca una hoja de café, la
acerca, mira los síntomas y decide si es roya, mancha de hierro, antracnosis,
minador, arañita roja, ojo de gallo, falta de nitrógeno… o si la hoja está sana.

Es un juego: la enfermedad y los síntomas son una **simplificación didáctica**,
no un diagnóstico real. Sirve para entrenar el ojo y para darle vida al hardware.

![CaféScan MK-II](assets/icon.svg)

## Jugar

No hay que instalar nada. Abre `index.html` en el navegador:

```bash
# opción 1: abrir el archivo directamente
xdg-open index.html      # o doble clic

# opción 2: servidor local (recomendado para el celular)
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## GitHub Pages

La versión publicada está en **<https://dalfonsosu.github.io/Arena/>**.

El flujo de trabajo [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
publica automáticamente el contenido estático de la raíz cada vez que se integran
cambios en `main`; también se puede ejecutar manualmente desde la pestaña
**Actions**. Todas las rutas de `index.html` son relativas, así que el juego
funciona tanto en la ruta `/Arena/` de GitHub Pages como en un servidor local.
`.nojekyll` evita que Jekyll procese el sitio si posteriormente se cambia a una
publicación basada en una rama.

### Modos

| Modo | Muestras | Vidas | Reloj | Puntaje |
|---|---|---|---|---|
| 🌱 **Práctica** | 10 | — | — | 1× |
| 🎯 **Campo** | 10 | 3 | 25 s | 1× (pista −40) |
| ☕ **Café de oro** | 8 | 2 | 15 s | 2×, sin pistas |

Al terminar una partida completa, cada vida que sobrevive suma **100 pts** de bono
de lote. Los récords quedan guardados en el navegador (`localStorage`).

### Controles

| Acción | Teclado | Botón de la cajita |
|---|---|---|
| Elegir / desplazar | `↑` `↓` `←` `→` | **A** (arriba) / **B** (abajo) |
| Responder | `1`–`4` o `Enter` | **OK** |
| Acercar la cámara (lupa) | `Espacio` | **B** (acercar) |
| Pista | `P` | — |
| Saltar muestra | `S` | — |
| Pausa | `Esc` | — |
| Sonido | `M` | — |
| Pantalla completa | `F` | — |

En el celular todo funciona con toques; los botones físicos de la consola están
en la parte de abajo y son botones reales de HTML.

## Cómo está armado el juego

```
index.html          consola + pantalla + paneles del juego
css/style.css       carcasa, pantalla LCD, LEDs, botones físicos
js/specimens.js     catálogo de síntomas y dibujado procedural de las hojas
js/sfx.js           sonidos generados con WebAudio (sin archivos)
js/ui.js            pantalla, LEDs, cámara, avisos
js/game.js          estados del juego, puntaje, récords, teclado
docs/juego.md       diseño del juego y del generador de hojas
docs/hardware.md    plano de la cajita y cómo conectarla al juego
```

Lo importante: **las hojas no son imágenes**. Cada muestra se dibuja en un
`<canvas>` con una semilla distinta (manchas, polvo naranja, galerías, puntitos,
clorosis…), así que nunca se repite una hoja y no hay que cargar ni un solo PNG.

## La cajita

Funciona en el navegador con o sin hardware. Si quieres que los botones reales
manden en el juego, la página ya escucha este evento:

```js
window.dispatchEvent(new CustomEvent('cafescan:button', { detail: { button: 'ok' } }));
// button: 'up' | 'down' | 'ok' | 'scan'
```

El plano de conexión, los pines y un ejemplo para ESP32-CAM están en
[`docs/hardware.md`](docs/hardware.md).

## Aviso

Juego educativo. Las enfermedades, los síntomas y el manejo están simplificados
para que se entiendan en una pantalla de 4,5″. Para decidir un tratamiento en un
lote real, llama a tu técnico o al comité de cafeteros: eso lo dice el propio
juego en cada pantalla.

Hecho con HTML, CSS y JavaScript sin dependencias.
