/*
 * CAFÉSCAN MK-II — catálogo de síntomas + generador procedural de hojas.
 * Cada muestra se dibuja con una semilla distinta: nunca hay dos casos iguales.
 */
const Specimens = (() => {
  'use strict';

  const TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ *
   * Catálogo
   * ------------------------------------------------------------------ */
  const DISEASES = [
    {
      key: 'roya',
      name: 'Roya del café',
      short: 'Roya',
      type: 'Hongo',
      tone: '#ff9a3c',
      symptoms: [
        'Polvo anaranjado en el envés de la hoja.',
        'Manchas amarillas aceitosas que después se vuelven marrones.'
      ],
      pista: 'Busca polvo naranja y manchas amarillas aceitosas.',
      manejo: 'Raleo de sombra, nutrición balanceada y fungicidas a base de cobre en los focos.',
      dato: 'Hemileia vastatrix: la enfermedad más costosa del café colombiano.',
      similar: ['nitrogeno', 'aranita', 'sana']
    },
    {
      key: 'mancha_hierro',
      name: 'Mancha de hierro',
      short: 'Mancha de hierro',
      type: 'Hongo',
      tone: '#c08a56',
      symptoms: [
        'Manchas circulares con centro gris claro y borde marrón.',
        'También ataca granos y ramas tiernas.'
      ],
      pista: 'Manchas redondas con el centro clarito, como monedas.',
      manejo: 'Mejorar ventilación, evitar exceso de sombra y usar fungicidas protectores.',
      dato: 'Cercospora coffeicola, muy común en almácigos y cafetales sombreados.',
      similar: ['ojo_gallo', 'antracnosis', 'sana']
    },
    {
      key: 'antracnosis',
      name: 'Antracnosis',
      short: 'Antracnosis',
      type: 'Hongo',
      tone: '#b4644e',
      symptoms: [
        'Lesiones oscuras y hundidas, con grietas y perforaciones.',
        'Bordes secos que avanzan siguiendo las nervaduras.'
      ],
      pista: 'Puntos negros hundidos, con grietas y huecos.',
      manejo: 'Podar el tejido afectado, desinfectar herramientas y controlar el exceso de humedad.',
      dato: 'Colletotrichum spp. ataca hojas, ramas y frutos en épocas lluviosas.',
      similar: ['mancha_hierro', 'ojo_gallo', 'minador']
    },
    {
      key: 'minador',
      name: 'Minador de la hoja',
      short: 'Minador',
      type: 'Plaga',
      tone: '#d9c58f',
      symptoms: [
        'Galerías serpenteantes color papel entre las nervaduras.',
        'Parches secos que se rompen y dejan huecos en la hoja.'
      ],
      pista: 'Líneas claras que serpentean por la hoja, como un caminito.',
      manejo: 'Manejo de sombra, monitoreo de hojas y liberación de avispitas parasitoides.',
      dato: 'Leucoptera coffeella: es una polilla pequeña, no un hongo.',
      similar: ['antracnosis', 'aranita', 'mancha_hierro']
    },
    {
      key: 'aranita',
      name: 'Arañita roja',
      short: 'Arañita roja',
      type: 'Plaga',
      tone: '#e3c65b',
      symptoms: [
        'Punteado amarillo muy fino que da un aspecto bronceado.',
        'Telarañas tenues y hojas opacas en épocas secas.'
      ],
      pista: 'Miles de puntitos amarillos y un brillo bronceado.',
      manejo: 'Riego y sombra adecuados; evitar agroquímicos que matan a los enemigos naturales.',
      dato: 'Oligonychus ilicis: crece con el verano, el polvo y la falta de agua.',
      similar: ['roya', 'nitrogeno', 'minador']
    },
    {
      key: 'ojo_gallo',
      name: 'Ojo de gallo',
      short: 'Ojo de gallo',
      type: 'Hongo',
      tone: '#e0b061',
      symptoms: [
        'Manchas marrones circulares con un anillo más oscuro.',
        'Puntitos amarillo-naranja (sombrillas) en el centro de la mancha.'
      ],
      pista: 'Manchas con anillo oscuro y un puntito amarillo en el centro.',
      manejo: 'Aumentar luminosidad y aireación; retirar las hojas enfermas del lote.',
      dato: 'Mycena citricolor, clásica de zonas húmedas y muy sombreadas.',
      similar: ['mancha_hierro', 'antracnosis', 'sana']
    },
    {
      key: 'nitrogeno',
      name: 'Deficiencia de nitrógeno',
      short: 'Falta de nitrógeno',
      type: 'Nutrición',
      tone: '#c8dc6e',
      symptoms: [
        'Amarilleo parejo que empieza por las hojas viejas.',
        'La nervadura central sigue verde y la hoja se ve pálida.'
      ],
      pista: 'Hoja pálida y amarillenta, pero con la nervadura verde.',
      manejo: 'Análisis de suelo y fertilización nitrogenada fraccionada.',
      dato: 'No es una enfermedad: es hambre de nitrógeno.',
      similar: ['roya', 'sana', 'aranita']
    },
    {
      key: 'sana',
      name: 'Hoja sana',
      short: 'Hoja sana',
      type: 'Ninguna',
      tone: '#b6ff8a',
      symptoms: [
        'Verde uniforme y brillante, sin manchas ni galerías.',
        'Nervaduras parejas y borde limpio.'
      ],
      pista: 'Verde parejo, brillante, sin ninguna lesión.',
      manejo: 'Seguir monitoreando: la mejor defensa es la observación constante.',
      dato: 'Registrar una hoja sana también es hacer vigilancia fitosanitaria.',
      similar: ['nitrogeno', 'roya', 'aranita']
    }
  ];

  const BY_KEY = Object.create(null);
  DISEASES.forEach(d => { BY_KEY[d.key] = d; });

  /* ------------------------------------------------------------------ *
   * Azar reproducible
   * ------------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const gauss = rnd => (rnd() + rnd() + rnd() + rnd() - 2) / 1.6;

  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor((rnd ? rnd() : Math.random()) * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ------------------------------------------------------------------ *
   * Silueta de la hoja
   * ------------------------------------------------------------------ */
  const LEAF = { baseY: 0.905, tipY: 0.075, halfW: 0.238 };

  function halfWidth(u) {
    return LEAF.halfW * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.92)), 0.7) * (1 - 0.10 * u);
  }

  function margin(u, phase) {
    return 0.0068 * Math.sin(u * Math.PI * 9 + phase) +
           0.0034 * Math.sin(u * Math.PI * 23 + phase * 2.3);
  }

  function makeLeafPath(S, phase) {
    const p = new Path2D();
    const cx = S * 0.5;
    const baseY = S * LEAF.baseY;
    const len = S * (LEAF.baseY - LEAF.tipY);
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = cx + (halfWidth(u) + margin(u, phase)) * S;
      const y = baseY - len * u;
      if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const u = i / N;
      p.lineTo(cx - (halfWidth(u) + margin(u, phase)) * S, baseY - len * u);
    }
    p.closePath();
    return p;
  }

  /* ------------------------------------------------------------------ *
   * Piezas base
   * ------------------------------------------------------------------ */
  function drawVeins(ctx, S, rnd, color) {
    const cx = S * 0.5;
    const baseY = S * LEAF.baseY;
    const len = S * (LEAF.baseY - LEAF.tipY);
    const stroke = color || 'rgba(166, 218, 140, 0.55)';

    ctx.save();
    ctx.lineCap = 'round';

    // secundarias
    ctx.strokeStyle = color ? color : 'rgba(146, 198, 122, 0.4)';
    ctx.lineWidth = Math.max(1, S * 0.005);
    for (let i = 0; i < 8; i++) {
      const u = 0.13 + i * 0.096 + rnd() * 0.018;
      for (const side of [-1, 1]) {
        const y0 = baseY - len * u;
        const y1 = baseY - len * Math.min(0.97, u + 0.185);
        const x1 = cx + side * halfWidth(Math.min(0.97, u + 0.185)) * S * 0.94;
        ctx.beginPath();
        ctx.moveTo(cx + side * S * 0.004, y0);
        ctx.quadraticCurveTo(
          cx + side * halfWidth(u + 0.07) * S * 0.62,
          y0 - S * 0.015,
          x1, y1
        );
        ctx.stroke();
      }
    }

    // nervadura central
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(1.2, S * 0.011);
    ctx.beginPath();
    ctx.moveTo(cx, baseY + S * 0.005);
    ctx.quadraticCurveTo(cx + S * 0.012, S * 0.48, cx, S * LEAF.tipY + S * 0.012);
    ctx.stroke();

    ctx.strokeStyle = color ? 'rgba(210, 245, 170, 0.22)' : 'rgba(200, 240, 160, 0.28)';
    ctx.lineWidth = Math.max(1, S * 0.0035);
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.quadraticCurveTo(cx + S * 0.013, S * 0.48, cx, S * LEAF.tipY + S * 0.018);
    ctx.stroke();

    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * Síntomas
   * ------------------------------------------------------------------ */
  function rust(ctx, S, rnd, sev) {
    const blotches = 8 + Math.floor(rnd() * 6);
    for (let i = 0; i < blotches; i++) {
      const x = (0.25 + rnd() * 0.5) * S;
      const y = (0.12 + rnd() * 0.68) * S;
      const r = (0.045 + rnd() * 0.085) * S;

      const halo = ctx.createRadialGradient(x, y, 0, x, y, r);
      halo.addColorStop(0, `rgba(242, 210, 78, ${0.72 * sev})`);
      halo.addColorStop(0.55, `rgba(220, 194, 64, ${0.34 * sev})`);
      halo.addColorStop(1, 'rgba(206, 184, 60, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();

      if (rnd() < 0.45) {
        ctx.fillStyle = `rgba(96, 58, 24, ${0.32 * sev})`;
        ctx.beginPath();
        ctx.arc(x + gauss(rnd) * r * 0.4, y + gauss(rnd) * r * 0.4, r * 0.26, 0, TAU);
        ctx.fill();
      }

      const cols = ['#e6952f', '#cf7a1e', '#f4b74a', '#b5651a', '#eaa53c'];
      const n = 28 + Math.floor(rnd() * 40);
      for (let j = 0; j < n; j++) {
        const a = rnd() * TAU;
        const rr = Math.sqrt(rnd()) * r * 0.78;
        const pr = (0.0032 + rnd() * 0.0068) * S;
        ctx.globalAlpha = (0.45 + rnd() * 0.55) * sev;
        ctx.fillStyle = cols[(rnd() * cols.length) | 0];
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, pr, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function ironSpot(ctx, S, rnd, sev) {
    const n = 5 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const x = (0.25 + rnd() * 0.5) * S;
      const y = (0.13 + rnd() * 0.68) * S;
      const r = (0.026 + rnd() * 0.048) * S;

      const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.6);
      halo.addColorStop(0, `rgba(196, 172, 88, ${0.28 * sev})`);
      halo.addColorStop(1, 'rgba(196, 172, 88, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, TAU); ctx.fill();

      ctx.fillStyle = `rgba(84, 52, 26, ${0.92 * sev})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(146, 104, 62, ${0.95 * sev})`;
      ctx.beginPath(); ctx.arc(x, y, r * 0.74, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(204, 190, 160, ${0.95 * sev})`;
      ctx.beginPath(); ctx.arc(x, y, r * 0.46, 0, TAU); ctx.fill();

      for (let j = 0; j < 6; j++) {
        const a = rnd() * TAU, rr = rnd() * r * 0.4;
        ctx.fillStyle = `rgba(64, 42, 22, ${0.7 * sev})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, Math.max(0.7, S * 0.0022), 0, TAU);
        ctx.fill();
      }
    }
  }

  function anthracnose(ctx, S, rnd, sev) {
    const n = 4 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const x = (0.25 + rnd() * 0.5) * S;
      const y = (0.14 + rnd() * 0.66) * S;
      const r = (0.028 + rnd() * 0.045) * S;

      const halo = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.8);
      halo.addColorStop(0, `rgba(198, 168, 100, ${0.26 * sev})`);
      halo.addColorStop(1, 'rgba(198, 168, 100, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, TAU); ctx.fill();

      // lesión irregular
      ctx.beginPath();
      const pts = 16;
      for (let k = 0; k <= pts; k++) {
        const a = (k / pts) * TAU;
        const rr = r * (0.66 + rnd() * 0.7);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr * 0.9;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(40, 25, 16, ${0.94 * sev})`;
      ctx.fill();

      ctx.beginPath();
      for (let k = 0; k <= pts; k++) {
        const a = (k / pts) * TAU;
        const rr = r * (0.34 + rnd() * 0.4);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr * 0.9;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(16, 11, 8, ${0.95 * sev})`;
      ctx.fill();

      // grietas
      ctx.strokeStyle = `rgba(196, 158, 108, ${0.42 * sev})`;
      ctx.lineWidth = Math.max(0.8, S * 0.0026);
      for (let k = 0; k < 3; k++) {
        const a = rnd() * TAU;
        const l = r * (0.3 + rnd() * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + gauss(rnd) * r * 0.2, y + gauss(rnd) * r * 0.2);
        ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
      }

      // perforación
      if (rnd() < 0.55) {
        ctx.fillStyle = 'rgba(6, 12, 8, 0.95)';
        ctx.beginPath();
        ctx.arc(x + gauss(rnd) * r * 0.35, y + gauss(rnd) * r * 0.35, r * (0.12 + rnd() * 0.16), 0, TAU);
        ctx.fill();
      }
    }
  }

  function leafMiner(ctx, S, rnd, sev) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      let x = (0.3 + rnd() * 0.4) * S;
      let y = (0.18 + rnd() * 0.62) * S;
      let ang = rnd() * TAU;
      const pts = [[x, y]];
      const steps = 16 + Math.floor(rnd() * 12);
      for (let s = 0; s < steps; s++) {
        ang += (rnd() - 0.5) * 1.6;
        x += Math.cos(ang) * S * 0.023;
        y += Math.sin(ang) * S * 0.019;
        pts.push([x, y]);
      }
      const strokePath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) {
          const p = pts[k];
          ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
      };

      ctx.strokeStyle = `rgba(92, 68, 34, ${0.5 * sev})`;
      ctx.lineWidth = S * 0.027;
      strokePath();
      ctx.strokeStyle = `rgba(216, 201, 168, ${0.96 * sev})`;
      ctx.lineWidth = S * 0.019;
      strokePath();
      ctx.strokeStyle = `rgba(246, 239, 218, ${0.72 * sev})`;
      ctx.lineWidth = S * 0.006;
      strokePath();

      const last = pts[pts.length - 1];
      ctx.fillStyle = `rgba(56, 40, 22, ${0.8 * sev})`;
      ctx.beginPath();
      ctx.arc(last[0], last[1], Math.max(1, S * 0.007), 0, TAU);
      ctx.fill();
    }

    // parches secos
    for (let i = 0; i < 2; i++) {
      const x = (0.3 + rnd() * 0.4) * S;
      const y = (0.2 + rnd() * 0.55) * S;
      const rx = (0.03 + rnd() * 0.05) * S;
      const ry = rx * (0.6 + rnd() * 0.5);
      ctx.fillStyle = `rgba(150, 116, 68, ${0.55 * sev})`;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rnd() * TAU, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(84, 58, 28, ${0.45 * sev})`;
      ctx.lineWidth = Math.max(1, S * 0.004);
      ctx.stroke();
    }
    ctx.restore();
  }

  function redMite(ctx, S, rnd, sev) {
    const cx = S * 0.5;
    const bronze = ctx.createRadialGradient(cx, S * 0.48, S * 0.16, cx, S * 0.5, S * 0.52);
    bronze.addColorStop(0, 'rgba(176, 138, 52, 0)');
    bronze.addColorStop(0.7, `rgba(176, 138, 52, ${0.16 * sev})`);
    bronze.addColorStop(1, `rgba(150, 112, 40, ${0.3 * sev})`);
    ctx.fillStyle = bronze;
    ctx.fillRect(0, 0, S, S);

    const cols = ['rgba(232, 214, 104,', 'rgba(202, 178, 72,', 'rgba(176, 142, 48,', 'rgba(244, 232, 148,'];
    for (let i = 0; i < 620; i++) {
      const x = rnd() * S;
      const y = rnd() * S;
      ctx.fillStyle = cols[(rnd() * cols.length) | 0] + ((0.22 + rnd() * 0.5) * sev) + ')';
      const r = Math.max(0.55, (0.0022 + rnd() * 0.0044) * S);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }

    // telarañas
    ctx.strokeStyle = 'rgba(236, 244, 224, 0.07)';
    ctx.lineWidth = Math.max(0.8, S * 0.0024);
    for (let i = 0; i < 7; i++) {
      const x = (0.25 + rnd() * 0.5) * S;
      const y = (0.2 + rnd() * 0.6) * S;
      const r = (0.04 + rnd() * 0.09) * S;
      ctx.beginPath();
      ctx.arc(x, y, r, rnd() * TAU, rnd() * TAU + 1.4);
      ctx.stroke();
    }

    // ácaros (se ven con la lupa)
    ctx.fillStyle = 'rgba(172, 62, 40, 0.85)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc((0.3 + rnd() * 0.4) * S, (0.2 + rnd() * 0.6) * S, Math.max(0.8, S * 0.0034), 0, TAU);
      ctx.fill();
    }
  }

  function gallEye(ctx, S, rnd, sev) {
    const n = 4 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const x = (0.26 + rnd() * 0.48) * S;
      const y = (0.14 + rnd() * 0.66) * S;
      const r = (0.022 + rnd() * 0.036) * S;

      const halo = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 1.8);
      halo.addColorStop(0, `rgba(208, 178, 104, ${0.26 * sev})`);
      halo.addColorStop(1, 'rgba(208, 178, 104, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, TAU); ctx.fill();

      ctx.fillStyle = `rgba(108, 66, 30, ${0.95 * sev})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(160, 118, 66, ${0.95 * sev})`;
      ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(214, 198, 160, ${0.92 * sev})`;
      ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(58, 34, 14, ${0.8 * sev})`;
      ctx.lineWidth = Math.max(1, S * 0.003);
      ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, TAU); ctx.stroke();

      // sombrilla de Mycena
      ctx.strokeStyle = `rgba(206, 158, 52, ${0.9 * sev})`;
      ctx.lineWidth = Math.max(0.9, S * 0.0026);
      ctx.beginPath();
      ctx.moveTo(x, y - S * 0.001);
      ctx.lineTo(x + S * 0.003, y - S * 0.012);
      ctx.stroke();
      ctx.fillStyle = `rgba(244, 198, 84, ${0.95 * sev})`;
      ctx.beginPath();
      ctx.ellipse(x + S * 0.003, y - S * 0.014, S * 0.009, S * 0.005, 0, 0, TAU);
      ctx.fill();
    }
  }

  function nitrogen(ctx, S, rnd, sev) {
    const g = ctx.createLinearGradient(0, S * 0.06, 0, S * 0.94);
    g.addColorStop(0, `rgba(212, 226, 118, ${0.78 * sev})`);
    g.addColorStop(0.45, `rgba(198, 214, 106, ${0.55 * sev})`);
    g.addColorStop(1, `rgba(164, 190, 92, ${0.26 * sev})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);

    // moteado irregular
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(226, 234, 150, ${(0.05 + rnd() * 0.12) * sev})`;
      ctx.beginPath();
      ctx.arc(rnd() * S, rnd() * S, (0.01 + rnd() * 0.045) * S, 0, TAU);
      ctx.fill();
    }
  }

  function healthy(ctx, S, rnd) {
    // apenas unas motas de polvo: una hoja sana no es perfecta
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = 'rgba(190, 190, 150, 0.09)';
      ctx.beginPath();
      ctx.arc(rnd() * S, rnd() * S, (0.002 + rnd() * 0.005) * S, 0, TAU);
      ctx.fill();
    }
  }

  const PAINTERS = {
    roya: rust,
    mancha_hierro: ironSpot,
    antracnosis: anthracnose,
    minador: leafMiner,
    aranita: redMite,
    ojo_gallo: gallEye,
    nitrogeno: nitrogen,
    sana: healthy
  };

  /* ------------------------------------------------------------------ *
   * Render de una hoja completa dentro de un cuadrado de lado S
   * ------------------------------------------------------------------ */
  function drawLeaf(ctx, S, spec) {
    const rnd = mulberry32(spec.seed >>> 0);
    const phase = rnd() * TAU;
    const path = makeLeafPath(S, phase);
    const cx = S * 0.5;
    const baseY = S * LEAF.baseY;

    // peciolo
    ctx.save();
    ctx.strokeStyle = '#4c5a2e';
    ctx.lineWidth = Math.max(1.5, S * 0.014);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, baseY - S * 0.004);
    ctx.quadraticCurveTo(cx + S * 0.012, baseY + S * 0.05, cx + S * 0.004, baseY + S * 0.085);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150, 170, 100, 0.35)';
    ctx.lineWidth = Math.max(1, S * 0.004);
    ctx.stroke();
    ctx.restore();

    // sombra proyectada
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = S * 0.055;
    ctx.shadowOffsetY = S * 0.018;
    const base = ctx.createLinearGradient(S * 0.2, S * 0.1, S * 0.85, S * 0.95);
    base.addColorStop(0, '#5aa453');
    base.addColorStop(0.42, '#3d8040');
    base.addColorStop(1, '#2a5c33');
    ctx.fillStyle = base;
    ctx.fill(path);
    ctx.restore();

    // interior
    ctx.save();
    ctx.clip(path);

    // textura
    for (let i = 0; i < 520; i++) {
      const light = rnd() < 0.5;
      ctx.fillStyle = light ? 'rgba(158, 214, 138, 0.07)' : 'rgba(10, 34, 18, 0.06)';
      ctx.beginPath();
      ctx.arc(rnd() * S, rnd() * S, (0.0015 + rnd() * 0.004) * S, 0, TAU);
      ctx.fill();
    }

    // sombreado del borde
    const edge = ctx.createRadialGradient(cx, S * 0.48, S * 0.2, cx, S * 0.48, S * 0.56);
    edge.addColorStop(0, 'rgba(255, 255, 255, 0)');
    edge.addColorStop(1, 'rgba(8, 28, 14, 0.28)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, S, S);

    drawVeins(ctx, S, rnd);

    const painter = PAINTERS[spec.key] || healthy;
    painter(ctx, S, rnd, spec.severity == null ? 1 : spec.severity);

    if (spec.key === 'nitrogeno') {
      // la nervadura se mantiene verde: sello de la deficiencia
      drawVeins(ctx, S, rnd, 'rgba(108, 168, 86, 0.72)');
    }

    // brillo
    const gloss = ctx.createRadialGradient(S * 0.38, S * 0.26, 0, S * 0.38, S * 0.26, S * 0.46);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
    gloss.addColorStop(0.55, 'rgba(255, 255, 255, 0.03)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, S, S);

    ctx.restore();

    // contorno
    ctx.strokeStyle = 'rgba(10, 26, 16, 0.55)';
    ctx.lineWidth = Math.max(1, S * 0.006);
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(186, 236, 168, 0.12)';
    ctx.lineWidth = Math.max(0.7, S * 0.002);
    ctx.stroke(path);
  }

  /* ------------------------------------------------------------------ *
   * Escena: fondo + hoja centrada y rotada (W × H)
   * ------------------------------------------------------------------ */
  function drawScene(ctx, W, H, spec) {
    const S = Math.min(W, H);

    const bg = ctx.createRadialGradient(W * 0.5, H * 0.4, S * 0.05, W * 0.5, H * 0.5, S * 0.82);
    bg.addColorStop(0, '#122a1c');
    bg.addColorStop(0.6, '#0b1a12');
    bg.addColorStop(1, '#06100b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // rejilla tenue de la pantalla
    ctx.strokeStyle = 'rgba(120, 220, 140, 0.045)';
    ctx.lineWidth = 1;
    const step = S / 10;
    ctx.beginPath();
    for (let x = step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = step; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(spec.rot || 0);
    const leafS = S * 0.96;
    ctx.translate(-leafS / 2, -leafS / 2);
    drawLeaf(ctx, leafS, spec);
    ctx.restore();

    // viñeta
    const vig = ctx.createRadialGradient(W * 0.5, H * 0.5, S * 0.35, W * 0.5, H * 0.5, S * 0.78);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /* ------------------------------------------------------------------ *
   * Utilidades de juego
   * ------------------------------------------------------------------ */
  function makeSpecimen(key, seed, severity) {
    return {
      key,
      seed: seed >>> 0,
      severity: severity == null ? 1 : severity,
      rot: (mulberry32((seed >>> 0) + 99)() - 0.5) * 0.16
    };
  }

  function buildOptions(key, count, rnd) {
    const d = BY_KEY[key];
    const chosen = new Set([key]);
    const pool = [...(d.similar || []), ...shuffle(DISEASES.map(x => x.key), rnd)];
    for (const k of pool) {
      if (chosen.size >= count) break;
      chosen.add(k);
    }
    // si algún día hay menos enfermedades que opciones, completamos
    let guard = 0;
    while (chosen.size < count && guard++ < 40) chosen.add(DISEASES[(rnd() * DISEASES.length) | 0].key);
    return shuffle([...chosen], rnd);
  }

  return {
    DISEASES,
    BY_KEY,
    drawScene,
    drawLeaf,
    makeSpecimen,
    buildOptions,
    mulberry32,
    shuffle
  };
})();
