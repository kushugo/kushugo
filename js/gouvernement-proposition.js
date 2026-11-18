/* gouvernement-proposition.js : interactions de la proposition de refonte Gouvernement.fr.
   Mêmes gestes que l'étude AgoraSquare (fil de lecture, barre, repère, apparitions, onglets), plus les démonstrations
   propres à cette page : la page refondue en accroche, les maquettes qui défilent, les ateliers,
   le parcours au clavier et le composant Tableau. Aucune dépendance.
   Langue : js/i18n.js remplace les textes de la page ; les phrases écrites par ce script viennent de petites sources
   cachées ([data-strings]) qu'il a déjà traduites, et les gabarits <template> sont traduits ici (i18n.js n'y entre pas). */
(() => {
  'use strict';
  const D = document;
  const root = D.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = D) => c.querySelector(s);
  const $$ = (s, c = D) => Array.from(c.querySelectorAll(s));

  /* Langue : même règle que js/i18n.js. En anglais, les textes restent masqués jusqu'à l'arrivée de la traduction
     (deux secondes et demie au plus) : pas d'éclair de français. */
  const pickLang = () => {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'fr' || q === 'en') return q;
      const st = localStorage.getItem('lang');
      if (st === 'fr' || st === 'en') return st;
    } catch (e) { /* stockage indisponible : on suit le navigateur */ }
    return (navigator.language || 'fr').slice(0, 2).toLowerCase() === 'en' ? 'en' : 'fr';
  };
  if (pickLang() !== 'fr') {
    root.classList.add('ag-wait');
    setTimeout(() => root.classList.remove('ag-wait'), 2500);
  }
  const isEn = () => root.lang === 'en';
  /* Ce qui se réécrit à chaque changement de langue (textes du script, gabarits, libellés calculés) */
  const refreshers = [];
  const onLang = (fn) => { refreshers.push(fn); };
  const runRefreshers = () => refreshers.forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
  D.addEventListener('i18n:updated', () => { root.classList.remove('ag-wait'); runRefreshers(); });
  /* phrase du script, dans la langue de la page */
  const S = (k) => { const e = D.querySelector('[data-s="' + k + '"]'); return e ? e.textContent : ''; };
  /* traduction d'un fragment (gabarit) : mêmes règles que js/i18n.js pour data-i18n */
  const trKey = (k) => { const v = window.__i18n ? window.__i18n.t(k, '\u0001') : '\u0001'; return v === '\u0001' ? null : v; };
  const trFragment = (frag) => $$('[data-i18n]', frag).forEach((el) => {
    const v = trKey(el.getAttribute('data-i18n'));
    if (v === null) return;
    if (el.getAttribute('data-i18n-mode') === 'html') el.innerHTML = v; else el.textContent = v;
  });

  const ready = (fn) => (D.readyState === 'loading' ? D.addEventListener('DOMContentLoaded', fn) : fn());

  ready(() => {
    /* ---------- fil de lecture, barre du site, repère ---------- */
    const bar = $('[data-progress]');
    const header = $('#header');
    const rail = $('[data-rail]');
    const railLinks = rail ? $$('a', rail) : [];
    const railTargets = railLinks.map((a) => D.querySelector(a.getAttribute('href')));
    const onScroll = () => {
      const max = root.scrollHeight - innerHeight;
      if (bar) bar.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
      if (header) header.classList.toggle('scrolled', scrollY > 20);
      if (rail) {
        rail.classList.toggle('show', scrollY > innerHeight * 0.8);
        let cur = -1;
        railTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * 0.45) cur = i; });
        railLinks.forEach((a, i) => {
          a.classList.toggle('done', i < cur);
          if (i === cur) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
        });
      }
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    /* ---------- menu mobile : replié sous 921 px, comme sur AgoraSquare ---------- */
    const toggle = $('.nav-toggle'), menu = $('#primary-navigation');
    const mqMenu = matchMedia('(max-width: 920px)');
    if (toggle && menu) {
      const sync = () => {
        const closed = mqMenu.matches && !D.body.classList.contains('is-nav-open');
        $$('a, button', menu).forEach((el) => { if (closed) el.setAttribute('tabindex', '-1'); else el.removeAttribute('tabindex'); });
      };
      const setMenu = (open) => {
        D.body.classList.toggle('is-nav-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        sync();
      };
      toggle.addEventListener('click', () => setMenu(!D.body.classList.contains('is-nav-open')));
      menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
      D.addEventListener('click', (e) => { if (D.body.classList.contains('is-nav-open') && !e.target.closest('#header')) setMenu(false); });
      D.addEventListener('keydown', (e) => { if (e.key === 'Escape' && D.body.classList.contains('is-nav-open')) { setMenu(false); toggle.focus(); } });
      mqMenu.addEventListener('change', () => setMenu(false));
      sync();
    }

    /* ---------- langue : FR | EN, sans rechargement (js/i18n.js remplace les textes) ---------- */
    const langBtns = $$('[data-lang]');
    const markLang = (lang) => langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    langBtns.forEach((b) => b.addEventListener('click', () => { if (window.__i18n) window.__i18n.setLang(b.dataset.lang); }));
    markLang(pickLang());
    D.addEventListener('i18n:updated', (e) => markLang((e.detail && e.detail.lang) || pickLang()));

    /* ---------- apparitions au défilement ---------- */
    const reveals = $$('[data-reveal]');
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('seen'); io.unobserve(en.target); }
      }), { rootMargin: '0px 0px -10% 0px' });
      reveals.forEach((el) => io.observe(el));
    } else reveals.forEach((el) => el.classList.add('seen'));

    /* ---------- onglets accessibles (flèches, Début, Fin) ---------- */
    const tabs = (tablist, tabSel, panels, onChange) => {
      const list = $$(tabSel, tablist);
      const select = (i, focus) => {
        list.forEach((t, j) => {
          const on = j === i;
          t.setAttribute('aria-selected', String(on));
          t.tabIndex = on ? 0 : -1;
          if (panels[j]) panels[j].hidden = !on;
        });
        if (focus) list[i].focus();
        if (onChange) onChange(i);
      };
      list.forEach((t, i) => {
        t.addEventListener('click', () => select(i, false));
        t.addEventListener('keydown', (e) => {
          const k = e.key;
          let n = null;
          if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % list.length;
          if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + list.length) % list.length;
          if (k === 'Home') n = 0;
          if (k === 'End') n = list.length - 1;
          if (n !== null) { e.preventDefault(); select(n, true); }
        });
      });
      return select;
    };

    /* ---------- accroche : la page refondue ---------- */
    const demo = $('[data-demo]');
    if (demo) {
      const box = $('[data-theme-box]', demo);
      const themeBtn = $('[data-theme]', demo);
      const panel = $('[data-prio-panel]', demo);
      const title = $('[data-prio-title]', demo);
      const prioTexts = $$('[data-prio-text]', demo);
      const slot = $('[data-prio-slot]', demo);
      const bodies = $$('template[data-prio-body]', demo);
      const chips = { titre: $('[data-chip="titre"]', demo), preuve: $('[data-chip="preuve"]', demo), action: $('[data-chip="action"]', demo) };
      const zones = { titre: $('[data-zone="titre"]', demo), preuve: $('[data-zone="preuve"]', demo), action: $('[data-zone="action"]', demo) };
      let timers = [];
      const clear = () => { timers.forEach(clearTimeout); timers = []; };
      const light = (key) => {
        Object.keys(chips).forEach((k) => {
          if (chips[k]) chips[k].classList.toggle('on', k === key);
          if (zones[k]) zones[k].classList.toggle('lit', k === key);
        });
      };
      const tablist = $('[data-prio-tabs]', demo);
      let curPrio = 0;
      const showPrio = (i, animate) => {
        curPrio = i;
        title.textContent = prioTexts[i] ? prioTexts[i].textContent : '';
        if (slot && bodies[i]) slot.replaceChildren(bodies[i].content.cloneNode(true));
        panel.setAttribute('aria-labelledby', $$('[role="tab"]', tablist)[i].id);
        if (animate) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
      };
      const selectPrio = tabs(tablist, '[role="tab"]', [], (i) => showPrio(i, true));
      /* changement de langue : i18n.js n'entre pas dans les <template>, on les traduit ici, puis on réaffiche */
      onLang(() => { bodies.forEach((t) => trFragment(t.content)); showPrio(curPrio, false); });
      /* la lecture d'un bloc : titre, preuve, action */
      const play = (stepMs = 1100) => {
        clear();
        const seq = ['titre', 'preuve', 'action'];
        seq.forEach((k, i) => timers.push(setTimeout(() => light(k), 300 + i * stepMs)));
        timers.push(setTimeout(() => light(null), 300 + seq.length * stepMs + 900));
      };
      $$('[role="tab"]', tablist).forEach((t) => t.addEventListener('click', () => play(800)));
      const themeTitle = () => { themeBtn.title = S(themeBtn.getAttribute('aria-pressed') === 'true' ? 'theme-light' : 'theme-dark'); };
      onLang(themeTitle);
      themeBtn.addEventListener('click', () => {
        const on = themeBtn.getAttribute('aria-pressed') !== 'true';
        themeBtn.setAttribute('aria-pressed', String(on));
        box.classList.toggle('dark', on);
        themeTitle();
      });
      $('[data-replay]', demo).addEventListener('click', () => { selectPrio(0, false); play(); });
      /* au premier affichage : une lecture, puis la priorité suivante */
      if (!reduce) {
        timers.push(setTimeout(() => play(), 700));
        timers.push(setTimeout(() => { selectPrio(1, false); play(900); }, 5600));
      }
    }

    /* ---------- le problème : les maquettes qui défilent seules ---------- */
    const sc = $('[data-scroll]');
    if (sc) {
      const view = $('[data-scroll-view]', sc);
      const sides = $$('[data-scroll-side]', sc);
      const btns = $$('[data-scroll-mode]', sc);
      let paused = false, visible = false, last = 0, resumeT = 0, pos = 0;
      const pause = () => { paused = true; clearTimeout(resumeT); resumeT = setTimeout(() => { paused = false; pos = view.scrollTop; }, 3500); };
      ['pointerenter', 'pointerdown', 'wheel', 'touchstart', 'focus', 'keydown'].forEach((ev) => view.addEventListener(ev, pause, { passive: true }));
      view.addEventListener('pointerleave', () => { clearTimeout(resumeT); resumeT = setTimeout(() => { paused = false; pos = view.scrollTop; }, 800); });
      btns.forEach((b) => b.addEventListener('click', () => {
        const mode = b.dataset.scrollMode;
        btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        sides.forEach((img) => { img.hidden = img.dataset.scrollSide !== mode; });
        view.scrollTop = 0; pos = 0;
      }));
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.35 }).observe(view);
      }
      const tick = (t) => {
        const dt = last ? Math.min(t - last, 64) : 16;
        last = t;
        if (!reduce && visible && !paused) {
          const max = view.scrollHeight - view.clientHeight;
          if (max > 0) {
            pos += dt * 0.045;
            if (pos >= max + 60) pos = -40; /* petite pause en bas, puis retour en haut */
            view.scrollTop = Math.max(0, Math.min(max, pos));
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    /* ---------- ateliers : du diagnostic à la décision ---------- */
    const sess = $('[data-sessions]');
    if (sess) {
      const range = $('[data-sess-range]', sess);
      const cards = $$('[data-sess-card]', sess);
      const marks = $$('.gp-sess-marks li', sess);
      const show = () => {
        const v = Number(range.value);
        cards.forEach((c, i) => { c.hidden = i !== v; });
        marks.forEach((m, i) => m.classList.toggle('on', i === v));
        range.setAttribute('aria-valuetext', S('sess-' + v));
      };
      range.addEventListener('input', show);
      onLang(show);
      show();
    }

    /* ---------- blocs de la page et planches du composant ---------- */
    const mods = $('[data-modules]');
    if (mods) tabs($('[role="tablist"]', mods), '[role="tab"]', $$('[data-mod-panel]', mods));
    const plates = $('[data-plates]');
    if (plates) tabs($('[role="tablist"]', plates), '[role="tab"]', $$('[data-plate-panel]', plates));

    /* ---------- le parcours au clavier ---------- */
    const keys = $('[data-keys]');
    if (keys) {
      const stage = $('[data-keys-stage]', keys);
      const stops = $$('[data-stop]', stage);
      const out = $('[data-keys-out]', keys);
      const say = $('[data-keys-say]', keys);
      let idx = -1;
      const render = () => {
        stops.forEach((s, i) => s.classList.toggle('kf', i === idx));
        if (idx < 0) { out.textContent = S('keys-start'); say.classList.remove('miss'); return; }
        if (stage.dataset.focus === 'off') {
          out.textContent = S('keys-miss');
          say.classList.add('miss');
        } else {
          const said = S('stop-' + stops[idx].dataset.stop);
          out.textContent = isEn() ? '"' + said + '"' : '« ' + said + ' »';
          say.classList.remove('miss');
        }
      };
      stops.forEach((s, i) => {
        s.tabIndex = 0;
        s.addEventListener('focus', () => { idx = i; render(); });
        s.addEventListener('click', () => { idx = i; render(); });
      });
      $('[data-keys-next]', keys).addEventListener('click', () => { idx = (idx + 1) % stops.length; render(); });
      $('[data-keys-reset]', keys).addEventListener('click', () => { idx = -1; render(); });
      $$('[data-focus-mode]', keys).forEach((b) => b.addEventListener('click', () => {
        $$('[data-focus-mode]', keys).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        stage.dataset.focus = b.dataset.focusMode;
        render();
      }));
      onLang(render);
      render();
    }

    /* ---------- le composant Tableau ---------- */
    const table = $('[data-table]');
    if (table) {
      const rows = $$('[data-row]', table);
      const count = $('[data-table-count]', table);
      const group = $('[data-group-action]', table);
      const wrap = $('[data-table-wrap]', table);
      const upd = () => {
        const n = rows.filter((r) => r.checked).length;
        rows.forEach((r) => r.closest('tr').classList.toggle('sel', r.checked));
        count.textContent = n === 0 ? S('rows-0') : n === 1 ? S('rows-1') : S('rows-n').replace('{n}', n);
        group.hidden = n === 0;
      };
      /* sur téléphone, la vue en cartes d'abord : c'est elle qui a été pensée pour le mobile */
      if (matchMedia('(max-width: 640px)').matches) {
        wrap.dataset.viewMode = 'list';
        $$('[data-view]', table).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === 'list')));
      }
      rows.forEach((r) => r.addEventListener('change', upd));
      group.addEventListener('click', () => { count.textContent = S('group-done').replace('{n}', rows.filter((r) => r.checked).length); });
      $$('[data-view]', table).forEach((b) => b.addEventListener('click', () => {
        $$('[data-view]', table).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        wrap.dataset.viewMode = b.dataset.view;
        wrap.classList.remove('swap'); void wrap.offsetWidth; wrap.classList.add('swap');
      }));
      /* étiquettes de la vue en cartes : celles des en-têtes, déjà traduits */
      const heads = $$('thead th', table);
      const labels = () => $$('td[data-th]', table).forEach((td) => { const h = heads[td.cellIndex]; if (h) td.dataset.th = h.textContent.trim(); });
      onLang(() => { labels(); upd(); });
      labels();
      upd();
    }

    /* si la traduction est arrivée avant que la page ne soit prête */
    if (window.__i18n && root.classList.contains('i18n-ready')) runRefreshers();
  });
})();
