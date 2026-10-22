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
//  les vingt-trois autres sont venues ensuite : B la mêlée (§172), C le lancer (§173), D la magie (§174), E la poudre (§175).
//  index.html appelle, s'ils existent : forgeInit, forgeObjet (objet), forgeBase, forgeGeom (geomArme),
//  forgeAvant / forgeApres (coupArme), forgeFleche (impactFleche), forgeChargeDown / forgeChargeUp et
//  forgeRafale (attaquerDown / attaquerUp), forgeAction, forgeDecor (marmiteDecor), forgeCaseCamp, forgeBatir,
//  forgeSauve / forgeLue, forgeRecue, forgeSortTouche (toucherSort), forgeOs (le rendu WebGL) ; donjon.js : forgeMaj
//  (à chaque image), forgeFeu (djEstFusil, djPoseFusil, djTirDistant), forgeTirDown / forgeTirUp, forgeHud.
// ============================================================
const FG = { projs: [], vyFlaques: [], vol: {}, jav: {}, modes: {}, pile: { n: 0, t: -9 }, riposte: 0, el: null, en: null, choix: 0, vue: 'forger', h: {}, msg: '', msgT: 0, souffle: false, gauche: false, droite: false,
  lieu: null, lieuK: '', zones: [], traits: [], buff: null, aura: null, serie: 0, serieT: -9, charge: null, rafale: [], riposteVu: -1,
  fiche: null, lu: '', anim: { coup: -9, pli: -9, verse: -9, plonge: -9 }, runes: {}, runesT: {}, sortCtx: null, feu: {}, feuTenu: null, auraT: new Map(), ombre: null, ombresJ: new Map(), griffes: [], griffeSens: 1, rafT: 0, magDit: -9 };
// ---------- les vingt-neuf armes ----------
// anim : le geste et la garde empruntés ; deg, cad, port : la base ; chauffe : la couleur juste (0 à 1) ; trempe : les
// secondes au bain (eau) ; meca : ce qu'elle fait de propre ; ph : la phase où elle arrive (A : maintenant).
const FG_TYPES = [
  { id: 'dague', n: 'Dague', f: 1, anim: 'lame', deg: .46, cad: .22, port: 1.45, long: .26, chauffe: .6, trempe: 3, us: 2.2, ph: 'A', meca: 'très rapide ; dans le dos, trois fois les dégâts' },
  { id: 'epee', n: 'Épée', f: 1, anim: 'epee', seq: ['epee', 'epee2', 'epee'], deg: .7, cad: .38, port: 1.85, long: .36, chauffe: .64, trempe: 4, us: 1.3, ph: 'A', meca: 'trois coups en série : le troisième frappe une fois et demie plus fort' },
  { id: 'lance', n: 'Lance', f: 1, anim: 'lance', deg: .68, cad: .46, port: 2.6, long: .58, chauffe: .6, trempe: 4, us: 1.1, ph: 'A', meca: 'longue portée ; l\'estoc traverse et touche aussi la bête de derrière' },
  { id: 'hache', n: 'Hache', f: 1, anim: 'gourdin', deg: .92, cad: .52, port: 1.7, long: .37, chauffe: .66, trempe: 5, us: 1, ph: 'A', meca: 'fend boucliers et carapaces ; fait saigner' },
  { id: 'marteau', n: 'Marteau', f: 0, anim: 'marteau', deg: 1.7, cad: .66, port: 1.9, long: .36, chauffe: .7, trempe: 6, us: .75, ph: 'A', meca: 'lourd ; l\'onde du choc étourdit tout autour' },
  { id: 'arccourt', n: 'Arc court', f: 0, anim: 'arc', arc: 1, deg: .48, cad: 0, port: 0, long: .2, chauffe: .52, trempe: 3, us: 1.9, ph: 'A', meca: 'une rafale de trois flèches' },
  // phase B : la mêlée nouvelle (§172)
  { id: 'rapiere', n: 'Rapière', f: 1, anim: 'lame', deg: .5, cad: .26, port: 2.1, long: .42, chauffe: .62, trempe: 3.5, us: 1.8, ph: 'B', meca: 'estocs précis (un sur cinq porte double) ; frappez juste avant d\'être touché : la parade, puis une riposte qui porte deux fois et demie' },
  { id: 'sabre', n: 'Sabre', f: 0, anim: 'epee', deg: .72, cad: .36, port: 1.9, long: .38, chauffe: .66, trempe: 4, us: 1.35, ph: 'B', meca: 'le coup dégainé : maintenir, lâcher, et la fente traverse tout sur trois pas et demi' },
  { id: 'griffes', n: 'Griffes', f: 1, anim: 'lame', deg: .29, cad: .2, port: 1.25, long: .18, chauffe: .6, trempe: 3, us: 3.6, ph: 'B', meca: 'chaque coup qui porte accélère et renforce le suivant, cinq fois' },
  { id: 'fleau', n: 'Fléau', f: 0, anim: 'gourdin', deg: .8, cad: .55, port: 2.2, long: .42, chauffe: .68, trempe: 5, us: 0.95, ph: 'B', meca: 'la boule balaie devant vous, et l\'élan monte coup après coup' },
  { id: 'espadon', n: 'Espadon', f: 0, anim: 'epee', deg: 1.15, cad: .72, port: 2.3, long: .5, chauffe: .68, trempe: 6, us: .75, ph: 'B', meca: 'un balayage lent, tout autour de vous' },
  { id: 'faux', n: 'Faux', f: 1, anim: 'epee', deg: .78, cad: .6, port: 2.4, long: .6, chauffe: .62, trempe: 5, us: 0.9, ph: 'B', meca: 'un grand arc devant vous, qui vole la vie de chaque cible' },
  { id: 'hallebarde', n: 'Hallebarde', f: 1, anim: 'lance', seq: ['lance', 'lance'], deg: .82, cad: .56, port: 2.6, long: .62, chauffe: .66, trempe: 5, us: 0.95, ph: 'B', meca: 'un balayage, puis le crochet qui tire la bête à vous' },
  { id: 'baton', n: 'Bâton', f: 0, anim: 'lance', deg: .48, cad: .32, port: 2.2, long: .45, chauffe: .5, trempe: 3, us: 1.5, ph: 'B', meca: 'repousse loin ; frappez juste avant d\'être touché : il tourne et amortit le coup' },
  { id: 'epeefouet', n: 'Épée-fouet', f: 1, anim: 'epee', deg: .64, cad: .42, port: 1.9, long: .38, chauffe: .64, trempe: 4.5, us: 1.2, ph: 'B', meca: 'maintenir, lâcher : la lame se déroule en fouet (portée 4, elle tire) ou se referme' },
  // phase C : le lancer, la distance
  { id: 'chakram', n: 'Chakram', f: 0, anim: 'lame', lance: 1, deg: .95, cad: .42, port: 1.3, long: .2, chauffe: .6, trempe: 3.5, us: .75, ph: 'C', meca: 'lancé, il file sur dix pas, rebondit jusqu\'à trois fois de bête en bête, puis revient dans la main ; maintenir, lâcher : cinq rebonds, plus fort' },
  { id: 'javelots', n: 'Javelots', f: 0, anim: 'lance', lance: 1, deg: .76, cad: .5, port: 1.8, long: .5, chauffe: .6, trempe: 4, us: 1.5, ph: 'C', meca: 'trois en main : lancés, ils se plantent ; maintenir, lâcher (ou la main vide) : ils reviennent, et frappent au retour' },
  { id: 'arclong', n: 'Arc long', f: 0, anim: 'arc', arc: 1, vK: 1.25, perce: 3, deg: 1.15, cad: 0, port: 0, long: .26, chauffe: .54, trempe: 3.5, us: .75, ph: 'C', meca: 'tire plus loin ; bandé à fond, la flèche traverse jusqu\'à trois bêtes' },
  { id: 'arbaletef', n: 'Arbalète', f: 1, anim: 'arbalete', arc: 1, vK: 1.45, deg: 1.35, cad: 0, port: 0, long: .3, chauffe: .64, trempe: 4.5, us: .75, ph: 'C', meca: 'un carreau lourd qui repousse ; la bête adossée à un mur ou un tronc y est clouée (étourdie trois secondes, une fois et demie les dégâts)' },
  { id: 'fronde', n: 'Fronde', f: 1, anim: 'gourdin', lance: 1, deg: .42, cad: .36, port: 1.2, long: .3, chauffe: .5, trempe: 2.5, us: 1.5, ph: 'C', meca: 'des billes qui rebondissent sur le sol et ricochent de bête en bête ; maintenir, lâcher : trois billes en éventail' },
  // phase D : la magie
  { id: 'batonmage', n: 'Bâton de mage', f: 0, anim: 'lance', magie: 1, deg: .4, cad: .4, port: 2.2, long: .58, chauffe: .55, trempe: 3.5, us: .6, ph: 'D', meca: 'lance le sort tenu en main ; maintenir, lâcher : il grossit (trois paliers, plus fort, plus large, plus cher) ; sans sort, il frappe' },
  { id: 'baguette', n: 'Baguette', f: 1, anim: 'lame', magie: 1, deg: .25, cad: .22, port: 1.3, long: .26, chauffe: .5, trempe: 2.5, us: 1.2, ph: 'D', meca: 'lance le sort tenu en main, trois fois plus vite et pour six dixièmes du prix, un peu moins fort ; maintenir : la rafale' },
  { id: 'orbe', n: 'Orbe', f: 0, anim: 'gourdin', magie: 1, deg: .3, cad: .4, port: 1.4, long: .2, chauffe: .58, trempe: 3, us: .75, ph: 'D', meca: 'le sort tenu en main tourne autour de vous (trois au plus), puis part seul vers la bête qui vous menace ; maintenir, lâcher : la salve' },
  { id: 'lamerunique', n: 'Lame runique', f: 1, anim: 'epee', magie: 1, deg: .7, cad: .4, port: 1.9, long: .38, chauffe: .66, trempe: 4.5, us: 1.25, ph: 'D', meca: 'chaque coup remplit ses runes ; pleine, un coup chargé libère le sort tenu en main, sans mana, ou l\'âme de la lame tout autour' },
  // phase E : la poudre
  { id: 'pistolet', n: 'Pistolet à silex', f: 0, anim: 'arbalete', feu: 1, deg: 1.5, cad: 2.2, port: 0, long: .2, chauffe: .64, trempe: 3.5, us: .6, ph: 'E', meca: 'une paire : deux coups forts, puis on recharge les deux, longuement' },
  { id: 'tromblon', n: 'Tromblon', f: 0, anim: 'arbalete', feu: 1, deg: .9, cad: 1.7, port: 0, long: .32, chauffe: .66, trempe: 4, us: .6, ph: 'E', meca: 'une gerbe de neuf plombs en cône, terrible de près, qui vous repousse ; un coup, puis on recharge' },
  { id: 'mousquet', n: 'Mousquet', f: 0, anim: 'arbalete', feu: 1, deg: 2.4, cad: 2.6, port: 0, long: .5, chauffe: .62, trempe: 4.5, us: .6, ph: 'E', meca: 'long et précis : la balle porte à trente pas et traverse jusqu\'à trois bêtes ; la fumée, puis un long rechargement' },
  { id: 'revolver', n: 'Revolver', f: 0, anim: 'arbalete', feu: 1, deg: .7, cad: 2, port: 0, long: .24, chauffe: .66, trempe: 4, us: 1.2, ph: 'E', meca: 'six coups rapides (maintenir : ils s\'enchaînent), puis on recharge le barillet' },
  { id: 'canon', n: 'Canon à main', f: 0, anim: 'arbalete', feu: 1, deg: 2.6, cad: 3, port: 0, long: .36, chauffe: .7, trempe: 6, us: .6, ph: 'E', meca: 'un obus en cloche qui éclate à deux pas et demi, et vous repousse ; un coup, puis on recharge' },
];
const FG_PHASE = 'E', fgDispo = T => T.ph <= FG_PHASE;
// Les plans : ceux de la phase A sont à la forge ; les autres se trouvent (coffres du Centre et des Cercles), et se gardent.
const fgConnu = T => fgDispo(T) && (T.ph === 'A' || essai || ((typeof P !== 'undefined' && P.forgePlans) || []).includes(T.id));
// Un coffre d'en bas : parfois un plan qu'on n'a pas. Il est appris sur-le-champ, et ne se perd pas à la mort.
const FG_PLAN_K = { centre: { petit: .035, garde: .16, grand: .45 }, cercles: { petit: .03, garde: .22, scelle: .25 } };   // (§179) plus rares
const FG_PLAN_P = { B: 1, C: 1, D: .7, E: .55 };                    // (§179) le poids d'un plan au tirage : la magie et la poudre se font attendre
function forgePlanCoffre(taille, src) {
  const k = (FG_PLAN_K[src] || {})[taille] || 0; if (!(Math.random() < k)) return '';
  const L = FG_TYPES.filter(T => fgDispo(T) && !fgConnu(T)); if (!L.length) return '';
  let x = Math.random() * L.reduce((a, T) => a + (FG_PLAN_P[T.ph] || 1), 0), T = L[0];
  for (const U of L) { x -= FG_PLAN_P[U.ph] || 1; if (x <= 0) { T = U; break; } }
  fgEtat(); P.forgePlans.push(T.id); Sauve.sale = true;
  return 'plan : ' + T.n.toLowerCase();
}
// ---------- les matières de la charge (dans l'ordre du code) ----------
// tr : le tranchant ; du : la dureté ; p : le poids ; ch : la chauffe juste ; q : ce que coûte une portion
const FG_MAT = [
  { id: 'ferraille', n: 'ferraille', alli: 'acier', tr: .55, du: .62, p: .6, ch: .64, q: 12, c: [150, 154, 166] },
  { id: 'pierre', n: 'pierre', alli: 'pierre', tr: .25, du: .48, p: .9, ch: .56, q: 14, c: [134, 130, 122] },
  { id: 'os', n: 'os', alli: 'os', tr: .42, du: .3, p: .25, ch: .44, q: 9, c: [224, 214, 190] },
  { id: 'eclat', n: 'éclat', alli: 'éclat', tr: .92, du: .36, p: .3, ch: .72, q: 9, c: [126, 224, 236] },
  { id: 'ferdamne', n: 'fer damné', alli: 'fer damné', ingr: 1, tr: .78, du: .95, p: .72, ch: .8, q: 1, c: [86, 42, 44] },
  // (§177) le Korlaz : une dose au plus, hors des deux à quatre portions ; il ne change pas l'alliage (il l'assombrit) : il y loge une ombre
  { id: 'spore', n: 'Korlaz', alli: 'Korlaz', dose: 1, q: 12, c: [40, 30, 52] },
  // (§184) le Vyrel : une dose au plus, jamais avec le Korlaz ; il teinte l'alliage de violet, et l'arme contamine
  { id: 'ichor', n: 'Vyrel', alli: 'Vyrel', dose: 1, q: 4, c: [120, 60, 160] },
  // (§201) l'obsidienne de l'île volcanique : une matière de charge, le cran au-dessus de la ferraille. Plus dure (l'arme
  // s'use moins et frappe un peu plus fort), un peu plus tranchante, plus légère ; elle veut une chauffe plus vive. En
  // queue de liste pour ne rien changer aux codes d'avant ; on l'affiche juste après la ferraille (rang).
  { id: 'verrenoir', n: 'obsidienne', alli: 'obsidienne', tr: .62, du: .88, p: .5, ch: .7, q: 10, c: [44, 34, 60], rang: .5 },
  // (§202) le basalte : lourd et dur, sans tranchant. Sur une arme contondante (FG_CONTONDANTS), son poids s'ajoute au choc.
  { id: 'basalte', n: 'basalte', alli: 'basalte', tr: .3, du: .74, p: 1.05, ch: .58, q: 8, c: [66, 64, 72], rang: 1.5 },
];
const FG_CONTONDANTS = new Set(['marteau', 'fleau', 'baton']);   // (§202) ce qui frappe de sa masse
const FG_ORDRE = FG_MAT.map((M, k) => k).sort((a, b) => (FG_MAT[a].rang ?? a) - (FG_MAT[b].rang ?? b));   // l'ordre d'affichage
// (§177) les pigments de l'Achromie (P.pigments, « couleur:rang ») : posés à la fin de la forge, ils donnent à l'arme une aura et une
// traînée à leur couleur ; plus le pigment est rare, plus l'aura est vive. Le code les porte : 0 rien, 1 à 20 couleur × rang, 21 la nacre.
const FG_PIG_RGB = {
  rouge: [[178, 74, 48], [196, 36, 56], [232, 66, 48], [220, 20, 70], [156, 34, 132]],
  jaune: [[204, 150, 56], [246, 178, 10], [255, 206, 60], [232, 170, 28], [255, 220, 110]],
  vert: [[112, 146, 92], [72, 182, 172], [24, 210, 96], [70, 214, 130], [20, 176, 116]],
  bleu: [[78, 98, 168], [20, 128, 255], [92, 40, 210], [40, 104, 196], [130, 196, 255]],
};
const FG_PIG = [null];
for (const c of ['rouge', 'jaune', 'vert', 'bleu']) for (let r = 1; r <= 5; r++) FG_PIG.push({ k: c + ':' + r, c, r, rgb: FG_PIG_RGB[c][r - 1] });
FG_PIG.push({ k: 'prisme:6', c: 'prisme', r: 6, rgb: null });
const fgPigNom = g => typeof grNomPigment === 'function' ? grNomPigment(g.c, g.r) : g.k;
const fgArc = h => { const f = n => { const k = (n + h * 12) % 12; return Math.round(255 * (.62 - .38 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return [f(0), f(8), f(4)]; };   // l'arc-en-ciel (h de 0 à 1)
const fgPigRgb = (g, h) => g.rgb || fgArc(((h ?? (typeof t === 'number' ? t * .25 : 0)) % 1 + 1) % 1);
const fgHex = c => '#' + c.map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
const fgPigDe = id => { const L = fgLireId(id); return L && L.R.pig ? FG_PIG[L.R.pig] : null; };
const fgPigDispo = i => FG_PIG[i] ? (essai ? 9 : ((P.pigments || {})[FG_PIG[i].k] | 0)) : 0;
const fgTot = ch => ch.reduce((a, q, k) => a + (FG_MAT[k] && FG_MAT[k].dose ? 0 : q), 0);   // les portions (le Korlaz n'en est pas une)
const FG_BAINS = [
  { id: 'eau', n: 'eau', t: 0, cout: {}, d: 'dure : la compétence porte sur le coup lui-même' },
  { id: 'huile', n: 'huile', t: 2.5, fam: 'graine', nb: 2, d: 'souple : elle se répand au sol, en zone' },
  { id: 'sang', n: 'sang', t: 1.5, fam: 'viande', nb: 2, d: 'vivante : elle passe sur vous' },
  { id: 'nectar', n: 'nectar', t: 1, fam: 'douceur', nb: 1, d: 'lumineuse : elle part en trait' },
  { id: 'neige', n: 'neige d\'éclat', t: -.6, res: 'eclat', nb: 6, d: 'froide : elle vous entoure d\'une aura' },
  // (§202) le soufre de l'île volcanique : la forme du coup, comme l'eau, et le feu en plus, même sans âme (fgAme)
  { id: 'soufre', n: 'soufre', t: 1, res: 'soufrenat', nb: 6, forme: 'coup', el: 'feu', elK: 1.2, us: -200, d: 'brûlante : sur le coup, et le feu en plus, même sans âme' },
];
const FG_BAIN_US = [0, 600, 200, 0, -200];   // ce que la trempe change à l'usure, pour les bains d'avant
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
  v |= BigInt((R.ch[5] ? 1 : 0) | (Math.max(0, Math.min(FG_PIG.length - 1, R.pig | 0)) << 1) | ((R.ch[6] && !R.ch[5] ? 1 : 0) << 6) | (Math.max(0, Math.min(4, R.ch[7] | 0)) << 7) | (Math.max(0, Math.min(4, R.ch[8] | 0)) << 10)) << 62n;   // (§177) le Korlaz, le pigment ; (§184) le Vyrel ; (§201) l'obsidienne ; (§202) le basalte
  const n = v >> 70n ? 15 : v >> 65n ? 14 : 13;                     // une arme d'avant garde son code de treize signes
  let s = ''; for (let k = 0; k < n; k++) { s = FG_ALPH[Number(v & 31n)] + s; v >>= 5n; }
  return s;
}
function fgDecode(s) {
  if (typeof s !== 'string' || !/^[0-9a-hjkmnp-tv-z]{13,15}$/.test(s) || (s.length > 13 && s[0] === '0')) return null;
  let v = 0n; for (const c of s) v = (v << 5n) | BigInt(FG_ALPH.indexOf(c));
  const lit = n => { const x = Number(v & BigInt((1 << n) - 1)); v >>= BigInt(n); return x; };
  const ame = []; for (let k = 0; k < 3; k++) ame.unshift(lit(10));
  const mont = lit(2), bain = lit(3), plis = lit(3), coups = lit(4) + 6, ch = []; for (let k = 0; k < 5; k++) ch.unshift(lit(3));
  const type = lit(5), ex = Number(v), pig = (ex >> 1) & 31; ch.push(ex & 1); ch.push((ex >> 6) & 1); ch.push((ex >> 7) & 7); ch.push((ex >> 10) & 7);
  if (!FG_TYPES[type] || bain >= FG_BAINS.length || plis > 5 || pig >= FG_PIG.length || ex >> 13 || ch[7] > 4 || ch[8] > 4 || (ch[5] && ch[6])) return null;
  const tot = fgTot(ch); if (tot < 2 || tot > 4) return null;
  const A = []; for (const h of ame) if (h) { const id = fgIngrDeH(h); if (!id) return null; A.push(id); }
  return { type, ch, coups, plis, bain, mont, ame: A, pig };
}
const fgCodeAffiche = c => 'FG-' + c.slice(0, 4).toUpperCase() + '-' + c.slice(4, 8).toUpperCase() + '-' + c.slice(8).toUpperCase();
const fgCodeLu = s => { const c = String(s || '').toLowerCase().replace(/^fg/, '').replace(/[^0-9a-z]/g, '').replace(/[ilo]/g, m => ({ i: '1', l: '1', o: '0' })[m]); return c.length === 13 || ((c.length === 14 || c.length === 15) && c[0] !== '0') ? c : null; };
// L'identifiant d'une arme forgée : « fg », son code, et sa justesse (deux chiffres en base 36)
const fgIdDe = (code, j) => 'fg' + code + '_' + Math.max(0, Math.min(100, j | 0)).toString(36).padStart(2, '0');
const FG_LUS = new Map();
function fgLireId(id) {
  if (typeof id !== 'string' || id.length < 18 || id.length > 20 || !id.startsWith('fg') || id[id.length - 3] !== '_') return null;
  let L = FG_LUS.get(id); if (L !== undefined) return L;
  const code = id.slice(2, -3), j = parseInt(id.slice(-2), 36), R = fgDecode(code);
  L = R && j >= 0 && j <= 100 ? { code, R, j } : null; FG_LUS.set(id, L); return L;
}
// ---------- ce que la recette donne ----------
function fgAlliage(R) {
  const n = fgTot(R.ch) || 1, A = { tr: 0, du: 0, p: 0, ch: 0, c: [0, 0, 0] };
  R.ch.forEach((q, k) => { const M = FG_MAT[k], f = q / n; if (!M || M.dose) return; A.tr += M.tr * f; A.du += M.du * f; A.p += M.p * f; A.ch += M.ch * f; for (let i = 0; i < 3; i++) A.c[i] += M.c[i] * f; });
  A.korlaz = !!R.ch[5]; A.c = A.c.map(v => (A.korlaz ? v * .72 + 6 : v) | 0);
  A.vyrel = !!R.ch[6]; if (A.vyrel) A.c = A.c.map((v, i) => v * .74 + [120, 60, 160][i] * .26 | 0);   // (§184) le Vyrel : violacé
  const ord = R.ch.map((q, k) => [q, k]).filter(x => x[0] && !FG_MAT[x[1]].dose).sort((a, b) => b[0] - a[0]);
  A.nom = FG_MAT[ord[0][1]].alli + (ord[1] ? ' ' + fgDe(FG_MAT[ord[1][1]].alli) : '');
  A.eclat = R.ch[3] > 0; A.damne = R.ch[4] > 0; A.masse = (R.ch[8] || 0) / n;   // (§202)
  return A;
}
const fgLong = R => Math.max(.82, Math.min(1.32, .82 + (R.coups - 6) * .036));
const fgCible = R => { const T = FG_TYPES[R.type]; return Math.max(.35, Math.min(.88, fgAlliage(R).ch * .7 + (T.chauffe || .6) * .3)); };
const fgTrempe = R => Math.round(((FG_TYPES[R.type].trempe || 4) + FG_BAINS[R.bain].t + (R.ch[4] ? 1 : 0)) * 10) / 10;
const fgTol = () => (FG_NIV() >= 3 ? 1.4 : 1);
function fgStats(R, j) {
  const T = FG_TYPES[R.type], A = fgAlliage(R), L = fgLong(R), jj = j / 100;
  const deg = T.deg * (.8 + .45 * A.tr) * (1 + .12 * A.du) * (FG_CONTONDANTS.has(T.id) ? 1 + .4 * A.masse : 1) * (1 + .035 * R.plis) * (L > 1 ? 1 + (L - 1) * .5 : 1 - (1 - L) * .3) * (.72 + .45 * jj) * (j >= 97 ? 1.05 : 1);
  const cad = T.cad * (.88 + .3 * A.p) * (L > 1 ? 1 + (L - 1) * .4 : 1);
  const port = T.port ? T.port * (.86 + .16 * L) : 0;
  const usure = Math.round((2000 + 1400 * A.du + (FG_BAINS[R.bain].us ?? FG_BAIN_US[R.bain] ?? 0) + 120 * R.plis) * (j >= 97 ? 2 : 1) * (T.us || 1));   // (§179) us : une arme rapide encaisse plus de coups
  return { deg: Math.round(deg * 100) / 100, cad: Math.round(cad * 1000) / 1000, port: Math.round(port * 100) / 100, usure, L };
}
function fgAme(R) {
  const cpt = {};
  R.ame.forEach((id, k) => { const el = fgElemDe(id); if (el) cpt[el] = (cpt[el] || 0) + fgRang(INGR[id]) * [1.5, 1, .75][k]; });   // l'ordre compte : le premier pèse plus
  const Bn = FG_BAINS[R.bain]; if (Bn && Bn.el) cpt[Bn.el] = (cpt[Bn.el] || 0) + Bn.elK;   // (§202) le soufre
  for (const [a, b] of FG_OPPOSES) if (cpt[a] && cpt[b]) { const m = Math.min(cpt[a], cpt[b]); cpt[a] -= m; cpt[b] -= m; }   // deux âmes contraires s'annulent
  const L = Object.entries(cpt).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  if (!L.length) return null;
  return { el: L[0][0], el2: L[1] ? L[1][0] : null, niv: Math.max(1, Math.min(4, Math.ceil(L[0][1] * .75 + (L[1] ? L[1][1] * .25 : 0)))), decl: FG_DECL[R.plis], forme: (Bn && Bn.forme) || FG_FORMES[R.bain] };
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
      return 'dégâts ' + Math.round(this.deg * 100) + (T.magie ? ' · les sorts ×' + fgFocale(this, T).toFixed(2).replace('.', ',') : '') + (T.feu ? ' · recharge ' + this.cad.toFixed(1).replace('.', ',') + ' s · sans munitions' : '') + ' · ' + T.meca + ' · ' + (x => x[0].toLowerCase() + x.slice(1))(fgCompTxt(C)) + (R.ch[5] ? (fgDistanceT(T) ? ' · une ombre de Korlaz vous suit et se bat à vos côtés' : ' · le Korlaz : chaque coup lacère la cible de trois griffes noires, même de loin') : '') + (R.pig && FG_PIG[R.pig] ? ' · teintée ' + fgDe(fgPigNom(FG_PIG[R.pig])) + ' : son aura' : '') + ' · forgée ' + j + ' %' + (j >= 97 ? ' (chef-d\'œuvre)' : '')
        + ' · usure ' + Math.round(u * 100) + ' %' + (u >= 1 ? ' : émoussée, à réparer' : '') + (I && I.f ? ' · forgée par ' + I.f : '') + ' · ' + fgCodeAffiche(code); } };
  if (T.arc) O.arc = 1; if (T.vK) O.vK = T.vK; if (T.perce) O.perce = T.perce;
  if (T.feu) { O.arc = 1; O.fusil = 1; }                            // (§175) les armes à feu : le geste et la pose des fusils du Centre
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
  COUL_TRAINEE[id] = R.pig && FG_PIG[R.pig] ? fgHex(fgPigRgb(FG_PIG[R.pig], .55)) : R.ch[6] ? '#a45ce0' : C ? FG_ELEM[C.el].hex : '#' + A.c.map(v => Math.min(255, v + 40).toString(16).padStart(2, '0')).join('');
  if (typeof DESSINS === 'object') { DESSINS[id] = d => fgDessin(d, R); if (typeof poserIcone === 'function') try { poserIcone(id); } catch (e) { /* plus tard */ } }
  return O;
}
const I0 = id => typeof P !== 'undefined' && P.forge && P.forge[id] && P.forge[id].n ? String(P.forge[id].n).slice(0, 28) : '';

// ============================================================
//  L'ARME EN MAIN : sa forme vient de la recette (la longueur des coups, l'alliage, les plis, l'âme, la monture)
// ============================================================
// (§177) l'arme en main, puis son aura : le fil luit de son pigment, et des lueurs s'en échappent
function forgeGeom(id, F, J, B) {
  const n0 = B.length; if (!fgGeomBase(id, F, J, B)) return false;
  const L = fgLireId(id), pg = L && L.R.pig ? FG_PIG[L.R.pig] : null;
  if (pg && B.length > n0) fgAura(id, J, B, n0, pg);
  if (L && L.R.ch[5] && B.length > n0) fgKorlazFume(id, J, B, n0);
  if (L && L.R.ch[6] && B.length > n0) fgVyrelSuinte(id, J, B, n0);   // (§184) le Vyrel suinte de la lame
  return true;
}
function fgAura(id, J, B, n0, pg) {
  const r = pg.r, pc = fgPigRgb(pg);
  if (r >= 2) for (let i = n0; i < B.length; i++) { const c = B[i].c; if (B[i].pig || (c && c[0] === pc[0] && c[1] === pc[1] && c[2] === pc[2])) B[i].lum = 1; }
  if (!J || !Number.isFinite(J.x)) return;
  const cle = (J === P ? 'P' : J.u || 'j') + id, rate = [0, 5, 8, 12, 16, 22, 28][r], der = FG.auraT.get(cle) ?? 0;
  if (t - der < 1 / rate || parts.length > 1400) return;
  FG.auraT.set(cle, t);
  const f = J.faceS ?? J.face ?? 0, cf = Math.cos(f), sf = Math.sin(f), zs = J.z + (J.selle || 0);
  const put = v => [J.x + v[0] * cf - v[1] * sf, J.y + v[0] * sf + v[1] * cf, zs + v[2]];
  for (let n = 0; n < (r >= 5 ? 2 : 1); n++) {
    const o = B[n0 + (Math.random() * (B.length - n0) | 0)], q = put(mixv(o.a, o.b, Math.random())), c = fgPigRgb(pg, Math.random());
    parts.push({ x: q[0] + (Math.random() - .5) * .06, y: q[1] + (Math.random() - .5) * .06, z: q[2], vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, vz: .2 + Math.random() * .35, g: -.1,
      life: .45 + .08 * r + Math.random() * .3, age: 0, col: fgHex(r >= 4 && Math.random() < .25 ? c.map(v => v + (255 - v) * .6) : c), luit: 1, tl: .03 + .006 * r });
  }
}
// traineeArme (index.html) : la traînée d'une arme teintée prend son pigment, luit, et dure un peu plus (la nacre passe par toutes les couleurs)
function forgeTrainee(id) {
  const g = fgPigDe(id); if (!g) return null;
  const base = g.rgb ? fgHex(g.rgb) : null, clair = g.rgb ? fgHex(g.rgb.map(v => v + (255 - v) * .55)) : null;
  return { c: (k, s) => base ? (g.r >= 4 && (s + k) % 3 === 0 ? clair : base) : fgHex(fgArc(((t * .6 + k * .12 + s * .07) % 1 + 1) % 1)), k: 1 + .16 * g.r, w: 1 + .1 * g.r };
}
function fgGeomBase(id, F, J, B) {
  const L = fgLireId(id); if (!L) return false;
  const R = L.R, T = FG_TYPES[R.type], A = fgAlliage(R), C = fgAme(R), M = FG_MONT[R.mont].c, lg = fgLong(R), or = L.j >= 97;
  const pg = R.pig ? FG_PIG[R.pig] : null;
  const lame = A.eclat ? A.c.map(v => Math.min(255, v + 18)) : A.c, fil = pg ? fgPigRgb(pg) : C ? FG_ELEM[C.el].c : A.c.map(v => Math.min(255, v + 60)), sombre = A.c.map(v => v * .55 | 0);
  const deco = or ? [255, 214, 120] : A.damne ? [150, 40, 30] : [150, 146, 140];
  if (T.feu) return fgGeomFeu(id, T, F, J, B, { lame, fil, M, deco, sombre, lg });
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
  const pose = (a, b, w, h, c) => B.push(c === fil && pg ? { a, b, w, h, c, pig: 1 } : c === lame ? { a, b, w, h, c, bl: 1 } : { a, b, w, h, c }), u = F.u, at = k => v3.add(F.o, v3.mul(u, k));
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
  } else if (T.magie) {                                             // (§174) la magie : la pierre de l'arme luit de la phrase tenue en main
    const poseL = (a, b, w, h, c) => B.push({ a, b, w, h, c, lum: 1 });
    const ph = J === P ? fgPhraseMain() : null, pc = ph ? ph.m.col : fil, ch = J === P && FG.charge && FG.charge.a && FG.charge.a.id === id ? t - FG.charge.t0 : 0;
    if (T.id === 'batonmage') {                                     // la hampe, la tête fourchue, le cristal qui gonfle au palier
      const niv = ch >= 1.6 ? 3 : ch >= 1 ? 2 : ch >= .5 ? 1 : 0, Hc = .58 + .04 * lg, r = .036 + .012 * niv + (niv ? .006 * Math.sin(t * 14) : 0);
      pose(at(-.34), at(.52), .026, .026, M); pose(at(-.36), at(-.3), .032, .032, deco); pose(at(.1), at(.14), .032, .032, deco);
      for (const o of [-1, 1]) { pose(vv(at(.5), o * .012), vv(at(Hc - .02), o * .05), .014, .014, deco); pose(vv(at(Hc - .02), o * .05), vv(at(Hc + .05), o * .02), .012, .012, deco); }
      poseL(at(Hc - r), at(Hc + r), r * 1.6, r * 1.6, pc);
      for (let k = 0; k < Math.min(3, R.plis); k++) pose(at(.3 + k * .05), at(.312 + k * .05), .03, .03, fil);
    } else if (T.id === 'baguette') {                               // le manche, la tige fine, la pointe
      const e = .2 + .12 * lg;
      pose(at(-.05), at(-.03), .03, .03, deco); pose(at(-.03), at(.06), .024, .024, M); pose(at(.06), at(.075), .03, .03, deco);
      pose(at(.075), at(e), .014, .014, lame); pose(vv(at(.09), .006), vv(at(e - .02), .004), .004, .004, fil);
      poseL(at(e), at(e + .03 + (FG.charge && ch > .3 ? .012 : 0)), .024, .024, pc);
    } else if (T.id === 'orbe') {                                   // la poignée, le berceau, la sphère
      const C0 = at(.15 + .02 * lg), r = .06 + .012 * lg + .005 * Math.sin(t * 3);
      pose(at(-.05), at(.06), .03, .03, M); pose(at(-.06), at(-.04), .036, .036, deco);
      for (const o of [-1, 1]) pose(vv(at(.06), o * .015), vv(at(.12), o * .055), .014, .014, deco);
      pose(at(.06), at(.09), .04, .04, deco);
      poseL(v3.add(C0, v3.mul(u, -r)), v3.add(C0, v3.mul(u, r)), r * 1.7, r * 1.7, pc);
    } else {                                                        // la lame runique : une épée large, cinq runes qui s'allument
      const e = .06 + .3 * lg, plein = J === P ? FG.runes[id] || 0 : 0;
      pose(at(-.065), at(-.035), .038, .038, deco); pose(at(-.035), at(.05), .026, .026, M);
      pose(vv(at(.055), -.07), vv(at(.055), .07), .028, .032, deco);
      pose(at(.06), at(e), .056, .016, lame); pose(at(e), at(e + .06), .03, .014, lame);
      for (let k = 0; k < 5; k++) { const s0 = .08 + (e - .1) * k / 5, s1 = s0 + (e - .1) / 5 * .6;
        (k < Math.round(plein * 5) ? poseL : pose)(at(s0), at(s1), .022, .019, k < Math.round(plein * 5) ? (plein >= 1 ? [255, 250, 230] : fil) : sombre); }
    }
  } else {                                                          // les armes des phases suivantes : une lame simple
    pose(at(-.04), at(.05), .026, .026, M); pose(at(.05), at(.3), .045, .014, lame);
  }
  return true;
}
// La vignette du sac : la forme, l'alliage, le fil de l'âme.
function fgDessin(d, R) {
  const T = FG_TYPES[R.type], A = fgAlliage(R), C = fgAme(R), M = FG_MONT[R.mont].c;
  const lame = A.c, fil = R.pig && FG_PIG[R.pig] ? fgPigRgb(FG_PIG[R.pig], .1) : C ? FG_ELEM[C.el].c : A.c.map(v => Math.min(255, v + 60)), sombre = A.c.map(v => v * .55 | 0);
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
    case 'batonmage': d.ligne(2, 15, 11, 6, M, 2); d.ligne(11, 6, 11, 3, sombre); d.ligne(11, 6, 14, 6, sombre); d.rect(12, 2, 14, 4, fil); d.net(13, 1, [255, 250, 230]); d.net(5, 12, lame); break;
    case 'baguette': d.rect(2, 12, 4, 14, M); d.net(5, 11, sombre); d.ligne(5, 11, 12, 4, lame); d.rect(12, 3, 13, 4, fil); d.net(14, 2, [255, 250, 230]); d.net(11, 2, fil); d.net(14, 5, fil); break;
    case 'orbe': d.rect(3, 12, 5, 15, M); d.ligne(4, 11, 6, 9, sombre); d.ligne(6, 12, 8, 10, sombre); d.arc(10, 6, 4, 0, 6.2832, fil, 2); d.rect(9, 4, 11, 7, fil); d.net(9, 4, [255, 250, 230]); break;
    case 'lamerunique': d.ligne(2, 14, 4, 12, M, 2); d.ligne(2, 10, 6, 14, sombre, 2); d.ligne(5, 11, 13, 3, lame, 3); d.net(7, 9, fil); d.net(9, 7, fil); d.net(11, 5, fil); d.net(14, 2, lame); break;
    case 'pistolet': for (const o of [0, 3]) { d.rect(2 + o, 10 - o, 3 + o, 13 - o, M); d.ligne(3 + o, 9 - o, 10 + o, 9 - o, lame, 2); d.net(4 + o, 7 - o, sombre); } d.net(13, 6, fil); break;
    case 'tromblon': d.ligne(1, 13, 6, 10, M, 2); d.net(6, 9, sombre); d.ligne(6, 9, 12, 5, lame, 2); d.rect(12, 2, 14, 5, lame); d.net(14, 2, fil); d.net(15, 4, fil); break;
    case 'mousquet': d.ligne(1, 14, 5, 11, M, 2); d.ligne(5, 11, 15, 2, lame); d.ligne(5, 12, 12, 6, M); d.net(6, 10, sombre); d.net(9, 7, fil); d.net(12, 4, fil); break;
    case 'revolver': d.rect(3, 10, 5, 14, M); d.rect(5, 7, 8, 10, lame); d.net(6, 8, sombre); d.ligne(8, 8, 14, 8, lame, 2); d.net(14, 7, fil); d.net(6, 6, sombre); break;
    case 'canon': d.rect(2, 10, 4, 13, M); d.ligne(4, 10, 11, 5, lame, 3); d.rect(11, 3, 14, 6, sombre); d.net(13, 4, fil); d.net(7, 6, fil); break;
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
  if (T.id === 'griffes' || T.id === 'fleau') k *= 1 + (T.id === 'griffes' ? .06 : .09) * fgPile();
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
  if (T.id === 'fleau') { const port = a.port + .2 * fgPile(); fgBalayage(pr, a, 2.6, .55, port); fgArcVisuel(2.6, port, '#d8c8a8'); }
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
  if (T.id === 'lamerunique') fgRunes(a, A, pr, pw);
  if (L.R.ch[6]) fgVyrelCoup(pr, tue);                                 // (§184) le Vyrel contamine
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
  if (L.R.ch[6]) { fgVyrelCoup(b, tue); fgVyrelFlaque(b.x, b.y, b.z || sol(b.x, b.y)); }   // (§184) tirée, elle laisse une flaque de miasme
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
  if (ty === 'baguette' && c.raf) return true;                       // (§174) la rafale s'arrête au lâcher
  if (ty === 'batonmage' || ty === 'baguette' || ty === 'orbe') {     // (§179) la phrase n'est pas prête : pas de geste perdu, le sort partira au prochain appui
    const s = fgPhraseMain();
    if (s && t < (sortPret[s.k] || 0) && !(ty === 'orbe' && fgOrbes(c.a.id).length && t - c.t0 >= .5)) { FG.magDit = Math.min(FG.magDit, t - 1.6); fgDitMagie(nomPhrase(s) + ' · encore ' + (sortPret[s.k] - t).toFixed(1).replace('.', ',') + ' s', .8); return true; }
  }
  if (charge && ty === 'orbe' && fgOrbes(c.a.id).length) { attaquer(c.a, null); if (P.anim && P.anim.k === 'arme') P.anim.fait = true; fgSalve(c.a.id); return true; }
  if (ty === 'batonmage' || ty === 'baguette' || ty === 'orbe') {     // (§179) le sort part au lâcher, sans attendre le milieu du geste
    const held = t - c.t0, A = { charge: held >= .5, niv: ty === 'batonmage' ? fgNivBaton(held) : 0 };
    attaquer(c.a, null);
    if (fgMagie(A, c.a, FG_TYPES[L.R.type])) { if (P.anim && P.anim.k === 'arme') P.anim.fait = true; if (A.charge) burst(P.x, P.y, P.z + 1, 14, '#ffd27d'); return true; }
    if (held >= .5 && P.anim && P.anim.k === 'arme') { P.anim.charge = true; if (ty === 'batonmage') P.anim.niv = A.niv; }
    return true;                                                      // pas de sort (rien en main, pas de mana) : le geste frappe, au milieu
  }
  attaquer(c.a, cibleContact(c.a.port));
  if (t - c.t0 >= .5 && P.anim && P.anim.k === 'arme') { P.anim.charge = true; if (ty === 'batonmage') P.anim.niv = fgNivBaton(t - c.t0); burst(P.x, P.y, P.z + 1, 14, '#ffd27d'); }
  return true;
}
// L'arc court : deux flèches de plus, juste derrière la première
function forgeRafale(p) { const a = porte('arme'), L = a && a.fg && fgLireId(a.id); if (L && FG_TYPES[L.R.type].id === 'arccourt') FG.rafale.push({ t: t + .12, p: p * .9 }, { t: t + .24, p: p * .9 }); }

// ============================================================
//  LA MAGIE FORGÉE (§174, phase D) : le bâton de mage, la baguette, l'orbe, la lame runique.
//  Elles lancent la phrase tenue en main (le volet Magie : « Tenir »), contre les éclats du sac, avec le délai de
//  la phrase : rien de neuf à apprendre, le grimoire et le mana restent ce qu'ils sont. La focale (les dégâts de
//  l'arme sur ceux de son type : ce que la forge y a mis) multiplie le sort ; l'âme de l'arme s'y ajoute, comme
//  à un coup (forgeSortTouche, appelé par toucherSort). Sans phrase en main, l'arme frappe, faiblement.
// ============================================================
const FG_BATON = [[.5, 1.6, 1.15, 1.5], [1, 2.2, 1.3, 2], [1.6, 3, 1.5, 3]];   // le palier : tenu (s), dégâts, ampleur, prix
const FG_ORBES = 3, FG_ORBE_VIE = 25, FG_ORBE_R = 10, FG_RUNE = .15;
function fgFocale(a, T) { return Math.max(.5, (a.deg || T.deg) / T.deg); }
function fgPhraseMain() { const k = typeof P !== 'undefined' && P.sortMain; return k && typeof sortInscrit === 'function' && sortInscrit(k) ? phraseDe(k) : null; }
const fgNivBaton = h => h >= FG_BATON[2][0] ? 3 : h >= FG_BATON[1][0] ? 2 : h >= FG_BATON[0][0] ? 1 : 0;
const fgDitMagie = (m, d = 1.6) => { if (t - FG.magDit > 2.5) { FG.magDit = t; say(m, d); } };
const fgOrbes = id => FG.projs.filter(p => p.k === 'orbe' && p.id === id && p.etat === 'tourne');
// Lancer une phrase par l'arme : mod.deg, mod.amp (l'ampleur), mod.cout et mod.del (facteurs), mod.libre (sans
// mana ni délai), mod.orbe (elle se pose en sphère), mod.gros (le trait grossit), mod.charge, mod.ame (l'âme sûre).
function fgLancerPhrase(a, s0, mod) {
  if (!s0 || P.pv <= 0 || P.effroi > t) return 'non';
  if (s0.f.id === 'piege' && typeof djIci === 'function' && djIci()) return 'non';
  if (!mod.libre && t < (sortPret[s0.k] || 0)) return 'attente';
  const cs = mod.libre ? 0 : Math.max(1, Math.round(coutPhrase(s0) * (mod.cout || 1)));
  if (manaDispo() < cs) return 'mana';
  const s = Object.assign({}, s0, { deg: s0.deg * (mod.deg || 1), amp: s0.amp * (mod.amp || 1) });
  SON.jouer('sort', mod.gros ? { vol: 1 } : { vol: .7 });
  if (!mod.libre) { const p = instabilite(s); if (p > 0) { const de = Math.random(); if (de < p) { sortRate(s, cs, de < p / 2); return 'rate'; } } }
  FG.sortCtx = { id: a.id, t, charge: !!mod.charge, ame: !!mod.ame, vus: new Set() };
  const n0 = TIRS.length;
  if (!(mod.orbe ? fgOrbePose(a, s) : SORT_FAIT[s.f.id](s))) return 'non';
  if (mod.gros) for (let i = n0; i < TIRS.length; i++) if (TIRS[i].sortM) TIRS[i].gros = mod.gros;
  if (cs) payerMana(cs);
  if (!mod.libre) sortPret[s0.k] = t + s.del * (mod.del || 1);
  casesSig = '';
  if (effet('invisible')) { P.effets.invisible = t; say('vous redevenez visible', 1.6); }
  fgUser(a.id, 1);
  FG.serie = t - FG.serieT < 1.4 ? FG.serie + 1 : 1; FG.serieT = t;
  return 'ok';
}
// forgeLance : au moment du coup, le bâton, la baguette et l'orbe lancent au lieu de frapper
function fgMagie(A, a, T) {
  if (T.id === 'lamerunique') return false;                         // elle frappe : ses runes se remplissent (forgeApres)
  const s = fgPhraseMain(), fk = fgFocale(a, T);
  if (!s) { fgDitMagie('aucun sort en main · volet Magie : « Tenir » une phrase du grimoire', 2.6); return false; }
  let mod, palier = 0;
  if (T.id === 'batonmage') {
    let n = A.charge ? A.niv || 1 : 0;
    if (!essai) while (n > 0 && manaDispo() < Math.max(1, Math.round(coutPhrase(s) * FG_BATON[n - 1][3]))) n--;   // le plus haut palier qu'on peut payer
    const N = FG_BATON[n - 1]; palier = n;
    mod = { deg: fk * (N ? N[1] : 1), amp: N ? N[2] : 1, cout: N ? N[3] : 1, gros: n, charge: n > 0 };
  } else if (T.id === 'baguette') mod = { deg: .55 * fk, cout: .6, del: .35, charge: !!A.charge };
  else {                                                            // l'orbe : trait, onde et piège tournent ; le mur et l'égide partent tout de suite
    if (['trait', 'onde', 'piege'].includes(s.f.id)) {
      if (fgOrbes(a.id).length >= FG_ORBES) { fgSalve(a.id); return true; }
      mod = { deg: fk, del: .5, orbe: true, charge: !!A.charge };
    } else mod = { deg: fk, charge: !!A.charge };
  }
  const r = fgLancerPhrase(a, s, mod);
  if (r === 'ok') { if (T.id !== 'baguette' || t - FG.magDit > 4) fgDitMagie(nomPhrase(s) + (palier ? ' · palier ' + FG_ROM[palier] : '') + (mod.orbe ? ' · la sphère tourne' : ''), 1.2); return true; }
  if (r === 'rate') return true;
  if (r === 'attente') { fgDitMagie(nomPhrase(s) + ' · encore ' + Math.max(1, Math.ceil(sortPret[s.k] - t)) + ' s', 1); return true; }   // (§179) le geste, sans le coup
  else if (r === 'mana') fgDitMagie('pas assez de mana : il faut ' + eclats(Math.max(1, Math.round(coutPhrase(s) * (mod.cout || 1)))) + ' dans le sac', 1.8);
  return false;                                                     // le sort ne part pas : l'arme frappe
}
// La baguette tenue : la rafale, au rythme de la phrase (le tiers de son délai, trois dixièmes de seconde au moins)
function fgMajMagie(dt) {
  const c = FG.charge, a = c && c.a, L = a && a.fg && fgLireId(a.id), ty = L && FG_TYPES[L.R.type].id;
  if (ty === 'baguette' && t - c.t0 >= .3 && t >= FG.rafT && porte('arme') === a) {
    const s = fgPhraseMain();
    if (s && t >= (sortPret[s.k] || 0) && manaDispo() >= Math.max(1, Math.round(coutPhrase(s) * .6)) && !(P.anim && P.anim.k === 'arme')) {
      c.raf = true; FG.rafT = t + Math.max(.3, s.del * .35); lancerAttaque(a, cibleContact(a.port));
    }
  }
  if (ty === 'batonmage' && t - c.t0 >= .5) {                       // le bâton tenu : chaque palier s'entend, et la lueur monte
    const n = fgNivBaton(t - c.t0), s = fgPhraseMain(), hex = s ? hexSort(s.m.col) : '#ffd27d';
    if (n > (c.niv || 0)) { c.niv = n; SON.jouer('tic', { vol: .4 + .2 * n }, P.x, P.y, P.z + 1); burst(P.x + Math.cos(P.face) * .5, P.y + Math.sin(P.face) * .5, P.z + 1.4, 6 + 6 * n, hex); }
    if (Math.random() < dt * 10 * n) { const an = Math.random() * 6.28, r = .7 - .15 * n;
      parts.push({ x: P.x + Math.cos(an) * r, y: P.y + Math.sin(an) * r, z: P.z + .6 + Math.random() * .8, vx: -Math.cos(an) * r * 2, vy: -Math.sin(an) * r * 2, vz: .4, g: 0, life: .4, age: 0, col: hex, luit: 1, tl: .05 + .015 * n }); }
  }
  for (const id in FG.runes) if (FG.runes[id] > 0 && t - (FG.runesT[id] || 0) > 10) FG.runes[id] = Math.max(0, FG.runes[id] - dt * .05);   // laissées, elles s'éteignent
  const ar = porte('arme'), Lr = ar && ar.fg && FG.runes[ar.id] >= 1 && fgLireId(ar.id);
  if (Lr && Math.random() < dt * 6) { const C = fgAme(Lr.R); parts.push({ x: P.x + (Math.random() - .5) * .6, y: P.y + (Math.random() - .5) * .6, z: P.z + .7 + Math.random() * .6, vx: 0, vy: 0, vz: .5, g: 0, life: .5, age: 0, col: C ? FG_ELEM[C.el].hex : '#fff4d0', luit: 1, tl: .05 }); }
}
// L'orbe : la phrase posée en sphère, qui tourne autour de vous
function fgOrbePose(a, s) {
  const L = fgOrbes(a.id); if (L.length >= FG_ORBES) return false;
  const a0 = L.length ? L[L.length - 1].a0 + 2.094 : P.face;
  FG.projs.push({ k: 'orbe', id: a.id, etat: 'tourne', s, a0, t0: t, age: 0, x: P.x, y: P.y, z: P.z + 1.3, vx: 0, vy: 0, vz: 0, cible: null, ch: !!FG.sortCtx && FG.sortCtx.charge, c: s.m.col, c2: s.m.col2 || null, hex: hexSort(s.m.col), ile: canalIle() });
  burst(P.x, P.y, P.z + 1.2, 10, hexSort(s.m.col));
  return true;
}
const fgMenace = o => fgVisable(o) && typeof prenable === 'function' && prenable(o) && (typeof beteHostile !== 'function' || beteHostile(o));
function fgOrbeCible(p, R, toutes, prises) {
  let c = null, dc = R * R;
  for (const b of beasts) if ((toutes ? fgVisable(b) && prenable(b) : fgMenace(b)) && Math.abs((b.z || 0) - P.z) < 5 && !(prises && prises.has(b))) {
    const d2 = (b.x - p.x) ** 2 + (b.y - p.y) ** 2; if (d2 < dc) { dc = d2; c = b; } }
  return c;
}
// la salve : toutes les sphères partent, chacune vers une bête (la visée d'abord), même celles qui ne menacent pas
function fgSalve(id) {
  const L = fgOrbes(id), vise = fgVise(FG_ORBE_R + 4, 1.2), prises = new Set(); let n = 0;
  for (const p of L) { let c = vise && !prises.has(vise) ? vise : fgOrbeCible({ x: P.x, y: P.y }, FG_ORBE_R + 4, true, prises); if (!c) c = vise || [...prises][0];
    if (!c) continue; prises.add(c); p.etat = 'part'; p.cible = c; p.age = 0; n++; }
  if (n) { SON.jouer('elan', { arme: 'lame', dur: .3 }, P.x, P.y, P.z + 1); say(n > 1 ? 'la salve · ' + n + ' sphères' : 'la sphère part', 1); }
  else say('aucune bête à portée des sphères', 1.2);
}
function fgOrbe(p, dt) {
  if (p.etat === 'tourne') {
    if (t - p.t0 > FG_ORBE_VIE || P.pv <= 0) { burst(p.x, p.y, p.z, 6, p.hex); return true; }
    const an = p.a0 + (t - p.t0) * 2.6; p.x = P.x + Math.cos(an) * 1.15; p.y = P.y + Math.sin(an) * 1.15; p.z = P.z + 1.3 + Math.sin(t * 3 + p.a0) * .08;
    if (t - p.t0 > .8 && (p.cherche = (p.cherche || 0) - dt) <= 0) { p.cherche = .2; const c = fgOrbeCible(P, FG_ORBE_R); if (c) { p.etat = 'part'; p.cible = c; p.age = 0; SON.jouer('elan', { arme: 'lame', dur: .2, vol: .5 }, p.x, p.y, p.z); } }
    if (Math.random() < .3) parts.push({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, g: 0, life: .25, age: 0, col: p.hex, luit: 1, tl: .05 });
    return false;
  }
  if (p.age > 3) { burst(p.x, p.y, p.z, 8, p.hex); return true; }  // elle s'épuise en route
  if (p.cible && !fgVisable(p.cible)) p.cible = fgOrbeCible(p, 6, true);
  let tx, ty, tz; if (p.cible) { const cc = centreBete(p.cible); tx = cc[0]; ty = cc[1]; tz = cc[2]; } else { tx = p.x + p.vx; ty = p.y + p.vy; tz = p.z + p.vz; }
  const dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, d = Math.hypot(dx, dy, dz) || 1, v = 13, kk = Math.min(1, dt * 9);
  p.vx += (dx / d * v - p.vx) * kk; p.vy += (dy / d * v - p.vy) * kk; p.vz += (dz / d * v - p.vz) * kk;   // elle vire vers sa cible, sans casser net
  p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  if (Math.random() < .8) parts.push({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: 0, g: 0, life: .3, age: 0, col: p.hex, luit: 1, tl: .07 });
  const sol = fgSol(p.x, p.y);
  if (p.cible && (d < .5 || toucheBete(p.cible, p.x, p.y, p.z))) { fgOrbeFrappe(p, p.cible); return true; }
  for (const b of beasts) if (b !== p.cible && fgVisable(b) && prenable(b) && toucheBete(b, p.x, p.y, p.z)) { fgOrbeFrappe(p, b); return true; }
  if (sol > p.z || p.x < 1 || p.y < 1 || p.x >= WS - 1 || p.y >= WS - 1) { fgOrbeFrappe(p, null); return true; }
  return false;
}
// l'impact : un trait ou un piège frappent la bête ; une onde éclate en anneau autour d'elle
function fgOrbeFrappe(p, o) {
  const s = p.s, x = o ? o.x : p.x, y = o ? o.y : p.y, z = o ? o.z || 0 : fgSol(p.x, p.y);
  FG.sortCtx = { id: p.id, t, charge: p.ch, ame: false, vus: new Set() };
  if (s.f.id === 'onde') {
    const R = 2.6 * s.amp; let n = 0;
    for (const q of beasts) if (prenable(q) && Math.abs((q.z || 0) - z) < 3 && (q.x - x) ** 2 + (q.y - y) ** 2 < R * R) { toucherSort(q, s.m.id, s.deg); if (s.m.feu && n < 3) brasierSort(q.x, q.y); n++; }
    anneauSort(x, y, z, s.m.col, R, 20); P.secousse = t; P.secousseK = .15;
  } else if (o && prenable(o)) { toucherSort(o, s.m.id, s.deg); if (s.m.feu) brasierSort(o.x, o.y); }
  else if (s.m.feu) brasierSort(x, y);
  burst(p.x, p.y, p.z, 12, p.hex); if (p.c2) burst(p.x, p.y, p.z, 6, hexSort(p.c2));
}
// La lame runique : chaque coup remplit ses runes (un coup chargé, deux fois plus) ; pleine, un coup chargé les vide
function fgRunes(a, A, pr, pw) {
  const id = a.id, avant = FG.runes[id] || 0; FG.runesT[id] = t;
  if (avant >= 1 && A.charge) { FG.runes[id] = 0; fgLiberer(a, pr, pw); return; }
  FG.runes[id] = Math.min(1, avant + FG_RUNE * (A.charge ? 2 : 1));
  if (avant < 1 && FG.runes[id] >= 1) { SON.jouer('rare', { vol: .5 }, P.x, P.y, P.z + 1); burst(P.x, P.y, P.z + 1.1, 16, COUL_TRAINEE[id] || '#fff4d0'); say('la lame runique est pleine · maintenir, lâcher : elle libère le sort', 2.4); }
}
function fgLiberer(a, pr, pw) {
  const L = fgLireId(a.id), T = L && FG_TYPES[L.R.type], C = L && fgAme(L.R), fk = T ? fgFocale(a, T) : 1, s = fgPhraseMain();
  P.secousse = t; P.secousseK = .45; SON.jouer('explosion', { vol: .5 }, P.x, P.y, P.z + 1);
  if (s && fgLancerPhrase(a, s, { libre: true, deg: 1.6 * fk, amp: 1.2, charge: true, ame: true, gros: 2 }) === 'ok') { say(nomPhrase(s) + ' · libéré par les runes', 1.6); return; }
  // sans phrase : l'âme de la lame éclate tout autour (trois pas)
  const hex = C ? FG_ELEM[C.el].hex : COUL_TRAINEE[a.id] || '#fff4d0'; let n = 0;
  for (const o of beasts) if (fgFrappable(o) && Math.abs((o.z || 0) - P.z) < 2.5 && (o.x - P.x) ** 2 + (o.y - P.y) ** 2 < 9) {
    fgDegats(o, degJoueur(a.deg, o) * 1.6, 'chassé'); if (C && o.pv > 0 && !o.dead) fgStatut(o, C.el, pw * 1.5); n++; }
  if (pr && !n && pr.pv > 0 && !pr.dead && C) fgStatut(pr, C.el, pw * 1.5);
  for (let k = 0; k < 28; k++) { const an = k / 28 * 6.2832; parts.push({ x: P.x + Math.cos(an) * .5, y: P.y + Math.sin(an) * .5, z: P.z + .6, vx: Math.cos(an) * 6, vy: Math.sin(an) * 6, vz: .5, g: .5, life: .45, age: 0, col: hex, luit: 1, tl: .09 }); }
  say((C ? 'l\'âme ' + fgDe(FG_ELEM[C.el].n.toLowerCase()) : 'les runes') + ' éclate' + (n ? ' · ' + n + ' bête' + (n > 1 ? 's' : '') : ''), 1.6);
}
// toucherSort (index.html) : une bête touchée par un sort parti d'une arme forgée reçoit aussi son âme
function forgeSortTouche(o, dg) {
  const X = FG.sortCtx; if (!X || t - X.t > 3 || !o || X.vus.has(o) || X.vus.size >= 6) return;
  X.vus.add(o);
  const L = fgLireId(X.id); if (!L) return;
  const C = fgAme(L.R), tue = !(o.pv > 0) || !!o.dead;
  if (C && (X.ame || fgDeclenche(C.decl, { charge: X.charge, dos: fgDerriere(o) }, tue))) fgCompetence(C, o, fgPuiss(L) * (X.ame ? 1.5 : 1));
  if (FG.buff && FG.buff.fin > t && !tue) fgStatut(o, FG.buff.el, FG.buff.pw * .5);
}

// ============================================================
//  LES ARMES À FEU (§175, phase E) : le pistolet à silex, le tromblon, le mousquet, le revolver, le canon à main.
//  Pas de munitions : on recharge. Elles prennent le geste et la pose des fusils du Centre (djEstFusil, donjon.js) ;
//  le tir est un trait (djVisee, djRayon), sauf l'obus du canon, qui vole en cloche (FG.projs). La recharge, c'est le
//  « cad » de l'arme : la forge le règle (un alliage lourd recharge plus lentement). Le dernier coup avant la recharge
//  compte comme un coup chargé, pour l'âme.
// ============================================================
const FG_FEU = {   // n : les coups avant la recharge ; coup : entre deux coups ; portee ; ecart : l'imprécision ; fort : le recul de l'arme ; recul : celui du tireur
  pistolet: { n: 2, coup: .3, portee: 16, ecart: .02, c: [255, 214, 150], son: 'tir', trait: .14, fort: .5 },
  tromblon: { n: 1, coup: 0, portee: 7.5, plombs: 9, cone: .3, c: [255, 196, 120], son: 'tir', trait: .1, fort: .9, long: 1, recul: 7 },
  mousquet: { n: 1, coup: 0, portee: 32, ecart: 0, perce: 3, c: [255, 238, 205], son: 'tir', trait: .3, fort: 1, long: 1, recul: 2, fumee: 1 },
  revolver: { n: 6, coup: .2, portee: 18, ecart: .035, c: [255, 222, 160], son: 'tir', trait: .1, fort: .35, auto: 1 },
  canon: { n: 1, coup: 0, portee: 24, obus: 1, R: 2.6, c: [255, 160, 80], son: 'tir', trait: .1, fort: 1, long: 1, recul: 5 },
};
// djEstFusil, djPoseFusil, djTirDistant (donjon.js) : ce qu'il faut savoir d'une arme à feu forgée, ou null
function forgeFeu(id) { const L = fgLireId(id), T = L && FG_TYPES[L.R.type]; return T && T.feu ? FG_FEU[T.id] : null; }
function fgFeuEtat(id, F) {
  const S = FG.feu[id] || (FG.feu[id] = { n: F.n, rech: 0, der: -9 });
  if (S.rech && t >= S.rech) { S.n = F.n; S.rech = 0; if (porte('arme') && porte('arme').id === id) { SON.jouer('clank', { vol: .5 }, P.x, P.y, P.z + .8); fgDitMagie(F.n > 1 ? 'rechargé · ' + F.n + ' coups' : 'rechargé', 1); } }
  return S;
}
// ACTION enfoncée (djTirDown la passe ici) : un coup, si l'arme est chargée ; maintenu, le revolver enchaîne
function forgeTirDown(a) {
  const F = forgeFeu(a.id); if (!F) return;
  const S = fgFeuEtat(a.id, F);
  if (S.rech) { if (S.n > 0) S.rech = 0; else { FG.magDit = -9; fgDitMagie('rechargement · encore ' + Math.max(.1, S.rech - t).toFixed(1).replace('.', ',') + ' s', .9); return; } }   // une recharge entamée s'interrompt pour tirer
  if (S.n <= 0) { if (!S.rech) S.rech = t + a.cad; return; }        // (§179) vide : on recharge, on ne tire plus
  if (F.auto) FG.feuTenu = a;
  if (t - S.der < F.coup) return;
  fgTirFeu(a, F, S);
}
function forgeTirUp(a) { FG.feuTenu = null; }
// à chaque image : le revolver tenu, et la recharge qui part seule (vide ; ou entamé et laissé deux secondes)
function fgMajFeu() {
  const a = porte('arme'), F = a && a.fg && forgeFeu(a.id); if (!F) { FG.feuTenu = null; return; }
  const S = fgFeuEtat(a.id, F);
  if (FG.feuTenu === a && !S.rech && S.n > 0 && t - S.der >= F.coup) fgTirFeu(a, F, S);
  if (!S.rech && S.n < F.n && (S.n <= 0 ? t - S.der >= Math.max(.25, F.coup) : t - S.der > 2 && FG.feuTenu !== a)) {
    S.rech = t + a.cad * (S.n > 0 ? .5 + .5 * (F.n - S.n) / F.n : 1); SON.jouer('cliquet', { k: .5, vol: .6 }, P.x, P.y, P.z + .8);
  }
}
function fgTirFeu(a, F, S) {
  if (P.effroi > t || P.pv <= 0) return;
  const L = fgLireId(a.id), T = FG_TYPES[L.R.type];
  S.n--; S.der = t; const dernier = S.n <= 0;
  if (dernier) { S.rech = t + a.cad; FG.feuTenu = null; SON.jouer('cliquet', { k: .5, vol: .6 }, P.x, P.y, P.z + .8); }   // (§179) la recharge part dès le dernier coup
  P.anim = null; P.arc = null; P.tirW0 = poidsGeste(P); P.tir0 = t; P.decoche = t; P.decocheK = 1; P.garde = t + GARDE_T; P.agiteT = t;
  annoncer('decoche', 0, 1); if (typeof iaNote === 'function') iaNote('coup');
  const V = djVisee(F.portee);
  if (V.c) P.face = P.faceS = Math.atan2(V.c.y - P.y, V.c.x - P.x);
  const sd = [-V.d[1], V.d[0], 0], o = T.id === 'pistolet' ? V.o.map((q, k) => q + sd[k] * (S.n % 2 ? .06 : -.06)) : V.o;   // la paire : la main droite, puis la gauche
  SON.jouer(F.son, { vol: 1 }, P.x, P.y, P.z + .6);
  burst(o[0], o[1], o[2], F.long ? 10 : 6, '#ffe2a0');
  for (let k = 0; k < (F.fumee ? 14 : F.long ? 7 : 4); k++) parts.push({ x: o[0] + V.d[0] * .1, y: o[1] + V.d[1] * .1, z: o[2], vx: V.d[0] * (1 + Math.random() * 1.5) + (Math.random() - .5) * .6, vy: V.d[1] * (1 + Math.random() * 1.5) + (Math.random() - .5) * .6,
    vz: .3 + Math.random() * .4, g: -.15, life: F.fumee ? 1.8 + Math.random() : .8 + Math.random() * .5, age: 0, col: k % 3 ? '#d8d4cc' : '#b8b2a8', tl: F.fumee ? .16 : .1 });
  if (F.recul) { P.vx -= Math.cos(P.faceS) * F.recul; P.vy -= Math.sin(P.faceS) * F.recul; P.recul = Math.max(P.recul || 0, F.recul > 4 ? .22 : .1); P.secousse = t; P.secousseK = F.recul > 4 ? .6 : .3; }   // le recul : sans frottement un instant
  if (dernier && F.n > 1) say('à recharger', .8);
  if (F.obus) return fgLancerObus(a, o, V, dernier);
  const touches = new Map(), pgF = fgPigDe(a.id);                     // bête → { dg, d } : les plombs s'additionnent ; le pigment teinte le trait
  const coup = (d, k) => {
    let o2 = o, reste = F.portee, ign = null;
    for (let n = 0; n < (F.perce || 1); n++) {
      const r = djRayon(o2, d, reste, ign);
      DJ.traits.push({ a: o2, b: r.p, c: (pgF ? fgPigRgb(pgF) : F.c).map(v => v / 255), w: (F.plombs ? 1.4 : F.long ? 2.8 : 2.2) * (pgF ? 1.25 : 1), t0: t, dur: F.trait * (pgF ? 1.6 : 1) });
      if (r.b) { const b = r.b, q = touches.get(b) || { dg: 0, d }; q.dg += degJoueur(a.deg, b) * k * (F.plombs ? 1 - .5 * r.s / F.portee : 1); touches.set(b, q);
        burst(r.p[0], r.p[1], r.p[2], F.plombs ? 3 : 8, '#ffb0a0'); ign = b; o2 = r.p.map((v, i) => v + d[i] * .6); reste -= r.s + .6; if (reste <= 0) break; continue; }
      if (r.loin) frapperLoin(r.loin, a.deg * k);
      else if (r.mur) burst(r.p[0], r.p[1], r.p[2], F.plombs ? 2 : 6, '#c8b89a');
      break;
    }
  };
  const ecarte = (d, ang, el) => { const c = Math.cos(ang), s = Math.sin(ang); return nrm([d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2] + el]); };
  if (F.plombs) for (let i = 0; i < F.plombs; i++) coup(ecarte(V.d, (i / (F.plombs - 1) - .5) * F.cone * 2 + (Math.random() - .5) * .08, (Math.random() - .5) * .1), .3);
  else coup(F.ecart ? ecarte(V.d, (Math.random() - .5) * 2 * F.ecart, (Math.random() - .5) * F.ecart) : V.d, 1);
  for (const [b, q] of touches) if (fgVisable(b)) { const kb = F.plombs ? 6 : F.perce ? 2 : 1.5; fgBlesse(b, q.dg, q.d[0] * kb, q.d[1] * kb, a.id, dernier, q.d[0], q.d[1]); }
}
// Le canon : l'obus part à 55° et retombe sur la bête visée (ou à dix pas devant) ; il éclate au premier contact
function fgLancerObus(a, o, V, dernier) {
  const c = V.c || fgVise(FG_FEU.canon.portee, .6), el = .96, ce = Math.cos(el), te = Math.tan(el);
  let tx, ty, tz;
  if (c) { const q = centreBete(c); tx = q[0]; ty = q[1]; tz = c.z || 0; P.face = P.faceS = Math.atan2(ty - P.y, tx - P.x); }
  else { tx = P.x + Math.cos(P.faceS) * 10; ty = P.y + Math.sin(P.faceS) * 10; tz = fgSol(tx, ty); }
  const d = Math.max(1.5, Math.hypot(tx - o[0], ty - o[1])), dz = tz - o[2], den = 2 * ce * ce * (d * te - dz);
  const v = den > 0 ? Math.min(25, Math.sqrt(ARC_G * d * d / den)) : 25, f = Math.atan2(ty - o[1], tx - o[0]);
  FG.projs.push({ k: 'obus', id: a.id, x: o[0], y: o[1], z: o[2], vx: Math.cos(f) * ce * v, vy: Math.sin(f) * ce * v, vz: Math.sin(el) * v, age: 0, deg: a.deg, R: FG_FEU.canon.R, ch: dernier,
    cx: tx, cy: ty, cz: tz, vol: d / (ce * v), ile: canalIle() });
}
function fgObus(p, dt) {
  if (p.age > 6) return true;
  const n = Math.max(1, Math.ceil(Math.hypot(p.vx, p.vy, p.vz) * dt / .2)), h = dt / n;
  for (let s = 0; s < n; s++) {
    p.vz -= ARC_G * h; const nx = p.x + p.vx * h, ny = p.y + p.vy * h, nz = p.z + p.vz * h;
    let boum = nx < 1 || ny < 1 || nx >= WS - 1 || ny >= WS - 1 || nz < -6 || fgSol(nx, ny) > nz || (p.age > .15 && typeof floreTouche === 'function' && floreTouche(nx, ny, nz));
    if (!boum && p.age > .1) for (const b of beasts) if (fgVisable(b) && toucheBete(b, nx, ny, nz)) { boum = true; break; }
    if (boum) { fgEclat(p, p.x, p.y, Math.max(p.z, fgSol(p.x, p.y))); return true; }
    p.x = nx; p.y = ny; p.z = nz;
  }
  if (Math.random() < .7) parts.push({ x: p.x, y: p.y, z: p.z, vx: 0, vy: 0, vz: .2, g: -.1, life: .5, age: 0, col: Math.random() < .3 ? '#ffc060' : '#9a948c', luit: 0, tl: .07 });
  return false;
}
function fgEclat(p, x, y, z) {
  SON.jouer('explosion', {}, x, y, z); P.secousse = t; P.secousseK = Math.max(.3, 1 - Math.hypot(P.x - x, P.y - y) / 14);
  burst(x, y, z + .2, 30, '#ffb45a'); burst(x, y, z + .4, 16, '#6a6058'); burst(x, y, z + .1, 10, '#fff0c0');
  for (let k = 0; k < 18; k++) { const an = k / 18 * 6.2832; parts.push({ x: x + Math.cos(an) * .3, y: y + Math.sin(an) * .3, z: z + .15, vx: Math.cos(an) * p.R * 2.2, vy: Math.sin(an) * p.R * 2.2, vz: .5, g: 1, life: .45, age: 0, col: '#ffcf80', luit: 1, tl: .09 }); }
  for (const b of beasts) {
    if (!fgVisable(b) || Math.abs((b.z || 0) - z) > 3) continue;
    const dd = Math.hypot(b.x - x, b.y - y); if (dd > p.R) continue;
    const k = 1 - .6 * dd / p.R, ux = (b.x - x) / (dd || 1), uy = (b.y - y) / (dd || 1);
    fgBlesse(b, degJoueur(p.deg, b) * k, ux * 7 * k, uy * 7 * k, p.id, p.ch, ux, uy);
  }
}
// Le bandeau (djHud) : les coups en main, ou la recharge
function forgeHud() {
  const a = typeof porte === 'function' ? porte('arme') : null, F = a && a.fg && forgeFeu(a.id); if (!F) return '';
  const S = fgFeuEtat(a.id, F);
  if (S.rech) return ` · RECHARGE <b style="color:#ffb070">${Math.max(.1, S.rech - t).toFixed(1).replace('.', ',')} s</b>`;
  return ` · ${F.n > 2 ? 'BARILLET' : 'CHARGÉ'} <b style="color:#ffe2a0">${'●'.repeat(S.n)}${'○'.repeat(F.n - S.n)}</b>`;
}
// L'arme en main (forgeGeom) : sur le cadre des fusils du Centre (l'origine, l'axe, le côté, le haut)
function fgGeomFeu(id, T, F, J, B, K) {
  const pose = (a, b, w, h, c) => B.push({ a, b, w, h, c }), { lame, fil, M, deco, sombre, lg } = K;
  const A = F.arb || F, u = nrm(A.u || [1, 0, 0]), sd = A.side || nrm(v3.len(v3.cross(u, [0, 0, 1])) > .2 ? v3.cross(u, [0, 0, 1]) : [0, -1, 0]);
  const up = nrm(v3.cross(sd, u)), cote = (p, k) => v3.add(p, v3.mul(sd, k)), haut = (p, k) => v3.add(p, v3.mul(up, k));
  const S = J === P ? FG.feu[id] : null, Fe = FG_FEU[T.id], charges = S ? (S.rech ? 0 : S.n) : Fe.n;
  if (T.id === 'pistolet' || T.id === 'revolver') {
    const paire = T.id === 'pistolet' ? [-.045, .045] : [0], e = (T.id === 'pistolet' ? .2 : .17) + .05 * lg;
    paire.forEach((o, k) => {
      const at = q => cote(v3.add(A.o, v3.mul(u, q)), o);
      pose(cote(A.o, o), v3.add(haut(cote(A.o, o), -.075), v3.mul(u, -.035)), .03, .036, M);                 // la crosse
      pose(at(-.03), at(.05), .036, .05, T.id === 'revolver' ? lame : deco);                                 // la platine, la carcasse
      pose(at(.03), at(e), .024, .026, lame); pose(at(e - .015), at(e + .008), .032, .032, deco);             // le canon, sa bouche
      if (T.id === 'revolver') { pose(at(.0), at(.055), .058, .058, sombre); for (let i = 0; i < 6; i++) { const an = i * 1.047; pose(v3.add(at(.056), v3.add(v3.mul(sd, Math.cos(an) * .017), v3.mul(up, Math.sin(an) * .017))), v3.add(at(.06), v3.add(v3.mul(sd, Math.cos(an) * .017), v3.mul(up, Math.sin(an) * .017))), .009, .009, i < charges ? fil : sombre); } }
      pose(haut(at(-.03), .03), haut(at(-.05), charges > (T.id === 'pistolet' ? k : 0) ? .06 : .035), .012, .012, charges > k || T.id === 'revolver' ? deco : sombre);   // le chien : armé, ou tombé
    });
    return true;
  }
  const at = q => v3.add(A.o, v3.mul(u, q));
  if (T.id === 'tromblon') {
    pose(at(-.24), at(-.03), .045, .07, M); pose(A.o, v3.add(haut(A.o, -.07), v3.mul(u, -.02)), .028, .03, M);
    pose(at(-.04), at(.05), .05, .055, deco); pose(at(.04), at(.3 + .06 * lg), .042, .042, lame);
    const b0 = .3 + .06 * lg; pose(at(b0), at(b0 + .05), .062, .062, lame); pose(at(b0 + .05), at(b0 + .09), .085, .085, deco);
    pose(haut(at(.1), .028), haut(at(.12), .028), .046, .01, fil);
  } else if (T.id === 'mousquet') {
    const e = .62 + .1 * lg;
    pose(at(-.27), at(-.05), .042, .07, M); pose(at(-.05), at(.35), .034, .042, M); pose(A.o, v3.add(haut(A.o, -.07), v3.mul(u, -.02)), .026, .028, M);
    pose(haut(at(-.04), .025), haut(at(e), .025), .022, .022, lame); pose(haut(at(e - .02), .025), haut(at(e + .01), .025), .03, .03, deco);
    for (const q of [.16, .34]) pose(at(q), at(q + .018), .046, .06, deco);
    pose(haut(at(-.03), .045), haut(at(.02), charges ? .075 : .05), .012, .012, charges ? deco : sombre);
    pose(haut(at(.06), -.012), haut(at(e - .06), -.012), .008, .008, fil);                                     // la baguette de bourrage
  } else {                                                                                                     // le canon à main
    pose(A.o, v3.add(haut(A.o, -.08), v3.mul(u, -.03)), .034, .036, M); pose(at(-.12), at(-.02), .05, .06, M);
    pose(at(-.06), at(.3 + .04 * lg), .1, .1, lame); pose(at(.28 + .04 * lg), at(.34 + .04 * lg), .125, .125, deco);
    pose(at(.02), at(.05), .108, .108, fil); pose(haut(at(-.05), .05), haut(at(-.07), .085), .014, .014, charges ? [255, 190, 90] : sombre);   // la mèche
  }
  return true;
}

// ============================================================
//  L'OMBRE DE KORLAZ (§177) : une arme forgée avec une dose de Korlaz porte une petite ombre bestiale. Tant qu'on la tient,
//  l'ombre flotte derrière votre épaule en perdant des lambeaux de fumée. Une bête vous menace (ou vous l'avez désignée) : elle
//  fond dessus et la frappe de tous côtés, d'un bond à l'autre, comme un ninja, puis revient. Elle n'est pas une bête : ni les
//  bêtes ni les joueurs ne peuvent la viser ni la toucher. Ceux d'en face la voient flotter près de vous.
// ============================================================
const FG_OMBRE = { r: 8, coups: 6, pas: .1, k: .12, repos: 1.8, v: 16 };   // r : sa portée ; coups par assaut ; pas : entre deux bonds ; k : chaque coup, sur les dégâts de l'arme
const fgKorlaz = id => { const L = fgLireId(id); return !!(L && L.R.ch[5]); };
// (§178) à distance (arcs, arbalète, lancer, poudre, bâton, baguette, orbe) : l'ombre ; au contact (le reste, la lame runique comprise) : les griffes
const fgDistanceT = T => !!(T && (T.arc || T.lance || T.feu || (T.magie && T.id !== 'lamerunique')));
const fgOmbreDe = id => { const L = fgLireId(id); return !!(L && L.R.ch[5] && fgDistanceT(FG_TYPES[L.R.type])); };
const fgGriffeDe = id => { const L = fgLireId(id); return !!(L && L.R.ch[5] && !fgDistanceT(FG_TYPES[L.R.type])); };
const fgAngVers = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return a + d * Math.min(1, k); };
function fgOmbreChez(J, O) {                                        // au repos : derrière l'épaule gauche, et qui flotte
  const f = (J.faceS ?? J.face ?? 0) + 2.3;
  return [J.x + Math.cos(f) * .95, J.y + Math.sin(f) * .95, J.z + (J.selle || 0) + 1.1 + Math.sin(t * 2.6 + O.ph) * .1];
}
function fgOmbreFumee(O, n) {
  for (let i = 0; i < n; i++) { const v = Math.random();
    parts.push({ x: O.x + (Math.random() - .5) * .22, y: O.y + (Math.random() - .5) * .22, z: O.z + (Math.random() - .5) * .18, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .2 + Math.random() * .35, g: -.2,
      life: .55 + Math.random() * .5, age: 0, col: v < .18 ? '#9a6cff' : v < .6 ? '#1a1224' : '#2e2244', luit: v < .18 ? 1 : 0, tl: .045 + Math.random() * .04 }); }
}
function fgOmbreCible() {
  const vc = typeof CIB !== 'undefined' && CIB.verrou ? CIB.o : null;
  if (vc && vc.sp && fgVisable(vc) && prenable(vc) && Math.hypot(vc.x - P.x, vc.y - P.y) < FG_OMBRE.r + 2) return vc;
  let c = null, dc = FG_OMBRE.r ** 2;
  for (const b of beasts) if (fgMenace(b) && Math.abs((b.z || 0) - P.z) < 4) { const d2 = (b.x - P.x) ** 2 + (b.y - P.y) ** 2; if (d2 < dc) { dc = d2; c = b; } }
  return c;
}
function fgOmbreVers(O, q, v, dt) {                                 // avancer vers q : rend la distance qui restait
  const dx = q[0] - O.x, dy = q[1] - O.y, dz = q[2] - O.z, d = Math.hypot(dx, dy, dz) || 1, s = Math.min(d, v * dt);
  O.x += dx / d * s; O.y += dy / d * s; O.z += dz / d * s; if (Math.hypot(dx, dy) > .05) O.f = fgAngVers(O.f, Math.atan2(dy, dx), dt * 14);
  return d;
}
function fgOmbreFrappe(O, c) {
  const D = FG_OMBRE, sz = c.sp.sz || 1, R = .55 + .3 * sz, an = O.b0 + O.n * 2.39996 + (Math.random() - .5) * .5, q = centreBete(c);
  const x0 = O.x, y0 = O.y, z0 = O.z;
  O.x = c.x + Math.cos(an) * R; O.y = c.y + Math.sin(an) * R; O.z = q[2] + (Math.random() - .35) * .45 * sz; O.f = Math.atan2(c.y - O.y, c.x - O.x);
  for (let k = 0; k <= 7; k++) { const f = k / 7;                    // le sillage du bond
    parts.push({ x: x0 + (O.x - x0) * f, y: y0 + (O.y - y0) * f, z: z0 + (O.z - z0) * f, vx: 0, vy: 0, vz: 0, g: 0, life: .16 + f * .12, age: 0, col: k % 2 ? '#7c4ce6' : '#1a1224', luit: k % 2, tl: .065 }); }
  const a2 = O.f + 1.5708;                                           // la griffure, en travers
  for (let k = -2; k <= 2; k++) parts.push({ x: q[0] + Math.cos(a2) * k * .07 - Math.cos(O.f) * .12, y: q[1] + Math.sin(a2) * k * .07 - Math.sin(O.f) * .12, z: q[2] + k * .07,
    vx: Math.cos(O.f) * 2.2, vy: Math.sin(O.f) * 2.2, vz: 0, g: 0, life: .14, age: 0, col: '#d2b0ff', luit: 1, tl: .04 });
  const a = objet(O.a);
  fgDegats(c, degJoueur((a ? a.deg : .5) * D.k, c) * robuste(c), 'ombre');
  SON.jouer('touche', { arme: 'lame', vol: .35 }, c.x, c.y, (c.z || 0) + .5);
  if (++O.n >= D.coups || !fgVisable(c)) { O.e = 'retour'; O.cd = D.repos; }
}
function fgMajOmbre(dt) {
  const a = porte('arme'), tient = !!(a && a.fg && fgOmbreDe(a.id) && P.pv > 0), D = FG_OMBRE;
  let O = FG.ombre;
  if (!tient) { if (O) { O.vie -= dt * 2.5; if (O.vie <= 0) FG.ombre = null; else fgOmbreFumee(O, 1); } }
  else {
    const ile = canalIle();
    if (!O || O.ile !== ile) { O = FG.ombre = { x: 0, y: 0, z: 0, e: 'suit', vie: 0, cd: 1, f: P.faceS || 0, n: 0, c: null, tf: 0, b0: 0, ph: Math.random() * 6, ile, a: a.id };
      const h = fgOmbreChez(P, O); O.x = h[0]; O.y = h[1]; O.z = h[2]; fgOmbreFumee(O, 14); }
    O.a = a.id; O.vie = Math.min(1, O.vie + dt * 2);
    if (O.e === 'suit') {
      const h = fgOmbreChez(P, O), k = Math.min(1, dt * 5); O.x += (h[0] - O.x) * k; O.y += (h[1] - O.y) * k; O.z += (h[2] - O.z) * k; O.f = fgAngVers(O.f, P.faceS || 0, dt * 6);
      if ((O.cd -= dt) <= 0) { O.cd = .25; const c = fgOmbreCible(); if (c) { O.e = 'fond'; O.c = c; SON.jouer('elan', { arme: 'lame', dur: .15, vol: .4 }, O.x, O.y, O.z); } }
    } else if (O.e === 'fond') {
      const c = O.c;
      if (!fgVisable(c) || Math.hypot(c.x - P.x, c.y - P.y) > D.r + 6) O.e = 'retour';
      else { const d = fgOmbreVers(O, centreBete(c), D.v, dt); fgOmbreFumee(O, 1);
        if (d < .9 + (c.sp.sz || 1) * .3) { O.e = 'frappe'; O.n = 0; O.tf = 0; O.b0 = Math.atan2(O.y - c.y, O.x - c.x); } }
    } else if (O.e === 'frappe') {
      const c = O.c;
      if (!fgVisable(c)) { O.e = 'retour'; O.cd = D.repos * .5; }
      else if ((O.tf -= dt) <= 0) { O.tf = D.pas; fgOmbreFrappe(O, c); }
    } else if (fgOmbreVers(O, fgOmbreChez(P, O), 12, dt) < .4) O.e = 'suit';
    if (Math.random() < dt * (O.e === 'suit' ? 14 : 24)) fgOmbreFumee(O, 1);
  }
  // l'ombre des autres : elle flotte près d'eux (leurs assauts ne passent pas)
  if (typeof Autres !== 'undefined' && Autres.size) {
    const vus = new Set();
    for (const j of Autres.values()) {
      if (!(j.pv > 0) || !j.arme || !fgOmbreDe(j.arme) || (j.x - P.x) ** 2 + (j.y - P.y) ** 2 > 3600) continue;
      vus.add(j.u); let Q = FG.ombresJ.get(j.u);
      if (!Q) { FG.ombresJ.set(j.u, Q = { x: j.x, y: j.y, z: j.z + 1, vie: 0, ph: Math.random() * 6, e: 'suit', f: j.faceS || 0 }); }
      const h = fgOmbreChez(j, Q), k = Math.min(1, dt * 5); Q.vie = Math.min(1, Q.vie + dt * 2);
      Q.x += (h[0] - Q.x) * k; Q.y += (h[1] - Q.y) * k; Q.z += (h[2] - Q.z) * k; Q.f = fgAngVers(Q.f, j.faceS || 0, dt * 6);
      if (Math.random() < dt * 10) fgOmbreFumee(Q, 1);
    }
    for (const u of [...FG.ombresJ.keys()]) if (!vus.has(u)) FG.ombresJ.delete(u);
  } else if (FG.ombresJ.size) FG.ombresJ.clear();
}
// (§178) LES GRIFFES DE KORLAZ : une arme de contact forgée avec du Korlaz lacère la cible (désignée, ou celle que le jeu vous
// montre), à chaque coup, même de loin (douze pas) : trois grandes lacérations noires, tracées en travers d'elle, de gauche à
// droite, puis de droite à gauche au coup suivant. Elles portent ensemble 40 % des dégâts de l'arme.
const FG_GRIFFE = { r: 12, k: .4, dur: .16 };
function fgGriffe(a) {
  const c = typeof cibleVue === 'function' ? cibleVue() : null;
  if (!c || !c.sp || c.tame || !fgVisable(c) || !prenable(c) || c.sp.pnj || c.sp.villageois) return;
  if (Math.hypot(c.x - P.x, c.y - P.y) > FG_GRIFFE.r || Math.abs((c.z || 0) - P.z) > 6) return;
  FG.griffeSens = -(FG.griffeSens || -1);                                // à droite, puis à gauche
  FG.griffes.push({ c, t0: t, sens: FG.griffeSens, f: 0, sz: Math.max(.7, Math.min(2.4, c.sp.sz || 1)) });
  SON.jouer('elan', { arme: 'lame', dur: .14, vol: .7 }, c.x, c.y, (c.z || 0) + .6);
  fgDegats(c, degJoueur(a.deg * FG_GRIFFE.k, c) * robuste(c), 'griffé'); c.alarm = 1;
  if (c.pv > 0 && !c.dead) SON.jouer('touche', { arme: 'lame', vol: .5 }, c.x, c.y, (c.z || 0) + .6);
}
// le tracé : trois traits parallèles, en diagonale, dans le plan qui fait face au joueur ; chacun se dessine en 0,16 s
function fgMajGriffes() {
  for (let i = FG.griffes.length - 1; i >= 0; i--) {
    const G = FG.griffes[i], c = G.c, k = Math.min(1, (t - G.t0) / FG_GRIFFE.dur);
    if (!c || beasts.indexOf(c) < 0) { FG.griffes.splice(i, 1); continue; }
    const q = centreBete(c), dx = c.x - P.x, dy = c.y - P.y, dd = Math.hypot(dx, dy) || 1, ux = dx / dd, uy = dy / dd, sx = -uy, sy = ux;
    const W = .62 * G.sz, H = .5 * G.sz, ec = .22 * G.sz, ox = q[0] - ux * .35 * G.sz, oy = q[1] - uy * .35 * G.sz;
    for (let l = -1; l <= 1; l++) {
      const off = l * ec, pt = f => { const u = (f * 2 - 1) * G.sens; return [ox + sx * (u * W + off * .5), oy + sy * (u * W + off * .5), q[2] + (-f * 2 + 1) * H + off]; };
      for (let f = G.f; f < k; f += .03) {                          // un trait net : fin aux deux bouts, large au milieu, un fil violet au cœur
        const p0 = pt(Math.min(1, f + Math.random() * .03)), mince = 1 - Math.abs(f * 2 - 1);
        parts.push({ x: p0[0], y: p0[1], z: p0[2], vx: ux * -.08, vy: uy * -.08, vz: -.03, g: .15, life: .55 + .25 * mince, age: 0, col: Math.random() < .6 ? '#050308' : '#140d1e', luit: 0, tl: (.022 + .038 * mince) * Math.min(1.4, G.sz) });
        if (Math.random() < .5) parts.push({ x: p0[0] - ux * .02, y: p0[1] - uy * .02, z: p0[2], vx: 0, vy: 0, vz: 0, g: 0, life: .3, age: 0, col: '#7a34b8', luit: 1, tl: .014 + .01 * mince });
      }
    }
    G.f = k;
    if (k >= 1) { burst(q[0], q[1], q[2], 6, '#1a1224'); FG.griffes.splice(i, 1); }
  }
}
// (§178) une arme au Korlaz perd des particules noires par la lame (forgeGeom)
function fgKorlazFume(id, J, B, n0) {
  if (!J || !Number.isFinite(J.x)) return;
  const cle = (J === P ? 'P' : J.u || 'j') + id + 'k', der = FG.auraT.get(cle) ?? 0;
  if (t - der < 1 / 22 || parts.length > 1400) return;
  FG.auraT.set(cle, t);
  const L = []; for (let i = n0; i < B.length; i++) if (B[i].bl) L.push(B[i]);
  const o = L.length ? L[Math.random() * L.length | 0] : B[n0 + (Math.random() * (B.length - n0) | 0)];
  const f = J.faceS ?? J.face ?? 0, cf = Math.cos(f), sf = Math.sin(f), zs = J.z + (J.selle || 0), v = mixv(o.a, o.b, Math.random());
  const x = J.x + v[0] * cf - v[1] * sf, y = J.y + v[0] * sf + v[1] * cf, z = zs + v[2], vi = Math.random() < .14;
  parts.push({ x, y, z, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, vz: .12 + Math.random() * .3, g: -.12, life: .6 + Math.random() * .5, age: 0,
    col: vi ? '#8a5ae8' : Math.random() < .5 ? '#08060c' : '#1c1428', luit: vi ? 1 : 0, tl: vi ? .025 : .035 + Math.random() * .03 });
}
// (§184) une arme au Vyrel suinte : des gouttes violettes tombent de la lame, quelques-unes luisent
function fgVyrelSuinte(id, J, B, n0) {
  if (!J || !Number.isFinite(J.x)) return;
  const cle = (J === P ? 'P' : J.u || 'j') + id + 'v', der = FG.auraT.get(cle) ?? 0;
  if (t - der < 1 / 14 || parts.length > 1400) return;
  FG.auraT.set(cle, t);
  const L = []; for (let i = n0; i < B.length; i++) if (B[i].bl) L.push(B[i]);
  const o = L.length ? L[Math.random() * L.length | 0] : B[n0 + (Math.random() * (B.length - n0) | 0)];
  const f = J.faceS ?? J.face ?? 0, cf = Math.cos(f), sf = Math.sin(f), zs = J.z + (J.selle || 0), v = mixv(o.a, o.b, Math.random());
  const x = J.x + v[0] * cf - v[1] * sf, y = J.y + v[0] * sf + v[1] * cf, z = zs + v[2], lu = Math.random() < .3;
  parts.push({ x, y, z, vx: (Math.random() - .5) * .1, vy: (Math.random() - .5) * .1, vz: -.2, g: 5, life: .5 + Math.random() * .3, age: 0,
    col: lu ? '#d8a8ff' : Math.random() < .5 ? '#7a3aa8' : '#4e2070', luit: lu ? 1 : 0, tl: .03 + Math.random() * .02 });
}
// (§184) le Vyrel au contact : la cible est contaminée (elle s'affaiblit et ralentit) ; une bête qui en meurt éclate
// en miasme et contamine ses voisines (trois générations au plus). Tirée : une flaque de miasme là où elle touche.
function fgVyrelCoup(b, tue, gen = 0) {
  if (!b || !b.sp || b.sp.plante || b.tame) return;
  if (tue || b.dead || !(b.pv > 0)) { fgVyrelEclat(b, gen); return; }
  b.fgVyrel = { fin: t + 6, dps: .03, gen };
  for (let k = 0; k < 6; k++) parts.push({ x: b.x + (Math.random() - .5) * .5, y: b.y + (Math.random() - .5) * .5, z: (b.z || 0) + .4 + Math.random() * .5, vx: 0, vy: 0, vz: .4, g: -.1, life: .6, age: 0, col: Math.random() < .5 ? '#b070f0' : '#5a2a80', luit: 1, tl: .04 });
}
function fgVyrelEclat(b, gen) {
  for (let k = 0; k < 22; k++) { const a = Math.random() * 6.2832; parts.push({ x: b.x, y: b.y, z: (b.z || 0) + .5, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6, vz: .4 + Math.random() * .6, g: .5, life: .8 + Math.random() * .4, age: 0,
    col: Math.random() < .4 ? '#d8a8ff' : '#7a3aa8', luit: Math.random() < .4 ? 1 : 0, tl: .06 }); }
  if (gen >= 3) return;
  for (const o of beasts) if (o !== b && !o.dead && o.pv > 0 && !o.tame && !(o.sp && (o.sp.plante || o.sp.batiment)) && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 3.5 * 3.5 && !(o.fgVyrel && o.fgVyrel.fin > t)) fgVyrelCoup(o, false, gen + 1);
}
function fgVyrelFlaque(x, y, z) { FG.vyFlaques.push({ x, y, z, r: 1.6, fin: t + 5, tic: 0 }); }
// son dessin : un petit corps sombre, une tête aux oreilles pointues, deux yeux qui luisent (rouges à l'assaut), des pattes griffues,
// une queue de fumée qui ondule
function fgOmbreOs(O, E) {
  const s = Math.max(.05, O.vie) * .78, f = O.f || 0, c = Math.cos(f), n = Math.sin(f);   // petite : un peu plus qu'une tête
  const Q = (a, b, h) => [O.x + (c * a - n * b) * s, O.y + (n * a + c * b) * s, O.z + h * s];
  const noir = [16, 11, 24], corps = [28, 19, 40], pale = [48, 34, 70], fur = O.e === 'frappe' || O.e === 'fond', oeil = fur ? [255, 80, 130] : [196, 136, 255];
  const res = Math.sin(t * 9 + O.ph) * .015;
  E(O, Q(-.13, 0, 0), Q(.1, 0, .02), .27 * s, (.24 + res) * s, corps);
  E(O, Q(.06, 0, .12), Q(.22, 0, .15), .2 * s, .17 * s, noir);
  for (const sg of [-1, 1]) {
    E(O, Q(.11, sg * .06, .21), Q(.05, sg * .1, .36), .05 * s, .035 * s, noir);
    E(O, Q(.222, sg * .045, .17), Q(.238, sg * .045, .17), .042 * s, .032 * s, oeil, 1);
    const g = fur ? Math.sin(t * 30 + sg) * .05 : 0;
    E(O, Q(.05, sg * .12, -.04), Q(.16 + g, sg * .15, -.12), .045 * s, .04 * s, noir);
    E(O, Q(.16 + g, sg * .15, -.12), Q(.21 + g, sg * .16, -.15), .03 * s, .02 * s, pale);
  }
  let pr = Q(-.12, 0, 0);
  for (let k = 1; k <= 4; k++) { const q = Q(-.12 - .11 * k, Math.sin(t * 5 + O.ph + k) * .05 * k, -.04 * k + Math.cos(t * 4 + k) * .02); E(O, pr, q, (.18 - .035 * k) * s, (.16 - .03 * k) * s, k < 3 ? corps : pale); pr = q; }
}

// ---------- à chaque image : les brûlures, les poisons, les zones, les auras, les traits, la rafale ----------
function forgeMaj(dt) {
  if (!dt || typeof beasts === 'undefined') return;
  if (FG.projs.length) fgMajProjs(dt);
  for (const b of beasts) {
    if (b.dead || !(b.pv > 0)) { if (b.fgVyrel && b.fgVyrel.fin > t) { const g = b.fgVyrel.gen | 0; b.fgVyrel = null; fgVyrelEclat(b, g); }   // (§184) l'épidémie
      b.fgFeu = b.fgPoison = b.fgSaigne = b.fgVyrel = null; continue; }
    if (b.fgVyrel) { const S = b.fgVyrel; if (S.fin <= t) b.fgVyrel = null; else { fgDegats(b, S.dps * dt, 'Vyrel');
      if (Math.random() < dt * 6) parts.push({ x: b.x + (Math.random() - .5) * .5, y: b.y + (Math.random() - .5) * .5, z: (b.z || 0) + Math.random() * .8, vx: 0, vy: 0, vz: .5, g: -.1, life: .6, age: 0, col: Math.random() < .5 ? '#a060e0' : '#4a2068', luit: Math.random() < .3 ? 1 : 0, tl: .04 }); } }
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
  for (let k = FG.vyFlaques.length - 1; k >= 0; k--) {                // (§184) les flaques de Vyrel : elles contaminent ce qui y entre
    const Z = FG.vyFlaques[k]; if (Z.fin <= t) { FG.vyFlaques.splice(k, 1); continue; }
    if (Math.random() < dt * 14) { const a = Math.random() * 6.28, rr = Math.random() * Z.r; parts.push({ x: Z.x + Math.cos(a) * rr, y: Z.y + Math.sin(a) * rr, z: Z.z + .05, vx: 0, vy: 0, vz: .35, g: -.05, life: .9, age: 0, col: Math.random() < .3 ? '#d8a8ff' : '#7a3aa8', luit: Math.random() < .3 ? 1 : 0, tl: .05 }); }
    Z.tic -= dt; if (Z.tic > 0) continue; Z.tic = .5;
    for (const o of beasts) if (!o.dead && o.pv > 0 && !o.tame && !(o.sp && (o.sp.plante || o.sp.batiment)) && (o.x - Z.x) ** 2 + (o.y - Z.y) ** 2 < Z.r * Z.r && !(o.fgVyrel && o.fgVyrel.fin > t + 4)) fgVyrelCoup(o, false, 1);
  }
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
  fgMajMagie(dt); fgMajFeu(); fgMajOmbre(dt); if (FG.griffes.length) fgMajGriffes();
  if (FG.charge && t - FG.charge.t0 >= .5 && !FG.charge.raf && Math.random() < dt * 20) parts.push({ x: P.x + (Math.random() - .5) * .5, y: P.y + (Math.random() - .5) * .5, z: P.z + .8 + Math.random() * .5, vx: 0, vy: 0, vz: .6, g: 0, life: .35, age: 0, col: '#ffd27d', luit: 1, tl: .05 });
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
    + '.fg-pigs{display:flex;flex-wrap:wrap;gap:5px;width:100%;}.fg-pg{display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:9px;border:1px solid rgba(240,190,140,.22);background:rgba(255,214,170,.05);color:#e6ddd0;font:inherit;font-size:11.5px;cursor:pointer;}'
    + '.fg-pg i{width:14px;height:14px;border-radius:4px;box-shadow:0 0 6px rgba(255,255,255,.2);}.fg-pg i.ic{width:22px;height:22px;border-radius:0;box-shadow:none;margin:0;}.fg-pg small{color:#c4a688;font-size:10px;}.fg-pg.on{border-color:#ffb878;background:rgba(255,160,90,.14);color:#ffe0c0;}'
    + '.fg-b.meule{flex:1 1 40%;min-height:64px;font-size:22px;}'
    + '.fg-mat.dose{background:rgba(120,90,160,.12);box-shadow:inset 3px 0 0 #7a5aa8;}'
    + '.fg-vue{display:flex;flex-direction:column;align-items:center;gap:6px;}.fg-gd{display:none;}'
    // (§176) au téléphone : la fenêtre prend l'écran, l'en-tête reste en haut, le reste défile ; les plans en bandeau
    + '@media (max-width:640px),(max-height:500px){#forge-ui{left:0;top:0;right:0;bottom:0;transform:none;width:auto;height:auto;max-height:none;border-radius:0;border:0;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box;background-color:#21150f;'
    + 'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);}'
    + '#forge-ui .cu-tete{flex:none;padding:6px 10px;gap:8px;}#forge-ui .cu-x{width:40px;height:36px;flex:none;}.fg-ong button{padding:7px 11px;}'
    + '.fg-corps,.fg-autre{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;}'
    + '.fg-b{min-height:44px;}.fg-b.mini{min-width:42px;min-height:38px;font-size:16px;}.fg-mat{padding:4px 6px;}'
    + '.fg-g{flex:none;flex-direction:row;flex-wrap:nowrap;overflow-x:auto;gap:6px;scrollbar-width:none;padding:1px 1px 3px;}.fg-g::-webkit-scrollbar{display:none;}.fg-g .fg-h,.fg-g .fg-note{display:none;}'
    + '.fg-g .fg-p{flex:0 0 auto;width:76px;flex-direction:column;gap:3px;padding:6px 4px;text-align:center;font-size:11px;line-height:1.15;}.fg-g .fg-p small{display:none;}.fg-g .fg-p .ic{width:30px;height:30px;}'
    + '.fg-gd{display:block;font-size:12px;line-height:1.35;color:#d8c4aa;}.fg-gd b{color:#ffcf9a;}'
    + '.fg-corps.fg-travail .fg-g,.fg-corps.fg-travail .fg-gd{display:none;}'
    + '.fg-corps:not(.fg-travail) .fg-d>.fg-h:first-child,.fg-corps:not(.fg-travail) .fg-d>.fg-h:first-child+.fg-note{display:none;}}'
    // debout : une colonne (le bandeau, la description, la pièce, les gestes, la recette) ; l'en-tête sur trois lignes
    + '@media (max-width:640px){#forge-ui .cu-tete{flex-wrap:wrap;row-gap:6px;}#forge-ui .cu-x{order:1;margin-left:auto;}'
    + '.fg-ong{order:2;flex:1 1 100%;margin-left:0;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;}.fg-ong::-webkit-scrollbar{display:none;}.fg-ong button{flex:1 0 auto;}'
    + '#forge-ui .fg-res{order:3;flex:1 1 100%;margin-left:0;justify-content:space-between;gap:4px;font-size:11.5px;}'
    + '.fg-corps{display:flex;flex-direction:column;flex-wrap:nowrap;gap:8px;padding:8px 10px;align-items:stretch;}'
    + '.fg-m{width:100%;margin:0;}.fg-vue{width:100%;}.fg-m canvas{width:100%;max-width:440px;height:auto;aspect-ratio:3/2;}'
    + '.fg-jauge,.fg-jt,.fg-ctl,.fg-ings{width:100%;max-width:440px;}.fg-d{flex:none;min-width:0;}.fg-ings{max-height:none;}}'
    // couché : la pièce à gauche (elle reste en vue), tout le reste à droite, qui défile
    + '@media (max-height:500px) and (min-width:641px){.fg-corps{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:repeat(5,max-content) 1fr;column-gap:12px;row-gap:6px;padding:8px 10px;align-items:start;}'
    + '.fg-m{display:contents;}.fg-vue{grid-column:1;grid-row:1/7;position:sticky;top:0;}.fg-vue canvas{height:calc(100dvh - 118px);max-height:300px;min-height:150px;width:auto;aspect-ratio:3/2;}'
    + '.fg-jauge,.fg-jt{width:100%;}.fg-g{grid-column:2;grid-row:1;min-width:0;}.fg-gd{grid-column:2;grid-row:2;}.fg-ctl{grid-column:2;grid-row:3;width:100%;justify-content:flex-start;}'
    + '.fg-msg{grid-column:2;grid-row:4;text-align:left;}.fg-d{grid-column:2;grid-row:5;min-width:0;}.fg-ings{width:100%;max-height:none;}}';
  document.head.appendChild(st);
}
// (§176) les gestes qui partent au toucher (le soufflet, la meule, le tempo du marteau, la couleur, la charge) ; les autres au clic
const FG_TEMPO = /^(souffle|gauche|droite|frapper|plier|retirer|plonger|enclume|aufeu|c[+-]:)/;
const fgTel = () => typeof matchMedia === 'function' && matchMedia('(max-width:640px), (max-height:500px)').matches;
function basculerForge() { if (fgOuverte()) fermerForge(); else ouvrirForge(); }
function ouvrirForge() {
  if (!fgPres(3)) return;
  if (typeof cuStyle === 'function') cuStyle(); if (typeof alStyle === 'function') alStyle(); fgStyle(); if (typeof feuilleIcones === 'function') feuilleIcones();
  if (typeof sacOuvert !== 'undefined' && sacOuvert) ouvrirSac(false);
  if (typeof alOuverte === 'function' && alOuverte()) fermerAlchimie();
  if (!FG.el) {
    const el = FG.el = document.createElement('div'); el.id = 'forge-ui'; el.className = 'ui'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'La forge');
    el.innerHTML = `<div class="cu-tete">${img('forge')}<b>Forge</b><span class="fg-niv"></span><span class="fg-ong"></span><span class="cu-res fg-res"></span><button class="cu-x" data-fg="x" aria-label="Fermer">✕</button></div>`
      + `<div class="fg-corps"><div class="fg-g"></div><div class="fg-gd"></div><div class="fg-m"><div class="fg-vue"><canvas width="${FG_W}" height="${FG_H}" aria-hidden="true"></canvas><div class="fg-jauge"></div><div class="fg-jt"></div></div><div class="fg-ctl"></div><div class="fg-msg"></div></div><div class="fg-d"></div></div><div class="fg-autre"></div>`;
    el.addEventListener('pointerdown', e => { e.stopPropagation(); if (e.button > 0) return; const b = e.target.closest('[data-fg]'); if (!b || b.disabled) return; if (b.tagName !== 'INPUT') e.preventDefault(); if (FG_TEMPO.test(b.dataset.fg)) fgGeste(b.dataset.fg, true); });
    el.addEventListener('input', e => { if (e.target.classList.contains('fg-grave') && FG.en) FG.en.grave = String(e.target.value || '').slice(0, 24); });
    el.addEventListener('click', e => { const b = e.target.closest('[data-fg]'); if (!b || b.disabled || FG_TEMPO.test(b.dataset.fg) || b.tagName === 'INPUT') return; fgGeste(b.dataset.fg, true); });   // (§176) au clic : un doigt qui fait défiler ne choisit rien
    addEventListener('pointerup', () => { FG.souffle = FG.gauche = FG.droite = false; });
    addEventListener('pointercancel', () => { FG.souffle = FG.gauche = FG.droite = false; });
    document.body.appendChild(el);
    FG.cv = el.querySelector('canvas'); FG.cx = FG.cv.getContext('2d'); FG.cx.imageSmoothingEnabled = false;
  }
  FG.el.hidden = false; FG.h = {}; FG.ui = { etin: [], vap: [] }; FG.tt = fgNow();
  if (!FG.ch || FG.ch.length < FG_MAT.length) FG.ch = FG_MAT.map((M, k) => (FG.ch && FG.ch[k]) || 0);
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
  if (g.startsWith('pg:')) { if (E && E.etape === 'monture') { const i = +g.slice(3) | 0; E.pig = i && fgPigDispo(i) > 0 ? i : 0; if (E.pig) fgDire('teintée ' + fgDe(fgPigNom(FG_PIG[E.pig])) + ' · le pigment part dans l\'arme', 2); } return rendreForge(); }
  if (g.startsWith('don:')) return fgDonner(g.slice(4));
  if (g === 'lire') { const inp = FG.el.querySelector('.fg-code input'), c = fgCodeLu(inp && inp.value); if (!c || !fgDecode(c)) { fgDire('ce code ne se lit pas : FG- suivi de treize signes', 2.6); return rendreForge(); }
    FG.fiche = { code: c }; fgEtat(); if (!P.forgeLu[c]) P.forgeLu[c] = []; Sauve.sale = true; return rendreForge(); }
  if (g.startsWith('dech:')) return fgDechiffrer(g.slice(5));
  if (g === 'copier') { const c = FG.fiche && fgCodeAffiche(FG.fiche.code); try { navigator.clipboard.writeText(c); fgDire('code copié · ' + c, 2.4); } catch (e) { fgDire(c, 4); } return rendreForge(); }
  if (g.startsWith('p:')) { if (E) { fgDire('une pièce est en cours : finissez-la, ou abandonnez-la', 2.4); return rendreForge(); } const i = +g.slice(2); if (FG_TYPES[i] && fgConnu(FG_TYPES[i])) FG.choix = i; return rendreForge(); }
  if (g.startsWith('c+:') || g.startsWith('c-:')) { if (E) return; const k = +g.slice(3), tot = fgTot(FG.ch); if (!FG_MAT[k]) return;
    if (g[1] === '+') { if (FG_MAT[k].dose) { const vy = FG_MAT[k].id === 'ichor', autre = FG_MAT.findIndex(M => M.dose && M !== FG_MAT[k]);
        if (FG.ch[k] >= 1) fgDire('une dose de ' + FG_MAT[k].n + ', pas plus', 1.6);
        else if (autre >= 0 && FG.ch[autre]) fgDire('le Korlaz et le Vyrel ne se mêlent pas : l\'un ou l\'autre', 2.2);   // (§184)
        else { FG.ch[k] = 1; fgDire(vy ? 'l\'arme contaminera ce qu\'elle touche' : fgDistanceT(FG_TYPES[FG.choix]) ? 'une ombre logera dans l\'arme' : 'la lame griffera, même de loin', 1.8); } } else if (tot >= 4) fgDire('quatre portions au plus', 1.6); else FG.ch[k]++; }
    else if (FG.ch[k] > 0) FG.ch[k]--; return rendreForge(); }
  if (g === 'abandon') { if (!E) return; if (!(FG.abandon > now)) { FG.abandon = now + 3; fgDire('abandonner ? appuyez encore : la pièce est perdue', 3); return rendreForge(); }
    FG.en = null; FG.abandon = 0; fgDire('la pièce part au rebut', 2); return rendreForge(); }
  if (g === 'aufeu') {
    if (!E) {                                                   // la charge : on paie, la pièce naît au feu
      const tot = fgTot(FG.ch);
      if (tot < 2) { fgDire('au moins deux portions', 1.8); return rendreForge(); }
      if (!fgChargeOk(FG.ch)) { fgDire('il manque de quoi charger le creuset', 2); return rendreForge(); }
      if (!essai) { payer(fgCoutCharge(FG.ch)); if (FG.ch[4]) oterIngr('ferdamne', FG.ch[4]); }
      FG.en = { type: FG.choix, ch: FG.ch.slice(), temp: .15, feu: true, etape: 'chauffe', coups: 0, plis: 0, ame: [], bain: -1, plonge: false, trempeT: 0, mont: -1,
        pen: { chauffe: 0, frappe: 0, plis: 0, ame: 0, trempe: 0, affut: 0 }, def: {}, bat0: now, chauffeFaite: false, aff: fgAffNeuf() };
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
    E.plonge = false; E.etape = 'affut'; E.aff = fgAffNeuf(); SON.jouer('ramasse'); fgDire('à la meule : gardez la lame dans le vert, contre la meule qui la tire', 3.2);
    fgDire('l\'affûtage : gardez l\'angle dans la bande (◀ ▶), cinq secondes', 3); return rendreForge();
  }
  if (g.startsWith('m:')) { if (E.etape !== 'monture') return; const i = +g.slice(2); if (!fgMontOk(i)) { fgDire('il manque ' + FG_MONT[i].nb + ' ' + (PLURIEL[FG_MONT[i].res] || FG_MONT[i].res), 1.8); return rendreForge(); } E.mont = i; return rendreForge(); }
  if (g === 'finir') return fgFinir();
  rendreForge();
}
// (§177) à la monture : un pigment de l'Achromie, ou rien
function fgPigChoix(E) {
  const L = FG_PIG.map((g, i) => [g, i]).filter(([g, i]) => g && fgPigDispo(i) > 0);
  if (!L.length) return '<div class="fg-note" style="width:100%">Aucun pigment : l\'Achromie en donne un par île rendue à ses couleurs. Posé ici, il donne à l\'arme son aura et sa traînée.</div>';
  const pc = g => g.rgb ? 'rgb(' + g.rgb.join(',') + ')' : 'linear-gradient(135deg,#e04848,#d8b030,#40a060,#4868e0)';
  return `<div class="fg-h" style="width:100%">Le pigment · l'aura et la traînée</div><div class="fg-pigs"><button class="fg-pg${E.pig ? '' : ' on'}" data-fg="pg:0"><i style="background:rgba(255,255,255,.08)"></i>sans</button>`
    + L.map(([g, i]) => `<button class="fg-pg${E.pig === i ? ' on' : ''}" data-fg="pg:${i}" title="${ESC(fgPigNom(g))}">${typeof icPigment === 'function' ? img(icPigment(g.k)) : `<i style="background:${pc(g)}"></i>`}${ESC(fgPigNom(g))}${essai ? '' : '<small>' + fgPigDispo(i) + '</small>'}</button>`).join('') + '</div>';
}
// (§177) L'AFFÛTAGE, revu. Avant : une dérive minuscule et une commande qui accélérait sans freiner, si bien que ne rien
// toucher valait mieux qu'agir. Maintenant la meule tire la lame d'un côté puis de l'autre (une dérive qui change, à peine
// plus faible que la main) ; ◀ ▶ la poussent tout de suite, et elle s'arrête quand on lâche. Le fil ne se fait que dans le
// vert : il faut y tenir 2,6 s en tout (8 s au plus). Hors du vert, la faute compte, d'autant plus qu'on s'en éloigne.
const fgAffNeuf = () => ({ a: 0, v: 0, t: 0, hors: 0, fil: 0, ph: Math.random() * 6.28 });
const fgAffZone = () => .2 * fgTol();
function fgAffMaj(E, dt) {
  const A = E.aff, z = fgAffZone();
  if (A.fil === undefined) Object.assign(A, fgAffNeuf(), { a: A.a || 0 });
  const tire = .62 * Math.sin(A.t * 1.25 + A.ph) + .34 * Math.sin(A.t * 2.7 + A.ph * 1.7), main = (FG.droite ? 1 : 0) - (FG.gauche ? 1 : 0);
  A.v += (tire + main * 1.4 - A.v) * Math.min(1, dt * 9);
  A.a += A.v * dt; if (Math.abs(A.a) >= 1) { A.a = Math.sign(A.a); A.v = 0; }
  A.t += dt;
  const ec = Math.abs(A.a);
  if (ec <= z) { A.fil += dt / 2.6; if (Math.random() < dt * 30) fgEtincelles(1, .9); }
  else { A.hors += dt * (.6 + 1.6 * (ec - z) / (1 - z)); if (Math.random() < dt * 14) fgEtincelles(1, .2); }
  if (A.fil >= 1 || A.t >= 8) {
    E.pen.affut += Math.min(18, A.hors * 6 + (1 - Math.min(1, A.fil)) * 14); E.etape = 'monture';
    if (A.hors > .8 || A.fil < 1) fgDefaut(E, 'affut', A.fil < 1 ? 'le fil inachevé' : 'affûtée de travers');
    fgDire(A.fil >= 1 ? 'le fil est fait · la monture : le manche, la garde, le pigment' : 'le temps de la meule est passé · la monture', 2.6); rendreForge();
  }
}
const fgRecette = E => ({ type: E.type, ch: E.ch, coups: Math.max(6, Math.min(21, E.coups)), plis: Math.min(5, E.plis), bain: Math.max(0, E.bain), mont: Math.max(0, E.mont), ame: E.ame.slice(0, 3), pig: E.pig | 0 });
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
    if (E.etape === 'affut') fgAffMaj(E, dt);
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
      const A = E.aff, z = fgAffZone();
      R(20, 8, 128, 6, '#2c2c34'); R(84 - 64 * z, 8, 128 * z, 6, Math.abs(A.a) <= z ? '#4f9a4a' : '#3c6a3c'); R(84 + A.a * 64 - 1, 5, 3, 12, '#fff');
      R(20, 16, 128, 2, '#2c2c34'); R(20, 16, 128 * Math.min(1, A.fil), 2, '#ffd27d');
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
  if (E.etape === 'affut') {                                         // (§177) la meule : la lame, la bande verte, le fil qui se fait
    const A = E.aff, z = fgAffZone(), dans = Math.abs(A.a) <= z;
    h = `<u style="left:${(50 - 50 * z).toFixed(1)}%;width:${(100 * z).toFixed(1)}%;border-color:${dans ? '#b8f0a0' : '#ffe9b0'}"></u><i style="left:${(50 + 50 * A.a).toFixed(1)}%"></i>`;
    tx = `<span>le fil · ${Math.round(Math.min(1, A.fil) * 100)} %</span><span>${dans ? 'tenez-la dans le vert' : A.a < 0 ? 'elle part à gauche : ▶' : 'elle part à droite : ◀'}</span>`;
    J.style.background = 'linear-gradient(90deg,#4a2420,#6a4a3a 32%,#3e6a3a 44%,#4e8a46 50%,#3e6a3a 56%,#6a4a3a 68%,#4a2420)';
  } else if (E.plonge || (E.etape === 'trempe' && E.bain >= 0)) {
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
  pose('.fg-res', FG_ORDRE.map(k => [FG_MAT[k], k]).map(([M, k]) => `<span>${img(M.ingr ? icIngr(M.id) : M.id)}${fgDispoMat(k)}</span>`).join(''));
  const forger = FG.vue === 'forger';
  el.querySelector('.fg-corps').style.display = forger ? '' : 'none'; el.querySelector('.fg-autre').style.display = forger ? 'none' : '';
  if (!forger) { pose('.fg-autre', fgAutre() + `<div class="fg-msg">${now < FG.msgT ? ESC(FG.msg) : ''}</div>`); return; }
  const ti = E ? E.type : FG.choix, T = FG_TYPES[ti];
  el.querySelector('.fg-corps').classList.toggle('fg-travail', !!E);
  pose('.fg-gd', E ? '' : `<b>${ESC(T.n)}</b> · ${ESC(T.meca)}`);
  const venir = FG_TYPES.filter(x => !fgDispo(x)), cache = FG_TYPES.filter(x => fgDispo(x) && !fgConnu(x));
  pose('.fg-g', `<div class="fg-h">Les plans</div>` + FG_TYPES.map((x, i) => fgConnu(x) ? `<button class="fg-p${i === ti ? ' on' : ''}" data-fg="p:${i}"${E && i !== ti ? ' disabled' : ''}>${img('fgt_' + x.id)}<span><b>${x.n}</b><small>${ESC(x.meca)}</small></span></button>` : '').join('')
    + (cache.length ? `<div class="fg-h">À trouver</div>` + cache.map(x => `<button class="fg-p" disabled>${img('fgt_' + x.id)}<span><b>${x.n}</b><small>plan à trouver : coffres du Centre et des Cercles</small></span></button>`).join('') : '')
    + (venir.length ? `<div class="fg-note">${venir.length} plans viendront : ${venir.map(x => x.n.toLowerCase()).join(', ')}.</div>` : ''));
  if (FG.gVu !== ti && fgTel()) { const g = el.querySelector('.fg-g'), b = g.querySelector('.fg-p.on'); if (b && g.clientWidth) { FG.gVu = ti; g.scrollLeft = b.offsetLeft - g.offsetLeft - (g.clientWidth - b.offsetWidth) / 2; } }   // (§176) le plan choisi, au milieu du bandeau
  // au milieu : ce qu'on peut faire, à cet instant
  const B = (g, t, sous, cl = '', dis = false) => `<button class="fg-b ${cl}" data-fg="${g}"${dis ? ' disabled' : ''}>${t}${sous ? `<small>${sous}</small>` : ''}</button>`;
  let ctl = '';
  if (!E) {
    const tot = fgTot(FG.ch), cout = fgCoutCharge(FG.ch);
    ctl = FG_ORDRE.map(k => [FG_MAT[k], k]).map(([M, k]) => `<div class="fg-mat${M.dose ? ' dose' : ''}">${img(M.ingr ? icIngr(M.id) : M.id)}<span>${M.n} <small>· ${M.dose ? M.id === 'ichor' ? M.q + ' ichors la dose · une au plus · pas avec le Korlaz · ' + (fgDistanceT(FG_TYPES[FG.choix]) ? 'une flaque de miasme là où elle touche' : 'elle contamine ce qu\'elle frappe') : M.q + ' spores la dose · une au plus · ' + (fgDistanceT(FG_TYPES[FG.choix]) ? 'une ombre qui se bat' : 'des griffes, même de loin') : M.q + ' par portion'} · ${fgDispoMat(k)} en réserve</small></span>${B('c-:' + k, '−', '', 'mini')}<em>${FG.ch[k]}</em>${B('c+:' + k, '+', '', 'mini')}</div>`).join('')
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
  else if (E.etape === 'affut') ctl = B('gauche', '◀', 'maintenir · ←', 'meule') + B('droite', '▶', 'maintenir · →', 'meule');
  else if (E.etape === 'monture') ctl = FG_MONT.map((m, i) => B('m:' + i, m.n.toUpperCase(), m.nb + ' ' + (PLURIEL[m.res] || m.res), E.mont === i ? 'prim' : '', !fgMontOk(i))).join('')
    + fgPigChoix(E)
    + (n >= 3 ? `<input class="fg-grave" maxlength="24" placeholder="gravure : un nom (facultatif)" value="${ESC(E.grave || '')}" style="width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(220,190,150,.3);border-radius:8px;color:#fff0dc;padding:6px 8px;font:inherit">` : '')
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
    + li('monture', 'Monture', E && io >= 7 ? (E.mont >= 0 ? FG_MONT[E.mont].n : 'à choisir') + (E.pig && FG_PIG[E.pig] ? ' · ' + ESC(fgPigNom(FG_PIG[E.pig])) : '') : '<small>le manche, le pigment</small>') + `</ul>`
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
  L.push('un autre bain change la forme (l\'eau : sur le coup ; l\'huile : au sol ; le sang : sur soi ; le nectar : en trait ; la neige : en aura ; le soufre : sur le coup, avec le feu en plus)');
  if (R.ame.length > 1) L.push('l\'âme dans un autre ordre : une autre arme, d\'autres dosages');
  L.push('l\'âme versée sous le vert ne prend pas');
  if (R.ch[2]) L.push('l\'os brûle vite : pas au-delà de ' + fgCouleurNom(fgCible(R) + .12));
  if (R.ch[4]) L.push('le fer damné veut une chauffe plus haute, et une trempe plus longue');
  return L.join(' · ');
}
// (§183) l'appui long au sac : tout ce que dit une arme forgée (la compétence se lit si on l'a forgée, ou déchiffrée)
function fgInfoL(id) {
  const Lr = fgLireId(id); if (!Lr) return null; fgEtat();
  const { R, j, code } = Lr, T = FG_TYPES[R.type], S = fgStats(R, j), C = fgAme(R), I = P.forge[id] || null, o = objet(id), L = [];
  const voit = (k, nv) => !!(P.forgeCarnet[code] && P.forgeCarnet[code].f) || FG_NIV() >= nv || (P.forgeLu[code] || []).includes(k);
  if (T.magie && T.id !== 'lamerunique') L.push(['Les sorts', '×' + nombre(fgSortK(id))]);
  else if (T.magie) L.push(['Les sorts', '×' + nombre(fgFocale(o, T))]);
  L.push(['Compétence', voit('comp', 3) ? fgCompTxt(C) : 'illisible : à déchiffrer, à la forge', 1]);
  if (R.ch[5]) L.push(['Korlaz', fgDistanceT(T) ? 'une ombre vous suit et se bat à vos côtés, l\'arme en main' : 'chaque coup griffe la cible de trois lacérations noires, même de loin', 1]);
  if (R.ch[6]) L.push(['Vyrel', 'la cible s\'affaiblit et ralentit six secondes ; morte, elle éclate et contamine ses voisines' + (fgDistanceT(T) ? ' ; tirée, une flaque de miasme' : ''), 1]);   // (§184)
  if (R.pig && FG_PIG[R.pig]) L.push(['Aura', fgPigNom(FG_PIG[R.pig])]);
  const u = I ? Math.min(1, I.u / S.usure) : 0;
  L.push(['Usure', Math.round(u * 100) + ' %' + (u >= 1 ? ' : émoussée, à réparer' : '')], ['Facture', j + ' %' + (j >= 97 ? ', parfaite' : '')]);
  if (I && I.f) L.push(['Forgée par', I.f]);
  return { p: T.n + ' · ' + T.meca + '.', l: L };
}
// (§183) ce qu'une arme magique fait d'un sort lancé par elle (la baguette : plus vite, plus léger)
function fgSortK(id) { const Lr = fgLireId(id), T = Lr && FG_TYPES[Lr.R.type]; if (!T || !T.magie || T.id === 'lamerunique') return 0; const k = fgFocale(objet(id), T); return Math.round((T.id === 'baguette' ? .55 * k : k) * 100) / 100; }
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
    ['trempe', 'Trempe', FG_BAINS[R.bain].n + ', ' + fgTrempe(R) + ' s (±' + fgTol() + ')', 2], ['monture', 'Monture', FG_MONT[R.mont].n + (R.pig && FG_PIG[R.pig] ? ' · teintée ' + fgDe(fgPigNom(FG_PIG[R.pig])) : ''), 1],
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
  if (E.pig && fgPigDispo(E.pig) <= 0) E.pig = 0;
  if (!essai) { payer({ [FG_MONT[E.mont].res]: FG_MONT[E.mont].nb }); if (E.pig) { const k = FG_PIG[E.pig].k; P.pigments[k] = (P.pigments[k] | 0) - 1; if (P.pigments[k] <= 0) delete P.pigments[k]; } }
  const R = fgRecette(E), code = fgEncode(R), j = fgJustesse(E), id = fgIdDe(code, j), C = fgAme(R), S = fgStats(R, j);
  const gr = FG_NIV() >= 3 ? String((FG.el.querySelector('.fg-grave') || {}).value || E.grave || '').replace(/[<>]/g, '').trim().slice(0, 24) : '';
  fgEtat(); const deja = !!P.objets[id], av = P.forge[id];
  P.objets[id] = 1; P.forge[id] = { u: 0, f: typeof pseudo === 'function' ? String(pseudo()).slice(0, 18) : '', n: gr || (deja && av && av.n) || '' };
  const O = objet(id); if (O) O.n = P.forge[id].n || fgNom(R).split(' · ')[0];
  const cn = P.forgeCarnet[code] || (P.forgeCarnet[code] = { n: 0, j: 0, nom: '' }); cn.n++; cn.j = Math.max(cn.j, j); cn.nom = fgNom(R); cn.f = 1;
  if (typeof rangerRaccourci === 'function') rangerRaccourci(id);
  const defs = Object.entries(E.def);
  FG.en = null; FG.ch = FG_MAT.map(() => 0); Sauve.sale = true; if (typeof majSac === 'function') majSac();
  SON.jouer(j >= 97 ? 'rare' : 'niveau');
  const L = fgLieu0(); if (L) burst(L.x, L.y, L.z + 1, j >= 97 ? 60 : 30, j >= 97 ? '#ffd27d' : '#ffb060');
  if (typeof montrerBilan === 'function') montrerBilan(`<div class="ab-fiole">${img(id)}</div><div class="ab-v">${j >= 97 ? '★ Chef-d\'œuvre' : 'Arme forgée'}</div>`
    + `<div class="ab-n">${ESC(O ? O.n : '')} · ${ESC(fgNom(R).split(' · ')[1])}</div><div class="ab-j"><i style="width:${j}%"></i></div>`
    + `<div class="ab-s">justesse ${j} % · dégâts ${O ? Math.round(O.deg * 100) : '?'} · tient ${S.usure} coups avant de s'émousser</div>`
    + (defs.length ? `<div class="ab-g">${defs.map(([m, k]) => `<span class="ab-p mal"><b>✗</b>${ESC(m)}${k > 1 ? ' ×' + k : ''}</span>`).join('')}</div>` : `<div class="ab-g"><span class="ab-p bon"><b>✓</b>chaque geste juste</span></div>`)
    + (R.ch[5] ? `<div class="ab-s">${fgDistanceT(FG_TYPES[R.type]) ? 'une ombre de Korlaz loge dans l\'arme : tenue en main, elle vous suit et se bat à vos côtés' : 'le Korlaz griffe : chaque coup lacère la cible de trois griffes noires, même de loin'}</div>` : '')
    + (R.ch[6] ? `<div class="ab-s">le Vyrel contamine : la bête touchée s'affaiblit et ralentit ; morte, elle éclate et contamine ses voisines${fgDistanceT(FG_TYPES[R.type]) ? ' · tirée, l\'arme laisse une flaque de miasme' : ''}</div>` : '')
    + (R.pig && FG_PIG[R.pig] ? `<div class="ab-s">teintée ${ESC(fgDe(fgPigNom(FG_PIG[R.pig])))} : son aura, sa traînée</div>` : '')
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
  const T = FG_TYPES[L.R.type]; if (L.R.ch[5] && !fgDistanceT(T)) fgGriffe(a);   // (§178) le Korlaz au contact : les griffes
  if (T.magie) return fgMagie(A, a, T); if (!T.lance) return false;
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
    else if (p.k === 'orbe') { if (fgOrbe(p, dt)) FG.projs.splice(i, 1); }
    else if (p.k === 'obus') { if (fgObus(p, dt)) FG.projs.splice(i, 1); }
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
      p.vu.add(b); fgBlesse(b, degJoueur(p.deg, b) * Math.pow(.75, p.n), p.vx * .1, p.vy * .1, p.id, false, p.vx, p.vy); p.n++;
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
// Les projectiles forgés, en tronçons (E(p, a, b, l, h, couleur, luit)) : forgeEmit les dessine sans carte graphique
// (emitFleches), le rendu WebGL les reprend tels quels (§174 : il ne les dessinait pas).
function forgeOs(E) {
  for (const p of FG.projs) {
    if (p.k === 'chak') { const a0 = t * 24; for (let k = 0; k < 8; k++) { const a1 = a0 + k * .785, a2 = a1 + .785; E(p, [p.x + Math.cos(a1) * .2, p.y + Math.sin(a1) * .2, p.z], [p.x + Math.cos(a2) * .2, p.y + Math.sin(a2) * .2, p.z], .05, .035, k & 1 ? p.c : p.cf); } }
    else if (p.k === 'jav') { const u = p.u || [1, 0, 0], q = p.etat === 'sol' || p.etat === 'bete' ? .25 : 0, at = k => [p.x + u[0] * (k + q), p.y + u[1] * (k + q), p.z + u[2] * (k + q)];
      E(p, at(-.85), at(-.1), .045, .045, p.cm); E(p, at(-.12), at(.05), .07, .03, p.c); E(p, at(.02), at(.08), .035, .025, p.cf); }
    else if (p.k === 'orbe') { const r = p.etat === 'part' ? .15 : .12 + .015 * Math.sin(t * 6 + p.a0);   // la sphère, son cœur blanc, sa seconde matière
      E(p, [p.x - r * .5, p.y, p.z], [p.x + r * .5, p.y, p.z], r, r, p.c, 1);
      if (p.c2) E(p, [p.x, p.y - r * .35, p.z + r * .3], [p.x, p.y + r * .35, p.z + r * .3], r * .5, r * .5, p.c2, 1);
      E(p, [p.x - r * .2, p.y, p.z], [p.x + r * .2, p.y, p.z], r * .45, r * .45, [255, 250, 236], 1); }
    else if (p.k === 'obus') { const v = Math.hypot(p.vx, p.vy, p.vz) || 1, u = [p.vx / v, p.vy / v, p.vz / v];   // l'obus, sa mèche, et le cercle où il tombera
      E(p, [p.x - u[0] * .12, p.y - u[1] * .12, p.z - u[2] * .12], [p.x + u[0] * .12, p.y + u[1] * .12, p.z + u[2] * .12], .2, .2, [52, 48, 44]);
      E(p, [p.x - u[0] * .12, p.y - u[1] * .12, p.z - u[2] * .12], [p.x - u[0] * .2, p.y - u[1] * .2, p.z - u[2] * .2], .05, .05, [255, 200, 90], 1);
      if (p.cx !== undefined) { const k = Math.min(1, p.age / (p.vol || 1)), R = p.R * (.92 + .08 * Math.sin(t * (10 + 14 * k)));
        for (let i = 0; i < 12; i++) { const a0 = i * Math.PI / 6, a1 = a0 + Math.PI / 6;
          E(p, [p.cx + Math.cos(a0) * R, p.cy + Math.sin(a0) * R, p.cz + .05], [p.cx + Math.cos(a1) * R, p.cy + Math.sin(a1) * R, p.cz + .05], .07, .02, [255, 140 - 70 * k, 50], 1); } } }
    else E(p, [p.x - .05, p.y, p.z], [p.x + .05, p.y, p.z], .1, .1, p.c);
  }
  if (FG.ombre && FG.ombre.vie > 0) fgOmbreOs(FG.ombre, E);           // (§177) les ombres de Korlaz
  for (const Q of FG.ombresJ.values()) if (Q.vie > 0) fgOmbreOs(Q, E);
}
function forgeEmit(view, out) {
  let q = null, cle, rang;
  forgeOs((p, a, b, w, h, c, lum) => { if (p !== q) { q = p; cle = view.kEnt && view.kEnt(p.x, p.y); rang = rangSol(p.z, false); } emitLimb(a, b, w, h, c, view, out, cle, rang, lum ? 1 : undefined); });
}
