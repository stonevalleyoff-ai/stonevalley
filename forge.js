// ============================================================
//  LA FORGE (forge.js) — §171, phase A
//  Une arme se forge comme une potion se prépare : un plan, une charge de matières, la chauffe au soufflet,
//  le martelage en rythme, les plis, l'âme (des ingrédients versés sur le métal rouge, dans l'ordre), la trempe
//  (un bain, une durée), l'affûtage à la meule, la monture. Les gestes se font en temps réel, et le métal
//  refroidit pendant qu'on travaille.
//  LA RECETTE FAIT L'ARME : le plan, la charge, le nombre de coups, les plis, l'âme, le bain et la monture
//  fixent sa forme, son allure et sa COMPÉTENCE (l'élément vient de l'âme, le déclencheur des plis, la forme
//  du bain). L'EXÉCUTION FAIT SA PUISSANCE : la justesse des gestes (0 à 100 %) ; à 97 % et plus, un
//  chef-d'œuvre. Deux joueurs qui suivent la même fiche obtiennent la même arme.
//  Chaque arme porte son CODE (FG-…), que l'on peut lire à la forge : ce qu'on en déchiffre dépend du niveau
//  de la forge, et une ligne se déchiffre aussi avec des éclats. Elle s'use (longuement), se répare à la forge,
//  se donne à un équipier. L'identifiant d'une arme forgée est son code et sa justesse : le jeu, et ceux d'en
//  face, la reconstruisent d'après lui (forgeObjet).
//  Phase A : la forge, ses gestes, les fiches, et six armes (dague, épée, lance, hache, marteau, arc court) ;
//  les vingt-trois autres sont décrites ici (FG_TYPES) et viendront avec leurs mécaniques.
//  index.html appelle, s'ils existent : forgeInit, forgeObjet (objet), forgeBase, forgeGeom (geomArme),
//  forgeAvant / forgeApres (coupArme), forgeFleche (impactFleche), forgeChargeDown / forgeChargeUp et
//  forgeRafale (attaquerDown / attaquerUp), forgeAction, forgeDecor (marmiteDecor), forgeCaseCamp, forgeBatir,
//  forgeSauve / forgeLue, forgeRecue ; donjon.js : forgeMaj (à chaque image).
// ============================================================
const FG = { projs: [], vol: {}, jav: {}, modes: {}, pile: { n: 0, t: -9 }, riposte: 0, el: null, en: null, choix: 0, vue: 'forger', h: {}, msg: '', msgT: 0, souffle: false, gauche: false, droite: false,
  lieu: null, lieuK: '', zones: [], traits: [], buff: null, aura: null, serie: 0, serieT: -9, charge: null, rafale: [], riposteVu: -1,
  fiche: null, lu: '', anim: { coup: -9, pli: -9, verse: -9, plonge: -9 } };
// ---------- les vingt-neuf armes ----------
// anim : le geste et la garde empruntés ; deg, cad, port : la base ; chauffe : la couleur juste (0 à 1) ; trempe : les
// secondes au bain (eau) ; meca : ce qu'elle fait de propre ; ph : la phase où elle arrive (A : maintenant).
const FG_TYPES = [
  { id: 'dague', n: 'Dague', f: 1, anim: 'lame', deg: .46, cad: .22, port: 1.45, long: .26, chauffe: .6, trempe: 3, ph: 'A', meca: 'très rapide ; dans le dos, trois fois les dégâts' },
  { id: 'epee', n: 'Épée', f: 1, anim: 'epee', seq: ['epee', 'epee2', 'epee'], deg: .7, cad: .38, port: 1.85, long: .36, chauffe: .64, trempe: 4, ph: 'A', meca: 'trois coups en série : le troisième frappe une fois et demie plus fort' },
  { id: 'lance', n: 'Lance', f: 1, anim: 'lance', deg: .6, cad: .46, port: 2.6, long: .58, chauffe: .6, trempe: 4, ph: 'A', meca: 'longue portée ; l\'estoc traverse et touche aussi la bête de derrière' },
  { id: 'hache', n: 'Hache', f: 1, anim: 'gourdin', deg: .92, cad: .52, port: 1.7, long: .37, chauffe: .66, trempe: 5, ph: 'A', meca: 'fend boucliers et carapaces ; fait saigner' },
  { id: 'marteau', n: 'Marteau', f: 0, anim: 'marteau', deg: 1.7, cad: .66, port: 1.9, long: .36, chauffe: .7, trempe: 6, ph: 'A', meca: 'lourd ; l\'onde du choc étourdit tout autour' },
  { id: 'arccourt', n: 'Arc court', f: 0, anim: 'arc', arc: 1, deg: .55, cad: 0, port: 0, long: .2, chauffe: .52, trempe: 3, ph: 'A', meca: 'une rafale de trois flèches' },
  // phase B : la mêlée nouvelle (§172)
  { id: 'rapiere', n: 'Rapière', f: 1, anim: 'lame', deg: .5, cad: .26, port: 2.1, long: .42, chauffe: .62, trempe: 3.5, ph: 'B', meca: 'estocs précis (un sur cinq porte double) ; frappez juste avant d\'être touché : la parade, puis une riposte qui porte deux fois et demie' },
  { id: 'sabre', n: 'Sabre', f: 0, anim: 'epee', deg: .72, cad: .36, port: 1.9, long: .38, chauffe: .66, trempe: 4, ph: 'B', meca: 'le coup dégainé : maintenir, lâcher, et la fente traverse tout sur trois pas et demi' },
  { id: 'griffes', n: 'Griffes', f: 1, anim: 'lame', deg: .32, cad: .2, port: 1.25, long: .18, chauffe: .6, trempe: 3, ph: 'B', meca: 'chaque coup qui porte accélère et renforce le suivant, cinq fois' },
  { id: 'fleau', n: 'Fléau', f: 0, anim: 'gourdin', deg: .85, cad: .55, port: 2.2, long: .42, chauffe: .68, trempe: 5, ph: 'B', meca: 'la boule balaie devant vous, et l\'élan monte coup après coup' },
  { id: 'espadon', n: 'Espadon', f: 0, anim: 'epee', deg: 1.15, cad: .72, port: 2.3, long: .5, chauffe: .68, trempe: 6, ph: 'B', meca: 'un balayage lent, tout autour de vous' },
  { id: 'faux', n: 'Faux', f: 1, anim: 'epee', deg: .78, cad: .6, port: 2.4, long: .6, chauffe: .62, trempe: 5, ph: 'B', meca: 'un grand arc devant vous, qui vole la vie de chaque cible' },
  { id: 'hallebarde', n: 'Hallebarde', f: 1, anim: 'lance', seq: ['lance', 'lance'], deg: .82, cad: .56, port: 2.6, long: .62, chauffe: .66, trempe: 5, ph: 'B', meca: 'un balayage, puis le crochet qui tire la bête à vous' },
  { id: 'baton', n: 'Bâton', f: 0, anim: 'lance', deg: .45, cad: .32, port: 2.2, long: .45, chauffe: .5, trempe: 3, ph: 'B', meca: 'repousse loin ; frappez juste avant d\'être touché : il tourne et amortit le coup' },
  { id: 'epeefouet', n: 'Épée-fouet', f: 1, anim: 'epee', deg: .6, cad: .42, port: 1.9, long: .38, chauffe: .64, trempe: 4.5, ph: 'B', meca: 'maintenir, lâcher : la lame se déroule en fouet (portée 4, elle tire) ou se referme' },
  // phase C : le lancer, la distance
  { id: 'chakram', n: 'Chakram', f: 0, anim: 'lame', lance: 1, deg: .62, cad: .42, port: 1.3, long: .2, chauffe: .6, trempe: 3.5, ph: 'C', meca: 'lancé, il file sur dix pas, rebondit jusqu\'à trois fois de bête en bête, puis revient dans la main ; maintenir, lâcher : cinq rebonds, plus fort' },
  { id: 'javelots', n: 'Javelots', f: 0, anim: 'lance', lance: 1, deg: .85, cad: .5, port: 1.8, long: .5, chauffe: .6, trempe: 4, ph: 'C', meca: 'trois en main : lancés, ils se plantent ; maintenir, lâcher (ou la main vide) : ils reviennent, et frappent au retour' },
  { id: 'arclong', n: 'Arc long', f: 0, anim: 'arc', arc: 1, vK: 1.25, perce: 3, deg: 1.05, cad: 0, port: 0, long: .26, chauffe: .54, trempe: 3.5, ph: 'C', meca: 'tire plus loin ; bandé à fond, la flèche traverse jusqu\'à trois bêtes' },
  { id: 'arbaletef', n: 'Arbalète', f: 1, anim: 'arbalete', arc: 1, vK: 1.45, deg: 1.35, cad: 0, port: 0, long: .3, chauffe: .64, trempe: 4.5, ph: 'C', meca: 'un carreau lourd qui repousse ; la bête adossée à un mur ou un tronc y est clouée (étourdie trois secondes, une fois et demie les dégâts)' },
  { id: 'fronde', n: 'Fronde', f: 1, anim: 'gourdin', lance: 1, deg: .42, cad: .36, port: 1.2, long: .3, chauffe: .5, trempe: 2.5, ph: 'C', meca: 'des billes qui rebondissent sur le sol et ricochent de bête en bête ; maintenir, lâcher : trois billes en éventail' },
  // phase D : la magie
  { id: 'batonmage', n: 'Bâton de mage', f: 0, anim: 'lance', deg: .4, ph: 'D', meca: 'charge un sort plus gros' },
  { id: 'baguette', n: 'Baguette', f: 1, anim: 'lame', deg: .25, ph: 'D', meca: 'des sorts rapides et moins chers, en rafale' },
  { id: 'orbe', n: 'Orbe', f: 0, anim: 'gourdin', deg: .3, ph: 'D', meca: 'un sort tourne autour de vous et part seul' },
  { id: 'lamerunique', n: 'Lame runique', f: 1, anim: 'epee', deg: .62, ph: 'D', meca: 'les coups la remplissent ; elle libère le sort de l\'âme' },
  // phase E : la poudre
  { id: 'pistolet', n: 'Pistolet à silex', f: 0, anim: 'arbalete', deg: 1.3, ph: 'E', meca: 'un coup fort, long à recharger ; on en tient deux' },
  { id: 'tromblon', n: 'Tromblon', f: 0, anim: 'arbalete', deg: .9, ph: 'E', meca: 'une gerbe de plombs en cône, qui vous repousse' },
  { id: 'mousquet', n: 'Mousquet', f: 0, anim: 'arbalete', deg: 1.8, ph: 'E', meca: 'long, précis, perçant ; la fumée, le rechargement' },
  { id: 'revolver', n: 'Revolver', f: 0, anim: 'arbalete', deg: .8, ph: 'E', meca: 'six coups rapides, puis le barillet' },
  { id: 'canon', n: 'Canon à main', f: 0, anim: 'arbalete', deg: 2.2, ph: 'E', meca: 'un obus en cloche qui éclate' },
];
const FG_PHASE = 'C', fgDispo = T => T.ph <= FG_PHASE;
// Les plans : ceux de la phase A sont à la forge ; les autres se trouvent (coffres du Centre et des Cercles), et se gardent.
const fgConnu = T => fgDispo(T) && (T.ph === 'A' || essai || ((typeof P !== 'undefined' && P.forgePlans) || []).includes(T.id));
// Un coffre d'en bas : parfois un plan qu'on n'a pas. Il est appris sur-le-champ, et ne se perd pas à la mort.
const FG_PLAN_K = { centre: { petit: .06, garde: .25, grand: .6 }, cercles: { petit: .05, garde: .35, scelle: .3 } };
function forgePlanCoffre(taille, src) {
  const k = (FG_PLAN_K[src] || {})[taille] || 0; if (!(Math.random() < k)) return '';
  const L = FG_TYPES.filter(T => fgDispo(T) && !fgConnu(T)); if (!L.length) return '';
  const T = L[Math.random() * L.length | 0]; fgEtat(); P.forgePlans.push(T.id); Sauve.sale = true;
  return 'plan : ' + T.n.toLowerCase();
}
// ---------- les matières de la charge (dans l'ordre du code) ----------
// tr : le tranchant ; du : la dureté ; p : le poids ; ch : la chauffe juste ; q : ce que coûte une portion
const FG_MAT = [
  { id: 'ferraille', n: 'ferraille', alli: 'acier', tr: .55, du: .62, p: .6, ch: .64, q: 8, c: [150, 154, 166] },
  { id: 'pierre', n: 'pierre', alli: 'pierre', tr: .25, du: .48, p: .9, ch: .56, q: 10, c: [134, 130, 122] },
  { id: 'os', n: 'os', alli: 'os', tr: .42, du: .3, p: .25, ch: .44, q: 6, c: [224, 214, 190] },
  { id: 'eclat', n: 'éclat', alli: 'éclat', tr: .92, du: .36, p: .3, ch: .72, q: 6, c: [126, 224, 236] },
  { id: 'ferdamne', n: 'fer damné', alli: 'fer damné', ingr: 1, tr: .78, du: .95, p: .72, ch: .8, q: 1, c: [86, 42, 44] },
];
const FG_BAINS = [
  { id: 'eau', n: 'eau', t: 0, cout: {}, d: 'dure : la compétence porte sur le coup lui-même' },
  { id: 'huile', n: 'huile', t: 2.5, fam: 'graine', nb: 2, d: 'souple : elle se répand au sol, en zone' },
  { id: 'sang', n: 'sang', t: 1.5, fam: 'viande', nb: 2, d: 'vivante : elle passe sur vous' },
  { id: 'nectar', n: 'nectar', t: 1, fam: 'douceur', nb: 1, d: 'lumineuse : elle part en trait' },
  { id: 'neige', n: 'neige d\'éclat', t: -.6, res: 'eclat', nb: 6, d: 'froide : elle vous entoure d\'une aura' },
];
const FG_MONT = [
  { id: 'bois', n: 'bois', res: 'bois', nb: 4, c: [112, 80, 52] }, { id: 'os', n: 'os', res: 'os', nb: 3, c: [214, 204, 180] },
  { id: 'cuir', n: 'cuir', res: 'fibre', nb: 6, c: [96, 64, 44] }, { id: 'laiton', n: 'laiton', res: 'ferraille', nb: 4, c: [184, 148, 76] },
];
const FG_CHAUD = [[.2, 'noir'], [.38, 'rouge sombre'], [.52, 'rouge cerise'], [.66, 'orange'], [.8, 'jaune'], [1.01, 'blanc']];
const fgCouleurNom = v => (FG_CHAUD.find(([s]) => v < s) || FG_CHAUD[5])[1];
// la couleur du métal à cette chaleur (du gris froid au blanc)
function fgCouleurChaud(v, base) {
  const P = [[0, base || [92, 92, 100]], [.25, [96, 30, 22]], [.4, [168, 34, 24]], [.52, [222, 64, 28]], [.66, [255, 128, 36]], [.8, [255, 206, 80]], [.92, [255, 246, 214]], [1, [255, 255, 255]]];
  for (let i = 1; i < P.length; i++) if (v <= P[i][0]) { const f = (v - P[i - 1][0]) / (P[i][0] - P[i - 1][0]); return P[i].map((c, k) => P[i - 1][1][k] + (c - P[i - 1][1][k]) * f | 0); }
  return [255, 255, 255];
}
// ---------- les éléments, et ce que les ingrédients y apportent ----------
const FG_ELEM = {
  feu: { n: 'feu', c: [255, 120, 40], hex: '#ff8a30', mots: ['Braise', 'Cendre', 'Tison', 'Fournaise'] },
  givre: { n: 'givre', c: [150, 220, 255], hex: '#bfe8ff', mots: ['Givre', 'Frimas', 'Bise', 'Glace'] },
  foudre: { n: 'foudre', c: [200, 170, 255], hex: '#d4b8ff', mots: ['Orage', 'Éclair', 'Tonnerre', 'Foudre'] },
  poison: { n: 'poison', c: [140, 220, 90], hex: '#9fe070', mots: ['Venin', 'Ronce', 'Fiel', 'Ortie'] },
  vie: { n: 'vie', c: [255, 90, 110], hex: '#ff6a80', mots: ['Sève', 'Cœur', 'Sang', 'Racine'] },
  ombre: { n: 'ombre', c: [120, 90, 170], hex: '#9a78d0', mots: ['Ombre', 'Nuit', 'Brume', 'Voile'] },
  lumiere: { n: 'lumière', c: [255, 236, 160], hex: '#fff0a8', mots: ['Aube', 'Lueur', 'Soleil', 'Clarté'] },
  seisme: { n: 'séisme', c: [200, 160, 110], hex: '#d4aa70', mots: ['Roc', 'Faille', 'Pierre', 'Grondement'] },
  vent: { n: 'vent', c: [190, 240, 220], hex: '#c4f4e0', mots: ['Bourrasque', 'Souffle', 'Zéphyr', 'Rafale'] },
};
const FG_OPPOSES = [['feu', 'givre'], ['lumiere', 'ombre'], ['vie', 'poison'], ['seisme', 'vent']];
const FG_TAG = { braise: 'feu', gel: 'givre', nuit: 'lumiere', antidote: 'lumiere', invisible: 'ombre', silence: 'ombre', vif: 'vent', souffle: 'vent', second: 'vent', saut: 'vent', plume: 'vent',
  fort: 'seisme', robuste: 'seisme', cueilleur: 'seisme', epines: 'poison', vampire: 'vie', surplus: 'vie', coeur: 'vie', apprivoiseur: 'vie', repousse: 'foudre', meute: 'foudre' };
const FG_FAM = { viande: 'vie', poisson: 'givre', fruit: 'vent', racine: 'seisme', graine: 'seisme', fleur: 'lumiere', feuille: 'vent', champignon: 'poison', douceur: 'lumiere', demon: 'feu' };
const FG_IDS = { ferdamne: 'feu', oeufbraise: 'feu', fleursoufre: 'poison', sangroi: 'vie', poussame: 'ombre', nectar: 'lumiere' };
const fgElemDe = id => { const i = INGR[id]; return !i ? null : FG_IDS[id] || FG_TAG[i.tag] || FG_FAM[i.fam] || 'vent'; };
const fgRang = i => i.r >= 6 ? 4 : i.r >= 5 ? 3 : i.r >= 3 ? 2 : 1;
const FG_DECL = ['chaque', 'serie', 'charge', 'dos', 'tuer', 'riposte'];
const FG_DECL_TXT = { chaque: 'à chaque coup, une fois sur quatre', serie: 'au troisième coup d\'une série', charge: 'sur un coup chargé (maintenir, puis lâcher)',
  dos: 'dans le dos', tuer: 'en tuant', riposte: 'en riposte, juste après avoir été touché' };
const FG_FORMES = ['coup', 'zone', 'soi', 'trait', 'aura'];
const FG_FORME_TXT = {
  coup: { feu: 'la cible s\'embrase', givre: 'la cible gèle sur place', foudre: 'la foudre jaillit et saute de bête en bête', poison: 'la cible est empoisonnée', vie: 'le coup vous rend de la vie',
    ombre: 'vous vous fondez dans l\'ombre', lumiere: 'un éclair vous soigne et aveugle alentour', seisme: 'la cible est étourdie', vent: 'une rafale projette la cible' },
  zone: { feu: 'le sol s\'embrase autour d\'elle', givre: 'le sol se couvre de givre : ce qui y marche est ralenti', foudre: 'le sol crépite et foudroie', poison: 'une flaque de venin s\'étend',
    vie: 'un cercle de sève vous soigne si vous y restez', ombre: 'une nappe d\'ombre aveugle ce qui y entre', lumiere: 'un cercle de lumière soigne et aveugle', seisme: 'le sol se fend et étourdit', vent: 'un tourbillon repousse tout' },
  soi: { feu: 'vos coups brûlent quelques secondes', givre: 'le givre vous couvre : peau dure', foudre: 'vos coups s\'arquent de bête en bête', poison: 'vos coups empoisonnent', vie: 'votre vie remonte d\'elle-même',
    ombre: 'vous devenez invisible', lumiere: 'la lumière vous soigne', seisme: 'vos coups étourdissent et portent plus fort', vent: 'votre pas s\'allège' },
  trait: { feu: 'un trait de feu part vers la bête suivante', givre: 'un trait de givre part vers la bête suivante', foudre: 'un éclair file vers la bête suivante', poison: 'un dard de venin part vers la bête suivante',
    vie: 'un trait de sève draine la bête suivante', ombre: 'un trait d\'ombre aveugle la bête suivante', lumiere: 'un rayon frappe la bête suivante', seisme: 'une onde file au sol vers la bête suivante', vent: 'une lame de vent file vers la bête suivante' },
  aura: { feu: 'une aura de feu vous entoure', givre: 'une aura de givre ralentit qui approche', foudre: 'une aura d\'orage foudroie qui approche', poison: 'une aura de venin vous entoure', vie: 'une aura de sève vous soigne',
    ombre: 'une aura d\'ombre aveugle qui approche', lumiere: 'une aura de lumière soigne et éblouit', seisme: 'une aura de grondement étourdit qui approche', vent: 'une aura de vent repousse qui approche' },
};

// ============================================================
//  LA RECETTE, SON CODE
//  type 5 bits · charge 5 × 3 · coups 4 (6 à 21) · plis 3 · bain 3 · monture 2 · âme 3 × 10 (un ingrédient, haché)
// ============================================================
const FG_ALPH = '0123456789abcdefghjkmnpqrstvwxyz';
const fgHache = id => { let h = 2166136261 >>> 0; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0; return h % 1023 + 1; };
let FG_PAR_H = null, FG_PAR_HN = 0;
const fgIngrDeH = h => { const n = Object.keys(INGR).length; if (!FG_PAR_H || FG_PAR_HN !== n) { FG_PAR_H = new Map(); FG_PAR_HN = n; for (const id of Object.keys(INGR)) if (!FG_PAR_H.has(fgHache(id))) FG_PAR_H.set(fgHache(id), id); } return FG_PAR_H.get(h) || null; };
function fgEncode(R) {
  let v = 0n; const pose = (x, n) => { v = (v << BigInt(n)) | BigInt(Math.max(0, x | 0) & ((1 << n) - 1)); };
  pose(R.type, 5); for (let k = 0; k < 5; k++) pose(R.ch[k], 3); pose(R.coups - 6, 4); pose(R.plis, 3); pose(R.bain, 3); pose(R.mont, 2);
  for (let k = 0; k < 3; k++) pose(R.ame[k] ? fgHache(R.ame[k]) : 0, 10);
  let s = ''; for (let k = 0; k < 13; k++) { s = FG_ALPH[Number(v & 31n)] + s; v >>= 5n; }
  return s;
}
function fgDecode(s) {
  if (typeof s !== 'string' || !/^[0-9a-hjkmnp-tv-z]{13}$/.test(s)) return null;
  let v = 0n; for (const c of s) v = (v << 5n) | BigInt(FG_ALPH.indexOf(c));
  const lit = n => { const x = Number(v & BigInt((1 << n) - 1)); v >>= BigInt(n); return x; };
  const ame = []; for (let k = 0; k < 3; k++) ame.unshift(lit(10));
  const mont = lit(2), bain = lit(3), plis = lit(3), coups = lit(4) + 6, ch = []; for (let k = 0; k < 5; k++) ch.unshift(lit(3));
  const type = lit(5);
  if (!FG_TYPES[type] || bain >= FG_BAINS.length || plis > 5) return null;
  const tot = ch.reduce((a, b) => a + b, 0); if (tot < 2 || tot > 4) return null;
  const A = []; for (const h of ame) if (h) { const id = fgIngrDeH(h); if (!id) return null; A.push(id); }
  return { type, ch, coups, plis, bain, mont, ame: A };
}
const fgCodeAffiche = c => 'FG-' + c.slice(0, 4).toUpperCase() + '-' + c.slice(4, 8).toUpperCase() + '-' + c.slice(8).toUpperCase();
const fgCodeLu = s => { const c = String(s || '').toLowerCase().replace(/^fg/, '').replace(/[^0-9a-z]/g, '').replace(/[ilo]/g, m => ({ i: '1', l: '1', o: '0' })[m]); return c.length === 13 ? c : null; };
// L'identifiant d'une arme forgée : « fg », son code, et sa justesse (deux chiffres en base 36)
const fgIdDe = (code, j) => 'fg' + code + '_' + Math.max(0, Math.min(100, j | 0)).toString(36).padStart(2, '0');
const FG_LUS = new Map();
function fgLireId(id) {
  if (typeof id !== 'string' || id.length !== 18 || !id.startsWith('fg') || id[15] !== '_') return null;
  let L = FG_LUS.get(id); if (L !== undefined) return L;
  const code = id.slice(2, 15), j = parseInt(id.slice(16), 36), R = fgDecode(code);
  L = R && j >= 0 && j <= 100 ? { code, R, j } : null; FG_LUS.set(id, L); return L;
}
// ---------- ce que la recette donne ----------
function fgAlliage(R) {
  const n = R.ch.reduce((a, b) => a + b, 0) || 1, A = { tr: 0, du: 0, p: 0, ch: 0, c: [0, 0, 0] };
  R.ch.forEach((q, k) => { const M = FG_MAT[k], f = q / n; A.tr += M.tr * f; A.du += M.du * f; A.p += M.p * f; A.ch += M.ch * f; for (let i = 0; i < 3; i++) A.c[i] += M.c[i] * f; });
  A.c = A.c.map(v => v | 0);
  const ord = R.ch.map((q, k) => [q, k]).filter(x => x[0]).sort((a, b) => b[0] - a[0]);
  A.nom = FG_MAT[ord[0][1]].alli + (ord[1] ? ' ' + fgDe(FG_MAT[ord[1][1]].alli) : '');
  A.eclat = R.ch[3] > 0; A.damne = R.ch[4] > 0;
  return A;
}
const fgLong = R => Math.max(.82, Math.min(1.32, .82 + (R.coups - 6) * .036));
const fgCible = R => { const T = FG_TYPES[R.type]; return Math.max(.35, Math.min(.88, fgAlliage(R).ch * .7 + (T.chauffe || .6) * .3)); };
const fgTrempe = R => Math.round(((FG_TYPES[R.type].trempe || 4) + FG_BAINS[R.bain].t + (R.ch[4] ? 1 : 0)) * 10) / 10;
const fgTol = () => (FG_NIV() >= 3 ? 1.4 : 1);
function fgStats(R, j) {
  const T = FG_TYPES[R.type], A = fgAlliage(R), L = fgLong(R), jj = j / 100;
  const deg = T.deg * (.8 + .45 * A.tr) * (1 + .12 * A.du) * (1 + .035 * R.plis) * (L > 1 ? 1 + (L - 1) * .5 : 1 - (1 - L) * .3) * (.72 + .45 * jj) * (j >= 97 ? 1.05 : 1);
  const cad = T.cad * (.88 + .3 * A.p) * (L > 1 ? 1 + (L - 1) * .4 : 1);
  const port = T.port ? T.port * (.86 + .16 * L) : 0;
  const usure = Math.round((2000 + 1400 * A.du + [0, 600, 200, 0, -200][R.bain] + 120 * R.plis) * (j >= 97 ? 2 : 1));
  return { deg: Math.round(deg * 100) / 100, cad: Math.round(cad * 1000) / 1000, port: Math.round(port * 100) / 100, usure, L };
}
function fgAme(R) {
  const cpt = {};
  R.ame.forEach((id, k) => { const el = fgElemDe(id); if (el) cpt[el] = (cpt[el] || 0) + fgRang(INGR[id]) * [1.5, 1, .75][k]; });   // l'ordre compte : le premier pèse plus
  for (const [a, b] of FG_OPPOSES) if (cpt[a] && cpt[b]) { const m = Math.min(cpt[a], cpt[b]); cpt[a] -= m; cpt[b] -= m; }   // deux âmes contraires s'annulent
  const L = Object.entries(cpt).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (!L.length) return null;
  return { el: L[0][0], el2: L[1] ? L[1][0] : null, niv: Math.max(1, Math.min(4, Math.ceil(L[0][1] * .75 + (L[1] ? L[1][1] * .25 : 0)))), decl: FG_DECL[R.plis], forme: FG_FORMES[R.bain] };
}
const FG_ROM = ['', 'I', 'II', 'III', 'IV'];
function fgCompTxt(C) {
  if (!C) return 'aucune : l\'âme est vide, ou deux âmes contraires se sont annulées';
  const t = FG_DECL_TXT[C.decl], f = FG_FORME_TXT[C.forme][C.el];
  return t[0].toUpperCase() + t.slice(1) + ' : ' + f + ' · ' + FG_ELEM[C.el].n + ' ' + FG_ROM[C.niv] + (C.el2 ? ' · nuancée de ' + FG_ELEM[C.el2].n : '');
}
function fgNom(R) {
  const T = FG_TYPES[R.type], C = fgAme(R), A = fgAlliage(R), h = fgHache(fgEncode(R));
  const mot = C ? FG_ELEM[C.el].mots[h % 4] : ['Fer', 'Fil', 'Croc', 'Dent'][h % 4];
  return T.n + ' ' + fgDe(mot) + ' · ' + A.nom;
}
const fgDe = s => (/^[aeiouyéèêâîôûœh]/i.test(s) ? 'd\'' : 'de ') + s;
const FG_NIV = () => (typeof P !== 'undefined' && P.forgeNiv) | 0;
const fgEtat = () => { if (!P.forge) P.forge = {}; if (!P.forgePlans) P.forgePlans = []; if (!P.forgeCarnet) P.forgeCarnet = {}; if (!P.forgeLu) P.forgeLu = {}; return P.forge; };
// ---------- l'objet : enregistré à la demande, d'après son seul identifiant ----------
function forgeBase(id) { const L = fgLireId(id); return L ? FG_TYPES[L.R.type].anim : null; }
function forgeObjet(id) {
  const L = fgLireId(id); if (!L) return undefined;
  const { R, j, code } = L, T = FG_TYPES[R.type], S = fgStats(R, j), C = fgAme(R), A = fgAlliage(R);
  const O = { id, n: fgNom(R).split(' · ')[0], emp: 'arme', fg: 1, offert: 1, cout: {}, type: T.id, code, j, base: T.anim,
    get cad() { return S.cad * fgCadK(id, T.id); }, get port() { return T.id === 'epeefouet' && FG.modes[id] ? 4 : S.port; },
    get deg() { const I = (typeof P !== 'undefined' && P.forge && P.forge[id]) || null; return Math.round(S.deg * (I && I.u >= S.usure ? .6 : 1) * 100) / 100; },
    get d() { const I = (P.forge && P.forge[id]) || null, u = I ? Math.min(1, I.u / S.usure) : 0;
      return 'dégâts ' + Math.round(this.deg * 100) + ' · ' + T.meca + ' · ' + (x => x[0].toLowerCase() + x.slice(1))(fgCompTxt(C)) + ' · forgée ' + j + ' %' + (j >= 97 ? ' (chef-d\'œuvre)' : '')
        + ' · usure ' + Math.round(u * 100) + ' %' + (u >= 1 ? ' : émoussée, à réparer' : '') + (I && I.f ? ' · forgée par ' + I.f : '') + ' · ' + fgCodeAffiche(code); } };
  if (T.arc) O.arc = 1; if (T.vK) O.vK = T.vK; if (T.perce) O.perce = T.perce;
  if (I0(id)) O.n = I0(id);
  OBJETS.push(O);
  // le geste, la garde, l'arme rangée : ceux de sa base ; la longueur suit les coups
  const b = T.anim;
  if (GARDES[b]) GARDES[id] = GARDES[b];
  if (SEQ_ARME[b] || T.seq) SEQ_ARME[id] = T.seq || SEQ_ARME[b];
  if (RANGEES[b]) RANGEES[id] = RANGEES[b];
  if (ARRET_ARME[b] !== undefined) ARRET_ARME[id] = ARRET_ARME[b];
  if (RECUL_ARME[b] !== undefined) RECUL_ARME[id] = RECUL_ARME[b] * (.8 + .5 * A.p);
  LONG_ARME[id] = (T.long || LONG_ARME[b] || .35) * S.L;
  COUL_TRAINEE[id] = C ? FG_ELEM[C.el].hex : '#' + A.c.map(v => Math.min(255, v + 40).toString(16).padStart(2, '0')).join('');
  if (typeof DESSINS === 'object') { DESSINS[id] = d => fgDessin(d, R); if (typeof poserIcone === 'function') try { poserIcone(id); } catch (e) { /* plus tard */ } }
  return O;
}
const I0 = id => typeof P !== 'undefined' && P.forge && P.forge[id] && P.forge[id].n ? String(P.forge[id].n).slice(0, 28) : '';

// ============================================================
//  L'ARME EN MAIN : sa forme vient de la recette (la longueur des coups, l'alliage, les plis, l'âme, la monture)
// ============================================================
function forgeGeom(id, F, J, B) {
  const L = fgLireId(id); if (!L) return false;
  const R = L.R, T = FG_TYPES[R.type], A = fgAlliage(R), C = fgAme(R), M = FG_MONT[R.mont].c, lg = fgLong(R), or = L.j >= 97;
  const lame = A.eclat ? A.c.map(v => Math.min(255, v + 18)) : A.c, fil = C ? FG_ELEM[C.el].c : A.c.map(v => Math.min(255, v + 60)), sombre = A.c.map(v => v * .55 | 0);
  const deco = or ? [255, 214, 120] : A.damne ? [150, 40, 30] : [150, 146, 140];
  if (T.arc && T.anim === 'arbalete') {                             // l'arbalète : son fût de monture, son arc d'acier, ses poulies
    const n0 = B.length; geomArme('arbalete', F, J, B);
    for (let i = n0; i < B.length && i < n0 + 7; i++) { const k = i - n0; B[i].c = k < 2 ? M : k === 2 ? lame : k % 2 ? deco : lame; }
    if (B.length > n0 + 2) { const o = B[n0 + 2], d = nrm(v3.sub(o.b, o.a)); B.push({ a: o.a, b: v3.add(o.a, v3.mul(d, .07)), w: .032, h: .026, c: fil }, { a: o.b, b: v3.add(o.b, v3.mul(d, -.07)), w: .032, h: .026, c: fil }); }
    return true;
  }
  if (T.arc) {
    const n0 = B.length, ext = T.id === 'arclong' ? .11 : .03; geomArme('arc', F, J, B);
    for (let i = n0; i < n0 + 5 && i < B.length; i++) B[i].c = i === n0 + 2 ? M : lame;
    if (B.length >= n0 + 5) for (const [o, k] of [[B[n0], 'a'], [B[n0 + 4], 'b']]) { const d = nrm(v3.sub(o[k], k === 'a' ? o.b : o.a)), q = v3.add(o[k], v3.mul(d, ext));
      B.push({ a: o[k], b: q, w: .026, h: .022, c: ext > .05 ? lame : fil }); if (ext > .05) B.push({ a: q, b: v3.add(q, v3.mul(d, .025)), w: .03, h: .03, c: fil }); }
    return true;
  }
  const pose = (a, b, w, h, c) => B.push({ a, b, w, h, c }), u = F.u, at = k => v3.add(F.o, v3.mul(u, k));
  let v = v3.cross(u, [0, 1, 0]); if (v3.len(v) < .2) v = v3.cross(u, [1, 0, 0]); v = nrm(v); if (v[2] < 0) v = v3.mul(v, -1);
  const vv = (p, k) => v3.add(p, v3.mul(v, k));
  const veines = (a0, a1, larg) => { for (let k = 0; k < R.plis; k++) { const o = (k / Math.max(1, R.plis - 1) - .5) * larg * .6; pose(vv(at(a0), o), vv(at(a1), o), .006, larg * .2 + .012, sombre); } };
  const dents = (a0, a1, cote) => { if (!A.damne) return; for (let s = a0; s < a1 - .02; s += .035) pose(vv(at(s), cote), vv(at(s + .02), cote * 1.35), .012, .012, sombre); };
  if (T.id === 'dague') {
    const e = .05 + .17 * lg;
    pose(at(-.055), at(-.03), .03, .03, deco); pose(at(-.03), at(.04), .023, .023, M);
    pose(vv(at(.045), -.035), vv(at(.045), .035), .018, .02, deco);
    pose(at(.05), at(e), .034, .011, lame); pose(at(e), at(e + .04), .016, .009, lame);
    pose(vv(at(.06), .014), vv(at(e - .01), .01), .006, .012, fil); veines(.06, e - .02, .034); dents(.07, e - .02, -.017);
  } else if (T.id === 'epee') {
    const e = .06 + .3 * lg;
    pose(at(-.065), at(-.035), .038, .038, deco); pose(at(-.035), at(.05), .026, .026, M);
    pose(vv(at(.055), -.068), vv(at(.055), .068), .026, .03, deco);
    pose(at(.06), at(e), .05, .015, lame); pose(at(e), at(e + .06), .028, .013, lame);
    pose(vv(at(.07), .021), vv(at(e - .01), .016), .006, .016, fil); pose(vv(at(.07), -.021), vv(at(e - .01), -.016), .006, .016, fil);
    veines(.07, e - .03, .05); dents(.09, e - .04, .026);
  } else if (T.id === 'lance') {
    const e = .44 + .1 * lg;
    pose(at(-.27), at(.44), .022, .022, M); pose(at(-.28), at(-.22), .028, .028, deco); pose(at(.4), at(.45), .032, .032, deco);
    pose(at(.44), at(e), .046, .017, lame); pose(at(e), at(e + .07), .024, .012, lame);
    pose(vv(at(.45), .019), vv(at(e), .012), .006, .018, fil); veines(.45, e, .046); dents(.46, e, -.024);
  } else if (T.id === 'hache') {
    const H = .32, ex = .12 * lg;
    pose(at(-.06), at(.37), .03, .03, M); pose(at(-.07), at(-.03), .036, .036, deco);
    pose(vv(at(H), -.035), vv(at(H), ex), .1, .022, lame);
    pose(vv(at(H - .06), ex), vv(at(H + .06), ex), .022, .024, fil);
    pose(vv(at(H), -.035), vv(at(H), -.075), .034, .03, A.damne ? sombre : lame);
    for (let k = 0; k < R.plis; k++) pose(vv(at(H - .035 + k * .014), .0), vv(at(H - .035 + k * .014), ex - .01), .005, .024, sombre);
  } else if (T.id === 'marteau') {
    const Tt = at(.36), m = .085 * lg;
    pose(at(-.08), at(.34), .03, .03, M); pose(at(-.06), at(.06), .037, .037, deco);
    pose(vv(Tt, -m), vv(Tt, m), .1, .1, lame);
    pose(vv(Tt, -m), vv(Tt, -m - .025), .11, .11, fil);
    pose(vv(Tt, m), vv(Tt, m + (A.damne ? .07 : .03)), .05, .05, sombre);
    for (let k = 0; k < Math.min(3, R.plis); k++) pose(vv(Tt, -m + .04 + k * .04), vv(Tt, -m + .05 + k * .04), .104, .104, sombre);
  } else if (T.id === 'rapiere') {                                  // la coquille, l'anneau de garde, la lame fine et longue
    const e = .08 + .36 * lg;
    pose(at(-.07), at(-.045), .032, .032, deco); pose(at(-.045), at(.045), .022, .022, M);
    pose(at(.045), at(.07), .08, .08, deco); pose(vv(at(-.04), .045), vv(at(.05), .045), .008, .008, deco);
    pose(at(.07), at(e), .02, .009, lame); pose(at(e), at(e + .05), .009, .007, lame);
    pose(at(.075), at(e - .02), .004, .011, fil);
  } else if (T.id === 'sabre') {                                    // la lame courbe, un seul fil
    const e = .06 + .3 * lg, P0 = s => vv(at(s), -.11 * ((s - .06) / (e - .02)) ** 2);
    pose(at(-.06), at(-.04), .034, .034, deco); pose(at(-.04), at(.045), .025, .025, M); pose(at(.045), at(.062), .062, .05, deco);
    for (let k = 0; k < 5; k++) { const s0 = .062 + (e - .02) * k / 5, s1 = .062 + (e - .02) * (k + 1) / 5;
      pose(P0(s0), P0(s1), .046 - k * .004, .013, lame); pose(vv(P0(s0), .019 - k * .0015), vv(P0(s1), .019 - k * .0015), .005, .014, fil); }
    veines(.08, e - .06, .04);
  } else if (T.id === 'griffes') {                                  // trois lames qui sortent du poing
    const e = .1 + .12 * lg; pose(at(-.03), at(.035), .075, .055, M); pose(at(.03), at(.045), .08, .05, deco);
    for (const o of [-.026, 0, .026]) { pose(vv(at(.04), o), vv(at(e), o * 1.25), .012, .008, lame); pose(vv(at(e), o * 1.25), vv(at(e + .04), o * 1.1 - .008), .007, .006, o ? lame : fil); }
    dents(.06, e, .045);
  } else if (T.id === 'fleau') {                                    // le manche, la chaîne, la boule hérissée
    const w3 = nrm(v3.cross(u, v)), ww = (p, k) => v3.add(p, v3.mul(w3, k)), Bc = at(.42 + .04 * lg), r = .055 + .025 * lg;
    pose(at(-.07), at(.24), .03, .03, M); pose(at(-.08), at(-.05), .038, .038, deco); pose(at(.22), at(.26), .04, .04, deco);
    for (let k = 0; k < 4; k++) pose(vv(at(.27 + k * .035), (k & 1) * .01), vv(at(.295 + k * .035), (k & 1) * .01), k & 1 ? .006 : .016, k & 1 ? .016 : .006, sombre);
    pose(v3.add(Bc, v3.mul(u, -r)), v3.add(Bc, v3.mul(u, r)), r * 1.8, r * 1.8, lame);
    for (const [q, k] of [[vv, 1], [vv, -1], [ww, 1], [ww, -1]]) pose(q(Bc, k * r * .8), q(Bc, k * (r + .04)), .016, .016, k > 0 ? fil : sombre);
    pose(v3.add(Bc, v3.mul(u, r * .8)), v3.add(Bc, v3.mul(u, r + .04)), .016, .016, fil);
  } else if (T.id === 'espadon') {                                  // l'épée à deux mains : longue fusée, grande garde, lame large
    const e = .14 + .48 * lg;
    pose(at(-.19), at(-.15), .046, .046, deco); pose(at(-.15), at(.06), .028, .028, M);
    pose(vv(at(.065), -.12), vv(at(.065), .12), .03, .032, deco); pose(vv(at(.065), -.12), vv(at(.04), -.14), .02, .02, deco); pose(vv(at(.065), .12), vv(at(.04), .14), .02, .02, deco);
    pose(at(.08), at(.15), .04, .016, lame); pose(at(.15), at(e), .068, .018, lame); pose(at(e), at(e + .09), .036, .015, lame);
    pose(vv(at(.16), .03), vv(at(e - .01), .026), .006, .018, fil); pose(vv(at(.16), -.03), vv(at(e - .01), -.026), .006, .018, fil);
    veines(.16, e - .04, .066); dents(.18, e - .06, .036);
  } else if (T.id === 'faux') {                                     // le long manche, la lame en croissant
    const H = .55, n = 5, Lb = .26 + .1 * lg, bp = k => vv(at(H - .1 * (k / n) ** 2), Lb * k / n);
    pose(at(-.3), at(H + .02), .024, .024, M); pose(vv(at(-.02), 0), vv(at(-.02), .07), .02, .02, M); pose(at(H - .02), at(H + .04), .034, .034, deco);
    for (let k = 0; k < n; k++) { pose(bp(k), bp(k + 1), .06 - k * .009, .012, lame); pose(v3.add(bp(k), v3.mul(u, -.026 + k * .004)), v3.add(bp(k + 1), v3.mul(u, -.022 + k * .004)), .006, .014, fil); }
  } else if (T.id === 'hallebarde') {                               // la hampe, la pique, la hache, le crochet
    const H = .44, ex = .06 + .08 * lg;
    pose(at(-.32), at(H + .08), .022, .022, M); pose(at(-.33), at(-.28), .028, .028, deco);
    pose(at(H + .08), at(H + .2), .032, .012, lame); pose(at(H + .2), at(H + .25), .014, .01, lame);
    pose(vv(at(H), .02), vv(at(H), ex + .03), .13, .02, lame); pose(vv(at(H - .065), ex + .03), vv(at(H + .065), ex + .03), .02, .022, fil);
    pose(vv(at(H + .01), -.02), vv(at(H + .03), -.085), .026, .02, sombre); pose(vv(at(H + .03), -.085), vv(at(H - .01), -.105), .018, .016, A.damne ? sombre : lame);
    pose(at(H - .08), at(H + .08), .03, .03, deco);
  } else if (T.id === 'baton') {                                    // le long bâton ferré aux deux bouts
    pose(at(-.36), at(.56), .028, .028, M);
    pose(at(-.39), at(-.32), .036, .036, lame); pose(at(.52), at(.59), .036, .036, lame);
    pose(at(-.03), at(.03), .033, .033, deco); pose(at(.2), at(.24), .032, .032, deco);
    for (let k = 0; k < R.plis; k++) { const s = .3 + k * .05; pose(at(s), at(s + .012), .032, .032, fil); }
  } else if (T.id === 'epeefouet') {                                // les segments de la lame, tenus par un fil : serrés, ou déroulés en fouet
    const e = .06 + .3 * lg, fouet = !!FG.modes[id], n = 7, pas = fouet ? .1 + .04 * lg : (e - .06) / n;
    pose(at(-.065), at(-.035), .036, .036, deco); pose(at(-.035), at(.05), .025, .025, M); pose(vv(at(.055), -.06), vv(at(.055), .06), .024, .028, deco);
    let pr = at(.06);
    for (let k = 0; k < n; k++) {
      const s = .06 + pas * (k + 1), o = fouet ? Math.sin(k * 1.3 + (typeof t === 'number' ? t * 7 : 0)) * .03 * (k + 1) / n : 0, q = vv(at(s), o);
      const d0 = v3.add(pr, v3.mul(nrm(v3.sub(q, pr)), fouet ? .01 : .004)), d1 = v3.add(q, v3.mul(nrm(v3.sub(pr, q)), fouet ? .03 : .006));
      pose(d0, d1, .046 - k * .003, .014, lame); pose(pr, q, .004, .004, fil); pr = q;
    }
    pose(pr, v3.add(pr, v3.mul(u, .05)), .022, .012, lame);
  } else if (T.id === 'chakram') {                                  // l'anneau tranchant, tenu par son bord gainé
    if (FG.vol[id]) return true;
    const C0 = at(.13), r = .11 + .03 * lg, pt = (a, k = r) => v3.add(C0, v3.add(v3.mul(u, Math.cos(a) * k), v3.mul(v, Math.sin(a) * k)));
    for (let k = 0; k < 10; k++) pose(pt(Math.PI + k * .6283), pt(Math.PI + (k + 1) * .6283), .034, .012, lame);
    for (let k = 0; k < 4; k++) { const a = Math.PI * .25 + k * Math.PI * .5; pose(pt(a, r * .82), pt(a, r * 1.3), .02, .01, k & 1 ? fil : lame); }
    pose(pt(Math.PI - .35), pt(Math.PI + .35), .04, .03, M); pose(pt(0, r * .55), pt(Math.PI, r * .55), .006, .006, fil);
  } else if (T.id === 'javelots') {                                 // un javelot en main, tant qu'il en reste
    if (!(fgJav(id) > 0)) return true;
    pose(at(-.32), at(.42), .02, .02, M); pose(at(-.34), at(-.29), .024, .024, deco);
    pose(at(.42), at(.52), .036, .012, lame); pose(at(.52), at(.58), .016, .01, lame); pose(vv(at(.43), .012), vv(at(.51), .006), .005, .013, fil);
    for (const o of [-.012, .012]) pose(vv(at(-.31), o * 2), vv(at(-.24), o), .004, .03, [200, 190, 170]);
  } else if (T.id === 'fronde') {                                   // la poignée, les deux cordes, la poche et sa bille
    pose(at(-.05), at(.05), .03, .03, M); pose(at(-.06), at(-.04), .036, .036, deco);
    for (const o of [-.012, .012]) pose(vv(at(.04), o * .5), vv(at(.3), o * 2), .006, .006, [206, 186, 146]);
    pose(at(.29), at(.35), .05, .022, [120, 86, 56]); pose(at(.3), at(.335), .03, .03, lame); pose(at(.31), at(.325), .032, .006, fil);
  } else {                                                          // les armes des phases suivantes : une lame simple
    pose(at(-.04), at(.05), .026, .026, M); pose(at(.05), at(.3), .045, .014, lame);
  }
  return true;
}
// La vignette du sac : la forme, l'alliage, le fil de l'âme.
function fgDessin(d, R) {
  const T = FG_TYPES[R.type], A = fgAlliage(R), C = fgAme(R), M = FG_MONT[R.mont].c;
  const lame = A.c, fil = C ? FG_ELEM[C.el].c : A.c.map(v => Math.min(255, v + 60)), sombre = A.c.map(v => v * .55 | 0);
  switch (T.id) {
    case 'dague': d.ligne(2, 14, 5, 11, M, 2); d.ligne(3, 9, 7, 13, sombre, 2); d.ligne(6, 10, 11, 5, lame, 2); d.ligne(7, 9, 11, 5, fil); d.net(12, 4, fil); break;
    case 'epee': d.ligne(2, 14, 4, 12, M, 2); d.ligne(2, 10, 6, 14, sombre, 2); d.ligne(5, 11, 13, 3, lame, 2); d.ligne(6, 10, 13, 3, fil); d.net(14, 2, fil); break;
    case 'lance': d.ligne(2, 14, 11, 5, M); d.ligne(3, 14, 11, 6, M); d.ligne(11, 5, 14, 2, lame, 2); d.net(14, 2, fil); d.net(11, 5, sombre); break;
    case 'hache': d.ligne(3, 14, 10, 4, M, 2); d.rect(9, 2, 13, 6, lame); d.ligne(13, 2, 14, 7, fil); d.ligne(9, 2, 13, 2, sombre); break;
    case 'marteau': d.ligne(3, 14, 9, 6, M, 2); d.rect(7, 1, 14, 6, lame); d.rect(7, 1, 8, 6, fil); d.ligne(9, 6, 14, 6, sombre); break;
    case 'arccourt': d.arc(4, 8, 7, -1.25, 1.25, lame, 2); d.ligne(6, 2, 6, 14, [230, 226, 214]); d.net(9, 1, fil); d.net(9, 15, fil); d.rect(10, 7, 11, 9, M); break;
    case 'rapiere': d.ligne(2, 14, 4, 12, M, 2); d.rect(4, 10, 6, 12, sombre); d.ligne(6, 10, 14, 2, lame); d.ligne(3, 11, 5, 9, sombre); d.net(14, 2, fil); d.net(10, 6, fil); break;
    case 'sabre': d.ligne(2, 14, 4, 12, M, 2); d.ligne(3, 11, 5, 13, sombre, 2); d.ligne(5, 11, 9, 6, lame, 2); d.ligne(9, 6, 13, 3, lame, 2); d.ligne(13, 3, 15, 3, lame); d.ligne(6, 11, 10, 7, fil); break;
    case 'griffes': d.rect(2, 10, 6, 14, M); d.rect(5, 9, 7, 14, sombre); for (const o of [0, 2, 4]) { d.ligne(7, 9 + o - 2, 13, 5 + o - 2, lame); d.net(14, 4 + o - 2, fil); } break;
    case 'fleau': d.ligne(2, 14, 7, 9, M, 2); d.ligne(7, 9, 8, 6, sombre); d.ligne(8, 6, 9, 5, sombre); d.rect(9, 2, 13, 6, lame); d.net(11, 1, fil); d.net(14, 4, fil); d.net(11, 7, fil); d.net(8, 4, fil); break;
    case 'espadon': d.ligne(1, 15, 4, 12, M, 2); d.ligne(2, 9, 7, 14, sombre, 2); d.ligne(5, 11, 14, 2, lame, 3); d.ligne(6, 10, 14, 2, fil); d.net(1, 15, sombre); break;
    case 'faux': d.ligne(3, 15, 9, 2, M); d.ligne(9, 2, 13, 3, lame, 2); d.ligne(13, 3, 15, 6, lame); d.ligne(9, 3, 13, 4, fil); d.net(5, 10, M); d.net(6, 10, M); break;
    case 'hallebarde': d.ligne(2, 15, 11, 4, M); d.ligne(11, 4, 14, 1, lame, 2); d.rect(11, 5, 14, 8, lame); d.ligne(14, 5, 14, 8, fil); d.ligne(8, 4, 9, 6, sombre); d.net(8, 3, sombre); break;
    case 'baton': d.ligne(1, 15, 14, 2, M, 2); d.rect(13, 1, 15, 3, lame); d.rect(1, 13, 3, 15, lame); d.net(8, 8, fil); d.net(7, 9, sombre); break;
    case 'epeefouet': d.ligne(2, 14, 4, 12, M, 2); d.ligne(2, 10, 6, 14, sombre, 2); for (let k = 0; k < 4; k++) d.ligne(5 + k * 2, 11 - k * 2, 6 + k * 2, 10 - k * 2, lame, 2); d.ligne(5, 11, 14, 2, fil); break;
    case 'chakram': d.arc(8, 8, 5, 0, 6.2832, lame, 2); d.net(8, 1, fil); d.net(15, 8, fil); d.net(8, 15, fil); d.net(1, 8, fil); d.rect(3, 11, 5, 13, M); break;
    case 'javelots': d.ligne(2, 13, 11, 4, M); d.ligne(11, 4, 13, 2, lame, 2); d.ligne(4, 15, 13, 6, M); d.ligne(13, 6, 15, 4, lame, 2); d.net(12, 3, fil); d.net(14, 5, fil); break;
    case 'arclong': d.arc(2, 8, 8, -1.35, 1.35, lame, 2); d.ligne(4, 1, 4, 15, [230, 226, 214]); d.net(5, 0, fil); d.net(5, 15, fil); d.rect(9, 7, 10, 9, M); break;
    case 'arbaletef': d.ligne(3, 13, 11, 5, M, 2); d.ligne(7, 2, 14, 9, lame, 2); d.ligne(7, 2, 9, 7, [230, 226, 214]); d.ligne(9, 7, 14, 9, [230, 226, 214]); d.ligne(8, 8, 13, 3, fil); d.net(7, 2, fil); d.net(14, 9, fil); break;
    case 'fronde': d.rect(2, 12, 4, 14, M); d.ligne(4, 12, 9, 5, [206, 186, 146]); d.ligne(4, 13, 11, 7, [206, 186, 146]); d.rect(9, 4, 12, 7, [120, 86, 56]); d.net(10, 5, lame); d.net(11, 5, fil); break;
    default: d.ligne(3, 13, 12, 4, lame, 2); d.net(12, 4, fil);
  }
}

// ============================================================
//  AU COMBAT : les mécaniques propres, la compétence, l'usure
// ============================================================
const fgPuiss = L => { const C = fgAme(L.R); return C ? C.niv * (.7 + .45 * L.j / 100) : 0; };
const fgDerriere = (b, ox = P.x, oy = P.y) => { const dx = ox - b.x, dy = oy - b.y, d = Math.hypot(dx, dy) || 1, f = Number.isFinite(b.dir) ? b.dir : 0; return (Math.cos(f) * dx + Math.sin(f) * dy) / d < -.3; };
function fgUser(id, n = 1) {
  const L = fgLireId(id); if (!L) return;
  const I = fgEtat()[id] || (P.forge[id] = { u: 0 }), max = fgStats(L.R, L.j).usure, avant = I.u | 0;
  I.u = avant + n;
  if (avant < max && I.u >= max) say((objet(id) || {}).n + ' est émoussée · réparez-la à la forge', 3.5);
}
function fgDegats(b, d, cause) {
  if (!b || b.dead || !(b.pv > 0)) return;
  b.pv -= d / (robuste(b) || 1); b.hit = .2; b.alarm = 1;
  if (b.pv <= 0 && !b.dead) { mourirBete(b, cause || 'forge'); if (typeof butin === 'function') butin(b); }
}
const fgPart = (x, y, z, hex, n, v = 2, luit = 1) => { for (let k = 0; k < n; k++) parts.push({ x: x + (Math.random() - .5) * .4, y: y + (Math.random() - .5) * .4, z: z + Math.random() * .5,
  vx: (Math.random() - .5) * v, vy: (Math.random() - .5) * v, vz: Math.random() * v, g: 2, life: .5 + Math.random() * .3, age: 0, col: hex, luit, tl: .06 }); };
function fgEffetJoueur(k, dur, n = 1) {
  P.effets = P.effets || {}; P.effetsN = P.effetsN || {};
  const actif = (P.effets[k] || 0) > t;
  P.effets[k] = Math.max(P.effets[k] || 0, t + dur); P.effetsN[k] = actif ? Math.max(P.effetsN[k] || 1, n) : n;
}
// Ce qu'un élément fait à une bête (ou au joueur, pour la vie, l'ombre, la lumière).
function fgStatut(b, el, pw) {
  if (!b || b.dead || !(b.pv > 0)) return;
  const E = FG_ELEM[el], z = (b.z || 0) + .5;
  if (el === 'feu') { b.fgFeu = { fin: t + 2 + pw * .6, dps: .04 * pw }; fgPart(b.x, b.y, z, E.hex, 8); }
  else if (el === 'givre') { b.etourdi = Math.max(b.etourdi || 0, .5 + .3 * pw); fgPart(b.x, b.y, z, E.hex, 10, 1.5, 0); }
  else if (el === 'foudre') {
    fgDegats(b, .1 * pw, 'foudre'); let src = b, n = Math.max(1, Math.round(pw)); const vus = new Set([b]);
    while (n-- > 0) { let best = null, bd = 3.5 * 3.5;
      for (const o of beasts) if (!vus.has(o) && !o.dead && o.pv > 0 && !o.tame && !(o.sp && o.sp.plante)) { const d2 = (o.x - src.x) ** 2 + (o.y - src.y) ** 2; if (d2 < bd) { bd = d2; best = o; } }
      if (!best) break; vus.add(best);
      for (let k = 0; k <= 8; k++) { const f = k / 8; parts.push({ x: src.x + (best.x - src.x) * f + (Math.random() - .5) * .3, y: src.y + (best.y - src.y) * f + (Math.random() - .5) * .3, z: (src.z || 0) + .7 + Math.sin(f * 3) * .3, vx: 0, vy: 0, vz: 0, g: 0, life: .22, age: 0, col: E.hex, luit: 1, tl: .07 }); }
      fgDegats(best, .07 * pw, 'foudre'); src = best; }
    SON.jouer('laser', { vol: .5 }, b.x, b.y, z);
  }
  else if (el === 'poison') { b.fgPoison = { fin: t + 4 + pw, dps: .025 * pw }; fgPart(b.x, b.y, z, E.hex, 8, 1, 0); }
  else if (el === 'vie') { P.pv = Math.min(1, P.pv + .02 * pw); for (let k = 0; k <= 6; k++) { const f = k / 6; parts.push({ x: b.x + (P.x - b.x) * f, y: b.y + (P.y - b.y) * f, z: z + (P.z + .9 - z) * f, vx: 0, vy: 0, vz: .2, g: 0, life: .4, age: 0, col: E.hex, luit: 1, tl: .06 }); } }
  else if (el === 'ombre') { fgEffetJoueur('invisible', 1 + .5 * pw); b.etourdi = Math.max(b.etourdi || 0, .3); fgPart(P.x, P.y, P.z + .5, E.hex, 12, 1, 0); }
  else if (el === 'lumiere') { P.pv = Math.min(1, P.pv + .015 * pw); for (const o of beasts) if (!o.dead && !o.tame && o.pv > 0 && (o.x - P.x) ** 2 + (o.y - P.y) ** 2 < 9) o.etourdi = Math.max(o.etourdi || 0, .4 + .15 * pw); fgPart(P.x, P.y, P.z + 1, E.hex, 14, 2.5); }
  else if (el === 'seisme') { b.etourdi = Math.max(b.etourdi || 0, .5 + .25 * pw); fgDegats(b, .05 * pw, 'séisme'); P.secousse = t; P.secousseK = .3; fgPart(b.x, b.y, (b.z || 0) + .05, E.hex, 10, 3, 0); }
  else if (el === 'vent') { const dx = b.x - P.x, dy = b.y - P.y, d = Math.hypot(dx, dy) || 1; b.vx = (b.vx || 0) + dx / d * (4 + 2 * pw); b.vy = (b.vy || 0) + dy / d * (4 + 2 * pw); fgPart(b.x, b.y, z, E.hex, 10, 3, 0); }
}
function fgSoi(el, pw, niv) {
  const dur = 5 + niv, E = FG_ELEM[el];
  FG.buff = ['feu', 'givre', 'foudre', 'poison', 'seisme'].includes(el) ? { el, pw, fin: t + dur } : null;
  if (el === 'givre') fgEffetJoueur('robuste', dur, Math.min(4, niv));
  else if (el === 'seisme') fgEffetJoueur('fort', dur, Math.min(4, niv));
  else if (el === 'vent') fgEffetJoueur('vif', dur, Math.min(4, niv));
  else if (el === 'feu') fgEffetJoueur('braise', dur, 1);
  else if (el === 'ombre') fgEffetJoueur('invisible', 2 + niv, 1);
  else if (el === 'vie') { P.regenV = Math.max(P.regenT > t ? P.regenV || 0 : 0, .006 * pw); P.regenT = Math.max(P.regenT || 0, t) + dur; }
  else if (el === 'lumiere') P.pv = Math.min(1, P.pv + .04 * pw);
  fgPart(P.x, P.y, P.z + .8, E.hex, 16, 2);
}
function fgCompetence(C, b, pw) {
  const E = FG_ELEM[C.el];
  if (C.forme === 'coup') { fgStatut(b, C.el, pw); if (C.el2) fgStatut(b, C.el2, pw * .4); }
  else if (C.forme === 'zone') FG.zones.push({ x: b.x, y: b.y, z: b.z || P.z, el: C.el, pw, fin: t + 3 + C.niv * .6, r: 1.5 + .2 * C.niv, tic: 0 });
  else if (C.forme === 'soi') fgSoi(C.el, pw, C.niv);
  else if (C.forme === 'trait') {
    let c = null, bd = 10 * 10;
    for (const o of beasts) if (o !== b && !o.dead && o.pv > 0 && !o.tame && !(o.sp && o.sp.plante)) { const d2 = (o.x - b.x) ** 2 + (o.y - b.y) ** 2; if (d2 < bd) { bd = d2; c = o; } }
    FG.traits.push({ x: P.x, y: P.y, z: P.z + 1, c: c || b, el: C.el, pw, t0: t });
  }
  else if (C.forme === 'aura') FG.aura = { el: C.el, pw, fin: t + 4 + C.niv, tic: 0 };
  SON.jouer('sort', { vol: .6 }, b.x, b.y, (b.z || 0) + .6);
  if (t - (FG.ditT || -9) > 6) { FG.ditT = t; say(E.n + ' ' + FG_ROM[C.niv] + ' · ' + FG_FORME_TXT[C.forme][C.el], 1.6); }
}
function fgDeclenche(decl, A, tue) {
  if (decl === 'chaque') return Math.random() < .25;
  if (decl === 'serie') return FG.serie > 0 && FG.serie % 3 === 0;
  if (decl === 'charge') return !!A.charge;
  if (decl === 'dos') return !!A.dos;
  if (decl === 'tuer') return !!tue;
  if (decl === 'riposte') { if (A.riposte) return true; const d = P.dernierCoup; if (d != null && t - d < 2.5 && FG.riposteVu !== d) { FG.riposteVu = d; return true; } }
  return false;
}
// Avant le coup (coupArme) : ce qui multiplie les dégâts
function forgeAvant(A, pr, a) {
  const L = fgLireId(a.id); if (!L || !pr) return 1;
  const T = FG_TYPES[L.R.type]; let k = 1;
  A.dos = fgDerriere(pr);
  if (T.id === 'dague' && A.dos) { k *= 3; burst(pr.x, pr.y, (pr.z || 0) + .8, 10, '#ffffff'); }
  if (T.id === 'epee' && (P.combo | 0) === 2) { k *= 1.5; A.fin = true; }
  if (T.id === 'hache' && pr.sp && pr.sp.roi && typeof roiDegK === 'function') { const r = roiDegK(pr); if (r > 0 && r < 1) k /= r; }   // brise-garde : le bouclier, la pierre ne protègent plus
  if (T.id === 'rapiere') { if (FG.riposte > t) { k *= 2.5; FG.riposte = 0; A.riposte = true; burst(pr.x, pr.y, (pr.z || 0) + .9, 14, '#ffffff'); say('riposte', .9); }
    else if (Math.random() < .2) { k *= 2; burst(pr.x, pr.y, (pr.z || 0) + .9, 8, '#e8f0ff'); } }
  if (T.id === 'griffes' || T.id === 'fleau') k *= 1 + (T.id === 'griffes' ? .06 : .12) * fgPile();
  if (T.id === 'hallebarde' && (P.combo | 0) === 1) { k *= 1.2; A.crochet = true; }
  if (A.charge) k *= 1.5;
  return k;
}
// la pile des griffes et du fléau : chaque coup qui porte dans la seconde et quart en ajoute un, jusqu'à cinq
const fgPile = () => t - FG.pile.t < 1.25 ? FG.pile.n : 0;
function fgCadK(id, ty) { return ty === 'griffes' ? 1 - .1 * fgPile() : ty === 'epeefouet' && FG.modes[id] ? 1.3 : 1; }
const fgFrappable = o => !o.dead && !o.tame && o.pv > 0 && !o.cache && !o.loin && o.sp && !o.sp.plante && !o.sp.batiment && !o.sp.boss && o.sp.corps !== 'millegueule';
// Un balayage : toutes les bêtes à portée dans l'arc (en radians) devant vous, sauf la cible déjà frappée
function fgBalayage(pr, a, arc, k, port, cb) {
  const f = P.face; let n = 0;
  for (const o of beasts) {
    if (o === pr || !fgFrappable(o)) continue;
    const dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); if (d > port + .4 || Math.abs((o.z || 0) - P.z) > 2) continue;
    let da = Math.atan2(dy, dx) - f; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832;
    if (Math.abs(da) > arc / 2) continue;
    const dg = degJoueur(a.deg, o) * k; o.pv -= dg; o.hit = .25; o.alarm = 1; if (typeof blesseParJoueur === 'function') blesseParJoueur(o);
    if (typeof fauneCoup === 'function') fauneCoup(o, dg, dx / (d || 1) * 2, dy / (d || 1) * 2, 'chassé');
    burst(o.x, o.y, (o.z || 0) + .5, 6, '#ffb0a0');
    const tue = o.pv <= 0 && !o.dead; if (tue) { mourirBete(o, 'chassé'); butin(o); }
    if (cb) cb(o, dg, tue); n++;
  }
  return n;
}
const fgArcVisuel = (arc, port, col) => { const f = P.face; for (let k = 0; k < 18; k++) { const a = f - arc / 2 + arc * k / 17; parts.push({ x: P.x + Math.cos(a) * port * .9, y: P.y + Math.sin(a) * port * .9, z: P.z + .8, vx: Math.cos(a) * .6, vy: Math.sin(a) * .6, vz: 0, g: 0, life: .22, age: 0, col, luit: 1, tl: .06 }); } };
// La parade (degSubi, index.html) : un coup lancé juste avant d'être touché. La rapière pare tout, et prépare la riposte ;
// le bâton tourne, et amortit les trois quarts.
function forgeSubi() {
  const a = typeof porte === 'function' ? porte('arme') : null; if (!a || !a.fg) return 1;
  const L = fgLireId(a.id); if (!L) return 1;
  const T = FG_TYPES[L.R.type], A = P.anim;
  if ((T.id === 'rapiere' || T.id === 'baton') && A && A.k === 'arme' && t - A.t0 < (T.id === 'baton' ? .4 : .28)) {
    burst(P.x + Math.cos(P.face) * .5, P.y + Math.sin(P.face) * .5, P.z + 1, 12, '#ffffff'); SON.jouer('clank', { vol: .9 }, P.x, P.y, P.z + 1);
    if (T.id === 'rapiere') { FG.riposte = t + 1.5; if (t - (FG.paradeDit || -9) > 4) { FG.paradeDit = t; say('parade · la riposte est prête', 1.2); } return 0; }
    return .25;
  }
  return 1;
}
// Après le coup : l'usure, la série, la mécanique de l'arme, la compétence
function forgeApres(A, pr, dg, tue, a) {
  const L = fgLireId(a.id); if (!L || !pr) return;
  const T = FG_TYPES[L.R.type], C = fgAme(L.R), pw = fgPuiss(L);
  fgUser(a.id, 1);
  FG.serie = t - FG.serieT < 1.4 ? FG.serie + 1 : 1; FG.serieT = t;
  const f = P.face, ux = Math.cos(f), uy = Math.sin(f);
  if (T.id === 'lance') {                                           // l'estoc traverse : la bête de derrière
    let o2 = null, bd = 99;
    for (const o of beasts) { if (o === pr || o.dead || o.tame || !(o.pv > 0) || (o.sp && o.sp.plante)) continue;
      const rx = o.x - P.x, ry = o.y - P.y, al = rx * ux + ry * uy, lat = Math.abs(rx * uy - ry * ux);
      if (al > 0 && al < a.port + 1.4 && lat < .7 && al < bd) { bd = al; o2 = o; } }
    if (o2) { fgDegats(o2, degJoueur(a.deg, o2) * .7 * robuste(o2), 'chassé'); fgPart(o2.x, o2.y, (o2.z || 0) + .6, '#f2ecdc', 6, 2, 0); }
  }
  if (T.id === 'hache' && !tue) pr.fgSaigne = { fin: t + 3, dps: .05 * a.deg };
  if (T.id === 'griffes' || T.id === 'fleau') { FG.pile.n = t - FG.pile.t < 1.25 ? Math.min(5, FG.pile.n + 1) : 1; FG.pile.t = t; }
  if (T.id === 'fleau') { const port = a.port + .2 * fgPile(); fgBalayage(pr, a, 2.6, .7, port); fgArcVisuel(2.6, port, '#d8c8a8'); }
  if (T.id === 'espadon') { fgBalayage(pr, a, 6.29, .8, a.port); fgArcVisuel(6.28, a.port, '#f0ece0'); P.secousse = t; P.secousseK = .25; }
  if (T.id === 'faux') { const n = 1 + fgBalayage(pr, a, 2.8, .85, a.port); P.pv = Math.min(1, P.pv + .025 * n); fgArcVisuel(2.8, a.port, '#ff6a80'); }
  if (T.id === 'hallebarde') {
    if (A.crochet) { if (!tue && !pr.sp.boss && !(pr.sp.sz > 1.8)) { const an = Math.atan2(pr.y - P.y, pr.x - P.x); pr.tire = { t0: t, x0: pr.x, y0: pr.y, x1: P.x + Math.cos(an) * 1.1, y1: P.y + Math.sin(an) * 1.1 }; SON.jouer('prise', {}, pr.x, pr.y, (pr.z || 0) + .5); } }
    else { fgBalayage(pr, a, 2.1, .75, a.port); fgArcVisuel(2.1, a.port, '#f2ecdc'); }
  }
  if (T.id === 'baton' && !tue) { const dx = pr.x - P.x, dy = pr.y - P.y, d = Math.hypot(dx, dy) || 1; pr.vx = (pr.vx || 0) + dx / d * 9; pr.vy = (pr.vy || 0) + dy / d * 9; pr.etourdi = Math.max(pr.etourdi || 0, .25); }
  if (T.id === 'epeefouet' && FG.modes[a.id]) {
    for (let k = 0; k < 14; k++) { const f2 = k / 14; parts.push({ x: P.x + (pr.x - P.x) * f2, y: P.y + (pr.y - P.y) * f2, z: P.z + 1 + ((pr.z || 0) + .6 - P.z - 1) * f2, vx: 0, vy: 0, vz: 0, g: 0, life: .22, age: 0, col: COUL_TRAINEE[a.id] || '#d0cac0', luit: 1, tl: .06 }); }
    const d = Math.hypot(pr.x - P.x, pr.y - P.y);
    if (!tue && d > 1.6 && !pr.sp.boss && !(pr.sp.sz > 1.6)) { const an = Math.atan2(pr.y - P.y, pr.x - P.x); pr.tire = { t0: t, x0: pr.x, y0: pr.y, x1: P.x + Math.cos(an) * 1.3, y1: P.y + Math.sin(an) * 1.3 }; }
  }
  if (T.id === 'marteau') {                                         // l'onde du choc
    for (const o of beasts) if (o !== pr && !o.dead && !o.tame && o.pv > 0 && !(o.sp && o.sp.plante) && (o.x - pr.x) ** 2 + (o.y - pr.y) ** 2 < 2.2 * 2.2) { o.etourdi = Math.max(o.etourdi || 0, .7); fgDegats(o, degJoueur(a.deg, o) * .3 * robuste(o), 'chassé'); }
    if (!tue) pr.etourdi = Math.max(pr.etourdi || 0, .5);
    for (let k = 0; k < 20; k++) { const an = k / 20 * 6.2832; parts.push({ x: pr.x + Math.cos(an) * .4, y: pr.y + Math.sin(an) * .4, z: (pr.z || 0) + .1, vx: Math.cos(an) * 4.5, vy: Math.sin(an) * 4.5, vz: .4, g: 2, life: .4, age: 0, col: '#d8c8a8', tl: .08 }); }
  }
  if (C && fgDeclenche(C.decl, A, tue)) fgCompetence(C, pr, pw);
  if (FG.buff && FG.buff.fin > t && !tue) fgStatut(pr, FG.buff.el, FG.buff.pw * .5);
}
// Une flèche d'arc forgé qui touche (impactFleche)
function forgeFleche(f, b, dg) {
  const L = fgLireId(f.fg); if (!L || !b) return;
  const C = fgAme(L.R), T = FG_TYPES[L.R.type];
  if (T.id === 'arbaletef' && b.pv > 0 && !b.dead) {                 // (§173) le carreau : cloué au mur, ou repoussé
    const v = Math.hypot(f.vx, f.vy) || 1, ux = f.vx / v, uy = f.vy / v, z = (b.z || 0) + .8; let mur = false;
    for (let s = .5; s <= 1.5 && !mur; s += .25) { const x = b.x + ux * s, y = b.y + uy * s; mur = fgSol(x, y) > z || (typeof floreTouche === 'function' && floreTouche(x, y, z)); }
    if (mur && !(b.sp && b.sp.boss)) { const ex = dg * .5; b.pv -= ex; dg += ex; b.etourdi = Math.max(b.etourdi || 0, 3); b.vx = b.vy = 0; burst(b.x + ux * .4, b.y + uy * .4, z, 14, '#e8e0d0'); SON.jouer('clank', { vol: 1 }, b.x, b.y, z); say('cloué', 1); if (b.pv <= 0 && !b.dead) { mourirBete(b, 'flèche'); butin(b); } }
    else if (!(b.sp && (b.sp.boss || b.sp.sz > 1.8))) { b.vx = (b.vx || 0) + ux * 7; b.vy = (b.vy || 0) + uy * 7; }
  }
  const tue = !(b.pv > 0) || b.dead;
  fgUser(f.fg, 1);
  FG.serie = t - FG.serieT < 1.4 ? FG.serie + 1 : 1; FG.serieT = t;
  const A = { charge: !!f.pleine, dos: fgDerriere(b, b.x - f.vx, b.y - f.vy) };
  if (C && fgDeclenche(C.decl, A, tue)) fgCompetence(C, b, fgPuiss(L));
  if (FG.buff && FG.buff.fin > t && !tue) fgStatut(b, FG.buff.el, FG.buff.pw * .5);
}
// Le coup chargé (toutes les armes forgées de contact) : on maintient, on lâche.
function forgeChargeDown(a) { if (!a || !a.fg || a.arc) return false; FG.charge = { t0: t, a }; return true; }
function forgeChargeUp() {
  if (!FG.charge) return false;
  const c = FG.charge; FG.charge = null;
  if (porte('arme') !== c.a) return true;
  const L = fgLireId(c.a.id), ty = L && FG_TYPES[L.R.type].id, charge = t - c.t0 >= .5;
  if (charge && ty === 'sabre') { attaquer(c.a, cibleContact(c.a.port + 1.5)); fgFente(c.a); if (P.anim && P.anim.k === 'arme') { P.anim.fait = true; P.anim.charge = true; } return true; }
  if (charge && ty === 'javelots') { forgeRappel(c.a.id); return true; }
  if (charge && ty === 'epeefouet') { FG.modes[c.a.id] = !FG.modes[c.a.id]; SON.jouer('fouet', {}, P.x, P.y, P.z + 1); say(FG.modes[c.a.id] ? 'la lame se déroule · portée 4' : 'la lame se referme', 1.2); }
  attaquer(c.a, cibleContact(c.a.port));
  if (t - c.t0 >= .5 && P.anim && P.anim.k === 'arme') { P.anim.charge = true; burst(P.x, P.y, P.z + 1, 14, '#ffd27d'); }
  return true;
}
// L'arc court : deux flèches de plus, juste derrière la première
function forgeRafale(p) { const a = porte('arme'), L = a && a.fg && fgLireId(a.id); if (L && FG_TYPES[L.R.type].id === 'arccourt') FG.rafale.push({ t: t + .12, p: p * .9 }, { t: t + .24, p: p * .9 }); }

// ---------- à chaque image : les brûlures, les poisons, les zones, les auras, les traits, la rafale ----------
function forgeMaj(dt) {
  if (!dt || typeof beasts === 'undefined') return;
  if (FG.projs.length) fgMajProjs(dt);
  for (const b of beasts) {
    if (b.dead || !(b.pv > 0)) { b.fgFeu = b.fgPoison = b.fgSaigne = null; continue; }
    for (const [k, col] of [['fgFeu', '#ff8a30'], ['fgPoison', '#9fe070'], ['fgSaigne', '#c03030']]) {
      const S = b[k]; if (!S) continue;
      if (S.fin <= t) { b[k] = null; continue; }
      fgDegats(b, S.dps * dt, k === 'fgFeu' ? 'feu' : k === 'fgPoison' ? 'poison' : 'saigné');
      if (Math.random() < dt * 8) parts.push({ x: b.x + (Math.random() - .5) * .5, y: b.y + (Math.random() - .5) * .5, z: (b.z || 0) + Math.random() * .8, vx: 0, vy: 0, vz: k === 'fgSaigne' ? -.5 : .8, g: k === 'fgSaigne' ? 3 : -.2, life: .5, age: 0, col, luit: k === 'fgFeu' ? 1 : 0, tl: .06 });
    }
  }
  const surZone = (Z, x, y, z, r) => { Z.tic -= dt; const go = Z.tic <= 0; if (go) Z.tic = .5;
    const E = FG_ELEM[Z.el];
    if (Math.random() < dt * 14) { const a = Math.random() * 6.28, rr = Math.random() * r; parts.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr, z: z + .05, vx: 0, vy: 0, vz: .6, g: -.1, life: .6, age: 0, col: E.hex, luit: Z.el === 'feu' || Z.el === 'foudre' || Z.el === 'lumiere' ? 1 : 0, tl: .07 }); }
    if (!go) return;
    const dans = o => (o.x - x) ** 2 + (o.y - y) ** 2 < r * r;
    if ((Z.el === 'vie' || Z.el === 'lumiere') && dans(P)) P.pv = Math.min(1, P.pv + .01 * Z.pw);
    for (const o of beasts) { if (o.dead || o.tame || !(o.pv > 0) || (o.sp && o.sp.plante) || !dans(o)) continue;
      if (Z.el === 'feu') o.fgFeu = { fin: t + 1.2, dps: .04 * Z.pw };
      else if (Z.el === 'poison') o.fgPoison = { fin: t + 2, dps: .025 * Z.pw };
      else if (Z.el === 'givre' || Z.el === 'ombre' || Z.el === 'lumiere') o.etourdi = Math.max(o.etourdi || 0, .4);
      else if (Z.el === 'foudre') fgDegats(o, .04 * Z.pw, 'foudre');
      else if (Z.el === 'seisme') { o.etourdi = Math.max(o.etourdi || 0, .45); fgDegats(o, .02 * Z.pw, 'séisme'); }
      else if (Z.el === 'vent') { const dx = o.x - x, dy = o.y - y, d = Math.hypot(dx, dy) || 1; o.vx = (o.vx || 0) + dx / d * 5; o.vy = (o.vy || 0) + dy / d * 5; }
      else if (Z.el === 'vie') fgDegats(o, .015 * Z.pw, 'drainé'); }
  };
  for (let k = FG.zones.length - 1; k >= 0; k--) { const Z = FG.zones[k]; if (Z.fin <= t) { FG.zones.splice(k, 1); continue; } surZone(Z, Z.x, Z.y, Z.z, Z.r); }
  if (FG.aura) { if (FG.aura.fin <= t || P.pv <= 0) FG.aura = null; else surZone(FG.aura, P.x, P.y, P.z, 2.4); }
  for (let k = FG.traits.length - 1; k >= 0; k--) {
    const T = FG.traits[k], c = T.c, E = FG_ELEM[T.el];
    if (!c || c.dead || !(c.pv > 0) || t - T.t0 > 3) { FG.traits.splice(k, 1); continue; }
    const tx = c.x - T.x, ty = c.y - T.y, tz = (c.z || 0) + .6 - T.z, d = Math.hypot(tx, ty, tz) || 1, s = Math.min(d, 15 * dt);
    T.x += tx / d * s; T.y += ty / d * s; T.z += tz / d * s;
    for (let i = 0; i < 2; i++) parts.push({ x: T.x, y: T.y, z: T.z, vx: 0, vy: 0, vz: 0, g: 0, life: .25, age: 0, col: E.hex, luit: 1, tl: .09 });
    if (d < .6) { fgStatut(c, T.el, T.pw); fgDegats(c, .08 * T.pw, E.n); FG.traits.splice(k, 1); }
  }
  for (let k = FG.rafale.length - 1; k >= 0; k--) if (FG.rafale[k].t <= t) { const r = FG.rafale.splice(k, 1)[0];
    if (essai || P.fleches > 0) { tirerFleche(r.p); SON.jouer('decoche', { k: r.p }, P.x, P.y, P.z + .6); } }
  if (FG.charge && t - FG.charge.t0 >= .5 && Math.random() < dt * 20) parts.push({ x: P.x + (Math.random() - .5) * .5, y: P.y + (Math.random() - .5) * .5, z: P.z + .8 + Math.random() * .5, vx: 0, vy: 0, vz: .6, g: 0, life: .35, age: 0, col: '#ffd27d', luit: 1, tl: .05 });
}

// ============================================================
//  LA FORGE AU CAMPEMENT : sa place (hors de l'anneau des modules, sur un replat voisin), son dessin, l'action
// ============================================================
const FG_COUT = [{ pierre: 60, bois: 30, ferraille: 20 }, { pierre: 80, ferraille: 50, eclat: 30 }, { ferraille: 100, eclat: 60, os: 30 }];
const FG_NIV_DIT = ['', 'un ingrédient d\'âme · la forge se lit à l\'œil (la chaleur en mots, la trempe à la vapeur) · on lit d\'un code le plan, la charge et la monture',
  'deux ingrédients d\'âme · la chaleur et la trempe en clair · on lit aussi d\'un code la chauffe, les coups, les plis et la trempe',
  'trois ingrédients d\'âme · la gravure (un nom sur la lame) · plus de marge à la trempe · on lit tout d\'un code, l\'âme et la compétence comprises'];
// un replat de trois cases sur trois, à cinq à huit pas du feu, pas devant l'entrée ; à défaut, plus loin, quitte à
// défricher (les pieds sont abattus pour de bon, comme ceux du campement), puis un sol moins plat
function fgChercheLieu() {
  if (!campIci()) return null;
  for (const [rmax, flore, dh] of [[8.4, false, 1], [10.8, true, 1], [12, true, 2]]) { const b = fgCherche(rmax, flore, dh); if (b) return b; }
  return null;
}
function fgCherche(rmax, floreOk, dh) {
  const c = P.camp; let best = null;
  for (let r = 5.4; r <= rmax && !best; r += .6) for (let a = 0; a < 360; a += 15) {
    const ad = ((a + 180) % 360) - 180; if (Math.abs(ad) < 40) continue;
    const x = c.x + Math.cos(a * Math.PI / 180) * r, y = c.y + Math.sin(a * Math.PI / 180) * r;
    let mn = 1e9, mx = -1e9, ok = true;
    for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) {
      const i = ((y | 0) + dy) * WS + (x | 0) + dx, h = Hgt[i];
      if (h <= SEA || Eau[i] > h || (Flo[i] && !floreOk) || (typeof PlT !== 'undefined' && PlT[i]) || (typeof CHAMP_CASE !== 'undefined' && CHAMP_CASE.has(i))) { ok = false; break; }
      mn = Math.min(mn, h); mx = Math.max(mx, h);
    }
    if (!ok || mx - mn > dh || Math.abs(mx - c.z) > 2.5) continue;
    const sc = (mx - mn) + Math.abs(mx - c.z) * .3 + r * .05;
    if (!best || sc < best.sc) best = { x: (x | 0) + .5, y: (y | 0) + .5, z: mx, bas: mn, sc, a };
  }
  return best;
}
// La place est gardée (P.forgePos) tant que le campement ne bouge pas ; il bouge : la forge le suit.
function forgeLieu() {
  if (!(FG_NIV() > 0) || !campIci() || (typeof djIci === 'function' && djIci())) return null;
  const k = P.camp.x + ',' + P.camp.y + ',' + SEED;
  if (FG.lieuK !== k) {
    FG.lieuK = k; const F = P.forgePos;
    if (F && F.g === SEED && F.cx === P.camp.x && F.cy === P.camp.y) {
      let mn = 1e9, mx = -1e9; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const h = Hgt[((F.y | 0) + dy) * WS + (F.x | 0) + dx]; mn = Math.min(mn, h); mx = Math.max(mx, h); }
      FG.lieu = { x: F.x, y: F.y, z: mx, bas: mn };
    } else { FG.lieu = fgChercheLieu(); if (FG.lieu) fgPoser(FG.lieu); }
  }
  return FG.lieu;
}
function fgPoser(L) {
  P.forgePos = { g: SEED, cx: P.camp.x, cy: P.camp.y, x: L.x, y: L.y }; Sauve.sale = true;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const i = ((L.y | 0) + dy) * WS + (L.x | 0) + dx; if (Flo[i] && typeof retirerPied === 'function') retirerPied(i); }   // on défriche
}
const fgPres = (r = 2.4) => { const L = forgeLieu(); return !!L && (P.x - L.x) ** 2 + (P.y - L.y) ** 2 < r * r && Math.abs(P.z - L.z) < 2.2; };
function forgeAction() {
  if (!fgPres()) return null;
  return { v: fgOuverte() ? 'FERMER' : 'FORGER', o: 'la forge · niveau ' + FG_NIV(), f: basculerForge };
}
// Le dessin : un foyer de pierre et sa hotte, le soufflet, l'enclume sur sa souche, le bac de trempe, la meule ;
// tourné vers le feu de camp. Ajouté au décor de la marmite (marmiteDecor) : les deux rendus le dessinent.
function forgeDecor(ex, ey, r, Lst) {
  const L = forgeLieu(); if (!L || (L.x - ex) ** 2 + (L.y - ey) ** 2 > r * r) return;
  const n = FG_NIV(), c = P.camp, ddx = c.x - L.x, ddy = c.y - L.y, ax = Math.abs(ddx) > Math.abs(ddy);
  const fx = ax ? Math.sign(ddx) : 0, fy = ax ? 0 : Math.sign(ddy), lx = -fy, ly = fx, z0 = L.z;
  const B = (f0, f1, l0, l1, z_0, z_1, col, lum) => { const xa = L.x + fx * f0 + lx * l0, xb = L.x + fx * f1 + lx * l1, ya = L.y + fy * f0 + ly * l0, yb = L.y + fy * f1 + ly * l1;
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), y0 = Math.min(ya, yb), y1 = Math.max(ya, yb);
    Lst.push({ a: [(x0 + x1) / 2, (y0 + y1) / 2, z0 + z_0], b: [(x0 + x1) / 2, (y0 + y1) / 2, z0 + z_1], w: y1 - y0, h: x1 - x0, c: col, lum: !!lum }); };
  const pierre = [122, 104, 90], sombre = [52, 50, 54], bois = [112, 78, 50], fer = [70, 72, 80], brique = [150, 86, 62], cuivre = [176, 112, 64], chaud = FG.en ? Math.min(1, FG.en.temp) : 0;
  const braise = .7 + .3 * Math.sin(t * 7) * Math.sin(t * 3.1), feu = FG.en && FG.en.feu ? 1 : .55;
  B(-1.45, 1.35, -1.6, 1.6, L.bas - z0 - .02, .12, pierre);                                   // le socle de pierre
  B(-1.4, -.35, -1.55, -.1, .12, 1.0, brique); B(-1.42, -.33, -1.57, -.08, .92, 1.0, pierre);   // le foyer de briques, sa margelle
  B(-1.3, -.45, -1.45, -.2, 1.0, 1.06, [255 * feu * braise | 0, 110 * feu * braise | 0, 30], 1);   // les braises
  for (const l of [-1.55, -.1]) B(-1.4, -1.25, l, l + .12, 1.0, 1.9, sombre);
  B(-1.45, -.25, -1.62, -.02, 1.9, 2.12, cuivre); B(-1.2, -.7, -1.15, -.55, 2.12, 3.7, brique);   // la hotte de cuivre, la cheminée
  B(-.36, -.33, -1.3, -.35, .2, .5, [255 * braise * feu | 0, 90 * braise * feu | 0, 24], 1);   // la gueule du cendrier, qui rougeoie
  // (§173) l'atelier chaleureux : le tas de bûches, le tabouret, le panneau d'outils, la lanterne, et la chatte près du feu
  for (const [k, m] of [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [2, 0]]) { const f0 = .74 + m * .19 + k * .095, z = .12 + k * .15;
    B(f0, f0 + .17, -1.56, -1.02, z, z + .15, [[104, 70, 44], [118, 80, 50], [96, 64, 40]][(k + m) % 3]); B(f0 + .02, f0 + .15, -1.02, -.99, z + .02, z + .13, [190, 150, 104]); }
  B(.8, .96, -.74, -.58, .12, .46, bois); B(.76, 1.0, -.78, -.54, .46, .52, [128, 90, 58]);
  B(-1.45, -1.41, .55, 1.0, .12, 1.7, bois); B(-1.45, -1.41, .55, 1.0, 1.62, 1.7, [128, 90, 58]);
  B(-1.41, -1.38, .6, .63, .85, 1.45, fer); B(-1.41, -1.38, .66, .69, .85, 1.45, fer);
  B(-1.41, -1.38, .76, .79, 1.0, 1.42, bois); B(-1.41, -1.36, .72, .84, 1.34, 1.44, fer);
  B(-1.41, -1.38, .88, .96, 1.24, 1.34, [140, 140, 146]);
  B(1.24, 1.32, .52, .6, .12, 2.0, bois); B(1.24, 1.32, .26, .6, 1.94, 2.0, bois); B(1.26, 1.3, .3, .34, 1.66, 1.94, fer);
  B(1.2, 1.36, .24, .4, 1.6, 1.66, fer); B(1.21, 1.35, .25, .39, 1.36, 1.6, [255, 196 + 30 * braise | 0, 110], 1); B(1.2, 1.36, .24, .4, 1.3, 1.36, fer);
  { const roux = [214, 128, 62], fonce = [168, 92, 44], souf = .012 * Math.sin(t * 1.8);
    B(-.2, .04, -1.34, -1.1, .12, .27 + souf, roux); for (const f0 of [-.14, -.06]) B(f0, f0 + .025, -1.345, -1.095, .2, .275 + souf, fonce);
    B(.02, .15, -1.3, -1.14, .12, .25, roux); B(.06, .1, -1.29, -1.25, .25, .3, roux); B(.06, .1, -1.19, -1.15, .25, .3, roux);
    B(-.2, .1, -1.12, -1.06, .12, .17, fonce); }
  if (n >= 3) for (const z of [2.6, 3.2]) B(-1.24, -.66, -1.19, -.51, z, z + .08, [184, 148, 76]);
  B(-1.25, -.65, .05, .45, .3, .62, [92, 62, 42]); B(-.65, -.35, .18, .32, .44, .5, bois);     // le soufflet
  B(.05, .6, -.32, .28, .12, .62, bois);                                                     // la souche, l'enclume
  B(.1, .55, -.34, .22, .62, .92, sombre); B(.2, .48, .22, .46, .8, .9, sombre); B(.1, .55, -.38, -.34, .66, .88, sombre);
  if (FG.en && !FG.en.feu && !FG.en.plonge) { const cc = fgCouleurChaud(chaud, fgAlliage({ ch: FG.en.ch }).c); B(.22, .44, -.24, .12, .92, .97, cc, chaud > .3); }   // la pièce sur l'enclume
  B(.35, .45, .3, .36, .92, .98, [150, 140, 130]); B(.38, .42, .36, .62, .93, .97, bois);      // le marteau
  B(-.35, .25, .85, 1.5, .12, .9, bois); B(-.3, .2, .9, 1.45, .9, .92, [30, 50, 70]);         // le bac de trempe
  for (const z of [.3, .7]) B(-.37, .27, .83, 1.52, z, z + .06, fer);
  if (n >= 2) { B(.7, 1.15, .95, 1.05, .12, .7, bois); B(.7, 1.15, 1.45, 1.55, .12, .7, bois);   // la meule
    B(.75, 1.1, 1.08, 1.42, .35, .95, [150, 146, 140]); B(.85, 1.0, 1.0, 1.5, .62, .68, fer); }
  if (n >= 3) { B(-1.4, -1.3, .9, 1.55, .12, 1.6, bois); B(-1.38, -1.3, .9, 1.55, 1.4, 1.48, bois); }   // le râtelier
  if (Math.random() < .07 * feu) parts.push({ x: L.x + fx * -.875 + lx * -.825 + (Math.random() - .5) * .5, y: L.y + fy * -.875 + ly * -.825 + (Math.random() - .5) * .5, z: z0 + 1.1, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .9 + Math.random() * .6, g: -.2, life: .9 + Math.random() * .6, age: 0, col: Math.random() < .5 ? '#ffb050' : '#ffe08a', luit: 1, tl: .035 });   // les étincelles
  if (Math.random() < .04) parts.push({ x: L.x + fx * -.95 + lx * -.85, y: L.y + fy * -.95 + ly * -.85, z: z0 + 3.75, vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, vz: .5, g: -.15, life: 2, age: 0, col: '#a8a8a8', tl: .12 });
}
// (§173) La lueur de la forge, la nuit : le foyer et la lanterne (majFeux, index.html)
function forgeLueurs(pousse, vacille) {
  if (!FG_NIV() || !P.camp) return;
  const L = forgeLieu(); if (!L) return;
  const c = P.camp, ddx = c.x - L.x, ddy = c.y - L.y, ax = Math.abs(ddx) > Math.abs(ddy), fx = ax ? Math.sign(ddx) : 0, fy = ax ? 0 : Math.sign(ddy), lx = -fy, ly = fx;
  const pt = (f, l) => [L.x + fx * f + lx * l, L.y + fy * f + ly * l];
  const h = pt(-.875, -.825), q = pt(1.28, .32), k = FG.en && FG.en.feu ? 1 : .75;
  pousse(h[0], h[1], L.z + 1.1, vacille(RAYON.feu * .7 * k, 7)); pousse(q[0], q[1], L.z + 1.5, vacille(RAYON.feu * .45, 11));
}
// ---------- l'onglet Campement : bâtir la forge, l'améliorer ----------
function forgeCaseCamp(proche) {
  const n = FG_NIV(), lieu = n ? forgeLieu() : fgChercheLieu();
  const bloc = (titre, L) => `<div class="obj"><div><div class="n">${titre}</div><div class="d">${L.map(x => ESC(x[0].toUpperCase() + x.slice(1))).join('<br>')}</div></div></div>`;
  const ligneCout = c => `<div class="obj"><div><div class="n">Coût</div><div class="d">${ditCout(c)}${proche ? '' : '<br>il faut être au campement'}</div></div></div>`;
  const dispos = FG_TYPES.filter(fgConnu).map(T => T.n.toLowerCase()).join(', ') + (FG_TYPES.some(T => fgDispo(T) && !fgConnu(T)) ? ' ; d\'autres plans dorment dans les coffres du Centre et des Cercles' : '');
  if (!n) { const c = FG_COUT[0], pre = aModule('etabli');
    return { id: 'modforge', n: 'Forge', ic: 'forge', ok: proche && pre && !!lieu && payable({ cout: c }), irrev: true, sous: 'À bâtir · forger ses propres armes',
      corps: bloc('Ce qu\'elle apporte', ['forger des armes uniques : un plan, une charge, la chauffe, le martelage en rythme, les plis, l\'âme, la trempe, l\'affûtage, la monture', 'la recette fait l\'arme (sa forme, sa compétence) ; la justesse des gestes fait sa puissance', 'chaque arme a son code : on le donne à un autre joueur, qui le lit à sa forge', 'les plans d\'aujourd\'hui : ' + dispos, 'elle s\'élève hors de l\'anneau, sur un replat voisin du campement'])
        + (pre ? '' : bloc('Il faut l\'établi', ['créez-le d\'abord'])) + (lieu ? '' : bloc('Pas de place', ['aucun replat sec de trois cases sur trois à cinq à huit pas du feu'])) + ligneCout(c),
      bouton: 'Bâtir la forge', avert: 'Les matières sont dépensées.' }; }
  if (n >= 3) return { id: 'modforge', n: 'Forge', ic: 'forge', ok: false, sous: 'Niveau 3 sur 3 · au plus haut', corps: bloc('Ce qu\'elle sait faire', [FG_NIV_DIT[3]]) };
  const c = FG_COUT[n];
  return { id: 'modforge', n: 'Forge', ic: 'forge', ok: proche && payable({ cout: c }), irrev: true, sous: 'Niveau ' + n + ' sur 3',
    corps: bloc('Ce qu\'elle sait faire', [FG_NIV_DIT[n]]) + bloc('Ce qu\'apporte le niveau ' + (n + 1), [FG_NIV_DIT[n + 1]]) + ligneCout(c), bouton: 'Améliorer la forge', avert: 'Les matières sont dépensées.' };
}
function forgeBatir() {
  const n = FG_NIV(); if (n >= 3) return;
  if (!campIci() || !auCamp()) { say('il faut être au campement', 2); return; }
  if (!n && !aModule('etabli')) { say('il faut l\'établi d\'abord', 2); return; }
  const c = FG_COUT[n]; if (!payable({ cout: c })) { say('il manque de quoi bâtir', 2); return; }
  if (!n && !fgChercheLieu()) { say('aucun replat autour du campement pour la forge', 2.6); return; }
  if (!essai) payer(c);
  P.forgeNiv = n + 1; FG.lieuK = ''; Sauve.sale = true;
  const L = forgeLieu(); if (L) { burst(L.x, L.y, L.z + 1, 30, '#ffb060'); SON.jouer('clank', { vol: 1 }, L.x, L.y, L.z + .5); }
  say(n ? 'forge · niveau ' + (n + 1) + ' · ' + FG_NIV_DIT[n + 1] : 'la forge est bâtie, à côté du campement · ACTION devant elle pour forger', 4);
  if (typeof majSac === 'function') majSac();
}

// ============================================================
//  LA FENÊTRE DE LA FORGE : forger (les gestes en temps réel), mes armes, lire un code, le carnet
// ============================================================
const FG_W = 168, FG_H = 112, FG_BAT = .7;
const fgOuverte = () => !!(FG.el && !FG.el.hidden);
const fgNow = () => performance.now() / 1000;
function fgStyle() {
  if (document.getElementById('fg-style')) return;
  const st = document.createElement('style'); st.id = 'fg-style';
  st.textContent = '#forge-ui{position:fixed;left:50%;top:50%;transform:translate(-50%,-52%);z-index:30;width:min(1000px,96vw);max-height:92vh;overflow:auto;background:radial-gradient(130% 90% at 0% 0%,rgba(150,70,24,.32),transparent 62%),radial-gradient(90% 70% at 100% 100%,rgba(120,50,20,.2),transparent 70%),linear-gradient(180deg,rgba(44,28,21,.97),rgba(30,19,15,.97));border:1px solid rgba(255,176,100,.4);border-radius:14px;color:#efe0cc;font-size:13px;box-shadow:0 12px 40px rgba(0,0,0,.6),0 0 90px rgba(255,120,40,.14),inset 0 1px 0 rgba(255,210,160,.12);pointer-events:auto;}'
    + '#forge-ui[hidden]{display:none;}#forge-ui .ic{display:inline-block;background-repeat:no-repeat;background-size:100% 100%;image-rendering:pixelated;flex:none;}'
    + '#forge-ui .cu-tete b{color:#ffb878;}.fg-ong{display:flex;gap:4px;margin-left:8px;flex-wrap:wrap;}.fg-ong button{background:rgba(255,214,170,.06);border:1px solid rgba(240,190,140,.22);color:#d8cfc2;border-radius:8px;padding:4px 9px;font:inherit;font-size:12px;cursor:pointer;}'
    + '.fg-ong button.on{border-color:#ffb878;color:#ffcf9a;background:rgba(255,160,90,.1);}.fg-niv{font-size:11.5px;color:#c4a688;}'
    + '.fg-corps{display:flex;gap:12px;padding:10px 12px;flex-wrap:wrap;align-items:flex-start;}.fg-g{flex:0 0 190px;display:flex;flex-direction:column;gap:4px;}'
    + '.fg-m{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:6px;margin:0 auto;}.fg-m canvas{position:static;inset:auto;width:336px;height:224px;image-rendering:pixelated;border-radius:10px;background:#2e1c15;box-shadow:0 0 0 1px rgba(255,190,130,.22),0 6px 24px rgba(255,110,30,.18);}'
    + '.fg-d{flex:1 1 240px;min-width:220px;display:flex;flex-direction:column;gap:6px;}.fg-autre{padding:10px 14px;display:flex;flex-direction:column;gap:6px;}'
    + '.fg-h{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#c4a688;margin:4px 2px 2px;}'
    + '.fg-p{display:flex;align-items:center;gap:7px;padding:5px 7px;border-radius:9px;border:1px solid rgba(240,190,140,.18);background:rgba(255,214,170,.05);color:#e6ddd0;cursor:pointer;font:inherit;font-size:12px;text-align:left;}'
    + '.fg-p .ic{width:26px;height:26px;}.fg-p b{display:block;}.fg-p small{display:block;color:#c4a688;font-size:10.5px;}.fg-p.on{border-color:#ffb878;background:rgba(255,160,90,.1);}.fg-p:disabled{opacity:.4;cursor:default;}'
    + '.fg-jauge{position:relative;width:336px;height:14px;border-radius:7px;background:linear-gradient(90deg,#4c4c58 0%,#6a1e16 22%,#b42418 38%,#e8521c 52%,#ff8a24 66%,#ffd050 80%,#fff8e0 100%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.5);}'
    + '.fg-jauge i{position:absolute;top:-4px;width:3px;height:22px;margin-left:-1.5px;border-radius:2px;background:#fff;box-shadow:0 0 4px #000;}.fg-jauge u{position:absolute;top:-3px;height:20px;border:2px dashed #ffe9b0;border-radius:6px;box-sizing:border-box;}'
    + '.fg-jauge s{position:absolute;top:-5px;width:4px;height:24px;margin-left:-2px;background:#ffd27d;border-radius:2px;}.fg-jt{width:336px;display:flex;justify-content:space-between;font-size:11px;color:#c8ae92;}'
    + '.fg-ctl{width:336px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;}.fg-b{min-width:96px;padding:9px 10px;border-radius:10px;border:1px solid rgba(240,190,140,.3);background:rgba(255,214,170,.07);color:#f0e6d8;font:inherit;font-weight:600;cursor:pointer;touch-action:none;user-select:none;}'
    + '.fg-b.prim{border-color:#ffb878;background:rgba(255,150,80,.16);color:#ffd8b0;}.fg-b small{display:block;font-weight:400;font-size:10px;color:#c8ae92;}.fg-b:disabled{opacity:.35;cursor:default;}.fg-b.mini{min-width:0;padding:6px 9px;}'
    + '.fg-mat{display:flex;align-items:center;gap:6px;width:100%;padding:3px 6px;border-radius:8px;background:rgba(255,214,170,.05);}.fg-mat .ic{width:20px;height:20px;}.fg-mat span{flex:1;font-size:12px;}.fg-mat em{font-style:normal;color:#ffcf9a;min-width:16px;text-align:center;}'
    + '.fg-in{position:relative;width:40px;height:40px;border-radius:9px;border:1px solid rgba(240,190,140,.25);background:rgba(255,214,170,.07);cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;}.fg-in .ic{width:28px;height:28px;}.fg-in b{position:absolute;right:3px;bottom:1px;font-size:10px;color:#fff;text-shadow:0 0 2px #000;}'
    + '.fg-in.r2{border-color:#7fc77a;}.fg-in.r3{border-color:#6aa6ff;}.fg-in.r4{border-color:#c48cff;}.fg-in.r5{border-color:#ffb347;}.fg-ings{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;max-height:132px;overflow:auto;width:336px;}'
    + '.fg-et{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;}.fg-et li{display:flex;gap:7px;padding:4px 7px;border-radius:8px;background:rgba(255,214,170,.05);font-size:12px;}.fg-et li.cour{background:rgba(255,160,90,.12);box-shadow:inset 3px 0 0 #ffb878;}'
    + '.fg-et li b{flex:none;width:86px;color:#ffcf9a;font-weight:600;}.fg-et li span{flex:1;min-width:0;}.fg-et li i{font-style:normal;color:#ff9a7a;font-size:11px;}.fg-et li small{color:#c4a688;}'
    + '.fg-note{font-size:11.5px;color:#c8ae92;line-height:1.35;}.fg-msg{font-size:12px;color:#ffd8b0;min-height:1.3em;text-align:center;}.fg-just{font-size:12px;}.fg-just b{color:#ffd27d;font-size:15px;}'
    + '.fg-fiche{border:1px solid rgba(240,190,140,.3);border-radius:10px;padding:10px 12px;background:rgba(255,240,220,.03);font-family:ui-monospace,monospace;font-size:12px;line-height:1.55;}'
    + '.fg-fiche .fl{display:flex;gap:10px;}.fg-fiche .fl b{flex:none;width:96px;color:#ffcf9a;font-weight:600;}.fg-fiche .fl span{flex:1;}.fg-fiche .cache span{color:#6e665c;letter-spacing:2px;}.fg-fiche h4{margin:0 0 6px;font:inherit;font-size:13px;color:#fff0dc;}'
    + '.fg-arme{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.035);}.fg-arme .ic{width:30px;height:30px;}.fg-arme div{flex:1;min-width:0;}.fg-arme small{display:block;color:#c4a688;font-size:10.5px;}'
    + '.fg-us{height:5px;border-radius:3px;background:rgba(255,255,255,.1);margin-top:3px;}.fg-us i{display:block;height:5px;border-radius:3px;background:#c9a65e;}.fg-code{display:flex;gap:6px;align-items:center;}'
    + '.fg-code input{flex:1;background:rgba(0,0,0,.3);border:1px solid rgba(240,190,140,.3);border-radius:8px;color:#fff0dc;padding:7px 9px;font:inherit;font-family:ui-monospace,monospace;text-transform:uppercase;}'
    + '@media (max-width:640px){.fg-corps{gap:8px;padding:8px;}.fg-g{flex:1 1 100%;flex-direction:row;flex-wrap:wrap;}.fg-g .fg-p{flex:1 1 30%;}.fg-m canvas{width:252px;height:168px;}.fg-jauge,.fg-jt,.fg-ctl,.fg-ings{width:252px;}.fg-b{min-width:74px;}}';
  document.head.appendChild(st);
}
function basculerForge() { if (fgOuverte()) fermerForge(); else ouvrirForge(); }
function ouvrirForge() {
  if (!fgPres(3)) return;
  if (typeof cuStyle === 'function') cuStyle(); if (typeof alStyle === 'function') alStyle(); fgStyle(); if (typeof feuilleIcones === 'function') feuilleIcones();
  if (typeof sacOuvert !== 'undefined' && sacOuvert) ouvrirSac(false);
  if (typeof alOuverte === 'function' && alOuverte()) fermerAlchimie();
  if (!FG.el) {
    const el = FG.el = document.createElement('div'); el.id = 'forge-ui'; el.className = 'ui'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'La forge');
    el.innerHTML = `<div class="cu-tete">${img('forge')}<b>Forge</b><span class="fg-niv"></span><span class="fg-ong"></span><span class="cu-res fg-res"></span><button class="cu-x" data-fg="x" aria-label="Fermer">✕</button></div>`
      + `<div class="fg-corps"><div class="fg-g"></div><div class="fg-m"><canvas width="${FG_W}" height="${FG_H}" aria-hidden="true"></canvas><div class="fg-jauge"></div><div class="fg-jt"></div><div class="fg-ctl"></div><div class="fg-msg"></div></div><div class="fg-d"></div></div><div class="fg-autre"></div>`;
    el.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.button > 0) return; const b = e.target.closest('[data-fg]'); if (!b || b.disabled) return; if (b.tagName !== 'INPUT') e.preventDefault(); fgGeste(b.dataset.fg, true); });
    addEventListener('pointerup', () => { FG.souffle = FG.gauche = FG.droite = false; });
    addEventListener('pointercancel', () => { FG.souffle = FG.gauche = FG.droite = false; });
    document.body.appendChild(el);
    FG.cv = el.querySelector('canvas'); FG.cx = FG.cv.getContext('2d'); FG.cx.imageSmoothingEnabled = false;
  }
  FG.el.hidden = false; FG.h = {}; FG.ui = { etin: [], vap: [] }; FG.tt = fgNow();
  if (!FG.ch) FG.ch = [0, 0, 0, 0, 0];
  if (typeof K === 'object') for (const kk in K) K[kk] = false;
  rendreForge();
  clearInterval(FG.tic); FG.tic = setInterval(() => { if (!fgOuverte()) return; if (!fgPres(3.2) || (typeof sacOuvert !== 'undefined' && sacOuvert)) return fermerForge(); rendreForge(); }, 200);
  cancelAnimationFrame(FG.raf); FG.raf = requestAnimationFrame(fgBoucle);
}
function fermerForge() { if (typeof fermerBilan === 'function') fermerBilan(); if (FG.el) FG.el.hidden = true; clearInterval(FG.tic); cancelAnimationFrame(FG.raf); FG.souffle = FG.gauche = FG.droite = false; if (typeof actionSig !== 'undefined') actionSig = ''; }
addEventListener('keydown', e => {
  if (!fgOuverte() || (e.target && e.target.tagName === 'INPUT')) return;
  if (typeof bilanOuvert === 'function' && bilanOuvert()) { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); fermerBilan(); } return; }
  const E = FG.en;
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return fermerForge(); }
  if (e.key === 'ArrowLeft') { FG.gauche = true; e.preventDefault(); e.stopPropagation(); return; }
  if (e.key === 'ArrowRight') { FG.droite = true; e.preventDefault(); e.stopPropagation(); return; }
  if (e.key !== ' ' && e.key !== 'Enter') return;
  e.preventDefault(); e.stopPropagation(); if (e.repeat) return;
  if (!E) return;
  const g = E.plonge ? 'retirer' : E.feu ? 'souffle' : E.etape === 'frappe' ? 'frapper' : E.etape === 'plis' ? 'plier' : E.etape === 'trempe' && E.bain >= 0 ? 'plonger' : '';
  if (g) fgGeste(g, true);
}, true);
addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') FG.souffle = false; if (e.key === 'ArrowLeft') FG.gauche = false; if (e.key === 'ArrowRight') FG.droite = false; }, true);
const fgDire = (m, d = 2.4) => { FG.msg = m; FG.msgT = fgNow() + d; };
const fgDefaut = (E, k, m) => { E.def[m] = (E.def[m] || 0) + 1; fgDire(m, 1.6); };
const fgPen = E => Math.round(Object.values(E.pen).reduce((a, b) => a + b, 0));
const fgJustesse = E => Math.max(5, Math.min(100, 100 - fgPen(E)));
// ---------- ce que coûtent la charge, le bain, la monture ----------
const fgDispoMat = k => FG_MAT[k].ingr ? qteIngr(FG_MAT[k].id) : dispo(FG_MAT[k].id);
const fgCoutCharge = ch => { const c = {}; ch.forEach((q, k) => { if (q && !FG_MAT[k].ingr) c[FG_MAT[k].id] = (c[FG_MAT[k].id] || 0) + q * FG_MAT[k].q; }); return c; };
const fgChargeOk = ch => essai || ch.every((q, k) => !q || fgDispoMat(k) >= q * FG_MAT[k].q);
const fgIngrFam = (fam, nb) => Object.keys(INGR).filter(id => INGR[id].fam === fam && qteIngr(id) > 0).sort((a, b) => INGR[a].r - INGR[b].r).reduce((L, id) => { for (let k = 0; k < qteIngr(id) && L.length < nb; k++) L.push(id); return L; }, []);
const fgBainOk = i => { const B = FG_BAINS[i]; return essai || (B.res ? dispo(B.res) >= B.nb : B.fam ? fgIngrFam(B.fam, B.nb).length >= B.nb : true); };
const fgBainTxt = i => { const B = FG_BAINS[i]; return B.res ? B.nb + ' ' + (PLURIEL[B.res] || B.res) : B.fam ? B.nb + ' ' + (NOM_ETAPE[B.fam] || B.fam).toLowerCase() + (B.nb > 1 ? 's' : '') : 'gratuit'; };
const fgMontOk = i => essai || dispo(FG_MONT[i].res) >= FG_MONT[i].nb;
// ---------- les gestes ----------
function fgGeste(g, appui) {
  const E = FG.en, now = fgNow();
  if (g === 'x') return fermerForge();
  if (g.startsWith('v:')) { FG.vue = g.slice(2); FG.fiche = null; return rendreForge(); }
  if (g.startsWith('fiche:')) { const L = fgLireId(g.slice(6)); if (L) FG.fiche = { code: L.code, id: g.slice(6) }; FG.vue = 'armes'; return rendreForge(); }
  if (g.startsWith('fc:')) { FG.fiche = { code: g.slice(3) }; return rendreForge(); }
  if (g === 'fermefiche') { FG.fiche = null; return rendreForge(); }
  if (g.startsWith('rep:')) return fgReparer(g.slice(4));
  if (g.startsWith('don:')) return fgDonner(g.slice(4));
  if (g === 'lire') { const inp = FG.el.querySelector('.fg-code input'), c = fgCodeLu(inp && inp.value); if (!c || !fgDecode(c)) { fgDire('ce code ne se lit pas : FG- suivi de treize signes', 2.6); return rendreForge(); }
    FG.fiche = { code: c }; fgEtat(); if (!P.forgeLu[c]) P.forgeLu[c] = []; Sauve.sale = true; return rendreForge(); }
  if (g.startsWith('dech:')) return fgDechiffrer(g.slice(5));
  if (g === 'copier') { const c = FG.fiche && fgCodeAffiche(FG.fiche.code); try { navigator.clipboard.writeText(c); fgDire('code copié · ' + c, 2.4); } catch (e) { fgDire(c, 4); } return rendreForge(); }
  if (g.startsWith('p:')) { if (E) { fgDire('une pièce est en cours : finissez-la, ou abandonnez-la', 2.4); return rendreForge(); } const i = +g.slice(2); if (FG_TYPES[i] && fgConnu(FG_TYPES[i])) FG.choix = i; return rendreForge(); }
  if (g.startsWith('c+:') || g.startsWith('c-:')) { if (E) return; const k = +g.slice(3), tot = FG.ch.reduce((a, b) => a + b, 0);
    if (g[1] === '+') { if (tot >= 4) fgDire('quatre portions au plus', 1.6); else FG.ch[k]++; } else if (FG.ch[k] > 0) FG.ch[k]--; return rendreForge(); }
  if (g === 'abandon') { if (!E) return; if (!(FG.abandon > now)) { FG.abandon = now + 3; fgDire('abandonner ? appuyez encore : la pièce est perdue', 3); return rendreForge(); }
    FG.en = null; FG.abandon = 0; fgDire('la pièce part au rebut', 2); return rendreForge(); }
  if (g === 'aufeu') {
    if (!E) {                                                   // la charge : on paie, la pièce naît au feu
      const tot = FG.ch.reduce((a, b) => a + b, 0);
      if (tot < 2) { fgDire('au moins deux portions', 1.8); return rendreForge(); }
      if (!fgChargeOk(FG.ch)) { fgDire('il manque de quoi charger le creuset', 2); return rendreForge(); }
      if (!essai) { payer(fgCoutCharge(FG.ch)); if (FG.ch[4]) oterIngr('ferdamne', FG.ch[4]); }
      FG.en = { type: FG.choix, ch: FG.ch.slice(), temp: .15, feu: true, etape: 'chauffe', coups: 0, plis: 0, ame: [], bain: -1, plonge: false, trempeT: 0, mont: -1,
        pen: { chauffe: 0, frappe: 0, plis: 0, ame: 0, trempe: 0, affut: 0 }, def: {}, bat0: now, chauffeFaite: false, aff: { a: 0, v: 0, t: 0, hors: 0 } };
      SON.jouer('clank', { vol: .6 }); fgDire('au feu · soufflez, et sortez-la à la bonne couleur', 3); return rendreForge();
    }
    if (E.plonge || E.etape === 'affut' || E.etape === 'monture') return;
    E.feu = true; return rendreForge();
  }
  if (!E) return rendreForge();
  if (g === 'souffle') { if (E.feu) FG.souffle = true; return; }
  if (g === 'gauche') { FG.gauche = true; return; }
  if (g === 'droite') { FG.droite = true; return; }
  if (g === 'enclume') {
    if (!E.feu) return;
    E.feu = false; FG.souffle = false; SON.jouer('clank', { vol: .4 });
    if (!E.chauffeFaite) {
      const c = fgCible(fgRecette(E)), d = E.temp - c;
      E.pen.chauffe += Math.min(18, Math.abs(d) * 70); E.chauffeFaite = true; E.etape = 'frappe'; E.bat0 = now;
      fgDire(Math.abs(d) < .05 ? 'la couleur juste · frappez en rythme' : d > 0 ? 'un peu trop chaude · frappez en rythme' : 'un peu froide · frappez en rythme', 2.6);
    }
    return rendreForge();
  }
  if (g === 'frapper') {
    if (E.feu || E.etape !== 'frappe') return;
    if (E.coups >= 21) { fgDire('la lame est assez longue : FINI', 1.6); return; }
    const ph = ((now - E.bat0) % FG_BAT + FG_BAT) % FG_BAT, d = Math.min(ph, FG_BAT - ph);
    E.coups++; FG.anim.coup = now;
    if (E.temp < .3) { E.pen.frappe += 4; fgDefaut(E, 'frappe', 'frappé à froid'); }
    else if (d > .11) { E.pen.frappe += 2.5; fgDefaut(E, 'frappe', 'à contretemps'); }
    else fgDire('juste · ' + E.coups + ' coups', .8);
    E.temp = Math.max(0, E.temp - .025);
    SON.jouer('clank', { vol: .55 }); fgEtincelles(14, E.temp);
    return rendreForge();
  }
  if (g === 'fini') { if (E.etape !== 'frappe') return; if (E.coups < 6) { fgDire('six coups au moins', 1.6); return; } E.etape = 'plis'; fgDire('les plis : pliez la lame encore chaude, ou passez', 2.6); return rendreForge(); }
  if (g === 'plier') {
    if (E.feu || E.etape !== 'plis') return;
    if (E.temp < .45) { E.pen.plis += 5; fgDefaut(E, 'plis', 'plié à froid'); }
    E.plis++; E.temp = Math.max(0, E.temp - .08); FG.anim.pli = now; SON.jouer('clank', { vol: .35 });
    if (E.plis > 5) { FG.en = null; SON.jouer('pilon', { vol: .6 }); fgDire('six plis : la lame casse · tout est perdu', 3.5); return rendreForge(); }
    fgDire(E.plis + ' pli' + (E.plis > 1 ? 's' : ''), .9); return rendreForge();
  }
  if (g === 'suite') {
    if (E.etape === 'plis') { E.etape = 'ame'; fgDire(FG_NIV() > 1 ? 'l\'âme : versez jusqu\'à ' + FG_NIV() + ' ingrédients sur le métal rouge, dans l\'ordre' : 'l\'âme : versez un ingrédient sur le métal rouge', 3); }
    else if (E.etape === 'ame') { E.etape = 'trempe'; E.feu = false; fgDire('la trempe : choisissez le bain, puis plongez la pièce chaude', 3); }
    return rendreForge();
  }
  if (g.startsWith('i:')) {
    if (E.etape !== 'ame' || E.feu) return;
    const id = g.slice(2);
    if (E.ame.length >= Math.max(1, FG_NIV())) { fgDire('la forge ne prend pas plus d\'âme à ce niveau', 2); return; }
    if (!essai && qteIngr(id) <= 0) return;
    if (!essai) oterIngr(id);
    FG.anim.verse = now; SON.jouer('vapeur', { vol: .5 });
    if (E.temp < .5) { E.pen.ame += 3; fgDefaut(E, 'ame', 'âme versée à froid : elle ne prend pas'); }
    else { E.ame.push(id); fgDire(INGR[id].n + ' prend dans le métal', 1.6); }
    return rendreForge();
  }
  if (g.startsWith('b:')) { if (E.etape !== 'trempe' || E.plonge) return; const i = +g.slice(2); if (!fgBainOk(i)) { fgDire('il manque ' + fgBainTxt(i), 1.8); return rendreForge(); } E.bain = i; return rendreForge(); }
  if (g === 'plonger') {
    if (E.etape !== 'trempe' || E.plonge || E.bain < 0) return;
    if (!fgBainOk(E.bain)) { fgDire('il manque ' + fgBainTxt(E.bain), 1.8); return rendreForge(); }
    const B = FG_BAINS[E.bain];
    if (!essai) { if (B.res) payer({ [B.res]: B.nb }); else if (B.fam) for (const id of fgIngrFam(B.fam, B.nb)) oterIngr(id); }
    if (E.temp < .55) { E.pen.trempe += 6; fgDefaut(E, 'trempe', 'trempée trop froide'); }
    E.plonge = true; E.feu = false; E.trempeT = 0; FG.anim.plonge = now; SON.jouer('vapeur', { vol: 1 });
    fgDire(FG_NIV() >= 2 ? 'comptez · ' + fgTrempe(fgRecette(E)) + ' s' : 'retirez-la quand la vapeur s\'apaise', 3); return rendreForge();
  }
  if (g === 'retirer') {
    if (!E.plonge) return;
    const c = fgTrempe(fgRecette(E)), d = Math.abs(E.trempeT - c);
    E.pen.trempe += Math.min(15, Math.max(0, d - fgTol()) * 5); if (d > fgTol()) fgDefaut(E, 'trempe', E.trempeT < c ? 'retirée trop tôt' : 'laissée trop longtemps');
    E.plonge = false; E.etape = 'affut'; E.aff = { a: 0, v: 0, t: 0, hors: 0 }; SON.jouer('ramasse');
    fgDire('l\'affûtage : gardez l\'angle dans la bande (◀ ▶), cinq secondes', 3); return rendreForge();
  }
  if (g.startsWith('m:')) { if (E.etape !== 'monture') return; const i = +g.slice(2); if (!fgMontOk(i)) { fgDire('il manque ' + FG_MONT[i].nb + ' ' + (PLURIEL[FG_MONT[i].res] || FG_MONT[i].res), 1.8); return rendreForge(); } E.mont = i; return rendreForge(); }
  if (g === 'finir') return fgFinir();
  rendreForge();
}
const fgRecette = E => ({ type: E.type, ch: E.ch, coups: Math.max(6, Math.min(21, E.coups)), plis: Math.min(5, E.plis), bain: Math.max(0, E.bain), mont: Math.max(0, E.mont), ame: E.ame.slice(0, 3) });
// ---------- la boucle : la chaleur, la trempe, la meule ; le dessin ----------
function fgBoucle() {
  if (!fgOuverte()) return;
  const now = fgNow(), dt = Math.min(.05, Math.max(0, now - (FG.tt || now))); FG.tt = now;
  const E = FG.en;
  if (E) {
    if (E.plonge) { E.temp = Math.max(0, E.temp - .5 * dt); E.trempeT += dt; }
    else if (E.feu) {
      E.temp += FG.souffle ? .3 * dt * (1.12 - E.temp) * 2.2 : (.42 - E.temp) * .18 * dt;
      if (E.temp > .93) { E.pen.chauffe += 5 * dt; if (!E.def['brûlée au feu']) fgDefaut(E, 'chauffe', 'brûlée au feu'); }
    } else E.temp = Math.max(.04, E.temp - .03 * dt);
    if (E.etape === 'affut') {
      const A = E.aff; A.v += (Math.random() - .5) * 4 * dt + (FG.droite ? 2.6 : 0) * dt - (FG.gauche ? 2.6 : 0) * dt; A.v *= Math.pow(.4, dt);
      A.a = Math.max(-1, Math.min(1, A.a + A.v * dt)); A.t += dt; if (Math.abs(A.a) > .22) A.hors += dt;
      if (Math.random() < dt * 25) fgEtincelles(1, .8);
      if (A.t >= 5) { E.pen.affut += Math.min(15, A.hors * 5); E.etape = 'monture'; if (A.hors > .6) fgDefaut(E, 'affut', 'affûtée de travers'); fgDire('la monture : le manche et la garde', 2.4); rendreForge(); }
    }
  }
  fgDessiner(now);
  if (FG.en) fgJauge(now);
  FG.raf = requestAnimationFrame(fgBoucle);
}
function fgEtincelles(n, chaud) { if (!FG.ui) return; for (let k = 0; k < n; k++) FG.ui.etin.push({ x: 92, y: 66, vx: (Math.random() - .5) * 90, vy: -Math.random() * 70 - 10, l: .3 + Math.random() * .4, c: chaud > .5 ? '#ffe08a' : '#ffb060' }); }
function fgDessiner(now) {
  const c = FG.cx; if (!c) return;
  const E = FG.en, R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0)); };
  const rgb = a => 'rgb(' + a[0] + ',' + a[1] + ',' + a[2] + ')';
  const souffle = E && E.feu && FG.souffle, fl = .6 + .4 * Math.sin(now * 13) * Math.sin(now * 7.3), chaudFeu = E && E.feu ? (souffle ? 1 : .7) : .45;
  c.drawImage(fgFond(), 0, 0);                                                          // l'atelier : briques, poutre, étagère, outils, foyer, tapis
  { const l = typeof clarte === 'function' ? clarte() : .3, nuit = l < .45;              // la fenêtre : le ciel de l'île, à l'heure qu'il est
    R(128, 15, 24, 21, nuit ? '#141c34' : l < .75 ? '#c88a6a' : '#8fbcdc');
    if (nuit) { R(144, 18, 4, 4, '#f2ecd0'); R(145, 18, 3, 3, '#141c34'); for (const [x, y] of [[131, 18], [137, 22], [133, 29], [148, 30], [140, 17]]) R(x, y, 1, 1, (now * 2 + x) % 3 < 2.6 ? '#e8e4d0' : '#6a6a80'); }
    else { R(131, 27, 9, 3, '#f4f0ea'); R(133, 25, 5, 2, '#f4f0ea'); }
    R(139, 15, 2, 21, '#4a2e1e'); R(128, 25, 24, 2, '#4a2e1e'); }
  for (let k = 0; k < 12; k++) { const h = (4 + 6 * chaudFeu * (Math.sin(now * 9 + k * 1.7) * .5 + .5)) * fl; R(8 + k * 4, 50 - h, 4, h, k % 2 ? 'rgb(255,' + (120 + 80 * chaudFeu | 0) + ',40)' : 'rgb(255,' + (180 + 60 * chaudFeu | 0) + ',80)'); }
  R(8, 50, 48, 4, 'rgb(' + (200 + 55 * fl | 0) + ',70,30)');
  for (let k = 0; k < 9; k++) R(17 + k * 4, 86 + (k & 1), 3, 2, 'rgb(' + (150 + 100 * fl * (k % 3 ? .7 : 1) | 0) + ',' + (50 + 40 * fl | 0) + ',20)');   // les braises du cendrier
  R(60, 72, 14, 10, souffle ? '#8a5a3a' : '#7a4a30'); R(60, 71, 14, 2, '#5a3a24'); R(60, 82, 14, 1, '#5a3a24'); R(56, 76, 5, 2, '#46464e');   // le soufflet
  R(76, 84, 34, 16, '#6a4a30'); for (const y of [88, 94]) R(77, y, 32, 1, '#4e3420');   // la souche
  R(72, 72, 42, 12, '#3c3e46'); R(108, 74, 10, 6, '#3c3e46'); R(74, 72, 38, 2, '#62646e');   // l'enclume
  R(124, 66, 36, 34, '#6a4630'); for (let x = 128; x < 158; x += 6) R(x, 70, 1, 30, '#5a3a26'); for (const y of [70, 92]) R(123, y, 38, 3, '#3c3e46'); R(126, 66, 32, 4, '#1e3a4e'); R(130, 67, 8, 1, '#4a7a90');   // le bac
  { const coupT = now - FG.anim.coup, eveil = coupT < .5, souf = Math.sin(now * 1.9) > 0;   // la chatte, roulée en boule près du feu (un coup de marteau : elle lève la tête)
    const x0 = 24, y0 = 93, C = { o: '#de8a42', d: '#a85a28', e: eveil ? '#9ad070' : '#5a3018', p: '#e89a9a', w: '#f2e2c8', t: '#b8662e' };
    FG_CHAT.forEach((ln, r) => { for (let x = 0; x < ln.length; x++) { const k = ln[x]; if (k === '.') continue;
      const tete = x < 7 && r < 6, y = y0 + r - (tete && eveil ? 2 : 0) - (!tete && souf && r < 2 && x > 7 ? 1 : 0); R(x0 + x, y, 1, 1, C[k]); } });
    if (souf && !eveil) R(x0 + 9, y0, 8, 1, C.o); }
  { const fc = .75 + .25 * Math.sin(now * 11) * Math.sin(now * 4.7); R(112, 22 - fc * 2, 1, 2 + fc * 2, '#ffd27a'); R(112, 23, 1, 1, '#fff2c0'); }   // la bougie
  R(159, 8, 1, 5, '#2e2e34'); R(157, 13, 5, 1, '#3a3a40'); R(157, 14, 5, 7, 'rgb(255,' + (190 + 30 * fl | 0) + ',110)'); R(157, 14, 1, 7, '#3a3a40'); R(161, 14, 1, 7, '#3a3a40'); R(157, 21, 5, 1, '#3a3a40');   // la lanterne
  if (Math.random() < (E && E.feu ? .25 : .07) && FG.ui.etin.length < 80) FG.ui.etin.push({ x: 10 + Math.random() * 44, y: 48, vx: (Math.random() - .5) * 14, vy: -50 - Math.random() * 40, l: .5 + Math.random() * .5, c: Math.random() < .5 ? '#ffb050' : '#ffe08a' });   // les étincelles du foyer
  if (E) {
    const A = fgAlliage({ ch: E.ch }), col = rgb(fgCouleurChaud(E.temp, A.c)), L = 16 + Math.min(21, E.coups) * 1.4;
    if (E.plonge) { R(134, 60, 4, 16, col); }
    else if (E.feu) { R(14, 44, L * .7, 5, col); R(14 + L * .7, 44, 18, 3, '#55504a'); }
    else if (E.etape === 'affut' || E.etape === 'monture') { R(76, 66, L, 4, col); }
    else { R(76, 67, L, 5, col); for (let k = 0; k < E.plis; k++) R(78 + k * (L - 4) / Math.max(1, E.plis), 67, 1, 5, 'rgba(0,0,0,.35)'); R(76 + L, 68, 16, 3, '#55504a'); }
    if (E.temp > .5 && !E.plonge) { c.fillStyle = 'rgba(255,140,60,' + ((E.temp - .5) * .35).toFixed(2) + ')'; c.fillRect(E.feu ? 8 : 70, E.feu ? 38 : 60, E.feu ? 48 : 50, 18); }
    const dc = now - FG.anim.coup;                                                       // le marteau
    if (E.etape === 'frappe' && !E.feu) { if (dc < .12) { R(96, 56, 10, 9, '#8a8c96'); R(100, 40, 3, 16, '#6a4a32'); } else { R(104, 34, 10, 9, '#8a8c96'); R(112, 30, 16, 3, '#6a4a32'); }
      const ph = ((now - E.bat0) % FG_BAT + FG_BAT) % FG_BAT, p = Math.min(ph, FG_BAT - ph) / (FG_BAT / 2), r = 3 + 6 * (1 - p);   // le battement
      c.fillStyle = p < .32 ? '#ffd27d' : '#6a5a48'; c.beginPath(); c.arc(152, 14, r, 0, 6.2832); c.fill(); }
    if (E.plonge) {                                                                        // la vapeur
      const cible = fgTrempe(fgRecette(E)), k = Math.max(0, 1 - E.trempeT / cible);
      if (Math.random() < .2 + 2.5 * k) FG.ui.vap.push({ x: 128 + Math.random() * 28, y: 64, vy: -20 - Math.random() * 20, l: 1 + Math.random(), r: 2 + Math.random() * 3 });
    }
    if (E.etape === 'affut') {                                                             // la meule
      const a = now * 14; c.fillStyle = '#8c8880'; c.beginPath(); c.arc(98, 52, 12, 0, 6.2832); c.fill(); R(97, 40, 2, 24, '#6c6862');
      R(92 + Math.cos(a) * 9, 52 + Math.sin(a) * 9, 2, 2, '#b8b4ac');
      R(20, 8, 128, 6, '#2c2c34'); R(84 - 128 * .11, 8, 128 * .22, 6, '#3c6a3c'); R(84 + E.aff.a * 62 - 1, 5, 3, 12, '#fff');
    }
  }
  for (let k = FG.ui.etin.length - 1; k >= 0; k--) { const s = FG.ui.etin[k]; s.l -= 1 / 60; if (s.l <= 0) { FG.ui.etin.splice(k, 1); continue; } s.x += s.vx / 60; s.y += s.vy / 60; s.vy += 160 / 60; R(s.x, s.y, 1, 1, s.c); }
  for (let k = FG.ui.vap.length - 1; k >= 0; k--) { const s = FG.ui.vap[k]; s.l -= 1 / 60; if (s.l <= 0) { FG.ui.vap.splice(k, 1); continue; } s.y += s.vy / 60; s.x += Math.sin(s.y * .2); c.fillStyle = 'rgba(220,226,232,' + (s.l * .35).toFixed(2) + ')'; c.fillRect(s.x, s.y, s.r, s.r); }
  // la lueur chaude du foyer, de la bougie et de la lanterne ; la pénombre dans les coins
  const halo = (x, y, r, a, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  c.globalCompositeOperation = 'lighter';
  halo(32, 54, 96, (.13 + .09 * chaudFeu) * (.85 + .15 * fl), '255,120,40'); halo(112, 22, 18, .1, '255,190,100'); halo(159, 17, 26, .1 + .02 * fl, '255,180,90');
  if (E && E.temp > .4 && !E.feu && !E.plonge) halo(92, 68, 34, (E.temp - .4) * .25, '255,140,60');
  c.globalCompositeOperation = 'source-over';
  const v = c.createRadialGradient(84, 58, 40, 84, 58, 112); v.addColorStop(0, 'rgba(20,8,4,0)'); v.addColorStop(1, 'rgba(20,8,4,.5)'); c.fillStyle = v; c.fillRect(0, 0, FG_W, FG_H);
}
// Le décor fixe de l'atelier, peint une fois
// la chatte endormie, roulée en boule (o : roux, d : rayures, e : l'œil, p : la truffe, w : le poitrail, t : la queue)
const FG_CHAT = ['.o...o..............', '.oo.oo...oooooo.....', 'ooooooo.oodoodood...', 'oeooeoooooooooooooo.', 'ooopoooodoodooooooo.', '.owwoooooooooooooooo', '..wwtttttttttttttoo.', '....................'];
function fgFond() {
  if (FG.fond) return FG.fond;
  const cv = document.createElement('canvas'); cv.width = FG_W; cv.height = FG_H;
  const c = cv.getContext('2d'), R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }, H = i => ((Math.imul(i + 7, 2654435761) >>> 0) % 1000) / 1000;
  R(0, 0, FG_W, FG_H, '#2e1c15');                                                        // le mortier
  for (let y = 8, r = 0; y < 100; y += 6, r++) for (let x = (r & 1) * -6; x < FG_W; x += 12) { const h = H(r * 131 + x * 7); R(x + 1, y + 1, 11, 5, ['#5e3424', '#683a28', '#552e20', '#71422c', '#603626'][h * 5 | 0]); if (h > .8) R(x + 2, y + 2, 4, 1, '#7c4c34'); }
  R(0, 0, FG_W, 8, '#4e3020'); for (let x = 10; x < FG_W; x += 26) R(x, 1, 1, 6, '#3a2216'); R(0, 7, FG_W, 1, '#2a180f');   // la poutre
  R(64, 8, 4, 92, '#4e3020'); R(67, 8, 1, 92, '#36200f');                                // le poteau
  R(126, 13, 28, 25, '#4e3020'); R(125, 37, 30, 2, '#5e3a26');                           // le cadre de la fenêtre, son appui
  R(72, 30, 46, 3, '#7a5236'); R(74, 33, 2, 4, '#4e3020'); R(114, 33, 2, 4, '#4e3020');   // l'étagère
  R(76, 22, 6, 8, '#3d6a5a'); R(77, 21, 4, 1, '#7a5236'); R(78, 24, 1, 4, '#5a9a82');    // les bocaux, les livres, la bougie
  R(84, 24, 5, 6, '#9a6a44'); R(85, 23, 3, 1, '#c8a070'); R(91, 20, 4, 10, '#5a4a7a'); R(92, 18, 2, 2, '#5a4a7a'); R(92, 21, 1, 6, '#7a6aa0');
  R(99, 22, 3, 8, '#7a2e22'); R(102, 23, 3, 7, '#2e4a6a'); R(105, 21, 3, 9, '#6a5a2a'); R(99, 24, 9, 1, '#c8a050');
  R(110, 25, 5, 5, '#e8dcc0'); R(109, 29, 7, 1, '#8a8c94');
  for (const x of [80, 92, 101, 110]) R(x, 38, 1, 1, '#9a9ca4');                         // les clous, les outils pendus
  for (let k = 0; k < 15; k++) { R(80 - k * .15, 39 + k, 1, 1, '#6a6c74'); R(80 + k * .15, 39 + k, 1, 1, '#6a6c74'); }
  R(92, 39, 1, 12, '#7a5236'); R(89, 50, 7, 4, '#6a6c74'); R(89, 50, 7, 1, '#8a8c94');
  R(101, 39, 2, 4, '#7a5236'); R(101, 43, 2, 11, '#7a7c84');
  c.strokeStyle = '#7a7c84'; c.lineWidth = 2; c.beginPath(); c.arc(110.5, 44, 3.5, .2, Math.PI - .2, true); c.stroke();
  R(0, 100, FG_W, 12, '#4e3222'); for (let x = 0; x < FG_W; x += 21) R(x, 100, 1, 12, '#352214'); R(0, 100, FG_W, 1, '#664430');   // le plancher
  for (let k = 0; k < 9; k++) R(H(k) * FG_W | 0, 103 + (H(k + 40) * 8 | 0), 2, 1, '#3e2818');
  R(6, 102, 54, 8, '#8a3428'); R(8, 104, 50, 1, '#d8a050'); R(8, 107, 50, 1, '#d8a050'); for (let x = 10; x < 56; x += 6) R(x, 105, 2, 2, '#e8c070');   // le tapis
  for (let x = 6; x < 60; x += 4) { R(x, 110, 1, 2, '#c8964a'); }
  R(4, 52, 56, 48, '#5e4a3e');                                                           // le foyer de pierre
  for (let y = 54, r = 0; y < 100; y += 7, r++) for (let x = 4 + (r & 1) * 7; x < 58; x += 14) { const h = H(r * 17 + x); R(x + 1, y + 1, Math.min(13, 59 - x), 6, h < .4 ? '#6e5848' : h < .75 ? '#665040' : '#76604e'); }
  R(2, 50, 60, 4, '#7e6a58'); R(2, 50, 60, 1, '#96806a');
  R(14, 76, 36, 20, '#1a0c08'); R(16, 74, 32, 2, '#1a0c08'); R(20, 72, 24, 2, '#1a0c08');   // la gueule du cendrier
  R(16, 92, 32, 4, '#2a140c');
  for (let y = 18; y < 30; y++) { const w = 30 + (y - 18) * 2.6 | 0; R(32 - w / 2 | 0, y, w, 1, y & 1 ? '#5a4a40' : '#54443a'); }   // la hotte, la cheminée
  R(0, 30, 64, 3, '#b07040'); R(0, 30, 64, 1, '#d09060'); R(22, 0, 20, 18, '#4e3e34'); R(22, 0, 2, 18, '#5e4c40'); R(40, 0, 2, 18, '#3e3028');
  R(46, 92, 12, 8, '#6a4228'); R(46, 92, 12, 1, '#8a5a38'); R(48, 88, 9, 4, '#5e3a22');   // les bûches
  return FG.fond = cv;
}
// la jauge sous la scène : la chaleur (et la couleur juste), ou le temps de trempe
function fgJauge(now) {
  const E = FG.en, el = FG.el; if (!el || !E) return;
  const J = el.querySelector('.fg-jauge'), T = el.querySelector('.fg-jt'), n = FG_NIV(), Rr = fgRecette(E);
  let h, tx;
  if (E.plonge || (E.etape === 'trempe' && E.bain >= 0)) {
    const c = fgTrempe(Rr), k = Math.min(1, E.trempeT / (c * 1.8));
    h = `<i style="left:${(k * 100).toFixed(1)}%"></i>` + (n >= 2 ? `<s style="left:${(c / (c * 1.8) * 100).toFixed(1)}%"></s>` : '');
    tx = `<span>trempe · ${FG_BAINS[E.bain].n}</span><span>${n >= 2 ? E.trempeT.toFixed(1) + ' s / ' + c + ' s' : E.plonge ? (E.trempeT / c < .85 ? 'la vapeur monte' : E.trempeT / c < 1.15 ? 'la vapeur s\'apaise' : 'plus de vapeur') : ''}</span>`;
    J.style.background = 'linear-gradient(90deg,#28424e,#4a8aa0 55%,#9ad0de)';
  } else {
    const c = fgCible(Rr), chauffe = !E.chauffeFaite;
    h = `<i style="left:${(Math.min(1, E.temp) * 100).toFixed(1)}%"></i>`
      + (chauffe ? (n >= 2 ? `<s style="left:${(c * 100).toFixed(1)}%"></s>` : `<u style="left:${((c - .08) * 100).toFixed(1)}%;width:16%"></u>`) : '')
      + (!chauffe && ['plis', 'ame'].includes(E.etape) ? `<s style="left:${(E.etape === 'plis' ? 45 : 50)}%;background:#9fe08a"></s>` : '');
    tx = `<span>${fgCouleurNom(E.temp)}${E.feu ? (FG.souffle ? ' · le soufflet' : ' · au feu') : ''}</span><span>${chauffe ? 'la couleur juste : ' + fgCouleurNom(c) + (n >= 2 ? ' (' + Math.round(c * 100) + ')' : '') : E.etape === 'plis' ? 'plier au-dessus du vert' : E.etape === 'ame' ? 'verser au-dessus du vert' : E.etape === 'frappe' ? (E.temp < .3 ? 'trop froide : au feu' : 'frappez sur le battement') : ''}</span>`;
    J.style.background = '';
  }
  if (FG.h.j !== h) { FG.h.j = h; J.innerHTML = h; }
  if (FG.h.jt !== tx) { FG.h.jt = tx; T.innerHTML = tx; }
}
// ---------- le rendu de la fenêtre ----------
function rendreForge() {
  const el = FG.el; if (!el) return;
  const pose = (sel, html) => { if (FG.h[sel] !== html) { FG.h[sel] = html; el.querySelector(sel).innerHTML = html; } };
  const n = FG_NIV(), E = FG.en, now = fgNow(), maj = x => x[0].toUpperCase() + x.slice(1);
  pose('.fg-niv', 'niveau ' + n);
  pose('.fg-ong', [['forger', 'Forger'], ['armes', 'Mes armes'], ['code', 'Lire un code'], ['carnet', 'Carnet']].map(([k, tt]) => `<button data-fg="v:${k}" class="${FG.vue === k ? 'on' : ''}">${tt}</button>`).join(''));
  pose('.fg-res', FG_MAT.map((M, k) => `<span>${img(M.ingr ? icIngr(M.id) : M.id)}${fgDispoMat(k)}</span>`).join(''));
  const forger = FG.vue === 'forger';
  el.querySelector('.fg-corps').style.display = forger ? '' : 'none'; el.querySelector('.fg-autre').style.display = forger ? 'none' : '';
  if (!forger) { pose('.fg-autre', fgAutre() + `<div class="fg-msg">${now < FG.msgT ? ESC(FG.msg) : ''}</div>`); return; }
  const ti = E ? E.type : FG.choix, T = FG_TYPES[ti];
  const venir = FG_TYPES.filter(x => !fgDispo(x)), cache = FG_TYPES.filter(x => fgDispo(x) && !fgConnu(x));
  pose('.fg-g', `<div class="fg-h">Les plans</div>` + FG_TYPES.map((x, i) => fgConnu(x) ? `<button class="fg-p${i === ti ? ' on' : ''}" data-fg="p:${i}"${E && i !== ti ? ' disabled' : ''}>${img('fgt_' + x.id)}<span><b>${x.n}</b><small>${ESC(x.meca)}</small></span></button>` : '').join('')
    + (cache.length ? `<div class="fg-h">À trouver</div>` + cache.map(x => `<button class="fg-p" disabled>${img('fgt_' + x.id)}<span><b>${x.n}</b><small>plan à trouver : coffres du Centre et des Cercles</small></span></button>`).join('') : '')
    + `<div class="fg-note">${venir.length} plans viendront : ${venir.map(x => x.n.toLowerCase()).join(', ')}.</div>`);
  // au milieu : ce qu'on peut faire, à cet instant
  const B = (g, t, sous, cl = '', dis = false) => `<button class="fg-b ${cl}" data-fg="${g}"${dis ? ' disabled' : ''}>${t}${sous ? `<small>${sous}</small>` : ''}</button>`;
  let ctl = '';
  if (!E) {
    const tot = FG.ch.reduce((a, b) => a + b, 0), cout = fgCoutCharge(FG.ch);
    ctl = FG_MAT.map((M, k) => `<div class="fg-mat">${img(M.ingr ? icIngr(M.id) : M.id)}<span>${M.n} <small>· ${M.q} par portion · ${fgDispoMat(k)} en réserve</small></span>${B('c-:' + k, '−', '', 'mini')}<em>${FG.ch[k]}</em>${B('c+:' + k, '+', '', 'mini')}</div>`).join('')
      + B('aufeu', 'AU FEU', tot < 2 ? 'deux à quatre portions' : (ditCoutTxt(cout, FG.ch[4]) || 'la charge'), 'prim', tot < 2 || !fgChargeOk(FG.ch));
  } else if (E.plonge) ctl = B('retirer', 'RETIRER', 'Espace');
  else if (E.feu) ctl = B('souffle', 'SOUFFLET', 'maintenir · Espace', 'prim') + B('enclume', 'SUR L\'ENCLUME', E.chauffeFaite ? 'reprendre le travail' : 'à la bonne couleur');
  else if (E.etape === 'frappe') ctl = B('frapper', 'FRAPPER', 'sur le battement · Espace', 'prim') + B('aufeu', 'AU FEU', 'réchauffer') + B('fini', 'FINI', E.coups + ' coups', '', E.coups < 6);
  else if (E.etape === 'plis') ctl = B('plier', 'PLIER', E.plis + ' pli' + (E.plis > 1 ? 's' : '') + ' · Espace', 'prim') + B('aufeu', 'AU FEU', 'réchauffer') + B('suite', 'SUITE', 'l\'âme');
  else if (E.etape === 'ame') {
    const L = Object.keys(INGR).filter(id => essai || qteIngr(id) > 0).sort((a, b) => INGR[b].r - INGR[a].r).slice(0, 48);
    ctl = `<div class="fg-ings">${L.length ? L.map(id => `<button class="fg-in${INGR[id].r > 1 ? ' r' + Math.min(5, INGR[id].r) : ''}" data-fg="i:${id}" title="${ESC(INGR[id].n + ' · ' + FG_ELEM[fgElemDe(id)].n)}"${E.ame.length >= Math.max(1, n) ? ' disabled' : ''}>${img(icIngr(id))}<b>${essai ? '∞' : qteIngr(id)}</b></button>`).join('') : '<span class="fg-note">aucun ingrédient au sac</span>'}</div>`
      + B('aufeu', 'AU FEU', 'réchauffer') + B('suite', 'SUITE', E.ame.length ? 'la trempe' : 'sans âme');
  } else if (E.etape === 'trempe') ctl = FG_BAINS.map((b, i) => B('b:' + i, b.n.toUpperCase(), fgBainTxt(i), E.bain === i ? 'prim' : '', !fgBainOk(i))).join('') + B('plonger', 'PLONGER', 'la pièce chaude', 'prim', E.bain < 0) + B('aufeu', 'AU FEU', 'réchauffer');
  else if (E.etape === 'affut') ctl = B('gauche', '◀', 'maintenir') + B('droite', '▶', 'maintenir');
  else if (E.etape === 'monture') ctl = FG_MONT.map((m, i) => B('m:' + i, m.n.toUpperCase(), m.nb + ' ' + (PLURIEL[m.res] || m.res), E.mont === i ? 'prim' : '', !fgMontOk(i))).join('')
    + (n >= 3 ? `<input class="fg-grave" maxlength="24" placeholder="gravure : un nom (facultatif)" style="width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(220,190,150,.3);border-radius:8px;color:#fff0dc;padding:6px 8px;font:inherit">` : '')
    + B('finir', 'FINIR', 'l\'arme est prête', 'prim', E.mont < 0);
  if (E) ctl += B('abandon', 'abandonner', '', 'mini');
  if (!(E && E.etape === 'monture' && el.querySelector('.fg-grave') === document.activeElement)) pose('.fg-ctl', ctl);
  pose('.fg-msg', now < FG.msgT ? ESC(FG.msg) : '');
  if (!E) { el.querySelector('.fg-jauge').style.visibility = 'hidden'; el.querySelector('.fg-jt').innerHTML = ''; FG.h.j = FG.h.jt = ''; } else el.querySelector('.fg-jauge').style.visibility = '';
  // à droite : la recette en cours, la justesse, ce que donnera l'âme
  const Rr = E ? fgRecette(E) : null, et = E ? E.etape : 'charge', ord = ['charge', 'chauffe', 'frappe', 'plis', 'ame', 'trempe', 'affut', 'monture'], io = ord.indexOf(et);
  const li = (k, t, v) => `<li class="${k === et ? 'cour' : ''}"><b>${t}</b><span>${v}</span></li>`;
  const nomI = id => INGR[id] ? INGR[id].n.toLowerCase() : id;
  const C = E ? fgAme(Object.assign({}, Rr, { bain: E.bain >= 0 ? E.bain : 0 })) : null;
  pose('.fg-d', `<div class="fg-h">${ESC(T.n)}</div><div class="fg-note">${ESC(maj(T.meca))}.</div>`
    + `<ul class="fg-et">` + li('charge', 'Charge', E ? E.ch.map((q, k) => q ? q + ' ' + FG_MAT[k].n : '').filter(Boolean).join(' + ') : FG.ch.some(Boolean) ? FG.ch.map((q, k) => q ? q + ' ' + FG_MAT[k].n : '').filter(Boolean).join(' + ') : '<small>deux à quatre portions</small>')
    + li('chauffe', 'Chauffe', !E ? '<small>au soufflet</small>' : E.chauffeFaite ? 'faite' + (E.pen.chauffe > 3 ? ' <i>−' + Math.round(E.pen.chauffe) + '</i>' : '') : 'vers ' + fgCouleurNom(fgCible(Rr)) + (n >= 2 ? ' (' + Math.round(fgCible(Rr) * 100) + ')' : ''))
    + li('frappe', 'Martelage', E && io >= 2 ? E.coups + ' coups' + (E.pen.frappe ? ' <i>−' + Math.round(E.pen.frappe) + '</i>' : '') : '<small>six à vingt et un coups, en rythme</small>')
    + li('plis', 'Plis', E && io >= 3 ? E.plis + (E.pen.plis ? ' <i>−' + Math.round(E.pen.plis) + '</i>' : '') + ' <small>· ' + FG_DECL_TXT[FG_DECL[Math.min(5, E.plis)]] + '</small>' : '<small>0 à 5 : le déclencheur</small>')
    + li('ame', 'Âme', E && io >= 4 ? (E.ame.length ? E.ame.map(nomI).join(', puis ') : 'rien') + (E.pen.ame ? ' <i>−' + E.pen.ame + '</i>' : '') : '<small>l\'élément</small>')
    + li('trempe', 'Trempe', E && io >= 5 ? (E.bain >= 0 ? FG_BAINS[E.bain].n + (n >= 2 ? ' · ' + fgTrempe(Rr) + ' s' : '') : 'le bain ?') + (E.pen.trempe ? ' <i>−' + Math.round(E.pen.trempe) + '</i>' : '') : '<small>la forme</small>')
    + li('affut', 'Affûtage', E && io >= 6 ? (io > 6 ? 'fait' : 'en cours') + (E.pen.affut ? ' <i>−' + Math.round(E.pen.affut) + '</i>' : '') : '<small>à la meule</small>')
    + li('monture', 'Monture', E && io >= 7 ? (E.mont >= 0 ? FG_MONT[E.mont].n : 'à choisir') : '<small>le manche</small>') + `</ul>`
    + (E ? `<div class="fg-just">Justesse en cours : <b>${fgJustesse(E)} %</b>${fgJustesse(E) >= 97 ? ' · chef-d\'œuvre' : ''}</div>`
      + (Object.keys(E.def).length ? `<div class="fg-note">${Object.entries(E.def).map(([m, k]) => ESC(m) + (k > 1 ? ' ×' + k : '')).join(' · ')}</div>` : '')
      + (io >= 4 ? `<div class="fg-h">Ce que fera l'âme</div><div class="fg-note">${ESC(fgCompTxt(C))}${E.bain < 0 ? ' <small>(la forme dépend du bain)</small>' : ''}</div>` : '') : '')
    + `<div class="fg-note">${FG_NIV_DIT[Math.max(1, n)]}.</div>`);
}
const ditCoutTxt = (c, damne) => Object.entries(c).map(([r, q]) => q + ' ' + (q > 1 ? PLURIEL[r] || r : RES[r] || r)).concat(damne ? [damne + ' fer damné'] : []).join(' · ');
// ---------- mes armes, lire un code, le carnet ----------
const fgIc = id => { objet(id); return img(id); };
function fgAutre() {
  const n = FG_NIV(), fiche = FG.fiche ? fgFicheHtml(FG.fiche.code, FG.fiche.id) : '';
  if (FG.vue === 'armes') {
    fgEtat(); const ids = Object.keys(P.objets).filter(id => P.objets[id] && fgLireId(id)), j = typeof equipierProche === 'function' ? equipierProche() : null;
    return fiche + `<div class="fg-h">Vos armes forgées</div>` + (ids.length ? ids.map(id => {
      const L = fgLireId(id), O = objet(id), S = fgStats(L.R, L.j), I = P.forge[id] || { u: 0 }, u = Math.min(1, (I.u | 0) / S.usure), rc = fgCoutRep(L.R), don = FG.donC && FG.donC.id === id && fgNow() < FG.donC.t;
      return `<div class="fg-arme">${img(id)}<div><b>${ESC(O.n)}</b><small>${ESC(fgNom(L.R).split(' · ')[1])} · justesse ${L.j} %${L.j >= 97 ? ' ★' : ''} · dégâts ${Math.round(O.deg * 100)}${I.f ? ' · forgée par ' + ESC(I.f) : ''}</small>`
        + `<div class="fg-us"><i style="width:${Math.round(u * 100)}%;${u >= 1 ? 'background:#e07a6a' : ''}"></i></div><small>usure ${Math.round(u * 100)} %${u >= 1 ? ' : émoussée' : ''}</small></div>`
        + `<button class="fg-b mini" data-fg="fiche:${id}">Fiche</button><button class="fg-b mini" data-fg="rep:${id}"${(I.u | 0) > 0 && fgRepOk(rc) ? '' : ' disabled'} title="${ESC(ditCoutTxt(rc))}">Réparer<small>${ESC(ditCoutTxt(rc))}</small></button>`
        + (j ? `<button class="fg-b mini${don ? ' prim' : ''}" data-fg="don:${id}">${don ? 'Confirmer' : 'Donner'}<small>à ${ESC(j.nom || '?')}</small></button>` : '') + `</div>`; }).join('')
      : '<div class="fg-note">Aucune arme forgée pour l\'instant.</div>') + `<div class="fg-note">On donne une arme à un équipier à portée : elle part avec sa fiche et son poinçon.</div>`;
  }
  if (FG.vue === 'code') return `<div class="fg-h">Lire un code</div><div class="fg-code"><input placeholder="FG-XXXX-XXXX-XXXXX" maxlength="20" data-fg="champ"><button class="fg-b" data-fg="lire">Lire</button></div>`
    + `<div class="fg-note">La forge de niveau ${n} lit ${n >= 3 ? 'toute la fiche' : n >= 2 ? 'le plan, la charge, la chauffe, les coups, les plis, la trempe et la monture' : 'le plan, la charge et la monture'}. Une ligne illisible se déchiffre avec quinze éclats.</div>` + fiche;
  fgEtat();
  const forgees = Object.entries(P.forgeCarnet), lues = Object.keys(P.forgeLu).filter(c => !P.forgeCarnet[c]);
  return fiche + `<div class="fg-h">Le carnet de forge</div>` + (forgees.length ? forgees.map(([c, v]) => `<button class="fg-p" data-fg="fc:${c}">${fgIc(fgIdDe(c, v.j))}<span><b>${ESC(v.nom || fgCodeAffiche(c))}</b><small>${fgCodeAffiche(c)} · forgée ${v.n} fois · au mieux ${v.j} %</small></span></button>`).join('') : '<div class="fg-note">Rien de forgé encore.</div>')
    + (lues.length ? `<div class="fg-h">Les codes lus</div>` + lues.map(c => `<button class="fg-p" data-fg="fc:${c}"><span><b>${fgCodeAffiche(c)}</b><small>${(P.forgeLu[c] || []).length} ligne${(P.forgeLu[c] || []).length > 1 ? 's' : ''} déchiffrée${(P.forgeLu[c] || []).length > 1 ? 's' : ''}</small></span></button>`).join('') : '');
}
function fgEviter(R) {
  const L = [];
  if (R.plis < 5) L.push((R.plis + 1) + ' pli' + (R.plis ? 's' : '') + ' : un autre déclencheur (' + FG_DECL_TXT[FG_DECL[R.plis + 1]] + ')');
  L.push('six plis : la lame casse');
  L.push('un autre bain change la forme (l\'eau : sur le coup ; l\'huile : au sol ; le sang : sur soi ; le nectar : en trait ; la neige : en aura)');
  if (R.ame.length > 1) L.push('l\'âme dans un autre ordre : une autre arme, d\'autres dosages');
  L.push('l\'âme versée sous le vert ne prend pas');
  if (R.ch[2]) L.push('l\'os brûle vite : pas au-delà de ' + fgCouleurNom(fgCible(R) + .12));
  if (R.ch[4]) L.push('le fer damné veut une chauffe plus haute, et une trempe plus longue');
  return L.join(' · ');
}
function fgFicheHtml(code, id) {
  const R = fgDecode(code); if (!R) return '';
  fgEtat();
  const T = FG_TYPES[R.type], C = fgAme(R), n = FG_NIV(), propre = !!(P.forgeCarnet[code] && P.forgeCarnet[code].f), lu = P.forgeLu[code] || [];
  const voit = (k, niv) => propre || n >= niv || lu.includes(k);
  const I = id && P.forge[id];
  const L = [['type', 'Arme', T.n + ' · ' + T.meca, 1], ['charge', 'Charge', R.ch.map((q, k) => q ? q + ' ' + FG_MAT[k].n : '').filter(Boolean).join(' + '), 1],
    ['chauffe', 'Chauffe', fgCouleurNom(fgCible(R)) + ' (' + Math.round(fgCible(R) * 100) + ')', 2], ['coups', 'Martelage', R.coups + ' coups, sur le battement', 2],
    ['plis', 'Plis', R.plis + (R.plis ? ', la lame encore chaude' : ''), 2],
    ['ame', 'Âme', R.ame.length ? R.ame.map((x, i) => (i ? 'puis ' : '') + (INGR[x] ? INGR[x].n.toLowerCase() : x)).join(', ') + (R.ame.length > 1 ? ' : dans cet ordre' : '') : 'rien', 3],
    ['trempe', 'Trempe', FG_BAINS[R.bain].n + ', ' + fgTrempe(R) + ' s (±' + fgTol() + ')', 2], ['monture', 'Monture', FG_MONT[R.mont].n, 1],
    ['comp', 'Compétence', fgCompTxt(C), 3], ['eviter', 'À éviter', fgEviter(R), 3]];
  return `<div class="fg-fiche"><h4>${ESC(fgNom(R))}${I && I.f ? ' · forgée par ' + ESC(I.f) : ''}<br>${fgCodeAffiche(code)}</h4>`
    + L.map(([k, tt, v, nv]) => voit(k, nv) ? `<div class="fl"><b>${tt}</b><span>${ESC(v)}</span></div>`
      : `<div class="fl cache"><b>${tt}</b><span>▒▒▒▒▒▒▒▒▒▒</span><button class="fg-b mini" data-fg="dech:${code}:${k}">déchiffrer<small>15 éclats</small></button></div>`).join('')
    + `<div style="display:flex;gap:6px;margin-top:8px"><button class="fg-b mini" data-fg="copier">Copier le code</button><button class="fg-b mini" data-fg="fermefiche">Fermer</button></div></div>`;
}
function fgDechiffrer(arg) {
  const [code, k] = arg.split(':'); if (!fgDecode(code)) return;
  fgEtat(); const L = P.forgeLu[code] || (P.forgeLu[code] = []); if (L.includes(k)) return;
  if (!essai && dispo('eclat') < 15) { fgDire('il faut quinze éclats', 1.8); return rendreForge(); }
  if (!essai) payer({ eclat: 15 });
  L.push(k); FG.fiche = { code, id: FG.fiche && FG.fiche.id }; Sauve.sale = true; SON.jouer('sort', { vol: .5 }); fgDire('une ligne de plus se lit', 1.6); rendreForge();
}
// ---------- réparer, donner ----------
const fgCoutRep = R => { const c = { ferraille: 8 + 2 * R.ch.reduce((a, b) => a + b, 0) }; if (R.ch[3]) c.eclat = 4 + R.ch[3] * 2; if (R.ch[2]) c.os = 3 * R.ch[2]; return c; };
const fgRepOk = c => essai || Object.entries(c).every(([r, q]) => dispo(r) >= q);
function fgReparer(id) {
  const L = fgLireId(id); fgEtat(); const I = P.forge[id]; if (!L || !I || !P.objets[id]) return;
  const c = fgCoutRep(L.R); if (!fgRepOk(c)) { fgDire('il manque ' + ditCoutTxt(c), 2); return rendreForge(); }
  if (!essai) payer(c); I.u = 0; Sauve.sale = true; SON.jouer('clank', { vol: .7 }); fgDire((objet(id) || {}).n + ' est comme neuve', 2); if (typeof majSac === 'function') majSac(); rendreForge();
}
function fgDonner(id) {
  const j = typeof equipierProche === 'function' ? equipierProche() : null;
  if (!j) { fgDire('aucun équipier à portée', 1.8); return rendreForge(); }
  if (!(RS.ouvert && Compte.uid)) { fgDire('hors ligne : impossible de donner', 2); return rendreForge(); }
  if (!(FG.donC && FG.donC.id === id && fgNow() < FG.donC.t)) { FG.donC = { id, t: fgNow() + 4 }; fgDire('donner ' + (objet(id) || {}).n + ' à ' + j.nom + ' ? appuyez encore', 3); return rendreForge(); }
  FG.donC = null; fgEtat(); const I = P.forge[id] || { u: 0 };
  diffuser(canalIle(), 'arme', { u: Compte.uid, n: pseudo(), a: j.u, w: id, f: String(I.f || pseudo()).slice(0, 18), nm: String(I.n || '').slice(0, 24), us: I.u | 0 });
  delete P.objets[id]; delete P.forge[id];
  for (const emp of Object.keys(P.equip)) if (P.equip[emp] === id) P.equip[emp] = null;
  P.raccourcis = P.raccourcis.map(x => x === id ? null : x);
  Sauve.sale = true; SON.jouer('lien'); say((objet(id) || {}).n + ' · donnée à ' + j.nom, 3); if (typeof majSac === 'function') majSac(); rendreForge();
}
function forgeRecue(d) {
  if (!d || d.a !== Compte.uid) return;
  const id = String(d.w || ''), L = fgLireId(id); if (!L) return;
  const net = s => String(s || '').replace(/[<>]/g, '').slice(0, 24);
  fgEtat(); P.objets[id] = 1; P.forge[id] = { u: Math.max(0, d.us | 0), f: net(d.f).slice(0, 18), n: net(d.nm) };
  if (!P.forgeLu[L.code]) P.forgeLu[L.code] = [];
  const O = objet(id); if (O && P.forge[id].n) O.n = P.forge[id].n;
  if (typeof rangerRaccourci === 'function') rangerRaccourci(id);
  Sauve.sale = true; SON.jouer('rare'); say(net(d.n || 'quelqu\'un') + ' vous donne ' + (O ? O.n : 'une arme forgée') + ' · sa fiche est à la forge', 4.5);
  if (typeof majSac === 'function') majSac();
}
// ---------- finir l'arme ----------
function fgFinir() {
  const E = FG.en; if (!E || E.etape !== 'monture') return;
  if (E.mont < 0) { fgDire('choisissez la monture', 1.6); return rendreForge(); }
  if (!fgMontOk(E.mont)) { fgDire('il manque de quoi monter l\'arme', 1.8); return rendreForge(); }
  if (!essai) payer({ [FG_MONT[E.mont].res]: FG_MONT[E.mont].nb });
  const R = fgRecette(E), code = fgEncode(R), j = fgJustesse(E), id = fgIdDe(code, j), C = fgAme(R), S = fgStats(R, j);
  const gr = FG_NIV() >= 3 && FG.el.querySelector('.fg-grave') ? String(FG.el.querySelector('.fg-grave').value || '').replace(/[<>]/g, '').trim().slice(0, 24) : '';
  fgEtat(); const deja = !!P.objets[id], av = P.forge[id];
  P.objets[id] = 1; P.forge[id] = { u: 0, f: typeof pseudo === 'function' ? String(pseudo()).slice(0, 18) : '', n: gr || (deja && av && av.n) || '' };
  const O = objet(id); if (O) O.n = P.forge[id].n || fgNom(R).split(' · ')[0];
  const cn = P.forgeCarnet[code] || (P.forgeCarnet[code] = { n: 0, j: 0, nom: '' }); cn.n++; cn.j = Math.max(cn.j, j); cn.nom = fgNom(R); cn.f = 1;
  if (typeof rangerRaccourci === 'function') rangerRaccourci(id);
  const defs = Object.entries(E.def);
  FG.en = null; FG.ch = [0, 0, 0, 0, 0]; Sauve.sale = true; if (typeof majSac === 'function') majSac();
  SON.jouer(j >= 97 ? 'rare' : 'niveau');
  const L = fgLieu0(); if (L) burst(L.x, L.y, L.z + 1, j >= 97 ? 60 : 30, j >= 97 ? '#ffd27d' : '#ffb060');
  if (typeof montrerBilan === 'function') montrerBilan(`<div class="ab-fiole">${img(id)}</div><div class="ab-v">${j >= 97 ? '★ Chef-d\'œuvre' : 'Arme forgée'}</div>`
    + `<div class="ab-n">${ESC(O ? O.n : '')} · ${ESC(fgNom(R).split(' · ')[1])}</div><div class="ab-j"><i style="width:${j}%"></i></div>`
    + `<div class="ab-s">justesse ${j} % · dégâts ${O ? Math.round(O.deg * 100) : '?'} · tient ${S.usure} coups avant de s'émousser</div>`
    + (defs.length ? `<div class="ab-g">${defs.map(([m, k]) => `<span class="ab-p mal"><b>✗</b>${ESC(m)}${k > 1 ? ' ×' + k : ''}</span>`).join('')}</div>` : `<div class="ab-g"><span class="ab-p bon"><b>✓</b>chaque geste juste</span></div>`)
    + `<div class="ab-eff">${ESC(fgCompTxt(C))}</div><div class="ab-s">${fgCodeAffiche(code)}${deja ? ' · vous l\'aviez déjà : la voici remise à neuf' : ''}</div><button class="ab-ok" data-ab="ok">Continuer</button>`, j >= 97 ? 'or' : 'ok');
  rendreForge();
}
const fgLieu0 = () => FG.lieu;
// ---------- la sauvegarde ----------
function forgeSauve() {
  fgEtat();
  const armes = {}; for (const [id, I] of Object.entries(P.forge)) if (P.objets[id] && fgLireId(id)) armes[id] = { u: I.u | 0, f: I.f || '', n: I.n || '' };
  return { niv: FG_NIV(), armes, carnet: P.forgeCarnet, lu: P.forgeLu, pos: P.forgePos || null, plans: P.forgePlans };
}
function forgeLue(d) {
  P.forgeNiv = 0; P.forge = {}; P.forgeCarnet = {}; P.forgeLu = {}; P.forgePos = null; P.forgePlans = []; FG.lieuK = ''; FG.en = null; FG.modes = {};
  if (!d || typeof d !== 'object') return;
  if (Array.isArray(d.plans)) P.forgePlans = [...new Set(d.plans.filter(id => FG_TYPES.some(T => T.id === id && T.ph !== 'A')))];
  const ps = d.pos; if (ps && [ps.g, ps.cx, ps.cy, ps.x, ps.y].every(Number.isFinite)) P.forgePos = { g: ps.g, cx: ps.cx, cy: ps.cy, x: Math.round(ps.x * 2) / 2, y: Math.round(ps.y * 2) / 2 };
  P.forgeNiv = Math.max(0, Math.min(3, d.niv | 0));
  const txt = (s, n) => String(s || '').replace(/[<>]/g, '').slice(0, n);
  if (d.armes && typeof d.armes === 'object') for (const [id, I] of Object.entries(d.armes).slice(0, 200)) if (fgLireId(id) && I) P.forge[id] = { u: Math.max(0, Math.min(1e7, I.u | 0)), f: txt(I.f, 18), n: txt(I.n, 24) };
  if (d.carnet && typeof d.carnet === 'object') for (const [c, v] of Object.entries(d.carnet).slice(0, 300)) if (fgDecode(c) && v) P.forgeCarnet[c] = { n: Math.max(0, v.n | 0), j: Math.max(0, Math.min(100, v.j | 0)), nom: txt(v.nom, 80), f: v.f ? 1 : 0 };
  const K = ['type', 'charge', 'chauffe', 'coups', 'plis', 'ame', 'trempe', 'monture', 'comp', 'eviter'];
  if (d.lu && typeof d.lu === 'object') for (const [c, v] of Object.entries(d.lu).slice(0, 300)) if (fgDecode(c)) P.forgeLu[c] = (Array.isArray(v) ? v : []).filter(k => K.includes(k));
}
// ---------- au chargement du jeu : les vignettes ----------
function forgeInit() {
  if (typeof DESSINS !== 'object') return;
  DESSINS.forge = d => { d.rect(3, 9, 12, 11, [70, 72, 80]); d.rect(5, 12, 10, 14, [96, 70, 48]); d.rect(1, 8, 4, 10, [70, 72, 80]); d.rect(2, 7, 13, 8, [110, 112, 122]);
    d.ligne(9, 2, 13, 6, [130, 96, 64], 2); d.rect(7, 1, 10, 3, [150, 152, 162]); d.net(4, 6, [255, 200, 90]); d.net(6, 5, [255, 150, 60]); };
  for (let i = 0; i < FG_TYPES.length; i++) { const T = FG_TYPES[i], R = { type: i, ch: [3, 0, 0, 0, 0], coups: 10, plis: 0, bain: 0, mont: 0, ame: [] }; DESSINS['fgt_' + T.id] = d => fgDessin(d, R); }
  if (typeof poserIcone === 'function') { poserIcone('forge'); for (const T of FG_TYPES) poserIcone('fgt_' + T.id); }
}
// Le coup dégainé du sabre : une fente de trois pas et demi, qui touche tout sur son passage (une fois et quatre cinquièmes)
function fgFente(a) {
  const f = P.face, ux = Math.cos(f), uy = Math.sin(f), x0 = P.x, y0 = P.y; let d = 0;
  const sol = (x, y) => Math.max(hAt(x | 0, y | 0), typeof plaT === 'function' ? plaT(x | 0, y | 0) : 0);
  while (d < 3.5) { const nx = P.x + ux * (d + .3), ny = P.y + uy * (d + .3), h = sol(nx, ny);
    if (nx < 1 || ny < 1 || nx >= WS - 1 || ny >= WS - 1 || h > P.z + .6 || h < P.z - 1.5 || Eau[(ny | 0) * WS + (nx | 0)] > h) break; d += .25; }
  P.x += ux * d; P.y += uy * d; P.vx = P.vy = 0; P.z = Math.max(P.z, sol(P.x, P.y));
  const A = { charge: true, dos: false };
  for (const o of beasts) {
    if (!fgFrappable(o)) continue;
    const rx = o.x - x0, ry = o.y - y0, al = rx * ux + ry * uy, lat = Math.abs(rx * uy - ry * ux);
    if (al < -.3 || al > d + .8 || lat > .9 || Math.abs((o.z || 0) - P.z) > 2) continue;
    const dg = degJoueur(a.deg, o) * 1.8; o.pv -= dg; o.hit = .25; o.alarm = 1; if (typeof blesseParJoueur === 'function') blesseParJoueur(o);
    if (typeof fauneCoup === 'function') fauneCoup(o, dg, ux * 3, uy * 3, 'chassé');
    const tue = o.pv <= 0 && !o.dead; if (tue) { mourirBete(o, 'chassé'); butin(o); }
    forgeApres(A, o, dg, tue, a);
  }
  for (let k = 0; k < 24; k++) { const s = Math.random() * (d + .5); parts.push({ x: x0 + ux * s, y: y0 + uy * s, z: P.z + .9 + (Math.random() - .5) * .3, vx: 0, vy: 0, vz: 0, g: 0, life: .3, age: 0, col: COUL_TRAINEE[a.id] || '#f6f6f0', luit: 1, tl: .06 }); }
  SON.jouer('elan', { arme: 'epee', dur: .2 }, P.x, P.y, P.z + .6);
}

// ============================================================
//  (§173) PHASE C — LES ARMES QU'ON LANCE : le chakram, les javelots, la fronde
//  Leurs projectiles vivent dans FG.projs (pas dans FLECHES) : mis à jour par forgeMaj, dessinés par forgeEmit.
// ============================================================
const fgSol = (x, y) => Math.max(hAt(x | 0, y | 0), plaT(x | 0, y | 0));
const fgVisable = o => !!o && !o.dead && !o.tame && o.pv > 0 && !o.cache && !o.loin && !!o.sp && !o.sp.plante && !o.sp.batiment;
const fgJav = id => FG.jav[id] ?? 3;
// la cible d'un lancer : celle qu'on a désignée, sinon la plus proche devant soi
function fgVise(port, cone) {
  const dans = b => { const d = Math.hypot(b.x - P.x, b.y - P.y); if (d > port || Math.abs((b.z || 0) - P.z) > 6) return -1;
    let da = Math.atan2(b.y - P.y, b.x - P.x) - P.face; while (da > Math.PI) da -= 6.2832; while (da < -Math.PI) da += 6.2832; return Math.abs(da) <= cone ? d : -1; };
  const fc = typeof cibleVue === 'function' ? cibleVue() : null;
  if (fgVisable(fc) && (typeof CIB !== 'undefined' && CIB.verrou ? Math.hypot(fc.x - P.x, fc.y - P.y) <= port : dans(fc) >= 0)) return fc;
  let c = null, dc = 1e9; for (const b of beasts) if (fgVisable(b)) { const d = dans(b); if (d >= 0 && d < dc) { dc = d; c = b; } }
  return c;
}
// un projectile qui touche : les dégâts, le recul, la mort ; puis l'usure et la compétence (forgeFleche)
function fgBlesse(o, dg, kx, ky, id, charge, vx, vy) {
  o.pv -= dg; o.hit = .25; o.alarm = 1; if (typeof blesseParJoueur === 'function') blesseParJoueur(o); if (typeof lacherParoi === 'function') lacherParoi(o);
  if (!(o.sp.boss || o.sp.sz > 1.8)) { o.vx = (o.vx || 0) + kx; o.vy = (o.vy || 0) + ky; }
  if (typeof fauneCoup === 'function') fauneCoup(o, dg, kx, ky, 'flèche');
  burst(o.x, o.y, (o.z || 0) + .5, 8, '#ffb0a0'); SON.jouer('touche', { arme: 'fleche' }, o.x, o.y, (o.z || 0) + .4);
  const tue = o.pv <= 0 && !o.dead; if (tue) { mourirBete(o, 'flèche'); butin(o); } else say(o.sp.n + ' · ' + Math.round(o.pv * 100) + '%', 1);
  if (id) forgeFleche({ fg: id, pleine: !!charge, vx: vx ?? kx, vy: vy ?? ky }, o, dg);
  return tue;
}
// la hausse qui atteint la bête (la même balistique que les flèches), ou un tir tendu
function fgHausse(c, z0, v0, e0) {
  if (!c) return e0;
  const cc = centreBete(c), q = viser(Math.hypot(cc[0] - P.x, cc[1] - P.y), cc[2] - z0, v0);
  P.face = P.faceS = Math.atan2(c.y - P.y, c.x - P.x); return q === null ? e0 : q;
}
// coupArme (index.html) : au moment du coup, une arme qu'on lance part au lieu de frapper
function forgeLance(A, a) {
  const L = fgLireId(a.id); if (!L) return false;
  const T = FG_TYPES[L.R.type]; if (!T.lance) return false;
  const R = L.R, Al = fgAlliage(R), Cm = fgAme(R), col = Al.c, cf = Cm ? FG_ELEM[Cm.el].c : Al.c.map(v => Math.min(255, v + 60)), cm = FG_MONT[R.mont].c;
  const ch = !!A.charge, ile = canalIle(), hex = COUL_TRAINEE[a.id] || '#e8e0d0';
  P.agiteT = t; if (typeof iaNote === 'function') iaNote('coup');
  if (T.id === 'chakram') {
    if (FG.vol[a.id]) return true;                                    // il vole encore
    const c = fgVise(10, .75); if (c) P.face = P.faceS = Math.atan2(c.y - P.y, c.x - P.x);
    const f = P.face; FG.vol[a.id] = 1;
    FG.projs.push({ k: 'chak', id: a.id, x: P.x + Math.cos(f) * .4, y: P.y + Math.sin(f) * .4, z: P.z + 1, vx: Math.cos(f) * 15, vy: Math.sin(f) * 15, vz: 0,
      cible: c, reste: ch ? 5 : 3, n: 0, vu: new Set(), retour: false, age: 0, ch, deg: a.deg, x0: P.x, y0: P.y, c: col, cf, hex, ile });
    SON.jouer('elan', { arme: 'lame', dur: .25 }, P.x, P.y, P.z + 1); return true;
  }
  if (T.id === 'javelots') {
    if (!(fgJav(a.id) > 0)) { forgeRappel(a.id); return true; }
    FG.jav[a.id] = fgJav(a.id) - 1;
    const z0 = P.z + 1.3, v0 = 21, e = fgHausse(fgVise(18, .6), z0, v0, .12), f = P.face, ce = Math.cos(e);
    FG.projs.push({ k: 'jav', id: a.id, etat: 'vol', x: P.x + Math.cos(f) * .4, y: P.y + Math.sin(f) * .4, z: z0, vx: Math.cos(f) * ce * v0, vy: Math.sin(f) * ce * v0, vz: Math.sin(e) * v0,
      u: [Math.cos(f) * ce, Math.sin(f) * ce, Math.sin(e)], age: 0, deg: a.deg, vu: new Set(), c: col, cm, cf, ile });
    SON.jouer('elan', { arme: 'lance', dur: .2 }, P.x, P.y, P.z + 1); return true;
  }
  if (T.id === 'fronde') {
    const z0 = P.z + 1.2, v0 = 20, e = fgHausse(fgVise(16, .6), z0, v0, .1), ce = Math.cos(e);
    for (const da of ch ? [-.2, 0, .2] : [0]) { const f = P.face + da;
      FG.projs.push({ k: 'bille', id: a.id, x: P.x + Math.cos(f) * .4, y: P.y + Math.sin(f) * .4, z: z0, vx: Math.cos(f) * ce * v0, vy: Math.sin(f) * ce * v0, vz: Math.sin(e) * v0, age: 0, n: 0, rebond: 0, vu: new Set(), deg: a.deg, c: col, ile }); }
    SON.jouer('elan', { arme: 'gourdin', dur: .15 }, P.x, P.y, P.z + 1); return true;
  }
  return false;
}
// le rappel des javelots : ceux qui sont plantés (dans le sol, dans une bête) reviennent, et frappent ce qu'ils traversent
function forgeRappel(id) {
  let n = 0;
  for (const p of FG.projs) if (p.k === 'jav' && p.id === id && p.etat !== 'retour') {
    if (p.etat === 'bete' && fgVisable(p.b)) fgBlesse(p.b, degJoueur(p.deg, p.b) * .5, 0, 0, id, false, P.x - p.x, P.y - p.y);   // arraché
    p.etat = 'retour'; p.vu = new Set(); p.b = null; p.age = 0; n++;
  }
  if (n) { SON.jouer('fouet', {}, P.x, P.y, P.z + 1); say(n > 1 ? 'les ' + n + ' javelots reviennent' : 'le javelot revient', 1.2); }
  else if (fgJav(id) < 3) { FG.jav[id] = 3; say('les javelots reviennent de loin', 1.4); }
  else say('les trois javelots sont en main', 1);
}
function fgMajProjs(dt) {
  const ile = canalIle();
  for (let i = FG.projs.length - 1; i >= 0; i--) {
    const p = FG.projs[i]; p.age += dt;
    if (p.ile !== ile) { FG.projs.splice(i, 1); if (p.k === 'chak') FG.vol[p.id] = 0; continue; }
    if (p.k === 'chak') { if (fgChak(p, dt)) { FG.projs.splice(i, 1); FG.vol[p.id] = 0; } }
    else if (p.k === 'jav') { if (fgJavMaj(p, dt)) { FG.projs.splice(i, 1); FG.jav[p.id] = Math.min(3, fgJav(p.id) + 1); } }
    else if (fgBille(p, dt)) FG.projs.splice(i, 1);
  }
}
// le chakram : il file vers sa cible, rebondit sur la suivante, puis revient ; un mur le renvoie
function fgChak(p, dt) {
  let tx, ty, tz;
  if (p.retour) { tx = P.x; ty = P.y; tz = P.z + 1; if (Math.hypot(tx - p.x, ty - p.y, tz - p.z) < .8 || p.age > 3) { SON.jouer('prise', {}, P.x, P.y, P.z + 1); return true; } }
  else {
    if (p.cible && !fgVisable(p.cible)) p.cible = null;
    if (p.cible) { const cc = centreBete(p.cible); tx = cc[0]; ty = cc[1]; tz = cc[2]; }
    else { tx = p.x + p.vx; ty = p.y + p.vy; tz = p.z; if (Math.hypot(p.x - p.x0, p.y - p.y0) > 10) { p.retour = true; p.age = 0; } }
    if (p.age > 4) { p.retour = true; p.age = 0; }
  }
  const v = p.retour ? 18 : 15, dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, d = Math.hypot(dx, dy, dz) || 1;
  p.vx = dx / d * v; p.vy = dy / d * v; p.vz = dz / d * v;
  const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt, nz = p.z + p.vz * dt;
  if (!p.retour && (fgSol(nx, ny) > nz - .1 || nx < 1 || ny < 1 || nx >= WS - 1 || ny >= WS - 1)) { p.retour = true; p.age = 0; burst(p.x, p.y, p.z, 6, '#ffe0b0'); SON.jouer('clank', { vol: .6 }, p.x, p.y, p.z); }
  else { p.x = nx; p.y = ny; p.z = p.retour ? Math.max(nz, fgSol(nx, ny) + .5) : nz; }
  for (const b of beasts) if (fgVisable(b) && !p.vu.has(b) && (toucheBete(b, p.x, p.y, p.z) || (b === p.cible && Math.hypot(b.x - p.x, b.y - p.y) < .5))) {
    p.vu.add(b);
    fgBlesse(b, degJoueur(p.deg, b) * (p.ch ? 1.5 : 1) * Math.pow(.88, p.n), p.vx * .1, p.vy * .1, p.id, p.ch, p.vx, p.vy); p.n++;
    if (p.retour) continue;
    p.reste--;
    let nb = null, dn = 5.5; for (const o of beasts) if (fgVisable(o) && !p.vu.has(o)) { const q = Math.hypot(o.x - b.x, o.y - b.y); if (q < dn && Math.abs((o.z || 0) - (b.z || 0)) < 3) { dn = q; nb = o; } }
    if (p.reste > 0 && nb) { p.cible = nb; SON.jouer('clank', { vol: .5 }, p.x, p.y, p.z); } else { p.retour = true; p.age = 0; }
    break;
  }
  if (Math.random() < .6) parts.push({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, g: 0, life: .16, age: 0, col: p.hex, luit: 1, tl: .05 });
  return false;
}
// le javelot : il vole comme une flèche lourde, se plante (dans le sol, ou dans la bête qu'il suit), revient quand on le rappelle
function fgJavMaj(p, dt) {
  if (p.etat === 'sol') return false;
  if (p.etat === 'bete') {
    const b = p.b; if (!b || b.dead || !(b.pv > 0) || beasts.indexOf(b) < 0) { p.etat = 'sol'; p.b = null; p.z = fgSol(p.x, p.y) + .3; return false; }
    p.x = b.x + p.off[0]; p.y = b.y + p.off[1]; p.z = (b.z || 0) + p.off[2]; return false;
  }
  if (p.etat === 'retour') {
    const dx = P.x - p.x, dy = P.y - p.y, dz = P.z + 1.1 - p.z, d = Math.hypot(dx, dy, dz) || 1;
    if (d < .8 || p.age > 4) { SON.jouer('prise', {}, P.x, P.y, P.z + 1); return true; }
    p.vx = dx / d * 24; p.vy = dy / d * 24; p.vz = dz / d * 24; p.u = [dx / d, dy / d, dz / d];
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    for (const b of beasts) if (fgVisable(b) && !p.vu.has(b) && toucheBete(b, p.x, p.y, p.z)) { p.vu.add(b); fgBlesse(b, degJoueur(p.deg, b) * .7, p.vx * .08, p.vy * .08, p.id, false, p.vx, p.vy); }
    if (Math.random() < .5) parts.push({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, g: 0, life: .2, age: 0, col: '#e8e0d0', luit: 1, tl: .04 });
    return false;
  }
  const n = Math.max(1, Math.min(16, Math.ceil(Math.hypot(p.vx, p.vy, p.vz) * dt / .2))), h = dt / n;
  for (let s = 0; s < n; s++) {
    p.vz -= ARC_G * h; const kk = Math.max(0, 1 - ARC_TRAINEE * h); p.vx *= kk; p.vy *= kk; p.vz *= kk;
    const nx = p.x + p.vx * h, ny = p.y + p.vy * h, nz = p.z + p.vz * h;
    for (const b of beasts) if (fgVisable(b) && toucheBete(b, nx, ny, nz)) {
      const k = Math.min(1, Math.hypot(p.vx, p.vy, p.vz) / 19), tue = fgBlesse(b, degJoueur(p.deg, b) * k, p.vx * .15, p.vy * .15, p.id, false, p.vx, p.vy);
      p.x = nx; p.y = ny; p.z = nz; p.u = nrm([p.vx, p.vy, p.vz]);
      if (tue || b.dead) { p.etat = 'sol'; p.z = fgSol(nx, ny) + .3; } else { p.etat = 'bete'; p.b = b; p.off = [nx - b.x, ny - b.y, nz - (b.z || 0)]; }
      return false;
    }
    if (nx < 1 || ny < 1 || nx >= WS - 1 || ny >= WS - 1 || fgSol(nx, ny) > nz || (p.age > .04 && typeof floreTouche === 'function' && floreTouche(nx, ny, nz))) {
      p.etat = 'sol'; p.u = nrm([p.vx, p.vy, p.vz]); p.x = Math.max(1, Math.min(WS - 1.01, nx)); p.y = Math.max(1, Math.min(WS - 1.01, ny)); p.z = nz; SON.jouer('fiche', {}, p.x, p.y, p.z); return false; }
    p.x = nx; p.y = ny; p.z = nz;
  }
  p.u = nrm([p.vx, p.vy, p.vz]);
  if (p.age > 6 || p.z < -6) { p.etat = 'sol'; p.z = Math.max(p.z, fgSol(p.x, p.y) + .3); }
  return false;
}
// la bille : elle rebondit sur le sol et les murs (trois fois), et ricoche d'une bête vers la plus proche
function fgBille(p, dt) {
  if (p.age > 3) return true;
  const n = Math.max(1, Math.min(16, Math.ceil(Math.hypot(p.vx, p.vy, p.vz) * dt / .2))), h = dt / n;
  for (let s = 0; s < n; s++) {
    p.vz -= ARC_G * h; const kk = Math.max(0, 1 - ARC_TRAINEE * h); p.vx *= kk; p.vy *= kk; p.vz *= kk;
    const nx = p.x + p.vx * h, ny = p.y + p.vy * h, nz = p.z + p.vz * h;
    if (nx < 1 || ny < 1 || nx >= WS - 1 || ny >= WS - 1 || nz < -6) return true;
    for (const b of beasts) if (fgVisable(b) && !p.vu.has(b) && toucheBete(b, nx, ny, nz)) {
      p.vu.add(b); fgBlesse(b, degJoueur(p.deg, b) * Math.pow(.85, p.n), p.vx * .1, p.vy * .1, p.id, false, p.vx, p.vy); p.n++;
      if (p.n > 3) return true;
      let nb = null, dn = 5; for (const o of beasts) if (fgVisable(o) && !p.vu.has(o)) { const q = Math.hypot(o.x - b.x, o.y - b.y); if (q < dn) { dn = q; nb = o; } }
      p.x = nx; p.y = ny; p.z = nz;
      if (!nb) { p.vx *= -.35; p.vy *= -.35; p.vz = 3; return false; }
      const cc = centreBete(nb), dx = cc[0] - nx, dy = cc[1] - ny, d = Math.hypot(dx, dy) || 1, e = viser(d, cc[2] - nz, 16) ?? .25;
      p.vx = dx / d * Math.cos(e) * 16; p.vy = dy / d * Math.cos(e) * 16; p.vz = Math.sin(e) * 16; SON.jouer('tic', {}, nx, ny, nz);
      return false;
    }
    if (fgSol(nx, ny) > nz) {
      if (++p.rebond > 3) return true;
      if (fgSol(nx, ny) > p.z + .05) { if ((nx | 0) !== (p.x | 0)) p.vx = -p.vx * .7; if ((ny | 0) !== (p.y | 0)) p.vy = -p.vy * .7; }
      else { p.vz = Math.abs(p.vz) * .55; p.vx *= .8; p.vy *= .8; }
      burst(nx, ny, nz, 3, '#d8d0c0'); SON.jouer('tic', { vol: .5 }, nx, ny, nz); continue;
    }
    p.x = nx; p.y = ny; p.z = nz;
  }
  return p.rebond > 0 && Math.hypot(p.vx, p.vy, p.vz) < 1.5;
}
// emitFleches (index.html) : dessiner les projectiles forgés, comme les flèches
function forgeEmit(view, out) {
  for (const p of FG.projs) {
    const cle = view.kEnt && view.kEnt(p.x, p.y), rang = rangSol(p.z, false), E = (a, b, w, h, c) => emitLimb(a, b, w, h, c, view, out, cle, rang);
    if (p.k === 'chak') { const a0 = t * 24; for (let k = 0; k < 8; k++) { const a1 = a0 + k * .785, a2 = a1 + .785; E([p.x + Math.cos(a1) * .2, p.y + Math.sin(a1) * .2, p.z], [p.x + Math.cos(a2) * .2, p.y + Math.sin(a2) * .2, p.z], .05, .035, k & 1 ? p.c : p.cf); } }
    else if (p.k === 'jav') { const u = p.u || [1, 0, 0], q = p.etat === 'sol' || p.etat === 'bete' ? .25 : 0, at = k => [p.x + u[0] * (k + q), p.y + u[1] * (k + q), p.z + u[2] * (k + q)];
      E(at(-.85), at(-.1), .045, .045, p.cm); E(at(-.12), at(.05), .07, .03, p.c); E(at(.02), at(.08), .035, .025, p.cf); }
    else E([p.x - .05, p.y, p.z], [p.x + .05, p.y, p.z], .1, .1, p.c);
  }
}
