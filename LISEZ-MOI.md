# Stone Valley — alpha ouverte (PWA)

Le dossier à mettre en ligne :

| fichier | rôle |
| --- | --- |
| `index.html` | le jeu entier, porte de connexion comprise |
| `manifest.webmanifest` | le nom, les couleurs et les icônes de l'application installable |
| `sw.js` | le service worker : garde la page et ses images pour jouer hors ligne |
| `icone-192.png`, `icone-512.png`, `icone-maskable-512.png` | les icônes |

## 1. Mettre en ligne sur GitHub Pages

1. Sur github.com, nouveau dépôt **public** nommé `stone-valley`.
2. Déposer les six fichiers à la racine du dépôt (glisser-déposer dans « Add file › Upload files »).
3. Onglet **Settings › Pages** : *Source* = `Deploy from a branch`, branche `main`, dossier `/ (root)`. Enregistrer.
4. Au bout d'une minute, l'adresse est **https://shinjiebi.github.io/stone-valley/**.

Sur téléphone, Chrome ou Safari propose « Ajouter à l'écran d'accueil » : le jeu s'ouvre alors en plein écran, sans barre d'adresse.

Pour essayer sur le poste avant la mise en ligne : `python3 -m http.server` dans ce dossier, puis `http://localhost:8000`. (Le service worker et l'installation exigent `http://` ou `https://` : en ouvrant le fichier directement, le jeu marche mais ne s'installe pas.)

## 2. Régler Supabase (projet « Vallée de pierre »)

Dans le tableau de bord Supabase, **Authentication › URL Configuration** :

- **Site URL** : `https://shinjiebi.github.io/stone-valley/`
- **Redirect URLs** : ajouter la même adresse, et `http://localhost:8000/` pour les essais.

**Authentication › Providers › Email** : *Confirm email* **activé** (c'est le choix retenu : l'adresse doit être confirmée avant de jouer).

Le courriel de confirmation et celui de réinitialisation partent du service intégré, **limité à 3 envois par heure** — assez pour un petit groupe. Au-delà, brancher un vrai expéditeur dans **Project Settings › Auth › SMTP** (Resend, Brevo, Mailgun… tous ont une offre gratuite).

Rien d'autre à faire côté base : la table `vp_comptes` et les trois fonctions (`vp_sauver_compte`, `vp_charger_compte`, `vp_oublier_compte`) sont déjà en place, avec les règles de ligne qui n'ouvrent à chaque compte que sa propre sauvegarde.

## 3. Ce que voit un testeur

1. Il arrive sur la porte : **Créer un compte** (adresse + mot de passe de 8 caractères au moins).
2. Il reçoit un courriel de confirmation, clique, revient sur le jeu et se connecte.
3. Son personnage est attaché à son compte : il le retrouve sur n'importe quel appareil, en se connectant.
4. **Mot de passe oublié** envoie un lien qui ramène sur le jeu et demande un nouveau mot de passe.
5. Dans le sac, onglet **Sauvegarde** : l'état de la sauvegarde, le compte, la déconnexion, l'effacement du personnage et le changement d'île.

## 4. Le multijoueur

Les joueurs se voient et se frappent par la **diffusion Realtime** de Supabase : deux canaux publics
(`sv:monde` pour savoir qui est où, `sv:ile:<graine>` pour l'île en cours). Rien n'est écrit en base,
donc aucune table ni règle à ajouter — il suffit que **Realtime soit activé** sur le projet (c'est le
cas par défaut ; à vérifier dans *Project Settings › Realtime* s'il ne se passe rien).

L'état de la connexion s'affiche dans l'onglet **Journal**, en tête du bloc « En ligne » :
`en ligne` quand tout va bien, `coupé` sinon (le jeu réessaie tout seul, de plus en plus lentement).

**Le quota.** Realtime compte un message à l'envoi *plus un par destinataire*. Le jeu envoie cinq
positions par seconde et par joueur : à deux sur la même île, cela fait une vingtaine de messages
par seconde, soit environ 75 000 à l'heure. Le quota gratuit de 2 millions par mois tient donc
autour de **25 heures de jeu à deux**. À quatre sur la même île, comptez quatre fois moins.
La consommation se lit dans le tableau de bord Supabase, *Organisation › Usage › Realtime Messages*.

Pour se retrouver à deux : chacun se connecte, le bloc « En ligne » du journal montre l'autre et
l'île où il se trouve, et le bouton **Rejoindre** (depuis son propre campement) ouvre le portail
vers cette île.

## 5. Mettre à jour le jeu plus tard

Remplacer `index.html` dans le dépôt : la page passe par le réseau d'abord, les testeurs ont donc la nouvelle version au chargement suivant. En cas de doute, changer le numéro dans `sw.js` (`const CACHE = 'stone-valley-1'`) pour vider le cache de tout le monde.
