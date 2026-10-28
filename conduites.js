// Stone Valley — LES CONDUITES (conduites.js, §211)
// Ce que les organes d'Orvane font FAIRE aux bêtes. Orvane dit, dans un vocabulaire abstrait, ce qu'un trait fait
// (catalogue : conduite.type — riposte-distance, immobilite, alerte-groupe…) ; le traducteur (correspondance.js) en fait
// des conduites du jeu, posées sur chaque bête à sa naissance (b.conduites) d'après SON phénotype : un crapaud sur cent
// crache, si c'est ce que porte le monde. Ce module les joue.
//
// Trois règles, pour le joueur :
//  - une conduite s'ANNONCE avant d'agir : la gorge qui gonfle avant le jet, la bête qui se fige avant de détaler, le
//    cercle de l'appel ; et de près, la bête laisse voir son présage (« des plaques osseuses sur le dos ») ;
//  - elle se DÉCOUVRE : la première fois qu'on la voit chez une espèce, une ligne le dit, le carnet la garde (sauvegardé) ;
//    ensuite, le panneau de la bête désignée la nomme (« cracheur », « grégaire ») ;
//  - elle SUIT la bête qu'on lie : une compagne qui crache crache sur ce qui vous attaque, une grégaire donne l'alerte,
//    des yeux de nuit débusquent les bêtes camouflées.
// Ce que le joueur en fait (épargner les cracheurs, chasser les grégaires) remonte à Orvane, phénotype exact à l'appui :
// la sélection se fait sous ses yeux.
'use strict';
const CD = {
  crachat:    { nom: 'cracheur', dit: 'crache une sécrétion irritante sur qui l\'approche' },
  dard:       { nom: 'à dard', dit: 'pique qui la frappe de près : du venin' },
  glande:     { nom: 'à peau irritante', dit: 'qui la frappe au contact s\'en met plein les yeux' },
  carapace:   { nom: 'cuirassé', dit: 'encaisse les coups, et se replie sous sa carapace quand ça tourne mal' },
  cuir:       { nom: 'au cuir épais', dit: 'encaisse mieux les coups' },
  camouflage: { nom: 'camouflé', dit: 'se fige et se fond dans le sol quand on approche, puis détale' },
  alerte:     { nom: 'grégaire', dit: 'donne l\'alerte : tout le groupe détale avec lui' },
  parent:     { nom: 'protecteur', dit: 'charge qui s\'approche de ses petits' },
  nyctalope:  { nom: 'nyctalope', dit: 'voit dans la nuit ; ses yeux y luisent' },
  vibrisses:  { nom: 'aux vibrisses', dit: 'vous sent venir de plus loin' },
  ebloui:     { nom: 'ébloui', dit: 'voit mal en plein jour' },
  crocs:      { nom: 'aux longs crocs', dit: 'mord plus fort' },
  foulee:     { nom: 'coureur', dit: 'détale et poursuit plus vite' },
  lent:       { nom: 'placide', dit: 'lent en tout' },
  terrier:    { nom: 'fouisseur', dit: 's\'enterre d\'un coup pour vous échapper' },
};
const CD_ETATS = { crachat: 'gonfle sa gorge', 'figé': 'se fige', 'replié': 's\'est replié sous sa carapace' };
const CRACHAT_PREP = .75;                                     // la gorge gonfle trois quarts de seconde : de quoi s'écarter
const CDE = { vues: {}, comp: {} };                           // le carnet des conduites, et le phénotype des compagnes (sauvegardés)
let cdPret = false;
function cdInit() { if (cdPret) return; cdPret = true; try { for (const k in CD_ETATS) if (!(k in DITS_ETAT)) DITS_ETAT[k] = CD_ETATS[k]; } catch (e) { } }
const cdM = b => { if (!b || !b.conduites || !b.conduites.length) return null; if (!b.cdm) b.cdm = Object.fromEntries(b.conduites.map(c => [c.id, c])); return b.cdm; };
const cdNuit = () => { try { return lumiere() < .4; } catch (e) { return false; } };
const cdHasard = () => Math.random();

// --- la découverte : la première fois chez une espèce, une ligne ; ensuite, on compte ---
function cdDecouvrir(b, id) {
  if (!b || !b.sp || !CD[id] || Math.hypot(b.x - P.x, b.y - P.y) > 20) return;
  const cle = b.sp.id + ':' + id, n = CDE.vues[cle] || 0;
  if (!n && Object.keys(CDE.vues).length >= 400) return;
  CDE.vues[cle] = n + 1;
  if (!n) { try { say(b.sp.n + ' · ' + CD[id].dit + ' — noté au carnet', 3.4); } catch (e) { } try { Sauve.sale = true; } catch (e) { } }
}
// --- l'irritation : un voile dans les yeux ---
let cdVoile = null;
function cdIrriter(s) {
  P.irrite = Math.max(P.irrite || 0, t + s);
  if (typeof document !== 'undefined' && !cdVoile) {
    cdVoile = document.createElement('div');
    // sur la scène, sous le HUD (qui reste net) ; le flou et la teinte gagnent les bords, le centre reste lisible
    cdVoile.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0;transition:opacity .25s;'
      + 'background:radial-gradient(ellipse at 50% 46%,rgba(210,224,96,0) 30%,rgba(196,214,80,.38) 62%,rgba(150,170,40,.72) 100%);backdrop-filter:blur(2.5px);'
      + '-webkit-mask-image:radial-gradient(ellipse at 50% 46%,transparent 26%,#000 70%);mask-image:radial-gradient(ellipse at 50% 46%,transparent 26%,#000 70%)';
    document.body.appendChild(cdVoile);
    setInterval(() => { try { cdVoile.style.opacity = P.irrite > t && P.pv > 0 ? Math.min(1, (P.irrite - t) / 1.1) : 0; } catch (e) { } }, 90);
  }
}
function orvaneStatuts(add) { if (P.irrite > t) add('st_nuit', 'mal', 'Irrité', 'une sécrétion dans les yeux : la vue se brouille', P.irrite); }

// === le jet (riposte à distance) ===
function cdCrachat(b, c, cible) {
  if (b.crachePret) {                                          // la gorge gonfle : on vise, puis on crache
    const q = b.cracheCible;
    if (!q || q.dead || !(q.pv > 0)) { b.crachePret = 0; return null; }
    if (t >= b.crachePret) { b.crachePret = 0; cdLancer(b, q); b.cracheT = t + (c.recharge || 7) * (.8 + .4 * cdHasard()); return null; }
    return { etat: 'crachat', vit: 0, dirT: Math.atan2(q.y - b.y, q.x - b.x) };
  }
  if (!cible || t < (b.cracheT || 0) || b.pv < .15 || b.etourdi > 0) return null;
  const portee = Math.max(3.5, Math.min(7.5, (c.portee || 3) * 1.3 * b.sp.sz + 1.6)), d = Math.hypot(cible.x - b.x, cible.y - b.y);
  if (d < 1.6 || d > portee || Math.abs((cible.z || 0) - b.z) > 2.5) return null;
  b.crachePret = t + CRACHAT_PREP; b.cracheCible = cible;
  try { SON.jouer('toux', { vol: .7 }, b.x, b.y, b.z + .5); } catch (e) { }
  return { etat: 'crachat', vit: 0, dirT: Math.atan2(cible.y - b.y, cible.x - b.x) };
}
function cdLancer(b, c) {                                      // comme les spores du vesseron : visé là où l'on sera, une parabole qu'on voit venir
  const d = Math.hypot(c.x - b.x, c.y - b.y) || 1, vol = Math.max(.6, Math.min(1.25, .45 + d * .09));
  const cx = c.x + (c.vx || 0) * vol * .5, cy = c.y + (c.vy || 0) * vol * .5, cz = (c === P ? P.z : c.z || 0) + .6;
  const a = Math.atan2(cy - b.y, cx - b.x), ox = b.x + Math.cos(a) * .3 * b.sp.sz, oy = b.y + Math.sin(a) * .3 * b.sp.sz, oz = b.z + .55 * b.sp.sz;
  TIRS.push({ x: ox, y: oy, z: oz, vx: (cx - ox) / vol, vy: (cy - oy) / vol, vz: (cz - oz) / vol + TIR_G * vol * .5,
    de: b, deg: 0, age: 0, c: [206, 226, 88], spore: true, orvane: 'crachat', vol });
  try { if (typeof fauneTir === 'function') fauneTir(b, TIRS[TIRS.length - 1]); } catch (e) { }
  b.dirT = a; try { SON.jouer('crachat', {}, ox, oy, oz); } catch (e) { }
}
// l'éclat du jet (appelé par eclaterSpore) : sur le joueur, l'irritation ; tiré par une compagne, il étourdit les bêtes
function orvaneImpact(f) {
  const x = f.x, y = f.y, z = Math.max(f.z, sol(x, y));
  for (let k = 0; k < 14; k++) parts.push({ x, y, z: z + .12, vx: (cdHasard() - .5) * 1.6, vy: (cdHasard() - .5) * 1.6, vz: cdHasard() * .9,
    g: -.2, life: .6 + cdHasard() * .5, age: 0, col: k % 2 ? '#d6e86a' : '#a8c040', luit: 1, tl: .07 });
  try { SON.jouer('pouf', {}, x, y, z); } catch (e) { }
  const de = f.de;
  if (!de || !de.tame) {
    if ((P.x - x) ** 2 + (P.y - y) ** 2 < 1.4 && z > P.z - .5 && z < P.z + 1.9 && P.pv > 0) { cdIrriter(2.6); cdDecouvrir(de, 'crachat'); }
    else if (de && Math.hypot(de.x - P.x, de.y - P.y) < 12) cdDecouvrir(de, 'crachat');   // manqué : on l'a vu faire
  } else for (const o of beasts) if (!o.dead && o.pv > 0 && !o.tame && o !== de && (o.x - x) ** 2 + (o.y - y) ** 2 < 1.6) {
    o.etourdi = Math.max(o.etourdi || 0, 1.4); o.alarm = 1; o.hit = .2;
  }
}

// === se figer, se fondre (immobilité) ===
function cdCamouflage(b, dt, J, dJ) {
  const vue = b.sp.vue || 12;
  if (b.hit > 0 || b.as || b.traque) { b.fige = 0; return null; }
  if (dJ < 3.2) {                                              // trop près : il détale — et l'on comprend qu'il était là
    if (b.fige) { b.fige = 0; b.alarm = 1; cdDecouvrir(b, 'camouflage'); burst(b.x, b.y, b.z + .3, 8, '#9a8a6a'); }
    return null;
  }
  if (dJ < vue * 1.1) { b.fige = 1; b.camoK = Math.min(1, (b.camoK || 0) + dt * 1.4); return { etat: 'figé', vit: 0 }; }
  b.fige = 0; return null;
}
// === l'alerte (le groupe) ===
function cdAlerte(b, J, dJ) {
  b.alerteT = t + 8; let n = 0;
  for (const o of beasts) if (o !== b && o.sp === b.sp && !o.dead && !o.tame && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 196 && !(o.fuirOrv > t)) {
    o.fuirOrv = t + 3 + cdHasard(); o.fuirDe = J; o.alarm = 1; o.alerteT = t + 8; o.fige = 0; n++;
  }
  for (let k = 0; k < 18; k++) { const a = k / 18 * 6.2832; parts.push({ x: b.x, y: b.y, z: b.z + .45 * b.sp.sz, vx: Math.cos(a) * 3.4, vy: Math.sin(a) * 3.4, vz: .1, g: 0, life: .55, age: 0, col: '#ffe8a0', luit: 1, tl: .05 }); }
  try { SON.jouer('clics', { vol: .8 }, b.x, b.y, b.z + .5); } catch (e) { }
  if (n && dJ < 16) cdDecouvrir(b, 'alerte');
}
// === défendre ses petits ===
function cdParent(b, J) {
  if (b.age < b.sp.mat || t < (b.parentT || 0) || b.as) return;
  if (!(b.petitT > t)) { b.petitT = t + 1.5; b.petit = beasts.find(o => o !== b && !o.dead && !o.tame && o.sp === b.sp && (o.mere === b || o.age < o.sp.mat) && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 36) || null; }
  const p = b.petit; if (!p || p.dead) return;
  if ((J.x - p.x) ** 2 + (J.y - p.y) ** 2 < 12.25 && Math.abs(J.z - b.z) < 1.4) {
    b.parentT = t + 7; burst(b.x, b.y, b.z + .6, 8, '#ff9a7a');
    try { SON.jouer('grondement', { vol: .8 }, b.x, b.y, b.z + .5); lancerAssaut(b, J, COMBAT.defense); } catch (e) { }
    cdDecouvrir(b, 'parent');
  }
}

// === chaque bête, à chaque pas (appelé par majBete, avant le choix de l'état) ===
// Rend null (la vie ordinaire) ou ce que la conduite impose : { etat, vit, tx, ty, dirT, sprint }.
function conduitesBete(b, dt, men, dM2, J, dJ) {
  cdInit();
  if (b.tame) return cdCompagne(b, dt);
  if (b.fuirOrv > t && b.fuirDe) { const F = b.fuirDe; return { etat: 'fuir', vit: b.sp.spd, sprint: 1.6, tx: b.x + (b.x - F.x) * 3, ty: b.y + (b.y - F.y) * 3, men: F }; }   // l'alerte d'un congénère : on détale sans avoir vu
  const m = cdM(b);
  if (b.camoK > 0 && !b.fige) b.camoK = Math.max(0, b.camoK - dt * 1.5);
  if (!m) return null;
  const joueur = !!J && J.pv > 0 && (J === P || (typeof estJoueur === 'function' && estJoueur(J)));
  if (m.carapace && b.repliT > t) return { etat: 'replié', vit: 0 };
  if (m.crachat) { const o = cdCrachat(b, m.crachat, joueur && dJ < 9 ? J : null); if (o) return o; }
  if (m.camouflage && joueur) { const o = cdCamouflage(b, dt, J, dJ); if (o) return o; }
  if (m.terrier && joueur && dJ < 3.2 && !(b.enfoui > 0) && t > (b.terrierT || 0) && (b.sp.orvane?.genere || b.sp.corps === 'crapaud')) {
    b.enfoui = 3 + cdHasard() * 3; b.terrierT = t + 12; burst(b.x, b.y, b.z + .2, 14, '#8a6a48'); cdDecouvrir(b, 'terrier'); return null;
  }
  if (m.parent && joueur) cdParent(b, J);
  if (m.alerte && b.alarm >= .95 && t > (b.alerteT || 0) && joueur && dJ < (b.sp.vue || 12) * 1.2) cdAlerte(b, J, dJ);
  return null;
}
// === une compagne : ce qu'elle tient d'Orvane, à votre service ===
function cdCompagne(b, dt) {
  const c = b.comp;
  if (c) { const k = String(c.id), E = CDE.comp[k];
    if (b.phen && !E) { CDE.comp[k] = { e: b.sp.id, ph: b.phen, tr: (b.traits || []).slice(0, 12), cd: (b.conduites || []).slice(0, 12).map(x => ({ id: x.id, force: x.force, portee: x.portee, recharge: x.recharge })),
        qv: b.q ? { q: b.q, s: b.qs, tq: b.tq, vq: b.vq, fq: b.fq } : undefined }; const L = (b.conduites || []).map(x => CD[x.id]?.nom).filter(Boolean);
      if (L.length) try { say(c.nom + ' garde ce qu\'elle tient d\'Orvane : ' + L.join(', '), 3.2); } catch (e) { } }
    else if (!b.phen && E && E.e === b.sp.id) { b.phen = E.ph; b.traits = E.tr; b.conduites = E.cd && E.cd.length ? E.cd.map(x => ({ ...x })) : typeof OrvaneSV !== 'undefined' ? OrvaneSV.conduitesPour(b.sp, E.tr) : null; b.cdm = null;
      if (E.qv) { b.q = E.qv.q; b.qs = E.qv.s; for (const j of ['tq', 'vq', 'fq']) if (E.qv[j]) b[j] = E.qv[j]; } } }   // ressortie du sac, ou rechargée : la même bête
  const m = cdM(b); if (!m) return null;
  if (m.crachat) {                                             // elle crache sur ce qui vous attaque
    let h = b.crachePret ? b.cracheCible : null;
    const D = b.cibleD;                                        // d'abord ce qu'elle combat déjà (l'ordre de défense)
    if (!h && t > (b.cracheT || 0) && D && !D.dead && !D.tame && D.pv > 0 && D.sp) h = D;
    if (!h && t > (b.cracheT || 0)) h = beasts.find(o => !o.dead && !o.tame && o.pv > 0 && (o.traque || (o.as && o.as.c === P) || o.etat === 'assaut' || o.etat === 'traquer')
      && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 42 && (o.x - P.x) ** 2 + (o.y - P.y) ** 2 < 81);
    if (h) { const o = cdCrachat(b, m.crachat, h); if (o) return o; }
  }
  if (m.alerte && t > (b.alerteT || 0)) {                      // elle donne l'alerte : un chasseur, une machine qui vient pour vous
    const h = beasts.find(o => !o.dead && !o.tame && o.pv > 0 && (o.traque || (typeof automate === 'function' && automate(o.sp) && o.etat !== 'veille')) && (o.x - P.x) ** 2 + (o.y - P.y) ** 2 < 196);
    if (h) { b.alerteT = t + 25; for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832; parts.push({ x: b.x, y: b.y, z: b.z + .5, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: .1, g: 0, life: .5, age: 0, col: '#ffe8a0', luit: 1, tl: .05 }); }
      try { say((c ? c.nom : b.sp.n) + ' donne l\'alerte : ' + h.sp.n.toLowerCase() + ' en approche', 2.6); SON.jouer('clics', {}, b.x, b.y, b.z + .5); } catch (e) { } }
  }
  if (m.nyctalope && cdNuit()) for (const o of beasts) if (o.camoK > 0 && !o.tame && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 100) { o.camoK = Math.max(0, o.camoK - dt * 3); o.fige = 0; }   // ses yeux de nuit les débusquent
  return null;
}

// === ce que les conduites changent aux règles ===
function conduitesVue(b, vue) { const m = cdM(b); if (!m) return vue; const nuit = cdNuit(); let k = 1;
  if (m.nyctalope && nuit) k *= 1.4; if (m.vibrisses) k *= 1.15; if (m.ebloui && !nuit) k *= .8; return vue * k; }
function conduitesVit(b, etat) { const m = cdM(b), v = b.vq || 1; if (!m) return v;   // (§212) l'allure propre de la bête
  return v * (m.foulee && (etat === 'fuir' || etat === 'chasser' || etat === 'traquer') ? 1.25 : 1) * (m.lent ? (m.lent.force || .85) : 1); }
function conduitesDur(b) { const m = cdM(b); if (!m) return 1;
  return (m.carapace ? (b.repliT > t ? 3 : m.carapace.force || 1.6) : 1) * (m.cuir ? m.cuir.force || 1.25 : 1); }
// le joueur vient de blesser cette bête (blesseParJoueur)
function conduitesBlesse(b) {
  const m = cdM(b); if (!m || b.tame) return;
  const d = Math.hypot(P.x - b.x, P.y - b.y);
  if (m.dard && d < 2.1 && t > (b.dardT || 0)) { b.dardT = t + 2.5; P.poison = Math.min(t + 10, Math.max(P.poison || 0, t) + 4); burst(P.x, P.y, P.z + .8, 9, '#b070d8'); cdDecouvrir(b, 'dard'); }
  if (m.glande && d < 1.9 && t > (b.glandeT || 0)) { b.glandeT = t + 1.5; cdIrriter(1.6); burst(b.x, b.y, b.z + .5, 10, '#c4d860'); cdDecouvrir(b, 'glande'); }
  if (m.carapace) { cdDecouvrir(b, 'carapace'); if (b.pv < .6 && t > (b.repliFin || 0)) { b.repliT = t + 2.6; b.repliFin = t + 9; } }
  if (m.cuir) cdDecouvrir(b, 'cuir');
  b.fige = 0;
}
// une bête en mord une autre, ou mord le joueur (porterCoup)
function conduitesCoup(b, c, deg) {
  const ma = cdM(b);
  if (ma && ma.crocs) { deg *= ma.crocs.force || 1.25; if (c === P) cdDecouvrir(b, 'crocs'); }
  if (c && c !== P && c.sp && !(typeof estJoueur === 'function' && estJoueur(c))) { const mc = cdM(c);
    if (mc) { deg /= conduitesDur(c);
      if (mc.dard && b && b.sp && t > (c.dardT || 0) && Math.hypot(b.x - c.x, b.y - c.y) < 2.2) { c.dardT = t + 2.5; b.pv = Math.max(.05, b.pv - .06); b.etourdi = Math.max(b.etourdi || 0, .5); burst(b.x, b.y, b.z + .5, 6, '#b070d8'); } } }
  return deg;
}

// === à l'image : la gorge qui gonfle, le corps fondu dans le sol, ramassé sous la carapace, les yeux de nuit ===
function cdTete(B) { let z0 = 1e9, z1 = -1e9; for (const o of B) for (const q of [o.a, o.b]) { z0 = Math.min(z0, q[2]); z1 = Math.max(z1, q[2]); }
  const zm = (z0 + z1) / 2; let h = null; for (const o of B) for (const q of [o.a, o.b]) if (q[2] >= zm && (!h || q[0] > h[0])) h = q; return h || [0, 0, .3]; }
function conduitesOs(f, B) {
  if (!f || !f.sp || !B) return B;
  const m = cdM(f), nuit = m && m.nyctalope && cdNuit();
  if (!m && !(f.camoK > 0)) return B;
  let O = B;
  if (f.crachePret > t) { const k = 1 - (f.crachePret - t) / CRACHAT_PREP, h = cdTete(O), r = .05 + .07 * k;
    O = O.concat([{ a: [h[0] - .02, 0, h[2] - .08], b: [h[0] + .03, 0, h[2] - .08], w: r, h: r, c: [206, 226, 88], luit: 1 }]); }
  if (f.camoK > 0) { let so = [120, 140, 90]; try { so = (BIOME[bAt(f.x | 0, f.y | 0)] || BIOME[2]).top; } catch (e) { } const q = f.camoK * .82;
    O = O.map(o => o.luit ? o : Object.assign({}, o, { c: [o.c[0] + (so[0] * .94 + 12 - o.c[0]) * q, o.c[1] + (so[1] * .94 + 12 - o.c[1]) * q, o.c[2] + (so[2] * .94 + 14 - o.c[2]) * q] })); }
  if (f.repliT > t && !(f.sp.orvane && f.sp.orvane.genere)) O = O.map(o => Object.assign({}, o, { a: [o.a[0] * .9, o.a[1], o.a[2] * .55], b: [o.b[0] * .9, o.b[1], o.b[2] * .55] }));
  if (nuit) O = O.map(o => typeof memeCouleur === 'function' && memeCouleur(o.c, f.sp.oeil) ? Object.assign({}, o, { luit: 1 }) : o);
  return O;
}

// === ce que le joueur en sait : le panneau de la bête désignée, le carnet ===
function orvaneCibleDit(o) {
  if (!o || o.tame && !o.comp) return '';
  const m = o.conduites || [], d = Math.hypot(o.x - P.x, o.y - P.y), L = typeof OrvaneSV !== 'undefined' && OrvaneSV.quantMots ? OrvaneSV.quantMots(o) : [];   // (§212) sa taille, son allure, son audace
  let pres = 0;
  for (const c of m) { const nom = CD[c.id] && CD[c.id].nom; if (!nom) continue;
    if (CDE.vues[o.sp.id + ':' + c.id] || o.tame) L.push(nom); else if (c.presage && d < 7 && pres < 2 && !(c.id === 'crachat' && o.crachePret > t)) { L.push(c.presage); pres++; } }   // pas encore vu : le présage, de près
  return L.length ? ' · ' + L.join(' · ') : '';
}
function orvaneCarnet() {
  const L = Object.entries(CDE.vues).filter(([k]) => { const i = k.lastIndexOf(':'); return specById[k.slice(0, i)] && CD[k.slice(i + 1)]; });
  let h = `<h3>Conduites observées <span class="compte">${L.length}</span></h3>`;
  if (!L.length) return h + `<p class="note" style="margin:2px 2px 8px">Aucune encore. Certaines bêtes crachent, se figent, donnent l'alerte ou défendent leurs petits : approchez, observez. Orvane les fait évoluer, et ce que vous en faites compte.</p>`;
  for (const [k, n] of L.slice(0, 80)) { const i = k.lastIndexOf(':'), sp = specById[k.slice(0, i)], c = CD[k.slice(i + 1)];
    h += `<div class="obj"><div style="flex:1;min-width:0"><div class="n">${ESC(sp.n)} · ${ESC(c.nom)}</div><div class="d">${ESC(c.dit)} · vu ${n} fois</div></div></div>`; }
  return h;
}
// === la sauvegarde : le carnet, et ce que chaque compagne tient d'Orvane ===
function conduitesPhoto() {
  const ids = new Set((P.compagnes || []).map(c => String(c.id))), comp = {};
  for (const k in CDE.comp) if (ids.has(k)) comp[k] = CDE.comp[k];
  return { v: CDE.vues, c: comp };
}
// (§212) les traits continus d'une compagne, relus d'une sauvegarde : des nombres, bornés
function cdQv(v) {
  if (!v || typeof v !== 'object') return undefined;
  const lot = o => { if (!o || typeof o !== 'object') return undefined; const r = {}; for (const k of ['taille', 'vitesse', 'audace', 'sociabilite']) if (Number.isFinite(+o[k])) r[k] = Math.max(-6, Math.min(6, +o[k])); return r; };
  const f = (x, a, b) => Number.isFinite(+x) && +x ? Math.max(a, Math.min(b, +x)) : undefined;
  return { q: lot(v.q), s: lot(v.s), tq: f(v.tq, .7, 1.4), vq: f(v.vq, .7, 1.4), fq: f(v.fq, .4, 2.5) };
}
function conduitesRelire(d) {
  CDE.vues = {}; CDE.comp = {};
  if (!d || typeof d !== 'object') return;
  if (d.v && typeof d.v === 'object') for (const [k, n] of Object.entries(d.v).slice(0, 400)) if (typeof k === 'string' && k.length < 80 && CD[k.slice(k.lastIndexOf(':') + 1)]) CDE.vues[k] = Math.max(1, Math.min(1e6, n | 0));
  if (d.c && typeof d.c === 'object') for (const [k, e] of Object.entries(d.c).slice(0, 60)) if (e && typeof e.e === 'string' && typeof e.ph === 'string' && Array.isArray(e.tr))
    CDE.comp[k] = { e: e.e.slice(0, 60), ph: e.ph.slice(0, 200), tr: e.tr.filter(x => typeof x === 'string').slice(0, 12),
      cd: (Array.isArray(e.cd) ? e.cd : []).filter(x => x && CD[x.id]).slice(0, 12).map(x => ({ id: x.id, force: +x.force || undefined, portee: +x.portee || undefined, recharge: +x.recharge || undefined })),
      qv: cdQv(e.qv) };
}
