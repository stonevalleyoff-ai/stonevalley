// Stone Valley — LE VYREL (vyrel.js)
// Le quatrième état d'île (voir etats.js pour le système). Sur certaines îles, dès l'exploration 7 (une sur dix
// environ, jamais sur l'île d'une Tisseuse), toutes les bêtes sont malades du Vyrel : la robe ternie, des
// pustules violettes qui luisent, les yeux pâles, des mouches autour d'elles, une toux. Elles s'en prennent à
// qui passe près d'elles, même les herbivores ; un peu plus lentes, plus dures à abattre ; leur morsure contamine,
// et elles crèvent en un nuage de miasme. On ne peut ni les lier ni les apprivoiser.
// Des MIASMES violets couvrent toute l'île : un fond léger partout, plus épais dans les creux et autour des
// CHARNIERS (trois à cinq, des tertres de terre noire, d'os et de carcasses où bout une mare violette). Qui
// reste dedans s'expose ; à 100 %, il est malade. Le MASQUE À BEC (un accessoire de l'établi, visible sur le
// personnage) divise l'exposition par trois ; la lanterne allumée et le feu du campement la réduisent aussi.
// LA MALADIE suit le joueur d'île en île, en trois stades (dix puis vingt-cinq minutes) : la vie ne remonte
// plus jusqu'au bout, le souffle revient mal, des quintes de toux alertent les bêtes alentour, la vue se
// trouble par moments. On est contagieux pour les joueurs tout près. Seule la THÉRIAQUE en guérit (une potion
// de la table d'alchimie, qui se range comme un soin et peut se donner à un équipier). Les compagnes peuvent
// tomber malades aussi (dans les miasmes, ou mordues) : elles frappent moins fort ; un soin de la table de
// soin les guérit.
// GUÉRIR L'ÎLE : abattre les charniers (frappés, ils crachent leurs miasmes et appellent les bêtes malades de
// l'île). Chacun qui tombe brûle, et éclaircit l'île ; du dernier sort la MÈRE-CHAROGNE, qui crache des
// miasmes en cloche et en exhale autour d'elle. Morte, l'île guérit : les miasmes se lèvent, les bêtes
// redeviennent saines. L'ICHOR DE VYREL (une matière du sac, comme les spores de Korlaz) vient des charniers,
// de la Mère-Charogne, et parfois d'une bête malade abattue ; il sert à la forge (une dose, l'arme contamine)
// et à la Thériaque.
// Le jeu (index.html, etats.js, faune.js) appelle, s'ils existent :
//   vyrelInit() au démarrage ; vyrelIle() à chaque île marquée « vyrel » ; vyrelReprise() après la sauvegarde lue ;
//   majVyrel(dt) à chaque image (majEtats) ; majVyrelBete(b, dt) les charniers (majBete) ; osVyrel(f) leurs volumes ;
//   vyrelFurie(b), vyrelVit(b), vyrelDur(b) (majBete, robuste) ; vyrelMort(b) (mourirBete) ; butinVyrel(b) (butin) ;
//   vyrelMorsure(b, c) (porterCoup) ; vyrelOs(f, B) (foeBones) ; vyrelMasque(J, tete, B), vyrelHeros(J, B) (heroBones) ;
//   vyrelCiel(), vyrelBrouillard(), vyrelCss(), vyrelVoile(), vyrelFiltre(...) (le ciel, la brume, le filtre) ;
//   vyrelSouffle() (le souffle) ; vyrelHud(), vyrelStatuts(add) ; vyrelMonde(), vyrelAppliquer(w) (faune.js).

const VY_SPEC = [
  { id: 'charnier_vyrel', n: 'Charnier', corps: 'charnier', vyrel: 1, diet: 's', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [58, 40, 52], dark: [30, 20, 28], leg: [58, 40, 52], oeil: [196, 120, 255], bio: [], dur: 7, lien: 0, chasse: [], travail: {}, metier: 'un foyer du Vyrel : les miasmes en montent', grimpe: 0 },
  // (§185) une laie colossale, rongée par le Vyrel : son corps est dessiné à part (osLaie), son pas et ses gestes aussi
  { id: 'mere_charogne', n: 'Mère-Charogne', vyMere: 1, corps: 'laie', diet: 'c', sz: 3.8, spd: 2.1, vue: 24, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [92, 80, 86], dark: [62, 52, 60], leg: [62, 52, 60], oeil: [214, 150, 255], bio: [], dur: 18, lien: 0, chasse: null, travail: {}, metier: 'le cœur du Vyrel', grimpe: .3 },
];
const VY = { k: 0, gueri: false, gueriT: 0, annonce: false, foyers: [], total: 0, vifs: 0, nuages: [], feux: [], crachats: [], mereT: 0, mereNee: false,
  dens: 0, ciel: 0, bru: 0, flou: 0, js: null, crachatT: 0, exhaleT: 0, compT: 0, toussT: 0 };
const VY_SEUIL = 45;                                      // secondes de miasme (pondérées) avant la maladie
const VY_STADES = [0, 600, 1500];                          // les stades : dès la contagion, à dix minutes, à vingt-cinq
const VY_VIE = [1, .85, .7, .55], VY_SOUFFLE = [1, .75, .55, .4];
const VY_PAUSE = [0, 50, 32, 20];                          // l'intervalle des quintes de toux, par stade
const VY_COL = '#9a52d6', VY_COLC = '#d8a8ff';

const vyIci = () => typeof ETAT !== 'undefined' && ETAT.id === 'vyrel' && !(typeof djIci === 'function' && djIci());
// une bête de l'île, malade (les charniers, la Mère, les compagnes, les automates… n'en sont pas)
const vySauvage = b => !!b && !!b.sp && vyIci() && !VY.gueri && VY.k > .5 && !b.sp.vyrel && !b.sp.vyMere && !b.sp.achromie && !b.sp.donjon && !b.pnjSuit
  && typeof fauneOrdinaire === 'function' && fauneOrdinaire(b);
const vyMalade = b => vySauvage(b) || !!(b && b.comp && b.comp.vyrel);
const vyStade = () => !P.vyrel ? 0 : 1 + (P.vyrel.duree > VY_STADES[1] ? 1 : 0) + (P.vyrel.duree > VY_STADES[2] ? 1 : 0);
const VY_ROM = ['', 'I', 'II', 'III'];
const masqueDe = J => J === P ? P.equip && P.equip.accessoire === 'masque_bec' : !!(J && J.fx && J.fx.masque);

function vyrelInit() {
  if (typeof MAT_CORPS !== 'undefined') { MAT_CORPS.laie = 'pelage'; MAT_CORPS.charnier = 'terre'; }   // (§185) un pelage pour la laie, de la terre pour les charniers
  if (typeof COMBAT !== 'undefined') COMBAT.mere_charogne = { deg: .26, ramasse: .7, bond: .34, portee: 3.4, recul: 1, pause: 1.6 };   // la charge, tête basse
}

// ---------- l'île : les charniers, toujours aux mêmes places pour une même graine ----------
function vyPlace(x, y, L) {
  const h = hAt(x, y); if (h <= SEA + 1 || eauAt(x, y)) return false;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const i = (y + dy) * WS + x + dx;
    if (Math.abs(hAt(x + dx, y + dy) - h) > 1 || eauAt(x + dx, y + dy) || PlT[i]) return false;
  }
  if (Flo[y * WS + x]) return false;
  if (L.some(([a, b]) => (a - x) ** 2 + (b - y) ** 2 < 22 * 22)) return false;
  const A = typeof PortailIle !== 'undefined' && PortailIle; if (A && (A.x - x) ** 2 + (A.y - y) ** 2 < 16 * 16) return false;
  return true;
}
function vyrelIle() {
  Object.assign(VY, { k: 1, gueri: false, gueriT: 0, fondu: false, annonce: false, foyers: [], total: 0, vifs: 0, nuages: [], feux: [], crachats: [], mereT: 0, mereNee: false, flou: 0 });
  if (typeof djIci === 'function' && djIci()) { VY.k = 0; return; }
  if (typeof specById === 'undefined' || !specById.charnier_vyrel) return;
  let s = (SEED ^ 0x5f1e77) >>> 0 || 1; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const n = 3 + (r() * 3 | 0), L = [];
  for (let k = 0; k < 6000 && L.length < n; k++) { const x = 14 + (r() * (WS - 28) | 0), y = 14 + (r() * (WS - 28) | 0); if (vyPlace(x, y, L)) L.push([x, y]); }
  for (const [x, y] of L) {
    const b = naitre(specById.charnier_vyrel, x + .5, y + .5); b.variante = null; b.z = sol(x + .5, y + .5); b.pv = 1; b.age = 1e6; b.ech = 1;
    b.etat = 'suinter'; b.dir = b.dirT = r() * 6.2832; b.vyPv = 1; beasts.push(b); VY.foyers.push(b);
  }
  VY.total = VY.vifs = VY.foyers.length;
  if ((P.vyrelGueries || []).includes(SEED)) vyGueriDeja(true);
}
function vyGueriDeja(chargement) {
  VY.gueri = true; VY.k = 0; VY.fondu = false; VY.mereNee = true;
  for (const f of VY.foyers) if (typeof oterBete === 'function') oterBete(f, chargement);
}
// La sauvegarde n'est lue qu'après la construction de l'île (voir brumeReprise) : l'île déjà guérie le reste.
function vyrelReprise() {
  if (ETAT.id === 'vyrel' && !VY.gueri && VY.total && (P.vyrelGueries || []).includes(SEED)) vyGueriDeja(false);
}

// ---------- les miasmes : leur épaisseur en un point (0 à 1,4) ----------
function vyDens(x, y) {
  if (!vyIci() || VY.k <= 0) return 0;
  let d = .22 * (.35 + .65 * VY.vifs / Math.max(1, VY.total));       // le fond : il s'éclaircit à chaque charnier tombé
  for (const f of VY.foyers) if (!f.dead && f.pv > 0 && !f.retire && !f.horsJeu) { const q = (f.x - x) ** 2 + (f.y - y) ** 2; if (q < 500) d += .95 * Math.exp(-q / 70); }
  if (hAt(x | 0, y | 0) <= SEA + 3) d += .12;                       // les creux
  d += .1 * Math.sin(x * .19 + t * .11) * Math.sin(y * .23 - t * .08);   // les nappes qui dérivent
  for (const n of VY.nuages) { const q = (n.x - x) ** 2 + (n.y - y) ** 2; if (q < n.r * n.r) d += .9 * Math.min(1, (n.fin - t) / 2); }
  return Math.max(0, Math.min(1.4, d)) * VY.k;
}
// ce qui protège de l'exposition : le masque, la lanterne, le feu du campement, le plat antidote
const vyProtection = () => (masqueDe(P) ? .3 : 1) * (typeof porte === 'function' && porte('lumiere') ? .75 : 1)
  * (typeof auCamp === 'function' && auCamp() ? .3 : 1) * (typeof effet === 'function' && effet('antidote') ? .5 : 1);

// ---------- la maladie ----------
function contaminer(pourquoi) {
  if (P.vyrel || P.pv <= 0) return;
  P.vyrel = { duree: 0, toux: t + 18 + Math.random() * 14, trouble: t + 60 }; P.vyrelExpo = 0; P.vyrelVu = true;
  say('Malade du Vyrel · ' + pourquoi + ' · seule la Thériaque en guérit (table d\'alchimie)', 5);
  SON.jouer('toux', {}, P.x, P.y, P.z + 1.4); if (typeof Sauve !== 'undefined') Sauve.sale = true;
}
function guerirVyrel() {
  if (!P.vyrel) return false;
  P.vyrel = null; P.vyrelExpo = 0; VY.flou = 0;
  say('La Thériaque vous brûle la gorge… la fièvre tombe · guéri du Vyrel', 4); if (typeof Sauve !== 'undefined') Sauve.sale = true;
  return true;
}
const vyrelSouffle = () => VY_SOUFFLE[vyStade()];
function tousser(st) {
  SON.jouer('toux', {}, P.x, P.y, P.z + 1.4);
  const f = P.faceS ?? P.face ?? 0;
  for (let k = 0; k < 6 + st * 3; k++) parts.push({ x: P.x + Math.cos(f) * .35, y: P.y + Math.sin(f) * .35, z: P.z + 1.35, vx: Math.cos(f) * (1 + Math.random()) + (Math.random() - .5) * .6,
    vy: Math.sin(f) * (1 + Math.random()) + (Math.random() - .5) * .6, vz: .2 + Math.random() * .3, g: -.05, life: .9 + Math.random() * .5, age: 0, col: Math.random() < .5 ? '#7a4a96' : '#b48ad2', tl: .05 });
  // la quinte s'entend : les bêtes alentour lèvent la tête, les chasseurs viennent voir
  for (const b of beasts) {
    if (b.tame || b.dead || !(b.pv > 0) || !b.sp || b.sp.plante || b.sp.batiment || b.sp.vyrel) continue;
    const d2 = (b.x - P.x) ** 2 + (b.y - P.y) ** 2; if (d2 > 110) continue;
    b.alarm = 1; if (b.sp.chasse && b.sp.chasse.length && d2 < 81) b.colere = Math.max(b.colere || 0, 6);
  }
  if (t - VY.toussT > 30) { VY.toussT = t; say(st >= 3 ? 'une quinte vous plie en deux · les bêtes l\'ont entendue' : 'vous toussez · les bêtes l\'ont entendu', 1.6); }
}
// une morsure : d'une bête malade de l'île (ou de la Mère), sur vous ou une compagne
function vyrelMorsure(b, c) {
  if (!b || !(vySauvage(b) || (b.sp && b.sp.vyMere))) return;
  if (c === P) {
    if (P.vyrel) return;
    P.vyrelExpo = (P.vyrelExpo || 0) + (b.sp.vyMere ? 14 : 7);
    if (Math.random() < (b.sp.vyMere ? .3 : .12) || P.vyrelExpo >= VY_SEUIL) contaminer('une morsure vous a contaminé');
    return;
  }
  const C = c && c.comp; if (!C || C.vyrel) return;
  C.vyExpo = (C.vyExpo || 0) + 10;
  if (Math.random() < .15 || C.vyExpo >= 40) compagneMalade(C);
}
function compagneMalade(C) {
  if (C.vyrel) return;
  C.vyrel = 1; C.vyExpo = 0;
  say((C.nom || 'votre compagne') + ' est malade du Vyrel · elle frappe moins fort · un soin de la table de soin la guérit', 4);
  if (typeof Sauve !== 'undefined') Sauve.sale = true;
}

// ---------- les bêtes ----------
function vyCible(b, R) {
  let best = null, bd = R * R;
  for (const j of VY.js || [P]) {
    if (!(j.pv > 0) || Math.abs((j.z || 0) - b.z) > 3 || (typeof effetDe === 'function' && effetDe(j, 'invisible'))) continue;
    const d = (j.x - b.x) ** 2 + (j.y - b.y) ** 2; if (d < bd) { bd = d; best = j; }
  }
  if (P.compagnes) for (const c of P.compagnes) {                     // vos compagnes aussi, de plus près
    const o = c.dehors && c.b; if (!o || o.dead || !(o.pv > 0) || c.ko) continue;
    const d = (o.x - b.x) ** 2 + (o.y - b.y) ** 2; if (d < Math.min(bd, 30)) { bd = d; best = o; }
  }
  return best;
}
function vyrelFurie(b) {
  if (b.sp.vyMere) return vyCible(b, 40);
  if (!vySauvage(b) || b.pv < .2) return null;
  return vyCible(b, b.vyAppel > t ? 30 : 7.5);
}
const vyrelVit = b => vySauvage(b) ? .85 : b.fgVyrel && b.fgVyrel.fin > t ? .7 : b.comp && b.comp.vyrel ? .9 : 1;
const vyrelDur = b => vySauvage(b) ? 1.3 : 1;
// un charnier frappé : il crache ses miasmes, et les bêtes malades de l'île accourent
function vyBouffee(b, r = 2.2, d = 4) {
  VY.nuages.push({ x: b.x, y: b.y, z: b.z || sol(b.x, b.y), r, fin: t + d });
  for (let k = 0; k < 18; k++) { const a = Math.random() * 6.2832, q = Math.random() * r;
    parts.push({ x: b.x + Math.cos(a) * q * .5, y: b.y + Math.sin(a) * q * .5, z: (b.z || 0) + .3 + Math.random() * .6, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, vz: .3 + Math.random() * .5, g: -.05,
      life: 1.4 + Math.random(), age: 0, col: Math.random() < .5 ? '#6a3e80' : '#9a64c0', tl: .05, luit: Math.random() < .2 }); }
}
function vyAppel(b) {
  if (b.vyAppelT > t) return; b.vyAppelT = t + 6;
  const L = beasts.filter(o => vySauvage(o) && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 28 * 28).sort((p, q) => ((p.x - b.x) ** 2 + (p.y - b.y) ** 2) - ((q.x - b.x) ** 2 + (q.y - b.y) ** 2));
  for (const o of L.slice(0, 4)) o.vyAppel = t + 20;
  if (L.length && t - (VY.appelDit || -99) > 20) { VY.appelDit = t; say('le charnier gargouille · les bêtes malades accourent', 2); }
}
function majVyrelBete(b, dt) {
  b.t += dt; b.age += dt; if (b.hit > 0) b.hit -= dt;
  if (b.dead) { b.dead += dt; return; }
  if (b.vyPv !== undefined && b.pv < b.vyPv - .001) { vyBouffee(b); if (typeof autorite !== 'function' || autorite()) vyAppel(b); }
  b.vyPv = b.pv; b.vx = b.vy = 0; b.faim = 0; b.soif = 0;
}
function vyrelMort(b) {
  if (!b || !b.sp) return;
  if (b.sp.vyrel) {                                                   // un charnier tombé : il brûle
    VY.feux.push({ x: b.x, y: b.y, z: b.z || sol(b.x, b.y), fin: t + 12 }); vyBouffee(b, 3, 5);
    SON.jouer('effondre', {}, b.x, b.y, (b.z || 0) + .5);
    const reste = VY.foyers.filter(f => f !== b && !f.dead && f.pv > 0 && !f.retire && !f.horsJeu).length;
    say(reste ? 'un charnier brûle · les miasmes s\'éclaircissent · encore ' + reste : 'le dernier charnier brûle… quelque chose remue dessous', 4);
    if (!reste && !VY.mereNee && (typeof autorite !== 'function' || autorite())) { VY.mereT = t + 2.6; VY.mereX = b.x; VY.mereY = b.y; }
    return;
  }
  if (b.sp.vyMere) {                                                  // elle s'effondre : toutes ses pustules crèvent
    b.vyMortT = t; vyBouffee(b, 5, 7); SON.jouer('rugissement', { f: 55 }, b.x, b.y, b.z + 2); P.secousse = t; P.secousseK = .6;
    for (let k = 0; k < 60; k++) { const a = Math.random() * 6.2832, r = Math.random() * 2.2; vyPart(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, b.z + .6 + Math.random() * 2.4,
      { vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 1 + Math.random() * 2, g: 3, life: 1 + Math.random() * .6, col: Math.random() < .4 ? VY_COLC : VY_COL, luit: Math.random() < .5 ? 1 : 0, tl: .05 }); }
    if (!VY.gueri) guerirIle(); return;
  }
  if (vySauvage(b)) vyBouffee(b, 1.8, 6);                             // une bête malade crève en un nuage
}
// ce qu'ils laissent à qui les abat (true : rien d'autre)
function butinVyrel(b) {
  if (!b || !b.sp) return false;
  const gain = (n, txt) => { P.sac.ichor = (P.sac.ichor || 0) + n; say(txt + ' · +' + n + ' ichor' + (n > 1 ? 's' : '') + ' de Vyrel', 2); if (typeof majSac === 'function') majSac(); };
  if (b.sp.vyrel) { gain(3 + (Math.random() * 3 | 0), 'le charnier rend son ichor'); return true; }
  if (b.sp.vyMere) { P.sac.eclat = (P.sac.eclat || 0) + 12; gain(6, 'la Mère-Charogne · +12 éclats'); return true; }
  if (vySauvage(b) && Math.random() < .35) gain(1, 'une glande de Vyrel');
  return false;
}
function naitreMere() {
  VY.mereNee = true; VY.mereT = 0;
  const sp = specById.mere_charogne; if (!sp) return;
  const m = naitre(sp, VY.mereX, VY.mereY); m.variante = null; m.z = sol(VY.mereX, VY.mereY); m.pv = 1; m.age = 1e6; m.ech = 1; m.faim = 0; m.soif = 0;
  m.blinde = 1 + Math.max(0, profondeur() - 7) * .06; m.dir = m.dirT = Math.random() * 6.2832; beasts.push(m);
  vyBouffee(m, 3.4, 6); burst(m.x, m.y, m.z + .5, 40, '#5a2e6e'); P.secousse = t; P.secousseK = .5;
  SON.jouer('rugissement', { f: 70 }, m.x, m.y, m.z + 1);
  say('La Mère-Charogne sort du dernier charnier', 4);
}
function guerirIle() {
  if (VY.gueri) return;
  VY.gueri = true; VY.gueriT = t; VY.fondu = true;
  if (!(P.vyrelGueries || (P.vyrelGueries = [])).includes(SEED)) { P.vyrelGueries.push(SEED); if (P.vyrelGueries.length > 300) P.vyrelGueries.shift(); }
  for (const f of VY.foyers) if (!f.dead && f.pv > 0 && typeof oterBete === 'function') oterBete(f, false);
  P.sac.eclat = (P.sac.eclat || 0) + 25; P.sac.ichor = (P.sac.ichor || 0) + 4;
  say('La Mère-Charogne est tombée · les miasmes se lèvent · l\'île guérit · +25 éclats, +4 ichors de Vyrel', 5.5);
  SON.jouer('niveau'); if (typeof Sauve !== 'undefined') Sauve.sale = true; if (typeof majSac === 'function') majSac();
}
// ---------- l'état partagé (faune.js) : l'île guérie ----------
function vyrelMonde() { return ETAT.id === 'vyrel' && VY.total ? [VY.gueri ? 1 : 0] : null; }
function vyrelAppliquer(w) { if (Array.isArray(w) && w[0] && !VY.gueri && ETAT.id === 'vyrel') guerirIle(); }

// ---------- à chaque image ----------
const vyPart = (x, y, z, o) => parts.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, life: 1, age: 0, col: VY_COL, tl: .06 }, o));
function majVyrel(dt) {
  if (!dt) return;
  const ici = vyIci();
  VY.js = typeof joueursFaune === 'function' ? joueursFaune() : [P];
  if (ici) {
    if (!VY.annonce && VY.k > 0) { VY.annonce = true; P.vyrelVu = true;
      say('Vyrel · toutes les bêtes de cette île sont malades · ne restez pas dans les miasmes' + (masqueDe(P) ? '' : ' · un masque à bec vous en protégerait'), 6); }
    if (VY.fondu) { VY.k = Math.max(0, 1 - (t - VY.gueriT) / 12); if (!VY.k) VY.fondu = false; }   // les miasmes se lèvent, en douze secondes
    VY.vifs = VY.foyers.filter(f => !f.dead && f.pv > 0 && !f.retire && !f.horsJeu).length;
    if (VY.mereT && t > VY.mereT && !VY.mereNee) naitreMere();
  }
  const D = VY.dens = ici ? vyDens(P.x, P.y) : 0;
  VY.ciel = ici ? .5 * VY.k : 0; VY.bru = ici ? .3 * VY.k + .25 * Math.min(1, D) * VY.k : 0;
  // l'exposition
  if (!P.vyrel && P.pv > 0) {
    let e = D > 0 ? D * vyProtection() : 0;
    if (typeof Autres !== 'undefined') for (const j of Autres.values()) if (j.fx && j.fx.vyrel && j.pv > 0 && (j.x - P.x) ** 2 + (j.y - P.y) ** 2 < 6.25) e += .5 * (masqueDe(P) ? .3 : 1);   // un joueur malade, tout près
    if (e > .08) P.vyrelExpo = (P.vyrelExpo || 0) + dt * e;
    else P.vyrelExpo = Math.max(0, (P.vyrelExpo || 0) - dt * .3);
    if (P.vyrelExpo >= VY_SEUIL) contaminer('les miasmes vous ont pris');
  }
  // la maladie
  const V = P.vyrel;
  if (V && P.pv > 0) {
    V.duree += dt; const st = vyStade();
    if (P.pv > VY_VIE[st]) P.pv = VY_VIE[st];
    if (t > (V.toux || 0)) { if (V.toux) tousser(st); V.toux = t + VY_PAUSE[st] * (.7 + Math.random() * .6); }
    if (st >= 2 && t > (V.trouble || 0)) { if (V.trouble) VY.flou = t + 2 + st * .5; V.trouble = t + (st >= 3 ? 26 : 46) * (.7 + Math.random() * .6); }
    if (Math.random() < dt * (.3 + st * .3)) vyPart(P.x + (Math.random() - .5) * .4, P.y + (Math.random() - .5) * .4, P.z + .6 + Math.random() * .8, { vz: .3, g: -.1, life: .8, col: VY_COLC, luit: 1, tl: .035 });
  }
  // les compagnes : dans les miasmes, elles s'exposent ; malades, elles toussent
  if (P.compagnes) for (const c of P.compagnes) {
    const o = c.dehors && c.b; if (!o || o.dead) continue;
    if (!c.vyrel && ici && VY.k > .5) { const d = vyDens(o.x, o.y); if (d > .55) { c.vyExpo = (c.vyExpo || 0) + dt * d; if (c.vyExpo > 60) compagneMalade(c); } }
    if (c.vyrel && Math.random() < dt * .03) SON.jouer('toux', { g: 1 }, o.x, o.y, o.z + .6);
  }
  if (!ici && !VY.nuages.length && !VY.feux.length && !VY.crachats.length) return;
  // ce qui se voit : les miasmes autour de vous, les bulles des charniers, les mouches des bêtes malades
  if (ici && VY.k > 0) {
    const n = dt * 40 * VY.k;
    for (let k = 0; k < 3; k++) if (Math.random() < n / 3) {
      const a = Math.random() * 6.2832, r = 1 + Math.random() * 13, x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r, d = vyDens(x, y);
      if (Math.random() > d) continue;
      const q = Math.random();
      vyPart(x, y, sol(x, y) + .1 + Math.random() * (.4 + d), { vx: .25 + (Math.random() - .5) * .3, vy: .1 + (Math.random() - .5) * .3, vz: .03 + Math.random() * .06, g: -.02,
        life: 3 + Math.random() * 2.5, col: q < .45 ? '#4a3056' : q < .8 ? '#6a4280' : '#9064b0', tl: .03 + Math.random() * .025, luit: Math.random() < .06 });
    }
    for (const f of VY.foyers) {
      if (f.dead || !(f.pv > 0) || f.retire || f.horsJeu || (f.x - P.x) ** 2 + (f.y - P.y) ** 2 > 1600) continue;
      if (Math.random() < dt * 12) vyPart(f.x + (Math.random() - .5) * 1.4, f.y + (Math.random() - .5) * 1.2, f.z + .3, { vz: .5 + Math.random() * .6, g: -.08, life: 2 + Math.random() * 1.5,
        vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, col: Math.random() < .3 ? VY_COLC : '#7a3ea6', luit: 1, tl: .05 + Math.random() * .05 });
      if (Math.random() < dt * 8) vyPart(f.x + (Math.random() - .5) * 2, f.y + (Math.random() - .5) * 2, f.z + .4 + Math.random() * 1.5, { vx: .2 + (Math.random() - .5) * .2, vz: .35, g: -.03,
        life: 4 + Math.random() * 2, col: Math.random() < .5 ? '#5a3a6a' : '#7a4a94', tl: .04 + Math.random() * .03 });
    }
    for (const b of beasts) {
      if (!vySauvage(b) || b.dead || (b.x - P.x) ** 2 + (b.y - P.y) ** 2 > 400) continue;
      if (Math.random() < dt * 4) { const a = Math.random() * 6.2832, r = .3 + b.sp.sz * .4;   // une mouche qui tourne
        vyPart(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, (b.z || 0) + .4 + Math.random() * b.sp.sz * .6, { vx: -Math.sin(a) * 1.4, vy: Math.cos(a) * 1.4, vz: (Math.random() - .5) * .6, life: .5, col: '#141014', tl: .03 }); }
      if (Math.random() < dt * .012) SON.jouer('toux', { g: 1 }, b.x, b.y, (b.z || 0) + .6);
    }
  }
  for (let k = VY.nuages.length - 1; k >= 0; k--) {
    const c = VY.nuages[k]; if (c.fin <= t) { VY.nuages.splice(k, 1); continue; }
    if (Math.random() < dt * 14 && (c.x - P.x) ** 2 + (c.y - P.y) ** 2 < 900) { const a = Math.random() * 6.2832, q = Math.random() * c.r;
      vyPart(c.x + Math.cos(a) * q, c.y + Math.sin(a) * q, c.z + .1 + Math.random() * 1.2, { vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .1, g: -.02, life: 1.6, col: Math.random() < .5 ? '#6a3e80' : '#9a64c0', tl: .045, luit: Math.random() < .15 }); }
  }
  for (let k = VY.feux.length - 1; k >= 0; k--) {                      // les charniers brûlent
    const F = VY.feux[k]; if (F.fin <= t) { VY.feux.splice(k, 1); continue; }
    const v = Math.min(1, (F.fin - t) / 4);
    if (Math.random() < dt * 30 * v) vyPart(F.x + (Math.random() - .5) * 1.6, F.y + (Math.random() - .5) * 1.4, F.z + .2, { vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, vz: 1.2 + Math.random(), g: -.4,
      life: .6 + Math.random() * .4, col: Math.random() < .5 ? '#ff8a30' : Math.random() < .5 ? '#ffd27a' : '#c040ff', luit: 1, tl: .07 });
    if (Math.random() < dt * 10 * v) vyPart(F.x + (Math.random() - .5), F.y + (Math.random() - .5), F.z + 1, { vz: 1, g: -.15, life: 2.5, col: '#2a2228', tl: .06 });
  }
  majMere(dt);
}
// La Mère-Charogne : son pas (qui fait trembler le sol), son souffle, ses pustules qui crèvent, sa bave ; chacun la voit
// exhaler ses miasmes autour d'elle, et cracher sur lui ; morte, elle met sept secondes à s'effondrer et à se défaire.
function majMere(dt) {
  let m = null;
  for (const b of beasts) {
    if (!b.sp || !b.sp.vyMere) continue;
    const K = b.sp.sz * (b.ech || 1), px = b.vyPx ?? b.x, py = b.vyPy ?? b.y, v = Math.hypot(b.x - px, b.y - py) / Math.max(dt, 1e-3);
    b.vyPx = b.x; b.vyPy = b.y;
    const cible = b.dead ? 0 : Math.min(1.3, v / 3);
    b.vyV = (b.vyV || 0) + (cible - (b.vyV || 0)) * Math.min(1, dt * 5);
    const p0 = b.vyPas || 0; b.vyPas = p0 + dt * (b.vyV > .04 ? 2.2 + 3.4 * b.vyV : 0);
    const d2 = (b.x - P.x) ** 2 + (b.y - P.y) ** 2;
    if (Math.floor(b.vyPas / Math.PI) !== Math.floor(p0 / Math.PI) && d2 < 26 * 26) {   // un sabot qui retombe
      SON.jouer('atterrir', {}, b.x, b.y, b.z); if (d2 < 15 * 15) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .1 + .12 * b.vyV); }
      const f = b.dir || 0, s = Math.floor(b.vyPas / Math.PI) % 2 ? 1 : -1, fx = b.x + Math.cos(f) * .25 * K - Math.sin(f) * s * .24 * K, fy = b.y + Math.sin(f) * .25 * K + Math.cos(f) * s * .24 * K;
      for (let k = 0; k < 6; k++) vyPart(fx, fy, sol(fx, fy) + .05, { vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: .6 + Math.random() * .6, g: 3, life: .6, col: '#5e4e4a', tl: .05 });
    }
    if (b.dead) {                                                     // l'effondrement : le compte de la mort avance au ralenti
      if (b.vyMortT && t - b.vyMortT < 7) b.dead = Math.max(.002, b.dead - dt * .9);
      if (b.vyMortT && Math.random() < dt * 30) vyPart(b.x + (Math.random() - .5) * K * .9, b.y + (Math.random() - .5) * K * .9, b.z + Math.random() * K * .5,
        { vz: .6 + Math.random() * .6, g: -.1, life: 2, col: Math.random() < .4 ? '#9a64c0' : '#4a3056', tl: .05, luit: Math.random() < .2 ? 1 : 0 });
      continue;
    }
    if (!(b.pv > 0)) continue;
    m = b;
    // la bave violette qui pend et goutte, la vapeur de son dos, les mouches, une pustule qui crève
    if (d2 < 40 * 40) {
      const f = b.dir || 0, c = Math.cos(f), s = Math.sin(f), bx = b.x + c * .86 * K, by = b.y + s * .86 * K;
      if (Math.random() < dt * 5) vyPart(bx + (Math.random() - .5) * .3, by + (Math.random() - .5) * .3, b.z + .16 * K, { vz: -.5, g: 6, life: .8, col: Math.random() < .5 ? VY_COLC : VY_COL, luit: 1, tl: .04 });
      if (Math.random() < dt * 14) { const u = Math.random() * 1.1 - .55; vyPart(b.x + c * u * K + (Math.random() - .5) * .8, b.y + s * u * K + (Math.random() - .5) * .8, b.z + .78 * K,
        { vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .5 + Math.random() * .5, g: -.06, life: 2.5, col: Math.random() < .5 ? '#6a4280' : '#8a5aa6', tl: .045 }); }
      if (Math.random() < dt * 10) { const a = Math.random() * 6.2832, r = K * (.45 + Math.random() * .3);
        vyPart(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, b.z + K * (.3 + Math.random() * .5), { vx: -Math.sin(a) * 2, vy: Math.cos(a) * 2, vz: (Math.random() - .5), life: .6, col: '#141014', tl: .035 }); }
      if (Math.random() < dt * .7) {                                  // une pustule crève : un jet violet
        const u = Math.random() * .8 - .45, sd = Math.random() < .5 ? -1 : 1, x = b.x + c * u * K - s * sd * .36 * K, y = b.y + s * u * K + c * sd * .36 * K, z = b.z + (.4 + Math.random() * .3) * K;
        for (let k = 0; k < 10; k++) vyPart(x, y, z, { vx: -s * sd * (1 + Math.random() * 2) + (Math.random() - .5), vy: c * sd * (1 + Math.random() * 2) + (Math.random() - .5), vz: 1 + Math.random() * 1.5, g: 6, life: .7, col: Math.random() < .5 ? VY_COLC : VY_COL, luit: 1, tl: .04 });
      }
    }
    if (Math.random() < dt * .12) SON.jouer('grondement', {}, b.x, b.y, b.z + 2);
  }
  if (m) {
    m.faim = 0; m.soif = 0; m.nrj = 1;
    const K = m.sp.sz * (m.ech || 1);
    if (t > VY.exhaleT) { VY.exhaleT = t + 6 + Math.random() * 2; m.vyTouxT = t; vyBouffee(m, 3.6, 4.5); SON.jouer('toux', { g: 1 }, m.x, m.y, m.z + 1.5); }
    const d2 = (m.x - P.x) ** 2 + (m.y - P.y) ** 2;
    if (P.pv > 0 && d2 < 20 * 20 && d2 > 12 && t > VY.crachatT && !m.as) {
      VY.crachatT = t + 4.5 + Math.random() * 2.5; m.vyCrT = t;
      const f = m.dir || 0, x0 = m.x + Math.cos(f) * .86 * K, y0 = m.y + Math.sin(f) * .86 * K, z0 = m.z + .34 * K, T = .5 + Math.sqrt(d2) * .05, g = 9;
      VY.crachats.push({ x: x0, y: y0, z: z0, vx: (P.x - x0) / T, vy: (P.y - y0) / T, vz: (P.z + .4 - z0) / T + .5 * g * T, age: 0 });
      SON.jouer('crachat', {}, x0, y0, z0);
    }
  }
  for (let k = VY.crachats.length - 1; k >= 0; k--) {
    const c = VY.crachats[k]; c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.vz -= 9 * dt;
    vyPart(c.x, c.y, c.z, { life: .35, col: Math.random() < .5 ? VY_COLC : VY_COL, luit: 1, tl: .06 });
    if (c.z <= sol(c.x, c.y) + .05 || c.age > 3) {
      VY.crachats.splice(k, 1); vyBouffee({ x: c.x, y: c.y, z: sol(c.x, c.y) }, 2.6, 6);
      if ((c.x - P.x) ** 2 + (c.y - P.y) ** 2 < 3.2 && P.pv > 0) {
        if (typeof degSubi === 'function') P.pv = Math.max(0, P.pv - degSubi(.07)); P.hurt = .6; P.vyrelExpo = (P.vyrelExpo || 0) + 10;
        if (!P.vyrel && P.vyrelExpo >= VY_SEUIL) contaminer('la Mère-Charogne vous a craché dessus');
        if (P.pv <= 0 && typeof terrasse === 'function') terrasse();
      }
    }
  }
}

// ---------- ce qui se voit ----------
// (foeBones) une bête malade : la robe ternie vers le gris violacé, les yeux pâles qui luisent, des pustules
function vyrelOs(f, B) {
  if (f.sp.vyMere || !vyMalade(f)) return B;                          // (la Mère dessine ses pustules elle-même)
  const g = [104, 86, 116], oe = f.sp.oeil, k = f.sp.vyMere ? 0 : .32;
  const O = B.map(o => { const c = o.c; if (!c) return o;
    if (oe && c[0] === oe[0] && c[1] === oe[1] && c[2] === oe[2]) return Object.assign({}, o, { c: [228, 190, 255], luit: true });
    return k ? Object.assign({}, o, { c: [c[0] * (1 - k) + g[0] * k | 0, c[1] * (1 - k) + g[1] * k | 0, c[2] * (1 - k) + g[2] * k | 0] }) : o; });
  let h = f.vyH || (f.vyH = (Math.random() * 4e9) >>> 0);
  const n = f.sp.vyMere ? 12 : 5, m = Math.min(O.length, f.sp.vyMere ? 12 : 6), pul = .8 + .2 * Math.sin(t * 3 + (h & 7));
  for (let i = 0; i < n && m; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; const o = O[h % m]; if (!o || !o.a) continue;
    const u = ((h >>> 8) & 255) / 255, s = (.03 + ((h >>> 16) & 15) * .004) * (f.sp.vyMere ? .8 : 1) * pul;
    const p = [o.a[0] + (o.b[0] - o.a[0]) * u, o.a[1] + (o.b[1] - o.a[1]) * u + ((h >>> 20) & 1 ? 1 : -1) * (o.w || .1) * .35, o.a[2] + (o.b[2] - o.a[2]) * u + (o.h || .1) * .45];
    O.push({ a: p, b: [p[0], p[1], p[2] + s], w: s * 1.5, h: s * 1.5, c: (h >>> 24) & 1 ? [196, 104, 246] : [150, 70, 200], luit: true, boule: 3 });   // (§186) rondes
  }
  return O;
}
// le charnier : un tertre de terre noire, des côtes qui en sortent, des carcasses, une mare violette qui bout
function osVyrel(f) {
  if (f.sp.vyMere) { const O = outilsOs(f); osLaie(f, O); return O.B; }
  const O = outilsOs(f), { add } = O, mort = f.dead > 0, frappe = f.hit > 0;
  const ph = ((f.vyH || (f.vyH = (Math.random() * 4e9) >>> 0)) & 1023) / 163;
  const nr = c => mort ? c.map(v => v * .35 | 0) : frappe ? c.map(v => Math.min(255, v + 40)) : c;
  const terre = nr([76, 58, 68]), terreC = nr([100, 78, 88]), terreV = nr([92, 60, 98]), os = nr([214, 204, 180]), osF = nr([170, 158, 138]), chair = nr([118, 60, 80]), chairF = nr([84, 40, 58]);
  for (let i = 0; i < 7; i++) {                                                           // le tertre : des mottes en rayons, bombé
    const a = i / 7 * 6.2832 + ph, R = 1 + .18 * Math.sin(i * 2.3 + ph);
    add([0, 0, .07], [Math.cos(a) * R, Math.sin(a) * R * .85, .05], .7, .13, i % 2 ? terre : terreC);
    add([0, 0, .16], [Math.cos(a + .4) * R * .62, Math.sin(a + .4) * R * .55, .14], .5, .1, i % 3 ? terreC : terreV);
  }
  if (!mort) for (let i = 0; i < 3; i++) { const a = i / 3 * 3.1416 + ph * .3;               // la mare violette, ronde, qui luit
    add([-Math.cos(a) * .42, .05 - Math.sin(a) * .36, .225], [Math.cos(a) * .42, .05 + Math.sin(a) * .36, .225], .4, .03, [150, 70, 210], true); }
  for (let i = 0; i < 6; i++) {                                                          // des côtes, en arc
    const a = -1.25 + i * .5, x = Math.cos(a) * .92, y = Math.sin(a) * .76, top = .74 - Math.abs(i - 2.5) * .07;
    add([x, y, .16], [x * .8, y * .8, top], .07, .07, i % 2 ? os : osF); add([x * .8, y * .8, top], [x * .58, y * .58, top + .1], .055, .055, os);
  }
  add([-.25, -.72, .24], [.52, .6, .28], .1, .1, osF);                                    // une échine
  add([.6, -.5, .18], [.95, -.28, .24], .34, .26, chair); add([.68, -.45, .34], [.88, -.32, .38], .18, .1, chairF);   // des carcasses
  add([-.8, .42, .18], [-.5, .7, .22], .3, .22, chair);
  add([-.7, -.52, .24], [-.5, -.52, .28], .22, .19, os); add([-.6, -.57, .28], [-.5, -.57, .29], .05, .05, [20, 14, 18]); add([-.6, -.47, .28], [-.5, -.47, .29], .05, .05, [20, 14, 18]);   // un crâne
  if (!mort) for (let k = 0; k < 5; k++) {                                                 // des bulles qui gonflent et crèvent
    const u = (t * .45 + k * .23 + ph) % 1, r = .03 + u * .08, x = Math.cos(k * 2.1 + ph) * .26, y = .05 + Math.sin(k * 2.1 + ph) * .2;
    add([x, y, .24], [x, y, .24 + r * 1.4], r * 2, r * 2, u > .85 ? [236, 200, 255] : [176, 96, 236], true); O.B[O.B.length - 1].boule = 3;   // (§186) rondes
  }
  return O.B;
}
// (§185) LA MÈRE-CHAROGNE : une laie colossale, plus large que haute, la tête basse et lourde. Une robe grise et brune
// mitée de plaques galeuses, une crête de soies noires du garrot aux reins, un gros groin, deux défenses jaunies (la
// gauche cassée), des oreilles déchirées, des yeux laiteux qui luisent violet. Des grappes de pustules sur les flancs,
// l'épaule et le cou, qui gonflent, battent et crèvent ; des veines violettes sous le ventre ; une bave violette qui pend.
// Ses gestes : la respiration lourde, le pas qui roule les épaules (au trot, les pattes en diagonale), la tête qui balance ;
// à l'attaque, elle baisse la tête, charge, et relève les défenses ; quand elle exhale ou crache, la gueule s'ouvre et la
// tête se lève. Morte, elle bascule sur le flanc et se défait.
function osLaie(f, O) {
  const { add } = O, B = O.B, n0 = B.length;
  const mort = f.vyMortT ? Math.min(1, (t - f.vyMortT) / 1.5) : f.dead > 0 ? 1 : 0, vif = 1 - mort;
  const ph = f.vyPas || 0, va = Math.min(1.3, f.vyV || 0) * vif, h = f.vyH || (f.vyH = (Math.random() * 4e9) >>> 0);
  const g = 1 + (.045 + .02 * va) * Math.sin(t * (1.6 + va)) * vif;                       // la respiration
  const as = f.as, ram = (f.ramasse || 0) * vif, bond = as && as.phase === 'bond' ? Math.min(1, as.t / .34) : 0;
  const ouv = (T0, d) => T0 && t - T0 < d ? Math.sin(Math.min(1, (t - T0) / d) * Math.PI) : 0;
  const toux = ouv(f.vyTouxT, 1.3) * vif, crache = ouv(f.vyCrT, .6) * vif;
  const bz = Math.abs(Math.sin(ph)) * .028 * va - .05 * ram;                                  // le corps monte à chaque pas ; il se ramasse avant la charge
  const roule = Math.sin(ph) * .025 * va;                                                     // les épaules roulent
  const hz = -.14 * ram * (1 - bond) + .2 * Math.sin(bond * Math.PI) + .09 * toux + .03 * Math.sin(ph * 2) * va - .04 * crache;
  const hx = .07 * bond + .06 * crache, hy = .05 * Math.sin(t * .6) * vif;                    // la tête balance
  const jo = .025 + .1 * Math.max(toux, crache) + .06 * bond;                                 // la gueule
  const fl = f.hit > 0, cl = c => fl ? c.map(v => Math.min(255, v + 50)) : c;
  const peau = cl([104, 90, 94]), peauF = cl([72, 60, 68]), museau = cl([132, 112, 112]), soie = cl([50, 40, 48]), galeux = cl([156, 122, 130]), groin = cl([150, 112, 120]);
  const ivoire = cl([224, 208, 166]), ivoireF = cl([178, 158, 118]), sabot = [34, 28, 30], vi = [168, 78, 228], viC = [236, 206, 255];
  const T = typeof TEX !== 'undefined' ? TEX : {}, mat = (m, i0) => { if (m) for (let i = i0; i < B.length; i++) B[i].tex = m; };   // l'ivoire, les sabots : leur grain à eux
  // (§186) les formes : la boule (bo), le prisme effilé (pr), le pavé effilé (pe)
  const forme = (F, a, b, w, hh, c, luit) => { add(a, b, w, hh, c, luit); Object.assign(B[B.length - 1], F); };
  const bo = (a, b, w, hh, c, luit, n = 4) => forme({ boule: n }, a, b, w, hh, c, luit);
  const pr = (a, b, w, hh, c, fin = 1, n = 8, luit) => forme(fin === 1 ? { pans: n } : { pans: n, fin }, a, b, w, hh, c, luit);
  const pe = (a, b, w, hh, c, fin, luit) => forme({ fin }, a, b, w, hh, c, luit);
  // le tronc : des masses rondes qui se chevauchent — le corps, le garrot, la croupe, le ventre qui pend et respire
  const Cx = -.09, Cz = .57 + bz, Rx = .51, Ry = .39 * g, Rz = .31 * g;
  bo([-.6, roule, .54 + bz], [.42, roule, .6 + bz], .78 * g, .62 * g, peau, false, 5);
  bo([0, roule * 1.4, .64 + bz], [.46, roule * 1.4, .74 + bz], .64, .5, peau);
  bo([-.74, roule * .6, .55 + bz], [-.34, roule * .6, .6 + bz], .62, .54, peau);
  bo([-.4, roule, .34 + bz], [.22, roule, .36 + bz], .72 * g, .34 * g, peauF);
  // un point de la peau du flanc (s : le côté), et un du dos : pour y poser la gale, les veines, les pustules
  const flanc = (x, z, s) => { const q = 1 - ((x - Cx) / Rx) ** 2 - ((z - Cz) / Rz) ** 2; return [x, s * Ry * Math.sqrt(Math.max(.05, q)) + roule, z]; };
  const dos = (x, y) => { const q = 1 - ((x - Cx) / Rx) ** 2 - (y / Ry) ** 2; return [x, y + roule, Cz + Rz * Math.sqrt(Math.max(.05, q)) + (x > .05 ? .05 : 0)]; };
  for (const [x, y, l] of [[-.22, .12, .14], [.0, -.16, .12], [-.42, -.06, .1]]) { const p0 = dos(x, y); bo([p0[0] - l / 2, p0[1], p0[2] - .01], [p0[0] + l / 2, p0[1] + .03, p0[2] - .005], .12, .03, galeux, false, 3); }   // la gale, sur le dos
  for (const s of [-1, 1]) {
    for (const [x, z, l] of [[-.24, .56, .2], [.05, .46, .14], [s < 0 ? -.44 : .18, s < 0 ? .62 : .66, .12]]) { const p0 = flanc(x, z, s);   // les plaques galeuses
      bo([p0[0] - l / 2, p0[1], p0[2]], [p0[0] + l / 2, p0[1], p0[2] + .02], .03, .11, galeux, false, 3); }
    for (let k = 0; k < 3; k++) { const x0 = -.32 + k * .19, A0 = flanc(x0, .36, s), A1 = flanc(x0 + .07, .42, s), A2 = flanc(x0 + .13, .37, s);   // les veines sous le ventre
      add(A0, A1, .018, .018, vi, true); add(A1, A2, .018, .018, vi, true); }
    const V0 = dos(-.42, s * .2), V1 = dos(-.2, s * .24), V2 = dos(.02, s * .18);           // et sur le dos
    add(V0, V1, .018, .018, vi, true); add(V1, V2, .018, .018, vi, true);
  }
  // la crinière : une bande sombre du cou aux reins, hérissée de soies effilées qui frémissent
  pr([-.56, roule, .84 + bz], [.44, roule * 1.4, .98 + bz], .2, .07, soie, .8, 6);
  pr([.44, roule * 1.4, .98 + bz], [(.53 + hx) - .02, hy + roule, .66 + bz + hz * .6], .16, .06, soie, .7, 6);
  for (let i = 0; i < 30; i++) {
    const x = -.52 + i * .032, top = (x > .02 ? 1 - (x - .42) ** 2 * .6 : .84 + (x + .52) * .26) + bz, L = (.06 + .05 * Math.abs(Math.sin(i * 1.7)) + (x > 0 ? .05 : 0)) * (1 + .12 * Math.sin(t * 3 + i * .7) * vif);
    pe([x, roule + (i % 3 - 1) * .02, top - .02], [x - .05, roule + (i % 3 - 1) * .045, top + L], .03, .03, i % 4 ? soie : peauF, .1);
  }
  // le cou, la tête, basse et lourde : le crâne, puis le chanfrein qui s'effile jusqu'au groin
  const H = [.53 + hx, hy + roule, .47 + bz + hz], S = [H[0] + .23, H[1], H[2] - .09];
  pr([.32, roule * 1.2, .63 + bz], [H[0] + .02, H[1], H[2] + .04], .54, .5, peau, .82);
  bo([H[0] - .1, H[1], H[2] + .03], [H[0] + .16, H[1], H[2] - .02], .44, .4, peau);           // le crâne
  pr([H[0] + .08, H[1], H[2] - .02], S, .32, .3, peau, .76);                                     // le chanfrein
  bo([H[0] - .06, H[1], H[2] + .17], [H[0] + .16, H[1], H[2] + .11], .26, .09, soie, false, 3);   // le front et son toupet
  pr(S, [S[0] + .12, S[1], S[2] - .05], .25, .23, museau, .95);                                  // le groin
  pr([S[0] + .12, S[1], S[2] - .05], [S[0] + .145, S[1], S[2] - .056], .24, .22, groin);
  for (const s of [-1, 1]) bo([S[0] + .14, S[1] + s * .05, S[2] - .05], [S[0] + .152, S[1] + s * .05, S[2] - .05], .045, .065, [30, 18, 24], false, 3);
  pr([H[0] + .04, H[1], H[2] - .13], [S[0] + .1, S[1], S[2] - .13 - jo], .28, .1, peauF, .72, 6);   // la mâchoire, qui s'ouvre
  if (jo > .05) bo([H[0] + .1, H[1], S[2] - .1 - jo * .5], [S[0] + .07, S[1], S[2] - .1 - jo * .5], .18, jo * .8, viC, true, 3);   // la gueule, qui luit
  for (const s of [-1, 1]) {
    const T0 = [S[0] + .03, S[1] + s * .1, S[2] - .11], T1 = [S[0] + .14, S[1] + s * .2, S[2] - .01], T2 = [T1[0] - .01, T1[1] + s * .05, T1[2] + .15], i0 = B.length;
    if (s < 0) { pr(T0, [T0[0] + .07, T0[1] - .06, T0[2] + .07], .07, .07, ivoireF, .8, 6); pe([T0[0] + .07, T0[1] - .06, T0[2] + .07], [T0[0] + .09, T0[1] - .07, T0[2] + .085], .055, .04, ivoire, [.6, 1.2]); }   // la défense cassée
    else { pr(T0, T1, .075, .075, ivoireF, .8, 6); pr(T1, T2, .06, .06, ivoire, .75, 6); pr(T2, [T2[0] - .05, T2[1], T2[2] + .09], .045, .045, ivoire, .05, 6); }   // la défense, qui s'effile en pointe
    mat(T.os, i0);
    const ea = .3 * Math.sin(t * 1.3 + s) * vif, E0 = [H[0] + .02, H[1] + s * .15, H[2] + .1];   // les oreilles, déchirées, qui battent
    pe(E0, [E0[0] - .1, E0[1] + s * (s > 0 ? .12 : .17), E0[2] + .14 + ea * .06], .16, .04, peauF, [s > 0 ? .55 : .25, .8]);
    pe([E0[0] - .01, E0[1] + s * .01, E0[2] + .014], [E0[0] - .07, E0[1] + s * (s > 0 ? .09 : .12), E0[2] + .11 + ea * .05], .09, .02, [118, 84, 94], [.3, .8]);
    bo([H[0] + .09, H[1] + s * .17, H[2] + .07], [H[0] + .135, H[1] + s * .17, H[2] + .07], .06, .05, mort ? [90, 84, 96] : viC, !mort, 3);   // les yeux laiteux
    if (vif) { const u = (t * .55 + (s > 0 ? .4 : 0)) % 1, L = .05 + .17 * u;               // la bave qui pend, s'étire et tombe
      pr([S[0] + .08, S[1] + s * .07, S[2] - .14 - jo], [S[0] + .08, S[1] + s * .07, S[2] - .14 - jo - L], .026, .026, vi, .6, 6, true);
      bo([S[0] + .08, S[1] + s * .07, S[2] - .14 - jo - L], [S[0] + .08, S[1] + s * .07, S[2] - .2 - jo - L], .05, .05, viC, true, 3); }
  }
  // les pattes : courtes, épaisses, effilées vers le sabot ; au trot, en diagonale. Les sabots fendus.
  for (const [ax, s, off, av] of [[.25, 1, 0, 1], [.25, -1, Math.PI, 1], [-.44, 1, Math.PI, 0], [-.44, -1, 0, 0]]) {
    const q = ph + off, dx = Math.sin(q) * .13 * va, lv = Math.max(0, -Math.cos(q)) * .08 * va, y = s * .26, A = [ax + roule * .2, y + roule, .46 + bz];
    const Kn = av ? [ax + dx * .5 + .03, y * 1.04, .21 + lv * .7] : [ax + dx * .5 - .06, y * 1.04, .24 + lv * .7], Hf = [ax + dx, y * 1.07, lv];
    pr(A, Kn, av ? .28 : .26, av ? .28 : .26, peau, .7); pr(Kn, [Hf[0], Hf[1], Hf[2] + .04], av ? .19 : .18, av ? .19 : .18, peauF, .75, 6);
    for (const k of [-1, 1]) { pe([Hf[0] - .03, Hf[1] + k * .03, Hf[2] + .02], [Hf[0] + .07, Hf[1] + k * .035, Hf[2] + .015], .065, .06, sabot, [.7, .6]); mat(T.bloc, B.length - 1); }   // les deux onglons
    bo([Kn[0] - .05, Kn[1], Kn[2] - .01], [Kn[0] + .03, Kn[1], Kn[2] - .05], .22, .07, soie, false, 3);   // les fanons de poils, aux genoux
  }
  pr([-.7, roule * .6, .64 + bz], [-.8, Math.sin(t * 2.3) * .06 * vif, .48 + bz], .05, .05, peauF, .5, 6);   // la queue, et sa touffe
  bo([-.8, Math.sin(t * 2.3) * .06 * vif, .5 + bz], [-.84, Math.sin(t * 2.3) * .08 * vif, .38 + bz], .08, .08, soie, false, 3);
  // les pustules : des grappes sur les flancs, l'épaule, le cou et le dos ; elles gonflent, battent, crèvent et repoussent
  let r = h;
  for (let i = 0; i < 34; i++) {
    r = Math.imul(r ^ (r >>> 15), 2246822519) >>> 0;
    const zone = i % 5, s = r & 1 ? 1 : -1, u = ((r >>> 4) & 255) / 255, v = ((r >>> 12) & 255) / 255;
    let p, n;
    if (i >= 22) { p = dos(-.46 + u * .74, (v - .5) * .5); n = [0, 0, 1]; }                // le dos
    else if (zone < 3) { p = flanc(-.48 + u * .72, .4 + v * .3, s); n = [0, s, .25]; }       // les flancs
    else if (zone === 3) { p = [.12 + u * .26, s * (.25 + v * .05) + roule, .82 + v * .06 + bz]; n = [0, s * .6, .8]; }   // l'épaule
    else { p = [.36 + u * .12, s * .24 + roule, .54 + v * .12 + bz]; n = [.2, s, .2]; }       // le cou
    const cyc = (t * .1 + i * .137) % 1, crev = cyc < .07 || mort > .2, pul = .85 + .15 * Math.sin(t * 3.2 + i);
    const sz = crev ? .03 : (.032 + .05 * cyc) * pul, tip = [p[0] + n[0] * sz, p[1] + n[1] * sz, p[2] + n[2] * sz];
    bo([p[0] - n[0] * sz * .4, p[1] - n[1] * sz * .4, p[2] - n[2] * sz * .4], tip, sz * 1.5, sz * 1.5, crev ? [70, 30, 70] : vi, !crev, 3);
    if (!crev && sz > .055) bo(tip, [tip[0] + n[0] * sz * .3, tip[1] + n[1] * sz * .3, tip[2] + n[2] * sz * .3], sz * .55, sz * .55, [222, 170, 252], true, 3);
    if (i % 3 === 0 && !mort) { const q = [p[0] + .045, p[1], p[2] - .045]; bo(q, [q[0] + n[0] * .03, q[1] + n[1] * .03, q[2] + n[2] * .03], .04 * pul, .04 * pul, vi, true, 3); }
  }
  // morte : elle bascule sur le flanc, puis s'affaisse et se défait
  if (mort) {
    const th = Math.min(1, mort * 1.1) * 1.45, c = Math.cos(th), sn = Math.sin(th), y0 = -.36, fond = f.vyMortT ? Math.max(0, (t - f.vyMortT - 3) / 4) * .35 : 0;
    const rot = p => [p[0], (p[1] - y0) * c - p[2] * sn + y0, (p[1] - y0) * sn + p[2] * c - fond];
    for (let i = n0; i < B.length; i++) { B[i].a = rot(B[i].a); B[i].b = rot(B[i].b); }
  }
}
// (heroBones) le masque à bec : une face de cuir, deux verres qui luisent, le bec d'os ; et la maladie sur la peau
function vyrelMasque(J, h, B) {
  if (!masqueDe(J)) return;
  const p = d => [h[0] + d[0], h[1] + d[1], h[2] + d[2]], cuir = [62, 46, 42], cuirC = [92, 70, 60], bec = [226, 214, 190], becF = [190, 176, 150];
  B.push({ a: p([.065, 0, -.06]), b: p([.065, 0, .06]), w: .19, h: .07, c: cuir });           // la face
  B.push({ a: p([-.06, 0, .035]), b: p([.08, 0, .035]), w: .205, h: .045, c: cuirC });          // la sangle
  for (const s of [-1, 1]) B.push({ a: p([.088, s * .048, .022]), b: p([.114, s * .048, .022]), w: .055, h: .055, c: [196, 132, 255], luit: true, lum: true, boule: 3 });   // les verres, ronds
  B.push({ a: p([.09, 0, -.008]), b: p([.29, 0, -.085]), w: .085, h: .08, c: bec, pans: 6, fin: .12 });   // le bec, qui s'effile en pointe
  B.push({ a: p([.1, 0, .012]), b: p([.2, 0, -.03]), w: .02, h: .02, c: becF });
}
function vyrelHeros(J, B) {
  const mal = J === P ? !!P.vyrel : !!(J && J.fx && J.fx.vyrel); if (!mal) return;
  const n = J === P ? 2 + vyStade() * 2 : 4, pul = .8 + .2 * Math.sin(t * 2.5);
  for (let i = 0; i < n && B.length; i++) {
    const o = B[(i * 7 + 3) % Math.min(B.length, 14)]; if (!o || !o.a) continue;
    const u = (i * .37) % 1, s = .022 * pul, p = [o.a[0] + (o.b[0] - o.a[0]) * u, o.a[1] + (o.b[1] - o.a[1]) * u + (i % 2 ? 1 : -1) * (o.w || .1) * .45, o.a[2] + (o.b[2] - o.a[2]) * u];
    B.push({ a: p, b: [p[0], p[1], p[2] + s], w: s * 1.4, h: s * 1.4, c: [176, 92, 236], luit: true, lum: true, boule: 3 });
  }
}
// le ciel violacé, la brume (une fois par image : le canvas les demande à chaque case)
const vyrelCiel = () => VY.ciel;
const vyrelBrouillard = () => VY.bru;
// le filtre de l'image : l'île jaunie et violacée ; la vue qui se trouble (stade II et III)
function vyrelCss() {
  const k = vyIci() ? VY.k : 0, fl = VY.flou > t ? Math.min(1, (VY.flou - t) / .8, 1) : 0;
  if (!k && !fl) return '';
  return (k ? `saturate(${(1 - .24 * k).toFixed(2)}) sepia(${(.16 * k).toFixed(2)}) hue-rotate(${(-14 * k).toFixed(0)}deg)` : '') + (fl ? ` blur(${(1.8 * fl).toFixed(1)}px)` : '');
}
const vyrelVoile = () => (vyIci() && VY.k > 0) || !!P.vyrel;
function vyrelFiltre(g, W, H, R, vign) {
  if (vyIci() && VY.k > 0) vign((.16 + .3 * Math.min(1, VY.dens)) * VY.k, '58,22,74', .3);
  const st = vyStade();
  if (st) vign(.08 + .07 * st + .05 * Math.sin(t * 2.2), '96,30,86', .38);          // la fièvre qui bat aux tempes
}
// ---------- le HUD, les statuts ----------
function vyrelHud() {
  if (P.vyrel) return '<span class="etiq vyrel">malade · Vyrel ' + VY_ROM[vyStade()] + '</span>';
  if ((P.vyrelExpo || 0) > .5) return '<span class="etiq vyrel">miasmes ' + Math.round(Math.min(1, P.vyrelExpo / VY_SEUIL) * 100) + ' %</span>';
  return '';
}
function vyrelStatuts(add) {
  const st = vyStade();
  if (st) add('st_vyrel', 'mal', 'Malade du Vyrel · stade ' + VY_ROM[st], 'vie au plus ' + Math.round(VY_VIE[st] * 100) + ' % · le souffle revient mal · des quintes de toux alertent les bêtes'
    + (st >= 2 ? ' · la vue se trouble' : '') + ' · contagieux · seule la Thériaque en guérit (table d\'alchimie)');
  else if ((P.vyrelExpo || 0) > .5) add('ichor', 'mal', 'Miasmes du Vyrel', 'à 100 %, c\'est la maladie · un masque à bec divise l\'exposition par trois', null, Math.round(Math.min(1, P.vyrelExpo / VY_SEUIL) * 100) + ' %');
}
