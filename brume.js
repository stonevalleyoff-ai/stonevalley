// Stone Valley — LA BRUME SANGLANTE (brume.js)
// Le second état d'île (voir etats.js pour le système). Sur certaines îles, dès l'exploration 8 (une sur
// dix environ), un cercle de mages psalmodie quelque part, et une brume rouge couvre l'île entière : on n'y
// voit qu'à quelques cases. C'est une brume magique, et elle rend fou : dedans, toute créature s'en prend
// à ce qui vit le plus près d'elle — vous, une autre bête, et vos compagnes, qui se retournent contre vous
// (elles ne meurent pas : elles tombent, comme toujours, et le lien les reprend). Les automates n'ont pas
// de sang : la brume ne les touche pas.
// Le CERCLE : six mages en robe, autour d'un cercle de runes et d'un pilier de lumière rouge, psalmodient.
// Dès votre arrivée, ils lancent dans la brume des Rôdeurs (des loups de brume) à vos trousses. Qui
// approche, deux d'entre eux le combattent (le fouet de sang, qui tire vers eux ; la volée de cinq
// traits) pendant que les autres chantent. Chaque mage qui tombe éclaircit la brume ; le dernier tombé,
// elle se lève sur l'île. Mais s'ils achèvent leur incantation (quatre minutes, plus lente à mesure qu'ils
// tombent ; une barre en haut de l'écran dit le temps qu'il reste), un DÉMON cornu sort du cercle, massacre les mages, puis s'en prend à vous ; la brume ne se
// lève qu'à sa mort.
// Le jeu (index.html, etats.js) appelle, s'ils existent :
//   brumeIle()          à chaque île marquée « brume » (etatsIle) ;
//   brumeSang()         l'épaisseur de la brume ici, de 0 à 1 (le ciel, le brouillard, la musique) ;
//   fureurIci(b)        la cible d'une bête prise de fureur, ou null (majBete) ;
//   majBrume(dt)        à chaque image (majEtats) ;
//   dessinerBrume(...)  l'image, par-dessus le monde (dessinerFiltre) ;
//   majBrumeBete(b, dt) les mages, les Rôdeurs, le démon, le cercle (majBete) ; osBrume(f) leurs volumes ;
//   butinBrume(b)       ce qu'ils laissent (butin) ; brumeMonde / brumeAppliquer : l'état du cercle, partagé (faune.js).

const SANG = { k: 0, annonce: false, chantT: 0, cercle: null, incant: 0, phase: 'libre', total: 0, invT: 0, seuil: 0, leveeT: 0, dirT: 0 };
const INCANT_DUREE = 240;                                  // l'incantation complète : quatre minutes, tous les mages vivants
const NB_MAGES = 6, R_CERCLE = 3.2;
const BRUME_PORTEE = 12;                                   // la fureur ne voit pas plus loin que la brume

function brumeIle() {
  Object.assign(SANG, { k: 1, annonce: false, incant: 0, phase: 'chant', total: NB_MAGES, invT: t + 12, seuil: 0, leveeT: 0, dirT: t + 8, cercle: null });
  if (!specById.mage_sang) return;
  const C = SANG.cercle = placerCercle();
  const c = naitre(specById.cercle_sang, C.x, C.y); c.variante = null; c.z = C.z; c.pv = 1; c.age = 1e6; c.ech = 1; c.etat = 'chant'; beasts.push(c);
  for (let k = 0; k < NB_MAGES; k++) {
    const a = k / NB_MAGES * 6.2832, m = naitre(specById.mage_sang, C.x + Math.cos(a) * R_CERCLE, C.y + Math.sin(a) * R_CERCLE);
    m.variante = null; m.z = sol(m.x, m.y); m.pv = 1; m.age = 1e6; m.ech = 1; m.place = a; m.etat = 'psalmodier'; m.dir = m.dirT = a + Math.PI;
    m.blinde = 1 + Math.max(0, profondeur() - 8) * .05; beasts.push(m);
  }
  if ((P.brumesLevees || []).includes(SEED)) {             // déjà levée par vous : le cercle reste éteint (les numéros des bêtes restent pris)
    SANG.k = 0; SANG.phase = 'libre'; for (const b of beasts) if (b.sp.brume) b.horsJeu = true;
  }
}
// Le cercle : sur un replat, loin de l'arrivée (35 à 80 cases), plutôt en hauteur ; la flore y est rasée.
function placerCercle() {
  const S = P.spawn || [P.x, P.y]; let best = null, bs = -1e9;
  for (let k = 0; k < 260; k++) {
    const a = Math.random() * 6.2832, r = 35 + Math.random() * 45, x = (S[0] + Math.cos(a) * r) | 0, y = (S[1] + Math.sin(a) * r) | 0;
    if (x < 12 || y < 12 || x >= WS - 12 || y >= WS - 12) continue;
    const h = hAt(x, y); if (h <= SEA + 1) continue;
    let lo = 99, hi = -99, eau = 0;
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { if (dx * dx + dy * dy > 25) continue; const q = hAt(x + dx, y + dy); lo = Math.min(lo, q); hi = Math.max(hi, q); if (eauAt(x + dx, y + dy) || PlT[(y + dy) * WS + x + dx]) eau++; }
    if (eau || lo <= SEA) continue;
    const sc = h * .3 - (hi - lo) * 4;
    if (sc > bs) { bs = sc; best = [x, y]; }
  }
  if (!best) best = [S[0] | 0, S[1] | 0];
  const [x, y] = best;
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) if (dx * dx + dy * dy <= 36) { const i = (y + dy) * WS + x + dx; if (i >= 0 && i < WS * WS) Flo[i] = 0; }
  return { x: x + .5, y: y + .5, z: hAt(x, y) };
}
function brumeSang() { return ETAT.id === 'brume' && !(typeof djIci === 'function' && djIci()) ? SANG.k : 0; }

// La fureur : la cible la plus proche, joueur ou bête, revue toutes les 0,6 s (et gardée tant qu'elle vit).
// Ne sont jamais prises pour cibles : les visions, la flore, les maisons, les nomades, ce qui est caché.
const proieDeFureur = (o, b) => o !== b && !o.dead && o.pv > 0 && !o.sp.illusion && !o.sp.plante && !o.sp.batiment
  && !o.sp.pnj && !o.sp.villageois && !o.cache && !(o.enfoui > 0) && !(o.sp.dragon && o.enVol) && !o.loin && !o.sp.brume;   // (la brume protège les siens)
function fureurIci(b) {
  if (!(brumeSang() > .3) || b.sp.brume) { b.furC = null; return null; }
  const c = b.furC;
  if (c && t < b.furT && (estJoueur(c) ? c.pv > 0 : proieDeFureur(c, b)) && (c.x - b.x) ** 2 + (c.y - b.y) ** 2 < BRUME_PORTEE ** 2 * 1.4) return c;
  let best = null, bd = BRUME_PORTEE ** 2;
  const J = typeof JC !== 'undefined' && JC ? JC : P;                       // le joueur que cette bête considère
  if (J.pv > 0 && Math.abs(J.z - b.z) < 3) { const d = (J.x - b.x) ** 2 + (J.y - b.y) ** 2; if (d < bd) { bd = d; best = J; } }
  for (const o of beasts) {
    if (!proieDeFureur(o, b) || Math.abs(o.z - b.z) > 3) continue;
    const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2; if (d < bd) { bd = d; best = o; }
  }
  b.furC = best; b.furT = t + .6 + Math.random() * .3;
  return best;
}

function majBrume(dt) {
  if (ETAT.id === 'brume') majCercle(dt);
  barreIncant();
  const k = brumeSang(); if (!k) return;
  if (!SANG.annonce) { SANG.annonce = true; say('Brume sanglante · ici, tout ce qui vit s\'entretue · vos compagnes aussi', 5); }
  // des volutes rouges qui traînent au ras du sol, autour de vous
  for (let j = 0; j < 2; j++) if (Math.random() < dt * 6 * k) {
    const a = Math.random() * 6.2832, r = 1.5 + Math.random() * 9, x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
    parts.push({ x, y, z: sol(x, y) + .1 + Math.random() * 1.2, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, vz: .02 + Math.random() * .08, g: -.02,
      life: 2.5 + Math.random() * 2, age: 0, col: Math.random() < .6 ? '#3e0a0c' : '#5c1214', tl: .07 });
  }
}

// L'image : un bord rouge sombre qui respire, des voiles qui passent. En vue de dessus (où le brouillard
// du rendu ne va pas jusqu'au plein), le rouge se referme autour du personnage, au centre.
function dessinerBrume(g, W, H, R, vign) {
  const k = brumeSang(); if (!k) return;
  const iso = typeof mode !== 'undefined' && mode === 'iso';
  vign((.38 + .1 * Math.sin(t * .5)) * k, '46,4,6', iso ? .12 : .3);
  if (iso) {                                                 // vue de dessus : la brume se referme autour du personnage
    const x = W * .5, y = H * .54, gr = g.createRadialGradient(x, y, R * .14, x, y, R * .62);
    gr.addColorStop(0, 'rgba(60,8,10,0)'); gr.addColorStop(.55, `rgba(60,8,10,${.55 * k})`); gr.addColorStop(1, `rgba(34,4,6,${.9 * k})`);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  for (let j = 0; j < 7; j++) {
    const x = W * (.5 + .6 * Math.sin(t * .05 * (1 + j * .21) + j * 1.9)), y = H * (.5 + .55 * Math.cos(t * .04 * (1 + j * .17) + j * 2.7)), r = R * (.3 + .15 * Math.sin(t * .23 + j));
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(110,14,16,${.1 * k})`); gr.addColorStop(1, 'rgba(110,14,16,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
}
// La barre de l'incantation, en haut de l'écran (#incant, index.html) : elle se vide à mesure que les mages
// chantent ; le temps affiché est celui qu'il leur faut encore au rythme d'à présent (chaque mage tué le
// ralentit) ; dans les trente dernières secondes, elle bat. On ne touche la page que quand ça change.
const BARRE = { el: null, w: -1, txt: '', urg: null, vu: false };
function barreIncant() {
  const B = BARRE; if (!B.el) { B.el = typeof document !== 'undefined' && document.getElementById('incant'); if (!B.el) return; }
  const on = SANG.phase === 'chant' && !!SANG.cercle && brumeSang() > 0;
  if (on !== B.vu) { B.vu = on; B.el.style.display = on ? 'block' : 'none'; document.body.classList.toggle('incant', on); }
  if (!on) return;
  const viv = magesVivants().length, vit = (.4 + .6 * viv / (SANG.total || NB_MAGES)) / INCANT_DUREE, s = Math.ceil(Math.max(0, 1 - SANG.incant) / vit);
  const w = Math.round((1 - SANG.incant) * 1000) / 10, txt = `Incantation · ${s / 60 | 0}:${String(s % 60).padStart(2, '0')} · ${viv} mage${viv > 1 ? 's' : ''}`;
  if (w !== B.w) { B.w = w; B.el.firstElementChild.style.width = w + '%'; }
  if (txt !== B.txt) { B.txt = txt; B.el.lastElementChild.textContent = txt; }
  const urg = s <= 30; if (urg !== B.urg) { B.urg = urg; B.el.classList.toggle('urgent', urg); }
}
// Pour la valse (index.html, SON) : 0,45 au calme, jusqu'à 1 quand la fureur rôde près de vous.
function brumeIntensite() {                              // (et plus près du cercle, plus l'incantation avance ; le démon : tout)
  if (t < (SANG.intT || 0)) return SANG.int;
  let n = 0; for (const b of beasts) if ((b.etat === 'furie' || (b.sp.brume && b.etat !== 'psalmodier' && !b.sp.cercle)) && !b.dead && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 196) n++;
  const C = SANG.cercle, dC = C ? Math.hypot(C.x - P.x, C.y - P.y) : 99;
  SANG.intT = t + .5;
  return (SANG.int = SANG.phase === 'demon' ? 1 : Math.min(1, .4 + n * .16 + Math.max(0, 1 - dC / 30) * .3 + SANG.incant * .2));
}

// ---------- les êtres de la brume ----------
// Ils ne sont pas pris de fureur (c'est leur brume) ; les bêtes furieuses, elles, s'en prennent aussi à eux.
const BRUME_SPEC = [
  { id: 'mage_sang', n: 'Mage du cercle', corps: 'mage', brume: 1, diet: 'c', sz: 1, spd: 2.4, vue: 14, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [96, 14, 20], dark: [40, 6, 10], leg: [96, 14, 20], oeil: [255, 60, 40], bio: [], dur: 3, lien: 0, chasse: [], travail: {}, metier: 'psalmodie la brume', grimpe: 0 },
  { id: 'rodeur_brume', n: 'Rôdeur de brume', corps: 'rodeur', brume: 1, diet: 'c', sz: .85, spd: 5.4, vue: 16, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [92, 12, 16], dark: [40, 4, 8], leg: [70, 8, 12], oeil: [255, 70, 50], bio: [], dur: .8, lien: 0, chasse: [], travail: {}, metier: 'lancé à vos trousses', grimpe: 0 },
  { id: 'demon_sang', n: 'Démon du cercle', corps: 'demon', brume: 1, diet: 'c', sz: 2.2, spd: 2.6, vue: 30, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [64, 16, 14], dark: [28, 6, 6], leg: [52, 12, 10], oeil: [255, 150, 60], bio: [], dur: 22, lien: 0, chasse: [], travail: {}, metier: 'la fin de l\'incantation', grimpe: 0 },
  { id: 'cercle_sang', n: 'Cercle de sang', corps: 'cercle', brume: 1, cercle: 1, batiment: 1, diet: 's', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [180, 20, 24], dark: [60, 6, 8], leg: [60, 6, 8], oeil: [255, 60, 40], bio: [], dur: 1e9, lien: 0, chasse: [], travail: {}, metier: 'le cercle d\'incantation', grimpe: 0 },
];
const estMage = b => !!b && !!b.sp && b.sp.corps === 'mage';
const autorite = () => !(typeof fauneSuiveur === 'function' && fauneSuiveur());    // seul (ou gardien de l'île) : c'est ici que tout se décide
const magesVivants = () => beasts.filter(b => estMage(b) && !b.dead && b.pv > 0 && !b.horsJeu);
// Ceux qu'ils combattent : les joueurs, et les compagnes (pas les bêtes : la fureur s'en charge).
function cibleBrume(b, R, dz = 4) {                        // (dz : l'écart de hauteur au-delà duquel on ne le voit plus ; les Rôdeurs sautent)
  let best = null, bd = R * R;
  for (const J of (typeof joueursFaune === 'function' ? joueursFaune() : [P])) if (J.pv > 0 && Math.abs(J.z - b.z) < dz) { const d = (J.x - b.x) ** 2 + (J.y - b.y) ** 2; if (d < bd) { bd = d; best = J; } }
  for (const o of beasts) if (o.tame && !o.dead && o.pv > 0 && !o.loin && Math.abs(o.z - b.z) < dz) { const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2; if (d < bd * .7) { bd = d; best = o; } }
  return best;
}
// Frapper : un joueur (le vôtre ou celui d'en face, par faune.js), une bête.
function coupBrume(b, c, deg, kb) {
  if (estJoueur(c)) {
    if (typeof frapperJoueur === 'function') return frapperJoueur(b, c, deg, kb ? { kb } : null);
    const r = porterCoup(b, c, deg); if (r && kb && c === P) { P.vx += kb[0]; P.vy += kb[1]; if (kb[2]) P.vz = (P.vz || 0) + kb[2]; } return r;
  }
  const r = porterCoup(b, c, deg); if (c.pv <= 0 && !c.dead) mourirBete(c, 'brume'); return r;
}
// Le pas : sur le sol, une marche à la fois (le démon en enjambe deux), en contournant ce qui bloque.
function pasBrume(b, tx, ty, vit, dt, marche = 1.2) {
  const d = Math.hypot(tx - b.x, ty - b.y);
  if (vit <= 0 || d < .05) { b.vit = 0; return; }
  const sv = Math.min(vit, d / Math.max(dt, .016)), a0 = Math.atan2(ty - b.y, tx - b.x), h0 = hAt(b.x | 0, b.y | 0);
  for (const da of [0, .6, -.6, 1.2, -1.2]) {
    const a = a0 + da * (b.cote || 1), nx = b.x + Math.cos(a) * sv * dt, ny = b.y + Math.sin(a) * sv * dt, h = hAt(nx | 0, ny | 0);
    if (h > SEA && Math.abs(h - h0) <= marche && !PlT[(ny | 0) * WS + (nx | 0)] && !eauAt(nx | 0, ny | 0)) { b.x = nx; b.y = ny; b.vit = sv; if (da) b.cote = -(b.cote || 1); break; }
    if (da === -1.2) b.vit = 0;
  }
  b.z = sol(b.x, b.y);
}
// Le saut des Rôdeurs : sur un relief de quatre cases au plus, et par-dessus un trou ou de l'eau de quatre
// cases au plus ; s'il n'y a pas d'autre bord, ils se laissent tomber dedans (quatre cases au plus). Un arc :
// b.saut = [x0, y0, z0, x1, y1, z1, durée, hauteur], b.sautT = son départ (partagés : arcSaut, chez qui suit).
const SAUT_HAUT = 4, SAUT_LONG = 4;
function solLibre(x, y) { const i = x | 0, j = y | 0, h = hAt(i, j); return i > 2 && j > 2 && i < WS - 3 && j < WS - 3 && h > SEA && !eauAt(i, j) && !PlT[j * WS + i] ? h : null; }
function chercherSaut(b, a) {
  const h0 = hAt(b.x | 0, b.y | 0), cx = Math.cos(a), cy = Math.sin(a), h1 = solLibre(b.x + cx * .9, b.y + cy * .9);
  if (h1 !== null && Math.abs(h1 - h0) <= 1.3) return null;                                   // ça se marche
  if (h1 !== null && h1 > h0) return h1 - h0 <= SAUT_HAUT ? [b.x + cx * 1.15, b.y + cy * 1.15] : null;   // un mur : dessus, s'il n'est pas trop haut
  for (let r = 1.5; r <= SAUT_LONG + 1.01; r += .5) {                                         // un trou, une chute, de l'eau : l'autre bord
    const x = b.x + cx * r, y = b.y + cy * r, h = solLibre(x, y);
    if (h !== null && h >= h0 - 1.3 && h - h0 <= SAUT_HAUT) return [x, y];
  }
  return h1 !== null && h0 - h1 <= SAUT_HAUT ? [b.x + cx * 1.15, b.y + cy * 1.15] : null;   // pas d'autre bord : dedans
}
function sauterBrume(b, x1, y1) {
  const z0 = b.z, z1 = sol(x1, y1), dz = z1 - z0, dist = Math.hypot(x1 - b.x, y1 - b.y);
  b.saut = [b.x, b.y, z0, x1, y1, z1, .3 + .07 * dist + .05 * Math.abs(dz), Math.abs(dz) * (dz > 0 ? .9 : .3) + 1]; b.sautT = t;
  b.dir = b.dirT = Math.atan2(y1 - b.y, x1 - b.x); b.etat = 'sauter'; SON.jouer('saut', {}, b.x, b.y, b.z);
}
function arcSaut(b) {
  const S = b.saut; if (!Array.isArray(S) || S.length < 8 || b.sautT == null) return null;
  const u = (t - b.sautT) / S[6]; return u < 0 || u >= 1 ? null : S[2] + (S[5] - S[2]) * u + S[7] * 4 * u * (1 - u);
}
function majSaut(b) {
  const S = b.saut, u = Math.min(1, (t - b.sautT) / S[6]);
  b.x = S[0] + (S[3] - S[0]) * u; b.y = S[1] + (S[4] - S[1]) * u; b.vit = Math.hypot(S[3] - S[0], S[4] - S[1]) / S[6]; b.etat = 'sauter';
  if (u < 1) { b.z = arcSaut(b) ?? sol(b.x, b.y); return; }
  b.z = sol(b.x, b.y); b.saut = null; b.sautPret = t + .25; b.vit = 0; b.etat = 'traquer';
  SON.jouer('atterrir', { k: .5 }, b.x, b.y, b.z);
  for (let q = 0; q < 8; q++) parts.push({ x: b.x, y: b.y, z: b.z + .05, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: .4 + Math.random() * .6, g: -.1, life: .6, age: 0, col: '#5a0a0e', tl: .09 });
}
function tournerBrume(b, dt, v = 4) {
  let dd = b.dirT - b.dir; while (dd > Math.PI) dd -= 6.2832; while (dd < -Math.PI) dd += 6.2832;
  b.dir += Math.max(-v * dt, Math.min(v * dt, dd));
}
function agirBrume(b, act, c) { b.act = act; b.actT = t; b.actC = c; b.fait = false; b.etat = act; if (c) b.vise = [c.x, c.y, (c.z || 0) + .9]; }

function majBrumeBete(b, dt) {
  b.t += dt; b.age += dt; if (b.hit > 0) b.hit -= dt;
  if (b.dead) { b.dead += dt * (b.sp.corps === 'demon' ? .35 : 1); b.z = sol(b.x, b.y); return; }   // le démon met du temps à se défaire
  if (b.horsJeu) return;
  const k = b.sp.corps;
  if (k === 'cercle') { b.etat = SANG.phase; return; }
  if (k === 'mage') majMage(b, dt);
  else if (k === 'rodeur') majRodeur(b, dt);
  else if (k === 'demon') majDemon(b, dt);
  pasBrumeVisuel(b, dt);
}

// ---------- les mages ----------
// Deux combattent à la fois (trois quand ils ne sont plus que trois) ; les autres tiennent le cercle.
function majMage(b, dt) {
  const C = SANG.cercle; if (!C) return;
  if (SANG.phase === 'demon') {                              // le démon est là : ils se jettent à genoux
    b.act = null; b.combat = false; b.vit = 0; b.etat = 'effroi';
    const D = beasts.find(o => o.sp.corps === 'demon' && !o.dead); if (D) { b.dirT = Math.atan2(D.y - b.y, D.x - b.x); tournerBrume(b, dt); }
    return;
  }
  const c = cibleBrume(b, 16), dC = c ? Math.hypot(c.x - b.x, c.y - b.y) : 1e9;
  if (b.act) return actionMage(b, dt);
  const nCombat = beasts.filter(o => estMage(o) && o.combat && !o.dead).length, vivants = magesVivants().length;
  if (c && dC < 13 && (b.combat || nCombat < (vivants <= 3 ? 3 : 2))) b.combat = true;
  if (b.combat && (!c || dC > 20)) b.combat = false;
  if (!b.combat) {                                           // à sa place : il psalmodie, face au pilier
    const px = C.x + Math.cos(b.place) * R_CERCLE, py = C.y + Math.sin(b.place) * R_CERCLE;
    if (Math.hypot(px - b.x, py - b.y) > .3) { b.dirT = Math.atan2(py - b.y, px - b.x); pasBrume(b, px, py, 2, dt); b.etat = 'revenir'; }
    else { b.vit = 0; b.etat = 'psalmodier'; b.dirT = b.place + Math.PI; }
    tournerBrume(b, dt); return;
  }
  b.etat = 'combattre'; b.dirT = Math.atan2(c.y - b.y, c.x - b.x);
  if (dC < 2.4 && t > (b.blinkT || 0)) {                    // trop près : il se dérobe d'un bond, dans un nuage rouge
    const a = Math.atan2(b.y - c.y, b.x - c.x) + (Math.random() - .5);
    for (let j = 0; j < 14; j++) parts.push({ x: b.x, y: b.y, z: b.z + Math.random() * 1.6, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: .4, g: -.3, life: .8, age: 0, col: '#6a0e12', tl: .1 });
    for (let s = 3.5; s > .5; s -= .5) { const nx = b.x + Math.cos(a) * s, ny = b.y + Math.sin(a) * s, h = hAt(nx | 0, ny | 0); if (h > SEA && Math.abs(h - hAt(b.x | 0, b.y | 0)) <= 1.2 && !eauAt(nx | 0, ny | 0)) { b.x = nx; b.y = ny; b.z = sol(nx, ny); break; } }
    b.blinkT = t + 4 + Math.random() * 2;
  } else if (dC < 4.8 && t > (b.fouetT || 0)) agirBrume(b, 'fouet', c);
  else if (dC < 12 && t > (b.voleeT || 0)) agirBrume(b, 'volee', c);
  else {                                                     // il garde ses distances, en tournant autour
    const a = Math.atan2(b.y - c.y, b.x - c.x) + (b.cote || 1) * .5, r = dC > 8.5 ? 6 : dC < 4.5 ? 7 : dC;
    pasBrume(b, c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 2.2, dt);
  }
  tournerBrume(b, dt, 5);
}
function actionMage(b, dt) {
  const u = t - b.actT, c = b.actC; b.vit = 0;
  if (c && (estJoueur(c) ? c.pv > 0 : !c.dead)) b.dirT = Math.atan2(c.y - b.y, c.x - b.x);
  if (b.act === 'fouet') {                                   // le fouet de sang : il s'arme, claque, et ramène vers lui ce qu'il touche
    if (u < .45 && c) b.vise = [c.x, c.y, (c.z || 0) + .9];
    if (u >= .55 && !b.fait) {
      b.fait = true; SON.jouer('fouet', {}, b.x, b.y, b.z + 1.5);
      for (const o of [c, ...(typeof joueursFaune === 'function' ? joueursFaune() : [P])]) {
        if (!o || (estJoueur(o) ? !(o.pv > 0) : o.dead)) continue;
        const d = Math.hypot(o.x - b.x, o.y - b.y), dv = Math.hypot(o.x - b.vise[0], o.y - b.vise[1]);
        if (d < 5.2 && dv < 1.4) { const ux = (b.x - o.x) / (d || 1), uy = (b.y - o.y) / (d || 1); coupBrume(b, o, .1, [ux * 5, uy * 5, 2]); burst(o.x, o.y, (o.z || 0) + .9, 10, '#b01018'); if (o === c) break; }
      }
    }
    if (u > 1.1) { b.act = null; b.fouetT = t + 2.2 + Math.random() * 1.2; }
  } else if (b.act === 'volee') {                            // la volée : cinq traits de sang en éventail
    if (u >= .7 && !b.fait && c) {
      b.fait = true; SON.jouer('volee', {}, b.x, b.y, b.z + 1.5); b.cibleC = c;   // (une compagne visée : les traits la touchent)
      const cz = (c.z || 0) + .8, ox = b.x + Math.cos(b.dir) * .5, oy = b.y + Math.sin(b.dir) * .5, oz = b.z + 1.45;
      const d = Math.hypot(c.x - ox, c.y - oy) || 1, vol = d / 11, a0 = Math.atan2(c.y - oy, c.x - ox);
      for (let k = -2; k <= 2; k++) {
        const a = a0 + k * .15, vx = Math.cos(a) * d / vol, vy = Math.sin(a) * d / vol;
        TIRS.push({ x: ox, y: oy, z: oz, vx, vy, vz: (cz - oz) / vol + TIR_G * vol * .5, de: b, deg: .045, age: 0, c: [235, 30, 40] });
        if (typeof fauneTir === 'function') fauneTir(b, TIRS[TIRS.length - 1]);
      }
    }
    if (u > 1.15) { b.act = null; b.voleeT = t + 3.2 + Math.random() * 1.5; }
  } else b.act = null;
  tournerBrume(b, dt, 6);
}

// ---------- les Rôdeurs de brume ----------
// Des loups de fumée rouge que le cercle lance à vos trousses : rapides, fragiles ; ils traquent, se
// ramassent, bondissent, mordent, puis se défont en brume (au bout de quarante secondes, au plus).
function majRodeur(b, dt) {
  if ((b.vie = (b.vie ?? 40) - dt) <= 0) { b.pv = 0; mourirBete(b, 'brume'); return; }
  if (b.saut) return majSaut(b);
  if (b.act === 'bond') {
    const u = t - b.actT, c = b.actC;
    if (u < .35) { b.vit = 0; b.etat = 'ramasser'; if (c) b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 8); return; }
    b.etat = 'bondir';
    if (u < .7) {
      const nx = b.x + Math.cos(b.dir) * 9 * dt, ny = b.y + Math.sin(b.dir) * 9 * dt, h = hAt(nx | 0, ny | 0);
      if (h > SEA && Math.abs(h - hAt(b.x | 0, b.y | 0)) <= 1.5) { b.x = nx; b.y = ny; b.z = sol(nx, ny); }
      b.vit = 9;
      if (!b.fait && c && (estJoueur(c) ? c.pv > 0 : !c.dead) && Math.hypot(c.x - b.x, c.y - b.y) < .95 + (c.sp ? c.sp.sz * .2 : 0)) {
        b.fait = true; coupBrume(b, c, .08, [Math.cos(b.dir) * 3, Math.sin(b.dir) * 3, 0]); SON.jouer('lacere', {}, b.x, b.y, b.z + .5);
      }
      return;
    }
    b.act = null; b.repos = t + .6; b.vit = 0; return;
  }
  const c = cibleBrume(b, 30, SAUT_HAUT + 2.5);
  if (!c) { b.vit = 0; b.etat = 'rôder'; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); b.etat = 'traquer';
  if (d < 2.6 && t > (b.repos || 0) && Math.abs(c.z - b.z) < 1.5) { agirBrume(b, 'bond', c); return; }
  if (d > 1.2 && t > (b.sautPret || 0)) { const L = chercherSaut(b, b.dirT); if (L) return sauterBrume(b, L[0], L[1]); }
  pasBrume(b, c.x, c.y, t < (b.repos || 0) ? 2 : 5.4, dt, 1.3); tournerBrume(b, dt, 7);
}
function invoquerRodeurs() {
  const L = typeof joueursFaune === 'function' ? joueursFaune() : [P], J = L[Math.random() * L.length | 0] || P;
  const n = 1 + (Math.random() < .35 + SANG.incant * .4 ? 1 : 0);
  for (let j = 0; j < n; j++) for (let k = 0; k < 12; k++) {
    const a = Math.random() * 6.2832, r = 8.5 + Math.random() * 3, x = J.x + Math.cos(a) * r, y = J.y + Math.sin(a) * r;
    if (x < 3 || y < 3 || x > WS - 4 || y > WS - 4 || hAt(x | 0, y | 0) <= SEA || eauAt(x | 0, y | 0) || Math.abs(sol(x, y) - J.z) > 2) continue;
    const b = naitre(specById.rodeur_brume, x, y); b.variante = null; b.z = sol(x, y); b.pv = 1; b.age = 1e6; b.ech = 1; b.vie = 40; b.dir = b.dirT = Math.atan2(J.y - y, J.x - x);
    beasts.push(b);
    for (let q = 0; q < 16; q++) parts.push({ x, y, z: b.z + Math.random() * .8, vx: (Math.random() - .5) * 1.4, vy: (Math.random() - .5) * 1.4, vz: .3 + Math.random() * .6, g: -.2, life: 1, age: 0, col: Math.random() < .5 ? '#5a0a0e' : '#8a1418', tl: .1 });
    break;
  }
  if (!SANG.vuR) { SANG.vuR = true; say('quelque chose prend forme dans la brume · le cercle vous a senti', 2.5); }
}

// ---------- le démon ----------
// Il sort du cercle, rugit, écrase les mages un par un (ils ne fuient pas : ils prient), rugit encore,
// puis vient à vous. Trois coups, tous annoncés : le revers (de près, devant lui), le martèlement (un
// cercle rouge au sol : sortez-en) et la charge cornes en avant (une traînée rouge : écartez-vous ; s'il
// percute un relief, il reste sonné deux secondes).
function invoquerDemon() {
  const C = SANG.cercle; if (!C || beasts.some(b => b.sp.corps === 'demon' && !b.dead)) return;
  SANG.phase = 'demon';
  const b = naitre(specById.demon_sang, C.x, C.y); b.variante = null; b.z = C.z; b.pv = 1; b.age = 1e6; b.ech = 1; b.etat = 'surgir'; b.emerge = 0;
  b.blinde = 1 + Math.max(0, profondeur() - 8) * .06; b.dir = b.dirT = Math.atan2(P.y - C.y, P.x - C.x);
  beasts.push(b);
  SON.jouer('rugDemon'); say('L\'incantation est achevée · quelque chose sort du cercle', 4); P.secousse = t; P.secousseK = .6;
}
function majDemon(b, dt) {
  const ph = b.phaseD || 'surgir';                           // (b.etat dit ce qui se voit ; b.phaseD, où il en est)
  if (ph === 'surgir') {                                     // il sort du cercle, lentement
    b.etat = 'surgir'; b.emerge = Math.min(1, (b.emerge || 0) + dt / 4); b.vit = 0; P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .25);
    if (b.emerge >= 1) { b.phaseD = 'rugir'; b.etat = 'rugir'; b.actT = t; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 3); }
    return;
  }
  if (ph === 'rugir') { b.etat = 'rugir'; b.vit = 0; if (t - b.actT > 2) b.phaseD = magesVivants().length ? 'massacrer' : 'chasser'; return; }
  if (b.act) return actionDemon(b, dt);
  if (ph === 'massacrer') {                                  // les mages d'abord
    b.etat = 'massacrer';
    const M = magesVivants();
    if (!M.length) { b.phaseD = 'rugir'; b.etat = 'rugir'; b.actT = t; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 3); return; }
    let m = M[0], dm = 1e9; for (const o of M) { const d = Math.hypot(o.x - b.x, o.y - b.y); if (d < dm) { dm = d; m = o; } }
    b.dirT = Math.atan2(m.y - b.y, m.x - b.x); tournerBrume(b, dt, 2.5);
    if (dm < 3.4) agirBrume(b, 'marteler', m); else pasBrume(b, m.x, m.y, 3, dt, 2.5);
    return;
  }
  b.etat = 'chasser';
  const c = cibleBrume(b, 60); if (!c) { b.vit = 0; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 2.2);
  if (d < 4.4 && t > (b.revT || 0)) agirBrume(b, 'revers', c);
  else if (d < 7.5 && t > (b.marT || 0)) agirBrume(b, 'marteler', c);
  else if (d > 6 && d < 18 && t > (b.chT || 0)) agirBrume(b, 'charger', c);
  else pasBrume(b, c.x, c.y, d > 10 ? 3.2 : 2.4, dt, 2.5);
}
function actionDemon(b, dt) {
  const u = t - b.actT, c = b.actC, L = typeof joueursFaune === 'function' ? joueursFaune() : [P];
  const vivant = o => o && (estJoueur(o) ? o.pv > 0 : !o.dead && o.pv > 0);
  const toucher = (x, y, R, deg, kb, aussi) => {             // tout ce qui est dans le rayon : joueurs, compagnes, et la victime visée
    const V = [...L, ...beasts.filter(o => o.tame && !o.dead), ...(aussi ? [aussi] : [])];
    for (const o of V) { if (!vivant(o)) continue; const d = Math.hypot(o.x - x, o.y - y); if (d < R) { const ux = (o.x - b.x) / (d || 1), uy = (o.y - b.y) / (d || 1); coupBrume(b, o, deg * (1 - d / R * .4), [ux * kb, uy * kb, kb * .5]); } }
  };
  b.vit = 0;
  if (b.act === 'revers') {                                  // le revers : il arme le bras, balaie devant lui
    if (u < .5 && vivant(c)) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 3); }
    if (u >= .75 && !b.fait) {
      b.fait = true; SON.jouer('impact', {}, b.x, b.y, b.z + 2);
      for (const o of [...L, ...beasts.filter(q => q.tame && !q.dead)]) {
        if (!vivant(o)) continue; const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
        if (d < 4.8 && (dx * Math.cos(b.dir) + dy * Math.sin(b.dir)) / (d || 1) > .25) coupBrume(b, o, .26, [dx / (d || 1) * 7, dy / (d || 1) * 7, 2.5]);
      }
    }
    if (u > 1.4) { b.act = null; b.revT = t + 2.2; }
  } else if (b.act === 'marteler') {                         // le martèlement : un cercle rouge au sol, puis les deux poings
    if (!b.impact) b.impact = [b.x + Math.cos(b.dir) * 2.4, b.y + Math.sin(b.dir) * 2.4];
    if (u >= 1.1 && !b.fait) {
      b.fait = true; const [x, y] = b.impact; SON.jouer('impact', {}, x, y, b.z); SON.jouer('rugDemon', {}, b.x, b.y, b.z + 3);
      P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, Math.hypot(P.x - x, P.y - y) < 14 ? .8 : .3);
      for (let j = 0; j < 30; j++) { const a = Math.random() * 6.2832, r = Math.random() * 4.5; parts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: sol(x, y) + .1, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: 2 + Math.random() * 3, g: 6, life: .8, age: 0, col: Math.random() < .5 ? '#5a4030' : '#a01418', tl: .1 }); }
      toucher(x, y, 4.6, .34, 5, estMage(c) ? null : c);
      if (c && estMage(c) && !c.dead) { c.pv = 0; mourirBete(c, 'démon'); burst(c.x, c.y, c.z + 1, 24, '#a01018'); }   // un mage : écrasé
    }
    if (u > 1.9) { b.act = null; b.impact = null; b.marT = t + 4.5; }
  } else if (b.act === 'charger') {                          // la charge : il gratte le sol, baisse les cornes, fonce
    if (u < .9) { if (vivant(c)) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 3); } return; }
    if (b.sonne > t) { b.etat = 'sonné'; if (t > b.sonne - .05) { b.act = null; b.chT = t + 6; } return; }
    if (u < 2.2) {
      const nx = b.x + Math.cos(b.dir) * 13 * dt, ny = b.y + Math.sin(b.dir) * 13 * dt, h = hAt(nx | 0, ny | 0);
      if (h <= SEA || Math.abs(h - hAt(b.x | 0, b.y | 0)) > 2.5 || eauAt(nx | 0, ny | 0)) {   // il percute : sonné
        b.sonne = t + 2.2; SON.jouer('impact', {}, b.x, b.y, b.z + 1); P.secousse = t; P.secousseK = .5; return;
      }
      b.x = nx; b.y = ny; b.z = sol(nx, ny); b.vit = 13;
      for (const o of [...L, ...beasts.filter(q => q.tame && !q.dead)]) if (vivant(o) && !(b.chHit || []).includes(o) && Math.hypot(o.x - b.x, o.y - b.y) < 2.1) {
        (b.chHit || (b.chHit = [])).push(o); coupBrume(b, o, .3, [Math.cos(b.dir) * 9 + -Math.sin(b.dir) * 4, Math.sin(b.dir) * 9 + Math.cos(b.dir) * 4, 4]);
      }
      return;
    }
    b.act = null; b.chHit = null; b.chT = t + 6;
  } else b.act = null;
}

// ---------- ce qu'ils laissent ----------
function butinBrume(b) {
  const k = b.sp.corps;
  if (k === 'rodeur') { P.sac.eclat += 1; say('le rôdeur se défait en brume · +1 éclat', 1.6); majSac(); return; }
  if (k === 'mage') {
    const ec = 4 + (Math.random() * 3 | 0); P.sac.eclat += ec;
    let tm = ''; if (Math.random() < .25 && typeof tomeManquant === 'function') { const m = tomeManquant(2); if (m && gagnerTome(m, 2)) tm = nomTome(cleTome(m, 2)); }
    say('un mage du cercle tombe · +' + ec + ' éclats' + (tm ? ' · ' + tm : ''), 2.4); majSac(); return;
  }
  if (k === 'demon') {
    P.sac.eclat += 40; let tm = '';
    if (typeof tomeManquant === 'function') { const m = tomeManquant(3) || tomeManquant(2); if (m) { const n = tomeAcquis(m, 3) ? 2 : 3; if (gagnerTome(m, n)) tm = nomTome(cleTome(m, n)); } }
    say('Le démon s\'effondre · +40 éclats' + (tm ? ' · ' + tm : ''), 4); majSac();
  }
}
// La brume se lève : le dernier mage, ou le démon, est tombé.
function leverBrume(demon) {
  if (SANG.phase === 'levee' || SANG.phase === 'libre') return;
  SANG.phase = 'levee'; SANG.leveeT = t;
  for (const b of beasts) if (b.sp.corps === 'rodeur' && !b.dead) { b.pv = 0; mourirBete(b, 'brume'); }
  (P.brumesLevees || (P.brumesLevees = [])).push(SEED); if (P.brumesLevees.length > 300) P.brumesLevees.shift();
  if (typeof Sauve !== 'undefined') Sauve.sale = true;
  if (!demon) {
    P.sac.eclat += 15; let tm = '';
    if (typeof tomeManquant === 'function') { const m = tomeManquant(3); if (m && gagnerTome(m, 3)) tm = nomTome(cleTome(m, 3)); }
    say('Le cercle est brisé · la brume se lève · +15 éclats' + (tm ? ' · ' + tm : ''), 4.5); majSac();
  } else say('La brume se lève', 3);
  SON.jouer('ramasse');
}

// ---------- à chaque image : le cercle, l'incantation, les invocations ----------
const DIR8 = ['l\'est', 'le sud-est', 'le sud', 'le sud-ouest', 'l\'ouest', 'le nord-ouest', 'le nord', 'le nord-est'];
function majCercle(dt) {
  const C = SANG.cercle; if (!C || ETAT.id !== 'brume') return;
  const vivants = magesVivants().length, demon = beasts.find(b => b.sp.corps === 'demon' && !b.horsJeu);
  if (autorite()) {
    if (SANG.phase === 'chant') {
      if (!vivants) leverBrume(false);
      else {
        SANG.incant = Math.min(1, SANG.incant + dt / INCANT_DUREE * (.4 + .6 * vivants / SANG.total));
        const S = [.25, .5, .75, .9];
        if (SANG.seuil < S.length && SANG.incant >= S[SANG.seuil]) {
          say(['Le chant enfle · l\'incantation en est au quart', 'Le chant enfle · l\'incantation est à moitié', 'Le pilier rougit · il ne reste qu\'un quart de l\'incantation', 'Le cercle tremble · l\'incantation s\'achève'][SANG.seuil], 3.5);
          SANG.seuil++;
        }
        if (SANG.incant >= 1) invoquerDemon();
        else if (t > SANG.invT) {
          if (beasts.filter(b => b.sp.corps === 'rodeur' && !b.dead).length < 3) invoquerRodeurs();
          SANG.invT = t + (30 - 14 * SANG.incant) * (1.3 - .3 * vivants / SANG.total) + Math.random() * 8;
        }
      }
    } else if (SANG.phase === 'demon' && demon && demon.dead) leverBrume(true);
  }
  // l'épaisseur : chaque mage qui tombe l'éclaircit ; le démon la rend pleine ; levée, elle s'en va en six secondes
  const cible = SANG.phase === 'chant' ? .62 + .38 * vivants / SANG.total : SANG.phase === 'demon' ? 1 : SANG.phase === 'levee' ? Math.max(0, 1 - (t - SANG.leveeT) / 6) : 0;
  SANG.k += (cible - SANG.k) * Math.min(1, dt * 1.5);
  if (SANG.phase === 'levee' && t - SANG.leveeT > 6) { SANG.phase = 'libre'; SANG.k = 0; }
  // d'où vient le chant
  const d = Math.hypot(C.x - P.x, C.y - P.y);
  if (SANG.phase === 'chant' && d > 25 && t > SANG.dirT) {
    const a = Math.atan2(C.y - P.y, C.x - P.x), i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
    say('le chant vient de ' + DIR8[i] + ' · ' + Math.round(d) + ' cases', 2.2); SANG.dirT = t + 30;
  }
  // ce qui se voit : le pilier qui fume, les mains des mages, les annonces des coups du démon (chez tous)
  if (SANG.phase === 'chant' || SANG.phase === 'demon') {
    if (Math.random() < dt * 20) parts.push({ x: C.x + (Math.random() - .5) * .6, y: C.y + (Math.random() - .5) * .6, z: C.z + Math.random() * 3, vx: 0, vy: 0, vz: 2 + Math.random() * 3, g: -.5, life: 2, age: 0, col: Math.random() < .5 ? '#ff4030' : '#a01018', luit: 1, tl: .08 });
  }
  for (const b of beasts) {
    if (!b.sp.brume || b.dead || b.horsJeu) continue;
    if (estMage(b) && b.etat === 'psalmodier' && Math.random() < dt * 3) parts.push({ x: b.x, y: b.y, z: b.z + 2, vx: (C.x - b.x) * .6, vy: (C.y - b.y) * .6, vz: .6, g: 0, life: 1.4, age: 0, col: '#ff3a30', luit: 1, tl: .05 });
    if (b.sp.corps === 'demon' && b.etat === 'marteler' && b.actT !== undefined && t - b.actT < 1.1) {   // le cercle rouge au sol
      const I = b.impact || [b.x + Math.cos(b.dir) * 2.4, b.y + Math.sin(b.dir) * 2.4];
      for (let j = 0; j < 3; j++) { const a = Math.random() * 6.2832; parts.push({ x: I[0] + Math.cos(a) * 4.5, y: I[1] + Math.sin(a) * 4.5, z: sol(I[0], I[1]) + .08, vx: 0, vy: 0, vz: .05, g: 0, life: .35, age: 0, col: '#ff2a20', luit: 1, tl: .1 }); }
    }
    if (b.sp.corps === 'demon' && b.etat === 'charger' && b.actT !== undefined && t - b.actT < .9) {   // la traînée rouge de la charge
      for (let j = 0; j < 3; j++) { const s = Math.random() * 14; parts.push({ x: b.x + Math.cos(b.dir) * s, y: b.y + Math.sin(b.dir) * s, z: sol(b.x + Math.cos(b.dir) * s, b.y + Math.sin(b.dir) * s) + .08, vx: 0, vy: 0, vz: .05, g: 0, life: .3, age: 0, col: '#ff2a20', luit: 1, tl: .09 }); }
    }
    if (b.sp.corps === 'rodeur' && Math.random() < dt * 12) parts.push({ x: b.x + (Math.random() - .5) * .5, y: b.y + (Math.random() - .5) * .5, z: b.z + .2 + Math.random() * .5, vx: -Math.cos(b.dir) * .8, vy: -Math.sin(b.dir) * .8, vz: .2, g: -.1, life: .7, age: 0, col: '#5a0a0e', tl: .08 });
  }
}
// L'état du cercle, dit par le gardien à ceux qui le suivent (faune.js, mondeFaune / appliquerMonde).
function brumeMonde() { return ETAT.id === 'brume' && SANG.cercle ? [Math.round(SANG.incant * 1000) / 1000, SANG.phase, SANG.seuil] : null; }
function brumeAppliquer(w) {
  if (!Array.isArray(w) || ETAT.id !== 'brume') return;
  SANG.incant = +w[0] || 0; SANG.seuil = w[2] | 0;
  if (w[1] !== SANG.phase) { if (w[1] === 'levee' && SANG.phase === 'chant') leverBrume(false); else if (w[1] === 'levee') leverBrume(true); else SANG.phase = w[1]; }
}

// ---------- leurs volumes ----------
// Les mêmes outils que les visions du Korlaz (etats.js) : des repères, des volumes posés dedans, des
// épaisseurs mises à l'échelle de la bête ; une pièce qui donne son « haut » (ref) penche avec lui.
function outilsOs(f) {
  const K = (f.sp.sz || 1) * (f.ech || 1), B = [];
  const add = (a, b, w, h, c, luit, ref) => B.push({ a, b, w: w * K, h: h * K, c, luit, ref });
  const rep = (O, F, S, U) => (a, b, c) => [O[0] + F[0] * a + S[0] * b + U[0] * c, O[1] + F[1] * a + S[1] * b + U[1] * c, O[2] + F[2] * a + S[2] * b + U[2] * c];
  const tete = (O, p, r) => {
    const F = [Math.cos(p), 0, Math.sin(p)], S0 = [0, 1, 0], U0 = [-Math.sin(p), 0, Math.cos(p)], cr = Math.cos(r), sr = Math.sin(r);
    const U = [U0[0] * cr - S0[0] * sr, U0[1] * cr - S0[1] * sr, U0[2] * cr - S0[2] * sr], M = rep(O, F, [S0[0] * cr + U0[0] * sr, S0[1] * cr + U0[1] * sr, S0[2] * cr + U0[2] * sr], U);
    M.U = U; return M;
  };
  const bloc = (M, a0, a1, b, c, w, h, col, luit) => add(M(a0, b, c), M(a1, b, c), w, h, col, luit, M.U);
  const os2 = (A, Bv, w, col, luit) => add(A, Bv, w, w, col, luit);
  const mi = (A, Bv, k) => [A[0] + (Bv[0] - A[0]) * k, A[1] + (Bv[1] - A[1]) * k, A[2] + (Bv[2] - A[2]) * k];
  const pl = (A, d) => [A[0] + d[0], A[1] + d[1], A[2] + d[2]];
  const chaine = (P0, angs, L) => { const S = [P0]; for (const a of angs) { const q = S[S.length - 1]; S.push([q[0] + Math.sin(a) * L, q[1], q[2] + Math.cos(a) * L]); } return S; };
  const cadre = (O, a) => { const M = rep(O, [Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], [Math.sin(a), 0, Math.cos(a)]); M.U = [Math.sin(a), 0, Math.cos(a)]; return M; };
  // un point du monde dans le repère de la bête (avant l'échelle)
  const local = (w) => { const dx = w[0] - f.x, dy = w[1] - f.y, dz = w[2] - f.z, c = Math.cos(f.dir || 0), s = Math.sin(f.dir || 0); return [(dx * c + dy * s) / K, (-dx * s + dy * c) / K, dz / K]; };
  return { B, K, add, rep, tete, bloc, os2, mi, pl, chaine, cadre, local };
}
function osBrume(f) {
  const O = outilsOs(f), k = f.sp.corps;
  if (k === 'mage') osMage(f, O); else if (k === 'rodeur') osRodeur(f, O); else if (k === 'demon') osDemon(f, O); else if (k === 'cercle') osCercle(f, O);
  return O.B;
}
// LE MAGE : une longue robe cramoisie qui s'évase, une ceinture de corde, des runes qui luisent sur le
// devant ; une capuche pointue sur un visage qui n'est qu'un trou noir, deux yeux rouges au fond ; de
// larges manches, des mains pâles. Il psalmodie les bras levés vers le pilier, un fil de sang de ses
// mains à la lumière ; au combat, le fouet de sang pend de sa main droite, s'arme et claque.
function osMage(f, O) {
  const { add, tete, bloc, os2, mi, pl, local } = O;
  const robe = [44, 8, 12], robeS = [26, 4, 8], ourlet = [16, 3, 5], corde = [150, 112, 54], main = [196, 176, 164], vide = [4, 1, 2];   // presque noirs : des silhouettes dans le rouge
  const E = f.etat, u = f.actT != null ? t - f.actT : 9, act = E === 'fouet' || E === 'volee' ? E : null, chant = E === 'psalmodier', peur = E === 'effroi';
  const mort = f.dead > 0 ? Math.min(1, f.dead) : 0, sc = (peur ? .74 : 1) * (1 - mort * .7), sw = chant ? Math.sin(t * 1.7 + (f.place || 0) * 2) * .06 : 0;
  const lean = peur ? .45 : act === 'fouet' ? (u < .5 ? -.1 : .18) : act === 'volee' ? .1 : 0, ox = z => (lean + sw) * z * .5;
  const pulse = .5 + .5 * Math.sin(t * 4 + (f.place || 0)), rune = [255, 50 + 50 * pulse | 0, 40];
  for (const [z, w, d, h] of [[.06, .62, .52, .12], [.22, .56, .48, .2], [.42, .5, .43, .2], [.62, .45, .39, .2], [.82, .41, .34, .2], [1.02, .39, .31, .2], [1.2, .42, .3, .18], [1.36, .46, .28, .12]]) {
    const zz = z * sc; add([ox(zz) - d / 2, 0, zz], [ox(zz) + d / 2, 0, zz], w, h * sc, z < .1 ? ourlet : robe);
    if (z > .3 && z < 1.1) add([ox(zz) + d / 2, 0, zz], [ox(zz) + d / 2 + .012, 0, zz], .05, .06, rune, true);   // les runes du devant
  }
  add([ox(1.12 * sc) - .17, 0, 1.12 * sc], [ox(1.12 * sc) + .17, 0, 1.12 * sc], .43, .045, corde);                       // la ceinture
  // la capuche, le trou noir du visage, les deux yeux
  const H = [ox(1.6 * sc) + (peur ? .14 : 0), 0, 1.6 * sc], M = tete(H, peur ? -.55 : chant ? .22 : 0, 0);
  bloc(M, -.17, .15, 0, .02, .32, .3, robe); bloc(M, -.16, .1, 0, .2, .24, .1, robe); bloc(M, -.22, -.06, 0, .27, .13, .09, robeS);
  bloc(M, -.1, .04, 0, -.15, .38, .08, robe);
  bloc(M, .1, .155, 0, .0, .2, .22, vide);
  for (const s of [-1, 1]) { bloc(M, .12, .162, s * .11, 0, .03, .26, robeS); bloc(M, .155, .16, s * .045, .03, .03, .022, [255, 60, 40], true); }
  bloc(M, .12, .162, 0, .125, .24, .03, robeS);
  // les bras, selon ce qu'il fait
  const mains = [];
  for (const s of [-1, 1]) {
    const Sh = [ox(1.34 * sc), s * .24, 1.34 * sc]; let El, Hd;
    if (chant) { El = pl(Sh, [.06, s * .14, .24]); Hd = pl(Sh, [.14, s * .08, .62]); }
    else if (peur) { El = pl(Sh, [.22, s * .1, .1]); Hd = pl(Sh, [.4, s * .04, .32]); }
    else if (act === 'volee') { El = pl(Sh, [.22, s * .02, -.06]); Hd = pl(Sh, [.44, -s * .1, .04]); }
    else if (act === 'fouet' && s < 0) {                       // la droite : armée en arrière, puis jetée en avant
      if (u < .48) { El = pl(Sh, [-.12, -.1, .2]); Hd = pl(Sh, [-.3, -.12, .46]); } else if (u < .9) { El = pl(Sh, [.26, -.04, 0]); Hd = pl(Sh, [.56, 0, -.08]); } else { El = pl(Sh, [.14, -.08, -.2]); Hd = pl(Sh, [.3, -.06, -.34]); }
    } else { El = pl(Sh, [.12, s * .06, -.22]); Hd = pl(Sh, [.3, s * .02, -.3]); }
    if (mort) { El = [El[0], El[1], El[2] * (1 - mort * .6)]; Hd = [Hd[0], Hd[1], Hd[2] * (1 - mort * .8)]; }
    os2(Sh, El, .13, robe); os2(El, Hd, .12, robe); os2(mi(El, Hd, .78), Hd, .14, robeS);
    const dd = [Hd[0] - El[0], Hd[1] - El[1], Hd[2] - El[2]], dl = Math.hypot(...dd) || 1, ud = dd.map(q => q / dl);
    const Pm = pl(Hd, ud.map(q => q * .08)); os2(Hd, Pm, .06, main);
    for (const q of [-.025, 0, .025]) os2(Pm, pl(Pm, [ud[0] * .06, ud[1] * .06 + q, ud[2] * .06]), .016, main);
    mains.push(Pm);
  }
  // le fil de sang, des mains au pilier ; les orbes de la volée ; le fouet
  if (chant) { const m = mi(mains[0], mains[1], .5); add(m, [R_CERCLE * .96, 0, 3 + Math.sin(t * 3) * .2], .022, .022, [255, 40, 40], true); }
  if (act === 'volee' && u < .75) for (const m of mains) os2(m, pl(m, [0, 0, .001]), .09 + .06 * Math.sin(t * 22), [255, 50, 40], true);
  if (!chant && !peur && !mort) {
    const H0 = mains[0], sang = [200, 16, 24];
    let T = null, e = 0;
    if (act === 'fouet' && u >= .45 && u < 1.05 && f.vise) { T = local(f.vise); e = u < .6 ? (u - .45) / .15 : u < .82 ? 1 : Math.max(0, 1 - (u - .82) / .23); }
    const N = 12; let prev = H0;
    for (let i = 1; i <= N; i++) {
      const s = i / N; let q;
      if (T && e > 0) {                                        // il claque : la lanière file vers la cible, en ondulant
        const w = Math.sin(s * 3.1416) * .3 * (1 - e) + Math.sin(s * 11 - u * 30) * .05;
        q = [H0[0] + (T[0] - H0[0]) * s * e, H0[1] + (T[1] - H0[1]) * s * e, H0[2] + (T[2] - H0[2]) * s * e + w];
      } else if (s < .55) { const k = s / .55; q = [H0[0] + .06 * k + Math.sin(t * 2 + k * 4) * .03, H0[1] - .02 * k, H0[2] + (.04 - H0[2]) * k * k]; }   // il pend jusqu'au sol…
      else { const a = (s - .55) * 7; q = [H0[0] + .06 + .32 * Math.sin(a), H0[1] - .02 - .32 * (1 - Math.cos(a)), .035]; }                       // …et s'enroule à ses pieds
      os2(prev, q, .04 * (1 - s * .5), sang, true); prev = q;
    }
  }
}
// LE RÔDEUR : un loup de fumée rouge, bas sur pattes, l'échine qui saille, une gueule qui s'ouvre quand il
// se ramasse ; ses pattes et sa queue se défont en brume.
function osRodeur(f, O) {
  const { add, tete, bloc, os2, pl, chaine, cadre } = O;
  const corps = [92, 12, 16], sombre = [46, 4, 8], fume = [120, 22, 26], oeil = [255, 70, 50];
  const ram = f.etat === 'ramasser', bond = f.etat === 'bondir' || f.etat === 'sauter', v = Math.min(1, (f.vit || 0) / 5), ph = (f.gph || 0) * 6.2832, mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const hz = (ram ? .34 : .5) * (1 - mort * .6), AN = [1.62, 1.57, 1.52, 1.48], S = chaine([-.45, 0, hz + .02], AN, .22), Q = k => cadre(S[k], AN[Math.min(k, 3)]);
  bloc(Q(0), -.12, .1, 0, 0, .22, .26, corps); bloc(Q(1), -.11, .08, 0, 0, .2, .26, corps); bloc(Q(2), -.14, .14, 0, 0, .26, .26, corps); bloc(Q(3), -.14, .12, 0, 0, .27, .22, corps);
  for (let k = 0; k < 4; k++) bloc(Q(k), -.17, -.12, 0, 0, .05, .08, sombre);                                            // l'échine
  const N = pl(S[4], [.14, 0, .1]), ouv = ram ? .8 : f.etat === 'sauter' ? .35 : bond ? 1 : .15 + .1 * Math.sin(t * 6);
  const M = tete(N, -.12, 0);
  bloc(M, -.06, .14, 0, 0, .18, .16, corps); bloc(M, .12, .3, 0, -.03, .1, .09, sombre); bloc(M, .1, .27, 0, -.1 - ouv * .05, .08, .03, sombre);
  if (ouv > .4) bloc(M, .12, .25, 0, -.07, .07, .03, [200, 40, 30], true);
  for (const s of [-1, 1]) { bloc(M, -.04, .02, s * .06, .13, .04, .1, sombre); bloc(M, .1, .13, s * .06, .04, .03, .025, oeil, true); }
  for (const [av, s] of [[1, 1], [1, -1], [0, 1], [0, -1]]) {
    const p = ph + (av ? 0 : Math.PI) + (s > 0 ? 0 : Math.PI), hip = av ? pl(S[3], [0, s * .1, -.06]) : pl(S[0], [0, s * .1, -.04]);
    const F = bond ? [hip[0] + (av ? .32 : -.34), s * .12, Math.max(.05, hip[2] - .3)] : [hip[0] + Math.sin(p) * .22 * v, s * .12, Math.max(0, Math.cos(p)) * .12 * v];
    const K = [(hip[0] + F[0]) / 2 + (av ? -.05 : .06), s * .115, (hip[2] + F[2]) / 2 + .03];
    os2(hip, K, .08, corps); os2(K, F, .055, sombre); os2(F, pl(F, [0, 0, -.001]), .09, fume);        // la patte, qui fume au sol
  }
  let q = S[0];
  for (let j = 1; j <= 4; j++) { const n = [S[0][0] - j * .14, Math.sin(t * 5 + j) * .05 * j, S[0][2] + .04 * j + Math.sin(t * 4 + j) * .03]; os2(q, n, .06 + j * .025, j < 3 ? corps : fume); q = n; }
}
// LE DÉMON : une brute voûtée de cinq mètres, sur des pattes de bouc ; d'énormes épaules, de longs bras
// aux griffes noires ; une tête de taureau aux deux cornes qui balaient vers l'arrière puis remontent ;
// des yeux et une gueule de braise ; la peau sombre fendue de lave qui palpite ; des épines sur l'échine,
// une queue en pointe. Il sort du cercle, rugit les bras ouverts, arme ses coups sous vos yeux.
// LA MARCHE (revue) : un pas lourd et lent (un cycle pour un peu plus de deux mètres), le pied posé recule
// sous lui sans glisser, celui qui avance se lève ; le corps plonge à chaque appui et se déhanche sur la
// jambe qui porte ; les bras balancent à l'opposé des jambes (le bras gauche avec la jambe droite).
// LA CHARGE (revue) : il gratte le sol du sabot droit, tête basse, en soufflant ; puis il se jette à quatre
// pattes et galope comme un gorille — les deux mains loin devant, puis les deux pattes de bouc qui
// poussent —, l'échine presque à l'horizontale, les cornes en avant.
const DEMON_PAS = .55;                                       // la demi-foulée (dans son repère) : un pas fait deux fois ça
// un genou par deux os de longueur donnée, entre deux points, plié vers « dir »
function genouD(A, B, L1, L2, dir) {
  const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], d0 = Math.hypot(dx, dy, dz) || 1, d = Math.min(L1 + L2 - .01, d0);
  const u = [dx / d0, dy / d0, dz / d0], a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const p = dir[0] * u[0] + dir[1] * u[1] + dir[2] * u[2]; let n = [dir[0] - u[0] * p, dir[1] - u[1] * p, dir[2] - u[2] * p]; const nl = Math.hypot(...n) || 1; n = n.map(q => q / nl);
  return [A[0] + u[0] * a + n[0] * h, A[1] + u[1] * a + n[1] * h, A[2] + u[2] * a + n[2] * h];
}
function osDemon(f, O) {
  const { B, add, tete, bloc, os2, mi, pl, chaine, cadre } = O;
  const peau = [64, 16, 14], sombre = [30, 8, 8], corne = [40, 32, 28], corneB = [86, 74, 62], ongle = [20, 16, 14];
  const E = f.etat, u = f.actT != null ? t - f.actT : 9, ph = (((f.gph || 0) % 1) + 1) % 1;
  const mort = f.dead > 0 ? Math.min(1, f.dead) : 0, respire = .5 + .5 * Math.sin(t * 1.6), lave = [255, 90 + 70 * respire * (1 - mort) | 0, 30];
  const rug = E === 'rugir' || E === 'surgir', sonne = f.sonne > t, galop = E === 'charger' && u >= .9 && !sonne, gratte = E === 'charger' && u < .9;
  const marche = !galop && !rug && !mort && !sonne && E !== 'marteler' && E !== 'revers';
  const v = marche ? Math.min(1, Math.max((f.vit || 0) / 2.2, (f._tour || 0) * .4)) : 0;
  // le pied d'une jambe dans son cycle (0 : il se pose devant) : à l'appui il recule à plat, en l'air il revient en se levant
  const cycle = (q, A, H) => q < .6 ? [A - 2 * A * q / .6, 0] : [-A + 2 * A * (q - .6) / .4, Math.sin(Math.PI * (q - .6) / .4) * H];
  // le corps : le plongeon à chaque appui, le déhanchement ; au galop, l'échine à l'horizontale qui tangue
  const bob = galop ? -.4 + Math.sin(ph * 6.2832) * .06 : gratte ? -.12 : sonne ? -.15 : -.08 * v * Math.cos(ph * 12.566) ** 2;
  const sway = marche ? .07 * v * Math.sin(ph * 6.2832) : 0;
  const plus = galop ? .72 + Math.sin(ph * 6.2832 + 1) * .08 : gratte ? .3 : sonne ? .15 : 0;
  const AN = [.25, .45, .62, .78].map(a => a + plus + (rug ? -.15 : 0)), S = chaine([0, sway, 1.15 + bob], AN, .22), Q = k => cadre(S[k], AN[Math.min(k, 3)]);
  bloc(Q(0), -.2, .18, 0, 0, .5, .26, peau); bloc(Q(1), -.22, .2, 0, 0, .52, .26, peau); bloc(Q(2), -.26, .26, 0, 0, .7, .26, peau);
  bloc(Q(3), -.26, .24, 0, 0, .9, .24, peau); bloc(Q(4), -.22, .1, 0, 0, .62, .16, sombre);
  for (let k = 1; k <= 4; k++) { const A = Q(k)(-.22, 0, 0); os2(A, pl(A, [-.08, 0, .2]), .06, corne); }                // les épines de l'échine
  for (const [k, a, b] of [[2, -.18, .1], [2, .05, .2], [3, -.25, -.05], [1, .1, -.1]]) { const R = Q(k); add(R(.27, a, -.08), R(.27, b, .06), .028, .028, lave, true); }   // la lave, dans les fentes
  // la tête : de taureau, les cornes, la gueule de braise ; elle dodeline au pas, plonge à la charge
  const N0 = Q(4)(.06, 0, .06), H = pl(N0, [.24, 0, .04]), ouv = rug ? .9 + .1 * Math.sin(t * 20) : E === 'revers' || E === 'marteler' ? .5 : gratte ? .3 + .2 * Math.sin(t * 9) : .12;
  os2(N0, H, .3, peau);
  const pitch = rug ? .45 : galop ? -.35 : gratte ? -.7 : sonne ? Math.sin(t * 9) * .3 : -.15 + .05 * v * Math.sin(ph * 12.566);
  const M = tete(H, pitch, sonne ? Math.sin(t * 7) * .25 : marche ? -sway * 1.5 : 0);
  bloc(M, -.14, .16, 0, .05, .34, .28, peau); bloc(M, .12, .2, 0, .14, .36, .07, sombre); bloc(M, .1, .3, 0, -.08, .26, .14, peau);
  bloc(M, .06, .28, 0, -.2 - ouv * .12, .22, .06, sombre); bloc(M, .12, .26, 0, -.14 - ouv * .06, .18, .03 + ouv * .1, lave, true);
  for (const s of [-1, 1]) {
    bloc(M, .2, .215, s * .09, .1, .06, .035, [255, 160, 60], true);
    for (const z of [-.1, -.17]) bloc(M, .27, .29, s * .07, z, .025, .05, [230, 220, 200]);                              // les crocs
    let p = M(-.02, s * .16, .2);                                                                                        // la corne : en arrière, puis vers le ciel
    [.14, .12, .1, .07, .045].forEach((w, i) => {
      const n = M(-.02 + [-.1, -.22, -.26, -.18, -.04][i], s * (.16 + [.1, .16, .18, .18, .16][i]), .2 + [.12, .26, .42, .56, .64][i]); os2(p, n, w, i < 3 ? corne : corneB); p = n; });
  }
  // les jambes de bouc : la hanche, le genou en avant, le jarret en arrière, le sabot
  const pieds = [];
  for (const s of [-1, 1]) {
    const hip = Q(0)(0, s * .24, 0); let F;
    if (galop) { const [x, z] = cycle(ph, .62, .34); F = [x - .25, s * .3, z]; }                                 // les deux pattes ensemble : elles poussent
    else if (gratte && s < 0) { const g = Math.sin(t * 11); F = [.12 + g * .26, s * .3, Math.max(0, g) * .1]; }   // le sabot droit gratte le sol
    else { const [x, z] = cycle((ph + (s > 0 ? 0 : .5)) % 1, DEMON_PAS * v, .24 * v); F = [x + .06, s * .29, z]; }
    const A = pl(F, [-.12, 0, .34]), K = genouD(hip, A, .55, .48, [1, 0, -.15]);
    os2(hip, K, .27, peau); os2(K, A, .19, peau); os2(A, F, .13, sombre); bloc(O.rep(F, [1, 0, 0], [0, 1, 0], [0, 0, 1]), -.06, .14, 0, .03, .17, .07, ongle);
    pieds.push(F);
  }
  // les bras : ils balancent à l'opposé des jambes ; au galop, ils deviennent des pattes de devant
  for (const s of [-1, 1]) {
    const Sh = Q(3)(0, s * .48, .05); let Hd, dirC = [-.2, s * .6, -.6];
    if (rug) Hd = pl(Sh, [.05, s * .7, .55]);
    else if (E === 'revers' && s < 0) Hd = u < .75 ? pl(Sh, [-.3, -.5, .75]) : pl(Sh, [.85, .3, -.15]);
    else if (E === 'marteler') Hd = u < 1.1 ? [Sh[0] + .32, s * .14, Sh[2] + .95] : [Sh[0] + .95, s * .14, .12];
    else if (galop) { const [x, z] = cycle((ph + .5) % 1, .55, .3); Hd = [Sh[0] + .35 + x * .8, s * .55, .1 + z]; dirC = [-.5, s * .5, .3]; }   // les mains loin devant, à plat
    else if (gratte) Hd = pl(Sh, [.35, s * .2, -.75]);
    else if (sonne) Hd = pl(Sh, [.2 + Math.sin(t * 5 + s) * .1, s * .15, -.85]);
    else { const [x] = cycle((ph + (s > 0 ? .5 : 0)) % 1, DEMON_PAS * v, 0); Hd = pl(Sh, [.32 + x * .55, s * .14, -.88]); }   // à l'opposé de la jambe du même côté
    const El = genouD(Sh, Hd, galop ? .62 : .52, galop ? .6 : .5, dirC);
    os2(Sh, El, .22, peau); os2(El, Hd, .18, peau); add(mi(Sh, El, .2), mi(Sh, El, .8), .03, .03, lave, true);
    const dd = [Hd[0] - El[0], Hd[1] - El[1], Hd[2] - El[2]], dl = Math.hypot(...dd) || 1, ud = dd.map(q => q / dl), Pm = galop ? pl(Hd, [.12, 0, -.06]) : pl(Hd, ud.map(q => q * .14));
    os2(Hd, Pm, .2, sombre);
    for (const q of [-.07, -.023, .023, .07]) { const a = pl(Pm, [0, q, 0]); os2(a, galop ? pl(a, [.16, q * .3, -.04]) : pl(a, [ud[0] * .16 + .04, ud[1] * .16 + q * .3, ud[2] * .16 - .05]), .045, ongle); }
  }
  let q = S[0];                                                                                                          // la queue, en pointe, qui fouette
  for (let j = 1; j <= 5; j++) { const n = [S[0][0] - j * .2, S[0][1] + Math.sin(t * 1.3 + j * .6 + ph * 6.28) * .07 * j, S[0][2] - .08 * j + .02 * j * j + (galop ? .05 * j : 0)]; os2(q, n, .16 - j * .022, peau); q = n; }
  os2(q, pl(q, [-.14, 0, .06]), .09, corne);
  // il sort du cercle, ou s'effondre : tout descend
  const bas = (1 - (f.emerge ?? 1)) * 2.7 + mort * 1.3;
  if (bas) for (const o of B) { o.a = [o.a[0], o.a[1], o.a[2] - bas]; o.b = [o.b[0], o.b[1], o.b[2] - bas]; }
}
// La cadence de leurs pas, ici comme chez qui les voit passer (faune.js) : le démon pose un pied pour un peu
// plus de deux mètres (sans glisser : la cadence suit la vitesse) et fait trembler le sol ; au galop, près de deux bonds et demi par seconde ; tourner sur place le fait
// piétiner ; les Rôdeurs trottent vite ; les mages glissent sous leur robe.
function pasBrumeVisuel(b, dt) {
  const k = b.sp.corps, avant = b.gph || 0;
  if (k === 'demon') {
    let dd = (b.dir || 0) - (b._dirV ?? b.dir ?? 0); while (dd > Math.PI) dd -= 6.2832; while (dd < -Math.PI) dd += 6.2832; b._dirV = b.dir;
    const galop = b.etat === 'charger' && b.actT != null && t - b.actT >= .9 && !(b.sonne > t);
    const marche = b.etat === 'chasser' || b.etat === 'massacrer';
    // sans glisser : à l'appui (60 % du cycle) le pied recule d'une foulée, juste ce que le corps avance
    const vv = b.vit || 0, tour = Math.abs(dd) / Math.max(dt, 1e-3); b._tour = Math.min(1, tour * .5);
    const amp = 2 * DEMON_PAS * (b.sp.sz || 1) * Math.max(Math.min(1, vv / 2.2), b._tour * .4);
    const pas = galop ? 2.4 : marche ? Math.max(amp > .01 ? vv * .6 / amp : 0, tour * .35) : 0;
    b.gph = avant + dt * Math.min(2.4, pas);
    if ((pas > .2) && Math.floor(avant * 2) !== Math.floor(b.gph * 2)) {                 // un pied (ou les mains) frappe le sol
      const d = Math.hypot(b.x - P.x, b.y - P.y);
      SON.jouer('pasDemon', {}, b.x, b.y, b.z);
      if (d < 16) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, (galop ? .35 : .18) * (1 - d / 16)); }
      for (let j = 0; j < 6; j++) parts.push({ x: b.x + (Math.random() - .5) * 2, y: b.y + (Math.random() - .5) * 2, z: b.z + .05, vx: (Math.random() - .5) * 1.5, vy: (Math.random() - .5) * 1.5, vz: .6 + Math.random(), g: 3, life: .6, age: 0, col: '#4a3a30', tl: .08 });
    }
  } else if (k === 'rodeur') b.gph = avant + dt * Math.min(3.2, (b.vit || 0) / .5);
  else b.gph = avant + dt * (b.vit || 0) * .9;
}
// LE CERCLE : deux anneaux de runes au sol, un pentagramme, des glyphes ; au centre, un pilier de lumière
// rouge qui monte dans la brume et s'épaissit à mesure que l'incantation avance. Levée : des runes éteintes.
function osCercle(f, O) {
  const { add, os2 } = O, on = f.etat === 'chant' || f.etat === 'demon', k = Math.min(1, .25 + SANG.incant * .75);
  const col = i => on ? [255, 40 + 40 * (.5 + .5 * Math.sin(t * 3 + i * .5)) | 0, 30] : [52, 10, 10];
  const anneau = (R, n, w) => { for (let i = 0; i < n; i++) { const a0 = i / n * 6.2832, a1 = (i + .8) / n * 6.2832; add([Math.cos(a0) * R, Math.sin(a0) * R, .03], [Math.cos(a1) * R, Math.sin(a1) * R, .03], w, .02, col(i), on); } };
  anneau(4.2, 30, .1); anneau(2.3, 18, .08);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.2832 - 1.5708, b = (i + 2) / 5 * 6.2832 - 1.5708; add([Math.cos(a) * 2.3, Math.sin(a) * 2.3, .035], [Math.cos(b) * 2.3, Math.sin(b) * 2.3, .035], .07, .02, col(i * 3), on); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 + .2, x = Math.cos(a) * 3.65, y = Math.sin(a) * 3.65; add([x - .12, y, .03], [x + .12, y, .03], .05, .02, col(i), on); add([x, y - .12, .03], [x, y + .12, .03], .05, .02, col(i + 1), on); }
  if (on) { os2([0, 0, .05], [0, 0, 14], .25 + .55 * k + .05 * Math.sin(t * 7), [255, 36, 32], true); os2([0, 0, .05], [0, 0, 14], .1 + .2 * k, [255, 190, 170], true); }
}

// ---------- la musique : « La Valse rouge » ----------
// Un morceau de combat écrit pour la brume (composition originale), joué par le moteur du jeu : des cordes,
// une basse, une batterie, des timbales et des toms, un chœur, des cuivres, un violon solo, des cloches,
// une salle qui résonne. En 6/8, ré mineur, la croche à 0,19 s. Cinq parties qui s'enchaînent selon le
// danger (brumeIntensite) : l'OUVERTURE (un bourdon, le chœur qui monte, l'horloge des pizzicati), le
// RIFF (l'ostinato des cordes, la batterie), le THÈME (le violon chante par-dessus, les cuivres, le chœur),
// le SOMMET (tout, une octave plus haut, deux violons, les cuivres à chaque mesure, les timbales), et le
// PONT (un cœur qui bat, les cloches qui rappellent le thème, puis la montée et le roulement de caisse).
// valseBrume(ctx, sortie) rend un lecteur : lecteur.maj(maintenant, intensité), appelé à chaque image ;
// il pose les notes une demi-seconde à l'avance. Le même code sert au rendu hors ligne (essais).
function valseBrume(ctx, sortie, depart = 'O') {          // (depart : une autre partie pour commencer, pour les essais)
  const E = .19, f = n => 293.66 * 2 ** (n / 12);
  // la sortie : un bus, une salle (réverbération) propre au morceau, un compresseur qui tient l'ensemble
  const bus = ctx.createGain(); bus.gain.value = .55;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = .006; comp.release.value = .2;
  bus.connect(comp); comp.connect(sortie);
  const salle = ctx.createConvolver(), L = Math.round(ctx.sampleRate * 2.1), ir = ctx.createBuffer(2, L, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < L; i++) { const x = i / L; d[i] = i < ctx.sampleRate * .012 ? 0 : (Math.random() * 2 - 1) * Math.pow(1 - x, 2.4) * (1 - .5 * x); } }
  salle.buffer = ir; const retour = ctx.createGain(); retour.gain.value = .32; salle.connect(retour); retour.connect(bus);
  const BR = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), bd = BR.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
  // Les places : cinq positions dans l'espace, chacune sèche ou dans la salle, créées une fois pour toutes ;
  // une note n'y ajoute que son gain d'enveloppe (sinon, au sommet, le son coûtait trop cher à un téléphone).
  const PLACES = [-.3, -.15, 0, .15, .3], SORTIES = PLACES.map(pan => [.06, .45].map(verb => {
    const G = ctx.createGain(); let n = G;
    if (pan && ctx.createStereoPanner) { const P = ctx.createStereoPanner(); P.pan.value = pan; G.connect(P); n = P; }
    n.connect(bus); const S = ctx.createGain(); S.gain.value = verb; n.connect(S); S.connect(salle); return G;
  }));
  const voie = (verb, pan = 0) => {
    const i = Math.max(0, Math.min(4, Math.round((pan + .3) / .15))), G = ctx.createGain();
    G.connect(SORTIES[i][verb > .2 ? 1 : 0]); return G;
  };
  const env = (G, t0, a, pic, tenue, rel) => { const g = G.gain; g.setValueAtTime(.0001, t0); g.exponentialRampToValueAtTime(Math.max(.0002, pic), t0 + a); if (tenue > 0) g.setValueAtTime(Math.max(.0002, pic), t0 + a + tenue); g.exponentialRampToValueAtTime(.0001, t0 + a + tenue + rel); return t0 + a + tenue + rel + .02; };
  const osc = (type, fr, t0, fin, dest, det = 0) => { const O = ctx.createOscillator(); O.type = type; O.frequency.setValueAtTime(fr, t0); if (det) O.detune.value = det; O.connect(dest); O.start(t0); O.stop(fin); return O; };
  const bruit = (t0, fin, dest) => { const S = ctx.createBufferSource(); S.buffer = BR; S.loop = true; S.connect(dest); S.start(t0, Math.random() * 1.5); S.stop(fin); return S; };
  const filtre = (type, fr, q, dest) => { const F = ctx.createBiquadFilter(); F.type = type; F.frequency.value = fr; F.Q.value = q; F.connect(dest); return F; };
  // ---- les instruments ----
  const corde = (fr, t0, d, v, pan = 0, mince) => {                  // les cordes piquées (spiccato) : trois scies, un filtre qui se referme
    const G = voie(.32, pan), fin = env(G, t0, .006, v, d * .25, .11), F = filtre('lowpass', 900, 1.2, G);
    F.frequency.setValueAtTime(6000, t0); F.frequency.exponentialRampToValueAtTime(1900, t0 + d);
    for (const c of mince ? [0] : [-8, 8]) osc('sawtooth', fr, t0, fin, F, c);
  };
  const violon = (fr, t0, d, v, pan = .12, seul) => {               // le violon solo : l'archet qui attaque, le vibrato qui vient
    const G = voie(.5, pan), fin = env(G, t0, .07, v, Math.max(0, d - .07), .3), F = filtre('lowpass', 6500, .9, G), B = filtre('peaking', 3000, 1.2, F); B.gain.value = 6;
    const Lf = ctx.createOscillator(), Lg = ctx.createGain(); Lf.frequency.value = 5.6; Lg.gain.setValueAtTime(0, t0); Lg.gain.linearRampToValueAtTime(fr * .008, t0 + Math.min(.35, d * .6)); Lf.connect(Lg); Lf.start(t0); Lf.stop(fin);
    for (const c of seul ? [0] : [-6, 6]) { const O = osc('sawtooth', fr * .985, t0, fin, B, c); O.frequency.exponentialRampToValueAtTime(fr, t0 + .05); Lg.connect(O.frequency); }
  };
  const basse = (fr, t0, d, v) => { const G = voie(.04), fin = env(G, t0, .006, v, d * .45, .22), F = filtre('lowpass', 420, 1.5, G), S = ctx.createGain(); S.gain.value = .35; S.connect(G); osc('sawtooth', fr, t0, fin, F); osc('sine', fr, t0, fin, S); };
  const grosse = (t0, v) => {                                 // la grosse caisse : une chute de hauteur, un claquement
    const G = voie(.08), fin = env(G, t0, .002, v, .02, .32), O = osc('sine', 155, t0, fin, G); O.frequency.exponentialRampToValueAtTime(48, t0 + .12);
    const C = voie(0), F = filtre('highpass', 3200, .7, C); env(C, t0, .001, v * .45, 0, .025); bruit(t0, t0 + .05, F);
  };
  const caisse = (t0, v, court) => {                          // la caisse claire : du bruit et un ton
    const G = voie(.35, -.06), fin = env(G, t0, .002, v, 0, court ? .09 : .17); bruit(t0, fin, filtre('bandpass', 1900, .8, G));
    const T = voie(.2, -.06), f2 = env(T, t0, .002, v * .5, 0, .09); const O = osc('triangle', 210, t0, f2, T); O.frequency.exponentialRampToValueAtTime(165, t0 + .08);
  };
  const charley = (t0, v, ouvert) => { const G = voie(.08, .25), fin = env(G, t0, .001, v, 0, ouvert ? .2 : .035); bruit(t0, fin, filtre('highpass', 7600, .7, G)); };
  const crash = (t0, v) => { const G = voie(.4, -.2), fin = env(G, t0, .002, v, .05, 1.7), F = filtre('highpass', 4800, .6, G); bruit(t0, fin, F); };
  const tom = (fr, t0, v) => { const G = voie(.5, fr > 130 ? .2 : -.2), fin = env(G, t0, .003, v, .02, .32), O = osc('sine', fr * 1.5, t0, fin, G); O.frequency.exponentialRampToValueAtTime(fr, t0 + .1); const N = voie(.3), f2 = env(N, t0, .002, v * .3, 0, .06); bruit(t0, f2, filtre('lowpass', 500, .7, N)); };
  const timbale = (fr, t0, v, rel = .9) => { const G = voie(.5), fin = env(G, t0, .004, v, .02, rel), O = osc('sine', fr * 1.06, t0, fin, G); O.frequency.exponentialRampToValueAtTime(fr, t0 + .15); osc('triangle', fr * 2.01, t0, Math.min(fin, t0 + .4), G); };
  const choeur = (fr, t0, d, v, voy = 'a', pan = 0) => {      // des voix : quatre scies désaccordées, trois formants, un vibrato
    const G = voie(.75, pan), fin = env(G, t0, .45, v, Math.max(0, d - .45), .9), Fm = voy === 'a' ? [[730, 6, 1.1], [1090, 8, .7]] : [[480, 6, 1.1], [820, 8, .55]];
    const Sm = ctx.createGain(); Sm.gain.value = 1;
    for (const [fq, q, g] of Fm) { const F = ctx.createBiquadFilter(), Gf = ctx.createGain(); F.type = 'bandpass'; F.frequency.value = fq; F.Q.value = q; Gf.gain.value = g * 3.6; Sm.connect(F); F.connect(Gf); Gf.connect(G); }
    const Lf = ctx.createOscillator(), Lg = ctx.createGain(); Lf.frequency.value = 4.8; Lg.gain.value = fr * .006; Lf.connect(Lg); Lf.start(t0); Lf.stop(fin);
    for (const c of [-9, 9]) { const O = osc('sawtooth', fr, t0, fin, Sm, c); Lg.connect(O.frequency); }
  };
  const cuivre = (frs, t0, d, v) => {                         // les cuivres : l'éclat qui s'ouvre puis se referme
    for (const fr of frs) {
      const G = voie(.38, (Math.random() - .5) * .3), fin = env(G, t0, .02, v, d, .16), F = filtre('lowpass', 500, 2, G);
      F.frequency.setValueAtTime(500, t0); F.frequency.exponentialRampToValueAtTime(5000, t0 + .05); F.frequency.exponentialRampToValueAtTime(1400, t0 + .05 + d);
      for (const c of [-7, 7]) { const O = osc('sawtooth', fr * .97, t0, fin, F, c); O.frequency.exponentialRampToValueAtTime(fr, t0 + .04); }
    }
  };
  const cloche = (fr, t0, v) => { for (const [r, g, dd] of [[1, 1, 2.2], [2.76, .35, 1.2], [5.4, .15, .6], [8.9, .06, .3]]) { const G = voie(.6, .15), fin = env(G, t0, .002, v * g, 0, dd); osc('sine', fr * r, t0, fin, G); } };
  const pizz = (fr, t0, v, pan) => { const G = voie(.3, pan), fin = env(G, t0, .003, v, 0, .16), F = filtre('lowpass', 2200, .8, G); osc('triangle', fr, t0, fin, F); osc('sawtooth', fr, t0, fin, filtre('lowpass', 1400, .7, G)); };
  const bourdon = (fr, t0, d, v) => { const G = voie(.5), fin = env(G, t0, 1.5, v, Math.max(0, d - 2), 2), F = filtre('lowpass', 520, .9, G); osc('sawtooth', fr, t0, fin, F, -5); osc('sawtooth', fr * 1.5, t0, fin, F, 5); osc('sine', fr / 2, t0, fin, G); };
  const montee = (t0, d, v) => { const G = voie(.5), fin = env(G, t0, d * .9, v, 0, .15), F = filtre('bandpass', 400, 1.4, G); F.frequency.setValueAtTime(350, t0); F.frequency.exponentialRampToValueAtTime(7000, t0 + d); bruit(t0, fin, F); };
  // ---- la partition ----
  const Dm = [0, 3, 7], C = [-2, 2, 5], Bb = [-4, 0, 3], A = [-5, -1, 2], F = [3, 7, 10], Gm = [-7, -4, 0];
  const PARTIES = {
    O: { acc: [Dm, Dm, Bb, A] },
    R: { acc: [Dm, Dm, Bb, Bb, Gm, Gm, A, A] },
    T: { acc: [Dm, C, Bb, A, Dm, F, [Gm, A], Dm],
         chant: [[[12, 3], [10, 1], [12, 1], [15, 1]], [[14, 4], [12, 1], [10, 1]], [[10, 3], [8, 1], [10, 1], [12, 1]], [[11, 3], [7, 3]],
                 [[12, 3], [10, 1], [12, 1], [15, 1]], [[19, 4], [17, 1], [15, 1]], [[17, 2], [15, 1], [14, 2], [11, 1]], [[12, 6]]] },
    S: { acc: [Bb, C, Dm, Dm, Bb, C, A, A],
         chant: [[[10, 2], [12, 1], [15, 3]], [[14, 3], [15, 1], [14, 1], [12, 1]], [[12, 6]], [[7, 2], [10, 2], [12, 2]],
                 [[17, 3], [15, 1], [14, 1], [15, 1]], [[19, 3], [17, 3]], [[23, 3], [19, 3]], [[19, 2], [17, 2], [14, 2]]] },
    P: { acc: [Dm, Dm, Bb, Bb, Gm, Gm, A, A] },
  };
  const suite = (p, I, n) => p === 'O' ? 'R' : p === 'R' ? (I < .5 ? 'P' : 'T') : p === 'T' ? (I > .75 ? 'S' : 'R') : p === 'S' ? (I > .85 && n % 2 ? 'T' : I > .85 ? 'S' : 'P') : (I > .6 ? 'S' : 'R');
  // l'harmonie du second violon : la note de l'accord juste en dessous (d'une tierce au moins)
  const tierce = (n, ac) => { let best = n - 12; for (const a of ac) for (const o of [-12, 0, 12, 24]) { const q = a + o; if (q <= n - 3 && q > best) best = q; } return best; };
  const st = { t: 0, p: 'O', m: 0, s: 0, n: 0, ok: false };
  function pas(t0, I) {
    const Pt = PARTIES[st.p], m = st.m, s = st.s, bar = Pt.acc[m], ac = Array.isArray(bar[0]) ? (s < 3 ? bar[0] : bar[1]) : bar, R = ac[0];
    const T3 = ac[1], Q5 = ac[2], nb = Pt.acc.length, p = st.p, k = .6 + .4 * I;
    const riff = (oct, v, pan, mince) => {
      const pat = m % 2 ? [R, Q5, R + 12, T3 + 12, Q5 + 12, T3 + 12] : [R, Q5, R + 12, Q5, T3 + 12, Q5];
      corde(f(pat[s] - 12 + oct), t0, E * .85, v * (s === 0 || s === 3 ? 1.25 : 1), pan, mince);
    };
    const leChant = (oct, v, harm) => { let b = 0; for (const [n, d] of Pt.chant[m]) { if (b === s) { violon(f(n + oct), t0, d * E * .97, v); if (harm) violon(f(tierce(n, ac) + oct), t0, d * E * .97, v * .7, -.15, true); } b += d; } };
    if (p === 'O') {                                          // l'ouverture
      if (m === 0 && s === 0) { bourdon(f(-24), t0, nb * 6 * E, .05 * k); choeur(f(-12), t0, nb * 6 * E, .05, 'o'); choeur(f(-5), t0 + E * 6, (nb - 1) * 6 * E, .04, 'o', .2); }
      if (s === 0) timbale(f(R - 24), t0, .22 * k);
      pizz(f(s % 2 ? 19 : 12), t0, .03 + .015 * (s === 0), s % 2 ? .3 : -.3);
      if (m === nb - 1 && s === 0) montee(t0, 6 * E, .07);
      if (m === nb - 1 && s >= 3) tom([150, 125, 100][s - 3], t0, .28);
    } else if (p === 'P') {                                   // le pont : un cœur qui bat, les cloches, puis la montée
      if (m === 0 && s === 0) { bourdon(f(-24), t0, 6 * 6 * E, .04); choeur(f(-12), t0, 6 * 6 * E, .04, 'o'); }
      if (m < 6) {
        if (s === 0) grosse(t0, .35); if (s === 1) grosse(t0, .22);
        if (s === 0 || s === 3) { const ch = PARTIES.T.chant[m]; cloche(f((s === 0 ? ch[0][0] : ch[Math.min(ch.length - 1, 1)][0])), t0, .06); }
        if (s === 0) basse(f(R - 24), t0, E * 5, .1);
      } else {
        if (m === 6 && s === 0) { montee(t0, 12 * E, .1); timbale(f(-24), t0, .2, 2.2); }
        const r = ((m - 6) * 6 + s) / 12;                     // le roulement : deux coups par croche, qui enflent
        caisse(t0, .06 + .22 * r, true); caisse(t0 + E / 2, .06 + .22 * r, true);
        if (m === 7 && s === 5) { tom(110, t0, .4); tom(90, t0 + E / 2, .45); }
      }
    } else {                                                  // le riff, le thème, le sommet
      const sommet = p === 'S', theme = p === 'T' || sommet, plein = I > .45;
      if (sommet) { riff(12, .07 * k, -.3); riff(0, .05 * k, .3, true); }           // au sommet, le violon chante une octave au-dessus : les cordes montent
      else if (theme) { riff(0, .075 * k, -.3); riff(12, .032 * k, .3, true); }  // (riff 0 : altos et violoncelles ; 12 : violons)
      else { riff(0, .07 * k, -.3); riff(12, .045 * k, .3, true); }
      if (s === 0 || s === 3) basse(f(R - 24 + (sommet && s === 3 ? 12 : 0)), t0, E * 2.6, .13 * k);
      if (s === 0) grosse(t0, .45); if (s === 3) { if (plein) caisse(t0, .34); else grosse(t0, .3); }
      if (plein && ((m % 2 && s === 5) || (sommet && s === 2))) grosse(t0, .4);
      if (plein) charley(t0, s === 0 || s === 3 ? .1 : .065, sommet && m % 2 && s === 5);
      if (m === 0 && s === 0 && theme) crash(t0, sommet ? .22 : .14);
      if (s === 0 && (theme || I > .55)) for (const [i, n] of [[0, ac[0] - 12], [1, ac[1]], [2, ac[2]]]) choeur(f(n), t0, 6 * E, (sommet ? .07 : .05) * k, sommet ? 'a' : 'o', (i - 1) * .3);
      if (theme) leChant(sommet ? 12 : 0, sommet ? .06 : .055, sommet);
      if (p === 'T' && (m === 0 || m === 4) && s === 0) cuivre([f(R - 12), f(Q5 - 12), f(T3)], t0, E * 2, .04);
      if (sommet && s === 0) cuivre([f(R - 12), f(T3)], t0, E * 2.4, .055);
      if (sommet && m % 2 && s === 5) cuivre([f(R - 12), f(T3)], t0, E * .7, .045);
      if (sommet && (s === 0 || s === 3)) timbale(f(R - 24), t0, .17, .6);
      if ((m === 3 && sommet) || m === nb - 1) if (s >= 3) tom([170, 140, 110][s - 3], t0, .32);   // les roulements de toms
    }
    // la croche suivante
    if (++st.s === 6) { st.s = 0; if (++st.m === nb) { st.m = 0; st.n++; st.p = suite(p, I, st.n); } }
  }
  return {
    maj(now, I) {
      if (!st.ok || st.t < now - .5) { st.ok = true; st.t = now + .08; st.p = depart; st.m = 0; st.s = 0; }   // (re)partir de l'ouverture
      while (st.t < now + .5) { pas(st.t, Math.max(0, Math.min(1, I))); st.t += E; }
    },
    get partie() { return st.p; },
  };
}
