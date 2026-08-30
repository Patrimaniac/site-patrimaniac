/* Patrimaniac - comportements du site.
   Le contenu vient des fichiers du dossier data/.
   Ecrit sans apostrophe inversee, pour resister au copier-coller. */

/* ---------- Menu mobile ---------- */
var burger = document.getElementById('burger');
var nav = document.getElementById('nav');
if (burger && nav) {
  burger.addEventListener('click', function () {
    var ouvert = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', ouvert);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') nav.classList.remove('open');
  });
}

/* ---------- L'oeil suit le curseur ---------- */
var reduire = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduire) {
  var disque = document.getElementById('eyeDisc');
  var pupille = document.getElementById('pupil');
  if (disque && pupille) {
    window.addEventListener('mousemove', function (e) {
      var r = disque.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var a = Math.atan2(e.clientY - cy, e.clientX - cx);
      var d = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy) / 22, 9);
      pupille.style.transform = 'translate(' + (Math.cos(a) * d) + 'px, ' + (Math.sin(a) * d) + 'px)';
    }, { passive: true });
  }
}

/* ---------- Outils ---------- */
var MOIS = ['janv', 'fevr', 'mars', 'avr', 'mai', 'juin',
            'juil', 'aout', 'sept', 'oct', 'nov', 'dec'];

function proteger(t) {
  return String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function lireJson(chemin) {
  var r = await fetch(chemin, { cache: 'no-store' });
  if (!r.ok) throw new Error(String(r.status));
  return await r.json();
}

/* ---------- Agenda ---------- */
function carteEvenement(ev) {
  var d = new Date(ev.date + 'T00:00:00');
  var details = [ev.heure, ev.lieu, ev.info].filter(Boolean).map(proteger).join(' &middot; ');
  var lien = ev.inscription
    ? '<a class="btn" href="' + proteger(ev.inscription) + '"' +
      (ev.externe ? ' target="_blank" rel="noopener noreferrer"' : '') + '>S\'inscrire</a>'
    : '<a class="btn" href="#contact">Nous ecrire</a>';

  return '<div class="event">' +
    '<div class="date"><b>' + String(d.getDate()).padStart(2, '0') + '</b>' +
    '<span>' + MOIS[d.getMonth()] + '</span></div>' +
    '<div><h3>' + proteger(ev.titre) + '</h3>' +
    (details ? '<p>' + details + '</p>' : '') + '</div>' +
    lien + '</div>';
}

// Certains formulaires sont crees en billetterie alors qu'ils servent
// d'adhesion ou de collecte. On se fie alors au titre plutot qu'au type.
var MOTS_SOUTIEN = /adh[eé]sion|cotisation|adherer|adh[eé]rer|don\b|dons\b|soutien|soutenir|membre|m[eé]c[eé]nat|boutique/i;

function estSoutien(f) {
  if (f.type && f.type !== 'Event') return true;
  return MOTS_SOUTIEN.test(f.titre || '');
}

// Transforme une billetterie HelloAsso en evenement d'agenda.
function evenementDepuisHelloAsso(f) {
  if (estSoutien(f) || !f.debut) return null;
  var d = new Date(f.debut);
  if (isNaN(d)) return null;
  var heure = d.getHours() + 'h' + (d.getMinutes() ? String(d.getMinutes()).padStart(2, '0') : '');
  return {
    titre: f.titre,
    date: d.toISOString().slice(0, 10),
    heure: heure === '0h' ? '' : heure,
    lieu: '',
    info: 'Billetterie en ligne',
    inscription: f.url,
    externe: true
  };
}

async function chargerAgenda() {
  var zone = document.getElementById('agenda-liste');
  if (!zone) return;

  var tous = [];

  try {
    var manuels = await lireJson('data/evenements.json');
    if (Array.isArray(manuels)) tous = tous.concat(manuels);
  } catch (e) {
    console.warn('Evenements manuels indisponibles :', e.message);
  }

  try {
    var ha = await lireJson('data/helloasso.json');
    var liste = (ha && ha.formulaires) || [];
    for (var i = 0; i < liste.length; i++) {
      var ev = evenementDepuisHelloAsso(liste[i]);
      if (ev) tous.push(ev);
    }
  } catch (e) {
    console.warn('HelloAsso indisponible :', e.message);
  }

  if (!tous.length) {
    zone.innerHTML = '<p class="agenda-note">Aucun rendez-vous programme pour le moment. ' +
      'Ecrivez-nous pour etre prevenu des prochaines dates.</p>';
    return;
  }

  var aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  var avenir = tous.filter(function (e) { return new Date(e.date + 'T00:00:00') >= aujourdhui; })
                   .sort(function (a, b) { return a.date.localeCompare(b.date); });
  var passes = tous.filter(function (e) { return new Date(e.date + 'T00:00:00') < aujourdhui; })
                   .sort(function (a, b) { return b.date.localeCompare(a.date); })
                   .slice(0, 6);

  zone.innerHTML = avenir.length
    ? avenir.map(carteEvenement).join('')
    : '<p class="agenda-note">Aucun rendez-vous programme pour le moment. ' +
      'Ecrivez-nous pour etre prevenu des prochaines dates.</p>';

  if (passes.length) {
    document.getElementById('agenda-passes').innerHTML = passes.map(carteEvenement).join('');
    document.getElementById('agenda-archives').hidden = false;
  }
}

/* ---------- Flux Instagram ---------- */
async function chargerInstagram() {
  var grille = document.getElementById('ig-grid');
  var note = document.getElementById('ig-note');
  if (!grille) return;

  try {
    var posts = await lireJson('data/instagram.json');
    if (!Array.isArray(posts) || !posts.length) return;

    grille.innerHTML = posts.slice(0, 8).map(function (p) {
      var legende = proteger((p.legende || 'Publication Instagram de Patrimaniac').slice(0, 120));
      return '<div class="ig-cell"><a href="' + proteger(p.permalien) + '" ' +
        'target="_blank" rel="noopener noreferrer">' +
        '<img src="' + proteger(p.image) + '" alt="' + legende + '" loading="lazy"></a></div>';
    }).join('');

    if (note) note.remove();
  } catch (e) {
    console.warn('Instagram :', e.message);
  }
}

/* ---------- HelloAsso : adherer et soutenir ---------- */
var LIBELLES = {
  Membership: 'Adherer',
  Donation: 'Faire un don',
  Crowdfunding: 'Soutenir le projet',
  Shop: 'Voir la boutique',
  Event: 'Prendre une place',
  PaymentForm: 'Participer'
};

async function chargerHelloAsso() {
  var zone = document.getElementById('soutenir-liste');
  var lienOrga = document.getElementById('lien-helloasso');
  if (!zone) return;

  try {
    var ha = await lireJson('data/helloasso.json');
    var formulaires = (ha && ha.formulaires) || [];

    if (lienOrga && ha.organisation) lienOrga.href = ha.organisation;

    // Les vraies billetteries d'evenements sont deja affichees dans l'agenda.
    var pertinents = formulaires.filter(estSoutien);
    if (!pertinents.length) return;

    zone.innerHTML = pertinents.map(function (f) {
      var libelle = LIBELLES[f.type] || 'En savoir plus';
      if (f.type === 'Event' && /adh[eé]sion|cotisation|membre/i.test(f.titre || '')) {
        libelle = 'Adherer';
      }
      return '<article class="card">' +
        '<span class="tag" style="background:#B9B0E5">' + proteger(libelle) + '</span>' +
        '<h3>' + proteger(f.titre) + '</h3>' +
        (f.description ? '<p>' + proteger(f.description) + '</p>' : '') +
        '<p style="margin-top:1.2rem"><a class="btn btn-solid" href="' + proteger(f.url) +
        '" target="_blank" rel="noopener noreferrer">' + proteger(libelle) + '</a></p>' +
        '</article>';
    }).join('');
  } catch (e) {
    console.warn('HelloAsso :', e.message);
  }
}

chargerAgenda();
chargerInstagram();
chargerHelloAsso();
