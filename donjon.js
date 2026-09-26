// ============================================================
//  LE CENTRE DES AUTOMATES
//  Sous chaque île des automates, une trappe cachée dans les tôles mène à un souterrain de trois à
//  cinq étages (la graine de l'île en décide), de plus en plus durs : des salles et des couloirs
//  taillés dans la roche, éclairés de néons — il n'y fait jamais nuit. On n'y croise que les
//  machines d'en bas : la tourelle murale, l'araignée de maintenance, le gardien de salle. Des
//  lasers barrent les couloirs, des plaques y déclenchent des fléchettes, des grilles crachent la
//  vapeur, et la salle du gardien se referme sur qui y entre.
//  Façon roguelike : ce qu'on ramasse en bas n'est à soi qu'une fois remonté. Le monte-charge de
//  chaque étage remonte avec le butin ; terrassé, on se réveille près de la trappe, sans lui.
//  Tous les joueurs d'une île ont le même souterrain et se voient étage par étage ; chacun garde
//  ses coffres et ses machines.
//  Ce fichier est chargé AVANT le script du jeu : il ne déclare que des fonctions et son propre
//  état (tout est préfixé dj / DJ), et ne touche au monde qu'une fois appelé par le jeu.
// ============================================================
const DJ = {
  etat: null,          // la descente en cours ({ g, e, s0, b0, o0, tr, ouverts, vaincus }) — null à la surface
  n: 0, e: 0,          // étages de ce souterrain, étage courant
  salles: [], plaques: [], grilles: [], coffres: [], statique: [], lasers: 0,
  monte: [], escalier: null, horloge: null,
  trappe: null,        // à la surface d'une île des automates : l'entrée
  transit: undefined, msgSuivant: null, msg: null, accueil: false,
  traits: [], chaleur: 0, surchauffe: -9, dernierTir: -9, visee: null,
};
const DJ_Z0 = 8, DJ_MUR = 4, DJ_BIO_MUR = 13, DJ_BIO_SALLE = 15, DJ_BIO_COULOIR = 6, DJ_BIO_HUILE = 16;
const DJ_RES = ['fibre', 'bois', 'pierre', 'os', 'eclat', 'ferraille'];
function djIci() { return !!DJ.etat; }
function djAlea(s) {
  s >>>= 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
function djHash(x) { x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; }
function djNbEtages(g) { return 3 + djHash(g ^ 0xd057a9) % 3; }

// ---------- la descente, dans la sauvegarde ----------
function djPropre(e, graine) {
  if (!e || typeof e !== 'object' || e.g !== graine || !Number.isInteger(e.e) || e.e < 1 || e.e > 9) return null;
  const nb = (v, a, b) => Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a;
  const s0 = {}; for (const r of DJ_RES) s0[r] = nb(e.s0 && e.s0[r], 0, 1e6) | 0;
  const tr = Array.isArray(e.tr) && e.tr.length === 3 && e.tr.every(Number.isFinite) ? e.tr.map(v => Math.round(v * 100) / 100) : null;
  const ints = a => (Array.isArray(a) ? a : []).filter(i => Number.isInteger(i) && i >= 0 && i < 400).slice(0, 200);
  return { g: graine, e: e.e, s0, b0: nb(e.b0, 0, 1e6) | 0, tr, test: e.test ? 1 : 0,
    o0: (Array.isArray(e.o0) ? e.o0 : []).filter(id => typeof id === 'string' && id.length < 24).slice(0, 80),
    ouverts: ints(e.ouverts), vaincus: ints(e.vaincus) };
}
function djLire() {
  try {
    const s = JSON.parse(lireCopie() || 'null'), d = s && s.donnees;
    if (!d) return null;
    DJ.msg = typeof d.djMsg === 'string' ? d.djMsg.slice(0, 200) : null;
    return djPropre(d.donjon, d.graine);
  } catch (err) { return null; }
}
const djPhoto = () => DJ.etat ? JSON.parse(JSON.stringify(DJ.etat)) : null;
// Appelé par voyagerVers : la descente passe d'une page à l'autre avec la sauvegarde, et l'exploration
// ne bouge pas — on reste sur la même île, dessus ou dessous.
function djTransit(d) {
  if (DJ.transit === undefined) { d.donjon = null; d.djMsg = null; return; }
  d.exp = { n: profondeur(), c: coeursPerdus(), s: P.exp.sortie ? 1 : 0 };
  d.donjon = DJ.transit; d.djMsg = DJ.msgSuivant || null;
  DJ.transit = undefined; DJ.msgSuivant = null;
}

// ============================================================
//  LA GÉNÉRATION D'UN ÉTAGE
//  Tout est roche, à quatre cubes au-dessus du sol : on y creuse des salles (tôle rivetée) et des
//  couloirs de deux cases (pierre), reliés par un arbre couvrant et deux boucles. La salle
//  d'arrivée et celle de l'escalier sont les plus éloignées l'une de l'autre ; au dernier étage,
//  l'escalier cède la place à la salle de l'Horloge. La même graine donne le même souterrain à
//  tous les joueurs de l'île.
// ============================================================
function djGenere() {
  const s = djLire();
  if (!s) return false;
  DJ.etat = s; DJ.n = djNbEtages(SEED); DJ.e = s.e = Math.min(s.e, DJ.n);
  const R = djAlea(djHash(SEED ^ Math.imul(DJ.e, 0x9e3779b1) ^ 0xd0e5));
  const Z0 = DJ_Z0, HM = DJ_Z0 + DJ_MUR, dernier = DJ.e === DJ.n;
  Hgt.fill(HM); Bio.fill(DJ_BIO_MUR); Eau.fill(0); PlT.fill(0); PlB.fill(0);
  const salles = [], A = 40, B = 160;
  const libre = (x, y, w, h) => !salles.some(q => x < q.x + q.w + 4 && x + w + 4 > q.x && y < q.y + q.h + 4 && y + h + 4 > q.y);
  if (dernier) { const w = 20, h = 16; salles.push({ x: 90 - (R() * 16 | 0), y: 88 - (R() * 16 | 0), w, h, role: 'horloge' }); }
  const nb = 8 + (R() * 4 | 0);
  for (let k = 0; k < 900 && salles.length < nb; k++) {
    const w = 7 + (R() * 7 | 0), h = 7 + (R() * 6 | 0);
    const x = A + (R() * (B - A - w) | 0), y = A + (R() * (B - A - h) | 0);
    if (libre(x, y, w, h)) salles.push({ x, y, w, h });
  }
  const creuse = (x, y, bio) => { const i = y * WS + x; if (Hgt[i] === HM) { Hgt[i] = Z0; Bio[i] = bio; } };
  for (const q of salles) {
    q.cx = q.x + q.w / 2; q.cy = q.y + q.h / 2; q.portes = [];
    for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) creuse(x, y, DJ_BIO_SALLE);
  }
  // l'arbre couvrant (Prim), puis deux boucles entre voisines
  const d2 = (a, b) => (salles[a].cx - salles[b].cx) ** 2 + (salles[a].cy - salles[b].cy) ** 2;
  const liens = [], dans = new Set([0]);
  while (dans.size < salles.length) {
    let best = null;
    for (const a of dans) for (let b = 0; b < salles.length; b++) if (!dans.has(b) && (!best || d2(a, b) < best[2])) best = [a, b, d2(a, b)];
    liens.push(best); dans.add(best[1]);
  }
  for (let k = 0, n = 0; k < 40 && n < 2; k++) {
    const a = R() * salles.length | 0, b = R() * salles.length | 0;
    if (a === b || d2(a, b) > 42 * 42 || liens.some(l => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a))) continue;
    liens.push([a, b]); n++;
  }
  for (const [a, b] of liens) {
    const p = salles[a], q = salles[b], ax = p.cx | 0, ay = p.cy | 0, bx = q.cx | 0, by = q.cy | 0;
    const h = (y, x0, x1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 1; x++) { creuse(x, y, DJ_BIO_COULOIR); creuse(x, y + 1, DJ_BIO_COULOIR); } };
    const v = (x, y0, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1) + 1; y++) { creuse(x, y, DJ_BIO_COULOIR); creuse(x + 1, y, DJ_BIO_COULOIR); } };
    if (R() < .5) { h(ay, ax, bx); v(bx, ay, by); } else { v(ax, ay, by); h(by, ax, bx); }
  }
  // les portes : là où un couloir perce le tour d'une salle
  for (const q of salles) for (let y = q.y - 1; y <= q.y + q.h; y++) for (let x = q.x - 1; x <= q.x + q.w; x++) {
    if (y !== q.y - 1 && y !== q.y + q.h && x !== q.x - 1 && x !== q.x + q.w) continue;
    const i = y * WS + x; if (Hgt[i] === Z0) q.portes.push(i);
  }
  // l'arrivée et l'escalier, aux deux bouts
  const loin = a => { let b = 0, m = -1; salles.forEach((q, k) => { const d = d2(a, k); if (d > m) { m = d; b = k; } }); return b; };
  const sortie = dernier ? 0 : loin(R() * salles.length | 0), arrivee = loin(sortie);
  salles[arrivee].role = 'arrivee';
  if (!dernier) salles[sortie].role = 'escalier';
  const roles = DJ.e === 1 ? ['grenier', 'tourelles', 'araignees', 'cristaux', 'vapeur', 'vide', 'grenier', 'araignees', 'tourelles', 'vide']
    : ['garde', 'tourelles', 'grenier', 'araignees', 'vapeur', 'cristaux', 'tourelles', 'garde', 'grenier', 'araignees', 'vide'];
  let kr = R() * 3 | 0;
  for (const q of salles) if (!q.role) q.role = roles[kr++ % roles.length];
  // passé le premier étage, un gardien au moins (sauf au dernier, où veille l'Horloge)
  if (DJ.e > 1 && !dernier && !salles.some(q => q.role === 'garde')) { const q = salles.find(q => q.role !== 'arrivee' && q.role !== 'escalier'); if (q) q.role = 'garde'; }
  // l'huile sur les replats, les piliers des salles de tourelles, l'escalier
  for (const q of salles) {
    if (q.role === 'vide' || q.role === 'grenier') for (let k = 0; k < q.w * q.h * .08; k++) {
      const x = q.x + 1 + (R() * (q.w - 2) | 0), y = q.y + 1 + (R() * (q.h - 2) | 0); Bio[y * WS + x] = DJ_BIO_HUILE;
    }
    if (q.role === 'tourelles' || q.role === 'horloge') for (let k = 0; k < (q.role === 'horloge' ? 4 : 3); k++) {
      const x = q.x + 2 + (R() * (q.w - 4) | 0), y = q.y + 2 + (R() * (q.h - 4) | 0);
      if (Math.abs(x - q.cx) < 2 && Math.abs(y - q.cy) < 2) continue;
      Hgt[y * WS + x] = Z0 + 2; Bio[y * WS + x] = DJ_BIO_MUR;
    }
  }
  const esc = salles.find(q => q.role === 'escalier');
  if (esc) {
    const x = esc.cx | 0, y = esc.cy | 0;
    for (let k = 0; k < 3; k++) for (const dy of [0, 1]) { const i = (y + dy) * WS + x - 1 + k; Hgt[i] = Z0 - 1 - k; Bio[i] = DJ_BIO_COULOIR; }
    DJ.escalier = { x: x + 1.5, y: y + 1, z: Z0 - 3 };
  } else DJ.escalier = null;
  DJ.salles = salles;
  calcOmbrage();
  return true;
}

// ============================================================
//  LE PEUPLEMENT : machines, pièges, coffres, décor
//  Appelé à la fin de loadWorld. À la surface d'une île des automates, il n'y a qu'une trappe à
//  poser, là où la graine le dit, sans rien pour la signaler.
// ============================================================
function djTrouverTrappe() {
  DJ.trappe = null;
  if (typeof ileMeca === 'undefined' || !ileMeca) return;
  const R = djAlea(djHash(SEED ^ 0x7a99e));
  for (let k = 0; k < 6000; k++) {
    const x = 12 + (R() * (WS - 24) | 0), y = 12 + (R() * (WS - 24) | 0), h = hAt(x, y);
    if (h <= SEA || Bio[y * WS + x] !== DJ_BIO_SALLE || eauAt(x, y) || plaT(x, y)) continue;
    let plat = true;
    for (let dy = -1; dy <= 1 && plat; dy++) for (let dx = -1; dx <= 1; dx++) if (hAt(x + dx, y + dy) !== h || Bio[(y + dy) * WS + x + dx] === DJ_BIO_HUILE) { plat = false; break; }
    if (!plat) continue;
    if (PortailIle && Math.hypot(PortailIle.x - x, PortailIle.y - y) < 14) continue;
    if (LASERS.some(l => Math.hypot((l.ax + l.bx) / 2 - x, (l.ay + l.by) / 2 - y) < 5)) continue;
    DJ.trappe = { x: x + .5, y: y + .5, z: h };
    return;
  }
}
function djPeupler() {
  DJ.traits = []; DJ.visee = null;
  if (!djIci()) { djTrouverTrappe(); if (DJ.msg) { say(DJ.msg, 5.5); DJ.msg = null; } return; }
  const Z0 = DJ_Z0, e = DJ.e, st = DJ.etat, R = djAlea(djHash(SEED ^ Math.imul(e, 0x51ed27) ^ 0xbeef));
  const esp = id => ESP.findIndex(o => o.id === id) + 1;
  Flo.fill(0); coupes.clear();
  DJ.plaques = []; DJ.grilles = []; DJ.coffres = []; DJ.monte = []; DJ.statique = []; DJ.horloge = null;
  const deco = (a, b, w, h, c, lum) => DJ.statique.push({ a, b, w, h, c, lum: !!lum });
  const sol = (x, y) => Hgt[(y | 0) * WS + (x | 0)] === Z0;
  let nMachine = 0;
  const machine = (id, x, y, salle, dir) => {
    const k = nMachine++;
    if (st.vaincus.includes(k)) return null;
    const sp = specById[id]; if (!sp || !sol(x, y)) return null;
    const b = naitre(sp, x, y, sp.mat * 2);
    b.djIdx = k; b.djSalle = salle; b.ph = R() * 6.28; b.home = [x, y];
    b.dir = b.dirT = dir ?? R() * 6.28; b.pv = 1;
    beasts.push(b); return b;
  };
  const coffre = (x, y, taille, salle) => {
    const k = DJ.coffres.length;
    DJ.coffres.push({ k, x, y, z: Z0, taille, salle, ouvert: st.ouverts.includes(k) });
  };
  const floreEn = (id, n, q) => { const f = esp(id); if (!f) return;
    for (let k = 0; k < n; k++) { const x = q.x + 1 + (R() * (q.w - 2) | 0), y = q.y + 1 + (R() * (q.h - 2) | 0), i = y * WS + x;
      if (Hgt[i] === Z0 && Bio[i] !== DJ_BIO_HUILE && !Flo[i]) Flo[i] = f; } };
  // un néon tous les quatre pas le long des murs de chaque salle, de la couleur de ce qu'elle garde
  const NEON = { garde: [255, 80, 64], horloge: [255, 206, 120], arrivee: [255, 196, 96], escalier: [140, 255, 200], vapeur: [255, 150, 70] };
  DJ.salles.forEach((q, s) => {
    const c = NEON[q.role] || [110, 226, 255], zN = Z0 + 2.5;
    for (let x = q.x + 1; x < q.x + q.w - 1; x += 4) {
      if (Hgt[(q.y - 1) * WS + x] > Z0) deco([x, q.y + .05, zN], [x + 1.3, q.y + .05, zN], .08, .08, c, 1);
      if (Hgt[(q.y + q.h) * WS + x] > Z0) deco([x, q.y + q.h - .05, zN], [x + 1.3, q.y + q.h - .05, zN], .08, .08, c, 1);
    }
    for (let y = q.y + 1; y < q.y + q.h - 1; y += 4) {
      if (Hgt[y * WS + q.x - 1] > Z0) deco([q.x + .05, y, zN], [q.x + .05, y + 1.3, zN], .08, .08, c, 1);
      if (Hgt[y * WS + q.x + q.w] > Z0) deco([q.x + q.w - .05, y, zN], [q.x + q.w - .05, y + 1.3, zN], .08, .08, c, 1);
    }
    // des conduites aux coins
    for (const [x, y] of [[q.x + .25, q.y + .25], [q.x + q.w - .25, q.y + q.h - .25]]) deco([x, y, Z0], [x, y, Z0 + DJ_MUR], .22, .22, [70, 74, 86]);
    const cx = q.cx, cy = q.cy, bord = (k2) => {             // une case contre un mur, pour une tourelle
      for (let n = 0; n < 30; n++) { const cote = R() * 4 | 0, u = R();
        const x = cote === 0 ? q.x : cote === 1 ? q.x + q.w - 1 : q.x + 1 + (u * (q.w - 2) | 0);
        const y = cote === 2 ? q.y : cote === 3 ? q.y + q.h - 1 : q.y + 1 + (u * (q.h - 2) | 0);
        if (!sol(x, y) || q.portes.some(i => Math.abs(i % WS - x) + Math.abs((i / WS | 0) - y) < 3)) continue;
        return [x + .5, y + .5]; } return null; };
    const k0 = e - 1;
    if (q.role === 'arrivee') {
      const x = q.x + 1.6, y = q.y + 1.6; DJ.monte.push({ x, y, z: Z0 });
    } else if (q.role === 'grenier') {
      coffre(cx - 1.5 + R() * 3, q.y + 1.5, 'petit', s); if (q.w * q.h > 90) coffre(q.x + q.w - 2, cy, 'petit', s);
      floreEn('pylone', 2, q); floreEn('engrenage', 1, q);
      for (let k = 0; k < 1 + k0; k++) machine('araignee', q.x + 1.5 + R() * (q.w - 3), q.y + 1.5 + R() * (q.h - 3), s);
    } else if (q.role === 'garde') {
      machine('gardien', cx, cy, s, R() * 6.28); coffre(q.x + q.w - 2, q.y + 1.5, 'garde', s);
      for (let k = 0; k < k0; k++) machine('araignee', q.x + 1.5 + R() * (q.w - 3), q.y + 1.5 + R() * (q.h - 3), s);
    } else if (q.role === 'tourelles') {
      for (let k = 0; k < 2 + (e > 2 ? 1 : 0); k++) { const p = bord(); if (p) machine('tourelle', p[0], p[1], s, Math.atan2(cy - p[1], cx - p[0])); }
      coffre(cx + (R() < .5 ? -1 : 1) * (q.w / 2 - 2), cy, 'petit', s);
    } else if (q.role === 'araignees') {
      for (let k = 0; k < 3 + k0; k++) machine('araignee', q.x + 1.5 + R() * (q.w - 3), q.y + 1.5 + R() * (q.h - 3), s);
      floreEn('druse', 3, q);
    } else if (q.role === 'cristaux') {
      floreEn('druse', 3, q); floreEn('condensateur', 2, q); floreEn('bobine', 2, q);
      const p = bord(); if (p) machine('tourelle', p[0], p[1], s, Math.atan2(cy - p[1], cx - p[0]));
    } else if (q.role === 'vapeur') {
      for (let y = q.y + 1, r = 0; y < q.y + q.h - 1; y += 2, r++) {
        const trou = q.x + (R() * q.w | 0);
        for (let x = q.x; x < q.x + q.w; x++) if (x !== trou && sol(x, y)) DJ.grilles.push({ x, y, ph: r * .85 });
      }
      coffre(cx, q.y + q.h - 1.5, 'petit', s);
    } else if (q.role === 'vide') {
      floreEn('pylone', 2, q); floreEn('engrenage', 2, q); floreEn('bobine', 2, q);
    } else if (q.role === 'horloge') {
      machine('gardien', cx, cy + 1, s, Math.PI / 2);
      for (let k = 0; k < 2; k++) machine('araignee', q.x + 2 + R() * (q.w - 4), q.y + q.h - 3, s);
      coffre(cx, q.y + 2, 'grand', s);
      DJ.monte.push({ x: q.x + q.w - 1.6, y: q.y + q.h - 1.6, z: Z0 });
      DJ.horloge = { x: cx, y: q.y + .1, z: Z0 + 2.2, r: 2.6 };
      floreEn('engrenage', 3, q);
    }
  });
  // les couloirs : des barrières laser et des plaques, là où ils filent droit entre deux murs
  const couloir = (x, y) => Bio[y * WS + x] === DJ_BIO_COULOIR && Hgt[y * WS + x] === Z0;
  const droits = [];
  for (let y = 3; y < WS - 3; y++) for (let x = 3; x < WS - 3; x++) {
    if (!couloir(x, y)) continue;
    if (couloir(x, y + 1) && Hgt[(y - 1) * WS + x] > Z0 && Hgt[(y + 2) * WS + x] > Z0 && couloir(x - 1, y) && couloir(x + 1, y) && couloir(x - 1, y + 1) && couloir(x + 1, y + 1))
      droits.push({ x, y, hor: true });
    else if (couloir(x + 1, y) && Hgt[y * WS + x - 1] > Z0 && Hgt[y * WS + x + 2] > Z0 && couloir(x, y - 1) && couloir(x, y + 1) && couloir(x + 1, y - 1) && couloir(x + 1, y + 1))
      droits.push({ x, y, hor: false });
  }
  const pris = [], loinDe = (x, y, d) => pris.every(p => Math.hypot(p[0] - x, p[1] - y) > d)
    && DJ.monte.every(m => Math.hypot(m.x - x, m.y - y) > 8);
  const nL = 1 + e, nP = 1 + e;
  for (let k = 0, n = 0; k < 400 && n < nL && droits.length; k++) {
    const c = droits[R() * droits.length | 0]; if (!loinDe(c.x, c.y, 9)) continue;
    const l = c.hor ? { ax: c.x + .5, ay: c.y + .12, bx: c.x + .5, by: c.y + 1.88 } : { ax: c.x + .12, ay: c.y + .5, bx: c.x + 1.88, by: c.y + .5 };
    LASERS.push(Object.assign(l, { z: Z0, ph: R() * LASER_PER, etat: 'off' })); pris.push([c.x, c.y]); n++;
  }
  for (let k = 0, n = 0; k < 400 && n < nP && droits.length; k++) {
    const c = droits[R() * droits.length | 0]; if (!loinDe(c.x, c.y, 7)) continue;
    DJ.plaques.push({ x: c.x + (c.hor ? .5 : 1), y: c.y + (c.hor ? 1 : .5), hor: c.hor, t: -9, arme: 0 }); pris.push([c.x, c.y]); n++;
  }
  // de loin en loin, une veilleuse au sol des couloirs
  for (const c of droits) if ((c.x * 7 + c.y * 13) % 23 === 0) deco([c.x + (c.hor ? .5 : 1), c.y + (c.hor ? 1 : .5), Z0 + .01], [c.x + (c.hor ? .5 : 1), c.y + (c.hor ? 1 : .5), Z0 + .05], .16, .16, [120, 220, 255], 1);
  // l'arrivée : au pied du monte-charge, sauf si la sauvegarde remet déjà à sa place
  const m = DJ.monte[0] || { x: DJ.salles[0].cx, y: DJ.salles[0].cy };
  P.x = m.x + 1.4; P.y = m.y + 1.4; P.z = Z0; P.vx = P.vy = P.vz = 0; P.spawn = [P.x, P.y, P.z]; P.sol = [P.x, P.y, P.z]; P.ground = true;
  camX = P.x; camY = P.y; camZ = P.z;
  DJ.accueil = true;
}

// ============================================================
//  CE QUI BOUGE À CHAQUE IMAGE : portes, vapeur, plaques, et les armes
// ============================================================
const DJ_VAP = { per: 3.4, on: 1.2 };
const djVapeurOn = gr => ((t + gr.ph) % DJ_VAP.per) < DJ_VAP.on;
const djDansSalle = (q, x, y, m = 0) => x >= q.x + m && x < q.x + q.w - m && y >= q.y + m && y < q.y + q.h - m;
function djPortes(q, fermer) {
  if (!!q.fermee === fermer) return;
  q.fermee = fermer;
  for (const i of q.portes) {
    const x = i % WS + .5, y = (i / WS | 0) + .5;
    if (fermer && Math.hypot(P.x - x, P.y - y) < .9) continue;       // on ne ferme pas sur quelqu'un
    Hgt[i] = fermer ? DJ_Z0 + DJ_MUR : DJ_Z0; signalDecor('dalle', i);
  }
  SON.jouer('clank', { vol: 1 }, q.cx, q.cy, DJ_Z0 + 1);
  say(fermer ? 'les portes se referment · le gardien ne vous laissera pas sortir' : 'les portes se rouvrent', 3);
}
function djMajMonde(dt) {
  // les armes du donjon marchent partout : la chaleur retombe, les traits s'effacent
  if (t - DJ.dernierTir > .8) DJ.chaleur = Math.max(0, DJ.chaleur - dt * .45);   // il ne refroidit qu'au repos
  for (let k = DJ.traits.length - 1; k >= 0; k--) if (t - DJ.traits[k].t0 > DJ.traits[k].dur) DJ.traits.splice(k, 1);
  djMajVisee();
  if (!djIci()) return;
  if (DJ.accueil && t > .3) { DJ.accueil = false;
    say(DJ.msg || ('Centre des automates · étage ' + DJ.e + ' sur ' + DJ.n + (DJ.e === DJ.n ? ' · la salle de l\'Horloge' : '')
      + (DJ.etat.test ? ' · descente d\'essai : rien n\'en remonte' : ' · le monte-charge remonte le butin')), 5.5); DJ.msg = null; }
  // les machines vaincues ne reviennent pas si l'on recharge la page
  for (const b of beasts) if (b.djIdx !== undefined && b.dead && !DJ.etat.vaincus.includes(b.djIdx)) { DJ.etat.vaincus.push(b.djIdx); Sauve.sale = true; }
  // la salle du gardien se referme sur qui y entre, et se rouvre quand il tombe
  DJ.salles.forEach((q, s) => {
    if (q.role !== 'garde' && q.role !== 'horloge') return;
    const vivant = beasts.some(b => b.djSalle === s && b.sp.id === 'gardien' && !b.dead);
    if (!vivant) { if (q.fermee) djPortes(q, false); return; }
    if (!q.fermee && djDansSalle(q, P.x, P.y, 1.2) && P.pv > 0) djPortes(q, true);
  });
  // la vapeur : les grilles soufflent par rangées, en vague
  const cx = P.x | 0, cy = P.y | 0;
  for (const gr of DJ.grilles) {
    const on = djVapeurOn(gr);
    if (on && !gr.on && (gr.x - P.x) ** 2 + (gr.y - P.y) ** 2 < 144) { if (Math.random() < .25) SON.jouer('pilon', { vol: .35 }, gr.x, gr.y, DJ_Z0); }
    gr.on = on;
    if (!on) continue;
    if (Math.random() < dt * 3 && (gr.x - P.x) ** 2 + (gr.y - P.y) ** 2 < 400) burst(gr.x + .5, gr.y + .5, DJ_Z0 + .2, 2, '#e8eef4');
    if (gr.x === cx && gr.y === cy && P.z < DJ_Z0 + .6 && P.pv > 0 && porterCoup({ x: P.x, y: P.y, sp: {} }, P, .08)) {
      burst(P.x, P.y, P.z + .5, 10, '#ffffff'); say('la vapeur brûle', 1.2);
    }
  }
  // les plaques : un déclic, puis trois fléchettes du bout du couloir
  for (const pl of DJ.plaques) {
    const sur = Math.abs(P.x - pl.x) < .6 && Math.abs(P.y - pl.y) < .6 && P.z < DJ_Z0 + .4;
    if (sur && t - pl.t > 2.5) { pl.t = t; pl.arme = t + .35; SON.jouer('clic', {}, pl.x, pl.y, DJ_Z0); }
    if (pl.arme && t >= pl.arme) {
      pl.arme = 0;
      for (const sgn of [-1, 1]) {
        const ux = pl.hor ? sgn : 0, uy = pl.hor ? 0 : sgn;
        let d = 1; while (d < 7 && Hgt[((pl.y + uy * d) | 0) * WS + ((pl.x + ux * d) | 0)] === DJ_Z0) d++;
        if (d < 3) continue;
        const ox = pl.x + ux * (d - .6), oy = pl.y + uy * (d - .6), src = { x: ox, y: oy, z: DJ_Z0, sp: { sz: 1, oeil: [255, 140, 60] } };
        for (let k = 0; k < 3; k++) {
          const tz = DJ_Z0 + .45 + (k - 1) * .25, vol = (d - .6) / 18;
          TIRS.push({ x: ox, y: oy, z: tz, vx: -ux * 18, vy: -uy * 18, vz: TIR_G * vol * .5, de: src, deg: .07, age: -k * .08, c: [255, 150, 60] });
        }
        SON.jouer('tir', { vol: .7 }, ox, oy, DJ_Z0 + .5);
      }
    }
  }
}

// ---------- l'action : la trappe, le monte-charge, l'escalier, les coffres ----------
function djAction() {
  if (!djIci()) {
    const tr = DJ.trappe;
    if (tr && (tr.x - P.x) ** 2 + (tr.y - P.y) ** 2 < 1.7 && Math.abs(P.z - tr.z) < 1)
      return { v: 'DESCENDRE', o: 'une trappe, sous les tôles', f: djEntrer };
    return null;
  }
  for (const m of DJ.monte) if ((m.x - P.x) ** 2 + (m.y - P.y) ** 2 < 2.6)
    return { v: 'REMONTER', o: 'monte-charge · le butin est sauvé', f: djRemonter };
  const es = DJ.escalier;
  if (es && (es.x - P.x) ** 2 + (es.y - P.y) ** 2 < 2.2 && P.z < DJ_Z0 - 1.5)
    return { v: 'DESCENDRE', o: 'étage ' + (DJ.e + 1) + ' sur ' + DJ.n, f: djDescendre };
  for (const c of DJ.coffres) if (!c.ouvert && (c.x - P.x) ** 2 + (c.y - P.y) ** 2 < 2.1)
    return { v: 'OUVRIR', o: c.taille === 'grand' ? 'le grand coffre de l\'Horloge' : c.taille === 'garde' ? 'le coffre du gardien' : 'un coffre des Horlogers', f: () => djOuvrir(c) };
  return null;
}
function djEntrer() {
  if (!DJ.trappe) return false;
  const s0 = {}; for (const r of DJ_RES) s0[r] = P.sac[r] || 0;
  DJ.transit = { g: SEED, e: 1, s0, b0: P.baies, o0: Object.keys(P.objets).filter(k => P.objets[k]),
    tr: [DJ.trappe.x, DJ.trappe.y, DJ.trappe.z], ouverts: [], vaincus: [] };
  SON.jouer('clank', { vol: 1 }, P.x, P.y, P.z);
  burst(DJ.trappe.x, DJ.trappe.y, DJ.trappe.z + .3, 16, '#9aa4b8');
  if (!voyagerVers(SEED, null, 'la trappe cède · vous descendez sous les tôles')) { DJ.transit = undefined; return false; }
  return true;
}
// L'onglet Bêta : descendre sous l'île où l'on est, à l'étage voulu, pour essayer. Rien n'en remonte.
function djEssai(etage) {
  if (djIci()) return false;
  if (essai) sortirEssai();                              // le vrai sac d'abord : c'est lui qu'on retrouvera
  const s0 = {}; for (const r of DJ_RES) s0[r] = P.sac[r] || 0;
  const e = Math.max(1, Math.min(djNbEtages(SEED), etage | 0));
  DJ.transit = { g: SEED, e, s0, b0: P.baies, o0: Object.keys(P.objets).filter(k => P.objets[k]),
    tr: [Math.round(P.x * 100) / 100, Math.round(P.y * 100) / 100, Math.round(P.z * 100) / 100], ouverts: [], vaincus: [], test: 1 };
  if (!voyagerVers(SEED, null, 'descente d\'essai · étage ' + e)) { DJ.transit = undefined; return false; }
  return true;
}
// Rendre le sac d'avant la trappe : ce qu'on a gagné en bas disparaît, ce qu'on a dépensé reste dépensé.
function djRendre() {
  const s0 = DJ.etat.s0;
  for (const r of DJ_RES) P.sac[r] = Math.min(P.sac[r] || 0, s0[r] || 0);
  P.baies = Math.min(P.baies, DJ.etat.b0);
  for (const k of Object.keys(P.objets)) if (P.objets[k] && !DJ.etat.o0.includes(k)) {
    delete P.objets[k];
    for (const emp of Object.keys(P.equip)) if (P.equip[emp] === k) P.equip[emp] = null;
    P.raccourcis = P.raccourcis.map(x => x === k ? null : x);
  }
}
function djDescendre() {
  if (!djIci() || DJ.e >= DJ.n) return false;
  DJ.transit = Object.assign(djPhoto(), { e: DJ.e + 1, ouverts: [], vaincus: [] });
  SON.jouer('clank', {}, P.x, P.y, P.z);
  if (!voyagerVers(SEED, null, 'vous descendez · étage ' + (DJ.e + 1) + ' sur ' + DJ.n)) { DJ.transit = undefined; return false; }
  return true;
}
// Le butin du donjon : ce que le sac a gagné depuis la trappe, et les objets trouvés en bas.
function djButin() {
  const s0 = DJ.etat.s0, g = [];
  for (const r of DJ_RES) { const d = (P.sac[r] || 0) - (s0[r] || 0); if (d > 0) g.push('+' + d + ' ' + (RES[r] || r)); }
  const o = Object.keys(P.objets).filter(k => P.objets[k] && !DJ.etat.o0.includes(k)).map(k => (objet(k) || {}).n || k);
  return g.concat(o);
}
function djSurface() { const tr = DJ.etat.tr; return tr ? [tr[0] + 1.2, tr[1] + .4, tr[2]] : null; }
function djRemonter() {
  if (!djIci()) return false;
  if (essai) sortirEssai();                              // le sac d'essai ne compte pas comme butin
  const b = djButin();
  DJ.transit = null;
  if (DJ.etat.test) { djRendre(); DJ.msgSuivant = 'fin de la descente d\'essai · rien n\'est gardé'; }
  else DJ.msgSuivant = b.length ? 'de retour à la surface · butin sauvé : ' + b.join(' · ') : 'de retour à la surface · les mains vides';
  SON.jouer('niveau', {}, P.x, P.y, P.z);
  if (!voyagerVers(SEED, djSurface(), 'le monte-charge vous remonte')) { DJ.transit = undefined; return false; }
  return true;
}
// Terrassé en bas : le sac revient à ce qu'il était à la trappe (ce qu'on a dépensé reste
// dépensé), les objets trouvés sont perdus, et l'on se réveille près de l'entrée.
function djMort() {
  if (!djIci() || DJ.transit !== undefined) return true;
  if (essai) sortirEssai();
  const b = djButin();
  djRendre();
  P.pv = 1; P.endu = 1; P.epuise = false; P.arc = null;
  DJ.transit = null;
  DJ.msgSuivant = 'terrassé sous terre · vous vous réveillez près de la trappe' + (b.length ? ' · perdu : ' + b.join(' · ') : '');
  if (!voyagerVers(SEED, djSurface(), 'tout devient noir…')) DJ.transit = undefined;
  return true;
}
// Un coffre des Horlogers : de la ferraille et des éclats, un peu de tout, et parfois une arme d'en bas.
function djOuvrir(c) {
  if (c.ouvert) return;
  c.ouvert = true; DJ.etat.ouverts.push(c.k); Sauve.sale = true;
  const R = Math.random, e = DJ.e, k = 1 + (e - 1) * .35, tir = (a, b) => Math.round((a + R() * (b - a)) * k);
  const gain = c.taille === 'grand' ? { ferraille: tir(12, 18), eclat: tir(6, 10), os: tir(3, 6), pierre: tir(8, 14) }
    : c.taille === 'garde' ? { ferraille: tir(6, 10), eclat: tir(3, 6), bois: tir(4, 8) }
    : { ferraille: tir(3, 6), eclat: tir(1, 3) };
  if (c.taille === 'petit') { const r = ['bois', 'pierre', 'fibre'][R() * 3 | 0]; gain[r] = (gain[r] || 0) + tir(4, 10); }
  const L = [];
  for (const r in gain) if (gain[r] > 0) { P.sac[r] = (P.sac[r] || 0) + gain[r]; L.push('+' + gain[r] + ' ' + (RES[r] || r)); }
  // les armes d'en bas : le rayon de sentinelle se trouve plus bas, le fusil d'arpenteur presque jamais
  const pas = id => !P.objets[id];
  let arme = null;
  if (c.taille === 'grand') arme = pas('sniper') && R() < .3 ? 'sniper' : pas('laser') && R() < .45 ? 'laser' : null;
  else if (c.taille === 'garde') arme = pas('laser') && R() < .25 ? 'laser' : pas('sniper') && e >= 3 && R() < .06 ? 'sniper' : null;
  else if (e >= 2 && pas('laser') && R() < .05) arme = 'laser';
  if (arme) { P.objets[arme] = 1; if (typeof rangerRaccourci === 'function') rangerRaccourci(arme); L.push(objet(arme).n.toUpperCase()); SON.jouer('rare', {}, c.x, c.y, c.z + .5); }
  SON.jouer('clank', {}, c.x, c.y, c.z); SON.jouer('ramasse', {});
  burst(c.x, c.y, c.z + .6, 18, arme ? '#ffe28a' : '#ffd27d');
  say((arme ? 'une arme d\'en bas · ' : 'coffre ouvert · ') + L.join(' · ') + ' · à remonter pour le garder', 5);
  majSac();
}

// ============================================================
//  LE DÉCOR : trappe, monte-charge, coffres, grilles, plaques, portes, l'Horloge
//  Une liste d'os { a, b, w, h, c, lum } en coordonnées du monde, que les deux rendus posent
//  comme ceux du campement. `lum` : une lumière — elle ne prend pas d'ombre.
// ============================================================
function djDecor(ex, ey, r) {
  const L = [], r2 = (r || 40) ** 2, pres = (x, y) => (x - ex) ** 2 + (y - ey) ** 2 < r2;
  const os = (a, b, w, h, c, lum) => L.push({ a, b, w, h, c, lum: !!lum });
  if (!djIci()) {
    const tr = DJ.trappe; if (!tr || !pres(tr.x, tr.y)) return L;
    const z = tr.z + .02;                                      // une plaque de tôle, un peu plus sombre, et son anneau
    os([tr.x - .62, tr.y, z], [tr.x + .62, tr.y, z], 1.24, .03, [96, 99, 110]);
    os([tr.x - .64, tr.y - .64, z + .01], [tr.x + .64, tr.y - .64, z + .01], .04, .035, [70, 72, 80]);
    os([tr.x - .64, tr.y + .64, z + .01], [tr.x + .64, tr.y + .64, z + .01], .04, .035, [70, 72, 80]);
    os([tr.x + .35, tr.y - .08, z + .03], [tr.x + .35, tr.y + .08, z + .03], .14, .025, [128, 120, 104]);
    return L;
  }
  for (const o of DJ.statique) if (pres(o.a[0], o.a[1])) L.push(o);
  const Z0 = DJ_Z0;
  for (const m of DJ.monte) if (pres(m.x, m.y)) {                // le monte-charge : un plateau, une cage, un feu qui bat
    os([m.x - .8, m.y, Z0 + .04], [m.x + .8, m.y, Z0 + .04], 1.6, .1, [86, 90, 102]);
    for (const [dx, dy] of [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]]) os([m.x + dx, m.y + dy, Z0], [m.x + dx, m.y + dy, Z0 + DJ_MUR], .12, .12, [110, 100, 70]);
    for (const zz of [1.4, 2.8]) { os([m.x - .8, m.y - .8, Z0 + zz], [m.x + .8, m.y - .8, Z0 + zz], .06, .06, [110, 100, 70]); os([m.x - .8, m.y + .8, Z0 + zz], [m.x + .8, m.y + .8, Z0 + zz], .06, .06, [110, 100, 70]); }
    const bat = (t * 2 | 0) % 2;
    os([m.x, m.y - .8, Z0 + DJ_MUR - .1], [m.x, m.y - .8, Z0 + DJ_MUR + .1], .2, .2, bat ? [255, 196, 80] : [120, 90, 40], 1);
    os([m.x + .55, m.y + .55, Z0 + .1], [m.x + .55, m.y + .55, Z0 + .9], .06, .06, [150, 152, 162]);   // le levier
    os([m.x + .55, m.y + .55, Z0 + .9], [m.x + .55, m.y + .55, Z0 + .98], .13, .13, [220, 60, 50], 1);
  }
  const es = DJ.escalier;
  if (es && pres(es.x, es.y)) for (const s of [-1, 1]) os([es.x - 1.5, es.y + s * 1.05, Z0 + .05], [es.x + 1.5, es.y + s * 1.05, Z0 + .05], .08, .08, [140, 255, 200], 1);
  for (const c of DJ.coffres) if (pres(c.x, c.y)) {
    const g = c.taille === 'grand' ? 1.5 : c.taille === 'garde' ? 1.2 : 1, W = .9 * g, D = .6 * g, H = .5 * g;
    const bord = c.taille === 'petit' ? [150, 120, 70] : [230, 190, 90];
    os([c.x - W / 2, c.y, c.z], [c.x + W / 2, c.y, c.z], D, H * 2, [84, 80, 88]);
    os([c.x - W / 2 - .02, c.y, c.z + H * .7], [c.x + W / 2 + .02, c.y, c.z + H * .7], D + .04, .06, bord);
    if (c.ouvert) os([c.x - W / 2, c.y - D / 2, c.z + H], [c.x + W / 2, c.y - D / 2 - .05, c.z + H + D * .9], .06, D * .9, [96, 92, 100]);
    else { os([c.x - W / 2, c.y, c.z + H], [c.x + W / 2, c.y, c.z + H], D, .12, [96, 92, 100]);
      os([c.x, c.y + D / 2 + .02, c.z + H * .8], [c.x, c.y + D / 2 + .04, c.z + H * .8], .12, .14, [255, 190, 80], 1); }
  }
  for (const gr of DJ.grilles) if (pres(gr.x, gr.y)) {
    const on = djVapeurOn(gr), z = Z0 + .02;
    for (let k = 0; k < 4; k++) os([gr.x + .12 + k * .25, gr.y + .08, z], [gr.x + .12 + k * .25, gr.y + .92, z], .08, .04, on ? [255, 140, 60] : [44, 42, 48], on);
  }
  for (const pl of DJ.plaques) if (pres(pl.x, pl.y)) os([pl.x - .35, pl.y, DJ_Z0 + .01], [pl.x + .35, pl.y, DJ_Z0 + .01], .7, .03, t - pl.t < .8 ? [150, 60, 40] : [98, 102, 112]);
  DJ.salles.forEach(q => { if (!q.fermee) return;
    for (const i of q.portes) { const x = i % WS + .5, y = (i / WS | 0) + .5; if (!pres(x, y) || Hgt[i] === DJ_Z0) continue;
      os([x, y, Z0], [x, y, Z0 + DJ_MUR + .02], 1.02, 1.02, [96, 92, 88]);
      for (const zz of [.8, 1.8, 2.8]) os([x, y, Z0 + zz], [x, y, Z0 + zz + .22], 1.05, 1.05, [230, 170, 40], 1); } });
  const H = DJ.horloge;
  if (H && pres(H.x, H.y)) {                                     // la Grande Horloge, au mur : douze marques, deux aiguilles
    const y = H.y + .06, sec = Date.now() / 1000;
    os([H.x, y, H.z], [H.x, y + .08, H.z], H.r * 2.1, H.r * 2.1, [40, 38, 46]);
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832, c = Math.cos(a), s = Math.sin(a);
      os([H.x + c * H.r * .78, y + .1, H.z + s * H.r * .78], [H.x + c * H.r * .95, y + .1, H.z + s * H.r * .95], .12, .12, k % 3 ? [200, 170, 110] : [255, 214, 130], 1); }
    for (const [v, L2, w] of [[sec / 60, .9, .07], [sec / 3600 * 5, .6, .12]]) { const a = Math.PI / 2 - v * 6.2832;
      os([H.x, y + .14, H.z], [H.x + Math.cos(a) * H.r * L2, y + .14, H.z + Math.sin(a) * H.r * L2], w, w, [255, 230, 170], 1); }
    os([H.x, y + .1, H.z], [H.x, y + .2, H.z], .3, .3, [255, 206, 120], 1);
  }
  return L;
}
// Les deux rendus : le canvas passe par emitLimb, WebGL par boite (voir index.html).
function djEmit(view, out) {
  if (!djIci() && !DJ.trappe) return;
  for (const o of djDecor(P.x, P.y, 34)) {
    const cle = view.kEnt && view.kEnt((o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2);
    emitLimb(o.a, o.b, o.w, o.h, o.c, view, out, cle, rangSol(Math.min(o.a[2], o.b[2]), false), o.lum ? 1 : undefined);
  }
  for (const R of djTraits()) {
    const n = Math.max(1, Math.ceil(Math.hypot(R.b[0] - R.a[0], R.b[1] - R.a[1])));
    for (let i = 0; i < n; i++) {
      const f0 = i / n, f1 = (i + 1) / n, at = f => [R.a[0] + (R.b[0] - R.a[0]) * f, R.a[1] + (R.b[1] - R.a[1]) * f, R.a[2] + (R.b[2] - R.a[2]) * f];
      const A = at(f0), B = at(f1);
      emitLimb(A, B, .04 + R.w * .01, .04 + R.w * .01, R.c.map(v => v * 255), view, out, view.kEnt && view.kEnt((A[0] + B[0]) / 2, (A[1] + B[1]) / 2), rangSol((A[2] + B[2]) / 2, false), 1);
    }
  }
}

// ============================================================
//  LES MACHINES D'EN BAS
//  La tourelle murale ne bouge pas : elle balaie, voit, tire. L'araignée de maintenance court en
//  meute, mord, et répare au passage ses voisines. Le gardien de salle, lourd, fond sur qui entre
//  dans sa salle et frappe à deux mains. Aucune ne dort : en bas, il ne fait jamais nuit.
// ============================================================
function djEspeces() {
  const base = { fam: 'automate', diet: 's', peur: 0, herd: 0, cap: 0, mat: 60, bio: [], chasse: [], lien: 0, travail: {}, grimpe: 0, duel: 1, donjon: 1 };
  return [
    Object.assign({}, base, { id: 'tourelle', n: 'Tourelle murale', corps: 'tourelle', sz: .9, spd: 0, vue: 14,
      shell: [96, 102, 116], dark: [50, 54, 64], leg: [42, 44, 52], oeil: [255, 120, 60], garde: 1,
      metier: 'balaie la salle et tire dans l\'axe', tir: { deg: .09, portee: 13, cadence: 1.25, vit: 24, precision: .86, avance: .7 }, dur: 1.2 }),
    Object.assign({}, base, { id: 'araignee', n: 'Araignée de maintenance', corps: 'araignee', sz: .62, spd: 3.5, vue: 12,
      shell: [150, 146, 130], dark: [72, 70, 64], leg: [60, 60, 58], oeil: [140, 255, 160],
      metier: 'répare les machines, et mord qui les abîme', tir: null, dur: .45 }),
    Object.assign({}, base, { id: 'gardien', n: 'Gardien de salle', corps: 'gardien', sz: 1.55, spd: 1.8, vue: 16,
      shell: [120, 96, 84], dark: [58, 46, 42], leg: [52, 44, 40], oeil: [255, 60, 40],
      metier: 'ferme sa salle et frappe à deux mains', tir: null, dur: 3.2, coeur: 3 }),
  ];
}
const DJ_COMBAT = {
  araignee: { deg: .065, ramasse: .22, bond: .16, portee: 1.4, recul: .35, pause: .9 },
  gardien: { deg: .2, ramasse: .55, bond: .3, portee: 2.3, recul: .8, pause: 1.5 },
};
function djMajBete(b, dt) {
  const sp = b.sp;
  b.t += dt; b.age += dt;
  if (b.hit > 0) b.hit -= dt;
  if (b.recul > 0) b.recul -= dt;
  if (b.dead) { b.dead += dt; chute(b, dt); return; }
  b.faim = 0; b.soif = 0; b.nrj = 1;
  if (b.pv <= 0) { mourirBete(b, 'brisé'); return; }
  const dJ = Math.hypot(P.x - b.x, P.y - b.y);
  const vu = P.pv > 0 && dJ < sp.vue && Math.abs(P.z - b.z) < 3 && voitCible(b, P);
  if (vu) { if (!(b.t < (b.alerte || 0))) SON.jouer('vise', { vol: .6 }, b.x, b.y, b.z + .6); b.alerte = b.t + 6; b.derniere = [P.x, P.y]; }
  if (b.hit > .2) { b.alerte = b.t + 6; b.derniere = [P.x, P.y]; }   // frappée, elle sait d'où ça vient
  const chasse = b.t < (b.alerte || 0);
  if (sp.corps === 'tourelle') {
    b.vx = b.vy = 0;
    if (vu) {
      b.dirT = Math.atan2(P.y - b.y, P.x - b.x); b.etat = 'viser';
      const T = sp.tir;
      if (dJ <= T.portee && dJ > 1 && b.t - (b.lastAtk || -9) >= T.cadence && b.t > (b.pret || .8)) tirer(b, P);
    } else { b.etat = chasse ? 'guet' : 'veiller'; b.dirT = b.dir + Math.sin(b.t * .7 + b.ph) * dt * 1.2; }
  } else {
    const C = DJ_COMBAT[sp.corps];
    let tx = b.home[0], ty = b.home[1], vit = 0;
    b.etat = chasse ? 'assaut' : 'garder';
    if (chasse) { const c = vu ? [P.x, P.y] : b.derniere || b.home; tx = c[0]; ty = c[1]; vit = sp.spd; }
    else if (Math.hypot(tx - b.x, ty - b.y) > 1.2) vit = sp.spd * .45;
    else if (sp.corps === 'araignee') {                      // au repos, elle soigne les machines blessées alentour
      const m = beasts.find(o => o !== b && !o.dead && o.sp.donjon && o.pv < 1 && Math.hypot(o.x - b.x, o.y - b.y) < 5);
      if (m) { tx = m.x; ty = m.y; vit = sp.spd * .6; if (Math.hypot(m.x - b.x, m.y - b.y) < 1.2) { vit = 0; m.pv = Math.min(1, m.pv + dt * .06); if (Math.random() < dt * 4) burst(m.x, m.y, m.z + .5, 1, '#8cff9c'); } }
    }
    if (!b.as && vu && dJ < C.portee + .4 && b.t >= (b.pret || 0) && Math.abs(P.z - b.z) < 1.4) lancerAssaut(b, P, C);
    if (b.as) majAssaut(b, dt);
    else if (b.etourdi > 0) { b.etourdi -= dt; const k = Math.max(0, 1 - dt * 3); b.vx *= k; b.vy *= k; }
    else if (vit > 0 && Math.hypot(tx - b.x, ty - b.y) > (chasse ? 1.1 : .5)) pasVersBete(b, tx, ty, vit, dt);
    else { b.vx *= Math.max(0, 1 - dt * 6); b.vy *= Math.max(0, 1 - dt * 6); if (vu) b.dirT = Math.atan2(P.y - b.y, P.x - b.x); }
    const pas = Math.max(1, Math.min(8, Math.ceil(Math.hypot(b.vx, b.vy) * dt / .35)));
    for (let k = 0; k < pas; k++) { const r = pasBete(b, b.x + b.vx * dt / pas, b.y + b.vy * dt / pas, false); if (r === 0) { b.vx *= -.3; b.vy *= -.3; break; } }
    b.x = Math.max(2, Math.min(WS - 3, b.x)); b.y = Math.max(2, Math.min(WS - 3, b.y));
  }
  chute(b, dt);
  b.bob += dt * (Math.hypot(b.vx, b.vy) * 2.2 + .4);
  let dd = b.dirT - b.dir; while (dd > Math.PI) dd -= 6.2832; while (dd < -Math.PI) dd += 6.2832;
  const mxr = (sp.corps === 'tourelle' ? 3 : 6) * dt; b.dir += Math.max(-mxr, Math.min(mxr, dd));
}
// Les corps, en os locaux (x devant, y à gauche, z en haut, mis à l'échelle de l'espèce).
function djOs(f) {
  const sp = f.sp, B = [], add = (a, b, w, h, c) => B.push({ a, b, w, h, c });
  const mort = f.dead ? Math.min(1, f.dead * 2) : 0, oe = mort ? [40, 30, 30] : sp.oeil;
  if (sp.corps === 'tourelle') {
    const rc = Math.max(0, f.recul || 0) / .22;
    add([0, 0, 0], [0, 0, .18], .62, .62, sp.dark);                           // le socle
    add([0, 0, .18], [0, 0, .5 - mort * .2], .26, .26, sp.leg);               // le fût
    add([-.12, 0, .56 - mort * .25], [.2, 0, .6 - mort * .3], .36, .3, sp.shell);   // la tête
    for (const s of [-1, 1]) add([.15 - rc * .08, s * .08, .6 - mort * .3], [.56 - rc * .1, s * .08, .62 - mort * .35], .07, .07, [70, 72, 80]);   // les deux canons
    add([.22, 0, .7 - mort * .3], [.25, 0, .72 - mort * .3], .12, .1, oe);    // l'œil
    add([-.14, 0, .5], [-.3, 0, .46], .1, .18, sp.dark);                      // le câble d'alimentation
    return B;
  }
  if (sp.corps === 'araignee') {
    const bz = .24 - mort * .16, ph = f.bob * 5;
    add([-.18, 0, bz], [.1, 0, bz + .02], .34, .18, sp.shell);                // le corps
    add([.1, 0, bz + .02], [.2, 0, bz], .2, .14, sp.dark);                    // la tête
    add([.2, .05, bz + .03], [.22, .05, bz + .03], .05, .05, oe); add([.2, -.05, bz + .03], [.22, -.05, bz + .03], .05, .05, oe);
    add([-.14, 0, bz + .1], [-.02, 0, bz + .12], .1, .08, [200, 160, 60]);    // la trousse à outils
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
      const x0 = .08 - k * .08, lev = Math.max(0, Math.sin(ph + k * 1.6 + (s > 0 ? 0 : Math.PI))) * .08 * (1 - mort);
      const ge = [x0 + (k - 1.5) * .04, s * .24, bz + .14 + lev - mort * .1], pi = [x0 + (k - 1.5) * .1, s * .42, lev * .6];
      add([x0, s * .08, bz], ge, .035, .035, sp.leg); add(ge, mort ? [ge[0], ge[1] * 1.1, .02] : pi, .03, .03, sp.leg);
    }
    return B;
  }
  // le gardien : le corps des automates, bâti plus large, avec ses épaulières et ses poings de fonte
  const Bs = automateBones(f);
  for (const s of [-1, 1]) {
    add([0, s * .2, .62], [.02, s * .3, .66], .18, .16, sp.dark);
    add([.12, s * .24, .36], [.22, s * .24, .36], .16, .16, [90, 76, 68]);
  }
  add([-.12, 0, .7], [-.12, 0, .86], .06, .06, sp.leg); add([-.12, 0, .86], [-.12, 0, .88], .12, .12, oe);   // l'antenne
  return Bs.concat(B);
}

// ============================================================
//  LES ARMES D'EN BAS
//  Le rayon de sentinelle : un trait bleu, instantané, qui chauffe — six tirs serrés et il faut le
//  laisser refroidir. Le fusil d'arpenteur, l'arme du Tireur d'élite : on épaule (ACTION maintenue),
//  un trait rouge se resserre et se fonce ; on lâche, et le coup part, d'autant plus juste et fort
//  qu'on a visé longtemps. On ne les trouve que dans les coffres du Centre.
// ============================================================
const DJ_FUSILS = {
  laser: { cad: .42, portee: 18, chauffe: .17, deg: .5, c: [120, 214, 255], son: 'laser', trait: .12 },
  sniper: { cad: 2.2, portee: 36, visee: 1.1, deg: 2.2, degMin: .45, c: [255, 64, 50], son: 'tir', trait: .2 },
};
function djEstFusil(id) { return !!id && !!DJ_FUSILS[id]; }
function djObjets() {
  return [
    { id: 'laser', n: 'Rayon de sentinelle', emp: 'arme', deg: .5, port: 0, arc: 1, fusil: 1, offert: 1, donjon: 1, cout: {}, cad: .42,
      d: 'un trait bleu, instantané · chauffe au sixième tir serré · trouvé au Centre des automates' },
    { id: 'sniper', n: 'Fusil d\'arpenteur', emp: 'arme', deg: 2.2, port: 0, arc: 1, fusil: 1, offert: 1, donjon: 1, cout: {}, cad: 2.2,
      d: 'maintenir pour épauler : le trait rouge se resserre · 220 à pleine visée · rarissime' },
  ];
}
// Les poses : à la hanche en garde, épaulé pour tirer ; au coup, la crosse recule dans l'épaule.
const DJ_GARDE_F = { g: [.06, -.09, .34], u: [.55, .75, .3], l: 0, w: 0, s: .02, p: .03, m2: [.17, .03, .39],
  arb: { o: [.06, -.09, .34], u: [.55, .75, .3], k: 0, th: 0, trait: 0 } };
function djEpaule(id, tremble) {
  const o = [.15, -.05, .524], u = [1, 0, .03];
  if (tremble) { o[1] += Math.sin(t * 19) * tremble * .004; o[2] += Math.cos(t * 23) * tremble * .004; }
  return { g: o, u, l: .08, w: -.35, s: .03, p: .07, m2: id === 'sniper' ? [.3, -.04, .51] : [.24, -.04, .506],
    arb: { o: o.slice(), u: u.slice(), k: 1, th: 0, trait: 0 } };
}
function djPoseFusil(J, id, k, r, ts) {
  const garde = () => { const G = JSON.parse(JSON.stringify(DJ_GARDE_F)); G.u = nrm(G.u); G.arb.u = G.u; return G; };
  if (k !== null) {                                          // on épaule (le fusil d'arpenteur)
    const V = djEpaule(id, J === P && P.arc > 3 ? Math.min(1, (P.arc - 3) / 2) : 0);
    return ts < .15 ? melerPose(garde(), V, lisse01(ts / .15)) : V;
  }
  if (r < TIR_FIN) {                                        // le coup vient de partir
    const V = djEpaule(id, 0), fort = id === 'sniper' ? 1 : .35;
    const ru = r < .03 ? r / .03 : Math.max(0, 1 - (r - .03) / (id === 'sniper' ? .3 : .12));
    const dm = v3.add(v3.mul(V.arb.u, -.05 * ru * fort), [0, 0, .02 * ru * fort]);
    V.g = v3.add(V.g, dm); V.m2 = v3.add(V.m2, dm); V.arb.o = v3.add(V.arb.o, dm);
    V.arb.u = nrm(v3.add(V.arb.u, [0, 0, .25 * ru * fort])); V.u = V.arb.u;
    const e = Math.min(1, (t - (J.tir0 ?? t)) / .07);
    const W = e < 1 ? melerPose(garde(), V, lisse01(e)) : V;
    return r > .3 ? melerPose(W, garde(), lisse01((r - .3) / (TIR_FIN - .3))) : W;
  }
  return garde();
}
const DJ_RANGE = (h, n) => ({ arb: { o: v3.add(h, [-.19, -.02, .05]), u: nrm([0, .25, .97]), side: nrm([0, .97, -.25]), k: 0, th: 0, trait: 0 } });
function djGeomFusil(id, F, J, B) {
  const pose = (a, b, w, h, c) => B.push({ a, b, w, h, c });
  const A = F.arb || F, u = nrm(A.u), sd = A.side || nrm(v3.len(v3.cross(u, [0, 0, 1])) > .2 ? v3.cross(u, [0, 0, 1]) : [0, -1, 0]);
  const up = nrm(v3.cross(sd, u)), at = k => v3.add(A.o, v3.mul(u, k)), haut = (p, k) => v3.add(p, v3.mul(up, k));
  if (id === 'laser') {
    const ch = J === P ? DJ.chaleur : 0, g = [120 + 135 * ch, 214 - 80 * ch, 255 - 190 * ch];
    pose(at(-.17), at(-.05), .05, .07, [86, 88, 80]);                        // la crosse
    pose(at(-.05), at(.2), .075, .085, [150, 150, 140]);                    // le corps, en coque de sentinelle
    pose(A.o, v3.add(haut(A.o, -.07), v3.mul(u, -.01)), .03, .03, [86, 88, 80]);   // la poignée
    for (const k of [.2, .245, .29]) pose(at(k - .012), at(k + .012), .085, .085, g);   // les bobines
    pose(at(.2), at(.37), .035, .035, [96, 98, 104]);                       // l'émetteur
    pose(at(.37), at(.39), .05, .05, g);
    pose(haut(at(.0), .06), haut(at(.12), .06), .03, .03, g);               // la cellule d'énergie
    return;
  }
  pose(at(-.2), at(-.04), .045, .075, [34, 32, 34]);                        // le fusil d'arpenteur : la crosse
  pose(at(-.04), at(.16), .055, .065, [74, 70, 68]);                        // le boîtier
  pose(A.o, v3.add(haut(A.o, -.075), v3.mul(u, -.01)), .028, .03, [34, 32, 34]);
  pose(at(.16), at(.6), .024, .024, [60, 58, 58]);                          // le long canon
  pose(at(.58), at(.64), .036, .036, [34, 32, 34]);                         // le frein de bouche
  pose(haut(at(-.01), .055), haut(at(.15), .055), .04, .04, [34, 32, 34]);  // la lunette
  pose(haut(at(.15), .055), haut(at(.16), .055), .032, .032, [255, 44, 40]);
  for (const s of [-1, 1]) pose(v3.add(haut(at(.3), -.02), v3.mul(sd, .012 * s)), v3.add(haut(at(.46), -.03), v3.mul(sd, .012 * s)), .012, .012, [34, 32, 34]);
}
// La bouche du canon, et où l'on vise : en première personne, là où l'on regarde ; sinon la bête
// de la fiche ou celle qui est dans le cône devant soi, au centre de son corps.
function djVisee(portee) {
  const o = [P.x, P.y, P.z + .55];
  if (mode === 'fps') {
    const cp = Math.cos(pitch); const d = [Math.cos(yaw) * cp, Math.sin(yaw) * cp, Math.sin(pitch)];
    return { o: [o[0] + d[0] * .4, o[1] + d[1] * .4, P.z + .6 + d[2] * .4], d, c: null };
  }
  let c = null, dc = 1e9;
  const fc = typeof cibleVue === 'function' ? cibleVue() : null;
  if (fc && fc.sp && !fc.tame && !fc.loin && !fc.dead) {
    const d = Math.hypot(fc.x - P.x, fc.y - P.y); let da = Math.atan2(fc.y - P.y, fc.x - P.x) - P.faceS;
    while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832;
    if (d <= portee && Math.abs(da) < 1.22) { c = fc; dc = d; }
  }
  if (!c) for (const b of beasts) if (!b.dead && b.pv > 0 && !b.tame) {
    const ex = b.x - P.x, ey = b.y - P.y, d = Math.hypot(ex, ey);
    if (d > portee || d > dc) continue;
    let da = Math.atan2(ey, ex) - P.faceS; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832;
    if (Math.abs(da) > .45) continue;
    dc = d; c = b;
  }
  let d;
  if (c) { const q = centreBete(c), dx = q[0] - o[0], dy = q[1] - o[1], dz = q[2] - o[2], n = Math.hypot(dx, dy, dz) || 1; d = [dx / n, dy / n, dz / n]; }
  else d = [Math.cos(P.faceS), Math.sin(P.faceS), 0];
  return { o: [o[0] + d[0] * .45, o[1] + d[1] * .45, o[2] + d[2] * .45], d, c };
}
// Le trait : on avance par pas d'un dixième de case jusqu'au premier obstacle — une bête, un
// joueur d'en face, la roche, un tronc. Rend le point touché et ce qu'on a touché.
function djRayon(o, d, portee, ignorer) {
  const pres = beasts.filter(b => !b.dead && b.pv > 0 && !b.tame && b !== ignorer
    && Math.abs((b.x - o[0]) * d[1] - (b.y - o[1]) * d[0]) < 2.5 && ((b.x - o[0]) * d[0] + (b.y - o[1]) * d[1]) > -1);
  for (let s = .1; s <= portee; s += .1) {
    const x = o[0] + d[0] * s, y = o[1] + d[1] * s, z = o[2] + d[2] * s;
    if (x < 1 || y < 1 || x >= WS - 1 || y >= WS - 1 || z < -2) return { p: [x, y, z], s };
    for (const b of pres) if (toucheBete(b, x, y, z)) return { p: [x, y, z], s, b };
    if (typeof betesLoin !== 'undefined') for (const b of betesLoin) if (b.pv > 0 && toucheBete(b, x, y, z)) return { p: [x, y, z], s, loin: { j: b.loin, b } };
    for (const j of Autres.values()) if (j.pv > 0 && (j.x - x) ** 2 + (j.y - y) ** 2 < .36 && z > j.z - .2 && z < j.z + 1.5) return { p: [x, y, z], s, loin: { j, b: null } };
    if (hAt(x | 0, y | 0) > z) return { p: [x, y, z], s, mur: true };
    const pt = plaT(x | 0, y | 0); if (pt && z <= pt && z >= plaB(x | 0, y | 0)) return { p: [x, y, z], s, mur: true };
    if (s > .5 && floreTouche(x, y, z)) return { p: [x, y, z], s, mur: true };
  }
  return { p: [o[0] + d[0] * portee, o[1] + d[1] * portee, o[2] + d[2] * portee], s: portee };
}
function djTirer(id, q) {
  const F = DJ_FUSILS[id], a = objet(id);
  const V = djVisee(F.portee);
  let d = V.d;
  const ecart = id === 'sniper' ? (1 - q) * .09 : .012;           // la visée resserre le trait
  if (ecart) { const ang = (Math.random() - .5) * 2 * ecart, el = (Math.random() - .5) * ecart;
    const c = Math.cos(ang), s = Math.sin(ang); d = nrm([d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2] + el]); }
  if (V.c) P.face = P.faceS = Math.atan2(V.c.y - P.y, V.c.x - P.x);
  const r = djRayon(V.o, d, F.portee);
  const deg = id === 'sniper' ? F.degMin + (F.deg - F.degMin) * q : F.deg;
  DJ.traits.push({ a: V.o, b: r.p, c: F.c.map(v => v / 255), w: id === 'sniper' ? 2.4 : 3.2, t0: t, dur: F.trait });
  SON.jouer(F.son, { vol: 1 }, P.x, P.y, P.z + .6);
  burst(V.o[0], V.o[1], V.o[2], 5, id === 'sniper' ? '#ffd0a0' : '#bfefff');
  if (r.b) {
    const b = r.b;
    b.pv -= degJoueur(deg, b); b.hit = .25; b.alarm = 1; blesseParJoueur(b); lacherParoi(b);
    b.vx += d[0] * (id === 'sniper' ? 3 : .8); b.vy += d[1] * (id === 'sniper' ? 3 : .8);
    SON.jouer('touche', { arme: 'fleche' }, b.x, b.y, b.z + .4);
    burst(r.p[0], r.p[1], r.p[2], id === 'sniper' ? 16 : 9, id === 'sniper' ? '#ffb0a0' : '#aee8ff');
    if (b.pv <= 0) { mourirBete(b, id === 'sniper' ? 'balle' : 'rayon'); butin(b); }
    else say(b.sp.n + ' · ' + Math.round(b.pv * 100) + '% · ' + (a ? a.n.toLowerCase() : id) + ' ' + Math.round(deg * 100), 1.2);
  } else if (r.loin) frapperLoin(r.loin, deg);
  else if (r.mur) burst(r.p[0], r.p[1], r.p[2], 6, id === 'sniper' ? '#c8b89a' : '#9fdcff');
}
// ACTION enfoncée, ACTION lâchée (le jeu les route ici pour ces deux armes).
function djTirDown(a) {
  const F = DJ_FUSILS[a.id]; if (!F) return;
  if (t - DJ.dernierTir < F.cad) { if (a.id === 'sniper') say('rechargement', .8); return; }
  if (a.id === 'laser') {
    if (t < DJ.surchauffe) { say('surchauffe · le rayon refroidit', 1); return; }
    P.anim = null; P.arc = null; P.tirW0 = poidsGeste(P); P.tir0 = t; P.decoche = t; P.decocheK = 1; P.garde = t + GARDE_T;
    DJ.dernierTir = t; annoncer('decoche', 0, 1);
    djTirer('laser', 1);
    DJ.chaleur += F.chauffe;
    if (DJ.chaleur >= 1) { DJ.surchauffe = t + 2.2; DJ.chaleur = .75; SON.jouer('clank', { vol: .6 }, P.x, P.y, P.z + .6); say('surchauffe', 1.2); }
    return;
  }
  P.anim = null; P.tirW0 = poidsGeste(P); P.tir0 = t; P.arc = 0; P.garde = t + GARDE_T;
  annoncer('bande', 0, a.id);
  SON.jouer('vise', { vol: .5 }, P.x, P.y, P.z + .6);
}
function djTirUp(a) {
  if (a.id !== 'sniper' || P.arc === null) return;
  const q = Math.min(1, P.arc / DJ_FUSILS.sniper.visee); P.arc = null;
  P.decoche = t; P.decocheK = q; P.garde = t + GARDE_T; DJ.dernierTir = t;
  annoncer('decoche', 0, Math.round(q * 100) / 100);
  djTirer('sniper', q);
}
// En visée, le trait rouge du fusil d'arpenteur : le sien, et celui des autres joueurs qui épaulent.
function djMajVisee() {
  DJ.visee = null;
  const a = typeof porte === 'function' ? porte('arme') : null;
  if (a && a.id === 'sniper' && P.arc !== null) {
    const V = djVisee(DJ_FUSILS.sniper.portee), r = djRayon(V.o, V.d, DJ_FUSILS.sniper.portee);
    DJ.visee = { a: V.o, b: r.p, k: Math.min(1, P.arc / DJ_FUSILS.sniper.visee) };
  }
}
function djTraits() {
  const L = DJ.traits.map(R => ({ a: R.a, b: R.b, c: R.c, w: R.w * (1 - (t - R.t0) / R.dur * .6), al: 1 - (t - R.t0) / R.dur }));
  if (DJ.visee) { const k = DJ.visee.k; L.push({ a: DJ.visee.a, b: DJ.visee.b, c: [1, .2 + .1 * k, .16], w: 2.4 - 1.4 * k, al: .35 + .55 * k }); }
  for (const j of Autres.values()) if (j.arme === 'sniper' && j.arcT != null) {
    const f = j.faceS ?? j.face ?? 0, o = [j.x + Math.cos(f) * .45, j.y + Math.sin(f) * .45, j.z + .55];
    const r = djRayon(o, [Math.cos(f), Math.sin(f), 0], 30);
    L.push({ a: o, b: r.p, c: [1, .22, .16], w: 1.6, al: .3 + .5 * j.arcT });
  }
  return L;
}
// Le coup d'un autre joueur : on l'entend, et son trait passe — sans rien blesser ici.
function djTirDistant(j) {
  const F = DJ_FUSILS[j.arme]; if (!F) return false;
  const f = j.faceS ?? j.face ?? 0, o = [j.x + Math.cos(f) * .45, j.y + Math.sin(f) * .45, j.z + .55];
  const r = djRayon(o, [Math.cos(f), Math.sin(f), 0], F.portee);
  DJ.traits.push({ a: o, b: r.p, c: F.c.map(v => v / 255), w: 2.4, t0: t, dur: F.trait });
  SON.jouer(F.son, { vol: .8 }, j.x, j.y, j.z + .6);
  return true;
}
// Le HUD : la chaleur du rayon.
function djHud() {
  const a = typeof porte === 'function' ? porte('arme') : null;
  if (!a || a.id !== 'laser') return '';
  const n = Math.round(Math.min(1, DJ.chaleur) * 6), chaud = t < DJ.surchauffe;
  return ` · CHALEUR <b style="color:${chaud ? '#ff7a5a' : '#8fe3ff'}">${'█'.repeat(n).padEnd(6, '·')}</b>`;
}
// Les vignettes du sac, dessinées comme les autres.
function djDessins(D) {
  D.laser = d => { d.ligne(2, 12, 11, 5, [150, 150, 140], 2); d.ligne(11, 5, 14, 3, [96, 98, 104]); d.disque(9, 7, 1.4, [120, 214, 255]); d.disque(11, 5.5, 1.2, [120, 214, 255]); d.ligne(3, 12, 5, 14, [86, 88, 80], 2); };
  D.sniper = d => { d.ligne(1, 13, 14, 3, [60, 58, 58]); d.ligne(1, 13, 6, 9, [74, 70, 68], 2); d.ligne(5, 8, 9, 5, [34, 32, 34], 2); d.disque(9.5, 4.5, 1, [255, 44, 40]); d.ligne(1, 13, 2, 15, [34, 32, 34], 2); };
}
// Une fois, avant le premier monde : les objets, leurs places sur le dos, leurs vignettes.
function djInit() {
  for (const o of djObjets()) if (!OBJETS.some(x => x.id === o.id)) OBJETS.push(o);
  RANGEES.laser = DJ_RANGE; RANGEES.sniper = DJ_RANGE;
  if (typeof DESSINS === 'object') djDessins(DESSINS);
  // leurs voix : des servos, aigus chez l'araignée, graves chez le gardien
  if (typeof SON === 'object' && SON.VOIX) Object.assign(SON.VOIX, { tourelle: { k: 'machine', f: 1800 }, araignee: { k: 'machine', f: 2600 }, gardien: { k: 'machine', f: 300 } });
}
