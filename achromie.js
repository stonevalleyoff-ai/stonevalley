// Stone Valley — L'ACHROMIE (achromie.js)
// Le troisième état d'île (voir etats.js pour le système). Sur certaines îles, dès l'exploration 4 (une sur huit
// environ), la couleur s'en est allée : le prisme de l'arche s'est brisé, et ses éclats sont gardés dans des
// sanctuaires. Tout est gris — le sol, le ciel, l'eau, les bêtes, vous et vos compagnes — et la musique se tait.
// LA LANTERNE PRISMATIQUE (touche O, bouton LANTERNE) rend les vraies couleurs dans son halo. Elle s'use allumée
// et se recharge dans l'ombre.
// LES VEILLEURS : de grandes silhouettes noir et blanc qui font leurs rondes dans la cour de chaque sanctuaire,
// autour de son enceinte, autour de l'arche, et au loin. ILS VOIENT LA COULEUR : lanterne allumée, ils vous
// repèrent de loin ; éteinte, gris parmi le gris, il faut presque les toucher. Un cône de poussière pâle montre
// jusqu'où porte leur regard. Vu, un voile blanc monte ; plein, vous êtes DÉLAVÉ : renvoyé au dernier seuil
// (l'arrivée, ou l'entrée du sanctuaire), la lanterne vide. On ne les tue pas. Chaque couleur rendue raccourcit
// leur regard ; le prisme reposé, ils éclatent en couleurs. Leurs rondes suivent l'horloge : deux joueurs les
// voient aux mêmes places sans rien se dire (ils ne sont pas dans la faune partagée).
// LES SANCTUAIRES (jusqu'à quatre, selon la place sur l'île ; le rouge toujours) : une enceinte de pierre, une
// cour, un cœur fermé par une porte, l'éclat sur son autel, un lutrin qui donne trois indices.
//   ROUGE · les braseros : quatre bagues de couleur (même clarté : le même gris) ; la fresque dit l'ordre des feux.
//   JAUNE · les miroirs : un rayon sort du mur ; on tourne les miroirs pour le mener au cristal de la porte. Le
//           rayon ne se voit qu'à la lanterne.
//   VERT  · les blocs : trois dalles ; deux blocs de mousse à pousser chacun sur la dalle de sa couleur ; la
//           troisième attend un poids vivant (vous, ou une compagne). Un levier remet les blocs en place.
//   BLEU  · les bassins : un grand (cinq mesures), un petit (trois) ; des vannes remplissent, vident, versent l'un
//           dans l'autre. La porte s'ouvre quand le grand porte la mesure marquée d'une encoche bleue.
// Prendre un éclat rend sa couleur à l'île. À l'arche, le prisme reposé rallume tout : la couleur revient, l'arche
// se rouvre, et l'on gagne UN PIGMENT (un seul par île et par joueur), plus rare à mesure que l'île est profonde.
// Le jeu (index.html, etats.js) appelle, s'ils existent :
//   achromieIle()           à l'île marquée « achromie » (etatsIle), sous le hasard de la graine ;
//   achromieSolDOrigine()   avant chaque peuplement (etatsSolDOrigine) : le sol d'avant les sanctuaires ;
//   majAchromie(dt)         à chaque image (majEtats) ;
//   majAchromieBete(b, dt), osAchromie(f) : veilleurs et mécanismes, parmi les bêtes (majBete, le dessin) ;
//   achromieAction()        ACTION (actionContexte) ; basculerLanterne() (touche O, bouton) ;
//   achromieArche(), achromiePrismeOs() : l'arche éteinte (auPortailIle, portailOs) ;
//   achromieZone(x, y, m)   pas de campement sur un sanctuaire (placeCamp, placeChamp) ;
//   achromieCss(), achromieVoile() : le repli sans carte graphique, le voile du regard (dessinerFiltre) ;
//   achromieHud(), achromieMuette(), blocPigments().
// Le gris lui-même est fait par la carte graphique (index.html, GRIS_GLSL) : chaque couleur rendue garde sa
// bande de teinte, la lanterne garde tout dans son halo.

const grSpec = (id, n, metier, x) => Object.assign({ id, n, corps: id, achromie: 1, illusion: 1, diet: 's', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
  shell: [120, 116, 110], dark: [70, 66, 62], leg: [96, 92, 86], oeil: [0, 0, 0], bio: [], dur: 1e9, lien: 0, chasse: [], travail: {}, metier, grimpe: 0 }, x || {});
const GR_SPEC = [
  grSpec('gr_veilleur', 'Veilleur', 'il voit la couleur', { spd: 1.2, shell: [16, 16, 19], dark: [8, 8, 10], leg: [16, 16, 19], oeil: [255, 255, 255] }),
  grSpec('gr_brasero', 'Brasero', 'un brasero'), grSpec('gr_fresque', 'Fresque', 'une fresque'), grSpec('gr_autel', 'Autel', 'l\'autel du prisme'),
  grSpec('gr_lutrin', 'Lutrin', 'un lutrin'), grSpec('gr_miroir', 'Miroir', 'un miroir'), grSpec('gr_soleil', 'Soleil de pierre', 'la source du rayon'),
  grSpec('gr_cristal', 'Cristal', 'le cristal de la porte'), grSpec('gr_dalle', 'Dalle', 'une dalle'), grSpec('gr_bloc', 'Bloc de mousse', 'un bloc'),
  grSpec('gr_levier', 'Levier', 'un levier'), grSpec('gr_bassin', 'Bassin', 'un bassin'), grSpec('gr_vanne', 'Vanne', 'une vanne'),
];
// Les quatre couleurs des bagues, des dalles, de la fresque : même clarté (≈ 120 sur 255), donc le même gris.
// b : la bande de teinte que la carte graphique rend (0 rouge, 1 jaune, 2 vert, 3 bleu, 4 violet).
const GR_COUL = [
  { id: 'rouge', n: 'rouge', rgb: [230, 70, 70], b: 0 },
  { id: 'vert', n: 'vert', rgb: [60, 160, 70], b: 2 },
  { id: 'bleu', n: 'bleu', rgb: [95, 110, 245], b: 3 },
  { id: 'jaune', n: 'jaune', rgb: [150, 125, 40], b: 1 },
];
const grCoul = id => GR_COUL.find(c => c.id === id) || GR_COUL[0];
const GR_ORDRE_S = ['rouge', 'jaune', 'vert', 'bleu'];      // les sanctuaires, dans l'ordre où l'île leur fait place
const GR_NOM_S = { rouge: 'des braseros', jaune: 'des miroirs', vert: 'des blocs', bleu: 'des bassins' };
const GR_PIGMENTS = {
  rouge: ['ocre rouge', 'garance', 'cinabre', 'carmin', 'pourpre'],
  jaune: ['ocre jaune', 'safran', 'orpiment', 'jaune indien', 'or'],
  vert: ['terre verte', 'vert-de-gris', 'malachite', 'vert émeraude', 'jade'],
  bleu: ['guède', 'azurite', 'indigo', 'lapis-lazuli', 'bleu céleste'],
};
const GR_PIG_RGB = { rouge: [176, 44, 38], jaune: [214, 170, 44], vert: [52, 140, 86], bleu: [44, 82, 176] };
const grNomPigment = (c, r) => c === 'prisme' ? 'nacre prismatique' : (GR_PIGMENTS[c] || GR_PIGMENTS.rouge)[Math.max(1, Math.min(5, r)) - 1];
const LANT_R = 4.4, LANT_DUREE = 70, LANT_RECH = 30;       // le halo (cases) ; allumée, elle tient 70 s ; vide, elle se recharge en 30 s
const VEIL_LOIN = 9.5, VEIL_PRES = 3.4, VEIL_ANGLE = .62;  // la portée du regard, lanterne allumée / éteinte ; le demi-angle du cône
const GR_SOCLES_R = [[3, 8], [13, 8], [3, 12], [13, 12]];  // les braseros du rouge
const GR_MIROIRS = [[4, 13, 1], [4, 9, 1], [8, 9, 1], [12, 9, 0], [12, 13, 0]];   // le jaune : [lx, ly, utile]
const GR_DALLES = [[3, 7], [13, 7], [8, 13]];              // le vert : la dalle A, la dalle B, la dalle du vivant
const GR_BLOCS0 = [[11, 11], [5, 9]];                      // le vert : où partent les blocs A et B
const GR_VANNES = [['A', 'remplir', 5, 11], ['A', 'vider', 3, 9], ['A', 'verser', 7, 9], ['B', 'remplir', 11, 11], ['B', 'vider', 13, 9], ['B', 'verser', 9, 9]];
const GR_CAP = { A: 5, B: 3 };
const GR_INDICES = {
  rouge: S => ['« Quatre feux, un ordre. La fresque le dit, à qui sait y voir. »',
    '« Dans le gris, les couleurs se valent toutes. Portez la lanterne à la fresque, puis à la bague de chaque brasero. »',
    '« L\'ordre des feux : ' + S.ordre.map(c => GR_COUL[c].n).join(', ') + '. »'],
  jaune: S => ['« Un soleil dort dans le mur ; son rayon cherche le cristal de la porte. Il ne se voit qu\'à la lanterne. »',
    '« Chaque miroir se tourne : il renvoie le rayon d\'un quart de tour, d\'un côté ou de l\'autre. »',
    '« Trois miroirs suffisent : celui devant le soleil, celui qui est au-dessus de lui, puis celui du milieu, face à la porte. Les deux autres ne servent à rien. »'],
  vert: S => ['« Trois dalles, et la porte ne s\'ouvre que si toutes les trois portent leur poids. »',
    '« Chaque bloc a sa dalle, de sa couleur : la lanterne les accorde. La troisième attend un poids vivant : vous, ou une compagne. Le levier remet les blocs en place. »',
    '« Le bloc ' + grCoul(S.coulA).n + ' va sur la dalle de gauche, le bloc ' + grCoul(S.coulB).n + ' sur celle de droite ; puis tenez-vous sur la dalle du milieu. »'],
  bleu: S => ['« La porte boit quand le grand bassin porte la bonne mesure. Une encoche bleue la marque, à qui sait y voir. »',
    '« Le petit bassin tient trois mesures, le grand cinq. Les vannes remplissent, vident, versent l\'un dans l\'autre. »',
    S.cible === 4 ? '« Quatre mesures : remplir le grand, le verser dans le petit, vider le petit, verser le grand dans le petit, remplir le grand, le verser dans le petit. »'
      : '« Une mesure : remplir le petit, le verser dans le grand ; recommencer — il en reste une dans le petit ; vider le grand, y verser le petit. »'],
};

const GRIS = { ici: false, fini: false, k: 0, bandes: [0, 0, 0, 0, 0], cible: [0, 0, 0, 0, 0], lant: false, charge: 1, regard: 0, flash: 0, grace: 0,
  cp: null, SS: [], veilleurs: [], eclats: [], sol: null, arrivee: 0, delaves: 0, indices: 0, annonce: false, verifT: 0, progLu: false,
  btn: null, btnT: 0, ditLant: false, murmure: false, coupT: 0 };
const grHorloge = () => typeof globalThis.__TGRIS === 'number' ? globalThis.__TGRIS : Date.now() / 1000;
const grIci = () => GRIS.ici && typeof ETAT !== 'undefined' && ETAT.id === 'achromie' && !(typeof djIci === 'function' && djIci());
const grEclats = () => GRIS.SS.map(S => S.coul);

// ---------- un sanctuaire : un repère tourné vers l'arrivée ----------
// Le plan se lit en cases locales 0..16 (l'entrée en bas, ly = 16 ; le cœur en haut, ly ≤ 5) ; S.r le tourne
// d'un quart de tour. La cour : lx 1..15, ly 6..15.
const GR_ROT = [[0, 1], [-1, 0], [0, -1], [1, 0]];          // où regarde l'entrée, selon S.r
function grTourne(S, u, v) { return S.r === 0 ? [u, v] : S.r === 1 ? [-v, u] : S.r === 2 ? [-u, -v] : [v, -u]; }
function grCase(S, lx, ly) { const [a, b] = grTourne(S, lx - 8, ly - 8); return [S.cx + a, S.cy + b]; }
const grIdx = (S, lx, ly) => { const [x, y] = grCase(S, lx, ly); return y * WS + x; };
function grPt(S, px, py) { const [a, b] = grTourne(S, px - 8.5, py - 8.5); return [S.cx + .5 + a, S.cy + .5 + b]; }
function grLocal(S, x, y) {
  const wx = x - S.cx - .5, wy = y - S.cy - .5;
  const [u, v] = S.r === 0 ? [wx, wy] : S.r === 1 ? [wy, -wx] : S.r === 2 ? [-wx, -wy] : [-wy, wx];
  return [u + 8.5, v + 8.5];
}
const grAngle = (S, dx, dy) => { const [a, b] = grTourne(S, dx, dy); return Math.atan2(b, a); };
const grCour = (lx, ly) => lx >= 1 && lx <= 15 && ly >= 6 && ly <= 15;
function grDans(x, y, m = 0) {                             // le sanctuaire où l'on est (ou à m cases près)
  for (const S of GRIS.SS) { const [lx, ly] = grLocal(S, x, y); if (lx > -4 - m && lx < 21 + m && ly > -4 - m && ly < 21 + m) return S; }
  return null;
}
function achromieZone(x, y, m = 0) { return GRIS.ici && !!grDans(x, y, m); }
// Où le bâtir : un replat de terre ferme, sans eau, assez loin de l'arrivée, de l'arche, des autres sanctuaires,
// hors du village. On cherche sur toute l'île (les petites n'ont pas de place près de l'arrivée) ; plus plat d'abord.
function grPlace(loin, souple) {
  const PENTE = souple ? 11 : 8, TROUS = souple ? 70 : 40, ECART = souple ? 26 : 30;
  const S0 = P.spawn || [WS / 2, WS / 2], A = PortailIle; let best = null, bs = -1e9;
  for (let k = 0; k < 1500; k++) {
    const x = (14 + Math.random() * (WS - 28)) | 0, y = (14 + Math.random() * (WS - 28)) | 0, r = Math.hypot(x - S0[0], y - S0[1]);
    if (r < 20 || hAt(x, y) <= SEA) continue;
    if (A && (x - A.x) ** 2 + (y - A.y) ** 2 < 22 * 22) continue;
    if (loin.some(([a, b]) => (x - a) ** 2 + (y - b) ** 2 < ECART * ECART)) continue;
    let lo = 99, hi = -99, ok = true, trous = 0;          // un gouffre, une mare au ras de la mer : comblés par le dallage
    for (let dy = -10; dy <= 10 && ok; dy++) for (let dx = -10; dx <= 10; dx++) {
      const i = (y + dy) * WS + x + dx, h = Hgt[i], b = Bio[i];
      if (Eau[i] || PlT[i] || b === 17 || b === 18 || b === 22) { ok = false; break; }
      if (h <= SEA || b === 8) { if (++trous > TROUS) { ok = false; break; } continue; }
      if (Math.abs(dx) <= 9 && Math.abs(dy) <= 9) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
    }
    if (!ok || hi - lo > PENTE) continue;
    const sc = -(hi - lo) * 3 - trous * .5 - Math.abs(r - 45) * .08;
    if (sc > bs) { bs = sc; best = [x, y]; }
  }
  return best;
}
function grRonde(pts, v, ph) {
  const cum = [0]; let L = 0;
  for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); cum.push(L); }
  return { pts, cum, L: L || 1, v, ph: ((ph % (L || 1)) + (L || 1)) % (L || 1) };
}
function grPoint(R, s) {
  s = ((s % R.L) + R.L) % R.L; let k = 0;
  while (k < R.pts.length - 1 && R.cum[k + 1] < s) k++;
  const a = R.pts[k], b = R.pts[(k + 1) % R.pts.length], l = (R.cum[k + 1] - R.cum[k]) || 1, f = (s - R.cum[k]) / l;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
const grBorne = ([x, y]) => [Math.max(3, Math.min(WS - 4, x)), Math.max(3, Math.min(WS - 4, y))];
const grCercle = (cx, cy, r, n = 14) => Array.from({ length: n }, (_, k) => grBorne([cx + Math.cos(k / n * 6.2832) * r, cy + Math.sin(k / n * 6.2832) * r]));
const grMelange = L => { for (let i = L.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [L[i], L[j]] = [L[j], L[i]]; } return L; };

function achromieSolDOrigine() {
  if (GRIS.sol) for (const [i, [h, b, f]] of GRIS.sol) { Hgt[i] = h; Bio[i] = b; Flo[i] = f; }
  GRIS.sol = null;
}
function achromieIle() {
  Object.assign(GRIS, { ici: true, fini: false, k: 0, bandes: [0, 0, 0, 0, 0], cible: [0, 0, 0, 0, 0], lant: false, charge: 1, regard: 0, flash: 0, grace: 20,
    cp: P.spawn ? [P.spawn[0], P.spawn[1]] : [P.x, P.y], SS: [], veilleurs: [], eclats: [], arrivee: Date.now(), delaves: 0, indices: 0,
    annonce: false, verifT: 0, progLu: false, ditLant: false, murmure: false });
  if (!specById.gr_veilleur) { GRIS.ici = false; return; }
  // le rouge d'abord, puis les autres dans un ordre tiré de la graine : faute de place, c'est l'un d'eux qui manque
  const ordre = ['rouge', ...grMelange(GR_ORDRE_S.slice(1))], places = [];
  for (let k = 0; k < ordre.length; k++) { const q = grPlace(places) || grPlace(places, true); if (!q) break; places.push(q); }
  if (!places.length) { GRIS.ici = false; if (typeof ETAT !== 'undefined') ETAT.id = null; return; }
  GRIS.sol = new Map();
  places.forEach((q, k) => grBatir(ordre[k], q));
  // les veilleurs de l'arche et du lointain
  const veil = grVeil;
  if (PortailIle) veil(grCercle(PortailIle.x, PortailIle.y, 5.5), 1.0, Math.random() * 30);
  const S0 = P.spawn || [WS / 2, WS / 2];
  for (let m = 0, essais = 0; m < 2 && essais < 300; essais++) {
    const a = Math.random() * 6.2832, r = 30 + Math.random() * 40, x = S0[0] + Math.cos(a) * r, y = S0[1] + Math.sin(a) * r, R = 8 + Math.random() * 6;
    if (x < 20 || y < 20 || x > WS - 20 || y > WS - 20 || hAt(x | 0, y | 0) <= SEA) continue;
    if (GRIS.SS.some(S => Math.hypot(x - S.cx, y - S.cy) < R + 18)) continue;
    if (PortailIle && Math.hypot(x - PortailIle.x, y - PortailIle.y) < R + 10) continue;
    if (Math.hypot(x - S0[0], y - S0[1]) < R + 12) continue;
    veil(grCercle(x, y, R), 1.2, Math.random() * 60); m++;
  }
}
function grVeil(pts, v, ph, z) {
  const b = naitre(specById.gr_veilleur, pts[0][0], pts[0][1], 1e6);
  b.ech = 1; b.pv = 1; b.variante = null; b.bob = Math.random() * 6; b.ronde = grRonde(pts, v, ph); b.voit = 0; b.regard = 0; b.zFixe = z ?? null;
  GRIS.veilleurs.push(b); beasts.push(b); return b;
}
function grPose(S, id, px, py, z, rx, ry) {
  const [x, y] = grPt(S, px, py), b = naitre(specById[id], x, y, 1e6);
  b.z = z; b.ech = 1; b.pv = 1; b.variante = null; b.dir = b.dirT = grAngle(S, rx, ry); b.bob = Math.random() * 6; b.S = S;
  b.lx = Math.floor(px); b.ly = Math.floor(py);
  S.objets.push(b); beasts.push(b); return b;
}
function grBatir(coul, q) {
  const S = { coul, cx: q[0], cy: q[1], z0: 0, r: 0, resolu: false, pris: false, fautes: 0, porte: 0, objets: [], indices: 0, indiceT: 0 };
  GRIS.SS.push(S);
  { const S0 = P.spawn || [WS / 2, WS / 2], vx = S0[0] - q[0], vy = S0[1] - q[1]; let bd = -1e9;   // l'entrée regarde vers l'arrivée
    GR_ROT.forEach((f, r) => { const d = f[0] * vx + f[1] * vy; if (d > bd) { bd = d; S.r = r; } }); }
  let sm = 0, n = 0;
  for (let ly = 0; ly <= 16; ly++) for (let lx = 0; lx <= 16; lx++) { const i = grIdx(S, lx, ly); if (Hgt[i] > SEA && Bio[i] !== 8) { sm += Hgt[i]; n++; } }
  S.z0 = Math.max(SEA + 1, Math.min(240, Math.round(sm / Math.max(1, n))));
  // le sol : la cour dallée, l'enceinte, le cœur, les socles ; autour, trois cases qui rejoignent le terrain
  const sol0 = GRIS.sol, socles = coul === 'rouge' ? GR_SOCLES_R : [], blocs = coul === 'vert' ? GR_BLOCS0 : [];
  const mets = (i, h, b) => { if (!sol0.has(i)) sol0.set(i, [Hgt[i], Bio[i], Flo[i]]); Hgt[i] = h; if (b != null) Bio[i] = b; Flo[i] = 0; };
  for (let ly = -3; ly <= 19; ly++) for (let lx = -3; lx <= 19; lx++) {
    const [x, y] = grCase(S, lx, ly); if (x < 1 || y < 1 || x >= WS - 1 || y >= WS - 1) continue;
    const i = y * WS + x, d = Math.max(-lx, lx - 16, -ly, ly - 16, 0);
    if (d > 0) { const h = Hgt[i]; if (h > SEA && !Eau[i] && Bio[i] !== 8 && !PlT[i]) mets(i, Math.max(S.z0 - d, Math.min(S.z0 + d, h)), null); continue; }
    const bord = lx === 0 || lx === 16 || ly === 0 || ly === 16, entree = ly === 16 && lx >= 7 && lx <= 9;
    const coeur = ((lx === 5 || lx === 11) && ly <= 5) || (ly === 5 && lx >= 5 && lx <= 11);
    let h = S.z0, b = 6;
    if ((bord && !entree) || coeur) { h = S.z0 + 4; b = 5; }
    if ((lx === 8 && ly === 2) || socles.some(([a, c]) => a === lx && c === ly)) { h = S.z0 + 1; b = 5; }
    if (blocs.some(([a, c]) => a === lx && c === ly)) { h = S.z0 + 1; b = 2; }
    mets(i, h, b);
  }
  S.porte = grIdx(S, 8, 5);
  // ce qui vivait là s'écarte (même tri chez tous : le hasard est celui de la graine)
  beasts = beasts.filter(b => { const [lx, ly] = grLocal(S, b.x, b.y); return lx < -4 || lx > 21 || ly < -4 || ly > 21; });
  // le commun : l'autel, le lutrin, le seuil ; puis ce qui est propre au sanctuaire
  S.autel = grPose(S, 'gr_autel', 8.5, 2.5, S.z0 + 1, 0, 1);
  S.lutrin = grPose(S, 'gr_lutrin', 14.5, 14.5, S.z0, -1, -1);
  S.entree = grPt(S, 8.5, 14.6);
  if (coul === 'rouge') {
    S.ordre = grMelange([0, 1, 2, 3]); S.allumes = [];
    const bagues = grMelange([0, 1, 2, 3]);
    S.braseros = GR_SOCLES_R.map(([lx, ly], k) => { const b = grPose(S, 'gr_brasero', lx + .5, ly + .5, S.z0 + 1, 8.5 - lx, 10.5 - ly); b.coul = bagues[k]; b.allume = false; return b; });
    S.fresque = grPose(S, 'gr_fresque', 6.9, 6.04, S.z0, 0, 1);
  } else if (coul === 'jaune') {
    S.soleil = grPose(S, 'gr_soleil', 1.05, 13.5, S.z0, 1, 0);
    S.cristal = grPose(S, 'gr_cristal', 8.5, 6.5, S.z0, 0, 1);
    S.miroirs = GR_MIROIRS.map(([lx, ly, utile]) => { const b = grPose(S, 'gr_miroir', lx + .5, ly + .5, S.z0, 1, 0); b.utile = utile; b.etat = Math.random() < .5 ? 1 : 0; return b; });
    if (S.miroirs.filter(m => m.utile).every(m => m.etat === 0)) S.miroirs[1].etat = 1;   // jamais résolu d'avance
    S.miroirs.forEach(grMiroirDir); grRayon(S);
  } else if (coul === 'vert') {
    const [ca, cb] = grMelange(['rouge', 'vert', 'bleu', 'jaune']).slice(0, 2); S.coulA = ca; S.coulB = cb;
    S.dalles = GR_DALLES.map(([lx, ly], k) => { const b = grPose(S, 'gr_dalle', lx + .5, ly + .5, S.z0, 0, 1); b.coul = k === 0 ? ca : k === 1 ? cb : null; return b; });
    S.blocs = GR_BLOCS0.map(([lx, ly], k) => { const b = grPose(S, 'gr_bloc', lx + .5, ly + .5, S.z0 + 1, 0, 1); b.coul = k === 0 ? ca : cb; b.cible = GR_DALLES[k]; return b; });
    S.levier = grPose(S, 'gr_levier', 1.5, 14.5, S.z0, 1, -1);
  } else if (coul === 'bleu') {
    S.cible = Math.random() < .5 ? 4 : 1; S.niv = { A: 0, B: 0 };
    S.bassins = { A: grPose(S, 'gr_bassin', 5.5, 9.5, S.z0, 0, 1), B: grPose(S, 'gr_bassin', 11.5, 9.5, S.z0, 0, 1) };
    S.bassins.A.cap = 5; S.bassins.A.nom = 'A'; S.bassins.B.cap = 3; S.bassins.B.nom = 'B';
    S.vannes = GR_VANNES.map(([bas, act, lx, ly]) => { const b = grPose(S, 'gr_vanne', lx + .5, ly + .5, S.z0, lx < 8 ? 1 : -1, 0); b.bas = bas; b.act = act; return b; });
  }
  // les veilleurs : la cour (au ras des dalles), l'enceinte (deux, à l'opposé)
  const loc = L => L.map(([a, b]) => grPt(S, a, b));
  grVeil(loc([[5.5, 7.5], [11.5, 7.5], [11.5, 11.5], [5.5, 11.5]]), 1.05, Math.random() * 20, S.z0);
  const tour = loc([[-2.5, -2.5], [19.5, -2.5], [19.5, 19.5], [-2.5, 19.5]]).map(grBorne);
  const ph0 = Math.random() * 88; grVeil(tour, 1.3, ph0); grVeil(tour, 1.3, ph0 + 44);
  return S;
}

// ---------- le jaune : le rayon et les miroirs ----------
// Un miroir « / » (etat 0) ou « \ » (etat 1) dans le repère local (y vers l'entrée). Le rayon part du soleil, vers +x.
function grMiroirDir(m) { m.dir = m.dirT = grAngle(m.S, 1, m.etat ? 1 : -1) - Math.PI / 2; }
function grRayon(S) {
  const pts = [[1.0, 13.5]]; let x = 1, y = 13, dx = 1, dy = 0, touche = false;
  const mir = new Map(S.miroirs.map(m => [m.lx + ',' + m.ly, m]));
  for (let n = 0; n < 80; n++) {
    if (x === 8 && y === 6) { touche = true; pts.push([8.5, 6.5]); break; }
    const m = mir.get(x + ',' + y);
    if (m) { pts.push([x + .5, y + .5]); [dx, dy] = m.etat ? [dy, dx] : [-dy, -dx]; }
    const nx = x + dx, ny = y + dy;
    if (!grCour(nx, ny) || Hgt[grIdx(S, nx, ny)] > S.z0) { pts.push([x + .5 + dx * .5, y + .5 + dy * .5]); break; }
    x = nx; y = ny;
  }
  S.rayon = pts; S.touche = touche;
  return touche;
}

// ---------- le vert : les blocs et les dalles ----------
function grBlocA(S, b, lx, ly) {                           // déplace un bloc (le cube du sol et sa mousse)
  const i0 = grIdx(S, b.lx, b.ly), i1 = grIdx(S, lx, ly);
  Hgt[i0] = S.z0; Bio[i0] = 6; Hgt[i1] = S.z0 + 1; Bio[i1] = 2;
  if (typeof signalDecor === 'function') { signalDecor('dalle', i0); signalDecor('dalle', i1); }
  b.lx = lx; b.ly = ly; [b.x, b.y] = grPt(S, lx + .5, ly + .5);
}
function grLibre(S, lx, ly) {
  if (!grCour(lx, ly) || Hgt[grIdx(S, lx, ly)] !== S.z0) return false;
  return !S.objets.some(o => o.lx === lx && o.ly === ly && o.sp.corps !== 'gr_dalle');
}
// (§129) L'Achromie à plusieurs : un geste fait ici part chez les autres joueurs de l'île (« achro »), qui le
// rejouent ; l'état entier (sanctuaires ouverts, éclats pris, mécanismes en cours) part vers chaque nouveau venu.
function grDire(q, d) {
  if (!(typeof RS !== 'undefined' && RS.ouvert && Compte.uid) || !Autres.size || !grIci()) return;
  diffuser(canalIle(), 'achro', Object.assign({ u: Compte.uid, q }, d || {}));
}
const grS = c => GRIS.SS.find(S => S.coul === c) || null;
function grPousser(S, b) {
  const [plx, ply] = grLocal(S, P.x, P.y), ex = b.lx + .5 - plx, ey = b.ly + .5 - ply;
  const [dx, dy] = Math.abs(ex) > Math.abs(ey) ? [Math.sign(ex), 0] : [0, Math.sign(ey)];
  if (!grLibre(S, b.lx + dx, b.ly + dy)) { say('le bloc ne bouge pas · quelque chose le retient de ce côté', 1.6); return; }
  grBlocA(S, b, b.lx + dx, b.ly + dy); SON.jouer('terre', {}, b.x, b.y, b.z);
  grDire('geste', { s: S.coul, g: 'bloc', k: S.blocs.indexOf(b), lx: b.lx, ly: b.ly });
  burst(b.x, b.y, S.z0 + .1, 8, '#8a8a80');
}
function grBlocsA(S, places) {                          // pose les deux blocs d'un coup (le levier, une sauvegarde relue)
  for (const b of S.blocs) { const i = grIdx(S, b.lx, b.ly); Hgt[i] = S.z0; Bio[i] = 6; if (typeof signalDecor === 'function') signalDecor('dalle', i); }
  S.blocs.forEach((b, k) => { const [lx, ly] = places[k], i = grIdx(S, lx, ly); Hgt[i] = S.z0 + 1; Bio[i] = 2; if (typeof signalDecor === 'function') signalDecor('dalle', i);
    b.lx = lx; b.ly = ly; [b.x, b.y] = grPt(S, lx + .5, ly + .5);
    if (Math.floor(P.x) === Math.floor(b.x) && Math.floor(P.y) === Math.floor(b.y) && P.z < S.z0 + 1) P.z = S.z0 + 1; });   // pas dans le cube
}
function grRamener(S, loin) { grBlocsA(S, GR_BLOCS0); say((loin ? loin + ' tire le levier · ' : 'le levier grince · ') + 'les blocs reviennent à leur place', 2); SON.jouer('clank'); if (!loin) grDire('geste', { s: S.coul, g: 'ramener' }); }
function grDallesTenues(S) {
  const sur = (lx, ly) => { const [x, y] = grPt(S, lx + .5, ly + .5); return { x, y }; };
  const blocSur = (k) => { const [lx, ly] = GR_DALLES[k], b = S.blocs.find(o => o.lx === lx && o.ly === ly); return b && b.coul === S.dalles[k].coul; };
  const [vx, vy] = GR_DALLES[2], c = sur(vx, vy);
  const vivant = (Math.abs(P.x - c.x) < .6 && Math.abs(P.y - c.y) < .6 && Math.abs(P.z - S.z0) < .6)
    || [...Autres.values()].some(j => Math.abs(j.x - c.x) < .6 && Math.abs(j.y - c.y) < .6 && Math.abs(j.z - S.z0) < .8)   // (§129) un autre joueur
    || beasts.some(o => o.tame && !o.dead && Math.abs(o.x - c.x) < .6 && Math.abs(o.y - c.y) < .6 && Math.abs(o.z - S.z0) < .8);
  S.tenues = [blocSur(0), blocSur(1), vivant];
  return S.tenues.every(Boolean);
}

// ---------- le bleu : les bassins ----------
function grVanne(S, v) {
  const N = S.niv, a = v.bas, o = a === 'A' ? 'B' : 'A';
  if (v.act === 'remplir') N[a] = GR_CAP[a];
  else if (v.act === 'vider') N[a] = 0;
  else { const q = Math.min(N[a], GR_CAP[o] - N[o]); N[a] -= q; N[o] += q; }
  SON.jouer('plouf', {}, v.x, v.y, v.z);
  grDire('geste', { s: S.coul, g: 'vanne', A: N.A, B: N.B });
  say('le grand bassin : ' + N.A + ' sur 5 · le petit : ' + N.B + ' sur 3', 1.8);
  if (!S.resolu && N.A === S.cible) grResoudre(S);
}

// ---------- la progression : la sauvegarde, la couleur rendue ----------
const grBande = c => grCoul(c).b;
function grCouleurRendue(c, net) { const k = grBande(c); GRIS.cible[k] = 1; if (net) GRIS.bandes[k] = 1; }
function grSauver() {
  P.grisProg = { g: SEED, s: GRIS.SS.filter(S => S.resolu).map(S => S.coul), e: GRIS.eclats.slice() };
  GRIS.progLu = true; if (typeof Sauve !== 'undefined') Sauve.sale = true;
}
function grPorte(S, ouverte) {
  const i = S.porte, h = ouverte ? S.z0 : S.z0 + 4; if (!i || Hgt[i] === h) return;
  Hgt[i] = h; if (typeof signalDecor === 'function') signalDecor('dalle', i);
}
// Résolu sans y être passé (une sauvegarde relue, la fin) : les mécanismes dans leur état final.
function grResoluNet(S) {
  S.resolu = true; grPorte(S, true);
  if (S.coul === 'rouge') for (const br of S.braseros) br.allume = true;
  else if (S.coul === 'jaune') { for (const m of S.miroirs) if (m.utile) { m.etat = 0; grMiroirDir(m); } grRayon(S); }
  else if (S.coul === 'vert') grBlocsA(S, GR_DALLES.slice(0, 2));
  else if (S.coul === 'bleu') { S.niv.A = S.cible; S.niv.B = 0; }
}
function grRelire() {
  if (!GRIS.fini && (P.achromies || []).includes(SEED)) { grFinir('relu'); return; }
  const g = P.grisProg; if (!g || g.g !== SEED || GRIS.progLu) return;
  GRIS.progLu = true;
  for (const S of GRIS.SS) if ((g.s || []).includes(S.coul) && !S.resolu) grResoluNet(S);
  for (const c of g.e || []) { const S = GRIS.SS.find(o => o.coul === c); if (S && !GRIS.eclats.includes(c)) { GRIS.eclats.push(c); grCouleurRendue(c, true); S.pris = true; } }
}
const grJnl = (q, d) => { if (typeof jnl === 'function') jnl('achromie', Object.assign({ q, min: Math.round((Date.now() - GRIS.arrivee) / 6000) / 10, expl: profondeur(), n: GRIS.SS.length }, d || {})); };

// ---------- à chaque image ----------
const grPortee = () => 1 - .12 * GRIS.cible.slice(0, 4).filter(v => v > .5).length;
function grLigne(x0, y0, z0, x1, y1, z1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
  for (let k = 1; k < n; k++) { const f = k / n; if (hAt((x0 + (x1 - x0) * f) | 0, (y0 + (y1 - y0) * f) | 0) > z0 + (z1 - z0) * f + .1) return false; }
  return true;
}
function grVu(b) {
  const Rv = (GRIS.lant ? VEIL_LOIN : VEIL_PRES) * grPortee(), dx = P.x - b.x, dy = P.y - b.y, d = Math.hypot(dx, dy);
  if (d > Rv || Math.abs(P.z - b.z) > 5) return 0;
  if (d > 1.4) { let da = Math.atan2(dy, dx) - b.regard; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > VEIL_ANGLE) return 0; }
  if (!grLigne(b.x, b.y, b.z + 2.1, P.x, P.y, P.z + 1)) return 0;
  return 1.25 - d / Rv * .75;
}
function majVeilleur(b, dt) {
  const R = b.ronde; if (!R) return;
  const s = grHorloge() * R.v + R.ph, [x, y] = grPoint(R, s), [x2, y2] = grPoint(R, s + .9);
  b.vit = Math.hypot(x - b.x, y - b.y) / Math.max(dt, 1e-3);
  b.x = x; b.y = y; b.z = b.zFixe ?? sol(x, y);          // dans la cour, au ras des dalles (il passe sur les blocs)
  const cap = Math.atan2(y2 - y, x2 - x);
  b.dir = b.dirT = cap;
  const bal = Math.sin(grHorloge() * .9 + R.ph) * .5;     // le regard balaie, de part et d'autre de sa route
  let reg = cap + bal;
  if (b.voit > 0) { const vers = Math.atan2(P.y - y, P.x - x); let da = vers - reg; da = Math.atan2(Math.sin(da), Math.cos(da)); reg += da * Math.min(1, b.voit * 1.5); }
  b.regard = reg; b.voit = Math.max(0, b.voit - dt);
}
function majAchromieBete(b, dt) {
  b.t = (b.t || 0) + dt; if (b.hit > 0) b.hit -= dt;
  if (b.eclate) return;                                  // éclaté : il s'en va avec la prochaine image
  b.pv = 1; b.dead = 0;
  if (b.hit > .2 && t > GRIS.coupT) { GRIS.coupT = t + 3; say(b.sp.corps === 'gr_veilleur' ? 'le coup traverse le gris · on ne les tue pas' : 'la pierre ne bronche pas', 1.6); }
  if (b.sp.corps === 'gr_veilleur') majVeilleur(b, dt);
  else if (b.sp.corps === 'gr_bassin') { const N = b.S && b.S.niv ? b.S.niv[b.nom] : 0; b.eau = (b.eau || 0) + (N - (b.eau || 0)) * Math.min(1, dt * 3); }
}
function grDelaver(b) {
  GRIS.regard = 0; GRIS.grace = 3; GRIS.flash = 1.2; GRIS.lant = false; GRIS.charge = 0; GRIS.delaves++; GRIS.murmure = false;
  const cp = GRIS.cp || [P.x, P.y], S = GRIS.SS.find(o => o.entree === cp);
  if (S && S.coul === 'rouge' && !S.resolu) { for (const br of S.braseros) br.allume = false; S.allumes = []; }
  P.x = cp[0]; P.y = cp[1]; P.z = sol(P.x, P.y); P.vx = P.vy = P.vz = 0; P.sol = [P.x, P.y, P.z];
  if (typeof camX !== 'undefined') { camX = P.x; camY = P.y; camZ = P.z; }
  say('Délavé · un veilleur vous a vu · retour ' + (S ? 'au seuil du sanctuaire' : 'au point d\'arrivée') + ' · la lanterne est vide', 3.5);
  SON.jouer('bourdon'); grJnl('delave', { nd: GRIS.delaves, s: S ? S.coul : null, lant: b && b.lantVu ? 1 : 0 });
}
function majAchromie(dt) {
  const ici = grIci();
  grBouton(ici);
  const A = GRIS_GL.a, B = GRIS_GL.b, L = GRIS_GL.l;
  if (!ici) { A[0] = 0; L[3] = 0; GRIS_GL.arc[3] = 0; return; }
  if ((GRIS.verifT -= dt) <= 0) { GRIS.verifT = .5; grRelire(); }
  if (!GRIS.annonce && t > (typeof arriveeLe === 'number' ? arriveeLe : 0) + 1.5) {
    GRIS.annonce = true;
    if (!GRIS.fini) {
      say('Achromie · la couleur a quitté cette île, et son arche est éteinte · ' + GRIS.SS.length + ' sanctuaire' + (GRIS.SS.length > 1 ? 's gardent' : ' garde')
        + ' les éclats du prisme · la lanterne prismatique (O) rend les couleurs autour de vous, mais les veilleurs voient la couleur', 8);
      grJnl('arrivee');
    }
  }
  GRIS.k += ((GRIS.fini ? 0 : 1) - GRIS.k) * Math.min(1, dt * (GRIS.fini ? .45 : 1.6));
  for (let k = 0; k < 5; k++) GRIS.bandes[k] += (GRIS.cible[k] - GRIS.bandes[k]) * Math.min(1, dt * .7);
  if (GRIS.fini) GRIS.lant = false;
  if (GRIS.lant) { GRIS.charge -= dt / LANT_DUREE; if (GRIS.charge <= 0) { GRIS.charge = 0; GRIS.lant = false; say('la lanterne s\'éteint · elle se recharge dans l\'ombre', 2); SON.jouer('clic'); } }
  else GRIS.charge = Math.min(1, GRIS.charge + dt / LANT_RECH);
  // ce que la carte graphique en fait (index.html, GRIS_GLSL)
  A[0] = GRIS.k < .005 ? 0 : GRIS.k; A[1] = GRIS.bandes[0]; A[2] = GRIS.bandes[1]; A[3] = GRIS.bandes[2];
  B[0] = GRIS.bandes[3]; B[1] = GRIS.bandes[4]; B[2] = 1.18;
  if (GRIS.lant) { L[0] = P.x; L[1] = P.y; L[2] = P.z + 1.1; L[3] = LANT_R * (.96 + .04 * Math.sin(t * 7.3)); } else L[3] = 0;
  // (§129) l'arc-en-ciel, au-dessus de l'arche : éteint (le gris le prend), il se colore bande à bande avec les éclats ;
  // le prisme reposé, il brille une minute et demie, puis s'efface
  { const C = GRIS_GL.arc, Q = PortailIle || { x: WS / 2, y: WS / 2 }; let dx = Q.x - P.x, dy = Q.y - P.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const n = Math.hypot(dx, dy, .35); C[0] = dx / n; C[1] = dy / n; C[2] = -.35 / n;
    const vise = GRIS.fini ? (t - (GRIS.finiT || -1e9) < 90 ? 1 : 0) : .6; C[3] += (vise - C[3]) * Math.min(1, dt * .5); if (C[3] < .005 && !vise) C[3] = 0; }
  if (GRIS.fini) return;
  GRIS.grace = Math.max(0, GRIS.grace - dt); GRIS.flash = Math.max(0, GRIS.flash - dt * .8);
  const Si = grDans(P.x, P.y);
  if (Si) { const [lx, ly] = grLocal(Si, P.x, P.y); if (grCour(lx, ly)) GRIS.cp = Si.entree; }   // le seuil du sanctuaire
  // le vert : les dalles se vérifient d'elles-mêmes (on peut s'y tenir, une compagne aussi)
  for (const S of GRIS.SS) if (S.coul === 'vert' && !S.resolu && (S === Si || S.tenues) && grDallesTenues(S)) grResoudre(S);
  // les regards
  let v = 0, qui = null;
  if (P.pv > 0 && GRIS.grace <= 0) for (const b of GRIS.veilleurs) if (!b.eclate && !b.dead) { const q = grVu(b); if (q > v) { v = q; qui = b; } }
  if (qui) {
    qui.voit = .5; qui.lantVu = GRIS.lant;
    GRIS.regard += dt * v * (GRIS.lant ? 1.5 : 1);
    if (!GRIS.murmure && GRIS.regard > .25) { GRIS.murmure = true; SON.jouer('murmure'); }
    if (GRIS.regard >= 1) grDelaver(qui);
  } else { GRIS.regard = Math.max(0, GRIS.regard - dt * .45); if (GRIS.regard < .1) GRIS.murmure = false; }
  // la poussière pâle de leurs regards, les flammes des braseros, les éclats de la lanterne
  const Rv = (GRIS.lant ? VEIL_LOIN : VEIL_PRES) * grPortee();
  for (const b of GRIS.veilleurs) {
    if (b.eclate || (b.x - P.x) ** 2 + (b.y - P.y) ** 2 > 40 * 40) continue;
    let n = dt * 16; while (n > 0) { if (Math.random() < n) {
      const a = b.regard + (Math.random() * 2 - 1) * VEIL_ANGLE, d = Math.pow(Math.random(), .7) * Rv, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d, z = b.zFixe ?? sol(x, y);
      if (grLigne(b.x, b.y, b.z + 2.1, x, y, z + .3)) parts.push({ x, y, z: z + .08, vx: Math.cos(a) * .15, vy: Math.sin(a) * .15, vz: .12, g: 0, life: .9, age: 0, col: b.voit > 0 ? '#ffffff' : '#d4d6dc', tl: .03 });
    } n -= 1; }
  }
  const R = GRIS.SS.find(S => S.coul === 'rouge');
  if (R) for (const br of R.braseros) if (br.allume && Math.random() < dt * 6 && (br.x - P.x) ** 2 + (br.y - P.y) ** 2 < 900)
    parts.push({ x: br.x + (Math.random() - .5) * .3, y: br.y + (Math.random() - .5) * .3, z: br.z + 1.1, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, vz: 1.2, g: -.4, life: .8, age: 0, col: '#ffb060', tl: .04 });
  if (GRIS.lant && Math.random() < dt * 10) { const a = Math.random() * 6.2832, r = .4 + Math.random() * .6, c = GR_COUL[Math.random() * 4 | 0].rgb;
    parts.push({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, z: P.z + 1 + Math.random() * .6, vx: 0, vy: 0, vz: .3, g: 0, life: .7, age: 0, col: 'rgb(' + c.join(',') + ')', tl: .03 }); }
}

// ---------- la lanterne ----------
function basculerLanterne() {
  if (!grIci() || GRIS.fini) { say('la lanterne prismatique ne sert que sur une île frappée d\'Achromie', 2); return; }
  if (GRIS.lant) { GRIS.lant = false; SON.jouer('clic'); say('lanterne éteinte', 1.2); return; }
  if (GRIS.charge < .12) { say('la lanterne est vide · elle se recharge dans l\'ombre', 1.8); return; }
  GRIS.lant = true; SON.jouer('tinte');
  say(GRIS.ditLant ? 'lanterne allumée' : 'lanterne allumée · les couleurs reviennent autour de vous… et les veilleurs vous voient de loin', GRIS.ditLant ? 1.2 : 3);
  GRIS.ditLant = true;
}
function grBouton(ici) {
  if (!GRIS.btn) {
    if (!ici) return;
    const c = document.getElementById('combat'); if (!c) return;
    const st = document.createElement('style');
    st.textContent = '#blant{right:90px;bottom:88px;width:74px;height:62px;border-radius:14px;font-size:10px;letter-spacing:.2px !important;'
      + 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}#blant[hidden]{display:none;}'
      + '#blant b{font-weight:600;color:#c9ccd6;}#blant.on b{color:#fff;text-shadow:0 0 6px rgba(255,255,255,.8);}'
      + '#blant.on{border-color:rgba(255,255,255,.7) !important;}#blant span{font-size:9px;color:#8d9ab4;}'
      + '#hudtxt .etiq.achromie{background:rgba(226,228,236,.16);color:#e2e4ec;}';
    document.head.appendChild(st);
    const b = document.createElement('button'); b.id = 'blant'; b.type = 'button'; b.innerHTML = '<kbd>O</kbd><b>LANTERNE</b><span></span>';
    b.addEventListener('pointerdown', e => { e.preventDefault(); basculerLanterne(); });
    c.appendChild(b); GRIS.btn = b;
  }
  const vis = ici && !GRIS.fini;
  if (GRIS.btn.hidden === vis) GRIS.btn.hidden = !vis;
  if (vis && --GRIS.btnT <= 0) {
    GRIS.btnT = 12;
    GRIS.btn.lastChild.textContent = Math.round(GRIS.charge * 100) + ' %';
    GRIS.btn.classList.toggle('on', GRIS.lant);
  }
}

// ---------- ACTION : l'arche, les mécanismes ----------
const grEclaire = o => GRIS.fini || (GRIS.lant && Math.hypot(o.x - P.x, o.y - P.y, (o.z - P.z) * .8) < LANT_R * .85);
const GR_PORTEE_ACT = { gr_brasero: 1.9, gr_fresque: 2.2, gr_autel: 2, gr_lutrin: 2, gr_miroir: 1.6, gr_bloc: 1.5, gr_levier: 1.7, gr_vanne: 1.5, gr_bassin: 1.6, gr_cristal: 1.4 };
function achromieAction() {
  if (!grIci()) return null;
  const A = PortailIle;
  if (A && !GRIS.fini && (P.x - A.x) ** 2 + (P.y - A.y) ** 2 < (PORTAIL_R + .4) ** 2) {
    const manque = GRIS.SS.filter(S => !GRIS.eclats.includes(S.coul));
    if (!manque.length) return { v: 'PRISME', o: 'reposer ' + (GRIS.eclats.length > 1 ? 'les ' + GRIS.eclats.length + ' éclats' : 'l\'éclat'), f: () => grFinir('local') };
    const S = manque.slice().sort((a, b) => Math.hypot(a.cx - P.x, a.cy - P.y) - Math.hypot(b.cx - P.x, b.cy - P.y))[0];
    const ou = typeof versLe === 'function' ? versLe(S.cx - P.x, S.cy - P.y) : '';
    const txt = 'L\'arche est éteinte : son prisme est brisé · il manque l\'éclat ' + manque.map(S => grCoul(S.coul).n).join(', ')
      + ' · le plus proche, le sanctuaire ' + GR_NOM_S[S.coul] + ', est ' + ou;
    return { v: 'PRISME', o: 'brisé · ' + GRIS.eclats.length + ' sur ' + GRIS.SS.length, f: () => say(txt, 5), vide: true };
  }
  const S = grDans(P.x, P.y, 2); if (!S) return null;
  let pr = null, dp = 1e9;
  for (const o of S.objets) {
    const R = GR_PORTEE_ACT[o.sp.corps]; if (!R) continue;
    const d = (o.x - P.x) ** 2 + (o.y - P.y) ** 2;
    if (d < R * R && d < dp && Math.abs(o.z - P.z) < 2.6) { dp = d; pr = o; }
  }
  if (!pr) return null;
  const k = pr.sp.corps;
  if (k === 'gr_autel') {
    if (S.pris) return { v: 'AUTEL', o: 'vide', f: () => say('l\'autel est vide · l\'éclat est avec vous', 1.6), vide: true };
    if (!S.resolu) return { v: 'AUTEL', o: 'scellé', f: () => say('l\'éclat est scellé · la porte du cœur d\'abord', 2), vide: true };
    return { v: 'PRENDRE', o: 'l\'éclat ' + grCoul(S.coul).n, f: () => grPrendre(S) };
  }
  if (k === 'gr_lutrin') return { v: 'INDICE', o: S.indices + ' sur 3', f: () => grIndice(S) };
  if (S.resolu && k !== 'gr_fresque') return { v: 'SANCTUAIRE', o: 'la porte est ouverte', f: () => say('la porte du cœur est ouverte · l\'éclat attend sur l\'autel', 1.8), vide: true };
  if (k === 'gr_brasero') {
    if (pr.allume) return { v: 'BRASERO', o: 'allumé · ' + S.allumes.length + '/4', f: () => say('ce brasero brûle déjà · ' + S.allumes.length + ' sur 4', 1.6), vide: true };
    return { v: 'ALLUMER', o: 'brasero · bague ' + (grEclaire(pr) ? GR_COUL[pr.coul].n : 'grise'), f: () => grAllumer(S, pr) };
  }
  if (k === 'gr_fresque') return { v: 'LIRE', o: 'la fresque', f: () => grLire(S) };
  if (k === 'gr_miroir') return { v: 'TOURNER', o: 'le miroir', f: () => { pr.etat = 1 - pr.etat; grMiroirDir(pr); SON.jouer('clic', {}, pr.x, pr.y, pr.z);
    grDire('geste', { s: S.coul, g: 'miroir', i: S.miroirs.indexOf(pr), e: pr.etat }); if (grRayon(S)) grResoudre(S); } };
  if (k === 'gr_cristal') return { v: 'CRISTAL', o: S.touche ? 'il brille' : 'éteint', f: () => say(S.touche ? 'le cristal brille' : 'le cristal attend le rayon du soleil de pierre', 2), vide: true };
  if (k === 'gr_bloc') return { v: 'POUSSER', o: 'bloc de mousse' + (grEclaire(pr) ? ' ' + grCoul(pr.coul).n : ''), f: () => grPousser(S, pr) };
  if (k === 'gr_levier') return { v: 'RAMENER', o: 'les blocs', f: () => grRamener(S) };
  if (k === 'gr_vanne') {
    const nom = pr.bas === 'A' ? 'le grand bassin' : 'le petit bassin';
    return { v: pr.act === 'remplir' ? 'REMPLIR' : pr.act === 'vider' ? 'VIDER' : 'VERSER', o: pr.act === 'verser' ? nom + ' dans l\'autre' : nom + ' · ' + S.niv[pr.bas] + '/' + GR_CAP[pr.bas], f: () => grVanne(S, pr) };
  }
  if (k === 'gr_bassin') {
    const vu = grEclaire(pr);
    return { v: 'BASSIN', o: (pr.nom === 'A' ? 'le grand' : 'le petit') + ' · ' + S.niv[pr.nom] + '/' + pr.cap, vide: true,
      f: () => say(pr.nom === 'A' ? 'Le grand bassin · ' + S.niv.A + ' mesures sur 5 · ' + (vu ? 'une encoche bleue marque la ' + S.cible + 'e' : 'cinq encoches, toutes du même gris')
        : 'Le petit bassin · ' + S.niv.B + ' mesures sur 3', 3.5) };
  }
  return null;
}
function grLire(S) {
  const vu = grEclaire(S.fresque);
  say(vu ? 'La fresque · quatre flammes peintes, de gauche à droite : ' + S.ordre.map(c => GR_COUL[c].n).join(', ') + ' · « Que le feu suive l\'ordre des couleurs »'
    : 'La fresque · quatre flammes peintes, toutes du même gris · « Que le feu suive l\'ordre des couleurs »', 6);
  grJnl('lire', { s: S.coul, vu: vu ? 1 : 0 });
}
function grIndice(S) {
  const now = Date.now(), L = GR_INDICES[S.coul](S);
  if (S.indices >= L.length) { say('Le lutrin · ' + L[L.length - 1], 6); return; }
  if (S.indices > 0 && now - S.indiceT < 40000) { say('le lutrin se tait encore · ' + Math.ceil((40000 - (now - S.indiceT)) / 1000) + ' s', 1.8); return; }
  S.indices++; S.indiceT = now; GRIS.indices++;
  say('Le lutrin · ' + L[S.indices - 1], 7); SON.jouer('tinte');
  grJnl('indice', { s: S.coul, ni: S.indices });
}
function grAllumer(S, br, loin) {
  if (S.resolu || br.allume) return;
  if (!loin) grDire('geste', { s: S.coul, g: 'brasero', i: S.braseros.indexOf(br) });
  const att = S.ordre[S.allumes.length];
  if (br.coul === att) {
    br.allume = true; S.allumes.push(br); SON.jouer('bouffee', {}, br.x, br.y, br.z);
    burst(br.x, br.y, br.z + 1, 12, '#ffb060');
    if (S.allumes.length < 4) say((loin ? loin + ' allume un brasero · ' : 'le brasero s\'allume · ') + S.allumes.length + ' sur 4', 1.8);
    else grResoudre(S, loin);
  } else {
    for (const b of S.braseros) { if (b.allume) burst(b.x, b.y, b.z + 1, 10, '#9a9aa2'); b.allume = false; }
    S.allumes = []; S.fautes++;
    say('un souffle gris éteint les braseros · ' + (loin ? loin + ' s\'est trompé d\'ordre' : 'ce n\'était pas le bon ordre'), 2.6); SON.jouer('bourdon');
    grJnl('faux', { s: S.coul, nf: S.fautes });
  }
}
function grResoudre(S, loin) {
  if (S.resolu) return;
  S.resolu = true; grPorte(S, true); grSauver();
  if (!loin) grDire('resolu', { s: S.coul });
  const quoi = { rouge: 'Les quatre feux brûlent', jaune: 'Le rayon touche le cristal', vert: 'Les trois dalles s\'enfoncent', bleu: 'Le grand bassin porte sa mesure' }[S.coul];
  say(quoi + ' · la porte du cœur s\'ouvre', 4); SON.jouer('portail');
  grJnl('sanctuaire', { s: S.coul, nf: S.fautes, nd: GRIS.delaves, ni: S.indices });
}
function grEclatAcquis(S) { S.pris = true; if (!GRIS.eclats.includes(S.coul)) { GRIS.eclats.push(S.coul); grCouleurRendue(S.coul); } }
function grPrendre(S) {
  if (!S.resolu || S.pris) return;
  grEclatAcquis(S); grSauver(); grDire('eclat', { s: S.coul });
  const c = grCoul(S.coul);
  burst(S.autel.x, S.autel.y, S.autel.z + .8, 26, 'rgb(' + c.rgb.join(',') + ')');
  const reste = GRIS.SS.length - GRIS.eclats.length;
  say('L\'éclat ' + c.n + ' · le ' + c.n + ' revient sur l\'île · ' + (reste ? 'il en manque ' + reste + ' au prisme' : 'rapportez les éclats à l\'arche') + ' · les veilleurs voient moins loin', 5);
  SON.jouer('rare'); grJnl('eclat', { s: S.coul });
}
function grPigment() {
  const niv = profondeur(), w = [1, 2, 3, 4, 5, 6].map(r => typeof poidsRarete === 'function' ? poidsRarete(r, niv) : r === 1 ? 1 : 0);
  let s = w.reduce((a, b) => a + b, 0) * Math.random(), r = 1;
  for (let k = 0; k < 6; k++) { s -= w[k]; if (s <= 0) { r = k + 1; break; } }
  const c = r === 6 ? 'prisme' : GR_COUL[Math.random() * 4 | 0].id, k = c + ':' + r;
  P.pigments = P.pigments || {}; P.pigments[k] = (P.pigments[k] || 0) + 1;
  return { k, c, r, n: grNomPigment(c, r) };
}
// mode : 'local' (vous reposez le prisme), 'equipe' (un autre joueur de l'île, devant vous), 'relu' (une sauvegarde,
// ou l'île trouvée déjà rendue par d'autres : la couleur, sans pigment ni fanfare).
function grFinir(mode, qui) {
  if (GRIS.fini) return;
  const silencieux = mode === true || mode === 'relu';
  GRIS.fini = true; GRIS.finiT = t; GRIS.lant = false; GRIS.regard = 0; GRIS.cible = [1, 1, 1, 1, 1];
  for (const b of GRIS.veilleurs) {
    if (!silencieux && !b.eclate && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 80 * 80) for (const c of GR_COUL) burst(b.x, b.y, b.z + 1.4, 8, 'rgb(' + c.rgb.join(',') + ')');
    b.eclate = true; b.dead = 1;                         // la prochaine image les retire
  }
  for (const S of GRIS.SS) { if (!S.resolu) grResoluNet(S); S.pris = true; }
  const deja = (P.achromies || []).includes(SEED);
  P.achromies = [...(P.achromies || []).filter(g => g !== SEED), SEED].slice(-300); P.grisProg = null;
  if (silencieux) { GRIS.k = 0; GRIS.bandes = [1, 1, 1, 1, 1]; GRIS.finiT = -1e9; if (typeof Sauve !== 'undefined') Sauve.sale = true; return; }
  if (mode === 'local') grDire('fini');
  if (typeof Sauve !== 'undefined') Sauve.sale = true;
  const pg = deja ? null : grPigment();
  const rang = pg && typeof RARETES !== 'undefined' && RARETES[pg.r - 1] ? ' (' + RARETES[pg.r - 1] + ')' : '';
  say((qui ? qui + ' repose le prisme · ' : 'Le prisme se rallume · ') + 'la couleur revient sur l\'île · l\'arche est rouverte' + (pg ? ' · +1 pigment : ' + pg.n + rang : ''), 7);
  SON.jouer('portail'); SON.jouer('rare');
  if (PortailIle) for (const c of GR_COUL) burst(PortailIle.x, PortailIle.y, PortailIle.z + 2, 14, 'rgb(' + c.rgb.join(',') + ')');
  grJnl('fini', { nd: GRIS.delaves, ni: GRIS.indices, nf: GRIS.SS.reduce((a, S) => a + S.fautes, 0), pigment: pg ? pg.k : null, equipe: qui ? 1 : 0 });
  if (typeof sacOuvert !== 'undefined' && sacOuvert && typeof majSac === 'function') majSac();
}

// ---------- l'Achromie à plusieurs (§129) ----------
function grEtat() {
  const m = {};
  for (const S of GRIS.SS) if (!S.resolu) m[S.coul] = S.coul === 'rouge' ? S.allumes.map(b => S.braseros.indexOf(b)) : S.coul === 'jaune' ? S.miroirs.map(o => o.etat)
    : S.coul === 'vert' ? S.blocs.map(b => [b.lx, b.ly]) : [S.niv.A, S.niv.B];
  return { r: GRIS.SS.filter(S => S.resolu).map(S => S.coul), e: GRIS.eclats.slice(), f: GRIS.fini ? 1 : 0, m };
}
function achromieEnvoyer(pour) { if (grIci()) grDire('etat', { pour, w: grEtat() }); }
const grEntier = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
function grMeca(S, v) {                                    // l'état d'un mécanisme en cours, dit par un autre joueur
  if (!Array.isArray(v) || S.resolu) return;
  if (S.coul === 'rouge') {
    if (!v.every(i => grEntier(i, 0, 3))) return;
    for (const b of S.braseros) b.allume = false;
    S.allumes = v.map(i => S.braseros[i]); for (const b of S.allumes) b.allume = true;
  } else if (S.coul === 'jaune') {
    v.forEach((e, i) => { const m = S.miroirs[i]; if (m && (e === 0 || e === 1)) { m.etat = e; grMiroirDir(m); } }); grRayon(S);
  } else if (S.coul === 'vert') {
    if (v.length === 2 && v.every(q => Array.isArray(q) && grEntier(q[0], 1, 15) && grEntier(q[1], 6, 15)) && (v[0][0] !== v[1][0] || v[0][1] !== v[1][1])) grBlocsA(S, v);
  } else if (S.coul === 'bleu') { if (grEntier(v[0], 0, 5) && grEntier(v[1], 0, 3)) { S.niv.A = v[0]; S.niv.B = v[1]; } }
}
function achromieRecu(d) {
  if (!grIci() || !d || typeof d.q !== 'string') return;
  const j = Autres.get(d.u), qui = j && j.nom && j.nom !== '?' ? j.nom : 'un autre joueur';
  if (d.q === 'etat') {
    if (d.pour && d.pour !== Compte.uid) return;
    const w = d.w; if (!w || typeof w !== 'object') return;
    if (w.f && !GRIS.fini) { grFinir('relu'); say(qui + ' a déjà rendu sa couleur à cette île', 3); return; }
    if (GRIS.fini) return;
    for (const c of Array.isArray(w.r) ? w.r : []) { const S = grS(c); if (S && !S.resolu) grResoluNet(S); }
    for (const c of Array.isArray(w.e) ? w.e : []) { const S = grS(c); if (S && !S.pris) { if (!S.resolu) grResoluNet(S); grEclatAcquis(S); } }
    if (w.m && typeof w.m === 'object') for (const [c, v] of Object.entries(w.m)) { const S = grS(c); if (S) grMeca(S, v); }
    grSauver(); return;
  }
  if (GRIS.fini) return;
  const S = grS(d.s);
  if (d.q === 'fini') { grFinir('equipe', qui); return; }
  if (!S) return;
  if (d.q === 'eclat') { if (!S.pris) { if (!S.resolu) grResoluNet(S); grEclatAcquis(S); grSauver(); say(qui + ' a pris l\'éclat ' + grCoul(S.coul).n + ' · le ' + grCoul(S.coul).n + ' revient sur l\'île', 4); SON.jouer('rare'); } return; }
  if (d.q === 'resolu') { if (!S.resolu) { grResoluNet(S); grSauver(); say(qui + ' a ouvert le sanctuaire ' + GR_NOM_S[S.coul], 3); SON.jouer('portail'); } return; }
  if (d.q !== 'geste' || S.resolu) return;
  if (d.g === 'brasero' && grEntier(d.i, 0, 3) && S.braseros) grAllumer(S, S.braseros[d.i], qui);
  else if (d.g === 'miroir' && S.miroirs && grEntier(d.i, 0, S.miroirs.length - 1) && (d.e === 0 || d.e === 1)) {
    const m = S.miroirs[d.i]; m.etat = d.e; grMiroirDir(m); SON.jouer('clic', {}, m.x, m.y, m.z); if (grRayon(S)) grResoudre(S, qui);
  } else if (d.g === 'bloc' && S.blocs && grEntier(d.k, 0, 1) && grEntier(d.lx, 1, 15) && grEntier(d.ly, 6, 15)) {
    const b = S.blocs[d.k], o = S.blocs[1 - d.k]; if (o.lx !== d.lx || o.ly !== d.ly) { grBlocA(S, b, d.lx, d.ly); SON.jouer('terre', {}, b.x, b.y, b.z); }
  } else if (d.g === 'ramener' && S.blocs) grRamener(S, qui);
  else if (d.g === 'vanne' && S.niv && grEntier(d.A, 0, 5) && grEntier(d.B, 0, 3)) {
    S.niv.A = d.A; S.niv.B = d.B; SON.jouer('plouf', {}, S.bassins.A.x, S.bassins.A.y, S.z0);
    if (S.niv.A === S.cible) grResoudre(S, qui);
  }
}
// La musique revient par couches (index.html, MUS.phrases) : rien, puis les accords, puis la mélodie ; toute, la
// couleur rendue (la pulsation des lointains comprise).
function achromieVoix() {
  if (!grIci() || GRIS.fini) return 3;
  const n = GRIS.eclats.length, N = Math.max(1, GRIS.SS.length);
  return n === 0 ? 0 : n >= Math.ceil(N / 2) ? 2 : 1;
}

// ---------- ce que le jeu demande ----------
const achromieArche = () => grIci() && !GRIS.fini;
const achromieMuette = () => achromieVoix() === 0;
function achromieVoile() { return grIci() && !GRIS.fini ? Math.min(.85, Math.max(GRIS.regard * .55, GRIS.flash * .8)) : 0; }
function achromieCss() {
  if (!grIci() || GRIS.k < .01) return '';
  const gl = typeof G3 !== 'undefined' && G3.ok && !G3.perdu && (mode === 'fps' || (mode === 'iso' && isoGL));
  if (gl) return '';                                     // la carte graphique s'en charge, couleur par couleur
  const rendu = GRIS.bandes.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  return `grayscale(${(GRIS.k * (1 - .85 * rendu)).toFixed(2)}) contrast(${(1 + .15 * GRIS.k).toFixed(2)})`;
}
function achromieHud() {
  if (!grIci() || GRIS.fini) return '';
  return '<span class="etiq achromie">achromie · éclats ' + GRIS.eclats.length + '/' + GRIS.SS.length + (GRIS.regard > .05 ? ' · vu ' + Math.round(GRIS.regard * 100) + ' %' : '') + '</span>';
}
function blocPigments() {
  const L = Object.entries(P.pigments || {}).filter(([, n]) => n > 0)
    .map(([k, n]) => { const [c, r] = k.split(':'); return { c, r: +r || 1, n }; }).sort((a, b) => b.r - a.r || a.c.localeCompare(b.c));
  let h = `<h3>Pigments <span class="compte">${L.reduce((a, o) => a + o.n, 0)}</span></h3>`;
  if (!L.length) return h + '<p class="note" style="margin:2px 2px 8px">Une île frappée d\'Achromie, rendue à ses couleurs, en donne un : un seul par île, plus rare à mesure qu\'on s\'enfonce.</p>';
  for (const o of L) {
    const fond = o.c === 'prisme' ? 'linear-gradient(135deg,#e04848,#d8b030,#40a060,#4868e0)' : 'rgb(' + (GR_PIG_RGB[o.c] || [128, 128, 128]).join(',') + ')';
    h += `<div class="obj" style="gap:10px"><span class="case" style="background:${fond};border-radius:6px"></span><div style="flex:1;min-width:0">`
      + `<div class="n">${typeof nomRare === 'function' ? nomRare(grNomPigment(o.c, o.r), o.r) : grNomPigment(o.c, o.r)}</div>`
      + `<div class="d">pigment ${o.c === 'prisme' ? 'prismatique' : o.c}${o.n > 1 ? ' · ' + o.n : ''}</div></div></div>`;
  }
  return h + '<p class="note" style="margin:2px 2px 8px">Gardés pour plus tard.</p>';
}

// ---------- leurs volumes ----------
// Les outils de la brume (brume.js, outilsOs) : des repères, des volumes posés dedans. Le gris les prend comme
// le reste ; la lanterne leur rend leurs couleurs. (Dans le repère d'un objet, +y est à gauche de qui le regarde.)
function osAchromie(f) {
  const O = outilsOs(f), k = f.sp.corps;
  const fn = { gr_veilleur: osVeilleur, gr_brasero: osBrasero, gr_fresque: osFresque, gr_autel: osAutel, gr_lutrin: osLutrin, gr_miroir: osMiroir,
    gr_soleil: osSoleil, gr_cristal: osCristal, gr_dalle: osDalle, gr_bloc: osBloc, gr_levier: osLevier, gr_bassin: osBassin, gr_vanne: osVanne }[k];
  if (fn) fn(f, O);
  return O.B;
}
// LE VEILLEUR : une longue robe noire qui flotte au-dessus du sol, un ourlet blanc ; de longues manches, des
// mains blanches ; un capuchon pointu, un masque blanc lisse, une fente qui luit — elle s'ouvre quand il vous voit.
function osVeilleur(f, O) {
  const { add, os2 } = O, N = [16, 16, 19], N2 = [30, 30, 34], W = [236, 236, 240];
  const z = .2 + .07 * Math.sin(t * 1.6 + (f.bob || 0)), v = f.voit > 0;
  os2([0, 0, z], [0, 0, z + .8], .86, N);
  os2([0, 0, z - .02], [0, 0, z + .05], .9, W);
  os2([0, 0, z + .8], [0, 0, z + 1.42], .64, N);
  os2([0, 0, z + 1.42], [0, 0, z + 1.86], .5, N2);
  for (const s of [-1, 1]) { os2([0, s * .3, z + 1.76], [.1, s * .38, z + 1.02], .17, N); os2([.1, s * .38, z + 1.02], [.14, s * .39, z + .86], .1, W); }
  const hy = (f.regard ?? f.dir ?? 0) - (f.dir || 0), c = Math.cos(hy), s = Math.sin(hy), zh = z + 2.1;
  os2([0, 0, z + 1.86], [0, 0, z + 2.4], .4, N);
  os2([0, 0, z + 2.4], [-.06 * c, -.06 * s, z + 2.66], .2, N);
  const M = (a, b) => [a * c - b * s, a * s + b * c];
  { const [x0, y0] = M(.19, -.13), [x1, y1] = M(.19, .13); add([x0, y0, zh], [x1, y1, zh], .05, .28, W); }
  { const e = v ? .07 : .04, [x0, y0] = M(.22, -.1), [x1, y1] = M(.22, .1); add([x0, y0, zh + .03], [x1, y1, zh + .03], .03, e, [255, 255, 255], true); }
}
function osBrasero(f, O) {
  const { os2 } = O, c = GR_COUL[f.coul] ? GR_COUL[f.coul].rgb : [128, 128, 128];
  os2([0, 0, 0], [0, 0, .42], .2, [64, 62, 60]);
  os2([0, 0, .42], [0, 0, .5], .42, [58, 56, 54]);
  os2([0, 0, .5], [0, 0, .74], .66, [74, 70, 66]);
  os2([0, 0, .55], [0, 0, .67], .71, c);                 // la bague de céramique : sa couleur
  if (f.allume) { const q = .5 + .5 * Math.sin(t * 9 + (f.bob || 0)); os2([0, 0, .72], [0, 0, 1.18 + .14 * q], .36, [255, 140, 40], true); os2([0, 0, .74], [0, 0, 1.38 + .16 * q], .16, [255, 222, 128], true); }
  else os2([0, 0, .72], [0, 0, .77], .52, [84, 80, 76]);
}
function osFresque(f, O) {
  const { add } = O, S = f.S, ord = S && S.ordre ? S.ordre : [0, 1, 2, 3];
  add([.03, -.82, 1.25], [.03, .82, 1.25], .06, 1.3, [150, 144, 134]);
  add([.06, -.82, 1.86], [.06, .82, 1.86], .04, .07, [92, 88, 82]);
  add([.06, -.82, .66], [.06, .82, .66], .04, .07, [92, 88, 82]);
  for (let k = 0; k < 4; k++) {
    const y = .6 - k * .4;
    add([.07, y - .13, 1.08], [.07, y + .13, 1.08], .03, .26, GR_COUL[ord[k]].rgb);   // le disque peint
    add([.07, y - .045, 1.5], [.07, y + .045, 1.5], .03, .24, [104, 100, 94]);        // la flamme gravée
    add([.07, y - .09, 1.42], [.07, y + .09, 1.42], .03, .08, [104, 100, 94]);
  }
}
function osAutel(f, O) {
  const { os2 } = O, S = f.S;
  os2([0, 0, 0], [0, 0, .12], .78, [140, 136, 128]);
  os2([0, 0, .12], [0, 0, .2], .52, [118, 114, 108]);
  if (S && !S.pris) {
    const q = Math.sin(t * 1.8) * .06, c = grCoul(S.coul).rgb;
    os2([0, 0, .42 + q], [0, 0, .98 + q], .18, c, true); os2([0, 0, .6 + q], [0, 0, .8 + q], .3, c, true);
  }
}
function osLutrin(f, O) {
  const { os2, add } = O;
  os2([0, 0, 0], [0, 0, .08], .5, [96, 90, 84]); os2([0, 0, .08], [0, 0, .9], .12, [84, 66, 50]);
  add([-.16, 0, .95], [.16, 0, 1.04], .52, .05, [70, 54, 40]);
  add([-.14, 0, .99], [.14, 0, 1.08], .46, .04, [222, 214, 196]);
}
// LE MIROIR : un pied, un cadre doré, une glace claire — tourné d'un quart de tour à chaque ACTION.
function osMiroir(f, O) {
  const { os2, add } = O;
  os2([0, 0, 0], [0, 0, .12], .44, [96, 92, 86]); os2([0, 0, .12], [0, 0, .45], .1, [150, 120, 50]);
  add([0, -.48, .95], [0, .48, .95], .1, .92, [170, 140, 52]);            // le cadre
  add([.03, -.42, .95], [.03, .42, .95], .06, .8, [214, 224, 236]);       // la glace, d'un côté…
  add([-.03, -.42, .95], [-.03, .42, .95], .06, .8, [214, 224, 236]);     // …et de l'autre
}
// LE SOLEIL DE PIERRE : un disque sculpté dans le mur, son cœur luit ; et le rayon, qui ne se voit qu'à la lanterne.
function osSoleil(f, O) {
  const { os2, add, local } = O, S = f.S;
  add([.04, -.34, 1.0], [.04, .34, 1.0], .08, .68, [150, 144, 132]);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832; add([.06, Math.cos(a) * .38, 1 + Math.sin(a) * .38], [.06, Math.cos(a) * .5, 1 + Math.sin(a) * .5], .05, .07, [130, 124, 112]); }
  os2([.07, 0, .94], [.07, 0, 1.06], .2, [255, 214, 90], true);
  if (!S || !S.rayon || !GRIS.lant) return;
  const z = S.z0 + 1;                                     // le rayon, case par case, là où porte la lanterne
  for (let k = 0; k + 1 < S.rayon.length; k++) {
    const [ax, ay] = S.rayon[k], [bx, by] = S.rayon[k + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / .5));
    for (let j = 0; j < n; j++) {
      const p0 = grPt(S, ax + (bx - ax) * j / n, ay + (by - ay) * j / n), p1 = grPt(S, ax + (bx - ax) * (j + 1) / n, ay + (by - ay) * (j + 1) / n);
      if (Math.hypot((p0[0] + p1[0]) / 2 - P.x, (p0[1] + p1[1]) / 2 - P.y) > LANT_R * .9) continue;
      add(local([p0[0], p0[1], z]), local([p1[0], p1[1], z]), .07, .07, [255, 226, 110], true);
    }
  }
}
function osCristal(f, O) {
  const { os2 } = O, S = f.S, on = S && S.touche;
  os2([0, 0, 0], [0, 0, .5], .24, [96, 92, 86]);
  const q = on ? .04 * Math.sin(t * 4) : 0;
  os2([0, 0, .55], [0, 0, 1.15 + q], .26, on ? [255, 232, 140] : [150, 150, 160], on);
  os2([0, 0, .7], [0, 0, .95], .38, on ? [255, 214, 90] : [128, 128, 138], on);
}
// LA DALLE : une plaque carrée au ras du sol, bordée de sa couleur ; celle du vivant porte une empreinte de pas.
function osDalle(f, O) {
  const { add } = O, S = f.S, k = S && S.dalles ? S.dalles.indexOf(f) : -1, tenue = S && S.tenues && S.tenues[k];
  const c = f.coul ? grCoul(f.coul).rgb : [150, 146, 140], z = tenue ? .01 : .04;
  add([-.42, 0, z], [.42, 0, z], .84, .04, [120, 116, 110]);
  for (const [a, b] of [[[-.46, -.46], [.46, -.46]], [[-.46, .46], [.46, .46]], [[-.46, -.46], [-.46, .46]], [[.46, -.46], [.46, .46]]])
    add([a[0], a[1], z + .02], [b[0], b[1], z + .02], .09, .04, c);
  if (!f.coul) { add([-.15, -.08, z + .03], [.12, -.08, z + .03], .12, .02, [80, 78, 74]); add([-.05, .1, z + .03], [.2, .1, z + .03], .12, .02, [80, 78, 74]); }
}
// LE BLOC DE MOUSSE : le cube est du sol (on bute dessus) ; ici, sa mousse de couleur.
function osBloc(f, O) {
  const { add } = O, c = grCoul(f.coul).rgb;
  add([-.5, 0, .03], [.5, 0, .03], 1.0, .06, c);
  for (const s of [-1, 1]) { add([-.5, s * .5, -.12], [.5, s * .5, -.12], .06, .3, c); add([s * .5, -.5, -.12], [s * .5, .5, -.12], .06, .3, c); }
}
function osLevier(f, O) {
  const { os2 } = O, S = f.S;
  os2([0, 0, 0], [0, 0, .5], .3, [96, 92, 86]);
  os2([0, 0, .5], [.25, 0, 1.05], .07, [70, 60, 50]); os2([.25, 0, 1.05], [.28, 0, 1.12], .12, [150, 146, 140]);
}
// LE BASSIN : une cuve de pierre, son eau (bleue), ses encoches ; sur le grand, l'encoche de la mesure est peinte en bleu.
function osBassin(f, O) {
  const { add, os2 } = O, S = f.S, cap = f.cap || 3, W = cap === 5 ? .8 : .6, H = .9, pierre = [140, 136, 128];
  os2([0, 0, 0], [0, 0, .08], W * 2 + .2, pierre);
  for (const s of [-1, 1]) { add([-W, s * W, .08 + H / 2], [W, s * W, .08 + H / 2], .12, H, pierre); add([s * W, -W, .08 + H / 2], [s * W, W, .08 + H / 2], .12, H, pierre); }
  const e = (f.eau || 0) / cap;
  if (e > .01) os2([0, 0, .1], [0, 0, .1 + e * (H - .1)], W * 2 - .1, [70, 120, 220]);
  for (let k = 1; k <= cap; k++) {                       // les encoches, sur la face qui regarde la porte
    const z = .1 + k / cap * (H - .1), bleu = cap === 5 && S && k === S.cible;
    add([W + .07, -.18, z], [W + .07, .18, z], .03, .05, bleu ? [70, 92, 215] : [104, 100, 94]);   // le bleu de même clarté que la pierre
  }
}
function osVanne(f, O) {
  const { os2, add } = O;
  os2([0, 0, 0], [0, 0, .7], .2, [96, 92, 86]);
  const a = f.act === 'remplir' ? 0 : f.act === 'vider' ? 1 : 2, q = t * .5 + (f.bob || 0);
  os2([.12, 0, .7], [.2, 0, .7], .1, [70, 60, 50]);
  for (let k = 0; k < 3; k++) { const b = q + k * 2.094; add([.22, Math.cos(b) * .02, .7 + Math.sin(b) * .02], [.22, Math.cos(b) * .2, .7 + Math.sin(b) * .2], .04, .04, [90, 80, 64]); }
  // trois formes pour trois gestes : remplir (une goutte haute), vider (une goutte basse), verser (une flèche)
  if (a === 0) os2([0, 0, .78], [0, 0, .98], .12, [70, 120, 220]); else if (a === 1) os2([0, 0, .72], [0, 0, .8], .2, [70, 120, 220]);
  else add([0, -.14, .82], [0, .14, .82], .06, .06, [70, 120, 220]);
}
// L'arche éteinte : le chaton vide du prisme ; rallumée, les éclats y brillent.
function achromiePrismeOs() {
  if (!GRIS.ici) return [];
  const B = [], bat = (a, b, w, h, c, luit) => B.push({ a, b, w, h, c, luit: luit ? 1 : 0 });
  bat([0, 0, 1.84], [0, 0, 1.98], .42, .22, [48, 46, 52]);
  GRIS.SS.forEach((S, k) => {
    const x = (k - (GRIS.SS.length - 1) / 2) * .13, ok = GRIS.fini, c = grCoul(S.coul).rgb;
    bat([x, 0, 1.98], [x, 0, ok ? 2.34 : 2.05], .09, .1, ok ? c : [70, 68, 74], ok);
  });
  if (!GRIS.fini) for (const [a, b, l] of [[.42, .5, .2], [-.6, .34, .16], [.12, -.55, .12]])   // les débris du prisme, au pied de l'arche
    bat([a, b, .04], [a + l, b + l * .4, .06], .08, .06, [120, 118, 126]);
  return B;
}
