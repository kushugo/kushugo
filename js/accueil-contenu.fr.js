/* accueil-contenu.fr.js - textes français de la page d'accueil (parties « galerie, dock, rail, palette, inspecteur,
   sélection de projets, écran de démarrage, libellés accessibles »). Structure de données pure, sans logique.
   Même structure dans accueil-contenu.en.js. Les textes des sections « Système d'abord » (marques, IA, expertise,
   contact, barre de navigation, pied de page) passent par js/i18n.js et i18n/<langue>.json (attributs data-i18n).
   Gabarits : {n}, {t}, {s}… sont remplacés par js/accueil.js. Noms propres (projets, marques) : dans le code. */
window.ACCUEIL_CONTENU = window.ACCUEIL_CONTENU || {};
window.ACCUEIL_CONTENU.fr = {
  locale: 'fr-FR',

  /* textes fixes de la page, appliqués aux éléments marqués data-t / data-t-attr */
  ui: {
    'skip': 'Aller au contenu',
    'boot.projets': 'Indexation des projets',
    'boot.visuels': 'Chargement des visuels',
    'boot.competences': 'Indexation des compétences',
    'boot.dock': 'Dock de commande',
    'boot.pret': 'prêt',
    'rail.titre': 'Calques',
    'rail.aria': 'Calques : sections et projets',
    'hero.flat': 'Sélection de projets',
    'hero.metier': 'Product Designer · Paris',
    'hero.dispo': 'Disponible · freelance ou CDI',
    'hero.paris': 'Paris',
    'hero.secteur1': 'Secteur public',
    'hero.secteur2': 'SaaS B2B',
    'hero.secteur3': 'Secteur culturel',
    'hero.defiler': 'Défiler',
    'hero.glisser': 'Glisser',
    'hero.projet_sr': 'Projet',
    'hero.details': 'Détails',
    'dock.aria': 'Explorer les projets',
    'dock.etat': 'Tapez un besoin, la galerie répond',
    'dock.ouvrir': 'ouvrir',
    'dock.label': 'Chercher un projet par besoin ou mot-clé',
    'dock.palette': 'Ouvrir la palette de commandes complète',
    'projets.ligne': 'projets --tri=sélection',
    'projets.titre': 'Sélection de projets',
    'projets.compteur': '{n} résultats',
    'projets.aide': 'Cliquez ou ↵ pour déplier une étude de cas',
    'insp.titre': 'Inspecteur',
    'insp.fermer': 'Fermer l’inspecteur',
    'insp.prec': 'Précédent',
    'insp.suiv': 'Suivant',
    'pal.titre': 'Palette de commandes',
    'pal.champ': 'Rechercher un projet, une compétence, un client ou une action',
    'pal.placeholder': 'Projet, compétence, client, action…',
    'pal.fermer': 'Fermer la palette',
    'pal.resultats': 'Résultats',
    'pal.naviguer': 'naviguer',
    'pal.executer': 'exécuter',
    'pal.onglet': 'nouvel onglet',
    'pal.effacer': 'effacer / fermer',
    'curseur.glisser': 'Glisser',
    'logo.aria': 'Hugo Ferrer, retour en haut de page',
    'nav.ouvrir': 'Ouvrir le menu de navigation',
    'nav.fermer': 'Fermer le menu de navigation',
    'lang.fr': 'Basculer en français',   /* chaque bouton est libellé dans sa propre langue (lang="fr" / lang="en") */
    'lang.en': 'Switch to English',
    'nav.aria': 'Navigation principale',

    /* intérieur des scènes animées des sections « Système d'abord » (agent de design, six scènes d'expertise, contact).
       Posés par data-t dans index.html et lus par js/accueil-sections.js pour les textes écrits par le script. */
    /* niveau affiché dans la bulle des tags « Expertise & Compétences » (js/accueil-sections.js, levels) */
    'niv.titre': 'Mon niveau',
    'niv.1': 'Notions',
    'niv.2': 'Intermédiaire',
    'niv.3': 'Avancé',
    'niv.4': 'Expert',
    'niv.sur': '{n} sur 4',
    'sc.decimale': ',',
    'sc.ag.titre': 'Agent de design',
    'sc.ag.lit': 'lit',
    'sc.ag.temps0': '0,0 s',
    'sc.ag.outil1': 'Lire les tokens',
    'sc.ag.outil2': 'Vérifier les contrastes',
    'sc.ag.outil3': 'Comparer aux composants',
    'sc.ag.texte': 'Le bouton principal a un rayon de 6 px, alors que cartes et champs sont à 12 px. Son anneau de focus est trop pâle pour le niveau AA. Je propose d’aligner les deux.',
    'sc.ag.legende': 'Modifications proposées par l’agent',
    'sc.ag.diff1': 'aligné sur les cartes',
    'sc.ag.diff2': 'contraste 1,5 → 4,6',
    'sc.ag.apercu': 'Aperçu du bouton',
    'sc.ag.exemple': 'Enregistrer',
    'sc.ag.refuser': 'Refuser',
    'sc.ag.valider': 'Valider la proposition',
    'sc.ag.applique': 'Appliqué. Rien ne change sans votre accord.',
    'sc.ag.ecarte': 'Écarté. Le système reste tel quel.',
    'sc.x1.titre': 'Verbatims triés',
    'sc.x1.col1': 'Frictions',
    'sc.x1.col2': 'Besoins',
    'sc.x1.col3': 'Idées',
    'sc.x1.insight': 'Insight : trois frictions sur le même écran',
    'sc.x2.enregistrer': 'Enregistrer',
    'sc.x2.enregistre': 'Enregistré',
    'sc.x3.e1': 'Découvrir',
    'sc.x3.e2': 'Définir',
    'sc.x3.e3': 'Développer',
    'sc.x3.e4': 'Livrer',
    'sc.x3.fin': 'Solution validée',
    'sc.x4.largeur': 'Largeur du cadre',
    'sc.x6.titre': 'IA · « crée une carte produit »',
    'sc.x6.zero': '0 écart',
    'sc.x6.un': '1 écart',
    'sc.x6.plusieurs': '{k} écarts',
    'sc.x6.switch': 'Design system lisible',
    'sc.ct.valider': 'Valider'
  },

  /* titre du hero, découpé en mots animés */
  hero: { nom: 'Hugo Ferrer.', accroche1: 'Product designer B2B.', accroche2: 'Du MVP au produit, design systems AI-ready.' },

  /* projets : textes par identifiant (le fait « Secteur » est retiré : le secteur est déjà sous le titre) */
  projets: {
    delicorner: {
      sector: 'Foodtech B2B', sub: 'Portail B2B Délicorner Digital, de bout en bout', chip: 'End-to-end · Solo',
      lead: 'Un portail B2B complet, du prototype haute-fidélité au design system sur-mesure.',
      desc: 'Conception complète du portail B2B Délicorner Digital, des prototypes fonctionnels haute-fidélité jusqu’au design system sur-mesure. Projet end-to-end mené en solo, de la structure produit aux outils IA internes côté expérience client.',
      facts: [['Rôle', 'End-to-end, en solo'], ['Livrables', 'Prototypes HF · Design system sur-mesure · Outils IA internes']],
      tags: ['Portail B2B', 'Design system', 'IA'],
      main_alt: 'Portail Délicorner sur laptop, tablette et mobile',
      float_cap: 'Scène 3D · boutique et livraison', float_alt: 'Scène 3D de la boutique Délicorner et de son camion de livraison',
      kw: 'foodtech b2b portail saas design system prototype prototypes haute fidelite ia agents outils internes experience client end-to-end solo produit commande immersif 3d'
    },
    gouv: {
      sector: 'Secteur public', sub: 'Refonte de la page des politiques prioritaires', chip: 'DSFR · RGAA',
      lead: 'Rendre lisibles les politiques prioritaires du gouvernement, pour tous les citoyens.',
      desc: 'Adaptation et refonte de la page des politiques prioritaires du gouvernement français, pour améliorer l’accessibilité et la clarté de l’information pour tous les citoyens.',
      facts: [['Méthode', 'Benchmark UX · Wireframes · DSFR'], ['Objectif', 'Accessibilité et clarté de l’information']],
      tags: ['DSFR', 'Accessibilité', 'Benchmark'],
      main_alt: 'Refonte Gouvernement.fr sur plusieurs écrans',
      float_cap: 'Système de Design de l’État', float_alt: 'Planche du Système de Design de l’État',
      kw: 'gouvernement secteur public etat dsfr accessibilite a11y rgaa wcag citoyens benchmark wireframes refonte clarte information politiques prioritaires design system'
    },
    agora: {
      sector: 'Marketplace B2B', sub: 'Application complète pour les grossistes de Rungis', chip: 'Web + mobile',
      lead: 'Digitaliser le marché de Rungis : commande, solvabilité, facturation électronique et comptabilité.',
      desc: 'Application complète pour les grossistes du marché de Rungis : prise de commande, solvabilité, facturation électronique et comptabilité. Un projet B2B complexe de digitalisation des processus métier.',
      facts: [['Périmètre', 'Commande · Solvabilité · Facturation électronique · Comptabilité'], ['Plateformes', 'Dashboard web · Application mobile']],
      tags: ['B2B complexe', 'Web + mobile', 'Fintech'],
      main_alt: 'Tableau de bord AgoraSquare : trésorerie, factures, activité',
      float_cap: 'Application mobile', float_alt: 'Écrans mobiles AgoraSquare',
      kw: 'agorasquare marketplace b2b complexe rungis grossistes commande solvabilite facturation electronique comptabilite dashboard mobile application metier digitalisation processus fintech'
    },
    gomind: {
      sector: 'ESN · GreenIT', sub: 'Refonte du site vitrine et mascotte IA', chip: 'Identité · IA',
      lead: 'Une identité moderne, un générateur de mascotte IA et un design system pour l’acquisition B2B.',
      desc: 'Refonte complète du site vitrine d’une ESN spécialisée en GreenIT : identité visuelle moderne, générateur de mascotte IA (un hérisson) et design system, pour améliorer l’acquisition client B2B.',
      facts: [['Livrables', 'Identité visuelle · Mascotte IA · Design system'], ['Objectif', 'Acquisition client B2B']],
      tags: ['Refonte', 'Mascotte IA', 'Design system'],
      main_alt: 'Page d’accueil GoMind avec sa mascotte hérisson',
      float_cap: 'Nouveau site', float_alt: 'Nouvelle page GoMind, version longue',
      kw: 'gomind esn greenit site vitrine refonte identite visuelle mascotte ia herisson design system acquisition b2b'
    },
    collecte: {
      sector: 'SaaS B2B', sub: 'Collecte de documents sociaux, de 0 à 100 %', chip: 'Discovery · UX writing',
      lead: 'Réunir 26 types de documents sociaux auprès d’un client, et savoir à tout moment ce qui manque encore.',
      desc: 'Discovery et conception de la collecte de documents d’un cabinet de conseil RH et finance, dont le nom reste confidentiel : huit entretiens, puis quatre parcours (commercial, client, manager, consultant) pour demander, déposer, contrôler et relancer les documents sociaux d’une entreprise.',
      facts: [['Rôle', 'Product Designer B2B, de juillet à octobre 2026'], ['Périmètre', 'Huit entretiens · Quatre parcours · 26 types de documents']],
      tags: ['SaaS B2B', 'UX writing', 'Discovery'],
      main_alt: 'Extrait de maquette : ce qui manque encore, zone de dépôt et suivi des 26 types de documents',
      float_cap: 'Relance ciblée', float_alt: 'Fenêtre de relance des documents manquants',
      kw: 'saas b2b rh paie finance cabinet conseil donnees sociales collecte documents dsn bulletins cotisations data collection discovery entretiens personas userflows ux writing cas limites handoff consultant client manager commercial depot controle relance outil metier'
    }
  },

  /* compétences : les six cartes « Expertise & Compétences » (mêmes textes que i18n/fr.json) */
  competences: {
    research: { title: 'UX Research', sub: 'Comprendre les utilisateurs pour créer des expériences qui répondent à leurs besoins réels', out: ['Personas', 'User Testing', 'Analytics'], kw: 'recherche utilisateur research personas tests utilisateurs user testing analytics entretiens verbatims' },
    ui: { title: 'UI Design', sub: 'Créer des interfaces élégantes et intuitives qui enchantent les utilisateurs', out: ['Figma', 'Design Systems', 'Prototyping'], kw: 'interface ui figma prototype prototypage maquettes visuel composant etats' },
    thinking: { title: 'Design Thinking', sub: 'Résoudre des problèmes complexes avec créativité et méthodologie', out: ['Idéation', 'Workshops', 'Validation'], kw: 'design thinking ideation ateliers workshops validation cadrage double diamant' },
    tools: { title: 'Outils & Tech', sub: 'Maîtrise des outils modernes de design et compétences techniques', out: ['Adobe Suite', 'Webflow', 'Notion'], kw: 'outils tech adobe webflow notion figma auto layout technique' },
    mcp: { title: 'MCP Design', sub: 'Conception d’agents MCP et d’outils connectés, du prototype au produit déployé', out: ['Agents IA', 'Intégrations', 'Workflows'], kw: 'mcp ia intelligence artificielle agents integrations workflows automatisation storybook' },
    ai: { title: 'AI-Ready', sub: 'Des design systems que vos équipes et vos outils IA lisent sans ambiguïté', out: ['Tokens', 'Documentation', 'Agents IA'], kw: 'ai ready ia design system dsfr tokens documentation gouvernance composants bibliotheque agents' }
  },

  /* rail et « Aller à » de la palette */
  sections: {
    accueil: { rail: 'Accueil', titre: 'Accueil', sous: 'Haut de page, galerie de projets' },
    marques: { rail: 'Marques', titre: 'Marques', sous: 'A travaillé avec : 9 organisations' },
    'ai-ready': { rail: 'Design system AI-ready', titre: 'Design system AI-ready', sous: 'Un système que vos équipes et vos outils savent lire' },
    projets: { rail: 'Projets', titre: 'Projets', sous: 'Sélection de 4 études de cas' },
    expertise: { rail: 'Expertise', titre: 'Expertise & Compétences', sous: '6 compétences, 6 scènes manipulables' },
    contact: { rail: 'Contact', titre: 'Contact', sous: 'Parler d’une mission, e-mail, CV, LinkedIn' }
  },
  rail_projet: 'Projet {num} : {t}',

  /* étude de cas dépliée (liste de projets) */
  etude: { lire: 'Lire l’étude de cas', immersif: 'Mode immersif', details: 'Détails', detail_region: 'Détail {t}' },

  /* galerie du hero */
  galerie: { details_projet: 'Détails du projet {t}', carte: '{num} {t}, {s}. Ouvrir les détails', curseur_details: 'Détails', curseur_voir: 'Voir' },

  /* palette de commandes */
  palette: {
    groupes: { act: 'Actions', proj: 'Projets', skill: 'Compétences', client: 'Clients', nav: 'Aller à' },
    rdv: { title: 'Parler d’une mission', sub: 'Calendly · carte dans la page', kw: 'rendez vous rdv contact calendly appel reserver creneau mission freelance disponible embaucher', desc: 'Un créneau sur Calendly, dans une carte ouverte sur la page.', rows: [['Lien', 'calendly.com/ferrerhugo91300'], ['Statut', 'Disponible · freelance ou CDI']], act: 'ouvrir la carte de rendez-vous' },
    copie: { title: 'Copier le lien LinkedIn', sub: 'Presse-papiers', kw: 'linkedin copier lien profil partager contact', desc: 'Copie l’URL du profil dans le presse-papiers.', rows: [['URL', 'linkedin.com/in/hugo-ferrer-…']] },
    linkedin: { title: 'Ouvrir LinkedIn', sub: 'Profil · nouvel onglet', kw: 'linkedin profil reseau contact', desc: 'Le profil complet de Hugo Ferrer.', rows: [['URL', 'linkedin.com/in/hugo-ferrer-…']] },
    immersif: { title: 'Lancer le mode immersif', sub: 'Délicorner · scène 3D', kw: 'immersif immersive 3d scene mode creatif delicorner experience', pvTitle: 'Mode immersif · Délicorner', desc: 'L’étude de cas Délicorner mise en scène : la boutique et la livraison en 3D, à explorer.', rows: [['Projet', 'Délicorner']], act: 'ouvrir le mode immersif' },
    a11y: { title: 'Accessibilité RGAA / WCAG', sub: 'Expertise · secteur public', kw: 'accessibilite a11y rgaa wcag handicap inclusif citoyens conformite', desc: 'Expert en accessibilité : l’information claire pour tous. Mise en pratique sur Gouvernement.fr avec le DSFR.', rows: [['Normes', 'RGAA · WCAG'], ['Projet', 'Gouvernement.fr']], act: 'voir le projet lié' },
    competence: { inclut: 'Inclut', raccourci: '{k} depuis la page' },
    client: { avec_etude: 'Client · étude de cas disponible', sans_etude: 'Client · bandeau des marques', confiance: 'A fait confiance à Hugo Ferrer.', voir_etude: 'voir l’étude de cas', voir_page: 'voir dans la page', sep: ' : ' },
    nav: { section: 'Section', act: 'faire défiler' },
    projet: { deplier: 'déplier ici', ouvrir: 'ouvrir l’étude de cas' },
    executer: 'exécuter',
    voir_lie: 'voir le projet lié',
    aucun: 'Aucun résultat pour',
    cite: '« {q} »',
    parler: 'En parler directement avec Hugo',
    compte: ['{n} résultat', '{n} résultats'],
    sr_premier: '{n} résultats. Premier : {t}.',
    sr_aucun: 'Aucun résultat.'
  },

  /* inspecteur */
  insp: {
    entete: 'Inspecteur · {num}/04',
    cle: '{num} / 04 · {s}',
    parcourir: 'Comment le parcourir', modes: ['2 modes', '3 modes'],
    etude: 'Voir l’étude de cas', etude_txt: 'La lecture classique, page par page : contexte, démarche, écrans et livrables.',
    immersif: 'Mode immersif', immersif_txt: 'Le même projet mis en scène : la boutique et la livraison en 3D, à explorer plutôt qu’à lire.',
    apercu: 'Aperçu sur place', apercu_txt: 'Déplie la fiche dans la sélection : visuels, rôle et livrables, sans quitter la page.',
    note: 'Le mode immersif existe pour Délicorner.', note_btn: 'L’inspecter',
    fiche: 'Fiche'
  },

  /* dock de commande */
  dock: {
    essayez: 'Essayez',
    puces: [['B2B', 'B2B'], ['Accessibilité', 'accessibilité'], ['IA', 'IA'], ['Secteur public', 'public'], ['Design system', 'design system'], ['Mobile', 'mobile']],
    etat: 'Tapez un besoin, la galerie répond',
    meilleur: 'Meilleure correspondance · <b>{t}</b>',
    meilleur_sr: 'Meilleure correspondance : {t}, {s}. Entrée pour ouvrir les détails.',
    hors: ['{n} résultat hors projets', '{n} résultats hors projets'],
    hors_sr: 'Aucun projet. {n} autres résultats dans la palette, Entrée pour l’ouvrir.',
    aucun: 'Aucun projet ne correspond',
    aucun_sr: 'Aucun projet ne correspond.',
    autres: ['{n} autre résultat', '{n} autres résultats'],
    chercher: 'Chercher dans la palette',
    exemples: ['Un projet B2B complexe…', 'accessibilité', 'un design system public', 'IA', 'application mobile'],
    gabarit: 'Essayez « {q} »',
    debut: 'Essayez « ',
    repli: 'Essayez « accessibilité »'
  },

  /* messages éphémères */
  toasts: { lien_copie: 'Lien LinkedIn copié', presse: 'presse-papiers', copie_ko: 'Copie impossible : ', marques: 'a travaillé avec' },

  /* recherche (dock et palette) : mots ignorés et mots-clés de groupe */
  recherche: {
    stop: 'montre montrez moi un une le la les l de des du d comment hugo gere gerer qu que quoi est ce c a au aux pour en et sur avec mon ma mes je tu il me voir quel quelle quels quelles son sa ses votre vos ou y show me the projet projets',
    kw_projet: 'projet projets etude de cas',
    kw_competence: 'competence competences',
    kw_client: 'client clients marques marque reference',
    kw_nav: 'aller section page'
  }
};
