// Stone Valley — LA FLORE RARE (flore.js)
// Pour chaque biome, douze plantes qu'on ne trouve qu'une à une. Chacune a sa RARETÉ (§117), qui est celle
// de son ingrédient : les trois premières simples sont communes, les trois autres peu communes, les deux
// premières géantes rares, les deux autres exotiques, les deux vives légendaires. L'île tire la rareté
// d'après son niveau d'exploration (voir floreIle) : la force des potions suit la profondeur.
// Leur PORT (`port`) règle la taille et le comportement :
//  simples (six) : l'étoile (les pétales s'ouvrent le jour, se ferment la nuit), les clochettes (un arc
//               d'où pendent des cloches qui luisent), l'éventail (des frondes qui ondulent), la crosse
//               (des spirales qui se déroulent), l'orbe (des lanternes qui flottent au bout des tiges),
//               l'arbuste en fleurs (ses pétales tombent) — et, au champ de cristal, la cristalline ;
//  géantes (quatre) : le colosse (une fleur de quatre mètres qui respire, ses étamines qui luisent), le
//               saule de lumière (de longues chevelures qui ondoient au vent), la méduse (elle flotte
//               et traîne ses filaments), l'arbre-lumière (des fruits lumineux qui tournent) ;
//  vives (deux) : la gueule (deux mâchoires dentées sur une tige en S : elle se cabre, s'ouvre, mord),
//               la fouetteuse (des fouets d'épines qui fouettent), la cracheuse (un bulbe qui gonfle et
//               crache un venin).
// Toutes bougent : le vent, la respiration, le jour et la nuit. ACTION près d'elles : CUEILLIR (la simple
// et la géante repoussent ; la vive, il faut d'abord l'abattre). Les ingrédients rejoignent le
// garde-manger, tous de rareté « rare », et chacun porte un effet.
// Le biome nuage n'existe qu'en îles volantes : ses plantes se posent sur les dalles de nuage.
// Combien (§116) : aucune aux explorations 0 et 1 ; une par île à partir de 2, puis de plus en plus souvent deux.
// Laquelle (§117) : la rareté se tire d'après le niveau de l'île (commune près de chez soi, légendaire au loin).
// Partagées entre les joueurs d'une île (voir LISEZ-MOI, section 58) : la plante cueillie l'est pour tous
// (« fcueille », et l'état de l'île donné au nouveau venu) ; la vive est une bête du gardien de la faune :
// elle attaque le joueur le plus proche, d'ici ou d'en face, et chez les autres n'est qu'une marionnette.
// Abattue, son butin va à qui l'a abattue.
// Le jeu (index.html) appelle floreIle(), majPlante, osPlante, cueillirPlante ; FLORE_SPEC et
// FLORE_PRODUITS sont versés dans SPEC et dans les ingrédients.
const FL_FORMES_R = ['etoile', 'clochettes', 'eventail', 'spirale', 'orbe', 'arbuste'], FL_FORMES_L = ['colosse', 'saule', 'meduse', 'lumiere'];
const FL_PART = { etoile: ['Pétale', 'fleur'], clochettes: ['Clochette', 'fleur'], eventail: ['Fronde', 'feuille'], spirale: ['Crosse', 'feuille'], orbe: ['Orbe', 'fruit'], arbuste: ['Fleur', 'fleur'], cristalline: ['Éclat', 'graine'],
  colosse: ['Cœur', 'douceur'], saule: ['Larme', 'douceur'], meduse: ['Voile', 'champignon'], lumiere: ['Fruit', 'fruit'], gueule: ['Croc', 'racine'], fouetteuse: ['Épine', 'racine'], cracheuse: ['Venin', 'champignon'] };
const FL_TAGS = ['nuit', 'braise', 'vif', 'fort', 'robuste', 'souffle'];
// [biome, palette (tige, feuille, pétale, cœur, pointe), six simples | quatre géantes | deux vives]
const FL_BIOMES = [
  [1, [[96, 120, 110], [70, 150, 150], [236, 246, 250], [120, 220, 255], [255, 150, 140]], "Lys d'écume|Clochette des marées|Fougère-houle|Crosse de sel|Perle-de-dune|Corail fleuri|Rose des abysses|Saule d'embruns|Méduse des grèves|Arbre-nacre|Gueule des récifs|Cracheuse d'écume"],
  [2, [[96, 140, 60], [110, 170, 70], [255, 206, 90], [255, 240, 160], [250, 140, 170]], "Étoile des prés|Clochettes d'aube|Éventail de soie|Crosse dorée|Lanterne de rosée|Pommier nain|Soleil-colosse|Saule de lumière|Voile de pollen|Arbre aux mille fruits|Gueule-de-loup géante|Fouet des herbes"],
  [3, [[80, 64, 44], [52, 112, 60], [180, 120, 230], [255, 220, 120], [240, 240, 255]], "Étoile sylvestre|Muguet-lanterne|Fougère royale|Crosse d'émeraude|Lampion des sous-bois|Aubépine d'argent|Lys-cathédrale|Saule des murmures|Méduse des frondaisons|Chêne d'aurore|Mâchoire des ronces|Fouetteuse sylvestre"],
  [4, [[110, 84, 70], [120, 110, 80], [196, 110, 200], [255, 190, 110], [230, 120, 70]], "Bruyère-étoile|Clochettes de brume|Ajonc-éventail|Crosse de lande|Feu-follet|Genêt d'or|Chardon-roi|Saule des vents|Voile de bruyère|Arbre des tourmentes|Gueule de chardon|Cracheuse des landes"],
  [5, [[130, 110, 80], [130, 150, 100], [140, 200, 255], [255, 236, 170], [255, 170, 90]], "Étoile des à-pics|Clochettes du vertige|Éventail des vents|Crosse des corniches|Orbe des aigles|Pin-fleur|Lys des sommets|Saule suspendu|Méduse des courants|Arbre-nid|Gueule des corniches|Fouet des crêtes"],
  [6, [[110, 110, 110], [90, 140, 130], [250, 214, 110], [140, 255, 230], [255, 255, 255]], "Edelweiss d'or|Clochettes de granit|Lichen-éventail|Crosse de silex|Orbe de quartz|Arbuste-géode|Rose de pierre|Saule de basalte|Voile minéral|Arbre aux géodes|Mâchoire de roc|Cracheuse de gravier"],
  [7, [[150, 170, 190], [180, 210, 230], [246, 250, 255], [160, 230, 255], [200, 170, 255]], "Étoile de givre|Clochettes de neige|Éventail de glace|Crosse gelée|Orbe d'aurore|Sorbier blanc|Lys boréal|Saule de givre|Méduse des aurores|Arbre de neige|Gueule de l'hiver|Fouetteuse de verglas"],
  [9, [[90, 100, 60], [100, 130, 60], [230, 100, 120], [255, 240, 120], [170, 230, 120]], "Rossolis-étoile|Clochettes des tourbes|Fougère des marais|Crosse de sphaigne|Feu des marais|Saule nain|Nénuphar-colosse|Saule des brumes|Méduse des eaux mortes|Arbre-lanterne|Dionée géante|Cracheuse des tourbes"],
  [10, [[150, 90, 50], [130, 140, 80], [240, 110, 60], [255, 220, 140], [80, 220, 210]], "Étoile du canyon|Clochettes d'ocre|Palmier-éventail|Crosse rouge|Orbe de grès|Acacia de feu|Cactus-reine|Saule des gorges|Voile de sable|Arbre-arche|Gueule des sables|Fouet du désert"],
  [11, [[110, 80, 120], [120, 90, 150], [190, 120, 255], [120, 255, 240], [255, 150, 230]], "Étoile mycélienne|Clochettes-spores|Éventail de lamelles|Crosse fongique|Orbe de spores|Arbuste-truffe|Morille-cathédrale|Saule des spores|Méduse de mycélium|Arbre-champignon d'or|Gueule fongique|Cracheuse de spores"],
  [12, [[150, 160, 200], [170, 200, 230], [210, 160, 255], [255, 255, 255], [120, 255, 230]], "Étoile prismatique|Clochettes de verre|Éventail de quartz|Crosse d'améthyste|Orbe-prisme|Arbuste de verre|Lys diamant|Saule de cristal|Méduse prismatique|Arbre-lustre|Mâchoire de verre|Fouet d'éclats"],
  [13, [[60, 50, 50], [90, 60, 50], [255, 110, 40], [255, 230, 120], [255, 60, 30]], "Étoile de braise|Clochettes de cendre|Éventail de feu|Crosse ardente|Orbe de lave|Arbuste-tison|Lys-volcan|Saule de cendres|Méduse de fumée|Arbre-phénix|Gueule de magma|Cracheuse de feu"],
  [17, [[200, 200, 220], [220, 230, 250], [255, 210, 240], [255, 250, 200], [170, 210, 255]], "Étoile des nues|Clochettes célestes|Éventail d'azur|Crosse de vapeur|Orbe-étoile|Arbuste-nimbe|Lys céleste|Saule des cieux|Méduse des nuages|Arbre-soleil|Gueule des orages|Fouet de foudre"],
  [18, [[130, 90, 50], [140, 130, 60], [240, 170, 60], [255, 230, 140], [200, 120, 60]], "Étoile ambrée|Clochettes de miel|Éventail de résine|Crosse ouvrière|Orbe de miellat|Arbuste-nid|Reine-fleur|Saule de résine|Voile d'essaim|Arbre-ruche|Gueule de l'essaim|Cracheuse d'acide"],
  [19, [[190, 182, 166], [150, 140, 130], [236, 230, 214], [200, 40, 50], [130, 20, 30]], "Étoile d'os|Clochettes funèbres|Éventail de côtes|Crosse vertébrale|Orbe-crâne|Arbuste de deuil|Lys des morts|Saule des pleureuses|Linceul flottant|Arbre-reliquaire|Gueule d'ossements|Fouet de vertèbres"],
  [20, [[40, 40, 60], [50, 60, 90], [90, 210, 255], [200, 255, 255], [160, 100, 255]], "Étoile des fosses|Clochettes abyssales|Éventail des profondeurs|Crosse luisante|Orbe des gouffres|Arbuste-lanterne|Lys des abîmes|Saule des fosses|Méduse des gouffres|Arbre-veine|Gueule des fosses|Cracheuse abyssale"],
  [22, [[90, 120, 60], [100, 150, 70], [220, 60, 80], [255, 236, 120], [255, 255, 255]], "Rose trémière|Campanule|Fougère des jardins|Crosse de vigne|Lanterne de fête|Pommier fleuri|Tournesol-roi|Saule du puits|Voile de glycine|Cerisier millénaire|Gueule du potager|Fouet de ronces"],
  [23, [[96, 70, 66], [150, 186, 120], [255, 182, 208], [255, 236, 160], [255, 250, 252]], "Étoile de sakura|Clochettes de glycine|Éventail d'érable rouge|Crosse de jade|Lampion de pétales|Prunier du Japon|Pivoine-reine|Saule de pétales|Voile de pétales|Arbre aux mille fleurs|Gueule de camélia|Fouet d'églantier"],   // la cerisaie (§112)
  // (§162) le biome 40 n'existe sur aucune île : c'est la flore de l'île démoniaque (brume.js, lieuxEnfer), qui sort de terre
  // au passage de la vague et se fane quand l'île guérit. Ni les nomades ni les îles ordinaires ne l'ont.
  // (§197) l'île volcanique : la cendre, la soufrière, les sources
  [28, [[52, 46, 46], [96, 84, 78], [255, 96, 36], [255, 214, 110], [190, 70, 255]], "Étoile de scorie|Clochettes de lapilli|Éventail de pierre ponce|Crosse fumante|Orbe de magma|Arbuste à lapilli|Lys-cratère|Saule de cendre chaude|Méduse de fumerolle|Arbre-coulée|Gueule de lave|Fouet de scories"],
  [25, [[150, 130, 50], [200, 180, 60], [250, 236, 90], [255, 255, 190], [140, 230, 90]], "Étoile jaune|Clochettes sulfureuses|Éventail de cristaux|Crosse acide|Orbe de vapeur jaune|Arbuste à aiguilles|Lys de soufre|Saule acide|Méduse sulfureuse|Arbre-fumerolle|Gueule acide|Cracheuse de soufre"],
  [31, [[200, 186, 160], [120, 180, 150], [110, 220, 210], [240, 250, 230], [255, 170, 90]], "Étoile des sources|Clochettes de vapeur|Éventail de travertin|Crosse thermale|Orbe de geyser|Arbuste-concrétion|Lys des bains|Saule de vapeur|Méduse thermale|Arbre-fontaine|Gueule bouillante|Cracheuse de geyser"],
  [40, [[42, 24, 22], [72, 30, 28], [214, 42, 30], [255, 172, 52], [255, 92, 30]], "Étoile du Malin|Clochettes de soufre|Éventail d'obsidienne|Crosse de braise|Orbe-brasier|Ronce ardente|Lys de l'abîme|Saule des damnés|Voile de soufre|Arbre-cendre|Gueule de l'enfer|Fouet d'obsidienne"],
];
const FLORE_RARES = [], FLORE_PRODUITS = [];
const FL_TIER = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5];
const FL_RANG = ['', 'commune', 'peu commune', 'rare', 'exotique', 'légendaire'];
const flElide = s => { const m = s.charAt(0).toLowerCase() + s.slice(1); return (/^[aeiouyéèêàâîôûœh]/i.test(m) ? "d'" : 'de ') + m; };
for (const [bio, pal, noms] of FL_BIOMES) {
  noms.split('|').forEach((n, i) => {
    const port = i < 6 ? 'simple' : i < 10 ? 'geante' : 'vive';   // sa stature et sa conduite
    const r = FL_TIER[i];                                           // sa rareté (§117), de 1 commune à 5 légendaire
    let forme = port === 'simple' ? FL_FORMES_R[i] : port === 'geante' ? FL_FORMES_L[i - 6] : i === 10 ? 'gueule' : /^Fouet/.test(n) ? 'fouetteuse' : 'cracheuse';
    if (bio === 12 && forme === 'etoile') forme = 'cristalline';
    const id = 'fl' + bio + '_' + i, [part, fam] = FL_PART[forme], tag = FL_TAGS[(bio + i) % FL_TAGS.length];
    FLORE_RARES.push({ id, n, bio, r, rang: FL_RANG[r], port, forme, pal, ingr: 'p_' + id });
    const dejaNomme = n.toLowerCase().startsWith(part.toLowerCase()), ni = dejaNomme ? n : part + ' ' + flElide(n);   // « Orbe des aigles », pas « Orbe d'orbe des aigles »
    const court = n.charAt(0).toLowerCase() + n.slice(1);    // sous l'icône et dans le nom des plats : la plante, sans la partie
    FLORE_PRODUITS.push([id, ni, court, fam, r, tag, pal[2].slice()]);
  });
}
const FLORE_SPEC = [
  { id: 'plante_r', n: 'Plante rare', plante: 1, batiment: 1, diet: 'p', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999, shell: [120, 170, 90], dark: [70, 100, 60], leg: [80, 110, 60], oeil: [255, 240, 160], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: '', grimpe: 0 },
  { id: 'plante_l', n: 'Grande plante rare', plante: 1, batiment: 1, diet: 'p', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999, shell: [120, 170, 90], dark: [70, 100, 60], leg: [80, 110, 60], oeil: [255, 240, 160], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: '', grimpe: 0 },
  { id: 'plante_e', n: 'Plante rare vive', plante: 1, epique: 1, diet: 'p', sz: 1.4, spd: 0, vue: 9, peur: 0, herd: 0, cap: 0, mat: 9999, shell: [120, 60, 70], dark: [70, 30, 40], leg: [80, 60, 50], oeil: [255, 80, 60], bio: [], dur: 3, lien: 0, chasse: [], travail: {}, metier: '', grimpe: 0 },
];
// ---------- l'île : quelques plantes, une à une, sur leur biome ----------
function floreIle() {
  let s = (SEED ^ 0xf10e5) >>> 0 || 1; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const cases = new Map(); for (let i = 0; i < WS * WS; i++) { const b = Bio[i]; if (!cases.has(b)) cases.set(b, []); cases.get(b).push(i); }
  const libre = (i, R) => { const x = i % WS, y = (i / WS) | 0, h = Hgt[i]; if (x < 4 || y < 4 || x > WS - 5 || y > WS - 5 || h <= SEA || PlT[i] || Eau[i] > Hgt[i]) return false;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const j = i + dy * WS + dx; if (Math.abs(Hgt[j] - h) > 1 || Eau[j] > Hgt[j]) return false; }
    if (PortailIle && Math.hypot(PortailIle.x - x, PortailIle.y - y) < 5) return false;
    if (typeof VL !== 'undefined' && VL.ici && Math.hypot(VL.centre[0] - x, VL.centre[1] - y) < 10) return false;
    if (Math.hypot(P.x - x, P.y - y) < 6 || beasts.some(b => b.sp.plante && Math.hypot(b.x - x, b.y - y) < 3)) return false;
    return true; };
  // sur une dalle de nuage : une dalle d'un seul tenant sous toute la plante, jamais une dalle conjurée
  const libreDalle = (i, R) => { const x = i % WS, y = (i / WS) | 0, h = PlT[i]; if (!h || x < 4 || y < 4 || x > WS - 5 || y > WS - 5) return false;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const j = i + dy * WS + dx; if (PlT[j] !== h || (typeof dalleConjuree === 'function' && dalleConjuree(j))) return false; }
    if (Math.hypot(P.x - x, P.y - y) < 6 || beasts.some(b => b.sp.plante && Math.hypot(b.x - x, b.y - y) < 3)) return false;
    return true; };
  const poser = (pl, L, R, dalle) => { for (let k = 0; k < 30; k++) { const i = L[r() * L.length | 0]; if (!(dalle ? libreDalle(i, R) : libre(i, R))) continue;
      const x = i % WS + .5, y = ((i / WS) | 0) + .5, sp = specById[pl.port === 'simple' ? 'plante_r' : pl.port === 'geante' ? 'plante_l' : 'plante_e'];
      const b = naitre(sp, x, y); b.age = 1e6; b.ech = pl.port === 'simple' ? 1.3 : 1; b.pv = 1; b.z = dalle ? PlT[i] : sol(x, y); b.pl = pl; b.dir = b.dirT = r() * 6.2832; b.graine = r(); b.etat = 'pousse';
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (Flo[i + dy * WS + dx]) Flo[i + dy * WS + dx] = 0;
      beasts.push(b); return b; } return null; };
  // Combien (§116) : AUCUNE sur les îles d'exploration 0 et 1. À partir de 2, une seule par île, et une seconde de plus
  // en plus souvent en s'enfonçant (15 % de plus par niveau : toujours à partir de 9), sur un autre biome si l'île en a
  // plusieurs.
  // Laquelle (§117) : sa rareté se tire autour d'un rang qui monte d'un demi-cran par niveau — commune à
  // l'exploration 2, peu commune vers 4, rare vers 6, exotique vers 8, et la légendaire de plus en plus souvent
  // au-delà (le centre plafonne à 4,4). Le port suit la rareté : les géantes sont rares ou exotiques, les vives
  // légendaires.
  const niv = profondeur();
  if (niv < 2) return;
  const lieux = [];
  for (const [bio, L] of cases) { const cat = FLORE_RARES.filter(p => p.bio === bio); if (cat.length && L.length >= 60) lieux.push({ cat, L, dalle: false }); }
  // Le nuage n'a pas de sol : il n'existe qu'en îles volantes. Ses plantes se posent sur les dalles (jamais conjurées).
  { const cat = FLORE_RARES.filter(p => p.bio === 17), L = [];
    for (let i = 0; i < WS * WS; i++) if (PlT[i] && !(typeof dalleConjuree === 'function' && dalleConjuree(i))) L.push(i);
    if (cat.length && L.length >= 60) lieux.push({ cat, L, dalle: true }); }
  const poids = [1, 2, 3, 4, 5].map(k => poidsRarete(k, niv, 4.4)), somme = poids.reduce((a, b) => a + b);   // (§118) l'échelle commune (index.html)
  const tirerRang = () => { let u = r() * somme; for (let k = 0; k < 5; k++) if ((u -= poids[k]) < 0) return k + 1; return 5; };
  let reste = 1 + (r() < Math.min(1, (niv - 2) * .15) ? 1 : 0);
  for (let essai = 0; reste > 0 && essai < 6 && lieux.length; essai++) {
    const j = r() * lieux.length | 0, li = lieux[j], rg = tirerRang(), C = li.cat.filter(p => p.r === rg), pl = C[r() * C.length | 0];
    if (pl && poser(pl, li.L, pl.port === 'geante' ? 2 : pl.port === 'vive' ? 1 : 0, li.dalle)) { reste--; if (lieux.length > 1) lieux.splice(j, 1); }
    else lieux.splice(j, 1);
  }
}
// (§124) Une plante rare de l'île du campement cueillie ou abattue : la case s'en souvient (index.html, PL_CUEILLIES).
function plCueillie(b) {
  if (typeof PL_CUEILLIES === 'undefined') return;
  if (coupesG !== SEED) { CAMP_COUPES.clear(); PL_CUEILLIES.clear(); coupesG = SEED; }
  PL_CUEILLIES.add((b.x | 0) + ',' + (b.y | 0)); if (typeof Sauve !== 'undefined') Sauve.sale = true;
}
// ---------- la vie : le vent, la repousse, et la vive qui attaque ----------
function majPlante(b, dt, marionnette) {
  b.t += dt; if (b.hit > 0) b.hit -= dt; b.vx = b.vy = 0;
  const pl = b.pl; if (!pl) return;
  if (pl.port !== 'vive') flPousser(b, dt);            // (§253) frôlée, elle s'écarte
  if (b.dead) {
    // le butin : à qui l'a abattue. Chez le gardien, pas si le dernier coup venait d'en face ; chez un
    // suiveur, seulement si c'est lui qui vient de la frapper
    const moi = marionnette ? maintenant() - (b.coupT ?? -99) < 2.5 : !b.tueDistant;
    if (!b.butin && !moi) b.butin = true;
    if (!b.butin) { b.butin = true; const n = 2; metSacIngr(pl.ingr, sacIngr(pl.ingr) + n); if (typeof gagnerGraine === 'function') gagnerGraine(pl.id); if (typeof campIci === 'function' && campIci()) plCueillie(b);   // (§120) abattue : sa graine, toujours ; (§124) chez soi, elle ne revient pas
      say(`${pl.n} est vaincue · +${n} ${INGR[pl.ingr].n.toLowerCase()}` + (typeof nomGraine === 'function' ? ' · +1 ' + nomGraine(pl.id) : ''), 3.5); burst(b.x, b.y, b.z + 1, 24, 'rgb(' + pl.pal[3].join(',') + ')'); SON.jouer('ramasse'); majSac(); }
    b.dead = 1; return;
  }
  if (b.cueillie && t > b.repousseT) b.cueillie = false;
  const dJ = Math.hypot(P.x - b.x, P.y - b.y);
  if (pl.port !== 'simple' && !b.cueillie && dJ < 30 && Math.random() < dt * (pl.port === 'geante' ? 3 : 1.5)) {     // le pollen, les lueurs
    const a = Math.random() * 6.2832, r0 = Math.random() * 1.5, h = pl.port === 'geante' ? 1 + Math.random() * 3 : .5 + Math.random();
    parts.push({ x: b.x + Math.cos(a) * r0, y: b.y + Math.sin(a) * r0, z: b.z + h, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, vz: .15 + Math.random() * .2, g: -.05, life: 2.5, age: 0, col: 'rgb(' + pl.pal[3].join(',') + ')', luit: 1, tl: .05 });
  }
  if (pl.forme === 'arbuste') if (!b.cueillie && dJ < 25 && Math.random() < dt * .8) parts.push({ x: b.x + (Math.random() - .5) * 1.4, y: b.y + (Math.random() - .5) * 1.4, z: b.z + 1.3, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, vz: -.1, g: .3, life: 3, age: 0, col: 'rgb(' + pl.pal[2].join(',') + ')', tl: .05 });
  if (pl.port !== 'vive') return;
  if (marionnette) {                                       // chez un suiveur : le gardien dit quand elle s'arme et frappe
    if (b.etat === 'arme') b.armeT = (b.armeT || 0) + dt;
    else if (b.etat === 'frappe') { if (b.etatNeuf && pl.forme !== 'cracheuse') SON.jouer(pl.forme === 'gueule' ? 'pilon' : 'tir', {}, b.x, b.y, b.z + 1); b.frappeT = (b.frappeT || 0) + dt; }
    if (b.etatNeuf && b.etat === 'arme') b.armeT = 0;
    return;
  }
  // la vive : elle guette, s'arme (on le voit), frappe ; puis elle se remet. Elle vise le joueur le plus
  // proche, d'ici ou d'en face
  const J = typeof JC !== 'undefined' && JC ? JC : P, dK = Math.hypot(J.x - b.x, J.y - b.y);
  const R = pl.forme === 'cracheuse' ? 9 : pl.forme === 'fouetteuse' ? 4.2 : 3.4, vu = J.pv > 0 && dK < R && Math.abs(J.z - b.z) < 3 && !abriDe(J);
  b.cible = Math.atan2(J.y - b.y, J.x - b.x);
  if (b.etat === 'arme') {
    b.armeT += dt;
    if (b.armeT > (pl.forme === 'cracheuse' ? .9 : .6)) {
      b.etat = 'frappe'; b.frappeT = 0; b.vise = [J.x, J.y, J.z];
      if (pl.forme === 'cracheuse') {                        // le venin, en cloche
        const ox = b.x, oy = b.y, oz = b.z + 1.5, d = Math.max(1, dK), vol = Math.max(.7, Math.min(1.3, .5 + d * .08)), cx = J.x + (J.vx || 0) * vol * .5, cy = J.y + (J.vy || 0) * vol * .5;
        TIRS.push({ x: ox, y: oy, z: oz, vx: (cx - ox) / vol, vy: (cy - oy) / vol, vz: (J.z + .5 - oz) / vol + TIR_G * vol * .5, de: b, deg: .04, age: 0, c: pl.pal[3].slice(), spore: true, vol });
        if (typeof fauneTir === 'function') fauneTir(b, TIRS[TIRS.length - 1]);
        SON.jouer('crachat', {}, ox, oy, oz);
      } else if (dK < R + .3) {
        const kb = [Math.cos(b.cible) * 6, Math.sin(b.cible) * 6, 0];
        if (typeof frapperJoueur === 'function') frapperJoueur(b, J, pl.forme === 'gueule' ? .12 : .09, { kb });
        else { porterCoup(b, P, pl.forme === 'gueule' ? .12 : .09); P.vx += kb[0]; P.vy += kb[1]; }
        burst(J.x, J.y, J.z + .8, 10, '#c83030'); SON.jouer(pl.forme === 'gueule' ? 'pilon' : 'tir', {}, b.x, b.y, b.z + 1);
      }
    }
  } else if (b.etat === 'frappe') { b.frappeT += dt; if (b.frappeT > 1.3) b.etat = 'guette'; }
  else { b.etat = 'guette'; if (vu && b.t > (b.cdT || 0)) { b.etat = 'arme'; b.armeT = 0; b.cdT = b.t + (pl.forme === 'cracheuse' ? 3.2 : 2.2); } }
}
// La nuit, les plantes les plus proches éclairent autour d'elles (les géantes et les vives plus loin).
function lueursPlantes(pousse) {
  const L = [];
  for (const b of beasts) if (b.sp.plante && b.pl && !b.cueillie && !b.dead) { const d = (b.x - P.x) ** 2 + (b.y - P.y) ** 2; if (d < 484) L.push([b, d]); }
  L.sort((a, b) => a[1] - b[1]);
  for (const [b] of L.slice(0, 4)) { const g = b.pl.port !== 'simple'; pousse(b.x, b.y, b.z + (g ? 2.2 : .8), g ? 3.4 : 1.6); }
}
function cueillirPlante(b) {
  const pl = b.pl; if (!pl) return;
  if (pl.port === 'vive') { say(pl.n + ' se défend · abattez-la d\'abord', 2); return; }
  if (b.cueillie) { say(pl.n + ' a déjà été cueillie · elle repousse', 2); return; }
  const n = pl.port === 'simple' ? 1 + (Math.random() < .5 ? 1 : 0) : 1;
  metSacIngr(pl.ingr, sacIngr(pl.ingr) + n); b.cueillie = true; b.repousseT = t + (pl.port === 'simple' ? 600 : 1800);
  if (typeof campIci === 'function' && campIci()) { b.repousseT = Infinity; plCueillie(b); }   // (§124) chez soi : elle ne repousse pas
  const gr = typeof gagnerGraine === 'function' && Math.random() < .25; if (gr) gagnerGraine(pl.id);   // (§120) une graine, une fois sur quatre
  if (b.num !== undefined && RS.ouvert && Autres.size && Compte.uid) diffuser(canalIle(), 'fcueille', { u: Compte.uid, n: b.num, r: Math.round(b.repousseT - t) });
  say(`${pl.rang} · ${pl.n} · +${n} ${INGR[pl.ingr].n.toLowerCase()}` + (gr ? ' · +1 ' + nomGraine(pl.id) : ''), 3);
  burst(b.x, b.y, b.z + (pl.port === 'geante' ? 2 : .8), pl.port === 'geante' ? 30 : 14, 'rgb(' + pl.pal[3].join(',') + ')'); SON.jouer('ramasse'); majSac();
}
// ---------- en volumes (§253) ----------
// Une plante rare se compose en trois étages. Le PIED : une rosette au ras du sol, le plus sombre. Le PORT : la tige, un
// prisme effilé qui ploie. La TÊTE : la fleur, le fruit, la lanterne, le plus clair, et ce qui luit. Plus de pavés : les
// feuilles et les pétales sont des lames plates tenues dans leur plan (ref), larges au milieu et effilées au bout ; les
// tiges, des prismes à six pans qui s'amincissent ; les fruits, les boutons, les cloches, des boules. Les feuilles se
// rangent à l'angle d'or, jamais deux l'une sur l'autre, et chaque plante a ses proportions, tirées de sa graine.
// Le mouvement :
//  - le vent de la météo, dans sa direction ; des rafales traversent l'île à trois cases par seconde (deux plantes voisines
//    plient l'une après l'autre) ; sans vent, une brise ;
//  - une tige plie plus vers son bout, et après sa base (l'onde monte) ; ce qui pend (cloches, chevelures, filaments) suit
//    avec retard ; feuilles et pétales frémissent, plus vite et moins fort ;
//  - la plante respire ; elle s'ouvre au jour et se ferme à la nuit sans à-coup ; sa fleur suit le soleil ;
//  - frôlée par le joueur ou une bête, elle s'écarte et revient en oscillant (flPousser, un ressort) ;
//  - cueillie, elle perd sa tête : un bouton, qui grossit à mesure qu'elle repousse.
const FL_GA = 2.39996323;                                   // l'angle d'or
const flH = (g, k) => { const s = Math.sin(g * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };   // un tirage fixe, propre à la plante
const flL = u => { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u); };
const flMix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const flN = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const flX = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const flA = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
const flD = (a, b) => flN([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
// Le vent sur une plante, dans son repère : sa direction, sa force (la brise comprise), la rafale qui passe (de 0 à 1).
function flVent(f) {
  const M = typeof Meteo !== 'undefined' ? Meteo : null, V = M ? Math.min(2, M.vent || 0) : 0, D = M ? M.dir || 0 : 0;
  const u = (f.x * Math.cos(D) + f.y * Math.sin(D)) * .32 - t * 1.05;       // l'onde des rafales avance dans le sens du vent
  const raf = Math.max(0, Math.sin(u) * .62 + Math.sin(u * .41 + 1.3) * .38), a = D - (f.dir || 0);
  return { x: Math.cos(a), y: Math.sin(a), f: .15 + Math.min(1.4, V * .7) * (.45 + .55 * raf), raf };
}
// Frôlée : le joueur, les autres joueurs, une bête la poussent ; elle s'écarte, puis revient en oscillant (un ressort amorti).
function flPousser(b, dt) {
  const R = b.pl.port === 'geante' ? 1.7 : 1;
  let tx = 0, ty = 0;
  const pousse = o => { if (!o || !Number.isFinite(o.x)) return; const dx = b.x - o.x, dy = b.y - o.y; if (Math.abs(dx) > R || Math.abs(dy) > R) return;
    const d = Math.hypot(dx, dy); if (d < R && d > .02 && Math.abs((Number.isFinite(o.z) ? o.z : b.z) - b.z) < 2.5) { const k = Math.pow(1 - d / R, 1.4) * 1.3; tx += dx / d * k; ty += dy / d * k; } };
  if (!b.cueillie || b.pl.port !== 'simple') {
    pousse(P); if (typeof Autres !== 'undefined') for (const j of Autres.values()) pousse(j);
    for (const o of beasts) if (!o.dead && !o.sp.plante && !o.enVol) pousse(o);
  }
  const ca = Math.cos(b.dir || 0), sa = Math.sin(b.dir || 0), lx = tx * ca + ty * sa, ly = -tx * sa + ty * ca;
  const S = b.flP || (b.flP = [0, 0, 0, 0]);
  dt = Math.min(dt, .1);
  for (let n = Math.ceil(dt / .02), h = n ? dt / n : 0; n > 0; n--) {
    S[2] += ((lx - S[0]) * 38 - S[2] * 5) * h; S[3] += ((ly - S[1]) * 38 - S[3] * 5) * h; S[0] += S[2] * h; S[1] += S[3] * h;
  }
}
function osPlante(f) {
  const B = [], pl = f.pl; if (!pl) return B;
  if (typeof osPlanteVolcan === 'function' && VF_BIOS.has(pl.bio)) return osPlanteVolcan(f);   // (§200) celles du volcan ont leurs propres formes (volcan.js)
  const [tige, feuille, petale, coeur, pointe] = pl.pal, g = f.graine || 0, ph = g * 23.7;
  const TX = typeof TEX === 'object' ? TEX : {};
  const fonce = flMix(feuille, tige, .38), clair = flMix(feuille, [255, 255, 226], .14), bois = flMix(tige, [64, 46, 34], .22);
  const W = flVent(f), PU = f.flP || [0, 0];
  const jour = flL(((typeof lumiere === 'function' ? lumiere() : 1) - .34) / .38), nuit = 1 - jour;
  // cueillie : la tête repousse (un bouton d'abord) ; chez soi, elle ne repousse pas (§124)
  const fan = !!f.cueillie, duree = pl.port === 'simple' ? 600 : 1800;
  const pousse = !fan ? 1 : Number.isFinite(f.repousseT) ? Math.max(0, Math.min(1, 1 - (f.repousseT - t) / duree)) : 0;
  const tete = fan ? flL((pousse - .3) / .7) : 1, terne = fan ? .45 * (1 - pousse) : 0;
  const C = c => terne ? flMix(c, [124, 114, 96], terne) : c;
  const os = (a, b, w, h, c, F) => { const o = { a, b, w, h, c: C(c) }; if (F) Object.assign(o, F); B.push(o); return o; };
  const vif = (a, b, w, h, c, F) => os(a, b, w, h, c, Object.assign({ luit: !fan }, F));
  // le pli d'un point, à la fraction q d'une pièce souple s : le vent (le long, un peu de travers), la poussée ; d, le retard de l'onde
  const osc = (u, w) => Math.sin(u * w + ph) * .65 + Math.sin(u * w * 2.17 + ph * 1.3) * .35;
  const plie = (q, s, d = .4, w = 1.7) => { const u = t - q * d, k = s * q * q, al = W.f * (.62 + .38 * osc(u, w)) * k, tr = W.f * .28 * Math.sin(u * w * 1.6 + ph * 2) * k;
    return [W.x * al - W.y * tr + PU[0] * k, W.y * al + W.x * tr + PU[1] * k, -.18 * Math.abs(al)]; };
  // une tige : n segments depuis p, partant vers d0 et tournant vers d0 + c au bout ; s, sa souplesse ; de la largeur w0
  // à w1, de la couleur c0 à c1. Rend ses points.
  const tigeDe = (p, n, L, d0, c, s, w0, w1, c0, c1, F) => {
    const pts = [p];
    for (let k = 1; k <= n; k++) {
      const q = k / n, b = plie(q, s), d = flN([d0[0] + c[0] * q + b[0], d0[1] + c[1] * q + b[1], d0[2] + c[2] * q + b[2]]);
      const np = flA(p, d, L / n), wa = w0 + (w1 - w0) * (k - 1) / n, wb = w0 + (w1 - w0) * k / n;
      os(flA(p, d, -wa * .3), np, wa, wa, flMix(c0, c1, (k - .5) / n), Object.assign({ pans: 6, fin: wb / wa }, F));   // un rien en arrière : les coudes restent soudés
      pts.push(np); p = np;
    }
    return pts;
  };
  // une lame plate (feuille, pétale, fronde), de p vers d, longue L, large w, dans le plan de normale nr : étroite au pied,
  // large au milieu, effilée au bout (bout : de 0,05, pointue, à 0,6, ronde). tombe : ce que son bout pend ; fr : ce
  // qu'elle frémit ; s : sa souplesse au vent. Rend [son milieu, son bout].
  const lame = (p, d, L, w, nr, c0, c1, o) => {
    o = o || {}; const k = o.k || 0, fr = (o.fr ?? .5) * (.35 + W.f) * Math.sin(t * (5 + flH(g, k) * 2.5) + k * 2.1 + ph) * .14;
    const b = plie(1, o.s ?? .2, .25), m = flA(p, d, L * .48);
    const d2 = flN([d[0] + nr[0] * fr + b[0], d[1] + nr[1] * fr + b[1], d[2] - (o.tombe || 0) + nr[2] * fr + b[2]]), e = flA(m, d2, L * .52);
    const ep = o.ep || Math.max(.012, w * .1);
    os(p, m, w * .42, ep, c0, { fin: [2.4, 1], ref: nr, nu: 1 });
    os(m, e, w, ep, c1, { fin: [o.bout ?? .08, .6], ref: nr, nu: 1 });
    return [m, e];
  };
  // un repère autour d'un axe u
  const autour = u => { const e1 = flN(flX(u, Math.abs(u[2]) < .9 ? [0, 0, 1] : [1, 0, 0])); return [e1, flX(u, e1)]; };
  const rayon = (e1, e2, a) => { const ca = Math.cos(a), sa = Math.sin(a); return [[e1[0] * ca + e2[0] * sa, e1[1] * ca + e2[1] * sa, e1[2] * ca + e2[2] * sa], [-e1[0] * sa + e2[0] * ca, -e1[1] * sa + e2[1] * ca, -e1[2] * sa + e2[2] * ca]]; };
  // une corolle : n pétales autour du cœur c, d'axe u, ouverts de ouv (0 : à plat ; 1,3 : refermés en bouton ; négatif : rabattus)
  const corolle = (c, u, n, L, w, ouv, c0, c1, o) => {
    o = o || {}; const [e1, e2] = autour(u), off = o.off ?? g * 6.28, co = Math.cos(ouv), so = Math.sin(ouv);
    for (let k = 0; k < n; k++) {
      const [rd, tg] = rayon(e1, e2, off + k / n * 6.2832), d = [rd[0] * co + u[0] * so, rd[1] * co + u[1] * so, rd[2] * co + u[2] * so];
      lame(flA(c, rd, o.r0 || 0), d, L * (1 + (flH(g, k + (o.k || 0)) - .5) * .18), w, flX(d, tg), c0, c1, Object.assign({ bout: .4, fr: .3 }, o, { k: k + (o.k || 0) }));
    }
  };
  // la rosette du pied : n feuilles à l'angle d'or, levées de el, qui retombent
  const rosette = (n, L, w, el, c0, c1, o) => {
    o = o || {};
    for (let k = 0; k < n; k++) {
      const a = k * FL_GA + g * 6.28, e = el + (flH(g, k + 7) - .5) * .2, ce = Math.cos(e), se = Math.sin(e);
      const d = [Math.cos(a) * ce, Math.sin(a) * ce, se];
      lame([Math.cos(a) * .02, Math.sin(a) * .02, o.z || .01], d, L * (.78 + .44 * flH(g, k)), w, [-se * Math.cos(a), -se * Math.sin(a), ce], c0, c1, Object.assign({ tombe: .3, s: .15 }, o, { k }));
    }
  };
  // le soleil, dans le repère de la plante : la fleur s'y tourne le jour
  const soleil = (() => {
    if (typeof horloge === 'undefined' || typeof LEVER === 'undefined') return null;
    const q = (horloge * 24 - LEVER) / (COUCHER - LEVER); if (q <= 0 || q >= 1) return null;
    const az = Math.PI * (1 - q) - .5 - (f.dir || 0); return [Math.cos(az), Math.sin(az)];
  })();
  const versSoleil = (u, k) => soleil ? flN([u[0] + soleil[0] * k * jour, u[1] + soleil[1] * k * jour, u[2]]) : u;
  // une touffe de feuillage : une boule ronde et des plus petites qui s'y accrochent, pour une silhouette qui moutonne
  const touffe = (c, s, col, k, n = 2) => {
    const fl = Math.sin(t * 2.1 + k * 1.7 + ph) * .03 * s * (.4 + W.f);
    os([c[0] + fl, c[1], c[2] - s * .42], [c[0] + fl, c[1] - fl, c[2] + s * .42], s * 1.1, s * 1.05, col, { boule: 5, rond: .85 });
    for (let j = 0; j < n; j++) { const a = k * 2.1 + j * 2.6 + g * 5, r = s * .52, cc = [c[0] + Math.cos(a) * r + fl, c[1] + Math.sin(a) * r, c[2] + s * (j % 2 ? .24 : -.1)];
      os([cc[0], cc[1], cc[2] - s * .3], [cc[0], cc[1], cc[2] + s * .3], s * .72, s * .7, flMix(col, j % 2 ? clair : fonce, .12), { boule: 4, rond: .85 }); }
  };
  const bouton = (p, u, s, c) => os(flA(p, u, -s * .2), flA(p, u, s), s * .8, s * .8, c, { boule: 3, rond: .6, nu: 1 });
  switch (pl.forme) {
    // ---- les simples ----
    case 'etoile': {                                    // une marguerite : deux rangs de pétales qui s'ouvrent au jour, se referment la nuit
      rosette(7, .3, .11, .32, fonce, feuille);
      const p = tigeDe([0, 0, 0], 5, .68 * (.9 + .25 * flH(g, 1)), [(flH(g, 2) - .5) * .25, (flH(g, 3) - .5) * .25, 1], [(flH(g, 4) - .5) * .3, .12, 0], .55, .034, .02, flMix(tige, feuille, .2), feuille);
      for (const j of [2, 3]) { const a = j * 2.6 + g * 5, d = flN([Math.cos(a), Math.sin(a), .55]); lame(p[j], d, .15, .055, flN([-d[0] * .5, -d[1] * .5, 1]), feuille, flMix(feuille, pointe, .15), { k: 20 + j, tombe: .25 }); }
      const hp = p[5], u = versSoleil(flD(p[4], hp), .55);
      corolle(hp, u, 5, .07, .04, -.6, feuille, fonce, { k: 30, bout: .1 });          // les sépales
      if (tete > .04) {
        const ouv = 1.3 - 1.38 * jour;
        corolle(flA(hp, u, .012), u, 11, .23 * tete, .08 * tete, ouv, petale, flMix(petale, pointe, .6), { k: 40, tombe: .06 * jour });
        corolle(flA(hp, u, .022), u, 7, .15 * tete, .065 * tete, ouv + .25, flMix(petale, [255, 255, 255], .18), petale, { k: 60, off: g * 6.28 + .45 });
        vif(flA(hp, u, -.005), flA(hp, u, .055 * tete), .1 * tete, .1 * tete, coeur, { boule: 4, rond: .8 });
      } else bouton(hp, u, .06, flMix(feuille, petale, .25));
      break;
    }
    case 'cristalline': {                               // une druse : des prismes à six pans, pointus, et un éclat qui passe de l'un à l'autre
      os([0, 0, -.03], [0, 0, .1], .5, .42, flMix(tige, [96, 96, 108], .4), { boule: 4, rond: .55 });
      for (let k = 0; k < 8; k++) {
        const a = k * FL_GA + g * 6.28, ce = k ? .42 + flH(g, k) * .5 : .08, L = (k ? .3 + flH(g, k + 3) * .38 : .85) * (fan ? .35 + .65 * pousse : 1);
        const d = flN([Math.cos(a) * Math.sin(ce), Math.sin(a) * Math.sin(ce), Math.cos(ce)]), b0 = [Math.cos(a) * (k ? .09 : 0), Math.sin(a) * (k ? .09 : 0), .05];
        const w = k ? .08 + flH(g, k + 5) * .05 : .15, eclat = Math.pow(Math.max(0, Math.sin(t * 1.1 - k * .9 + ph)), 8);
        const c = flMix(flMix(k % 2 ? petale : pointe, coeur, .18 * (k % 3)), [255, 255, 255], eclat * .55), m = flA(b0, d, L * .76);
        const F = { pans: 6, tex: TX.facette }, pose = k % 2 ? os : vif;
        pose(b0, m, w, w, c, Object.assign({ fin: .94 }, F)); pose(m, flA(m, d, L * .3), w * .94, w * .94, flMix(c, [255, 255, 255], .2), Object.assign({ fin: 0 }, F));
      }
      break;
    }
    case 'clochettes': {                                // une hampe en arc, et ses cloches qui pendent, se balancent avec retard, et luisent
      rosette(5, .26, .1, .3, fonce, feuille);
      const p = tigeDe([0, 0, 0], 8, 1.25 * (.9 + .2 * flH(g, 1)), [0, 0, 1], [1.05, (flH(g, 2) - .5) * .6, -1.45], .5, .034, .013, flMix(tige, feuille, .25), feuille);
      for (const j of [2, 4]) { const d = flN([.2, j === 2 ? 1 : -1, .35]); lame(p[j], d, .2, .07, flN([0, -d[1] * .3, 1]), feuille, flMix(feuille, pointe, .1), { k: 10 + j, tombe: .3 }); }
      for (let k = 3; k <= 8; k++) {
        const q = p[k], sz = (.105 - (k - 3) * .008) * tete; if (sz < .012) { if (fan && k > 5) bouton(q, [0, 0, -1], .025, feuille); continue; }
        const sw = plie(1, 1.1, .75 + k * .09, 1.4), dn = flN([sw[0] * .8, sw[1] * .8, -1]), at = flA(q, dn, .07);
        os(q, at, .01, .01, tige);
        const peau = flMix(petale, coeur, nuit * .45), [e1, e2] = autour(dn), j0 = flA(at, dn, sz * .7);
        os(at, flA(at, dn, sz), sz * 1.25, sz * 1.25, peau, { boule: 4, rond: .6, nu: 1 });     // le dôme
        for (let j = 0; j < 5; j++) {                                                           // la jupe, évasée
          const [rd, tg] = rayon(e1, e2, j / 5 * 6.2832 + k), d = flN([dn[0] * .8 + rd[0] * .7, dn[1] * .8 + rd[1] * .7, dn[2] * .8 + rd[2] * .7]);
          os(j0, flA(j0, d, sz * .65), sz * .55, sz * .08, flMix(peau, pointe, .35), { fin: [1.5, .7], ref: flX(d, tg), nu: 1 });
        }
        vif(flA(at, dn, sz * 1.05), flA(at, dn, sz * 1.35), sz * .45, sz * .45, coeur, { boule: 3 });   // le battant, qui luit
      }
      break;
    }
    case 'eventail': {                                  // une gerbe de frondes en éventail, des folioles, une onde qui court jusqu'au bout
      os([0, 0, -.02], [0, 0, .1], .16, .16, flMix(tige, feuille, .2), { boule: 4, rond: .6 });
      const ax = g * 6.2832, n = 8;
      for (let k = 0; k < n; k++) {
        const a = ax + (k / (n - 1) - .5) * 4.2 + (flH(g, k) - .5) * .2, ca = Math.cos(a), sa = Math.sin(a), mi = 1 - Math.abs(k / (n - 1) - .5) * 1.2;
        const L = (.62 + .38 * mi) * (.9 + .2 * flH(g, k + 2)) * (fan ? .5 + .5 * pousse : 1), el = .95 + mi * .35, tg = [-sa, ca, 0];
        let p = [ca * .04, sa * .04, .07];
        for (let j = 1; j <= 5; j++) {
          const q = j / 5, ond = Math.sin(q * 4.2 - t * 2.3 + k * 1.3 + ph) * .16 * q * (.55 + W.f), b = plie(q, .35, .5);
          const e = el - q * 1.45, d = flN([ca * Math.cos(e) + tg[0] * ond + b[0], sa * Math.cos(e) + tg[1] * ond + b[1], Math.sin(e) + b[2]]);
          const np = flA(p, d, L / 5), w = [.05, .085, .1, .09, .06][j - 1], nr = flN(flX(d, tg)), c = flMix(flMix(feuille, petale, q * .55), pointe, q > .8 ? .3 : 0);
          os(p, np, w, .014, c, { fin: [j === 5 ? .08 : [.085, .1, .09, .06][j - 1] / w, .8], ref: nr, nu: 1 });
          if (j >= 2 && j <= 4) for (const s of [-1, 1]) {                                     // les folioles, de part et d'autre
            const fd = flN([tg[0] * s + d[0] * .7, tg[1] * s + d[1] * .7, tg[2] * s + d[2] * .7 - .2]);
            os(np, flA(np, fd, .11 - j * .015), .045, .01, flMix(c, feuille, .3), { fin: [.15, .7], ref: nr, nu: 1 });
          }
          p = np;
        }
      }
      break;
    }
    case 'spirale': {                                   // des crosses de fougère : roulées la nuit, elles se déroulent au jour
      rosette(4, .26, .09, .25, fonce, feuille);
      for (let k = 0; k < 4; k++) {
        const a = k * FL_GA + g * 6.28, ca = Math.cos(a), sa = Math.sin(a), H = (.3 + k * .1 + flH(g, k) * .12) * (fan ? .6 + .4 * pousse : 1);
        const p = tigeDe([ca * .05, sa * .05, 0], 4, H, [ca * .25, sa * .25, 1], [ca * .15, sa * .15, 0], .4, .045, .04, flMix(tige, feuille, .3), feuille);
        const der = fan ? .08 : flL(.08 + .5 * jour + .1 * Math.sin(t * .23 + k * 1.7 + ph));
        let q = p[4], ang = 0, r = .14 * (1 + .5 * der), w = .062;
        for (let j = 0; j < 9; j++) {                                                           // la crosse, de plus en plus serrée
          ang += (.62 + j * .09) * (1 - .62 * der); r *= .86;
          const d = [ca * Math.sin(ang), sa * Math.sin(ang), Math.cos(ang)], np = flA(q, d, r);
          os(flA(q, d, -w * .3), np, w, w, flMix(feuille, pointe, j / 9), { pans: 6, fin: .86, rond: .8 }); q = np; w *= .86;
        }
        vif(q, flA(q, [ca, sa, 0], .04), .045, .045, coeur, { boule: 3 });
      }
      break;
    }
    case 'orbe': {                                      // des lanternes au bout de tiges fines : lourdes, elles plient et dansent
      rosette(5, .3, .14, .25, fonce, feuille, { bout: .25 });
      for (let k = 0; k < 5; k++) {
        const a = k * FL_GA + g * 6.28, ca = Math.cos(a), sa = Math.sin(a), H = .5 + flH(g, k) * .5, bob = Math.sin(t * 1.1 + k * 1.9 + ph) * .04;
        const p = tigeDe([ca * .03, sa * .03, 0], 5, H + bob, [ca * .22, sa * .22, 1], [ca * .25, sa * .25, -.1], .95, .017, .011, flMix(tige, feuille, .3), feuille);
        const top = p[5], u = flD(p[4], top), R = (.07 + flH(g, k + 3) * .03) * tete;
        if (R < .012) { bouton(top, u, .035, feuille); continue; }
        const [e1, e2] = autour(u);
        for (let j = 0; j < 3; j++) { const [rd, tg] = rayon(e1, e2, j / 3 * 6.2832 + k), d = flN([u[0] + rd[0] * .9, u[1] + rd[1] * .9, u[2] + rd[2] * .9]); os(top, flA(top, d, R * 1.1), R * .8, .012, feuille, { fin: [.2, .7], ref: flX(d, tg), nu: 1 }); }
        vif(flA(top, u, R * .1), flA(top, u, R * 2.1), R * 2, R * 2, flMix(k % 2 ? coeur : petale, [255, 255, 240], .1 + nuit * .2), { boule: 4, rond: .75 });
        os(flA(top, u, R * 2), flA(top, u, R * 2.35), R * .5, R * .5, tige, { boule: 3 });   // la coiffe
      }
      break;
    }
    case 'arbuste': {                                   // un arbrisseau : un tronc qui fourche, des touffes rondes, des fleurs semées dessus
      const E = { tex: TX.ecorce }, p = tigeDe([0, 0, 0], 3, .42, [(flH(g, 1) - .5) * .2, (flH(g, 2) - .5) * .2, 1], [0, 0, 0], .15, .075, .055, bois, bois, E), top = p[3], T = [];
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * 6.2832 + g * 4, ca = Math.cos(a), sa = Math.sin(a);
        const b = tigeDe(top, 2, .34 + flH(g, k) * .1, [ca * .9, sa * .9, .9], [ca * .2, sa * .2, -.2], .35, .05, .03, bois, bois, E); T.push(b[2]);
        for (const s of [-1, 1]) { const a2 = a + s * .65, tw = tigeDe(b[1], 1, .22, [Math.cos(a2), Math.sin(a2), 1], [0, 0, 0], .5, .028, .02, bois, bois); T.push(tw[1]); }
      }
      T.push(flA(top, [0, 0, 1], .42));
      T.forEach((c, k) => touffe(c, .27 + flH(g, k + 10) * .09, flMix(feuille, k % 2 ? tige : clair, .12), k, 1));
      const nb = Math.round(16 * tete);
      for (let k = 0; k < nb; k++) {                                                            // les fleurs, à la surface des touffes
        const c = T[k % T.length], a = k * FL_GA + g * 3, el = .25 + flH(g, k + 20) * 1.0, d = [Math.cos(a) * Math.cos(el), Math.sin(a) * Math.cos(el), Math.sin(el)], q = flA(c, d, .27);
        os(q, flA(q, d, .035), .095, .095, k % 4 ? petale : pointe, { boule: 3, rond: .7, nu: 1 });
        if (k % 2 === 0) vif(flA(q, d, .03), flA(q, d, .05), .03, .03, coeur, { boule: 3 });
      }
      break;
    }
    // ---- les géantes ----
    case 'colosse': {                                   // une fleur de quatre mètres : elle respire, s'ouvre au jour, tourne vers le soleil
      const respire = .5 + .5 * Math.sin(t * .7 + ph);
      for (let k = 0; k < 6; k++) {
        const a = k * FL_GA + g * 6.28, e = .5 + flH(g, k) * .2, ca = Math.cos(a), sa = Math.sin(a), d = [ca * Math.cos(e), sa * Math.cos(e), Math.sin(e)], nr = [-Math.sin(e) * ca, -Math.sin(e) * sa, Math.cos(e)];
        const p0 = [ca * .12, sa * .12, .05], [m, q] = lame(p0, d, 1.5 + flH(g, k + 3) * .5, .55, nr, fonce, feuille, { k, tombe: .7, s: .25, ep: .04, bout: .12 });
        os(flA(p0, nr, .025), flA(m, nr, .025), .045, .035, flMix(feuille, tige, .5), { pans: 6 }); os(flA(m, nr, .025), flA(q, nr, .015), .035, .03, flMix(feuille, tige, .4), { pans: 6, fin: .2 });   // la nervure
      }
      const p = tigeDe([0, 0, 0], 9, 3.5 + flH(g, 1) * .5, [(flH(g, 2) - .5) * .15, (flH(g, 3) - .5) * .15, 1], [(flH(g, 4) - .5) * .3, .1, 0], .3, .27, .13, flMix(tige, feuille, .15), feuille, { pans: 8 });
      for (const j of [3, 5, 7]) { const a = j * FL_GA + g * 3, d = flN([Math.cos(a), Math.sin(a), .45]); lame(p[j], d, .85, .32, flN([-d[0] * .4, -d[1] * .4, 1]), feuille, clair, { k: 10 + j, tombe: .45, s: .3 }); }
      const hp = p[9], nod = plie(1, .5, .9, 1.1), u = versSoleil(flN([hp[0] - p[8][0] + nod[0], hp[1] - p[8][1] + nod[1], hp[2] - p[8][2]]), .35);
      corolle(hp, u, 7, .45, .2, -.5, feuille, fonce, { k: 30, ep: .03, bout: .1 });
      if (tete > .04) {
        const ouv = .12 + .14 * respire + nuit * .8;
        corolle(flA(hp, u, .05), u, 10, 1.25 * tete, .55 * tete, ouv, petale, flMix(petale, pointe, .6), { k: 40, tombe: .25, bout: .45, ep: .035, fr: .2 });
        corolle(flA(hp, u, .1), u, 7, .8 * tete, .42 * tete, ouv + .35, flMix(petale, [255, 255, 255], .15), petale, { k: 60, off: g * 6.28 + .45, bout: .5, ep: .03 });
        os(flA(hp, u, .05), flA(hp, u, .24), .7 * tete, .7 * tete, flMix(coeur, tige, .35), { boule: 4, rond: .6, nu: 1 });   // le disque
        const [e1, e2] = autour(u), c0 = flA(hp, u, .2);
        for (let k = 0; k < 11; k++) {                                                          // les étamines, qui luisent et frémissent
          const [rd] = rayon(e1, e2, k * FL_GA + g), fr = Math.sin(t * 3.1 + k * 1.3 + ph) * .08, sp = .45 + flH(g, k + 50) * .25;
          const d = flN([u[0] * Math.cos(sp) + rd[0] * Math.sin(sp) + fr, u[1] * Math.cos(sp) + rd[1] * Math.sin(sp) - fr, u[2] * Math.cos(sp) + rd[2] * Math.sin(sp)]), e = flA(c0, d, (.42 + flH(g, k + 60) * .12) * tete);
          os(c0, e, .028, .028, flMix(tige, pointe, .4)); vif(e, flA(e, d, .07), .085, .085, k % 2 ? pointe : coeur, { boule: 3 });
        }
      } else bouton(hp, u, .3, flMix(feuille, petale, .25));
      break;
    }
    case 'saule': {                                     // un saule : un tronc qui se tord, des bras en arc, de longues chevelures qui ondoient
      const E = { tex: TX.ecorce, pans: 8 };
      for (let k = 0; k < 4; k++) { const a = k / 4 * 6.2832 + g * 2, ca = Math.cos(a), sa = Math.sin(a); os([ca * .08, sa * .08, .4], [ca * .75, sa * .75, -.05], .3, .3, bois, { pans: 6, fin: .2, tex: TX.ecorce }); }   // les racines
      const p = tigeDe([0, 0, 0], 6, 2.4, [0, 0, 1], [(flH(g, 1) - .5) * .4, (flH(g, 2) - .5) * .4, 0], .1, .44, .26, bois, flMix(bois, feuille, .12), E), top = p[6];
      touffe(flA(top, [0, 0, 1], .45), 1.05, flMix(feuille, tige, .1), 0, 3);                // le dôme
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * 6.2832 + g * 3 + (flH(g, k) - .5) * .5, ca = Math.cos(a), sa = Math.sin(a);
        const br = tigeDe(top, 3, 1.1, [ca * .9, sa * .9, .6], [ca * .15, sa * .15, -.75], .22, .17, .07, bois, bois, E);
        touffe(flA(br[2], [0, 0, 1], .3), .78, flMix(feuille, k % 2 ? clair : tige, .1), k + 1, 1);
        for (let j = 0; j < 4; j++) {                                                           // quatre chevelures par bras, sous le feuillage
          let q = j === 0 ? br[3] : j === 1 ? br[2] : flA(flA(br[2], [-sa, ca, 0], j === 2 ? .38 : -.38), [ca, sa, 0], -.15);
          const len = (1.5 + flH(g, k * 4 + j) * .7) * (fan ? .45 + .55 * pousse : 1);
          for (let m = 1; m <= 5; m++) {
            const s = m / 5, sw = plie(s, 1.3, .9 + j * .2, 1.2), ond = Math.sin(s * 3 - t * 1.4 + k * 2 + j) * .12 * s;
            const d = flN([sw[0] - sa * ond, sw[1] + ca * ond, -1]), np = flA(q, d, len / 5);
            (m === 5 ? vif : os)(q, np, .075 - s * .035, .055 - s * .025, m === 5 ? flMix(petale, coeur, .5) : flMix(feuille, petale, s * .8), { pans: 6, fin: .8, nu: 1 });
            q = np;
          }
        }
      }
      break;
    }
    case 'meduse': {                                    // une méduse qui flotte : la cloche se contracte et se détend, ses filaments traînent
      const cy = (t * .5 + g) % 1, cc = cy < .28 ? flL(cy / .28) : 1 - flL((cy - .28) / .72);   // contraction vive, détente lente
      const dr = plie(1, .55, 1.4, .9), z0 = 2.35 + Math.sin(t * .6 + ph) * .2 + cc * .12, X0 = dr[0] * .6, Y0 = dr[1] * .6;
      { let q = [0, 0, 0]; for (let m = 1; m <= 7; m++) {                                       // le fil qui la tient au sol
        const s = m / 7, w = Math.sin(s * 3 + t * .8 + ph) * .1 * Math.sin(s * Math.PI), np = [X0 * s * s + w, Y0 * s * s - w * .5, (z0 - .1) * s];
        os(q, np, .035, .035, flMix(tige, petale, s * .5), { pans: 6 }); q = np; } }
      const Wb = (1.55 - .2 * cc) * (fan ? .6 + .4 * pousse : 1), Hb = .62 + .18 * cc, peau = flMix(petale, coeur, nuit * .25);
      os([X0, Y0, z0], [X0, Y0, z0 + Hb], Wb, Wb, peau, { boule: 5, rond: .7, nu: 1 });                   // la cloche
      os([X0, Y0, z0 + Hb * .82], [X0, Y0, z0 + Hb * 1.08], Wb * .42, Wb * .42, pointe, { boule: 4, rond: .6, nu: 1 });
      vif([X0, Y0, z0 - .22], [X0, Y0, z0 + .1], Wb * .38, Wb * .38, coeur, { boule: 4 });                 // le cœur, qui luit dessous
      for (let k = 0; k < 12; k++) {                                                            // le rebord festonné, qui s'évase quand elle se contracte
        const a = k / 12 * 6.2832 + g, ca = Math.cos(a), sa = Math.sin(a), el = .35 + .55 * cc, d = [ca * Math.cos(el), sa * Math.cos(el), -Math.sin(el)], p0 = [X0 + ca * Wb * .47, Y0 + sa * Wb * .47, z0 + .1];
        os(p0, flA(p0, d, .3), .22, .025, flMix(peau, pointe, .4), { fin: [.6, .6], ref: flX(d, [-sa, ca, 0]), nu: 1 });
      }
      for (let k = 0; k < 10; k++) {                                                            // les filaments
        const a = k / 10 * 6.2832 + .3 + g, ca = Math.cos(a), sa = Math.sin(a), len = (1.9 + flH(g, k) * .5) * (fan ? .5 + .5 * pousse : 1);
        let q = [X0 + ca * Wb * .36, Y0 + sa * Wb * .36, z0 + .02];
        for (let m = 1; m <= 7; m++) {
          const s = m / 7, lag = plie(s, 1, 1.5, .9), ond = Math.sin(s * 3.3 - t * 1.7 + k) * .12 * s, ti = cc * .25 * (1 - s);
          const d = flN([-dr[0] * .4 * s + lag[0] * .3 - ca * ti - sa * ond, -dr[1] * .4 * s + lag[1] * .3 - sa * ti + ca * ond, -1]), np = flA(q, d, len / 7);
          (m >= 6 ? vif : os)(q, np, .045 - s * .025, .045 - s * .025, flMix(peau, coeur, s), { pans: 6, nu: 1 }); q = np;
        }
      }
      for (let k = 0; k < 4; k++) {                                                             // les bras de la bouche, des rubans qui se tordent
        const a = k / 4 * 6.2832 + g * 2; let q = [X0 + Math.cos(a) * .12, Y0 + Math.sin(a) * .12, z0 - .15];
        for (let m = 1; m <= 4; m++) {
          const s = m / 4, tw = m * 1.3 + t * .9 + k, np = flA(q, flN([Math.cos(a) * .25 + Math.sin(t * 1.2 + k + m) * .15, Math.sin(a) * .25, -1]), .26);
          os(q, np, .16 - s * .08, .015, flMix(peau, pointe, s * .6), { ref: [Math.cos(tw), Math.sin(tw), 0], fin: [.8, 1], nu: 1 }); q = np;
        }
      }
      break;
    }
    case 'lumiere': {                                   // un arbre-lumière : une couronne en touffes, des fruits qui pendent et s'allument tour à tour
      const E = { tex: TX.ecorce };
      for (let k = 0; k < 3; k++) { const a = k / 3 * 6.2832 + g * 2, ca = Math.cos(a), sa = Math.sin(a); os([ca * .08, sa * .08, .35], [ca * .65, sa * .65, -.05], .3, .28, bois, { pans: 6, fin: .2, tex: TX.ecorce }); }
      const p = tigeDe([0, 0, 0], 6, 2.1, [0, 0, 1], [(flH(g, 1) - .5) * .35, (flH(g, 2) - .5) * .35, 0], .1, .4, .24, bois, bois, Object.assign({ pans: 8 }, E)), top = p[6], T = [];
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * 6.2832 + g * 3 + (flH(g, k) - .5) * .4, ca = Math.cos(a), sa = Math.sin(a), src = k % 2 ? p[5] : top;
        const br = tigeDe(src, 2, 1.0 + flH(g, k + 4) * .3, [ca * .85, sa * .85, .75], [ca * .1, sa * .1, -.3], .2, .16, .08, bois, bois, E); T.push(br[2]);
        const tw = tigeDe(br[1], 1, .5, [Math.cos(a + .7), Math.sin(a + .7), .9], [0, 0, 0], .3, .07, .05, bois, bois, E); T.push(tw[1]);
      }
      T.push(flA(top, [0, 0, 1], .9));
      T.forEach((c, k) => touffe(c, .72 + flH(g, k + 10) * .25, flMix(feuille, k % 3 === 0 ? tige : k % 3 === 1 ? clair : pointe, .12), k, k % 2 + 1));
      const nf = Math.round(12 * tete);
      for (let k = 0; k < nf; k++) {                                                            // les fruits
        const c = T[k % T.length], a = k * FL_GA + g, q = [c[0] + Math.cos(a) * .42, c[1] + Math.sin(a) * .42, c[2] - .3 - flH(g, k + 30) * .15];
        const sw = plie(1, .8, .7 + k * .05, 1.3), dn = flN([sw[0], sw[1], -1]), e = flA(q, dn, .16), luit = Math.pow(Math.max(0, Math.sin(t * 1.3 - k * .7 + ph)), 4);
        os(q, e, .025, .025, bois); vif(e, flA(e, dn, .24), .2, .2, flMix(k % 2 ? coeur : pointe, [255, 255, 240], luit * .45), { boule: 4, rond: .7 });
      }
      break;
    }
    // ---- les vives : elles attaquent ----
    case 'gueule': {                                    // deux mâchoires dentées au bout d'une tige en S : elle ondule, se cabre, s'ouvre, mord
      const arme = f.etat === 'arme' ? Math.min(1, f.armeT / .6) : 0, mord = f.etat === 'frappe' ? Math.max(0, 1 - f.frappeT / .25) : 0;
      for (let k = 0; k < 6; k++) {
        const a = k * FL_GA + g * 6.28, ca = Math.cos(a), sa = Math.sin(a), d = [ca * .93, sa * .93, .35], nr = flN([-ca * .35, -sa * .35, .93]);
        const [m] = lame([ca * .05, sa * .05, .05], d, .75, .26, nr, fonce, feuille, { k, tombe: .25, bout: .05, ep: .03 });
        os(m, flA(m, [0, 0, 1], .1), .035, .035, [230, 220, 200], { pans: 6, fin: 0 });     // une épine
      }
      const rel = (f.cible ?? 0) - f.dir, cx = Math.cos(rel), sy = Math.sin(rel), lance = mord * 1.3 - arme * .4, ond = Math.sin(t * .9 + ph) * .14 * (1 - arme), souffle = Math.sin(t * 1.3 + ph) * .05;
      const P0 = [0, 0, 0], P1 = [-cx * .25 - sy * ond, -sy * .25 + cx * ond, .75], P2 = [cx * (.1 + lance * .4) + sy * ond, sy * (.1 + lance * .4) - cx * ond, 1.3 + arme * .2 + souffle], P3 = [cx * (.4 + lance), sy * (.4 + lance), 1.75 + arme * .3 - mord * .3 + souffle];
      const bz = s => { const u = 1 - s; return [0, 1, 2].map(i => u * u * u * P0[i] + 3 * u * u * s * P1[i] + 3 * u * s * s * P2[i] + s * s * s * P3[i]); };
      let q = P0;
      for (let k = 1; k <= 6; k++) { const np = bz(k / 6), w0 = .2 - (k - 1) * .013, w1 = .2 - k * .013; os(q, np, w0, w0, flMix(tige, feuille, k / 12), { pans: 8, fin: w1 / w0 }); q = np; }
      const H = P3, fw = flN([cx, sy, .45 - arme * .5 + mord * .2]), cote = flN(flX(fw, [0, 0, 1])), hv = flX(cote, fw);
      const ouv = (f.dead ? 0 : .42 + .12 * Math.sin(t * 1.3 + ph) + arme * .65) * (1 - mord);
      for (const s of [1, -1]) {                                                                // les deux mâchoires, et leurs dents
        const d = flN([fw[0] * Math.cos(ouv) + hv[0] * Math.sin(ouv) * s, fw[1] * Math.cos(ouv) + hv[1] * Math.sin(ouv) * s, fw[2] * Math.cos(ouv) + hv[2] * Math.sin(ouv) * s]);
        const dh = flN(flX(cote, d)), dedans = [-dh[0] * s, -dh[1] * s, -dh[2] * s];
        os(H, flA(H, d, .75), .62, .24, s > 0 ? petale : flMix(petale, tige, .35), { boule: 5, rond: .7, nu: 1, ref: dh });
        os(flA(flA(H, d, .06), dedans, .1), flA(flA(H, d, .62), dedans, .1), .44, .03, flMix(coeur, [120, 20, 40], .55), { ref: dh, fin: [.55, 1], nu: 1 });   // le palais
        for (let k = 0; k < 3; k++) os(flA(flA(H, d, .2 + k * .17), dh, .12 * s), flA(flA(H, d, .25 + k * .17), dh, .14 * s), .07, .07, pointe, { boule: 3 });   // les taches
        for (let k = 0; k < 4; k++) for (const c2 of [-1, 1]) {
          const qd = (k + .5) / 4, b0 = flA(flA(flA(H, d, .12 + qd * .55), cote, c2 * .21 * (1 - qd * .45)), dh, -.03 * s);
          os(b0, flA(b0, dedans, .12), .045, .045, [240, 236, 220], { pans: 6, fin: 0 });
        }
      }
      if (ouv > .3) vif(flA(H, fw, .05), flA(H, fw, .45), .22, .1, [190, 40, 60], { boule: 3 });   // la langue
      vif(flA(H, fw, -.1), flA(H, fw, .03), .26, .26, coeur, { boule: 3, luit: arme > .3 && !fan });
      for (let k = 0; k < 3; k++) { const a = k / 3 * 6.2832 + g, d = flN([Math.cos(a) - fw[0] * .6, Math.sin(a) - fw[1] * .6, -.5]); lame(bz(.86), d, .32, .14, flN([0, 0, 1]), feuille, fonce, { k: 70 + k, bout: .1 }); }   // la collerette
      break;
    }
    case 'fouetteuse': {                                // des fouets d'épines : ils ondulent, l'un se dresse et se love en arrière, puis cingle
      os([0, 0, -.05], [0, 0, .55], .75, .75, flMix(tige, feuille, .2), { boule: 4, rond: .6 });
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g + .6, ca = Math.cos(a), sa = Math.sin(a), d = [ca * .8, sa * .8, .3]; lame([ca * .25, sa * .25, .42], d, .42, .16, flN([-ca * .3, -sa * .3, .95]), feuille, fonce, { k, tombe: .35, bout: .1 }); }
      corolle([0, 0, .55], [0, 0, 1], 6, .16, .08, .5, petale, pointe, { k: 20 });
      vif([0, 0, .55], [0, 0, .64], .14, .14, coeur, { boule: 3 });
      const rel = (f.cible ?? 0) - f.dir, fr = f.etat === 'frappe' ? Math.max(0, 1 - f.frappeT / .35) : 0, ar = f.etat === 'arme' ? Math.min(1, f.armeT / .6) : 0;
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * 6.2832 + g, frappe = k === 0 ? fr : 0, arme = k === 0 ? ar : 0, ph2 = 1 - frappe, tremble = arme * Math.sin(t * 25 + k) * .05;
        let q = [Math.cos(a) * .18, Math.sin(a) * .18, .5];
        for (let m = 1; m <= 10; m++) {
          const s = m / 10, ond = Math.sin(s * 3.5 - t * 1.9 + k * 2.1 + ph) * .35 * (frappe > 0 ? .2 : 1);
          const el = frappe > 0 ? (1.35 - ph2 * 1.5) - s * (1.6 - ph2 * 1.35) : arme > 0 ? 1.25 + s * 1.5 * arme + tremble : 1.2 - s * 2 + Math.sin(t * .8 + k) * .15;
          const A = (frappe > 0 || arme > 0 ? rel : a) + ond * .6, d = [Math.cos(A) * Math.cos(el), Math.sin(A) * Math.cos(el), Math.sin(el)];
          const np = flA(q, d, .23), w = .11 - s * .075;
          os(flA(q, d, -w * .3), np, w, w, flMix(tige, petale, s * .8), { pans: 6, fin: .9 });
          if (m % 2 === 0 && m < 10) { const sd = flN(flX(d, [0, 0, 1])); for (const c2 of [-1, 1]) os(np, flA(flA(np, sd, .1 * c2), d, .03), .03, .03, [235, 225, 205], { pans: 6, fin: 0 }); }
          q = np;
        }
        vif(q, flA(q, [0, 0, 1], .06), .1, .1, pointe, { boule: 3 });
      }
      break;
    }
    case 'cracheuse': {                                 // un bulbe veiné : il respire, gonfle en visant, crache et se rétracte
      const gonfle = f.etat === 'arme' ? Math.min(1, f.armeT / .9) : 0, recul = f.etat === 'frappe' ? Math.max(0, 1 - f.frappeT / .4) : 0, pulse = .5 + .5 * Math.sin(t * 2.2 + ph);
      rosette(6, .7, .24, .25, fonce, feuille, { bout: .05, tombe: .2, ep: .03 });
      for (let k = 0; k < 6; k++) { const a = k * FL_GA + g * 6.28 + .3; os([Math.cos(a) * .3, Math.sin(a) * .3, .12], [Math.cos(a) * .42, Math.sin(a) * .42, .32], .04, .04, [230, 220, 200], { pans: 6, fin: 0 }); }
      const rel = (f.cible ?? 0) - f.dir, vise = f.etat === 'arme' || f.etat === 'frappe' ? .45 : .12 * Math.sin(t * .5 + ph), ax = flN([Math.cos(rel) * vise, Math.sin(rel) * vise, 1]);
      const p = tigeDe([0, 0, 0], 3, .38, [0, 0, 1], [ax[0], ax[1], 0], .1, .24, .2, tige, flMix(tige, petale, .3), { pans: 8 }), nb = p[3];
      const R = (.55 + gonfle * .22 + pulse * .03) * (1 - recul * .15), Cc = flA(nb, ax, R * .75), [e1, e2] = autour(ax);
      os(nb, flA(nb, ax, R * 1.5), R * 1.65, R * 1.65, flMix(petale, [255, 255, 255], gonfle * .1), { boule: 5, rond: .65, nu: 1 });
      const vc = flMix(coeur, [255, 255, 255], gonfle * .4);
      for (let k = 0; k < 6; k++) {                                                             // les veines, sur le bulbe
        const [rd] = rayon(e1, e2, k / 6 * 6.2832 + g);
        let q = null;
        for (let j = 0; j <= 4; j++) { const fi = .35 + j / 4 * 2.3, np = flA(flA(Cc, ax, -Math.cos(fi) * R * .75), rd, Math.sin(fi) * R * .84); if (q) os(q, np, .05, .05, vc, { luit: !fan }); q = np; }
      }
      const top = flA(nb, ax, R * 1.5);
      corolle(flA(top, ax, -.04), ax, 5, .2, .14, .95 - recul * .75, pointe, flMix(pointe, coeur, .3), { k: 30, bout: .3, ep: .03 });   // les lèvres
      vif(flA(top, ax, -.08), flA(top, ax, .05), .22 + gonfle * .1, .22 + gonfle * .1, coeur, { boule: 3, luit: !fan || gonfle > 0 });
      break;
    }
  }
  if (f.hit > 0) for (const o of B) o.c = flMix(o.c, [255, 220, 210], .5);
  return B;
}
function dessinPlante(d, sp) { d.ligne(8, 15, 8, 7, [90, 140, 60]); d.rect(5, 3, 11, 7, [240, 170, 220]); d.net(8, 5, [255, 240, 140]); }
// Une plante cueillie par un joueur d'en face : elle l'est ici aussi, et repousse au même moment.
function cueillieAilleurs(n, reste) {
  const b = beasts.find(o => o.num === n && o.sp.plante && o.pl && o.pl.port !== 'vive');
  if (!b || !Number.isFinite(reste)) return;
  const fin = t + Math.max(0, Math.min(1800, reste));
  b.repousseT = b.cueillie && b.repousseT > fin ? b.repousseT : fin; b.cueillie = true;
  burst(b.x, b.y, b.z + (b.pl.port === 'geante' ? 2 : .8), 8, 'rgb(' + b.pl.pal[3].join(',') + ')');
}
// Pour le nouveau venu : les plantes déjà cueillies ici, et dans combien de temps elles repoussent.
const plantesCueillies = () => beasts.filter(o => o.sp.plante && o.pl && o.cueillie && o.num !== undefined && o.repousseT > t).flatMap(o => [o.num, Math.round(o.repousseT - t)]);
