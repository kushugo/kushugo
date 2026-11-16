/* mesure.js : mesure d'audience avec Microsoft Clarity, soumise au consentement du visiteur.
   - Clarity ne se charge qu'après un clic sur « Accepter » (recommandation CNIL sur les outils de rejeu de session).
     Avant ou sans accord : aucun script tiers, aucun cookie, aucune balise envoyée.
   - Le choix est gardé 6 mois dans le navigateur, puis redemandé. Le lien « Cookies » ajouté au pied de page
     rouvre le bandeau à tout moment (retirer son accord est aussi simple que le donner).
   - Vercel Analytics (sans cookie) continue de compter les visites pour tout le monde, il n'est pas concerné.
   - Balises : un écouteur unique repère les clics utiles (boutons de contact, rendez-vous, études de cas...),
     la profondeur de lecture, les sections vues et les réservations Calendly. Elles partent dans Clarity
     comme « événements personnalisés » (filtres des enregistrements et des cartes de clics).
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
  };
  const couper = () => {
    if (window.clarity) { try { window.clarity('consent', false); } catch (e) {} }   /* efface les cookies Clarity */
    actif = false;
  };
  const balise = (nom, cle, val) => {
    if (!actif || !window.clarity) return;
    window.clarity('event', nom);
    if (cle) window.clarity('set', cle, String(val).slice(0, 80));
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

  /* ---------- Balises ---------- */
  const regles = [
    ['.nav-cta', 'cta_mission'],
    ['[data-rdv], [data-open-rdv], a[href*="calendly.com"]', 'rdv_ouverture'],
    ['a[href^="mailto:"]', 'contact_email'],
    ['a[href*="linkedin.com"]', 'lien_linkedin'],
    ['a[href$=".pdf"], a[href*="/cv"], a[href*="CV"]', 'cv_ouvert'],
    ['.pr-offer', 'offre_audit'],
    ['a[href*="gouvernement-detail"], a[href*="agorasquare-good"], a[href*="data-collection"], a[href*="delicorner-preview"], a[href*="gomind-good"]', 'etude_de_cas'],
    ['a[href*="immersi"], #immToggle', 'mode_immersif'],
    ['.imm-box[data-step]', 'immersif_colis'],
    ['.skill-tag[data-lvl]', 'tag_niveau'],
    ['[data-lang]', 'changement_langue'],
    ['[data-peek]', 'apercu_projet']
  ];
  D.addEventListener('click', (e) => {
    if (!actif) return;
    for (const [sel, nom] of regles) {
      const el = e.target.closest(sel);
      if (!el) continue;
      const libelle = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('href') || '').trim().replace(/\s+/g, ' ');
      balise(nom, 'dernier_clic', nom + ' : ' + libelle);
      break;
    }
  }, true);

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
