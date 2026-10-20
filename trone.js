// Stone Valley — LE BAS DES CERCLES (trone.js) : les Jardins de soufre, le Trône, les reliquaires (§166)
// Suite de roi.js, qui garde la main (roiGenere, roiPeupler, roiMaj, roiDecor, roiAction, roiOuvrir, roiButin
// appellent ce qui suit selon le cercle). Ici :
//  - LES OBJETS UNIQUES, introuvables ailleurs, chacun dans le reliquaire d'un cercle : le Bouclier d'obsidienne
//    (les Galeries), le Fouet de chaînes (les Forges), le Bâton de l'Abîme (les Ossuaires), la Lame de soufre (les
//    Jardins) ; et sur le Roi : la Couronne du Roi démon et le Sang du Roi. roiInit les inscrit (index.html l'appelle
//    après djInit) ; leurs effets passent par roiCoupArme, roiRenvoi, roiSortAbime, roiDos, roiGeomArme.
//  - LES RELIQUAIRES : une salle de défi par cercle ; la porte se ferme, trois vagues, puis le reliquaire s'ouvre.
//  - 4. LES JARDINS DE SOUFRE : la flore vive du démon (celle de l'île démoniaque, flore.js), des poches de soufre
//    qui empoisonnent et s'enflamment, des geysers de flammes, les sorcières de soufre et leurs cercles de feu ;
//    LE JARDINIER, une gueule géante enracinée dont les lianes courent dans toute la salle.
//  - 5. LE TRÔNE : le Roi démon, en trois temps (assis, debout, puis dans les airs au-dessus d'un sol de lave).

const ROI_UNIQUES = { 1: 'obsidienne', 2: 'fouet', 3: 'abime', 4: 'soufre' };   // le reliquaire de chaque cercle

// ============================================================
//  LES OBJETS UNIQUES
// ============================================================
function roiInit() {
  const O = [
    { id: 'soufre', n: 'Lame de soufre', emp: 'arme', deg: .84, cad: .32, port: 2.0, offert: 1, donjon: 1, unique: 1, cout: {},
      d: 'dégâts 84 · vos coups brûlent · l\'objet unique des Jardins de soufre' },
    { id: 'fouet', n: 'Fouet de chaînes', emp: 'arme', deg: .5, cad: .55, port: 4.2, offert: 1, donjon: 1, unique: 1, cout: {},
      d: 'dégâts 50 · portée de quatre pas · il tire la bête jusqu\'à vous · l\'objet unique des Forges hurlantes' },
    { id: 'obsidienne', n: 'Bouclier d\'obsidienne', emp: 'armure', red: .55, renvoie: 1, offert: 1, donjon: 1, unique: 1, cout: {},
      d: '−55 % de dégâts · porté dans le dos : les boules de feu qui vous arrivent de face repartent d\'où elles viennent · l\'objet unique des Galeries de cendre' },
    { id: 'abime', n: 'Bâton de l\'Abîme', emp: 'grimoire', mana: 14, offert: 1, donjon: 1, unique: 1, cout: {},
      d: 'un sort de feu : une boule noire et rouge qui éclate, frappe et brûle tout autour · l\'objet unique des Ossuaires' },
  ];
  for (const o of O) if (!OBJETS.some(x => x.id === o.id)) OBJETS.push(o);
  // l'arme en main : la lame de soufre se tient et frappe comme la lame d'éclat ; le fouet, comme le gourdin
  GARDES.soufre = GARDES.lame; SEQ_ARME.soufre = ['lame', 'lame2']; RANGEES.soufre = RANGEES.lame;
  ARRET_ARME.soufre = .035; RECUL_ARME.soufre = 2.5; LONG_ARME.soufre = .4; COUL_TRAINEE.soufre = '#ffd84a';
  GARDES.fouet = { g: [.1, -.12, .3], u: nrm([.5, -.1, .86]), l: 0, w: .05, s: .01, p: .03, m2: [.08, .13, .33] };
  SEQ_ARME.fouet = ['gourdin']; RANGEES.fouet = (h, n) => ({ o: v3.add(h, [.02, -.15, .02]), u: nrm([.2, -.1, .97]) });
  ARRET_ARME.fouet = .03; RECUL_ARME.fouet = 1; LONG_ARME.fouet = .2; COUL_TRAINEE.fouet = '#b8b0a8';
  // la couronne du Roi : une curiosité, la plus haute
  if (typeof CURIOS !== 'undefined' && !CURIO.cu_roi) {
    const c = { id: 'cu_roi', n: 'Couronne du Roi démon', r: 6, forme: 'couronne', c: [150, 24, 30], mat: 'os', fx: { fort: 2, braise: 2, regen: 1 },
      d: 'coups puissants ; insensible aux braises ; la vie revient d\'elle-même', h: 'Sept pointes d\'obsidienne, et elle est encore chaude. Personne ne l\'a jamais portée deux fois.' };
    CURIOS.push(c); CURIO[c.id] = c;
    OBJETS.push({ id: c.id, n: c.n, emp: 'breloque', fil: 'curiosite', offert: 1, cur: 1, donjon: 1, cout: {}, d: texteCurio(c).replace(/^./, x => x.toUpperCase()) + '.' });
    if (typeof DESSINS === 'object') DESSINS[c.id] = d => dessinCurio(d, c);
  }
  if (typeof DESSINS === 'object') {
    DESSINS.soufre = d => { d.ligne(5, 11, 13, 3, [64, 52, 30], 2); d.ligne(6, 10, 12, 4, [255, 220, 80]); d.net(13, 2, [255, 244, 170]);
      d.ligne(3, 8, 8, 13, [140, 30, 26]); d.ligne(3, 13, 5, 11, [40, 30, 30], 2); d.net(2, 14, [255, 200, 60]); };
    DESSINS.fouet = d => { d.ligne(2, 14, 5, 11, [70, 50, 36], 2); d.net(2, 15, [40, 30, 26]);
      for (let k = 0; k < 9; k++) { const a = k * .7, x = 6 + k * .9 + Math.sin(a) * 1.2, y = 10 - k * .9 + Math.cos(a) * .8; d.net(x | 0, y | 0, k & 1 ? [150, 146, 140] : [104, 100, 96]); }
      d.disque(13.5, 2.5, 1.2, [176, 170, 164]); };
    DESSINS.obsidienne = d => { d.rect(3, 2, 12, 9, [150, 30, 28]); for (let y = 10; y <= 14; y++) { const r = (14 - y) * .9 + .5; d.rect(Math.round(7.5 - r), y, Math.round(7.5 + r), y, [150, 30, 28]); }
      d.rect(4, 3, 11, 9, [24, 18, 28]); for (let y = 10; y <= 13; y++) { const r = (13 - y) * .8; d.rect(Math.round(7.5 - r), y, Math.round(7.5 + r), y, [24, 18, 28]); }
      d.ligne(5, 4, 9, 8, [90, 70, 120]); d.disque(7.5, 7, 1.3, [255, 90, 40]); };
    DESSINS.abime = d => { d.ligne(3, 14, 11, 4, [44, 30, 34], 2); d.ligne(4, 14, 12, 4, [70, 50, 50]);
      d.disque(12, 3.5, 2.6, [30, 12, 20]); d.disque(12, 3.5, 1.5, [255, 70, 30]); d.net(12, 3, [255, 220, 140]); d.net(9, 7, [255, 120, 40]); d.net(14, 6, [255, 120, 40]); };
  }
}
// Le fouet en main : une poignée gainée, la chaîne enroulée qui pend ; la lame de soufre : une lame noire au fil jaune.
function roiGeomArme(id, at, vv, pose) {
  if (id === 'soufre') {
    pose(at(-.05), at(-.03), .03, .03, [255, 200, 60]);                       // le pommeau, une pierre de soufre
    pose(at(-.03), at(.045), .024, .024, [60, 34, 30]);
    pose(vv(at(.05), -.05), vv(at(.05), .05), .024, .024, [140, 30, 26]);     // la garde, en cornes
    pose(vv(at(.05), -.05), vv(at(.08), -.07), .018, .018, [140, 30, 26]); pose(vv(at(.05), .05), vv(at(.08), .07), .018, .018, [140, 30, 26]);
    pose(at(.055), at(.34), .042, .013, [52, 42, 30]);                        // la lame, noire
    pose(vv(at(.06), .018), vv(at(.33), .012), .012, .015, [255, 222, 90]);   // le fil, jaune
    pose(at(.34), at(.41), .022, .01, [255, 236, 150]);
  } else if (id === 'fouet') {
    pose(at(-.04), at(.16), .03, .03, [70, 50, 36]);                          // la poignée de cuir
    pose(at(.14), at(.18), .04, .04, [130, 126, 120]);                        // la virole
    let q = at(.18);
    for (let k = 1; k <= 7; k++) { const n = v3.add(q, [-.012 - Math.sin(t * 3 + k) * .006, Math.sin(t * 2.4 + k * .8) * .01, -.045]);
      pose(q, n, k & 1 ? .016 : .03, k & 1 ? .03 : .016, k & 1 ? [150, 146, 140] : [110, 106, 102]); q = n; }   // la chaîne qui pend
    pose(q, v3.add(q, [0, 0, -.04]), .035, .035, [176, 170, 164]);              // le crochet
  }
}
// Sur le dos : le bouclier d'obsidienne, par-dessus le sac.
function roiDos(J, hip, neck, B) {
  if (!(J === P ? P.equip.armure === 'obsidienne' : J.armure === 'obsidienne')) return;
  const c = v3.add(mixv(hip, neck, .55), [-.17, 0, 0]);
  B.push({ a: v3.add(c, [.005, -.14, 0]), b: v3.add(c, [.005, .14, 0]), w: .03, h: .32, c: [130, 26, 24] });     // le bord rouge
  B.push({ a: v3.add(c, [-.01, -.125, .005]), b: v3.add(c, [-.01, .125, .005]), w: .03, h: .29, c: [24, 18, 28] });   // l'obsidienne
  B.push({ a: v3.add(c, [-.02, -.06, .07]), b: v3.add(c, [-.02, .02, -.04]), w: .02, h: .03, c: [92, 70, 120] });    // un reflet
  B.push({ a: v3.add(c, [-.025, 0, 0]), b: v3.add(c, [-.06, 0, 0]), w: .05, h: .05, c: [255, 90, 40] });             // l'umbo, une braise
}
// Un coup qui porte (pacteCoup, roi.js) : la lame de soufre brûle, le fouet tire la bête à vous.
const ROI_LOURDS = new Set(['demon', 'mere', 'bourreau', 'choeur', 'jardinier', 'roi', 'gueule', 'gargouille']);
function roiCoupArme(b) {
  const a = P.equip.arme;
  if (a === 'soufre') { b.brule = t + 3; for (let k = 0; k < 6; k++) parts.push({ x: b.x + (Math.random() - .5) * .5, y: b.y + (Math.random() - .5) * .5, z: b.z + .4 + Math.random() * .6, vx: 0, vy: 0, vz: 1.2, g: -.3, life: .5, age: 0, col: Math.random() < .5 ? '#ffd84a' : '#ff8a30', luit: 1, tl: .06 }); }
  if (a === 'fouet') {
    const d = Math.hypot(b.x - P.x, b.y - P.y);
    for (let k = 0; k < 14; k++) { const f = k / 14; parts.push({ x: P.x + (b.x - P.x) * f, y: P.y + (b.y - P.y) * f, z: P.z + 1 + ((b.z || P.z) + .6 - P.z - 1) * f, vx: 0, vy: 0, vz: 0, g: 0, life: .22, age: 0, col: k & 1 ? '#9a948c' : '#c8c2b8', tl: .06 }); }
    if (d > 1.6 && !ROI_LOURDS.has(b.sp.corps) && !b.sp.boss && !b.sp.plante && !b.sp.batiment && (b.sp.sz || 1) < 1.8) {
      const a2 = Math.atan2(b.y - P.y, b.x - P.x); b.tire = { t0: t, x0: b.x, y0: b.y, x1: P.x + Math.cos(a2) * 1.2, y1: P.y + Math.sin(a2) * 1.2 };
      SON.jouer('prise', {}, b.x, b.y, b.z + .5);
    }
  }
}
// À chaque image, partout : les bêtes qui brûlent, celles que le fouet ramène, le fouet qui claque.
function roiMajArmes(dt) {
  for (const b of beasts) {
    if (b.brule > t && !b.dead && b.pv > 0) {
      b.pv -= .06 * dt / (robuste(b) || 1);
      if (Math.random() < dt * 10) parts.push({ x: b.x + (Math.random() - .5) * .6, y: b.y + (Math.random() - .5) * .6, z: b.z + Math.random() * .8, vx: 0, vy: 0, vz: .8, g: -.2, life: .5, age: 0, col: '#ff8a30', luit: 1, tl: .06 });
      if (b.pv <= 0) { mourirBete(b, 'feu'); if (typeof butin === 'function') butin(b); }
    }
    if (b.tire && !b.dead) {
      const u = Math.min(1, (t - b.tire.t0) / .28), T = b.tire, x = T.x0 + (T.x1 - T.x0) * u, y = T.y0 + (T.y1 - T.y0) * u, h = hAt(x | 0, y | 0);
      if (Math.abs(h - hAt(b.x | 0, b.y | 0)) <= 1.2 && !(Eau[(y | 0) * WS + (x | 0)] > h)) { b.x = x; b.y = y; b.z = sol(x, y); }
      if (u >= 1) b.tire = null;
    }
  }
  const A = P.anim;                                            // le fouet : la chaîne file devant vous dans la partie vive du coup
  if (A && A.k === 'arme' && A.arme === 'fouet') { const x = (t - A.t0) / A.dur;
    if (x > .42 && x < .66) { const L = 4.2 * Math.min(1, (x - .42) / .12), a = P.face, h = P.z + .9;
      for (let k = 0; k < 6; k++) { const s = Math.random() * L; parts.push({ x: P.x + Math.cos(a) * s, y: P.y + Math.sin(a) * s, z: h + Math.sin(s * 2) * .08, vx: 0, vy: 0, vz: 0, g: 0, life: .1, age: 0, col: k & 1 ? '#9a948c' : '#d0cac0', tl: .055 }); } } }
}
// LE BOUCLIER D'OBSIDIENNE (impactTir, index.html) : une boule de feu qui vous arrive de face repart d'où elle vient,
// devenue la vôtre (un trait de braise). Renvoie vrai si elle a été renvoyée.
function roiRenvoi(f) {
  if (P.equip.armure !== 'obsidienne' || !f.feu || f.renvoye) return false;
  const v = Math.hypot(f.vx, f.vy) || 1;
  if ((-f.vx * Math.cos(P.face) - f.vy * Math.sin(P.face)) / v < .25) return false;
  const D = f.de && !f.de.dead && f.de.x !== undefined ? f.de : null;   // vers celui qui l'a lancée, s'il est encore là
  f.renvoye = true; f.de = null; f.feu = true; f.sortM = 'braise'; f.deg = .7; f.c = [255, 140, 60]; f.age = 0;
  if (D) { const dx = D.x - f.x, dy = D.y - f.y, d = Math.hypot(dx, dy) || 1, s = Math.max(9, v * 1.2), vol = d / s; f.vx = dx / vol; f.vy = dy / vol; f.vz = ((D.z || 0) + 1 - f.z) / vol + TIR_G * vol * .5; }
  else { f.vx = -f.vx * 1.2; f.vy = -f.vy * 1.2; f.vz = Math.abs(f.vz) * .3 + 1; }
  SON.jouer('clank', { vol: 1 }, P.x, P.y, P.z + 1); burst(f.x, f.y, f.z, 14, '#ffb060');
  if (t - (ROI.renvoiDit || -99) > 25) { ROI.renvoiDit = t; say('l\'obsidienne renvoie le feu', 1.6); }
  return true;
}
// LE BÂTON DE L'ABÎME (lancerSort, index.html) : une boule de feu noir et rouge, vers ce que vous visez (ou devant vous).
function roiSortAbime() {
  let c = CIB.o && !CIB.o.dead && CIB.o.pv > 0 ? CIB.o : null;
  if (!c) { let bd = 196; for (const o of beasts) { if (o.dead || o.tame || !(o.pv > 0) || o.sp.plante) continue;
    const dx = o.x - P.x, dy = o.y - P.y, d2 = dx * dx + dy * dy; if (d2 > bd || (dx * Math.cos(P.face) + dy * Math.sin(P.face)) / Math.sqrt(d2 || 1) < .6) continue; bd = d2; c = o; } }
  const ox = P.x + Math.cos(P.face) * .5, oy = P.y + Math.sin(P.face) * .5, oz = P.z + 1.2;
  const cx = c ? c.x : P.x + Math.cos(P.face) * 10, cy = c ? c.y : P.y + Math.sin(P.face) * 10, cz = c ? (c.z || 0) + .7 : P.z + .4;
  const d = Math.hypot(cx - ox, cy - oy) || 1, vol = Math.max(.25, d / 13);
  TIRS.push({ x: ox, y: oy, z: oz, vx: (cx - ox) / vol, vy: (cy - oy) / vol, vz: (cz - oz) / vol + TIR_G * vol * .5, de: null, deg: .8, age: 0, c: [255, 70, 30], sortM: 'braise', feu: true, abime: true });
  SON.jouer('cracheFeu', {}, ox, oy, oz); burst(ox, oy, oz, 16, '#ff5a20');
  for (let k = 0; k < 10; k++) parts.push({ x: ox, y: oy, z: oz, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: Math.random() * 2, g: 1, life: .4, age: 0, col: Math.random() < .5 ? '#2a0c14' : '#ff4a20', tl: .07, luit: 1 });
  return true;
}
// La boule de l'Abîme éclate (sortTouche, index.html) : tout ce qui est à deux pas et demi prend le coup, et brûle.
function roiAbimeExplose(f, x, y, z) {
  if (f.eclate) return; f.eclate = true;
  const R = 2.6;
  for (const o of beasts) if (prenable(o) && Math.abs(o.z - z) < 3 && (o.x - x) ** 2 + (o.y - y) ** 2 < R * R) { toucherSort(o, 'braise', .45); o.brule = t + 3; }
  for (let k = 0; k < 3; k++) brasierSort(x + (Math.random() - .5) * 2, y + (Math.random() - .5) * 2);
  anneauSort(x, y, sol(x, y), [255, 80, 30], R, 22); SON.jouer('explosion', {}, x, y, z);
  if ((x - P.x) ** 2 + (y - P.y) ** 2 < 400) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .4); }
  for (let k = 0; k < 40; k++) { const a = Math.random() * 6.2832, v = 1.5 + Math.random() * 3;
    parts.push({ x, y, z: z + .2, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 1 + Math.random() * 3, g: 4, life: .7, age: 0, col: k % 3 ? '#ff5a20' : '#2a0c14', luit: k % 3 ? 1 : 0, tl: .09 }); }
}

// ============================================================
//  LES RELIQUAIRES : une salle de défi par cercle
//  Sur un socle, contre le mur du fond, un reliquaire scellé ; trois sceaux au sol. Qui entre, la porte se ferme
//  sur lui et trois vagues sortent des sceaux, plus fortes l'une que l'autre ; la dernière tombée, la porte se rouvre
//  et le reliquaire se descelle : l'objet unique du cercle, ou, si on l'a déjà, un trésor.
// ============================================================
const VAGUES = {
  1: [['diablotin', 'diablotin', 'larve_braise'], ['larve_braise', 'larve_braise', 'diablotin', 'diablotin'], ['diablotin', 'diablotin', 'diablotin', 'larve_braise', 'larve_braise']],
  2: [['chien_abime', 'chien_abime', 'chien_abime'], ['forgeron', 'forgeron', 'chien_abime', 'chien_abime'], ['forgeron', 'forgeron', 'chien_abime', 'chien_abime', 'chien_abime']],
  3: [['ame_peine', 'ame_peine', 'ame_peine'], ['gargouille', 'gargouille', 'ame_peine', 'ame_peine'], ['gargouille', 'gargouille', 'ame_peine', 'ame_peine', 'ame_peine']],
  4: [['sorciere', 'sorciere'], ['vive', 'vive', 'sorciere'], ['sorciere', 'sorciere', 'sorciere', 'vive', 'vive']],
};
function peuplerReliquaire(H, q, s) {
  const { Z0, deco, coffre, st } = H, x = q.cx, y = q.y + 2, or = [214, 170, 70], noir = [30, 24, 30];
  deco([x - .9, y, Z0 + .18], [x + .9, y, Z0 + .18], 1.3, .36, [70, 62, 64]); deco([x - .7, y, Z0 + .42], [x + .7, y, Z0 + .42], 1.1, .14, [86, 78, 80]);   // le socle, en deux marches
  deco([x - .72, y + .56, Z0 + .43], [x + .72, y + .56, Z0 + .43], .04, .04, or); deco([x - .72, y - .56, Z0 + .43], [x + .72, y - .56, Z0 + .43], .04, .04, or);
  for (const [dx, dy] of [[-1.3, .3], [1.3, .3], [-1.1, 1], [1.1, 1], [-.5, 1.2], [.5, 1.2]]) {               // des cierges noirs, leur flamme
    const h = .35 + Math.abs(dx) * .2; deco([x + dx, y + dy, Z0], [x + dx, y + dy, Z0 + h], .09, .09, noir); deco([x + dx, y + dy, Z0 + h], [x + dx, y + dy, Z0 + h + .1], .05, .05, [255, 190, 90], 1); }
  coffre(x, y, 'reliquaire', s); DJ.coffres[DJ.coffres.length - 1].z = Z0 + .5;
  const sig = [[q.x + 2.5, q.y + q.h - 2.5], [q.cx, q.cy + 1], [q.x + q.w - 2.5, q.y + q.h - 2.5]];
  ROI.reliques.push({ s, q, sig, etat: (st.defis || []).includes(DJ.e) ? 'fait' : 'attente', vague: 0, betes: [], t: 0, flash: -9 });
}
function lancerVague(R, n) {
  const L = VAGUES[DJ.e] && VAGUES[DJ.e][n - 1]; if (!L) return;
  R.vague = n; R.etat = 'vague'; R.flash = t; R.betes = [];
  L.forEach((id, k) => {
    const [sx, sy] = R.sig[k % R.sig.length], x = sx + (Math.random() - .5) * 1.4, y = sy + (Math.random() - .5) * 1.4;
    let b = null;
    if (id === 'vive') b = planteJardin(x, y, 'vive', R.s);
    else if (specById[id]) {
      b = naitre(specById[id], x, y); b.variante = null; b.z = DJ_Z0; b.pv = 1; b.age = 1e6; b.ech = 1; b.vie = Infinity; b.djSalle = R.s; b.home = [x, y];
      b.blinde = 1 + Math.max(0, profondeur() - 8) * .04 + (DJ.e - 1) * .15 + (n - 1) * .1; b.dir = b.dirT = Math.random() * 6.28; b.alerte = t + 30;
      if (id === 'larve_braise' || id === 'diablotin') { b.etat = 'surgir'; b.etT = t; b.vie = 90; jaillir(b, id === 'diablotin'); }
      else if (id === 'gargouille') { b.etat = 'figee'; b.eveil = true; }
      else if (id === 'chien_abime') b.etat = 'rode';
      beasts.push(b);
    }
    if (b) { R.betes.push(b); burst(x, y, DJ_Z0 + .3, 16, '#ff7a3a'); }
  });
  SON.jouer('rugDemon', { vol: .7 }, R.q.cx, R.q.cy, DJ_Z0 + 1);
  say('vague ' + n + ' sur 3', 2);
}
function majReliques(dt, J) {
  for (const R of ROI.reliques || []) {
    if (R.etat === 'fait') continue;
    const q = R.q;
    if (R.etat === 'attente') {
      if (J.some(Q => djDansSalle(q, Q.x, Q.y, .8))) { R.etat = 'eveil'; R.t = t; djPortes(q, true); SON.jouer('bourdon', {}, q.cx, q.cy, DJ_Z0 + 1); say('le reliquaire s\'éveille · la porte se ferme · trois vagues', 3.5); }
      continue;
    }
    if (R.etat === 'eveil') { if (t - R.t > 2) lancerVague(R, 1); continue; }
    if (R.etat === 'pause') { if (t - R.t > 2.6) lancerVague(R, R.vague + 1); continue; }
    if (R.betes.some(b => !b.dead && beasts.includes(b))) continue;
    if (R.vague < 3) { R.etat = 'pause'; R.t = t; say('la vague ' + R.vague + ' est tombée · tenez', 2); continue; }
    R.etat = 'fait'; djPortes(q, false); DJ.etat.defis = [...(DJ.etat.defis || []), DJ.e]; Sauve.sale = true;
    SON.jouer('niveau', {}, q.cx, q.cy, DJ_Z0); say('le reliquaire se descelle · la porte s\'ouvre', 3.5);
  }
}
const reliqueFaite = () => (ROI.reliques || []).some(R => R.etat === 'fait');
function ouvrirReliquaire(c) {
  c.ouvert = true; DJ.etat.ouverts.push(c.k); Sauve.sale = true;
  const id = ROI_UNIQUES[DJ.e], L = [], k = 1 + (DJ.e - 1) * .35;
  if (id && !P.objets[id]) { P.objets[id] = 1; if (typeof rangerRaccourci === 'function') rangerRaccourci(id); L.push('OBJET UNIQUE · ' + objet(id).n.toUpperCase()); SON.jouer('rare', {}, c.x, c.y, c.z + .5); }
  else { const e = Math.round((20 + Math.random() * 10) * k), o = Math.round((6 + Math.random() * 4) * k); P.sac.eclat += e; P.sac.os = (P.sac.os || 0) + o; L.push('+' + e + ' éclats', '+' + o + ' os');
    const s2 = ROI_INGR[DJ.e] ? roiDonnerIngr(ROI_INGR[DJ.e], 2) : ''; if (s2) L.push(s2); }
  SON.jouer('clank', {}, c.x, c.y, c.z); SON.jouer('ramasse', {});
  burst(c.x, c.y, c.z + .8, 30, '#ffe08a');
  say('le reliquaire · ' + L.join(' · ') + ' · à remonter pour le garder', 6); majSac();
}

// ============================================================
//  LE QUATRIÈME CERCLE : LES JARDINS DE SOUFRE
//  Un sol de soufre et d'ocre, des plaques de mousse rouge, des murs de cendre noire où grimpent des lianes à
//  épines. La flore vive du démon y pousse (flore.js, la même que sur l'île démoniaque) : fleurs à cueillir,
//  arbres géants, et des plantes qui mordent ou fouettent. Des LYS DE SOUFRE luisent dans leurs parterres, des
//  cristaux jaunes percent le sol, les fumerolles crachent une fumée jaune. Les POCHES DE SOUFRE empoisonnent qui
//  s'y attarde, et s'ENFLAMMENT au contact du feu (un cercle de sorcière, un geyser) : elles explosent, puis se
//  remplissent. Les GEYSERS DE FLAMMES grondent longtemps avant de cracher, haut. Les SORCIÈRES DE SOUFRE tiennent
//  leurs distances, posent des CERCLES DE FEU sous vos pieds (le cercle s'allume 1,3 s avant les flammes) et
//  disparaissent dans un nuage jaune si l'on s'approche.
//  LE JARDINIER : une gueule géante enracinée au milieu de sa salle, six lianes qui courent jusqu'aux murs. Il
//  mord qui s'approche (ses pétales s'ouvrent avant), FOUETTE d'une liane (elle se soulève en rougeoyant, puis
//  s'abat sur toute sa longueur : sortez de sa ligne), ÉTREINT le plus éloigné (un anneau de racines au sol, puis
//  une liane jaillit et vous tient), CRACHE des graines qui éclatent en poches de soufre. À mi-vie, il FLEURIT :
//  deux plantes vives sortent de terre, et le soufre de la salle s'enflamme.
// ============================================================
const JARDIN_BIO = { mur: 13, salle: 4, couloir: 10 };
const JA_C = { tige: [48, 40, 30], soufre: [236, 210, 70], soufreC: [255, 244, 160], ronce: [44, 26, 30], epine: [176, 50, 40], roc: [96, 84, 58], cendre: [56, 50, 50], liane: [58, 44, 34], liane2: [92, 40, 40] };
function genJardins() {
  const R = djAlea(djHash(SEED ^ Math.imul(DJ.e, 0x7f4a7c15) ^ 0x401d)), Z0 = DJ_Z0, HM = DJ_Z0 + DJ_MUR, BI = JARDIN_BIO;
  Hgt.fill(HM); Bio.fill(BI.mur); Eau.fill(0); PlT.fill(0); PlB.fill(0);
  ROI.ponts = []; ROI.coulees = []; ROI.pilons = []; ROI.chaines = []; ROI.pontDit = false;
  const salles = roiPlan(R, 19, 17, 'jardin', BI);
  const roles = ['serre', 'fumerolles', 'reliquaire', 'cercle', 'geysers', 'mare', 'ronces', 'serre', 'fumerolles', 'geysers'];
  let kr = R() * 5 | 0;
  for (const q of salles) if (!q.role) q.role = roles[kr++ % roles.length];
  if (!salles.some(q => q.role === 'reliquaire')) { const q = salles.find(o => o.role === 'ronces') || salles.find(o => o.role === 'serre'); if (q) q.role = 'reliquaire'; }
  const lave = (x, y) => { const i = y * WS + x; if (Hgt[i] === Z0) { Hgt[i] = Z0 - 1; Eau[i] = Z0; } };
  const tache = (cx, cy, r, bio) => { for (let y = cy - r | 0; y <= cy + r; y++) for (let x = cx - r | 0; x <= cx + r; x++) { const i = y * WS + x; if (Hgt[i] === Z0 && (x - cx) ** 2 + (y - cy) ** 2 < r * r) Bio[i] = bio; } };
  for (const q of salles) {
    for (let k = 0; k < 3 + (q.w * q.h / 45 | 0); k++) tache(q.x + R() * q.w, q.y + R() * q.h, 1.2 + R() * 2.2, R() < .82 ? 10 : 14);   // l'ocre, un peu de mousse rouge
    if (q.role === 'mare') { q.mares = [];
      for (let k = 0; k < 2 + (R() * 2 | 0); k++) { const x = q.cx + (R() - .5) * q.w * .35, y = q.cy + (R() - .5) * q.h * .35, r = 1.3 + R() * .9; q.mares.push([x, y, r]);
        for (let yy = y - r | 0; yy <= y + r; yy++) for (let xx = x - r | 0; xx <= x + r; xx++) if ((xx + .5 - x) ** 2 + (yy + .5 - y) ** 2 < r * r && djDansSalle(q, xx, yy, 1.5)) lave(xx, yy); } }
    else if (q.role === 'jardin') for (const [x, y] of [[q.x + 2, q.y + q.h - 4], [q.x + q.w - 4, q.y + q.h - 4]]) for (let yy = y; yy < y + 2; yy++) for (let xx = x; xx < x + 2; xx++) lave(xx, yy);
    else if (q.role === 'geysers') { q.geysers = [];                // les bouches de flammes, la terre brûlée autour
      for (let k = 0; k < 40 && q.geysers.length < 3 + (q.w * q.h > 120 ? 1 : 0); k++) { const x = (q.x + 2.2 + R() * (q.w - 4.4) | 0) + .5, y = (q.y + 2.2 + R() * (q.h - 4.4) | 0) + .5;
        if (q.geysers.some(g => Math.hypot(g[0] - x, g[1] - y) < 3)) continue; q.geysers.push([x, y]); tache(x, y, 1.6 + R() * .6, 14); } }
  }
  roiEscalier(salles[0], BI);
  DJ.salles = salles;
  calcOmbrage();
  return true;
}
// Une plante du démon (flore.js), d'un port donné : 'simple' (à cueillir), 'geante', 'vive' (elle mord ou fouette).
function planteJardin(x, y, port, s) {
  const i = (y | 0) * WS + (x | 0); if (Hgt[i] !== DJ_Z0 || Eau[i] > Hgt[i] || typeof FLORE_RARES === 'undefined') return null;
  const C = FLORE_RARES.filter(p => p.bio === 40 && p.port === port); if (!C.length) return null;
  const pl = C[Math.random() * C.length | 0], sp = specById[port === 'simple' ? 'plante_r' : port === 'geante' ? 'plante_l' : 'plante_e']; if (!sp) return null;
  const b = naitre(sp, x, y); b.variante = null; b.age = 1e6; b.ech = port === 'simple' ? 1.3 : 1; b.pv = 1; b.z = DJ_Z0; b.pl = pl;
  b.dir = b.dirT = Math.random() * 6.28; b.graine = Math.random(); b.etat = 'pousse'; b.djSalle = s; beasts.push(b); return b;
}
// Les côtés pleins d'une salle, mur par mur : cb(départ, arrivée, normale vers la salle)
function mursSalle(q, cb) {
  const Z0 = DJ_Z0, M = [
    { o: [q.x, q.y], T: [1, 0], N: [0, 1], L: q.w, mur: k => Hgt[(q.y - 1) * WS + q.x + k] > Z0 },
    { o: [q.x, q.y + q.h], T: [1, 0], N: [0, -1], L: q.w, mur: k => Hgt[(q.y + q.h) * WS + q.x + k] > Z0 },
    { o: [q.x, q.y], T: [0, 1], N: [1, 0], L: q.h, mur: k => Hgt[(q.y + k) * WS + q.x - 1] > Z0 },
    { o: [q.x + q.w, q.y], T: [0, 1], N: [-1, 0], L: q.h, mur: k => Hgt[(q.y + k) * WS + q.x + q.w] > Z0 }];
  for (const m of M) { let run = -1;
    for (let k = 0; k <= m.L; k++) { const plein = k < m.L && m.mur(k); if (plein && run < 0) run = k; if (plein || run < 0) continue;
      cb([m.o[0] + m.T[0] * (run + .1), m.o[1] + m.T[1] * (run + .1)], [m.o[0] + m.T[0] * (k - .1), m.o[1] + m.T[1] * (k - .1)], m.N); run = -1; } }
}
function peuplerJardins(H) {
  const { R, Z0, deco, sec, bete, coffre, dans } = H, C = JA_C;
  ROI.autel = null; ROI.salleGarde = 0; ROI.gaz = []; ROI.cercles = []; ROI.fumerolles = []; ROI.lianes = []; ROI.graines = []; ROI.chaudrons = []; ROI.tenu = null; ROI.etreinte = null;
  const lys = (x, y, h = .9 + R() * .6) => {                    // un lys de soufre : la tige qui ploie, une feuille, trois pétales, un cœur qui luit
    const a = R() * 6.28, bx = Math.cos(a) * .16, by = Math.sin(a) * .16, top = [x + bx, y + by, Z0 + h];
    deco([x, y, Z0], [x + bx * .3, y + by * .3, Z0 + h * .55], .055, .055, C.tige); deco([x + bx * .3, y + by * .3, Z0 + h * .55], top, .045, .045, C.tige);
    deco([x, y, Z0 + .1], [x + Math.cos(a + 2) * .32, y + Math.sin(a + 2) * .32, Z0 + .3], .13, .03, [72, 66, 30]);
    for (let k = 0; k < 3; k++) { const b2 = a + k * 2.094; deco(top, [top[0] + Math.cos(b2) * .15, top[1] + Math.sin(b2) * .15, top[2] + .13], .11, .04, k ? C.soufre : [214, 120, 50]); }
    deco([top[0], top[1], top[2] + .02], [top[0], top[1], top[2] + .1], .07, .07, C.soufreC, 1);
  };
  const cristaux = (x, y) => {                                   // des cristaux de soufre, en gerbe
    deco([x, y, Z0], [x, y, Z0 + .1], .55, .45, C.roc);
    for (let k = 0; k < 5; k++) { const a = R() * 6.28, l = .22 + R() * .45, r = R() * .16;
      deco([x + Math.cos(a) * r, y + Math.sin(a) * r, Z0 + .04], [x + Math.cos(a) * (r + l * .45), y + Math.sin(a) * (r + l * .45), Z0 + .04 + l], .09, .09, k & 1 ? C.soufre : C.soufreC, k < 2); }
  };
  const ronce = (x, y) => {                                      // une ronce noire, ses épines rouges
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + R() * .5, l = .5 + R() * .45, B = [x + Math.cos(a) * l * .7, y + Math.sin(a) * l * .7, Z0 + .3 + R() * .55];
      deco([x, y, Z0 + .04], B, .065, .065, C.ronce); deco(B, [B[0] + Math.cos(a) * .08, B[1] + Math.sin(a) * .08, B[2] + .06], .05, .025, C.epine); }
  };
  const fumerolle = (x, y) => {                                  // un petit cône de soufre, une bouche qui fume
    deco([x, y, Z0], [x, y, Z0 + .28], .7, .62, C.roc); deco([x, y, Z0 + .28], [x, y, Z0 + .42], .38, .34, [130, 112, 64]);
    deco([x, y, Z0 + .42], [x, y, Z0 + .44], .22, .2, C.soufre, 1); ROI.fumerolles.push({ x, y });
  };
  const os1 = (x, y) => { const a = R() * 6.28; deco([x - Math.cos(a) * .2, y - Math.sin(a) * .2, Z0 + .04], [x + Math.cos(a) * .2, y + Math.sin(a) * .2, Z0 + .04], .065, .065, [200, 190, 166]); };
  const parterre = (x, y, w, h) => {                             // un parterre bordé de pierres sèches, la terre noire, des lys
    deco([x - w / 2, y, Z0 + .05], [x + w / 2, y, Z0 + .05], h, .1, [44, 34, 30]);
    for (const s of [-1, 1]) { deco([x - w / 2, y + s * h / 2, Z0 + .1], [x + w / 2, y + s * h / 2, Z0 + .1], .14, .22, [104, 92, 76]); deco([x + s * w / 2, y - h / 2, Z0 + .1], [x + s * w / 2, y + h / 2, Z0 + .1], .14, .22, [104, 92, 76]); }
    for (let k = 0; k < Math.round(w * h * .9); k++) lys(x + (R() - .5) * (w - .4), y + (R() - .5) * (h - .4), .6 + R() * .7);
  };
  const chaudron = (x, y) => {                                   // le chaudron des sorcières : trois pieds, le ventre noir, la mixture qui luit, le feu dessous
    for (let k = 0; k < 3; k++) { const a = k * 2.094; deco([x + Math.cos(a) * .42, y + Math.sin(a) * .42, Z0], [x + Math.cos(a) * .3, y + Math.sin(a) * .3, Z0 + .45], .06, .06, [40, 36, 34]); }
    deco([x, y, Z0 + .35], [x, y, Z0 + .85], .82, .82, [30, 28, 30]); deco([x, y, Z0 + .85], [x, y, Z0 + .9], .94, .94, [46, 42, 44]);
    deco([x, y, Z0 + .9], [x, y, Z0 + .93], .7, .7, [196, 222, 64], 1);
    deco([x - .3, y, Z0 + .06], [x + .3, y, Z0 + .06], .4, .1, [70, 44, 30]); deco([x, y, Z0 + .1], [x, y, Z0 + .26], .32, .32, [255, 130, 40], 1);
    ROI.chaudrons.push({ x, y });
  };
  const cierges = (x, y, r, n) => { for (let k = 0; k < n; k++) { const a = k / n * 6.2832, cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r, h = .3 + (k % 3) * .12;
    deco([cx, cy, Z0], [cx, cy, Z0 + h], .1, .1, [26, 22, 26]); deco([cx, cy, Z0 + h], [cx, cy, Z0 + h + .09], .05, .05, [255, 200, 90], 1); } };
  const gaz = (x, y, r) => ROI.gaz.push({ x, y, r, etat: 'plein', t: -99 });
  const sorciere = (x, y, s) => bete('sorciere', x, y, s, b => { b.etat = 'flotter'; });
  const lianesMur = q => mursSalle(q, (A, B, N) => {            // les lianes à épines qui grimpent aux murs ; une fleur rouge de loin en loin
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(L / 1.2)), ph = R() * 6;
    let p = null;
    for (let k = 0; k <= n; k++) { const f = k / n, q2 = [A[0] + (B[0] - A[0]) * f + N[0] * .06, A[1] + (B[1] - A[1]) * f + N[1] * .06, Z0 + .9 + .55 * Math.sin(k * 1.3 + ph) + .3 * Math.sin(k * .5)];
      if (p) deco(p, q2, .09, .09, k & 1 ? C.liane : C.liane2); if (k % 4 === 2) deco(q2, [q2[0] + N[0] * .12, q2[1] + N[1] * .12, q2[2] + .04], .14, .14, [200, 40, 50]); p = q2; }
  });
  const bete2 = (id, q, s, m = 2) => { const [x, y] = dans(q, m); return bete(id, x, y, s); };
  DJ.salles.forEach((q, s) => {
    const cx = q.cx, cy = q.cy;
    lianesMur(q);
    for (let k = 0; k < 2; k++) { const [x, y] = dans(q, 1.2); if (sec(x, y)) os1(x, y); }
    if (q.role === 'arrivee') {
      DJ.monte.push({ x: q.x + 1.6, y: q.y + 1.6, z: Z0 });
      ROI.autel = { x: cx, y: cy };
      for (const [x, y] of [[q.x + q.w - 1.6, q.y + 1.6], [q.x + 1.6, q.y + q.h - 1.6]]) cristaux(x, y);
      for (let k = 0; k < 6; k++) { const [x, y] = dans(q, 1.3); if (sec(x, y) && Math.hypot(x - cx, y - cy) > 2) lys(x, y); }
    } else if (q.role === 'jardin') {
      ROI.salleGarde = s;
      coffre(q.x + q.w - 2.2, q.y + 2, 'garde', s);
      DJ.monte.push({ x: q.x + 1.6, y: q.y + 1.6, z: Z0 });
      ROI.sceau = { x: DJ.escalier.x, y: DJ.escalier.y - 1 };
      const J0 = bete('jardinier', cx, cy, s, b => { b.etat = 'repos'; b.dir = b.dirT = Math.PI / 2; });
      if (J0) ROI.jardinier = J0;
      for (let k = 0; k < 6; k++) {                             // les six lianes, du pied du Jardinier jusqu'aux murs
        const a = k / 6 * 6.2832 + .5236 + (R() - .5) * .3; let L = 2;
        while (L < 10 && djDansSalle(q, cx + Math.cos(a) * (L + .6), cy + Math.sin(a) * (L + .6), .6)) L += .5;
        ROI.lianes.push({ a, L, ph: R() * 6, etat: 'repos', t: -9 });
      }
      for (const [x, y] of [[q.x + 2, q.y + 2], [q.x + q.w - 2, q.y + q.h - 2], [q.x + 2, cy]]) if (sec(x, y)) cristaux(x, y);
      for (const [x, y] of [[cx - 5.5, cy + 3.5], [cx + 5.5, cy - 3.5], [cx + 5, cy + 4]]) if (sec(x, y)) gaz(x, y, 1.6);
      for (let k = 0; k < 8; k++) { const a = R() * 6.28, r = 3 + R() * 4; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (sec(x, y)) os1(x, y); }
    } else if (q.role === 'serre') {
      const hor = q.w >= q.h, n = q.w * q.h > 120 ? 3 : 2;
      for (let k = 0; k < n; k++) { const u = (k + 1) / (n + 1); parterre(hor ? q.x + q.w * u : cx, hor ? cy : q.y + q.h * u, hor ? 2.2 : 3, hor ? 3 : 2.2); }
      for (let k = 0; k < 3; k++) { const [x, y] = dans(q, 1.4); planteJardin(x, y, 'simple', s); }
      { const [x, y] = hor ? [cx, q.y + 1.6] : [q.x + 1.6, cy]; planteJardin(x, y, 'geante', s); }
      if (R() < .7) { const [x, y] = dans(q, 2); planteJardin(x, y, 'vive', s); }
      cristaux(q.x + 1.4, q.y + q.h - 1.4);
      if (R() < .5) sorciere(...dans(q, 2), s);
      if (R() < .6) { const [x, y] = dans(q, 1.6); if (sec(x, y)) coffre(x, y, 'petit', s); }
    } else if (q.role === 'fumerolles') {
      for (let k = 0; k < 3; k++) { const [x, y] = dans(q, 1.8); if (sec(x, y)) fumerolle(x, y); }
      for (let k = 0; k < 3; k++) { const [x, y] = dans(q, 2.2); if (sec(x, y) && !ROI.gaz.some(g => Math.hypot(g.x - x, g.y - y) < 3.5)) gaz(x, y, 1.5 + R() * .6); }
      for (let k = 0; k < 2; k++) { const [x, y] = dans(q, 1.3); if (sec(x, y)) cristaux(x, y); }
      sorciere(...dans(q, 2), s); if (q.w * q.h > 110) sorciere(...dans(q, 2), s);
      { const [x, y] = dans(q, 1.5); planteJardin(x, y, 'simple', s); }
    } else if (q.role === 'cercle') {                           // le cercle des sorcières : des cierges, le chaudron, des os
      chaudron(cx, cy); cierges(cx, cy, 2.6, 9);
      for (let k = 0; k < 3; k++) { const a = k * 2.094 + .5; sorciere(cx + Math.cos(a) * 3.6, cy + Math.sin(a) * 3.6, s); }
      for (let k = 0; k < 6; k++) { const [x, y] = dans(q, 1.2); if (sec(x, y) && Math.hypot(x - cx, y - cy) > 3) os1(x, y); }
      for (const [x, y] of [[q.x + 1.4, q.y + 1.4], [q.x + q.w - 1.4, q.y + 1.4]]) cristaux(x, y);
      { const [x, y] = [q.x + q.w - 1.6, q.y + q.h - 1.6]; if (sec(x, y)) coffre(x, y, 'petit', s); }
    } else if (q.role === 'geysers') {
      (q.geysers || []).forEach(([x, y], m) => { if (sec(x, y)) ROI.geysers.push({ x, y, ph: m * 1.3 + R(), grand: 1 }); });
      if (R() < .7) { const [x, y] = dans(q, 2); planteJardin(x, y, 'vive', s); }
      if (R() < .5) sorciere(...dans(q, 2), s);
      { const [x, y] = dans(q, 1.4); if (sec(x, y) && !ROI.geysers.some(g => Math.hypot(g.x - x, g.y - y) < 1.5)) coffre(x, y, 'petit', s); }
    } else if (q.role === 'mare') {
      for (const [x, y, r] of q.mares || []) for (let k = 0; k < 3; k++) { const a = R() * 6.28, X = x + Math.cos(a) * (r + .8), Y = y + Math.sin(a) * (r + .8); if (sec(X, Y)) cristaux(X, Y); }
      for (let k = 0; k < 2; k++) { const [x, y] = dans(q, 1.6); planteJardin(x, y, 'geante', s); }
      { const [x, y] = dans(q, 1.4); planteJardin(x, y, 'simple', s); }
    } else if (q.role === 'ronces') {
      for (let k = 0; k < 7; k++) { const [x, y] = dans(q, 1.2); if (sec(x, y)) ronce(x, y); }
      for (let k = 0; k < 2; k++) { const [x, y] = dans(q, 2); planteJardin(x, y, 'vive', s); }
      sorciere(...dans(q, 2), s);
      { const [x, y] = dans(q, 1.6); if (sec(x, y)) coffre(x, y, 'petit', s); }
    } else if (q.role === 'reliquaire') peuplerReliquaire(H, q, s);
  });
  // le coffre scellé : la clé d'os du Jardinier l'ouvre (près d'une mare, sinon ailleurs)
  const qs = DJ.salles.findIndex(q => q.role === 'mare') >= 0 ? DJ.salles.findIndex(q => q.role === 'mare') : DJ.salles.findIndex(q => q.role !== 'arrivee' && q.role !== 'jardin' && q.role !== 'reliquaire');
  if (qs >= 0) { const q = DJ.salles[qs]; coffre(q.x + 1.8, q.y + 1.8, 'scelle', qs); }
  // les couloirs : des lys, des cristaux, du soufre qui stagne, quelques fleurs du démon
  const couloir = [];
  for (let y = 3; y < WS - 3; y++) for (let x = 3; x < WS - 3; x++) if (Hgt[y * WS + x] === Z0 && !djSalleDe(x, y)) couloir.push([x + .5, y + .5]);
  const loin = (x, y) => !DJ.monte.some(m => Math.hypot(m.x - x, m.y - y) < 5);
  for (let k = 0; k < 14 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0]; lys(x + (R() - .5) * .6, y + (R() - .5) * .6, .5 + R() * .5); }
  for (let k = 0; k < 6 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0]; cristaux(x, y); }
  for (let k = 0, n = 0; k < 200 && n < 4 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0]; if (!loin(x, y) || ROI.gaz.some(g => Math.hypot(g.x - x, g.y - y) < 9)) continue; gaz(x, y, 1.4); n++; }
  for (let k = 0; k < 4 && couloir.length; k++) { const [x, y] = couloir[R() * couloir.length | 0]; planteJardin(x, y, 'simple', -1); }
}

// À chaque image : les poches de soufre, les cercles de feu, les graines, les fumerolles, l'étreinte, l'air
function majJardins(dt, J) {
  const Z0 = DJ_Z0, pres = (x, y, r = 24) => (x - P.x) ** 2 + (y - P.y) ** 2 < r * r;
  for (let k = ROI.gaz.length - 1; k >= 0; k--) {
    const g = ROI.gaz[k];
    if (g.fin && t > g.fin) { ROI.gaz.splice(k, 1); continue; }
    if (g.etat === 'vide') { if (!g.fin && t - g.t > 14) g.etat = 'plein'; continue; }
    if (pres(g.x, g.y) && Math.random() < dt * g.r * 11) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * g.r;
      parts.push({ x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r, z: Z0 + .1 + Math.random() * .7, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, vz: .08, g: 0, life: 2.6, age: 0, col: Math.random() < .5 ? '#d4d86a' : '#b0bc50', tl: .18 }); }
    if (Math.hypot(P.x - g.x, P.y - g.y) < g.r && P.z < Z0 + 1.5 && P.pv > 0) {   // dedans : le soufre prend à la gorge
      P.poison = Math.max(P.poison || 0, t + 2.5); P.pv = Math.max(0, P.pv - degSubi(.03) * dt); P.dernierCoup = t;
      if (t - (ROI.gazDit || -99) > 12) { ROI.gazDit = t; say('le soufre vous prend à la gorge', 1.8); SON.jouer('respiration', { vol: .6 }, P.x, P.y, P.z + 1); }
      if (P.pv <= 0) terrasse();
    }
    const feu = ROI.cercles.some(c => c.etat === 'feu' && Math.hypot(c.x - g.x, c.y - g.y) < g.r + c.r)
      || ROI.geysers.some(c => c.st === 'feu' && Math.hypot(c.x - g.x, c.y - g.y) < g.r + (c.grand ? 1.4 : .8));
    if (feu) exploserGaz(g, J);
  }
  for (let k = ROI.cercles.length - 1; k >= 0; k--) {           // les cercles de feu : 1,3 s d'alerte, 3 s de flammes
    const c = ROI.cercles[k], u = t - c.t0;
    if (c.etat === 'alerte' && u > 1.3) { c.etat = 'feu'; c.t0 = t; SON.jouer('cracheFeu', { vol: .7 }, c.x, c.y, Z0); }
    else if (c.etat === 'feu' && u > 3) { ROI.cercles.splice(k, 1); continue; }
    if (c.etat === 'feu') {
      if (pres(c.x, c.y) && Math.random() < dt * 40) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * c.r;
        parts.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, z: Z0 + .1, vx: 0, vy: 0, vz: 1.5 + Math.random() * 2, g: -.4, life: .5, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .09 }); }
      for (const Q of J) if (Math.hypot(Q.x - c.x, Q.y - c.y) < c.r && Q.z < Z0 + 1.2 && t > (Q === P ? (ROI.cercleT || 0) : 0)) {
        if (Q === P) ROI.cercleT = t + .6;
        if (coupBrume({ x: c.x, y: c.y, z: Z0, sp: {} }, Q, .08 * (pacte('braise') ? 2 : 1)) && Q === P) { P.brulure = Math.max(P.brulure || 0, t + 1.5); if (t - (ROI.cercleDit || -99) > 15) { ROI.cercleDit = t; say('le cercle de feu vous brûle', 1.4); } }
      }
    } else if (pres(c.x, c.y) && Math.random() < dt * 14) { const a = Math.random() * 6.28;
      parts.push({ x: c.x + Math.cos(a) * c.r, y: c.y + Math.sin(a) * c.r, z: Z0 + .06, vx: 0, vy: 0, vz: .3, g: 0, life: .35, age: 0, col: '#ff6a20', luit: 1, tl: .07 }); }
  }
  for (let k = ROI.graines.length - 1; k >= 0; k--) {          // les graines du Jardinier : en cloche, elles éclatent en soufre
    const g = ROI.graines[k]; g.vz -= 12 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt;
    if (Math.random() < dt * 30) parts.push({ x: g.x, y: g.y, z: g.z, vx: 0, vy: 0, vz: 0, g: 0, life: .3, age: 0, col: '#d8d060', luit: 1, tl: .05 });
    if (g.z <= sol(g.x, g.y) + .05) { ROI.graines.splice(k, 1); burst(g.x, g.y, Z0 + .2, 12, '#c8cc5a'); SON.jouer('plop', {}, g.x, g.y, Z0);
      if (Hgt[(g.y | 0) * WS + (g.x | 0)] === Z0) ROI.gaz.push({ x: g.x, y: g.y, r: 1.3, etat: 'plein', t: -99, fin: t + 9 }); }
  }
  for (const f of ROI.fumerolles) if (pres(f.x, f.y, 20) && Math.random() < dt * 5)
    parts.push({ x: f.x + (Math.random() - .5) * .2, y: f.y + (Math.random() - .5) * .2, z: Z0 + .45, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, vz: .6 + Math.random() * .4, g: -.05, life: 2.8, age: 0, col: Math.random() < .5 ? '#d8d090' : '#a8a088', tl: .13 });
  for (const c of ROI.chaudrons) if (pres(c.x, c.y, 20) && Math.random() < dt * 6)
    parts.push({ x: c.x + (Math.random() - .5) * .5, y: c.y + (Math.random() - .5) * .5, z: Z0 + .95, vx: 0, vy: 0, vz: .5, g: -.05, life: 1.6, age: 0, col: Math.random() < .5 ? '#c8e060' : '#e8f0a0', luit: 1, tl: .06 });
  if (ROI.tenu && t > ROI.tenu.fin) ROI.tenu = null;
  // l'air : du pollen de soufre qui luit, de la cendre qui tombe
  if (Math.random() < dt * 6) { const a = Math.random() * 6.28, r = Math.random() * 9;
    parts.push({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, z: Z0 + .4 + Math.random() * 2.2, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .05, g: 0, life: 3, age: 0, col: '#ffe680', luit: 1, tl: .03 }); }
  if (Math.random() < dt * 4) { const a = Math.random() * 6.28, r = Math.random() * 9;
    parts.push({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, z: Z0 + DJ_MUR - .2, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, vz: -.35, g: 0, life: 6, age: 0, col: '#4a4444', tl: .035 }); }
}
function exploserGaz(g, J) {
  const Z0 = DJ_Z0, R = g.r + 1.2;
  g.etat = 'vide'; g.t = t; if (g.fin) g.fin = t + .01;
  SON.jouer('explosion', {}, g.x, g.y, Z0); if ((g.x - P.x) ** 2 + (g.y - P.y) ** 2 < 100) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .5); }
  for (const Q of J) { const dx = Q.x - g.x, dy = Q.y - g.y, d = Math.hypot(dx, dy) || 1;
    if (d < R && Q.z < Z0 + 2) { coupBrume({ x: g.x, y: g.y, z: Z0, sp: {} }, Q, .2 * (pacte('braise') ? 2 : 1), [dx / d * 6, dy / d * 6, 3]); if (Q === P) { P.brulure = Math.max(P.brulure || 0, t + 2); say('le soufre s\'enflamme', 1.4); } } }
  for (const b of beasts) if (!b.dead && b.pv > 0 && !b.sp.gardeSalle && !b.sp.plante && Math.hypot(b.x - g.x, b.y - g.y) < R) { b.pv -= .35 / robuste(b); b.hit = .25; b.brule = t + 2; if (b.pv <= 0) mourirBete(b, 'feu'); }
  for (let k = 0; k < 46; k++) { const a = Math.random() * 6.2832, v = 1 + Math.random() * 4;
    parts.push({ x: g.x, y: g.y, z: Z0 + .3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 1 + Math.random() * 3.5, g: 3, life: .8, age: 0, col: k % 3 === 0 ? '#fff0a0' : k % 3 === 1 ? '#ffb030' : '#ff5a18', luit: 1, tl: .1 }); }
}
function cercleFeu(x, y, de) { if (Hgt[(y | 0) * WS + (x | 0)] < DJ_Z0 - .5) return; ROI.cercles.push({ x, y, r: 1.8, t0: t, etat: 'alerte', de }); }

// LA SORCIÈRE DE SOUFRE : elle se tient à six ou neuf pas, tourne autour de vous, et toutes les quatre secondes
// environ incante (une seconde, le bâton levé) un cercle de feu là où vous allez ; trop près, elle disparaît dans
// un nuage de soufre et reparaît plus loin.
function majSorciere(b, dt) {
  if (b.act === 'incanter') {
    const u = t - b.actT, c = b.actC; b.vit = 0; b.etat = 'incanter';
    if (c) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 6); }
    if (Math.random() < dt * 30) { const a = Math.random() * 6.28, sz = b.sp.sz || 1;
      parts.push({ x: b.x + Math.cos(b.dir) * .35 * sz + Math.cos(a) * .3, y: b.y + Math.sin(b.dir) * .35 * sz + Math.sin(a) * .3, z: b.z + 1.6 * sz, vx: -Math.cos(a) * .6, vy: -Math.sin(a) * .6, vz: .2, g: 0, life: .4, age: 0, col: '#ffe060', luit: 1, tl: .05 }); }
    if (u > 1 && !b.fait) { b.fait = true; SON.jouer('sort', {}, b.x, b.y, b.z + 1);
      if (c && (estJoueur(c) ? c.pv > 0 : !c.dead)) cercleFeu(c.x + (c.vx || 0) * .5, c.y + (c.vy || 0) * .5, b); }
    if (u > 1.4) { b.act = null; b.sortT = t + 3 + Math.random() * 2; }
    return;
  }
  if (b.etat === 'clignoter') { b.vit = 0; if (t - b.etT < .45) return; b.etat = 'flotter'; }
  const c = cibleEnfer(b, 16);
  if (!c) { b.vit = 0; b.etat = 'flotter'; return; }
  const d = Math.hypot(c.x - b.x, c.y - b.y);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 4);
  if (d < 2.6 && t > (b.blinkT || 0)) { clignoter(b, c); return; }
  if (d < 13 && t > (b.sortT || (b.sortT = t + 1 + Math.random() * 2))) { agirBrume(b, 'incanter', c); return; }
  b.etat = 'flotter';
  const a = Math.atan2(c.y - b.y, c.x - b.x), loin = d < 6 ? -1 : d > 9 ? 1 : 0, as = a + (loin ? 0 : (b.cote || 1) * 1.57);
  const s = loin < 0 ? -3 : 3;
  pasBrume(b, b.x + Math.cos(as) * s, b.y + Math.sin(as) * s, b.sp.spd * (loin ? 1 : .6), dt, 1.2);
  if (!loin && Math.random() < dt * .3) b.cote = -(b.cote || 1);
}
function clignoter(b, c) {
  const nuage = (x, y) => { for (let k = 0; k < 26; k++) { const a = Math.random() * 6.28, v = Math.random() * 1.6;
    parts.push({ x, y, z: b.z + .2 + Math.random() * 1.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: .3 + Math.random() * .5, g: -.1, life: 1.2, age: 0, col: Math.random() < .5 ? '#d8d060' : '#a8a050', tl: .14 }); } };
  for (let k = 0; k < 16; k++) {
    const a = Math.random() * 6.28, r = 5 + Math.random() * 3, x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r, i = (y | 0) * WS + (x | 0);
    if (Hgt[i] !== DJ_Z0 || Eau[i] > Hgt[i] || (b.djSalle >= 0 && DJ.salles[b.djSalle] && !djDansSalle(DJ.salles[b.djSalle], x, y, .8))) continue;
    nuage(b.x, b.y); b.x = x; b.y = y; b.z = sol(x, y); nuage(x, y);
    SON.jouer('pouf', {}, x, y, b.z + 1); b.etat = 'clignoter'; b.etT = t; b.blinkT = t + 6; b.sortT = Math.min(b.sortT || 0, t + 1); return;
  }
  b.blinkT = t + 2;
}
// LE JARDINIER
function majJardinier(b, dt) {
  const q = DJ.salles[b.djSalle], Z0 = DJ_Z0;
  b.vit = 0; if (b.home) { b.x = b.home[0]; b.y = b.home[1]; } b.z = Z0;
  const J = joueursDans().filter(Q => !q || djDansSalle(q, Q.x, Q.y, .3));
  if (b.act) return actionJardinier(b, dt, J);
  if (!J.length) { b.etat = 'repos'; return; }
  if (!b.eveil) { b.eveil = true; b.fouetT = t + 2; b.etreinteT = t + 7; b.crachatT = t + 4.5; SON.jouer('rugDemon', {}, b.x, b.y, Z0 + 2); say('Le Jardinier ouvre sa gueule', 3); }
  let c = J[0], dc = 1e9; for (const Q of J) { const d = Math.hypot(Q.x - b.x, Q.y - b.y); if (d < dc) { dc = d; c = Q; } }
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 1.4);
  if (b.pv < .5 && !b.fleuri) { b.fleuri = true; return agirBrume(b, 'fleurir', c); }
  if (dc < 3.8 && t > (b.mordT || 0)) return agirBrume(b, 'mordre', c);
  if (t > b.fouetT && ROI.lianes.length) {                    // la liane la plus proche de sa ligne
    let best = 0, bd = 9; ROI.lianes.forEach((L, k) => { let da = Math.atan2(c.y - b.y, c.x - b.x) - L.a; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832; if (Math.abs(da) < bd) { bd = Math.abs(da); best = k; } });
    b.liane = best; ROI.lianes[best].etat = 'leve'; ROI.lianes[best].t = t; return agirBrume(b, 'fouet', c);
  }
  if (t > b.etreinteT) { let f = c, df = -1; for (const Q of J) { const d = Math.hypot(Q.x - b.x, Q.y - b.y); if (d > df) { df = d; f = Q; } }
    ROI.etreinte = { x: f.x, y: f.y, t0: t, prise: false }; return agirBrume(b, 'etreinte', f); }
  if (t > b.crachatT) return agirBrume(b, 'cracher', c);
  b.etat = 'repos';
}
function actionJardinier(b, dt, J) {
  const u = t - b.actT, c = b.actC, Z0 = DJ_Z0, sz = b.sp.sz || 1;
  if (b.act === 'mordre') {
    if (u < .7) { b.etat = 'gueule'; if (c) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 3); } return; }
    b.etat = 'mordre';
    if (!b.fait) { b.fait = true; SON.jouer('lacere', {}, b.x, b.y, Z0 + 2); SON.jouer('rugDemon', { vol: .5 }, b.x, b.y, Z0 + 2);
      for (const Q of J) { const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1;
        if (d < 4.2 && (dx * Math.cos(b.dir) + dy * Math.sin(b.dir)) / d > .3) { coupBrume(b, Q, .22, [dx / d * 7, dy / d * 7, 3]); if (Q === P) P.poison = Math.max(P.poison || 0, t + 4); } } }
    if (u > 1.4) { b.act = null; b.mordT = t + 2.6; }
    return;
  }
  if (b.act === 'fouet') {
    const L = ROI.lianes[b.liane]; b.etat = 'commander';
    if (L && u > .9 && !b.fait) { b.fait = true; L.etat = 'frappe'; L.t = t;
      const ca = Math.cos(L.a), sa = Math.sin(L.a);
      SON.jouer('fouet', {}, b.x + ca * L.L / 2, b.y + sa * L.L / 2, Z0); SON.jouer('impact', {}, b.x + ca * L.L / 2, b.y + sa * L.L / 2, Z0);
      for (const Q of J) { const rx = Q.x - b.x, ry = Q.y - b.y, s = rx * ca + ry * sa, p = -rx * sa + ry * ca;
        if (s > 1.2 && s < L.L + .5 && Math.abs(p) < 1 && Q.z < Z0 + 1.4) { const k = p >= 0 ? 1 : -1; coupBrume(b, Q, .16, [-sa * 6 * k, ca * 6 * k, 2.5]); } }
      for (let s = 1.5; s < L.L; s += .5) for (let j = 0; j < 2; j++) parts.push({ x: b.x + ca * s + (Math.random() - .5) * .6, y: b.y + sa * s + (Math.random() - .5) * .6, z: Z0 + .1, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: 1 + Math.random() * 2, g: 6, life: .6, age: 0, col: j ? '#8a7a58' : '#d8c860', tl: .08 });
      if ((b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 300) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .3); } }
    if (u > 1.5) { b.act = null; if (L) L.etat = 'repos'; b.fouetT = t + (b.fleuri ? 2.4 : 3.4) + Math.random(); }
    return;
  }
  if (b.act === 'etreinte') {
    const E = ROI.etreinte; b.etat = 'etreinte';
    if (E && u > .9 && !b.fait) { b.fait = true; E.prise = true; E.t1 = t; SON.jouer('terre', {}, E.x, E.y, Z0); burst(E.x, E.y, Z0 + .2, 16, '#6a5a3c');
      for (const Q of J) if (Math.hypot(Q.x - E.x, Q.y - E.y) < 1.3 && Q.z < Z0 + 1) { coupBrume(b, Q, .05); if (Q === P) { ROI.tenu = { fin: t + 1.8, x: E.x, y: E.y }; say('une liane vous tient', 1.6); } } }
    if (u > 2.8) { b.act = null; ROI.etreinte = null; b.etreinteT = t + 8 + Math.random() * 2; }
    return;
  }
  if (b.act === 'cracher') {
    b.etat = u < .55 ? 'gueule' : 'cracher';
    if (u > .55 && !b.fait) { b.fait = true; SON.jouer('crachat', {}, b.x, b.y, Z0 + 2.2);
      const L = J.length ? J : [P], n = b.fleuri ? 3 : 1;
      for (let k = 0; k < n; k++) { const Q = L[k % L.length], tx = Q.x + (k ? (Math.random() - .5) * 5 : 0), ty = Q.y + (k ? (Math.random() - .5) * 5 : 0);
        const oz = Z0 + 2.4 * sz / 2.4 * 1.2, vol = .9 + Math.hypot(tx - b.x, ty - b.y) * .04;
        ROI.graines.push({ x: b.x + Math.cos(b.dir) * 1.2, y: b.y + Math.sin(b.dir) * 1.2, z: oz, vx: (tx - b.x) / vol, vy: (ty - b.y) / vol, vz: (Z0 - oz) / vol + 6 * vol }); } }
    if (u > 1.1) { b.act = null; b.crachatT = t + 5 + Math.random() * 2; }
    return;
  }
  if (b.act === 'fleurir') {
    b.etat = 'fleurir';
    if (u > .4 && !b.fait) { b.fait = true; say('Le Jardinier fleurit · le soufre s\'embrase', 3); SON.jouer('rugDemon', {}, b.x, b.y, Z0 + 2);
      const q = DJ.salles[b.djSalle], n = beasts.filter(o => o.sp.plante && o.pl && o.pl.port === 'vive' && !o.dead && o.djSalle === b.djSalle).length;
      for (let k = 0; k < Math.min(2, 4 - n); k++) for (let e = 0; e < 12; e++) { const a = Math.random() * 6.28, r = 3.5 + Math.random() * 3.5, x = b.x + Math.cos(a) * r, y = b.y + Math.sin(a) * r;
        if (q && !djDansSalle(q, x, y, 1.2)) continue; const p = planteJardin(x, y, 'vive', b.djSalle); if (p) { burst(x, y, Z0 + .3, 20, '#a8c040'); break; } }
      for (const g of ROI.gaz) if (q && djDansSalle(q, g.x, g.y) && g.etat === 'plein') exploserGaz(g, J); }
    if (u > 1.6) { b.act = null; b.fouetT = t + 1.5; }
    return;
  }
  b.act = null;
}
// Ce que le Jardinier tient : on ne bouge plus (pacteVitesse, roi.js)
const roiEntrave = () => ROI.tenu && t < ROI.tenu.fin ? .04 : 1;

// ---------- leurs volumes ----------
// La sorcière de soufre : bossue, une robe en cloche dont l'ourlet brodé de soufre s'effiloche en lambeaux, une
// ceinture de fioles, le visage verdâtre au nez crochu, des yeux de soufre, des cheveux blancs ; un chapeau pointu
// au ruban jaune, dont la pointe retombe ; un bâton tordu coiffé d'une pierre de soufre, qui luit quand elle incante.
function osSorciere(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  const robe = [48, 34, 42], robe2 = [32, 22, 30], soufre = [226, 196, 64], peau = [122, 134, 96], noir = [18, 14, 18];
  const inc = E === 'incanter' ? Math.min(1, u / .3) : 0, cl = E === 'clignoter' ? Math.min(1, u / .45) : 1;
  const k = cl * (1 - mort * .5), h0 = .14 + .05 * Math.sin(t * 2.3 + (f.num || 0)) - mort * .3, ph = t * 2;
  add([0, 0, h0], [0, 0, h0 + .36], .5 * k, .44 * k, robe);
  add([.02, 0, h0 + .34], [.04, 0, h0 + .62], .38 * k, .32 * k, robe2);
  add([0, 0, h0 + .02], [0, 0, h0 + .07], .54 * k, .48 * k, soufre);
  for (let j = 0; j < 6; j++) { const a = j / 6 * 6.28 + .3, r = .22 * k; os2([Math.cos(a) * r, Math.sin(a) * r * .9, h0 + .05], [Math.cos(a) * r * 1.12, Math.sin(a) * r, h0 - .13 - .05 * Math.sin(ph + j)], .07 * k, robe2); }
  const T0 = [.04, 0, h0 + .6], T1 = [.17, 0, h0 + .92];
  add(T0, T1, .34 * k, .28 * k, robe);
  add([.02, 0, h0 + .57], [.02, 0, h0 + .64], .4 * k, .34 * k, [72, 50, 34]);
  for (const [y, c, l] of [[-.12, [90, 200, 90], false], [.02, [200, 60, 50], false], [.14, soufre, true]]) add([.17, y, h0 + .5], [.17, y, h0 + .6], .055, .055, c, l);
  const H = [T1[0] + .06, 0, T1[2] + .12];
  add([H[0] - .06, 0, H[2] - .04], [H[0] + .07, 0, H[2] + .06], .2 * k, .2 * k, peau);
  add([H[0] + .07, 0, H[2]], [H[0] + .16, 0, H[2] - .06], .05, .05, peau);
  add([H[0] + .05, 0, H[2] - .07], [H[0] + .09, 0, H[2] - .09], .08, .03, [96, 106, 74]);
  for (const s of [-1, 1]) add([H[0] + .07, s * .045, H[2] + .03], [H[0] + .08, s * .045, H[2] + .03], .035, .03, [255, 226, 80], true);
  for (const s of [-1, 0, 1]) os2([H[0] - .05, s * .08, H[2] + .03], [H[0] - .15, s * .11, H[2] - .32], .045, [208, 202, 188]);
  add([H[0] - .02, 0, H[2] + .09], [H[0] - .02, 0, H[2] + .11], .52 * k, .5 * k, noir);
  add([H[0] - .02, 0, H[2] + .11], [H[0] - .03, 0, H[2] + .16], .27 * k, .27 * k, soufre);
  let hp = [H[0] - .03, 0, H[2] + .16];
  for (let j = 1; j <= 3; j++) { const n = [hp[0] - .045 * j, Math.sin(ph * .7) * .02 * j, hp[2] + .14 - .025 * j]; os2(hp, n, (.24 - j * .06) * k, noir); hp = n; }
  const Mb = inc ? [.36, -.2, h0 + 1.05] : [.26, -.24, h0 + .7];
  os2([.1, -.18, h0 + .86], Mb, .07, robe2);
  const pied = inc ? [.5, -.22, h0 + .5] : [.3, -.26, h0 - .1], tete = inc ? [.42, -.18, h0 + 1.62] : [.24, -.24, h0 + 1.3];
  os2(pied, tete, .05, [76, 54, 36]);
  for (const s of [-1, 1]) os2(tete, [tete[0] + .04, tete[1] + s * .06, tete[2] + .12], .03, [76, 54, 36]);
  add([tete[0], tete[1], tete[2] + .07], [tete[0], tete[1], tete[2] + .2], .1 + inc * .05, .1 + inc * .05, inc ? [255, 250, 180] : soufre, true);
  const Mg = inc ? [.32, .22, h0 + 1.22] : [.18, .24, h0 + .62];
  os2([.1, .18, h0 + .86], Mg, .06, robe2);
  for (const d of [-1, 0, 1]) os2(Mg, [Mg[0] + .08, Mg[1] + d * .03, Mg[2] + (inc ? .09 : -.06)], .018, peau);
}
// Le Jardinier : une couronne de racines, une tige épaisse veinée de rouge, un bulbe pourpre taché de soufre ; la
// gueule ronde entre six pétales (rouges au cœur, jaunes à la pointe) qui s'ouvrent avant la morsure ; des dents
// tout autour ; la gorge qui luit ; la langue quand il mord.
function osJardinier(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0, ph = t * 1.3;
  const racine = [56, 44, 34], tige = [62, 56, 36], tete = [116, 32, 48], tete2 = [84, 22, 36], petale = [196, 44, 40], petale2 = [240, 196, 60], dent = [236, 228, 206];
  const ouv = mort ? .1 : E === 'gueule' ? Math.min(1, u / .5) : E === 'mordre' ? Math.max(.3, 1 - u / .6) : E === 'cracher' ? (u < .2 ? 1 : .45) : E === 'fleurir' ? 1 : E === 'etreinte' ? .15 : .22 + .1 * Math.sin(ph * 2);
  const el = E === 'mordre' ? Math.max(0, 1 - Math.abs(u - .12) / .3) * .55 : E === 'gueule' ? -.2 * Math.min(1, u / .5) : E === 'cracher' ? (u < .2 ? .25 : 0) : 0;
  const tr = E === 'fleurir' ? Math.sin(t * 30) * .03 : E === 'etreinte' || E === 'commander' ? Math.sin(t * 24) * .015 : 0;
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28 + .2, r = .95 + (k & 1) * .2, M = [Math.cos(a) * .42, Math.sin(a) * .42, .16];
    os2([0, 0, .22], M, .21, racine); os2(M, [Math.cos(a) * r, Math.sin(a) * r, -.04], .13, racine); os2([Math.cos(a) * r, Math.sin(a) * r, -.04], [Math.cos(a + .2) * (r + .25), Math.sin(a + .2) * (r + .25), -.06], .07, racine); }
  const S0 = [0, 0, .1], S1 = [.03 + tr, .02 * Math.sin(ph), .48 - mort * .1], S2 = [.08 + el * .3 + tr, .04 * Math.sin(ph + 1), .82 - mort * .35], S3 = [.16 + el * .8, .03 * Math.sin(ph + 2), 1.04 - mort * .7 - (E === 'gueule' ? .04 : 0)];
  os2(S0, S1, .37, tige); os2(S1, S2, .32, tige); os2(S2, S3, .27, [72, 60, 38]);
  for (const [A, B] of [[S0, S1], [S1, S2], [S2, S3]]) os2([A[0] + .15, A[1], A[2] + .05], [B[0] + .11, B[1], B[2] - .05], .05, [150, 40, 40]);
  for (const s of [-1, 1]) { const F0 = [S1[0], S1[1] + s * .12, S1[2] + .05]; add(F0, [F0[0] + .1, F0[1] + s * .5, F0[2] + .18 + .04 * Math.sin(ph + s)], .3, .04, [60, 70, 34]); }   // deux grandes feuilles
  const H = [S3[0] + .12, S3[1], S3[2] + .06];
  add([H[0] - .26, H[1], H[2]], [H[0] + .1, H[1], H[2]], .68, .62, tete);
  add([H[0] - .24, H[1], H[2] + .19], [H[0] + .02, H[1], H[2] + .21], .44, .2, tete2);
  for (const [dx, dy, dz] of [[-.16, .25, .1], [-.05, -.27, .14], [-.2, -.1, .3], [-.1, .21, -.18], [-.22, -.2, -.1]]) add([H[0] + dx, H[1] + dy, H[2] + dz], [H[0] + dx + .04, H[1] + dy, H[2] + dz], .08, .07, [255, 220, 90], true);
  const Bc = [H[0] + .12, H[1], H[2]];
  add(Bc, [Bc[0] + .02, Bc[1], Bc[2]], .44, .44, [40, 10, 18]);
  add([Bc[0] - .05, Bc[1], Bc[2]], [Bc[0] + .01, Bc[1], Bc[2]], .2 + ouv * .06, .2 + ouv * .06, [255, 226, 90], true);
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + .26, cy = Math.cos(a), cz = Math.sin(a);
    const base = [Bc[0], Bc[1] + cy * .22, Bc[2] + cz * .22], mid = [base[0] + .22 * (1 - ouv) + .06, base[1] + cy * (.12 + .32 * ouv), base[2] + cz * (.12 + .32 * ouv) - mort * .2];
    const tip = [mid[0] + .2 * (1 - ouv) + .04, mid[1] + cy * (.1 + .3 * ouv), mid[2] + cz * (.1 + .3 * ouv) - mort * .3];
    os2(base, mid, .18, petale); os2(mid, tip, .14, petale2);
    for (const d of [.05, .12]) add([base[0] + .02, base[1] - cy * d * .5, base[2] - cz * d * .5], [base[0] + .1, base[1] - cy * d, base[2] - cz * d], .035, .035, dent);
  }
  if (E === 'mordre' || E === 'gueule' || E === 'fleurir') add([Bc[0] - .02, Bc[1], Bc[2] - .12], [Bc[0] + .32 + el * .3, Bc[1], Bc[2] - .2], .12, .05, [200, 60, 80]);
}
// Ce qui bouge dans les Jardins, ajouté à roiDecor : les poches de soufre, les cercles de feu, les lianes du
// Jardinier, l'étreinte, les graines en vol.
function decorJardins(os, pres) {
  const Z0 = DJ_Z0;
  for (const g of ROI.gaz) if (pres(g.x, g.y)) {
    const plein = g.etat === 'plein', c = plein ? [118, 122, 58] : [50, 42, 38], r = g.r;
    os([g.x - r, g.y, Z0 + .012], [g.x + r, g.y, Z0 + .012], r * 1.1, .012, c);
    os([g.x, g.y - r, Z0 + .013], [g.x, g.y + r, Z0 + .013], r * 1.1, .012, c);
    for (const s of [-1, 1]) os([g.x - r * .7, g.y - s * r * .7, Z0 + .014], [g.x + r * .7, g.y + s * r * .7, Z0 + .014], r, .012, c);
    if (plein) for (let j = 0; j < 4; j++) { const a = j * 1.57 + t * .3 + g.x, rr = r * .5, z = Z0 + .03 + .04 * Math.abs(Math.sin(t * 2 + j));
      os([g.x + Math.cos(a) * rr, g.y + Math.sin(a) * rr, Z0 + .015], [g.x + Math.cos(a) * rr, g.y + Math.sin(a) * rr, z], .15, .15, [214, 222, 96], 1); }
  }
  for (const c of ROI.cercles) if (pres(c.x, c.y)) {
    const u = t - c.t0, n = 24;
    if (c.etat === 'alerte') {
      const f = .5 + .5 * Math.sin(t * (10 + u * 18)), col = [255, 70 + 90 * f | 0, 30], k = Math.min(1, u / 1.3);
      for (let j = 0; j < n; j++) { const a0 = j / n * 6.2832, a1 = (j + .7) / n * 6.2832; os([c.x + Math.cos(a0) * c.r, c.y + Math.sin(a0) * c.r, Z0 + .03], [c.x + Math.cos(a1) * c.r, c.y + Math.sin(a1) * c.r, Z0 + .03], .12, .03, col, 1); }
      for (let j = 0; j < 5; j++) { const a = j / 5 * 6.2832 + t * .8; os([c.x, c.y, Z0 + .025], [c.x + Math.cos(a) * c.r * k, c.y + Math.sin(a) * c.r * k, Z0 + .025], .06, .02, col, 1); }
      for (let j = 0; j < 5; j++) { const a = j / 5 * 6.2832 + t * .8, b2 = (j + 2) / 5 * 6.2832 + t * .8; os([c.x + Math.cos(a) * c.r * .7, c.y + Math.sin(a) * c.r * .7, Z0 + .027], [c.x + Math.cos(b2) * c.r * .7, c.y + Math.sin(b2) * c.r * .7, Z0 + .027], .05, .02, col, 1); }
    } else {
      for (let j = 0; j < n; j++) { const a0 = j / n * 6.2832, a1 = (j + .7) / n * 6.2832; os([c.x + Math.cos(a0) * c.r, c.y + Math.sin(a0) * c.r, Z0 + .03], [c.x + Math.cos(a1) * c.r, c.y + Math.sin(a1) * c.r, Z0 + .03], .16, .04, [255, 200, 80], 1); }
      for (let j = 0; j < 9; j++) { const a = j * 2.4 + c.x, r = (j % 3) * c.r * .32, h = .5 + .6 * Math.abs(Math.sin(t * 9 + j * 1.7)), x = c.x + Math.cos(a) * r, y = c.y + Math.sin(a) * r;
        os([x, y, Z0], [x, y, Z0 + h], .26, .26, [255, 120, 30], 1); os([x, y, Z0], [x, y, Z0 + h * .6], .13, .13, [255, 230, 140], 1); }
    }
  }
  const B = ROI.jardinier;
  if (B && pres(B.x, B.y) && beasts.includes(B)) {
    const mort = B.dead > 0 ? Math.min(1, B.dead) : 0;
    for (const L of ROI.lianes) {
      const ca = Math.cos(L.a), sa = Math.sin(L.a), u = t - L.t, n = 14;
      const leve = !mort && L.etat === 'leve' ? Math.min(1, u / .9) : 0, frappe = !mort && L.etat === 'frappe' ? Math.max(0, 1 - u / .3) : 0;
      let prev = null;
      for (let k = 0; k <= n; k++) {
        const f = k / n, s = 1.3 + (L.L - 1.3) * f, ond = Math.sin(s * 1.4 + t * 1.3 * (1 - mort) + L.ph) * .28 * (1 - leve * .7);
        const z = Z0 + .12 - mort * .08 + leve * 1.3 * Math.sin(Math.PI * f) + (leve ? Math.sin(t * 40 + k) * .03 : 0);
        const p = [B.x + ca * s - sa * ond, B.y + sa * s + ca * ond, z];
        if (prev) {
          const w = .42 - .3 * f, rouge = leve > .3, col = rouge ? [150 + 105 * leve * (.5 + .5 * Math.sin(t * 20)) | 0, 50, 36] : frappe ? [255, 220, 120] : k & 1 ? JA_C.liane : JA_C.liane2;
          os(prev, p, w, w * .8, col, rouge || frappe > 0);
          if (k % 3 === 0) os(p, [p[0] - sa * w * .7, p[1] + ca * w * .7, p[2] + w * .4], .06, .03, JA_C.epine);
          if (k % 4 === 2 && !mort) os([p[0], p[1], p[2] + w * .38], [p[0], p[1], p[2] + w * .5], .1, .1, [255, 220, 90], 1);
        }
        prev = p;
      }
      if (leve > .2) for (let s = 1.6; s < L.L; s += .55) os([B.x + ca * s, B.y + sa * s, Z0 + .02], [B.x + ca * Math.min(L.L, s + .35), B.y + sa * Math.min(L.L, s + .35), Z0 + .02], .22, .02, [255, 40, 30], 1);
    }
    const E = ROI.etreinte;
    if (E) {
      if (!E.prise) { const f = .5 + .5 * Math.sin(t * 16);
        for (let j = 0; j < 14; j++) { const a0 = j / 14 * 6.2832, a1 = (j + .6) / 14 * 6.2832; os([E.x + Math.cos(a0) * 1.2, E.y + Math.sin(a0) * 1.2, Z0 + .03], [E.x + Math.cos(a1) * 1.2, E.y + Math.sin(a1) * 1.2, Z0 + .03], .16, .05, [120 + 100 * f | 0, 70, 40], 1); }
        for (let j = 0; j < 6; j++) { const a = j * 1.05 + t; os([E.x + Math.cos(a) * .5, E.y + Math.sin(a) * .5, Z0 + .01], [E.x + Math.cos(a) * .55, E.y + Math.sin(a) * .55, Z0 + .08 + .05 * Math.sin(t * 9 + j)], .12, .12, [70, 54, 36]); } }
      else { const v = Math.min(1, (t - E.t1) / .25); let p = [E.x, E.y, Z0];
        for (let k = 1; k <= 8; k++) { const a = k * 1.2 + t * 2, r = .38 - k * .02, n2 = [E.x + Math.cos(a) * r, E.y + Math.sin(a) * r, Z0 + k * .21 * v]; os(p, n2, .17 - k * .012, .15 - k * .01, k & 1 ? JA_C.liane : JA_C.liane2); p = n2; } }
    }
  }
  for (const g of ROI.graines) os([g.x, g.y, g.z - .09], [g.x, g.y, g.z + .09], .18, .18, [200, 210, 70], 1);
}

// ============================================================
//  LE TRÔNE : LE ROI DÉMON
//  Une antichambre (le soupirail, l'autel, deux statues de démons) ; une allée de quatre cases ; puis la salle du
//  Trône, vingt-huit cases sur vingt-quatre : un tapis rouge jusqu'à l'estrade, huit piliers en deux rangées, des
//  bannières à la couronne, des braseros, deux rigoles de lave le long des murs. Sur l'estrade, le trône.
//  ASSIS (au-dessus des deux tiers de sa vie) : il appelle des diablotins (des sceaux de braise s'ouvrent devant
//  l'estrade), fait jaillir des colonnes de feu (un cercle au sol, 1,4 s avant), et balaie de son épée qui monte sur
//  l'estrade. DEBOUT : il descend ; épée de flammes en arc, chaîne qui vous tire à lui, charge en ligne droite (un
//  trait rouge au sol la précède) ; s'il charge dans un pilier, le pilier tombe et il reste sonné ; et de lui-même,
//  toutes les seize secondes, il fait tomber un pilier (il tremble avant). SOUS 30 % : il s'envole, et le sol
//  s'effondre en lave (les dalles rougeoient deux secondes et demie avant) ; il ne reste que l'estrade, les
//  piliers tombés et quelques îlots. Il tourne au-dessus, crache des boules de feu, et plonge sur vous (une ombre
//  au sol grandit) ; à l'impact il reste étourdi, la couronne embrasée : c'est son point faible.
// ============================================================
const TRONE_BIO = { mur: 13, salle: 6, couloir: 6 };
function genTrone() {
  const Z0 = DJ_Z0, HM = Z0 + DJ_MUR, BI = TRONE_BIO;
  Hgt.fill(HM); Bio.fill(BI.mur); Eau.fill(0); PlT.fill(0); PlB.fill(0);
  ROI.ponts = []; ROI.coulees = []; ROI.pilons = []; ROI.chaines = []; ROI.pontDit = false;
  const cx = 100, y0 = 64, W = 28, Hh = 24;
  const salles = [{ x: cx - 14, y: y0, w: W, h: Hh, role: 'trone' }, { x: cx - 6, y: y0 + Hh + 6, w: 12, h: 9, role: 'arrivee' }];
  const creuse = (x, y, bio) => { const i = y * WS + x; Hgt[i] = Z0; Bio[i] = bio; };
  for (const q of salles) { q.cx = q.x + q.w / 2; q.cy = q.y + q.h / 2; q.portes = []; for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) creuse(x, y, BI.salle); }
  for (let y = y0 + Hh; y < y0 + Hh + 6; y++) for (let x = cx - 2; x < cx + 2; x++) creuse(x, y, BI.couloir);
  for (const q of salles) for (let y = q.y - 1; y <= q.y + q.h; y++) for (let x = q.x - 1; x <= q.x + q.w; x++) {
    if (y !== q.y - 1 && y !== q.y + q.h && x !== q.x - 1 && x !== q.x + q.w) continue; const i = y * WS + x; if (Hgt[i] === Z0) q.portes.push(i); }
  for (let y = y0 + 1; y < y0 + 6; y++) for (let x = cx - 5; x < cx + 5; x++) Hgt[y * WS + x] = Z0 + 1;     // l'estrade
  ROI.piliers = [];
  for (const py of [y0 + 8, y0 + 15]) for (const px of [cx - 11, cx - 7, cx + 5, cx + 9]) {
    const cases = []; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = (py + dy) * WS + px + dx; Hgt[i] = HM; cases.push(i); }
    ROI.piliers.push({ x: px + 1, y: py + 1, cases, etat: 'debout', t: -9, a: 0 });
  }
  for (let y = y0 + 2; y < y0 + Hh - 2; y++) for (const x of [cx - 14, cx + 13]) { const i = y * WS + x; Hgt[i] = Z0 - 1; Eau[i] = Z0; }
  DJ.salles = salles; DJ.escalier = null; ROI.sceau = null;
  calcOmbrage();
  return true;
}
function peuplerTrone(H) {
  const { Z0, deco, bete, coffre } = H, q = DJ.salles[0], A = DJ.salles[1], cx = q.cx, y0 = q.y;
  ROI.autel = { x: A.cx, y: A.cy + 1.2 }; ROI.salleGarde = 0; ROI.colonnes = []; ROI.braseros = []; ROI.effondre = null; ROI.retour = null;
  DJ.monte.push({ x: A.x + 1.6, y: A.y + A.h - 1.6, z: Z0 });
  const or = [214, 170, 70], rouge = [120, 18, 24], noir = [26, 22, 28], pierre = [58, 52, 56];
  const brasero = (x, y, h = 1.1, w = .9) => {                // un brasero sur trépied : la vasque, le feu
    for (let k = 0; k < 3; k++) { const a = k * 2.094; deco([x + Math.cos(a) * w * .45, y + Math.sin(a) * w * .45, Z0], [x + Math.cos(a) * w * .2, y + Math.sin(a) * w * .2, Z0 + h], .07, .07, noir); }
    deco([x, y, Z0 + h], [x, y, Z0 + h + .22], w, w, [44, 38, 40]); deco([x, y, Z0 + h + .2], [x, y, Z0 + h + .26], w * 1.1, w * 1.1, or);
    deco([x, y, Z0 + h + .22], [x, y, Z0 + h + .34], w * .8, w * .8, [255, 120, 40], 1); ROI.braseros.push({ x, y, z: Z0 + h + .3, w });
  };
  const banniere = (x, y, nx, ny) => {                         // une bannière rouge à la couronne d'or, sur sa hampe
    const tx = -ny, ty = nx, b = [x + nx * .1, y + ny * .1];
    deco([b[0] - tx * .55, b[1] - ty * .55, Z0 + 3.1], [b[0] + tx * .55, b[1] + ty * .55, Z0 + 3.1], .06, .06, or);
    deco([b[0], b[1], Z0 + 1.2], [b[0], b[1], Z0 + 3.05], .9, .04, rouge);
    deco([b[0] - tx * .45 + nx * .02, b[1] - ty * .45 + ny * .02, Z0 + 1.2], [b[0] + tx * .45 + nx * .02, b[1] + ty * .45 + ny * .02, Z0 + 1.2], .05, .08, or);
    const c = [b[0] + nx * .03, b[1] + ny * .03];
    deco([c[0] - tx * .2, c[1] - ty * .2, Z0 + 2.3], [c[0] + tx * .2, c[1] + ty * .2, Z0 + 2.3], .03, .1, or);
    for (const s of [-.2, 0, .2]) deco([c[0] + tx * s, c[1] + ty * s, Z0 + 2.35], [c[0] + tx * s, c[1] + ty * s, Z0 + 2.5 + (s ? 0 : .06)], .03, .05, or);
  };
  const statue = (x, y, a) => {                                 // un démon de pierre accroupi sur son socle, les ailes hautes
    const c = Math.cos(a), s = Math.sin(a), P2 = (f, l, z) => [x + c * f - s * l, y + s * f + c * l, Z0 + z], st = [74, 68, 70];
    deco(P2(0, 0, 0), P2(0, 0, .9), 1.1, 1.1, pierre); deco(P2(0, 0, .9), P2(0, 0, 1), 1.25, 1.25, [70, 64, 66]);
    deco(P2(-.1, 0, 1.1), P2(.15, 0, 2.1), .7, .55, st); deco(P2(.2, 0, 2.15), P2(.35, 0, 2.35), .4, .4, st);
    for (const l of [-1, 1]) { deco(P2(.25, l * .14, 2.4), P2(.1, l * .3, 2.8), .08, .08, st); deco(P2(-.15, l * .3, 1.9), P2(-.45, l * .9, 3.2), .1, .1, st);
      deco(P2(-.3, l * .55, 2.4), P2(-.35, l * .7, 1.5), .5, .06, st); deco(P2(.3, l * .3, 1.1), P2(.45, l * .3, 1.6), .16, .16, st); }
    deco(P2(.42, .07, 2.3), P2(.43, .07, 2.3), .05, .05, [255, 90, 40], 1); deco(P2(.42, -.07, 2.3), P2(.43, -.07, 2.3), .05, .05, [255, 90, 40], 1);
  };
  const cranes = (x, y, n) => { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, dx = (Math.random() - .5) * .9, dy = (Math.random() - .5) * .9, z = Z0 + .12 + (k > 3 ? .22 : 0);
    deco([x + dx - Math.cos(a) * .11, y + dy - Math.sin(a) * .11, z], [x + dx + Math.cos(a) * .11, y + dy + Math.sin(a) * .11, z], .22, .2, [206, 196, 172]);
    deco([x + dx + Math.cos(a) * .11, y + dy + Math.sin(a) * .11, z + .02], [x + dx + Math.cos(a) * .125, y + dy + Math.sin(a) * .125, z + .02], .16, .05, [20, 16, 18]); } };
  // l'antichambre
  statue(A.cx - 3.2, A.y + 1.6, Math.PI / 2); statue(A.cx + 3.2, A.y + 1.6, Math.PI / 2);
  brasero(A.x + 1.3, A.y + 1.3, .9, .7); brasero(A.x + A.w - 1.3, A.y + A.h - 1.3, .9, .7);
  banniere(A.x + .02, A.cy, 1, 0); banniere(A.x + A.w - .02, A.cy, -1, 0);
  // l'allée : un tapis rouge bordé d'or, de la porte de l'antichambre jusqu'à l'estrade
  deco([cx, A.y + 1, Z0 + .015], [cx, y0 + 6.1, Z0 + .015], 2.6, .03, [140, 20, 26]);
  for (const s of [-1, 1]) deco([cx + s * 1.3, A.y + 1, Z0 + .02], [cx + s * 1.3, y0 + 6.1, Z0 + .02], .14, .03, or);
  // l'estrade : son bord doré, deux marches de part et d'autre du tapis
  deco([cx - 5, y0 + 6, Z0 + .95], [cx + 5, y0 + 6, Z0 + .95], .08, .1, or);
  for (const s of [-1, 1]) deco([cx + s * 5, y0 + 1, Z0 + .95], [cx + s * 5, y0 + 6, Z0 + .95], .08, .1, or);
  deco([cx - 1.4, y0 + 6.45, Z0 + .25], [cx + 1.4, y0 + 6.45, Z0 + .25], .9, .5, [64, 56, 60]);   // la marche
  deco([cx, y0 + 1, Z0 + 1.015], [cx, y0 + 6, Z0 + 1.015], 2.6, .03, [140, 20, 26]);
  // le trône : un dossier immense hérissé de cornes, deux accoudoirs à crânes, un coussin rouge
  { const ty = y0 + 2.2, z = Z0 + 1;
    deco([cx, ty, z], [cx, ty, z + 1.2], 2.6, 1.6, noir); deco([cx, ty + .1, z + 1.2], [cx, ty + .1, z + 1.3], 2.2, 1.4, [140, 20, 26]);
    deco([cx, ty - .75, z + 1.2], [cx, ty - .75, z + 4.6], 2.8, .5, noir);
    deco([cx, ty - .5, z + 1.3], [cx, ty - .5, z + 4.2], 1.9, .06, [110, 16, 22]);
    for (const [dx, h] of [[-1.3, 5.2], [-.65, 5.7], [0, 6.2], [.65, 5.7], [1.3, 5.2]]) { deco([cx + dx, ty - .75, z + 4.5], [cx + dx * 1.15, ty - .8, z + h], .22, .22, noir); deco([cx + dx * 1.15, ty - .8, z + h - .1], [cx + dx * 1.18, ty - .82, z + h + .25], .1, .1, or); }
    deco([cx, ty - .45, z + 4.1], [cx, ty - .42, z + 4.4], .5, .3, [255, 60, 40], 1);
    for (const s of [-1, 1]) { deco([cx + s * 1.3, ty - .7, z + 1.85], [cx + s * 1.3, ty + .7, z + 1.85], .35, .3, noir); deco([cx + s * 1.3, ty + .7, z + 1.7], [cx + s * 1.3, ty + .95, z + 1.9], .3, .3, [206, 196, 172]);
      deco([cx + s * 1.3, ty + .96, z + 1.85], [cx + s * 1.3, ty + .98, z + 1.85], .2, .06, [20, 16, 18]); deco([cx + s * 1.3, ty - .7, z + 1.2], [cx + s * 1.3, ty - .7, z + 1.85], .3, .3, noir); }
    cranes(cx - 3.6, y0 + 3, 6); cranes(cx + 3.6, y0 + 3.5, 5);
  }
  // les braseros, les bannières, les chaînes et leurs cages
  for (const [x, y] of [[q.x + 2, q.y + 2], [q.x + q.w - 2, q.y + 2], [q.x + 2.5, q.y + q.h - 2.5], [q.x + q.w - 2.5, q.y + q.h - 2.5], [cx - 6.5, y0 + 1.6], [cx + 6.5, y0 + 1.6]]) brasero(x, y, 1.1, .9);
  for (let y = y0 + 4; y < y0 + 21; y += 5) { banniere(q.x + 1.02, y, 1, 0); banniere(q.x + q.w - 1.02, y, -1, 0); }
  for (const [x, y] of [[cx - 4, y0 + 11], [cx + 3, y0 + 18], [cx - 9, y0 + 20], [cx + 10, y0 + 12]]) ROI.chaines.push({ x, y, L: 1.8 + Math.random(), ph: Math.random() * 6.28, croc: 0, cage: 1 });
  for (const s of [-1, 1]) deco([cx + s * 13.5, y0 + 2, Z0 + .06], [cx + s * 13.5, y0 + 22, Z0 + .06], .12, .14, [80, 70, 74]);   // le rebord des rigoles
  coffre(cx + 8, y0 + 2.5, 'garde', 0);
  // le Roi, sur son trône
  bete('roi_demon', cx, y0 + 7.5, 0, b => { b.x = cx; b.y = y0 + 2.6; b.z = Z0 + 1; b.home = [b.x, b.y]; b.etat = 'assis'; b.dir = b.dirT = Math.PI / 2; b.phase = 1; });
  // les îlots qui resteront quand le sol s'effondrera
  ROI.trone = { s: 0, cx, y0, tx: cx, ty: y0 + 2.6, fini: false,
    iles: [[cx - 8, y0 + 11.5], [cx + 8, y0 + 11.5], [cx - 3.5, y0 + 19], [cx + 3.5, y0 + 19], [cx, y0 + 12.5], [cx - 10, y0 + 20], [cx + 10.5, y0 + 20]] };
  if (!beasts.some(b => b.sp.corps === 'roi')) ROI.trone.fini = true;
}

// À chaque image : les braseros, les colonnes de feu, les piliers qui tombent, le sol qui s'effondre (et revient)
function majTrone(dt, J) {
  const Z0 = DJ_Z0, T = ROI.trone, pres = (x, y, r = 26) => (x - P.x) ** 2 + (y - P.y) ** 2 < r * r;
  for (const B of ROI.braseros) if (pres(B.x, B.y) && Math.random() < dt * 9) parts.push({ x: B.x + (Math.random() - .5) * B.w * .6, y: B.y + (Math.random() - .5) * B.w * .6, z: B.z, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: 1.2 + Math.random() * 1.2, g: -.3, life: .6, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .08 });
  for (let k = ROI.colonnes.length - 1; k >= 0; k--) {
    const c = ROI.colonnes[k], u = t - c.t0;
    if (c.etat === 'alerte' && u > 1.4) { c.etat = 'feu'; c.t0 = t; SON.jouer('cracheFeu', {}, c.x, c.y, Z0);
      for (const Q of J) if (Math.hypot(Q.x - c.x, Q.y - c.y) < 1.4 && Q.z < Z0 + 3) { if (coupBrume({ x: c.x, y: c.y, z: Z0, sp: {} }, Q, .16 * (pacte('braise') ? 2 : 1), [0, 0, 4]) && Q === P) P.brulure = Math.max(P.brulure || 0, t + 2); } }
    else if (c.etat === 'feu' && u > 1) { ROI.colonnes.splice(k, 1); continue; }
    if (c.etat === 'feu' && Math.random() < dt * 50) parts.push({ x: c.x + (Math.random() - .5) * 1.4, y: c.y + (Math.random() - .5) * 1.4, z: Z0 + Math.random() * 4, vx: 0, vy: 0, vz: 3 + Math.random() * 3, g: -.5, life: .5, age: 0, col: Math.random() < .5 ? '#ffd060' : '#ff5a18', luit: 1, tl: .12 });
  }
  for (const p of ROI.piliers) {
    if (p.etat === 'tremble') {
      if (Math.random() < dt * 25) parts.push({ x: p.x + (Math.random() - .5) * 2, y: p.y + (Math.random() - .5) * 2, z: Z0 + DJ_MUR - .2, vx: 0, vy: 0, vz: -.5, g: 7, life: .8, age: 0, col: '#6a6064', tl: .05 });
      if (t - p.t > 1.3) { p.etat = 'chute'; p.t = t; for (const i of p.cases) { Hgt[i] = Z0; signalDecor('dalle', i); } SON.jouer('grattement', {}, p.x, p.y, Z0 + 2); }
    } else if (p.etat === 'chute' && t - p.t > .6) {          // il touche le sol : tout ce qui est dessous est écrasé, les tambours restent en travers
      p.etat = 'tombe'; p.t = t;
      const ca = Math.cos(p.a), sa = Math.sin(p.a);
      SON.jouer('effondre', {}, p.x, p.y, Z0); SON.jouer('impact', {}, p.x, p.y, Z0);
      if ((p.x - P.x) ** 2 + (p.y - P.y) ** 2 < 144) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .7); }
      for (const Q of J) { const rx = Q.x - p.x, ry = Q.y - p.y, s = rx * ca + ry * sa, d = Math.abs(-rx * sa + ry * ca);
        if (s > -1 && s < 6.5 && d < 1.3 && Q.z < Z0 + 2) { coupBrume({ x: p.x, y: p.y, z: Z0, sp: {} }, Q, .25, [-sa * 6 * Math.sign(-rx * sa + ry * ca || 1), ca * 6 * Math.sign(-rx * sa + ry * ca || 1), 3]); if (Q === P) say('le pilier vous écrase', 1.4); } }
      p.gravats = [];
      for (let s = .5; s < 6; s += .5) for (const o of [-.5, .5]) { const x = p.x + ca * s - sa * o, y = p.y + sa * s + ca * o, i = (y | 0) * WS + (x | 0);
        if (Hgt[i] === Z0 && !(Eau[i] > Hgt[i]) && !J.some(Q => (Q.x | 0) === (x | 0) && (Q.y | 0) === (y | 0)) && djDansSalle(DJ.salles[0], x, y, .5) && !p.gravats.includes(i)) { Hgt[i] = Z0 + 1; signalDecor('dalle', i); p.gravats.push(i); } }
      for (let k = 0; k < 40; k++) { const s = Math.random() * 6, x = p.x + ca * s, y = p.y + sa * s;
        parts.push({ x, y, z: Z0 + .5, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, vz: 1 + Math.random() * 3, g: 6, life: 1, age: 0, col: Math.random() < .5 ? '#6a6064' : '#9a9094', tl: .1 }); }
    }
  }
  const F = ROI.effondre;                                       // le sol s'effondre : d'abord il rougeoie, puis il cède du bord vers le centre
  if (F && t - F.t0 > 2.5 && F.k < F.cases.length) {
    for (let n = 0; n < 40 && F.k < F.cases.length; n++) { const i = F.cases[F.k++]; if (Hgt[i] !== Z0) continue; Hgt[i] = Z0 - 1; Eau[i] = Z0; signalDecor('dalle', i);
      if (Math.random() < .2) burst(i % WS + .5, (i / WS | 0) + .5, Z0, 3, '#ff7a20'); }
    if (F.k >= F.cases.length) SON.jouer('effondre', {}, T.cx, T.y0 + 12, Z0);
  }
  const Rt = ROI.retour;                                        // le Roi mort : la lave se refige
  if (Rt && t - Rt.t0 > 3 && Rt.k < Rt.cases.length) for (let n = 0; n < 30 && Rt.k < Rt.cases.length; n++) { const i = Rt.cases[Rt.k++]; Hgt[i] = Z0; Eau[i] = 0; signalDecor('dalle', i); if (Math.random() < .2) burst(i % WS + .5, (i / WS | 0) + .5, Z0 + .1, 3, '#4a4048'); }
  // l'air : des braises, de la cendre
  if (Math.random() < dt * 5) { const x = P.x + (Math.random() - .5) * 16, y = P.y + (Math.random() - .5) * 16; parts.push({ x, y, z: Z0 + .2, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .5 + Math.random() * .8, g: -.1, life: 2.2, age: 0, col: Math.random() < .5 ? '#ff7a20' : '#ffb040', luit: 1, tl: .045 }); }
}
function tomberPilier(p, a) {
  if (!p || p.etat !== 'debout') return;
  p.etat = 'tremble'; p.t = t; p.a = a; SON.jouer('grattement', {}, p.x, p.y, DJ_Z0 + 2);
  if ((p.x - P.x) ** 2 + (p.y - P.y) ** 2 < 400 && t - (ROI.pilierDit || -99) > 20) { ROI.pilierDit = t; say('un pilier se fend', 1.6); }
}
function effondrerTrone() {
  const T = ROI.trone, q = DJ.salles[0], Z0 = DJ_Z0, L = [];
  for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) {
    const i = y * WS + x; if (Hgt[i] !== Z0 || Eau[i] > Hgt[i]) continue;
    if (T.iles.some(([a, b]) => (x + .5 - a) ** 2 + (y + .5 - b) ** 2 < 3)) continue;
    if (y >= q.y + q.h - 2 && Math.abs(x + .5 - T.cx) < 2.5) continue;      // devant la porte : on peut encore fuir
    L.push(i);
  }
  L.sort((i, j) => Math.hypot(j % WS + .5 - T.cx, (j / WS | 0) - T.y0 - 12) - Math.hypot(i % WS + .5 - T.cx, (i / WS | 0) - T.y0 - 12));
  ROI.effondre = { t0: t, cases: L, k: 0 }; ROI.retour = null;
  say('le sol de la salle s\'effondre · gagnez un îlot', 3);
}

// LE ROI DÉMON
function majRoi(b, dt) {
  const T = ROI.trone, q = DJ.salles[b.djSalle] || DJ.salles[0], Z0 = DJ_Z0;
  const J = joueursDans().filter(Q => djDansSalle(q, Q.x, Q.y, -1));
  if (b.act) return actionRoi(b, dt, J);
  if (!J.length) { b.vit = 0; if (b.phase === 1) b.etat = 'assis'; return; }
  if (!b.eveil) { b.eveil = true; b.phase = 1; b.appelT = t + 4; b.colT = t + 2.5; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 2); say('Le Roi démon vous attendait', 3.5); }
  let c = J[0], dc = 1e9; for (const Q of J) { const d = Math.hypot(Q.x - b.x, Q.y - b.y); if (d < dc) { dc = d; c = Q; } }
  if (b.phase === 1 && b.pv <= .66) return agirBrume(b, 'lever', c);
  if (b.phase === 2 && b.pv <= .3) return agirBrume(b, 'envol', c);
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x);
  if (b.phase === 1) {
    b.etat = 'assis'; b.vit = 0; b.x = T.tx; b.y = T.ty; b.z = Z0 + 1; tournerBrume(b, dt, 1);
    if (dc < 3.8 && t > (b.balayT || 0)) return agirBrume(b, 'balayer', c);
    if (t > b.colT) return agirBrume(b, 'colonnes', c);
    if (t > b.appelT && beasts.filter(o => o.sp.corps === 'diablotin' && !o.dead).length < 5) return agirBrume(b, 'appel', c);
    return;
  }
  if (b.phase === 2) {
    tournerBrume(b, dt, 2.4);
    if (t > (b.pilierT || 0)) { const L = ROI.piliers.filter(p => p.etat === 'debout'); if (L.length) { const p = L[Math.random() * L.length | 0]; tomberPilier(p, Math.atan2(c.y - p.y, c.x - p.x)); } b.pilierT = t + 16; }
    if (dc < 3.8 && t > (b.epeeT || 0)) return agirBrume(b, 'epee', c);
    if (dc > 5 && dc < 12 && t > (b.chaineT || 0)) return agirBrume(b, 'chaine', c);
    if (dc > 6 && t > (b.chargeT || 0)) return agirBrume(b, 'charge', c);
    if (t > (b.colT || 0)) return agirBrume(b, 'colonnes', c);
    b.etat = 'marcher'; pasBrume(b, c.x, c.y, b.sp.spd, dt, 1.2); return;
  }
  // dans les airs : il tourne autour de vous, au-dessus de la lave
  b.etat = 'vol'; b.alt = Math.min(4.5, (b.alt || 0) + dt * 3);
  b.orbe = (b.orbe || 0) + dt * .6;
  const tx = c.x + Math.cos(b.orbe) * 5, ty = c.y + Math.sin(b.orbe) * 5, d = Math.hypot(tx - b.x, ty - b.y);
  if (d > .1) { const s = Math.min(4.5 * dt, d); b.x += (tx - b.x) / d * s; b.y += (ty - b.y) / d * s; b.vit = 4.5; }
  b.x = Math.max(q.x + 1, Math.min(q.x + q.w - 1, b.x)); b.y = Math.max(q.y + 1, Math.min(q.y + q.h - 1, b.y)); b.z = Z0 + b.alt;
  tournerBrume(b, dt, 3);
  if (t > (b.plongeT || 0)) return agirBrume(b, 'plongee', c);
  if (t > (b.pluieT || 0)) return agirBrume(b, 'pluie', c);
}
function actionRoi(b, dt, J) {
  const u = t - b.actT, c = b.actC, Z0 = DJ_Z0, T = ROI.trone, sz = b.sp.sz || 1, vivant = c && (estJoueur(c) ? c.pv > 0 : !c.dead);
  const viser = (v = 3) => { if (vivant) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, v); } };
  b.vit = 0;
  if (b.act === 'balayer' || b.act === 'epee') {               // l'épée de flammes, en arc devant lui
    const arme = b.act === 'balayer' ? .6 : .7;
    if (u < arme) { b.etat = b.act === 'balayer' ? 'balayer' : 'lever_epee'; viser(3); return; }
    b.etat = b.act === 'balayer' ? 'balayer' : 'epee';
    if (!b.fait) { b.fait = true; SON.jouer('volee', {}, b.x, b.y, b.z + 2); SON.jouer('cracheFeu', { vol: .6 }, b.x, b.y, b.z + 2);
      for (const Q of J) { const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1;
        if (d < 4.4 && (dx * Math.cos(b.dir) + dy * Math.sin(b.dir)) / d > -.15 && Math.abs(Q.z - b.z) < 2.5) { if (coupBrume(b, Q, b.act === 'balayer' ? .16 : .2, [dx / d * 7, dy / d * 7, 3]) && Q === P) P.brulure = Math.max(P.brulure || 0, t + 2); } }
      for (let k = 0; k < 30; k++) { const a = b.dir - 1.2 + k / 30 * 2.4, r = 2 + Math.random() * 2.2;
        parts.push({ x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r, z: b.z + .8 + Math.random() * .5, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, vz: .8, g: -.3, life: .5, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .1 }); } }
    if (u > arme + .6) { if (b.act === 'balayer') b.balayT = t + 3; else b.epeeT = t + 2.4; b.act = null; }
    return;
  }
  if (b.act === 'colonnes') {                                  // l'épée levée : des cercles au sol, puis le feu
    b.etat = b.phase === 1 ? 'colonnes' : 'lever_epee';
    if (u > .8 && !b.fait) { b.fait = true; SON.jouer('sort', {}, b.x, b.y, b.z + 3);
      const q = DJ.salles[0], L = J.map(Q => [Q.x + (Q.vx || 0) * .4, Q.y + (Q.vy || 0) * .4]);
      for (let k = 0; k < (b.phase === 1 ? 4 : 2); k++) L.push([q.x + 2 + Math.random() * (q.w - 4), q.y + 7 + Math.random() * (q.h - 9)]);
      for (const [x, y] of L) ROI.colonnes.push({ x, y, t0: t, etat: 'alerte' }); }
    if (u > 1.4) { b.act = null; b.colT = t + (b.phase === 1 ? 5.5 : 12); }
    return;
  }
  if (b.act === 'appel') {                                     // la main gauche levée : des sceaux de braise s'ouvrent, des diablotins en sortent
    b.etat = 'appel';
    if (u > 1 && !b.fait) { b.fait = true; SON.jouer('rugDemon', { vol: .7 }, b.x, b.y, b.z + 2);
      for (let k = 0; k < 3; k++) { const x = T.cx + (k - 1) * 4, y = T.y0 + 9 + Math.random() * 3; const d = naitre(specById.diablotin, x, y);
        d.variante = null; d.z = Z0; d.pv = 1; d.age = 1e6; d.ech = 1; d.vie = 45; d.djSalle = b.djSalle; d.etat = 'surgir'; d.etT = t; d.alerte = t + 40; d.dir = d.dirT = Math.PI / 2;
        beasts.push(d); jaillir(d, true); } }
    if (u > 1.8) { b.act = null; b.appelT = t + 13; }
    return;
  }
  if (b.act === 'lever') {                                     // il se lève : l'onde repousse tout le monde
    b.etat = 'lever';
    if (u > 1 && !b.fait) { b.fait = true; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 2); SON.jouer('explosion', { vol: .6 }, b.x, b.y, b.z); say('Le Roi démon se lève', 3);
      P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .8);
      for (const Q of J) { const dx = Q.x - b.x, dy = Q.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < 6) coupBrume(b, Q, .08, [dx / d * 9, dy / d * 9, 4]); }
      anneauBraise(b.x, b.y, 6); }
    if (u > 2.2) { b.act = null; b.phase = 2; b.pilierT = t + 6; b.chargeT = t + 4; b.chaineT = t + 2; b.colT = t + 8; b.x += 0; b.y += 2.5; b.z = sol(b.x, b.y); }
    return;
  }
  if (b.act === 'chaine') {                                    // un trait au sol, la chaîne qui file, qui vous tire contre lui
    const L = 12;
    if (u < .7) { b.etat = 'viser'; viser(4); b.trait = [b.x, b.y, b.x + Math.cos(b.dir) * L, b.y + Math.sin(b.dir) * L]; b.prise = null; return; }
    b.etat = 'lancer';
    if (u < 1.1) {
      const tip = Math.min(L, (u - .7) / .25 * L), ca = Math.cos(b.dir), sa = Math.sin(b.dir);
      if (!b.prise) for (const Q of J) { const rx = Q.x - b.x, ry = Q.y - b.y, s = rx * ca + ry * sa, p = Math.abs(-rx * sa + ry * ca);
        if (s > 0 && s <= tip && p < .8) { b.prise = Q; SON.jouer('lacere', {}, Q.x, Q.y, Q.z + .6); if (Q === P) say('la chaîne du Roi vous happe', 1.4); } }
      if (b.prise) { const Q = b.prise, a = Math.atan2(b.y - Q.y, b.x - Q.x), d = Math.hypot(b.x - Q.x, b.y - Q.y);
        if (d > 2) { const s = Math.min(16 * dt, d - 1.8); if (Q === P) { P.x += Math.cos(a) * s; P.y += Math.sin(a) * s; P.vx = P.vy = 0; } } }
      return;
    }
    if (b.prise) { b.prise = null; b.trait = null; agirBrume(b, 'epee', c); b.actT = t - .3; b.chaineT = t + 7; return; }
    b.trait = null; if (u > 1.4) { b.act = null; b.chaineT = t + 6; }
    return;
  }
  if (b.act === 'charge') {                                    // il gratte le sol, puis fonce tout droit
    const L = 14;
    if (u < 1) { b.etat = 'armer'; viser(3); b.trait = [b.x, b.y, b.x + Math.cos(b.dir) * L, b.y + Math.sin(b.dir) * L]; b.chHit = [];
      if (Math.random() < dt * 20) parts.push({ x: b.x + (Math.random() - .5), y: b.y + (Math.random() - .5), z: Z0 + .1, vx: -Math.cos(b.dir) * 2, vy: -Math.sin(b.dir) * 2, vz: 1, g: 5, life: .5, age: 0, col: '#6a5a50', tl: .08 }); return; }
    if (u < 2.1 && !b.sonne) {
      b.etat = 'courir'; b.trait = null;
      const nx = b.x + Math.cos(b.dir) * 13 * dt, ny = b.y + Math.sin(b.dir) * 13 * dt, i = (ny | 0) * WS + (nx | 0);
      if (Hgt[i] > Z0 + 1.5) {                                 // un pilier, un mur : il s'y brise
        const p = ROI.piliers.find(o => o.cases.includes(i) || (o.etat === 'debout' && Math.hypot(o.x - nx, o.y - ny) < 1.6));
        if (p) tomberPilier(p, b.dir);
        b.sonne = t; SON.jouer('impact', {}, nx, ny, Z0 + 1); P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .6);
        if (t - (ROI.sonneDit || -99) > 30) { ROI.sonneDit = t; say('le Roi se sonne contre la pierre', 1.8); }
      } else if (!(Eau[i] > Hgt[i])) { b.x = nx; b.y = ny; b.z = sol(nx, ny); b.vit = 13; }
      for (const Q of J) if (!b.chHit.includes(Q) && Math.hypot(Q.x - b.x, Q.y - b.y) < 1.6) { b.chHit.push(Q); coupBrume(b, Q, .22, [Math.cos(b.dir) * 9 - Math.sin(b.dir) * 4, Math.sin(b.dir) * 9 + Math.cos(b.dir) * 4, 4]); }
      return;
    }
    if (b.sonne) { b.etat = 'sonne'; if (t - b.sonne < 1.6) return; b.sonne = null; }
    b.act = null; b.chargeT = t + 9; b.chHit = null;
    return;
  }
  if (b.act === 'envol') {                                     // il s'envole ; le sol cède
    b.etat = 'envol'; b.alt = Math.min(4.5, (b.alt || 0) + dt * 2.6); b.z = sol(b.x, b.y) + b.alt;
    if (u > .5 && !b.fait) { b.fait = true; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 2); say('Le Roi démon prend son envol', 3); effondrerTrone(); }
    if (u > 2) { b.act = null; b.phase = 3; b.plongeT = t + 4.5; b.pluieT = t + 2.5; }
    return;
  }
  if (b.act === 'plongee') {                                   // une ombre grandit sous lui, il fond, il reste étourdi
    if (!b.cible3) b.cible3 = [c.x, c.y];
    const [tx, ty] = b.cible3;
    if (u < 1.3) { b.etat = 'vol'; const d = Math.hypot(tx - b.x, ty - b.y); if (d > .05) { const s = Math.min(7 * dt, d); b.x += (tx - b.x) / d * s; b.y += (ty - b.y) / d * s; } b.z = Z0 + b.alt; viser(4); return; }
    if (u < 1.6) { b.etat = 'plongee'; b.alt = Math.max(0, 4.5 * (1 - (u - 1.3) / .3)); b.x = tx; b.y = ty; b.z = Math.max(sol(tx, ty), Z0) + b.alt; return; }
    if (!b.fait) { b.fait = true; b.alt = 0; SON.jouer('impact', {}, tx, ty, Z0); SON.jouer('explosion', { vol: .7 }, tx, ty, Z0);
      P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .9);
      for (const Q of J) { const dx = Q.x - tx, dy = Q.y - ty, d = Math.hypot(dx, dy) || 1; if (d < 2.5) coupBrume(b, Q, .22, [dx / d * 8, dy / d * 8, 4]); }
      anneauBraise(tx, ty, 2.5); }
    if (u < 4) { b.etat = 'etourdi'; b.z = Math.max(sol(b.x, b.y), Z0); if (Math.random() < dt * 20) parts.push({ x: b.x + (Math.random() - .5) * .6, y: b.y + (Math.random() - .5) * .6, z: b.z + 1.55 * sz, vx: 0, vy: 0, vz: .8, g: -.2, life: .6, age: 0, col: '#ffe090', luit: 1, tl: .07 }); return; }
    b.etat = 'reprendre'; b.alt = Math.min(4.5, (u - 4) * 5); b.z = Z0 + b.alt;
    if (u > 4.9) { b.act = null; b.cible3 = null; b.plongeT = t + 3.5 + Math.random() * 2; }
    return;
  }
  if (b.act === 'pluie') {                                     // trois boules de feu, de là-haut
    b.etat = 'pluie'; b.z = Z0 + b.alt; viser(5);
    for (let k = 0; k < 3; k++) if (u > .4 + k * .3 && !(b.tirs || [])[k]) { (b.tirs || (b.tirs = []))[k] = 1;
      const Q = J.length ? J[k % J.length] : P, ox = b.x + Math.cos(b.dir) * .8, oy = b.y + Math.sin(b.dir) * .8, oz = b.z + 1.2 * sz, cx = Q.x + (Q.vx || 0) * .5, cy = Q.y + (Q.vy || 0) * .5, cz = Q.z + .8;
      const d = Math.hypot(cx - ox, cy - oy) || 1, vol = Math.max(.5, d / 10);
      TIRS.push({ x: ox, y: oy, z: oz, vx: (cx - ox) / vol, vy: (cy - oy) / vol, vz: (cz - oz) / vol + TIR_G * vol * .5, de: b, deg: .1, age: 0, c: [255, 110, 40], feu: true });
      SON.jouer('cracheFeu', { vol: .6 }, ox, oy, oz); }
    if (u > 1.5) { b.act = null; b.tirs = null; b.pluieT = t + 6 + Math.random() * 2; }
    return;
  }
  b.act = null;
}
function anneauBraise(x, y, R) { for (let k = 0; k < 40; k++) { const a = k / 40 * 6.2832; parts.push({ x: x + Math.cos(a) * .5, y: y + Math.sin(a) * .5, z: DJ_Z0 + .2, vx: Math.cos(a) * R * 2.5, vy: Math.sin(a) * R * 2.5, vz: .3, g: 0, life: .4, age: 0, col: k & 1 ? '#ffb040' : '#ff5a18', luit: 1, tl: .1 }); } }
// Ce que le Roi encaisse (roiDegK, roi.js) : rien quand il se lève ou s'envole, rien dans les airs ; étourdi, la
// couronne embrasée prend le coup double.
let roiDit = -99;
function roiK(b) {
  if (b.dead) return 1;
  if (b.act === 'lever' || b.act === 'envol' || (b.phase === 3 && b.etat !== 'etourdi')) { if (t - roiDit > 6) { roiDit = t; say('hors d\'atteinte', 1); } return 0; }
  if (b.etat === 'etourdi') { if (t - (ROI.couronneDit || -99) > 60) { ROI.couronneDit = t; say('la couronne embrasée · son point faible', 2.2); } burst(b.x, b.y, b.z + 1.5 * (b.sp.sz || 1), 6, '#ffe090'); return 2.2; }
  return 1;
}

// Le Roi démon : trois mètres et demi de chair rouge sous une armure noire filetée d'or ; des épaulières hérissées,
// une ceinture à boucle de crâne, des chaînes autour de l'avant-bras gauche ; une cape cramoisie ; deux cornes qui
// partent en arrière ; la couronne : sept pointes d'obsidienne et des pierres de braise, qui s'embrase quand il
// vole, et plus encore quand il est étourdi ; l'épée de flammes dans la main droite ; deux grandes ailes repliées
// dans le dos, qu'il ouvre pour voler. Assis, il tient l'épée plantée devant lui.
function osRoi(f, O) {
  const { add, os2 } = O;
  if (f._e !== f.etat) { f._e = f.etat; f._eT = t; }
  const E = f.etat, u = t - (f._eT || 0), mort = f.dead > 0 ? Math.min(1, f.dead) : 0, AV = [1, 0, 0];
  const peau = [134, 28, 24], peau2 = [96, 18, 18], noir = [28, 24, 30], noir2 = [46, 40, 48], or = [214, 170, 70], corne = [44, 34, 32], cape = [96, 10, 20], cape2 = [62, 6, 14];
  const lev = E === 'lever' ? Math.min(1, u / 1.6) : 0;
  const s = E === 'assis' || E === 'balayer' || E === 'colonnes' || E === 'appel' ? 1 : E === 'lever' ? 1 - lev : 0;
  const k = E === 'etourdi' ? Math.min(1, u / .3) : E === 'reprendre' ? Math.max(0, 1 - u / .4) : 0;
  const fl = E === 'vol' || E === 'pluie' || E === 'plongee' ? 1 : E === 'envol' ? Math.min(1, u / .8) : E === 'reprendre' ? Math.min(1, u / .5) : 0;
  const { v, ph } = marcheOs(f, 2.4), course = E === 'courir';
  const zM = -mort * .45, flap = Math.sin(t * (E === 'plongee' ? 1 : 5)) * (1 - k);
  const hipZ = .62 - .12 * s - .22 * k + zM, hipX = -.05 * s - .04 * fl;
  const C = [hipX + .04 + .14 * k + .12 * fl + (course ? .12 : 0), 0, hipZ + .4 - .05 * k], Hd = [C[0] + .05 + .08 * k + (course ? .06 : 0), 0, C[2] + .22 - .05 * k];
  const lerp = (a, b, f) => a.map((x, i) => x + (b[i] - x) * f);
  // les jambes
  for (const sd of [-1, 1]) {
    const p = ph + (sd > 0 ? 0 : Math.PI), vv = course ? 1.6 : v;
    let kn = [.06 + Math.sin(p) * .16 * vv, sd * .15, .34 + Math.max(0, Math.cos(p)) * .06 * vv], ft = [Math.sin(p) * .26 * vv, sd * .15, .02 + Math.max(0, -Math.cos(p)) * .08 * vv];
    kn = lerp(kn, [.3, sd * .16, .52], s); ft = lerp(ft, [.36, sd * .17, .02], s);
    kn = lerp(kn, sd > 0 ? [.26, .16, .06] : [.32, -.16, .38], k); ft = lerp(ft, sd > 0 ? [-.16, .16, .03] : [.32, -.16, .02], k);
    kn = lerp(kn, [-.04, sd * .15, .3 + .05 * flap], fl); ft = lerp(ft, [-.26, sd * .15, .08 + .05 * flap], fl);
    kn[2] += zM; ft[2] += zM;
    const hp = [hipX, sd * .15, hipZ];
    os2(hp, kn, .18, peau); os2(kn, ft, .15, noir);                                              // la cuisse, la grève
    add([kn[0] + .04, sd * .15, kn[2] - .02], [kn[0] + .1, sd * .15, kn[2] + .06], .12, .1, noir2);   // la genouillère
    add(ft, [ft[0] + .16, ft[1], ft[2] - .01], .15, .08, noir); add([ft[0] + .15, ft[1], ft[2]], [ft[0] + .22, ft[1], ft[2] - .03], .05, .05, corne);   // le pied griffu
  }
  // le corps : la ceinture, le torse, le plastron noir fileté d'or
  add([hipX, 0, hipZ - .06], [hipX + .02, 0, hipZ + .08], .5, .36, noir2);
  add([hipX + .19, 0, hipZ - .03], [hipX + .21, 0, hipZ + .07], .12, .1, [214, 204, 180]);      // la boucle, un crâne
  add([hipX + .02, 0, hipZ + .06], C, .44, .34, peau);
  add([C[0] - .02, 0, C[2] - .26], [C[0] + .06, 0, C[2] + .04], .42, .14, noir);
  for (const z2 of [-.25, .03]) add([C[0] + .05, 0, C[2] + z2], [C[0] + .06, 0, C[2] + z2 + .02], .43, .03, or);
  add([C[0] + .055, 0, C[2] - .2], [C[0] + .065, 0, C[2] - .02], .04, .02, or);
  // la cape, derrière
  const sw = Math.sin(t * 1.4) * .04, C0 = [C[0] - .16, 0, C[2] + .04], C1 = [C0[0] - .1 - .25 * fl, sw, hipZ - .05 + .1 * fl], C2 = [C1[0] - .06 - .35 * fl, sw * 2, Math.max(.04, hipZ - .5 + .4 * fl)];
  add(C0, C1, .6, .04, cape, false, AV); add(C1, C2, .66, .04, cape2, false, AV);
  // les ailes : repliées, ou ouvertes en vol
  for (const sd of [-1, 1]) {
    const W0 = [C[0] - .14, sd * .16, C[2] - .02];
    const W1 = lerp([W0[0] - .16, sd * .26, W0[2] + .42], [W0[0] - .22, sd * .9, W0[2] + .35 + .3 * flap], fl);
    const W2 = lerp([W0[0] - .22, sd * .32, W0[2] - .5], [W0[0] - .32, sd * 1.85, W0[2] + .12 + .5 * flap], fl);
    os2(W0, W1, .08, peau2); os2(W1, W2, .06, peau2);
    os2(W1, [W1[0] + .04, W1[1] + sd * .03, W1[2] + .12], .05, corne);                          // l'ergot
    for (let j = 1; j <= 3; j++) { const D = lerp([W0[0] - .2, sd * (.26 + j * .02), W0[2] - .3 + j * .1], [W0[0] - .3 - j * .05, sd * (.9 + j * .25), W0[2] - .25 - j * .05 + .2 * flap], fl);
      os2(W1, D, .03, peau2); add(mi3(W0, W1), mi3(W1, D), .04, .2 + .3 * fl, [80, 12, 18], false, AV); }
    add(mi3(W1, W2), mi3(W0, W2), .04, .25 + .35 * fl, [70, 10, 16], false, AV);
  }
  // les épaules, les bras
  const Sd = [C[0], -.3, C[2] + .05], Sg = [C[0], .3, C[2] + .05];
  for (const S of [Sd, Sg]) { const sd = Math.sign(S[1]); add([S[0] - .1, S[1], S[2]], [S[0] + .1, S[1], S[2] + .04], .24, .2, noir);
    os2([S[0], S[1], S[2] + .08], [S[0] - .04, S[1] + sd * .06, S[2] + .24], .05, noir2); os2([S[0] + .06, S[1], S[2] + .06], [S[0] + .08, S[1] + sd * .1, S[2] + .2], .04, noir2); }
  // le bras gauche : l'accoudoir, l'appel (le feu dans la paume), la chaîne qu'il lance
  let Mg = [Sg[0] + .14, .36, Sg[2] - .4];
  if (s > .5) Mg = [C[0] - .02, .38, hipZ + .06];
  if (E === 'appel') Mg = [Sg[0] + .22, .42, Sg[2] + .45];
  if (E === 'viser') Mg = [Sg[0] - .25, .4, Sg[2] + .1]; else if (E === 'lancer') Mg = [Sg[0] + .55, .28, Sg[2]];
  if (k) Mg = lerp(Mg, [C[0] + .3, .3, .1], k); if (fl) Mg = lerp(Mg, [Sg[0] + .25, .45, Sg[2] - .2], fl);
  const Eg = [(Sg[0] + Mg[0]) / 2 - .06, .4, (Sg[2] + Mg[2]) / 2 - .04];
  os2(Sg, Eg, .13, peau); os2(Eg, Mg, .12, peau);
  for (let j = 0; j < 4; j++) { const q = lerp(Eg, Mg, .15 + j * .22); add([q[0] - .03, q[1], q[2]], [q[0] + .03, q[1], q[2]], j & 1 ? .15 : .06, j & 1 ? .06 : .15, [104, 98, 96]); }   // les chaînes
  add(Mg, [Mg[0] + .08, Mg[1], Mg[2] - .03], .12, .1, noir);
  if (E === 'appel') add([Mg[0] + .02, Mg[1], Mg[2] + .08], [Mg[0] + .02, Mg[1], Mg[2] + .22], .16, .16, [255, 140, 40], true);
  // le bras droit et l'épée de flammes
  let Md, dir;
  const armer = E === 'lever_epee' ? Math.min(1, u / .7) : E === 'balayer' && u < .6 ? Math.min(1, u / .6) : 0;
  const coup = E === 'epee' || (E === 'balayer' && u >= .6) ? Math.min(1, (E === 'epee' ? u : u - .6) / .3) : -1;
  if (coup >= 0) { const th = (-110 + coup * 170) * Math.PI / 180, r = .52; Md = [Sd[0] + Math.cos(th) * r * .7 + .2, -.3 + Math.sin(th) * r, Sd[2] - .12]; dir = [Math.cos(th), Math.sin(th), -.15]; }
  else if (armer) { Md = lerp([Sd[0] + .18, -.32, Sd[2] - .38], [Sd[0] - .12, -.4, Sd[2] + .38], armer); dir = lerp([.3, 0, -.95], [-.5, -.3, .8], armer); }
  else if (E === 'colonnes') { Md = [Sd[0] + .08, -.24, Sd[2] + .52]; dir = [.1, 0, 1]; }
  else if (s > .5) { Md = [.38, -.22, .62 - .12 * (1 - s)]; dir = [.06, 0, -1]; }
  else { Md = [Sd[0] + .2, -.34, Sd[2] - .36]; dir = [.4, -.05, -.9]; }
  if (k) { Md = lerp(Md, [C[0] + .3, -.3, .12], k); dir = lerp(dir, [.3, 0, -.95], k); }
  if (fl && coup < 0) { Md = lerp(Md, [Sd[0] + .3, -.38, Sd[2] - .2], fl); dir = lerp(dir, [.8, -.1, -.55], fl); }
  const nd = Math.hypot(...dir) || 1; dir = dir.map(x => x / nd);
  const Ed = [(Sd[0] + Md[0]) / 2 - .05, -.42, (Sd[2] + Md[2]) / 2 - .04];
  os2(Sd, Ed, .13, peau); os2(Ed, Md, .12, peau); add(Md, [Md[0] + .06, Md[1], Md[2]], .13, .12, noir);
  const at = l => [Md[0] + dir[0] * l, Md[1] + dir[1] * l, Md[2] + dir[2] * l], pf = .8 + .2 * Math.sin(t * 17);
  if (!mort) {
    os2(at(-.16), at(.06), .05, noir); os2(at(-.17), at(-.15), .07, or);                           // la poignée, le pommeau
    add(at(.06), at(.09), .3, .06, noir2); for (const d2 of [-1, 1]) os2([at(.07)[0], at(.07)[1] + d2 * .14, at(.07)[2]], [at(.12)[0], at(.12)[1] + d2 * .2, at(.12)[2] + .05], .035, or);   // la garde en cornes
    os2(at(.09), at(1.02), .09 * pf, [255, 120, 40], true); os2(at(.1), at(.98), .045, [255, 236, 160], true);   // la lame, et sa flamme
    os2(at(.98), at(1.12), .04 * pf, [255, 200, 90], true);
  }
  // la tête : la mâchoire, les crocs, les yeux, l'arcade ; les cornes ; la couronne
  const cri = (E === 'lever' && u > .8 && u < 1.6) || (E === 'envol' && u < 1) || E === 'appel' ? 1 : 0;
  add([C[0] + .02, 0, C[2] + .06], [Hd[0] - .02, 0, Hd[2] - .06], .16, .16, peau2);                // le cou
  add([Hd[0] - .1, 0, Hd[2] - .06], [Hd[0] + .1, 0, Hd[2] + .08], .26, .25, peau);
  add([Hd[0] + .06, 0, Hd[2] - .1 - cri * .06], [Hd[0] + .14, 0, Hd[2] - .14 - cri * .08], .2, .06, peau2);   // la mâchoire
  for (const sd of [-1, 1]) add([Hd[0] + .13, sd * .05, Hd[2] - .1], [Hd[0] + .135, sd * .05, Hd[2] - .14], .03, .03, [236, 226, 206]);
  add([Hd[0] + .09, 0, Hd[2] + .05], [Hd[0] + .12, 0, Hd[2] + .07], .26, .05, peau2);              // l'arcade
  for (const sd of [-1, 1]) add([Hd[0] + .1, sd * .055, Hd[2] + .02], [Hd[0] + .115, sd * .055, Hd[2] + .02], .05, .035, [255, 210, 80], true);
  for (const sd of [-1, 1]) { const A = [Hd[0] - .02, sd * .1, Hd[2] + .07], B = [A[0] - .08, sd * .2, A[2] + .2], Cc = [B[0] - .13, sd * .25, B[2] + .08], D = [Cc[0] - .1, sd * .2, Cc[2] - .05];
    os2(A, B, .075, corne); os2(B, Cc, .055, corne); os2(Cc, D, .035, [70, 60, 56]); }
  const lueur = E === 'etourdi' ? 1 : fl ? .5 : 0, gemme = lueur ? [255, 200 + 40 * lueur | 0, 120 + 60 * lueur | 0] : [255, 60, 40];
  const Cr = [Hd[0] - .01, 0, Hd[2] + .13];
  add([Cr[0], 0, Cr[2] - .02], [Cr[0], 0, Cr[2] + .03], .27, .27, lueur ? [255, 170, 80] : or, !!lueur);   // le cercle de la couronne
  for (let j = 0; j < 7; j++) { const a = j / 7 * 6.2832, c = Math.cos(a), sn = Math.sin(a), h = j === 0 ? .2 : .13 + (j & 1) * .03;
    os2([Cr[0] + c * .11, sn * .11, Cr[2] + .02], [Cr[0] + c * .13, sn * .13, Cr[2] + h], .045, lueur > .6 ? [90, 40, 30] : [34, 26, 40]);
    if (!(j & 1)) add([Cr[0] + c * .135, sn * .135, Cr[2] + .03], [Cr[0] + c * .14, sn * .14, Cr[2] + .03], .045 + .03 * lueur, .045 + .03 * lueur, gemme, true); }
}
// Ce qui bouge dans la salle du Trône, ajouté à roiDecor : les colonnes de feu (et leurs cercles), les piliers
// (leur base, leur chapiteau, leur chute, leurs tambours couchés), le sol qui rougeoie avant de céder, la chaîne et
// la charge du Roi, l'ombre de sa plongée, les cages, la couronne tombée.
function decorTrone(os, pres) {
  const Z0 = DJ_Z0, plaf = Z0 + DJ_MUR, T = ROI.trone; if (!T) return;
  for (const c of ROI.colonnes) if (pres(c.x, c.y)) {
    const u = t - c.t0;
    if (c.etat === 'alerte') { const f = .5 + .5 * Math.sin(t * (12 + u * 16)), r = 1.3, n = 20;
      for (let j = 0; j < n; j++) { const a0 = j / n * 6.2832, a1 = (j + .7) / n * 6.2832; os([c.x + Math.cos(a0) * r, c.y + Math.sin(a0) * r, Z0 + .03], [c.x + Math.cos(a1) * r, c.y + Math.sin(a1) * r, Z0 + .03], .14, .03, [255, 60 + 80 * f | 0, 30], 1); }
      const k = Math.min(1, u / 1.4); os([c.x, c.y, Z0 + .02], [c.x, c.y, Z0 + .03], 2 * r * k, 2 * r * k, [120 + 100 * f | 0, 30, 20], 1); }
    else { const k = Math.sin(Math.min(1, u) * Math.PI), h = 5.5 * Math.min(1, u * 5);
      os([c.x, c.y, Z0], [c.x, c.y, Z0 + h], 1.6 * (.6 + .4 * k), 1.6 * (.6 + .4 * k), [255, 110, 30], 1); os([c.x, c.y, Z0], [c.x, c.y, Z0 + h * .9], .8, .8, [255, 230, 140], 1); }
  }
  for (const p of ROI.piliers) if (pres(p.x, p.y)) {
    const sh = p.etat === 'tremble' ? Math.sin(t * 50) * .04 : 0;
    if (p.etat === 'debout' || p.etat === 'tremble') {
      if (p.etat === 'tremble') for (let j = 0; j < 3; j++) os([p.x - 1.01, p.y - .6 + j * .5, Z0 + .6 + j * .9], [p.x - 1.01, p.y - .2 + j * .4, Z0 + 1.2 + j * .8], .03, .06, [255, 90, 30], 1);   // il se fend
    } else if (p.etat === 'chute') {                          // il bascule
      const k = Math.min(1, (t - p.t) / .6), ang = k * k * 1.5708, ca = Math.cos(p.a), sa = Math.sin(p.a), Hh = DJ_MUR;
      const top = [p.x + ca * Math.sin(ang) * Hh, p.y + sa * Math.sin(ang) * Hh, Z0 + Math.cos(ang) * Hh];
      os([p.x, p.y, Z0], top, 2, 2, [80, 70, 76]);
    } else if (p.etat === 'tombe') {                          // les tambours couchés, en travers
      const ca = Math.cos(p.a), sa = Math.sin(p.a);
      for (let j = 0; j < 3; j++) { const s0 = .4 + j * 1.9, s1 = s0 + 1.6, o = (j - 1) * .12;
        os([p.x + ca * s0 - sa * o, p.y + sa * s0 + ca * o, Z0 + 1], [p.x + ca * s1 - sa * o, p.y + sa * s1 + ca * o, Z0 + 1], 1.8, 1.7, j & 1 ? [76, 66, 72] : [86, 76, 82]); }
    }
  }
  const F = ROI.effondre;                                        // le sol qui rougeoie avant de céder
  if (F && F.k < F.cases.length) { const f = .5 + .5 * Math.sin(t * 14);
    for (let j = F.k; j < Math.min(F.cases.length, F.k + 220); j += 2) { const i = F.cases[j], x = i % WS, y = i / WS | 0; if (!pres(x, y)) continue;
      os([x + .15, y + .3 + (j % 5) * .1, Z0 + .012], [x + .85, y + .7 - (j % 3) * .1, Z0 + .012], .05, .02, [255, 70 + 100 * f | 0, 30], 1); } }
  for (const b of beasts) if (b.sp.corps === 'roi' && pres(b.x, b.y)) {
    if (b.trait && (b.etat === 'viser' || b.etat === 'armer')) { const T2 = b.trait, dx = T2[2] - T2[0], dy = T2[3] - T2[1], L = Math.hypot(dx, dy) || 1, k = .5 + .5 * Math.sin(t * 20);
      for (let s = 0; s < L; s += .5) os([T2[0] + dx / L * s, T2[1] + dy / L * s, Z0 + .03], [T2[0] + dx / L * Math.min(L, s + .35), T2[1] + dy / L * Math.min(L, s + .35), Z0 + .03], b.etat === 'armer' ? .5 : .18, .02, [255 * k | 0, 30, 20], 1); }
    if (b.etat === 'lancer') { const u = t - b.actT - .7, ca = Math.cos(b.dir), sa = Math.sin(b.dir), tip = b.prise ? Math.hypot(b.prise.x - b.x, b.prise.y - b.y) : Math.min(12, u / .25 * 12), z = b.z + 1.8;
      for (let s = .8; s < tip; s += .3) os([b.x + ca * s, b.y + sa * s, z], [b.x + ca * Math.min(tip, s + .26), b.y + sa * Math.min(tip, s + .26), z], (s * 3.3 | 0) % 2 ? .06 : .14, (s * 3.3 | 0) % 2 ? .14 : .06, [110, 100, 96]); }
    if (b.act === 'plongee' && b.cible3 && t - b.actT < 1.6) { const k = Math.min(1, (t - b.actT) / 1.3), r = .6 + 1.9 * k, [x, y] = b.cible3;   // l'ombre de la plongée
      os([x - r, y, Z0 + .02], [x + r, y, Z0 + .02], r * 1.15, .012, [20, 12, 14]); os([x, y - r, Z0 + .021], [x, y + r, Z0 + .021], r * 1.15, .012, [20, 12, 14]);
      for (const s of [-1, 1]) os([x - r * .7, y - s * r * .7, Z0 + .022], [x + r * .7, y + s * r * .7, Z0 + .022], r, .012, [20, 12, 14]); }
  }
  if (T.couronne && pres(...T.couronne)) { const [x, y] = T.couronne, z = Math.max(sol(x, y), DJ_Z0);   // la couronne a roulé à terre
      os([x, y, z + .02], [x, y, z + .14], .62, .62, [214, 170, 70]); for (let j = 0; j < 7; j++) { const a = j / 7 * 6.2832; os([x + Math.cos(a) * .27, y + Math.sin(a) * .27, z + .1], [x + Math.cos(a) * .3, y + Math.sin(a) * .3, z + .42], .1, .1, [34, 26, 40]); }
      os([x + .3, y, z + .12], [x + .31, y, z + .12], .1, .1, [255, 80, 50], 1); }
  for (const ch of ROI.chaines) if (ch.cage && pres(ch.x, ch.y)) {   // la cage au bout de la chaîne, un squelette dedans
    const sw = Math.sin(t * 1.3 + ch.ph) * .18, sw2 = Math.cos(t * 1.1 + ch.ph) * .12, x = ch.x + sw, y = ch.y + sw2, z = plaf - ch.L, H = 1.1;
    for (const [dx, dy] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4], [0, -.4], [0, .4], [-.4, 0], [.4, 0]]) os([x + dx, y + dy, z - H], [x + dx, y + dy, z], .04, .04, [70, 64, 66]);
    os([x, y, z], [x, y, z + .06], .9, .9, [60, 54, 58]); os([x, y, z - H - .06], [x, y, z - H], .9, .9, [60, 54, 58]);
    os([x - .1, y, z - H + .1], [x - .05, y, z - .35], .14, .1, [206, 196, 172]); os([x - .05, y, z - .3], [x - .02, y, z - .12], .16, .15, [206, 196, 172]);
  }
}

// Le butin des bêtes d'en bas (roiButin, roi.js)
function roiButinBas(b) {
  const k = b.sp.corps;
  if (k === 'sorciere') { P.sac.eclat += 2; const ing = Math.random() < .3 ? roiDonnerIngr('fleursoufre', 1) : '';
    for (let j = 0; j < 30; j++) { const a = Math.random() * 6.28, v = Math.random() * 1.5; parts.push({ x: b.x, y: b.y, z: b.z + .3 + Math.random() * 1.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: .4, g: -.1, life: 1.4, age: 0, col: Math.random() < .5 ? '#d8d060' : '#a8a050', tl: .14 }); }
    say('la sorcière se défait en fumée jaune · +2 éclats' + (ing ? ' · ' + ing : ''), 1.8); majSac(); return; }
  if (k === 'jardinier') {
    P.sac.eclat += 40; P.sac.os = (P.sac.os || 0) + 14; const ing = roiDonnerIngr('fleursoufre', 3);
    ROI.tenu = null; ROI.etreinte = null; for (const L of ROI.lianes) L.etat = 'repos';
    say('Le Jardinier se fane · +40 éclats · +14 os' + (ing ? ' · ' + ing : '') + ' · sa clé d\'os ouvre le coffre scellé, son coffre se descelle', 5.5);
    SON.jouer('niveau', {}, b.x, b.y, b.z); majSac(); return;
  }
  if (k === 'roi') {
    const T = ROI.trone, L = ['+80 éclats', '+24 os'];
    P.sac.eclat += 80; P.sac.os = (P.sac.os || 0) + 24; const s2 = roiDonnerIngr('sangroi', 2); if (s2) L.push(s2);
    if (!P.objets.cu_roi) { P.objets.cu_roi = 1; L.push('LA COURONNE DU ROI DÉMON'); }
    say('Le Roi démon s\'effondre · ' + L.join(' · ') + ' · à remonter pour le garder', 7);
    SON.jouer('niveau', {}, b.x, b.y, b.z); SON.jouer('rare', {}, b.x, b.y, b.z + 1);
    if (T) { T.fini = true; T.couronne = [b.x + 1.2, b.y + .6]; }
    const F = ROI.effondre;                                    // la lave se refige, le sol revient
    if (F) { ROI.retour = { t0: t, cases: F.cases.slice(0, F.k), k: 0 }; ROI.effondre = null; }
    ROI.colonnes.length = 0;
    for (const o of beasts) if (o.sp.corps === 'diablotin' && !o.dead) { o.etat = 'enfouir'; o.etT = t; o.act = null; }
    for (let j = 0; j < 60; j++) { const a = Math.random() * 6.28, v = 1 + Math.random() * 4; parts.push({ x: b.x, y: b.y, z: b.z + 1, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 1 + Math.random() * 4, g: 3, life: 1.2, age: 0, col: j % 3 ? '#ff5a18' : '#ffd060', luit: 1, tl: .12 }); }
    majSac();
  }
}
// Le reliquaire : une châsse noire cerclée d'or au toit en pointe, sur son socle ; scellé, deux liens de braise
// en croix et une pierre rouge qui bat ; ouvert, le toit rabattu et une lueur d'or.
function decorReliquaire(os, c) {
  const fait = c.ouvert || (DJ.etat.defis || []).includes(DJ.e), or = [214, 170, 70], noir = [28, 22, 30], z = c.z, pul = .7 + .3 * Math.sin(t * 3);
  os([c.x - .52, c.y, z + .02], [c.x + .52, c.y, z + .02], .64, .08, or);
  os([c.x - .46, c.y, z + .3], [c.x + .46, c.y, z + .3], .52, .5, noir);
  for (const s of [-1, 1]) os([c.x + s * .46, c.y, z + .05], [c.x + s * .46, c.y, z + .56], .07, .58, or);
  os([c.x - .47, c.y, z + .3], [c.x + .47, c.y, z + .3], .54, .05, or);
  if (c.ouvert) { os([c.x - .48, c.y - .3, z + .58], [c.x + .48, c.y - .36, z + 1.02], .08, .52, noir); os([c.x, c.y, z + .56], [c.x, c.y, z + .58], .7, .36, [255, 236, 170], 1); }
  else {
    os([c.x - .49, c.y, z + .62], [c.x + .49, c.y, z + .62], .6, .1, or); os([c.x - .4, c.y, z + .74], [c.x + .4, c.y, z + .74], .42, .14, noir);
    os([c.x - .3, c.y, z + .86], [c.x + .3, c.y, z + .86], .22, .1, or); os([c.x, c.y, z + .9], [c.x, c.y, z + 1.08], .07, .07, or);
    if (!fait) for (const s of [-1, 1]) os([c.x - .48, c.y + .27, z + .1 + (s > 0 ? 0 : .45)], [c.x + .48, c.y + .27, z + .1 + (s > 0 ? .45 : 0)], .05, .05, [255, 80, 40], 1);
  }
  os([c.x, c.y + .27, z + .35], [c.x, c.y + .29, z + .35], .14, .14, fait ? [255, 230, 140] : [210 * pul | 0, 40, 60], 1);
}
// Les trois sceaux de la salle de défi : éteints, rougeoyants pendant l'épreuve, éclatants quand une vague en sort.
function decorReliques(os, pres) {
  const Z0 = DJ_Z0;
  for (const R of ROI.reliques || []) for (const [x, y] of R.sig) if (pres(x, y)) {
    const vif = R.etat === 'eveil' || R.etat === 'vague' || R.etat === 'pause', fl = Math.max(0, 1 - (t - R.flash)), f = .6 + .4 * Math.sin(t * 4 + x);
    const col = R.etat === 'fait' ? [70, 64, 66] : vif ? [255, 80 + 150 * fl | 0, 40 + 120 * fl | 0] : [110, 34, 28];
    for (let j = 0; j < 12; j++) { const a0 = j / 12 * 6.2832, a1 = (j + .75) / 12 * 6.2832; os([x + Math.cos(a0) * .9, y + Math.sin(a0) * .9, Z0 + .02], [x + Math.cos(a1) * .9, y + Math.sin(a1) * .9, Z0 + .02], .08, .02, col, vif); }
    for (let j = 0; j < 3; j++) { const a = j / 3 * 6.2832 + (vif ? t * .8 : 0), b2 = (j + 1) / 3 * 6.2832 + (vif ? t * .8 : 0); os([x + Math.cos(a) * .7, y + Math.sin(a) * .7, Z0 + .022], [x + Math.cos(b2) * .7, y + Math.sin(b2) * .7, Z0 + .022], .06, .02, col, vif); }
    if (vif) os([x, y, Z0 + .02], [x, y, Z0 + .05 + .6 * fl], .3 * f + .4 * fl, .3 * f + .4 * fl, col, 1);
  }
}
