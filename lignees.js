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
  ALERTE: [[236, 190, 40], [222, 70, 46]], NEZ: [44, 36, 34], BLANC: [246, 244, 236], LANGUE: [214, 72, 86], SABOT: [58, 46, 40], PUPILLE: [30, 24, 30],
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
    crete: q('crete'), ailes: q('ailes'), carapace: Math.max(q('carapace'), tr.has('carapace') ? .8 : 0),
    antennes: q('antennes'), motif: c.motif || 'uni', organes: [],
    robe: sp.shell, sombre: sp.dark, ventre: sp.ventre || C.ventre || lgMix(sp.shell, [240, 236, 226], .35), oeil: sp.oeil,
  };
  // (§226) LE STYLE DE STONE VALLEY : la puissance de la lignée (orvane-sv.js, puissances : son rang dans le monde, de 0 à 1) règle son
  // allure. En bas, une bête mignonne : la tête et les yeux grands, le corps rond et court sur pattes, la robe adoucie, les organes à
  // l'état de bourgeons. En haut, une bête épique : la tête petite et forte, les pattes longues, les organes exagérés, la robe
  // contrastée, des marques qui luisent, des épines sur le dos. Entre les deux, la silhouette d'Orvane telle quelle.
  const pu = Number.isFinite(O.puissance) ? O.puissance : .5;
  M.cute = lgCl((.35 - pu) / .35, 0, 1); M.epique = lgCl((pu - .65) / .35, 0, 1);
  if (M.cute || M.epique) {
    const cu = M.cute, ep = M.epique;
    M.tete *= 1 + .6 * cu - .12 * ep; M.Th *= 1 + .32 * cu + .06 * ep; M.Lt *= 1 - .26 * cu + .06 * ep; M.Hl *= 1 - .36 * cu + .14 * ep;
    M.museau = lgCl(M.museau * (1 - .65 * cu) + .1 * ep, 0, 1); M.oreilles = lgCl(M.oreilles * (1 + .5 * cu) + .1 * cu, 0, 1); M.queue = lgCl(M.queue * (1 - .25 * cu + .15 * ep), 0, 1);
    M.cou *= 1 - .4 * cu;
    const doux = c => lgMix(c, [252, 246, 236], .22 * cu), fort = c => { const g = (c[0] + c[1] + c[2]) / 3; return c.map(v => lgCl(g + (v - g) * (1 + .45 * ep) - 14 * ep, 0, 255)); };
    M.robe = fort(doux(M.robe)); M.sombre = lgMix(fort(M.sombre), [26, 20, 28], .25 * ep); M.ventre = doux(M.ventre);
  }
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
    M.ailes = tl('ailes'); M.carapace = Math.max(tl('carapace'), tr.has('carapace') ? .8 : 0); }
  if (M.cute || M.epique) {                                           // (§226) les organes : des bourgeons, ou exagérés
    const cu = M.cute, ep = M.epique;
    M.organes = M.organes.map(o => ({ ...o, taille: o.taille * (1 - .35 * cu + .7 * ep) })).filter(o => o.taille >= .2);
    const tl = (ty, pl) => (M.org(ty, pl) || {}).taille || 0;
    M.cornes = Math.max(tl('cornes'), M.cornes * (1 - .35 * cu)); M.crete = Math.max(tl('crete', 'tete'), M.crete * (1 + .5 * ep));
    M.lueur = ep > .3 ? lgMix(lgAccent(M.robe), [255, 240, 200], .25) : null;   // les marques qui luisent
    M.epines = ep > .45 && M.carapace <= .3 && !M.org('epines') && !M.org('plaques');   // des épines sur le dos
  }
  if (poisson) M.oreilles = 0;                                        // un poisson n'a pas d'oreilles
  M.accent = tr.has('coloration-aposematique') ? LG.ALERTE[(sp.id.length) % 2] : lgAccent(M.robe);
  M.corne = LG.CORNE; M.corneLuit = 0;
  // (§237) LA FANTAISIE : l'élément de la lignée (orvane-sv.js, fantaisie) transforme chaque trait. Tout le monde en a un peu — des yeux
  // qui luisent, des runes, un bout de queue élémentaire, une crinière, une gemme au front pour les mignonnes —, et plus on est puissant,
  // plus il y en a : des cornes de cristal, de glace ou d'obsidienne qui poussent même à qui n'en avait pas, des éclats qui tournent
  // autour du corps, une gemme frontale, des ailes d'éther pour les plus grands, une aura qui ne s'éteint pas.
  if (O.el) {
    const el = M.el = O.el, I = M.fant = lgCl(.3 + .7 * pu, 0, 1);
    M.lueurEl = O.lueurEl || M.accent; M.partEl = O.partEl || '#ffffff';
    M.lueur = lgMix(M.lueurEl, [255, 255, 255], .12);
    M.accent = tr.has('coloration-aposematique') ? M.accent : lgMix(M.lueurEl, M.robe, .15);
    M.corne = O.corneEl || LG.CORNE; M.corneLuit = ['givre', 'cristal', 'aurore', 'orage', 'abysse'].includes(el) ? 1 : 0;
    const quad = !serpent && !poisson && !M.oiseau && !M.hexa;
    if (M.cornes > .25) M.cornes = Math.min(1.2, M.cornes * (1.2 + .5 * M.epique));
    else if (quad && pu > .5) M.cornes = .3 + .55 * lgCl((pu - .5) / .5, 0, 1);   // une couronne de cornes, à qui n'en avait pas
    M.criniere = quad || M.bip || serpent ? I : 0;
    M.queueEl = I; M.gemme = pu < .35 ? 'bourgeon' : pu > .62 ? 'oeil' : null;
    M.orbites = pu >= .6 ? 1 + Math.round(3 * (pu - .6) / .4) : 0;
    M.ether = pu >= .88 && quad;                                       // des ailes d'éther, repliées sur le dos
    M.aura = .25 + 2.6 * pu;                                           // des particules par seconde
    if (!M.epines && pu > .6 && M.carapace <= .3 && !M.org('epines') && !M.org('plaques') && !M.oiseau) M.epines = true;
  }
  if (M.hexa && M.Hl > .3) M.Hl = .3;                               // un hexapode se tient bas : ses pattes s'écartent plutôt
  return (O._m = M);
}
// la foulée : avancée d'après le chemin parcouru, comme une roue (aucun autre système ne la tient pour ces bêtes)
function lgFoulee(f, M) {
  const dtl = Math.min(.1, Math.max(0, t - (f._lgT ?? t))); f._lgT = t;
  const dx = f.x - (f._lgX ?? f.x), dy = f.y - (f._lgY ?? f.y); f._lgX = f.x; f._lgY = f.y;
  const d = Math.min(.5, Math.hypot(dx, dy)), k = echB(f) || 1;
  const vInst = dtl > 0 ? d / dtl : 0; f._lgV = (f._lgV || 0) + (vInst - (f._lgV || 0)) * Math.min(1, dtl * 8);
  const avant = f._lgPh || 0; f._lgPh = (avant + d / Math.max(.15, (.22 + M.Hl * 1.4) * k * (1 + .35 * (M.epique || 0)))) % 1;   // (§226) une épique : de grands pas
  // (§226) une épique lourde pose le pied : un nuage de poussière à chaque pas
  if ((M.epique || 0) > (M.el ? .25 : .5) && !f.dead && !f.enVol && d > .01 && Math.floor(avant * 2) !== Math.floor(f._lgPh * 2) && typeof burst === 'function')
    try { burst(f.x, f.y, (f.z || 0) + .05, 2 + Math.round(M.epique * 2), M.el ? M.partEl : '#9a8a70'); } catch (e) { }   // (§237) braises, givre, étincelles…
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
  const add = (a, b, w, h, c, luit, lu) => B.push(luit ? (lu ? { a, b, w, h, c, luit: 1, lueur: 1 } : { a, b, w, h, c, luit: 1 }) : { a, b, w, h, c });
  if (f.enfoui > 0 && !f.dead) {                                     // enterré (conduites.js, terrier) : un dos de terre, deux yeux
    const tz = Math.max(.04, M.Th * .3), terre = [118, 92, 64];
    add([-M.Lt * .45, 0, tz * .5], [M.Lt * .45, 0, tz * .5], M.Wd * 1.3, tz, terre); add([-M.Lt * .2, 0, tz], [M.Lt * .25, 0, tz], M.Wd * .8, tz * .6, M.robe);
    for (const s of [-1, 1]) add([M.Lt * .3, s * M.tete * .3, tz * 1.2], [M.Lt * .3 + .02, s * M.tete * .3, tz * 1.2], .03, .035, M.oeil);
    return B;
  }
  const v = lgFoulee(f, M), ph = f._lgPh * 6.2832, allure = Math.min(1, v / 1.2), galop = lgCl((v - .9) / .6, 0, 1) * (M.coureur || M.chasseur ? 1 : .5);
  // (§226) LES ÉTATS SE FONDENT : se coucher, traquer, brouter, regarder ne passent plus d'une image à l'autre
  const dtA = Math.min(.1, Math.max(0, t - (f._lgA ?? t))); f._lgA = t;
  const lisse = (k, c, vit) => { const x = Number.isFinite(f[k]) ? f[k] : c; return (f[k] = x + (c - x) * Math.min(1, dtA * vit)); };
  const cu = M.cute || 0, ep = M.epique || 0;
  const dk = Math.min(1, (f.dead || 0) * 2.6), dort = lisse('_lgDort', f.etat === 'dormir' && !f.dead ? 1 : 0, 2.2), vol = !!f.enVol;
  const ram = f.ramasse || 0, al = f.alarm || 0, vivant = 1 - dk;
  const { Lt, Th, Wd } = M, couche = Math.max(dk, dort * .85, f.repliT > t ? .9 : 0);   // replié sous sa carapace (conduites.js) : couché, ramassé
  const broute = lisse('_lgBr', f.etat === 'brouter' && couche < .3 && v < .3 ? 1 : 0, 3) * Math.max(0, Math.sin(t * .45 + g)) ** .6;   // la tête au sol, par moments
  const traque = lisse('_lgTr', (f.etat === 'traquer' || (f.etat === 'chasser' && v < 1)) && M.chasseur ? 1 : 0, 5);   // un chasseur qui approche se baisse
  // la respiration : vive et ample chez une mignonne, lente et profonde chez une épique
  const souffle = Math.sin(t * (2.1 + 2.5 * Math.max(allure, al)) * (1 + .3 * cu - .35 * ep) + g) * (1 - couche * .6) * vivant * (1 + .6 * cu + .5 * ep);
  const R = lgRegard(f, M, g); R.lacet = lisse('_lgLacet', R.lacet, 7 - 5 * ep); R.tang = lisse('_lgTang', R.tang, 6);   // une épique tourne la tête lentement
  const geste = lgGeste(f, M, allure, al, vol);                        // (§234) un geste de repos
  R.lacet += Math.sin(t * 28) * .45 * geste.ebroue; R.tang -= .45 * geste.rugit;   // elle s'ébroue ; elle lève la tête pour rugir
  const bouche = Math.max(f.etat === 'mord' || f.etat === 'charger' || f.etat === 'acculé' ? .8 : 0, broute * Math.max(0, Math.sin(t * 7 + g)) * .5, geste.rugit);
  if (M.poisson) return lgStyle(f, M, lgPoisson(f, M, B, add, { v, ph, allure, dk, couche, souffle, R, bouche, g }));   // (§226) un poisson aussi, à l'échelle
  // la hauteur du dos : debout sur ses pattes, couché quand il dort ou qu'il meurt ; un galop tangue, une traque s'aplatit
  const bz0 = M.serpent ? Th * .42 : M.Hl + Th * .5;
  const saut = cu * allure * Math.abs(Math.sin(ph * 2)) * (.045 + .035 * cu) * (1 - couche);   // (§226) la mignonne sautille
  const bz = bz0 + (Th * .5 + .01 - bz0) * Math.max(couche, geste.roule * .6) - ram * .04 - traque * M.Hl * .3 + Math.abs(Math.sin(ph * 2)) * (.014 + .02 * ep) * allure * (1 + galop) + saut - M.Hl * .45 * geste.assis;
  const dresse = lisse('_lgDr', ep * Math.max(al, f.etat === 'veille' || f.etat === 'acculé' || f.etat === 'défendre' ? .9 : 0), 2.5);   // (§226) l'épique se dresse, poitrail haut
  const tangage = (Math.sin(ph) * .09 * galop - traque * .06 - broute * .05 - dresse * .2 - .3 * geste.assis + .2 * geste.etire - .14 * geste.rugit) * (1 - couche);   // l'avant plonge et remonte au galop ; (§234) assise, l'avant se lève ; étirée, il plonge
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
    // (§226) une bête épique : des marques qui luisent le long du dos et des flancs, et des épines si elle n'a ni carapace ni plaques
    if (M.lueur) { const n = 3 + Math.round(M.epique * 2) + (M.el ? 1 : 0), pul = .75 + .25 * Math.sin(t * 2.2 + g), k = M.el ? 1.5 : 1;   // (§237) des runes, plus grandes
      for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (.12 + i * .76 / Math.max(1, n - 1));
        add([x, 0, zt + .006], [x + .03 * k, 0, zt + .006], Wd * .22 * k, .012 * k, lgMix(M.robe, M.lueur, pul), 1); B[B.length - 1].lueur = 1;   // (§229) elles luisent vraiment
        for (const s2 of [-1, 1]) { add([x, s2 * Wd * .5, zt - Th * .3], [x + .025 * k, s2 * Wd * .52, zt - Th * .36 * k], .014 * k, .03 * k, lgMix(M.sombre, M.lueur, pul * .8), 1); B[B.length - 1].lueur = 1; } } }
    if (M.epines && !M.oiseau) { const n = 3 + Math.round(M.epique * 3), hE = (.025 + M.epique * .04) * (1 + M.lourd * .4) * (1 + Th * 2);
      for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (.12 + i * .76 / Math.max(1, n - 1)), k = 1 - Math.abs(i - (n - 1) / 2) / n, hh = hE * (.55 + .6 * k);
        B.push(M.el ? { a: [x, 0, zt - .01], b: [x - hh * .35, 0, zt + hh * 1.3], w: .03 * (1 + M.lourd * .4), h: .034, c: M.corneLuit ? M.corne : lgMix(M.corne, M.lueur, .25), fin: 0, pans: 4, ...(M.corneLuit ? { luit: 1, lueur: 1 } : {}) }   // (§237) un éclat de cristal, de glace, d'obsidienne…
          : { a: [x, 0, zt - .01], b: [x - hh * .55, 0, zt + hh], w: .022 * (1 + M.lourd * .4), h: .026, c: lgMix(M.sombre, M.lueur || M.sombre, .2), fin: 0, pans: 6 }); } }   // une épine : un cône couché vers l'arrière
  }
  // --- les pattes ---
  if (M.pattes && !M.serpent) lgPattes(f, M, add, { bz, zx, xa, xr, ph, allure, galop, couche, vol, dk, traque, avant });
  // --- les ailes : repliées le long du corps, battantes en vol ---
  if (M.ailes > .3) {
    const env = (.15 + M.ailes * .45), bat = vol ? Math.sin(Number.isFinite(f.ph) ? f.ph : t * 10) : 0;
    const ax = M.bip ? avant[0] - .05 : xa - Lt * .3, az = (M.bip ? (avant[2] + bz) / 2 : bz) + Th * (vol ? .35 : .12);
    for (const s of [-1, 1]) {
      if (vol) { const ang = .25 + bat * .9, bout2 = [ax - .06, s * (Wd * .45 + env * Math.cos(ang)), az + env * Math.sin(ang)];
        add([ax, s * Wd * .45, az], lgMix([ax, s * Wd * .45, az], bout2, .55), env * .5, .02, M.robe); add(lgMix([ax, s * Wd * .45, az], bout2, .5), bout2, env * .42, .016, M.el ? lgMix(M.sombre, M.lueur, .55) : M.sombre, M.el ? 1 : 0, M.el ? 1 : 0); }
      else { add([ax + .02, s * Wd * .52, az], [ax - env * .55, s * Wd * .58, az - .01], .02, Th * .62, M.robe); add([ax - env * .3, s * Wd * .56, az - .02], [ax - env * .9, s * Wd * .52, az - .03 - env * .08], .016, Th * .45, M.sombre); }
    }
  }
  // --- le cou et la tête ---
  const T = lgTete(f, M, add, { avant, tz, couche, ram, al, allure, broute, traque, ph, R, bouche, g, bz });
  // --- la queue ---
  if (M.queue > .08 && !M.serpent) bout = lgQueue(f, M, add, { bz, zx, xr, Lt, Th, couche, allure, al, galop, traque, g });
  if (!bout) bout = M.bip ? [-Lt * .4, 0, bz + .01] : [xr + .01, 0, bz + Th * .15];
  if (M.organes.length) lgOrganes(add, M, { tete: T.tete, hs: T.hs, nez: T.nez, avant, bout, bz, xa, xr, Lt, Th, Wd, couche, allure });
  if (M.el) lgFantaisie(f, M, add, B, { T, avant, bout, bz, xa, xr, couche, allure, dk, g, vol, al });
  if (vol && f.roll) { const c = Math.cos(f.roll), s = Math.sin(f.roll), T = p => [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];   // (§220) en vol, elle vire sur l'aile
    for (const o of B) { o.a = T(o.a); o.b = T(o.b); } }
  if (geste.roule > 0 && geste.tour) {                                // (§234) la mignonne se roule par terre : un tour sur le dos
    const c = Math.cos(geste.tour), s = Math.sin(geste.tour), zc = bz, vu = new Set();
    for (const o of B) for (const p of [o.a, o.b]) if (!vu.has(p)) { vu.add(p); const y = p[1], z = p[2] - zc; p[1] = y * c - z * s; p[2] = zc + y * s + z * c; } }
  lgSignes(f, M, add, T, { couche, dort, al }, B);
  // (§226) la mignonne s'écrase en touchant le sol et s'étire en l'air ; toute bête recule d'un coup quand on la frappe (l'épique à peine)
  const sq = cu * allure * Math.cos(ph * 4) * .12 * (1 - couche), coup = f.hit > 0 && !f.dead ? Math.min(1, f.hit * 4) * (1 - .7 * ep) : 0;
  if (sq || coup) { const vu = new Set(); for (const o of B) for (const p of [o.a, o.b]) if (!vu.has(p)) { vu.add(p); p[2] *= 1 - sq; p[0] = p[0] * (1 + sq * .5) - coup * .07; } }   // (un point partagé par deux os ne bouge qu'une fois)
  return lgStyle(f, M, B);
}
// (§226) LES SIGNES, au-dessus de la tête, comme dans un livre d'images : « ! » quand la bête s'alarme (une seconde), des « z » qui
// montent quand elle dort. Ils gardent la même taille quelle que soit la bête, et luisent.
function lgSignes(f, M, add0, T, A, B) {
  if (f.dead || f.tame && f.etat !== 'dormir') return;
  const add = (...x) => { add0(...x); if (B && B.length) B[B.length - 1].lueur = 1; };   // (§229) ils luisent vraiment, la nuit aussi
  const k = (typeof echB === 'function' ? echB(f) : 1) || 1, h = T && T.tete ? T.tete : [0, 0, .4], hs = (T && T.hs) || .1, z0 = h[2] + hs * .8 + .1 / k;
  if (A.al > .6 && !(f._lgAl > .6)) f._lgEx = t + 1.1;
  f._lgAl = A.al;
  if (f._lgEx > t) { const u = .05 / k, monte = Math.min(1, (1.1 - (f._lgEx - t)) * 6), z = z0 + u * 1.2 * monte;
    add([h[0], 0, z + u * .9], [h[0], 0, z + u * 2.6], u * .55, u * .55, [255, 214, 70], 1); add([h[0], 0, z], [h[0], 0, z + u * .45], u * .55, u * .55, [255, 214, 70], 1); }
  if (A.dort > .7) for (let i = 0; i < 3; i++) { const q = ((t * .45 + i / 3 + lgGraine(f) * .1) % 1), u = (.025 + .02 * q) / k, z = z0 + q * .35 / k, y = Math.sin(q * 6 + i) * .04 / k;
    add([h[0] - .02 / k, y, z], [h[0] + .02 / k, y, z], u, u * .35, [196, 214, 255], 1); }
}
// (§234) LES GESTES DE REPOS. Une bête au calme (elle erre, suit son troupeau, regarde, se repose) fait de temps en temps un geste :
// elle s'assoit, s'ébroue, s'étire ; une mignonne se roule aussi par terre, une épique lève la tête et rugit. Le geste tient d'une à
// quatre secondes, entre et sort en douceur, puis elle attend six à vingt secondes. Rien que pour l'œil : la conduite ne change pas.
const LG_GESTES = { assis: 4, ebroue: .9, etire: 1.6, roule: 1.8, rugit: 1.8 };
function lgGeste(f, M, allure, al, vol) {
  const R = { assis: 0, ebroue: 0, etire: 0, roule: 0, rugit: 0, tour: 0 };
  const calme = !f.dead && !vol && !f.enfoui && allure < .06 && al < .2 && ['errer', 'troupeau', 'curieux', 'suivre', 'garder', 'repos', 'patrouiller'].includes(f.etat);
  let G = f._lgG;
  if (!calme) { if (G && G.fin > t) G.fin = t; }
  else if (!G || t > G.fin + G.pause) {
    const cu = M.cute || 0, ep = M.epique || 0, W = { assis: 1.5 - cu * .5, ebroue: 1, etire: 1, roule: M.serpent || M.poisson || M.oiseau ? 0 : 2.5 * cu, rugit: 2 * ep };
    if (M.serpent || M.poisson) W.assis = 0;
    let r = Math.random() * Object.values(W).reduce((a, x) => a + x, 0), k = 'ebroue';
    for (const [n, w] of Object.entries(W)) if ((r -= w) <= 0) { k = n; break; }
    G = f._lgG = { k, debut: t, fin: t + LG_GESTES[k], pause: 6 + Math.random() * 14 };
  }
  if (G && t >= G.debut && t <= G.fin + .35) {
    const a = t - G.debut, b = G.fin - t, x = lgCl(Math.min(a, b + .35) * 3, 0, 1);
    R[G.k] = x;
    if (G.k === 'roule') { const p = lgCl(a / (G.fin - G.debut), 0, 1); R.tour = 6.2832 * p * p * (3 - 2 * p); }
  }
  return R;
}
// (§226) LA PASSE DE STYLE. Les largeurs suivent la taille de la bête, comme pour les corps faits main : sans cela, une bête de
// 20 g était dodue et une de 50 kg toute maigre (posBete n'agrandit que les positions). Puis, de près, la forme de chaque os : tout
// en rondeurs chez une mignonne (des boules, des membres arrondis), en arêtes chez une épique (des prismes qui s'effilent) ; entre
// les deux, les formes du moteur (formeOs). Ce qui est plat, très fin, ou a déjà sa forme garde la sienne.
function lgStyle(f, M, B) {
  const k = (typeof echB === 'function' ? echB(f) : 1) || 1;
  for (const o of B) { o.w *= k; o.h *= k; }
  const cu = M.cute || 0, ep = M.epique || 0; if (cu < .05 && ep < .05) return B;
  try { if (typeof formesDist === 'function' && typeof P !== 'undefined' && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 > formesDist() ** 2) return B; } catch (e) { }
  for (const o of B) {
    if (o.boule || o.pans || o.fin !== undefined || o.tex) continue;
    const m = Math.max(o.w, o.h), n = Math.min(o.w, o.h), L = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1], o.b[2] - o.a[2]) * k;
    if (n < .028 || n < .5 * m) continue;                                // un fil, une plaque : le moteur s'en charge
    if (cu >= ep) { if (L < 2.2 * m) { o.boule = 4; o.rond = .72 + .25 * cu; } else { o.pans = 6; o.rond = .85 + .12 * cu; o.fin = .9; } }
    else { o.pans = 6; o.rond = .45 - .25 * ep; o.fin = L > 2 * m ? .62 - .12 * ep : .84; }
  }
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
  const yeux = (M.tr.has('yeux-nocturnes') ? .055 : .03 + M.tete * .08) * (1 + .3 * M.petit) * (1 + .9 * (M.cute || 0) - .2 * (M.epique || 0)), cote = M.chasseur ? .34 : .5, av = M.chasseur ? .3 : .18;   // (§226) grands chez une mignonne
  const cligne = (t * .9 + g) % 5 < .12 ? .2 : 1;                     // un clignement, de temps en temps
  for (const s of [-1, 1]) {
    if (M.motif === 'masque') add(P(hs * .05, s * hs * .48, hs * .1), P(hs * .36, s * hs * .48, hs * .1), .02, hs * .34, M.sombre);
    const o = P(hs * av, s * hs * cote, hs * .14);
    add(o, lgAdd(o, [yeux * .5 * D[0], yeux * .5 * D[1] + s * .006, 0]), yeux * .62, yeux * cligne, M.oeil, M.tr.has('yeux-nocturnes') || M.el ? 1 : 0, M.el ? 1 : 0);   // (§237) les yeux de légende luisent
    // (§226) une mignonne : une grande pupille sombre, un gros reflet (l'œil garde sa couleur : la fureur la reconnaît)
    if (M.cute > .3 && cligne === 1) add(lgAdd(o, [yeux * .22 * D[0], s * yeux * .2, -yeux * .05]), lgAdd(o, [yeux * .34 * D[0], s * yeux * .22, -yeux * .05]), yeux * .42, yeux * .62, LG.PUPILLE);
    if (cligne === 1) { const r = .012 * (1 + 1.4 * (M.cute || 0)); add(lgAdd(o, [yeux * .2 * D[0], s * yeux * .32, yeux * .24]), lgAdd(o, [yeux * .3 * D[0], s * yeux * .32, yeux * .24]), r, r, LG.BLANC, 1); }   // le reflet
  }
  const dessus = tete[2] + hs * .5;
  // les oreilles : de côté et larges chez un brouteur, droites et pointues chez un chasseur ; elles se dressent à l'alarme
  // et frémissent par moments
  if (M.oreilles > .2) { const lo = .04 + M.oreilles * .14 * (1 + .3 * M.petit), fr = Math.max(0, Math.sin(t * 3.1 + g * 3)) ** 8 * .5;
    for (const s of [-1, 1]) { const dresse = lgCl(.35 + al * .6 + (M.chasseur ? .35 : 0) - couche * .4 - broute * .15, 0, 1), ouv = (M.brouteur ? .75 : .35) * (1 - dresse * .5) + (s > 0 ? fr : 0) * .3;
      const b0 = P(-hs * .25, s * hs * .32, hs * .42), b1 = lgAdd(b0, [-lo * (.35 - dresse * .25), s * lo * ouv, lo * (.45 + dresse * .55)]);
      add(b0, b1, .018, lo * (M.chasseur ? .5 : .62), M.robe); add(lgAdd(b0, [.006, -s * .004, .006]), lgMix(b0, b1, .8), .012, lo * (M.chasseur ? .32 : .42), M.oreille); } }
  const oc = M.org('cornes'), nc = oc ? oc.nombre : 2, droites = oc && oc.forme === 'droites', ramif = oc ? oc.forme === 'ramifiees' : M.cornes > .6;
  const cl = M.corneLuit, pointe = b => { if (M.el) add(b, lgAdd(b, [0, 0, .012]), .026, .026, M.lueur, 1, 1); };   // (§237) la pointe luit
  if (M.cornes > .25 && nc === 1) { const lc = .05 + M.cornes * .2, b0 = lgAdd(nez, [-.03, 0, hs * .3]), b1 = [b0[0] + lc * .15, b0[1], b0[2] + lc * .85]; add(b0, b1, .034, .034, M.corne, cl, cl); pointe(b1); }   // une corne, sur le nez
  else if (M.cornes > .25) for (const [r, dx] of nc >= 4 ? [[1, 0], [.6, -hs * .35]] : [[1, 0]]) for (const s of [-1, 1]) {
    const lc = (.05 + M.cornes * .18) * r, b0 = P(dx, s * hs * .25, hs * .48), b1 = [b0[0] - lc * (droites ? .1 : .3), b0[1] + s * lc * (droites ? .15 : .35), b0[2] + lc * (droites ? .95 : .7)];
    const mid = lgMix(b0, b1, .5); add(b0, mid, .03 * r + .006, .03 * r + .006, M.corne, cl, cl); add(mid, b1, .02 * r + .004, .02 * r + .004, M.corne, cl, cl);
    if (ramif && r === 1) { const b2 = [b1[0] - lc * .35, b1[1] + s * lc * .15, b1[2] + lc * .35]; add(b1, b2, .018, .018, M.corne, cl, cl); pointe(b2); } else pointe(b1); }
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
  if (M.el) lgFantaisie(f, M, add, B, { T: { tete: tt, hs: haut * .6, nez: [tt[0] + .03, tt[1], bz] }, avant: tt, bout: q, bz, xa: L * .5, xr: -L * .5, couche, allure, dk, g, vol: false, al: f.alarm || 0 });   // (§237)
  return B;
}

// (§237) LA FANTAISIE DU CORPS. Ce que l'élément ajoute à la bête : une crinière (des flammes, des éclats de givre ou de cristal, des
// feuilles, des nageoires, des étincelles, de la fumée d'ombre, des plumes d'aurore), le bout de la queue de même, une gemme au front
// (un bourgeon de lumière chez une mignonne, un troisième œil chez une puissante), des éclats qui tournent autour d'elle, des ailes
// d'éther repliées sur le dos des plus grandes, et une aura de particules. Tout cela luit, de jour comme de nuit.
const LG_AURORE = [[255, 124, 150], [255, 204, 96], [150, 255, 170], [112, 204, 255], [204, 146, 255]];
function lgTouffe(B, M, p, dir, l, w, g, i) {
  const luit = { luit: 1, lueur: 1 }, q = (k, dx = 0, dy = 0, dz = 0) => [p[0] + dir[0] * l * k + dx, p[1] + dir[1] * l * k + dy, p[2] + dir[2] * l * k + dz];
  switch (M.el) {
    case 'braise': { const fl = .72 + .28 * Math.sin(t * 11 + i * 1.9 + g), m = q(.55 * fl), b = q(fl, Math.sin(t * 9 + i) * .012, Math.cos(t * 8 + i * 2) * .012);
      B.push({ a: p, b: m, w, h: w, c: lgMix(M.lueur, [255, 84, 30], .45), fin: .6, ...luit }, { a: m, b, w: w * .6, h: w * .6, c: [255, 236, 150], fin: 0, ...luit }); break; }
    case 'givre': B.push({ a: p, b: q(1), w: w * .9, h: w * .9, c: M.corne, pans: 4, fin: 0, ...luit }); break;
    case 'cristal': B.push({ a: p, b: q(1.1), w, h: w, c: lgMix(M.corne, M.lueur, .3), pans: 6, fin: 0, ...luit }); break;
    case 'sylve': B.push({ a: p, b: q(1), w: w * 1.6, h: w * .3, c: lgMix(M.robe, [120, 220, 90], .5), fin: .2 }, { a: q(1), b: q(1.08), w: w * .55, h: w * .55, c: M.lueur, boule: 4, ...luit }); break;
    case 'abysse': B.push({ a: p, b: q(1), w: .014, h: l * .7, c: lgMix(M.robe, M.lueur, .55), fin: .3, ...luit }); break;
    case 'orage': if ((t * 7 + i * 3.3 + g) % 1 < .75) { const m = q(.5, (i % 2 ? .018 : -.018)); B.push({ a: p, b: m, w: w * .45, h: w * .45, c: M.lueur, ...luit }, { a: m, b: q(1, (i % 2 ? -.012 : .012)), w: w * .38, h: w * .38, c: [255, 255, 230], ...luit }); } break;
    case 'ombre': for (let k = 0; k < 2; k++) { const u = ((t * .7 + i * .37 + k * .5) % 1); B.push({ a: q(u), b: q(u + .05), w: w * (1.3 - u * .8), h: w * (1.3 - u * .8), c: lgMix(M.sombre, M.lueur, .5), boule: 4, ...luit }); } break;
    default: B.push({ a: p, b: q(1), w: w * 1.4, h: w * .3, c: LG_AURORE[i % LG_AURORE.length], fin: .3, ...luit });   // l'aurore : des plumes de toutes ses couleurs
  }
}
function lgFantaisie(f, M, add, B, A) {
  const { T, avant, bout, bz, xa, xr, couche, allure, dk, g, vol, al } = A, { Lt, Th, Wd } = M, I = M.fant || .3, ep = M.epique || 0;
  if (dk > .6) return;
  try { if (typeof P !== 'undefined' && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 > 900) return; } catch (e) { }   // au loin, seulement les yeux, les cornes et les couleurs
  const sw = i => Math.sin(t * 2.2 + i * .9 + g) * .25 * (1 - couche);
  // la crinière : de l'arrière du crâne au garrot (sur la tête seule, chez un serpent)
  if (M.criniere && T && T.tete) {
    const hs = T.hs, h0 = [T.tete[0] - hs * .35, T.tete[1], T.tete[2] + hs * .38], fin = M.serpent ? [T.tete[0] - hs * .9, T.tete[1], T.tete[2] + hs * .2] : [xa - Lt * .35, 0, bz + Th * .55];
    const n = M.serpent ? 4 : 4 + Math.round(6 * I), l = (.05 + .15 * I) * (1 - .35 * couche), w = .026 + .04 * I;
    for (let i = 0; i < n; i++) { const k = n > 1 ? i / (n - 1) : 0, p = k < .4 ? lgMix(h0, avant, k / .4) : lgMix(avant, fin, (k - .4) / .6), a = sw(i);
      lgTouffe(B, M, p, [-.5 + a * .3, a * .4, .86], l * (1 - .35 * Math.abs(k - .35)), w, g, i); }
  }
  // le bout de la queue
  if (M.queueEl && bout && !M.poisson) { const l = .06 + .14 * M.queueEl, w = .03 + .04 * M.queueEl, a = sw(9);
    for (let i = 0; i < (M.el === 'braise' || M.el === 'ombre' ? 3 : M.el === 'givre' || M.el === 'cristal' ? 2 : 1); i++)
      lgTouffe(B, M, bout, [-.62 + i * .2, a * .5 + (i - 1) * .25, .72], l * (1 - .15 * i), w, g, i + 20); }
  // la gemme du front : un bourgeon de lumière, ou un troisième œil
  if (M.gemme && T && T.tete && T.nez) { const hs = T.hs, p = lgAdd(lgMix(T.tete, T.nez, .22), [0, 0, hs * .46]);
    if (M.gemme === 'bourgeon') B.push({ a: p, b: lgAdd(p, [0, 0, .026]), w: .036, h: .036, c: M.lueur, boule: 4, luit: 1, lueur: 1 });
    else { const r = .04 + .03 * ep; B.push({ a: lgAdd(p, [0, 0, -r * .2]), b: lgAdd(p, [0, 0, r]), w: r, h: r * .8, c: M.lueur, pans: 6, fin: 0, luit: 1, lueur: 1 },
      { a: lgAdd(p, [0, 0, -r * .2]), b: lgAdd(p, [0, 0, -r * .7]), w: r, h: r * .8, c: M.lueur, pans: 6, fin: 0, luit: 1, lueur: 1 }); } }
  // des éclats en orbite, au-dessus du dos
  if (M.orbites) { const cx = (xa + xr) / 2, cz = bz + Th * 1.2 + .12, r = Lt * .55 + .14;
    for (let i = 0; i < M.orbites; i++) { const an = t * 1.1 + i * 6.2832 / M.orbites + g, p = [cx + Math.cos(an) * r, Math.sin(an) * r * .8, cz + Math.sin(t * 2.3 + i) * .05], e = .065 + .05 * ep;
      const c = M.el === 'ombre' ? lgMix(M.sombre, M.lueur, .6) : M.lueur;
      B.push({ a: p, b: lgAdd(p, [0, 0, e]), w: .045, h: .045, c, pans: 4, fin: 0, luit: 1, lueur: 1 }, { a: p, b: lgAdd(p, [0, 0, -e * .6]), w: .045, h: .045, c, pans: 4, fin: 0, luit: 1, lueur: 1 }); } }
  // des ailes d'éther, repliées sur le dos ; elles s'ouvrent à l'alarme
  if (M.ether && !vol) { const S = (.3 + .28 * ep) * (1 + Lt * .3), ouv = .3 + .5 * (al || 0) + .08 * Math.sin(t * 1.3 + g);
    for (const s of [-1, 1]) { const b0 = [xa - Lt * .32, s * Wd * .42, bz + Th * .45], c1 = [b0[0] - S * .25, s * (Wd * .55 + S * (.2 + .5 * ouv)), b0[2] + S * (.6 - .1 * ouv)],
      c2 = [b0[0] - S * .8, s * (Wd * .6 + S * (.15 + .7 * ouv)), b0[2] + S * (.4 + .1 * Math.sin(t * 1.3 + g))];
      B.push({ a: b0, b: c1, w: .02, h: S * .3, c: lgMix(M.lueur, M.robe, .55), fin: .8, luit: 1, lueur: 1 }, { a: c1, b: c2, w: .016, h: S * .26, c: lgMix(M.lueur, M.robe, .3), fin: .25, luit: 1, lueur: 1 });
      add(b0, c1, .02, .02, M.sombre); add(c1, c2, .016, .016, M.sombre); } }
  // l'aura : des particules qui montent (ou tombent, pour le givre), d'autant plus nombreuses qu'elle est puissante
  try {
    const dtA = Math.min(.1, Math.max(0, t - (f._lgAuT ?? t))); f._lgAuT = t;
    if (typeof parts !== 'undefined' && typeof P !== 'undefined' && !f.dead && parts.length < 1400 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < 324) {
      f._lgAu = (f._lgAu || 0) + dtA * M.aura;
      const k = (typeof echB === 'function' ? echB(f) : 1) || 1;
      while (f._lgAu >= 1) { f._lgAu -= 1; const a = Math.random() * 6.2832, r = Math.random() * Lt * .6 * k, x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r, z = (f.z || 0) + (bz + Th * (.2 + Math.random())) * k;
        const el = M.el, tombe = el === 'givre', vive = el === 'orage';
        parts.push({ x, y, z: z + (tombe ? .35 * k : 0), vx: (Math.random() - .5) * (vive ? 1.6 : .3), vy: (Math.random() - .5) * (vive ? 1.6 : .3), vz: tombe ? -.15 : vive ? Math.random() : .25 + Math.random() * (el === 'braise' ? .8 : .35),
          g: tombe ? .03 : vive ? .4 : -.04, life: vive ? .35 + Math.random() * .3 : 1 + Math.random() * 1.2, age: 0, col: el === 'aurore' ? 'rgb(' + LG_AURORE[(Math.random() * 5) | 0].join(',') + ')' : M.partEl, luit: 1, tl: .04 + .03 * ep }); }
    }
  } catch (e) { }
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
  if (M.cornes > .25) d.ligne(hx - .5, hy - 1.4, hx - 2, hy - 2.5 - M.cornes * 2, M.corne || LG.CORNE);
  if (M.el && M.criniere && !M.serpent) d.ligne(hx - 1.2, hy - 1, x1 - 2, cy - 1.8 - M.Th * 8, M.lueur);   // (§237) la crinière
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
  if (M.el) { d.net(Math.round(qx), Math.round(qy - 1), M.lueur); if (M.gemme) d.net(Math.round(hx), Math.round(hy - 1.6), M.lueur); }   // (§237) le bout de la queue, la gemme
}
