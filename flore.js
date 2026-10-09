// Stone Valley — LA FLORE RARE (flore.js)
// Pour chaque biome, douze plantes qu'on ne trouve qu'une à une. TOUTES SONT RARES : même rang, même
// rareté d'ingrédient (« rare »). Les légendaires et les épiques restent à créer. Ce qui les
// distingue n'est plus leur rang mais leur PORT (`port`), qui règle la taille et le comportement :
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
];
const FLORE_RARES = [], FLORE_PRODUITS = [];
const flElide = s => { const m = s.charAt(0).toLowerCase() + s.slice(1); return (/^[aeiouyéèêàâîôûœh]/i.test(m) ? "d'" : 'de ') + m; };
for (const [bio, pal, noms] of FL_BIOMES) {
  noms.split('|').forEach((n, i) => {
    const port = i < 6 ? 'simple' : i < 10 ? 'geante' : 'vive';   // sa stature et sa conduite — pas son rang : toutes sont rares
    let forme = port === 'simple' ? FL_FORMES_R[i] : port === 'geante' ? FL_FORMES_L[i - 6] : i === 10 ? 'gueule' : /^Fouet/.test(n) ? 'fouetteuse' : 'cracheuse';
    if (bio === 12 && forme === 'etoile') forme = 'cristalline';
    const id = 'fl' + bio + '_' + i, [part, fam] = FL_PART[forme], tag = FL_TAGS[(bio + i) % FL_TAGS.length];
    FLORE_RARES.push({ id, n, bio, rang: 'rare', port, forme, pal, ingr: 'p_' + id });
    const dejaNomme = n.toLowerCase().startsWith(part.toLowerCase()), ni = dejaNomme ? n : part + ' ' + flElide(n);   // « Orbe des aigles », pas « Orbe d'orbe des aigles »
    const court = n.charAt(0).toLowerCase() + n.slice(1);    // sous l'icône et dans le nom des plats : la plante, sans la partie
    FLORE_PRODUITS.push([id, ni, court, fam, 3, tag, pal[2].slice()]);   // rareté 3 : « rare », pour toutes
  });
}
const FLORE_SPEC = [
  { id: 'plante_r', n: 'Plante rare', plante: 1, batiment: 1, diet: 'p', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999, shell: [120, 170, 90], dark: [70, 100, 60], leg: [80, 110, 60], oeil: [255, 240, 160], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: '', grimpe: 0 },
  { id: 'plante_l', n: 'Grande plante rare', plante: 1, batiment: 1, diet: 'p', sz: 1, spd: 0, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999, shell: [120, 170, 90], dark: [70, 100, 60], leg: [80, 110, 60], oeil: [255, 240, 160], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: '', grimpe: 0 },
  { id: 'plante_e', n: 'Plante rare vive', plante: 1, epique: 1, diet: 'p', sz: 1.4, spd: 0, vue: 9, peur: 0, herd: 0, cap: 0, mat: 9999, shell: [120, 60, 70], dark: [70, 30, 40], leg: [80, 60, 50], oeil: [255, 80, 60], bio: [], dur: 3, lien: 0, chasse: [], travail: {}, metier: '', grimpe: 0 },
];
const FL_RANG = { rare: 'rare' };
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
  const niv = profondeur();
  for (const [bio, L] of cases) {
    const cat = FLORE_RARES.filter(p => p.bio === bio); if (!cat.length || L.length < 60) continue;
    const nR = Math.max(2, Math.min(7, L.length / 350 | 0));
    for (let k = 0; k < nR; k++) poser(cat[r() * 6 | 0], L, 0);
    if (r() < .45 + Math.min(.3, niv * .02)) poser(cat[6 + (r() * 4 | 0)], L, 2);
    if (niv >= 2 && r() < .35 + Math.min(.25, niv * .015)) poser(cat[10 + (r() * 2 | 0)], L, 1);
  }
  // Le nuage n'a pas de sol : il n'existe qu'en îles volantes. Ses plantes se posent sur les dalles,
  // après toutes les autres (le tirage des plantes du sol ne change pas). Mêmes parts que les autres biomes.
  { const cat = FLORE_RARES.filter(p => p.bio === 17), L = [];
    for (let i = 0; i < WS * WS; i++) if (PlT[i] && !(typeof dalleConjuree === 'function' && dalleConjuree(i))) L.push(i);
    if (cat.length && L.length >= 60) {
      const nR = Math.max(2, Math.min(7, L.length / 350 | 0));
      for (let k = 0; k < nR; k++) poser(cat[r() * 6 | 0], L, 0, true);
      if (r() < .45 + Math.min(.3, niv * .02)) poser(cat[6 + (r() * 4 | 0)], L, 2, true);
      if (niv >= 2 && r() < .35 + Math.min(.25, niv * .015)) poser(cat[10 + (r() * 2 | 0)], L, 1, true);
    } }
}
// ---------- la vie : le vent, la repousse, et la vive qui attaque ----------
function majPlante(b, dt, marionnette) {
  b.t += dt; if (b.hit > 0) b.hit -= dt; b.vx = b.vy = 0;
  const pl = b.pl; if (!pl) return;
  if (b.dead) {
    // le butin : à qui l'a abattue. Chez le gardien, pas si le dernier coup venait d'en face ; chez un
    // suiveur, seulement si c'est lui qui vient de la frapper
    const moi = marionnette ? maintenant() - (b.coupT ?? -99) < 2.5 : !b.tueDistant;
    if (!b.butin && !moi) b.butin = true;
    if (!b.butin) { b.butin = true; const n = 2; metSacIngr(pl.ingr, sacIngr(pl.ingr) + n); say(`${pl.n} est vaincue · +${n} ${INGR[pl.ingr].n.toLowerCase()}`, 3.5); burst(b.x, b.y, b.z + 1, 24, 'rgb(' + pl.pal[3].join(',') + ')'); SON.jouer('ramasse'); majSac(); }
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
  if (b.num !== undefined && RS.ouvert && Autres.size && Compte.uid) diffuser(canalIle(), 'fcueille', { u: Compte.uid, n: b.num, r: Math.round(b.repousseT - t) });
  say(`${FL_RANG[pl.rang]} · ${pl.n} · +${n} ${INGR[pl.ingr].n.toLowerCase()}`, 3);
  burst(b.x, b.y, b.z + (pl.port === 'geante' ? 2 : .8), pl.port === 'geante' ? 30 : 14, 'rgb(' + pl.pal[3].join(',') + ')'); SON.jouer('ramasse'); majSac();
}
// ---------- en volumes ----------
function osPlante(f) {
  const B = [], add = (a, b, w, h, c, luit) => B.push({ a, b, w, h, c, luit });
  const pl = f.pl; if (!pl) return B;
  const [tige, feuille, petale, coeur, pointe] = pl.pal, g = f.graine || 0, fan = f.cueillie;
  const vent = 1 + Math.min(1.5, (typeof Meteo !== 'undefined' && Meteo.vent) || 0), nuit = lumiere() < .36;
  const sway = (k, a) => Math.sin(t * (.8 + g * .4) + k * .7 + g * 9) * a * vent;
  const mix = (a, b, k) => a.map((v, j) => Math.round(v + (b[j] - v) * k));
  const fane = c => fan ? mix(c, [120, 110, 90], .6) : c;
  const lu = !fan;                                       // ce qui luit, tant qu'elle n'est pas cueillie
  const tigeCourbe = (n, L, bx, by, w0, w1, col) => {    // une tige qui ploie : rend ses points
    const pts = [[0, 0, 0]];
    for (let k = 1; k <= n; k++) { const q = k / n, p = pts[k - 1]; pts.push([p[0] + (bx * q + sway(k, .04 * q)) * L / n, p[1] + (by * q + sway(k + 3, .04 * q)) * L / n, p[2] + L / n * (1 - .3 * q * q * (Math.abs(bx) + Math.abs(by)))]); }
    for (let k = 0; k < n; k++) add(pts[k], pts[k + 1], w0 + (w1 - w0) * k / n, w0 + (w1 - w0) * k / n, col);
    return pts;
  };
  const feuilles = (n, L, z0, col) => { for (let k = 0; k < n; k++) { const a = k / n * 6.2832 + g * 3, sw = sway(k, .05); add([0, 0, z0], [Math.cos(a) * L, Math.sin(a) * L, z0 + .08 + sw], L * .45, .03, col); add([Math.cos(a) * L, Math.sin(a) * L, z0 + .08 + sw], [Math.cos(a) * L * 1.35, Math.sin(a) * L * 1.35, z0 + .02 + sw], L * .25, .025, mix(col, pointe, .2)); } };
  const fleur = (c, n, L, ouv, col, colPointe, coeurW) => {   // une corolle : n pétales autour d'un cœur qui luit
    for (let k = 0; k < n; k++) { const a = k / n * 6.2832 + g * 2, ce = Math.cos(ouv), se = Math.sin(ouv), d = [Math.cos(a) * ce, Math.sin(a) * ce, se];
      const m = [c[0] + d[0] * L * .6, c[1] + d[1] * L * .6, c[2] + d[2] * L * .6], e = [c[0] + d[0] * L, c[1] + d[1] * L, c[2] + d[2] * L - L * .08];
      add(c, m, L * .42, .03, fane(col)); add(m, e, L * .3, .025, fane(colPointe)); }
    add([c[0], c[1], c[2] - .01], [c[0], c[1], c[2] + coeurW * .6], coeurW, coeurW, fane(coeur), lu);
  };
  const jour = nuit ? 0 : 1, ouvre = .25 + (1 - jour) * .9;
  switch (pl.forme) {
    case 'etoile': {
      feuilles(5, .28, .02, feuille);
      const p = tigeCourbe(4, .75, sway(0, .15), sway(5, .15), .04, .03, tige), c = p[4];
      fleur(c, 7, .32, fan ? 1.2 : ouvre, petale, pointe, .08);
      break;
    }
    case 'cristalline': {
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g * 3; add([Math.cos(a) * .05, Math.sin(a) * .05, 0], [Math.cos(a) * .3, Math.sin(a) * .3, .75 + (k % 2) * .25], .1, .07, fane(mix(petale, pointe, k / 5)), lu && k % 2 === 0); }
      add([0, 0, .1], [0, 0, .45], .13, .13, fane(coeur), lu);
      break;
    }
    case 'clochettes': {
      feuilles(4, .25, .02, feuille);
      const pts = [[0, 0, 0]]; for (let k = 1; k <= 7; k++) { const q = k / 7; pts.push([q * .9 + sway(k, .03), sway(k + 2, .03), Math.sin(q * 2.6) * 1.0]); }
      for (let k = 0; k < 7; k++) add(pts[k], pts[k + 1], .035, .035, tige);
      for (let k = 3; k <= 7; k++) { const p = pts[k], bas = [p[0] + sway(k + 9, .04), p[1] + sway(k + 4, .04), p[2] - .14]; add(p, bas, .01, .01, tige); add(bas, [bas[0], bas[1], bas[2] - .12], .11, .11, fane(k % 2 ? petale : pointe), lu && nuit); add([bas[0], bas[1], bas[2] - .12], [bas[0], bas[1], bas[2] - .15], .14, .02, fane(petale)); }
      break;
    }
    case 'eventail': {
      for (let k = 0; k < 7; k++) { const a = (k / 6 - .5) * 2.4 + g, L = .9 + (k % 3) * .2; let p = [0, 0, .02];
        for (let j = 1; j <= 3; j++) { const q = j / 3, w = Math.sin(t * 1.4 + k + j) * .05 * vent, n = [Math.cos(a) * L * q * .7, Math.sin(a) * L * q * .7 + w, L * (q * 1.1 - q * q * .55)]; add(p, n, .14 - j * .03, .03, fane(mix(feuille, j === 3 ? pointe : petale, j / 4))); p = n; } }
      break;
    }
    case 'spirale': {
      feuilles(4, .22, .02, feuille);
      for (let k = 0; k < 3; k++) { const a = k / 3 * 6.2832 + g * 2, h = .6 + k * .2, deroule = fan ? 0 : .6 + .4 * Math.sin(t * .3 + k); let p = [Math.cos(a) * .1, Math.sin(a) * .1, 0], q = [Math.cos(a) * .12, Math.sin(a) * .12, h];
        add(p, q, .04, .04, tige); let ang = 0, r = .16;
        for (let j = 0; j < 8; j++) { ang += .8 * (1.4 - deroule * .6); r *= .82; const n = [q[0] + Math.cos(a) * Math.sin(ang) * r, q[1] + Math.sin(a) * Math.sin(ang) * r, q[2] + Math.cos(ang) * r * .9]; add(q, n, .05 - j * .004, .04, fane(mix(feuille, pointe, j / 8))); q = n; }
        add(q, [q[0], q[1], q[2] + .03], .06, .06, fane(coeur), lu); }
      break;
    }
    case 'orbe': {
      feuilles(4, .2, .02, feuille);
      for (let k = 0; k < 4; k++) { const a = k / 4 * 6.2832 + g * 4, h = .55 + (k * .23 + g) % .6, bob = Math.sin(t * 1.2 + k * 1.7) * .05;
        const top = [Math.cos(a) * .18 + sway(k, .05), Math.sin(a) * .18 + sway(k + 1, .05), h + bob]; add([Math.cos(a) * .04, Math.sin(a) * .04, 0], top, .02, .02, tige);
        add([top[0], top[1], top[2]], [top[0], top[1], top[2] + .16], .15, .15, fane(k % 2 ? coeur : petale), lu); add([top[0], top[1], top[2] + .16], [top[0], top[1], top[2] + .19], .08, .03, tige); }
      break;
    }
    case 'arbuste': {
      const p = tigeCourbe(3, .6, sway(0, .05), 0, .09, .07, tige);
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832 + g * 5, r = .3 + (k % 3) * .15, z = .6 + (k % 4) * .14 + sway(k, .03);
        add(p[3], [Math.cos(a) * r * .6, Math.sin(a) * r * .6, z - .05], .04, .04, tige);
        add([Math.cos(a) * r, Math.sin(a) * r, z], [Math.cos(a) * r, Math.sin(a) * r, z + .16], .26, .22, fane(k % 3 ? petale : pointe)); }
      add([0, 0, .9], [0, 0, 1.0], .55, .14, fane(feuille));
      break;
    }
    // ---- les géantes : elles bougent ----
    case 'colosse': {
      const respire = .5 + .5 * Math.sin(t * .8 + g * 6);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g, z = .4 + (k % 3) * .5, sw = sway(k, .1); add([0, 0, z], [Math.cos(a) * 1.2, Math.sin(a) * 1.2, z + .3 + sw], .55, .04, feuille); add([Math.cos(a) * 1.2, Math.sin(a) * 1.2, z + .3 + sw], [Math.cos(a) * 1.7, Math.sin(a) * 1.7, z + .1 + sw], .3, .03, mix(feuille, pointe, .3)); }
      const p = tigeCourbe(6, 3.6, sway(0, .25), sway(4, .25), .3, .2, tige), c = p[6];
      fleur(c, 10, 1.25, fan ? 1.3 : (nuit ? .95 : .2 + respire * .25), petale, pointe, .36);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + t * .2, e = [c[0] + Math.cos(a) * .3, c[1] + Math.sin(a) * .3, c[2] + .7 + Math.sin(t * 2 + k) * .05]; add([c[0], c[1], c[2] + .2], e, .025, .025, tige); add(e, [e[0], e[1], e[2] + .06], .09, .09, fane(pointe), lu); }
      break;
    }
    case 'saule': {
      const p = tigeCourbe(5, 2.8, sway(0, .06), 0, .4, .26, tige), top = p[5];
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832 + g, br = [top[0] + Math.cos(a) * 1.5, top[1] + Math.sin(a) * 1.5, top[2] + .4]; add(top, br, .13, .13, tige);
        for (let j = 0; j < 3; j++) { let q = [br[0] + Math.cos(a + j) * .2, br[1] + Math.sin(a + j) * .2, br[2]];
          for (let m = 1; m <= 5; m++) { const n = [q[0] + Math.sin(t * .9 + k + j + m * .5) * .1 * vent, q[1] + Math.cos(t * .7 + k * 2 + m * .4) * .08 * vent, q[2] - .5]; add(q, n, .05, .05, fane(mix(feuille, petale, m / 5)), lu && m === 5); q = n; } } }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g, z = top[2] + .25 + (k % 2) * .2; add([top[0] + Math.cos(a) * .55, top[1] + Math.sin(a) * .55, z], [top[0] + Math.cos(a) * .55, top[1] + Math.sin(a) * .55, z + .45], .8, .55, fane(mix(feuille, petale, .12 * (k % 3)))); }
      add([top[0], top[1], top[2] + .45], [top[0], top[1], top[2] + .95], .9, .7, fane(feuille));
      break;
    }
    case 'meduse': {
      const z0 = 2.4 + Math.sin(t * .9 + g * 5) * .25, pulse = .5 + .5 * Math.sin(t * 1.6 + g * 3);
      add([0, 0, 0], [sway(0, .2), sway(3, .2), z0 - .3], .025, .025, tige);                     // le fil qui la tient au sol
      add([0, 0, z0], [0, 0, z0 + .45], 1.6 + pulse * .15, .5, fane(petale), lu && nuit); add([0, 0, z0 + .45], [0, 0, z0 + .7], 1.0, .3, fane(pointe), lu);
      add([0, 0, z0 - .05], [0, 0, z0 + .05], 1.8 + pulse * .2, .06, fane(coeur), lu);
      for (let k = 0; k < 10; k++) { const a = k / 10 * 6.2832; let q = [Math.cos(a) * .75, Math.sin(a) * .75, z0];
        for (let m = 1; m <= 6; m++) { const n = [q[0] + Math.sin(t * 1.3 + k + m * .7) * .08, q[1] + Math.cos(t * 1.1 + k + m * .6) * .08, q[2] - .32]; add(q, n, .04, .04, fane(mix(petale, coeur, m / 6)), lu && m > 4); q = n; } }
      break;
    }
    case 'lumiere': {
      const p = tigeCourbe(5, 2.4, sway(0, .05), 0, .38, .25, tige), top = p[5];
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g; add(top, [top[0] + Math.cos(a) * 1.2, top[1] + Math.sin(a) * 1.2, top[2] + .5], .14, .14, tige); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832 + g * 2, r = k % 2 ? 1.0 : .7, z = top[2] + .55 + (k % 3) * .22 + sway(k, .04);   // une ramure en touffes, pas une planche
        add([top[0] + Math.cos(a) * r, top[1] + Math.sin(a) * r, z], [top[0] + Math.cos(a) * r, top[1] + Math.sin(a) * r, z + .55], .95, .7, fane(mix(feuille, k % 2 ? pointe : tige, .15))); }
      add([top[0], top[1], top[2] + .9], [top[0], top[1], top[2] + 1.6], 1.2, .9, fane(feuille));
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.2832 + t * .25, r = 1.1 + (k % 3) * .2, z = top[2] + .5 + (k % 4) * .25; add([top[0] + Math.cos(a) * r, top[1] + Math.sin(a) * r, z], [top[0] + Math.cos(a) * r, top[1] + Math.sin(a) * r, z - .16], .14, .14, fane(k % 2 ? coeur : pointe), lu); }
      break;
    }
    // ---- les vives : elles attaquent ----
    case 'gueule': {
      const arme = f.etat === 'arme' ? Math.min(1, f.armeT / .6) : 0, mord = f.etat === 'frappe' ? Math.max(0, 1 - f.frappeT / .25) : 0;
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g; add([0, 0, .05], [Math.cos(a) * .8, Math.sin(a) * .8, .25 + sway(k, .05)], .32, .04, feuille); for (let j = 1; j <= 3; j++) add([Math.cos(a) * .25 * j, Math.sin(a) * .25 * j, .12 + j * .04], [Math.cos(a) * .25 * j, Math.sin(a) * .25 * j, .22 + j * .04], .02, .02, [230, 220, 200]); }
      const cb = f.cible ?? 0, rel = cb - f.dir, cx = Math.cos(rel), sy = Math.sin(rel), lance = mord * 1.3 - arme * .4;
      const pts = [[0, 0, 0], [-cx * .2 + sway(1, .05), -sy * .2, .7], [cx * (.1 + lance * .4), sy * (.1 + lance * .4), 1.3 + arme * .2], [cx * (.4 + lance), sy * (.4 + lance), 1.75 + arme * .3 - mord * .3]];
      for (let k = 0; k < 3; k++) add(pts[k], pts[k + 1], .18 - k * .03, .18 - k * .03, tige);
      const H = pts[3], ouv = (f.dead ? 0 : .25 + arme * .9) * (1 - mord), fw = [cx, sy, 0];
      for (const s of [1, -1]) {                       // les deux mâchoires, et leurs dents
        const d = [fw[0] * Math.cos(ouv * s) , fw[1] * Math.cos(ouv * s), Math.sin(ouv * s)], e = [H[0] + d[0] * .75, H[1] + d[1] * .75, H[2] + d[2] * .75];
        add(H, e, .6, .1, fane(s > 0 ? petale : mix(petale, tige, .3)));
        for (let k = 0; k < 6; k++) { const q = (k + .5) / 6, b0 = [H[0] + d[0] * .75 * q - sy * (q - .5) * .5, H[1] + d[1] * .75 * q + cx * (q - .5) * .5, H[2] + d[2] * .75 * q]; add(b0, [b0[0], b0[1], b0[2] - s * .1], .025, .04, [240, 236, 220]); }
      }
      if (ouv > .3) add(H, [H[0] + fw[0] * .4, H[1] + fw[1] * .4, H[2] + .02], .15, .08, [200, 40, 60], true);   // la langue
      add([H[0] - fw[0] * .05, H[1] - fw[1] * .05, H[2]], [H[0], H[1], H[2]], .3, .3, fane(coeur), arme > .3);
      break;
    }
    case 'fouetteuse': {
      add([0, 0, 0], [0, 0, .5], .7, .55, fane(tige)); add([0, 0, .45], [0, 0, .6], .5, .3, fane(petale));
      const cb = f.cible ?? 0, rel = cb - f.dir, fr = f.etat === 'frappe' ? Math.max(0, 1 - f.frappeT / .35) : 0, ar = f.etat === 'arme' ? Math.min(1, f.armeT / .6) : 0;
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g, frappe = k === 0 ? fr : 0, arme = k === 0 ? ar : 0; let q = [0, 0, .5];
        for (let m = 1; m <= 8; m++) { const q2 = m / 8, A = frappe > 0 ? rel : a + Math.sin(t * 1.8 + k * 2 + m * .4) * .3, L = frappe > 0 ? .55 : .3;
          const z = frappe > 0 ? .5 + Math.sin(q2 * Math.PI) * 1.2 - q2 * .5 : .5 + Math.sin(q2 * 2.4) * (1.6 + arme * .8) + Math.sin(t * 2 + k + m) * .08;
          const n = [q[0] + Math.cos(A) * L, q[1] + Math.sin(A) * L, z]; add(q, n, .07 - m * .005, .07 - m * .005, fane(mix(tige, petale, q2)));
          if (m % 2 === 0) add(n, [n[0] + Math.cos(A + 1.5) * .12, n[1] + Math.sin(A + 1.5) * .12, n[2] + .05], .02, .02, [230, 220, 200]);
          q = n; }
        add(q, [q[0], q[1], q[2] + .05], .1, .1, fane(pointe), lu); }
      break;
    }
    case 'cracheuse': {
      const gonfle = f.etat === 'arme' ? Math.min(1, f.armeT / .9) : 0, pulse = .5 + .5 * Math.sin(t * 2.5 + g * 4);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g; add([0, 0, .05], [Math.cos(a) * .7, Math.sin(a) * .7, .3], .3, .04, feuille); add([Math.cos(a) * .35, Math.sin(a) * .35, .5], [Math.cos(a) * .55, Math.sin(a) * .55, .7], .03, .03, [230, 220, 200]); }
      add([0, 0, 0], [0, 0, .35], .25, .25, tige);
      const R = .55 + gonfle * .2 + pulse * .03;
      add([0, 0, .35], [0, 0, .35 + R * 1.5], R * 1.6, R * 1.5, fane(petale));
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g; add([Math.cos(a) * R * .8, Math.sin(a) * R * .8, .5], [Math.cos(a) * R * .75, Math.sin(a) * R * .75, .35 + R * 1.3], .04, .04, fane(coeur), lu); }   // les veines
      add([0, 0, .35 + R * 1.5], [0, 0, .5 + R * 1.5 + gonfle * .1], .3, .3, fane(pointe)); add([0, 0, .5 + R * 1.5 + gonfle * .1], [0, 0, .55 + R * 1.5 + gonfle * .1], .2, .2, fane(coeur), lu || gonfle > 0);
      break;
    }
  }
  if (f.hit > 0) for (const o of B) o.c = mix(o.c, [255, 220, 210], .5);
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
