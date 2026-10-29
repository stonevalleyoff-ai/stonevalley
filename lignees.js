// Stone Valley — LES LIGNÉES D'ORVANE (lignees.js, §210, redessinées au §219)
// Une lignée née dans Orvane n'a pas de dessin : on construit son corps d'après sa fiche (plan.corps, moteur/corps.js
// d'Orvane), avec les mêmes boîtes que les autres bêtes — le moteur les arrondit en formes (§186–188), les variantes
// les recolorent et les grandissent (varier), la fureur rougit leurs yeux. Une seule description sert aux quatre rendus.
//
//   osOrvane(f)         les os d'une bête dont la fiche porte sp.orvane.corps (appelé par osDeBase)
//   dessinOrvane(d, sp) son pictogramme, de profil (16 × 16)
//
// Le corps se lit ainsi : la forme (quadrupède, hexapode, bipède, oiseau, serpent) et le nombre de pattes donnent le
// squelette ; long, haut, cou, tete, museau… ses proportions. (§219) Ce que la bête est les accuse : son régime (un
// brouteur a le cou long et la tête basse, un chasseur le corps bas, la tête forte et les yeux devant), sa masse (une
// bête lourde a des pattes en colonnes et la tête petite, une petite a la tête grosse et l'œil grand), sa façon d'aller
// (un coureur a les pattes longues, un sauteur les cuisses fortes, un fouisseur les bras courts et griffus, un grimpeur
// la queue longue). Une bête d'eau sans pattes est un poisson : nageoires, queue en éventail, pas d'oreilles.
// Les pattes ont trois segments (cuisse, jambe, pied : le jarret plie vers l'arrière), le tronc trois masses (poitrine,
// ventre, croupe), la tête un crâne, un museau et une mâchoire qui s'ouvre. Elle respire, broute en mâchant, tourne la
// tête vers ce qui l'inquiète, bouge les oreilles et la queue, marche, trotte ou galope selon sa vitesse ; un chasseur
// qui traque se baisse. Les traits dominants (sp.orvane.traits) ajoutent leurs organes : carapace, crocs, dard,
// membrane, palmes, glandes, grands yeux de nuit, couleurs d'alerte ; ceux de la fiche (plan.corps.organes, §215) se
// posent à leur place : cornes, défenses, trompe, collerette, crêtes, plaques, épines, nageoires, massue, aiguillon,
// panache, pinces. La conduite (brouter, chasser, fuir, se laisser lier) reste celle de la fiche dont la lignée descend.
'use strict';
const LG = {
  BEC: [214, 172, 92], CORNE: [232, 220, 192], CROC: [244, 240, 228], DARD: [60, 40, 52], GLANDE: [196, 208, 84],
  ALERTE: [[236, 190, 40], [222, 70, 46]], NEZ: [44, 36, 34], BLANC: [246, 244, 236], LANGUE: [214, 72, 86], SABOT: [58, 46, 40],
};
const lgMix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const lgAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lgCl = (v, a, b) => Math.min(b, Math.max(a, v));
// une couleur vive, à l'opposé de la robe : celle des crêtes
function lgAccent(c) {
  const T = typeof OrvaneCorps !== 'undefined' && OrvaneCorps.tourner;
  const v = T ? T(c, 150) : [255 - c[0], 255 - c[1], 255 - c[2]], m = (v[0] + v[1] + v[2]) / 3;
  return v.map(x => Math.max(0, Math.min(255, m + (x - m) * 1.6 + 20)));
}
// un hasard propre à chaque bête (f.num) : ses tics ne battent pas en mesure avec ceux du troupeau
const lgGraine = f => ((f.num ?? 7) * 2.399 + (f.sp?.id?.length || 3) * .7) % 6.2832;
// les mesures d'un corps, une fois pour toutes par fiche (elles ne changent pas d'une image à l'autre)
function lgMesures(sp) {
  const O = sp.orvane; if (O._m) return O._m;
  const c = O.corps || {}, tr = new Set(O.traits || []), q = k => Number.isFinite(c[k]) ? c[k] : .3;
  const forme = c.forme || 'quadrupede', serpent = forme === 'serpent', bip = forme === 'bipede' || forme === 'oiseau';
  const pattes = serpent ? 0 : bip ? 2 : Math.max(2, Math.min(8, c.pattes || (forme === 'hexapode' ? 6 : 4)));
  const C = c.couleurs || {}, loco = new Set(O.locomotion || []), m = Math.max(.001, O.masse || 1);
  const reg = O.regime || ({ c: 'carnivore', h: 'herbivore', o: 'omnivore' })[sp.diet] || 'omnivore';
  // (§219) ce que la bête est
  const chasseur = reg === 'carnivore', brouteur = reg === 'herbivore', filtreur = reg === 'filtreur';
  const lourd = lgCl((Math.log10(m) - .6) / 1.4, 0, 1), petit = lgCl((-.2 - Math.log10(m)) / 1.5, 0, 1);   // 0 sous 4 kg → 1 à 100 kg ; 0 au-dessus de 600 g → 1 à 20 g
  const terre = ['marche', 'course', 'reptation', 'fouissage', 'grimpe'].some(l => loco.has(l));   // (un poisson peut sauter)
  const poisson = serpent && loco.has('nage') && !loco.has('reptation') && !terre;
  const coureur = loco.has('course') ? 1 : 0, sauteur = loco.has('saut') ? 1 : 0, fouisseur = loco.has('fouissage') ? 1 : 0, grimpeur = loco.has('grimpe') ? 1 : 0;
  const M = {
    forme, serpent, bip, oiseau: forme === 'oiseau', hexa: forme === 'hexapode', pattes, tr, loco, m, reg, chasseur, brouteur, filtreur,
    lourd, petit, poisson, coureur, sauteur, fouisseur, grimpeur, nageur: loco.has('nage') ? 1 : 0,
    Lt: (.28 + q('long') * .42) * (1 + .1 * chasseur - .12 * petit + .05 * lourd) * (poisson ? 1.15 : 1),
    Th: (.19 - q('long') * .04) * (1 + .38 * lourd + .15 * petit - .1 * coureur - .06 * chasseur),
    Hl: (.07 + q('haut') * .36) * (tr.has('pattes-longues') ? 1.25 : 1) * (1 + .22 * coureur + .12 * brouteur * lourd - .22 * lourd * (1 - brouteur) - .4 * fouisseur - .18 * petit + .06 * chasseur),
    cou: lgCl(q('cou') * (1 + .5 * brouteur - .3 * chasseur - .25 * lourd * (1 - brouteur)) + .2 * brouteur * (1 - petit), 0, 1),
    tete: (.09 + q('tete') * .09) * (1 + .38 * petit - (.22 + .12 * brouteur) * lourd + .15 * chasseur),
    museau: lgCl(q('museau') + .15 * chasseur + .05 * brouteur - .1 * petit, 0, 1), oreilles: lgCl(q('oreilles') * (1 - .6 * fouisseur) + .12 * brouteur + .15 * petit, 0, 1),
    queue: lgCl((q('queue') + .3 * grimpeur + .15 * chasseur) * (1 - .7 * lourd * (1 - grimpeur)), 0, 1), cornes: q('cornes'),
    crete: q('crete'), ailes: Math.max(q('ailes'), (sp.volant || sp.dragon) ? .8 : 0), carapace: Math.max(q('carapace'), tr.has('carapace') ? .8 : 0),
    antennes: q('antennes'), motif: c.motif || 'uni', organes: [],
    robe: sp.shell, sombre: sp.dark, ventre: sp.ventre || C.ventre || lgMix(sp.shell, [240, 236, 226], .35), oeil: sp.oeil,
  };
  M.Wd = M.Th * (1.08 + .12 * M.lourd);
  M.ep = (.046 + M.Th * .15) * (1 + .7 * lourd - .15 * coureur);        // l'épaisseur d'une patte
  M.griffe = lgMix(M.sombre, LG.CORNE, .45);
  M.dos = lgMix(M.robe, M.sombre, .35);                               // la ligne du dos, un ton plus sombre
  M.oreille = lgMix(M.ventre, [230, 160, 150], .25);                  // l'intérieur de l'oreille
  M.sabot = brouteur && (lourd > .2 || coureur) && !fouisseur;        // un brouteur coureur ou lourd marche sur des sabots
  // (§215) les organes : la liste de la fiche (ou celle qu'on tire de ses proportions) ; les cinq d'avant s'y relisent, par place
  const N = typeof OrvaneCorps !== 'undefined' && OrvaneCorps.normaliser, OL = Array.isArray(c.organes) ? c.organes : N ? N(c).organes : null;
  M.organes = (OL || []).filter(o => o && Number.isFinite(o.taille) && o.taille >= .2);
  M.org = (ty, pl) => M.organes.find(o => o.type === ty && (!pl || o.place === pl));
  if (OL) { const tl = (ty, pl) => (M.org(ty, pl) || {}).taille || 0;
    M.cornes = tl('cornes'); M.crete = tl('crete', 'tete'); M.antennes = tl('antennes');
    M.ailes = Math.max(tl('ailes'), (sp.volant || sp.dragon) ? .8 : 0); M.carapace = Math.max(tl('carapace'), tr.has('carapace') ? .8 : 0); }
  if (poisson) M.oreilles = 0;                                        // un poisson n'a pas d'oreilles
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
// une patte à deux os qui va de la hanche h à la cheville c : le genou est là où les deux longueurs se rejoignent,
// plié vers l'avant (sens > 0) ou vers l'arrière ; dans le plan x-z de la bête
function lgGenou(h, c, l1, l2, sens) {
  const dx = c[0] - h[0], dz = c[2] - h[2], d = lgCl(Math.hypot(dx, dz), .001, (l1 + l2) * .995);
  const a = Math.atan2(dz, dx), b = Math.acos(lgCl((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)) * (sens > 0 ? 1 : -1);
  return [h[0] + Math.cos(a + b) * l1, (h[1] + c[1]) / 2, h[2] + Math.sin(a + b) * l1];
}
// où regarde la bête : vers le joueur quand elle s'inquiète, sinon de petits coups d'œil ; l'angle dans son repère
function lgRegard(f, M, g) {
  let lacet = Math.sin(t * .37 + g) * .35 * Math.max(0, Math.sin(t * .23 + g * 2)), tang = 0;
  const inq = Math.max(f.alarm || 0, f.etat === 'veille' || f.etat === 'acculé' || f.etat === 'défendre' ? .8 : 0);
  if (inq > .15 && typeof P !== 'undefined' && Number.isFinite(f.dir)) {
    const rx = P.x - f.x, ry = P.y - f.y, lx = rx * Math.cos(f.dir) + ry * Math.sin(f.dir), ly = -rx * Math.sin(f.dir) + ry * Math.cos(f.dir);
    lacet = lacet * (1 - inq) + lgCl(Math.atan2(ly, lx), -1.1, 1.1) * inq; tang = .15 * inq;
  }
  return { lacet, tang };
}

function osOrvane(f) {
  const sp = f.sp, M = lgMesures(sp), B = [], tr = M.tr, g = lgGraine(f);
  const add = (a, b, w, h, c, luit) => B.push(luit ? { a, b, w, h, c, luit: 1 } : { a, b, w, h, c });
  if (f.enfoui > 0 && !f.dead) {                                     // enterré (conduites.js, terrier) : un dos de terre, deux yeux
    const tz = Math.max(.04, M.Th * .3), terre = [118, 92, 64];
    add([-M.Lt * .45, 0, tz * .5], [M.Lt * .45, 0, tz * .5], M.Wd * 1.3, tz, terre); add([-M.Lt * .2, 0, tz], [M.Lt * .25, 0, tz], M.Wd * .8, tz * .6, M.robe);
    for (const s of [-1, 1]) add([M.Lt * .3, s * M.tete * .3, tz * 1.2], [M.Lt * .3 + .02, s * M.tete * .3, tz * 1.2], .03, .035, M.oeil);
    return B;
  }
  const v = lgFoulee(f, M), ph = f._lgPh * 6.2832, allure = Math.min(1, v / 1.2), galop = lgCl((v - .9) / .6, 0, 1) * (M.coureur || M.chasseur ? 1 : .5);
  const dk = Math.min(1, (f.dead || 0) * 2.6), dort = f.etat === 'dormir' && !f.dead ? 1 : 0, vol = !!f.enVol;
  const ram = f.ramasse || 0, al = f.alarm || 0, vivant = 1 - dk;
  const { Lt, Th, Wd } = M, couche = Math.max(dk, dort * .85, f.repliT > t ? .9 : 0);   // replié sous sa carapace (conduites.js) : couché, ramassé
  const broute = f.etat === 'brouter' && !couche && v < .3 ? Math.max(0, Math.sin(t * .45 + g)) ** .6 : 0;   // la tête au sol, par moments
  const traque = (f.etat === 'traquer' || (f.etat === 'chasser' && v < 1)) && M.chasseur ? 1 : 0;           // un chasseur qui approche se baisse
  const souffle = Math.sin(t * (2.1 + 2.5 * Math.max(allure, al)) + g) * (1 - couche * .6) * vivant;          // la respiration
  const R = lgRegard(f, M, g), bouche = Math.max(f.etat === 'mord' || f.etat === 'charger' || f.etat === 'acculé' ? .8 : 0, broute * Math.max(0, Math.sin(t * 7 + g)) * .5);
  if (M.poisson) return lgPoisson(f, M, B, add, { v, ph, allure, dk, couche, souffle, R, bouche, g });
  // la hauteur du dos : debout sur ses pattes, couché quand il dort ou qu'il meurt ; un galop tangue, une traque s'aplatit
  const bz0 = M.serpent ? Th * .42 : M.Hl + Th * .5;
  const bz = bz0 + (Th * .5 + .01 - bz0) * couche - ram * .04 - traque * M.Hl * .3 + Math.abs(Math.sin(ph * 2)) * .014 * allure * (1 + galop);
  const tangage = (Math.sin(ph) * .09 * galop - traque * .06 - broute * .05) * (1 - couche);   // l'avant plonge et remonte au galop
  const xa = Lt * .5, xr = -Lt * .5;                                 // l'avant et l'arrière du tronc
  const zx = x => bz + x * tangage;                                  // la ligne du dos penche avec le tangage
  let avant, bout, tz = bz;                                           // où s'attache le cou ; le bout de la queue
  // --- le tronc ---
  if (M.serpent) {
    const n = 10, L = .55 + Lt * 1.1, ond = .045 + .04 * allure, pts = [];
    for (let i = 0; i <= n; i++) { const x = L * (.5 - i / n), y = Math.sin(ph * 2 + i * .75 + t * (v > .05 ? 0 : 1.1)) * ond * (i / n + .25) * vivant;
      pts.push([x, y, bz * (1 - i / n * .3) + (i === 0 ? .015 * (1 - couche) : 0)]); }
    for (let i = 0; i < n; i++) { const k = (1 - i / n * .62) * (i === 0 ? .9 : 1) * (1 + souffle * .02 * (i < 4)); add(pts[i], pts[i + 1], Wd * k, Th * k * .82, i % 2 && M.motif === 'bandes' ? M.sombre : M.robe); }
    for (let i = 0; i < n - 1; i++) add([pts[i][0], pts[i][1], pts[i][2] - Th * .36], [pts[i + 1][0], pts[i + 1][1], pts[i + 1][2] - Th * .36], Wd * .66 * (1 - i / n * .55), .025, M.ventre);
    avant = pts[0]; tz = pts[0][2]; bout = pts[n];
  } else if (M.bip) {
    const pen = M.oiseau ? .22 : .5, hz = bz;                        // un bipède se tient penché ; un oiseau presque à plat
    const H = [-Lt * .35, 0, hz], S = [Lt * .35, 0, hz + Lt * pen * (1 - couche) + traque * -.03];
    const r = 1 + souffle * .025;
    add(H, lgMix(H, S, .5), Wd * 1.12 * r, Th * 1.08 * r, M.robe); add(lgMix(H, S, .42), S, Wd * (M.oiseau ? 1.02 : .92) * r, Th * (M.oiseau ? 1.05 : .95) * r, M.robe);
    add([H[0] + .03, 0, H[2] - Th * .44], [S[0] - .02, 0, S[2] - Th * .44], Wd * .72, .03, M.ventre);
    avant = S; tz = S[2];
  } else if (M.hexa) {                                                // tête, thorax, abdomen en anneaux : la plus grosse masse derrière
    const r = 1 + souffle * .03, na = 3;
    for (let i = 0; i < na; i++) { const x0 = xr - .02 + Lt * .52 * i / na, x1 = xr + Lt * .52 * (i + 1) / na + .01, k = (1.15 - Math.abs(i - .8) * .12) * r;
      add([x0, 0, zx(x0) + .02], [x1, 0, zx(x1) + .02], Wd * k * 1.08, Th * k, i === 1 && M.motif !== 'uni' ? M.sombre : M.robe); }
    add([xr + Lt * .5, 0, zx(0)], [xa, 0, zx(xa)], Wd * .78, Th * .8, M.robe);
    avant = [xa, 0, zx(xa)]; tz = zx(xa);
  } else {                                                            // un quadrupède : croupe, ventre, poitrine
    const r = 1 + souffle * .03, poit = 1 + .12 * (M.coureur + M.chasseur) + .1 * M.lourd;
    add([xr - .02, 0, zx(xr) + .005], [xr + Lt * .4, 0, zx(xr + Lt * .4)], Wd * 1.0, Th * .98, M.robe);                  // la croupe
    add([xr + Lt * .3, 0, zx(0) - Th * .04 * (1 - M.coureur * .7)], [xa - Lt * .3, 0, zx(0) - Th * .04], Wd * 1.04 * r, Th * (1.02 - .1 * M.coureur) * r, M.robe);   // le ventre (rentré chez un coureur)
    add([xa - Lt * .42, 0, zx(xa - Lt * .2) + .01], [xa + .01, 0, zx(xa) + .01], Wd * 1.06 * poit * r, Th * 1.08 * poit * r, M.robe);   // la poitrine
    add([xr + .04, 0, zx(0) - Th * .5], [xa - .05, 0, zx(0) - Th * .5 + .01], Wd * .72, .03, M.ventre);
    if (M.chasseur || M.lourd > .3) add([xa - Lt * .3, 0, zx(xa) + Th * .5], [xa - .02, 0, zx(xa) + Th * .46], Wd * .6, Th * .22, M.dos);   // le garrot, la bosse des épaules
    avant = [xa, 0, zx(xa) + Th * .1]; tz = zx(xa) + Th * .2;
  }
  // --- le dos : carapace, motif, glandes ---
  if (!M.serpent) {
    const x0 = M.bip ? -Lt * .3 : xr + .02, x1 = M.bip ? Lt * .2 : xa - .04, zt = (M.bip ? bz + .02 : zx(0)) + Th * .5;
    if (!M.hexa && M.carapace <= .3 && M.motif !== 'bandes') add([x0 + .03, 0, zt - .008], [x1 - .03, 0, zt - .008], Wd * .3, .012, M.dos);   // la ligne du dos
    if (M.carapace > .3) {
      const n = M.hexa ? 2 : 3, ep = .025 + M.carapace * .045;
      for (let i = 0; i < n; i++) { const a0 = x0 + (x1 - x0) * i / n, a1 = x0 + (x1 - x0) * (i + 1) / n - .008; add([a0, 0, zt + .004], [a1, 0, zt + .008], Wd * (1.18 - .06 * Math.abs(i - (n - 1) / 2)), ep, M.sombre); }
    } else if (M.motif === 'rayures') for (let i = 0; i < 5; i++) { const x = x0 + (x1 - x0) * (.1 + i * .2); for (const s of [-1, 1]) add([x, s * Wd * .3, zt - .01], [x + .02, s * Wd * .52, zt - Th * .3], .018, .014, M.sombre); }
    else if (M.motif === 'taches') for (let i = 0; i < 7; i++) { const x = x0 + (x1 - x0) * (.08 + i * .14), y = ((i * 37) % 5 - 2) / 2 * Wd * .32; add([x, y, zt], [x + .03, y, zt], .04, .012, M.sombre); }
    else if (M.motif === 'bandes') add([x0, 0, zt], [x1, 0, zt], Wd * .35, .014, M.sombre);
    if (tr.has('coloration-aposematique')) for (let i = 0; i < 3; i++) { const x = x0 + (x1 - x0) * (.2 + i * .3); add([x, 0, zt + .006], [x + .03, 0, zt + .006], Wd * 1.06, .014, M.accent); }
    if (tr.has('glande-irritante')) for (const s of [-1, 1]) add([x1 - .02, s * Wd * .32, zt - .01], [x1 + .02, s * Wd * .32, zt + .02], .045, .045, LG.GLANDE);
  }
  // --- les pattes ---
  if (M.pattes && !M.serpent) lgPattes(f, M, add, { bz, zx, xa, xr, ph, allure, galop, couche, vol, dk, traque, avant });
  // --- les ailes : repliées le long du corps, battantes en vol ---
  if (M.ailes > .3) {
    const env = (.15 + M.ailes * .45), bat = vol ? Math.sin(Number.isFinite(f.ph) ? f.ph : t * 10) : 0;
    const ax = M.bip ? avant[0] - .05 : xa - Lt * .3, az = (M.bip ? (avant[2] + bz) / 2 : bz) + Th * (vol ? .35 : .12);
    for (const s of [-1, 1]) {
      if (vol) { const ang = .25 + bat * .9, bout2 = [ax - .06, s * (Wd * .45 + env * Math.cos(ang)), az + env * Math.sin(ang)];
        add([ax, s * Wd * .45, az], lgMix([ax, s * Wd * .45, az], bout2, .55), env * .5, .02, M.robe); add(lgMix([ax, s * Wd * .45, az], bout2, .5), bout2, env * .42, .016, M.sombre); }
      else { add([ax + .02, s * Wd * .52, az], [ax - env * .55, s * Wd * .58, az - .01], .02, Th * .62, M.robe); add([ax - env * .3, s * Wd * .56, az - .02], [ax - env * .9, s * Wd * .52, az - .03 - env * .08], .016, Th * .45, M.sombre); }
    }
  }
  // --- le cou et la tête ---
  const T = lgTete(f, M, add, { avant, tz, couche, ram, al, allure, broute, traque, ph, R, bouche, g, bz });
  // --- la queue ---
  if (M.queue > .08 && !M.serpent) bout = lgQueue(f, M, add, { bz, zx, xr, Lt, Th, couche, allure, al, galop, traque, g });
  if (!bout) bout = M.bip ? [-Lt * .4, 0, bz + .01] : [xr + .01, 0, bz + Th * .15];
  if (M.organes.length) lgOrganes(add, M, { tete: T.tete, hs: T.hs, nez: T.nez, avant, bout, bz, xa, xr, Lt, Th, Wd, couche, allure });
  if (vol && f.roll) { const c = Math.cos(f.roll), s = Math.sin(f.roll), T = p => [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];   // (§220) en vol, elle vire sur l'aile
    for (const o of B) { o.a = T(o.a); o.b = T(o.b); } }
  return B;
}
// les pattes : trois segments, la cuisse épaisse ; les avant plient le coude en arrière, les arrière le genou en avant et
// le jarret en arrière ; la foulée suit l'allure (pas, trot, galop : au galop, les deux avant puis les deux arrière)
function lgPattes(f, M, add, A) {
  const { bz, zx, xa, xr, ph, allure, galop, couche, vol, dk, traque } = A, { Lt, Th, Wd } = M;
  const paires = M.pattes / 2, plie = Math.max(couche, vol ? 1 : 0), amp = (.5 + .25 * galop) * allure * (1 - plie);
  const ecart = M.hexa ? .12 + M.Hl * .3 : .012 + M.lourd * .02, ep = M.hexa ? .032 : M.ep;
  for (let i = 0; i < paires; i++) for (const s of [-1, 1]) {
    const arriere = !M.bip && i === paires - 1 && paires > 1, devant = !M.bip && i === 0;
    const xh = M.bip ? -Lt * .18 : paires === 1 ? 0 : xa - .06 - (Lt - .12) * i / (paires - 1);
    // la phase de chaque patte : diagonales au pas et au trot, paires ensemble au galop
    const offPas = M.bip ? (s > 0 ? 0 : .5) : M.hexa ? ((i % 2) * .5 + (s > 0 ? 0 : .5)) % 1 : ((i * .5) + (s > 0 ? 0 : .5)) % 1;
    const offGal = (arriere ? .5 : 0) + (s > 0 ? .08 : 0), off = offPas * (1 - galop) + offGal * galop;
    const a = Math.sin(ph + off * 6.2832) * amp, lev = Math.max(0, Math.cos(ph + off * 6.2832)) * (.05 + .03 * galop) * allure * (1 - plie);
    const hz = (M.bip ? bz - Th * .2 : zx(xh) - Th * .25), hy = s * Wd * .42;
    const sol = plie * (M.hexa ? .03 : Th * .25), pied = [xh + a * M.Hl * .75 + (dk ? .05 * s : 0), s * (Wd * .5 + ecart + dk * .08), lev + sol];
    if (M.hexa) {                                                      // une patte d'insecte : le fémur monte, le tibia descend en s'écartant
      const genou = [xh + a * M.Hl * .3, s * (Wd * .5 + ecart * .75), Math.max(hz + .035, pied[2] + M.Hl * .75)];
      add([xh, hy, hz], genou, ep, ep, M.sombre); add(genou, pied, ep * .75, ep * .75, M.sombre);
      if (M.fouisseur && i === 0) add(pied, [pied[0] + .03, pied[1], pied[2] + .01], .03, .015, M.griffe);
      continue;
    }
    const cuisse = arriere || M.bip ? 1.45 + .2 * M.sauteur : 1.2;     // la cuisse, épaisse, surtout derrière
    const lH = (hz - pied[2]) || .05, l1 = lH * (arriere || M.bip ? .42 : .5) * (1 + .1 * M.sauteur), l2 = lH * (arriere || M.bip ? .45 : .5);
    const pd = arriere || M.bip ? lH * (.26 + .1 * M.sauteur) : lH * .12;   // le pied (le métatarse derrière, le paturon devant)
    const cheville = [pied[0] - (arriere || M.bip ? pd * .45 : -pd * .2), pied[1], pied[2] + pd * (arriere || M.bip ? .9 : 1)];
    const genou = lgGenou([xh, hy, hz], cheville, l1, l2, arriere || M.bip ? 1 : -1);
    if (plie) { genou[2] = Math.max(genou[2], pied[2] + .02); }
    add([xh, hy, hz + ep * .3], genou, ep * cuisse, ep * cuisse * 1.05, M.robe);   // la cuisse, de la couleur du corps
    add(genou, cheville, ep * .82, ep * .82, M.sombre); add(cheville, pied, ep * .72, ep * .72, M.sombre);
    if (M.sabot) add([pied[0] - .012, pied[1], pied[2] + .008], [pied[0] + .022, pied[1], pied[2] + .008], ep * .95, .03, LG.SABOT);   // un sabot
    else if (lgTr(M, 'palmes')) add([pied[0] - .02, pied[1], pied[2] + .006], [pied[0] + .045, pied[1], pied[2] + .006], .075, .012, M.sombre);
    else { const lp = .03 + .02 * M.fouisseur * devant; add([pied[0] - .015, pied[1], pied[2] + .01], [pied[0] + lp, pied[1], pied[2] + .01], ep * 1.05, .024, M.sombre);   // une patte, ses griffes
      if (M.chasseur || (M.fouisseur && devant)) add([pied[0] + lp - .005, pied[1], pied[2] + .006], [pied[0] + lp + .008 + .02 * M.fouisseur, pied[1], pied[2] + .002], ep * .7, .01, M.griffe); }
  }
  if (M.tr.has('membrane-planante') && !M.bip) for (const s of [-1, 1]) add([xr + .03, s * Wd * .6, bz - .01], [xa - .04, s * Wd * .6, bz - .01], .012, Math.min(.12, M.Hl * .6), lgMix(M.ventre, M.robe, .3));
  if (M.bip && !M.oiseau && M.ailes < .3) for (const s of [-1, 1]) { const ep = A.avant; add([ep[0] - .03, s * Wd * .5, ep[2] - .02], [ep[0] + .04, s * Wd * .55, ep[2] - .07 + allure * .02], .03, .03, M.robe);   // de petits bras
    add([ep[0] + .04, s * Wd * .55, ep[2] - .07], [ep[0] + .07, s * Wd * .55, ep[2] - .05], .024, .02, M.griffe); }
}
const lgTr = (M, k) => M.tr.has(k);
// le cou et la tête : un crâne, un museau, une mâchoire qui s'ouvre (pour mordre, pour mâcher), un nez, des yeux qui
// brillent, des oreilles qui bougent ; la tête suit le regard (lgRegard), descend brouter, se lève à l'alarme
function lgTete(f, M, add, A) {
  const { avant, tz, couche, ram, al, allure, broute, traque, ph, R, bouche, g } = A, { Th } = M;
  const hs = M.tete, lev = (al * .06 + (M.bip ? .03 : 0)) * (1 - couche);
  const nl = M.cou * .34 + (M.serpent ? 0 : .02), ang = (M.serpent ? .3 : M.chasseur ? .35 : M.brouteur ? .95 : .7) + al * .35 - couche * .9 - ram * .4 - broute * 1.7 - traque * .45;
  const base = [avant[0] - (M.serpent ? 0 : .02), 0, tz];
  const ly = Math.sin(R.lacet) * nl * .9, lx = Math.cos(R.lacet);
  const tete = [base[0] + Math.cos(ang) * nl * lx + hs * .45 * lx, ly + Math.sin(R.lacet) * hs * .3, base[2] + Math.sin(ang) * nl + lev + (M.serpent ? .03 : 0) + Math.sin(ph * 2) * .01 * allure];
  if (broute) tete[2] = Math.max(hs * .55, tete[2]);
  if (couche) tete[2] = Math.max(hs * .5 + .01, tete[2] - couche * .06);
  const D = [Math.cos(R.lacet), Math.sin(R.lacet), -R.tang * .5 - broute * .35];   // où pointe le museau
  const P = (fx, fy, fz) => [tete[0] + D[0] * fx - D[1] * fy, tete[1] + D[1] * fx + D[0] * fy, tete[2] + fz + D[2] * fx];   // un point de la tête, dans son repère
  if (nl > .03) { const m1 = lgMix(base, tete, .55); m1[2] += nl * .12;
    add(base, m1, Th * .55 + .02, Th * .6 + .02, M.robe); add(m1, P(-hs * .3, 0, -hs * .05), Th * .45 + .02, Th * .48 + .02, M.robe); }
  add(P(-hs * .5, 0, 0), P(hs * .35, 0, 0), hs * 1.05, hs, M.robe);   // le crâne
  let nez = P(hs * .38, 0, -hs * .12);
  if (M.hexa) { if (!M.brouteur) for (const s of [-1, 1]) { const o = Math.sin(t * 3 + g) * .2 * bouche; const a0 = P(hs * .4, s * hs * .25, -hs * .2);
      add(a0, lgAdd(a0, [hs * .35, -s * hs * (.12 + o), -hs * .05]), .016, .016, M.griffe); } }
  else if (M.museau > .1) {
    const ml = .03 + M.museau * .14 * (M.chasseur ? 1.15 : 1);
    if (M.oiseau) { const crochu = M.chasseur ? 1 : 0, b1 = P(hs * .38 + ml * .7, 0, -hs * .1);
      add(nez, b1, hs * .42, hs * .38, LG.BEC); add(b1, P(hs * .38 + ml * (1 + .1 * crochu), 0, -hs * (.12 + .22 * crochu)), hs * .2, hs * .2, LG.BEC); nez = b1; }
    else {
      const bout = P(hs * .38 + ml, 0, -hs * .2);
      add(nez, bout, hs * (M.chasseur ? .62 : .55), hs * .42, M.robe);                                 // le museau
      add(P(hs * .4, 0, -hs * .42 - bouche * .02), P(hs * .36 + ml * .92, 0, -hs * .42 - bouche * hs * .55), hs * .44, hs * .16, M.ventre);   // la mâchoire
      add(lgAdd(bout, [0, 0, .006]), lgAdd(bout, [.012, 0, .006]), hs * .3, hs * .22, LG.NEZ);      // la truffe
      if (M.chasseur && bouche > .3) for (const s of [-1, 1]) add(P(hs * .3 + ml * .8, s * hs * .14, -hs * .32), P(hs * .3 + ml * .8, s * hs * .14, -hs * .44), .012, .012, LG.CROC);
      nez = bout;
    }
  }
  if (M.tr.has('crocs-allonges')) for (const s of [-1, 1]) add(lgAdd(nez, [-.01, s * hs * .16, -hs * .15]), lgAdd(nez, [-.005, s * hs * .16, -hs * .15 - .05]), .018, .018, LG.CROC);
  // les yeux (la couleur exacte de la fiche : la fureur et les robes les reconnaissent) : devant chez un chasseur, sur les
  // côtés chez une proie ; un reflet ; plus grands chez une petite bête ou une bête de nuit
  const yeux = (M.tr.has('yeux-nocturnes') ? .055 : .03 + M.tete * .08) * (1 + .3 * M.petit), cote = M.chasseur ? .34 : .5, av = M.chasseur ? .3 : .18;
  const cligne = (t * .9 + g) % 5 < .12 ? .2 : 1;                     // un clignement, de temps en temps
  for (const s of [-1, 1]) {
    if (M.motif === 'masque') add(P(hs * .05, s * hs * .48, hs * .1), P(hs * .36, s * hs * .48, hs * .1), .02, hs * .34, M.sombre);
    const o = P(hs * av, s * hs * cote, hs * .14);
    add(o, lgAdd(o, [yeux * .5 * D[0], yeux * .5 * D[1] + s * .006, 0]), yeux * .62, yeux * cligne, M.oeil, M.tr.has('yeux-nocturnes'));
    if (cligne === 1) add(lgAdd(o, [yeux * .2 * D[0], s * yeux * .32, yeux * .24]), lgAdd(o, [yeux * .3 * D[0], s * yeux * .32, yeux * .24]), .012, .012, LG.BLANC, 1);   // le reflet
  }
  const dessus = tete[2] + hs * .5;
  // les oreilles : de côté et larges chez un brouteur, droites et pointues chez un chasseur ; elles se dressent à l'alarme
  // et frémissent par moments
  if (M.oreilles > .2) { const lo = .04 + M.oreilles * .14 * (1 + .3 * M.petit), fr = Math.max(0, Math.sin(t * 3.1 + g * 3)) ** 8 * .5;
    for (const s of [-1, 1]) { const dresse = lgCl(.35 + al * .6 + (M.chasseur ? .35 : 0) - couche * .4 - broute * .15, 0, 1), ouv = (M.brouteur ? .75 : .35) * (1 - dresse * .5) + (s > 0 ? fr : 0) * .3;
      const b0 = P(-hs * .25, s * hs * .32, hs * .42), b1 = lgAdd(b0, [-lo * (.35 - dresse * .25), s * lo * ouv, lo * (.45 + dresse * .55)]);
      add(b0, b1, .018, lo * (M.chasseur ? .5 : .62), M.robe); add(lgAdd(b0, [.006, -s * .004, .006]), lgMix(b0, b1, .8), .012, lo * (M.chasseur ? .32 : .42), M.oreille); } }
  const oc = M.org('cornes'), nc = oc ? oc.nombre : 2, droites = oc && oc.forme === 'droites', ramif = oc ? oc.forme === 'ramifiees' : M.cornes > .6;
  if (M.cornes > .25 && nc === 1) { const lc = .05 + M.cornes * .2, b0 = lgAdd(nez, [-.03, 0, hs * .3]); add(b0, [b0[0] + lc * .15, b0[1], b0[2] + lc * .85], .034, .034, LG.CORNE); }   // une corne, sur le nez
  else if (M.cornes > .25) for (const [r, dx] of nc >= 4 ? [[1, 0], [.6, -hs * .35]] : [[1, 0]]) for (const s of [-1, 1]) {
    const lc = (.05 + M.cornes * .18) * r, b0 = P(dx, s * hs * .25, hs * .48), b1 = [b0[0] - lc * (droites ? .1 : .3), b0[1] + s * lc * (droites ? .15 : .35), b0[2] + lc * (droites ? .95 : .7)];
    const mid = lgMix(b0, b1, .5); add(b0, mid, .03 * r + .006, .03 * r + .006, LG.CORNE); add(mid, b1, .02 * r + .004, .02 * r + .004, LG.CORNE);
    if (ramif && r === 1) add(b1, [b1[0] - lc * .35, b1[1] + s * lc * .15, b1[2] + lc * .35], .018, .018, LG.CORNE); }
  if (M.crete > .25) { const hc = .03 + M.crete * .09; add(P(-hs * .45, 0, hs * .5), P(hs * .3, 0, hs * .5), .016, hc, M.accent);
    if (nl > .05) add(lgMix(base, tete, .2), lgMix(base, tete, .75), .014, hc * .6, M.accent); }
  if (M.antennes > .25) for (const s of [-1, 1]) { const la = .08 + M.antennes * .18, o = Math.sin(t * 2.3 + g + s) * .03; const b0 = P(hs * .2, s * hs * .2, hs * .45);
    const m1 = lgAdd(b0, [la * .35, s * la * .12, la * .45]); add(b0, m1, .014, .014, M.sombre); add(m1, lgAdd(m1, [la * .45, s * (la * .15 + o), la * .15 + o]), .011, .011, M.sombre); }
  return { tete, hs, nez };
}
// la queue : effilée en cinq anneaux ; un toupet chez un brouteur, un pinceau touffu chez un chasseur ou un omnivore,
// longue chez un grimpeur, aplatie en rame chez un nageur, courte chez une bête lourde ; elle balance, se lève à l'alarme
function lgQueue(f, M, add, A) {
  const { bz, zx, xr, Lt, Th, couche, allure, al, galop, traque, g } = A;
  const n = 5, L = .06 + M.queue * .46, prehens = M.tr.has('queue-prehensile'), touffu = (M.chasseur || M.reg === 'omnivore') && !M.lourd && !M.nageur ? 1 : 0;
  let p = M.bip ? [-Lt * .4, 0, bz + .01] : [xr + .01, 0, zx(xr) + Th * .2];
  let a = (M.bip ? -.2 : M.brouteur ? -.55 : M.chasseur ? .1 : -.15) - .7 * M.lourd - couche * .3 + al * .7 - traque * .1 + galop * .4;
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n * (touffu ? .2 : .65), onde = Math.sin(t * (1.8 + allure * 4 + al * 5) + i * .8 + g) * (.1 + .22 * allure + .25 * al) * (1 - couche);
    a += prehens && i > 1 ? .55 : M.grimpeur ? .08 : -.06;
    const q = [p[0] - Math.cos(a) * L / n, p[1] + Math.sin(onde) * L / n * (i + 1) * .45, p[2] + Math.sin(a) * L / n];
    const e = Th * (touffu ? .32 + i * .04 : .38) * k * (i === 0 ? 1.2 : 1);
    add(p, q, e * (M.nageur && !touffu ? 1.6 : 1), e * (M.nageur && !touffu ? .5 : 1), i === n - 1 && M.motif === 'bandes' ? M.sombre : i >= 3 && touffu ? lgMix(M.robe, M.ventre, .4) : M.robe); p = q;
  }
  if (M.brouteur && !M.nageur && M.queue > .2) add(p, [p[0] - .03, p[1], p[2] - .03], .045, .05, M.sombre);   // le toupet
  if (M.tr.has('dard') && !M.org('aiguillon')) add(p, [p[0] - .02, p[1], p[2] + .06], .03, .03, LG.DARD);
  return p;
}
// un poisson : un fuseau qui ondule de la tête à la queue, une nageoire sur le dos, deux sur les côtés, une queue en
// éventail ; une bouche qui s'ouvre (grande chez un filtreur), un œil sur chaque flanc
function lgPoisson(f, M, B, add, A) {
  const { v, allure, dk, couche, souffle, bouche, g } = A, { Lt, Th, Wd } = M;
  const L = .35 + Lt * 1.15, n = 5, haut = Th * 1.2, bz = haut * .6 + .02 + (1 - couche) * .03, vit = .4 + allure;
  const pts = []; for (let i = 0; i <= n; i++) { const x = L * (.5 - i / n), y = Math.sin(t * 5 * vit + g - i * .9) * (.012 + .035 * (i / n) ** 1.5) * (1 + allure) * (1 - dk); pts.push([x, y, bz]); }
  const prof = i => Math.sin(Math.PI * (i + .5) / n) ** .7;           // le fuseau : épais au tiers avant, fin vers la queue
  for (let i = 0; i < n; i++) { const k = .35 + prof(i) * .75 * (1 - (i > 2 ? (i - 2) * .12 : 0)), r = 1 + souffle * .02;
    add(pts[i], pts[i + 1], Wd * k * .85 * r, haut * k * r, i % 2 && M.motif === 'bandes' ? M.sombre : M.robe); }
  for (let i = 0; i < n - 1; i++) add([pts[i][0], pts[i][1], bz - haut * .38 * prof(i)], [pts[i + 1][0], pts[i + 1][1], bz - haut * .38 * prof(i + 1)], Wd * .5 * prof(i), .022, M.ventre);
  if (M.motif === 'taches') for (let i = 0; i < 5; i++) { const x = L * (.3 - i * .14); add([x, Wd * .3 * ((i % 2) * 2 - 1), bz + haut * .2], [x + .02, Wd * .3 * ((i % 2) * 2 - 1), bz + haut * .2], .03, .03, M.sombre); }
  if (M.motif === 'rayures') for (let i = 0; i < 4; i++) { const x = L * (.25 - i * .13); add([x, 0, bz + haut * .3], [x, 0, bz - haut * .25], Wd * .95 * prof(1), .02, M.sombre); }
  // les nageoires
  const dor = .03 + (M.org('nageoires')?.taille || .3) * .08;
  add([pts[1][0] + .02, pts[1][1], bz + haut * .45], [pts[2][0] - .02, pts[2][1], bz + haut * .45 + dor * .3], .012, dor, M.sombre);   // la dorsale
  for (const s of [-1, 1]) { const o = Math.sin(t * 4 + g + s) * .02; add([pts[1][0] - .01, s * Wd * .38, bz - haut * .15], [pts[1][0] - .06, s * (Wd * .38 + .05 + o), bz - haut * .3], .014, .04, M.sombre); }   // les pectorales
  const q = pts[n], qa = Math.sin(t * 5 * vit + g - n * .9) * .3 * (1 - dk);   // la queue en éventail, qui bat
  for (const s of [-1, 1]) add(q, [q[0] - .07, q[1] + Math.sin(qa) * .04, q[2] + s * (.045 + Th * .3)], .012, .045 + Th * .2, M.sombre);
  // la tête : la bouche, l'œil
  const tt = pts[0], ouv = Math.max(bouche, M.filtreur ? .4 + Math.sin(t * 2 + g) * .2 : 0);
  add([tt[0] - .01, tt[1], bz - haut * .05], [tt[0] + .025, tt[1], bz - haut * .05 - ouv * .02], Wd * .45, haut * .2, M.ventre);
  if (M.tr.has('crocs-allonges') || M.chasseur) for (const s of [-1, 1]) add([tt[0] + .015, s * Wd * .12, bz - haut * .02], [tt[0] + .015, s * Wd * .12, bz - haut * .12], .01, .01, LG.CROC);
  const ye = .03 + M.tete * .1 * (1 + .3 * M.petit);
  for (const s of [-1, 1]) { const o = [tt[0] - L * .06, s * Wd * .36, bz + haut * .12]; add(o, [o[0] + ye * .4, o[1] + s * .006, o[2]], ye * .7, ye, M.oeil, M.tr.has('yeux-nocturnes'));
    add([o[0] + ye * .15, o[1] + s * ye * .35, o[2] + ye * .25], [o[0] + ye * .25, o[1] + s * ye * .35, o[2] + ye * .25], .01, .01, LG.BLANC, 1); }
  if (M.organes.length) lgOrganes(add, M, { tete: tt, hs: haut * .6, nez: [tt[0] + .03, tt[1], bz], avant: tt, bout: q, bz, xa: L * .5, xr: -L * .5, Lt: L, Th, Wd, couche, allure });
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
