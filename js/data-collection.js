/* data-collection.js — étude de cas « Data Collection » (data-collection.html). Sans dépendance.
   Chargé en tête de page : il marque la page « js » tout de suite, puis attend le document pour le reste :
   progression de lecture, sommaire, langue, illustration de la collecte, comparatif de 0 à 100 %, carte de rendez-vous,
   apparitions au défilement. En « mouvement réduit », tout est à l'état final. */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');

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
    root.classList.add('dc-wait');
    setTimeout(() => root.classList.remove('dc-wait'), 2500);
  }
  document.addEventListener('i18n:updated', () => root.classList.remove('dc-wait'));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const init = () => {
    /* ---------- Progression de lecture (le fil « de 0 à 100 % ») et section en cours ---------- */
    const bar = $('[data-progress]'), read = $('[data-read]');
    const tocLinks = $$('[data-toc] a');
    const tocSecs = tocLinks.map((a) => $(a.getAttribute('href')));
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      if (bar) bar.style.setProperty('--p', p.toFixed(4));
      if (read) read.textContent = Math.round(p * 100);
      let cur = -1;
      tocSecs.forEach((s, k) => {
        if (!s) return;
        const r = s.getBoundingClientRect();
        if (r.top <= innerHeight * 0.4 && r.bottom > innerHeight * 0.3) cur = k;
      });
      tocLinks.forEach((a, k) => { if (k === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    onScroll();

    /* ---------- Langue : FR | EN, sans rechargement (js/i18n.js remplace les textes) ---------- */
    const langBtns = $$('[data-lang]');
    const markLang = (lang) => langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    langBtns.forEach((b) => b.addEventListener('click', () => { if (window.__i18n) window.__i18n.setLang(b.dataset.lang); }));
    markLang(pickLang());

    /* ---------- Illustration : une collecte qui passe de 0 à 100 % ---------- */
    let refreshDemo = () => {};
    const demo = $('[data-demo]');
    if (demo) {
      const grid = $('[data-grid]', demo), pct = $('[data-pct]', demo), fill = $('[data-bar]', demo), state = $('[data-state]', demo);
      const missing = $$('[data-missing] li', demo);
      const states = $$('[data-states] li', demo);   /* libellés d'état, traduits par js/i18n.js */
      const first = $('[data-row-first]', grid);     /* « Siège » : seul nom de ligne à traduire */
      const ROWS = [null, 'Lille', 'Amiens', 'Lyon', 'Nantes', 'Valenciennes'];
      const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
      const cells = [];

      const head = document.createElement('span'); head.className = 'r'; grid.append(head);
      MONTHS.forEach((m) => { const s = document.createElement('span'); s.className = 'm'; s.textContent = m; grid.append(s); });
      ROWS.forEach((name) => {
        let r = first;
        if (name) { r = document.createElement('span'); r.className = 'r'; r.textContent = name; }
        grid.append(r);
        MONTHS.forEach(() => { const c = document.createElement('span'); c.className = 'c'; grid.append(c); cells.push(c); });
      });

      /* ordre de remplissage stable (générateur à graine) : les dépôts arrivent par paquets, pas ligne par ligne */
      let seed = 11;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const order = cells.map((_, i) => i).sort(() => rnd() - 0.5);
      const rejected = new Set(order.filter((_, k) => k % 11 === 5).slice(0, 6));
      const N = cells.length;
      let timers = [], shown = 0;
      const clear = () => { timers.forEach(clearTimeout); timers = []; };
      const later = (ms, fn) => timers.push(setTimeout(fn, ms));

      const show = (done) => {
        shown = done;
        const p = Math.round((done / N) * 100);
        pct.textContent = p;
        fill.style.setProperty('--p', (done / N).toFixed(4));
        const cur = states.filter((li) => p >= +li.dataset.at).pop();
        if (cur) state.textContent = cur.textContent;
        missing.forEach((li) => li.classList.toggle('done', p >= +li.dataset.at));
        demo.classList.toggle('is-done', p === 100);
      };
      refreshDemo = () => show(shown);
      const final = () => { clear(); cells.forEach((c) => { c.className = 'c ok'; }); show(N); };
      const reset = () => { clear(); cells.forEach((c) => { c.className = 'c'; }); show(0); };

      const play = () => {
        reset();
        let done = 0, t = 420;
        order.forEach((i) => {
          const c = cells[i];
          if (rejected.has(i)) { later(t, () => c.classList.add('ko')); }
          else { later(t, () => { c.classList.add('ok', 'pop'); done++; show(done); }); later(t + 160, () => c.classList.remove('pop')); }
          t += 34;
        });
        t += 520;   /* les fichiers non conformes sont redéposés un par un */
        [...rejected].forEach((i) => {
          const c = cells[i];
          later(t, () => { c.classList.remove('ko'); c.classList.add('ok', 'pop'); done++; show(done); });
          later(t + 180, () => c.classList.remove('pop'));
          t += 210;
        });
      };

      if (reduce || !('IntersectionObserver' in window)) final();
      else {
        reset();
        /* démarre quand l'illustration est visible, une seule fois */
        const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); play(); } }, { threshold: 0.4 });
        io.observe(demo);
      }
      const replay = $('[data-replay]', demo);
      if (replay) replay.addEventListener('click', () => (reduce ? final() : play()));
    }

    /* à chaque changement de langue : bouton actif, et libellé d'état de l'illustration */
    document.addEventListener('i18n:updated', (e) => { markLang((e.detail && e.detail.lang) || pickLang()); refreshDemo(); });

    /* ---------- De 0 à 100 % : la même liste, deux états ---------- */
    $$('[data-compare]').forEach((box) => {
      const btns = $$('[data-state-btn]', box);
      let touched = false;
      const set = (full) => {
        box.classList.toggle('is-full', full);
        btns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.stateBtn === '100') === full)));
      };
      btns.forEach((b) => b.addEventListener('click', () => { touched = true; set(b.dataset.stateBtn === '100'); }));
      /* une fois à l'écran, la liste se complète d'elle-même (sauf si l'on a déjà choisi, ou en mouvement réduit) */
      if (!reduce && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => {
          if (!es.some((e) => e.isIntersecting)) return;
          io.disconnect();
          setTimeout(() => { if (!touched) set(true); }, 1400);
        }, { threshold: 0.6 });
        io.observe(box);
      }
    });

    /* ---------- Prise de rendez-vous : carte dans la page (Calendly chargé à la première ouverture) ---------- */
    const dlg = $('#rdv');
    if (dlg && typeof dlg.showModal === 'function') {   /* sans <dialog>, le lien ouvre Calendly dans un nouvel onglet */
      const frame = $('iframe', dlg);
      let back = null;
      const open = () => {
        if (dlg.open) return;
        back = document.activeElement !== document.body ? document.activeElement : null;
        if (!frame.getAttribute('src')) {
          const u = new URL(frame.dataset.src);
          u.searchParams.set('embed_domain', location.hostname || 'localhost');
          u.searchParams.set('embed_type', 'Inline');
          u.searchParams.set('hide_gdpr_banner', '1');
          frame.addEventListener('load', () => dlg.classList.add('ready'), { once: true });
          frame.src = u.toString();
        }
        dlg.showModal();
      };
      const close = () => { if (dlg.open) dlg.close(); };
      dlg.addEventListener('close', () => { if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); back = null; });
      $$('[data-rdv]').forEach((a) => a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;   /* nouvel onglet demandé : on laisse faire */
        e.preventDefault(); open();
      }));
      $$('[data-rdv-close]', dlg).forEach((b) => b.addEventListener('click', close));
      dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
      addEventListener('message', (e) => {
        if (e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
        if (e.data.event === 'calendly.event_scheduled') dlg.classList.add('booked');
      });
    }

    /* ---------- Apparitions au défilement ---------- */
    const targets = $$('.dc-hook blockquote, .dc-head, .dc-knots > li, .dc-steps > li, .dc-sub-head, .dc-finds > li, .dc-pull, .dc-loop > li, .dc-dec-txt, .dc-dec-side, .dc-shot, .dc-card-shot, .dc-mini, .dc-vocab > div, .dc-compare, .dc-stats > li, .dc-two > div, .dc-card, .dc-learn > li, .dc-end-in, .dc-more a, .dc-legal');
    targets.forEach((el) => {
      el.setAttribute('data-rv', '');
      const rank = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty('--d', (rank % 5) * 60 + 'ms');
    });
    if (reduce || !('IntersectionObserver' in window)) targets.forEach((el) => el.classList.add('in'));
    else {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
      targets.forEach((el) => io.observe(el));
      /* filet : rien ne reste masqué si l'observateur ne se déclenche pas */
      setTimeout(() => targets.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }), 1500);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
