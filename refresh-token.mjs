/**
 * Renouvelle le jeton d'accès Instagram longue durée.
 *
 * Les jetons durent environ 60 jours et ne se renouvellent pas seuls.
 * Ce script demande un nouveau jeton et l'écrit dans la sortie de
 * l'action GitHub, qui se charge ensuite de mettre à jour le secret.
 *
 * Un jeton doit avoir au moins 24 heures d'existence pour être renouvelable.
 */

import { appendFile } from 'node:fs/promises';

const TOKEN = process.env.IG_TOKEN;
if (!TOKEN) {
  console.error('IG_TOKEN absent.');
  process.exit(1);
}

const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${TOKEN}`;
const r = await fetch(url);
const j = await r.json();

if (!r.ok || j.error || !j.access_token) {
  console.error(`Renouvellement impossible : ${JSON.stringify(j.error || j)}`);
  process.exit(1);
}

const jours = Math.round((j.expires_in || 0) / 86400);
console.log(`Nouveau jeton obtenu, valable environ ${jours} jours.`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `nouveau_jeton=${j.access_token}\n`);
}
