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
// elle se lève sur l'île. Mais s'ils achèvent leur incantation (sept minutes, plus lente à mesure qu'ils
// tombent), un DÉMON cornu sort du cercle, massacre les mages, puis s'en prend à vous ; la brume ne se
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
const INCANT_DUREE = 420;                                  // l'incantation complète : sept minutes, tous les mages vivants
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
function cibleBrume(b, R) {
  let best = null, bd = R * R;
  for (const J of (typeof joueursFaune === 'function' ? joueursFaune() : [P])) if (J.pv > 0 && Math.abs(J.z - b.z) < 4) { const d = (J.x - b.x) ** 2 + (J.y - b.y) ** 2; if (d < bd) { bd = d; best = J; } }
  for (const o of beasts) if (o.tame && !o.dead && o.pv > 0 && !o.loin && Math.abs(o.z - b.z) < 4) { const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2; if (d < bd * .7) { bd = d; best = o; } }
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
  b.gph = (b.gph || 0) + dt * (b.vit || 0) * .9;
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
  const c = cibleBrume(b, 30);
  if (!c) { b.vit = 0; b.etat = 'rôder'; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); b.etat = 'traquer';
  if (d < 2.6 && t > (b.repos || 0)) { agirBrume(b, 'bond', c); return; }
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
  SON.jouer('rugissement'); say('L\'incantation est achevée · quelque chose sort du cercle', 4); P.secousse = t; P.secousseK = .6;
}
function majDemon(b, dt) {
  const ph = b.phaseD || 'surgir';                           // (b.etat dit ce qui se voit ; b.phaseD, où il en est)
  if (ph === 'surgir') {                                     // il sort du cercle, lentement
    b.etat = 'surgir'; b.emerge = Math.min(1, (b.emerge || 0) + dt / 4); b.vit = 0; P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .25);
    if (b.emerge >= 1) { b.phaseD = 'rugir'; b.etat = 'rugir'; b.actT = t; SON.jouer('rugissement', {}, b.x, b.y, b.z + 3); }
    return;
  }
  if (ph === 'rugir') { b.etat = 'rugir'; b.vit = 0; if (t - b.actT > 2) b.phaseD = magesVivants().length ? 'massacrer' : 'chasser'; return; }
  if (b.act) return actionDemon(b, dt);
  if (ph === 'massacrer') {                                  // les mages d'abord
    b.etat = 'massacrer';
    const M = magesVivants();
    if (!M.length) { b.phaseD = 'rugir'; b.etat = 'rugir'; b.actT = t; SON.jouer('rugissement', {}, b.x, b.y, b.z + 3); return; }
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
      b.fait = true; const [x, y] = b.impact; SON.jouer('impact', {}, x, y, b.z); SON.jouer('rugissement', {}, b.x, b.y, b.z + 3);
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
  const ram = f.etat === 'ramasser', bond = f.etat === 'bondir', v = Math.min(1, (f.vit || 0) / 5), ph = (f.gph || 0) * 6.2832, mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const hz = (ram ? .34 : .5) * (1 - mort * .6), AN = [1.62, 1.57, 1.52, 1.48], S = chaine([-.45, 0, hz + .02], AN, .22), Q = k => cadre(S[k], AN[Math.min(k, 3)]);
  bloc(Q(0), -.12, .1, 0, 0, .22, .26, corps); bloc(Q(1), -.11, .08, 0, 0, .2, .26, corps); bloc(Q(2), -.14, .14, 0, 0, .26, .26, corps); bloc(Q(3), -.14, .12, 0, 0, .27, .22, corps);
  for (let k = 0; k < 4; k++) bloc(Q(k), -.17, -.12, 0, 0, .05, .08, sombre);                                            // l'échine
  const N = pl(S[4], [.14, 0, .1]), ouv = ram ? .8 : bond ? 1 : .15 + .1 * Math.sin(t * 6);
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
function osDemon(f, O) {
  const { B, add, tete, bloc, os2, mi, pl, chaine, cadre } = O;
  const peau = [64, 16, 14], sombre = [30, 8, 8], corne = [40, 32, 28], corneB = [86, 74, 62], ongle = [20, 16, 14];
  const E = f.etat, u = f.actT != null ? t - f.actT : 9, v = Math.min(1, (f.vit || 0) / 3), ph = (f.gph || 0) * 6.2832;
  const mort = f.dead > 0 ? Math.min(1, f.dead) : 0, respire = .5 + .5 * Math.sin(t * 1.6), lave = [255, 90 + 70 * respire * (1 - mort) | 0, 30];
  const rug = E === 'rugir' || E === 'surgir', charge = E === 'charger' && u >= .9, sonne = E === 'charger' && f.sonne > t;
  const plus = charge ? .35 : sonne ? .15 : 0, AN = [.25, .45, .62, .78].map(a => a + plus + (rug ? -.15 : 0)), S = chaine([0, 0, 1.15], AN, .22), Q = k => cadre(S[k], AN[Math.min(k, 3)]);
  bloc(Q(0), -.2, .18, 0, 0, .5, .26, peau); bloc(Q(1), -.22, .2, 0, 0, .52, .26, peau); bloc(Q(2), -.26, .26, 0, 0, .7, .26, peau);
  bloc(Q(3), -.26, .24, 0, 0, .9, .24, peau); bloc(Q(4), -.22, .1, 0, 0, .62, .16, sombre);
  for (let k = 1; k <= 4; k++) { const A = Q(k)(-.22, 0, 0); os2(A, pl(A, [-.08, 0, .2]), .06, corne); }                // les épines de l'échine
  for (const [k, a, b] of [[2, -.18, .1], [2, .05, .2], [3, -.25, -.05], [1, .1, -.1]]) { const R = Q(k); add(R(.27, a, -.08), R(.27, b, .06), .028, .028, lave, true); }   // la lave, dans les fentes
  // la tête : de taureau, les cornes, la gueule de braise
  const N0 = Q(4)(.06, 0, .06), H = pl(N0, [.24, 0, .04]), ouv = rug ? .9 + .1 * Math.sin(t * 20) : E === 'revers' || E === 'marteler' ? .5 : .12;
  os2(N0, H, .3, peau);
  const M = tete(H, rug ? .45 : charge ? -.65 : sonne ? Math.sin(t * 9) * .3 : -.15, sonne ? Math.sin(t * 7) * .25 : 0);
  bloc(M, -.14, .16, 0, .05, .34, .28, peau); bloc(M, .12, .2, 0, .14, .36, .07, sombre); bloc(M, .1, .3, 0, -.08, .26, .14, peau);
  bloc(M, .06, .28, 0, -.2 - ouv * .12, .22, .06, sombre); bloc(M, .12, .26, 0, -.14 - ouv * .06, .18, .03 + ouv * .1, lave, true);
  for (const s of [-1, 1]) {
    bloc(M, .2, .215, s * .09, .1, .06, .035, [255, 160, 60], true);
    for (const z of [-.1, -.17]) bloc(M, .27, .29, s * .07, z, .025, .05, [230, 220, 200]);                              // les crocs
    let p = M(-.02, s * .16, .2);                                                                                        // la corne : en arrière, puis vers le ciel
    [[-.1, .1, .12, .14], [-.12, .06, .14, .12], [-.04, .02, .16, .1], [.08, 0, .14, .07], [.14, -.02, .08, .045]].forEach(([a, b, c, w], i) => {
      const n = M(-.02 + [-.1, -.22, -.26, -.18, -.04][i], s * (.16 + [.1, .16, .18, .18, .16][i]), .2 + [.12, .26, .42, .56, .64][i]); os2(p, n, w, i < 3 ? corne : corneB); p = n; });
  }
  // les bras
  for (const s of [-1, 1]) {
    const Sh = Q(3)(0, s * .48, .05); let El, Hd;
    if (rug) { El = pl(Sh, [0, s * .45, .2]); Hd = pl(El, [.05, s * .25, .35]); }
    else if (E === 'revers' && s < 0) { if (u < .75) { El = pl(Sh, [-.2, -.3, .35]); Hd = pl(El, [-.1, -.2, .4]); } else { El = pl(Sh, [.4, -.05, -.05]); Hd = pl(El, [.45, .35, -.1]); } }
    else if (E === 'marteler') { if (u < 1.1) { El = pl(Sh, [.1, -s * .05, .45]); Hd = [Sh[0] + .32, s * .14, Sh[2] + .95]; } else { El = pl(Sh, [.45, -s * .02, -.3]); Hd = [Sh[0] + .95, s * .14, .12]; } }
    else if (charge) { El = pl(Sh, [-.25, s * .15, -.25]); Hd = pl(El, [-.25, s * .05, -.2]); }
    else { const bal = Math.sin(ph + (s > 0 ? 0 : Math.PI)) * .18 * v; El = pl(Sh, [.15 + bal, s * .12, -.45]); Hd = pl(El, [.2 + bal, s * .02, -.45]); }
    os2(Sh, El, .22, peau); os2(El, Hd, .18, peau); add(mi(Sh, El, .2), mi(Sh, El, .8), .03, .03, lave, true);
    const dd = [Hd[0] - El[0], Hd[1] - El[1], Hd[2] - El[2]], dl = Math.hypot(...dd) || 1, ud = dd.map(q => q / dl), Pm = pl(Hd, ud.map(q => q * .14));
    os2(Hd, Pm, .2, sombre);
    for (const q of [-.07, -.023, .023, .07]) { const a = pl(Pm, [0, q, 0]); os2(a, pl(a, [ud[0] * .16 + .04, ud[1] * .16 + q * .3, ud[2] * .16 - .05]), .045, ongle); }
  }
  // les pattes de bouc : la cuisse en avant, le jarret en arrière, le sabot
  for (const s of [-1, 1]) {
    const p = ph + (s > 0 ? 0 : Math.PI), hip = Q(0)(0, s * .24, 0), K = pl(hip, [.18 + Math.sin(p) * .12 * v, s * .04, -.42]);
    const A = pl(K, [-.22, 0, -.32]), F = [A[0] + .06 + Math.sin(p) * .22 * v, s * .28, .04 + Math.max(0, Math.cos(p)) * .14 * v];
    os2(hip, K, .27, peau); os2(K, A, .19, peau); os2(A, F, .13, sombre); bloc(O.rep(F, [1, 0, 0], [0, 1, 0], [0, 0, 1]), -.06, .14, 0, -.02, .17, .07, ongle);
  }
  let q = S[0];                                                                                                          // la queue, en pointe
  for (let j = 1; j <= 5; j++) { const n = [S[0][0] - j * .2, Math.sin(t * 1.3 + j * .6) * .07 * j, S[0][2] - .08 * j + .02 * j * j]; os2(q, n, .16 - j * .022, peau); q = n; }
  os2(q, pl(q, [-.14, 0, .06]), .09, corne);
  // il sort du cercle, ou s'effondre : tout descend
  const bas = (1 - (f.emerge ?? 1)) * 2.7 + mort * 1.3;
  if (bas) for (const o of B) { o.a = [o.a[0], o.a[1], o.a[2] - bas]; o.b = [o.b[0], o.b[1], o.b[2] - bas]; }
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
