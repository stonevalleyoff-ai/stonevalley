// ============================================================
//  LES NOMADES DU SEUIL
//  Un peuple qui voyage d'île en île par les seuils, comme vous. De loin en loin, un seuil s'ouvre
//  non loin du joueur et une caravane en sort : une marchande ambulante, un dresseur et sa bête
//  (une espèce tirée au hasard parmi toutes, sauf les automates), un conteur. Ils plantent leur
//  halte quelques minutes, puis repartent par le même seuil.
//  - On leur parle (ACTION, de près) : un moteur de conversation, fait de nœuds — ce que dit le
//    nomade — et de réponses — ce que vous dites —, avec des conditions, des effets, des variantes
//    et des jetons ({nom}, {bete}…). Chacun a ses sujets : la marchande troque, le dresseur
//    enseigne des techniques de dressage, le conteur livre des indices sur les automates et le jeu.
//  - Ils se souviennent de vous : l'amitié de chacun (qui ouvre des répliques et des faveurs), ce
//    qu'ils vous ont appris, ce qu'ils vous ont déjà dit — tout cela est gardé dans la sauvegarde.
//  - Amicaux, ils se défendent si on les attaque (la bête du dresseur aussi) ; la caravane repart
//    alors, et ne revient pas avant vingt minutes. Un nomade tué ne revient jamais.
//  Ce fichier est chargé AVANT le script du jeu, comme donjon.js : il ne déclare que des fonctions
//  et son propre état (tout est préfixé nm / NM), et ne touche au monde qu'une fois appelé par le jeu.
//  Sur une île à plusieurs, la caravane est celle du gardien de la faune (faune.js) : il la fait venir,
//  près de l'un des joueurs ; les autres en ont un double (NM.car.miroir) pour leur parler et troquer.
//  L'amitié, les savoirs, la rancune restent à chacun.
// ============================================================
const NM = {
  car: null,            // la caravane sur l'île : { arche, gens, betes, centre, fin, hostile, trocs }
  prochain: null,       // l'instant (horloge du jeu) où une caravane pourra venir
  moi: { savoirs: [], amis: {}, dits: [], morts: [], rancune: 0, vues: 0 },   // gardé dans la sauvegarde
  ui: null, parle: null, noeud: null, frappe: null, texte: '', vu: 0,
};
const NM_SEJOUR = 300, NM_PORTEE = 2.4;
// Les gens du Seuil : toujours les mêmes, d'une caravane à l'autre — on les reconnaît.
const NM_GENS = [
  { nom: 'Ossa', role: 'marchand', f: 1, robe: [148, 84, 58], clair: [214, 164, 104], lueur: [255, 196, 110] },
  { nom: 'Varek', role: 'marchand', robe: [92, 72, 118], clair: [168, 140, 196], lueur: [214, 170, 255] },
  { nom: 'Mirelle', role: 'marchand', f: 1, robe: [58, 108, 104], clair: [132, 190, 176], lueur: [150, 255, 226] },
  { nom: 'Kel', role: 'dresseur', robe: [84, 98, 64], clair: [150, 168, 110], lueur: [196, 255, 140] },
  { nom: 'Talia', role: 'dresseur', f: 1, robe: [120, 60, 70], clair: [196, 120, 128], lueur: [255, 150, 170] },
  { nom: 'Brann', role: 'dresseur', robe: [70, 84, 110], clair: [132, 150, 186], lueur: [140, 200, 255] },
  { nom: 'Ilu', role: 'conteur', f: 1, robe: [52, 60, 104], clair: [110, 122, 190], lueur: [150, 236, 255] },
  { nom: 'Eshem', role: 'conteur', robe: [96, 90, 70], clair: [180, 168, 128], lueur: [255, 236, 150] },
  { nom: 'Noor', role: 'conteur', f: 1, robe: [36, 76, 88], clair: [96, 156, 168], lueur: [120, 255, 240] },
];
const NM_ROLE = { marchand: ['marchand', 'marchande'], dresseur: ['dresseur', 'dresseuse'], conteur: ['conteur', 'conteuse'] };
const nmRole = g => NM_ROLE[g.role][g.f ? 1 : 0];

// ---------- les fiches, pour SPEC ----------
function nmEspeces() {
  const base = { fam: 'nomade', pnj: 1, diet: 'o', herd: 0, cap: 0, mat: 1, peur: 0, vue: 14, bio: [], lien: 0, travail: {}, grimpe: 0,
    shell: [120, 110, 130], dark: [70, 64, 80], leg: [80, 70, 64], oeil: [150, 236, 255] };
  return [
    Object.assign({}, base, { id: 'nomade', n: 'Nomade du Seuil', sz: 1, spd: 2.1, dur: 2.4, metier: 'voyage de seuil en seuil' }),
    Object.assign({}, base, { id: 'arche_nomade', n: 'Seuil des nomades', sz: 1, spd: 0, dur: 99, arche: 1, metier: 'un seuil ouvert' }),
  ];
}
// Leurs bâtons : ils se défendent, sans acharnement.
const NM_COUP = { deg: .09, ramasse: .3, bond: .22, portee: 1.9, recul: .5, pause: 1.2 };

// ---------- ce qu'ils savent, et qui se garde ----------
const nmSait = id => NM.moi.savoirs.includes(id);
function nmPhoto() { const m = NM.moi; return { s: m.savoirs.slice(), a: Object.assign({}, m.amis), d: m.dits.slice(-120), m: m.morts.slice(), r: m.rancune, v: m.vues }; }
function nmAppliquer(d) {
  const m = NM.moi; if (!d || typeof d !== 'object') return;
  const ids = Object.keys(NM_SAVOIRS), noms = NM_GENS.map(g => g.nom);
  m.savoirs = (Array.isArray(d.s) ? d.s : []).filter(x => ids.includes(x));
  m.amis = {}; if (d.a && typeof d.a === 'object') for (const n of noms) if (Number.isFinite(d.a[n])) m.amis[n] = Math.max(-10, Math.min(10, d.a[n] | 0));
  m.dits = (Array.isArray(d.d) ? d.d : []).filter(x => typeof x === 'string').slice(-120);
  m.morts = (Array.isArray(d.m) ? d.m : []).filter(x => noms.includes(x));
  m.rancune = Number.isFinite(d.r) ? d.r : 0; m.vues = Number.isFinite(d.v) ? d.v | 0 : 0;
}

// ---------- la venue ----------
// Une caravane peut venir deux minutes et demie à sept minutes et demie après l'arrivée sur l'île, puis
// huit à dix-huit minutes après son départ. Jamais sous terre, ni pendant un pillage, ni tant qu'on
// les a fâchés (vingt minutes).
function nmMaj(dt) {
  const C = NM.car;
  if (C && !beasts.includes(C.arche)) { nmFermer(); NM.car = null; NM.prochain = t + 480 + Math.random() * 600; }
  if (typeof fauneSuiveur === 'function' && fauneSuiveur()) {   // la caravane est celle du gardien : on n'en tient que la parole
    if (NM.parle && (NM.parle.dead || Math.hypot(NM.parle.x - P.x, NM.parle.y - P.y) > 3.6 || (NM.car && NM.car.hostile))) nmFermer();
    if (NM.prochain !== null) NM.prochain = Math.max(NM.prochain, t + 120);
    return;
  }
  if (C && C.miroir) C.miroir = false;                    // devenu gardien : la caravane d'en face est la nôtre
  if (NM.prochain === null) NM.prochain = t + 150 + Math.random() * 300;
  if (!NM.car) { if (t > NM.prochain) nmVenir(false); }
  else nmCaravane(dt);
  if (NM.parle && (NM.parle.dead || Math.hypot(NM.parle.x - P.x, NM.parle.y - P.y) > 3.6 || (NM.car && NM.car.hostile))) nmFermer();
}
function nmVenir(force, pour) {
  if (NM.car) return false;
  const raid = typeof raidIci === 'function' && raidIci();
  if (!force && ((typeof djIci === 'function' && djIci()) || raid || Date.now() < NM.moi.rancune || P.pv <= 0)) { NM.prochain = t + 120; return false; }
  if (typeof djIci === 'function' && djIci()) { say('pas sous terre : le Seuil n\'y descend pas', 1.8); return false; }
  const vivants = NM_GENS.filter(g => !NM.moi.morts.includes(g.nom));
  const qui = ['marchand', 'dresseur', 'conteur'].map(r => { const L = vivants.filter(g => g.role === r); return L[Math.random() * L.length | 0]; }).filter(Boolean);
  if (!qui.length) return false;
  // la halte : un replat sec, à 12-18 cases d'un joueur de l'île (au hasard, quand on est plusieurs)
  const Js = typeof joueursFaune === 'function' ? joueursFaune() : [P], J = pour || (Js.length ? Js[Math.random() * Js.length | 0] : P);
  let lieu = null;
  for (let k = 0; k < 80 && !lieu; k++) {
    const a = Math.random() * 6.2832, r = 12 + Math.random() * 6, x = J.x + Math.cos(a) * r, y = J.y + Math.sin(a) * r;
    if (x < 6 || y < 6 || x > WS - 6 || y > WS - 6) continue;
    let ok = true; const h = hAt(x | 0, y | 0);
    for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2 && ok; dx++) {
      const i = (x | 0) + dx, j = (y | 0) + dy;
      if (hAt(i, j) <= SEA || eauAt(i, j) || vide(i, j) || Math.abs(hAt(i, j) - h) > 1) ok = false;
    }
    if (ok && Math.abs(h - J.z) < 4) lieu = [(x | 0) + .5, (y | 0) + .5];
  }
  if (!lieu) { NM.prochain = t + 60; return false; }
  const arche = naitre(specById.arche_nomade, lieu[0], lieu[1]);
  arche.dir = arche.dirT = Math.atan2(J.y - lieu[1], J.x - lieu[0]) - Math.PI / 2; arche.ouv = 0; arche.camo = 1; arche.pv = 1;
  beasts.push(arche);
  const vers = Math.atan2(J.y - lieu[1], J.x - lieu[0]);
  const centre = [lieu[0] + Math.cos(vers) * 2.6, lieu[1] + Math.sin(vers) * 2.6];
  // la bête du dresseur : une espèce au hasard, parmi toutes, sauf les automates et les machines d'en bas
  const esp = SPEC.filter(sp => !automate(sp) && !sp.donjon && !sp.pnj);
  const bsp = esp[Math.random() * esp.length | 0];
  NM.car = { arche, lieu, centre, gens: [], betes: [], qui, bsp, t0: t, fin: t + NM_SEJOUR, hostile: false, hostileFin: 0,
    sortis: 0, trocs: nmTirerTrocs() };
  NM.moi.vues++;
  SON.jouer('portail', {}, lieu[0], lieu[1], P.z + 1);
  say('un seuil s\'ouvre non loin · des voyageurs en sortent', 3);
  return true;
}
function nmPartir() { if (NM.car) NM.car.fin = Math.min(NM.car.fin, t); }
// Les voyageurs sortent un à un du seuil, puis la bête ; au départ, ils y rentrent de même.
function nmCaravane(dt) {
  const C = NM.car, A = C.arche;
  A.ouv = Math.max(0, Math.min(1, (A.ouv || 0) + dt * (C.ferme ? -.8 : .7)));
  if (!C.ferme && A.ouv >= 1 && C.sortis < C.qui.length && t > (C.sortieT || 0)) {
    const g = C.qui[C.sortis++], b = naitre(specById.nomade, A.x, A.y);
    b.nm = g; b.pv = 1; b.dir = b.dirT = Math.atan2(C.centre[1] - A.y, C.centre[0] - A.x);
    const Q = typeof joueurPour === 'function' ? joueurPour(b) : P;
    const a = Math.atan2(Q.y - C.centre[1], Q.x - C.centre[0]) + (C.sortis - 2) * 1.25, r = 1.7;   // en arc, face à l'arrivant
    b.poste = [C.centre[0] + Math.cos(a) * r, C.centre[1] + Math.sin(a) * r];
    beasts.push(b); C.gens.push(b); C.sortieT = t + .9;
    if (g.role === 'dresseur') {
      const n = C.bsp.herd ? 2 : 1;
      for (let k = 0; k < n; k++) { const q = naitre(C.bsp, A.x, A.y, C.bsp.mat * 2); q.pnjSuit = b; q.faim = 0; q.soif = 0; q.nrj = 1; q.rang = k; beasts.push(q); C.betes.push(q); }
    }
  }
  if (C.hostile && t > C.hostileFin) { C.hostile = false; C.fin = Math.min(C.fin, t); }
  // départ : tout le monde rentre ; le seuil se ferme derrière le dernier
  if (t > C.fin) {
    C.depart = true;
    const reste = C.gens.concat(C.betes).filter(o => beasts.includes(o) && !o.dead);
    if (!reste.length || t > C.fin + 40) { C.ferme = true; if (A.ouv <= 0) { A.dead = 1; nmFermer(); NM.car = null; NM.prochain = t + 480 + Math.random() * 600; } }
  }
}
// distant : c'est un joueur d'en face qui les a fâchés — ils se défendent, mais c'est lui qu'ils
// gardent en mémoire (chez lui, nmFache)
function nmHostile(distant) {
  const C = NM.car; if (!C || C.hostile) return;
  C.hostile = true; C.hostileFin = t + 25;
  if (!distant) nmFache();
  nmFermer();
  say('les nomades se défendent', 2.2);
}
function nmFache() {
  const C = NM.car; if (!C || C.fache) return;
  C.fache = true;
  for (const b of C.gens) if (b.nm) NM.moi.amis[b.nm.nom] = (NM.moi.amis[b.nm.nom] || 0) - 3;
  NM.moi.rancune = Date.now() + 20 * 60e3;
}
function nmMort(b, distant) {
  if (!distant && b.nm && !NM.moi.morts.includes(b.nm.nom)) NM.moi.morts.push(b.nm.nom);
  nmHostile(distant);
}
function nmButin(b) {
  if (b.pnjSuit) return;
  const ec = 2 + (Math.random() * 3 | 0), fi = 3 + (Math.random() * 4 | 0);
  P.sac.eclat += ec; P.sac.fibre += fi;
  say('+' + ec + ' éclats · +' + fi + ' fibre · les nomades s\'en souviendront', 2.4);
  if (typeof majSac === 'function') majSac();
}

// ---------- ce que fait chacun, à chaque image ----------
function majNomade(b, dt) {
  b.t += dt; if (b.hit > 0) b.hit -= dt; if (b.colere > 0) b.colere -= dt; if (b.alarm > 0) b.alarm -= dt * .5;
  if (b.dead) { b.dead += dt; chute(b, dt); return; }
  const C = NM.car;
  if (!C) { b.dead = 1; return; }
  if (b.sp.arche) { b.pv = 1; b.colere = 0; return; }
  const distant = !!b.tueDistant || !!b.colereD;         // le coup venait d'en face
  if (b.pv <= 0) { mourirBete(b, 'combat'); if (!b.pnjSuit) nmMort(b, distant); else nmHostile(distant); return; }
  if (b.colere > 0 && !C.hostile) nmHostile(distant);
  // le joueur le plus proche, d'ici ou d'en face (faune.js) ; et celui qui lui parle
  const J = typeof JC !== 'undefined' && JC ? JC : P;
  const dJ = Math.hypot(J.x - b.x, J.y - b.y), dz = Math.abs(J.z - b.z);
  const maitre = b.pnjSuit && !b.pnjSuit.dead ? b.pnjSuit : null;
  let tx = b.x, ty = b.y, vit = 0, sprint = 1;
  const lui = b.parleD > b.t && b.parleJ ? Autres.get(b.parleJ) : null, Qp = NM.parle === b ? P : lui;
  b.parle = !!Qp;
  if (C.hostile && dJ < 14 && J.pv > 0) {
    // ils se défendent : au contact, un coup de bâton — la bête, à sa façon
    const prof = b.pnjSuit ? (COMBAT[b.sp.id] || COMBAT.defense) : NM_COUP;
    if (!b.as && b.t >= (b.pret || 0) && dJ < prof.portee + .3 && dz < 1.4) lancerAssaut(b, J, prof);
    else { tx = J.x; ty = J.y; vit = b.sp.spd; sprint = 1.25; }
    b.etat = 'défendre';
  } else if (C.depart) {
    tx = C.arche.x; ty = C.arche.y; vit = b.sp.spd * .8;
    if (Math.hypot(tx - b.x, ty - b.y) < .7) { burst(b.x, b.y, b.z + .4, 8, '#bfe8ff'); b.dead = 1; return; }
    b.etat = 'repart';
  } else if (b.pnjSuit) {
    const m = maitre || C.gens[0];
    if (m) {
      const a = (m.dir || 0) + Math.PI + (b.rang ? .8 : -.8), r = .9 + b.sp.sz * .5;
      tx = m.x + Math.cos(a) * r; ty = m.y + Math.sin(a) * r;
      const d = Math.hypot(tx - b.x, ty - b.y);
      vit = d > .5 ? b.sp.spd * Math.min(1, .3 + d * .3) : 0;
      if (!vit) b.dirT = Math.atan2(J.y - b.y, J.x - b.x) * (dJ < 5 ? 1 : 0) + (dJ < 5 ? 0 : b.dir);
    }
    b.etat = 'suivre';
  } else {
    // à la halte : chacun à son poste, qui fait face au joueur qui approche, et flâne un peu
    if (!b.flane || b.t > b.flaneT) { const a = Math.random() * 6.2832; b.flane = [b.poste[0] + Math.cos(a) * .6, b.poste[1] + Math.sin(a) * .6]; b.flaneT = b.t + 6 + Math.random() * 8; }
    const cible = dJ < 7 || b.parle ? b.poste : b.flane, d = Math.hypot(cible[0] - b.x, cible[1] - b.y);
    if (d > .35 && !b.parle) { tx = cible[0]; ty = cible[1]; vit = b.sp.spd * (d > 3 ? .9 : .45); }
    else { const Q = Qp || J; b.dirT = dJ < 7 || b.parle ? Math.atan2(Q.y - b.y, Q.x - b.x) : b.dirT; }
    // le premier signe : il lève la main quand vous approchez
    if (dJ < 6 && !b.salue) { b.salue = true; b.salutT = b.t; }
    b.etat = b.parle ? 'parle' : 'halte';
  }
  // le pas, comme les bêtes
  const x0 = b.x, y0 = b.y;
  if (b.as) majAssaut(b, dt);
  else if (vit > 0) pasVersBete(b, tx, ty, vit * sprint, dt);
  else { b.vx *= Math.max(0, 1 - dt * 6); b.vy *= Math.max(0, 1 - dt * 6); }
  const pas = Math.max(1, Math.min(8, Math.ceil(Math.hypot(b.vx, b.vy) * dt / .35)));
  for (let k = 0; k < pas; k++) { if (pasBete(b, b.x + b.vx * dt / pas, b.y + b.vy * dt / pas, false) === 0) { b.vx *= -.3; b.vy *= -.3; break; } }
  b.x = Math.max(2, Math.min(WS - 3, b.x)); b.y = Math.max(2, Math.min(WS - 3, b.y));
  chute(b, dt);
  if (vit > 0 && Math.hypot(b.vx, b.vy) > .3 && !b.as) b.dirT = Math.atan2(b.vy, b.vx);
  let dd = b.dirT - b.dir; while (dd > Math.PI) dd -= 6.2832; while (dd < -Math.PI) dd += 6.2832;
  b.dir += Math.max(-5 * dt, Math.min(5 * dt, dd));
  const mv = Math.hypot(b.x - x0, b.y - y0);
  b.vit = (b.vit || 0) + (mv / Math.max(dt, 1e-3) - (b.vit || 0)) * Math.min(1, dt * 8);
  if (b.pnjSuit) {
    if (coursier(b.sp) && typeof animCoursier === 'function') { b.couT = .35; b.aileT = Math.min(.5, b.vit / 12); b.bob += dt * b.vit * 1.1; animCoursier(b, dt); }
    updateFoeLegs(b, dt);
  } else b.ph = ((b.ph || 0) + mv / .62) % 1;
}

// ---------- ce qu'on voit ----------
// Des voyageurs en longues robes, capuche et visière de lumière ; des runes qui luisent à la ceinture
// et aux épaulières. La marchande porte son étal sur le dos (cadre, tapis roulé, deux lanternes) et
// un large chapeau ; le dresseur, un bâton à cristal et une cape ; le conteur, une haute capuche et
// un orbe qui tourne autour de sa tête. Ils marchent, balancent les bras, lèvent la main pour
// saluer, et gesticulent en parlant.
function nmOs(f) {
  if (f.sp.arche) return nmArche(f);
  const B = [], add = (a, b, w, h, c) => B.push({ a, b, w, h, c });
  const g = f.nm || NM_GENS[0], dk = Math.min(1, (f.dead || 0) * 2.6);
  const v = f.dead ? 0 : Math.min(1, (f.vit || 0) / 1.6), ph = (f.ph || 0) * 6.2832;
  const PEAU = [196, 160, 132], BOTTE = [58, 46, 40], robe = g.robe, clair = g.clair, lueur = g.lueur;
  const hz = .3 + Math.abs(Math.sin(ph)) * .014 * v - dk * .22;
  const cou = hz + .25, tz = cou + .08;
  const role = g.role;
  // les jambes, sous la robe
  for (const s of [-1, 1]) {
    const sw = Math.sin(ph + (s > 0 ? 0 : Math.PI)) * .5 * v;
    const hp = [0, s * .055, hz], kn = [Math.sin(sw) * .15, s * .058, hz - Math.cos(sw) * .15];
    const pl = sw - Math.max(0, -Math.sin(ph + (s > 0 ? 0 : Math.PI))) * .7 * v;
    const ft = [kn[0] + Math.sin(pl) * .14, s * .06, Math.max(.01, kn[2] - Math.cos(pl) * .14)];
    add(hp, kn, .075, .075, clair); add(kn, ft, .065, .065, clair);
    add(ft, [ft[0] + .08, ft[1], ft[2] - .01], .08, .065, BOTTE);
  }
  // la robe : un pan évasé qui descend aux genoux (aux chevilles pour le conteur), qui bat au pas
  const bas = role === 'conteur' ? .06 : .15, bat = Math.sin(ph * 2) * .015 * v;
  add([bat, 0, bas], [0, 0, hz + .02], .26, .2, robe);
  add([-.01, 0, hz - .02], [0, 0, hz + .14], .2, .15, robe);                       // la taille
  add([0, 0, hz + .12], [0, 0, cou - .01], .22, .16, clair);                       // le buste
  add([.001, 0, hz + .06], [.002, 0, hz + .085], .215, .165, lueur);                // la ceinture de runes, qui luit
  for (const s of [-1, 1]) add([0, s * .1, cou - .02], [0, s * .125, cou - .06], .09, .08, robe);   // les épaulières
  for (const s of [-1, 1]) add([.02, s * .122, cou - .035], [.03, s * .124, cou - .04], .02, .02, lueur);
  // les bras : ils balancent au pas ; l'un se lève pour saluer, ou pour appuyer une parole
  const salut = f.salutT != null && f.t - f.salutT < 1.6 ? Math.sin((f.t - f.salutT) / 1.6 * Math.PI) : 0;
  const geste = f.parle ? .5 + .5 * Math.sin(f.t * 2.4) : 0;
  for (const s of [-1, 1]) {
    const sh = [0, s * .12, cou - .04];
    let a = -Math.sin(ph + (s > 0 ? 0 : Math.PI)) * .45 * v, lat = .12;
    if (s > 0 && salut > 0) { a = -2.6 * salut; lat = .35 * salut; }
    else if (s < 0 && geste > 0 && !(role === 'dresseur')) { a = -1.1 * geste; lat = .25; }
    if (role === 'dresseur' && s > 0 && !salut) a = -.5;                          // la main qui tient le bâton
    const el = [sh[0] + Math.sin(a) * .12, sh[1] + s * lat * .12, sh[2] - Math.cos(a) * .12];
    const a2 = a - (s > 0 && salut ? .3 : .45);
    const ha = [el[0] + Math.sin(a2) * .11, el[1] + s * .005, el[2] - Math.cos(a2) * .11];
    add(sh, el, .065, .065, robe); add(el, ha, .055, .055, clair); add(ha, [ha[0] + .01, ha[1], ha[2] - .02], .045, .045, PEAU);
    if (role === 'dresseur' && s > 0) {                                            // le bâton, et son cristal
      add([ha[0], ha[1], .02], [ha[0], ha[1], tz + .12], .03, .03, [110, 82, 58]);
      add([ha[0], ha[1], tz + .12], [ha[0], ha[1], tz + .19], .055, .055, lueur);
    }
  }
  // la tête : le visage, la capuche, la visière de lumière
  add([0, 0, cou], [0, 0, cou + .03], .07, .07, PEAU);
  add([0, 0, tz - .045], [.005, 0, tz + .055], .12, .12, PEAU);
  add([-.025, 0, tz - .05], [-.02, 0, tz + .08], .15, .145, robe);                  // la capuche, derrière et dessus
  add([.058, 0, tz + .012], [.059, 0, tz + .026], .13, .025, lueur);               // la visière
  if (role === 'marchand') {
    add([0, 0, tz + .075], [0, 0, tz + .09], .3, .3, [120, 88, 56]);             // le large chapeau
    add([0, 0, tz + .09], [0, 0, tz + .14], .13, .13, [140, 104, 66]);
    // l'étal sur le dos : le cadre, le tapis roulé, deux lanternes qui se balancent
    add([-.13, 0, hz - .02], [-.13, 0, cou + .1], .24, .1, [112, 84, 56]);
    add([-.15, -.16, cou + .12], [-.15, .16, cou + .12], .075, .075, clair);
    const bl = Math.sin(f.t * 2.2) * .02 + Math.sin(ph) * .02 * v;
    for (const s of [-1, 1]) {
      add([-.14, s * .15, hz + .12], [-.14 + bl, s * .15, hz + .05], .012, .012, [60, 50, 44]);
      add([-.14 + bl, s * .15, hz + .05], [-.14 + bl, s * .15, hz - .01], .05, .05, lueur);
    }
  } else if (role === 'dresseur') {
    const cb = Math.sin(ph * 2) * .02 * v + Math.sin(f.t * 1.3) * .006;          // la cape
    add([-.09, 0, cou - .01], [-.12 - cb, 0, hz - .08], .24, .025, clair);
  } else {
    add([-.03, 0, tz + .07], [-.05, 0, tz + .15], .1, .1, robe);                   // la haute capuche
    add([-.05, 0, tz + .15], [-.075, 0, tz + .2], .05, .05, robe);
    const o = f.t * 1.4 + (f.bob || 0);                                             // l'orbe, qui tourne
    const q = [Math.cos(o) * .2, Math.sin(o) * .2, tz + .1 + Math.sin(f.t * 2.3) * .03];
    add(q, [q[0], q[1], q[2] + .045], .045, .045, lueur);
  }
  if (dk > 0) for (const o of B) { o.a = [o.a[0] + o.a[2] * dk * .8, o.a[1], o.a[2] * (1 - dk * .75)]; o.b = [o.b[0] + o.b[2] * dk * .8, o.b[1], o.b[2] * (1 - dk * .75)]; }
  return B;
}
// Le seuil des nomades : l'arche des portails, voile violet, qui monte du sol à l'ouverture et y
// redescend à la fermeture.
function nmArche(f) {
  const k = Math.max(.02, f.ouv || 0);
  return portailOs().map(o => {
    const voile = o.w > .35 && o.h < .08;
    const c = voile ? [150 + o.c[2] * .3 | 0, 110 + o.c[1] * .3 | 0, 235] : o.c;
    const s = z => z * (voile ? k : Math.min(1, k * 1.6));
    return { a: [o.a[0] * .9, o.a[1], s(o.a[2]) * .9], b: [o.b[0] * .9, o.b[1], s(o.b[2]) * .9], w: o.w * .9, h: o.h * .9, c };
  });
}
function nmDessin(d, sp) {                                     // le pictogramme : une silhouette en robe et sa visière
  if (sp.arche) { d.ligne(4, 14, 4, 4, [138, 144, 156], 2); d.ligne(12, 14, 12, 4, [138, 144, 156], 2); d.ligne(4, 3, 12, 3, [96, 104, 120], 2); d.rect(6, 5, 10, 13, [170, 130, 235]); return; }
  d.rect(6, 7, 10, 14, [92, 72, 118]); d.disque(8, 5, 2.2, [196, 160, 132]); d.rect(6, 3, 10, 4, [92, 72, 118]);
  d.ligne(7, 5, 10, 5, [150, 236, 255]); d.ligne(6, 10, 10, 10, [214, 170, 255]);
}
// le panneau de cible
function nmCible(o) {
  if (o.sp.arche) return ['Seuil des nomades', NM.car && NM.car.depart ? 'se referme' : 'ouvert'];
  if (o.pnjSuit) return [nomEspeceDe(o), 'bête de ' + (o.pnjSuit.nm ? o.pnjSuit.nm.nom : 'nomade') + (NM.car && NM.car.hostile ? ' · se défend' : ' · dressée')];
  const g = o.nm, a = NM.moi.amis[g.nom] || 0;
  return [g.nom, nmRole(g) + ' du Seuil · ' + (NM.car && NM.car.hostile ? 'se défend' : a >= 3 ? 'vous tient pour ami' : a >= 1 ? 'vous connaît' : 'ne vous connaît pas')];
}
// sur la boussole
function nmRepere() { const C = NM.car; return C && !C.depart ? { x: C.lieu[0], y: C.lieu[1], k: 'joueur', n: 'nomades' } : null; }
// le bouton d'action : parler, de près
function nmAction() {
  const C = NM.car; if (!C || C.hostile || C.depart) return null;
  let b = null, bd = NM_PORTEE * NM_PORTEE;
  for (const o of C.gens) { const d = (o.x - P.x) ** 2 + (o.y - P.y) ** 2; if (!o.dead && d < bd && Math.abs(o.z - P.z) < 1.5) { bd = d; b = o; } }
  if (!b) return null;
  return { v: 'PARLER', o: b.nm.nom + ' · ' + nmRole(b.nm), f: () => nmParler(b) };
}

// ============================================================
//  LE MOTEUR DE CONVERSATION
//  Un rôle est un recueil de nœuds. Un nœud : ce que dit le nomade (`dit` : un texte, des variantes
//  parmi lesquelles on tire, ou une fonction), et les réponses qu'on peut lui faire (`choix`). Une
//  réponse : { t: ce qu'on dit, va: le nœud suivant, si: condition pour qu'elle paraisse, grise:
//  paraît mais ne se choisit pas, fait: effet (peut rendre la réplique suivante), fin: on se quitte }.
//  Un nœud peut être une fonction du nomade (l'étal de la marchande se compose ainsi). Les textes
//  prennent des jetons : {nom} {moi} {bete} {betes} {role}. « Au revoir » s'ajoute de lui-même.
// ============================================================
const nmAmi = b => NM.moi.amis[b.nm.nom] || 0;
const nmNiveau = b => nmAmi(b) >= 3 ? 'ami' : nmAmi(b) >= 1 ? 'connu' : 'inconnu';
function nmGagne(b, n) { NM.moi.amis[b.nm.nom] = Math.min(10, nmAmi(b) + n); }
function nmJetons(s, b) {
  const C = NM.car, bsp = C ? C.bsp : null;
  return s.replace(/\{(\w+)\}/g, (_, k) => ({ nom: b.nm.nom, moi: P.pseudo || 'voyageur', role: nmRole(b.nm),
    bete: bsp ? bsp.n.toLowerCase() : 'bête', betes: bsp ? bsp.n.toLowerCase() + 's' : 'bêtes' })[k] ?? '');
}
// une réplique qu'il n'a pas encore dite, pour les indices ; sinon, n'importe laquelle
function nmPioche(cle, liste) {
  const neuves = liste.map((x, i) => i).filter(i => !NM.moi.dits.includes(cle + i));
  const i = neuves.length ? neuves[Math.random() * neuves.length | 0] : Math.random() * liste.length | 0;
  if (!NM.moi.dits.includes(cle + i)) NM.moi.dits.push(cle + i);
  return liste[i];
}
const NM_ACCUEIL = {
  marchand: {
    inconnu: ['Un visage neuf ! Approche. Ce que le Seuil apporte, {nom} le troque.', 'Bien le bonjour, voyageur. Mes lanternes ont vu cent îles, et mes sacs mille marchés.'],
    connu: ['Toi encore, {moi} ! Le Seuil a de la suite dans les idées.', 'Te revoilà. J\'ai gardé quelques bonnes affaires, au cas où.'],
    ami: ['{moi}, mon ami ! Pour toi, les meilleurs trocs — et les nouvelles fraîches.', 'Ah, voilà qui éclaire ma halte. Assieds-toi sur un ballot.'],
    froid: ['Tu nous as levé la main dessus, un jour. Je troque quand même : le Seuil n\'aime pas les rancunes.'],
  },
  dresseur: {
    inconnu: ['Doucement. {bete} ne te connaît pas, et moi non plus. Je suis {nom}.', 'Tu regardes ma bête ? Elle aussi te regarde. Je suis {nom}, je dresse.'],
    connu: ['{moi}. Ma bête se souvient de ton odeur, c\'est bon signe.', 'Te revoilà. As-tu écouté les bêtes, depuis ?'],
    ami: ['Mon ami ! Viens, {bete} te réclamait presque.', 'Ah, {moi}. Je t\'attendais sur une île ou une autre.'],
    froid: ['Ma bête n\'oublie pas les coups. Moi non plus. Parle, mais de loin.'],
  },
  conteur: {
    inconnu: ['Assieds-toi, voyageur. Le Seuil m\'a soufflé qu\'on se croiserait.', 'Je suis {nom}. Je raconte ce que les îles oublient.'],
    connu: ['Voilà celui qui écoute. Le Seuil t\'a gardé en vie, je vois.', '{moi}. J\'ai d\'autres histoires, si tu as encore des oreilles.'],
    ami: ['Mon ami, les étoiles des seuils parlaient de toi.', 'Viens, {moi}. Ce que je sais est à toi.'],
    froid: ['Les histoires se racontent même aux mains qui frappent. Écoute, et apprends la douceur.'],
  },
};
function nmAccueil(b) {
  const R = NM_ACCUEIL[b.nm.role], froid = NM.moi.morts.length && nmAmi(b) < 1;
  const L = froid ? R.froid : R[nmNiveau(b)];
  const perte = NM.moi.morts.length && Math.random() < .5 ? ' Nous avons perdu ' + NM.moi.morts[NM.moi.morts.length - 1] + ' sur une île. On ne l\'oublie pas.' : '';
  return L[Math.random() * L.length | 0] + perte;
}
// ---------- la marchande ----------
const NM_TROCS = [
  { donne: { bois: 12 }, recoit: { eclat: 4 } }, { donne: { fibre: 15 }, recoit: { baies: 6 } },
  { donne: { os: 6 }, recoit: { fleches: 12 } }, { donne: { pierre: 14 }, recoit: { eclat: 3 } },
  { donne: { eclat: 8 }, recoit: { nectar: 2 } }, { donne: { baies: 10 }, recoit: { os: 5 } },
  { donne: { os: 10 }, recoit: { eclat: 5 } }, { donne: { bois: 20, fibre: 10 }, recoit: { fleches: 24 } },
  { donne: { eclat: 10 }, recoit: { ferraille: 6 }, niv: 8 }, { donne: { ferraille: 6 }, recoit: { eclat: 12 }, niv: 10 },
  { donne: { pierre: 10, bois: 10 }, recoit: { fibre: 18 } }, { donne: { eclat: 6 }, recoit: { baies: 12 } },
];
const NM_MOTS = { bois: 'bois', fibre: 'fibres', pierre: 'pierres', os: 'os', eclat: 'éclats', ferraille: 'ferraille', nectar: 'nectar', baies: 'baies', fleches: 'flèches' };
function nmTirerTrocs() {
  const niv = typeof profondeur === 'function' ? profondeur() : 0;
  const L = NM_TROCS.filter(o => !(o.niv > niv)).slice().sort(() => Math.random() - .5).slice(0, 4);
  return L.map(o => ({ donne: o.donne, recoit: o.recoit, stock: 2 }));
}
const nmA = r => r === 'fleches' ? P.fleches || 0 : auSac(r);
const nmMet = (r, v) => { if (r === 'fleches') P.fleches = Math.max(0, v | 0); else metSac(r, v); };
const nmListe = o => Object.entries(o).map(([r, n]) => n + ' ' + NM_MOTS[r]).join(' et ');
function nmEtal(b) {
  const C = NM.car, ami = nmAmi(b) >= 3;
  const choix = C.trocs.map(o => {
    const manque = Object.entries(o.donne).filter(([r, n]) => nmA(r) < n);
    return { t: 'Donner ' + nmListe(o.donne) + ' contre ' + nmListe(o.recoit) + (ami ? ' (+1 pour un ami)' : '') + (o.stock <= 0 ? ' — épuisé' : manque.length ? ' — il vous manque ' + manque.map(([r, n]) => (n - nmA(r)) + ' ' + NM_MOTS[r]).join(', ') : ''),
      grise: o.stock <= 0 || manque.length > 0, va: 'etal',
      fait: () => {
        for (const [r, n] of Object.entries(o.donne)) nmMet(r, nmA(r) - n);
        for (const [r, n] of Object.entries(o.recoit)) nmMet(r, nmA(r) + n + (ami ? 1 : 0));
        o.stock--; nmGagne(b, 1); SON.jouer('ramasse'); if (typeof majSac === 'function') majSac();
        return ['Marché conclu. Que le Seuil te soit léger.', 'Tope là ! Tu ne le regretteras pas, pas avant trois îles.', 'Affaire faite. Mes sacs te remercient.'][Math.random() * 3 | 0];
      } };
  });
  return { dit: 'Voilà l\'étal. Ici, tout se paie en matière : le Seuil ne connaît pas les pièces.', choix: choix.concat([{ t: 'Parlons d\'autre chose.', va: 'accueil' }]) };
}
// ---------- le dresseur ----------
const NM_SAVOIRS = {
  'main-basse': { n: 'La main basse', d: 'Les bêtes paisibles s\'habituent à vous deux fois plus vite.', prix: { fibre: 12 },
    lecon: 'Garde la main basse, la paume ouverte, et ne regarde pas la bête dans les yeux. Elle s\'habituera deux fois plus vite.' },
  'regard-oblique': { n: 'Le regard oblique', d: 'Les coursiers vous acceptent deux fois plus vite.', prix: { os: 8 },
    lecon: 'Un coursier se méfie de qui le fixe. Regarde à côté de lui, jamais lui. Il viendra deux fois plus vite.' },
  'baie-chantee': { n: 'La baie chantée', d: 'Chaque baie donnée gagne moitié plus de confiance.', prix: { baies: 8 },
    lecon: 'Fredonne en tendant ce que tu donnes : une note grave, toujours la même. La bête t\'en saura moitié plus gré.' },
  'souffle-lent': { n: 'Le souffle lent', d: 'La méfiance des bêtes ombrageuses monte moins vite près de vous.', prix: { eclat: 6 },
    lecon: 'Respire par le ventre, lentement. Les bêtes ombrageuses entendent un cœur qui s\'emballe. Leur méfiance montera moins vite.' },
};
function nmApprendre(b) {
  const ami = nmAmi(b) >= 3, reste = Object.entries(NM_SAVOIRS).filter(([id]) => !nmSait(id));
  if (!reste.length) return { dit: 'Je t\'ai appris tout ce que je sais. Le reste, les bêtes te l\'apprendront.', choix: [{ t: 'Merci, {nom}.', va: 'accueil' }] };
  return { dit: ami ? 'Pour un ami, les leçons sont offertes. Que veux-tu apprendre ?' : 'Une leçon se paie : ce que je donne, je l\'ai appris de bêtes qui m\'ont mordu. Choisis.',
    choix: reste.map(([id, s]) => {
      const manque = !ami && Object.entries(s.prix).some(([r, n]) => nmA(r) < n);
      return { t: s.n + ' — ' + s.d + (ami ? ' (offert)' : ' (' + nmListe(s.prix) + ')'), grise: manque, va: 'apprendre',
        fait: () => {
          if (!ami) for (const [r, n] of Object.entries(s.prix)) nmMet(r, nmA(r) - n);
          NM.moi.savoirs.push(id); nmGagne(b, 1); if (typeof majSac === 'function') majSac();
          say('technique apprise · ' + s.n.toLowerCase(), 2.4);
          return s.lecon;
        } };
    }).concat([{ t: 'Plus tard.', va: 'accueil' }]) };
}
function nmSurBete(b) {
  const sp = NM.car.bsp, fam = sp.fam;
  const L = fam === 'doux' ? 'Les bêtes douces ne demandent que du temps. Du temps, et qu\'on ne coure pas autour d\'elles.'
    : fam === 'coursier' ? 'Un coursier ne se donne pas : il choisit. J\'ai tenu sur son dos jusqu\'à ce qu\'il cesse de se cabrer.'
    : fam === 'tellurien' ? 'Il ne quitte son sol que pour moi. Regarde sa pierre natale : la nuit, elle luit.'
    : sp.corps === 'felin' ? 'Le chat de brume ne se montre qu\'à ceux qu\'il a choisis. Les autres, il les regarde passer.'
    : sp.chasse ? 'Un chasseur se dresse comme on se fait un allié : jamais dans son dos, jamais le ventre vide.'
    : 'Chaque bête a sa manière. Celle-ci, je l\'ai apprise en la regardant vivre.';
  return L + ' Chez nous, il ' + sp.metier + '.';
}
// ---------- le conteur ----------
const NM_INDICES = {
  automates: [
    'Le tireur d\'élite se trahit : un rayon rouge, qui s\'épaissit, puis clignote. Au clignotement, change de cap, ou saute.',
    'Le mortier tire par-dessus les murs. Son obus marque le sol d\'un cercle rouge : sors-en. Et de près, il ne peut plus tirer.',
    'Casse la ligne de vue d\'un automate, ou frappe-le : il doit tout recommencer, sa visée comme sa patience.',
    'Les barrières des îles de métal battent au rythme du monde : deux secondes allumées, deux éteintes. L\'ambre prévient.',
    'Sous les tôles des îles de métal dort un souterrain. Aucune porte ne le signale : il faut marcher dessus.',
    'En bas, ce que tu trouves n\'est à toi qu\'une fois remonté. Le monte-charge est ton seul ami.',
    'La nuit, sur les îles de métal, tout s\'éteint. C\'est l\'heure de traverser.',
    'Les automates n\'arrivent qu\'au-delà du dixième seuil. Avant, ce sont les crocs qu\'il faut craindre.',
    'Un automate abattu se rallume, si l\'on sait s\'y prendre. Et il laisse toujours de la ferraille.',
  ],
  jeu: [
    'Les druses ne se valent pas : la couleur ne ment jamais, et l\'or vaut plus que le reste.',
    'Emporte ton campement au sac, et le seuil te mène plus loin. Mais tomber avant de le replanter coûte cher.',
    'Le mana, ce sont les éclats que tu portes. Ceux du coffre dorment.',
    'La pierre de foyer coûte d\'autant plus cher que tu t\'éloignes de ton feu.',
    'Certains sols n\'existent que plus loin : la tourbière d\'abord, la caldeira de cendre en dernier.',
    'Un chat de brume se fige quand on le regarde. Ne tourne pas le dos aux hautes herbes.',
    'Marche calmement, et les bêtes timides viendront te voir. Courir, c\'est crier.',
    'Les coursiers rares ne se montrent qu\'à ceux qui ont franchi assez de seuils.',
    'Les herbes hautes freinent le pas. Les troncs, eux, ne laissent passer personne.',
  ],
};
const NM_LORE = {
  peuple: ['Nous sommes les Nomades du Seuil. Nous n\'avons pas d\'île : nous avons les passages entre elles.',
    'Nos anciens tissaient la lumière des éclats en étoffe. Tu vois nos visières ? C\'est ce qu\'il nous en reste.',
    'On dit que nous descendons des premiers qui ont franchi un seuil, avant les Horlogers.'],
  seuil: ['Le Seuil a des marées. Nos lanternes les lisent, et nous allons où elles portent.',
    'Chaque île a son seuil, et chaque seuil se souvient de qui le franchit. Le tien se souvient de toi.',
    'Un seuil s\'ouvre plus facilement vers les îles qu\'on mérite. Personne ne sait qui en décide.'],
  origine: ['Nous venons de partout, et d\'une île qui n\'existe plus. Le Seuil l\'a gardée pour lui.',
    'D\'où je viens ? D\'une halte à l\'autre. La prochaine est déjà dans mes sacs.'],
};
// ---------- les recueils ----------
const NM_DIALOGUES = {
  marchand: {
    accueil: b => ({ dit: nmAccueil(b), choix: [
      { t: 'Montre-moi ce que tu as.', va: 'etal' }, { t: 'D\'où venez-vous ?', va: 'origine' },
      { t: 'Quelles nouvelles des îles ?', va: 'rumeur' }, { t: 'Qui sont les Nomades du Seuil ?', va: 'peuple', si: () => nmAmi(b) >= 1 }] }),
    etal: nmEtal,
    origine: () => ({ dit: NM_LORE.origine, choix: [{ t: 'Et vous ne vous arrêtez jamais ?', va: 'jamais' }, { t: 'Parlons d\'autre chose.', va: 'accueil' }] }),
    jamais: { dit: ['S\'arrêter, c\'est laisser le Seuil se refermer. Nous préférons les haltes : courtes, et souvent.'], choix: [{ t: 'Je comprends.', va: 'accueil' }] },
    rumeur: () => ({ dit: 'On raconte ceci, de halte en halte : ' + nmPioche('j', NM_INDICES.jeu).replace(/^./, c => c.toLowerCase()), choix: [{ t: 'Une autre ?', va: 'rumeur' }, { t: 'Parlons d\'autre chose.', va: 'accueil' }] }),
    peuple: () => ({ dit: NM_LORE.peuple, choix: [{ t: 'Parlons d\'autre chose.', va: 'accueil' }] }),
  },
  dresseur: {
    accueil: b => ({ dit: nmAccueil(b), choix: [
      { t: 'Parle-moi de ton {bete}.', va: 'bete' }, { t: 'Peux-tu m\'apprendre à dresser ?', va: 'apprendre' },
      { t: 'Comment l\'as-tu apprivoisé ?', va: 'histoire' }, { t: 'Puis-je le caresser ?', va: 'caresse' }] }),
    bete: b => ({ dit: nmSurBete(b), choix: [{ t: 'Et le mien, comment le choisir ?', va: 'choisir' }, { t: 'Parlons d\'autre chose.', va: 'accueil' }] }),
    choisir: { dit: ['Ne choisis pas la plus forte : choisis celle qui te regarde deux fois. Et nourris-la avant d\'en avoir besoin.'], choix: [{ t: 'Merci.', va: 'accueil' }] },
    apprendre: nmApprendre,
    histoire: { dit: ['Je l\'ai trouvé petit, sur une île qui brûlait. Il m\'a mordu trois fois. La quatrième, il a mangé dans ma main.',
      'Des nuits entières, immobile, à côté de lui. Le jour où il s\'est couché contre moi, j\'ai su.'], choix: [{ t: 'Belle histoire.', va: 'accueil' }] },
    caresse: b => nmAmi(b) >= 1
      ? { dit: 'Doucement, la main basse… Voilà. Il ferme les yeux : il t\'accepte.', choix: [{ t: 'Il est magnifique.', va: 'accueil', fait: () => { nmGagne(b, 0); return null; } }] }
      : { dit: 'Pas encore. Il faut qu\'il t\'ait vu revenir. Reviens nous voir.', choix: [{ t: 'Je reviendrai.', va: 'accueil' }] },
  },
  conteur: {
    accueil: b => ({ dit: nmAccueil(b), choix: [
      { t: 'Parle-moi des automates.', va: 'automates' }, { t: 'Un conseil pour la route ?', va: 'conseil' },
      { t: 'Qui êtes-vous ?', va: 'peuple' }, { t: 'Qu\'est-ce que le Seuil ?', va: 'seuil' }] }),
    automates: () => ({ dit: nmPioche('a', NM_INDICES.automates), choix: [{ t: 'Encore.', va: 'automates' }, { t: 'Autre chose.', va: 'accueil' }] }),
    conseil: () => ({ dit: nmPioche('j', NM_INDICES.jeu), choix: [{ t: 'Un autre.', va: 'conseil' }, { t: 'Autre chose.', va: 'accueil' }] }),
    peuple: () => ({ dit: NM_LORE.peuple, choix: [{ t: 'Et les Horlogers ?', va: 'horlogers' }, { t: 'Autre chose.', va: 'accueil' }] }),
    horlogers: { dit: ['Ils ont bâti les automates, et les ont laissés sans maître. Leurs horloges battent encore, sous les tôles. Personne n\'a trouvé le cœur de la dernière.'], choix: [{ t: 'Autre chose.', va: 'accueil' }] },
    seuil: () => ({ dit: NM_LORE.seuil, choix: [{ t: 'Autre chose.', va: 'accueil' }] }),
  },
};

// ---------- l'échange ----------
function nmParler(b) {
  const C = NM.car; if (!C || C.hostile) return;
  NM.parle = b; b.salutT = b.t; nmUI().classList.add('ouvert');
  if (typeof fauneGeste === 'function' && b.num !== undefined) fauneGeste('parle', { n: b.num, on: 1 });   // chez le gardien aussi, il s'arrête
  const e = document.getElementById('nm-dial');
  e.querySelector('.nm-nom').textContent = b.nm.nom;
  e.querySelector('.nm-role').textContent = nmRole(b.nm) + ' du Seuil';
  e.style.setProperty('--nm-lueur', 'rgb(' + b.nm.lueur.join(',') + ')');
  nmAller('accueil');
  if (!b.vuVisite) { b.vuVisite = true; nmGagne(b, 1); }                 // la première parole de la halte compte (après le salut)
}
function nmAller(id, replique) {
  const b = NM.parle; if (!b) return;
  const R = NM_DIALOGUES[b.nm.role];
  let n = R[id]; if (typeof n === 'function') n = n(b);
  if (!n) { nmFermer(); return; }
  NM.noeud = n;
  let dit = replique || (typeof n.dit === 'function' ? n.dit(b) : Array.isArray(n.dit) ? n.dit[Math.random() * n.dit.length | 0] : n.dit);
  nmEcrire(nmJetons(dit, b));
  const choix = (n.choix || []).filter(c => !c.si || c.si());
  if (!n.sansAdieu) choix.push({ t: 'Au revoir.', fin: true });
  const el = NM.ui.querySelector('.nm-choix'); el.innerHTML = '';
  choix.forEach((c, i) => {
    const bt = document.createElement('button');
    bt.innerHTML = '<kbd>' + (i + 1) + '</kbd>';
    bt.appendChild(document.createTextNode(nmJetons(c.t, b)));
    bt.disabled = !!c.grise;
    bt.onclick = e => { e.stopPropagation(); nmChoisir(c); };
    el.appendChild(bt);
  });
  NM.choix = choix;
}
function nmChoisir(c) {
  if (!c || c.grise || !NM.parle) return;
  if (NM.frappe) { nmFinirTexte(); }
  if (c.fin) { const b = NM.parle; nmEcrire(nmJetons(['Que le Seuil te garde, {moi}.', 'À une autre île.', 'Bonne route. On se recroisera.'][Math.random() * 3 | 0], b)); NM.ui.querySelector('.nm-choix').innerHTML = ''; NM.choix = null; NM.parle = null; NM.garde = b; setTimeout(() => { if (NM.garde === b) nmFermer(); }, 1400); return; }
  const r = c.fait ? c.fait() : null;
  nmAller(c.va || 'accueil', r || null);
}
function nmEcrire(txt) {
  txt = txt.replace(/^./, c => c.toUpperCase());
  const p = NM.ui.querySelector('.nm-dit'); NM.texte = txt; let i = 0;
  if (NM.frappe) clearInterval(NM.frappe);
  p.textContent = '';
  NM.frappe = setInterval(() => { i += 2; p.textContent = txt.slice(0, i); if (i >= txt.length) { clearInterval(NM.frappe); NM.frappe = null; } }, 16);
}
function nmFinirTexte() { if (NM.frappe) { clearInterval(NM.frappe); NM.frappe = null; } if (NM.ui) NM.ui.querySelector('.nm-dit').textContent = NM.texte; }
function nmFermer() {
  if (NM.parle && NM.parle.num !== undefined && typeof fauneGeste === 'function') fauneGeste('parle', { n: NM.parle.num, on: 0 });
  if (NM.frappe) { clearInterval(NM.frappe); NM.frappe = null; }
  NM.parle = null; NM.garde = null; NM.choix = null;
  if (NM.ui) NM.ui.classList.remove('ouvert');
}
function nmTouche(e) {
  if (!NM.ui || !NM.ui.classList.contains('ouvert') || !NM.choix) return;
  const k = e.code;
  if (/^Digit[1-9]$/.test(k) || /^Numpad[1-9]$/.test(k)) { e.preventDefault(); e.stopPropagation(); nmChoisir(NM.choix[+k.slice(-1) - 1]); }
  else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); nmFermer(); }
  else if (k === 'Enter' || k === 'Space') { e.preventDefault(); e.stopPropagation(); if (NM.frappe) nmFinirTexte(); }
}
function nmUI() {
  if (NM.ui) return NM.ui;
  const st = document.createElement('style');
  st.textContent = `
  #nm-dial{position:fixed;z-index:6;left:50%;transform:translateX(-50%);bottom:calc(160px + env(safe-area-inset-bottom));
    width:min(560px,calc(100% - 32px));box-sizing:border-box;padding:12px 14px 10px;border-radius:12px;display:none;
    background:rgba(22,26,38,.93);border:1px solid rgba(190,205,230,.28);box-shadow:0 8px 28px rgba(0,0,0,.45);
    color:#cfd6e4;font-size:14px;pointer-events:auto;backdrop-filter:blur(3px);--nm-lueur:#9fe6ff}
  #nm-dial.ouvert{display:block}
  #nm-dial .nm-tete{display:flex;align-items:baseline;gap:8px;margin-bottom:6px}
  #nm-dial .nm-nom{color:var(--nm-lueur);font-weight:700;letter-spacing:.5px;text-shadow:0 0 8px var(--nm-lueur)}
  #nm-dial .nm-role{color:#8b95aa;font-size:12px}
  #nm-dial .nm-dit{margin:0 0 10px;line-height:1.5;min-height:42px;cursor:pointer}
  #nm-dial .nm-choix{display:grid;gap:6px}
  #nm-dial .nm-choix button{text-align:left;font:inherit;font-size:13px;color:#cfd6e4;cursor:pointer;padding:7px 10px;border-radius:8px;
    background:rgba(40,46,64,.85);border:1px solid rgba(190,205,230,.2);line-height:1.35}
  #nm-dial .nm-choix button:hover:not(:disabled){border-color:var(--nm-lueur);color:#fff}
  #nm-dial .nm-choix button:disabled{opacity:.45;cursor:default}
  #nm-dial kbd{display:inline-block;min-width:16px;margin-right:8px;color:#ffd27d;font:inherit;font-size:12px}
  @media (max-width:600px){#nm-dial{bottom:calc(190px + env(safe-area-inset-bottom));font-size:13px}#nm-dial kbd{display:none}}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'nm-dial'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<div class="nm-tete"><span class="nm-nom"></span><span class="nm-role"></span></div><p class="nm-dit"></p><div class="nm-choix"></div>';
  el.querySelector('.nm-dit').onclick = e => { e.stopPropagation(); nmFinirTexte(); };
  for (const ev of ['pointerdown', 'touchstart', 'mousedown']) el.addEventListener(ev, e => e.stopPropagation(), { passive: true });
  document.body.appendChild(el);
  addEventListener('keydown', nmTouche, true);
  return NM.ui = el;
}
