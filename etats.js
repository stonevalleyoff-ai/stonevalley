// Stone Valley — LES ÉTATS D'ÎLE (etats.js)
// Un état est un fléau qui tombe sur une île au hasard de sa graine : un filtre sur tout ce qu'on y
// voit, et ses règles. Le premier est le KORLAZ : un élément inconnu qui ronge la roche et en fait
// monter une spore neurotoxique. Qui reste longtemps dans les spores, ou récolte la roche rongée,
// est infecté — et le reste, d'île en île, tant qu'on ne lui a pas injecté le remède (une recette
// légendaire de la cuisine, à quatre ingrédients). L'infecté voit ce qui n'est pas : une brume
// noire qui monte, de petits êtres décharnés qui le regardent de loin (et s'approchent quand il
// leur tourne le dos), des blessures qui s'ouvrent de nulle part, des silhouettes noires qui
// surgissent et lui fondent dessus. Les blessures et les coups sont réels, mais légers. Tout vient
// au hasard, de plus en plus souvent à mesure que l'infection dure.
// Le jeu (index.html) appelle, s'ils existent :
//   etatsInit()       au démarrage : le remède dans les recettes ;
//   etatsIle()        à chaque île : l'état tiré, la roche rongée peinte, le mycélium posé ;
//   majEtats(dt)      à chaque image : spores, exposition, infection, visions, le filtre ;
//   etatsRecolte(nd)  une récolte (sur la roche rongée, elle infecte) ;
//   etatsHud()        l'étiquette du HUD ;
//   guerirKorlaz()    le sérum injecté ;
//   majIllusion, osIllusion : les visions, qui vivent parmi les bêtes (sp.illusion).
// ETATS_SPEC est versé dans SPEC par le jeu.

const ETATS_SPEC = [
  { id: 'decharne', n: 'Décharné', corps: 'decharne', illusion: 1, diet: 'c', sz: .58, spd: 1, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [152, 148, 142], dark: [70, 64, 64], leg: [152, 148, 142], oeil: [8, 6, 6], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: 'il vous regarde', grimpe: 0 },
  { id: 'ombre', n: 'Silhouette', corps: 'ombre', illusion: 1, diet: 'c', sz: 1.3, spd: 1, vue: 0, peur: 0, herd: 0, cap: 0, mat: 9999,
    shell: [12, 10, 14], dark: [4, 4, 6], leg: [12, 10, 14], oeil: [255, 240, 230], bio: [], dur: 1, lien: 0, chasse: [], travail: {}, metier: 'elle vient', grimpe: 0 },
];
const ETAT = { id: null, cases: null, annonce: false, brume: 0, flash: 0, rouge: 0, visage: 0, inv: 0, yeux: [], sang: [], souffleT: 0 };
const KORLAZ_BIO = 21;
const KORLAZ_SEUIL = 30;                                  // secondes de spores (pondérées) avant l'infection
function etatGraine(g, niv) {                             // une île sur six environ, dès l'exploration 6
  if (!Number.isInteger(g) || niv < 6) return null;
  let n = (g ^ 0x6b0f1a) >>> 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) % 100 < 17 ? 'korlaz' : null;
}
function etatsInit() {
  if (typeof REMARQUABLES !== 'undefined' && !REMARQUABLES.some(r => r.id === 'serum'))
    REMARQUABLES.push({ id: 'serum', n: 'Sérum de clairvoyance',
      indice: 'ce qui pousse sur la roche rongée, la mousse des nuages, le nectar des oglodons, une goutte de sève',
      ok: ids => ids.length === 4 && ['p_mycelium', 'p_mousse', 'nectar', 'p_seve'].every(id => ids.includes(id)) });
  if (typeof CONSERVE !== 'undefined') CONSERVE['r:serum'] = [1, 1];          // une dose, qui se garde
}
// ---------- l'île : la roche rongée, par plaques ----------
// Le Korlaz change le sol en place (Bio). Un second chargement de l'île (l'île remise à zéro) partait
// donc d'un sol déjà rongé, et son peuplement ne ressemblait plus à celui d'un joueur qui arrive :
// loadWorld rend le sol d'origine avant de peupler, puis etatsIle le ronge de nouveau.
function etatsSolDOrigine() {
  if (ETAT.bioAvant) for (const [i, b] of ETAT.bioAvant) Bio[i] = b;
  ETAT.bioAvant = null;
}
function etatsIle() {
  etatsSolDOrigine();
  ETAT.id = etatGraine(SEED, profondeur()); ETAT.cases = null; ETAT.annonce = false;
  if (ETAT.id !== 'korlaz') return;
  let s = (SEED ^ 0x9e3779b9) >>> 0 || 1; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  const C = ETAT.cases = new Uint8Array(WS * WS), roc = [], avant = ETAT.bioAvant = new Map();
  for (let i = 0; i < WS * WS; i++) if (Bio[i] === 5 || Bio[i] === 6) roc.push(i);
  if (!roc.length) { ETAT.id = null; return; }
  const n = 6 + (r() * 6 | 0);
  for (let k = 0; k < n; k++) {
    const c = roc[r() * roc.length | 0], cx = c % WS, cy = (c / WS) | 0, R = 4 + r() * 6;
    for (let dy = -R | 0; dy <= R; dy++) for (let dx = -R | 0; dx <= R; dx++) {
      const x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x >= WS - 1 || y >= WS - 1) continue;
      const i = y * WS + x, d = Math.hypot(dx, dy) / R;
      if ((Bio[i] === 5 || Bio[i] === 6) && d < .7 + r() * .45) { C[i] = 1; avant.set(i, Bio[i]); Bio[i] = KORLAZ_BIO; }
    }
  }
  const m = ESP.findIndex(e => e.id === 'mycelium'), x = ESP.findIndex(e => e.id === 'excroissance');   // le mycélium pâle, rare ; les excroissances, partout
  for (let i = 0; i < WS * WS; i++) if (C[i] && !Flo[i] && !PlT[i]) { const q = r(); if (m >= 0 && q < .02) Flo[i] = m + 1; else if (x >= 0 && q < .11) Flo[i] = x + 1; }
}
const roche = (x, y) => { x |= 0; y |= 0; return !!ETAT.cases && x >= 0 && y >= 0 && x < WS && y < WS && ETAT.cases[y * WS + x] === 1; };
// ---------- l'infection ----------
function infecter(pourquoi) {
  if (P.korlaz) return;
  P.korlaz = { duree: 0, prochain: t + 12 + Math.random() * 10 }; P.korlazExpo = 0;
  say('Vous êtes infecté par le Korlaz · ' + pourquoi + ' · seul un sérum vous en délivrera', 5);
  SON.jouer('stridence'); ETAT.flash = 1;
}
function etatsRecolte(nd) {
  if (ETAT.id !== 'korlaz' || !nd || P.korlaz) return;
  const x = nd.i % WS, y = (nd.i / WS) | 0;
  if (roche(x, y) || roche(x + 1, y) || roche(x - 1, y) || roche(x, y + 1) || roche(x, y - 1)) {
    P.korlazExpo = (P.korlazExpo || 0) + 9;                // gratter la roche rongée : un nuage en plein visage
    burst(x + .5, y + .5, sol(x + .5, y + .5) + .6, 12, '#2a2e22');
    if (Math.random() < .25 || P.korlazExpo > KORLAZ_SEUIL) infecter('la roche rongée vous a craché ses spores');
    else say('des spores noires · ' + Math.round(Math.min(1, P.korlazExpo / KORLAZ_SEUIL) * 100) + ' %', 1.4);
  }
}
function guerirKorlaz() {
  if (!P.korlaz) { say('vous n\'êtes pas infecté · le sérum vous éclaircit la vue', 2); return; }
  P.korlaz = null; P.korlazExpo = 0; ETAT.brume = 0;
  for (const b of beasts) if (b.sp.illusion) dissiper(b);
  say('Le sérum brûle dans vos veines… et la brume se lève · guéri du Korlaz', 4); SON.jouer('ramasse');
}
function etatsHud() {
  if (P.korlaz) return '<span class="etiq korlaz">infecté · Korlaz</span>';
  if ((P.korlazExpo || 0) > .5) return '<span class="etiq korlaz">spores ' + Math.round(Math.min(1, P.korlazExpo / KORLAZ_SEUIL) * 100) + ' %</span>';
  return '';
}
// ---------- les visions ----------
function poserVision(id, angle, dist) {
  const sp = specById[id]; if (!sp) return null;
  for (let k = 0; k < 14; k++) {
    const a = angle + (Math.random() - .5) * .8, d = dist + (Math.random() - .5) * 2, x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 2 || y < 2 || x > WS - 3 || y > WS - 3 || hAt(x | 0, y | 0) <= SEA || Math.abs(sol(x, y) - P.z) > 3) continue;
    const b = naitre(sp, x, y); b.age = 1e6; b.ech = .25; b.pv = 1; b.t = 0; b.z = sol(x, y); b.vie = 10; b.jx = b.jy = 0;
    b.dir = b.dirT = Math.atan2(P.y - y, P.x - x); beasts.push(b); return b;
  }
  return null;
}
function dissiper(b, chuchote) {
  if (b.dead) return;
  b.dead = 1;
  for (let k = 0; k < 22; k++) parts.push({ x: b.x, y: b.y, z: b.z + Math.random() * 1.8 * b.sp.sz, vx: (Math.random() - .5) * 1.4, vy: (Math.random() - .5) * 1.4, vz: .3 + Math.random() * 1.2,
    g: -.7, life: 1 + Math.random() * .8, age: 0, col: Math.random() < .75 ? '#070609' : '#2a2630', tl: .16 });
  if (chuchote) SON.jouer('murmure', {}, b.x, b.y, b.z + 1);
}
function vision(I) {                                     // une vision tirée au hasard ; plus forte quand l'infection dure
  const f = P.faceS ?? P.face ?? 0, k = Math.random(), regards = beasts.filter(b => b.sp.illusion && !b.dead).length;
  if (k < .26) { ETAT.brume = Math.max(ETAT.brume, 7 + Math.random() * 7 * (1 + I)); SON.jouer('murmure'); for (let j = 0; j < 3 + I * 5; j++) oeil(); }
  else if (k < .54 && regards < 6) {                      // ils vous regardent, de loin
    const n = 1 + (Math.random() * (1 + I * 3) | 0);
    for (let j = 0; j < n; j++) { const b = poserVision('decharne', f + (Math.random() - .5) * 1.7, 9 + Math.random() * 7); if (b) { b.vie = 10 + Math.random() * 9; b.etat = 'regarder'; } }
    SON.jouer('respiration');
  } else if (k < .72) {                                   // une blessure, de nulle part
    porterCoup({ x: P.x + Math.cos(f) * .2, y: P.y + Math.sin(f) * .2, sp: {} }, P, .025 + I * .02);
    ETAT.rouge = 1; burst(P.x, P.y, P.z + .9, 12, '#a01818');
    for (let j = 0; j < 3 + (Math.random() * 3 | 0); j++) ETAT.sang.push({ x: Math.random(), y: 0, l: .05 + Math.random() * .25, v: .08 + Math.random() * .1, a: 1 });
    say(['une entaille, de nulle part', 'quelque chose vous a griffé', 'du sang… mais rien autour'][Math.random() * 3 | 0], 1.8);
  } else if (k < .84) { ETAT.visage = 1; SON.jouer('bourdon'); }   // un visage dans la brume
  else {                                                  // une silhouette surgit, et fond sur vous
    const n = 1 + (I > .4 && Math.random() < .5 ? 1 : 0);
    for (let j = 0; j < n; j++) { const b = poserVision('ombre', f + Math.PI + (Math.random() - .5) * 2.4, 6.5 + Math.random() * 3); if (b) { b.vie = 8; b.etat = 'surgir'; } }
    SON.jouer('stridence'); SON.jouer('bourdon');
  }
}
function oeil() { ETAT.yeux.push({ x: Math.random() < .5 ? .02 + Math.random() * .22 : .76 + Math.random() * .22, y: .1 + Math.random() * .8, fin: t + 1.4 + Math.random() * 2.2, cl: t + .4 + Math.random() * 1.6, e: .006 + Math.random() * .006 }); }
function majIllusion(b, dt) {
  b.t += dt; b.ech = Math.min(1, (b.ech ?? .25) + dt * 1.1);
  if (!P.korlaz || b.hit > 0) return dissiper(b, b.hit > 0);
  b.vie -= dt; const dx = P.x - b.x, dy = P.y - b.y, dJ = Math.hypot(dx, dy) || 1;
  b.dir = b.dirT = Math.atan2(dy, dx);
  if (b.sp.corps === 'decharne') {
    const vu = Math.cos((P.faceS ?? 0) - Math.atan2(b.y - P.y, b.x - P.x)) > .35;   // vous le regardez ?
    if (dJ < 3.6 || b.vie <= 0) return dissiper(b, true);
    if (!vu && dJ > 4.2) {                                // dos tourné : il avance — par à-coups, jamais sous vos yeux
      b.pas = (b.pas || 0) + dt;
      if (b.pas > .45) { b.pas = 0; const l = .5 + Math.random() * .4; b.x += dx / dJ * l; b.y += dy / dJ * l; b.ticT = t; b.tic = (Math.random() - .5) * 1.2; }
      b.etat = 'approcher';
    } else b.etat = 'regarder';
    if (Math.random() < dt * .25) { b.ticT = t; b.tic = (Math.random() - .5) * 1.6; }
    if (dJ < 7 && Math.random() < dt * .2) SON.jouer('respiration', {}, b.x, b.y, b.z + .8);
    b.bouche = b.boucheT > t ? 1 : 0; if (Math.random() < dt * .08) b.boucheT = t + .5 + Math.random();
  } else {
    if (b.etat === 'surgir') {                            // elle est là, tordue, et tremble
      b.jx = (Math.random() - .5) * .08; b.jy = (Math.random() - .5) * .08;
      if (Math.random() < dt * 24) parts.push({ x: b.x, y: b.y, z: b.z + Math.random() * .8, vx: (Math.random() - .5), vy: (Math.random() - .5), vz: .6, g: -.3, life: .7, age: 0, col: '#070609', tl: .14 });
      if (b.t > 1.1) { b.etat = 'ruer'; b.jx = b.jy = 0; }
    } else {
      b.x += dx / dJ * 7 * dt; b.y += dy / dJ * 7 * dt; b.vit = 7; b.etat = 'ruer';
      for (let j = 0; j < 2; j++) if (Math.random() < dt * 40) parts.push({ x: b.x, y: b.y, z: b.z + Math.random() * 2.4, vx: -dx / dJ * 1.5, vy: -dy / dJ * 1.5, vz: .2, g: 0, life: .5, age: 0, col: '#070609', tl: .16 });
      if (dJ < 1.1) {
        porterCoup({ x: b.x, y: b.y, sp: {} }, P, .05 + Math.min(1, P.korlaz.duree / 900) * .03); P.vx += dx / dJ * 4; P.vy += dy / dJ * 4;
        ETAT.rouge = .9; ETAT.inv = .09; ETAT.flash = .4;
        return dissiper(b, true);
      }
    }
    if (b.vie <= 0) return dissiper(b);
  }
  b.gph = (b.gph || 0) + dt * (b.vit || 0) * .9; b.z = sol(b.x, b.y); b.vx = b.vy = 0;
}
// ---------- les visions, en volumes ----------
// Le DÉCHARNÉ : un enfant famélique, trop grand de tête. Le crâne nu, les tempes creuses, deux orbites
// noires énormes où une pupille minuscule vous suit, une fente de bouche qui s'ouvre sans un son sur
// de petites dents ; un cou trop long, les vertèbres et quatre paires de côtes sous la peau, le
// ventre rentré, des bras jusqu'aux genoux et des doigts trop longs, des genoux noueux, de longs
// pieds ; des veines sombres sur les membres. Il penche la tête, lentement — puis d'un coup.
// LA SILHOUETTE : noire, près de trois mètres, trop mince, voûtée ; une tête petite et longue sans
// rien d'autre que deux points blancs ; des bras à trois articulations, des doigts en aiguilles ;
// des jambes qui finissent en fumée. Surgie, elle tremble sur place, la tête couchée sur l'épaule ;
// ruée, elle se couche presque à l'horizontale, les aiguilles en avant.
function osIllusion(f) {
  const B = [], add = (a, b, w, h, c, luit) => B.push({ a, b, w, h, c, luit });
  const A3 = (p, ...q) => q.reduce((r, [v, k]) => [r[0] + v[0] * k, r[1] + v[1] * k, r[2] + v[2] * k], p.slice());
  const ph = (f.gph || 0) * 6.2832, v = Math.min(1, (f.vit || 0) / 3);
  const tic = f.ticT != null && t - f.ticT < .3 ? f.tic * (1 - (t - f.ticT) / .3) : 0;
  if (f.sp.corps === 'decharne') {
    const peau = [166, 168, 156], creux = [96, 94, 90], os = [214, 214, 204], noir = [4, 3, 4], veine = [78, 72, 84], dent = [226, 222, 210];
    const tilt = Math.sin(f.t * .6) * .3 + tic, hz = 1.02 + Math.sin(f.t * 1.3) * .01, bouche = f.bouche ? .5 + Math.sin(t * 12) * .1 : 0;
    // le bassin, la colonne, les côtes, le ventre rentré
    add([0, -.11, hz], [0, .11, hz], .1, .1, creux);
    const sp = [[0, 0, hz]]; for (let k = 1; k <= 5; k++) sp.push([sp[k - 1][0] + .04, 0, sp[k - 1][2] + .14]);
    for (let k = 0; k < 5; k++) { add(sp[k], sp[k + 1], .09, .09, peau); add([sp[k + 1][0] - .05, 0, sp[k + 1][2]], [sp[k + 1][0] - .08, 0, sp[k + 1][2]], .035, .03, os); }
    for (let k = 1; k <= 4; k++) for (const s of [-1, 1]) {
      const V = sp[k], r = .16 - Math.abs(k - 2.5) * .02;
      add([V[0] - .02, 0, V[2]], [V[0] + .02, s * r, V[2] - .02], .025, .025, os); add([V[0] + .02, s * r, V[2] - .02], [V[0] + .11, s * r * .5, V[2] - .05], .022, .022, os);
    }
    add([sp[0][0] + .04, 0, hz + .08], [sp[2][0] + .02, 0, sp[2][2] - .02], .14, .05, creux);          // le ventre rentré
    add([sp[1][0] + .02, 0, sp[1][2]], [sp[4][0] + .03, 0, sp[4][2]], .2, .13, peau);                // la peau tendue
    // le cou trop long, le crâne nu
    const N0 = A3(sp[5], [[1, 0, 0], .03]), ct = Math.cos(tilt), st = Math.sin(tilt);
    const N = [N0[0] + .04, st * .06, N0[2] + .16], H = [N[0] + .12, st * .16, N[2] + .22 * ct + .02];
    add(N0, N, .07, .07, peau); add(N, H, .09, .09, creux);
    for (let k = 0; k < 3; k++) add([N0[0] + (N[0] - N0[0]) * k / 3 - .02, (N[1]) * k / 3, N0[2] + (N[2] - N0[2]) * k / 3], [N0[0] + (N[0] - N0[0]) * k / 3 - .045, N[1] * k / 3, N0[2] + (N[2] - N0[2]) * k / 3], .03, .025, os);   // les vertèbres du cou
    const hs = [-st * .4, ct, 0];                                                                  // le côté de la tête, penchée
    add([H[0] - .18, H[1], H[2]], [H[0] + .18, H[1], H[2] + .04], .5, .5, peau);                   // le crâne
    add([H[0] - .14, H[1], H[2] + .18], [H[0] + .12, H[1], H[2] + .2], .36, .14, peau);           // le sommet
    for (const s of [-1, 1]) {
      add(A3([H[0] - .02, H[1], H[2] + .06], [hs, s * .26]), A3([H[0] + .1, H[1], H[2] + .06], [hs, s * .26]), .06, .16, creux);   // la tempe creuse
      add(A3([H[0] + .24, H[1], H[2] + .05], [hs, s * .12]), A3([H[0] + .27, H[1], H[2] + .05], [hs, s * .12]), .17, .2, noir);   // l'orbite, un trou
      add(A3([H[0] + .275, H[1], H[2] + .06], [hs, s * .12]), A3([H[0] + .285, H[1], H[2] + .06], [hs, s * .12]), .022, .022, [250, 248, 240], true);   // la pupille
      add(A3([H[0] + .2, H[1], H[2] - .1], [hs, s * .07]), A3([H[0] + .24, H[1], H[2] - .17], [hs, s * .05]), .05, .06, peau);   // la mâchoire, étroite
    }
    add([H[0] + .25, H[1], H[2] - .1 - bouche * .06], [H[0] + .27, H[1], H[2] - .1 - bouche * .06], .14, .02 + bouche * .1, bouche ? noir : creux);   // la bouche : une fente, qui s'ouvre
    if (bouche) for (let k = -2; k <= 2; k++) add([H[0] + .265, H[1] + k * .028, H[2] - .085], [H[0] + .265, H[1] + k * .028, H[2] - .105], .012, .02, dent);
    // les bras jusqu'aux genoux, les doigts trop longs
    for (const s of [-1, 1]) {
      const Sh = [sp[4][0], s * .15, sp[4][2]], El = [Sh[0] + .05 + Math.sin(ph + s) * .08 * v, s * .2, Sh[2] - .34], M = [El[0] + .1, s * .22, El[2] - .36];
      add(Sh, El, .055, .055, peau); add(El, M, .045, .045, peau);
      add([Sh[0] + .01, s * .17, Sh[2] - .1], [El[0] - .01, s * .21, El[2] + .05], .012, .012, veine);   // une veine
      add([El[0] + .03, s * .2, El[2] - .03], [M[0] - .02, s * .22, M[2] + .05], .012, .012, veine);
      for (let k = 0; k < 4; k++) { const q = (k - 1.5) * .03, p1 = [M[0] + .05, M[1] + q, M[2] - .12], p2 = [p1[0] + .02, p1[1] + q * .3, p1[2] - .11];
        add(M, p1, .016, .016, peau); add(p1, p2, .013, .013, creux); }
    }
    // les jambes : genoux noueux, longs pieds
    for (const s of [-1, 1]) {
      const hip = [0, s * .08, hz], p = ph + (s > 0 ? 0 : Math.PI), F = [Math.sin(p) * .2 * v, s * .1, Math.max(0, Math.cos(p)) * .1 * v];
      const K = [(hip[0] + F[0]) / 2 + .1, s * .09, hz * .52];
      add(hip, K, .06, .06, peau); add([K[0], K[1], K[2] + .02], [K[0] + .03, K[1], K[2] - .02], .085, .085, os); add(K, F, .05, .05, peau);
      add([K[0] - .01, s * .1, K[2] - .05], [F[0] + .01, s * .1, F[2] + .1], .012, .012, veine);
      add(F, [F[0] + .17, F[1], F[2]], .07, .03, creux); for (const q of [-.02, 0, .02]) add([F[0] + .17, F[1] + q, F[2]], [F[0] + .22, F[1] + q, F[2]], .014, .014, peau);
    }
  } else {
    const noir = [9, 7, 11], fume = [20, 17, 24], rue = f.etat === 'ruer', pen = rue ? 1.1 : .22, hz = 1.2, jx = f.jx || 0, jy = f.jy || 0;
    const sn = Math.sin(pen), cs = Math.cos(pen);
    const Pv = [jx, jy, hz], T = [jx + sn * 1.05, jy, hz + cs * 1.05];
    add(Pv, T, .22, .3, noir);                                                                   // le tronc, trop mince
    add([Pv[0] - .05, jy, hz + .1], [T[0] - .1, jy, T[2] - .1], .12, .16, noir);                 // le dos voûté
    const inc = rue ? 0 : 1.3 + Math.sin(f.t * 7) * .06;                                         // la tête couchée sur l'épaule
    const H = [T[0] + sn * .1 + .05, jy + Math.sin(inc) * .18, T[2] + cs * .12 + Math.cos(inc) * .12];
    add(T, H, .1, .14, noir); add([H[0] - .04, H[1], H[2]], [H[0] + .26, H[1] - Math.sin(inc) * .08, H[2] + .1 - Math.cos(inc) * .02], .14, .2, noir);   // la tête, petite et longue
    for (const s of [-1, 1]) {
      add([H[0] + .2, H[1] + s * .04, H[2] + .06], [H[0] + .22, H[1] + s * .04, H[2] + .06], .022, .022, [255, 246, 236], true);   // les deux points
      const Sh = [T[0], jy + s * .18, T[2] - .06];
      const M1 = rue ? [Sh[0] + .55, jy + s * .3, Sh[2] - .15] : [Sh[0] - .05 + s * .04, jy + s * .26, Sh[2] - .55], M2 = rue ? [M1[0] + .55, jy + s * .26, M1[2] - .1] : [M1[0] + .1, jy + s * .3, M1[2] - .55], M3 = rue ? [M2[0] + .5, jy + s * .22, M2[2] - .05] : [M2[0] + .15 * (s > 0 ? 1 : .3), jy + s * .28, M2[2] - .5];
      add(Sh, M1, .07, .07, noir); add(M1, M2, .06, .06, noir); add(M2, M3, .05, .05, noir);     // trois articulations
      for (let k = 0; k < 5; k++) { const q = (k - 2) * .035, d = rue ? [.38, q, -.05] : [.1, q, -.38]; add(M3, [M3[0] + d[0], M3[1] + d[1], M3[2] + d[2]], .012, .012, noir); }   // les aiguilles
    }
    for (const s of [-1, 1]) {                                                                     // des jambes qui finissent en fumée
      const hip = [jx, jy + s * .1, hz], p = ph + (s > 0 ? 0 : Math.PI), F = [jx + Math.sin(p) * .7 * v - (rue ? .3 : 0), jy + s * .14, Math.max(0, Math.cos(p)) * .35 * v];
      const K = [(hip[0] + F[0]) / 2 - .15, hip[1], hz * .5];
      add(hip, K, .08, .08, noir); add(K, [F[0], F[1], F[2] + .25], .06, .06, noir);
      for (let j = 0; j < 3; j++) add([F[0] + Math.sin(f.t * 9 + j + s) * .06, F[1], F[2] + .25 - j * .08], [F[0] + Math.sin(f.t * 9 + j + s + 1) * .1, F[1] + s * .05, F[2] + .1 - j * .08], .05 + j * .02, .03, fume);
    }
  }
  return B;
}
// ---------- à chaque image ----------
let filtreEl = null, filtreG = null, filtreCss = '';
function majEtats(dt) {
  const ici = ETAT.id === 'korlaz';
  if (ici && !ETAT.annonce) { ETAT.annonce = true; say('Korlaz · la roche de cette île est rongée · ne restez pas dans ses spores', 5); }
  if (ici) {
    let n = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (roche(P.x + dx, P.y + dy)) n++;
    for (let k = 0; k < 4; k++) { const x = P.x + (Math.random() - .5) * 18, y = P.y + (Math.random() - .5) * 18;   // les spores, lentes, luisantes
      if (roche(x, y) && Math.random() < dt * 30) parts.push({ x, y, z: sol(x, y) + .1, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, vz: .25 + Math.random() * .35, g: -.12, life: 3 + Math.random(), age: 0, col: Math.random() < .6 ? '#161a12' : '#8ab048', luit: Math.random() < .4, tl: .07 + Math.random() * .05 }); }
    if (!P.korlaz) {
      if (n > 0 && P.pv > 0 && !(typeof effet === 'function' && effet('antidote'))) P.korlazExpo = (P.korlazExpo || 0) + dt * (.35 + n / 49 * 2.5);   // l'antidote : les spores n'y font rien
      else P.korlazExpo = Math.max(0, (P.korlazExpo || 0) - dt * .25);
      if (P.korlazExpo >= KORLAZ_SEUIL) infecter('vous êtes resté trop longtemps dans les spores');
    }
  }
  const K = P.korlaz;
  if (K && P.pv > 0) {
    K.duree += dt;
    const I = Math.min(1, K.duree / 900);
    if (t > K.prochain) { vision(I); K.prochain = t + (18 + Math.random() * 30) * (1 - .55 * I); }
    if (Math.random() < dt * (.02 + I * .04)) SON.jouer('murmure');
    if (Math.random() < dt * (.01 + I * .03)) ETAT.flash = .6;
    if (Math.random() < dt * (.08 + I * .2)) oeil();                                      // des yeux, au bord du noir
  }
  ETAT.brume = Math.max(0, ETAT.brume - dt); ETAT.flash = Math.max(0, ETAT.flash - dt * 6); ETAT.rouge = Math.max(0, ETAT.rouge - dt * 1.6);
  ETAT.visage = Math.max(0, ETAT.visage - dt * 1.2); ETAT.inv = Math.max(0, ETAT.inv - dt);
  ETAT.yeux = ETAT.yeux.filter(o => o.fin > t); for (const g of ETAT.sang) { g.y += g.v * dt; g.a -= dt * .25; } ETAT.sang = ETAT.sang.filter(g => g.a > 0);
  dessinerFiltre(ici, K);
}
function dessinerFiltre(ici, K) {
  const actif = ici || K || ETAT.flash || ETAT.rouge || ETAT.visage || ETAT.sang.length;
  // le filtre sur l'image même : la couleur s'en va, le contraste monte ; une inversion d'un éclair quand elle frappe
  const css = ETAT.inv > 0 ? 'invert(1) contrast(1.3)' : K ? `saturate(${(.72 - Math.min(1, ETAT.brume / 3) * .3).toFixed(2)}) contrast(1.12) brightness(.9)` : ici ? 'saturate(.85) sepia(.12)' : '';
  if (css !== filtreCss) { filtreCss = css; for (const id of ['c', 'c3']) { const e = document.getElementById(id); if (e) e.style.filter = css; } }
  if (!actif) { if (filtreEl && filtreEl.style.display !== 'none') filtreEl.style.display = 'none'; return; }
  if (!filtreEl) {
    filtreEl = document.createElement('canvas'); filtreEl.id = 'etatFiltre';
    filtreEl.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    document.body.appendChild(filtreEl); filtreG = filtreEl.getContext('2d');
  }
  filtreEl.style.display = '';
  const W = Math.max(1, innerWidth / 2 | 0), H = Math.max(1, innerHeight / 2 | 0);
  if (filtreEl.width !== W || filtreEl.height !== H) { filtreEl.width = W; filtreEl.height = H; }
  const g = filtreG, R = Math.hypot(W, H) / 2;
  g.clearRect(0, 0, W, H);
  const vign = (a, c, r0 = .25) => { const gr = g.createRadialGradient(W / 2, H / 2, R * r0, W / 2, H / 2, R); gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(1, `rgba(${c},${a})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); };
  if (ici) vign(.3, '22,30,18');
  if (K) {
    const I = Math.min(1, K.duree / 900), br = Math.min(1, ETAT.brume / 3);
    vign(.38 + I * .2 + br * .42 + Math.sin(t * .4) * .06, '3,2,5', .2);                 // la brume noire qui respire
    for (let k = 0; k < 6 + (br * 8 | 0); k++) {                                          // des volutes
      const x = W * (.5 + .55 * Math.sin(t * .07 * (1 + k * .13) + k * 2.1)), y = H * (.5 + .5 * Math.cos(t * .05 * (1 + k * .17) + k * 1.3)), r = R * (.25 + .2 * Math.sin(t * .3 + k));
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(3,2,5,${.12 + I * .1 + br * .25})`); gr.addColorStop(1, 'rgba(3,2,5,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    g.lineCap = 'round';                                                                   // des vrilles qui rentrent par les bords
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * 6.2832 + t * .03, x0 = W / 2 + Math.cos(a) * R, y0 = H / 2 + Math.sin(a) * R, l = R * (.35 + br * .4) * (.7 + .3 * Math.sin(t * .5 + k * 1.7));
      const x1 = x0 - Math.cos(a) * l + Math.sin(t * .4 + k) * 40, y1 = y0 - Math.sin(a) * l + Math.cos(t * .33 + k) * 40;
      g.strokeStyle = `rgba(2,1,4,${.28 + br * .3})`; g.lineWidth = 6 + br * 10; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 - Math.cos(a + .8) * l * .6, y0 - Math.sin(a + .8) * l * .6, x1, y1); g.stroke();
    }
    for (const o of ETAT.yeux) {                                                            // des yeux dans le noir, qui clignent
      if (t < o.cl && t > o.cl - .12) continue;
      const x = o.x * W, y = o.y * H, e = o.e * W, a = Math.min(1, (o.fin - t) / .5);
      for (const s of [-1, 1]) { const gr = g.createRadialGradient(x + s * e, y, 0, x + s * e, y, e * .9); gr.addColorStop(0, `rgba(255,250,240,${.9 * a})`); gr.addColorStop(.3, `rgba(255,250,240,${.5 * a})`); gr.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x + s * e, y, e * .9, 0, 6.283); g.fill(); }
    }
  }
  if (ETAT.visage > 0) {                                                                    // un visage, immense, dans la brume
    const a = Math.sin(Math.min(1, ETAT.visage) * Math.PI) * .55, cx = W * .5, cy = H * .42, r = R * .5;
    for (const s of [-1, 1]) { const gr = g.createRadialGradient(cx + s * r * .3, cy - r * .1, 0, cx + s * r * .3, cy - r * .1, r * .3); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    const gm = g.createRadialGradient(cx, cy + r * .45, 0, cx, cy + r * .45, r * .32); gm.addColorStop(0, `rgba(0,0,0,${a * .9})`); gm.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gm; g.fillRect(0, 0, W, H);
  }
  for (const s of ETAT.sang) {                                                              // le sang qui coule du haut de l'image
    g.strokeStyle = `rgba(140,10,16,${Math.min(1, s.a) * .8})`; g.lineWidth = 2.5; g.beginPath(); g.moveTo(s.x * W, 0); g.lineTo(s.x * W, Math.min(H, s.y * H + s.l * H)); g.stroke();
  }
  if (ETAT.rouge > 0) vign(ETAT.rouge * .55, '150,10,14');
  if (ETAT.flash > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(.85, ETAT.flash)})`; g.fillRect(0, 0, W, H); }
}
