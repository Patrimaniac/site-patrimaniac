/**
 * Recupere les formulaires publies par Patrimaniac sur HelloAsso
 * (adhesions, billetteries d'evenements, campagnes de dons)
 * et ecrit data/helloasso.json.
 *
 * Ecrit sans apostrophe inversee, pour resister au copier-coller.
 *
 * Variables d'environnement attendues, a definir dans les secrets du depot :
 *   HA_CLIENT_ID     - identifiant obtenu dans Mon Compte > Integration et API
 *   HA_CLIENT_SECRET - cle secrete obtenue au meme endroit
 *   HA_SLUG          - nom de l'association tel qu'il apparait dans l'adresse
 *                      HelloAsso, par exemple patrimaniac
 */

import { mkdir, writeFile } from 'node:fs/promises';

const CLIENT_ID = process.env.HA_CLIENT_ID;
const CLIENT_SECRET = process.env.HA_CLIENT_SECRET;
const SLUG = process.env.HA_SLUG;
const FICHIER = 'data/helloasso.json';

if (!CLIENT_ID || !CLIENT_SECRET || !SLUG) {
  console.error('HA_CLIENT_ID, HA_CLIENT_SECRET ou HA_SLUG absent des secrets du depot.');
  process.exit(1);
}

async function obtenirJeton() {
  const corps = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
  const r = await fetch('https://api.helloasso.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: corps
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) {
    throw new Error('Authentification HelloAsso refusee : ' + JSON.stringify(j));
  }
  return j.access_token;
}

async function recupererFormulaires(jeton) {
  const url = 'https://api.helloasso.com/v5/organizations/' + SLUG +
              '/forms?pageSize=100&states=Public';
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + jeton } });
  const j = await r.json();
  if (!r.ok) {
    throw new Error('API HelloAsso : ' + JSON.stringify(j));
  }
  return j.data || [];
}

// Les descriptions HelloAsso peuvent contenir du balisage : on le retire
// et on conserve les retours a la ligne, utiles pour lister des avantages.
function nettoyer(texte) {
  return String(texte || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&eacute;/g, 'e\u0301').replace(/&egrave;/g, 'e\u0300')
    .replace(/&agrave;/g, 'a\u0300').replace(/&ccedil;/g, 'c\u0327')
    .replace(/&ecirc;/g, 'e\u0302').replace(/&ocirc;/g, 'o\u0302')
    .replace(/&hellip;/g, '\u2026').replace(/&rsquo;/g, "'")
    .normalize('NFC')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function normaliser(f) {
  const banniere = f.banner || {};
  return {
    titre: f.title || '',
    type: f.formType || '',
    url: f.url || '',
    debut: f.startDate || null,
    fin: f.endDate || null,
    image: banniere.publicUrl || null,
    description: nettoyer(f.description)
  };
}

async function main() {
  await mkdir('data', { recursive: true });

  const jeton = await obtenirJeton();
  const formulaires = (await recupererFormulaires(jeton)).map(normaliser);

  console.log(formulaires.length + ' formulaire(s) recupere(s).');
  for (const f of formulaires) {
    console.log('  - [' + f.type + '] ' + f.titre);
  }

  const resultat = {
    organisation: 'https://www.helloasso.com/associations/' + SLUG,
    misAJour: new Date().toISOString(),
    formulaires: formulaires
  };

  await writeFile(FICHIER, JSON.stringify(resultat, null, 2) + '\n');
  console.log(FICHIER + ' mis a jour.');
}

main().catch(function (e) {
  console.error(e.message);
  process.exit(1);
});
