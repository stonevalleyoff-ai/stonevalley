// Stone Valley — LA FAUNE PARTAGÉE (faune.js)
// Tous les joueurs d'une île voient les mêmes bêtes, aux mêmes places, qui font la même chose. Un seul
// appareil les fait vivre : le GARDIEN de l'île. Les autres, les SUIVEURS, n'en calculent plus l'esprit :
// leurs bêtes sont des marionnettes qui glissent vers ce qu'en dit le gardien, et leurs pattes, leur
// voix, leurs coups de queue s'animent d'eux-mêmes.
//  - QUI GARDE : celui qui garde depuis le plus longtemps (fa, en secondes) ; à trois secondes près, le
//    plus petit identifiant de compte. Seul sur son île, on est son propre gardien : le nouveau venu
//    arrive donc toujours chez un gardien plus ancien que lui, et c'est lui qui suit. Le gardien parti
//    (départ annoncé, ou quatre secondes de silence), le plus petit identifiant des suiveurs reprend la
//    faune telle qu'il la voyait.
//  - L'INVENTAIRE : un suiveur demande la faune entière (« faune? ») ; le gardien la lui envoie (« faune »).
//  - EN CONTINU, dans la position du gardien (champ f) : les bêtes proches de chaque suiveur, quelques
//    autres à tour de rôle, les naissances (espèce, robe, âge), les retraits, l'heure du jour. Realtime
//    compte les messages et non leur taille : tant que le gardien bouge, la faune ne coûte rien de plus ;
//    immobile, il parle quatre fois par seconde au lieu d'une fois toutes les 1,5 s.
//  - LES GESTES : un coup d'un suiveur sur une bête (« fcoup »), une bête qu'il lie ou monte (« flien ») ;
//    le coup d'une bête sur un joueur d'en face (« morsure », encaissé chez lui) ; le tir d'un automate
//    (« ftir »), rejoué chez les suiveurs, où chacun encaisse ce qui le touche.
//  - LES BÊTES À PART (section 58) : la Tisseuse, le dragon, les horreurs, les plantes épiques, les
//    villageois, les nomades et leur seuil, l'escouade, les machines du souterrain (un gardien par étage).
//    Elles disent en plus leur « sac » (s) : ce qui se voit de leur état et qu'un suiveur ne devine pas
//    (la tête du Mille-gueules sous la terre, l'arme que la Tisseuse arme, la gorge du dragon…). Chez le
//    suiveur, chacune a sa marionnette (VISUEL_FAUNE) : le pas de la Tisseuse, les anneaux du
//    Mille-gueules, le battement du dragon, ses sons et ses secousses.
//  - LE MONDE : le temps qu'il fait et les éclairs, le nectar de la fourmilière, le seuil des nomades,
//    le portail de l'escouade — dits par le gardien ; les gestes d'un suiveur sur ce monde (un sort, une
//    offrande, puiser) passent par « fgeste ».
// Restent propres à chaque appareil : les compagnes (déjà partagées par leur maître) et les visions du
// Korlaz, qui n'existent que dans la tête de qui les voit (voir LISEZ-MOI, sections 57 et 58).
// Le jeu (index.html) appelle, s'ils existent : faunePartagee, fauneGardien, fauneSuiveur,
// fauneMarionnette, fauneEntete, fauneDoitEnvoyer, fauneDistant, fauneDepart, fauneEvenement, fauneCoup,
// fauneLien, fauneMorsure, fauneTir, majFaune, fauneEtat, fauneBascule.
const FAUNE_PAS = .3, FAUNE_AOI = 48, FAUNE_TOUR = 6, FAUNE_RAPPEL = 3;
const FAUNE_REGLAGE = 'stone_valley:faune';
const FA = {
  actif: (() => { try { return localStorage.getItem(FAUNE_REGLAGE) !== '0'; } catch (e) { return true; } })(),
  role: 'gardien',          // 'gardien' (seul, ou suivi par d'autres) ou 'suiveur'
  gardien: null,            // l'identifiant du gardien suivi
  depuis: 0,                // maintenant() à la prise de garde : son ancienneté, fa
  sansGardien: 0,           // depuis quand le suiveur n'a plus de gardien (relève de secours)
  prochain: 0,              // le prochain numéro de bête (gardien)
  connus: new Set(),        // les numéros partagés au dernier envoi (gardien), pour voir les retraits
  naissances: [],           // [descripteur, envois restants]
  retraits: [],             // [numéro, envois restants]
  tour: 0,                  // le tour de rôle des bêtes lointaines
  dernierF: -99,            // le dernier envoi de faune
  electT: 0,                // la dernière élection
  demandeT: -99,            // la dernière demande d'inventaire (suiveur)
  repondu: new Map(),       // uid → dernière réponse d'inventaire (gardien)
  inventaire: false,        // l'inventaire du gardien suivi est arrivé
  recuT: -99,               // la dernière nouvelle du gardien
  possible: false,          // le partage était-il possible à la dernière élection
  ecoute: 0,                // jusqu'à quand on écoute, sans se dire gardien, à l'arrivée ou au retour
  compte: false,            // le compteur de numéros a-t-il été recalé sur l'île
  meteoT: -99,              // le dernier envoi du temps qu'il fait (gardien), et ce qu'il disait
  meteoDit: '',
  mondeDit: '', mondeT: -99,  // la dernière nouvelle du monde (gardien)
  extra: null,              // ce qu'ajoute le prochain coup porté à un joueur d'en face (recul, secousse, mot)
  eclair: 0,                // le numéro du dernier éclair, et combien de fois le redire
  eclairRedit: 0,
  eclairVu: 0,              // le dernier éclair reçu (suiveur)
};
// ---------- quelles bêtes ----------
// Les compagnes sont à leur maître, les gardiennes d'un campement pillé à celui qui pille, les visions
// du Korlaz à qui les voit. Les maisons et les plantes rares ne bougent pas (la cueillette se dit à part) ;
// la plante épique, elle, attaque : elle est partagée.
function faunePartagee(b) {
  if (!b || b.tame || b.loin || b.gardeCamp || b.retire) return false;
  const sp = b.sp;
  if (sp.illusion) return false;
  if (sp.plante) return !!sp.epique;
  return !sp.batiment;
}
const faunePossible = () => FA.actif && Compte.dedans && RS.ouvert;
const fauneGardien = () => faunePossible() && FA.role === 'gardien';
const fauneSuiveur = () => faunePossible() && FA.role === 'suiveur' && FA.inventaire;
// les joueurs de l'île qui partagent la faune, et parmi eux ceux qui me suivent
const fauneJoueurs = () => [...Autres.values()].filter(j => j.fv && maintenant() - j.vu < LOIN_VIE);
const fauneSuiveurs = () => fauneJoueurs().filter(j => !j.fg);
function indexFaune() {
  const m = new Map();
  for (const b of beasts) if (b.num !== undefined && faunePartagee(b)) m.set(b.num, b);
  return m;
}
const r3 = v => Math.round(v * 1000) / 1000;
const ancienneteFaune = () => FA.role === 'gardien' ? Math.max(0, maintenant() - FA.depuis) : 0;

// ---------- qui garde ----------
function devenirGardien() {
  if (FA.role === 'gardien') return;
  FA.role = 'gardien'; FA.gardien = Compte.uid; FA.depuis = maintenant(); FA.inventaire = false; FA.ecoute = 0;
  let n = 0; for (const b of beasts) if (b.num !== undefined && b.num >= n) n = b.num + 1;
  FA.prochain = Math.max(FA.prochain, n); FA.compte = true;
  FA.connus = new Set(indexFaune().keys()); FA.naissances = []; FA.retraits = [];
  for (const b of beasts) if (b.num !== undefined) { b.as = null; b.mur = null; b.cx = undefined; }   // les marionnettes reprennent vie
  if (Autres.size) say('vous faites vivre la faune de l\'île', 2.4);
}
function devenirSuiveur(g) {
  if (FA.role === 'suiveur' && FA.gardien === g) return;
  const etaitGardien = FA.role === 'gardien';
  FA.role = 'suiveur'; FA.gardien = g; FA.inventaire = false; FA.sansGardien = 0;
  demanderInventaire(true);
  const j = Autres.get(g);
  if (etaitGardien && j) say(j.nom + ' fait vivre la faune de l\'île', 2.4);
}
// Celui-là garde-t-il mieux que moi ? Plus ancien de trois secondes, ou à égalité le plus petit identifiant.
const gardeMieux = (fa, u, fa0, u0) => fa > fa0 + 3 || (Math.abs(fa - fa0) <= 3 && u < u0);
function elireFaune() {
  // Hors du partage (coupé, hors ligne, sous terre), on fait vivre ses bêtes pour soi. En y revenant, on
  // repart sans ancienneté : on suit le gardien de l'île plutôt que d'imposer une faune qui a divergé.
  // Et l'on écoute d'abord quatre secondes sans se dire gardien (chacun donne sa position au moins toutes
  // les deux secondes) : celui qui arrive, ou revient, trouve le gardien en place avant de lui disputer
  // l'île. Son ancienneté ne compte qu'à la fin de l'écoute.
  const possible = faunePossible();
  if (possible !== FA.possible) { FA.possible = possible; FA.ecoute = maintenant() + 4; FA.depuis = FA.ecoute; }
  if (!possible) { if (FA.role !== 'gardien') { FA.role = 'gardien'; FA.inventaire = false; } return; }
  const js = fauneJoueurs(), moi = Compte.uid;
  // le meilleur de ceux qui se disent gardiens
  let best = null;
  for (const j of js) if (j.fg && (!best || gardeMieux(j.fa, j.u, best.fa, best.u))) best = j;
  if (FA.role === 'gardien') {
    if (best && (maintenant() < FA.ecoute || gardeMieux(best.fa, best.u, ancienneteFaune(), moi))) devenirSuiveur(best.u);
    return;
  }
  // suiveur
  if (best) { FA.sansGardien = 0; if (best.u !== FA.gardien) devenirSuiveur(best.u); return; }
  // plus personne ne garde : le plus petit identifiant reprend ; s'il tarde, on reprend soi-même
  if (!FA.sansGardien) FA.sansGardien = maintenant();
  const premier = [moi, ...js.map(j => j.u)].sort()[0];
  if (premier === moi || maintenant() - FA.sansGardien > 6) devenirGardien();
}
function demanderInventaire(tout) {
  if (!FA.gardien || (!tout && maintenant() - FA.demandeT < 2.5)) return;
  FA.demandeT = maintenant();
  diffuser(canalIle(), 'faune?', { u: Compte.uid, a: FA.gardien });
}

// ---------- ce que dit le gardien ----------
// Une bête, dans l'inventaire et les naissances : tout ce qu'il faut pour la faire naître ailleurs, et la
// reprendre si l'on devient gardien à son tour.
function descrFaune(b) {
  const d = { n: b.num, s: b.sp.id, x: r2(b.x), y: r2(b.y), z: r2(b.z), d: r2(b.dir || 0), e: b.etat, v: r3(b.pv), a: Math.round(b.age || 0),
    h: b.home ? [r2(b.home[0]), r2(b.home[1])] : undefined, f: r3(b.faim || 0), so: r3(b.soif || 0), nr: r3(b.nrj || 0) };
  if (b.variante) d.w = b.variante;
  if (b.mere && b.mere.num !== undefined) d.m = b.mere.num;
  if (b.male !== undefined) d.ma = b.male ? 1 : 0;
  if (b.ech && b.ech !== 1) d.ec = r2(b.ech);
  if (b.dead) d.dd = r2(b.dead);
  const k = identiteFaune(b); if (k) d.k = k;
  const sac = sacFaune(b); if (sac) d.sa = sac;          // (s est l'espèce)
  return d;
}
// La cible d'une mise en joue, dite de façon que chaque appareil la retrouve : un joueur, ou une bête.
const refCible = c => !c ? null : c === P ? Compte.uid : c.distant && c.u ? c.u : c.num !== undefined ? c.num : null;
const cibleDeRef = (v, idx) => v == null ? null : typeof v === 'string' ? (v === Compte.uid ? P : Autres.get(v) || null) : idx.get(v) || null;
// Une bête, en continu : place, cap, état, vie, vitesse, et ce qui se voit de son allure.
function etatFaune(b) {
  const x = {};
  if (b.alarm > .05) x.a = r2(b.alarm);
  if (b.hit > 0) x.h = r2(b.hit);
  if (b.dead) x.d = r2(b.dead);
  if (b.ramasse > .02) x.r = r2(b.ramasse);
  if (b.camo > .02) x.c = r2(b.camo);
  if (b.joue > 0) { x.j = r2(b.joue); const v = refCible(b.viseeC); if (v != null) x.v = v; }
  if (b.enfoui > 0) x.en = r2(b.enfoui);
  if (b.enVol) x.ev = 1;
  if (b.bat > .02) x.ba = r2(b.bat);
  if (Math.abs(b.roll || 0) > .02) x.ro = r2(b.roll);
  if (b.recul > .02) x.re = r2(b.recul);
  if (b.cou !== undefined) { x.cu = r2(b.cou); x.ai = r2(b.aile || 0); x.te = r2(b.tete || 0); }
  if (b.ruade > .02) x.ru = r2(b.ruade);
  if (b.ech && b.ech !== 1) x.ec = r2(b.ech);
  if (b.englue > t) x.eg = r2(b.englue - t);              // figée par la fange ou la glu
  if (b.gangue > t) x.gg = r2(b.gangue - t);              // prise dans la gangue : tout coup pèse moitié plus, d'où qu'il vienne
  if (b.sp.fam !== 'automate' && Math.abs((b.faim || 0) - (b._fFm ?? -1)) > .04) { x.fm = r2(b.faim || 0); b._fFm = b.faim || 0; }   // la faim se lit sur la fiche de la bête visée : dite quand elle a bougé
  const sac = sacFaune(b);                             // une bête à part : son sac, quand il a changé (et de temps en temps)
  if (sac) { const sig = JSON.stringify(sac); if (sig !== b._fSac || maintenant() - (b._fSacT || -99) > 2.5) { x.s = sac; b._fSac = sig; b._fSacT = maintenant(); } }
  b._fS = [b.x, b.y, b.etat, b.pv];                    // ce qu'on en a dit : rien n'a bougé, rien à redire
  const e = [b.num, r2(b.x), r2(b.y), r2(b.z), r2(b.dir || 0), b.etat, r2(b.pv)];
  const vx = r2(b.vx || 0), vy = r2(b.vy || 0), plein = Object.keys(x).length > 0;
  if (vx || vy || plein) e.push(vx, vy);               // à l'arrêt et sans rien de particulier : sept nombres suffisent
  if (plein) e.push(x);
  return e;
}
// Quelque chose a-t-il changé autour des suiveurs depuis la dernière nouvelle ? Sinon, le gardien
// immobile se tait comme avant (une position toutes les 1,5 s), et la faune y passe quand même.
function fauneABouge(suiv) {
  if (FA.naissances.length || FA.retraits.length) return true;
  const A2 = FAUNE_AOI * FAUNE_AOI;
  for (const b of beasts) {
    if (b.num === undefined || !faunePartagee(b) || !suiv.some(j => (j.x - b.x) ** 2 + (j.y - b.y) ** 2 < A2)) continue;
    const s = b._fS;
    if (!s || (s[0] - b.x) ** 2 + (s[1] - b.y) ** 2 > .04 || s[2] !== b.etat || Math.abs(s[3] - b.pv) > .01 || b.hit > 0 || b.joue > 0) return true;
    if (SAC_FAUNE[sorteFaune(b)] && JSON.stringify(sacFaune(b)) !== b._fSac) return true;
  }
  return false;
}
// Le champ f de la position du gardien : les bêtes que voient ses suiveurs, et le reste à tour de rôle.
function chargeFaune(suiv) {
  const idx = indexFaune(), l = [], vus = new Set(), A2 = FAUNE_AOI * FAUNE_AOI;
  for (const b of idx.values()) if (suiv.some(j => (j.x - b.x) ** 2 + (j.y - b.y) ** 2 < A2)) { l.push(etatFaune(b)); vus.add(b.num); }
  const loin = [...idx.values()].filter(b => !vus.has(b.num));
  for (let k = 0; k < Math.min(FAUNE_TOUR, loin.length); k++) l.push(etatFaune(loin[(FA.tour++) % loin.length]));
  // les retraits : ce qui était partagé et ne l'est plus (mort et emportée, liée, montée…)
  for (const n of FA.connus) if (!idx.has(n)) FA.retraits.push([n, FAUNE_RAPPEL]);
  FA.connus = new Set(idx.keys());
  const f = { b: l, h: r3(horloge) };
  const me = meteoFaune();
  if (me[0] + me[1] !== FA.meteoDit || maintenant() - FA.meteoT > 3) { f.me = me; FA.meteoDit = me[0] + me[1]; FA.meteoT = maintenant(); }
  if (FA.eclairRedit > 0) { f.ec = FA.eclair; FA.eclairRedit--; }
  const m = mondeFaune(), sm = JSON.stringify(m);       // la fourmilière, le seuil des nomades, le portail de l'escouade
  const anime = Escouade && (Escouade.etat !== 'dehors' || Escouade.sauts.length);   // le portail s'ouvre, se ferme : dit à chaque pas
  if (sm !== FA.mondeDit || maintenant() - FA.mondeT > 3 || anime) { f.w = m; FA.mondeDit = sm; FA.mondeT = maintenant(); }
  if (FA.naissances.length) { f.n = FA.naissances.map(e => e[0]); FA.naissances = FA.naissances.filter(e => --e[1] > 0); }
  if (FA.retraits.length) { f.r = FA.retraits.map(e => e[0]); FA.retraits = FA.retraits.filter(e => --e[1] > 0); }
  return f;
}
// L'en-tête de faune de chaque position : qui partage, qui garde, depuis quand, dans quel état est le joueur
// (ce que les bêtes du gardien doivent savoir de lui), et pour le gardien, ses bêtes.
function fauneEntete(now) {
  if (!faunePossible()) return {};
  const fx = (joueurCalme() ? 1 : 0) | (sousAbri() ? 2 : 0) | (effet('invisible') ? 4 : 0) | (effet('silence') ? 8 : 0) | (effet('repousse') ? 16 : 0);
  const e = { fv: 1, fg: FA.role === 'gardien' && maintenant() >= FA.ecoute ? 1 : 0, fa: Math.round(ancienneteFaune()), fx };
  const br = bruitJoueur(); if (br) e.br = r2(br);          // ce que le Silencieux entend de lui
  if (Fourmi) e.oc = r2(confColonie());                     // ce que la colonie des oglodons pense de lui
  if (FA.role === 'gardien' && now - FA.dernierF >= FAUNE_PAS * .8) {
    const suiv = fauneSuiveurs();
    if (suiv.length) { FA.dernierF = now; e.f = chargeFaune(suiv); }
  }
  return e;
}
function fauneDoitEnvoyer(now) {
  if (!fauneGardien() || now - FA.dernierF < FAUNE_PAS) return false;
  const suiv = fauneSuiveurs();
  return suiv.length > 0 && (FA.eclairRedit > 0 || Meteo.de + Meteo.vers !== FA.meteoDit || fauneABouge(suiv));
}

// ---------- ce que reçoit le suiveur ----------
function naitreFaune(d, idx) {
  const sp = specById[d.s]; if (!sp) return null;
  const b = naitre(sp, d.x, d.y, d.a);
  b.num = d.n; b.z = d.z; b.dir = b.dirT = d.d; b.etat = d.e || 'errer'; b.pv = d.v;
  if (d.w) b.variante = d.w;
  if (d.h) b.home = d.h.slice();
  if (d.f != null) { b.faim = d.f; b.soif = d.so; b.nrj = d.nr; }
  if (d.ma != null) b.male = !!d.ma;
  if (d.ec) b.ech = d.ec;
  if (d.dd) b.dead = d.dd;
  b.cx = b.x; b.cy = b.y; b.cz = b.z; b.cvx = b.cvy = 0; b.dirC = b.dir;
  beasts.push(b); idx.set(b.num, b);
  if (d.k) poserIdentite(b, d.k, idx);
  if (Array.isArray(d.sa)) appliquerSac(b, d.sa, idx);
  if (sorteFaune(b) === 'mille') { b.dir = d.d; initMille(b); }
  return b;
}
function retirerFaune(b) {
  const i = beasts.indexOf(b); if (i >= 0) beasts.splice(i, 1);
  b.retire = true; b.dead = b.dead || 1;
}
// L'inventaire : on garde ce qui est déjà là (même numéro, même espèce), on fait naître ce qui manque,
// on retire ce que le gardien n'a plus.
function recevoirInventaire(d) {
  const idx = indexFaune(), vus = new Set();
  for (const e of d.l || []) {
    vus.add(e.n);
    let b = idx.get(e.n);
    if (b && b.sp.id !== e.s) { retirerFaune(b); idx.delete(e.n); b = null; }
    if (!b) { naitreFaune(e, idx); continue; }
    b.x = b.cx = e.x; b.y = b.cy = e.y; b.z = b.cz = e.z; b.dir = b.dirT = b.dirC = e.d; b.cvx = b.cvy = 0;
    b.etat = e.e || b.etat; b.pv = e.v; b.age = e.a; b.variante = e.w || undefined;
    if (e.h) b.home = e.h.slice();
    if (e.f != null) { b.faim = e.f; b.soif = e.so; b.nrj = e.nr; }
    if (e.ma != null) b.male = !!e.ma;
    b.dead = e.dd || 0; b.as = null; b.mur = null;
    if (e.k) poserIdentite(b, e.k, idx);
    if (Array.isArray(e.sa)) appliquerSac(b, e.sa, idx);
  }
  for (const [n, b] of idx) if (!vus.has(n)) retirerFaune(b);
  for (const e of d.l || []) if (e.m !== undefined) { const b = idx.get(e.n), m = idx.get(e.m); if (b && m) b.mere = m; }
  if (Number.isInteger(d.pn)) FA.prochain = Math.max(FA.prochain, d.pn);
  FA.compte = false;                                    // à reprendre au-delà de tout ce qu'on vient de recevoir
  if (Number.isFinite(d.h)) horloge = d.h;
  if (Array.isArray(d.me)) appliquerMeteo(d.me, true);
  if (d.w) appliquerMonde(d.w, indexFaune());
  FA.inventaire = true; FA.recuT = maintenant();
}
function appliquerFaune(f) {
  const idx = indexFaune();
  let manque = false;
  for (const d of f.n || []) if (!idx.has(d.n)) naitreFaune(d, idx);
  for (const n of f.r || []) { const b = idx.get(n); if (b) { retirerFaune(b); idx.delete(n); } }
  const now = maintenant();
  for (const e of f.b || []) {
    const b = idx.get(e[0]);
    if (!b) { manque = true; continue; }
    const x = e[9] || {};                               // la vitesse (7, 8) et le reste (9) manquent quand ils sont nuls
    if (b.dead && !x.d) continue;                       // tuée ici : on ne la relève pas
    if (b.etat !== e[5]) { b.etatAvant = b.etat; b.etatNeuf = true; }
    b.cx = e[1]; b.cy = e[2]; b.cz = e[3]; b.dirC = e[4]; b.etat = e[5]; b.cvx = e[7] || 0; b.cvy = e[8] || 0; b.fauneT = now;
    if (!(now - (b.coupT || -99) < .8)) b.pv = e[6];    // un coup qu'on vient de porter : le gardien ne l'a peut-être pas encore compté
    b.alarm = x.a || 0; b.ramasse = x.r || 0; b.camo = x.c || 0; b.enfoui = x.en || 0;
    b.joue = x.j || 0; b.viseeC = x.j ? cibleDeRef(x.v, idx) : null;
    b.enVol = !!x.ev; b.bat = x.ba || 0; b.roll = x.ro || 0;
    if (x.re) b.recul = Math.max(b.recul || 0, x.re);
    if (x.cu !== undefined) { b.cou = x.cu; b.aile = x.ai; b.tete = x.te; }
    if (x.ru) b.ruade = Math.max(b.ruade || 0, x.ru);
    if (x.ec) b.ech = x.ec;
    if (x.eg) b.englue = t + x.eg; if (x.gg) b.gangue = t + x.gg;
    if (x.fm !== undefined) b.faim = x.fm;
    if (x.h) b.hit = Math.max(b.hit || 0, x.h);
    if (x.d && !b.dead) b.dead = x.d;
    if (Array.isArray(x.s)) appliquerSac(b, x.s, idx);
  }
  if (Array.isArray(f.me)) appliquerMeteo(f.me);
  if (f.w) appliquerMonde(f.w, idx);
  if (Number.isInteger(f.ec) && f.ec !== FA.eclairVu) { FA.eclairVu = f.ec; Meteo.flash = 1; }   // l'éclair du gardien, une fois
  if (Number.isFinite(f.h)) {                           // une seule heure sur l'île : celle du gardien
    const dh = ((f.h - horloge) % 1 + 1.5) % 1 - .5;
    if (Math.abs(dh) > .002) horloge = ((f.h % 1) + 1) % 1;
  }
  FA.recuT = now;
  if (manque) demanderInventaire(false);
}
// Une marionnette : elle glisse vers la place que dit le gardien (prolongée de sa vitesse entre deux
// nouvelles), tourne vers son cap, et anime ses pattes, sa voix et ses ailes comme une bête d'ici.
function fauneMarionnette(b, dt) {
  const k = sorteFaune(b), v = VISUEL_FAUNE[k];
  if (v) { v(b, dt); b.etatNeuf = false; return; }
  if (APRES_FAUNE[k]) APRES_FAUNE[k](b, dt);
  b.etatNeuf = false;
  b.t += dt; b.age += dt; b.bob += dt * (3 + (b.alarm || 0) * 4);
  if (b.hit > 0) b.hit -= dt;
  if (b.recul > 0) b.recul = Math.max(0, b.recul - dt * 1.5);
  if (b.ruade > 0) b.ruade = Math.max(0, b.ruade - dt * 1.6);
  if (b.dead) { b.dead += dt; chute(b, dt); updateFoeLegs(b, dt); return; }
  if (b.cx === undefined) { b.cx = b.x; b.cy = b.y; b.cz = b.z; b.cvx = b.cvy = 0; b.dirC = b.dir; }
  glisserFaune(b, dt);
  if (b.sp.volant && b.bat > .05) b.ph = ((b.ph || 0) + dt * (4.2 + b.bat * 3) * 6.2832) % 62.832;   // le battement d'ailes
  updateFoeLegs(b, dt);
}

// ---------- le temps qu'il fait ----------
// Un seul ciel par île : le gardien tire les changements de temps et les éclairs ; les suiveurs ne font
// que glisser vers son ciel (le fondu de 25 s, le vent qui tourne, les nuages qui avancent continuent
// d'eux-mêmes entre deux nouvelles).
const meteoFaune = () => [Meteo.de, Meteo.vers, r2(Meteo.m), Math.round(Meteo.reste), r2(Meteo.dir), r2(Meteo.derive)];
function appliquerMeteo(me, tout) {
  const [de, vers, m, reste, dir, derive] = me;
  if (!METEO[de] || !METEO[vers]) return;
  if (Meteo.vers !== vers || Meteo.de !== de) { Meteo.de = de; Meteo.vers = vers; Meteo.m = +m || 0; }
  else if (Math.abs(Meteo.m - m) > .05) Meteo.m = Math.max(0, Math.min(1, +m || 0));
  if (Number.isFinite(reste)) Meteo.reste = reste;      // pour reprendre le ciel là où il en était, si l'on devient gardien
  if (Number.isFinite(dir) && (tout || Math.abs(Meteo.dir - dir) > .2)) Meteo.dir = dir;
  if (Number.isFinite(derive) && (tout || Math.abs(Meteo.derive - derive) > .05)) Meteo.derive = derive;
}
// Un suiveur qui change le temps (sort, essai) le demande au gardien, qui le fait pour toute l'île.
function fauneForceMeteo(type) {
  if (!fauneSuiveur()) return false;
  diffuser(canalIle(), 'fmeteo', { u: Compte.uid, a: FA.gardien, v: type });
  Meteo.de = Meteo.vers; Meteo.vers = type; Meteo.m = 0;   // on le voit venir tout de suite ; le gardien confirmera
  return true;
}
function fauneEclair() {
  if (!fauneGardien() || !fauneSuiveurs().length) return;
  FA.eclair = (FA.eclair + 1) % 1000; FA.eclairRedit = 2;   // redit deux fois : une position perdue n'efface pas l'éclair
}

// Le pas d'une marionnette : elle glisse vers la place que dit le gardien, prolongée de sa vitesse entre
// deux nouvelles, et tourne vers son cap. Rend la distance parcourue.
function glisserFaune(b, dt) {
  if (b.cx === undefined) { b.cx = b.x; b.cy = b.y; b.cz = b.z; b.cvx = b.cvy = 0; b.dirC = b.dir; }
  const age = maintenant() - (b.fauneT ?? -99);
  if (age < .6) { b.cx += (b.cvx || 0) * dt; b.cy += (b.cvy || 0) * dt; }   // entre deux nouvelles, elle continue sur sa lancée
  const x0 = b.x, y0 = b.y;
  if ((b.cx - b.x) ** 2 + (b.cy - b.y) ** 2 > 36) { b.x = b.cx; b.y = b.cy; b.z = b.cz; }   // trop loin : on la pose là
  else {
    const k = Math.min(1, dt * 9);
    b.x += (b.cx - b.x) * k; b.y += (b.cy - b.y) * k; b.z += (b.cz - b.z) * Math.min(1, dt * 12);
  }
  const vx = (b.x - x0) / Math.max(dt, 1e-3), vy = (b.y - y0) / Math.max(dt, 1e-3);
  b.vx += (vx - b.vx) * Math.min(1, dt * 10); b.vy += (vy - b.vy) * Math.min(1, dt * 10);
  let dd = (b.dirC ?? b.dir) - b.dir; while (dd > Math.PI) dd -= 6.2832; while (dd < -Math.PI) dd += 6.2832;
  b.dir += dd * Math.min(1, dt * 8); b.dirT = b.dirC;
  return Math.hypot(b.x - x0, b.y - y0);
}

// ---------- les bêtes à part ----------
// Leur sorte décide de leur sac, de leur identité et de leur marionnette.
function sorteFaune(b) {
  const sp = b.sp;
  return sp.boss ? 'tiss' : sp.horreur ? (sp.corps === 'silencieux' ? 'sil' : 'mille') : sp.dragon ? 'dragon' : sp.plante ? 'plante'
    : sp.villageois ? 'vill' : sp.pnj ? (sp.arche ? 'arche' : 'nomade') : b.pnjSuit ? 'nmbete' : b.escouade ? 'esc' : sp.donjon ? 'dj'
    : sp.corps === 'myconide' ? 'myco' : sp.brume ? 'brume' : '';
}
// Le sac : [champ, codage, champ où le poser chez le suiveur]. n : un nombre ; v : tel quel ; a : des
// nombres en tableau ; o : un petit objet ; t : un instant du jeu (dit en écart à maintenant, chaque
// appareil a son horloge) ; bt : un instant de la bête (en écart à son âge) ; r : une cible.
const SAC_FAUNE = {
  sil: [['saisirT', 'n'], ['conf', 'n'], ['calmeT', 'bt']],
  mille: [['tete', 'a', 'teteC'], ['au', 'a'], ['coup', 'a'], ['fenT', 'n'], ['frT', 'n'], ['conf', 'n'], ['calmeT', 'bt']],
  tiss: [['act', 'o'], ['vise', 'a'], ['phase', 'v'], ['eveilT', 'bt'], ['toileT', 't'], ['reculT', 't'], ['mortierT', 't'], ['mortT', 'bt']],
  dragon: [['tang', 'n'], ['feuT', 'n'], ['gueuleT', 't'], ['pres', 'v'], ['v', 'n'], ['conf', 'n'], ['colere', 'n']],
  plante: [['armeT', 'n'], ['frappeT', 'n'], ['cible', 'n']],
  vill: [['cache', 'v'], ['assis', 'v'], ['porte', 'v'], ['peche', 'v'], ['cuisine', 'v'], ['gesteT', 't']],
  arche: [['ouv', 'n'], ['camo', 'n']],
  myco: [['lanceT', 't'], ['rireT', 't'], ['nuageT', 't'], ['farce', 'o']],
  brume: [['actT', 't'], ['vise', 'a'], ['emerge', 'n'], ['sonne', 't'], ['place', 'n'], ['impact', 'a'], ['saut', 'a'], ['sautT', 't']],   // la brume sanglante (brume.js)
};
function codeSac(b, v, c) {
  if (v === undefined || v === null) return null;
  if (c === 'n') return typeof v === 'number' && Number.isFinite(v) ? r2(v) : null;
  if (c === 'v') return typeof v === 'object' ? null : v;
  if (c === 'a') return Array.isArray(v) ? v.map(q => Array.isArray(q) ? q.map(z => r2(+z || 0)) : r2(+q || 0)) : null;
  if (c === 'o') { if (typeof v !== 'object') return null; const o = {}; for (const k in v) { const q = v[k]; if (typeof q === 'number') o[k] = r2(q); else if (typeof q === 'string' || typeof q === 'boolean') o[k] = q; } return o; }
  if (c === 't') return typeof v === 'number' ? r2(v - t) : null;
  if (c === 'bt') return typeof v === 'number' ? r2(v - b.t) : null;
  if (c === 'r') return refCible(v);
  return null;
}
function decodeSac(b, v, c, idx) {
  if (v === null || v === undefined) return null;
  if (c === 'n' || c === 'v') return typeof v === 'object' ? null : v;
  if (c === 'a') return Array.isArray(v) ? v.map(q => Array.isArray(q) ? q.map(Number) : +q) : null;
  if (c === 'o') return v && typeof v === 'object' && !Array.isArray(v) ? Object.assign({}, v) : null;
  if (c === 't') return Number.isFinite(v) ? t + v : null;
  if (c === 'bt') return Number.isFinite(v) ? b.t + v : null;
  if (c === 'r') return cibleDeRef(v, idx);
  return null;
}
const sacFaune = b => { const L = SAC_FAUNE[sorteFaune(b)]; return L ? L.map(([k, c]) => codeSac(b, b[k], c)) : null; };
function appliquerSac(b, s, idx) {
  const L = SAC_FAUNE[sorteFaune(b)]; if (!L) return;
  L.forEach(([k, c, dest], i) => { if (i < s.length) b[dest || k] = decodeSac(b, s[i], c, idx); });
}
// Qui elle est : ce qui ne change pas et que la naissance ne dit pas (le nom du nomade, le maître de sa
// bête, l'aire du dragon, l'antre de la Tisseuse, la machine d'en bas qu'elle est).
function identiteFaune(b) {
  const k = {};
  if (b.nm && b.sp.pnj) k.nm = typeof nmIdentite === 'function' ? nmIdentite(b.nm) : b.nm.nom;   // un inconnu (§110) : tout ce qui le fait
  if (b.poste) k.po = [r2(b.poste[0]), r2(b.poste[1])];
  if (b.rang !== undefined) k.rg = b.rang;
  if (b.pnjSuit && b.pnjSuit.num !== undefined) k.ps = b.pnjSuit.num;
  if (b.escouade) { k.es = 1; k.fr = r3(b.frappe || 1); k.bl = r3(b.blinde || 1); }
  else if (b.blinde) k.bl = r3(b.blinde);
  if (b.nid) k.ni = [r2(b.nid.x), r2(b.nid.y), r2(b.nid.z)];
  if (b.antre) k.an = [r2(b.antre[0]), r2(b.antre[1])];
  if (b.djIdx !== undefined) { k.di = b.djIdx; k.ds = b.djSalle; }
  return Object.keys(k).length ? k : null;
}
function poserIdentite(b, k, idx) {
  if (k.nm !== undefined) b.nm = (typeof nmLireIdentite === 'function' ? nmLireIdentite(k.nm) : typeof k.nm === 'string' ? NM_GENS.find(g => g.nom === k.nm) : null) || b.nm;
  if (Array.isArray(k.po)) b.poste = k.po.slice();
  if (k.rg !== undefined) b.rang = k.rg;
  if (k.ps !== undefined) { const m = idx.get(k.ps); if (m) b.pnjSuit = m; else b.pnjSuitN = k.ps; }
  if (k.es) { b.escouade = true; b.frappe = +k.fr || 1; }
  if (k.bl) b.blinde = +k.bl;
  if (Array.isArray(k.ni)) b.nid = { x: k.ni[0], y: k.ni[1], z: k.ni[2] };
  if (Array.isArray(k.an)) b.antre = k.an.slice();
  if (k.di !== undefined) { b.djIdx = k.di; b.djSalle = k.ds; }
}

// ---------- le monde ----------
// Le nectar de la fourmilière, le seuil des nomades et leur halte, le portail de l'escouade.
function mondeFaune() {
  const w = {};
  if (typeof Fourmi !== 'undefined' && Fourmi) w.fo = Fourmi.nectar | 0;
  const C = NM.car;
  if (C && C.arche && C.arche.num !== undefined && !C.arche.dead)
    w.nm = [C.arche.num, r2(C.lieu[0]), r2(C.lieu[1]), r2(C.centre[0]), r2(C.centre[1]), Math.round(C.fin - t), C.hostile ? 1 : 0, C.depart ? 1 : 0, C.ferme ? 1 : 0, C.bsp ? C.bsp.id : '', C.sortis | 0];
  const E = Escouade;
  if (E && !djIci()) w.es = [r2(E.x), r2(E.y), r2(E.z), r2(E.a), r2(E.k), E.etat, E.file.length, E.niv, E.sauts.map(A => [r2(A.x), r2(A.y), r2(A.z), r2(A.a), r2(A.k)])];
  if (typeof brumeMonde === 'function') { const br = brumeMonde(); if (br) w.br = br; }   // le cercle de la brume sanglante (brume.js)
  return w;
}
function appliquerMonde(w, idx) {
  if (w.br && typeof brumeAppliquer === 'function') brumeAppliquer(w.br);
  if (Number.isFinite(w.fo) && typeof Fourmi !== 'undefined' && Fourmi) Fourmi.nectar = Math.max(0, w.fo | 0);
  // les nomades : la caravane du gardien, dont on se fait un double pour leur parler et troquer
  const N = Array.isArray(w.nm) ? w.nm : null, arche = N && idx.get(N[0]);
  if (arche) {
    let C = NM.car;
    if (!C || C.arche !== arche) {
      if (C) nmFermer();
      C = NM.car = { arche, lieu: [N[1], N[2]], centre: [N[3], N[4]], gens: [], betes: [], qui: [], bsp: specById[N[9]] || null, t0: t, fin: t + N[5],
        hostile: false, hostileFin: 0, sortis: 0, trocs: nmTirerTrocs(), miroir: true };
      NM.moi.vues++;
      say('un seuil s\'ouvre non loin · des voyageurs en sortent', 3);
    }
    C.fin = t + (+N[5] || 0); C.hostile = !!N[6]; C.depart = !!N[7]; C.ferme = !!N[8]; C.sortis = N[10] | 0;
    C.gens = beasts.filter(o => o.sp.pnj && !o.sp.arche && o.num !== undefined && !o.dead);
    C.betes = beasts.filter(o => o.pnjSuit && o.num !== undefined && !o.dead);
    C.qui = C.gens.map(o => o.nm).filter(Boolean);
    for (const o of C.betes) if (!o.pnjSuit.sp && o.pnjSuitN !== undefined) o.pnjSuit = idx.get(o.pnjSuitN) || o.pnjSuit;
  } else if (NM.car && (NM.car.miroir || fauneSuiveur())) { nmFermer(); NM.car = null; }
  // l'escouade : son portail, ses sauts ; ses automates sont des bêtes du gardien
  const S = Array.isArray(w.es) ? w.es : null;
  if (S) {
    let E = Escouade;
    if (!E || !E.miroir) {
      E = Escouade = { x: S[0], y: S[1], z: S[2], a: S[3], k: S[4], t: 0, etat: S[5], niv: S[7], file: [], membres: [], sauts: [], miroir: true };
      escGraine = SEED;
      SON.jouer('portail', {}, S[0], S[1], S[2] + 1);
      say('un portail s\'ouvre · une escouade de ' + (S[6] | 0) + ' automates vient sur l\'île', 3.2);
    }
    Object.assign(E, { x: S[0], y: S[1], z: S[2], a: S[3], k: S[4], etat: S[5], niv: S[7] });
    E.file = new Array(Math.max(0, S[6] | 0)).fill('traceur');
    E.membres = beasts.filter(o => o.escouade && o.num !== undefined);
    E.sauts = (Array.isArray(S[8]) ? S[8] : []).map(q => ({ x: q[0], y: q[1], z: q[2], a: q[3], k: q[4] }));
  } else if (Escouade && (Escouade.miroir || fauneSuiveur())) {
    if (Escouade.membres.some(m => m.dead)) { say('l\'escouade est brisée', 2.6); SON.jouer('niveau'); }
    Escouade = null;
  }
}

// ---------- les gestes d'un suiveur sur le monde du gardien ----------
// Un sort, une offrande, une parole, puiser : on le voit tout de suite ici, et on le dit au gardien,
// qui le fait pour de bon. Rend vrai si le geste est parti.
function fauneGeste(k, o) {
  if (!fauneSuiveur()) return false;
  diffuser(canalIle(), 'fgeste', Object.assign({ u: Compte.uid, a: FA.gardien, k }, o || {}));
  return true;
}
function gesteDistantFaune(d) {
  const idx = indexFaune(), b = Number.isInteger(d.n) ? idx.get(d.n) : null, j = Autres.get(d.u);
  if (d.k === 'souffle') {                               // le Souffle : les bêtes autour de lui reculent
    const x = +d.x, y = +d.y; if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    for (const o of beasts) if (!o.dead && o.pv > 0 && !o.tame && faunePartagee(o)) {
      const dx = o.x - x, dy = o.y - y, r = Math.hypot(dx, dy);
      if (r < 7) { lacherParoi(o); o.vx += dx / (r || 1) * 9; o.vy += dy / (r || 1) * 9; o.alarm = 1; }
    }
  } else if (d.k === 'appel') {                          // l'Appel refusé : elle s'en souvient
    if (b) { b.alarm = 1; b.conf = Math.max(0, (b.conf || 0) - .2); if (b.sp.chasse) b.colere = Math.max(b.colere || 0, 12); }
  } else if (d.k === 'offrande') {                       // une offrande à une horreur
    if (!b || !b.sp.horreur) return;
    if (Number.isFinite(d.c)) b.conf = Math.max(b.conf || 0, Math.min(1, d.c));
    const sil = b.sp.corps === 'silencieux';
    if (sil && d.peur && j) { b.etat = 'hurler'; b.hurT = .5; b.son = { x: j.x, y: j.y, n: 1, cible: j }; b.sonT = b.t; sonHorreur(b.x, b.y, b.z + 2, 'hurlement'); return; }
    b.calmeT = b.t + 8;
    if (sil) { b.etat = 'écouter'; b.ecT = 3; } else { b.etat = 'plonger'; b.plT = 0; b.frappe = 1; b.cdT = b.t + 8; }
  } else if (d.k === 'mange') {                          // une baie, un poisson, tendus d'en face
    if (b && !b.tame) { b.faim = Math.max(0, b.faim - Math.max(0, Math.min(.8, +d.f || 0))); b.alarm = 0; if (d.d) b.doute = Math.max(0, (b.doute || 0) - Math.min(.6, +d.d || 0)); }
  } else if (d.k === 'nourrir') {                        // de la viande au dragon
    if (!b || !b.sp.dragon || b.enVol) return;
    b.faim = Math.max(0, b.faim - .35); b.etat = 'manger'; b.mangeT = 2;
    if (Number.isFinite(d.c)) b.conf = Math.max(b.conf || 0, Math.min(1, d.c));
  } else if (d.k === 'puise') {                          // le nectar de la fourmilière
    if (typeof Fourmi === 'undefined' || !Fourmi) return;
    Fourmi.nectar = Math.max(0, Fourmi.nectar - Math.max(0, Math.min(4, d.q | 0)));
    if (d.f) for (const o of beasts) if (o.sp.roche && !o.tame && !o.dead && (o.x - Fourmi.x) ** 2 + (o.y - Fourmi.y) ** 2 < 484) o.colere = Math.max(o.colere || 0, 14);
  } else if (d.k === 'aube') {                           // le sort de l'Aube : le jour se lève pour toute l'île
    horloge = .26;
  } else if (d.k === 'escouade' || d.k === 'nomades') {   // l'onglet Bêta d'un suiveur : c'est le gardien qui les fait venir, près de lui
    if (!j) return;
    if (d.k === 'escouade') { if (!Escouade && !djIci()) lancerEscouade(Math.max(1, Math.min(40, d.n | 0)), j); }
    else if (!NM.car) nmVenir(true, j);
  } else if (d.k === 'nmPartir') {
    nmPartir();
  } else if (d.k === 'parle') {                          // il parle à un villageois, à un nomade : celui-ci s'arrête et le regarde
    if (b) { b.parleD = d.on ? b.t + 40 : 0; b.parleJ = d.on ? d.u : null; }
  } else if (d.k === 'matiere') {                        // la matière d'un sort lancé par un suiveur : c'est ici que la bête vit
    if (b && !b.dead && b.pv > 0 && !b.tame && typeof matiereSur === 'function' && typeof d.m === 'string' && MATIERE[d.m]) matiereSur(b, d.m, j || P);
  } else if (d.k === 'englue') {                         // la boule visqueuse d'une compagne d'en face
    if (b && !b.dead && b.pv > 0 && !b.tame && typeof engluer === 'function') engluer(b, Math.max(.5, Math.min(5, +d.d || 0)));
  }
}

// ---------- les marionnettes des bêtes à part ----------
const vitesseLisse = (b, d, dt) => (b.vit = (b.vit || 0) + (d / Math.max(dt, 1e-3) - (b.vit || 0)) * Math.min(1, dt * 8));
const VISUEL_FAUNE = {
  // les êtres de la brume sanglante (brume.js) : leur pas se règle sur ce qu'ils parcourent
  brume(b, dt) {
    b.t += dt; b.ech = 1; if (b.hit > 0) b.hit -= dt;
    if (b.dead) { b.dead += dt * (b.sp.corps === 'demon' ? .35 : 1); b.z = sol(b.x, b.y); return; }
    vitesseLisse(b, glisserFaune(b, dt), dt); b.z = (typeof arcSaut === 'function' ? arcSaut(b) : null) ?? sol(b.x, b.y);   // en plein saut : l'arc
    if (typeof pasBrumeVisuel === 'function') pasBrumeVisuel(b, dt); else b.gph = (b.gph || 0) + dt * (b.vit || 0) * .9;
  },
  // le Silencieux : sa démarche boiteuse, ses tics, son hurlement quand il change d'humeur
  sil(b, dt) {
    b.t += dt; b.ech = 1; if (b.hit > 0) b.hit -= dt;
    if (b.dead) { b.dead += dt; b.z = sol(b.x, b.y); return; }
    vitesseLisse(b, glisserFaune(b, dt), dt); b.z = sol(b.x, b.y);
    b.gph = (b.gph || 0) + dt * b.vit * (b.etat === 'charger' ? .55 : .9);
    if (b.etat === 'saisir') b.saisirT = (b.saisirT || 0) + dt;
    if (b.etatNeuf) {
      if (b.etat === 'hurler') sonHorreur(b.x, b.y, b.z + 2, 'hurlement');
      else if (b.etat === 'saisir') { b.saisirT = 0; sonHorreur(b.x, b.y, b.z + 2, 'hurlement', { fort: 1 }); }
    }
    if (b.etat === 'errer' && Math.random() < dt * .25) sonHorreur(b.x, b.y, b.z + 2.3, 'clics');
    if (Math.random() < dt * (b.etat === 'errer' ? .6 : .2)) { b.tic = (Math.random() - .5) * 1.4; b.ticT = t; }
  },
  // le Mille-gueules : la tête que dit le gardien, les anneaux qui la suivent, la terre qui se fend
  mille(b, dt) {
    b.t += dt; b.ech = 1; if (b.hit > 0) b.hit -= dt;
    if (!b.seg) initMille(b);
    if (b.dead) { b.dead += dt; for (const q of b.seg) q[2] = Math.max(sol(q[0], q[1]) + .15, q[2] - dt * 2); return; }
    const T = b.tete, C = b.teteC || T, x0 = T[0], y0 = T[1];
    if ((C[0] - T[0]) ** 2 + (C[1] - T[1]) ** 2 > 64) { T[0] = C[0]; T[1] = C[1]; T[2] = C[2]; }
    else { const k = Math.min(1, dt * 8); T[0] += (C[0] - T[0]) * k; T[1] += (C[1] - T[1]) * k; T[2] += (C[2] - T[2]) * Math.min(1, dt * (b.etat === 'frapper' ? 12 : 6)); }
    const mv = Math.hypot(T[0] - x0, T[1] - y0), v = mv / Math.max(dt, 1e-3);
    if (mv > 1e-3) b.dirT = Math.atan2(T[1] - y0, T[0] - x0);
    chaineMille(b);
    b.x = T[0]; b.y = T[1]; b.z = sol(b.x, b.y); b.dir = b.dirT ?? b.dir; b.cx = b.x; b.cy = b.y;
    const g = sol(T[0], T[1]), dJ = Math.hypot(P.x - T[0], P.y - T[1]), A = b.au;
    if (b.etat === 'sous') {
      if (Math.random() < dt * (v > 3 ? 18 : 6)) parts.push({ x: T[0] + (Math.random() - .5) * .5, y: T[1] + (Math.random() - .5) * .5, z: g + .05, vx: (Math.random() - .5) * .8, vy: (Math.random() - .5) * .8, vz: .8 + Math.random(), g: 6, life: .5, age: 0, col: '#2c2a36', tl: .07 });
      if (v > 3 && Math.random() < dt * .8) sonHorreur(T[0], T[1], g, 'grondement');
      if (v > 3 && dJ < 10) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .12 * (1 - dJ / 10)); }
    } else if (b.etat === 'fendre' && A) {
      b.fenT = (b.fenT || 0) + dt;
      for (let k = 0; k < 3; k++) { const a = Math.random() * 6.2832, r = .3 + b.fenT * 1.4; parts.push({ x: A[0] + Math.cos(a) * r, y: A[1] + Math.sin(a) * r, z: sol(A[0], A[1]) + .05, vx: Math.cos(a) * .6, vy: Math.sin(a) * .6, vz: 1.4, g: 7, life: .45, age: 0, col: Math.random() < .3 ? '#5ad0ff' : '#3a3644', luit: Math.random() < .3, tl: .08 }); }
      if (Math.hypot(P.x - A[0], P.y - A[1]) < 6) { P.secousse = t; P.secousseK = .3 + b.fenT * .4; }
      if (b.etatNeuf) sonHorreur(A[0], A[1], g, 'grondement', { fort: 1 });
    } else if (b.etat === 'jaillir' && b.etatNeuf && A) {
      sonHorreur(A[0], A[1], g + 2, 'criMille'); P.secousse = t; P.secousseK = 1;
      for (let k = 0; k < 26; k++) parts.push({ x: A[0], y: A[1], z: sol(A[0], A[1]) + .2, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, vz: 3 + Math.random() * 4, g: 10, life: .8, age: 0, col: '#2c2a36', tl: .1 });
    } else if (b.etat === 'frapper') {
      if (b.etatNeuf) { b.frT = 0; b.frappeVu = 0; sonHorreur(T[0], T[1], T[2], 'criMille', { court: 1 }); }
      b.frT = (b.frT || 0) + dt;
      if (b.frT > .32 && !b.frappeVu) {
        b.frappeVu = 1; P.secousse = t; P.secousseK = .9;
        for (let k = 0; k < 18; k++) parts.push({ x: T[0], y: T[1], z: g + .1, vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 4, vz: 2 + Math.random() * 2, g: 9, life: .6, age: 0, col: '#3a3644', tl: .09 });
      }
    }
  },
  // la Tisseuse : ses huit pattes qui cherchent le sol, la vapeur, l'arme qu'elle arme, son réveil
  tiss(b, dt) {
    b.t += dt; b.ech = 1; if (b.hit > 0) b.hit -= dt;
    if (!b.pieds) initTisseuse(b);
    souffleTiss(b, dt);
    if (b.dead) { mortTisseuse(b, dt); return; }
    const A = b.act, k0 = b._actK || null;
    if (A && Number.isFinite(A.T)) A.T -= dt;
    const x0 = b.x, y0 = b.y; glisserFaune(b, dt);
    const vx = (b.x - x0) / Math.max(dt, 1e-3), vy = (b.y - y0) / Math.max(dt, 1e-3);
    const ke = b.etat === 'éveil' ? Math.min(1, (b.t - (b.eveilT ?? b.t)) / 2.4) : 1;
    const haut = b.etat === 'sommeil' ? 0 : ke * ke * (3 - 2 * ke);
    const lev = A && A.k === 'cabrer' && A.T > .18 ? Math.min(1, (.95 - A.T) / .4) : 0;
    marcheTiss(b, vx, vy, dt, haut, lev, true);
    if (b.etatNeuf && b.etat === 'éveil') { SON.jouer('eveilTisseuse', {}, b.x, b.y, b.zc); say('La Tisseuse de fer s\'éveille', 3); P.secousse = t; P.secousseK = 1; }
    const k1 = A ? A.k : null;
    if (k1 !== k0) {
      if (k1 === 'cabrer') SON.jouer('eveilTisseuse', { court: 1 }, b.x, b.y, b.zc);
      else if (k1 === 'viser') SON.jouer('vise', { dur: b.phase === 3 ? 1.05 : 1.6 }, b.x, b.y, b.zc);
      if (k0 === 'cabrer') {                              // la patte retombe : l'onde de choc
        const f = pointTiss(b, 2.3, 0, 0), z = sol(f[0], f[1]);
        for (let k = 0; k < 28; k++) { const a = k / 28 * 6.2832; parts.push({ x: f[0] + Math.cos(a) * .4, y: f[1] + Math.sin(a) * .4, z: z + .1, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, vz: .4, g: 2, life: .45, age: 0, col: '#bfae96', tl: .08 }); }
        SON.jouer('pilon', {}, f[0], f[1], z); P.secousse = t; P.secousseK = 1;
      }
    }
    b._actK = k1;
  },
  // le dragon : le battement de ses ailes, sa tête qui balaie quand il est perché, son grondement
  dragon(b, dt) {
    b.t += dt; b.age += dt; b.ech = 1; if (b.hit > 0) b.hit -= dt;
    if (b.dead) {
      b.dead += dt; b.bat = 0;
      if (b.solMort === undefined) {
        b.enVol = false; b.vz = (b.vz || 0) - 14 * dt; b.z += b.vz * dt; b.roll = (b.roll || 0) + dt * 1.5; b.tang = Math.max(-.8, (b.tang || 0) - dt);
        const fl = Math.max(floorUnder(b.x, b.y, b.z + .05), hRendu(b.x, b.y));
        if (b.z <= fl) { b.z = fl; b.vz = 0; b.v = 0; b.solMort = fl; b.roll = 1.3; b.tang = 0; burst(b.x, b.y, b.z + .3, 16, '#9a8f80'); P.secousse = t; P.secousseK = .5; }
      }
      return;
    }
    const d0 = b.dir, d = glisserFaune(b, dt); let rot = b.dir - d0; while (rot > Math.PI) rot -= 6.2832; while (rot < -Math.PI) rot += 6.2832;
    b.vit = b.enVol ? (b.v || d / Math.max(dt, 1e-3)) : b.etat === 'dormir' ? 0 : Math.min(1.4, d / Math.max(dt, 1e-3) + Math.abs(rot) / Math.max(dt, 1e-3) * .55);   // au sol : des pas quand il se tourne, rien quand il dort
    if (b.enVol && b.bat > .05) b.ph = ((b.ph || 0) + dt * (4.2 + b.bat * 3 + (b.etat === 'cracher' ? 1.8 : 0)) * 6.2832) % 62.832;
    if (!b.enVol && b.etat !== 'dormir') gestesPerche(b);
    if (b.etatNeuf) {
      if (b.etat === 'menacer') SON.jouer('rugissement', {}, b.x, b.y, b.z + 1.6);
      else if (b.etat === 'cracher') SON.jouer('rugissement', { court: 1 }, b.x, b.y, b.z + 1);
      else if (b.etatAvant === 'décoller' && b.enVol) burst(b.x, b.y, b.z + .2, 5, '#f4f4f0');
    }
  },
  // la plante épique : elle s'arme, frappe, se remet ; et son pollen
  plante(b, dt) { majPlante(b, dt, true); },
  // le villageois : son pas, ses gestes de métier, le salut quand on passe
  vill(b, dt) {
    b.t += dt; if (b.hit > 0) b.hit -= dt;
    if (b.dead) { b.dead += dt; chute(b, dt); return; }
    vitesseLisse(b, glisserFaune(b, dt), dt);
    b.ph = (b.ph || 0) + dt * b.vit * 1.1;
    b.parle = VL.parle === b;
    const dJ = Math.hypot(P.x - b.x, P.y - b.y);
    b.salut = !b.parle && dJ < 4 && !vlNuit() && b.etat !== 'fuir' && b.etat !== 'combat' ? 1 : 0;
    if (b.parle) b.dir = b.dirT = Math.atan2(P.y - b.y, P.x - b.x);
  },
  // le nomade : sa marche, son salut, et il vous regarde quand vous lui parlez
  nomade(b, dt) {
    b.t += dt; if (b.hit > 0) b.hit -= dt; if (b.alarm > 0) b.alarm -= dt * .5;
    if (b.dead) {
      if (!b.mortVu) {                                   // tué de votre main : il ne reviendra plus
        b.mortVu = true;
        if (maintenant() - (b.coupT ?? -99) < 2.5 && b.nm && !b.pnjSuit && !NM.moi.morts.includes(b.nm.nom)) NM.moi.morts.push(b.nm.nom);
      }
      b.dead += dt; chute(b, dt); return;
    }
    const d = glisserFaune(b, dt); vitesseLisse(b, d, dt);
    b.ph = ((b.ph || 0) + d / .62) % 1;
    b.parle = NM.parle === b;
    const dJ = Math.hypot(P.x - b.x, P.y - b.y);
    if (dJ < 6 && !b.salue) { b.salue = true; b.salutT = b.t; }
    if (b.parle) b.dir = b.dirT = Math.atan2(P.y - b.y, P.x - b.x);
  },
  arche(b, dt) { b.t += dt; b.pv = 1; if (b.dead) b.dead += dt; },
};
// Ce qu'ajoutent, à la marionnette ordinaire, certaines bêtes : le vesseron rit et crache ses spores.
const APRES_FAUNE = {
  myco(b) {
    if (Number.isFinite(b.rireT) && t - b.rireT < .5 && Math.abs(b.rireT - (b._rireVu ?? -99)) > .3) {
      b._rireVu = b.rireT; SON.jouer('rire', { f: 820 + ((b.capT || .5) * 380), n: 5 }, b.x, b.y, b.z + .6);
    }
    if (Number.isFinite(b.nuageT) && t - b.nuageT < .6 && Math.abs(b.nuageT - (b._nuageVu ?? -99)) > .3) {
      b._nuageVu = b.nuageT;                               // le nuage : on le voit, et l'on s'y engourdit si l'on est dedans
      for (let k = 0; k < 26; k++) parts.push({ x: b.x + (Math.random() - .5) * .6, y: b.y + (Math.random() - .5) * .6, z: b.z + .5 * b.sp.sz,
        vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6, vz: Math.random() * .6, g: -.08, life: 1.6 + Math.random(), age: 0, col: '#d6b8f0', luit: 1, tl: .09 });
      if ((P.x - b.x) ** 2 + (P.y - b.y) ** 2 < 7) { P.spores = t + 3.5; say('les spores vous engourdissent', 1.8); }
    }
  },
};

// ---------- les gestes ----------
// Un coup d'ici sur une bête du gardien : on le voit tout de suite, et on le lui dit. C'est lui qui compte.
function fauneCoup(b, dg, kx, ky, cause, etourdi) {
  if (FA.role !== 'suiveur' || !FA.inventaire || !faunePossible() || b.num === undefined || !faunePartagee(b)) return;
  b.coupT = maintenant();
  if ((b.sp.pnj || b.pnjSuit) && cause !== 'compagne' && typeof nmFache === 'function') nmFache();   // un nomade frappé : ils s'en souviendront, de vous
  diffuser(canalIle(), 'fcoup', { u: Compte.uid, a: FA.gardien, n: b.num, d: r3(dg), kx: r2(kx || 0), ky: r2(ky || 0), c: cause,
    et: etourdi || 0, g: effet('gel') || 0 });
}
// Un rodéo raté chez un suiveur : la bête retourne à la faune du gardien, qui la fait renaître là où
// elle a jeté son cavalier (elle revient ici, avec un numéro neuf, par les naissances).
function fauneRendre(b) {
  if (!fauneSuiveur() || b.tame || b.num !== undefined || !beasts.includes(b)) return;
  const d = descrFaune(Object.assign(Object.create(Object.getPrototypeOf(b)), b, { num: -1 }));
  diffuser(canalIle(), 'frend', { u: Compte.uid, a: FA.gardien, d });
  retirerFaune(b);
}
// Liée ou montée ici : la bête quitte la faune du gardien, elle est à cet appareil désormais.
function fauneLien(b) {
  if (b.num === undefined || !faunePartagee(b)) return;
  if (FA.role === 'suiveur' && faunePossible()) diffuser(canalIle(), 'flien', { u: Compte.uid, a: FA.gardien, n: b.num });
  if (FA.role === 'suiveur') { delete b.num; b.cx = undefined; }
}
// Le coup d'une bête du gardien sur un joueur d'en face : il l'encaisse chez lui.
function fauneMorsure(b, j, deg) {
  const m = { u: Compte.uid, a: j.u, n: b.num, s: b.sp.id, x: r2(b.x), y: r2(b.y), z: r2(b.z), d: r3(deg), ch: b.sp.roche && b.as ? 1 : 0 };
  const o = FA.extra; FA.extra = null;
  if (o) { if (o.kb) m.kb = o.kb.map(r2); if (o.sh) m.sh = r2(o.sh); if (o.m) m.m = String(o.m).slice(0, 60); if (o.br) m.br = 1; }
  diffuser(canalIle(), 'morsure', m);
}
// Les joueurs de l'île que les bêtes du gardien voient : soi, et ceux d'en face qui partagent la faune.
function joueursFaune() {
  const L = P.pv > 0 ? [P] : [];
  if (fauneGardien()) for (const j of fauneJoueurs()) if (j.pv > 0) L.push(j);
  return L;
}
// Le coup d'une bête à part sur un joueur, d'ici ou d'en face : le recul en plus (kb : vx, vy, vz), la
// secousse (sh), le mot (m), la brûlure (br). Chez soi tout de suite ; chez l'autre, par la morsure.
function frapperJoueur(b, J, deg, o) {
  if (J !== P) { FA.extra = o || null; const r = porterCoup(b, J, deg); FA.extra = null; return r; }
  const r = porterCoup(b, P, deg);
  if (r && o) {
    if (o.kb) { P.vx += o.kb[0] || 0; P.vy += o.kb[1] || 0; if (o.kb[2]) P.vz = (P.vz || 0) + o.kb[2]; }
    if (o.m) say(o.m, 1.8);
  }
  if (o && o.sh) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, o.sh); }
  return r;
}
// Le tir d'un automate du gardien : les suiveurs le voient partir, et chacun encaisse ce qui le touche.
function fauneTir(b, f) {
  if (!fauneGardien() || b.num === undefined || !faunePartagee(b) || !fauneSuiveurs().length) return;
  const m = { u: Compte.uid, n: b.num, s: b.sp.id, x: r2(f.x), y: r2(f.y), z: r2(f.z), vx: r2(f.vx), vy: r2(f.vy), vz: r2(f.vz), dg: r3(f.deg), c: f.c };
  if (f.obus) Object.assign(m, { o: 1, zo: f.zone, cx: r2(f.cx), cy: r2(f.cy), cz: r2(f.cz), vol: r2(f.vol) });
  if (f.feu) m.fe = 1;
  if (f.toile) m.to = 1;
  if (f.spore) { m.sp = 1; m.vol = r2(f.vol || 1); }
  diffuser(canalIle(), 'ftir', m);
}
// Ce que fait une bête quand un joueur d'en face la frappe (comme blesseParJoueur, sans ce qui est à lui :
// ses effets, sa vie volée, sa visibilité, se règlent chez lui).
function colereDistante(b) {
  b.colere = 20; b.aise = 0; b.joue = 0;
  if (b.sp.pnj || b.pnjSuit) b.colereD = true;          // un nomade : c'est l'autre qu'il gardera en mémoire
  if (b.sp.roche) for (const o of beasts) if (o !== b && o.sp === b.sp && !o.tame && !o.dead && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 196) o.colere = Math.max(o.colere || 0, 12);
  if (b.sp.chasse && b.sp.herd) for (const o of beasts) if (o !== b && o.sp === b.sp && !o.tame && !o.dead && (o.x - b.x) ** 2 + (o.y - b.y) ** 2 < 144) o.colere = Math.max(o.colere || 0, 15);
}
function fauneEvenement(evt, d) {
  if (!['faune?', 'faune', 'fcoup', 'flien', 'morsure', 'ftir', 'fmeteo', 'fgeste', 'frend'].includes(evt)) return false;
  if (!faunePossible()) return true;
  const moi = Compte.uid;
  if (evt === 'faune?') {
    if (d.a === moi && FA.role === 'gardien') envoyerInventaire(d.u);
  } else if (evt === 'faune') {
    if (d.a === moi && FA.role === 'suiveur' && d.u === FA.gardien) recevoirInventaire(d);
  } else if (evt === 'fcoup') {
    if (d.a !== moi || FA.role !== 'gardien') return true;
    const b = indexFaune().get(d.n); if (!b || b.dead) return true;
    b.pv -= Math.max(0, Math.min(2, +d.d || 0)); b.hit = .25; b.alarm = 1; lacherParoi(b);
    b.vx += +d.kx || 0; b.vy += +d.ky || 0;
    if (d.et) b.etourdi = Math.max(b.etourdi || 0, +d.et);
    if (d.g) b.etourdi = Math.max(b.etourdi || 0, .4 + .3 * d.g);
    if (d.c === 'compagne') b.etourdi = Math.max(b.etourdi || 0, .45); else colereDistante(b);
    if (b.as && b.as.prof !== COMBAT.defense) { b.as = null; b.pret = b.t + .8; }
    b.coupDistant = d.u; b.coupDistantT = maintenant();
    if (b.pv <= 0) { b.tueDistant = d.u; if (!(b.sp.pnj || b.pnjSuit) && !b.sp.villageois) mourirBete(b, d.c || 'chassé'); }   // villageois et nomades meurent dans leur propre pas
  } else if (evt === 'flien') {
    if (d.a !== moi || FA.role !== 'gardien') return true;
    const b = indexFaune().get(d.n); if (b) retirerBete(b);
  } else if (evt === 'morsure') {
    if (d.a !== moi) return true;
    // celle qui mord, telle qu'on la voit ici (sa marionnette), ou ce qu'il en faut pour encaisser
    const loc = indexFaune().get(d.n);
    const src = { x: d.x, y: d.y, z: d.z, sp: specById[d.s] || (loc && loc.sp) || { n: 'bête' }, as: d.ch ? {} : null, tame: false, pv: 99, t: 0, dead: 0 };
    const touche = porterCoup(src, P, +d.d || 0);
    if (touche && Array.isArray(d.kb)) { P.vx += +d.kb[0] || 0; P.vy += +d.kb[1] || 0; if (d.kb[2]) P.vz = (P.vz || 0) + (+d.kb[2] || 0); }
    if (touche && d.m) say(String(d.m).slice(0, 60), 1.8);
    if (touche && d.br && !effet('braise')) P.brulure = t + 3;
    if (d.sh) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, Math.min(1, +d.sh || 0)); }
    // les épines : le coup rendu revient au gardien
    if (touche && effet('epines') && loc) fauneCoup(loc, (+d.d || 0) * .3 * effet('epines') / robuste(loc), 0, 0, 'combat');
  } else if (evt === 'frend') {                          // la bête d'un rodéo raté, rendue à l'île
    if (d.a !== moi || FA.role !== 'gardien' || !d.d || !specById[d.d.s]) return true;
    const e = d.d, b = naitre(specById[e.s], +e.x || 0, +e.y || 0, +e.a || 0);
    if (!(b.x > 1 && b.y > 1 && b.x < WS - 1 && b.y < WS - 1)) return true;
    b.z = +e.z || sol(b.x, b.y); b.dir = b.dirT = +e.d || 0; b.pv = Math.max(.05, Math.min(1, +e.v || 1)); b.fuite = 3; b.alarm = 1;
    if (e.w) b.variante = varianteSure(e.w);
    if (e.f != null) { b.faim = +e.f || 0; b.soif = +e.so || 0; b.nrj = +e.nr || .5; }
    if (e.ma != null) b.male = !!e.ma;
    beasts.push(b);                                      // son numéro, et l'annonce de sa naissance : au prochain pas (majFaune)
  } else if (evt === 'fgeste') {
    if (d.a === moi && FA.role === 'gardien') gesteDistantFaune(d);
  } else if (evt === 'fmeteo') {
    if (d.a === moi && FA.role === 'gardien' && METEO[d.v]) { forcerMeteo(d.v, true); FA.meteoDit = ''; }
  } else if (evt === 'ftir') {
    if (FA.role !== 'suiveur' || d.u !== FA.gardien) return true;
    const loc = indexFaune().get(d.n);
    const de = loc || { x: d.x, y: d.y, z: d.z, sp: specById[d.s] || { n: 'automate', sz: 1 }, comp: null, tame: false, pv: 1, dead: 0 };
    const f = { x: d.x, y: d.y, z: d.z, vx: d.vx, vy: d.vy, vz: d.vz, de, deg: +d.dg || 0, age: 0, c: d.c, fantome: true };
    if (d.o) Object.assign(f, { obus: true, zone: d.zo, cx: d.cx, cy: d.cy, cz: d.cz, vol: d.vol });
    if (d.fe) { f.feu = true; f.c = [255, 160, 60]; }
    if (d.to) { f.toile = true; f.c = [196, 232, 255]; }
    if (d.sp) { f.spore = true; f.vol = d.vol; }
    TIRS.push(f);
    if (loc && loc.sp.fam === 'automate') loc.recul = d.o ? .35 : .22;
    SON.jouer(d.fe ? 'cracheFeu' : d.sp || d.to ? 'crachat' : d.o ? 'obus' : 'tir', {}, d.x, d.y, d.z);
  }
  return true;
}
// Ce que le joueur d'en face dit de lui dans ses positions : s'il partage la faune, s'il la garde, depuis
// quand, et dans quel état il est. Et si c'est mon gardien, ses bêtes.
function fauneDistant(j, d) {
  j.fv = d.fv === 1; j.fg = !!d.fg; j.fa = +d.fa || 0;
  const x = d.fx | 0;
  j.fx = { calme: !!(x & 1), abri: !!(x & 2), invisible: !!(x & 4), silence: !!(x & 8), repousse: !!(x & 16) };
  j.br = Math.max(0, Math.min(1, +d.br || 0)); j.oc = Math.max(0, Math.min(1, +d.oc || 0));
  if (!d.f || FA.role !== 'suiveur' || j.u !== FA.gardien || !faunePossible()) return;
  if (FA.inventaire) appliquerFaune(d.f); else demanderInventaire(false);
}
function fauneDepart(u) {
  if (u === FA.gardien && FA.role === 'suiveur') { FA.gardien = null; FA.inventaire = false; FA.electT = 0; }
  FA.repondu.delete(u);
}

// L'île vient d'être (re)peuplée : les numéros repartent de la graine. Le gardien redonne toute sa faune
// à ceux qui le suivent ; un suiveur redemande celle du gardien.
function fauneNouvelleIle() {
  FA.compte = false; FA.connus = new Set(); FA.naissances = []; FA.retraits = [];
  if (FA.role === 'gardien') FA.depuis = maintenant();   // une faune neuve n'a pas d'ancienneté
  if (!faunePossible()) return;
  if (FA.role === 'gardien') for (const j of fauneSuiveurs()) { FA.repondu.delete(j.u); envoyerInventaire(j.u); }
  else { FA.inventaire = false; demanderInventaire(true); }
}
function envoyerInventaire(u) {
  if (maintenant() - (FA.repondu.get(u) || -99) < 1.5) return;
  FA.repondu.set(u, maintenant());
  diffuser(canalIle(), 'faune', { u: Compte.uid, a: u, l: [...indexFaune().values()].map(descrFaune), pn: FA.prochain, h: r3(horloge), me: meteoFaune(), w: mondeFaune() });
}

// ---------- à chaque image ----------
function majFaune(dt) {
  const now = maintenant();
  if (now - FA.electT > .5) { FA.electT = now; elireFaune(); archeTisseuse(); }
  if (!faunePossible()) return;
  if (FA.role === 'gardien') {
    // un numéro pour chaque bête née ici, et l'annonce de sa naissance à ceux qui suivent. Le compteur
    // part toujours au-delà du plus grand numéro de l'île (la population de départ en porte déjà)
    for (const b of beasts) if (b.num === undefined && faunePartagee(b)) {
      if (!FA.compte) { for (const o of beasts) if (o.num !== undefined && o.num >= FA.prochain) FA.prochain = o.num + 1; FA.compte = true; }
      b.num = FA.prochain++;
      FA.naissances.push([descrFaune(b), FAUNE_RAPPEL]);
    }
  } else if (!FA.inventaire) demanderInventaire(false);
}

// L'arche d'une île à Tisseuse : cachée tant qu'une Tisseuse vit ici (pour qui ne l'a pas encore vaincue),
// rendue dès qu'il n'y en a plus — celle d'un gardien qui l'avait déjà vaincue, par exemple.
function archeTisseuse() {
  if (typeof PortailCache === 'undefined') return;
  const boss = beasts.find(b => b.sp.boss && !b.retire);
  if (boss && !boss.dead && PortailIle && !(P.bossVaincus || []).includes(SEED)) { PortailCache = PortailIle; PortailIle = null; }
  else if (!boss && PortailCache) { PortailIle = PortailCache; PortailCache = null; }
}

// ---------- l'onglet Bêta ----------
function fauneEtat() {
  const n = indexFaune().size;
  if (!FA.actif) return 'coupé · chacun voit ses propres bêtes, son ciel, ses nomades';
  if (!Compte.dedans || !RS.ouvert) return 'hors ligne · l\'île vit ici seulement';
  const ou = djIci() ? 'l\'étage' : 'l\'île', quoi = djIci() ? ' machines' : ' bêtes';
  if (FA.role === 'gardien') {
    const s = fauneSuiveurs();
    return s.length ? 'vous faites vivre ' + ou + ' · suivi par ' + s.map(j => j.nom).join(', ') + ' · ' + n + quoi
      : 'seul sur ' + ou + ' · vous le faites vivre · ' + n + quoi;
  }
  const g = Autres.get(FA.gardien);
  if (!FA.inventaire) return 'en attente de ' + (g ? g.nom : ou) + '…';
  return ou.charAt(0).toUpperCase() + ou.slice(1) + ' vit chez ' + (g ? g.nom : '?') + ' · ' + n + quoi + ' · dernière nouvelle il y a ' + (maintenant() - FA.recuT).toFixed(1).replace('.', ',') + ' s';
}
function fauneBascule() {
  FA.actif = !FA.actif;
  try { localStorage.setItem(FAUNE_REGLAGE, FA.actif ? '1' : '0'); } catch (e) { /* le réglage ne tiendra que cette partie */ }
  if (!FA.actif && FA.role === 'suiveur') { FA.role = 'gardien'; FA.depuis = maintenant(); FA.inventaire = false; }
  say(FA.actif ? 'île partagée activée' : 'île partagée coupée · vos bêtes, votre ciel ne sont qu\'à vous', 2.4);
}
