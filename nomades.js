// ============================================================
//  LES NOMADES DU SEUIL — LES VOYAGEURS (§110)
//  Un peuple qui voyage d'île en île par les seuils, comme vous. De loin en loin, un seuil s'ouvre
//  sur l'île, à un endroit qui s'y prête (au bord de l'eau, sur une hauteur, près de l'arche), et un à
//  trois voyageurs en sortent pour une halte de quelques minutes (la nuit, autour d'un petit feu).
//  Chacun a son métier : la marchande (troc, curiosités), le dresseur et sa bête (une espèce tirée au
//  hasard, sauf les automates), le conteur (indices, tomes), le cartographe (il marque des lieux de
//  l'île à la boussole), le devin (il voit l'île qui attend derrière l'arche, et peut en chercher une
//  autre), l'égaré (il demande un service, et donne une curiosité). Les neuf d'avant reviennent parfois
//  (on les reconnaît) ; les autres sont des inconnus, tirés au hasard : un nom, une robe, un caractère.
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
const NM_ROLE = { marchand: ['marchand', 'marchande'], dresseur: ['dresseur', 'dresseuse'], conteur: ['conteur', 'conteuse'],
  cartographe: ['cartographe', 'cartographe'], devin: ['devin', 'devineresse'], egare: ['voyageur égaré', 'voyageuse égarée'] };
// Les inconnus : un nom de deux syllabes, une robe d'une teinte au hasard, un caractère qui colore leur accueil.
const NM_SYL = [['Ash', 'Bel', 'Cor', 'Dar', 'El', 'Fen', 'Gal', 'Hes', 'Ir', 'Jor', 'Kal', 'Lun', 'Mar', 'Nev', 'Or', 'Per', 'Quen', 'Ros', 'Sel', 'Tam', 'Ul', 'Var', 'Wen', 'Yl', 'Zor'],
  ['a', 'an', 'ec', 'el', 'en', 'ia', 'in', 'is', 'o', 'or', 'ra', 'un', 'yx', 'ette', 'ard', 'ine', 'ys']];
const NM_CARAC = {
  bavard: ['Oh, quelqu\'un ! Enfin quelqu\'un à qui parler.', 'Approche, approche : j\'ai tant à dire.'],
  mefiant: ['Pas plus près. Qui es-tu ?', 'Tu n\'as pas l\'air d\'une bête. C\'est déjà ça.'],
  joyeux: ['Belle île, n\'est-ce pas ? Viens voir !', 'Ha ! Un visage. Ça fait plaisir.'],
  presse: ['Vite, je ne reste pas longtemps.', 'Le seuil n\'attend pas : parle.'],
};
function nmVoyageur(role) {
  const r = a => a[Math.random() * a.length | 0], h = Math.random() * 6.2832, col = (s, l) => [0, 2.094, 4.189].map(d => Math.max(0, Math.min(255, (l + s * Math.cos(h + d)) | 0)));
  let nom = ''; for (let k = 0; k < 6 && (!nom || NM_GENS.some(g => g.nom === nom)); k++) nom = r(NM_SYL[0]) + r(NM_SYL[1]);
  return { nom, role, f: Math.random() < .5 ? 1 : 0, robe: col(40, 86), clair: col(50, 160), lueur: col(70, 200), carac: r(Object.keys(NM_CARAC)), inconnu: 1 };
}
const nmIdentite = g => g.inconnu ? { nom: g.nom, role: g.role, f: g.f, robe: g.robe, clair: g.clair, lueur: g.lueur, carac: g.carac, inconnu: 1 } : g.nom;   // ce qu'on dit d'eux aux autres joueurs (faune.js)
function nmLireIdentite(k) {
  if (typeof k === 'string') return NM_GENS.find(g => g.nom === k) || null;
  if (!k || typeof k !== 'object' || !NM_ROLE[k.role] || typeof k.nom !== 'string') return null;
  const c = a => Array.isArray(a) && a.length === 3 ? a.map(v => Math.max(0, Math.min(255, v | 0))) : [120, 110, 130];
  return { nom: k.nom.slice(0, 16), role: k.role, f: k.f ? 1 : 0, robe: c(k.robe), clair: c(k.clair), lueur: c(k.lueur), carac: NM_CARAC[k.carac] ? k.carac : 'joyeux', inconnu: 1 };
}
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
  if (C && !beasts.includes(C.arche)) { nmFermer(); NM.car = null; NM.prochain = t + 300 + Math.random() * 300; }
  if (typeof fauneSuiveur === 'function' && fauneSuiveur()) {   // la caravane est celle du gardien : on n'en tient que la parole
    if (NM.parle && (NM.parle.dead || Math.hypot(NM.parle.x - P.x, NM.parle.y - P.y) > 3.6 || (NM.car && NM.car.hostile))) nmFermer();
    if (NM.prochain !== null) NM.prochain = Math.max(NM.prochain, t + 120);
    return;
  }
  if (C && C.miroir) C.miroir = false;                    // devenu gardien : la caravane d'en face est la nôtre
  if (NM.prochain === null) NM.prochain = t + 60 + Math.random() * 120;   // (§110 : plus tôt, et plus souvent)
  if (!NM.car) { if (t > NM.prochain) nmVenir(false); }
  else nmCaravane(dt);
  if (NM.parle && (NM.parle.dead || Math.hypot(NM.parle.x - P.x, NM.parle.y - P.y) > 3.6 || (NM.car && NM.car.hostile))) nmFermer();
}
function nmVenir(force, pour) {
  if (NM.car) return false;
  const raid = typeof raidIci === 'function' && raidIci();
  if (!force && ((typeof djIci === 'function' && djIci()) || raid || Date.now() < NM.moi.rancune || P.pv <= 0)) { NM.prochain = t + 120; return false; }
  if (typeof djIci === 'function' && djIci()) { say('pas sous terre : le Seuil n\'y descend pas', 1.8); return false; }
  // qui vient : un à trois voyageurs, de métiers différents (le devin, à partir de l'exploration 3) ;
  // pour les trois métiers d'avant, une fois sur deux l'un des neuf qu'on connaît, s'il vit encore
  const niv = typeof profondeur === 'function' ? profondeur() : 0, vivants = NM_GENS.filter(g => !NM.moi.morts.includes(g.nom));
  const POIDS = { marchand: 3, conteur: 2.5, dresseur: 2, cartographe: 2, egare: 1.5, devin: niv >= 3 ? 1.3 : 0 };
  const nb = force && force.n ? force.n : 1 + (Math.random() < .55 ? 1 : 0) + (Math.random() < .25 ? 1 : 0), roles = [];
  if (force && force.roles) roles.push(...force.roles);
  while (roles.length < nb) { const L = Object.keys(POIDS).filter(r => POIDS[r] && !roles.includes(r)); let x = Math.random() * L.reduce((a, r) => a + POIDS[r], 0); for (const r of L) if ((x -= POIDS[r]) < 0) { roles.push(r); break; } }
  const qui = roles.map(r => { const L = vivants.filter(g => g.role === r); return L.length && Math.random() < .5 ? L[Math.random() * L.length | 0] : nmVoyageur(r); });
  // la halte : un replat sec, de préférence au bord de l'eau, sur une hauteur ou près de l'arche, à 14-32 cases d'un joueur
  const Js = typeof joueursFaune === 'function' ? joueursFaune() : [P], J = pour || (Js.length ? Js[Math.random() * Js.length | 0] : P);
  let lieu = null, best = -1e9;
  for (let k = 0; k < 120; k++) {
    const a = Math.random() * 6.2832, r = 14 + Math.random() * 18, x = J.x + Math.cos(a) * r, y = J.y + Math.sin(a) * r;
    if (x < 6 || y < 6 || x > WS - 6 || y > WS - 6) continue;
    let ok = true; const h = hAt(x | 0, y | 0);
    for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2 && ok; dx++) {
      const i = (x | 0) + dx, j = (y | 0) + dy;
      if (hAt(i, j) <= SEA || eauAt(i, j) || vide(i, j) || Math.abs(hAt(i, j) - h) > 1) ok = false;
    }
    if (!ok || Math.abs(h - J.z) > 6) continue;
    const A = typeof PortailIle !== 'undefined' && PortailIle, eau = typeof distEau === 'function' ? distEau(x | 0, y | 0) : 99;
    const sc = (eau < 6 ? 2 : 0) + (A && Math.hypot(A.x - x, A.y - y) < 10 ? 2 : 0) + Math.max(0, h - J.z) * .4 + Math.random();
    if (sc > best) { best = sc; lieu = [(x | 0) + .5, (y | 0) + .5]; }
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
  say('un seuil s\'ouvre ' + nmDirection(lieu) + ' · ' + (qui.length > 1 ? qui.length + ' voyageurs y font halte' : 'un voyageur y fait halte') + ' (à la boussole)', 3.5);
  return true;
}
function nmPartir() { if (NM.car) NM.car.fin = Math.min(NM.car.fin, t); }
const NM_DIR = ['à l\'est', 'au sud-est', 'au sud', 'au sud-ouest', 'à l\'ouest', 'au nord-ouest', 'au nord', 'au nord-est'];
const nmDirection = L => { const a = Math.atan2(L[1] - P.y, L[0] - P.x); return NM_DIR[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8] + ', à ' + Math.round(Math.hypot(L[0] - P.x, L[1] - P.y)) + ' cases'; };
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
  // la nuit, un petit feu au milieu de la halte (§110)
  if (!C.depart && typeof lumiere === 'function' && lumiere() < .5 && Math.random() < dt * 9)
    parts.push({ x: C.centre[0] + (Math.random() - .5) * .3, y: C.centre[1] + (Math.random() - .5) * .3, z: hAt(C.centre[0] | 0, C.centre[1] | 0) + .1, vx: 0, vy: 0, vz: .8 + Math.random() * .8, g: -.3, life: .7, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff7a2a', luit: 1, tl: .1 });
  nmServices(C, dt);
  // départ : tout le monde rentre ; le seuil se ferme derrière le dernier
  if (t > C.fin) {
    C.depart = true;
    const reste = C.gens.concat(C.betes).filter(o => beasts.includes(o) && !o.dead);
    if (!reste.length || t > C.fin + 40) { C.ferme = true; if (A.ouv <= 0) { A.dead = 1; nmFermer(); NM.car = null; NM.prochain = t + 300 + Math.random() * 300; } }
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
  } else if (b.sortir) {                                  // un service rendu : il s'en va par l'arche de l'île (§110)
    tx = b.sortir[0]; ty = b.sortir[1]; vit = b.sp.spd * .8;
    if (Math.hypot(tx - b.x, ty - b.y) < 1) { burst(b.x, b.y, b.z + .4, 10, '#bfe8ff'); b.dead = 1; return; }
    b.etat = 'repart';
  } else if (b.quete && b.quete.type === 'escorte' && b.quete.etat === 'en cours') {   // escorté : il vous suit, à deux pas
    const d = Math.hypot(P.x - b.x, P.y - b.y);
    if (d > 2) { tx = P.x - (P.x - b.x) / d * 1.6; ty = P.y - (P.y - b.y) / d * 1.6; vit = b.sp.spd * (d > 6 ? 1.3 : 1); } else b.dirT = Math.atan2(P.y - b.y, P.x - b.x);
    b.etat = 'suit';
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
  } else if (role === 'cartographe') {
    add([0, 0, tz + .07], [0, 0, tz + .085], .24, .24, [96, 70, 50]);             // un chapeau plat
    for (const s of [-1, 1]) add([-.15, s * .07, hz - .04], [-.15, s * .07, cou + .14], .05, .05, [228, 216, 182]);   // les cartes roulées, dans le dos
    add([-.13, 0, hz + .02], [-.13, 0, hz + .1], .12, .16, [120, 86, 56]);        // le carquois qui les tient
  } else if (role === 'egare') {
    add([-.14, 0, hz + .02], [-.15, 0, cou + .02], .2, .15, [124, 98, 70]);       // un baluchon, tout ce qui lui reste
    add([-.18, 0, cou + .02], [-.1, 0, cou + .08], .03, .03, [90, 70, 50]);
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
    const voile = Math.min(o.w, o.h) < .08 && Math.max(o.w, o.h) > .3;   // une lame mince et large : le voile
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
  cartographe: {
    inconnu: ['Tu marches sur ma carte, voyageur. Je suis {nom}, je dessine ce que les îles cachent.', 'Encore une île, encore une page. Je suis {nom}.'],
    connu: ['{moi} ! Je t\'ai mis dans un coin de carte, la dernière fois.', 'Te revoilà. J\'ai de l\'encre fraîche.'],
    ami: ['{moi}, mon ami. Pour toi, mes meilleurs secrets.', 'Ah ! Viens voir ce que j\'ai trouvé ici.'],
    froid: ['Je dessine aussi ceux qui frappent. Parle, mais ne t\'approche pas trop.'],
  },
  devin: {
    inconnu: ['Je t\'attendais. Ou quelqu\'un comme toi. Je suis {nom}.', 'Les seuils parlent, à qui sait écouter. Je suis {nom}.'],
    connu: ['{moi}. Tu es revenu, comme je l\'avais vu.', 'Je savais que nos chemins se recroiseraient.'],
    ami: ['{moi}, je t\'ai vu en rêve. Assieds-toi.', 'Les seuils me disent du bien de toi, ami.'],
    froid: ['Je l\'avais vu, ton coup. Je reste quand même.'],
  },
  egare: {
    inconnu: ['Oh… quelqu\'un. Je suis {nom}. Je crois que je me suis perdu.', 'Tu n\'es pas une bête ? Tant mieux. Je suis {nom}.'],
    connu: ['Toi ! Tu m\'as déjà tiré d\'affaire, une fois.', '{moi} ! Je me perds encore, tu vois.'],
    ami: ['{moi}, mon sauveur ! Quel bonheur.', 'Te voilà, ami. J\'ai encore besoin de toi.'],
    froid: ['Même toi, tu me fais peur. Mais je n\'ai personne d\'autre.'],
  },
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
  if (b.nm.inconnu && nmAmi(b) < 1 && Math.random() < .6) { const L = NM_CARAC[b.nm.carac] || NM_CARAC.joyeux; return L[Math.random() * L.length | 0] + ' Je suis ' + b.nm.nom + ', ' + nmRole(b.nm) + '.'; }
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
// Les curiosités (§109, index.html) : trois par halte, plus rares à mesure que l'île est loin ; une seule de chaque.
// Elles se paient en éclats et en matière ; un ami a un rabais, le sceau des nomades aussi.
function nmCurios(b) {
  const C = NM.car; if (!C.curios) C.curios = tirerCurios(typeof profondeur === 'function' ? profondeur() : 0, 3);
  const k = (nmAmi(b) >= 3 ? .85 : 1) * (1 - .25 * curioFx('marchand'));
  const choix = C.curios.map(id => {
    const o = CURIO[id], prix = prixCurio(o, k), a = !!P.objets[id], manque = Object.entries(prix).filter(([r, n]) => nmA(r) < n);
    return { t: o.n + ' · ' + NOM_RARE[o.r] + ' · ' + texteCurio(o) + ' — ' + nmListe(prix) + (a ? ' — elle est à vous' : manque.length ? ' — il vous manque ' + manque.map(([r, n]) => (n - nmA(r)) + ' ' + NM_MOTS[r]).join(' et ') : ''),
      grise: a || manque.length > 0, va: 'curios',
      fait: () => {
        for (const [r, n] of Object.entries(prix)) nmMet(r, nmA(r) - n);
        P.objets[id] = 1; if (typeof Sauve !== 'undefined') Sauve.sale = true; nmGagne(b, 1); SON.jouer('rare');
        say(o.n + ' · dans le sac · à porter depuis l\'onglet Sac', 3.5); if (typeof majSac === 'function') majSac();
        return ['Elle est à toi. ' + o.h, 'Prends-en soin. ' + o.h, 'Bon choix. ' + o.h][Math.random() * 3 | 0];
      } };
  });
  return { dit: C.curios.length ? 'Des curiosités, oui. Une seule de chaque, ramassées d\'île en île : plus on s\'éloigne, plus elles sont rares.' : 'Tu as déjà tout ce que je porte. Reviens plus loin, d\'autres m\'attendent.',
    choix: choix.concat([{ t: 'Parlons d\'autre chose.', va: 'accueil' }]) };
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
NM_INDICES.tomes = [
  'Chaque matière a trois tomes. Le premier se lit sur un lutrin de pierre, dans la terre qui lui ressemble : la fange dans la tourbière, la braise dans la caldeira.',
  'Les seconds tomes, les Horlogers les ont mis sous clé, dans leurs coffres gardés, sous les îles de métal. Il m\'en reste parfois un.',
  'Le troisième tome d\'une matière, la Tisseuse de fer le porte dans son ventre. Il faut la faire tomber pour le lire.',
  'Un tome ne s\'apprend pas sur la route. Il se déchiffre au pupitre d\'une bibliothèque, avec de l\'encre d\'éclat, et dans l\'ordre : pas de second sans premier.',
  'Qui tient déjà le Souffle connaît le vent sans l\'avoir lu. Pour les autres matières, il faut marcher.',
  'L\'effroi s\'écrit aussi. Son lutrin se dresse dans l\'ossuaire, ou sur les terres creuses : va le lire sans courir.',
  'Deux matières se mêlent dans une même phrase, si ta bibliothèque est assez haute. Sans leurs seconds tomes, l\'accord se défait une fois sur quatre — ou brûle les éclats dans ton sac, et tes mains avec.',
  'La fange et la braise, mêlées, donnent la poix. Ce qu\'elle prend, elle le brûle.',
  'Fange et cristal font la gangue. Une bête prise dedans casse comme du verre.',
  'Le vent porte les spores : les anciens disaient la nuée. Tout ce qui la respire t\'oublie.',
  'Vent et effroi, c\'est l\'épouvante. Elle vide une clairière en un souffle.',
  'Ne mêle pas les spores à la braise près des tiens. Les mineurs appelaient ça le grisou.',
  'L\'effroi et le cristal sonnent le glas : il achève ce qui chancelle déjà.',
  'Les accents dorment dans les troisièmes tomes. L\'aigu presse la phrase, le grave l\'alourdit, le circonflexe l\'étend.',
  'Un sort qu\'on a écrit, on peut le nommer. Les miens portent le nom de ceux qui me les ont appris.',
];
// Les tomes : où est le lutrin de l'île (il se marque à la boussole), ce qu'on en sait, et un
// Tome II à troquer par halte — offert à un ami.
function nmTomes(b) {
  const retour = { t: 'Autre chose.', va: 'accueil' };
  if (typeof LUTRINS === 'undefined') return { dit: 'Les livres dorment encore. Reviens me voir.', choix: [retour] };
  const ici = LUTRINS.filter(l => !tomeAcquis(l.m, 1));
  const dit = ici.length
    ? ici.map(l => { l.vu = true; return 'Un lutrin de pierre porte le ' + nomTome(cleTome(l.m, 1)) + ', ' + versLe(l.x - P.x, l.y - P.y) + '.'; }).join(' ') + ' La nuit, son livre luit : tu le verras de loin.'
    : nmPioche('t', NM_INDICES.tomes);
  const m = tomeConteur(), ami = nmAmi(b) >= 3, choix = [];
  if (m) {
    const manque = !ami && Object.entries(TOME_CONTEUR).some(([r, n]) => nmA(r) < n);
    choix.push({ t: 'Cède-moi le ' + nomTome(cleTome(m, 2)) + '.' + (ami ? ' (offert)' : ' (' + nmListe(TOME_CONTEUR) + ')'), grise: manque, va: 'tomes',
      fait: () => {
        if (!gagnerTome(m, 2)) return null;
        if (!ami) for (const [r, n] of Object.entries(TOME_CONTEUR)) nmMet(r, nmA(r) - n);
        P.tomeHalte = NM.moi.vues; nmGagne(b, 1); if (typeof majSac === 'function') majSac();
        say(nomTome(cleTome(m, 2)) + ' reçu · à déchiffrer au pupitre de la bibliothèque', 3.2);
        return 'Prends-en soin : les Horlogers l\'avaient mis sous clé. Il se déchiffre au pupitre, après son premier tome.';
      } });
  }
  choix.push({ t: 'Dis-m\'en plus.', va: 'tomesPlus' }, retour);
  return { dit, choix };
}
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
      { t: 'Tu as des curiosités ?', va: 'curios', si: () => typeof tirerCurios === 'function' }, { t: 'Montre-moi ce que tu as.', va: 'etal' }, { t: 'D\'où venez-vous ?', va: 'origine' },
      { t: 'Quelles nouvelles des îles ?', va: 'rumeur' }, { t: 'Qui sont les Nomades du Seuil ?', va: 'peuple', si: () => nmAmi(b) >= 1 }] }),
    etal: nmEtal,
    curios: nmCurios,
    origine: () => ({ dit: NM_LORE.origine, choix: [{ t: 'Et vous ne vous arrêtez jamais ?', va: 'jamais' }, { t: 'Parlons d\'autre chose.', va: 'accueil' }] }),
    jamais: { dit: ['S\'arrêter, c\'est laisser le Seuil se refermer. Nous préférons les haltes : courtes, et souvent.'], choix: [{ t: 'Je comprends.', va: 'accueil' }] },
    rumeur: () => ({ dit: nmRumeur(), choix: [{ t: 'Une autre ?', va: 'rumeur' }, { t: 'Parlons d\'autre chose.', va: 'accueil' }] }),
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
      { t: 'Que sais-tu de cette île ?', va: 'ile' }, { t: 'Un conseil pour la route ?', va: 'conseil' }, { t: 'Que sais-tu des tomes ?', va: 'tomes' }, { t: 'Parle-moi des automates.', va: 'automates' },
      { t: 'Qui êtes-vous ?', va: 'peuple' }, { t: 'Qu\'est-ce que le Seuil ?', va: 'seuil' }] }),
    tomes: nmTomes,
    tomesPlus: () => ({ dit: nmPioche('t', NM_INDICES.tomes), choix: [{ t: 'Encore.', va: 'tomesPlus' }, { t: 'Revenons aux tomes.', va: 'tomes' }, { t: 'Autre chose.', va: 'accueil' }] }),
    automates: () => ({ dit: nmPioche('a', NM_INDICES.automates), choix: [{ t: 'Encore.', va: 'automates' }, { t: 'Autre chose.', va: 'accueil' }] }),
    conseil: () => ({ dit: nmRumeur(), choix: [{ t: 'Un autre.', va: 'conseil' }, { t: 'Autre chose.', va: 'accueil' }] }),
    ile: () => ({ dit: nmIndiceVivant('ici') || 'Cette île ne m\'a rien dit que tu ne saches déjà. Les autres en savent peut-être plus : demande-leur.', choix: [{ t: 'Autre chose sur l\'île ?', va: 'ile' }, { t: 'Autre chose.', va: 'accueil' }] }),
    peuple: () => ({ dit: NM_LORE.peuple, choix: [{ t: 'Et les Horlogers ?', va: 'horlogers' }, { t: 'Autre chose.', va: 'accueil' }] }),
    horlogers: { dit: ['Ils ont bâti les automates, et les ont laissés sans maître. Leurs horloges battent encore, sous les tôles. Personne n\'a trouvé le cœur de la dernière.'], choix: [{ t: 'Autre chose.', va: 'accueil' }] },
    seuil: () => ({ dit: NM_LORE.seuil, choix: [{ t: 'Autre chose.', va: 'accueil' }] }),
  },
};

Object.assign(NM_DIALOGUES, {
  cartographe: {
    accueil: b => ({ dit: nmAccueil(b), choix: [{ t: 'Que sais-tu de cette île ?', va: 'cartes' }, { t: 'Des nouvelles ?', va: 'rumeur' }, { t: 'Comment dessines-tu les îles ?', va: 'metier' }] }),
    rumeur: () => ({ dit: nmRumeur(), choix: [{ t: 'Une autre ?', va: 'rumeur' }, { t: 'Autre chose.', va: 'accueil' }] }),
    cartes: nmCartes,
    metier: { dit: ['À pied, et en comptant mes pas. Le Seuil me pose quelque part ; je marche jusqu\'à ce que l\'île n\'ait plus de secret.', 'Je ne dessine pas les îles : je dessine ce qui s\'y cache. Le reste, n\'importe qui le voit.'], choix: [{ t: 'Autre chose.', va: 'accueil' }] },
  },
  devin: {
    accueil: b => ({ dit: nmAccueil(b), choix: [{ t: 'Que vois-tu derrière l\'arche ?', va: 'vision' }, { t: 'Cherche-moi un autre chemin.', va: 'autre', si: () => nmOracle() }, { t: 'Que vois-tu pour moi ?', va: 'rumeur' }, { t: 'Comment vois-tu ?', va: 'don' }] }),
    rumeur: () => ({ dit: nmRumeur(), choix: [{ t: 'Et encore ?', va: 'rumeur' }, { t: 'Autre chose.', va: 'accueil' }] }),
    vision: nmVision, autre: nmAutreChemin,
    don: { dit: ['Les seuils sont des portes qu\'on n\'a pas encore ouvertes. Moi, je regarde par le trou de la serrure.', 'Je ne vois pas l\'avenir. Je vois les îles qui attendent qu\'on vienne.'], choix: [{ t: 'Autre chose.', va: 'accueil' }] },
  },
  egare: {
    accueil: nmEgare,
  },
});
// ---------- le cartographe : il marque des lieux de l'île à la boussole (§110) ----------
// Ce qu'il sait : les lutrins jamais vus, la trappe du souterrain, le cercle des mages, la fourmilière, l'aire du
// dragon, l'antre de la Tisseuse, le cœur des biomes rares. Ce qu'il a marqué reste à la boussole tant qu'on est là.
function nmCoeurBiome(r) {
  let best = null, bs = 0;
  for (let y = 6; y < WS - 6; y += 3) for (let x = 6; x < WS - 6; x += 3) {
    if (famille(bAt(x, y)) !== r) continue; let n = 0;
    for (let dy = -3; dy <= 3; dy += 3) for (let dx = -3; dx <= 3; dx += 3) if (famille(bAt(x + dx, y + dy)) === r) n++;
    if (n > bs) { bs = n; best = [x + .5, y + .5]; }
  }
  return best;
}
function nmLieux() {
  const L = [], deja = new Set((NM.marques || []).filter(m => m.g === SEED).map(m => m.cle));
  if (typeof LUTRINS !== 'undefined') for (const l of LUTRINS) if (!l.vu && !l.lu && !tomeAcquis(l.m, l.n || 1)) L.push({ cle: 'lu' + (l.x | 0) + '.' + (l.y | 0), n: 'un lutrin de pierre, et son ' + nomTome(cleTome(l.m, l.n || 1)), x: l.x, y: l.y, prix: 10, lut: l });
  if (typeof DJ !== 'undefined' && DJ.trappe) L.push({ cle: 'trappe', n: 'la trappe du souterrain', x: DJ.trappe.x, y: DJ.trappe.y, prix: 14 });
  if (typeof SANG !== 'undefined' && SANG.cercle && SANG.phase === 'chant') L.push({ cle: 'cercle', n: 'le cercle des mages', x: SANG.cercle.x, y: SANG.cercle.y, prix: 8 });
  if (typeof Fourmi !== 'undefined' && Fourmi) L.push({ cle: 'fourmi', n: 'la fourmilière', x: Fourmi.x, y: Fourmi.y, prix: 6 });
  for (const o of beasts) { if (o.dead) continue;
    if (o.sp.dragon && o.nid) L.push({ cle: 'dragon', n: 'l\'aire du dragon', x: o.nid.x, y: o.nid.y, prix: 10 });
    if (Array.isArray(o.antre)) L.push({ cle: 'antre', n: 'l\'antre de la Tisseuse', x: o.antre[0], y: o.antre[1], prix: 12 }); }
  if (typeof RaresIle !== 'undefined') for (const r of new Set(RaresIle.map(famille))) { const R = rareDe(r), c = R && nmCoeurBiome(r); if (c) L.push({ cle: 'b' + r, n: 'le cœur : ' + R.n, x: c[0], y: c[1], prix: 6 }); }
  const vus = new Set(); return L.filter(l => !deja.has(l.cle) && !vus.has(l.cle) && vus.add(l.cle)).slice(0, 5);
}
function nmMarques() {                                     // pour la boussole (index.html, reperes)
  const L = (NM.marques || []).filter(m => m.g === SEED).map(m => ({ x: m.x, y: m.y, k: 'carte', n: m.n }));
  const C = NM.car; if (C) for (const b of C.gens) { const q = b.quete; if (q && q.type === 'sac' && q.etat === 'en cours' && !q.trouve && !q.fait) L.push({ x: q.x, y: q.y, k: 'carte', n: 'sac de ' + b.nm.nom }); }
  return L;
}
function nmCartes(b) {
  const L = nmLieux(), k = (nmAmi(b) >= 3 ? .7 : 1) * (1 - .25 * (typeof curioFx === 'function' ? curioFx('marchand') : 0));
  const choix = L.map(l => { const prix = Math.max(1, Math.round(l.prix * k)), manque = nmA('eclat') < prix;
    return { t: 'Marque-moi ' + l.n + ' — ' + prix + ' éclats' + (manque ? ' (il vous en manque ' + (prix - nmA('eclat')) + ')' : ''), grise: manque, va: 'cartes',
      fait: () => { nmMet('eclat', nmA('eclat') - prix); (NM.marques || (NM.marques = [])).push({ g: SEED, cle: l.cle, x: l.x, y: l.y, n: l.n.replace(/^(un |la |le |l')/, '') });
        if (NM.marques.length > 40) NM.marques.shift(); if (l.lut) l.lut.vu = true; nmGagne(b, 1); SON.jouer('ramasse'); if (typeof majSac === 'function') majSac();
        say(l.n + ' · ' + nmDirection([l.x, l.y]) + ' · à la boussole', 3.5); return 'Voilà. ' + nmDirection([l.x, l.y]).replace(/^./, c => c.toUpperCase()) + '. Tu ne peux pas le manquer.'; } }; });
  return { dit: L.length ? 'Ce que je sais de cette île, je le vends. Une marque à la boussole, et tu y vas tout droit.' : 'Cette île n\'a plus de secret pour toi. Ou alors je ne l\'ai pas encore trouvé.', choix: choix.concat([{ t: 'Autre chose.', va: 'accueil' }]) };
}
// ---------- le devin : l'île derrière l'arche (§110) ----------
// Il tire d'avance l'île que donnera le prochain portail (index.html, portailNormal) et la décrit ; il peut en
// chercher une autre, trois fois au plus, de plus en plus cher.
const nmOracle = () => P.oracle && P.oracle.de === SEED && P.oracle.n === profondeur() + 1;
function nmDecrire(g, n) {
  const L = [], meca = ileMecaGraine(g) && n >= NIV_MECA, et = typeof etatGraine === 'function' ? etatGraine(g, n) : null;
  if (meca) L.push('des tôles et des automates, et sous eux un souterrain');
  const rares = biomesGraine(g).map(b => rareDe(b)).filter(Boolean).map(R => R.n);
  L.push(rares.length ? rares.join(' et ') : 'des terres ordinaires, sans rien de rare');
  if (et === 'brume') L.push('une brume rouge, et des mages en cercle qui chantent');
  else if (et) L.push('le Korlaz : ce qu\'on y voit n\'est pas toujours là');
  return 'Derrière l\'arche, à l\'exploration ' + n + ' : ' + L.join(' ; ') + '.';
}
function nmVision(b) {
  if (nmOracle()) return { dit: nmDecrire(P.oracle.g, P.oracle.n), choix: [{ t: 'Cherche-moi un autre chemin.', va: 'autre' }, { t: 'Autre chose.', va: 'accueil' }] };
  const prix = nmAmi(b) >= 3 ? 0 : 6, manque = nmA('eclat') < prix;
  return { dit: 'Je peux regarder. Les seuils demandent un peu de lumière en échange : ' + (prix ? prix + ' éclats.' : 'pour toi, rien.'),
    choix: [{ t: prix ? 'Voici ' + prix + ' éclats.' : 'Regarde, alors.', grise: manque, va: 'vision', fait: () => { nmMet('eclat', nmA('eclat') - prix);
      P.oracle = { de: SEED, n: profondeur() + 1, g: tirerGraine(profondeur() + 1, SEED), essais: 0 }; nmGagne(b, 1); return null; } }, { t: 'Plus tard.', va: 'accueil' }] };
}
function nmAutreChemin(b) {
  if (!nmOracle()) return nmVision(b);
  const o = P.oracle, prix = 12 * (o.essais + 1), manque = nmA('eclat') < prix;
  if (o.essais >= 3) return { dit: 'Trois fois j\'ai cherché. Les seuils se taisent, maintenant : celle-ci sera la tienne. ' + nmDecrire(o.g, o.n), choix: [{ t: 'Autre chose.', va: 'accueil' }] };
  return { dit: 'Un autre chemin ? Chercher coûte plus cher que voir : ' + prix + ' éclats.', choix: [{ t: 'Voici ' + prix + ' éclats.', grise: manque, va: 'vision',
    fait: () => { nmMet('eclat', nmA('eclat') - prix); let g = o.g; for (let k = 0; k < 6 && g === o.g; k++) g = tirerGraine(o.n, SEED); o.g = g; o.essais++; return null; } }, { t: 'Garde celle-là.', va: 'accueil' }] };
}
// ---------- l'égaré : un service, et une curiosité en remerciement (§110) ----------
function nmQuete(b) {
  if (b.quete) return b.quete;
  const T = ['faim'], C = NM.car;
  const A = typeof PortailIle !== 'undefined' && PortailIle;
  if (A && !(C && C.miroir) && Math.hypot(A.x - b.x, A.y - b.y) > 15) T.push('escorte');
  let sac = null;
  for (let k = 0; k < 60 && !sac; k++) { const a = Math.random() * 6.2832, r = 18 + Math.random() * 17, x = b.x + Math.cos(a) * r, y = b.y + Math.sin(a) * r;
    if (x > 6 && y > 6 && x < WS - 6 && y < WS - 6 && hAt(x | 0, y | 0) > SEA && !eauAt(x | 0, y | 0) && !vide(x | 0, y | 0) && Math.abs(hAt(x | 0, y | 0) - b.z) < 6) sac = [(x | 0) + .5, (y | 0) + .5]; }
  if (sac) T.push('sac');
  const type = T[Math.random() * T.length | 0];
  return (b.quete = { type, etat: 'demande', x: sac && sac[0], y: sac && sac[1], z: sac && hAt(sac[0] | 0, sac[1] | 0) });
}
function nmRecompense(b) {
  const niv = typeof profondeur === 'function' ? profondeur() : 0, L = typeof tirerCurios === 'function' ? tirerCurios(niv, 1) : [];
  nmGagne(b, 3); SON.jouer('rare');
  if (L.length) { const o = CURIO[L[0]]; P.objets[o.id] = 1; if (typeof Sauve !== 'undefined') Sauve.sale = true; if (typeof majSac === 'function') majSac();
    say(b.nm.nom + ' vous donne ' + o.n + ' (' + NOM_RARE[o.r] + ') · dans le sac', 4.5); return 'Prends ceci. C\'est tout ce que j\'ai de précieux : ' + o.n + '. ' + o.h; }
  const ec = 20 + 5 * niv; P.sac.eclat += ec; say(b.nm.nom + ' vous donne ' + ec + ' éclats', 3); return 'Prends ces ' + ec + ' éclats. Je n\'ai rien de mieux, hélas.';
}
function nmEgare(b) {
  const q = nmQuete(b);
  if (q.fait) return { dit: ['Merci encore. Le Seuil te le rendra.', 'Je ne t\'oublierai pas.'][Math.random() * 2 | 0], choix: [] };
  if (q.type === 'faim') return { dit: nmAccueil(b) + ' Je n\'ai rien mangé depuis deux îles. Tu aurais six baies ?',
    choix: [{ t: 'Tiens, six baies.' + (P.baies < 6 ? ' (vous en avez ' + P.baies + ')' : ''), grise: P.baies < 6, va: 'accueil', fait: () => { P.baies -= 6; q.fait = true; return nmRecompense(b); } }, { t: 'Je n\'en ai pas assez. Je reviens.', va: 'accueil', fin: true }] };
  if (q.type === 'sac') {
    if (q.etat === 'en cours') return q.trouve
      ? { dit: 'Mon sac ! Tu l\'as retrouvé !', choix: [{ t: 'Le voici.', va: 'accueil', fait: () => { q.fait = true; return nmRecompense(b); } }] }
      : { dit: 'Mon sac est ' + nmDirection([q.x, q.y]) + '. Il est marqué à ta boussole, regarde.', choix: [] };
    return { dit: nmAccueil(b) + ' J\'ai lâché mon sac en fuyant une bête, ' + nmDirection([q.x, q.y]) + '. Tu me le rapporterais ?',
      choix: [{ t: 'J\'y vais.', va: 'accueil', fait: () => { q.etat = 'en cours'; say('le sac de ' + b.nm.nom + ' · ' + nmDirection([q.x, q.y]) + ' · à la boussole', 3.5); return 'Merci ! Il est marqué à ta boussole. Fais attention aux bêtes.'; } }, { t: 'Pas maintenant.', va: 'accueil', fin: true }] };
  }
  if (q.etat === 'en cours') return { dit: 'Je te suis. L\'arche, vite.', choix: [] };
  return { dit: nmAccueil(b) + ' Je cherche l\'arche de l\'île, mais les bêtes me font peur. Tu m\'y mènerais ?',
    choix: [{ t: 'Suis-moi.', va: 'accueil', fait: () => { q.etat = 'en cours'; say(b.nm.nom + ' vous suit · menez-le jusqu\'à l\'arche', 3.5); return 'Je te suis. Pas trop vite, mes jambes ne sont plus ce qu\'elles étaient.'; } }, { t: 'Pas maintenant.', va: 'accueil', fin: true }] };
}
// Les services en cours : le sac qu'on cherche (il luit), l'égaré qu'on escorte ; tant qu'ils durent, la halte attend.
function nmServices(C, dt) {
  for (const b of C.gens) {
    const q = b.quete; if (!q || q.fait || b.dead || q.etat !== 'en cours') continue;
    C.fin = Math.max(C.fin, t + 30);
    if (q.type === 'sac' && !q.trouve) {
      if (Math.random() < dt * 3) parts.push({ x: q.x + (Math.random() - .5) * .4, y: q.y + (Math.random() - .5) * .4, z: q.z + .2, vx: 0, vy: 0, vz: .5, g: 0, life: .8, age: 0, col: '#ffe9a0', luit: 1, tl: .07 });
      if (Math.hypot(q.x - P.x, q.y - P.y) < 1.6 && Math.abs(q.z - P.z) < 2) { q.trouve = true; SON.jouer('ramasse'); say('le sac de ' + b.nm.nom + ' · à lui rapporter', 3); }
    }
    if (q.type === 'escorte' && typeof PortailIle !== 'undefined' && PortailIle && Math.hypot(PortailIle.x + .5 - b.x, PortailIle.y + .5 - b.y) < 3.4) {
      q.fait = true; const r = nmRecompense(b); b.sortir = [PortailIle.x + .5, PortailIle.y + .5]; say(b.nm.nom + ' a trouvé l\'arche · merci !', 3); if (r && NM.parle === b) nmFermer();
    }
  }
}

// ---------- les indices vivants (§111) ----------
// Ce que disent les voyageurs ne vient plus d'une liste : c'est tiré de votre partie. Ce qu'il y a sur cette île
// (ils le marquent à la boussole), ce qui vous manque, ce qui vous coûte. Chaque indice entendu s'inscrit au
// carnet des Rumeurs (journal, P.rumeurs) ; aucun ne se redit (ceux d'une île : pas deux fois sur la même).
const nmArt = m => (TOME_DE[m] || '').replace(/^du /, 'le ').replace(/^de la /, 'la ').replace(/^de l'/, 'l\'');
function nmIndicesVivants() {
  const L = [], vus = new Set(), ajoute = (cle, txt, sorte, lieu) => vus.has(cle) || (vus.add(cle), L.push({ cle, txt, sorte, lieu })), dir = (x, y) => nmDirection([x, y]);
  const niv = typeof profondeur === 'function' ? profondeur() : 0;
  // --- ici
  if (typeof LUTRINS !== 'undefined') for (const l of LUTRINS) if (!l.vu && !l.lu && !tomeAcquis(l.m, l.n || 1)) {
    const cle = 'lu' + (l.x | 0) + '.' + (l.y | 0);
    ajoute('i:' + cle + ':' + SEED, 'Un lutrin de pierre dort ' + dir(l.x, l.y) + '. Le livre ouvert dessus a la couleur ' + MATIERE[l.m].de + '.', 'ici', { cle, x: l.x, y: l.y, n: 'lutrin de pierre', lut: l });
  }
  if (typeof DJ !== 'undefined' && DJ.trappe) ajoute('i:trappe:' + SEED, 'Sous les tôles de cette île, ' + dir(DJ.trappe.x, DJ.trappe.y) + ', il y a une trappe. Elle ne se voit pas : il faut marcher dessus.', 'ici', { cle: 'trappe', x: DJ.trappe.x, y: DJ.trappe.y, n: 'trappe du souterrain' });
  if (typeof SANG !== 'undefined' && SANG.cercle && SANG.phase === 'chant') ajoute('i:cercle:' + SEED, 'Le chant vient ' + dir(SANG.cercle.x, SANG.cercle.y) + ' : six mages en cercle. Tue-les avant la fin de l\'incantation, ou c\'est un démon qui sortira.', 'ici', { cle: 'cercle', x: SANG.cercle.x, y: SANG.cercle.y, n: 'cercle des mages' });
  if (typeof Fourmi !== 'undefined' && Fourmi) ajoute('i:fourmi:' + SEED, 'Une fourmilière, ' + dir(Fourmi.x, Fourmi.y) + '. Leur nectar remet sur pied, si l\'on sait le prendre sans se faire mordre.', 'ici', { cle: 'fourmi', x: Fourmi.x, y: Fourmi.y, n: 'fourmilière' });
  for (const o of beasts) { if (o.dead) continue;
    if (o.sp.dragon && o.nid) ajoute('i:dragon:' + SEED, 'Un dragon a son aire ' + dir(o.nid.x, o.nid.y) + '. N\'y monte pas sans une bonne armure, ni sans un plan pour redescendre.', 'ici', { cle: 'dragon', x: o.nid.x, y: o.nid.y, n: 'aire du dragon' });
    if (Array.isArray(o.antre)) ajoute('i:antre:' + SEED, 'La Tisseuse de fer dort dans son antre, ' + dir(o.antre[0], o.antre[1]) + '. Elle porte un troisième tome dans son ventre.', 'ici', { cle: 'antre', x: o.antre[0], y: o.antre[1], n: 'antre de la Tisseuse' }); }
  if (typeof RaresIle !== 'undefined') for (const r of new Set(RaresIle.map(famille))) { const R = rareDe(r); if (!R || P.biomes.includes(r)) continue; const c = nmCoeurBiome(r);
    if (c) ajoute('i:b' + r + ':' + SEED, R.n + ' pousse sur cette île, ' + dir(c[0], c[1]) + '. Tu n\'y as encore jamais mis les pieds.', 'ici', { cle: 'b' + r, x: c[0], y: c[1], n: R.n }); }
  // --- ce qui vous manque
  for (const k of P.tomesPortes || []) ajoute('m:porte:' + k, 'Tu portes le ' + nomTome(k) + ' sans l\'avoir déchiffré. Il se lit au pupitre de la bibliothèque, au campement, avec un peu d\'encre d\'éclat.', 'manque');
  for (const m of MATIERES) {
    const n = tomeDe(m.id); if (n >= TOME_MAX || tomePorte(m.id, n + 1)) continue;
    const ou = ouTome(m, n).replace(/^Tome [IV]+ : /, '');
    if (!n) { if (!m.brume || niv >= 6) ajoute('m:inconnue:' + m.id, 'Tu ne sais rien ' + TOME_DE[m.id] + ' (' + m.d + '). Son premier tome : ' + ou + '.', 'manque'); }
    else ajoute('m:suite:' + m.id + n, 'Ta connaissance ' + TOME_DE[m.id] + ' s\'arrête au tome ' + TOME_CH[n] + '. Le suivant : ' + ou + '.', 'manque');
  }
  if (typeof nivBiblio === 'function' && nivBiblio() >= 2) for (const M of MELANGES) {
    if (P.codex.includes(M.id) || M.mix.some(x => !tomeDe(x))) continue;
    const [a, b] = M.mix.map(nmArt);
    ajoute('m:accord:' + M.id, M.acc ? 'Mêle ' + a + ' et ' + b + '. Ce mélange-là a un nom, et il ne fait pas que la somme de ses deux effets.' : 'Tu connais ' + a + ' et ' + b + ', et tu ne les as jamais mêlés dans une même phrase.', 'manque');
  }
  for (const R of RARES) if (!P.biomes.includes(R.b) && R.niv <= niv + 2 && !(R.max < niv + 1)) ajoute('m:biome:' + R.b, 'Un biome rare court les îles : ' + R.n + '. ' + (R.max ? 'Il ne paraît que de l\'exploration ' + R.niv + ' à la ' + R.max + 'e ; après, seule une île gardée y ramène' : R.niv <= 1 ? 'Il peut paraître n\'importe où' : 'Il ne paraît qu\'à partir de l\'exploration ' + R.niv) + (niv >= R.niv ? '. Ouvre l\'œil, ou demande à un devin ce qu\'il y a derrière l\'arche.' : '. Tu n\'en es qu\'à ' + niv + '.'), 'manque');
  if (niv >= 6 && !(P.brumesLevees || []).length && typeof tomeDe === 'function' && tomeDe('sang') < 3) ajoute('m:brume', 'Sur certaines îles, au-delà de la sixième, une brume rouge tombe : tout ce qui vit s\'y entretue. Le Sang ne s\'apprend que là.', 'manque');
  if (!P.compagnes.length) ajoute('m:compagne', 'Une bête qui te suit vaut mieux qu\'une épée. Marche calmement près des timides et nourris-les : elles viendront.', 'manque');
  const cu = typeof CURIOS !== 'undefined' ? CURIOS.filter(c => P.objets[c.id]) : [];
  if (!cu.length) ajoute('m:curios', 'Les voyageurs vendent des curiosités : des objets uniques, de plus en plus rares à mesure qu\'on s\'éloigne de chez soi. Les égarés en donnent aussi, à qui les aide.', 'manque');
  else if (!cu.some(c => curioPortee(c.id))) ajoute('m:curiosPortees', 'Tu as des curiosités dans ton sac et tu n\'en portes aucune. Elles ne font rien au fond d\'un sac.', 'manque');
  // --- ce qui vous coûte
  const cp = typeof coeursPerdus === 'function' ? coeursPerdus() : 0;
  if (cp) ajoute('c:coeurs' + cp + ':' + SEED, 'Tu as déjà laissé ' + cp + ' cœur' + (cp > 1 ? 's' : '') + ' sur cette expédition. Encore un peu, et ton sac s\'allège au retour. La pierre de foyer ramène au feu, si tu as le mana.', 'cout');
  if ((P.sac.eclat || 0) < 8) ajoute('c:mana', 'Tes éclats sont ton mana. Ceux qui dorment au coffre ne lancent aucun sort.', 'cout');
  if (!P.equip.armure) ajoute('c:armure', 'Tu marches sans armure. L\'établi en fait une, et les bêtes d\'ici mordent fort.', 'cout');
  if (!P.equip.arme) ajoute('c:arme', 'Tu n\'as rien en main pour te défendre. L\'établi taille un gourdin avec un peu de bois.', 'cout');
  if (typeof lumiere === 'function' && lumiere() < .5 && !P.equip.lumiere) ajoute('c:nuit', 'La nuit est là et tu n\'as pas de lumière. Une lanterne se fabrique à l\'établi.', 'cout');
  if (P.pv < .4) ajoute('c:pv:' + SEED + (t / 120 | 0), 'Tu saignes. Mange quelque chose, ou bois un nectar, avant d\'aller plus loin.', 'cout');
  return L;
}
// Un indice qu'on n'a pas encore dit : d'ici (pref 'ici'), ou au hasard (d'ici quatre fois sur dix) ; il s'écrit au carnet.
function nmIndiceVivant(pref) {
  const L = nmIndicesVivants().filter(h => !NM.moi.dits.includes('v:' + h.cle));
  const ici = L.filter(h => h.sorte === 'ici'), autres = L.filter(h => h.sorte !== 'ici');
  const S = pref === 'ici' ? ici : ici.length && (Math.random() < .4 || !autres.length) ? ici : autres;
  if (!S.length) return null;
  const h = S[Math.random() * S.length | 0];
  NM.moi.dits.push('v:' + h.cle);
  (P.rumeurs || (P.rumeurs = [])).unshift({ t: h.txt, g: h.lieu ? SEED : 0, x: h.lieu ? Math.round(h.lieu.x * 10) / 10 : 0, y: h.lieu ? Math.round(h.lieu.y * 10) / 10 : 0, n: typeof profondeur === 'function' ? profondeur() : 0 });
  if (P.rumeurs.length > 40) P.rumeurs.length = 40;
  if (h.lieu && !(NM.marques || []).some(m => m.g === SEED && m.cle === h.lieu.cle)) { (NM.marques || (NM.marques = [])).push({ g: SEED, cle: h.lieu.cle, x: h.lieu.x, y: h.lieu.y, n: h.lieu.n }); if (h.lieu.lut) h.lieu.lut.vu = true; }
  if (typeof Sauve !== 'undefined') Sauve.sale = true;
  return h.txt + (h.lieu ? ' (Marqué à ta boussole.)' : '');
}
const nmRumeur = () => nmIndiceVivant() || nmPioche('j', NM_INDICES.jeu);

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
