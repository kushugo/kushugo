/* accueil.js — page d'accueil (index.html) : galerie, dock, rail, palette, inspecteur, sélection de projets.
   Dans les commentaires : « F » = cette partie de la page, « V » = les sections de js/accueil-sections.js, « mix : » = réglage fait pour les assembler.
   Textes : js/accueil-contenu.fr.js / .en.js (window.ACCUEIL_CONTENU) ; langue choisie comme js/i18n.js.
   Chargé sans defer dans le <head> : la 1re partie pose les classes de <html> avant la peinture,
   le reste attend DOMContentLoaded (GSAP, Lenis et three.js, chargés en defer, sont alors exécutés). */
(function () {
  var d = document.documentElement, ok = false;
  d.dataset.theme = 'dark'; /* mix : thème sombre uniquement */
  try { var c = document.createElement('canvas'); ok = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) {}
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.classList.add('js', (ok && !rm) ? 'gl' : 'no-gl');
  if (rm) d.classList.add('rm');
  /* langue : même ordre que js/i18n.js (paramètre ?lang=, préférence enregistrée, langue du navigateur, français) */
  var L = 'fr', ok2 = function (v) { return v === 'fr' || v === 'en'; };
  try { var q = new URLSearchParams(location.search).get('lang'), st = localStorage.getItem('lang'), b = (navigator.language || 'fr').slice(0, 2).toLowerCase(); L = ok2(q) ? q : ok2(st) ? st : ok2(b) ? b : 'fr'; } catch (e) {}
  window.__accLang = L; d.lang = L;
  /* filet : si js/i18n.js ne répond pas, les textes data-i18n ne restent pas masqués */
  setTimeout(function () { d.classList.add('i18n-ready'); }, 2500);
})();

document.addEventListener('DOMContentLoaded', () => {
'use strict';
const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl';
const ALT = isMac ? '⌥' : 'Alt';
$$('[data-mod]').forEach(e => e.textContent = MOD);
$$('[data-alt]').forEach(e => e.textContent = ALT);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad2 = n => String(n + 1).padStart(2, '0');
/* textes de la langue courante (accueil-contenu.<langue>.js) ; gabarits {n}, {t}, {s}, {num}, {k}, {q} */
const LANG = window.__accLang || 'fr';
const C = (window.ACCUEIL_CONTENU || {})[LANG] || window.ACCUEIL_CONTENU.fr;
const T = C.ui;
const fmt = (str, o = {}) => String(str).replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));
const plural = (arr, n) => fmt(arr[(LANG === 'fr' ? n > 1 : n !== 1) ? 1 : 0], { n });
const HAS_GSAP = !!window.gsap;
let useGL = root.classList.contains('gl') && !!window.THREE && HAS_GSAP;
if (!useGL) { root.classList.remove('gl'); root.classList.add('no-gl'); }

/* textures en base64 (contourne le blocage file:// de Chrome, comme index-galerie) */
/* visuels de la galerie : fichiers décodés depuis le base64 de F (image/accueil/) */
const TEX = { deli: 'image/accueil/deli.webp', gouv: 'image/accueil/gouv.webp', agora: 'image/accueil/agora.webp', gomind: 'image/accueil/gomind.webp', collecte: 'image/accueil/collecte.webp' };

/* ── Icônes ── */
const I = {
  proj:'<svg class="ic" viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1.2"/><rect x="9" y="2" width="5" height="5" rx="1.2"/><rect x="2" y="9" width="5" height="5" rx="1.2"/><rect x="9" y="9" width="5" height="5" rx="1.2"/></svg>',
  home:'<svg class="ic" viewBox="0 0 16 16"><path d="M2.5 7.5 8 3l5.5 4.5V13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z"/><path d="M6.5 14v-4h3v4"/></svg>',
  user:'<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.8-2.4 2.7-3.5 5-3.5s4.2 1.1 5 3.5"/></svg>',
  log:'<svg class="ic" viewBox="0 0 16 16"><circle cx="4" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><path d="M4 5.5v5M7.5 4h6M7.5 12h6M7.5 8h4"/></svg>',
  mail:'<svg class="ic" viewBox="0 0 16 16"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
  skill:'<svg class="ic" viewBox="0 0 16 16"><path d="M3 4.5 6.5 8 3 11.5M8.5 12H13"/></svg>',
  client:'<svg class="ic" viewBox="0 0 16 16"><path d="M2.5 14V3h6.5v11M9 6.5h4.5V14M1.5 14h13M5 5.5h1.5M5 8h1.5M5 10.5h1.5"/></svg>',
  bolt:'<svg class="ic" viewBox="0 0 16 16"><path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"/></svg>',
  nav:'<svg class="ic" viewBox="0 0 16 16"><path d="M8 3v10M4 9l4 4 4-4"/></svg>',
  cal:'<svg class="ic" viewBox="0 0 16 16"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/></svg>',
  copy:'<svg class="ic" viewBox="0 0 16 16"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>',
  out:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12"/></svg>',
  arrow:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
  check:'<svg class="ic" viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7"/></svg>',
  plus:'<svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
  a11y:'<svg class="ic" viewBox="0 0 16 16"><circle cx="8" cy="3" r="1.3"/><path d="M3 5.5c1.6.6 3.3.9 5 .9s3.4-.3 5-.9M8 6.4V10m0 0-2.2 4.5M8 10l2.2 4.5"/></svg>',
  layers:'<svg class="ic" viewBox="0 0 16 16"><path d="m8 2 6 3.2-6 3.2-6-3.2zM2 8.2l6 3.2 6-3.2M2 11l6 3.2 6-3.2"/></svg>',
  search:'<svg class="ic" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>',
  pen:'<svg class="ic" viewBox="0 0 16 16"><path d="m10.5 2.5 3 3L6 13H3v-3z"/></svg>',
  bulb:'<svg class="ic" viewBox="0 0 16 16"><path d="M6 12.5h4M6.5 14.5h3M8 1.5a4.5 4.5 0 0 0-2.5 8.2V11h5V9.7A4.5 4.5 0 0 0 8 1.5z"/></svg>',
  agent:'<svg class="ic" viewBox="0 0 16 16"><rect x="3" y="5" width="10" height="8" rx="2"/><path d="M8 5V2.5M6 9h0M10 9h0M1.5 8.5v2M14.5 8.5v2"/></svg>',
  spark:'<svg class="ic" viewBox="0 0 16 16"><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.4 3.4l2.1 2.1M10.5 10.5l2.1 2.1M3.4 12.6l2.1-2.1M10.5 5.5l2.1-2.1"/></svg>',
  doc:'<svg class="ic" viewBox="0 0 16 16"><path d="M4 1.5h5.5L12.5 4.5v10h-8.5z"/><path d="M9 1.5V5h3.5M6 8h4.5M6 10.5h4.5"/></svg>',
  cube:'<svg class="ic" viewBox="0 0 16 16"><path d="m8 1.8 5.5 3.1v6.2L8 14.2l-5.5-3.1V4.9z"/><path d="M2.5 4.9 8 8l5.5-3.1M8 8v6.2"/></svg>',
  panel:'<svg class="ic" viewBox="0 0 16 16"><rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M2 7h12"/></svg>'
};

/* ── Contenu (source unique : galerie + liste + inspecteur + palette) ── */
const IMG = 'image/images_webp/';
const CAL = 'https://calendly.com/ferrerhugo91300/freelance';
const LI = 'https://www.linkedin.com/in/hugo-ferrer-0038a517a/';
const IMM = 'delico%20projet/delicorner-preview.html?immersive=1';
const PROJECTS = [
  { id:'delicorner', tex:'deli', hue:150, title:'Délicorner', thumb:'image/accueil/delicorner-thumb.webp',
    main:{ src:'delico%20projet/delicorner-cover.jpg' },
    float:{ video:'delico%20projet/delicorner-scene.mp4', poster:'delico%20projet/delicorner-scene-poster.jpg', style:'width:46%;aspect-ratio:16/9;left:5%;bottom:7%' },
    case:'delico%20projet/delicorner-preview.html', immersive:IMM },
  { id:'gouv', tex:'gouv', hue:262, title:'Gouvernement.fr', thumb:IMG+'gouvcover.webp',
    main:{ src:IMG+'gouvcover.webp', cls:'light contain' },
    float:{ src:IMG+'bg-gouv.webp', style:'width:40%;aspect-ratio:1468/827;right:5%;bottom:6%' },
    case:'gouvernement-detail.html' },
  { id:'agora', tex:'agora', hue:278, title:'AgoraSquare', thumb:IMG+'agorasquare-hero-2.webp',
    main:{ src:IMG+'agorasquare-hero-2.webp', cls:'light', pos:'left top' },
    float:{ src:IMG+'agorasquare-hero.webp', style:'width:40%;aspect-ratio:878/540;left:5%;bottom:7%' },
    case:'agorasquare-good.html' },
  { id:'gomind', tex:'gomind', hue:300, title:'GoMind', thumb:IMG+'apr%C3%A8s%201.webp',
    main:{ src:IMG+'apr%C3%A8s%201.webp' },
    float:{ src:IMG+'apres.webp', style:'width:26%;aspect-ratio:1280/1400;right:5%;bottom:6%' },
    case:'gomind-good.html' },
  { id:'collecte', tex:'collecte', hue:286, title:'Data Collection', thumb:'image/accueil/collecte-thumb.webp',
    main:{ src:'image/data-collection/collecte-suivi.webp', cls:'light', pos:'left top' },
    float:{ src:'image/data-collection/collecte-relance-liste.webp', style:'width:38%;aspect-ratio:600/272;right:5%;bottom:6%' },
    case:'data-collection.html' }
];
/* textes des projets dans la langue courante (noms propres : ci-dessus) */
PROJECTS.forEach(p => {
  const t = C.projets[p.id];
  ['sector', 'sub', 'chip', 'lead', 'desc', 'facts', 'tags', 'kw'].forEach(k => { if (t[k] != null) p[k] = t[k]; });
  p.main.alt = t.main_alt;
  if (p.float) { p.float.cap = t.float_cap; p.float.alt = t.float_alt; }
});
const N = PROJECTS.length;
/* mix : les compétences sont les six cartes « Expertise & Compétences » de V (même ordre, mêmes textes) ;
   card = rang de la carte dans .expertise-grid */
const SKILLS = [
  { id:'research', card:0, key:'R', ic:I.search }, { id:'ui', card:1, key:'U', ic:I.pen }, { id:'thinking', card:2, key:'T', ic:I.bulb },
  { id:'tools', card:3, key:'O', ic:I.cube }, { id:'mcp', card:4, key:'M', ic:I.agent }, { id:'ai', card:5, key:'A', ic:I.layers }
].map(s => Object.assign(s, C.competences[s.id]));
/* mix : les clients sont les marques du bandeau de V (logos blancs détourés, tuile sombre) */
const LOGO = 'image/logos-blancs/';
const CLIENTS = [
  { id:'c-gouv', title:'Gouvernement.fr', logo:LOGO+'gouv.png', proj:'gouv', dark:true },
  { id:'c-tf1', title:'TF1 Factory', logo:LOGO+'tf1.png', dark:true },
  { id:'c-agora', title:'AgoraSquare', logo:LOGO+'agorasquare.png', proj:'agora', dark:true },
  { id:'c-mc', title:'Master Coach', logo:LOGO+'mastercoach.png', dark:true },
  { id:'c-gomind', title:'GoMind', logo:LOGO+'gomind.png', proj:'gomind', dark:true },
  { id:'c-wisely', title:'Wisely', logo:LOGO+'wisely.png', dark:true },
  { id:'c-artcurial', title:'Artcurial', logo:LOGO+'artcurial.png', dark:true },
  { id:'c-al', title:'Action Logement', logo:LOGO+'actionlogement.png', dark:true },
  { id:'c-delico', title:'Délicorner', logo:LOGO+'delicorner.png', proj:'delicorner', dark:true },
  { id:'c-spartes', title:'Spartes', logo:LOGO+'spartes.png', dark:true }
];
const pIndex = id => PROJECTS.findIndex(p => p.id === id);
(function applyUI() {
  $$('[data-t]').forEach(e => { const v = T[e.dataset.t]; if (v != null) e.textContent = fmt(v, { n: N }); });
  $$('[data-t-attr]').forEach(e => e.dataset.tAttr.split(';').forEach(pair => { const [a, k] = pair.split(':'); if (T[k] != null) e.setAttribute(a, fmt(T[k], { n: N })); }));
  const h = $('#h1'); if (!h) return;
  let d = 80; const W = w => { const r = `<span class="w" style="--d:${d}">${esc(w)}</span>`; d += 50; return r; };
  const words = str => String(str).split(/\s+/).filter(Boolean).map(W).join(' ');
  h.innerHTML = `<span class="nm">${words(C.hero.nom)}</span><span class="ac"><span class="l1">${words(C.hero.accroche1)}</span><br> ${words(C.hero.accroche2)}</span>`;
})();

/* ═════════════════ Rendu des sections ═════════════════ */
/* mix : accroche en deux tons, comme le titre du hero. Première proposition (jusqu'aux deux-points, sinon jusqu'au
   premier point intérieur, sinon jusqu'à la première virgule) en blanc chaud, la suite en gris secondaire. */
function leadHTML(t) {
  let k = t.indexOf(':');
  if (k < 0) { const d = t.indexOf('. '); k = d > -1 ? d : t.indexOf(','); }
  if (k < 0 || k >= t.length - 2) return `<span class="l1">${esc(t)}</span>`;
  return `<span class="l1">${esc(t.slice(0, k + 1))}</span> <span class="l2">${esc(t.slice(k + 1).trim())}</span>`;
}
const resList = $('[data-reslist]');
PROJECTS.forEach((p, i) => {
  const m = p.main, f = p.float;
  const main = `<div class="main ${m.cls || ''}"><img data-src="${m.src}" alt="${esc(m.alt)}" data-par${m.pos ? ` style="object-position:${m.pos}"` : ''}></div>`;
  let fl = '';
  if (f && f.video) fl = `<figure class="float" style="${f.style}" data-float><video muted loop playsinline preload="none" poster="${f.poster}" data-src="${f.video}" aria-label="${esc(f.alt)}"></video><figcaption>${esc(f.cap)}</figcaption></figure>`;
  else if (f) fl = `<figure class="float" style="${f.style}" data-float><img data-src="${f.src}" alt="${esc(f.alt)}"><figcaption>${esc(f.cap)}</figcaption></figure>`;
  const acts = [`<a class="btn pri" href="${p.case}">${esc(C.etude.lire)}${I.arrow}</a>`];
  if (p.immersive) acts.push(`<a class="btn" href="${p.immersive}">${esc(C.etude.immersif)}${I.out}</a>`);
  acts.push(`<button class="btn" type="button" data-insp="${i}"><svg class="ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M10 2.5v11"/></svg>${esc(C.etude.details)}</button>`);
  const el = document.createElement('article');
  el.className = 'res rv'; el.id = 'p-' + p.id; el.style.setProperty('--d', i * 70);
  el.innerHTML = `
    <h3 class="sr-only">${esc(p.title)}</h3>
    <button class="res-h" type="button" aria-expanded="false" aria-controls="d-${p.id}">
      <span class="res-n tnum" aria-hidden="true">${pad2(i)}</span>
      <span class="res-th${p.logo ? ' logo' : ''}" aria-hidden="true"><img src="${p.thumb}" alt="" loading="lazy" decoding="async"></span>
      <span class="res-tt"><span class="res-title" aria-hidden="true">${esc(p.title)}</span><span class="res-sub"><span class="sr-only">${esc(p.title)}, </span><span class="res-sec">${esc(p.sector)}</span><span class="res-dot" aria-hidden="true"> · </span><span class="res-desc">${esc(p.sub)}</span></span></span>
      <span class="res-tags" aria-hidden="true">${p.tags.map(t => `<span class="tagc">${esc(t)}</span>`).join('')}</span>
      <span class="res-go" aria-hidden="true">${I.plus}</span>
    </button>
    <div class="res-d" id="d-${p.id}" role="region" aria-label="${esc(fmt(C.etude.detail_region, { t: p.title }))}"><div>
      <div class="res-body">
        <div class="pcard" style="--tint-h:${p.hue}">
          <div class="ptop"><span class="tnum">${pad2(i)}</span><span>${esc(p.sector)}</span><span class="tagc">${esc(p.chip)}</span></div>
          <p class="lead">${leadHTML(p.lead)}</p>
          <p class="pdesc">${esc(p.desc)}</p>
          <dl class="facts">${p.facts.map(x => `<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join('')}</dl>
          <div class="vis">${main}${fl}</div>
          <div class="acts">${acts.join('')}</div>
        </div>
      </div>
    </div></div>`;
  resList.appendChild(el);
});

/* mix : les sections Compétences, Clients et Changelog de F ne sont pas reprises (rendu supprimé).
   Les cartes d'expertise de V reçoivent un id et le raccourci clavier de leur compétence. */
const xpCards = $$('.expertise-grid > .expertise-card');
SKILLS.forEach(s => { const c = xpCards[s.card]; if (c) { c.id = 'xp-' + s.id; c.setAttribute('aria-keyshortcuts', 'Alt+' + s.key); } });

/* calques : les sections réelles du mix */
const SECS = [['accueil',I.home],['marques',I.client],['ai-ready',I.agent],['projets',I.proj],['expertise',I.skill],['contact',I.mail]].map(([id, ic]) => [id, C.sections[id].rail, ic]);
$('[data-rail]').innerHTML = SECS.map(([id, t, ic]) => `<li><a href="#${id}" data-sec="${id}">${ic.replace('class="ic"', 'class="ic" aria-hidden="true"')}<span class="l">${t}</span></a>${id === 'accueil' ? `<ul class="rail-sub">${PROJECTS.map((p, i) => `<li><button type="button" data-rp="${i}" aria-label="${esc(fmt(C.rail_projet, { num: pad2(i), t: p.title }))}"><i aria-hidden="true"></i><span class="l">${pad2(i)} ${esc(p.title)}</span></button></li>`).join('')}</ul>` : ''}</li>`).join('');

/* ═════════════════ Utilitaires ═════════════════ */
const toastsEl = $('.toasts');
function toast(msg, hint) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `${I.check}<span>${esc(msg)}</span>${hint ? `<span class="t-k">${esc(hint)}</span>` : ''}`;
  toastsEl.appendChild(t);
  while (toastsEl.children.length > 3) toastsEl.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, 2600);
}

/* Lenis piloté par le ticker GSAP (un seul smooth scroll) */
let lenis = null;
if (!RM && window.Lenis) {
  try {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: .95, smoothWheel: true });
    if (HAS_GSAP) { gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  } catch (e) { lenis = null; }
}
/* mix : Lenis (F) et ScrollTrigger (V) partagent le même défilement */
if (lenis) lenis.on('scroll', () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
let stT = 0;
function refreshST() { clearTimeout(stT); stT = setTimeout(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 60); }
/* mix : carte de rendez-vous de V (js/accueil-sections.js expose window.FMV.openRdv) ; repli : Calendly dans un nouvel onglet */
function openRdv() { if (window.FMV && window.FMV.openRdv && window.FMV.openRdv()) return; window.open(CAL, '_blank', 'noopener'); }
window.FM = { get lenis() { return lenis; }, refreshST, scrollToEl: (el, off) => scrollToEl(el, off) };
/* mix : position de mise en page (offsetTop cumulés) et non getBoundingClientRect, pour ignorer les translations
   d'apparition encore en cours (cartes d'expertise de V décalées de 60 px avant leur révélation) */
function layoutTop(el) { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; }
/* mix : décalage = bas de la pilule de navigation de V (#header .nav-inner) + 16 px, pour que l'ancre arrive sous la barre */
/* --hdr-b = bas de la pilule de navigation quand la barre n'est pas réduite (padding haut de l'en-tête au repos + hauteur de
   la pilule) : le hero, son statut et le rail se placent dessous (accueil.css). Mesuré avant la galerie et à chaque resize. */
function setHdrVar() {
  const h = $('#header'), n = h && $('.nav-inner', h); if (!n) return;
  const padRest = h.classList.contains('scrolled') ? (matchMedia('(max-width: 640px)').matches ? 13.6 : 22.4) : parseFloat(getComputedStyle(h).paddingTop);
  root.style.setProperty('--hdr-b', Math.ceil(padRest + n.offsetHeight) + 'px');
}
setHdrVar(); addEventListener('resize', setHdrVar);
if (document.fonts) document.fonts.ready.then(setHdrVar);
function hdrOff(extra = 16) { const n = $('#header .nav-inner'); return n ? -(Math.round(n.getBoundingClientRect().bottom) + extra) : -76; }
function scrollToEl(el, off = hdrOff()) {
  if (!el) return;
  const y = Math.max(0, layoutTop(el) + off);
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
}
function scrollToTop() { lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); }
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href').slice(1);
  e.preventDefault();
  if (id === 'main' || id === 'accueil') { scrollToTop(); return; }
  goSection(id);
}));
/* arrivée avec une ancre (liens des pages projet : index.html#projets, #about, #contact, #top, #accueil) : la liste de
   projets et les polices changent la mise en page après le saut natif du navigateur ; on recale sous la barre au chargement */
addEventListener('load', () => {
  const id = decodeURIComponent(location.hash.slice(1)); const t = id && document.getElementById(id);
  if (!t || id === 'top' || id === 'accueil' || id === 'main') return;
  const y = Math.max(0, layoutTop(t) + hdrOff());
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
  refreshST();
});
/* mix : toute section atteinte (rail, palette, lien d'évitement) reçoit aussi le focus, comme #projets dans F */
function goSection(id) {
  if (id === 'main' || id === 'accueil' || id === 'top') { scrollToTop(); setTimeout(() => $('#main').focus({ preventScroll: true }), 50); return; }
  const t = document.getElementById(id); if (!t) return;
  scrollToEl(t);
  if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
  setTimeout(() => t.focus({ preventScroll: true }), 50);
}

function copyLinkedIn() {
  const done = () => toast(C.toasts.lien_copie, C.toasts.presse);
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = LI; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast(C.toasts.copie_ko + LI); } ta.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(LI).then(done, fallback); else fallback();
}
/* mix : thème sombre uniquement (bouton, commande « Thème clair » et branche claire de la galerie retirés) */

/* ═════════════════ Projets : accordéon + FLIP + parallax (carte cinéma) ═════════════════ */
const resHl = $('.res-hl');
function placeResHl(h) {
  if (!FINE) return;
  resHl.style.transform = `translateY(${h.offsetTop + h.parentElement.offsetTop}px)`;
  resHl.style.height = h.offsetHeight + 'px';
  resHl.style.opacity = 1;
}
function hydrate(row) { $$('[data-src]', row).forEach(m => { m.src = m.dataset.src; m.removeAttribute('data-src'); }); }
const openRows = new Set();
function setRow(row, open, opts = {}) {
  const btn = $('.res-h', row), d = $('.res-d', row);
  if (open === row.classList.contains('open')) { if (open && opts.scroll) scrollToEl(row); return; }
  if (open) {
    $$('.res.open', resList).forEach(r => r !== row && setRow(r, false));
    hydrate(row);
    const th = $('.res-th img', row);
    const first = th.getBoundingClientRect();
    row.classList.add('open'); openRows.add(row);
    d.inert = false;
    btn.setAttribute('aria-expanded', 'true');
    const target = $('.main img[data-par]', row);
    if (!RM && target && first.width && !$('.res-th', row).classList.contains('logo') && innerWidth > 900 && !opts.scroll) {
      const last = target.getBoundingClientRect();
      const g = document.createElement('img');
      g.className = 'flip-ghost'; g.src = th.currentSrc || th.src; g.alt = '';
      Object.assign(g.style, { left: last.left + 'px', top: last.top + 'px', width: last.width + 'px', height: last.height + 'px' });
      document.body.appendChild(g);
      target.style.opacity = 0;
      const sx = first.width / last.width, sy = first.height / last.height;
      g.animate([{ transform: `translate(${first.left - last.left}px,${first.top - last.top}px) scale(${sx},${sy})` }, { transform: 'none' }], { duration: 720, easing: 'cubic-bezier(.16,1,.3,1)' })
        .finished.then(() => { target.style.opacity = ''; g.remove(); }, () => { target.style.opacity = ''; g.remove(); });
    }
    if (opts.scroll) setTimeout(() => scrollToEl(row), 40);
    parallax();
  } else {
    row.classList.remove('open'); openRows.delete(row);
    btn.setAttribute('aria-expanded', 'false');
    d.inert = true;
    const v = $('video', row); if (v) v.pause();
  }
  setTimeout(() => { const hv = $('.res-h:hover', resList); if (hv) placeResHl(hv); }, 780);
  /* mix : la hauteur de #projets a changé (dépliage .75 s) → les déclencheurs ScrollTrigger des sections V se recalent */
  setTimeout(refreshST, 820);
}
$$('.res', resList).forEach(row => {
  const btn = $('.res-h', row);
  $('.res-d', row).inert = true;
  btn.addEventListener('click', () => setRow(row, !row.classList.contains('open')));
  btn.addEventListener('pointerenter', () => placeResHl(btn));
});
resList.addEventListener('pointerleave', () => resHl.style.opacity = 0);
resList.addEventListener('click', e => { const b = e.target.closest('[data-insp]'); if (b) openInsp(+b.dataset.insp, b); });
function openProject(id, newTab) {
  const p = PROJECTS.find(x => x.id === id);
  if (newTab) { window.open(p.case, '_blank', 'noopener'); return; }
  const row = document.getElementById('p-' + id);
  row.classList.add('in');
  setRow(row, true, { scroll: true });
  row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
  setTimeout(() => $('.res-h', row).focus({ preventScroll: true }), lenis ? 900 : 80);
}
/* parallax : grande image + petit média flottant (index-cinema) */
let parRaf = 0;
function parallax() {
  parRaf = 0;
  const vh = innerHeight;
  openRows.forEach(row => {
    const vis = $('.vis', row); if (!vis) return;
    const r = vis.getBoundingClientRect();
    const v = $('video', row);
    const inView = r.bottom > 0 && r.top < vh;
    if (v) { if (inView && !RM) { const pr = v.play(); if (pr) pr.catch(() => {}); } else v.pause(); }
    if (RM || !inView) return;
    const k = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
    const mi = $('[data-par]', row), fl = $('[data-float]', row);
    if (mi) mi.style.setProperty('--py', (k * r.height * 0.07).toFixed(1) + 'px');
    if (fl) fl.style.setProperty('--fy', (k * 90).toFixed(1) + 'px');
  });
}
addEventListener('scroll', () => { if (!parRaf && openRows.size) parRaf = requestAnimationFrame(parallax); }, { passive: true });

/* ═════════════════ Compétences ═════════════════ */
/* mix : une compétence fait défiler vers sa carte d'expertise de V, la met en évidence et y place le focus */
function runSkill(id, fromKey) {
  const b = document.getElementById('xp-' + id);
  const s = SKILLS.find(x => x.id === id);
  if (!b || !s) return;
  const go = () => {
    b.classList.remove('fm-flash'); void b.offsetWidth; b.classList.add('fm-flash');
    clearTimeout(b._fl); b._fl = setTimeout(() => b.classList.remove('fm-flash'), 1800);
    if (!b.hasAttribute('tabindex')) b.setAttribute('tabindex', '-1');
    b.focus({ preventScroll: true });
    if (fromKey) toast(s.title, `${ALT} ${s.key}`);
  };
  const r = b.getBoundingClientRect();
  if (r.top < 60 || r.bottom > innerHeight) { scrollToEl(b, hdrOff(50)); setTimeout(go, lenis ? 900 : 80); } else go();
}
/* mix : un client sans étude de cas fait défiler vers le bandeau de marques et fait briller son logo (copies du défilement comprises) */
function pingClient(id) {
  const c = CLIENTS.find(x => x.id === id);
  scrollToEl($('#marques'));
  setTimeout(() => {
    const logos = $$('.cl3-track img').filter(im => im.getAttribute('src') === c.logo);
    logos.forEach(im => im.classList.add('fm-ping'));
    setTimeout(() => logos.forEach(im => im.classList.remove('fm-ping')), 1800);
    toast(c.title, C.toasts.marques);
  }, lenis ? 900 : 100);
}

/* ═════════════════ Moteur de recherche (commande) ═════════════════ */
const G = C.palette.groupes;
const P = C.palette;
const ITEMS = [];
ITEMS.push(
  { id:'a-cal', g:'act', title:P.rdv.title, sub:P.rdv.sub, ic:I.cal, kw:P.rdv.kw, hint:'↵',
    pv:() => pvGlyph(I.cal, P.rdv.title, P.rdv.desc, P.rdv.rows, P.rdv.act),
    run:(nt) => nt ? window.open(CAL, '_blank', 'noopener') : openRdv() },
  { id:'a-copy', g:'act', title:P.copie.title, sub:P.copie.sub, ic:I.copy, kw:P.copie.kw,
    pv:() => pvGlyph(I.copy, P.copie.title, P.copie.desc, P.copie.rows), run:copyLinkedIn },
  { id:'a-li', g:'act', title:P.linkedin.title, sub:P.linkedin.sub, ic:I.out, kw:P.linkedin.kw, hint:'↗',
    pv:() => pvGlyph(I.out, P.linkedin.title, P.linkedin.desc, P.linkedin.rows), run:() => window.open(LI, '_blank', 'noopener') },
  { id:'a-imm', g:'act', title:P.immersif.title, sub:P.immersif.sub, ic:I.cube, kw:P.immersif.kw, hint:'↵',
    pv:() => pvMedia('delico%20projet/delicorner-scene-poster.jpg', P.immersif.pvTitle, P.immersif.desc, P.immersif.rows, P.immersif.act),
    run:() => { location.href = IMM; } }
);
PROJECTS.forEach((p, i) => ITEMS.push({ id:'p-' + p.id, g:'proj', title:p.title, sub:p.sector + ' · ' + p.sub, thumb:p.thumb, logo:p.logo, kw:C.recherche.kw_projet + ' ' + p.kw + ' ' + p.tags.join(' '), hint:'↵',
  pv:() => pvProject(p), run:(nt) => openProject(p.id, nt) }));
SKILLS.forEach(s => ITEMS.push({ id:'s-' + s.id, g:'skill', title:s.title, sub:s.out.join(' · '), ic:s.ic, kw:C.recherche.kw_competence + ' ' + s.kw, keys:[ALT, s.key],
  pv:() => pvGlyph(s.ic, s.title, s.sub + '.', s.out.map((o, i) => [i === 0 ? P.competence.inclut : '', o]), fmt(P.competence.raccourci, { k: ALT + ' ' + s.key })), run:() => runSkill(s.id) }));
ITEMS.push({ id:'s-a11y', g:'skill', title:P.a11y.title, sub:P.a11y.sub, ic:I.a11y, kw:P.a11y.kw,
  pv:() => pvGlyph(I.a11y, P.a11y.title, P.a11y.desc, P.a11y.rows, P.a11y.act), run:() => openProject('gouv') });
CLIENTS.forEach(c => ITEMS.push({ id:'cl-' + c.id, g:'client', title:c.title, sub:c.proj ? P.client.avec_etude : P.client.sans_etude, thumb:c.logo, dark:c.dark, logoTile:!c.dark, kw:C.recherche.kw_client + ' ' + norm(c.title),
  pv:() => pvClient(c), run:(nt) => c.proj ? openProject(c.proj, nt) : pingClient(c.id) }));
/* « Aller à » : les sections de la page */
['accueil', 'marques', 'ai-ready', 'projets', 'expertise', 'contact'].forEach(id => {
  const t = C.sections[id].titre, sb = C.sections[id].sous;
  ITEMS.push({ id:'n-' + id, g:'nav', title:t, sub:sb, ic:I.nav, kw:C.recherche.kw_nav + ' ' + norm(t) + ' ' + norm(sb),
    pv:() => pvGlyph(I.nav, t, sb + '.', [[P.nav.section, '#' + id]], P.nav.act), run:() => goSection(id) });
});

const STOP = new Set(C.recherche.stop.split(' '));
ITEMS.forEach(it => { it._t = norm(it.title); it._h = norm(it.title + ' ' + it.sub + ' ' + (it.kw || '') + ' ' + G[it.g]); it._w = it._h.split(/[^a-z0-9]+/); it._tw = it._t.split(/[^a-z0-9]+/); });
function fuzzy(t, s) {
  let j = 0, last = -2, score = 0; const idx = [];
  for (let i = 0; i < s.length && j < t.length; i++) {
    if (s[i] === t[j]) { score += (i === last + 1 ? 2 : 1) + (i === 0 || /[^a-z0-9]/.test(s[i - 1]) ? 2 : 0); idx.push(i); last = i; j++; }
  }
  return j === t.length ? { score: score / (t.length * 2.4), idx } : null;
}
function tokens(q) { return norm(q).split(/[^a-z0-9%+]+/).filter(t => t && !STOP.has(t)); }
function search(q) {
  const tk = tokens(q);
  if (!tk.length) return ITEMS.map(it => ({ it, s: 0, idx: [] }));
  const out = [];
  for (const it of ITEMS) {
    let total = 0, miss = 0; const idx = new Set();
    for (const t of tk) {
      let s = 0;
      const ti = it._t.indexOf(t);
      if (it._t.startsWith(t)) s = 10;
      else if (it._tw.some(w => w.startsWith(t))) s = 8;
      else if (it._w.some(w => w.startsWith(t))) s = 5;
      else if (t.length > 3 && it._h.includes(t)) s = 3.5;
      else if (t.length > 4 && it._w.some(w => w.startsWith(t.slice(0, Math.max(4, t.length - 2))))) s = 3;
      if (ti > -1) for (let k = 0; k < t.length; k++) idx.add(ti + k);
      if (!s && t.length >= 2) { const f = fuzzy(t, it._t); if (f && f.score > .55) { s = 2 * f.score; f.idx.forEach(k => idx.add(k)); } }
      if (s) total += s; else miss++;
    }
    if (miss === tk.length) continue;
    if (tk.length > 1 && miss > tk.length / 2) continue;
    out.push({ it, s: total - miss * 4 + (it.g === 'proj' ? .4 : 0) + (it.g === 'act' ? .2 : 0), idx: [...idx] });
  }
  return out.sort((a, b) => b.s - a.s);
}
/* correspondance projet pour le dock : secteur / tags pèsent plus que les mots-clés */
PROJECTS.forEach(p => {
  p._t = norm(p.title).split(/[^a-z0-9]+/);
  p._s = norm(p.sector + ' ' + p.tags.join(' ') + ' ' + p.chip).split(/[^a-z0-9]+/);
  p._w = norm(p.sub + ' ' + p.kw + ' ' + p.desc + ' ' + p.facts.map(f => f[1]).join(' ')).split(/[^a-z0-9]+/);
});
function projMatch(q) {
  const tk = tokens(q).filter(t => t.length > 1 || /^[0-9]$/.test(t));
  if (!tk.length) return [];
  return PROJECTS.map((p, i) => {
    let s = 0, hit = 0;
    tk.forEach(t => {
      let v = 0;
      if (p._t.some(w => w.startsWith(t))) v = 9;
      else if (p._s.some(w => w === t)) v = 6;
      else if (p._s.some(w => w.startsWith(t))) v = 4.5;
      else if (p._w.some(w => w === t)) v = 3;
      else if (t.length > 2 && p._w.some(w => w.startsWith(t))) v = 2;
      else if (t.length > 4 && p._w.some(w => w.startsWith(t.slice(0, t.length - 2)))) v = 1;
      if (v) { s += v; hit++; }
    });
    return { i, s: s + p._w.filter(w => tk.includes(w)).length * .25, hit };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i);
}

function hlTitle(title, idx) {
  if (!idx || !idx.length) return esc(title);
  const set = new Set(idx); let h = '', open = false;
  [...title].forEach((c, i) => {
    const on = set.has(i);
    if (on && !open) { h += '<mark>'; open = true; }
    if (!on && open) { h += '</mark>'; open = false; }
    h += esc(c);
  });
  return h + (open ? '</mark>' : '');
}
const icFor = it => it.dark ? `<span class="opt-ic dark"><img src="${it.thumb}" alt="" loading="lazy"></span>` : it.thumb ? `<span class="opt-ic" style="${it.logoTile || it.logo ? 'background:var(--tile)' : ''}"><img src="${it.thumb}" alt="" style="${it.logoTile || it.logo ? 'object-fit:contain;padding:3px;mix-blend-mode:multiply' : ''}" loading="lazy"></span>` : `<span class="opt-ic">${it.ic || I.bolt}</span>`;
const dlr = rows => rows.length ? `<dl>${rows.map(r => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>` : '';
function pvProject(p) {
  const m = p.logo ? `<div class="pv-m tile"><img src="${p.thumb}" alt=""></div>` : `<div class="pv-m"><img src="${p.thumb}" alt=""></div>`;
  return `${m}<h4>${esc(p.title)}</h4><p>${esc(p.desc)}</p>${dlr(p.facts)}<div class="pv-act"><span><kbd>↵</kbd> ${esc(P.projet.deplier)}</span><span><kbd>${MOD}</kbd><kbd>↵</kbd> ${esc(P.projet.ouvrir)}</span></div>`;
}
function pvGlyph(ic, t, d, rows, act) { return `<div class="pv-m glyph">${ic}</div><h4>${esc(t)}</h4><p>${esc(d)}</p>${dlr(rows)}<div class="pv-act"><span><kbd>↵</kbd> ${esc(act || P.executer)}</span></div>`; }
function pvMedia(src, t, d, rows, act) { return `<div class="pv-m"><img src="${src}" alt=""></div><h4>${esc(t)}</h4><p>${esc(d)}</p>${dlr(rows)}<div class="pv-act"><span><kbd>↵</kbd> ${esc(act || P.voir_lie)}</span></div>`; }
function pvClient(c) {
  const p = c.proj && PROJECTS.find(x => x.id === c.proj);
  return `<div class="pv-m ${c.dark ? 'dark' : 'tile'}"><img src="${c.logo}" alt="" ${c.dark ? 'style="width:auto;height:auto;max-width:58%;max-height:42%;object-fit:contain;mix-blend-mode:normal"' : ''}></div><h4>${esc(c.title)}</h4><p>${p ? esc(p.sector + P.client.sep + p.sub + '.') : esc(P.client.confiance)}</p><div class="pv-act"><span><kbd>↵</kbd> ${esc(p ? P.client.voir_etude : P.client.voir_page)}</span></div>`;
}

/* ═════════════════ Palette ⌘K (commande) ═════════════════ */
const dlg = $('#cmdk'), input = $('#cmdk-input'), list = $('#cmdk-list'), scroller = $('.cmdk-s'), hl = $('.cmdk-hl'), pvBox = $('.cmdk-pv'), cntOut = $('[data-count-out]'), srStatus = $('#sr-status');
let results = [], active = -1, lastFocus = null, pvId = null, closing = false;
const ORDER = ['act', 'proj', 'skill', 'nav', 'client'];
function render(q) {
  const r = search(q);
  const grouped = {};
  r.forEach(x => (grouped[x.it.g] = grouped[x.it.g] || []).push(x));
  const groups = q.trim() ? [...new Set(r.map(x => x.it.g))] : ORDER;
  results = [];
  let html = '', n = 0;
  groups.forEach(g => {
    const arr = grouped[g]; if (!arr) return;
    html += `<div role="group" aria-labelledby="grp-${g}"><div class="cmdk-g" id="grp-${g}" role="presentation"><span>${G[g]}</span><span class="tnum">${arr.length}</span></div>`;
    arr.forEach(x => {
      const it = x.it, i = results.length;
      results.push(it);
      const keys = it.keys && FINE ? it.keys.map(k => `<kbd>${k}</kbd>`).join('') : (it.hint ? `<kbd>${it.hint}</kbd>` : '');
      html += `<div class="opt anim" role="option" id="opt-${it.id}" aria-selected="false" data-i="${i}" style="--i:${n++}">${icFor(it)}<span class="opt-t"><b>${hlTitle(it.title, x.idx)}</b><small>${esc(it.sub)}</small></span><span class="opt-k" aria-hidden="true">${keys}</span></div>`;
    });
    html += '</div>';
  });
  if (!results.length) html = `<div class="empty"><span>${esc(P.aucun)} <b>${esc(fmt(P.cite, { q }))}</b></span><button class="btn" type="button" data-empty-cal>${I.cal.replace('class="ic"', 'class="ic" aria-hidden="true"')}${esc(P.parler)}</button></div>`;
  list.innerHTML = html;
  const e = $('[data-empty-cal]', list); if (e) e.addEventListener('click', () => { close(true).then(openRdv); });
  cntOut.textContent = plural(P.compte, results.length);
  clearTimeout(render._t);
  render._t = setTimeout(() => srStatus.textContent = results.length ? fmt(P.sr_premier, { n: results.length, t: results[0].title }) : P.sr_aucun, 350);
  scroller.scrollTop = 0;
  hl.classList.add('no-t');
  setActive(results.length ? 0 : -1, false);
  requestAnimationFrame(() => hl.classList.remove('no-t'));
}
function setActive(i, scroll = true) {
  const prev = list.querySelector('[aria-selected="true"]');
  if (prev) prev.setAttribute('aria-selected', 'false');
  active = i;
  if (i < 0) { input.setAttribute('aria-activedescendant', ''); hl.style.opacity = 0; pvBox.innerHTML = ''; pvId = null; return; }
  const el = list.querySelector(`[data-i="${i}"]`);
  el.setAttribute('aria-selected', 'true');
  input.setAttribute('aria-activedescendant', el.id);
  hl.style.opacity = 1;
  hl.style.transform = `translateY(${el.offsetTop}px)`;
  hl.style.height = el.offsetHeight + 'px';
  if (scroll) {
    const top = el.offsetTop, bot = top + el.offsetHeight;
    if (top < scroller.scrollTop + 30) scroller.scrollTop = Math.max(0, top - 36);
    else if (bot > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = bot - scroller.clientHeight + 8;
  }
  const it = results[i];
  if (pvId !== it.id && getComputedStyle(pvBox).display !== 'none') {
    pvId = it.id;
    const d = document.createElement('div'); d.className = 'pv'; d.innerHTML = it.pv();
    pvBox.replaceChildren(d);
  }
}
function exec(i, newTab) { const it = results[i]; if (!it) return; close(true).then(() => it.run(newTab)); }
function open(q = '') {
  if (dlg.open) { input.value = q || input.value; render(input.value); input.select(); return; }
  lastFocus = document.activeElement;
  closing = false;
  dlg.classList.remove('closing');
  dlg.showModal();
  if (lenis) lenis.stop();
  input.value = q;
  render(q);
  input.focus();
  if (q && FINE) input.select();
  requestAnimationFrame(() => dlg.classList.add('open'));
}
function close(skipRestore) {
  return new Promise(res => {
    if (!dlg.open || closing) return res();
    closing = true;
    dlg.classList.remove('open'); dlg.classList.add('closing');
    setTimeout(() => {
      dlg.close(); dlg.classList.remove('closing'); closing = false;
      if (lenis && !inspMobileOpen()) lenis.start();
      if (!skipRestore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      res();
    }, RM ? 0 : 170);
  });
}
input.addEventListener('input', () => render(input.value));
input.addEventListener('keydown', e => {
  const n = results.length;
  if (e.key === 'ArrowDown') { e.preventDefault(); if (n) setActive((active + 1) % n); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) setActive((active - 1 + n) % n); }
  else if (e.key === 'Enter') { e.preventDefault(); if (active > -1) exec(active, e.metaKey || e.ctrlKey); }
});
dlg.addEventListener('cancel', e => { e.preventDefault(); if (input.value) { input.value = ''; render(''); } else close(); });
dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
$('[data-close]', dlg).addEventListener('click', () => close());
list.addEventListener('pointermove', e => { const o = e.target.closest('.opt'); if (o && +o.dataset.i !== active) setActive(+o.dataset.i, false); });
list.addEventListener('click', e => { const o = e.target.closest('.opt'); if (o) exec(+o.dataset.i, e.metaKey || e.ctrlKey); });
list.addEventListener('mousedown', e => { if (e.target.closest('.opt')) e.preventDefault(); });
dlg.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = $$('input, button, a[href]', dlg).filter(x => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  e.preventDefault();
  f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
});
$$('[data-open]').forEach(b => b.addEventListener('click', () => open(b.closest('.dock') ? dockQ.value : '')));

/* ═════════════════ Inspecteur (canvas) ═════════════════ */
const insp = $('#insp'), inspC = $('[data-insp-c]'), inspK = $('[data-insp-k]'), scrim = $('[data-scrim]');
const MQ_SHEET = matchMedia('(max-width: 760px)');
let inspI = -1, inspReturn = null;
const inspMobileOpen = () => inspI > -1 && MQ_SHEET.matches;
function inspHTML(i) {
  const p = PROJECTS[i];
  const media = p.logo ? `<div class="i-m tile"><img src="${p.thumb}" alt=""></div>` : `<div class="i-m"><img src="${p.thumb}" alt=""></div>`;
  const modes = [`<a class="mode pri" href="${p.case}"><span class="m-ic" aria-hidden="true">${I.doc}</span><b>${esc(C.insp.etude)}</b><span class="m-go" aria-hidden="true">${I.arrow}</span><small>${esc(C.insp.etude_txt)}</small></a>`];
  if (p.immersive) modes.push(`<a class="mode" href="${p.immersive}"><span class="m-ic" aria-hidden="true">${I.cube}</span><b>${esc(C.insp.immersif)}<span class="badge">3D</span></b><span class="m-go" aria-hidden="true">${I.out}</span><small>${esc(C.insp.immersif_txt)}</small></a>`);
  modes.push(`<button class="mode" type="button" data-peek="${p.id}"><span class="m-ic" aria-hidden="true">${I.panel}</span><b>${esc(C.insp.apercu)}</b><span class="m-go" aria-hidden="true">${I.nav}</span><small>${esc(C.insp.apercu_txt)}</small></button>`);
  const note = p.immersive ? '' : `<p class="i-note">${esc(C.insp.note)} <button type="button" data-goinsp="0">${esc(C.insp.note_btn)}</button></p>`;
  return `<div class="isec i-top">${media}<div><p class="i-k">${esc(fmt(C.insp.cle, { num: pad2(i), s: p.sector }))}</p><h2 id="insp-t">${esc(p.title)}</h2></div><p class="i-lead">${esc(p.desc)}</p></div>
    <div class="isec"><p class="i-h"><span>${esc(C.insp.parcourir)}</span><span>${esc(C.insp.modes[p.immersive ? 1 : 0])}</span></p><div class="modes">${modes.join('')}</div>${note}</div>
    <div class="isec"><p class="i-h"><span>${esc(C.insp.fiche)}</span></p>${dlr(p.facts)}</div>`;
}
function openInsp(i, from) {
  i = (i + N) % N;
  const was = inspI;
  inspI = i;
  if (from) inspReturn = from;
  else if (was < 0) inspReturn = document.activeElement;
  inspC.innerHTML = inspHTML(i);
  inspC.scrollTop = 0;
  inspK.textContent = fmt(C.insp.entete, { num: pad2(i) });
  insp.classList.add('on');
  insp.inert = false;
  if (MQ_SHEET.matches) { scrim.classList.add('on'); if (lenis) lenis.stop(); }
  railProject(i);
  gal.onInsp(true, i);
  if (was < 0) setTimeout(() => $('[data-insp-x]').focus({ preventScroll: true }), RM ? 0 : 80);
}
function closeInsp() {
  if (inspI < 0) return;
  inspI = -1;
  insp.classList.remove('on');
  insp.inert = true;
  scrim.classList.remove('on');
  if (lenis && !dlg.open) lenis.start();
  gal.onInsp(false);
  if (inspReturn && inspReturn.focus && document.contains(inspReturn)) inspReturn.focus({ preventScroll: true });
}
insp.inert = true;
$('[data-insp-x]').addEventListener('click', closeInsp);
scrim.addEventListener('click', closeInsp);
$('[data-insp-prev]').addEventListener('click', () => { openInsp(inspI - 1); gal.follow(inspI); });
$('[data-insp-next]').addEventListener('click', () => { openInsp(inspI + 1); gal.follow(inspI); });
inspC.addEventListener('click', e => {
  const pk = e.target.closest('[data-peek]');
  if (pk) { const id = pk.dataset.peek; closeInsp(); openProject(id); return; }
  const gi = e.target.closest('[data-goinsp]');
  if (gi) { openInsp(+gi.dataset.goinsp); gal.follow(0); $('[data-insp-x]').focus({ preventScroll: true }); }
});
insp.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closeInsp(); } });
/* glisser vers le bas pour fermer la bottom sheet */
(() => {
  let y0 = null, dy = 0;
  const hd = $('.insp-hd');
  hd.addEventListener('pointerdown', e => { if (!MQ_SHEET.matches || e.target.closest('button')) return; y0 = e.clientY; dy = 0; hd.setPointerCapture(e.pointerId); insp.style.transition = 'none'; });
  hd.addEventListener('pointermove', e => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); insp.style.transform = `translateY(${dy}px)`; });
  const end = () => { if (y0 === null) return; y0 = null; insp.style.transition = ''; insp.style.transform = ''; if (dy > 90) closeInsp(); };
  hd.addEventListener('pointerup', end); hd.addEventListener('pointercancel', end);
})();

/* ═════════════════ Calques : section active + projet actif ═════════════════ */
const railLinks = $$('[data-sec]'), railP = $$('[data-rp]');
function railProject(i) { railP.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false')); }
/* mix : section active = la dernière dont le haut a passé une ligne à 28 % de la hauteur d'écran (la bande d'observation
   de F manquait les sections courtes comme les marques) ; aria-current="location" pour ne pas doubler le projet actif ("true") */
const secEls = SECS.map(([id]) => document.getElementById(id)).filter(Boolean);
let secRaf = 0, secCur = '';
function railSection() {
  secRaf = 0;
  const mid = Math.max(120, innerHeight * .28);
  let cur = secEls[0].id;
  secEls.forEach(s => { if (s.getBoundingClientRect().top <= mid) cur = s.id; });
  if (cur === secCur) return;
  secCur = cur;
  railLinks.forEach(a => { if (a.dataset.sec === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
}
addEventListener('scroll', () => { if (!secRaf) secRaf = requestAnimationFrame(railSection); }, { passive: true });
addEventListener('resize', railSection);
railSection();
railP.forEach(b => b.addEventListener('click', () => { const i = +b.dataset.rp; if (gal.inStage()) gal.go(i); openInsp(i, b); }));

/* ═════════════════ HERO : galerie (WebGL ou statique) ═════════════════ */
const stage = $('#stage'), wrapEl = $('#stageWrap'), canvas = $('#gl');
const titlesEl = $('#titles'), cNow = $('#cNow'), sectorEl = $('#sector'), progEl = $('#prog'), cur = $('#cur');
const ttlEls = [], numEls = [];
PROJECTS.forEach((p, i) => {
  const t = document.createElement('p'); t.className = 'ttl';
  t.innerHTML = [...p.title].map(c => `<span class="ch${c === '.' ? ' dt' : ''}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
  titlesEl.appendChild(t); ttlEls.push(t);
  const n = document.createElement('span'); n.textContent = pad2(i); cNow.appendChild(n); numEls.push(n);
});
function fitTitles() {
  const bot = $('.h-bot'), dock = $('#dock');
  const wide = innerWidth > 860;
  const avail = bot.clientWidth - (wide ? dock.offsetWidth + parseFloat(getComputedStyle(bot).columnGap || 0) : 0);
  /* écran bas (MQ_LOW) : titre de projet plus petit sur bureau, la hauteur gagnée va au visuel */
  const cap = wide ? Math.min(innerWidth * .09, innerHeight * (MQ_LOW.matches ? .1 : .155)) : Math.min(innerWidth * .15, innerHeight * .085);
  let maxFs = 0;
  ttlEls.forEach(t => {
    t.style.setProperty('--fs', cap + 'px');
    const w = t.scrollWidth;
    const f = w > avail ? cap * (avail / w) * .98 : cap;
    t.style.setProperty('--fs', f + 'px');
    maxFs = Math.max(maxFs, f);
  });
  titlesEl.style.setProperty('--tfs', maxFs * .92 + 'px');
  /* mobile : statut placé juste sous le h1 (≤ 860 px : mise en page du mix, voir mobileHero) */
  heroM = wide ? null : mobileHero();
  if (!useGL) applyFlat(heroM || deskHero(stage.clientWidth, stage.clientHeight));
}
/* mix : hero ≤ 640 px (il y avait trop de vide entre le texte et le visuel sur téléphone).
   La scène reste collante et pleine hauteur (la galerie avance au défilement : une scène plus courte laisserait une bande
   vide sous elle pendant tout l'épinglage). On empile : en-tête · titre · statut · VISUEL · compteur + titre · dock.
   Le visuel prend la largeur de la grille ; sa hauteur remplit l'espace libre, bornée à un carré (au-delà, recadrage
   excessif des captures 16:10) ; écarts statut↔visuel et visuel↔compteur = 24 à 40 px ; s'il reste de la hauteur
   (écran très haut), le surplus est réparti à parts égales sur 4 intervalles (en-tête↔titre, titre↔statut,
   titre de projet↔dock, dock↔bas) via --m-x (accueil.css). */
let heroM = null;
const MQ_M = matchMedia('(max-width: 640px)');
const MQ_LOW = matchMedia('(max-height: 520px) and (min-width: 641px)');   /* écran bas : même requête que accueil.css */
function mobileHero() {
  const bot = $('.h-bot'), hid = $('.h-id'), hst = $('.h-st');
  const gridW = bot.clientWidth;
  if (!MQ_M.matches) {
    /* 641 à 860 px (tablette, fenêtre étroite ; même retour : visuel à 70 % de la largeur, 110 px de vide au-dessus et
       150 px en dessous). Le CSS n'est pas réempilé : titre en haut, statut juste dessous, bloc du bas ancré en bas.
       Le visuel prend la largeur de la grille et remplit l'espace libre entre le statut et le bloc du bas, écarts de
       32 px au moins, sans dépasser le format 4:3 (au-delà, recadrage excessif des captures 16:10). Peu de hauteur :
       écarts de 12 px, et le visuel ne s'étire pas au-delà de 2,2:1 (il se resserre et reste centré).
       Écran bas (téléphone en paysage) : le CSS met le statut à droite du titre, le visuel part donc du titre. */
    stage.style.removeProperty('--m-x');
    const low = MQ_LOW.matches, idB = hid.offsetTop + hid.offsetHeight;
    if (!low) stage.style.setProperty('--st-top', (idB + 10) + 'px');
    const top = low ? idB : idB + 10 + hst.offsetHeight, free = bot.offsetTop - top;
    let planeH = Math.min(gridW * .75, free - 64);
    if (planeH < 120) planeH = Math.max(60, Math.min(gridW * .75, free - 24));
    const g = (free - planeH) / 2;
    return { planeTop: top + g, planeH, gridW: Math.min(gridW, planeH * 2.2), gap: g, extra: 0, tab: true };
  }
  const vh = stage.clientHeight, hdr = parseFloat(getComputedStyle(root).getPropertyValue('--hdr-b')) || 76;
  const Hh = hid.offsetHeight, Hs = hst.offsetHeight, Hb = $('.h-ttl').offsetHeight + $('#dock').offsetHeight + 12;
  const TOP = hdr + 12, T2S = 10, BOT = 12;
  const avail = vh - TOP - Hh - T2S - Hs - Hb - BOT;      /* hauteur pour : écart + visuel + écart + surplus */
  let g = 32, planeH = Math.min(gridW, avail - 2 * g);
  if (planeH < gridW * .5) { g = 24; planeH = Math.max(80, avail - 2 * g); }
  else g = clamp((avail - planeH) / 2, 24, 40);
  const x = Math.max(0, (avail - planeH - 2 * g) / 4);
  stage.style.setProperty('--m-x', x.toFixed(2) + 'px');
  const statusTop = TOP + x + Hh + T2S + x;
  stage.style.setProperty('--st-top', statusTop.toFixed(2) + 'px');
  return { planeTop: statusTop + Hs + g, planeH, gridW, gap: g, extra: x };
}
/* bureau (plus de 860 px) : boîte du visuel en px, pour une scène de w × h.
   36 % de la hauteur, format 1:0,62, centré à 50,5 % : inchangé sur un écran large (1,38:1 et plus).
   Deux garde-fous, mesurés sur la page :
   · fenêtre plus étroite ou plus haute (demi-écran, panneau latéral) : la largeur plafonnait à 42 % et le visuel
     rapetissait au milieu d'un grand vide ; elle plafonne à 62 %, et le visuel glisse vers le milieu de l'espace libre
     (progressivement, sans saut au redimensionnement) ;
   · écran bas (portable 1366 × 768 : 650 px utiles ; téléphone en paysage) : le visuel recouvrait la fin de l'accroche ;
     il tient entre le bloc du haut (titre et statut : la carte voisine passe sous le statut) et le bloc du bas,
     à 24 px au moins de chacun (14 px en écran bas). */
function deskHero(w, h) {
  const hid = $('.h-id'), hst = $('.h-st'), M = MQ_LOW.matches ? 14 : 24;
  const botT = $('.h-bot').offsetTop, top = Math.max(hid.offsetTop + hid.offsetHeight, hst.offsetTop + hst.offsetHeight);
  let ph = h * .36, pw = ph / .62;
  if (pw > w * .62) { pw = w * .62; ph = pw * .62; }
  const maxH = Math.max(60, botT - top - 2 * M);
  if (ph > maxH) { ph = maxH; pw = ph / .62; }
  const t = clamp((1.3825 - w / h) / .25, 0, 1);
  const c = (.505 + (clamp((top + botT) / 2 / h, .47, .56) - .505) * t) * h;
  const lo = top + M + ph / 2, hi = botT - M - ph / 2;
  return { planeTop: (lo > hi ? (top + botT) / 2 : clamp(c, lo, hi)) - ph / 2, planeH: ph, gridW: pw };
}
/* repli sans WebGL (ou mouvement réduit) : la carte active a la même boîte que le plan, à toutes les largeurs */
function applyFlat(m) {
  if (!m) { flat.style.top = ''; flatBtns.forEach(b => { b.style.flexBasis = ''; b.style.height = ''; b.style.aspectRatio = ''; }); return; }
  flat.style.top = m.planeTop + 'px';
  flatBtns.forEach(b => { b.style.flexBasis = m.gridW + 'px'; b.style.height = m.planeH + 'px'; b.style.aspectRatio = 'auto'; });
}
let activeP = -1;
function setActiveP(i, instant) {
  if (i === activeP) return;
  const dir = activeP < 0 ? 1 : (i > activeP ? 1 : -1);
  const prev = activeP; activeP = i;
  if (HAS_GSAP && !RM && !instant) {
    if (prev > -1) {
      const oc = ttlEls[prev].querySelectorAll('.ch'), el = ttlEls[prev];
      gsap.killTweensOf(oc);
      if (performance.now() - (el._in || 0) < 650) { gsap.set(oc, { yPercent: 115 }); el.classList.remove('on'); }
      else gsap.to(oc, { yPercent: -115 * dir, duration: .5, ease: 'power3.in', stagger: { each: .018, from: dir > 0 ? 'start' : 'end' }, onComplete: () => { if (ttlEls.indexOf(el) !== activeP) el.classList.remove('on'); } });
      gsap.killTweensOf(numEls[prev]);
      gsap.to(numEls[prev], { yPercent: -110 * dir, duration: .45, ease: 'power3.in' });
    }
    const nc = ttlEls[i].querySelectorAll('.ch');
    ttlEls[i].classList.add('on'); ttlEls[i]._in = performance.now();
    gsap.killTweensOf(nc);
    gsap.fromTo(nc, { yPercent: 115 * dir }, { yPercent: 0, duration: 1, delay: .1, ease: 'expo.out', stagger: { each: .024, from: dir > 0 ? 'start' : 'end' } });
    gsap.killTweensOf(numEls[i]);
    gsap.fromTo(numEls[i], { yPercent: 110 * dir }, { yPercent: 0, duration: .8, delay: .1, ease: 'expo.out' });
  } else {
    ttlEls.forEach((t, k) => { t.classList.toggle('on', k === i); if (HAS_GSAP) gsap.set(t.querySelectorAll('.ch'), { yPercent: 0 }); });
    numEls.forEach((n, k) => { if (HAS_GSAP) { gsap.killTweensOf(n); gsap.set(n, { yPercent: k === i ? 0 : 110 }); } else n.style.transform = k === i ? 'none' : 'translateY(110%)'; });
  }
  sectorEl.textContent = PROJECTS[i].sector;
  $('#detBtn').setAttribute('aria-label', fmt(C.galerie.details_projet, { t: PROJECTS[i].title }));
  if (inspI < 0) railProject(i);
  flatBtns.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
}

/* fallback statique */
const flat = $('#flat');
PROJECTS.forEach((p, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.setAttribute('role', 'listitem');
  if (p.logo) b.className = 'lg';
  b.setAttribute('aria-label', fmt(C.galerie.carte, { num: pad2(i), t: p.title, s: p.sector }));
  b.innerHTML = `<img src="${p.thumb}" alt="" loading="lazy">`;
  b.addEventListener('click', () => { if (activeP === i) openInsp(i, b); else { setActiveP(i); } });
  flat.appendChild(b);
});
const flatBtns = $$('#flat button');

function makeStatic() {
  const api = {
    mode: 'static', ready: true,
    go(i) { i = clamp(i, 0, N - 1); setActiveP(i); const b = flatBtns[i]; flat.scrollTo({ left: b.offsetLeft - (flat.clientWidth - b.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' }); },
    match(i) { flatBtns.forEach((b, k) => b.classList.toggle('match', k === i)); },
    follow(i) { api.go(i); },
    onInsp() {}, inStage: () => scrollY < innerHeight * .8, active: () => activeP, layout: fitTitles, reveal() {}
  };
  return api;
}
const gal = (() => {
  if (!useGL) return makeStatic();
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (err) { root.classList.remove('gl'); root.classList.add('no-gl'); useGL = false; return makeStatic(); }
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  const CAM_Z = 10; camera.position.set(0, 0, CAM_Z);
  const group = new THREE.Group(); scene.add(group);

  const VERT = `
uniform float uVel; uniform float uHover; uniform float uTime; uniform float uReveal; uniform vec2 uMouse;
varying vec2 vUv;
void main(){
  vUv = uv; vec3 p = position;
  float bow = sin(uv.x * 3.14159265);
  p.z += bow * uVel * 1.15;
  p.y += (uv.x - 0.5) * uVel * -0.06;
  float d = distance(uv, uMouse);
  p.z += sin(d * 14.0 - uTime * 3.2) * 0.035 * uHover * (1.0 - smoothstep(0.0, 0.75, d));
  float r = 1.0 - uReveal;
  p.y -= r * (1.25 + uv.x * 0.35);
  p.z += r * sin(uv.y * 3.14159265) * 1.6;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
  const FRAG = `
precision highp float;
uniform sampler2D uTex; uniform vec2 uImg; uniform vec2 uPlane; uniform vec2 uMouse;
uniform float uVel; uniform float uHover; uniform float uTime; uniform float uActive; uniform float uAlpha; uniform float uRadius; uniform float uReveal;
uniform float uMatch; uniform float uScan; uniform vec3 uMonoK; uniform vec3 uMonoB; uniform vec3 uLime;
varying vec2 vUv;
vec2 cover(vec2 uv){ float rp = uPlane.x / uPlane.y; float ri = uImg.x / uImg.y; vec2 s = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0); return (uv - 0.5) * s + 0.5; }
float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 uv = vUv;
  vec2 dv = uv - uMouse; float d = length(dv);
  uv += (dv / (d + 0.0001)) * sin(d * 22.0 - uTime * 4.0) * 0.0045 * uHover * (1.0 - smoothstep(0.0, 0.6, d));
  float z = 1.0 - 0.05 * uHover - 0.04 * (1.0 - uActive);
  uv = (uv - 0.5) * z + 0.5;
  vec2 c = cover(uv);
  float sh = min(abs(uVel), 1.0) * 0.022 + uHover * 0.005 + (1.0 - uReveal) * 0.03;
  vec2 dir = vec2(1.0, 0.18) * sign(uVel + 0.0001);
  float cr = texture2D(uTex, c + dir * sh).r;
  vec4 cg = texture2D(uTex, c);
  float cb = texture2D(uTex, c - dir * sh).b;
  vec3 col = vec3(cr, cg.g, cb);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 mono = vec3(lum) * uMonoK + uMonoB;
  col = mix(mono, col, clamp(max(uActive, uMatch), 0.0, 1.0));
  vec2 vg = vUv - 0.5; col *= 1.0 - dot(vg, vg) * 0.3;
  float band = exp(-pow((vUv.x - uScan) * 9.0, 2.0)) * uMatch * step(uScan, 1.15);
  col += uLime * band * 0.28;
  vec2 px = (vUv - 0.5) * uPlane;
  float sd = rbox(px, uPlane * 0.5, uRadius);
  float ring = smoothstep(-0.034, -0.022, sd) * uMatch;
  col = mix(col, uLime, ring);
  float edge = 1.0 - smoothstep(-0.006, 0.0, sd);
  gl_FragColor = vec4(col, edge * uAlpha);
}`;
  const LIME = new THREE.Color().setRGB(0.80, 0.95, 0.33);
  const geo = new THREE.PlaneGeometry(1, 1, 40, 28);
  const meshes = PROJECTS.map((p, i) => {
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false,
      uniforms: { uTex: { value: null }, uImg: { value: new THREE.Vector2(16, 10) }, uPlane: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(.5, .5) },
        uVel: { value: 0 }, uHover: { value: 0 }, uTime: { value: 0 }, uActive: { value: 0 }, uAlpha: { value: 1 }, uRadius: { value: .04 }, uReveal: { value: 0 },
        uMatch: { value: 0 }, uScan: { value: 2 }, uMonoK: { value: new THREE.Vector3(.3, .31, .34) }, uMonoB: { value: new THREE.Vector3(.03, .032, .04) }, uLime: { value: LIME } } });
    const m = new THREE.Mesh(geo, mat); m.userData.i = i; m.userData.hover = 0; m.visible = false;
    group.add(m); return m;
  });
  /* mix : thème sombre seul — les uniformes uMonoK / uMonoB sont initialisés aux valeurs sombres de F ci-dessus */

  /* textures de la galerie : une capture par projet */
  let loaded = 0;
  const bootN = $('[data-boot-n]');
  const mkTex = src => { const t = new THREE.Texture(src); t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; return t; };
  const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const texReady = PROJECTS.map((p, i) => loadImg(TEX[p.tex]).then(im => (im ? [mkTex(im), im.naturalWidth, im.naturalHeight] : null)).then(r => {
    if (r) { const u = meshes[i].material.uniforms; u.uTex.value = r[0]; u.uImg.value.set(r[1], r[2]); meshes[i].visible = true; }
    loaded++; if (bootN) bootN.textContent = loaded + '/5';
    const bar = $('.boot-bar i'); if (bar) bar.style.setProperty('--p', loaded / N);
  }));

  /* mise en page 3D */
  const L = { vw: 1, vh: 1, Wv: 1, Hv: 1, w: 1, h: 1, R: 10, step: .6, yOff: 0, mobile: false, gap: 1.1, shiftW: 0 };
  let wrapTop = 0, per = 1;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    L.vw = w; L.vh = h;
    L.Hv = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CAM_Z;
    L.Wv = L.Hv * camera.aspect;
    L.mobile = innerWidth < 861;   /* comme le CSS et fitTitles : largeur de fenêtre, barre de défilement comprise */
    fitTitles();   /* mix : calcule heroM (≤ 860 px) avant de dimensionner les plans */
    if (heroM) {
      /* plan au premier plan (z = 0) : sa projection vaut exactement gridW × planeH px.
         641 à 860 px : le rayon suit la largeur du plan (pas angulaire de 0,44 rad, celui d'un téléphone),
         sinon les voisins d'un plan large sortiraient de l'écran au lieu de rester devinés au bord. */
      L.w = heroM.gridW / w * L.Wv; L.h = heroM.planeH / h * L.Hv;
      L.R = heroM.tab ? L.w / .44 : 5.2; L.yOff = L.Hv * (.5 - (heroM.planeTop + heroM.planeH / 2) / h);
    } else {
      /* bureau : boîte calculée en px par deskHero (la même sert au repli sans WebGL), convertie en unités de scène */
      const d = deskHero(w, h);
      L.w = d.gridW / w * L.Wv; L.h = d.planeH / h * L.Hv;
      L.R = 10; L.yOff = L.Hv * (.5 - (d.planeTop + d.planeH / 2) / h);
    }
    L.gap = heroM ? 1.0 : 1.1;   /* mix : voisins un peu plus proches pour rester devinés */
    L.step = (L.w * L.gap) / L.R;
    L.shiftW = L.mobile ? 0 : ((Math.min(392, w - 24) + 12) / 2) / w * L.Wv;
    meshes.forEach(m => m.material.uniforms.uRadius.value = L.mobile ? .06 : .05);
    wrapTop = wrapEl.getBoundingClientRect().top + scrollY;
    per = Math.max(1, (wrapEl.offsetHeight - h) / (N - 1));
    fitTitles();
  }

  function scrollToY(y, dur) {
    if (dur !== 0) S.lock = performance.now() + (dur || 1.1) * 1000 + 120;
    if (lenis) lenis.scrollTo(y, dur === 0 ? { immediate: true, force: true } : { duration: dur || 1.1, easing: t => 1 - Math.pow(1 - t, 4), force: true });
    else scrollTo({ top: y, behavior: dur === 0 ? 'auto' : 'smooth' });
  }
  const go = i => { i = clamp(i, 0, N - 1); scrollToY(wrapTop + i * per, 1.1); };
  const S = { lock: 0, cur: 0, target: 0, vel: 0, velS: 0, lastScroll: 0, dragging: false, ready: false, shift: 0, match: -1 };
  const readTarget = () => clamp((scrollY - wrapTop) / per, 0, N - 1);
  addEventListener('scroll', () => { S.lastScroll = performance.now(); }, { passive: true });
  const inStage = () => scrollY < wrapTop + per * (N - 1) + innerHeight * .3;

  /* glisser (souris + tactile horizontal) */
  const drag = { on: false, x: 0, sx: 0, sy: 0, moved: 0, t: 0, v: 0 };
  canvas.addEventListener('pointerdown', e => {
    if (!S.ready) return;
    updatePointer(e);
    drag.on = true; drag.x = drag.sx = e.clientX; drag.sy = e.clientY; drag.moved = 0; drag.t = performance.now(); drag.v = 0;
    if (e.pointerType === 'mouse') { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
    S.dragging = true; cur.classList.add('is-drag');
  });
  canvas.addEventListener('pointermove', e => {
    updatePointer(e);
    if (!drag.on) return;
    const dx = e.clientX - drag.x, now = performance.now();
    drag.moved += Math.abs(dx); drag.x = e.clientX;
    const stepPx = (L.w * L.gap) / L.Wv * L.vw;
    let y = scrollY - dx * (per / stepPx) * 1.1;
    y = clamp(y, wrapTop, wrapTop + per * (N - 1));
    scrollToY(y, 0);
    drag.v = dx / Math.max(1, now - drag.t); drag.t = now;
  });
  function endDrag(e) {
    if (!drag.on) return;
    drag.on = false; S.dragging = false; cur.classList.remove('is-drag');
    const travel = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
    if (e.type === 'pointerup' && travel < 8 && drag.moved < 8) { handleTap(); return; }
    if (Math.abs(drag.v) > .35) { go(Math.round(S.target) - Math.sign(drag.v)); S.lastScroll = performance.now() + 900; }
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => { drag.on = false; S.dragging = false; cur.classList.remove('is-drag'); });

  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(-9, -9);
  let hovered = -1, mouseIn = false, mx = 0, my = 0;
  function updatePointer(e) {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX; my = e.clientY;
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    mouseIn = e.pointerType === 'mouse';
  }
  canvas.addEventListener('pointerleave', () => { mouseIn = false; hovered = -1; cur.classList.remove('on'); });
  function pick() {
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(meshes.filter(m => m.visible && m.material.uniforms.uAlpha.value > .5), false)[0];
    if (hit) { hit.object.material.uniforms.uMouse.value.copy(hit.uv); return hit.object.userData.i; }
    return -1;
  }
  function handleTap() {
    const i = pick();
    if (i < 0) return;
    if (i === Math.round(S.target)) openInsp(i, canvas); else go(i);
  }

  /* boucle de rendu (pause onglet caché / hors écran) */
  let running = false, raf = 0, last = 0, stageVisible = true, time = 0;
  const start = () => { if (running || document.hidden || !stageVisible) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  new IntersectionObserver(en => { stageVisible = en[0].isIntersecting; stageVisible ? start() : stop(); }, { rootMargin: '80px' }).observe(wrapEl);

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (dlg.open) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
    const f = 1 - Math.pow(1 - .085, dt * 60);
    S.target = readTarget();
    const prevCur = S.cur;
    S.cur += (S.target - S.cur) * f;
    S.vel = (S.cur - prevCur) / Math.max(dt, .001) / 60;
    S.velS += (S.vel - S.velS) * (1 - Math.pow(1 - .12, dt * 60));
    const v = clamp(S.velS * 9, -1, 1);
    /* aimantation vers le projet le plus proche */
    if (S.ready && !S.dragging && performance.now() > S.lock && !(lenis && lenis.isScrolling === 'smooth') && performance.now() - S.lastScroll > 170) {
      const nearest = Math.round(S.target), off = S.target - nearest;
      if (Math.abs(off) > .004 && Math.abs(off) < .5 && scrollY <= wrapTop + per * (N - 1) + 1 && scrollY >= wrapTop) scrollToY(wrapTop + nearest * per, .75);
    }
    const a = Math.round(S.cur);
    if (S.ready && a !== activeP) setActiveP(a);
    progEl.style.transform = `translateX(${(S.cur / (N - 1)) * 400}%)`;

    hovered = (FINE && mouseIn && S.ready && !S.dragging) ? pick() : -1;
    if (FINE) {
      const onS = mouseIn && S.ready && inStage();   /* la pastille du curseur ne reste pas affichée une fois la galerie dépassée */
      cur.classList.toggle('on', onS);
      cur.classList.toggle('is-open', hovered > -1 && hovered === Math.round(S.target));
      cur.textContent = hovered < 0 ? T['curseur.glisser'] : (hovered === Math.round(S.target) ? C.galerie.curseur_details : C.galerie.curseur_voir);
      cur.style.left = mx + 'px'; cur.style.top = my + 'px';
    }
    group.rotation.z = -0.014 - v * 0.03;
    group.position.x = -S.shift * L.shiftW;
    for (let i = 0; i < N; i++) {
      const m = meshes[i], u = m.material.uniforms;
      const th = (i - S.cur) * L.step, dist = Math.abs(i - S.cur);
      m.position.set(L.R * Math.sin(th), L.yOff, L.R * (1 - Math.cos(th)));
      m.rotation.set(0, -th, 0);
      m.scale.set(L.w, L.h, 1);
      u.uPlane.value.set(L.w, L.h);
      u.uVel.value = v; u.uTime.value = time;
      let act = Math.max(0, 1 - dist / .85); act = act * act * (3 - 2 * act);
      u.uActive.value = act;
      const hT = i === hovered ? 1 : 0;
      m.userData.hover += (hT - m.userData.hover) * (1 - Math.pow(1 - .1, dt * 60));
      u.uHover.value = m.userData.hover;
      u.uAlpha.value = 1 - clamp(dist - 2.2, 0, 1);
      m.renderOrder = -Math.round(dist * 10);
    }
    renderer.render(scene, camera);
  }

  /* correspondance du dock : anneau citron + balayage */
  function match(i) {
    if (S.match === i) return;
    S.match = i;
    meshes.forEach((m, k) => {
      const u = m.material.uniforms;
      gsap.killTweensOf(u.uMatch); gsap.killTweensOf(u.uScan);
      gsap.to(u.uMatch, { value: k === i ? 1 : 0, duration: k === i ? .7 : .4, ease: 'power3.out' });
      if (k === i && !RM) gsap.fromTo(u.uScan, { value: -0.2 }, { value: 1.3, duration: 1.3, delay: .25, ease: 'power2.inOut' });
    });
  }
  function onInsp(on) { gsap.to(S, { shift: on && !L.mobile && inStage() ? 1 : 0, duration: .9, ease: 'expo.inOut' }); }
  function reveal() {
    setActiveP(0, true);
    gsap.set(ttlEls[0].querySelectorAll('.ch'), { yPercent: 115 });
    gsap.set(numEls[0], { yPercent: 110 });
    gsap.timeline({ onComplete: () => { S.ready = true; } })
      .to(meshes.map(m => m.material.uniforms.uReveal), { value: 1, duration: 1.5, ease: 'expo.out', stagger: .08 }, .1)
      .to(ttlEls[0].querySelectorAll('.ch'), { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .03 }, .4)
      .to(numEls[0], { yPercent: 0, duration: .9, ease: 'expo.out' }, .5);
  }
  /* clavier : flèches dans la galerie */
  document.addEventListener('keydown', e => {
    if (dlg.open || e.defaultPrevented) return;
    const t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (!inStage() || scrollY > wrapTop + per * (N - 1) + 2) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(S.target) + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(S.target) - 1); }
  });
  let rT = 0;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layout, 120); });
  layout(); start();
  return { mode: 'gl', go, match, follow: i => { if (inStage()) go(i); }, onInsp, inStage, active: () => activeP, layout, reveal, texReady, S, L, get ready() { return S.ready; } };
})();
window.__fa = gal;

$('#detBtn').addEventListener('click', e => openInsp(Math.max(0, gal.active()), e.currentTarget));

/* ═════════════════ Dock de commande : pilote la galerie ═════════════════ */
const dock = $('#dock'), dockQ = $('#dockq'), chipsEl = $('[data-chips]'), dockSt = $('[data-dock-st]'), dockSr = $('#dock-sr'), phEl = $('[data-ph]');
const DEF_CHIPS = C.dock.puces;
let best = -1, lastKey = '', dockT = 0;
function chipsDefault() {
  chipsEl.innerHTML = `<span class="dock-lbl" aria-hidden="true">${esc(C.dock.essayez)}</span>` + DEF_CHIPS.map(([l, q], k) => `<button class="chip${lastKey === '' ? '' : ' anim'}" type="button" data-q="${esc(q)}" style="--i:${k}">${esc(l)}</button>`).join('');
}
function dockRun(q, opts = {}) {
  const m = projMatch(q);
  const others = q.trim() ? search(q).filter(x => x.it.g !== 'proj').length : 0;
  const key = m.map(x => x.i).join() + '|' + others;
  best = m.length ? m[0].i : -1;
  dock.classList.toggle('typed', !!q);
  dock.classList.toggle('hit', best > -1);
  if (!q.trim()) {
    dockSt.innerHTML = esc(C.dock.etat);
    if (lastKey !== '') { lastKey = ''; chipsDefault(); }
    gal.match(-1); dockSr.textContent = '';
    return;
  }
  if (best > -1) {
    const p = PROJECTS[best];
    dockSt.innerHTML = fmt(C.dock.meilleur, { t: esc(p.title) });
    dockSr.textContent = fmt(C.dock.meilleur_sr, { t: p.title, s: p.sector });
    gal.match(best);
    if (best !== gal.active() || opts.force) gal.go(best);
  } else {
    dockSt.innerHTML = others ? `${esc(plural(C.dock.hors, others))} · <b>${MOD} K</b>` : esc(C.dock.aucun);
    dockSr.textContent = others ? fmt(C.dock.hors_sr, { n: others }) : C.dock.aucun_sr;
    gal.match(-1);
  }
  if (key !== lastKey) {
    lastKey = key;
    chipsEl.innerHTML = m.slice(0, 3).map((x, k) => `<button class="chip res anim${k === 0 ? ' best' : ''}" type="button" data-p="${x.i}" style="--i:${k}"><i>${pad2(x.i)}</i>${esc(PROJECTS[x.i].title)}</button>`).join('') +
      (others ? `<button class="chip pal anim" type="button" data-pal style="--i:${Math.min(m.length, 3)}">${esc(plural(C.dock.autres, others))} ${MOD}K</button>` : '') +
      (!m.length && !others ? `<button class="chip pal anim" type="button" data-pal>${esc(C.dock.chercher)}</button>` : '');
  }
}
dockQ.addEventListener('input', () => { clearTimeout(dockT); dockT = setTimeout(() => dockRun(dockQ.value), 140); });
dockQ.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault(); clearTimeout(dockT); dockRun(dockQ.value);
    if (best > -1) { if (e.metaKey || e.ctrlKey) window.open(PROJECTS[best].case, '_blank', 'noopener'); else openInsp(best, dockQ); }
    else if (dockQ.value.trim()) open(dockQ.value);
  } else if (e.key === 'Escape') {
    if (dockQ.value) { e.preventDefault(); dockQ.value = ''; dockRun(''); }
    else dockQ.blur();
  }
});
chipsEl.addEventListener('click', e => {
  const c = e.target.closest('button'); if (!c) return;
  if (c.dataset.q != null) { dockQ.value = c.dataset.q; dockRun(c.dataset.q, { force: true }); dockQ.focus({ preventScroll: true }); }
  else if (c.dataset.p != null) { const i = +c.dataset.p; gal.match(i); if (gal.active() === i) openInsp(i, c); else gal.go(i); }
  else if (c.dataset.pal != null) open(dockQ.value);
});
chipsDefault();
/* placeholder qui s’écrit tout seul (n’anime jamais la galerie) */
const PH = C.dock.exemples;
let phI = 0, phS = '', phPhase = 'type', phTimer = 0;
function phTick() {
  clearTimeout(phTimer);
  if (document.activeElement === dockQ || dockQ.value || document.hidden || !gal.inStage()) { phTimer = setTimeout(phTick, 600); return; }
  const target = fmt(C.dock.gabarit, { q: PH[phI].replace(/…$/, '') });
  if (phPhase === 'type') {
    if (phS.length < target.length) { phS = target.slice(0, phS.length + 1); phEl.textContent = phS; phTimer = setTimeout(phTick, 30 + Math.random() * 40); }
    else { phPhase = 'hold'; phTimer = setTimeout(phTick, 2200); }
  } else if (phPhase === 'hold') { phPhase = 'del'; phTick(); }
  else {
    if (phS.length > C.dock.debut.length - 1) { phS = phS.slice(0, -2); phEl.textContent = phS; phTimer = setTimeout(phTick, 16); }
    else { phI = (phI + 1) % PH.length; phPhase = 'type'; phTimer = setTimeout(phTick, 300); }
  }
}
if (RM) phEl.textContent = C.dock.repli; else { phEl.textContent = C.dock.debut; phS = C.dock.debut; }

/* ═════════════════ Raccourcis globaux ═════════════════ */
const SKEY = Object.fromEntries(SKILLS.map(s => ['Key' + s.key, s.id]));
document.addEventListener('keydown', e => {
  const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? close() : open(t === dockQ ? dockQ.value : ''); return; }
  if (dlg.open) return;
  if (e.key === 'Escape' && inspI > -1) { closeInsp(); return; }
  if (typing) return;
  if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); if (gal.inStage()) dockQ.focus(); else open(''); return; }
  if (e.altKey && !e.metaKey && !e.ctrlKey && SKEY[e.code]) { e.preventDefault(); runSkill(SKEY[e.code], true); }
});

/* ═════════════════ Lignes de commande + révélations + compteurs ═════════════════ */
function typeLine(el) {
  const q = el.dataset.q, tx = $('.tx', el);
  if (RM) { tx.textContent = q; el.classList.add('done'); return; }
  let i = 0;
  const step = () => { tx.textContent = q.slice(0, ++i); if (i < q.length) setTimeout(step, 22 + Math.random() * 30); else el.classList.add('done'); };
  step();
}
$$('.qline').forEach(el => { el.innerHTML = '<span class="pr">›</span><span class="tx"></span><span class="caret"></span>'; });
function countUp(el) {
  const to = +el.dataset.count, suf = el.dataset.suffix;
  if (RM) return;
  const t0 = performance.now(), D = 1400;
  const f = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(2, -10 * k); el.innerHTML = `${Math.round(to * (k >= 1 ? 1 : e))}<small>${suf}</small>`; if (k < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target;
  if (el.classList.contains('qline')) typeLine(el);
  else if (el.dataset.count) countUp(el);
  else el.classList.add('in');
  io.unobserve(el);
}), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
$$('.rv, .qline, [data-count]').forEach(el => io.observe(el));

/* mix : l'en-tête .top de F est remplacé par la barre de navigation de V (js/accueil-sections.js) */

/* horloge de Paris */
const clockFmt = new Intl.DateTimeFormat(C.locale, { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const clocks = $$('[data-clock]');
const clk = () => { const s = clockFmt.format(new Date()); clocks.forEach(c => c.textContent = s); };
clk(); setInterval(clk, 1000);

/* mix : le contact de F (lettres réactives, bouton magnétique) n'est pas repris : c'est le contact de V */

/* ═════════════════ Arrivée orchestrée ═════════════════ */
const boot = $('.boot');
const startHero = () => {
  root.classList.add('ready');
  root.classList.remove('boot-on');
  gal.reveal();
  if (!gal.ready && gal.mode === 'static') setActiveP(0, true);
  if (!RM) setTimeout(phTick, 1400);
};
if (gal.mode === 'static') setActiveP(0, true);
if (RM || !boot) { boot && boot.remove(); startHero(); }
else {
  root.classList.add('boot-on');
  const fonts = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1600))]) : Promise.resolve();
  const tex = gal.texReady ? Promise.race([Promise.all(gal.texReady), new Promise(r => setTimeout(r, 1700))]) : Promise.resolve();
  const minT = new Promise(r => setTimeout(r, 950));
  if (gal.mode === 'static') { const bn = $('[data-boot-n]'); if (bn) bn.textContent = '5/5'; $('.boot-bar i').style.setProperty('--p', 1); }
  Promise.all([fonts, tex, minT]).then(() => {
    fitTitles();
    boot.classList.add('done');
    startHero();
    setTimeout(() => boot.remove(), 760);
  });
}
if (document.fonts) document.fonts.ready.then(() => { fitTitles(); if (gal.layout) gal.layout(); refreshST(); });
addEventListener('resize', () => { if (gal.mode === 'static') fitTitles(); });
addEventListener('load', refreshST);
});
