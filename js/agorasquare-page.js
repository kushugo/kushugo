/* agorasquare-page.js - étude de cas « AgoraSquare » (agorasquare-good.html). Sans dépendance.
   Chargé en tête : il marque la page « js », puis attend le document pour le reste : barre du site, fil de lecture,
   langue, démonstration de la commande express (client et note de solvabilité, articles, validation, facture, mode
   hors ligne), sections du récit et gestes des onze étapes du parcours. En « mouvement réduit », tout est montré à
   l'état final, sans animation. Les textes viennent de la page ; js/i18n.js les remplace en anglais. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Langue : même règle que js/i18n.js. Si la page doit s'afficher en anglais, les textes restent masqués
     jusqu'à l'arrivée de la traduction (deux secondes et demie au plus) : pas d'éclair de français. */
  const pickLang = () => {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'fr' || q === 'en') return q;
      const s = localStorage.getItem('lang');
      if (s === 'fr' || s === 'en') return s;
    } catch (e) { /* stockage indisponible : on suit le navigateur */ }
    return (navigator.language || 'fr').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'fr';
  };
  if (pickLang() !== 'fr') {
    root.classList.add('ag-wait');
    setTimeout(() => root.classList.remove('ag-wait'), 2500);
  }
  /* Les textes écrits par ce script (états, messages, montants) se réécrivent à chaque changement de langue,
     à partir des petites sources cachées que js/i18n.js a déjà traduites. */
  const refreshers = [];
  const onLang = (fn) => { refreshers.push(fn); };
  document.addEventListener('i18n:updated', () => {
    root.classList.remove('ag-wait');
    refreshers.forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
  });
  const isEn = () => root.lang === 'en';
  const pct = (n) => (isEn() ? `${n}%` : `${n} %`);
  const colon = () => (isEn() ? ': ' : ' : ');
  const dec = (x, d) => x.toFixed(d).replace('.', isEn() ? '.' : ',');

  const init = () => {
    /* ---------- Barre du site : menu replié sous 921 px (comme Data Collection) ---------- */
    const header = $('#header'), toggle = $('.nav-toggle'), menu = $('#primary-navigation');
    const mqMenu = matchMedia('(max-width: 920px)');
    if (toggle && menu) {
      const sync = () => {
        const closed = mqMenu.matches && !document.body.classList.contains('is-nav-open');
        $$('a, button', menu).forEach((el) => { if (closed) el.setAttribute('tabindex', '-1'); else el.removeAttribute('tabindex'); });
      };
      const setMenu = (open) => {
        document.body.classList.toggle('is-nav-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        sync();
      };
      toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('is-nav-open')));
      menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
      document.addEventListener('click', (e) => { if (document.body.classList.contains('is-nav-open') && !e.target.closest('#header')) setMenu(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('is-nav-open')) { setMenu(false); toggle.focus(); } });
      mqMenu.addEventListener('change', () => setMenu(false));
      sync();
    }

    /* ---------- Fil de lecture et barre réduite ---------- */
    const bar = $('[data-progress]');
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty('--p', (max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0).toFixed(4));
      if (header) header.classList.toggle('scrolled', scrollY > 80);
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* ---------- Langue : FR | EN, sans rechargement (js/i18n.js remplace les textes) ---------- */
    const langBtns = $$('[data-lang]');
    const markLang = (lang) => langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    langBtns.forEach((b) => b.addEventListener('click', () => { if (window.__i18n) window.__i18n.setLang(b.dataset.lang); }));
    markLang(pickLang());
    document.addEventListener('i18n:updated', (e) => markLang((e.detail && e.detail.lang) || pickLang()));

    /* ---------- Démonstration : la commande express ---------- */
    const demo = $('[data-demo]');
    if (demo) initDemo(demo);

    initSections();

    /* ---------- Barres « avant / après » : elles se resserrent quand on les voit ---------- */
    const bars = $('[data-bars]');
    if (bars) {
      if (reduce || !('IntersectionObserver' in window)) bars.classList.add('seen');
      else {
        const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { bars.classList.add('seen'); io.disconnect(); } }, { threshold: .35 });
        io.observe(bars);
      }
    }
  };

  function initDemo(demo) {
    const q = $('[data-q]', demo), sugg = $('[data-sugg]', demo), options = $$('[data-client]', demo);
    const picked = $('[data-picked]', demo), pickedName = $('[data-picked-name]', demo), verdict = $('[data-verdict]', demo);
    const ring = $('[data-ring]', demo), ringN = $('[data-ring-n]', demo), change = $('[data-change]', demo), search = $('[data-search]', demo);
    const lines = $$('[data-line]', demo), totalEl = $('[data-total]', demo), validate = $('[data-validate]', demo);
    const steps = $$('[data-step]', demo), flow = $$('[data-f]', demo), statusEl = $('[data-status]', demo);
    const net = $('[data-net]', demo), netLabel = $('[data-net-label]', demo), queue = $('[data-queue]', demo);
    const chips = Object.fromEntries($$('[data-chip]', demo).map((c) => [c.dataset.chip, c]));
    const msg = (k) => { const el = $(`[data-msg="${k}"]`, demo); return el ? el.textContent : ''; };
    const money = () => new Intl.NumberFormat(root.lang === 'en' ? 'en-GB' : 'fr-FR', { style: 'currency', currency: 'EUR' });

    const state = { client: null, option: null, online: true, sent: false, pending: false, status: '' };
    let timers = [], flowTimers = [], auto = false;
    const later = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const stopAuto = () => { if (auto) { timers.forEach(clearTimeout); timers = []; auto = false; } };

    /* recherche tolérante aux fautes de frappe : début de mot, contenu, ou une seule lettre de différence */
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const near = (a, b) => {   /* distance d'édition (avec inversion de deux lettres) au plus 1 */
      if (Math.abs(a.length - b.length) > 1) return false;
      const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
      for (let j = 1; j <= n; j++) d[0][j] = j;
      for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      return d[m][n] <= 1;
    };
    const matches = (name, query) => {
      const n = norm(name), qq = norm(query);
      if (!qq) return true;
      if (n.includes(qq)) return true;
      return qq.length >= 3 && n.split(/\s+/).some((w) => near(w.slice(0, qq.length), qq) || near(w, qq));
    };
    let active = -1;
    const visible = () => options.filter((o) => !o.hidden);
    const setActive = (i) => {
      const vis = visible();
      active = vis.length ? (i + vis.length) % vis.length : -1;
      options.forEach((o) => { o.classList.remove('active'); o.setAttribute('aria-selected', 'false'); });
      if (active >= 0) { vis[active].classList.add('active'); vis[active].setAttribute('aria-selected', 'true'); }
    };
    const openSugg = (open) => { sugg.hidden = !open; q.setAttribute('aria-expanded', String(open)); };
    const filter = () => {
      options.forEach((o) => { o.hidden = !matches(o.dataset.name, q.value); });
      openSugg(visible().length > 0 && document.activeElement === q || (auto && visible().length > 0));
      setActive(0);
    };

    const setSteps = () => {
      const qty = lines.reduce((s, l) => s + +$('[data-qty]', l).value, 0);
      const done = [!!state.client, qty > 0, !!state.client, state.sent || state.pending];
      steps.forEach((s, i) => {
        s.classList.toggle('done', done[i]);
        s.classList.toggle('on', !done[i] && done.slice(0, i).every(Boolean));
      });
      chips.client && chips.client.classList.toggle('on', !!state.client);
      chips.order && chips.order.classList.toggle('on', qty > 0);
      chips.invoice && chips.invoice.classList.toggle('on', state.sent);
      validate.disabled = !(state.client && qty > 0) || state.sent || state.pending;
      validate.classList.toggle('is-done', state.sent);
      validate.classList.toggle('is-wait', state.pending && !state.sent);
      const vl = $('[data-v-label]', validate);
      if (vl) vl.textContent = msg(state.sent ? 'done' : state.pending ? 'waiting' : 'validate');
    };

    const pick = (o) => {
      state.client = { name: o.dataset.name, score: +o.dataset.score, kind: o.dataset.kind, text: $('[data-verdict-text]', o).textContent };
      state.option = o;
      pickedName.textContent = state.client.name;
      verdict.textContent = state.client.text;
      picked.dataset.kind = state.client.kind;
      search.hidden = true; openSugg(false);
      picked.hidden = false;
      ring.style.setProperty('--v', '0');
      ringN.textContent = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => ring.style.setProperty('--v', (state.client.score / 100).toFixed(2))));
      countTo(ringN, state.client.score, reduce ? 0 : 900);
      resetSent();
      setSteps();
    };
    const unpick = () => {
      state.client = null; state.option = null; picked.hidden = true; search.hidden = false; q.value = '';
      resetSent(); filter(); setSteps();
    };
    const countTo = (el, to, ms) => {
      if (!ms) { el.textContent = pct(to); return; }
      const t0 = performance.now();
      const tick = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = pct(Math.round(to * e)); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };

    const total = () => {
      const sum = lines.reduce((s, l) => s + (+$('[data-qty]', l).value) * parseFloat(l.dataset.price), 0);
      totalEl.textContent = money().format(sum);
      lines.forEach((l) => l.classList.toggle('has', +$('[data-qty]', l).value > 0));
    };
    const bump = (line, d) => {
      const out = $('[data-qty]', line);
      out.value = Math.max(0, Math.min(99, +out.value + d));
      total(); resetSent(); setSteps();
    };

    const resetSent = () => {
      flowTimers.forEach(clearTimeout); flowTimers = [];
      if (!state.sent && !state.pending) return;
      state.sent = false; state.pending = false; state.status = '';
      flow.forEach((f) => f.classList.remove('done', 'wait'));
      statusEl.textContent = ''; statusEl.className = 'ag-status';
      queue.hidden = true;
    };
    const finish = (k0) => {   /* étapes après validation, une à une */
      const at = (ms, fn) => flowTimers.push(setTimeout(fn, ms));
      flow.forEach((f, i) => { if (i >= k0) at(reduce ? 0 : 380 * (i - k0 + 1), () => { f.classList.remove('wait'); f.classList.add('done'); }); });
      at(reduce ? 0 : 380 * (flow.length - k0) + 120, () => {
        state.sent = true; state.pending = false; queue.hidden = true;
        state.status = k0 > 0 ? 'synced' : 'sent';
        statusEl.textContent = msg(state.status); statusEl.className = 'ag-status ok';
        setSteps();
      });
    };
    const send = () => {
      if (validate.disabled) return;
      if (state.online) { state.pending = true; setSteps(); finish(0); return; }
      /* hors ligne : le bon de commande est enregistré sur la tablette, le reste attend le réseau */
      state.pending = true;
      flow[0].classList.add('done');
      flow.slice(1).forEach((f) => f.classList.add('wait'));
      queue.hidden = false;
      state.status = 'queued';
      statusEl.textContent = msg('queued'); statusEl.className = 'ag-status warn';
      setSteps();
    };
    const setOnline = (on) => {
      state.online = on;
      net.setAttribute('aria-pressed', String(on));
      netLabel.textContent = msg(on ? 'online' : 'offline');
      if (on && state.pending && !state.sent && flow[1].classList.contains('wait')) finish(1);
    };

    /* ---------- interactions ---------- */
    q.addEventListener('input', () => { stopAuto(); filter(); });
    q.addEventListener('focus', () => { filter(); });
    q.addEventListener('blur', () => setTimeout(() => { if (!auto) openSugg(false); }, 150));
    q.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); stopAuto(); openSugg(true); setActive(active + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if (e.key === 'Enter') { e.preventDefault(); const v = visible()[active]; if (v) { stopAuto(); pick(v); } }
      else if (e.key === 'Escape') openSugg(false);
    });
    options.forEach((o) => o.addEventListener('mousedown', (e) => { e.preventDefault(); stopAuto(); pick(o); }));
    change.addEventListener('click', () => { stopAuto(); unpick(); q.focus(); });
    lines.forEach((l) => {
      $('[data-inc]', l).addEventListener('click', () => { stopAuto(); bump(l, 1); });
      $('[data-dec]', l).addEventListener('click', () => { stopAuto(); bump(l, -1); });
    });
    validate.addEventListener('click', () => { stopAuto(); send(); });
    net.addEventListener('click', () => { stopAuto(); setOnline(!state.online); });

    /* ---------- lecture automatique, une fois, quand la démonstration apparaît ---------- */
    const reset = () => {
      timers.forEach(clearTimeout); timers = [];
      flowTimers.forEach(clearTimeout); flowTimers = [];
      state.sent = false; state.pending = false; state.status = '';
      flow.forEach((f) => f.classList.remove('done', 'wait'));
      statusEl.textContent = ''; statusEl.className = 'ag-status'; queue.hidden = true;
      lines.forEach((l) => { $('[data-qty]', l).value = 0; });
      setOnline(true); unpick(); total();
      q.blur(); openSugg(false);
    };
    const press = (el) => { el.classList.add('press'); later(140, () => el.classList.remove('press')); };
    const play = () => {
      reset();
      auto = true;
      let t = 500;
      [...'bistro'].forEach((ch, i) => later(t + i * 120, () => { q.value += ch; filter(); }));
      t += 6 * 120 + 650;
      later(t, () => { const v = visible()[0]; if (v) v.classList.add('active'); });
      t += 380;
      later(t, () => { const v = visible()[0]; if (v) pick(v); });
      t += 1100;
      [[0, 4], [1, 3], [2, 2]].forEach(([li, n]) => {
        for (let k = 0; k < n; k++) { later(t, () => { const b = $('[data-inc]', lines[li]); press(b); bump(lines[li], 1); }); t += 170; }
        t += 160;
      });
      t += 420;
      later(t, () => { press(validate); send(); });
      later(t + 1600, () => { auto = false; });
    };
    const final = () => {   /* état final, sans animation (mouvement réduit) */
      reset();
      const v = options[0]; pick(v);
      [[0, 4], [1, 3], [2, 2]].forEach(([li, n]) => { $('[data-qty]', lines[li]).value = n; });
      total(); setSteps(); send();
    };
    $('[data-replay]', demo).addEventListener('click', () => (reduce ? final() : play()));

    /* changement de langue : libellés, verdict, note, montant et message d'état dans la nouvelle langue */
    onLang(() => {
      netLabel.textContent = msg(state.online ? 'online' : 'offline');
      if (state.option) { verdict.textContent = $('[data-verdict-text]', state.option).textContent; ringN.textContent = pct(state.client.score); }
      statusEl.textContent = state.status ? msg(state.status) : '';
      total(); setSteps();
    });

    total(); setSteps();
    if (reduce || !('IntersectionObserver' in window)) final();
    else {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); play(); } }, { threshold: .45 });
      io.observe(demo);
    }
  }


  /* ═════════ Sections de la page ═════════ */
  function initSections() {
    const seen = (el, fn, threshold = .25) => {
      if (reduce || !('IntersectionObserver' in window)) { fn(); return; }
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold });
      io.observe(el);
    };
    const txt = (root, sel) => { const el = $(sel, root); return el ? el.textContent : ''; };

    /* apparitions et compteurs */
    $$('[data-reveal]').forEach((el) => seen(el, () => el.classList.add('seen'), .15));
    /* un bloc dépassé d'un coup (lien d'ancre, défilement rapide) apparaît aussi */
    const pending = () => $$('[data-reveal]:not(.seen)');
    const sweep = () => pending().forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('seen'); });
    addEventListener('scroll', () => { if (pending().length) requestAnimationFrame(sweep); }, { passive: true });
    $$('[data-count]').forEach((el) => seen(el, () => {
      const to = +el.dataset.count;
      if (reduce) { el.textContent = to; return; }
      const t0 = performance.now();
      const tick = (t) => { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
      el.textContent = '0'; requestAnimationFrame(tick);
    }, .5));

    /* repère de lecture */
    const rail = $('[data-rail]');
    if (rail) {
      const links = $$('a', rail), secs = links.map((a) => $(a.getAttribute('href')));
      const onScroll = () => {
        const line = innerHeight * .4;
        let cur = -1;
        secs.forEach((s, k) => { if (s && s.getBoundingClientRect().top <= line) cur = k; });
        const first = secs[0];
        rail.classList.toggle('show', !!first && first.getBoundingClientRect().top < innerHeight * .9);
        links.forEach((a, k) => { a.classList.toggle('done', k < cur); if (k === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      };
      addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }

    /* la commande sur papier, puis dans l'application */
    const paper = $('[data-paper]');
    if (paper) {
      const btns = $$('[data-paper-mode]', paper), sides = $$('[data-paper-side]', paper);
      btns.forEach((b) => b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        sides.forEach((s) => { s.hidden = s.dataset.paperSide !== b.dataset.paperMode; });
      }));
    }

    /* la journée type, à faire glisser */
    const day = $('[data-day]');
    if (day) {
      const range = $('[data-day-range]', day), cards = $$('[data-day-card]', day), marks = $$('.ag-day-marks li', day);
      const show = () => {
        const i = +range.value;
        cards.forEach((c, k) => { c.hidden = k !== i; });
        marks.forEach((m, k) => m.classList.toggle('on', k === i));
        range.setAttribute('aria-valuetext', txt(cards[i], '.ag-day-time') + ', ' + txt(cards[i], 'h4'));
      };
      range.addEventListener('input', show); show(); onLang(show);
    }

    /* onglets génériques : modules, leçons */
    const tabs = (box, btnSel, panelSel, attr) => {
      if (!box) return;
      const btns = $$(btnSel, box), panels = $$(panelSel, box);
      const go = (i) => {
        btns.forEach((b, k) => { b.setAttribute(attr, String(k === i)); b.tabIndex = k === i ? 0 : -1; });
        panels.forEach((p, k) => { p.hidden = k !== i; });
      };
      btns.forEach((b, i) => {
        b.addEventListener('click', () => go(i));
        b.addEventListener('keydown', (e) => {
          const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
          if (d) { e.preventDefault(); const n = (i + d + btns.length) % btns.length; go(n); btns[n].focus(); }
        });
      });
      go(0);
    };
    tabs($('[data-modules]'), '[data-mod]', '[data-mod-panel]', 'aria-selected');
    tabs($('[data-lessons]'), '[data-lesson]', '[data-lesson-panel]', 'aria-selected');

    /* jeu : des boutons pour des mains froides (chaque appui tremble de 6 à 24 px) */
    const gloves = $('[data-gloves]');
    if (gloves) {
      const score = { 38: 0, 50: 0 };
      const out = (s) => { const b = $(`[data-g-hit="${s}"]`, gloves); if (b) b.textContent = score[s]; };
      $$('.ag-targets', gloves).forEach((zone) => {
        const s = +zone.dataset.size;
        zone.addEventListener('pointerdown', (e) => {
          const r = zone.getBoundingClientRect();
          const ang = Math.random() * Math.PI * 2, dist = 6 + Math.random() * 18;   /* le tremblement d'une main froide ou gantée */
          const x = e.clientX + Math.cos(ang) * dist, y = e.clientY + Math.sin(ang) * dist;
          const dot = document.createElement('span'); dot.className = 'ag-tap';
          dot.style.left = (x - r.left) + 'px'; dot.style.top = (y - r.top) + 'px';
          zone.appendChild(dot); setTimeout(() => dot.remove(), 650);
          const hit = $$('button', zone).find((b) => { const q = b.getBoundingClientRect(); return x >= q.left && x <= q.right && y >= q.top && y <= q.bottom; });
          const aimed = e.target.closest('button');
          if (hit && !hit.classList.contains('hit')) { hit.classList.add('hit'); score[s]++; out(s); }
          else if (aimed && !hit) { aimed.classList.remove('miss'); void aimed.offsetWidth; aimed.classList.add('miss'); }
        });
        $$('button', zone).forEach((b) => b.addEventListener('keydown', (e) => {   /* au clavier : l'appui compte toujours */
          if ((e.key === 'Enter' || e.key === ' ') && !b.classList.contains('hit')) { e.preventDefault(); b.classList.add('hit'); score[s]++; out(s); }
        }));
      });
      $('[data-gloves-reset]', gloves).addEventListener('click', () => {
        score[38] = 0; score[50] = 0; out(38); out(50);
        $$('.ag-targets button', gloves).forEach((b) => b.classList.remove('hit', 'miss'));
      });
      const labels = () => $$('.ag-targets button', gloves).forEach((b, i) => b.setAttribute('aria-label', `${txt(gloves, '[data-g-label]')} ${(i % 6) + 1}`));
      labels(); onLang(labels);
    }

    /* trois parcours chronométrés : avant / après */
    const flows = $('[data-flows]');
    if (flows) {
      const lab = (k) => txt(flows, `[data-fc-label="${k}"]`);
      const fmt = (sec) => {
        const m = Math.floor(sec / 60), s = sec % 60, min = lab('min');
        if (!s) return `${m}\u00a0${min}`;
        return isEn() ? `${m}\u00a0${min} ${s}\u00a0s` : `${m}\u00a0${min}\u00a0${s}`;
      };
      const cards = $$('.ag-flow-cards li', flows), btns = $$('[data-flows-mode]', flows);
      const maxT = Math.max(...cards.map((c) => +c.dataset.beforeTime));
      let current = 'apres';
      const show = (mode) => {
        current = mode;
        const before = mode === 'avant';
        flows.classList.toggle('is-before', before);
        btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.flowsMode === mode)));
        cards.forEach((c) => {
          const n = +(before ? c.dataset.beforeSteps : c.dataset.afterSteps), t = +(before ? c.dataset.beforeTime : c.dataset.afterTime);
          const dots = $('[data-dots]', c);
          if (dots) dots.innerHTML = '<i></i>'.repeat(n);
          const st = $('[data-fc-steps]', c);
          if (n) st.textContent = `${n} ${lab('steps')}`; else st.textContent = before ? lab('scatter') : lab('live');
          $('[data-fc-time]', c).textContent = fmt(t);
          $('[data-timebar]', c).style.setProperty('--t', (t / maxT).toFixed(3));
        });
      };
      btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.flowsMode)));
      show('apres'); onLang(() => show(current));
    }

    /* le parcours en onze étapes */
    const path = $('[data-path]');
    if (path) {
      const tabsEl = $$('[data-tab]', path), sts = $$('[data-st]', path), map = $('.ag-path-map', path);
      const fill = $('[data-path-fill]', path), count = $('[data-path-count]', path), prev = $('[data-prev]', path), next = $('[data-next]', path);
      let cur = 0;
      const go = (i, focus) => {
        cur = Math.max(0, Math.min(sts.length - 1, i));
        tabsEl.forEach((t, k) => { t.setAttribute('aria-selected', String(k === cur)); t.tabIndex = k === cur ? 0 : -1; t.classList.toggle('done', k < cur); });
        sts.forEach((s, k) => { s.hidden = k !== cur; });
        map.dataset.lane = tabsEl[cur].closest('li').classList.contains('l1') ? '1' : '2';
        fill.style.setProperty('--f', (cur / (sts.length - 1)).toFixed(3));
        count.textContent = `${cur + 1} / ${sts.length}`;
        prev.disabled = cur === 0; next.disabled = cur === sts.length - 1;
        if (focus) tabsEl[cur].focus();
      };
      tabsEl.forEach((t, i) => {
        t.addEventListener('click', () => go(i));
        t.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(cur + (e.key === 'ArrowRight' ? 1 : -1), true); }
          else if (e.key === 'Home') { e.preventDefault(); go(0, true); } else if (e.key === 'End') { e.preventDefault(); go(sts.length - 1, true); }
        });
      });
      prev.addEventListener('click', () => go(cur - 1));
      next.addEventListener('click', () => go(cur + 1));
      go(0);
      initStations(path);
    }

    /* preuve 1 : hors ligne, puis synchronisé */
    const off = $('[data-poc-offline]');
    if (off) {
      const sync = $('.ag-sync', off), btn = $('[data-sync]', off), n = $('[data-sync-n]', off), state = $('[data-sync-state]', off);
      let on = false, t;
      const render = () => {
        sync.classList.toggle('on', on);
        state.textContent = txt(off, `[data-sync-msg="${on ? 'on' : 'off'}"]`);
        btn.lastChild.textContent = txt(off, `[data-sync-msg="${on ? 'btn-off' : 'btn-on'}"]`);
      };
      onLang(render);
      btn.addEventListener('click', () => {
        on = !on; clearTimeout(t);
        render();
        if (on) { let k = 3; const step = () => { k--; n.textContent = k; if (k > 0) t = setTimeout(step, reduce ? 0 : 1100); }; t = setTimeout(step, reduce ? 0 : 1100); }
        else n.textContent = '3';
      });
    }

    /* preuve 2 : une note en moins de 2 secondes */
    const score = $('[data-poc-score]');
    if (score) {
      const btn = $('[data-lookup]', score), res = $('[data-lookup-res]', score), ring = $('[data-lookup-ring]', score), num = $('[data-lookup-n]', score), time = $('[data-lookup-time]', score);
      let secs = null;   /* durée de la dernière recherche, en secondes */
      const render = () => {
        if (res.classList.contains('busy')) return;
        if (secs === null) { num.textContent = '…'; time.textContent = txt(score, '[data-lookup-idle]'); return; }
        ring.style.setProperty('--v', '.31'); ring.style.stroke = 'var(--ko)'; num.textContent = pct(31);
        time.textContent = `${txt(score, '[data-lookup-msg]')} ${dec(secs, 1)}\u00a0s`;
      };
      onLang(render);
      btn.addEventListener('click', () => {
        if (res.classList.contains('busy')) return;
        res.classList.add('busy'); ring.style.setProperty('--v', '.12'); num.textContent = '…'; time.textContent = '';
        const t0 = performance.now(), wait = reduce ? 0 : 1300 + Math.random() * 450;
        setTimeout(() => {
          res.classList.remove('busy');
          secs = reduce ? 1.6 : (performance.now() - t0) / 1000;
          render();
        }, wait);
      });
    }

    /* système de design : couleurs d'état, états d'un bouton, deux contextes */
    const status = $('[data-status-demo]');
    if (status) {
      const btns = $$('[data-status]', status), line = $('[data-status-line]', status);
      let k = 0;
      const render = () => {
        const cls = ['ok', 'warn', 'ko'][k];
        line.innerHTML = '';
        const pill = document.createElement('span'); pill.className = 'ag-pill ' + cls; pill.textContent = btns[k].textContent;
        line.append(pill, document.createTextNode(txt(status, `[data-status-text="${k}"]`)));
      };
      btns.forEach((b, i) => b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        k = i; render();
      }));
      onLang(render);
    }
    const states = $('[data-states]');
    if (states) {
      const btn = $('[data-state-btn]', states), items = $$('.ag-state-list li', states), cls = ['', 's-hover', 's-active', 's-disabled'];
      let k = 0;
      $('[data-state-next]', states).addEventListener('click', () => {
        k = (k + 1) % 4;
        btn.className = 'ag-state-btn ' + cls[k];
        btn.setAttribute('aria-disabled', String(k === 3));
        items.forEach((li, i) => li.classList.toggle('on', i === k));
      });
    }
    const modes = $('[data-modes]');
    if (modes) {
      const btns = $$('[data-mode]', modes), stage = $('[data-mode-stage]', modes), texts = $$('[data-mode-text]', modes);
      btns.forEach((b) => b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        stage.dataset.modeStage = b.dataset.mode;
        texts.forEach((t) => { t.hidden = t.dataset.modeText !== b.dataset.mode; });
      }));
    }
  }

  /* les gestes de chaque étape du parcours : chaque écran garde son état et le réécrit à chaque changement de langue */
  function initStations(path) {
    const txt = (root, sel) => { const el = $(sel, root); return el ? el.textContent : ''; };

    /* 1. tuiles */
    const s1 = $('#ag-st-1', path);
    if (s1) {
      const tiles = $$('[data-tile]', s1), note = $('[data-tile-note]', s1);
      let sel = -1;
      const render = () => {
        tiles.forEach((x, i) => x.classList.toggle('on', i === sel));
        if (sel < 0) { note.textContent = txt(s1, '[data-tile-idle]'); note.className = 'ag-sc-note'; return; }
        note.textContent = `${$('span', tiles[sel]).textContent}${colon()}${txt(s1, '[data-tile-msg]')}`; note.className = 'ag-sc-note ok';
      };
      tiles.forEach((t, i) => t.addEventListener('click', () => { sel = i; render(); }));
      onLang(render);
    }

    /* 2. rejouer la démonstration du haut de page */
    $$('[data-goto-demo]', path).forEach((b) => b.addEventListener('click', () => {
      const demo = $('[data-demo]');
      if (!demo) return;
      demo.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => { const r = $('[data-replay]', demo); if (r) r.click(); }, reduce ? 0 : 700);
    }));

    /* 3. décision après la note */
    const s3 = $('#ag-st-3', path);
    if (s3) {
      const btns = $$('[data-choice]', s3), note = $('[data-choice-note]', s3);
      let choice = -1;
      const render = () => {
        btns.forEach((x, i) => x.setAttribute('aria-checked', String(i === choice)));
        note.textContent = txt(s3, `[data-choice-msg="${choice < 0 ? 'intro' : choice}"]`);
        note.className = choice < 0 ? 'ag-sc-note' : 'ag-sc-note ok';
      };
      btns.forEach((b, i) => b.addEventListener('click', () => { choice = i; render(); }));
      onLang(render);
    }

    /* 4. signature à l'écran */
    const s4 = $('#ag-st-4', path);
    if (s4) {
      const cv = $('[data-sign]', s4), box = cv.parentElement, ctx = cv.getContext('2d'), state = $('[data-sign-state]', s4);
      let drawing = false, ink = 0, last = null, signed = false;
      const render = () => { state.textContent = txt(s4, signed ? '[data-sign-msg]' : '[data-sign-wait]'); state.className = signed ? 'ag-pill ok' : 'ag-pill'; };
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
      ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2c2280';
      cv.addEventListener('pointerdown', (e) => { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => {
        if (!drawing) return;
        const p = pos(e);
        ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        ink += Math.hypot(p[0] - last[0], p[1] - last[1]); last = p;
        if (ink > 140 && !signed) { signed = true; box.classList.add('signed'); render(); }
      });
      const end = () => { drawing = false; };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      $('[data-sign-clear]', s4).addEventListener('click', () => {
        ctx.clearRect(0, 0, cv.width, cv.height); ink = 0; signed = false; box.classList.remove('signed');
        render();
      });
      onLang(render);
    }

    /* 5. facture en trois étapes : vérifier, générer, envoyer */
    const s5 = $('#ag-st-5', path);
    if (s5) {
      const items = $$('[data-stepper] li', s5), btn = $('[data-stepper-next]', s5), note = $('[data-stepper-note]', s5);
      let k = 0;   /* nombre d'étapes faites, de 0 à 3 */
      const render = () => {
        items.forEach((li, i) => { li.className = i < k ? 'done' : i === k ? 'on' : ''; });
        note.textContent = txt(s5, `[data-step-msg="${k}"]`); note.className = k ? 'ag-sc-note ok' : 'ag-sc-note';
        btn.textContent = txt(s5, `[data-step-label="${k === 2 ? 'send' : k >= 3 ? 'again' : 'next'}"]`);
      };
      btn.addEventListener('click', () => { k = k >= 3 ? 0 : k + 1; render(); });
      onLang(render);
    }

    /* 6, 8, 11 : sélecteurs segmentés */
    $$('[data-segbox]', path).forEach((box) => {
      const btns = $$('[data-seg]', box), panels = $$('[data-seg-panel]', box);
      btns.forEach((b, i) => b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        if (panels.length > 1) panels.forEach((p, k) => { p.hidden = k !== i; });
      }));
    });

    /* 6. approuver ou refuser */
    const s6 = $('#ag-st-6', path);
    if (s6) $$('[data-approvals] li', s6).forEach((li) => {
      const pill = $('[data-ap-state]', li);
      if (!pill) return;
      let st = 'wait';
      const render = () => { pill.textContent = txt(s6, `[data-ap-msg="${st}"]`); pill.className = st === 'wait' ? 'ag-pill' : 'ag-pill ' + st; };
      const set = (ok) => { st = ok ? 'ok' : 'ko'; render(); $('.ag-ap', li).innerHTML = ''; };
      $('[data-approve]', li).addEventListener('click', () => set(true));
      $('[data-refuse]', li).addEventListener('click', () => set(false));
      onLang(render);
    });

    /* 7. lire le ticket */
    const s7 = $('#ag-st-7', path);
    if (s7) {
      const btn = $('[data-scan]', s7), rc = $('[data-receipt]', s7), dds = $$('[data-r]', s7);
      let scanned = false;
      const label = () => { btn.textContent = txt(s7, `[data-scan-label="${scanned ? 'again' : 'first'}"]`); };
      btn.addEventListener('click', () => {
        scanned = true;
        dds.forEach((d) => { d.textContent = '…'; d.classList.remove('got'); });
        rc.classList.remove('scanning'); void rc.offsetWidth; rc.classList.add('scanning');
        dds.forEach((d, i) => setTimeout(() => { d.textContent = d.dataset.r; d.classList.add('got'); }, reduce ? 0 : 700 + i * 450));
        label();
      });
      onLang(() => { label(); dds.forEach((d) => { if (d.classList.contains('got')) d.textContent = d.dataset.r; }); });
    }

    /* 8. relancer */
    const s8 = $('#ag-st-8', path);
    if (s8) {
      const btns = $$('[data-relance]', s8);
      const render = () => btns.forEach((b) => { b.textContent = b.classList.contains('sent') ? '✓ ' + txt(s8, '[data-relance-msg]') : txt(s8, '[data-relance-label]'); });
      btns.forEach((b) => b.addEventListener('click', () => { b.classList.add('sent'); b.disabled = true; render(); }));
      onLang(render);
    }

    /* 9. alerte de surveillance */
    const s9 = $('#ag-st-9', path);
    if (s9) {
      const btn = $('[data-alert-act]', s9);
      let done = false;
      const render = () => { btn.textContent = done ? '✓ ' + txt(s9, '[data-alert-msg]') : txt(s9, '[data-alert-label]'); };
      btn.addEventListener('click', () => { done = true; $('[data-alert]', s9).classList.add('done'); btn.disabled = true; render(); });
      onLang(render);
    }

    /* 11. export comptable */
    const s11 = $('#ag-st-11', path);
    if (s11) {
      const btn = $('[data-export]', s11), bar = $('[data-export-bar]', s11), note = $('[data-export-note]', s11);
      let soft = null;   /* logiciel du dernier export, null tant qu'on n'a rien exporté */
      const render = () => {
        if (soft === null) return;
        note.textContent = `${soft ? soft + colon() : ''}${txt(s11, '[data-export-msg]')}`; note.className = 'ag-sc-note ok';
      };
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        btn.disabled = true; note.textContent = ''; note.className = 'ag-sc-note';
        let e = 0;
        const tick = () => {
          e = Math.min(1, e + (reduce ? 1 : .08));
          bar.style.setProperty('--e', e.toFixed(2));
          if (e < 1) setTimeout(tick, 70);
          else {
            const on = $('[data-seg][aria-pressed="true"]', s11);
            soft = on ? on.textContent : '';
            render();
            btn.disabled = false;
          }
        };
        tick();
      });
      onLang(render);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
