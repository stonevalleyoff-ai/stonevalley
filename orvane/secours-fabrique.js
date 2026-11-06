#!/usr/bin/env node
// Orvane × Stone Valley — LE MONDE DE SECOURS (§225)
// Fabrique orvane/secours.js : le monde d'Orvane réduit à ce que le jeu en montre (les lignées de ses sols, leurs parents, les
// machines ; leurs populations sur les biomes que lit le jeu), sans la genèse 7. Le jeu le charge avec ses scripts : au premier
// lancement hors ligne, ou avant que le monde publié n'arrive, les îles ont déjà leur faune d'Orvane. À refaire de temps en temps,
// quand le monde a beaucoup changé :
//     node orvane/secours-fabrique.js <dossier d'un monde, ex. orvane/mondes/orvane/> > orvane/secours.js
const fs = require('fs'), path = require('path');
const dossier = process.argv[2]; if (!dossier) { console.error('usage : node orvane/secours-fabrique.js <dossier du monde>'); process.exit(1); }
globalThis.localStorage = { getItem: () => null, setItem: () => { } };
const ici = __dirname;
globalThis.OrvaneSV_Corr = require(path.join(ici, 'correspondance.js'));
globalThis.OrvaneTampon = require(path.join(ici, 'tampon.js'));
globalThis.OrvaneCorps = require(path.join(ici, 'corps.js'));
require(path.join(ici, 'orvane-sv.js'));
const O = globalThis.OrvaneSV, Corr = globalThis.OrvaneSV_Corr;
const I = O.purger(JSON.parse(fs.readFileSync(path.join(dossier, 'instantane.json'), 'utf8')));
Corr.choisirCarte(I.biomes.map(b => b.id));
const sols = new Set(Object.keys(Corr.BIOMES_SV).map(k => Corr.biomeOrvane(+k)).filter(Boolean));
const par = new Map(I.taxons.map(t => [t.id, t]));
const garde = new Set(O.ligneesDuJeu(I).map(t => t.id));
for (const t of I.taxons) if (t.plan?.regime === 'synthetique') garde.add(t.id);
for (const id of [...garde]) { let t = par.get(id); while (t && t.parent) { garde.add(t.parent); t = par.get(t.parent); } }
const surSols = f => Object.fromEntries(Object.entries(f || {}).filter(([b]) => sols.has(b)));
const taxons = I.taxons.filter(t => garde.has(t.id)).map(t => ({ ...t,
  populations: t.populations.filter(p => sols.has(p.biome)),
  phenotypes: (t.phenotypes || []).filter(p => p.frequence >= .0005 || Object.values(surSols(p.frequence_par_biome)).some(v => v >= .0005))
    .map(p => ({ ...p, frequence_par_biome: surSols(p.frequence_par_biome) })) }));
const S = { ...I, taxons, biomes: I.biomes.filter(b => sols.has(b.id)), parcelles: (I.parcelles || []).filter(p => sols.has(p.type)),
  precedent: null, evenements: [], secours: { fait: new Date().toISOString().slice(0, 10), cycle: I.cycle?.n } };
process.stdout.write('// Le monde de secours de Stone Valley (§225) : fait par orvane/secours-fabrique.js — ne pas modifier à la main.\n'
  + '// Monde « ' + (I.monde?.nom || I.monde?.id) + ' », cycle ' + I.cycle?.n + ', ' + taxons.length + ' taxons.\n'
  + 'var ORVANE_SECOURS = ' + JSON.stringify(S) + ';\n');
