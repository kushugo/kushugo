/* data-collection.js — étude de cas « Data Collection » (data-collection.html). Sans dépendance.
   Chargé en tête de page : il marque la page « js » tout de suite, puis attend le document pour le reste :
   barre du site, fil de lecture et repère des six temps, langue, illustration de la collecte, bulles en verre,
   schéma « du constat à la décision », chemin des huit écrans, carte de rendez-vous, apparitions au défilement.
   En « mouvement réduit », tout est à l'état final. */
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
    /* ---------- Barre du site : menu replié sous 921 px ---------- */
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
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('is-nav-open')) { setMenu(false); toggle.focus(); }
      });
      mqMenu.addEventListener('change', () => setMenu(false));
      sync();
    }

    /* ---------- Fil de lecture (le « de 0 à 100 % » de la page), barre réduite, repère des six temps ---------- */
    const bar = $('[data-progress]');
    const railLinks = $$('[data-rail] a');
    const chapters = railLinks.map((a) => $(a.getAttribute('href')));
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const max = root.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      if (bar) bar.style.setProperty('--p', p.toFixed(4));
      if (header) header.classList.toggle('scrolled', scrollY > 80);
      let cur = -1;
      const line = innerHeight * 0.4;
      chapters.forEach((s, k) => { if (s && s.getBoundingClientRect().top <= line) cur = k; });
      const last = chapters[chapters.length - 1];
      const past = last && last.getBoundingClientRect().bottom < line;   /* après le dernier temps : tout est lu */
      railLinks.forEach((a, k) => {
        a.classList.toggle('done', k < cur || (past && k === cur));
        if (k === cur && !past) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
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

    /* ---------- Bulles en verre : citations d'un constat, repères d'un écran ----------
       Au survol et au clavier, la mise en forme suffit. Le clic (ou le toucher) épingle la bulle ;
       un clic ailleurs ou la touche Échap la referme. */
    const hostOf = (btn) => btn.closest('.dc-hot') || btn.closest('li');
    const closeGlass = (except) => $$('.dc-hot.is-open, .dc-finds li.is-open').forEach((host) => {
      if (host === except) return;
      host.classList.remove('is-open');
      const b = $('[aria-expanded]', host);
      if (b) b.setAttribute('aria-expanded', 'false');
    });
    $$('.dc-q, .dc-hot > button').forEach((btn) => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const host = hostOf(btn);
      const open = !host.classList.contains('is-open');
      closeGlass(host);
      host.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (!open) btn.blur();   /* sinon le focus garderait la bulle affichée */
    }));
    document.addEventListener('click', (e) => { if (!e.target.closest('.is-open')) closeGlass(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeGlass();
      const a = document.activeElement;
      if (a && a.matches && a.matches('.dc-q, .dc-hot > button')) a.blur();
    });

    /* ---------- Du constat à la décision : les liens se tracent d'une case à l'autre ---------- */
    let redrawFlow = () => {};
    const flow = $('[data-flow]');
    if (flow) {
      const svg = $('.dc-flow-svg', flow);
      const nodes = $$('[data-node]', flow);
      const byId = {};
      nodes.forEach((n) => { byId[n.dataset.node] = n; });
      const edges = [];
      nodes.forEach((to) => (to.dataset.from || '').split(' ').filter(Boolean).forEach((id) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svg.append(path);
        edges.push({ from: byId[id], to, path });
      }));
      redrawFlow = () => {
        const box = flow.getBoundingClientRect();
        if (!box.width) return;   /* masqué sur petit écran */
        svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
        edges.forEach(({ from, to, path }) => {
          const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
          const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
          const x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top;
          const dx = (x2 - x1) * 0.5;
          path.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
        });
      };
      const light = (node) => {
        flow.classList.add('has-focus');
        nodes.forEach((n) => n.classList.remove('on'));
        edges.forEach((e) => {
          const hit = e.from === node || e.to === node;
          e.path.classList.toggle('on', hit);
          if (hit) { e.from.classList.add('on'); e.to.classList.add('on'); }
        });
        node.classList.add('on');
      };
      const dim = () => {
        flow.classList.remove('has-focus');
        nodes.forEach((n) => n.classList.remove('on'));
        edges.forEach((e) => e.path.classList.remove('on'));
      };
      nodes.forEach((n) => {
        n.addEventListener('mouseenter', () => light(n));
        n.addEventListener('focus', () => light(n));
        n.addEventListener('mouseleave', dim);
        n.addEventListener('blur', dim);
      });
      redrawFlow();
      if ('ResizeObserver' in window) new ResizeObserver(redrawFlow).observe(flow);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawFlow);
    }

    /* ---------- Le chemin : onze étapes, une à la fois ---------- */
    let namePath = () => {};
    const path = $('[data-path]');
    if (path) {
      const tabs = $$('[role="tab"]', path), panels = $$('.dc-st', path), segs = $$('[data-seg]', path);
      const prev = $('[data-prev]', path), next = $('[data-next]', path), map = $('.dc-path-map', path);
      const n = panels.length;
      let cur = -1;
      /* nom lisible de chaque pastille : « 3 · Cinq fichiers à redéposer » */
      namePath = () => tabs.forEach((t, i) => { const h = $('h3', panels[i]); if (h) t.setAttribute('aria-label', (i + 1) + ' · ' + h.textContent.trim()); });
      const go = (k, focus) => {
        k = Math.max(0, Math.min(n - 1, k));
        if (k === cur) return;
        const back = k < cur, first = cur === -1;
        closeGlass();
        panels.forEach((p, i) => { p.hidden = i !== k; p.classList.remove('enter', 'back'); });
        if (!first && !reduce) { panels[k].classList.add('enter'); if (back) panels[k].classList.add('back'); }
        tabs.forEach((t, i) => { t.setAttribute('aria-selected', String(i === k)); t.tabIndex = i === k ? 0 : -1; t.classList.toggle('seen', i < k); });
        segs.forEach((s, i) => s.classList.toggle('done', i < k));
        const lane = /\bl(\d)\b/.exec(tabs[k].className);   /* le couloir de l'étape affichée */
        if (map && lane) map.dataset.lane = lane[1];
        if (prev) prev.disabled = k === 0;
        if (next) next.disabled = k === n - 1;
        const ahead = panels[k + 1] && $('img', panels[k + 1]);   /* l'écran suivant se charge d'avance */
        if (ahead) ahead.loading = 'eager';
        cur = k;
        if (focus) tabs[k].focus();
      };
      tabs.forEach((t, i) => t.addEventListener('click', () => go(i)));
      const list = $('[role="tablist"]', path);
      if (list) list.addEventListener('keydown', (e) => {
        const move = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[e.key];
        if (move === undefined) return;
        e.preventDefault();
        go(move, true);
      });
      if (prev) prev.addEventListener('click', () => go(cur - 1));
      if (next) next.addEventListener('click', () => go(cur + 1));
      namePath();
      go(0);
    }

    /* à chaque changement de langue : bouton actif, libellé d'état de l'illustration, noms des pastilles, tracé du schéma */
    document.addEventListener('i18n:updated', (e) => {
      markLang((e.detail && e.detail.lang) || pickLang());
      refreshDemo();
      namePath();
      requestAnimationFrame(redrawFlow);
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
    const targets = $$('.dc-hook blockquote, .dc-map-list > li, .dc-head, .dc-knots > li, .dc-sub-head, .dc-time, .dc-take, .dc-panel, .dc-corpus, .dc-steps > li, .dc-pipe > li, .dc-guards-say, .dc-guards-list > li, .dc-finds > li, .dc-flow, .dc-mini, .dc-vocab > div, .dc-loop > li, .dc-path-map, .dc-path-stage, .dc-edges > li, .dc-stats > li, .dc-two > div, .dc-card, .dc-learn > li, .dc-end-in, .dc-more a, .dc-legal');
    targets.forEach((el) => {
      el.setAttribute('data-rv', '');
      const rank = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty('--d', (rank % 6) * 55 + 'ms');
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
