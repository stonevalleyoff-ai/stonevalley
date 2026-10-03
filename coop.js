// Stone Valley — LES AMIS ET LE GROUPE D'EXPÉDITION (coop.js)
// Tout passe par la diffusion Realtime déjà ouverte par le jeu (rien n'est écrit en base) :
//  - chacun a un CODE D'AMI de six lettres, tiré de son compte, et écoute son canal « sv:ami:<code> » ;
//  - ajouter un ami : on envoie une demande sur son canal ; s'il est en ligne, il l'accepte ou la
//    refuse ; sinon la demande attend (un quart d'heure) et repart dès qu'on le voit passer en ligne ;
//  - LE GROUPE D'EXPÉDITION (quatre au plus) : on invite un ami en ligne ; le groupe a son canal
//    « sv:groupe:<id> » où chacun dit où il est, toutes les cinq secondes ;
//  - quand un membre passe un portail, les autres (ailleurs) se voient demander s'ils le suivent :
//    oui, et ils arrivent sur son île, à son niveau ; non (ou sans réponse en trente secondes), et
//    le jeu leur dit qu'ils le rejoindront en passant n'importe quel portail — leur prochain portail
//    les mène auprès de lui.
// Amis, groupe et rendez-vous sont gardés dans la sauvegarde. Le jeu (index.html) appelle, s'ils
// existent : coopBrancher, coopRecevoir, coopPortail, coopCible, majCoop, pageAmis, coopAction.
const COOP = { ui: null, avis: [], ouT: 0, relanceT: 0, lieux: new Map(), saisie: '' };
const COOP_ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', COOP_MAX = 4;
function codeAmi(u) {
  u = u || (typeof Compte !== 'undefined' && Compte.uid); if (!u) return '';
  let h = 2166136261 >>> 0; for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u.charCodeAt(i), 16777619) >>> 0;
  let s = ''; for (let i = 0; i < 6; i++) { s += COOP_ALPH[h % 31]; h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + i * 0x9e3779b9) >>> 0; }
  return s;
}
const canalAmi = c => 'sv:ami:' + c, canalGroupe = id => 'sv:groupe:' + id;
const coopMoi = () => ({ u: Compte.uid, n: pseudo(), c: codeAmi(), g: SEED, niv: profondeur() });
const coopPret = () => !!(Compte.dedans && Compte.uid && RS.ouvert);
function coopInit() { if (!Array.isArray(P.amis)) P.amis = []; if (!Array.isArray(P.amisAttente)) P.amisAttente = []; }
function coopBrancher() {
  coopInit(); if (!Compte.uid) return;
  ouvrirCanal(canalAmi(codeAmi()));
  if (P.groupe) { ouvrirCanal(canalGroupe(P.groupe.id)); diffuser(canalGroupe(P.groupe.id), 'ou', coopMoi()); }
}
// ---------- la réception ----------
function coopRecevoir(topic, evt, d) {
  coopInit();
  if (topic === canalAmi(codeAmi())) {
    const ami = P.amis.find(a => a.u === d.u);
    if (evt === 'demande') {
      if (ami) { diffuser(canalAmi(d.c), 'accepte', coopMoi()); return true; }
      if (P.amisAttente.some(a => a.c === d.c)) { coopAjouter(d); diffuser(canalAmi(d.c), 'accepte', coopMoi()); return true; }   // demandes croisées
      coopAvis({ k: 'ami', d, texte: `${d.n} (${d.c}) veut être votre ami`, oui: 'Accepter', non: 'Refuser' });
    } else if (evt === 'accepte') {
      P.amisAttente = P.amisAttente.filter(a => a.c !== d.c); coopAjouter(d); say(d.n + ' est maintenant votre ami', 3);
    } else if (evt === 'refuse') { P.amisAttente = P.amisAttente.filter(a => a.c !== d.c); say(d.n + ' a décliné votre demande', 3); }
    else if (evt === 'retire') { P.amis = P.amis.filter(a => a.u !== d.u); Sauve.sale = true; }
    else if (evt === 'invite') {
      if (!ami) return true;                               // seuls les amis invitent
      if (P.groupe && P.groupe.id === d.gid) return true;
      coopAvis({ k: 'groupe', d, texte: `${d.n} vous invite dans son groupe d'expédition (${(d.membres || []).length} membre${(d.membres || []).length > 1 ? 's' : ''})`, oui: 'Rejoindre', non: 'Décliner' });
    } else if (evt === 'decline') say(d.n + ' décline votre invitation', 3);
    rafraichirAmis(); return true;
  }
  if (P.groupe && topic === canalGroupe(P.groupe.id)) {
    const G = P.groupe;
    if (evt === 'ou') { COOP.lieux.set(d.u, { g: d.g, niv: d.niv, n: d.n, vu: Date.now() }); if (!G.membres.some(m => m.u === d.u) && G.membres.length < COOP_MAX) G.membres.push({ u: d.u, n: d.n, c: d.c }); }
    else if (evt === 'rejoint') {
      if (!G.membres.some(m => m.u === d.u) && G.membres.length < COOP_MAX) G.membres.push({ u: d.u, n: d.n, c: d.c });
      COOP.lieux.set(d.u, { g: d.g, niv: d.niv, n: d.n, vu: Date.now() }); say(d.n + ' rejoint le groupe', 3);
      diffuser(canalGroupe(G.id), 'membres', { u: Compte.uid, chef: G.chef, membres: G.membres }); diffuser(canalGroupe(G.id), 'ou', coopMoi());
    } else if (evt === 'membres') { for (const m of d.membres || []) if (!G.membres.some(x => x.u === m.u) && G.membres.length < COOP_MAX) G.membres.push(m); if (d.chef) G.chef = d.chef; }
    else if (evt === 'quitte') { G.membres = G.membres.filter(m => m.u !== d.u); COOP.lieux.delete(d.u); say((d.n || 'un membre') + ' quitte le groupe', 3); if (G.chef === d.u) G.chef = (G.membres[0] || {}).u; if (G.membres.length <= 1) { say('le groupe est dissous', 3); coopQuitter(true); } }
    else if (evt === 'portail') {
      COOP.lieux.set(d.u, { g: d.g, niv: d.niv, n: d.n, vu: Date.now() });
      if (d.g !== SEED) {
        COOP.avis = COOP.avis.filter(a => !(a.k === 'suivre' && a.d.u === d.u));
        coopAvis({ k: 'suivre', d, texte: `${d.n} a passé le portail · exploration ${d.niv}. Le suivre ?`, oui: 'Le suivre', non: 'Plus tard', delai: 30 });
        SON.jouer('portail');
      }
    }
    Sauve.sale = true; rafraichirAmis(); return true;
  }
  return false;
}
function coopAjouter(d) {
  coopInit(); if (!d || !d.u || d.u === Compte.uid) return;
  const a = P.amis.find(x => x.u === d.u); if (a) { a.n = d.n; a.c = d.c; } else if (P.amis.length < 50) P.amis.push({ u: d.u, n: String(d.n || '?').slice(0, 18), c: String(d.c || '').slice(0, 6) });
  Sauve.sale = true; rafraichirAmis();
}
// ---------- les avis : une carte en haut de l'écran, avec ses deux boutons ----------
function coopAvis(a) { a.t = Date.now(); COOP.avis.push(a); coopCarte(); }
function coopCarte() {
  if (!COOP.ui) {
    const el = document.createElement('div'); el.id = 'coop-avis';
    const st = document.createElement('style');
    st.textContent = `#coop-avis{position:fixed;z-index:1000;left:50%;top:calc(64px + env(safe-area-inset-top));transform:translateX(-50%);width:min(440px,calc(100% - 24px));display:none;flex-direction:column;gap:8px}
    #coop-avis.ouvert{display:flex} #coop-avis .ca{background:rgba(22,26,38,.95);border:1px solid rgba(143,227,255,.35);border-radius:12px;padding:10px 12px;color:#dde6f2;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.45)}
    #coop-avis .ca p{margin:0 0 8px;line-height:1.4} #coop-avis .ca div{display:flex;gap:8px;justify-content:flex-end}
    #coop-avis button{font:inherit;font-size:13px;padding:6px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#dde6f2;cursor:pointer}
    #coop-avis button.oui{background:#8fe3ff;color:#10202a;border-color:#8fe3ff;font-weight:700} #coop-avis .t{font-size:11px;color:#8a98ad}`;
    document.head.appendChild(st); document.body.appendChild(el); COOP.ui = el;
  }
  const el = COOP.ui; el.innerHTML = '';
  COOP.avis.slice(-3).forEach(a => {
    const c = document.createElement('div'); c.className = 'ca';
    const p = document.createElement('p'); p.textContent = a.texte; c.appendChild(p);
    const r = document.createElement('div');
    if (a.delai) { const s = document.createElement('span'); s.className = 't'; s.dataset.t = a.t; r.appendChild(s); }
    for (const [lib, oui] of [[a.non, false], [a.oui, true]]) { const b = document.createElement('button'); b.textContent = lib; if (oui) b.className = 'oui'; b.onclick = e => { e.stopPropagation(); coopRepondre(a, oui); }; r.appendChild(b); }
    c.appendChild(r); el.appendChild(c);
  });
  el.classList.toggle('ouvert', COOP.avis.length > 0);
}
function coopRepondre(a, oui) {
  COOP.avis = COOP.avis.filter(x => x !== a); coopCarte();
  const d = a.d;
  if (a.k === 'ami') { if (oui) { coopAjouter(d); diffuser(canalAmi(d.c), 'accepte', coopMoi()); say(d.n + ' est maintenant votre ami', 3); } else diffuser(canalAmi(d.c), 'refuse', coopMoi()); }
  else if (a.k === 'groupe') {
    if (!oui) { diffuser(canalAmi(d.c), 'decline', coopMoi()); return; }
    if (P.groupe) coopQuitter(true);
    const membres = (d.membres || []).filter(m => m.u !== Compte.uid).slice(0, COOP_MAX - 1);
    P.groupe = { id: String(d.gid).slice(0, 24), chef: d.u, membres: [...membres, { u: Compte.uid, n: pseudo(), c: codeAmi() }] };
    ouvrirCanal(canalGroupe(P.groupe.id)); diffuser(canalGroupe(P.groupe.id), 'rejoint', coopMoi());
    say('vous rejoignez le groupe de ' + d.n, 3); Sauve.sale = true;
  } else if (a.k === 'suivre') {
    if (oui) { P.groupeCible = null; Sauve.sale = true; voyagerVers(d.g, null, 'vous suivez ' + d.n + ' · exploration ' + d.niv, d.niv); }
    else { P.groupeCible = { g: d.g, niv: d.niv, n: d.n, u: d.u }; Sauve.sale = true; say('Vous rejoindrez ' + d.n + ' en passant n\'importe quel portail', 4.5); }
  }
  rafraichirAmis();
}
// ---------- les portails ----------
const coopCible = () => !!(P.groupe && P.groupeCible);
function coopPortail(g, niv) {                          // rend la destination (détournée vers le groupe), et prévient le groupe
  let r = null;
  if (P.groupe && P.groupeCible) {
    const c = P.groupeCible, L = COOP.lieux.get(c.u), fin = L && L.g && Date.now() - L.vu < 120000 ? L : c;   // là où il est maintenant, si on le sait
    r = { g: fin.g, niv: fin.niv, mot: 'le portail vous mène auprès de ' + c.n + ' · exploration ' + fin.niv }; P.groupeCible = null; Sauve.sale = true;
  }
  if (P.groupe && coopPret()) { const m = coopMoi(); m.g = r ? r.g : g; m.niv = r ? r.niv : niv; diffuser(canalGroupe(P.groupe.id), 'portail', m); }
  return r;
}
// ---------- les gestes de la page ----------
function coopAction(k, arg) {
  coopInit();
  if (!coopPret() && k !== 'oublier' && k !== 'copier') { say('il faut être connecté et en ligne', 2.4); return; }
  if (k === 'copier') { try { navigator.clipboard.writeText(codeAmi()); say('code copié · ' + codeAmi(), 2); } catch (e) { say('votre code : ' + codeAmi(), 3); } return; }
  if (k === 'ajout') {
    const c = String(COOP.saisie || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.length !== 6) { say('un code d\'ami a six lettres', 2); return; }
    if (c === codeAmi()) { say('c\'est votre propre code', 2); return; }
    if (P.amis.some(a => a.c === c)) { say('déjà dans vos amis', 2); return; }
    diffuser(canalAmi(c), 'demande', coopMoi());
    P.amisAttente = P.amisAttente.filter(a => a.c !== c); P.amisAttente.push({ c, t: Date.now() }); COOP.saisie = '';
    say('demande envoyée à ' + c + ' · il doit être en ligne pour l\'accepter', 3); Sauve.sale = true;
  } else if (k === 'retirer') {
    const a = P.amis.find(x => x.u === arg); if (!a) return;
    diffuser(canalAmi(a.c), 'retire', coopMoi()); P.amis = P.amis.filter(x => x.u !== arg); Sauve.sale = true;
  } else if (k === 'annuler') { P.amisAttente = P.amisAttente.filter(a => a.c !== arg); Sauve.sale = true; }
  else if (k === 'inviter') {
    const a = P.amis.find(x => x.u === arg); if (!a) return;
    if (!EnLigne.has(a.u)) { say(a.n + ' n\'est pas en ligne', 2); return; }
    if (!P.groupe) { P.groupe = { id: Compte.uid.slice(0, 8) + Date.now().toString(36), chef: Compte.uid, membres: [{ u: Compte.uid, n: pseudo(), c: codeAmi() }] }; ouvrirCanal(canalGroupe(P.groupe.id)); }
    if (P.groupe.membres.length >= COOP_MAX) { say('le groupe est complet (' + COOP_MAX + ')', 2); return; }
    if (P.groupe.membres.some(m => m.u === a.u)) { say(a.n + ' est déjà du groupe', 2); return; }
    const m = coopMoi(); m.gid = P.groupe.id; m.membres = P.groupe.membres;
    diffuser(canalAmi(a.c), 'invite', m); say('invitation envoyée à ' + a.n, 2.4); Sauve.sale = true;
  } else if (k === 'quitter') coopQuitter();
  else if (k === 'oublier') { P.groupeCible = null; Sauve.sale = true; }
  rafraichirAmis();
}
function coopQuitter(silence) {
  if (!P.groupe) return;
  if (coopPret()) { diffuser(canalGroupe(P.groupe.id), 'quitte', { u: Compte.uid, n: pseudo() }); quitterCanal(canalGroupe(P.groupe.id)); }
  P.groupe = null; P.groupeCible = null; COOP.lieux.clear(); Sauve.sale = true;
  if (!silence) say('vous quittez le groupe', 2.4);
  rafraichirAmis();
}
const rafraichirAmis = () => { if (typeof sacOuvert !== 'undefined' && sacOuvert && ongletSac === 'amis') majSac(); };
// ---------- à chaque image ----------
function majCoop(dt) {
  coopInit();
  const now = Date.now();
  if (COOP.avis.some(a => a.delai && now - a.t > a.delai * 1000)) {             // sans réponse : « plus tard »
    for (const a of COOP.avis.filter(a => a.delai && now - a.t > a.delai * 1000)) coopRepondre(a, false);
  }
  if (COOP.ui && COOP.avis.length) COOP.ui.querySelectorAll('.t').forEach(s => { s.textContent = Math.max(0, 30 - Math.round((now - (+s.dataset.t)) / 1000)) + ' s'; });
  COOP.avis = COOP.avis.filter(a => a.delai || now - a.t < 120000);
  if (!coopPret()) return;
  if (P.groupe && now - COOP.ouT > 5000) { COOP.ouT = now; diffuser(canalGroupe(P.groupe.id), 'ou', coopMoi()); }
  if (now - COOP.relanceT > 6000) {                                             // les demandes en attente repartent quand on voit le joueur
    COOP.relanceT = now; P.amisAttente = P.amisAttente.filter(a => now - a.t < 15 * 60000);
    for (const a of P.amisAttente) for (const [, e] of EnLigne) if (e.c === a.c) diffuser(canalAmi(a.c), 'demande', coopMoi());
  }
}
// ---------- la page « Amis » du sac ----------
function pageAmis() {
  coopInit();
  const ESCh = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const btn = (k, arg, txt, cl) => `<button class="btn${cl ? ' ' + cl : ''}" data-coop="${k}"${arg ? ` data-arg="${ESCh(arg)}"` : ''}>${txt}</button>`;
  const lieu = l => !l ? 'lieu inconnu' : l.g === SEED ? 'sur votre île' : 'île ' + (typeof nomIle === 'function' ? nomIle(l.g) : l.g) + ' · exploration ' + l.niv;
  let h = `<div class="col-g" data-defil="amis" style="flex:1"><h3>Vos amis</h3>`;
  if (!Compte.dedans) h += `<p class="note">Connectez-vous à un compte pour avoir des amis et former un groupe.</p>`;
  h += `<div class="obj"><div style="flex:1"><div class="n">Votre code d'ami</div><div class="d" style="font-size:20px;letter-spacing:4px;color:var(--or);font-weight:800">${ESCh(codeAmi() || '------')}</div>`
    + `<div class="d">Donnez-le à un ami : il l'entre chez lui, vous acceptez.</div></div>${btn('copier', '', 'Copier')}</div>`;
  h += `<div class="obj"><div style="flex:1"><div class="n">Ajouter un ami</div><div class="tp-champs"><label>Son code<input type="text" maxlength="6" autocapitalize="characters" data-coopsaisie="1" value="${ESCh(COOP.saisie || '')}" placeholder="ABC123" style="text-transform:uppercase;letter-spacing:3px;width:8em"></label>`
    + btn('ajout', '', 'Envoyer la demande', 'principal') + `</div></div></div>`;
  for (const a of P.amisAttente) h += `<div class="obj"><div style="flex:1"><div class="n">Demande en attente · ${ESCh(a.c)}</div><div class="d">elle repart dès que ce joueur passe en ligne</div></div>${btn('annuler', a.c, 'Annuler')}</div>`;
  if (!P.amis.length) h += `<p class="note">Aucun ami pour l'instant.</p>`;
  for (const a of P.amis) {
    const e = EnLigne.get(a.u), dans = P.groupe && P.groupe.membres.some(m => m.u === a.u);
    h += `<div class="obj"><div style="flex:1"><div class="n">${ESCh(a.n)} <span style="color:#8a98ad;font-size:11px">${ESCh(a.c)}</span></div>`
      + `<div class="d">${e ? '<span style="color:#9fe39f">en ligne</span> · ' + lieu({ g: e.graine, niv: (COOP.lieux.get(a.u) || {}).niv ?? '?' }) : 'hors ligne'}${dans ? ' · dans votre groupe' : ''}</div></div>`
      + `<div style="display:flex;gap:6px">${!dans && e ? btn('inviter', a.u, 'Inviter au groupe', 'principal') : ''}${btn('retirer', a.u, 'Retirer')}</div></div>`;
  }
  h += `</div><div class="col-d" style="flex:1"><h3>Groupe d'expédition</h3>`;
  if (!P.groupe) h += `<p class="note">Invitez un ami en ligne pour former un groupe (${COOP_MAX} au plus). Quand l'un de vous passe un portail, les autres peuvent le suivre.</p>`;
  else {
    for (const m of P.groupe.membres) {
      const moiM = m.u === Compte.uid, l = moiM ? { g: SEED, niv: profondeur() } : COOP.lieux.get(m.u);
      h += `<div class="obj"><div style="flex:1"><div class="n">${ESCh(m.n)}${moiM ? ' (vous)' : ''}${P.groupe.chef === m.u ? ' · chef' : ''}</div><div class="d">${moiM ? 'exploration ' + profondeur() : lieu(l)}</div></div></div>`;
    }
    if (P.groupeCible) h += `<div class="obj"><div style="flex:1"><div class="n">Rendez-vous</div><div class="d">votre prochain portail vous mène auprès de ${ESCh(P.groupeCible.n)} (exploration ${P.groupeCible.niv})</div></div>${btn('oublier', '', 'Oublier')}</div>`;
    h += btn('quitter', '', 'Quitter le groupe');
  }
  return h + `</div>`;
}
function dessinOngletAmis(d) { d.rect(3, 5, 6, 8, [220, 190, 150]); d.rect(2, 9, 7, 14, [120, 160, 200]); d.rect(9, 4, 12, 7, [220, 190, 150]); d.rect(8, 8, 13, 14, [200, 140, 110]); }
