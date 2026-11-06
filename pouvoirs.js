// Stone Valley — LES POUVOIRS DES ÉLÉMENTS (pouvoirs.js, §238)
// Chaque lignée d'Orvane porte un élément (orvane-sv.js, fantaisie : braise, givre, cristal, sylve, abysse, orage, ombre,
// aurore). Il lui donne deux choses :
//  - SA MORSURE : chaque coup porte l'élément — la braise brûle, le givre gèle (on ralentit), le cristal tranche (plus de
//    dégâts), la sylve empoisonne, l'abysse repousse loin, l'orage électrise (un instant cloué), l'ombre draine (elle reprend
//    de la vie), l'aurore soigne les siens. Plus la créature est puissante, plus ça dure ;
//  - SON POUVOIR, dès le rang 0,5 : une attaque de l'élément, qu'elle lance quand elle se bat contre vous (elle vous traque,
//    elle est en colère, acculée, ou elle vous défend contre une bête si c'est une compagne). Il s'ANNONCE toujours : elle
//    s'arrête, l'élément tourbillonne autour d'elle une seconde (de quoi s'écarter), puis :
//      la braise crache une boule de feu, le givre souffle un cône de gel devant elle, le cristal tire une volée de trois
//      éclats, la sylve lance des ronces qui clouent sur place, l'abysse une trombe qui projette au loin, l'orage appelle la
//      foudre là où vous êtes (le cercle au sol vous prévient), l'ombre disparaît et reparaît dans votre dos pour mordre,
//      l'aurore soigne tout son troupeau d'un éclat de lumière qui vous éblouit.
//    Il revient toutes les dix à seize secondes, plus vite chez les plus puissantes. Frappée pendant qu'elle se concentre,
//    elle est interrompue.
// Une compagne garde le sien : elle le lance sur la bête qu'elle combat, ou sur ce qui vous attaque.
//
//   pouvoirBete(b, dt, J, dJ)   à chaque image, avant les conduites (majBete) : l'annonce, puis le pouvoir
//   pouvoirCoup(b, c, ux, uy)   une morsure qui porte (porterCoup) : l'effet de l'élément
//   pouvoirImpact(f)            un projectile de pouvoir éclate (orvaneImpact, conduites.js)
//   pouvoirsMaj(dt)             à chaque image : le givre sur le joueur, la foudre qui tombe, les braises sur les bêtes
//   pouvoirStatuts(add)         les états du joueur, au tableau de bord
//   pouvoirDit(o)               ce que la fiche de la cible en dit
'use strict';
const POUVOIRS = {
  braise:  { n: 'Souffle de braise', mord: 'brûle', portee: 8, annonce: .9, son: 'cracheFeu', c: [255, 140, 50] },
  givre:   { n: 'Souffle de givre', mord: 'gèle', portee: 5.5, annonce: .9, son: 'vapeur', c: [190, 240, 255] },
  cristal: { n: 'Volée d\'éclats', mord: 'tranche', portee: 8, annonce: .8, son: 'volee', c: [236, 170, 255] },
  sylve:   { n: 'Ronces', mord: 'empoisonne', portee: 7.5, annonce: .9, son: 'crachat', c: [150, 230, 90] },
  abysse:  { n: 'Trombe', mord: 'repousse', portee: 7.5, annonce: .9, son: 'plouf', c: [90, 240, 230] },
  orage:   { n: 'Foudre', mord: 'électrise', portee: 10, annonce: 1.1, son: 'tonnerre', c: [255, 244, 140] },
  ombre:   { n: 'Pas de l\'ombre', mord: 'draine', portee: 9, annonce: .7, son: 'murmure', c: [170, 120, 255] },
  aurore:  { n: 'Lumière d\'aurore', mord: 'soigne les siens', portee: 6, annonce: 1, son: 'sort', c: [255, 220, 130] },
};
const PV = { foudres: [], vus: new Set(), pret: false };
const pvEl = b => b && b.sp && b.sp.orvane && !b.sp.orvane.machine ? b.sp.orvane.el : null;
const pvPu = b => (b && b.sp && b.sp.orvane && Number.isFinite(b.sp.orvane.puissance)) ? b.sp.orvane.puissance : .5;
const pvCol = (c, a = 1) => 'rgb(' + c.map(v => Math.round(v * a)).join(',') + ')';
const pvSon = (k, x, y, z, o) => { try { SON.jouer(k, o || {}, x, y, z); } catch (e) { } };
function pvInit() { if (PV.pret) return; PV.pret = true; try { if (typeof DITS_ETAT !== 'undefined') DITS_ETAT.pouvoir = 'concentre son élément'; } catch (e) { } }
function pvPart(x, y, z, n, c, o = {}) {
  if (typeof parts === 'undefined' || parts.length > 1600) return;
  for (let k = 0; k < n; k++) parts.push({ x: x + (Math.random() - .5) * (o.r || .3), y: y + (Math.random() - .5) * (o.r || .3), z: z + Math.random() * (o.h || .2),
    vx: (Math.random() - .5) * (o.v ?? 1.6) + (o.vx || 0), vy: (Math.random() - .5) * (o.v ?? 1.6) + (o.vy || 0), vz: (o.vz ?? .8) * Math.random(),
    g: o.g ?? -.05, life: (o.vie || .8) * (.6 + Math.random() * .7), age: 0, col: Array.isArray(c) ? pvCol(c) : c, luit: 1, tl: o.tl || .07 });
}
// la première fois qu'on voit le pouvoir d'une lignée : une ligne le dit
function pvVu(b) { const id = b.sp.id; if (PV.vus.has(id) || b.tame) return; PV.vus.add(id);
  try { say(b.sp.n + ' · ' + POUVOIRS[pvEl(b)].n.toLowerCase() + ' !', 2.4); } catch (e) { } }

// --- la morsure de l'élément ---
function pouvoirCoup(b, c, ux, uy) {
  const el = pvEl(b); if (!el || b._pvSans) return;
  const pu = pvPu(b), k = .5 + .5 * pu, C = POUVOIRS[el].c;
  if (c === P) {
    if (P.invincible) return;
    if (el === 'braise') { if (!effet('braise')) P.brulure = Math.max(P.brulure || 0, t + 2.5 * k); pvPart(P.x, P.y, P.z + .5, 8, C, { vz: 1.2 }); }
    else if (el === 'givre') { P.gel = Math.max(P.gel || 0, t + 2.5 * k); pvPart(P.x, P.y, P.z + .6, 10, C, { g: .1 }); }
    else if (el === 'cristal') { P.pv = Math.max(0, P.pv - degSubi(.025 * k)); pvPart(P.x, P.y, P.z + .6, 8, C, { v: 2.4 }); if (P.pv <= 0) terrasse(); }
    else if (el === 'sylve') { P.poison = Math.min(t + 10, Math.max(P.poison || 0, t) + 2.5 * k); pvPart(P.x, P.y, P.z + .4, 8, C); }
    else if (el === 'abysse') { P.vx = (P.vx || 0) + ux * 5 * k; P.vy = (P.vy || 0) + uy * 5 * k; P.vz = Math.max(P.vz || 0, 4.6); P.ground = false; pvPart(P.x, P.y, P.z + .3, 12, C, { g: .4, vz: 2 }); }
    else if (el === 'orage') { if (pu > .45) P.englue = Math.max(P.englue || 0, t + .35 + .25 * pu); pvPart(P.x, P.y, P.z + .6, 10, C, { v: 3, vie: .3 }); }
    else if (el === 'ombre') { b.pv = Math.min(1, b.pv + .06 * k); pvPart(P.x, P.y, P.z + .6, 8, C, { vx: (b.x - P.x), vy: (b.y - P.y), v: .4 }); }
    else if (el === 'aurore') pvSoinTroupeau(b, .08 * k, 6);
    return;
  }
  if (!c || !c.sp || c.dead) return;
  if (el === 'braise') c.brulureB = Math.max(c.brulureB || 0, t + 2.5 * k);
  else if (el === 'givre' || el === 'orage') c.etourdi = Math.max(c.etourdi || 0, .5 + .5 * k);
  else if (el === 'cristal') pvBlesse(b, c, .03 * k);
  else if (el === 'sylve') c.brulureB = Math.max(c.brulureB || 0, t + 2 * k);
  else if (el === 'abysse') { c.vx = (c.vx || 0) + ux * 5; c.vy = (c.vy || 0) + uy * 5; }
  else if (el === 'ombre') b.pv = Math.min(1, b.pv + .05 * k);
  else if (el === 'aurore') pvSoinTroupeau(b, .06 * k, 6);
  pvPart(c.x, c.y, c.z + .4 * (c.sp.sz || 1), 6, C);
}
// des dégâts de pouvoir sur une bête (une compagne qui défend, ou une bête prise dans l'élément)
function pvBlesse(de, o, deg) {
  if (!o || o.dead || !(o.pv > 0) || o.sp.boss || o.sp.pnj || o.sp.batiment) return;
  o.pv -= deg / (typeof robuste === 'function' ? robuste(o) : 1); o.hit = .25; o.alarm = 1;
  if (de && !o.tame && de.tame) o.colere = Math.max(o.colere || 0, 6);
  if (o.pv <= 0 && !o.dead) try { mourirBete(o, 'tir'); } catch (e) { }
}
function pvSoinTroupeau(b, k, r) {
  for (const o of beasts) if (!o.dead && o.pv > 0 && o.sp === b.sp && o.tame === b.tame && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < r * r) {
    if (o.pv < 1) pvPart(o.x, o.y, o.z + .5 * (o.sp.sz || 1), 5, [255, 230, 150], { vz: 1, g: -.1 });
    o.pv = Math.min(1, o.pv + k); }
  if (b.tame && P.pv > 0) P.pv = Math.min(1, P.pv + k * .5);    // une compagne d'aurore vous soigne aussi
}

// --- le pouvoir : qui il vise ---
const PV_COMBAT = ['traquer', 'chasser', 'acculé', 'défendre', 'charger', 'furie', 'assaut', 'conflit'];
function pvCible(b, J, dJ, P0) {
  if (b.tame) {                                              // une compagne : la bête qu'elle combat, ou ce qui vous attaque
    const D = b.cibleD;
    if (D && !D.dead && !D.tame && D.pv > 0 && D.sp && (D.x - b.x) ** 2 + (D.y - b.y) ** 2 < P0.portee * P0.portee) return D;
    return beasts.find(o => !o.dead && !o.tame && o.pv > 0 && o.sp && !o.sp.boss && (o.traque || (o.as && o.as.c === P) || o.etat === 'assaut' || o.etat === 'traquer')
      && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < P0.portee * P0.portee && (o.x - P.x) ** 2 + (o.y - P.y) ** 2 < 100) || null;
  }
  if (!J || !(J.pv > 0) || J !== P || dJ > P0.portee || dJ < (pvEl(b) === 'givre' ? 0 : 1.6) || Math.abs((J.z || 0) - b.z) > 3) return null;
  if (P.invincible || (typeof effetDe === 'function' && effetDe(J, 'invisible'))) return null;
  const engage = b.colere > 0 || b.traque || PV_COMBAT.includes(b.etat) || (b.hit > 0) || (b.sp.chasse && b.faim > .45 && dJ < (b.sp.vue || 12) * .5);
  return engage ? J : null;
}
function pouvoirBete(b, dt, J, dJ) {
  const el = pvEl(b); if (!el || b.dead || b.enfoui > 0 || b.as) return null;
  if (b.enVol) { b.pvA = null; return null; }                // en l'air, elle ne lance rien
  pvInit();
  const pu = pvPu(b); if (pu < .5) return null;
  const P0 = POUVOIRS[el], A = b.pvA;
  if (A) {                                                   // l'annonce : l'élément tourbillonne, puis le pouvoir part
    const c = A.cible;
    if (!c || c.dead || !(c.pv > 0)) { b.pvA = null; return null; }
    if (b.hit > .2 && !b.tame) { b.pvA = null; b.pvT = t + 4; pvPart(b.x, b.y, b.z + .4, 10, [200, 200, 200], { vz: .6 }); return null; }   // frappée pendant qu'elle se concentre : interrompue
    const sz = b.sp.sz || 1, an = t * 9;
    pvPart(b.x + Math.cos(an) * .55 * sz, b.y + Math.sin(an) * .55 * sz, b.z + .3 * sz, 2, P0.c, { r: .1, vz: 1.4, g: -.2, vie: .6 });
    if (el === 'orage') pvAnneau(A.x, A.y, 1.2, P0.c);      // le cercle au sol : la foudre tombera là
    if (t >= A.fin) { b.pvA = null; b.pvT = t + (b.tame ? 12 : 10 + Math.random() * 6) * (1.25 - .45 * pu); pvLancer(b, el, c, A); return null; }
    return { etat: 'pouvoir', vit: 0, dirT: Math.atan2(c.y - b.y, c.x - b.x) };
  }
  if (t < (b.pvT || 0)) return null;
  const c = pvCible(b, J, dJ, P0); if (!c) return null;
  if (el === 'aurore' && !b.tame && !beasts.some(o => o.sp === b.sp && !o.dead && o.pv < .7 && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 49) && dJ > 4.5) return null;   // l'aurore : quand les siens saignent, ou qu'on la serre
  b.pvA = { cible: c, fin: t + P0.annonce, x: c.x, y: c.y }; b.alarm = 1;
  pvSon(el === 'orage' ? 'grondement' : 'vapeur', b.x, b.y, b.z + .5, { court: 1 });
  if (!b.tame) pvVu(b);
  return { etat: 'pouvoir', vit: 0, dirT: Math.atan2(c.y - b.y, c.x - b.x) };
}
function pvAnneau(x, y, r, c) {
  if (typeof parts === 'undefined' || Math.random() > .5) return;
  const z = (typeof sol === 'function' ? sol(x, y) : 0) + .06;
  for (let k = 0; k < 3; k++) { const a = Math.random() * 6.2832; parts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z, vx: 0, vy: 0, vz: .2, g: 0, life: .35, age: 0, col: pvCol(c), luit: 1, tl: .06 }); }
}
// --- le pouvoir : ce qu'il fait ---
function pvLancer(b, el, c, A) {
  const P0 = POUVOIRS[el], pu = pvPu(b), ep = Math.max(0, (pu - .65) / .35), deg = (.1 + .06 * ep), sz = b.sp.sz || 1;
  pvSon(P0.son, b.x, b.y, b.z + .5);
  if (el === 'braise' || el === 'sylve' || el === 'abysse') pvProjectile(b, c, el, deg, 0);
  else if (el === 'cristal') for (const o of [-1, 0, 1]) pvProjectile(b, c, el, deg * .55, o * .9);
  else if (el === 'givre') {                                // un cône de gel, devant elle
    const a0 = b.dir, L = P0.portee;
    for (let k = 0; k < 26; k++) { const a = a0 + (Math.random() - .5) * 1.1, v = 3 + Math.random() * 3;
      pvPart(b.x + Math.cos(a0) * .4 * sz, b.y + Math.sin(a0) * .4 * sz, b.z + .45 * sz, 1, P0.c, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, v: .3, vz: .3, g: .05, vie: .6, tl: .09 }); }
    const dans = o => { const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); if (d > L || d < .01) return false; let da = Math.atan2(dy, dx) - a0; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832; return Math.abs(da) < .6; };
    if (b.tame) { for (const o of beasts) if (!o.dead && !o.tame && o.pv > 0 && dans(o)) { pvBlesse(b, o, deg * .6); o.etourdi = Math.max(o.etourdi || 0, 1.6); } }
    else if (dans(P)) { pvFrapper(b, deg * .8); P.gel = Math.max(P.gel || 0, t + 3 + 1.5 * ep); }
  }
  else if (el === 'orage') PV.foudres.push({ x: A.x, y: A.y, t: t + .12, de: b, deg: deg * 1.2 });   // elle tombe là où l'on était à l'annonce
  else if (el === 'ombre') {                                // le pas de l'ombre : dans votre dos, et elle mord
    const dx = c.x - b.x, dy = c.y - b.y, d = Math.hypot(dx, dy) || 1, x = c.x + dx / d * 1.3, y = c.y + dy / d * 1.3;
    if (typeof hAt === 'function' && hAt(x | 0, y | 0) > SEA && Math.abs(hAt(x | 0, y | 0) - hAt(c.x | 0, c.y | 0)) <= 1 && !(typeof eauAt === 'function' && eauAt(x | 0, y | 0))) {
      pvPart(b.x, b.y, b.z + .3, 18, P0.c, { r: .6, vz: 1, g: -.1, vie: 1 });
      b.x = x; b.y = y; b.z = sol(x, y); b.vx = b.vy = 0; b.dir = b.dirT = Math.atan2(c.y - y, c.x - x);
      pvPart(x, y, b.z + .3, 18, P0.c, { r: .6, vz: 1, g: -.1, vie: 1 });
      try { if (typeof lancerAssaut === 'function') lancerAssaut(b, c, COMBAT[b.sp.id] || COMBAT.chasseur); } catch (e) { }
    }
  }
  else if (el === 'aurore') {                               // la lumière : le troupeau soigné, et qui est trop près, ébloui
    for (let k = 0; k < 30; k++) { const a = k / 30 * 6.2832; pvPart(b.x, b.y, b.z + .4 * sz, 1, P0.c, { vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, v: 0, vz: .2, g: 0, vie: .7, tl: .08 }); }
    pvSoinTroupeau(b, .3 + .2 * ep, 8);
    if (b.tame) { for (const o of beasts) if (!o.dead && !o.tame && o.pv > 0 && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 25) o.etourdi = Math.max(o.etourdi || 0, 1.2); }
    else if ((P.x - b.x) ** 2 + (P.y - b.y) ** 2 < 25) P.trouble = Math.max(P.trouble || 0, t + 1.6);
  }
}
// un coup de pouvoir sur le joueur : par le combat commun (esquive, parade, armure), sans la morsure en plus
function pvFrapper(b, deg) { b._pvSans = true; try { porterCoup(b, P, deg); } catch (e) { } b._pvSans = false; }
function pvProjectile(b, c, el, deg, decale) {
  const d = Math.hypot(c.x - b.x, c.y - b.y) || 1, vol = Math.max(.55, Math.min(1.15, .4 + d * .085)), sz = b.sp.sz || 1;
  const ux = (c.x - b.x) / d, uy = (c.y - b.y) / d;
  const cx = c.x + (c.vx || 0) * vol * .5 - uy * decale, cy = c.y + (c.vy || 0) * vol * .5 + ux * decale, cz = (c === P ? P.z : c.z || 0) + .6;
  const ox = b.x + ux * .35 * sz, oy = b.y + uy * .35 * sz, oz = b.z + .55 * sz;
  if (typeof TIRS === 'undefined') return;
  TIRS.push({ x: ox, y: oy, z: oz, vx: (cx - ox) / vol, vy: (cy - oy) / vol, vz: (cz - oz) / vol + TIR_G * vol * .5,
    de: b, deg, age: 0, c: POUVOIRS[el].c.slice(), spore: true, orvane: 'pouvoir', el, vol });
  try { if (typeof fauneTir === 'function') fauneTir(b, TIRS[TIRS.length - 1]); } catch (e) { }
}
function pouvoirImpact(f) {
  const el = f.el, P0 = POUVOIRS[el], x = f.x, y = f.y, z = Math.max(f.z, sol(x, y)), de = f.de, r = el === 'braise' ? 1.7 : 1.3;
  pvPart(x, y, z + .1, el === 'braise' ? 22 : 14, P0.c, { r: .5, v: 2.2, vz: el === 'abysse' ? 2.4 : 1.2, g: el === 'abysse' ? .5 : -.1, vie: .8, tl: .09 });
  pvSon(el === 'abysse' ? 'plouf' : el === 'braise' ? 'explosion' : 'impact', x, y, z, { court: 1 });
  if (de && de.tame) {
    for (const o of beasts) if (!o.dead && o.pv > 0 && !o.tame && o !== de && (o.x - x) ** 2 + (o.y - y) ** 2 < r * r) {
      pvBlesse(de, o, f.deg);
      if (el === 'braise') o.brulureB = Math.max(o.brulureB || 0, t + 3);
      else if (el === 'sylve') o.etourdi = Math.max(o.etourdi || 0, 2);
      else if (el === 'abysse') { const dx = o.x - x, dy = o.y - y, n = Math.hypot(dx, dy) || 1; o.vx = dx / n * 9; o.vy = dy / n * 9; o.etourdi = Math.max(o.etourdi || 0, .6); }
    }
    return;
  }
  if (!((P.x - x) ** 2 + (P.y - y) ** 2 < r * r && z > P.z - .6 && z < P.z + 2 && P.pv > 0) || !de) return;
  pvFrapper(de, f.deg);
  if (el === 'braise') { if (!effet('braise')) P.brulure = Math.max(P.brulure || 0, t + 3.5); }
  else if (el === 'sylve') { P.englue = Math.max(P.englue || 0, t + 1.5); P.vx = P.vy = 0; P.poison = Math.min(t + 10, Math.max(P.poison || 0, t) + 3); try { say('des ronces vous clouent au sol', 1.6); } catch (e) { } }
  else if (el === 'abysse') { const dx = P.x - x, dy = P.y - y, n = Math.hypot(dx, dy) || 1; P.vx = dx / n * 11; P.vy = dy / n * 11; P.vz = 5.2; P.ground = false; P.recul = .45; }
}
// --- à chaque image ---
function pouvoirsMaj(dt) {
  if (P.gel > t && P.pv > 0 && Math.random() < dt * 6) pvPart(P.x, P.y, P.z + .3 + Math.random(), 1, [210, 245, 255], { r: .6, v: .2, vz: -.2, g: .05, vie: 1 });
  for (let i = PV.foudres.length - 1; i >= 0; i--) { const F = PV.foudres[i]; if (t < F.t) continue; PV.foudres.splice(i, 1);
    const z0 = typeof sol === 'function' ? sol(F.x, F.y) : 0;
    for (let k = 0; k < 18; k++) pvPart(F.x, F.y, z0 + k * .25, 2, k % 3 ? [255, 250, 190] : [255, 255, 255], { r: .15, v: .6, vz: 0, g: 0, vie: .25, tl: .1 });
    pvPart(F.x, F.y, z0 + .1, 16, [255, 240, 120], { r: .4, v: 3, vz: 1.5, g: .3, vie: .5 });
    try { P.secousse = t; P.secousseK = .5; } catch (e) { }
    if (F.de && F.de.tame) { for (const o of beasts) if (!o.dead && !o.tame && o.pv > 0 && (o.x - F.x) ** 2 + (o.y - F.y) ** 2 < 2.2) { pvBlesse(F.de, o, F.deg); o.etourdi = Math.max(o.etourdi || 0, 1.5); } }
    else if ((P.x - F.x) ** 2 + (P.y - F.y) ** 2 < 1.7 && P.pv > 0 && F.de) { pvFrapper(F.de, F.deg); P.englue = Math.max(P.englue || 0, t + .9); P.vx = P.vy = 0; try { say('foudroyé', 1.2); } catch (e) { } }
  }
  if (Math.random() < dt * 4) for (const o of beasts) if (o.brulureB > t && !o.dead && o.pv > 0) {   // la braise (ou le venin des ronces) sur une bête
    o.pv -= .02 / (typeof robuste === 'function' ? robuste(o) : 1); o.hit = Math.max(o.hit || 0, .05);
    pvPart(o.x, o.y, o.z + .4 * (o.sp.sz || 1), 2, [255, 150, 60], { vz: 1, vie: .5 });
    if (o.pv <= 0 && !o.dead) try { mourirBete(o, 'tir'); } catch (e) { } }
}
function pouvoirStatuts(add) {
  if (P.gel > t) add('st_nuit', 'mal', 'Gelé', 'le givre d\'une créature : vous avancez à moitié moins vite', P.gel);
}
function pouvoirDit(o) {
  const el = pvEl(o); if (!el || !o.sp || o.dead) return '';
  const P0 = POUVOIRS[el]; return ' · ' + (pvPu(o) >= .5 ? P0.n.toLowerCase() + ', et sa morsure ' : 'sa morsure ') + P0.mord;
}
globalThis.__POUVOIRS = { POUVOIRS, PV, pouvoirBete, pouvoirCoup, pouvoirImpact, pouvoirsMaj, pvLancer };
