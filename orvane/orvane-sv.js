// Orvane × Stone Valley — LE TRADUCTEUR (orvane-sv.js)
// Chargé par index.html comme donjon.js, après corps.js, tampon.js et correspondance.js. Le jeu appelle, s'ils existent :
//  - orvaneEspeces()              une fois les fiches du jeu posées (SPEC, specById) : les lignées nées dans Orvane
//                                 rejoignent SPEC (§210) ;
//  - orvaneAppliquer()            à l'arrivée sur une île, avant tirerBestiaire() : règle POIDS_ESPECE et sp.cap
//                                 d'après l'état du vivant dans Orvane (sens Orvane → jeu) ;
//  - orvaneVariante(sp, r)        dans tirerVariante() : tire le phénotype d'une bête qui naît, et le rend en variante
//                                 du jeu (robe | taille-ornement) ; undefined ⇒ le jeu tire comme avant ;
//  - orvaneNaissance(b, mere)     juste après tirerVariante() : le phénotype exact de la bête, ses conduites (§211), et
//                                 ses traits continus — taille, allure, audace — tirés dans la loi de sa population (§212) ;
//                                 née d'une mère connue, elle lui ressemble (§213, hérédité mendélienne) ;
//  - orvaneEvenement(action, b, cause)  dans mourirBete() ('prelevement') et lier() ('capture') ;
//  - orvaneLot()                  le lot de pressions accumulé (schemas/pression.schema.json) ;
//  - orvaneEnvoyer(rpc, compte)   après une sauvegarde réussie : pousse le lot vers le Supabase d'Orvane (orvane_deposer,
//                                 avec la clé du jeu : ORVANE_DEPOT), sinon par le rpc du jeu (vp_orvane_pression, sv-1) ;
//                                 une fois par demi-heure au plus (48 dépôts par jour, c'est la limite du serveur).
// Les rencontres (l'exposition) sont relevées toutes les dix secondes : une bête sauvage à moins de douze pas.
// Tout ce qui est propre au jeu est dans correspondance.js ; le réglage vient du monde (profil.json) et de jeux.json, où
// le monde publie ce que chaque jeu sait en montrer (hebergement/LISEZ-MOI.md ; Corr.EXPOSITION tant qu'il n'est pas arrivé).
// Rien ne casse si Orvane est injoignable : sans instantané, le jeu reste exactement ce qu'il était.
//
// LES LIGNÉES (§210). Un taxon d'Orvane qui n'est pas une espèce du jeu (« crapaud.tourbiere », né d'une séparation, ou
// une lignée d'un monde né de la genèse) devient une fiche du jeu : celle de son plus proche ancêtre connu du jeu (ou,
// sans ancêtre, d'un gabarit selon son régime : correspondance.js), avec son nom, sa taille (d'après sa masse), sa
// vitesse, ses couleurs et ses sols. Son corps :
//  - rendu par le parent tant qu'il lui ressemble : le dessin de l'espèce mère, à ses couleurs et à sa taille ;
//  - construit (lignees.js, osOrvane) dès qu'il s'en écarte : autre forme, autres pattes, des ailes gagnées, ou un écart
//    de silhouette (moteur/corps.js, distance) d'au moins SEUIL_CORPS — et toujours pour une lignée sans ancêtre.
// Les fiches des lignées sont gardées en mémoire locale : une compagne liée garde la sienne même si la lignée s'éteint.
// Une espèce inconnue de forme « parent.biome » (la compagne d'un autre joueur, une sauvegarde venue d'un autre appareil)
// est rendue par son parent (specById la résout à la demande).
(function (racine) {
'use strict';
// d'où viennent instantane.json, generation-0.json, profil.json et jeux.json : un dossier à côté du jeu, ou le monde publié
// par le dépôt Orvane (GitHub Pages sert avec CORS *) — poser ORVANE_CHEMIN avant de charger ce script pour le changer.
// ORVANE_DEPOT = { url, cle, jeu } : le Supabase d'Orvane, sa clé publique, la clé publique du jeu (orvane_inscrire_jeu)
const CLE = 'stone_valley:orvane', CHEMIN = racine.ORVANE_CHEMIN || 'orvane/', JEU = 'stone-valley', LOT_MAX = 400;
// les morts qui comptent comme prélèvements du joueur : ses armes, ses sorts, ses tours, ses compagnes.
// Pas « faim », pas « proie » (une bête de l'île qui en tue une autre : Orvane simule déjà la prédation), pas « défense ».
const CAUSES_JOUEUR = new Set(['chassé', 'flèche', 'combat', 'piétiné', 'explosé', 'tour', 'satellite', 'brisé', 'tir', 'bêta', 'compagne']);
const RAYON_RENCONTRE = 12, PERIODE_RENCONTRE = 10000, COMMUNS = [1, 2, 3, 4, 5, 6, 7];
const ENVOI_MIN = 30 * 60e3, REESSAI = 5 * 60e3, LIGNEES_MAX = 200, SEUIL_CORPS = .3;
const Corr = racine.OrvaneSV_Corr, Tampon = racine.OrvaneTampon, Corps = racine.OrvaneCorps;
const S = { courant: null, gen0: null, profil: null, monde: null, lot: {}, lotQ: {}, depuis: null, dernierEnvoi: 0, envoi: false,
  lignees: {}, poids0: null, cap0: null, vus: new WeakSet(), compte: null, pret: false, qIle: {}, rangs: {}, decouvertes: {} };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), r2 = v => Math.round(v * 100) / 100;

// --- mémoire locale (les lignées et le lot survivent à la fermeture ; l'instantané et la génération 0, eux, vont dans le
// cache du navigateur : un monde de cent lignées pèse deux mégaoctets, de quoi remplir le stockage local où le jeu sauve).
// Le stockage local en garde un abrégé (qui vit où, combien), assez pour peupler la première île avant que le monde arrive ---
const CACHE_MONDE = 'stone-valley:orvane-monde';
// (§224) LE MONDE D'ORVANE, SANS LA GENÈSE 7. Le monde d'Orvane a reçu un continent (la fusion « genese-7 », Orvane docs/23)
// né de la faune faite main du jeu : ses lignées descendent du brouteur, du crapaud, du cotonnier… (le monde sv-1), et il
// apporte les biomes du jeu (sylve, cerisaie, ossuaire…). Le jeu ne le montre pas : ses lignées, celles qui en descendront,
// ses parcelles et l'annonce de sa venue sont retirées à la lecture. Et le jeu ne lit que les biomes d'Orvane (choisirCarte).
const FUSIONS_ECARTEES = new Set(['genese-7']), PURGE = 224;
function purger(I) {
  if (!I || !Array.isArray(I.taxons) || I.purge === PURGE) return I;
  const par = new Map(I.taxons.map(t => [t.id, t])), vu = new Map();
  const ecarte = t => { if (!t) return false; if (vu.has(t.id)) return vu.get(t.id); vu.set(t.id, false);
    const v = FUSIONS_ECARTEES.has(t.origine?.fusion) || ecarte(par.get(t.parent)); vu.set(t.id, v); return v; };
  const parcelle = id => [...FUSIONS_ECARTEES].some(f => String(id).includes('~' + f + '-'));
  const J = { ...I, purge: PURGE, taxons: I.taxons.filter(t => !ecarte(t)) };
  if (Array.isArray(I.parcelles)) J.parcelles = I.parcelles.filter(p => !parcelle(p.id));
  if (Array.isArray(I.monde?.fusions)) J.monde = { ...I.monde, fusions: I.monde.fusions.filter(f => !FUSIONS_ECARTEES.has(f?.id)) };
  return J;
}
const abreger = I => I && { monde: I.monde, cycle: { n: I.cycle?.n }, abrege: true, purge: I.purge,...(I.parcelles ? { parcelles: I.parcelles.map(p => ({ id: p.id, type: p.type })) } : {}),
  taxons: I.taxons.map(t => ({ id: t.id, parent: t.parent, eteint: t.eteint, plan: { regime: Tampon?.regimeDe ? Tampon.regimeDe(t, I.catalogue?.traits) : t.plan?.regime, masse_kg: t.plan?.masse_kg }, populations: t.populations.map(p => ({ biome: p.biome, effectif: p.effectif, ...(p.parcelles ? { parcelles: p.parcelles } : {}) })) })) };
function lire() { try { const m = JSON.parse(localStorage.getItem(CLE) || '{}'); S.courant = purger(m.courant) || null; S.gen0 = purger(m.gen0) || null; S.profil = m.profil || null;
  S.abrege = m.abrege?.courant?.purge === PURGE ? m.abrege : null;   // (§224) un abrégé d'avant porte la genèse 7 : on l'oublie, le monde le refait
  S.monde = m.monde || null; S.lot = m.lot || {}; S.depuis = m.depuis || null; S.dernierEnvoi = m.dernierEnvoi || 0; S.lignees = m.lignees || {}; S.lotQ = m.lotQ || {}; S.fusionsVues = m.fusionsVues || []; S.mereVue = m.mereVue || null; } catch (e) { }
  // (§225) LE MONDE DE SECOURS (orvane/secours.js) : sans monde ni abrégé (un premier lancement, hors ligne ou avant que le
  // monde publié n'arrive), le jeu a déjà la faune d'Orvane ; le monde publié le remplace dès qu'il arrive
  //   Un abrégé gardé (fait du monde publié, sans les fiches des lignées) ne passe devant que s'il est plus récent que le secours
  const sec = racine.ORVANE_SECOURS;
  if (!S.courant && sec?.taxons && (!S.abrege?.courant || (S.abrege.courant.cycle?.n ?? -1) <= (sec.cycle?.n ?? 0))) {
    S.courant = sec; S.gen0 = S.gen0 || sec; S.monde = S.monde || identite(S.courant); }
  if (!S.profil) S.profil = { exposition: Corr.EXPOSITION };          // (§225) sans profil reçu, le réglage du jeu : le bestiaire d'Orvane
  carte(); S.rangs = rangsRarete(); }
// les biomes du monde décident de la carte des sols du jeu (sv-1 a les siens ; le monde d'Orvane, les siens : Corr.choisirCarte)
function carte() { const I = S.courant || S.abrege?.courant; if (I && Corr.choisirCarte) Corr.choisirCarte(I.biomes?.length ? I.biomes.map(b => b.id) : I.taxons.flatMap(t => t.populations.map(p => p.biome))); }
function ecrire() { if (S.courant && !S.courant.abrege) S.abrege = { courant: abreger(S.courant), gen0: abreger(S.gen0) };
  try { localStorage.setItem(CLE, JSON.stringify({ abrege: S.abrege, profil: S.profil, monde: S.monde, lot: S.lot, depuis: S.depuis,
  dernierEnvoi: S.dernierEnvoi, lignees: S.lignees, lotQ: S.lotQ, fusionsVues: S.fusionsVues, mereVue: S.mereVue })); } catch (e) { } }
// l'identité d'un monde : son id et sa naissance (un monde refait de zéro garde son id, pas sa date)
const identite = inst => inst?.monde ? inst.monde.id + '|' + (inst.monde.ne || inst.monde.graine) : null;
async function charger() {
  lire();
  // un fichier du monde : du réseau (et on le garde), sinon du cache (hors ligne, le dernier monde reçu)
  const cache = async () => { try { return typeof caches !== 'undefined' ? await caches.open(CACHE_MONDE) : null; } catch (e) { return null; } };
  const prendre = async f => {
    try { const r = await fetch(CHEMIN + f, { cache: 'no-cache' }); if (r.ok) { const j = await r.json();
      try { const c = await cache(); if (c && typeof Response !== 'undefined') await c.put(CHEMIN + f, new Response(JSON.stringify(j), { headers: { 'Content-Type': 'application/json' } })); } catch (e) { }
      return j; } } catch (e) { }
    try { const c = await cache(), r = c && await c.match(CHEMIN + f); return r ? await r.json() : null; } catch (e) { return null; } };
  const [brut, profil, jeux] = await Promise.all([prendre('instantane.json'), prendre('profil.json'), prendre('jeux.json')]);
  const inst = purger(brut);                                                           // (§224) sans la genèse 7
  // le réglage : le profil du monde, et ce que le jeu en montre (jeux.json, sinon Corr.EXPOSITION ; un monde fait pour le jeu
  // comme sv-1 porte encore le sien)
  const X = (Array.isArray(jeux) ? jeux : []).find(j => j.id === JEU)?.exposition;
  if (profil) S.profil = { ...profil, exposition: X && Object.keys(X).length ? X : profil.exposition || Corr.EXPOSITION };
  else if (S.profil && !S.profil.exposition) S.profil.exposition = Corr.EXPOSITION;
  if (inst) {
    const id = identite(inst);
    if (id !== S.monde) { S.monde = id; S.courant = null; S.gen0 = null; }             // un autre monde, ou le même refait : on repart de sa génération 0
    if (!S.courant || S.courant.secours || inst.cycle.n > S.courant.cycle.n) S.courant = inst;   // (§225) le secours cède au monde publié
  }
  if (S.courant && (!S.gen0 || (S.gen0.secours && !S.courant.secours))) {               // faute de génération 0, le premier instantané vu
    const g0 = purger(await prendre('generation-0.json')); S.gen0 = g0 || (S.gen0?.secours && !S.courant.secours ? S.courant : S.gen0 || S.courant); }
  if (S.courant) S.abrege = null;
  carte(); S.rangs = rangsRarete(); inscrireLignees(); ecrire();                                        // (les fiches des lignées d'abord : elles se gardent, l'instantané non)
  // l'île a été peuplée avant que le monde n'arrive (ou d'après un autre monde) : ses comptes se refont ; si c'était un autre
  // monde, ce que la graine met sur l'île aussi (les bêtes déjà là restent, les suivantes suivent le monde)
  // (§225) même monde, même cycle : l'île se recompte quand même, car les fiches refaites ont repris le compte de leur socle
  if (S.applique && S.courant) {
    const autre = !S.applique.startsWith(identite(S.courant) + '|');
    try { orvaneAppliquer(); if (autre && typeof tirerBestiaire === 'function' && typeof especesIle !== 'undefined') { especesIle = tirerBestiaire(); repartirIle(especesIle); repeuplerIle(); }
      else if (typeof especesIle !== 'undefined') repartirIle(especesIle); } catch (e) { }
  }
}

// L'île peuplée d'après un autre monde (celui d'avant, ou l'abrégé gardé) quand le monde d'Orvane arrive : dans un monde au
// bestiaire d'Orvane, ses bêtes sauvages de la faune du jeu que le monde n'a pas s'en vont, et les lignées du monde viennent à
// leur place, comme à l'arrivée sur une île neuve. Sans cela, les naissances perpétuaient l'ancienne faune tout le temps de
// l'île. Les compagnes, les automates, les boss ne bougent pas ; la faune partagée repart de là (faune.js).
function repeuplerIle() {
  if (S.profil?.exposition?.bestiaire !== 'orvane' || typeof beasts === 'undefined' || typeof poser !== 'function' || typeof capEsp !== 'function'
    || typeof especesIle === 'undefined' || typeof SPEC === 'undefined') return 0;
  const part = b => b && b.sp && !b.tame && !b.dead && !b.sp.orvane && Corr.FAUNE?.[b.sp.id] && !especesIle.has(b.sp.id);
  for (let k = beasts.length - 1; k >= 0; k--) if (part(beasts[k])) beasts.splice(k, 1);
  let n = 0;
  for (const sp of SPEC) if (sp.orvane && especesIle.has(sp.id)) { const deja = beasts.filter(b => b.sp === sp && !b.dead).length;
    for (let i = deja; i < Math.round(capEsp(sp) * .75); i++) { const b = poser(sp); if (b) { beasts.push(b); n++; } } }
  beasts.forEach((b, k) => { b.num = k; });
  try { if (typeof fauneNouvelleIle === 'function') fauneNouvelleIle(); } catch (e) { }
  return n;
}

// --- le temps : l'avancement entre le cycle d'avant (joint à l'instantané) et celui-ci ---
function dureeCycle() { const c = S.profil?.monde?.cycle || '24h', n = parseFloat(c) || 24; return c.endsWith('d') ? n * 864e5 : c.endsWith('m') ? n * 6e4 : n * 36e5; }
function avancement() {
  if (!S.courant?.precedent || !S.profil) return 1;
  const t = (Date.now() - Date.parse(S.courant.cycle.date)) / dureeCycle();
  return clamp(t / (S.profil.exposition.propagation_cycles || 1), 0, 1);
}
const mele = (a, b, k) => a + (b - a) * k;

// --- les taxons ---
// le régime de fait (Tampon.regimeDe) : un carnivore qui digère aussi les plantes est rendu en omnivore
const regime = t => Tampon?.regimeDe ? Tampon.regimeDe(t, (S.courant || S.gen0)?.catalogue?.traits) : t?.plan?.regime;
const taxon = (inst, tid) => inst?.taxons.find(x => x.id === tid) || null;
// la présence d'une lignée sur l'île, telle qu'un joueur la croise : ses bêtes, pesées par leur taille (masse^0,75) — dix
// millions d'insectes ne se voient pas plus qu'un troupeau
function presenceSur(inst, tid, biomes) { const t = taxon(inst, tid); return effectifSur(inst, tid, biomes) * Math.pow(Math.max(.001, t?.plan?.masse_kg || 1), .75); }
function effectifSur(inst, tid, biomes) { const t = taxon(inst, tid); if (!t || t.eteint) return 0; return t.populations.filter(p => biomes.has(p.biome)).reduce((a, p) => a + effectifIci(inst, p), 0); }
// (§222) UNE ÎLE = UNE PARCELLE PAR BIOME. Dans un monde à parcelles (Orvane docs/15), chaque île tire de sa graine, pour
// chacun de ses biomes, l'une de ses parcelles : sa faune suit ce qui vit dans cette parcelle (une espèce qui n'y est pas
// encore arrivée n'y paraît pas), et ses lots la disent (« parcelle ») pour que la chasse et le défrichage y restent.
// L'effectif d'une parcelle est ramené à l'échelle du biome (× le nombre de ses parcelles) : la génération 0, par biome,
// reste la référence. Sans parcelles (ou hors ligne sans elles), rien ne change.
function parcelleIle(type, inst, graine) {
  const L = ((inst || S.courant || S.abrege?.courant)?.parcelles || []).filter(p => p.type === type); if (!L.length) return null; if (L.length === 1) return L[0].id;
  let g = graine >>> 0; if (graine == null) try { g = typeof SEED !== 'undefined' ? SEED >>> 0 : 0; } catch (e) { }
  let h = (g ^ 0x2545f491) >>> 0; for (let i = 0; i < type.length; i++) h = Math.imul(h ^ type.charCodeAt(i), 16777619) >>> 0;
  return L[h % L.length].id;
}
function effectifIci(inst, p) {
  if (!p.parcelles || !inst?.parcelles) return p.effectif;
  const id = parcelleIle(p.biome, inst); if (!id) return p.effectif;
  return (p.parcelles[id] || 0) * (inst.parcelles.filter(x => x.type === p.biome).length || 1);
}
function solsIle() {   // les sols de l'île, numéros du jeu
  let rares = []; try { rares = typeof RaresIle !== 'undefined' ? RaresIle : []; } catch (e) { }
  if (!rares.length) try { rares = typeof biomesGraine === 'function' && typeof SEED !== 'undefined' ? biomesGraine(SEED) : []; } catch (e) { }
  return [...COMMUNS, ...rares];
}
function biomesIle() { return new Set(solsIle().map(Corr.biomeOrvane).filter(Boolean)); }
// (§225) la base d'une fiche de lignée : un socle neutre (correspondance.js, SOCLES), ou une espèce du jeu (un ancêtre, une machine).
// Une fiche gardée d'avant le §225 nomme encore l'espèce faite main qui lui prêtait sa conduite : elle prend le socle qui y répond
const ANCIENS_GABARITS = { cotonnier: 'paisible', brouteur: 'herbivore', glaneur: 'omnivore', traqueur: 'carnivore' };
const baseDe = id => (Corr.SOCLES && Object.prototype.hasOwnProperty.call(Corr.SOCLES, id) ? Corr.SOCLES[id] : null) || especeJeu(id);
const especeJeu = id => { try { const sp = typeof specById !== 'undefined' && Object.prototype.hasOwnProperty.call(specById, id) ? specById[id] : null; return sp && !sp.orvane ? sp : null; } catch (e) { return null; } };
// le plus proche ancêtre d'un taxon qui est une espèce du jeu (pas une lignée) : par les parents d'Orvane, ou par l'identifiant
function ancetreJeu(tid) {
  const vus = new Set(); let id = tid;
  while (id && !vus.has(id)) { vus.add(id); if (especeJeu(id)) return id;
    const t = taxon(S.courant, id) || taxon(S.gen0, id); id = t?.parent || (id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : null); }
  return null;
}
const taxonDe = sp => sp?.orvane ? sp.orvane.taxon : Corr.taxonDe(sp?.id, S.courant);

// === les lignées : d'un taxon d'Orvane, une fiche du jeu ===
// « Crapaud-buffle (Tourbière) » → « Crapaud-buffle de tourbière »
function nomJeu(nom, id) {
  const m = /^(.*?)\s*\((.*)\)$/.exec(nom || ''); if (!m) return nom || id;
  const b = m[2].toLowerCase(); return `${m[1]} ${/^[aeiouyéèh]/.test(b) ? 'd\'' : 'de '}${b}`;
}
// les traits que porte au moins la moitié de la lignée : ils font partie de son allure
function traitsDominants(t) { const c = {}; for (const p of t.phenotypes) for (const id of p.traits) c[id] = (c[id] || 0) + p.frequence; return Object.keys(c).filter(k => c[k] >= .5); }
function definir(t) {
  // (§225) un chasseur né (carnivore, ou de la viande pour moitié de son régime) chasse, même s'il digère aussi les plantes
  const chasseur = t.plan.regime === 'carnivore' || (t.plan.diete?.viande || 0) >= .5;
  const anc = ancetreJeu(t.id), baseId = anc || Corr.gabaritDe({ ...t.plan, regime: chasseur ? 'carnivore' : regime(t) }), base = baseDe(baseId); if (!base) return null;
  const ref = anc ? taxon(S.gen0, anc) || taxon(S.courant, anc) : null;
  const corpsBase = ref?.plan?.corps ? Corps.normaliser(ref.plan.corps) : Corr.corpsDe(base);
  const corps = t.plan.corps && Corps ? Corps.normaliser(t.plan.corps) : null;
  const ailes = c => (c?.ailes || 0) >= .5;
  const genere = !!corps && (!anc || corps.forme !== corpsBase.forme || corps.pattes !== corpsBase.pattes || ailes(corps) !== ailes(corpsBase) || Corps.distance(corps, corpsBase) >= SEUIL_CORPS);
  const bio = [...new Set(t.populations.filter(p => p.effectif >= 1).flatMap(p => Corr.biomesSV ? Corr.biomesSV(p.biome) : [Corr.biomeSV(p.biome)]).filter(Boolean))];
  return { id: t.id, nom: nomJeu(t.nom, t.id), base: baseId, gabarit: !anc, genere, corps, traits: traitsDominants(t), bio,
    masse: t.plan.masse_kg, masseRef: ref?.plan?.masse_kg || 25 * base.sz ** 3, vit: t.plan.vitesse_rel, vitRef: ref?.plan?.vitesse_rel || base.spd * 2,
    nocturne: t.plan.activite === 'nocturne', locomotion: t.plan.locomotion || [], regime: regime(t), vu: Date.now(),
    activite: t.plan.activite, social: t.plan.sociabilite, taille: t.plan.taille_m, diete: { ...(t.plan.diete || {}) }, chasseur, forme: corps?.forme || null,   // (§225)
    temperament: t.plan.temperament,                                                                                   // (§226)
    froid: 1 - (Number.isFinite(t.plan.niche?.temperature) ? t.plan.niche.temperature : .5),                          // (§246) d'un pays froid : la laine, la toison
    milieu: [...(t.populations || [])].sort((a, b) => (b.effectif || 0) - (a.effectif || 0))[0]?.biome || null,          // (§237) son milieu d'origine
    ...(t.plan.regime === 'synthetique' ? { machine: { role: t.plan.role, modules: { ...(t.plan.modules || {}) } } } : {}) };   // (§223) une machine d'Orvane
}
// la fiche du jeu : une copie de celle de l'ancêtre (sa conduite), à la mesure de la lignée
function appliquerDef(sp, def, base) {
  for (const k in base) if (k !== 'tables' && (!(k in sp) || k === 'cap' || k === 'spd' || k === 'sz')) { const v = base[k]; sp[k] = Array.isArray(v) ? v.slice() : v; }
  sp.id = def.id; sp.n = def.nom;
  sp.orvane = { taxon: def.id, base: def.base, gabarit: def.gabarit, genere: !!def.genere && typeof osOrvane === 'function', corps: def.corps, traits: def.traits || [], locomotion: def.locomotion || [],
    masse: def.masse, regime: def.regime || ({ c: 'carnivore', h: 'herbivore', o: 'omnivore' })[base.diet] || 'omnivore' };   // (§219) le dessin lit sa masse et son régime
  if (def.gabarit) {                                                  // (§220) sa fiche ne lui prête que sa conduite : elle grimpe et vole
    const loco = def.locomotion || [];                                //   selon ses propres modes, pas selon ceux de sa fiche
    // (§241) marcher aux parois, c'est l'affaire d'un insecte ou d'un serpent ; une autre grimpeuse (sur quatre pattes, sur deux) saute
    // deux cubes : elle ne monte plus aux falaises comme une araignée
    const paroi = loco.includes('grimpe') && (def.forme === 'hexapode' || def.forme === 'serpent');
    sp.grimpe = paroi ? Math.max(base.grimpe || 0, .6) : 0;
    sp.orvane.vol = loco.includes('vol');
    // (§225) ce que dit le monde, et plus la fiche : le troupeau suit sa sociabilité, une sauteuse franchit deux cubes, une
    // butineuse change les baies en nectar (comme l'oglodon d'autrefois), et sa viande vient de son corps
    if (def.social != null) sp.herd = def.social >= .4 ? 1 : 0;
    if (loco.includes('saut') || (loco.includes('grimpe') && !paroi)) sp.bond = Math.max(sp.bond || 0, 2); else delete sp.bond;
    if ((def.diete?.nectar || 0) >= .2) sp.nectar = 1; else delete sp.nectar;
    sp.orvane.fruits = (def.diete?.fruits || 0) + (def.diete?.nectar || 0) >= .3;   // (§231) elle va aux buissons à baies
    if (Corr.SOCLES?.[def.base]) sp.orvane.viande = classeViande(def);
    sp.orvane.chasseur = !!def.chasseur;
  }
  sp.orvane.froid = def.froid;                                          // (§246)
  sp.orvane.amphibie = (def.locomotion || []).includes('nage') && !nageurPur(def.locomotion);   // (§243) elle nage aussi : l'eau ne lui fait pas peur
  sp.orvane.nage = nageurPur(def.locomotion);                         // (§221) une lignée qui ne vit que dans l'eau : on ne la lie pas,
  if (sp.orvane.nage) { sp.lien = 0; sp.grimpe = 0; }                 //   elle ne grimpe pas
  const k = def.gabarit ? 1 : clamp(Math.cbrt((def.masse || 1) / (def.masseRef || 1)), .6, 1.7);
  // (une lignée sans ancêtre du jeu : sa taille suit le logarithme de sa masse, de 0,5 pour un insecte de 10 g à 1,6 pour une bête
  // de 100 kg — à la racine cubique, presque tout le monde d'Orvane, qui pèse de 20 g à 5 kg, aurait la taille d'un caillou)
  sp.sz = def.gabarit ? r2(clamp(.5 + (Math.log10(Math.max(.001, def.masse || 1)) + 2) * .275, .5, 2) * 1.15) : r2(base.sz * k * 1.15);   // (§238) un peu plus grandes, toutes
  sp.orvane.sz0 = sp.sz;                                              // (§226) la taille d'après la masse ; la puissance la retouche (chaines)
  sp.spd = r2(base.spd * clamp((def.vit || 1) / (def.vitRef || 1), .7, 1.4));
  const rang = def.gabarit ? S.rangs?.[def.id] || 0 : 0;               // (§218) une lignée rare du monde : un trophée, plus robuste
  if (rang) { sp.rarete = rang; sp.dur = r2((base.dur || 1) * (1 + .3 * (rang - 2))); } else { delete sp.rarete; if (base.dur) sp.dur = base.dur; else delete sp.dur; }
  if (def.corps) { const C = def.corps.couleurs; sp.shell = C.robe.slice(); sp.dark = C.sombre.slice(); sp.leg = C.sombre.map(v => v * .8 | 0); sp.oeil = C.oeil.slice(); sp.ventre = C.ventre.slice(); }
  if (def.nocturne) sp.nuit = true;
  if (def.gabarit && def.activite) sp.activite = def.activite;        // (§228) son rythme : diurne, nocturne, crépusculaire, ou jour et nuit
  if (def.gabarit && !def.machine) { sp.matiere = matiereDe(def); delete sp._tk; }   // (§230) sa matière : fourrure, écailles, plumes, peau, chitine
  if (def.machine) machineDef(sp, def, base);                         // (§223) une machine d'Orvane : un automate à la mesure de ses modules
  if (def.gabarit) sp.bio = (def.bio || []).slice();                  // (§221) une lignée sans ancêtre ne vit que sur les sols où elle a un effectif :
  else if (def.bio && def.bio.length) sp.bio = def.bio.slice();       //   sans aucun, elle ne paraît pas (elle ne prend plus les sols de sa fiche)
  return sp;
}
// (§223) une machine d'Orvane (Orvane docs/16) devient un automate du jeu : sa fiche (traceur, moissonneur) lui prête sa
// conduite ; son blindage la rend plus dure, son arme lui donne un tir (le moissonneur n'en a pas), et sans pince ni arme elle
// ne tire pas. Ce qu'elle chasse et sa posture dépendent de l'île (machineIle)
function machineDef(sp, def, base) {
  const M = def.machine.modules || {}, arme = M.arme || 0;
  sp.orvane.machine = { role: def.machine.role, modules: { ...M } };
  sp.dur = r2((base.dur || 1) * (1 + (M.blindage || 0)) * (sp.rarete ? 1 + .3 * (sp.rarete - 2) : 1));
  if (arme >= .15 && !base.tir) sp.tir = { deg: r2(.05 + .12 * arme), portee: r2(6 + 6 * arme), cadence: 1.8, vit: 15, precision: .7 };
  else if (!((M.pince || 0) > .1) && arme < .15) sp.tir = null; else if (base.tir) sp.tir = { ...base.tir };
  sp.chasse = []; sp.duel = 0; sp.peur = base.peur || 0; sp.oeil = (base.oeil || [120, 200, 255]).slice();
}
// sur une île : la machine chasse les lignées que les machines régulent sur ces sols (à sa taille : Orvane vise des bêtes trois
// fois plus légères qu'elle, à un facteur 35 près), et prend la posture de sa population là (Orvane : posture) ; ses yeux la disent
const YEUX = { neutre: [120, 200, 255], defensive: [255, 196, 80], fuyante: [150, 240, 120], hostile: [255, 60, 50] };
function machineIle(sp, ile) {
  const I = S.courant, t = taxon(I, sp.orvane.taxon); if (!I || !t) return;
  const ici = t.populations.filter(p => ile.has(p.biome)).sort((a, b) => effectifIci(I, b) - effectifIci(I, a))[0], posture = ici?.posture || 'neutre';
  const m = t.plan.masse_kg || 1, chasse = [];
  if (sp.tir && (t.plan.modules?.pince || 0) > .1) for (const u of I.taxons) { if (u.eteint || u.plan?.regime === 'synthetique' || !specById[u.id]?.orvane) continue;
    const lg = Math.abs(Math.log10((u.plan.masse_kg || 1) * 3 / m)); if (lg > 1.55) continue;
    if (u.populations.some(p => ile.has(p.biome) && (p.regulation || 0) >= .02)) chasse.push(u.id); }
  sp.chasse = chasse; sp.duel = posture === 'hostile' && sp.tir ? 1 : 0;
  const p0 = especeJeu(sp.orvane.base)?.peur || 0; sp.peur = posture === 'fuyante' ? .95 : posture === 'hostile' ? 0 : posture === 'defensive' ? Math.max(p0, .4) : p0;   // (défensive : elle se tient à distance)
  sp.oeil = YEUX[posture].slice(); sp.orvane.posture = posture;
}
function enregistrer(def) {
  if (typeof SPEC === 'undefined' || typeof specById === 'undefined') return null;
  if (def.gabarit && ANCIENS_GABARITS[def.base]) def.base = ANCIENS_GABARITS[def.base];   // (§225) une fiche d'avant
  const base = baseDe(def.base); if (!base) return null;
  let sp = Object.prototype.hasOwnProperty.call(specById, def.id) ? specById[def.id] : null;
  if (sp && !sp.orvane) return sp;                                    // une espèce du jeu porte déjà ce nom
  const neuf = !sp; sp = appliquerDef(sp || {}, def, base);
  if (neuf) { SPEC.push(sp); specById[sp.id] = sp; }
  if (sp.orvane) sp.orvane._m = null;                                 // les mesures du corps se refont
  try { if (typeof DESSINS !== 'undefined') DESSINS['bete_' + sp.id] = d => sp.orvane.genere || !DESSINS['bete_' + def.base] ? (typeof dessinOrvane === 'function' ? dessinOrvane(d, sp) : null) : DESSINS['bete_' + def.base](d); } catch (e) { }
  if (!Corr.SOCLES?.[def.base]) for (const o of SPEC) if (o !== sp && Array.isArray(o.chasse) && o.chasse.includes(def.base) && !o.chasse.includes(sp.id)) o.chasse.push(sp.id);   // une lignée d'une espèce du jeu : ses prédateurs sont ceux de son ancêtre
  completer(sp);
  try { fantaisie(sp); } catch (e) { }                                 // (§237) la couche de fantaisie
  return sp;
}
// les tables du jeu tenues par espèce : la lignée prend les lignes de son ancêtre (sa viande, ses aptitudes, son combat,
// sa voix…). Certaines tables ne sont pas encore posées quand les lignées arrivent : on repasse à chaque île.
function completer(sp) {
  const b = sp.orvane.base, id = sp.id, alias = T => { if (T && T[b] !== undefined && T[id] === undefined) T[id] = T[b]; };
  const voix = (() => { try { return typeof SON !== 'undefined' ? SON.VOIX : null; } catch (e) { return null; } })();
  const S0 = Corr.SOCLES?.[b];
  if (S0) {                                                           // (§225) un socle : ses lignes à lui, sa voix et sa viande d'après le corps
    const T = S0.tables || {}, Q = talents(sp);                         // (§233) ses talents de compagne, d'après la lignée
    try { if (APT[id] === undefined) APT[id] = Q.apt; } catch (e) { }
    try { if (Q.peche && PECHE_APT[id] === undefined) PECHE_APT[id] = Q.peche; } catch (e) { }
    try { if (Q.friandise && FRIANDISE_APT[id] === undefined) FRIANDISE_APT[id] = Q.friandise; } catch (e) { }
    try { if (Q.bondit && BONDIT[id] === undefined) BONDIT[id] = 1; } catch (e) { }
    try { if (T.lien && FACONS[id] === undefined) FACONS[id] = T.lien; } catch (e) { }
    try { if (T.combat && COMBAT[id] === undefined) COMBAT[id] = T.combat; } catch (e) { }
    try { if (voix && !voix[id]) voix[id] = voixDe(sp); } catch (e) { }
    try { const v = INGR[sp.orvane.viande]; if (v && !INGR['v_' + id]) INGR['v_' + id] = v; } catch (e) { }
    return;
  }
  try { alias(APT); } catch (e) { } try { alias(COMBAT); } catch (e) { } try { alias(voix); } catch (e) { } try { alias(FACONS); } catch (e) { }
  try { alias(BONDIT); } catch (e) { } try { alias(PECHE_APT); } catch (e) { } try { alias(FRIANDISE_APT); } catch (e) { } try { alias(COMPETENCES); } catch (e) { }
  try { if (INGR['v_' + b] && !INGR['v_' + id]) INGR['v_' + id] = INGR['v_' + b]; } catch (e) { }
}
// (§225) LA VIANDE D'UNE LIGNÉE vient de son corps, et plus de l'espèce qui lui prêtait sa conduite : un oiseau donne un blanc
// de volaille, un insecte de la chair de carapace, un serpent de la chair d'écailles ; un chasseur sa chair (de fauve à partir de
// six kilos) ; une autre bête, selon sa taille, de la viande menue, tendre, du gibier ou du gros gibier. La rareté de la viande dit
// à partir de quelle exploration la lignée peut paraître (index.html : rareteOk, §118).
function classeViande(def) {
  const m = def.masse || 1, loco = def.locomotion || [], f = def.forme;
  if (f === 'oiseau' || loco.includes('vol')) return 'v_volaille';
  if (f === 'hexapode') return 'v_chitine';
  if (f === 'serpent') return 'v_ecaille';
  if (def.chasseur) return m >= 6 ? 'v_fauve' : 'v_chasseur';
  return m < .15 ? 'v_menu' : m < 2 ? 'v_tendre' : m < 12 ? 'v_gibier' : 'v_grosgibier';
}
// (§230) LA MATIÈRE D'UNE LIGNÉE, d'après son corps : un oiseau a des plumes, un insecte de la chitine, un serpent ou un poisson des
// écailles ; une bête qui rampe surtout, des écailles ; une bête d'eau qui marche aussi, ou à cuir épais, de la peau ; les autres, de
// la fourrure (le jeu : TEX, matiereEspece)
function matiereDe(def) {
  const loco = def.locomotion || [], f = def.forme, tr = new Set(def.traits || []);
  if (f === 'oiseau' || loco.includes('vol')) return 'plume';
  if (f === 'hexapode') return 'chitine';
  if (f === 'serpent') return 'ecaille';
  if (loco.includes('reptation') && !loco.includes('course') && !loco.includes('saut')) return 'ecaille';
  if (tr.has('peau-epaisse') || (loco.includes('nage') && loco.includes('marche'))) return 'peau';
  // (§246) le pelage se décline : une toison longue chez une grosse bête du froid (ou un géant), de la laine chez un brouteur qui vit
  // en troupeau ou au froid, des poils ras sinon
  const froid = Number.isFinite(def.froid) ? def.froid : .5, m = def.masse || 1, brouteur = !def.chasseur && def.regime === 'herbivore';
  if (!def.chasseur && m >= 80 && (froid > .56 || tr.has('gigantisme'))) return 'toison';
  if (brouteur && m >= 2 && m < 400 && (froid > .6 || ((def.social || 0) >= .55 && froid > .44))) return 'laine';
  if (froid > .72 && m >= 5) return 'toison';
  return 'pelage';
}
// (§225) LA VOIX D'UNE LIGNÉE, d'après son corps et sa taille (SON.VOIX). Un poisson se tait. (§235) Un oiseau crie, un petit
// gazouille, un serpent siffle, un insecte stridule s'il est gros ; un grand chasseur rugit, un coureur hennit, un amphibien
// coasse, un géant pousse de longs soupirs graves ; les autres grognent. Les petites voix d'abord, les grandes pour les épiques.
function voixDe(sp) {
  const d = S.lignees[sp.id] || {}, m = d.masse || 1, f = d.forme, loco = d.locomotion || [], lg = Math.log10;
  if (nageurPur(loco)) return null;
  if (f === 'oiseau' || loco.includes('vol')) return { k: 'cri', f: clamp(2400 - 500 * lg(m * 10), 900, 2600) };
  if (f === 'hexapode') return m >= 5 ? { k: 'stridule', f: clamp(2600 - 400 * lg(m), 1200, 2600) } : { k: 'trille', f: clamp(4200 - 900 * lg(m * 100), 2200, 5200), n: 4, vite: 1 };
  if (f === 'serpent') return { k: 'siffle', f: clamp(1300 - 250 * lg(m * 10), 600, 1400) };
  if (d.chasseur) return m >= 80 ? { k: 'rugit', f: clamp(150 - 30 * lg(m), 70, 110) }
    : { k: 'grogne', f: clamp(220 - 60 * lg(m * 10), 60, 240), d: clamp(.3 + .15 * lg(m * 10), .3, .9), rauque: 1 };
  if (m < 1) return { k: 'trille', f: clamp(3600 - 1200 * lg(m * 100), 1800, 5400), n: m < .1 ? 2 : 3 };
  if (loco.includes('nage') && loco.includes('marche') && m < 10) return { k: 'coasse', f: clamp(200 - 60 * lg(m * 10), 100, 220) };
  if (loco.includes('course') && m >= 10 && m < 400) return { k: 'hennit', f: clamp(1000 - 200 * lg(m), 480, 820) };
  if (m >= 150) return { k: 'soupir', f: clamp(130 - 30 * lg(m), 45, 95) };
  return { k: 'grogne', f: clamp(180 - 50 * lg(m), 55, 180), d: clamp(.3 + .2 * lg(m), .3, 1.1) };
}
// (§225) QUI CHASSE QUI : la règle d'Orvane (moteur/orvane.js, appetence) — une proie d'un tiers de sa masse est idéale, rien
// au-delà d'une fois et demie ni sous un cinquantième ; une proie plus vive échappe ; un oiseau est hors de portée d'un marcheur ;
// le groupe protège ; l'heure compte. Un chasseur de dix kilos et plus s'en prend aussi aux villageois.
const SEUIL_APPETENCE = .2;
function appetence(a, b) {
  const rap = (b.masse || 1) / (a.masse || 1); if (rap < .02 || rap > 1.5) return 0;
  const lg = Math.log10(rap) - Math.log10(.3); let f = Math.exp(-(lg * lg) / .5);
  const vp = (a.vit || 4) * (a.taille || 1), vq = (b.vit || 4) * (b.taille || 1); f *= clamp(Math.sqrt(vp / Math.max(.01, vq)), .6, 1.4);
  if ((b.locomotion || []).includes('vol') && !(a.locomotion || []).includes('vol')) f *= .3;
  f *= 1 - .2 * (b.social || 0);
  const ap = a.activite, aq = b.activite;
  if (ap && aq && ap !== aq && ap !== 'continue' && aq !== 'continue' && ap !== 'crepusculaire' && aq !== 'crepusculaire') f *= .6;
  return f;
}
// Les espèces du jeu qui chassent encore (les automates) visent une classe de proies (Corr.CLASSES_PROIE) ; une compagne faite
// main garde ses proies d'avant, que les lignées rejoignent (une liste qui nomme un brouteur, un glaneur… vise le gibier).
function classesProie(d) {
  if (!d || d.chasseur || d.machine || nageurPur(d.locomotion)) return [];
  const m = d.masse || 1, C = [];
  if (m >= .05 && m <= 20) C.push('gibier');
  if (m >= 5) C.push('gros-gibier');
  if ((d.locomotion || []).includes('vol') || ((d.locomotion || []).includes('course') && (d.vit || 0) >= 6)) C.push('gibier-vif');
  return C;
}
// (§226) LA PUISSANCE D'UNE LIGNÉE : son rang parmi les lignées du monde, de 0 (la plus douce) à 1 (la plus redoutable), d'après
// sa masse, la chasse, ses organes (cornes, massue, crêtes…), son tempérament et sa rareté. Elle règle son allure (lignees.js : ronde
// et mignonne en bas, anguleuse et épique en haut), sa taille (un peu plus petite en bas, jusqu'à un tiers plus grande en haut) et
// les îles où on la croise (attrait : les premières îles tirent les plus douces, les lointaines les plus redoutables).
function scorePuissance(d, sp) {
  const m = clamp((Math.log10(Math.max(.001, d.masse || 1)) + 1.7) / 3.5, 0, 1);
  const org = (d.corps?.organes || []).reduce((a, o) => a + (Number.isFinite(o?.taille) ? o.taille : 0) * (o.type === 'antennes' || o.type === 'nageoires' ? .3 : 1), 0);
  return .5 * m + .25 * (d.chasseur ? 1 : 0) + .2 * Math.min(1, org / 1.5) + .1 * clamp(d.temperament ?? .4, 0, 1) + .05 * (sp.rarete >= 3 ? (sp.rarete - 2) / 3 : 0);
}
function puissances(L) {
  const R = L.filter(sp => !sp.orvane.machine).map(sp => [sp, scorePuissance(S.lignees[sp.id], sp)]).sort((a, b) => a[1] - b[1]), n = R.length;
  R.forEach(([sp], i) => { const p = n > 1 ? i / (n - 1) : .5, cute = clamp((.35 - p) / .35, 0, 1), epique = clamp((p - .65) / .35, 0, 1);
    sp.orvane.puissance = r2(p); sp.sz = r2(Math.min(2.9, (sp.orvane.sz0 || sp.sz) * (1 - .08 * cute + .6 * epique))); sp.orvane._m = null; });   // (§237) une épique : une stature de légende
}
const attrait = sp => { const p = sp.orvane?.puissance ?? .5, c = clamp(prof() / 16, 0, 1) * .9; return .12 + Math.exp(-((p - c) ** 2) / .125); };
function chaines() {
  if (typeof SPEC === 'undefined') return;
  const L = SPEC.filter(sp => sp.orvane && Corr.SOCLES?.[sp.orvane.base] && S.lignees[sp.id]);
  const proieJeu = id => Corr.FAUNE?.[id] && Corr.FAUNE[id] !== 'carnivore';   // une espèce faite main qui était du gibier
  for (const sp of L) {                                               // les lignées qui chassent : leurs proies, d'après Orvane
    const a = S.lignees[sp.id]; if (!a.chasseur || nageurPur(a.locomotion)) { if (Array.isArray(sp.chasse)) sp.chasse = []; continue; }
    sp.chasse = L.filter(o => o !== sp && !nageurPur(S.lignees[o.id].locomotion) && appetence(a, S.lignees[o.id]) >= SEUIL_APPETENCE).map(o => o.id);
    if ((a.masse || 0) >= 10) sp.chasse.push('villageois');
  }
  puissances(L);
  for (const o of SPEC) {                                             // les espèces du jeu qui chassent : par classe de proies
    if (o.orvane || !Array.isArray(o.chasse) || !o.chasse.length) continue;
    const vise = new Set(o.chasse.filter(k => Corr.CLASSES_PROIE?.includes(k)));
    if (o.chasse.some(proieJeu)) vise.add('gibier');
    if (!vise.size) continue;
    for (const sp of L) if (!o.chasse.includes(sp.id) && classesProie(S.lignees[sp.id]).some(c => vise.has(c))) o.chasse.push(sp.id);
  }
}
// (§233) LES TALENTS D'UNE COMPAGNE, d'après sa lignée, et plus d'après une espèce faite main. Ses aptitudes (bois, pierre, fibre,
// baies, éclats, ferraille, chasse, défense : la table APT du jeu) suivent son régime, sa taille, ses organes et sa façon d'aller ;
// une nageuse pêche, une mangeuse de fruits aime les friandises, une sauteuse ou une volante atteint les îles volantes ; sa
// compétence vient de ce qu'elle est (une monture charge, un oiseau fait la vigie, une camouflée voile de brume, un grand
// herbivore en troupeau brame, une fouisseuse ou une lourde secoue le sol) ; un quadrupède de huit kilos et plus se monte.
const METIERS = ['abat le bois mort, et vous en rapporte', 'creuse, et vous rapporte des pierres', 'coupe les herbes, les fleurs et les roseaux',
  'cueille les baies', 'déniche des éclats', 'ramasse la ferraille', 'chasse quand elle a faim, et rapporte les os', 'vous défend'];
function talents(sp) {
  const d = S.lignees[sp.id] || {}, loco = d.locomotion || [], m = d.masse || 1, die = d.diete || {}, tr = new Set(d.traits || []), org = d.corps?.organes || [], f = d.forme;
  const n = v => Math.max(1, Math.min(5, Math.round(v))), pu = clamp(sp.orvane?.puissance ?? .4, 0, 1), lourd = clamp((Math.log10(m) - .3) / 1.3, 0, 1);
  const fouit = loco.includes('fouissage'), grimpe = loco.includes('grimpe'), nage = loco.includes('nage') && !nageurPur(loco), vol = loco.includes('vol') || f === 'oiseau', saut = loco.includes('saut');
  const arme = org.some(o => ['cornes', 'defenses', 'massue'].includes(o.type) && o.taille >= .3), cuir = org.some(o => o.type === 'carapace' || o.type === 'plaques');
  const apt = [n(1 + 2.5 * lourd + (arme ? 1.5 : 0)), n(1 + (fouit ? 3 : 0) + 1.5 * lourd), n(1 + 4 * (die.feuilles || 0)),
    n(1 + 4 * ((die.fruits || 0) + (die.graines || 0) * .5 + (die.nectar || 0)) + (grimpe ? 1 : 0)), n(1 + (tr.has('vibrisses') || tr.has('yeux-nocturnes') ? 2 : 0) + (arme ? 1 : 0)), 1,
    d.chasseur ? n(2 + 3 * pu) : 0, n(1 + 3 * pu + (cuir ? 1 : 0))];
  const montable = f === 'quadrupede' && m >= 8 && !nageurPur(loco);
  const comp = montable ? 'coursier' : vol ? 'sterne' : tr.has('camouflage') ? 'felin' : sp.herd && m >= 5 && !d.chasseur ? 'bramard' : fouit || lourd >= .5 ? 'tellurien' : null;
  return { apt, montable, comp, bondit: saut || vol, peche: nage ? n(2 + 2 * (die.viande || 0) + (die.insectes || 0)) : 0,
    friandise: (die.fruits || 0) + (die.nectar || 0) >= .3 ? n(3 + 2 * ((die.fruits || 0) + (die.nectar || 0))) : 0 };
}
// les talents qui tiennent à la fiche elle-même (la compétence, la monture, le métier dit), posés à l'inscription
function talentsFiche(sp) {
  if (!Corr.SOCLES?.[sp.orvane?.base] || sp.orvane.machine) return;
  const Q = talents(sp), d = S.lignees[sp.id] || {}, m = d.masse || 1, vit = d.vit || 4;
  if (Q.comp) sp.comp = Q.comp; else delete sp.comp;
  if (Q.montable) sp.monture = { marche: r2(3.4 + .3 * Math.min(4, vit / 2)), course: r2(4.8 + .4 * Math.min(4, vit / 1.5)), saut: 10.5, endu: Math.round(10 + 14 * clamp((Math.log10(m) - .9) / 1, 0, 1)), fougue: 6 };
  else delete sp.monture;
  // (§235) une monture sauvage se dompte au rodéo : domptée, elle accepte le lien presque à coup sûr (index.html, COND_LIEN.dompte)
  try { if (Q.montable) { const L0 = FACONS[sp.id] || Corr.SOCLES?.[sp.orvane.base]?.tables?.lien; if (L0) FACONS[sp.id] = { ...L0, ou: ['dompte', .9] }; } } catch (e) { }
  let k = 0; for (let i = 0; i < 8; i++) if (i !== 5 && Q.apt[i] > Q.apt[k]) k = i;
  sp.metier = METIERS[k];
  try { APT[sp.id] = Q.apt; } catch (e) { }                           // (la défense suit la puissance, connue maintenant)
  // (§234) LES ATTAQUES SIGNATURE, d'après les organes : des cornes ou des défenses chargent de loin et vite (on l'esquive de côté),
  // une massue frappe lourd et repousse loin, un aiguillon pique vif ; une épique frappe jusqu'à 40 % plus fort. Un herbivore armé
  // ne fuit plus au premier pas : frappé, il riposte.
  const org = d.corps?.organes || [], gros = ty => org.some(o => o.type === ty && o.taille >= .3), ep = clamp(((sp.orvane.puissance ?? .5) - .65) / .35, 0, 1);
  const C = gros('cornes') || gros('defenses') ? { deg: .16, ramasse: .6, bond: .42, portee: 4.2, recul: .9, pause: 1.6 }
    : gros('massue') ? { deg: .22, ramasse: .8, bond: .2, portee: 2.2, recul: 1.4, pause: 2.4 }
    : gros('aiguillon') ? { deg: .12, ramasse: .25, bond: .32, portee: 2.6, recul: .5, pause: 1 } : null;
  try { if (C && d.chasseur) COMBAT[sp.id] = { ...C, deg: r2(C.deg * (1 + .4 * ep)) }; else if (d.chasseur && Corr.SOCLES?.carnivore?.tables?.combat) COMBAT[sp.id] = { ...Corr.SOCLES.carnivore.tables.combat, deg: r2(.13 * (1 + .4 * ep)) }; } catch (e) { }
  if (C && !d.chasseur) { sp.riposte = r2(.6 + .3 * ep); sp.peur = Math.min(sp.peur ?? 1, .5); } else if (!d.chasseur) delete sp.riposte;
}
// (§237) LA FANTAISIE. Orvane fait des bêtes vraies ; Stone Valley en fait des créatures de légende. Chaque lignée reçoit un élément,
// tiré de son milieu d'origine dans Orvane, de son rythme et de son corps : la braise (savanes, déserts, volcans), le givre (toundras,
// sommets, banquises), le cristal (montagnes, déserts froids, grottes), la sylve (forêts, jungles), l'abysse (lacs, côtes, récifs, le
// large), l'orage (steppes, hauteurs), l'ombre (la nuit, les grottes, les profondeurs) ou l'aurore (prairies, toundras). L'élément
// donne sa palette, vive et lumineuse, à la place des bruns d'Orvane, et son nom : le genre d'Orvane, puis ce qu'elle est en légende
// (« Orvi, vouivre des braises »). Le corps, lui, se transforme au dessin (lignees.js, lgFantaisie) : cornes de cristal, crinière de
// flammes, queue élémentaire, runes, ailes d'éther — de plus en plus à mesure que la lignée est puissante.
const ELEMENTS = {
  braise:  { n: 'des braises',  robe: [222, 92, 44],   sombre: [74, 30, 32],  ventre: [255, 196, 120], oeil: [255, 226, 96],  lueur: [255, 150, 40],  corne: [46, 34, 40],   part: '#ffb24a' },
  givre:   { n: 'du givre',     robe: [170, 214, 242], sombre: [58, 96, 152], ventre: [238, 248, 255], oeil: [120, 240, 255], lueur: [150, 236, 255], corne: [214, 244, 255], part: '#e4f8ff' },
  cristal: { n: 'de cristal',   robe: [156, 118, 214], sombre: [58, 38, 112], ventre: [226, 204, 252], oeil: [255, 130, 226], lueur: [236, 150, 255], corne: [206, 170, 255], part: '#efd2ff' },
  sylve:   { n: 'des mousses',  robe: [72, 156, 92],   sombre: [28, 64, 46],  ventre: [206, 236, 150], oeil: [226, 255, 120], lueur: [176, 255, 104], corne: [122, 86, 52],  part: '#cdff86' },
  abysse:  { n: 'des abysses',  robe: [38, 122, 166],  sombre: [14, 40, 82],  ventre: [150, 232, 222], oeil: [100, 255, 240], lueur: [70, 255, 222],  corne: [255, 128, 150], part: '#8cfff2' },
  orage:   { n: 'de l\'orage',  robe: [74, 86, 138],   sombre: [24, 28, 62],  ventre: [196, 206, 244], oeil: [255, 250, 160], lueur: [255, 244, 120], corne: [226, 228, 255], part: '#fff6a8' },
  ombre:   { n: 'des ombres',   robe: [56, 42, 90],    sombre: [18, 12, 36],  ventre: [118, 96, 168], oeil: [206, 162, 255], lueur: [176, 120, 255], corne: [34, 22, 54],   part: '#b896ff' },
  aurore:  { n: 'de l\'aurore', robe: [250, 228, 196], sombre: [196, 132, 62], ventre: [255, 252, 240], oeil: [255, 204, 92],  lueur: [255, 214, 120], corne: [255, 222, 130], part: '#fff2b8' },
  // (§239) douze de plus : six du milieu, six rares
  magma:   { n: 'du magma',     robe: [66, 44, 40],    sombre: [26, 16, 16],  ventre: [255, 128, 48],  oeil: [255, 206, 70],  lueur: [255, 112, 24],  corne: [38, 28, 28],   part: '#ff7a22' },
  sable:   { n: 'des sables',   robe: [224, 186, 122], sombre: [140, 96, 52], ventre: [250, 234, 194], oeil: [255, 222, 120], lueur: [255, 216, 128], corne: [178, 130, 72], part: '#ecca92' },
  vent:    { n: 'des vents',    robe: [198, 228, 238], sombre: [96, 140, 162], ventre: [242, 250, 252], oeil: [160, 232, 255], lueur: [222, 252, 255], corne: [232, 246, 252], part: '#eeffff' },
  roche:   { n: 'de la roche',  robe: [124, 116, 104], sombre: [60, 54, 48],  ventre: [172, 162, 142], oeil: [255, 192, 92],  lueur: [255, 182, 84],  corne: [92, 86, 78],   part: '#c8b49a' },
  ambre:   { n: 'de l\'ambre',  robe: [204, 124, 32],  sombre: [102, 54, 14], ventre: [255, 204, 112], oeil: [255, 232, 140], lueur: [255, 192, 64],  corne: [232, 152, 42], part: '#ffc052' },
  petale:  { n: 'des pétales',  robe: [250, 178, 208], sombre: [178, 82, 122], ventre: [255, 234, 242], oeil: [255, 122, 182], lueur: [255, 184, 218], corne: [255, 216, 234], part: '#ffc4de' },
  sang:    { n: 'du sang',      robe: [152, 22, 36],   sombre: [42, 6, 12],   ventre: [222, 92, 98],   oeil: [255, 44, 44],   lueur: [255, 42, 54],   corne: [236, 222, 204], part: '#ff2c3c' },
  korlaz:  { n: 'du Korlaz',    robe: [48, 42, 54],    sombre: [16, 12, 20],  ventre: [98, 112, 82],   oeil: [192, 255, 92],  lueur: [172, 255, 72],  corne: [32, 28, 36],   part: '#9eff5c' },
  monochrome: { n: 'monochrome', robe: [172, 172, 172], sombre: [34, 34, 34], ventre: [236, 236, 236], oeil: [255, 255, 255], lueur: [255, 255, 255], corne: [18, 18, 18], part: '#ffffff' },
  neant:   { n: 'du néant',     robe: [16, 14, 22],    sombre: [0, 0, 0],     ventre: [62, 58, 72],    oeil: [255, 255, 255], lueur: [150, 110, 255], corne: [250, 250, 255], part: '#d8ccff' },
  spectre: { n: 'des spectres', robe: [172, 212, 222], sombre: [72, 102, 122], ventre: [222, 246, 250], oeil: [162, 255, 255], lueur: [172, 255, 250], corne: [204, 242, 246], part: '#c2f8ff' },
  astral:  { n: 'des étoiles',  robe: [32, 38, 92],    sombre: [10, 12, 40],  ventre: [92, 112, 192],  oeil: [255, 255, 222], lueur: [222, 232, 255], corne: [204, 214, 255], part: '#eaeeff' },
};
// (§239) les rares : le hasard de la lignée seul en décide, quel que soit son milieu ; le Korlaz (des bêtes infectées), le
// monochrome et le néant, une lignée sur quarante à soixante-dix ; le sang chez les chasseurs et les bêtes de nuit, les spectres et les
// étoiles chez les bêtes de nuit et du crépuscule
const RARES_EL = [['korlaz', .025, () => true], ['monochrome', .015, () => true], ['neant', .015, () => true],
  ['sang', .05, d => d.chasseur || d.nocturne], ['spectre', .05, d => d.nocturne || d.activite === 'crepusculaire'], ['astral', .06, d => d.nocturne]];
const MILIEUX_EL = {
  prairie: { aurore: 3, sylve: 1, orage: 1, petale: 1.5 }, savane: { braise: 2, aurore: 1, orage: 1, sable: 1 }, steppe: { orage: 2, braise: 1, aurore: 1, vent: 1.5 },
  maquis: { braise: 1, sylve: 1, aurore: 1, petale: 1 }, desert: { braise: 2, cristal: 1, sable: 2.5 }, 'desert-froid': { cristal: 2, givre: 1, roche: 1.5 },
  volcan: { braise: 2, magma: 2.5 }, montagne: { cristal: 2, orage: 1, givre: 1, roche: 1.5 }, sommets: { givre: 2, orage: 1, vent: 1.5 },
  toundra: { givre: 2, aurore: 1, vent: .7 }, taiga: { givre: 1, ombre: 1, sylve: 1, ambre: 1 }, banquise: { givre: 3 }, 'mer-froide': { givre: 2, abysse: 1 },
  foret: { sylve: 2, ombre: 1, ambre: 1.2 }, jungle: { sylve: 2, ombre: 1, ambre: .8, petale: .8 }, marais: { sylve: 1, abysse: 1, ombre: 1 },
  mangrove: { sylve: 1, abysse: 1, ambre: .6 }, grotte: { ombre: 2, cristal: 1, roche: 1.5 },
  cote: { abysse: 2, orage: 1, vent: .8 }, lac: { abysse: 2, sylve: 1 }, riviere: { abysse: 2, sylve: 1 }, recif: { abysse: 2, cristal: 1 },
  abysses: { abysse: 2, ombre: 1 }, large: { abysse: 2, orage: 1, vent: 1 },
};
const MILIEUX_NOMS = { 'prairie': 'prairie', 'savane': 'savane', 'steppe': 'steppe', 'maquis': 'maquis', 'désert froid': 'desert-froid', 'désert': 'desert',
  'volcan': 'volcan', 'montagne': 'montagne', 'sommets': 'sommets', 'toundra': 'toundra', 'taïga': 'taiga', 'banquise': 'banquise', 'mer froide': 'mer-froide',
  'forêt': 'foret', 'jungle': 'jungle', 'marais': 'marais', 'mangrove': 'mangrove', 'grotte': 'grotte', 'côte': 'cote', 'lac': 'lac', 'rivière': 'riviere',
  'récif': 'recif', 'abysses': 'abysses', 'haute mer': 'large', 'large': 'large' };
const hacher = s => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h; };
function milieuDe(d) {
  if (d.milieu && MILIEUX_EL[d.milieu]) return d.milieu;
  const n = (d.nom || '').toLowerCase(); let best = null;
  for (const [k, v] of Object.entries(MILIEUX_NOMS)) if (n.endsWith(' ' + k) || n.endsWith('\'' + k)) { if (!best || k.length > best[0].length) best = [k, v]; }
  return best ? best[1] : 'prairie';
}
function elementDe(sp, d) {
  { let h = hacher(sp.id + ':rare'); h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0; h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    const r = (h % 10000) / 10000; let bas = 0;   // (§239) un élément rare, d'abord
    for (const [k, p, ok] of RARES_EL) { if (ok(d) && r >= bas && r < bas + p) return k; bas += p; } }
  const W = { ...(MILIEUX_EL[milieuDe(d)] || MILIEUX_EL.prairie) }, plus = (k, w) => { W[k] = (W[k] || 0) + w; };
  if (d.nocturne || sp.nuit) plus('ombre', 2); else if (d.activite === 'crepusculaire') { plus('ombre', .7); plus('aurore', .7); }
  if (d.forme === 'hexapode') plus('cristal', 1);
  if (d.forme === 'oiseau' || (d.locomotion || []).includes('vol')) { plus('orage', 1); plus('aurore', .5); }
  if (d.chasseur) { plus('braise', .5); plus('orage', .3); }      // (le rang n'y entre pas : il bouge d'un monde à l'autre, l'élément reste)
  const tot = Object.values(W).reduce((a, x) => a + x, 0); let r = (hacher(sp.id) % 1000) / 1000 * tot;
  for (const [k, w] of Object.entries(W)) if ((r -= w) <= 0) return k;
  return Object.keys(W)[0];
}
// tourner une teinte autour du gris de la couleur (un peu de variété d'une lignée à l'autre, dans le même élément)
function teinte(c, deg) {
  const a = deg * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), k = 1 / 3, sq = Math.sqrt(k);
  const M = [[cs + (1 - cs) * k, k * (1 - cs) - sq * sn, k * (1 - cs) + sq * sn], [k * (1 - cs) + sq * sn, cs + k * (1 - cs), k * (1 - cs) - sq * sn], [k * (1 - cs) - sq * sn, k * (1 - cs) + sq * sn, cs + k * (1 - cs)]];
  return M.map(r => clamp(Math.round(r[0] * c[0] + r[1] * c[1] + r[2] * c[2]), 0, 255));
}
// ce qu'elle est en légende, d'après son corps et son régime ; son rang (la puissance) choisit dans la liste : des noms d'enfant
// pour les mignonnes, de géant pour les épiques, et le hasard de la lignée entre ceux d'un même rang
const ROLES = {
  eau:     [['ondin', 'bulleur', 'perlin'], ['naïade', 'ondoyeur'], ['kraken', 'hydre'], ['léviathan']],
  serpent: [['serpentin', 'anguillon'], ['guivre', 'couleuvrine'], ['naga', 'hydre'], ['vouivre', 'wyrm']],
  vol:     [['sylphe', 'plumeau', 'pépiot'], ['harpie', 'oiseau-lyre'], ['griffon', 'roc'], ['roc-tonnerre', 'roc']],
  insecte: [['scarabée-gemme', 'luciole'], ['mante', 'scarabée-runique'], ['mante-reine', 'scolopendre'], ['colosse-scarabée']],
  chasse:  [['diablotin', 'griffon-nain'], ['warg', 'lynx-runique'], ['chimère', 'manticore'], ['tarasque', 'chimère']],
  cornu:   [['faon', 'cabri'], ['cerf-runique', 'bélier'], ['bélier-titan', 'élan-des-légendes'], ['béhémoth']],
  licorne: [['licorneau'], ['licorne'], ['licorne'], ['licorne-reine']],
  herbe:   [['pompon', 'follet', 'mousseron', 'trottinet'], ['lutin', 'faon', 'trotteur'], ['colosse', 'mammouth-runique'], ['béhémoth', 'titan']],
  omni:    [['farfadet', 'grignon'], ['glouton', 'kobold'], ['troll-des-bois', 'ogre'], ['titan']],
};
function roleDe(sp, d) {
  const f = d.forme || 'quadrupede', ch = !!d.chasseur, pu = sp.orvane.puissance ?? .5, loco = d.locomotion || [];
  const org = d.corps?.organes || [], a = ty => org.some(o => o.type === ty && o.taille >= .3), el = sp.orvane.el;
  const rang = pu < .35 ? 0 : pu < .7 ? 1 : pu < .9 ? 2 : 3;
  const cat = nageurPur(loco) ? 'eau' : f === 'serpent' ? 'serpent' : f === 'oiseau' || loco.includes('vol') ? 'vol' : f === 'hexapode' ? 'insecte'
    : ch ? 'chasse' : org.some(o => o.type === 'cornes' && o.taille >= .3 && o.nombre === 1) ? 'licorne' : a('cornes') ? 'cornu' : d.regime === 'omnivore' ? 'omni' : 'herbe';
  if (cat === 'vol' && el === 'braise' && rang >= 2) return 'phénix';
  if (cat === 'chasse' && rang >= 1 && (a('aiguillon') || a('dard'))) return 'manticore';
  const L = ROLES[cat][rang]; return L[(hacher(sp.id) >>> 4) % L.length];
}
function fantaisie(sp) {
  const d = S.lignees[sp.id]; if (!sp.orvane || sp.orvane.machine || !d || !Corr.SOCLES?.[sp.orvane.base]) return;
  const el = sp.orvane.el = elementDe(sp, d), E = ELEMENTS[el], h = hacher(sp.id), rot = ((h >>> 8) % 37) - 18;
  sp.shell = teinte(E.robe, rot); sp.dark = teinte(E.sombre, rot); sp.ventre = teinte(E.ventre, rot * .5);
  sp.leg = sp.dark.map(v => v * .8 | 0); sp.oeil = E.oeil.slice();
  sp.orvane.lueurEl = E.lueur.slice(); sp.orvane.corneEl = E.corne.slice(); sp.orvane.partEl = E.part;
  if (sp.brule && !sp.volcan) delete sp.brule;                     // (§238) la morsure de braise : pouvoirs.js
  const genre = String(d.nom || sp.n || '').split(/[\s,]/)[0] || sp.id;
  sp.orvane.nomOrvane = d.nom; sp.n = genre + ', ' + roleDe(sp, d) + ' ' + E.n;
  sp.orvane._m = null;
}
// (§233) LA MIGRATION DES COMPAGNES. Une compagne d'une espèce faite main, retirée de la nature (index.html, FAITE_MAIN), devient la
// lignée d'Orvane la plus proche : même régime, taille voisine, qui vole si elle volait, qu'on peut monter si c'était une monture. Elle
// garde son nom, son niveau et ses potions. Le choix est fait une fois : la sauvegarde suivante porte la lignée.
// La table des espèces d'avant, pour les seules sauvegardes d'avant : leur nom (pour le dire au joueur), leur taille, leur régime,
// si elles volaient ou se montaient, et la viande qui remplace la leur au garde-manger (orvaneViande). Elles n'existent plus ailleurs.
const ANCIENNES = {
  brouteur: { n: 'Brouteur', sz: 0.85, g: 'herbivore', v: 'v_tendre' },
  bosseu: { n: 'Bossu', sz: 1.35, g: 'herbivore', v: 'v_tendre' },
  glaneur: { n: 'Glaneur', sz: 0.6, g: 'omnivore', v: 'v_menu' },
  traqueur: { n: 'Traqueur', sz: 1, g: 'carnivore', v: 'v_chasseur' },
  spectre: { n: 'Spectre', sz: 1.25, g: 'carnivore', v: 'v_fauve' },
  coursier: { n: 'Coursier', sz: 1.15, g: 'herbivore', monture: 1, v: 'v_gibier' },
  coursier_o: { n: 'Coursier orange', sz: 1.18, g: 'herbivore', monture: 1, v: 'v_gibier' },
  coursier_r: { n: 'Coursier rouge', sz: 1.22, g: 'herbivore', monture: 1, v: 'v_grosgibier' },
  coursier_a: { n: 'Coursier d\'aurore', sz: 1.25, g: 'herbivore', monture: 1, v: 'v_grosgibier' },
  crapaud: { n: 'Crapaud-buffle', sz: 1.5, g: 'omnivore', v: 'v_ecaille' },
  varan: { n: 'Varan d\'ocre', sz: 1.35, g: 'omnivore', v: 'v_ecaille' },
  vesseron: { n: 'Vesseron', sz: 1.2, g: 'herbivore', v: 'v_tendre' },
  cerf: { n: 'Cerf de verre', sz: 1.55, g: 'herbivore', v: 'v_grosgibier' },
  salamandre: { n: 'Salamandre de braise', sz: 1.25, g: 'omnivore', v: 'v_fauve' },
  sika: { n: 'Cerf des cerisiers', sz: 1.4, g: 'herbivore' },
  lentigrade: { n: 'Lentigrade', sz: 1.9, g: 'herbivore', v: 'v_gibier' },
  cotonnier: { n: 'Cotonnier', sz: 1.5, g: 'herbivore', v: 'v_tendre' },
  carillonneur: { n: 'Carillonneur', sz: 1.35, g: 'herbivore', v: 'v_gibier' },
  oglodon: { n: 'Oglodon', sz: 1.35, g: 'herbivore', v: 'v_grosgibier' },
  lentisakura: { n: 'Lentigrade-cerisier', sz: 2.2, g: 'herbivore' },
  felin: { n: 'Félin de brume', sz: 1.05, g: 'carnivore', v: 'v_fauve' },
  bramard: { n: 'Bramard', sz: 1.4, g: 'herbivore', v: 'v_gibier' },
  sterne: { n: 'Sterne des nues', sz: 1.3, g: 'omnivore', vole: 1, v: 'v_volaille' },
  dragon: { n: 'Dragon à plumes', sz: 1, g: 'carnivore', vole: 1, v: 'v_fauve' },
  renard: { n: 'Renard des pétales', sz: 0.85, g: 'herbivore' },
  trottin_menu: { n: 'Trottin furet', sz: 0.8, g: 'herbivore' },
  trottin_echasse: { n: 'Trottin haute-tige', sz: 1.2, g: 'herbivore' },
  trottin_pataud: { n: 'Trottin racine', sz: 1.2, g: 'herbivore' },
  trottin_bondeur: { n: 'Trottin bondelaine', sz: 1, g: 'herbivore' },
  trottin_huppe: { n: 'Trottin augure', sz: 0.9, g: 'herbivore' }
};
const MIGREES = {};
function orvaneMigrer(esp) {
  const v = Object.prototype.hasOwnProperty.call(ANCIENNES, esp) ? ANCIENNES[esp] : null;
  if (!v || typeof SPEC === 'undefined') return esp;
  if (MIGREES[esp]) return MIGREES[esp];
  const g = v.g || 'herbivore';
  // sa masse, lue à l'échelle des lignées (appliquerDef : la taille suit le logarithme de la masse) : la compagne garde à peu près sa taille
  const m0 = Math.pow(10, clamp(((v.sz || 1) - .5) / .275 - 2, -2, 2)), vole = !!v.vole, monte = !!v.monture, chasse = g === 'carnivore';
  const deja = {}; for (const k in MIGREES) deja[MIGREES[k]] = (deja[MIGREES[k]] || 0) + 1;
  let best = null, bs = -1e9;
  for (const sp of SPEC) {
    if (!sp.orvane || sp.orvane.machine || sp.orvane.nage || !Corr.SOCLES?.[sp.orvane.base]) continue;
    const d = S.lignees[sp.id] || {}, gg = d.chasseur ? 'carnivore' : Corr.GROUPE?.[d.regime] || 'omnivore', vol = !!sp.orvane.vol;
    const sc = (gg === g ? 3 : 0) + (vole ? (vol ? 5 : -2) : vol ? -2 : 0) + (monte ? (sp.monture ? 4 : -2) : 0) + (chasse === !!d.chasseur ? 1.5 : 0)
      - 1.2 * Math.abs(Math.log10(Math.max(.001, d.masse || 1) / m0)) + (taxon(S.courant, sp.id) && !taxon(S.courant, sp.id).eteint ? .5 : 0) - .6 * (deja[sp.id] || 0);
    if (sc > bs || (sc === bs && best && sp.id < best.id)) { bs = sc; best = sp; }
  }
  if (best) MIGREES[esp] = best.id;
  return best ? best.id : esp;
}
function inscrireLignees() {
  if (!S.pret || !Corps) return;
  if (S.courant) for (const t of S.courant.taxons) {
    if (t.eteint || especeJeu(t.id)) continue;
    const def = definir(t); if (def) S.lignees[t.id] = def;
  }
  // la mémoire est bornée : on oublie d'abord les lignées éteintes les plus anciennes
  const ids = Object.keys(S.lignees);
  if (ids.length > LIGNEES_MAX) { const vivants = new Set((S.courant?.taxons || []).filter(t => !t.eteint).map(t => t.id));
    for (const id of ids.filter(i => !vivants.has(i)).sort((a, b) => (S.lignees[a].vu || 0) - (S.lignees[b].vu || 0)).slice(0, ids.length - LIGNEES_MAX)) delete S.lignees[id]; }
  for (const def of Object.values(S.lignees)) enregistrer(def);
  chaines();
  try { for (const sp of SPEC) if (sp.orvane) talentsFiche(sp); } catch (e) { }   // (§233) après la puissance : la défense en dépend
  try { for (const sp of SPEC) if (sp.orvane) fantaisie(sp); } catch (e) { }      // (§237) et la fantaisie, qui grandit avec elle
}
// une espèce inconnue « parent.biome » : on la rend par son parent, le temps qu'Orvane dise qui elle est
function especeDeSecours(id) {
  if (S.lignees[id]) return enregistrer(S.lignees[id]);
  let p = id; while (p.includes('.')) { p = p.slice(0, p.lastIndexOf('.')); if (especeJeu(p)) break; }
  const base = especeJeu(p); if (!base) return null;
  const suffixe = id.slice(id.lastIndexOf('.') + 1), b = Corr.BIOMES_SV[Corr.biomeSV(suffixe)];
  return enregistrer({ id, nom: b ? nomJeu(`${base.n} (${b.nom})`, id) : base.n, base: p, gabarit: false, genere: false, corps: null, traits: [], bio: base.bio, masse: 1, masseRef: 1, vit: 1, vitRef: 1 });
}

// === le jeu → le traducteur : les fiches sont posées ===
function orvaneEspeces() {
  S.pret = true;
  try {   // specById résout à la demande les lignées qu'il ne connaît pas encore (« crapaud.tourbiere »)
    if (typeof specById !== 'undefined' && !specById.__orvane) {
      const proto = Object.getPrototypeOf(specById) || Object.prototype;
      Object.defineProperty(specById, '__orvane', { value: true });
      Object.setPrototypeOf(specById, new Proxy(proto, { get(cible, id, recu) {
        if (typeof id === 'string' && id.includes('.') && !(id in cible)) { const sp = especeDeSecours(id); if (sp) return sp; }
        return Reflect.get(cible, id, recu); } }));
    }
  } catch (e) { }
  inscrireLignees();
}

// === Orvane → jeu : l'arrivée sur une île ===
// Les poids et les comptes suivent l'état du monde à ce cycle (pas d'interpolation : la même île donne la même faune à
// tous ceux qui ont le même instantané). Une espèce s'efface d'une île quand son effectif sur ses sols tombe sous
// seuil_extinction_jeu ET sous seuil_extinction_part de ce qu'il était à la génération 0. Une lignée prend la part
// de son ancêtre à proportion de ses effectifs ; une lignée sans ancêtre, la part d'une espèce moyenne.
// Bestiaire d'Orvane (profil.exposition.bestiaire = 'orvane', §217) : la faune faite main (Corr.FAUNE) s'est retirée de la
// nature (§225). Ce qu'elle avait sur une île (ses comptes et ses poids, régime par régime : Corr.BUDGET_ILE, BUDGET_SOL) se partage
// entre les lignées du même régime, à proportion de leur présence sur l'île (leurs bêtes, pesées par masse^0,75) ; le tout suit
// l'effectif du régime depuis la génération 0 (jusqu'au double). Autant de bêtes qu'avant, la même part d'herbivores, d'omnivores
// et de carnivores.
function orvaneAppliquer() {
  if (typeof SPEC === 'undefined' || typeof POIDS_ESPECE === 'undefined') return;
  if (S.courant || !S.abrege?.courant) return appliquerIle();
  S.courant = S.abrege.courant; const g = S.gen0; S.gen0 = g || S.abrege.gen0;       // le monde n'est pas encore là : son abrégé
  try { appliquerIle(); } finally { S.courant = null; S.gen0 = g; }
}
function appliquerIle() {
  S.qIle = {}; S.hybIle = {}; S.mefIle = {};                                         // les traits continus et les zones hybrides se relisent pour chaque île
  if (!S.poids0) { S.poids0 = { ...POIDS_ESPECE }; S.cap0 = Object.fromEntries(SPEC.filter(sp => !sp.orvane).map(sp => [sp.id, sp.cap])); }
  for (const sp of SPEC) {                                            // tout reprend sa valeur d'avant, à chaque île
    if (sp.orvane) { sp.cap = 0; delete POIDS_ESPECE[sp.id]; completer(sp); continue; }
    if (sp.id in S.cap0) sp.cap = S.cap0[sp.id];
    if (sp.id in S.poids0) POIDS_ESPECE[sp.id] = S.poids0[sp.id];
  }
  S.applique = S.courant && S.gen0 ? identite(S.courant) + '|' + S.courant.cycle.n : 'aucun';   // d'après quel monde l'île est peuplée
  if (!S.courant || !S.gen0) return;                                 // rien reçu : le jeu reste tel quel
  const ile = biomesIle(), X = S.profil?.exposition || {}, seuil = X.seuil_extinction_jeu ?? 0, part = X.seuil_extinction_part ?? .25;
  const moyen = (() => { const v = S.gen0.taxons.map(t => effectifSur(S.gen0, t.id, ile)).filter(x => x > 0); return v.length ? v.reduce((a, x) => a + x, 0) / v.length : 0; })();
  const ORV = X.bestiaire === 'orvane' ? bestiaireOrvane(ile) : null;
  S.repartition = ORV ? ORV.repartition : null;                        // (§225) pour la part de chaque espèce tirée (repartirIle)
  for (const sp of SPEC) {
    if (ORV && ORV.retire(sp)) { sp.cap = 0; delete POIDS_ESPECE[sp.id]; continue; }
    if (ORV && sp.orvane?.gabarit) { const r = ORV.part(sp) || (sp.orvane.machine ? null : placeTrophee(sp, ile)); if (!r) { sp.cap = 0; delete POIDS_ESPECE[sp.id]; } else { sp.cap = r.cap; POIDS_ESPECE[sp.id] = sp.orvane.machine ? r.poids : +(r.poids * attrait(sp)).toFixed(4); }   // (§226) la puissance et la profondeur
      if (sp.orvane.machine) machineIle(sp, ile); else chasseurLoin(sp); continue; }
    const tid = taxonDe(sp); if (!tid) continue;
    const L = sp.orvane, baseId = L ? L.base : sp.id;
    let ref = L && L.gabarit ? moyen : effectifSur(S.gen0, baseId, ile);
    if (!ref) { if (!L) continue; ref = moyen; }                      // l'espèce ne vivait pas sur ces sols : on ne touche à rien
    if (!ref) continue;
    const t = taxon(S.courant, tid), eff = t && !t.eteint ? effectifSur(S.courant, tid, ile) : 0;
    if (!t || t.eteint || eff <= 0 || eff < Math.min(seuil, ref * part)) { sp.cap = 0; delete POIDS_ESPECE[sp.id]; continue; }
    const ratio = eff / ref, cap0 = S.cap0[baseId] ?? sp.cap, poids0 = baseId in S.poids0 ? S.poids0[baseId] : L ? .3 : undefined;
    sp.cap = Math.max(1, Math.round(cap0 * Math.min(2, ratio)));
    if (poids0 != null) POIDS_ESPECE[sp.id] = +(poids0 * Math.min(3, ratio)).toFixed(4);
  }
  if (ORV) garantirChasseur(ile);
}

// === (§218) l'exploration : des chasseurs garantis, des lignées rares en trophées, le carnet des lignées ===
const NIV_CHASSEURS = 3, NIV_MEUTES = 8, NIV_MACHINES = 3;   // (§223) les machines d'Orvane, avec les chasseurs
const prof = () => { try { return typeof profondeur === 'function' ? profondeur() : 0; } catch (e) { return 0; } };
const nomRang = r => { try { return typeof RARETES !== 'undefined' ? RARETES[r - 1] : ''; } catch (e) { return ''; } };
// les lignées que le jeu peut montrer : celles qui vivent sur ses sols (dans le monde d'Orvane, BIOMES_SV[k].u)
function ligneesDuJeu(I) { const sols = new Set(Object.keys(Corr.BIOMES_SV).map(k => Corr.biomeOrvane(+k)).filter(Boolean));
  return (I?.taxons || []).filter(t => !t.eteint && !especeJeu(t.id) && t.populations.some(p => sols.has(p.biome) && p.effectif >= 1)); }
// le rang de rareté d'une lignée : sa présence dans le monde (bêtes × masse^0,75), parmi les lignées que le jeu peut montrer ;
// rare (3) le quart du bas, exotique (4) le dixième, légendaire (5) les trois centièmes — le jeu ne les tire qu'à partir de
// l'exploration que dit leur rareté (NIV_RARETE : 4, 6, 8), et elles sont plus robustes
function rangsRarete() {
  const I = S.courant || S.abrege?.courant; if (!I || S.profil?.exposition?.bestiaire !== 'orvane') return {};
  const pres = t => t.populations.reduce((a, p) => a + p.effectif, 0) * Math.pow(Math.max(.001, t.plan?.masse_kg || 1), .75);
  const L = ligneesDuJeu(I).map(t => [t.id, pres(t)]).sort((a, b) => a[1] - b[1]), n = L.length, R = {};
  L.forEach(([id], i) => { const q = (i + 1) / n; const r = q <= .03 ? 5 : q <= .1 ? 4 : q <= .25 ? 3 : 0; if (r) R[id] = r; });
  return R;
}
// plus loin, plus de chasseurs : un quart de plus dès la huitième exploration, moitié plus dès la douzième, et en groupe
function chasseurLoin(sp) {
  if (sp.diet !== 'c' || !(sp.cap > 0)) { if (sp.orvane) delete sp.meute; return; }
  const n = prof(), m = S.lignees[sp.id]?.masse || 5;
  // (§232) plus de chasseurs en nombre : le jeu en met déjà plus au loin (capEsp0, « plus de crocs »), et les deux s'ajoutaient ;
  // restent les meutes, qui naissent ensemble
  if (n >= NIV_MEUTES && m <= 40) sp.meute = 3; else delete sp.meute;
}
// un trophée trop rare pour avoir sa part de l'île y a quand même une petite place, dès l'exploration que dit sa rareté (le
// jeu, NIV_RARETE : rare dès 4, exotique dès 6, légendaire dès 8), s'il vit sur ses sols
const nivRarete = r => { try { return typeof NIV_RARETE !== 'undefined' ? NIV_RARETE[r] ?? 0 : [0, 0, 0, 4, 6, 8, 10][r] ?? 0; } catch (e) { return 0; } };
function placeTrophee(sp, ile) {
  if (!(sp.rarete >= 3) || prof() < nivRarete(sp.rarete) || !(presenceSur(S.courant, sp.orvane.taxon, ile) > 0)) return null;
  return { cap: sp.rarete >= 5 ? 1 : 2, poids: .004 };   // (son tirage passe surtout par la place des trophées : orvaneTirage)
}
// dès la troisième exploration, l'île a au moins un chasseur d'Orvane qui puisse s'y montrer : s'il n'y en a pas, celui des
// chasseurs qui vivent sur ses sols qui y est le plus présent reçoit une petite place
function garantirChasseur(ile) {
  if (prof() < NIV_CHASSEURS) return;
  const C = SPEC.filter(sp => sp.orvane?.gabarit && sp.diet === 'c');
  if (C.some(sp => sp.cap > 0)) return;
  const best = C.map(sp => [sp, presenceSur(S.courant, sp.orvane.taxon, ile)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1])[0];
  if (best) { best[0].cap = 2; POIDS_ESPECE[best[0].id] = .25; chasseurLoin(best[0]); }
}
// (§220) UNE LIGNÉE QUI VOLE. Au sol, elle suit la conduite de sa fiche (brouter, glaner, chasser). Elle s'envole pour fuir,
// pour une balade (plus souvent et plus longue chez un chasseur, qui plane), ou, chasseuse, pour gagner une proie éloignée,
// sur laquelle elle fond avant de se poser. En l'air, elle vole comme la sterne (volerVers) ; pour se poser, il lui faut un
// sol sec. Morte, elle tombe (chute) ; liée ou montée, elle marche. Rend true quand elle a vécu l'image en l'air.
function orvaneVol(b, dt) {
  if (b.dead || b.tame || b.as || typeof volerVers !== 'function') { if (b.enVol) { b.enVol = false; b.roll = 0; b.bat = 0; } return false; }
  const sp = b.sp, chasseur = sp.diet === 'c', cible = b.cible && !b.cible.dead ? b.cible : null;
  const dC = cible ? Math.hypot(cible.x - b.x, cible.y - b.y) : 1e9;
  if (!b.enVol) {
    const fuit = b.etat === 'fuir' || (b.alarm || 0) > .6, gagne = cible && dC > 6 && (b.etat === 'chasser' || b.etat === 'traquer');
    const balade = b.etat === 'errer' && Math.random() < dt / (chasseur ? 14 : 35);
    if (!fuit && !gagne && !balade) return false;
    b.enVol = true; b.vz = 3.4; b.v = 3.4; b.bat = 1; b.ph = 0; b.roll = 0; b.volC = [b.x, b.y]; b.volA = Math.random() * 6.28;
    b.volM = fuit ? 'fuir' : gagne ? 'chasse' : 'balade'; b.volT = fuit ? 5 + Math.random() * 4 : gagne ? 14 : (chasseur ? 14 : 7) + Math.random() * (chasseur ? 22 : 10);
    try { if (typeof burst === 'function') burst(b.x, b.y, b.z + .2, 4, '#e8e4dc'); } catch (e) { }
  }
  b.t += dt; b.age += dt; b.bob += dt * 2; b.volT -= dt;
  if (b.hit > 0) b.hit -= dt;
  if (b.alarm > 0) b.alarm -= dt * .3;
  const h = Math.max(3.5, Math.min(8, 2.5 + sp.sz * 3.5)), J = P, sH = sol(b.x, b.y);
  if (b.hit > 0 && b.volM !== 'fuir') { b.volM = 'fuir'; b.volT = Math.max(b.volT, 5); }
  const kv = 1 + .15 * Math.min(2, sp.sz || 1);                        // (§251) plus vite : un oiseau dépasse un marcheur, un grand plus encore
  let tx, ty, tz = sH + h, v = 5.6 * kv, mode = 'plane';
  if (b.volM === 'chasse' && cible && b.volT > 0) {                   // vers la proie, puis le piqué ; tout près, elle se pose et mord
    const haut = b.z - sol(b.x, b.y);
    tx = cible.x; ty = cible.y; mode = dC > 7 ? 'bat' : dC > 1.8 && haut > 1.4 ? 'pique' : 'pose'; v = (dC > 7 ? 7.5 : mode === 'pique' ? 10 : 3.4) * kv;   // (§240) elle fond sur la proie, ailes plaquées
    if (dC < 8) tz = sol(cible.x, cible.y) + .3 + dC * .25;
    if (dC < 1.4 && b.z < sol(b.x, b.y) + .7) return orvanePoser(b, 'chasser');
  } else if (b.volM === 'fuir' && b.volT > 0) {
    const a = Math.atan2(b.y - J.y, b.x - J.x); tx = b.x + Math.cos(a) * 8; ty = b.y + Math.sin(a) * 8; v = 8.5 * kv; mode = 'bat';
  } else if (b.volT > 0) {                                            // (§240) la balade : elle monte en spirale dans un courant chaud, puis file en planant
    const B0 = b.volP;
    if (!B0 || b.t > B0.fin) { const spir = !B0 || B0.k === 'glisse', a = Math.random() * 6.2832, r = 5 + Math.random() * 4;
      b.volP = spir ? { k: 'spirale', fin: b.t + 6 + Math.random() * 6, c: [b.volC[0] + Math.cos(a) * 4, b.volC[1] + Math.sin(a) * 4], r, t0: b.t, s: Math.random() < .5 ? 1 : -1 }
        : { k: 'glisse', fin: b.t + 3 + Math.random() * 4, cap: Math.atan2(b.volC[1] - b.y, b.volC[0] - b.x) + (Math.random() - .5) * 2 };
      if (spir) b.volA = Math.atan2(b.y - b.volP.c[1], b.x - b.volP.c[0]); }
    const Q = b.volP;
    if (Q.k === 'spirale') { b.volA += dt * v / Q.r * Q.s; tx = Q.c[0] + Math.cos(b.volA) * Q.r; ty = Q.c[1] + Math.sin(b.volA) * Q.r; tz = sH + h + Math.min(3.5, (b.t - Q.t0) * .45); }   // elle prend de la hauteur, en battant (§251)
    else { tx = b.x + Math.cos(Q.cap) * 8; ty = b.y + Math.sin(Q.cap) * 8; tz = sH + h * .7; v = 7 * kv; }
  } else {                                                            // se poser : là où elle est, si c'est sec ; sinon d'où elle est partie
    const i = (b.y | 0) * WS + (b.x | 0), mouille = Hgt[i] <= SEA || (typeof Eau !== 'undefined' && Eau[i]);
    if (mouille) { tx = b.volC[0]; ty = b.volC[1]; v = 6 * kv; mode = 'bat'; }
    else { tx = b.x + Math.cos(b.dir) * 1.5; ty = b.y + Math.sin(b.dir) * 1.5; tz = sH; v = 1.6; mode = 'pose'; if (b.z < sH + .35) return orvanePoser(b, 'errer'); }
  }
  b.thermique = false;                                                 // (§251) plus de montée en planant : pour monter, elle bat des ailes
  volerVers(b, tx, ty, tz, v, mode, dt);
  const fl = (typeof hRendu === 'function' ? hRendu(b.x, b.y) : sol(b.x, b.y)) + .2;
  if (b.z < fl) { b.z = fl; if (b.vz < 0) b.vz = 0; }
  return true;
}
// (§221) UNE LIGNÉE QUI NE VIT QUE DANS L'EAU : elle nage, et ne marche, ne court, ne saute, ne rampe, ne fouit, ne grimpe ni ne
// vole. Le jeu la fait naître dans l'eau qui borde ses sols (la mer au bord du rivage, les lacs et les rivières de la tourbière),
// et elle n'en sort pas : elle y nage, s'éloigne de qui l'approche, fuit plus vite si on la touche. Morte, elle flotte. Un
// chasseur du sol ne la poursuit pas. orvaneNage rend true quand sa vie de l'image s'est passée ici (toujours, dans l'eau).
const TERRESTRES = ['marche', 'course', 'saut', 'reptation', 'fouissage', 'grimpe', 'vol'];
const nageurPur = loco => (loco || []).includes('nage') && !(loco || []).some(l => TERRESTRES.includes(l));
function surfaceEau(x, y) {                                           // la hauteur de l'eau en (x, y), ou null sur la terre
  x |= 0; y |= 0; if (typeof Hgt === 'undefined' || x < 3 || y < 3 || x >= WS - 3 || y >= WS - 3) return null;
  const i = y * WS + x; if (typeof Eau !== 'undefined' && Eau[i] > Hgt[i]) return Eau[i];
  return Hgt[i] <= SEA && Bio[i] !== 8 && !(typeof PlT !== 'undefined' && PlT[i]) ? (typeof MER_Z !== 'undefined' ? MER_Z : SEA) : null;   // (§243) la mer a sa surface
}
function orvanePlaceEau(sp) {                                         // une case d'eau à moins de cinq cases d'un de ses sols
  const bio = sp.bio || []; if (!bio.length || typeof WS === 'undefined') return null;
  for (let k = 0; k < 800; k++) {
    const x = 8 + Math.random() * (WS - 16), y = 8 + Math.random() * (WS - 16), s = surfaceEau(x, y); if (s == null) continue;
    for (let r = 1; r <= 5; r++) for (let a = 0; a < 8; a++) { const u = (x + Math.cos(a * .7854) * r) | 0, v = (y + Math.sin(a * .7854) * r) | 0;
      if (hAt(u, v) > SEA && !(Eau[v * WS + u] > Hgt[v * WS + u]) && bio.includes(bAt(u, v))) return [x, y, s - .12]; }
  }
  return null;
}
function orvaneNage(b, dt) {
  const sp = b.sp, s = surfaceEau(b.x, b.y);
  if (b.dead) { b.dead += dt; b.vit = 0; if (s != null) { b.z += ((s - .04) - b.z) * Math.min(1, dt * 3); return true; } return false; }   // morte : elle remonte et flotte
  if (s == null) return false;                                        // hors de l'eau (l'eau a bougé) : la conduite du sol, le temps d'y revenir
  b.t += dt; b.age += dt; b.bob += dt * (2 + (b.alarm || 0) * 3);
  if (b.hit > 0) b.hit -= dt;
  if (b.alarm > 0) b.alarm = Math.max(0, b.alarm - dt * .25);
  const J = P, dJ = Math.hypot(J.x - b.x, J.y - b.y), loin = (sp.vue || 8) * .5 * (sp.peur ?? 1);
  if (b.hit > 0) b.alarm = 1; else if (dJ < loin) b.alarm = Math.max(b.alarm || 0, .7);
  const fuit = (b.alarm || 0) > .4;
  if (fuit) b.nCap = Math.atan2(b.y - J.y, b.x - J.x);
  else if (!(b.nCapT > b.t)) { b.nCap = Math.random() * 6.2832; b.nCapT = b.t + 2 + Math.random() * 5; b.nPause = Math.random() < .3 ? b.t + 1 + Math.random() * 2 : 0; }
  const vd = fuit ? sp.spd * 1.5 : b.nPause > b.t ? 0 : sp.spd * .45;
  b.v = (b.v || 0) + (vd - (b.v || 0)) * Math.min(1, dt * 3);
  let dd = (b.nCap ?? b.dir) - b.dir; while (dd > Math.PI) dd -= 6.2832; while (dd < -Math.PI) dd += 6.2832;
  b.dir += Math.max(-3 * dt, Math.min(3 * dt, dd));
  const nx = b.x + Math.cos(b.dir) * b.v * dt, ny = b.y + Math.sin(b.dir) * b.v * dt;
  if (surfaceEau(nx, ny) != null) { b.x = nx; b.y = ny; }
  else { b.nCap = b.dir + Math.PI * (.6 + Math.random() * .8); b.nCapT = b.t + 1.5; b.v *= .5; }   // le bord de l'eau : elle tourne
  const so = surfaceEau(b.x, b.y) ?? s, fond = (typeof hAt === 'function' ? hAt(b.x | 0, b.y | 0) : so - 1) + .05;   // (§243) un peu sous la surface : l'eau, translucide, la laisse voir
  b.z += ((Math.max(fond, so - .1 - .3 * (sp.sz || 1)) + Math.sin(b.bob) * .03) - b.z) * Math.min(1, dt * 4);
  b.dirT = b.dir; b.vit = b.v; b.vx = b.vy = 0; b.etat = fuit ? 'fuir' : 'errer'; b.tang = 0; b.enVol = false;
  return true;
}
function orvanePoser(b, etat) {
  b.enVol = false; b.z = sol(b.x, b.y); b.vz = 0; b.v = 0; b.vit = 0; b.bat = 0; b.roll = 0; b.tang = 0; b.etat = etat; b.alarm = Math.min(b.alarm || 0, .4);
  return false;
}
// le tirage de l'île (bestiaireGraine) : au moins un chasseur dès la troisième exploration, deux dès la huitième
function orvaneTirage(e, graine, niv, okR) {
  if (S.profil?.exposition?.bestiaire !== 'orvane' || niv < NIV_CHASSEURS || typeof SPEC === 'undefined' || typeof POIDS_ESPECE === 'undefined') return;
  const estChasseur = id => { const sp = typeof specById !== 'undefined' ? specById[id] : null; return !!(sp && sp.orvane && sp.diet === 'c'); };
  const reste = SPEC.filter(sp => sp.orvane?.gabarit && !sp.orvane.nage && sp.diet === 'c' && sp.cap > 0 && (POIDS_ESPECE[sp.id] || 0) > 0 && !e.has(sp.id) && (!okR || okR(sp.id)));
  let n = [...e].filter(estChasseur).length, g = (graine ^ 0x7a11e) >>> 0;
  const tir = () => { g = (Math.imul(g, 1664525) + 1013904223) >>> 0; return g / 4294967296; };
  // (§232) au plus un tiers des espèces tirées chassent : au loin, la puissance faisait tirer surtout des chasseurs, qui n'avaient
  // plus de quoi manger. Les moins pesants s'en vont, et des brouteurs ou des glaneurs, tirés selon leur poids, prennent leur place
  { const C = [...e].filter(estChasseur), max = Math.max(1, Math.floor(e.size / 3));
    if (C.length > max) {
      const trop = C.sort((a, b) => (POIDS_ESPECE[a] || 0) - (POIDS_ESPECE[b] || 0)).slice(0, C.length - max);
      for (const id of trop) e.delete(id);
      const H = SPEC.filter(sp => sp.orvane?.gabarit && !sp.orvane.machine && !sp.orvane.nage && sp.diet !== 'c' && sp.cap > 0 && (POIDS_ESPECE[sp.id] || 0) > 0 && !e.has(sp.id) && (!okR || okR(sp.id)));
      for (let i = 0; i < trop.length && H.length; i++) {
        let r = tir() * H.reduce((a, sp) => a + POIDS_ESPECE[sp.id], 0), k = 0;
        for (; k < H.length - 1; k++) if ((r -= POIDS_ESPECE[H[k].id]) <= 0) break;
        e.add(H[k].id); H.splice(k, 1); }
      n = max; } }
  while (n < (niv >= NIV_MEUTES ? 2 : 1) && reste.length) {
    let r = tir() * reste.reduce((a, sp) => a + POIDS_ESPECE[sp.id], 0), k = 0;
    for (; k < reste.length - 1; k++) if ((r -= POIDS_ESPECE[reste[k].id]) <= 0) break;
    e.add(reste[k].id); reste.splice(k, 1); n++;
  }
  // (§223) les machines d'Orvane : là où elles ont leur part, une au moins (deux dès NIV_MEUTES), tirée selon son poids
  if (niv >= NIV_MACHINES) { const M = SPEC.filter(sp => sp.orvane?.machine && sp.cap > 0 && (POIDS_ESPECE[sp.id] || 0) > 0 && !e.has(sp.id));
    for (let m = [...e].filter(id => specById?.[id]?.orvane?.machine).length; m < (niv >= NIV_MEUTES ? 2 : 1) && M.length; m++) {
      let r = tir() * M.reduce((x, sp) => x + POIDS_ESPECE[sp.id], 0), k = 0;
      for (; k < M.length - 1; k++) if ((r -= POIDS_ESPECE[M[k].id]) <= 0) break;
      e.add(M[k].id); M.splice(k, 1); } }
  // un trophée : dès la quatrième exploration, une île sur cinq en porte un, jusqu'à une sur deux à la vingtième
  const T = SPEC.filter(sp => sp.orvane?.gabarit && !sp.orvane.nage && sp.rarete >= 3 && sp.cap > 0 && !e.has(sp.id) && (!okR || okR(sp.id)));
  if (T.length && niv >= 4 && ![...e].some(id => specById?.[id]?.rarete >= 3) && tir() < Math.min(.5, .2 + .02 * (niv - 4))) {
    const plus = T.sort((a, b) => b.rarete - a.rarete), top = plus.filter(sp => sp.rarete === plus[0].rarete);   // le plus rare que l'île permette
    e.add(top[Math.floor(tir() * top.length)].id);
  }
}
// à l'arrivée : l'espèce phare de l'île, la plus rare des lignées tirées, sinon la plus grande
function orvaneArrivee(e) {
  if (S.profil?.exposition?.bestiaire !== 'orvane' || typeof specById === 'undefined') return;
  repartirIle(e);                                                      // (§225) la part de chaque espèce tirée
  if (typeof say !== 'function') return;
  // (§221) un monde versé dans celui d'Orvane (une fusion, Orvane docs/14) : annoncé une fois, à l'arrivée sur une île
  const F = ((S.courant || S.abrege?.courant)?.monde?.fusions || []).filter(f => f && !(S.fusionsVues || []).includes(f.id));
  if (F.length) { S.fusionsVues = [...(S.fusionsVues || []), ...F.map(f => f.id)]; ecrire();
    setTimeout(() => { try { for (const f of F) say((f.nom || f.monde) + ' a rejoint le monde d\'Orvane · ' + f.lignees + ' lignées nouvelles, au bord des eaux', 5); } catch (er) { } }, 7000); }
  // (§223) la Mère éveillée (Orvane docs/16) : annoncée une fois
  const mere = (S.courant || S.abrege?.courant)?.monde?.mere;
  if (mere && !S.mereVue) { S.mereVue = mere.depuis ?? 1; ecrire();
    setTimeout(() => { try { say(mere.nom + ' s\'est éveillée au ' + (mere.biome === 'volcan' ? 'volcan' : mere.biome) + ' · des machines peuplent le monde d\'Orvane', 5); } catch (er) { } }, 9500); }
  const L = [...e].map(id => specById[id]).filter(sp => sp && sp.orvane); if (!L.length) return;
  const m = sp => S.lignees[sp.id]?.masse || 0, ph = L.sort((a, b) => (b.rarete || 0) - (a.rarete || 0) || m(b) - m(a))[0];
  setTimeout(() => { try { say('sur cette île : ' + ph.n.toLowerCase() + (ph.rarete ? ' · ' + nomRang(ph.rarete) : ''), 4); } catch (er) { } }, 2500);
}
// le carnet des lignées : chaque lignée croisée s'y inscrit, une fois pour toutes (la sauvegarde du jeu le garde)
function decouvrir(sp) {
  const id = sp.orvane?.taxon || sp.id, d = S.decouvertes[id]; if (d) { d.n++; return; }
  S.decouvertes[id] = { n: 1, t: Date.now(), nom: sp.n, r: sp.rarete || 0 };
  const N = ligneesDuJeu(S.courant).length, k = Object.keys(S.decouvertes).length;
  try { if (typeof say === 'function') say('nouvelle lignée · ' + sp.n.toLowerCase() + (sp.rarete ? ' · ' + nomRang(sp.rarete) : '') + ' · notée au carnet (' + k + (N ? '/' + N : '') + ')', 4); } catch (e) { }
}
// un trophée abattu : des éclats en plus, autant que sa rareté le dit (1 rare, 2 exotique, 3 légendaire)
function orvaneTrophee(b) {
  const r = b?.sp?.rarete || 0; if (r < 3 || typeof P === 'undefined' || !P.sac) return 0;
  const n = r - 2; P.sac.eclat = (P.sac.eclat || 0) + n;
  const d = S.decouvertes[b.sp.orvane?.taxon || b.sp.id]; if (d) d.trophee = (d.trophee || 0) + 1;
  return n;
}
function orvanePhoto() { const D = Object.entries(S.decouvertes).sort((a, b) => (b[1].t || 0) - (a[1].t || 0)).slice(0, 300); return D.length ? { decouvertes: Object.fromEntries(D) } : undefined; }
function orvaneRelire(d) { S.decouvertes = d && typeof d.decouvertes === 'object' && d.decouvertes ? { ...d.decouvertes } : {}; }
function orvaneCarnetLignees() {
  if (S.profil?.exposition?.bestiaire !== 'orvane') return '';
  const esc = v => { try { return ESC(v); } catch (e) { return String(v); } }, cl = r => { try { return clRar(r); } catch (e) { return ''; } };
  const L = Object.entries(S.decouvertes), N = ligneesDuJeu(S.courant).length;
  let h = `<h3>Lignées d'Orvane <span class="compte">${L.length}${N ? ' / ' + N : ''} découverte${L.length > 1 ? 's' : ''}</span></h3>`;
  if (!L.length) return h + `<p class="note" style="margin:2px 2px 8px">Chaque lignée du monde d'Orvane croisée s'inscrit ici. Les plus rares ne vivent que loin.</p>`;
  for (const [, d] of L.sort((a, b) => (b[1].r || 0) - (a[1].r || 0) || (b[1].t || 0) - (a[1].t || 0)).slice(0, 60))
    h += `<div class="obj"><div style="flex:1;min-width:0"><div class="n ${cl(d.r || 1)}">${esc(d.nom)}</div>`
      + `<div class="d">${d.r ? esc(nomRang(d.r)) + ' · ' : ''}croisée ${d.n} fois${d.trophee ? ' · ' + d.trophee + ' trophée' + (d.trophee > 1 ? 's' : '') : ''}</div></div></div>`;
  return h;
}

// le bestiaire d'Orvane sur une île : les parts de la faune du jeu qui s'efface, et leur partage entre les lignées
function bestiaireOrvane(ile) {
  const sols = new Set(solsIle());
  // (§225) un chasseur né (carnivore, ou de la viande pour moitié) prend la part des carnivores, même s'il digère aussi les plantes
  const groupe = t => t.plan?.regime === 'carnivore' || (t.plan?.diete?.viande || 0) >= .5 ? 'carnivore' : Corr.GROUPE[regime(t)] || 'omnivore';
  const parts = {}, ref = {}, maintenant = {};
  for (const t of S.gen0.taxons) if (!Corr.FAUNE[t.id]) ref[groupe(t)] = (ref[groupe(t)] || 0) + presenceSur(S.gen0, t.id, ile);
  for (const sp of SPEC) if (sp.orvane?.gabarit) { const t = taxon(S.courant, sp.orvane.taxon); if (!t || t.eteint) continue;
    const e = presenceSur(S.courant, t.id, ile); if (e > 0) { parts[sp.id] = { g: groupe(t), e }; maintenant[groupe(t)] = (maintenant[groupe(t)] || 0) + e; } }
  // (§225) ce que porte l'île, régime par régime : la table du jeu (Corr.BUDGET_ILE, et ce qu'y ajoutent ses sols rares)
  const budgetDe = () => { const B = {}, add = (g, v) => { const x = B[g] ??= { cap: 0, poids: 0 }; x.cap += v.cap || 0; x.poids += v.poids || 0; };
    for (const [g, v] of Object.entries(Corr.BUDGET_ILE || {})) add(g, v);
    for (const k of sols) for (const [g, v] of Object.entries(Corr.BUDGET_SOL?.[k] || {})) add(g, v);
    return B; };
  const partDe = (sp, B) => {
    const p = parts[sp.id], b = p && B[p.g]; if (!p || !b || !(b.cap > 0)) return null;
    const k = Math.min(2, ref[p.g] > 0 ? maintenant[p.g] / ref[p.g] : 1) * p.e / maintenant[p.g], c = b.cap * k;
    return c >= .3 ? { cap: Math.max(1, Math.round(c)), poids: +(b.poids * k).toFixed(4) } : null;   // trop rare pour se montrer sur l'île
  };
  // (§223) les machines d'Orvane ont leur part à elles, d'après leur nombre sur ces sols, à partir de NIV_MACHINES : deux pour
  // cent machines, trois pour mille, cinq pour dix mille, six au plus
  const nMachines = S.courant.taxons.filter(t => !t.eteint && t.plan?.regime === 'synthetique').reduce((a, t) => a + effectifSur(S.courant, t.id, ile), 0);
  const capM = prof() >= NIV_MACHINES && nMachines >= 30 ? Math.min(6, Math.max(1, Math.round(1.6 * Math.log10(nMachines / 10)))) : 0;
  const avecMachines = B => { if (capM) B.synthetique = { cap: capM, poids: +(.12 * capM).toFixed(3) }; return B; };
  // (§225) la faune faite main s'est retirée de la nature, toute : plus de repli sur les Doux du jeu quand aucune lignée paisible
  // ne peut se montrer (les premières îles n'ont alors que ce que le monde y met)
  const budget = avecMachines(budgetDe());
  return { retire: sp => !sp.orvane && !!Corr.FAUNE[sp.id], part: sp => partDe(sp, budget), repartition: { parts, ref, maintenant, budget } };
}
// (§225) LA PART DE CHAQUE ESPÈCE TIRÉE. Le budget d'un régime (Corr.BUDGET_ILE : ce que la faune faite main avait, toutes espèces
// confondues) se partageait entre toutes les lignées présentes sur les sols de l'île ; or l'île n'en tire que deux à huit, et les
// tirées n'en gardaient qu'une miette (une bête chacune sur les premières îles). Le tirage fait, chaque espèce tirée reçoit la part
// d'une espèce moyenne de son régime (et ce qu'y ajoutent les sols rares), selon sa présence (en racine : la plus nombreuse a plus,
// la plus rare reste visible) et l'effectif du régime dans le monde depuis la génération 0 (jusqu'au double).
function repartirIle(e) {
  const R = S.repartition; if (!R || !e || typeof specById === 'undefined') return;
  const par = {};
  for (const id of e) { const sp = specById[id], p = R.parts[id]; if (!sp?.orvane?.gabarit || sp.orvane.machine || !p) continue; (par[p.g] ??= []).push([sp, p]); }
  for (const [g, L] of Object.entries(par)) {
    const B = R.budget[g], base = Corr.BUDGET_ILE?.[g]; if (!B || !base) continue;
    const tendance = Math.min(2, R.ref[g] > 0 ? R.maintenant[g] / R.ref[g] : 1);
    const total = (base.cap / (base.n || 1) * L.length + Math.max(0, B.cap - base.cap)) * tendance;
    const w = L.map(([, p]) => Math.sqrt(p.e)), W = w.reduce((a, x) => a + x, 0) || 1;
    L.forEach(([sp], i) => { sp.cap = Math.max(g === 'carnivore' ? 1 : 2, Math.round(total * w[i] / W)); if (sp.diet === 'c') chasseurLoin(sp); });
  }
}

// === Orvane → jeu : la naissance d'une bête ===
// Mode relatif (profil) : deux tirages indépendants. L'ALLURE (robe, taille) aux taux du jeu × l'écart du monde depuis la
// génération 0 — le jour un, exactement comme avant. Les CONDUITES (traits non rendus) à leur fréquence réelle : un
// crapaud sur 170 a des yeux de nuit si c'est ce que porte le monde. Le phénotype tiré attend orvaneNaissance(b).
const tirer = (D, u) => { for (const [k, p] of D) { if (u < p) return k; u -= p; } return D.length ? D[D.length - 1][0] : ''; };
function orvaneVariante(sp, r = Math.random) {
  S.dernier = null;
  if (!S.courant || !Tampon || !S.profil) return undefined;
  const tid = taxonDe(sp), t = tid && taxon(S.courant, tid); if (!t) return undefined;
  const cat = S.courant.catalogue?.traits || {}, ref = Tampon.referenceDe(tid, S.courant, S.gen0), X = S.profil.exposition || {};
  const boost = typeof chanceVariante === 'function' ? chanceVariante() : 1;   // le jeu rend les variantes plus fréquentes loin de chez soi : on garde cette règle
  const fam = typeof familleBete === 'function' ? familleBete(sp) : '';
  let orn = null; try { orn = typeof ORNEMENTS_DE !== 'undefined' ? ORNEMENTS_DE[fam] : null; } catch (e) { }
  // le cycle d'avant (joint à l'instantané) : on glisse de l'un à l'autre sur propagation_cycles
  const pr = S.courant.precedent?.taxons?.find(x => x.id === tid), k = avancement();
  const tPrec = pr && k < 1 ? { id: tid, phenotypes: pr.phenotypes.map(p => ({ ...p, traits: p.id === 'base' ? [] : p.id.split('+') })) } : null;
  if (X.mode === 'relatif' && X.non_rendus !== 'base' && Tampon.partsRelatif) {
    const A = Tampon.partsRelatif(t, S.profil, ref), B = tPrec ? Tampon.partsRelatif(tPrec, S.profil, ref) : null;
    const meler = (a, b) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b || {})])) o[key] = b ? mele(b[key] || 0, a[key] || 0, k) : a[key] || 0; return o; };
    const G = meler(A.G, B && B.G), M = meler(A.M, B && B.M);
    // l'allure : chaque signature rendue × chanceVariante ; le reste, pas de variante
    const sig = []; let reste = 1; for (const [s, p] of Object.entries(G)) if (s && p > 0) { const f = Math.min(1, p * boost); sig.push([s, f]); reste -= f; }
    if (reste < 0) { for (const q of sig) q[1] /= 1 - reste; reste = 0; }
    const u = r(), s = u < reste ? '' : tirer(sig, u - reste);
    const a = tirer(Object.entries(M).filter(([, p]) => p > 0), r() * Object.values(M).reduce((x, p) => x + Math.max(0, p), 0));
    const ph = A.phen[s + '|' + a] || (a && A.phen['|' + a]) || A.phen[s + '|'] || t.phenotypes[0].id;
    S.dernier = { sp, ph, traits: a ? a.split('+') : [], taxon: tid, Gs: sig, M, carte: A.phen, fam, orn };   // (l'hérédité en a besoin si la bête a une mère)
    return s ? Corr.varianteDe(s.split('+'), fam, r, orn) : null;
  }
  // mode compression (ou non rendus fondus) : un seul tirage, sur les fréquences exposées
  const e = Tampon.exposer(t, S.profil, cat, null, ref), ep = tPrec ? Tampon.exposer(tPrec, S.profil, cat, null, ref) : null;
  const base = t.phenotypes[0].id, P = new Map(t.phenotypes.map(p => [p.id, p])), freqs = []; let reste = 1;
  for (const [id, v] of Object.entries(e)) { if (id === base) continue;
    let f = ep && ep[id] != null ? mele(ep[id], v, k) : v; f = Math.min(1, f * boost);
    const traits = id.startsWith('~') ? id.slice(1).split('+') : P.get(id)?.traits || [];
    if (f > 0 && traits.length) { freqs.push([traits, f]); reste -= f; } }
  if (reste < 0) { for (const q of freqs) q[1] /= 1 - reste; reste = 0; }
  let u = r(); if (u < reste) return null;
  u -= reste;
  for (const [traits, f] of freqs) { if (u < f) return Corr.varianteDe(traits, fam, r, orn); u -= f; }
  return null;
}
// La bête née : son phénotype Orvane exact (pour le rapporter tel quel) et ses conduites (conduites.js les joue).
// Une lignée ajoute celles de ses modes de déplacement (un fouisseur s'enterre).
function orvaneNaissance(b, mere) {
  if (!b || !b.sp) return;
  const D = S.dernier; S.dernier = null;
  const cat = S.courant?.catalogue?.traits || {}, loco = b.sp.orvane?.locomotion;
  if (D && D.sp === b.sp) { b.phen = D.ph; b.traits = D.traits; }   // (b.phen : b.ph est la phase de la foulée, dans le jeu)
  const deMere = D && D.sp === b.sp && D.Gs && mere && mere.sp === b.sp && mere.phen && !mere.dead;
  if (deMere) heriter(b, mere, D, cat);
  if (D && D.sp === b.sp) hybrider(b, cat);
  const c = Corr.conduitesDe(b.traits || [], cat, loco, organesDe(b.sp), S.courant?.catalogue?.organes); if (c.length) b.conduites = c; else delete b.conduites;
  tirerQuant(b, deMere ? mere : null);
  apprisFuite(b);
}
// === la méfiance et l'habituation (§216, docs/12) : ce que la population a appris des joueurs, là où naît la bête ===
// Une population méfiante fuit de plus loin (× fuite à méfiance 1, 2,2 par défaut), une population habituée laisse
// approcher (× habitude à habituation 1, 0,5) ; cela s'ajoute à l'audace de la bête (b.fq). Le profil peut l'éteindre
// (exposition.mefiance.rendue = false) ou régler les deux facteurs.
function apprisDe(sp, bid) {
  const tid = taxonDe(sp); if (!tid || !S.courant) return null;
  const k = tid + '|' + (bid || ''); S.mefIle ??= {}; if (k in S.mefIle) return S.mefIle[k];
  const t = taxon(S.courant, tid), ici = t?.populations.find(p => p.biome === bid), ile = biomesIle();
  let m = 0, h = 0, W = 0;
  for (const p of ici ? [ici] : (t?.populations || []).filter(p => ile.has(p.biome))) { W += p.effectif; m += p.effectif * (p.mefiance || 0); h += p.effectif * (p.habituation || 0); }
  return S.mefIle[k] = W > 0 && (m > 0 || h > 0) ? { m: m / W, h: h / W } : null;
}
function apprisFuite(b) {
  const X = S.profil?.exposition?.mefiance || {}; delete b.mef; if (X.rendue === false || b.tame) return;
  const A = apprisDe(b.sp, biomeDe(b)); if (!A) return;
  const f = Math.pow(X.fuite ?? 2.2, A.m) * Math.pow(X.habitude ?? .5, A.h);
  b.fq = Math.round(clamp((b.fq || 1) * f, .3, 3) * 1000) / 1000; b.mef = { m: r2(A.m), h: r2(A.h) };
}
// === les zones hybrides (§214, docs/10) : sur une île où la population se croise avec une lignée apparentée, une part des
// bêtes a un père de l'autre lignée — elle le dit, et tient de lui la moitié de ses traits non rendus (ses conduites) ===
function zoneHybride(sp) {
  const tid = taxonDe(sp); if (!tid || !S.courant) return null;
  S.hybIle ??= {}; if (tid in S.hybIle) return S.hybIle[tid];
  const t = taxon(S.courant, tid), ile = biomesIle(), parts = {}; let W = 0;
  for (const p of t?.populations || []) if (ile.has(p.biome)) { W += p.effectif; if (p.hybride) parts[p.hybride.avec] = (parts[p.hybride.avec] || 0) + p.effectif * p.hybride.part; }
  const best = Object.entries(parts).sort((a, b) => b[1] - a[1])[0];
  return S.hybIle[tid] = best && W > 0 ? { avec: best[0], part: best[1] / W } : null;
}
function hybrider(b, cat) {
  const Z = zoneHybride(b.sp); if (!Z || !(Math.random() < Z.part)) return;
  b.hybride = Z.avec;
  const tB = taxon(S.courant, Z.avec); if (!tB || !Tampon.partsRelatif || !S.profil) return;
  const M = Tampon.partsRelatif(tB, S.profil, Tampon.referenceDe(Z.avec, S.courant, S.gen0)).M, tot = Object.values(M).reduce((a, x) => a + Math.max(0, x), 0);
  const a = tot > 0 ? tirer(Object.entries(M).filter(([, p]) => p > 0), Math.random() * tot) : '';
  const porte = new Set(b.traits || []); for (const id of a ? a.split('+') : []) if (Math.random() < .5) porte.add(id);
  b.traits = Tampon.exprimer([...porte], cat);
}
const nomTaxon = id => { try { if (typeof specById !== 'undefined' && specById[id]?.n) return specById[id].n; } catch (e) { } return taxon(S.courant, id)?.nom || id; };
// === l'hérédité (§213, docs/9) : un petit né d'une mère connue lui ressemble ===
// Chaque trait se tire sachant ce que montre la mère, le père pris au hasard dans la population (Hardy-Weinberg ; la
// dominance est au catalogue). Une mère dorée (récessif) n'a de petits dorés que si le père porte l'allèle ; une mère
// géante (dominant) en a la moitié. Sur toutes les mères, la part des petits qui montrent un trait reste celle d'avant :
// les taux du jeu ne bougent pas, seules les portées se ressemblent.
function heriter(b, mere, D, cat) {
  const X = S.profil?.exposition || {}, T = X.taux_jeu || {}, R = X.traits_rendus || Object.keys(T), dom = id => cat[id]?.heredite !== 'recessif';
  const eR = {}; for (const [sg, f] of D.Gs) for (const id of sg.split('+')) eR[id] = (eR[id] || 0) + f;          // l'allure : la part qui montre chaque trait rendu, dans le jeu
  const mR = new Set(Corr.traitsDe(mere.variante || null)), pR = [];
  for (const id of R) { const e = eR[id] || 0; if (T[id] != null && e > 0 && Math.random() < Tampon.sachantMere(e, dom(id), mR.has(id))) pR.push(id); }
  const Mt = Object.values(D.M).reduce((a, x) => a + Math.max(0, x), 0) || 1, eM = {};                              // ce qui agit : à sa fréquence réelle
  for (const [a, p] of Object.entries(D.M)) if (a && p > 0) for (const id of a.split('+')) eM[id] = (eM[id] || 0) + p / Mt;
  const mM = new Set(mere.traits || []), pM = [];
  for (const [id, e] of Object.entries(eM)) if (Math.random() < Tampon.sachantMere(e, dom(id), mM.has(id))) pM.push(id);
  const s = Tampon.exprimer(pR, cat).join('+'), a = Tampon.exprimer(pM, cat).join('+');
  b.phen = D.carte[s + '|' + a] || (a && D.carte['|' + a]) || D.carte[s + '|'] || D.ph;
  b.traits = a ? a.split('+') : [];
  let v = s ? Corr.varianteDe(s.split('+'), D.fam, Math.random, D.orn) : null;
  const mo = /(geant|nain)-([a-z]+)/.exec(mere.variante || ''), vo = v && /(geant|nain)-([a-z]+)/.exec(v);
  if (mo && vo && mo[1] === vo[1]) v = v.replace(vo[0], mo[0]);                                                     // la même forme que sa mère : les mêmes cornes
  b.variante = v;
}
// === les traits continus (§212, docs/8) : la loi de la population de l'île, une valeur par bête ===
// La bête tire z dans N(m, v) et le garde (b.q) pour être rapportée telle quelle. Elle montre l'écart de sa population
// depuis la génération 0 (d), plus « variation » (profil) de son écart propre : à 0, toutes les bêtes d'une île ont
// l'allure de leur population et le jour un ne change rien ; à 1, toute la variation naturelle se voit.
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
function loiQ(sp) {
  const tid = taxonDe(sp); if (!tid || !S.courant || !Tampon?.quantDe) return null;
  if (!(tid in S.qIle)) { const t = taxon(S.courant, tid); S.qIle[tid] = t && !t.eteint ? Tampon.quantDe(t, biomesIle(), Tampon.referenceDe(tid, S.courant, S.gen0)) : null; }
  return S.qIle[tid];
}
function tirerQuant(b, mere) {
  const L = loiQ(b.sp), X = S.profil?.exposition?.quantitatifs; if (!L || !X) return;
  const vari = clamp(+X.variation || 0, 0, 1), catQ = S.courant?.catalogue?.quantitatifs || {}, q = {}, s = {};
  for (const k of X.rendus || []) { const x = L[k], J = Corr.QUANT_JEU?.[k]; if (!x || !J) continue;
    const zm = mere?.q?.[k], h2 = clamp((x.g ?? .4 * x.v) / x.v, 0, 1);                                // une mère connue : le petit tient d'elle (pente h²/2)
    const z = Number.isFinite(zm) ? x.m + h2 / 2 * (zm - x.m) + Math.sqrt(x.v * (1 - h2 * h2 / 4)) * gauss() : x.m + Math.sqrt(x.v) * gauss(), montre = clamp(x.d + vari * (z - x.m), -3.5, 3.5), f = J.vaut(montre, catQ[k]);
    q[k] = r2(z); s[k] = r2(montre); if (Math.abs(f - 1) >= .005) b[J.cle] = Math.round(f * 1000) / 1000; else delete b[J.cle]; }
  if (Object.keys(q).length) { b.q = q; b.qs = s; }
}
// ce que le panneau de la bête désignée en dit : une bête hors du commun parmi les siennes (une compagne : pour son
// espèce) ; une population de l'île qui a changé depuis la génération 0
function quantMots(b) {
  const L = b && b.hybride ? ['hybride, père ' + nomTaxon(b.hybride).toLowerCase()] : [], s = b && b.qs;
  if (b && b.mef && !b.tame) { if (b.mef.m >= .3) L.push(b.mef.m >= .6 ? 'fuit les chasseurs : on la chasse ici' : 'se méfie des chasseurs'); else if (b.mef.h >= .3) L.push('habituée aux passants'); }   // (§216)
  if (!s) return L;
  const Q = loiQ(b.sp);
  for (const [k, v] of Object.entries(s)) { const J = Corr.QUANT_JEU?.[k], ref = b.tame ? 0 : Q?.[k]?.d ?? 0; if (J && Math.abs(v - ref) >= 1.3) L.push(v > ref ? J.haut : J.bas); }
  if (Q && !b.tame) for (const k of S.profil?.exposition?.quantitatifs?.rendus || []) { const J = Corr.QUANT_JEU?.[k], d = Q[k]?.d; if (J && Math.abs(d) >= .6 && L.length < 3) L.push(J.ici[d > 0 ? 0 : 1]); }
  return L.slice(0, 3);
}
// les conduites d'un phénotype connu (une compagne qu'on recharge)
function conduitesPour(sp, traits) { return Corr.conduitesDe(traits || [], S.courant?.catalogue?.traits || {}, sp?.orvane?.locomotion, organesDe(sp), S.courant?.catalogue?.organes); }
// les organes d'une lignée (une espèce du jeu garde ses conduites à elle : seules les lignées nées dans Orvane en tirent des siens)
const organesDe = sp => sp?.orvane?.corps && Corps?.normaliser ? Corps.normaliser(sp.orvane.corps).organes : [];

// === jeu → Orvane : les pressions ===
function phenotypeDe(t, variante) {
  const tr = Corr.traitsDe(variante).sort().join('+');
  return (t.phenotypes.find(p => p.traits.slice().sort().join('+') === tr) || t.phenotypes[0]).id;
}
function biomeDe(b) {
  let k = null; try { if (b && typeof bAt === 'function') k = bAt(b.x | 0, b.y | 0); } catch (e) { }
  if (!Corr.biomeOrvane(k)) try { k = typeof biomeIci !== 'undefined' ? biomeIci : null; } catch (e) { }
  return Corr.biomeOrvane(k);
}
function noter(action, b, variante, extra) {
  if (!S.courant || !b?.sp) return false;
  const tid = taxonDe(b.sp); if (!tid) return false;
  const t = taxon(S.courant, tid); if (!t) return false;
  const biome = biomeDe(b) || t.populations[0]?.biome; if (!biome) return false;
  const ph = action === 'rencontre' ? '' : typeof b.phen === 'string' && t.phenotypes.some(p => p.id === b.phen) ? b.phen : phenotypeDe(t, variante);   // le phénotype tiré à la naissance, sinon d'après la robe
  const cle = [tid, ph, biome, action, extra?.vers || '', parcelleIle(biome) || ''].join('|');   // (§222) et la parcelle de l'île
  S.lot[cle] = (S.lot[cle] || 0) + 1; if (!S.depuis) S.depuis = new Date().toISOString();
  if (action !== 'rencontre' && b.q) { const A = S.lotQ[cle] ??= { n: 0, s: {} }; A.n++;   // la valeur exacte de la bête (§212)
    for (const [k, z] of Object.entries(b.q)) if (Number.isFinite(z)) A.s[k] = r2((A.s[k] || 0) + z); }
  return true;
}
function orvaneEvenement(action, b, cause) {
  if (!b || !b.sp) return;
  if (action === 'prelevement' && cause && !CAUSES_JOUEUR.has(cause)) return;   // morte de faim, ou sous un prédateur de l'île : ce n'est pas le joueur
  if (noter(action, b, b.variante)) ecrire();
}
function releverRencontres() {
  if (typeof beasts === 'undefined' || typeof P === 'undefined' || !S.courant) return;
  let n = 0;
  for (const b of beasts) { if (b.tame || b.dead || S.vus.has(b)) continue; if (Math.hypot(b.x - P.x, b.y - P.y) > RAYON_RENCONTRE) continue; S.vus.add(b); if (noter('rencontre', b, null)) n++; if (b.sp.orvane?.gabarit) decouvrir(b.sp); }
  if (n) ecrire();
}
function orvaneLot(cles) {
  const ev = []; for (const cle of cles || Object.keys(S.lot)) { const n = S.lot[cle]; if (!n) continue; const [taxon, phenotype, biome, action, vers, parcelle] = cle.split('|'); const e = { taxon, biome, action, n }; if (parcelle) e.parcelle = parcelle; if (phenotype) e.phenotype = phenotype; if (vers) e.vers = vers;
    const A = S.lotQ[cle]; if (A && A.n > 0) { e.q = {}; for (const [k, s] of Object.entries(A.s)) e.q[k] = r2(s / A.n); }
    ev.push(e); }
  if (!ev.length) return null;
  let zone; try { zone = typeof SEED !== 'undefined' ? 'ile:' + SEED : undefined; } catch (e) { }
  return { orvane: S.courant?.orvane || '0.1', monde: S.courant?.monde?.id || 'orvane', instantane: S.courant?.cycle?.n ?? 0,
    source: { jeu: JEU, compte: S.compte || 'anonyme', zone }, periode: { debut: S.depuis || new Date().toISOString(), fin: new Date().toISOString() }, evenements: ev };
}
// le dépôt dans le Supabase d'Orvane : sa clé publique (apikey) et celle du jeu (p_cle) ; le compte y est pseudonymisé
async function deposer(D, lot) {
  const r = await fetch(D.url.replace(/\/$/, '') + '/rest/v1/rpc/orvane_deposer', { method: 'POST', headers: { apikey: D.cle, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_cle: D.jeu, p_compte: S.compte || 'anonyme', p_lot: lot }) });
  if (!r.ok) throw new Error('Orvane ' + r.status); return r.json();
}
// une fois par demi-heure au plus ; on ne retire du lot que ce qui est parti (le serveur peut refuser : trop de dépôts), et
// LOT_MAX événements à la fois (le serveur en prend 500) : le reste part la fois suivante
async function orvaneEnvoyer(rpc, compte, forcer) {
  if (compte) S.compte = 'h:' + hachage(String(compte));
  const D = racine.ORVANE_DEPOT, direct = !!(D && D.url && D.cle && D.jeu);
  const cles = Object.keys(S.lot).slice(0, LOT_MAX), lot = orvaneLot(cles); if (!lot || (!direct && typeof rpc !== 'function') || S.envoi) return false;
  if (!forcer && Date.now() - S.dernierEnvoi < ENVOI_MIN) return false;
  const parti = Object.fromEntries(cles.map(k => [k, S.lot[k]])), partiQ = JSON.parse(JSON.stringify(Object.fromEntries(cles.filter(k => S.lotQ[k]).map(k => [k, S.lotQ[k]])))); S.envoi = true;
  try {
    const r = direct ? await deposer(D, lot) : await rpc('vp_orvane_pression', { p_lot: lot });
    if (r && r.ok) {
      for (const [k, n] of Object.entries(parti)) { const reste = (S.lot[k] || 0) - n; if (reste > 0) S.lot[k] = reste; else delete S.lot[k]; }
      for (const [k, A] of Object.entries(partiQ)) { const C = S.lotQ[k]; if (!C) continue; C.n -= A.n;
        if (C.n <= 0 || !S.lot[k]) delete S.lotQ[k]; else for (const j in A.s) C.s[j] = r2((C.s[j] || 0) - A.s[j]); }
      if (!Object.keys(S.lot).length) S.depuis = null;
      S.dernierEnvoi = Date.now(); ecrire(); return true;
    }
    S.dernierEnvoi = Date.now(); ecrire(); return false;               // refusé (trop de dépôts aujourd'hui…) : le lot attend la demi-heure suivante
  } catch (e) { S.dernierEnvoi = Date.now() - ENVOI_MIN + REESSAI; return false; }   // le réseau, ou la fonction absente : on réessaie dans cinq minutes
  finally { S.envoi = false; }
}
const hachage = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };

// --- mise en place ---
racine.orvaneEspeces = orvaneEspeces; racine.orvaneAppliquer = orvaneAppliquer; racine.orvaneVariante = orvaneVariante; racine.orvaneEvenement = orvaneEvenement;
racine.orvaneTirage = orvaneTirage; racine.orvaneArrivee = orvaneArrivee; racine.orvaneTrophee = orvaneTrophee; racine.orvanePhoto = orvanePhoto;
racine.orvaneRelire = orvaneRelire; racine.orvaneCarnetLignees = orvaneCarnetLignees; racine.orvaneVol = orvaneVol; racine.orvaneNage = orvaneNage; racine.orvanePlaceEau = orvanePlaceEau;
racine.orvaneLot = orvaneLot; racine.orvaneMigrer = orvaneMigrer; racine.orvaneViande = id => { const m = /^v_(.+)$/.exec(id || ''); return m && ANCIENNES[m[1]]?.v || id; }; racine.orvaneAncienne = id => ANCIENNES[id] || null; racine.orvaneEnvoyer = orvaneEnvoyer; racine.orvaneNaissance = orvaneNaissance;
racine.OrvaneSV = { S, purger, parcelleIle, effectifIci, repeuplerIle, rangsRarete, ligneesDuJeu, garantirChasseur, conduitesPour, loiQ, tirerQuant, quantMots, apprisDe, apprisFuite, heriter, zoneHybride, hybrider, charger, avancement, effectifSur, biomesIle, releverRencontres, inscrireLignees, definir, enregistrer, especeDeSecours, ancetreJeu, nomJeu, CAUSES_JOUEUR, SEUIL_CORPS };
lire();
if (typeof window !== 'undefined' && typeof fetch === 'function') { charger(); setInterval(releverRencontres, PERIODE_RENCONTRE); }
})(globalThis);
