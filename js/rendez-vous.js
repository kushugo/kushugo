/* Prise de rendez-vous commune aux études de cas : la carte Calendly s'ouvre par-dessus la page.
   Branchement d'une page : la feuille styles/rendez-vous.css, ce script (defer) et l'attribut data-rdv sur un lien
   <a href="https://calendly.com/…" target="_blank" rel="noopener">. Le script fabrique lui-même la carte <dialog>.
   - Sans JavaScript ou sans <dialog>, le lien ouvre Calendly dans un nouvel onglet.
   - Un clic simple ouvre la carte ; un clic avec cmd, ctrl, shift, alt ou la molette est laissé au navigateur.
   - L'agenda n'est chargé qu'à la première ouverture, à l'adresse du lien cliqué si c'est une adresse calendly.com.
   - Textes : mêmes clés que la carte de l'accueil (v3.rdv.*), réécrites en direct par js/i18n.js au changement de langue. */
(() => {
  'use strict';

  if (window.__rdvCalendly) return;   /* script chargé deux fois : un seul branchement */
  if (typeof HTMLDialogElement !== 'function' || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
  window.__rdvCalendly = true;

  const D = document;
  const DEFAUT = 'https://calendly.com/ferrerhugo91300/freelance';

  /* ---------- Textes ---------- */
  /* repli si le moteur de traduction est absent ou pas encore prêt (mêmes textes que i18n/fr.json et i18n/en.json) */
  const REPLI = {
    fr: {
      'contact.holo.button.appointment': 'Prendre rendez-vous',
      'v3.rdv.sub': 'Choisissez un créneau : la confirmation arrive par e-mail.',
      'v3.rdv.done': "C'est réservé. À très vite !",
      'v3.rdv.loading': "Chargement de l'agenda…",
      'v3.rdv.note': "Agenda fourni par Calendly, chargé uniquement à l'ouverture de cette carte.",
      'v3.rdv.open': 'Ouvrir dans Calendly',
      'v3.rdv.close': 'Fermer'
    },
    en: {
      'contact.holo.button.appointment': 'Schedule a meeting',
      'v3.rdv.sub': 'Pick a slot: the confirmation arrives by email.',
      'v3.rdv.done': "You're booked. Talk soon!",
      'v3.rdv.loading': 'Loading the calendar…',
      'v3.rdv.note': 'Calendar provided by Calendly, loaded only when this card opens.',
      'v3.rdv.open': 'Open in Calendly',
      'v3.rdv.close': 'Close'
    }
  };
  const moteur = () => window.__i18n || null;
  /* langue : celle du moteur s'il est là (connue avant même l'arrivée du dictionnaire), sinon celle de la page */
  const langue = () => {
    const m = moteur();
    const l = (m && typeof m.getLang === 'function' && m.getLang()) || D.documentElement.lang || 'fr';
    return String(l).toLowerCase().startsWith('en') ? 'en' : 'fr';
  };
  const texte = (cle) => {
    const repli = REPLI[langue()][cle];
    const m = moteur();
    return m && typeof m.t === 'function' ? m.t(cle, repli) : repli;
  };

  /* adresse Calendly du lien cliqué (data-rdv="https://calendly.com/…" ou href), sinon le rendez-vous par défaut.
     Seul calendly.com est accepté : c'est le seul domaine que la politique de sécurité laisse afficher dans un cadre. */
  const adresse = (lien) => {
    for (const brut of [lien.getAttribute('data-rdv'), lien.getAttribute('href')]) {
      if (!brut) continue;
      try {
        const u = new URL(brut, location.href);
        if (u.protocol === 'https:' && u.hostname === 'calendly.com') return u.origin + u.pathname + u.search;
      } catch (_) { /* adresse illisible : on essaie la suivante */ }
    }
    return DEFAUT;
  };

  /* ---------- Défilement de la page bloqué tant que la carte est ouverte ---------- */
  /* défilements doux connus (Lenis) : arrêtés à l'ouverture, relancés à la fermeture */
  const lisses = () => [window.lenis, window.__lenis, window.FM && window.FM.lenis]
    .filter((l, i, t) => l && typeof l.stop === 'function' && typeof l.start === 'function' && t.indexOf(l) === i);
  let arretes = [], marge = null;

  const verrouiller = () => {
    const h = D.documentElement;
    const st = getComputedStyle(h);
    const barre = window.innerWidth - h.clientWidth;   /* barre de défilement classique (0 si elle se superpose au contenu) */
    /* si le débordement de body remontait à la fenêtre (cas courant), body le garde visible : sinon il deviendrait
       lui-même une zone de défilement et les éléments collants (position: sticky) sauteraient derrière la carte */
    if (st.overflowX === 'visible' && st.overflowY === 'visible') D.body.classList.add('rdv-lock-body');
    h.classList.add('rdv-lock');
    if (barre > 0) {
      h.classList.add('rdv-lock-gutter');   /* la place de la barre reste réservée : la page ne bouge pas */
      /* navigateur sans scrollbar-gutter (anciens Safari) : la largeur de la barre est compensée sur body */
      if (!(window.CSS && CSS.supports && CSS.supports('scrollbar-gutter', 'stable'))) {
        marge = D.body.style.paddingRight;
        D.body.style.paddingRight = `calc(${getComputedStyle(D.body).paddingRight} + ${barre}px)`;
      }
    }
    arretes = lisses();
    arretes.forEach((l) => l.stop());
  };
  const deverrouiller = () => {
    D.documentElement.classList.remove('rdv-lock', 'rdv-lock-gutter');
    D.body.classList.remove('rdv-lock-body');
    if (marge !== null) { D.body.style.paddingRight = marge; marge = null; }
    arretes.forEach((l) => l.start());
    arretes = [];
  };

  /* ---------- Fabrication de la carte (à la première ouverture) ---------- */
  const el = (tag, attrs = {}) => {
    const n = D.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  /* élément traduit : la clé reste posée pour que js/i18n.js le réécrive au changement de langue */
  const traduit = (tag, cle, attrs = {}) => {
    const n = el(tag, { ...attrs, 'data-i18n': cle });
    n.textContent = texte(cle);
    return n;
  };
  const croix = () => {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = D.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const trait = D.createElementNS(NS, 'path');
    trait.setAttribute('d', 'M6 6l12 12M18 6L6 18');
    svg.append(trait);
    return svg;
  };

  let dlg = null, cadre = null, lienCalendly = null, chargee = '', retour = null;

  /* l'agenda en mode intégré, avec les mêmes paramètres que la carte de l'accueil */
  const charger = (url) => {
    const u = new URL(url);
    u.searchParams.set('embed_domain', location.hostname || 'localhost');
    u.searchParams.set('embed_type', 'Inline');
    u.searchParams.set('hide_gdpr_banner', '1');
    dlg.classList.remove('is-ready', 'is-booked');
    cadre.src = u.toString();
    lienCalendly.href = url;
    chargee = url;
  };

  /* à chaque fermeture (bouton, Échap, clic sur le fond) : la page défile de nouveau et le focus revient au lien */
  const apresFermeture = () => {
    deverrouiller();
    const b = retour;
    retour = null;
    if (b && b.isConnected && typeof b.focus === 'function') b.focus({ preventScroll: true });
  };

  const fabriquer = (url) => {
    dlg = el('dialog', { class: 'rdv', id: 'rdv-calendly', 'aria-labelledby': 'rdv-calendly-titre', 'data-lenis-prevent': '' });

    const intro = el('div', { class: 'rdv-intro' });
    intro.append(
      traduit('h2', 'contact.holo.button.appointment', { class: 'rdv-title', id: 'rdv-calendly-titre' }),
      traduit('p', 'v3.rdv.sub', { class: 'rdv-sub' }),
      traduit('p', 'v3.rdv.done', { class: 'rdv-sub rdv-ok', role: 'status' })
    );
    /* bouton de fermeture : pas de texte visible, étiquette traduite dans aria-label ; il reçoit le focus à l'ouverture */
    const fermer = el('button', {
      type: 'button', class: 'rdv-x', autofocus: '', 'aria-label': texte('v3.rdv.close'),
      'data-i18n': 'v3.rdv.close', 'data-i18n-attr': 'aria-label', 'data-i18n-no-text': ''
    });
    fermer.append(croix());
    const tete = el('div', { class: 'rdv-head' });
    tete.append(intro, fermer);

    const attente = el('div', { class: 'rdv-load', 'aria-hidden': 'true' });
    attente.append(el('i'), traduit('span', 'v3.rdv.loading'));
    cadre = el('iframe', { class: 'rdv-frame', title: 'Calendly', allow: 'payment' });
    const corps = el('div', { class: 'rdv-body' });
    corps.append(attente, cadre);

    lienCalendly = el('a', { class: 'rdv-open', href: url, target: '_blank', rel: 'noopener' });
    const fleche = el('span', { 'aria-hidden': 'true' });
    fleche.textContent = '↗';
    lienCalendly.append(traduit('span', 'v3.rdv.open'), ' ', fleche);
    const pied = el('div', { class: 'rdv-foot' });
    pied.append(traduit('span', 'v3.rdv.note', { class: 'rdv-note' }), lienCalendly);

    const carte = el('div', { class: 'rdv-card' });
    carte.append(tete, corps, pied);
    dlg.append(carte);

    /* l'adresse est posée avant l'insertion dans la page : le seul chargement signalé est celui de Calendly */
    cadre.addEventListener('load', () => dlg.classList.add('is-ready'));
    charger(url);

    fermer.addEventListener('click', () => dlg.close());
    /* clic sur le fond : la carte se ferme seulement si l'appui a aussi commencé sur le fond (un glissé depuis la carte ne ferme pas) */
    let surFond = false;
    dlg.addEventListener('pointerdown', (e) => { surFond = e.target === dlg; });
    dlg.addEventListener('click', (e) => { if (e.target === dlg && surFond) dlg.close(); surFond = false; });
    /* Échap ferme nativement la carte ; toutes les fermetures passent par l'événement close */
    dlg.addEventListener('close', apresFermeture);
    /* réservation confirmée par Calendly : la carte passe à l'état « réservé » */
    window.addEventListener('message', (e) => {
      if (e.origin !== 'https://calendly.com' || !e.data || typeof e.data.event !== 'string') return;
      if (e.data.event === 'calendly.event_scheduled') dlg.classList.add('is-booked');
    });

    D.body.append(dlg);
  };

  /* ---------- Ouverture ---------- */
  const ouvrir = (url, declencheur) => {
    if (dlg && dlg.open) return;
    if (!dlg) fabriquer(url);
    else if (url !== chargee) charger(url);
    retour = declencheur;   /* mémorisé ici : un appui tactile ne donne pas toujours le focus au lien */
    verrouiller();
    dlg.showModal();
  };

  D.addEventListener('click', (e) => {
    const lien = e.target && typeof e.target.closest === 'function' ? e.target.closest('[data-rdv]') : null;
    if (!lien || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   /* nouvel onglet demandé : on laisse faire */
    e.preventDefault();
    ouvrir(adresse(lien), lien);
  });

  /* les liens annoncent qu'ils ouvrent une fenêtre de dialogue (seulement quand ce script est là pour l'ouvrir) */
  const annoncer = () => D.querySelectorAll('[data-rdv]').forEach((a) => a.setAttribute('aria-haspopup', 'dialog'));
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', annoncer, { once: true });
  else annoncer();
})();
