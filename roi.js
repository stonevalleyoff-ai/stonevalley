// Stone Valley — LES CERCLES DE CENDRE (roi.js) : le donjon du Roi démon (§163)
// Dès que l'île bascule (brume.js, §162), une BRÈCHE s'ouvre à quelques pas du cercle : une faille rougeoyante
// où l'on descend. Elle reste ouverte tant que l'île est démoniaque, et se referme quand elle a guéri. On peut y
// plonger pour fuir le démon.
// En bas, le moteur du Centre des automates (donjon.js) : des salles et des couloirs taillés dans la roche, la
// même graine pour tous les joueurs de l'île, un canal par étage, et le butin qui n'est à vous qu'une fois
// remonté (par un SOUPIRAIL : une chaîne qui pend du plafond). Terrassé, on se réveille près de la Brèche, sans
// ce qu'on a trouvé. DJ.etat.th vaut 'roi' : donjon.js passe la main à ce fichier pour le plan, le peuplement,
// le décor, les coffres et ce qui bouge à chaque image.
// Quatre cercles, puis le Trône (ROI_ETAGES) ; ROI_OUVERTS dit combien sont ouverts (les autres viendront) :
//  1. LES GALERIES DE CENDRE : basalte, rivières de lave que franchissent des ponts d'obsidienne (ils se
//     fissurent sous les pas, s'effondrent, et la lave se refige en douze secondes), geysers de feu dans les
//     couloirs, braseros. Des nids de larves de braise, tapies sous terre ; des fentes d'où sortent des
//     diablotins. La salle de LA MÈRE DES LARVES se ferme sur qui y entre : elle mord, plonge sous terre et
//     jaillit sous vos pieds (un cercle de braise prévient), pond des larves. Morte, elle descelle son coffre ;
//     l'escalier du cercle suivant et un soupirail sont dans sa salle.
//  2. LES FORGES HURLANTES (§164) : marteaux-pilons, coulées de métal en fusion, chaînes ; forgerons damnés
//     (un bouclier devant : prenez-les de dos), chiens de l'Abîme en meute ; LE BOURREAU, sa chaîne et sa hache.
//  3. LES OSSUAIRES (§165) : catacombes noires où seules la lave et la lanterne éclairent ; âmes en peine (à travers
//     les murs, elles boivent la vie ; la lanterne les repousse), gargouilles (elles ne bougent que quand on leur
//     tourne le dos), dalles qui s'ouvrent sur la lave, plafonds qui s'effondrent ; LE CHŒUR DES DAMNÉS. La
//     POUSSIÈRE D'ÂME, un ingrédient d'alchimie, s'y trouve.
//  4. LES JARDINS DE SOUFRE et 5. LE TRÔNE (§166) : trone.js, comme les RELIQUAIRES (une salle de défi par cercle,
//     trois vagues) et les OBJETS UNIQUES. Chaque cercle a son ingrédient (ROI_INGR).
// LES PACTES (§164) : un autel dans la salle d'arrivée des cercles 2 et suivants en propose trois ; on en prend un,
// jusqu'à la remontée. LA CLÉ D'OS : le gardien mort ouvre le coffre scellé de son cercle. Le FER DAMNÉ, un
// ingrédient d'alchimie, se trouve dans les Forges.
// Le jeu appelle, s'ils existent : roiGenere / roiPeupler (donjon.js, quand DJ.etat.th === 'roi'), roiMaj (à
// chaque image), roiAction / roiActionSurface, roiDecor / roiDecorSurface, roiBreche ; brume.js appelle
// majMere, osMere, roiButin ; index.html : roiIci (le ciel, la musique, le bandeau), ROI_SPEC.

const ROI_ETAGES = 5, ROI_OUVERTS = 5;
const ROI_NOMS = ['', 'les Galeries de cendre', 'les Forges hurlantes', 'les Ossuaires', 'les Jardins de soufre', 'le Trône'];
const ROI_BIO = { mur: 5, salle: 6, couloir: 5 };
const ROI = { breche: null, ponts: [], geysers: [], oeufs: [], fentes: [], sceau: null, feuT: 0, laveT: 0, pontDit: false, accueil: false,
  pilons: [], coulees: [], chaines: [], autel: null, autelOuvert: false, salleGarde: 0, pvOmbre: null,
  dalles: [], dalleDe: new Map(), eboulis: [], ondes: [], choeur: null, lueurs: [],
  reliques: [], gaz: [], cercles: [], fumerolles: [], lianes: [], graines: [], chaudrons: [], piliers: [], colonnes: [], braseros: [], trone: null };
const roiIci = () => typeof djIci === 'function' && djIci() && !!DJ.etat && DJ.etat.th === 'roi';
const ROI_SPEC = [
  { id: 'mere_larves', n: 'Mère des larves', corps: 'mere', brume: 1, roi: 1, gardeSalle: 1, diet: 'c', sz: 2.4, spd: 1.8, vue: 16, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [44, 26, 22], dark: [24, 14, 12], leg: [44, 26, 22], oeil: [255, 196, 90], bio: [], dur: 9, lien: 0, chasse: [], travail: {}, metier: 'garde le premier cercle', grimpe: 0 },
  // les Forges hurlantes (§164)
  { id: 'forgeron', n: 'Forgeron damné', corps: 'forgeron', brume: 1, roi: 1, bouclier: 1, diet: 'c', sz: 1.15, spd: 1.1, vue: 12, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [72, 48, 34], dark: [44, 44, 50], leg: [44, 44, 50], oeil: [255, 120, 40], bio: [], dur: 3.2, lien: 0, chasse: [], travail: {}, metier: 'forge pour le Roi, le bouclier devant', grimpe: 0 },
  { id: 'chien_abime', n: 'Chien de l\'Abîme', corps: 'chien', brume: 1, roi: 1, diet: 'c', sz: .95, spd: 4.2, vue: 18, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [34, 26, 28], dark: [22, 16, 18], leg: [22, 16, 18], oeil: [255, 200, 80], bio: [], dur: 1.2, lien: 0, chasse: [], travail: {}, metier: 'chasse en meute dans les Forges', grimpe: 0 },
  { id: 'bourreau', n: 'Bourreau', corps: 'bourreau', brume: 1, roi: 1, gardeSalle: 1, diet: 'c', sz: 1.9, spd: 1.5, vue: 16, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [112, 104, 100], dark: [24, 20, 24], leg: [24, 20, 24], oeil: [255, 90, 40], bio: [], dur: 11, lien: 0, chasse: [], travail: {}, metier: 'garde le deuxième cercle', grimpe: 0 },
  { id: 'gueule', n: 'Gueule', corps: 'gueule', brume: 1, roi: 1, diet: 'c', sz: .95, spd: 2.8, vue: 12, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [30, 24, 28], dark: [38, 30, 34], leg: [24, 18, 20], oeil: [255, 200, 80], bio: [], dur: 2.2, lien: 0, chasse: [], travail: {}, metier: 'un coffre qui mord', grimpe: 0 },
  // les Ossuaires (§165)
  { id: 'ame_peine', n: 'Âme en peine', corps: 'ame', brume: 1, roi: 1, diet: 'c', sz: 1, spd: 1.7, vue: 11, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [196, 226, 232], dark: [96, 140, 160], leg: [140, 186, 200], oeil: [14, 20, 28], bio: [], dur: 1.3, lien: 0, chasse: [], travail: {}, metier: 'erre à travers les murs, boit la vie', grimpe: 0 },
  { id: 'gargouille', n: 'Gargouille', corps: 'gargouille', brume: 1, roi: 1, statue: 1, diet: 'c', sz: 1.05, spd: 5, vue: 14, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [124, 120, 114], dark: [72, 68, 66], leg: [98, 94, 90], oeil: [255, 110, 40], bio: [], dur: 2.2, lien: 0, chasse: [], travail: {}, metier: 'ne bouge que si on lui tourne le dos', grimpe: 0 },
  { id: 'choeur', n: 'Chœur des damnés', corps: 'choeur', brume: 1, roi: 1, gardeSalle: 1, diet: 'c', sz: 1.6, spd: 3, vue: 18, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [204, 230, 238], dark: [126, 170, 188], leg: [126, 170, 188], oeil: [12, 16, 22], bio: [], dur: 4.5, lien: 0, chasse: [], travail: {}, metier: 'garde le troisième cercle, à trois voix', grimpe: 0 },
  // les Jardins de soufre et le Trône (§166, trone.js)
  { id: 'sorciere', n: 'Sorcière de soufre', corps: 'sorciere', brume: 1, roi: 1, diet: 'c', sz: 1.05, spd: 2.4, vue: 16, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [48, 34, 42], dark: [32, 22, 30], leg: [32, 22, 30], oeil: [255, 226, 80], bio: [], dur: 1.8, lien: 0, chasse: [], travail: {}, metier: 'pose des cercles de feu', grimpe: 0 },
  { id: 'jardinier', n: 'Jardinier', corps: 'jardinier', brume: 1, roi: 1, gardeSalle: 1, diet: 'c', sz: 2.4, spd: 0, vue: 18, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [116, 32, 48], dark: [62, 56, 36], leg: [56, 44, 34], oeil: [255, 226, 90], bio: [], dur: 11, lien: 0, chasse: [], travail: {}, metier: 'garde le quatrième cercle, enraciné', grimpe: 0 },
  { id: 'roi_demon', n: 'Roi démon', corps: 'roi', brume: 1, roi: 1, gardeSalle: 1, diet: 'c', sz: 2.4, spd: 2.4, vue: 24, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [134, 28, 24], dark: [28, 24, 30], leg: [28, 24, 30], oeil: [255, 210, 80], bio: [], dur: 16, lien: 0, chasse: [], travail: {}, metier: 'règne sur les Cercles de cendre', grimpe: 0 },
];

// ============================================================
//  LA BRÈCHE, à la surface de l'île démoniaque
// ============================================================
// Sa place : un replat de trois cases sur trois, sec, sans arbre, à dix ou dix-sept cases du cercle (la graine).
// Elle s'ouvre quand la vague l'a passée.
function roiBreche() {
  if (djIci() || typeof enferIci !== 'function' || !enferIci() || !SANG.cercle) return null;
  if (!ROI.breche || ROI.breche.g !== SEED) {
    const B = ROI.breche = { g: SEED, x: 0, y: 0, z: 0, a: 0, ok: false }, R = djAlea(djHash(SEED ^ 0xb7ec4e)), C = SANG.cercle;
    for (let k = 0; k < 800 && !B.ok; k++) {
      const a = R() * 6.2832, r = 10 + R() * 7 + (k > 500 ? 6 : 0), x = (C.x + Math.cos(a) * r) | 0, y = (C.y + Math.sin(a) * r) | 0, ba = R() * 3.1416;
      if (x < 6 || y < 6 || x > WS - 7 || y > WS - 7) continue;
      const h = hAt(x, y); if (h <= SEA + 1) continue;
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) { const i = (y + dy) * WS + x + dx; if (Hgt[i] !== h || Eau[i] > Hgt[i] || PlT[i] || Flo[i]) { ok = false; break; } }
      if (ok) Object.assign(B, { x: x + .5, y: y + .5, z: h, a: ba, ok: true });
    }
  }
  const B = ROI.breche;
  return B.ok && enferPasse(B.x, B.y) ? B : null;
}
function roiActionSurface() {
  const B = roiBreche(); if (!B) return null;
  if ((B.x - P.x) ** 2 + (B.y - P.y) ** 2 < 3.4 && Math.abs(P.z - B.z) < 1.3) return { v: 'DESCENDRE', o: 'la Brèche · les Cercles de cendre', f: () => roiEntrer(false) };
  return null;
}
// Descendre : la même descente que la trappe des automates (donjon.js), marquée 'roi'. test : depuis ici, rien n'en remonte.
function roiEntrer(test) {
  const B = test ? { x: P.x, y: P.y, z: P.z } : roiBreche(); if (!B || djIci()) return false;
  if (test && essai) sortirEssai();
  const s0 = {}; for (const r of DJ_RES) s0[r] = P.sac[r] || 0;
  DJ.transit = { g: SEED, e: 1, s0, b0: P.baies, o0: Object.keys(P.objets).filter(k => P.objets[k]),
    tr: [B.x, B.y, B.z].map(v => Math.round(v * 100) / 100), ouverts: [], vaincus: [], th: 'roi' };
  if (test) DJ.transit.test = 1;
  SON.jouer('rugDemon', {}, P.x, P.y, P.z); burst(B.x, B.y, B.z + .3, 24, '#ff5a20');
  if (!voyagerVers(SEED, null, 'vous descendez dans la Brèche')) { DJ.transit = undefined; return false; }
  return true;
}
// Une faille en zigzag, noire au bord, de braise au fond ; des éclats de basalte autour.
function roiDecorSurface(ex, ey, r2, os) {
  const B = roiBreche(); if (!B || (B.x - ex) ** 2 + (B.y - ey) ** 2 > r2) return;
  const ca = Math.cos(B.a), sa = Math.sin(B.a), z = B.z + .02, pul = .75 + .25 * Math.sin(t * 2.2);
  const pt = (s, o) => [B.x + ca * s - sa * o, B.y + sa * s + ca * o, z];
  const Z = [[-1.7, 0], [-1.1, .28], [-.45, -.22], [.2, .3], [.8, -.18], [1.4, .2], [1.8, 0]];
  for (let k = 0; k < Z.length - 1; k++) {
    const A = pt(...Z[k]), C = pt(...Z[k + 1]), w = k === 0 || k === Z.length - 2 ? .35 : .7;
    os(A, C, w + .28, .03, [22, 12, 10]);
    os([A[0], A[1], z + .02], [C[0], C[1], z + .02], w, .03, [255 * pul | 0, 90 * pul | 0, 26], 1);
  }
  for (const [s, o, h] of [[-1.3, .7, .35], [.4, -.8, .45], [1.2, .65, .3], [-.3, .9, .25]]) { const A = pt(s, o); os(A, [A[0], A[1], z + h], .35, .3, [34, 26, 26]); }
}

// ============================================================
//  LE PLAN D'UN CERCLE
//  Comme un étage du Centre (donjon.js, djGenere) : des salles, un arbre couvrant et deux boucles de couloirs.
//  Au premier cercle, la salle de la Mère (la plus grande) garde l'escalier ; l'arrivée est la plus loin d'elle.
// ============================================================
function roiGenere() { return DJ.e === 2 ? genForges() : DJ.e === 3 ? genOssuaires() : DJ.e === 4 ? genJardins() : DJ.e === 5 ? genTrone() : genGaleries(); }
function genGaleries() {
  const R = djAlea(djHash(SEED ^ Math.imul(DJ.e, 0x7f4a7c15) ^ 0x401d)), Z0 = DJ_Z0, HM = DJ_Z0 + DJ_MUR, BI = ROI_BIO;
  Hgt.fill(HM); Bio.fill(BI.mur); Eau.fill(0); PlT.fill(0); PlB.fill(0);
  ROI.ponts = []; ROI.pontDit = false;
  ROI.pilons = []; ROI.coulees = []; ROI.chaines = [];
  const salles = roiPlan(R, 17, 15, 'mere', BI), d2 = (a, b) => (salles[a].cx - salles[b].cx) ** 2 + (salles[a].cy - salles[b].cy) ** 2;
  const roles = ['nid', 'fente', 'riviere', 'tresor', 'braseros', 'nid', 'riviere', 'fente', 'braseros', 'tresor'];
  let kr = R() * 4 | 0;
  for (const q of salles) if (!q.role) q.role = roles[kr++ % roles.length];
  { const q = salles.find(o => o.role === 'tresor') || salles.find(o => o.role === 'nid' || o.role === 'fente'); if (q) q.role = 'reliquaire'; }   // (§166)
  // la lave : une rivière de deux cases en travers des salles « rivière », avec un pont d'obsidienne ; des mares ailleurs
  const lave = (x, y) => { const i = y * WS + x; if (Hgt[i] === Z0) { Hgt[i] = Z0 - 1; Eau[i] = Z0; } };
  for (const q of salles) {
    if (q.role === 'riviere') {
      const hor = q.w < q.h, cases = [];
      if (hor) { const y = (q.cy | 0) - 1, xp = q.x + 2 + (R() * (q.w - 5) | 0);
        for (let x = q.x; x < q.x + q.w; x++) for (const dy of [0, 1]) { if (x === xp || x === xp + 1) cases.push((y + dy) * WS + x); else lave(x, y + dy); } }
      else { const x = (q.cx | 0) - 1, yp = q.y + 2 + (R() * (q.h - 5) | 0);
        for (let y = q.y; y < q.y + q.h; y++) for (const dx of [0, 1]) { if (y === yp || y === yp + 1) cases.push(y * WS + x + dx); else lave(x + dx, y); } }
      ROI.ponts.push({ cases, etat: 'ok', t: -99 });
    } else if (q.role === 'braseros') for (let k = 0; k < 2; k++) {
      const x = q.x + 2 + (R() * (q.w - 5) | 0), y = q.y + 2 + (R() * (q.h - 5) | 0);
      if (Math.abs(x - q.cx) < 2 && Math.abs(y - q.cy) < 2) continue;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) lave(x + dx, y + dy);
    }
  }
  // l'escalier du cercle suivant, contre le mur du fond de la salle de la Mère
  const M = salles[0], ex = M.cx | 0, ey = M.y + 2;
  for (let k = 0; k < 3; k++) for (const dx of [0, 1]) { const i = (ey + k) * WS + ex - 1 + dx; Hgt[i] = Z0 - 1 - k; Bio[i] = BI.couloir; }
  DJ.escalier = { x: ex, y: ey + 2, z: Z0 - 3 };
  DJ.salles = salles;
  calcOmbrage();
  return true;
}

// ============================================================
//  LE PEUPLEMENT
// ============================================================
function roiPeupler() {
  const Z0 = DJ_Z0, e = DJ.e, st = DJ.etat, R = djAlea(djHash(SEED ^ Math.imul(e, 0x2c1b3c6d) ^ 0xfe11));
  Flo.fill(0); coupes.clear();
  DJ.plaques = []; DJ.grilles = []; DJ.coffres = []; DJ.monte = []; DJ.statique = []; DJ.horloge = null;
  ROI.geysers = []; ROI.oeufs = []; ROI.fentes = []; ROI.accueil = true; ROI.autel = null; ROI.reliques = []; ROI.trone = null; ROI.jardinier = null;
  const deco = (a, b, w, h, c, lum) => DJ.statique.push({ a, b, w, h, c, lum: !!lum });
  const sec = (x, y) => { const i = (y | 0) * WS + (x | 0); return Hgt[i] === Z0 && !(Eau[i] > Hgt[i]); };
  const blinde = 1 + Math.max(0, profondeur() - 8) * .04 + (e - 1) * .15;
  let nB = 0;
  const bete = (id, x, y, s, init) => {
    const k = nB++;
    if (st.vaincus.includes(k)) return null;
    const sp = specById[id]; if (!sp || !sec(x, y)) return null;
    const b = naitre(sp, x, y); b.variante = null; b.z = Z0; b.pv = 1; b.age = 1e6; b.ech = 1; b.vie = Infinity;
    b.djIdx = k; b.num = 100000 + k; b.djSalle = s; b.home = [x, y]; b.dir = b.dirT = R() * 6.28; b.etat = 'roder'; b.blinde = blinde;
    if (init) init(b);
    beasts.push(b); return b;
  };
  const coffre = (x, y, taille, s) => { const k = DJ.coffres.length; DJ.coffres.push({ k, x, y, z: Z0, taille, salle: s, ouvert: st.ouverts.includes(k) }); };
  const dans = (q, m) => [q.x + m + R() * (q.w - 2 * m), q.y + m + R() * (q.h - 2 * m)];
  const brasero = (x, y) => {                                    // une vasque de basalte, des braises qui luisent
    deco([x, y, Z0], [x, y, Z0 + .55], .28, .28, [40, 32, 30]); deco([x, y, Z0 + .55], [x, y, Z0 + .7], .7, .7, [52, 40, 36]);
    deco([x, y, Z0 + .7], [x, y, Z0 + .82], .5, .5, [255, 120, 40], 1);
  };
  const H = { R, Z0, st, deco, sec, bete, coffre, dans, e, prochain: () => nB };
  if (DJ.e === 2) peuplerForges(H);                        // (§164) les Forges hurlantes
  else if (DJ.e === 3) peuplerOssuaires(H);                // (§165) les Ossuaires
  else if (DJ.e === 4) peuplerJardins(H);                  // (§166) les Jardins de soufre (trone.js)
  else if (DJ.e === 5) peuplerTrone(H);                    // (§166) le Trône
  else {
  DJ.salles.forEach((q, s) => {
    // des torches de braise le long des murs, toutes les six cases
    const zT = Z0 + 2.2, c = q.role === 'mere' ? [255, 70, 40] : [255, 140, 60];
    for (let x = q.x + 2; x < q.x + q.w - 1; x += 6) {
      if (Hgt[(q.y - 1) * WS + x] > Z0) deco([x, q.y + .08, zT], [x, q.y + .08, zT + .35], .12, .12, c, 1);
      if (Hgt[(q.y + q.h) * WS + x] > Z0) deco([x, q.y + q.h - .08, zT], [x, q.y + q.h - .08, zT + .35], .12, .12, c, 1);
    }
    for (let y = q.y + 2; y < q.y + q.h - 1; y += 6) {
      if (Hgt[y * WS + q.x - 1] > Z0) deco([q.x + .08, y, zT], [q.x + .08, y, zT + .35], .12, .12, c, 1);
      if (Hgt[y * WS + q.x + q.w] > Z0) deco([q.x + q.w - .08, y, zT], [q.x + q.w - .08, y, zT + .35], .12, .12, c, 1);
    }
    const cx = q.cx, cy = q.cy;
    if (q.role === 'arrivee') DJ.monte.push({ x: q.x + 1.6, y: q.y + 1.6, z: Z0 });
    else if (q.role === 'mere') {
      bete('mere_larves', cx, cy + 1, s, b => { b.dir = b.dirT = -Math.PI / 2; b.etat = 'repos'; });
      coffre(q.x + q.w - 2.2, q.y + 2, 'garde', s);
      DJ.monte.push({ x: q.x + 1.6, y: q.y + q.h - 1.6, z: Z0 });
      brasero(q.x + 2, q.y + 2); brasero(q.x + q.w - 2, q.y + q.h - 2);
      for (let k = 0; k < 7; k++) { const [x, y] = dans(q, 1.5); if (Math.hypot(x - cx, y - cy) > 3) ROI.oeufs.push({ x, y, r: .16 + R() * .12, ph: R() * 6.28 }); }
      ROI.sceau = { x: DJ.escalier.x, y: DJ.escalier.y - 1 };
    } else if (q.role === 'nid') {
      for (let k = 0; k < 6; k++) { const [x, y] = dans(q, 1.5); ROI.oeufs.push({ x, y, r: .13 + R() * .12, ph: R() * 6.28 }); }
      for (let k = 0; k < 2 + (q.w * q.h > 130 ? 1 : 0); k++) { const [x, y] = dans(q, 2); bete('larve_braise', x, y, s, b => { b.etat = 'sous'; b.cache = true; }); }
    } else if (q.role === 'fente') {
      const hor = q.w > q.h, L = (hor ? q.w : q.h) - 4, n = 6;
      const P0 = []; for (let k = 0; k <= n; k++) { const u = k / n; P0.push(hor ? [q.x + 2 + u * L, cy + (k % 2 ? .5 : -.5) * (R() + .3)] : [cx + (k % 2 ? .5 : -.5) * (R() + .3), q.y + 2 + u * L]); }
      ROI.fentes.push(P0);
      for (let k = 0; k < 2 + (R() < .5 ? 1 : 0); k++) { const p = P0[1 + (R() * (n - 1) | 0)]; bete('diablotin', p[0] + (R() - .5) * 2, p[1] + (R() - .5) * 2, s); }
    } else if (q.role === 'riviere') {
      const p = ROI.ponts.find(o => o.cases.some(i => djDansSalle(q, i % WS, i / WS | 0)));
      const [x, y] = [q.x + 1.6 + R() * (q.w - 3.2), q.y + 1.6 + R() * (q.h - 3.2)];
      if (sec(x, y)) coffre(x, y, 'petit', s); else coffre(q.x + 1.6, q.y + 1.6, 'petit', s);
      if (R() < .6) { const [a, b] = dans(q, 2); bete('diablotin', a, b, s); }
      if (p) for (const i of p.cases) Bio[i] = ROI_BIO.couloir;
    } else if (q.role === 'tresor') {
      coffre(cx, q.y + 1.8, 'petit', s); if (q.w * q.h > 110) coffre(q.x + q.w - 2, cy, 'petit', s);
      const [x, y] = dans(q, 2); bete('larve_braise', x, y, s, b => { b.etat = 'sous'; b.cache = true; });
    } else if (q.role === 'braseros') {
      for (const [x, y] of [[q.x + 1.5, q.y + 1.5], [q.x + q.w - 1.5, q.y + 1.5], [q.x + 1.5, q.y + q.h - 1.5], [q.x + q.w - 1.5, q.y + q.h - 1.5]]) brasero(x, y);
      if (R() < .5) { const [x, y] = dans(q, 2); bete('diablotin', x, y, s); }
    } else if (q.role === 'reliquaire') peuplerReliquaire(H, q, s);   // (§166)
  });
  // les couloirs : des geysers de feu là où ils filent droit entre deux murs
  const couloir = (x, y) => Bio[y * WS + x] === ROI_BIO.couloir && Hgt[y * WS + x] === Z0 && !djSalleDe(x, y);
  const droits = [];
  for (let y = 3; y < WS - 3; y++) for (let x = 3; x < WS - 3; x++) {
    if (!couloir(x, y)) continue;
    if (couloir(x, y + 1) && Hgt[(y - 1) * WS + x] > Z0 && Hgt[(y + 2) * WS + x] > Z0 && couloir(x - 1, y) && couloir(x + 1, y)) droits.push([x, y, 1]);
    else if (couloir(x + 1, y) && Hgt[y * WS + x - 1] > Z0 && Hgt[y * WS + x + 2] > Z0 && couloir(x, y - 1) && couloir(x, y + 1)) droits.push([x, y, 0]);
  }
  for (let k = 0, n = 0; k < 400 && n < 2 + e && droits.length; k++) {
    const [x, y, hor] = droits[R() * droits.length | 0];
    if (ROI.geysers.some(g => Math.hypot(g.x - x, g.y - y) < 10) || DJ.monte.some(m => Math.hypot(m.x - x, m.y - y) < 8)) continue;
    for (const d of [0, 1]) ROI.geysers.push({ x: x + (hor ? 0 : d) + .5, y: y + (hor ? d : 0) + .5, ph: n * 1.3 });
    n++;
  }
  // (§164) le coffre scellé du cercle : la clé d'os de la Mère l'ouvre
  { const i = DJ.salles.findIndex(q => q.role === 'tresor') >= 0 ? DJ.salles.findIndex(q => q.role === 'tresor') : DJ.salles.findIndex(q => q.role !== 'arrivee' && q.role !== 'mere');
    if (i >= 0) { const q = DJ.salles[i]; coffre(q.x + 1.8, q.y + q.h - 1.8, 'scelle', i); } }
  }
  const m = DJ.monte[0] || { x: DJ.salles[0].cx, y: DJ.salles[0].cy };
  P.x = m.x + 1.4; P.y = m.y + 1.4; P.z = Z0; P.vx = P.vy = P.vz = 0; P.spawn = [P.x, P.y, P.z]; P.sol = [P.x, P.y, P.z]; P.ground = true;
  camX = P.x; camY = P.y; camZ = P.z;
}
const djSalleDe = (x, y) => DJ.salles.some(q => djDansSalle(q, x, y));

// ============================================================
//  À CHAQUE IMAGE : les ponts, les geysers, la lave, les braises ; à la surface, la Brèche
// ============================================================
function roiMaj(dt) {
  if (typeof roiMajArmes === 'function') roiMajArmes(dt);    // (§166) la lame de soufre, le fouet : partout
  if (!djIci()) {                                              // la Brèche fume
    const B = roiBreche();
    if (B && (B.x - P.x) ** 2 + (B.y - P.y) ** 2 < 1600 && Math.random() < dt * 14) {
      const s = (Math.random() - .5) * 3.2, x = B.x + Math.cos(B.a) * s, y = B.y + Math.sin(B.a) * s;
      parts.push({ x, y, z: B.z + .05, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: 1 + Math.random() * 1.6, g: -.3, life: 1.6, age: 0, col: Math.random() < .5 ? '#ff6a20' : '#ffb040', luit: 1, tl: .07 });
    }
    if (B && !ROI.vuB && (B.x - P.x) ** 2 + (B.y - P.y) ** 2 < 400) { ROI.vuB = true; say('une brèche s\'est ouverte dans le sol · on peut y descendre', 3.5); }
    return;
  }
  if (!roiIci()) return;
  const Z0 = DJ_Z0;
  if (ROI.accueil && t > .3) { ROI.accueil = false;
    say(DJ.msg || ('Cercles de cendre · ' + ROI_NOMS[DJ.e] + (DJ.e === ROI_ETAGES ? '' : ' · cercle ' + DJ.e + ' sur ' + (ROI_ETAGES - 1))
      + (DJ.etat.test ? ' · descente d\'essai : rien n\'en remonte' : ' · le soupirail remonte le butin')), 5.5); DJ.msg = null; }
  const J = djJoueurs();
  majPactes(dt);                                               // (§164)
  if (DJ.e === 2) majForges(dt, J); else if (DJ.e === 3) majOssuaires(dt, J);   // (§165)
  else if (DJ.e === 4) majJardins(dt, J); else if (DJ.e === 5) majTrone(dt, J);   // (§166)
  majReliques(dt, J);
  if (ROI.autelOuvert && ROI.autel && (ROI.autel.x - P.x) ** 2 + (ROI.autel.y - P.y) ** 2 > 12) fermerAutel();
  const sur = (Q, i) => (Q.x | 0) === i % WS && (Q.y | 0) === (i / WS | 0) && Q.z < Z0 + .6;
  // les ponts d'obsidienne : fissurés sous les pas, effondrés une seconde et demie plus tard, refigés après douze
  for (const p of ROI.ponts) {
    if (p.etat === 'ok' && J.some(Q => p.cases.some(i => sur(Q, i)))) {
      p.etat = 'fissure'; p.t = t; SON.jouer('clic', { vol: 1 }, P.x, P.y, Z0);
      if (!ROI.pontDit) { ROI.pontDit = true; say('le pont d\'obsidienne se fissure sous vos pas', 2.2); }
    } else if (p.etat === 'fissure' && t - p.t > 1.5) {
      p.etat = 'tombe'; p.t = t;
      for (const i of p.cases) { Hgt[i] = Z0 - 1; Eau[i] = Z0; signalDecor('dalle', i); }
      const i0 = p.cases[0]; SON.jouer('impact', {}, i0 % WS, i0 / WS | 0, Z0);
      for (const i of p.cases) burst(i % WS + .5, (i / WS | 0) + .5, Z0, 6, '#ff7a20');
    } else if (p.etat === 'tombe' && t - p.t > 12 && !J.some(Q => p.cases.some(i => (Q.x | 0) === i % WS && (Q.y | 0) === (i / WS | 0)))) {
      p.etat = 'ok';
      for (const i of p.cases) { Hgt[i] = Z0; Eau[i] = 0; signalDecor('dalle', i); burst(i % WS + .5, (i / WS | 0) + .5, Z0 + .1, 4, '#4a4048'); }
    }
  }
  // les geysers : ils grondent (des braises montent), puis crachent une seconde ; la même cadence pour tous
  const h = typeof horlogeLaser === 'function' ? horlogeLaser() : t;
  for (const g of ROI.geysers) {
    const cy = g.grand ? 5.2 : 3.6, wa = g.grand ? 1.4 : .8, fe0 = g.grand ? 1.5 : 1, c = ((h + g.ph) % cy + cy) % cy, st = c < wa ? 'gronde' : c < wa + fe0 ? 'feu' : 'calme', pres = (g.x - P.x) ** 2 + (g.y - P.y) ** 2 < 400;
    if (st === 'feu' && g.st !== 'feu' && pres) SON.jouer('pilon', { vol: .5 }, g.x, g.y, Z0);
    g.st = st;
    if (st === 'gronde' && pres && Math.random() < dt * 8) parts.push({ x: g.x + (Math.random() - .5) * .6, y: g.y + (Math.random() - .5) * .6, z: Z0 + .05, vx: 0, vy: 0, vz: .6 + Math.random(), g: -.2, life: .7, age: 0, col: '#ff7a20', luit: 1, tl: .06 });
    if (st !== 'feu') continue;
    if (pres && Math.random() < dt * 30) parts.push({ x: g.x + (Math.random() - .5) * .5, y: g.y + (Math.random() - .5) * .5, z: Z0 + Math.random() * 1.5, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: 2.5 + Math.random() * 2, g: -.5, life: .5, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .1 });
    if (Math.abs(P.x - g.x) < (g.grand ? 1.05 : .75) && Math.abs(P.y - g.y) < (g.grand ? 1.05 : .75) && P.z < Z0 + (g.grand ? 3 : 1.6) && P.pv > 0 && t > ROI.feuT) {
      ROI.feuT = t + .8;
      if (porterCoup({ x: g.x, y: g.y, z: Z0, sp: {} }, P, .09 * (pacte('braise') ? 2 : 1))) { P.brulure = Math.max(P.brulure || 0, t + 1.5); say('le feu jaillit du sol', 1.2); }
    }
  }
  // la lave
  const i = (P.y | 0) * WS + (P.x | 0);
  if (Eau[i] > Hgt[i] && P.z < Eau[i] - .05 && P.pv > 0 && !(typeof effet === 'function' && effet('braise'))) {
    P.pv = Math.max(0, P.pv - BRULURE * 2.5 * dt * vieK() * (pacte('braise') ? 2 : 1)); P.dernierCoup = t;   // (§164) le pacte de Braise : deux fois plus
    if (t - ROI.laveT > 2.5) { ROI.laveT = t; say('la lave brûle', 1.4); }
    if (Math.random() < dt * 10) burst(P.x, P.y, P.z + .3, 1, '#ffa04c');
    if (P.pv <= 0) terrasse();
  }
  // des braises dans l'air ; la lave bouillonne
  if (DJ.e !== 3 && Math.random() < dt * 5) { const x = P.x + (Math.random() - .5) * 16, y = P.y + (Math.random() - .5) * 16; parts.push({ x, y, z: Z0 + .2, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .5 + Math.random() * .8, g: -.1, life: 2.2, age: 0, col: Math.random() < .5 ? '#ff7a20' : '#ffb040', luit: 1, tl: .045 }); }
  for (let k = 0; k < 3; k++) {
    const x = P.x + (Math.random() - .5) * 24, y = P.y + (Math.random() - .5) * 24, j = (y | 0) * WS + (x | 0);
    if (j < 0 || j >= WS * WS || !(Eau[j] > Hgt[j]) || Math.random() > dt * 8) continue;
    for (let q = 0; q < 3; q++) parts.push({ x, y, z: Eau[j] + .02, vx: (Math.random() - .5) * .8, vy: (Math.random() - .5) * .8, vz: 1 + Math.random() * 1.4, g: 5, life: .5, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .07 });
  }
}

// ---------- l'action : le soupirail, l'escalier, les coffres ----------
const deG = n => /^le /.test(n) ? 'du ' + n.slice(3) : 'de ' + n;   // « du Bourreau », « de la Mère des larves »
const roiGardeVivante = s => beasts.some(b => b.djSalle === s && b.sp.gardeSalle && !b.dead);
function roiAction() {
  for (const m of DJ.monte) if ((m.x - P.x) ** 2 + (m.y - P.y) ** 2 < 2.6)
    return { v: 'REMONTER', o: 'le soupirail · la chaîne remonte le butin', f: djRemonter };
  const A = ROI.autel;                                          // (§164) l'autel des pactes
  if (A && (A.x - P.x) ** 2 + (A.y - P.y) ** 2 < 3.2)
    return (DJ.etat.autels || []).includes(DJ.e) ? { v: 'AUTEL', o: 'éteint · le pacte est pris', f: () => say('l\'autel est éteint · un pacte par cercle', 1.8), vide: true }
      : { v: 'PACTE', o: 'l\'autel de basalte · trois pactes', f: ouvrirAutel };
  const gv = beasts.some(b => b.sp.gardeSalle && !b.dead), nomG = ROI_GARDE[DJ.e];
  const es = DJ.escalier;
  if (es && (es.x - P.x) ** 2 + (es.y - P.y) ** 2 < 4 && P.z < DJ_Z0 - .5)
    return DJ.e >= ROI_OUVERTS ? { v: 'SCELLÉ', o: 'un sceau de feu ferme l\'escalier', f: () => say('un sceau de feu ferme l\'escalier · ' + ROI_NOMS[DJ.e + 1] + ' ne s\'ouvrent pas encore', 3) }
      : gv ? { v: 'SCELLÉ', o: 'tant que vit ' + nomG, f: () => say('l\'escalier ne s\'ouvre pas tant que vit ' + nomG, 2.4) }
      : { v: 'DESCENDRE', o: ROI_NOMS[DJ.e + 1] + ' · cercle ' + (DJ.e + 1), f: djDescendre };
  for (const c of DJ.coffres) if (!c.ouvert && !c.gueule && (c.x - P.x) ** 2 + (c.y - P.y) ** 2 < 2.1) {
    if (c.taille === 'reliquaire') { const ok = (DJ.etat.defis || []).includes(DJ.e);   // (§166)
      return { v: 'OUVRIR', o: ok ? 'le reliquaire' : 'un reliquaire scellé · il ne cède qu\'après trois vagues', f: () => ok ? ouvrirReliquaire(c) : say('scellé · il faut tenir les trois vagues de la salle', 2.4) }; }
    const sc = (c.taille === 'garde' && roiGardeVivante(c.salle)) || (c.taille === 'scelle' && gv);
    const nom = c.taille === 'scelle' ? (sc ? 'un coffre scellé · la clé d\'os ' + deG(nomG) + ' l\'ouvre' : 'le coffre scellé · la clé d\'os')
      : c.taille === 'garde' ? (sc ? 'un coffre scellé · tant que vit ' + nomG : 'le coffre ' + deG(nomG)) : DJ.e === 2 ? 'un coffre de fer' : DJ.e === 3 ? 'un coffre d\'ossuaire' : DJ.e === 4 ? 'un coffre de soufre' : 'un coffre de cendre';
    return { v: 'OUVRIR', o: nom,
      f: () => sc ? say(c.taille === 'scelle' ? 'scellé · il faut la clé d\'os ' + deG(nomG) : 'scellé · les chaînes ne cèdent pas tant que vit ' + nomG, 2.4) : roiOuvrir(c) };
  }
  { const tr = typeof donsTroneAction === 'function' && donsTroneAction(); if (tr) return tr; }   // (§208) le trône : la formule du Titan
  return null;
}
// Un coffre de cendre : des éclats, des os, de la pierre ; celui de la Mère, bien plus, et parfois un tome.
function roiOuvrir(c, force) {
  if (c.ouvert || (c.gueule && !force)) return;
  if (c.taille === 'reliquaire') return ouvrirReliquaire(c);   // (§166)
  // (§164) un coffre sur dix a des dents (un sur quatre sous le pacte d'Avarice) ; la même graine pour tous
  if (!force && c.taille === 'petit' && djHash(SEED ^ Math.imul(DJ.e, 0x51ed27) ^ Math.imul(c.k + 1, 0x9e3779b1)) % 100 < (pacte('avarice') ? 25 : 10)) { roiGueule(c); return; }
  c.ouvert = true; DJ.etat.ouverts.push(c.k); Sauve.sale = true;
  const R = Math.random, k = (1 + (DJ.e - 1) * .35) * (pacte('avarice') ? 2 : 1) * (c.double ? 2 : 1), tir = (a, b) => Math.round((a + R() * (b - a)) * k);
  const gain = c.taille === 'garde' ? { eclat: tir(10, 16), os: tir(6, 10), ferraille: tir(3, 6), pierre: tir(6, 10) }
    : c.taille === 'scelle' ? { eclat: tir(8, 12), os: tir(4, 7), ferraille: tir(5, 9) } : { eclat: tir(2, 5), os: tir(2, 4) };
  if (c.taille === 'petit') { const r = DJ.e === 2 ? ['ferraille', 'pierre', 'os'][R() * 3 | 0] : DJ.e === 3 ? ['os', 'pierre', 'eclat'][R() * 3 | 0] : DJ.e === 4 ? ['fibre', 'pierre', 'eclat'][R() * 3 | 0] : ['pierre', 'bois', 'fibre'][R() * 3 | 0]; gain[r] = (gain[r] || 0) + tir(4, 8); }
  const L = [];
  for (const r in gain) if (gain[r] > 0) { P.sac[r] = (P.sac[r] || 0) + gain[r]; L.push('+' + gain[r] + ' ' + (RES[r] || r)); }
  if (ROI_INGR[DJ.e]) { const n = c.taille === 'garde' ? 3 : c.taille === 'scelle' ? 2 : R() < .25 ? 1 : 0; const s2 = roiDonnerIngr(ROI_INGR[DJ.e], n); if (s2) L.push(s2); }   // (§164) le fer damné, (§165) la poussière d'âme
  if (DJ.e === 5 && c.taille === 'garde') for (const id of ['oeufbraise', 'ferdamne', 'poussame', 'fleursoufre']) { const s2 = roiDonnerIngr(id, 2); if (s2) L.push(s2); }   // (§166) le trésor du Roi
  const tome = c.taille === 'garde' && typeof tomeCoffre === 'function' ? tomeCoffre('garde') : '';
  if (tome) { L.push(tome.toUpperCase()); SON.jouer('rare', {}, c.x, c.y, c.z + .5); }
  const plan = typeof forgePlanCoffre === 'function' ? forgePlanCoffre(c.taille, 'cercles') : '';   // (§172) un plan de forge
  if (plan) { L.push(plan.toUpperCase() + ' (APPRIS)'); if (!tome) SON.jouer('rare', {}, c.x, c.y, c.z + .5); }
  const arc = typeof arcaneCoffre === 'function' ? arcaneCoffre(c.taille, 'cercles') : '';   // (§182) un tome d'arcane, gardé même à la mort
  if (arc) { L.push(arc.toUpperCase() + ' (GARDÉ)'); SON.jouer('rare', {}, c.x, c.y, c.z + .5); }
  SON.jouer('clank', {}, c.x, c.y, c.z); SON.jouer('ramasse', {});
  burst(c.x, c.y, c.z + .6, 18, tome ? '#c9a2ec' : '#ff9a40');
  say((c.taille === 'garde' ? 'le coffre ' + deG(ROI_GARDE[DJ.e]) + ' · ' : c.taille === 'scelle' ? 'le coffre scellé · ' : c.double ? 'la gueule rend son butin, doublé · ' : DJ.e === 2 ? 'coffre de fer · ' : DJ.e === 3 ? 'coffre d\'ossuaire · ' : 'coffre de cendre · ') + L.join(' · ') + ' · à remonter pour le garder', 5);
  majSac();
}
function roiButin(b) {
  if (b.sp.corps === 'bourreau') {                              // (§164)
    P.sac.eclat += 30; P.sac.os = (P.sac.os || 0) + 10; const ing = roiDonnerIngr('ferdamne', 2);
    say('Le Bourreau s\'effondre · +30 éclats · +10 os' + (ing ? ' · ' + ing : '') + ' · sa clé d\'os ouvre le coffre scellé, son coffre se descelle', 5.5);
    SON.jouer('niveau', {}, b.x, b.y, b.z); majSac(); return;
  }
  if (b.sp.corps === 'gueule') { const c = b.coffre; if (c) { c.gueule = null; c.double = true; roiOuvrir(c, true); } return; }
  if (b.sp.corps === 'forgeron') { const f = 1 + (Math.random() * 3 | 0); P.sac.ferraille = (P.sac.ferraille || 0) + f; const ing = Math.random() < .3 ? roiDonnerIngr('ferdamne', 1) : '';
    say('+' + f + ' ferraille' + (ing ? ' · ' + ing : ''), 1.8); majSac(); return; }
  if (b.sp.corps === 'chien') { P.sac.os = (P.sac.os || 0) + 1; majSac(); return; }
  if (b.sp.corps === 'ame') { P.sac.eclat += 1; const ing = Math.random() < .3 ? roiDonnerIngr('poussame', 1) : ''; burst(b.x, b.y, b.z + 1.1, 16, '#cfeff8');   // (§165)
    say('l\'âme se défait · +1 éclat' + (ing ? ' · ' + ing : ''), 1.8); majSac(); return; }
  if (b.sp.corps === 'gargouille') { const p = 2 + (Math.random() * 3 | 0), e2 = Math.random() < .2 ? 2 : 0; P.sac.pierre = (P.sac.pierre || 0) + p; P.sac.eclat += e2;
    burst(b.x, b.y, b.z + .6, 14, '#9a948c'); say('la gargouille s\'effrite · +' + p + ' pierre' + (e2 ? ' · +2 éclats' : ''), 1.8); majSac(); return; }
  if (b.sp.corps === 'choeur') { burst(b.x, b.y, b.z + 1.6, 24, VOIX[b.voix || 0].hex); return; }   // le Chœur tombé tout entier : majChoeurSalle
  if (b.sp.corps === 'sorciere' || b.sp.corps === 'jardinier' || b.sp.corps === 'roi') return roiButinBas(b);   // (§166, trone.js)
  if (b.sp.corps === 'mere') {
    P.sac.eclat += 25; P.sac.os = (P.sac.os || 0) + 8; const ing = roiDonnerIngr('oeufbraise', 2);
    say('La Mère des larves s\'effondre · +25 éclats · +8 os' + (ing ? ' · ' + ing : '') + ' · sa clé d\'os ouvre le coffre scellé, son coffre se descelle', 4.5); SON.jouer('niveau', {}, b.x, b.y, b.z); majSac();
  }
}

// ============================================================
//  LA MÈRE DES LARVES
//  Une larve de quatre mètres, l'abdomen gonflé d'œufs qui luisent. Elle dort jusqu'à ce qu'on entre ; la
//  salle se ferme. Elle rampe vers vous et MORD (elle se cabre une demi-seconde avant : reculez) ; toutes les
//  dix secondes environ elle PLONGE, file sous terre (le sol tremble), et un cercle de braise marque où elle va
//  JAILLIR : sortez-en, elle frappe tout ce qui s'y trouve. Toutes les quatorze secondes, elle POND deux larves
//  (quatre au plus). Sous terre, on ne la touche pas.
// ============================================================
function majMere(b, dt) {
  const q = DJ.salles && DJ.salles[b.djSalle];
  let J = null, dJ = 1e9;
  for (const Q of djJoueurs()) if (!q || djDansSalle(q, Q.x, Q.y, .3)) { const d = Math.hypot(Q.x - b.x, Q.y - b.y); if (d < dJ) { dJ = d; J = Q; } }
  if (b.act) return actionMere(b, dt, J);
  b.cache = false;
  if (!J) { b.vit = 0; b.etat = 'repos'; return; }
  if (!b.eveil) { b.eveil = true; b.plongeT = t + 8; b.ponteT = t + 5; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 1); say('La Mère des larves s\'éveille', 3); }
  b.dirT = Math.atan2(J.y - b.y, J.x - b.x); tournerBrume(b, dt, 1.8);
  const nL = beasts.filter(o => o.sp.corps === 'larve' && !o.dead && o.djSalle === b.djSalle).length;
  if (t > b.plongeT) return agirBrume(b, 'plonger', J);
  if (t > b.ponteT && nL < 4) return agirBrume(b, 'pondre', J);
  if (dJ < 3.8 && t > (b.mordT || 0)) return agirBrume(b, 'mordre', J);
  b.etat = 'ramper'; pasBrume(b, J.x, J.y, 1.8, dt, 1);
}
function actionMere(b, dt, J) {
  const u = t - b.actT, q = DJ.salles && DJ.salles[b.djSalle]; b.vit = 0;
  if (b.act === 'mordre') {
    if (u < .7) { b.etat = 'cabrer'; if (J) { b.dirT = Math.atan2(J.y - b.y, J.x - b.x); tournerBrume(b, dt, 3); } return; }
    b.etat = 'mordre';
    if (!b.fait) {
      b.fait = true; SON.jouer('lacere', {}, b.x, b.y, b.z + 1);
      for (const Q of djJoueurs()) {
        const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1;
        if (d < 4 && (dx * Math.cos(b.dir) + dy * Math.sin(b.dir)) / d > .45) { coupBrume(b, Q, .15, [dx / d * 6, dy / d * 6, 2]); if (Q === P) P.brulure = Math.max(P.brulure || 0, t + 2.5); }
      }
    }
    if (u > 1.3) { b.act = null; b.mordT = t + 1.8; }
  } else if (b.act === 'plonger') {
    if (u < 1) { b.etat = 'enfouir'; if (u < .1) SON.jouer('impact', {}, b.x, b.y, b.z); return; }
    if (u < 3.2) {                                              // sous terre, vers vous
      b.etat = 'sous'; b.cache = true;
      if (J) { const d = Math.hypot(J.x - b.x, J.y - b.y); if (d > .5) { const s = Math.min(6.5 * dt, d), a = Math.atan2(J.y - b.y, J.x - b.x); b.x += Math.cos(a) * s; b.y += Math.sin(a) * s; b.dir = b.dirT = a; } }
      if (q) { b.x = Math.max(q.x + 1.5, Math.min(q.x + q.w - 1.5, b.x)); b.y = Math.max(q.y + 1.5, Math.min(q.y + q.h - 1.5, b.y)); }
      b.z = sol(b.x, b.y); P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .18);
      if (Math.random() < dt * 20) parts.push({ x: b.x + (Math.random() - .5), y: b.y + (Math.random() - .5), z: b.z + .05, vx: (Math.random() - .5), vy: (Math.random() - .5), vz: 1 + Math.random(), g: 5, life: .6, age: 0, col: Math.random() < .7 ? '#3a2c26' : '#ff6a20', tl: .1 });
      return;
    }
    if (!b.impact) b.impact = [b.x, b.y];
    if (u < 4.1) {                                              // le cercle de braise : sortez-en
      b.etat = 'sous';
      for (let j = 0; j < 3; j++) { const a = Math.random() * 6.2832; parts.push({ x: b.impact[0] + Math.cos(a) * 3.2, y: b.impact[1] + Math.sin(a) * 3.2, z: sol(b.impact[0], b.impact[1]) + .08, vx: 0, vy: 0, vz: .05, g: 0, life: .3, age: 0, col: '#ff2a20', luit: 1, tl: .11 }); }
      return;
    }
    if (!b.fait) {
      b.fait = true; b.cache = false; b.etat = 'jaillir'; b.z = sol(b.x, b.y);
      SON.jouer('impact', {}, b.x, b.y, b.z); SON.jouer('rugDemon', {}, b.x, b.y, b.z + 1); P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .7);
      for (const Q of djJoueurs()) { const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < 3.3) coupBrume(b, Q, .18, [dx / d * 7, dy / d * 7, 3.5]); }
      for (let j = 0; j < 40; j++) { const a = Math.random() * 6.2832, r = Math.random() * 2.5; parts.push({ x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r, z: b.z + .1, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 2 + Math.random() * 4, g: 6, life: .9, age: 0, col: Math.random() < .5 ? '#3a2c26' : '#ff6a20', tl: .12 }); }
    }
    if (u > 5) { b.act = null; b.impact = null; b.plongeT = t + 10 + Math.random() * 4; b.etat = 'ramper'; }
  } else if (b.act === 'pondre') {
    b.etat = 'pondre';
    if (u >= 1 && !b.fait) {
      b.fait = true; SON.jouer('atterrir', { k: .8 }, b.x, b.y, b.z);
      for (const s of [-1, 1]) {
        const x = b.x - Math.cos(b.dir) * 2.4 - Math.sin(b.dir) * s * 1.2, y = b.y - Math.sin(b.dir) * 2.4 + Math.cos(b.dir) * s * 1.2;
        if (!(hAt(x | 0, y | 0) === DJ_Z0) || eauAt(x | 0, y | 0)) continue;
        const L = naitre(specById.larve_braise, x, y); L.variante = null; L.z = DJ_Z0; L.pv = 1; L.age = 1e6; L.ech = .85; L.vie = 45; L.djSalle = b.djSalle; L.etat = 'surgir'; L.etT = t; L.dir = L.dirT = b.dir + Math.PI;
        beasts.push(L); jaillir(L, false);
      }
    }
    if (u > 1.6) { b.act = null; b.ponteT = t + 14; }
  } else b.act = null;
}
// Son corps : sept anneaux de croûte fendue de braise, une tête aux mandibules en faux et quatre yeux, l'abdomen
// gonflé d'œufs qui battent. Elle s'enfonce, jaillit, se cabre, pond.
function osMere(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  if (E === 'sous' || f.cache) return;
  const crout = [42, 24, 20], crout2 = [60, 34, 26], lave = [255, 110, 30], cl = [255, 200, 90];
  const e = E === 'enfouir' ? Math.max(0, 1 - u) : E === 'jaillir' ? Math.min(1, u / .5) : 1;
  const cab = E === 'cabrer' ? Math.min(1, u / .7) : E === 'mordre' ? Math.max(0, 1 - u / .4) : E === 'jaillir' ? Math.max(0, 1 - u / .8) : 0;
  const pond = E === 'pondre' ? Math.sin(Math.min(1, u) * Math.PI) : 0, ph = t * 4, rampe = (f.vit || 0) > .1 ? 1 : .3, N = 7;
  const P0 = [];
  for (let k = 0; k < N; k++) {
    const s = k / (N - 1), x = .62 - s * 1.3 + (E === 'mordre' ? .22 * (1 - s) : 0), leve = k < 3 ? cab * .5 * (1 - k / 3) : 0;
    P0.push([x, Math.sin(ph - k * .9) * .06 * rampe * (1 - mort), .22 + leve - (1 - e) * 1.2 - mort * .1 + Math.abs(Math.sin(ph - k * .9)) * .02 * rampe]);
  }
  for (let k = 0; k < N; k++) {
    const p = P0[k], q = P0[Math.min(N - 1, k + 1)], w = .44 - Math.abs(k - 2) * .03, d = [(p[0] - q[0]) * .5, (p[1] - q[1]) * .5, (p[2] - q[2]) * .5];
    const A = [p[0] + d[0] * .9, p[1] + d[1] * .9, p[2] + d[2] * .9], B = k < N - 1 ? [p[0] - d[0] * .9, p[1] - d[1] * .9, p[2] - d[2] * .9] : [p[0] - .14, p[1], p[2]];
    add(A, B, w, w * .85, k % 2 ? crout : crout2);
    add([B[0] - .005, B[1], B[2]], [B[0] - .025, B[1], B[2]], w * .92, w * .78, lave, true);
    for (const s of [-1, 1]) add([p[0], p[1] + s * w * .3, p[2] + w * .42], [p[0] - .04, p[1] + s * w * .34, p[2] + w * .62], .05, .05, [24, 14, 12]);   // les épines du dos
  }
  // l'abdomen : un sac d'œufs qui bat (plus fort quand elle pond)
  const T = P0[N - 1], g = 1 + .06 * Math.sin(t * 3) + .25 * pond, ab = [T[0] - .42 * g, T[1], T[2] + .08];
  add([T[0] - .08, T[1], T[2] + .05], [ab[0] - .42 * g, ab[1], ab[2]], .78 * g, .66 * g, [70, 30, 24]);
  for (const [a, b2, c] of [[-.2, .22, .2], [-.45, -.2, .28], [-.65, .12, .14], [-.35, 0, .38], [-.8, -.1, .22]]) {
    const o = [T[0] + a * g, T[1] + b2 * g, T[2] + .05 + c * g], r = .14 * g;
    add([o[0] - r / 2, o[1], o[2]], [o[0] + r / 2, o[1], o[2]], r, r, (Math.sin(t * 5 + a * 9) > .2 || pond) ? cl : lave, true);
  }
  // la tête : mandibules en faux, quatre yeux, la gueule de braise
  const H = P0[0], o = E === 'mordre' ? .3 : E === 'cabrer' ? 1 : .25 + .1 * Math.sin(t * 6);
  add([H[0] + .15, H[1], H[2]], [H[0] + .32, H[1], H[2] - .02], .38, .3, crout2);
  for (const s of [-1, 1]) {
    const M0 = [H[0] + .3, H[1] + s * .12, H[2] - .06], M1 = [H[0] + .55, H[1] + s * (.08 + o * .2), H[2] - .1], M2 = [H[0] + .68, H[1] + s * (.0 + o * .08), H[2] - .12];
    os2(M0, M1, .07, [22, 12, 10]); os2(M1, M2, .05, [22, 12, 10]);
    for (const dz of [.06, .14]) add([H[0] + .3, H[1] + s * (.07 + dz * .4), H[2] + dz], [H[0] + .33, H[1] + s * (.07 + dz * .4), H[2] + dz], .05, .05, cl, true);
  }
  if (E === 'cabrer' || E === 'mordre' || E === 'jaillir') add([H[0] + .3, H[1], H[2] - .08], [H[0] + .36, H[1], H[2] - .08], .2, .12, lave, true);
}

// ============================================================
//  LE DÉCOR D'EN BAS
// ============================================================
function roiDecor(ex, ey, r) {
  const L = [], r2 = (r || 40) ** 2, pres = (x, y) => (x - ex) ** 2 + (y - ey) ** 2 < r2;
  const os = (a, b, w, h, c, lum) => L.push({ a, b, w, h, c, lum: !!lum });
  const Z0 = DJ_Z0;
  const presS = DJ.e >= 3 ? (x, y) => (x - ex) ** 2 + (y - ey) ** 2 < 676 : pres;   // (§165) dans le noir, le décor fixe s'arrête plus tôt
  for (const o of DJ.statique) if (presS(o.a[0], o.a[1])) {
    if (o.lum) { const fl = .8 + .2 * Math.sin(t * 9 + o.a[0] * 3 + o.a[1]); L.push({ a: o.a, b: o.b, w: o.w, h: o.h, c: o.c.map(v => v * fl | 0), lum: true }); }
    else L.push(o);
  }
  for (const m of DJ.monte) if (pres(m.x, m.y)) {                // le soupirail : une chaîne du plafond, un crochet, un cercle au sol
    for (let k = 0; k < 9; k++) { const z = Z0 + .9 + k * .38, s = k % 2; os([m.x, m.y, z], [m.x, m.y, z + .3], s ? .05 : .16, s ? .16 : .05, [96, 88, 84]); }
    os([m.x, m.y, Z0 + .55], [m.x, m.y, Z0 + .9], .07, .07, [120, 110, 100]); os([m.x, m.y, Z0 + .55], [m.x + .22, m.y, Z0 + .7], .06, .06, [120, 110, 100]);
    const bat = .7 + .3 * Math.sin(t * 3);
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832, b2 = (k + 1) / 8 * 6.2832; os([m.x + Math.cos(a) * .9, m.y + Math.sin(a) * .9, Z0 + .02], [m.x + Math.cos(b2) * .9, m.y + Math.sin(b2) * .9, Z0 + .02], .08, .03, [255 * bat | 0, 70 * bat | 0, 30], 1); }
  }
  const es = DJ.escalier, sc = ROI.sceau;
  if (es && pres(es.x, es.y) && DJ.e >= ROI_OUVERTS && sc) {     // le sceau de feu, en travers des marches
    const fl = .7 + .3 * Math.sin(t * 4);
    for (const dz of [.4, 1.1, 1.8]) os([sc.x - 1.1, sc.y + .2, Z0 - 1 + dz], [sc.x + 1.1, sc.y + .2, Z0 - 1 + dz], .06, .1, [255 * fl | 0, 60, 24], 1);
    os([sc.x, sc.y + .2, Z0 - .9], [sc.x, sc.y + .2, Z0 + 1.2], .06, .1, [255 * fl | 0, 60, 24], 1);
  }
  for (const c of DJ.coffres) if (pres(c.x, c.y) && !c.gueule) {   // un coffre d'obsidienne cerclé de braise ; scellé, des chaînes qui luisent
    if (c.taille === 'reliquaire') { decorReliquaire(os, c); continue; }   // (§166)
    const g = c.taille === 'garde' ? 1.25 : c.taille === 'scelle' ? 1.1 : 1, W = .9 * g, D = .6 * g, H = .5 * g;
    const os3 = c.taille === 'scelle' && !c.ouvert && beasts.some(b => b.sp.gardeSalle && !b.dead), sc2 = (c.taille === 'garde' && !c.ouvert && roiGardeVivante(c.salle)) || os3;
    os([c.x - W / 2, c.y, c.z], [c.x + W / 2, c.y, c.z], D, H * 2, [30, 24, 28]);
    os([c.x - W / 2 - .02, c.y, c.z + H * .7], [c.x + W / 2 + .02, c.y, c.z + H * .7], D + .04, .06, [200, 70, 30], 1);
    if (c.ouvert) os([c.x - W / 2, c.y - D / 2, c.z + H], [c.x + W / 2, c.y - D / 2 - .05, c.z + H + D * .9], .06, D * .9, [38, 30, 34]);
    else { os([c.x - W / 2, c.y, c.z + H], [c.x + W / 2, c.y, c.z + H], D, .12, [38, 30, 34]);
      os([c.x, c.y + D / 2 + .02, c.z + H * .8], [c.x, c.y + D / 2 + .04, c.z + H * .8], .12, .14, [255, 140, 50], 1); }
    if (sc2) for (const s of [-1, 1]) os([c.x - W / 2, c.y + s * D * .3, c.z + H + .08], [c.x + W / 2, c.y - s * D * .3, c.z + H + .08], .05, .05, os3 ? [226, 214, 190] : [255, 80, 30], !os3);
    if (c.taille === 'scelle' && !c.ouvert) os([c.x, c.y + D / 2 + .03, c.z + H * .6], [c.x, c.y + D / 2 + .05, c.z + H * .95], .14, .14, [226, 214, 190]);   // la serrure d'os
  }
  for (const g of ROI.geysers) if (pres(g.x, g.y)) {              // une bouche de basalte ; le feu en colonne
    const z = Z0 + .02, gr = g.st === 'gronde', fe = g.st === 'feu';
    os([g.x - .4, g.y, z], [g.x + .4, g.y, z], .8, .04, [30, 24, 24]);
    os([g.x - .22, g.y, z + .03], [g.x + .22, g.y, z + .03], .44, .03, gr || fe ? [255, 120, 40] : [90, 30, 20], gr || fe);
    if (g.grand) { os([g.x - .65, g.y, z + .01], [g.x + .65, g.y, z + .01], 1.3, .05, [40, 32, 26]); for (let j = 0; j < 6; j++) { const a = j * 1.047; os([g.x + Math.cos(a) * .55, g.y + Math.sin(a) * .55, z], [g.x + Math.cos(a) * .6, g.y + Math.sin(a) * .6, z + .25 + (j & 1) * .1], .2, .2, [70, 56, 40]); } }
    if (fe) { const k = .85 + .15 * Math.sin(t * 30), G = g.grand ? 1.8 : 1; os([g.x, g.y, z], [g.x, g.y, z + 1.9 * k * G], .5 * G, .5 * G, [255, 150, 50], 1); os([g.x, g.y, z + .2], [g.x, g.y, z + 1.3 * k * G], .26 * G, .26 * G, [255, 230, 140], 1);
      if (g.grand) os([g.x, g.y, z], [g.x, g.y, z + 3.9 * k], 1.3 * (.8 + .2 * Math.sin(t * 23)), 1.3, [255, 90, 30], 1); }
  }
  for (const p of ROI.ponts) if (p.etat !== 'tombe' && pres(p.cases[0] % WS, p.cases[0] / WS | 0)) {   // l'obsidienne, et ses fissures
    for (const i of p.cases) { const x = i % WS, y = i / WS | 0, f2 = p.etat === 'fissure';
      os([x + .5, y + .5, Z0 + .005], [x + .5, y + .5, Z0 + .02], .98, .98, [14, 12, 18]);
      if (f2) { os([x + .15, y + .3, Z0 + .03], [x + .85, y + .7, Z0 + .03], .05, .02, [255, 110, 30], 1); os([x + .7, y + .1, Z0 + .03], [x + .3, y + .9, Z0 + .03], .05, .02, [255, 110, 30], 1); } }
  }
  for (const o of ROI.oeufs) if (pres(o.x, o.y)) {                // les œufs : des bulles de braise qui battent
    const k = 1 + .08 * Math.sin(t * 3 + o.ph);                 // une coque sombre, un cœur qui luit au sommet
    os([o.x, o.y, Z0], [o.x, o.y, Z0 + o.r * 1.5 * k], o.r * 2 * k, o.r * 2 * k, [70, 30, 24]);
    os([o.x, o.y, Z0 + o.r * 1.5 * k], [o.x, o.y, Z0 + o.r * 1.75 * k], o.r * 1.3 * k, o.r * 1.3 * k, [255, 120 + 50 * Math.sin(t * 2 + o.ph) | 0, 40], 1);
  }
  for (const F of ROI.fentes) if (pres(F[0][0], F[0][1]))       // la fente des diablotins
    for (let k = 0; k < F.length - 1; k++) { const A = F[k], B = F[k + 1], pul = .75 + .25 * Math.sin(t * 2 + k);
      os([A[0], A[1], Z0 + .01], [B[0], B[1], Z0 + .01], .7, .03, [20, 10, 8]); os([A[0], A[1], Z0 + .03], [B[0], B[1], Z0 + .03], .35, .03, [255 * pul | 0, 70 * pul | 0, 24], 1); }
  if (DJ.e >= 2) decorForges(os, pres);
  if (DJ.e === 3) decorOssuaires(os, pres);                     // (§165) dalles, éboulis, le Chœur
  else if (DJ.e === 4) decorJardins(os, pres); else if (DJ.e === 5) decorTrone(os, pres);   // (§166)
  decorReliques(os, pres);                          // (§164) pilons, coulées, chaînes, la chaîne du Bourreau, l'autel
  DJ.salles.forEach(q => { if (!q.fermee) return;                // les portes fermées : du basalte, trois veines de lave
    for (const i of q.portes) { const x = i % WS + .5, y = (i / WS | 0) + .5; if (!pres(x, y) || Hgt[i] === Z0) continue;
      os([x, y, Z0], [x, y, Z0 + DJ_MUR + .02], 1.02, 1.02, [34, 28, 30]);
      for (const zz of [.8, 1.8, 2.8]) os([x, y, Z0 + zz], [x, y, Z0 + zz + .12], 1.05, 1.05, [255, 90, 30], 1); } });
  return L;
}

// ============================================================
//  LE DEUXIÈME CERCLE : LES FORGES HURLANTES (§164)
//  Des ateliers de fer et de suie. Les MARTEAUX-PILONS frappent en rythme (l'enclume rougeoie avant le
//  coup : sortez-en) ; les COULÉES de métal en fusion passent par vagues dans leurs canaux (la croûte
//  s'éclaire avant la vague : on traverse entre deux) ; des chaînes pendent et se balancent. Les FORGERONS
//  DAMNÉS, lents, portent un bouclier devant eux : de face, il pare presque tout ; ils tournent lentement,
//  prenez-les de dos. Les CHIENS DE L'ABÎME chassent en meute, tournent autour de vous et mordent (la
//  morsure brûle). LE BOURREAU garde sa salle : sa chaîne vous tire vers sa hache (un trait rouge au sol
//  la précède : sortez de la ligne), et sous la moitié de sa vie ses chaînes tournoient autour de lui.
// ============================================================
const FORGE_BIO = { mur: 13, salle: 15, couloir: 13 };
const ROI_GARDE = ['', 'la Mère des larves', 'le Bourreau', 'le Chœur des damnés', 'le Jardinier', 'le Roi démon'];
const ROI_CORPS = { forgeron: 1, chien: 1, bourreau: 1, gueule: 1, ame: 1, gargouille: 1, choeur: 1, sorciere: 1, jardinier: 1, roi: 1 };
const ROI_INGR = { 1: 'oeufbraise', 2: 'ferdamne', 3: 'poussame', 4: 'fleursoufre' };   // l'ingrédient de chaque cercle
// Le plan commun des cercles : la salle du gardien d'abord (une seule porte), puis les autres, reliées au plus
// proche, deux boucles, les portes ; la salle d'arrivée est la plus éloignée du gardien.
function roiPlan(R, gw, gh, roleGarde, BI) {
  const Z0 = DJ_Z0, HM = DJ_Z0 + DJ_MUR, salles = [], A = 40, B = 160;
  const libre = (x, y, w, h) => !salles.some(q => x < q.x + q.w + 4 && x + w + 4 > q.x && y < q.y + q.h + 4 && y + h + 4 > q.y);
  salles.push({ x: 84 - (R() * 30 | 0), y: 84 - (R() * 30 | 0), w: gw, h: gh, role: roleGarde });
  const nb = 9 + (R() * 3 | 0);
  for (let k = 0; k < 900 && salles.length < nb; k++) {
    const w = 8 + (R() * 7 | 0), h = 8 + (R() * 6 | 0), x = A + (R() * (B - A - w) | 0), y = A + (R() * (B - A - h) | 0);
    if (libre(x, y, w, h)) salles.push({ x, y, w, h });
  }
  const creuse = (x, y, bio) => { const i = y * WS + x; if (Hgt[i] === HM) { Hgt[i] = Z0; Bio[i] = bio; } };
  for (const q of salles) {
    q.cx = q.x + q.w / 2; q.cy = q.y + q.h / 2; q.portes = [];
    for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) creuse(x, y, BI.salle);
  }
  const d2 = (a, b) => (salles[a].cx - salles[b].cx) ** 2 + (salles[a].cy - salles[b].cy) ** 2;
  const liens = [], dans = new Set([0]);
  while (dans.size < salles.length) {
    let best = null;
    for (const a of dans) for (let b = 0; b < salles.length; b++) if (!dans.has(b) && (!best || d2(a, b) < best[2])) best = [a, b, d2(a, b)];
    liens.push(best); dans.add(best[1]);
  }
  for (let k = 0, n = 0; k < 40 && n < 2; k++) {
    const a = 1 + (R() * (salles.length - 1) | 0), b = 1 + (R() * (salles.length - 1) | 0);
    if (a === b || d2(a, b) > 42 * 42 || liens.some(l => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a))) continue;
    liens.push([a, b]); n++;
  }
  for (const [a, b] of liens) {
    const p = salles[a], q = salles[b], ax = p.cx | 0, ay = p.cy | 0, bx = q.cx | 0, by = q.cy | 0;
    const h = (y, x0, x1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 1; x++) { creuse(x, y, BI.couloir); creuse(x, y + 1, BI.couloir); } };
    const v = (x, y0, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1) + 1; y++) { creuse(x, y, BI.couloir); creuse(x + 1, y, BI.couloir); } };
    if (R() < .5) { h(ay, ax, bx); v(bx, ay, by); } else { v(ax, ay, by); h(by, ax, bx); }
  }
  for (const q of salles) for (let y = q.y - 1; y <= q.y + q.h; y++) for (let x = q.x - 1; x <= q.x + q.w; x++) {
    if (y !== q.y - 1 && y !== q.y + q.h && x !== q.x - 1 && x !== q.x + q.w) continue;
    const i = y * WS + x; if (Hgt[i] === Z0) q.portes.push(i);
  }
  let arr = 1, m = -1; for (let k = 1; k < salles.length; k++) if (d2(0, k) > m) { m = d2(0, k); arr = k; }
  salles[arr].role = 'arrivee';
  return salles;
}
// l'escalier du cercle suivant, contre le mur du fond de la salle du gardien
function roiEscalier(M, BI) {
  const Z0 = DJ_Z0, ex = M.cx | 0, ey = M.y + 2;
  for (let k = 0; k < 3; k++) for (const dx of [0, 1]) { const i = (ey + k) * WS + ex - 1 + dx; Hgt[i] = Z0 - 1 - k; Bio[i] = BI.couloir; }
  DJ.escalier = { x: ex, y: ey + 2, z: Z0 - 3 };
}
function genForges() {
  const R = djAlea(djHash(SEED ^ Math.imul(DJ.e, 0x7f4a7c15) ^ 0x401d)), Z0 = DJ_Z0, HM = DJ_Z0 + DJ_MUR, BI = FORGE_BIO;
  Hgt.fill(HM); Bio.fill(BI.mur); Eau.fill(0); PlT.fill(0); PlB.fill(0);
  ROI.ponts = []; ROI.coulees = []; ROI.pilons = []; ROI.chaines = []; ROI.pontDit = false;
  const salles = roiPlan(R, 18, 16, 'bourreau', BI);
  const roles = ['forge', 'chenil', 'coulee', 'armurerie', 'chaines', 'forge', 'coulee', 'chenil', 'armurerie', 'chaines'];
  let kr = R() * 5 | 0;
  for (const q of salles) if (!q.role) q.role = roles[kr++ % roles.length];
  { const q = salles.find(o => o.role === 'armurerie') || salles.find(o => o.role === 'chenil' || o.role === 'chaines'); if (q) q.role = 'reliquaire'; }   // (§166)
  // les coulées : un canal de deux cases en travers de la salle, où le métal passe par vagues
  for (const q of salles) if (q.role === 'coulee') {
    const hor = q.w < q.h, cases = [];
    if (hor) { const y = (q.cy | 0) - 1; for (let x = q.x; x < q.x + q.w; x++) for (const dy of [0, 1]) cases.push((y + dy) * WS + x); }
    else { const x = (q.cx | 0) - 1; for (let y = q.y; y < q.y + q.h; y++) for (const dx of [0, 1]) cases.push(y * WS + x + dx); }
    for (const i of cases) Bio[i] = 14;
    ROI.coulees.push({ cases, ph: R() * 5, on: false, hor });
  }
  roiEscalier(salles[0], BI);
  DJ.salles = salles;
  calcOmbrage();
  return true;
}
// Le cycle d'une coulée (5,4 s, la même pour tous) : figée trois secondes (la croûte s'éclaire la dernière
// seconde), puis le métal passe deux secondes et demie.
const COULEE_CYCLE = 5.4, COULEE_FIGE = 3;
const couleeEtat = c => { const h = typeof horlogeLaser === 'function' ? horlogeLaser() : t, u = ((h + c.ph) % COULEE_CYCLE + COULEE_CYCLE) % COULEE_CYCLE; return { u, on: u >= COULEE_FIGE, alerte: u >= COULEE_FIGE - 1 && u < COULEE_FIGE }; };
// Le cycle d'un pilon (2,8 s) : il monte (1,6 s), attend en haut (l'enclume rougeoie), tombe (0,2 s), frappe.
const PILON_CYCLE = 2.8;
const pilonEtat = p => { const h = typeof horlogeLaser === 'function' ? horlogeLaser() : t, u = ((h + p.ph) % PILON_CYCLE + PILON_CYCLE) % PILON_CYCLE;
  const z = u < 1.6 ? u / 1.6 : u < 2.2 ? 1 : u < 2.4 ? 1 - (u - 2.2) / .2 : 0;
  return { u, z, alerte: u >= 1.6 && u < 2.4, coup: u >= 2.4 }; };
function peuplerForges(H) {
  const { R, Z0, deco, bete, coffre, dans, e } = H;
  const fer = [52, 50, 56], suie = [30, 28, 32], braise = [255, 120, 40];
  const forgeFeu = (x, y) => {                               // un foyer de forge : une cuve de fer, le charbon qui rougeoie
    deco([x - .5, y, Z0], [x + .5, y, Z0], .9, .9, suie); deco([x - .45, y, Z0 + .45], [x + .45, y, Z0 + .45], .8, .12, braise, 1);
    deco([x, y, Z0 + .5], [x, y, Z0 + 2.4], .3, .3, [40, 38, 44]);
  };
  const enclume = (x, y, a) => {                             // une enclume : le pied, la table, la bigorne
    const c = Math.cos(a), s = Math.sin(a);
    deco([x, y, Z0], [x, y, Z0 + .45], .32, .26, [44, 42, 48]);
    deco([x - c * .35, y - s * .35, Z0 + .5], [x + c * .3, y + s * .3, Z0 + .5], .3, .16, [70, 68, 76]);
    deco([x + c * .3, y + s * .3, Z0 + .5], [x + c * .55, y + s * .55, Z0 + .46], .12, .1, [70, 68, 76]);
  };
  const ratelier = (x, y) => {                               // un râtelier d'armes rouillées
    deco([x - .6, y, Z0 + .9], [x + .6, y, Z0 + .9], .1, .1, [80, 56, 40]);
    for (let k = -2; k <= 2; k++) deco([x + k * .25, y, Z0 + .05], [x + k * .25 + .03, y, Z0 + 1.2 - (k & 1) * .2], .05, .05, [96, 92, 100]);
  };
  ROI.autel = null; ROI.salleGarde = 0;
  DJ.salles.forEach((q, s) => {
    const zT = Z0 + 2.2, c = q.role === 'bourreau' ? [255, 60, 30] : [255, 150, 70];   // des lampes de forge le long des murs
    for (let x = q.x + 2; x < q.x + q.w - 1; x += 6) {
      if (Hgt[(q.y - 1) * WS + x] > Z0) deco([x, q.y + .08, zT], [x, q.y + .08, zT + .3], .16, .16, c, 1);
      if (Hgt[(q.y + q.h) * WS + x] > Z0) deco([x, q.y + q.h - .08, zT], [x, q.y + q.h - .08, zT + .3], .16, .16, c, 1);
    }
    const cx = q.cx, cy = q.cy;
    if (q.role === 'arrivee') {
      DJ.monte.push({ x: q.x + 1.6, y: q.y + 1.6, z: Z0 });
      ROI.autel = { x: cx, y: cy };                          // l'autel des pactes
    } else if (q.role === 'bourreau') {
      ROI.salleGarde = s;
      bete('bourreau', cx, cy + 1, s, b => { b.dir = b.dirT = -Math.PI / 2; b.etat = 'repos'; });
      coffre(q.x + q.w - 2.2, q.y + 2, 'garde', s);
      DJ.monte.push({ x: q.x + 1.6, y: q.y + q.h - 1.6, z: Z0 });
      forgeFeu(q.x + 2, q.y + 2.2); forgeFeu(q.x + q.w - 2.5, q.y + q.h - 2.2);
      for (let k = 0; k < 6; k++) { const [x, y] = dans(q, 1.2); if (Math.hypot(x - cx, y - cy) > 3.5) ROI.chaines.push({ x, y, L: 1.6 + R() * 1.2, ph: R() * 6.28, croc: 1 }); }
      ROI.sceau = { x: DJ.escalier.x, y: DJ.escalier.y - 1 };
    } else if (q.role === 'forge') {
      const hor = q.w >= q.h, n = 2 + (Math.max(q.w, q.h) > 12 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const u = (k + 1) / (n + 1), x = hor ? q.x + q.w * u : cx, y = hor ? cy : q.y + q.h * u;
        ROI.pilons.push({ x: (x | 0) + .5, y: (y | 0) + .5, ph: k * .9 + R() * .3 });
      }
      forgeFeu(q.x + 1.6, q.y + 1.6); enclume(q.x + q.w - 2, q.y + q.h - 2, R() * 6.28);
      if (R() < .55) { const [x, y] = dans(q, 2); bete('forgeron', x, y, s); }
    } else if (q.role === 'chenil') {
      for (let k = 0; k < 5; k++) { const [x, y] = dans(q, 1.5); deco([x - .3, y, Z0], [x + .3, y + .1, Z0 + .12], .3, .2, [196, 184, 160]); }   // des os rongés
      const n = q.w * q.h > 110 ? 3 : 2;
      for (let k = 0; k < n; k++) { const [x, y] = dans(q, 2.2); bete('chien_abime', x, y, s, b => { b.etat = 'dort'; }); }
    } else if (q.role === 'coulee') {
      const C = ROI.coulees.find(o => o.cases.some(i => djDansSalle(q, i % WS, i / WS | 0)));
      let ok = false;
      for (let k = 0; k < 20 && !ok; k++) { const [x, y] = dans(q, 1.6); if (H.sec(x, y) && !(C && C.cases.includes((y | 0) * WS + (x | 0)))) { coffre(x, y, 'petit', s); ok = true; } }
      if (R() < .4) { const [x, y] = dans(q, 2); bete('forgeron', x, y, s); }
    } else if (q.role === 'armurerie') {
      ratelier(cx, q.y + 1); enclume(q.x + 2, cy, R() * 6.28);
      coffre(cx, cy, 'petit', s);
      const [x, y] = dans(q, 2); bete('forgeron', x, y, s);
    } else if (q.role === 'chaines') {
      for (let k = 0; k < 8; k++) { const [x, y] = dans(q, 1); ROI.chaines.push({ x, y, L: 1.2 + R() * 1.6, ph: R() * 6.28, croc: R() < .5 }); }
      if (R() < .5) { for (let k = 0; k < 2; k++) { const [x, y] = dans(q, 2); bete('chien_abime', x, y, s, b => { b.etat = 'dort'; }); } }
      else { const [x, y] = dans(q, 2); bete('forgeron', x, y, s); }
    } else if (q.role === 'reliquaire') peuplerReliquaire(H, q, s);   // (§166)
  });
  // le coffre scellé : la clé d'os du Bourreau l'ouvre (dans une armurerie, sinon ailleurs)
  const qs = DJ.salles.findIndex(q => q.role === 'armurerie') >= 0 ? DJ.salles.findIndex(q => q.role === 'armurerie') : DJ.salles.findIndex(q => q.role !== 'arrivee' && q.role !== 'bourreau');
  if (qs >= 0) { const q = DJ.salles[qs]; coffre(q.x + q.w - 1.8, q.y + 1.8, 'scelle', qs); }
  // dans les couloirs droits, un pilon ou deux
  const couloir = (x, y) => Hgt[y * WS + x] === Z0 && !djSalleDe(x, y);
  const droits = [];
  for (let y = 3; y < WS - 3; y++) for (let x = 3; x < WS - 3; x++) {
    if (!couloir(x, y) || !couloir(x + 1, y) || !couloir(x, y + 1) || !couloir(x + 1, y + 1)) continue;
    if ((Hgt[(y - 1) * WS + x] > Z0 && Hgt[(y + 2) * WS + x] > Z0 && couloir(x - 1, y) && couloir(x + 2, y))
      || (Hgt[y * WS + x - 1] > Z0 && Hgt[y * WS + x + 2] > Z0 && couloir(x, y - 1) && couloir(x, y + 2))) droits.push([x, y]);
  }
  for (let k = 0, n = 0; k < 300 && n < 2 && droits.length; k++) {
    const [x, y] = droits[R() * droits.length | 0];
    if (ROI.pilons.some(p => Math.hypot(p.x - x, p.y - y) < 10) || DJ.monte.some(m => Math.hypot(m.x - x, m.y - y) < 8)) continue;
    ROI.pilons.push({ x: x + 1, y: y + 1, ph: R() * 2.8, large: 1 }); n++;
  }
}
// À chaque image : les coulées, les pilons, la brûlure des bêtes (pacte de Braise)
function majForges(dt, J) {
  const Z0 = DJ_Z0, k2 = pacte('braise') ? 2 : 1;
  for (const c of ROI.coulees) {
    const E = couleeEtat(c);
    if (E.on !== c.on) {
      c.on = E.on;
      for (const i of c.cases) {
        if (E.on) { Hgt[i] = Z0 - 1; Eau[i] = Z0; } else { Hgt[i] = Z0; Eau[i] = 0; }
        signalDecor('dalle', i);
      }
      const i0 = c.cases[c.cases.length >> 1];
      if (E.on && (i0 % WS - P.x) ** 2 + ((i0 / WS | 0) - P.y) ** 2 < 300) SON.jouer('pilon', { vol: .35 }, i0 % WS, i0 / WS | 0, Z0);
    }
    if (E.alerte && Math.random() < dt * 14) { const i = c.cases[Math.random() * c.cases.length | 0];
      parts.push({ x: i % WS + Math.random(), y: (i / WS | 0) + Math.random(), z: Z0 + .05, vx: 0, vy: 0, vz: .6 + Math.random(), g: -.2, life: .6, age: 0, col: '#ffb040', luit: 1, tl: .07 }); }
  }
  for (const p of ROI.pilons) {
    const E = pilonEtat(p), pres = (p.x - P.x) ** 2 + (p.y - P.y) ** 2 < 300;
    if (E.coup && !p.frappe) {
      p.frappe = true;
      if (pres) { SON.jouer('pilon', { vol: .9 }, p.x, p.y, Z0); for (let q = 0; q < 14; q++) { const a = Math.random() * 6.28;
        parts.push({ x: p.x + Math.cos(a) * .6, y: p.y + Math.sin(a) * .6, z: Z0 + .1, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: 1 + Math.random() * 2, g: 9, life: .5, age: 0, col: '#ffc060', luit: 1, tl: .06 }); }
        if ((p.x - P.x) ** 2 + (p.y - P.y) ** 2 < 25) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .25); } }
      const r = p.large ? .95 : .8;
      for (const Q of J) if (Math.abs(Q.x - p.x) < r + .2 && Math.abs(Q.y - p.y) < r + .2 && Q.z < Z0 + 1.2 && Q.pv > 0) {
        const dx = Q.x - p.x, dy = Q.y - p.y, d = Math.hypot(dx, dy) || 1;
        coupBrume({ x: p.x, y: p.y, z: Z0, sp: {} }, Q, .14, [dx / d * 7, dy / d * 7, 3]);
        if (Q === P) say('le marteau-pilon vous écrase', 1.4);
      }
      for (const b of beasts) if (!b.dead && b.pv > 0 && !b.sp.gardeSalle && Math.abs(b.x - p.x) < r + .2 && Math.abs(b.y - p.y) < r + .2) { b.pv -= .25 / robuste(b); b.hit = .25; if (b.pv <= 0) mourirBete(b, 'pilon'); }
    } else if (!E.coup) p.frappe = false;
  }
}
// Le décor qui bouge, ajouté à roiDecor
function decorForges(os, pres) {
  const Z0 = DJ_Z0, plaf = Z0 + DJ_MUR;
  for (const p of ROI.pilons) if (pres(p.x, p.y)) {           // la plaque d'enclume (rougeoie avant le coup), le fût, la masse
    const E = pilonEtat(p), r = p.large ? 1.9 : 1.6, al = E.alerte ? .6 + .4 * Math.sin(t * 22) : 0;
    os([p.x - r / 2, p.y, Z0 + .005], [p.x + r / 2, p.y, Z0 + .005], r, .03, al ? [200 + 55 * al | 0, 60, 30] : [36, 34, 40], !!al);
    const zb = Z0 + .02 + E.z * 2.3, m = p.large ? 1.5 : 1.25;
    os([p.x, p.y, zb + .6], [p.x, p.y, plaf], .34, .34, [58, 56, 64]);
    os([p.x, p.y, zb], [p.x, p.y, zb + .6], m, m, [44, 42, 50]);
    os([p.x, p.y, zb + .55], [p.x, p.y, zb + .62], m + .08, m + .08, [90, 70, 50]);
  }
  for (const c of ROI.coulees) {
    const E = couleeEtat(c);
    if (E.on || !pres(c.cases[0] % WS, c.cases[0] / WS | 0)) continue;
    const k = E.alerte ? .55 + .45 * Math.sin(t * 16) : .25;   // la croûte : sombre, veinée ; elle s'éclaire avant la vague
    for (const i of c.cases) { const x = i % WS + .5, y = (i / WS | 0) + .5;
      os([x, y, Z0 + .004], [x, y, Z0 + .02], .98, .98, [40 + 60 * k | 0, 26 + 20 * k | 0, 24]);
      if ((i & 3) === 0) os([x - .3, y - .2, Z0 + .03], [x + .3, y + .25, Z0 + .03], .05, .02, [255, 120 + 80 * k | 0, 40], 1); }
  }
  for (const ch of ROI.chaines) if (pres(ch.x, ch.y)) {      // des chaînes qui pendent, et se balancent
    const sw = Math.sin(t * 1.3 + ch.ph) * .18, sw2 = Math.cos(t * 1.1 + ch.ph) * .12, n = Math.round(ch.L / .3);
    let A = [ch.x, ch.y, plaf];
    for (let k = 1; k <= n; k++) { const f = k / n, B = [ch.x + sw * f * f, ch.y + sw2 * f * f, plaf - ch.L * f]; os(A, B, k % 2 ? .05 : .13, k % 2 ? .13 : .05, [92, 86, 84]); A = B; }
    if (ch.croc) { os(A, [A[0], A[1], A[2] - .2], .05, .05, [120, 110, 100]); os([A[0], A[1], A[2] - .2], [A[0] + .14, A[1], A[2] - .1], .05, .05, [120, 110, 100]); }
  }
  // la chaîne du Bourreau : le trait rouge au sol, puis la chaîne lancée ; ses chaînes qui tournoient
  for (const b of beasts) if (b.sp.corps === 'bourreau' && !b.dead && pres(b.x, b.y)) {
    const T = b.trait;
    if (T && b.act === 'chaine') {
      const u = t - b.actT, dx = T[2] - T[0], dy = T[3] - T[1], L = Math.hypot(dx, dy) || 1;
      if (u < .8) { const k = .5 + .5 * Math.sin(t * 20);
        for (let s = 0; s < L; s += .5) os([T[0] + dx / L * s, T[1] + dy / L * s, Z0 + .02], [T[0] + dx / L * Math.min(L, s + .35), T[1] + dy / L * Math.min(L, s + .35), Z0 + .02], .16, .02, [255 * k | 0, 30, 20], 1); }
      else { const tip = b.prise ? Math.hypot(b.prise.x - b.x, b.prise.y - b.y) : Math.min(L, (u - .8) / .25 * L), z = b.z + 1.1;
        for (let s = 0; s < tip; s += .3) os([b.x + dx / L * s, b.y + dy / L * s, z], [b.x + dx / L * Math.min(tip, s + .26), b.y + dy / L * Math.min(tip, s + .26), z], (s * 3.3 | 0) % 2 ? .05 : .12, (s * 3.3 | 0) % 2 ? .12 : .05, [110, 100, 96]); }
    }
    if (b.act === 'tourbillon' && t - b.actT > .6) {
      const a0 = (t - b.actT) * 7;
      for (const k of [0, 1]) { const a = a0 + k * Math.PI;
        for (let s = .6; s < 3.3; s += .3) os([b.x + Math.cos(a) * s, b.y + Math.sin(a) * s, b.z + .9], [b.x + Math.cos(a) * (s + .26), b.y + Math.sin(a) * (s + .26), b.z + .9], .12, .06, [110, 100, 96]);
        os([b.x + Math.cos(a) * 3.3, b.y + Math.sin(a) * 3.3, b.z + .8], [b.x + Math.cos(a) * 3.3, b.y + Math.sin(a) * 3.3, b.z + 1.05], .22, .22, [70, 64, 70]); }
    }
  }
  const A = ROI.autel;
  if (A && pres(A.x, A.y)) {                                   // l'autel des pactes : un bloc de basalte, trois runes
    const fait = (DJ.etat.autels || []).includes(DJ.e), L = fait ? [] : pactesOfferts();
    os([A.x, A.y, Z0], [A.x, A.y, Z0 + .8], 1.3, .8, [34, 28, 32]); os([A.x, A.y, Z0 + .8], [A.x, A.y, Z0 + .9], 1.5, 1, [48, 40, 44]);
    for (let k = 0; k < 3; k++) { const c = fait ? [70, 40, 30] : PACTES[L[k]].c, f = .7 + .3 * Math.sin(t * 3 + k * 2);
      os([A.x - .45 + k * .45, A.y, Z0 + .92], [A.x - .45 + k * .45, A.y, Z0 + 1.02 + (fait ? 0 : .06 * Math.sin(t * 2 + k))], .18, .18, c.map(v => v * (fait ? 1 : f) | 0), !fait); }
  }
}

// ============================================================
//  LES BÊTES DES FORGES, ET LA GUEULE
// ============================================================
function majRoiBete(b, dt) {
  const k = b.sp.corps;
  if (k === 'forgeron') majForgeron(b, dt); else if (k === 'chien') majChien(b, dt);
  else if (k === 'bourreau') majBourreau(b, dt); else if (k === 'gueule') majGueule(b, dt);
  else if (k === 'ame') majAme(b, dt); else if (k === 'gargouille') majGargouille(b, dt); else if (k === 'choeur') majChoeur(b, dt);
  else if (k === 'sorciere') majSorciere(b, dt); else if (k === 'jardinier') majJardinier(b, dt); else if (k === 'roi') majRoi(b, dt);
}
function osRoiBete(f, O) {
  const k = f.sp.corps;
  if (k === 'forgeron') osForgeron(f, O); else if (k === 'chien') osChien(f, O);
  else if (k === 'bourreau') osBourreau(f, O); else if (k === 'gueule') osGueule(f, O);
  else if (k === 'ame') osAme(f, O); else if (k === 'gargouille') osGargouille(f, O); else if (k === 'choeur') osChoeur(f, O);
  else if (k === 'sorciere') osSorciere(f, O); else if (k === 'jardinier') osJardinier(f, O); else if (k === 'roi') osRoi(f, O);
}
const joueursDans = () => typeof djJoueurs === 'function' ? djJoueurs() : [P];
// Le bouclier du forgeron : de face (à moins de 70° de son regard), le coup est presque tout paré.
let bouclierDit = -99;
function bouclierK(b) {
  if (b.dead || (b.act === 'marteler' && t - b.actT > .9)) return 1;      // le bras levé pour frapper, il se découvre un instant
  const a = Math.atan2(P.y - b.y, P.x - b.x) - b.dir;
  if (Math.cos(a) < .34) return 1;
  if (t - (b.pareT || 0) > .2) { b.pareT = t; SON.jouer('clank', {}, b.x, b.y, b.z + .8); burst(b.x + Math.cos(b.dir) * .45, b.y + Math.sin(b.dir) * .45, b.z + .8, 8, '#ffd27d'); }
  if (t - bouclierDit > 30) { bouclierDit = t; say('le bouclier pare · prenez-le de dos', 2.4); }
  return .15;
}
// LE FORGERON DAMNÉ : lent, le bouclier devant ; il tourne lentement (on le prend à revers), lève son marteau
// (0,9 s : écartez-vous) et l'abat devant lui.
function majForgeron(b, dt) {
  if (b.act) return actionForgeron(b, dt);
  const c = cibleBrume(b, 12);
  if (!c) { b.vit = 0; b.etat = 'garde'; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 1.4);
  let da = b.dirT - b.dir; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832;
  if (d < 2.3 && Math.abs(da) < .6 && t > (b.coupT || 0)) { agirBrume(b, 'marteler', c); b.coupT = t + 2.4; return; }
  b.etat = 'marcher';
  if (d > 1.7) pasBrume(b, c.x, c.y, b.sp.spd, dt, 1.2); else b.vit = 0;
}
function actionForgeron(b, dt) {
  const u = t - b.actT; b.vit = 0;
  if (u < .9) { b.etat = 'lever'; return; }
  b.etat = 'frapper';
  if (!b.fait) {
    b.fait = true; SON.jouer('pilon', { vol: .6 }, b.x, b.y, b.z);
    for (const Q of joueursDans()) { const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1;
      if (d < 2.4 && (dx * Math.cos(b.dir) + dy * Math.sin(b.dir)) / d > .5) coupBrume(b, Q, .13, [dx / d * 5, dy / d * 5, 2]); }
    const x = b.x + Math.cos(b.dir) * 1.3, y = b.y + Math.sin(b.dir) * 1.3;
    for (let q = 0; q < 10; q++) parts.push({ x, y, z: b.z + .05, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, vz: 1 + Math.random() * 2, g: 9, life: .45, age: 0, col: '#ffc060', luit: 1, tl: .06 });
  }
  if (u > 1.9) b.act = null;
}
// LE CHIEN DE L'ABÎME : en meute ; endormi jusqu'à ce qu'on approche (toute la meute s'éveille), il tourne
// autour de sa proie, se ramasse, fond sur elle et mord (la morsure brûle deux secondes), puis se dégage.
function majChien(b, dt) {
  if (b.act) return actionChien(b, dt);
  const c = cibleBrume(b, b.etat === 'dort' ? 7 : 18);
  if (!c) { b.vit = 0; if (b.etat !== 'dort') b.etat = 'rode'; return; }
  if (b.etat === 'dort') {                                  // toute la meute s'éveille
    for (const o of beasts) if (o.sp.corps === 'chien' && !o.dead && o.djSalle === b.djSalle && o.etat === 'dort') { o.etat = 'rode'; o.coupT = t + .8 + Math.random() * 1.5; }
    SON.jouer('rugDemon', { vol: .6 }, b.x, b.y, b.z + .5);
  }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  if (t < (b.recule || 0)) { const a = Math.atan2(b.y - c.y, b.x - c.x); b.etat = 'rode'; pasBrume(b, b.x + Math.cos(a) * 3, b.y + Math.sin(a) * 3, 4.2, dt, 1.2); tournerBrume(b, dt, 8); return; }
  if (d < 4 && t > (b.coupT || 0)) { agirBrume(b, 'mordre', c); b.coupT = t + 2.2 + Math.random() * 1.6; return; }
  const a = Math.atan2(b.y - c.y, b.x - c.x) + (b.cote || 1) * .6;   // il tourne autour, à trois cases
  b.etat = 'rode'; pasBrume(b, c.x + Math.cos(a) * 3.2, c.y + Math.sin(a) * 3.2, 4.2, dt, 1.2);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 6);
}
function actionChien(b, dt) {
  const u = t - b.actT, c = b.actC, vivant = c && (estJoueur(c) ? c.pv > 0 : !c.dead); b.vit = 0;
  if (u < .35) { b.etat = 'ramasser'; if (vivant) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 10); } return; }
  if (u < .7) {
    b.etat = 'mordre';
    const nx = b.x + Math.cos(b.dir) * 11 * dt, ny = b.y + Math.sin(b.dir) * 11 * dt, h = hAt(nx | 0, ny | 0);
    if (h > SEA && Math.abs(h - hAt(b.x | 0, b.y | 0)) <= 1.2 && !eauEnfer(nx, ny)) { b.x = nx; b.y = ny; b.z = sol(nx, ny); b.vit = 11; }
    if (!b.fait && vivant && Math.hypot(c.x - b.x, c.y - b.y) < 1.1) {
      b.fait = true; coupBrume(b, c, .06, [Math.cos(b.dir) * 3, Math.sin(b.dir) * 3, 1]); SON.jouer('lacere', {}, b.x, b.y, b.z + .5);
      if (c === P) P.brulure = Math.max(P.brulure || 0, t + 2);
    }
    return;
  }
  if (u > .9) { b.act = null; b.recule = t + .9; b.cote = -(b.cote || 1); }
}
// LE BOURREAU : grand, la cagoule noire, des chaînes en travers du torse, une hache à deux mains. Il marche
// sur vous ; de loin, il LANCE SA CHAÎNE (un trait rouge au sol la précède 0,8 s, puis elle file droit : sortez de
// la ligne) — prise, elle vous tire contre lui, et la HACHE suit 0,6 s plus tard. De près, la hache seule
// (levée 0,6 s). Sous la moitié de sa vie, ses chaînes TOURNOIENT autour de lui (2 s, à 3,3 cases).
function majBourreau(b, dt) {
  const q = DJ.salles && DJ.salles[b.djSalle];
  let J = null, dJ = 1e9;
  for (const Q of joueursDans()) if (!q || djDansSalle(q, Q.x, Q.y, .3)) { const d = Math.hypot(Q.x - b.x, Q.y - b.y); if (d < dJ) { dJ = d; J = Q; } }
  if (b.act) return actionBourreau(b, dt, J);
  if (!J) { b.vit = 0; b.etat = 'repos'; return; }
  if (!b.eveil) { b.eveil = true; b.chaineT = t + 1.2; b.tourT = t + 6; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 1); say('Le Bourreau se lève', 3); }
  b.dirT = Math.atan2(J.y - b.y, J.x - b.x); tournerBrume(b, dt, 2.2);
  if (b.pv < .5 && t > b.tourT) return agirBrume(b, 'tourbillon', J);
  if (dJ > 3.4 && dJ < 11 && t > b.chaineT) return agirBrume(b, 'chaine', J);
  if (dJ < 2.9 && t > (b.hacheT || 0)) return agirBrume(b, 'hache', J);
  b.etat = 'marcher'; pasBrume(b, J.x, J.y, b.sp.spd, dt, 1);
}
function actionBourreau(b, dt, J) {
  const u = t - b.actT; b.vit = 0;
  if (b.act === 'chaine') {
    const c = b.actC;
    if (u < .8) {                                             // il vise : le trait suit sa cible, puis se fige
      b.etat = 'viser'; if (c) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 6); }
      const L = Math.min(12, (c ? Math.hypot(c.x - b.x, c.y - b.y) : 6) + 1.5);
      b.trait = [b.x, b.y, b.x + Math.cos(b.dir) * L, b.y + Math.sin(b.dir) * L]; b.prise = null;
      if (u < .05) SON.jouer('clank', {}, b.x, b.y, b.z + 1);
      return;
    }
    const T = b.trait, dx = T[2] - T[0], dy = T[3] - T[1], L = Math.hypot(dx, dy) || 1;
    if (u < 1.05) {                                           // la chaîne file
      b.etat = 'lancer';
      const tip = Math.min(L, (u - .8) / .25 * L);
      if (!b.prise) for (const Q of joueursDans()) {
        const px = Q.x - b.x, py = Q.y - b.y, s = (px * dx + py * dy) / L, dperp = Math.abs(px * dy - py * dx) / L;
        if (s > 0 && s <= tip && dperp < .7 && Math.abs(Q.z - b.z) < 1.6) { b.prise = Q; SON.jouer('lacere', {}, Q.x, Q.y, Q.z + .6); if (Q === P) say('la chaîne vous happe', 1.4); }
      }
      return;
    }
    if (b.prise && u < 1.5) {                                 // il tire : vous voilà contre lui
      b.etat = 'tirer';
      const Q = b.prise, a = Math.atan2(b.y - Q.y, b.x - Q.x), d = Math.hypot(b.x - Q.x, b.y - Q.y);
      if (Q === P && d > 1.7 && P.pv > 0) { const s = Math.min(d - 1.7, 14 * dt); const nx = P.x + Math.cos(a) * s, ny = P.y + Math.sin(a) * s;
        if (!blockedAt(nx, ny, P.z)) { P.x = nx; P.y = ny; } P.vx = P.vy = 0; P.recul = .15; }
      return;
    }
    if (b.prise) { const Q = b.prise; b.prise = null; b.trait = null; agirBrume(b, 'hache', Q); b.actT = t; b.chaineT = t + 6.5; return; }
    if (u > 1.6) { b.act = null; b.trait = null; b.chaineT = t + 5; }
    return;
  }
  if (b.act === 'hache') {
    const c = b.actC;
    if (u < .6) { b.etat = 'lever'; if (c) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 3); } return; }
    b.etat = 'frapper';
    if (!b.fait) {
      b.fait = true; SON.jouer('lacere', {}, b.x, b.y, b.z + 1); SON.jouer('impact', {}, b.x, b.y, b.z);
      P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .35);
      for (const Q of joueursDans()) { const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1;
        if (d < 3 && (dx * Math.cos(b.dir) + dy * Math.sin(b.dir)) / d > .2) coupBrume(b, Q, .2, [dx / d * 7, dy / d * 7, 3]); }
    }
    if (u > 1.4) { b.act = null; b.hacheT = t + 1.6; }
    return;
  }
  if (b.act === 'tourbillon') {
    b.etat = u < .6 ? 'lever' : 'tourner';
    if (u >= .6 && t > (b.tourCoup || 0)) {
      b.tourCoup = t + .45; SON.jouer('volee', {}, b.x, b.y, b.z + 1);
      for (const Q of joueursDans()) { const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < 3.5 && Math.abs(Q.z - b.z) < 1.5) coupBrume(b, Q, .07, [dx / d * 5, dy / d * 5, 1.5]); }
    }
    if (u > 2.6) { b.act = null; b.tourT = t + 9; }
    return;
  }
  b.act = null;
}
// LA GUEULE : un coffre sur dix (un sur quatre sous le pacte d'Avarice) a des dents. Elle bondit, mord, et
// abattue, rend le double de ce qu'elle gardait.
function majGueule(b, dt) {
  const u = t - (b.etT || 0);
  if (b.etat === 'surgir') { b.vit = 0; if (u > .8) b.etat = 'bondir'; return; }
  if (b.act) {
    const v = t - b.actT, c = b.actC;
    if (v < .45) { b.etat = 'ouvrir'; return; }
    b.etat = 'croquer';
    if (!b.fait) { b.fait = true; SON.jouer('lacere', {}, b.x, b.y, b.z + .5);
      if (c && Math.hypot(c.x - b.x, c.y - b.y) < 1.7) coupBrume(b, c, .1, [Math.cos(b.dir) * 4, Math.sin(b.dir) * 4, 2]); }
    if (v > .9) b.act = null;
    return;
  }
  const c = cibleBrume(b, 12);
  if (!c) { b.vit = 0; b.etat = 'attendre'; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 6);
  if (d < 1.6 && t > (b.coupT || 0)) { agirBrume(b, 'croquer', c); b.coupT = t + 1.3; return; }
  b.etat = 'bondir'; pasBrume(b, c.x, c.y, 2.8, dt, 1.2);
}

// ---------- leurs volumes ----------
function marcheOs(f, v0) { const v = Math.min(1, (f.vit || 0) / v0); f.gphF = (f.gphF || 0) + (f.vit || 0) * .016 * 6; return { v, ph: f.t * 6 * (.4 + v) + (f.num || 0) }; }
// Le forgeron : voûté, un tablier de cuir, un masque de fer à fente de braise, un bouclier de fer devant lui,
// le marteau dans la droite ; des chaînes en bandoulière.
function osForgeron(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const { v, ph } = marcheOs(f, 1.2);
  const cuir = [72, 48, 34], peau = [96, 70, 64], fer = [70, 70, 78], fer2 = [44, 44, 50], braise = [255, 120, 40];
  const z = -mort * .5, lev = E === 'lever' ? Math.min(1, u / .9) : 0, fr = E === 'frapper' ? Math.max(0, 1 - u / .25) : 0;
  for (const s of [-1, 1]) {
    const p = ph + (s > 0 ? 0 : Math.PI), hip = [0, s * .13, z + .5], kn = [.06 + Math.sin(p) * .12 * v, s * .14, z + .27], ft = [Math.sin(p) * .18 * v, s * .14, z + .02];
    os2(hip, kn, .14, cuir); os2(kn, ft, .12, fer2); add(ft, [ft[0] + .14, ft[1], ft[2]], .14, .08, fer2);
  }
  const T0 = [0, 0, z + .5], T1 = [.08, 0, z + .95];
  add(T0, T1, .44, .34, peau); add([.13, 0, z + .48], [.16, 0, z + .9], .4, .06, cuir);          // le torse, le tablier
  for (const s of [-1, 1]) os2([.12, s * .2, z + .92], [-.14, -s * .2, z + .55], .04, [92, 86, 84]);   // les chaînes en croix
  const Hc = [.16, 0, z + 1.1];
  add([Hc[0] - .1, 0, Hc[2]], [Hc[0] + .1, 0, Hc[2] + .02], .24, .24, fer);                      // le masque
  add([Hc[0] + .11, 0, Hc[2] + .02], [Hc[0] + .115, 0, Hc[2] + .02], .16, .03, braise, true);     // la fente
  // le bras gauche et le bouclier, devant
  const Sg = [.08, .22, z + .9], Mg = [.36, .16, z + .7];
  os2(Sg, Mg, .1, peau);
  add([.44, .02, z + .38], [.44, .02, z + 1.02], .08, .62, fer); add([.47, .02, z + .7], [.49, .02, z + .7], .1, .1, fer2);
  // le bras droit et le marteau : levé derrière la tête, puis abattu devant
  const Sd = [.08, -.22, z + .92], ang = -1.1 + lev * 3.4 - fr * 2.9;
  const Md = [Sd[0] + Math.cos(ang) * .38, -.26, Sd[2] + Math.sin(ang) * .38];
  os2(Sd, Md, .1, peau);
  const Mt = [Md[0] + Math.cos(ang) * .45, -.26, Md[2] + Math.sin(ang) * .45];
  os2(Md, Mt, .05, [80, 56, 40]); add([Mt[0] - .12, -.26, Mt[2]], [Mt[0] + .12, -.26, Mt[2]], .2, .2, fer2);
}
// Le chien de l'Abîme : long et maigre, la peau noire fendue de braise le long de l'échine, les yeux qui
// luisent ; il dort couché, rôde tête basse, se ramasse et fond gueule ouverte.
function osChien(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const { v, ph } = marcheOs(f, 4);
  const noir = [34, 26, 28], noir2 = [22, 16, 18], braise = [255, 110, 40], oeil = [255, 200, 80];
  const dort = E === 'dort', ram = E === 'ramasser' ? Math.min(1, u / .35) : 0, mord = E === 'mordre';
  const z = (dort ? -.22 : -ram * .08) - mort * .3 + Math.abs(Math.sin(ph)) * .04 * v;
  const S = [.28 + (mord ? .08 : 0), 0, z + .58], H = [-.3, 0, z + .54 + ram * .04];
  add(H, S, .26, .24, noir); add([S[0] - .04, 0, S[2] - .02], [S[0] + .1, 0, S[2] - .04], .3, .3, noir2);   // le corps, le poitrail
  for (let k = 0; k < 4; k++) { const q = mi3(H, S), x = H[0] + (S[0] - H[0]) * (.15 + k * .22);
    add([x, 0, z + .67], [x + .08, 0, z + .675], .06, .03, braise, true); }                       // les fentes de braise
  const tete = dort ? [S[0] + .2, 0, z + .4] : [S[0] + .22, 0, S[2] + .1 - ram * .1 + (mord ? -.05 : 0)];
  os2([S[0] + .05, 0, S[2] + .05], tete, .14, noir);
  const ouv = mord ? .5 : ram * .2;
  add([tete[0], 0, tete[2]], [tete[0] + .26, 0, tete[2] - .03], .14, .1, noir2);                 // le museau
  add([tete[0] + .02, 0, tete[2] - .06], [tete[0] + .24, 0, tete[2] - .06 - ouv * .12], .12, .04, noir2);   // la mâchoire
  if (ouv > .1) add([tete[0] + .05, 0, tete[2] - .05], [tete[0] + .2, 0, tete[2] - .07], .08, .03, braise, true);
  for (const s of [-1, 1]) { add([tete[0] + .1, s * .06, tete[2] + .04], [tete[0] + .12, s * .06, tete[2] + .04], .04, .03, oeil, true);
    os2([tete[0] - .04, s * .05, tete[2] + .06], [tete[0] - .12, s * .07, tete[2] + .2 - ram * .08], .04, noir2); }   // les oreilles
  for (const [x0, s, o] of [[S[0] - .02, 1, 0], [S[0] - .02, -1, Math.PI], [H[0] + .04, 1, Math.PI], [H[0] + .04, -1, 0]]) {
    const p = ph + o, hip = [x0, s * .1, z + .5], ft = dort ? [x0 + .2, s * .14, .02] : [x0 + Math.sin(p) * .18 * v + (mord ? (x0 > 0 ? .2 : -.2) : 0), s * .11, Math.max(.02, z + .02 + Math.max(0, Math.cos(p)) * .08 * v)];
    os2(hip, mi3(hip, ft), .08, noir); os2(mi3(hip, ft), ft, .06, noir2);
  }
  let q = [H[0] - .04, 0, H[2] + .04];                                                           // la queue, comme un fouet
  for (let j = 1; j <= 3; j++) { const n = [q[0] - .14, Math.sin(t * 5 + j) * .05 * j, q[2] - .04 + (dort ? -.05 : 0)]; os2(q, n, .04, noir2); q = n; }
}
// Le Bourreau : trois mètres, une cagoule noire pointue, le torse gris barré de chaînes, une hache à deux mains.
function osBourreau(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const { v, ph } = marcheOs(f, 1.4);
  const peau = [112, 104, 100], noir = [24, 20, 24], cuir = [58, 40, 30], fer = [120, 118, 124], chaine = [92, 86, 84];
  const z = -mort * .6, lev = E === 'lever' ? Math.min(1, u / .6) : 0, fr = E === 'frapper' ? Math.max(0, 1 - u / .25) : 0;
  const vise = E === 'viser' || E === 'lancer' || E === 'tirer', tour = E === 'tourner';
  for (const s of [-1, 1]) {
    const p = ph + (s > 0 ? 0 : Math.PI), hip = [0, s * .14, z + .55], kn = [.05 + Math.sin(p) * .14 * v, s * .15, z + .3], ft = [Math.sin(p) * .2 * v, s * .15, z + .02];
    os2(hip, kn, .15, cuir); os2(kn, ft, .13, noir); add(ft, [ft[0] + .16, ft[1], ft[2]], .15, .08, noir);
  }
  const T0 = [0, 0, z + .55], T1 = [.04, 0, z + 1.1];
  add(T0, T1, .5, .32, peau); add([0, 0, z + .5], [0, 0, z + .62], .54, .36, cuir);              // le torse, la ceinture
  for (const s of [-1, 1]) os2([.17, s * .24, z + 1.05], [.17, -s * .24, z + .6], .045, chaine);   // les chaînes en travers
  const Hc = [.06, 0, z + 1.28];
  add([Hc[0], 0, Hc[2] - .12], [Hc[0], 0, Hc[2] + .14], .24, .24, noir);                           // la cagoule
  add([Hc[0] - .02, 0, Hc[2] + .14], [Hc[0] - .05, 0, Hc[2] + .3], .12, .12, noir);
  for (const s of [-1, 1]) add([Hc[0] + .12, s * .05, Hc[2] + .02], [Hc[0] + .125, s * .05, Hc[2] + .02], .04, .025, [255, 90, 40], true);
  // les bras et la hache : levée derrière la tête, abattue devant ; le bras qui vise tient la chaîne
  const ang = .3 + lev * 1.9 - fr * 2.4 + (tour ? Math.sin(t * 7) * .5 : 0);
  for (const s of [-1, 1]) {
    const Sh = [.04, s * .3, z + 1.05];
    let Hd = [Sh[0] + Math.cos(ang) * .5, s * .12, Sh[2] + Math.sin(ang) * .5 - .2];
    if (vise && s > 0) Hd = [Sh[0] - .25 + (E === 'lancer' ? .7 : 0), s * .38, Sh[2] + .05];
    if (tour) Hd = [Sh[0] + Math.cos(t * 7 + (s > 0 ? 0 : Math.PI)) * .5, s * .4, Sh[2] + .1];
    os2(Sh, mi3(Sh, Hd), .13, peau); os2(mi3(Sh, Hd), Hd, .11, peau);
  }
  if (!vise && !tour) {
    const M = [.04 + Math.cos(ang) * .5, 0, z + 1.05 + Math.sin(ang) * .5 - .2], tip = [M[0] + Math.cos(ang) * .7, 0, M[2] + Math.sin(ang) * .7];
    os2([M[0] - Math.cos(ang) * .2, 0, M[2] - Math.sin(ang) * .2], tip, .06, [70, 50, 36]);
    const nx = -Math.sin(ang), nz = Math.cos(ang);
    add([tip[0] - Math.cos(ang) * .1, .0, tip[2] - Math.sin(ang) * .1], [tip[0] + nx * .32 - Math.cos(ang) * .05, 0, tip[2] + nz * .32], .38, .05, fer);   // le fer de la hache
  }
}
// La gueule : un coffre d'obsidienne cerclé de braise, le couvercle en mâchoire, des crocs, une langue.
function osGueule(f, O) {
  const { add } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const hop = E === 'bondir' ? Math.abs(Math.sin(t * 7)) * .18 : 0, z = hop - mort * .3;
  const ouv = E === 'ouvrir' ? Math.min(1, u / .45) : E === 'croquer' ? Math.max(0, 1 - u / .12) : E === 'surgir' ? Math.sin(Math.min(1, u / .8) * Math.PI) : .25 + .1 * Math.sin(t * 6);
  add([-.45, 0, z + .05], [.45, 0, z + .05], .6, .5, [30, 24, 28]);
  add([-.47, 0, z + .38], [.47, 0, z + .38], .64, .06, [200, 70, 30], true);
  const a = ouv * 1.1, c = Math.cos(a), s = Math.sin(a);                      // le couvercle pivote sur l'arrière
  add([-.45, 0, z + .55], [-.45 + .9 * c, 0, z + .55 + .9 * s], .6, .12, [38, 30, 34]);
  for (let k = 0; k < 5; k++) { const x = -.35 + k * .17;
    add([x, .24, z + .55], [x, .24, z + .44], .05, .05, [236, 226, 210]);
    add([-.45 + (x + .45) * c, .24, z + .55 + (x + .45) * s], [-.45 + (x + .45) * c + .02, .24, z + .55 + (x + .45) * s - .1], .05, .05, [236, 226, 210]); }
  if (ouv > .2) { add([-.1, 0, z + .5], [.3, 0, z + .48 + ouv * .1], .22, .05, [190, 40, 50]);
    for (const y of [-.12, .12]) add([.1, y, z + .6 + ouv * .1], [.12, y, z + .6 + ouv * .1], .05, .05, [255, 200, 80], true); }
  for (const [x, y] of [[-.3, -.2], [-.3, .2], [.3, -.2], [.3, .2]]) add([x, y, z + .05], [x + .04, y, z - .05], .08, .08, [24, 18, 20]);
}

// ============================================================
//  LES PACTES (§164)
//  Dans la salle d'arrivée des cercles 2 et suivants, un autel de basalte en propose trois (tirés de la graine
//  et du cercle) ; on en prend un, qui dure jusqu'à la remontée (ou la mort), et s'ajoute aux autres.
// ============================================================
const PACTES = {
  braise: { n: 'Braise', plus: 'vos coups brûlent', moins: 'la lave et le feu vous brûlent deux fois plus', c: [255, 120, 40] },
  sang: { n: 'Sang', plus: 'chaque coup porté vous rend un peu de vie', moins: 'votre vie ne dépasse plus les trois quarts', c: [210, 30, 44] },
  avarice: { n: 'Avarice', plus: 'le butin des coffres est doublé', moins: 'un coffre sur quatre a des dents', c: [236, 194, 80] },
  fer: { n: 'Fer', plus: 'vous encaissez 30 % de moins', moins: 'vous allez 15 % moins vite', c: [160, 168, 184] },
  ombre: { n: 'Ombre', plus: 'les bêtes vous voient deux fois moins loin', moins: 'rien ne vous soigne', c: [140, 110, 200] },
  hate: { n: 'Hâte', plus: 'vous allez et frappez 20 % plus vite', moins: 'chaque coup reçu fait 25 % de plus', c: [110, 230, 210] },
};
const pacte = id => typeof roiIci === 'function' && roiIci() && Array.isArray(DJ.etat.pactes) && DJ.etat.pactes.includes(id);
const pacteSubi = () => (pacte('fer') ? .7 : 1) * (pacte('hate') ? 1.25 : 1);
const pacteVitesse = () => (pacte('fer') ? .85 : 1) * (pacte('hate') ? 1.2 : 1) * (typeof roiEntrave === 'function' ? roiEntrave() : 1);   // (§166) tenu par une liane
const pacteCadence = () => pacte('hate') ? .8 : 1;
const pacteVue = () => pacte('ombre') ? .5 : 1;
function pacteCoup(b) {                                      // appelé quand un de vos coups porte
  if (b && typeof roiCoupArme === 'function') roiCoupArme(b);   // (§166) la lame de soufre, le fouet
  if (!roiIci() || !b) return;
  if (pacte('braise')) b.brule = t + 2.5;
  if (pacte('sang')) P.pv = Math.min(.75, P.pv + .02);
}
function pactesOfferts() {                                   // les trois de l'autel de ce cercle (sans ceux déjà pris)
  const R = djAlea(djHash(SEED ^ Math.imul(DJ.e, 0x9e3779b1) ^ 0xa17a)), L = Object.keys(PACTES).filter(id => !(DJ.etat.pactes || []).includes(id));
  for (let i = L.length - 1; i > 0; i--) { const j = R() * (i + 1) | 0; [L[i], L[j]] = [L[j], L[i]]; }
  return L.slice(0, 3);
}
// L'entretien des pactes, à chaque image : le Sang plafonne la vie, l'Ombre l'empêche de remonter, la Braise
// consume les bêtes qu'on a frappées.
function majPactes(dt) {
  if (pacte('sang') && P.pv > .75) P.pv = .75;
  if (pacte('ombre')) { if (ROI.pvOmbre != null && P.pv > ROI.pvOmbre) P.pv = ROI.pvOmbre; ROI.pvOmbre = P.pv; } else ROI.pvOmbre = null;

}
function roiHud() {
  const L = roiIci() && DJ.etat && DJ.etat.pactes || [];
  return L.length ? ' · PACTES <b style="color:#ffb07a">' + L.map(id => PACTES[id] ? PACTES[id].n : id).join(' · ') + '</b>' : '';
}
// L'autel : un panneau, trois pactes, l'avantage et le prix de chacun.
let autelEl = null;
function ouvrirAutel() {
  if (!roiIci() || (DJ.etat.autels || []).includes(DJ.e)) return;
  const L = pactesOfferts(); if (!L.length) { say('l\'autel n\'a plus rien à offrir', 2); return; }
  if (!autelEl) {
    const st = document.createElement('style');
    st.textContent = `#autel{position:fixed;z-index:6;left:50%;transform:translateX(-50%);bottom:calc(150px + env(safe-area-inset-bottom));width:min(620px,calc(100% - 32px));
      box-sizing:border-box;padding:12px 14px;border-radius:12px;display:none;background:rgba(20,12,14,.94);border:1px solid rgba(255,120,60,.35);
      box-shadow:0 8px 28px rgba(0,0,0,.5);color:#e8d6cc;font-size:14px;pointer-events:auto}
      #autel.ouvert{display:block}#autel h4{margin:0 0 4px;color:#ffb07a;font-size:14px;letter-spacing:.5px}#autel p{margin:0 0 10px;color:#a8928a;font-size:12px}
      #autel .pactes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
      #autel button{font:inherit;text-align:left;cursor:pointer;padding:9px 10px;border-radius:9px;background:rgba(48,26,24,.9);border:1px solid rgba(255,140,80,.25);color:#e8d6cc;line-height:1.35}
      #autel button:hover{border-color:var(--c)}#autel b{display:block;color:var(--c);margin-bottom:4px}#autel .p{color:#bfe6b0;font-size:12px}#autel .m{color:#f0a0a0;font-size:12px}
      #autel .non{margin-top:8px;width:100%;text-align:center;font-size:12px;color:#a8928a}
      @media (max-width:600px){#autel .pactes{grid-template-columns:1fr}}`;
    document.head.appendChild(st);
    autelEl = document.createElement('div'); autelEl.id = 'autel'; document.body.appendChild(autelEl);
    for (const ev of ['pointerdown', 'touchstart', 'mousedown']) autelEl.addEventListener(ev, e => e.stopPropagation(), { passive: true });
    addEventListener('keydown', e => {
      if (!autelEl.classList.contains('ouvert')) return;
      const k = e.code, n = /^(Digit|Numpad)[1-3]$/.test(k) ? +k.slice(-1) : 0;
      if (n || k === 'Escape') { e.preventDefault(); e.stopPropagation(); if (k === 'Escape') fermerAutel(); else choisirPacte(autelEl._L[n - 1]); }
    }, true);
  }
  autelEl._L = L;
  autelEl.innerHTML = `<h4>L'autel de basalte · ${ROI_NOMS[DJ.e]}</h4><p>Un pacte, jusqu'à la remontée. Il s'ajoute à ceux que vous portez déjà.</p><div class="pactes">`
    + L.map((id, i) => { const p = PACTES[id]; return `<button data-p="${id}" style="--c:rgb(${p.c.join(',')})"><b>${i + 1} · ${p.n}</b><span class="p">+ ${p.plus}</span><br><span class="m">− ${p.moins}</span></button>`; }).join('')
    + `</div><button class="non">Refuser (Échap)</button>`;
  autelEl.querySelectorAll('[data-p]').forEach(bt => bt.onclick = e => { e.stopPropagation(); choisirPacte(bt.dataset.p); });
  autelEl.querySelector('.non').onclick = e => { e.stopPropagation(); fermerAutel(); };
  autelEl.classList.add('ouvert'); ROI.autelOuvert = true;
}
function fermerAutel() { if (autelEl) autelEl.classList.remove('ouvert'); ROI.autelOuvert = false; }
function choisirPacte(id) {
  if (!PACTES[id] || !roiIci()) return;
  DJ.etat.pactes = (DJ.etat.pactes || []).concat(id); DJ.etat.autels = (DJ.etat.autels || []).concat(DJ.e); Sauve.sale = true;
  fermerAutel(); SON.jouer('rare', {}, P.x, P.y, P.z + 1); burst(ROI.autel.x, ROI.autel.y, DJ_Z0 + 1, 24, '#' + PACTES[id].c.map(v => v.toString(16).padStart(2, '0')).join(''));
  say('pacte de ' + PACTES[id].n + ' · ' + PACTES[id].plus + ' · ' + PACTES[id].moins + ' · jusqu\'à la remontée', 5);
}
// Un ingrédient démoniaque, trouvé en bas : il ne reste qu'une fois remonté (djRendre le reprend sinon).
function roiDonnerIngr(id, n) {
  if (!n || typeof INGR === 'undefined' || !INGR[id]) return '';
  metSacIngr(id, sacIngr(id) + n);
  const g = DJ.etat.ing || (DJ.etat.ing = {}); g[id] = (g[id] || 0) + n; Sauve.sale = true;
  return '+' + n + ' ' + INGR[id].court;
}
// Une gueule : le coffre s'ouvre sur des crocs.
function roiGueule(c) {
  const b = naitre(specById.gueule, c.x, c.y); b.variante = null; b.z = DJ_Z0; b.pv = 1; b.age = 1e6; b.ech = 1; b.vie = Infinity;
  b.djSalle = c.salle; b.home = [c.x, c.y]; b.dir = b.dirT = Math.atan2(P.y - c.y, P.x - c.x); b.etat = 'surgir'; b.etT = t; b.coffre = c; b.blinde = 1;
  beasts.push(b); c.gueule = b;
  SON.jouer('rugDemon', { vol: .5 }, c.x, c.y, c.z + .5); say('le coffre a des dents', 2.2);
}

// ============================================================
//  LE TROISIÈME CERCLE : LES OSSUAIRES (§165)
//  Des catacombes noires : il y fait nuit (lumiere, index.html), seules la lave et votre lanterne éclairent
//  (roiLueurs ajoute aux lumières de la nuit les bassins, les rigoles, les dalles ouvertes et les âmes). Les
//  murs sont d'os : des niches de crânes, des fémurs empilés. Les ÂMES EN PEINE errent à travers les murs
//  et boivent la vie de qui les laisse approcher ; la lumière d'une lanterne les repousse. Les GARGOUILLES
//  ne bougent que quand on leur tourne le dos (et dans leur galerie, toutes ne sont pas vivantes). Pièges :
//  des DALLES s'ouvrent sur la lave (un déclic, une demi-seconde), des PLAFONDS s'effondrent (une ombre
//  grandit au sol pendant un peu plus d'une seconde). Le gardien : LE CHŒUR DES DAMNÉS, trois voix liées ;
//  une voix abattue se relève au bout de six secondes si les deux autres chantent encore.
// ============================================================
const OSS_BIO = { mur: 19, salle: 5, couloir: 5 };
const roiNoir = () => roiIci() && DJ.e === 3;
const roiCiel = () => DJ.e === 3 ? [5, 5, 8] : DJ.e === 4 ? [74, 56, 20] : [30, 7, 6];
const roiTerreNue = () => roiIci() && (DJ.e === 3 || DJ.e === 4);   // (§166) le sol garde ses couleurs : l'os, le soufre ; seule la lave est de lave
const roiVoile = () => roiIci() && DJ.e === 4 ? [.36, .28, .06, .2] : null;   // la brume de soufre
const OS_C = { os: [214, 204, 182], os2: [168, 156, 136], noir: [14, 12, 14], pierre: [72, 68, 66], pierre2: [90, 86, 82] };
const RELEVE = 6;
const VOIX = [{ c: [204, 230, 238], c2: [126, 170, 188], hex: '#c8f0ff' }, { c: [224, 210, 242], c2: [150, 130, 188], hex: '#e4d2ff' },
  { c: [240, 228, 200], c2: [178, 158, 120], hex: '#ffeec8' }];
function genOssuaires() {
  const R = djAlea(djHash(SEED ^ Math.imul(DJ.e, 0x7f4a7c15) ^ 0x401d)), Z0 = DJ_Z0, HM = DJ_Z0 + DJ_MUR, BI = OSS_BIO;
  Hgt.fill(HM); Bio.fill(BI.mur); Eau.fill(0); PlT.fill(0); PlB.fill(0);
  ROI.ponts = []; ROI.coulees = []; ROI.pilons = []; ROI.chaines = []; ROI.pontDit = false;
  const salles = roiPlan(R, 17, 17, 'choeur', BI);
  const roles = ['crypte', 'ossuaire', 'fosse', 'gargouilles', 'piege', 'ossuaire', 'crypte', 'effondre', 'fosse', 'gargouilles'];
  let kr = R() * 5 | 0;
  for (const q of salles) if (!q.role) q.role = roles[kr++ % roles.length];
  { const q = salles.find(o => o.role === 'effondre') || salles.find(o => o.role === 'piege' || o.role === 'crypte'); if (q) q.role = 'reliquaire'; }   // (§166)
  const lave = (x, y) => { const i = y * WS + x; if (Hgt[i] === Z0) { Hgt[i] = Z0 - 1; Eau[i] = Z0; } };
  const bassin = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) lave(xx, yy); return [x, y, w, h]; };
  for (const q of salles) {
    q.bassins = [];
    if (q.role === 'fosse') {                                  // une fosse de lave au milieu
      const w = Math.max(3, Math.min(6, q.w - 6)), h = Math.max(2, Math.min(5, q.h - 6));
      q.bassins.push(bassin((q.cx - w / 2) | 0, (q.cy - h / 2) | 0, w, h));
    } else if (q.role === 'ossuaire') {                       // une rigole de lave au pied du mur du fond (pas devant une porte)
      q.rigole = [];
      for (let x = q.x + 2; x < q.x + q.w - 2; x++) if ([-1, 0, 1].every(d => Hgt[(q.y - 1) * WS + x + d] > Z0)) { lave(x, q.y); q.rigole.push(x); }
    } else if (q.role === 'arrivee') q.bassins.push(bassin(q.x + q.w - 4, q.y + q.h - 4, 2, 2));
    else if (q.role === 'choeur') {                           // un puits au centre, un bassin à chaque coin
      q.bassins.push(bassin((q.cx | 0) - 1, (q.cy | 0) - 1, 2, 2));
      for (const [x, y] of [[q.x + 3, q.y + 3], [q.x + q.w - 5, q.y + 3], [q.x + 3, q.y + q.h - 5], [q.x + q.w - 5, q.y + q.h - 5]]) q.bassins.push(bassin(x, y, 2, 2));
    }
  }
  roiEscalier(salles[0], BI);
  DJ.salles = salles;
  calcOmbrage();
  return true;
}
function peuplerOssuaires(H) {
  const { R, Z0, st, deco, sec, bete, coffre, dans } = H, C = OS_C;
  ROI.autel = null; ROI.salleGarde = 0; ROI.dalles = []; ROI.dalleDe = new Map(); ROI.eboulis = []; ROI.ondes = []; ROI.choeur = null; ROI.lueurs = [];
  const unit = a => [Math.cos(a), Math.sin(a)];
  // un crâne qui regarde (nx, ny) : la boîte, la bande noire des orbites
  const crane = (x, y, z, nx, ny, k = 1) => {
    deco([x - nx * .11 * k, y - ny * .11 * k, z], [x + nx * .11 * k, y + ny * .11 * k, z], .22 * k, .2 * k, C.os);
    deco([x + nx * .11 * k, y + ny * .11 * k, z + .025 * k], [x + nx * .125 * k, y + ny * .125 * k, z + .025 * k], .16 * k, .055 * k, C.noir);
  };
  // une niche dans le mur : le creux noir, une tablette, trois crânes, deux au-dessus
  const niche = (bx, by, tx, ty, nx, ny) => {
    deco([bx - tx * .46 + nx * .03, by - ty * .46 + ny * .03, Z0 + 1.5], [bx + tx * .46 + nx * .03, by + ty * .46 + ny * .03, Z0 + 1.5], .06, 1.1, C.noir);
    deco([bx - tx * .52 + nx * .1, by - ty * .52 + ny * .1, Z0 + .97], [bx + tx * .52 + nx * .1, by + ty * .52 + ny * .1, Z0 + .97], .2, .07, C.os2);
    for (const s of [-.28, 0, .28]) crane(bx + tx * s + nx * .15, by + ty * s + ny * .15, Z0 + 1.12, nx, ny);
    for (const s of [-.15, .15]) crane(bx + tx * s + nx * .13, by + ty * s + ny * .13, Z0 + 1.42, nx, ny, .92);
  };
  // les murs d'une salle : des fémurs empilés en deux rangs, une niche toutes les `pas` cases
  const habiller = (q, pas) => {
    const M = [
      { o: [q.x, q.y], T: [1, 0], N: [0, 1], L: q.w, mur: k => Hgt[(q.y - 1) * WS + q.x + k] > Z0 },
      { o: [q.x, q.y + q.h], T: [1, 0], N: [0, -1], L: q.w, mur: k => Hgt[(q.y + q.h) * WS + q.x + k] > Z0 },
      { o: [q.x, q.y], T: [0, 1], N: [1, 0], L: q.h, mur: k => Hgt[(q.y + k) * WS + q.x - 1] > Z0 },
      { o: [q.x + q.w, q.y], T: [0, 1], N: [-1, 0], L: q.h, mur: k => Hgt[(q.y + k) * WS + q.x + q.w] > Z0 }];
    for (const m of M) {
      let run = -1;
      for (let k = 0; k <= m.L; k++) {
        const plein = k < m.L && m.mur(k);
        if (plein && run < 0) run = k;
        if (plein || run < 0) continue;
        const a = run + .1, b = k - .1, P0 = [m.o[0] + m.T[0] * a, m.o[1] + m.T[1] * a], P1 = [m.o[0] + m.T[0] * b, m.o[1] + m.T[1] * b];
        for (const z of [.3, .6]) deco([P0[0] + m.N[0] * .1, P0[1] + m.N[1] * .1, Z0 + z], [P1[0] + m.N[0] * .1, P1[1] + m.N[1] * .1, Z0 + z], .2, .24, z < .5 ? C.os2 : C.os);
        for (let u = run + 1.5 + ((k - run - 3) % pas) / 2; u < k - 1.4; u += pas) niche(m.o[0] + m.T[0] * u, m.o[1] + m.T[1] * u, m.T[0], m.T[1], m.N[0], m.N[1]);
        run = -1;
      }
    }
  };
  const tas = (x, y) => {                                    // un tas d'os, deux crânes dessus
    for (let k = 0; k < 7; k++) { const a = R() * 6.28, l = .26 + R() * .2, z = Z0 + .04 + R() * .2, dx = (R() - .5) * .8, dy = (R() - .5) * .8;
      deco([x + dx - Math.cos(a) * l / 2, y + dy - Math.sin(a) * l / 2, z], [x + dx + Math.cos(a) * l / 2, y + dy + Math.sin(a) * l / 2, z + (R() - .5) * .12], .07, .07, k & 1 ? C.os : C.os2); }
    for (const [dx, dy, z] of [[0, 0, .32], [.32, -.2, .12]]) { const [nx, ny] = unit(R() * 6.28); crane(x + dx, y + dy, Z0 + z, nx, ny); }
  };
  const sarco = (x, y, a, ouvert) => {                       // un sarcophage : la cuve, le couvercle (parfois glissé), un gisant
    const dx = Math.cos(a), dy = Math.sin(a), ox = ouvert ? -dy * .38 : 0, oy = ouvert ? dx * .38 : 0, gis = [104, 100, 96];
    deco([x - dx * .95, y - dy * .95, Z0 + .38], [x + dx * .95, y + dy * .95, Z0 + .38], .9, .76, C.pierre);
    if (ouvert) deco([x - dx * .85, y - dy * .85, Z0 + .77], [x + dx * .85, y + dy * .85, Z0 + .77], .72, .02, C.noir);
    deco([x - dx + ox, y - dy + oy, Z0 + .83], [x + dx + ox, y + dy + oy, Z0 + .83 + (ouvert ? .06 : 0)], 1.02, .12, C.pierre2);
    deco([x - dx * .55 + ox, y - dy * .55 + oy, Z0 + .96], [x + dx * .4 + ox, y + dy * .4 + oy, Z0 + .96], .36, .14, gis);
    deco([x + dx * .46 + ox, y + dy * .46 + oy, Z0 + .99], [x + dx * .7 + ox, y + dy * .7 + oy, Z0 + .99], .22, .19, gis);
    deco([x + dx * .1 + ox, y + dy * .1 + oy, Z0 + 1.06], [x + dx * .24 + ox, y + dy * .24 + oy, Z0 + 1.06], .14, .08, [94, 90, 86]);
  };
  const socle = (x, y) => { deco([x, y, Z0], [x, y, Z0 + .5], .9, .9, C.pierre); deco([x, y, Z0 + .5], [x, y, Z0 + .58], 1.04, 1.04, C.pierre2); };
  const pieu = (x, y, a) => { if (!sec(x, y)) return; deco([x, y, Z0], [x, y, Z0 + 1.1], .09, .09, C.os2); const [nx, ny] = unit(a); crane(x, y, Z0 + 1.22, nx, ny, 1.05); };
  const bord = B => {                                        // le rebord de pierre d'un bassin de lave
    const [x, y, w, h] = B;
    for (const [a, b] of [[[x - .05, y - .05], [x + w + .05, y - .05]], [[x - .05, y + h + .05], [x + w + .05, y + h + .05]], [[x - .05, y], [x - .05, y + h]], [[x + w + .05, y], [x + w + .05, y + h]]])
      deco([a[0], a[1], Z0 + .08], [b[0], b[1], Z0 + .08], .14, .18, C.pierre2);
  };
  const orgue = q => {                                       // l'orgue d'os du Chœur, contre le mur du bas
    const y = q.y + q.h - .3, x0 = q.cx;
    deco([x0 - 2.1, y, Z0 + .22], [x0 + 2.1, y, Z0 + .22], .5, .44, C.pierre);
    for (let k = -5; k <= 5; k++) { const h = 3 - Math.abs(k) * .3 + (k & 1) * .22, x = x0 + k * .36;
      deco([x, y, Z0 + .44], [x, y, Z0 + .44 + h], .24, .24, k & 1 ? C.os2 : C.os);
      deco([x, y - .12, Z0 + .44 + h * .78], [x, y - .14, Z0 + .44 + h * .78], .14, .07, C.noir); }
    crane(x0, y - .4, Z0 + .74, 0, -1, 1.7); crane(x0 - 1.3, y - .35, Z0 + .62, 0, -1, 1.15); crane(x0 + 1.3, y - .35, Z0 + .62, 0, -1, 1.15);
  };
  const dalle = (x, y) => { const i = y * WS + x; if (ROI.dalleDe.has(i) || Hgt[i] !== Z0 || Eau[i] > Hgt[i] || DJ.monte.some(m => Math.hypot(m.x - x - .5, m.y - y - .5) < 2)) return;
    const d = { i, x: x + .5, y: y + .5, etat: 'ok', t: -99 }; ROI.dalles.push(d); ROI.dalleDe.set(i, d); };
  const eboulis = (x, y) => ROI.eboulis.push({ x, y, etat: 'ok', t: -99, r: 1.3, roc: Array.from({ length: 6 }, () => [(R() - .5) * 1.5, (R() - .5) * 1.5, .26 + R() * .26]) });
  const garg = (x, y, a, vive, s) => { socle(x, y); bete('gargouille', x, y, s, b => { b.etat = 'statue'; b.inerte = !vive; b.socle = [x, y]; b.dir = b.dirT = a; }); };
  DJ.salles.forEach((q, s) => {
    const cx = q.cx, cy = q.cy;
    habiller(q, q.role === 'choeur' ? 3 : 4);
    for (const B of q.bassins || []) bord(B);
    for (let k = 0; k < 4; k++) { const [x, y] = dans(q, 1.2); if (!sec(x, y)) continue; const a = R() * 6.28, l = .3 + R() * .15;   // des os épars
      deco([x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2, Z0 + .04], [x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2, Z0 + .04], .065, .065, C.os2); }
    if (q.role === 'arrivee') {
      DJ.monte.push({ x: q.x + 1.6, y: q.y + 1.6, z: Z0 });
      ROI.autel = { x: cx, y: cy };
    } else if (q.role === 'choeur') {
      ROI.salleGarde = s;
      coffre(q.x + q.w - 2.2, q.y + 2, 'garde', s);
      DJ.monte.push({ x: q.x + 1.6, y: q.y + q.h - 1.6, z: Z0 });
      ROI.sceau = { x: DJ.escalier.x, y: DJ.escalier.y - 1 };
      orgue(q);
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832 + .3927; pieu(cx + Math.cos(a) * 6.4, cy + Math.sin(a) * 6.4, a + Math.PI); }
      // le Chœur : trois voix ; si une partie seulement a été abattue (la page rechargée), elles reviennent toutes
      const k0 = H.prochain(), v = [0, 1, 2].map(j => st.vaincus.includes(k0 + j));
      if (v.some(Boolean) && !v.every(Boolean)) st.vaincus = st.vaincus.filter(k => k < k0 || k > k0 + 2);
      ROI.choeur = { s, cx, cy, ang: Math.PI / 2, eveil: false, morts: new Map(), fen: null, accord: null, accordT: 0, fini: v.every(Boolean) };
      for (let j = 0; j < 3; j++) { const a = Math.PI / 2 + j * 2.0944; bete('choeur', cx + Math.cos(a) * 4.6, cy + Math.sin(a) * 4.6, s, b => { b.voix = j; b.etat = 'chant'; b.dir = b.dirT = a + Math.PI; }); }
    } else if (q.role === 'crypte') {
      const hor = q.w >= q.h, L = hor ? q.w : q.h, o = Math.min(2.6, (hor ? q.h : q.w) / 2 - 1.6), n = Math.max(1, Math.floor((L - 4) / 3));
      for (let k = 0; k < n; k++) for (const sd of [-1, 1]) {
        const p = (hor ? q.x : q.y) + 2 + (k + .5) * (L - 4) / n;
        sarco(hor ? p : cx + sd * o, hor ? cy + sd * o : p, hor ? Math.PI / 2 : 0, R() < .35);
      }
      tas(q.x + 1.4, q.y + q.h - 1.4);
      const [x, y] = hor ? [q.x + q.w - 1.6, cy] : [cx, q.y + q.h - 1.6]; if (sec(x, y)) coffre(x, y, 'petit', s);
      { const [a, b] = dans(q, 2); bete('ame_peine', a, b, s); }
      if (R() < .5) { const x2 = q.x + q.w - 1.4, y2 = q.y + 1.4; garg(x2, y2, Math.atan2(cy - y2, cx - x2), true, s); }
    } else if (q.role === 'ossuaire') {
      if (q.rigole && q.rigole.length) {                     // le rebord de la rigole, par tronçons
        let a = q.rigole[0], p = a;
        for (const x of [...q.rigole.slice(1), -9]) { if (x === p + 1) { p = x; continue; } deco([a - .02, q.y + 1.05, Z0 + .08], [p + 1.02, q.y + 1.05, Z0 + .08], .14, .18, C.pierre2); a = p = x; }
      }
      tas(q.x + 1.5, q.y + q.h - 1.5); tas(q.x + q.w - 1.5, q.y + q.h - 1.5);
      for (let k = 0; k < 3; k++) { const [x, y] = dans(q, 2); ROI.chaines.push({ x, y, L: 1.2 + R() * 1.4, ph: R() * 6.28, croc: 1 }); }
      for (let k = 0; k < 2 + (q.w * q.h > 120 ? 1 : 0); k++) { const [x, y] = dans(q, 2); bete('ame_peine', x, y, s); }
    } else if (q.role === 'fosse') {
      const [x0, y0, w, h] = q.bassins[0];
      for (const [x, y] of [[x0 - .6, y0 - .6], [x0 + w + .6, y0 - .6], [x0 - .6, y0 + h + .6], [x0 + w + .6, y0 + h + .6]]) pieu(x, y, Math.atan2(cy - y, cx - x) + Math.PI);
      const [x, y] = q.w >= q.h ? [q.x + q.w - 1.6, q.y + 1.6] : [q.x + 1.6, q.y + q.h - 1.6]; if (sec(x, y)) coffre(x, y, 'petit', s);
      bete('ame_peine', q.cx + .5, y0 - 1.2, s);
    } else if (q.role === 'gargouilles') {                   // la galerie : des statues sur leurs socles, et toutes ne sont pas de pierre
      const hor = q.w >= q.h, L = hor ? q.w : q.h, n = Math.max(2, Math.floor((L - 3) / 3)), nv = Math.min(n * 2, 2 + (L > 12 ? 1 : 0)), viv = new Set();
      while (viv.size < nv) viv.add(R() * n * 2 | 0);
      let j = 0;
      for (let k = 0; k < n; k++) for (const sd of [-1, 1]) {
        const p = (hor ? q.x : q.y) + 1.5 + (k + .5) * (L - 3) / n;
        const x = hor ? p : (sd < 0 ? q.x + 1.3 : q.x + q.w - 1.3), y = hor ? (sd < 0 ? q.y + 1.3 : q.y + q.h - 1.3) : p;
        garg(x, y, hor ? (sd < 0 ? Math.PI / 2 : -Math.PI / 2) : (sd < 0 ? 0 : Math.PI), viv.has(j++), s);
      }
      const [x, y] = hor ? [q.x + q.w - 1.5, cy] : [cx, q.y + q.h - 1.5]; if (sec(x, y)) coffre(x, y, 'petit', s);
    } else if (q.role === 'piege') {                         // des dalles piégées, un coffre au milieu
      for (let y = q.y + 1; y < q.y + q.h - 1; y++) for (let x = q.x + 1; x < q.x + q.w - 1; x++) if (R() < .28 && Math.hypot(x + .5 - cx, y + .5 - cy) > 1.2) dalle(x, y);
      coffre(cx, cy, 'petit', s);
      { const [x, y] = dans(q, 2); eboulis(x, y); }
      tas(q.x + 1.4, q.y + 1.4);
    } else if (q.role === 'effondre') {
      for (let k = 0; k < 3; k++) { const [x, y] = dans(q, 1.8); if (!ROI.eboulis.some(e => Math.hypot(e.x - x, e.y - y) < 3)) eboulis(x, y); }
      tas(cx, cy);
      const [x, y] = dans(q, 2); bete('ame_peine', x, y, s);
      if (R() < .5) { const [a, b] = dans(q, 2.4); coffre(a, b, 'petit', s); }
    } else if (q.role === 'reliquaire') peuplerReliquaire(H, q, s);   // (§166)
  });
  // le coffre scellé : la clé d'os du Chœur l'ouvre (dans une crypte, sinon ailleurs)
  const qs = DJ.salles.findIndex(q => q.role === 'crypte') >= 0 ? DJ.salles.findIndex(q => q.role === 'crypte') : DJ.salles.findIndex(q => q.role !== 'arrivee' && q.role !== 'choeur');
  if (qs >= 0) { const q = DJ.salles[qs]; coffre(q.x + 1.8, q.y + 1.8, 'scelle', qs); }
  // dans les couloirs : des dalles piégées, des plafonds qui tiennent mal, quelques tas d'os
  const couloir = [];
  for (let y = 3; y < WS - 3; y++) for (let x = 3; x < WS - 3; x++) if (Hgt[y * WS + x] === Z0 && !djSalleDe(x, y)) couloir.push([x, y]);
  for (let k = 0, n = 0; k < 400 && n < 7 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0]; if (ROI.dalles.some(d => Math.hypot(d.x - x, d.y - y) < 7)) continue; dalle(x, y); n++; }
  for (let k = 0, n = 0; k < 400 && n < 4 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0];
    if (ROI.eboulis.some(e => Math.hypot(e.x - x, e.y - y) < 9) || DJ.monte.some(m => Math.hypot(m.x - x, m.y - y) < 6)) continue; eboulis(x + .5, y + .5); n++; }
  for (let k = 0; k < 5 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0]; tas(x + .5, y + .5); }
  for (let k = 0; k < 3 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0]; bete('ame_peine', x + .5, y + .5, -1); }
  // les lumières de la lave : une par paquet de trois cases sur trois
  const Bq = new Map();
  for (let i = 0; i < WS * WS; i++) if (Eau[i] > Hgt[i]) { const x = i % WS, y = i / WS | 0, k = ((y / 3) | 0) * 1000 + ((x / 3) | 0), o = Bq.get(k) || { x: 0, y: 0, n: 0 }; o.x += x + .5; o.y += y + .5; o.n++; Bq.set(k, o); }
  for (const o of Bq.values()) ROI.lueurs.push({ x: o.x / o.n, y: o.y / o.n, r: 3.2 + Math.min(2.2, o.n * .35) });
}

// À chaque image : les dalles, les plafonds, la poussière, le Chœur et ses ondes
function majOssuaires(dt, J) {
  const Z0 = DJ_Z0, sur = (Q, i) => (Q.x | 0) === i % WS && (Q.y | 0) === (i / WS | 0);
  for (const Q of J) if (Q.pv > 0 && Q.z < Z0 + .3) { const d = ROI.dalleDe.get((Q.y | 0) * WS + (Q.x | 0)); if (d && d.etat === 'ok') { d.etat = 'clic'; d.t = t; SON.jouer('clic', { vol: 1 }, d.x, d.y, Z0); } }
  for (const d of ROI.dalles) {
    if (d.etat === 'clic' && t - d.t > .45) {                 // elle s'ouvre sur la lave
      d.etat = 'ouverte'; d.t = t; Hgt[d.i] = Z0 - 1; Eau[d.i] = Z0; signalDecor('dalle', d.i);
      SON.jouer('terre', {}, d.x, d.y, Z0); burst(d.x, d.y, Z0 + .1, 10, '#ff7a20');
      for (const Q of J) if (sur(Q, d.i)) { coupBrume({ x: d.x, y: d.y, z: Z0 - 1, sp: {} }, Q, .05); if (Q === P) say('la dalle s\'ouvre sur la lave', 1.6); }
    } else if (d.etat === 'ouverte' && t - d.t > 4 && !J.some(Q => sur(Q, d.i))) {   // et se referme
      d.etat = 'ok'; Hgt[d.i] = Z0; Eau[d.i] = 0; signalDecor('dalle', d.i); burst(d.x, d.y, Z0 + .1, 5, '#5a524c'); SON.jouer('clic', {}, d.x, d.y, Z0);
    }
  }
  for (const e of ROI.eboulis) {
    if (e.etat === 'ok') { if (J.some(Q => (Q.x - e.x) ** 2 + (Q.y - e.y) ** 2 < 3.4 && Q.z < Z0 + 1)) { e.etat = 'ombre'; e.t = t; SON.jouer('grattement', {}, e.x, e.y, Z0 + 2); } continue; }
    const u = t - e.t;
    if (e.etat === 'ombre') {                                 // la poussière tombe, l'ombre grandit
      if (Math.random() < dt * (14 + u * 30)) parts.push({ x: e.x + (Math.random() - .5) * e.r * 1.5, y: e.y + (Math.random() - .5) * e.r * 1.5, z: Z0 + DJ_MUR - .15, vx: 0, vy: 0, vz: -.5, g: 7, life: .8, age: 0, col: Math.random() < .5 ? '#8a8078' : '#5a524c', tl: .045 });
      if (u > 1.2) { e.etat = 'chute'; e.t = t; }
    } else if (e.etat === 'chute' && u > .28) {               // les pierres touchent le sol
      e.etat = 'fait'; e.t = t;
      SON.jouer('effondre', {}, e.x, e.y, Z0); SON.jouer('impact', {}, e.x, e.y, Z0);
      if ((e.x - P.x) ** 2 + (e.y - P.y) ** 2 < 64) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .45); }
      for (const Q of J) { const dx = Q.x - e.x, dy = Q.y - e.y, d = Math.hypot(dx, dy) || 1;
        if (d < e.r + .3 && Q.z < Z0 + 1.8) { coupBrume({ x: e.x, y: e.y, z: Z0, sp: {} }, Q, .16, [dx / d * 5, dy / d * 5, 2]); if (Q === P) say('le plafond s\'effondre', 1.4); } }
      for (const b of beasts) if (!b.dead && b.pv > 0 && !b.sp.gardeSalle && Math.hypot(b.x - e.x, b.y - e.y) < e.r) { b.pv -= .3 / robuste(b); b.hit = .25; if (b.pv <= 0) mourirBete(b, 'eboulis'); }
      for (let q = 0; q < 26; q++) { const a = Math.random() * 6.28, r = Math.random() * e.r;
        parts.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, z: Z0 + .2, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: 1 + Math.random() * 2, g: 6, life: 1, age: 0, col: Math.random() < .5 ? '#8a8078' : '#c8beb0', tl: .09 }); }
    }
  }
  // l'air : de la poussière qui flotte dans votre lumière, et, au loin, de pâles lueurs qui passent
  if (Math.random() < dt * 7) { const a = Math.random() * 6.28, r = Math.random() * 4;
    parts.push({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, z: Z0 + .3 + Math.random() * 2, vx: (Math.random() - .5) * .12, vy: (Math.random() - .5) * .12, vz: -.04, g: 0, life: 4, age: 0, col: '#b8ae9e', tl: .028 }); }
  if (Math.random() < dt * 1.2) { const a = Math.random() * 6.28, r = 6 + Math.random() * 8;
    parts.push({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, z: Z0 + .5 + Math.random() * 1.6, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .1, g: 0, life: 2.6, age: 0, col: '#9fd8e8', luit: 1, tl: .032 }); }
  const C = ROI.choeur;
  if (C && !C.fini) majChoeurSalle(dt, J, C);
  for (let k = ROI.ondes.length - 1; k >= 0; k--) {          // les ondes du chant : sautez par-dessus
    const o = ROI.ondes[k], r = .6 + (t - o.t0) * 5.2;
    if (r > 12) { ROI.ondes.splice(k, 1); continue; }
    o.r = r;
    for (const Q of J) { const dx = Q.x - o.x, dy = Q.y - o.y, d = Math.hypot(dx, dy) || 1;
      if (!o.vus.has(Q) && Math.abs(d - r) < .45) { o.vus.add(Q); if (Q.z < Z0 + .55) coupBrume({ x: o.x, y: o.y, z: Z0, sp: {} }, Q, .1, [dx / d * 4, dy / d * 4, 1.5]); } }
    if ((o.x - P.x) ** 2 + (o.y - P.y) ** 2 < 900) for (let j = 0; j < 8; j++) { const a = Math.random() * 6.2832;
      parts.push({ x: o.x + Math.cos(a) * r, y: o.y + Math.sin(a) * r, z: Z0 + .12 + Math.random() * .3, vx: 0, vy: 0, vz: .4, g: 0, life: .18, age: 0, col: o.col, luit: 1, tl: .07 }); }
  }
}
// La salle du Chœur : il s'éveille quand on y entre ; il tourne autour du puits, plus vite à mesure que des voix
// se taisent ; l'ACCORD (toutes les douze secondes environ) tend un triangle de lumière entre les voix vivantes,
// qui frappe qui s'y trouve encore 1,6 s plus tard. Une voix abattue se relève si les autres chantent encore
// six secondes après la première chute ; les trois à terre en même temps, le Chœur se tait.
function majChoeurSalle(dt, J, C) {
  const q = DJ.salles[C.s], Z0 = DJ_Z0;
  if (!C.eveil) {
    if (!J.some(Q => djDansSalle(q, Q.x, Q.y, .3))) return;
    C.eveil = true; C.accordT = t + 9; SON.jouer('bourdon', {}, C.cx, C.cy, Z0 + 2); say('Le Chœur des damnés entonne son chant', 3.5);
  }
  const vivants = beasts.filter(b => b.sp.corps === 'choeur' && !b.dead);
  for (const b of beasts) if (b.sp.corps === 'choeur' && b.dead && !C.morts.has(b.djIdx)) {
    C.morts.set(b.djIdx, b); if (C.fen === null) C.fen = t;
    if (vivants.length) { say(vivants.length === 2 ? 'une voix du Chœur se tait' : 'deux voix se taisent · la dernière chante seule', 2.2); SON.jouer('cri', { vol: .5 }, b.x, b.y, Z0 + 1.5); }
  }
  if (!vivants.length) {                                       // le Chœur se tait
    C.fini = true; C.fen = null; C.accord = null; ROI.ondes.length = 0;
    P.sac.eclat += 35; P.sac.os = (P.sac.os || 0) + 12; const ing = roiDonnerIngr('poussame', 3);
    say('Le Chœur des damnés se tait · +35 éclats · +12 os' + (ing ? ' · ' + ing : '') + ' · sa clé d\'os ouvre le coffre scellé, son coffre se descelle', 5.5);
    SON.jouer('niveau', {}, C.cx, C.cy, Z0); majSac(); return;
  }
  C.ang += dt * (.3 + .22 * (3 - vivants.length));
  if (C.fen !== null && t - C.fen > RELEVE) {                  // les voix éteintes se relèvent
    for (const [k, o] of C.morts) {
      o.dead = 0; o.pv = .5; o.hit = 0; o.act = null; o.etat = 'relever'; o.relT = t; o.criT = t + 3;
      if (!beasts.includes(o)) beasts.push(o);
      const i = DJ.etat.vaincus.indexOf(k); if (i >= 0) DJ.etat.vaincus.splice(i, 1);
      burst(o.x, o.y, Z0 + 1, 18, VOIX[o.voix || 0].hex);
    }
    C.morts.clear(); C.fen = null; SON.jouer('bourdon', {}, C.cx, C.cy, Z0 + 2); say('les voix éteintes se relèvent', 2.6);
  }
  if (!C.accord && vivants.length >= 2 && t > C.accordT) { C.accord = { t0: t }; SON.jouer('stridence', {}, C.cx, C.cy, Z0 + 2); }
  if (C.accord && t - C.accord.t0 > 1.6) {
    const V = vivants.map(b => [b.x, b.y]);
    for (const Q of J) if (dansAccord(V, Q.x, Q.y)) { coupBrume({ x: C.cx, y: C.cy, z: Z0, sp: {} }, Q, .2, [0, 0, 3]); if (Q === P) say('l\'accord des damnés vous transperce', 1.6); }
    SON.jouer('explosion', { vol: .5 }, C.cx, C.cy, Z0);
    for (const [x, y] of V) burst(x, y, Z0 + 1, 14, '#f0e0ff');
    C.accord = null; C.accordT = t + 11 + Math.random() * 4;
  }
  if (vivants.length > 1 && (C.cx - P.x) ** 2 + (C.cy - P.y) ** 2 < 900) for (let i = 0; i < (vivants.length === 2 ? 1 : 3); i++) {   // les liens luisent
    const a = vivants[i], b = vivants[(i + 1) % vivants.length];
    for (let j = 0; j < 2; j++) { const f = Math.random(); parts.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: Z0 + 2.3 + (Math.random() - .5) * .1, vx: 0, vy: 0, vz: 0, g: 0, life: .25, age: 0, col: '#e6f6ff', luit: 1, tl: .05 }); }
  }
  // l'âme qui attend, là où une voix est tombée
  for (const o of C.morts.values()) if (Math.random() < dt * 16)
    parts.push({ x: o.x + (Math.random() - .5) * .3, y: o.y + (Math.random() - .5) * .3, z: Z0 + .2, vx: 0, vy: 0, vz: .8 + Math.random() * .6, g: 0, life: .8, age: 0, col: VOIX[o.voix || 0].hex, luit: 1, tl: .06 });
}
function dansAccord(V, x, y) {
  if (V.length < 2) return false;
  if (V.length === 2) { const [a, b] = V, dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L));
    return Math.hypot(a[0] + dx * u - x, a[1] + dy * u - y) < .9; }
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]), p = [x, y];
  const d1 = s(p, V[0], V[1]), d2 = s(p, V[1], V[2]), d3 = s(p, V[2], V[0]);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
// Les lumières des Ossuaires, ajoutées à celles de la nuit (majFeux, index.html)
function roiLueurs(pousse) {
  if (!roiNoir()) return;
  const Z0 = DJ_Z0;
  for (const L of ROI.lueurs) if ((L.x - P.x) ** 2 + (L.y - P.y) ** 2 < 900) pousse(L.x, L.y, Z0 + .4, L.r * (1 + .06 * Math.sin(t * 6.3 + L.x) + .03 * Math.sin(t * 15.7 + L.y)));
  for (const d of ROI.dalles) if (d.etat === 'ouverte') pousse(d.x, d.y, Z0 + .3, 2.4);
  for (const b of beasts) if (!b.dead && (b.sp.corps === 'ame' || b.sp.corps === 'choeur') && !dansMur(b) && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 600)
    pousse(b.x, b.y, Z0 + 1.2, b.sp.corps === 'choeur' ? 3.4 : 2.2);
}
const dansMur = b => Hgt[(b.y | 0) * WS + (b.x | 0)] > DJ_Z0 + .5;

// Le décor qui bouge, ajouté à roiDecor
function decorOssuaires(os, pres) {
  const Z0 = DJ_Z0, plaf = Z0 + DJ_MUR;
  for (const d of ROI.dalles) if (d.etat !== 'ouverte' && pres(d.x, d.y)) {   // un joint sombre tout autour ; au déclic, il rougeoie
    const c = d.etat === 'clic', k = c ? .6 + .4 * Math.sin(t * 30) : 0, x = d.i % WS, y = d.i / WS | 0, col = c ? [255, 110 + 60 * k | 0, 40] : [70, 62, 58];
    for (const [a, b] of [[[x + .07, y + .07], [x + .93, y + .07]], [[x + .93, y + .07], [x + .93, y + .93]], [[x + .93, y + .93], [x + .07, y + .93]], [[x + .07, y + .93], [x + .07, y + .07]]])
      os([a[0], a[1], Z0 + .012], [b[0], b[1], Z0 + .012], .04, .02, col, c);
    if (c) { os([x + .2, y + .3, Z0 + .016], [x + .8, y + .7, Z0 + .016], .05, .02, col, 1); os([x + .7, y + .2, Z0 + .016], [x + .35, y + .8, Z0 + .016], .05, .02, col, 1); }
  }
  for (const e of ROI.eboulis) if (e.etat !== 'ok' && pres(e.x, e.y)) {
    const u = t - e.t;
    if (e.etat === 'ombre' || e.etat === 'chute') {        // l'ombre : une tache qui s'étend et fonce
      const k = e.etat === 'chute' ? 1 : Math.min(1, u / 1.2), r = e.r * (.35 + .65 * k), c = [56 - 40 * k | 0, 50 - 36 * k | 0, 48 - 34 * k | 0];
      os([e.x - r, e.y, Z0 + .01], [e.x + r, e.y, Z0 + .01], r * 1.15, .012, c);
      os([e.x, e.y - r, Z0 + .011], [e.x, e.y + r, Z0 + .011], r * 1.15, .012, c);
      for (const s of [-1, 1]) os([e.x - r * .7, e.y - s * r * .7, Z0 + .012], [e.x + r * .7, e.y + s * r * .7, Z0 + .012], r * 1.05, .012, c);
    }
    if (e.etat === 'chute') { const k = Math.min(1, u / .28);
      for (const r of e.roc) { const z = plaf - (plaf - Z0) * k * k; os([e.x + r[0], e.y + r[1], z], [e.x + r[0], e.y + r[1], z + r[2]], r[2] * 1.3, r[2] * 1.1, [96, 90, 84]); } }
    else if (e.etat === 'fait')                               // les gravats
      for (const r of e.roc) os([e.x + r[0], e.y + r[1], Z0], [e.x + r[0] * .85, e.y + r[1] * .85, Z0 + r[2] * .9], r[2] * 1.4, r[2] * 1.2, [96, 90, 84]);
  }
  const C = ROI.choeur;
  if (C && C.eveil && !C.fini && pres(C.cx, C.cy)) {
    const V = beasts.filter(b => b.sp.corps === 'choeur' && !b.dead && b.etat !== 'relever'), pul = .6 + .4 * Math.sin(t * 5);
    if (V.length > 1) for (let i = 0; i < (V.length === 2 ? 1 : 3); i++) {   // les liens : un fil pâle d'une voix à l'autre
      const a = V[i], b = V[(i + 1) % V.length], zA = Z0 + 2.3 + .16 * Math.sin(t * 1.6 + (a.voix || 0) * 2), zB = Z0 + 2.3 + .16 * Math.sin(t * 1.6 + (b.voix || 0) * 2);
      os([a.x, a.y, zA], [b.x, b.y, zB], .045, .045, [180 + 60 * pul | 0, 220 + 30 * pul | 0, 255], 1);
    }
    if (C.accord && V.length > 1) {                           // l'accord : le triangle au sol, qui bat de plus en plus vite
      const u = t - C.accord.t0, f = .5 + .5 * Math.sin(t * (8 + u * 16)), col = [255, 90 + 120 * f | 0, 210 + 45 * f | 0];
      const n = V.length === 2 ? 1 : 3, gx = V.reduce((s, b) => s + b.x, 0) / V.length, gy = V.reduce((s, b) => s + b.y, 0) / V.length;
      for (let i = 0; i < n; i++) { const a = V[i], b = V[(i + 1) % V.length]; os([a.x, a.y, Z0 + .03], [b.x, b.y, Z0 + .03], .16, .03, col, 1); }
      if (n === 3) for (const a of V) os([a.x, a.y, Z0 + .025], [gx, gy, Z0 + .025], .07, .02, col, 1);
    }
    for (const o of ROI.ondes) { const c = o.c || [200, 240, 255];   // les ondes
      for (let j = 0; j < 30; j++) { const a0 = j / 30 * 6.2832, a1 = (j + .72) / 30 * 6.2832;
        os([o.x + Math.cos(a0) * o.r, o.y + Math.sin(a0) * o.r, Z0 + .05], [o.x + Math.cos(a1) * o.r, o.y + Math.sin(a1) * o.r, Z0 + .05], .14, .08, c, 1); } }
    for (const o of C.morts.values()) { const f = .7 + .3 * Math.sin(t * 13 + o.x);   // la flamme pâle de la voix tombée
      os([o.x, o.y, Z0 + .05], [o.x, o.y, Z0 + .45 + .25 * f], .2 * f, .2 * f, VOIX[o.voix || 0].c, 1); }
  }
}

// ============================================================
//  LES BÊTES DES OSSUAIRES
// ============================================================
const lanterneDe = Q => Q === P ? !!porte('lumiere') : !!Q.lum;
// Boire la vie : la vôtre baisse, la sienne remonte ; un filet de lueurs va de vous à elle.
function boireVie(b, Q, k, dt) {
  if (Q === P) {
    P.pv = Math.max(0, P.pv - degSubi(k) * dt); P.dernierCoup = t;
    if (t - (ROI.boitDit || -99) > 20) { ROI.boitDit = t; say(b.sp.corps === 'choeur' ? 'le Chœur boit votre vie' : 'une âme en peine boit votre vie', 2); }
    if (P.pv <= 0) terrasse();
  } else if (t > (b.boitT || 0)) { b.boitT = t + .5; coupBrume(b, Q, k * .5); }
  b.pv = Math.min(1, b.pv + dt * k * 1.5);
  if (Math.random() < dt * 24) { const f = Math.random(), x = Q.x + (b.x - Q.x) * f, y = Q.y + (b.y - Q.y) * f, z = Q.z + 1 + ((b.z + 1.2) - (Q.z + 1)) * f;
    parts.push({ x, y, z, vx: (b.x - Q.x) * 1.4, vy: (b.y - Q.y) * 1.4, vz: .1, g: 0, life: .35, age: 0, col: Math.random() < .5 ? '#ff8a96' : '#e8f6ff', luit: 1, tl: .05 }); }
}
// Glisser dans l'air, à travers tout
function glisserAme(b, tx, ty, v, dt) {
  const d = Math.hypot(tx - b.x, ty - b.y);
  if (v > 0 && d > .05) { const s = Math.min(v * dt, d); b.x += (tx - b.x) / d * s; b.y += (ty - b.y) / d * s; b.vit = v; } else b.vit = 0;
  b.x = Math.max(4, Math.min(WS - 4, b.x)); b.y = Math.max(4, Math.min(WS - 4, b.y)); b.z = DJ_Z0;
}
// L'ÂME EN PEINE : elle erre autour de sa place, à travers les murs ; vous sentant, elle glisse vers vous et boit
// votre vie. La lumière d'une lanterne la tient à distance : trop près, elle fuit ; au bord, elle guette.
function majAme(b, dt) {
  const Z0 = DJ_Z0, RL = 4.4;
  let J = null, dJ = 1e9;
  for (const Q of joueursDans()) { const d = Math.hypot(Q.x - b.x, Q.y - b.y); if (d < dJ) { dJ = d; J = Q; } }
  const vue = 11 * (typeof pacteVue === 'function' ? pacteVue() : 1);
  let tx = b.x, ty = b.y, v = 0;
  if (J && (dJ < vue || (b.eveil && dJ < vue * 1.6))) {
    if (!b.eveil) { b.eveil = true; SON.jouer('murmure', { vol: .6 }, b.x, b.y, Z0 + 1); }
    const lant = lanterneDe(J);
    if (lant && dJ < RL) {
      const a = Math.atan2(b.y - J.y, b.x - J.x); tx = J.x + Math.cos(a) * (RL + 1.5); ty = J.y + Math.sin(a) * (RL + 1.5); v = 3.4; b.etat = 'fuir';
      if (t - (b.sifT || 0) > 3) { b.sifT = t; SON.jouer('stridence', { vol: .3 }, b.x, b.y, Z0 + 1); }
    } else if (lant && dJ < RL + 1.4) {
      const a = Math.atan2(b.y - J.y, b.x - J.x) + (b.cote || 1) * dt * .9; tx = J.x + Math.cos(a) * (RL + .7); ty = J.y + Math.sin(a) * (RL + .7); v = 1.6; b.etat = 'guetter';
    } else if (dJ < 1.5) { b.etat = 'boire'; boireVie(b, J, .045, dt); }
    else { tx = J.x; ty = J.y; v = b.sp.spd; b.etat = 'glisser'; }
    b.dirT = Math.atan2(J.y - b.y, J.x - b.x);
  } else {
    b.eveil = false;
    if (!b.but || Math.hypot(b.but[0] - b.x, b.but[1] - b.y) < .4 || t > (b.butT || 0)) { const a = Math.random() * 6.28, r = Math.random() * 6; b.but = [b.home[0] + Math.cos(a) * r, b.home[1] + Math.sin(a) * r]; b.butT = t + 8; }
    tx = b.but[0]; ty = b.but[1]; v = .7; b.etat = 'errer'; b.dirT = Math.atan2(ty - b.y, tx - b.x);
  }
  glisserAme(b, tx, ty, v, dt); tournerBrume(b, dt, 3);
  if (!dansMur(b) && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 625 && Math.random() < dt * 10)   // sa traînée : des lueurs pâles qui montent
    parts.push({ x: b.x - Math.cos(b.dir) * .35 + (Math.random() - .5) * .3, y: b.y - Math.sin(b.dir) * .35 + (Math.random() - .5) * .3, z: Z0 + .45 + Math.random() * .6, vx: 0, vy: 0, vz: .25, g: 0, life: 1.1, age: 0, col: Math.random() < .6 ? '#bfe8f2' : '#7fb8cc', luit: 1, tl: .045 });
}
// LA GARGOUILLE : de pierre tant qu'un regard est posé sur elle (à moins de 72° de là où l'on regarde, sans mur
// entre) ; dès qu'on lui tourne le dos, elle bondit, et griffe. Figée, la pierre encaisse.
let gargDit = -99;
const regardDe = Q => Q === P ? (mode === 'fps' ? yaw : P.face) : Number.isFinite(Q.face) ? Q.face : Number.isFinite(Q.faceC) ? Q.faceC : null;
function gargouilleVue(b) {
  for (const Q of joueursDans()) {
    const dx = b.x - Q.x, dy = b.y - Q.y, d = Math.hypot(dx, dy); if (d > 24) continue;
    const r = regardDe(Q); if (r === null) continue;
    if (d > .8 && (dx * Math.cos(r) + dy * Math.sin(r)) / d < .3) continue;
    if (d > 1.5 && !ligneDeVue(Q.x, Q.y, Q.z + 1.3, b.x, b.y, b.z + .9)) continue;
    return true;
  }
  return false;
}
function majGargouille(b, dt) {
  b.vit = 0;
  if (b.inerte) { b.etat = 'statue'; return; }
  if (gargouilleVue(b)) { b.act = null; if (b.etat !== 'statue') b.etat = 'figee'; return; }
  if (b.act === 'griffe') {
    const u = t - b.actT, c = b.actC; b.etat = 'griffe';
    if (u > .15 && !b.fait) { b.fait = true; SON.jouer('lacere', {}, b.x, b.y, b.z + .8); if (c && Math.hypot(c.x - b.x, c.y - b.y) < 1.9) coupBrume(b, c, .12, [Math.cos(b.dir) * 5, Math.sin(b.dir) * 5, 1.5]); }
    if (u > .45) b.act = null;
    return;
  }
  const c = cibleBrume(b, b.eveil ? 18 : 9);
  if (!c) { if (b.etat !== 'statue') b.etat = 'figee'; return; }
  b.eveil = true;
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dir = b.dirT = Math.atan2(c.y - b.y, c.x - b.x);           // nul ne la voit se tourner
  if (d < 1.35 && t > (b.coupT || 0)) { agirBrume(b, 'griffe', c); b.coupT = t + .9; return; }
  if (b.socle) { b.socle = null; b.quitteT = t; }
  b.etat = 'bondir'; pasBrume(b, c.x, c.y, b.sp.spd, dt, 1.2);
  b.phG = (b.phG || 0) + dt * 9 * Math.min(1, (b.vit || 0) / 3);
  if ((b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 144 && t > (b.grT || 0)) { b.grT = t + .55; SON.jouer('grattement', { vol: .5 }, b.x, b.y, b.z); }
  if (Math.random() < dt * 6) parts.push({ x: b.x + (Math.random() - .5) * .5, y: b.y + (Math.random() - .5) * .5, z: b.z + .05, vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6, vz: .4, g: 2, life: .6, age: 0, col: '#8a847c', tl: .05 });
}
function pierreK(b) {
  if (b.dead || b.etat === 'bondir' || b.etat === 'griffe') return 1;
  if (t - (b.pareT || 0) > .2) { b.pareT = t; SON.jouer('clank', { vol: .6 }, b.x, b.y, b.z + .8); burst(b.x, b.y, b.z + .9, 6, '#a8a29a'); }
  if (t - gargDit > 40) { gargDit = t; say('la pierre encaisse', 1.6); }
  return .55;
}
// Ce que les bêtes du Roi encaissent (degJoueur, index.html) : le bouclier du forgeron, la pierre des gargouilles
function roiDegK(b) { return b.sp.bouclier ? bouclierK(b) : b.sp.statue ? pierreK(b) : b.sp.corps === 'roi' && typeof roiK === 'function' ? roiK(b) : 1; }
// LE CHŒUR : chaque voix tient sa place autour du puits ; elle CRIE (0,7 s, la bouche s'ouvre et luit) : une onde
// court au sol, qu'on saute ; trop près d'elle, elle boit votre vie.
function majChoeur(b, dt) {
  const C = ROI.choeur, Z0 = DJ_Z0;
  if (!C) { b.vit = 0; return; }
  if (b.etat === 'relever') { b.vit = 0; if (t - b.relT < 1.2) return; b.etat = 'chant'; }
  const a = C.ang + (b.voix || 0) * 2.0944, tx = C.cx + Math.cos(a) * 4.6, ty = C.cy + Math.sin(a) * 4.6;
  let J = null, dJ = 1e9;
  for (const Q of joueursDans()) { const d = Math.hypot(Q.x - b.x, Q.y - b.y); if (d < dJ) { dJ = d; J = Q; } }
  if (J && C.eveil) { b.dirT = Math.atan2(J.y - b.y, J.x - b.x); tournerBrume(b, dt, 3); }
  if (!C.eveil || C.fini) { b.etat = 'chant'; glisserAme(b, tx, ty, 2, dt); return; }
  if (b.act === 'cri') {
    const u = t - b.actT; b.etat = 'cri';
    if (u > .7 && !b.fait) { b.fait = true; ROI.ondes.push({ x: b.x, y: b.y, t0: t, r: .6, vus: new Set(), col: VOIX[b.voix || 0].hex, c: VOIX[b.voix || 0].c }); SON.jouer('cri', { vol: .6 }, b.x, b.y, Z0 + 2); }
    if (u > 1.1) { b.act = null; b.criT = t + (4.5 + Math.random() * 2.5) * (C.fen !== null ? .6 : 1); }
  } else if (J && dJ < 2.8) { b.etat = 'boire'; boireVie(b, J, .06, dt); }
  else if (t > (b.criT || (b.criT = t + 1.5 + (b.voix || 0) * 1.6))) agirBrume(b, 'cri', J);
  else b.etat = 'chant';
  glisserAme(b, tx, ty, b.act === 'cri' ? 1.2 : 3, dt);
}

// ---------- leurs volumes ----------
// L'âme en peine : debout dans l'air, une robe pâle qui pend et s'effiloche en traîne vers le bas, une capuche
// profonde, un visage creux dont la bouche s'ouvre quand elle boit ; des bras longs aux manches en lambeaux,
// tendus vers vous. Elle flotte, et se défait vers le haut.
function osAme(f, O) {
  const { add, os2 } = O;
  const E = f.etat, mort = f.dead > 0 ? Math.min(1, f.dead) : 0, ph = t * 2.2 + (f.num || 0);
  const h0 = .5 + .12 * Math.sin(ph) + mort * .7, k = 1 - mort * .7, pale = [200, 230, 236], pale2 = [150, 194, 206], voile = [104, 148, 166], noir = [10, 16, 24];
  const boit = E === 'boire', pen = Math.min(1, (f.vit || 0) / 2);
  // la robe : du col à la traîne, cinq pans qui s'effilent ; seul le bas part en arrière
  const W = [.44, .42, .36, .26, .14];
  let A = [.02, 0, h0 + 1.02];
  for (let j = 0; j < 5; j++) { const s = (j + 1) / 5, B = [.02 - s * s * (.45 + pen * .35), Math.sin(ph * 1.6 - j * .9) * .1 * s * s, h0 + 1.02 - s * 1.05];
    add(A, B, W[j] * k, W[j] * .82 * k, j < 2 ? pale2 : voile, true); A = B; }
  for (const d of [-1, 1]) { const B = [A[0] - .1, d * .1 + Math.sin(ph * 2 + d) * .06, A[2] - .22]; os2(A, B, .05 * k, voile, true); }   // deux filaments au bout
  add([-.04, 0, h0 + .96], [.06, 0, h0 + 1.08], .48 * k, .32 * k, pale2, true);                    // les épaules
  const H = [.08 + pen * .08, 0, h0 + 1.24];
  add([H[0] - .16, 0, H[2] - .04], [H[0] + .06, 0, H[2] + .08], .36 * k, .34 * k, voile, true);   // la capuche, sa pointe
  add([H[0] - .15, 0, H[2] + .1], [H[0] - .26, 0, H[2] + .2], .16 * k, .13 * k, voile, true);
  add([H[0] - .02, 0, H[2]], [H[0] + .1, 0, H[2] - .02], .22 * k, .25 * k, pale, true);             // le visage
  for (const s of [-1, 1]) add([H[0] + .1, s * .055, H[2] + .03], [H[0] + .115, s * .055, H[2] + .03], .065, .08, noir);
  const bo = boit ? .16 : E === 'fuir' ? .12 : .045 + .02 * Math.sin(ph * 3);
  add([H[0] + .1, 0, H[2] - .07], [H[0] + .115, 0, H[2] - .07 - bo], .06, .05, noir);
  const tend = boit || E === 'glisser' ? 1 : E === 'guetter' ? .55 : 0;
  for (const s of [-1, 1]) {
    const Sh = [.03, s * .21, h0 + 1.02], El = [.12 + tend * .2, s * (.27 - tend * .06), h0 + .8 + tend * .2];
    const Hd = [.2 + tend * .42, s * (.22 - tend * .1), h0 + .6 + tend * .4 + Math.sin(ph * 2 + s) * .04];
    os2(Sh, El, .075 * k, pale2, true); os2(El, Hd, .055 * k, pale, true);
    os2(El, [El[0] - .06, El[1] + s * .03, El[2] - .3 - .05 * Math.sin(ph * 2.4 + s)], .08 * k, voile, true);   // la manche en lambeau
    for (const d of [-1, 0, 1]) os2(Hd, [Hd[0] + .13 + tend * .04, Hd[1] + d * .035, Hd[2] - .05 + tend * .03], .022, pale, true);
  }
}
// La gargouille : accroupie sur son socle, les grandes ailes repliées dans le dos, les cornes, la gueule ouverte.
// Vivante, figée en pleine foulée, les ailes à demi ouvertes, les griffes devant ; ses yeux ne s'allument que
// quand elle bouge.
function osGargouille(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const st = [128, 124, 118], st2 = [104, 100, 96], st3 = [78, 74, 72], vive = E === 'bondir' || E === 'griffe', yeux = vive ? [255, 110, 40] : [30, 28, 28];
  const ac = E === 'statue', ph = f.phG || 0, AV = [1, 0, 0];
  const zs = (f.socle && ac ? .55 : Math.max(0, .55 - (t - (f.quitteT || -9)) * 2.3)) - mort * .7;
  for (const s of [-1, 1]) {                                   // les jambes : accroupie, ou en pleine foulée
    const p = ph + (s > 0 ? 0 : Math.PI), hip = [-.06, s * .17, zs + (ac ? .36 : .54)];
    const kn = ac ? [.28, s * .24, zs + .38] : [.12 + Math.sin(p) * .22, s * .19, zs + .32 + Math.max(0, Math.cos(p)) * .08];
    const ft = ac ? [.16, s * .21, zs + .04] : [Math.sin(p) * .34, s * .18, zs + .04 + Math.max(0, -Math.cos(p)) * .14];
    os2(hip, kn, .2, st2); os2(kn, ft, .14, st2);
    add([ft[0] - .04, ft[1], ft[2]], [ft[0] + .12, ft[1], ft[2]], .16, .08, st3);
    for (const d of [-1, 0, 1]) add([ft[0] + .1, ft[1] + d * .05, ft[2]], [ft[0] + .2, ft[1] + d * .055, ft[2] - .02], .045, .04, st3);
  }
  const T0 = [-.06, 0, zs + (ac ? .42 : .58)], T1 = [T0[0] + (ac ? .22 : .32), 0, T0[2] + .52];
  add(T0, T1, .48, .4, st); add([T0[0] + .1, 0, T0[2] + .05], [T1[0] + .04, 0, T1[2] - .1], .32, .44, st2);   // le torse, le ventre
  add([T1[0] - .06, 0, T1[2] - .06], [T1[0] + .04, 0, T1[2] + .04], .62, .32, st);                       // les épaules
  const H = [T1[0] + .16, 0, T1[2] + .1];                      // la tête : l'arcade, le mufle, la mâchoire, les crocs, les cornes
  add([H[0] - .12, 0, H[2]], [H[0] + .12, 0, H[2] - .02], .32, .3, st);
  add([H[0] + .04, 0, H[2] + .1], [H[0] + .14, 0, H[2] + .08], .3, .07, st3);
  add([H[0] + .1, 0, H[2] - .04], [H[0] + .3, 0, H[2] - .08], .2, .15, st2);
  add([H[0] + .08, 0, H[2] - .15], [H[0] + .28, 0, H[2] - .2 - (E === 'griffe' ? .08 : .03)], .17, .06, st3);
  for (const d of [-1, 1]) add([H[0] + .24, d * .055, H[2] - .13], [H[0] + .25, d * .055, H[2] - .18], .035, .035, [206, 200, 190]);
  for (const s of [-1, 1]) {
    add([H[0] + .11, s * .08, H[2] + .05], [H[0] + .13, s * .08, H[2] + .05], .06, .045, yeux, vive);
    os2([H[0] - .04, s * .12, H[2] + .1], [H[0] - .2, s * .22, H[2] + .3], .085, st3); os2([H[0] - .2, s * .22, H[2] + .3], [H[0] - .14, s * .25, H[2] + .46], .05, st3);
    add([H[0] - .04, s * .16, H[2] + .06], [H[0] - .1, s * .22, H[2] + .14], .08, .03, st2);           // l'oreille pointue
  }
  const gr = E === 'griffe' ? Math.min(1, u / .15) : 0;         // les bras, épais, les mains en serres
  for (const s of [-1, 1]) {
    const p = ph + (s > 0 ? Math.PI : 0), Sh = [T1[0] - .02, s * .28, T1[2] - .06];
    const Hd = ac ? [Sh[0] + .3, s * .26, zs + .62] : s > 0 && E === 'griffe' ? [Sh[0] + .12 + gr * .45, s * .22, Sh[2] + .42 - gr * .68]
      : [Sh[0] + .34 + Math.sin(p) * .14, s * .28, Sh[2] - .14 + Math.cos(p) * .08];
    const El = [(Sh[0] + Hd[0]) / 2 - .08, s * .34, (Sh[2] + Hd[2]) / 2 - .04];
    os2(Sh, El, .14, st2); os2(El, Hd, .11, st2);
    add([Hd[0] - .03, Hd[1], Hd[2]], [Hd[0] + .08, Hd[1], Hd[2] - .02], .14, .09, st3);
    for (const d of [-1, 0, 1]) add([Hd[0] + .06, Hd[1] + d * .045, Hd[2] - .02], [Hd[0] + .19, Hd[1] + d * .05, Hd[2] - .1], .04, .04, st3);
  }
  // les ailes : un bras d'os et une voile de pierre ; repliées, elles montent au-dessus de la tête
  const ou = ac ? 0 : .6 + (vive ? .15 * Math.sin(ph * 2) : 0);
  for (const s of [-1, 1]) {
    const R0 = [T1[0] - .2, s * .2, T1[2] - .02], R1 = [R0[0] - .16 - ou * .1, s * (.26 + ou * .5), R0[2] + .52 - ou * .1], R2 = [R1[0] - .14, s * (.3 + ou * .85), R1[2] - .55];
    os2(R0, R1, .09, st3); os2(R1, [R1[0] + .04, R1[1] + s * .04, R1[2] + .1], .06, st3);   // l'ergot au coude de l'aile
    add(mi3(R0, R1), mi3(R1, R2), .34 + ou * .3, .04, st2, false, AV);
    add([R0[0] - .04, R0[1], R0[2] - .1], R2, .3 + ou * .2, .04, st3, false, AV);
  }
  let q = [T0[0] - .14, 0, T0[2] + .02];                         // la queue, terminée en pique
  for (let j = 1; j <= 4; j++) { const n = [q[0] - .16, (ac ? .07 : Math.sin(ph * .5 + j) * .05) * j, q[2] - .07]; os2(q, n, .09 - j * .015, st2); q = n; }
  add([q[0] + .02, q[1], q[2]], [q[0] - .12, q[1], q[2] - .02], .12, .04, st3);
}
// Une voix du Chœur : trois mètres de robe en cloche, des pans qui ondulent, la capuche pointue, le visage
// creux ; les bras levés comme pour diriger ; sa bouche luit quand elle crie. Chaque voix a sa teinte.
function osChoeur(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0, V = VOIX[f.voix || 0], noir = [12, 16, 22];
  const rel = E === 'relever' ? Math.min(1, u / 1.2) : 1, k = rel * (1 - mort * .6);
  const ph = t * 1.6 + (f.voix || 0) * 2, h0 = .35 + .1 * Math.sin(ph) + mort * .9 - (1 - rel) * 1.1, cri = E === 'cri' ? Math.min(1, u / .7) : 0, boit = E === 'boire';
  for (let j = 0; j < 5; j++) { const z0 = h0 + j * .25, w = (.7 - j * .08) * k, sw = .03 * Math.sin(ph * 1.3 - j * .8); add([-.02 * j + sw, 0, z0], [-.02 * j + sw, 0, z0 + .27], w, w * .86, j & 1 ? V.c2 : V.c, true); }
  add([.32 * k, 0, h0 + .02], [.24 * k, 0, h0 + 1.15], .1 * k, .03, [70, 80, 96], true);            // la robe s'ouvre devant, sur du noir
  add([.2 * k, 0, h0 + 1.12], [.21 * k, 0, h0 + 1.02], .1, .1, [214, 204, 182]);                  // un crâne en pendentif
  for (let j = 0; j < 6; j++) { const a = j / 6 * 6.2832 + ph * .4, r = .27 * k;
    os2([Math.cos(a) * r, Math.sin(a) * r, h0 + .06], [Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35, h0 - .22 - .1 * Math.sin(ph * 2 + j)], .08 * k, V.c2, true); }
  add([-.02, 0, h0 + 1.2], [.02, 0, h0 + 1.3], .52 * k, .36 * k, V.c2, true);
  const H = [.04, 0, h0 + 1.44];
  add([H[0] - .15, 0, H[2] - .04], [H[0] + .05, 0, H[2] + .14], .36 * k, .34 * k, V.c2, true);
  add([H[0] - .12, 0, H[2] + .14], [H[0] - .18, 0, H[2] + .32], .15 * k, .13 * k, V.c2, true);
  add([H[0] - .02, 0, H[2]], [H[0] + .13, 0, H[2] - .02], .24 * k, .27 * k, V.c, true);
  for (const s of [-1, 1]) add([H[0] + .13, s * .06, H[2] + .03], [H[0] + .14, s * .06, H[2] + .03], .07, .08, noir);
  const bo = .05 + cri * .14 + (boit ? .08 : 0);
  add([H[0] + .13, 0, H[2] - .07], [H[0] + .14, 0, H[2] - .07 - bo], .08, .06, cri > .3 ? [255, 255, 255] : noir, cri > .3);
  for (const s of [-1, 1]) {
    const Sh = [.02, s * .25, h0 + 1.24], up = .5 + .5 * Math.sin(ph * 1.3 + s);
    const Hd = boit ? [.55, s * .16, h0 + 1.1] : [.12 + cri * .1, s * (.44 + cri * .22), h0 + 1.5 + up * .25 + cri * .2];
    const El = [.07 + (boit ? .2 : 0), s * .38, h0 + 1.2 + up * .1];
    os2(Sh, El, .085 * k, V.c2, true); os2(El, Hd, .07 * k, V.c, true);
    for (const d of [-1, 0, 1]) os2(Hd, [Hd[0] + .06, Hd[1] + d * .04, Hd[2] + .12], .024, V.c, true);
  }
}
