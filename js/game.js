/* ===================================================================
   CaféScan MK-II — lógica del juego
   =================================================================== */
(() => {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const D = Specimens.DISEASES;

  const ICONS = {
    practica: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-8 6-14 14-14-1 8-7 13-14 14Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 19c3-4.5 6.5-7 11-9" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>',
    campo: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3.4M12 18.6V22M2 12h3.4M18.6 12H22" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    oro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h11v5.5A4.5 4.5 0 0 1 11.5 18h-2A4.5 4.5 0 0 1 5 13.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 9.5h2.2a2.3 2.3 0 0 1 0 4.6H16" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 21h13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M8.4 3.2c-.8.9-.8 1.8 0 2.7M11.6 3.2c-.8.9-.8 1.8 0 2.7" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>'
  };

  const MODES = [
    {
      key: 'practica',
      icon: ICONS.practica,
      name: 'Práctica',
      desc: '10 muestras, sin reloj ni vidas. Aprende sin castigo.',
      rounds: 10,
      lives: null,
      time: null,
      multiplier: 1,
      hintCost: 0,
      hints: true
    },
    {
      key: 'campo',
      icon: ICONS.campo,
      name: 'Campo',
      desc: '10 muestras, 3 vidas y 25 s por hoja. La pista cuesta 40 pts.',
      rounds: 10,
      lives: 3,
      time: 25,
      multiplier: 1,
      hintCost: 40,
      hints: true
    },
    {
      key: 'oro',
      icon: ICONS.oro,
      name: 'Café de oro',
      desc: '8 muestras, 2 vidas y 15 s. Sin pistas y puntaje ×2.',
      rounds: 8,
      lives: 2,
      time: 15,
      multiplier: 2,
      hintCost: 0,
      hints: false
    }
  ];

  const SCAN_FINDINGS = {
    roya: '14 cúmulos anaranjados · envés',
    mancha_hierro: '6 manchas circulares · ~4 mm',
    antracnosis: '3 lesiones hundidas · grietas',
    minador: '3 galerías · 12 mm de largo',
    aranita: '~680 punturas · brillo bronce',
    ojo_gallo: '5 manchas con anillo · 2 sombrillas',
    nitrogeno: 'clorosis 62% · nervadura verde',
    sana: '0 lesiones · cutícula intacta'
  };

  const state = {
    mode: null,
    panel: 'menu',
    menuIndex: 0,
    optionFocus: 0,
    round: 0,
    score: 0,
    lives: 3,
    maxLives: 3,
    correct: 0,
    attempts: 0,
    streak: 0,
    bestStreak: 0,
    hintsUsed: 0,
    scans: 0,
    specimen: null,
    options: [],
    answered: false,
    busy: false,
    timeLeft: 0,
    deadline: 0,
    timerId: null,
    missed: [],
    lastResult: null,
    pausedFrom: null,
    tutorialReturn: 'menu',
    roundLimit: 10,
    completionBonus: 0,
    bestAtStart: 0,
    bag: []
  };

  const storage = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('cafescan:' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('cafescan:' + key, JSON.stringify(value)); } catch (e) { /* nada */ }
    }
  };

  const bestOf = modeKey => Number(storage.get('best:' + modeKey, 0)) || 0;
  const modeByKey = key => MODES.find(m => m.key === key);

  /* ---------------------------------------------------------------- *
   * Dibujado
   * ---------------------------------------------------------------- */
  const cam = $('#cam');
  const thumb = $('#thumb');

  function fitCanvas(canvas, fallbackW, fallbackH) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: 0, height: 0 };
    const w = Math.round((rect.width || fallbackW) * dpr);
    const h = Math.round((rect.height || fallbackH) * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = Math.max(2, w);
      canvas.height = Math.max(2, h);
    }
  }

  function render(canvas, spec, fallbackW, fallbackH) {
    if (!canvas || !spec) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    fitCanvas(canvas, fallbackW || 760, fallbackH || 560);
    Specimens.drawScene(ctx, canvas.width, canvas.height, spec);
  }

  /* ---------------------------------------------------------------- *
   * Menú
   * ---------------------------------------------------------------- */
  function renderMenu() {
    const host = $('#modes');
    if (!host) return;
    host.innerHTML = MODES.map((m, i) => {
      const best = bestOf(m.key);
      return `
        <button class="mode" type="button" role="listitem" data-mode="${m.key}" data-index="${i}">
          <span class="mode-ico" aria-hidden="true">${m.icon}</span>
          <span class="mode-txt"><b>${m.name}</b><span>${m.desc}</span></span>
          <span class="mode-best">récord<b>${best || '—'}</b></span>
        </button>`;
    }).join('');
    host.querySelectorAll('.mode').forEach(btn => {
      btn.addEventListener('click', () => {
        state.menuIndex = Number(btn.dataset.index);
        paintMenuFocus();
        SFX.play('confirm');
        startGame(btn.dataset.mode);
      });
      btn.addEventListener('mouseenter', () => {
        state.menuIndex = Number(btn.dataset.index);
        paintMenuFocus();
      });
    });
    paintMenuFocus();
    renderGuide();
    const bestGlobal = Math.max(...MODES.map(m => bestOf(m.key)), 0);
    const rec = $('#record-line');
    if (rec) rec.textContent = bestGlobal ? `Récord de la cajita: ${bestGlobal} pts` : 'Aún no hay récord: estrena la cajita';
  }

  function renderGuide() {
    const html = '<span class="guide-label">Guía rápida · qué buscar en la hoja</span>' +
      D.map(d => `<span class="gchip" title="${d.name} · ${d.type}"><i style="--c:${d.tone}"></i>${d.short}</span>`).join('');
    ['#guide-menu', '#guide-reveal'].forEach(sel => {
      const host = $(sel);
      if (host) host.innerHTML = html;
    });
  }

  function paintMenuFocus() {
    $$('#modes .mode').forEach((el, i) => {
      el.classList.toggle('is-focus', i === state.menuIndex);
      el.setAttribute('aria-selected', i === state.menuIndex ? 'true' : 'false');
    });
  }

  function moveMenu(dir) {
    const n = MODES.length;
    state.menuIndex = (state.menuIndex + dir + n) % n;
    paintMenuFocus();
    SFX.play('move');
  }

  function enterMenu() {
    state.panel = 'menu';
    state.answered = false;
    stopTimer();
    UI.showPanel('menu');
    UI.setLives(-1);
    UI.setTimer(null);
    UI.setCamera(false);
    UI.setZoom(false);
    UI.setScanning(false);
    UI.setId('----');
    UI.setHint('SISTEMA EN ESPERA · ELIGE UN MODO');
    UI.readout('');
    UI.leds([1, 1, 1, 1, 1]);
    UI.setFoot('◂ SISTEMA LISTO', 'SIMULACIÓN · NO REEMPLAZA UN TÉCNICO');
    renderMenu();
  }

  /* ---------------------------------------------------------------- *
   * Partida
   * ---------------------------------------------------------------- */
  function resetRun(mode) {
    state.mode = mode;
    state.round = 0;
    state.score = 0;
    state.lives = mode.lives == null ? 0 : mode.lives;
    state.maxLives = mode.lives == null ? 0 : mode.lives;
    state.correct = 0;
    state.attempts = 0;
    state.streak = 0;
    state.bestStreak = 0;
    state.hintsUsed = 0;
    state.scans = 0;
    state.missed = [];
    state.roundLimit = mode.rounds;
    state.completionBonus = 0;
    state.bestAtStart = bestOf(mode.key);
    state.bag = [];
    state.answered = false;
    state.busy = false;
    state.optionFocus = 0;
  }

  function fillBag() {
    const keys = Specimens.shuffle(D.map(d => d.key));
    state.bag = state.bag.concat(keys);
  }

  function drawDisease() {
    if (state.bag.length === 0) fillBag();
    let key = state.bag.shift();
    if (state.lastKey === key && state.bag.length) {
      state.bag.push(key);
      key = state.bag.shift();
    }
    state.lastKey = key;
    return key;
  }

  function startGame(modeKey) {
    const mode = modeByKey(modeKey) || MODES[1];
    resetRun(mode);
    state.panel = 'play';
    UI.showPanel('play');
    UI.setCamera(true);
    UI.setFoot('▸ ' + mode.name.toUpperCase(), 'SIMULACIÓN · NO REEMPLAZA UN TÉCNICO');
    UI.toast(`${mode.name}: ${mode.rounds} muestras. ¡Suerte, caficultor!`, 2400);
    SFX.play('boot');
    nextRound();
  }

  function nextRound() {
    stopTimer();
    if (state.round >= state.roundLimit) {
      gameOver('completado');
      return;
    }
    if (state.mode.lives != null && state.lives <= 0) {
      gameOver('sin-vidas');
      return;
    }

    state.round += 1;
    state.answered = false;
    state.busy = false;
    state.optionFocus = 0;
    state.timeLeft = state.mode.time || 0;

    const key = drawDisease();
    const seed = (Math.random() * 4294967295) >>> 0;
    const minSev = state.mode.key === 'oro' ? 0.55 : 0.72;
    const severity = minSev + Math.random() * 0.38;
    state.specimen = Specimens.makeSpecimen(key, seed, severity);
    state.options = Specimens.buildOptions(key, 4, Specimens.mulberry32(seed ^ 0x9e3779b9));
    state.optionFocus = 0;

    const camWrap = $('.viewfinder');
    if (camWrap) {
      camWrap.classList.remove('is-new');
      void camWrap.offsetWidth;
      camWrap.classList.add('is-new');
    }

    UI.showPanel('play');
    UI.setScreenMode(state.mode.name.toUpperCase());
    UI.setConsoleMode(state.mode.name.toUpperCase());
    requestAnimationFrame(() => render(cam, state.specimen, 760, 560));
    UI.setCamera(true);
    UI.setZoom(false);
    UI.setScanning(false);
    UI.setId('M-' + String(state.round).padStart(3, '0'));
    UI.setHint(state.scans === 0 ? 'PASO 1 · Acerca la cámara (Espacio)' : 'MIRA LA HOJA Y ELIGE');
    setFieldNote('Aún sin escanear. Pulsa ACERCAR para ver el detalle del envés.', false);
    UI.readout('');
    UI.setLives(state.mode.lives == null ? -1 : state.lives, state.maxLives);
    UI.setTimer(state.mode.time ? state.timeLeft : null);
    UI.setFoot(
      `▸ ${state.mode.name.toUpperCase()} · ${state.round}/${state.roundLimit}`,
      state.mode.time ? 'RELOJ ACTIVO' : 'SIN RELOJ · APRENDE TRANQUILO'
    );
    UI.leds([1, 1, 0, 0, 0]);
    buildAnswers();
    updatePlayMeta();

    const hintBtn = $('#btn-hint');
    if (hintBtn) {
      hintBtn.disabled = !state.mode.hints || state.answered;
      hintBtn.innerHTML = state.mode.hints
        ? `Pista <kbd>P</kbd>`
        : `Sin pistas`;
    }
    const skipBtn = $('#btn-skip');
    if (skipBtn) skipBtn.disabled = state.mode.key === 'oro';

    if (state.mode.time) startTimer();
  }

  function buildAnswers() {
    const host = $('#answers');
    if (!host) return;
    host.innerHTML = state.options.map((key, i) => {
      const d = Specimens.BY_KEY[key];
      return `<button class="answer" type="button" data-key="${key}" data-index="${i}">
        <span class="num">${i + 1}</span><span>${d.short}</span></button>`;
    }).join('');
    host.querySelectorAll('.answer').forEach(btn => {
      btn.addEventListener('click', () => answer(btn.dataset.key));
      btn.addEventListener('mouseenter', () => {
        state.optionFocus = Number(btn.dataset.index);
        paintAnswerFocus();
      });
    });
    paintAnswerFocus();
  }

  function paintAnswerFocus() {
    $$('#answers .answer').forEach((el, i) => {
      el.classList.toggle('is-focus', i === state.optionFocus && !state.answered);
    });
  }

  function moveOption(dir) {
    if (state.answered) return;
    const n = state.options.length;
    state.optionFocus = (state.optionFocus + dir + n) % n;
    paintAnswerFocus();
    SFX.play('move');
  }

  function setFieldNote(text, hot) {
    const box = $('#field-note');
    const el = $('#field-note-text');
    if (el) el.textContent = text;
    if (box) box.classList.toggle('is-hot', !!hot);
  }

  function updatePlayMeta() {
    const meta = $('#play-meta');
    if (!meta) return;
    const streak = state.streak > 0 ? ` · racha x${state.streak}` : '';
    meta.textContent = `Muestra ${state.round}/${state.roundLimit} · ${state.score} pts${streak}`;
  }

  /* ---------------------------------------------------------------- *
   * Reloj
   * ---------------------------------------------------------------- */
  function startTimer() {
    if (!state.mode.time) return;
    state.deadline = performance.now() + state.timeLeft * 1000;
    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      const left = Math.max(0, (state.deadline - performance.now()) / 1000);
      state.timeLeft = left;
      UI.setTimer(left);
      if (left <= 0) {
        stopTimer();
        if (!state.answered && state.panel === 'play') timeUp();
      }
    }, 120);
  }

  function stopTimer() {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  function pauseGame() {
    if (state.panel !== 'play' || state.answered) return;
    state.pausedFrom = 'play';
    state.timeLeft = Math.max(0, (state.deadline - performance.now()) / 1000);
    stopTimer();
    state.panel = 'pause';
    UI.showPanel('pause');
    UI.setScanning(false);
    UI.leds([2, 2, 2, 2, 2]);
    SFX.play('click');
  }

  function resumeGame() {
    if (state.panel !== 'pause') return;
    state.panel = 'play';
    UI.showPanel('play');
    UI.leds([1, 1, 0, 0, 0]);
    if (state.mode.time && !state.answered) startTimer();
    SFX.play('click');
  }

  /* ---------------------------------------------------------------- *
   * Acciones de la cámara
   * ---------------------------------------------------------------- */
  function doScan() {
    if (state.panel !== 'play' || state.answered || state.busy) return;
    state.busy = true;
    state.scans += 1;
    UI.setScanning(true);
    SFX.play('scan');
    const stopLeds = UI.scanningLeds();
    UI.readout('ENFOCANDO · AJUSTANDO LUZ…', 0);

    setTimeout(() => {
      stopLeds();
      UI.setScanning(false);
      UI.setZoom(true);
      UI.flash();
      SFX.play('shutter');
      const finding = SCAN_FINDINGS[state.specimen.key] || 'Muestra ampliada';
      UI.readout('▸ ' + finding, 3200);
      setFieldNote(finding + '. Ya puedes diagnosticar.', false);
      const fit = $('#play-meta');
      if (fit) fit.classList.add('pulse');
      setTimeout(() => fit && fit.classList.remove('pulse'), 500);
      state.busy = false;
      UI.leds([1, 1, 1, 0, 0]);
      UI.setHint('PASO 2 · Elige el diagnóstico');
    }, 900);
  }

  function useHint() {
    if (state.panel !== 'play' || state.answered || !state.mode.hints) return;
    const d = Specimens.BY_KEY[state.specimen.key];
    state.hintsUsed += 1;
    SFX.play('hint');

    // descarta una opción equivocada (una por ronda)
    const wrong = $$('#answers .answer').filter(el =>
      el.dataset.key !== state.specimen.key && !el.classList.contains('is-discarded'));
    if (wrong.length > 1) {
      const pick = wrong[Math.floor(Math.random() * wrong.length)];
      pick.classList.add('is-discarded');
      pick.disabled = true;
    }
    UI.readout('PISTA · ' + d.pista, 4200);
    setFieldNote('Pista: ' + d.pista, true);
    UI.setHint('PISTA ACTIVA · ' + d.pista);
    if (state.mode.hintCost) {
      state.score = Math.max(0, state.score - state.mode.hintCost);
      updatePlayMeta();
      UI.toast(`Pista usada: −${state.mode.hintCost} pts`, 1600);
    }
    const hintBtn = $('#btn-hint');
    if (hintBtn) {
      hintBtn.disabled = true;
      hintBtn.innerHTML = 'Pista usada';
    }
    UI.leds([2, 2, 1, 1, 0]);
  }

  function skipSample() {
    if (state.panel !== 'play' || state.answered || state.mode.key === 'oro') return;
    state.answered = true;
    stopTimer();
    state.streak = 0;
    SFX.play('click');
    showReveal({
      outcome: 'skip',
      chosen: null,
      correct: false,
      points: 0,
      timeLeft: state.timeLeft,
      reason: 'Saltaste la muestra'
    });
  }

  /* ---------------------------------------------------------------- *
   * Respuestas y resultado
   * ---------------------------------------------------------------- */
  function answer(key) {
    if (state.panel !== 'play' || state.answered || state.busy) return;
    state.answered = true;
    stopTimer();
    const timeLeft = state.mode.time ? Math.max(0, (state.deadline - performance.now()) / 1000) : 0;
    const isRight = key === state.specimen.key;
    state.attempts += 1;
    state.optionFocus = state.options.indexOf(key);

    $$('#answers .answer').forEach(el => {
      el.disabled = true;
      if (el.dataset.key === state.specimen.key) el.classList.add('is-right');
      else if (el.dataset.key === key) el.classList.add('is-wrong');
    });
    paintAnswerFocus();

    let points = 0;
    if (isRight) {
      const timeBonus = state.mode.time ? Math.round(timeLeft * 4) : 0;
      const streakBonus = Math.min(state.streak, 5) * 20;
      points = (100 + timeBonus + streakBonus) * state.mode.multiplier;
      state.score += points;
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      UI.leds([1, 1, 1, 1, 1]);
      SFX.play('correct');
      UI.readout('OK · COINCIDENCIA CONFIRMADA', 1800);
    } else {
      state.streak = 0;
      state.missed.push(state.specimen.key);
      if (state.mode.lives != null) state.lives -= 1;
      UI.setLives(state.mode.lives == null ? -1 : state.lives, state.maxLives);
      UI.leds([3, 3, 0, 0, 0]);
      SFX.play('wrong');
      if (state.mode.lives != null) setTimeout(() => SFX.play('heart'), 260);
      UI.readout('X · NO COINCIDE · ' + Specimens.BY_KEY[state.specimen.key].short.toUpperCase(), 2200);
    }
    updatePlayMeta();
    setTimeout(() => {
      if (state.panel !== 'play') return;
      showReveal({
        outcome: isRight ? 'right' : 'wrong',
        chosen: key,
        correct: isRight,
        points,
        timeLeft,
        reason: isRight ? 'Buen ojo' : 'La muestra era otra'
      });
    }, 620);
  }

  function timeUp() {
    if (state.answered) return;
    state.answered = true;
    state.streak = 0;
    state.missed.push(state.specimen.key);
    if (state.mode.lives != null) state.lives -= 1;
    UI.setLives(state.mode.lives == null ? -1 : state.lives, state.maxLives);
    UI.setTimer(0);
    UI.leds([3, 3, 0, 0, 0]);
    SFX.play('wrong');
    $$('#answers .answer').forEach(el => {
      el.disabled = true;
      if (el.dataset.key === state.specimen.key) el.classList.add('is-right');
    });
    showReveal({
      outcome: 'timeout',
      chosen: null,
      correct: false,
      points: 0,
      timeLeft: 0,
      reason: 'Se acabó el tiempo'
    });
  }

  function confidenceFor(spec) {
    let h = 0;
    const s = spec.seed + '';
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
    return 84 + (h % 13);
  }

  function showReveal(result) {
    state.lastResult = result;
    state.panel = 'reveal';
    const d = Specimens.BY_KEY[state.specimen.key];
    const ribbon = $('#reveal-ribbon');
    const pointsEl = $('#reveal-points');
    const eyebrow = $('#reveal-eyebrow');
    const tagType = $('#reveal-type');
    const tagConf = $('#reveal-conf');

    UI.showPanel('reveal');
    requestAnimationFrame(() => render(thumb, state.specimen, 460, 460));
    UI.setScanning(false);
    UI.setZoom(false);
    UI.setHint('');
    UI.readout('');

    if (result.outcome === 'right') {
      ribbon.textContent = '¡CORRECTO!';
      ribbon.className = 'ribbon';
    } else if (result.outcome === 'skip') {
      ribbon.textContent = 'SALTADA';
      ribbon.className = 'ribbon is-soft';
    } else {
      ribbon.textContent = result.outcome === 'timeout' ? 'TIEMPO' : 'FALLASTE';
      ribbon.className = 'ribbon is-bad';
    }
    pointsEl.textContent = result.points > 0 ? '+' + result.points : '0';
    pointsEl.className = 'reveal-points' + (result.points > 0 ? '' : ' zero');

    eyebrow.textContent = `MUESTRA M-${String(state.round).padStart(3, '0')} · ${state.mode.name.toUpperCase()}`;
    $('#reveal-name').textContent = d.name;
    tagType.textContent = d.type;
    tagConf.textContent = 'coincidencia ' + confidenceFor(state.specimen) + '%';
    $('#reveal-symptoms').innerHTML = d.symptoms.map(s => `<li>${s}</li>`).join('');
    $('#reveal-cure').textContent = d.manejo;
    let extra = '';
    if (result.outcome === 'wrong' && result.chosen) {
      extra = `Elegiste <b>${Specimens.BY_KEY[result.chosen].short}</b>. `;
    } else if (result.outcome === 'skip') {
      extra = 'No cuenta como error, pero rompe la racha. ';
    } else if (result.outcome === 'timeout') {
      extra = 'El reloj llegó a cero. ';
    } else if (state.mode.lives == null) {
      extra = 'Sin vidas en práctica: sigue observando. ';
    } else if (state.streak > 1) {
      extra = `Racha de ${state.streak}. `;
    }
    const datoEl = $('#reveal-dato');
    datoEl.innerHTML = extra + d.dato;

    const nextBtn = $('#btn-next');
    const lastOne = state.round >= state.roundLimit ||
      (state.mode.lives != null && state.lives <= 0);
    nextBtn.innerHTML = lastOne ? 'Ver resultados <kbd>Enter</kbd>' : 'Siguiente muestra <kbd>Enter</kbd>';

    UI.setFoot('◂ ANÁLISIS COMPLETADO', d.type.toUpperCase() + ' · ' + d.short.toUpperCase());
    UI.leds(result.outcome === 'right' ? [1, 1, 1, 1, 1] : [3, 3, 0, 0, 0]);
    if (result.outcome === 'skip') SFX.play('click');
    if (result.outcome === 'timeout') SFX.play('wrong');

    setTimeout(() => nextBtn && nextBtn.focus({ preventScroll: true }), 60);
  }

  function advance() {
    if (state.panel !== 'reveal') return;
    if (state.round >= state.roundLimit || (state.mode.lives != null && state.lives <= 0)) {
      gameOver('completado');
    } else {
      state.panel = 'play';
      nextRound();
    }
  }

  /* ---------------------------------------------------------------- *
   * Fin de partida
   * ---------------------------------------------------------------- */
  function gameOver(reason) {
    stopTimer();
    state.panel = 'over';
    UI.showPanel('over');
    UI.setScanning(false);
    UI.setZoom(false);
    UI.setTimer(null);
    UI.setCamera(false);
    UI.setHint('');

    let bonus = 0;
    if (reason === 'completado' && state.mode.lives != null && state.lives > 0) {
      bonus = state.lives * 100;
      state.completionBonus = bonus;
      state.score += bonus;
    }
    const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0;
    const best = bestOf(state.mode.key);
    const isRecord = state.score > best;
    if (isRecord) storage.set('best:' + state.mode.key, state.score);

    $('#over-eyebrow').textContent = reason === 'sin-vidas'
      ? 'SIN VIDAS · FIN DEL TURNO'
      : 'MUESTRAS COMPLETADAS';
    let title = 'Buen ojo cafetero';
    if (accuracy >= 90) title = 'Ojo de técnico';
    else if (accuracy >= 70) title = 'Vas muy bien';
    else if (accuracy >= 40) title = 'A seguir practicando';
    else title = 'La cajita pide refuerzo';

    $('#over-title').textContent = title;
    let sub = `${state.correct} de ${state.attempts} hojas bien diagnosticadas.`;
    if (bonus) sub += ` Bono de lote: +${bonus} pts por las vidas que te quedaron.`;
    if (state.missed.length) {
      const uniq = [...new Set(state.missed)].map(k => Specimens.BY_KEY[k].short);
      sub += ' Repasa: ' + uniq.slice(0, 3).join(', ') + (uniq.length > 3 ? '…' : '') + '.';
    }
    $('#over-sub').textContent = sub;
    $('#over-score').textContent = state.score.toLocaleString('es-CO');
    $('#over-correct').textContent = state.correct;
    $('#over-precision').textContent = accuracy + '%';
    $('#over-streak').textContent = state.bestStreak;
    $('#over-rounds').textContent = state.round;
    $('#over-record').textContent = isRecord
      ? '★ NUEVO RÉCORD DEL MODO'
      : best ? `Récord del modo: ${best} pts` : 'Primera partida en este modo';

    UI.setLives(-1);
    UI.setFoot('◂ FIN DEL TURNO', state.mode.name.toUpperCase() + ' · ' + state.score + ' PTS');
    UI.leds(isRecord ? [1, 1, 1, 1, 1] : [1, 1, 1, 0, 0]);
    SFX.play('over');
    if (isRecord) setTimeout(() => SFX.play('record'), 900);
    if (isRecord) UI.toast('¡Nuevo récord de la cajita! ' + state.score + ' pts', 3200);
    renderMenu();
    setTimeout(() => {
      const btn = $('#btn-again');
      if (btn) btn.focus({ preventScroll: true });
    }, 80);
  }

  /* ---------------------------------------------------------------- *
   * Tutorial / ayuda
   * ---------------------------------------------------------------- */
  function openTutorial() {
    if (state.panel === 'tutorial') return;
    state.tutorialReturn = state.panel;
    if (state.panel === 'play' && !state.answered) {
      state.timeLeft = Math.max(0, (state.deadline - performance.now()) / 1000);
      stopTimer();
    }
    state.panel = 'tutorial';
    UI.showPanel('tutorial');
    UI.leds([2, 2, 2, 2, 2]);
    SFX.play('click');
  }

  function closeTutorial() {
    if (state.panel !== 'tutorial') return;
    const back = state.tutorialReturn;
    state.panel = back;
    UI.showPanel(back);
    if (back === 'play') {
      if (state.mode.time && !state.answered) startTimer();
      UI.leds([1, 1, 0, 0, 0]);
    } else if (back === 'menu') {
      UI.leds([1, 1, 1, 1, 1]);
    } else if (back === 'over') {
      UI.leds([1, 1, 1, 0, 0]);
    }
  }

  /* ---------------------------------------------------------------- *
   * Navegación contextual de los botones físicos
   * ---------------------------------------------------------------- */
  function navMove(dir) {
    if (state.panel === 'menu') moveMenu(dir);
    else if (state.panel === 'play') moveOption(dir);
    else SFX.play('click');
  }

  function primaryAction() {
    switch (state.panel) {
      case 'menu': startGame(MODES[state.menuIndex].key); break;
      case 'play':
        if (state.answered) return;
        if (state.options[state.optionFocus]) answer(state.options[state.optionFocus]);
        break;
      case 'reveal': advance(); break;
      case 'over': startGame(state.mode ? state.mode.key : 'campo'); break;
      case 'tutorial': closeTutorial(); break;
      case 'pause': resumeGame(); break;
      default: break;
    }
  }

  function scanAction() {
    if (state.panel === 'play') doScan();
    else if (state.panel === 'reveal') advance();
    else primaryAction();
  }

  /* ---------------------------------------------------------------- *
   * Eventos
   * ---------------------------------------------------------------- */
  function bind() {
    $('#btn-up').addEventListener('click', () => navMove(-1));
    $('#btn-down').addEventListener('click', () => navMove(1));
    $('#btn-ok').addEventListener('click', primaryAction);
    $('#btn-scan').addEventListener('click', scanAction);
    $('#btn-next').addEventListener('click', advance);
    $('#btn-menu').addEventListener('click', enterMenu);
    $('#btn-over-menu').addEventListener('click', enterMenu);
    $('#btn-again').addEventListener('click', () => startGame(state.mode ? state.mode.key : 'campo'));
    $('#btn-resume').addEventListener('click', resumeGame);
    $('#btn-quit').addEventListener('click', enterMenu);
    $('#btn-hint').addEventListener('click', useHint);
    $('#btn-skip').addEventListener('click', skipSample);
    $('#btn-help').addEventListener('click', openTutorial);
    $('#btn-tutorial-2').addEventListener('click', openTutorial);
    $('#btn-tut-back').addEventListener('click', closeTutorial);
    $('#btn-audio').addEventListener('click', () => {
      SFX.setMuted(!SFX.isMuted());
      UI.refreshAudioButton();
    });
    $('#btn-full').addEventListener('click', UI.toggleFullscreen);

    document.addEventListener('keydown', onKey);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && state.panel === 'play' && !state.answered) pauseGame();
    });

    let resizeId = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(() => {
        if (state.panel === 'play') render(cam, state.specimen, 760, 560);
        if (state.panel === 'reveal') render(thumb, state.specimen, 460, 460);
      }, 140);
    });

    // aviso de hardware conectado (por si la cajita manda eventos)
    window.addEventListener('cafescan:button', ev => {
      const id = ev.detail && ev.detail.button;
      if (id === 'up' || id === 'prev') navMove(-1);
      else if (id === 'down' || id === 'next') navMove(1);
      else if (id === 'ok' || id === 'a') primaryAction();
      else if (id === 'scan' || id === 'b') scanAction();
    });
  }

  function onKey(ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    const key = ev.key;
    const tag = (ev.target && ev.target.tagName) || '';

    if (key === 'Escape') {
      ev.preventDefault();
      if (state.panel === 'play') pauseGame();
      else if (state.panel === 'pause') resumeGame();
      else if (state.panel === 'tutorial') closeTutorial();
      return;
    }
    if (key === ' ' || key === 'Spacebar') {
      ev.preventDefault();
      scanAction();
      return;
    }
    if (key === 'Enter') {
      const inActivePanel = ev.target && ev.target.closest && ev.target.closest('.panel.is-active');
      if (tag === 'BUTTON' && inActivePanel) return; // deja actuar al botón enfocado
      ev.preventDefault();
      primaryAction();
      return;
    }
    if (key === 'ArrowUp') { ev.preventDefault(); navMove(-1); return; }
    if (key === 'ArrowDown') { ev.preventDefault(); navMove(1); return; }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (state.panel === 'play' || state.panel === 'menu') {
        ev.preventDefault();
        navMove(key === 'ArrowLeft' ? -1 : 1);
      }
      return;
    }
    if (/^[1-4]$/.test(key)) {
      if (state.panel === 'play' && !state.answered) {
        ev.preventDefault();
        const idx = Number(key) - 1;
        if (state.options[idx]) answer(state.options[idx]);
      }
      return;
    }
    const lower = key.toLowerCase();
    if (lower === 'm') {
      SFX.setMuted(!SFX.isMuted());
      UI.refreshAudioButton();
    } else if (lower === 'p') {
      useHint();
    } else if (lower === 's') {
      skipSample();
    } else if (lower === 'h' || lower === '?') {
      if (state.panel === 'tutorial') closeTutorial(); else openTutorial();
    } else if (lower === 'f') {
      UI.toggleFullscreen();
    }
  }

  /* ---------------------------------------------------------------- *
   * Arranque
   * ---------------------------------------------------------------- */
  function init() {
    UI.boot();
    renderMenu();
    enterMenu();
    bind();
    if (SFX.isMuted()) UI.setAudioButton();

    // si el navegador tiene la API, dejamos que la cajita real dicte el menú
    if (new URLSearchParams(location.search).get('modo')) {
      const wanted = new URLSearchParams(location.search).get('modo');
      if (modeByKey(wanted)) {
        state.menuIndex = MODES.findIndex(m => m.key === wanted);
        startGame(wanted);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
