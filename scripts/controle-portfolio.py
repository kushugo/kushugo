#!/usr/bin/env python3
"""Contrôle du portfolio avant et après chaque déploiement (résolution du board du 16/11, décisions d'Hugo du 17-18/11).

Usage : python3 scripts/controle-portfolio.py <adresse de base>
  ex.   python3 scripts/controle-portfolio.py http://localhost:8765
        python3 scripts/controle-portfolio.py https://www.designeruxuihugo.com

Lit les fichiers tels que le serveur les sert (HTML, dictionnaires i18n, scripts chargés), donc la même
commande vaut pour la version locale et pour la version publiée. Code de sortie 0 seulement si tout passe.
"""
import html as H
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765').rstrip('/')
TITRE = 'Product designer B2B · Du MVP au produit, design systems AI-ready'
PAGES = {  # page publiée -> (data-page, dictionnaire de page)
    '/': ('home', None),
    '/delico%20projet/delicorner-preview.html': ('delicorner', 'delicorner'),
    '/gouvernement-detail.html': ('gouvernement', 'gouvernement'),
    '/agorasquare-good.html': ('agora', 'agora'),
    '/data-collection.html': ('data-collection', 'data-collection'),
}
ETUDES = ['/delico%20projet/delicorner-preview.html', '/gouvernement-detail.html', '/agorasquare-good.html', '/data-collection.html']
NAV_ATTENDUE = ['Accueil', 'Délicorner', 'Gouvernement.fr', 'AgoraSquare', 'Data Collection']
CHIFFRES_GOUV = re.compile(r'\d\s*(?:%|pts\b)|AA\+|rebond|bounce rate', re.I)

resultats = []


def ok(nom, cond, detail=''):
    resultats.append((bool(cond), nom, detail))


def get(path, binaire=False):
    url = BASE + path + ('&' if '?' in path else '?') + 'controle=' + str(int(time.time()))
    req = urllib.request.Request(url, headers={'User-Agent': 'controle-portfolio', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
        return (r.status, r.geturl(), data if binaire else data.decode('utf-8'))


def texte(fragment):
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', fragment))).strip()


def mots(t):
    return re.findall(r'[\w\-]+', t.lower())


def contient_mots(t, cible):
    """Le titre voté mot pour mot (ponctuation et retours à la ligne ignorés)."""
    a, b = ' '.join(mots(t)), ' '.join(mots(cible))
    return b in a


def meta(src, attr, name):
    m = re.search(r'<meta\s+' + attr + r'="' + re.escape(name) + r'"\s+content="([^"]*)"', src)
    return H.unescape(m.group(1)) if m else ''


# ---------- chargement ----------
sources, dicts, scripts = {}, {}, {}
for p in PAGES:
    st, _, sources[p] = get(p)
    ok(f'{p} répond 200', st == 200, str(st))
for lang in ('fr', 'en'):
    dicts[lang] = json.loads(get(f'/i18n/{lang}.json')[2])
    for _, (dp, pd) in PAGES.items():
        if pd:
            dicts[f'{pd}.{lang}'] = json.loads(get(f'/i18n/{pd}.{lang}.json')[2])
dicts['delicorner-en-supplement'] = json.loads(get('/i18n/delicorner-en-supplement.json')[2])
for p, src in sources.items():
    base = p.rsplit('/', 1)[0] + '/'
    for s in re.findall(r'<script[^>]+src="([^"]+)"', src):
        if s.startswith('http') or '/_vercel/' in s:
            continue
        u = urllib.parse.urljoin(base, s.split('?')[0])
        if u not in scripts:
            try:
                scripts[u] = get(u)[2]
            except urllib.error.HTTPError as e:
                ok(f'script {u} chargé', False, str(e.code))


def dict_page(lang, dp, pd):
    d = dict(dicts[lang])
    if pd:
        d.update(dicts[f'{pd}.{lang}'])
    return d


# ---------- 1. Titre voté sur chaque page publiée ----------
for p, (dp, pd) in PAGES.items():
    src = sources[p]
    t = texte(re.search(r'<title>(.*?)</title>', src, re.S).group(1))
    d = dict_page('fr', dp, pd)
    h1 = re.search(r'<h1\b[^>]*>(.*?)</h1>', src, re.S)
    h1_dyn = ''
    m = re.search(r'<h1\b[^>]*data-i18n="([^"]+)"', src)
    if m and m.group(1) in d:
        h1_dyn = texte(d[m.group(1)])
    champs = {
        'title': t,
        'title appliqué par i18n.js (FR)': d.get(f'meta.title.{dp}', t),
        'meta description': meta(src, 'name', 'description'),
        'description appliquée par i18n.js (FR)': d.get(f'meta.desc.{dp}', meta(src, 'name', 'description')),
        'og:title': meta(src, 'property', 'og:title'),
        'og:description': meta(src, 'property', 'og:description'),
        'H1 (HTML)': texte(h1.group(1)) if h1 else '',
    }
    if h1_dyn:
        champs['H1 (après traduction FR)'] = h1_dyn
    for nom, val in champs.items():
        ok(f'Titre voté · {p} · {nom}', contient_mots(val, TITRE), val[:110])

# ---------- 2. Tirets cadratins, « AA+ » ----------
tout = {**{p: s for p, s in sources.items()}, **{'/i18n/' + k + '.json': json.dumps(v, ensure_ascii=False) for k, v in dicts.items()}, **scripts}
for extra in ('/llms.txt', '/sitemap.xml', '/404.html'):
    tout[extra] = get(extra)[2]
n_tiret = {k: v.count('—') for k, v in tout.items() if v.count('—')}
ok('0 tiret cadratin (U+2014) (pages, dictionnaires, scripts, llms.txt, sitemap, 404)', not n_tiret, json.dumps(n_tiret, ensure_ascii=False) if n_tiret else f'{len(tout)} fichiers lus')
n_aa = {k: v.count('AA+') for k, v in tout.items() if v.count('AA+')}
ok('0 « AA+ »', not n_aa, json.dumps(n_aa, ensure_ascii=False) if n_aa else '')

# ---------- 3. GoMind dépubliée ----------
for p, src in sources.items():
    navs = ' '.join(re.findall(r'<header\b.*?</header>|<nav\b.*?</nav>', src, re.S))
    ok(f'GoMind absente des navigations · {p}', 'gomind' not in navs.lower())
    ok(f'Aucun lien vers la page GoMind · {p}', 'gomind-good' not in src)
for u, s in scripts.items():
    ok(f'Aucun lien vers la page GoMind dans {u}', not re.search(r"(?:case|href)\s*[:=]\s*['\"][^'\"]*gomind-good", s))
ok('GoMind absente du sitemap', 'gomind' not in tout['/sitemap.xml'].lower())
ok('GoMind absente de llms.txt', 'gomind' not in tout['/llms.txt'].lower())
try:
    st, fin, page = get('/gomind-good.html')
    ok('/gomind-good.html redirige vers l’accueil', 'gomind-good' not in fin and 'data-page="gomind"' not in page, fin)
except urllib.error.HTTPError as e:
    ok('/gomind-good.html dépubliée', e.code in (301, 302, 307, 308, 404, 410), str(e.code))

# ---------- 4. Navigation identique sur les études de cas ----------
for p in ETUDES:
    hdr = re.search(r'<ul class="nav-links".*?</ul>', sources[p], re.S)
    liens = [texte(x) for x in re.findall(r'<li>\s*<a\b[^>]*>(.*?)</a>\s*</li>', hdr.group(0) if hdr else '', re.S)]
    ok(f'Navigation identique · {p}', liens == NAV_ATTENDUE, ' | '.join(liens))

# ---------- 5. Chiffres ----------
gsrc = sources['/gouvernement-detail.html']
gtxt = texte(re.sub(r'<(script|style)\b.*?</\1>', ' ', gsrc, flags=re.S))
trouve = CHIFFRES_GOUV.findall(gtxt)
ok('Gouvernement.fr : aucun chiffre (%, pts, AA+, rebond) dans la page', not trouve, ', '.join(trouve))
for lang in ('fr', 'en'):
    vals = ' '.join(v for k, v in {**dicts[lang], **dicts[f'gouvernement.{lang}']}.items() if k.startswith(('gouv.', 'gp.', 'meta.title.gouvernement', 'meta.desc.gouvernement')) and isinstance(v, str))
    trouve = CHIFFRES_GOUV.findall(texte(vals))
    ok(f'Gouvernement.fr : aucun chiffre dans le dictionnaire {lang}', not trouve, ', '.join(trouve))
ok('Gouvernement.fr : aucun graphique de chiffres', 'kpiChart' not in gsrc.split('<script')[0] and '<canvas' not in gsrc)
ok('Gouvernement.fr : adresse en ligne donnée', 'https://www.info.gouv.fr/' in gsrc)

dsrc = sources['/delico%20projet/delicorner-preview.html']
dfr = json.dumps(dict_page('fr', 'delicorner', 'delicorner'), ensure_ascii=False)
den = json.dumps(dict_page('en', 'delicorner', 'delicorner'), ensure_ascii=False) + json.dumps(dicts['delicorner-en-supplement'], ensure_ascii=False)
ok('Délicorner : plus de « 1 000× »', not re.search(r'1[\s  ]?000\s*[×x]', dsrc + dfr + den))
ok('Délicorner : « 5 à 6 h (parfois la semaine suivante) à environ 20 s »', 'parfois la semaine suivante' in dsrc and 'parfois la semaine suivante' in dfr, '')
ok('Délicorner : 171 k€ présenté comme projection sur les données de l’entreprise', "projection calculée sur les données de l" in dsrc.replace('’', "'") and "projection calculée sur les données de l" in dfr.replace('’', "'"))
ok('Délicorner : prénom « Stéphane » masqué', 'Stéphane' not in dsrc + dfr + den)
ok('Délicorner : noms d’entreprises gardés (Hellowork, NVIDIA, Databricks)', all(n in dfr for n in ('Hellowork', 'NVIDIA', 'Databricks')))

asrc = sources['/agorasquare-good.html']
afr = json.dumps(dicts['agora.fr'], ensure_ascii=False)
ok('AgoraSquare : « temps moyens, variables selon l’affluence »', "variables selon l'affluence" in afr and "variables selon l'affluence" in asrc)
ok('AgoraSquare : 92 % « selon la direction d’AgoraSquare »', "selon la direction d'AgoraSquare" in afr and "selon la direction d'AgoraSquare" in asrc)
ok('AgoraSquare : impayés et délai en constat des dirigeants', afr.count('selon les dirigeants des grossistes équipés') >= 3)
ok('AgoraSquare : +70 % remplacé par « 3 h à 0,8 h » par jour', '+70' not in afr + asrc and 'productivité' not in texte(afr) and '3&nbsp;h à 0,8&nbsp;h' in asrc)
aen = json.dumps(dicts['agora.en'], ensure_ascii=False)
atxt = texte(afr + aen + re.sub(r'<(script|style|svg)\b.*?</\1>', ' ', asrc, flags=re.S))
ok('AgoraSquare : -60 % absent (aucun « 60 % »)', not re.search(r'60\s?%', atxt), ', '.join(re.findall(r'.{30}60\s?%.{10}', atxt)))
ok('AgoraSquare : « 40 % à 6 % » (erreurs de facturation) absent', not re.search(r'40\s?%', atxt) and not re.search(r'(?<![\d,.])6\s?%', atxt))
ok('AgoraSquare : « 15 000 € » absent', not re.search(r'15[\s,.]?000', atxt))
ok('AgoraSquare : aucun autre résultat non sourcé (42 %, 95 %, +25, « divisée par trois »)', not re.search(r'42\s?%|95\s?%|\+25\b|divis[ée]+ par trois|divided by three', atxt))
anciens = [k for lg in ('fr', 'en') for k in dicts[lg] if k.startswith('agora.')]
ok('Dictionnaires communs : plus d’anciennes clés « agora.* » (anciens chiffres)', not anciens, str(len(anciens)))
ok('llms.txt : plus de « 3M+ » ni de « 84% » ni de « 15+ »', not re.search(r'3M\+|84\s?%|15\+', tout['/llms.txt']))

zeros = []
for p, src in sources.items():
    for m in re.finditer(r'<(\w+)\b[^>]*\bdata-count="([^"]+)"[^>]*>([^<]*)<', src):
        if m.group(2) != '0' and re.fullmatch(r'\s*0\s*%?\s*', m.group(3)):
            zeros.append(f'{p}:{m.group(2)}')
ok('Chiffres écrits en dur (aucun compteur à 0 sans JavaScript)', not zeros, ', '.join(zeros[:12]))

# ---------- 6. Spartes, contact ----------
ok('Spartes reste sur l’accueil (logo)', 'logos-blancs/spartes.png' in sources['/'])
for p, src in sources.items():
    corps = re.sub(r'<(script|style)\b.*?</\1>', ' ', src, flags=re.S)
    boutons = [texte(m) for m in re.findall(r'<a\b[^>]*\bdata-rdv\b[^>]*>(.*?)</a>', corps, re.S)]
    ok(f'Aucun bouton CDI · {p}', not any('cdi' in b.lower() for b in boutons), ' | '.join(boutons))
    principaux = [b for b in boutons if b.startswith("Parler d'une mission") or b.startswith('Parler d’une mission')]
    ok(f'Bouton principal « Parler d’une mission » · {p}', principaux, ' | '.join(boutons))

# ---------- 7. Positionnement dans les données structurées, llms.txt, images ----------
def blocs_jsonld(src):
    return [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', src, re.S)]


def parcours(o, cle=''):
    """Génère (clé, valeur, type du parent) pour chaque valeur texte d'un JSON-LD."""
    if isinstance(o, dict):
        for k, v in o.items():
            if isinstance(v, str):
                yield k, v, o.get('@type', '')
            else:
                yield from parcours(v, k)
    elif isinstance(o, list):
        for v in o:
            if isinstance(v, str):
                yield cle, v, ''
            else:
                yield from parcours(v, cle)


PAGES_JSONLD = ['/', '/agorasquare-good.html', '/gouvernement-detail.html', '/data-collection.html', '/delico%20projet/delicorner-preview.html']
anciens_jsonld, images_jsonld = [], {}
for p in PAGES_JSONLD:
    try:
        blocs = blocs_jsonld(sources[p])
    except ValueError as e:
        ok(f'JSON-LD valide · {p}', False, str(e))
        continue
    for b in blocs:
        for cle, val, typ in parcours(b):
            if cle in ('jobTitle', 'description', 'name', 'headline', 'caption') and 'UX/UI Designer' in val:
                anciens_jsonld.append(f'{p}:{cle}')
            if cle in ('image', 'logo') or (cle == 'url' and typ == 'ImageObject'):
                if val.startswith('http'):
                    images_jsonld.setdefault(val, p)
ok('JSON-LD : aucun « UX/UI Designer » dans jobTitle, description ou name', not anciens_jsonld, ', '.join(anciens_jsonld))
llms = tout['/llms.txt']
ok('llms.txt : « B2B product designer » et « Délicorner » présents', 'B2B product designer' in llms and bool(re.search(r'D[ée]licorner', llms)))
ok('llms.txt : plus de « UX/UI Designer »', 'UX/UI Designer' not in llms)
ko_img = []
for u, p in images_jsonld.items():
    try:
        chemin = urllib.parse.urlparse(u).path
        st = get(chemin, binaire=True)[0]
    except urllib.error.HTTPError as e:
        st = e.code
    if st != 200:
        ko_img.append(f'{u} ({st})')
ok(f'JSON-LD : les {len(images_jsonld)} images citées répondent 200', not ko_img, ', '.join(ko_img))

# ---------- rapport ----------
nb_ko = sum(1 for r in resultats if not r[0])
print(f'Contrôle du portfolio · {BASE} · {time.strftime("%d/%m/%Y %H:%M")}')
print(f'{len(resultats) - nb_ko} contrôles passés, {nb_ko} en échec\n')
for good, nom, detail in resultats:
    print(('OK  ' if good else 'KO  ') + nom + (f'  [{detail}]' if detail and not good else ''))
sys.exit(1 if nb_ko else 0)
