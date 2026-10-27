/* Capa de interfaz: pantalla, LEDs, cámara y avisos. */
const UI = (() => {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const els = {
    consoleMode: $('#console-mode'),
    screenMode: $('#screen-mode'),
    lives: $('#screen-lives'),
    timer: $('#screen-timer'),
    footLeft: $('#screen-foot-left'),
    footRight: $('#screen-foot-right'),
    leds: $$('#led-strip .led'),
    miniLeds: $$('.mini-led'),
    camera: $('.camera'),
    screen: $('#screen'),
    viewfinder: $('.viewfinder'),
    flash: $('#scan-flash'),
    readout: $('#vf-readout'),
    hint: $('#vf-hint'),
    id: $('#vf-id'),
    zoom: $('#vf-zoom'),
    batt: $('#batt-fill'),
    battLabel: $('#hud-batt'),
    clock: $('#hud-clock'),
    toast: $('#toast'),
    audioBtn: $('#btn-audio'),
    console: $('#console')
  };

  const PANEL_MODE = {
    menu: 'MENÚ',
    play: 'CAMPO',
    reveal: 'ANÁLISIS',
    tutorial: 'AYUDA',
    over: 'RESULTADO',
    pause: 'PAUSA'
  };

  let toastTimer = null;
  let ledTimer = null;

  function showPanel(name) {
    $$('.panel').forEach(p => p.classList.remove('is-active'));
    const panel = document.getElementById('panel-' + name);
    if (panel) panel.classList.add('is-active');
    const label = PANEL_MODE[name] || name.toUpperCase();
    if (els.screenMode) els.screenMode.textContent = label;
    if (els.consoleMode) els.consoleMode.textContent = 'MODO · ' + label;
    document.body.dataset.panel = name;
  }

  function setScreenMode(text) {
    if (els.screenMode) els.screenMode.textContent = text;
  }

  function setConsoleMode(text) {
    if (els.consoleMode) els.consoleMode.textContent = 'MODO · ' + text;
  }

  function setFoot(left, right) {
    if (left != null && els.footLeft) els.footLeft.textContent = left;
    if (right != null && els.footRight) els.footRight.textContent = right;
  }

  /* LEDs: 0 apagado, 1 verde, 2 ámbar, 3 rojo; 4 = verde parpadeando */
  function leds(pattern) {
    clearInterval(ledTimer);
    const apply = () => {
      pattern.forEach((state, i) => {
        const led = els.leds[i];
        const mini = els.miniLeds[i];
        [led, mini].forEach(el => {
          if (!el) return;
          el.classList.remove('on', 'amber', 'red');
          if (state === 1) el.classList.add('on');
          else if (state === 2) el.classList.add('on', 'amber');
          else if (state === 3) el.classList.add('on', 'red');
        });
      });
    };
    apply();
    if (pattern.includes(4)) {
      let phase = false;
      ledTimer = setInterval(() => {
        phase = !phase;
        els.leds.forEach((led, i) => {
          if (pattern[i] === 4) {
            led.classList.toggle('on', phase);
            if (els.miniLeds[i]) els.miniLeds[i].classList.toggle('on', phase);
          }
        });
      }, 420);
    }
  }

  function scanningLeds() {
    clearInterval(ledTimer);
    let n = 0;
    const step = () => {
      els.leds.forEach((led, i) => {
        const active = i <= n;
        led.classList.toggle('on', active);
        led.classList.remove('amber', 'red');
        if (els.miniLeds[i]) els.miniLeds[i].classList.toggle('on', active);
      });
      n = (n + 1) % 6;
    };
    step();
    ledTimer = setInterval(step, 140);
    return () => {
      clearInterval(ledTimer);
      leds([1, 1, 1, 1, 1]);
    };
  }

  function toast(text, ms) {
    if (!els.toast) return;
    els.toast.textContent = text;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), ms || 2400);
  }

  function setLives(n, max) {
    if (!els.lives) return;
    const total = max || 3;
    let html = '';
    for (let i = 0; i < total; i++) {
      html += i < n ? '♥' : '<span class="dead">♥</span>';
    }
    els.lives.innerHTML = n < 0 ? '' : html;
  }

  function setTimer(value) {
    if (!els.timer) return;
    if (value == null) {
      els.timer.textContent = '--';
      els.timer.classList.remove('is-low');
      return;
    }
    const s = Math.max(0, Math.ceil(value));
    const mm = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    els.timer.textContent = mm + ':' + ss;
    els.timer.classList.toggle('is-low', s <= 10);
  }

  function setCamera(live) {
    if (els.camera) els.camera.classList.toggle('is-live', !!live);
    if (els.viewfinder) els.viewfinder.classList.toggle('is-cold', !live);
  }

  function setZoom(on) {
    if (els.viewfinder) els.viewfinder.classList.toggle('is-zoomed', !!on);
    if (els.zoom) els.zoom.textContent = on ? '1.8×' : '1.0×';
  }

  function setScanning(on) {
    if (els.viewfinder) els.viewfinder.classList.toggle('is-scanning', !!on);
  }

  function flash() {
    if (!els.flash) return;
    els.flash.classList.remove('fire');
    void els.flash.offsetWidth;
    els.flash.classList.add('fire');
  }

  function setHint(text) {
    if (els.hint) els.hint.textContent = text;
  }

  function setId(text) {
    if (els.id) els.id.textContent = text;
  }

  let readoutTimer = null;
  function readout(text, ms) {
    if (!els.readout) return;
    if (!text) {
      els.readout.classList.remove('show');
      return;
    }
    els.readout.textContent = text;
    els.readout.classList.add('show');
    clearTimeout(readoutTimer);
    if (ms !== 0) {
      readoutTimer = setTimeout(() => els.readout.classList.remove('show'), ms || 2600);
    }
  }

  function setAudioButton() {
    if (!els.audioBtn) return;
    const muted = SFX.isMuted();
    els.audioBtn.classList.toggle('is-off', muted);
    els.audioBtn.setAttribute('aria-pressed', String(!muted));
    els.audioBtn.title = muted ? 'Activar sonido (M)' : 'Silenciar (M)';
  }

  function refreshAudioButton() {
    setAudioButton();
    toast(SFX.isMuted() ? 'Sonido apagado' : 'Sonido encendido', 1500);
  }

  /* reloj y batería decorativos */
  function tickClock() {
    if (!els.clock) return;
    const d = new Date();
    els.clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function setBattery(pct) {
    if (els.batt) els.batt.style.width = Math.max(3, Math.min(100, pct)) + '%';
    if (els.battLabel) els.battLabel.textContent = Math.round(pct) + '%';
  }

  let battery = 96;
  function startPeripherals() {
    tickClock();
    setInterval(tickClock, 15000);
    setBattery(battery);
    setInterval(() => {
      battery = Math.max(18, battery - 1);
      setBattery(battery);
    }, 90000);
    setAudioButton();
    leds([1, 1, 1, 1, 1]);
  }

  function boot() {
    // secuencia de encendido
    [0, 1, 2, 3, 4].forEach((i, k) => {
      setTimeout(() => {
        const led = els.leds[i];
        const mini = els.miniLeds[i];
        if (led) led.classList.add('on');
        if (mini) mini.classList.add('on');
      }, 90 * k + 120);
    });
    setTimeout(() => { leds([1, 1, 1, 1, 1]); SFX.play('boot'); }, 700);
    startPeripherals();
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el).catch(() => toast('Tu navegador no dejó entrar en pantalla completa'));
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  return {
    els, showPanel, setScreenMode, setConsoleMode, setFoot, leds, scanningLeds, toast,
    setLives, setTimer, setCamera, setZoom, setScanning, flash,
    setHint, setId, readout, setAudioButton, refreshAudioButton,
    boot, toggleFullscreen, setBattery
  };
})();
