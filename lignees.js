// Stone Valley — LES LIGNÉES D'ORVANE (lignees.js, §210)
// Une lignée née dans Orvane n'a pas de dessin : on construit son corps d'après sa fiche (plan.corps, moteur/corps.js
// d'Orvane), avec les mêmes boîtes que les autres bêtes — le moteur les arrondit en formes (§186–188), les variantes
// les recolorent et les grandissent (varier), la fureur rougit leurs yeux. Une seule description sert aux quatre rendus.
//
//   osOrvane(f)         les os d'une bête dont la fiche porte sp.orvane.corps (appelé par osDeBase)
//   dessinOrvane(d, sp) son pictogramme, de profil (16 × 16)
//
// Le corps se lit ainsi : la forme (quadrupède, hexapode, bipède, oiseau, serpent) et le nombre de pattes donnent le
// squelette ; long, haut, cou, tete, museau… ses proportions ; les traits dominants de la lignée (sp.orvane.traits)
// ajoutent leurs organes : carapace, crocs, dard, membrane, palmes, glandes, grands yeux de nuit, couleurs d'alerte.
// Les organes de la fiche (plan.corps.organes, §215) se posent à leur place, à leur taille : cornes (une sur le nez, deux,
// quatre), défenses, trompe, collerette, crête de tête ou de dos, plaques, épines, nageoires, massue, aiguillon, panache, pinces.
// La conduite (brouter, chasser, fuir, se laisser lier) reste celle de la fiche dont la lignée descend.
'use strict';
const LG = {
  BEC: [214, 172, 92], CORNE: [232, 220, 192], CROC: [244, 240, 228], DARD: [60, 40, 52], GLANDE: [196, 208, 84],
  ALERTE: [[236, 190, 40], [222, 70, 46]],
};
const lgMix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// une couleur vive, à l'opposé de la robe : celle des crêtes
function lgAccent(c) {
  const T = typeof OrvaneCorps !== 'undefined' && OrvaneCorps.tourner;
  const v = T ? T(c, 150) : [255 - c[0], 255 - c[1], 255 - c[2]], m = (v[0] + v[1] + v[2]) / 3;
  return v.map(x => Math.max(0, Math.min(255, m + (x - m) * 1.6 + 20)));
}
// les mesures d'un corps, une fois pour toutes par fiche (elles ne changent pas d'une image à l'autre)
function lgMesures(sp) {
  const O = sp.orvane; if (O._m) return O._m;
  const c = O.corps || {}, tr = new Set(O.traits || []), q = k => Number.isFinite(c[k]) ? c[k] : .3;
  const forme = c.forme || 'quadrupede', serpent = forme === 'serpent', bip = forme === 'bipede' || forme === 'oiseau';
  const pattes = serpent ? 0 : bip ? 2 : Math.max(2, Math.min(8, c.pattes || (forme === 'hexapode' ? 6 : 4)));
  const C = c.couleurs || {};
  const M = {
    forme, serpent, bip, oiseau: forme === 'oiseau', hexa: forme === 'hexapode', pattes, tr,
    Lt: .26 + q('long') * .34, Th: .2 - q('long') * .05, Hl: (.07 + q('haut') * .36) * (tr.has('pattes-longues') ? 1.25 : 1),
    cou: q('cou'), tete: .09 + q('tete') * .09, museau: q('museau'), oreilles: q('oreilles'), queue: q('queue'), cornes: q('cornes'),
    crete: q('crete'), ailes: Math.max(q('ailes'), (sp.volant || sp.dragon) ? .8 : 0), carapace: Math.max(q('carapace'), tr.has('carapace') ? .8 : 0),
    antennes: q('antennes'), motif: c.motif || 'uni', organes: [],
    robe: sp.shell, sombre: sp.dark, ventre: sp.ventre || C.ventre || lgMix(sp.shell, [240, 236, 226], .35), oeil: sp.oeil,
  };
  M.Wd = M.Th * 1.1;
  // (§215) les organes : la liste de la fiche (ou celle qu'on tire de ses proportions) ; les cinq d'avant s'y relisent, par place
  const N = typeof OrvaneCorps !== 'undefined' && OrvaneCorps.normaliser, OL = Array.isArray(c.organes) ? c.organes : N ? N(c).organes : null;
  M.organes = (OL || []).filter(o => o && Number.isFinite(o.taille) && o.taille >= .2);
  M.org = (ty, pl) => M.organes.find(o => o.type === ty && (!pl || o.place === pl));
  if (OL) { const tl = (ty, pl) => (M.org(ty, pl) || {}).taille || 0;
    M.cornes = tl('cornes'); M.crete = tl('crete', 'tete'); M.antennes = tl('antennes');
    M.ailes = Math.max(tl('ailes'), (sp.volant || sp.dragon) ? .8 : 0); M.carapace = Math.max(tl('carapace'), tr.has('carapace') ? .8 : 0); }
  M.accent = tr.has('coloration-aposematique') ? LG.ALERTE[(sp.id.length) % 2] : lgAccent(M.robe);
  if (M.hexa && M.Hl > .3) M.Hl = .3;                               // un hexapode se tient bas : ses pattes s'écartent plutôt
  return (O._m = M);
}
// la foulée : avancée d'après le chemin parcouru, comme une roue (aucun autre système ne la tient pour ces bêtes)
function lgFoulee(f, M) {
  const dtl = Math.min(.1, Math.max(0, t - (f._lgT ?? t))); f._lgT = t;
  const dx = f.x - (f._lgX ?? f.x), dy = f.y - (f._lgY ?? f.y); f._lgX = f.x; f._lgY = f.y;
  const d = Math.min(.5, Math.hypot(dx, dy)), k = echB(f) || 1;
  const vInst = dtl > 0 ? d / dtl : 0; f._lgV = (f._lgV || 0) + (vInst - (f._lgV || 0)) * Math.min(1, dtl * 8);
  f._lgPh = ((f._lgPh || 0) + d / Math.max(.15, (.22 + M.Hl * 1.4) * k)) % 1;
  return f.dead ? 0 : Math.min(1.6, Number.isFinite(f.vit) && f.vit > 0 ? f.vit : f._lgV);
}

function osOrvane(f) {
  const sp = f.sp, M = lgMesures(sp), B = [], tr = M.tr;
  const add = (a, b, w, h, c, luit) => B.push(luit ? { a, b, w, h, c, luit: 1 } : { a, b, w, h, c });
  if (f.enfoui > 0 && !f.dead) {                                     // enterré (conduites.js, terrier) : un dos de terre, deux yeux
    const tz = Math.max(.04, M.Th * .3), terre = [118, 92, 64];
    add([-M.Lt * .45, 0, tz * .5], [M.Lt * .45, 0, tz * .5], M.Wd * 1.3, tz, terre); add([-M.Lt * .2, 0, tz], [M.Lt * .25, 0, tz], M.Wd * .8, tz * .6, M.robe);
    for (const s of [-1, 1]) add([M.Lt * .3, s * M.tete * .3, tz * 1.2], [M.Lt * .3 + .02, s * M.tete * .3, tz * 1.2], .03, .035, M.oeil);
    return B;
  }
  const v = lgFoulee(f, M), ph = f._lgPh * 6.2832, allure = Math.min(1, v / 1.2);
  const dk = Math.min(1, (f.dead || 0) * 2.6), dort = f.etat === 'dormir' && !f.dead ? 1 : 0, vol = !!f.enVol;
  const ram = f.ramasse || 0, al = f.alarm || 0;
  const { Lt, Th, Wd } = M, couche = Math.max(dk, dort * .85, f.repliT > t ? .9 : 0);   // replié sous sa carapace (conduites.js) : couché, ramassé
  // la hauteur du dos : debout sur ses pattes, couché quand il dort ou qu'il meurt
  const bz0 = M.serpent ? Th * .42 : M.Hl + Th * .5, bz = bz0 + (Th * .5 + .01 - bz0) * couche - ram * .04 + Math.abs(Math.sin(ph * 2)) * .012 * allure;
  const xa = Lt * .5, xr = -Lt * .5;                                 // l'avant et l'arrière du tronc
  let avant, bout, tz = bz;                                           // où s'attache le cou ; le bout de la queue
  // --- le tronc ---
  if (M.serpent) {
    const n = 7, L = .5 + Lt, ond = .05 + .04 * allure, pts = [];
    for (let i = 0; i <= n; i++) { const x = L * (.5 - i / n), y = Math.sin(ph * 2 + i * .9 + t * (v > .05 ? 0 : 1.3)) * ond * (i / n + .2) * (1 - dk * .7);
      pts.push([x, y, bz * (1 - i / n * .25)]); }
    for (let i = 0; i < n; i++) { const k = 1 - i / n * .55; add(pts[i], pts[i + 1], Wd * k, Th * k * .85, i % 2 && M.motif === 'bandes' ? M.sombre : M.robe); }
    for (let i = 0; i < n - 1; i++) add([pts[i][0], pts[i][1], pts[i][2] - Th * .38], [pts[i + 1][0], pts[i + 1][1], pts[i + 1][2] - Th * .38], Wd * .7 * (1 - i / n * .5), .03, M.ventre);
    avant = pts[0]; tz = pts[0][2]; bout = pts[n];
  } else if (M.bip) {
    const pen = M.oiseau ? .25 : .55, hz = bz;                       // un bipède se tient penché ; un oiseau presque à plat
    const H = [-Lt * .35, 0, hz], S = [Lt * .35, 0, hz + Lt * pen * (1 - couche)];
    add(H, lgMix(H, S, .55), Wd * 1.05, Th * 1.05, M.robe); add(lgMix(H, S, .45), S, Wd * .95, Th * .95, M.robe);
    add([H[0] + .03, 0, H[2] - Th * .42], [S[0] - .02, 0, S[2] - Th * .42], Wd * .7, .03, M.ventre);
    avant = S; tz = S[2];
  } else {
    const croupe = M.hexa ? 1.12 : 1, z1 = bz + (M.hexa ? .02 : 0);
    if (M.hexa) {                                                     // l'abdomen, le thorax : deux masses, la plus grosse derrière
      add([xr - .02, 0, z1], [xr + Lt * .55, 0, z1 + .01], Wd * croupe * 1.1, Th * croupe, M.robe);
      add([xr + Lt * .52, 0, bz], [xa, 0, bz], Wd * .85, Th * .85, M.robe);
    } else {
      add([xr, 0, bz], [xr + Lt * .52, 0, bz + .005], Wd, Th, M.robe);
      add([xr + Lt * .48, 0, bz + .005], [xa, 0, bz + .01], Wd * 1.04, Th * 1.04, M.robe);
    }
    add([xr + .04, 0, bz - Th * .45], [xa - .03, 0, bz - Th * .45], Wd * .78, .03, M.ventre);
    avant = [xa, 0, bz]; tz = bz + Th * .2;
  }
  // --- le dos : carapace, motif, glandes ---
  if (!M.serpent) {
    const x0 = M.bip ? -Lt * .3 : xr + .02, x1 = M.bip ? Lt * .2 : xa - .04, zt = (M.bip ? bz + .02 : bz) + Th * .5;
    if (M.carapace > .3) {
      const n = M.hexa ? 2 : 1, ep = .025 + M.carapace * .045;
      for (let i = 0; i < n; i++) { const a0 = x0 + (x1 - x0) * i / n, a1 = x0 + (x1 - x0) * (i + 1) / n - .01; add([a0, 0, zt], [a1, 0, zt + .005], Wd * 1.18, ep, M.sombre); }
    } else if (M.motif === 'rayures') for (let i = 0; i < 4; i++) { const x = x0 + (x1 - x0) * (.15 + i * .23); add([x, 0, zt], [x + .025, 0, zt], Wd * 1.04, .015, M.sombre); }
    else if (M.motif === 'taches') for (let i = 0; i < 5; i++) { const x = x0 + (x1 - x0) * (.12 + i * .19), y = (i % 2 ? 1 : -1) * Wd * .25; add([x, y, zt], [x + .035, y, zt], .04, .012, M.sombre); }
    else if (M.motif === 'bandes') add([x0, 0, zt], [x1, 0, zt], Wd * .35, .014, M.sombre);
    if (tr.has('coloration-aposematique')) for (let i = 0; i < 3; i++) { const x = x0 + (x1 - x0) * (.2 + i * .3); add([x, 0, zt + .006], [x + .03, 0, zt + .006], Wd * 1.06, .014, M.accent); }
    if (tr.has('glande-irritante')) for (const s of [-1, 1]) add([x1 - .02, s * Wd * .32, zt - .01], [x1 + .02, s * Wd * .32, zt + .02], .045, .045, LG.GLANDE);
  }
  // --- les pattes ---
  if (M.pattes && !M.serpent) {
    const paires = M.pattes / 2, ecart = M.hexa ? .12 + M.Hl * .3 : .015, ep = M.hexa ? .035 : .045 + Th * .12;
    const plie = Math.max(couche, vol ? 1 : 0), amp = .55 * allure * (1 - plie);
    for (let i = 0; i < paires; i++) for (const s of [-1, 1]) {
      const xh = M.bip ? -Lt * .2 : paires === 1 ? 0 : xa - .05 - (Lt - .1) * i / (paires - 1);
      const off = M.bip ? (s > 0 ? 0 : .5) : M.hexa ? ((i % 2) * .5 + (s > 0 ? 0 : .5)) % 1 : ((i * .5) + (s > 0 ? 0 : .5)) % 1;
      const a = Math.sin(ph + off * 6.2832) * amp, lev = Math.max(0, Math.cos(ph + off * 6.2832)) * .045 * allure * (1 - plie);
      const hz = (M.bip ? bz - Th * .25 : bz - Th * .3), hy = s * Wd * .45;
      const pied = [xh + a * M.Hl * .7 + (dk ? .04 * s : 0), s * (Wd * .5 + ecart + dk * .08), lev + plie * (M.hexa ? .03 : Th * .25)];
      const genou = M.hexa ? [xh + a * M.Hl * .3, s * (Wd * .5 + ecart * .7), Math.max(hz + .03, pied[2] + M.Hl * .7)]
        : [lgMix([xh, hy, hz], pied, .5)[0] + (M.bip ? -.03 : .02) * (1 - plie) + plie * .06, s * Wd * .48, Math.max(pied[2] + .02, (hz + pied[2]) * .5 - plie * .02)];
      add([xh, hy, hz], genou, ep, ep, M.sombre); add(genou, pied, ep * .8, ep * .8, M.sombre);
      if (tr.has('palmes')) add([pied[0] - .02, pied[1], pied[2] + .006], [pied[0] + .04, pied[1], pied[2] + .006], .075, .012, M.sombre);
      else if (!M.hexa) add([pied[0] - .015, pied[1], pied[2] + .01], [pied[0] + .03, pied[1], pied[2] + .01], ep * .9, .022, M.sombre);
    }
    if (tr.has('membrane-planante') && !M.bip) for (const s of [-1, 1]) add([xr + .03, s * Wd * .6, bz - .01], [xa - .04, s * Wd * .6, bz - .01], .012, Math.min(.12, M.Hl * .6), lgMix(M.ventre, M.robe, .3));
    if (M.bip && !M.oiseau && M.ailes < .3) for (const s of [-1, 1]) add([avant[0] - .03, s * Wd * .5, avant[2] - .02], [avant[0] + .05, s * Wd * .55, avant[2] - .08 + allure * .02], .03, .03, M.robe);   // de petits bras
  }
  // --- les ailes : repliées le long du corps, battantes en vol ---
  if (M.ailes > .3) {
    const env = (.15 + M.ailes * .45), bat = vol ? Math.sin(Number.isFinite(f.ph) ? f.ph : t * 10) : 0;   // repliées au sol, battantes en vol
    const ax = M.bip ? avant[0] - .05 : xa - Lt * .3, az = (M.bip ? avant[2] : bz) + Th * .35;
    for (const s of [-1, 1]) {
      if (vol) { const ang = .25 + bat * .9; add([ax, s * Wd * .45, az], [ax - .05, s * (Wd * .45 + env * Math.cos(ang)), az + env * Math.sin(ang)], env * .55, .018, M.sombre); }
      else add([ax, s * Wd * .55, az], [ax - env * .8, s * Wd * .6, az - .02], .016, Th * .7, M.sombre);
    }
  }
  // --- le cou et la tête ---
  const hs = M.tete, lev = (al * .05 + (M.bip ? .03 : 0)) * (1 - couche);
  const nl = M.cou * .3, ang = (M.serpent ? .35 : .8) + al * .3 - couche * .9 - ram * .4;
  const base = [avant[0] - (M.serpent ? 0 : .02), 0, tz];
  const tete = [base[0] + Math.cos(ang) * nl + hs * .45, 0, base[2] + Math.sin(ang) * nl + lev + (M.serpent ? .03 : 0) + Math.sin(ph * 2) * .008 * allure];
  if (couche) tete[2] = Math.max(hs * .5 + .01, tete[2] - couche * .06);
  if (nl > .03) add(base, [tete[0] - hs * .35, 0, tete[2] - hs * .1], Th * .45 + .02, Th * .45 + .02, M.robe);
  add([tete[0] - hs * .5, 0, tete[2]], [tete[0] + hs * .45, 0, tete[2]], hs * 1.05, hs, M.robe);
  const nez = [tete[0] + hs * .45, 0, tete[2] - hs * .15];
  if (M.museau > .12) { const ml = .03 + M.museau * .13; add(nez, [nez[0] + ml, 0, nez[2] - ml * .2], hs * .55, hs * .48, M.oiseau ? LG.BEC : M.robe); nez[0] += ml; }
  if (tr.has('crocs-allonges')) for (const s of [-1, 1]) add([nez[0] - .01, s * hs * .16, nez[2] - hs * .15], [nez[0] - .005, s * hs * .16, nez[2] - hs * .15 - .05], .018, .018, LG.CROC);
  // les yeux (la couleur exacte de la fiche : la fureur et les robes les reconnaissent)
  const yeux = tr.has('yeux-nocturnes') ? .05 : .03 + M.tete * .08;
  for (const s of [-1, 1]) {
    if (M.motif === 'masque') add([tete[0] + hs * .1, s * hs * .48, tete[2] + hs * .1], [tete[0] + hs * .38, s * hs * .48, tete[2] + hs * .1], .02, hs * .32, M.sombre);
    add([tete[0] + hs * .22, s * hs * .5, tete[2] + hs * .12], [tete[0] + hs * .22 + yeux * .6, s * hs * .5, tete[2] + hs * .12], yeux * .5, yeux, M.oeil, tr.has('yeux-nocturnes'));
  }
  const dessus = tete[2] + hs * .5;
  if (M.oreilles > .25) for (const s of [-1, 1]) { const lo = .04 + M.oreilles * .12; add([tete[0] - hs * .2, s * hs * .32, dessus - .01], [tete[0] - hs * .32, s * (hs * .32 + lo * .45), dessus + lo], .016, lo * .55, M.robe); }
  const oc = M.org('cornes'), nc = oc ? oc.nombre : 2, droites = oc && oc.forme === 'droites', ramif = oc ? oc.forme === 'ramifiees' : M.cornes > .6;
  if (M.cornes > .25 && nc === 1) { const lc = .05 + M.cornes * .2, b0 = [nez[0] - .03, 0, nez[2] + hs * .3]; add(b0, [b0[0] + lc * .15, 0, b0[2] + lc * .85], .034, .034, LG.CORNE); }   // une corne, sur le nez
  else if (M.cornes > .25) for (const [r, dx] of nc >= 4 ? [[1, 0], [.6, -hs * .35]] : [[1, 0]]) for (const s of [-1, 1]) {
    const lc = (.05 + M.cornes * .18) * r, b0 = [tete[0] + dx, s * hs * .25, dessus - .01], b1 = [tete[0] + dx - lc * (droites ? .1 : .3), s * (hs * .3 + lc * (droites ? .15 : .35)), dessus + lc * (droites ? .95 : .7)];
    add(b0, b1, .026 * r + .004, .026 * r + .004, LG.CORNE); if (ramif && r === 1) add(b1, [b1[0] - lc * .35, b1[1] + s * lc * .15, b1[2] + lc * .35], .02, .02, LG.CORNE); }
  if (M.crete > .25) { const hc = .03 + M.crete * .09; add([tete[0] - hs * .45, 0, dessus], [tete[0] + hs * .3, 0, dessus], .016, hc, M.accent);
    if (nl > .05) add(lgMix(base, tete, .2), lgMix(base, tete, .75), .014, hc * .6, M.accent); }
  if (M.antennes > .25) for (const s of [-1, 1]) { const la = .08 + M.antennes * .18; add([tete[0] + hs * .2, s * hs * .2, dessus - .01], [tete[0] + hs * .2 + la * .7, s * (hs * .2 + la * .25), dessus + la * .7], .014, .014, M.sombre); }
  // --- la queue ---
  if (M.queue > .08 && !M.serpent) {
    const n = 3, L = .06 + M.queue * .42, prehens = tr.has('queue-prehensile');
    let p = M.bip ? [-Lt * .4, 0, bz + .01] : [xr + .01, 0, bz + Th * .15], a = (M.bip ? -.25 : .25) - couche * .3;
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n * .6, onde = Math.sin(t * (2.2 + allure * 4) + i * .8) * (.12 + .25 * allure) * (1 - couche);
      a += prehens && i ? .7 : -.1;
      const q = [p[0] - Math.cos(a) * L / n, Math.sin(onde) * L / n * (i + 1) * .5, p[2] + Math.sin(a) * L / n];
      add(p, q, Th * .42 * k, Th * .38 * k, i === n - 1 && M.motif === 'bandes' ? M.sombre : M.robe); p = q;
    }
    if (tr.has('dard') && !M.org('aiguillon')) add(p, [p[0] - .02, p[1], p[2] + .06], .03, .03, LG.DARD);
    bout = p;
  }
  if (!bout) bout = M.bip ? [-Lt * .4, 0, bz + .01] : [xr + .01, 0, bz + Th * .15];
  if (M.organes.length) lgOrganes(add, M, { tete, hs, nez, avant, bout, bz, xa, xr, Lt, Th, Wd, couche, allure });
  return B;
}

// (§215) les organes que les mesures ne disent pas, chacun à sa place et à sa taille
function lgOrganes(add, M, P) {
  const { tete, hs, nez, avant, bout, bz, xa, xr, Lt, Th, Wd, couche, allure } = P, og = M.org, sur = (o, f) => { if (o) f(o.taille, o); };
  const d0 = M.bip ? -Lt * .3 : xr + .02, d1 = M.bip ? Lt * .2 : xa - .04, zt = (M.bip ? bz + .02 : bz) + Th * .5;   // le dos
  sur(og('defenses'), k => { const l = .04 + k * .14; for (const s of [-1, 1]) { const a = [nez[0] - .03, s * hs * .24, nez[2] - hs * .25], m = [a[0] + l * .6, a[1] + s * .01, a[2] - l * .25];
    add(a, m, .024, .024, LG.CROC); add(m, [m[0] + l * .35, m[1], m[2] + l * .45], .018, .018, LG.CROC); } });
  sur(og('trompe'), k => { const l = .06 + k * .22, a = [nez[0] - .01, 0, nez[2] - hs * .05], m = [a[0] + l * .45, 0, a[2] - l * .3], b = [m[0] + l * .15, 0, m[2] - l * .5 * (1 - couche * .5)];
    add(a, m, hs * .32, hs * .3, M.robe); add(m, b, hs * .24, hs * .22, M.robe); });
  sur(og('collerette'), k => add([tete[0] - hs * .62, 0, tete[2] + hs * .1], [tete[0] - hs * .55, 0, tete[2] + hs * .1], hs * (1.5 + k * 1.6), hs * (1.2 + k * 1.3), M.accent));
  if (!M.serpent) {
    sur(og('crete', 'dos'), k => add([d0 + .02, 0, zt + .01], [d1, 0, zt + .01], .014, .025 + k * .07, M.accent));
    sur(og('plaques'), k => { const n = 3 + Math.round(k * 3), h = .03 + k * .07;
      for (let i = 0; i < n; i++) { const x = d0 + (d1 - d0) * (i + .5) / n, hh = h * (.7 + .3 * Math.sin(Math.PI * (i + .5) / n)); add([x - .022, 0, zt + hh * .4], [x + .022, 0, zt + hh * .4], .012, hh, M.accent); } });
    sur(og('nageoires'), k => { const xm = (d0 + d1) / 2; add([xm - .04, 0, zt + .02], [xm + .04, 0, zt + .02], .012, .03 + k * .06, M.sombre);
      for (const s of [-1, 1]) add([avant[0] - .06, s * Wd * .5, bz - Th * .25], [avant[0] - .14, s * (Wd * .5 + .03 + k * .06), bz - Th * .35], .02, .03 + k * .04, M.sombre); });
    sur(og('pinces'), k => { const l = .05 + k * .11;
      for (const s of [-1, 1]) { const a = [avant[0] - .02, s * Wd * .45, bz - Th * .2], m = [a[0] + l, s * (Wd * .5 + .02), a[2] - Th * .1 + allure * .01];
        add(a, m, .026, .026, M.sombre); add(m, [m[0] + l * .5, m[1], m[2] + .01], .045 + k * .03, .03, M.sombre); } });
  }
  for (const o of M.organes) if (o.type === 'epines') { const l = .025 + o.taille * .06, n = 3 + Math.round(o.taille * 3);
    if (o.place === 'queue') { for (const s of [-1, 1]) add(bout, [bout[0] - l * .3, bout[1] + s * l, bout[2] + l * .6], .012, .012, LG.CORNE); }
    else if (!M.serpent) for (let i = 0; i < n; i++) { const x = d0 + (d1 - d0) * (i + .5) / n;
      if (o.place === 'flancs') for (const s of [-1, 1]) add([x, s * Wd * .45, bz], [x - .01, s * (Wd * .45 + l), bz + l * .3], .012, .012, LG.CORNE);
      else add([x, 0, zt], [x - .012, 0, zt + l], .012, .012, LG.CORNE); } }
  sur(og('massue'), (k, o) => { const r = .045 + k * .07; add([bout[0] + r * .3, bout[1], bout[2]], [bout[0] - r * .7, bout[1], bout[2]], r, r * .9, M.sombre);
    if (o.forme === 'cloutee') for (const s of [-1, 1]) add([bout[0] - r * .2, bout[1] + s * r * .4, bout[2]], [bout[0] - r * .2, bout[1] + s * r * .85, bout[2] + r * .2], .014, .014, LG.CORNE); });
  sur(og('aiguillon'), (k, o) => { const l = .05 + k * .1, m = [bout[0] + l * .25, bout[1], bout[2] + l * .6], c = o.forme === 'courbe';
    add(bout, m, .03, .03, LG.DARD); add(m, [m[0] + l * (c ? .45 : .2), m[1], m[2] + l * (c ? .1 : .4)], .016, .016, LG.DARD); });
  sur(og('panache'), (k, o) => add(bout, [bout[0] - .06 - k * .14, bout[1], bout[2] + (.06 + k * .14) * .35], o.forme === 'eventail' ? .04 + k * .08 : .03 + k * .04, .03 + k * .05, M.accent));
}

// Le pictogramme : la bête de profil, tournée vers la droite — tronc, pattes, tête, et ce qui la distingue.
function dessinOrvane(d, sp) {
  const M = lgMesures(sp), cy = M.serpent ? 9.5 : M.bip ? 7 : 8 + (.5 - M.Hl) * 3, L = 3 + M.Lt * 9, x0 = 7.5 - L / 2 - (M.queue > .3 ? -1 : 0), x1 = x0 + L;
  const sol = 14;
  if (M.serpent) { for (let x = 2; x <= 13; x++) d.disque(x, cy + Math.sin(x * .9) * 1.2, 1.4 - (13 - x) * .04, M.robe); d.disque(13.4, cy - .8, 1.8, M.robe); d.net(14, Math.round(cy - 1.4), M.oeil); return; }
  if (M.queue > .15) d.ligne(x0 + .5, cy, Math.max(0, x0 - 1 - M.queue * 3), cy - (M.bip ? -1 : 1.5 + M.queue), M.robe, 2);
  const paires = Math.min(4, M.pattes / 2);
  for (let i = 0; i < paires; i++) { const x = M.bip ? 7 + i : x1 - 1.2 - (L - 2) * i / Math.max(1, paires - 1);
    d.ligne(x, cy + 1, x + (M.hexa ? (i % 2 ? -1 : 1) : 0), sol, M.sombre); }
  d.disque((x0 + x1) / 2 - .5, cy, 1.6 + M.Th * 9, M.robe);
  d.disque(x1 - 1.4, cy - (M.bip ? 1 : 0), 1.2 + M.Th * 7, M.robe);
  if (M.carapace > .3) for (let x = Math.round(x0 + 1); x <= Math.round(x1 - 1); x++) d.net(x, Math.round(cy - 1.6 - M.Th * 8), M.sombre);
  if (M.ailes > .3) d.ligne(x1 - 3, cy - 1, x0, cy - 3.5 - M.ailes * 2, M.sombre, 2);
  const hx = Math.min(13.5, x1 + .5 + M.cou * 2.2), hy = cy - 1.5 - M.cou * 4;
  if (M.cou > .15) d.ligne(x1 - 1, cy - 1, hx - .5, hy + .5, M.robe, 2);
  const og = M.org, dos = cy - 1.6 - M.Th * 8;                        // (§215) les organes, d'abord ceux de derrière la tête
  if (og('collerette')) d.disque(hx - 1, hy, 1.8 + og('collerette').taille * 1.6, M.accent);
  if (og('plaques')) for (let x = Math.round(x0 + 1); x <= Math.round(x1 - 1.5); x += 2) d.ligne(x, dos, x, dos - 1 - og('plaques').taille * 1.5, M.accent);
  else if (og('crete', 'dos')) d.ligne(x0 + 1, dos, x1 - 1.5, dos, M.accent);
  if (og('epines', 'dos')) for (let x = Math.round(x0 + 1.5); x <= Math.round(x1 - 1.5); x += 2) d.net(x, Math.round(dos - 1), LG.CORNE);
  if (og('nageoires')) d.ligne((x0 + x1) / 2 - 1, dos, (x0 + x1) / 2, dos - 1.5 - og('nageoires').taille * 1.5, M.sombre);
  d.disque(hx, hy, 1.1 + M.tete * 7, M.robe);
  if (M.museau > .2) d.ligne(hx + 1, hy + .3, Math.min(15, hx + 1.5 + M.museau * 2), hy + .6, M.oiseau ? LG.BEC : M.robe, 2);
  if (M.cornes > .25) d.ligne(hx - .5, hy - 1.4, hx - 2, hy - 2.5 - M.cornes * 2, LG.CORNE);
  if (M.oreilles > .3) d.ligne(hx - .6, hy - 1.2, hx - 1.4, hy - 2 - M.oreilles * 1.5, M.robe);
  if (M.crete > .3) d.ligne(hx - 1.5, hy - 1.6, hx + .5, hy - 1.8, M.accent);
  if (M.antennes > .3) d.ligne(hx + .4, hy - 1, hx + 2, hy - 3, M.sombre);
  if (og('defenses')) d.ligne(hx + 1, hy + 1, Math.min(15, hx + 2 + og('defenses').taille * 1.5), hy + .2, LG.CROC);
  if (og('trompe')) d.ligne(hx + 1, hy + .5, Math.min(15, hx + 2), Math.min(15, hy + 2 + og('trompe').taille * 3), M.robe, 2);
  if (og('pinces')) { const px = Math.min(15, x1 + 1 + og('pinces').taille * 2); d.ligne(x1 - .5, cy + .5, px, cy + .5, M.sombre); d.disque(px, cy + .5, .9, M.sombre); }
  const qx = M.queue > .15 ? Math.max(0, x0 - 1 - M.queue * 3) : x0 + .5, qy = M.queue > .15 ? cy - (M.bip ? -1 : 1.5 + M.queue) : cy;   // le bout de la queue
  if (og('massue')) d.disque(qx, qy, 1 + og('massue').taille * 1.2, M.sombre);
  if (og('aiguillon')) d.ligne(qx, qy, qx + 1.2, qy - 1.5 - og('aiguillon').taille * 1.5, LG.DARD);
  if (og('panache')) d.disque(qx, qy - .5, 1 + og('panache').taille * 1.2, M.accent);
  if (og('epines', 'queue')) { d.net(Math.round(qx), Math.round(qy - 1.5), LG.CORNE); d.net(Math.round(qx + 1), Math.round(qy - 1), LG.CORNE); }
  d.net(Math.round(hx + .6), Math.round(hy - .4), M.oeil);
}
