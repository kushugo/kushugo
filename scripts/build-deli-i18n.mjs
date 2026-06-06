#!/usr/bin/env node
/**
 * Extracts Délicorner i18n from delicorner-preview.html inline dict,
 * merges EN from gyjghbkjnl/delicorner.en.json + supplement, writes i18n/delicorner.{fr,en}.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'delico projet/delicorner-preview.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/window\.__i18n=\{_d:(\{[\s\S]*?\}),t:function/);
if (!match) throw new Error('inline __i18n dict not found in delicorner-preview.html');

const frInline = JSON.parse(match[1]);
const enBase = JSON.parse(fs.readFileSync(path.join(root, 'gyjghbkjnl/delicorner.en.json'), 'utf8'));
const supplementPath = path.join(root, 'i18n/delicorner-en-supplement.json');
const supplement = fs.existsSync(supplementPath)
  ? JSON.parse(fs.readFileSync(supplementPath, 'utf8'))
  : {};

const extraFr = {
  'deli.imm.cta.t': 'Vis le projet en mode immersif',
  'deli.imm.cta.b': 'Une livraison interactive : clique les colis pour explorer chaque étape.',
  'deli.imm.cta.go': 'Lancer ›',
};

const fr = { ...frInline, ...extraFr };
const en = { ...enBase, ...supplement };

const missingEn = Object.keys(fr).filter((k) => !en[k]);
if (missingEn.length) {
  console.error(`Missing ${missingEn.length} EN keys — add to i18n/delicorner-en-supplement.json`);
  console.error(missingEn.slice(0, 10).join('\n'));
  process.exit(1);
}

const outDir = path.join(root, 'i18n');
fs.writeFileSync(path.join(outDir, 'delicorner.fr.json'), JSON.stringify(fr, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'delicorner.en.json'), JSON.stringify(en, null, 2) + '\n');
console.log(`Wrote delicorner.fr.json (${Object.keys(fr).length} keys)`);
console.log(`Wrote delicorner.en.json (${Object.keys(en).length} keys)`);
