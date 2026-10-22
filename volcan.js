// ============ L'ÎLE VOLCANIQUE (§195) ============
// La première « île biome » : une île d'un seul monde, que rien d'autre ne partage. Un cône au
// centre, son cratère et son lac de lave ; des coulées qui descendent à la mer entre des berges
// d'obsidienne ; des soufrières qui fument ; des bains brûlants en terrasses de travertin ; des
// geysers. Une graine signée sur vingt-cinq, dès l'exploration 6 — ni biome rare, ni état d'île.
//
// genWorld appelle volcanDebut (le centre, la brèche), volcanRelief (dans la boucle du relief) et
// volcanSols (après les biomes : le lac, les coulées, les sols, les sources, les geysers).
// loadWorld appelle volcanCharge ; update appelle majVolcan (le panache, les vapeurs, les geysers).
// Le ciel (volcanCiel), le voile (volcanVoile), le filtre du canvas (volcanCss). Les huit sols sont dans
// BIOME (24 à 31), la lave a son rendu dans la carte graphique.
// (§196) L'hostilité (volcanCorps : la lave, la chaleur, le soufre, les bains ; les geysers qui projettent),
// la météo de l'île (METEO : fumées, cendres, orage de cendre, éruption — volcanMeteo, volcanEruption,
// majBombes, volcanFoudre) et sa musique, « Le Cœur de cendre » (volcanMusique, volcanIntensite).
const NIV_VOLCAN = 6;
const VOLC = { cx: 100, cy: 100, R: 80, rc: 9, br: 0, zLac: 12, laves: [], geysers: [], bains: [], fumerolles: [],
  embouchures: [], bouches: [], rnd: Math.random, pan: 0, cra: 0, T: 0, bombes: [], dit: {}, I: .3 };
const ileVolcanGraine = g => Number.isInteger(g) && signee(g) && hash32(g ^ 0x7c41d) % 25 === 0 && !ileMecaGraine(g);
const volcanIci = () => typeof ileVolcan !== 'undefined' && ileVolcan && !(typeof djIci === 'function' && djIci());

// ---------- le relief ----------
function volcanDebut() {
  let s = hash32((SEED | 0) ^ 0x2f17b) || 1;
  const r = VOLC.rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  VOLC.cx = WS * (.43 + r() * .14); VOLC.cy = WS * (.43 + r() * .14);
  VOLC.R = WS * (.39 + r() * .05); VOLC.rc = 8 + r() * 2.5;
  VOLC.br = r() * Math.PI * 2;
  for (const k of ['laves', 'geysers', 'bains', 'fumerolles', 'embouchures', 'bouches']) VOLC[k] = [];
}
// Un cône concave (l'étalement de genWorld le creuse encore), raviné de crêtes qui rayonnent, une
// lèvre, une cuvette à parois raides. Au-delà du cône, le relief ordinaire, tassé : la plaine basse.
function volcanRelief(x, y, h) {
  const V = VOLC, dx = x - V.cx, dy = y - V.cy, r = Math.hypot(dx, dy) / V.R, a = Math.atan2(dy, dx);
  const u = x / WS, v = y / WS, bord = Math.min(1, Math.min(u, v, 1 - u, 1 - v) * 4.2);
  const rad = fbm(nB, Math.cos(a) * 4 + r * .9 + 40, Math.sin(a) * 4 - r * .9 - 20, 3);   // ne dépend que de l'angle : des ravines
  const rc = V.rc / V.R;
  let c = Math.pow(Math.max(0, 1 - Math.max(r, rc)), 1.3) * (1 + (rad - .5) * .55 * Math.min(1, r * 2.5));
  c += .05 * Math.exp(-(((r - rc) * V.R / 2.2) ** 2));                                    // la lèvre
  if (r < rc) c -= .30 * (1 - (r / rc) ** 5);                                              // la cuvette
  c += (fbm(nC, x / 11, y / 11, 3) - .5) * .07 * Math.min(1, r * 3);                       // bourrelets, vieilles coulées
  // l'île est ronde : une côte qui ondule autour du centre de la carte
  const ac = Math.atan2(y - WS / 2, x - WS / 2);
  const cote = Math.hypot(x - WS / 2, y - WS / 2) / (WS * .41) * (1 + (fbm(nA, Math.cos(ac) * 2.2 + 9, Math.sin(ac) * 2.2 - 4, 3) - .5) * .45);
  const k = Math.max(0, Math.min(1, bord * 2, (1.04 - cote) / .24));
  return (h * .5 + c * .95) * k - (1 - k) * .25;
}

// ---------- les sols, le feu, l'eau ----------
function volcanSols(gouffres) {
  const V = VOLC, R = V.rnd, id = (x, y) => y * WS + x;
  const rOf = (x, y) => Math.hypot(x + .5 - V.cx, y + .5 - V.cy);
  const dedans = (x, y) => x > 2 && y > 2 && x < WS - 3 && y < WS - 3;
  // 1. le cône n'a pas de gouffres : on les comble (au loin, quelques tunnels effondrés restent)
  for (let pass = 0; pass < 60; pass++) {
    let reste = 0;
    for (const i of gouffres) {
      if (Bio[i] !== 8 || rOf(i % WS, (i / WS) | 0) > V.R) continue;
      let m = 99;
      for (const [dx, dy] of VOISINS4) { const j = i + dy * WS + dx; if (Bio[j] !== 8 && Hgt[j] > SEA) m = Math.min(m, Hgt[j]); }
      if (m < 99) { Hgt[i] = m; Bio[i] = 28; } else reste++;
    }
    if (!reste) break;
  }
  // 2. les sols de fond : le rivage de sable noir, les parois de basalte, la cendre en haut, en
  // bas une mosaïque de vieilles coulées, de cendre et de scories, des éclats d'obsidienne
  for (let y = 1; y < WS - 1; y++) for (let x = 1; x < WS - 1; x++) {
    const i = id(x, y), b = Bio[i], h = Hgt[i];
    if (b === 0 || b === 8 || h <= SEA) continue;
    const r = rOf(x, y) / V.R;
    let pente = 0; for (const [dx, dy] of VOISINS4) pente = Math.max(pente, Math.abs(h - Hgt[i + dy * WS + dx]));
    const m = fbm(nB, x / 24 + 70, y / 24 - 30, 3), fin = fbm(nA, x / 6 - 50, y / 6 + 90, 2);
    let nb;
    const a = Math.atan2(y + .5 - V.cy, x + .5 - V.cx);
    if (b === 1) nb = 27;
    else if (pente >= 3 || (pente >= 2 && fin > .6)) nb = 24;
    else if (r < .55) nb = fbm(nC, Math.cos(a) * 7 + r * 2 + 30, Math.sin(a) * 7 - r * 2, 2) > .57 || fin > .82 ? 27 : 28;   // des traînées de scories noires sur la cendre
    else nb = m < .40 ? 24 : m > .64 ? 27 : 28;
    if (r >= .45 && fin > .79 && m < .55 && pente < 2) nb = 26;
    Bio[i] = nb;
  }
  // 3. le lac de lave, au fond du cratère
  const cx = V.cx | 0, cy = V.cy | 0, rk = Math.ceil(V.rc) + 2;
  let fond = 99;
  for (let y = cy - rk; y <= cy + rk; y++) for (let x = cx - rk; x <= cx + rk; x++) if (rOf(x, y) < V.rc * .55) fond = Math.min(fond, Hgt[id(x, y)]);
  V.zLac = fond = Math.max(SEA + 4, fond);
  const lave = new Uint8Array(WS * WS);
  const enLave = (i, z) => { Hgt[i] = Math.min(Hgt[i], z); Bio[i] = BIO_LAVE; lave[i] = 1; };
  for (let y = cy - rk; y <= cy + rk; y++) for (let x = cx - rk; x <= cx + rk; x++) {
    const r = rOf(x, y), i = id(x, y);
    if (r < V.rc * .8 || (r < V.rc && Hgt[i] <= fond + 1)) { Hgt[i] = fond; Bio[i] = BIO_LAVE; lave[i] = 1; }
  }
  // 4. les coulées : la lave suit la pente, garde son élan, serpente ; son lit ne remonte jamais et
  // court un cube sous la berge. Elle s'arrête à la mer (qui fume), au vide, ou refroidie en route.
  const coulee = (x, y, a, z, larg, pas, sel) => {
    for (let s = 0; s < pas; s++) {
      const xi = x | 0, yi = y | 0;
      if (!dedans(xi, yi)) return;
      const gx = hAt(xi - 2, yi) - hAt(xi + 2, yi), gy = hAt(xi, yi - 2) - hAt(xi, yi + 2);
      const ar = Math.atan2(y - V.cy, x - V.cx), tranchee = hAt((x + Math.cos(a) * 2.5) | 0, (y + Math.sin(a) * 2.5) | 0) > z + 1;   // dans la lèvre : elle s'y taille un lit, droit devant
      let da = (!tranchee && Math.hypot(gx, gy) > .5 ? Math.atan2(gy, gx) : a) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
      let dr = ar - a; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      a += da * .22 + dr * (tranchee ? .15 : .06) + (fbm(nC, x / 9 + sel, y / 9 - sel, 2) - .5) * (tranchee ? .2 : .55);
      x += Math.cos(a) * .7; y += Math.sin(a) * .7;
      const i = id(x | 0, y | 0);
      if (Bio[i] === 8) return;
      if (Hgt[i] <= SEA) { V.embouchures.push([x, y]); return; }
      if (s > 5 && !lave[i]) z = Math.min(z, Hgt[i] - 1);
      if (z <= SEA) { V.embouchures.push([x, y]); return; }
      const w = larg * (s < pas - 12 ? 1 : .55 + .45 * (pas - s) / 12), rr = Math.ceil(w * .5 + 1.5);
      for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
        const nx = (x | 0) + dx, ny = (y | 0) + dy; if (!dedans(nx, ny)) continue;
        const j = id(nx, ny), d = Math.hypot(nx + .5 - x, ny + .5 - y);
        if (d < w * .5 + .25) enLave(j, z);
        else if (d < w * .5 + 1.4 && !lave[j] && Hgt[j] > SEA) Bio[j] = (fbm(nA, nx / 3, ny / 3, 1) > .45) ? 26 : 24;
      }
    }
  };
  coulee(V.cx + Math.cos(V.br) * V.rc * .6, V.cy + Math.sin(V.br) * V.rc * .6, V.br, fond, 2.8, 190, 11);   // par la brèche
  const nb = 2 + (R() * 2 | 0);
  for (let k = 0; k < nb; k++) {                      // les bouches du flanc
    const a = V.br + Math.PI * 2 * (k + 1) / (nb + 1) + (R() - .5) * .6, rr = V.rc + 6 + R() * V.R * .3;   // loin de la brèche, et l'une de l'autre
    const x = V.cx + Math.cos(a) * rr, y = V.cy + Math.sin(a) * rr, i = id(x | 0, y | 0);
    if (!dedans(x | 0, y | 0) || Hgt[i] <= SEA + 3) continue;
    V.bouches.push([x, y, Hgt[i]]);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {   // un hornito : un bourrelet de scories autour d'un trou de feu
      const j = id((x | 0) + dx, (y | 0) + dy), d = Math.hypot(dx, dy);
      if (d < 1) enLave(j, Hgt[i]); else if (d < 2.3) { Bio[j] = 26; Hgt[j] = Math.max(Hgt[j], Hgt[i] + 1); }
    }
    coulee(x, y, a, Hgt[i], 1.7 + R() * .8, 70 + R() * 80, 37 + k * 19);
  }
  // l'obsidienne : la lave figée au bord du lac
  for (let y = cy - rk - 1; y <= cy + rk + 1; y++) for (let x = cx - rk - 1; x <= cx + rk + 1; x++) {
    const i = id(x, y); if (lave[i]) continue;
    for (const [dx, dy] of VOISINS4) if (lave[i + dy * WS + dx]) { Bio[i] = R() < .7 ? 26 : 24; break; }
  }
  // 5. les soufrières : des taches jaunes qui fument, sur le cône et sur la lèvre du cratère
  const libre = i => !lave[i] && Bio[i] !== 0 && Bio[i] !== 8 && Hgt[i] > SEA + 1;
  for (let k = 0, essais = 0; k < 6 && essais < 500; essais++) {
    const a = R() * 6.283, rr = k < 2 ? V.rc + 1.5 + R() * 3 : V.rc + 6 + R() * V.R * .55;
    const x = (V.cx + Math.cos(a) * rr) | 0, y = (V.cy + Math.sin(a) * rr) | 0;
    if (!dedans(x, y) || !libre(id(x, y))) continue;
    const ray = k < 2 ? 2 + R() * 1.5 : 2.5 + R() * 3.5;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const j = id(x + dx, y + dy);
      if (Math.hypot(dx, dy) > ray * (.7 + .6 * fbm(nB, (x + dx) / 3, (y + dy) / 3, 2)) || !libre(j)) continue;
      Bio[j] = 25;
    }
    for (let e = 0, n = 2 + (R() * 3 | 0); e < n; e++) {
      const ex = (x + (R() - .5) * ray * 1.2) | 0, ey = (y + (R() - .5) * ray * 1.2) | 0;
      if (Bio[id(ex, ey)] === 25) V.fumerolles.push([ex + .5, ey + .5, Hgt[id(ex, ey)], R() * 9]);
    }
    k++;
  }
  // 6. les bains brûlants : une source, puis des vasques en terrasses qui descendent, chacune un
  // cube sous la précédente, ceintes de travertin. L'eau (Eau) affleure la margelle.
  const bain = new Uint8Array(WS * WS);
  const vasque = (x, y, z, ray) => {
    const rr = Math.ceil(ray + 1.3);
    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) {
      const nx = x + dx, ny = y + dy; if (!dedans(nx, ny)) continue;
      const j = id(nx, ny), d = Math.hypot(dx, dy) * (.85 + .3 * fbm(nC, nx / 2.5, ny / 2.5, 1));
      if (lave[j] || Bio[j] === 0) continue;
      if (d < ray) { Hgt[j] = z - 1; Eau[j] = z; EauT[j] = 1; Bio[j] = BIO_BAIN; bain[j] = 1; }
      else if (d < ray + 1.3 && !bain[j]) { Hgt[j] = Math.max(Hgt[j], z); Bio[j] = 31; }
    }
  };
  const sites = [];
  for (let k = 0, essais = 0; k < 3 && essais < 600; essais++) {
    const a = R() * 6.283, rr = V.R * (.45 + R() * .4);
    let x = (V.cx + Math.cos(a) * rr) | 0, y = (V.cy + Math.sin(a) * rr) | 0;
    if (!dedans(x, y) || !libre(id(x, y)) || Bio[id(x, y)] === 25 || Hgt[id(x, y)] < SEA + 4) continue;
    if (sites.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 25)) continue;
    let near = false; for (let dy = -6; dy <= 6 && !near; dy++) for (let dx = -6; dx <= 6; dx++) if (lave[id(x + dx, y + dy)]) { near = true; break; }
    if (near) continue;
    sites.push([x, y]);
    let z = Hgt[id(x, y)] + 1, da = a;
    const n = 3 + (R() * 3 | 0);
    for (let p = 0; p < n; p++) {
      const ray = p === 0 ? 1.3 + R() * .5 : 1.4 + R() * 1.1;
      vasque(x, y, z, ray);
      V.bains.push([x + .5, y + .5, z, ray, R() * 9, p]);   // p : 0 pour la source, qui brûle
      // la suivante : vers le bas, quelques cases plus loin
      let bx = x, by = y, bh = 99;
      for (let t = -2; t <= 2; t++) {
        const aa = da + t * .45, tx = (x + Math.cos(aa) * (ray + 2.6)) | 0, ty = (y + Math.sin(aa) * (ray + 2.6)) | 0;
        if (!dedans(tx, ty) || lave[id(tx, ty)] || Bio[id(tx, ty)] === 0) continue;
        if (Hgt[id(tx, ty)] < bh) { bh = Hgt[id(tx, ty)]; bx = tx; by = ty; }
      }
      if (bh === 99 || bh <= SEA + 1) break;
      da = Math.atan2(by - y, bx - x); x = bx; y = by; z = Math.min(z - 1, bh + 1);
      if (z <= SEA + 2) break;
    }
    k++;
  }
  // 7. les geysers : un monticule de travertin, un trou d'eau au sommet. Près des bains surtout.
  for (let k = 0, essais = 0; k < 5 && essais < 800; essais++) {
    let x, y;
    if (k < sites.length && R() < .85) { const [sx, sy] = sites[k % sites.length], a = R() * 6.283; x = (sx + Math.cos(a) * (7 + R() * 6)) | 0; y = (sy + Math.sin(a) * (7 + R() * 6)) | 0; }
    else { const a = R() * 6.283, rr = V.R * (.35 + R() * .5); x = (V.cx + Math.cos(a) * rr) | 0; y = (V.cy + Math.sin(a) * rr) | 0; }
    if (!dedans(x, y)) continue;
    let ok = true;
    for (let dy = -3; dy <= 3 && ok; dy++) for (let dx = -3; dx <= 3; dx++) { const j = id(x + dx, y + dy); if (lave[j] || bain[j] || Bio[j] === 0 || Bio[j] === 8 || Hgt[j] <= SEA + 1) { ok = false; break; } }
    if (!ok || V.geysers.some(G => Math.hypot(G.x - x, G.y - y) < 8)) continue;
    const h0 = Hgt[id(x, y)];
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const j = id(x + dx, y + dy), d = Math.hypot(dx, dy);
      if (d < .5) { Hgt[j] = h0; Eau[j] = h0 + 1; EauT[j] = 1; Bio[j] = BIO_BAIN; bain[j] = 1; }
      else if (d < 1.6) { Hgt[j] = h0 + 1; Bio[j] = 31; }
      else if (d < 3 - fbm(nB, (x + dx) / 2, (y + dy) / 2, 1)) Bio[j] = 31;
    }
    V.geysers.push({ x: x + .5, y: y + .5, z: h0 + 1, per: 18 + R() * 30, t: R() * 20, e: 0, sz: R() });
    k++;
  }
  for (let i = 0; i < WS * WS; i++) if (lave[i]) V.laves.push(i);
}

// ---------- la vie de l'île : fumées, vapeurs, geysers ----------
function volcanCharge() {
  const V = VOLC;
  for (const G of V.geysers) { G.e = 0; G.t = Math.random() * G.per; G.lance = false; G.dit = false; }
  Object.assign(V, { feux: [], alpha: null, pan: 0, cra: 0, T: 0, bombes: [], bT: 0, fouT: 3, cendT: 0, chaud: 0, gaz: 0, toux: 0, bain: -1, meteoVue: null, coup: false, trem: 0, dit: {}, I: .3 });
  Meteo.de = Meteo.vers = 'fumees'; Meteo.m = 1; Meteo.reste = 50 + Math.random() * 60;   // (§196) le ciel de l'île, dès l'arrivée
  tisonnierNaitre();                                   // (§199) le gardien dort dans le lac
}
// une bouffée de fumée ou de vapeur : un disque doux (fum), qui grossit (gr), arrive en fondu (fin),
// et que le vent pousse de plus en plus (ve)
function bouffee(x, y, z, o) {
  parts.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 1, g: 0, life: 3, age: 0, col: '#eeeae0', tl: .3, gr: .4, fum: 1, fin: .5, ve: null }, o));
}
const volcDire = (k, txt, du, tous) => { const V = VOLC; if (t - (V.dit[k] || -99) > (tous || 6)) { V.dit[k] = t; say(txt, du || 1.8); } };
function majVolcan(dt) {
  if (!volcanIci()) return;
  const V = VOLC; V.T += dt;
  const wv = Meteo.vent || 0, wx = Math.cos(Meteo.dir) * wv, wy = Math.sin(Meteo.dir) * wv;
  const pres = (x, y, r) => (x - P.x) ** 2 + (y - P.y) ** 2 < r * r;
  // (§200) le budget : en canvas, ou sur un appareil qui peine (moins de 40 images par seconde), moitié moins de fumée ;
  // passé un plafond de particules, la fumée, la vapeur et la cendre attendent que la place se libère (les bombes, la
  // lave, les dégâts ne changent jamais)
  const lent = typeof imgSec === 'number' && imgSec > 1 && imgSec < 40, cv = typeof G3 === 'undefined' || !G3.ok || G3.perdu;
  const peu = cv || lent, cap = cv ? 280 : lent ? 700 : 1600;   // le canvas paie chaque particule : il en garde peu
  const kE = parts.length > cap ? 0 : parts.length > cap * .65 ? .4 : 1;
  const er = met('erupt'), ce = met('cendre');
  volcanMeteo(er, dt);
  // le panache : une colonne qui monte du cratère et que le vent couche, sombre en bas, cendrée en haut ;
  // en éruption, trois fois plus épais, plus haut, rouge à sa base
  V.pan += dt * (peu ? 2.5 : 5) * (1 + er * 2) * Math.max(.3, kE);
  while (V.pan > 1) {
    V.pan--;
    const a = Math.random() * 6.283, r = Math.random() * V.rc * .55, k = Math.random();
    bouffee(V.cx + Math.cos(a) * r, V.cy + Math.sin(a) * r, V.zLac + 1.5 + Math.random() * 1.5, { op: .55 + .25 * er,
      vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, vz: (2.4 + Math.random() * 1.4) * (1 + er), g: .1,
      life: (10 + Math.random() * 6) * (1 + er * .3), col: k < .3 && (noirceur() > .3 || er > .5) ? '#6a2c1c' : k < .5 ? '#383234' : k < .85 ? '#575050' : '#857a74',   // la nuit, le dessous rougeoie
      tl: (.9 + Math.random() * .9) * (1 + er * .8), gr: .2, fin: 1.4, ve: [wx * .14 + .05, wy * .14 + .03] });
  }
  if (er > .25) volcanEruption(dt, er, peu, pres);
  majBombes(dt, peu);
  // le lac : des bulles qui crèvent, des gerbes de lave (près de vous seulement)
  if (pres(V.cx, V.cy, 60)) {
    V.cra += dt * 2.2 * (1 + er * 3) * (peu ? .5 : 1) * kE;
    while (V.cra > 1) {
      V.cra--;
      const a = Math.random() * 6.283, r = Math.random() * V.rc * .75, x = V.cx + Math.cos(a) * r, y = V.cy + Math.sin(a) * r;
      for (let n = 0; n < 7; n++) parts.push({ x, y, z: V.zLac + .1, vx: (Math.random() - .5) * 2.4, vy: (Math.random() - .5) * 2.4, vz: 3 + Math.random() * 4,
        g: 9, life: .8 + Math.random() * .5, age: 0, col: Math.random() < .5 ? '#ffd060' : '#ff6a1c', luit: 1, tl: .09 });
      bouffee(x, y, V.zLac + .4, { vz: .9, g: -.05, life: 2.6, col: '#6a4a40', tl: .5, gr: .35 });
    }
  }
  // ailleurs sur la lave : des gerbes, au hasard autour de vous
  if (V.laves.length && Math.random() < dt * 3) {
    const x = P.x + (Math.random() * 2 - 1) * 14, y = P.y + (Math.random() * 2 - 1) * 14, i = (y | 0) * WS + (x | 0);
    if (Bio[i] === BIO_LAVE) for (let n = 0; n < 5; n++) parts.push({ x, y, z: Hgt[i] + .05, vx: (Math.random() - .5) * 1.6, vy: (Math.random() - .5) * 1.6, vz: 2 + Math.random() * 3,
      g: 9, life: .7 + Math.random() * .4, age: 0, col: Math.random() < .5 ? '#ffc048' : '#ff5a18', luit: 1, tl: .08 });
  }
  // les soufrières, les bains, la lave qui entre dans la mer : de la vapeur
  for (const f of V.fumerolles) if (pres(f[0], f[1], 40) && Math.random() < dt * (peu ? 1.5 : 3) * kE)
    bouffee(f[0] + (Math.random() - .5) * .5, f[1] + (Math.random() - .5) * .5, f[2] + .1, { vz: 1 + Math.random() * .6, g: -.08, life: 2.8 + Math.random(),
      col: Math.random() < .35 ? '#e6dc96' : '#f0eee4', tl: .25, gr: .5, ve: [wx * .2, wy * .2] });
  for (const b of V.bains) if (pres(b[0], b[1], 36) && Math.random() < dt * b[3] * (peu ? .6 : 1.2) * (b[5] ? 1 : 2) * kE) {
    const a = Math.random() * 6.283, r = Math.random() * b[3];
    bouffee(b[0] + Math.cos(a) * r, b[1] + Math.sin(a) * r, b[2] + .05, { vz: .45 + Math.random() * .4, g: -.04, life: 3 + Math.random() * 1.5, col: '#f4f8f6', tl: .22, gr: .45, fin: .8, ve: [wx * .25, wy * .25] });
  }
  for (const e of V.embouchures) if (pres(e[0], e[1], 50) && Math.random() < dt * (peu ? 2 : 4) * kE)
    bouffee(e[0] + (Math.random() - .5) * 2, e[1] + (Math.random() - .5) * 2, SEA + .3, { vz: 1.3 + Math.random() * .8, g: -.06, life: 4 + Math.random() * 2, col: '#f2f2ee', tl: .5, gr: .45, fin: .8, ve: [wx * .2, wy * .2] });
  majGeysers(dt, peu, pres, wx, wy);
  // (§197) la flore qui vit : la vesse-de-vapeur souffle, l'arbre-tison crache des étincelles
  if ((V.florT = (V.florT || 0) - dt) <= 0) {
    V.florT = .6; V.flor = [];
    if (!V.kB) { V.kB = ESP.findIndex(e => e.id === 'vapeurbulbe') + 1; V.kT = ESP.findIndex(e => e.id === 'tison') + 1; }
    const px = P.x | 0, py = P.y | 0;
    for (let y = Math.max(1, py - 14); y <= Math.min(WS - 2, py + 14); y++) for (let x = Math.max(1, px - 14); x <= Math.min(WS - 2, px + 14); x++) {
      const i = y * WS + x, k = Flo[i];
      if ((k === V.kB || k === V.kT) && maturite(i, ESP[k - 1]) >= 1) V.flor.push([x + .5, y + .5, solFlore(x, y), k === V.kB ? 0 : 1, ESP[k - 1].h]);
    }
  }
  if (kE) for (const f of V.flor || []) {
    if (f[3] === 0) { if (Math.random() < dt * .5) bouffee(f[0], f[1], f[2] + f[4], { vz: 1.4, g: -.1, life: 2.2, col: '#f2f2ea', tl: .12, gr: .8, fin: .2, ve: [wx * .3, wy * .3] }); }
    else if (Math.random() < dt * 1.2) parts.push({ x: f[0] + (Math.random() - .5) * .8, y: f[1] + (Math.random() - .5) * .8, z: f[2] + f[4] * .85, vx: wx * .3, vy: wy * .3,
      vz: .8 + Math.random(), g: -.2, life: 1.4, age: 0, col: Math.random() < .5 ? '#ffb050' : '#ff6a20', luit: 1, tl: .05 });
  }
  // (§196) la cendre qui tombe : des flocons gris qui se balancent et se posent
  if (ce > .05) {
    V.cendT += dt * ce * (peu ? 50 : 160) * kE;
    while (V.cendT > 1) {
      V.cendT--;
      const a = Math.random() * 6.283, r = 2.5 + Math.sqrt(Math.random()) * 13.5, k = Math.random();   // (pas sous le nez de la caméra)
      parts.push({ x: P.x + Math.cos(a) * r - wx * 2, y: P.y + Math.sin(a) * r - wy * 2, z: P.z + 1.5 + Math.random() * 6, vx: wx * .6 + (Math.random() - .5) * .3, vy: wy * .6 + (Math.random() - .5) * .3,
        vz: -1.2 - Math.random() * .9, g: 0, life: 4.5 + Math.random() * 1.5, age: 0, col: k < .45 ? '#dcd6ce' : k < .8 ? '#9a948e' : '#4a4442', tl: .06 + Math.random() * .08, ond: 1 + Math.random() * 6 });
    }
    // et des nappes de cendre qui traînent au ras du sol, que le vent pousse
    V.napT = (V.napT || 0) + dt * ce * (peu ? 1.5 : 4) * kE;
    while (V.napT > 1) {
      V.napT--;
      const a = Math.random() * 6.283, r = 3 + Math.random() * 13, x = P.x + Math.cos(a) * r, y = P.y + Math.sin(a) * r;
      bouffee(x, y, hAt(x | 0, y | 0) + .4 + Math.random() * 1.6, { vx: wx * .8, vy: wy * .8, vz: .05, life: 6 + Math.random() * 3, col: Math.random() < .5 ? '#8a827c' : '#a49c94', tl: 1 + Math.random() * .8, gr: .15, fin: 2, op: .22 });
    }
  }
  // (§196) l'orage de cendre : la foudre dans le panache, et autour de vous
  if (met('foudre') > .5 && (V.fouT -= dt) <= 0) { V.fouT = 1.2 + Math.random() * 4; volcanFoudre(); }
  majFauneVolcan(dt);                                  // (§198) la faune, vue de près
  // (§199) le sol qui brûle : le sillage du tisonnier, la ligne qu'il a plantée
  for (let i = V.feux.length - 1; i >= 0; i--) { const q = V.feux[i]; if (t > q[3]) { V.feux.splice(i, 1); continue; }
    if (pres(q[0], q[1], 30) && Math.random() < dt * 5) parts.push({ x: q[0] + (Math.random() - .5) * .8, y: q[1] + (Math.random() - .5) * .8, z: q[2] + .05, vx: 0, vy: 0, vz: .8 + Math.random(), g: -.2, life: .7, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .1 }); }
  majBarreTison();
  volcanCorps(dt);
}
// ---------- (§196) la météo de l'île ----------
// Quatre temps qui ne se donnent qu'ici (METEO, index.html) : les fumées, la pluie de cendres, l'orage de
// cendre, l'éruption. Chacun s'annonce ; l'éruption gronde, puis le cratère éclate.
function volcanMeteo(er, dt) {
  const V = VOLC;
  if (V.meteoVue !== Meteo.vers) {
    const avant = V.meteoVue; V.meteoVue = Meteo.vers;
    if (avant !== null) {
      const M = { cendres: 'la cendre se met à tomber', orageCendre: 'un orage de cendre éclate dans le panache', eruption: 'la montagne gronde · le volcan s\'éveille', fumees: 'les fumées retombent' }[Meteo.vers];
      if (M) say(M, 3.5);
      if (Meteo.vers === 'eruption') { SON.jouer('grondement', { fort: 1 }); P.secousse = t; P.secousseK = .6; }
    }
  }
  if (!V.coup && er > .5) {                            // le cratère éclate
    V.coup = true; say('éruption ! des bombes de lave tombent', 3.5);
    SON.jouer('explosion', { vol: 1 }); SON.jouer('grondement', { fort: 1, dans: .25 }); P.secousse = t; P.secousseK = 1;
  }
  if (er < .35) V.coup = false;
  if (er > .3 && (V.trem -= dt) <= 0) { V.trem = 1.5 + Math.random() * 2.5; P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .12 + .25 * er); }   // la terre tremble par à-coups
}
// La fontaine de lave au-dessus du cratère, et les bombes : chacune vole en cloche jusqu'à son point de chute,
// traîne une fumée, éclate au sol. Près du volcan, deux sur cinq visent vos environs.
function volcanEruption(dt, er, peu, pres) {
  const V = VOLC;
  for (let n = 0, m = Math.round(dt * er * (peu ? 12 : 60) + Math.random() * .5); n < m; n++) {
    const a = Math.random() * 6.283, r = Math.random() * V.rc * .4, v = 9 + Math.random() * 9 * er, k = Math.random();
    parts.push({ x: V.cx + Math.cos(a) * r, y: V.cy + Math.sin(a) * r, z: V.zLac + .3, vx: Math.cos(a) * (1 + Math.random() * 3), vy: Math.sin(a) * (1 + Math.random() * 3), vz: v,
      g: 9, life: v / 4.5 + .3, age: 0, col: k < .35 ? '#ffe070' : k < .7 ? '#ff9a30' : '#ff4a14', luit: 1, tl: .14 + Math.random() * .14 });
  }
  V.bT += dt * er * 1.3;
  while (V.bT > 1) {
    V.bT--;
    let tx, ty;
    if (pres(V.cx, V.cy, V.R) && Math.random() < .4) { tx = P.x + (Math.random() - .5) * 10; ty = P.y + (Math.random() - .5) * 10; }
    else { const a = Math.random() * 6.283, r = V.rc + Math.random() * V.R * .55; tx = V.cx + Math.cos(a) * r; ty = V.cy + Math.sin(a) * r; }
    if (tx < 3 || ty < 3 || tx > WS - 3 || ty > WS - 3) continue;
    const z0 = V.zLac + .5, z1 = hAt(tx | 0, ty | 0), T = 2.6 + Math.random() * 1.6;
    V.bombes.push({ x: V.cx, y: V.cy, z: z0, vx: (tx - V.cx) / T, vy: (ty - V.cy) / T, vz: (z1 - z0 + 4.5 * T * T) / T, t: 0, T, tl: .26 + Math.random() * .2, fum: 0 });
  }
}
function majBombes(dt, peu) {
  const V = VOLC;
  for (let i = V.bombes.length - 1; i >= 0; i--) {
    const B = V.bombes[i];
    B.t += dt; B.x += B.vx * dt; B.y += B.vy * dt; B.z += B.vz * dt; B.vz -= 9 * dt;
    parts.push({ x: B.x, y: B.y, z: B.z, vx: 0, vy: 0, vz: 0, g: 0, life: .06, age: 0, col: '#ffb040', luit: 1, tl: B.tl });
    if ((B.fum += dt) > (peu ? .12 : .05)) { B.fum = 0; bouffee(B.x, B.y, B.z, { vz: .2, life: 1.4 + Math.random(), col: Math.random() < .5 ? '#4a4240' : '#6a5e58', tl: .15, gr: .7, fin: .1, op: .7 }); }
    const sol = hAt(B.x | 0, B.y | 0);
    if (B.t < B.T + .5 && (B.z > sol || B.t < .3)) continue;
    V.bombes.splice(i, 1);
    const d = Math.hypot(B.x - P.x, B.y - P.y);
    for (let n = 0; n < 14; n++) parts.push({ x: B.x, y: B.y, z: sol + .2, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, vz: 2 + Math.random() * 5,
      g: 9, life: .7 + Math.random() * .6, age: 0, col: Math.random() < .5 ? '#ffc048' : '#ff5a18', luit: 1, tl: .1 });
    for (let n = 0; n < 3; n++) bouffee(B.x + Math.random() - .5, B.y + Math.random() - .5, sol + .3, { vz: 1 + Math.random(), life: 2.5, col: '#3e3836', tl: .4, gr: .5, op: .7 });
    if (d < 30) SON.jouer('explosion', { vol: Math.max(.2, 1 - d / 30) * .7 }, B.x, B.y, sol);
    if (d < 14) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .5 * (1 - d / 14)); }
    if (d < 1.9 && Math.abs(P.z - sol) < 2.5 && P.pv > 0 && !effet('braise')) {
      P.pv = Math.max(0, P.pv - .2 * vieK()); P.dernierCoup = t; P.brulure = Math.max(P.brulure || 0, t + 2);
      const a = Math.atan2(P.y - B.y, P.x - B.x); P.vx = Math.cos(a) * 5; P.vy = Math.sin(a) * 5; P.vz = 4; P.recul = .3;
      volcDire('bombe', 'une bombe de lave !', 1.5, 2);
      if (P.pv <= 0) { P.brulure = 0; terrasse(); }
    }
  }
}
// Un éclair : une ligne brisée de lueurs, avec des branches. Dans le panache (du haut de la colonne à la lèvre),
// ou près de vous (du ciel au sol). Le ciel s'allume ; le tonnerre suit.
function volcanFoudre() {
  const V = VOLC, r = Math.random;
  let x0, y0, z0, x1, y1, z1;
  if (r() < .55) {
    const a = r() * 6.283, b = r() * 6.283;
    x0 = V.cx + Math.cos(a) * 3; y0 = V.cy + Math.sin(a) * 3; z0 = V.zLac + 16 + r() * 10;
    x1 = V.cx + Math.cos(b) * V.rc; y1 = V.cy + Math.sin(b) * V.rc; z1 = hAt(x1 | 0, y1 | 0);
  } else {
    const a = r() * 6.283, d = 6 + r() * 10;
    x1 = P.x + Math.cos(a) * d; y1 = P.y + Math.sin(a) * d; z1 = hAt(x1 | 0, y1 | 0);
    x0 = x1 + (r() - .5) * 6; y0 = y1 + (r() - .5) * 6; z0 = z1 + 22;
  }
  eclairChemin(x0, y0, z0, x1, y1, z1, 1);
  const d = Math.hypot(x1 - P.x, y1 - P.y);
  if (d < 25) { Meteo.flash = 1; burst(x1, y1, z1 + .2, 10, '#e8e0ff'); }   // le tonnerre suit le flash (le son de l'orage)
  else { Meteo.flash = Math.max(Meteo.flash, .6); SON.jouer('tonnerre', { dans: 1.2 + r() * 2, k: .55, bus: 'a' }); }
}
function eclairChemin(x0, y0, z0, x1, y1, z1, k) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0, z1 - z0) / .45));
  let px = x0, py = y0, pz = z0, ox = 0, oy = 0;
  for (let i = 1; i <= n; i++) {
    const f = i / n, e = Math.sin(f * Math.PI);
    ox = Math.max(-1.6, Math.min(1.6, ox + (Math.random() - .5) * .9)); oy = Math.max(-1.6, Math.min(1.6, oy + (Math.random() - .5) * .9));
    const x = x0 + (x1 - x0) * f + ox * e * k, y = y0 + (y1 - y0) * f + oy * e * k, z = z0 + (z1 - z0) * f;
    const vie = .32 + Math.random() * .12;
    for (let s = 0; s < 2; s++) { const u = s / 2;
      parts.push({ x: px + (x - px) * u, y: py + (y - py) * u, z: pz + (z - pz) * u, vx: 0, vy: 0, vz: 0, g: 0, life: vie, age: 0, col: k > .6 ? '#ffffff' : '#d8ccff', luit: 1, tl: .08 + .16 * k }); }
    if (i % 3 === 0) parts.push({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, life: vie * .8, age: 0, col: '#8f7cff', luit: 1, tl: .5 * k + .2 });   // le halo
    if (k > .6 && i < n - 2 && Math.random() < .07) eclairChemin(x, y, z, x + (Math.random() - .5) * 5, y + (Math.random() - .5) * 5, z - 2 - Math.random() * 4, .5);
    px = x; py = y; pz = z;
  }
}
// Les geysers : le repos, le grondement (il bouillonne, crache), la colonne, puis la vapeur qui reste.
// (§196) Qui se tient sur l'évent quand il jaillit est projeté en l'air, et un peu ébouillanté.
function majGeysers(dt, peu, pres, wx, wy) {
  for (const G of VOLC.geysers) {
    G.t += dt;
    const ici = pres(G.x, G.y, 45), dP = Math.hypot(P.x - G.x, P.y - G.y);
    if (G.e === 0) {
      if (ici && Math.random() < dt * .8) bouffee(G.x, G.y, G.z, { vz: .5, g: -.03, life: 2.5, col: '#f0f4f2', tl: .2, gr: .35 });
      if (G.t > G.per) { G.e = 1; G.t = 0; G.lance = false; G.dit = false; }
    } else if (G.e === 1) {
      if (ici) {
        if (Math.random() < dt * 6) bouffee(G.x, G.y, G.z, { vz: 1 + Math.random(), g: -.05, life: 2, col: '#f4f8f6', tl: .25, gr: .5 });
        if (Math.random() < dt * 10) parts.push({ x: G.x, y: G.y, z: G.z, vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2, vz: 2 + Math.random() * 2.5, g: 9, life: .6, age: 0, col: '#d8eef4', tl: .08 });
      }
      if (!G.dit && dP < 5) { G.dit = true; say('le geyser gronde', 1.6); }
      if (G.t > 2.6) { G.e = 2; G.t = 0; if (dP < 30) SON.jouer('vapeur', { vol: 1 }, G.x, G.y, G.z); }
    } else if (G.e === 2) {
      const du = 4.5 + G.sz * 3, f = Math.max(0, 1 - G.t / du), haut = (11 + G.sz * 5) * (.4 + .6 * Math.min(1, G.t * 3)) * (.35 + .65 * f);
      if (ici) {
        for (let n = 0, m = Math.round(dt * (peu ? 30 : 70)); n < m; n++) parts.push({ x: G.x + (Math.random() - .5) * .35, y: G.y + (Math.random() - .5) * .35, z: G.z + .1,
          vx: (Math.random() - .5) * .9 + wx * .15, vy: (Math.random() - .5) * .9 + wy * .15, vz: haut * (.75 + Math.random() * .35), g: 9.5,
          life: 1.2 + Math.random() * .9, age: 0, col: Math.random() < .6 ? '#eef8fc' : '#bfe2ee', tl: .13 + Math.random() * .1 });
        if (Math.random() < dt * 16) { const zt = G.z + haut * haut / 19 * Math.random();
          bouffee(G.x + (Math.random() - .5), G.y + (Math.random() - .5), zt, { vz: .6, g: -.05, life: 3.5 + Math.random() * 2, col: '#f6f8f8', tl: .55, gr: .5, fin: .3, ve: [wx * .3, wy * .3] }); }
      }
      if (!G.lance && P.pv > 0 && dP < 1.15 && P.z < G.z + 1.2 && f > .2) {   // sur l'évent : en l'air
        G.lance = true; P.vz = 17 + G.sz * 4; P.ground = false; P.z = Math.max(P.z, G.z + .6);   // hors de l'eau, sinon la nage freine
        P.pv = Math.max(.05, P.pv - .04 * vieK()); P.dernierCoup = t;
        say('le geyser vous projette !', 1.8);
      }
      if (G.t > du) { G.e = 0; G.t = 0; G.per = 22 + Math.random() * 38; }
    }
  }
}
// ---------- (§196) ce que l'île fait au corps ----------
// La lave brûle vite, et la brûlure reste deux secondes. Sa chaleur mord qui longe une coulée trop longtemps.
// Le soufre prend à la gorge (le poison : il ne tue pas, l'antidote le chasse). La source d'un bain brûle ;
// les vasques du bas apaisent : elles soignent, et lavent le soufre. Le baume de braise (effet 'braise') protège du feu.
function volcanCorps(dt) {
  const V = VOLC;
  if (P.pv <= 0 || P.monture) return;
  const x = P.x | 0, y = P.y | 0, i = y * WS + x, sol = Hgt[i], b = Bio[i];
  const pied = P.z < sol + .4, feu = !effet('braise');
  const cuir = P.equip.armure === 'cuirbasalte', kC = cuir ? 1 / 3 : 1, kL = cuir ? .5 : 1;   // (§200) la cuirasse de basalte
  // la lave
  if (b === BIO_LAVE && pied && !Eau[i]) {
    if (feu) {
      P.pv = Math.max(0, P.pv - BRULURE * 7 * kL * dt * vieK()); P.dernierCoup = t; P.brulure = Math.max(P.brulure || 0, t + 2);
      if (!V.dit.astuce) { V.dit.astuce = 1; V.dit.lave = t; say('la lave ! sortez-en · un plat de braise protège du feu', 4); } else volcDire('lave', 'la lave ! sortez-en', 1.6, 2.5);   // (§197) la flore du volcan en donne
      if (Math.random() < dt * 14) burst(P.x, P.y, P.z + .2, 1, Math.random() < .5 ? '#ffb040' : '#ff5a18');
      if (P.pv <= 0) { P.brulure = 0; terrasse(); return; }
    }
  }
  // (§199) le sol que le Tisonnier a fait brûler
  if (feu && pied) for (const q of V.feux) if ((q[0] - P.x) ** 2 + (q[1] - P.y) ** 2 < .7 && Math.abs(P.z - q[2]) < 1) {
    P.pv = Math.max(0, P.pv - BRULURE * 3 * kC * dt * vieK()); P.dernierCoup = t; P.brulure = Math.max(P.brulure || 0, t + 1);
    volcDire('feux', 'le sol brûle', 1.4, 3); if (P.pv <= 0) { terrasse(); return; } break; }
  // la chaleur : au bord d'une coulée, trop longtemps
  let pres = false;
  if (b !== BIO_LAVE) for (let dy = -1; dy <= 1 && !pres; dy++) for (let dx = -1; dx <= 1; dx++) {
    const j = i + dy * WS + dx; if (Bio[j] === BIO_LAVE && Math.abs(P.z - Hgt[j]) < 2.5) { pres = true; break; }
  }
  V.chaud = pres ? V.chaud + dt : Math.max(0, V.chaud - dt * 2);
  if (V.chaud > 1.2 && feu) volcDire('chaud', 'la chaleur vous mord', 1.6, 8);
  if (V.chaud > 2.5 && feu) {
    P.pv = Math.max(0, P.pv - BRULURE * .8 * kC * dt * vieK()); P.dernierCoup = t;
    if (Math.random() < dt * 4) burst(P.x, P.y, P.z + .6, 1, '#ff9040');
    if (P.pv <= 0) { terrasse(); return; }
  }
  // le soufre
  let gaz = b === 25 && pied;
  if (!gaz) for (const f of V.fumerolles) if ((f[0] - P.x) ** 2 + (f[1] - P.y) ** 2 < 2.6 && Math.abs(P.z - f[2]) < 2.5) { gaz = true; break; }
  V.gaz = gaz ? V.gaz + dt : Math.max(0, V.gaz - dt * .7);
  if (V.gaz > 2.2 && !effet('antidote') && P.equip.accessoire !== 'masque_filtre') {   // (§200) le masque filtrant
    P.poison = Math.min(t + 10, Math.max(P.poison || 0, t) + dt * 1.6);
    volcDire('gaz', 'le soufre vous prend à la gorge' + (P.objets.masque_filtre ? '' : ' · un masque filtrant vous en protégerait'), 2, 9);
    if ((V.toux -= dt) <= 0) { V.toux = 2.5 + Math.random() * 2; SON.jouer('toux', {}, P.x, P.y, P.z + 1); }
  }
  // les bains
  let bain = -1;
  if (b === BIO_BAIN && Eau[i] && P.z < Eau[i] + .15) {
    let bd = 99;
    for (let k = 0; k < V.bains.length; k++) { const B = V.bains[k], d = Math.hypot(B[0] - P.x, B[1] - P.y); if (d < B[3] + 1.5 && d < bd) { bd = d; bain = k; } }
    if (bain < 0) bain = -2;                           // l'évent d'un geyser
  }
  if (bain !== V.bain && bain !== -1) {
    SON.jouer('plouf', {}, P.x, P.y, P.z);
    if (bain >= 0 && V.bains[bain][5]) say('l\'eau chaude vous apaise', 2);
  }
  V.bain = bain;
  if (bain === -2 || (bain >= 0 && !V.bains[bain][5])) {   // la source, l'évent : ça brûle
    if (feu) {
      P.pv = Math.max(0, P.pv - BRULURE * 2.5 * kC * dt * vieK()); P.dernierCoup = t;
      volcDire('source', 'l\'eau de la source est brûlante', 1.6, 4);
      if (P.pv <= 0) { terrasse(); return; }
    }
  } else if (bain >= 0) {
    P.pv = Math.min(1, P.pv + dt * .03); P.poison = 0; V.gaz = 0;
  }
}

// ---------- le ciel, la brume, le filtre ----------
// Un ciel de cendre, brun le jour, rouge sombre la nuit (la lave éclaire le dessous du panache). (§196) La
// cendre le salit de gris ; l'éruption l'embrase.
function volcanCiel() {
  if (!volcanIci()) return null;
  const l = Math.min(1, clarte()), c = met('cendre'), e = met('erupt');
  let r = 54 + 70 * l, g = 26 + 62 * l, b = 22 + 50 * l;
  r += (36 + 64 * l - r) * c * .6; g += (32 + 60 * l - g) * c * .6; b += (30 + 56 * l - b) * c * .6;
  r += (176 - r) * e * .6; g += (60 - g) * e * .6; b += (28 - b) * e * .6;
  return [r, g, b, .62 + .3 * Math.max(c, e)];
}
function volcanVoile() {
  if (!volcanIci()) return null;
  const n = 1 - Math.min(1, clarte()), c = met('cendre'), e = met('erupt');
  return [.36 - .1 * c + .16 * e, .16 + .06 * c - .04 * e, .07 + .1 * c - .03 * e, .15 + .08 * n + .1 * c + .12 * e];
}
function volcanCss() {
  if (!volcanIci()) return '';
  if (typeof G3 !== 'undefined' && G3.ok && !G3.perdu && (mode === 'fps' || (mode === 'iso' && isoGL))) return '';
  const c = met('cendre'), e = met('erupt');
  return `sepia(${(.28 + .2 * e).toFixed(2)}) saturate(${(1.2 - .4 * c + .4 * e).toFixed(2)}) contrast(1.08) brightness(${(.93 - .12 * c - .05 * e).toFixed(2)}) hue-rotate(${(-10 - 8 * e).toFixed(0)}deg)`;
}

// ---------- (§196) la musique : « Le Cœur de cendre » ----------
// Un ré grave qui respire sous un filtre ; des tambours de peau ; une voix d'anche en mode hijaz (ré, mi bémol,
// fa dièse, sol, la, si bémol, do), qui chante une phrase puis se tait. Le danger (l'éruption, le bord du
// cratère, une bête) resserre les tambours, ouvre la nappe, ajoute une basse en ostinato ; au plus fort, des cuivres.
const VO_HIJAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16];
function volcanMusique(ctx, sortie) {
  const G = ctx.createGain(); G.gain.value = 0; G.connect(sortie);
  const NB = ctx.createBuffer(1, ctx.sampleRate | 0, ctx.sampleRate);
  { const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const Fd = ctx.createBiquadFilter(); Fd.type = 'lowpass'; Fd.frequency.value = 200; Fd.Q.value = 5;
  const Gd = ctx.createGain(); Gd.gain.value = .0001; Fd.connect(Gd); Gd.connect(G);
  const nap = [[36.71, 'sawtooth', .5], [73.42, 'sawtooth', .3], [110, 'triangle', .22], [73.6, 'sawtooth', .25]].map(([f, ty, v]) => {
    const O = ctx.createOscillator(), g = ctx.createGain(); O.type = ty; O.frequency.value = f; g.gain.value = v; O.connect(g); g.connect(Fd); O.start(); return O; });
  const env = (g, t0, a, v, d) => { g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + a); g.gain.exponentialRampToValueAtTime(.0001, t0 + a + d); };
  const fin = (src, nodes, t1) => { src.stop(t1); src.onended = () => nodes.forEach(n => n.disconnect()); };
  function bruit(t0, fq, d, v, ty) {
    const S = ctx.createBufferSource(), F = ctx.createBiquadFilter(), g = ctx.createGain();
    S.buffer = NB; F.type = ty; F.frequency.value = fq; F.Q.value = 1.2; env(g, t0, .003, v, d);
    S.connect(F); F.connect(g); g.connect(G); S.start(t0, Math.random() * .8); fin(S, [S, F, g], t0 + d + .1);
  }
  function tambour(t0, f, v) {                          // une grosse peau : la hauteur qui tombe, le claquement
    const O = ctx.createOscillator(), g = ctx.createGain(); O.type = 'sine';
    O.frequency.setValueAtTime(f * 2.4, t0); O.frequency.exponentialRampToValueAtTime(f, t0 + .07);
    env(g, t0, .004, v, .9); O.connect(g); g.connect(G); O.start(t0); fin(O, [O, g], t0 + 1);
    bruit(t0, 1400, .06, v * .3, 'bandpass');
  }
  function anche(t0, f, d, v) {                         // une anche un peu nasale, qui glisse dans la note et vibre en tenant
    const O = ctx.createOscillator(), L = ctx.createOscillator(), Lg = ctx.createGain(), F = ctx.createBiquadFilter(), g = ctx.createGain();
    O.type = 'sawtooth'; O.frequency.setValueAtTime(f * .985, t0); O.frequency.linearRampToValueAtTime(f, t0 + .12);
    L.frequency.value = 5.2; Lg.gain.setValueAtTime(0, t0); Lg.gain.linearRampToValueAtTime(f * .012, t0 + d * .6);
    L.connect(Lg); Lg.connect(O.frequency);
    F.type = 'bandpass'; F.frequency.value = Math.min(2400, f * 3.2); F.Q.value = 1.4;
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + .09); g.gain.setValueAtTime(v, t0 + d * .75); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + .35);
    O.connect(F); F.connect(g); g.connect(G); O.start(t0); L.start(t0); L.stop(t0 + d + .4); fin(O, [O, L, Lg, F, g], t0 + d + .4);
  }
  function cuivres(t0, f, d, v) {                       // ré, la, mi bémol : la neuvième mineure qui gronde
    for (const k of [1, 1.4983, 2.1189]) {
      const O = ctx.createOscillator(), F = ctx.createBiquadFilter(), g = ctx.createGain();
      O.type = 'sawtooth'; O.frequency.value = f * k; F.type = 'lowpass'; F.Q.value = 2;
      F.frequency.setValueAtTime(150, t0); F.frequency.exponentialRampToValueAtTime(1100, t0 + .3); F.frequency.exponentialRampToValueAtTime(260, t0 + d);
      env(g, t0, .08, v, d); O.connect(F); F.connect(g); g.connect(G); O.start(t0); fin(O, [O, F, g], t0 + d + .2);
    }
  }
  const st = { vu: -9, fin: 0, k: 0, mel: [], mi: 0, att: 0, deg: 2, repos: 1 };
  const PAS = 60 / 66 / 2;                              // une croche, à 66 la noire
  return {
    maj(now, I) {
      I = Math.max(0, Math.min(1, I));
      if (now - st.vu > .6) Object.assign(st, { fin: now + .1, k: 0, mel: [], att: 0, repos: 1 });
      st.vu = now;
      G.gain.cancelScheduledValues(now); G.gain.setValueAtTime(1, now); G.gain.setTargetAtTime(0, now + .6, .25);   // l'homme mort
      Fd.frequency.setTargetAtTime(150 + 420 * I + 90 * Math.sin(now * .35), now, .4);   // la nappe respire
      Gd.gain.setTargetAtTime(.05 + .06 * I, now, 1.5);
      nap[3].frequency.setTargetAtTime(73.42 * (1 + .006 * Math.sin(now * .17)), now, .5);   // la voix désaccordée qui bat
      while (st.fin < now + .7) {
        const t0 = Math.max(st.fin, now), s = st.k % 16;
        const don = [0, 6, 8, 11].includes(s) || (I > .45 && [3, 14].includes(s)) || (I > .8 && [2, 10, 12, 15].includes(s));
        if (don) tambour(t0, s === 0 || s === 8 ? 52 : 64, (s === 0 ? .32 : .2) * (.55 + .35 * I));
        if (I > .3 && (s === 4 || s === 12)) bruit(t0, 2600, .05, .05 + .05 * I, 'highpass');   // le bord de la peau
        if (I > .6 && s % 2 && Math.random() < .5) bruit(t0, 5200, .02, .02 + .02 * I, 'highpass');   // des braises qui crépitent
        if (I > .4 && [0, 3, 6].includes(s % 8)) anche(t0, 73.42 * (s % 8 === 6 ? 1.0595 : 1), PAS * 1.6, .05 + .03 * I);   // la basse, 3 + 3 + 2
        if (I > .82 && st.k % 32 === 0) cuivres(t0, 36.71, PAS * 10, .07);
        if (st.repos > 0) { if (s === 15) st.repos--; }
        else {
          if (!st.mel.length) {
            const n = 4 + (Math.random() * 4 | 0); let d = st.deg;
            for (let i = 0; i < n; i++) { d = Math.max(0, Math.min(VO_HIJAZ.length - 1, d + [-2, -1, -1, 1, 1, 2][Math.random() * 6 | 0])); st.mel.push({ d, b: [2, 2, 3, 4, 1][Math.random() * 5 | 0] }); }
            const z = st.mel[n - 1]; z.b = 6; z.d = Math.random() < .6 ? 0 : 4;   // elle retombe sur ré, ou sur la
            st.deg = z.d; st.mi = 0; st.att = 0;
          }
          if (st.att <= 0) {
            const m = st.mel[st.mi++];
            anche(t0, 146.83 * 2 ** (VO_HIJAZ[m.d] / 12), m.b * PAS, .045);
            st.att = m.b;
            if (st.mi >= st.mel.length) { st.mel = []; st.repos = 1 + (Math.random() * (3 - 2 * I) | 0); }
          }
          st.att--;
        }
        st.fin = t0 + PAS; st.k++;
      }
    },
  };
}
// Le danger, pour la musique : l'éruption, le bord du cratère, l'orage, une bête qui vous chasse, la vie basse.
function volcanIntensite() {
  const V = VOLC;
  let I = .28 + .72 * met('erupt');
  if ((P.x - V.cx) ** 2 + (P.y - V.cy) ** 2 < (V.rc * 2.5) ** 2) I = Math.max(I, .55);
  if (met('foudre') > .5) I = Math.max(I, .5);
  if (P.pv < .3) I = Math.max(I, .7);
  { const A = V.alpha; if (A && !A.dead && (A.phaseT === 'combat' || A.phaseT === 'surgir') && Math.hypot(A.x - P.x, A.y - P.y) < 50) I = 1; }   // (§199) le Tisonnier
  for (const b of beasts) if (!b.dead && !b.tame && b.cible === P && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 324) { I = Math.max(I, .85); break; }
  V.I = (V.I ?? .3) + (I - (V.I ?? .3)) * (I > (V.I ?? .3) ? .2 : .02);
  return V.I;
}

// ============ (§198) LA FAUNE DU VOLCAN ============
// Trois bêtes qu'on ne voit qu'ici, toutes trois grandes :
//  - le Magmaton : une tortue-montagne, sa carapace un dôme d'orgues de basalte, joints de lave, un petit cratère
//    qui fume au sommet. Il broute la cendre, en troupeau lent ; le sol tremble à ses pas ; frappé, il fait front.
//  - le Basilic de lave : un saurien de trois cases, épines de feu sur l'échine, fissures de lave aux flancs, une
//    collerette qui s'embrase à la chasse, une gueule-four. Il chasse le magmaton, et vous quand il a faim ; il brûle.
//  - le Charognard de cendre : un vautour aux plumes de braise, plus de deux cases d'envergure. Il tourne sur les
//    colonnes chaudes (le cratère, les soufrières) ; il vous suit, tourne au-dessus de vous, et fond sur les blessés.
// Leurs os sont faits ici (osVolcan) ; les pièces { lave: 1 } ont le rendu de la lave dans la carte graphique.
const LAVE_C = [255, 128, 40];
const VOLCAN_SPEC = [
  { id:'magmaton', n:'Magmaton', volcan:1, corps:'magmaton', diet:'h', sz:2.5, spd:.9, vue:14, peur:.05, herd:1, cap:5, mat:260,
    shell:[64,60,66], dark:[40,36,42], leg:[82,72,68], ventre:[120,104,92], oeil:[255,170,60], bio:[28,27,24,31],
    chasse:[], dur:3.2, riposte:.9, lueur:1.4, lien:.2, travail:{ pierre:1.4 }, metier:'brise la roche, et porte la pierre', grimpe:0 },
  { id:'basilic', n:'Basilic de lave', volcan:1, corps:'basilic', diet:'o', sz:2.3, spd:2.9, vue:22, peur:0, herd:0, cap:3, mat:200,
    shell:[34,28,32], dark:[62,50,56], leg:[34,28,32], ventre:[132,72,52], oeil:[255,224,90], bio:[28,27,24,26,25],
    chasse:['magmaton'], brule:1, dur:1.8, lueur:2.2, lien:.1, travail:{ os:1 }, metier:'chasse au bord de la lave, et rapporte les os', grimpe:.5 },
  { id:'vautour', n:'Charognard de cendre', volcan:1, vautour:1, corps:'vautour', diet:'c', sz:1.7, spd:3, vue:30, peur:.3, herd:0, cap:4, mat:180,
    shell:[58,52,54], dark:[34,30,32], leg:[200,120,100], peau:[214,96,70], bec:[226,214,186], oeil:[30,20,20], bio:[28,27,24],
    chasse:[], lien:0, travail:{}, volK:{ om:.8, freq:.55, marge:2.4 }, metier:'tourne sur les colonnes chaudes, et fond sur les blessés', grimpe:0 },
];
function vOutils(f, B) {
  const K = echB(f);
  const fo = (F, a, b, w, h, c, x) => { const o = Object.assign({ a, b, w: w * K, h: h * K, c }, F, x); B.push(o); return o; };
  return {
    bo: (a, b, w, h, c, r = .6, n = 4, x) => fo({ boule: n, rond: r }, a, b, w, h, c, x),
    pr: (a, b, w, h, c, fin = 1, n = 6, r = .8, x) => fo(fin === 1 ? { pans: n, rond: r } : { pans: n, rond: r, fin }, a, b, w, h, c, x),
    pe: (a, b, w, h, c, fin = 1, x) => fo(fin === 1 ? {} : { fin }, a, b, w, h, c, x),
  };
}
function osVolcan(f) {
  const c = f.sp.corps;
  return c === 'magmaton' ? osMagmaton(f) : c === 'basilic' ? osBasilic(f) : c === 'tisonnier' ? osTisonnier(f) : osVautour(f);
}
const LV = { lave: 1 }, LU = { luit: true };
function lisseur(f) {
  const dtl = Math.min(.1, Math.max(0, t - (f._osT ?? t))); f._osT = t;
  return (k, c, v) => { const a = f[k] ?? c; return f[k] = a + (c - a) * Math.min(1, dtl * v); };
}
// ---------- le magmaton ----------
function osMagmaton(f) {
  const sp = f.sp, B = [], { bo, pr, pe } = vOutils(f, B), lis = lisseur(f);
  const dk = Math.min(1, (f.dead || 0) * 2.6), v = f.dead ? 0 : (f.vit || 0), R = repere(f);
  const broute = lis('_br', f.etat === 'brouter' && v < .3 && !f.dead ? 1 : 0, 1.2);
  const dort = lis('_do', f.etat === 'dormir' && !f.dead ? 1 : 0, .8);
  const colere = lis('_co', !f.dead && (f.as || f.etat === 'défendre' || f.etat === 'acculé' || (f.alarm || 0) > .5) ? 1 : 0, 3);
  const souffle = Math.sin(t * 1.1 + f.bob) * .5 + .5;
  // le pas : le corps roule vers la patte qui porte, et monte un peu
  let roule = 0, hop = 0;
  for (const ft of f.feet || []) if (ft.step > 0) { const l = Math.sin((1 - ft.step) * Math.PI); roule -= ft.s * l * .025; hop += l * .01; }
  const bz = .3 + hop - dort * .1 - dk * .16 + souffle * .008, cr = Math.cos(roule), sr = Math.sin(roule);
  const T = p => [p[0], p[1] * cr - (p[2] - bz) * sr, bz + p[1] * sr + (p[2] - bz) * cr];
  const roc = sp.shell, roc2 = sp.dark, peau = sp.leg, ventre = sp.ventre, obs = [26, 22, 30];
  // le plastron ; sous les colonnes, la croûte sombre du dôme
  bo(T([-.3, 0, bz - .1]), T([.28, 0, bz - .1]), .52, .12, ventre, .5, 4);
  bo(T([-.29, 0, bz + .04]), T([.27, 0, bz + .06]), .54, .3, roc2, .5, 4);
  // la carapace : un dôme d'orgues de basalte — une colonne au sommet, deux couronnes autour, plus larges que hautes
  const col = (x, y, z0, z1, w, c) => pr(T([x, y, z0]), T([x, y, z1]), w, w, c, 1, 6, .85);
  col(0, 0, bz + .16, bz + .34, .14, roc);
  for (let k = 0; k < 6; k++) { const a = k * 1.0472 + .5; col(Math.cos(a) * .16, Math.sin(a) * .14, bz + .08, bz + .28 - .02 * (k % 2), .13, k % 2 ? roc : roc2); }
  for (let k = 0; k < 11; k++) { const a = k * .5712; col(Math.cos(a) * .3, Math.sin(a) * .25, bz - .03, bz + .17 - .03 * (k % 3), .12, k % 3 ? roc2 : roc); }
  // les joints de lave : des fentes qui rayonnent du sommet entre les colonnes, et en couronne ; elles battent
  for (let k = 0; k < 6; k++) { const a = k * 1.0472; pe(T([Math.cos(a) * .07, Math.sin(a) * .06, bz + .33]), T([Math.cos(a) * .22, Math.sin(a) * .19, bz + .24]), .025, .03, LAVE_C, 1, LV); }
  for (let k = 0; k < 11; k++) { const a = k * .5712 + .2856; pe(T([Math.cos(a) * .22, Math.sin(a) * .19, bz + .24]), T([Math.cos(a) * .36, Math.sin(a) * .3, bz + .1]), .022, .028, LAVE_C, 1, LV); }
  // la jupe : des écailles plates en couronne, qui débordent
  for (let k = 0; k < 14; k++) { const a = k * .4488, x = Math.cos(a), y = Math.sin(a); pe(T([x * .31, y * .26, bz - .03]), T([x * .4, y * .33, bz - .08]), .11, .04, roc2); }
  // le petit cratère du sommet : cinq dents autour d'un œil de lave (il fume : majVolcan)
  bo(T([0, 0, bz + .33]), T([0, 0, bz + .35]), .08, .04, LAVE_C, .6, 3, LV);
  for (let k = 0; k < 5; k++) { const a = k * 1.2566; pr(T([Math.cos(a) * .05, Math.sin(a) * .05, bz + .32]), T([Math.cos(a) * .065, Math.sin(a) * .065, bz + .4]), .035, .035, roc2, .5, 6); }
  // le cou, la tête : basse et lourde ; au pâturage, au sol ; en colère, levée, la gueule qui rougeoie
  const bal = Math.sin((f.ph || 0) * 6.2832) * .02 * Math.min(1, v / .4);
  let cou = [.36, bal, bz + .04], tete = [.52, bal * 1.5, bz + .02];
  cou = mixP(cou, [.38, 0, bz - .06], broute); tete = mixP(tete, [.55, 0, .07], broute);
  cou = mixP(cou, [.37, 0, bz + .1], colere * (1 - broute)); tete = mixP(tete, [.56, 0, bz + .12], colere * (1 - broute));
  cou = mixP(cou, [.32, 0, bz - .08], dort); tete = mixP(tete, [.45, 0, .07], Math.max(dort, dk));
  bo(T([.24, 0, bz - .02]), cou, .24, .22, peau, .6, 4);
  for (const u of [.35, .65]) { const p = mixP(cou, tete, u); bo([p[0] - .02, p[1], p[2]], [p[0] + .02, p[1], p[2]], .23 - u * .04, .22 - u * .04, roc2, .7, 3); }   // les plis
  bo(cou, tete, .2, .19, peau, .6, 4);
  const [hx, hy, hz] = tete, mach = colere * (.5 + .5 * Math.sin(t * 7)) * .05 + broute * (Math.sin(t * 3 + f.bob) * .5 + .5) * .018;
  bo([hx - .04, hy, hz + .01], [hx + .11, hy, hz + .01], .22, .18, peau, .55, 4);                       // le crâne, massif
  pr([hx + .09, hy, hz + .04], [hx + .22, hy, hz - .04], .14, .13, obs, 0, 6, .8);                     // le bec, crochu
  pr([hx + .07, hy, hz - .05 - mach], [hx + .18, hy, hz - .08 - mach * 1.5], .12, .06, obs, .2, 6, .8);
  pr([hx - .02, hy, hz + .09], [hx - .13, hy, hz + .19], .13, .1, roc, .4, 6);                          // la plaque du front
  for (const s of [-1, 1]) {
    bo([hx + .05, hy + s * .09, hz + .05], [hx + .07, hy + s * .095, hz + .05], .045, dort > .5 ? .01 : .04, sp.oeil, 1, 3, LU);
    pe([hx + .03, hy + s * .095, hz + .085], [hx + .09, hy + s * .09, hz + .09], .025, .02, roc2);
  }
  if (colere > .3) bo([hx + .07, hy, hz - .03], [hx + .16, hy, hz - .04 - mach], .08, .05 * colere, LAVE_C, .6, 3, LV);   // la gueule, un four
  pr(T([-.32, 0, bz - .04]), T([-.45, Math.sin(t * .8 + f.bob) * .03, bz - .12]), .1, .09, peau, .25, 6);   // la queue
  // les pattes : des piliers, le genou cuirassé, un pied large, des ongles d'obsidienne
  for (const ft of f.feet || []) {
    const av = ft.i === 0, s = ft.s, H = T([av ? .2 : -.19, s * .2, bz - .06]);
    const Pd = aPortee(H, piedLocal(f, ft, R, PATTES_T.magmaton.haut, [H[0], s * .26, .06]), .33);
    const G = genou(H, Pd, .17, .165, [av ? .4 : -.4, s * .5, 0]);
    bo(H, G, .17, .17, peau, .6, 4);
    bo([G[0], G[1], G[2] + .012], [G[0], G[1], G[2] - .012], .15, .15, roc2, .7, 3);
    pr(G, Pd, .15, .15, peau, .9, 8, .9);
    bo([Pd[0], Pd[1], Pd[2] + .02], [Pd[0] + .02, Pd[1], Pd[2] + .03], .19, .06, peau, .6, 3);
    for (const o of [-1, 0, 1]) pr([Pd[0] + .07, Pd[1] + o * .05, Pd[2] + .02], [Pd[0] + .11, Pd[1] + o * .06, Pd[2] + .005], .04, .035, obs, 0, 6);
  }
  return B;
}
// ---------- le basilic de lave ----------
function osBasilic(f) {
  const sp = f.sp, B = [], { bo, pr, pe } = vOutils(f, B), lis = lisseur(f);
  const dk = Math.min(1, (f.dead || 0) * 2.6), v = f.dead ? 0 : (f.vit || 0), R = repere(f);
  const ph = (f.ph || 0) * 6.2832, marche = Math.min(1, v / .5);
  const chasse = lis('_ch', !f.dead && (f.as || f.etat === 'traquer' || f.etat === 'chasser' || f.etat === 'assaut' || (f.alarm || 0) > .5) ? 1 : 0, 3);
  const ram = f.dead ? 0 : f.ramasse || 0, rugit = lis('_ru', f.as && f.as.phase !== 'ramasse' ? 1 : 0, 10);
  const ouvre = Math.max(ram, rugit * .8, chasse * (.12 + Math.max(0, Math.sin(t * 2.3 + f.bob)) * .12));
  const noir = sp.shell, gris = sp.dark, ventre = sp.ventre;
  // l'échine : dix points, une onde qui court du cou à la queue, plus ample vers le bout
  const bz = .19 - dk * .1 + Math.abs(Math.sin(ph)) * .012 * marche - ram * .04;
  const ond = x => Math.sin(ph - x * 5.5 + t * (1 - marche) * .9) * (.05 * marche + .015 + (1 - marche) * .01) * (x < .2 ? 1 : 1.4);
  const xs = [.46, .32, .16, 0, -.16, -.3, -.46, -.62, -.78, -.94];
  const Q = xs.map((x, i) => [x, ond(x) * (i < 2 ? .4 : 1), bz + (i < 6 ? 0 : -(i - 5) * .025) + (i === 0 ? .04 + chasse * .03 : 0)]);
  const larg = [.15, .19, .22, .23, .21, .17, .12, .09, .065, .045], haut = [.13, .15, .16, .16, .15, .13, .09, .07, .05, .04];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = Q[i + 1], b = Q[i];
    bo(a, b, larg[i], haut[i], i % 2 ? noir : gris, .55, 4);
    if (i < 6) bo([a[0], a[1], a[2] - haut[i] * .3], [b[0], b[1], b[2] - haut[i] * .3], larg[i] * .8, haut[i] * .4, ventre, .6, 3);
    if (i >= 1 && i <= 6) for (const s of [-1, 1]) pe([a[0] + .02, a[1] + s * larg[i] * .48, a[2] + .01], [b[0] - .02, b[1] + s * larg[i] * .48, b[2] + .02], .015, .02, LAVE_C, 1, LV);   // les fissures
    const m = mixP(a, b, .5), hs = (.06 + .07 * chasse) * (i < 7 ? 1 : .6) * (i === 0 ? .6 : 1), w0 = Math.max(.012, .05 * (1 - i * .07));
    const base = [m[0], m[1], m[2] + haut[i] * .45], tip = [m[0] - .04, m[1], base[2] + hs], mid = mixP(base, tip, .6);
    pr(base, mid, w0, w0 * .6, gris, .5, 4);
    pr(mid, tip, w0 * .6, w0 * .4, LAVE_C, 0, 4, .8, LV);                                                // l'épine, la pointe en feu
  }
  bo(Q[9], [Q[9][0] - .05, Q[9][1], Q[9][2]], .05, .05, LAVE_C, .6, 3, LV);                               // la braise au bout de la queue
  // la tête : un crâne plat, un museau, une mâchoire qui s'ouvre sur un four ; des cornes en arrière
  const h0 = [Q[0][0] + .02, Q[0][1], Q[0][2] + .01], h1 = [Q[0][0] + .22, Q[0][1] + ond(.6) * .3, Q[0][2] - .01 + ram * .03];
  bo(h0, h1, .15, .11, noir, .55, 4);
  pr([h1[0] - .02, h1[1], h1[2] + .01], [h1[0] + .07, h1[1], h1[2] - .01], .1, .07, noir, .6, 6);
  pr([h0[0] + .03, h0[1], h0[2] - .04], [h1[0] + .06, h1[1], h1[2] - .05 - ouvre * .1], .12, .045, gris, .5, 6);
  if (ouvre > .08) bo([h0[0] + .06, h0[1], h0[2] - .02], [h1[0] + .02, h1[1], h1[2] - .04 - ouvre * .05], .08, .03 + ouvre * .04, LAVE_C, .6, 3, LV);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) { const p = mixP([h0[0] + .04, h0[1] + s * .045, h0[2] - .03], [h1[0] + .05, h1[1] + s * .03, h1[2] - .03], .35 + k * .22); pr(p, [p[0], p[1], p[2] - .03], .015, .015, [236, 226, 200], 0, 4); }
    bo([h0[0] + .1, h0[1] + s * .06, h0[2] + .035], [h0[0] + .12, h0[1] + s * .062, h0[2] + .035], .03, .022, sp.oeil, 1, 3, LU);
    pr([h0[0] + .02, h0[1] + s * .05, h0[2] + .05], [h0[0] - .1, h0[1] + s * .1, h0[2] + .1], .045, .04, gris, .3, 6);
    pr([h0[0] - .1, h0[1] + s * .1, h0[2] + .1], [h0[0] - .16, h0[1] + s * .1, h0[2] + .16], .03, .03, gris, 0, 6);
  }
  // la collerette : sept lames qui se déploient à la chasse, leur bord s'embrase
  const fl = .25 + .75 * chasse;
  for (let k = 0; k < 7; k++) {
    const a = (k - 3) * .38 * (.6 + .4 * fl), s = Math.sin(a), c = Math.cos(a), r = .07 + .12 * fl;
    const base = [Q[0][0] - .02, Q[0][1] + s * .08, Q[0][2] + c * .05], bout = [base[0] - .05 * fl, base[1] + s * r, base[2] + c * r * .9];
    pe(base, bout, .05, .012, k % 2 ? gris : noir, .4);
    if (fl > .5) pe(bout, [bout[0] - .01, bout[1] + s * .025, bout[2] + c * .022], .03, .01, LAVE_C, 1, LV);
  }
  // les pattes : écartées, le coude en dehors et en l'air, trois griffes
  for (const ft of f.feet || []) {
    const av = ft.i === 0, s = ft.s, H = [av ? .22 : -.26, Q[av ? 2 : 5][1] + s * .1, bz - .02];
    const Pd = aPortee(H, piedLocal(f, ft, R, PATTES_T.basilic.haut, [H[0] - .05, s * .2, .08]), .3);
    const G = genou(H, Pd, .15, .155, [av ? -.3 : .3, s, .9]);
    bo(H, G, .085, .08, noir, .6, 4);
    pr(G, Pd, .07, .065, gris, .8, 6);
    for (const o of [-1, 0, 1]) pr([Pd[0], Pd[1] + o * .025, Pd[2] + .01], [Pd[0] + .07, Pd[1] + o * .04 + s * .01, Pd[2]], .022, .018, [30, 24, 30], 0, 4);
  }
  return B;
}
// ---------- le charognard de cendre ----------
function osVautour(f) {
  const sp = f.sp, B = [], { bo, pr, pe } = vOutils(f, B);
  const dk = Math.min(1, (f.dead || 0) * 2.6), vol = !!f.enVol && !f.dead, bat = vol ? f.bat || 0 : 0, ph = f.ph || 0;
  const bz = vol ? 0 : .12 - dk * .06;
  const plume = sp.shell, sombre = sp.dark, peau = sp.peau, bec = sp.bec, fraise = [150, 140, 136];
  const ang = vol ? (bat > .05 ? Math.sin(ph) * .85 * bat + .1 : .16) : -.04;    // le battement ; en plané, un dièdre ; à terre, à plat
  for (const s of [-1, 1]) {
    const a1 = ang, a2 = ang * 1.25 + (bat > .05 ? Math.sin(ph - .6) * .15 * bat : 0);
    const Sh = [.04, s * .07, bz + .03];
    const E = [Sh[0] - .02, Sh[1] + s * .3 * Math.cos(a1), Sh[2] + .3 * Math.sin(a1)];
    const W = [E[0] - .04, E[1] + s * .26 * Math.cos(a2), E[2] + .26 * Math.sin(a2)];
    pe(Sh, E, .24, .025, plume); pe(E, W, .22, .022, plume);
    pe([Sh[0] + .03, Sh[1], Sh[2] + .012], [E[0] + .03, E[1], E[2] + .012], .1, .02, fraise);            // les couvertures, plus claires
    for (let k = 0; k < 5; k++) {                                                                         // les rémiges : des doigts écartés
      const l = .3 - k * .025, a3 = a2 * 1.1, tip = [W[0] - .05 - k * .06, W[1] + s * l * Math.cos(a3), W[2] + l * Math.sin(a3)];
      pe(W, tip, .055, .015, sombre);
      pe(mixP(W, tip, .78), tip, .05, .018, LAVE_C, 1, LV);                                              // la pointe, une braise
    }
  }
  bo([-.16, 0, bz], [.1, 0, bz + .02], .16, .14, plume, .6, 4);
  bo([.07, 0, bz + .03], [.13, 0, bz + .04], .17, .15, fraise, .7, 4);                                   // la fraise de plumes
  pr([.12, 0, bz + .04], [.2, 0, bz + .07], .05, .05, peau, .8, 6);                                      // le cou nu
  bo([.19, 0, bz + .07], [.26, 0, bz + .065], .075, .065, peau, .6, 3);
  pr([.25, 0, bz + .07], [.31, 0, bz + .05], .04, .045, bec, .5, 6); pr([.31, 0, bz + .05], [.32, 0, bz + .022], .025, .03, bec, 0, 6);
  for (const s of [-1, 1]) pe([.23, s * .035, bz + .085], [.24, s * .036, bz + .085], .015, .015, sp.oeil);
  for (let k = -2; k <= 2; k++) pe([-.15, k * .02, bz], [-.32, k * .05, bz - .01 - (vol ? 0 : .03)], .05, .012, sombre);   // la queue en éventail
  for (const s of [-1, 1]) {
    if (vol) pe([-.04, s * .04, bz - .05], [-.14, s * .04, bz - .08], .025, .025, sp.leg);               // repliées
    else { pe([0, s * .04, bz - .04], [.01, s * .05, .01], .025, .025, sp.leg); pr([.01, s * .05, .01], [.05, s * .05, 0], .02, .02, [40, 36, 34], 0, 4); }
  }
  if (vol) { const r = f.roll || 0, c = Math.cos(r), s2 = Math.sin(r), T = p => [p[0], p[1] * c - p[2] * s2, p[1] * s2 + p[2] * c];
    for (const o of B) { o.a = T(o.a); o.b = T(o.b); } }
  return B;
}
// La vie du charognard : il plane en cercle sur une colonne chaude, vous suit et tourne au-dessus de vous,
// fond sur vous en piqué (bien plus volontiers si vous êtes blessé), remonte ; frappé, il s'enfuit.
function majVautour(b, dt) {
  const V = VOLC;
  b.t += dt; b.age += dt; b.bob += dt * 2;
  if (b.hit > 0) b.hit -= dt;
  if (b.dead) {                                          // abattu : il tombe en vrille
    b.dead += dt; b.bat = 0;
    if (b.solMort === undefined) {
      b.enVol = false; b.vz = (b.vz || 0) - 16 * dt; b.z += b.vz * dt; b.roll = (b.roll || 0) + dt * 3;
      b.v = (b.v || 0) * (1 - Math.min(1, dt * 1.2)); b.x += Math.cos(b.dir) * b.v * dt; b.y += Math.sin(b.dir) * b.v * dt;
      const fl = hRendu(b.x, b.y);
      if (b.z <= fl) { b.z = fl; b.vz = 0; b.v = 0; b.solMort = fl; b.roll = 0; b.tang = 0; burst(b.x, b.y, b.z + .1, 8, '#4a4442'); }
    }
    return;
  }
  b.faim = 0; b.soif = 0;
  if (b.pv <= 0) { mourirBete(b, 'abattu'); return; }
  if (b.pv < 1) b.pv = Math.min(1, b.pv + dt * .01);
  if (b.alarm > 0) b.alarm -= dt * .4;
  if (!b.enVol) { b.enVol = true; b.etat = 'planer'; b.vz = 3; b.v = 2.4; b.bat = 1; }
  if (Math.abs(b.vx) + Math.abs(b.vy) > .05) { b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 1 - Math.min(1, dt * 6); b.vy *= 1 - Math.min(1, dt * 6); }
  const J = typeof JC !== 'undefined' ? JC : P, dJ = Math.hypot(J.x - b.x, J.y - b.y), sJ = sol(J.x, J.y);
  if (b.hit > 0 && b.etat !== 'fuir') { b.etat = 'fuir'; b.fuiteT = 5 + Math.random() * 3; b.alarm = 1; }
  b.eT = (b.eT || 0) + dt;
  const change = e => { b.etat = e; b.eT = 0; };
  // la colonne chaude où il tourne : le cratère, une soufrière, une bouche ; il en change de temps en temps
  if (!b.th || b.t > (b.thT || 0)) {
    const L = [[V.cx, V.cy, V.zLac + 12]];
    for (const q of V.fumerolles) L.push([q[0], q[1], q[2] + 9]);
    for (const q of V.bouches) L.push([q[0], q[1], q[2] + 10]);
    b.th = L[Math.random() < .4 ? 0 : (Math.random() * L.length) | 0]; b.thT = b.t + 30 + Math.random() * 40; b.thR = 6 + Math.random() * 7; b.thA = Math.random() * 6.28;
  }
  const blesse = J.pv !== undefined && J.pv < .5, nuit = lumiere() < .38;
  switch (b.etat) {
    case 'fuir': {
      const a = Math.atan2(b.y - J.y, b.x - J.x);
      volerVers(b, b.x + Math.cos(a) * 8, b.y + Math.sin(a) * 8, sol(b.x, b.y) + 12, 5, 'bat', dt);
      if ((b.fuiteT -= dt) <= 0) change('planer');
      break; }
    case 'guetter': {                                    // il tourne au-dessus de vous
      b.thA += dt * 3.2 / 6;
      volerVers(b, J.x + Math.cos(b.thA) * 6, J.y + Math.sin(b.thA) * 6, sJ + 9 + Math.sin(b.t * .4) * 1.5, 3.2, 'plane', dt);
      if (dJ > 40 || nuit) change('planer');
      else if (b.eT > (blesse ? 3 : 9) && Math.random() < dt * (blesse ? .6 : .12)) { change('piquer'); b.cri = 1; }
      break; }
    case 'piquer': {                                     // le piqué : vers vous, un peu en avant de votre course
      const lx = J.x + (J.vx || 0) * .35, ly = J.y + (J.vy || 0) * .35;
      volerVers(b, lx, ly, (J.z || sJ) + .8, 8, 'pique', dt);
      if (dJ < 7) b.dir = b.dirT = Math.atan2(ly - b.y, lx - b.x);   // au bout du piqué, il ne lâche plus sa cible
      const dzJ = b.z - ((J.z || sJ) + .8);
      if (dJ < 1.5 && Math.abs(dzJ) < 1.7) {
        if (J === P && P.pv > 0 && !P.invincible && !(P.hurt > 0)) {
          P.pv = Math.max(0, P.pv - degSubi(.05)); P.dernierCoup = t; P.hurt = .6;
          const a = Math.atan2(P.y - b.y, P.x - b.x); P.vx = Math.cos(a) * 3.5; P.vy = Math.sin(a) * 3.5; P.recul = .2;
          volcDire('vautour', 'un charognard vous lacère', 1.6, 3); SON.jouer('lacere', {}, P.x, P.y, P.z + 1); burst(P.x, P.y, P.z + 1, 6, '#c86a5a');
          if (P.pv <= 0) terrasse();
        }
        change('remonter');
      } else if (b.eT > 4.5 || b.z < sol(b.x, b.y) + .5) change('remonter');
      break; }
    case 'remonter': {
      volerVers(b, b.x + Math.cos(b.dir) * 8, b.y + Math.sin(b.dir) * 8, sol(b.x, b.y) + 11, 4.2, 'bat', dt);
      if (b.eT > 2.6) change(dJ < 26 && !nuit ? 'guetter' : 'planer');
      break; }
    default: {                                           // planer : en cercle sur sa colonne chaude
      b.thA += dt * 3 / b.thR;
      volerVers(b, b.th[0] + Math.cos(b.thA) * b.thR, b.th[1] + Math.sin(b.thA) * b.thR, Math.max(b.th[2], sol(b.x, b.y) + 7) + Math.sin(b.t * .3 + b.bob) * 2, 3, 'plane', dt);
      if (b.etat !== 'planer') b.etat = 'planer';
      if (!nuit && dJ < 28 && Math.random() < dt * (blesse ? .5 : .04)) change('guetter');
    }
  }
  const fl = hRendu(b.x, b.y) + .35;                     // jamais dans la roche, même au bout du piqué
  if (b.z < fl) { b.z = fl; if (b.vz < 0) b.vz = 0; }
}
// La faune, vue de près : on l'annonce à la première rencontre ; le magmaton fume par son cratère et le sol tremble
// à ses pas ; le basilic qui chasse crache des étincelles.
function majFauneVolcan(dt) {
  const V = VOLC; V.vus = V.vus || {};
  for (const b of beasts) {
    if (!b.sp.volcan || b.dead) continue;
    const d = Math.hypot(b.x - P.x, b.y - P.y); if (d > 30) continue;
    const id = b.sp.id;
    if (!V.vus[id] && d < 16) {
      V.vus[id] = 1;
      say({ magmaton: 'un magmaton · une montagne qui marche', basilic: 'un basilic de lave · sa collerette s\'embrase quand il chasse', vautour: 'des charognards de cendre tournent sur les fumées' }[id], 3.5);
    }
    if (id === 'magmaton') {
      const { put } = posBete(b);
      if (Math.random() < dt * 1.2) { const p = put([0, 0, .7]); bouffee(p[0], p[1], p[2], { vz: .9, g: -.05, life: 3, col: Math.random() < .5 ? '#4a4240' : '#6a605a', tl: .18, gr: .6, fin: .3 }); }
      for (const ft of b.feet || []) {
        if (ft.step > 0 && ft.step < .12 && !ft._tape) {
          ft._tape = true;
          if (d < 14) { P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .18 * (1 - d / 14)); }
          if (d < 20) SON.jouer('pilon', { vol: .3 * (1 - d / 20) }, ft.tx, ft.ty, ft.tz);
          burst(ft.tx, ft.ty, ft.tz + .05, 3, '#6a625c');
        } else if (ft.step === 0) ft._tape = false;
      }
    } else if (id === 'basilic' && (b.alarm > .4 || b.as) && Math.random() < dt * 6) {
      const { put } = posBete(b), p = put([.62, 0, .16]);
      parts.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - .5), vy: (Math.random() - .5), vz: .5 + Math.random(), g: 3, life: .6, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .06 });
    }
  }
}
// leurs icônes du journal (16 × 16)
function dessinVolcan(d, sp) {
  if (sp.corps === 'magmaton') {
    for (const x of [4, 6, 10, 12]) d.ligne(x, 11, x, 14, sp.leg, 2);
    d.rect(3, 6, 13, 11, sp.shell); d.rect(5, 4, 11, 6, sp.dark); d.rect(7, 3, 9, 4, sp.dark);
    d.ligne(4, 8, 12, 8, [255, 128, 40]); d.ligne(8, 5, 8, 10, [255, 128, 40]); d.net(8, 3, [255, 160, 60]);
    d.rect(13, 8, 15, 10, sp.leg); d.net(14, 8, sp.oeil);
  } else if (sp.corps === 'basilic') {
    d.ligne(1, 10, 14, 9, sp.shell, 3); d.ligne(0, 11, 3, 11, sp.shell);
    for (const x of [3, 6, 9, 12]) d.net(x, 7, [255, 128, 40]);
    d.rect(12, 8, 15, 10, sp.shell); d.net(14, 8, sp.oeil); d.ligne(13, 10, 15, 11, [255, 128, 40]);
    for (const x of [4, 10]) d.ligne(x, 11, x - 1, 13, sp.dark);
  } else if (sp.corps === 'tisonnier') {
    for (const x of [4, 7]) d.ligne(x, 11, x, 14, sp.dark, 2);
    d.rect(3, 6, 12, 11, sp.shell); d.rect(6, 3, 10, 6, sp.dark); d.net(8, 3, [255, 128, 40]); d.ligne(5, 8, 11, 8, [255, 128, 40]);
    d.rect(11, 9, 14, 12, sp.dark); d.net(13, 10, sp.oeil); d.ligne(14, 6, 15, 14, [60, 54, 58]); d.ligne(15, 11, 15, 14, [255, 128, 40]);
  } else {
    d.ligne(1, 6, 7, 8, sp.dark, 2); d.ligne(9, 8, 15, 6, sp.dark, 2); d.net(1, 6, [255, 128, 40]); d.net(15, 6, [255, 128, 40]);
    d.rect(6, 7, 10, 10, sp.shell); d.rect(7, 4, 9, 6, sp.peau); d.net(10, 5, sp.bec);
  }
}

// ============ (§199) L'ALPHA : LE TISONNIER ============
// Le gardien du volcan dort dans le lac de lave. Un titan voûté de basalte et de magma, qui marche sur les poings
// comme un gorille : de courtes pattes arrière, d'énormes épaules cuirassées d'orgues, une tête basse sous un front
// de basalte et une couronne d'obsidienne, un petit volcan qui fume sur le dos. Son bras droit finit en tisonnier :
// une barre de fer noir, rouge sur son dernier tiers, crochue, qu'il plante en marchant comme une béquille.
// Il sort du lac quand on approche du cratère, rugit, et combat :
//  - EMBROCHER : il se cabre, ramène le tisonnier, puis se jette en avant et le plante loin devant lui — une ligne
//    d'étincelles au sol trahit le coup, et le sol brûle ensuite le long de la ligne ;
//  - BALAYER : il arme sur sa droite, le buste tordu, puis balaie tout devant lui ;
//  - MARTELER : il se dresse, les deux bras au ciel, et s'abat : le coup, puis une onde de feu qui court au sol
//    (sautez par-dessus) ;
//  - CRACHER : le volcan de son dos crache des bombes sur vous, quand vous restez loin ;
//  - CHARGER : il gratte du poing, puis galope sur les poings et fonce.
// À mi-vie il s'embrase : il rugit, la montagne entre en éruption, il frappe plus vite, et son tisonnier laisse un
// sillage de feu. Abattu, il s'effondre et refroidit ; la montagne se calme. Il reprend sa place au lac si vous fuyez.
const TISON_SPEC = { id:'tisonnier', n:'Le Tisonnier', volcan:1, alpha:1, corps:'tisonnier', diet:'c', sz:2.4, spd:2.2, vue:40, peur:0, herd:0, cap:0, mat:9999,
  shell:[74,66,70], dark:[36,30,34], leg:[74,66,70], oeil:[255,240,190], bio:[], dur:26, lueur:3.2, lien:0, chasse:[], travail:{}, metier:'le gardien du volcan', grimpe:0 };
VOLCAN_SPEC.push(TISON_SPEC);
const TISON = { CD: { embrocher: 4.5, balayer: 3, marteler: 6.5, cracher: 7, charger: 8 }, DUREE: { embrocher: 2, balayer: 1.9, marteler: 2.6, cracher: 1.9, charger: 3.2, rugir: 2.4 } };
function tisonnierNaitre() {
  const V = VOLC; if (V.tue || typeof specById === 'undefined' || !specById.tisonnier) return;
  const b = naitre(specById.tisonnier, V.cx + .5, V.cy + .5, 1e6);
  Object.assign(b, { z: V.zLac, pv: 1, phaseT: 'dormir', etat: 'dormir', emerge: 0, dir: V.br + Math.PI, dirT: V.br + Math.PI, tph: 0, cd: {}, feu: false, loinT: 0, ondes: [] });
  beasts.push(b); V.alpha = b;
}
const tisonVivant = o => o && (estJoueur(o) ? o.pv > 0 : !o.dead && o.pv > 0);
const tisonCibles = b => [...(typeof joueursFaune === 'function' ? joueursFaune() : [P]), ...beasts.filter(o => o.tame && !o.dead && o.pv > 0)];
// le pas du titan : droit sur sa cible, il enjambe tout (la lave ne lui fait rien), sauf la mer
function tisonPas(b, tx, ty, vit, dt) {
  const d = Math.hypot(tx - b.x, ty - b.y); if (vit <= 0 || d < .1) { b.vit = 0; return; }
  const sv = Math.min(vit, d / Math.max(dt, .016)), a0 = Math.atan2(ty - b.y, tx - b.x);
  for (const da of [0, .5, -.5, 1, -1]) {
    const a = a0 + da, nx = b.x + Math.cos(a) * sv * dt, ny = b.y + Math.sin(a) * sv * dt, i = (ny | 0) * WS + (nx | 0);
    if (nx < 4 || ny < 4 || nx > WS - 5 || ny > WS - 5 || (Hgt[i] <= SEA && Bio[i] !== BIO_LAVE)) continue;
    b.x = nx; b.y = ny; b.vit = sv; b.tph = (b.tph || 0) + sv * dt / echB(b) * .7 / (2 * .34); return;
  }
  b.vit = 0;
}
function majTisonnier(b, dt) {
  const V = VOLC;
  b.t += dt; b.age += dt; if (b.hit > 0) b.hit -= dt;
  if (b.dead) { if (!b._mortVu) tisonMort(b); b.dead += dt * .3; b.z += (sol(b.x, b.y) - b.z) * Math.min(1, dt * 3); majOndes(b, dt); return; }
  if (b.pv <= 0) { mourirBete(b, 'combat'); return; }
  b.faim = 0; b.soif = 0; b.nrj = 1;
  const k = b.feu ? 1.3 : 1;                                   // embrasé : tout va plus vite
  b.z += (Math.max(sol(b.x, b.y), Bio[(b.y | 0) * WS + (b.x | 0)] === BIO_LAVE ? V.zLac : 0) - b.z) * Math.min(1, dt * 5);
  majOndes(b, dt);
  // le volcan du dos fume et crache des braises ; le fer du tisonnier goutte
  if (b.emerge > .3 && b.phaseT !== 'dormir' && (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 2500) {
    const { put } = posBete(b);
    if (Math.random() < dt * (b.feu ? 6 : 3)) { const p = put([.2, 0, 1.9]); bouffee(p[0], p[1], p[2], { vz: 1.2 + Math.random(), g: -.05, life: 3.5, col: Math.random() < .5 ? '#3a3234' : '#5a5050', tl: .35, gr: .5, fin: .3, op: .7 }); }
    if (Math.random() < dt * (b.feu ? 10 : 4)) { const p = put([.2, 0, 1.85]); parts.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: 2 + Math.random() * 3, g: 9, life: 1.1, age: 0, col: Math.random() < .5 ? '#ffd060' : '#ff6a1c', luit: 1, tl: .1 }); }
  }
  const L = tisonCibles(b);
  let c = null, dc = 1e9; for (const o of L) if (tisonVivant(o)) { const d = Math.hypot(o.x - b.x, o.y - b.y); if (d < dc && Math.abs((o.z || 0) - b.z) < 12) { dc = d; c = o; } }
  const ph = b.phaseT;
  if (ph === 'dormir') {                                        // sous la lave : il guérit ; on approche du cratère, il sort
    b.etat = 'dormir'; b.emerge = 0; b.vit = 0; b.pv = Math.min(1, b.pv + dt * .05); b.x = V.cx + .5; b.y = V.cy + .5; b.z = V.zLac;
    const dP = Math.hypot(P.x - V.cx, P.y - V.cy);
    if ((dP < V.rc + 14 && Math.abs(P.z - V.zLac) < 14) || b.hit > 0) {
      b.phaseT = 'surgir'; b.etat = 'surgir'; b.actT = t;
      say('le lac de lave se soulève…', 3); SON.jouer('grondement', { fort: 1 }); SON.jouer('rugDemon', { dans: 1.5 }, b.x, b.y, b.z + 3);
      if (c) b.dir = b.dirT = Math.atan2(c.y - b.y, c.x - b.x);
    }
    return;
  }
  if (ph === 'surgir') {                                        // il se hisse hors du lac, la lave coule de lui
    b.etat = 'surgir'; b.vit = 0; b.emerge = Math.min(1, (b.emerge || 0) + dt / 4);
    P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .3);
    if (Math.random() < dt * 30) { const a = Math.random() * 6.283, r = 1 + Math.random() * 2.5;
      parts.push({ x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r, z: b.z + Math.random() * 3 * b.emerge, vx: Math.cos(a), vy: Math.sin(a), vz: 1 + Math.random() * 3, g: 9, life: 1.2, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .14 }); }
    if (c) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, .8); }
    if (b.emerge >= 1) { b.phaseT = 'combat'; tisonAgir(b, 'rugir', c); say('le Tisonnier, gardien du volcan', 4); }
    return;
  }
  if (ph === 'plonger') {                                       // il rentre dans le lac
    b.etat = 'plonger'; b.vit = 0; b.emerge = Math.max(0, b.emerge - dt / 3);
    if (b.emerge <= 0) { b.phaseT = 'dormir'; b.act = null; b.ondes.length = 0; }
    return;
  }
  // à mi-vie : il s'embrase
  if (!b.feu && b.pv < .5 && !b.act) { b.feu = true; tisonAgir(b, 'rugir', c); say('le Tisonnier s\'embrase · la montagne répond', 4); if (typeof forcerMeteo === 'function') { forcerMeteo('eruption', true); Meteo.reste = 120; } }
  if (b.act) return actionTisonnier(b, dt, k, c, L);
  // il garde son cône : une proie qui s'en va au-delà, il ne la suit pas ; au bout de dix secondes, il rentre au lac
  const horsCone = !c || dc > 45 || Math.hypot(c.x - V.cx, c.y - V.cy) > V.R * .75;
  b.loinT = horsCone ? (b.loinT || 0) + dt : 0;
  if (ph === 'rentrer' || b.loinT > 10) {
    b.phaseT = 'rentrer'; b.etat = 'rentrer';
    if (!horsCone && dc < 25) { b.phaseT = 'combat'; b.loinT = 0; return; }
    b.dirT = Math.atan2(V.cy + .5 - b.y, V.cx + .5 - b.x); tournerBrume(b, dt, 1.4); tisonPas(b, V.cx + .5, V.cy + .5, 2, dt);
    if (Math.hypot(V.cx + .5 - b.x, V.cy + .5 - b.y) < 1.5) { b.phaseT = 'plonger'; SON.jouer('grondement', {}, b.x, b.y, b.z); }
    return;
  }
  b.etat = 'chasser';
  if (!c) { b.vit = 0; return; }
  b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, 1.5 * k);
  if (horsCone) { b.vit = 0; return; }                       // au bord de son domaine : il attend, il regarde
  // parmi les coups à portée et prêts, il en tire un — jamais deux fois de suite le même, s'il a le choix
  const pret = q => t > (b.cd[q] || 0), face = Math.cos(angle(b.dirT - b.dir)) > .8, choix = [];
  if (face && dc < 4.6 && pret('balayer')) choix.push('balayer', 'balayer');
  if (face && dc < 7.5 && pret('embrocher')) choix.push('embrocher', 'embrocher');
  if (dc < 9 && pret('marteler')) choix.push('marteler');
  if (dc > 8 && dc < 30 && pret('cracher')) choix.push('cracher');
  if (face && dc > 11 && dc < 26 && pret('charger')) choix.push('charger', 'charger');
  const C2 = choix.length > 1 ? choix.filter(q => q !== b.dernier) : choix;
  if (C2.length && Math.random() < dt * 6) { const q = C2[(Math.random() * C2.length) | 0]; b.dernier = q; tisonAgir(b, q, c); }
  else tisonPas(b, c.x, c.y, dc > 3.5 ? b.sp.spd * k * (dc > 14 ? 1.3 : 1) : 0, dt);
  // embrasé : le tisonnier qui traîne laisse un sillage de feu
  if (b.feu && b.vit > .3 && Math.random() < dt * 4) { const { put } = posBete(b), p = put([1.25, -.62, 0]); V.feux.push([p[0], p[1], sol(p[0], p[1]), t + 4]); }
}
function tisonAgir(b, act, c) { b.act = act; b.actT = t; b.actC = c; b.fait = 0; b.etat = act; b.chHit = []; if (c) b.vise = [c.x, c.y, (c.z || 0) + .9]; }
function actionTisonnier(b, dt, k, c, L) {
  const V = VOLC, u = (t - b.actT) * k, F = [Math.cos(b.dir), Math.sin(b.dir)], Lt = [-F[1], F[0]];
  const { put } = posBete(b);
  const fin = () => { b.act = null; b.cd[b.etat] = t + TISON.CD[b.etat] / k; b.etat = 'chasser'; };
  b.vit = 0;
  const viser = (r = 1.6) => { if (tisonVivant(c)) { b.dirT = Math.atan2(c.y - b.y, c.x - b.x); tournerBrume(b, dt, r * k); } };
  const toucher = (o, deg, kb) => coupBrume(b, o, deg, kb);
  if (b.act === 'rugir') {
    if (u > .5 && u < 1.8 && Math.random() < dt * 40) { const p = put([.05, 0, 1.95]); parts.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, vz: 6 + Math.random() * 6, g: 9, life: 1.6, age: 0, col: Math.random() < .5 ? '#ffd060' : '#ff5a18', luit: 1, tl: .16 }); }
    if (u > .55 && b.fait < 1) { b.fait = 1; SON.jouer('rugDemon', {}, b.x, b.y, b.z + 3); P.secousse = t; P.secousseK = .7; }
    if (u > TISON.DUREE.rugir) { b.act = null; b.etat = 'chasser'; }
    return;
  }
  if (b.act === 'embrocher') {
    if (u < .85) viser(1.2);
    if (u > .3 && u < .9 && Math.random() < dt * 30) {          // la ligne qu'il vise : des étincelles au sol
      const r = 1.5 + Math.random() * 6, x = b.x + F[0] * r, y = b.y + F[1] * r;
      parts.push({ x, y, z: sol(x, y) + .05, vx: 0, vy: 0, vz: .6, g: 0, life: .4, age: 0, col: '#ff6a20', luit: 1, tl: .1 });
    }
    if (u >= .9 && b.fait < 1) {
      b.fait = 1; SON.jouer('impact', {}, b.x, b.y, b.z + 1); SON.jouer('cracheFeu', {}, b.x + F[0] * 5, b.y + F[1] * 5, b.z);
      P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .5);
      for (const o of L) { if (!tisonVivant(o)) continue; const dx = o.x - b.x, dy = o.y - b.y, lx = dx * F[0] + dy * F[1], ly = dx * Lt[0] + dy * Lt[1];
        if (lx > .5 && lx < 7.6 && Math.abs(ly) < 1.4 && Math.abs((o.z || 0) - b.z) < 3) toucher(o, .22, [F[0] * 8, F[1] * 8, 2.5]); }
      for (let r = 2; r <= 7.5; r += .8) { const x = b.x + F[0] * r, y = b.y + F[1] * r; V.feux.push([x, y, sol(x, y), t + 3.5]); burst(x, y, sol(x, y) + .2, 6, '#ff8a30'); }
    }
    if (u > TISON.DUREE.embrocher) fin();
    return;
  }
  if (b.act === 'balayer') {
    if (u < .65) viser(1.4);
    if (u >= .85 && b.fait < 1) {
      b.fait = 1; SON.jouer('impact', {}, b.x, b.y, b.z + 1); P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, .35);
      for (const o of L) { if (!tisonVivant(o)) continue; const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
        if (d < 6 && (dx * F[0] + dy * F[1]) / (d || 1) > -.15 && Math.abs((o.z || 0) - b.z) < 3) toucher(o, .18, [Lt[0] * 7 + F[0] * 2, Lt[1] * 7 + F[1] * 2, 3]); }
      for (let a = -1.3; a <= 1.2; a += .25) { const x = b.x + Math.cos(b.dir + a) * 4.5, y = b.y + Math.sin(b.dir + a) * 4.5; burst(x, y, sol(x, y) + .4, 3, '#ffa040'); }
    }
    if (u > TISON.DUREE.balayer) fin();
    return;
  }
  if (b.act === 'marteler') {
    if (u < 1) viser(1);
    if (u >= 1.2 && b.fait < 1) {
      b.fait = 1; const x = b.x + F[0] * 2.6, y = b.y + F[1] * 2.6, z = sol(x, y);
      SON.jouer('impact', {}, x, y, z); SON.jouer('effondre', {}, x, y, z); P.secousse = t; P.secousseK = Math.max(P.secousseK || 0, Math.hypot(P.x - x, P.y - y) < 16 ? 1 : .4);
      for (const o of L) if (tisonVivant(o) && Math.hypot(o.x - x, o.y - y) < 2.8 && Math.abs((o.z || 0) - z) < 2.5) { const d = Math.hypot(o.x - x, o.y - y) || 1; toucher(o, .26, [(o.x - x) / d * 6, (o.y - y) / d * 6, 4]); }
      b.ondes.push({ x, y, z, t0: t, vu: new Set() });
      if (!V.dit.onde) { V.dit.onde = 1; say('une onde de feu court au sol · sautez par-dessus', 3); }
      for (let j = 0; j < 40; j++) { const a = Math.random() * 6.283, r = Math.random() * 2.5; parts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: z + .1, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, vz: 2 + Math.random() * 4, g: 9, life: 1, age: 0, col: Math.random() < .5 ? '#ffb040' : '#5a5050', luit: Math.random() < .5 ? 1 : 0, tl: .12 }); }
    }
    if (u > TISON.DUREE.marteler) fin();
    return;
  }
  if (b.act === 'cracher') {                                    // le volcan du dos : six bombes sur vous
    viser(1);
    if (u > .55 && u < 1.45 && tisonVivant(c) && (b.fait || 0) < Math.floor((u - .55) / .15) + 1 && b.fait < 6) {
      b.fait++; const p = put([.05, 0, 1.95]), tx = c.x + (Math.random() - .5) * 7, ty = c.y + (Math.random() - .5) * 7, z1 = hAt(tx | 0, ty | 0), T = 1.6 + Math.random() * .8;
      V.bombes.push({ x: p[0], y: p[1], z: p[2], vx: (tx - p[0]) / T, vy: (ty - p[1]) / T, vz: (z1 - p[2] + 4.5 * T * T) / T, t: 0, T, tl: .3 + Math.random() * .15, fum: 0 });
      SON.jouer('cracheFeu', {}, p[0], p[1], p[2]);
      for (let j = 0; j < 8; j++) parts.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, vz: 3 + Math.random() * 3, g: 9, life: .9, age: 0, col: '#ffb040', luit: 1, tl: .12 });
    }
    if (u > TISON.DUREE.cracher) fin();
    return;
  }
  if (b.act === 'charger') {                                    // il gratte du poing, puis galope sur les poings
    if (u < .8) { viser(2); return; }
    if (u < 2.6) {
      const nx = b.x + F[0] * 12 * dt, ny = b.y + F[1] * 12 * dt, i = (ny | 0) * WS + (nx | 0);
      if (nx < 4 || ny < 4 || nx > WS - 5 || ny > WS - 5 || (Hgt[i] <= SEA && Bio[i] !== BIO_LAVE)) { b.actT = t - 2.6 / k; return; }
      b.x = nx; b.y = ny; b.vit = 12; b.tph = (b.tph || 0) + 12 * dt / echB(b) * .35;
      for (const o of L) if (tisonVivant(o) && !b.chHit.includes(o) && Math.hypot(o.x - b.x, o.y - b.y) < 2.8 && Math.abs((o.z || 0) - b.z) < 3) {
        b.chHit.push(o); toucher(o, .22, [F[0] * 9 + Lt[0] * 3, F[1] * 9 + Lt[1] * 3, 4]);
      }
      if (tisonVivant(c) && Math.hypot(c.x - b.x, c.y - b.y) < 1.6) b.actT = t - 2.6 / k;   // sur lui : il freine
      return;
    }
    if (u > TISON.DUREE.charger) fin();
  }
}
// L'onde du martèlement : un anneau de feu qui court au sol sur neuf cases ; qui touche terre là où elle passe est
// frappé, qui saute au bon moment la laisse passer dessous.
function majOndes(b, dt) {
  for (let i = b.ondes.length - 1; i >= 0; i--) {
    const O = b.ondes[i], r = 1.2 + (t - O.t0) / .9 * 8.5;
    if (r > 9.7) { b.ondes.splice(i, 1); continue; }
    for (let j = 0; j < 22; j++) { const a = Math.random() * 6.283, x = O.x + Math.cos(a) * r, y = O.y + Math.sin(a) * r;
      parts.push({ x, y, z: sol(x, y) + .05, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5, vz: 1.2 + Math.random() * 1.8, g: 6, life: .45, age: 0, col: Math.random() < .6 ? '#ff7a24' : '#ffd060', luit: 1, tl: .11 }); }
    if (b.dead) continue;
    for (const o of tisonCibles(b)) {
      if (!tisonVivant(o) || O.vu.has(o)) continue;
      const d = Math.hypot(o.x - O.x, o.y - O.y), auSol = (o.z || 0) < sol(o.x, o.y) + .35;
      if (Math.abs(d - r) < .65 && auSol && Math.abs((o.z || 0) - O.z) < 2) { O.vu.add(o); coupBrume(b, o, .16, [(o.x - O.x) / (d || 1) * 6, (o.y - O.y) / (d || 1) * 6, 4]); }
    }
  }
}
// Abattu : il s'effondre et refroidit. Le cœur du Tisonnier, des éclats, de la pierre ; la montagne se calme.
function tisonMort(b) {
  const V = VOLC; b._mortVu = true; V.tue = true; b.ondes.length = 0; b.act = null;
  SON.jouer('effondre', {}, b.x, b.y, b.z); SON.jouer('explosion', { vol: 1 }); P.secousse = t; P.secousseK = 1;
  for (let j = 0; j < 60; j++) { const a = Math.random() * 6.283, r = Math.random() * 2; parts.push({ x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r, z: b.z + 1 + Math.random() * 3, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, vz: 3 + Math.random() * 6, g: 9, life: 1.6, age: 0, col: Math.random() < .5 ? '#ffb040' : '#ff5a18', luit: 1, tl: .16 }); }
  P.sac.eclat = (P.sac.eclat || 0) + 30; P.sac.verrenoir = (P.sac.verrenoir || 0) + 20; P.sac.basalte = (P.sac.basalte || 0) + 30;   // (§200) ses matières
  if (typeof INGR !== 'undefined' && INGR.coeurtison) gagnerDenree('coeurtison', 1);
  say('le Tisonnier est abattu · le cœur du Tisonnier, 30 éclats, 20 éclats d\'obsidienne, 30 basalte · la montagne se calme', 6);
  if (typeof forcerMeteo === 'function') { forcerMeteo('fumees', true); Meteo.reste = 600; }
  if (typeof majSac === 'function') majSac();
  if (typeof Sauve !== 'undefined') Sauve.sale = true;
}
// La barre du gardien, en bas de l'écran (entre le pouce et les boutons), tant qu'il se bat et que vous êtes près.
let tisonBarre = null;
function majBarreTison() {
  const b = VOLC.alpha, on = volcanIci() && b && !b._cache && (b.phaseT === 'combat' || b.phaseT === 'surgir' || b.phaseT === 'rentrer' || (b.dead && b.dead < 4)) && Math.hypot(b.x - P.x, b.y - P.y) < 60;
  if (!on) { if (tisonBarre) tisonBarre.style.display = 'none'; return; }
  if (!tisonBarre) {
    tisonBarre = document.createElement('div'); tisonBarre.id = 'tisonBarre';
    tisonBarre.style.cssText = 'position:fixed;z-index:2;pointer-events:none;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom));width:min(40vw,360px);'
      + 'font:600 12px/1.2 system-ui,sans-serif;color:#ffe2b8;text-align:center;letter-spacing:.06em;text-shadow:0 1px 2px #000;';
    tisonBarre.innerHTML = '<div class="n">LE TISONNIER</div><div style="height:8px;margin-top:4px;border-radius:5px;background:rgba(20,10,8,.75);border:1px solid rgba(255,140,60,.55);overflow:hidden">'
      + '<i style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#a01808,#ff6a1c,#ffc860)"></i></div>';
    document.body.appendChild(tisonBarre);
  }
  tisonBarre.style.display = '';
  tisonBarre.querySelector('i').style.width = Math.round(Math.max(0, b.dead ? 0 : b.pv) * 100) + '%';
  tisonBarre.querySelector('.n').textContent = b.dead ? 'LE TISONNIER · ABATTU' : b.feu ? 'LE TISONNIER · EMBRASÉ' : 'LE TISONNIER';
}
// ---------- le Tisonnier, en volumes ----------
// Un repère par pièce du squelette (le bassin, l'échine, le poitrail, la tête), des poses clés (kf) pour chaque
// attaque, et tout passe de l'une à l'autre en douceur (lis). La marche sur les poings : bas-gauche, poing gauche,
// bas-droit, tisonnier — le tisonnier se plante comme une béquille.
function osTisonnier(f) {
  const sp = f.sp, B = [], K = echB(f);
  const E = f.etat, mort = f.dead > 0 ? Math.min(1, f.dead) : 0;
  if (E === 'dormir' && !mort) return B;                                     // sous la lave
  const cp3 = a => [a[0], a[1], a[2]];
  const add = (a, b, w, h, c, x) => { const o = Object.assign({ a: cp3(a), b: cp3(b), w: w * K, h: h * K, c }, x); B.push(o); return o; };
  const GA = (r = .55, n = 4) => ({ boule: n, rond: r }), PR = (fin = 1, n = 6, r = .85) => fin === 1 ? { pans: n, rond: r } : { pans: n, rond: r, fin };
  const dtl = Math.min(.1, Math.max(0, t - (f._osT ?? t))); f._osT = t;
  const D = f._dm || (f._dm = {}), ex = r => 1 - Math.exp(-r * dtl);
  const lis = (k, v, r) => (D[k] = D[k] === undefined || !isFinite(D[k]) ? v : D[k] + (v - D[k]) * ex(r));
  const lisV = (k, v, r) => { const a = D[k]; if (!a) { D[k] = v.slice(); return v.slice(); } const q = ex(r); for (let i = 0; i < 3; i++) a[i] += (v[i] - a[i]) * q; return a.slice(); };
  const vA = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vS = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vK = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vN = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, vM = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const cl = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, lisse = x => x * x * (3 - 2 * x);
  const rz = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
  const kf = (x, Kf) => { if (x <= Kf[0][0]) return Kf[0][1]; for (let i = 1; i < Kf.length; i++) if (x <= Kf[i][0]) { const a = Kf[i - 1], b = Kf[i], e = lisse((x - a[0]) / ((b[0] - a[0]) || 1));
    return Array.isArray(a[1]) ? a[1].map((q, j) => q + (b[1][j] - q) * e) : a[1] + (b[1] - a[1]) * e; } return Kf[Kf.length - 1][1]; };
  const rep = (Og, yaw, pitch, roll) => {
    const cp = Math.cos(pitch), s = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const F = rz([cp, 0, -s], yaw), S = rz([s * sr, cr, cp * sr], yaw), U = rz([s * cr, -sr, cp * cr], yaw);
    const M = (a, b, c) => [Og[0] + F[0] * a + S[0] * b + U[0] * c, Og[1] + F[1] * a + S[1] * b + U[1] * c, Og[2] + F[2] * a + S[2] * b + U[2] * c];
    M.F = F; M.S = S; M.U = U; return M;
  };
  // ---- où il en est ----
  const k = f.feu ? 1.3 : 1, u = f.actT != null ? (t - f.actT) * k : 9, vif = 1 - mort, emerge = f.emerge ?? 1;
  const surgit = (E === 'surgir' || E === 'plonger') && !mort;
  const act = !mort && ['embrocher', 'balayer', 'marteler', 'cracher', 'charger', 'rugir'].includes(E) ? E : null;
  const galop = act === 'charger' && u >= .8 && u < 2.6, gratte = act === 'charger' && u < .8;
  const marche = !act && !mort && !surgit;
  const v = marche ? Math.min(1, (f.vit || 0) / 2.2) : 0, ph = (((f.tph || 0) % 1) + 1) % 1, P2 = 6.2832;
  const effort = act || surgit ? 1 : 0, eff = lis('eff', effort, effort > (D.eff || 0) ? 3 : .3);
  D.res = (D.res || 0) + dtl * (1.2 + 2.4 * eff);
  const souffle = (.5 + .5 * Math.sin(D.res)) * vif;
  let lookY = 0, lookP = 0;
  { const ci = Array.isArray(f.vise) && act ? f.vise : [P.x, P.y, P.z + .9], dx = ci[0] - f.x, dy = ci[1] - f.y, c = Math.cos(f.dir || 0), s = Math.sin(f.dir || 0);
    const lx = dx * c + dy * s, ly = -dx * s + dy * c, d = Math.hypot(lx, ly);
    if (d < 50 && d > .5) { lookY = cl(Math.atan2(ly, lx), -.9, .9); lookP = cl(-Math.atan2(ci[2] - (f.z + 2.2), d), -.5, .5); } }
  // ================= LES POSES =================
  const Lp = 1.15;                                                           // la longueur du tisonnier
  const G = { px: 0, py: 0, pz: 0, yaw: 0, pitch: -.49, roll: 0, sYaw: 0, hY: lookY * .7, hP: .1 + lookP * .6, jaw: .06 + .05 * souffle, flare: 0 };
  let fistL = [.8, .62, .06], tipR = [.92, -.62, 0], W = null, pk = vN([.3, .05, -.95]);
  let pg = [-.48, .42, 0], pd = [-.48, -.42, 0];
  if (marche) {                                                               // à l'arrêt : il souffle, change d'appui, regarde
    const ap = Math.sin(t * .4 + (f.bob || 0) * 3) * (1 - v);
    G.py = .03 * ap; G.roll = .025 * ap; G.pz = -.015 * souffle;
    fistL[0] += .03 * Math.sin(t * .6);
    if (v > .01) {                                                            // la marche sur les poings
      const A = .34 * v, H = .22 * v;
      const g = o => { const q = ((ph - o) % 1 + 1) % 1; if (q < .3) return [-A + 2 * A * lisse(q / .3), H * Math.sin(Math.PI * q / .3)]; return [A - 2 * A * (q - .3) / .7, 0]; };
      const lh = g(0), lf = g(.25), rh = g(.5), rf = g(.75);
      pg = [-.48 + lh[0], .42, lh[1]]; pd = [-.48 + rh[0], -.42, rh[1]];
      fistL = [.8 + lf[0], .62, .06 + lf[1] * 1.3]; tipR = [.92 + rf[0], -.62, rf[1] * 1.3];
      G.pz -= .045 * v * (.5 - .5 * Math.cos(ph * 2 * P2)); G.roll += .045 * v * Math.sin(ph * P2); G.yaw += .05 * v * Math.sin(ph * P2); G.sYaw = -.09 * v * Math.sin(ph * P2);
      G.hP += .05 * v * Math.sin(ph * 2 * P2);
    }
  }
  if (gratte) {                                                               // il gratte du poing, tête basse
    fistL = [.95 + .18 * Math.sin(u * 14), .62, .06 + Math.max(0, Math.sin(u * 14)) * .2]; G.hP = .45; G.pitch = -.4; G.pz = -.06; G.jaw = .25;
  }
  if (galop) {                                                                // le galop : les poings loin devant, puis les pattes
    const fr = Math.sin(ph * P2);
    fistL = [1 + .45 * fr, .55, .06 + Math.max(0, -fr) * .4]; tipR = [1.08 + .45 * fr, -.55, Math.max(0, -fr) * .4];
    pg = [-.5 - .38 * fr, .4, Math.max(0, fr) * .3]; pd = [-.45 - .38 * fr, -.4, Math.max(0, fr) * .3];
    G.pitch = -.32 + .12 * fr; G.pz = .1 * Math.abs(fr); G.hP = .3; pk = vN([.55, 0, -.85]); G.jaw = .3;
  }
  if (surgit) {                                                               // hors du lac, à la force des bras
    const e = emerge;
    fistL = [1.05, .75, (1 - e) * 1.6]; W = [1.0, -.7, .9 + (1 - e) * 1.6]; pk = vN([.5, -.1, -.85]);
    G.pitch = -.85 + .36 * e; G.hP = -.2; G.jaw = .35 * Math.max(0, Math.sin(t * 2));
  }
  if (act === 'rugir') {
    const r = kf(u, [[0, 0], [.5, 1], [1.8, 1], [2.4, 0]]);
    G.pitch = -.49 - .66 * r; G.pz = .35 * r; G.hP = .1 - .65 * r; G.jaw = .06 + .6 * kf(u, [[.4, 0], [.6, 1], [1.7, .8], [2.2, 0]]);
    fistL = vM(fistL, [.25, .98, 1.95], r); W = vM([.9, -.66, 1.1], [.25, -.98, 1.95], r); pk = vN(vM([.3, .05, -.95], [.2, -.3, 1], r)); G.flare = r;
  }
  if (act === 'embrocher') {                                                  // il se cabre, ramène le fer, puis se jette
    const ar = kf(u, [[0, 0], [.6, 1], [.85, 1], [.95, 0]]), lu = kf(u, [[.85, 0], [.97, 1], [1.3, 1], [2, 0]]);
    G.pitch = -.49 - .3 * ar + .26 * lu; G.pz = .14 * ar - .05 * lu; G.px = -.16 * ar + .48 * lu; G.sYaw = .25 * ar - .1 * lu; G.hP = .1 + .25 * lu; G.jaw = .1 + .3 * lu;
    W = vM(vM([.9, -.66, 1.1], [-.15, -.6, 1.4], ar), [1.4, -.3, 1.0], lu);
    pk = vN(vM(vM([.3, .05, -.95], [1, 0, .15], ar), [1, .05, -.08], lu));
  }
  if (act === 'balayer') {                                                    // armé sur sa droite, il balaie tout devant lui
    const ar = kf(u, [[0, 0], [.6, 1], [.72, 1]]), sw = kf(u, [[.72, 0], [1.05, 1]]), re = kf(u, [[1.1, 0], [1.9, 1]]);
    const a = -1.35 + 2.55 * sw, on = ar * (1 - re);
    G.sYaw = on * (-.6 + 1.1 * sw); G.pitch = -.49 - .12 * on; G.hP = .2; G.jaw = .1 + .25 * on;
    const Wb = [.4 + Math.cos(a) * .85, -.15 + Math.sin(a) * .85, 1.25], Pb = vN([Math.cos(a), Math.sin(a), -.12]);
    W = vM([.9, -.66, 1.1], vM([.25, -1.05, 1.35], Wb, sw), on); pk = vN(vM([.3, .05, -.95], vM([-.25, -1, .25], Pb, sw), on));
  }
  if (act === 'marteler') {                                                   // il se dresse, les bras au ciel, et s'abat
    const up = kf(u, [[0, 0], [1.05, 1], [1.12, 1]]), dn = kf(u, [[1.1, 0], [1.25, 1], [1.9, 1], [2.6, 0]]);
    const upr = up * (1 - kf(u, [[1.1, 0], [1.2, 1]]));
    G.pitch = -.49 - .76 * upr + .84 * dn; G.pz = .45 * upr - .18 * dn; G.hP = .1 - .5 * upr + .3 * dn; G.jaw = .06 + .55 * upr + .3 * dn;
    fistL = vM(vM(fistL, [.35, .38, 2.25], upr), [1.35, .38, .06], dn);
    W = vM(vM([.9, -.66, 1.1], [.35, -.38, 2.25], upr), [1.3, -.38, .55], dn);
    pk = vN(vM(vM([.3, .05, -.95], [-.3, 0, 1], upr), [.4, 0, -1], dn));
  }
  if (act === 'cracher') {                                                    // le volcan du dos : il s'accroupit, puis se cambre
    const cr = kf(u, [[0, 0], [.45, 1], [.55, 0]]), ac = kf(u, [[.5, 0], [.7, 1], [1.5, 1], [1.9, 0]]);
    G.pz = -.16 * cr + .1 * ac; G.pitch = -.49 + .15 * cr - .3 * ac; G.hP = .25 * cr - .35 * ac; G.jaw = .1 + .45 * ac; G.flare = ac;
    fistL = vM(fistL, [.9, .7, .06], cr);
  }
  if (mort) {                                                                 // il tombe à genoux, puis en avant
    const kn = kf(mort, [[0, 0], [.35, 1]]), fa = kf(mort, [[.3, 0], [.8, 1]]);
    G.pz -= .35 * kn + .3 * fa; G.pitch = -.49 + .3 * kn + .6 * fa; G.hP = .3 + .4 * fa; G.jaw = .4 * (1 - fa);
    fistL = vM(fistL, [1.2, .95, 0], fa); W = vM([.9, -.66, 1.1], [1.2, -.95, .25], fa); pk = vN(vM(pk, [.2, -.9, -.2], fa));
    pg = vM(pg, [-.3, .5, 0], kn); pd = vM(pd, [-.3, -.5, 0], kn);
  }
  // ---- le lissage : rien ne saute ----
  const rb = act || mort || surgit ? 10 : 6, rl = galop || v > .01 ? 22 : 10;
  for (const q of ['px', 'py', 'pz', 'yaw', 'pitch', 'roll', 'sYaw', 'hY', 'hP', 'jaw', 'flare']) G[q] = lis(q, G[q], q === 'jaw' ? 12 : rb);
  if (!W) W = vS(tipR, vK(pk, Lp));
  fistL = lisV('fL', fistL, rl); W = lisV('W', W, rl); pk = vN(lisV('pk', pk, rl)); pg = lisV('pg', pg, rl); pd = lisV('pd', pd, rl);
  // ================= LE CORPS =================
  const feu = !!f.feu, froid = mort > .5;
  const roc = sp.shell, roc2 = sp.dark, obs = [22, 18, 26], fer = [40, 36, 40], croute = [58, 40, 36];
  const LC = froid ? croute : LAVE_C, LX = froid ? {} : LV;
  const Hc = [G.px - .45, G.py, .82 + G.pz];
  const M = rep(Hc, G.yaw, G.pitch, G.roll), S = M(.92, 0, 0), Ms = rep(S, G.yaw + G.sYaw, G.pitch * .5, G.roll * .5);
  // le tronc : le bassin, le ventre, le poitrail massif ; le magma du ventre, qui luit
  add(M(-.15, 0, 0), M(.28, 0, .02), .72, .58, roc2, GA(.55, 4));
  add(M(.2, 0, .02), M(.66, 0, .06), .86, .7, roc, GA(.55, 4));
  add(Ms(-.28, 0, .02), Ms(.18, 0, .04), 1.02, .8 * (1 + .03 * souffle), roc, GA(.5, 5));
  add(M(.12, 0, -.24), M(.72, 0, -.27), .58, .22, LC, Object.assign(GA(.6, 3), LX));
  // l'échine : des orgues de basalte debout, des fentes de lave entre elles
  for (let i = 0; i < 5; i++) { const a = -.02 + i * .22, h = .14 + (i === 2 ? .08 : i === 3 ? .05 : 0);
    add(M(a, 0, .26), M(a, 0, .4 + h), .3, .3, i % 2 ? roc2 : roc, PR(.7, 6));
    if (i < 4) add(M(a + .11, -.26, .3), M(a + .11, .26, .3), .045, .05, LC, LX); }
  for (const s of [-1, 1]) {
    add(M(.08, s * .37, -.06), M(.62, s * .43, .05), .04, .05, LC, LX);                     // les fentes des flancs
    if (feu) add(Ms(-.2, s * .48, -.1), Ms(.12, s * .5, .12), .04, .05, LC, LX);
  }
  // le volcan du dos : huit orgues penchées en couronne, un lac de lave au fond ; il crache quand il se cambre
  const C = M(.62, 0, .5);
  for (let i = 0; i < 8; i++) { const a = i * .7854 + .2, h = .34 + .1 * ((i * 3) % 4) / 3;
    add([C[0] + Math.cos(a) * .2, C[1] + Math.sin(a) * .2, C[2] - .06], [C[0] + Math.cos(a) * .27, C[1] + Math.sin(a) * .27, C[2] + h], .14, .14, i % 2 ? roc : roc2, PR(1, 6)); }
  add([C[0], C[1], C[2] + .26], [C[0], C[1], C[2] + .3], .3, .3, LC, Object.assign(GA(.6, 3), LX));
  if (G.flare > .05 && !froid) add([C[0], C[1], C[2] + .3], [C[0], C[1], C[2] + .3 + .55 * G.flare], .16 * G.flare + .04, .16 * G.flare + .04, LC, LX);
  // les épaulières : deux orgues larges, bordées de lave
  for (const s of [-1, 1]) {
    add(Ms(-.06, s * .48, .14), Ms(.06, s * .74, .42), .44, .44, roc, PR(.75, 6));
    add(Ms(-.08, s * .5, .1), Ms(.1, s * .76, .14), .05, .05, LC, LX);
  }
  // ---- les bras ----
  const bras = (s, main) => {
    const A = Ms(0, s * .62, -.06), El = genouD(A, main, .74, .76, [-1, s * .65, .15]);
    add(A, El, .36, .34, roc2, GA(.6, 4));
    add(El, main, .32, .3, roc, PR(.9, 6));
    add(vM(El, main, .2), vM(El, main, .7), .36, .2, roc2, PR(1, 6));                      // la plaque de l'avant-bras
    add(vA(vM(El, main, .25), [0, 0, .12]), vA(vM(El, main, .65), [0, 0, .1]), .035, .04, LC, LX);
    if (feu) add(vM(A, El, .2), vM(A, El, .8), .035, .045, LC, LX);
    return El;
  };
  bras(1, vA(fistL, [0, 0, .12]));
  add([fistL[0] - .08, fistL[1], fistL[2] + .14], [fistL[0] + .12, fistL[1], fistL[2] + .12], .38, .3, roc2, GA(.6, 4));   // le poing
  for (const o of [-1, 0, 1]) add([fistL[0] + .12, fistL[1] + o * .1, fistL[2] + .2], [fistL[0] + .2, fistL[1] + o * .11, fistL[2] + .3], .06, .06, obs, PR(0, 6));
  bras(-1, W);
  // le tisonnier : un bracelet de fer, la barre noire, le dernier tiers rouge, le crochet
  const tip = vA(W, vK(pk, Lp)), lh = Math.hypot(pk[0], pk[1]), lat = lh > .1 ? [pk[1] / lh, -pk[0] / lh, 0] : [0, 1, 0];
  add(vS(W, vK(pk, .06)), vA(W, vK(pk, .1)), .32, .32, fer, PR(1, 8, .9));
  add(W, vA(W, vK(pk, .76)), .11, .11, fer, PR(1, 6, .9));
  add(vA(W, vK(pk, .76)), tip, .1, .1, LC, Object.assign(PR(.6, 6, .9), LX));
  add(tip, vA(vA(tip, vK(lat, .16)), vK(pk, -.06)), .07, .07, LC, Object.assign(PR(0, 6, .9), LX));
  // ---- les pattes arrière : courtes, épaisses, des pieds larges, des griffes d'obsidienne ----
  for (const [s, pf] of [[1, pg], [-1, pd]]) {
    const H = M(0, s * .36, -.14), Fp = vA(pf, [0, 0, .12]), Kn = genouD(H, Fp, .5, .5, [1, s * .3, .1]);
    add(H, Kn, .42, .4, roc2, GA(.6, 4)); add(Kn, Fp, .34, .32, roc, PR(.85, 6));
    if (feu) add(vM(H, Kn, .2), vM(H, Kn, .8), .035, .045, LC, LX);
    add([pf[0] - .08, pf[1], pf[2] + .07], [pf[0] + .18, pf[1], pf[2] + .06], .4, .15, roc2, GA(.6, 3));
    for (const o of [-1, 0, 1]) add([pf[0] + .16, pf[1] + o * .1, pf[2] + .05], [pf[0] + .27, pf[1] + o * .12, pf[2] + .01], .06, .05, obs, PR(0, 6));
  }
  // ---- le cou, la tête : basse sous les épaules, un front de basalte, une couronne d'obsidienne ----
  const N0 = Ms(.16, 0, .02), Hd = vA(Ms(.46, 0, -.22), [0, 0, -G.hP * .18]), Mh = rep(Hd, G.yaw + G.sYaw * .5 + G.hY, G.hP * .8, 0);
  add(N0, Hd, .44, .42, roc2, GA(.6, 4));
  add(Mh(-.12, 0, .02), Mh(.2, 0, 0), .5, .38, roc, GA(.55, 4));                                  // le crâne
  add(Mh(.06, -.24, .15), Mh(.06, .24, .15), .16, .13, roc2, PR(1, 6));                            // le front
  for (const s of [-1, 1]) add(Mh(.14, s * .13, .07), Mh(.19, s * .13, .07), .12, .07, froid ? croute : sp.oeil, Object.assign(GA(1, 3), { luit: !froid }));
  const j = cl(G.jaw, 0, .8);
  add(Mh(.14, 0, -.03), Mh(.36, 0, -.09), .36, .2, roc, PR(.7, 6));                               // la mâchoire du haut
  add(Mh(.04, 0, -.15), Mh(.34, 0, -.21 - j * .28), .32, .11, roc2, PR(.6, 6));                   // celle du bas, qui s'ouvre
  if (j > .12 && !froid) add(Mh(.08, 0, -.1), Mh(.28, 0, -.13 - j * .14), .24, .07 + j * .12, LC, LX);   // la gueule, un four
  for (const s of [-1, 1]) add(Mh(.28, s * .11, -.19 - j * .22), Mh(.34, s * .13, -.03 - j * .22), .055, .055, obs, PR(0, 6));   // les défenses
  for (let i = 0; i < 5; i++) { const y = (i - 2) * .1, hz = .36 + .08 * (2 - Math.abs(i - 2));
    add(Mh(-.06, y, .16), Mh(-.3, y * 1.5, .16 + hz), .08, .08, obs, PR(0, 6));
    if (feu && !froid) add(Mh(-.26, y * 1.45, .12 + hz), Mh(-.3, y * 1.5, .16 + hz), .045, .045, LC, LX); }
  // hors du lac : il remonte de dessous
  const sink = surgit ? (1 - emerge) * 2.4 : 0;
  if (sink) for (const o of B) { o.a[2] -= sink; o.b[2] -= sink; }
  return B;
}

// ============ (§200) LA FLORE RARE DU VOLCAN : SES PROPRES FORMES ============
// Les douze plantes rares de chaque biome du volcan (la cendre 28, la soufrière 25, le travertin 31) gardent la conduite
// de leur forme (flore.js : elles respirent, se ferment la nuit, mordent, fouettent, crachent), mais plus son dessin : ici,
// de la pierre, du verre et du feu, en prismes et en boules. Ce qui luit est de la lave sur la cendre (le rendu de la lave),
// du cristal de soufre sur la soufrière, de l'eau chaude sur le travertin. flore.js (osPlante) passe la main ici.
const VF_BIOS = new Set([25, 28, 31]);
function osPlanteVolcan(f) {
  const B = [], pl = f.pl, bio = pl.bio, g = f.graine || 0, fan = f.cueillie;
  const mix = (a, b, k) => a.map((v, j) => Math.round(v + (b[j] - v) * k)), cendre = bio === 28, soufre = bio === 25;
  // la palette du biome, rendue lisible sur son sol : la croûte du soufre plus sombre que la soufrière, l'obsidienne presque noire
  const [tige0, feuille0, petale, coeur, pointe0] = pl.pal;
  const tige = soufre ? mix(tige0, [64, 50, 26], .5) : tige0, feuille = soufre ? mix(feuille0, [130, 104, 40], .45) : feuille0, pointe = cendre ? mix(pointe0, [22, 14, 32], .55) : pointe0;
  const vent = 1 + Math.min(1.5, (typeof Meteo !== 'undefined' && Meteo.vent) || 0), nuit = lumiere() < .36;
  const sway = (k, a) => Math.sin(t * (.8 + g * .4) + k * .7 + g * 9) * a * vent;
  const fane = c => fan ? mix(c, [104, 96, 90], .6) : c;
  // la pierre a le grain de son biome (le basalte, le soufre, le travertin) ; l'obsidienne, le sien
  const T0 = typeof TEX === 'object' ? (cendre ? TEX.orgue : soufre ? TEX.soufre : TEX.travertin) : null, TO = typeof TEX === 'object' && cendre ? TEX.obsidienne : T0;
  const os = (a, b, w, h, c, F) => { const o = { a, b, w, h, c: fane(c), tex: c === pointe ? TO : T0 }; if (F) Object.assign(o, F); B.push(o); return o; };
  const vif = (a, b, w, h, c, F) => { const o = { a, b, w, h, c: fan ? mix(c, [84, 74, 70], .75) : c }; if (!fan) { o.luit = true; if (cendre) o.lave = 1; } if (F) Object.assign(o, F); B.push(o); return o; };
  const PR = { pans: 6, rond: .8 }, BO = { boule: 4, rond: .6 }, SOCLE = { pans: 8, rond: .8, fin: .7 };
  const add3 = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
  // la pointe d'un biome : une goutte de lave, une aiguille de soufre, une perle d'eau chaude
  const bout = (p, d, s) => cendre ? vif(p, add3(p, d, s * 1.4), s * 1.3, s * 1.3, petale, BO)
    : soufre ? vif(p, add3(p, d, s * 3), s * .9, s * .9, petale, { pans: 6, fin: .08 })
    : vif(p, [p[0], p[1], p[2] + s * 1.1], s * 1.4, s * 1.4, petale, BO);
  const fumee = soufre ? [214, 206, 150] : cendre ? [150, 144, 140] : [236, 240, 240];
  switch (pl.forme) {
    // ---- les simples ----
    case 'etoile': case 'cristalline': {                 // une rosette d'écailles de pierre, qui se referme la nuit sur sa braise
      os([0, 0, 0], [0, 0, .16], .42, .42, tige, SOCLE);
      const ouv = fan ? 1.2 : .2 + (nuit ? .95 : 0);
      for (let k = 0; k < 7; k++) {
        const a = k / 7 * 6.2832 + g * 2, c0 = Math.cos(ouv), d = [Math.cos(a) * c0, Math.sin(a) * c0, Math.sin(ouv)];
        const b0 = [Math.cos(a) * .1, Math.sin(a) * .1, .14], e = add3(b0, d, .46 + (k % 2) * .08);
        os(b0, e, .2, .06, k % 2 ? feuille : mix(feuille, tige, .4), { pans: 6, rond: .7, fin: .2 });
        if (k % 2 === 0) bout(e, d, .035);
      }
      const s = sway(0, .05);
      os([0, 0, .14], [s, -s, .5], .05, .05, tige, PR);
      vif([s, -s, .48], [s, -s, .64], .14, .14, coeur, BO);
      break;
    }
    case 'clochettes': {                                 // des lanternes de pierre creuse, pendues à une hampe, une lueur dans chacune
      os([0, 0, 0], [0, 0, .12], .3, .3, tige, SOCLE);
      const pts = [[0, 0, .1]];
      for (let k = 1; k <= 6; k++) { const q = k / 6; pts.push([q * .85 + sway(k, .03), sway(k + 2, .03), .1 + Math.sin(q * 2.6) * .95]); }
      for (let k = 0; k < 6; k++) os(pts[k], pts[k + 1], .055 - k * .005, .055 - k * .005, k % 2 ? tige : mix(tige, feuille, .3), PR);
      for (let k = 2; k <= 6; k++) {
        const p = pts[k], h = .1 + (k % 2) * .05, bas = [p[0] + sway(k + 9, .04), p[1] + sway(k + 4, .04), p[2] - h];
        os(p, bas, .012, .012, tige);
        os([bas[0], bas[1], bas[2] + .02], [bas[0], bas[1], bas[2] - .17], .15, .15, k % 2 ? feuille : mix(feuille, cendre ? tige : pointe, .3), { boule: soufre ? 3 : 4, rond: .55 });
        vif([bas[0], bas[1], bas[2] - .13], [bas[0], bas[1], bas[2] - .2], .08, .08, k % 2 ? coeur : petale, BO);
      }
      break;
    }
    case 'eventail': {                                   // des lames de pierre ponce dressées en éventail, criblées de pores
      const ax = g * 6.2832, ca = Math.cos(ax), sa = Math.sin(ax), rk = sway(0, .05), nr = [sa, -ca, 0];
      os([0, 0, 0], [0, 0, .14], .4, .32, tige, SOCLE);
      for (let k = 0; k < 6; k++) {
        const sg = k < 3 ? -1 : 1, th = sg * (.48 + (k % 3) * .3) + rk, L = .5 + ((k * .37 + g) % 1) * .25;
        const d = [ca * Math.sin(th), sa * Math.sin(th), Math.cos(th)], b0 = [d[0] * .06, d[1] * .06, .1], e = add3(b0, d, L);
        os(b0, e, .08, .16 + L * .1, cendre ? (k % 2 ? [168, 160, 150] : [146, 138, 130]) : k % 2 ? feuille : mix(feuille, coeur, .15), { fin: [.7, 1.3], tex: cendre && typeof TEX === 'object' ? TEX.cendre : T0 });   // la ponce, pâle
        for (const q of [.4, .7]) { const p = add3(add3(b0, d, L * q), nr, .04); os(p, add3(p, nr, .012), .045, .045, tige, { tex: null }); }
        bout(e, d, .03);
      }
      os([0, 0, .1], [0, 0, .42], .08, .08, tige, PR); vif([0, 0, .4], [0, 0, .5], .11, .11, coeur, BO);
      break;
    }
    case 'spirale': {                                    // trois crosses de perles de pierre, enroulées comme des ammonites ; elles fument
      os([0, 0, 0], [0, 0, .1], .34, .3, tige, SOCLE);
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * 6.2832 + g * 2, ca = Math.cos(a), sa = Math.sin(a), h = .5 + k * .2;
        const top = [ca * .16 + sway(k, .03), sa * .16 + sway(k + 1, .03), h];
        os([ca * .1, sa * .1, .06], top, .06, .06, tige, PR);
        const der = fan ? .2 : .65 + .35 * Math.sin(t * .3 + k + g * 4);
        let q = top, ang = 0, r = .2, w = .11;
        for (let j = 0; j < 8; j++) {
          ang += .85 * (1.45 - der * .5); r *= .84; w *= .88;
          const n = [q[0] + ca * Math.sin(ang) * r, q[1] + sa * Math.sin(ang) * r, q[2] + Math.cos(ang) * r * .9];
          os(q, n, w, w, j % 2 ? feuille : mix(feuille, pointe, j / 24), BO); q = n;
        }
        vif(q, [q[0], q[1], q[2] + .04], .07, .07, coeur, BO);
        if (!fan) for (let j = 0; j < 2; j++) {           // la fumée, l'acide qui goutte, la vapeur
          const ph = (t * .35 + j * .5 + k * .2 + g) % 1;
          if (soufre) vif([q[0], q[1], q[2] - .05 - ph * .45], [q[0], q[1], q[2] - .09 - ph * .45], .035, .035, pointe, BO);
          else os([q[0] + ph * .1, q[1], q[2] + .08 + ph * .55], [q[0] + ph * .12, q[1], q[2] + .14 + ph * .6], .05 + ph * .08, .05 + ph * .08, fumee, { boule: 4, rond: .6, tex: null });
        }
      }
      break;
    }
    case 'orbe': {                                       // des œufs de croûte fendus, leur cœur en fusion à nu, le couvercle soulevé
      os([0, 0, 0], [0, 0, .1], .36, .3, tige, SOCLE);
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * 6.2832 + g * 4, h = .55 + ((k * .29 + g) % .45), bob = Math.sin(t * 1.1 + k * 1.9) * .04, R = .13 + (k % 2) * .03;
        const c = [Math.cos(a) * .22 + sway(k, .04), Math.sin(a) * .22 + sway(k + 1, .04), h + bob];
        os([Math.cos(a) * .05, Math.sin(a) * .05, .08], [c[0], c[1], c[2] - R * .9], .035, .035, tige, PR);
        vif([c[0], c[1], c[2] - R * .8], [c[0], c[1], c[2] + R * .8], R * 1.6, R * 1.6, k % 2 ? coeur : petale, BO);
        for (let j = 0; j < 4; j++) { const b = j / 4 * 6.2832 + k + g, ox = Math.cos(b), oy = Math.sin(b);
          os([c[0] + ox * R * .8, c[1] + oy * R * .8, c[2] - R * .8], [c[0] + ox * R * .95, c[1] + oy * R * .95, c[2] + R * .3], R * .55, R * .55, j % 2 ? feuille : tige, { pans: 6, rond: .7, fin: .6 }); }
        const lev = fan ? 0 : .04 + .03 * Math.sin(t * 2 + k);
        os([c[0], c[1], c[2] + R * .7 + lev], [c[0] + .02, c[1], c[2] + R * 1.05 + lev], R * 1.3, R * 1.2, feuille, { boule: 3, rond: .5 });
        if (bio === 31 && !fan) { const jet = .1 + .14 * (.5 + .5 * Math.sin(t * 3 + k * 2)); vif([c[0], c[1], c[2] + R * 1.05 + lev], [c[0], c[1], c[2] + R * 1.05 + lev + jet], .03, .03, coeur); }
      }
      break;
    }
    case 'arbuste': {                                    // une concrétion : un tronc de nodules, des branches noueuses, des grappes au bout
      const s0 = sway(0, .04);
      os([0, 0, 0], [0, 0, .1], .4, .34, tige, SOCLE);
      let p = [0, 0, .08];
      for (let j = 0; j < 3; j++) { const n = [s0 * j * .3, 0, p[2] + .2]; os(p, n, .16 - j * .02, .16 - j * .02, j % 2 ? tige : mix(tige, feuille, .3), BO); p = n; }
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * 6.2832 + g * 5, ca = Math.cos(a), sa = Math.sin(a), r = .22 + (k % 3) * .1, z = p[2] - .1 + (k % 3) * .12 + sway(k, .03);
        const m = [ca * r * .5, sa * r * .5, (p[2] + z) / 2 + .05], e = [ca * r, sa * r, z + .12];
        os(p, m, .09, .09, tige, BO); os(m, e, .08, .08, feuille, BO);
        for (let j = 0; j < 2; j++) { const b = a + (j ? .9 : -.9), q = [e[0] + Math.cos(b) * .06, e[1] + Math.sin(b) * .06, e[2] + .03]; os(q, [q[0], q[1], q[2] + .07], .08, .08, k % 2 ? feuille : mix(feuille, pointe, .2), BO); }
        bout([e[0], e[1], e[2] + .05], [ca * .3, sa * .3, .95], .035);
      }
      vif([0, 0, p[2] - .02], [0, 0, p[2] + .1], .12, .12, coeur, BO);
      break;
    }
    // ---- les géantes : elles bougent ----
    case 'colosse': {                                    // le lys-cratère : une hampe d'orgues, un cratère de pétales épais, une mare qui bat au fond
      const respire = .5 + .5 * Math.sin(t * .8 + g * 6);
      os([0, 0, 0], [0, 0, .3], 1.1, 1.0, tige, { pans: 8, rond: .8, fin: .6 });
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g, ca = Math.cos(a), sa = Math.sin(a), sw = sway(k, .06);
        const m = [ca * .9, sa * .9, .55 + sw], e = [ca * 1.6, sa * 1.6, .15 + sw];
        os([ca * .2, sa * .2, .2], m, .42, .08, feuille, { fin: [.7, 1] }); os(m, e, .3, .06, mix(feuille, pointe, .25), { fin: .15 }); }
      let p = [0, 0, .25];
      for (let j = 0; j < 5; j++) { const n = [sway(j, .08) + (j % 2 ? .06 : -.04), sway(j + 3, .08), p[2] + .68]; os(p, n, .34 - j * .03, .34 - j * .03, j % 2 ? tige : mix(tige, feuille, .25), PR); p = n; }
      const c = p, ouv = fan ? .42 : .55 + respire * .15 + (nuit ? .2 : 0);
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.2832 + g * 2, d = [Math.cos(a) * Math.sin(ouv), Math.sin(a) * Math.sin(ouv), Math.cos(ouv)];
        const b0 = [c[0] + Math.cos(a) * .2, c[1] + Math.sin(a) * .2, c[2] - .05], e = add3(b0, d, 1.0 + (k % 2) * .15);
        os(b0, e, .5, .14, k % 2 ? feuille : mix(feuille, tige, .3), { pans: 6, rond: .7, fin: [.8, .6] });
        bout(e, d, .07); }
      vif([c[0], c[1], c[2] + .05], [c[0], c[1], c[2] + .2 + respire * .08], .55, .55, petale, { boule: 4, rond: .5 });
      if (!fan) for (let k = 0; k < 6; k++) { const ph = (t * .25 + k / 6 + g) % 1, a = k * 2.4 + g * 3, r = .25 + ph * .5, s = .07 * (1 - ph * .6);
        vif([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2] + .4 + ph * 1.4], [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2] + .4 + s + ph * 1.4], s, s, coeur, BO); }
      break;
    }
    case 'saule': {                                      // un saule de verre : des crins roux qui pendent, une larme au bout ; une couronne de cendre
      os([0, 0, 0], [0, 0, .25], .9, .8, tige, { pans: 8, rond: .8, fin: .6 });
      let p = [0, 0, .2];
      for (let j = 0; j < 4; j++) { const n = [sway(j, .05) + (j % 2 ? .08 : -.05), 0, p[2] + .65]; os(p, n, .36 - j * .04, .36 - j * .04, tige, PR); p = n; }
      const top = p, fil = mix(coeur, pointe, .25);
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g, ca = Math.cos(a), sa = Math.sin(a);
        const m = [top[0] + ca * .7, top[1] + sa * .7, top[2] + .5], br = [top[0] + ca * 1.4, top[1] + sa * 1.4, top[2] + .35];
        os(top, m, .14, .14, tige, PR); os(m, br, .1, .1, mix(tige, feuille, .3), PR);
        for (let j = 0; j < 2; j++) { let q = add3(br, [Math.cos(a + j * 1.3), Math.sin(a + j * 1.3), 0], .15 * j);
          for (let m2 = 1; m2 <= 5; m2++) { const n = [q[0] + Math.sin(t * .9 + k + j + m2 * .5) * .07 * vent, q[1] + Math.cos(t * .7 + k * 2 + m2 * .4) * .06 * vent, q[2] - .42];
            os(q, n, .025, .025, m2 < 4 ? fil : coeur, { tex: null }); q = n; }
          bout(q, [0, 0, -1], .04); } }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g * 2, r = .6 + (k % 2) * .3, z = top[2] + .55 + (k % 3) * .18, x = top[0] + Math.cos(a) * r, y = top[1] + Math.sin(a) * r;
        os([x, y, z], [x, y, z + .5], .75, .75, k % 2 ? feuille : mix(feuille, tige, .3), { boule: 4, rond: .6 }); }
      os([top[0], top[1], top[2] + .6], [top[0], top[1], top[2] + 1.3], 1.0, 1.0, feuille, { boule: 4, rond: .6 });
      break;
    }
    case 'meduse': {                                     // une cloche de pierre ponce que porte la vapeur d'un évent ; ses bras en chapelets
      const z0 = 2.3 + Math.sin(t * .9 + g * 5) * .22, pulse = .5 + .5 * Math.sin(t * 1.6 + g * 3), W = 1.75 + pulse * .15;
      os([0, 0, 0], [0, 0, .55], 1.1, 1.1, tige, { pans: 8, rond: .8, fin: .35 });
      vif([0, 0, .5], [0, 0, .6], .38, .38, coeur, { pans: 8 });
      const col = mix(feuille, fumee, .55), h4 = (z0 - .7) / 4;
      if (!fan) for (let j = 0; j < 4; j++) { const z1 = .6 + j * h4; os([sway(j, .05), sway(j + 2, .05), z1], [sway(j + 1, .05), sway(j + 3, .05), z1 + h4], .1 + j * .03, .1 + j * .03, col, { boule: 4, rond: .6, tex: null }); }
      os([0, 0, z0 - .05], [0, 0, z0 + .75], W, W, feuille, { boule: 4, rond: .5 });
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832 + g; vif([Math.cos(a) * .86, Math.sin(a) * .86, z0 + .12], [Math.cos(a) * .42, Math.sin(a) * .42, z0 + .66], .06, .06, petale); }
      vif([0, 0, z0 + .66], [0, 0, z0 + .84], .4, .4, coeur, BO);
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.2832 + .2; let q = [Math.cos(a) * .8, Math.sin(a) * .8, z0];
        for (let m = 1; m <= 5; m++) { const n = [q[0] + Math.sin(t * 1.3 + k + m * .7) * .08, q[1] + Math.cos(t * 1.1 + k + m * .6) * .08, q[2] - .3]; os(q, n, .07 - m * .008, .07 - m * .008, m % 2 ? feuille : tige, BO); q = n; }
        bout(q, [0, 0, -1], .04); }
      break;
    }
    case 'lumiere': {                                    // l'arbre-coulée : au bout de chaque branche une vasque qui déborde, un filet jusqu'au sol, sa flaque
      os([0, 0, 0], [0, 0, .3], 1.0, .9, tige, { pans: 8, rond: .8, fin: .6 });
      let p = [0, 0, .25];
      for (let j = 0; j < 3; j++) { const n = [sway(j, .04) + (j % 2 ? .07 : -.05), 0, p[2] + .7]; os(p, n, .42 - j * .05, .42 - j * .05, tige, PR); p = n; }
      const top = p;
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g, ca = Math.cos(a), sa = Math.sin(a), L = 1.1 + (k % 2) * .3;
        const m = [top[0] + ca * L * .5, top[1] + sa * L * .5, top[2] + .45], e = [top[0] + ca * L, top[1] + sa * L, top[2] + .35 + (k % 2) * .2];
        os(top, m, .16, .16, tige, PR); os(m, e, .12, .12, mix(tige, feuille, .3), PR);
        os([e[0], e[1], e[2] - .05], [e[0], e[1], e[2] + .14], .42, .42, feuille, { boule: 4, rond: .5 });
        vif([e[0], e[1], e[2] + .1], [e[0], e[1], e[2] + .16], .32, .32, petale, { boule: 3, rond: .5 });
        if (fan) continue;
        const lx = e[0] + ca * .2, ly = e[1] + sa * .2; let q = [lx, ly, e[2] + .08];
        for (let j = 1; j <= 4; j++) { const w = .07 - j * .008 + Math.sin(t * 4 + k + j) * .01, n = [lx + ca * .04 * j, ly + sa * .04 * j, e[2] + .08 - (e[2] + .03) * j / 4]; vif(q, n, w, w, j % 2 ? petale : coeur); q = n; }
        vif([q[0], q[1], .02], [q[0], q[1], .06], .4, .4, petale, { boule: 3, rond: .4 }); }
      for (let k = 0; k < 4; k++) { const a = k / 4 * 6.2832 + g * 2, x = top[0] + Math.cos(a) * .45, y = top[1] + Math.sin(a) * .45;
        os([x, y, top[2] + .6], [x, y, top[2] + 1.1], .7, .7, k % 2 ? feuille : tige, { boule: 4, rond: .6 }); }
      vif([top[0], top[1], top[2] + .9], [top[0], top[1], top[2] + 1.2], .3, .3, coeur, BO);
      break;
    }
    // ---- les vives : elles attaquent ----
    case 'gueule': {                                     // une gueule de basalte qui sort d'une fissure : mâchoires en dalles, dents d'obsidienne, langue de feu
      const arme = f.etat === 'arme' ? Math.min(1, f.armeT / .6) : 0, mord = f.etat === 'frappe' ? Math.max(0, 1 - f.frappeT / .25) : 0;
      os([0, 0, 0], [0, 0, .18], 1.2, 1.0, tige, SOCLE);
      vif([-.35, .05, .17], [.35, -.05, .17], .07, .04, petale);
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g, b0 = [Math.cos(a) * .55, Math.sin(a) * .55, .05];
        os(b0, [b0[0] + Math.cos(a) * .15, b0[1] + Math.sin(a) * .15, .55 + (k % 2) * .2], .16, .16, k % 2 ? pointe : feuille, { pans: 6, fin: .1 }); }
      const cb = f.cible ?? 0, rel = cb - f.dir, cx = Math.cos(rel), sy = Math.sin(rel), lance = mord * 1.3 - arme * .4;
      const pts = [[0, 0, .1], [-cx * .2 + sway(1, .05), -sy * .2, .75], [cx * (.1 + lance * .4), sy * (.1 + lance * .4), 1.3 + arme * .2], [cx * (.4 + lance), sy * (.4 + lance), 1.75 + arme * .3 - mord * .3]];
      for (let k = 0; k < 3; k++) { os(pts[k], pts[k + 1], .26 - k * .04, .26 - k * .04, k % 2 ? tige : mix(tige, feuille, .3), PR);
        if (cendre) vif(add3(pts[k], [-sy, cx, 0], .1), add3(pts[k + 1], [-sy, cx, 0], .09), .03, .03, petale); }
      const H = pts[3], ouv = (f.dead ? 0 : .25 + arme * .9) * (1 - mord), fw = [cx, sy, 0];
      for (const s of [1, -1]) {
        const d = [fw[0] * Math.cos(ouv * s), fw[1] * Math.cos(ouv * s), Math.sin(ouv * s)], e = add3(H, d, .8);
        os(H, e, .62, .16, s > 0 ? feuille : mix(feuille, tige, .4), { fin: [.75, .8] });
        for (let k = 0; k < 5; k++) { const q = (k + .5) / 5, b0 = [H[0] + d[0] * .8 * q - sy * (q - .5) * .5, H[1] + d[1] * .8 * q + cx * (q - .5) * .5, H[2] + d[2] * .8 * q];
          os(b0, [b0[0], b0[1], b0[2] - s * .14], .05, .05, pointe, { pans: 6, fin: .05 }); }
        const hb = [H[0] - sy * .17 * s - cx * .1, H[1] + cx * .17 * s - sy * .1, H[2] + .1];   // les cornes
        os(hb, [hb[0] - cx * .25, hb[1] - sy * .25, hb[2] + .3], .08, .08, pointe, { pans: 6, fin: .1 });
      }
      if (ouv > .3) vif(H, [H[0] + fw[0] * .45, H[1] + fw[1] * .45, H[2] + .02], .16, .08, petale);
      vif([H[0] - fw[0] * .06, H[1] - fw[1] * .06, H[2] - .06], [H[0], H[1], H[2] + .06], .3, .3, coeur, BO);
      break;
    }
    case 'fouetteuse': {                                 // le fouet de scories : des chapelets de nodules, des jointures qui couvent, une masse hérissée au bout
      os([0, 0, 0], [0, 0, .45], .8, .8, tige, { boule: 4, rond: .6 });
      vif([0, 0, .38], [0, 0, .52], .36, .36, coeur, { pans: 8 });
      const cb = f.cible ?? 0, rel = cb - f.dir, fr = f.etat === 'frappe' ? Math.max(0, 1 - f.frappeT / .35) : 0, ar = f.etat === 'arme' ? Math.min(1, f.armeT / .6) : 0;
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g, frappe = k === 0 ? fr : 0, arme = k === 0 ? ar : 0; let q = [0, 0, .45];
        for (let m = 1; m <= 7; m++) { const q2 = m / 7, A = frappe > 0 ? rel : a + Math.sin(t * 1.8 + k * 2 + m * .4) * .3, L = frappe > 0 ? .62 : .34;
          const z = frappe > 0 ? .5 + Math.sin(q2 * Math.PI) * 1.2 - q2 * .5 : .5 + Math.sin(q2 * 2.4) * (1.6 + arme * .8) + Math.sin(t * 2 + k + m) * .08;
          const n = [q[0] + Math.cos(A) * L, q[1] + Math.sin(A) * L, z];
          const w = .13 - m * .009, u = [n[0] - q[0], n[1] - q[1], n[2] - q[2]], l = Math.hypot(u[0], u[1], u[2]) || 1;
          os(q, n, w * .4, w * .4, tige, PR);
          os(add3(n, u, -w * .7 / l), add3(n, u, w * .5 / l), w, w, m % 2 ? feuille : mix(feuille, tige, .4), BO);
          if (m % 2 === 0) vif(add3(q, u, .45), add3(q, u, .55), w * .6, w * .6, petale, BO);
          q = n; }
        vif(q, [q[0], q[1], q[2] + .1], .16, .16, petale, BO);
        for (let j = 0; j < 3; j++) { const b = j * 2.1 + k; os(q, [q[0] + Math.cos(b) * .14, q[1] + Math.sin(b) * .14, q[2] + .06], .04, .04, pointe, { pans: 6, fin: .1 }); } }
      break;
    }
    case 'cracheuse': {                                  // une fumerolle : un cône de croûte en gradins, des veines, la bouche qui enfle avant de cracher
      const gonfle = f.etat === 'arme' ? Math.min(1, f.armeT / .9) : 0, pulse = .5 + .5 * Math.sin(t * 2.5 + g * 4), H = 1.2 + gonfle * .25;
      os([0, 0, 0], [0, 0, .4], 1.5, 1.5, tige, { pans: 8, rond: .8, fin: .75 });
      os([0, 0, .35], [0, 0, .8 + gonfle * .1], 1.12 + gonfle * .15, 1.12 + gonfle * .15, feuille, { pans: 8, rond: .8, fin: .7 });
      os([0, 0, .75 + gonfle * .1], [0, 0, H], .8 + gonfle * .2, .8 + gonfle * .2, mix(feuille, tige, .3), { pans: 8, rond: .8, fin: .6 });
      const bw = .45 + gonfle * .12 + pulse * .03;
      vif([0, 0, H - .04], [0, 0, H + .04 + gonfle * .06], bw, bw, coeur, { pans: 8 });
      for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + g; vif([Math.cos(a) * .26, Math.sin(a) * .26, H - .05], [Math.cos(a) * .7, Math.sin(a) * .7, .4], .045, .045, petale); }
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.2832 + g * 3 + .5, b0 = [Math.cos(a) * .9, Math.sin(a) * .9, .03];
        if (soufre) os(b0, [b0[0] + Math.cos(a) * .12, b0[1] + Math.sin(a) * .12, .35 + (k % 2) * .15], .1, .1, petale, { pans: 6, fin: .08 });
        else { os(b0, [b0[0], b0[1], b0[2] + .1], .26, .26, feuille, { boule: 3, rond: .5 }); vif([b0[0], b0[1], b0[2] + .08], [b0[0], b0[1], b0[2] + .12], .18, .18, petale, { boule: 3, rond: .4 }); } }
      if (gonfle > .2 && !fan) vif([0, 0, H + .05], [0, 0, H + .1 + gonfle * .4], .1 + gonfle * .1, .1 + gonfle * .1, petale, BO);
      break;
    }
  }
  if (f.hit > 0) for (const o of B) o.c = mix(o.c, [255, 220, 210], .5);
  return B;
}

// ============ (§200) LES MATIÈRES, LES DENRÉES, LES OBJETS DU VOLCAN : LEURS VIGNETTES ============
// Appelé par index.html une fois les denrées connues (DESSINS 'ingr_…'), avant que la feuille des vignettes ne s'écrive.
function vfPoly(d, P, c) {                                // un polygone plein, rangée par rangée
  let y0 = 99, y1 = -1; for (const p of P) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.ceil(y0); y <= y1; y++) {
    let a = 99, b = -99;
    for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length];
      if ((p[1] - y) * (q[1] - y) > 0) continue;
      if (p[1] === q[1]) { a = Math.min(a, p[0], q[0]); b = Math.max(b, p[0], q[0]); continue; }
      const x = p[0] + (y - p[1]) * (q[0] - p[0]) / (q[1] - p[1]); a = Math.min(a, x); b = Math.max(b, x); }
    if (b >= a) d.rect(Math.round(a), y, Math.round(b), y, c);
  }
}
const VF_L = [255, 128, 40], VF_LC = [255, 214, 110], VF_BL = [255, 250, 222];
function volcanIcones() {
  if (typeof DESSINS !== 'object') return;
  const D = DESSINS, I = (id, f) => { D['ingr_' + id] = f; }, cl = (c, k = 50) => c.map(v => Math.min(255, v + k)), fo = (c, k = .62) => c.map(v => v * k | 0);
  const L = VF_L, LC = VF_LC, OS = (typeof PIX !== 'undefined' && PIX.os) || [232, 224, 200];
  // ---- les matières ----
  D.basalte = d => {                                      // trois orgues de basalte, leurs têtes à six pans
    for (const [x, y0, c] of [[4, 6, [74, 72, 80]], [8, 3, [98, 96, 104]], [12, 8, [64, 62, 70]]]) {
      d.rect(x - 2, y0, x + 1, 14, c); d.rect(x - 1, y0 - 1, x, y0 - 1, cl(c, 30)); d.rect(x - 2, y0, x + 1, y0, cl(c, 44)); d.ligne(x + 1, y0 + 1, x + 1, 14, fo(c)); }
    d.ligne(1, 15, 14, 15, [40, 38, 44]);
  };
  D.verrenoir = d => {                                    // un éclat d'obsidienne : du verre noir, tranchant, un reflet violet
    vfPoly(d, [[9, 1], [13, 8], [11, 15], [4, 12], [5, 6]], [30, 24, 40]); vfPoly(d, [[9, 1], [13, 8], [9, 9]], [64, 50, 92]);
    d.ligne(9, 1, 5, 6, [178, 140, 240]); d.ligne(9, 9, 11, 15, [50, 40, 70]); d.net(9, 2, [236, 224, 255]); d.net(6, 9, [120, 96, 170]);
  };
  D.soufrenat = d => {                                    // du soufre natif : des prismes jaunes sur leur croûte
    const Y = [236, 206, 60], C = [255, 246, 160], F = [170, 132, 28];
    d.rect(2, 13, 14, 14, [120, 100, 60]); d.rect(3, 12, 13, 12, fo(Y, .8));
    vfPoly(d, [[3, 13], [3, 7], [5, 4], [7, 7], [7, 13]], Y); vfPoly(d, [[7, 13], [7, 4], [9, 1], [11, 4], [11, 13]], Y); vfPoly(d, [[11, 13], [11, 8], [13, 6], [14, 8], [14, 13]], F);
    d.ligne(5, 5, 5, 12, C); d.ligne(9, 2, 9, 12, C); d.ligne(4, 8, 4, 12, F); d.ligne(10, 5, 10, 12, F); d.net(9, 1, [255, 255, 220]);
  };
  // ---- les denrées de la flore commune ----
  I('p_tison', d => { const B = [44, 36, 34], Bc = [80, 64, 58];
    d.ligne(2, 14, 10, 6, B, 3); d.ligne(3, 13, 9, 7, Bc); d.ligne(6, 10, 4, 6, B, 2);
    d.disque(11.5, 4.5, 3, L); d.disque(11.5, 4.5, 1.8, LC); d.net(11, 4, VF_BL); d.net(14, 9, L); d.net(8, 2, LC); d.net(15, 4, L); });
  I('p_lisfeu', d => { const R = [214, 40, 24], O = [255, 110, 40], Y = [255, 210, 90];
    vfPoly(d, [[3, 14], [2, 8], [5, 3], [6, 9], [7, 14]], R); vfPoly(d, [[6, 14], [5, 6], [8, 1], [11, 6], [10, 14]], O); vfPoly(d, [[9, 14], [10, 8], [13, 4], [14, 9], [13, 14]], R);
    d.ligne(8, 3, 8, 12, Y); d.ligne(4, 7, 5, 12, O); d.ligne(13, 7, 12, 12, O); d.rect(4, 14, 12, 15, [70, 30, 26]); });
  I('p_vapeurbulbe', d => { const C = [226, 214, 190], F = [176, 160, 136], S = [236, 238, 240];
    d.disque(8, 10.5, 4.6, C); d.disque(9.5, 11.5, 3, F); d.rect(7, 4, 9, 6, F); d.rect(6, 4, 10, 4, C); d.net(6, 9, [250, 246, 236]);
    d.disque(5, 2, 1.3, S); d.disque(9, 1.5, 1.1, S); d.disque(12, 3, 1.4, S); });
  I('p_thermo', d => { const B = [[96, 164, 70], [236, 200, 70], [232, 140, 50], [196, 80, 40], [110, 210, 220]];
    for (let k = 0; k < 5; k++) d.disque(8, 8.5, 6.4 - k * 1.35, B[k]); d.net(7, 7, [236, 252, 250]); d.ligne(3, 13, 6, 14, fo(B[0])); });
  I('p_cendrine', d => { const V = [104, 84, 60], C = [236, 206, 140], G = [214, 184, 120];
    d.ligne(5, 6, 2, 2, G); d.ligne(10, 5, 13, 1, G); d.ligne(12, 10, 15, 13, G); d.ligne(7, 10, 5, 14, G);
    for (const [x, y] of [[5, 6], [10, 5], [7, 10], [12, 10]]) { d.disque(x, y, 2, V); d.net(x - 1, y - 1, C); } });
  I('p_piment', d => { const R = [230, 50, 24], C = [255, 150, 60], F = [140, 24, 16], G = [60, 70, 40];
    d.ligne(9, 4, 13, 11, F, 2); d.ligne(9, 4, 12, 9, R); d.net(13, 12, F); d.ligne(8, 3, 9, 4, G);
    d.ligne(4, 3, 10, 12, R, 3); d.ligne(5, 4, 9, 10, C); d.disque(10.5, 12.5, 1.3, R); d.ligne(3, 2, 5, 3, G, 2); d.net(2, 1, G); d.net(6, 7, [255, 220, 120]); });
  // ---- les viandes, le cœur du gardien ----
  I('v_magmaton', d => { const M = [170, 70, 60], Mc = [210, 110, 90], K = [52, 46, 48];
    d.disque(8, 8.5, 5, K); d.disque(8.5, 9, 3.6, M); d.disque(7, 8, 1.7, Mc); d.ligne(4, 6, 12, 12, L); d.ligne(11, 4, 6, 13, L); d.net(8, 9, LC);
    d.ligne(11, 12, 14, 15, OS, 2); d.disque(14.5, 14.5, 1.1, OS); });
  I('v_basilic', d => { const S = [86, 60, 50], Sc = [130, 90, 70], M = [196, 92, 72];
    d.disque(8, 8.5, 4.6, M); d.disque(6.5, 7.5, 2.2, [230, 130, 100]);
    for (const [x, y] of [[5, 5], [8, 4], [11, 6], [12, 9], [4, 9]]) { d.net(x, y, S); d.net(x + 1, y, Sc); }
    d.net(7, 11, L); d.net(10, 10, L); d.ligne(11, 12, 14, 15, OS, 2); d.disque(14.5, 14.5, 1.2, OS); });
  I('v_vautour', d => { const M = [188, 110, 86], Mc = [226, 150, 120], P = [120, 116, 112], Pc = [170, 166, 160];
    d.disque(6.5, 6.5, 4, M); d.disque(5.5, 5.5, 1.8, Mc); d.ligne(9, 9, 13, 13, OS, 2); d.disque(13.5, 13.5, 1.5, OS); d.disque(14.5, 12.5, 1, OS);
    d.ligne(2, 15, 6, 11, P, 2); d.ligne(3, 15, 7, 12, Pc); d.net(1, 15, [80, 76, 74]); });
  I('coeurtison', d => { const K = [44, 36, 38], Kc = [86, 72, 70];
    d.disque(5.5, 6, 3.5, K); d.disque(10.5, 6, 3.5, K); vfPoly(d, [[2, 7], [14, 7], [8, 14]], K);
    d.disque(5, 5, 1.4, Kc); d.ligne(8, 4, 8, 12, L); d.ligne(4, 7, 8, 9, L); d.ligne(12, 6, 8, 9, L); d.disque(8, 9, 1.4, LC); d.net(8, 9, VF_BL); });
  // ---- les plantes rares : une vignette par forme, aux couleurs de leur biome ----
  if (typeof FLORE_RARES !== 'undefined') for (const pl of FLORE_RARES) if (VF_BIOS.has(pl.bio)) I('p_' + pl.id, d => vfIconeRare(d, pl));
  // ---- les objets de l'établi ----
  D.lameobs = d => { vfPoly(d, [[5, 11], [13, 2], [14, 3], [7, 12]], [34, 26, 44]); d.ligne(6, 11, 13, 3, [176, 136, 240]); d.net(14, 2, [236, 224, 255]);
    d.ligne(3, 8, 8, 13, [70, 68, 76], 2); d.ligne(3, 13, 5, 11, [96, 66, 42], 2); d.net(2, 14, [98, 96, 104]); };
  D.cuirbasalte = d => { const K = [62, 60, 68], Kc = [100, 98, 108];
    vfPoly(d, [[2, 3], [6, 2], [8, 4], [10, 2], [14, 3], [13, 13], [8, 15], [3, 13]], K);
    for (const [x, y] of [[5, 6], [11, 6], [5, 10], [11, 10], [8, 12]]) d.rect(x - 1, y - 1, x, y, Kc);
    d.ligne(8, 4, 8, 14, L); d.ligne(3, 8, 13, 8, fo(L, .75)); d.ligne(2, 3, 3, 13, [40, 38, 44]); d.net(8, 8, LC); };
  D.masque_filtre = d => { const T = [120, 110, 96], Tc = [156, 146, 128], V = [30, 24, 40], R = [160, 120, 230], Y = [230, 200, 60];
    d.disque(8, 7.5, 5.5, T); d.rect(1, 5, 15, 6, Tc); d.disque(5.5, 6, 2, V); d.disque(10.5, 6, 2, V); d.net(5, 5, R); d.net(10, 5, R);
    d.rect(6, 10, 10, 14, [70, 66, 70]); d.rect(6, 11, 10, 11, Y); d.rect(6, 13, 10, 13, Y); d.net(8, 14, [40, 38, 44]); };
  D.patesoufre = d => { const P = [150, 112, 70], Pc = [186, 146, 96], Y = [240, 212, 70];
    d.rect(4, 7, 12, 14, P); d.rect(4, 7, 5, 14, Pc); d.rect(3, 6, 13, 7, fo(P, .8)); d.disque(8, 5.5, 3.6, Y); d.rect(3, 6, 13, 6, Y); d.net(7, 4, [255, 246, 160]); d.net(9, 5, [255, 246, 160]); };
}
function vfIconeRare(d, pl) {
  const [tige, feuille, petale, coeur, pointe] = pl.pal, fo = (c, k = .62) => c.map(v => v * k | 0);
  switch (pl.forme) {
    case 'etoile': for (let k = 0; k < 7; k++) { const a = k / 7 * 6.2832 - 1.57;
        vfPoly(d, [[8, 8.5], [8 + Math.cos(a - .32) * 6.5, 8.5 + Math.sin(a - .32) * 6.5], [8 + Math.cos(a) * 7.3, 8.5 + Math.sin(a) * 7.3], [8 + Math.cos(a + .32) * 6.5, 8.5 + Math.sin(a + .32) * 6.5]], k % 2 ? feuille : fo(feuille, .8));
        d.net(Math.round(8 + Math.cos(a) * 6.6), Math.round(8.5 + Math.sin(a) * 6.6), petale); }
      d.disque(8, 8.5, 2.2, tige); d.disque(8, 8.5, 1.3, coeur); return;
    case 'clochettes': d.ligne(2, 15, 4, 4, tige, 2); d.ligne(4, 4, 13, 3, tige);
      for (const [x, y] of [[6, 8], [9.5, 7], [13, 7.5]]) { d.ligne(x | 0, 3, x | 0, y - 2 | 0, tige); d.disque(x, y, 2.1, feuille); d.net(x | 0, y + 2 | 0, coeur); d.net((x | 0) - 1, y - 1 | 0, fo(feuille, 1.2)); } return;
    case 'eventail': for (let k = 0; k < 4; k++) { const a = -2.4 + k * .55;
        vfPoly(d, [[8, 14], [8 + Math.cos(a - .18) * 12, 14 + Math.sin(a - .18) * 12], [8 + Math.cos(a + .18) * 12, 14 + Math.sin(a + .18) * 12]], k % 2 ? feuille : fo(feuille, .82));
        d.net(Math.round(8 + Math.cos(a) * 7), Math.round(14 + Math.sin(a) * 7), tige); d.net(Math.round(8 + Math.cos(a) * 11), Math.round(14 + Math.sin(a) * 11), petale); }
      d.rect(6, 14, 10, 15, tige); return;
    case 'spirale': { let ang = 0, r = 6; for (let k = 0; k < 34; k++) { ang += .32; r *= .955; d.disque(8 + Math.cos(ang) * r, 8 + Math.sin(ang) * r, .4 + r * .16, k % 4 < 2 ? feuille : fo(feuille, .78)); }
      d.disque(8, 8, 1.3, coeur); d.net(3, 2, [180, 176, 170]); d.net(4, 1, [200, 196, 190]); return; }
    case 'orbe': d.disque(8, 9, 5.2, feuille); d.disque(8, 9.5, 3.2, petale); d.disque(8, 9.5, 1.6, coeur);
      d.ligne(3, 6, 6, 9, fo(feuille)); d.ligne(13, 7, 10, 10, fo(feuille)); vfPoly(d, [[3, 4], [12, 2], [13, 4], [4, 6]], fo(feuille, .85)); d.net(6, 3, fo(feuille, 1.25)); return;
    case 'arbuste': for (const [x, y, r] of [[8, 12, 2.6], [5, 9, 2.2], [11, 9, 2.2], [6, 5, 1.9], [10.5, 5, 1.9], [8, 2.6, 1.6]]) { d.disque(x, y, r, feuille); d.net(x - 1 | 0, y - 1 | 0, fo(feuille, 1.25)); }
      d.net(6, 4, petale); d.net(10, 4, petale); d.net(8, 2, petale); d.net(8, 11, coeur); return;
    case 'colosse': d.rect(7, 11, 9, 15, tige); vfPoly(d, [[1, 4], [15, 4], [11, 12], [5, 12]], feuille); vfPoly(d, [[1, 4], [5, 4], [6, 11], [5, 12]], fo(feuille, .8));
      d.rect(3, 4, 13, 5, petale); d.rect(5, 4, 11, 4, coeur); d.net(4, 2, coeur); d.net(10, 1, petale); d.net(12, 2, coeur); return;
    case 'saule': d.rect(7, 9, 9, 15, tige); d.disque(8, 4, 3.6, feuille); d.disque(5, 5.5, 2.4, fo(feuille, .85)); d.disque(11, 5.5, 2.4, fo(feuille, .85));
      for (const x of [2, 4, 12, 14]) { d.ligne(x, 6, x + (x < 8 ? -1 : 1), 12, fo(coeur, .9)); d.net(x + (x < 8 ? -1 : 1), 13, petale); } return;
    case 'meduse': d.disque(8, 6, 5.4, feuille); d.rect(2, 7, 14, 11, null); d.rect(3, 6, 13, 6, petale); d.net(8, 2, coeur); d.net(7, 1, coeur);
      for (const x of [3, 6, 10, 13]) for (let k = 0; k < 4; k++) d.net(x + (k % 2), 8 + k * 2, k % 2 ? tige : feuille);
      d.rect(6, 15, 10, 15, tige); return;
    case 'lumiere': d.rect(3, 9, 5, 15, tige); d.ligne(4, 9, 11, 4, tige, 2); vfPoly(d, [[8, 3], [15, 3], [14, 6], [9, 6]], feuille); d.rect(9, 3, 14, 3, petale);
      d.ligne(14, 6, 14, 13, petale); d.net(14, 9, coeur); d.rect(11, 14, 15, 15, petale); return;
    case 'gueule': vfPoly(d, [[3, 2], [8, 4], [13, 2], [11, 14], [8, 15], [5, 14]], fo(tige, 1.1)); vfPoly(d, [[5, 5], [8, 6], [11, 5], [8, 13]], pointe);
      d.ligne(8, 6, 8, 12, fo(pointe, 1.3)); d.net(8, 8, petale); d.net(4, 3, feuille); d.net(12, 3, feuille); return;
    case 'fouetteuse': for (let k = 0; k < 6; k++) { const x = 2.5 + k * 2, y = 13 - k * 2 + Math.sin(k * 1.4) * 1.2; d.disque(x, y, 1.7, k % 2 ? feuille : tige); if (k % 2) d.net(x | 0, y | 0, petale); }
      d.disque(13.5, 2.5, 2, petale); d.net(15, 1, pointe); d.net(11, 1, pointe); return;
    case 'cracheuse': vfPoly(d, [[1, 15], [5, 5], [11, 5], [15, 15]], feuille); vfPoly(d, [[1, 15], [5, 5], [6, 5], [4, 15]], fo(feuille, .8));
      d.rect(5, 4, 11, 5, coeur); d.ligne(6, 6, 4, 13, petale); d.ligne(10, 6, 12, 13, petale); d.disque(8, 1.8, 1.6, petale); return;
  }
  d.disque(8, 9, 4.5, petale); d.disque(8, 9, 2, coeur);
}
// ---------- la lame d'obsidienne, en main ; et ce que fait son coup ----------
function volcanGeomArme(id, at, vv, pose) {
  if (id !== 'lameobs') return false;
  pose(at(-.05), at(-.03), .032, .032, [70, 68, 76]);                       // le pommeau, un galet de basalte
  pose(at(-.03), at(.045), .024, .024, [96, 66, 42]);                       // la fusée, de cuir
  pose(vv(at(.05), -.05), vv(at(.05), .05), .026, .024, [62, 60, 68]);       // la garde, de basalte
  pose(at(.055), at(.3), .046, .012, [30, 24, 40]);                         // la lame : du verre noir
  pose(vv(at(.06), .02), vv(at(.29), .014), .01, .014, [150, 110, 220]);     // le fil, qui accroche la lumière
  pose(at(.3), at(.38), .026, .01, [44, 34, 58]);
  return true;
}
function volcanCoupArme(b) {                               // (blesseParJoueur) le verre noir entaille : la bête saigne trois secondes
  if (!b || P.equip.arme !== 'lameobs' || b.dead || !(b.pv > 0) || b.sp.batiment) return;
  b.fgSaigne = { fin: t + 3, dps: .06 };
}
// ---------- le masque filtrant, sur le visage (heroBones) ----------
function volcanMasque(J, h, B) {
  if (!(J === P ? P.equip && P.equip.accessoire === 'masque_filtre' : !!(J && J.fx && J.fx.filtre))) return;
  const p = d => [h[0] + d[0], h[1] + d[1], h[2] + d[2]];
  B.push({ a: p([.06, 0, -.07]), b: p([.06, 0, .05]), w: .2, h: .07, c: [118, 108, 94] });                 // la face de toile
  B.push({ a: p([-.06, 0, .035]), b: p([.08, 0, .035]), w: .205, h: .04, c: [150, 140, 122] });           // la sangle
  for (const s of [-1, 1]) B.push({ a: p([.088, s * .048, .022]), b: p([.112, s * .048, .022]), w: .056, h: .056, c: [34, 26, 46], boule: 3 });   // les verres d'obsidienne
  B.push({ a: p([.09, 0, -.045]), b: p([.17, 0, -.07]), w: .075, h: .075, c: [70, 66, 72], pans: 8 });   // le filtre
  B.push({ a: p([.165, 0, -.068]), b: p([.182, 0, -.073]), w: .082, h: .082, c: [230, 200, 60], pans: 8 });   // sa bague de soufre
}
