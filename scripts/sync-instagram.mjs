/**
 * Recupere les dernieres publications Instagram de Patrimaniac,
 * telecharge les images en local et ecrit data/instagram.json.
 *
 * Cette version n'utilise aucune apostrophe inversee, afin de resister
 * au copier-coller entre applications.
 *
 * Variables d'environnement attendues :
 *   IG_TOKEN  - jeton d'acces longue duree (obligatoire)
 *   IG_LIMIT  - nombre de publications a recuperer (defaut : 8)
 */

import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const TOKEN = process.env.IG_TOKEN;
const LIMIT = Number(process.env.IG_LIMIT || 8);
const DOSSIER_IMAGES = 'public/instagram-media';
const FICHIER_DONNEES = 'data/instagram.json';

if (!TOKEN) {
  console.error('IG_TOKEN absent. Ajoutez-le dans les secrets du depot.');
  process.exit(1);
}

const CHAMPS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

async function recupererPublications() {
  const url = 'https://graph.instagram.com/me/media?fields=' + CHAMPS +
              '&limit=' + LIMIT + '&access_token=' + TOKEN;
  const r = await fetch(url);
  const j = await r.json();
  if (!r.ok || j.error) {
    throw new Error('API Instagram : ' + JSON.stringify(j.error || j));
  }
  return j.data || [];
}

async function telechargerImage(source, destination) {
  const r = await fetch(source);
  if (!r.ok) throw new Error('Telechargement impossible (' + r.status + ')');
  const buffer = Buffer.from(await r.arrayBuffer());
  await writeFile(destination, buffer);
}

async function main() {
  await mkdir(DOSSIER_IMAGES, { recursive: true });
  await mkdir('data', { recursive: true });

  const publications = await recupererPublications();
  console.log(publications.length + ' publication(s) recuperee(s).');

  const resultat = [];
  const fichiersGardes = new Set();

  for (const p of publications) {
    // Une video n'a pas de media_url affichable en image : on prend sa vignette.
    const source = p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url;
    if (!source) continue;

    const nomFichier = p.id + '.jpg';
    const chemin = join(DOSSIER_IMAGES, nomFichier);

    try {
      await telechargerImage(source, chemin);
      fichiersGardes.add(nomFichier);
    } catch (e) {
      console.warn('Image ignoree pour ' + p.id + ' : ' + e.message);
      continue;
    }

    resultat.push({
      id: p.id,
      legende: (p.caption || '').split('\n')[0].slice(0, 200),
      permalien: p.permalink,
      image: DOSSIER_IMAGES + '/' + nomFichier,
      type: p.media_type,
      date: p.timestamp
    });
  }

  // Menage : on supprime les images des publications qui ne sont plus affichees.
  for (const f of await readdir(DOSSIER_IMAGES)) {
    if (f.endsWith('.jpg') && !fichiersGardes.has(f)) {
      await unlink(join(DOSSIER_IMAGES, f));
      console.log('Image obsolete supprimee : ' + f);
    }
  }

  await writeFile(FICHIER_DONNEES, JSON.stringify(resultat, null, 2) + '\n');
  console.log(FICHIER_DONNEES + ' mis a jour (' + resultat.length + ' entrees).');
}

main().catch(function (e) {
  console.error(e.message);
  process.exit(1);
});
