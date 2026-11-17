/* mesure.js : mesure d'audience avec Microsoft Clarity, soumise au consentement du visiteur.
   - Clarity ne se charge qu'après un clic sur « Accepter » (recommandation CNIL sur les outils de rejeu de session).
     Avant ou sans accord : aucun script tiers, aucun cookie, aucune balise envoyée.
   - Le choix est gardé 6 mois dans le navigateur, puis redemandé. Le lien « Cookies » ajouté au pied de page
     rouvre le bandeau à tout moment (retirer son accord est aussi simple que le donner).
   - Vercel Analytics (sans cookie) continue de compter les visites pour tout le monde, il n'est pas concerné.
   - Balises : un écouteur unique classe chaque clic sur un élément cliquable (contact, rendez-vous, études de cas,
     démos, sommaire, images, navigation...), plus la profondeur de lecture, les sections vues, le temps actif,
     la copie de l'e-mail et les réservations Calendly. Elles partent dans Clarity comme « événements personnalisés »
     et « balises » (filtres des enregistrements et des cartes de clics). Les clics sur ce qui ressemble à un bouton
     sans en être un sont relevés par Clarity lui-même (« clics morts »).
   - Niveau du visiteur, pour la session : curieux (par défaut), intéressé, prospect. Règles dans niveau() plus bas,
     guide de lecture dans Agence OS (livrables/design/mesure-clarity-guide.md).
   Branchement d'une page : styles/mesure.css et ce script (defer). Rien d'autre. */
(() => {
  'use strict';

  /* identifiant du projet Clarity (clarity.microsoft.com > Paramètres > Vue d'ensemble).
     Vide : le bandeau ne s'affiche pas et rien n'est mesuré au-delà de Vercel Analytics. */
  const CLARITY_ID = 'zepv781dqi';

  if (!CLARITY_ID || window.__mesure) return;
  window.__mesure = true;

  const D = document;
  const CLE = 'mesure-consentement';
  const DUREE = 182 * 24 * 3600 * 1000;   /* 6 mois */
  const lang = () => ((D.documentElement.lang || 'fr').slice(0, 2) === 'en' ? 'en' : 'fr');
  const T = {
    fr: {
      titre: 'Mesure d\'audience',
      texte: 'J\'utilise Microsoft Clarity pour comprendre comment ce site est utilisé (clics, défilement, enregistrements des visites, champs masqués) et l\'améliorer. Rien ne démarre sans votre accord.',
      accepter: 'Accepter', refuser: 'Refuser', lien: 'Cookies',
      aria: 'Choix de la mesure d\'audience'
    },
    en: {
      titre: 'Analytics',
      texte: 'I use Microsoft Clarity to understand how this site is used (clicks, scrolling, session recordings with fields masked) and improve it. Nothing starts without your consent.',
      accepter: 'Accept', refuser: 'Decline', lien: 'Cookies',
      aria: 'Analytics choice'
    }
  };

  /* ---------- Choix enregistré ---------- */
  const lire = () => {
    try {
      const v = JSON.parse(localStorage.getItem(CLE) || 'null');
      if (v && (v.c === 'oui' || v.c === 'non') && Date.now() - v.t < DUREE) return v.c;
    } catch (e) {}
    return null;
  };
  const ecrire = (c) => { try { localStorage.setItem(CLE, JSON.stringify({ c, t: Date.now() })); } catch (e) {} };

  /* ---------- Clarity ---------- */
  let actif = false;
  const charger = () => {
    if (actif) return;
    actif = true;
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    const s = D.createElement('script');
    s.async = true; s.src = 'https://www.clarity.ms/tag/' + encodeURIComponent(CLARITY_ID);
    D.head.appendChild(s);
    window.clarity('consent');
    window.clarity('set', 'page', page());
    window.clarity('set', 'langue', lang());
    session();
    tempsActif();
  };
  const couper = () => {
    if (window.clarity) { try { window.clarity('consent', false); } catch (e) {} }   /* efface les cookies Clarity */
    actif = false;
  };
  const balise = (nom, cle, val) => {
    if (!actif || !window.clarity) return;
    window.clarity('event', nom);
    if (cle) window.clarity('set', cle, String(val).slice(0, 80));
    niveau(nom);
  };
  window.mesure = balise;   /* utilisable par les autres scripts : window.mesure('nom_evenement') */

  /* type de page, pour filtrer les enregistrements par page dans Clarity */
  function page() {
    const p = decodeURIComponent(location.pathname).toLowerCase();
    if (p === '/' || p.endsWith('/index.html')) return 'accueil';
    if (p.includes('gouvernement')) return 'etude_gouvernement';
    if (p.includes('agorasquare')) return 'etude_agorasquare';
    if (p.includes('data-collection')) return 'etude_data_collection';
    if (p.includes('delicorner')) return 'etude_delicorner';
    if (p.includes('gomind')) return 'etude_gomind';
    return p.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'autre';
  }

  /* ---------- Bandeau ---------- */
  let bandeau = null;
  const montrer = () => {
    const t = T[lang()];
    if (!bandeau) {
      bandeau = D.createElement('section');
      bandeau.className = 'mz-bandeau';
      bandeau.setAttribute('role', 'region');
      bandeau.innerHTML = '<p class="mz-t"></p><p class="mz-x"></p><div class="mz-b"><button type="button" data-mz="non"></button><button type="button" data-mz="oui"></button></div>';
      bandeau.addEventListener('click', (e) => {
        const b = e.target.closest('[data-mz]');
        if (!b) return;
        const c = b.dataset.mz;
        ecrire(c);
        if (c === 'oui') charger(); else couper();
        cacher();
      });
      D.body.appendChild(bandeau);
    }
    bandeau.setAttribute('aria-label', t.aria);
    bandeau.querySelector('.mz-t').textContent = t.titre;
    bandeau.querySelector('.mz-x').textContent = t.texte;
    bandeau.querySelector('[data-mz="non"]').textContent = t.refuser;
    bandeau.querySelector('[data-mz="oui"]').textContent = t.accepter;
    bandeau.hidden = false;
    requestAnimationFrame(() => bandeau.classList.add('in'));
  };
  const cacher = () => { if (!bandeau) return; bandeau.classList.remove('in'); bandeau.hidden = true; };

  /* lien « Cookies » dans le pied de page (ou discret en bas de page s'il n'y a pas de pied de page) */
  const lienPied = () => {
    const pied = D.querySelector('footer[role="contentinfo"], .ag-foot, .case-footer') ||
      [...D.querySelectorAll('footer')].filter((f) => !f.closest('blockquote, figure')).pop();
    const a = D.createElement('button');
    a.type = 'button'; a.className = 'mz-lien'; a.textContent = T[lang()].lien;
    a.addEventListener('click', montrer);
    if (pied) pied.appendChild(a); else { a.classList.add('mz-lien--seul'); D.body.appendChild(a); }
  };

  /* ---------- Niveau du visiteur (pour toute la session, d'une page à l'autre) ----------
     - prospect : un geste de contact (bouton mission, offre d'audit, carte de rendez-vous, e-mail cliqué ou copié,
       LinkedIn, CV).
     - intéressé : l'un de ces signaux : ouvre une étude de cas depuis l'accueil, lit 75 % d'une étude de cas,
       reste 90 secondes actives sur une page, ou utilise 2 éléments différents parmi les démos, fiches projet,
       aperçus, filtres, tags, sommaire, images, questions et mode immersif.
     - curieux : aucun de ces signaux (valeur de départ).
     Le niveau ne redescend jamais. Il part dans Clarity en balise « niveau » et en événement niveau_interesse /
     niveau_prospect (une fois par session). Un prospect est aussi marqué prioritaire (clarity upgrade). */
  const INTENTION = ['cta_mission', 'offre_audit', 'rdv_ouverture', 'rdv_creneau_choisi', 'rdv_reserve',
    'contact_email', 'email_copie', 'lien_linkedin', 'cv_ouvert'];
  const INTERET = ['etude_de_cas', 'fiche_projet', 'apercu_projet', 'projet_clic', 'mode_immersif', 'immersif_colis',
    'demo_interactive', 'sommaire_etude', 'image_agrandie', 'faq_ouverte', 'tag_niveau', 'filtre_projets',
    'palette_commandes'];
  const RANG = { curieux: 0, interesse: 1, prospect: 2 };
  const CLE_S = 'mesure-session';
  let etat = { niveau: 'curieux', vus: [], pages: 0, etudes: [] };
  const sauver = () => { try { sessionStorage.setItem(CLE_S, JSON.stringify(etat)); } catch (e) {} };
  const monter = (n) => {
    if (RANG[n] <= RANG[etat.niveau]) return;
    etat.niveau = n; sauver();
    window.clarity('set', 'niveau', n);
    window.clarity('event', 'niveau_' + n);
    if (n === 'prospect') window.clarity('upgrade', 'prospect');
  };
  function niveau(nom) {
    if (INTENTION.includes(nom)) return monter('prospect');
    const etude = page().startsWith('etude_');
    if (nom === 'etude_de_cas' || nom === 'actif_90s' || (etude && nom === 'lecture_75')) return monter('interesse');
    if (INTERET.includes(nom) && !etat.vus.includes(nom)) {
      etat.vus.push(nom); sauver();
      if (etat.vus.length >= 2) monter('interesse');
    }
  }
  /* au chargement (après accord) : reprend la session, compte les pages et les études vues.
     Balises « pages_vues » et « etudes_vues » : Clarity garde chaque valeur envoyée, donc filtrer sur 3
     donne les sessions d'au moins 3 pages. */
  function session() {
    try { const v = JSON.parse(sessionStorage.getItem(CLE_S) || 'null'); if (v && RANG[v.niveau] != null) etat = Object.assign(etat, v); } catch (e) {}
    etat.pages++;
    const pg = page();
    if (pg.startsWith('etude_') && !etat.etudes.includes(pg)) etat.etudes.push(pg);
    sauver();
    window.clarity('set', 'niveau', etat.niveau);
    window.clarity('set', 'pages_vues', String(etat.pages));
    if (etat.etudes.length) window.clarity('set', 'etudes_vues', String(etat.etudes.length));
  }

  /* temps actif sur la page : page visible ET un geste (défilement, souris, clavier, toucher) dans les 15 dernières
     secondes. Événements actif_30s, actif_90s, actif_3min, une fois chacun par page. */
  let tempsLance = false;
  function tempsActif() {
    if (tempsLance) return;
    tempsLance = true;
    let dernier = Date.now(), secondes = 0;
    const paliersT = [[30, 'actif_30s'], [90, 'actif_90s'], [180, 'actif_3min']];
    const geste = () => { dernier = Date.now(); };
    ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((t) => addEventListener(t, geste, { passive: true }));
    const minuteur = setInterval(() => {
      if (!actif || D.visibilityState !== 'visible' || Date.now() - dernier > 15000) return;
      secondes++;
      while (paliersT.length && secondes >= paliersT[0][0]) balise(paliersT.shift()[1]);
      if (!paliersT.length) clearInterval(minuteur);
    }, 1000);
  }

  /* ---------- Balises de clic ----------
     Chaque clic sur un élément cliquable reçoit un nom, dans cet ordre (la première règle qui correspond gagne).
     nom null : clic ignoré (boutons de fermeture, liens d'évitement). */
  const ETUDES = 'a[href*="gouvernement-detail"], a[href*="agorasquare-good"], a[href*="data-collection"], a[href*="delicorner-preview"], a[href*="gomind-good"]';
  const regles = [
    /* intention de contact */
    ['.nav-cta', 'cta_mission'],
    ['.pr-offer', 'offre_audit'],   /* avant la règle rendez-vous : l'offre ouvre aussi la carte */
    ['[data-rdv], [data-open-rdv], [data-empty-cal], a[href*="calendly.com"]', 'rdv_ouverture'],
    ['.rdv-x, [data-rdv-close]', 'rdv_fermee'],
    ['a[href^="mailto:"]', 'contact_email'],
    ['a[href*="linkedin.com"]', 'lien_linkedin'],
    ['a[href$=".pdf"], a[href*="/cv"], a[href*="CV"]', 'cv_ouvert'],
    /* intérêt pour le contenu */
    ['a[href*="immersi"], #immToggle', 'mode_immersif'],
    [ETUDES, 'etude_de_cas'],
    ['.imm-box[data-step]', 'immersif_colis'],
    ['[data-peek]', 'apercu_projet'],
    ['.res-h, [data-insp], #detBtn, button[aria-label^="Projet "], button[aria-label^="Project "]', 'projet_clic'],
    ['.skill-tag[data-lvl]', 'tag_niveau'],
    ['button.chip', 'filtre_projets'],
    ['.dock-k', 'palette_commandes'],
    ['.hero-zoom-button, .gal-card, [data-lightbox], [data-zoom]', 'image_agrandie'],
    ['summary', 'faq_ouverte'],
    ['.toc-item, .chap-mile, .chap-cta, .chap-more', 'sommaire_etude'],
    /* navigation et réglages */
    ['[data-lang], [onclick*="setLang"]', 'changement_langue'],
    ['.mz-lien', 'cookies'],
    ['.nav-toggle', 'menu_mobile'],
    ['.insp-x, .cmdk-x, .lightbox-close, .mvp-lb-close, .imm-panel-close, .imm-exit, .chap-exit, .skip, .ag-skip, .dc-skip', null],
    ['a[href*="index.html"][href*="#projets"]', 'autres_etudes'],
    ['a.logo, a[href="/"], a[href*="index.html"]', 'retour_accueil']
  ];
  const CLIQUABLE = 'a[href], button, summary, label, input, select, textarea, [role="button"], [role="tab"], [role="link"], [onclick], [tabindex]:not([tabindex="-1"])';
  /* l'élément cliqué ressemble-t-il à un bouton (curseur main) ? on remonte 3 niveaux au plus */
  const curseurMain = (el) => {
    for (let k = 0; el && el !== D.body && k < 4; k++, el = el.parentElement) {
      if (getComputedStyle(el).cursor === 'pointer') return el;
    }
    return null;
  };
  function classer(cible) {
    for (const [sel, nom] of regles) {
      const el = cible.closest(sel);
      if (el) return [nom, el];
    }
    const el = cible.closest(CLIQUABLE) || curseurMain(cible);
    if (!el || el.closest('.mz-bandeau')) return [null, null];
    const zoneNav = el.closest('header, nav, footer, [role="navigation"], [role="contentinfo"]');
    if (el.matches('a[href]')) {
      const href = el.getAttribute('href') || '';
      if (href.startsWith('#')) return [page().startsWith('etude_') ? 'sommaire_etude' : 'navigation', el];   /* chapitres d'une étude */
      if (/^https?:/i.test(href) && !href.includes(location.host)) return ['lien_externe', el];
      return ['navigation', el];
    }
    return [zoneNav ? 'navigation' : 'demo_interactive', el];
  }
  D.addEventListener('click', (e) => {
    if (!actif || !(e.target instanceof Element)) return;
    const [nom, el] = classer(e.target);
    if (!nom) return;
    const libelle = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('href') || '').trim().replace(/\s+/g, ' ');
    balise(nom, 'dernier_clic', nom + ' : ' + libelle);
  }, true);

  /* e-mail copié à la main (un recruteur copie souvent l'adresse au lieu de cliquer) */
  D.addEventListener('copy', () => {
    if (actif && /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(String(getSelection()))) balise('email_copie');
  });

  /* fiche projet de l'accueil : ouverture et projet consulté */
  const insp = D.querySelector('.insp');
  if (insp) {
    let ouverte = false;
    new MutationObserver(() => {
      const on = insp.classList.contains('on');
      if (on && !ouverte) {
        const titre = (D.getElementById('insp-t') || {}).textContent || '';
        balise('fiche_projet', 'fiche_projet', titre);
      }
      ouverte = on;
    }).observe(insp, { attributes: true, attributeFilter: ['class'] });
  }

  /* réservation confirmée dans Calendly (message envoyé par la carte de rendez-vous) */
  addEventListener('message', (e) => {
    if (!/^https:\/\/([a-z0-9-]+\.)?calendly\.com$/.test(e.origin)) return;
    const ev = e.data && e.data.event;
    if (ev === 'calendly.event_scheduled') balise('rdv_reserve');
    else if (ev === 'calendly.date_and_time_selected') balise('rdv_creneau_choisi');
  });

  /* profondeur de lecture : 25, 50, 75 et 100 % de la page, une fois chacune */
  const paliers = [25, 50, 75, 100];
  let atteint = 0, rafP = 0;
  addEventListener('scroll', () => {
    if (!actif || rafP) return;
    rafP = requestAnimationFrame(() => {
      rafP = 0;
      const h = D.documentElement.scrollHeight - innerHeight;
      const pct = h > 0 ? (scrollY / h) * 100 : 100;
      while (atteint < paliers.length && pct >= paliers[atteint] - 1) { balise('lecture_' + paliers[atteint]); atteint++; }
    });
  }, { passive: true });

  /* sections vues (au moins 40 % à l'écran), une fois chacune */
  if ('IntersectionObserver' in window) {
    const vues = new Set();
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!actif || !en.isIntersecting) return;
      const id = en.target.id;
      if (vues.has(id)) return;
      vues.add(id); balise('section_' + id.replace(/[^a-z0-9]+/gi, '_').toLowerCase());
    }), { threshold: 0.4 });
    D.querySelectorAll('section[id]').forEach((s) => io.observe(s));
  }

  /* ---------- Démarrage ---------- */
  const go = () => {
    lienPied();
    const c = lire();
    if (c === 'oui') charger();
    else if (c === null) montrer();
  };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', go); else go();
})();
