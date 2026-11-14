/* accueil-contenu.en.js — English texts of the home page (gallery, dock, rail, palette, inspector, selected projects,
   boot screen, accessible labels). Pure data, no logic. Same structure and same keys as accueil-contenu.fr.js.
   Faithful translation of the French: no fact added. Proper nouns (projects, brands) live in the code. */
window.ACCUEIL_CONTENU = window.ACCUEIL_CONTENU || {};
window.ACCUEIL_CONTENU.en = {
  locale: 'en-US',

  /* fixed texts of the page, applied to elements marked data-t / data-t-attr */
  ui: {
    'skip': 'Skip to content',
    'boot.projets': 'Indexing projects',
    'boot.visuels': 'Loading visuals',
    'boot.competences': 'Indexing skills',
    'boot.dock': 'Command dock',
    'boot.pret': 'ready',
    'rail.titre': 'Layers',
    'rail.aria': 'Layers: sections and projects',
    'hero.flat': 'Selected projects',
    'hero.metier': 'Product Designer · Paris',
    'hero.dispo': 'Available · freelance work',
    'hero.paris': 'Paris',
    'hero.secteur1': 'Public sector',
    'hero.secteur2': 'B2B SaaS',
    'hero.secteur3': 'Cultural sector',
    'hero.defiler': 'Scroll',
    'hero.glisser': 'Drag',
    'hero.projet_sr': 'Project',
    'hero.details': 'Details',
    'dock.aria': 'Explore the projects',
    'dock.etat': 'Type a need, the gallery answers',
    'dock.ouvrir': 'open',
    'dock.label': 'Search a project by need or keyword',
    'dock.palette': 'Open the full command palette',
    'projets.ligne': 'projects --sort=selection',
    'projets.titre': 'Selected projects',
    'projets.compteur': '{n} results',
    'projets.aide': 'Click or press ↵ to expand a case study',
    'insp.titre': 'Inspector',
    'insp.fermer': 'Close the inspector',
    'insp.prec': 'Previous',
    'insp.suiv': 'Next',
    'pal.titre': 'Command palette',
    'pal.champ': 'Search for a project, a skill, a client or an action',
    'pal.placeholder': 'Project, skill, client, action…',
    'pal.fermer': 'Close the palette',
    'pal.resultats': 'Results',
    'pal.naviguer': 'navigate',
    'pal.executer': 'run',
    'pal.onglet': 'new tab',
    'pal.effacer': 'clear / close',
    'curseur.glisser': 'Drag',
    'logo.aria': 'Hugo Ferrer, back to top of page',
    'nav.ouvrir': 'Open the navigation menu',
    'nav.fermer': 'Close the navigation menu',
    'lang.fr': 'Basculer en français',
    'lang.en': 'Switch to English',
    'nav.aria': 'Main navigation',

    /* inside the animated scenes of the "Système d'abord" sections (design agent, six expertise scenes, contact) */
    'sc.decimale': '.',
    'sc.ag.titre': 'Design agent',
    'sc.ag.lit': 'reads',
    'sc.ag.temps0': '0.0 s',
    'sc.ag.outil1': 'Read the tokens',
    'sc.ag.outil2': 'Check contrast',
    'sc.ag.outil3': 'Compare with components',
    'sc.ag.texte': 'The primary button has a 6 px radius, while cards and fields use 12 px. Its focus ring is too pale for AA. I suggest aligning both.',
    'sc.ag.legende': 'Changes proposed by the agent',
    'sc.ag.diff1': 'aligned with the cards',
    'sc.ag.diff2': 'contrast 1.5 → 4.6',
    'sc.ag.apercu': 'Button preview',
    'sc.ag.exemple': 'Save',
    'sc.ag.refuser': 'Decline',
    'sc.ag.valider': 'Approve the proposal',
    'sc.ag.applique': 'Applied. Nothing changes without your approval.',
    'sc.ag.ecarte': 'Dismissed. The system stays as it is.',
    'sc.x1.titre': 'Quotes sorted',
    'sc.x1.col1': 'Pain points',
    'sc.x1.col2': 'Needs',
    'sc.x1.col3': 'Ideas',
    'sc.x1.insight': 'Insight: three pain points on the same screen',
    'sc.x2.enregistrer': 'Save',
    'sc.x2.enregistre': 'Saved',
    'sc.x3.e1': 'Discover',
    'sc.x3.e2': 'Define',
    'sc.x3.e3': 'Develop',
    'sc.x3.e4': 'Deliver',
    'sc.x3.fin': 'Solution validated',
    'sc.x4.largeur': 'Frame width',
    'sc.x6.titre': 'AI · “create a product card”',
    'sc.x6.zero': '0 mismatches',
    'sc.x6.un': '1 mismatch',
    'sc.x6.plusieurs': '{k} mismatches',
    'sc.x6.switch': 'Readable design system',
    'sc.ct.valider': 'Confirm'
  },

  /* hero title, split into animated words */
  hero: { nom: 'Hugo Ferrer.', accroche1: 'High-impact platforms.', accroche2: 'Turning complexity into fluid experiences.' },

  /* projects: texts by identifier */
  projets: {
    delicorner: {
      sector: 'B2B foodtech', sub: 'Délicorner Digital B2B portal, end to end', chip: 'End-to-end · Solo',
      lead: 'A complete B2B portal, from high-fidelity prototype to a bespoke design system.',
      desc: 'Full design of the Délicorner Digital B2B portal, from functional high-fidelity prototypes to a bespoke design system. An end-to-end project led solo, from product structure to in-house AI tools for customer experience.',
      facts: [['Role', 'End-to-end, solo'], ['Deliverables', 'Hi-fi prototypes · Bespoke design system · In-house AI tools']],
      tags: ['B2B portal', 'Design system', 'AI'],
      main_alt: 'Délicorner portal on laptop, tablet and mobile',
      float_cap: '3D scene · shop and delivery', float_alt: '3D scene of the Délicorner shop and its delivery truck',
      kw: 'foodtech b2b portal saas design system prototype prototypes high fidelity hi-fi ai agents internal in-house tools customer experience end-to-end solo product ordering order immersive 3d'
    },
    gouv: {
      sector: 'Public sector', sub: 'Redesign of the priority policies page', chip: 'DSFR · RGAA',
      lead: 'Making the government’s priority policies readable, for every citizen.',
      desc: 'Adaptation and redesign of the French government’s priority policies page, to improve accessibility and clarity of information for all citizens.',
      facts: [['Method', 'UX benchmark · Wireframes · DSFR'], ['Goal', 'Accessibility and clarity of information']],
      tags: ['DSFR', 'Accessibility', 'Benchmark'],
      main_alt: 'Gouvernement.fr redesign across several screens',
      float_cap: 'French State Design System', float_alt: 'Sheet from the French State Design System',
      kw: 'government gouvernement public sector state dsfr accessibility a11y rgaa wcag citizens benchmark wireframes redesign clarity information priority policies design system'
    },
    agora: {
      sector: 'B2B marketplace', sub: 'A complete application for Rungis wholesalers', chip: 'Web + mobile',
      /* « e‑invoicing » : trait d'union insécable (U+2011), pour ne jamais couper après « e- » en fin de ligne */
      lead: 'Digitizing the Rungis market: ordering, creditworthiness, e‑invoicing and accounting.',
      desc: 'A complete application for wholesalers at the Rungis market: order taking, creditworthiness, e‑invoicing and accounting. A complex B2B project digitizing business processes.',
      facts: [['Scope', 'Ordering · Creditworthiness · E‑invoicing · Accounting'], ['Platforms', 'Web dashboard · Mobile app']],
      tags: ['Complex B2B', 'Web + mobile', 'Fintech'],
      main_alt: 'AgoraSquare dashboard: cash flow, invoices, activity',
      float_cap: 'Mobile app', float_alt: 'AgoraSquare mobile screens',
      kw: 'agorasquare marketplace b2b complex rungis wholesalers ordering order creditworthiness solvency invoicing e-invoicing accounting dashboard mobile app application business digitization digitisation processes fintech'
    },
    gomind: {
      sector: 'IT services · GreenIT', sub: 'Showcase website redesign and AI mascot', chip: 'Identity · AI',
      lead: 'A modern identity, an AI mascot generator and a design system for B2B acquisition.',
      desc: 'Complete redesign of the showcase website of an IT services company specialized in GreenIT: modern visual identity, AI mascot generator (a hedgehog) and design system, to improve B2B customer acquisition.',
      facts: [['Deliverables', 'Visual identity · AI mascot · Design system'], ['Goal', 'B2B customer acquisition']],
      tags: ['Redesign', 'AI mascot', 'Design system'],
      main_alt: 'GoMind home page with its hedgehog mascot',
      float_cap: 'New website', float_alt: 'New GoMind page, long version',
      kw: 'gomind it services greenit showcase website redesign visual identity mascot ai hedgehog design system acquisition b2b'
    },
    collecte: {
      sector: 'B2B SaaS', sub: 'Collecting payroll and HR documents, from 0 to 100%', chip: 'Discovery · UX writing',
      lead: 'Gathering 26 types of payroll and HR documents from a client, and knowing at any moment what is still missing.',
      desc: 'Discovery and design of document collection for an HR and finance consulting firm whose name stays confidential: eight interviews, then four journeys (sales, client, manager, consultant) to request, upload, check and follow up on a company’s payroll and HR documents.',
      facts: [['Role', 'B2B Product Designer, July to October 2026'], ['Scope', 'Eight interviews · Four journeys · 26 document types']],
      tags: ['B2B SaaS', 'UX writing', 'Discovery'],
      main_alt: 'Mockup excerpt: what is still missing, upload area and tracking of the 26 document types',
      float_cap: 'Targeted reminder', float_alt: 'Reminder dialog for missing documents',
      kw: 'saas b2b hr payroll finance consulting firm social data document collection dsn payslips contributions data collection discovery interviews personas userflows ux writing edge cases handoff consultant client manager sales upload check reminder business tool'
    }
  },

  /* skills: the six « Expertise & Skills » cards (same wording as i18n/en.json) */
  competences: {
    research: { title: 'UX Research', sub: 'Understanding users to create experiences that meet their real needs', out: ['Personas', 'User Testing', 'Analytics'], kw: 'user research personas user testing usability tests analytics interviews verbatims' },
    ui: { title: 'UI Design', sub: 'Creating elegant and intuitive interfaces that delight users', out: ['Figma', 'Design Systems', 'Prototyping'], kw: 'interface ui figma prototype prototyping mockups visual component states' },
    thinking: { title: 'Design Thinking', sub: 'Solving complex problems with creativity and methodology', out: ['Ideation', 'Workshops', 'Validation'], kw: 'design thinking ideation workshops validation framing double diamond' },
    tools: { title: 'Tools & Tech', sub: 'Mastery of modern design tools and technical skills', out: ['Adobe Suite', 'Webflow', 'Notion'], kw: 'tools tech adobe webflow notion figma auto layout technical' },
    mcp: { title: 'MCP Design', sub: 'Designing MCP agents and connected tools, from prototype to deployed product', out: ['AI agents', 'Integrations', 'Workflows'], kw: 'mcp ai artificial intelligence agents integrations workflows automation storybook' },
    ai: { title: 'AI-Ready', sub: 'Design systems your teams and your AI tools read without ambiguity', out: ['Tokens', 'Documentation', 'AI agents'], kw: 'ai ready design system dsfr tokens documentation governance components library agents' }
  },

  /* rail and « Go to » group of the palette */
  sections: {
    accueil: { rail: 'Home', titre: 'Home', sous: 'Top of page, project gallery' },
    marques: { rail: 'Brands', titre: 'Brands', sous: 'Has worked with: 10 organizations' },
    'ai-ready': { rail: 'AI-ready design system', titre: 'AI-ready design system', sous: 'A system your teams and your tools can read' },
    projets: { rail: 'Projects', titre: 'Projects', sous: 'A selection of 5 case studies' },
    expertise: { rail: 'Expertise', titre: 'Expertise & Skills', sous: '6 skills, 6 hands-on scenes' },
    contact: { rail: 'Contact', titre: 'Contact', sous: 'Book a meeting, LinkedIn' }
  },
  rail_projet: 'Project {num}: {t}',

  /* expanded case study (project list) */
  etude: { lire: 'Read the case study', immersif: 'Immersive mode', details: 'Details', detail_region: 'Details: {t}' },

  /* hero gallery */
  galerie: { details_projet: 'Details of the project {t}', carte: '{num} {t}, {s}. Open the details', curseur_details: 'Details', curseur_voir: 'View' },

  /* command palette */
  palette: {
    groupes: { act: 'Actions', proj: 'Projects', skill: 'Skills', client: 'Clients', nav: 'Go to' },
    rdv: { title: 'Book a meeting', sub: 'Calendly · card in the page', kw: 'meeting appointment book call contact calendly slot schedule mission freelance available hire rendez vous rdv', desc: 'A Calendly slot, in a card opened on the page.', rows: [['Link', 'calendly.com/ferrerhugo91300'], ['Status', 'Available · freelance']], act: 'open the booking card' },
    copie: { title: 'Copy the LinkedIn link', sub: 'Clipboard', kw: 'linkedin copy link profile share contact', desc: 'Copies the profile URL to the clipboard.', rows: [['URL', 'linkedin.com/in/hugo-ferrer-…']] },
    linkedin: { title: 'Open LinkedIn', sub: 'Profile · new tab', kw: 'linkedin profile network contact', desc: 'Hugo Ferrer’s full profile.', rows: [['URL', 'linkedin.com/in/hugo-ferrer-…']] },
    immersif: { title: 'Launch immersive mode', sub: 'Délicorner · 3D scene', kw: 'immersive immersif 3d scene mode creative delicorner experience', pvTitle: 'Immersive mode · Délicorner', desc: 'The Délicorner case study, staged: the shop and the delivery in 3D, to explore.', rows: [['Project', 'Délicorner']], act: 'open immersive mode' },
    a11y: { title: 'RGAA / WCAG accessibility', sub: 'Expertise · public sector', kw: 'accessibility accessibilite a11y rgaa wcag disability inclusive citizens compliance', desc: 'Accessibility expert: clear information for everyone. Put into practice on Gouvernement.fr with the DSFR.', rows: [['Standards', 'RGAA · WCAG'], ['Project', 'Gouvernement.fr']], act: 'see the related project' },
    competence: { inclut: 'Includes', raccourci: '{k} from the page' },
    client: { avec_etude: 'Client · case study available', sans_etude: 'Client · brand strip', confiance: 'Has trusted Hugo Ferrer.', voir_etude: 'see the case study', voir_page: 'see in the page', sep: ': ' },
    nav: { section: 'Section', act: 'scroll to' },
    projet: { deplier: 'expand here', ouvrir: 'open the case study' },
    executer: 'run',
    voir_lie: 'see the related project',
    aucun: 'No result for',
    cite: '“{q}”',
    parler: 'Talk about it directly with Hugo',
    compte: ['{n} result', '{n} results'],
    sr_premier: '{n} results. First: {t}.',
    sr_aucun: 'No result.'
  },

  /* inspector */
  insp: {
    entete: 'Inspector · {num}/05',
    cle: '{num} / 05 · {s}',
    parcourir: 'How to explore it', modes: ['2 modes', '3 modes'],
    etude: 'See the case study', etude_txt: 'The classic read, page by page: context, approach, screens and deliverables.',
    immersif: 'Immersive mode', immersif_txt: 'The same project, staged: the shop and the delivery in 3D, to explore rather than read.',
    apercu: 'Preview in place', apercu_txt: 'Expands the sheet in the selection: visuals, role and deliverables, without leaving the page.',
    note: 'Immersive mode exists for Délicorner.', note_btn: 'Inspect it',
    fiche: 'Sheet'
  },

  /* command dock */
  dock: {
    essayez: 'Try',
    puces: [['B2B', 'B2B'], ['Accessibility', 'accessibility'], ['AI', 'AI'], ['Public sector', 'public'], ['Design system', 'design system'], ['Mobile', 'mobile']],
    etat: 'Type a need, the gallery answers',
    meilleur: 'Best match · <b>{t}</b>',
    meilleur_sr: 'Best match: {t}, {s}. Press Enter to open the details.',
    hors: ['{n} result outside projects', '{n} results outside projects'],
    hors_sr: 'No project. {n} other results in the palette, press Enter to open it.',
    aucun: 'No project matches',
    aucun_sr: 'No project matches.',
    autres: ['{n} other result', '{n} other results'],
    chercher: 'Search in the palette',
    exemples: ['A complex B2B project…', 'accessibility', 'a public design system', 'AI', 'mobile app'],
    gabarit: 'Try “{q}”',
    debut: 'Try “',
    repli: 'Try “accessibility”'
  },

  /* transient messages */
  toasts: { lien_copie: 'LinkedIn link copied', presse: 'clipboard', copie_ko: 'Copy failed: ', marques: 'has worked with' },

  /* search (dock and palette): ignored words and group keywords */
  recherche: {
    stop: 'show me a an the of for and on with in to at my your his her its how does do hugo handle what which is are i you it see can project projects montre moi un une le la les de des du',
    kw_projet: 'project projects case study',
    kw_competence: 'skill skills',
    kw_client: 'client clients brands brand reference',
    kw_nav: 'go section page'
  }
};
