// ============================================================
//  Stone Valley — LE MONDE VIVANT (vivant.js)
//  Une simulation tourne ailleurs : des espèces y naissent d'une seule origine, s'adaptent au climat,
//  se séparent, s'éteignent. Elle publie un catalogue (catalogue-vivant.js, puis plus tard Supabase).
//  Ce module en fait des créatures du jeu.
//
//  LA SIMULATION PROPOSE, LE JEU DÉCIDE. Le catalogue ne porte que des faits : génome moyen,
//  population, climat. Tout ce qui touche à l'équilibre (bornes de taille et de vitesse, facilité à se
//  lier, rareté, biomes, proies) se décide ici, dans les bornes des Rampants : une espèce venue du
//  monde vivant est un Rampant de plus, qui porte sur son corps ce que son génome dit d'elle.
//
//  Branchement (index.html, cinq lignes) :
//    · ce fichier et catalogue-vivant.js chargés avant le script principal ;
//    · vivantBrancher(SPEC)   — en QUEUE de SPEC, juste avant specById ;
//    · vivantViandes(VIANDES) — juste avant la construction d'INGR ;
//    · vivantGraine(graine, niv) — dans bestiaireGraine, tiré à part (le reste du bestiaire ne bouge pas) ;
//    · osVivant(f)            — dans osDeBase, avant le gabarit commun des Rampants.
//
//  Les index : Stone Valley range certaines choses par position dans SPEC (le relevé des îles visitées).
//  Le catalogue ne perd donc jamais une espèce : une éteinte reste, avec une population nulle (plus
//  aucune île ne la porte, mais les compagnes déjà liées restent). Les nouvelles arrivent à la fin.
// ============================================================

const VIVANT_CLE = 'stone_valley:vivant';                // le dernier catalogue reçu, gardé pour la prochaine fois
const VIVANT_SOURCE = null;                               // plus tard : l'adresse du catalogue (Supabase). null : le fichier seul
const VIVANT_NIV = 3;                                     // comme les Rampants : dès la troisième exploration
// Pour essayer : ajouter #vivant à l'adresse met toutes les espèces vivantes sur l'île, à toute exploration.
// (Rien que pour soi : un autre joueur sur la même île ne les verrait pas.)
const VIVANT_ESSAI = typeof location !== 'undefined' && /(^|[#&])vivant($|&)/.test(location.hash || '');

function vivantValide(c) {
  return !!c && c.format === 1 && typeof c.version === 'string' && Array.isArray(c.especes)
    && c.especes.every(e => e && Number.isInteger(e.sim) && typeof e.nom === 'string' && e.genome && typeof e.genome === 'object');
}
// Le catalogue retenu : celui du fichier, ou le dernier reçu s'il est plus récent ET le prolonge
// (mêmes espèces, dans le même ordre, en tête) — sinon les index glisseraient.
const VIVANT_CAT = (() => {
  const fichier = typeof VIVANT_CATALOGUE !== 'undefined' && vivantValide(VIVANT_CATALOGUE) ? VIVANT_CATALOGUE : null;
  let garde = null;
  try { const t = localStorage.getItem(VIVANT_CLE); if (t) garde = JSON.parse(t); } catch (e) { garde = null; }
  if (!vivantValide(garde)) garde = null;
  const prolonge = (a, b) => !b || (a.especes.length >= b.especes.length && b.especes.every((e, k) => a.especes[k].sim === e.sim));
  if (garde && (!fichier || ((garde.ordre || 0) > (fichier.ordre || 0) && prolonge(garde, fichier)))) return garde;
  return fichier;
})();
const VIVANT_HASH = (() => { let h = 2166136261 >>> 0; const s = VIVANT_CAT ? VIVANT_CAT.version : ''; for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619) >>> 0; return h; })();

const vivantBorne = (v, a, b) => Math.max(a, Math.min(b, Number.isFinite(+v) ? +v : (a + b) / 2));
const vivantEntre = (a, b, t) => a + (b - a) * vivantBorne(t, 0, 1);
const vivant2 = v => Math.round(v * 100) / 100;
function vivantRGB(h, s, l) {                             // teinte 0-1, saturation et luminosité 0-1 → [r, g, b]
  h = ((h % 1) + 1) % 1;
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = ((t % 1) + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}
// Les teintes d'une même planète descendent d'une seule origine et se ressemblent : on écarte les
// lignées autour de leur teinte moyenne, pour que deux espèces se distinguent au premier regard.
const VIVANT_T0 = (() => { if (!VIVANT_CAT || !VIVANT_CAT.especes.length) return 0;
  let x = 0, y = 0; for (const e of VIVANT_CAT.especes) { const a = vivantBorne(e.genome.teinte, 0, 1) * 6.2832; x += Math.cos(a); y += Math.sin(a); }
  return ((Math.atan2(y, x) / 6.2832) + 1) % 1; })();
const vivantTeinte = h => { let d = h - VIVANT_T0; d -= Math.round(d); return VIVANT_T0 + d * 4; };
const vivantNom = s => String(s).replace(/[^A-Za-zÀ-ÿ' -]/g, '').slice(0, 20) || 'Inconnue';

// ---------- le traducteur : un génome devient un Rampant ----------
function vivantVersSpec(e, cat) {
  const G = {};
  for (const k of ['taille', 'vitesse', 'vue', 'regime', 'mefiance', 'fourrure', 'soin', 'teinte']) G[k] = vivantBorne(e.genome[k], 0, 1);
  const nom = vivantNom(e.nom), eteinte = e.statut !== 'vivante';
  const diet = G.regime < .3 ? 'h' : G.regime < .58 ? 'o' : 'c';
  const T = vivantBorne(e.climat && e.climat.temperature, 0, 1);
  // les sols : le froid aux espèces du nord, la lande aux espèces du sud ; la fourrure corrige
  let bio = T < .38 ? [2, 6, 7] : T > .66 ? [4, 1, 2] : [2, 3, 4];
  if (G.fourrure > .6 && !bio.includes(7)) bio.push(7);
  if (G.fourrure < .25 && !bio.includes(4)) bio.push(4);
  const sz = vivant2(vivantEntre(.62, 1.3, G.taille));
  const part = vivantBorne(e.part, 0, 1);
  const capBase = diet === 'h' ? 34 : diet === 'o' ? 24 : 12;
  const h = vivantTeinte(G.teinte), sat = .28 + .3 * G.regime, lum = .5 + .2 * G.fourrure;
  return {
    id: 'viv_' + e.sim, n: nom, vivant: Object.assign({ sim: e.sim, eteinte, apparue: e.apparue | 0, parent: e.parent ? vivantNom(e.parent) : null,
      portrait: String(e.portrait || '').slice(0, 80), region: String(e.region || '').slice(0, 30), planete: cat.planete }, G),
    diet, sz,
    spd: vivant2(vivantEntre(1.9, 3.3, G.vitesse)),
    vue: Math.round(vivantEntre(10, 26, G.vue)),
    peur: vivant2(diet === 'c' ? Math.min(.45, G.mefiance) : G.mefiance),
    herd: diet === 'c' ? (G.mefiance > .5 ? 1 : 0) : 1,
    cap: eteinte ? 0 : Math.round(capBase * vivantBorne(.6 + .8 * Math.sqrt(part), .6, 1.4)),
    mat: Math.round(vivantEntre(55, 130, G.taille)),
    shell: vivantRGB(h, sat, lum), dark: vivantRGB(h, sat * .9, lum * .62), leg: vivantRGB(h + .02, sat * .75, lum * .5), crin: vivantRGB(h, sat * .7, Math.min(.9, lum + .2)),
    oeil: diet === 'c' ? [255, 228, 150] : diet === 'o' ? [250, 220, 140] : [60, 52, 40],
    bio,
    lien: vivant2(vivantBorne(1 - .75 * G.mefiance - (diet === 'c' ? .3 : diet === 'o' ? .1 : 0), .15, 1)),
    travail: diet === 'h' ? { fibre: sz > 1.1 ? 1.2 : 1 } : diet === 'o' ? { baies: 1, fibre: .6 } : { os: 1 },
    metier: diet === 'h' ? 'coupe les herbes, les fleurs et les roseaux' : diet === 'o' ? 'cueille les baies, et un peu de fibre' : 'chasse quand elle a faim, et rapporte les os',
    grimpe: vivant2(vivantEntre(.85, .4, G.taille)),
    ...(sz > 1.1 && diet !== 'c' ? { riposte: .5 } : {})
  };
}
const VIVANT_SPEC = VIVANT_CAT ? VIVANT_CAT.especes.map(e => vivantVersSpec(e, VIVANT_CAT)) : [];

// ---------- dans SPEC, en queue ; le gibier se répartit ----------
function vivantBrancher(SPECS) {
  if (!VIVANT_SPEC.length) return;
  const proies = VIVANT_SPEC.filter(s => s.diet !== 'c');
  const taille = id => { const s = SPECS.find(x => x.id === id) || VIVANT_SPEC.find(x => x.id === id); return s ? s.sz : 1; };
  const traq = SPECS.find(s => s.id === 'traqueur');
  const gibier = traq && Array.isArray(traq.chasse) ? traq.chasse.filter(id => id !== 'villageois') : ['brouteur', 'glaneur'];
  // un chasseur du monde vivant chasse le gibier du traqueur et les brouteurs vivants, à sa taille
  for (const v of VIVANT_SPEC) if (v.diet === 'c')
    v.chasse = [...gibier.filter(id => taille(id) <= v.sz * 1.15), ...proies.filter(p => p.sz <= v.sz * 1.1).map(p => p.id)];
  // les chasseurs d'origine apprennent ce nouveau gibier (ni automates, ni gardiens, ni effrois)
  for (const s of SPECS) {
    if (!Array.isArray(s.chasse) || !s.chasse.length || s.fam === 'automate' || s.boss || s.horreur || s.volcan || s.pnj) continue;
    for (const p of proies) if (p.sz <= (s.sz || 1) * 1.15 && !s.chasse.includes(p.id)) s.chasse.push(p.id);
  }
  SPECS.push(...VIVANT_SPEC);
}
// ---------- leur viande ----------
function vivantViandes(VIANDES) {
  for (const v of VIVANT_SPEC) {
    const e = VIVANT_CAT.especes.find(x => 'viv_' + x.sim === v.id) || {};
    let r = (e.part || 0) < .15 ? 3 : (e.part || 0) < .4 ? 2 : 1;
    if (v.diet === 'c') r = Math.min(4, r + 1);
    if (v.vivant.eteinte) r = Math.max(r, 4);             // la viande d'une espèce disparue : il n'en reste plus guère
    const c = v.shell.map((x, k) => Math.round(x * .35 + [196, 110, 104][k] * .65));
    VIANDES.push([v.id, 'Viande de ' + v.n.toLowerCase(), v.n.toLowerCase(), r, null, c]);
  }
}
// ---------- sur quelles îles : tiré à part, de la graine et de la version du catalogue ----------
function vivantGraine(graine, niv) {
  const liste = VIVANT_SPEC.filter(s => s.cap > 0);
  if (VIVANT_ESSAI) return liste.map(s => s.id);
  if (!Number.isInteger(graine) || !(niv >= VIVANT_NIV) || !liste.length) return [];
  let s = (graine ^ 0x71ba7 ^ VIVANT_HASH) >>> 0;
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0; s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0; s = (s ^ (s >>> 16)) >>> 0 || 1;
  const tir = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const r = tir(), n = r < .35 ? 0 : r < .85 ? 1 : 2;     // deux îles sur trois en portent au moins une
  const poids = sp => { const e = VIVANT_CAT.especes.find(x => 'viv_' + x.sim === sp.id); return Math.sqrt(Math.max(.02, e ? e.part : .1)); };
  const pris = [];
  for (let k = 0; k < n && pris.length < liste.length; k++) {
    const restants = liste.filter(sp => !pris.includes(sp.id)), tot = restants.reduce((a, sp) => a + poids(sp), 0);
    let x = tir() * tot;
    for (const sp of restants) if ((x -= poids(sp)) <= 0) { pris.push(sp.id); break; }
  }
  return pris;
}

// ---------- le corps : le gabarit des Rampants, que le génome déforme ----------
// La vitesse allonge les pattes, la vue les pédoncules, le régime arme la bouche (des crocs aux
// chasseurs), la méfiance dresse deux antennes de guet, la fourrure arrondit la silhouette et la
// couvre de touffes claires — jusqu'à cacher la carapace. La teinte vient de la lignée.
function osVivant(f) {
  const sp = f.sp, V = sp.vivant || {};
  EC = { shell: sp.shell, dark: sp.dark, leg: sp.leg, eye: sp.oeil, shard: [150, 226, 255] };
  const B = [], al = f.alarm || 0, dk = Math.min(1, (f.dead || 0) * 2.6), ram = f.ramasse || 0, bob = f.bob || 0;
  const poil = V.fourrure || 0, vit = V.vitesse ?? .5, vue = V.vue ?? .5, reg = V.regime || 0, mef = V.mefiance || 0;
  const gonfle = 1 + poil * .3, souffle = 1 + .025 * Math.sin(bob * 2.2) * (1 - dk);
  const bz = .165 + .03 * vit + Math.sin(bob * 2) * .012 + al * .045 - dk * .075 - ram * .06;
  const rouge = sp.chasse ? [255, 60, 44] : [255, 150, 60];
  const oeil = ram > 0 ? EC.eye.map((v, i) => Math.round(v + (rouge[i] - v) * ram)) : EC.eye;
  B.push({ a: [-.19, 0, bz], b: [.05, 0, bz + .01], w: .27 * gonfle * souffle, h: .21 * gonfle * souffle, c: EC.shell });   // abdomen
  B.push({ a: [.05, 0, bz + .01], b: [.18, 0, bz - .01], w: .2 * (1 + poil * .15), h: .16 * (1 + poil * .15), c: EC.shell });  // thorax
  if (poil < .7) B.push({ a: [-.16, 0, bz + .085 + poil * .03], b: [.06, 0, bz + .095 + poil * .03], w: .225 * (1 - poil * .5), h: .085, c: EC.dark });   // carapace
  B.push({ a: [-.08, 0, bz + .1 + poil * .05], b: [-.13, 0, bz + .25 + poil * .05], w: .065, h: .065, c: EC.shard });       // éclat volé
  if (poil > .25) {                                       // la fourrure : des touffes sur le dos et les flancs
    const crin = sp.crin || EC.shell, n = Math.round(5 + 9 * poil);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), x = -.22 + u * .36, cote = (i % 3) - 1;
      const y = cote * (.075 + .02 * poil), z = bz + .1 * gonfle - Math.abs(cote) * .03, l = .035 + .05 * poil, ond = Math.sin(bob * 1.7 + i) * .008;
      B.push({ a: [x, y, z], b: [x - .02 + ond, y * 1.25, z + l], w: .035 + .02 * poil, h: .03, c: crin });
    }
  }
  // les pattes : posées dans le monde, ramenées dans le repère du corps (comme le gabarit commun)
  const R = repere(f), F = R.F, L = R.L, U = R.U, paroi = !!f.mur || !!f.tang, k = sp.sz || 1;
  const genou = .075 + .06 * vit, ep = .05 - .012 * vit;
  for (const ft of f.feet) {
    let wx, wy, wz, lz;
    if (ft.step > 0) { const u = 1 - ft.step, e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      wx = ft.sx + (ft.tx - ft.sx) * e; wy = ft.sy + (ft.ty - ft.sy) * e; wz = ft.sz + (ft.tz - ft.sz) * e; lz = Math.sin(u * Math.PI) * .07; }
    else { wx = ft.x; wy = ft.y; wz = ft.z ?? f.z; lz = 0; }
    const dx = wx - f.x, dy = wy - f.y, dz = wz - f.z;
    let lx = dx * F[0] + dy * F[1] + dz * F[2], ly = dx * L[0] + dy * L[1] + dz * L[2];
    let lzz = lz + (paroi ? (dx * U[0] + dy * U[1] + dz * U[2]) / k : 0);
    const hip = [ft.rx * .5, ft.ry * .48, bz];
    if (dk > 0) { const kk = dk * .88; lx += (hip[0] - lx) * kk; ly += (hip[1] - ly) * kk; lzz += (bz + .03 - lzz) * kk; }
    const knee = [(hip[0] + lx) / 2, (hip[1] + ly) / 2 + ft.ry * .85, Math.max(hip[2], lzz) + genou + al * .02];
    B.push({ a: hip, b: knee, w: ep, h: ep, c: EC.leg });
    B.push({ a: knee, b: [lx, ly, lzz], w: ep * .78, h: ep * .78, c: EC.leg });
  }
  const pe = .6 + .9 * vue;                               // les yeux : plus haut perchés chez qui voit loin
  for (const sd of [-1, 1]) {
    const base = [.15, sd * .055, bz + .035];
    const tip = [.15 + .035 * pe + al * .02, sd * (.055 + .02 * pe + al * .012), bz + .035 + .08 * pe + Math.sin(bob * 3 + sd) * .008 - dk * .05];
    B.push({ a: base, b: tip, w: .032, h: .032, c: EC.leg });
    B.push({ a: tip, b: [tip[0] + .018, tip[1], tip[2] + .018], w: .055 + ram * .02, h: .055 + ram * .02, c: oeil });
  }
  if (mef > .35) for (const sd of [-1, 1]) {              // les antennes de guet
    const h = .06 + .12 * mef + al * .05;
    B.push({ a: [.17, sd * .03, bz + .05], b: [.24 + .02 * mef, sd * (.07 + .04 * mef), bz + .05 + h], w: .016, h: .016, c: EC.dark });
  }
  const open = .028 + al * .05 + Math.max(0, Math.sin(bob * 6)) * al * .03 + ram * .06, m = .6 + 1.3 * reg, mw = .03 * (.8 + .5 * reg);
  for (const sd of [-1, 1])                               // les mandibules, à la mesure du régime
    B.push({ a: [.17, sd * .05, bz - .02], b: [.17 + .1 * m, sd * (.05 + open * m), bz - .025 - .02 * m], w: mw, h: mw, c: EC.leg });
  if (reg > .58) for (const sd of [-1, 1])                // et des crocs aux vrais chasseurs
    B.push({ a: [.2, sd * .03, bz - .01], b: [.25, sd * .028, bz - .07], w: .02, h: .02, c: [236, 228, 212] });
  return B;
}

// ---------- recevoir un catalogue plus récent (pour la prochaine ouverture) ----------
// Le jeu se construit d'un bloc au chargement : un catalogue reçu en cours de partie ne s'applique
// qu'à la prochaine ouverture (comme une mise à jour). Sans source déclarée, rien ne part.
function vivantRafraichir() {
  if (!VIVANT_SOURCE || typeof fetch !== 'function') return;
  fetch(VIVANT_SOURCE, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(c => {
    if (!vivantValide(c) || (VIVANT_CAT && (c.ordre || 0) <= (VIVANT_CAT.ordre || 0))) return;
    try { localStorage.setItem(VIVANT_CLE, JSON.stringify(c)); } catch (e) { /* stockage plein : on retentera */ }
  }).catch(() => {});
}
if (typeof addEventListener === 'function') addEventListener('load', () => setTimeout(vivantRafraichir, 8000));

// Pour le journal du jeu, plus tard : ce que le monde vivant a fait de neuf.
const vivantNouvelles = () => VIVANT_CAT ? VIVANT_CAT.evenements.slice(-8).reverse() : [];
