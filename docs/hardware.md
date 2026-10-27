# La cajita: ESP32-CAM + pantalla LED

El juego está pensado para tu cajita. No necesita hardware para funcionar: el
navegador simula la óptica. Pero si quieres que la cajita real mande los botones,
aquí está el plano y el puente mínimo.

## Materiales

| Pieza | Notas |
|---|---|
| ESP32-CAM (AI-Thinker) | cámara OV2640, 2 MB PSRAM recomendable |
| Pantalla TFT 1.8″ ST7735 o 2.4″ ILI9341 | SPI, 128×160 o 240×320 |
| 3 pulsadores | A, B y OK |
| 5 LEDs | verde/ámbar/rojo o RGB, con resistencias de 220 Ω |
| Fuente 5 V 1 A | la cámara consume picos altos |

## Conexión sugerida

| Señal | GPIO | Comentario |
|---|---|---|
| Botón A (arriba) | 12 | `INPUT_PULLUP`, a GND |
| Botón B (abajo / acercar) | 13 | `INPUT_PULLUP`, a GND |
| Botón OK | 14 | `INPUT_PULLUP`, a GND |
| LED 1–5 | 25, 26, 27, 32, 33 | ánodo por resistencia a GND |
| TFT SCK | 18 | SPI |
| TFT MOSI | 23 | SPI |
| TFT CS | 5 | libre en AI-Thinker si no usas SD |
| TFT DC | 2 | |
| TFT RST | 4 | |
| TFT BL | 15 | retroiluminación |

> En la placa AI-Thinker varios GPIO del bus de la cámara están ocupados
> (36, 39, 34, 35, 19, 21, 22, 26, 27). Si usas una pantalla SPI con
> `MOSI=23` y `SCK=18` vas bien, pero **no uses 26 ni 27 para LEDs** en esa
> placa: están tomados por la cámara. Usa 25, 32, 33, 16 y 17 (los dos últimos
> solo si no usas PSRAM), o un expandidor I²C.

## Los cinco LEDs del juego

| Patrón que ves | Qué significa |
|---|---|
| 5 verdes fijos | sistema listo / respuesta correcta |
| barrido 1→5 | escaneando |
| 1–2 verdes | muestra en curso |
| 5 ámbar | pausa o menú de ayuda |
| 3 rojos | respuesta incorrecta o tiempo agotado |

## Puente con el juego

El juego escucha un evento del navegador. Cualquier cosa que pueda ejecutar
JavaScript puede "apretar" los botones:

```js
// button: 'up' | 'down' | 'ok' | 'scan'
window.dispatchEvent(new CustomEvent('cafescan:button', { detail: { button: 'ok' } }));
```

Tres caminos, de menos a más trabajo:

1. **Teclado / mando USB.** Con un ESP32-S3 (o un Pico) la cajita puede
   presentarse como teclado y mandar `↑`, `↓`, `1`–`4`, `Espacio` y `Enter`.
   El juego ya funciona con esas teclas, sin tocar una línea.
2. **WebSocket.** La cajita abre un socket con el navegador y emite
   `{"button":"ok"}`; en la página basta:

   ```js
   const ws = new WebSocket('ws://192.168.1.42:81/');
   ws.onmessage = e => {
     const { button } = JSON.parse(e.data);
     window.dispatchEvent(new CustomEvent('cafescan:button', { detail: { button } }));
   };
   ```

3. **Botones en pantalla.** Si la cajita corre la pantalla TFT con un navegador
   embebido (o si juegas desde el celular), los botones HTML de la consola ya
   hacen todo.

## Ejemplo mínimo para ESP32 (referencia)

Lee los tres botones con antirrebote y manda teclas por USB HID (ESP32-S3):

```cpp
#include <USBHIDKeyboard.h>
USBHIDKeyboard teclado;

struct Boton { int pin; uint8_t tecla; bool previo = HIGH; unsigned long t = 0; };
Boton botones[] = {
  { 12, KEY_UP_ARROW },   // A
  { 13, KEY_DOWN_ARROW }, // B
  { 14, KEY_RETURN }      // OK
};

void setup() {
  for (auto &b : botones) pinMode(b.pin, INPUT_PULLUP);
  teclado.begin();
}

void loop() {
  for (auto &b : botones) {
    bool ahora = digitalRead(b.pin);
    if (ahora == LOW && b.previo == HIGH && millis() - b.t > 40) {
      teclado.write(b.tecla);
      teclado.releaseAll();
      b.t = millis();
    }
    b.previo = ahora;
  }
}
```

Con eso, la cajita se comporta como un teclado: `↑`/`↓` para moverse, `Enter`
para confirmar y `Espacio` para acercar la cámara. Si prefieres no pelear con
HID, usa `Serial.println("BTN:OK")` y un pequeño script en el computador que
convierta cada línea en el evento `cafescan:button`.

## Pantalla

El juego está dibujado para una pantalla de 4:3 a 6:5. Si tu TFT es 128×160,
gira el navegador a vertical y usa la vista móvil: los paneles se reacomodan
solos. Para el montaje, deja la cámara arriba centrada y los LEDs en la columna
izquierda, como en la consola de la página.
