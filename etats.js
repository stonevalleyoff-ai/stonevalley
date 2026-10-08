// Stone Valley — LES ÉTATS D'ÎLE (etats.js)
// Un état est un fléau qui tombe sur une île au hasard de sa graine : un filtre sur tout ce qu'on y
// voit, et ses règles. Le premier est le KORLAZ : un élément inconnu qui ronge la roche et en fait
// monter une spore neurotoxique. Qui reste longtemps dans les spores, ou récolte la roche rongée,
// est infecté — et le reste, d'île en île, tant qu'on ne lui a pas injecté le remède (une recette
// légendaire de la cuisine, à quatre ingrédients). L'infecté voit ce qui n'est pas : une brume
// noire qui monte, de petits êtres décharnés qui le regardent de loin (et s'approchent quand il
// leur tourne le dos), des blessures qui s'ouvrent de nulle part, des silhouettes noires qui
// surgissent et lui fondent dessus, un Rampant qui détale dans son dos, des mains qui sortent de terre et
// l'agrippent, des griffes qui lacèrent l'image, un monde qui se vide de ses couleurs (et dans le gris, ils sont
// là) ; le mycélium gagne les bords de l'image et son corps. Les blessures et les coups sont réels, mais légers. Tout vient
// au hasard, de plus en plus souvent à mesure que l'infection dure. Et il entend faux : la musique
// du jeu devient dissonante tant qu'il est infecté (les humeurs « korlaz » de SON, dans index.html).
// Le jeu (index.html) appelle, s'ils existent :
//   etatsInit()       au démarrage : le remède dans les recettes ;
//   etatsIle()        à chaque île : l'état tiré, la roche rongée peinte, le mycélium posé ;
//   majEtats(dt)      à chaque image : spores, exposition, infection, visions, le filtre ;
//   etatsRecolte(nd)  une récolte (sur la roche rongée, elle infecte) ;
//   etatsSpores(nd)   le coup porté : sur la roche rongée, il rapporte des spores de Korlaz (une matière du sac) ;
//   etatsHud()        l'étiquette du HUD ;
//   guerirKorlaz()    le sérum injecté ;
//   majIllusion, osIllusion : les visions, qui vivent parmi les bêtes (sp.illusion).
// ETATS_SPEC est versé dans SPEC par le jeu.

const ETATS_SPEC = [
  { id: 'decharne', n: 'Décharné', corps: 'decharne', illusion: 1, diet: 'c', sz: .58, spd: 1, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [152, 148, 142], dark: [70, 64, 64], leg: [152, 148, 142], oeil: [8, 6, 6], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: 'il vous regarde', grimpe: 0 },
  { id: 'ombre', n: 'Silhouette', corps: 'ombre', illusion: 1, diet: 'c', sz: 1.3, spd: 1, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [12, 10, 14], dark: [4, 4, 6], leg: [12, 10, 14], oeil: [255, 240, 230], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: 'elle vient', grimpe: 0 },
  { id: 'rampant', n: 'Rampant', corps: 'rampant', illusion: 1, diet: 'c', sz: .8, spd: 1, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [200, 194, 178], dark: [96, 88, 84], leg: [200, 194, 178], oeil: [8, 6, 6], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: 'il rampe vers vous', grimpe: 0 },
  { id: 'mains', n: 'Main', corps: 'mains', illusion: 1, diet: 'c', sz: .75, spd: 1, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [158, 152, 140], dark: [74, 58, 42], leg: [158, 152, 140], oeil: [8, 6, 6], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: 'elle vous cherche', grimpe: 0 },
];
const ETAT = { id: null, cases: null, annonce: false, brume: 0, flash: 0, rouge: 0, visage: 0, inv: 0, yeux: [], sang: [], souffleT: 0, griffes: [], nb: 0, nbT: 0, myc: null, mycCle: 0 };
const KORLAZ_BIO = 21;
const KORLAZ_SEUIL = 30;                                  // secondes de spores (pondérées) avant l'infection
function etatGraine(g, niv) {                             // le Korlaz : une île sur six environ, dès l'exploration 6
  if (!Number.isInteger(g) || niv < 6) return null;       // la brume sanglante (brume.js) : une sur dix, dès l'exploration 8
  let n = (g ^ 0x6b0f1a) >>> 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  const v = ((n ^ (n >>> 16)) >>> 0) % 100;
  return v < 17 ? 'korlaz' : niv >= 8 && v < 27 && typeof brumeIle === 'function' ? 'brume' : null;
}
function etatsInit() {
  if (typeof REMARQUABLES !== 'undefined' && !REMARQUABLES.some(r => r.id === 'serum'))
    REMARQUABLES.push({ id: 'serum', n: 'Sérum de clairvoyance',
      // (la mousse céleste ne pousse plus sur les nuages : la fleur des cimes, l'edelweiss, la remplace)
      indice: 'ce qui pousse sur la roche rongée, la fleur des cimes, le nectar des oglodons, une goutte de sève',
      ok: ids => ids.length === 4 && ['p_mycelium', 'p_edelweiss', 'nectar', 'p_seve'].every(id => ids.includes(id)) });
  if (typeof CONSERVE !== 'undefined') CONSERVE['r:serum'] = [1, 1];          // une dose, qui se garde
}
// ---------- l'île : la roche rongée, par plaques ----------
// Le Korlaz change le sol en place (Bio). Un second chargement de l'île (l'île remise à zéro) partait
// donc d'un sol déjà rongé, et son peuplement ne ressemblait plus à celui d'un joueur qui arrive :
// loadWorld rend le sol d'origine avant de peupler, puis etatsIle le ronge de nouveau.
function etatsSolDOrigine() {
  if (ETAT.bioAvant) for (const [i, b] of ETAT.bioAvant) Bio[i] = b;
  ETAT.bioAvant = null;
}
function etatsIle() {
  etatsSolDOrigine();
  ETAT.id = etatGraine(SEED, profondeur()); ETAT.cases = null; ETAT.annonce = false;
  if (ETAT.id === 'brume') { brumeIle(); return; }        // la brume sanglante (brume.js)
  if (ETAT.id !== 'korlaz') return;
  let s = (SEED ^ 0x9e3779b9) >>> 0 || 1; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const C = ETAT.cases = new Uint8Array(WS * WS), roc = [], avant = ETAT.bioAvant = new Map();
  for (let i = 0; i < WS * WS; i++) if (Bio[i] === 5 || Bio[i] === 6) roc.push(i);
  if (!roc.length) { ETAT.id = null; return; }
  const n = 6 + (r() * 6 | 0);
  for (let k = 0; k < n; k++) {
    const c = roc[r() * roc.length | 0], cx = c % WS, cy = (c / WS) | 0, R = 4 + r() * 6;
    for (let dy = -R | 0; dy <= R; dy++) for (let dx = -R | 0; dx <= R; dx++) {
      const x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x >= WS - 1 || y >= WS - 1) continue;
      const i = y * WS + x, d = Math.hypot(dx, dy) / R;
      if ((Bio[i] === 5 || Bio[i] === 6) && d < .7 + r() * .45) { C[i] = 1; avant.set(i, Bio[i]); Bio[i] = KORLAZ_BIO; }
    }
  }
  const m = ESP.findIndex(e => e.id === 'mycelium'), x = ESP.findIndex(e => e.id === 'excroissance');   // le mycélium pâle, rare ; les excroissances, partout
  for (let i = 0; i < WS * WS; i++) if (C[i] && !Flo[i] && !PlT[i]) { const q = r(); if (m >= 0 && q < .02) Flo[i] = m + 1; else if (x >= 0 && q < .11) Flo[i] = x + 1; }
}
const roche = (x, y) => { x |= 0; y |= 0; return !!ETAT.cases && x >= 0 && y >= 0 && x < WS && y < WS && ETAT.cases[y * WS + x] === 1; };
// ---------- l'infection ----------
function infecter(pourquoi) {
  if (P.korlaz) return;
  P.korlaz = { duree: 0, prochain: t + 12 + Math.random() * 10 }; P.korlazExpo = 0;
  say('Vous êtes infecté par le Korlaz · ' + pourquoi + ' · seul un sérum vous en délivrera', 5);
  SON.jouer('stridence'); ETAT.flash = 1;
}
// Ce qui pousse sur la roche rongée, ou contre elle, est infecté.
const piedInfecte = nd => { if (ETAT.id !== 'korlaz' || !nd) return false; const x = nd.i % WS, y = (nd.i / WS) | 0;
  return roche(x, y) || roche(x + 1, y) || roche(x - 1, y) || roche(x, y + 1) || roche(x, y - 1); };
// Récolter un pied infecté rapporte des spores de Korlaz, à chaque coup : une, ou deux sur ce que le
// Korlaz fait pousser lui-même (excroissance, mycélium pâle). Infecté ou non — mais sain, chaque coup expose.
function etatsSpores(nd) {
  if (!piedInfecte(nd)) return 0;
  const n = nd.sp && (nd.sp.id === 'excroissance' || nd.sp.id === 'mycelium') ? 2 : 1;
  P.sac.spore = (P.sac.spore || 0) + n;
  return n;
}
function etatsRecolte(nd) {
  if (ETAT.id !== 'korlaz' || !nd || P.korlaz) return;
  const x = nd.i % WS, y = (nd.i / WS) | 0;
  if (piedInfecte(nd)) {
    P.korlazExpo = (P.korlazExpo || 0) + 9;                // gratter la roche rongée : un nuage en plein visage
    burst(x + .5, y + .5, sol(x + .5, y + .5) + .6, 12, '#2a2e22');
    if (Math.random() < .25 || P.korlazExpo > KORLAZ_SEUIL) infecter('la roche rongée vous a craché ses spores');
    else say('des spores noires · ' + Math.round(Math.min(1, P.korlazExpo / KORLAZ_SEUIL) * 100) + ' %', 1.4);
  }
}
function guerirKorlaz() {
  if (!P.korlaz) { say('vous n\'êtes pas infecté · le sérum vous éclaircit la vue', 2); return; }
  P.korlaz = null; P.korlazExpo = 0; ETAT.brume = 0;
  for (const b of beasts) if (b.sp.illusion) dissiper(b);
  say('Le sérum brûle dans vos veines… et la brume se lève · guéri du Korlaz', 4); SON.jouer('ramasse');
}
function etatsHud() {
  if (P.korlaz) return '<span class="etiq korlaz">infecté · Korlaz</span>';
  if ((P.korlazExpo || 0) > .5) return '<span class="etiq korlaz">spores ' + Math.round(Math.min(1, P.korlazExpo / KORLAZ_SEUIL) * 100) + ' %</span>';
  return '';
}
// ---------- les visions ----------
function poserVision(id, angle, dist, ec = 1) {
  const sp = specById[id]; if (!sp) return null;
  for (let k = 0; k < 14; k++) {
    const a = angle + (Math.random() - .5) * .8 * ec, d = dist + (Math.random() - .5) * 2 * ec, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 2 || y < 2 || x > WS - 3 || y > WS - 3 || hAt(x | 0, y | 0) <= SEA || Math.abs(sol(x, y) - P.z) > 3) continue;
    const b = naitre(sp, x, y); b.age = 1e6; b.ech = .25; b.pv = 1; b.t = 0; b.z = sol(x, y); b.vie = 10; b.jx = b.jy = 0;
    b.dir = b.dirT = Math.atan2(P.y - y, P.x - x); beasts.push(b); return b;
  }
  return null;
}
function dissiper(b, chuchote) {
  if (b.dead) return;
  b.dead = 1;
  for (let k = 0; k < 22; k++) parts.push({ x: b.x, y: b.y, z: b.z + Math.random() * 1.8 * b.sp.sz, vx: (Math.random() - .5) * 1.4, vy: (Math.random() - .5) * 1.4, vz: .3 + Math.random() * 1.2,
    g: -.7, life: 1 + Math.random() * .8, age: 0, col: Math.random() < .75 ? '#070609' : '#2a2630', tl: .16 });
  if (chuchote) SON.jouer('murmure', {}, b.x, b.y, b.z + 1);
}
// Les visions, tirées au hasard selon leur poids ; plus fortes quand l'infection dure. `force` en impose une (essais).
function vision(I, force) {
  const f = P.faceS ?? P.face ?? 0, regards = beasts.filter(b => b.sp.illusion && !b.dead).length;
  const T = [['brume', .15], ['regards', regards < 6 ? .15 : 0], ['griffes', .13], ['visage', .08], ['silhouette', .13],
    ['rampant', regards < 7 ? .12 : 0], ['mains', regards < 6 ? .1 : 0], ['nb', ETAT.nb > 0 ? 0 : .08 + I * .06]];
  let k = force;
  if (!k) { let r = T.reduce((a, q) => a + q[1], 0) * Math.random(); k = T[T.length - 1][0]; for (const [n, w] of T) if ((r -= w) < 0) { k = n; break; } }
  if (k === 'brume') { ETAT.brume = Math.max(ETAT.brume, 7 + Math.random() * 7 * (1 + I)); SON.jouer('murmure'); for (let j = 0; j < 3 + I * 5; j++) oeil(); }
  else if (k === 'regards') {                              // ils vous regardent, de loin
    const n = 1 + (Math.random() * (1 + I * 3) | 0);
    for (let j = 0; j < n; j++) { const b = poserVision('decharne', f + (Math.random() - .5) * 1.7, 9 + Math.random() * 7); if (b) { b.vie = 10 + Math.random() * 9; b.etat = 'regarder'; } }
    SON.jouer('respiration');
  } else if (k === 'griffes') {                            // des griffes de nulle part lacèrent l'image
    porterCoup({ x: P.x + Math.cos(f) * .2, y: P.y + Math.sin(f) * .2, sp: {} }, P, .025 + I * .02);
    burst(P.x, P.y, P.z + .9, 12, '#a01818'); griffer();
    for (let j = 0; j < 2 + (Math.random() * 3 | 0); j++) ETAT.sang.push({ x: Math.random(), y: 0, l: .05 + Math.random() * .25, v: .08 + Math.random() * .1, a: 1 });
    say(['quelque chose vous lacère', 'des griffes, de nulle part', 'du sang… mais rien autour'][Math.random() * 3 | 0], 1.8);
  } else if (k === 'visage') { ETAT.visage = 1; SON.jouer('bourdon'); }   // un visage dans la brume
  else if (k === 'silhouette') {                           // une silhouette surgit, et fond sur vous
    const n = 1 + (I > .4 && Math.random() < .5 ? 1 : 0);
    for (let j = 0; j < n; j++) { const b = poserVision('ombre', f + Math.PI + (Math.random() - .5) * 2.4, 6.5 + Math.random() * 3); if (b) { b.vie = 8; b.etat = 'surgir'; } }
    SON.jouer('stridence'); SON.jouer('bourdon');
  } else if (k === 'rampant') {                            // quelque chose rampe, dans votre dos
    const b = poserVision('rampant', f + Math.PI + (Math.random() - .5) * 1.6, 9 + Math.random() * 4);
    if (b) { b.vie = 14; b.etat = 'ramper'; } SON.jouer('grattement'); say(['ça gratte, derrière vous', 'quelque chose rampe', 'des ongles sur la pierre'][Math.random() * 3 | 0], 1.8);
  } else if (k === 'mains') mainsDeTerre(I);
  else if (k === 'nb') noirEtBlanc(I);
  return k;
}
// Des griffes lacèrent l'image : trois ou quatre entailles parallèles, en biais, qui s'ouvrent en un éclair, puis saignent.
function griffer() {
  const W = Math.max(1, innerWidth / 2 | 0), H = Math.max(1, innerHeight / 2 | 0), R = Math.hypot(W, H) / 2;
  const n = Math.random() < .6 ? 3 : 4, a = (Math.random() < .5 ? .75 : 2.39) + (Math.random() - .5) * .5;
  const c = { t0: t, fin: t + 2.8 + Math.random() * 1.2, x: .3 + Math.random() * .4, y: .3 + Math.random() * .36, a, n, l: .6 + Math.random() * .3, e: .065 + Math.random() * .02, w: .016 + Math.random() * .008, cb: (Math.random() - .5) * .18, gt: [] };
  for (let k = 0; k < 26; k++) c.gt.push([(Math.random() - .5) * .5, (Math.random() - .5) * .5, .5 + Math.random() * 1.8]);   // des éclaboussures
  ETAT.griffes.push(c); if (ETAT.griffes.length > 4) ETAT.griffes.shift();
  for (let j = 0; j < n; j++) {                            // chaque entaille saigne un peu, de son milieu
    const o = (j - (n - 1) / 2) * c.e * R, x = c.x * W - Math.sin(a) * o, y = c.y * H + Math.cos(a) * o;
    ETAT.sang.push({ x: x / W, y0: y / H, y: 0, l: .02 + Math.random() * .06, v: .025 + Math.random() * .04, a: 1.8 });
  }
  ETAT.rouge = Math.max(ETAT.rouge, .6); P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .35); SON.jouer('lacere');
}
// Le monde se vide de ses couleurs (le sang, lui, reste rouge)… et dans le gris, ils sont là, qui vous regardent.
// Quand la couleur revient, il n'y a plus personne.
function noirEtBlanc(I) {
  ETAT.nbT = ETAT.nb = 9 + Math.random() * 5 + I * 5;
  SON.jouer('bourdon'); say(['les couleurs s\'en vont', 'tout devient gris', 'le monde se vide'][Math.random() * 3 | 0], 2);
  const f = P.faceS ?? P.face ?? 0;
  for (let j = 0; j < 2 + (I * 3 | 0); j++) { const b = poserVision('decharne', f + (Math.random() - .5) * 2.8, 7 + Math.random() * 9); if (b) { b.vie = ETAT.nb; b.etat = 'regarder'; b.nb = true; } }
}
// Des mains sortent de terre tout autour de vous, griffent l'air, vous cherchent ; trop près, l'une vous agrippe.
function mainsDeTerre(I) {
  const n = 3 + (Math.random() * (2 + I * 3) | 0), a0 = Math.random() * 6.2832;
  for (let j = 0; j < n; j++) {
    const b = poserVision('mains', a0 + j / n * 6.2832, 1.4 + Math.random() * 1.2, .25);
    if (b) { b.vie = 4.2 + Math.random() * 1.5; b.t = -j * .18; b.etat = 'sortir'; b.ech = 1; b.sortie = 0; b.ph0 = Math.random() * 6; }
  }
  SON.jouer('terre'); say(['quelque chose remue sous vos pieds', 'la terre s\'ouvre', 'des mains…'][Math.random() * 3 | 0], 2);
}
function oeil() { ETAT.yeux.push({ x: Math.random() < .5 ? .02 + Math.random() * .22 : .76 + Math.random() * .22, y: .1 + Math.random() * .8, fin: t + 1.4 + Math.random() * 2.2, cl: t + .4 + Math.random() * 1.6, e: .006 + Math.random() * .006 }); }
function majIllusion(b, dt) {
  b.t += dt; b.ech = Math.min(1, (b.ech ?? .25) + dt * 1.1);
  if (!P.korlaz || b.hit > 0) return dissiper(b, b.hit > 0);
  b.vie -= dt; const dx = P.x - b.x, dy = P.y - b.y, dJ = Math.hypot(dx, dy) || 1;
  b.dir = b.dirT = Math.atan2(dy, dx);
  if (b.nb && !(ETAT.nb > .3)) return dissiper(b);                    // la couleur revient : ils n'y sont plus
  if (b.sp.corps === 'rampant') {                                     // le Rampant ne bouge que si vous ne le regardez pas
    const vu = Math.cos((P.faceS ?? 0) - Math.atan2(b.y - P.y, b.x - P.x)) > .4;
    if (b.vie <= 0) return dissiper(b, true);
    if (vu && dJ > 1.6) {                                             // regardé : il se fige… et sa bouche s'ouvre
      b.vit = 0; b.etat = 'figé'; b.regardT = (b.regardT || 0) + dt; b.bouche = b.regardT > .6 ? 1 : 0;
      if (Math.random() < dt * 1.2) { b.ticT = t; b.tic = (Math.random() - .5) * 2.2; }
      if (b.regardT > 4) return dissiper(b, true);
    } else {                                                          // dos tourné : il détale
      const v = dJ > 2.5 ? 4.6 : 3; b.x += dx / dJ * v * dt; b.y += dy / dJ * v * dt; b.vit = v; b.etat = 'ramper'; b.bouche = 0;
      if (Math.random() < dt * 2.5) SON.jouer('grattement', {}, b.x, b.y, b.z + .3);
      if (dJ < 1.05) { porterCoup({ x: b.x, y: b.y, sp: {} }, P, .04 + Math.min(1, P.korlaz.duree / 900) * .03); griffer(); ETAT.flash = .2; return dissiper(b, true); }
    }
  } else if (b.sp.corps === 'mains') {                                // une main sortie de terre : elle griffe l'air, vous cherche
    b.vit = 0;
    const T = b.t; b.sortie = T < 0 ? 0 : T < .7 ? T / .7 : b.vie < .6 ? Math.max(0, b.vie / .6) : 1;
    b.etat = T < .7 ? 'sortir' : b.vie < .6 ? 'rentrer' : 'agripper';
    if (T > 0 && T < .8 && Math.random() < dt * 10) parts.push({ x: b.x + (Math.random() - .5) * .3, y: b.y + (Math.random() - .5) * .3, z: b.z + .05, vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2, vz: 1 + Math.random() * 1.5, g: 5, life: .45, age: 0, col: Math.random() < .5 ? '#4a3a28' : '#6b5440' });
    if (b.sortie > .8 && dJ < .95 && !b.prise) {                      // trop près : elle vous agrippe
      b.prise = true; P.englue = Math.max(P.englue || 0, t + 1.4); P.agrippe = t + 1.4; P.vx = P.vy = 0;
      porterCoup({ x: b.x, y: b.y, sp: {} }, P, .03 + Math.min(1, P.korlaz.duree / 900) * .02); griffer(); say('une main vous agrippe la cheville', 1.6);
    }
    if (b.vie <= 0) { b.dead = 1; return; }                          // rentrée sous terre
  } else if (b.sp.corps === 'decharne') {
    const vu = Math.cos((P.faceS ?? 0) - Math.atan2(b.y - P.y, b.x - P.x)) > .35;   // vous le regardez ?
    if (dJ < 3.6 || b.vie <= 0) return dissiper(b, true);
    if (!vu && dJ > 4.2) {                                // dos tourné : il avance — par à-coups, jamais sous vos yeux
      b.pas = (b.pas || 0) + dt;
      if (b.pas > .45) { b.pas = 0; const l = .5 + Math.random() * .4; b.x += dx / dJ * l; b.y += dy / dJ * l; b.ticT = t; b.tic = (Math.random() - .5) * 1.2; }
      b.etat = 'approcher';
    } else b.etat = 'regarder';
    if (Math.random() < dt * .25) { b.ticT = t; b.tic = (Math.random() - .5) * 1.6; }
    if (dJ < 7 && Math.random() < dt * .2) SON.jouer('respiration', {}, b.x, b.y, b.z + .8);
    b.bouche = b.boucheT > t ? 1 : 0; if (Math.random() < dt * .08) b.boucheT = t + .5 + Math.random();
  } else {
    if (b.etat === 'surgir') {                            // elle est là, tordue, et tremble
      b.jx = (Math.random() - .5) * .08; b.jy = (Math.random() - .5) * .08;
      if (Math.random() < dt * 24) parts.push({ x: b.x, y: b.y, z: b.z + Math.random() * .8, vx: (Math.random() - .5), vy: (Math.random() - .5), vz: .6, g: -.3, life: .7, age: 0, col: '#070609', tl: .14 });
      if (b.t > 1.1) { b.etat = 'ruer'; b.jx = b.jy = 0; }
    } else {
      b.x += dx / dJ * 7 * dt; b.y += dy / dJ * 7 * dt; b.vit = 7; b.etat = 'ruer';
      for (let j = 0; j < 2; j++) if (Math.random() < dt * 40) parts.push({ x: b.x, y: b.y, z: b.z + Math.random() * 2.4, vx: -dx / dJ * 1.5, vy: -dy / dJ * 1.5, vz: .2, g: 0, life: .5, age: 0, col: '#070609', tl: .16 });
      if (dJ < 1.1) {
        porterCoup({ x: b.x, y: b.y, sp: {} }, P, .05 + Math.min(1, P.korlaz.duree / 900) * .03); P.vx += dx / dJ * 4; P.vy += dy / dJ * 4;
        ETAT.rouge = .9; ETAT.inv = .09; ETAT.flash = .4; griffer();
        return dissiper(b, true);
      }
    }
    if (b.vie <= 0) return dissiper(b);
  }
  b.gph = (b.gph || 0) + dt * (b.vit || 0) * .9; b.z = sol(b.x, b.y); b.vx = b.vy = 0;
}
// ---------- les visions, en volumes ----------
// Revues (§92) : l'ancien Décharné avait une tête en cube et un corps de bâtons, la Silhouette des
// bras en tiges. Les deux sont maintenant taillés en tranches, comme une sculpture : chaque volume
// est posé dans le repère de la bête (ou de sa tête), si bien qu'ils gardent leur forme sous tous
// les angles.
// Le DÉCHARNÉ : un enfant famélique, voûté, trop grand de tête. Un crâne en œuf (la voûte, le dôme,
// l'occiput, les tempes creuses, l'arcade qui avance), un visage étroit qui finit en menton pointu,
// des pommettes saillantes sur des joues creuses ; deux orbites profondes au fond desquelles luit
// une pupille minuscule ; deux fentes pour le nez ; une bouche fine qui s'ouvre sans un son sur de
// petites dents. Un cou maigre aux tendons tirés, des clavicules, des omoplates, la colonne qui
// saille dans le dos, des côtes qu'on compte et qui respirent, le ventre rentré, le bassin et ses
// crêtes. Des bras jusqu'aux genoux, coudes et poignets noueux, des doigts trop longs à deux
// phalanges qui se recourbent ; des jambes en X, de gros genoux, de longs pieds ; des veines sombres.
// Il vous regarde par en dessous, la tête qui penche lentement — puis d'un coup.
// LA SILHOUETTE : noire, près de trois mètres, trop mince : une taille de guêpe sous une poitrine
// étroite, des épaules hautes et pointues, voûtée ; un long cou, une tête petite et étirée en
// hauteur, sans rien d'autre que deux points blancs. Des bras qui descendent sous les genoux, à
// trois articulations, des mains aux cinq doigts trop longs qui remuent ; des jambes qui se défont
// en fumée. Surgie, elle tremble sur place, la tête couchée sur l'épaule ; ruée, elle se couche
// presque à l'horizontale, les mains ouvertes en avant, les jambes traînant derrière en fumée.
function osIllusion(f) {
  // Les positions sont mises à l'échelle de la bête au rendu (posBete), pas les épaisseurs : on les y met ici.
  // (Faute de quoi le Décharné, petit, avait des volumes 1,7 fois trop épais — d'où sa tête en cube —, et la
  // Silhouette, grande, des membres 1,3 fois trop minces : des bâtons.)
  const K = (f.sp.sz || 1) * (f.ech || 1), B = [], add = (a, b, w, h, c, luit, ref) => B.push({ a, b, w: w * K, h: h * K, c, luit, ref });
  const ph = (f.gph || 0) * 6.2832, v = Math.min(1, (f.vit || 0) / 3);
  const tic = f.ticT != null && t - f.ticT < .3 ? f.tic * (1 - (t - f.ticT) / .3) : 0;
  // un repère : origine O, l'avant F, le côté S, le haut U ; pt(a, b, c) = O + a·F + b·S + c·U
  const rep = (O, F, S, U) => (a, b, c) => [O[0] + F[0] * a + S[0] * b + U[0] * c, O[1] + F[1] * a + S[1] * b + U[1] * c, O[2] + F[2] * a + S[2] * b + U[2] * c];
  // une tête inclinée vers le bas (p) et penchée sur le côté (r)
  const tete = (O, p, r) => {
    const F = [Math.cos(p), 0, Math.sin(p)], S0 = [0, 1, 0], U0 = [-Math.sin(p), 0, Math.cos(p)], cr = Math.cos(r), sr = Math.sin(r);
    const U = [U0[0] * cr - S0[0] * sr, U0[1] * cr - S0[1] * sr, U0[2] * cr - S0[2] * sr], M = rep(O, F, [S0[0] * cr + U0[0] * sr, S0[1] * cr + U0[1] * sr, S0[2] * cr + U0[2] * sr], U);
    M.U = U; return M;                                     // M.U : le haut de la tête, pour que ses volumes penchent avec elle
  };
  // un volume dans un repère : de l'arrière a0 à l'avant a1, centré en (b, c), large w, haut h
  const bloc = (M, a0, a1, b, c, w, h, col, luit) => add(M(a0, b, c), M(a1, b, c), w, h, col, luit, M.U);
  const os2 = (A, Bv, w, col) => add(A, Bv, w, w, col);
  const mi = (A, Bv, k) => [A[0] + (Bv[0] - A[0]) * k, A[1] + (Bv[1] - A[1]) * k, A[2] + (Bv[2] - A[2]) * k];
  // une colonne : de P0, des segments de longueur L, chacun penché vers l'avant de son angle ; et le repère penché d'un angle
  const chaine = (P0, angs, L) => { const S = [P0]; for (const a of angs) { const q = S[S.length - 1]; S.push([q[0] + Math.sin(a) * L, q[1], q[2] + Math.cos(a) * L]); } return S; };
  const cadre = (O, a) => { const M = rep(O, [Math.cos(a), 0, -Math.sin(a)], [0, 1, 0], [Math.sin(a), 0, Math.cos(a)]); M.U = [Math.sin(a), 0, Math.cos(a)]; return M; };
  // le crâne du Décharné (et du Rampant) dans le repère M de la tête : un œuf sur un visage étroit, deux orbites profondes
  const crane = (M, bouche, { peau, ombre, creux, os, noir, veine, dent }) => {
      bloc(M, -.16, .1, 0, .17, .3, .26, peau);                                                          // la voûte
      bloc(M, -.12, .06, 0, .32, .24, .06, peau);                                                        // le dôme
      bloc(M, -.2, -.1, 0, .16, .24, .2, peau);                                                          // l'occiput
      bloc(M, .08, .135, 0, .175, .28, .04, peau);                                                       // l'arcade, qui avance
      bloc(M, -.02, .12, 0, -.01, .2, .14, peau);                                                        // le bas du visage
      bloc(M, 0, .1, 0, -.11 - bouche * .06, .12, .06, peau);                                            // le menton, pointu
      if (bouche) bloc(M, 0, .115, 0, -.07 - bouche * .03, .11, .02 + bouche * .07, noir);               // la bouche ouverte, un trou
      bloc(M, .1, .128, 0, .1, .04, .1, peau);                                                           // l'arête du nez
      for (const s of [-1, 1]) {
        bloc(M, -.02, .04, s * .088, -.05 - bouche * .03, .03, .1, ombre);                              // la mâchoire, de côté
        bloc(M, -.03, .07, s * .151, .16, .012, .1, creux);                                              // la tempe creuse
        bloc(M, -.13, -.02, s * .151, .23, .008, .012, veine);                                           // une veine sur le crâne
        bloc(M, -.07, -.02, s * .155, .08, .02, .06, creux);                                             // l'oreille, collée
        bloc(M, .07, .125, s * .102, .04, .05, .035, os);                                                // la pommette
        bloc(M, .02, .1, s * .1, -.03, .02, .07, creux);                                                 // la joue creuse
        bloc(M, .1, .125, s * .128, .1, .025, .1, peau);                                                 // le bord de l'orbite
        bloc(M, .1, .118, s * .068, .1, .095, .1, noir);                                                 // l'orbite, profonde
        bloc(M, .117, .121, s * .066, .095, .016, .016, [250, 248, 236], true);                          // la pupille, minuscule, qui luit au fond
        bloc(M, .12, .124, s * .012, .02, .016, .028, noir);                                             // les fentes du nez
      }
      bloc(M, .12, .124, 0, -.045 - bouche * .02, .14, .012 + bouche * .03, bouche ? noir : creux);     // la bouche : une fente
      if (bouche) for (let k = -2; k <= 2; k++) { bloc(M, .116, .126, k * .022, -.04, .012, .018, dent); bloc(M, .09, .108, k * .022, -.085 - bouche * .06, .012, .016, dent); }
  };
  if (f.sp.corps === 'decharne') {
    const peau = [204, 198, 182], ombre = [152, 144, 132], creux = [100, 92, 88], os = [228, 224, 210], noir = [3, 2, 3], veine = [96, 76, 106], dent = [230, 226, 210], ongle = [80, 72, 64];
    const souffle = .5 + .5 * Math.sin(f.t * 2.4), tilt = Math.sin(f.t * .6) * .3 + tic, bouche = f.bouche ? .6 + Math.sin(t * 12) * .15 : 0, hz = .9;
    // la colonne : droite au bassin, voûtée en haut ; les vertèbres saillent dans le dos
    const AN = [.04, .1, .22, .38, .55], S = chaine([-.03, 0, hz], AN, .11), Q = k => cadre(S[k], AN[Math.min(k, 4)]);
    for (let k = 1; k < 6; k++) add(Q(k)(-.075, 0, -.03), Q(k)(-.098, 0, -.01), .03, .03, os);
    // le bassin et ses crêtes, le ventre rentré
    bloc(Q(0), -.06, .05, 0, 0, .2, .1, ombre);
    for (const s of [-1, 1]) bloc(Q(0), 0, .06, s * .095, .05, .03, .03, os);
    bloc(Q(1), -.065, .02, 0, 0, .14, .13, ombre);
    // la cage : un fond sombre, et des côtes qu'on compte, du sternum vers les flancs ; elles respirent
    bloc(Q(2), -.07, .06, 0, 0, .19, .12, creux); bloc(Q(3), -.075, .07, 0, 0, .22, .12, creux); bloc(Q(4), -.075, .065, 0, 0, .23, .12, ombre);
    for (const k of [2, 3, 4]) for (const c of [-.03, .03]) for (const s of [-1, 1]) {
      const R = Q(k), w = (k === 2 ? .19 : k === 3 ? .22 : .23) / 2 + .008 + souffle * .006, d = (k === 2 ? .06 : .07) + .006;
      add(R(d, s * .02, c), R(d * .55, s * w * .8, c - .025), .022, .02, peau); add(R(d * .55, s * w * .8, c - .025), R(-.02, s * w, c - .04), .02, .02, peau);
    }
    add(Q(2)(.07, 0, -.02), Q(4)(.068, 0, .05), .03, .03, os);                                          // le sternum
    // le haut de la poitrine, étroit ; les clavicules, les épaules en boule, les omoplates
    const R5 = Q(5), N0 = R5(.02, 0, .02);
    bloc(R5, -.06, .05, 0, -.01, .2, .06, ombre);
    for (const s of [-1, 1]) {
      const Sh = R5(.03, s * .13, -.03);
      add(R5(.06, s * .015, 0), Sh, .024, .024, os); os2([Sh[0], Sh[1], Sh[2] + .02], [Sh[0], Sh[1], Sh[2] - .02], .065, peau);
      bloc(Q(4), -.095, -.06, s * .07, .02, .08, .1, ombre);
    }
    // le cou maigre qui s'avance, ses tendons tirés
    const st = Math.sin(tilt), na = .95, N = [N0[0] + Math.sin(na) * .17, st * .03, N0[2] + Math.cos(na) * .17];
    os2(N0, N, .05, ombre);
    for (const s of [-1, 1]) add([N0[0] + .03, s * .022, N0[2] - .01], [N[0] + .02, N[1] + s * .018, N[2] - .02], .014, .014, os);
    // la tête : un crâne en œuf sur un visage étroit, qui vous regarde par en dessous et penche
    const M = tete([N[0] + .06, N[1], N[2] + .02], .06, tilt);
    os2(N, M(-.06, 0, .02), .05, ombre);
    crane(M, bouche, { peau, ombre, creux, os, noir, veine, dent });
    // les bras jusqu'aux genoux ; coudes et poignets noueux ; les doigts trop longs, recourbés
    for (const s of [-1, 1]) {
      const bal = Math.sin(ph + s) * .08 * v, Sh = R5(.03, s * .13, -.03), El = [Sh[0] + .07 + bal, s * .17, Sh[2] - .36], Wr = [El[0] + .09 + bal, s * .18, El[2] - .33];
      os2(Sh, El, .046, peau); os2(El, Wr, .038, peau);
      os2([El[0], El[1], El[2] + .02], [El[0] - .01, El[1], El[2] - .02], .062, os);                  // le coude
      os2([Wr[0], Wr[1], Wr[2] + .015], [Wr[0], Wr[1], Wr[2] - .015], .048, ombre);                   // le poignet
      add(mi(Sh, El, .2), mi(Sh, El, .85), .01, .01, veine); add(mi(El, Wr, .1), mi(El, Wr, .9), .01, .01, veine);
      const Pm = [Wr[0] + .025, s * .18, Wr[2] - .08]; os2(Wr, Pm, .045, peau);                      // la paume
      for (let k = 0; k < 4; k++) {
        const o = (k - 1.5) * .017, crisp = .035 + Math.sin(f.t * 3 + k + s) * .008;
        const B0 = [Pm[0] + o, s * .18, Pm[2] - .01], B1 = [B0[0] + .02, s * .185, B0[2] - .12], B2 = [B1[0] + crisp, s * .172, B1[2] - .075];
        os2(B0, B1, .013, peau); os2(B1, B2, .011, ombre); os2(B2, [B2[0] + .008, B2[1], B2[2] - .012], .01, ongle);
      }
      os2([Pm[0] + .025, s * .17, Pm[2]], [Pm[0] + .05, s * .155, Pm[2] - .08], .012, peau);         // le pouce
    }
    // les jambes en X, un peu fléchies : gros genoux, longs pieds
    for (const s of [-1, 1]) {
      const p = ph + (s > 0 ? 0 : Math.PI), hip = [-.03, s * .08, hz], A = [.02 + Math.sin(p) * .2 * v, s * .095, .07 + Math.max(0, Math.cos(p)) * .1 * v], K = [(hip[0] + A[0]) / 2 + .08, s * .055, .47];
      os2(hip, K, .055, peau); os2(K, A, .045, peau);
      os2([K[0] + .005, K[1], K[2] + .025], [K[0] + .015, K[1], K[2] - .02], .085, os);               // le genou, noueux
      os2([A[0], A[1], A[2] + .02], [A[0], A[1], A[2] - .02], .05, ombre);                            // la cheville
      add(mi(K, A, .15), mi(K, A, .8), .01, .01, veine);
      bloc(rep(A, [1, 0, 0], [0, 1, 0], [0, 0, 1]), -.04, .2, 0, -.045, .065, .035, peau);            // le pied, long
      for (let k = -1; k <= 2; k++) add([A[0] + .2, A[1] + k * .015 - s * .005, A[2] - .05], [A[0] + .25, A[1] + k * .016 - s * .005, A[2] - .055], .012, .012, ombre);
    }
  } else if (f.sp.corps === 'rampant') {
    // LE RAMPANT : un Décharné à quatre pattes, comme une araignée — le dos arqué, coudes et genoux plus hauts que
    // l'échine, les mains à plat loin devant, la tête retournée, le menton en l'air. Regardé, il se fige, et sa bouche
    // s'ouvre ; dos tourné, il détale.
    const C = { peau: [200, 194, 178], ombre: [146, 138, 126], creux: [96, 88, 84], os: [226, 222, 208], noir: [3, 2, 3], veine: [96, 76, 106], dent: [230, 226, 210] };
    const { peau, ombre, creux, os, veine } = C, ongle = [70, 62, 56], bouche = f.bouche ? .7 + Math.sin(t * 14) * .2 : 0, souffle = .5 + .5 * Math.sin(f.t * 3.1);
    const AN = [1.25, 1.42, 1.58, 1.72, 1.85], S = chaine([-.32, 0, .5], AN, .12), Q = k => cadre(S[k], AN[Math.min(k, 4)]);
    for (let k = 1; k < 6; k++) add(Q(k)(-.075, 0, -.03), Q(k)(-.1, 0, -.01), .032, .03, os);           // l'échine, qui saille
    bloc(Q(0), -.06, .05, 0, 0, .2, .12, ombre); bloc(Q(1), -.06, .02, 0, 0, .15, .13, ombre);
    bloc(Q(2), -.07, .06, 0, 0, .2, .13, creux); bloc(Q(3), -.075, .07, 0, 0, .23, .13, creux); bloc(Q(4), -.075, .065, 0, 0, .24, .13, ombre);
    for (const k of [2, 3, 4]) for (const c of [-.03, .03]) for (const s of [-1, 1]) {
      const R = Q(k), w = (k === 2 ? .2 : k === 3 ? .23 : .24) / 2 + .008 + souffle * .006, d = (k === 2 ? .06 : .07) + .006;
      add(R(d, s * .02, c), R(d * .55, s * w * .8, c - .025), .022, .02, peau); add(R(d * .55, s * w * .8, c - .025), R(-.02, s * w, c - .04), .02, .02, peau);
    }
    for (const s of [-1, 1]) bloc(Q(4), -.1, -.065, s * .075, .02, .085, .1, ombre);                 // les omoplates, en l'air
    // le cou qui plonge, la tête retournée, le menton en l'air
    const N0 = Q(5)(.01, 0, .03), N = [N0[0] + .12, 0, N0[2] - .05];
    os2(N0, N, .05, ombre);
    const M = tete([N[0] + .07, 0, N[2] - .03], .25, Math.PI + tic * .5);
    os2(N, M(-.06, 0, .02), .05, ombre);
    crane(M, bouche, C);
    // les bras : le coude au-dessus du dos, la main à plat loin devant ; les jambes : le genou en l'air, le pied en arrière
    for (const s of [-1, 1]) {
      const pa = ph + (s > 0 ? 0 : Math.PI), la = Math.max(0, Math.sin(pa)) * .09 * v, sa = Math.cos(pa) * .14 * v;
      const Sh = Q(5)(0, s * .13, -.02), El = [Sh[0] + .03, s * .3, Sh[2] + .27], Wr = [Sh[0] + .33 + sa, s * .34, .06 + la];
      os2(Sh, El, .046, peau); os2(El, Wr, .04, peau);
      os2([El[0], El[1], El[2] + .02], [El[0], El[1], El[2] - .02], .064, os);                         // le coude, pointu
      add(mi(El, Wr, .15), mi(El, Wr, .85), .01, .01, veine);
      const Pm = [Wr[0] + .07, s * .35, .03 + la]; os2(Wr, Pm, .045, peau);
      for (let k = 0; k < 4; k++) {                                                                    // les doigts, écartés, posés comme des pattes
        const o = (k - 1.5) * .032, B0 = [Pm[0], Pm[1] + o, Pm[2]], B1 = [B0[0] + .11, B0[1] + o * 1.3, B0[2] + .03], B2 = [B1[0] + .07, B1[1] + o * .5, Math.max(.008, B1[2] - .05)];
        os2(B0, B1, .013, peau); os2(B1, B2, .011, ombre); os2(B2, [B2[0] + .012, B2[1], B2[2] - .006], .01, ongle);
      }
      const pj = pa + Math.PI, lj = Math.max(0, Math.sin(pj)) * .08 * v, sj = Math.cos(pj) * .12 * v;
      const hip = Q(0)(0, s * .09, 0), K = [hip[0] + .05, s * .33, hip[2] + .2], A = [hip[0] - .24 + sj, s * .37, .06 + lj];
      os2(hip, K, .055, peau); os2(K, A, .045, peau);
      os2([K[0], K[1], K[2] + .025], [K[0], K[1], K[2] - .02], .08, os);                              // le genou, en l'air
      add(mi(K, A, .15), mi(K, A, .8), .01, .01, veine);
      os2(A, [A[0] - .17, A[1] + s * .03, .025 + lj * .5], .05, peau);                                 // le pied, à plat en arrière
    }
  } else if (f.sp.corps === 'mains') {
    // LES MAINS : un avant-bras gris sort de terre, la terre se fend autour ; la main, tournée vers vous, griffe l'air,
    // les doigts trop longs à trois phalanges ; quand elle tient, elle se referme.
    const peau = [158, 152, 140], ombre = [112, 106, 98], terre = [74, 58, 42], terre2 = [98, 80, 58], ongle = [52, 44, 38], veine = [70, 60, 84];
    const e = Math.max(0, Math.min(1, f.sortie ?? 1)), prise = f.prise ? 1 : 0, sw = Math.sin(f.t * 2.3 + (f.ph0 || 0)) * .05, tend = .12 + Math.sin(f.t * 1.7) * .04;
    for (let k = 0; k < 7; k++) {                                                                      // la terre, fendue autour
      const a = k / 7 * 6.2832 + .4, r = .15 + (k % 2) * .05, h = (.03 + (k % 3) * .018) * Math.min(1, e * 2.5);
      os2([Math.cos(a) * r, Math.sin(a) * r, 0], [Math.cos(a) * (r + .07), Math.sin(a) * (r + .07), h], .08, k % 2 ? terre : terre2);
    }
    if (e > 0) {
      const z0 = -.8 + .8 * e, B0 = [-.05, 0, z0 - .1], El = [sw * .5, 0, z0 + .36], Wr = [tend * e + sw, sw * .4, z0 + .74];
      os2(B0, El, .085, peau); os2(El, Wr, .07, peau);
      add(mi(B0, El, .5), mi(El, Wr, .25), .09, .075, terre);                                           // de la terre collée au bras
      add(mi(El, Wr, .2), mi(El, Wr, .85), .012, .012, veine);
      os2([Wr[0], Wr[1], Wr[2] - .02], [Wr[0] + .01, Wr[1], Wr[2] + .02], .08, ombre);                 // le poignet
      const d = [.55, 0, .83], Pm = [Wr[0] + d[0] * .13, Wr[1], Wr[2] + d[2] * .13];
      add(Wr, Pm, .12, .05, peau);                                                                     // la paume, tournée vers vous
      for (let k = 0; k < 4; k++) {
        const o = (k - 1.5) * .032, cl = .35 + .5 * (prise || (.5 + .5 * Math.sin(f.t * 5 + k * .9))), cs = Math.cos(cl), sn = Math.sin(cl);
        const F0 = [Pm[0], Pm[1] + o, Pm[2]], F1 = [F0[0] + d[0] * .1, F0[1] + o * .3, F0[2] + d[2] * .1];
        const F2 = [F1[0] + .085 * sn + .02, F1[1] + o * .15, F1[2] + .085 * cs], F3 = [F2[0] + .07 * Math.sin(cl * 1.8), F2[1], F2[2] + .07 * Math.cos(cl * 1.8)];
        os2(F0, F1, .024, peau); os2(F1, F2, .02, peau); os2(F2, F3, .017, ombre); os2(F3, [F3[0] + .012, F3[1], F3[2] - .012], .016, ongle);
      }
      os2([Pm[0] - .02, Pm[1] - .06, Pm[2] - .03], [Pm[0] + .05, Pm[1] - .1, Pm[2] + .02], .024, peau);  // le pouce
    }
  } else {
    const noir = [8, 6, 10], fume = [22, 19, 26], fume2 = [42, 38, 48], rue = f.etat === 'ruer', hz = 1.15, jx = f.jx || 0, jy = f.jy || 0;
    // voûtée debout ; couchée presque à l'horizontale quand elle se rue
    const AN = rue ? [.95, 1, 1.05, 1.1] : [.08, .14, .24, .36].map(a => a + Math.sin(f.t * 1.7) * .02);
    const S = chaine([jx, jy, hz], AN, .2), Q = k => cadre(S[k], AN[Math.min(k, 3)]);
    // une taille de guêpe sous une poitrine étroite, des épaules hautes et pointues
    bloc(Q(0), -.05, .05, 0, .02, .19, .12, noir);
    bloc(Q(1), -.05, .055, 0, -.06, .14, .2, noir); bloc(Q(1), -.055, .06, 0, .08, .17, .14, noir);
    bloc(Q(2), -.07, .08, 0, -.02, .25, .22, noir); bloc(Q(3), -.075, .075, 0, -.04, .3, .2, noir);
    const R4 = Q(4); bloc(R4, -.07, .06, 0, -.03, .42, .08, noir);
    for (const s of [-1, 1]) bloc(R4, -.05, .045, s * .2, .02, .08, .08, noir);
    // le long cou, la tête petite et étirée en hauteur, couchée sur l'épaule ; deux points blancs
    const N0 = R4(.02, 0, .02), na = rue ? 1.25 : .55, N = [N0[0] + Math.sin(na) * .2, N0[1] - (rue ? 0 : .08), N0[2] + Math.cos(na) * .2 - (rue ? 0 : .03)];   // debout, le cou plie déjà vers l'épaule
    os2(N0, N, .065, noir);
    const roll = rue ? 0 : 1 + Math.sin(f.t * 7) * .05, Ht = tete(N, rue ? -.2 : -.15, roll);
    const G = (c, w, d, h) => bloc(Ht, -d / 2 + .03, d / 2 + .03, 0, c, w, h, noir);
    G(.04, .09, .12, .07); G(.11, .13, .16, .09); G(.2, .155, .18, .11); G(.3, .14, .17, .11); G(.39, .1, .13, .07);
    for (const s of [-1, 1]) bloc(Ht, .1, .125, s * .036, .21, .026, .022, [255, 246, 236], true);
    // des bras qui descendent sous les genoux, trois articulations, cinq doigts trop longs qui remuent
    for (const s of [-1, 1]) {
      const Sh = R4(0, s * .22, 0);
      const M1 = rue ? [Sh[0] + .45, Sh[1] + s * .18, Sh[2] + .05] : [Sh[0] + .06, Sh[1] + s * .04, Sh[2] - .55];
      const M2 = rue ? [M1[0] + .45, M1[1] + s * .15, M1[2] - .02] : [M1[0] + .1, M1[1] + s * .02, M1[2] - .45];
      const M3 = rue ? [M2[0] + .35, M2[1] + s * .08, M2[2] - .05] : [M2[0] + .06, M2[1] - s * .02, M2[2] - .32];
      os2(Sh, M1, .09, noir); os2(M1, M2, .074, noir); os2(M2, M3, .06, noir);
      os2([M1[0], M1[1], M1[2] + .03], [M1[0], M1[1], M1[2] - .03], .1, noir); os2([M2[0], M2[1], M2[2] + .025], [M2[0], M2[1], M2[2] - .025], .085, noir);
      const dx = M3[0] - M2[0], dy = M3[1] - M2[1], dz = M3[2] - M2[2], dl = Math.hypot(dx, dy, dz), u = [dx / dl, dy / dl, dz / dl];
      const Pm = [M3[0] + u[0] * .11, M3[1] + u[1] * .11, M3[2] + u[2] * .11]; os2(M3, Pm, .07, noir);
      const lat = rue ? [0, 0, 1] : [1, 0, 0], ben = rue ? [0, 0, -1] : [0, -s, 0];
      for (let k = 0; k < 5; k++) {
        const e = (k - 2) * .05, rem = Math.sin(f.t * (rue ? 6 : 11) + k * 1.7 + s) * .03, cb = .05 + rem;
        const Q0 = [Pm[0] + lat[0] * e * .6, Pm[1] + lat[1] * e * .6, Pm[2] + lat[2] * e * .6];
        const Q1 = [Q0[0] + u[0] * .22 + lat[0] * e + ben[0] * cb, Q0[1] + u[1] * .22 + lat[1] * e + ben[1] * cb, Q0[2] + u[2] * .22 + lat[2] * e + ben[2] * cb];
        const Q2 = [Q1[0] + u[0] * .16 + lat[0] * e * .5 + ben[0] * cb * 2, Q1[1] + u[1] * .16 + lat[1] * e * .5 + ben[1] * cb * 2, Q1[2] + u[2] * .16 + lat[2] * e * .5 + ben[2] * cb * 2];
        os2(Q0, Q1, .024, noir); os2(Q1, Q2, .017, noir);
      }
    }
    // des jambes qui se défont en fumée (traînant derrière elle quand elle se rue)
    for (const s of [-1, 1]) {
      const p = ph + (s > 0 ? 0 : Math.PI), hip = [jx, jy + s * .1, hz];
      const K = rue ? [jx - .4, jy + s * .14, hz - .25] : [jx + .07, jy + s * .11, .66];
      const F = rue ? [jx - .85 + Math.sin(p) * .12, jy + s * .17, hz - .45 + Math.cos(p) * .06] : [jx + .02 + Math.sin(p) * .4 * v, jy + s * .13, .3];
      os2(hip, K, .1, noir); os2(K, mi(K, F, .55), .075, noir); os2(mi(K, F, .55), F, .065, fume);
      for (let j = 0; j < 5; j++) {
        const o = Math.sin(f.t * 8 + j * 1.3 + s) * (.04 + j * .025), w = .08 + j * .04;
        const Z0 = rue ? [F[0] - j * .13, F[1] + o, F[2] - j * .03] : [F[0] + o, F[1] + Math.cos(f.t * 7 + j + s) * .04, F[2] - j * .065];
        os2(Z0, rue ? [Z0[0] - .12, Z0[1] + o * .4, Z0[2] - .01] : [Z0[0] + o * .5, Z0[1] + o * .4, Z0[2] - .06], w, j < 2 ? fume : fume2);
      }
    }
    // des volutes d'ombre qui se détachent du dos et des épaules
    for (let j = 0; j < 6; j++) {
      const sg = j < 3 ? -1 : 1, k = j % 3, o = (((f.t * .9 + j * .37) % 1) + 1) % 1, B0 = R4(-.04, sg * (.06 + k * .07), -.06 - k * .16), w = .06 * (1 - o) + .02;
      add(B0, [B0[0] - .05 - o * .15, B0[1] + sg * o * .1, B0[2] + .08 + o * .28], w, w, o < .5 ? fume : fume2);
    }
  }
  return B;
}
// ---------- le mycélium ----------
// La trame, tirée une fois par taille d'image : des branches qui partent des bords (du bas surtout), se ramifient et
// s'amincissent. Chaque point garde sa distance à la racine : l'image n'en montre que ce qui a déjà poussé.
function mycelium(W, H) {
  const B = [], R = Math.hypot(W, H) / 2;
  const branche = (x, y, a, len, w, d0, prof) => {
    const p = [x, y, d0], b = { p, w, d0, ph: Math.random() * 6.28 }; B.push(b); let d = d0;
    for (let s = 0; s < len;) {
      const pas = 4 + Math.random() * 5; s += pas; d += pas; a += (Math.random() - .5) * .7;
      x += Math.cos(a) * pas; y += Math.sin(a) * pas; p.push(x, y, d);
      if (prof < 4 && Math.random() < .09) branche(x, y, a + (Math.random() < .5 ? -1 : 1) * (.45 + Math.random() * .7), (len - s) * (.4 + Math.random() * .4), w * .7, d, prof + 1);
    }
  };
  for (let k = 0; k < 22; k++) {
    const e = Math.random(); let x, y, a;
    if (e < .45) { x = Math.random() * W; y = H + 1; a = -1.571; }
    else if (e < .7) { x = -1; y = H * (.2 + Math.random() * .8); a = 0; }
    else if (e < .95) { x = W + 1; y = H * (.2 + Math.random() * .8); a = 3.142; }
    else { x = Math.random() * W; y = -1; a = 1.571; }
    branche(x, y, a + (Math.random() - .5) * .9, R * (.3 + Math.random() * .45), 1.4 + Math.random() * .8, 0, 0);
  }
  return B;
}
// Sur le corps de l'infecté (vue 3D) : des filaments noirs courent le long des membres, et gagnent avec l'infection.
// Appelé par heroBones (index.html) pour le joueur infecté ; un tirage fixe par pièce, pour que rien ne clignote.
function myceliumHeros(B) {
  if (!P.korlaz) return;
  const I = Math.min(1, P.korlaz.duree / 900), part = .35 + .65 * I, n0 = B.length;
  const HC = P.HC || (typeof HC_HERO !== 'undefined' ? HC_HERO : null), meme = (c, d) => d && c[0] === d[0] && c[1] === d[1] && c[2] === d[2];   // ni sur le sac, ni dans les cheveux
  for (let i = 0; i < n0; i++) {
    const o = B[i], h = (Math.imul(i + 7, 2654435761) >>> 0) / 4294967296;
    if (h > part || Math.max(o.w, o.h) < .03 || Math.max(o.w, o.h) > .5 || HC && (meme(o.c, HC.pack) || meme(o.c, HC.hair))) continue;
    const ux = o.b[0] - o.a[0], uy = o.b[1] - o.a[1], uz = o.b[2] - o.a[2], L = Math.hypot(ux, uy, uz); if (L < .06) continue;
    let px = -uy, py = ux; const pl = Math.hypot(px, py); if (pl < 1e-3) { px = 1; py = 0; } else { px /= pl; py /= pl; }
    const qx = -uz * py / L, qy = uz * px / L, qz = (ux * py - uy * px) / L;
    const cote = h * 2 < part ? 1 : -1, dw = Math.max(o.w, o.h) / 2 + .006, dh = Math.min(o.w, o.h) / 2, lon = Math.min(1, .35 + I * 1.1 + h * .4);
    let prev = null;
    for (let k = 0; k <= 4; k++) {
      const u = k / 4 * lon, zz = Math.sin(k * 2.1 + i) * .6;
      const q = [o.a[0] + ux * u + px * dw * cote + qx * dh * zz, o.a[1] + uy * u + py * dw * cote + qy * dh * zz, o.a[2] + uz * u + qz * dh * zz];
      if (prev) B.push({ a: prev, b: q, w: .013, h: .013, c: [16, 20, 12] });
      prev = q;
    }
  }
}
// ---------- à chaque image ----------
let filtreEl = null, filtreG = null, filtreCss = '';
function majEtats(dt) {
  if (typeof majBrume === 'function') majBrume(dt);        // la brume sanglante (brume.js)
  const ici = ETAT.id === 'korlaz';
  if (ici && !ETAT.annonce) { ETAT.annonce = true; say('Korlaz · la roche de cette île est rongée · ne restez pas dans ses spores', 5); }
  if (ici) {
    let n = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (roche(P.x + dx, P.y + dy)) n++;
    for (let k = 0; k < 4; k++) { const x = P.x + (Math.random() - .5) * 18, y = P.y + (Math.random() - .5) * 18;   // les spores, lentes, luisantes
      if (roche(x, y) && Math.random() < dt * 30) parts.push({ x, y, z: sol(x, y) + .1, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, vz: .25 + Math.random() * .35, g: -.12, life: 3 + Math.random(), age: 0, col: Math.random() < .6 ? '#161a12' : '#8ab048', luit: Math.random() < .4, tl: .07 + Math.random() * .05 }); }
    if (!P.korlaz) {
      if (n > 0 && P.pv > 0 && !(typeof effet === 'function' && effet('antidote'))) P.korlazExpo = (P.korlazExpo || 0) + dt * (.35 + n / 49 * 2.5);   // l'antidote : les spores n'y font rien
      else P.korlazExpo = Math.max(0, (P.korlazExpo || 0) - dt * .25);
      if (P.korlazExpo >= KORLAZ_SEUIL) infecter('vous êtes resté trop longtemps dans les spores');
    }
  }
  const K = P.korlaz;
  if (K && P.pv > 0) {
    K.duree += dt;
    const I = Math.min(1, K.duree / 900);
    if (t > K.prochain) { vision(I); K.prochain = t + (18 + Math.random() * 30) * (1 - .55 * I); }
    if (Math.random() < dt * (.02 + I * .04)) SON.jouer('murmure');
    if (Math.random() < dt * (.01 + I * .03)) ETAT.flash = .6;
    if (Math.random() < dt * (.08 + I * .2)) oeil();                                      // des yeux, au bord du noir
  }
  ETAT.brume = Math.max(0, ETAT.brume - dt); ETAT.flash = Math.max(0, ETAT.flash - dt * 6); ETAT.rouge = Math.max(0, ETAT.rouge - dt * 1.6);
  ETAT.visage = Math.max(0, ETAT.visage - dt * 1.2); ETAT.inv = Math.max(0, ETAT.inv - dt);
  ETAT.nb = K ? Math.max(0, ETAT.nb - dt) : 0; ETAT.griffes = ETAT.griffes.filter(c => c.fin > t);
  ETAT.yeux = ETAT.yeux.filter(o => o.fin > t); for (const g of ETAT.sang) { g.y += g.v * dt; g.a -= dt * .25; } ETAT.sang = ETAT.sang.filter(g => g.a > 0);
  dessinerFiltre(ici, K);
}
function dessinerFiltre(ici, K) {
  const sang = typeof brumeSang === 'function' ? brumeSang() : 0;
  const actif = ici || K || sang || ETAT.flash || ETAT.rouge || ETAT.visage || ETAT.sang.length || ETAT.griffes.length;
  // le noir et blanc : il vient en 0,8 s, repart en 1,5 s
  const nb = ETAT.nb > 0 ? Math.max(0, Math.min(1, ETAT.nb / 1.5, (ETAT.nbT - ETAT.nb) / .8)) : 0;
  // le filtre sur l'image même : la couleur s'en va, le contraste monte ; une inversion d'un éclair quand elle frappe
  const css = ETAT.inv > 0 ? 'invert(1) contrast(1.3)' : K ? `saturate(${(.72 - Math.min(1, ETAT.brume / 3) * .3).toFixed(2)}) contrast(1.12) brightness(.9)` + (nb ? ` grayscale(${nb.toFixed(2)}) contrast(${(1 + nb * .4).toFixed(2)})` : '') : ici ? 'saturate(.85) sepia(.12)' : '';
  if (css !== filtreCss) { filtreCss = css; for (const id of ['c', 'c3']) { const e = document.getElementById(id); if (e) e.style.filter = css; } }
  if (!actif) { if (filtreEl && filtreEl.style.display !== 'none') filtreEl.style.display = 'none'; return; }
  if (!filtreEl) {
    filtreEl = document.createElement('canvas'); filtreEl.id = 'etatFiltre';
    filtreEl.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    document.body.appendChild(filtreEl); filtreG = filtreEl.getContext('2d');
  }
  filtreEl.style.display = '';
  const W = Math.max(1, innerWidth / 2 | 0), H = Math.max(1, innerHeight / 2 | 0);
  if (filtreEl.width !== W || filtreEl.height !== H) { filtreEl.width = W; filtreEl.height = H; }
  const g = filtreG, R = Math.hypot(W, H) / 2;
  g.clearRect(0, 0, W, H);
  const vign = (a, c, r0 = .25) => { const gr = g.createRadialGradient(W / 2, H / 2, R * r0, W / 2, H / 2, R); gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(1, `rgba(${c},${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  if (ici) vign(.3, '22,30,18');
  if (sang) dessinerBrume(g, W, H, R, vign);
  if (K) {
    const I = Math.min(1, K.duree / 900), br = Math.min(1, ETAT.brume / 3);
    vign(.38 + I * .2 + br * .42 + Math.sin(t * .4) * .06, '3,2,5', .2);                 // la brume noire qui respire
    for (let k = 0; k < 6 + (br * 8 | 0); k++) {                                          // des volutes
      const x = W * (.5 + .55 * Math.sin(t * .07 * (1 + k * .13) + k * 2.1)), y = H * (.5 + .5 * Math.cos(t * .05 * (1 + k * .17) + k * 1.3)), r = R * (.25 + .2 * Math.sin(t * .3 + k));
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(3,2,5,${.12 + I * .1 + br * .25})`); gr.addColorStop(1, 'rgba(3,2,5,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    // le mycélium : des filaments noirs, fins, ramifiés, qui poussent des bords — du bas surtout, là où est le corps —
    // et gagnent l'image à mesure que l'infection dure ; la brume le fait avancer d'un coup ; son front de pousse luit, pâle
    const cle = W * 1e5 + H; if (!ETAT.myc || ETAT.mycCle !== cle) { ETAT.myc = mycelium(W, H); ETAT.mycCle = cle; }
    const D = R * (.1 + .42 * I + .3 * br + .025 * Math.sin(t * .5));
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [lw, la] of [[2.8, .13], [1, 1]]) for (const b of ETAT.myc) {
      if (b.d0 > D) continue;
      const p = b.p, on = (k, q) => Math.sin(t * .7 + b.ph + k * .4 + q) * .5 * Math.min(1, (p[k + 2] - b.d0) / 30);   // les filaments ondulent à peine
      g.strokeStyle = `rgba(4,3,6,${(.6 + br * .3) * la})`; g.lineWidth = b.w * lw; g.beginPath(); g.moveTo(p[0], p[1]); b.tx = p[0]; b.ty = p[1];
      for (let k = 3; k < p.length; k += 3) {
        let x = p[k] + on(k, 0), y = p[k + 1] + on(k, 1.7);
        if (p[k + 2] > D) { const f = (D - p[k - 1]) / (p[k + 2] - p[k - 1]); x = b.tx + (x - b.tx) * f; y = b.ty + (y - b.ty) * f; g.lineTo(x, y); b.tx = x; b.ty = y; break; }
        g.lineTo(x, y); b.tx = x; b.ty = y;
      }
      g.stroke();
    }
    g.fillStyle = `rgba(196,210,150,${.3 + .15 * Math.sin(t * 3)})`;                         // le front de pousse
    for (const b of ETAT.myc) if (b.d0 <= D && b.tx !== undefined) g.fillRect(b.tx - .8, b.ty - .8, 1.6, 1.6);
    for (const o of ETAT.yeux) {                                                            // des yeux dans le noir, qui clignent
      if (t < o.cl && t > o.cl - .12) continue;
      const x = o.x * W, y = o.y * H, e = o.e * W, a = Math.min(1, (o.fin - t) / .5);
      for (const s of [-1, 1]) { const gr = g.createRadialGradient(x + s * e, y, 0, x + s * e, y, e * .9); gr.addColorStop(0, `rgba(255,250,240,${.9 * a})`); gr.addColorStop(.3, `rgba(255,250,240,${.5 * a})`); gr.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x + s * e, y, e * .9, 0, 6.283); g.fill(); }
    }
  }
  if (ETAT.visage > 0) {                                                                    // un visage, immense, qui se devine dans la brume
    const a = Math.sin(Math.min(1, ETAT.visage) * Math.PI) * .6, cx = W * .5, cy = H * .42, r = R * .5;
    const tache = (x, y, rx, ry, c, al) => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${c},${al})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };
    tache(cx, cy, r * .62, r * .85, '150,150,150', a * .1);                                 // le crâne, à peine plus clair que la brume
    for (const s of [-1, 1]) {
      tache(cx + s * r * .26, cy - r * .2, r * .16, r * .08, '190,190,190', a * .16);          // l'arcade
      tache(cx + s * r * .3, cy + r * .12, r * .14, r * .07, '170,170,170', a * .12);          // la pommette
      tache(cx + s * r * .24, cy - r * .06, r * .17, r * .2, '0,0,0', a);                      // l'orbite
      tache(cx + s * r * .23, cy - r * .05, r * .025, r * .025, '255,250,240', a * .9);        // la pupille, qui luit au fond
    }
    tache(cx, cy + r * .44, r * .12, r * .3, '0,0,0', a * .95);                               // la bouche, ouverte en long
  }
  if (nb > 0) {                                                                             // le noir et blanc : un grain de vieux film, une rayure
    g.fillStyle = `rgba(255,255,255,${.07 * nb})`; for (let k = 0; k < 260; k++) g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    g.fillStyle = `rgba(0,0,0,${.12 * nb})`; for (let k = 0; k < 260; k++) g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    if (Math.random() < .35) { g.fillStyle = `rgba(235,235,235,${.1 * nb})`; g.fillRect(Math.random() * W, 0, 1, H); }
    vign(.45 * nb, '0,0,0', .3);
  }
  for (const c of ETAT.griffes) {                                                           // des griffes qui lacèrent l'image
    const u1 = Math.min(1, (t - c.t0) / .14), a = Math.min(1, (c.fin - t) / .9), ca = Math.cos(c.a), sa = Math.sin(c.a), nx = -sa, ny = ca;
    for (let j = 0; j < c.n; j++) {
      const m = j - (c.n - 1) / 2, o = m * c.e * R, L = c.l * R * (1 - Math.abs(m) * .14), x0 = c.x * W + nx * o - ca * L / 2, y0 = c.y * H + ny * o - sa * L / 2, pts = [];
      for (let k = 0; k <= 20 * u1; k++) { const u = k / 20, cu = Math.sin(u * 3.1416) * c.cb * L, w = c.w * R * Math.pow(Math.sin(u * 3.1416), .55) * (1 + .35 * Math.sin(u * 23 + j * 2) * Math.sin(u * 41 + c.t0)); pts.push([x0 + ca * u * L + nx * cu, y0 + sa * u * L + ny * cu, w]); }   // le bord déchiqueté
      if (pts.length < 2) continue;
      const fente = (k1, k2) => { g.beginPath(); pts.forEach(([x, y, w], k) => k ? g.lineTo(x + nx * w * k1, y + ny * w * k1) : g.moveTo(x + nx * w * k1, y + ny * w * k1)); for (let k = pts.length - 1; k >= 0; k--) { const [x, y, w] = pts[k]; g.lineTo(x - nx * w * k2, y - ny * w * k2); } g.closePath(); };
      g.fillStyle = `rgba(120,6,12,${.8 * a})`; fente(1.9, 1.5); g.fill();                     // la chair, autour
      g.fillStyle = `rgba(2,0,1,${.95 * a})`; fente(1, .75); g.fill();                         // la déchirure, noire
      g.strokeStyle = `rgba(235,70,60,${.55 * a})`; g.lineWidth = .8; fente(1.15, .9); g.stroke();   // le bord vif
    }
    if (u1 >= 1) { g.fillStyle = `rgba(130,6,12,${.8 * a})`; for (const [dx, dy, r] of c.gt) { g.beginPath(); g.arc(c.x * W + dx * R * c.l, c.y * H + dy * R * c.l, r, 0, 6.2832); g.fill(); } }
  }
  for (const s of ETAT.sang) {                                                              // le sang qui coule du haut de l'image : une tache, une coulure, une goutte au bout
    const a = Math.min(1, s.a) * .85, w = s.w || (s.w = (s.y0 ? .8 : 1.2) + Math.random() * (s.y0 ? 1.6 : 2.6)), x = s.x * W, y0 = (s.y0 || 0) * H, y1 = Math.min(H, y0 + s.y * H + s.l * H), on = q => Math.sin(q * .045 + s.x * 37) * 1.6;
    g.fillStyle = `rgba(118,6,12,${a})`; g.beginPath(); g.moveTo(x - w * 1.6, y0);
    for (let k = 0; k <= 10; k++) { const y = y0 + (y1 - y0) * k / 10; g.lineTo(x + on(y) - w * (1 - k * .045), y); }
    for (let k = 10; k >= 0; k--) { const y = y0 + (y1 - y0) * k / 10; g.lineTo(x + on(y) + w * (1 - k * .045), y); }
    g.lineTo(x + w * 1.6, y0); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(x + on(y1), y1 + w * .4, w * 1.05, w * 1.45, 0, 0, 6.2832); g.fill();
    if (!s.y0) { g.fillStyle = `rgba(80,3,8,${a * .8})`; g.beginPath(); g.ellipse(x, 0, w * 3.2, w * 2.2, 0, 0, 6.2832); g.fill(); }   // la tache en haut de l'image
    g.fillStyle = `rgba(210,50,50,${a * .3})`; g.fillRect(x + on((y0 + y1) * .5) - w * .45, y0, Math.max(1, w * .3), (y1 - y0) * .9);   // un reflet
  }
  if (ETAT.rouge > 0) vign(ETAT.rouge * .55, '150,10,14');
  if (ETAT.flash > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(.85, ETAT.flash)})`; g.fillRect(0, 0, W, H); }
}
