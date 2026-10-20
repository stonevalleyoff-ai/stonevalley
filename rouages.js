// ============================================================
//  LES ROUAGES (rouages.js) — le Centre des automates, refait (§170)
//  Plus dense, plus grand. Quinze à vingt salles serrées autour d'une GRANDE HALLE des machines (au dernier
//  étage, de la salle de l'HORLOGE, immense), une FONDERIE dès le deuxième étage, des couloirs courts percés de
//  niches. Les murs montent autour des grandes salles : huit cubes pour la halle, sept pour la fonderie, onze
//  pour l'Horloge. Chaque salle a son mobilier contre les murs, et on ne le traverse pas : armoires, casiers,
//  consoles, étagères, établis, citernes, bancs de bandes. Des salles nouvelles, plus calmes : l'ATELIER, le
//  DÉPÔT (un wagonnet sur ses rails), les ARCHIVES (des rangées de mémoires à bandes), la CHAUFFERIE, la CHAÎNE
//  (des tapis qui vous emportent, des presses), le GÉNÉRATEUR (une dynamo, deux bobines qui s'arquent).
//  Ce qui bouge : le volant de la halle et son régulateur, ses pistons, ses rouages muraux, le pont roulant ;
//  les presses, les arcs, les bandes, le creuset de la fonderie ; à l'Horloge, le cadran géant, ses rouages et
//  son balancier. Et la musique du Centre : « La Grande Horloge » (rouagesMusique).
//  donjon.js appelle centreGenere (le plan), centrePeupler (le mobilier, en os fixes), centreDecor (ce qui
//  bouge) et centreMaj (les tapis, les fumées, les étincelles) ; index.html : rouagesIci, rouagesMusique,
//  rouagesIntensite.
// ============================================================
const CT = { anim: [], tapis: [], emet: [], niches: [], I: .25 };
const CTC = { fer: [58, 60, 70], fer2: [86, 90, 102], acier: [128, 134, 148], noir: [24, 24, 30], ombre: [36, 36, 44], laiton: [186, 148, 74],
  cuivre: [176, 104, 62], rouille: [126, 76, 52], jaune: [226, 182, 48], rouge: [168, 52, 44], olive: [74, 90, 70], bleu: [62, 78, 102],
  creme: [202, 194, 170], bois: [108, 78, 54], gomme: [34, 32, 36], bronze: [104, 84, 64], brique: [92, 54, 44] };
const CTL = { ambre: [255, 190, 90], cyan: [110, 226, 255], vert: [120, 255, 160], rouge: [255, 70, 50], blanc: [232, 242, 255], feu: [255, 128, 48], or: [255, 214, 130], violet: [200, 160, 255] };
const rouagesIci = () => typeof djIci === 'function' && djIci() && !!DJ.etat && DJ.etat.th !== 'roi';
// un hasard fixe par case : le même mobilier pour tous
const ctH = (x, y, k = 0) => { let h = Math.imul(x * 374761393 + y * 668265263 + k * 2246822519, 1274126177); h ^= h >>> 13; h = Math.imul(h, 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ============================================================
//  LE PLAN
// ============================================================
// Le mobilier contre les murs, par salle : ce qu'on y range (les armoires et les citernes sont pleines, on ne
// les traverse pas ; « tableau », « vanne », « outils », « dock », « banniere » sont au mur, on passe devant).
const CT_KITS = {
  arrivee: ['casier', 'casier', 'console', 'armoire', 'tableau', 'citerne'],
  grenier: ['etagere', 'etagere', 'caisses', 'citerne', 'caisses', 'etagere'],
  garde: ['statue', 'banniere', 'armoire', 'statue', 'tableau', 'banniere'],
  tourelles: ['munitions', 'caisses', 'armoire', 'tableau', 'munitions'],
  araignees: ['dock', 'dock', 'caisses', 'tableau', 'dock', 'citerne'],
  cristaux: ['condo', 'condo', 'tableau', 'armoire', 'condo'],
  vapeur: ['vanne', 'tableau', 'vanne'],
  atelier: ['etabli', 'etabli', 'outils', 'armoire', 'etagere', 'etabli', 'citerne'],
  depot: ['etagere', 'caisses', 'caisses', 'citerne', 'etagere', 'caisses'],
  archives: ['bande', 'bande', 'console', 'bande', 'armoire'],
  chaudieres: ['vanne', 'charbon', 'armoire', 'charbon', 'tableau', 'vanne'],
  convoyeurs: ['caisses', 'armoire', 'console', 'citerne', 'caisses'],
  generateur: ['condo', 'tableau', 'console', 'condo', 'armoire'],
  halle: ['armoire', 'console', 'caisses', 'citerne', 'casier', 'vanne'],
  fonderie: ['lingots', 'charbon', 'citerne', 'lingots', 'armoire'],
  horloge: ['armoire', 'console', 'banniere'],
  escalier: ['tableau', 'caisses', 'armoire', 'citerne'],
};
const CT_MURAL = new Set(['tableau', 'vanne', 'outils', 'dock', 'banniere']);
const CT_BAS = { caisses: 1, munitions: 1, charbon: 1, lingots: 1, etabli: 1, console: 1, etagere: 1, condo: 1, citerne: 2 };   // la hauteur du bloc (sinon 3)
const CT_CALMES = ['atelier', 'depot', 'archives', 'chaudieres', 'convoyeurs', 'generateur'];
function centreGenere() {
  const R = djAlea(djHash(SEED ^ Math.imul(DJ.e, 0x9e3779b1) ^ 0xd0e5 ^ 0x1700)), Z0 = DJ_Z0, HM = Z0 + DJ_MUR, e = DJ.e, dernier = e === DJ.n;
  Hgt.fill(HM); Bio.fill(DJ_BIO_MUR); Eau.fill(0); PlT.fill(0); PlB.fill(0);
  CT.niches = [];
  const A = 46, B = 154, salles = [];
  const libre = (x, y, w, h) => x >= A && y >= A && x + w <= B && y + h <= B
    && !salles.some(q => x < q.x + q.w + 3 && x + w + 3 > q.x && y < q.y + q.h + 3 && y + h + 3 > q.y);
  // les grandes salles d'abord : la halle (ou l'Horloge), puis la fonderie
  if (dernier) salles.push({ x: 85 - (R() * 10 | 0), y: 82 - (R() * 10 | 0), w: 30, h: 24, role: 'horloge', haut: 11, grand: 1 });
  else { const w = 22 + (R() * 5 | 0), h = 18 + (R() * 4 | 0); salles.push({ x: 89 - (w >> 1) + (R() * 22 | 0), y: 89 - (h >> 1) + (R() * 22 | 0), w, h, role: 'halle', haut: 8, grand: 1 }); }
  // les autres, serrées : chacune se pose contre une salle déjà là (trois à six cases de roche entre elles), au plus
  // près du milieu — un bloc compact, des couloirs courts
  const accoler = (w, h, o) => {
    let best = null;
    for (let k = 0; k < 260; k++) {
      const q = salles[R() * salles.length | 0], c = R() * 4 | 0, g = 3 + (R() * 4 | 0);
      const x = c === 0 ? q.x - w - g : c === 1 ? q.x + q.w + g : q.x - w + 2 + (R() * (q.w + w - 4) | 0);
      const y = c === 2 ? q.y - h - g : c === 3 ? q.y + q.h + g : q.y - h + 2 + (R() * (q.h + h - 4) | 0);
      if (!libre(x, y, w, h)) continue;
      const sc = Math.hypot(x + w / 2 - 100, y + h / 2 - 100) + R() * 6;
      if (!best || sc < best.sc) best = { x, y, w, h, sc };
    }
    if (best) { delete best.sc; salles.push(Object.assign(best, o || {})); }
    return !!best;
  };
  if (e >= 2) accoler(15 + (R() * 3 | 0), 13 + (R() * 3 | 0), { role: 'fonderie', haut: 7, grand: 1 });
  const nb = salles.length + 12 + Math.min(e, 3) + (R() * 2 | 0);
  for (let k = 0; k < 60 && salles.length < nb; k++) accoler(8 + (R() * 7 | 0), 8 + (R() * 6 | 0));
  const creuse = (x, y, bio) => { const i = y * WS + x; if (Hgt[i] === HM) { Hgt[i] = Z0; Bio[i] = bio; } };
  for (const q of salles) {
    q.cx = q.x + q.w / 2; q.cy = q.y + q.h / 2; q.portes = []; q.meubles = []; q.grands = [];
    for (let y = q.y; y < q.y + q.h; y++) for (let x = q.x; x < q.x + q.w; x++) creuse(x, y, DJ_BIO_SALLE);
  }
  // l'arbre couvrant, puis quatre boucles entre voisines : des couloirs courts, et plus d'un chemin
  const d2 = (a, b) => (salles[a].cx - salles[b].cx) ** 2 + (salles[a].cy - salles[b].cy) ** 2;
  const liens = [], dans = new Set([0]);
  while (dans.size < salles.length) {
    let best = null;
    for (const a of dans) for (let b = 0; b < salles.length; b++) if (!dans.has(b) && (!best || d2(a, b) < best[2])) best = [a, b, d2(a, b)];
    liens.push(best); dans.add(best[1]);
  }
  for (let k = 0, n = 0; k < 80 && n < 4; k++) {
    const a = R() * salles.length | 0, b = R() * salles.length | 0;
    if (a === b || d2(a, b) > 30 * 30 || liens.some(l => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a))) continue;
    liens.push([a, b]); n++;
  }
  for (const [a, b] of liens) {
    const p = salles[a], q = salles[b], ax = p.cx | 0, ay = p.cy | 0, bx = q.cx | 0, by = q.cy | 0;
    const h = (y, x0, x1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 1; x++) { creuse(x, y, DJ_BIO_COULOIR); creuse(x, y + 1, DJ_BIO_COULOIR); } };
    const v = (x, y0, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1) + 1; y++) { creuse(x, y, DJ_BIO_COULOIR); creuse(x + 1, y, DJ_BIO_COULOIR); } };
    if (R() < .5) { h(ay, ax, bx); v(bx, ay, by); } else { v(ax, ay, by); h(by, ax, bx); }
  }
  // les niches : un renfoncement de deux cases sur deux, de loin en loin, au flanc des couloirs droits
  const dur = (x, y) => Hgt[y * WS + x] >= HM, cou = (x, y) => Bio[y * WS + x] === DJ_BIO_COULOIR && Hgt[y * WS + x] === Z0;
  const niche = (x, y, cells, cx, cy, nx, ny) => {
    if (CT.niches.some(n => Math.abs(n.x - cx) + Math.abs(n.y - cy) < 9)) return;
    for (const [a, b] of cells) { const i = b * WS + a; Hgt[i] = Z0; Bio[i] = DJ_BIO_COULOIR; }
    CT.niches.push({ x: cx, y: cy, nx, ny, k: ['armoires', 'tableau', 'citerne', 'console', 'caisses', 'armoires'][R() * 6 | 0] });
  };
  for (let y = A; y < B; y++) for (let x = A; x < B; x++) {
    if (R() > .05 || !cou(x, y) || !cou(x + 1, y) || !cou(x, y + 1) || !cou(x + 1, y + 1)) continue;
    const s = R() < .5 ? -1 : 1;
    // un couloir en long (rangées y, y+1) : la niche au nord ou au sud
    { const y0 = s < 0 ? y - 1 : y + 2; let ok = true;
      for (let k = 0; k < 3 && ok; k++) for (let dx = -1; dx <= 2; dx++) if (!dur(x + dx, y0 + s * k)) { ok = false; break; }
      if (ok) { niche(x, y, [[x, y0], [x + 1, y0], [x, y0 + s], [x + 1, y0 + s]], x + 1, s < 0 ? y - 1 : y + 3, 0, -s); continue; } }
    // un couloir en travers (colonnes x, x+1) : la niche à l'ouest ou à l'est
    { const x0 = s < 0 ? x - 1 : x + 2; let ok = true;
      for (let k = 0; k < 3 && ok; k++) for (let dy = -1; dy <= 2; dy++) if (!dur(x0 + s * k, y + dy)) { ok = false; break; }
      if (ok) niche(x, y, [[x0, y], [x0, y + 1], [x0 + s, y], [x0 + s, y + 1]], s < 0 ? x - 1 : x + 3, y + 1, -s, 0); }
  }
  // les portes : là où un couloir perce le tour d'une salle
  for (const q of salles) for (let y = q.y - 1; y <= q.y + q.h; y++) for (let x = q.x - 1; x <= q.x + q.w; x++) {
    if (y !== q.y - 1 && y !== q.y + q.h && x !== q.x - 1 && x !== q.x + q.w) continue;
    const i = y * WS + x; if (Hgt[i] === Z0) q.portes.push(i);
  }
  // l'arrivée et l'escalier, aux deux bouts (jamais dans une grande salle)
  const cand = salles.map((q, k) => k).filter(k => !salles[k].grand);
  const loin = a => { let b = cand[0], m = -1; for (const k of cand) { const d = d2(a, k); if (d > m) { m = d; b = k; } } return b; };
  const sortie = dernier ? 0 : loin(cand[R() * cand.length | 0]), arrivee = loin(sortie);
  salles[arrivee].role = 'arrivee';
  if (!dernier) salles[sortie].role = 'escalier';
  // les autres : une salle de combat, une salle calme, en alternance
  const COMBAT = e === 1 ? ['tourelles', 'araignees', 'grenier', 'cristaux', 'vapeur', 'tourelles', 'araignees']
    : ['garde', 'tourelles', 'araignees', 'grenier', 'cristaux', 'vapeur', 'garde', 'araignees', 'tourelles'];
  let kc = R() * COMBAT.length | 0, kk = R() * CT_CALMES.length | 0, alt = R() < .5;
  for (const q of salles) if (!q.role) { q.role = alt ? CT_CALMES[kk++ % CT_CALMES.length] : COMBAT[kc++ % COMBAT.length]; alt = !alt; }
  if (e > 1 && !dernier && !salles.some(q => q.role === 'garde')) { const q = salles.find(q => !q.grand && q.role !== 'arrivee' && q.role !== 'escalier'); if (q) q.role = 'garde'; }
  // l'huile, les piliers des tourelles, l'escalier
  for (const q of salles) {
    if (q.role === 'grenier' || q.role === 'depot' || q.role === 'atelier') for (let k = 0; k < q.w * q.h * .07; k++) {
      const x = q.x + 2 + (R() * (q.w - 4) | 0), y = q.y + 2 + (R() * (q.h - 4) | 0); Bio[y * WS + x] = DJ_BIO_HUILE;
    }
    if (q.role === 'tourelles') for (let k = 0; k < 3; k++) {
      const x = q.x + 2 + (R() * (q.w - 4) | 0), y = q.y + 2 + (R() * (q.h - 4) | 0);
      if (Math.abs(x - q.cx) < 2 && Math.abs(y - q.cy) < 2) continue;
      Hgt[y * WS + x] = Z0 + 2; Bio[y * WS + x] = DJ_BIO_SALLE; q.grands.push({ k: 'pilier', x, y });
    }
  }
  const esc = salles.find(q => q.role === 'escalier');
  if (esc) {
    const x = esc.cx | 0, y = esc.cy | 0;
    for (let k = 0; k < 3; k++) for (const dy of [0, 1]) { const i = (y + dy) * WS + x - 1 + k; Hgt[i] = Z0 - 1 - k; Bio[i] = DJ_BIO_COULOIR; }
    DJ.escalier = { x: x + 1.5, y: y + 1, z: Z0 - 3 };
  } else DJ.escalier = null;
  // les grandes machines (elles prennent leurs cases), puis le mobilier contre les murs
  for (const q of salles) ctGrands(q, R);
  for (const q of salles) ctMeubler(q, R);
  for (const n of CT.niches) {                                     // le fond d'une niche : son meuble (le tableau est au mur)
    const br = n.ny > 0 ? n.y - 1 : n.y, bc = n.nx > 0 ? n.x - 1 : n.x;
    n.cells = n.nx ? [[bc, n.y - 1], [bc, n.y]] : [[n.x - 1, br], [n.x, br]];
    if (n.k !== 'tableau') for (const [a, b] of n.cells) ctBloc(a, b, n.k === 'caisses' || n.k === 'console' ? 1 : n.k === 'citerne' ? 2 : 3);
  }
  // les murs montent autour des salles : quatre cubes, cinq ou six pour les grandes, huit à onze pour les géantes
  for (const q of salles) {
    const H = q.haut || (q.w * q.h >= 140 ? 6 : q.w * q.h >= 100 ? 5 : 4); q.haut = H;
    if (H <= 4) continue;
    const m = q.grand ? 3 : 2, metal = q.grand || q.role === 'arrivee' || q.role === 'archives' || q.role === 'generateur';
    for (let y = q.y - m; y < q.y + q.h + m; y++) for (let x = q.x - m; x < q.x + q.w + m; x++) {
      const i = y * WS + x; if (Hgt[i] < HM) continue;
      Hgt[i] = Math.max(Hgt[i], Z0 + H); if (metal) Bio[i] = DJ_BIO_SALLE;
    }
  }
  DJ.salles = salles;
  calcOmbrage();
  return true;
}
// La case est-elle libre pour un meuble : du sol, loin des portes (deux cases), hors des coins réservés.
function ctLibre(q, x, y, marge = 2) {
  const Z0 = DJ_Z0;
  if (Hgt[y * WS + x] !== Z0 || Bio[y * WS + x] === DJ_BIO_HUILE) return false;
  if (q.portes.some(i => Math.max(Math.abs(i % WS - x), Math.abs((i / WS | 0) - y)) <= marge)) return false;
  if (q.role === 'arrivee' && x < q.x + 4 && y < q.y + 4) return false;                        // le monte-charge, et l'arrivée
  if (q.role === 'horloge' && ((x > q.x + q.w - 5 && y > q.y + q.h - 5) || (y < q.y + 4 && Math.abs(x + .5 - q.cx) < 3))) return false;   // le monte-charge, le grand coffre
  if (q.role === 'garde' && x >= q.x + q.w - 3 && y <= q.y + 2) return false;               // le coffre du gardien
  if (q.role === 'grenier' && ((y <= q.y + 2 && Math.abs(x + .5 - q.cx) < 3) || (x >= q.x + q.w - 3 && Math.abs(y + .5 - q.cy) < 2))) return false;   // les coffres du grenier
  if (q.role === 'tourelles' && Math.abs(y + .5 - q.cy) < 2 && (x <= q.x + 3 || x >= q.x + q.w - 4)) return false;   // le coffre des tourelles
  if (q.role === 'vapeur' && y >= q.y + q.h - 3 && Math.abs(x + .5 - q.cx) < 2) return false;
  if (q.role === 'escalier' && DJ.escalier && Math.abs(x + .5 - DJ.escalier.x) < 3.5 && Math.abs(y + .5 - DJ.escalier.y) < 3) return false;   // l'escalier, et son abord
  return true;
}
function ctBloc(x, y, h) { Hgt[y * WS + x] = DJ_Z0 + h; Bio[y * WS + x] = DJ_BIO_SALLE; }
// Le tour de la salle : un meuble sur une case sur deux ou plus, selon la salle.
function ctMeubler(q, R) {
  const kit = CT_KITS[q.role]; if (!kit) return;
  const dens = q.grand ? .34 : CT_CALMES.includes(q.role) ? .72 : q.role === 'arrivee' || q.role === 'escalier' ? .5 : .38;
  const tour = [];
  for (let x = q.x; x < q.x + q.w; x++) { tour.push([x, q.y, 0, 1]); tour.push([x, q.y + q.h - 1, 0, -1]); }
  for (let y = q.y + 1; y < q.y + q.h - 1; y++) { tour.push([q.x, y, 1, 0]); tour.push([q.x + q.w - 1, y, -1, 0]); }
  for (const [x, y, nx, ny] of tour) {
    if (R() > dens || !ctLibre(q, x, y)) continue;
    const coin = (x === q.x || x === q.x + q.w - 1) && (y === q.y || y === q.y + q.h - 1);
    let k = kit[R() * kit.length | 0];
    if (coin && CT_MURAL.has(k)) continue;
    if (q.role === 'vapeur' && !CT_MURAL.has(k)) continue;                     // la salle des grilles : rien qui barre une rangée
    q.meubles.push({ k, x, y, nx, ny, v: R() });
    if (!CT_MURAL.has(k)) ctBloc(x, y, CT_BAS[k] || 3);
  }
}
// Les grandes pièces d'une salle, et les cases qu'elles prennent.
function ctGrands(q, R) {
  const Z0 = DJ_Z0, hor = q.w >= q.h, cx = q.cx | 0, cy = q.cy | 0, G = q.grands;
  const prend = (x0, y0, w, h, ht, marge = 1) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (!ctLibre(q, x, y, marge)) return false;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) ctBloc(x, y, ht);
    return true;
  };
  const libreZone = (x0, y0, w, h, marge = 1) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (!ctLibre(q, x, y, marge)) return false; return true; };
  if (q.role === 'halle') {
    if (hor) { if (prend(cx - 2, cy - 1, 4, 2, 2)) G.push({ k: 'volant', x: cx, y: cy, hor }); }
    else if (prend(cx - 1, cy - 2, 2, 4, 2)) G.push({ k: 'volant', x: cx, y: cy, hor });
    for (const s of [-1, 1]) {                                     // les pistons, de part et d'autre du volant
      const px = hor ? Math.round(q.cx + s * q.w * .3) - 1 : cx - 1, py = hor ? cy - 1 : Math.round(q.cy + s * q.h * .3) - 1;
      if (libreZone(px, py, 2, 2, 2) && prend(px, py, 2, 2, 1)) G.push({ k: 'piston', x: px + 1, y: py + 1, ph: s > 0 ? Math.PI : 0 });
    }
    for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {     // les colosses, dans les coins
      const x0 = sx ? q.x + q.w - 4 : q.x + 2, y0 = sy ? q.y + q.h - 4 : q.y + 2;
      if (G.filter(o => o.k === 'colosse').length < 2 && libreZone(x0, y0, 2, 2, 2) && R() < .8 && prend(x0, y0, 2, 2, 1))
        G.push({ k: 'colosse', x: x0 + 1, y: y0 + 1, a: Math.atan2(q.cy - (y0 + 1), q.cx - (x0 + 1)) });
    }
  } else if (q.role === 'fonderie') {
    for (let x = q.x + 2; x + 2 <= q.x + q.w - 2; x += 4) if (libreZone(x, q.y, 2, 1, 1) && prend(x, q.y, 2, 1, 3)) G.push({ k: 'four', x: x + 1, y: q.y + .5 });
    const my = q.y + 5;                                            // la rangée des moules, avec ses passages
    G.push({ k: 'pont', x: q.cx, y: my + .5, x0: q.x + 2.5, x1: q.x + q.w - 2.5 });
    for (let x = q.x + 3; x < q.x + q.w - 3; x++) if ((x - q.x) % 5 !== 0 && ctLibre(q, x, my) && prend(x, my, 1, 1, 1)) G.push({ k: 'moule', x: x + .5, y: my + .5, chaud: (x * 7) % 3 !== 0 });
  } else if (q.role === 'horloge') {
    for (const x0 of [q.x + 4, q.x + q.w - 6]) for (const y0 of [q.y + 5, (q.cy | 0) - 1, q.y + q.h - 7]) {
      for (let y = y0; y < y0 + 2; y++) for (let x = x0; x < x0 + 2; x++) { Hgt[y * WS + x] = Z0 + q.haut; Bio[y * WS + x] = DJ_BIO_SALLE; }
      G.push({ k: 'colonne', x: x0 + 1, y: y0 + 1 });
    }
    const tours = [], fx = Math.floor(q.cx);                     // les deux tours du cadran, et le socle où bat le balancier
    for (const s of [-1, 1]) { const x = Math.floor(q.cx + s * 4.6); if (ctLibre(q, x, q.y, 1)) { ctBloc(x, q.y, q.haut); tours.push(x); } }
    const socle = [];
    for (let x = fx - 3; x <= fx + 2; x++) if (ctLibre(q, x, q.y, 1)) { ctBloc(x, q.y, 1); socle.push(x); }
    G.push({ k: 'cadran', x: q.cx, y: q.y, tours, socle });
  } else if (q.role === 'atelier') {
    const n = q.w * q.h > 110 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const x0 = hor ? (n === 1 ? cx - 1 : k ? cx + 1 : cx - 3) : cx - 1, y0 = hor ? cy - 1 : (n === 1 ? cy - 1 : k ? cy + 1 : cy - 3);
      if (prend(x0, y0, 2, 1, 1, 2)) G.push({ k: 'table', x: x0 + 1, y: y0 + .5, v: R() });
    }
  } else if (q.role === 'depot') {
    G.push({ k: 'rails', hor, x: q.cx, y: q.cy, x0: q.x, x1: q.x + q.w, y0: q.y, y1: q.y + q.h });
    const u = .25 + R() * .5, wx = hor ? Math.round(q.x + 2 + u * (q.w - 5)) : cx - 1, wy = hor ? cy - 1 : Math.round(q.y + 2 + u * (q.h - 5));
    if (prend(wx, wy, 2, 2, 1, 1)) G.push({ k: 'wagon', x: wx + 1, y: wy + 1, hor });
    for (let k = 0; k < 4; k++) {                                  // des piles de caisses, de part et d'autre des rails
      const x0 = hor ? q.x + 2 + (R() * (q.w - 5) | 0) : (k % 2 ? cx + 2 : cx - 4), y0 = hor ? (k % 2 ? cy + 2 : cy - 4) : q.y + 2 + (R() * (q.h - 5) | 0);
      if (libreZone(x0, y0, 2, 2, 2) && prend(x0, y0, 2, 1, 2, 2)) G.push({ k: 'pile', x: x0 + 1, y: y0 + .5, v: R() });
    }
  } else if (q.role === 'archives') {
    if (hor) { for (let y = q.y + 3; y <= q.y + q.h - 4; y += 3) for (let x = q.x + 3; x < q.x + q.w - 3; x++) if (Math.abs(x + .5 - q.cx) > 1.2 && ctLibre(q, x, y, 2) && prend(x, y, 1, 1, 3)) q.meubles.push({ k: 'memoire', x, y, nx: 0, ny: (y - q.y) % 2 ? 1 : -1, v: R() }); }
    else for (let x = q.x + 3; x <= q.x + q.w - 4; x += 3) for (let y = q.y + 3; y < q.y + q.h - 3; y++) if (Math.abs(y + .5 - q.cy) > 1.2 && ctLibre(q, x, y, 2) && prend(x, y, 1, 1, 3)) q.meubles.push({ k: 'memoire', x, y, nx: (x - q.x) % 2 ? 1 : -1, ny: 0, v: R() });
  } else if (q.role === 'chaudieres') {
    const n = Math.max(2, Math.min(4, Math.floor(((hor ? q.w : q.h) - 4) / 4)));
    for (let k = 0; k < n; k++) {
      const u = (k + .5) / n, x0 = hor ? Math.round(q.x + 2 + u * (q.w - 4)) - 1 : cx - 1, y0 = hor ? cy - 1 : Math.round(q.y + 2 + u * (q.h - 4)) - 1;
      if (prend(x0, y0, 2, 2, 3, 2)) G.push({ k: 'chaudiere', x: x0 + 1, y: y0 + 1, ph: R() * 6 });
    }
  } else if (q.role === 'convoyeurs') {
    const L = [];
    for (const dd of [-2, 1]) {
      const cells = [];
      if (hor) { const y = cy + dd; for (let x = q.x + 2; x < q.x + q.w - 2; x++) if (ctLibre(q, x, y, 1)) cells.push([x, y]); else break; }
      else { const x = cx + dd; for (let y = q.y + 2; y < q.y + q.h - 2; y++) if (ctLibre(q, x, y, 1)) cells.push([x, y]); else break; }
      if (cells.length < 4) continue;
      for (const [x, y] of cells) ctBloc(x, y, 1);
      const sens = dd < 0 ? 1 : -1, [ax, ay] = cells[0], [bx, by] = cells[cells.length - 1];
      L.push({ k: 'tapis', hor, sens, x: (ax + bx + 1) / 2, y: (ay + by + 1) / 2, x0: ax, y0: ay, x1: bx + 1, y1: by + 1, v: 1.1 });
    }
    for (const T of L) { G.push(T); G.push({ k: 'presse', x: T.hor ? Math.round(T.x) + .5 : T.x, y: T.hor ? T.y : Math.round(T.y) + .5, hor: T.hor, ph: R() * 3 }); }
  } else if (q.role === 'generateur') {
    if (hor ? prend(cx - 1, cy - 1, 3, 2, 2, 1) : prend(cx - 1, cy - 1, 2, 3, 2, 1)) G.push({ k: 'dynamo', x: hor ? cx + .5 : cx, y: hor ? cy : cy + .5, hor });
    const coins = [[q.x + 2, q.y + 2], [q.x + q.w - 3, q.y + q.h - 3], [q.x + q.w - 3, q.y + 2], [q.x + 2, q.y + q.h - 3]];
    for (const [x, y] of coins) if (G.filter(o => o.k === 'tesla').length < 2 && prend(x, y, 1, 1, 1, 2)) G.push({ k: 'tesla', x: x + .5, y: y + .5 });
  } else if (q.role === 'garde') G.push({ k: 'arene', x: q.cx, y: q.cy, r: Math.min(q.w, q.h) / 2 - 1.6 });
  // de quoi se mettre à couvert : des barricades d'acier chez les tourelles, des caisses ailleurs, des cristaux sur leurs socles
  if (q.role === 'tourelles' || q.role === 'araignees' || q.role === 'grenier' || q.role === 'cristaux' || q.role === 'escalier') {
    const n = q.w * q.h > 110 ? 3 : 2;
    for (let k = 0, f = 0; k < 40 && f < n; k++) {
      const hz = R() < .5, w = hz ? 2 : 1, h = hz ? 1 : 2, x0 = q.x + 2 + (R() * (q.w - 4 - w) | 0), y0 = q.y + 2 + (R() * (q.h - 4 - h) | 0);
      if (Math.abs(x0 + w / 2 - q.cx) < 2 && Math.abs(y0 + h / 2 - q.cy) < 2) continue;
      if (!libreZone(x0 - 1, y0 - 1, w + 2, h + 2, 1) || !prend(x0, y0, w, h, 1, 1)) continue;
      G.push({ k: q.role === 'tourelles' ? 'barricade' : q.role === 'cristaux' ? 'socle' : 'caisses2', x0, y0, w, h, x: x0 + w / 2, y: y0 + h / 2, v: R() }); f++;
    }
  }
}

// ============================================================
//  LES OS DU DÉCOR
//  d(a, b, w, h, c, lum, ref, fin) : un os du monde ; ref, le plan d'une roue ; fin, un détail (vu de près).
// ============================================================
const ctS = (a, b, w, h, c, lum, ref, f) => DJ.statique.push({ a, b, w, h, c, lum: !!lum, ref, f: f ? 1 : 0 });
// une boîte droite, en coordonnées du monde
function ctCub(d, x0, x1, y0, y1, z0, z1, c, lum, f) { d([(x0 + x1) / 2, (y0 + y1) / 2, z0], [(x0 + x1) / 2, (y0 + y1) / 2, z1], Math.abs(y1 - y0), Math.abs(x1 - x0), c, lum, undefined, f); }
// le repère d'une case contre un mur : f vers la salle (-0,5 : le mur ; 0,5 : la face), l en travers, z au-dessus du sol
function ctRep(d, x, y, nx, ny) {
  const cx = x + .5, cy = y + .5, tx = -ny, ty = nx, Z0 = DJ_Z0;
  return (f0, f1, l0, l1, z0, z1, c, lum, fin) => {
    const xa = cx + nx * f0 + tx * l0, xb = cx + nx * f1 + tx * l1, ya = cy + ny * f0 + ty * l0, yb = cy + ny * f1 + ty * l1;
    ctCub(d, Math.min(xa, xb), Math.max(xa, xb), Math.min(ya, yb), Math.max(ya, yb), Z0 + z0, Z0 + z1, c, lum, fin);
  };
}
const ctPt = (x, y, nx, ny) => (f, l, z) => [x + .5 + nx * f - ny * l, y + .5 + ny * f + nx * l, DJ_Z0 + z];
const ctMix = (c, k) => c.map(v => Math.max(0, Math.min(255, v * k | 0)));
// Une roue dentée (ou un volant, n = 0) : centre C, plan (U, V), normale N ; a0, l'angle.
function ctRoue(d, C, U, V, N, r, n, ep, a0, col, rayons = 0) {
  const pt = (a, rr) => [C[0] + (U[0] * Math.cos(a) + V[0] * Math.sin(a)) * rr, C[1] + (U[1] * Math.cos(a) + V[1] * Math.sin(a)) * rr, C[2] + (U[2] * Math.cos(a) + V[2] * Math.sin(a)) * rr];
  const m = Math.max(8, Math.round(r * 5)), wr = Math.max(.08, r * .15), sombre = ctMix(col, .72);
  for (let k = 0; k < m; k++) { const a = a0 + k / m * 6.2832, b = a0 + (k + 1) / m * 6.2832; d(pt(a, r * .86), pt(b, r * .86), wr, ep, col, 0, N); }
  if (n) { const wt = Math.min(.55, 6.2832 * r / n * .42); for (let k = 0; k < n; k++) { const a = a0 + k / n * 6.2832; d(pt(a, r * .9), pt(a, r * 1.07), wt, ep * .9, col, 0, N); } }
  const ns = rayons || (r > 1.6 ? 6 : 4);
  for (let k = 0; k < ns; k++) { const a = a0 + (k + .5) / ns * 6.2832; d(pt(a, r * .18), pt(a, r * .8), Math.max(.06, r * .11), ep * .7, sombre, 0, N); }
  d([C[0] - N[0] * ep * .8, C[1] - N[1] * ep * .8, C[2] - N[2] * ep * .8], [C[0] + N[0] * ep * .8, C[1] + N[1] * ep * .8, C[2] + N[2] * ep * .8], r * .3, r * .3, ctMix(col, 1.15), 0, U);
}
// le plan d'un mur : sa normale, et ses deux axes
const ctPlan = (nx, ny) => nx ? { U: [0, 1, 0], V: [0, 0, 1], N: [1, 0, 0] } : { U: [1, 0, 0], V: [0, 0, 1], N: [0, 1, 0] };

// ---------- le mobilier contre les murs ----------
function ctMeuble(d, m) {
  const B = ctRep(d, m.x, m.y, m.nx, m.ny), P = ctPt(m.x, m.y, m.nx, m.ny), v = m.v, k = m.k;
  const voyants = (f, z, l0, l1, n) => { const pts = []; for (let i = 0; i < n; i++) { const l = l0 + (l1 - l0) * (i + .5) / n; pts.push(P(f, l, z)); B(f - .01, f + .02, l - .03, l + .03, z - .03, z + .03, CTC.noir, 0, 1); }
    CT.anim.push({ k: 'voyants', x: m.x + .5, y: m.y + .5, pts, ph: v * 9 }); };
  if (k === 'armoire') {
    const col = [CTC.olive, CTC.bleu, CTC.rouille, CTC.fer2][v * 4 | 0];
    B(-.52, .52, -.52, .52, 0, 3.02, col); B(-.54, .56, -.54, .54, 3.02, 3.14, ctMix(col, .6));
    B(.52, .545, -.012, .012, .08, 2.9, CTC.noir, 0, 1);
    for (const s of [-1, 1]) B(.53, .6, s * .07 - .025, s * .07 + .025, 1.3, 1.65, CTC.laiton, 0, 1);
    for (let i = 0; i < 3; i++) B(.52, .55, -.34, .34, 2.4 + i * .12, 2.45 + i * .12, CTC.noir, 0, 1);
    B(.52, .56, -.17, .17, 2.05, 2.2, CTC.creme, 0, 1);
    if (v > .45) voyants(.55, 2.82, .18, .42, 2);
  } else if (k === 'casier') {
    const col = v < .5 ? [64, 86, 82] : [94, 100, 112];
    B(-.52, .52, -.52, .52, 0, 3.02, col); B(-.54, .56, -.54, .54, 3.02, 3.12, ctMix(col, .6));
    B(.52, .545, -.012, .012, .05, 2.95, CTC.noir, 0, 1);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) B(.52, .55, s * .4, s * .12, 2.3 + i * .1, 2.34 + i * .1, CTC.noir, 0, 1);
      B(.52, .59, s * .1, s * .06, 1.3, 1.6, CTC.laiton, 0, 1); B(.52, .55, s * .38, s * .18, 1.9, 2.02, CTC.creme, 0, 1);
    }
  } else if (k === 'etagere') {
    B(-.52, .52, -.52, .52, 0, 1.02, CTC.fer);
    for (let i = 0; i < 2; i++) { B(.52, .55, -.46, .46, .12 + i * .45, .5 + i * .45, CTC.fer2, 0, 1); B(.53, .6, -.08, .08, .28 + i * .45, .34 + i * .45, CTC.laiton, 0, 1); }
    B(-.52, -.44, -.5, .5, 1.02, 3.0, CTC.ombre);
    for (const s of [-1, 1]) B(-.5, .5, s * .47, s * .53, 1.02, 3.0, CTC.fer2);
    for (const z of [1.7, 2.38, 2.98]) B(-.5, .5, -.5, .5, z, z + .05, CTC.fer2);
    for (const [z0, i] of [[1.02, 0], [1.75, 1], [2.43, 2]]) {   // ce qui s'y range : des caisses, des bocaux, des pièces
      const r = ctH(m.x, m.y, i), r2 = ctH(m.x, m.y, i + 7);
      if (r < .4) { B(-.4, .32, -.45, -.05, z0, z0 + .5, r2 < .5 ? CTC.bois : CTC.creme); B(-.36, .3, .05, .44, z0, z0 + .36, CTC.bois); }
      else if (r < .7) for (let j = 0; j < 4; j++) B(-.1, .1, -.4 + j * .22, -.26 + j * .22, z0, z0 + .32 + (j & 1) * .08, [[90, 160, 150], [150, 170, 90], [120, 100, 160]][(j + i) % 3], j === 1 && r2 > .6, 1);
      else { B(-.3, .3, -.35, .1, z0, z0 + .14, CTC.acier); B(-.2, .25, .15, .42, z0, z0 + .42, CTC.fer2); }
    }
  } else if (k === 'etabli') {
    B(-.52, .52, -.52, .52, 0, .96, [98, 74, 52]); B(-.54, .58, -.54, .54, .96, 1.04, [126, 98, 70]);
    for (let i = 0; i < 2; i++) { B(.52, .55, -.46, .46, .14 + i * .4, .48 + i * .4, [84, 62, 44], 0, 1); B(.53, .6, -.06, .06, .3 + i * .4, .35 + i * .4, CTC.laiton, 0, 1); }
    B(.2, .46, .24, .42, 1.04, 1.2, CTC.fer); B(.46, .52, .29, .37, 1.08, 1.15, CTC.acier, 0, 1);
    B(-.1, .22, -.22, -.18, 1.04, 1.07, CTC.bois, 0, 1); B(.18, .25, -.28, -.12, 1.04, 1.11, CTC.fer, 0, 1);
    B(-.3, -.05, .02, .2, 1.04, 1.07, CTC.laiton, 0, 1);
    B(-.46, -.4, -.4, -.34, 1.04, 1.85, CTC.fer); B(-.42, -.08, -.42, -.32, 1.78, 1.88, CTC.fer2); B(-.2, -.1, -.4, -.34, 1.71, 1.78, CTL.ambre, 1);
    B(-.52, -.47, -.48, .48, 1.35, 2.5, [134, 106, 72], 0, 1);
    for (let i = 0; i < 4; i++) B(-.47, -.44, -.36 + i * .22, -.28 + i * .22, 1.6 + (i & 1) * .2, 2.2, CTC.noir, 0, 1);
  } else if (k === 'console') {
    B(-.52, .52, -.52, .52, 0, 1.02, [168, 164, 148]);
    B(-.1, .54, -.5, .5, 1.02, 1.08, [56, 60, 70]); B(-.52, -.1, -.5, .5, 1.02, 1.85, [150, 146, 132]); B(-.54, -.06, -.52, .52, 1.85, 1.92, CTC.ombre);
    B(-.1, -.07, -.38, .38, 1.18, 1.66, [18, 38, 34]);
    for (const z of [1.3, 1.42, 1.54]) B(-.07, -.055, -.32, -.32 + .5 * ctH(m.x, m.y, z * 10), z, z + .03, CTL.vert, 1, 1);
    for (let i = 0; i < 6; i++) B(.1 + (i % 3) * .13, .16 + (i % 3) * .13, -.36 + (i >> 1) * .24, -.3 + (i >> 1) * .24, 1.08, 1.12, [CTL.rouge, CTL.ambre, CTL.vert][i % 3], (i + (v * 9 | 0)) % 2, 1);
    for (const s of [-1, 1]) B(.3, .4, s * .3 - .05, s * .3 + .05, 1.08, 1.2, CTC.noir, 0, 1);
  } else if (k === 'bande' || k === 'memoire') {
    const col = v < .6 ? [184, 176, 152] : [150, 160, 170];
    B(-.52, .52, -.52, .52, 0, 3.02, col); B(-.54, .56, -.54, .54, 3.02, 3.12, CTC.ombre);
    B(.52, .54, -.44, .44, 1.55, 2.55, [28, 32, 38]);
    const c = P(.56, 0, 2.05), n = [m.nx, m.ny, 0];
    for (const s of [-1, 1]) { const C = P(.56, s * .21, 2.05); ctRoue(d, C, m.nx ? [0, 1, 0] : [1, 0, 0], [0, 0, 1], n, .17, 0, .03, 0, [70, 74, 84], 3); }
    CT.anim.push({ k: 'bobines', x: m.x + .5, y: m.y + .5, c, n, nx: m.nx, ny: m.ny, ph: v * 20 });
    voyants(.54, 1.32, -.38, .38, 6);
    B(.52, .55, -.4, .4, .5, .56, CTC.noir, 0, 1); B(.52, .55, -.4, .4, .8, .86, CTC.noir, 0, 1);
  } else if (k === 'condo') {
    B(-.52, .52, -.52, .52, 0, 1.02, CTC.fer); B(-.54, .54, -.54, .54, .82, .9, CTC.cuivre);
    for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) B(a * .3 - .03, a * .3 + .03, b * .3 - .03, b * .3 + .03, 1.02, 2.62, CTC.acier);
    B(-.11, .11, -.11, .11, 1.06, 2.58, CTL.cyan, 1);
    B(-.36, .36, -.36, .36, 2.62, 2.78, CTC.fer2); B(-.08, .08, -.08, .08, 2.78, 3.3, CTC.cuivre); B(-.2, .2, -.2, .2, 3.3, 3.38, CTC.acier);
    for (let i = 0; i < 3; i++) B(-.34, .34, -.34, .34, 1.4 + i * .4, 1.44 + i * .4, CTC.cuivre, 0, 1);
  } else if (k === 'caisses' || k === 'munitions') {
    const mun = k === 'munitions', col = mun ? CTC.olive : v < .5 ? CTC.bois : [128, 112, 84];
    B(-.52, .52, -.52, .52, 0, 1.02, col);
    for (const z of [.04, .94]) B(.52, .54, -.52, .52, z, z + .06, ctMix(col, .7), 0, 1);
    B(.52, .54, -.52, .52, .47, .53, ctMix(col, .7), 0, 1);
    if (mun) { B(.52, .55, -.22, .22, .6, .78, CTC.jaune, 0, 1); for (let i = 0; i < 4; i++) B(-.3 + i * .18, -.22 + i * .18, -.1, -.02, 1.02, 1.32, CTC.laiton, 0, 1); }
    else if (v > .6) B(-.4, .38, -.42, .4, 1.02, 1.5, ctMix(col, 1.15));
  } else if (k === 'citerne') {
    const col = v < .5 ? [156, 62, 48] : [72, 104, 92];
    B(-.5, .5, -.5, .5, 0, 2.02, col); B(-.38, .38, -.38, .38, 2.02, 2.16, CTC.fer2); B(-.08, .08, -.08, .08, 2.16, 2.5, CTC.fer);
    for (const z of [.25, 1.0, 1.7]) B(-.53, .53, -.53, .53, z, z + .07, CTC.fer, 0, 1);
    B(.5, .57, -.13, .13, 1.32, 1.36, CTC.jaune, 0, 1); B(.5, .57, -.02, .02, 1.2, 1.48, CTC.jaune, 0, 1);
    B(.5, .53, -.26, .26, .45, .75, CTC.jaune, 0, 1); for (let i = 0; i < 3; i++) B(.53, .54, -.22 + i * .17, -.16 + i * .17, .45, .75, CTC.noir, 0, 1);
  } else if (k === 'charbon') {
    B(-.52, .52, -.52, .52, 0, .9, CTC.fer); B(-.45, .45, -.45, .45, .9, 1.04, [26, 24, 26]); B(-.3, .26, -.32, .3, 1.04, 1.18, [32, 30, 32]);
    for (let i = 0; i < 3; i++) B(-.25 + i * .2, -.19 + i * .2, -.2 + i * .15, -.14 + i * .15, 1.04, 1.1 + (i & 1) * .1, CTL.feu, 1, 1);
    B(.36, .42, .3, .36, .5, 1.5, CTC.bois, 0, 1);
  } else if (k === 'lingots') {
    B(-.52, .52, -.52, .52, 0, .9, CTC.bois); B(-.52, .52, -.52, .52, .9, 1.02, ctMix(CTC.bois, .7));
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const z = 1.02 + j * .11, a = -.36 + i * .27;
      if (j % 2) B(-.4, .4, a - .1, a + .1, z, z + .1, j === 2 ? CTC.laiton : CTC.cuivre); else B(a - .1, a + .1, -.4, .4, z, z + .1, CTC.cuivre); }
  } else if (k === 'statue') {
    B(-.52, .52, -.52, .52, 0, 1.02, CTC.fer); B(.52, .55, -.25, .25, .5, .7, CTC.laiton, 0, 1);
    const br = CTC.bronze, sb = ctMix(br, .75);
    for (const s of [-1, 1]) { B(-.12, .12, s * .1, s * .26, 1.02, 1.95, sb); B(-.1, .2, s * .1, s * .28, 1.02, 1.12, br); }
    B(-.2, .2, -.32, .32, 1.95, 2.95, br); B(-.16, .18, -.24, .24, 2.15, 2.6, sb);
    B(-.14, .16, -.15, .15, 2.95, 3.35, br); B(.16, .18, -.1, .1, 3.1, 3.18, CTL.rouge, 1);
    for (const s of [-1, 1]) { B(-.18, .18, s * .32, s * .52, 2.6, 2.98, sb); B(-.08, .14, s * .36, s * .5, 1.9, 2.6, br); B(-.1, .2, s * .34, s * .52, 1.62, 1.92, sb); }
  } else if (k === 'tableau') {
    B(-.5, -.34, -.4, .4, 1.0, 2.25, [124, 128, 116]); B(-.34, -.33, -.01, .01, 1.05, 2.2, CTC.noir, 0, 1);
    B(-.5, -.4, -.06, .06, 2.25, 3.6, CTC.noir); B(-.34, -.32, -.32, -.1, 1.9, 2.1, CTC.jaune, 0, 1);
    voyants(-.32, 1.25, -.3, .3, 4);
    for (const s of [-1, 1]) B(-.33, -.27, s * .2 - .03, s * .2 + .03, 1.55, 1.75, CTC.laiton, 0, 1);
  } else if (k === 'vanne') {
    B(-.5, -.34, -.09, .09, 0, 3.6, v < .5 ? CTC.cuivre : CTC.fer2);
    for (const z of [.5, 1.8, 3.1]) B(-.5, -.3, -.13, .13, z, z + .08, CTC.fer, 0, 1);
    const C = P(-.22, 0, 1.4); ctRoue(d, C, m.nx ? [0, 1, 0] : [1, 0, 0], [0, 0, 1], [m.nx, m.ny, 0], .2, 0, .04, v * 3, CTC.rouge, 4);
    B(-.34, -.22, -.04, .04, 1.36, 1.44, CTC.fer, 0, 1);
    B(-.36, -.3, .14, .36, 2.1, 2.32, CTC.creme, 0, 1); B(-.3, -.29, .24, .26, 2.13, 2.28, CTC.noir, 0, 1);
    CT.emet.push({ k: 'vapeur', x: P(-.3, 0, 0)[0], y: P(-.3, 0, 0)[1], z: DJ_Z0 + 3.4, ph: v * 7, per: 5 + v * 6 });
  } else if (k === 'outils') {
    B(-.52, -.47, -.48, .48, 1.1, 2.4, [134, 106, 72]);
    for (let i = 0; i < 5; i++) B(-.47, -.44, -.38 + i * .19, -.32 + i * .19, 1.4 + (i % 3) * .12, 2.15 - (i % 2) * .15, i % 2 ? CTC.acier : CTC.noir, 0, 1);
    B(-.47, -.43, -.3, .3, 1.15, 1.22, CTC.fer, 0, 1);
  } else if (k === 'dock') {
    B(-.52, -.38, -.46, .46, 0, 1.7, CTC.fer2); B(-.38, -.36, -.36, .36, .1, 1.5, CTC.ombre);
    B(-.36, .4, -.36, .36, .004, .025, [52, 90, 70]);
    for (const s of [-1, 1]) B(-.36, .4, s * .36 - .02, s * .36 + .02, .025, .045, CTL.vert, 1, 1);
    B(-.46, -.18, -.12, .12, 1.48, 1.62, CTC.cuivre); B(-.2, -.16, -.03, .03, 1.2, 1.5, CTC.cuivre, 0, 1);
    voyants(-.36, 1.6, -.25, .25, 3);
  } else if (k === 'banniere') {
    B(-.5, -.47, -.36, .36, 1.1, 3.5, CTC.rouge); B(-.5, -.45, -.4, .4, 3.5, 3.58, CTC.laiton);
    B(-.47, -.46, -.12, .12, 2.3, 2.9, CTC.laiton); B(-.47, -.46, -.03, .03, 1.5, 2.3, CTC.laiton, 0, 1);
    for (let i = 0; i < 3; i++) B(-.5, -.47, -.36 + i * .27, -.18 + i * .27, .95, 1.1, CTC.rouge, 0, 1);
  }
}

// ---------- les grandes pièces ----------
function ctGrand(d, g, q) {
  const Z0 = DJ_Z0, x = g.x, y = g.y, C = (x0, x1, y0, y1, z0, z1, c, lum, f) => ctCub(d, x0, x1, y0, y1, Z0 + z0, Z0 + z1, c, lum, f);
  const R45 = [.7071, .7071, 0];
  switch (g.k) {
    case 'pilier':
      C(x - .02, x + 1.02, y - .02, y + 1.02, 0, 2.02, CTC.fer2); C(x - .06, x + 1.06, y - .06, y + 1.06, 1.55, 1.75, CTC.jaune, 0, 1);
      for (let i = 0; i < 2; i++) C(x - .07, x + 1.07, y + .2 + i * .4, y + .35 + i * .4, 1.55, 1.75, CTC.noir, 0, 1);
      C(x - .08, x + 1.08, y - .08, y + 1.08, 2.02, 2.14, CTC.fer); break;
    case 'volant': {
      const hor = g.hor, zc = 3.7, ax = hor ? 0 : 1;
      if (hor) { C(x - 2.02, x + 2.02, y - 1.02, y + 1.02, 0, 2.02, CTC.fer); C(x - 1.9, x + 1.9, y - .32, y + .32, 2.02, 2.05, CTC.noir); }
      else { C(x - 1.02, x + 1.02, y - 2.02, y + 2.02, 0, 2.02, CTC.fer); C(x - .32, x + .32, y - 1.9, y + 1.9, 2.02, 2.05, CTC.noir); }
      for (const s of [-1, 1]) {                                   // les paliers, l'arbre
        const bx = x + (ax ? s * .75 : 0), by = y + (ax ? 0 : s * .75);
        C(bx - .3, bx + .3, by - .3, by + .3, 2.02, zc + .25, CTC.fer2); C(bx - .36, bx + .36, by - .36, by + .36, zc + .25, zc + .45, CTC.laiton);
      }
      d(ax ? [x - 1.15, y, Z0 + zc] : [x, y - 1.15, Z0 + zc], ax ? [x + 1.15, y, Z0 + zc] : [x, y + 1.15, Z0 + zc], .3, .3, CTC.acier);
      for (const s of [-1, 1]) {                                   // la bande peinte autour du bâti
        if (hor) C(x - 2.25, x + 2.25, y + s * 1.25 - .1, y + s * 1.25 + .1, 0, .02, CTC.jaune); else C(x + s * 1.25 - .1, x + s * 1.25 + .1, y - 2.25, y + 2.25, 0, .02, CTC.jaune);
      }
      const rx = hor ? x + 1.5 : x + .7, ry = hor ? y + .7 : y + 1.5;   // le régulateur à boules
      C(rx - .2, rx + .2, ry - .2, ry + .2, 2.02, 2.3, CTC.laiton); d([rx, ry, Z0 + 2.3], [rx, ry, Z0 + 4.1], .08, .08, CTC.acier);
      const pl = hor ? { U: [1, 0, 0], V: [0, 0, 1], N: [0, 1, 0] } : { U: [0, 1, 0], V: [0, 0, 1], N: [1, 0, 0] };
      CT.anim.push({ k: 'volant', x, y, C: [x, y, Z0 + zc], pl, r: 3.3, rx, ry });
      break; }
    case 'piston':
      C(x - 1.02, x + 1.02, y - 1.02, y + 1.02, 0, 1.02, CTC.fer); C(x - .65, x + .65, y - .65, y + .65, 1.02, 3.4, CTC.fer2);
      for (const z of [1.4, 2.2, 3.0]) C(x - .7, x + .7, y - .7, y + .7, z, z + .08, CTC.laiton, 0, 1);
      C(x - .76, x + .76, y - .76, y + .76, 3.4, 3.56, CTC.fer);
      for (const s of [-1, 1]) C(x + s * .82 - .07, x + s * .82 + .07, y - .07, y + .07, 1.02, 6.5, CTC.acier);
      C(x - .95, x + .95, y - .12, y + .12, 6.5, 6.7, CTC.fer);
      CT.anim.push({ k: 'piston', x, y, ph: g.ph });
      CT.emet.push({ k: 'vapeur', x: x + .7, y: y + .7, z: Z0 + 1.2, ph: g.ph, per: 2.6, grand: 1 });
      break;
    case 'colosse': {
      const dx = q.cx - x, dy = q.cy - y, nx = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0, ny = nx ? 0 : Math.sign(dy) || 1;
      C(x - 1.02, x + 1.02, y - 1.02, y + 1.02, 0, 1.02, CTC.fer); C(x - 1.12, x + 1.12, y - 1.12, y + 1.12, 1.02, 1.18, CTC.fer2);
      const F = (f0, f1, l0, l1, z0, z1, c, lum) => { const xa = x + nx * f0 - ny * l0, xb = x + nx * f1 - ny * l1, ya = y + ny * f0 + nx * l0, yb = y + ny * f1 + nx * l1;
        ctCub(d, Math.min(xa, xb), Math.max(xa, xb), Math.min(ya, yb), Math.max(ya, yb), Z0 + z0, Z0 + z1, c, lum); };
      F(1.02, 1.06, -.4, .4, .3, .75, CTC.laiton);
      const br = [112, 92, 70], sb = ctMix(br, .7);
      for (const s of [-1, 1]) {
        F(-.35, .6, s * .38 - .28, s * .38 + .28, 1.18, 1.5, sb); F(-.25, .25, s * .38 - .22, s * .38 + .22, 1.5, 3.0, br);
        F(-.3, .34, s * .38 - .27, s * .38 + .27, 2.9, 3.28, sb); F(-.26, .26, s * .38 - .24, s * .38 + .24, 3.2, 4.3, br);
        F(-.42, .42, s * .78, s * 1.2, 6.0, 6.6, sb); F(-.2, .2, s * .86, s * 1.12, 4.8, 6.05, br);
        F(-.2, .28, s * .86, s * 1.12, 3.85, 4.85, br); F(-.3, .36, s * .82, s * 1.16, 3.3, 3.9, sb);
      }
      F(-.38, .38, -.68, .68, 4.2, 4.62, sb); F(-.46, .46, -.78, .78, 4.6, 6.4, br); F(.46, .53, -.56, .56, 5.0, 6.1, sb);
      F(.53, .57, -.16, .16, 5.38, 5.8, CTL.ambre, 1);
      F(-.15, .15, -.2, .2, 6.4, 6.62, sb); F(-.36, .36, -.38, .38, 6.62, 7.42, br); F(.36, .39, -.28, .28, 6.9, 7.04, CTL.rouge, 1);
      F(-.3, .12, -.06, .06, 7.42, 7.85, sb);
      break; }
    case 'four': {
      const y0 = q.y;
      C(x - 1.02, x + 1.02, y0 - .02, y0 + 1.02, 0, 3.02, CTC.brique);
      for (const z of [.9, 2.4]) C(x - 1.05, x + 1.05, y0, y0 + 1.05, z, z + .1, CTC.fer, 0, 1);
      C(x - .55, x + .55, y0 + 1.02, y0 + 1.05, .35, 1.35, CTC.noir); C(x - .45, x + .45, y0 + 1.03, y0 + 1.07, .42, 1.25, CTL.feu, 1);
      C(x - 1.15, x + 1.15, y0 - .02, y0 + 1.3, 3.02, 3.3, CTC.fer); C(x - .35, x + .35, y0 + .1, y0 + .8, 3.3, q.haut, CTC.fer2);
      for (const z of [4.4, 5.6]) C(x - .4, x + .4, y0 + .05, y0 + .85, z, z + .1, CTC.fer, 0, 1);
      CT.emet.push({ k: 'etincelles', x, y: y0 + 1.15, z: Z0 + .8, ph: x, per: .7 });
      break; }
    case 'pont':
      C(q.x - .3, q.x + q.w + .3, y - .14, y + .14, 5.3, 5.55, CTC.fer); C(q.x - .3, q.x + q.w + .3, y - .3, y + .3, 5.55, 5.63, CTC.fer2);
      CT.anim.push({ k: 'creuset', x: q.cx, y, x0: g.x0, x1: g.x1 });
      break;
    case 'moule':
      C(x - .52, x + .52, y - .52, y + .52, 0, 1.02, CTC.fer); C(x - .4, x + .4, y - .4, y + .4, 1.02, 1.045, g.chaud ? CTL.feu : [44, 34, 32], g.chaud);
      break;
    case 'colonne': {
      C(x - 1.2, x + 1.2, y - 1.2, y + 1.2, 0, .6, CTC.fer); C(x - 1.26, x + 1.26, y - 1.26, y + 1.26, .6, .7, CTC.laiton);
      for (const z of [3.6, 7.6]) C(x - 1.08, x + 1.08, y - 1.08, y + 1.08, z, z + .22, CTC.laiton);
      C(x - 1.25, x + 1.25, y - 1.25, y + 1.25, q.haut - .7, q.haut - .3, CTC.laiton);
      const sx = Math.sign(q.cx - x), sy = Math.sign(q.cy - y);   // une lanterne, tournée vers le milieu
      C(x + sx * 1.02 - .1, x + sx * 1.02 + .1, y - .1, y + .1, 3.2, 3.5, CTC.fer); C(x + sx * 1.2 - .14, x + sx * 1.2 + .14, y - .14, y + .14, 2.8, 3.25, CTL.or, 1);
      C(x - .1, x + .1, y + sy * 1.02 - .1, y + sy * 1.02 + .1, 6.2, 6.5, CTC.fer); C(x - .14, x + .14, y + sy * 1.2 - .14, y + sy * 1.2 + .14, 5.8, 6.25, CTL.or, 1);
      break; }
    case 'cadran': ctCadran(d, q, g); break;
    case 'table': {
      C(x - 1.02, x + 1.02, y - .52, y + .52, 0, .98, [110, 84, 58]); C(x - 1.06, x + 1.06, y - .56, y + .56, .98, 1.06, [132, 102, 72]);
      const m = [134, 122, 104];                                   // un automate démonté, à plat
      C(x - .6, x + .1, y - .26, y + .26, 1.06, 1.36, m); C(x - .5, x, y - .2, y + .2, 1.36, 1.4, CTC.fer2, 0, 1);
      C(x + .15, x + .45, y - .17, y + .17, 1.06, 1.34, m); C(x + .45, x + .47, y - .1, y + .1, 1.18, 1.24, [120, 90, 60], 1, 1);
      C(x - .95, x - .62, y + .12, y + .3, 1.06, 1.18, m); C(x - .9, x - .66, y - .34, y - .16, 1.06, 1.16, ctMix(m, .8));
      ctRoue(d, [x + .7, y + .25, Z0 + 1.08], [1, 0, 0], [0, 1, 0], [0, 0, 1], .16, 8, .04, 0, CTC.laiton, 4);
      C(x + .62, x + .9, y - .35, y - .3, 1.06, 1.09, CTC.acier, 0, 1);
      d([x, y, Z0 + q.haut], [x, y, Z0 + 2.75], .04, .04, CTC.noir); C(x - .32, x + .32, y - .32, y + .32, 2.55, 2.75, CTC.fer); C(x - .16, x + .16, y - .16, y + .16, 2.45, 2.55, CTL.ambre, 1);
      CT.anim.push({ k: 'bras', x: x + .9, y: y + .4, ph: g.v * 6 });
      break; }
    case 'rails': {
      const n = g.hor ? g.x1 - g.x0 : g.y1 - g.y0;
      for (const s of [-1, 1]) {
        if (g.hor) C(g.x0, g.x1, g.y + s * .42 - .04, g.y + s * .42 + .04, 0, .07, CTC.acier); else C(g.x + s * .42 - .04, g.x + s * .42 + .04, g.y0, g.y1, 0, .07, CTC.acier);
      }
      for (let k = 0; k < n / .7; k++) { const u = (g.hor ? g.x0 : g.y0) + .35 + k * .7;
        if (g.hor) C(u - .1, u + .1, g.y - .6, g.y + .6, 0, .035, [70, 52, 40], 0, 1); else C(g.x - .6, g.x + .6, u - .1, u + .1, 0, .035, [70, 52, 40], 0, 1); }
      break; }
    case 'wagon':
      C(x - .9, x + .9, y - .9, y + .9, 0, .28, CTC.noir); C(x - 1.02, x + 1.02, y - 1.02, y + 1.02, .28, 1.02, CTC.rouille);
      for (const z of [.4, .9]) C(x - 1.05, x + 1.05, y - 1.05, y + 1.05, z, z + .06, CTC.fer, 0, 1);
      C(x - .85, x + .85, y - .85, y + .85, 1.02, 1.2, [66, 62, 60]); C(x - .5, x + .4, y - .4, y + .45, 1.2, 1.36, [74, 70, 66]);
      for (let k = 0; k < 4; k++) C(x - .4 + (k % 2) * .5, x - .28 + (k % 2) * .5, y - .3 + (k >> 1) * .45, y - .18 + (k >> 1) * .45, 1.2, 1.42, CTL.cyan, 1, 1);
      break;
    case 'pile':
      C(x - 1.02, x + 1.02, y - .52, y + .52, 0, 1.02, CTC.bois);
      C(x - 1.02, x - .02, y - .52, y + .52, 1.02, 2.02, g.v < .5 ? [128, 112, 84] : CTC.bois); C(x + .02, x + 1.02, y - .52, y + .52, 1.02, 2.02, g.v < .5 ? CTC.bois : CTC.olive);
      for (const z of [.5, 1.5]) C(x - 1.04, x + 1.04, y - .54, y + .54, z - .03, z + .03, ctMix(CTC.bois, .7), 0, 1);
      break;
    case 'chaudiere': {
      const col = [84, 56, 48];
      C(x - 1.02, x + 1.02, y - 1.02, y + 1.02, 0, 3.02, col); d([x, y, Z0], [x, y, Z0 + 3.02], 2.15, 2.15, ctMix(col, .9), 0, R45);
      for (const z of [.55, 1.6, 2.6]) { C(x - 1.06, x + 1.06, y - 1.06, y + 1.06, z, z + .1, CTC.fer, 0, 1); }
      C(x - .85, x + .85, y - .85, y + .85, 3.02, 3.3, CTC.fer); C(x - .3, x + .3, y - .3, y + .3, 3.3, q.haut, CTC.fer2);
      C(x - .5, x + .5, y + 1.02, y + 1.06, .3, 1.15, CTC.noir); C(x - .4, x + .4, y + 1.04, y + 1.08, .38, 1.05, CTL.feu, 1);
      C(x - .5, x + .5, y - 1.06, y - 1.02, .3, 1.15, CTC.noir); C(x - .4, x + .4, y - 1.08, y - 1.04, .38, 1.05, CTL.feu, 1);
      C(x + .3, x + .66, y + 1.02, y + 1.06, 2.0, 2.36, CTC.creme, 0, 1); C(x + .46, x + .5, y + 1.06, y + 1.07, 2.06, 2.3, CTC.noir, 0, 1);
      C(x + .55, x + .7, y + .55, y + .7, 3.3, 3.7, CTC.laiton);
      CT.emet.push({ k: 'vapeur', x: x + .62, y: y + .62, z: Z0 + 3.75, ph: g.ph, per: 3.5 + g.ph % 2 });
      CT.emet.push({ k: 'etincelles', x, y: y + 1.12, z: Z0 + .7, ph: g.ph, per: 1.1 });
      break; }
    case 'tapis': {
      const H = g.hor;
      if (H) { C(g.x0 - .02, g.x1 + .02, g.y0 - .02, g.y0 + 1.02, 0, .95, CTC.fer); C(g.x0, g.x1, g.y0 + .08, g.y0 + .92, .95, 1.02, CTC.gomme);
        for (const s of [0, 1]) C(g.x0 - .02, g.x1 + .02, g.y0 + s * .96 - .04, g.y0 + s * .96 + .08, .95, 1.12, CTC.jaune); }
      else { C(g.x0 - .02, g.x0 + 1.02, g.y0 - .02, g.y1 + .02, 0, .95, CTC.fer); C(g.x0 + .08, g.x0 + .92, g.y0, g.y1, .95, 1.02, CTC.gomme);
        for (const s of [0, 1]) C(g.x0 + s * .96 - .04, g.x0 + s * .96 + .08, g.y0 - .02, g.y1 + .02, .95, 1.12, CTC.jaune); }
      const dx = H ? g.sens : 0, dy = H ? 0 : g.sens;
      CT.tapis.push({ x0: g.x0, x1: H ? g.x1 : g.x0 + 1, y0: g.y0, y1: H ? g.y0 + 1 : g.y1, dx, dy, v: g.v });
      CT.anim.push({ k: 'tapis', x: g.x, y: g.y, T: CT.tapis[CT.tapis.length - 1], hor: H });
      break; }
    case 'presse': {
      const H = g.hor;
      for (const s of [-1, 1]) { const px = H ? x : x + s * .44, py = H ? y + s * .44 : y; C(px - .07, px + .07, py - .07, py + .07, 1.02, 3.05, CTC.fer2); }
      if (H) C(x - .3, x + .3, y - .55, y + .55, 3.05, 3.35, CTC.fer); else C(x - .55, x + .55, y - .3, y + .3, 3.05, 3.35, CTC.fer);
      C(x - .3, x + .3, y - .3, y + .3, 3.35, 3.85, CTC.jaune); C(x - .32, x + .32, y - .32, y + .32, 3.55, 3.62, CTC.noir, 0, 1);
      CT.anim.push({ k: 'presse', x, y, ph: g.ph });
      break; }
    case 'dynamo': {
      const H = g.hor, lx = H ? 1.52 : 1.02, ly = H ? 1.02 : 1.52;
      C(x - lx, x + lx, y - ly, y + ly, 0, 2.02, CTC.fer2); C(x - lx - .04, x + lx + .04, y - ly - .04, y + ly + .04, 1.9, 2.02, CTC.fer, 0, 1);
      const A = H ? [x - 1.2, y, Z0 + 2.75] : [x, y - 1.2, Z0 + 2.75], Bp = H ? [x + 1.0, y, Z0 + 2.75] : [x, y + 1.0, Z0 + 2.75];
      d(A, Bp, 1.5, 1.5, CTC.bleu);
      for (let k = 0; k < 5; k++) { const u = -1 + k * .45, a = H ? [x + u, y, Z0 + 2.75] : [x, y + u, Z0 + 2.75], b = H ? [x + u + .14, y, Z0 + 2.75] : [x, y + u + .14, Z0 + 2.75]; d(a, b, 1.62, 1.62, CTC.cuivre); }
      d(H ? [x + 1.0, y, Z0 + 2.75] : [x, y + 1.0, Z0 + 2.75], H ? [x + 1.7, y, Z0 + 2.75] : [x, y + 1.7, Z0 + 2.75], .22, .22, CTC.acier);
      for (let k = 0; k < 3; k++) { const u = -.6 + k * .6; if (H) C(x + u - .14, x + u + .14, y + ly, y + ly + .03, 1.2, 1.48, CTC.creme, 0, 1); else C(x + lx, x + lx + .03, y + u - .14, y + u + .14, 1.2, 1.48, CTC.creme, 0, 1); }
      CT.anim.push({ k: 'rotor', x, y, C: H ? [x + 1.55, y, Z0 + 2.75] : [x, y + 1.55, Z0 + 2.75], H });
      break; }
    case 'tesla':
      C(x - .52, x + .52, y - .52, y + .52, 0, 1.02, CTC.fer);
      for (let k = 0; k < 4; k++) C(x - .22 + (k & 1) * .04, x + .22 - (k & 1) * .04, y - .22 + (k & 1) * .04, y + .22 - (k & 1) * .04, 1.02 + k * .12, 1.14 + k * .12, CTC.creme);
      C(x - .2, x + .2, y - .2, y + .2, 1.5, 3.4, CTC.cuivre);
      for (let k = 0; k < 7; k++) C(x - .215, x + .215, y - .215, y + .215, 1.62 + k * .25, 1.66 + k * .25, ctMix(CTC.cuivre, .6), 0, 1);
      ctRoue(d, [x, y, Z0 + 3.55], [1, 0, 0], [0, 1, 0], [0, 0, 1], .46, 0, .18, 0, CTC.acier, 4);
      break;
    case 'barricade': {
      const x0 = g.x0, x1 = g.x0 + g.w, y0 = g.y0, y1 = g.y0 + g.h;
      C(x0 - .02, x1 + .02, y0 - .02, y1 + .02, 0, .85, [70, 78, 66]); C(x0 - .06, x1 + .06, y0 - .06, y1 + .06, .85, 1.04, CTC.fer);
      for (let u = 0; u < Math.max(g.w, g.h) * 4; u += 2) { const a = u / 4; if (g.w > 1) C(x0 + a, x0 + a + .25, y0 - .07, y1 + .07, .87, 1.02, CTC.jaune, 0, 1); else C(x0 - .07, x1 + .07, y0 + a, y0 + a + .25, .87, 1.02, CTC.jaune, 0, 1); }
      for (let k = 0; k < 3; k++) C(x0 - .03, x1 + .03, y0 - .03, y1 + .03, .2 + k * .22, .23 + k * .22, ctMix([70, 78, 66], .7), 0, 1);
      break; }
    case 'caisses2':
      for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) { const x0 = g.x0 + i, y0 = g.y0 + j, c = [CTC.bois, [128, 112, 84], CTC.olive][(i + j + (g.v * 3 | 0)) % 3];
        C(x0 - .02, x0 + 1.02, y0 - .02, y0 + 1.02, 0, 1.02, c); C(x0 - .04, x0 + 1.04, y0 - .04, y0 + 1.04, .46, .54, ctMix(c, .7), 0, 1);
        if (ctH(x0, y0, 4) < .5) C(x0 + .15, x0 + .75, y0 + .2, y0 + .8, 1.02, 1.5, ctMix(c, 1.15)); }
      break;
    case 'socle': {
      const x0 = g.x0, x1 = g.x0 + g.w, y0 = g.y0, y1 = g.y0 + g.h;
      C(x0 - .02, x1 + .02, y0 - .02, y1 + .02, 0, 1.02, CTC.fer); C(x0 - .06, x1 + .06, y0 - .06, y1 + .06, .9, 1.04, CTC.cuivre);
      for (let k = 0; k < 6; k++) { const px = x0 + .25 + ctH(x0, k, 1) * (g.w - .5), py = y0 + .25 + ctH(y0, k, 2) * (g.h - .5), hh = .5 + ctH(k, x0 + y0, 3) * 1.1, a = ctH(k, x0, 4) * 6.28;
        d([px, py, Z0 + 1.02], [px + Math.cos(a) * .25, py + Math.sin(a) * .25, Z0 + 1.02 + hh], .16 + (k & 1) * .06, .16, k % 3 ? [130, 210, 255] : CTL.cyan, !(k % 3)); }
      break; }
    case 'arene':
      for (let k = 0; k < 32; k++) { const a = k / 32 * 6.2832, b = (k + 1) / 32 * 6.2832;
        d([x + Math.cos(a) * g.r, y + Math.sin(a) * g.r, Z0 + .012], [x + Math.cos(b) * g.r, y + Math.sin(b) * g.r, Z0 + .012], .14, .02, k % 4 ? [120, 40, 34] : CTL.rouge, !(k % 4)); }
      break;
  }
}
// Le cadran de l'Horloge : un disque de huit mètres, ses marques d'or, ses rouages (les aiguilles et le balancier bougent).
function ctCadran(d, q, g) {
  const Z0 = DJ_Z0, cx = q.cx, y = q.y, C = [cx, y + .14, Z0 + 6.6], r = 4.1, U = [1, 0, 0], V = [0, 0, 1], N = [0, 1, 0];
  const pt = (a, rr, yy = y + .14) => [cx + Math.cos(a) * rr, yy, Z0 + 6.6 + Math.sin(a) * rr];
  for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832; d([cx, y + .08, Z0 + 6.6], pt(a, r, y + .08), r * .5, .12, [34, 30, 40], 0, N); }
  for (let k = 0; k < 36; k++) d(pt(k / 36 * 6.2832, r * .98, y + .2), pt((k + 1) / 36 * 6.2832, r * .98, y + .2), .3, .2, CTC.laiton, 0, N);
  for (let k = 0; k < 24; k++) d(pt(k / 24 * 6.2832, r * .66, y + .18), pt((k + 1) / 24 * 6.2832, r * .66, y + .18), .07, .1, ctMix(CTC.laiton, .8), 0, N);
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; d(pt(a, r * .72, y + .2), pt(a, r * .9, y + .2), k % 3 ? .2 : .34, .1, CTL.or, 1, N); }
  for (let k = 0; k < 60; k++) if (k % 5) { const a = k / 60 * 6.2832; d(pt(a, r * .91, y + .19), pt(a, r * .95, y + .19), .06, .06, CTC.creme, 0, N, 1); }
  for (const x of g.tours) {                                       // les deux tours qui le portent, de part et d'autre
    ctCub(d, x - .02, x + 1.02, y - .02, y + 1.02, Z0, Z0 + q.haut + .02, CTC.fer2);
    for (let z = 1; z < q.haut; z += 2.5) ctCub(d, x - .06, x + 1.06, y - .02, y + 1.06, Z0 + z, Z0 + z + .14, CTC.laiton, 0, 1);
  }
  ctCub(d, cx - 5.1, cx + 5.1, y - .02, y + .7, Z0 + 2.2, Z0 + 2.45, CTC.fer);   // le linteau, sous le cadran
  if (g.socle.length) { const a = g.socle[0], b = g.socle[g.socle.length - 1] + 1;   // le socle du balancier
    ctCub(d, a - .02, b + .02, y - .02, y + 1.02, Z0, Z0 + 1.02, CTC.fer); ctCub(d, a - .06, b + .06, y + .9, y + 1.08, Z0 + .9, Z0 + 1.08, CTC.laiton); }
  CT.anim.push({ k: 'horloge', x: cx, y: y + 2, C, r, U, V, N, haut: q.haut });
}
// ---------- les murs : nervures, poutres, conduites, portes ----------
function ctMurs(d, q) {
  const Z0 = DJ_Z0, H = q.haut, pres = (x, y) => q.portes.some(i => Math.abs(i % WS + .5 - x) < 1.6 && Math.abs((i / WS | 0) + .5 - y) < 1.6);
  const C = (x0, x1, y0, y1, z0, z1, c, lum, f) => ctCub(d, x0, x1, y0, y1, Z0 + z0, Z0 + z1, c, lum, f);
  const cotes = [[q.x, q.y, q.x + q.w, q.y, 0, 1], [q.x, q.y + q.h, q.x + q.w, q.y + q.h, 0, -1], [q.x, q.y, q.x, q.y + q.h, 1, 0], [q.x + q.w, q.y, q.x + q.w, q.y + q.h, -1, 0]];
  for (const [ax, ay, bx, by, nx, ny] of cotes) {
    const L = Math.max(bx - ax, by - ay), at = (u, f) => [ax + (bx - ax) / L * u + nx * f, ay + (by - ay) / L * u + ny * f];
    const boite = (u0, u1, f0, f1, z0, z1, c, lum, fin) => { const [x0, y0] = at(u0, f0), [x1, y1] = at(u1, f1); C(Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1), z0, z1, c, lum, fin); };
    if (H >= 5) {                                                    // les nervures d'acier, une tous les quatre pas, et la poutre du haut
      for (let u = 2; u < L - 1; u += 4) { const [px, py] = at(u, .1); if (pres(px, py)) continue;
        boite(u - .18, u + .18, -.05, .2, 0, H, CTC.fer); boite(u - .3, u + .3, .2, .27, 0, H, CTC.fer2);
        for (let z = 1.5; z < H; z += 2) boite(u - .32, u + .32, .26, .3, z, z + .08, CTC.laiton, 0, 1); }
      boite(0, L, -.05, .28, H - .8, H - .52, CTC.fer);
      if (q.grand) boite(0, L, -.05, .3, 4.2, 4.5, CTC.fer);
    }
    // les conduites : sur deux murs (le hasard de la salle), une grosse et une fine
    if (ctH(q.x, q.y, nx * 3 + ny + 5) < .55 || (nx === 0 && ny === 1)) {
      const zc = Math.min(H, 4) - .75 + (H > 5 ? 1.4 : 0), col = ctH(q.x, q.y, nx + 2 * ny + 9) < .5 ? CTC.cuivre : CTC.fer2;
      boite(0, L, .16, .38, zc - .11, zc + .11, col); boite(0, L, .14, .28, zc + .28, zc + .36, CTC.fer);
      for (let u = 1; u < L; u += 2) { boite(u - .06, u + .06, .13, .41, zc - .15, zc + .15, ctMix(col, .75), 0, 1); }
      for (let u = 1.5; u < L; u += 3) boite(u - .04, u + .04, 0, .16, zc - .04, zc + .04, CTC.noir, 0, 1);
    }
  }
  // les portes : un cadre d'acier rayé de jaune, une lampe au linteau, des bandes au sol
  const groupes = [];
  for (const i of q.portes) {
    const x = i % WS, y = i / WS | 0;
    const cote = y === q.y - 1 && x >= q.x && x < q.x + q.w ? 0 : y === q.y + q.h && x >= q.x && x < q.x + q.w ? 1 : x === q.x - 1 && y >= q.y && y < q.y + q.h ? 2 : x === q.x + q.w && y >= q.y && y < q.y + q.h ? 3 : -1;
    if (cote < 0) continue;
    const u = cote < 2 ? x : y, g = groupes.find(o => o.c === cote && (o.b === u - 1 || o.a === u + 1));
    if (g) { g.a = Math.min(g.a, u); g.b = Math.max(g.b, u); } else groupes.push({ c: cote, a: u, b: u });
  }
  for (const g of groupes) {
    const [ax, ay, bx, by, nx, ny] = cotes[g.c], L = Math.max(bx - ax, by - ay), u0 = g.a - (g.c < 2 ? q.x : q.y), u1 = g.b + 1 - (g.c < 2 ? q.x : q.y);
    const at = (u, f) => [ax + (bx - ax) / L * u + nx * f, ay + (by - ay) / L * u + ny * f];
    const boite = (ua, ub, f0, f1, z0, z1, c, lum, fin) => { const [x0, y0] = at(ua, f0), [x1, y1] = at(ub, f1); C(Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1), z0, z1, c, lum, fin); };
    for (const u of [u0 - .18, u1 + .18]) { boite(u - .2, u + .2, -.3, .22, 0, 3.4, CTC.fer2); for (let z = .2; z < 3.2; z += .6) boite(u - .21, u + .21, .2, .23, z, z + .3, CTC.jaune, 0, 1); }
    boite(u0 - .4, u1 + .4, -.3, .24, 3.05, 3.5, CTC.fer);
    for (let u = u0; u < u1; u += .5) boite(u, u + .25, .24, .26, 3.1, 3.45, CTC.jaune, 0, 1);
    boite((u0 + u1) / 2 - .15, (u0 + u1) / 2 + .15, .24, .4, 2.85, 3.05, CTL.ambre, 1);
    for (let u = u0; u < u1 - .01; u += .5) boite(u, u + .25, .02, .38, 0, .012, CTC.jaune); 
  }
}
// ---------- le sol des salles : la ligne peinte devant le mobilier, des grilles, des plaques d'égout ----------
function ctSol(d, q) {
  if (q.role === 'garde' || q.role === 'horloge' || q.role === 'vapeur' || q.role === 'halle') return;
  const Z0 = DJ_Z0, i0 = 1.12, col = ctH(q.x, q.y, 21) < .6 ? CTC.jaune : [196, 198, 190], libre = (x, y) => Hgt[(y | 0) * WS + (x | 0)] === Z0;
  const ligne = (ax, ay, bx, by) => { const L = Math.hypot(bx - ax, by - ay);
    for (let u = 0; u < L - .2; u += 1) { const a = u / L, b = Math.min(1, (u + .55) / L), xa = ax + (bx - ax) * a, ya = ay + (by - ay) * a, xb = ax + (bx - ax) * b, yb = ay + (by - ay) * b;
      if (!libre((xa + xb) / 2, (ya + yb) / 2)) continue;
      ctCub(d, Math.min(xa, xb) - (ax === bx ? .05 : 0), Math.max(xa, xb) + (ax === bx ? .05 : 0), Math.min(ya, yb) - (ay === by ? .05 : 0), Math.max(ya, yb) + (ay === by ? .05 : 0), Z0 + .004, Z0 + .014, col); } };
  const x0 = q.x + i0, x1 = q.x + q.w - i0, y0 = q.y + i0, y1 = q.y + q.h - i0;
  ligne(x0, y0, x1, y0); ligne(x0, y1, x1, y1); ligne(x0, y0, x0, y1); ligne(x1, y0, x1, y1);
  for (let k = 0; k < 3; k++) {
    const x = q.x + 2 + (ctH(q.x, q.y, k + 30) * (q.w - 4) | 0), y = q.y + 2 + (ctH(q.y, q.x, k + 40) * (q.h - 4) | 0);
    if (!libre(x, y) || Bio[y * WS + x] === DJ_BIO_HUILE) continue;
    if (k === 2) { ctCub(d, x + .2, x + .8, y + .2, y + .8, Z0, Z0 + .012, CTC.noir); ctCub(d, x + .26, x + .74, y + .26, y + .74, Z0 + .012, Z0 + .02, CTC.fer2); }
    else { ctCub(d, x + .08, x + .92, y + .08, y + .92, Z0, Z0 + .012, CTC.noir); for (let j = 0; j < 5; j++) ctCub(d, x + .12 + j * .16, x + .18 + j * .16, y + .1, y + .9, Z0 + .012, Z0 + .03, CTC.fer2, 0, 1); }
  }
}
// ---------- les couloirs : conduites, lanternes, grilles ----------
function ctCouloirs(d) {
  const Z0 = DJ_Z0, HM = Z0 + DJ_MUR, C = (x0, x1, y0, y1, z0, z1, c, lum, f) => ctCub(d, x0, x1, y0, y1, Z0 + z0, Z0 + z1, c, lum, f);
  const cou = (x, y) => Hgt[y * WS + x] === Z0 && Bio[y * WS + x] === DJ_BIO_COULOIR && !djSalleDe(x, y);
  const mur = (x, y) => Hgt[y * WS + x] >= HM;
  const pris = new Set(DJ.plaques.map(p => (p.y | 0) * WS + (p.x | 0)));
  for (const l of LASERS) pris.add(((l.ay + l.by) / 2 | 0) * WS + ((l.ax + l.bx) / 2 | 0));
  // les murs, par rangées : [direction, décalage vers le mur]
  const passes = [[1, 0, 0, -1], [1, 0, 0, 1], [0, 1, -1, 0], [0, 1, 1, 0]];
  for (const [ux, uy, wx, wy] of passes) {
    for (let a = 2; a < WS - 2; a++) {
      let deb = -1;
      for (let b = 2; b <= WS - 2; b++) {
        const x = ux ? b : a, y = ux ? a : b, ok = b < WS - 2 && cou(x, y) && mur(x + wx, y + wy);
        if (ok && deb < 0) deb = b;
        if (!ok && deb >= 0) {
          const n = b - deb;
          if (n >= 2) {
            const box = (u0, u1, g0, g1, z0, z1, c, lum, fin) => ux ? C(u0, u1, a + g0, a + g1, z0, z1, c, lum, fin) : C(a + g0, a + g1, u0, u1, z0, z1, c, lum, fin);
            const side = wx + wy > 0, pa = side ? .62 : .16, pb = side ? .84 : .38;   // la conduite, à 16 cm du mur
            box(deb, b, pa, pb, 3.05, 3.27, (a * 7 + deb) % 3 ? CTC.fer2 : CTC.cuivre);
            for (let u = deb + 1; u < b; u += 2) box(u - .05, u + .05, pa - .03, pb + .03, 3.01, 3.31, CTC.fer, 0, 1);
            if (side) for (let u = deb + 2; u < b - 1; u += 6) {        // la lanterne grillagée
              box(u + .35, u + .65, .82, 1, 2.62, 2.7, CTC.fer, 0, 1); box(u + .38, u + .62, .7, .9, 2.3, 2.62, CTL.ambre, 1);
              box(u + .36, u + .64, .68, .72, 2.28, 2.64, CTC.noir, 0, 1);
            }
            else box(deb, b, .06, .16, 3.5, 3.6, CTC.noir);           // un câble, le long du mur
          }
          deb = -1;
        }
      }
    }
  }
  for (let y = 2; y < WS - 2; y++) for (let x = 2; x < WS - 2; x++) {   // de loin en loin, une grille au sol
    if (!cou(x, y) || (x * 7 + y * 13) % 17 || pris.has(y * WS + x)) continue;
    C(x + .12, x + .88, y + .12, y + .88, 0, .012, CTC.noir); for (let k = 0; k < 4; k++) C(x + .18 + k * .18, x + .24 + k * .18, y + .14, y + .86, .012, .03, CTC.fer2, 0, 1);
  }
}
// ---------- les niches ----------
function ctNiche(d, n) {
  const Z0 = DJ_Z0, k = n.k === 'armoires' ? 'armoire' : n.k;
  for (const [a, b] of n.cells) ctMeuble(d, { k, x: a, y: b, nx: n.nx, ny: n.ny, v: ctH(a, b, 3) });
  const bx = n.x - n.nx * 1.8, by = n.y - n.ny * 1.8;                // la lampe, au fond
  ctCub(d, bx - .15, bx + .15, by - .15, by + .15, Z0 + 3.4, Z0 + 3.6, CTC.fer); ctCub(d, bx - .1, bx + .1, by - .1, by + .1, Z0 + 3.22, Z0 + 3.4, CTL.ambre, 1);
}
// ---------- la halle, l'Horloge : balcons, rouages muraux, pont roulant, suspensions ----------
function ctBalcons(d, q, z, cotes) {
  const Z0 = DJ_Z0, C = (x0, x1, y0, y1, z0, z1, c, lum, f) => ctCub(d, x0, x1, y0, y1, Z0 + z0, Z0 + z1, c, lum, f);
  for (const s of cotes) {                                         // s : 0 ouest, 1 est, 2 nord, 3 sud
    const v = s < 2, w0 = s === 0 ? q.x : s === 1 ? q.x + q.w - 1.4 : null, h0 = s === 2 ? q.y : s === 3 ? q.y + q.h - 1.4 : null;
    const bord = s === 0 ? q.x + 1.4 : s === 1 ? q.x + q.w - 1.4 : s === 2 ? q.y + 1.4 : q.y + q.h - 1.4;
    if (v) { C(w0, w0 + 1.4, q.y + .5, q.y + q.h - .5, z - .15, z, CTC.fer2); C(bord - .04, bord + .04, q.y + .5, q.y + q.h - .5, z + .9, z + .97, CTC.jaune); C(bord - .03, bord + .03, q.y + .5, q.y + q.h - .5, z + .45, z + .5, CTC.fer, 0, 1);
      for (let y = q.y + .6; y < q.y + q.h - .4; y += 1.5) C(bord - .04, bord + .04, y - .04, y + .04, z, z + .95, CTC.fer);
      for (let y = q.y + 1.5; y < q.y + q.h - 1; y += 3) d([s ? q.x + q.w - .05 : q.x + .05, y, Z0 + z - 1.2], [bord, y, Z0 + z - .12], .12, .12, CTC.fer);
      for (let y = q.y + 3; y < q.y + q.h - 2; y += 5) C(bord - .1, bord + .1, y - .1, y + .1, z + .97, z + 1.2, CTL.ambre, 1); }
    else { C(q.x + .5, q.x + q.w - .5, h0, h0 + 1.4, z - .15, z, CTC.fer2); C(q.x + .5, q.x + q.w - .5, bord - .04, bord + .04, z + .9, z + .97, CTC.jaune); C(q.x + .5, q.x + q.w - .5, bord - .03, bord + .03, z + .45, z + .5, CTC.fer, 0, 1);
      for (let x = q.x + .6; x < q.x + q.w - .4; x += 1.5) C(x - .04, x + .04, bord - .04, bord + .04, z, z + .95, CTC.fer);
      for (let x = q.x + 1.5; x < q.x + q.w - 1; x += 3) d([x, s === 3 ? q.y + q.h - .05 : q.y + .05, Z0 + z - 1.2], [x, bord, Z0 + z - .12], .12, .12, CTC.fer);
      for (let x = q.x + 3; x < q.x + q.w - 2; x += 5) C(x - .1, x + .1, bord - .1, bord + .1, z + .97, z + 1.2, CTL.ambre, 1); }
  }
}
function ctRouagesMur(q, zc, murs, r1 = 2.3, r2 = 1.4) {
  for (const [s, u] of murs) {                                     // s : 0 ouest, 1 est, 2 nord, 3 sud ; u : la place le long du mur (0 à 1)
    const x = s === 0 ? q.x + .2 : s === 1 ? q.x + q.w - .2 : q.x + q.w * u, y = s === 2 ? q.y + .2 : s === 3 ? q.y + q.h - .2 : q.y + q.h * u;
    const pl = ctPlan(s < 2 ? 1 : 0, s < 2 ? 0 : 1), th = .45, dd = (r1 + r2) * .96;
    const C1 = [x, y, DJ_Z0 + zc], C2 = [x + pl.U[0] * Math.cos(th) * dd, y + pl.U[1] * Math.cos(th) * dd, DJ_Z0 + zc + Math.sin(th) * dd];
    CT.anim.push({ k: 'rouages', x, y, pl, R: [[C1, r1, Math.round(r1 * 7), .35, 0], [C2, r2, Math.round(r2 * 7), -.35 * r1 / r2, Math.PI / Math.round(r2 * 7)]] });
  }
}
function ctHalle(d, q) {
  const Z0 = DJ_Z0, hor = q.w >= q.h, C = (x0, x1, y0, y1, z0, z1, c, lum, f) => ctCub(d, x0, x1, y0, y1, Z0 + z0, Z0 + z1, c, lum, f);
  ctBalcons(d, q, 4.45, hor ? [0, 1] : [2, 3]);
  ctRouagesMur(q, 5.4, hor ? [[2, .28], [3, .7]] : [[0, .3], [1, .68]]);
  for (const s of [0, 1]) {                                        // les rails du pont roulant
    if (hor) C(q.x - .2, q.x + q.w + .2, s ? q.y + q.h - .7 : q.y + .35, s ? q.y + q.h - .35 : q.y + .7, 7.0, 7.3, CTC.jaune);
    else C(s ? q.x + q.w - .7 : q.x + .35, s ? q.x + q.w - .35 : q.x + .7, q.y - .2, q.y + q.h + .2, 7.0, 7.3, CTC.jaune);
  }
  CT.anim.push({ k: 'pont', x: q.cx, y: q.cy, q, hor });
  for (const [u, v] of [[.22, .28], [.78, .28], [.22, .72], [.78, .72]]) {   // les suspensions
    const x = q.x + q.w * u, y = q.y + q.h * v;
    d([x, y, Z0 + q.haut], [x, y, Z0 + 5.35], .04, .04, CTC.noir); C(x - .42, x + .42, y - .42, y + .42, 5.15, 5.35, CTC.fer); C(x - .2, x + .2, y - .2, y + .2, 5.0, 5.15, CTL.or, 1);
  }
  for (const s of [-1, 1]) {                                        // les allées peintes, de part et d'autre du volant
    if (hor) C(q.x + 2, q.x + q.w - 2, q.cy + s * 2.7 - .06, q.cy + s * 2.7 + .06, 0, .012, CTC.jaune); else C(q.cx + s * 2.7 - .06, q.cx + s * 2.7 + .06, q.y + 2, q.y + q.h - 2, 0, .012, CTC.jaune);
  }
  for (const [x, y] of [[q.x + .5, q.y + .5], [q.x + q.w - .5, q.y + .5], [q.x + .5, q.y + q.h - .5], [q.x + q.w - .5, q.y + q.h - .5]]) {   // les cheminées d'angle
    C(x - .45, x + .45, y - .45, y + .45, 0, q.haut + .6, CTC.fer2); for (let z = 1; z < q.haut; z += 1.6) C(x - .5, x + .5, y - .5, y + .5, z, z + .1, CTC.fer, 0, 1);
  }
}
function ctHorlogeSalle(d, q) {
  const Z0 = DJ_Z0, C = (x0, x1, y0, y1, z0, z1, c, lum, f) => ctCub(d, x0, x1, y0, y1, Z0 + z0, Z0 + z1, c, lum, f);
  ctBalcons(d, q, 5.6, [0, 1]);
  ctRouagesMur(q, 8.2, [[0, .35], [1, .62], [2, .14], [2, .8]], 2.4, 1.5);
  const r = 7.2;                                                     // le cadran du sol, où veille le gardien
  for (let k = 0; k < 48; k++) { const a = k / 48 * 6.2832, b = (k + 1) / 48 * 6.2832;
    d([q.cx + Math.cos(a) * r, q.cy + Math.sin(a) * r, Z0 + .01], [q.cx + Math.cos(b) * r, q.cy + Math.sin(b) * r, Z0 + .01], .18, .02, CTC.laiton); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832; d([q.cx + Math.cos(a) * (r - .9), q.cy + Math.sin(a) * (r - .9), Z0 + .015], [q.cx + Math.cos(a) * (r - .2), q.cy + Math.sin(a) * (r - .2), Z0 + .015], k % 3 ? .12 : .22, .02, CTL.or, 1); }
  for (const [u, v] of [[.3, .4], [.7, .4], [.3, .75], [.7, .75]]) {
    const x = q.x + q.w * u, y = q.y + q.h * v;
    d([x, y, Z0 + q.haut], [x, y, Z0 + 7.2], .05, .05, CTC.noir); ctRoue(d, [x, y, Z0 + 7.1], [1, 0, 0], [0, 1, 0], [0, 0, 1], .9, 0, .12, 0, CTC.laiton, 4);
    for (let k = 0; k < 4; k++) { const a = k * 1.5708 + .785; C(x + Math.cos(a) * .8 - .1, x + Math.cos(a) * .8 + .1, y + Math.sin(a) * .8 - .1, y + Math.sin(a) * .8 + .1, 7.15, 7.45, CTL.or, 1); }
  }
}

// ============================================================
//  LE PEUPLEMENT : le décor fixe, et ce qu'on trouve dans les salles nouvelles
//  Appelé à la fin de djPeupler (donjon.js) : H = { R, machine, coffre, e }.
// ============================================================
function centrePeupler(H) {
  const { R, machine, coffre, e } = H, Z0 = DJ_Z0, d = ctS;
  CT.anim = []; CT.tapis = []; CT.emet = []; DJ.horloge = null;
  const caseLibre = (q, m = 1.5) => { for (let k = 0; k < 80; k++) { const x = q.x + m + R() * (q.w - 2 * m), y = q.y + m + R() * (q.h - 2 * m);
    if (Hgt[(y | 0) * WS + (x | 0)] === Z0 && !DJ.coffres.some(c => Math.hypot(c.x - x, c.y - y) < 1.6) && Math.hypot(DJ.escalier ? DJ.escalier.x - x : 99, DJ.escalier ? DJ.escalier.y - y : 99) > 3) return [(x | 0) + .5, (y | 0) + .5]; } return null; };
  const bord = q => { for (let k = 0; k < 60; k++) { const c = R() * 4 | 0, u = R();
    const x = c === 0 ? q.x : c === 1 ? q.x + q.w - 1 : q.x + 1 + (u * (q.w - 2) | 0), y = c === 2 ? q.y : c === 3 ? q.y + q.h - 1 : q.y + 1 + (u * (q.h - 2) | 0);
    if (Hgt[y * WS + x] === Z0 && ctLibre(q, x, y, 2)) return [x + .5, y + .5]; } return null; };
  DJ.salles.forEach((q, s) => {
    ctMurs(d, q); ctSol(d, q);
    for (const m of q.meubles) ctMeuble(d, m);
    for (const g of q.grands) ctGrand(d, g, q);
    if (q.role === 'halle') ctHalle(d, q);
    if (q.role === 'horloge') ctHorlogeSalle(d, q);
    if (q.role === 'fonderie') for (let k = 0; k < 5; k++) {         // des chaînes qui pendent, près des murs
      const x = q.x + 1.2 + R() * (q.w - 2.4), y = q.y + q.h - 1.2 - R() * 3, L = 1.5 + R() * 2;
      for (let z = q.haut; z > q.haut - L; z -= .3) d([x, y, Z0 + z], [x, y, Z0 + z - .28], (z * 3.3 | 0) % 2 ? .05 : .13, (z * 3.3 | 0) % 2 ? .13 : .05, [92, 86, 84], 0, undefined, 1);
      d([x, y, Z0 + q.haut - L], [x + .15, y, Z0 + q.haut - L - .25], .05, .05, [120, 110, 100]);
    }
    if (q.role === 'chaudieres') {                                  // la conduite qui relie les chaudières
      const C = q.grands.filter(g => g.k === 'chaudiere');
      for (let k = 1; k < C.length; k++) d([C[k - 1].x, C[k - 1].y, Z0 + 2.65], [C[k].x, C[k].y, Z0 + 2.65], .32, .32, CTC.cuivre);
    }
    if (q.role === 'generateur') { const T = q.grands.filter(g => g.k === 'tesla');
      if (T.length) CT.anim.push({ k: 'arcs', x: q.cx, y: q.cy, P: T.map(g => [g.x, g.y, Z0 + 3.55]), D: q.grands.find(g => g.k === 'dynamo') });
      for (const g of T) { const D = q.grands.find(o => o.k === 'dynamo'); if (D) d([g.x, g.y, Z0 + .03], [D.x, D.y, Z0 + .03], .1, .06, CTC.noir); } }
    if (q.role === 'escalier' && DJ.escalier) {                       // la rambarde de l'escalier, et son enseigne
      const ex = DJ.escalier.x, ey = DJ.escalier.y;
      for (const s2 of [-1, 1]) { ctCub(d, ex - 1.5, ex + 1.6, ey + s2 * 1.05 - .04, ey + s2 * 1.05 + .04, Z0 + .95, Z0 + 1.02, CTC.jaune);
        for (let x = ex - 1.5; x <= ex + 1.6; x += .77) ctCub(d, x - .04, x + .04, ey + s2 * 1.05 - .04, ey + s2 * 1.05 + .04, Z0, Z0 + .98, CTC.fer); }
      ctCub(d, ex + 1.56, ex + 1.64, ey - 1.05, ey + 1.05, Z0 + .95, Z0 + 1.02, CTC.jaune);
      ctCub(d, ex + 1.75, ex + 1.85, ey - .05, ey + .05, Z0, Z0 + 2.6, CTC.fer); ctCub(d, ex + 1.7, ex + 1.9, ey - .5, ey + .5, Z0 + 2.2, Z0 + 2.9, [20, 30, 34]);
      for (let k = 0; k < 3; k++) ctCub(d, ex + 1.66, ex + 1.7, ey - .3 + k * .1, ey - .2 + k * .1, Z0 + 2.75 - k * .12, Z0 + 2.83 - k * .12, CTL.cyan, 1);
      for (let k = 0; k < 2; k++) ctCub(d, ex + 1.66, ex + 1.7, ey + .1 + k * .1, ey + .2 + k * .1, Z0 + 2.63 + k * .12, Z0 + 2.71 + k * .12, CTL.cyan, 1);
    }
    // ce qu'on trouve dans les salles nouvelles
    if (CT_CALMES.includes(q.role)) {
      if (R() < .55) { const p = caseLibre(q, 2); if (p) coffre(p[0], p[1], 'petit', s); }
      if (e >= 3 && R() < .35) { const p = caseLibre(q); if (p) machine('araignee', p[0], p[1], s); }
      if (q.role === 'generateur' && e >= 2) { const p = bord(q); if (p) machine('tourelle', p[0], p[1], s, Math.atan2(q.cy - p[1], q.cx - p[0])); }
    } else if (q.role === 'halle') {
      { const p = caseLibre(q, 3); if (p) coffre(p[0], p[1], 'petit', s); }
      for (let k = 0; k < 2; k++) { const p = caseLibre(q, 2); if (p) machine('araignee', p[0], p[1], s); }
      for (let k = 0; k < (e >= 2 ? 2 : 1); k++) { const p = bord(q); if (p) machine('tourelle', p[0], p[1], s, Math.atan2(q.cy - p[1], q.cx - p[0])); }
    } else if (q.role === 'fonderie') {
      { const p = caseLibre(q, 2); if (p) coffre(p[0], p[1], 'petit', s); }
      for (let k = 0; k < 2 + (e >= 3 ? 1 : 0); k++) { const p = caseLibre(q, 2); if (p) machine('araignee', p[0], p[1], s); }
    }
  });
  ctCouloirs(d);
  for (const n of CT.niches) ctNiche(d, n);
  ctIndexer();
  signalDecor('dalle', -1);                                          // la roche se refait, avec son mobilier
}
// Le décor fixe, rangé par tronçon de seize cases : le rendu WebGL le cuit une fois avec la roche (index.html, construire),
// au lieu de le refaire à chaque image.
function ctIndexer() {
  const M = new Map();
  for (const o of DJ.statique) { const x = (o.a[0] + o.b[0]) / 2, y = (o.a[1] + o.b[1]) / 2, k = ((y / 16) | 0) * 1000 + ((x / 16) | 0); let L = M.get(k); if (!L) M.set(k, L = []); L.push(o); }
  CT.troncons = M;
}
function djStatiqueDans(x0, y0) { return rouagesIci() && CT.troncons ? CT.troncons.get(((y0 / 16) | 0) * 1000 + ((x0 / 16) | 0)) || null : null; }

// ============================================================
//  CE QUI BOUGE (ajouté à djDecor, à chaque image, près du joueur)
// ============================================================
const CT_PETITS = new Set(['voyants', 'bobines', 'tapis', 'presse', 'bras', 'rotor']);
function centreDecor(os, pres) {
  const Z0 = DJ_Z0, T = t;
  for (const A of CT.anim) {
    if (!pres(A.x, A.y) || (CT_PETITS.has(A.k) && (A.x - P.x) ** 2 + (A.y - P.y) ** 2 > 26 * 26)) continue;
    switch (A.k) {
      case 'voyants':
        for (let i = 0; i < A.pts.length; i++) { if (ctH(i, (T * (1.1 + (i % 3) * .6) + A.ph) | 0, 11) > .55) continue;
          const p = A.pts[i]; os([p[0], p[1], p[2] - .038], [p[0], p[1], p[2] + .038], .076, .076, [CTL.vert, CTL.rouge, CTL.ambre, CTL.cyan][(i + (A.ph | 0)) % 4], 1); }
        break;
      case 'bobines': {
        const lat = [-A.ny, A.nx, 0], vit = 1.4 + 2.6 * Math.max(0, Math.sin(T * .23 + A.ph));
        for (const s of [-1, 1]) { const C = [A.c[0] + lat[0] * s * .21 + A.nx * .02, A.c[1] + lat[1] * s * .21 + A.ny * .02, A.c[2]], a = T * vit * s + A.ph;
          for (let k = 0; k < 3; k++) { const b = a + k * 2.094; os(C, [C[0] + lat[0] * Math.cos(b) * .14, C[1] + lat[1] * Math.cos(b) * .14, C[2] + Math.sin(b) * .14], .035, .03, [150, 154, 166], 0, A.n); }
          os([C[0] - A.nx * .01, C[1] - A.ny * .01, C[2]], [C[0] + A.nx * .04, C[1] + A.ny * .04, C[2]], .09, .09, [44, 36, 30], 0, lat); }
        break; }
      case 'volant': {
        const a = T * .85, P = A.pl;
        ctRoue(os, A.C, P.U, P.V, P.N, A.r, 0, .42, a, [98, 100, 112], 8);
        const cp = [A.C[0] + (P.U[0] * Math.cos(a) + P.V[0] * Math.sin(a)) * 2.4, A.C[1] + (P.U[1] * Math.cos(a) + P.V[1] * Math.sin(a)) * 2.4, A.C[2] + Math.sin(a) * 2.4];
        os([cp[0] - P.N[0] * .35, cp[1] - P.N[1] * .35, cp[2]], [cp[0] + P.N[0] * .35, cp[1] + P.N[1] * .35, cp[2]], .22, .22, CTC.laiton, 0, P.U);
        const b = T * 3.4, top = [A.rx, A.ry, Z0 + 4.1];                 // le régulateur : deux boules qui tournent, et s'écartent avec la vitesse
        for (const s of [0, Math.PI]) { const bx = A.rx + Math.cos(b + s) * .55, by = A.ry + Math.sin(b + s) * .55, bz = Z0 + 3.45;
          os(top, [bx, by, bz], .05, .05, CTC.acier); os([bx, by, bz - .12], [bx, by, bz + .12], .24, .24, CTC.laiton); }
        os([A.rx, A.ry, Z0 + 3.0], [A.rx, A.ry, Z0 + 3.12], .3, .3, CTC.laiton);
        break; }
      case 'piston': {
        const zr = Z0 + 4.9 + Math.sin(T * 2.2 + A.ph) * 1.0;
        os([A.x, A.y, Z0 + 3.56], [A.x, A.y, zr], .36, .36, CTC.acier);
        ctCub(os, A.x - .95, A.x + .95, A.y - .17, A.y + .17, zr, zr + .32, CTC.fer2);
        ctCub(os, A.x - .3, A.x + .3, A.y - .3, A.y + .3, zr + .32, zr + .45, CTC.laiton);
        break; }
      case 'rouages':
        for (const [C, r, n, w, off] of A.R) ctRoue(os, C, A.pl.U, A.pl.V, A.pl.N, r, n, .3, T * w + off, r > 2 ? [156, 124, 72] : [112, 114, 124]);
        break;
      case 'pont': {
        const q = A.q, H = A.hor, u = Math.sin(T * .11), v = Math.sin(T * .17 + 1);
        if (H) { const bx = q.cx + (q.w / 2 - 3) * u, ty = q.cy + (q.h / 2 - 3) * v;
          ctCub(os, bx - .35, bx + .35, q.y + .3, q.y + q.h - .3, Z0 + 7.3, Z0 + 7.7, CTC.jaune);
          for (const s of [0, 1]) ctCub(os, bx - .7, bx + .7, s ? q.y + q.h - .8 : q.y + .25, s ? q.y + q.h - .25 : q.y + .8, Z0 + 7.25, Z0 + 7.75, CTC.fer);
          ctCub(os, bx - .45, bx + .45, ty - .45, ty + .45, Z0 + 6.9, Z0 + 7.3, CTC.fer2);
          for (const s of [-1, 1]) os([bx + s * .2, ty, Z0 + 6.9], [bx + s * .2, ty, Z0 + 4.4], .04, .04, CTC.noir);
          ctCub(os, bx - .3, bx + .3, ty - .2, ty + .2, Z0 + 4.1, Z0 + 4.4, CTC.jaune); ctCub(os, bx - .65, bx + .65, ty - .65, ty + .65, Z0 + 2.9, Z0 + 4.1, CTC.bois); }
        else { const by = q.cy + (q.h / 2 - 3) * u, tx = q.cx + (q.w / 2 - 3) * v;
          ctCub(os, q.x + .3, q.x + q.w - .3, by - .35, by + .35, Z0 + 7.3, Z0 + 7.7, CTC.jaune);
          for (const s of [0, 1]) ctCub(os, s ? q.x + q.w - .8 : q.x + .25, s ? q.x + q.w - .25 : q.x + .8, by - .7, by + .7, Z0 + 7.25, Z0 + 7.75, CTC.fer);
          ctCub(os, tx - .45, tx + .45, by - .45, by + .45, Z0 + 6.9, Z0 + 7.3, CTC.fer2);
          for (const s of [-1, 1]) os([tx, by + s * .2, Z0 + 6.9], [tx, by + s * .2, Z0 + 4.4], .04, .04, CTC.noir);
          ctCub(os, tx - .2, tx + .2, by - .3, by + .3, Z0 + 4.1, Z0 + 4.4, CTC.jaune); ctCub(os, tx - .65, tx + .65, by - .65, by + .65, Z0 + 2.9, Z0 + 4.1, CTC.bois); }
        break; }
      case 'creuset': {
        const cx = (A.x0 + A.x1) / 2 + (A.x1 - A.x0) / 2 * Math.sin(T * .16), y = A.y, ti = Math.max(0, Math.sin(T * .5));
        ctCub(os, cx - .45, cx + .45, y - .35, y + .35, Z0 + 5.0, Z0 + 5.3, CTC.fer2);
        for (const s of [-1, 1]) os([cx + s * .3, y, Z0 + 5.0], [cx + s * .42, y, Z0 + 3.55 + (s > 0 ? -ti * .25 : ti * .25)], .04, .04, CTC.noir);
        const lv = ti * .25;
        os([cx - .45, y, Z0 + 2.65 + lv], [cx + .45, y, Z0 + 2.65 - lv], .9, .1, [40, 34, 34], 0, [0, 1, 0]);
        ctCub(os, cx - .45, cx + .45, y - .45, y + .45, Z0 + 2.7, Z0 + 3.5, [52, 40, 38]);
        ctCub(os, cx - .38, cx + .38, y - .38, y + .38, Z0 + 3.5, Z0 + 3.53, CTL.feu, 1);
        if (ti > .6) { os([cx + .5, y, Z0 + 3.3], [cx + .56, y, Z0 + 1.05], .13, .13, CTL.feu, 1); ctCub(os, cx + .3, cx + .8, y - .25, y + .25, Z0 + 1.02, Z0 + 1.06, CTL.or, 1); }
        A.verse = ti > .6 ? [cx + .55, y] : null;
        break; }
      case 'tapis': {
        const Tp = A.T, H = A.hor, L = H ? Tp.x1 - Tp.x0 : Tp.y1 - Tp.y0, sens = H ? Tp.dx : Tp.dy, pas = 2.6, d0 = (T * Tp.v * sens) % pas;
        for (let k = -1; k * pas < L + pas; k++) {
          const u = k * pas + (d0 + pas) % pas; if (u < .3 || u > L - .7) continue;
          const n = Math.floor((T * Tp.v * sens - u) / pas), col = [CTC.bois, [128, 112, 84], CTC.olive, CTC.rouille][((n % 4) + 4) % 4];
          if (H) ctCub(os, Tp.x0 + u, Tp.x0 + u + .6, Tp.y0 + .2, Tp.y0 + .8, Z0 + 1.02, Z0 + 1.6, col); else ctCub(os, Tp.x0 + .2, Tp.x0 + .8, Tp.y0 + u, Tp.y0 + u + .6, Z0 + 1.02, Z0 + 1.6, col);
        }
        const r0 = ((T * Tp.v * sens) % .5 + .5) % .5;                  // les traverses de la bande, qui défilent
        for (let u = r0; u < L; u += .5) { if (H) ctCub(os, Tp.x0 + u, Tp.x0 + u + .06, Tp.y0 + .1, Tp.y0 + .9, Z0 + 1.02, Z0 + 1.03, CTC.fer2); else ctCub(os, Tp.x0 + .1, Tp.x0 + .9, Tp.y0 + u, Tp.y0 + u + .06, Z0 + 1.02, Z0 + 1.03, CTC.fer2); }
        break; }
      case 'presse': {
        const u = ((T + A.ph) % 2.4) / 2.4, zh = Z0 + (u < .6 ? 2.75 : u < .7 ? 2.75 - (u - .6) / .1 * 1.6 : u < .8 ? 1.15 : 1.15 + (u - .8) / .2 * 1.6);
        os([A.x, A.y, Z0 + 3.05], [A.x, A.y, zh + .25], .14, .14, CTC.acier);
        ctCub(os, A.x - .33, A.x + .33, A.y - .33, A.y + .33, zh, zh + .25, CTC.fer2); ctCub(os, A.x - .36, A.x + .36, A.y - .36, A.y + .36, zh, zh + .04, CTC.jaune);
        break; }
      case 'rotor': {
        const P = A.H ? { U: [0, 1, 0], V: [0, 0, 1], N: [1, 0, 0] } : { U: [1, 0, 0], V: [0, 0, 1], N: [0, 1, 0] };
        ctRoue(os, A.C, P.U, P.V, P.N, .75, 0, .12, T * 11, CTC.acier, 5);
        break; }
      case 'arcs': {
        const k0 = (T * 13) | 0;
        if (ctH(k0, 7, 5) < .62 && A.P.length >= 2) {
          const [a, b] = A.P, n = 9;
          let p = a;
          for (let i = 1; i <= n; i++) { const f = i / n, j = i < n ? 1 : 0, q2 = [a[0] + (b[0] - a[0]) * f + (ctH(k0, i, 1) - .5) * .9 * j, a[1] + (b[1] - a[1]) * f + (ctH(k0, i, 2) - .5) * .9 * j, a[2] + (b[2] - a[2]) * f + Math.sin(f * 3.14) * .8 + (ctH(k0, i, 3) - .5) * .7 * j];
            os(p, q2, .07, .07, i % 2 ? CTL.violet : CTL.blanc, 1); p = q2; }
        }
        for (const s of A.P) if (ctH(k0, s[0] | 0, 9) < .5) { let p = s; for (let i = 1; i <= 3; i++) { const q2 = [s[0] + (ctH(k0, i, s[1] | 0) - .5) * 1.4, s[1] + (ctH(k0, i + 5, s[0] | 0) - .5) * 1.4, s[2] + .1 + i * .12]; os(p, q2, .05, .05, CTL.violet, 1); p = q2; } }
        break; }
      case 'bras': {
        const th = Math.sin(T * .8 + A.ph) * .7 + Math.PI, b = [A.x, A.y, Z0 + 1.06];
        const p1 = [A.x + Math.cos(th) * .25, A.y + Math.sin(th) * .25, Z0 + 1.85], p2 = [A.x + Math.cos(th) * .7, A.y + Math.sin(th) * .7 - .3, Z0 + 1.45];
        os(b, [A.x, A.y, Z0 + 1.3], .2, .2, CTC.jaune); os([A.x, A.y, Z0 + 1.3], p1, .12, .12, CTC.jaune); os(p1, p2, .1, .1, CTC.jaune);
        const on = Math.sin(T * 3 + A.ph) > .2; os(p2, [p2[0], p2[1], p2[2] - .12], .06, .06, on ? CTL.blanc : CTC.fer, on);
        A.pointe = on ? [p2[0], p2[1], p2[2] - .14] : null;
        break; }
      case 'horloge': {
        const D = new Date(), sec = D.getSeconds() + D.getMilliseconds() / 1000, mn = D.getMinutes() + sec / 60, hr = (D.getHours() % 12) + mn / 60;
        const C = A.C, pt = (a, rr, dy) => [C[0] + Math.cos(a) * rr, C[1] + dy, C[2] + Math.sin(a) * rr], N = A.N;
        for (const [v, L, w, dy, c, lum] of [[hr / 12, .55, .34, .3, CTL.or, 1], [mn / 60, .8, .22, .36, CTL.or, 1], [sec / 60, .88, .07, .42, CTL.rouge, 1]]) {
          const a = Math.PI / 2 - v * 6.2832; os(pt(a + Math.PI, A.r * .14, dy), pt(a, A.r * L, dy), w, .08, c, lum, N); }
        os([C[0], C[1] + .2, C[2]], [C[0], C[1] + .5, C[2]], .45, .45, CTC.laiton, 0, [1, 0, 0]);
        const ph = Math.sin(T * 1.5708) * .3, piv = [C[0], C[1] + .55, C[2]], L = 5.3, bob = [C[0] + Math.sin(ph) * L, C[1] + .55, C[2] - Math.cos(ph) * L];
        os(piv, bob, .12, .1, CTC.laiton, 0, N);
        ctRoue(os, bob, A.U, A.V, N, .8, 0, .22, ph, CTC.laiton, 6);
        ctCub(os, bob[0] - .3, bob[0] + .3, bob[1] - .13, bob[1] + .13, bob[2] - .3, bob[2] + .3, ctMix(CTC.laiton, 1.2));
        break; }
    }
  }
}

// ============================================================
//  À CHAQUE IMAGE : les tapis, les fumées, les étincelles
// ============================================================
function centreMaj(dt) {
  if (!rouagesIci()) return;
  const Z0 = DJ_Z0;
  if (P.pv > 0 && Math.abs(P.z - (Z0 + 1)) < .2) for (const T of CT.tapis) {   // un tapis vous emporte
    if (P.x < T.x0 || P.x > T.x1 || P.y < T.y0 || P.y > T.y1) continue;
    const nx = P.x + T.dx * T.v * dt, ny = P.y + T.dy * T.v * dt;
    if (Hgt[(ny | 0) * WS + (nx | 0)] <= P.z + .05) { P.x = nx; P.y = ny; }
    break;
  }
  const pres = (x, y, r) => (x - P.x) ** 2 + (y - P.y) ** 2 < r * r;
  for (const E of CT.emet) {
    if (!pres(E.x, E.y, 20)) continue;
    if (E.k === 'vapeur') { const u = ((t + E.ph) % E.per + E.per) % E.per;
      if (u < .55 && Math.random() < dt * (E.grand ? 40 : 22)) parts.push({ x: E.x + (Math.random() - .5) * .2, y: E.y + (Math.random() - .5) * .2, z: E.z, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, vz: 1 + Math.random() * 1.2, g: -.4, life: E.grand ? 1.4 : 1, age: 0, col: '#d6dbe2', tl: E.grand ? .2 : .12 });
      if (u < dt * 1.5 && pres(E.x, E.y, 9) && Math.random() < .35) SON.jouer('vapeur', { vol: .25 }, E.x, E.y, E.z); }
    else if (E.k === 'etincelles' && Math.random() < dt * 3 / E.per)
      parts.push({ x: E.x + (Math.random() - .5) * .6, y: E.y, z: E.z + Math.random() * .3, vx: (Math.random() - .5) * 1.2, vy: Math.random() * 1.2, vz: 1 + Math.random() * 1.5, g: 5, life: .6, age: 0, col: '#ffb040', luit: 1, tl: .05 });
  }
  for (const A of CT.anim) {
    if (A.k === 'presse' && pres(A.x, A.y, 16)) { const n = Math.floor((t + A.ph) / 2.4), u = ((t + A.ph) % 2.4) / 2.4;
      if (u >= .7 && A.coup !== n) { A.coup = n;
        for (let k = 0; k < 10; k++) { const a = Math.random() * 6.28; parts.push({ x: A.x + Math.cos(a) * .35, y: A.y + Math.sin(a) * .35, z: Z0 + 1.2, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, vz: 1 + Math.random() * 1.5, g: 8, life: .45, age: 0, col: '#ffd070', luit: 1, tl: .05 }); }
        if (pres(A.x, A.y, 10)) SON.jouer('pilon', { vol: .3 }, A.x, A.y, Z0 + 1); } }
    else if (A.k === 'bras' && A.pointe && Math.random() < dt * 22 && pres(A.x, A.y, 14)) { const p = A.pointe;
      parts.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: Math.random() * 1.5, g: 7, life: .35, age: 0, col: Math.random() < .5 ? '#ffffff' : '#9fd8ff', luit: 1, tl: .04 }); }
    else if (A.k === 'creuset' && A.verse && Math.random() < dt * 14 && pres(A.x, A.y, 18)) { const [x, y] = A.verse;
      parts.push({ x, y, z: Z0 + 1.1, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: 1 + Math.random() * 2, g: 7, life: .5, age: 0, col: '#ffb040', luit: 1, tl: .06 }); }
    else if (A.k === 'arcs' && pres(A.x, A.y, 12) && Math.random() < dt * .4) SON.jouer('laser', { vol: .12 }, A.x, A.y, Z0 + 3);
  }
}

// ============================================================
//  LA MUSIQUE : « La Grande Horloge » (composition originale)
//  4/4 à 120, en ut dièse mineur, la double croche à 0,125 s. Une horloge qui bat (le tic aigu sur les temps,
//  le tac grave entre), une basse d'automate en doubles croches, le marteau-pilon, les sifflets de vapeur,
//  l'enclume ; par-dessus, une boîte à musique chante le thème, puis le célesta, les cuivres et les toms.
//  Cinq parties : l'OUVERTURE (le balancier, l'orgue, une cloche), l'OSTINATO (la machine se met en marche),
//  le THÈME (la boîte à musique), le SOMMET (tout, l'octave au-dessus, les cuivres), et le PONT (la grande
//  horloge sonne, puis le cliquet s'emballe). Elles s'enchaînent selon le danger (rouagesIntensite) ; l'ostinato
//  et le thème ont une version calme, sans batterie, pour qui explore. Rendues une fois dans des tampons,
//  comme la Valse rouge (brume.js), puis enchaînées par un lecteur léger.
// ============================================================
const RG_E = .125;
const RG_PARTIES = (() => {
  const i = [0, 3, 7], VI = [-4, 0, 3], iv = [5, 8, 12], V = [-5, -1, 2], II = [1, 5, 8];
  return {
    I: { acc: [i, i, VI, V] },
    A: { acc: [i, i, VI, VI, iv, iv, V, V] },
    B: { acc: [i, VI, iv, V, i, VI, II, V],
         chant: [[[7, 4], [8, 2], [7, 2], [3, 4], [0, 4]], [[0, 2], [3, 2], [8, 4], [7, 4], [3, 4]], [[5, 4], [8, 2], [12, 6], [10, 2], [8, 2]], [[7, 6], [11, 2], [14, 4], [11, 4]],
                 [[7, 4], [8, 2], [7, 2], [12, 4], [15, 4]], [[15, 4], [14, 2], [12, 2], [8, 4], [12, 4]], [[13, 6], [12, 2], [8, 4], [5, 4]], [[7, 4], [11, 4], [7, 8]]] },
    C: { acc: [VI, II, i, i, VI, II, V, V],
         chant: [[[15, 4], [12, 4], [8, 4], [12, 4]], [[13, 6], [17, 2], [20, 4], [17, 4]], [[19, 8], [15, 4], [12, 4]], [[12, 2], [15, 2], [19, 2], [24, 6], [22, 2], [19, 2]],
                 [[20, 4], [19, 2], [15, 2], [12, 8]], [[13, 4], [17, 4], [20, 4], [25, 4]], [[23, 8], [19, 4], [14, 4]], [[19, 4], [18, 2], [19, 2], [23, 8]]] },
    D: { acc: [i, i, VI, VI, iv, iv, V, V] },
  };
})();
const rgDuree = p => RG_PARTIES[p].acc.length * 16 * RG_E;
const rgSuite = (p, I, n) => p === 'I' ? 'A' : p === 'A' ? (I > .72 ? 'C' : 'B') : p === 'B' ? (I > .72 ? 'C' : I < .45 && n % 3 === 0 ? 'D' : 'A')
  : p === 'C' ? (I > .72 ? (n % 2 ? 'B' : 'C') : 'D') : (I > .6 ? 'C' : 'A');
function partitionRouages(ctx, sortie) {
  const E = RG_E, f = n => 277.18 * 2 ** (n / 12);
  const bus = ctx.createGain(); bus.gain.value = .75; bus.connect(sortie);
  const BR = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), bd = BR.getChannelData(0); for (let i = 0; i < bd.length; i++) bd[i] = Math.random() * 2 - 1;
  const PLACE = [-.3, 0, .3].map(pan => { const G = ctx.createGain(); if (pan && ctx.createStereoPanner) { const S = ctx.createStereoPanner(); S.pan.value = pan; G.connect(S); S.connect(bus); } else G.connect(bus); return G; });
  const voie = (pan = 0) => { const G = ctx.createGain(); G.connect(PLACE[pan < -.1 ? 0 : pan > .1 ? 2 : 1]); return G; };
  const env = (G, t0, a, pic, tenue, rel) => { const g = G.gain; g.setValueAtTime(.0001, t0); g.exponentialRampToValueAtTime(Math.max(.0002, pic), t0 + a); if (tenue > 0) g.setValueAtTime(Math.max(.0002, pic), t0 + a + tenue); g.exponentialRampToValueAtTime(.0001, t0 + a + tenue + rel); return t0 + a + tenue + rel + .02; };
  const osc = (type, fr, t0, fin, dest, det = 0) => { const O = ctx.createOscillator(); O.type = type; O.frequency.setValueAtTime(fr, t0); if (det) O.detune.value = det; O.connect(dest); O.start(t0); O.stop(fin); return O; };
  const bruit = (t0, fin, dest) => { const S = ctx.createBufferSource(); S.buffer = BR; S.loop = true; S.connect(dest); S.start(t0, Math.random() * 1.5); S.stop(fin); return S; };
  const filtre = (type, fr, q, dest) => { const F = ctx.createBiquadFilter(); F.type = type; F.frequency.value = fr; F.Q.value = q; F.connect(dest); return F; };
  const lacher = (S, G) => { S.onended = () => G.disconnect(); };
  // ---- les instruments ----
  const boite = (fr, t0, v, pan = .15) => {                       // la boîte à musique : une lame pincée, son harmonique de cloche
    const G = voie(pan), fin = env(G, t0, .002, v, 0, 1.3); lacher(osc('sine', fr, t0, fin, G), G);
    const H = voie(pan), f2 = env(H, t0, .002, v * .28, 0, .45); lacher(osc('sine', fr * 4.02, t0, f2, H), H);
    const T = voie(pan), f3 = env(T, t0, .002, v * .16, 0, .7); lacher(osc('triangle', fr * 2, t0, f3, T), T);
  };
  const tic = (t0, v, aigu) => {                                   // le balancier : un déclic de bois et de métal
    const G = voie(aigu ? .25 : -.25), fin = env(G, t0, .001, v, 0, .035); lacher(bruit(t0, fin, filtre('bandpass', aigu ? 3400 : 1900, 5, G)), G);
    const C = voie(aigu ? .25 : -.25), f2 = env(C, t0, .001, v * .6, 0, .02); lacher(osc('sine', aigu ? 2600 : 1500, t0, f2, C), C);
  };
  const pilon = (t0, v) => {                                       // le marteau-pilon : une chute de hauteur, un choc sourd
    const G = voie(), fin = env(G, t0, .002, v, .03, .35), O = osc('sine', 130, t0, fin, G); O.frequency.exponentialRampToValueAtTime(40, t0 + .14); lacher(O, G);
    const C = voie(), f2 = env(C, t0, .001, v * .35, 0, .06); lacher(bruit(t0, f2, filtre('lowpass', 900, .7, C)), C);
  };
  const vapeur = (t0, v, d) => { const G = voie(.3), fin = env(G, t0, .015, v, d, .12); lacher(bruit(t0, fin, filtre('highpass', 3600, .8, G)), G); };
  const enclume = (fr, t0, v) => {                                 // l'enclume : des partiels qui ne s'accordent pas
    for (const [r, g, dd] of [[1, 1, .9], [2.41, .5, .6], [3.93, .3, .4], [5.6, .18, .25]]) { const G = voie(-.15), fin = env(G, t0, .001, v * g, 0, dd); lacher(osc('sine', fr * r, t0, fin, G), G); }
    const C = voie(-.15), f2 = env(C, t0, .001, v * .5, 0, .02); lacher(bruit(t0, f2, filtre('highpass', 5000, .7, C)), C);
  };
  const basse = (fr, t0, d, v) => { const G = voie(), fin = env(G, t0, .004, v, d * .5, .1), F = filtre('lowpass', 520, 2.2, G); lacher(osc('sawtooth', fr, t0, fin, F), G); osc('square', fr / 2, t0, fin, filtre('lowpass', 200, .7, G)); };
  const orgue = (frs, t0, d, v) => { for (const fr of frs) { const G = voie((Math.random() - .5) * .4), fin = env(G, t0, .7, v, Math.max(0, d - .7), 1.4), F = filtre('lowpass', 1100, .8, G);
    lacher(osc('sawtooth', fr, t0, fin, F, -7), G); osc('sawtooth', fr, t0, fin, F, 7); osc('sine', fr / 2, t0, fin, G); } };
  const cuivre = (frs, t0, d, v) => { for (const fr of frs) {
    const G = voie((Math.random() - .5) * .3), fin = env(G, t0, .02, v, d, .16), F = filtre('lowpass', 500, 2, G);
    F.frequency.setValueAtTime(500, t0); F.frequency.exponentialRampToValueAtTime(4600, t0 + .05); F.frequency.exponentialRampToValueAtTime(1300, t0 + .05 + d);
    const O = osc('sawtooth', fr * .97, t0, fin, F, 4); O.frequency.exponentialRampToValueAtTime(fr, t0 + .04); lacher(O, G); } };
  const cloche = (fr, t0, v) => {                                  // la grande cloche de l'horloge : le bourdon, la tierce mineure, la quinte
    for (const [r, g, dd] of [[.5, .7, 4.5], [1, 1, 3.6], [1.19, .45, 3], [1.5, .3, 2.4], [2, .35, 2], [2.66, .2, 1.4], [3.01, .12, 1]]) { const G = voie(.05), fin = env(G, t0, .003, v * g, 0, dd); lacher(osc('sine', fr * r, t0, fin, G), G); } };
  const tom = (fr, t0, v) => { const G = voie(fr > 120 ? .2 : -.2), fin = env(G, t0, .003, v, .02, .3), O = osc('sine', fr * 1.5, t0, fin, G); O.frequency.exponentialRampToValueAtTime(fr, t0 + .1); lacher(O, G); };
  const caisse = (t0, v) => { const G = voie(-.06), fin = env(G, t0, .002, v, 0, .1); lacher(bruit(t0, fin, filtre('bandpass', 1900, .8, G)), G); };
  const montee = (t0, d, v) => { const G = voie(), fin = env(G, t0, d * .9, v, 0, .12), F = filtre('bandpass', 400, 1.4, G); F.frequency.setValueAtTime(350, t0); F.frequency.exponentialRampToValueAtTime(6500, t0 + d); lacher(bruit(t0, fin, F), G); };
  // ---- la partition ----
  const P_ = RG_PARTIES, st = { p: 'I', m: 0, s: 0 };
  const OST = [0, 0, 12, 0, 7, 0, 12, 10, 0, 0, 12, 0, 7, 12, 10, 7];   // la basse de l'automate
  const tierce = (n, ac) => { let best = n - 12; for (const a of ac) for (const o of [-12, 0, 12, 24]) { const q = a + o; if (q <= n - 3 && q > best) best = q; } return best; };
  function pas(t0, I) {
    const Pt = P_[st.p], m = st.m, s = st.s, ac = Pt.acc[m], R = ac[0], nb = Pt.acc.length, p = st.p, calme = I < .45;
    const chant = (oct, v, harm) => { let b = 0; for (const [n, dd] of Pt.chant[m]) { if (b === s) { boite(f(n + oct), t0, v); if (harm) boite(f(tierce(n, ac) + oct), t0, v * .6, -.2); if (oct > 0) boite(f(n + oct - 12), t0, v * .5, -.1); } b += dd; } };
    if (p === 'D') {                                               // le pont : la grande horloge sonne, puis le cliquet s'emballe
      if (s % 4 === 0) tic(t0, .05, (s / 4) % 2 === 0);
      if (m === 0 && s === 0) orgue([f(R - 24), f(ac[2] - 24)], t0, 6 * 16 * E, .018);
      if (m < 4 && s % 4 === 0) cloche(f([7, 3, 5, 0, 0, 5, 7, 3, 7, 5, 3, 0, 0, 7, 3, -5][m * 4 + s / 4] - 12), t0, .05);
      if (m >= 4 && m < 6 && s === 0) boite(f(Pt === P_.D ? [7, 8, 7, 3][m - 4] : 0), t0, .05);
      if (m >= 6) { const r = ((m - 6) * 16 + s) / 32; if (s % (r > .5 ? 1 : 2) === 0) tic(t0, .03 + .06 * r, s % 4 === 0); if (s % 2 === 0) caisse(t0, .03 + .12 * r);
        if (m === 6 && s === 0) montee(t0, 32 * E, .08); if (m === 7 && s >= 12) tom([200, 170, 140, 110][s - 12], t0, .3); }
      if (s === 0 && m % 2 === 0) basse(f(R - 24), t0, E * 14, .06);
    } else if (p === 'I') {                                         // l'ouverture : le balancier, l'orgue, une cloche
      if (s % 4 === 0) tic(t0, .06, (s / 4) % 2 === 0);
      if (m === 0 && s === 0) orgue([f(R - 24), f(ac[1] - 12), f(ac[2] - 12)], t0, nb * 16 * E, .02);
      if ((m === 0 || m === 2) && s === 0) cloche(f(R - 12), t0, .05);
      if ((m === 1 || m === 3) && s % 4 === 0) boite(f([7, 8, 7, 3][s / 4] + (m === 3 ? -1 : 0)), t0, .045);
      if (m === nb - 1 && s === 0) montee(t0, 16 * E, .05);
      if (m === nb - 1 && s >= 12) tom([180, 150, 120, 100][s - 12], t0, .2);
    } else {                                                       // l'ostinato, le thème, le sommet
      const sommet = p === 'C', theme = p === 'B' || sommet, k = .6 + .4 * I;
      if (s % 2 === 0) tic(t0, s % 4 === 0 ? .075 : .05, (s / 2) % 2 === 0);
      basse(f(R - 24 + OST[s]), t0, E * .9, (s % 4 === 0 ? .12 : .085) * k * (calme ? .7 : 1));
      if (sommet && s % 2 === 0) basse(f(R - 12 + OST[s]), t0, E * .8, .05);
      if (!calme) {
        if (s === 0 || s === 8 || (sommet && (s === 4 || s === 12))) pilon(t0, sommet ? .5 : .42);
        if (s === 4 || s === 12) { if (sommet) { enclume(f(R + 12), t0, .05); caisse(t0, .12); } else vapeur(t0, .035, E * .6); }
        if (sommet && s % 4 === 2) vapeur(t0, .025, E * .4);
        if (s === 0 && m % 2 === 0) enclume(f(R + 12), t0, .045);
      } else if (s === 0 && m % 2 === 0) enclume(f(R + 24), t0, .025);
      if (s === 0 && (theme || m % 2 === 0)) orgue([f(R - 12), f(ac[1] - 12), f(ac[2] - 12)], t0, (theme ? 16 : 32) * E, theme ? .018 : .014);
      if (theme) chant(sommet ? 12 : 0, sommet ? .075 : .07, sommet);
      if (sommet && s === 0) cuivre([f(R - 12), f(ac[1] - 12), f(ac[2] - 12)], t0, E * 3, .045);
      if (sommet && s === 10) cuivre([f(R - 12), f(ac[2] - 12)], t0, E * 1.2, .035);
      if (sommet && m === 0 && s === 0) cloche(f(R - 12), t0, .05);
      if (!calme && m === nb - 1 && s >= 12) tom([200, 170, 140, 110][s - 12], t0, .32);
    }
    if (++st.s === 16) { st.s = 0; if (++st.m === nb) st.m = 0; }
  }
  return {
    jouer(p, I, t0 = .05) { Object.assign(st, { p, m: 0, s: 0 }); const n = P_[p].acc.length * 16; for (let i = 0; i < n; i++) pas(t0 + i * E, I); },
  };
}
const RG_RENDUS = {};
function rendreRouages() {
  if (RG_RENDUS.lance || typeof OfflineAudioContext === 'undefined') return; RG_RENDUS.lance = true;
  const SR = 24000, TRAINE = 4.5, VERSIONS = [['I', 'I', .4], ['Ac', 'A', .3], ['Bc', 'B', .3], ['D', 'D', .5], ['A', 'A', .75], ['B', 'B', .75], ['C', 'C', .95]];
  (async () => {
    for (const [cle, p, I] of VERSIONS) {
      try { const off = new OfflineAudioContext(2, Math.ceil(SR * (rgDuree(p) + TRAINE)), SR); partitionRouages(off, off.destination).jouer(p, I); RG_RENDUS[cle] = await off.startRendering(); }
      catch (e) { /* cette partie restera muette */ }
    }
  })();
}
// Le lecteur : maj(maintenant, intensité) à chaque mise à jour de la musique ; s'il cesse d'être appelé, il se tait.
function rouagesMusique(ctx, sortie, depart = 'I') {
  rendreRouages();
  const G = ctx.createGain(); G.connect(sortie);
  const st = { ok: false, vu: 0, p: depart, cour: depart, fin: 0, n: 0, sons: [] };
  return {
    maj(now, I) {
      I = Math.max(0, Math.min(1, I));
      if (!st.ok || now - st.vu > .6) {
        for (const S of st.sons) try { S.stop(); } catch (e) { /* déjà fini */ }
        Object.assign(st, { ok: true, p: depart, cour: depart, fin: now + .05, n: 0, sons: [] });
      }
      st.vu = now;
      G.gain.cancelScheduledValues(now); G.gain.setValueAtTime(1, now); G.gain.setTargetAtTime(0, now + .6, .25);   // l'homme mort
      while (st.fin < now + .7) {
        const cle = (st.p === 'A' || st.p === 'B') && I < .45 && RG_RENDUS[st.p + 'c'] ? st.p + 'c' : st.p, B = RG_RENDUS[cle];
        if (!B) { st.fin = Math.max(st.fin, now + .05); break; }
        const S = ctx.createBufferSource(), t0 = Math.max(st.fin, now); S.buffer = B; S.connect(G); S.start(t0);
        S.onended = () => { S.disconnect(); st.sons = st.sons.filter(x => x !== S); }; st.sons.push(S);
        st.cour = st.p; st.fin = t0 + rgDuree(st.p); st.n++; st.p = rgSuite(st.p, I, st.n);
      }
    },
    get partie() { return st.cour; },
  };
}
// Le danger, pour la musique : l'exploration (un quart), une machine qui vous a vu, une salle refermée, l'Horloge.
function rouagesIntensite() {
  if (!rouagesIci()) return 0;
  let I = DJ.e === DJ.n ? .4 : .25;
  for (const b of beasts) if (b.djIdx !== undefined && !b.dead && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 18 * 18 && (b.etat === 'viser' || b.etat === 'assaut' || b.etat === 'guet'))
    I = Math.max(I, b.sp.id === 'gardien' ? 1 : .82);
  if (DJ.salles.some(q => q.fermee)) I = 1;
  CT.I += (I - CT.I) * (I > CT.I ? .5 : .025);
  return CT.I;
}
