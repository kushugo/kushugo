/* ==========================================================================
   accueil-sections.js — sections « Système d'abord » de la page d'accueil (index.html) : marques, IA, expertise,
   contact, carte de rendez-vous, barre de navigation et sélecteur de langue.
   Dans les commentaires : « V » = ces sections, « F » = le reste de la page (js/accueil.js), « mix : » = réglage fait
   pour les assembler : démarrage sans i18n, sans hero ni projets de V,
   curseur compagnon limité aux zones .v3zone, accent posé sur les zones, carte de rendez-vous
   ouvrable depuis la palette de F (window.FMV.openRdv), Lenis arrêté pendant la carte, filet de
   sécurité des apparitions indépendant de requestAnimationFrame.
   ==========================================================================
   Accueil v3 — interactions
   Dépendances (jsDelivr) : GSAP 3.13, ScrollTrigger, Draggable.
   Sans GSAP ou en « mouvement réduit », tout reste lisible et manipulable :
   seules les animations automatiques et l'épinglage du hero sont coupés.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // mouvement réduit : seuls les grands mouvements s'arrêtent (épinglage, effets liés au défilement, apparitions,
  // curseur) ; les démonstrations des cartes et le bandeau de logos continuent
  const anim = !!G;
  const full = !!G && !reduce;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia('(min-width: 1100px)');
  /* textes de la langue courante (js/accueil-contenu.<langue>.js) ; DEC = séparateur décimal */
  const UI = ((window.ACCUEIL_CONTENU || {})[window.__accLang || 'fr'] || (window.ACCUEIL_CONTENU || {}).fr || { ui: {} }).ui;
  const DEC = UI['sc.decimale'] || ',';

  if (G) G.registerPlugin(...[ST, window.Draggable].filter(Boolean));
  if (!(full && ST)) root.classList.remove('v3-pin');

  /* ---------- Utilitaires ---------- */
  const nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const eur = (v) => nf2.format(v) + ' €';
  const int = (v) => String(Math.round(v));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const later = (s, fn) => {
    if (G) { const c = G.delayedCall(s, fn); return () => c.kill(); }
    const t = setTimeout(fn, s * 1000); return () => clearTimeout(t);
  };
  const place = (el, x, y) => { el.style.transform = `translate(${x}px, ${y}px)`; };

  // Nombre qui roule jusqu'à sa nouvelle valeur
  const roll = (el, to, fmt = int, dur = 0.6) => {
    const o = el._o || (el._o = { v: to });
    if (!anim || !dur || o.v === to) { if (G) G.killTweensOf(o); o.v = to; el.textContent = fmt(to); return; }
    G.to(o, { v: to, duration: dur, ease: 'power3.out', overwrite: true, onUpdate: () => { el.textContent = fmt(o.v); } });
  };
  // Texte qui s'échange avec un petit rebond
  const swap = (el, txt, instant) => {
    if (el._sw) { el._sw.kill(); el._sw = null; }
    if (!anim || instant) { if (G) G.set(el, { clearProps: 'transform,opacity' }); el.textContent = txt; return; }
    if (el.textContent === txt) return;
    el._sw = G.timeline()
      .to(el, { yPercent: -60, opacity: 0, duration: 0.12, ease: 'power2.in' })
      .add(() => { el.textContent = txt; })
      .fromTo(el, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.32, ease: 'back.out(2.2)' });
  };
  const pop = (el) => { if (anim) G.fromTo(el, { scale: 0.82 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', overwrite: 'auto' }); };

  // Position d'un élément dans le repère (non transformé) d'un ancêtre positionné
  const local = (el, rootEl) => {
    let x = 0, y = 0, n = el;
    while (n && n !== rootEl) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };

  /* ---------- Mise à l'échelle des scènes (dessinées en pixels fixes) ---------- */
  const fitAll = () => {
    $$('.sc-fit').forEach((el) => {
      const box = el.parentElement, w = +el.dataset.fit, h = +el.dataset.fitH || 294;
      if (!wide.matches && el.closest('.board')) {
        // carrousel mobile/tablette : boîtes identiques, la scène est contenue et centrée dans sa boîte
        box.style.height = '';
        const s = Math.min(box.clientWidth / w, box.clientHeight / h);
        el.style.transform = `translate(${(box.clientWidth - w * s) / 2}px, ${(box.clientHeight - h * s) / 2}px) scale(${s})`;
        el.style.borderRadius = 12 / s + 'px';
        return;
      }
      const s = clamp(box.clientWidth / w, 0.4, 1.3);
      el.style.transform = `scale(${s})`;
      el.style.borderRadius = '';
      box.style.height = h * s + 'px';
    });
    const bs = $('.bd-scale');
    if (!bs) return;
    if (wide.matches) {
      const s = Math.min(1, bs.parentElement.clientWidth / 1320);
      bs.style.transform = `scale(${s})`;
      bs.parentElement.style.height = bs.offsetHeight * s + 'px';
    } else { bs.style.transform = ''; bs.parentElement.style.height = ''; }
  };

  /* ---------- Faux curseur des démonstrations automatiques ---------- */
  const makePtr = (rootEl, el) => {
    const at = (t, ax = 0.5, ay = 0.5) => { const r = local(t, rootEl); return { x: r.x + r.w * ax, y: r.y + r.h * ay }; };
    return {
      el,
      box: (t) => local(t, rootEl),
      show: (tl, t) => tl.set(el, { x: () => at(t).x - 46, y: () => at(t).y + 54, scale: 1 }).to(el, { opacity: 1, duration: 0.2 }),
      to: (tl, t, dur = 0.7, pos) => tl.to(el, { x: () => at(t).x, y: () => at(t).y, duration: dur, ease: 'power2.inOut' }, pos),
      tap: (tl, fn) => tl.to(el, { scale: 0.78, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut' }).add(fn, '-=0.09'),
      hide: (tl) => tl.to(el, { opacity: 0, duration: 0.25 }),
    };
  };

  /* ==========================================================================
     Les scènes : chacune renvoie { reset, demo(tl, ptr) [, engage, still] }
     ========================================================================== */

  // Gouvernement · DSFR — tableau à états : sélection de lignes et action groupée
  const gouv = (el) => {
    const rows = $$('.g-row', el), count = $('.g-count', el), act = $('.g-act', el);
    const init = rows.map((r) => { const b = $('.g-badge', r); return [b.className, b.textContent]; });
    const sync = () => {
      const n = rows.filter((r) => $('input', r).checked).length;
      rows.forEach((r) => r.classList.toggle('on', $('input', r).checked));
      count.textContent = n ? (n > 1 ? n + ' lignes sélectionnées' : '1 ligne sélectionnée') : 'Aucune ligne sélectionnée';
      act.disabled = !n;
    };
    rows.forEach((r) => $('input', r).addEventListener('change', sync));
    act.addEventListener('click', () => {
      let n = 0;
      rows.forEach((r) => {
        const i = $('input', r); if (!i.checked) return;
        const b = $('.g-badge', r); b.className = 'g-badge g-badge--ok'; b.textContent = 'Publié'; pop(b);
        i.checked = false; n++;
      });
      sync();
      if (n) count.textContent = n > 1 ? n + ' fiches publiées' : '1 fiche publiée';
    });
    const check = (k) => () => { $('input', rows[k]).checked = true; sync(); };
    return {
      reset: () => { rows.forEach((r, k) => { $('input', r).checked = false; const b = $('.g-badge', r); b.className = init[k][0]; b.textContent = init[k][1]; }); sync(); },
      demo: (tl, p) => {
        p.show(tl, $('.g-box', rows[1])); p.to(tl, $('.g-box', rows[1]), 0.6); p.tap(tl, check(1));
        p.to(tl, $('.g-box', rows[2]), 0.45, '+=0.15'); p.tap(tl, check(2));
        p.to(tl, act, 0.7, '+=0.35'); p.tap(tl, () => act.click());
        p.hide(tl); tl.to({}, { duration: 1.8 });
      },
    };
  };

  // Délicorner — prochaine livraison : quantités, budget qui roule, enregistrement
  const deli = (el) => {
    const rows = $$('.d-row', el).map((r) => ({ r, u: +r.dataset.u, q0: +r.dataset.q, q: +r.dataset.q, out: $('output', r), price: $('.d-price', r) }));
    const total = $('.d-total', el), budget = $('.d-budget', el), units = $('.d-units', el);
    const save = $('.d-save', el), saveTx = $('span', save), note = $('.d-note', el), noteTx = $('span', note);
    const BASE_T = 3442.21, BASE_U = 522;
    let dirty = false, cancel = () => {};
    const render = (instant) => {
      let t = BASE_T, u = BASE_U;
      rows.forEach((x) => { t += x.q * x.u; u += x.q; swap(x.out, String(x.q), instant); roll(x.price, x.q * x.u, eur, instant ? 0 : 0.4); });
      roll(total, t, eur, instant ? 0 : 0.6); roll(budget, t, eur, instant ? 0 : 0.6); roll(units, u, int, instant ? 0 : 0.6);
    };
    const idle = () => { save.classList.remove('load', 'done'); saveTx.textContent = 'Enregistrer'; note.classList.remove('ok'); noteTx.textContent = 'Date limite : bientôt verrouillée'; };
    const setDirty = (v) => { dirty = v; save.classList.toggle('dirty', v); };
    const step = (x, d) => {
      const n = clamp(x.q + d, 0, 99); if (n === x.q) return;
      cancel(); x.q = n; render(); idle(); setDirty(true);
    };
    rows.forEach((x) => {
      $('.d-minus', x.r).addEventListener('click', () => step(x, -1));
      $('.d-plus', x.r).addEventListener('click', () => step(x, 1));
    });
    save.addEventListener('click', () => {
      if (!dirty || save.classList.contains('load')) return;
      save.classList.add('load'); saveTx.textContent = 'Enregistrement';
      cancel = later(0.9, () => { save.classList.remove('load'); save.classList.add('done'); saveTx.textContent = 'Enregistré'; setDirty(false); note.classList.add('ok'); noteTx.textContent = 'Modifications enregistrées'; pop(save); });
    });
    return {
      reset: () => { cancel(); rows.forEach((x) => { x.q = x.q0; }); render(true); idle(); setDirty(false); },
      demo: (tl, p) => {
        const plus = $('.d-plus', rows[0].r), minus = $('.d-minus', rows[2].r);
        p.show(tl, plus); p.to(tl, plus, 0.6); p.tap(tl, () => plus.click());
        tl.to({}, { duration: 0.3 }); p.tap(tl, () => plus.click());
        p.to(tl, minus, 0.6, '+=0.35'); p.tap(tl, () => minus.click());
        p.to(tl, save, 0.7, '+=0.4'); p.tap(tl, () => save.click());
        p.hide(tl); tl.to({}, { duration: 2.4 });
      },
    };
  };

  // AgoraSquare — score de paiement et facture à émettre en glissant
  const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  const agora = (el) => {
    const track = $('.a-slide', el), knob = $('.a-knob', el), fill = $('.a-fill', el), lbl = $('.a-lbl', el), num = $('.a-num', el), ring = $('.a-ring-fg', el);
    const C = 163.4, SCORE = 72;
    let done = false, cancel = () => {};
    const max = () => track.clientWidth - knob.offsetWidth - 8;
    const getX = () => (G ? +G.getProperty(knob, 'x') : 0);
    const paint = (x) => { fill.style.width = x + knob.offsetWidth + 8 + 'px'; lbl.style.opacity = done ? 1 : clamp(1 - (x / max()) * 1.7, 0, 1); };
    const setX = (x) => { if (G) G.set(knob, { x }); else knob.style.transform = `translateX(${x}px)`; paint(x); };
    const score = (instant) => {
      if (!anim || instant) { ring.style.strokeDashoffset = C * (1 - SCORE / 100); num.textContent = SCORE; return; }
      const o = { v: 0 };
      G.to(o, { v: SCORE, duration: 1.5, ease: 'power3.out', onUpdate: () => { ring.style.strokeDashoffset = C * (1 - o.v / 100); num.textContent = int(o.v); } });
    };
    const undo = () => {
      cancel(); done = false; track.classList.remove('done'); lbl.textContent = 'Glisser pour émettre la facture'; knob.innerHTML = ARROW;
      if (anim) G.to(knob, { x: 0, duration: 0.8, ease: 'elastic.out(1, 0.7)', overwrite: true, onUpdate: () => paint(getX()) }); else setX(0);
    };
    const confirm = () => {
      if (done) return;
      done = true; track.classList.add('done'); lbl.textContent = 'Facture F-2041 émise'; knob.innerHTML = CHECK;
      if (anim) G.to(knob, { x: max(), duration: 0.35, ease: 'power3.out', overwrite: true, onUpdate: () => paint(getX()), onComplete: () => pop(knob) }); else setX(max());
      cancel = later(3, undo);
    };
    if (G && window.Draggable) {
      window.Draggable.create(knob, {
        type: 'x', cursor: 'grab', activeCursor: 'grabbing', zIndexBoost: false,
        onPress() { cancel(); G.killTweensOf(knob); this.applyBounds({ minX: 0, maxX: max() }); },
        onDrag() { paint(this.x); },
        onRelease() {
          if (!done) { if (this.x > max() * 0.8) confirm(); else undo(); return; }
          if (this.x < max() * 0.6) { undo(); return; }
          G.to(knob, { x: max(), duration: 0.3, ease: 'power3.out', onUpdate: () => paint(getX()) }); cancel = later(3, undo);
        },
        onClick() { if (done) undo(); },
      });
    }
    knob.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (done) undo(); else confirm(); } });
    knob.innerHTML = ARROW;
    return {
      reset: () => { cancel(); if (G) G.killTweensOf(knob); done = false; track.classList.remove('done'); lbl.textContent = 'Glisser pour émettre la facture'; knob.innerHTML = ARROW; setX(0); score(true); },
      demo: (tl, p) => {
        tl.add(() => score());
        p.show(tl, knob); p.to(tl, knob, 0.7, '+=0.5');
        tl.to(p.el, { scale: 0.82, duration: 0.1 })
          .to(knob, { x: () => max(), duration: 1, ease: 'power2.inOut', onUpdate: () => paint(getX()) })
          .to(p.el, { x: () => '+=' + max(), duration: 1, ease: 'power2.inOut' }, '<')
          .add(() => confirm())
          .to(p.el, { scale: 1, duration: 0.1 });
        p.hide(tl); tl.to({}, { duration: 2.4 });
      },
    };
  };

  // Collecte de documents « de 0 à 100 % » : on dépose, l'analyse tourne, le jeu passe à l'analyse
  const collecte = (el) => {
    const rows = $$('.s-row', el).map((r) => ({ r, btn: $('.s-dep', r), files: +r.dataset.files, done: false }));
    const rowsBox = $('.s-rows', el), badge = $('.s-badge', el), sets = $('.s-sets', el), pct = $('.s-pct', el), bar = $('.s-cov .s-bar u', el);
    const banner = $('.s-banner', el), bant = $('.s-bant', el), drop = $('.s-drop', el);
    const ana = $('.s-ana', el), anat = $('.s-anat', el), anac = $('.s-anac', el), anab = $('.s-ana .s-bar u', el);
    const COV = [52, 68, 84, 100];
    let busy = false, cancels = [];
    const wait = (sec, fn) => cancels.push(later(sec, fn));
    const sync = (instant) => {
      const n = rows.filter((x) => x.done).length, left = rows.length - n;
      roll(sets, 2 + n, int, instant ? 0 : 0.5); roll(pct, COV[n], (v) => int(v) + ' %', instant ? 0 : 0.9);
      bar.style.width = COV[n] + '%'; bar.style.background = left ? '' : '#157a43';
      badge.textContent = left ? left + (left > 1 ? ' documents incomplets' : ' document incomplet') : 'Dossier complet';
      badge.classList.toggle('ok', !left); banner.classList.toggle('ok', !left); rowsBox.classList.toggle('empty', !left);
      bant.textContent = left ? `Collecte partielle · ${2 + n} jeux complets sur 5` : 'Collecte complète · 5 jeux complets sur 5';
    };
    const deposit = (x) => {
      if (busy || x.done) return;
      busy = true;
      x.btn.classList.add('busy'); x.btn.textContent = 'Dépôt'; drop.classList.add('hot');
      ana.classList.add('in'); anat.textContent = 'Analyse en cours'; anab.style.width = '0%'; anac.textContent = `0 / ${x.files} fichiers · 0 %`;
      for (let k = 1; k <= x.files; k++) wait(0.35 + (k * 1.3) / x.files, () => { const v = Math.round((k / x.files) * 100); anab.style.width = v + '%'; anac.textContent = `${k} / ${x.files} fichiers · ${v} %`; });
      wait(1.9, () => { drop.classList.remove('hot'); anat.textContent = 'Analyse terminée'; x.btn.classList.remove('busy'); x.btn.classList.add('done'); x.btn.textContent = 'Transmis'; });
      wait(2.65, () => { x.done = true; x.r.classList.add('gone'); sync(); busy = false; });
      wait(3.9, () => { if (!busy) ana.classList.remove('in'); });
    };
    rows.forEach((x) => x.btn.addEventListener('click', () => deposit(x)));
    return {
      reset: () => {
        cancels.forEach((c) => c()); cancels = []; busy = false;
        rows.forEach((x) => { x.done = false; x.r.classList.remove('gone'); x.btn.className = 's-dep'; x.btn.textContent = 'Déposer'; });
        drop.classList.remove('hot'); ana.classList.remove('in'); sync(true);
      },
      demo: (tl, p) => {
        p.show(tl, rows[0].btn); p.to(tl, rows[0].btn, 0.6); p.tap(tl, () => rows[0].btn.click());
        p.to(tl, rows[1].btn, 0.5, '+=3'); p.tap(tl, () => rows[1].btn.click());
        p.to(tl, rows[2].btn, 0.5, '+=3'); p.tap(tl, () => rows[2].btn.click());
        p.hide(tl); tl.to({}, { duration: 5.4 });
      },
    };
  };

  // Artcurial — ERP iPad « scan-first » : on vise le QR code, la fiche s'ouvre, on range
  const qrSvg = () => {
    let s = 11; const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647;
    const N = 21, cells = [];
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() > 0.52) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
    return `<svg viewBox="0 0 21 21" fill="#0f172a" shape-rendering="crispEdges" aria-hidden="true">${cells.join('')}${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}</svg>`;
  };
  const art = (el) => {
    const vf = $('.r-vf', el), qr = $('.r-qr', el), ret = $('.r-ret', el), hint = $('.r-hint', el), sheet = $('.r-sheet', el);
    const locv = $('.r-locv', el), toast = $('.r-toast', el);
    const SPOTS = [[0.74, 0.34], [0.26, 0.4], [0.6, 0.62]];
    let k = 0, state = 'scan', near = null, cancel = () => {}, q = { x: 0, y: 0 }, pos = { x: 0, y: 0 };
    qr.innerHTML = qrSvg();
    const moveRet = (x, y) => { pos = { x, y }; place(ret, x, y); };
    const lock = () => {
      near = null; state = 'locked'; ret.classList.remove('near'); ret.classList.add('ok'); moveRet(q.x, q.y); hint.textContent = 'Objet reconnu';
      cancel = later(0.85, () => { state = 'sheet'; sheet.classList.add('open'); });
    };
    const check = () => {
      if (state !== 'scan') return;
      if (Math.hypot(pos.x - q.x, pos.y - q.y) < 24) { if (!near) { ret.classList.add('near'); near = later(0.45, lock); } }
      else if (near) { near(); near = null; ret.classList.remove('near'); }
    };
    const init = () => {
      cancel(); if (near) near(); near = null; state = 'scan';
      ret.className = 'r-ret'; sheet.classList.remove('open'); toast.classList.remove('show'); swap(locv, '··', true); hint.textContent = 'Visez le QR code';
      q = { x: vf.clientWidth * SPOTS[k][0], y: (vf.clientHeight - 22) * SPOTS[k][1] + 4 };
      place(qr, q.x - 23, q.y - 23);
      moveRet(vf.clientWidth * 0.2, vf.clientHeight * 0.72);
    };
    const finish = (msg, loc) => {
      if (state !== 'sheet') return;
      state = 'done'; if (loc) swap(locv, loc); toast.textContent = msg; toast.classList.add('show');
      cancel = later(2.8, () => { k = (k + 1) % SPOTS.length; init(); });
    };
    const aim = (e) => {
      if (state !== 'scan') return;
      const b = vf.getBoundingClientRect(), s = b.width / vf.offsetWidth;
      moveRet((e.clientX - b.left) / s, (e.clientY - b.top) / s); check();
    };
    vf.addEventListener('pointermove', aim);
    vf.addEventListener('pointerdown', aim);
    $('.r-range', el).addEventListener('click', () => finish('Rangé en 234A', '234A'));
    $('.r-out', el).addEventListener('click', () => finish('Sortie enregistrée'));
    return {
      reset: init,
      demo: (tl) => {
        const o = { t: 0 };
        const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        tl.to(o, { t: 1, duration: 1.6, ease: 'power2.inOut', onUpdate: () => {
          if (state !== 'scan') return;
          const from = { x: vf.clientWidth * 0.2, y: vf.clientHeight * 0.72 }, mid = { x: vf.clientWidth * 0.5, y: vf.clientHeight * 0.12 };
          const c = mix(mix(from, mid, o.t), mix(mid, q, o.t), o.t);
          moveRet(c.x, c.y); check();
        } }, 0.4)
          .to({}, { duration: 2.3 })
          .add(() => finish('Rangé en 234A', '234A'))
          .to({}, { duration: 3.4 });
      },
    };
  };

  // Action Logement — gouvernance d'un design system : la matrice réagit au survol, l'audit la colore
  const al = (el) => {
    const grid = $('.l-grid', el), tip = $('.l-tip', el), sw = $('.l-switch', el), pct = $('.l-pct', el), fix = $('.l-fix', el), wrap = $('.vl', el);
    const COLS = 31, ROWS = 10, N = COLS * ROWS, STEP = 12;
    const NAMES = ['Button / Primary', 'Input / Text', 'Table / Row', 'Badge / Success', 'Modal / Dialog', 'Tabs / Item', 'Card / Offre', 'Alert / Info', 'Select / Menu', 'Tooltip', 'Stepper', 'Tag / Filtre'];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const warn = new Set(); while (warn.size < 6) warn.add(Math.floor(rnd() * N));
    const dots = [];
    for (let i = 0; i < N; i++) {
      const d = document.createElement('span');
      if (warn.has(i)) d.className = 'w';
      d.style.setProperty('--dl', (i % COLS) * 0.018 + 's');
      grid.append(d); dots.push(d);
    }
    let active = new Set(), raf = 0, pt = null;
    const paint = () => {
      raf = 0;
      const next = new Set();
      if (pt) {
        const c = Math.round((pt.x - 4) / STEP), r = Math.round((pt.y - 4) / STEP);
        for (let y = Math.max(0, r - 5); y <= Math.min(ROWS - 1, r + 5); y++) {
          for (let x = Math.max(0, c - 5); x <= Math.min(COLS - 1, c + 5); x++) {
            const inf = 1 - Math.hypot(x * STEP + 4 - pt.x, y * STEP + 4 - pt.y) / 54;
            if (inf <= 0) continue;
            const i = y * COLS + x;
            dots[i].style.setProperty('--i', inf.toFixed(3)); dots[i].classList.add('hot'); next.add(i);
          }
        }
        const i = clamp(r, 0, ROWS - 1) * COLS + clamp(c, 0, COLS - 1);
        tip.firstElementChild.textContent = NAMES[i % NAMES.length];
        tip.lastElementChild.textContent = warn.has(i) ? 'contraste 3,2:1 · à corriger' : 'contraste ' + (4.6 + ((i * 37) % 70) / 10).toFixed(1).replace('.', ',') + ':1 · AA';
        const g = local(grid, wrap), ox = dots[0].offsetLeft, oy = dots[0].offsetTop;
        place(tip, clamp(g.x + ox + pt.x + 14, 6, wrap.clientWidth - tip.offsetWidth - 6), Math.max(6, g.y + oy + pt.y - 50));
        tip.style.opacity = 1;
      } else tip.style.opacity = 0;
      active.forEach((i) => { if (!next.has(i)) { dots[i].style.setProperty('--i', 0); dots[i].classList.remove('hot'); } });
      active = next;
    };
    const at = (x, y) => { pt = x == null ? null : { x, y }; if (!raf) raf = requestAnimationFrame(paint); };
    grid.addEventListener('pointermove', (e) => {
      const b = grid.getBoundingClientRect(), s = b.width / grid.offsetWidth;
      at((e.clientX - b.left) / s - dots[0].offsetLeft, (e.clientY - b.top) / s - dots[0].offsetTop);
    });
    grid.addEventListener('pointerleave', () => at(null));
    const audit = (on) => {
      sw.setAttribute('aria-checked', String(on)); grid.classList.toggle('audit', on);
      if (on) { pct._o = { v: 0 }; fix._o = { v: 0 }; roll(pct, 98, (v) => int(v) + ' %', 1.3); roll(fix, 6, int, 1.3); }
      else { if (G) G.killTweensOf([pct._o, fix._o].filter(Boolean)); pct.textContent = '··'; fix.textContent = '··'; }
    };
    sw.addEventListener('click', () => audit(sw.getAttribute('aria-checked') !== 'true'));
    return {
      reset: () => { audit(false); at(null); },
      demo: (tl, p) => {
        const o = { t: 0 };
        tl.to(o, { t: 1, duration: 2.6, ease: 'sine.inOut', onUpdate: () => at(18 + o.t * 330, 56 + Math.sin(o.t * Math.PI * 2) * 40), onComplete: () => at(null) }, 0.3);
        p.show(tl, sw); p.to(tl, sw, 0.6); p.tap(tl, () => audit(true));
        p.hide(tl); tl.to({}, { duration: 3 });
      },
    };
  };

  // Agent de design — l'IA propose une correction de tokens, l'humain valide ou refuse
  const agent = (el) => {
    const tools = $$('.ag-tools li', el), say = $('.ag-say', el), rows = $$('.ag-diff tr', el), yes = $('.ag-yes', el), no = $('.ag-no', el), toast = $('.ag-toast', el), time = $('.ag-time', el);
    const TEXT = UI['sc.ag.texte'] || "Le bouton principal a un rayon de 6 px, alors que cartes et champs sont à 12 px. Son anneau de focus est trop pâle pour le niveau AA. Je propose d'aligner les deux.";
    let cancels = [], t0 = 0, ticking = false, decided = false, again = () => {};
    const clear = () => { cancels.forEach((c) => c()); cancels = []; again(); };
    const tick = () => { if (!ticking) return; time.textContent = ((performance.now() - t0) / 1000).toFixed(1).replace('.', DEC) + ' s'; requestAnimationFrame(tick); };
    const words = () => { say.innerHTML = TEXT.split(' ').map((w) => `<span>${w}</span>`).join(' '); return $$('span', say); };
    const reset = () => {
      clear(); ticking = false; decided = false; time.textContent = '0' + DEC + '0 s';
      tools.forEach((li) => li.classList.remove('run', 'ok')); say.textContent = '';
      rows.forEach((r) => r.classList.remove('in', 'done', 'no')); el.classList.remove('applied'); toast.classList.remove('show');
      yes.disabled = no.disabled = true;
    };
    const still = () => { // état statique : la proposition est déjà sur la table
      reset(); tools.forEach((li) => li.classList.add('ok')); words().forEach((s) => s.classList.add('in'));
      rows.forEach((r) => r.classList.add('in')); time.textContent = '4' + DEC + '6 s'; yes.disabled = no.disabled = false;
    };
    const run = () => {
      reset(); t0 = performance.now(); ticking = true; tick();
      tools.forEach((li, k) => {
        cancels.push(later(0.2 + k * 0.7, () => li.classList.add('run')));
        cancels.push(later(0.75 + k * 0.7, () => { li.classList.remove('run'); li.classList.add('ok'); }));
      });
      cancels.push(later(2.4, () => words().forEach((s, k) => cancels.push(later(k * 0.045, () => s.classList.add('in'))))));
      cancels.push(later(4, () => rows.forEach((r, k) => cancels.push(later(k * 0.18, () => r.classList.add('in'))))));
      cancels.push(later(4.6, () => { ticking = false; yes.disabled = no.disabled = false; }));
    };
    const decide = (ok, loop) => {
      if (decided) return;
      decided = true; yes.disabled = no.disabled = true;
      rows.forEach((r) => r.classList.add(ok ? 'done' : 'no')); el.classList.toggle('applied', ok);
      toast.textContent = ok ? (UI['sc.ag.applique'] || 'Appliqué. Rien ne change sans votre accord.') : (UI['sc.ag.ecarte'] || 'Écarté. Le système reste tel quel.'); toast.classList.add('show');
      if (loop) again = later(4.5, anim ? run : still);
    };
    yes.addEventListener('click', () => decide(true, true));
    no.addEventListener('click', () => decide(false, true));
    return {
      reset, still, engage: run,
      demo: (tl, p) => {
        tl.add(run).to({}, { duration: 5 });
        p.show(tl, yes); p.to(tl, yes, 0.7); p.tap(tl, () => decide(true, false));
        p.hide(tl); tl.to({}, { duration: 3.2 });
      },
    };
  };

  /* ==========================================================================
     Expertise & Compétences : six scènes manipulables
     ========================================================================== */

  // UX Research — des verbatims en vrac se rangent par thème ; on peut les déplacer
  const xux = (el) => {
    const stage = $('.x1', el), cols = $$('.x1-cols span', el), count = $('.x1-count', el), insight = $('.x1-insight', el);
    const K = ['#fb7185', '#fbbf24', '#34d399'], CW = 127.33;
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const notes = [];
    for (let i = 0; i < 9; i++) {
      const n = document.createElement('span'); n.className = 'x1-note'; n.setAttribute('aria-hidden', 'true'); stage.insertBefore(n, insight);
      notes.push({ el: n, home: i % 3, k: i % 3, sorted: false, sx: 178 + (rnd() - 0.5) * 170, sy: 98 + (rnd() - 0.5) * 84, sr: (rnd() - 0.5) * 36 });
    }
    const go = (n, x, y, r, instant) => {
      if (anim && !instant) G.to(n.el, { x, y, rotation: r, duration: 0.75, ease: 'back.out(1.3)', overwrite: true });
      else if (G) G.set(n.el, { x, y, rotation: r }); else n.el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const slot = (k, i) => ({ x: 14 + k * CW + 9 + (i % 2) * 51, y: 53 + Math.floor(i / 2) * 40 });
    const paint = (n) => n.el.style.setProperty('--k', K[n.k]);
    const colOf = (x) => clamp(Math.floor((x + 22 - 14) / CW), 0, 2);
    const layout = (instant) => {
      [0, 1, 2].forEach((k) => notes.filter((n) => n.sorted && n.k === k).forEach((n, i) => { const p = slot(k, i); go(n, p.x, p.y, 0, instant); }));
      const done = notes.filter((n) => n.sorted).length;
      count.textContent = done + '/9'; insight.classList.toggle('in', done === 9);
    };
    const scatter = (instant) => { notes.forEach((n) => { n.sorted = false; n.k = n.home; paint(n); go(n, n.sx, n.sy, n.sr, instant); }); layout(instant); };
    if (G && window.Draggable) notes.forEach((n) => window.Draggable.create(n.el, {
      type: 'x,y', bounds: stage,
      onPress() { n.sorted = false; },
      onDrag() { const k = colOf(this.x); cols.forEach((c, j) => c.classList.toggle('hot', j === k)); },
      onRelease() { cols.forEach((c) => c.classList.remove('hot')); n.k = colOf(this.x); n.sorted = true; paint(n); layout(); },
    }));
    return {
      reset: () => scatter(true),
      still: () => { notes.forEach((n) => { n.sorted = true; n.k = n.home; paint(n); }); layout(true); },
      demo: (tl) => {
        tl.to({}, { duration: 0.6 });
        notes.forEach((n) => tl.add(() => { n.sorted = true; layout(); }, '+=0.22'));
        tl.to({}, { duration: 2.8 }).add(() => scatter()).to({}, { duration: 1 });
      },
    };
  };

  // UI Design — les états d'un composant : survol, pression, chargement, succès
  const xui = (el) => {
    const btn = $('.x2-btn', el), lbl = $('span', btn), state = $('.x2-state', el), hex = $('.x2-hex', el), sw = $('.x2-sw', el), sh = $('.x2-shadow', el), minis = $$('.x2-set span', el);
    const S = { default: ['Default', '9A97FF', '0 · 8 · 24'], hover: ['Hover', 'B4B1FF', '0 · 14 · 30'], pressed: ['Pressed', '7F7BF0', '0 · 2 · 8'], loading: ['Loading', '9A97FF', '0 · 8 · 24'], success: ['Success', '34D399', '0 · 8 · 24'] };
    let cur = '', over = false, cancel = () => {};
    const set = (k, instant) => {
      if (k === cur) return;
      cur = k; btn.dataset.s = k; lbl.textContent = k === 'success' ? (UI['sc.x2.enregistre'] || 'Enregistré') : (UI['sc.x2.enregistrer'] || 'Enregistrer');
      swap(state, S[k][0], instant); hex.textContent = S[k][1]; sw.style.background = '#' + S[k][1]; sh.textContent = S[k][2];
      minis.forEach((m) => m.classList.toggle('on', m.dataset.s === k));
    };
    const run = () => { cancel(); set('loading'); cancel = later(1.1, () => { set('success'); cancel = later(1.5, () => set(over ? 'hover' : 'default')); }); };
    btn.addEventListener('pointerenter', () => { over = true; if (cur === 'default') set('hover'); });
    btn.addEventListener('pointerleave', () => { over = false; if (cur === 'hover' || cur === 'pressed') set('default'); });
    btn.addEventListener('pointerdown', () => { if (cur === 'hover' || cur === 'default') set('pressed'); });
    btn.addEventListener('click', () => { if (cur !== 'loading' && cur !== 'success') run(); });
    return {
      reset: () => { cancel(); over = false; cur = ''; set('default', true); },
      demo: (tl, p) => {
        p.show(tl, btn); p.to(tl, btn, 0.7);
        tl.add(() => set('hover')).to({}, { duration: 0.7 }).add(() => set('pressed'))
          .to(p.el, { scale: 0.8, duration: 0.1 }).to(p.el, { scale: 1, duration: 0.1 }).add(run).to({}, { duration: 1.3 });
        p.hide(tl); tl.to({}, { duration: 2.3 });
      },
    };
  };

  // Design Thinking — double diamant : les idées divergent, convergent, puis recommencent
  const xdt = (el) => {
    const svg = $('.x3-svg', el), g = $('.x3-dots', el), labels = $$('.x3-labels span', el), mid = $('.x3-mid', el), end = $('.x3-end', el), done = $('.x3-done', el);
    const NS = 'http://www.w3.org/2000/svg', N = 9, F1 = [], F2 = [], dots = [];
    for (let i = 0; i < N; i++) { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '2.6'); g.append(c); dots.push(c); F1.push(-0.86 + (1.72 * i) / (N - 1)); }
    [4, 0, 7, 2, 8, 1, 5, 3, 6].forEach((k) => F2.push(F1[k]));
    const half = (x) => 64 * (1 - Math.abs(((x - 30) % 170) - 85) / 85);
    const setT = (t) => {
      dots.forEach((c, i) => {
        const ti = clamp(t - i * 0.012, 0, 1), x = 30 + 340 * ti, f = ti < 0.5 ? F1[i] : F2[i];
        c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', (124 + f * half(x) * 0.86).toFixed(1));
      });
      const ph = Math.min(3, Math.floor(t * 4));
      labels.forEach((l, i) => l.classList.toggle('on', i === ph));
      mid.classList.toggle('on', t >= 0.5);
      const fin = t > 0.985; end.classList.toggle('on', fin); done.classList.toggle('in', fin);
    };
    svg.addEventListener('pointermove', (e) => { const b = svg.getBoundingClientRect(); setT(clamp((((e.clientX - b.left) / b.width) * 400 - 30) / 340, 0, 1)); });
    return {
      reset: () => setT(0),
      still: () => setT(0.3),
      demo: (tl) => { const o = { t: 0 }; tl.to(o, { t: 1, duration: 4.4, ease: 'power1.inOut', onUpdate: () => setT(o.t) }, 0.4).to({}, { duration: 1.9 }); },
    };
  };

  // Outils & Tech — un cadre en auto-layout : le curseur attrape exactement le coin et le contenu se réorganise
  const xtools = (el) => {
    const frame = $('.x4-frame', el), handle = $('.x4-h.br', el), dim = $('.x4-dim', el), fitEl = $('.sc-fit', el);
    const size = { w: 190, h: 124 };
    const setSize = (w, h) => {
      size.w = clamp(w, 150, 310); size.h = clamp(h, 110, 158);
      frame.style.setProperty('--w', size.w + 'px'); frame.style.setProperty('--h', size.h + 'px');
      dim.textContent = Math.round(size.w) + ' × ' + Math.round(size.h); handle.setAttribute('aria-valuenow', String(Math.round(size.w)));
    };
    let drag = null;
    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      drag = { x: e.clientX, y: e.clientY, w: size.w, h: size.h, k: fitEl.getBoundingClientRect().width / fitEl.offsetWidth || 1 };
      try { handle.setPointerCapture(e.pointerId); } catch (_) { /* pointeur déjà relâché */ }
    });
    handle.addEventListener('pointermove', (e) => { if (drag) setSize(drag.w + (e.clientX - drag.x) / drag.k, drag.h + (e.clientY - drag.y) / drag.k); });
    const end = () => { drag = null; };
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => { const d = { ArrowRight: [10, 0], ArrowLeft: [-10, 0], ArrowDown: [0, 6], ArrowUp: [0, -6] }[e.key]; if (d) { e.preventDefault(); setSize(size.w + d[0], size.h + d[1]); } });
    return {
      reset: () => setSize(190, 124),
      demo: (tl, p) => {
        const o = { w: 190, h: 124 };
        const tip = () => ({ x: 44 + size.w, y: 42 + size.h }); // centre exact de la poignée
        const drive = () => { setSize(o.w, o.h); G.set(p.el, tip()); };
        tl.set(p.el, { x: 336, y: 206, scale: 1 }).to(p.el, { opacity: 1, duration: 0.2 })
          .to(p.el, { x: () => tip().x, y: () => tip().y, duration: 0.7, ease: 'power2.inOut' })
          .to(p.el, { scale: 0.82, duration: 0.1 })
          .to(o, { w: 300, h: 150, duration: 1.2, ease: 'power2.inOut', onUpdate: drive }, '+=0.1')
          .to(o, { w: 152, h: 156, duration: 1.3, ease: 'power2.inOut', onUpdate: drive }, '+=0.6')
          .to(o, { w: 190, h: 124, duration: 0.9, ease: 'power2.inOut', onUpdate: drive }, '+=0.6')
          .to(p.el, { scale: 1, duration: 0.1 });
        p.hide(tl); tl.to({}, { duration: 1 });
      },
    };
  };

  // MCP Design — un agent appelle Storybook, Figma et Notion à travers un serveur MCP
  const xmcp = (el) => {
    const edges = $$('.x5-e', el), pulse = $('.x5-p', el), tools = $$('.x5-tool', el), log = $('.x5-log', el);
    const CALLS = ['storybook.read', 'figma.update', 'notion.append'];
    let run = null;
    const along = (path, o, rev) => { const pt = path.getPointAtLength((rev ? 1 - o.p : o.p) * path.getTotalLength()); pulse.setAttribute('cx', pt.x); pulse.setAttribute('cy', pt.y); };
    const line = (t) => {
      const li = document.createElement('li'); li.textContent = CALLS[t]; log.append(li);
      while (log.children.length > 5) log.firstElementChild.remove();
      requestAnimationFrame(() => li.classList.add('in'));
    };
    const mark = (t, on) => { tools[t].classList.toggle('on', on); edges[t].classList.toggle('on', on); edges[3].classList.toggle('on', on); };
    const call = (t) => {
      if (!anim) { line(t); return; }
      if (run) run.progress(1);
      const o = { p: 0 };
      const hop = (path, rev, d) => ({ p: 1, duration: d, ease: 'none', onUpdate: () => along(path, o, rev) });
      run = G.timeline({ onComplete: () => { run = null; } })
        .add(() => mark(t, true)).set(pulse, { opacity: 1 })
        .fromTo(o, { p: 0 }, hop(edges[3], true, 0.3))      // agent → MCP
        .fromTo(o, { p: 0 }, hop(edges[t], true, 0.45))     // MCP → outil
        .add(() => pop(tools[t]))
        .fromTo(o, { p: 0 }, hop(edges[t], false, 0.45), '+=0.15') // outil → MCP
        .fromTo(o, { p: 0 }, hop(edges[3], false, 0.3))     // MCP → agent
        .set(pulse, { opacity: 0 })
        .add(() => { line(t); mark(t, false); });
    };
    tools.forEach((b) => b.addEventListener('click', () => call(+b.dataset.t)));
    return {
      reset: () => { if (run) { run.kill(); run = null; } if (G) G.set(pulse, { opacity: 0 }); tools.forEach((_, t) => mark(t, false)); log.innerHTML = ''; },
      still: () => { log.innerHTML = ''; CALLS.forEach((_, t) => line(t)); },
      demo: (tl) => { tl.to({}, { duration: 0.5 }).add(() => call(0)).to({}, { duration: 2 }).add(() => call(1)).to({}, { duration: 2 }).add(() => call(2)).to({}, { duration: 3.2 }); },
    };
  };

  // AI-Ready — ce que produit l'IA traverse le design system : lisible, tout s'aligne ; coupé, les écarts passent
  const xai = (el) => {
    const stage = $('.x6', el), lane = $('.x6-lane', el), sw = $('.x6-sw', el), gap = $('.x6-gap', el);
    const RAW = [[34, 22, 0, '#fb7185'], [58, 48, 24, '#fbbf24'], [28, 40, 4, '#60a5fa'], [64, 18, 9, '#f472b6'], [40, 54, 27, '#a3e635'], [52, 30, 0, '#fb923c'], [30, 30, 15, '#22d3ee'], [60, 42, 3, '#e879f9']];
    const SPAN = 480, SPEED = 46, GATE = 200;
    const blocks = RAW.map((r, i) => {
      const b = document.createElement('i'); b.className = 'x6-b';
      b.style.setProperty('--rw', r[0] + 'px'); b.style.setProperty('--rh', r[1] + 'px'); b.style.setProperty('--rr', r[2] + 'px'); b.style.setProperty('--rc', r[3]);
      b.style.setProperty('--cc', i % 3 === 0 ? '#9a97ff' : '#2f3146');
      lane.prepend(b);
      return { el: b, base: (i * SPAN) / RAW.length, y: 0, rot: 0, jit: 0, ph: i * 1.7, clean: null };
    });
    let on = true, t = 0, raf = 0, lastTs = 0;
    const frame = (dt) => {
      t += dt; let bad = 0;
      blocks.forEach((b) => {
        const x0 = ((b.base + t * SPEED) % SPAN) - 40, clean = on && x0 > GATE;
        if (clean !== b.clean) { b.clean = clean; b.el.classList.toggle('clean', clean); }
        if (!clean && x0 > GATE + 30 && x0 < 420) bad++;
        const ty = clean ? 0 : Math.sin(t * 2.1 + b.ph) * 20, tr = clean ? 0 : Math.sin(t * 1.6 + b.ph * 2) * 13, tj = clean ? 0 : Math.sin(t * 2.7 + b.ph) * 12;
        b.y += (ty - b.y) * 0.14; b.rot += (tr - b.rot) * 0.14; b.jit += (tj - b.jit) * 0.14;
        b.el.style.transform = `translate(${(x0 + b.jit).toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${b.rot.toFixed(1)}deg)`;
      });
      const txt = bad > 1 ? (UI['sc.x6.plusieurs'] || '{k} écarts').replace('{k}', bad) : bad ? (UI['sc.x6.un'] || '1 écart') : (UI['sc.x6.zero'] || '0 écart');
      if (gap.textContent !== txt) gap.textContent = txt;
    };
    const loop = (ts) => { const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016; lastTs = ts; frame(dt); raf = requestAnimationFrame(loop); };
    const setOn = (v) => { on = v; sw.setAttribute('aria-checked', String(v)); stage.classList.toggle('off', !v); };
    sw.addEventListener('click', () => setOn(!on));
    t = 3; frame(0);
    return {
      reset: () => setOn(true),
      run: (go) => { if (go && !raf && anim) { lastTs = 0; raf = requestAnimationFrame(loop); } else if (!go && raf) { cancelAnimationFrame(raf); raf = 0; } },
      demo: (tl, p) => {
        tl.to({}, { duration: 3.2 }); p.show(tl, sw); p.to(tl, sw, 0.6); p.tap(tl, () => setOn(false));
        tl.to({}, { duration: 3.6 }); p.tap(tl, () => setOn(true)); p.hide(tl); tl.to({}, { duration: 2.8 });
      },
    };
  };

  /* ---------- Enregistrement des scènes, démonstrations automatiques, prise en main ---------- */
  const FACTORY = { gouv, deli, agora, collecte, art, al, agent, xux, xui, xdt, xtools, xmcp, xai };
  const scenes = [];
  const isLive = (el) => { const b = el.closest('.board'); return !b || b.classList.contains('is-live'); };

  const register = (el) => {
    const api = FACTORY[el.dataset.scene](el);
    const rootEl = $('.sc-fit', el) || el, ptrEl = $('.sc-ptr', el);
    const group = el.closest('.board') ? 'board' : el.closest('.expertise-grid') ? 'xp' : 'agent';
    const rank = scenes.filter((x) => x.group === group).length;
    const sc = { el, api, tl: null, engaged: false, timer: 0, group, on: false };
    const ptr = ptrEl ? makePtr(rootEl, ptrEl) : null;
    api.reset();
    if (!anim && api.still) api.still();
    sc.build = () => {
      if (!anim) return;
      if (sc.tl) sc.tl.kill();
      api.reset(); if (ptrEl) G.set(ptrEl, { opacity: 0 });
      sc.tl = G.timeline({ paused: true, repeat: -1, repeatDelay: 1.2, delay: group === 'board' ? rank * 0.85 : group === 'xp' ? rank * 0.45 : 0.4, onRepeat: () => api.reset() });
      api.demo(sc.tl, ptr);
    };
    // une scène masquée (display: none, par exemple sur téléphone) ne joue pas
    sc.sync = () => { const go = sc.on && el.getClientRects().length > 0; if (api.run) api.run(go); if (!sc.tl) return; if (go && !sc.engaged) sc.tl.play(); else sc.tl.pause(); };
    const engage = () => {
      if (!isLive(el)) return;
      clearTimeout(sc.timer); if (sc.engaged) return;
      sc.engaged = true;
      if (sc.tl) sc.tl.pause(0);
      if (ptrEl && G) G.set(ptrEl, { opacity: 0 });
      api.reset(); if (api.engage) api.engage(); else if (!anim && api.still) api.still();
    };
    el.addEventListener('pointerenter', engage);
    el.addEventListener('pointermove', engage, { passive: true });
    el.addEventListener('pointerdown', engage);
    el.addEventListener('pointerleave', () => {
      if (!sc.engaged) return;
      clearTimeout(sc.timer);
      sc.timer = setTimeout(() => { sc.engaged = false; if (!anim) return; api.reset(); if (sc.tl) { sc.tl.restart(); sc.sync(); } }, 2600);
    });
    scenes.push(sc);
  };

  const setGroup = (group, on) => scenes.forEach((sc) => { if (sc.group === group) { sc.on = on; sc.sync(); } });

  /* ---------- Liseré lumineux, accent vivant ---------- */
  const lightUp = (container, sel) => {
    if (!container || !fine) return;
    const cards = $$(sel, container);
    cards.forEach((c) => { if (!$(':scope > .fx-light', c)) { const i = document.createElement('i'); i.className = 'fx-light'; i.setAttribute('aria-hidden', 'true'); c.append(i); } });
    let raf = 0, ev = null;
    const run = () => {
      raf = 0;
      cards.forEach((c) => {
        const b = c.getBoundingClientRect(), s = b.width / c.offsetWidth || 1;
        c.style.setProperty('--mx', (ev.clientX - b.left) / s + 'px'); c.style.setProperty('--my', (ev.clientY - b.top) / s + 'px'); c.style.setProperty('--lit', 1);
      });
    };
    container.addEventListener('pointermove', (e) => { ev = e; if (!raf) raf = requestAnimationFrame(run); });
    container.addEventListener('pointerleave', () => cards.forEach((c) => c.style.setProperty('--lit', 0)));
  };
  // mix : --acc est défini sur chaque .v3zone (et non sur body) : l'accent du produit survolé s'y pose
  const zones = $$('.v3zone');
  const accent = () => {
    $$('.sc, .pj, .ag').forEach((el) => {
      el.addEventListener('pointerenter', () => { if (isLive(el)) { const c = getComputedStyle(el).getPropertyValue('--c').trim(); zones.forEach((z) => z.style.setProperty('--acc', c)); } });
      el.addEventListener('pointerleave', () => zones.forEach((z) => z.style.removeProperty('--acc')));
    });
  };

  /* ---------- Curseur compagnon et boutons aimantés ---------- */
  const cursor = () => {
    const c = $('.cur3'); if (!c || !fine) return;
    const lab = $('span', c);
    const setX = G ? G.quickTo(c, 'x', { duration: 0.2, ease: 'power3' }) : null, setY = G ? G.quickTo(c, 'y', { duration: 0.2, ease: 'power3' }) : null;
    const t = (key, fb) => (key && window.__i18n && window.__i18n.t ? window.__i18n.t(key, fb) : fb);
    let px = -1, py = -1, sraf = 0;
    const read = (el) => {
      if (!el) return;
      // mix : curseur compagnon visible seulement au-dessus des zones V (la galerie de F a son propre curseur)
      c.classList.toggle('in-zone', !!el.closest('.v3zone'));
      const big = el.closest('[data-cur-big]'), sc = el.closest('[data-cur]'), live = !!sc && isLive(sc);
      const text = big ? t(big.dataset.curKey, big.dataset.curBig) : live ? (($('.sc-tag, .xv-tag', sc) || {}).textContent || sc.dataset.cur) : '';
      if (text && lab.textContent !== text) lab.textContent = text;
      c.classList.toggle('off', live && !!el.closest('.r-vf'));
      c.classList.toggle('big', !!big);
      c.classList.toggle('lbl', !big && live);
      c.classList.toggle('sm', !big && !live && !!el.closest('a, button, label, input'));
    };
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY;
      c.classList.add('on');
      if (G) { setX(px); setY(py); } else place(c, px, py);
      read(e.target instanceof Element ? e.target : null);
    }, { passive: true });
    addEventListener('scroll', () => { if (px < 0 || sraf) return; sraf = requestAnimationFrame(() => { sraf = 0; read(document.elementFromPoint(px, py)); }); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.remove('on'));
  };
  const magnets = () => {
    if (!full || !fine) return;
    $$('[data-mag]').forEach((el) => {
      const x = G.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), y = G.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => { const b = el.getBoundingClientRect(); x((e.clientX - b.left - b.width / 2) * 0.28); y((e.clientY - b.top - b.height / 2) * 0.36); });
      el.addEventListener('pointerleave', () => { G.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' }); });
    });
  };

  /* ---------- Hero : intro, puis planche inclinée qui se redresse au scroll ---------- */
  const splitWords = (el) => {
    if (!el || $('.w3i', el)) return $$('.w3i', el || document.createElement('div'));
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 1) return walk(n);
      if (n.nodeType !== 3) return;
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach((p) => {
        if (!p) return;
        if (/^\s+$/.test(p)) { f.append(' '); return; }
        const w = document.createElement('span'), wi = document.createElement('span');
        w.className = 'w3'; wi.className = 'w3i'; wi.textContent = p; w.append(wi); f.append(w);
      });
      n.replaceWith(f);
    });
    walk(el);
    return $$('.w3i', el);
  };

  let introDone = false;
  const intro = () => {
    if (introDone) return;
    introDone = true;
    fitAll();
    root.classList.add('v3-in');
    scenes.forEach((sc) => { sc.build(); sc.sync(); });
    // mix : pas de hero V (planche) dans le mix : son intro animée est retirée
    if (ST) ST.refresh();
  };

  const hero = () => {
    const pin = $('.h3-pin'), board = $('#board');
    if (!pin || !board) return;
    if (!(full && ST)) { board.classList.add('is-live'); return; }
    const tilt = $('.bd-tilt'), mouse = $('.bd-mouse'), copy = $('.h3-copy'), head = $('.bd-head'), fade = $('.h3-fade'), hint = $('.h3-hint'), cards = $$('.sc', board);
    const depth = [26, 60, 14, 44, 70, 30];
    const mm = G.matchMedia();
    mm.add('(min-width: 1100px)', () => {
      root.classList.add('v3-pin'); board.classList.remove('is-live');
      let k = 1, flat = null;
      const tl = G.timeline({ scrollTrigger: {
        trigger: pin, start: 'top top', end: '+=135%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: (s) => { const live = s.progress > 0.9; k = live ? 0 : 1 - s.progress; board.classList.toggle('is-live', live); if (live && flat) flat(); },
      } });
      tl.fromTo(tilt, { rotationX: 48, rotationZ: -9, scale: 0.7, y: () => innerHeight * 0.3 }, { rotationX: 0, rotationZ: 0, scale: 1, y: 0, duration: 0.8, ease: 'power2.inOut' }, 0)
        .fromTo(cards, { z: (i) => depth[i % depth.length] }, { z: 0, duration: 0.8, ease: 'power2.inOut' }, 0)
        .fromTo(board, { '--plane': 1 }, { '--plane': 0, duration: 0.6, ease: 'none' }, 0)
        .fromTo(copy, { autoAlpha: 1, yPercent: 0 }, { autoAlpha: 0, yPercent: -22, duration: 0.3, ease: 'power1.in' }, 0)
        .fromTo([fade, hint], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3, ease: 'none' }, 0.05)
        .fromTo(head, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' }, 0.58)
        .to({}, { duration: 0.2 });
      const rx = G.quickTo(mouse, 'rotationX', { duration: 1, ease: 'power3' }), ry = G.quickTo(mouse, 'rotationY', { duration: 1, ease: 'power3' });
      flat = () => { rx(0); ry(0); };
      const onMove = (e) => { ry((e.clientX / innerWidth - 0.5) * 8 * k); rx(-(e.clientY / innerHeight - 0.5) * 6 * k); };
      if (fine) addEventListener('pointermove', onMove, { passive: true });
      return () => {
        removeEventListener('pointermove', onMove);
        root.classList.remove('v3-pin'); board.classList.add('is-live');
        G.set([tilt, mouse, copy, head, fade, hint, ...cards], { clearProps: 'all' });
      };
    });
    mm.add('(max-width: 1099px)', () => { root.classList.remove('v3-pin'); board.classList.add('is-live'); });
  };

  /* ---------- Carrousel de la planche (mobile et tablette) : repère de position ---------- */
  const boardDots = () => {
    const board = $('#board'), fit = $('.bd-fit');
    if (!board || !fit) return;
    const cards = $$('.sc', board), dots = document.createElement('div');
    dots.className = 'bd-dots';
    const btns = cards.map((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.setProperty('--c', getComputedStyle(c).getPropertyValue('--c').trim());
      b.addEventListener('click', () => board.scrollTo({ left: c.offsetLeft - (board.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' }));
      dots.append(b);
      return b;
    });
    // le nom du produit sert de libellé accessible ; il suit le changement de langue
    const label = () => btns.forEach((b, i) => b.setAttribute('aria-label', ($('.sc-co b', cards[i]) || {}).textContent || String(i + 1)));
    label();
    document.addEventListener('i18n:updated', label);
    fit.after(dots);
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = board.scrollLeft + board.clientWidth / 2;
      let best = 0, d = Infinity;
      cards.forEach((c, i) => { const k = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (k < d) { d = k; best = i; } });
      btns.forEach((b, i) => { b.classList.toggle('on', i === best); if (i === best) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    };
    board.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update);
    update();
  };

  /* ---------- Bandeau clients, projets, apparitions ---------- */
  const marquee = () => {
    const t = $('.cl3-track'); if (!t || !anim) return;
    $$('img', t).forEach((img) => { const c = img.cloneNode(true); c.alt = ''; c.setAttribute('aria-hidden', 'true'); t.append(c); });
    let x = 0, boost = 0, period = 0;
    const measure = () => { period = (t.scrollWidth + parseFloat(getComputedStyle(t).columnGap || 0)) / 2; };
    // en mouvement réduit, le bandeau défile à vitesse constante, sans accélération ni inclinaison au défilement
    if (ST && full) ST.create({ onUpdate: (s) => { boost = Math.min(Math.abs(s.getVelocity()) / 260, 12); } });
    addEventListener('resize', measure);
    G.ticker.add(() => {
      if (!period) measure();
      boost *= 0.93; x -= 0.6 + boost;
      if (period && -x >= period) x += period;
      G.set(t, { x, skewX: -boost * 0.6 });
    });
  };

  const projects = () => {
    const cards = $$('.pj');
    if (full && ST) {
      cards.forEach((card, i) => {
        const inner = $('.pj-in', card), media = $('.pj-media', card), next = cards[i + 1];
        const st = { trigger: card, start: 'top 96%', end: 'top 14%', scrub: 0.4 };
        G.fromTo(media, { clipPath: 'inset(12% 12% 12% 12% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', ease: 'none', scrollTrigger: st });
        G.fromTo($('img', media), { scale: 1.28 }, { scale: 1.06, ease: 'none', scrollTrigger: st });
        G.from($$('.pj-info > *', card), { opacity: 0, y: 34, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: card, start: 'top 58%', once: true } });
        if (next) G.fromTo(inner, { scale: 1, filter: 'brightness(1)' }, { scale: 0.92, filter: 'brightness(0.55)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 78%', end: 'top 11%', scrub: true } });
      });
    }
    if (!fine) return;
    // L'image suit légèrement la souris
    if (full) $$('.pj-media img').forEach((img) => {
      const m = img.parentElement, x = G.quickTo(img, 'x', { duration: 0.8, ease: 'power3' }), y = G.quickTo(img, 'y', { duration: 0.8, ease: 'power3' });
      m.addEventListener('pointermove', (e) => { const b = m.getBoundingClientRect(); x(-((e.clientX - b.left) / b.width - 0.5) * 22); y(-((e.clientY - b.top) / b.height - 0.5) * 16); });
      m.addEventListener('pointerleave', () => { x(0); y(0); });
    });
    // Délicorner : la scène immersive avance et recule avec la position de la souris
    $$('[data-scrub]').forEach((m) => {
      const v = $('video', m); if (!v) return;
      let dur = 0, target = 0, cur = 0, raf = 0, loaded = false;
      v.addEventListener('loadedmetadata', () => { dur = v.duration || 0; });
      v.addEventListener('error', () => { m.classList.remove('scrub'); v.remove(); });
      const loop = () => {
        cur += (target - cur) * 0.16;
        if (dur && !v.seeking && Math.abs(v.currentTime - cur) > 0.03) v.currentTime = cur;
        raf = requestAnimationFrame(loop);
      };
      m.addEventListener('pointerenter', () => {
        if (!v.isConnected) return;
        if (!loaded) { loaded = true; v.src = v.dataset.src; v.load(); }
        m.classList.add('scrub'); if (!raf) raf = requestAnimationFrame(loop);
      });
      m.addEventListener('pointermove', (e) => { const b = m.getBoundingClientRect(); target = clamp((e.clientX - b.left) / b.width, 0, 1) * Math.max(0, dur - 0.08); });
      m.addEventListener('pointerleave', () => { m.classList.remove('scrub'); cancelAnimationFrame(raf); raf = 0; });
    });
  };

  const reveals = () => {
    if (!(full && ST)) return;
    // mix : filet de sécurité — si le moteur d'animation est figé (onglet en arrière-plan, panneau gelé),
    // un IntersectionObserver + minuterie (sans requestAnimationFrame) pose l'état final des éléments restés masqués.
    const guard = (tw, list) => {
      const io = new IntersectionObserver((en) => {
        if (!en.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setTimeout(() => { if (tw.progress() < 1 || list.some((el) => +getComputedStyle(el).opacity < 0.99)) { tw.progress(1); tw.kill(); G.set(list, { clearProps: 'opacity,transform' }); } }, 3200);
      });
      list.forEach((el) => io.observe(el));
    };
    const up = (targets, trigger, extra = {}) => { const list = $$(targets); if (list.length) guard(G.from(list, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: trigger || list[0], start: 'top 84%', once: true }, ...extra }), list); };
    up('.band-copy > *, .band-stat', '.band');
    up('.ai3-copy > *', '.ai3');
    up('.ag', '.ag', { y: 70, duration: 1.2 });
    up('.pj3-head > *', '.pj3-head');
    up('.awards-section .section-title', '.awards-section');
    up('.expertise-card', '.expertise-grid', { y: 60, stagger: 0.07 });
    up('.ct3-in > *', '.ct3', { y: 50, stagger: 0.1 });
  };

  /* ---------- Contact : lampe torche sur le titre, halo, bouton qui libère des composants ---------- */
  const contact = () => {
    const sec = $('.ct3'); if (!sec) return;
    const title = $('.ct3-title', sec), glow = $('.ct3-glow', sec), wrap = $('.ct3-bigw', sec), big = $('.ct3-big', sec);
    if (G) G.set(glow, { x: () => sec.clientWidth * 0.3, y: 280 });
    if (!fine) return;
    const gx = G ? G.quickTo(glow, 'x', { duration: 1.1, ease: 'power3' }) : null, gy = G ? G.quickTo(glow, 'y', { duration: 1.1, ease: 'power3' }) : null;
    sec.addEventListener('pointermove', (e) => {
      const s = sec.getBoundingClientRect(), b = title.getBoundingClientRect();
      title.style.setProperty('--sx', e.clientX - b.left + 'px'); title.style.setProperty('--sy', e.clientY - b.top + 'px'); title.style.setProperty('--sr', '360px');
      if (gx) { gx(e.clientX - s.left); gy(e.clientY - s.top); }
    }, { passive: true });
    sec.addEventListener('pointerleave', () => ['--sx', '--sy', '--sr'].forEach((k) => title.style.removeProperty(k)));
    if (!full || !wrap || !big) return;
    const ATOMS = [['at-toggle', ''], ['at-badge', 'RGAA AA'], ['at-btn', UI['sc.ct.valider'] || 'Valider'], ['at-check', '✓'], ['at-chip', 'tokens.json'], ['at-slider', ''], ['at-chip', 'DSFR'], ['at-badge', 'AI-ready']];
    const atoms = ATOMS.map(([cls, txt]) => { const a = document.createElement('span'); a.className = 'ct3-atom ' + cls; a.textContent = txt; a.setAttribute('aria-hidden', 'true'); wrap.append(a); return a; });
    G.set(atoms, { scale: 0.4 });
    const open = () => atoms.forEach((a, i) => {
      const ang = ((150 + i * (175 / (atoms.length - 1))) * Math.PI) / 180, r = big.offsetWidth / 2 + 62 + (i % 2) * 40;
      G.to(a, { x: Math.cos(ang) * r, y: Math.sin(ang) * r, opacity: 1, scale: 1, rotation: (i % 2 ? 1 : -1) * (5 + i * 2), duration: 0.8, delay: i * 0.035, ease: 'back.out(1.8)', overwrite: true });
    });
    const close = () => atoms.forEach((a, i) => G.to(a, { x: 0, y: 0, opacity: 0, scale: 0.4, rotation: 0, duration: 0.4, delay: i * 0.02, ease: 'power3.in', overwrite: true }));
    big.addEventListener('pointerenter', open); big.addEventListener('pointerleave', close);
    big.addEventListener('focus', open); big.addEventListener('blur', close);
  };

  /* ---------- Prise de rendez-vous : carte dans la page (Calendly chargé à la première ouverture) ---------- */
  const rdv = () => {
    const dlg = $('#rdv');
    if (!dlg || typeof dlg.showModal !== 'function') return; // sans <dialog>, le lien ouvre Calendly comme avant
    const card = $('.rdv-card', dlg), frame = $('iframe', dlg);
    // mix : le défilement Lenis de F s'arrête tant que la carte est ouverte ; le focus revient à l'élément d'origine
    const lenis = () => (window.FM && window.FM.lenis) || null;
    let back = null;
    dlg.addEventListener('close', () => { const l = lenis(); if (l) l.start(); if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); back = null; });
    const open = () => {
      if (dlg.open) return;
      back = document.activeElement !== document.body ? document.activeElement : null;
      { const l = lenis(); if (l) l.stop(); }
      if (!frame.getAttribute('src')) {
        const u = new URL(frame.dataset.src);
        u.searchParams.set('embed_domain', location.hostname || 'localhost'); u.searchParams.set('embed_type', 'Inline'); u.searchParams.set('hide_gdpr_banner', '1');
        frame.addEventListener('load', () => dlg.classList.add('ready'), { once: true });
        frame.src = u.toString();
      }
      dlg.showModal();
      if (full) G.fromTo(card, { y: 44, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.65, ease: 'expo.out', overwrite: true });
    };
    const close = () => {
      if (!dlg.open) return;
      if (!full) { dlg.close(); return; }
      G.to(card, { y: 24, scale: 0.97, opacity: 0, duration: 0.22, ease: 'power2.in', overwrite: true, onComplete: () => dlg.close() });
    };
    $$('[data-rdv]').forEach((a) => a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // nouvel onglet demandé : on laisse faire
      e.preventDefault(); open();
    }));
    $$('[data-rdv-close]', dlg).forEach((b) => b.addEventListener('click', close));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    addEventListener('message', (e) => {
      if (e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
      if (e.data.event === 'calendly.event_scheduled') dlg.classList.add('booked');
    });
    // mix : ouverture depuis la palette de commandes de F
    window.FMV = window.FMV || {};
    window.FMV.openRdv = () => { open(); return true; };
  };

  /* ---------- mix : barre de navigation de V (reprise du nécessaire de js/nav.js, sans ses effets de bord) ----------
     nav.js n'est pas chargé : il attache un scrollIntoView à TOUS les liens « # » de la page (conflit avec Lenis et la
     palette de F). Ici : réduction au défilement (.scrolled), menu téléphone (is-nav-open sur body et sur la zone de
     l'en-tête, qui porte les sélecteurs confinés), tabindex des liens masqués, Échap / clic extérieur / clic sur un
     lien pour fermer, focus rendu au bouton, lien actif (aria-current) qui suit le défilement. Le défilement et le
     focus de la section sont faits par le gestionnaire des liens « # » de js/accueil.js. */
  const nav = () => {
    const header = $('#header'), toggle = $('.nav-toggle'), list = $('#primary-navigation');
    if (!header || !toggle || !list) return;
    const zone = header.closest('.v3zone'), links = $$('a[href^="#"]', list), mq = matchMedia('(max-width: 640px)');
    const onScroll = () => header.classList.toggle('scrolled', (window.scrollY || 0) > 100);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const isOpen = () => document.body.classList.contains('is-nav-open');
    const tabs = () => {
      links.forEach((a) => { if (mq.matches && !isOpen()) a.setAttribute('tabindex', '-1'); else a.removeAttribute('tabindex'); });
      if (mq.matches) toggle.removeAttribute('tabindex'); else toggle.setAttribute('tabindex', '-1');
    };
    const set = (open, refocus) => {
      document.body.classList.toggle('is-nav-open', open); if (zone) zone.classList.toggle('is-nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? UI['nav.fermer'] : UI['nav.ouvrir']);
      tabs();
      if (!open && refocus) toggle.focus({ preventScroll: true });
    };
    toggle.setAttribute('aria-label', UI['nav.ouvrir'] || toggle.getAttribute('aria-label'));
    tabs();
    mq.addEventListener('change', () => { if (!mq.matches && isOpen()) set(false); else tabs(); });
    toggle.addEventListener('click', () => set(!isOpen()));
    [...links, $('a.logo', header)].filter(Boolean).forEach((a) => a.addEventListener('click', () => { if (isOpen()) set(false); }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { e.stopPropagation(); set(false, true); } });
    document.addEventListener('pointerdown', (e) => { if (isOpen() && !header.contains(e.target)) set(false); });
    // lien actif : Accueil jusqu'aux projets (comme nav.js : marques et IA comptent pour l'accueil), puis Projets, À propos, Contact
    const map = [['#accueil', '#accueil'], ['#projets', '#projets'], ['#expertise', '#expertise'], ['#contact', '#contact']]
      .map(([sel, href]) => ({ el: $(sel), href })).filter((x) => x.el);
    let raf = 0, cur = '';
    const active = () => {
      raf = 0;
      const line = $('.nav-inner', header).getBoundingClientRect().bottom + 24 + innerHeight * 0.15;
      let href = '#accueil';
      map.forEach((x) => { if (x.el.getBoundingClientRect().top <= line) href = x.href; });
      if (href === cur) return; cur = href;
      links.forEach((a) => { if (a.getAttribute('href') === href) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(active); }, { passive: true });
    addEventListener('resize', active); active();
  };

  /* ---------- Sélecteur de langue (barre et menu téléphone) ----------
     On recharge la page avec ?lang=<langue> : js/i18n.js lit ce paramètre, l'enregistre (localStorage) et réécrit l'URL,
     et toutes les parties se construisent dans la même langue. Appeler __i18n.setLang avant de recharger aurait traduit
     une moitié de la page une fraction de seconde avant l'autre : mélange visible, évité ainsi. */
  const langSwitch = () => {
    const cur = window.__accLang || 'fr';
    $$('[data-lang]').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.lang === cur ? 'true' : 'false');
      b.addEventListener('click', () => {
        const to = b.dataset.lang;
        if (to === cur) return;
        try { localStorage.setItem('lang', to); } catch (e) {}
        const u = new URL(location.href); u.searchParams.set('lang', to); location.assign(u.toString());
      });
    });
  };

  /* ---------- Démarrage ---------- */
  const start = () => {
    fitAll();
    $$('[data-scene]').forEach((el) => register(el));
    // mix : pas de planche (#board) ni de projets .pj3 de V dans le mix
    lightUp($('.ai3-demo'), '.ag');
    lightUp($('.expertise-grid'), '.expertise-card');
    accent(); cursor(); magnets();
    marquee(); contact(); rdv(); reveals(); nav(); langSwitch();

    if (anim && ST) {
      ST.addEventListener('refreshInit', fitAll);
      const b = ST.create({ trigger: '.ai3-demo', start: 'top 85%', end: 'bottom top', onToggle: (s) => setGroup('agent', s.isActive) });
      setGroup('agent', b.isActive);
      // cartes Expertise : sur ordinateur, toute la grille joue quand elle est à l'écran ; sur téléphone (cartes
      // empilées), chaque carte rejoue sa démonstration depuis le début quand elle arrive à l'écran
      const xpCards = $$('.expertise-grid > *');
      if (xpCards.length > 1 && xpCards[1].offsetTop > xpCards[0].offsetTop + 10) {
        scenes.filter((sc) => sc.group === 'xp').forEach((sc) => {
          const t = ST.create({ trigger: sc.el.closest('.expertise-card') || sc.el, start: 'top 80%', end: 'bottom 20%',
            onToggle: (s) => { sc.on = s.isActive; if (s.isActive && sc.tl && !sc.engaged) { sc.api.reset(); sc.tl.restart(); } sc.sync(); } });
          sc.on = t.isActive; sc.sync();
        });
      } else {
        const c = ST.create({ trigger: '.expertise-grid', start: 'top 90%', end: 'bottom top', onToggle: (s) => setGroup('xp', s.isActive) });
        setGroup('xp', c.isActive);
      }
      document.addEventListener('visibilitychange', () => scenes.forEach((sc) => { if (!sc.tl) return; if (document.hidden) sc.tl.pause(); else sc.sync(); }));
    }
    let rz = 0;
    addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { fitAll(); if (ST) ST.refresh(); }, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitAll(); if (ST) ST.refresh(); });
    addEventListener('load', () => { fitAll(); if (ST) ST.refresh(); });

    // mix : textes en français écrits dans le HTML, pas d'i18n à attendre
    setTimeout(intro, 280);
  };

  // mix : démarre au DOMContentLoaded, après js/accueil.js (Lenis de F créé, window.FM disponible)
  // (un script defer s'exécute avec readyState « interactive », juste avant l'événement : on l'attend)
  if (document.readyState === 'complete') start(); else document.addEventListener('DOMContentLoaded', start);
})();
