# Site de l'association Patrimaniac

Site statique, sans base de données ni serveur à administrer. Hébergement gratuit, mises à jour depuis une interface web.

## Ce que contient le dossier

| Fichier ou dossier | À quoi ça sert |
|---|---|
| `index.html` | Le site lui-même |
| `assets/site.js` | Menu, animation de l'œil, affichage de l'agenda et du flux Instagram |
| `data/evenements.json` | **Vos événements.** C'est le seul fichier à modifier au quotidien |
| `data/instagram.json` | Rempli automatiquement, ne pas modifier à la main |
| `public/instagram-media/` | Images Instagram téléchargées automatiquement |
| `scripts/` | Les deux scripts de synchronisation Meta |
| `.github/workflows/instagram.yml` | L'automatisation quotidienne |
| `.pages.yml` | Configuration de l'interface d'édition |

---

## 1. Mettre le site en ligne

1. Créez un compte GitHub **au nom de l'association**, avec l'adresse `patrimaniac.contact@gmail.com`.
2. Créez un dépôt nommé `site-patrimaniac`, en **public** (nécessaire pour que les actions automatiques restent gratuites sans limite).
3. Déposez tout le contenu de ce dossier à la racine du dépôt (bouton *Add file → Upload files*, glissez-déposez).
4. Créez un compte sur [Cloudflare Pages](https://pages.cloudflare.com) ou [Netlify](https://netlify.com), connectez-le à GitHub et sélectionnez le dépôt.
5. Réglages de construction : **aucune commande**, dossier de publication `/` (la racine). Le site n'a besoin d'aucune compilation.

Le site est en ligne en deux minutes, à une adresse du type `site-patrimaniac.pages.dev`. Chaque modification déposée sur GitHub est publiée automatiquement.

---

## 2. Ajouter un événement

### Solution immédiate, sans rien installer

Sur GitHub, ouvrez `data/evenements.json`, cliquez sur le crayon, ajoutez un bloc, puis *Commit changes*. Le site se met à jour tout seul.

```json
{
  "titre": "Visite du site gallo-romain",
  "date": "2026-09-12",
  "heure": "14h",
  "lieu": "Parking de la mairie",
  "info": "Gratuit, sur inscription",
  "inscription": "mailto:patrimaniac.contact@gmail.com?subject=Inscription"
}
```

Seuls `titre` et `date` sont obligatoires. La date s'écrit **année-mois-jour**. Les événements passés basculent d'eux-mêmes dans les archives : rien à supprimer.

Attention à la ponctuation JSON : une virgule entre chaque bloc, aucune après le dernier.

### Solution confortable, une fois le site en ligne

Connectez le dépôt sur [pagescms.org](https://pagescms.org) (gratuit). Le fichier `.pages.yml` est déjà configuré : vous obtenez un formulaire avec des champs, sans code ni ponctuation à surveiller.

---

## 3. Brancher le flux Instagram

À faire une seule fois, après la mise en ligne.

1. **Compte professionnel.** Instagram → Réglages → Type de compte → *Créateur*. Aucune page Facebook n'est requise.
2. **Application Meta.** Sur [developers.facebook.com](https://developers.facebook.com), créez une application avec le produit *Instagram*. Laissez-la en mode développement : lire son propre compte ne demande aucune validation de Meta.
3. **Compte testeur.** Ajoutez `@patrimaniac` comme testeur dans l'application, puis acceptez l'invitation depuis [instagram.com/accounts/manage_access](https://www.instagram.com/accounts/manage_access).
4. **Jeton longue durée.** Générez-le depuis le tableau de bord de l'application.
5. **Secrets GitHub.** Dépôt → *Settings → Secrets and variables → Actions → New repository secret* :
   - `IG_TOKEN` : le jeton obtenu à l'étape 4.
   - `GH_PAT` *(recommandé)* : un jeton GitHub personnel avec la permission *Secrets : write* sur ce dépôt. Il permet à l'automatisation de renouveler `IG_TOKEN` toute seule.
6. **Premier essai.** Onglet *Actions* → *Synchronisation Instagram* → *Run workflow*.

Ensuite, la synchronisation tourne chaque matin sans intervention.

> **Sans `GH_PAT`**, tout fonctionne aussi, mais le jeton expire au bout de 60 jours et devra être remplacé à la main. L'onglet *Actions* affichera une erreur le jour venu.

---

## 4. Reste à faire

- [ ] Rédiger le paragraphe sur la création de l'association (section « L'association »)
- [ ] Détailler les dispositifs d'accessibilité réellement proposés
- [ ] Remplacer le lien Facebook de partage par l'adresse permanente de la page
- [ ] Rédiger les mentions légales et la politique de confidentialité
- [ ] Brancher le formulaire de contact sur un service d'envoi (Web3Forms ou Formspree)
- [ ] Retirer le bandeau « Ébauche de travail » en haut de `index.html`

## Bon à savoir

Ouvrir `index.html` par double-clic depuis l'ordinateur affiche le site sans l'agenda : le navigateur refuse alors de lire les fichiers de données pour des raisons de sécurité. C'est normal, et cela disparaît dès que le site est hébergé.
