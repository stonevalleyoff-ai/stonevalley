// Stone Valley — LE VILLAGE (village.js)
// Un biome rare, le VILLAGE : trois ou quatre maisons de formes différentes (la hutte ronde au toit
// de chaume, la maison longue à pignon et cheminée, la haute à deux étages) autour d'un foyer et
// d'un puits, et les familles qui y vivent. Chacun a son métier : le chasseur part abattre une
// bête et rapporte la viande ; la cueilleuse coupe fibres et baies ; le porteur d'eau va au puits
// (ou à la rivière) et revient le seau à la main ; le pêcheur tient sa ligne au bord de l'eau ; la
// cuisinière tourne la marmite au foyer. À midi tout le monde vient manger au feu ; la nuit tombée,
// chacun rentre dormir (la fenêtre s'allume, la cheminée fume) ; les enfants courent entre les
// maisons. Ils parlent (ACTION près d'eux) : qui ils sont, ce qu'ils font, le village, un conseil.
// Les prédateurs les chassent comme toute bête ; les chasseurs se battent, les autres courent
// s'enfermer. Le jeu (index.html) appelle villageIle(), majVillage(dt), majVillageois, osVillageois,
// osMaison, vlParler ; VL_SPEC est versé dans SPEC.
const VL_BIO = 22;
const VL_SPEC = [
  { id: 'villageois', n: 'Villageois', corps: 'villageois', villageois: 1, diet: 'o', sz: 1, spd: 1.6, vue: 14, peur: .3, herd: 0, cap: 0, mat: 9999,
    shell: [196, 160, 132], dark: [90, 70, 60], leg: [58, 46, 40], oeil: [40, 30, 30], bio: [], dur: 1.6, lien: 0, chasse: [], travail: {}, metier: 'vit au village', grimpe: 0 },
  { id: 'maison', n: 'Maison', corps: 'maison', batiment: 1, diet: 'h', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [176, 150, 116], dark: [120, 88, 56], leg: [150, 120, 70], oeil: [50, 38, 30], bio: [], dur: 999, lien: 0, chasse: [], travail: {}, metier: '', grimpe: 0 },
];
const VL = { ici: false, centre: null, foyer: null, puits: null, gens: [], maisons: [], stock: { viande: 0, baies: 0, fibre: 0, eau: 0, poisson: 0 }, ui: null, parle: null, choix: null, frappe: null, texte: '', alerte: 0 };
const VL_NOMS = [['Aren', 'Bastien', 'Colm', 'Dorian', 'Elio', 'Faro', 'Gaël', 'Hald'], ['Ama', 'Brisa', 'Céline', 'Dune', 'Elsa', 'Fenna', 'Gaia', 'Héla'], ['Petit Lou', 'Mina', 'Tibo', 'Nell', 'Sacha', 'Yuna']];
const VL_METIERS = ['chasseur', 'cuisiniere', 'pecheur', 'cueilleuse', 'porteur', 'cueilleur'];
const VL_DIT_METIER = { chasseur: 'chasseur', cuisiniere: 'cuisinière', pecheur: 'pêcheur', cueilleuse: 'cueilleuse', porteur: 'porteur d\'eau', cueilleur: 'cueilleur', enfant: 'enfant' };
const VL_ROBES = [[[148, 84, 58], [214, 164, 104]], [[92, 72, 118], [168, 140, 196]], [[58, 108, 104], [132, 190, 176]], [[84, 98, 64], [150, 168, 110]], [[120, 60, 70], [196, 120, 128]], [[70, 84, 110], [132, 150, 186]], [[96, 90, 70], [180, 168, 128]]];
// ---------- le village, posé à l'arrivée ----------
function villageIle() {
  VL.ici = false; VL.gens = []; VL.maisons = []; VL.centre = VL.foyer = VL.puits = null; VL.stock = { viande: 0, baies: 0, fibre: 0, eau: 0, poisson: 0 };
  let n = 0, sx = 0, sy = 0; for (let i = 0; i < WS * WS; i++) if (Bio[i] === VL_BIO) { n++; sx += i % WS; sy += (i / WS) | 0; }
  if (n < 40) return;
  let s = (SEED ^ 0x51a9e) >>> 0 || 1; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const cx = Math.round(sx / n) + .5, cy = Math.round(sy / n) + .5;
  const plat = (x, y, R) => { const h = hAt(x, y); if (h <= SEA || PlT[y * WS + x]) return false; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const i = (y + dy) * WS + x + dx; if (i < 0 || i >= WS * WS || Hgt[i] !== h || Eau[i] > Hgt[i] || PlT[i]) return false; } return true; };
  const faucher = (x, y, R) => { for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const i = (y + dy) * WS + x + dx; if (i >= 0 && i < WS * WS && Flo[i]) Flo[i] = 0; } };
  // le centre : la place la plus plate près du milieu du biome
  let C = null, cd = 1e9;
  for (let i = 0; i < WS * WS; i++) if (Bio[i] === VL_BIO) { const x = i % WS, y = (i / WS) | 0, d = (x - cx) ** 2 + (y - cy) ** 2; if (d < cd && x > 6 && y > 6 && x < WS - 6 && y < WS - 6 && plat(x, y, 1)) { cd = d; C = [x + .5, y + .5]; } }
  if (!C) return;
  VL.ici = true; VL.centre = C; faucher(C[0] | 0, C[1] | 0, 3);
  const poser = (forme, x, y, dir) => { const b = naitre(specById.maison, x, y); b.age = 1e6; b.ech = 1; b.forme = forme; b.dir = b.dirT = dir; b.z = sol(x, y); b.pv = 1; beasts.push(b); return b; };
  VL.foyer = poser('foyer', C[0], C[1], 0);
  // les maisons : sur du plat, à 5–9 cases, bien espacées, la porte vers le feu
  const formes = ['ronde', 'longue', 'haute', 'ronde', 'longue'], places = [];
  for (let k = 0; k < 400 && places.length < 4; k++) {
    const a = r() * 6.2832, d = 5 + r() * 4, x = Math.round(C[0] + Math.cos(a) * d), y = Math.round(C[1] + Math.sin(a) * d);
    if (x < 4 || y < 4 || x >= WS - 4 || y >= WS - 4 || !plat(x, y, 1) || Math.abs(hAt(x, y) - hAt(C[0] | 0, C[1] | 0)) > 2 || places.some(p => Math.hypot(p[0] - x, p[1] - y) < 4.6)) continue;
    places.push([x, y]);
  }
  places.forEach(([x, y], k) => { faucher(x, y, 2); VL.maisons.push(poser(formes[k], x + .5, y + .5, Math.atan2(C[1] - y - .5, C[0] - x - .5))); });
  for (let k = 0; k < 200 && !VL.puits; k++) { const a = r() * 6.2832, x = Math.round(C[0] + Math.cos(a) * 3.2), y = Math.round(C[1] + Math.sin(a) * 3.2); if (plat(x, y, 1) && !places.some(p => Math.hypot(p[0] - x, p[1] - y) < 2.5)) { faucher(x, y, 1); VL.puits = poser('puits', x + .5, y + .5, 0); } }
  // les familles : deux adultes par maison (un métier chacun), parfois un enfant
  let m = 0;
  VL.maisons.forEach((M, k) => {
    const famille = [];
    for (let j = 0; j < 2; j++) {
      const f = j === 1 ? 1 : 0, metier = VL_METIERS[(m++) % VL_METIERS.length], rob = VL_ROBES[(k * 2 + j) % VL_ROBES.length];
      const b = naitre(specById.villageois, M.x + 1.2 + j * .8, M.y + 1), nom = VL_NOMS[f][(k * 2 + j) % 8];
      b.age = 1e6; b.ech = 1; b.pv = 1; b.z = sol(b.x, b.y); b.maison = M; b.metier = metier; b.f = f;
      b.nm = { nom, role: 'villageois', f, robe: rob[0], clair: rob[1], lueur: rob[1] }; b.etat = 'travail'; b.tache = null; famille.push(b); beasts.push(b); VL.gens.push(b);
    }
    if (r() < .6) {
      const b = naitre(specById.villageois, M.x + 2, M.y + 1.6), rob = VL_ROBES[(k + 3) % VL_ROBES.length];
      b.age = 1e6; b.ech = .62; b.pv = 1; b.z = sol(b.x, b.y); b.maison = M; b.metier = 'enfant'; b.f = r() < .5 ? 1 : 0;
      b.nm = { nom: VL_NOMS[2][k % 6], role: 'villageois', f: b.f, robe: rob[0], clair: rob[1], lueur: rob[1] }; b.etat = 'jouer'; famille.push(b); beasts.push(b); VL.gens.push(b);
    }
    famille.forEach(b => { b.famille = famille; });
  });
}
// ---------- la vie du village ----------
const vlNuit = () => lumiere() < .36, vlRepas = () => horloge > .49 && horloge < .56;
function vlBouger(b, tx, ty, vit, dt) {
  const d = Math.hypot(tx - b.x, ty - b.y);
  if (d < .08 || vit <= 0) { b.vit = 0; return true; }
  const s = Math.min(vit * dt, d), nx = b.x + (tx - b.x) / d * s, ny = b.y + (ty - b.y) / d * s;
  if (Math.abs(hAt(nx | 0, ny | 0) - hAt(b.x | 0, b.y | 0)) <= 1 && hAt(nx | 0, ny | 0) > SEA && !PlT[(ny | 0) * WS + (nx | 0)]) { b.x = nx; b.y = ny; b.vit = s / dt; }
  else { b.vit = 0; b.bloque = (b.bloque || 0) + dt; }
  b.dirT = Math.atan2(ty - b.y, tx - b.x); return d < .5;
}
function vlMenace(b) {                                   // une bête qui chasse, à portée du village
  let m = null, md = 64;
  for (const o of beasts) if (!o.dead && o.pv > 0 && !o.tame && !o.sp.villageois && !o.sp.batiment && !o.sp.illusion && (predateur(o.sp) || o.colere > 0 && o.cible === b || (o.as && o.as.c && o.as.c.sp && o.as.c.sp.villageois)) && o.etat !== 'dormir') {
    const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2; if (d < md) { md = d; m = o; }
  }
  return m;
}
const vlPorte = M => [M.x + Math.cos(M.dir) * (M.forme === 'longue' ? 1.1 : 1.5), M.y + Math.sin(M.dir) * (M.forme === 'longue' ? 1.1 : 1.5)];
function vlEau(b) {                                      // l'eau la plus proche du village
  if (VL.eau) return VL.eau; let best = null, bd = 1e9;
  for (let k = 0; k < 600; k++) { const a = Math.random() * 6.2832, r = 2 + Math.random() * 28, x = VL.centre[0] + Math.cos(a) * r, y = VL.centre[1] + Math.sin(a) * r; const i = (y | 0) * WS + (x | 0);
    if (i < 0 || i >= WS * WS || !(Eau[i] > Hgt[i])) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = ((y | 0) + dy) * WS + (x | 0) + dx; if (j >= 0 && j < WS * WS && Hgt[j] > SEA && !(Eau[j] > Hgt[j]) && r < bd) { bd = r; best = { x: (x | 0) + dx + .5, y: (y | 0) + dy + .5, ex: (x | 0) + .5, ey: (y | 0) + .5 }; } } }
  return VL.eau = best || null;
}
function vlTache(b) {                                    // ce qu'il va faire, selon son métier
  const C = VL.centre, R = 20;
  if (b.metier === 'chasseur') { let pr = null, pd = R * R; for (const o of beasts) if (!o.dead && o.pv > 0 && !o.tame && o.sp.diet === 'h' && !o.sp.villageois && !o.sp.batiment && !o.sp.boss && !o.sp.dragon && o.sp.sz < 1.5) { const d = (o.x - C[0]) ** 2 + (o.y - C[1]) ** 2; if (d < pd) { pd = d; pr = o; } }
    return pr ? { k: 'chasse', o: pr } : { k: 'rode', x: C[0] + (Math.random() - .5) * 16, y: C[1] + (Math.random() - .5) * 16, T: 6 }; }
  if (b.metier === 'cueilleuse' || b.metier === 'cueilleur') { let best = null, bd = R * R; for (let k = 0; k < 120; k++) { const x = (C[0] + (Math.random() - .5) * 2 * R) | 0, y = (C[1] + (Math.random() - .5) * 2 * R) | 0; const i = y * WS + x; if (i < 0 || i >= WS * WS || !Flo[i]) continue; const e = ESP[Flo[i] - 1]; if ((e.res === 'fibre' || e.res === 'baies') && !e.dalle && maturite(i, e) >= .9) { const d = (x - C[0]) ** 2 + (y - C[1]) ** 2; if (d < bd) { bd = d; best = { k: 'cueille', i, x: x + .5, y: y + .5, res: e.res }; } } } return best || { k: 'rode', x: C[0] + (Math.random() - .5) * 10, y: C[1] + (Math.random() - .5) * 10, T: 4 }; }
  if (b.metier === 'porteur') { const W = vlEau(b); return VL.puits && Math.random() < .6 ? { k: 'puise', x: VL.puits.x + .9, y: VL.puits.y, T: 2.5 } : W ? { k: 'puise', x: W.x, y: W.y, T: 2.5 } : { k: 'rode', x: C[0] + 3, y: C[1], T: 3 }; }
  if (b.metier === 'pecheur') { const W = vlEau(b); return W ? { k: 'peche', x: W.x, y: W.y, vers: Math.atan2(W.ey - W.y, W.ex - W.x), T: 18 + Math.random() * 20 } : { k: 'rode', x: C[0] - 3, y: C[1], T: 3 }; }
  if (b.metier === 'cuisiniere') return { k: 'cuisine', x: C[0] + Math.cos(b.t) * .0 + 1.1, y: C[1] + .3, T: 20 + Math.random() * 20 };
  return { k: 'joue', x: b.maison.x + (Math.random() - .5) * 7, y: b.maison.y + (Math.random() - .5) * 7, T: 1 };
}
function majVillageois(b, dt) {
  b.t += dt; if (b.hit > 0) { b.hit -= dt; if (!b.sp.batiment) b.peurT = b.t; }
  if (b.sp.batiment) { b.pv = 1; b.alarm = 0; b.colere = 0; return; }
  if (b.dead) { b.dead += dt; chute(b, dt); return; }
  if (b.pv <= 0) { mourirBete(b, 'combat'); VL.gens = VL.gens.filter(g => g !== b); VL.alerte = t + 60; return; }
  if (b.t - (b.peurT ?? -99) > 20) b.pv = Math.min(1, b.pv + dt * .01);
  b.ph = (b.ph || 0) + dt * (b.vit || 0) * 1.1;
  b.parle = VL.parle === b; const dJ = Math.hypot(P.x - b.x, P.y - b.y);
  b.salut = !b.parle && dJ < 4 && !vlNuit() && b.etat !== 'fuir' && b.etat !== 'combat' ? 1 : 0;
  if (b.parle) { b.dirT = Math.atan2(P.y - b.y, P.x - b.x); b.vit = 0; vlTourner(b, dt); return; }
  const M = b.maison, porte = vlPorte(M), nuit = vlNuit(), repas = vlRepas(), menace = vlMenace(b);
  // la peur, et le courage des chasseurs
  if (menace && (b.metier === 'chasseur' && b.pv > .35 ? false : true) && Math.hypot(menace.x - b.x, menace.y - b.y) < 9) { b.etat = 'fuir'; b.fuitT = b.t + 6; VL.alerte = t + 30; b.cache && (b.cache = false); }
  if (menace && b.metier === 'chasseur' && b.pv > .35 && Math.hypot(menace.x - b.x, menace.y - b.y) < 11) { b.etat = 'combat'; b.cible = menace; }
  if (b.etat === 'fuir') {
    if (b.cache) { if (b.t > b.fuitT && !vlMenace(b)) { b.cache = false; b.etat = 'travail'; b.tache = null; } return; }
    if (vlBouger(b, porte[0], porte[1], 2.8, dt)) { b.cache = true; b.x = M.x; b.y = M.y; }                 // il s'enferme
    vlTourner(b, dt); return;
  }
  if (b.etat === 'combat') {
    const c = b.cible;
    if (!c || c.dead || c.pv <= 0 || Math.hypot(c.x - b.x, c.y - b.y) > 16 || b.pv <= .35) { b.etat = 'travail'; b.tache = null; b.cible = null; if (b.pv <= .35) { b.etat = 'fuir'; b.fuitT = b.t + 8; } return; }
    const d = Math.hypot(c.x - b.x, c.y - b.y);
    if (d > 1.4) vlBouger(b, c.x, c.y, 2.6, dt); else { b.vit = 0; b.dirT = Math.atan2(c.y - b.y, c.x - b.x); if (b.t > (b.coupT || 0)) { b.coupT = b.t + 1.1; b.geste = 1; b.gesteT = t; porterCoup(b, c, .3); c.alarm = 1; burst(c.x, c.y, c.z + .5, 6, '#ffd0a0'); if (c.pv <= 0 && !c.dead) { mourirBete(c, 'chassé'); VL.stock.viande++; } } }
    vlTourner(b, dt); return;
  }
  // la nuit : chacun rentre
  if (nuit) {
    if (b.cache) return;
    if (vlBouger(b, porte[0], porte[1], 1.5, dt)) { b.cache = true; b.x = M.x; b.y = M.y; b.etat = 'dormir'; }
    vlTourner(b, dt); return;
  }
  if (b.cache) { b.cache = false; b.x = porte[0]; b.y = porte[1]; b.etat = 'travail'; b.tache = null; }
  // midi : tous au feu
  if (repas && b.etat !== 'repas') { b.etat = 'repas'; b.tache = null; const a = Math.random() * 6.2832; b.place = [VL.centre[0] + Math.cos(a) * 1.6, VL.centre[1] + Math.sin(a) * 1.6]; }
  if (b.etat === 'repas') { if (!repas) { b.etat = 'travail'; b.tache = null; } else { if (vlBouger(b, b.place[0], b.place[1], 1.5, dt)) { b.dirT = Math.atan2(VL.centre[1] - b.y, VL.centre[0] - b.x); b.assis = 1; } else b.assis = 0; vlTourner(b, dt); return; } }
  b.assis = 0;
  // le travail
  let T = b.tache; if (!T) T = b.tache = vlTache(b);
  if (T.k === 'chasse') { const o = T.o; if (!o || o.dead || o.pv <= 0) { b.tache = o && o.dead ? { k: 'rapporte', x: VL.centre[0] + .8, y: VL.centre[1] - .8, res: 'viande' } : null; return; }
    if (Math.hypot(o.x - b.x, o.y - b.y) > 1.4) vlBouger(b, o.x, o.y, 2.4, dt); else { b.vit = 0; b.dirT = Math.atan2(o.y - b.y, o.x - b.x); if (b.t > (b.coupT || 0)) { b.coupT = b.t + 1; b.geste = 1; b.gesteT = t; porterCoup(b, o, .35); o.alarm = 1; if (o.pv <= 0 && !o.dead) { mourirBete(o, 'chassé'); b.tache = { k: 'rapporte', x: VL.centre[0] + .8, y: VL.centre[1] - .8, res: 'viande' }; b.porte = 'viande'; } } } }
  else if (T.k === 'cueille') { if (!Flo[T.i] || maturite(T.i, ESP[Flo[T.i] - 1]) < .9) { b.tache = null; return; }
    if (vlBouger(b, T.x + .4, T.y, 1.6, dt)) { T.w = (T.w || 0) + dt; b.geste = 1; b.gesteT = t; if (T.w > 3) { couperPied(T.i); b.porte = T.res === 'baies' ? 'baies' : 'fibre'; b.tache = { k: 'rapporte', x: VL.centre[0] - 1, y: VL.centre[1] + 1, res: b.porte }; } } }
  else if (T.k === 'puise') { if (vlBouger(b, T.x, T.y, 1.5, dt)) { T.w = (T.w || 0) + dt; b.geste = 1; b.gesteT = t; if (T.w > T.T) { b.porte = 'eau'; b.tache = { k: 'rapporte', x: VL.centre[0] - .9, y: VL.centre[1] - 1.2, res: 'eau' }; } } }
  else if (T.k === 'peche') { if (vlBouger(b, T.x, T.y, 1.5, dt)) { b.dirT = T.vers; b.peche = 1; T.w = (T.w || 0) + dt; if (Math.random() < dt * .08) { burst(T.x + Math.cos(T.vers) * 2.5, T.y + Math.sin(T.vers) * 2.5, sol(T.x, T.y) + .1, 8, '#d8eefa'); b.porte = 'poisson'; } if (T.w > T.T) { b.peche = 0; b.tache = { k: 'rapporte', x: VL.centre[0] + 1.2, y: VL.centre[1] + 1.2, res: b.porte || 'rien' }; } } else b.peche = 0; }
  else if (T.k === 'cuisine') { if (vlBouger(b, T.x, T.y, 1.4, dt)) { b.dirT = Math.atan2(VL.centre[1] - b.y, VL.centre[0] - b.x); b.cuisine = 1; T.w = (T.w || 0) + dt; if (T.w > T.T) { b.cuisine = 0; b.tache = { k: 'rode', x: VL.centre[0] + (Math.random() - .5) * 6, y: VL.centre[1] + (Math.random() - .5) * 6, T: 5 }; } } else b.cuisine = 0; }
  else if (T.k === 'rapporte') { if (vlBouger(b, T.x, T.y, 1.7, dt)) { if (T.res && T.res !== 'rien' && VL.stock[T.res] !== undefined) VL.stock[T.res]++; b.porte = null; b.tache = null; } }
  else if (T.k === 'joue' || T.k === 'rode') { if (vlBouger(b, T.x, T.y, T.k === 'joue' ? 2.6 : 1.3, dt) || b.bloque > 1) { T.w = (T.w || 0) + dt; b.bloque = 0; if (T.w > T.T) b.tache = null; } }
  vlTourner(b, dt);
}
function vlTourner(b, dt) { let dd = (b.dirT ?? b.dir) - b.dir; while (dd > Math.PI) dd -= 6.2832; while (dd < -Math.PI) dd += 6.2832; b.dir += Math.max(-6 * dt, Math.min(6 * dt, dd)); b.z = sol(b.x, b.y); b.vx = b.vy = 0; }
function majVillage(dt) {
  if (!VL.ici) { if (VL.ui && VL.ui.classList.contains('ouvert')) vlFermer(); return; }
  const F = VL.foyer;
  if (F && Math.random() < dt * 22) parts.push({ x: F.x + (Math.random() - .5) * .5, y: F.y + (Math.random() - .5) * .5, z: F.z + .25, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: 1 + Math.random() * 1.2, g: -1.6, life: .45 + Math.random() * .35, age: 0, col: Math.random() < .6 ? '#ffb040' : '#ff6a24', luit: 1, tl: .09 });   // le feu
  if (F && Math.random() < dt * 3) parts.push({ x: F.x, y: F.y, z: F.z + 1, vx: 0, vy: 0, vz: 1, g: -.8, life: 2, age: 0, col: '#6a625a', tl: .16 });
  for (const M of VL.maisons) if (M.forme !== 'ronde' && VL.gens.some(g => g.maison === M && g.cache) && Math.random() < dt * 3) { const c = vlCheminee(M); parts.push({ x: c[0], y: c[1], z: c[2], vx: .2, vy: 0, vz: .9, g: -.8, life: 2.2, age: 0, col: '#8a847c', tl: .14 }); }
  if (VL.parle && (VL.parle.dead || Math.hypot(VL.parle.x - P.x, VL.parle.y - P.y) > 4)) vlFermer();
}
const vlCheminee = M => { const c = Math.cos(M.dir), s = Math.sin(M.dir), lx = M.forme === 'longue' ? -1.1 : .5, ly = M.forme === 'longue' ? .5 : .5; return [M.x + lx * c - ly * s, M.y + lx * s + ly * c, M.z + (M.forme === 'longue' ? 2.4 : 3.5)]; };
// ---------- en volumes ----------
function osVillageois(f) {
  if (f.cache) return [];
  const B = nmOs(f), add = (a, b, w, h, c, luit) => B.push({ a, b, w, h, c, luit });
  const bois = [120, 88, 56], fer = [110, 110, 118], osier = [176, 150, 100];
  const g = f.gesteT != null && t - f.gesteT < .5 ? Math.sin((t - f.gesteT) / .5 * Math.PI) : 0;
  if (f.assis) for (const o of B) { o.a[2] -= .3; o.b[2] -= .3; }                              // assis au feu
  const main = [.14 + g * .25, -.17, .5 + g * .2];                                              // la main droite, à peu près
  if (f.metier === 'chasseur') { add([main[0] - .35, main[1], main[2] + .25], [main[0] + .5 + g * .3, main[1], main[2] - .35 - g * .2], .03, .03, bois); add([main[0] + .5 + g * .3, main[1], main[2] - .35 - g * .2], [main[0] + .66 + g * .3, main[1], main[2] - .46 - g * .2], .04, .02, fer); }   // la lance
  else if (f.metier === 'cueilleuse' || f.metier === 'cueilleur') { add([main[0] - .05, main[1] - .02, main[2] - .15], [main[0] + .1, main[1] - .02, main[2] - .15], .2, .14, osier); if (f.porte) add([main[0] - .02, main[1] - .02, main[2] - .06], [main[0] + .08, main[1] - .02, main[2] - .06], .16, .06, f.porte === 'baies' ? [160, 50, 70] : [150, 190, 90]); }   // le panier
  else if (f.metier === 'porteur') { add([main[0], main[1], main[2] - .25], [main[0], main[1], main[2] - .1], .14, .14, bois); add([main[0], main[1], main[2] - .1], [main[0], main[1], main[2] - .05], .12, .02, f.porte === 'eau' ? [90, 150, 210] : bois); }   // le seau
  else if (f.metier === 'pecheur') { add([main[0], main[1], main[2]], [main[0] + .9, main[1], main[2] + .7], .025, .025, bois); if (f.peche) add([main[0] + .9, main[1], main[2] + .7], [main[0] + 1.3, main[1], main[2] - .4], .008, .008, [220, 220, 220]); }   // la canne, et sa ligne
  else if (f.metier === 'cuisiniere') { add([main[0], main[1], main[2]], [main[0] + .45, main[1] + .1, main[2] - .25 + (f.cuisine ? Math.sin(t * 3) * .04 : 0)], .025, .025, bois); }   // la louche
  if (f.porte === 'viande') add([.1, .2, .5], [.3, .22, .45], .14, .1, [164, 70, 60]);         // la viande sur l'épaule
  if (f.porte === 'poisson') add([.12, .2, .45], [.4, .2, .4], .07, .1, [196, 210, 224]);
  return B;
}
// Les maisons. Les toits sont de vraies pentes : une boîte posée de l'avant-toit au faîte est
// inclinée d'elle-même (son axe monte), large de toute la longueur du toit et mince ; des lattes
// plus sombres suivent la pente pour le chaume ou l'ardoise. Un soubassement de pierre, des
// colombages, une porte dans son cadre avec son seuil et sa lanterne (allumée la nuit), des
// fenêtres à volets, des chevrons sous l'avant-toit, un faîte et ses épis.
function osMaison(f) {
  const B = [], add = (a, b, w, h, c, luit) => B.push({ a, b, w, h, c, luit });
  const bois = [104, 76, 50], boisClair = [150, 116, 78], chaume = [168, 138, 84], chaumeS = [132, 104, 60], torchis = [206, 188, 156], pierre = [138, 134, 126], pierreS = [104, 100, 94];
  const ardoise = [80, 84, 96], ardoiseC = [112, 116, 128], porte = [70, 50, 36], volet = [88, 108, 86], fer = [110, 110, 118];
  const nuit = vlNuit(), habitee = VL.gens.some(g => g.maison === f && g.cache), fen = nuit && habitee ? [255, 206, 120] : [66, 76, 96];
  const lanterne = (x, y, z) => { add([x, y, z], [x, y, z + .14], .08, .08, fer); add([x, y, z + .03], [x, y, z + .11], .06, .06, nuit ? [255, 200, 110] : [120, 100, 70], nuit); add([x, y, z + .14], [x, y, z + .28], .012, .012, fer); };
  const fenetre = (x, y, z, s, l = .36) => {               // une fenêtre dans son cadre, deux volets ouverts ; s : le côté du mur
    add([x - l / 2, y + s * .005, z], [x + l / 2, y + s * .005, z], .04, .36, fen, nuit && habitee);
    add([x - l / 2 - .03, y + s * .02, z], [x + l / 2 + .03, y + s * .02, z], .05, .04, boisClair); add([x - l / 2 - .03, y + s * .02, z - .2], [x + l / 2 + .03, y + s * .02, z - .2], .05, .04, boisClair);
    add([x - l / 2 - .03, y + s * .02, z - .2], [x - l / 2 - .03, y + s * .02, z + .2], .05, .05, boisClair); add([x + l / 2 + .03, y + s * .02, z - .2], [x + l / 2 + .03, y + s * .02, z + .2], .05, .05, boisClair);
    add([x - l / 2 - .2, y + s * .04, z], [x - l / 2 - .05, y + s * .04, z], .03, .38, volet); add([x + l / 2 + .05, y + s * .04, z], [x + l / 2 + .2, y + s * .04, z], .03, .38, volet);
  };
  const porteCadre = (x, y, z, dir) => {                  // la porte, son cadre, son seuil, sa lanterne
    const c = Math.cos(dir), sn = Math.sin(dir), lat = [-sn, c];
    add([x - lat[0] * .3, y - lat[1] * .3, z + .45], [x + lat[0] * .3, y + lat[1] * .3, z + .45], .06, .9, porte);
    add([x - lat[0] * .36 + c * .03, y - lat[1] * .36 + sn * .03, z], [x - lat[0] * .36 + c * .03, y - lat[1] * .36 + sn * .03, z + .98], .07, .07, boisClair);
    add([x + lat[0] * .36 + c * .03, y + lat[1] * .36 + sn * .03, z], [x + lat[0] * .36 + c * .03, y + lat[1] * .36 + sn * .03, z + .98], .07, .07, boisClair);
    add([x - lat[0] * .4 + c * .03, y - lat[1] * .4 + sn * .03, z + .96], [x + lat[0] * .4 + c * .03, y + lat[1] * .4 + sn * .03, z + .96], .08, .07, bois);
    add([x - lat[0] * .45 + c * .22, y - lat[1] * .45 + sn * .22, z + .05], [x + lat[0] * .45 + c * .22, y + lat[1] * .45 + sn * .22, z + .05], .4, .1, pierreS);   // le seuil
    add([x + lat[0] * .22 - c * .02, y + lat[1] * .22 - sn * .02, z + .5], [x + lat[0] * .22 + c * .04, y + lat[1] * .22 + sn * .04, z + .5], .03, .03, fer);         // la poignée
    lanterne(x + lat[0] * .55 + c * .1, y + lat[1] * .55 + sn * .1, z + 1.25);
  };
  const lattes = (a, b, w, n, col) => {                   // des rangs en travers de la pente, posés dessus
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...d) || 1, u = d.map(q => q / l), pe = [-u[1], u[0], 0], pl = Math.hypot(pe[0], pe[1]) || 1; pe[0] /= pl; pe[1] /= pl;
    const nz = [u[1] * pe[2] - u[2] * pe[1], u[2] * pe[0] - u[0] * pe[2], u[0] * pe[1] - u[1] * pe[0]];
    for (let k = 1; k <= n; k++) { const q = k / (n + 1), p = [a[0] + d[0] * q + nz[0] * .07, a[1] + d[1] * q + nz[1] * .07, a[2] + d[2] * q + Math.abs(nz[2]) * .07];
      add([p[0] - pe[0] * w / 2, p[1] - pe[1] * w / 2, p[2]], [p[0] + pe[0] * w / 2, p[1] + pe[1] * w / 2, p[2]], .07, .03, col); } };
  if (f.forme === 'ronde') {                               // la hutte : soubassement, huit pans, le cône de chaume cerclé, l'épi
    const r = 1.35;
    for (let k = 0; k < 8; k++) {
      const a0 = k / 8 * 6.2832, a1 = (k + 1) / 8 * 6.2832, p0 = [Math.cos(a0) * r, Math.sin(a0) * r], p1 = [Math.cos(a1) * r, Math.sin(a1) * r];
      add([p0[0] * 1.03, p0[1] * 1.03, .14], [p1[0] * 1.03, p1[1] * 1.03, .14], .14, .28, pierre);                         // la pierre, en bas
      add([p0[0], p0[1], .72], [p1[0], p1[1], .72], .12, .9, torchis);
      add([p0[0], p0[1], .7], [p0[0], p0[1], 1.25], .1, .1, bois);                                                        // le poteau
      const m = [(p0[0] + p1[0]) / 2 * 1.22, (p0[1] + p1[1]) / 2 * 1.22, 1.12];
      add([0, 0, 2.6], m, 1.2, .1, chaume); lattes([0, 0, 2.6], m, 1.05, 3, chaumeS);                                      // le pan du cône, et ses rangs
      add([m[0] * .98, m[1] * .98, 1.1], [m[0] * .98, m[1] * .98, 1.0], .06, .1, bois);                                   // le chevron
    }
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832, a1 = (k + 1) / 8 * 6.2832; add([Math.cos(a0) * .72, Math.sin(a0) * .72, 2.0], [Math.cos(a1) * .72, Math.sin(a1) * .72, 2.0], .05, .05, bois); }   // la ligature
    add([0, 0, 2.55], [0, 0, 2.95], .12, .12, bois); add([0, 0, 2.95], [0, 0, 3.1], .22, .06, boisClair); add([0, 0, 3.1], [0, 0, 3.3], .05, .05, fer);   // l'épi
    porteCadre(1.3, 0, 0, 0); fenetre(0, 1.36, .9, 1, .3); fenetre(0, -1.36, .9, -1, .3);
  } else if (f.forme === 'longue') {                       // la maison longue : soubassement, colombages, deux vraies pentes d'ardoise, la cheminée
    add([-1.7, 0, .16], [1.7, 0, .16], 1.8, .32, pierre);
    add([-1.6, 0, .78], [1.6, 0, .78], 1.66, .96, torchis);
    for (const x of [-1.6, -.8, 0, .8, 1.6]) for (const s of [-1, 1]) add([x, s * .84, .3], [x, s * .84, 1.28], .08, .08, bois);        // les poteaux
    for (const s of [-1, 1]) { add([-1.6, s * .85, 1.26], [1.6, s * .85, 1.26], .08, .08, bois); add([-.8, s * .86, .4], [0, s * .86, 1.15], .06, .06, bois); add([.8, s * .86, .4], [0, s * .86, 1.15], .06, .06, bois); }   // la sablière, les croix
    for (const s of [-1, 1]) { add([s * 1.62, -.84, .78], [s * 1.62, .84, .78], .08, 1.0, torchis); add([s * 1.62, -.84, 1.3], [s * 1.62, 0, 2.2], .06, .06, bois); add([s * 1.62, .84, 1.3], [s * 1.62, 0, 2.2], .06, .06, bois); add([s * 1.62, 0, 1.3], [s * 1.62, 0, 2.2], .06, .06, bois); }   // les pignons
    for (const s of [-1, 1]) { const E = [0, s * 1.12, 1.14], F = [0, s * .02, 2.22]; add(E, F, 3.9, .1, ardoise); lattes(E, F, 3.8, 5, ardoiseC); add([-1.95, s * 1.12, 1.1], [1.95, s * 1.12, 1.1], .07, .06, boisClair);   // la pente, ses rangs, l'avant-toit
      for (const x of [-1.5, -.75, 0, .75, 1.5]) add([x, s * 1.12, 1.05], [x, s * .9, 1.27], .06, .05, bois); }                       // les chevrons
    add([-2.0, 0, 2.27], [2.0, 0, 2.27], .16, .12, bois); add([-2.0, 0, 2.3], [-2.0, 0, 2.55], .05, .05, fer); add([2.0, 0, 2.3], [2.0, 0, 2.55], .05, .05, fer);   // le faîte et ses épis
    add([-1.0, .45, 1.8], [-1.0, .45, 2.65], .34, .34, pierreS); add([-1.0, .45, 2.65], [-1.0, .45, 2.74], .44, .09, pierre);           // la cheminée et son chapeau
    porteCadre(1.62, 0, 0, 0); fenetre(.4, .9, .85, 1); fenetre(-.9, .9, .85, 1); fenetre(0, -.9, .85, -1);
    add([.1, 1.06, .62], [.7, 1.06, .62], .14, .12, bois); add([.1, 1.06, .72], [.7, 1.06, .72], .12, .08, [164, 60, 90]);               // la jardinière fleurie
  } else if (f.forme === 'haute') {                        // la haute : deux étages, le second en saillie, quatre pentes qui montent en pointe
    add([-.95, 0, .16], [.95, 0, .16], 1.9, .32, pierre);
    add([-.9, 0, .8], [.9, 0, .8], 1.8, .96, torchis);
    add([-1.1, 0, 1.36], [1.1, 0, 1.36], 2.2, .14, bois);                                                                   // la saillie
    add([-1.02, 0, 2.05], [1.02, 0, 2.05], 2.04, 1.24, torchis);
    for (const x of [-1.02, -.5, 0, .5, 1.02]) for (const s of [-1, 1]) { add([x, s * 1.03, 1.43], [x, s * 1.03, 2.67], .07, .07, bois); add([s * 1.03, x, 1.43], [s * 1.03, x, 2.67], .07, .07, bois); }
    for (const s of [-1, 1]) { add([-.5, s * 1.04, 1.5], [0, s * 1.04, 2.3], .05, .05, bois); add([.5, s * 1.04, 1.5], [0, s * 1.04, 2.3], .05, .05, bois); add([s * 1.04, -.5, 1.5], [s * 1.04, 0, 2.3], .05, .05, bois); add([s * 1.04, .5, 1.5], [s * 1.04, 0, 2.3], .05, .05, bois); }
    for (const x of [-.9, -.45, 0, .45, .9]) for (const s of [-1, 1]) add([x, s * .91, .32], [x, s * .91, 1.3], .07, .07, bois);
    for (let k = 0; k < 4; k++) { const a = k / 4 * 6.2832, c = Math.cos(a), sn = Math.sin(a), E = [c * 1.32, sn * 1.32, 2.6], F = [c * .04, sn * .04, 3.75];   // les quatre pentes
      add(E, F, 2.7, .1, ardoise); lattes(E, F, 2.5, 4, ardoiseC); add([c * 1.32 - sn * 1.3, sn * 1.32 + c * 1.3, 2.56], [c * 1.32 + sn * 1.3, sn * 1.32 - c * 1.3, 2.56], .07, .06, boisClair);
      for (const q of [-.9, -.45, 0, .45, .9]) add([c * 1.32 - sn * q, sn * 1.32 + c * q, 2.5], [c * 1.1 - sn * q, sn * 1.1 + c * q, 2.7], .06, .05, bois); }
    add([0, 0, 3.72], [0, 0, 4.0], .12, .12, bois); add([0, 0, 4.0], [0, 0, 4.1], .24, .06, boisClair); add([0, 0, 4.1], [0, 0, 4.35], .04, .04, fer);
    add([.55, .5, 3.0], [.55, .5, 3.9], .3, .3, pierreS); add([.55, .5, 3.9], [.55, .5, 3.98], .4, .08, pierre);
    porteCadre(.92, 0, 0, 0); fenetre(0, 1.08, 2.1, 1); fenetre(-.4, -1.08, 2.1, -1); fenetre(.45, -.95, .9, -1, .3); fenetre(-.45, -.95, .9, -1, .3);
    add([-.6, 1.2, 1.5], [.6, 1.2, 1.5], .06, .06, bois); for (const x of [-.6, -.3, 0, .3, .6]) add([x, 1.2, 1.36], [x, 1.2, 1.5], .04, .04, bois);   // la balustrade de l'étage
  } else if (f.forme === 'puits') {                        // le puits : la margelle de pierre, deux montants, le petit toit de chaume à deux pentes, le treuil et le seau
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * 6.2832, a1 = (k + 1) / 8 * 6.2832; add([Math.cos(a0) * .7, Math.sin(a0) * .7, .26], [Math.cos(a1) * .7, Math.sin(a1) * .7, .26], .24, .52, k % 2 ? pierre : pierreS); }
    for (const s of [-1, 1]) add([0, s * .78, .5], [0, s * .78, 1.75], .1, .1, bois);
    add([0, -.85, 1.72], [0, .85, 1.72], .09, .09, boisClair);                                                               // le treuil
    add([-.08, .95, 1.72], [-.22, 1.1, 1.72], .05, .05, bois);                                                                 // la manivelle
    for (const s of [-1, 1]) { const E = [s * .72, 0, 1.78], F = [s * .02, 0, 2.3]; add(E, F, 1.9, .08, chaume); lattes(E, F, 1.8, 2, chaumeS); }
    add([0, -.95, 2.33], [0, .95, 2.33], .1, .1, bois);
    const z = 1.05 + Math.sin(t * .7) * .1; add([0, 0, 1.72], [0, 0, z + .16], .015, .015, [200, 190, 160]); add([0, 0, z], [0, 0, z + .16], .2, .2, bois); add([0, 0, z + .16], [0, 0, z + .19], .22, .03, fer);
  } else {                                                 // le foyer : des pierres en rond, les bûches, deux fourches, la broche et sa marmite ; les provisions tout autour
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832; add([Math.cos(a) * .6, Math.sin(a) * .6, .1], [Math.cos(a) * .6 + .02, Math.sin(a) * .6, .12], .26, .22, k % 2 ? pierre : pierreS); }
    add([-.3, -.2, .14], [.3, .2, .16], .13, .13, [70, 50, 34]); add([-.25, .25, .14], [.25, -.25, .16], .13, .13, [70, 50, 34]); add([0, 0, .12], [0, .3, .3], .11, .11, [92, 64, 40]);
    for (const s of [-1, 1]) { add([0, s * .75, .1], [0, s * .75, 1.15], .08, .08, bois); add([0, s * .75, 1.15], [.12, s * .75, 1.3], .06, .06, bois); add([0, s * .75, 1.15], [-.12, s * .75, 1.3], .06, .06, bois); }   // les fourches
    add([0, -.8, 1.15], [0, .8, 1.15], .05, .05, fer); add([0, 0, 1.15], [0, 0, .9], .015, .015, fer);
    add([0, 0, .62], [0, 0, .9], .38, .32, [58, 58, 64]); add([0, 0, .9], [0, 0, .94], .42, .04, [80, 80, 86]); add([-.2, 0, .98], [.2, 0, .98], .03, .03, fer);   // la marmite, son couvercle, son anse
    for (let k = 0; k < 3; k++) { const a = k / 3 * 6.2832 + .5; add([Math.cos(a) * .9, Math.sin(a) * .9, .17], [Math.cos(a) * .9 + .02, Math.sin(a) * .9, .17], .55, .18, bois); }   // trois bancs
    if (VL.stock.viande > 0) add([.6, .55, .3], [.9, .7, .3], .18, .1, [164, 70, 60]); if (VL.stock.poisson > 0) add([-.7, .5, .3], [-.5, .75, .3], .08, .1, [196, 210, 224]);
    if (VL.stock.fibre > 0) add([-.8, -.5, .2], [-.5, -.7, .2], .3, .3, [150, 190, 90]); if (VL.stock.baies > 0) add([.6, -.6, .2], [.75, -.75, .2], .25, .25, [120, 50, 80]);
  }
  return B;
}
// ---------- la parole ----------
const VL_LORE = ['Nos anciens ont posé la première pierre ici parce que l\'eau était douce et la terre plate. Depuis, on tient.',
  'Le soir, on ferme les portes. Pas par méfiance : par habitude. Ce qui rôde la nuit n\'aime pas les murs.',
  'Le puits ne tarit jamais. On dit qu\'il descend jusqu\'à la mer, mais personne n\'a vérifié.',
  'Les Nomades du Seuil passent parfois. On échange des histoires contre du poisson séché.'];
const VL_CONSEILS = ['Ne récolte pas la roche qui noircit. Ceux qui l\'ont fait ont vu des choses.', 'Cours quand tu entends un grondement sous tes pieds. Marche quand tout est silencieux.',
  'Les îles de nuage portent les éclats. Il faut grimper, ou avoir des ailes.', 'Une bête affamée se laisse approcher par qui a de quoi manger dans son sac. Pas par qui court.',
  'Le soir, le feu attire les gens. Le matin, il attire les bêtes. Garde-le bas.'];
function vlDit(b, sujet) {
  const nuit = vlNuit(), repas = vlRepas(), M = b.metier, fam = b.famille.filter(g => g !== b && !g.dead), conj = fam.find(g => g.metier !== 'enfant'), enf = fam.find(g => g.metier === 'enfant');
  if (sujet === 'qui') return `Je suis ${b.nm.nom}, ${VL_DIT_METIER[M]} du village.` + (conj ? ` Avec ${conj.nm.nom}, ` + (enf ? `et notre ${enf.f ? 'fille' : 'petit'} ${enf.nm.nom}, ` : '') + `nous tenons la ${b.maison.forme === 'ronde' ? 'hutte ronde' : b.maison.forme === 'longue' ? 'maison longue' : 'maison haute'}.` : '');
  if (sujet === 'fait') {
    if (b.etat === 'fuir' || VL.alerte > t) return 'Pas maintenant… il y a eu une bête. ' + (M === 'chasseur' ? 'Je garde l\'œil sur les herbes hautes.' : 'Reste près des maisons.');
    if (repas) return 'C\'est l\'heure du repas. Tout le monde au feu, c\'est la règle. Assieds-toi, si tu veux.';
    if (nuit) return 'La nuit, on rentre. Tu devrais faire pareil.';
    return { chasseur: 'Je cherche une bête à la taille de ma lance. Pas trop grosse : il faut la ramener.', cuisiniere: 'Je tiens la marmite. Ce qu\'ils rapportent finit dedans — viande, poisson, baies, et l\'eau du puits.',
      pecheur: 'Je tiens ma ligne au bord de l\'eau. Les jours de calme, ça mord. Les jours d\'orage, c\'est la lune qu\'on prend.', cueilleuse: 'Je coupe les fibres et je cueille ce qui est mûr. Un panier le matin, un l\'après-midi.',
      cueilleur: 'Je coupe les fibres et je cueille ce qui est mûr. Jamais plus que le village n\'en mange.', porteur: 'Je vais au puits, et quand il est bas, à la rivière. Dix seaux par jour, qu\'il pleuve ou non.',
      enfant: 'Je joue ! Tu veux courir ?' }[M] || 'Je vis.';
  }
  if (sujet === 'village') return VL_LORE[(b.nm.nom.length + VL.gens.length) % VL_LORE.length] + (VL.stock.viande + VL.stock.poisson + VL.stock.baies + VL.stock.fibre > 6 ? ' Les réserves sont bonnes, cette saison.' : ' Les réserves sont maigres : chacun fait sa part.');
  return VL_CONSEILS[(b.nm.nom.charCodeAt(0) + (P.exp && P.exp.niveau || 0)) % VL_CONSEILS.length];
}
function vlParler(b) {
  if (b.dead || b.cache) return;
  VL.parle = b; b.salutT = b.t; vlUI().classList.add('ouvert');
  VL.ui.querySelector('.nm-nom').textContent = b.nm.nom; VL.ui.querySelector('.nm-role').textContent = VL_DIT_METIER[b.metier] + ' du village';
  VL.ui.style.setProperty('--nm-lueur', 'rgb(' + b.nm.clair.join(',') + ')');
  vlNoeud(b.metier === 'enfant' ? ['Bonjour ! T\'es qui, toi ?', 'Tu viens d\'où ?', 'Oh, un étranger !'][Math.random() * 3 | 0] : (vlNuit() ? 'Qui va là, à cette heure ?' : ['Bonjour, voyageur.', 'Tiens, une tête nouvelle.', 'Sois le bienvenu.'][Math.random() * 3 | 0]));
}
function vlNoeud(dit) {
  const b = VL.parle; if (!b) return;
  vlEcrire(dit);
  const choix = [{ t: 'Qui es-tu ?', s: 'qui' }, { t: 'Que fais-tu ?', s: 'fait' }, { t: 'Parle-moi du village.', s: 'village' }, { t: 'Un conseil pour la route ?', s: 'conseil' }, { t: 'Au revoir.', fin: true }];
  const el = VL.ui.querySelector('.nm-choix'); el.innerHTML = '';
  choix.forEach((c, i) => { const bt = document.createElement('button'); bt.innerHTML = '<kbd>' + (i + 1) + '</kbd>'; bt.appendChild(document.createTextNode(c.t)); bt.onclick = e => { e.stopPropagation(); vlChoisir(c); }; el.appendChild(bt); });
  VL.choix = choix;
}
function vlChoisir(c) {
  const b = VL.parle; if (!b || !c) return;
  if (c.fin) { vlEcrire(['Bonne route.', 'Reviens quand tu veux.', 'Que le feu te garde.'][Math.random() * 3 | 0]); VL.ui.querySelector('.nm-choix').innerHTML = ''; VL.choix = null; setTimeout(vlFermer, 1500); return; }
  vlNoeud(vlDit(b, c.s));
}
function vlEcrire(txt) {
  const p = VL.ui.querySelector('.nm-dit'); VL.texte = txt; let i = 0; if (VL.frappe) clearInterval(VL.frappe); p.textContent = '';
  VL.frappe = setInterval(() => { i += 2; p.textContent = txt.slice(0, i); if (i >= txt.length) { clearInterval(VL.frappe); VL.frappe = null; } }, 16);
}
function vlFermer() { if (VL.frappe) { clearInterval(VL.frappe); VL.frappe = null; } VL.parle = null; VL.choix = null; if (VL.ui) VL.ui.classList.remove('ouvert'); }
function vlUI() {
  if (VL.ui) return VL.ui;
  const d = document.createElement('div'); d.id = 'vl-dial';
  d.innerHTML = '<div class="nm-tete"><span class="nm-nom"></span><span class="nm-role"></span></div><p class="nm-dit"></p><div class="nm-choix"></div>';
  const st = document.createElement('style');
  st.textContent = `#vl-dial{position:fixed;z-index:6;left:50%;transform:translateX(-50%);bottom:calc(160px + env(safe-area-inset-bottom));width:min(560px,calc(100% - 32px));box-sizing:border-box;padding:12px 14px 10px;border-radius:12px;display:none;background:rgba(30,26,22,.93);border:1px solid rgba(230,205,170,.3);box-shadow:0 8px 28px rgba(0,0,0,.45);color:#e4d8c6;font-size:14px;pointer-events:auto;backdrop-filter:blur(3px);--nm-lueur:#ffd27d}
  #vl-dial.ouvert{display:block} #vl-dial .nm-tete{display:flex;align-items:baseline;gap:8px;margin-bottom:6px} #vl-dial .nm-nom{color:var(--nm-lueur);font-weight:700;letter-spacing:.5px} #vl-dial .nm-role{color:#a89a86;font-size:12px}
  #vl-dial .nm-dit{margin:0 0 10px;line-height:1.5;min-height:42px} #vl-dial .nm-choix{display:grid;gap:6px}
  #vl-dial .nm-choix button{text-align:left;font:inherit;font-size:13px;color:#e4d8c6;cursor:pointer;padding:7px 10px;border-radius:8px;background:rgba(60,50,40,.85);border:1px solid rgba(230,205,170,.2);line-height:1.35}
  #vl-dial .nm-choix button:hover{border-color:var(--nm-lueur);color:#fff} #vl-dial kbd{display:inline-block;min-width:16px;margin-right:8px;padding:0 4px;border-radius:4px;background:rgba(255,255,255,.1);font:inherit;font-size:11px;color:#a89a86}`;
  document.head.appendChild(st); document.body.appendChild(d); VL.ui = d;
  addEventListener('keydown', e => { if (!VL.ui.classList.contains('ouvert') || !VL.choix) return; if (/^Digit[1-9]$/.test(e.code)) { e.preventDefault(); e.stopPropagation(); vlChoisir(VL.choix[+e.code.slice(-1) - 1]); } else if (e.code === 'Escape') { e.preventDefault(); vlFermer(); } }, true);
  return d;
}
