# Délicorner — case study : intégration

## Fichiers
- `delicorner-detail.html` — page autoporté (mêmes patterns que `gouvernement-detail.html`)
- `js/delicorner.js` — logique (reveal, scroll-spy TOC, lightbox, compteurs, scène Slack, Chart.js)
- `image/delicorner/*.webp` — 17 visuels optimisés (854 Ko au total, lazy-load)
- `delicorner.fr.json` / `delicorner.en.json` — 153 clés `deli.*` à **merger** dans tes JSON existants
- `critical.css` — ta version (copie, pour rappel ; la page la charge en `/critical.css`)

## 3 étapes
1. Copie `delicorner-detail.html`, `js/delicorner.js` et `image/delicorner/` à la racine du site.
2. Fusionne le contenu de `delicorner.fr.json` / `.en.json` dans tes `fr.json` / `en.json`
   (namespace `deli.*`, aucune collision avec l'existant — vérifié).
3. C'est tout : la page est bilingue (FR par défaut), `i18n.js`/`nav.js` sont déjà branchés.

## Notes
- **Chart.js** : chargé via CDN cdnjs 4.4.1 en `defer` (cohérent avec ta page gouv). Si tu préfères
  le bundle local, remplace la balise `<script src="https://cdnjs...">`.
- **Police** : Fraunces (display, Google Fonts) en echo de la DA Délicorner ; body = stack système.
- **2 scènes animées CSS/SVG** : « token → composant » (cas 1) et « Slack → analyse → quick actions »
  (cas 2). Toutes deux respectent `prefers-reduced-motion`.
- **Budget perf** : JS page < 6 Ko + Chart.js ; images 854 Ko lazy → sous le budget 1 Mo.

## Optionnel — carte sur l'index
Je n'ai pas touché à `index.html`. Pour ajouter la carte projet, duplique une `.project-card`
existante et pointe son lien vers `delicorner-detail.html` (visuel : `image/delicorner/deli-hero.webp`).
