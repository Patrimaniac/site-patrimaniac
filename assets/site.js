/* Patrimaniac — comportements du site
   Aucun réglage à faire ici : le contenu vient des fichiers du dossier data/. */

/* ---------- Menu mobile ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
nav.addEventListener('click', e => { if (e.target.tagName === 'A') nav.classList.remove('open'); });

/* ---------- L'œil suit le curseur ---------- */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  const disc = document.getElementById('eyeDisc');
  const pupil = document.getElementById('pupil');
  if (disc && pupil) {
    window.addEventListener('mousemove', e => {
      const r = disc.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const a = Math.atan2(e.clientY - cy, e.clientX - cx);
      const d = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy) / 22, 9);
      pupil.style.transform = translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px);
    }, { passive: true });
  }
}

/* ---------- Agenda ---------- */
const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

function carteEvenement(ev) {
  const d = new Date(ev.date + 'T00:00:00');
  const details = [ev.heure, ev.lieu, ev.info].filter(Boolean).join(' · ');
  const lien = ev.inscription
    ? <a class="btn" href="${ev.inscription}">S'inscrire</a>
    : <a class="btn" href="#contact">Nous écrire</a>;
  return `<div class="event">
    <div class="date"><b>${String(d.getDate()).padStart(2, '0')}</b><span>${MOIS[d.getMonth()]}</span></div>
    <div>
      <h3>${ev.titre}</h3>
      ${details ? <p>${details}</p> : ''}
    </div>
    ${lien}
  </div>`;
}

async function chargerAgenda() {
  const zone = document.getElementById('agenda-liste');
  if (!zone) return;
  try {
    const r = await fetch('data/evenements.json', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const tous = await r.json();

    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const avenir = tous.filter(e => new Date(e.date + 'T00:00:00') >= aujourdhui)
                       .sort((a, b) => a.date.localeCompare(b.date));
    const passes = tous.filter(e => new Date(e.date + 'T00:00:00') < aujourdhui)
                       .sort((a, b) => b.date.localeCompare(a.date))
                       .slice(0, 6);

    zone.innerHTML = avenir.length
      ? avenir.map(carteEvenement).join('')
      : <p class="agenda-note">Aucun rendez-vous programmé pour le moment. Écrivez-nous pour être prévenu des prochaines dates.</p>;

    if (passes.length) {
      document.getElementById('agenda-passes').innerHTML = passes.map(carteEvenement).join('');
      document.getElementById('agenda-archives').hidden = false;
    }
  } catch (err) {
    zone.innerHTML = <p class="agenda-note">L'agenda n'a pas pu être chargé. Écrivez-nous pour connaître les prochaines dates.</p>;
    console.error('Agenda :', err);
  }
}

/* ---------- Flux Instagram ---------- */
async function chargerInstagram() {
  const grille = document.getElementById('ig-grid');
  const note = document.getElementById('ig-note');
  if (!grille) return;
  try {
    const r = await fetch('data/instagram.json', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const posts = await r.json();
    if (!Array.isArray(posts) || !posts.length) return;

    grille.innerHTML = posts.slice(0, 8).map(p => {
      const legende = (p.legende || 'Publication Instagram de Patrimaniac')
        .replace(/</g, '&lt;').slice(0, 120);
      return `<div class="ig-cell">
        <a href="${p.permalien}" target="_blank" rel="noopener noreferrer">
          <img src="${p.image}" alt="${legende}" loading="lazy">
        </a>
      </div>`;
    }).join('');
    if (note) note.remove();
  } catch (err) {
    console.error('Instagram :', err);
  }
}

chargerAgenda();
chargerInstagram();
