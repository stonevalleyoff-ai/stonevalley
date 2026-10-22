// ============================================================
//  LES DONS (dons.js) — §204, lot 1 : le moteur
//  Des compétences permanentes, hors des caractéristiques : un élixir de don, préparé à la table d'alchimie
//  d'après une formule trouvée en trésor, et bu sur place. Sept familles :
//   - six en trois couples opposés (le Vent et la Terre, l'Ombre et la Lumière, l'Instinct et l'Esprit) :
//     boire un don d'une famille DISSOUT tous ceux de la famille opposée ;
//   - chacune un petit arbre de cinq dons : un de niveau 1, puis une fourche de deux voies au niveau 2 (on n'en
//     prend qu'une : l'autre est fermée), puis au niveau 3 le bout de chaque voie. Trois dons au plus par famille,
//     neuf en tout ;
//   - le HÉROS, à part : cinq dons exceptionnels, un seul à la fois (en boire un autre dissout le premier), sans
//     contraire. Il faut un don de niveau 3 pour en préparer un, du fer damné et deux ingrédients légendaires.
//  Ce qu'on sait d'un don s'apprend peu à peu (P.savoirDons, par bits) : 1 ce qu'il fait (la formule le dit),
//  2 son niveau et ce qu'il demande avant lui, 4 ce qu'il ferme et ce qu'il dissout. Les nomades le diront (lot 2) ;
//  ce qu'on a vécu (une voie refusée, une famille dissoute) s'apprend aussi. La table ne prévient en clair que de ce
//  qu'on sait ; sinon, « quelque chose en vous résiste à ce breuvage ».
//  Lot 1 : les règles, la préparation, la sauvegarde, l'arbre, et l'effet des six dons de niveau 1 (pret). Les
//  autres attendent leur lot ; leur formule ne se trouve pas encore.
//  index.html appelle : donPotion (potionDe), donFrein (freinAlch), boireDon (tenterAlch), donsTuiles et donsArbre
//  (la table), donsIcones (les vignettes), donsSauve / donsLus, et donA / donK partout où un don change le jeu.
// ============================================================
const DON_FAM = {
  vent:     { n: 'Vent', d: 'la mobilité', op: 'terre', c: [150, 214, 236], ingr: ['feuille', 'fleur', 'graine'], plume: 1 },
  terre:    { n: 'Terre', d: 'l\'ancrage', op: 'vent', c: [186, 128, 72], ingr: ['racine', 'viande', 'champignon'], mat: 'basalte', u: 8 },
  ombre:    { n: 'Ombre', d: 'la furtivité', op: 'lumiere', c: [128, 100, 176], ingr: ['champignon', 'racine', 'feuille'], mat: 'spore', u: 4 },
  lumiere:  { n: 'Lumière', d: 'la vigilance et le soin', op: 'ombre', c: [255, 222, 120], ingr: ['fleur', 'douceur', 'fruit'], mat: 'nectar', u: 3 },
  instinct: { n: 'Instinct', d: 'la bête et le sang', op: 'esprit', c: [214, 76, 64], ingr: ['viande', 'poisson', 'fruit'], mat: 'ichor', u: 3 },
  esprit:   { n: 'Esprit', d: 'les arcanes', op: 'instinct', c: [126, 136, 250], ingr: ['champignon', 'fleur', 'graine'], mat: 'verrenoir', u: 4 },
  heros:    { n: 'Héros', d: 'l\'exceptionnel', op: null, c: [255, 196, 60], ingr: ['viande', 'fleur', 'racine'], heros: 1 },
};
const DON_ORDRE = ['vent', 'terre', 'ombre', 'lumiere', 'instinct', 'esprit', 'heros'];
// niv : 1 à 3 (le héros : 4) ; voie : 'a' ou 'b' à partir du niveau 2 ; req : le don qu'il faut avant ; pret : son effet est en jeu
const DONS = [
  { id: 'piedleger', fam: 'vent', niv: 1, n: 'Pied léger', d: 'saut +12 %, pas +6 %', pret: 1 },
  { id: 'troisieme', fam: 'vent', niv: 2, voie: 'a', req: 'piedleger', n: 'Troisième saut', d: 'un saut de plus, en l\'air' , pret: 1 },
  { id: 'ruee', fam: 'vent', niv: 2, voie: 'b', req: 'piedleger', n: 'Ruée', d: 'un bond à l\'horizontale, invulnérable un instant' , pret: 1 },
  { id: 'plane', fam: 'vent', niv: 3, voie: 'a', req: 'troisieme', n: 'Vol plané', d: 'en l\'air, maintenir SAUT pour planer' , pret: 1 },
  { id: 'rueefantome', fam: 'vent', niv: 3, voie: 'b', req: 'ruee', n: 'Ruée fantôme', d: 'deux ruées d\'affilée, qui traversent les bêtes et les étourdissent' , pret: 1 },
  { id: 'racines', fam: 'terre', niv: 1, n: 'Racines', d: 'les coups ne vous repoussent plus', pret: 1 },
  { id: 'peaupierre', fam: 'terre', niv: 2, voie: 'a', req: 'racines', n: 'Peau de pierre', d: '−15 % de dégâts tant qu\'on ne court pas' , pret: 1 },
  { id: 'choc', fam: 'terre', niv: 2, voie: 'b', req: 'racines', n: 'Choc', d: 'retomber d\'un saut frappe le sol et étourdit autour de soi' , pret: 1 },
  { id: 'colosse', fam: 'terre', niv: 3, voie: 'a', req: 'peaupierre', n: 'Colosse', d: 'un quatrième cœur' , pret: 1 },
  { id: 'faille', fam: 'terre', niv: 3, voie: 'b', req: 'choc', n: 'Faille', d: 'la retombée ouvre une faille de feu sur quatre cases' , pret: 1 },
  { id: 'feutre', fam: 'ombre', niv: 1, n: 'Pas feutré', d: 'les bêtes vous repèrent de 40 % moins loin, et vous entendent moitié moins', pret: 1 },
  { id: 'fondu', fam: 'ombre', niv: 2, voie: 'a', req: 'feutre', n: 'Fondu', d: 'immobile dans l\'ombre, on devient invisible' , pret: 1 },
  { id: 'esquive', fam: 'ombre', niv: 2, voie: 'b', req: 'feutre', n: 'Esquive', d: 'une roulade qui rend invulnérable' , pret: 1 },
  { id: 'assassin', fam: 'ombre', niv: 3, voie: 'a', req: 'fondu', n: 'Assassin', d: 'le premier coup sur une bête qui ne vous a pas vu fait trois fois plus mal' , pret: 1 },
  { id: 'contre', fam: 'ombre', niv: 3, voie: 'b', req: 'esquive', n: 'Contre', d: 'une esquive au bon moment déclenche une riposte double' , pret: 1 },
  { id: 'lueur', fam: 'lumiere', niv: 1, n: 'Lueur', d: 'on éclaire autour de soi la nuit, sans lanterne', pret: 1 },
  { id: 'vigie', fam: 'lumiere', niv: 2, voie: 'a', req: 'lueur', n: 'Vigie', d: 'les bêtes qui vous guettent sont signalées' },
  { id: 'guerisseuse', fam: 'lumiere', niv: 2, voie: 'b', req: 'lueur', n: 'Main guérisseuse', d: 'les soins et les plats soignent moitié plus' },
  { id: 'chercheur', fam: 'lumiere', niv: 3, voie: 'a', req: 'vigie', n: 'Œil du chercheur', d: 'coffres, plantes rares et filons se voient à travers le relief' },
  { id: 'aube', fam: 'lumiere', niv: 3, voie: 'b', req: 'guerisseuse', n: 'Aube intérieure', d: 'une fois par expédition, tomber à zéro vous relève à mi-vie' },
  { id: 'flair', fam: 'instinct', niv: 1, n: 'Flair', d: 'la flore rend son produit moitié plus souvent, et chaque bête abattue une viande de plus', pret: 1 },
  { id: 'meneur', fam: 'instinct', niv: 2, voie: 'a', req: 'flair', n: 'Meneur', d: 'une compagne de plus en jeu, et des liens moins chers' },
  { id: 'fureur', fam: 'instinct', niv: 2, voie: 'b', req: 'flair', n: 'Fureur', d: 'sous 30 % de vie, +30 % de dégâts et de vitesse' },
  { id: 'chefmeute', fam: 'instinct', niv: 3, voie: 'a', req: 'meneur', n: 'Chef de meute', d: 'les compagnes près de vous frappent et encaissent 20 % mieux' },
  { id: 'sangchaud', fam: 'instinct', niv: 3, voie: 'b', req: 'fureur', n: 'Sang chaud', d: 'chaque bête abattue rend 5 % de vie' },
  { id: 'memoire', fam: 'esprit', niv: 1, n: 'Mémoire', d: 'les sorts coûtent 10 % de mana en moins', pret: 1 },
  { id: 'echo', fam: 'esprit', niv: 2, voie: 'a', req: 'memoire', n: 'Écho', d: 'un sort sur quatre ne coûte rien' },
  { id: 'resonance', fam: 'esprit', niv: 2, voie: 'b', req: 'memoire', n: 'Résonance', d: 'la compétence d\'une arme forgée gagne un niveau' },
  { id: 'archimage', fam: 'esprit', niv: 3, voie: 'a', req: 'echo', n: 'Archimage', d: 'les sorts portent 30 % plus fort et plus loin' },
  { id: 'ameliee', fam: 'esprit', niv: 3, voie: 'b', req: 'resonance', n: 'Âme liée', d: 'chaque coup d\'une arme forgée rend un peu de mana' },
  { id: 'phenix', fam: 'heros', niv: 4, n: 'Phénix', d: 'tombé à zéro, vous renaissez sur place dans une gerbe de feu, toute la vie rendue · toutes les dix minutes' },
  { id: 'tempssuspendu', fam: 'heros', niv: 4, n: 'Temps suspendu', d: 'le monde tourne au quart de sa vitesse cinq secondes, vous non · toutes les deux minutes' },
  { id: 'ailes', fam: 'heros', niv: 4, n: 'Ailes de l\'aube', d: 'un vrai vol, huit secondes, rechargé au sol' },
  { id: 'titan', fam: 'heros', niv: 4, n: 'Titan', d: 'vous grandissez de moitié douze secondes : dégâts doublés, aucun recul · toutes les trois minutes' },
  { id: 'roibetes', fam: 'heros', niv: 4, n: 'Roi des bêtes', d: 'un regard fait d\'une bête sauvage une compagne pour quatre-vingt-dix secondes · toutes les quatre minutes' },
];
const DON = {}; for (const D of DONS) DON[D.id] = D;
const DON_NIV = ['', 'niveau 1', 'niveau 2', 'niveau 3', 'héroïque'];
const DON_A = { vent: 'au Vent', terre: 'à la Terre', ombre: 'à l\'Ombre', lumiere: 'à la Lumière', instinct: 'à l\'Instinct', esprit: 'à l\'Esprit' };
// ---------- ce qu'on a, ce qu'on sait ----------
const donA = id => !!(typeof P !== 'undefined' && P.dons && P.dons[id] > 0);
const donK = id => (typeof P !== 'undefined' && P.dons && P.dons[id]) || 0;   // sa puissance (0,55 à 1,5) ; 0 sans lui
const formuleA = id => !!(P.formules && P.formules[id]) || (typeof essai !== 'undefined' && essai);
const savoirDon = (id, b) => (typeof essai !== 'undefined' && essai) || !!((P.savoirDons || {})[id] & b);
function apprendreDon(id, b) { if (!DON[id]) return false; P.savoirDons = P.savoirDons || {}; const a = P.savoirDons[id] | 0; if ((a & b) === b) return false; P.savoirDons[id] = a | b; if (typeof Sauve !== 'undefined') Sauve.sale = true; return true; }
function gagnerFormule(id, muet) {                       // (§205) la formule se garde, même à la mort ; elle dit ce que fait le don
  if (!DON[id] || (P.formules && P.formules[id])) return false;
  P.formules = P.formules || {}; P.formules[id] = 1; apprendreDon(id, 1);
  if (!muet && typeof say === 'function') say('une formule de don · ' + DON[id].n + ' (' + DON_FAM[DON[id].fam].n + ') · elle se prépare à la table d\'alchimie', 4.5);
  if (typeof Sauve !== 'undefined') Sauve.sale = true; return true;
}
const donsDe = fam => DONS.filter(D => D.fam === fam && donA(D.id));
// ---------- les règles ----------
// ce que boire D dissoudrait : la famille opposée tout entière ; pour un don du héros, celui qu'on a
function donDissout(D) {
  const F = DON_FAM[D.fam];
  if (F.heros) return DONS.filter(o => o.fam === 'heros' && o.id !== D.id && donA(o.id)).map(o => o.id);
  return F.op ? donsDe(F.op).map(o => o.id) : [];
}
// la voie fermée : l'autre branche de la fourche est déjà prise (un don de la même famille, de niveau 2 ou 3, de l'autre voie)
const donVoieFermee = D => D.voie ? DONS.find(o => o.fam === D.fam && o.voie && o.voie !== D.voie && donA(o.id)) || null : null;
const VAGUE = 'quelque chose en vous résiste à ce breuvage';
function donFrein(D) {                                    // rend la raison qui empêche de le préparer, ou rien
  if (!D) return 'ce don n\'existe pas';
  if (donA(D.id)) return 'ce don est déjà en vous';
  if (!formuleA(D.id)) return 'la formule de ce don vous manque';
  if (!D.pret) return 'cette formule reste illisible pour l\'instant';
  if (D.req && !donA(D.req)) return savoirDon(D.id, 2) ? 'il faut d\'abord ' + DON[D.req].n.toLowerCase() : 'le breuvage ne prendra pas : il lui manque quelque chose en vous';
  const f = donVoieFermee(D);
  if (f) return savoirDon(D.id, 4) || savoirDon(f.id, 4) ? f.n.toLowerCase() + ' vous ferme cette voie' : VAGUE;
  if (DON_FAM[D.fam].heros && !DONS.some(o => o.niv === 3 && donA(o.id))) return savoirDon(D.id, 2) ? 'un don du héros demande un don de niveau 3' : 'le breuvage ne prendra pas : il lui manque quelque chose en vous';
  return null;
}
// ce qu'en dit la table avant qu'on le prépare : ce qu'il dissoudra, si on le sait (vaguement sinon)
function donAvert(D) {
  const L = donDissout(D); if (!L.length) return '';
  const su = savoirDon(D.id, 4) || L.some(id => savoirDon(id, 4));
  return su ? 'le boire dissoudra : ' + L.map(id => DON[id].n.toLowerCase()).join(', ') : VAGUE;
}
// la recette : des ingrédients des trois familles de son élément, des éclats, la matière de sa famille ; au niveau 3, un
// ingrédient légendaire ; le Vent veut des plumes ; le héros, trois fers damnés et deux légendaires
function donRecette(D) {
  const F = DON_FAM[D.fam], v = D.niv;
  let motif;
  if (F.heros) motif = [['I', 'ferdamne'], ['*', 5], ['A', 4], ['I', 'ferdamne'], ['E', 15], ['B', 4], ['*', 5], ['I', 'ferdamne']];
  else if (v === 1) motif = [['A', 2], ['E', 5], ['B', 2], ['C', 1]];
  else if (v === 2) motif = [['A', 3], ['E', 8], ['B', 3], ['C', 2], ['A', 3]];
  else motif = [['A', 4], ['B', 3], ['*', 5], ['E', 10], ['C', 3], ['A', 4]];
  if (F.plume) { motif.splice(1, 0, ['I', 'plume']); if (v === 3) motif.push(['I', 'plume']); }
  const cout = { eclat: [0, 15, 30, 50, 80][v] };
  if (F.mat) cout[F.mat] = F.u * v;
  return { motif, cout, base: [0, 70, 55, 45, 30][v], niv: [0, 1, 2, 3, 3][v] };
}
function donPotion(k) {                                   // potionDe('don:…')
  const D = DON[String(k).slice(4)]; if (!D || !formuleA(D.id)) return null;
  const R = donRecette(D), F = DON_FAM[D.fam];
  return { k, n: D.n, d: D.d, v: () => donA(D.id) ? 'en vous' : 'à préparer', fam: F.ingr, rg: donA(D.id) ? 1 : 0, max: 1, dec: 0, c: null, g: 'don', don: D,
    motif: R.motif, base: R.base, niv: R.niv, cout: R.cout };
}
function boireDon(D, pw) {
  const L = donDissout(D);
  for (const id of L) { delete P.dons[id]; apprendreDon(id, 4); }
  if (L.length) apprendreDon(D.id, 4);                   // on l'a vécu : on le sait
  P.dons[D.id] = Math.round(Math.max(.5, Math.min(1.5, pw || 1)) * 100) / 100; apprendreDon(D.id, 3);
  if (D.id === 'colosse' && typeof lives !== 'undefined') lives = Math.min(lives + 1, viesMax());   // (§206) le quatrième cœur, tout de suite
  if (typeof Sauve !== 'undefined') Sauve.sale = true;
  return L;
}
// ---------- la table : les tuiles, l'arbre ----------
const icDon = D => 'don_' + D.fam;
function donsTuiles(tuile) {                              // la section « Les dons » de la colonne de gauche : les formules qu'on a
  const L = DONS.filter(D => formuleA(D.id) && (typeof essai === 'undefined' || !essai || D.pret || donA(D.id)));
  if (!L.length) return '';
  return `<div class="al-h">Les dons</div><div class="al-tuiles">` + L.map(D => tuile('don:' + D.id, D.n, donA(D.id) ? 1 : 0, 1, icDon(D), donA(D.id) ? 'en vous' : DON_FAM[D.fam].n)).join('') + `</div>`;
}
function donsStyle() {
  if (typeof document === 'undefined' || document.getElementById('dons-css')) return;
  const st = document.createElement('style'); st.id = 'dons-css';
  st.textContent = '.dn-fam{margin:0 0 8px;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,.03);border-left:3px solid var(--c);}'
    + '.dn-fam>b{display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--c);}.dn-fam>b small{color:rgba(255,255,255,.45);font-weight:400;}'
    + '.dn-rang{display:flex;gap:4px;margin-top:4px;}.dn-rang>span{flex:1;min-width:0;padding:4px 6px;border-radius:6px;font-size:11px;line-height:1.25;background:rgba(0,0,0,.22);color:rgba(255,255,255,.4);}'
    + '.dn-rang>span b{display:block;color:rgba(255,255,255,.75);font-size:11.5px;}.dn-rang>span.f b{color:#fff;}.dn-rang>span.a{background:rgba(255,206,110,.16);box-shadow:inset 0 0 0 1px rgba(255,206,110,.5);}'
    + '.dn-rang>span.a b{color:#ffd27d;}.dn-rang>span.x{opacity:.45;}.dn-rang i{flex:0 0 auto;align-self:center;font-style:normal;color:rgba(255,255,255,.35);font-size:11px;}'
    + '.dn-ns{margin-top:4px;font-size:11px;color:rgba(255,255,255,.5);}.dn-tete small{display:block;}';
  document.head.appendChild(st);
}
function donsArbre() {                                    // l'arbre, dans le brouillard de ce qu'on ne sait pas
  donsStyle();
  const nb = DONS.filter(D => donA(D.id)).length, nf = DONS.filter(D => formuleA(D.id)).length;
  const cel = D => {
    const sait = savoirDon(D.id, 2), a = donA(D.id), f = formuleA(D.id), x = !a && (donVoieFermee(D) && savoirDon(D.id, 4));
    if (!sait && !a) return `<span><b>?</b>${f ? 'une formule : ' + ESC(D.n) + ', mais où se place-t-elle ?' : 'un don inconnu'}</span>`;
    return `<span class="${a ? 'a' : f ? 'f' : ''}${x ? ' x' : ''}" title="${ESC(D.n + ' · ' + DON_NIV[D.niv] + (D.req ? ' · après ' + DON[D.req].n.toLowerCase() : ''))}"><b>${ESC(D.n)}</b>${savoirDon(D.id, 1) || a ? ESC(D.d) : 'ce qu\'il fait ?'}${a ? ' · <em>en vous, ' + pctP(donK(D.id)) + '</em>' : f ? ' · formule' : ''}</span>`;
  };
  let h = `<div class="cu-nom dn-tete">${img('don_heros')}<div><b>Les dons</b><small>${nb} en vous · ${nf} formule${nf > 1 ? 's' : ''} · les formules se trouvent en trésor ; les nomades en savent long sur leurs liens</small></div></div>`;
  for (const fam of DON_ORDRE) {
    const F = DON_FAM[fam], L = DONS.filter(D => D.fam === fam), opSu = F.op && L.some(D => savoirDon(D.id, 4));
    h += `<div class="dn-fam" style="--c:rgb(${F.c.join(',')})"><b>${img('don_' + fam)}${F.n}<small>${F.d}${F.heros ? ' · un seul à la fois' : opSu ? ' · s\'oppose ' + DON_A[F.op] : ''}</small></b>`;
    if (F.heros) h += `<div class="dn-rang">${L.map(cel).join('')}</div>`;
    else for (const v of [1, 2, 3]) { const R = L.filter(D => D.niv === v), forkSu = v > 1 && R.some(D => savoirDon(D.id, 4));
      h += `<div class="dn-rang">${R.map(cel).join(v > 1 ? `<i>${forkSu ? '⟷' : '·'}</i>` : '')}</div>`; }
    h += `</div>`;
  }
  return h;
}
// ---------- la sauvegarde ----------
function donsSauve() {
  const o = {}; for (const D of DONS) { const v = {}; if (P.dons && P.dons[D.id]) v.p = P.dons[D.id]; if (P.formules && P.formules[D.id]) v.f = 1; const s = (P.savoirDons || {})[D.id] | 0; if (s) v.s = s; if (Object.keys(v).length) o[D.id] = v; }
  return o;
}
function donsLus(d) {
  P.dons = {}; P.formules = {}; P.savoirDons = {};
  if (!d || typeof d !== 'object') return;
  for (const [id, v] of Object.entries(d)) { if (!DON[id] || !v || typeof v !== 'object') continue;
    if (Number.isFinite(+v.p) && +v.p > 0) P.dons[id] = Math.max(.5, Math.min(1.5, Math.round(+v.p * 100) / 100));
    if (v.f) P.formules[id] = 1;
    const s = (v.s | 0) & 7; if (s) P.savoirDons[id] = s; }
  // un seul don du héros ; pas deux voies dans une famille ; pas deux familles opposées (une sauvegarde trafiquée)
  const H = DONS.filter(D => D.fam === 'heros' && P.dons[D.id]); for (const D of H.slice(1)) delete P.dons[D.id];
  for (const fam of DON_ORDRE) { const F = DON_FAM[fam]; if (F.op && donsDe(fam).length && donsDe(F.op).length) for (const D of donsDe(F.op)) delete P.dons[D.id]; }
  for (const D of DONS) if (P.dons[D.id] && D.req && !P.dons[D.req]) delete P.dons[D.id];
}
// ---------- les vignettes : une fiole par famille, à sa couleur, et son signe ----------
function donsIcones() {
  if (typeof DESSINS !== 'object') return;
  const cl = (c, k) => c.map(v => Math.max(0, Math.min(255, v + k)));
  const fiole = (d, c) => { const V = [214, 224, 232]; d.rect(7, 1, 9, 3, [120, 90, 60]); d.rect(6, 4, 10, 5, V); d.disque(8, 10, 5, V); d.disque(8, 10, 4, c); d.disque(6.5, 8.5, 1.4, cl(c, 70)); d.net(11, 12, cl(c, -60)); };
  const signe = {
    vent: (d, c) => { d.ligne(4, 9, 7, 8, [255, 255, 255]); d.ligne(7, 8, 10, 9, [255, 255, 255]); d.ligne(6, 11, 9, 10, [255, 255, 255]); d.ligne(9, 10, 12, 11, [255, 255, 255]); },
    terre: (d, c) => { d.rect(6, 9, 10, 12, cl(c, -70)); d.rect(6, 9, 10, 9, cl(c, 40)); },
    ombre: (d, c) => { d.disque(8, 10, 2.4, [20, 14, 30]); d.disque(9.2, 9.2, 2, c); },
    lumiere: (d, c) => { d.ligne(8, 7, 8, 13, [255, 255, 255]); d.ligne(5, 10, 11, 10, [255, 255, 255]); d.net(8, 10, [255, 250, 200]); },
    instinct: (d, c) => { for (const x of [6, 8, 10]) d.ligne(x, 8, x - 1, 12, [255, 236, 220]); },
    esprit: (d, c) => { d.rect(5, 9, 11, 11, [255, 255, 255]); d.rect(7, 9, 9, 11, [30, 30, 80]); },
    heros: (d, c) => { d.rect(5, 10, 11, 12, [255, 240, 170]); d.net(5, 9, [255, 240, 170]); d.net(8, 8, [255, 240, 170]); d.net(11, 9, [255, 240, 170]); d.net(8, 11, [220, 60, 60]); },
  };
  for (const fam of DON_ORDRE) { const c = DON_FAM[fam].c; DESSINS['don_' + fam] = d => { fiole(d, c); signe[fam](d, c); }; }
}

// ============================================================
//  (§205) LOT 2 : OÙ SONT LES FORMULES, CE QU'EN DISENT LES NOMADES
//  - La CACHE D'ALCHIMISTE : un coffret de pierre cerclé de fer, une fiole qui luit posée dessus. Une île sur quatre dès
//    l'exploration 3 : une formule de niveau 1. Sur l'île d'une famille (le volcan pour la Terre, le Korlaz et la brume
//    pour l'Ombre, l'Achromie pour la Lumière, le Vyrel pour l'Instinct, les îles volantes pour le Vent), plus souvent,
//    et de niveau 2 ; au plus haut des îles volantes (exploration 10), le bout d'une voie du Vent. La cache donne la
//    première formule de son rang que vous n'avez pas ; à défaut, une de niveau 1.
//  - Les COFFRES GARDÉS du Centre et des Cercles : parfois une formule de l'Esprit (niveau 2).
//  - Les GARDIENS, abattus : le bout d'une voie (niveau 3) — le Tisonnier pour la Terre, la Mère-Charogne pour
//    l'Instinct, la Tisseuse pour l'Ombre, le prisme reposé de l'Achromie pour la Lumière, le reliquaire du Roi
//    pour l'Esprit.
//  - Les NOMADES dont on tire d'affaire un égaré : parfois une formule de niveau 1.
//  Tant que les dons d'un rang n'ont pas leur effet en jeu (pret), leurs formules ne se trouvent pas : on reçoit à la
//  place une formule prête, du rang le plus proche.
//  - Ce que DISENT les nomades (« Les dons… ») : une chose par question, une ou deux par halte selon qui parle (le
//    conteur et le devin en savent plus). D'abord sur les formules et les dons qu'on a, puis leur famille, puis le reste ;
//    les légendes du Héros, seuls le conteur et le devin les content, une par expédition.
// ============================================================
const DON_CACHES = [];                                    // celles de l'île : { x, y, z, niv, fam, vu, pris }
const DON_DE = { vent: 'du Vent', terre: 'de la Terre', ombre: 'de l\'Ombre', lumiere: 'de la Lumière', instinct: 'de l\'Instinct', esprit: 'de l\'Esprit', heros: 'du Héros' };
const DON_LA = { vent: 'le Vent', terre: 'la Terre', ombre: 'l\'Ombre', lumiere: 'la Lumière', instinct: 'l\'Instinct', esprit: 'l\'Esprit' };
const DON_CACHE_R = 1.6, DON_CACHE_VU = 14;
function donFamIle() {                                    // la famille de l'île, s'il y en a une
  if (typeof ileVolcan !== 'undefined' && ileVolcan) return 'terre';
  const e = typeof ETAT !== 'undefined' ? ETAT.id : null;
  if (e === 'korlaz' || e === 'brume') return 'ombre';
  if (e === 'achromie') return 'lumiere';
  if (e === 'vyrel') return 'instinct';
  if (typeof PlT !== 'undefined') { let n = 0; for (let i = 0; i < PlT.length; i += 7) if (PlT[i]) n++; if (n * 7 > 300) return 'vent'; }
  return null;
}
// la formule d'un rang (et d'une famille) que vous n'avez pas, prête ; à défaut, la plus proche qui le soit
function donFormuleLibre(niv, fam, graine) {
  const libre = D => D.pret && !(P.formules || {})[D.id] && !donA(D.id);
  const essais = [[niv, fam], [niv - 1, fam], [niv, null], [niv - 1, null], [1, null]];
  for (const [v, f] of essais) {
    if (v < 1) continue;
    const L = DONS.filter(D => D.niv === v && (!f || D.fam === f) && D.fam !== 'heros' && libre(D));
    if (L.length) return L[((graine >>> 0) % L.length)];
  }
  return null;
}
function placerCachesDons() {
  DON_CACHES.length = 0;
  if ((typeof djIci === 'function' && djIci()) || typeof profondeur !== 'function') return;
  const niv = profondeur(); if (niv < 3) return;
  let g = (SEED ^ 0xd0c4e5) >>> 0; const tir = () => { g = (g * 1664525 + 1013904223) >>> 0; return g / 4294967296; };
  const fam = donFamIle();
  let rang = 0;
  if (fam === 'vent' && niv >= 10 && tir() < .5) rang = 3;
  else if (fam && tir() < .6) rang = 2;
  if (!rang && tir() < .25) rang = 1;
  if (!rang) return;
  const arche = (typeof PortailIle !== 'undefined' && PortailIle) || (typeof PortailCache !== 'undefined' && PortailCache);
  for (let k = 0; k < 1500; k++) {
    const x = 10 + (tir() * (WS - 20) | 0), y = 10 + (tir() * (WS - 20) | 0);
    if (!placeArche(x, y) || typeFlore(x, y)) continue;
    if (arche && (arche.x - x) ** 2 + (arche.y - y) ** 2 < 100) continue;
    if (typeof LUTRINS !== 'undefined' && LUTRINS.some(l => (l.x - x) ** 2 + (l.y - y) ** 2 < 64)) continue;
    if (beasts.some(b => b.sp.plante && (b.x - x) ** 2 + (b.y - y) ** 2 < 16)) continue;
    DON_CACHES.push({ x: x + .5, y: y + .5, z: hAt(x, y), niv: rang, fam: rang > 1 ? fam : null, vu: false, pris: false, g: g >>> 0 });
    return;
  }
}
const cacheContenu = c => donFormuleLibre(c.niv, c.fam, c.g ^ 0x5bd1e995);
const cacheCol = c => c.fam ? DON_FAM[c.fam].c : [255, 220, 150];
function cacheOs(c) {                                     // un coffret de pierre cerclé de fer, une fiole posée dessus qui luit
  const B = [], x = c.x, y = c.y, z = c.z, nuit = typeof noirceur === 'function' && noirceur() > .3, plein = !c.pris && !!cacheContenu(c), col = cacheCol(c);
  const add = (a, b, w, h, cc, lum) => B.push({ a, b, w, h, c: cc, lum: lum ? 1 : 0 });
  const S1 = [118, 112, 104], S2 = [92, 88, 82], F = [70, 66, 70];
  add([x - .32, y, z], [x + .32, y, z + .36], .46, .46, S2);                      // le coffret
  add([x - .35, y, z + .36], [x + .35, y, z + .46], .52, .52, S1);                // le couvercle
  for (const dx of [-.2, .2]) add([x + dx, y, z - .01], [x + dx, y, z + .47], .05, .54, F);   // les cercles de fer
  add([x + .33, y, z + .16], [x + .38, y, z + .26], .1, .14, [150, 140, 120]);     // la serrure
  if (plein) {
    const h = z + .47 + .03 * Math.sin(t * 2 + x);
    add([x, y, h], [x, y, h + .2], .16, .16, col, 1);                              // la fiole
    add([x, y, h + .2], [x, y, h + .3], .06, .06, [210, 220, 228]);
    add([x, y, h + .3], [x, y, h + .34], .08, .08, [120, 90, 60]);
    if (nuit) add([x, y, h + .5], [x, y, h + 5.5], .04, .04, col.map(v => Math.min(255, v + 60)), 1);
  }
  return B;
}
function majCachesDons(dt) {
  for (const c of DON_CACHES) {
    const d = Math.hypot(c.x - P.x, c.y - P.y); if (d > 46) continue;
    const plein = !c.pris && !!cacheContenu(c);
    if (!c.vu && d < DON_CACHE_VU) { c.vu = true; if (plein) say('une cache d\'alchimiste · un coffret scellé, une fiole y luit', 3.2); }
    if (plein && Math.random() < dt * (noirceur() > .3 ? 4 : 1.2)) {
      const a = Math.random() * 6.2832;
      parts.push({ x: c.x + Math.cos(a) * .12, y: c.y + Math.sin(a) * .12, z: c.z + .7, vx: 0, vy: 0, vz: .4 + Math.random() * .4, g: -.12, life: 1, age: 0, col: 'rgb(' + cacheCol(c).join(',') + ')', luit: 1, tl: .06 });
    }
  }
}
function cacheAction() {
  let c = null, bd = DON_CACHE_R * DON_CACHE_R;
  for (const o of DON_CACHES) { const d = (o.x - P.x) ** 2 + (o.y - P.y) ** 2; if (d < bd && Math.abs(o.z - P.z) < 2) { bd = d; c = o; } }
  if (!c) return null;
  const D = c.pris ? null : cacheContenu(c);
  if (!D) return { v: 'VIDE', o: 'une cache d\'alchimiste', f: () => say(c.pris ? 'vous avez déjà vidé cette cache' : 'la cache est vide · vous avez déjà ses formules', 2), vide: true };
  return { v: 'OUVRIR', o: 'une cache d\'alchimiste', f: () => {
    if (!gagnerFormule(D.id, true)) return; c.pris = true;
    SON.jouer('rare', {}, c.x, c.y, c.z + .5); burst(c.x, c.y, c.z + .8, 26, 'rgb(' + cacheCol(c).join(',') + ')');
    say('une cache d\'alchimiste · la formule ' + (/^[aeiouyéèêàâîôûœh]/i.test(D.n) ? 'd\'' : 'de ') + D.n.toLowerCase() + ' (' + DON_FAM[D.fam].n + ') · elle se prépare à la table d\'alchimie', 5);
    if (typeof majSac === 'function') majSac(); } };
}
// un coffre gardé du Centre ou des Cercles : parfois une formule de l'Esprit
function donsCoffre(taille) {
  const ch = { grand: .35, garde: .15 }[taille] || 0; if (!ch || Math.random() >= ch) return '';
  const D = donFormuleLibre(2, 'esprit', Math.random() * 4294967296); if (!D || !gagnerFormule(D.id, true)) return '';
  return 'formule ' + D.n;
}
// un gardien abattu : le bout d'une voie de sa famille
function donsGardien(fam) {
  const D = donFormuleLibre(3, fam, (SEED ^ 0x9e37) >>> 0); if (!D || !gagnerFormule(D.id, true)) return '';
  return 'la formule ' + D.n;
}
// un égaré tiré d'affaire : parfois une formule de niveau 1
function donsRecompense(b) {
  if (Math.random() >= .4) return null;
  const D = donFormuleLibre(1, null, Math.random() * 4294967296); if (!D || !gagnerFormule(D.id, true)) return null;
  if (typeof nmGagne === 'function') nmGagne(b, 3); SON.jouer('rare');
  say(b.nm.nom + ' vous donne une formule de don · ' + D.n + ' (' + DON_FAM[D.fam].n + ') · elle se prépare à la table d\'alchimie', 5);
  return 'Tiens. Je la gardais pour moi, mais je ne saurai jamais la préparer : la formule de ' + D.n.toLowerCase() + '. Un alchimiste en ferait quelque chose.';
}
// ---------- ce que disent les nomades ----------
const DON_SAVANTS = { conteur: 2, devin: 2, cartographe: 1, marchand: 1, dresseur: 1 };
const DON_OU = [
  'Les alchimistes d\'avant cachaient leurs formules dans des coffrets de pierre cerclés de fer, une fiole posée dessus. On en croise une île sur quatre, à peu près.',
  'Sur l\'île d\'un fléau, ou sur le volcan, les caches tiennent des formules plus profondes : celles de la famille du lieu.',
  'Les gardiens portent les formules du bout des voies. Le Tisonnier, la Mère-Charogne, la Tisseuse… Qui les abat les trouve sur eux.',
  'Les Horlogers ont laissé des formules de l\'Esprit dans leurs coffres gardés. Ils aimaient ce qui pense.',
  'Une fiole qui luit, la nuit, tu la verras de loin : un fil de lumière monte de la cache.',
];
function donsNomade(b) {                                  // (nmAller) le choix, à l'accueil
  if (!b || !b.nm || !DON_SAVANTS[b.nm.role] || typeof profondeur !== 'function' || profondeur() < 3) return null;
  return { t: 'Les dons… tu en sais quelque chose ?', va: 'dons' };
}
const donSait = (id, b) => ((P.savoirDons || {})[id] | 0) & b;
function donPhrase(D, bit) {
  const F = DON_FAM[D.fam], de = DON_DE[D.fam];
  if (bit === 1) return F.heros ? '« ' + D.n + ' »… On en parle à voix basse, près des feux. Un don du Héros : ' + D.d + '.'
    : '« ' + D.n + ' » ? Un don ' + de + ' : ' + D.d + '.';
  if (bit === 2) {
    if (F.heros) return D.n + ' ne prend que chez qui porte déjà un don au bout d\'une voie. Les autres, le breuvage les rejette.';
    if (D.niv === 1) return D.n + ' ouvre la voie ' + de + ' : c\'est le premier pas, rien ne le précède.';
    if (D.niv === 2) return 'Pour ' + D.n.toLowerCase() + ', il faut avoir bu ' + DON[D.req].n.toLowerCase() + ' avant. C\'est le deuxième pas ' + de + '.';
    return D.n + ' est au bout d\'une voie ' + de + ', juste après ' + DON[D.req].n.toLowerCase() + '. Peu de gens vont jusque-là.';
  }
  if (F.heros) return 'On ne porte qu\'un don du Héros à la fois. En boire un autre efface le premier, comme une marée.';
  const op = 'Et prends garde : ce que ' + DON_LA[D.fam] + ' te donne, ' + DON_LA[F.op] + ' le défait. Boire l\'une dissout l\'autre, tout entière.';
  if (D.niv === 1) return op.replace(/^Et p/, 'P');
  const autre = DONS.find(o => o.fam === D.fam && o.niv === 2 && o.voie !== D.voie), mien = D.niv === 2 ? D : DON[D.req];
  return mien.n + ' et ' + autre.n.toLowerCase() + ' ne vont pas ensemble : qui prend l\'une voie ferme l\'autre' + (D.niv === 3 ? ', et tout ce qui la suit' : '') + '. ' + op;
}
// la prochaine chose à dire : sur ce qu'on a (formules, dons), puis leurs familles, puis le reste ; le Héros à part
function donsSavoirSuivant(b) {
  const moi = D => donA(D.id) || !!(P.formules || {})[D.id], famMoi = new Set(DONS.filter(moi).map(D => D.fam));
  const savant = b.nm.role === 'conteur' || b.nm.role === 'devin';
  const legende = savant && P.donsLegende !== profondeur();
  const H = legende ? DONS.filter(D => D.fam === 'heros') : [], tot = D => D.fam !== 'heros';
  const groupes = [DONS.filter(D => moi(D) && tot(D)), DONS.filter(D => famMoi.has(D.fam) && tot(D)), DONS.filter(tot), H];
  if (H.length && Math.random() < .3) groupes.unshift(H);   // une légende, de temps en temps (une par expédition)
  for (const G of groupes) for (const bit of [1, 2, 4]) {
    const L = G.filter(D => !donSait(D.id, bit) && (bit === 1 || donSait(D.id, 1))).sort((a, c) => a.niv - c.niv);
    if (L.length) { const D = L[Math.random() * Math.min(3, L.length) | 0]; return { D, bit }; }
  }
  return null;
}
function donsNomadeNoeud(b) {
  const fin = { t: 'Autre chose.', va: 'accueil' }, plus = { t: 'Dis-m\'en plus.', va: 'dons' };
  const rien = !Object.keys(P.savoirDons || {}).length && !Object.keys(P.formules || {}).length;
  const intro = rien ? 'Les dons ? Des élixirs qui changent quelqu\'un pour de bon : plus léger, plus dur, plus discret… Mais on ne les a pas tous : certains se défont l\'un l\'autre. ' : '';
  if ((b.nDons || 0) >= (DON_SAVANTS[b.nm.role] || 0)) return { dit: 'C\'est assez pour une halte. Bois, essaie, et reviens me voir à la prochaine : j\'en saurai peut-être plus.', choix: [fin] };
  b.nDons = (b.nDons || 0) + 1;
  const ouRestent = typeof NM !== 'undefined' && NM.moi ? DON_OU.filter((x, i) => !NM.moi.dits.includes('dn' + i)).length : 0;
  if (!rien && ouRestent && Math.random() < .3) return { dit: nmPioche('dn', DON_OU), choix: [plus, fin] };   // où les chercher
  const q = donsSavoirSuivant(b);
  if (!q) return { dit: 'Je t\'ai dit tout ce que je sais des dons. Le reste, c\'est à toi de le boire.', choix: [fin] };
  const L = [q.D.id];
  if (q.bit === 4 && q.D.niv >= 2 && q.D.fam !== 'heros') for (const o of DONS) if (o.fam === q.D.fam && o.niv === q.D.niv && o.id !== q.D.id) L.push(o.id);   // la fourche : les deux voies
  for (const id of L) apprendreDon(id, q.bit);
  if (q.D.fam === 'heros') P.donsLegende = profondeur();
  if (typeof say === 'function') say('les dons · ' + q.D.n + ' · ' + ['', 'ce qu\'il fait', 'sa place', '', 'ce qu\'il défait'][q.bit] + ' · à l\'arbre de la table d\'alchimie', 3);
  return { dit: intro + donPhrase(q.D, q.bit), choix: [plus, fin] };
}
if (typeof NM_DIALOGUES !== 'undefined') for (const r in NM_DIALOGUES) NM_DIALOGUES[r].dons = donsNomadeNoeud;

// ============================================================
//  (§206) LOT 3 : LE VENT, LA TERRE, L'OMBRE EN JEU
//  La touche W (sous le X, en AZERTY ; Z en QWERTY), ou le bouton RUÉE / ESQUIVE qui paraît alors sur téléphone :
//  - la RUÉE (Vent) : un bond à l'horizontale, dans la direction du pas (ou du regard), invulnérable le temps du
//    bond ; la RUÉE FANTÔME : deux d'affilée, qui traversent les bêtes et les étourdissent au passage ;
//  - l'ESQUIVE (Ombre) : une roulade, invulnérable un peu plus longtemps ; le CONTRE : un coup esquivé pendant la
//    roulade est rendu double à qui l'a porté, et le sonne.
//  Les deux ensemble (ce sont deux familles qui ne s'opposent pas) : en l'air ou en courant, la ruée ; sinon l'esquive.
//  Le TROISIÈME SAUT : un saut de plus en l'air. Le VOL PLANÉ : en tombant, SAUT maintenu, on plane (deux voiles
//  aux épaules, que les autres joueurs voient).
//  La PEAU DE PIERRE : −15 % de dégâts tant qu'on ne court pas. Le CHOC : retomber de haut frappe le sol (une onde
//  qui étourdit et blesse un peu) ; la FAILLE : la retombée ouvre en plus devant soi une faille de feu de quatre
//  cases, trois secondes : ce qui y passe brûle. Le COLOSSE : un quatrième cœur.
//  Le FONDU : une seconde et demie immobile dans l'ombre (la nuit, ou sous les arbres), et l'on disparaît ; on le
//  reste en marchant, pas en courant, ni en frappant, ni au grand jour. L'ASSASSIN : le premier coup sur une bête qui
//  ne vous a pas vu (ni alertée, ni en colère, ni en train d'attaquer) porte trois fois.
//  Tout suit la puissance du don (55 à 150 %).
// ============================================================
const DN = { q: false, tenu: false, ruee: null, roule: null, charges: 2, rechT: 0, cdT: 0, chocT: -9, failles: [], fondu: 0, invis: false, contreT: -9, plane: false, fantome: [] };
const donDeplace = () => donA('ruee') || donA('esquive');
const viesMax = () => 3 + (donA('colosse') ? 1 : 0);
function donsTouche() { if (donDeplace()) DN.q = true; }
const donCible = (b, moi) => b && b !== P && !b.dead && b.pv > 0 && !b.tame && !b.sp.batiment && !b.sp.pnj && !b.sp.illusion && !b.pnjSuit && !(b.sp.plante && b.pl && b.pl.port !== 'vive');
function donFrapper(b, deg, et, kb) {                    // un coup de don : il passe par les mêmes portes qu'un coup d'arme
  if (!donCible(b)) return;
  const d = degJoueur(deg, b); b.pv -= d; b.hit = .25; b.alarm = 1; if (typeof blesseParJoueur === 'function') blesseParJoueur(b);
  if (et) b.etourdi = Math.max(b.etourdi || 0, et);
  if (kb) { const a = Math.atan2(b.y - P.y, b.x - P.x); b.vx = (b.vx || 0) + Math.cos(a) * kb; b.vy = (b.vy || 0) + Math.sin(a) * kb; }
  burst(b.x, b.y, (b.z || 0) + .5, 8, '#ffd8a0');
  if (b.pv <= 0 && !b.dead) { mourirBete(b, 'chassé'); if (typeof butin === 'function') butin(b); }
}
// la direction : celle du pas, sinon celle du regard
function donDir() { const v = Math.hypot(P.vx, P.vy); return v > .5 ? Math.atan2(P.vy, P.vx) : (P.face ?? P.faceS ?? 0); }
function donsDepart() {                                   // la touche : la ruée ou l'esquive
  if (!donDeplace() || P.pv <= 0 || P.monture || DN.ruee || DN.roule) return;
  const court = t - (P.courseT || -9) < .25, veutRuee = donA('ruee') && (!donA('esquive') || !P.ground || court);
  if (veutRuee) {
    if (DN.charges <= 0) return;
    const k = donK('ruee'), fant = donA('rueefantome'), a = donDir();
    DN.charges--; DN.rechT = t + 1.1 / (.8 + .2 * Math.min(1.5, k));
    DN.ruee = { a, fin: t + .17, fant, vus: new Set() }; P.esquiveT = t + .22; P.fantome = fant ? t + .2 : 0;
    if (!P.ground) P.vz = Math.max(P.vz, .5);
    SON.jouer('elan', {}, P.x, P.y, P.z + 1);
    for (let i = 0; i < 10; i++) parts.push({ x: P.x, y: P.y, z: P.z + .3 + Math.random() * .8, vx: -Math.cos(a) * (2 + Math.random() * 3), vy: -Math.sin(a) * (2 + Math.random() * 3), vz: 0, g: 0, life: .35, age: 0, col: fant ? '#c8b4ff' : '#cfeaf6', tl: .05 });
  } else {
    if (t < DN.cdT) return;
    const k = donK('esquive'), a = donDir();
    DN.cdT = t + .9 / (.8 + .2 * Math.min(1.5, k));
    DN.roule = { a, fin: t + .32 }; P.esquiveT = t + .38; P.land = .35;
    SON.jouer('elan', {}, P.x, P.y, P.z + .5);
    for (let i = 0; i < 8; i++) parts.push({ x: P.x, y: P.y, z: P.z + .1, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: .5 + Math.random(), g: 3, life: .5, age: 0, col: '#9a8f86', tl: .07 });
  }
}
function donsVitesse(dt) {                                // (update) la ruée, la roulade : elles prennent la main sur le pas
  if (DN.ruee) { if (t > DN.ruee.fin) { P.vx *= .35; P.vy *= .35; DN.ruee = null; } else { const v = 17; P.vx = Math.cos(DN.ruee.a) * v; P.vy = Math.sin(DN.ruee.a) * v; P.face = DN.ruee.a; } }
  if (DN.roule) { if (t > DN.roule.fin) DN.roule = null; else { const v = 9; P.vx = Math.cos(DN.roule.a) * v; P.vy = Math.sin(DN.roule.a) * v; P.land = Math.max(P.land || 0, .25); } }
}
// (porterCoup) un coup qui arrive pendant la ruée ou la roulade : esquivé ; pendant la roulade, le contre
function donsEvite(b) {
  if (!DN.roule || !donA('contre') || !b || !b.sp || t - DN.contreT < .6) return;
  DN.contreT = t; const a = objet(P.equip.arme), k = donK('contre');
  donFrapper(b, (a && a.deg ? a.deg : .3) * 2 * Math.min(1.5, k), 1.2, 4);
  say('contre !', 1); SON.jouer('touche', { arme: P.equip.arme || 'gourdin' }, b.x, b.y, (b.z || 0) + .8);
}
// (update, au sol) retomber de haut : le choc, la faille
function donsAtterrir(vz) {
  if (!donA('choc') || vz > -7 || t - DN.chocT < .6 || P.monture) return;
  DN.chocT = t; const k = Math.min(1.5, donK('choc')), R = 2.4 + .3 * k;
  P.secousse = t; P.secousseK = .5; SON.jouer('pilon', {}, P.x, P.y, P.z);
  for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832; parts.push({ x: P.x, y: P.y, z: P.z + .05, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, vz: .6, g: 4, life: .45, age: 0, col: '#b8a88a', tl: .09 }); }
  for (const b of beasts) if (donCible(b) && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < R * R && Math.abs((b.z || 0) - P.z) < 1.6) donFrapper(b, .08 * k, .9 * k, 5);
  if (donA('faille')) {
    const a = donDir(), kf = Math.min(1.5, donK('faille'));
    DN.failles.push({ x: P.x + Math.cos(a) * .6, y: P.y + Math.sin(a) * .6, a, L: 4, fin: t + 3 * kf, z: P.z });
    SON.jouer('explosion', { vol: .5 }, P.x, P.y, P.z);
  }
}
const donOmbre = () => (typeof lumiere === 'function' && lumiere() < .45) || (typeof djIci === 'function' && djIci()) || donSousArbre();
function donSousArbre() {
  if (typeof Flo === 'undefined' || typeof ARBRES === 'undefined') return false;
  const x = P.x | 0, y = P.y | 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = Flo[(y + dy) * WS + x + dx]; if (k && ESP[k - 1] && ARBRES.has(ESP[k - 1].forme) && ESP[k - 1].h > 1.6) return true; }
  return false;
}
const donEffet = k => k === 'invisible' && DN.invis ? 1 : 0;   // (effet) le fondu
function donsCoupK(b) {                                   // (coupArme) l'assassin ; et frapper rompt le fondu
  DN.fondu = 0; DN.invis = false;
  if (!donA('assassin') || !b || b.tame || b.alarm > .05 || b.colere > 0 || b.as || b.traque) return 1;
  burst(b.x, b.y, (b.z || 0) + .8, 14, '#c8a0ff'); say('dans l\'ombre · coup triple', 1.2);
  return 1 + 2 * Math.min(1.25, donK('assassin'));
}
function donsMaj(dt) {
  if (typeof P === 'undefined' || !P.dons) return;
  // les charges de ruée
  const nmax = donA('rueefantome') ? 2 : 1;
  if (DN.charges < nmax && t > DN.rechT) { DN.charges++; DN.rechT = t + 1.1; }
  DN.charges = Math.min(DN.charges, nmax);
  if (DN.q) { DN.q = false; donsDepart(); }
  // la ruée fantôme : ce qu'on traverse est sonné
  if (DN.ruee && DN.ruee.fant) for (const b of beasts) if (donCible(b) && !DN.ruee.vus.has(b) && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < .9 && Math.abs((b.z || 0) - P.z) < 1.5) { DN.ruee.vus.add(b); donFrapper(b, .1 * Math.min(1.5, donK('rueefantome')), 1, 0); }
  // le vol plané
  DN.plane = false;
  // les failles : ce qui y passe brûle
  for (let i = DN.failles.length - 1; i >= 0; i--) {
    const F = DN.failles[i]; if (t > F.fin) { DN.failles.splice(i, 1); continue; }
    const ux = Math.cos(F.a), uy = Math.sin(F.a);
    for (const b of beasts) { if (!donCible(b)) continue; const dx = b.x - F.x, dy = b.y - F.y, s = dx * ux + dy * uy, n = Math.abs(-dx * uy + dy * ux);
      if (s > -.3 && s < F.L + .3 && n < .7 && Math.abs((b.z || 0) - F.z) < 1.5) { if (!(b.brule > t)) { b.alarm = 1; } b.brule = Math.max(b.brule || 0, t + 2); } }
    if (Math.random() < dt * 30) { const s = Math.random() * F.L; parts.push({ x: F.x + ux * s + (Math.random() - .5) * .3, y: F.y + uy * s + (Math.random() - .5) * .3, z: F.z + .05, vx: 0, vy: 0, vz: 1 + Math.random() * 1.5, g: -.3, life: .6, age: 0, col: Math.random() < .5 ? '#ff8a30' : '#ffd060', luit: 1, tl: .07 }); }
  }
  // le fondu
  const v = Math.hypot(P.vx, P.vy), court = t - (P.courseT || -9) < .25;
  if (donA('fondu') && !P.monture && P.pv > 0 && donOmbre() && !court) {
    if (v < .3 && P.ground) DN.fondu += dt; 
    const seuil = 1.5 / Math.min(1.5, Math.max(.55, donK('fondu')));
    if (!DN.invis && DN.fondu > seuil) { DN.invis = true; say('vous vous fondez dans l\'ombre', 1.6); for (let i = 0; i < 10; i++) parts.push({ x: P.x + (Math.random() - .5) * .6, y: P.y + (Math.random() - .5) * .6, z: P.z + Math.random() * 1.4, vx: 0, vy: 0, vz: .3, g: -.1, life: .9, age: 0, col: '#4a3e66', tl: .08 }); }
  } else { if (DN.invis) say('vous voilà visible', 1.2); DN.fondu = 0; DN.invis = false; }
  // le bouton du téléphone
  if (typeof document !== 'undefined') { const bt = document.getElementById('besq');
    if (bt) { const on = donDeplace(); if (bt.hidden === on) bt.hidden = !on;
      if (on) { const l = donA('ruee') && donA('esquive') ? 'RUÉE · ESQ.' : donA('ruee') ? 'RUÉE' : 'ESQUIVE', h = '<kbd>W</kbd>' + l; if (bt.dataset.l !== h) { bt.dataset.l = h; bt.innerHTML = h; }
        bt.classList.toggle('charge', donA('ruee') && !donA('esquive') ? DN.charges <= 0 : t < DN.cdT && DN.charges <= 0); } } }
}
// (update, en l'air) le vol plané : SAUT maintenu, en tombant
function donsPlane(dt, tenu) {
  if (!donA('plane') || P.ground || P.monture || !tenu || P.vz > -.5) return false;
  const k = Math.min(1.5, donK('plane')), lim = -1.9 + .5 * (k - 1);
  if (P.vz < lim) P.vz = lim;
  DN.plane = true;
  if (Math.random() < dt * 12) parts.push({ x: P.x + (Math.random() - .5) * .8, y: P.y + (Math.random() - .5) * .8, z: P.z + .9 + Math.random() * .4, vx: -P.vx * .3, vy: -P.vy * .3, vz: .3, g: 0, life: .5, age: 0, col: '#e6f4fa', tl: .04 });
  return true;
}
// (heroBones) les voiles du vol plané : deux pans clairs tendus des épaules ; et la ruée, une traîne
function donsHeros(J, hip, neck, B) {
  const plane = J === P ? DN.plane : !!(J && J.fx && J.fx.plane);
  if (!plane) return;
  const toile = [214, 236, 246], bord = [150, 196, 220];
  for (const s of [-1, 1]) {
    B.push({ a: v3.add(neck, [-.04, s * .12, -.03]), b: v3.add(neck, [-.2, s * .62, .06]), w: .34, h: .02, c: toile });
    B.push({ a: v3.add(neck, [-.2, s * .62, .06]), b: v3.add(neck, [-.28, s * .7, .02]), w: .2, h: .02, c: bord });
  }
}
// (sortDecor) la faille, au sol : des fentes de feu
function donsDecor(ex, ey, r) {
  const B = [];
  for (const F of DN.failles) { if ((F.x - ex) ** 2 + (F.y - ey) ** 2 > r * r) continue;
    const ux = Math.cos(F.a), uy = Math.sin(F.a), vie = Math.min(1, (F.fin - t) / .6);
    for (let i = 0; i < 7; i++) { const s0 = i * F.L / 7, s1 = s0 + F.L / 7 * 1.02, o0 = ((i * 37) % 5 - 2) * .04, o1 = (((i + 1) * 37) % 5 - 2) * .04;   // une fente en zigzag
      const A = [F.x + ux * s0 - uy * o0, F.y + uy * s0 + ux * o0], Bb = [F.x + ux * s1 - uy * o1, F.y + uy * s1 + ux * o1];
      B.push({ a: [A[0], A[1], F.z + .03], b: [Bb[0], Bb[1], F.z + .03], w: .3 * vie + .06, h: .05, c: [52, 28, 22] });                       // ses lèvres noircies
      B.push({ a: [A[0], A[1], F.z + .07], b: [Bb[0], Bb[1], F.z + .07], w: .1 * vie + .03, h: .08, c: [255, 110 + (i % 3) * 40, 40], lum: 1 }); } }   // le feu au fond
  return B;
}
