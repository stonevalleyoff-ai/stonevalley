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
// elle se lève sur l'île. Mais s'ils achèvent leur incantation (une minute trente, plus lente à mesure qu'ils
// tombent ; une barre en haut de l'écran dit le temps qu'il reste), un DÉMON cornu sort du cercle, massacre les mages, puis s'en prend à vous ; la brume se
// retire d'un coup et l'île bascule : elle devient démoniaque (§162, plus bas), et ne guérit, lentement, qu'à sa mort.
// Le jeu (index.html, etats.js) appelle, s'ils existent :
//   brumeIle()          à chaque île marquée « brume » (etatsIle) ;
//   brumeSang()         l'épaisseur de la brume ici, de 0 à 1 (le ciel, le brouillard, la musique) ;
//   fureurIci(b)        la cible d'une bête prise de fureur, ou null (majBete) ;
//   majBrume(dt)        à chaque image (majEtats) ;
//   dessinerBrume(...)  l'image, par-dessus le monde (dessinerFiltre) ;
//   majBrumeBete(b, dt) les mages, les Rôdeurs, le démon, le cercle (majBete) ; osBrume(f) leurs volumes ;
//   butinBrume(b)       ce qu'ils laissent (butin) ; brumeMonde / brumeAppliquer : l'état du cercle, partagé (faune.js).
// L'île démoniaque (§162) : enferGL (la carte graphique), enferCss (le canvas), enferCielK (le ciel), laveIci (la
// pêche), enferFaune (capEsp), enferMusique (la valse) ; P.enfers est sauvegardé (index.html).

const SANG = { k: 0, annonce: false, chantT: 0, cercle: null, incant: 0, phase: 'libre', total: 0, invT: 0, seuil: 0, leveeT: 0, dirT: 0 };
const INCANT_DUREE = 90;                                   // l'incantation complète : une minute trente, tous les mages vivants
const NB_MAGES = 6, R_CERCLE = 3.2;
const BRUME_PORTEE = 12;                                   // la fureur ne voit pas plus loin que la brume

function brumeIle() {
  Object.assign(SANG, { k: 1, annonce: false, incant: 0, phase: 'chant', total: NB_MAGES, invT: t + 12, seuil: 0, leveeT: 0, dirT: t + 8, cercle: null, calme: false });
  ENF.seed = null; ENF.poser = [];
  if (typeof djIci === 'function' && djIci()) { SANG.k = 0; SANG.phase = 'libre'; SANG.cercle = null; return; }   // (§163) sous l'île, ni cercle ni mages
  if (!specById.mage_sang) return;
  const C = SANG.cercle = placerCercle();
  const c = naitre(specById.cercle_sang, C.x, C.y); c.variante = null; c.z = C.z; c.pv = 1; c.age = 1e6; c.ech = 1; c.etat = 'chant'; beasts.push(c);
  for (let k = 0; k < NB_MAGES; k++) {
    const a = k / NB_MAGES * 6.2832, m = naitre(specById.mage_sang, C.x + Math.cos(a) * R_CERCLE, C.y + Math.sin(a) * R_CERCLE);
    m.variante = null; m.z = sol(m.x, m.y); m.pv = 1; m.age = 1e6; m.ech = 1; m.place = a; m.etat = 'psalmodier'; m.dir = m.dirT = a + Math.PI;
    m.blinde = 1 + Math.max(0, profondeur() - 8) * .05; beasts.push(m);
  }
  const levee = (P.brumesLevees || []).includes(SEED);
  if (levee) {                                             // déjà levée par vous : le cercle reste éteint (les numéros des bêtes restent pris)
    SANG.k = 0; SANG.phase = 'libre'; for (const b of beasts) if (b.sp.brume) b.horsJeu = true;
  }
  reprendreEnfer(true);                                    // (§162) l'île démoniaque, telle que vous l'avez laissée
}
// Au retour sur une île, la sauvegarde n'est lue qu'APRÈS la construction de l'île (index.html : loadWorld, puis
// demarrerSauvegarde ou adopter, qui appellent ceci) : on remet alors l'île dans l'état où vous l'avez laissée — la
// brume levée (avant le §162, elle revenait au retour), les livres déjà lus, l'île démoniaque.
function brumeReprise() {
  if (typeof LUTRINS !== 'undefined') for (const l of LUTRINS) if (l.brume && !l.lu) l.lu = (P.brumeTomes || []).includes(SEED + '.' + l.brume);
  if (ETAT.id !== 'brume' || !SANG.cercle || (typeof djIci === 'function' && djIci())) return;
  if (enferEtat() && !enferIci()) return reprendreEnfer(false);
  if ((P.brumesLevees || []).includes(SEED) && SANG.phase === 'chant') {
    SANG.k = 0; SANG.phase = 'libre'; SANG.calme = true;
    for (const b of beasts) if (b.sp.brume) oterBete(b, false);
  }
}
const oterBete = (b, chargement) => { if (chargement) b.horsJeu = true; else if (!b.retire && !b.dead) { b.retire = true; retraits++; } };   // (au chargement, son numéro reste pris)
// Le démon vous attend (vous êtes parti pendant le combat), ou l'île guérit.
function reprendreEnfer(chargement) {
  const E = enferEtat(), C = SANG.cercle; if (!E || !C || !specById.demon_sang) return;
  const g = E[1] ? (Date.now() - E[1]) / 1000 / ENFER_GUERIR : 0;
  if (g >= 1) { delete P.enfers[SEED]; return; }
  const levee = (P.brumesLevees || []).includes(SEED);
  SANG.calme = true; SANG.k = 0; SANG.incant = 1;
  for (const b of beasts) if (estMage(b) || b.sp.corps === 'rodeur' || (levee && b.sp.brume)) oterBete(b, chargement);
  if (levee) SANG.phase = 'libre';
  else {
    SANG.phase = 'demon';
    if (!beasts.some(b => b.sp.corps === 'demon' && !b.dead && !b.horsJeu && !b.retire)) {
      const d = naitre(specById.demon_sang, C.x, C.y); d.variante = null; d.z = C.z; d.pv = 1; d.age = 1e6; d.ech = 1; d.emerge = 1; d.phaseD = 'chasser'; d.etat = 'chasser';
      d.blinde = 1 + Math.max(0, profondeur() - 8) * .06; d.dir = d.dirT = Math.atan2(P.y - C.y, P.x - C.x); beasts.push(d);
    }
  }
  debutEnfer(false);
  for (const q of ENF.poser) if (q[4] > g) poserPlanteEnfer(q, false);
  ENF.poser = [];
  const kf = enLisse(.55, 1, g);                            // la faune ordinaire : brûlée ; elle revient avec la guérison
  beasts.forEach((b, k) => { if (fauneOrdinaire(b) && (k * .618034) % 1 >= kf) oterBete(b, chargement); });
}
// Le cercle : sur un replat, loin de l'arrivée (35 à 80 cases), plutôt en hauteur ; la flore y est rasée.
// Jamais à moins de 10 cases d'un lutrin des matières ni de l'arche : le seul livre du cercle est le sien.
// (Le hasard est celui de la graine : brumeIle tourne sous avecHasardDe, le cercle est le même à chaque visite.)
function placerCercle() {
  const S = P.spawn || [P.x, P.y]; let best = null, bs = -1e9;
  const A = (typeof PortailIle !== 'undefined' && PortailIle) || (typeof PortailCache !== 'undefined' && PortailCache), L = typeof LUTRINS !== 'undefined' ? LUTRINS : [];
  const libre = (x, y) => !(A && Math.hypot(A.x - x, A.y - y) < 10) && !L.some(l => Math.hypot(l.x - x, l.y - y) < 10);
  for (let k = 0; k < 260; k++) {
    const a = Math.random() * 6.2832, r = 35 + Math.random() * 45, x = (S[0] + Math.cos(a) * r) | 0, y = (S[1] + Math.sin(a) * r) | 0;
    if (x < 12 || y < 12 || x >= WS - 12 || y >= WS - 12) continue;
    const h = hAt(x, y); if (h <= SEA + 1 || !libre(x + .5, y + .5)) continue;
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
  if (ETAT.id === 'brume') { majCercle(dt); majTomesBrume(); majEnfer(dt); }
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
  { id: 'larve_braise', n: 'Larve de braise', corps: 'larve', brume: 1, enfer: 1, diet: 'c', sz: .8, spd: 2.6, vue: 14, peur: 0, herd: 0, cap: 0, mat: 9999,   // (§162)
    shell: [44, 26, 22], dark: [24, 14, 12], leg: [44, 26, 22], oeil: [255, 196, 90], bio: [], dur: .6, lien: 0, chasse: [], travail: {}, metier: 'sort du sol de l\'île démoniaque', grimpe: 0 },
  { id: 'diablotin', n: 'Diablotin', corps: 'diablotin', brume: 1, enfer: 1, diet: 'c', sz: .8, spd: 3.6, vue: 18, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [168, 34, 28], dark: [120, 22, 20], leg: [120, 22, 20], oeil: [255, 220, 80], bio: [], dur: .9, lien: 0, chasse: [], travail: {}, metier: 'jaillit d\'une fente rouge', grimpe: 0 },
  { id: 'cercle_sang', n: 'Cercle de sang', corps: 'cercle', brume: 1, cercle: 1, batiment: 1, diet: 's', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [180, 20, 24], dark: [60, 6, 8], leg: [60, 6, 8], oeil: [255, 60, 40], bio: [], dur: 1e9, lien: 0, chasse: [], travail: {}, metier: 'le cercle d\'incantation', grimpe: 0 },
];
const estMage = b => !!b && !!b.sp && b.sp.corps === 'mage';
const autorite = () => !(typeof fauneSuiveur === 'function' && fauneSuiveur());    // seul (ou gardien de l'île) : c'est ici que tout se décide
const magesVivants = () => beasts.filter(b => estMage(b) && !b.dead && b.pv > 0 && !b.horsJeu);
// Ceux qu'ils combattent : les joueurs, et les compagnes (pas les bêtes : la fureur s'en charge).
function cibleBrume(b, R, dz = 4) {                        // (dz : l'écart de hauteur au-delà duquel on ne le voit plus ; les Rôdeurs sautent)
  if (typeof pacteVue === 'function') R *= pacteVue();      // (§164) le pacte d'Ombre
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
  if (b.dead) { b.dead += dt * (b.sp.corps === 'demon' || b.sp.corps === 'mere' || b.sp.corps === 'bourreau' || b.sp.corps === 'jardinier' || b.sp.corps === 'roi' ? .35 : 1); b.z = sol(b.x, b.y); return; }   // le démon (et la Mère, §163) met du temps à se défaire
  if (b.horsJeu) return;
  const k = b.sp.corps;
  if (k === 'cercle') { b.etat = SANG.phase; return; }
  if (k === 'mage') majMage(b, dt);
  else if (k === 'rodeur') majRodeur(b, dt);
  else if (k === 'demon') majDemon(b, dt);
  else if (k === 'larve') majLarve(b, dt);
  else if (k === 'diablotin') majDiablotin(b, dt);
  else if (k === 'mere' && typeof majMere === 'function') majMere(b, dt);   // (§163, roi.js)
  else if (typeof ROI_CORPS !== 'undefined' && ROI_CORPS[k]) majRoiBete(b, dt);   // (§164) les bêtes des Forges
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
  debutEnfer(true);                                          // (§162) et l'île bascule
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
  if (b.sp.roi && typeof roiButin === 'function') return roiButin(b);   // (§163) les gardiens des Cercles de cendre
  const k = b.sp.corps;
  if (k === 'rodeur') { P.sac.eclat += 1; say('le rôdeur se défait en brume · +1 éclat', 1.6); majSac(); return; }
  if (k === 'mage') {
    const ec = 4 + (Math.random() * 3 | 0); P.sac.eclat += ec;
    say('un mage du cercle tombe · +' + ec + ' éclats', 2.4); majSac(); return;
  }
  if (k === 'larve') { P.sac.eclat += 1; say('la larve se défait en cendres · +1 éclat', 1.6); majSac(); return; }
  if (k === 'diablotin') { P.sac.eclat += 2; say('le diablotin crève en fumée · +2 éclats', 1.6); majSac(); return; }
  if (k === 'demon') {
    P.sac.eclat += 40; let tm = '';
    const q = choixTomeBrume(2); if (q && gagnerTome(q[0], q[1])) tm = nomTome(cleTome(q[0], q[1]));   // le Tome II du Sang (§104, §105)
    say('Le démon s\'effondre · +40 éclats' + (tm ? ' · ' + tm : ''), 4); majSac();
  }
}
// La brume se lève : le dernier mage, ou le démon, est tombé.
function leverBrume(demon) {
  if (SANG.phase === 'levee' || SANG.phase === 'libre') return;
  SANG.phase = 'levee'; SANG.leveeT = t;
  for (const b of beasts) if ((b.sp.corps === 'rodeur' || (demon && estMage(b))) && !b.dead) { b.pv = 0; mourirBete(b, 'brume'); }   // (le démon tombé, les mages qu'il a épargnés se défont)
  (P.brumesLevees || (P.brumesLevees = [])).push(SEED); if (P.brumesLevees.length > 300) P.brumesLevees.shift();
  if (typeof Sauve !== 'undefined') Sauve.sale = true;
  if (!demon) {
    P.sac.eclat += 15;
    say('Le cercle est brisé · la brume se lève · +15 éclats', 4.5); majSac();
  } else if (enferIci()) { guerirEnfer(); setTimeout(() => say('Le démon tombé, l\'île respire · elle guérira lentement', 4), 4500); }
  else say('La brume se lève', 3);
  const ile = typeof LUTRINS !== 'undefined' && LUTRINS.find(l => l.brume === 'ile' && !l.lu);
  if (ile) setTimeout(() => say('un livre attend encore, sur un lutrin, quelque part sur l\'île', 4), 5000);
  SON.jouer('ramasse');
}

// ---------- les tomes de la brume (§104) ----------
// Le Tome I : quand les six mages sont tombés (sous vos coups, ou sous ceux du démon), un lutrin de pierre
// sort du cercle éteint, un livre ouvert dessus. Le Tome II : le démon le porte. Le Tome III : sur un lutrin
// posé au hasard sur l'île (toujours au même endroit pour une même graine), à trouver. Chaque lutrin offre
// un tome qui vous manque, du rang voulu (sinon du plus proche) ; une fois recopié, il s'éteint pour de bon
// (P.brumeTomes garde les lutrins lus, île par île). Les lutrins sont ceux des matières (index.html).
function tomeBrume(n) {                                    // [matière, rang] : un tome qui vous manque, du rang n d'abord
  if (typeof tomeManquant !== 'function') return null;
  for (const r of n === 1 ? [1, 2, 3] : n === 2 ? [2, 3, 1] : [3, 2, 1]) { const m = tomeManquant(r); if (m) return [m, r]; }
  return null;
}
function choixTomeBrume(n) {                              // le Tome n du Sang (§105) ; s'il est à vous, un autre tome qui vous manque
  return typeof tomeAcquis === 'function' && MATIERE.sang && !tomeAcquis('sang', n) ? ['sang', n] : tomeBrume(n);
}
function lutrinBrume(cle, x, y, n) {
  const q = choixTomeBrume(n) || [MATIERES[0].id, n], lu = (P.brumeTomes || []).includes(SEED + '.' + cle);
  const l = { m: q[0], n: q[1], rang: n, x, y, z: hAt(x | 0, y | 0), vu: false, brume: cle, lu,
    surLu: l => { l.lu = true; (P.brumeTomes || (P.brumeTomes = [])).push(SEED + '.' + l.brume); if (P.brumeTomes.length > 600) P.brumeTomes.shift(); if (typeof Sauve !== 'undefined') Sauve.sale = true; } };
  LUTRINS.push(l); return l;
}
function placerTomeIle() {                                 // au hasard, mais le même pour une même graine
  let g = (SEED ^ 0x5a17b3) >>> 0; const tir = () => { g = (g * 1664525 + 1013904223) >>> 0; return g / 4294967296; };
  const C = SANG.cercle, S = P.spawn || [P.x, P.y], A = typeof PortailIle !== 'undefined' && PortailIle;
  for (let k = 0; k < 800; k++) {
    const x = 8 + tir() * (WS - 16) | 0, y = 8 + tir() * (WS - 16) | 0;
    if (!placeArche(x, y) || typeFlore(x, y)) continue;
    if ((C && Math.hypot(C.x - x, C.y - y) < 20) || Math.hypot(S[0] - x, S[1] - y) < 25 || (A && Math.hypot(A.x - x, A.y - y) < 8)) continue;
    return lutrinBrume('ile', x + .5, y + .5, 3);
  }
  return null;
}
function majTomesBrume() {
  if (typeof LUTRINS === 'undefined' || (typeof djIci === 'function' && djIci())) return;
  let ile = null, cer = null; for (const l of LUTRINS) if (l.brume === 'ile') ile = l; else if (l.brume === 'cercle') cer = l;
  if (!ile && SANG.essaiIle !== SEED) { SANG.essaiIle = SEED; placerTomeIle(); }
  if (!cer && SANG.cercle && SANG.phase !== 'chant' && !magesVivants().length) {
    const cb = beasts.find(b => b.sp.cercle && !b.horsJeu), C = cb || SANG.cercle, l = lutrinBrume('cercle', C.x, C.y, 1);
    if (!l.lu && SANG.phase !== 'libre' && !SANG.calme) {                  // il sort de terre, en deux secondes (lutrinOs), dans la poussière et le sang
      l.surgit = t; say('Le cercle s\'éteint · un lutrin de pierre sort de terre, un livre ouvert dessus', 4);
      SON.jouer('impact', {}, l.x, l.y, l.z); P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, Math.hypot(P.x - l.x, P.y - l.y) < 20 ? .35 : .1);
      for (let j = 0; j < 40; j++) { const a = Math.random() * 6.2832, r = Math.random() * 1.2; parts.push({ x: l.x + Math.cos(a) * r, y: l.y + Math.sin(a) * r, z: l.z + .05, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, vz: 1 + Math.random() * 2.5, g: 4, life: 1.2, age: 0, col: Math.random() < .6 ? '#5a4030' : '#7a6a58', tl: .1 }); }
      for (let j = 0; j < 30; j++) parts.push({ x: l.x + (Math.random() - .5) * .5, y: l.y + (Math.random() - .5) * .5, z: l.z + Math.random() * 2, vx: 0, vy: 0, vz: 2 + Math.random() * 4, g: -.4, life: 2.2, age: 0, col: Math.random() < .5 ? '#ff4030' : '#a01018', luit: 1, tl: .08 });
    }
  }
  for (const l of LUTRINS) if (l.brume && !l.lu && tomeAcquis(l.m, l.n)) { const q = choixTomeBrume(l.rang); if (q) { l.m = q[0]; l.n = q[1]; } }   // eu ailleurs entre-temps : il en offre un autre
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
  // l'épaisseur : chaque mage qui tombe l'éclaircit ; le démon la chasse (§162 : l'île bascule) ; levée, elle s'en va en six secondes
  const cible = SANG.phase === 'chant' ? .62 + .38 * vivants / SANG.total : SANG.phase === 'demon' ? 0 : SANG.phase === 'levee' ? (enferIci() ? 0 : Math.max(0, 1 - (t - SANG.leveeT) / 6)) : 0;
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
  if (w[1] !== SANG.phase) {
    if (w[1] === 'levee' && SANG.phase === 'chant') leverBrume(false); else if (w[1] === 'levee') leverBrume(true);
    else { SANG.phase = w[1]; if (w[1] === 'demon' && !enferIci()) debutEnfer(true); }   // (§162) chez qui suit, l'île bascule aussi
  }
}

// ============================================================
//  L'ÎLE DÉMONIAQUE (§162)
// ============================================================
// Le démon sorti du cercle, la brume se retire d'un coup et l'île bascule : une vague part du cercle et
// traverse l'île en quinze secondes. Derrière elle, l'eau devient lave (elle brûle), l'herbe et les feuilles
// virent à la cendre, la pierre au basalte, des braises piquent le sol (index.html, enfer() dans DECOR_FS) ;
// le ciel se ferme, presque noir, rouge sombre à l'horizon ; il pleut de la cendre. La faune de l'île brûle
// (vos compagnes, non). Une flore à elle sort de terre sur le passage de la vague (les douze plantes du biome
// 40, flore.js, avec leurs ingrédients) et des créatures sortent du sol : les larves de braise, qui surgissent,
// mordent et replongent ; les diablotins, par petites bandes, qui griffent et crachent le feu.
// Le démon mort, l'île GUÉRIT LENTEMENT, au temps réel (trente minutes, même loin d'elle) : la lave se fige
// en obsidienne puis redevient eau, case à case ; la cendre reverdit ; la flore du démon se fane ; les
// créatures se font rares, puis plus rien ; la faune revient. P.enfers garde, île par île, [l'heure de la
// bascule, l'heure de la mort du démon] (Date.now()).
const ENFER_VAGUE = 15, ENFER_GUERIR = 1800, ENFER_PLANTES = 14, ENFER_BIO = 40;
const ENF = { seed: null, t0: 0, cx: 0, cy: 0, Rmax: 1, gT: -9, g: 0, poser: [], nesT: 0, bruleT: 0, laveT: 0, faneT: 0 };
const ENF_GL = new Float32Array(8);
const enLisse = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const enferIci = () => ENF.seed === SEED && ETAT.id === 'brume' && !(typeof djIci === 'function' && djIci());
const enferEtat = () => (P.enfers || {})[SEED] || null;
function enferG() {                                          // la guérison : 0 tant que le démon vit, 1 guérie
  if (t - ENF.gT < .5) return ENF.g;
  const E = enferEtat(); ENF.gT = t;
  return (ENF.g = E && E[1] ? Math.max(0, Math.min(1, (Date.now() - E[1]) / 1000 / ENFER_GUERIR)) : 0);
}
const enferR = () => Math.min(ENF.Rmax, Math.max(0, (t - ENF.t0) / ENFER_VAGUE) ** .8 * ENF.Rmax);   // le rayon de la vague
const enferPasse = (x, y) => (x - ENF.cx) ** 2 + (y - ENF.cy) ** 2 < enferR() ** 2;
const chaleurLave = () => 1 - enLisse(.2, .45, enferG());
const eauEnfer = (x, y) => { const i = (y | 0) * WS + (x | 0); return i >= 0 && i < WS * WS && (Eau[i] > Hgt[i] || (Bio[i] === 0 && Hgt[i] <= SEA)); };
function laveIci(x, y) { return enferIci() && chaleurLave() > .15 && enferPasse(x, y) && eauEnfer(x, y); }
// Le ciel ici : il se ferme avec la vague (tout à fait quand elle vous a passé), se rouvre avec la guérison.
function enferCielK() {                                    // (une fois par image : le canvas le demande à chaque case)
  if (!enferIci()) return 0;
  if (ENF.kcT === t) return ENF.kc;
  const p = Math.min(1, (t - ENF.t0) / ENFER_VAGUE), d = Math.hypot(P.x - ENF.cx, P.y - ENF.cy);
  ENF.kcT = t; return (ENF.kc = Math.max(p * p * .7, enLisse(-6, 30, enferR() - d)) * (1 - enLisse(.1, .6, enferG())));
}
// Pour la carte graphique (DECOR_FS) : [cercle x, y, rayon de la vague, force, temps, guérison, chaleur, ciel].
function enferGL() {
  if (typeof roiIci === 'function' && roiIci()) { ENF_GL.set([P.x, P.y, 1e5, 1, t % 600, 0, 1, roiTerreNue() ? -1 : .5]); return ENF_GL; }   // (§165) -1 : seule la lave   // (§163) en bas, tout est de cendre et de lave
  if (!enferIci()) { ENF_GL[3] = 0; ENF_GL[7] = 0; return ENF_GL; }
  ENF_GL[0] = ENF.cx; ENF_GL[1] = ENF.cy; ENF_GL[2] = enferR(); ENF_GL[3] = 1;
  ENF_GL[4] = t % 600; ENF_GL[5] = enferG(); ENF_GL[6] = chaleurLave(); ENF_GL[7] = enferCielK();
  return ENF_GL;
}
// Sans carte graphique (canvas) : un filtre sur l'image, faute de mieux (etats.js, dessinerFiltre).
function enferCss() {
  const k = typeof roiIci === 'function' && roiIci() ? .6 : enferCielK(); if (k < .02) return '';
  if (typeof G3 !== 'undefined' && G3.ok && !G3.perdu && (mode === 'fps' || (mode === 'iso' && isoGL))) return '';
  return `grayscale(${(.55 * k).toFixed(2)}) sepia(${(.45 * k).toFixed(2)}) hue-rotate(${(-25 * k).toFixed(0)}deg) saturate(${(1 + .9 * k).toFixed(2)}) brightness(${(1 - .45 * k).toFixed(2)}) contrast(${(1 + .2 * k).toFixed(2)})`;
}
const enferMusique = () => enferIci() && SANG.phase === 'demon';   // le combat garde la valse, sans la brume
// La faune ordinaire : nulle tant que l'île est démoniaque, elle revient avec la guérison (capEsp, index.html).
const fauneOrdinaire = b => !b.tame && !b.comp && !b.sp.brume && !b.sp.plante && !b.sp.batiment && !b.sp.pnj && !b.sp.villageois && !b.sp.illusion
  && !b.sp.boss && !b.sp.dragon && !b.sp.horreur && !b.retire && !(typeof automate === 'function' && automate(b.sp));
function enferFaune(sp) { return !enferIci() || sp.brume || sp.plante ? 1 : enLisse(.55, 1, enferG()); }

function debutEnfer(vague) {
  const C = SANG.cercle; if (!C) return;
  Object.assign(ENF, { seed: SEED, cx: C.x, cy: C.y, t0: vague ? t : t - ENFER_VAGUE * 2, gT: -9, nesT: t + (vague ? 12 : 5), bruleT: 0, faneT: 0 });
  ENF.Rmax = Math.max(...[[0, 0], [WS, 0], [0, WS], [WS, WS]].map(([x, y]) => Math.hypot(x - C.x, y - C.y))) + 6;
  const E = P.enfers || (P.enfers = {});
  if (!E[SEED]) {
    E[SEED] = [Date.now(), 0];
    const K = Object.keys(E); if (K.length > 60) delete E[K.reduce((a, k) => E[k][0] < E[a][0] ? k : a, K[0])];
    if (typeof Sauve !== 'undefined') Sauve.sale = true;
  }
  ENF.poser = lieuxEnfer();
  if (!vague) return;
  for (const b of beasts) if (b.sp.corps === 'rodeur' && !b.dead) { b.pv = 0; mourirBete(b, 'brume'); }   // ils étaient de brume
  say('La brume se retire d\'un coup · la terre se fend · l\'île bascule', 4.5);
  P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .7);
}
function guerirEnfer() {
  const E = enferEtat(); if (!E || E[1]) return;
  E[1] = Date.now(); ENF.gT = -9; if (typeof Sauve !== 'undefined') Sauve.sale = true;
}
// La flore du démon : quatorze places, au hasard de la graine (le même pour tous), triées par distance au
// cercle pour sortir de terre au passage de la vague. [x, y, plante, distance, seuil de fanaison, rayon]
function lieuxEnfer() {
  if (typeof FLORE_RARES === 'undefined') return [];
  const cat = FLORE_RARES.filter(p => p.bio === ENFER_BIO); if (!cat.length) return [];
  let s = (SEED ^ 0xe4fe12) >>> 0 || 1; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const niv = profondeur() + 2, W = [1, 2, 3, 4, 5].map(k => typeof poidsRarete === 'function' ? poidsRarete(k, niv, 4.4) : 1), S = W.reduce((a, b) => a + b);
  const rang = () => { let u = r() * S; for (let k = 0; k < 5; k++) if ((u -= W[k]) < 0) return k + 1; return 5; };
  const L = [], C = SANG.cercle, A = typeof PortailIle !== 'undefined' && PortailIle;
  for (let k = 0; k < 700 && L.length < ENFER_PLANTES; k++) {
    const x = 6 + r() * (WS - 12) | 0, y = 6 + r() * (WS - 12) | 0, i = y * WS + x, h = Hgt[i], rg = rang(), C2 = cat.filter(p => p.r === rg), pl = C2[r() * C2.length | 0], th = .4 + .45 * r();
    if (!pl || h <= SEA + 1 || Eau[i] > Hgt[i] || PlT[i]) continue;
    const R = pl.port === 'geante' ? 2 : pl.port === 'vive' ? 1 : 0; let ok = true;
    for (let dy = -R; dy <= R && ok; dy++) for (let dx = -R; dx <= R; dx++) { const j = i + dy * WS + dx; if (Math.abs(Hgt[j] - h) > 1 || Eau[j] > Hgt[j] || Flo[j]) { ok = false; break; } }
    if (!ok || (C && Math.hypot(C.x - x, C.y - y) < 8) || (A && Math.hypot(A.x - x, A.y - y) < 5) || L.some(q => Math.hypot(q[0] - x, q[1] - y) < 9)) continue;
    L.push([x + .5, y + .5, pl, C ? Math.hypot(C.x - x, C.y - y) : 0, th, R]);
  }
  return L.sort((a, b) => a[3] - b[3]);
}
function poserPlanteEnfer(q, vif) {
  const [x, y, pl, , th] = q, sp = specById[pl.port === 'simple' ? 'plante_r' : pl.port === 'geante' ? 'plante_l' : 'plante_e']; if (!sp) return null;
  const b = naitre(sp, x, y); b.variante = null; b.age = 1e6; b.ech = pl.port === 'simple' ? 1.3 : 1; b.pv = 1; b.z = sol(x, y); b.pl = pl;
  b.dir = b.dirT = (x * 7.31 + y * 3.17) % 6.2832; b.graine = (x * .618 + y * .414) % 1; b.etat = 'pousse'; b.enferTh = th;
  beasts.push(b);
  if (vif && Math.hypot(P.x - x, P.y - y) < 60) {
    for (let j = 0; j < 22; j++) { const a = Math.random() * 6.2832; parts.push({ x: x + Math.cos(a) * .4, y: y + Math.sin(a) * .4, z: b.z + .1, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, vz: 1 + Math.random() * 2, g: 3, life: 1, age: 0, col: Math.random() < .5 ? '#3a2a24' : '#ff6a20', luit: Math.random() < .5 ? 1 : 0, tl: .08 }); }
  }
  return b;
}

// ---------- à chaque image ----------
function majEnfer(dt) {
  if (!enferIci()) return;
  const g = enferG(), R = enferR(), kc = enferCielK(), chaud = chaleurLave(), hote = autorite();
  if (g >= 1) {                                             // guérie : la dernière plante du démon se fane
    if (hote) for (const b of beasts) if (b.pl && b.pl.bio === ENFER_BIO && !b.dead) { b.butin = true; b.pv = 0; b.dead = .001; }
    delete P.enfers[SEED]; ENF.seed = null; if (typeof Sauve !== 'undefined') Sauve.sale = true; say('L\'île a guéri', 3); return;
  }
  // la flore du démon sort de terre au passage de la vague (chez le gardien : la faune partagée la donne aux autres)
  while (ENF.poser.length && ENF.poser[0][3] < R) { const q = ENF.poser.shift(); if (hote && q[4] > g) poserPlanteEnfer(q, true); }
  if (hote && t > ENF.faneT) {                              // la guérison : elle se fane, plante par plante
    ENF.faneT = t + 1;
    for (const b of beasts) if (b.pl && b.pl.bio === ENFER_BIO && !b.dead && g > (b.enferTh ?? .6)) {
      b.butin = true; b.pv = 0; b.dead = .001; burst(b.x, b.y, b.z + .6, 14, '#6a625c');
    }
  }
  if (hote) { brulerFaune(R, g); nesEnfer(g); }
  // la cendre qui tombe, les braises qui montent
  if (kc > .05) {
    for (let j = 0; j < 3; j++) if (Math.random() < dt * 12 * kc) {
      const x = P.x + (Math.random() - .5) * 26, y = P.y + (Math.random() - .5) * 26;
      parts.push({ x, y, z: P.z + 5 + Math.random() * 5, vx: .25 + (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: -.55 - Math.random() * .3, g: 0, life: 7, age: 0, col: Math.random() < .6 ? '#5e5854' : '#8c8682', tl: .055 });
    }
    if (Math.random() < dt * 7 * kc) {
      const x = P.x + (Math.random() - .5) * 18, y = P.y + (Math.random() - .5) * 18;
      parts.push({ x, y, z: sol(x, y) + .1, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, vz: .7 + Math.random(), g: -.15, life: 1.8, age: 0, col: Math.random() < .5 ? '#ff7a20' : '#ffb040', luit: 1, tl: .05 });
    }
  }
  // la lave bouillonne
  if (chaud > .2) for (let j = 0; j < 4; j++) {
    const x = P.x + (Math.random() - .5) * 28, y = P.y + (Math.random() - .5) * 28;
    if (Math.random() > dt * 9 * chaud || !eauEnfer(x, y) || !enferPasse(x, y)) continue;
    const z = hRendu(x, y) + .02;
    for (let q = 0; q < 3; q++) parts.push({ x, y, z, vx: (Math.random() - .5) * .8, vy: (Math.random() - .5) * .8, vz: 1 + Math.random() * 1.6, g: 5, life: .55, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .07 });
  }
  // elles brûlent : des flammes, le temps que la vague les emporte
  for (const b of beasts) if (b.brule && !b.dead && Math.random() < dt * 14 && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 900)
    parts.push({ x: b.x + (Math.random() - .5) * .6, y: b.y + (Math.random() - .5) * .6, z: b.z + Math.random() * .8, vx: 0, vy: 0, vz: 1 + Math.random(), g: -.4, life: .6, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .09 });
  // la lave, sous vos pieds
  if (chaud > .3 && P.pv > 0 && !P.monture && laveIci(P.x, P.y) && P.z < hRendu(P.x, P.y) - .05 && !(typeof effet === 'function' && effet('braise'))) {
    P.pv = Math.max(0, P.pv - BRULURE * 2.5 * chaud * dt * vieK()); P.dernierCoup = t;
    if (t - ENF.laveT > 2.5) { ENF.laveT = t; say('la lave brûle', 1.4); }
    if (Math.random() < dt * 10) burst(P.x, P.y, P.z + .3, 1, '#ffa04c');
    if (P.pv <= 0) terrasse();
  }
}
// La faune ordinaire brûle quand la vague la rattrape (une à deux secondes de flammes).
function brulerFaune(R, g) {
  if (t < ENF.bruleT || g > .5) return; ENF.bruleT = t + .3;
  const R2 = R * R;
  for (const b of beasts) {
    if (b.dead || !fauneOrdinaire(b) || (b.x - ENF.cx) ** 2 + (b.y - ENF.cy) ** 2 > R2) continue;
    if (!b.brule) { b.brule = t + .6 + Math.random() * 1.2; continue; }
    if (t > b.brule) { b.pv = 0; mourirBete(b, 'enfer'); if ((b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 1600) burst(b.x, b.y, b.z + .4, 14, '#ff7a20'); }
  }
}
// Les créatures sortent du sol, près d'un joueur que la vague a passé ; plus souvent près du cercle et du démon.
function nesEnfer(g) {
  if (t < ENF.nesT) return;
  if (g > .7) { ENF.nesT = t + 30; return; }
  const L = typeof joueursFaune === 'function' ? joueursFaune() : [P], J = L[Math.random() * L.length | 0] || P;
  if (!enferPasse(J.x, J.y) || !(J.pv > 0)) { ENF.nesT = t + 2; return; }
  const D = beasts.find(b => b.sp.corps === 'demon' && !b.dead);
  const pres = Math.max(0, 1 - Math.hypot(J.x - ENF.cx, J.y - ENF.cy) / 45) + (D && Math.hypot(J.x - D.x, J.y - D.y) < 30 ? .5 : 0);
  const vit = (1 + 1.4 * pres) * (1 - g / .7) ** 2;
  ENF.nesT = t + (10 + Math.random() * 8) / Math.max(.15, vit);
  const n = c => beasts.filter(b => b.sp.corps === c && !b.dead).length;
  if (Math.random() < .6) { if (n('larve') < 5) surgirEnfer('larve_braise', J, 1 + (Math.random() < .3 + pres * .3 ? 1 : 0), 5, 9); }
  else if (n('diablotin') < 5) surgirEnfer('diablotin', J, 2 + (Math.random() < .25 + pres * .3 ? 1 : 0), 8, 12);
}
function surgirEnfer(id, J, n, r0, r1) {
  const sp = specById[id]; if (!sp) return;
  let fait = 0;
  for (let k = 0; k < 30 && fait < n; k++) {
    const a = Math.random() * 6.2832, r = r0 + Math.random() * (r1 - r0), x = J.x + Math.cos(a) * r, y = J.y + Math.sin(a) * r;
    if (x < 3 || y < 3 || x > WS - 4 || y > WS - 4 || hAt(x | 0, y | 0) <= SEA || eauEnfer(x, y) || PlT[(y | 0) * WS + (x | 0)] || Math.abs(sol(x, y) - J.z) > 2) continue;
    const b = naitre(sp, x, y); b.variante = null; b.z = sol(x, y); b.pv = 1; b.age = 1e6; b.ech = 1; b.etat = 'surgir'; b.etT = t;
    b.vie = id === 'diablotin' ? 50 : 35; b.dir = b.dirT = Math.atan2(J.y - y, J.x - x); b.blinde = 1 + Math.max(0, profondeur() - 8) * .04;
    beasts.push(b); fait++; jaillir(b, id === 'diablotin');
  }
  if (fait && !ENF.vuC) { ENF.vuC = true; say('le sol se fend · quelque chose en sort', 2.5); }
}
function jaillir(b, fente) {                                 // la terre qui gicle, les braises ; une fente rouge pour les diablotins
  SON.jouer('atterrir', { k: .7 }, b.x, b.y, b.z);
  for (let q = 0; q < 18; q++) { const a = Math.random() * 6.2832; parts.push({ x: b.x, y: b.y, z: b.z + .05, vx: Math.cos(a) * (1 + Math.random()), vy: Math.sin(a) * (1 + Math.random()), vz: 1.5 + Math.random() * 2.5, g: 6, life: .8, age: 0, col: Math.random() < .6 ? '#3a2c26' : '#5a4436', tl: .09 }); }
  for (let q = 0; q < (fente ? 16 : 8); q++) parts.push({ x: b.x + (Math.random() - .5) * (fente ? 1.4 : .5), y: b.y + (Math.random() - .5) * .3, z: b.z + .05, vx: 0, vy: 0, vz: .8 + Math.random() * 1.5, g: -.3, life: 1.1, age: 0, col: Math.random() < .5 ? '#ff6a20' : '#ffb040', luit: 1, tl: .07 });
}

// Au donjon du Roi (roi.js), elles ne chassent que ce qu'elles voient (ou ont vu il y a moins de six secondes).
function cibleEnfer(b, R) {                                 // (le pacte d'Ombre : cibleBrume s'en charge)
  const c = cibleBrume(b, R, 4); if (!c || b.djIdx === undefined) return c;
  if (b.t < (b.alerte || 0) || (Math.hypot(c.x - b.x, c.y - b.y) < 14 && voitCible(b, c))) { b.alerte = b.t + 6; return c; }
  return null;
}
// ---------- les larves de braise ----------
// Une larve d'un mètre, en croûte noire fendue de braise. Elle sort du sol, rampe vers vous, se cabre et
// mord (la morsure brûle deux secondes) ; puis elle replonge, file sous terre (une traînée de terre et de
// braises trahit sa route) et ressort à vos pieds. Au bout d'une demi-minute, elle s'enfonce pour de bon.
function majLarve(b, dt) {
  const u = t - (b.etT || 0);
  if ((b.vie = (b.vie ?? 35) - dt) <= 0 && b.etat !== 'enfouir' && !b.fin) { b.fin = true; b.etat = 'enfouir'; b.etT = t; b.act = null; return; }
  if (b.etat === 'surgir') { b.vit = 0; b.cache = false; if (u > .9) { b.etat = 'ramper'; b.etT = t; } return; }
  if (b.etat === 'enfouir') {
    b.vit = 0;
    if (u > .7) { if (b.fin) { b.pv = 0; b.dead = .001; } else { b.etat = 'sous'; b.cache = true; b.etT = t; } }
    return;
  }
  const c = cibleEnfer(b, 26);
  if (b.etat === 'sous') {
    if (!c) { if (u > 6 && b.vie !== Infinity) { b.fin = true; b.pv = 0; b.dead = .001; } return; }   // (au donjon, elle attend sous terre)
    const d = Math.hypot(c.x - b.x, c.y - b.y); b.dir = b.dirT = Math.atan2(c.y - b.y, c.x - b.x);
    if (d > 1.6) { const s = Math.min(5.5 * dt, d - 1.5), nx = b.x + Math.cos(b.dir) * s, ny = b.y + Math.sin(b.dir) * s; if (hAt(nx | 0, ny | 0) > SEA) { b.x = nx; b.y = ny; b.z = sol(nx, ny); } }
    b.vit = 0;
    if (Math.random() < dt * 16) parts.push({ x: b.x + (Math.random() - .5) * .4, y: b.y + (Math.random() - .5) * .4, z: b.z + .05, vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6, vz: .8 + Math.random(), g: 5, life: .5, age: 0, col: Math.random() < .7 ? '#3a2c26' : '#ff6a20', tl: .08 });
    if ((d < 2.4 || u > 7) && !eauEnfer(b.x, b.y) && Math.abs(hAt(b.x | 0, b.y | 0) - c.z) < 1.2) { b.etat = 'surgir'; b.etT = t; b.cache = false; jaillir(b, false); }
    return;
  }
  if (b.act === 'mordre') {
    const v = t - b.actT; b.vit = 0;
    if (v < .35) { if (c) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 8); } b.etat = 'cabrer'; return; }
    b.etat = 'mordre';
    if (!b.fait) {
      b.fait = true; const C = b.actC;
      if (C && (estJoueur(C) ? C.pv > 0 : !C.dead) && Math.hypot(C.x - b.x, C.y - b.y) < 1.7) {
        coupBrume(b, C, .07, [Math.cos(b.dir) * 2, Math.sin(b.dir) * 2, 0]); SON.jouer('lacere', {}, b.x, b.y, b.z + .3);
        if (C === P) P.brulure = Math.max(P.brulure || 0, t + 2);
        b.morsures = (b.morsures || 0) + 1;
      }
    }
    if (v > .8) { b.act = null; b.mordT = t + 1.4; if (b.morsures >= 2) { b.morsures = 0; b.etat = 'enfouir'; b.etT = t; } }
    return;
  }
  if (!c) { b.vit = 0; b.etat = 'ramper'; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 5);
  if (d < 1.5 && t > (b.mordT || 0) && Math.abs(c.z - b.z) < 1.2) { agirBrume(b, 'mordre', c); return; }
  if (u > 6 && d > 4) { b.etat = 'enfouir'; b.etT = t; return; }     // trop loin : il replonge, et revient par-dessous
  b.etat = 'ramper'; pasBrume(b, c.x, c.y, 2.6, dt, 1);
}

// ---------- les diablotins ----------
// Un petit diable d'un mètre, rouge, cornu, aux ailes de chauve-souris trop petites pour voler. Ils jaillissent
// d'une fente rouge, à deux ou trois ; ils tournent autour de vous en sautillant, puis l'un fond griffes en
// avant, ou crache une boule de feu. Au bout de cinquante secondes, ils replongent dans leur fente.
function majDiablotin(b, dt) {
  const u = t - (b.etT || 0);
  if ((b.vie = (b.vie ?? 50) - dt) <= 0 && b.etat !== 'enfouir') { b.etat = 'enfouir'; b.etT = t; b.act = null; jaillir(b, true); return; }
  if (b.etat === 'surgir') { b.vit = 0; if (u > 1) b.etat = 'roder'; return; }
  if (b.etat === 'enfouir') { b.vit = 0; if (u > .8) { b.pv = 0; b.dead = .001; } return; }
  if (b.act) return actionDiablotin(b, dt);
  const c = cibleEnfer(b, 30);
  if (!c) { b.vit = 0; b.etat = 'roder'; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x);
  if (t > (b.coupT || 0)) {
    if (d < 5.5) { agirBrume(b, 'griffer', c); b.coupT = t + 2.4 + Math.random() * 1.8; return; }
    if (d < 14) { agirBrume(b, 'cracher', c); b.coupT = t + 2.6 + Math.random() * 2; return; }
  }
  const a = Math.atan2(b.y - c.y, b.x - c.x) + (b.cote || 1) * .55;
  b.etat = 'roder'; pasBrume(b, c.x + Math.cos(a) * 6, c.y + Math.sin(a) * 6, 3.6, dt, 1.3); tournerBrume(b, dt, 6);
}
function actionDiablotin(b, dt) {
  const u = t - b.actT, c = b.actC, vivant = c && (estJoueur(c) ? c.pv > 0 : !c.dead);
  b.vit = 0;
  if (b.act === 'griffer') {                                 // il se ramasse, puis fond sur vous
    if (u < .4) { if (vivant) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 8); } return; }
    if (u < .75) {
      const nx = b.x + Math.cos(b.dir) * 10 * dt, ny = b.y + Math.sin(b.dir) * 10 * dt, h = hAt(nx | 0, ny | 0);
      if (h > SEA && Math.abs(h - hAt(b.x | 0, b.y | 0)) <= 1.5 && !eauEnfer(nx, ny)) { b.x = nx; b.y = ny; b.z = sol(nx, ny); b.vit = 10; }
      if (!b.fait && vivant && Math.hypot(c.x - b.x, c.y - b.y) < 1.2) { b.fait = true; coupBrume(b, c, .07, [Math.cos(b.dir) * 4, Math.sin(b.dir) * 4, 1]); SON.jouer('lacere', {}, b.x, b.y, b.z + .6); }
      return;
    }
    if (u > 1.1) b.act = null;
  } else if (b.act === 'cracher') {                          // la main levée s'allume, puis la boule de feu part en cloche
    if (vivant) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 8); }
    if (u >= .65 && !b.fait && vivant) {
      b.fait = true; SON.jouer('volee', {}, b.x, b.y, b.z + 1);
      const ox = b.x + Math.cos(b.dir) * .3, oy = b.y + Math.sin(b.dir) * .3, oz = b.z + .95 * (b.sp.sz || 1), cz = (c.z || 0) + .8;
      const d = Math.hypot(c.x - ox, c.y - oy) || 1, vol = d / 9;
      TIRS.push({ x: ox, y: oy, z: oz, vx: (c.x - ox) / vol, vy: (c.y - oy) / vol, vz: (cz - oz) / vol + TIR_G * vol * .5, de: b, deg: .06, age: 0, c: [255, 120, 40], feu: true });
      if (typeof fauneTir === 'function') fauneTir(b, TIRS[TIRS.length - 1]);
    }
    if (u > 1.1) b.act = null;
  } else b.act = null;
}

// ---------- leurs volumes ----------
function osLarve(f, O) {
  const { add } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0);
  if (E === 'sous' || f.cache || (f.dead && E === 'enfouir')) return;            // sous terre : seule la traînée se voit
  const e = E === 'surgir' ? Math.min(1, u / .9) : E === 'enfouir' ? Math.max(0, 1 - u / .7) : 1, mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const crout = [44, 26, 22], crout2 = [62, 36, 28], lave = [255, 116, 30], cl = [255, 196, 90];
  const cab = E === 'cabrer' ? Math.min(1, u / .35) : E === 'mordre' ? Math.max(0, 1 - u / .3) : 0, sort = 1 - e;
  const ph = t * 8 + (f.num || 0), rampe = (f.vit || 0) > .1 ? 1 : .35, N = 6;
  const P0 = [];
  for (let k = 0; k < N; k++) {
    const s = k / (N - 1), x = .44 - s * .92 + (E === 'mordre' ? .18 * (1 - s) : 0);
    const leve = (k < 3 ? (cab * .32 + sort * .7) * (1 - k / 3) : 0);
    P0.push([x, Math.sin(ph - k * 1.1) * .07 * rampe * (1 - mort), Math.max(-.6, .15 + leve - sort * .55 - mort * .08) + Math.abs(Math.sin(ph - k * 1.1)) * .025 * rampe]);
  }
  for (let k = 0; k < N; k++) {
    const p = P0[k], q = P0[Math.min(N - 1, k + 1)], w = (.34 - k / (N - 1) * .17), d = [(p[0] - q[0]) * .5, (p[1] - q[1]) * .5, (p[2] - q[2]) * .5];
    const A = [p[0] + d[0] * .9, p[1] + d[1] * .9, p[2] + d[2] * .9], B = k < N - 1 ? [p[0] - d[0] * .9, p[1] - d[1] * .9, p[2] - d[2] * .9] : [p[0] - .1, p[1], p[2]];
    add(A, B, w, w * .85, k % 2 ? crout : crout2);
    add([B[0] - .005, B[1], B[2]], [B[0] - .02, B[1], B[2]], w * .9, w * .75, lave, true);                        // la braise entre les anneaux
    add([p[0] + .05, p[1], p[2] + w * .43], [p[0] - .05, p[1], p[2] + w * .43], .05, .02, k % 2 ? lave : cl, true);   // la fente sur le dos
  }
  const H = P0[0], o = E === 'mordre' ? .5 : E === 'cabrer' ? .9 : .2 + .1 * Math.sin(t * 9);
  for (const s of [-1, 1]) {
    add([H[0] + .12, H[1] + s * .07, H[2] - .02], [H[0] + .3, H[1] + s * (.04 + o * .1), H[2] - .05], .05, .05, [24, 14, 12]);   // les mandibules
    add([H[0] + .15, H[1] + s * .09, H[2] + .07], [H[0] + .17, H[1] + s * .09, H[2] + .07], .045, .045, cl, true);                // les yeux
  }
  if (E === 'cabrer' || E === 'mordre') add([H[0] + .16, H[1], H[2] - .02], [H[0] + .2, H[1], H[2] - .02], .09, .06, lave, true);   // la gueule
}
function osDiablotin(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  if (f.dead && E === 'enfouir') return;
  const peau = [168, 34, 28], peau2 = [120, 22, 20], noir = [30, 18, 18], aile = [92, 16, 18], oeil = [255, 220, 80], feu = [255, 150, 50];
  const e = E === 'surgir' ? Math.min(1, u / 1) : E === 'enfouir' ? Math.max(0, 1 - u / .8) : 1;
  const saut = E === 'surgir' ? Math.sin(Math.min(1, u) * Math.PI) * .9 : 0;
  const zb = -(1 - e) * 1.1 + saut - mort * .5, v = Math.min(1, (f.vit || 0) / 3.6), ph = t * 9 + (f.num || 0) * 1.7;
  const hop = Math.abs(Math.sin(ph)) * .12 * v, gr = E === 'griffer' ? Math.min(1, u / .4) : 0, cr = E === 'cracher' ? Math.min(1, u / .6) : 0;
  const z = zb + hop, pen = gr * .35 * (u < .75 ? 1 : 0);
  // les pattes de bouc
  for (const s of [-1, 1]) {
    const p = ph + (s > 0 ? 0 : Math.PI), hip = [0, s * .1, z + .46], knee = [.1 + Math.sin(p) * .08 * v, s * .11, z + .27], ank = [-.04 + Math.sin(p) * .12 * v, s * .11, z + .1 + Math.max(0, Math.cos(p)) * .08 * v], foot = [ank[0] + .07, s * .11, Math.max(zb, z) + .02];
    os2(hip, knee, .1, peau2); os2(knee, ank, .07, peau2); os2(ank, foot, .08, noir);
  }
  const T0 = [0, 0, z + .46], T1 = [pen * .3, 0, z + .82];
  add(T0, T1, .3, .2, peau);                                                      // le torse
  add([T1[0] + .02, 0, T1[2] - .2], [T1[0] + .02, 0, T1[2] - .05], .2, .21, peau2);  // le ventre
  const Hc = [T1[0] + .04 + pen * .2, 0, T1[2] + .15];
  add([Hc[0] - .11, 0, Hc[2]], [Hc[0] + .11, 0, Hc[2]], .24, .22, peau);           // la tête
  add([Hc[0] + .1, 0, Hc[2] - .05], [Hc[0] + .16, 0, Hc[2] - .06], .14, .08, peau2);   // le museau
  add([Hc[0] + .13, 0, Hc[2] - .09], [Hc[0] + .16, 0, Hc[2] - .09], .1, .02, cr > .5 ? feu : [40, 10, 10], cr > .5);   // la gueule
  for (const s of [-1, 1]) {
    add([Hc[0] + .1, s * .06, Hc[2] + .03], [Hc[0] + .12, s * .06, Hc[2] + .03], .05, .04, oeil, true);   // les yeux
    const c0 = [Hc[0] - .02, s * .09, Hc[2] + .1], c1 = [Hc[0] - .08, s * .17, Hc[2] + .22], c2 = [Hc[0] - .02, s * .2, Hc[2] + .32];
    os2(c0, c1, .06, noir); os2(c1, c2, .04, noir);                                 // les cornes
    const fl = Math.sin(t * 11 + (f.num || 0)) * .35;                               // les ailes, trop petites
    const W0 = [T1[0] - .12, s * .08, T1[2] - .02], W1 = [W0[0] - .16, s * (.32 + fl * .1), W0[2] + .16 + fl * .1], W2 = [W0[0] - .1, s * (.36 + fl * .12), W0[2] - .12];
    os2(W0, W1, .03, noir); add(W0, mi3(W1, W2), .02, .22, aile); os2(W1, W2, .025, noir);
    // les bras : ballants ; tendus pour griffer ; le droit levé pour cracher
    const Sh = [T1[0], s * .19, T1[2] - .03];
    let Hd = [Sh[0] + .06 + Math.sin(ph + (s > 0 ? Math.PI : 0)) * .06 * v, s * .22, Sh[2] - .3];
    if (gr) Hd = [Sh[0] + .32 * gr, s * .14, Sh[2] - .02];
    if (cr && s > 0) Hd = [Sh[0] - .05, s * .2, Sh[2] + .3 * cr];
    os2(Sh, Hd, .07, peau2);
    add(Hd, [Hd[0] + .07, Hd[1], Hd[2] - .02], .06, .05, noir);                      // les griffes
    if (cr && s > 0 && u < .65) add([Hd[0] - .07, Hd[1], Hd[2] + .05], [Hd[0] + .07, Hd[1], Hd[2] + .05], .14 * cr, .14 * cr, feu, true);   // la boule de feu
  }
  let q = [T0[0] - .1, 0, T0[2] + .02];                                            // la queue, en pointe de flèche
  for (let j = 1; j <= 3; j++) { const n = [q[0] - .13, Math.sin(t * 4 + j) * .06 * j, q[2] - .03 + Math.sin(t * 3 + j) * .03]; os2(q, n, .05, peau2); q = n; }
  add([q[0] + .02, q[1], q[2]], [q[0] - .1, q[1], q[2]], .12, .03, noir);
}
const mi3 = (A, B) => [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];

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
  else if (k === 'larve') osLarve(f, O); else if (k === 'diablotin') osDiablotin(f, O);
  else if (k === 'mere' && typeof osMere === 'function') osMere(f, O);
  else if (typeof ROI_CORPS !== 'undefined' && ROI_CORPS[k]) osRoiBete(f, O);
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
// (§193) L'ANIMATION DU DÉMON, refaite. Un vrai squelette : le bassin (hauteur, balancement, lacet, roulis), une
// échine de quatre vertèbres qui se cambre ou se plie, les épaules qui tournent contre le bassin, un cou et une tête
// qui suivent leur cible du regard. Chaque attitude est une suite de poses clés (kf) ; tout passe de l'une à l'autre
// en douceur (lis), sans à-coup, et les muscles travaillent : le biceps gonfle quand le coude se plie, la cuisse sous
// la charge, le mollet à la poussée, la cage au souffle — qui se fait court après l'effort.
//  - LA MARCHE : chaque pied pose, porte, pousse (le talon se lève, le sabot bascule), se replie en l'air, puis se
//    tend et se pose ; le corps plonge à chaque appui, se déhanche sur la jambe qui porte, le bassin tourne avec la
//    jambe qui avance et les épaules en sens inverse ; les bras balancent à contretemps, avec un léger retard ; la
//    queue ondule et répond au bassin. À l'arrêt, il respire, change d'appui, et vous regarde.
//  - LA CHARGE : il gratte le sol du sabot droit (lever, frapper, racler), tête basse, les naseaux qui flambent ;
//    puis il galope à quatre pattes : les mains se posent loin devant, les deux pattes de bouc ramassées sous le
//    ventre poussent, l'échine se plie et se déplie, la queue file derrière.
//  - LE REVERS : il arme, le buste tordu, le bras en arrière et le poing serré ; le pied droit avance et tout le corps
//    se détord, la main balaie devant lui griffes ouvertes, puis passe en travers, et il revient.
//  - LE MARTÈLEMENT : il se dresse sur ses sabots, les deux poings joints au-dessus de la tête, le dos cambré, et
//    rugit ; puis il s'abat de tout son poids, les genoux pliés, les poings au sol ; il souffle, et se relève.
//  - LE RUGISSEMENT : il inspire, voûté, les bras bas ; puis se cambre, les bras grands ouverts, les doigts écartés,
//    la gueule ouverte qui tremble ; enfin il se penche vers vous, poings serrés. En sortant du cercle, il s'y hisse
//    à la force des bras, les mains agrippées au sol.
//  - SONNÉ : il titube, les bras ballants, secoue la tête. MORT : il tombe à genoux, puis s'effondre en avant.
function osDemon(f, O) {
  const { B, add } = O;
  const sh = F => { Object.assign(B[B.length - 1], F); };
  const GA = (r = .55, n = 4) => ({ boule: n, rond: r }), PR = (fin = 1, n = 8, r = .8) => fin === 1 ? { pans: n, rond: r } : { pans: n, rond: r, fin };
  const T = typeof TEX !== 'undefined' ? TEX : {}, mat = m => { if (m) B[B.length - 1].tex = m; };
  const peau = [104, 26, 18], peauC = [150, 44, 26], peauB = [66, 16, 12], sombre = [34, 9, 8], ventre = [46, 13, 10], corne = [38, 30, 26], corneB = [118, 98, 76], corneP = [214, 194, 156];
  const osC = [190, 166, 128], ongle = [16, 12, 11], croc = [240, 230, 208], poil = [22, 9, 8];
  // ---- le temps, le lissage ----
  const dtl = Math.min(.1, Math.max(0, t - (f._osT ?? t))); f._osT = t;
  const D = f._dm || (f._dm = {}), ex = r => 1 - Math.exp(-r * dtl);
  const lis = (k, v, r) => (D[k] = D[k] === undefined || !isFinite(D[k]) ? v : D[k] + (v - D[k]) * ex(r));
  const lisV = (k, v, r) => { const a = D[k]; if (!a) { D[k] = v.slice(); return v.slice(); } const q = ex(r); for (let i = 0; i < 3; i++) a[i] += (v[i] - a[i]) * q; return a.slice(); };
  // ---- de quoi calculer ----
  const vA = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vS = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vK = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vL = a => Math.hypot(a[0], a[1], a[2]), vN = a => { const l = vL(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, vM = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, seg = (x, a, b) => cl((x - a) / (b - a)), lisse = x => x * x * (3 - 2 * x);
  const rz = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
  const kf = (x, K) => { if (x <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (x <= K[i][0]) { const a = K[i - 1], b = K[i], e = lisse((x - a[0]) / ((b[0] - a[0]) || 1));
    return Array.isArray(a[1]) ? a[1].map((q, j) => q + (b[1][j] - q) * e) : a[1] + (b[1] - a[1]) * e; } return K[K.length - 1][1]; };
  // un repère : lacet (autour de la verticale), tangage (> 0 : penché en avant), roulis (> 0 : la gauche monte)
  const rep = (Og, yaw, pitch, roll) => {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const F = rz([cp, 0, -sp], yaw), S = rz([sp * sr, cr, cp * sr], yaw), U = rz([sp * cr, -sr, cp * cr], yaw);
    const M = (a, b, c) => [Og[0] + F[0] * a + S[0] * b + U[0] * c, Og[1] + F[1] * a + S[1] * b + U[1] * c, Og[2] + F[2] * a + S[2] * b + U[2] * c];
    M.F = F; M.S = S; M.U = U; return M;
  };
  const bl = (M, a0, a1, b, c, w, h, col, luit) => add(M(a0, b, c), M(a1, b, c), w, h, col, luit, M.U);
  const os2 = (A, Bv, w, col, luit) => add(A, Bv, w, w, col, luit);
  // ---- où il en est ----
  const E = f.etat, u = f.actT != null ? t - f.actT : 9, ph = (((f.gph || 0) % 1) + 1) % 1, P2 = 6.2832;
  const mort = f.dead > 0 ? Math.min(1, f.dead) : 0, vif = 1 - mort, emerge = f.emerge ?? 1, surgit = emerge < 1 && !mort;
  const rug = (E === 'rugir' || E === 'surgir') && !mort && !surgit, sonne = f.sonne > t && !mort;
  const galop = E === 'charger' && u >= .9 && !sonne && !mort, gratte = E === 'charger' && u < .9 && !mort;
  const revers = E === 'revers' && !mort && !sonne, marteler = E === 'marteler' && !mort && !sonne;
  const acte = revers || marteler || rug || gratte;
  const marche = !galop && !rug && !mort && !sonne && !revers && !marteler && !gratte && !surgit;
  const v = marche ? Math.min(1, Math.max((f.vit || 0) / 2.2, (f._tour || 0) * .4)) : 0;
  // le souffle : court et profond après l'effort, qui ne retombe que lentement
  const effort = galop || gratte || revers || marteler || rug || surgit ? 1 : sonne ? .7 : 0;
  const eff = lis('eff', effort, effort > (D.eff || 0) ? 2.5 : .22);
  D.res = (D.res || 0) + dtl * (1.5 + 2.6 * eff);
  const souffle = (.5 + .5 * Math.sin(D.res)) * vif, g = 1 + (.035 + .055 * eff) * souffle;
  // ce que la lave dit : elle bat avec le souffle, et flambe à l'effort, aux coups, au rugissement
  const flambe = revers ? kf(u, [[.6, 0], [.75, 1], [1.1, 0]]) : marteler ? kf(u, [[1, 0], [1.1, 1], [1.6, .2], [1.9, 0]]) : rug ? kf(u, [[.4, 0], [.6, 1], [1.6, .7], [2, .2]]) : galop ? .5 : gratte ? .3 : 0;
  const lave = [255, Math.min(255, (100 + 80 * souffle + 75 * flambe) * vif + 40) | 0, (36 + 90 * flambe * vif) | 0], laveC = [255, 226, 120 + 80 * flambe | 0];
  // le regard : la cible de son coup, sinon vous
  let lookY = 0, lookP = 0;
  { const cible = (acte || galop) && Array.isArray(f.vise) ? f.vise : [P.x, P.y, P.z + .9], dx = cible[0] - f.x, dy = cible[1] - f.y, c = Math.cos(f.dir || 0), s2 = Math.sin(f.dir || 0);
    const lx = dx * c + dy * s2, ly = -dx * s2 + dy * c, d = Math.hypot(lx, ly);
    if (d < 45 && d > .5) { lookY = cl(Math.atan2(ly, lx), -1.15, 1.15); lookP = cl(Math.atan2(cible[2] - (f.z + 4), d), -.55, .45); } }
  // ================= LES POSES =================
  const repos = s => [.32, s * .14, -.88];                                  // la main, pendue sous l'épaule
  const G = { px: 0, py: 0, pz: 0, pY: 0, pR: 0, plus: 0, arch: 0, cY: 0, cR: 0, hY: lookY * .85, hP: -.12 + lookP * .8, hR: 0, jaw: .1 + .05 * souffle,
    tUp: 0, tAmp: .06, tW: 1.2, tY: 0, galopW: 0 };
  const pied = {}, met = {}, toe = {}, main = {}, mainAbs = {}, pole = {}, poing = {};
  for (const s of [-1, 1]) { pied[s] = [.06, s * .29, 0]; met[s] = [-.12, 0, .34]; toe[s] = 0; main[s] = repos(s); mainAbs[s] = null; pole[s] = [-.2, s * .6, -.6]; poing[s] = .45; }
  // ---- à l'arrêt : il respire, change d'appui, regarde ----
  if (marche) {
    const appui = Math.sin(t * .45 + (f.bob || 0) * 3) * (1 - v);
    G.py = .04 * appui; G.pR = .03 * appui; G.pz = -.012 * souffle;
    for (const s of [-1, 1]) { main[s][2] += .025 * souffle; main[s][0] += .03 * Math.sin(t * .7 + s); poing[s] = .4 + .18 * Math.sin(t * .9 + s * 1.3); }
    G.hR = .06 * Math.sin(t * .37 + 1); G.tAmp = .06; G.tW = .9;
  }
  // ---- la marche ----
  if (marche && v > .01) {
    const A = DEMON_PAS * v, H = .27 * v; let dipMax = 0;
    for (const s of [-1, 1]) {
      const q = (ph + (s > 0 ? 0 : .5)) % 1;
      if (q < .6) {                                                           // l'appui : le pied recule sous lui, à plat, puis le talon se lève
        const k = lisse(seg(q, .36, .6));
        pied[s] = [.06 + A - 2 * A * q / .6, s * .29, 0]; met[s] = vM([-.12, 0, .34], [.01, 0, .36], k * v); toe[s] = .55 * k * v;
        dipMax = Math.max(dipMax, q < .28 ? Math.sin(Math.PI * q / .28) : 0);
      } else {                                                                // en l'air : il se replie, puis se tend vers l'avant
        const w = (q - .6) / .4, e = lisse(w);
        pied[s] = [.06 - A + 2 * A * e + .07 * v * Math.sin(Math.PI * w), s * (.29 - .03 * Math.sin(Math.PI * w)), Math.sin(Math.PI * Math.pow(w, .75)) * H];
        met[s] = w < .5 ? vM([.01, 0, .36], [-.25, 0, .25], lisse(w / .5)) : vM([-.25, 0, .25], [-.08, 0, .35], lisse((w - .5) / .5));
        toe[s] = (w < .3 ? .55 + .4 * w / .3 : .95 * (1 - lisse((w - .3) / .7))) * v;
      }
      const sw = -Math.cos(P2 * (ph - .08 + (s > 0 ? 0 : .5)));             // le bras, à contretemps de sa jambe, un peu en retard
      main[s] = [.3 + .36 * v * sw, s * (.15 + .05 * v * Math.max(0, sw)), -.86 + .14 * v * Math.max(0, sw) + .02 * souffle];
      poing[s] = .5 + .1 * sw;
    }
    G.pz = -.1 * v * dipMax + .015 * v; G.py = .075 * v * Math.sin(P2 * ph); G.pR = .065 * v * Math.sin(P2 * ph);
    G.pY = -.11 * v * Math.cos(P2 * ph); G.cY = -1.3 * G.pY; G.cR = -.45 * G.pR; G.plus = .07 * v + .04 * v * dipMax;
    G.hP = -.14 + lookP * .6 + .05 * v * dipMax; G.hR = -G.py * 1.4; G.hY = lookY * (.8 - .3 * v);
    G.tAmp = .07 + .06 * v; G.tW = 1.2 + 2.2 * v; G.tY = -G.pY * 1.6;
  }
  // ---- le rugissement ----
  if (rug) {
    const a = lisse(seg(u, 0, .45)), b = lisse(seg(u, .42, .72)), c = lisse(seg(u, 1.45, 2));
    const tr = Math.sin(t * 31) * b * (1 - c);
    G.plus = .14 * a * (1 - b) - .32 * b * (1 - c) + .12 * c; G.pz = -.04 * a + .07 * b * (1 - c);
    G.hP = -.35 * a * (1 - b) + .6 * b * (1 - c) + (lookP * .7) * c; G.hY = lookY * (.3 + .6 * c); G.hR = .05 * tr;
    G.jaw = .15 + .85 * b * (1 - c) + .05 * tr + .25 * c * (1 - seg(u, 1.8, 2)); G.cR = .02 * tr;
    for (const s of [-1, 1]) {
      main[s] = vM(vM(repos(s), [0, s * .36, -.66], a), [.05, s * .74, .55 + .03 * tr], b); main[s] = vM(main[s], [.42, s * .36, -.42], c);
      poing[s] = .5 * (1 - b) * (1 - c) + 1 * c; pole[s] = [-.3, s * .6, -.3];
    }
    G.tUp = .45 * b; G.tAmp = .07 + .14 * b; G.tW = 2 + 6 * b;
  }
  // ---- il sort du cercle : il se hisse à la force des bras ----
  const bas = (1 - emerge) * 2.7 + lisse(seg(mort, .78, 1)) * 1.1;
  if (surgit) {
    const tire = Math.sin(t * 1.8);
    G.plus = .38 + .06 * tire; G.pz = .05 * tire; G.hP = .3 + lookP * .5; G.hY = lookY * .6; G.jaw = .25 + .15 * Math.max(0, tire);
    for (const s of [-1, 1]) { mainAbs[s] = [.62 + .14 * Math.sin(t * 1.8 + s * 1.6), s * .95, (1 - emerge) * 2.7 + .03]; poing[s] = .85; pole[s] = [-.4, s * .8, .3]; }
    G.tAmp = .12; G.tW = 3;
  }
  // ---- il gratte le sol, avant la charge ----
  if (gratte) {
    const pw = (u * 1.9) % 1, snort = Math.max(0, Math.sin(pw * P2));
    G.plus = .3; G.pz = -.13; G.py = .05; G.pR = -.04; G.hP = -.7 + .08 * Math.sin(pw * P2); G.hY = lookY * .3; G.jaw = .04;
    let x, z;
    if (pw < .35) { const e = lisse(pw / .35); x = .06 + .32 * e; z = .2 * e; }
    else if (pw < .45) { const e = (pw - .35) / .1; x = .38; z = .2 * (1 - e * e); }
    else if (pw < .85) { x = .38 - .55 * lisse((pw - .45) / .4); z = 0; }
    else { const e = (pw - .85) / .15; x = -.17 + .23 * lisse(e); z = .1 * Math.sin(Math.PI * e); }
    pied[-1] = [x, -.31, z]; toe[-1] = pw < .45 ? .5 : 0; met[-1] = pw < .4 ? [-.04, 0, .36] : [-.12, 0, .34];
    for (const s of [-1, 1]) { main[s] = [.36 + .05 * Math.sin(t * 6 + s), s * .2, -.74]; poing[s] = .3; }
    D.naseau = snort; G.tAmp = .22; G.tW = 5; G.tUp = .1;
  } else D.naseau = 0;
  // ---- le galop ----
  if (galop) {
    G.galopW = 1; G.plus = .72 + .08 * Math.sin(P2 * ph + 1); G.pz = -.4 + .06 * Math.sin(P2 * ph); G.arch = .16 * Math.sin(P2 * ph - .6);
    G.hP = -.35 + .05 * Math.sin(P2 * ph + 2); G.hY = 0; G.jaw = .32 + .1 * Math.sin(P2 * ph);
    for (const s of [-1, 1]) {
      const ql = (ph - .45 - (s > 0 ? 0 : .07) + 2) % 1;
      if (ql < .4) { const k = seg(ql, .18, .4); pied[s] = [.25 - 1.05 * ql / .4, s * .3, 0]; met[s] = vM([-.12, 0, .34], [.07, 0, .35], lisse(k)); toe[s] = .7 * k; }
      else { const w = (ql - .4) / .6; pied[s] = [-.8 + 1.05 * lisse(w), s * .3, .42 * Math.sin(Math.PI * w)];
        met[s] = w < .4 ? vM([.07, 0, .35], [-.26, 0, .22], lisse(w / .4)) : vM([-.26, 0, .22], [-.12, 0, .34], lisse((w - .4) / .6)); toe[s] = w < .4 ? .7 + .2 * w / .4 : .9 * (1 - lisse((w - .4) / .6)); }
      const qa = (ph + (s > 0 ? 0 : .06)) % 1;
      const xa = qa < .4 ? .55 - .7 * qa / .4 : -.15 + .7 * lisse((qa - .4) / .6), za = qa < .4 ? 0 : .3 * Math.sin(Math.PI * (qa - .4) / .6);
      mainAbs[s] = ['galop', xa, s * .55, .08 + za]; poing[s] = qa < .4 ? 0 : .6; pole[s] = [-.5, s * .5, .3];
    }
    G.tUp = .35; G.tAmp = .12; G.tW = 7.5;
  }
  // ---- sonné : il titube ----
  if (sonne) {
    G.pz = -.15 + .04 * Math.sin(t * 2.1); G.py = .1 * Math.sin(t * 2.3); G.pR = .14 * Math.sin(t * 2.3 + .5); G.pY = .1 * Math.sin(t * 1.7); G.plus = .16 + .05 * Math.sin(t * 3.1);
    G.hR = .26 * Math.sin(t * 7); G.hY = .35 * Math.sin(t * 4.3); G.hP = -.35 + .15 * Math.sin(t * 2.2); G.jaw = .42;
    for (const s of [-1, 1]) {
      pied[s] = [.06 + .13 * Math.sin(t * 2.3 + (s > 0 ? 0 : 2)), s * (.31 + .04 * Math.sin(t * 1.9 + s)), Math.max(0, Math.sin(t * 4.6 + (s > 0 ? 0 : 3))) * .09];
      main[s] = [.2 + .13 * Math.sin(t * 2.5 + s), s * .16, -.87]; poing[s] = .15;
    }
    G.tAmp = .04; G.tW = 1; G.tUp = -.15;
  }
  // ---- le revers : la main droite ----
  if (revers) {
    G.cY = kf(u, [[0, 0], [.55, -.62], [.58, -.66], [.8, .62], [1.05, .85], [1.4, 0]]); G.pY = G.cY * .4;
    G.plus = kf(u, [[0, 0], [.55, -.06], [.8, .2], [1.05, .26], [1.4, 0]]); G.px = kf(u, [[0, 0], [.55, -.08], [.8, .1], [1.4, 0]]);
    G.pz = kf(u, [[0, 0], [.55, -.08], [.8, -.14], [1.05, -.1], [1.4, 0]]); G.pR = kf(u, [[0, 0], [.55, -.05], [.8, .06], [1.4, 0]]);
    G.hY = lookY * .7 - G.cY * .25; G.hP = kf(u, [[0, -.15], [.55, -.04], [.8, -.32], [1.4, -.15]]); G.jaw = kf(u, [[0, .12], [.62, .3], [.75, .85], [1.0, .6], [1.4, .12]]);
    const be = kf(u, [[0, -.3], [.55, -2.2], [.58, -2.26], [.8, .1], [1.05, 1.0], [1.4, -.3]]), R = kf(u, [[0, .35], [.55, .55], [.8, .98], [1.05, .82], [1.4, .35]]), z = kf(u, [[0, -.88], [.55, .5], [.58, .56], [.8, -.05], [1.05, -.3], [1.4, -.88]]);
    main[-1] = ['tourne', R * Math.cos(be), R * Math.sin(be), z]; poing[-1] = kf(u, [[0, .45], [.5, .95], [.58, .95], [.72, .05], [1.1, .1], [1.4, .45]]); pole[-1] = [-.2, -.45, -.8];
    main[1] = kf(u, [[0, repos(1)], [.55, [.6, .42, -.25]], [.8, [-.15, .36, -.55]], [1.05, [.05, .6, -.45]], [1.4, repos(1)]]); poing[1] = .7;
    pied[-1] = [kf(u, [[0, .06], [.6, 0], [.74, .33], [1.4, .06]]), -.3, kf(u, [[.6, 0], [.67, .15], [.75, 0]])];
    toe[-1] = kf(u, [[.6, 0], [.67, .6], [.75, 0]]);
    G.tY = -G.cY * 1.2; G.tAmp = .1; G.tW = 2;
  }
  // ---- le martèlement : les deux poings ----
  if (marteler) {
    const haut = s => [-.06, s * .1, .96], ab = kf(u, [[.92, 0], [1.08, 1], [1.45, 1], [1.78, 0]]);
    for (const s of [-1, 1]) {
      main[s] = kf(u, [[0, repos(s)], [.75, haut(s)], [.92, [-.13, s * .08, 1.02]], [1.1, [.9, s * .14, -1.2]], [1.45, [.9, s * .14, -1.2]], [1.9, repos(s)]]);
      mainAbs[s] = ab > 0 ? ['sol', ab, s * .14] : null; poing[s] = kf(u, [[0, .45], [.6, 1], [1.5, 1], [1.9, .45]]); pole[s] = [-.05, s, -.1];
    }
    G.plus = kf(u, [[0, 0], [.75, -.3], [.92, -.36], [1.1, .82], [1.45, .76], [1.9, 0]]);
    G.pz = kf(u, [[0, 0], [.75, .08], [.92, .1], [1.1, -.38], [1.18, -.43], [1.45, -.36], [1.9, 0]]); G.px = kf(u, [[0, 0], [.75, -.06], [1.1, .15], [1.9, 0]]);
    G.hP = kf(u, [[0, -.15], [.75, .45], [.92, .5], [1.1, -.55], [1.45, -.45], [1.9, -.15]]); G.hY = lookY * .4;
    G.jaw = kf(u, [[0, .12], [.6, .8], [.92, 1], [1.05, .2], [1.3, .5], [1.9, .12]]); G.cR = u > .75 && u < .92 ? .02 * Math.sin(t * 33) : 0;
    pied[1] = [kf(u, [[0, .06], [.9, .06], [1.02, .3], [1.9, .06]]), .34, kf(u, [[.9, 0], [.96, .13], [1.02, 0]])]; pied[-1] = [.06, -.34, 0];
    for (const s of [-1, 1]) met[s] = kf(u, [[0, [-.12, 0, .34]], [.75, [-.01, 0, .36]], [.95, [-.01, 0, .36]], [1.05, [-.14, 0, .33]]]);
    G.tUp = kf(u, [[0, 0], [.75, .4], [1.1, -.1], [1.9, 0]]); G.tAmp = .1; G.tW = 2.5;
  }
  // ---- la mort : à genoux, puis en avant ----
  if (mort) {
    const k1 = lisse(seg(mort, 0, .3)), k2 = lisse(seg(mort, .25, .7));
    G.pz = -.5 * k1 - .45 * k2; G.plus = .22 * k1 + .95 * k2; G.px = .12 * k2; G.pR = .25 * k2; G.py = 0; G.pY = 0; G.cY = .15 * k2;
    G.hP = -.2 - .45 * k2; G.hR = .5 * k2; G.hY = .3 * k2; G.jaw = .45 * k1 * (1 - .4 * k2);
    for (const s of [-1, 1]) { pied[s] = [.06 - .48 * k1, s * .3, 0]; met[s] = [-.12 - .1 * k1, 0, .34 - .14 * k1]; poing[s] = .2;
      mainAbs[s] = k2 > 0 ? ['tombe', k2, s * (.55 + .2 * k2)] : null; }
    G.tUp = -.25 * k2; G.tAmp = .05 * (1 - k2); G.tW = 1;
  }
  // ================= LE LISSAGE =================
  // au changement d'attitude, le lissage se fait plus lent un instant : il passe de l'une à l'autre, il ne saute pas
  const cat = galop ? 'g' : gratte ? 'gr' : revers ? 'rv' : marteler ? 'm' : rug ? 'r' : sonne ? 's' : surgit ? 'su' : mort ? 'd' : 'w';
  if (D.cat !== cat) { if (D.cat !== undefined) D.catT = t; D.cat = cat; }
  const kR = .22 + .78 * lisse(seg(t - (D.catT ?? -9), 0, .45));
  const vite = galop || (marche && v > .1), Rs = (acte || sonne ? 22 : vite ? 14 : 8) * kR, Rp = (vite ? 45 : acte ? 30 : 16) * kR, Rm = (vite || acte ? 34 : 18) * kR;
  const px = lis('px', G.px, Rs), py = lis('py', G.py, Rs), pz = lis('pz', G.pz, Rs), pY = lis('pY', G.pY, Rs), pR = lis('pR', G.pR, Rs), plus = lis('plus', G.plus, Rs), arch = lis('arch', G.arch, Rs);
  const cY = lis('cY', G.cY, Rs), cR = lis('cR', G.cR, Rs * 1.5), hY = lis('hY', G.hY, acte ? 14 : 6), hP = lis('hP', G.hP, 10), hR = lis('hR', G.hR, 12), jaw = lis('jaw', G.jaw, 18);
  const tUp = lis('tUp', G.tUp, 5), tAmp = lis('tAmp', G.tAmp, 4), tW = lis('tW', G.tW, 3), tY = lis('tY', G.tY, 5), galopW = lis('galopW', G.galopW, 6);
  D.tPh = (D.tPh || 0) + dtl * tW;
  // ================= LE CORPS =================
  const AN0 = [.25, .45, .62, .78], ARW = [-.7, -.2, .35, .7];
  const Q = [], Sp = [[px, py, 1.15 + pz]];
  for (let i = 0; i < 4; i++) { const k = i / 3; Q.push(rep(Sp[i], pY + (cY - pY) * k, AN0[i] + plus + arch * ARW[i], pR + (cR - pR) * k)); Sp.push(vA(Sp[i], vK(Q[i].U, .22))); }
  Q.push(rep(Sp[4], cY, AN0[3] + plus + arch * ARW[3], cR));
  // le tronc : le bassin, le ventre, la cage, les épaules, la base du cou — des masses qui se chevauchent
  bl(Q[0], -.2, .18, 0, 0, .54, .36, peau); sh(GA());
  bl(Q[1], -.22, .2, 0, 0, .56 * g, .36, peau); sh(GA());
  bl(Q[2], -.27, .27, 0, .02, .76 * g, .38 * (1 + (g - 1) * .5), peau); sh(GA(.5, 5));
  bl(Q[3], -.27, .25, 0, 0, .96, .32, peau); sh(GA(.5, 5));
  bl(Q[4], -.24, .1, 0, 0, .66, .24, peauB); sh(GA());
  bl(Q[4], -.3, -.04, 0, .06, .72, .26, peau); sh(GA(.55));                                   // la bosse du garrot
  const crunch = cl(plus - .2) * .25;                                                            // les abdominaux se serrent quand il se plie
  for (const s of [-1, 1]) { bl(Q[3], .04, .27, s * .2, -.04, .3 * (1 + (g - 1) * .8), .28, peauC); sh(GA(.6, 3)); }   // les pectoraux
  for (const k of [1, 2]) for (const s of [-1, 1]) { bl(Q[k], .14, .24, s * .085, (k === 1 ? .02 : -.02) * (1 - crunch), .14, .12 * (1 - crunch), ventre); sh(GA(.6, 3)); }
  { const R = Q[2]; add(R(.25, 0, -.1), R(.25, 0, .16), .045, .03, laveC, true); sh(GA(.8, 3)); add(R(.24, 0, -.14), R(.24, 0, .2), .07, .05, lave, true); sh(GA(.8, 3)); }   // le cœur de braise
  for (let k = 1; k <= 4; k++) { const A = Q[k](-.22, 0, 0), Uk = Q[k].U, Fk = Q[k].F, base = vA(A, vA(vK(Fk, -.04), vK(Uk, .08)));
    os2(A, base, .1, corne); sh(PR(.7, 6)); os2(base, vA(A, vA(vK(Fk, -.1), vK(Uk, .26 - k * .02))), .07, osC); sh(PR(0, 6)); mat(T.os); }   // les épines de l'échine
  for (const s of [-1, 1]) for (const [a, z] of [[-.12, .3], [-.02, .36]]) { const A = Q[3](a, s * .34, .08); os2(A, Q[3](a - .06, s * .42, .08 + z * .55), .065, osC); sh(PR(0, 6)); mat(T.os); }
  for (const [k, a, b] of [[2, -.18, .1], [2, .05, .2], [3, -.25, -.05], [1, .1, -.1]]) add(Q[k](.21, a, -.08), Q[k](.21, b, .06), .036, .036, lave, true);
  for (const [k, a, b] of [[1, -.22, -.1], [3, .15, .02], [2, -.2, .02]]) add(Q[k](-.2, a, -.06), Q[k](-.22, b, .07), .03, .03, lave, true);
  // ---- la tête : de taureau ; elle suit sa cible du regard ----
  const N0 = Q[4](.06, 0, .06), H = vA(N0, rz([.24, 0, .04], cY * .5 + hY * .4));
  os2(N0, H, .34, peau); sh(PR(.85));
  const M = rep(H, hY, -hP, hR);
  const ouv = cl(jaw, 0, 1.1);
  bl(M, -.15, .17, 0, .05, .36, .3, peau); sh(GA(.55));                                         // le crâne
  bl(M, .1, .21, 0, .15, .38, .08, peauB); sh(GA(.6, 3));                                       // l'arcade
  bl(M, .08, .33, 0, -.08, .27, .16, peau); sh(PR(.82));                                         // le mufle
  bl(M, .3, .345, 0, -.08, .2, .12, ventre); sh(GA(.7, 3));                                      // le nez
  const nas = D.naseau || 0;
  for (const s of [-1, 1]) { add(M(.34, s * .05, -.07), M(.35, s * .05, -.07), .035 + .02 * nas, .035 + .02 * nas, nas > .3 ? laveC : lave, true); sh(GA(1, 3)); }
  bl(M, .06, .29, 0, -.2 - ouv * .12, .22, .06, sombre); sh(PR(.7));                             // la mâchoire
  bl(M, .12, .26, 0, -.14 - ouv * .06, .18, .03 + ouv * .1, lave, true); sh(GA(.8, 3));        // la gueule de braise
  const yeux = sonne ? ((t * 9 | 0) % 3 ? [255, 160, 60] : [120, 40, 20]) : [255, Math.min(255, 160 + 80 * flambe) | 0, 60 + 100 * flambe | 0];
  for (const s of [-1, 1]) {
    bl(M, .19, .215, s * .095, .1, .065, .04, yeux, true); sh(GA(1, 3));
    for (const z of [-.1, -.16]) { add(M(.27 - (z + .1) * .3, s * .075, z + .02), M(.28 - (z + .1) * .3, s * .07, z - .07), .03, .03, croc); sh(PR(0, 6)); mat(T.os); }
    add(M(.24, s * .07, -.2 - ouv * .12), M(.25, s * .065, -.13 - ouv * .12), .026, .026, croc); sh(PR(0, 6)); mat(T.os);
    const tic = Math.pow(Math.max(0, Math.sin(t * 2.3 + s * 1.7 + (f.bob || 0) * 5)), 24) * vif;   // l'oreille qui frémit
    add(M(-.03, s * .17, .12), M(-.1, s * (.27 + .03 * tic), .1 + .07 * tic), .1, .03, peau); sh({ fin: [.4, .6] });
    let p = M(-.02, s * .16, .2); const W = [.16, .135, .11, .08, .05];
    W.forEach((w, i) => {
      const n = M(-.02 + [-.1, -.22, -.26, -.18, -.04][i], s * (.16 + [.1, .16, .18, .18, .16][i]), .2 + [.12, .26, .42, .56, .66][i]);
      os2(p, n, w, [corne, corne, corneB, corneP, corneP][i]); sh(PR(i === 4 ? 0 : W[i + 1] / w, 8, .8)); mat(T.os);
      if (i < 4) { os2(vM(p, n, .92), vM(p, n, 1.04), w * 1.12, i < 2 ? sombre : corneB.map(x => x * .6)); sh(GA(.8, 3)); }
      p = n; });
  }
  // ---- les jambes de bouc : hanche, genou devant, jarret derrière, sabot ----
  for (const s of [-1, 1]) {
    const hip = Q[0](0, s * .24, 0), F = lisV('pied' + s, pied[s], Rp), mt = rz(lisV('met' + s, met[s], Rm), pY * .5), to = lis('toe' + s, toe[s], Rm);
    const A = vA(F, mt), K = genouD(hip, A, .55, .48, rz([1, 0, -.15], pY));
    const charge = cl(1 - vL(vS(A, hip)) / 1.02, 0, .5) * 2, pousse = cl((mt[0] + .12) / .14);
    os2(hip, K, .32, peau); sh(PR(.62));
    os2(vM(hip, K, .1), vM(hip, K, .62), .36 * (1 + .14 * charge), peau); sh(GA(.55));            // la cuisse, qui gonfle sous la charge
    for (const q of [.25, .45, .65]) { const a = vM(hip, K, q); os2(vA(a, rz([-.1, 0, .02], pY)), vA(a, rz([-.2, 0, -.14], pY)), .1, poil); sh({ fin: [.2, .5] }); }
    os2(K, A, .2, peauB); sh(PR(.7));
    { const d = vN(vS(A, K)), bk = rz([-1, 0, 0], pY), off = vK(vN(vS(bk, vK(d, bk[0] * d[0] + bk[1] * d[1] + bk[2] * d[2]))), .06);
      os2(vA(vM(K, A, .15), off), vA(vM(K, A, .6), off), .19 * (1 + .25 * pousse), peau); sh(GA(.6, 3)); }   // le mollet, à la poussée
    add(vM(hip, K, .2), vM(hip, K, .75), .028, .028, lave, true);
    os2(vS(K, [.02, 0, 0]), vA(K, [.03, 0, 0]), .19, peauC); sh(GA(.7, 3));                      // le genou
    os2(A, F, .14, sombre); sh(PR(.75));
    os2(vA(A, rz([-.04, 0, .02], pY)), vA(A, rz([-.22, 0, -.08], pY)), .11, poil); sh({ fin: [.2, .5] });   // l'ergot de poil
    const fw = rz([Math.cos(to), 0, -Math.sin(to)], pY), up = rz([Math.sin(to), 0, Math.cos(to)], pY), lat = rz([0, 1, 0], pY);
    for (const d of [-1, 1]) { add(vA(F, vA(vK(fw, -.05), vA(vK(lat, d * .04), vK(up, .06)))), vA(F, vA(vK(fw, .15), vK(lat, d * .045))), .085, .1, ongle); sh(PR(.45, 6, .7)); mat(T.os); }
  }
  // ---- les bras : épaule, biceps, avant-bras, main, griffes ----
  for (const s of [-1, 1]) {
    const Sh = Q[3](0, s * .48, .05), L1 = .52 + .1 * galopW, L2 = .5 + .1 * galopW;
    let cible;
    const m = main[s], ma = mainAbs[s];
    if (Array.isArray(m) && m[0] === 'tourne') cible = vA(Sh, rz([m[1], m[2], m[3]], cY));
    else cible = vA(Sh, rz(m, cY * .8));
    if (ma) {
      if (ma[0] === 'galop') cible = [Sh[0] + .35 + ma[1] * .8, ma[2], ma[3]];
      else if (ma[0] === 'sol') cible = vM(cible, [Sh[0] + .92, ma[2], .12], ma[1]);
      else if (ma[0] === 'tombe') cible = vM(cible, [Sh[0] + .5, ma[2], .05], ma[1]);
      else cible = ma;
    }
    const Hd = lisV('main' + s, cible, Rm), pl2 = rz(lisV('pole' + s, pole[s], 10), cY), cf = lis('poing' + s, poing[s], 14);
    const El = genouD(Sh, Hd, L1, L2, pl2), pli = cl(1 - vL(vS(Hd, Sh)) / (L1 + L2));
    os2(vA(Sh, vK(vN(vS(El, Sh)), -.04)), vA(Sh, vA(vK(vN(vS(El, Sh)), .1), [0, 0, -.04])), .34, peauC); sh(GA(.55));   // l'épaule, qui suit le bras
    os2(Sh, El, .24, peau); sh(PR(.72));
    os2(vM(Sh, El, .25), vM(Sh, El, .72), .27 * (1 + .45 * pli), peau); sh(GA(.6));                // le biceps, qui gonfle quand le coude plie
    os2(El, Hd, .21, peauB); sh(PR(.68));
    os2(vM(El, Hd, .05), vM(El, Hd, .4), .23 * (1 + .15 * cf), peauB); sh(GA(.6, 3));             // l'avant-bras, qui serre avec le poing
    add(vM(Sh, El, .2), vM(Sh, El, .8), .03, .03, lave, true); add(vM(El, Hd, .15), vM(El, Hd, .75), .025, .025, lave, true);
    const de = vN(vS(El, Sh));
    os2(El, vA(El, vA(vK(de, .2), [0, 0, .02])), .08, osC); sh(PR(0, 6)); mat(T.os);            // l'éperon du coude
    const ud = vN(vS(Hd, El)), dn0 = [0, 0, -1], dd = ud[2] * -1, bas2 = vN(vS(dn0, vK(ud, -dd)));
    const plat = ma && ma[0] === 'galop';
    const Pm = plat ? vA(Hd, [.12, 0, -.06]) : vA(Hd, vK(ud, .14));
    os2(Hd, Pm, .22, peauB); sh(GA(.6, 3));                                                        // la main
    for (const q of [-.07, -.023, .023, .07]) {
      const ecart = .3 + .7 * (1 - cf), a = vA(Pm, [0, q, 0]);
      const dir = plat ? [.9, q * 2.4, -.1] : vN(vA(vK(ud, 1 - 1.5 * cf), vA(vK(bas2, .35 + .9 * cf), [0, q * ecart * 3, 0])));
      os2(a, vA(a, vK(vN(dir), .18 - .05 * cf)), .05, ongle); sh(PR(0, 6)); mat(T.os);              // les griffes : ouvertes, ou repliées en poing
    }
  }
  // ---- la queue : elle répond au bassin, ondule, se lève à l'effort ----
  let q = Q[0](-.22, 0, -.02), pt = .72 - tUp;
  for (let j = 1; j <= 6; j++) {
    pt += -.17 + .04 * Math.sin(D.tPh * 1.3 - j * .5) * (1 + tAmp * 4);
    const yw = pY + tY * (j / 6) + tAmp * Math.sin(D.tPh * P2 / 2.2 - j * .62) * (j / 3), ln = .2 * (1 - j * .05);
    const d = rz([-Math.cos(pt), 0, -Math.sin(pt)], yw), n = vA(q, vK(d, ln)), w = .17 - j * .02;
    os2(q, n, w, j > 2 ? peauB : peau); sh(PR(Math.max(.4, (w - .02) / w))); q = n;
    if (j === 6) { add(vA(q, vK(d, -.02)), vA(q, vA(vK(d, .22), [0, 0, .02])), .22, .04, corneB); sh({ fin: [0, .6] }); mat(T.os); }
  }
  // il sort du cercle, ou s'effondre : tout descend
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
// une basse, une batterie, des timbales et des toms, un chœur, des cuivres, un violon solo, des cloches
// (la salle est celle du jeu). En 6/8, ré mineur, la croche à 0,19 s. Cinq parties qui s'enchaînent selon le
// danger (brumeIntensite) : l'OUVERTURE (un bourdon, le chœur qui monte, l'horloge des pizzicati), le
// RIFF (l'ostinato des cordes, la batterie), le THÈME (le violon chante par-dessus, les cuivres, le chœur),
// le SOMMET (tout, une octave plus haut, deux violons, les cuivres à chaque mesure, les timbales), et le
// PONT (un cœur qui bat, les cloches qui rappellent le thème, puis la montée et le roulement de caisse).
// valseBrume(ctx, sortie) rend un lecteur : lecteur.maj(maintenant, intensité), appelé à chaque image ; les
// parties sont écrites d'avance dans des tampons (partitionValse, rendreValse), puis enchaînées (voir plus bas).
// ---- la partition : les accords (en demi-tons depuis le ré) et les mélodies [note, croches] de chaque partie ----
const VALSE_E = .19;                                       // une croche (6/8 : six par mesure)
const VALSE_PARTIES = (() => {
  const Dm = [0, 3, 7], C = [-2, 2, 5], Bb = [-4, 0, 3], A = [-5, -1, 2], F = [3, 7, 10], Gm = [-7, -4, 0];
  return {
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
})();
const valseSuite = (p, I, n) => p === 'O' ? 'R' : p === 'R' ? (I < .5 ? 'P' : 'T') : p === 'T' ? (I > .75 ? 'S' : 'R') : p === 'S' ? (I > .85 && n % 2 ? 'T' : I > .85 ? 'S' : 'P') : (I > .6 ? 'S' : 'R');
const valseDuree = p => VALSE_PARTIES[p].acc.length * 6 * VALSE_E;
// L'orchestre : écrit une partie, note à note, dans un contexte audio (hors ligne : voir le lecteur, plus bas).
function partitionValse(ctx, sortie) {
  const E = VALSE_E, f = n => 293.66 * 2 ** (n / 12);
  // La sortie : un seul gain, branché sur le bus de la musique du jeu, qui a déjà sa salle (l'écho) et son
  // compresseur. Pour qu'un téléphone tienne (§103) : pas de salle ni de compresseur à part, des chaînes de
  // filtres partagées (le corps du violon, les voyelles du chœur), un vibrato commun, une ou deux voix par
  // note, et chaque note se débranche dès qu'elle s'est tue.
  const bus = ctx.createGain(); bus.gain.value = .8; bus.connect(sortie);
  const BR = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), bd = BR.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
  const PLACE = [-.25, 0, .25].map(pan => { const G = ctx.createGain(); if (pan && ctx.createStereoPanner) { const P = ctx.createStereoPanner(); P.pan.value = pan; G.connect(P); P.connect(bus); } else G.connect(bus); return G; });
  const ici = pan => pan < -.1 ? 0 : pan > .1 ? 2 : 1;
  const voie = (verb, pan = 0) => { const G = ctx.createGain(); G.connect(PLACE[ici(pan)]); return G; };
  const env = (G, t0, a, pic, tenue, rel) => { const g = G.gain; g.setValueAtTime(.0001, t0); g.exponentialRampToValueAtTime(Math.max(.0002, pic), t0 + a); if (tenue > 0) g.setValueAtTime(Math.max(.0002, pic), t0 + a + tenue); g.exponentialRampToValueAtTime(.0001, t0 + a + tenue + rel); return t0 + a + tenue + rel + .02; };
  const osc = (type, fr, t0, fin, dest, det = 0) => { const O = ctx.createOscillator(); O.type = type; O.frequency.setValueAtTime(fr, t0); if (det) O.detune.value = det; O.connect(dest); O.start(t0); O.stop(fin); return O; };
  const bruit = (t0, fin, dest) => { const S = ctx.createBufferSource(); S.buffer = BR; S.loop = true; S.connect(dest); S.start(t0, Math.random() * 1.5); S.stop(fin); return S; };
  const filtre = (type, fr, q, dest) => { const F = ctx.createBiquadFilter(); F.type = type; F.frequency.value = fr; F.Q.value = q; F.connect(dest); return F; };
  const lacher = (S, G, vib) => { S.onended = () => { G.disconnect(); if (vib) try { vib.disconnect(S.detune); } catch (e) { /* déjà fait */ } }; };
  // le vibrato commun, en cents (la même ondulation à toutes les hauteurs)
  const vibrato = (fr, cents) => { const L = ctx.createOscillator(), G = ctx.createGain(); L.frequency.value = fr; G.gain.value = cents; L.connect(G); L.start(); return G; };
  const VIB_V = vibrato(5.6, 13), VIB_C = vibrato(4.8, 10);
  // les chaînes partagées : le corps du violon (à droite le premier, à gauche le second), les voyelles du chœur
  const corps = pan => { const In = ctx.createGain(), F = filtre('lowpass', 6500, .9, PLACE[ici(pan)]), B = filtre('peaking', 3000, 1.2, F); B.gain.value = 6; In.connect(B); return In; };
  const VIOLON = [corps(-.15), corps(.12)];
  const voyelle = (Fm, pan) => { const In = ctx.createGain(); for (const [fq, q, g] of Fm) { const G = ctx.createGain(); G.gain.value = g * 3.6; G.connect(PLACE[ici(pan)]); In.connect(filtre('bandpass', fq, q, G)); } return In; };
  const CHOEUR = { a: [-.3, 0, .3].map(p => voyelle([[730, 6, 1.1], [1090, 8, .7]], p)), o: [-.3, 0, .3].map(p => voyelle([[480, 6, 1.1], [820, 8, .55]], p)) };
  // ---- les instruments ----
  const corde = (fr, t0, d, v, pan = 0, mince) => {                  // les cordes piquées (spiccato) : une scie, un filtre qui se referme
    const G = voie(.32, pan), fin = env(G, t0, .006, v * (mince ? 1 : 1.35), d * .25, .11), F = filtre('lowpass', 900, 1.2, G);
    F.frequency.setValueAtTime(6000, t0); F.frequency.exponentialRampToValueAtTime(1900, t0 + d);
    lacher(osc('sawtooth', fr, t0, fin, F, mince ? 0 : 5), G);
  };
  const violon = (fr, t0, d, v, pan = .12, seul) => {               // le violon solo : l'archet qui attaque, le vibrato commun
    const G = ctx.createGain(), fin = env(G, t0, .07, v * (seul ? 1 : .8), Math.max(0, d - .07), .3); G.connect(VIOLON[pan < 0 ? 0 : 1]);
    for (const c of seul ? [0] : [-6, 6]) { const O = osc('sawtooth', fr * .985, t0, fin, G, c); O.frequency.exponentialRampToValueAtTime(fr, t0 + .05); VIB_V.connect(O.detune); lacher(O, G, VIB_V); }
  };
  const basse = (fr, t0, d, v) => { const G = voie(.04), fin = env(G, t0, .006, v * 1.15, d * .45, .22), F = filtre('lowpass', 420, 1.6, G); lacher(osc('sawtooth', fr, t0, fin, F), G); };
  const grosse = (t0, v) => {                                 // la grosse caisse : une chute de hauteur, un claquement
    const G = voie(.08), fin = env(G, t0, .002, v, .02, .32), O = osc('sine', 155, t0, fin, G); O.frequency.exponentialRampToValueAtTime(48, t0 + .12); lacher(O, G);
    const C = voie(0), F = filtre('highpass', 3200, .7, C); env(C, t0, .001, v * .45, 0, .025); lacher(bruit(t0, t0 + .05, F), C);
  };
  const caisse = (t0, v, court) => {                          // la caisse claire : du bruit et un ton
    const G = voie(.35, -.06), fin = env(G, t0, .002, v, 0, court ? .09 : .17); lacher(bruit(t0, fin, filtre('bandpass', 1900, .8, G)), G);
    if (!court) { const T = voie(.2, -.06), f2 = env(T, t0, .002, v * .5, 0, .09), O = osc('triangle', 210, t0, f2, T); O.frequency.exponentialRampToValueAtTime(165, t0 + .08); lacher(O, T); }
  };
  const charley = (t0, v, ouvert) => { const G = voie(.08, .25), fin = env(G, t0, .001, v, 0, ouvert ? .2 : .035); lacher(bruit(t0, fin, filtre('highpass', 7600, .7, G)), G); };
  const crash = (t0, v) => { const G = voie(.4, -.2), fin = env(G, t0, .002, v, .05, 1.7); lacher(bruit(t0, fin, filtre('highpass', 4800, .6, G)), G); };
  const tom = (fr, t0, v) => { const G = voie(.5, fr > 130 ? .2 : -.2), fin = env(G, t0, .003, v * 1.1, .02, .32), O = osc('sine', fr * 1.5, t0, fin, G); O.frequency.exponentialRampToValueAtTime(fr, t0 + .1); lacher(O, G); };
  const timbale = (fr, t0, v, rel = .9) => { const G = voie(.5), fin = env(G, t0, .004, v, .02, rel), O = osc('sine', fr * 1.06, t0, fin, G); O.frequency.exponentialRampToValueAtTime(fr, t0 + .15); osc('triangle', fr * 2.01, t0, Math.min(fin, t0 + .4), G); lacher(O, G); };
  const choeur = (fr, t0, d, v, voy = 'a', pan = 0) => {      // une voix : une scie dans les formants partagés, le vibrato commun
    const G = ctx.createGain(), fin = env(G, t0, .45, v * 1.4, Math.max(0, d - .45), .9); G.connect(CHOEUR[voy][ici(pan)]);
    const O = osc('sawtooth', fr, t0, fin, G, (Math.random() - .5) * 14); VIB_C.connect(O.detune); lacher(O, G, VIB_C);
  };
  const cuivre = (frs, t0, d, v) => {                         // les cuivres : l'éclat qui s'ouvre puis se referme
    for (const fr of frs) {
      const G = voie(.38, (Math.random() - .5) * .3), fin = env(G, t0, .02, v * 1.35, d, .16), F = filtre('lowpass', 500, 2, G);
      F.frequency.setValueAtTime(500, t0); F.frequency.exponentialRampToValueAtTime(5000, t0 + .05); F.frequency.exponentialRampToValueAtTime(1400, t0 + .05 + d);
      const O = osc('sawtooth', fr * .97, t0, fin, F, 4); O.frequency.exponentialRampToValueAtTime(fr, t0 + .04); lacher(O, G);
    }
  };
  const cloche = (fr, t0, v) => { for (const [r, g, dd] of [[1, 1, 2.2], [2.76, .35, 1.2], [5.4, .15, .6]]) { const G = voie(.6, .15), fin = env(G, t0, .002, v * g, 0, dd); lacher(osc('sine', fr * r, t0, fin, G), G); } };
  const pizz = (fr, t0, v, pan) => { const G = voie(.3, pan), fin = env(G, t0, .003, v * 1.2, 0, .16); lacher(osc('triangle', fr, t0, fin, filtre('lowpass', 2200, .8, G)), G); };
  const bourdon = (fr, t0, d, v) => { const G = voie(.5), fin = env(G, t0, 1.5, v, Math.max(0, d - 2), 2), F = filtre('lowpass', 520, .9, G); lacher(osc('sawtooth', fr, t0, fin, F, -5), G); osc('sawtooth', fr * 1.5, t0, fin, F, 5); osc('sine', fr / 2, t0, fin, G); };
  const montee = (t0, d, v) => { const G = voie(.5), fin = env(G, t0, d * .9, v, 0, .15), F = filtre('bandpass', 400, 1.4, G); F.frequency.setValueAtTime(350, t0); F.frequency.exponentialRampToValueAtTime(7000, t0 + d); lacher(bruit(t0, fin, F), G); };
  // ---- la partition (VALSE_PARTIES, valseSuite : plus haut) ----
  const PARTIES = VALSE_PARTIES, suite = valseSuite;
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
    jouer(p, I, t0 = .05) {                                   // toute la partie p, d'un coup, à l'intensité I
      Object.assign(st, { p, m: 0, s: 0, n: 0 }); const n = PARTIES[p].acc.length * 6;
      for (let i = 0; i < n; i++) { pas(t0 + i * E, I); st.p = p; if (st.m === 0 && st.s === 0 && i > 0) break; }
    },
  };
}
// Le lecteur (§103). Jouer la valse note à note pendant la partie pesait trop sur un téléphone (le son
// craquait, le jeu ralentissait). Chaque partie est donc rendue une fois, en tâche de fond, dans un tampon
// (24 kHz, avec sa traîne), dès la première entrée dans la brume ; puis le lecteur enchaîne les tampons
// selon le danger : un ou deux sons à la fois, presque rien à calculer. La valse a deux versions : calme
// (sans batterie) et pleine. Tant qu'une partie n'est pas prête, on attend (l'ouverture l'est en un instant).
// lecteur.maj(maintenant, intensité) doit être appelé à chaque image : s'il cesse de l'être (on quitte la
// brume, l'onglet dort), la musique s'éteint d'elle-même en une seconde.
const VALSE_RENDUS = {};                                   // les tampons, gardés pour toute la séance
function rendreValse() {
  if (VALSE_RENDUS.lance || typeof OfflineAudioContext === 'undefined') return; VALSE_RENDUS.lance = true;
  const SR = 24000, TRAINE = 2.2, VERSIONS = [['O', 'O', .35], ['R', 'R', .6], ['T', 'T', .75], ['S', 'S', .95], ['Rc', 'R', .35], ['P', 'P', .35]];
  (async () => {
    for (const [cle, p, I] of VERSIONS) {
      try { const off = new OfflineAudioContext(2, Math.ceil(SR * (valseDuree(p) + TRAINE)), SR); partitionValse(off, off.destination).jouer(p, I); VALSE_RENDUS[cle] = await off.startRendering(); }
      catch (e) { /* cette partie restera muette */ }
    }
  })();
}
function valseBrume(ctx, sortie, depart = 'O') {           // (depart : une autre partie pour commencer, pour les essais)
  rendreValse();
  const G = ctx.createGain(); G.connect(sortie);
  const st = { ok: false, vu: 0, p: depart, cour: depart, fin: 0, n: 0, sons: [] };
  return {
    maj(now, I) {
      I = Math.max(0, Math.min(1, I));
      if (!st.ok || now - st.vu > .5) {                       // (re)partir de l'ouverture
        for (const S of st.sons) try { S.stop(); } catch (e) { /* déjà fini */ }
        Object.assign(st, { ok: true, p: depart, cour: depart, fin: now + .05, n: 0, sons: [] });
      }
      st.vu = now;
      G.gain.cancelScheduledValues(now); G.gain.setValueAtTime(1, now); G.gain.setTargetAtTime(0, now + .5, .25);   // l'homme mort
      while (st.fin < now + .6) {
        const B = VALSE_RENDUS[st.p === 'R' && I < .45 && VALSE_RENDUS.Rc ? 'Rc' : st.p];
        if (!B) { st.fin = Math.max(st.fin, now + .05); break; }   // pas encore prête : on attend
        const S = ctx.createBufferSource(), t0 = Math.max(st.fin, now); S.buffer = B; S.connect(G); S.start(t0);
        S.onended = () => { S.disconnect(); st.sons = st.sons.filter(x => x !== S); }; st.sons.push(S);
        st.cour = st.p; st.fin = t0 + valseDuree(st.p); st.n++; st.p = valseSuite(st.p, I, st.n);
      }
    },
    get partie() { return st.cour; },
  };
}
