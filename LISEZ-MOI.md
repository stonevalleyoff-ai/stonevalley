# Stone Valley — bêta (PWA)

Le dossier à mettre en ligne :

| fichier | rôle |
| --- | --- |
| `index.html` | le jeu entier, porte de connexion comprise |
| `donjon.js` | le Centre des automates (le donjon) et ses armes, chargé par `index.html` : à déposer avec lui |
| `nomades.js` | les Nomades du Seuil et leur moteur de conversation, chargé par `index.html` : à déposer avec lui |
| `manifest.webmanifest` | le nom, les couleurs et les icônes de l'application installable |
| `sw.js` | le service worker : garde la page et ses images pour jouer hors ligne |
| `icone-192.png`, `icone-512.png`, `icone-maskable-512.png` | les icônes |
| `orvane/corps.js`, `orvane/tampon.js`, `orvane/correspondance.js`, `orvane/orvane-sv.js` | le branchement sur Orvane, le monde vivant (§209–214), chargés par `index.html` : à déposer avec lui |
| `lignees.js` | le corps des lignées nées dans Orvane, construit d'après leur silhouette (§210) |
| `conduites.js` | ce que les organes d'Orvane font faire aux bêtes : cracher, se figer, donner l'alerte… (§211) |

## 1. Mettre en ligne sur GitHub Pages

1. Sur github.com, nouveau dépôt **public** nommé `stone-valley`.
2. Déposer les fichiers (index.html, donjon.js, nomades.js, etats.js, village.js, coop.js, flore.js, lignees.js, conduites.js, sw.js, manifest, icônes, et le dossier orvane/) à la racine du dépôt (glisser-déposer dans « Add file › Upload files »).
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

**Le quota.** Realtime compte un message à l'envoi *plus un par destinataire*. Pour l'économiser, le jeu
ne parle que quand c'est utile :

- **en mouvement**, cinq positions par seconde (l'interpolation comble les 200 ms) ;
- **immobile** (établi, récolte, sac), une nouvelle toutes les 1,5 s pour dire qu'on est toujours là ;
- **seul sur l'île**, personne n'écoute : une balise toutes les 2 s, pour être trouvé ;
- sur le canal commun, « je suis ici » toutes les 6 s.

| Sur la même île | Tous immobiles | Tous en mouvement | Moitié du temps en mouvement | Quota gratuit (2 M/mois) à ce rythme |
|---|---|---|---|---|
| seul | 0,7 msg/s | 0,7 msg/s | 0,7 msg/s | ~800 h |
| à deux | 3,3 msg/s | 21 msg/s | 12 msg/s | ~45 h |
| à quatre | 13 msg/s | 83 msg/s | 48 msg/s | ~11 h 30 |

Avant cette sobriété, un joueur seul consommait 5 msg/s et quatre joueurs 84 msg/s en permanence
(environ 6 h 30 de jeu à quatre par mois sur le quota gratuit). Au-delà du quota gratuit, Supabase
prévient par e-mail et accorde un délai ; l'offre Pro inclut 5 millions de messages, puis 2,50 $ le million.
La consommation se lit dans le tableau de bord Supabase, *Organisation › Usage › Realtime Messages*.

Pour se retrouver à deux : chacun se connecte, le bloc « En ligne » du journal montre l'autre et
l'île où il se trouve, et le bouton **Rejoindre** (depuis son propre campement) ouvre le portail
vers cette île.

## 5. Mettre à jour le jeu plus tard

Remplacer `index.html`, `donjon.js` et `sw.js` dans le dépôt : la page et le code passent par le réseau d'abord, les testeurs ont donc la nouvelle version au chargement suivant. En cas de doute, changer le numéro dans `sw.js` (`const CACHE = 'stone-valley-2'`) pour vider le cache de tout le monde.

## 6. Avant d'inviter les testeurs de la bêta

**Les e-mails (à faire une fois, dans Supabase).** Sans serveur d'envoi à vous, Supabase n'envoie les e-mails (confirmation d'inscription, mot de passe oublié) qu'aux membres de votre équipe Supabase. Pour les testeurs :

1. Créer un compte gratuit chez un service d'envoi (Brevo ou Resend, par exemple) et y valider une adresse d'expéditeur.
2. Supabase → **Authentication → Emails → SMTP Settings** : activer « Custom SMTP », recopier l'hôte, le port, l'identifiant et le mot de passe SMTP donnés par le service, et l'adresse d'expéditeur.
3. Supabase → **Authentication → Rate Limits** : Supabase fixe d'abord 30 e-mails par heure ; monter à 100 ou plus pour une vague d'invitations.
4. Faire un essai : créer un compte avec une adresse qui n'est pas dans l'équipe, puis « Mot de passe oublié ».

**Déjà en place dans la base** (fait le 23 septembre 2026) :

- les trois anciennes fonctions de sauvegarde par clé sont fermées ; celles du compte ne répondent qu'aux joueurs connectés ;
- la table `vp_retours` reçoit les messages du bouton « Un problème, une idée ? » (Réglages) et les incidents techniques que le jeu envoie tout seul (trois par partie au plus) ;
- `vp_supprimer_compte` : le bouton « Supprimer mon compte » (Sac › Sauvegarde) efface le compte, l'adresse e-mail, le personnage et les messages.
- le pillage (fait le 25 septembre 2026) : les tables `vp_campements` et `vp_pillages`, fermées en lecture sauf à son propre campement et à ses propres pillages, et quatre fonctions (`vp_camp_publier`, `vp_camp_cible`, `vp_piller`, `vp_mes_pillages`) qui ne répondent qu'aux joueurs connectés. Supprimer son compte efface aussi son campement publié et les pillages subis (voir section 18).
- les défenses du campement (fait le 7 octobre 2026, migration `vp_campement_defenses`) : `vp_campements` reçoit `niv_mur` et `niv_tours` (0 à 3), que `vp_camp_publier` enregistre et que `vp_camp_cible` rend (voir section 79).
- le journal de jeu (fait le 14 octobre 2026, migration `vp_journal`) : la table `vp_journal`, en RLS sans règle (personne ne la lit ni ne l'écrit directement), et la fonction `vp_journaliser`, réservée aux joueurs connectés (voir section 126). Supprimer son compte efface aussi ses lignes du journal (suppression en cascade).

**Lire les retours** : Supabase → Table Editor → `vp_retours`, ou dans l'éditeur SQL :

```sql
select cree_le, genre, texte, contexte from vp_retours order by cree_le desc limit 50;
```

La colonne `contexte` donne l'appareil, l'écran, l'île (graine), la position, l'heure du jeu, l'état de la sauvegarde et le dernier incident : de quoi reproduire.

**À dire aux testeurs** : c'est une bêta, les sauvegardes peuvent être remises à zéro ; le guide sous les jauges les met en route ; le bouton « Un problème, une idée ? » est dans les Réglages. La page « Données personnelles » (à la porte et dans les Réglages) dit ce qui est gardé et comment tout effacer.

## 7. Les biomes rares

Cinq sols qu'on ne trouve pas sur l'île de départ. Chaque île en porte au plus deux, tirés de sa graine (deux joueurs sur la même île voient les mêmes). Le portail ne mène qu'à des îles dont les biomes sont permis au niveau d'exploration atteint :

| Biome | Rareté | Dès l'exploration | Îles qui en portent | Flore | Effet |
|---|---|---|---|---|---|
| Tourbière | commun | 1 | ~40 % | cyprès chauve, massette, sphaigne rouge | la boue ralentit (−22 %), lucioles la nuit |
| Canyon d'ocre | peu commun | 2 | ~25 % | arbre de Josué, cactus cierge, rose des sables | au soleil, la course essouffle 35 % plus vite |
| Sylve fongique | rare | 3 | ~15 % | champignon géant, vesse-de-loup, clavaire lumineuse | spores, la clavaire luit la nuit |
| Champs de cristal | très rare | 5 | ~8 % | arbre de verre, druse géante (éclats), herbe de quartz | les sorts y coûtent moitié moins de mana, tout luit la nuit |
| Caldeira de cendre | légendaire | 7 | ~4 % | arbre calciné, fleur de braise, obsidienne (éclats) | braises dans l'air, les plaques vives brûlent |

Le premier pas dans un biome le découvre ; l'onglet Journal tient l'atlas (les cinq, trouvés ou « ? ? ? »). Rejoindre un ami plus avancé permet d'en voir un plus tôt : c'est voulu. Les îles tirées avant cette version ne changent pas, sauf une sur seize environ.

**Le rivage** (biome de base) sort enfin : une à deux cases de sable au bord de la mer et des étangs, avec palmiers et galets, et çà et là une côte restée rocheuse (environ 4 % des terres).

**Les coursiers rares** se tirent de la même façon, à part du bestiaire : le **rouge** n'apparaît qu'à partir de l'exploration 3 (une île sur seize environ), le **coursier d'aurore** qu'à partir de l'exploration 6 (environ une île sur soixante-dix, un seul individu). Les îles de départ n'en portent jamais.

### La famille des Telluriens

Une créature par biome rare, qui n'existe que sur les îles qui portent ce sol (hors du tirage du bestiaire). Chacune porte une **pierre natale** couleur de son biome, qui luit la nuit ; sauvages, elles ne quittent pas leur sol (elles en sortent pour boire, fuir ou chasser, puis y reviennent) et y guérissent deux fois plus vite. Elles se lient aux baies et au grimoire Appel, comme les Rampants.

| Créature | Biome | Caractère | Particularité | Compagne |
|---|---|---|---|---|
| Crapaud-buffle | Tourbière | paisible | avance par bonds, chante la nuit (gorge qui se gonfle), s'enfouit dans la boue quand il fuit — les chasseurs perdent sa trace ; ne grimpe pas, saute une marche de deux cubes | fibre |
| Varan d'ocre | Canyon d'ocre | chasseur | lézarde au soleil face à lui, fond sur qui passe trop près, dort la nuit, grimpe aux parois | os (chasse) |
| Vesseron | Sylve fongique | paisible, en troupe | se dandine sur deux pieds ; menacé, frappé ou en vous défendant, crache des spores qui sonnent les chasseurs et engourdissent le joueur ; ne grimpe pas, fait le tour | fibre et bois |
| Cerf de verre | Champs de cristal | très craintif | trotte puis galope, broute tête au sol, dresse tête et queue à l'alerte ; laisse 2 à 3 éclats ; ne grimpe pas, franchit deux cubes d'un saut — antérieurs repliés à l'envol, tendus vers le sol à la descente | éclats (se lie mal) |
| Salamandre de braise | Caldeira | dangereuse la nuit | dort le jour sur les braises, chasse la nuit, sa morsure brûle trois secondes ; éclaire autour d'elle ; grimpe aux parois | os (se lie très mal) |

## 8. Au-delà du huitième saut : les automates d'élite

Le danger monte à chaque exploration, sans plafond (voir §72 ; il s'arrêtait à l'exploration 8). Le nombre des bêtes, lui, cesse de monter à l'exploration 8, et les automates continuent de monter jusqu'à l'exploration 20 :

- **le portail ne tire plus que des îles gardées** : au moins un automate tireur à partir de l'exploration 10 (les automates n'arrivent pas avant, voir section 21), deux à partir de 13, trois à partir de 17 ;
- **ils sont plus nombreux** (+5 % de la base par saut au-delà de 8) **et visent mieux** : leur avance sur une cible qui court devient exacte et leur dispersion fond. Un mercenaire qui manque celui qui court au 8e saut le touche au 20e ;
- **deux automates d'élite** se tirent à part, comme les coursiers rares :

| Automate | Dès l'exploration | Îles qui en portent (niveau 20) | Ce qu'il fait | Comment s'en sortir | Rallumer / butin |
|---|---|---|---|---|---|
| Tireur d'élite | 10 | ~80 % | s'arrête et vous met en joue de très loin (portée 24) : un **rayon rouge** le trahit 1,1 s avant le coup, qui s'épaissit et clignote à la fin. Le coup est rapide et vise juste là où vous serez si vous gardez votre allure | changer de cap ou sauter au moment où le rayon clignote ; casser la ligne de vue, ou le toucher (flèche, coup) : la mise en joue repart de zéro | 3 éclats / 3 éclats |
| Mortier | 15 | ~75 % | tire **en cloche, par-dessus les murs** (portée 21), sans avoir besoin de vous voir. Un **cercle rouge au sol** marque le point de chute pendant les 1,3 à 2,3 s de vol ; l'explosion blesse tout ce qui est dedans (sauf les automates) et souffle | sortir du cercle ; aller au contact : sous 4,5 cases il ne peut plus tirer et recule, lentement | 4 éclats / 4 éclats |

L'abri du campement protège toujours. Pour voir la répartition par niveau : `node bancs/stats_iles.js` (modèle, des milliers d'îles par niveau) ou `node bancs/stats_iles.js reel 1,10,20 3` (de vraies îles chargées dans le jeu, comparées au modèle).

## 9. Voyager avec son campement

Deux façons de franchir un portail :

- **campement planté** (comme avant) : c'est une expédition. Le campement reste chez vous, la pierre de foyer vous y ramène, et perdre ses trois cœurs vous y renvoie (avec les règles du butin et de la barrière) ;
- **campement au sac** (on l'a repris avant de partir) : on l'emporte. On arrive un niveau plus loin et on le replante où l'on veut : ce niveau devient votre chez-vous. Le HUD affiche **CAMPEMENT AU SAC** tant qu'il n'est pas replanté. Si l'on perd ses trois cœurs avant de l'avoir replanté (au-delà de l'exploration 1), c'est la chute : **retour à l'exploration 1** sur une île neuve, le sac vidé de ses ressources ; le campement, le coffre, les objets, les flèches et les compagnes sont gardés.

Sans campement du tout, ni planté ni au sac, le portail reste fermé.

## 10. Les variantes rares

Toute créature (Rampants, automates, coursiers, Telluriens) peut naître différente, au peuplement de l'île comme à chaque naissance. Seul l'aspect change : ni la force, ni la vitesse, ni la robustesse.

| Variante | Ce qui change | Au départ | Au niveau 20 |
|---|---|---|---|
| **Robe rare** | albinos (œil rouge), mélanique, dorée ; chez les automates : chromée, de bronze, vert-de-gris | ~1 bête sur 1 100 · ~1 île sur 10 | ~1 île sur 4 |
| **Forme rare** | géante (×1,45) ou naine (×0,6), et un ornement de famille : cornue ou épineuse (Rampants, Telluriens), huppée (coursiers), à antennes (automates) | ~1 bête sur 18 000 · ~1 île sur 150 | ~1 île sur 50 |

Les chances augmentent de 10 % de la base à chaque exploration, jusqu'au triple au niveau 20, puis ne bougent plus. Une bête peut avoir les deux (« spectre albinos géant cornu »). La première rencontre s'annonce et s'inscrit au **carnet des variantes** (onglet Journal), qui compte ensuite les rencontres. Une variante liée garde son aspect, dans la sauvegarde comme chez les autres joueurs.

## 11. L'île des automates (à partir de l'exploration 21)

Une île entière de métal, qui ne sort qu'au-delà du vingtième saut : environ **une île sur six** à partir de l'exploration 21. Une île gardée d'avant, sous ce niveau, reste ce qu'elle était.

- **Le sol** : des tôles rivetées traversées de câbles (biome « Terre des automates », rang mythique, dans l'atlas du journal) et des **flaques d'huile** sur les replats (environ 9 % de l'île) : on y accélère mal et on s'y arrête plus mal encore. Pas de biome rare.
- **La flore mécanique** : pylônes (feu rouge au sommet) et engrenages géants donnent la **ferraille** (à démonter à la pioche), les bobines de câble de la fibre, les condensateurs des éclats.
- **Les barrières laser** : environ 36 par île, deux bornes et trois rayons (genou, hanche, épaule). Cycle de 4 s : allumées 2,2 s, éteintes 1,8 s, et elles clignotent en ambre la dernière demi-seconde avant de se rallumer. Allumées, elles brûlent (un tiers de la vie environ au niveau 21) et repoussent ; un double saut passe au-dessus. Elles épargnent le métal, pas les compagnes. Leur horloge est celle du monde : deux joueurs les voient battre ensemble.
- **La faune** : les six automates, une fois et demie plus nombreux qu'ailleurs (environ 80 au départ), et rien d'autre. Sans gibier, les traceurs vous visent aussi. La nuit, tout s'éteint : c'est le moment de traverser.

**La ferraille** est une nouvelle matière, qui va au sac et au coffre. Tout automate abattu en laisse aussi, sur n'importe quelle île : 1 à 3 (3 à 5 pour l'élite). Elle sert à quatre objets :

| Objet | Place | Effet | Coût |
|---|---|---|---|
| Foreuse | outil | quatre fois plus à chaque pied | 28 ferraille, 16 éclats, 20 bois |
| Marteau-pilon | arme | dégâts 125 | 36 ferraille, 20 bois, 10 éclats |
| Arbalète à poulies | arme | tir tendu, dégâts 120 | 30 ferraille, 24 bois, 20 fibre |
| Plastron de ferraille | armure | −72 % de dégâts | 40 ferraille, 10 os, 30 fibre |

## 12. Les îles volantes

Sur toutes les îles, les îles volantes et leurs escaliers sont de **nuage** : blanc, doux, en plein jour même au-dessus d'une falaise, et sans aucun végétal. Elles ne portent que les **druses** : un socle de roche pâle et des prismes trapus, en deux tons comme le reste de la flore. C'est toujours là qu'on détache les éclats (le cerf de verre y monte d'un bond de lumière, section 34), et leur couleur dit ce qu'elles valent :

| Druse | Sur cent | Éclats en plus (druse mûre) |
|---|---|---|
| cyan | 84 | — |
| lavande | 13 | +1 |
| dorée | 3 | +3 |

La couleur vient de la case : deux joueurs voient la même druse dorée au même endroit. Le bouton d'action et la gerbe de récolte prennent sa teinte, et les druses luisent faiblement la nuit. Seule la dalle conjurée par le grimoire Ancrage reste de pierre.

## 13. La caméra

- **Tourner au doigt** (ou à la souris) : en vue de dessus, glisser sur la vue tourne la caméra librement à l'horizontale et règle l'inclinaison à la verticale, entre rasante et plongée. Les boutons ⟲ ⟳ ▽ △ restent là. Sans carte graphique (isométrie en canvas), la caméra se range au huitième de tour le plus proche en lâchant.
- **Zoom** : pincer à deux doigts sur la vue, la molette, ou les touches + et −. De 0,6 à 2,2 fois ; en reculant, la brume recule aussi. En perspective, le zoom rapproche ou éloigne l'œil.
- **Vue en perspective** : le bouton **3D** (en haut à droite) passe la vue de dessus en perspective. Même angle, même inclinaison, même suivi du joueur, mais l'œil est posé en orbite à quatorze cases et le décor fuit vers l'horizon. Une paroi ou une île volante entre l'œil et le joueur rapproche la caméra. Le choix est gardé d'une partie à l'autre, et demande la carte graphique.

## 14. La flore qui arrête, la flore qui freine

- **On ne passe plus au travers** des troncs (arbres, cactus, champignons géants, pylônes…), des pierres (galets, affleurements, obsidienne) ni des éclats (druses, cristaux, engrenages, bobines). Un saut passe par-dessus une pierre basse ; on passe sous la couronne d'un arbre. Un pied tout juste coupé ne compte pas. Si l'on arrive dans un tronc (retour au campement, chute), on peut toujours en sortir. En selle, la monture passe partout, comme avant ; les bêtes aussi.
- **On tient dessus** : le dessus d'une pierre, d'une druse, d'une souche ou d'une couronne d'arbre est un sol, comme un cube. Qui saute dessus s'y pose (au lieu de retomber à travers, au pied de la pierre), et en descend en marchant. En selle, rien ne change.
- **On glisse au lieu de s'accrocher** : contre un tronc ou une pierre, le pas n'est plus refusé ; le corps est repoussé le long de la surface et garde la vitesse qui la longe, et de face il est aiguillé vers le côté où il penche. Contre la flore, le corps compte plus fin qu'à la vue (0,18 case au lieu de 0,30, les troncs à 85 %) : **on passe entre deux troncs voisins**. Contre un mur, un coin qui ne mord que le bord du corps (jusqu'à un tiers de case) fait glisser de côté au lieu d'arrêter net ; un mur de face arrête toujours.
- **Les herbes hautes, les fleurs, les buissons et les roseaux freinent** : environ −28 % de vitesse à pied.
- **Tout ce qui est dur bloque la visée** : la vue des automates (ils se déplacent pour trouver un angle), leurs tirs, les obus du mortier (qui éclatent contre l'arbre), et vos flèches, qui s'y fichent et se ramassent. Les grands arbres bloquent aussi par leur couronne.

## 15. La récolte en plusieurs coups

ACTION près d'un pied : le personnage se tourne vers lui et porte un coup. Le geste dépend de ce qu'on récolte : **la cognée** pour le bois (swing en diagonale dans le tronc), **la pioche** pour la pierre, les éclats et la ferraille (par-dessus la tête, vers le sol), **la cueillette** accroupie pour les fibres et les baies.

| Pied | Coups |
|---|---|
| arbres, pylônes | 4 |
| cactus, pierres, druses, cristaux, engrenages | 3 |
| buissons, roseaux, bobines | 2 |
| fleurs, champignons, touffes | 1 |

- **Chaque coup rend sa part** : le total ne change pas, il est réparti sur les coups (un chêne à mains nues : 2, 1, 1, 1). Une fleur rend tout d'un geste. Jamais plus de coups que de ressources.
- La **serpe cristalline** et la **foreuse** ôtent un coup.
- **ACTION tenue** (ou C) enchaîne les coups jusqu'à ce que le pied tombe, sans ranger l'outil entre deux. Le bouton d'action montre l'avancée (« Chêne · 2/4 »).
- **Se remettre en marche** interrompt le geste avant le coup : rien n'est reçu. Un pied entamé qu'on laisse se referme au bout de 30 secondes.
- **Le geste** : on empoigne l'outil (à mains nues, un galet taillé), élan, coup qui se fige une fraction de seconde au contact, puis retour, et on range. Les pieds restent plantés, les genoux plient, le buste tourne. Le pied tremble dans le sens du coup et rapetisse d'un coup à l'autre ; des copeaux volent vers le sac. À la première personne, le regard suit le geste. En selle, les coups sont les mêmes, sans le geste.
- Les autres joueurs voient le pied tomber au dernier coup, pas les coups eux-mêmes.
- **La visée va au pied mûr** : un pied qu'on vient de prendre repousse à la même place, et la visée s'y accrochait (« trop jeune ») alors qu'un autre attendait à côté. Elle vise désormais d'abord ce qui se récolte — un pied entamé avant tout, puis le plus proche, un peu plus volontiers devant soi — et ne montre un pied trop jeune que s'il n'y a rien d'autre à portée. ACTION tenue enchaîne donc les pieds voisins sans s'arrêter.

## 16. Les armes en main

Chaque arme a son geste, sa cadence, et se porte sur soi quand on ne s'en sert pas.

| Arme | Geste | Cadence | Dégâts par coup |
|---|---|---|---|
| Gourdin | posé sur l'épaule, levé derrière la tête, abattu devant soi | 0,42 s | 36 |
| Lance d'os | ramenée à deux mains, puis détendue en fente | 0,48 s | 62 |
| Épée de pierre | balaie à l'horizontale en grand arc de cercle devant soi, de droite à gauche ; si l'on enchaîne, revers de gauche à droite | 0,40 s | 74 |
| Lame d'éclat | même balayage en arc, plus vif : coup droit, puis revers | 0,28 s | 76 |
| Marteau-pilon | levé derrière la tête à deux mains, écrasé au sol | 0,70 s | 250 |

- **Même force par seconde qu'avant** : les armes lentes frappent plus fort, les vives un peu moins, et chaque arme garde exactement ses dégâts par seconde d'avant.
- **Le coup porte à l'impact**, pas à l'appui : il touche ce qui est à portée à cet instant. S'il touche, l'arme **mord** une fraction de seconde (un arrêt bref, plus long pour le marteau) ; dans le vide, l'élan continue.
- **Enchaîner** : un appui pendant le retour est retenu, et le coup suivant part aussitôt (l'épée et la lame alternent alors coup droit et revers).
- **Les épées** tournent autour de l'épaule, la lame dans le prolongement du bras : la pointe décrit un vrai arc de cercle à l'horizontale, un peu plus bas devant (à hauteur des bêtes), et laisse derrière elle un croissant blanc (bleu-vert pour la lame d'éclat).
- **On peut frapper en courant** : le haut du corps frappe, les jambes gardent la foulée. En selle ou en l'air, seul le haut du corps s'y prête.
- **Rangée sur soi** : l'épée et la lame au fourreau à la hanche gauche, le gourdin passé dans la ceinture, la lance, le marteau, l'arc et l'arbalète dans le dos (avec leur sangle), le carquois à la hanche. Au premier coup, l'arme glisse du fourreau à la main ; elle reste en garde trois secondes et demie, puis se rengaine. Récolter la range aussitôt.
- **Les effets** : une traînée derrière la pointe dans la partie vive du geste, des éclats à l'impact (échardes, pierre, cristal pour la lame d'éclat). Le marteau-pilon frappe le sol même dans le vide : onde de poussière, souffle de vapeur, le pilon qui sort de la masse, et la vue qui tremble.
- **L'arc** : on encoche près du corps, puis le bras d'arc se tend vers la cible pendant que la main de corde recule jusqu'à la joue, le buste de profil. Tenu longtemps à fond, le bras tremble. Au tir, la corde claque et la main part en arrière.
- **L'arbalète à poulies** : pointe basse, on tourne la manivelle (les poulies tournent, la corde recule), puis on l'épaule une fois armée. Au tir, elle rue vers le haut.
- **À la première personne**, le regard suit le coup : il plonge avec le marteau, pivote un peu avec les coups de taille.
- **En multijoueur**, les autres voient votre arme, vos coups, votre arc bandé et vos gestes de récolte : un message par geste, pas de trafic continu. Rien de ce qui est rejoué chez eux ne blesse.

## 17. Le son

Tout le son est **fabriqué dans le navigateur** : aucun fichier, le jeu reste en un seul fichier. Des bruits filtrés et des oscillateurs façonnés pour évoquer la matière. Le son s'ouvre au **premier geste** (clic, touche, doigt) : c'est une règle des navigateurs. Un onglet caché se tait.

- **Les effets** : les pas selon le sol (herbe, pierre, sable, neige, eau, métal, nuage, sabots en selle), le saut et la réception ; la récolte selon la matière (le bois cogne sourd et l'arbre s'abat au dernier coup, la pierre tinte et s'effrite, le cristal chante, la ferraille résonne, les fibres froissent) ; l'élan et l'impact de chaque arme, le marteau-pilon qui frappe le sol dans un souffle de vapeur ; l'arc qui grince puis claque, la manivelle de l'arbalète qui cliquette ; la flèche qui se fiche ; les blessures ; l'établi, le sac, les sorts, le portail, la découverte d'une variante rare, le lien d'une compagne.
- **Les voix des créatures** : chaque espèce a la sienne (gazouillis d'hexapode, grognement du traqueur, sifflement du spectre, coassements du crapaud — en chœur la nuit —, tintement du cerf de verre, crépitement de la salamandre, hennissement des coursiers, servos et bips des automates), en cinq humeurs : appel, alerte, attaque, douleur, mort. Le tireur d'élite qui vise se trahit par un sifflement qui monte ; son tir claque ; l'obus du mortier siffle avant d'exploser.
- **L'ambiance** : le vent (plus fort en altitude, en rafales), les feuilles près des arbres, la pluie et ses gouttes, le tonnerre quelques instants après l'éclair, l'eau près des rives, la mer, les grillons la nuit, le feu du campement, la lave qui bout dans la caldeira, le carillon des champs de cristal, la rumeur des machines et le bourdon des lasers sur l'île des automates.
- **La musique** : douce, par phrases séparées de longs silences. Claire le jour, en cloches la nuit, métallique sur l'île des automates ; un bourdon grave et des notes serrées quand un automate vous vise ou qu'un prédateur vous traque.
- **Placé dans le monde** : un son s'éteint avec la distance (plus rien au-delà de 26 cases) et passe à gauche ou à droite selon où il est par rapport à la vue, en isométrie comme à la première personne. Les coups et les récoltes des autres joueurs s'entendent aussi.
- **Réglages** : quatre curseurs — général, effets, ambiance, musique —, gardés d'une partie à l'autre. On règle en glissant, on entend un exemple en lâchant.

## 18. Le pillage

Le pillage se joue **avec un compte** : sans compte, votre campement reste à l'abri, et vous ne visitez personne.

- **Le portail**, une fois sur douze, ne mène pas à une île neuve mais au **campement d'un autre joueur** : absent de son île depuis au moins trois minutes, actif ces quinze derniers jours, d'une exploration proche de la vôtre (deux de moins à une de plus), avec quelque chose au coffre. S'il n'y a personne à visiter, le portail s'ouvre comme d'habitude. Le portail hésite un instant avant de choisir.
- **L'arrivée** se fait à une quinzaine de cases du campement. À la boussole, une tente **rouge** ; sur place, la bannière du campement est rouge, et son portail ne s'ouvre pas pour vous.
- **Les gardiennes** : les compagnes du pillé en **défense**, laissées **au camp** (six au plus), avec leur santé et leur robe. Hors du campement, elles tiennent leur poste ; dès que vous y entrez (onze cases autour du feu), elles fondent sur vous. Elles ne se lient pas et ne se nourrissent pas. Une gardienne à terre le reste pour toute la visite, même après un rechargement.
- **Au coffre**, on prend **un centième par seconde**, jusqu'à **un cinquième** du coffre. Un coup reçu fait lâcher prise tant qu'on est sonné. Le bouton ACTION affiche la part (« EMPORTER · 7 % · coffre de … »).
- **Emporter** : le butin n'est à vous qu'une fois **sorti du campement**, ou d'un appui sur EMPORTER, ou à 20 %. Il passe alors par la base, qui le tire de son propre état du coffre, et il entre au sac. Repartir par la pierre de foyer ou par un portail emporte aussi ce qui a été pris. **Terrassé avant**, on repart les mains vides. La visite dure au plus dix-huit minutes.
- **Le pillé**, à son retour, voit un avis (« Corbeau a pillé votre campement · −12 bois · −6 pierre · bouclier douze heures ») ; le butin est retiré de son coffre, et la page Campement du sac garde les cinq derniers pillages, avec le nombre de ses gardiennes.
- **Les protections** : douze heures de **bouclier** après chaque pillage ; personne ne vient tant que vous êtes sur votre île (le jeu le signale toutes les deux minutes) ; un seul pillard à la fois par campement ; six visites par heure au plus pour un même pillard. La base borne la part au temps réellement passé depuis l'ouverture du portail : une part annoncée trop forte est ramenée à ce qui était possible.
- **Ce qui est partagé** : votre pseudo, l'île et la place de votre campement, son niveau, celui de son rempart et de ses tours, le contenu du coffre et l'espèce, la santé et la robe de vos gardiennes. Jamais votre adresse. Personne ne peut lire les campements des autres : la base choisit la cible, et ne révèle que celle qu'elle vous donne. Vous ne lisez que vos propres pillages.
- **Le trafic** : une lecture des pillages toutes les trois minutes, une publication du campement quand il change (une par minute au plus), et une toutes les deux minutes quand vous êtes chez vous.

## 19. Le Centre des automates (le donjon)

Le jeu tient maintenant en deux fichiers : `index.html` et **`donjon.js`**, chargé juste avant lui. Les deux sont à déposer ensemble sur GitHub (le service worker garde `donjon.js` pour le hors-ligne, et le reprend du réseau à chaque nouvelle version).

- **L'entrée** : sur chaque île des automates, une **trappe** dans les tôles, à une place tirée de la graine. Rien ne la signale : il faut marcher dessus pour que le bouton propose DESCENDRE.
- **Les étages** : de **3 à 5** selon l'île, de plus en plus durs. Chaque étage : 8 à 12 salles taillées dans la roche (murs de quatre cubes, infranchissables), reliées par des couloirs de deux cases ; dès le deuxième étage, au moins une salle de gardien. On arrive au pied du **monte-charge** ; l'**escalier** est dans la salle la plus éloignée. Au dernier étage, à la place de l'escalier : la **salle de l'Horloge**, son gardien et son grand coffre, et un second monte-charge. Tous les joueurs de l'île ont le même souterrain.
- **Il n'y fait jamais nuit** : lumière fixe, néons aux murs (bleus, orange à l'arrivée, rouges chez le gardien, verts à l'escalier), ni ciel, ni météo, ni vent — des gouttes qui tombent de la roche, la rumeur des machines, la musique des automates.
- **La vue** : la même isométrie, la même première personne. Les murs devant le joueur s'ouvrent autour de lui pour qu'il ne soit jamais caché.
- **Les machines d'en bas** (on ne les voit que là) :

| Machine | Ce qu'elle fait |
|---|---|
| Tourelle murale | fixée contre un mur, elle balaie la salle, vous voit, pivote et tire dans l'axe |
| Araignée de maintenance | rapide, en groupe, elle mord ; au repos, elle répare les machines blessées autour d'elle |
| Gardien de salle | lourd, il garde sa salle ; y entrer referme les portes, jusqu'à ce qu'il tombe |

- **Les pièges** : des barrières laser en travers des couloirs (le même cycle qu'à la surface), des **plaques** qui déclenchent trois fléchettes depuis le bout du couloir, des **grilles de vapeur** qui soufflent par rangées, en vague (une case de chaque rangée reste sûre), et les portes du gardien.
- **Les salles** : grenier (coffres, pylônes et engrenages à démonter), tourelles (avec des piliers pour se mettre à couvert), araignées (et leurs druses), cristaux, vapeur, salle vide, salle du gardien.
- **Les coffres des Horlogers** : ferraille et éclats, un peu de tout, davantage plus bas. Le coffre du gardien et le grand coffre de l'Horloge sont les plus riches.
- **Façon roguelike** : ce qu'on trouve en bas n'est à soi qu'une fois **remonté par le monte-charge** (on peut remonter à chaque étage). **Terrassé sous terre**, on se réveille près de la trappe : le sac revient à ce qu'il était en descendant (ce qui a été dépensé reste dépensé), et les objets trouvés en bas sont perdus. La pierre de foyer ne répond pas sous terre, et « Nouvelle île » non plus.
- **Le jeu à plusieurs** : un canal par étage — on voit les joueurs du même étage. Chacun a ses coffres et ses machines. Les portes et mécanismes partagés viendront avec les énigmes.
- **Recharger la page** en bas remet au même étage, au même endroit : les coffres ouverts restent ouverts, les machines abattues restent à terre.

### Les armes d'en bas

On ne les fabrique pas : on les trouve dans les coffres du Centre.

| Arme | Tir | Où |
|---|---|---|
| Rayon de sentinelle | un trait bleu instantané (dégâts 50), toutes les 0,42 s ; il **chauffe** : au sixième tir serré, deux secondes de surchauffe. Il ne refroidit qu'au repos. La chaleur s'affiche dans le HUD | coffres du gardien (1 sur 4), grand coffre (près d'1 sur 2), plus rarement les petits coffres dès l'étage 2 |
| Fusil d'arpenteur | ACTION maintenue : on **épaule**, un **trait rouge** se resserre et se fonce (les autres joueurs le voient). On lâche : le coup part, de 45 à 220 selon le temps de visée (1,1 s pour la pleine visée), le trait d'autant plus juste. Recharge 2,2 s | rarissime : le grand coffre de l'Horloge (3 sur 10), exceptionnellement un coffre de gardien dès l'étage 3 |

Les deux se portent dans le dos, se voient en main chez les autres joueurs, et leurs tirs s'entendent et se voient chez eux.

## 20. L'onglet Bêta (les outils de test)

Dans le sac, l'onglet Bêta (**touche 0**, sac ouvert) réunit tout ce qui sert à tester. Les outils qui donnent quelque chose passent d'eux-mêmes en **mode essai** : rien de ce qu'on y gagne ne part dans la sauvegarde, et « Arrêter l'essai » rend le vrai sac.

- **Ressources** : le mode essai (ressources illimitées : rien ne se paie, flèches et mana compris — la pierre de foyer aussi) et « Tout fabriquer ».
- **Remplir le sac** : +200 de chaque ressource, 50 baies, 64 flèches, trois de chaque viande, produit de plante et poisson (pour essayer la cuisine), et 5 baumes de relève.
- **Armes d'en bas** : le rayon de sentinelle et le fusil d'arpenteur, rangés et en main.
- **Le personnage** : soins complets (santé, endurance, trois vies) et **Invincible** (plus rien ne blesse : coups, tirs, brûlures, chute).
- **Le monde** : midi, minuit, changer le temps qu'il fait (pas sous terre).
- **Centre des automates** : « Étage 1 » ou « Dernier étage » descend tout de suite dans le souterrain de l'île où l'on est, sans chercher la trappe (même sur une île ordinaire). C'est une **descente d'essai**, marquée ESSAI dans le HUD : l'escalier et les coffres marchent comme d'habitude, mais rien de ce qu'on trouve en bas n'est gardé en remontant (bouton « Remonter » du même onglet, ou le monte-charge). Pendant une vraie descente, l'onglet ne propose pas de raccourci.
- **Mesures** : les mesures du moteur, et « Où vous êtes » (graine, exploration, étage, position) — utile pour signaler un problème.
- **Diagnostic** et **Un problème, une idée ?** : comme avant.

## 21. Qui vit où : les Doux, les Rampants, les automates

Le bestiaire d'une île se tire toujours de sa graine, mais il dépend maintenant de l'exploration :

| Exploration | Ce qu'on croise |
|---|---|
| 0 à 2 | **les Doux seuls** : deux ou trois herbivores lents, et l'oglodon là où la graine a mis une fourmilière. Aucun chasseur (le varan du canyon attend lui aussi la 3e) |
| 3 à 9 | les **Rampants** (brouteur, bossu, glaneur, traqueur, spectre) et les **coursiers** arrivent ; les Doux restent |
| 10 et plus | les **automates** (traceur, moissonneur, mercenaire, sentinelle) et le tireur d'élite ; le mortier à partir de 15 |

**Correction importante** : un « filet de rattrapage », qui repeuplait une espèce tombée sous trois bêtes, semait en fait **toutes les espèces du jeu sur toutes les îles** au bout d'une minute environ, tireurs d'élite et mortiers compris. C'est ce qui faisait voir des snipers et des mortiers à l'exploration 3. Il ne repeuple plus que les espèces de l'île.

**Les Doux**, les bêtes des premières îles :

| Bête | Ce qu'elle est | Liée, elle… |
|---|---|---|
| Lentigrade | un grand herbivore très lent, le dos couvert de mousse et de fleurs (chacun son jardin), la tête qui pend. Il ne fuit presque pas, pousse de longs soupirs | broute la mousse et les fleurs : de la fibre |
| Cotonnier | une **grosse** boule de duvet (deux fois et demie la taille d'avant), en troupeau, sur de courtes pattes cachées sous une frange. Les petits suivent leur mère **en file indienne**. En fuyant, il perd son duvet : une aigrette de temps en temps, que le vent emporte, et une petite bouffée quand on le frappe (jamais plus d'une quinzaine en l'air sur toute l'île). Gros mais léger : ses coups et sa faim restent ceux d'avant | file son duvet : de la fibre |
| Carillonneur | fin et haut sur pattes, des cornes creuses en pavillon, avec des clochettes que le vent balance : **on l'entend avant de le voir** (une gamme mineure, plus souvent quand il vente) | abat le bois mort, et **tinte fort quand un chasseur approche** |
| Oglodon | un grand scarabée gris d'ardoise, six pattes, une corne, un ventre d'ambre. Il vit en colonie dans une **fourmilière géante**, grignote la pierre, descend aux buissons cueillir des baies qu'il remonte à la fourmilière, où elles deviennent du **nectar** | grignote la pierre (de la pierre), et change en nectar les baies qu'il cueille |

**Approcher sans effrayer.** Les proies (Doux, Rampants herbivores, Telluriens) ne fuient plus le joueur dès qu'elles le voient. Tant qu'il est **calme** — pas de course depuis 2,5 s, ni coup, ni tir, ni blessure donnée depuis 8 s —, elles gardent leurs distances sans détaler, s'habituent à lui en une demi-minute environ, et viennent parfois voir de plus près (« vous observe » sur le panneau de la cible) : de quoi les nourrir sans leur courir après. Arriver trop près trop tôt les fait encore détaler. Courir, frapper ou tirer les fait fuir comme avant, et elles oublient en deux secondes qu'elles s'étaient habituées. Les **coursiers** suivent la même règle, en plus difficile : il faut environ deux minutes **immobile** près d'eux (trois fois plus en marchant), ils perdent confiance deux fois plus vite, et ne viennent voir qu'une fois presque habitués. Galoper sur sa monture compte comme courir. L'oglodon et les chasseurs n'ont pas changé.

Les petits naissent plus petits et grandissent jusqu'à leur maturité. Les chasseurs des îles suivantes (traqueur, spectre, varan, salamandre, traceur) chassent aussi les Doux — sauf l'oglodon.

**La fourmilière** (une île sur deux, sur un replat de la montagne) : un cône d'argile d'une douzaine de cases, qu'on monte d'un cube à la fois, trois entrées dans ses gradins, un cratère et des cheminées au sommet. Le nectar perle aux entrées quand elle est pleine.

- **PUISER** (à une entrée ou au cratère) : jusqu'à 4 nectars. Tant que la colonie ne vous fait pas entièrement confiance, elle vous a vu : elle charge, et sa confiance recule d'un quart. **En pleine confiance, elle vous laisse puiser.**
- **La méfiance** : l'oglodon se méfie, même si l'on approche doucement. À moins de sept cases, il vous tient à l'œil et son doute monte (plus vite de près, si l'on bouge, s'il ne vous connaît pas) : immobile à cinq cases, il charge au bout de sept secondes environ. Au moindre doute, c'est tout de suite : courir, frapper ou tirer à moins de dix cases, ou venir sous la fourmilière sans qu'il vous connaisse. Rien ne dit comment l'apaiser : c'est au joueur de le trouver.
- **Les baies** (G, lancées jusqu'à cinq cases à un oglodon) font retomber son doute et monter sa confiance (sept baies pour qu'il se lie, s'il reste un lien libre), et celle de **la colonie** : un vingtième par baie. À 70 % de confiance, la sienne ou celle de la colonie, il ne charge plus pour un rien. La confiance de la colonie est gardée dans la sauvegarde, île par île.
- **La charge** : l'oglodon gratte le sol tête basse, puis fonce de loin (plus de 4 cases) et projette. On l'esquive de côté. Il charge aussi si on le frappe, ou quand son doute est au bout (voir la méfiance).
- La fourmilière se remplit d'un nectar par baie rapportée, et un peu d'elle-même (jusqu'à la moitié).

**Le nectar d'oglodon** (une nouvelle matière, au sac et au coffre) :

- **le boire** : +35 % de vie et tout le souffle — touche **N**, ou le bouton de l'onglet Sac ;
- **la Lampe d'ambre** (établi) : la lumière de la lanterne, sans éclat (8 nectars, 12 bois, 8 fibres).

Côté Supabase, la liste des matières du coffre accepte le nectar (fonction `vp_coffre_propre`, déjà mise à jour).

## 22. Le mana, ce sont les éclats

Le mana n'est plus une jauge qui se recharge seule : **ce sont les éclats que vous portez dans le sac**. Ceux du coffre du campement ne comptent pas, même au campement. La jauge MANA affiche leur nombre (cent éclats la remplissent).

- **Les sorts** gardent leurs prix, payés en éclats pris dans le sac : Souffle 18, Aube 25, Ancrage 30, et Appel 50 (35 avant). Le Manteau d'éclats les rend 35 % moins chers, les champs de cristal moitié moins.
- **La pierre de foyer** coûte dix éclats par exploration d'écart avec le campement, 20 au moins et 100 au plus. Sans assez d'éclats, elle ne répond pas. Terrassé, le retour reste gratuit : c'est le campement qui vous reprend.
- Le feu du campement refait la vie et le souffle, plus le mana : il faut aller chercher les éclats (druses, automates, coffres du Centre).
- En mode essai, rien ne se paie.

## 23. Le félin de brume

Un grand chat gris-bleu, rayé, à la longue queue annelée, qui chasse **en meute** de trois ou quatre. Il se tire à part du bestiaire (les îles d'avant ne changent pas) : environ **une île sur trois à partir de la 4e exploration**. Il chasse les Doux, les Rampants herbivores, les coursiers, le crapaud et le cerf de verre — et vous.

- **Le camouflage** : immobile, à l'affût ou à pas de loup, il prend la teinte du sol sous lui, sa silhouette ondule comme une brume, son ombre s'efface, il ne se désigne plus (pas de panneau de cible) et il se tait. Seuls ses yeux pâles gardent un peu de couleur. Il se révèle en courant, en plein bond, et trois secondes quand on le touche. Les proies ne le remarquent qu'au quart de la distance habituelle. Un filet de brume, de loin en loin, trahit celui qui se déplace.
- **À pas de loup** : de loin, il trotte bas ; à moins de onze cases, il avance tapi (tête basse, oreilles couchées, omoplates qui roulent, bout de queue qui fouette) et **se fige quand sa proie regarde vers lui**. À moins de 4,6 cases, il se ramasse — la croupe frétille — et **bondit en l'air** de près de cinq cases, pattes tendues. Puis il se dégage, et recommence. Il ne s'annonce pas.
- **L'embuscade** : à moitié repu, il se poste couché, tête haute, dans les hautes herbes, un buisson ou près de l'eau, et laisse venir : une proie à sept cases, ou vous à cinq et demie, et il part.
- **La meute** : qui chasse entraîne les autres. Ils se déploient autour de la proie, chacun son angle, et bondissent ensemble (on attend jusqu'à 2,5 s qu'un autre soit en place). Contre vous, deux à la fois au plus : les autres attendent, tapis, à six cases. À l'affût, chacun se poste autour du chef. Une meute naît ensemble.
- **Chiffres** : bond sur vous 11 % de vie (avant la montée du danger), puis 3 s de pause ; sur une bête, la moitié de sa vie. Lié (20 % de chance de base), il chasse et rapporte les os, à peine voilé pour qu'on le voie.

Pour régler : `FELIN_BOND`, `FELIN_LOUP`, `FELIN_AFFUT` et le bloc « LE FÉLIN DE BRUME » dans `index.html`, `COMBAT.felin` pour la force du bond, `felinGraine` pour la fréquence.

## 24. La faim et la soif plus fortes que la peur

Une bête acculée ou méfiante devant une menace qui ne bougeait pas (un chasseur éveillé qui ne chasse pas, le joueur planté là, un oglodon qui vous guette) restait sur place jusqu'à mourir de faim ou de soif. Désormais :

- **assoiffée** (soif au-delà de 70 %, une source à portée) **ou affamée** (au-delà de 85 %), elle ne fuit plus que ce qui la serre de près (trois cases) ou s'en prend à elle, et va boire ou manger ;
- **vingt secondes** à fuir ou à faire front devant ce qui ne l'attaque pas : elle s'y fait, et ne le craint plus pendant vingt-cinq secondes, sauf s'il approche à deux cases et demie ou l'attaque ;
- **l'oglodon** affamé ou assoiffé cesse de vous guetter pour aller boire ou manger (il charge toujours si son doute est au bout) ; en confiance, il ne vous fuit plus ;
- **le félin** trop affamé (70 %) quitte l'affût et part en quête de proies.

Essai : un cotonnier assoiffé et affamé, un traqueur éveillé entre lui et l'eau. Avant : 24 s à fuir, il boit au bout de 33 s et finit à 29 % de vie. Après : il boit au bout de 7 s, mange, et garde toute sa vie.

## 25. Les Nomades du Seuil (`nomades.js`)

Un peuple qui voyage d'île en île par les seuils. Le jeu tient maintenant en trois fichiers : `index.html`, `donjon.js` et **`nomades.js`**, à déposer ensemble (le service worker passe à `stone-valley-5` pour le garder hors ligne).

- **La venue** : de loin en loin (2 min 30 à 7 min 30 après l'arrivée sur une île, puis 8 à 18 min après chaque départ), un **seuil violet** s'ouvre à 12-18 cases du joueur : « un seuil s'ouvre non loin · des voyageurs en sortent ». La halte est marquée sur la boussole (« nomades »). Jamais sous terre ni pendant un pillage. Elle dure cinq minutes, puis tous rentrent dans le seuil, qui se referme.
- **La caravane** : une **marchande** (étal sur le dos, lanternes, large chapeau), un **dresseur** (bâton à cristal, cape) et sa bête — une ou deux, d'une espèce tirée au hasard parmi toutes sauf les automates —, et un **conteur** (haute capuche, orbe qui tourne autour de sa tête). Robes, visière de lumière, runes qui luisent. Neuf nomades en tout, toujours les mêmes : on les reconnaît d'une caravane à l'autre. Ils saluent de la main, font face à qui approche, gesticulent en parlant.
- **Leur parler** : ACTION de près (**PARLER**). Une boîte de dialogue : la réplique s'écrit, les réponses se choisissent au doigt, à la souris ou aux touches 1 à 9 (Entrée achève la réplique, Échap ferme). S'éloigner coupe la conversation.
  - **la marchande** troque quatre offres tirées à chaque halte (deux fois chacune), en matières : bois, fibres, pierres, os, éclats, ferraille, nectar, baies, flèches. Plus une rumeur sur le monde ;
  - **le dresseur** parle de sa bête, et **enseigne quatre techniques**, payées en matières (offertes à un ami) : *la main basse* (les bêtes paisibles s'habituent deux fois plus vite), *le regard oblique* (les coursiers deux fois plus vite), *la baie chantée* (+50 % de confiance par baie), *le souffle lent* (la méfiance des bêtes ombrageuses monte moins vite) ;
  - **le conteur** livre des **indices sur les automates** et **sur le jeu**, sans se répéter tant qu'il en a de neufs, et raconte le Seuil, les Nomades, les Horlogers.
- **L'amitié** : chaque première parole d'une halte, chaque troc, chaque leçon la font monter. Connu, puis ami (3) : les saluts changent, des répliques s'ouvrent, la marchande ajoute un de plus à chaque troc, le dresseur enseigne gratuitement.
- **S'ils sont attaqués** : tous se défendent (bâtons, et la bête du dresseur), vingt-cinq secondes, puis repartent. L'amitié de chacun recule de trois ; aucune caravane pendant vingt minutes. **Un nomade tué ne revient jamais**, et les autres en parlent.
- **Gardé dans la sauvegarde** : les techniques apprises, l'amitié de chacun, les indices déjà entendus, les disparus, la rancune. Les caravanes sont propres à chaque joueur (pas de réseau).
- **Onglet Bêta** : « Nomades du Seuil » · **Venir** (une caravane tout de suite) et **Partir**.

**Le moteur de conversation**, pour écrire de nouvelles répliques (`NM_DIALOGUES` dans `nomades.js`) : un rôle est un recueil de nœuds ; un nœud a ce que dit le nomade (`dit` : un texte, une liste de variantes, ou une fonction) et les réponses (`choix`). Une réponse : `{ t: 'ce qu'on dit', va: 'nœud suivant', si: () => condition, grise: vrai si elle paraît sans se choisir, fait: () => effet (peut rendre la réplique suivante), fin: true }`. Les textes acceptent `{nom}`, `{moi}`, `{bete}`, `{betes}`, `{role}`. « Au revoir » s'ajoute de lui-même. Les indices (`NM_INDICES`), le récit (`NM_LORE`), les trocs (`NM_TROCS`) et les techniques (`NM_SAVOIRS`) sont des listes à compléter.

## 26. Le bramard

Un grand herbivore des plaines d'altitude, en **troupeau de quatre à six** : garrot haut, dos en pente, longue face portée bas sous un **bouclier d'os en croissant** (deux crochets chez les mâles), une crinière de longues mèches claires de la nuque au milieu du dos, des fanons de poil aux chevilles, une longue queue à touffe. Tiré à part du bestiaire (les îles d'avant ne changent pas) : environ **deux îles sur cinq dès la première exploration**. Il ne change pas le nombre des autres troupeaux.

- **Les plaines d'altitude, et rien d'autre** : il ne vit que sur l'herbe des hauteurs — prairie et lande au-dessus des six dixièmes des terres de l'île (dix cubes au moins). Il naît sur le plat (trois cases sur trois au même niveau), y paît, et y revient toujours ; il boit quatre fois moins que les autres (l'herbe des hauteurs l'abreuve), et ne descend donc presque jamais.
- **Un troupeau épars** : plus de tas. La meneuse (la plus vieille des femelles) va au pas d'un coin de la plaine à l'autre, s'arrête longuement pour paître, et attend qui traîne à plus de douze cases. Chacun des autres se choisit une place à trois ou neuf cases d'elle, à trois cases et demie au moins des autres, y broute vingt à quarante-cinq secondes, puis en prend une autre ; collé à un voisin, il s'écarte. Buté contre une marche, il change d'idée au bout de quatre secondes.

- **Calme** : il ne fuit pas, broute (la tête au sol, il rumine), marche lourdement une patte après l'autre, le corps qui roule. On peut passer au milieu du troupeau, même en courant.
- **Frappé** : tout le troupeau fait front — la colère gagne les adultes à dix cases — et charge.
- **Le rut** : un jour et demi toutes les six journées (décalé selon l'île ; « le brame monte des plaines · les bramards sont en rut »). Les mâles **brament** (tête levée, mâchoire ouverte, un souffle de vapeur), **grattent le sol** de l'antérieur, et le bord de leur bouclier **rougeoie comme une braise**. Ils chargent qui approche à moins de **six cases et demie** — **quatre** si l'on reste calme (voir section 21) — puis, la charge portée, vous laissent dix secondes : ils vous ont chassé. Ils se **défient entre eux**, front contre front. Les femelles mettent bas davantage ; les petits suivent leur mère.
- **Chiffres** : charge 14 % de vie (avant la montée du danger), puis 4,5 s de pause ; robuste (trois fois plus dur à abattre). Lié (35 % de base), il perd sa crinière en broutant : de la fibre.

Pour régler : `COMBAT.bramard`, `RUT_CYCLE` et `RUT_DUREE`, `bramardGraine`, `plainesHautes` (le seuil d'altitude), `paitreBramard` (le troupeau), et le bloc « LE BRAMARD » dans `index.html`.

## 27. La pêche

Façon Animal Crossing. La **canne à pêche** se fabrique à l'établi (12 bois, 16 fibres) et se range dans une case du bord : un appui la prend en main (ou la range). Canne en main, le bouton ACTION est à la pêche.

- **Les ombres** : des silhouettes sombres nagent dans les rivières, les lacs et l'océan autour de vous. Leur taille dit déjà un peu qui est là (petite, grande, longue, plate, énorme).
- **Lancer** (ACTION) : le bouchon tombe à trois ou quatre pas devant vous. Tombé sur une ombre, il la fait fuir. Une ombre proche le remarque, s'approche et le touche une à quatre fois : le bouchon tressaille. Puis il plonge d'un coup, avec un plouf : c'est le moment de **ferrer** (ACTION). Trop tôt, le poisson s'enfuit ; trop tard (moins d'une seconde, moins encore pour un poisson rare), il s'échappe. ACTION sans touche ramène la ligne, et marcher aussi.
- **La prise** : le poisson brandi au-dessus de la tête, sa taille en centimètres, et un mot sur lui.

| Poisson | Où | Quand | Ombre |
|---|---|---|---|
| Gardon de schiste | rivières, lacs | toujours | petite |
| Truite d'ardoise | rivières | à l'aube et au crépuscule | moyenne |
| Carpe des brumes | lacs | toujours, deux fois plus sous la pluie | grande |
| Anguille-lanterne | lacs, rivières | la nuit | longue |
| Sardine de nacre | océan | le jour | petite |
| Raie-horloge | océan | la nuit | plate |
| Lune-de-fond | océan | seulement par orage (rare) | énorme |

- **Les poissons** vont au sac (onglet Sac, « Poissons ») : un appui en mange un, de 12 à 45 % de vie selon sa taille. **G** donne à une bête qui chasse (ou mange de tout) le poisson le plus commun qu'on ait, plutôt qu'une baie : il rassasie plus, et sa confiance vient deux fois plus vite.
- **Le carnet de pêche** (onglet Journal) : chaque espèce, où et quand la trouver, combien de fois on l'a pêchée, et son record. Les autres restent « ? ? ? » avec leur coin d'eau.
- Frapper (X) ou monter en selle range la canne. Pas de pêche au Centre des automates.

## 28. La cuisine

Un moteur, à la façon d'un Zelda : on met ce qu'on veut dans la marmite (jusqu'à quatre ingrédients), et **il en sort toujours un plat**. L'onglet **Cuisine** du sac (touche 3, sac ouvert) montre à gauche la marmite, le plat servi et les plats du sac ; à droite, deux sous-onglets : **Ingrédients** (le garde-manger) et **Recettes** (le livre).

- **Où** : au feu du campement (onglet Campement, « Cuisiner »), ou partout avec la **marmite** (établi : 16 pierre, 10 bois, 6 fibres). Depuis une case du bord, elle se pose devant vous avec son petit feu ; ACTION près d'elle : CUISINER. Elle reste sur son île ; la reposer ailleurs la déplace.
- **Les ingrédients** :
  - **la viande** : chaque bête abattue laisse la sienne (deux pour les grandes), plus ou moins rare, du cuissot de brouteur (commun) au blanc d'aurore (légendaire). Une compagne qui chasse la rapporte parfois. Les automates n'en ont pas ;
  - **les produits des plantes** : une plante mûre qu'on abat donne parfois son fruit, sa racine, sa graine, sa fleur ou sa feuille (glands, figue de cactus, racine de roseau, clavaire lumineuse, pétale de braise…), d'autant plus rarement qu'il est précieux. Les compagnes qui récoltent en rapportent aussi ;
  - **les poissons**, **les baies** et **le nectar**.
- **Le plat** : sa sorte vient des familles réunies (ragoût, soupe, brochette, tourte, compote, confiture, infusion, sirop, pain, galette, poêlée, salade, terre et mer…), son nom de l'ingrédient le plus précieux, ses **étoiles** (1 à 5) de la rareté et de la variété.
- **Ce qu'il fait** : de la vie (bien plus que cru), le souffle plein s'il y a un fruit, une fleur ou une douceur, et parfois un **effet de quelques minutes**, celui des ingrédients qui le portent. Deux effets à égalité se contrarient.

| Effet | Ce qu'il fait | Il vient de… |
|---|---|---|
| vision de nuit | on voit loin la nuit, sans lanterne | chair de spectre, anguille-lanterne, clavaire lumineuse, fruit de verre |
| insensible aux braises | les braises et la morsure de la salamandre ne brûlent plus | chair de braise, pétale de braise |
| pas vif | +15 % de vitesse | les coursiers, la truite, le genévrier |
| coups puissants | +25 % de dégâts | traqueur, bossu, varan, cœur de chardon |
| peau dure | −20 % de dégâts reçus | lentigrade, oglodon, raie-horloge, edelweiss, sapin |
| grand souffle | la course essouffle deux fois moins | nectar, sève, figue, cerf, carillonneur, mousse céleste, Josué, lune-de-fond |

- **Six plats remarquables** se découvrent en cherchant ; le carnet donne un indice pour chacun (Soupe de lune, Tarte d'ambre, Festin des Horlogers, Gelée-lanterne, Bouillon de braise, Pain des premiers jours).
- *(Règle remplacée par la section 64 : tout plat va maintenant au sac ; un plat chaud s'y garde dix minutes.)*
- **Servi chaud** : la plupart des plats ne se gardent pas. Il faut le **manger** ou le **donner à une compagne près du feu** (à 14 pas du campement ou de la marmite) tout de suite. Fermer le sac, quitter le feu ou cuisiner autre chose, et il est perdu (« a refroidi »).
- **Ce qui va au sac** : certains plats font plusieurs parts, et/ou se conservent. Une part vaut **la moitié du plat entier** (vie, durée de l'effet). Ceux « d'un moment » se gâtent en **20 minutes de jeu** ; ceux de **longue conservation** tiennent.

| Plat | Parts | Garde |
|---|---|---|
| ragoût, soupe, soupe des bois | 3 | 20 min |
| terre et mer | 2 | 20 min |
| tourte, confiture, sirop, pain, galette | 2 | longue |
| caramel | 1 | longue |
| Soupe de lune, Bouillon de braise | 3 | 20 min |
| Festin des Horlogers | 4 | 20 min |
| Tarte d'ambre | 4 | longue |
| Pain des premiers jours | 3 | longue |
| Gelée-lanterne | 2 | longue |
| tout le reste (grillade, brochette, compote, infusion, poêlée, rôti, salade, plat du voyageur…) | 1 | chaud — depuis la section 64 : au sac, 10 min |

- **Le garde-manger suit la règle des matières** (viandes, produits de la flore, poissons ; baies et nectar en sont déjà) : au **retour d'expédition**, ce qu'en porte le sac passe au **cellier du coffre**, dans la même part que les matières (les cœurs perdus en coûtent autant) ; **la chute** (trois cœurs perdus sans campement planté) le vide ; il se **répartit** au campement (section 35) ; **près du feu**, la cuisine compte le cellier et y puise d'abord ; une compagne **au campement** y dépose ce qu'elle trouve. Le pillage ne touche pas le cellier. Pour régler : `P.cellier`, `sacIngr`, `metSacIngr`.
- **Manger** : le plat servi, ou une part du sac (onglet Cuisine ou Sac). Le garde-manger se mange aussi cru : un appui (moitié moins de vie ; la viande, jamais).
- **Les compagnes** : le plat servi se donne depuis l'onglet Cuisine ; G donne une part du plat le plus modeste du sac. Elle est soignée, et n'a plus faim de quatre à douze minutes.
- **Le livre de recettes** (onglet Cuisine, il a quitté le Journal) : chaque plat trouvé, ses meilleures étoiles, ce qu'il donne en parts et en garde, combien de fois on l'a préparé, et les ingrédients de sa meilleure préparation avec ce qu'on en a (en rouge, ce qui manque). **Marmite** y met ces ingrédients d'un coup. Les recettes notées avant cette version n'ont pas d'ingrédients : les refaire une fois suffit.
- **Les épingles** : trois au plus. Une recette épinglée passe en tête du livre, et le HUD la suit (« Ragoût de cerf · 1/2 », « prêt » quand tout y est).
- Pour régler : `CONSERVE` (parts, garde) et `GARDE_MOMENT` dans la section LA CUISINE d'`index.html`. Les plats gardés par une ancienne sauvegarde passent en longue conservation, une part.


## 29. Les bêtes s'en prennent aussi aux compagnes

- **Les chasseurs de l'île** : une compagne est une proie comme une autre. Un chasseur affamé qui a son espèce à son menu (un traqueur pour une brouteuse, par exemple) la prend en chasse et la mord ; le lien amortit la moitié de la morsure. Une compagne visée fuit, se retourne quand elle est acculée, et vos compagnes en **défense** accourent.
- **En défense, on fait front** : une compagne en défense qui se sait visée ne fuit plus (tant qu'il lui reste plus d'un tiers de sa santé) ; elle affronte la bête. Les combats entre bêtes se jouent donc aussi entre elles et vous.
- **Dans la mêlée** : une compagne qui s'interpose — plus près du prédateur que vous, de deux pas au moins — prend les coups à votre place pendant quelques secondes.
- **Les automates** : les tireurs visent la compagne à découvert nettement plus proche d'eux que vous ; la sentinelle tire sur tout ce qui approche de l'arche, compagnes comprises ; le traceur chasse aussi la compagne qui est à son menu. Au campement et dans le répit de l'arrivée, elles sont à l'abri comme vous.
- **À terre** : une compagne qui perd toute sa santé ne meurt pas, le lien la ramène dans le sac, **assommée**. Elle ne s'y remet plus seule : il faut un **baume de relève** (atelier, filtre Compagnes · 14 fibres, 4 os, se prépare d'avance). Dans l'onglet Compagnes, **Relever · 1 baume** la remet sur pied à 60 % de sa santé, et elle peut ressortir. Les baumes en réserve s'affichent dans le sac, à côté des flèches.

## 30. L'escouade des automates

- **Quand** : à partir de la 3e exploration, une fois toutes les 8 à 14 minutes passées sur une île — jamais dans les deux premières minutes après l'arrivée, jamais tant que vous êtes au campement (le compte s'y arrête), jamais sous terre ni pendant un pillage.
- **Le portail** : un anneau de braises s'ouvre à 15–20 pas de vous, face à vous (message, son, lueur la nuit), puis les automates en sortent un à un et il se referme. Le HUD affiche **ESCOUADE n** tant qu'il en reste.
- **Elle vous suit** : jour et nuit (le portail l'a chargée, elle ne s'éteint pas), elle vise vous — ou la compagne nettement plus proche d'elle que vous. Un automate semé (à plus de 45 pas pendant 20 s) repasse par un petit portail près de vous. Vous à l'abri du campement, elle rôde à sa lisière et attend. Elle ne repart pas : on la brise, ou l'on quitte l'île. Brisée, la suivante viendra 8 à 14 minutes plus tard.
- **Plus loin, plus forte** : deux traceurs à la 3e exploration ; un mercenaire dès la 5e, deux dès la 7e ; une sentinelle qui avance en porte-bouclier dès la 8e ; un tireur d'élite dès la 12e ; un mortier dès la 15e ; de 2 à 8 automates. Leurs coups valent 60 % de ceux de l'espèce à la 3e exploration, 100 % à la 10e, jusqu'à 120 % au-delà de la 20e (en plus du danger de la profondeur) ; leur blindage monte de 5 % par exploration, et le premier sorti, qui mène, est blindé d'un tiers de plus.
- **Butin** : celui de chaque automate, rien de plus.
- **Bêta** : l'onglet Bêta a un bouton **Faire venir** (l'escouade de votre exploration, au moins celle de la 3e) et dit dans combien de minutes viendra la prochaine.

## 31. Les corps : plus personne ne traverse personne

- **Chaque bête a un corps** : un disque au sol d'un peu plus du tiers de sa taille (un petit est plus petit), sur sa hauteur. Deux bêtes ne se traversent plus : un pas qui entrerait dans l'autre en est ramené le long d'elle — on glisse autour ; face à face, chacune s'écarte d'un côté. L'une au-dessus de l'autre (une falaise, un saut) ne se heurtent pas.
- **Le joueur aussi** : il bute sur toute bête comme sur un mur, compagnes comprises (il glisse le long d'elle si l'on marche de biais), et les bêtes s'arrêtent contre lui. Seule la monture qu'on chevauche ne compte pas ; à cheval, le corps du joueur est celui de la monture.
- **Deux corps mêlés** (une naissance, la sortie d'un portail, un coup qui projette) se démêlent doucement, à 1,6 case par seconde ; celui qui ne peut pas reculer (paroi, eau) laisse l'autre faire le chemin, et le joueur ne recule que si la bête ne le peut pas.
- Les attaques, elles, portent avant le contact : un bond, une morsure, un coup d'arme atteignent leur cible comme avant.
- Pour régler : `rayonCorps`, `hautCorps` et le bloc « LES CORPS » dans `index.html`.

## 32. Les avis

- Ce que le jeu vous dit (un portail qui s'ouvre, une confiance qui monte, un objet fabriqué…) s'affiche dans une **carte sombre** à bord doré, **sous le HUD du coin** (et sa goutte), à sa largeur ; s'il n'y a pas la place au-dessus du sac et du stick, à droite du HUD.
- **Police Nunito** (arrondie, très lisible ; SIL Open Font License), incluse dans la page : elle marche hors ligne. Plus de capitales espacées : la phrase s'écrit normalement.
- **Titre et détails** : la première phrase, jusqu'au premier « · », en titre doré ; chaque suite sur sa ligne, plus petite et plus claire.
- **Deux cartes au plus** : la plus récente en haut, contre la goutte, la précédente dessous, pâlie et réduite à son titre. Le même avis ne se répète pas, il se prolonge ; un avis qui ne change que d'un nombre (« confiance 40 % » puis « 60 % ») remplace le précédent.
- **La durée tient compte de la longueur** : 1,2 s plus 0,045 s par caractère, jamais moins que ce que le jeu demande, 7 s au plus.
- Pour régler : `.avis` (le style), `say` et `placerAvis` dans `index.html`.

## 33. Le HUD, en carte ; la récolte, avec son icône

- **Le HUD du coin** devient une carte sombre, comme les avis (police Nunito) : les trois jauges (vie et cœurs, mana et éclats, souffle — ou la monture), puis ce qu'on a sous la main avec leurs icônes (baies, flèches, baumes) et l'heure avec le temps qu'il fait ; dessous, ce qui se passe (escouade, plats, chaleur du rayon, arc bandé, ESSAI, autres joueurs) ; sous un filet, l'exploration, le danger et la distance à la maison (en rouge au-delà de la barrière), avec « Barrière franchie » et « Campement au sac » en étiquettes ; sous un autre filet, l'étape du guide.
- **Une goutte pendue sous la carte**, au centre (˄ / ˅), replie la carte : elle ne garde que les trois jauges. Le choix se garde dans le navigateur. Sans choix, elle est dépliée — sauf sur téléphone une fois le guide terminé. Sur téléphone, la carte est plus serrée et ne passe plus sous la fiche de la cible.
- **Les populations de l'île et les chiffres du moteur** ne s'affichent plus qu'avec les mesures (Réglages, ou l'onglet Bêta).
- **Le biome rare** n'a plus sa ligne dans le HUD ; sa découverte reste annoncée une fois.
- **Chaque récolte montre l'icône de ce qu'on gagne** : « +3 bois », « +2 éclats », « +1 figue de cactus », « +1 cuissot de brouteur », les baies, les flèches, le nectar, les poissons — dans l'avis, devant le nombre. La récolte dit aussi ce qu'on a désormais au sac (« 45 au sac »).


## 34. Les compagnes : la récolte au choix, les aptitudes

Chaque compagne en **Récolte** reçoit une cible, quelle que soit son espèce : Bois, Pierre, Fibre, Baies, Éclats, Ferraille ou Chasse (fiche de la compagne, onglet Compagnes, liste « Récolte »). Par défaut : son métier, sa meilleure note. L'espèce dit **combien** elle en rapporte.

- **Les notes** (1 à 5, en points ●●●○○ dans les listes) : une récolte rend le pied × **0,2 / 0,35 / 0,55 / 1 / 1,5**. La note 4 fait autant que vous, la 5 moitié plus. Les baies : 1 à 3 par buisson selon la note. La chasse : les os d'une prise suivent la note.
- **Les ingrédients trouvés en récolte** (produit d'une plante, viande d'une prise) : la chance suit la note de la récolte en cours, ×0,3 / 0,45 / 0,65 / 1 / 1,25 de la vôtre (`CHANCE_APT`). Avant, c'était ×0,6 pour toutes.
- **Ce qu'elles rapportent s'affiche comme pour vous** : une carte d'avis sous le HUD, le **nom de la compagne en titre**, puis chaque gain avec son icône (« Givre · +5 pierres · +1 noix de palme · +2 baies », « au coffre » si elle travaille pour le campement). Les gains d'une même compagne se cumulent quatre secondes dans sa carte ; la ligne rose du HUD a disparu.
- **La chasse** : les chasseuses (traqueur, spectre, varan, salamandre, félin) et **tous les automates**, chacun à sa note (tireur d'élite 4, traceur 4, mercenaire 3, sentinelle 2, mortier 2, moissonneur 1). Un automate lié chasse **tout ce qui bouge** : bêtes de toutes espèces, prédateurs et automates sauvages compris (ni les bêtes des Nomades, ni la gardienne d'un campement) ; un automate abattu rapporte ses éclats, sa pierre et sa ferraille ; le moissonneur lié lance sa faucille (tir faible, portée 5 : `tirLie`), que le moissonneur sauvage n'a pas. Une chasseuse mise à autre chose ne court plus le gibier pour le travail, mais chasse encore quand elle a faim.
- **Rien de sa cible dans son rayon** : elle explore vingt secondes, puis prend sa récolte la mieux notée qu'elle trouve à portée, et le dit (une fois toutes les deux minutes). Elle revient à sa cible dès qu'elle en voit.
- **Le bond de lumière** (cerf de verre seulement) : il atteint ce qui pousse sur les **îles volantes** (druses, mousse céleste). Il se charge de lumière une demi-seconde, se brise en éclats, reparaît sur la dalle à côté de la plante, la récolte, puis redescend de même là d'où il était parti. Il ne marche pas là-haut : tout autre ouvrage, ou poussé hors de la dalle, et il redescend. Pour régler : `BONDIT`, `monterDalle`, `descendreDalle`.
- **La défense** : dégâts d'une compagne = 0,06 + 0,045 × note (défense) ; 0,10 + 0,05 × note (+0,05 pour une chasseuse) quand elle attaque. La robustesse de l'espèce ne change pas. La note est affichée à côté de « Défense » dans la liste Rôle.
- **Où va la récolte** : en **autonome** (toute l'île) et **avec le joueur** (12 cases autour de vous), au **sac** ; **au campement** (16 cases autour du feu), au **coffre**, tant que vous êtes sur l'île du campement. Les baies de l'oglodon deviennent du nectar (moitié), partout. Les ingrédients trouvés vont toujours au garde-manger (il n'a pas de coffre).
- **Au campement en votre absence** : seulement celles restées dehors au départ (pas celles rentrées au sac), en Récolte, pas assommées. Au retour sur l'île : 4 de sa récolte par minute × le coefficient de sa note (1,5 os par minute pour la chasse), 90 minutes comptées au plus, une fois par départ ; les baies de l'oglodon, en nectar. Les gardiennes ne rapportent rien mais reviennent rassasiées. Pas d'ingrédients en absence.
- **Équilibre** : meilleure note de matière + défense = 6 à 8 ; la chasse compte à part. Le moissonneur, rare, est le seul généraliste fort, et nul en défense.
- Pour régler : `APT` et `COEF_APT` (section « les aptitudes des compagnes » d'`index.html`).

| Espèce | Bois | Pierre | Fibre | Baies | Éclats | Ferr. | Chasse | Déf. |
|---|---|---|---|---|---|---|---|---|
| Brouteur | 1 | 1 | 4 | 3 | 1 | 1 | — | 2 |
| Glaneur | 1 | 1 | 3 | 5 | 2 | 1 | — | 1 |
| Bossu | 4 | 4 | 2 | 1 | 2 | 2 | — | 3 |
| Crapaud-buffle | 1 | 1 | 4 | 3 | 1 | 1 | — | 3 |
| Vesseron | 3 | 1 | 4 | 2 | 1 | 1 | — | 2 |
| Cerf de verre | 2 | 2 | 3 | 2 | 5 | 1 | — | 2 |
| Lentigrade | 2 | 2 | 4 | 2 | 2 | 1 | — | 4 |
| Cotonnier | 1 | 1 | 5 | 2 | 1 | 1 | — | 1 |
| Carillonneur | 5 | 1 | 2 | 2 | 2 | 1 | — | 2 |
| Oglodon | 2 | 5 | 1 | 3 | 3 | 2 | — | 3 |
| Bramard | 2 | 2 | 4 | 2 | 1 | 1 | — | 4 |
| Coursiers | 2 | 1 | 2 | 2 | 1 | 1 | — | 2 |
| Traqueur | 1 | 1 | 1 | 2 | 1 | 1 | 4 | 4 |
| Spectre | 1 | 1 | 1 | 1 | 2 | 1 | 4 | 5 |
| Varan | 1 | 2 | 1 | 1 | 1 | 1 | 4 | 4 |
| Salamandre | 2 | 1 | 1 | 1 | 2 | 2 | 4 | 4 |
| Félin de brume | 1 | 1 | 1 | 2 | 2 | 1 | 5 | 4 |
| Moissonneur | 5 | 5 | 5 | 2 | 3 | 4 | 1 | 1 |
| Traceur | 1 | 2 | 1 | 1 | 2 | 4 | 4 | 3 |
| Mercenaire | 1 | 1 | 1 | 1 | 1 | 3 | 3 | 5 |
| Sentinelle | 1 | 2 | 1 | 1 | 1 | 3 | 2 | 5 |
| Tireur d'élite | 1 | 1 | 1 | 1 | 1 | 2 | 4 | 5 |
| Mortier | 1 | 3 | 1 | 1 | 1 | 3 | 2 | 5 |
| Sterne des nues | 1 | 1 | 2 | 2 | 4 | 1 | — | 2 |

- **La pêche** est une récolte à part (`PECHE_APT`) : la sterne seule, à 5. Le poisson va au sac, ou au cellier du coffre ; ses coefficients sont ceux des autres notes.


## 35. Le coffre : répartir sac et campement

Onglet **Campement**, case **Coffre** (section 37). **Tout déposer** et **Tout reprendre** restent (garde-manger compris) ; dessous, une ligne par ressource présente au sac ou au coffre, en deux groupes : **Matières** (bois, pierre, fibre, os, éclats, ferraille, baies, nectar) et **Garde-manger** (viandes, produits, poissons, au cellier du coffre) :

- **le curseur** dit combien on garde **au sac** (à droite) ; le reste va **au coffre** (à gauche). Les chiffres suivent pendant qu'on glisse ; le transfert se fait au lâcher ;
- **‹ et ›** déplacent une unité : ‹ vers le coffre, › vers le sac ;
- un avis confirme (« +5 bois · repris au coffre », « 3 pierres au coffre »).

Seulement au campement (curseurs grisés ailleurs). Le panneau ne se réécrit pas pendant qu'on tient un curseur, même si une compagne rapporte quelque chose. Pour régler : `partager` et `blocPartage` dans `index.html`.


## 36. Qui chasse qui

| Chasseur | Proies |
|---|---|
| Traqueur | brouteur, glaneur, bossu, coursier, cotonnier, carillonneur, **vesseron** |
| Spectre (nuit) | brouteur, glaneur, bossu, traqueur, coursier, coursier orange, cotonnier, carillonneur, lentigrade, **bramard** |
| Félin de brume | brouteur, glaneur, bossu, coursier, cotonnier, carillonneur, lentigrade, crapaud, cerf, **vesseron** |
| Varan d'ocre | glaneur, brouteur, crapaud, cotonnier |
| Salamandre (nuit) | coursier rouge, traqueur, glaneur, brouteur, varan, cotonnier, carillonneur, **oglodon** |
| Traceur | brouteur, glaneur, bossu, cotonnier, carillonneur, lentigrade (vous, sur l'île des automates) |
| **Mercenaire** | les joueurs et leurs compagnes d'abord ; personne en vue : **bossu, lentigrade, crapaud, bramard** |
| **Tireur d'élite** | les joueurs et leurs compagnes d'abord ; personne en vue : **les quatre coursiers**, aurore comprise (le seul à l'atteindre), et **la sterne des nues** en vol |
| Sentinelle, mortier, moissonneur | pas de gibier (la garde de l'arche, le siège, rien) |
| Automate lié, mis en Chasse | tout ce qui bouge (section 34) |

- En gras, les ajouts : plus aucune bête n'échappe à tout prédateur. L'oglodon riposte à chaque coup (une chance sur deux de blesser la salamandre) et encaisse (robustesse 1,8) : la chasse lui coûte cher.
- Les prises des automates sauvages ne laissent ni viande ni os. Autour des automates d'élite (au-delà du 8ᵉ saut), le gros gibier et les coursiers se raréfient.
- Le mercenaire et le tireur ont une liste de gibier mais ne comptent pas comme prédateurs de la faune (`predateur`) : la sentinelle ne leur tire pas dessus, et vos compagnes en défense ne les prennent pas pour des chasseurs.
- Pour régler : le champ `chasse` de chaque espèce (SPEC).


## 37. Le menu du campement, en cases

L'onglet **Campement** se lit comme l'établi : à gauche, l'île du campement puis **une case par action** (icône et nom) ; un appui sur une case l'affiche **dans le panneau d'à côté** (dessous, sur téléphone, où la page y descend d'elle-même), avec ce qu'elle fait et son bouton.

| Case | Ce que montre le panneau |
|---|---|
| Coffre | la réserve, Tout déposer / Tout reprendre, la répartition sac ↔ coffre (section 35) |
| Se reposer | santé et souffle refaits, compagnes rassasiées (au campement) |
| Cuisiner | ouvre le Campement, volet Cuisine |
| Partir **!** | une île au hasard, exploration + 1 (près d'une arche) |
| Viser une île | le journal, s'il tient des graines gardées |
| Rentrer **!** | la pierre de foyer (irréversible seulement depuis une autre île) |
| Améliorer **!** | le niveau suivant, son coût, ce qui manque |
| Reprendre **!** | le campement retourne au sac |
| Compagnes | celles qui tiennent le campement, le bilan de la dernière absence |
| Exploration | le niveau, le danger, la barrière, l'arche de l'île, le dernier retour |
| Pillage | gardiennes, règle, ce qu'on vous a pris |

- Une case **grisée** : l'action n'est pas possible ici ; son panneau dit pourquoi.
- **!** (en braise) : l'action ne se défait pas. Son bouton demande **un second appui** dans les cinq secondes (« Confirmer », et le panneau rappelle ce qu'on perd).
- Trois vignettes neuves : l'arche (`portail`), le coffre (`coffre`), la boussole (`boussole`).
- Pour régler : la liste `A` de `pageCampement`, et `detailCamp` / `faireCamp` dans `index.html`.


## 38. Les buissons à baies

Les baies ne sont plus un système à part : ce sont des **plantes de la flore**, cueillies à **ACTION** (geste « cueille », verbe CUEILLIR), comme le reste.

| Buisson | Biome | Baies (rend) | Repousse | Son fruit (ingrédient) |
|---|---|---|---|---|
| Groseillier | prairie | 3 | 120 s | Grappe de groseilles (rareté 1) |
| Roncier | bois | 3 | 120 s | Mûres de ronce (1 · pas vif) |
| Airelle | tourbière | 3 | 130 s | Airelles (2 · peau dure) |
| Mûrier de sylve | sylve fongique | 4 | 140 s | Mûres de sylve (3 · vision de nuit ; il luit la nuit) |

- **Où** : aux mêmes cases qu'avant (même tirage par île, mêmes buissons pour tous les joueurs), désormais de vrais pieds de la flore (la pose des buissons dans `loadWorld`, `BUISSON_BIO`).
- **Mûr**, un buisson porte ses baies, à la couleur de l'espèce ; cueilli, il repart de zéro et les rend en mûrissant. Le fruit nommé tombe parfois, comme les produits des autres plantes.
- **Les baies sont une matière du sac** (`P.sac.baies`) : coffre, curseurs, retour d'expédition, tout comme le reste. Plus de ramassage en marchant dessus, plus de « −2 baies » à la mort. `P.baies` reste un raccourci (le donjon s'en sert).
- **Les compagnes** cueillent les buissons comme toute plante (le glaneur, 5 aux baies, en tête) ; l'oglodon de la fourmilière y fait toujours son nectar.
- **Rien ne change à l'usage** : G nourrit et apprivoise, l'ingrédient « baie » en cuisine, le chiffre du HUD.
- Les anciennes sauvegardes gardent leurs baies (elles passent au sac).


## 39. La sterne des nues, le premier volant

Une colonie de **cinq** niche sur les **dalles des îles de nuage**, un peu plus d'une île sur deux (`sterneGraine`, tirée à part : les îles d'avant gardent leurs bêtes). Corps fuselé blanc, manteau gris perle, calotte noire, bec orange, queue fourchue à deux filets ; des ailes longues et étroites en trois segments (bras, avant-bras, main aux rémiges sombres).

**Sa journée**

| État | Ce qu'on voit |
|---|---|
| au nid | la tête balaie, elle lisse ses plumes, étire une aile ; la nuit elle dort la tête sous l'aile |
| décoller | elle se ramasse, puis bondit à grands battements (bruit d'ailes) |
| planer | des cercles au-dessus de la colonie, ailes tendues en léger dièdre qui frémit, inclinée dans les virages, avec de courtes reprises de battements |
| pêcher | affamée, un vol battu jusqu'à l'eau la plus proche (mer, lac ou rivière) |
| guetter | le surplace : ailes hautes et rapides, queue ouverte, tête basse |
| plonger | le piqué, ailes repliées en arrière ; la gerbe et le « plouf » ; six fois sur dix, un poisson |
| rentrer, se poser | le poisson en travers du bec ; elle freine ailes hautes, queue ouverte, pattes tendues, puis le mange au nid |

- **Le battement** passe du bras à la pointe avec un temps de retard (l'onde de l'aile) ; 4 à 9 battements par seconde selon qu'elle croise, monte ou fait du surplace. Tout le corps tourne autour de son axe dans les virages (`roll`), le nez plonge au piqué et se lève au freinage (`tang`).
- **Farouche** : vous approchez à moins de cinq ou six cases (plus vite vous allez, plus tôt), elle décolle en criant et s'éloigne en montant ; l'alarme gagne toute la colonie. Endormie au nid, on l'approche à deux cases : c'est là qu'on l'atteint sans arc.
- **Qui l'atteint** : aucune bête du sol ; le **tireur d'élite** la chasse ; vous, **à l'arc**, ou au nid. Touchée en vol, elle **tombe en vrille**, ailes lâches. Elle laisse un **Blanc de sterne** (rareté 2 · grand souffle).
- **L'apprivoiser** : **un poisson** au sac, et **sans bouger** (ou presque) : posée, elle vous laisse venir à une case. G le lui tend ; cinq poissons environ, et elle se lie (il faut un lien libre). Les baies, elle n'en veut pas. Sa fiche dit ce qu'elle fait et sa confiance.
- **Liée** (section LA STERNE LIÉE d'`index.html`) :
  - **avec le joueur**, au repos, elle se pose **sur votre épaule** (une seule à la fois, plus petite ; la nuit elle y dort) ; les autres tournent au-dessus de vous ;
  - **au campement**, à sa place près du feu ; **autonome**, elle vit sa vie de sterne, sans la peur ;
  - **en récolte**, elle vole à ce qu'on lui demande, au sol comme **sur les îles de nuage** (druses : Éclats 4, mousse céleste), s'y pose et le détache ; ou elle **pêche** (Pêche 5) : surplace, piqué, et le poisson au sac — au cellier pour le campement ; à sa note, parfois deux ; affamée, elle garde sa prise ; une pause sur l'épaule entre deux pêches ;
  - **en défense** (2), elle harcèle ce qui vous menace : des piqués, un coup de bec, puis elle remonte ;
  - au campement **en votre absence**, elle pêche : 0,8 poisson par minute × le coefficient de sa note, au cellier ;
  - la laisse ne la ramène que de très loin (45 cases) : elle vole droit.
- **Son ombre** reste au sol même haute, pâle, pour qu'on la suive des yeux. Sa voix : un « kirr » grinçant qui retombe, trois « kik » à l'alerte.
- **La colonie grandit** au nid quand elle est rassasiée, jusqu'à son plafond.
- Pour régler : `VOLANTS` (la fiche), `VOL` (vitesses), `majVolant` et `volerVers` (le comportement et le vol), `osSterne` (le corps), dans la section LA STERNE DES NUES d'`index.html`.


## 40. Le vesseron farceur

**Sa nuance** : chaque vesseron a la sienne, du rose framboise au bleu nuit en passant par le violet et le mauve brun, plus ou moins clair (`TEINTES_MYCO`, `couleurChapeau`). Les lamelles et le dôme suivent ; une compagne garde la sienne (sauvegardée).

**La nuit, son chapeau luit**, à sa nuance, plus clair, avec une lente respiration ; il éclaire autour de lui (une des trois lueurs telluriennes les plus proches). Il **s'éteint d'un coup** (un tiers de seconde) quand il **se cache** (cacher, tapi, détaler) ou **a peur** (fuite, acculé, alarme), et **se rallume doucement** (un peu plus d'une seconde) quand il ressort : quand il se penche pour lancer et rit, on le voit se rallumer à demi. Le jour, rien. Pour régler : `capLum` dans le corps du myconide, la lumière dans `lueursRares`.

**Sa farce** (sauvage, quand vous êtes à moins d'une douzaine de cases) :

| État | Ce qu'il fait |
|---|---|
| cacher | il glousse et file derrière ce qui le dépasse (champignon géant, arbre, souche), du côté opposé à vous, chacun son abri |
| tapi | accroupi derrière, il vous guette |
| ajuster | il se penche hors de l'abri, le bras armé haut derrière, la boule de spores au poing |
| rire | il lance (le bras fouette), puis rit en sautillant, le chapeau secoué d'un côté à l'autre, les yeux plissés ; les voisins s'y mettent |

- Une fois sur deux il reste à son abri, une fois sur deux il en change. À trois cases de lui, il **détale en riant** vers un abri plus loin. Frappé, il crache son nuage (comme avant) et file. Blessé (moins de 30 %), il ne joue plus : il fuit.
- **La boule** part en cloche, un peu devant vous si vous courez, à la couleur de son chapeau, avec une traînée de spores. Elle éclate en nuage vert : touché en plein, un petit coup ; dans le nuage, **empoisonné** quatre secondes (cumulables jusqu'à dix : la vie baisse doucement, sans jamais tuer ; étiquette « empoisonné » au HUD) et un peu engourdi.
- **Lié**, en défense, il fait le même tour à la menace : à plus de deux cases et demie, il s'arrête et lance une boule toutes les 2,4 s (plus précises, plus fortes) ; de près, le nuage, comme avant.
- Ses sons : un « hihihi » qui retombe, à sa hauteur de voix ; le « pff » du lancer ; le « pouf » du nuage.
- Pour régler : section LE VESSERON FARCEUR d'`index.html` (`farceVesseron`, `abriVesseron`, `lancerSpore`, `eclaterSpore`) ; le poison dans `update` (`P.poison`).


## 41. Le détour : plus de bêtes bloquées contre une marche

**Le constat** (mesuré sur quatre îles, 2 à 9 d'exploration, 2 min 30 de jeu chacune) : une bête sur deux environ restait un moment à piétiner contre le relief. Deux causes :
- les bêtes qui ne grimpent pas (cotonnier, carillonneur, coursiers, automates, vesseron) **suivaient la carte de l'eau des grimpeuses** : la pente les menait au bord d'une marche de deux cubes qu'elles ne descendent pas, l'eau en vue — elles tournaient là ;
- toutes allaient **en ligne droite** vers leur but : une marche trop haute, une falaise, un bras d'eau entre elles et lui, et elles longeaient la paroi d'un côté, puis de l'autre.

**Les remèdes** (section LE DÉTOUR d'`index.html`) :
- **Une seconde carte de l'eau, pour les marcheurs** (`CarteEauM`) : des pas d'un cube au plus. Chaque bête suit la sienne (`distEau`, `versLEau` reçoivent la bête).
- **Le détour** (`detour`, appelé par `pasVersBete`) : une bête qui ne gagne plus sur son but depuis deux secondes, alors que la ligne droite ne passe pas à sa mesure (`ligneLibre`), cherche un chemin sur les cases autour d'elle, dix-huit de rayon (`cheminNav`, Dijkstra) : le pas qu'elle sait faire (un cube, deux pour qui bondit), la paroi si elle grimpe (elle coûte), le saut en contrebas du coursier ; jamais l'eau, le vide ni les dalles, pas de coin coupé. Elle le suit de case en case et le **tend** dès que la ligne droite passe, puis reprend sa route.
- **Hors d'atteinte**, elle va **au plus près et s'y tient** (cinq secondes, puis elle réessaie) au lieu de piétiner.
- Rien ne se calcule tant qu'elle avance, ni quand la voie est libre (une bousculade de troupeau n'est pas un relief) ; un calcul au plus toutes les 2,5 s par bête.

**Le résultat**, mêmes îles, mêmes durées : bêtes **bloquées quinze secondes ou plus : 98 → 49** ; bloquées pour boire : de la cinquantaine à quatre. Ce qui reste est surtout le **troupeau qui se bouscule** autour de sa place (pas un relief) et quelques places de troupeau perchées sur une corniche.


## 42. La Tisseuse de fer, gardienne des îles 10, 15, 20…

Aux explorations **10, 15, 20, 25…**, une araignée automate géante dort près de l'arche, pattes repliées, yeux éteints. **L'arche n'apparaît qu'une fois la Tisseuse terrassée** (`PortailCache` la garde cachée ; `P.bossVaincus` retient les îles délivrées : elle ne revient pas).

**Son éveil** : à moins de 24 cases (ou au premier coup), un grincement de servos, les huit yeux qui s'allument un à un, les pattes qui se déplient, et elle se dresse (2,4 s). Sa barre de vie s'affiche en haut (fiche de la cible), avec sa phase et ce qu'elle prépare.

**Son corps sur plusieurs niveaux** : chaque patte se pose sur le sol qu'elle touche, à portée de jambe (3 cubes sous le corps, 2 au-dessus ; sinon tout près, ou elle reste où elle est). Le corps est **suspendu** entre ses pattes, à 1,6 au-dessus de ses pieds (`TISSEUSE.haut`, 2,75 avant le §135), le ventre bien au-dessus du sol. Les jambes sont longues (cuisse 2,3, jambe 2,4) : le genou, résolu à chaque image (deux os, un pôle vers le haut et le dehors), s'arque haut au-dessus du corps. Le corps **épouse le relief qu'il couvre** (dix points : tête, thorax, abdomen, flancs ; `CORPS_TISS`) autant que ses pieds : il **tangue et roule** entre deux niveaux, et **aucun de ces points ne passe sous le sol**, même pendant qu'il s'incline (testé : 0 image sur 600 en 30 s sur des gradins de 4 cubes, tangage jusqu'à 0,45, roulis 0,37). Elle marche en deux quatuors alternés ; le pied décrit un arc plus haut quand il monte et retombe lourdement (poussière, éclaboussure dans l'eau, bruit sourd, secousse selon la distance ; dessous, on se fait écraser). Elle patauge, contourne les falaises plus hautes que sa jambe, ne passe pas sous les îles de nuage. Testé sur un relief de 4 cubes : pieds sur 4 niveaux à la fois, le corps incliné.

**Son combat** : elle tient 9 à 18 cases, de flanc, face à vous, et change de sens de temps en temps. Une arme à la fois, toutes annoncées :

| Arme | Ce qu'on voit | Comment s'en sortir |
|---|---|---|
| Mortier (abdomen) | la tourelle se dresse ; 3 obus en cloche (5 en rage), le cercle rouge au sol | sortir des cercles |
| Fusil (sous la tête) | un laser rouge qui vous suit en retard, la lentille qui grossit puis clignote ; le coup part à 42 cases/s | un pas de côté au dernier moment |
| Toile (dès la moitié de sa vie) | la filière se lève, un paquet de soie électrique ; il s'ouvre au sol en toile bleue | dedans : vitesse au tiers, des piqûres ; en sortir |
| Cabrer (à moins de 5,5 cases) | elle lève les pattes avant… et frappe le sol : une onde | **sauter** au bon moment |
| Couvée (§136, à moins de 24 cases) | elle s'accroupit, une trappe s'ouvre sous l'abdomen et lâche 2 araignons (3 en rage) qui courent sur vous ou vos compagnes, bipent et explosent | les briser d'un coup, ou s'écarter quand ils bipent |

Au **dernier tiers**, elle enrage : jointures rougeoyantes, plus rapide, visée en 1 s au lieu de 1,6, salves plus nourries, recharges plus courtes.

**La frapper** — **sa boîte de contact** (`toucheBete`, `cibleContact`, `pattesTiss`) : le corps (une capsule autour du thorax et de l'abdomen) **et chacune des huit pattes**, du pied au genou et du genou à la hanche (deux segments, rayon 0,3) : une flèche qui passe entre les pattes ne touche rien, une flèche dans une patte la touche. Au corps à corps, on frappe **les pattes, du pied au genou** (à 0,35 près) ; le ventre, à 2,75 de haut, est hors de portée de l'épée. **Sa marche**, revue : l'enjambée grandit avec l'allure (et se replace vite à l'arrêt), le pied part et se pose en douceur (accélération puis freinage), une patte ne traîne jamais plus d'une enjambée derrière sa place (les jambes ne se tendent plus au-delà de leur longueur : 4,2 au plus pour 4,7), les pieds ne descendent plus qu'à 2,2 cubes sous le corps, la stance est plus ramassée (genoux hauts), et le corps **penche dans son mouvement** (vers l'avant quand elle avance, sur le flanc quand elle va de côté). **Robustesse 10**, plus 6 % par exploration au-delà de 10 (`blinde`) : une cinquantaine de coups d'épée à l'exploration 10. **Crocs et griffes glissent sur le fer** : les bêtes ne lui font que la moitié de leurs dégâts ; et ses pas, son onde de cabrage, écrasent, repoussent et étourdissent celles qui l'assaillent (un spectre et un bramard seuls ne l'entament plus que de quelques pour cent par minute).

**Son corps, en détail** : les cerclages de cuivre et les rivets de l'abdomen, les tuyaux le long des flancs, **deux cheminées** sur le dos, les **évents** des flancs où son cœur rougeoie (il bat plus vite en rage), les **chélicères** qui s'ouvrent et claquent au combat, les pédipalpes, l'antenne au feu clignotant, un **vérin** sur chaque cuisse, **trois griffes** à chaque pied.

**La vapeur** : les cheminées soufflent en continu (trois fois plus en rage), une bouffée après chaque salve de mortier, un **jet sifflant aux jointures** quand un coup porte, un nuage à l'effondrement ; la carcasse fume encore une vingtaine de secondes (`vapeurTiss`, `souffleTiss`).

**Sa mort** : les pattes cèdent et glissent, le corps s'affaisse, des étincelles, l'explosion, la carcasse reste — **+24 ferraille, +12 éclats, +10 pierres** (en plus du butin d'automate) — et **l'arche apparaît** dans une colonne de lumière.

Pour régler : section LA TISSEUSE DE FER d'`index.html` (`TISSEUSE`, `majTisseuse`, `marcheTiss`, `osTisseuse`).


## 43. Bêta : se téléporter vers une graine, à un niveau

Onglet **Bêta**, bloc **Se téléporter** : deux champs, **Graine** (un entier de 0 à 4 294 967 295 ; pré-rempli avec celle de l'île actuelle) et **Niveau** (l'exploration d'arrivée, 0 à 99 ; pré-rempli avec l'actuelle), **Au hasard** (une graine tirée) et **Y aller**.

- Le voyage passe par le chemin ordinaire (`voyagerVers` avec le niveau imposé) : la copie locale est écrite avec la nouvelle graine, la page repart, et l'on arrive à ce niveau d'exploration. **La partie suit** (ce n'est pas un essai) ; le mode essai, s'il était actif, se coupe ; les compagnes du campement restent au campement, comme pour tout départ.
- Pas depuis le souterrain (il faut remonter d'abord).
- Le panneau ne se réécrit pas pendant qu'on tape, et la saisie est gardée tant qu'on ne voyage pas.
- Repères : graine 0 et niveau 0, un départ ; la Tisseuse de fer garde les niveaux 10, 15, 20… (testé : graine 424242, niveau 10 → la Tisseuse est là, l'arche cachée).


## 44. Le dragon à plumes

Plus grand qu'un coursier : quatre pattes, un long cou en S de cinq anneaux, une tête à crête de plumes, cornes et mâchoire mobile, une queue de sept anneaux qui ondule et finit en panache, et de **grandes ailes de plumes** — cinq rémiges en éventail sur la main, quatre secondaires sur l'avant-bras —, qui battent lentement (environ deux fois par seconde) avec l'onde du bras à la pointe. **Quatre robes** (émeraude, pourpre, azur, ambre ; une compagne garde la sienne). Une île sur cinq environ, dès la troisième exploration (`dragonGraine`), un seul, **sur son aire au point le plus haut** de l'île.

**Sa vie**

| État | Ce qu'on voit |
|---|---|
| perché | sur son aire : la tête qui balaie, une aile qu'il étire, la queue qui ondule ; la nuit il dort, le cou replié sur le flanc |
| planer | de larges cercles, haut (une douzaine de cubes) au-dessus de son aire, battant de loin en loin, incliné dans les virages |
| observer | curieux, il vient tourner au-dessus de vous, puis s'en retourne |
| chasser | affamé : il choisit un herbivore, revient à 14 cases de biais, **se cabre en surplace** (ailes hautes, la gorge qui rougeoie, la gueule qui s'ouvre), **crache une boule de feu** en cloche (le cercle au sol l'annonce), **vire sur l'aile** et remonte, recommence ; la proie à terre, il se pose à côté et la **dévore** |
| menacer | approchez son aire : il se dresse, ailes ouvertes, gueule ouverte, et **gronde** ; restez, et c'est la guerre |

- **La boule de feu** explose en gerbe (dégâts de zone) et **le sol brûle** trois secondes et demie (les brasiers : `BRASIERS`, `majBrasiers` — **pas** `majFeux`, qui est le calcul des lumières de la nuit : un premier nom identique avait éteint toutes les lumières, corrigé) : on y prend feu (la brûlure ordinaire ; l'effet « insensible aux braises » protège).
- **Furieux** (frappé, ou aire violée) : il vous fait la chasse, du ciel, à coups de feu, une trentaine de secondes. Blessé (moins d'un quart), il fuit haut, puis rentre.
- Il **vire plus large, bat plus lentement et vole plus haut** que la sterne (`volK` : un même vol, à sa mesure).
- Aucune bête du sol ne l'atteint en vol ; le tireur d'élite le chasse ; vous, à l'arc, ou posé. Il laisse un **Filet de dragon** (rareté 4, insensible aux braises).

**L'apprivoiser** : **de la viande** au sac, et sans geste brusque : posé, il vous laisse venir (il tourne la tête vers vous, curieux, au lieu de gronder). G lui tend un morceau ; quatre ou cinq morceaux (plus la viande est rare, plus ça compte), et il se lie (il faut un lien libre). Il ne prend rien en vol, ni furieux. Testé : lié en 4 morceaux.

**Lié** : avec le joueur, il vous **escorte en tournant au-dessus de vous** et **se pose à vos côtés** quand vous restez immobile quelques secondes ; en **défense** (4), il fait pleuvoir le feu sur la menace (ses boules ne vous touchent pas, ni vos compagnes) ; en **chasse** (5), il abat une proie, se pose, en prélève sa part et vous **rapporte viande et os** ; au campement, il se pose près du feu.

Testé en simulation, sans erreur : 90 s affamé (perché, décollage, chasse : se cabrer, cracher, virer… 18 boules de feu) ; frappé, il vous chasse (cracher, virer, revenir) et vous fait brûler ; apprivoisé à la viande ; lié, il se pose et dort près de vous la nuit.

Pour régler : section LE DRAGON À PLUMES d'`index.html` (`DRAG`, `majDragon`, `attaqueDragon`, `cracheFeu`, `osDragon`, `MORPHES_DRAGON`).


## 45. Les terres de l'effroi : deux biomes, deux bêtes qu'on fuit

Deux nouveaux biomes rares, tirés **à part** des cinq premiers (les îles d'avant ne bougent pas ; `N_RARES_BASE`), avec leur flore, leurs ingrédients, et une bête qu'on ne combat pas sans y laisser des plumes.

| Biome | Exploration | Le sol | Sa flore → ses ingrédients |
|---|---|---|---|
| **Ossuaire** | 9 | os pâle, brouillard blanc qui traîne | Arbre-côtes (bois) · Lys de cendre → Pétales de cendrelys (3, vision de nuit) · Os-cep → Os-cep (2, peau dure) · Ronce de deuil (baies) → Baies de deuil (3, pas vif) |
| **Terres creuses** | 11 | mousse noire veinée de bleu, spores bleues qui montent, **îlots de roche** | Mousse veinée → Mousse-veine (2, grand souffle ; elle luit) · Lanterne des fosses (éclats) → Cœur de lanterne (4, vision de nuit) · Racine noire → Racine creuse (2, peau dure) |

### Le Silencieux (Ossuaire)

Grand (2,7), maigre, gris pâle. **Le modèle fin** (120 pièces, 145 la gueule ouverte ; `osSilencieux`) : un squelette sous une peau tendue — le bassin et ses crêtes, une **colonne voûtée de sept vertèbres** dont les apophyses saillent dans le dos, **cinq paires de côtes en arc qui respirent**, le sternum, le ventre creux, les clavicules, les omoplates, des lambeaux de peau qui pendent des épaules ; un **long cou** qui s'avance, un **crâne lisse et allongé**, des orbites recouvertes de peau, et **la face qui s'ouvre en deux** le long d'une couture : gencives, **deux rangées de dents en aiguille**, la gorge. Des bras en trois pièces (le coude saillant) et des **mains à quatre doigts de trois phalanges et un pouce**, ongles noirs, qui pendent, s'écartent (le hurlement), se tendent en griffes (la charge) ou se crispent (la prise) ; des jambes à rotule et arête de tibia, des **pieds à trois orteils** ; la jambe droite traîne. Les arêtes sont plus claires, les creux plus sombres. Par moments sa tête se tord d'un coup ; à l'écoute, il la penche sur le côté.

- **Il n'entend que le bruit** : **courir** s'entend à 26 cases, **marcher** à 9, frapper ou tirer de près aussi ; **immobile, vous n'existez pas.** Il entend aussi les bêtes qui courent, et les chasse.
- **Ses états** : il rôde (quelques pas, de longs arrêts, des **claquements de langue**) ; un bruit faible : il **écoute**, figé, la tête inclinée, puis s'approche ; un bruit franc ou proche : il se dresse et **hurle** (0,65 s), puis **fonce** à 7,2 cases/s — plus vite que vous ne courez — **sur l'endroit du bruit** ; arrivé, il **fouille** à tâtons, renifle, puis repart.
- **Qu'il vous touche**, bruit ou pas : il vous **saisit** et vous fracasse au sol. La première fois, il vous laisse **à peine debout** ; la seconde tue.
- **Pour vivre** : vous figer quand il est près ; vous éloigner en marchant tant qu'il est loin ; ne pas vous trouver là où il arrive. Il guérit vite (6 s sans coup) ; un coup reçu lui crie où vous êtes. Robustesse 5.

### Le Mille-gueules (Terres creuses)

Un mille-pattes géant de quinze anneaux, chitine prune et plaques, des points bleus qui luisent en deux rangées, une paire de pattes par anneau qui ondule, des antennes, et **quatre mâchoires qui s'ouvrent comme une fleur** sur un gosier rouge.

- **Il nage sous la terre meuble** et sent tout ce qui marche dessus, à 30 cases : une **traînée de terre** file vers vous, le sol **tremble**, un **grondement**.
- **Arrivé dessous** : la terre **se fend** (anneau de terre et d'étincelles bleues, une seconde, la secousse qui monte) — **fuyez** —, puis il **jaillit** très haut (si vous êtes dessus : un coup, et vous voilà en l'air), **se dresse** en oscillant, mâchoires ouvertes, **s'abat** sur vous, et **replonge** tête la première, le corps suivant dans le trou. Trois secondes, et il recommence.
- **On ne le blesse que dehors** (de l'arc, ou de près quand il se dresse) ; sous terre, il est hors d'atteinte. Blessé (moins de 30 %), il s'enfuit sous terre et se refait. Robustesse 6.
- **La roche est le seul refuge** : il ne la traverse pas, ni l'eau, ni les dalles. Sur un îlot, il tourne autour, sous la terre, et ne frappe qu'au bord (à moins de 4 cases) ; au bout de quinze secondes, il renonce. Il chasse aussi les bêtes qui s'aventurent sur sa terre.

### Les apprivoiser — difficilement (`offrandeHorreur`)

Ni le lien par l'appel, ni les baies : **une offrande de son sol, au bon moment**. Le bouton d'action devient **OFFRIR** quand vous portez la bonne.

| Bête | L'offrande | Le moment | Combien |
|---|---|---|---|
| Silencieux | un **Os-cep** (de l'ossuaire) | tendu **sans le moindre bruit** (immobile, ni arme ni arc), à moins de trois cases mais hors de portée de ses bras, quand il ne charge pas | une **dizaine** ; tant qu'il n'est pas à moitié apprivoisé, le geste l'**effraie une fois sur deux** : il hurle et fonce |
| Mille-gueules | un **Cœur de lanterne** (rare, des lanternes des fosses) | quand il est **dehors, dressé** — donc juste après avoir survécu à son jaillissement | **sept ou huit** ; il prend l'offrande et replonge sans frapper |

- **À moitié apprivoisé** : le Silencieux connaît votre pas (il ne fonce plus sur vous, ne vous saisit plus) ; le Mille-gueules ne vous chasse plus, mais vient encore, sans frapper, à qui porte un Cœur de lanterne (section 83). Un moment après chaque offrande, ils restent calmes.
- **Liés** : le **Silencieux** vous suit à quelques pas, de sa démarche boiteuse, s'arrête pour écouter ; en défense (5), il **hurle, fonce et saisit** la menace. Le **Mille-gueules** **nage sous vos pas** sur la terre meuble (il attend au bord de la roche) ; en défense (5), il **jaillit sous la menace**, se dresse, frappe et replonge. Ni l'un ni l'autre ne vous touche plus, ni vos compagnes.
- Testé : Silencieux lié en 11 offrandes (dont une où il a pris peur), Mille-gueules en 8 ; liés, ils vous suivent sans vous blesser.

Testé (graine 166 : ossuaire ; graine 109 : terres creuses) : la flore et la bête sont là ; le Silencieux hurle et fonce sur qui court, fouille puis repart quand on se fige, et saisit à portée de bras ; le Mille-gueules arrive dessous, fend, jaillit, se dresse, frappe et replonge. Repères pour l'onglet Bêta : graine 166, graine 109, niveau 12.

Pour régler : section LES TERRES DE L'EFFROI d'`index.html` (`bruitJoueur`, `majSilencieux`, `osSilencieux`, `majMille`, `osMille`).


## 46. Les états d'île — le Korlaz (fichier `etats.js`)

**Nouveau fichier** : `etats.js`, chargé après `nomades.js` et avant le jeu (à déposer avec les autres ; `sw.js` le met en cache, version `stone-valley-14`). C'est un **système d'états d'île** : un fléau qui tombe sur une île au hasard de sa graine, avec son filtre et ses règles. Le jeu l'appelle par quelques crochets (`etatsInit`, `etatsIle`, `majEtats`, `etatsRecolte`, `etatsHud`, `guerirKorlaz`, `majIllusion`, `osIllusion`) ; sans le fichier, le jeu tourne comme avant.

**Le Korlaz**, premier état : un élément inconnu qui **ronge la roche** et en fait monter une **spore neurotoxique**. Une île sur six environ, dès l'exploration 6.
- **L'île** : des plaques de roche rongée (pierre et falaise noircies, sol « roche rongée »), des spores sombres qui montent autour de vous, un voile verdâtre aux bords de l'écran, un avis à l'arrivée. Sur la roche rongée pousse, rare, le **Mycélium pâle** (ingrédient, rareté 4).
- **L'infection** : en restant **longtemps dans les spores** (une jauge « spores %» au HUD, qui monte près de la roche rongée et redescend loin d'elle ; une trentaine de secondes au cœur d'une plaque) ou en **récoltant près de la roche rongée** (un nuage en plein visage : une chance sur quatre d'être infecté d'un coup, et la jauge qui bondit). Infecté, on **le reste**, d'île en île et d'une partie à l'autre (sauvegardé), tant qu'on ne s'est pas injecté le remède.
- **Les visions**, au hasard, de plus en plus souvent à mesure que l'infection dure (au bout d'un quart d'heure, deux fois plus) :
  - la **brume noire** monte et respire, des volutes dérivent sur l'écran, le noir tombe une fraction de seconde ; des chuchotements ;
  - de **petits êtres décharnés** (grosse tête, orbites noires, une pupille minuscule) vous **regardent** de loin ; ils **s'approchent quand vous leur tournez le dos**, et se dissipent en fumée si vous allez à eux ;
  - une **blessure de nulle part** : un éclair rouge, du sang, un vrai coup léger ;
  - une **silhouette** noire et très grande, aux yeux comme deux points, surgit dans votre dos (une note qui grince), **vous fond dessus** et frappe (vrai coup, léger) avant de se défaire en fumée. Frappée la première, elle se dissipe.
  Vos compagnes ne voient rien.
- **Le remède** : une **recette légendaire** à découvrir dans la cuisine, à **quatre ingrédients** — le **Sérum de clairvoyance** : le mycélium pâle de la roche rongée, la fleur d'edelweiss des cimes (la mousse céleste ne pousse plus : voir §68), le nectar des oglodons, une goutte de sève. Une dose, qui se garde ; au sac, son bouton dit **Injecter**. Injecté : la brume se lève, les visions se dissipent, guéri.

**Le visuel, retravaillé** :
- **L'île** : la roche rongée vire au noir violacé ; des **excroissances** y poussent (des pointes noires aux bouts d'un vert maladif, qui luisent ; une case sur neuf) ; les spores sont lentes, noires ou vert-jaune, certaines luisent ; l'image perd un peu de couleur (filtre CSS sur les toiles `c` et `c3`).
- **Infecté** : l'image se **désature** et se contraste ; la brume noire respire, des **vrilles** rentrent par les bords, des **yeux** blancs s'ouvrent et clignent au bord du noir ; parfois un **visage immense** se devine dans la brume (deux orbites, une bouche) sur un bourdon grave ; la blessure fait **couler du sang** du haut de l'image ; le coup d'une silhouette **inverse l'image** un éclair.
- **Le Décharné** (revu au §92), modèle fin : un enfant famélique trop grand de tête — crâne nu, tempes creuses, deux **orbites noires énormes** où une **pupille minuscule** vous suit, une fente de bouche qui **s'ouvre sans un son** sur de petites dents ; un cou trop long aux vertèbres saillantes, quatre paires de côtes, le ventre rentré, des bras jusqu'aux genoux aux doigts trop longs, des genoux noueux, de longs pieds, des veines sombres. Il penche la tête lentement, puis d'un coup ; dos tourné, il **avance par à-coups** (jamais sous vos yeux) ; tout près, on l'entend **respirer**.
- **La Silhouette**, modèle fin : près de trois mètres, trop mince, voûtée ; une tête petite et longue, **couchée sur l'épaule**, sans rien d'autre que **deux points blancs** ; des bras à **trois articulations** finis en **cinq aiguilles** ; des jambes qui **finissent en fumée**. Surgie, elle **tremble** sur place ; ruée, elle se couche presque à l'horizontale, les aiguilles en avant.

Testé (graine 2, exploration 7) : 496 cases rongées, 7 mycéliums ; infecté après 23 s dans les spores ; une vision de chaque sorte ; la silhouette frappe puis se dissipe ; le sérum se cuisine avec les quatre ingrédients et guérit.

Pour régler : `etats.js` (`etatGraine` pour la fréquence, `KORLAZ_SEUIL` pour l'exposition, `vision` pour les tirages, `dessinerFiltre` pour l'image).


## 47. Le village (fichier `village.js`)

**Nouveau fichier** : `village.js`, chargé après `etats.js` (à déposer ; `sw.js` passe en `stone-valley-15`). Un **biome rare** « Village » (dès l'exploration 4, une île signée sur sept environ, sur prairie ou bois, près de l'eau ; tiré à part comme les terres de l'effroi), et ce qui y vit. Sans le fichier, le jeu tourne comme avant.

**Le village** (`villageIle`) : sur la place la plus plate du biome, un **foyer** (pierres en rond, bûches, la broche et sa marmite, le feu qui brûle et fume ; ce qu'on y a rapporté s'y voit : viande, poisson, fibres, baies), un **puits** (margelle de pierre, deux montants, petit toit de chaume, le seau au bout de sa corde), et **trois ou quatre maisons de formes différentes**, la porte vers le feu : la **hutte ronde** (huit pans de torchis, un toit de chaume en cône), la **maison longue** (pignons, toit à deux pentes d'ardoise, une cheminée qui fume quand on y dort), la **haute** (deux étages à colombages, un toit pointu). La nuit, les fenêtres des maisons habitées s'allument. Les maisons font obstacle (`rayonCorps`).

**Les toits, et l'élégance des maisons** (`osMaison`) : les toits sont de **vraies pentes** — une boîte posée de l'avant-toit au faîte s'incline d'elle-même (son axe monte), large de toute la longueur du toit et mince ; des **rangs** plus sombres suivent la pente (chaume ou ardoise). Chaque maison a un **soubassement de pierre**, des **colombages** (poteaux, sablières, croix de Saint-André), des **chevrons** sous l'avant-toit, un **faîte** et ses épis de fer, une **porte dans son cadre** avec son linteau, son seuil, sa poignée et sa **lanterne** (allumée la nuit), des **fenêtres à volets** dans leur cadre (allumées la nuit si l'on y dort). La hutte : huit pans, le cône cerclé d'une ligature, l'épi au sommet. La longue : deux pentes d'ardoise, les pignons à colombages, la cheminée à chapeau, une jardinière fleurie. La haute : l'étage en saillie, quatre pentes qui montent en pointe, une balustrade. Le puits a son toit à deux pentes, son treuil et sa manivelle ; le foyer, ses fourches, sa marmite à couvercle et trois bancs.

**Les matières** : les os d'une bête peuvent porter un **motif** (`tex`, un des motifs 16×16 de `TEX` ; `emitFoe` et le rendu GL le posent sur les faces comme sur le sol). Les maisons en ont cinq, nouveaux : l'**enduit** grenu (torchis), les **pierres taillées** (soubassements, margelle, cheminées), les **planches** (poteaux, portes, treuil), le **chaume** à brins couchés, les **rangs d'ardoises**. Le sol aussi : le biome Village est de la **terre battue** à cailloux (`TEX.battue`) ; l'ossuaire a son sol d'os craquelé (`TEX.os`), les terres creuses le motif des mycéliums, la roche rongée celui du basalte (ils n'avaient pas de motif jusque-là).

**Les familles** : deux adultes par maison, un métier chacun, souvent un enfant ; chacun a son nom et sa robe. Les métiers et leur journée (`majVillageois`, `vlTache`) :

| Métier | Ce qu'il fait |
|---|---|
| chasseur | cherche une bête à sa taille à moins de vingt cases, l'approche, la frappe de sa lance (un coup par seconde), rapporte la viande au feu (sur l'épaule) |
| cueilleuse / cueilleur | va couper une plante mûre à fibres ou à baies (trois secondes, le panier se remplit), la rapporte |
| porteur d'eau | va au puits (ou à la rivière quand il tire au sort), puise, revient le seau plein |
| pêcheur | se tient au bord de l'eau, la canne et la ligne tendues, et de temps en temps ça mord (une gerbe) ; rapporte le poisson |
| cuisinière | au feu, la louche à la main, tourne la marmite |
| enfant | court entre les maisons |

**La journée** : le matin chacun sort et travaille ; **à midi** (horloge entre 0,49 et 0,56) tout le monde vient **s'asseoir au feu** ; **la nuit** chacun rentre et dort (il disparaît dans sa maison, la fenêtre s'allume, la cheminée fume). Ils vous **saluent** de la main quand vous approchez.

**Ils parlent** (ACTION près d'eux : **PARLER**, `vlParler`) : une fenêtre de dialogue à la manière des Nomades (chiffres 1 à 5 au clavier, Échap pour fermer). « Qui es-tu ? » (son nom, son métier, sa famille et leur maison), « Que fais-tu ? » (selon son métier, l'heure, et s'il y a eu une alerte), « Parle-moi du village » (une parole d'ancien, et l'état des réserves), « Un conseil pour la route ? » (des conseils vrais sur les dangers du jeu).

**Ils se font attaquer, et se défendent** : les prédateurs (traqueur, spectre, félin, varan, salamandre, dragon) les ont dans leur gibier. Une menace à moins de neuf cases : les **chasseurs** en bonne santé **se battent** (lance, 0,3 par coup) ; les autres **courent s'enfermer** chez eux et attendent qu'elle s'éloigne. Un villageois tué l'est pour la visite (le village se repeuple à l'île suivante). Testé : un traqueur affamé lâché au village a été ramené à 9 % de vie par les chasseurs, sans perte.

Testé (graine 11, exploration 5) : hutte, maison longue, haute, puits, 8 habitants ; en 90 s de jour, chasse, cueillette, puisage, pêche, cuisine et retours au feu ; midi au repas ; la nuit rentrés, fenêtres allumées ; la parole avec sa famille citée ; l'attaque et la défense. Repère pour l'onglet Bêta : graine 11, niveau 5.

Pour régler : `village.js` (`VL_METIERS`, `vlTache`, `VL_LORE`, `VL_CONSEILS`, `osMaison`).


## 48. L'arrivée sûre (correction)

**Le bug** : à l'arrivée sur une île, le départ cherchait une **prairie au centre** de l'île (9 000 essais) ; faute d'en trouver (îles profondes, biomes rares qui la recouvrent), il **gardait la position de l'île précédente** — souvent au-dessus de l'océan. On tombait, la chute renvoyait au « dernier sol sûr »… qui était le même point : trois chutes, trois cœurs, et sans campement planté, retour à l'exploration 1.

**La correction** :
- `lieuSur()` : une prairie au centre ; sinon prairie, bois, lande ou village un peu plus loin ; sinon toute terre qui n'est ni le vide, ni les braises, ni l'effroi, ni la roche rongée ; sinon toute terre ; en dernier recours la terre la plus haute. Jamais l'eau, le vide, les dalles de nuage.
- `solSur(r)` : un point est-il une terre de cette île ? La chute (`respawn`) n'y renvoie que si c'en est une ; **une chute depuis un point qui n'est pas une terre de l'île ne coûte pas de cœur** : on est posé sur la terre ferme.
- La position gardée dans la sauvegarde n'est reprise que si elle n'est pas au-dessus de la haute mer.

Testé : six îles d'exploration 23 tirées au hasard, départ toujours sur la terre ; une île sans aucune prairie, départ sur un bois ; une chute depuis une position hors de l'île, aucun cœur perdu, posé sur la terre.


## 49. Plus vite, et la mort coûte un cœur

- **Les allures** (`VIT_MARCHE`, `VIT_COURSE`, `VIT_EPUISE`) : la **marche passe à 4,2** cases/s (l'ancien sprint), le **sprint à 5,8**, et l'allure épuisée à 3,2 (au lieu de 3,0 / 4,2 / 2,3). L'oreille du Silencieux suit d'elle-même : marcher reste « marcher » pour lui.
- **Tué par une bête, on perd un cœur**, comme dans une chute (`perdreCoeur`, partagé par `respawn` et `terrasse`) : on se relève au point de départ avec un cœur de moins ; au troisième, la même règle que pour les chutes (le campement vous reprend ; sans campement planté, loin du départ, retour à l'exploration 1, sac vidé). Le donjon garde sa règle à lui. Testé : tué, cœurs 3 → 2, relevé sur la terre ferme.


## 50. Les amis et le groupe d'expédition (fichier `coop.js`)

**Nouveau fichier** : `coop.js`, chargé après `village.js` (à déposer ; `sw.js` passe en `stone-valley-16`). Tout passe par la **diffusion Realtime** déjà ouverte (rien n'est écrit en base, aucune table à créer). Il faut être connecté à un compte.

**Le code d'ami** : six lettres tirées du compte (sans les caractères ambigus 0/O, 1/I/L), affiché dans le nouvel onglet **Amis** du sac, avec un bouton Copier. Chacun écoute son canal `sv:ami:<code>`.

**Ajouter un ami** : on entre son code, **Envoyer la demande**. S'il est en ligne, une carte s'affiche chez lui (**Accepter / Refuser**) ; sinon la demande **attend un quart d'heure** et repart dès qu'on le voit passer en ligne (la présence `ici` porte maintenant le code). Deux demandes croisées se valent un oui. La liste dit qui est **en ligne**, sur quelle île et à quelle exploration ; on peut **retirer** un ami (il est prévenu).

**Le groupe d'expédition** (quatre au plus) : **Inviter au groupe** un ami en ligne (on devient chef du groupe s'il n'existait pas) ; il reçoit la carte **Rejoindre / Décliner**. Le groupe a son canal `sv:groupe:<id>` ; chacun y dit où il est toutes les cinq secondes. L'onglet montre chaque membre, son île et son exploration ; **Quitter le groupe** (à deux, le groupe se dissout).

**Passer un portail en groupe** (`coopPortail`, appelé par le portail de l'île et par le portail dirigé du campement) : les membres qui sont **ailleurs** reçoivent une carte « *X a passé le portail · exploration N. Le suivre ?* » avec un compte à rebours de trente secondes :
- **Le suivre** : ils arrivent sur son île, à son exploration ;
- **Plus tard** (ou sans réponse) : « *Vous rejoindrez X en passant n'importe quel portail* » — un **rendez-vous** est noté (visible dans l'onglet, avec **Oublier**) : leur **prochain portail** les mène auprès de lui (là où il est alors, s'il a bougé depuis) ; tant que ce rendez-vous tient, le portail ne mène pas au campement d'un inconnu.

Amis, demandes en attente, groupe et rendez-vous sont **gardés dans la sauvegarde** (un voyage recharge la page : le groupe se reforme tout seul).

Testé avec deux joueurs simulés (Alice et Bob) : demande, acceptation, invitation, groupe à deux (chef Alice), Alice passe un portail, Bob reçoit la carte, décline, et son portail suivant le mène auprès d'Alice.


## 51. La flore rare, légendaire et épique (fichier `flore.js`)

**Nouveau fichier** : `flore.js`, chargé après `coop.js` (à déposer ; `sw.js` passe en `stone-valley-17`). **Dix-sept biomes** (rivage, prairie, bois, lande, falaise, pierre, neige, tourbière, canyon d'ocre, sylve fongique, champs de cristal, caldeira, nuage, fourmilière, ossuaire, terres creuses, village) ont chacun **douze plantes** à eux, à leurs couleurs (tige, feuille, pétale, cœur qui luit, pointe) : **6 rares, 4 légendaires, 2 épiques** — 204 plantes, 204 ingrédients.

**Leurs formes** (quatorze silhouettes en volumes, qui toutes bougent : le vent, la respiration, le jour et la nuit) :
- **Rares** (agrandies d'un tiers) : l'**étoile** (une corolle de sept pétales sur une tige qui ploie, qui s'ouvre le jour et se referme la nuit), les **clochettes** (un arc d'où pendent des cloches qui luisent la nuit), l'**éventail** (sept frondes qui ondulent), la **crosse** (trois spirales qui se déroulent et s'enroulent), l'**orbe** (des lanternes qui flottent au bout de tiges fines), l'**arbuste en fleurs** (ses pétales tombent) ; au champ de cristal, la **cristalline** (des pétales de cristal autour d'un cœur).
- **Légendaires** (géantes) : le **colosse** (une fleur de quatre mètres, dix pétales qui respirent, des étamines qui luisent et tournent, du pollen), le **saule** (une ramure en touffes, vingt-quatre chevelures qui ondoient au vent, leurs pointes lumineuses), la **méduse** (elle flotte à deux mètres, pulse, traîne dix filaments), l'**arbre-lumière** (une ramure en touffes, douze fruits lumineux qui tournent lentement).
- **Épiques** (géantes, et elles attaquent) : la **gueule** (deux mâchoires dentées sur une tige en S, une langue : elle se cabre, s'ouvre en grand, se détend et mord — 3,4 cases), la **fouetteuse** (cinq fouets d'épines qui ondulent ; l'un se lève et cingle — 4,2 cases, ça repousse), la **cracheuse** (un bulbe veiné qui gonfle et crache un venin en cloche — 9 cases, le nuage empoisonne). Chaque attaque s'annonce (0,6 à 0,9 s), puis elle se remet.

**Sur l'île** (`floreIle`, la graine décide ; *remplacé par la section 116 : une ou deux par île*) : sur chaque biome assez grand, **2 à 7 rares**, **une légendaire** une fois sur deux environ (un peu plus en s'enfonçant), **une épique** une fois sur trois environ dès l'exploration 2 ; jamais près de l'arche, du village ni du point d'arrivée. Leurs lueurs : du pollen lumineux autour des légendaires et des épiques ; la nuit, **les quatre plus proches éclairent** autour d'elles. La fiche dit leur nom et leur rang.

**Les cueillir** (ACTION : **CUEILLIR**) : la rare donne 1 ou 2 de son ingrédient et repousse en dix minutes ; la légendaire, 1, et repousse en une demi-heure ; l'épique **se défend** : il faut l'**abattre** (robustesse 3), et elle donne 2 de son ingrédient. Cueillie, la plante pâlit, ses pétales se ferment.

**Leurs ingrédients** (au garde-manger) : « Pétale de… », « Clochette de… », « Fronde de… », « Crosse de… », « Orbe de… », « Fleur de… », « Éclat de… », « Cœur de… », « Larme de… », « Voile de… », « Fruit de… », « Croc de… », « Épine de… », « Venin de… » (ou le nom de la plante quand il le dit déjà) ; rareté **rare** (rares), **légendaire** (légendaires), **épique** (épiques, nouveau rang) — plus la rareté est haute, plus ils nourrissent ; chacun porte un effet (vision de nuit, braises, pas vif, coups puissants, peau dure, grand souffle).

Testé (graines 166 et 11) : 46 plantes sur une île d'exploration 12 (40 rares, 4 légendaires, 2 épiques) ; les quatorze formes rendues sans faute ; une rare cueillie (+2, rareté rare, repousse) ; une épique arme, frappe, se remet ; abattue, +2 de son venin (épique).

Pour régler : `flore.js` (`FL_BIOMES` pour les noms et les couleurs, `floreIle` pour la fréquence, `majPlante` pour les attaques, `osPlante` pour les formes).


## 52. Des plats puissants, et des noms qui tiennent sous l'icône

**La puissance des effets** (`effet(k)` rend désormais 0, ou un niveau de 1 à 4 ; `ROMAIN`) : un plat ordinaire donne son effet au niveau I ; un plat qui contient un ingrédient de la **flore rare** monte au **II**, **légendaire** au **III**, **épique** au **IV**. Chaque niveau compte :

| Effet | I | II | III | IV |
|---|---|---|---|---|
| Coups puissants | +25 % | +50 % | +75 % | **×2** |
| Peau dure (dégâts reçus) | −20 % | −40 % | −60 % | −60 % |
| Pas vif | +15 % | +30 % | +45 % | +60 % |
| Grand souffle (course) | ½ | 0,3 | 0,15 | **sans fin** |
| Vision de nuit | 6,5 | 9 | 11,5 | 14 cases |
| Insensible aux braises | oui | oui | oui | oui |

**Ce que la flore rare ajoute au plat** (`preparer`) : son effet **compte double** (rare), **triple** (légendaire), **quadruple** (épique) — il l'emporte sur ceux des ingrédients ordinaires au lieu de s'annuler avec eux ; la **durée** est allongée de moitié (et peut monter à **20 minutes** dès le légendaire, au lieu de 10) ; la **vie** : +10 % (rare), +30 % (légendaire), **pleine** (épique) ; dès le légendaire, le **souffle** est rendu et une **régénération** s'ajoute (1 %/s pendant 60 s ; épique : 2 %/s pendant 90 s). Deux plats du même effet : la puissance la plus forte l'emporte, les durées s'additionnent. Le HUD et le livre de recettes disent le niveau (« coups puissants IV »).

**Les noms** : sous l'icône, une ligne, coupée proprement (…) — la grille ne se décale plus ; le nom entier reste au survol. Les ingrédients de la flore rare portent sous l'icône le nom de la plante (« fougère-houle »), leur nom complet garde la partie (« Fronde de fougère-houle ») ; les plats s'appellent par la plante (« Infusion d'étoile des prés »).

Testé : plat ordinaire (pas vif I, 1,5 min) ; avec une rare (coups puissants II, 2,9 min, +22 %) ; une légendaire (III, 5,4 min, +48 %, régénération 1 %/s) ; une épique (IV, 7,2 min, +100 %, régénération 2 %/s) ; mangé, dégâts ×2 et +18 % de vie en 5 s ; la grille de la cuisine alignée.


## 53. Vingt et un effets

Chaque ingrédient porte désormais **un effet tiré dans ceux qui vont à sa famille** (`EFFETS_FAM`, `redistribuerEffets` au démarrage ; le cœur, seulement aux ingrédients très rares et au-delà). Le plat prend l'effet qui revient le plus (la flore rare compte double, triple, quadruple), au niveau de son ingrédient le plus précieux (I à IV, voir § 52).

**À usage unique** (dès qu'on mange ; une quantité, pas une durée) :

| Effet | Ce qu'il fait |
|---|---|
| Vie en plus | une réserve de vie **au-delà du plein** (+15 % par niveau, 80 % au plus) qui prend les coups la première ; affichée « +x % » à côté des cœurs |
| Un cœur en plus | un **quatrième cœur** (une seule fois : il part le premier) |
| Second souffle | une réserve de souffle (+30 % par niveau, 150 % au plus) qui s'use avant la jauge ; affichée « ≈x % » |

**À durée** :

| Effet | Ce qu'il fait (par niveau) |
|---|---|
| Prédateurs à distance | les prédateurs ne vous chassent plus et **s'écartent** à 9 cases (+3 par niveau) |
| Invisible | les chasseurs, les automates, le dragon, la Tisseuse, le vesseron **ne vous voient plus** ; le personnage devient un fantôme pâle ; **frapper vous rend visible** (le Silencieux, lui, entend toujours) |
| Récolte abondante | ×1,5 / ×2 / ×2,5 / ×3 à chaque récolte |
| Grand saut | +12 % d'élan par niveau (≈ +25 % de hauteur), double saut compris |
| Chute de plume | on descend en planant (chute plafonnée) |
| Pas feutrés | le Silencieux ne vous entend plus ; les herbivores ne fuient qu'au tout dernier moment |
| Épines | qui vous frappe prend 30 % du coup par niveau |
| Vol de vie | chacun de vos coups vous rend 1,5 % de vie par niveau |
| Main douce | la confiance des bêtes monte +50 % par niveau (baies, poisson, viande, offrandes) |
| Antidote | ni poison, ni spores, et le Korlaz n'y fait rien |
| Coups glacés | vos coups étourdissent (0,7 s, +0,3 s par niveau) |
| Meute galvanisée | vos compagnes frappent +25 % par niveau |

…plus les six d'avant (vision de nuit, braises, pas vif, coups puissants, peau dure, grand souffle). Testé : chaque effet s'applique ; la vie en plus a encaissé un coup entier ; le quatrième cœur ; la réserve de souffle ; frapper invisible rend visible ; avec les pas feutrés, le Silencieux n'entend rien.


## 54. Les demandes d'ami arrivent enfin, et l'onglet Amis est remis d'aplomb

Fichiers à redéposer : `index.html`, `coop.js`, `sw.js` (qui passe en `stone-valley-18`). Rien à changer côté Supabase.

**Pourquoi la demande n'arrivait pas.** Realtime (Phoenix) n'accepte un message que sur un canal qu'on a **rejoint** ; sinon il le jette sans bruit (« unmatched topic »). Le jeu postait la demande sur le canal `sv:ami:<code>` de l'autre sans s'y être abonné : elle n'atteignait jamais personne. Même chose pour accepter, refuser, retirer et inviter au groupe. Le banc « deux joueurs simulés » de la section 50 ne s'en apercevait pas, parce que son faux serveur laissait passer ces messages. Désormais `envoiAmi` rejoint le canal du destinataire, envoie, et le quitte dix secondes plus tard.

**Les canaux qui mouraient au bout d'une heure.** Les canaux s'ouvrent avec le jeton du compte, qui ne vaut qu'une heure ; à l'échéance, Realtime les ferme tous (canal d'ami, île, `sv:monde`), et le jeu ne s'en rendait pas compte. Désormais :
- le jeton est renouvelé une minute avant l'échéance, même sans sauvegarde en cours, et redonné aussitôt à chaque canal ouvert (message `access_token`, comme le client officiel) ; un seul renouvellement à la fois ;
- chaque jonction porte sa propre référence (`join_ref`), et le jeu lit les réponses du serveur : un canal refusé ou fermé est rouvert tout seul (2 s, puis 4, 8… jusqu'à 32 s) ;
- au démarrage, un jeton périmé est renouvelé avant d'ouvrir la connexion.

**Les demandes, côté joueur.**
- Une demande en attente repart toutes les six secondes tant que l'autre est en ligne : il n'en voit plus qu'**une carte** à la fois (avant, une nouvelle carte toutes les six secondes), avec une clochette à la première.
- Les demandes reçues restent dans l'onglet (**Demandes reçues**, avec Accepter / Refuser) même quand la carte du haut a disparu ; répondre d'un côté efface l'autre. Une carte périmée quitte enfin l'écran.
- Un code qui contient 0, O, 1, I ou L est refusé avec une explication (ces caractères n'existent jamais dans un code). Entrée envoie la demande. Entrer le code de quelqu'un qui vous a déjà écrit vaut un oui.
- Le message d'envoi dit si le joueur est en ligne (« demande envoyée à Bob ») ou s'il faudra attendre qu'il se connecte.
- On ne peut plus se faire ajouter par un « oui » qu'on n'a pas demandé, ni par un code qui ne correspond pas au compte annoncé.
- **Retirer** un ami demande deux appuis (« Confirmer »).
- La présence `ici` porte maintenant l'exploration : la liste affiche « île X · exploration N » pour tout ami en ligne, et plus « exploration ? ».

**La mise en page.**
- L'onglet n'avait ni marges ni colonnes : il prend maintenant la même charpente que les autres (`sac-corps deux`) — 18 px de marge, deux colonnes sur ordinateur (amis à gauche, groupe d'expédition à droite), une seule sur téléphone, chaque colonne défile.
- Le code en vedette dans un cadre, l'ajout sur une ligne (champ + **Envoyer**), puis les demandes reçues, les demandes envoyées (pastille verte si le joueur est en ligne, minutes restantes) et les amis (en ligne d'abord). Le groupe affiche « 2 sur 4 », le chef et « vous ».
- **Le rail des onglets** : avec dix onglets, il ne tenait plus dans le cadre de 640 px ; ouvrir Amis faisait défiler tout le cadre et cachait l'en-tête. Les onglets sont un peu plus serrés (tout tient à 640 px) et le rail défile seul quand l'écran est plus bas (téléphone en paysage).
- Deux règles CSS que `#sac button { font: inherit; color: inherit }` écrasait sans qu'on le voie : les libellés du rail reprennent leurs 11 px (10 px sur téléphone, donc moins de « Com… »), et le texte des boutons dorés redevient sombre et lisible (il était clair sur l'or, dans tous les onglets).

Testé avec deux et trois navigateurs contre un faux Realtime **strict** (il rejette comme le vrai les messages hors canal et ferme les canaux d'un jeton expiré) : la demande arrive aussitôt, une seule carte, acceptation par la carte ou par l'onglet, refus, invitation et groupe à deux, jeton renouvelé et transmis aux canaux, canaux rouverts après expiration et nouvelle demande reçue. Avant la correction, le même banc montrait la demande rejetée quatre fois sur quatre.


## 55. Les onglets du sac, lisibles sur téléphone

Fichiers à redéposer : `index.html` et `sw.js` (qui passe en `stone-valley-19`), plus `coop.js` de la section 54 si ce n'est pas déjà fait.

Sur téléphone, les dix onglets tenaient sur une seule ligne de 33 px chacun : « Com… », « Ca… », « Sa… ». Ils sont maintenant **sur deux lignes de cinq**, avec leur nom en entier, et rangés en deux groupes :

| | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **En jouant** | Sac (1) | Établi (2) | Cuisine (3) | Compagnes (4) | Campement (5) |
| **Le reste** | Journal (6) | Amis (7) | Sauvegarde (8) | Réglages (9) | Bêta (0) |

- **L'ordre change partout** (rail d'ordinateur compris) : Cuisine passe de la touche 9 à la 3, Bêta de la 8 à la **0**, qui ouvre maintenant le dixième onglet (Amis n'avait pas de touche). Les touches suivent l'ordre du tableau ; l'aide des Réglages dit « 1 à 9, 0 ».
- **Téléphone en portrait** : l'onglet ouvert est sur fond sombre, nom doré, filet doré dessous. La croix monte dans l'en-tête, à droite des jauges, pour laisser toute la largeur aux onglets ; les barres de vie et de mana y sont un peu plus courtes, et sous 350 px de large les trois cœurs s'effacent de l'en-tête (ils restent dans le HUD). Les noms tiennent en entier de 320 à 640 px.
- **Téléphone en paysage** : le rail passe sur deux colonnes de cinq (un groupe par colonne), et tout tient sans défiler.
- **Ordinateur** : le rail ne change pas de forme ; un filet sépare les deux groupes.


## 56. La même faune de départ pour tout le monde (phase 0 du partage des créatures)

Fichiers à redéposer : `index.html`, `etats.js` et `sw.js` (qui passe en `stone-valley-20`). Rien à changer côté Supabase, et pas un message de plus.

**Avant.** La graine fixait la liste des espèces d'une île, mais chaque bête était posée au hasard du navigateur : deux joueurs sur la même île ne voyaient ni les mêmes bêtes, ni aux mêmes places, ni avec les mêmes robes, même en arrivant ensemble.

**Maintenant.** Le peuplement de départ tire son hasard de la graine de l'île, mêlée au niveau d'exploration (qui règle le bestiaire et le nombre de bêtes) et au genre d'île :
- deux joueurs qui arrivent sur la même île, au même niveau (c'est le cas quand on suit un ami ou qu'on le rejoint), y trouvent **les mêmes bêtes, aux mêmes places, avec les mêmes robes rares** — les Doux et leurs petits, les Rampants, les coursiers, les Telluriens, les félins, les automates, la Tisseuse, les plantes rares, le village ;
- **le point d'arrivée** est lui aussi le même pour tous : on arrive à côté de son ami ;
- chaque bête de départ porte un **numéro** (`b.num`), le même chez tous les joueurs de l'île : c'est ce qui permettra à la phase suivante de désigner une bête sans ambiguïté.

**Ensuite, chacun fait encore vivre ses bêtes de son côté** : elles divergent au fil des minutes (où elles broutent, qui elles chassent, qui naît, qui meurt). Le partage en continu, c'est la phase 1 (un « gardien de l'île » qui fait vivre la faune et la diffuse aux autres).

**Comment.** Le temps du peuplement (une suite d'appels qui ne rend jamais la main), `Math.random` est remplacé par un tirage pseudo-aléatoire (mulberry32) semé par `graineFaune()`, puis rendu dans un `finally`. Les centaines de tirages de `poser`, `naitre`, des robes rares, des mères et de leurs petits, de la Tisseuse ou des plantes rares y passent sans qu'on y touche. Après le peuplement, le vrai hasard reprend.

**Deux corrections au passage.**
- Les horreurs se plaçaient « loin de l'arrivée » et la flore rare « pas sous les pieds », mais la distance se mesurait depuis la position d'*avant* le chargement — (0, 0) au démarrage. Le point d'arrivée est maintenant tiré **avant** le peuplement.
- Le Korlaz change le sol en place : un second chargement de la même île (l'île remise à zéro) partait d'un sol déjà rongé et donnait une autre faune. `etats.js` garde le sol d'origine et `loadWorld` le rend avant de peupler : chaque chargement donne la même île.

**Pour vérifier à deux.** Onglet Bêta › Mesures › **Faune de départ** : le nombre de bêtes et une empreinte de six caractères (espèce, place de naissance et robe de chaque bête). Deux joueurs sur la même île, au même niveau, doivent lire la même.

Testé avec deux navigateurs : Bob part vers l'île d'Alice par le vrai chemin (`voyagerVers`, comme pour suivre un ami) et retrouve la même empreinte et le même point d'arrivée ; aux niveaux 0, 2, 3, 6, 10, 15 et 21, les deux joueurs (l'un avec campement, mode essai et position différente) obtiennent les mêmes bêtes, une à une (97 à 137 selon le niveau, toutes identiques) ; une île du Korlaz rechargée trois fois rend trois fois la même faune ; deux joueurs arrivés ensemble voient la même fourmilière et les mêmes oglodons aux mêmes places ; après le peuplement, `Math.random` est bien le vrai.


## 57. La faune partagée : tout le monde voit les mêmes bêtes (phases 1 et 2, fichier `faune.js`)

**Nouveau fichier** : `faune.js`, chargé après `coop.js` (à déposer, avec `index.html` et `sw.js`, qui passe en `stone-valley-21`). Rien à changer côté Supabase : tout passe par la diffusion Realtime déjà ouverte.

**Le principe : un gardien par île.** Un seul appareil fait vivre la faune d'une île : le **gardien**. Les autres joueurs de l'île la **suivent** : leurs bêtes n'y pensent plus elles-mêmes, ce sont des marionnettes qui glissent vers la place, le cap et l'état que dit le gardien (prolongés de leur vitesse entre deux nouvelles). Leurs pattes, leurs voix, leurs ailes s'animent comme d'habitude.

- **Qui garde** : celui qui garde depuis le plus longtemps ; à trois secondes près, le plus petit identifiant de compte. Seul sur son île, on est son propre gardien. Celui qui arrive (ou réactive le partage) **écoute quatre secondes** sans se dire gardien : il trouve ainsi le gardien en place et le suit, au lieu de lui imposer sa faune. Deux joueurs arrivés ensemble : l'un garde, l'autre suit (leurs faunes de départ sont identiques depuis la phase 0, la bascule ne se voit pas).
- **La relève** : le gardien parti (portail, fermeture, quatre secondes de silence), le plus petit identifiant des suiveurs reprend la faune telle qu'il la voyait, et elle continue de vivre.
- **L'inventaire** : un suiveur demande au gardien sa faune entière (`faune?` / `faune`, environ 15 Ko une fois) : les bêtes qu'il a déjà (même numéro, même espèce) sont replacées, les autres naissent, celles que le gardien n'a plus disparaissent.
- **En continu**, dans la position du gardien (champ `f`) : les bêtes à moins de 48 cases de chaque suiveur, six autres à tour de rôle (une bête lointaine n'est jamais figée longtemps), les naissances (espèce, robe, âge), les retraits, et **l'heure du jour** — une seule heure par île, celle du gardien.
- **Ce qui se voit** : place, cap, état, vie, vitesse, et l'allure — l'alarme, le ramassé avant le bond, le camouflage du félin, la mise en joue du tireur d'élite (et sa cible, le rayon rouge compris), le crapaud enfoui, le vol et le battement d'ailes de la sterne, le cou, la crinière et la ruade du coursier, le recul d'un tir, la taille d'un petit, la faim sur la fiche de la bête visée.

**Les bêtes voient tous les joueurs (phase 2).** Chez le gardien, chaque bête partagée se règle sur **le joueur le plus proche**, qu'il soit ici ou en face : elle le craint, le regarde, s'y habitue (« vous observe »), le chasse, le charge, le vise. Chaque joueur dit dans ses positions s'il est **calme**, **à l'abri** (campement, répit d'arrivée), **invisible**, **silencieux** ou **repoussant** (champ `fx`) : les bêtes du gardien en tiennent compte comme pour lui. Les jetons d'attaque (deux chasseurs à la fois sur un joueur) se comptent par joueur.

**Les coups.**
- **Une bête sur un joueur d'en face** (morsure, charge, ruade, coup de corne) : le gardien envoie `morsure`, et c'est l'appareil du joueur qui encaisse — armure, vie en plus, recul, brûlure, désarçonné, chute, épines (qui reviennent au gardien), comme pour un coup d'ici.
- **Les tirs des automates** : le gardien envoie chaque tir (`ftir`) ; les suiveurs le voient partir et voler (balle, obus en cloche et son cercle au sol), et **chacun encaisse ce qui le touche, chez lui**. Le vrai tir du gardien s'arrête sur un joueur d'en face sans le blesser deux fois.
- **Un suiveur frappe une bête** (arme, flèche, retombée, ou ses compagnes) : il le voit aussitôt, et l'envoie au gardien (`fcoup`), qui compte le coup, la colère, celle de la colonie ou du troupeau, l'étourdissement (coups glacés compris) et la mort. Le butin est à celui qui l'a abattue.
- **Lier ou monter une bête** (baies, Appel, éclat d'un automate, rodéo) : elle quitte la faune du gardien (`flien`) et devient celle du joueur ; les autres la voient alors comme sa compagne, comme avant.

**Restent propres à chaque appareil**, comme avant : les compagnes (déjà partagées par leur maître), le souterrain, les visions du Korlaz, les nomades, le village, les plantes rares, les gardiennes du pillage, l'escouade, la Tisseuse, le dragon et les horreurs, la météo. *(Depuis la section 58, tout cela est partagé, sauf les visions du Korlaz.)*

**Pas encore (phase 3 et suivantes — faits à la section 58)** : puiser à la fourmilière et la colère de la colonie contre un suiveur, les sorts (Souffle, Ancrage…) sur les bêtes du gardien, les spores du vesseron sur un suiveur, la confiance gagnée par un suiveur ne passe pas au gardien (elle compte chez lui, et le lien part bien). Un coursier dont un suiveur tombe au rodéo reste chez lui seul.

**L'onglet Bêta** › Mesures › **Faune partagée** dit qui fait vivre la faune (« vous la faites vivre · suivie par Bob · 83 bêtes », « faite vivre par Alice · dernière nouvelle il y a 0,3 s »), avec un bouton **Couper / Activer** (gardé dans le navigateur) : coupée, on revoit ses propres bêtes, et les bêtes des autres vous ignorent.

**Ce que ça coûte (mesuré, à deux joueurs, contre le faux serveur Realtime)** :

| | Faune coupée | Faune partagée |
|---|---|---|
| Tous deux immobiles | 2,3 msg/s | 5,0 msg/s |
| Position du gardien | 0,29 Ko | 1,0 à 1,5 Ko en moyenne, 2,2 Ko au plus |

Le gardien parle au plus trois fois par seconde quand quelque chose bouge près d'un suiveur, et se tait comme avant quand rien ne bouge ; quand il marche, il parle déjà cinq fois par seconde et la faune ne coûte rien de plus. À deux, moitié du temps en mouvement, on passe d'environ 12 à 14-15 msg/s (de ~46 h à ~38 h de jeu par mois sur le quota gratuit de 2 millions). Les données : une quinzaine de Mo par heure à deux, loin des 5 Go du plan gratuit. **Le plafond à surveiller reste celui du plan gratuit : 100 messages par seconde pour tout le projet** (quatre joueurs en mouvement en font déjà ~83).

**Testé** avec deux et trois navigateurs : Bob arrive chez Alice, reçoit l'inventaire et la suit ; autour de lui, les bêtes sont aux mêmes places chez les deux (écart médian 0,04 à 0,07 case, au plus 0,14), dans le même état ; sur toute l'île, mêmes bêtes, mêmes espèces. Bob agité près d'un cotonnier : il fuit chez Alice comme chez Bob. Un traqueur du gardien traque Bob, et sa morsure est encaissée chez Bob seulement. Un mercenaire tire sur Bob : Bob voit les tirs (sept en vingt secondes) et en prend trois ; Alice rien. Bob frappe un lentigrade : sa vie baisse chez Alice et il entre en colère ; Bob l'achève : mort chez les deux. Bob lie un cotonnier : il quitte la faune d'Alice, qui voit la compagne de Bob. Alice et Bob arrivés ensemble : Alice garde, Bob suit. Carole rejoint : elle suit Alice. Bob coupe le partage, puis le réactive : il suit Carole. Alice s'en va : Carole reprend, les bêtes vivent. Seul sur son île, rien ne change. Les amis, la faune de départ et le Korlaz n'ont pas bougé.

## 58. L'île partagée : tout le monde voit tout (fichiers `faune.js`, `index.html`, `flore.js`, `village.js`, `nomades.js`, `donjon.js`)

**À déposer** : `index.html`, `faune.js`, `flore.js`, `village.js`, `nomades.js`, `donjon.js`, `sw.js` (qui passe en `stone-valley-22`). Rien à changer côté Supabase : tout passe encore par la diffusion Realtime de l'île.

La faune partagée de la section 57 devient **l'île partagée**. Le même gardien (celui qui fait vivre l'île) fait vivre désormais tout ce qui se voit, et les autres le suivent. Seules **les visions du Korlaz** restent à chacun : ce sont des hallucinations, elles n'existent que dans la tête de qui les voit (deux joueurs ne voient pas les mêmes, et c'est voulu).

**Le ciel.** Une seule météo par île : le gardien tire les changements de temps et les éclairs, les autres voient le même ciel, le même fondu, le même vent, les mêmes nuages, et l'éclair (puis le tonnerre) au même moment. Un sort ou l'essai de l'onglet Bêta qui change le temps chez un suiveur est demandé au gardien, qui le fait pour toute l'île. Le sort de l'Aube aussi : le jour se lève pour tous.

**Les campements.** Le campement d'un joueur posé sur l'île se voit chez les autres (sa tente, son feu qui crépite et éclaire, sa bannière dorée ; son portail ne s'ouvre que pour lui). Celui qu'il pille se voit aussi, bannière rouge, avec ses gardiennes qui se battent (on les voit, sans pouvoir s'en mêler : le pillage est l'affaire du pillard).

**Les bêtes à part**, partagées comme les autres, avec en plus leur « sac » : ce qui se voit de leur état et qu'un suiveur ne peut pas deviner. Chez le suiveur, chacune a sa marionnette.
- **La Tisseuse de fer** vise le joueur le plus proche, d'ici ou d'en face : mortier, fusil (le laser suit sa cible chez tous), toile ; se cabrer frappe tous ceux qui sont dessous. Chez les suiveurs, ses huit pattes cherchent le sol d'elles-mêmes et chacun peut se faire écraser par les pieds qu'il voit. Son réveil, ses salves, sa vapeur, sa chute se voient et s'entendent partout. **Abattue, elle l'est pour tous** : chacun de ceux qui sont sur l'île et ne l'avaient pas encore vaincue reçoit sa part (24 ferraille, 12 éclats, 10 pierres), et l'arche apparaît chez tous. Qui l'a déjà vaincue la voit quand même (si le gardien ne l'a pas vaincue), mais garde son arche.
- **Le dragon à plumes** : il menace celui qui approche de son aire, chasse et crache sur le plus proche ; ses boules de feu partent chez tous et brûlent chacun chez lui. Son vol, son battement, son grondement, sa gorge qui rougeoit se voient chez tous. La viande tendue par un suiveur le nourrit chez le gardien.
- **Le Silencieux** entend **tous** les joueurs (chacun dit son bruit dans ses positions) : il hurle, charge le plus bruyant, et sa prise est encaissée chez celui qu'il saisit (le coup qui laisse à peine debout, le recul, la secousse). **Le Mille-gueules** sent les pas de tous sur la terre meuble : la terre se fend sous celui qu'il vise, il jaillit, frappe tous ceux qui sont là ; sa tête et ses quinze anneaux sont aux mêmes places chez tous. Les offrandes d'un suiveur comptent chez le gardien.
- **Les plantes** : cueillie par un joueur, une plante rare ou légendaire l'est pour tous, et repousse au même moment (le nouveau venu l'apprend en arrivant). L'épique attaque le plus proche, crache son venin chez tous ; abattue, son butin va à qui l'a abattue.
- **Le village** : les villageois sont aux mêmes places, font les mêmes métiers, rentrent dormir ensemble ; celui à qui parle un joueur d'en face s'arrête et le regarde.
- **Les nomades du Seuil** : la caravane est celle du gardien, qui la fait venir près de l'un des joueurs ; tous la voient, leur parlent et troquent (l'amitié, les savoirs, la rancune restent à chacun : celui qui les frappe est celui dont ils se souviendront).
- **L'escouade** vient pour l'île (près de l'un des joueurs, au hasard) et vise le plus proche ; tous voient le portail s'ouvrir, les automates sortir et sauter d'un portail à l'autre.
- **Le vesseron farceur** se cache du joueur le plus proche, lui lance ses boules ; son rire, ses spores, sa couleur de chapeau sont les mêmes chez tous.
- **L'oglodon** se souvient de chaque joueur : la confiance de sa colonie envers un suiveur compte chez le gardien.

**Le souterrain** : un gardien par étage. Les machines sont les mêmes chez tous ceux de l'étage (mêmes numéros), visent le plus proche ; une machine abattue l'est pour tous. La salle du gardien se referme dès que quelqu'un y entre ; les plaques claquent sous les pas de chacun (chacun encaisse les fléchettes qu'il voit) ; la vapeur bat à l'horloge du monde, la même vague pour tous. Les coffres restent à chacun : ce qu'on trouve en bas est à soi.

**Les gestes sur le monde** (`fgeste`) : le Souffle repousse les bêtes chez le gardien ; l'Appel refusé fâche la bête chez lui ; puiser à la fourmilière la vide pour tous (et sa colonie charge) ; une baie ou un poisson tendu nourrit la bête chez lui ; parler à un villageois ou à un nomade l'arrête. Le nectar de la fourmilière est le même pour tous. Un rodéo : la bête se voit sous son cavalier ; s'il tombe, elle retourne à la faune du gardien.

**Ce que fait l'autre se voit** : sa canne, son bouchon, sa ligne, et les ombres des poissons qu'il fait nager près de lui ; sa marmite posée ; la flèche qu'il décoche, en vol (elle ne blesse rien chez les autres : c'est chez lui que le coup compte) ; l'éclat de ses sorts ; la dalle de l'Ancrage, sur laquelle on peut monter.

**L'onglet Bêta** › Mesures : la ligne s'appelle **Île partagée** (« vous faites vivre l'île · suivi par Bob · 104 bêtes », sous terre « l'étage »). Coupée, on retrouve ses propres bêtes, son ciel, ses nomades. Faire venir des nomades ou une escouade depuis l'onglet, chez un suiveur, le demande au gardien.

**Ce que ça coûte (mesuré, à deux, contre le faux serveur Realtime)** : **pas un message de plus**. Le ciel, le monde (fourmilière, caravane, escouade) et les sacs des bêtes à part voyagent dans les positions que le gardien envoyait déjà ; les ombres des poissons nagent seules chez l'autre vers leur but, sans presser l'envoi. Les rares événements (une flèche, un sort, une cueillette, une offrande) ne comptent pas.

| | Île partagée coupée | Île partagée |
|---|---|---|
| Tous deux immobiles | 2,5 msg/s (avant : 2,7) | 7,5 msg/s (avant : 7,3) |
| Tous deux en mouvement | 12,5 msg/s | 13 à 14,5 msg/s |
| Taille d'une position | 0,3 à 0,55 Ko (avec les ombres des poissons, au bord de l'eau) | 1,4 à 2,2 Ko en moyenne, 2,9 Ko au plus |

Les données grossissent un peu (une trentaine de Mo par heure à deux, au lieu d'une quinzaine) : le quota gratuit de 5 Go suffit pour environ 150 à 180 heures de jeu à deux par mois. Le quota de messages, lui, ne bouge pas (voir section 57).

**Testé** avec deux navigateurs, sur une île de niveau 10 qui a tout (ossuaire, terres creuses, sylve, village, dragon, Tisseuse) : les 33 bêtes à part sont les mêmes chez les deux, aux mêmes places (écart médian 0 à 0,2 case), dans le même état. Alice fait venir l'orage : Bob le voit venir, et l'éclair. Alice pose son campement : Bob le voit ; elle le reprend : il disparaît. Bob cueille une plante rare : chez Alice aussi, avec la même repousse. Bob s'approche : la plante épique s'arme et le mord, la Tisseuse s'éveille, le vise au laser et lui envoie son mortier, le Silencieux l'entend courir, hurle et le charge, le Mille-gueules jaillit sous lui, le dragon le prend en chasse et crache (Bob voit neuf boules de feu). Bob parle à un villageois, à une nomade : ils s'arrêtent chez Alice. Alice fait venir une caravane, puis une escouade : Bob les voit, avec les mêmes gens et les mêmes automates. Sous terre, à l'étage 2 : mêmes machines, une tourelle vise Bob (onze tirs), les portes de la salle du gardien se ferment chez les deux, la vapeur bat ensemble. Bob pêche : Alice voit sa canne, son bouchon et ses ombres ; sa marmite, sa flèche, son rodéo (puis le coursier rendu à l'île). Seul sur son île, à trois, les amis, la faune de départ, le Korlaz : rien n'a bougé. Au passage, un vieux défaut corrigé : la Tisseuse qui avait tiré au mortier ne disait plus « elle chancelle » en mourant, et sa part pouvait tarder.


## 59. Des avis plus discrets, et un journal

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-25`).

Les cartes d'avis encombraient l'écran (deux à la fois, une à chaque coup de hache) et passaient par-dessus le menu. Les avis sont maintenant de trois sortes :

- **Les événements** — une escouade arrive, la Tisseuse s'éveille, quelqu'un arrive sur l'île, une caravane, une demande d'ami, une compagne qui tombe, un pillage, un biome découvert, une prise de pêche… — gardent leur carte, **là où elle était**, sous les jauges, mais **une seule à la fois**. Elle ne passe plus jamais devant le menu : s'il est ouvert, l'événement attend qu'on le referme (et s'affiche alors s'il a moins de douze secondes).
- **Les ressources gagnées** (« +2 bois », « +1 éclat · +2 ferraille ») ne font plus de carte : un **« +2 » et son icône montent au-dessus du personnage** et s'effacent en une seconde. Deux coups rapprochés sur le même arbre n'en font qu'un, qui grossit ; plusieurs ressources d'un coup s'empilent sans se recouvrir. En première personne, ils montent au milieu de l'écran.
- **Les petits retours** (« pas assez de mana », « trop tôt », « confiance 40 % », « traqueur · 60 % »…) : **une ligne fine en bas, au centre**, au-dessus des boutons sur téléphone, qui s'efface vite. Menu ouvert, elle se pose tout en bas du menu (« matières manquantes » se lit là où l'on fabrique).

**Le journal.** Une **cloche**, en bas à gauche de la carte des jauges — ou la touche **J**. La cloche et la goutte qui replie la carte (au milieu) sont deux **languettes de la carte elle-même** : une demi-lune qui sort de son bord bas, du même fond et du même liseré, sans trait entre les deux. Son chiffre rouge : les événements pas encore lus. Elle ouvre le **journal** : les événements et les ressources récoltées, du plus récent au plus ancien, avec l'heure, et trois filtres — **Tout**, **Événements**, **Ressources**. Les récoltes se regroupent par ressource sur une minute (« +12 bois » plutôt que six lignes). Les lignes nouvelles depuis la dernière ouverture sont surlignées. Le journal garde les 150 dernières lignes et survit au passage d'une île à l'autre (il vit avec l'onglet du navigateur). Il se ferme par ✕, J, Échap, un appui ailleurs, ou en ouvrant le sac.

**Pour qui code** : `say(texte, durée)` décide seul de la sorte (les mots d'un événement sont dans `AVIS_EVT` ; un texte qui commence par « +2 … » est un gain ; quatre secondes et plus, c'est un événement ; le reste est un petit retour). On peut la forcer : `say(texte, durée, 'evt' | 'res' | 'info')`.

## 60. Le temps qu'il fait, en icône

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-26`).

Dans la carte des jauges, devant l'heure, une **petite icône en pixels qui vit avec le ciel** :
- **le soleil** le jour, ses rayons qui tournent doucement ; **orangé et bas** à l'aube et au soir ;
- **la lune** en croissant la nuit, et des **étoiles** qui scintillent par ciel clair ;
- **les nuages** viennent avec la couverture : un voile clair, puis un nuage qui cache l'astre, gris sous la pluie, **noir à l'orage** (un second nuage derrière) ; ils dérivent plus vite quand il vente ;
- **la pluie** tombe sous le nuage, en biais quand le vent forcit ; **la neige** à sa place quand on est en altitude ou sur la neige (la même règle que les gouttes autour du personnage) ;
- **l'éclair** claque dans l'icône au même instant que dans le ciel de l'île.

Tout suit le fondu d'un temps à l'autre, et c'est le même ciel pour tous les joueurs de l'île (section 58). L'icône est redessinée dix fois par seconde, à part du texte de la carte : elle ne coûte rien à la mise en page. Sous terre, elle laisse la place à l'étage du Centre des automates.

## 61. Les compagnes, d'un coup d'œil

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-27`).

Une **troisième languette** sur le bord bas de la carte des jauges, **à droite** : une empreinte de patte (ou la touche **K**). Les trois languettes ont la même forme — la cloche du journal à gauche, la goutte qui replie la carte au milieu, l'empreinte à droite. Un **« ! » rouge** s'y allume quand une compagne dehors passe sous 30 % de vie.

Elle ouvre, sous la carte, le **volet des compagnes** : « Compagnes · 3/6 en jeu », et pour chacune —

- son **portrait**, son **nom** et son espèce ;
- sa **vie** : une jauge et le pourcentage, qui bougent en direct (rouge vif sous 30 %, « K.O. » si elle est à terre) ;
- **où elle en est** : dehors, dans le sac, au campement ou assommée, avec sa mission et son comportement en clair (« dehors · récolte (bois) · autonome ») ;
- un bouton **Sortir**, **Rentrer** ou **Relever** (un baume de relève ; grisé s'il n'y en a pas) ;
- deux rangées de **boutons dessinés**, l'ordre en cours surligné d'or :
  - la **mission** : le panier de pousses (récolte, dans son aptitude) ou le bouclier (défense) ;
  - le **comportement** : le sentier qui tourne (autonome, à sa guise), le personnage et sa patte (avec vous), la tente et son feu (au campement — grisé tant qu'il n'y a pas de campement posé).

En tête du volet, **Rappeler** donne le coup de sifflet (si le sifflet est porté et qu'une compagne est dehors). Un appui sur un bouton change l'ordre tout de suite, comme dans l'onglet Compagnes du sac — c'est le même code (`changerOrdre`, `changerRole`, `sortirCompagne`, `rentrerCompagne`, `releverCompagne`). Le volet se ferme par ✕, K, Échap, un appui ailleurs ; il ne s'ouvre jamais en même temps que le journal ni que le sac. La liste ne se redessine que lorsqu'une compagne sort, rentre, tombe ou change d'ordre ; les jauges, elles, se mettent à jour quatre fois par seconde.

Trois nouvelles icônes en pixels pour les comportements : `mode_autonome`, `mode_joueur`, `mode_camp`.

## 62. Toujours en 3D, plus près du personnage

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-28`).

- **Plus de boutons de caméra** en haut à droite (3D, ▽ △ pour incliner, ⟲ ⟳ pour pivoter). La vue est **toujours en 3D** (perspective). On tourne toujours la caméra en glissant sur l'écran, on zoome en pinçant à deux doigts (ou molette, + et −), et au clavier Q/E pivotent, R/F inclinent. Le bouton en haut à gauche passe de la 3D à la 1re personne (« 1re P. ») et revient (« 3D ») ; V fait de même. Sans carte graphique, le jeu retombe sur l'isométrie dessinée, comme avant.
- **L'œil est bien plus près** : six cases du personnage au lieu de quatorze. Le zoom l'approche jusqu'à trois cases ou le recule jusqu'à vingt. Sur téléphone en portrait, le champ de vision est resserré (il dépassait cent degrés, le personnage n'y était qu'un point) : le personnage y paraît environ deux fois et demie plus grand qu'avant.
- **Une falaise derrière le personnage** ne colle plus la caméra à son dos : l'œil **monte** juste ce qu'il faut pour passer par-dessus, vite, et redescend doucement quand la voie se dégage.
- Sur téléphone, la **boussole remonte** à côté du bouton de vue (la place des boutons de caméra), et la carte des jauges et la fiche de la cible remontent d'autant.
- **Les boutons d'action** (Action, Attaquer, Saut) sont **collés au bord droit**, alignés sur les cases. **Les cinq cases** descendent un peu (40 px sous le milieu de l'écran), sans jamais toucher les boutons d'action. Sur un écran bas (téléphone en paysage), les cases restent au milieu du bord et les boutons d'action se rangent à leur gauche, comme avant.
- L'aide (Réglages) et la ligne des touches suivent : le zoom, J (journal), K (compagnes).

## 63. Bêta · Se téléporter : les biomes rares, enfin

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-29`).

**Le défaut** : dans l'onglet Bêta, « Se téléporter » menait presque toujours sur une île aux biomes de base. Deux raisons :
- les biomes rares ne dépendent que de la **graine**, et seule une graine « signée » sur seize peut en porter. Le bouton **Au hasard** tirait n'importe quel nombre : une île sur vingt seulement (5 %) avait un biome rare, quel que soit le niveau tapé ;
- le champ **Graine** est prérempli avec l'île où l'on est : « Y aller » sans changer la graine ramène sur la même île, seulement à un autre niveau.

**La correction** :
- **Au hasard** tire maintenant comme le portail : une île permise au niveau tapé. Au niveau 0, c'est un départ, sans biome rare (voulu). Au niveau 3, deux îles sur trois ont un biome rare ; dès le niveau 8, trois sur quatre.
- Sous les champs, une ligne dit **ce que porte la graine** au niveau tapé : ses biomes rares, la Terre des automates, le Korlaz, ou « les biomes de base seulement », et le niveau à partir duquel le portail la donnerait. Elle se met à jour pendant qu'on tape.
- **Viser un biome** : un bouton par biome (Tourbière, Canyon d'ocre, Sylve fongique, Champs de cristal, Caldeira de cendre, Ossuaire, Terres creuses, Village, Terre des automates, Korlaz). Un appui cherche une graine qui le porte, remplit la graine et le niveau (au moins celui que le biome demande), et l'on n'a plus qu'à appuyer sur **Y aller**.
- Au passage : le bouton **Y aller** (et les autres boutons principaux des lignes du sac) était doré sur fond sombre, avec un texte sombre : presque illisible. Il est de nouveau doré et lisible.

Testé : une graine visée « Sylve fongique », on y va, l'île a bien sa sylve (3 700 cases) et sa tourbière ; les visées Caldeira, Terres creuses, Village, Terre des automates et Korlaz trouvent chacune leur graine.


## 64. Les plats sont des objets : une vignette, une place au sac, une case du bord droit

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-30`).

**Tout plat va au sac.** Un plat « chaud » (grillade, brochette, compote, infusion, poêlée, rôti, salade, plat du voyageur…) n'est plus perdu si on ne le mange pas au feu : il fait **une part** et **se garde dix minutes** de jeu (`GARDE_CHAUD`). Les plats à plusieurs parts gardent leurs vingt minutes, ceux de longue conservation tiennent toujours. Le livre de recettes dit « se garde 10 min » au lieu de « se mange chaud ». Donner un plat à une compagne se fait toujours avec G, près d'elle. *Pour revenir à la règle d'avant (§ 28) : `PLATS_AU_SAC = false` dans `index.html` — le « servi chaud » et ses boutons sont restés dans le code.*

**Une vignette par plat** (`icPlat`, `dessinPlat`) : onze formes — le **bol** fumant (ragoût, soupe, plat du voyageur, soupe de lune, bouillon de braise), la **broche** (grillade, brochette, terre et mer), la **tourte**, le **pot** (confiture, compote, caramel, gelée-lanterne), le **flacon** (sirop), la **tasse** (infusion), le **pain** (pain, galette), la **poêle** (poêlée, rôti), la **salade**, le **festin** (Festin des Horlogers), la **fiole** (sérum) — à la **couleur de l'ingrédient principal**, avec un petit **losange à la couleur de l'effet** en haut à gauche (rouge : coups puissants, pâle : invisible, vert d'eau : antidote… `EFFET_COUL`). Les vignettes naissent à la demande et s'ajoutent à la feuille des icônes (`poserIcone`). On les voit dans le sac, sur la barre, dans la liste « Au sac » de la Cuisine et dans le livre de recettes.

**Au sac** (onglet Sac, colonne de droite, sous les Objets) : la rangée **Plats**. Une case par **pile** — les plats de même recette, même effet et même niveau s'empilent (`plat:<recette>~<effet>~<niveau>`) —, avec le nombre de parts ; dessous, l'effet (« invisible II »), ou le nom du plat s'il n'en a pas. Toucher une pile ouvre sa **fiche** : nom, étoiles, ce que vaut une part, ce qu'il reste et combien de temps, **Manger** (ou Injecter), et **Case : 1 2 3 4 5**, comme pour un équipement.

**Dans une case du bord droit** (touches 1 à 5) : la vignette du plat et son nombre de parts. Un appui **mange une part**, celle qui est la plus près de se gâter. La pile vide, **la case garde le plat**, grisé à 0 : elle le retrouve dès qu'on le recuisine ; un appui dit « plus de… · à cuisiner de nouveau ». On l'enlève d'une case depuis sa fiche (toucher la case dans « Cases du bord droit »). Les cases de plats sont gardées dans la sauvegarde.

Testé : cinq plats cuisinés, dont un chaud (au sac, 10 min) et deux ragoûts identiques (une pile de 6 parts) ; rangés en cases 2 et 3 depuis leur fiche ; la case 2 mange une part (6 → 5, la vie remonte) ; la case 3 applique l'effet du plat puissant ; pile finie, la case reste, grisée, puis se regarnit en recuisinant ; les cases reviennent après rechargement ; un plat qui se gâte laisse sa case. Vérifié à l'écran sur ordinateur et à la taille d'un téléphone.

Pour régler : `PLATS_AU_SAC`, `GARDE_CHAUD`, `PLAT_FORME` (la forme de chaque recette), `EFFET_COUL`, `dessinPlat`, `fichePlat`, `grillePlats`.


## 65. Le campement s'améliore sans fin, garde son niveau, et son portail donne le choix

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-32`).

**Le défaut** : le niveau était écrit sur le campement posé (`P.camp.niv`). Le reprendre le remettait au niveau 1. Il tient maintenant au personnage (`P.campNiv`) : repris, au sac, replanté ailleurs, il le garde. Une sauvegarde d'avant reprend le niveau du campement posé ; un niveau déjà perdu ne se retrouve pas seul : **Bêta → Le campement** (−1, +1, +5) le rétablit, et ce réglage est gardé (hors du mode essai).

**Sans limite** (`coutCamp`, `COUT_CAMP`) : chaque niveau coûte **60 % de plus** que le précédent. Niveau 2 : 24 éclats, 30 pierres. Niveau 3 : 38 éclats, 48 pierres, 8 os (l'os entre au niveau 3, le bois au niveau 5). Niveau 5 : 98 éclats. Niveau 10 : 1 031. Niveau 15 : 10 809. Niveau 20 : 113 337. Le sac ne tient pas plus d'un million par matière : chaque prix s'arrête à 900 000 (vers le niveau 25), pour que rien ne ferme.

**L'allure, par paliers** (`campOs(ennemi, autre, niv)`, `palierCamp`) — ce qui luit se voit la nuit, et le feu éclaire 8 % plus loin par palier :

| Niveau | Nom | Ce qui change |
|---|---|---|
| 2 | Campement gravé | runes sur les piliers du portail, clef de voûte qui luit, lanterne au mât, deux pierres du feu gravées |
| 3 | Campement d'éclat | le voile du portail devient une nappe vive, cristaux au pied de l'arche et sur le plancher, le portail éclaire |
| 5 | Camp fortifié | socle de pierre, tente plus haute et galonnée, second mât et son fanion, tonneau, seuil devant l'arche |
| 8 | Bastion d'éclat | quatre bornes d'éclat (deux obélisques côté portail), parapet crénelé avec sa porte, feu plus grand au cœur d'éclat |
| 12 | Sanctuaire du portail | anneau de lumière qui tourne au-dessus du camp, arche double avec cœur d'éclat et flèche |
| 20 | Citadelle du portail | trois cristaux en orbite, trait de lumière au-dessus de l'arche ; puis un cristal de plus tous les dix niveaux (huit au plus, niveau 70) |

Les autres joueurs voient le vrai niveau (le message de position porte le niveau en 5e case de `cp`), sans le portail, comme avant.

**Le journal** : 1 graine en mémoire, puis 3, puis 6, puis une de plus par niveau, jusqu'à 12 (niveau 9).

**Le portail du campement propose** (`propositions`, `corpsPortail`, `partirPropose`) — onglet Campement → Partir, dès le niveau 2. Les arches des îles, elles, tirent toujours au hasard.
- **Le nombre d'îles** : autant que le niveau, de 2 à 8.
- **Ce qu'il en dit** (`detailPortail`, `DETAIL_NIV`, `apercuIle`) : d'abord flou, puis de plus en plus net. Niveau 2 : une **note de danger** seule, de « paisible » à « mortelle » — elle tient déjà compte de tout (prédateurs, automates tireurs, terreurs, état de l'île) sans rien nommer. Niveau 3 : les **biomes rares**. Niveau 5 : le **bestiaire** (les bêtes à craindre en rouge, et leur compte). Niveau 7 : l'**état de l'île** (Korlaz, ou « sain » ; `ETATS_NOMS` pour les états à venir). Ce que le portail ne lit pas encore s'affiche flouté, avec le niveau de campement qui le découvre. Aux explorations 10, 15, 20…, il rappelle la Tisseuse de fer.
- **Relancer** : une relance par départ au niveau 9, puis une de plus à chaque niveau.
- **Chercher un biome** : dès le niveau 10, on choisit un biome permis à l'exploration visée (Tourbière… Village, Terre des automates, Korlaz) ; la première île le porte, puis une de plus tous les trois niveaux (les huit au niveau 31).
- Les îles proposées obéissent aux règles du portail (île signée, permise au niveau, gardée s'il le faut). Elles se tirent de l'île, de l'exploration et d'un compteur (`P.portailT`) : fermer le sac ou recharger la page ne les change pas ; elles changent quand on part ou qu'on relance.
- Chaque île a son bouton **Partir**, à confirmer d'un second appui. Une île choisie n'est jamais détournée vers un pillage ; le groupe d'expédition est prévenu comme avant.

**Côté base** (fait le 6 octobre 2026, migration `vp_campement_niveau_sans_borne`) : la table `vp_campements` et la fonction `vp_camp_publier` bornaient le niveau publié à 3 ; elles le bornent maintenant à 999, comme le jeu. Qui pille un campement le voit à son vrai niveau.

Testé : campement amélioré jusqu'au niveau 3 (matières débitées au bon prix, refus sans matières), repris puis reposé (niveau 3 gardé), sauvegarde relue, ancienne sauvegarde migrée ; propositions valides et stables aux niveaux 1 à 14, relance et vœu de chaque biome (moins de 5 ms) ; départ vers une île choisie (arrivée sur la bonne graine, exploration +1, campement et niveau gardés) puis retour ; vues de jour et de nuit à chaque palier ; panneau sur téléphone ; aperçu d'une île à Korlaz aux quatre degrés de précision (la note ne change pas d'un degré à l'autre).

Pour régler : `CAMP_PALIERS`, `CAMP_NOMS`, `COUT_CAMP`, `memoireCamp`, `choixPortail`, `detailPortail`, `relancesPortail`, `voeuxPortail`, `cristauxCamp`, `apercuIle`.


## 66. La ceinture : elle ouvre les cases du bord droit, une barre par niveau

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-33`).

**Sans ceinture, pas de barre.** Les cases du bord droit n'apparaissent plus tant qu'on n'a pas fabriqué la **Ceinture** (établi, filtre Outils ou Tout). Ce qu'on fabrique reste porté aussitôt, comme avant ; il n'est simplement plus rangé dans une case. La canne, la marmite et les plats s'utilisent toujours depuis leur fiche du sac.

**Trois niveaux, une barre de cinq cases chacun** (`CEINTURE_COUT`, `nivCeinture`, `barres`) :

| Niveau | Barres | Coût |
|---|---|---|
| 1 | 1 | 4 os, 20 fibres |
| 2 | 2 | 20 ferraille, 10 os, 30 fibres |
| 3 | 3 | 12 matières inconnues, 40 ferraille, 20 os |

La **matière inconnue** est celle d'un biome qui n'existe pas encore (`RES_AVENIR`) : le niveau 3 s'affiche à l'établi, avec sa vignette et « 0 / 12 », mais ne peut pas se fabriquer — sauf en mode essai, pour voir les trois barres. Quand le biome existera : ajouter la matière à `RES`, et remplacer `inconnue` dans `CEINTURE_COUT`.

**Changer de barre** : à partir de deux barres, un bouton au-dessus des cases (un point par barre, celui de la barre affichée allumé), ou la touche **T**. Les touches 1 à 5 et les boutons du bord jouent la barre affichée.

**Au sac** : la ceinture est un objet (son niveau en chiffre sur sa case), ni portée ni rangée. « Cases du bord droit » montre une rangée par barre ouverte ; la fiche d'un objet ou d'un plat propose une ligne de boutons 1 à 5 par barre. Un objet ne tient toujours que dans une seule case, toutes barres confondues.

**À la fabrication du niveau 1**, ce qu'on possédait déjà prend place dans les cases (sorts d'abord), si elles sont vides.

**Les parties d'avant** : pas de ceinture, donc plus de barre tant qu'elle n'est pas fabriquée. Les cinq cases déjà garnies sont gardées et reparaissent telles quelles avec la ceinture. « Tout fabriquer » (Bêta, essai) donne la ceinture au niveau 3.

`P.raccourcis` tient maintenant quinze cases bout à bout (barre × 5 + case) ; `P.ceinture` est le niveau, `P.barre` la barre affichée, tous deux sauvegardés.

Testé : sans ceinture, rien au bord et les touches 1 à 5 le disent ; niveau 1 (4 os et 20 fibres débités, quatre objets rangés d'eux-mêmes) ; niveau 2 refusé sans ferraille, puis fait (le bouton paraît) ; passage d'une barre à l'autre par le bouton et par T, objet rangé en barre 2 puis utilisé ; niveau 3 impossible avec 500 de chaque matière, possible en essai puis rendu en le coupant ; sauvegarde relue ; ancienne sauvegarde (cinq cases, pas de ceinture) : cases gardées, de retour à la fabrication ; plats en raccourci inchangés ; ordinateur et téléphone.

Pour régler : `CEINTURE_COUT`, `CEINTURE_MAX`, `RES_AVENIR`, `barreSuivante`, `majCases` (le bouton `.bascule`).


## 67. Korlaz : les spores se récoltent, et l'infecté entend faux

**À déposer** : `index.html`, `etats.js` et `sw.js` (qui passe en `stone-valley-34`).

**Une matière nouvelle : la spore de Korlaz** (`RES.spore`, `etatsSpores` dans `etats.js`). Sur une île à Korlaz, chaque coup de récolte porté à un pied **infecté** — qui pousse sur la roche rongée, ou contre elle — rapporte des spores en plus de sa matière : **une** par coup, **deux** sur ce que le Korlaz fait pousser lui-même (excroissance, mycélium pâle). Infecté ou non ; mais tant qu'on est sain, chaque coup expose, comme avant. L'avis le dit (« +1 pierre · +2 spores de Korlaz »). Les compagnes n'en rapportent pas.

C'est une matière comme les autres : au sac (elle n'y paraît que lorsqu'on en a), au coffre du campement, dans la sauvegarde, perdue ou gardée avec le reste du sac. **Elle ne sert encore à rien** : aucune recette ne la demande. Côté base, le coffre publié pour les pillages ne connaît pas cette matière (`vp_coffre_propre` la laisse de côté) : les spores du coffre ne peuvent donc pas être pillées.

Au passage : « il manque 8 undefined » pour la lampe d'ambre devient « il manque 8 nectar » (le pluriel du nectar manquait).

**La musique de l'infecté** (`HUMEURS.korlaz`, `korlazDanger`, le timbre `fele`, `MUS.nappe`) : tant qu'on est infecté, la musique du jeu devient dissonante, quels que soient l'heure et le lieu.
- **Les phrases** : une gamme de secondes mineures et de tritons, jouée par une « boîte à musique fêlée » — chaque note un peu fausse, doublée un quart de ton à côté, et qui fléchit ; des fausses notes s'ajoutent en retard ; le rythme boite.
- **La nappe** : par-dessous, en continu, cinq voix qui frottent (seconde mineure, triton) et dérivent lentement. Elle se tait en quelques secondes une fois guéri.
- **Elle empire** : à mesure que l'infection dure (quinze minutes pour le plein effet), la nappe enfle, les silences raccourcissent, les fausses notes se multiplient.
- **Elle ment** : une silhouette qui surgit déclenche la musique du danger, comme un vrai prédateur — fausse, elle aussi.
- Elle passe par le réglage **Musique** du son, comme le reste.

Testé : sur une île à Korlaz, une excroissance rend 2 spores par coup, un pied voisin de la roche rongée 1, un pied sain 0 ; sac, sauvegarde relue. Musique : dans le navigateur, l'humeur passe à « korlaz » à l'infection, à « korlazDanger » quand une silhouette surgit, revient au jour après le sérum, et la nappe retombe ; en rendu hors ligne, le niveau reste celui de la musique habituelle (ni saturation, ni saut de volume). La dissonance elle-même n'a pas été jugée à l'oreille : à écouter en jeu.

Pour régler : `etatsSpores` (le nombre par coup), `HUMEURS.korlaz` (`deg` la gamme, `acc` l'accord tenu, `repos` les silences), la part de fausses notes dans `MUS.maj`, le volume de la nappe (`.012 + .014 × I`).


## 68. Le nectar d'oglodon est un ingrédient ; le sérum du Korlaz retrouve une recette possible

**À déposer** : `index.html`, `etats.js` et `sw.js` (qui passe en `stone-valley-35`).

**Le nectar n'est plus une matière.** Il quitte `RES`, le sac des matières et le coffre : c'est une denrée comme les autres (`INGR.nectar`, `src: 'denree'`), au **garde-manger** du sac et au **cellier** du campement. Il suit donc les règles des ingrédients (retour d'expédition, « Tout déposer », cuisine qui puise au cellier près du feu).
- **Au sac** : il n'est plus dans « Matières » ; il est dans « Garde-manger », avec sa goutte d'ambre. Un appui le **boit** (+35 % de vie, tout le souffle), comme la touche N ; le bouton « Boire du nectar » à part a disparu.
- **D'où il vient, inchangé** : la fourmilière (PUISER), les compagnes oglodons (au garde-manger, ou au cellier si elles tiennent le campement), le troc de la marchande.
- **La lampe d'ambre** en demande toujours 8 : l'établi le lit au garde-manger (et au cellier près du campement).
- **Les parties d'avant** : le nectar du sac passe au garde-manger, celui du coffre au cellier, au premier chargement.
- N'étant plus au coffre, il ne peut plus être pillé.

**Le sérum de clairvoyance était devenu impossible.** Sa recette demandait la **mousse céleste**, qui ne pousse plus : depuis que les nuages ne portent que des druses (`calcFlore` l'écarte), on n'en trouvait plus sur aucune île. Vérifié sur cinq îles : zéro pied. Les trois autres ingrédients existent toujours (mycélium pâle sur la roche rongée, arbre à sève dans les bois, nectar à la fourmilière).
- **Nouvelle recette** : mycélium pâle, **fleur d'edelweiss**, nectar d'oglodon, goutte de sève. L'edelweiss pousse sur toutes les îles, en altitude, et a la même rareté que la mousse.
- L'indice du carnet suit : « ce qui pousse sur la roche rongée, la fleur des cimes, le nectar des oglodons, une goutte de sève ».

**Trouvé au passage** (corrigé en §69) : les douze plantes rares du biome **nuage** de `flore.js` (étoile des nues, clochettes célestes, lys céleste…) ne poussent jamais non plus. Elles se posent sur des cases de sol du biome 17, or le nuage n'existe qu'en dalles volantes : aucune case de sol ne porte ce biome. Leurs ingrédients sont donc introuvables.

Testé : ancienne sauvegarde (7 nectars au sac, 5 au coffre) relue en 8 au garde-manger et 5 au cellier ; boire par N et par le garde-manger ; lampe d'ambre refusée à 6 nectars, faite à 9 (il en reste 1) ; une compagne oglodon rapporte 2 nectars pour 4 baies ; troc ; sérum cuisiné avec la nouvelle recette (le nectar quitte le garde-manger) et injecté : guéri ; l'ancienne recette ne donne plus qu'un plat du voyageur.


## 69. La flore de `flore.js` est toute rare ; les plantes des nuages poussent enfin

**À déposer** : `index.html`, `flore.js` et `sw.js` (qui passe en `stone-valley-36`).

**Un seul rang : rare.** Les douze plantes de chaque biome étaient classées six rares, quatre légendaires, deux épiques. Elles sont toutes **rares** ; les vraies légendaires et épiques restent à créer.
- **Le rang** (`rang: 'rare'` pour toutes) ne sert plus qu'à l'affichage : « plante rare » sur la cible, « rare · … » à la cueillette.
- **Leurs ingrédients** sont tous de rareté 3 (« rare »), au lieu de 3, 5 et 6.
- **Ce qui les distingue** s'appelle maintenant le **port** (`port`) et ne change rien à ce qu'on voyait : `simple` (les six petites), `geante` (les quatre grandes, qui bougent, se cueillent une fois par demi-heure), `vive` (les deux qui attaquent, à abattre avant de cueillir). Tailles, formes, comportements, fréquences et emplacements sont les mêmes qu'avant.
- Les trois espèces s'appellent « Plante rare », « Grande plante rare », « Plante rare vive ».

**Conséquences en cuisine** (voulues : ce sont des rares) : un plat fait avec ces ingrédients a la puissance d'une rare (niveau II). Les niveaux III et IV, la régénération, le soin complet et les effets de vingt minutes n'existent plus tant qu'il n'y a pas de légendaires ni d'épiques. **Le cœur en plus est gardé** : la règle « seulement aux très rares » l'aurait fait disparaître ; elle devient « aux rares et au-delà », et ce sont exactement les onze mêmes ingrédients qu'avant qui le portent.

**Les plantes des nuages.** Le biome nuage n'a pas de sol : il n'existe qu'en îles volantes, et `floreIle` ne posait ses plantes que sur du sol. Les douze plantes « des nues » ne poussaient donc jamais. Elles se posent maintenant **sur les dalles de nuage** (jamais sur une dalle conjurée), avec les mêmes parts que les autres biomes : deux à sept simples, parfois une géante (il lui faut une dalle de cinq cases de côté), parfois une vive. Elles sont tirées après toutes les autres : les plantes du sol ne bougent pas d'une case.

Testé : sur trois îles, les plantes du sol sont aux mêmes cases qu'avant, et trois plantes de nuage par île sont posées à la hauteur de leur dalle ; cueillette depuis la dalle (« rare · Étoile des nues · +1 pétale… ») ; tous les rangs « rare », tous les ingrédients de rareté 3 ; un plat de deux anciennes légendaire et épique sort au niveau II ; mêmes onze ingrédients à cœur.

## 70. Les états du joueur, en vignettes sous le souffle

**À déposer** : `index.html` et `sw.js` (`stone-valley-36`, le même dépôt que §69).

Sous la jauge de souffle, une rangée de petites vignettes dit dans quel état on est. Elle reste visible **carte du HUD repliée ou non**, et disparaît quand il n'y a rien à dire (`statutsJoueur`, `majStatuts`, les dessins `st_*`).

| Cerclé de rouge : les maux | Dessous |
|---|---|
| Infecté par le Korlaz | rien (seul le sérum en délivre) |
| Spores de Korlaz | le pourcentage d'exposition |
| Empoisonné, Brûlure | le temps qui reste |
| Braises (sur les plaques vives), Pris dans la toile, À bout de souffle, Boue (tourbière), Chaleur (canyon, de jour) | rien : tant qu'on y est |

| Cerclé d'or : les bienfaits | Dessous |
|---|---|
| Chacun des 21 effets de plat, à sa couleur | le temps qui reste, et son niveau (II, III, IV) en pastille |
| Régénération, Répit de l'arrivée | le temps qui reste |
| Vie en plus, Second souffle, Un cœur en plus, À l'abri (près du campement), Champs de cristal (sorts à moitié prix) | rien (la vie et le souffle en plus se lisent sur leur jauge : voir §71) |

- Le temps s'écrit `m:ss` ; sous dix secondes, la vignette clignote.
- **Un appui** sur une vignette (ou le survol, à la souris) dit son nom, ce qu'elle fait et le temps qui reste.
- La carte du HUD ne répète plus en toutes lettres les effets des plats, « empoisonné » ni « infecté · Korlaz » : les vignettes les remplacent.

Testé : aucune vignette quand tout va bien (la rangée n'existe pas) ; infecté, empoisonné, deux plats, un cœur et de la vie en plus : sept vignettes, les bons temps, le niveau II ; les trente états à la fois (la rangée passe à la ligne) ; carte dépliée sur ordinateur, dépliée et repliée sur téléphone ; l'appui annonce « Infecté par le Korlaz · … ».


## 71. La vie et le souffle en plus : une barre par-dessus la jauge

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-37`).

La vie en plus et le second souffle ne s'écrivent plus en pourcentage à côté des cœurs (« ♥3 +20% ≈30% » redevient « ♥3 »). Chacun est une **barre d'une autre couleur, posée par-dessus sa jauge** (`majBarrePlus`, l'élément `<u>` de la jauge) :
- **dorée sur le rouge de la vie**, pour la vie en plus ;
- **bleu clair sur l'or du souffle**, pour le second souffle.

Elle occupe la moitié haute de la jauge, pour qu'on lise toujours la jauge du dessous, et elle est à la même échelle : une jauge pleine vaut 100 %. La vie en plus va jusqu'à 80 % ; le second souffle peut dépasser le plein (jusqu'à 150 %) : la barre couvre alors toute la jauge et luit, puis raccourcit quand il repasse sous 100 %. Tant qu'il reste du second souffle, la jauge de souffle ne pâlit pas. À dos de monture, la jauge montre le souffle de la monture, sans la barre bleue.

Les deux vignettes d'état (cœur à croix, souffle « 2 ») restent, sans chiffre dessous.

Testé : sans bonus, aucune barre ; +20 % de vie et +30 % de souffle : deux barres aux bonnes largeurs ; +80 % de vie avec une vie à 25 % : le rouge se lit encore dessous ; +150 % de souffle : barre pleine qui luit ; un coup de 10 % avec 30 % de vie en plus : la barre dorée tombe à 12 %, la vie ne bouge pas.


## 72. La difficulté n'a plus de plafond

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-38`).

**Le danger monte sans fin.** Il s'arrêtait à l'exploration 8 (×2,44). Chaque exploration ajoute maintenant **18 %** à ce que les bêtes frappent et encaissent, comme avant la huitième, mais sans s'arrêter (`DANGER_PAS`, `danger()`).

| Exploration | Danger | Un coup qui valait 10 % de vie (sans armure) | Un coup de lame d'éclat (76) |
|---|---|---|---|
| 8 | ×2,44 | 29 % | 31 |
| 10 | ×2,80 | 34 % | 27 |
| 20 | ×4,60 | 55 % | 17 |
| 23 | ×5,14 | 62 % | 15 |
| 50 | ×10 | 120 % | 8 |
| 99 | ×18,8 | 226 % | 4 |

Jusqu'à l'exploration 8, rien ne change. Au-delà, c'est plus dur qu'hier : à l'exploration 23, les bêtes frappent et encaissent 2,1 fois plus. Tout ce qui passe par `degSubi` et `degJoueur` suit : bêtes, automates, Tisseuse, souterrain, plantes vives, visions du Korlaz.

**Le niveau lui-même n'est plus borné à 99** : la sauvegarde, le démarrage et la téléportation de la bêta acceptaient 99 au plus ; la borne est à 9 999 (`NIV_PLAFOND`, seulement contre une sauvegarde hostile).

**Ce qui reste plafonné, exprès** : le **nombre** des bêtes (il cesse de monter à l'exploration 8, celui des automates à la 20, pour ne pas ralentir le jeu), la visée des automates (exacte à la 20) et la chance des variantes (triple à la 20). Côté base, le niveau d'île d'un campement publié reste borné à 99 : au-delà, les pillages se cherchent comme à 99.

Testé : danger et dégâts aux explorations 0 à 150 ; une partie à l'exploration 150 se charge telle quelle (elle retombait à 99) ; téléportation à l'exploration 240 (danger ×44,20 au HUD) ; le nombre de traqueurs ne bouge pas entre les explorations 8 et 150.

Pour régler : `DANGER_PAS` (la pente). Pour une pente plus douce au-delà de la huitième, c'est `danger()` qu'il faut couper en deux.

## 73. Le sac rangé : tout le campement sous un seul onglet

Le sac avait onze onglets, dont quatre tournaient autour du camp (Campement, Cuisine, Exploration dans le Journal, Journal). Il en a **huit** : Sac, Établi, Compagnes, **Campement**, Amis, Sauvegarde, Réglages, Bêta (touches 1 à 8 ; sur téléphone, deux rangées de quatre).

L'onglet **Campement** porte une barre de **quatre volets** :

| Volet | Ce qu'on y trouve |
|---|---|
| **Camp** | Coffre, Se reposer, Améliorer, Reprendre le camp, Compagnes, Pillage |
| **Cuisine** | la marmite, le garde-manger, le cellier, le livre de recettes (l'ancien onglet, tel quel) |
| **Portail** | Partir (les îles proposées et leur aperçu), **Îles gardées**, Rentrer, Exploration (niveau, danger, essai) |
| **Journal** | l'île où l'on est, les expéditions, l'atlas des biomes, les carnets (pêche, faune, flore) |

- Chaque volet retient sa case et son défilement ; choisir une case change de volet tout seul (un raccourci vers « Îles gardées » ouvre le Portail).
- **Les îles gardées** ont quitté le Journal pour le Portail, là où l'on part. Le Journal n'en garde qu'une ligne (« n sur m ») et un bouton « Voir au Portail ». Une île gardée proposée au portail porte l'étiquette « gardée ».
- **Les joueurs en ligne** ont quitté le Journal pour l'onglet **Amis**, sous la liste d'amis.
- Les anciens chemins mènent au bon volet : « Cuisiner » au feu, la marmite, le portail du campement (volet Portail), ACTION sur la tente (volet Camp), les notes du sac.
- Sans campement posé, les volets Camp et Portail disent quoi faire ; Cuisine et Journal restent consultables.

Rien ne change dans la sauvegarde ni dans les règles : c'est du rangement. Les sections plus haut qui disent « onglet Cuisine » ou « onglet Journal » parlent désormais de ces volets.

Testé sur ordinateur et sur téléphone : les huit onglets et leurs touches, les quatre volets, la case retenue par volet, « Garder » puis « Voir au Portail », cuisiner dans le volet, départ vers une île choisie depuis le portail du campement, « En ligne » dans Amis ; sans régression sur le nectar, les spores, la ceinture, les plats.

Dans le code : `VOLETS_CAMP`, `CASES_VOLET` (quelle case dans quel volet), `voletCamp`, `ongletDe` (redirige les anciens onglets), `pageCampement` (la barre) et `voletCases` (les cases).

## 74. Le camp de base, et la place des modules

Le campement devient un **camp de base** qu'on agrandit de **modules**. Cette version pose le socle : le dessin du camp de base, l'espace autour, et la règle « ce qui n'est pas créé n'existe pas ». La création des modules en jeu viendra module par module.

**Le camp de base** : une tente (la couchette) et un feu de camp. Il fait trois choses : on s'y repose, il lie l'île au personnage (pierre de foyer, retour quand les trois vies sont perdues), et il se reprend pour être posé ailleurs. Il n'a **ni portail ni coffre**.

**L'emprise** : un rond de sept cases de large (45 cases, un carré de 7 sans ses coins), en terre battue bordée de pierres, le feu au centre. Autour du feu, un anneau de dix places : l'entrée (trois cases ouvertes dans la bordure), la tente, et **huit emplacements** marqués de quatre piquets et d'une corde. Chaque module a sa place attitrée, tournée vers le feu :

| Place sur l'anneau (depuis l'entrée) | Module | État |
|---|---|---|
| 36° | Établi | à venir |
| 72° | la tente | camp de base |
| 108° | Défense | à venir |
| 144° | **Portail** | dessin et règles prêts, pas encore créable en jeu |
| 180° | Bibliothèque (la magie) | à venir |
| −144° | Table d'alchimie | à venir |
| −108° | Table de soin | à venir |
| −72° | Cuisine | à venir |
| −36° | **Coffre** | dessin et règles prêts, pas encore créable en jeu |

**Le terrassement.** Le campement nivelle lui-même son rond :
- pour le poser, il faut 45 cases de terre ferme (ni mer, ni eau douce, ni gouffre, ni dalle, ni village, ni plante rare, loin de l'arche et de la fourmilière) et pas plus de **deux cubes** d'écart avec la hauteur la plus commune du rond ;
- le rond est ramené à cette hauteur (le moins de terre à remuer), la flore s'en efface, et une marche d'un cube adoucit le pourtour, pour que bêtes et compagnes y montent ;
- rien n'est perdu : hauteurs et plantes d'origine sont gardées et rendues quand on reprend le campement (testé : zéro case d'écart) ;
- la règle vaut pour tous les campements de l'île (le sien, celui d'un autre joueur, celui qu'on pille) : le sol reste le même pour chacun ;
- **l'arche de l'île ne bouge pas** : elle garde l'ancienne règle de pose (`placeArche`), et la faune de départ est identique à la version d'avant (vérifié sur quatre graines) ;
- un campement posé avec l'ancienne règle (neuf cases) reste en place : son rond est nivelé là où le sol est ferme, et dépasse au-dessus de l'eau s'il y en avait à côté. Le reprendre et le reposer le remet d'aplomb.

**Sans portail au camp** (jusqu'à la création du module) : on voyage par l'arche de l'île, vers une île au hasard ; la pierre de foyer ramène toujours au camp ; les îles gardées se consultent mais on ne peut pas y repartir ; pas de choix d'île ni d'aperçu ; « Améliorer » disparaît (le niveau du campement est en fait celui du portail). Pour rejoindre un joueur en ligne, il suffit d'être devant un portail : celui du campement ou l'arche de l'île.

**Sans coffre au camp** : pas de dépôt ni de réserve commune (l'établi, la cuisine et les compagnes ne puisent que dans le sac) ; au retour d'expédition, la part gardée reste **au sac** au lieu d'aller au coffre ; les récolteuses laissées au camp rapportent au sac, et n'engrangent rien pendant l'absence ; il n'y a rien à piller (le campement publie un coffre vide).

**Rien n'est effacé** : le contenu du coffre et du cellier, le niveau du campement, les tirages du portail restent dans la sauvegarde. Ils reviendront avec leurs modules. `P.modules` (`{ id: niveau }`) est sauvegardé ; une ancienne sauvegarde n'a aucun module.

**Onglet Campement.** Volet Camp : Se reposer, **Modules** (le camp de base et les huit emplacements), Reprendre, Compagnes, Pillage — plus Coffre et Améliorer quand leur module existe. Volet Portail : Partir (par l'arche de l'île), Îles gardées, Rentrer, Exploration.

**Bêta** : « Modules du campement » crée ou retire le portail et le coffre, tels qu'ils étaient, pour les essayer à leur place en attendant leur création en jeu.

**Les décors de niveau** (§65) ont quitté le camp de base. Les runes, cristaux, seuil, arche double, anneau, cristaux en orbite et trait de lumière tiennent au **portail** (paliers 2, 3, 12, 20). Le parapet et les bornes du bastion attendent le module Défense (`rempartOs`, que rien n'appelle encore). Le socle, le plancher, les caisses, le grand mât, la lanterne, le tonneau n'existent plus.

**Réseau** : le message `cp` d'un joueur porte un sixième nombre (2 = il a un coffre), pour que son coffre se voie chez les autres ; un ancien client l'ignore. **Aucun changement dans Supabase.**

**Rendu** : en repli (canvas), les cases de terre battue se trient comme le sol, avant ce qu'elles portent — le défaut de la tente cachée par le plancher a disparu avec lui.

Testé sur ordinateur et téléphone : pose sur un sol en pente (24 cases nivelées, 12 pieds effacés, marche d'un cube au plus), reprise (sol rendu à l'identique), île réinitialisée, campement pillé ailleurs sur l'île, ancien campement au bord de l'eau, départ par l'arche puis retour par la pierre sans coffre (« 233 gardés au sac »), sauvegarde et relecture des modules (valeurs hostiles bornées), les deux moteurs de rendu, de jour et de nuit ; avec les modules créés en bêta, les tests des versions précédentes (portail à choix, coffre, nectar, volets) passent tels quels.

Dans le code : `MODULES` (les places), `aModule`, `placeAnneau`, `lieuModule`, `modsDuCamp` ; `placeCamp`, `majTerrasse`, `terrasseDefaire` ; `campOs(c)` et ses pièces `tenteOs`, `feuOs`, `jalonsOs`, `coffreOs`, `portailCampOs`, `poseModule` (tourne un module d'un quart de tour). Pour régler : `CAMP_RAYON` (3,7 : le rond), `CAMP_ANNEAU` (2,7 : la distance des modules au feu), `CAMP_DENIV` (2 : la pente admise), `CAMP_TALUS`.

## 75. Le portail et le coffre se créent au campement

Les deux premiers modules se créent en jeu : onglet Campement, volet Camp, une case par module (**Portail**, **Coffre**). Il faut être à son campement ; les matières viennent du sac (et du coffre, une fois qu'il existe). Deux appuis : la dépense ne se défait pas.

| Module | Création | Ensuite |
|---|---|---|
| **Coffre** | 30 bois · 12 fibres | ne s'améliore pas : créé, il ouvre le stock (dépôt, réserve commune, butin au retour, récolte des compagnes, pillage) |
| **Portail** | 40 pierres · 10 éclats | s'améliore **onze fois**, jusqu'au niveau 12 |

Le coffre rend ce qu'il gardait : un joueur d'avant les modules retrouve son stock en le créant (« 59 en réserve vous y attendaient »).

**Le portail, niveau par niveau.** Créé, il ouvre une arche au campement : on part de chez soi, vers une île au hasard. Chaque amélioration le fait viser un peu mieux :

| Niveau | Îles au choix | Ce qu'il lit d'une île | Îles gardées | Relances | Biome cherché | Allure |
|---|---|---|---|---|---|---|
| 1 | hasard | rien | — | — | — | Portail |
| 2 | 2 | le danger (le reste flou) | on y repart · 3 en mémoire | — | — | gravé (runes) |
| 3 | 3 | + les biomes rares | 6 | — | — | d'éclat (cristaux, voile vif) |
| 4 | 4 | | 7 | — | — | |
| 5 | 5 | + le bestiaire | 8 | — | — | au seuil |
| 6 | 6 | | 9 | — | — | |
| 7 | 7 | + l'état de l'île | 10 | — | — | |
| 8 | 8 | | 11 | — | — | à double arche |
| 9 | 8 | | 12 | 1 | — | |
| 10 | 8 | | 12 | 2 | 1 île tenue de le porter | à l'anneau |
| 11 | 8 | | 12 | 3 | 3 îles | |
| 12 | 8 | | 12 | 4 | toutes | de lumière (cristaux en orbite, trait) |

Le prix d'une amélioration est celui d'avant (§65) : 24 éclats et 30 pierres au niveau 2, des os dès le 3, du bois dès le 5, et 60 % de plus à chaque fois — 2 639 éclats, 3 299 pierres, 550 os et 1 074 bois pour le douzième. **Le niveau n'est plus sans limite** : au-delà de 12 il ne donnait plus que des relances ; le biome cherché, qui montait jusqu'au niveau 31, est resserré sur les niveaux 10 à 12.

**Les anciens niveaux.** Le « niveau du campement » était déjà celui du portail : en le créant, le portail **reprend ce niveau** (au plus 12). Sans portail, ce niveau dort dans la sauvegarde.

**L'onglet Campement.** Volet Camp : Se reposer, Portail, Coffre, Modules, Reprendre, Compagnes, Pillage. La case d'un module à créer dit ce qu'il apporte et son coût ; celle du portail créé dit ce qu'il sait faire, ce qu'apporte le niveau suivant, et son prix. « Modules » garde la vue d'ensemble (installé, à créer, à venir). Au volet Portail, sans portail, un bouton mène à sa création.

La bêta garde ses boutons (créer ou retirer sans payer, niveau du portail).

Testé sur ordinateur et téléphone : cases éteintes sans matières, création du coffre (stock retrouvé, réserve commune rouverte) et du portail (payé au coffre et au sac), onze améliorations puis plus de bouton, les douze niveaux et ce qu'ils apportent, l'allure aux niveaux 1, 5, 8 et 12, un ancien joueur au niveau 7 qui le retrouve, une sauvegarde hostile bornée à 12, départ vers une île choisie.

Dans le code : `COUT_MODULE`, `creerModule`, `ditPortail` (ce que le portail sait faire à un niveau), `CAMP_MAX` (12), `CAMP_PALIERS`, `choixPortail`, `DETAIL_NIV`, `relancesPortail`, `voeuxPortail`, `COUT_CAMP` (le prix des améliorations).

## 76. L'établi et la cuisine : fabriquer à la main ou à l'établi, cuisiner de deux à quatre ingrédients

**Deux façons de fabriquer.** L'onglet du sac s'appelle désormais **Fabrication** (touche B). Chaque objet dit d'où il se fait :

| D'où | Ce qu'on y fabrique |
|---|---|
| **À la main**, partout, sans campement | couteau d'os, pioche, gourdin, tunique de fibre, canne à pêche, flèches, campement |
| **Établi niveau 1** | lance d'os, épée de pierre, arc, cuirasse d'os, lanterne, marmite portable, sifflet d'os, lien d'éclat, ceinture — et la création des modules : coffre, portail, cuisine |
| **Établi niveau 2** | serpe cristalline, lame d'éclat, manteau d'éclats, les quatre grimoires, lampe d'ambre |
| **Établi niveau 3** | foreuse, marteau-pilon, arbalète à poulies, plastron de ferraille |

- L'établi est un **module du campement**. Il se crée à la main, au camp (volet Camp, case Établi) : 24 bois · 16 pierres · 8 fibres. Niveau 2 : 40 bois · 50 pierres · 16 éclats · 8 os. Niveau 3 : 24 ferraille · 40 éclats · 80 pierres.
- Ce qui demande l'établi se fabrique **au campement**, près de lui, et s'il a le niveau. Ailleurs, la recette est grisée et dit pourquoi (« Établi niveau 2 », « À l'établi, au campement »). Un filtre « À la main » montre ce qui se fait partout.
- Ce qu'on possède déjà reste à soi : seule la fabrication est concernée. Le mode essai et « tout fabriquer » de la bêta passent outre.
- **L'établi vient en premier** : sans lui, ni coffre, ni portail, ni cuisine. Ceux qui avaient déjà créé un module le gardent.

**La cuisine.** Deux feux où cuisiner ; le feu de camp seul ne cuisine plus.

| Où | Ingrédients par plat |
|---|---|
| **Marmite portable** (établi niveau 1), posée où l'on veut | 2 |
| **Cuisine du campement**, niveau 1 — 24 pierres · 16 bois · 8 fibres | 2 |
| niveau 2 — 40 pierres · 10 os · 8 éclats | 3 |
| niveau 3 — 70 pierres · 30 éclats · 20 os | 4 |

- La marmite montre autant de places que le feu en offre. Une recette du livre qui en demande plus le dit (« il faut une cuisine de niveau 3 »).
- Conséquence à connaître : les plats à quatre ingrédients — le **sérum du Korlaz** en est un — ne se cuisinent plus qu'au campement, cuisine au niveau 3.
- Le garde-manger du coffre reste la réserve de la cuisine, près du campement.

**Au campement.** L'établi (un plateau, son panneau d'outils, un billot ; une meule et des éclats au niveau 2 ; une enclume et de la ferraille au niveau 3) et la cuisine (une marmite pendue à sa potence sur un âtre ; une table de découpe au niveau 2 ; un séchoir au niveau 3) prennent leur place sur l'anneau. Les autres joueurs de l'île les voient à leur niveau (le sixième nombre du message `cp` porte aussi ces deux niveaux ; aucun changement Supabase).

**L'onglet Campement, volet Camp** : Se reposer, Établi, Coffre, Portail, Cuisine, Modules, Reprendre, Compagnes, Pillage. Chaque case de module dit ce qu'il apporte, ce qu'il sait faire, ce qu'apporte le niveau suivant et son prix.

La bêta : un bouton par module (chaque appui monte d'un niveau, puis retire).

Testé sur ordinateur et téléphone : à la main sans campement (le campement et la pioche se font, la lance non), l'établi créé au prix juste, les niveaux 2 et 3 qui ouvrent leurs objets, le refus loin du campement, le coffre, le portail et la cuisine refusés sans établi ; le feu de camp qui ne cuisine plus, la marmite portable à deux ingrédients, la cuisine à deux, trois puis quatre, une recette à quatre refusée au niveau 1 ; les modules dessinés aux trois niveaux ; nectar, ceinture, spores, plats et départ par le portail sans régression.

Dans le code : `et` sur chaque objet d'`OBJETS` (le niveau d'établi qu'il faut, absent = à la main), `verrouFab`, `noteEtabli` ; `COUT_MODULE` (création et niveaux), `coutModule`, `MODULE_MAX`, `nivModule`, `creerModule`, `ameliorerModule` ; `cuisineIci`, `marmitePres`, `placesMarmite`, `MARMITE_PORTABLE` ; `etabliOs`, `cuisineOs` ; `modsDits` / `modsLus` (réseau).

## 77. Le voile des portails remis dans son plan, et la table de soin

**Le voile des portails.** Les quatre lames du voile étaient dessinées en travers de l'arche (des ailettes, vues par la tranche quand on regardait le portail de face). Elles sont maintenant dans le plan de l'arche : un rideau qui ferme le passage. Cela vaut pour l'arche de chaque île, le portail du campement (niveaux 1 et 2 ; à partir du 3 sa nappe vive était déjà dans le bon plan) et le seuil des nomades. Cause : une boîte debout prend sa première largeur selon y, la seconde selon x — les deux étaient inversées dans `portailOs`.

**La table de soin**, troisième module à se créer grâce à l'établi : 30 fibres · 16 bois · 6 os. Niveau 2 : 50 fibres · 14 os · 10 éclats. Niveau 3 : 80 fibres · 36 éclats · 24 os. On y prépare des soins, comptés au sac comme les flèches ; chaque niveau en ouvre de plus forts.

| Table | Pour soi ou un équipier | Pour une compagne |
|---|---|---|
| Niveau 1 | **Bandage** (×2) — +35 % de vie — 12 fibres | **Onguent** (×2) — +50 % de vie — 8 fibres · 4 baies ; **Baume de relève** — relève une compagne à terre, à 60 % — 14 fibres · 4 os |
| Niveau 2 | **Cataplasme** — +65 % de vie, chasse le poison et la brûlure — 14 fibres · 6 baies | **Onguent fort** — toute sa vie, et rassasiée — 12 fibres · 6 baies · 3 os |
| Niveau 3 | **Élixir de vie** — toute la vie, chasse poison et brûlure, rend un cœur perdu — 14 éclats · 20 fibres · 6 os | **Baume de vie** — relève une compagne à terre, toute sa vie rendue — 8 éclats · 14 fibres · 6 os |

- **Pour soi** : depuis le sac (rangée « Soins », bouton Utiliser) ou depuis une case du bord droit. Trois secondes entre deux soins. Un soin qui ne servirait à rien n'est pas dépensé.
- **Pour un équipier** : un joueur à moins de 3,5 pas. Le bouton « Soigner <son nom> » du sac ; ou la case, quand on est soi-même en pleine forme. Le soin part par le réseau (évènement `soin`) et s'applique chez lui ; un ancien client l'ignore. Aucun changement Supabase.
- **Pour une compagne** : depuis l'onglet Compagnes, un bouton par soin possédé. À terre, il lui faut un baume : celui de relève (niveau 1, à 60 % de sa vie) ou le baume de vie (niveau 3, toute sa vie). **Le baume de relève ne se fait plus à la main** : il se prépare à la table de soin, comme les autres soins ; ceux qu'on a déjà en réserve restent.
- Les soins se préparent **au campement**, à la table, comme le reste se fabrique à l'établi : onglet Fabrication, filtre « Soins ». Ils ne se perdent pas avec le sac.

**Au campement.** La table prend sa place sur l'anneau : une table nappée, un mortier, un rouleau de bandage ; une étagère de pots au niveau 2 ; des fioles qui luisent au niveau 3. Volet Camp : Se reposer, Établi, Coffre, Portail, Cuisine, Table de soin, Modules, Reprendre, Compagnes, Pillage.

Testé sur ordinateur et téléphone : le voile avant et après, de face et de trois quarts ; la table refusée sans établi, créée, montée deux fois ; chaque soin refusé sous son niveau et loin du campement ; bandage, cataplasme (poison et brûlure chassés), élixir (cœur rendu) ; le refus à pleine vie, la pause de trois secondes ; un équipier soigné (message parti, soin non dépensé s'il va bien) et le soin reçu d'un autre (borné : un par seconde, un soin connu seulement) ; onguent, onguent fort, baume de vie sur une compagne à terre ; un soin rangé dans une case et utilisé ; sauvegarde relue, valeurs hostiles bornées ; établi, cuisine, ceinture, plats et portail sans régression.

Dans le code : `ts` sur un objet (le niveau de table qu'il faut), `atelierDe`, `verrouFab` ; `P.soins`, `soigner`, `effetSoin`, `etreSoigne`, `soignerCompagne`, `equipierProche`, `SOIN_PAUSE`, `SOIN_PORTEE` ; `grilleSoins`, `ficheSoin` ; `soinOs`.

## 78. La défense, premier temps : le rempart et les tours, contre la faune et les étrangers

Le pillage est venu dans un second temps : voir la section 79.

**L'abri du feu rétrécit.** Il couvrait sept cases autour du campement ; il ne couvre plus que **le rond lui-même** (quatre cases du feu). Dans le rond, comme avant : les prédateurs ne vous prennent pas pour proie et les coups des autres joueurs ne portent pas. Au-delà, plus rien ne protège — sinon la défense. La réserve commune (établi, cuisine, compagnes qui puisent au coffre) porte toujours à sept cases.

**Le module Défense** se crée grâce à l'établi : un poste de garde à sa place sur l'anneau (30 bois · 20 pierres · 10 fibres). Deux branches s'y améliorent à part, trois niveaux chacune :

| | Niveau 1 | Niveau 2 | Niveau 3 |
|---|---|---|---|
| **Rempart** | Barricade de pieux : les bêtes n'entrent plus — 60 bois · 20 fibres | Palissade : les joueurs étrangers non plus, on entre par la porte — 90 bois · 60 pierres · 30 fibres | Mur de pierre crénelé : il arrête aussi les tirs — 220 pierres · 30 éclats · 20 os |
| **Tours** | 1 tour, 8 cases, un tir toutes les 2,2 s — 50 bois · 30 pierres · 10 os | 2 tours, 10 cases, plus fort — 80 bois · 60 pierres · 30 éclats | 4 tours, 13 cases — 30 ferraille · 60 éclats · 120 pierres |

**Le rempart** suit la bordure du rond ; sa porte est à l'entrée (trois cases).
- Les bêtes n'entrent plus dans le rond. Passent quand même : les compagnes, ce qui vole, les nomades, et une bête déjà dedans peut toujours sortir.
- La barricade (niveau 1) s'enjambe : elle n'arrête aucun joueur. Dès la palissade, on n'entre que par la porte, et seulement si l'on est du campement ou de son groupe ; un étranger reste dehors. **Sortir reste toujours libre** : on ne s'enferme pas.
- Le mur de pierre arrête à l'entrée du rond les tirs qui volent plus bas que ses créneaux (spores, traits d'automates, obus, flèches d'un étranger).
- La porte s'ouvre à l'approche de quelqu'un du campement.

**Les tours** prennent les coins du rond. Elles tirent seules sur la bête hostile la plus proche à portée (un prédateur éveillé, une bête en colère ou qui s'en prend à vous ou à une compagne), jamais sur une bête paisible, une compagne, un nomade. Elles tirent aussi, trente secondes durant, sur un joueur qui vient de vous frapper. Leurs coups pèsent comme ceux d'une arme (ils faiblissent avec le danger de l'île). **Une bête abattue par une tour ne laisse pas de butin** : on ne chasse pas en dormant.

**Chez les autres.** Rempart et tours d'un joueur se voient sur son campement, à leur niveau, et son rempart vous arrête comme le vôtre l'arrête (le sixième nombre du message `cp` porte ces deux niveaux).

**Onglet Campement**, volet Camp : la case Défense crée le poste, puis montre les deux branches, chacune avec son état, son niveau suivant, son prix et son bouton (deux appuis). La bêta a ses boutons (défense, rempart, tours).

Testé : l'abri à 1, 3,5, 4,5, 6,5 et 8 cases ; le poste refusé sans établi, créé, les deux branches montées jusqu'à 3 puis refusées ; un traqueur en colère lancé sur le joueur au centre reste dehors dès la barricade ; la porte, les côtés et le fond pour soi, pour un étranger, pour un membre du groupe ; la sortie libre ; les tirs bas arrêtés par le mur de pierre et pas par la palissade ; une tour qui entame un traqueur (12 coups en 30 s au niveau 1), quatre tours qui l'abattent en deux salves, aucune matière gagnée ; une bête paisible épargnée ; la riposte sur un joueur agresseur ; sauvegarde relue et bornée ; le dessin aux trois niveaux, porte ouverte et fermée ; soins, portail, nectar, retour d'expédition sans régression. Non testé entre deux vrais clients : le rempart et les tours vus chez un autre joueur.

Dans le code : `P.defense`, `DEF_MAX`, `COUT_DEFENSE`, `TOURS` (nombre, portée, dégâts, cadence, hauteur), `TOUR_COINS`, `ameliorerDefense` ; `majMurs`, `murJoueur`, `murBete`, `murTir`, `parLaPorte`, `allieDuCamp`, `porteOuverte` ; `majTours`, `beteHostile`, `Agresseurs` ; `posteOs`, `rempartOs`, `tourOs` ; `ABRI` (4) et `RESERVE_R` (7).

## 79. La défense, second temps : le pillard contre le rempart et les tours

**La base a changé** (migration `vp_campement_defenses`, appliquée le 7 octobre 2026) : `vp_campements` porte deux colonnes de plus, `niv_mur` et `niv_tours` (de 0 à 3) ; `vp_camp_publier` les enregistre, `vp_camp_cible` les rend. `vp_piller` n'a pas bougé : la part reste plafonnée à **20 %** du coffre, et à un centième par seconde de visite. Un campement publié avant cette version passe pour sans défense jusqu'à ce que son joueur rejoue.

**Ce que le pillard trouve.** Le campement visité se dresse avec le rempart et les tours de son propriétaire, à leur niveau. L'annonce d'arrivée les nomme (« palissade · 2 tours · forcez la porte, puis au coffre »).

**Le rempart.** Chez celui qu'on pille, tout rempart arrête — même la barricade, qui ailleurs s'enjambe. On n'entre que par la **porte, une fois forcée** : on la frappe à l'arme (ATTAQUER ou ACTION, le coup se tourne vers elle) ou on la crible de flèches. Elle tient, en dégâts d'arme : 3 (barricade), 8 (palissade), 18 (mur de pierre) — au gourdin 4 s, 11 s, 25 s environ ; à l'épée 2 s, 5 s, 11 s ; au marteau-pilon 6 s pour le mur de pierre. Forcée, elle reste ouverte. Sortir reste libre. Les compagnes du pillard restent dehors tant qu'elle tient ; les gardiennes passent. **Derrière un rempart, le coffre ne se vide que de l'intérieur** (sans cela on l'atteignait depuis la porte).

**Les tours** tirent sur le pillard dès qu'il est à portée (8, 10, 13 cases) : un carreau qu'on voit venir, qu'un pas de côté esquive, qu'un arbre arrête. Touché, on perd 6 %, 8 % ou 10 % de vie selon le niveau (l'armure en retient sa part), on recule, et l'on reste une seconde hors d'atteinte — comme pour tout coup, ce qui interrompt aussi le pillage au coffre. Une tour **s'abat** : à l'arme depuis son pied (elles sont aux coins, on les atteint de dehors) ou à l'arc, de plus loin que leur portée. Elle tient 1,5, 3 ou 5 dégâts d'arme ; il en reste une ruine. La visite close, elles se taisent.

**Rien n'est abîmé chez le pillé** : la porte forcée et les tours abattues ne le sont que pour cette visite, sur la copie que la base a donnée au pillard. Le pillé ne perd que la part de coffre, comme avant, et garde son bouclier de douze heures.

**Sauvegarde** : la visite en cours garde l'état de la porte et de chaque tour (`porte`, `tk`) ; recharger ne les relève pas.

Testé (campement visité simulé, base remplacée par un double) : les niveaux lus, bornés, relus de la sauvegarde, une sauvegarde gonflée ramenée aux bornes ; le rempart qui arrête aux trois niveaux, de côté et à la porte ; la porte forcée au gourdin, à l'épée, au marteau, puis l'entrée par elle seule ; rien de pillé depuis le dehors, 20 % emportés une fois dedans ; les tours immobile (5, 6, 7 coups en dix secondes), en courant (aucun), hors de portée, visite close, en cuirasse ; les tours abattues à l'arme, entamées à l'arc, puis muettes ; les essais de la section 78 repassés. **Pas vérifié** : un vrai pillage entre deux comptes, de la publication à l'emport — il faudra le jouer.

Dans le code : `PORTE_RAID`, `TOUR_RAID`, `TOUR_RAID_DEG`, `TOUR_RAID_N` ; `Raid.mur`, `Raid.tours`, `Raid.porte`, `Raid.tk` (lus par `raidLu`, gardés par `raidPhoto`) ; `ouvrageProche`, `frapperOuvrage`, `flecheOuvrage`, `majToursRaid`, `carreauTouche`, `tourRuineOs` ; la branche `c === Raid` de `murJoueur`, `murBete`, `porteOuverte`, `defDuCamp` ; `campPublic` publie `niv_mur` et `niv_tours`.

## 80. Au campement, l'action suit ce qu'on approche

Le bouton ACTION ne disait que « CAMPEMENT » dans tout le rond. Il propose maintenant ce qui est **à portée de main** (1,3 case), le plus proche l'emportant :

| On approche… | ACTION propose | et ouvre |
|---|---|---|
| la tente | SE REPOSER | Campement › Camp, case Se reposer |
| l'établi | FABRIQUER | l'onglet Fabrication, tout affiché |
| le coffre | COFFRE | Campement › Camp, case Coffre |
| le portail | PORTAIL | Campement › Portail |
| la cuisine | CUISINER | Campement › Cuisine (la marmite) |
| la table de soin | SOINS | l'onglet Fabrication, filtré sur les soins |
| le poste de garde | DÉFENSE | Campement › Camp, case Défense |
| un emplacement libre | CRÉER · le nom du module | la case de ce module (« il faut l'établi » s'il manque) |
| le feu, ou rien de précis | CAMPEMENT · vue d'ensemble | Campement › Camp, comme avant |

Les emplacements de l'alchimie et de la bibliothèque ne proposent rien tant que ces modules n'existent pas. Améliorer un module se fait toujours depuis sa case, dans Campement › Camp. Rien d'autre ne change : une bête au contact se frappe d'abord, la marmite portable garde son action, et hors du rond le bouton reprend son rôle habituel.

Testé : le camp de base, l'établi seul, tous les modules — chaque emplacement approché, l'action lue puis jouée, le panneau ouvert vérifié ; l'approche par le dehors du rond, entre deux modules, hors du rond ; le bouton à l'écran et son appui réel devant la cuisine.

Dans le code : `moduleProche`, `campAction`, `MODULE_PRES`, `CASE_MODULE`, appelés par `actionContexte`.

## 81. La table d'alchimie : les potions, seul moyen d'améliorer le personnage

Il n'y a pas de niveau de personnage : c'est par les potions qu'il progresse, et pour de bon. Rien ne change dans Supabase.

**Le module.** La table d'alchimie se crée grâce à l'établi, à sa place sur l'anneau (40 pierres · 20 bois · 20 éclats), et s'améliore deux fois (60 pierres · 50 éclats · 20 os, puis 30 ferraille · 90 éclats · 100 pierres). Niveau 1 : les rangs 1 et 2. Niveau 2 : le rang 3. Niveau 3 : les rangs 4 et 5. Chaque niveau au-delà du premier ajoute 8 points de chance. Devant elle, ACTION propose ALCHIMIE (ou CRÉER tant qu'elle n'existe pas).

**Huit caractéristiques, cinq rangs chacune.**

| Caractéristique | Base | Par rang | Au rang 5 |
|---|---|---|---|
| Vie | 100 | +10 : la jauge tient davantage, toute blessure en coûte moins | 150 |
| Souffle | 8 s de course | +10 % | 12 s |
| Mana | sorts à 100 % | −8 % d'éclats par sort | 60 % |
| Force | 100 % | +10 % aux coups et aux flèches | 150 % |
| Récupération | la vie remonte 8 s après le dernier coup | 0,8 s plus tôt, 20 % plus vite | 4 s, deux fois plus vite |
| Vitesse | 100 % | +4 % | 120 % |
| Saut | 100 % | +5 % | 125 % |
| Récolte | 100 % | +10 % (la fraction tombe au sort) | 150 % |

Les plats de la cuisine restent temporaires et s'ajoutent par-dessus.

**Préparer une potion.** Une recette par caractéristique et par rang : de trois étapes (rang 1) à six (rang 5). Chaque étape demande une famille d'ingrédient et une rareté minimale ; chaque caractéristique a ses trois familles (la force : viande, racine, champignon ; le souffle : poisson, feuille, graine…). Les rangs 4 et 5 demandent en plus un ou deux ingrédients « très rares », de n'importe quelle famille.
- **L'ordre compte.** On verse un ingrédient à la fois, depuis le garde-manger. S'il convient à l'étape attendue, il la prend. S'il ne convient qu'à une étape plus loin, il la prend quand même et c'est une faute : −15 points de chance. S'il n'entre nulle part, il est refusé sans être consommé.
- **Versé, c'est versé** : l'ingrédient est consommé aussitôt. On peut vider le chaudron (deux appuis), mais ce qui y était est perdu. Le chaudron en cours est gardé par la sauvegarde.
- **La chance** s'affiche en permanence : 80, 70, 60, 50, 40 % selon le rang, +8 par niveau de table, +3 par cran de rareté au-dessus du demandé (15 au plus), −15 par faute ; jamais moins de 5 %, jamais plus de 95 %.
- **Tenter** coûte des éclats (6, 12, 20, 30, 45) et, dès le rang 3, des spores de Korlaz (4, 8, 12) : elles trouvent là leur usage.
- **Réussie**, la potion est bue sur place et le rang est acquis. **Ratée, tout est perdu** : ingrédients, éclats, spores.

**La page Alchimie**, nouveau volet du Campement. À gauche la fiche : pour chaque caractéristique la base, les rangs de potion et le total ; puis les compagnes, avec leurs aptitudes d'espèce (leurs potions : section 82). À droite la potion choisie : son effet, sa chance et d'où elle vient, la recette étape par étape, puis le garde-manger réduit à ce qui peut encore entrer. La fiche se consulte partout ; verser et tenter demandent d'être à la table. Sur téléphone, la potion passe avant les compagnes. *(Depuis le §133, ce volet n'est plus que la fiche et le carnet : la préparation se fait dans la fenêtre de la table.)*

**À savoir.** « Résistance », annoncée dans le plan, a laissé sa place à « Récupération » : la jauge de vie étant une fraction, une vie plus grande et une résistance aux coups revenaient au même levier. Le mana n'a pas de réserve propre (ce sont les éclats du sac) : sa potion baisse le prix des sorts.

**Bêta** : deux boutons, « Alchimie n/3 » (le module) et « Potions : rang n/5 » (toutes les caractéristiques d'un coup).

Testé : la table refusée sans établi, créée, montée à 3 puis refusée ; les 40 recettes, dont aucune étape n'est impossible à remplir ; une potion versée dans l'ordre puis réussie, une autre avec une faute et un ingrédient très rare puis ratée (rang inchangé, tout consommé) ; un ingrédient hors recette ou trop commun refusé sans perte ; le rang 3 refusé à la table de niveau 1 ; rien loin du campement ; le chaudron vidé ; les spores manquantes puis fournies ; l'effet mesuré de chaque caractéristique au rang 0 et au rang 5 ; la sauvegarde relue, puis gonflée et ramenée aux bornes ; la page à l'écran, au clic, sur téléphone ; les essais des sections précédentes repassés.

Dans le code : `P.alchimie`, `P.chaudron` ; `ALCH`, `ALCH_MOTIF`, `ALCH_COUT`, `ALCH_CHANCE`, `ALCH_NIV` ; `rangAlch`, `vieK`, `forceK`, `sautK`, `arrondiAlch` ; `recetteAlch`, `etapeVa`, `chanceAlch`, `verserAlch`, `tenterAlch`, `viderAlch`, `alchimieLue` ; `pageAlchimie`, `alchimieOs`. Le septième groupe de deux bits de `modsDits` porte le niveau de la table.

## 82. Les potions des compagnes : récolte, défense, et une compétence par type

Les compagnes ont maintenant leurs potions, préparées à la table d'alchimie comme les vôtres (recette à verser dans l'ordre, chance de réussite, tout perdu si la potion tourne). Réussie, la potion est donnée à la compagne choisie, pour de bon. Rien ne change dans Supabase.

**Trois potions par compagne.**

| Potion | Rangs | Effet |
|---|---|---|
| Récolte | 5 | +10 % par rang à tout ce qu'elle rapporte, sur place comme en votre absence |
| Défense | 5 | par rang, +10 % à ses coups et −6 % à ceux qu'elle reçoit |
| Éveil | 3 | le premier rang lui apprend la compétence de son type ; les deux suivants la renforcent |

La potion d'éveil est plus exigeante : elle part des recettes du rang 3 (cinq étapes, 60 % de base, table au niveau 2), puis du rang 4 et du rang 5 (table au niveau 3). Une compagne à terre ne reçoit pas de potion.

**Une compétence par type.** Elle s'en sert seule, quand la situation s'y prête, avec un délai entre deux usages.

| Type | Compétence | Rang 1 | Rang 2 | Rang 3 |
|---|---|---|---|---|
| **Rampants** (brouteur, bossu, glaneur, traqueur, spectre) | **Boule visqueuse** : elle crache sur la bête qui vous menace, clouée sur place, sans assaut possible | 2,5 s, toutes les 10 s | 3,5 s, toutes les 8 s | 4,5 s, toutes les 6 s |
| **Coursiers** | **Charge** : en selle et au galop, il renverse et blesse ce qui est devant lui. **Ruade** : monté ou non, une bête hostile à moins d'une case et demie est repoussée avec ses voisines | ruade toutes les 9 s | toutes les 7 s | toutes les 5 s |
| **Telluriens** (crapaud-buffle, varan, vesseron, cerf de verre, salamandre) | **Secousse** : une bête hostile tout près, il frappe le sol ; tout ce qui l'entoure est repoussé, blessé un peu, étourdi | 3 cases, 1,2 s, toutes les 14 s | 3,5 cases, 1,6 s, toutes les 11 s | 4 cases, 2 s, toutes les 8 s |
| **Doux** (lentigrade, cotonnier, carillonneur, oglodon) | **Trouvaille** : en rapportant sa récolte, elle déniche parfois un produit rare de la flore | 8 % | 12 % | 16 %, dont parfois un « très rare » |

- **Les automates** reçoivent les potions de récolte et de défense, mais n'ont pas de compétence.
- **Les créatures à part** — félin de brume, bramard, sterne des nues, dragon à plumes, silencieux, mille-gueules — ne sont d'aucun type : elles ont chacune leur compétence (section 84). (La première livraison les avait rangées par erreur chez les Rampants, faute d'une famille à elles dans le code ; corrigé au cache 50.)
- **La boule visqueuse et les joueurs.** Elle ne part sur un joueur que si vous venez de le frapper (dans les huit secondes). Touché, il est cloué sur place, sans saut, le temps de la boule (5 s au plus), sauf dans le rond d'un campement. Qui englue devient une cible pour les tours du joueur visé.
- **Un gardien de portail** ne reste englué que 40 % du temps, et les coups des compétences le blessent sans le repousser ni l'étourdir.
- **La trouvaille en votre absence** : une Douce restée au campement en rapporte aussi, au cellier (une toutes les vingt minutes par rang, environ).

**La fiche**, page Alchimie : sous vos caractéristiques, chaque compagne a ses lignes — récolte, défense, compétence — avec la base, les rangs de potion et le total, puis les aptitudes de son espèce. Une ligne se choisit comme une des vôtres : la recette s'affiche à droite. Dans l'onglet Compagnes, la fiche rappelle les potions reçues.

**Bêta** : « Compagnes : potions n/5 » monte d'un coup les trois potions de toutes les compagnes.

Testé : une compagne de chaque type et un automate liés ; les trois potions préparées et données, la table trop basse et la compagne à terre refusées, le chaudron perdu quand la compagne visée n'est plus là ; la récolte (+50 % au rang 5, la fraction au sort), la trouvaille sur place et en absence ; la défense (coups ×1,5, coups reçus ×0,7 au rang 5) ; la boule visqueuse sur un traqueur en colère (engluée 2,5 s, immobile), rien sans potion, rien sur un joueur non frappé, le message envoyé au joueur frappé, et soi-même englué (ni pas ni saut, puis libre) ; la secousse et son délai, rien sans bête hostile ; la ruade, la charge au galop (devant seulement, pas deux fois de suite), rien au pas ; la sauvegarde relue, gonflée puis ramenée aux bornes. **Pas vérifié** : entre deux joueurs réellement connectés, et sur une faune partagée dont on n'est pas le gardien — les effets sur les bêtes y sont joués chez celui qui les anime.

Dans le code : `c.pot` (`recolte`, `defense`, `comp`), `potComp`, `potBete`, `potLue` ; `ALCH_COMP`, `COMPETENCES`, `GLU`, `CHARGE`, `RUADE`, `SECOUSSE`, `TROUVE` ; `potionDe` (une potion par sa clé : `vie`, ou `c12:recolte`), `freinAlch`, `chaudronLu` ; `majCompetences`, `compGlu`, `gluTouche`, `engluer`, `etreEnglue` (message `glu`), `compCoursier`, `compSecousse`, `frappeComp`, `trouvaille`, `ditPotions`.

## 83. Le Mille-gueules qu'on ne pouvait plus débusquer

Deux défauts le rendaient impossible à faire sortir, donc à apprivoiser.

**Il se coinçait sous la terre.** Pour contourner la roche, il n'essayait qu'un écart d'un côté, puis de l'autre : dans un angle de roche entre lui et vous, les deux échouaient et il restait là, pour de bon. Un plongeon pouvait aussi l'emmener sous la roche, d'où il ne ressortait plus. Il cherche maintenant **le plus court chemin par la terre meuble**, case par case, dans un carré de 26 cases autour de sa tête ; si rien n'y mène jusqu'à vous, il va au plus près et vous traite comme si vous étiez sur la roche (il rôde au bord, frappe à moins de 4 cases, renonce au bout de quinze secondes). Il ne plonge plus dans la roche, et s'il s'y trouve, il en ressort tout droit.

**À moitié apprivoisé, il ne venait plus.** Passé la moitié de la confiance (quatre offrandes), il cessait de vous chasser — donc de sortir —, alors qu'il faut qu'il soit dehors, dressé, pour recevoir les quatre offrandes suivantes. Désormais, à moitié apprivoisé, **il vient encore à qui porte un Cœur de lanterne** (à moins de 18 cases, sur sa terre) : il sort à deux pas de vous, sans frapper (« le Mille-gueules vient à l'offrande »), reste dressé trois secondes, puis replonge. Sans Cœur de lanterne au sac, il vous laisse en paix, comme avant.

**Lié**, il vous suivait mal pour la même raison : quand le point qu'il visait, trois cases derrière vous, tombait sur la roche, il repartait errer. Il va maintenant au plus près de vous par la terre meuble, et il défend.

Testé (graine 109, exploration 3) : avant le correctif, deux offrandes au plus puis plus rien pendant trois minutes, la tête immobile dans un angle de roche ; après, les deux Mille-gueules de l'île liés en huit offrandes chacun (81 s et 99 s), les quatre premières en chasseur, les quatre dernières « à l'offrande » sans un coup. À moitié apprivoisé et sans Cœur de lanterne : aucune sortie en trente secondes. Sur la roche : il rôde et frappe au bord, comme avant. Lié : à moins de quatre cases de vous dans seize placements sur seize (cinq sur seize à plus de cinq cases avant), et un traqueur en colère abattu en cinq secondes (jamais attaqué avant). Coût mesuré : environ 1,7 ms de plus par image quand il chasse.

Dans le code : `pasMille` (le chemin, gardé une seconde par case de départ et d'arrivée), `b.chem`, `b.acces`, `b.ami` ; `majMille` (états `sous`, `fendre`, `dresse`, `plonger`).

## 84. Les six créatures à part : une compétence chacune

Le félin de brume, le bramard, la sterne des nues, le dragon à plumes, le silencieux et le mille-gueules ne sont d'aucun type. Chacun reçoit sa propre compétence, par la même potion d'éveil que les autres (trois rangs, recette du rang 3 pour commencer, table au niveau 2), et s'en sert seul.

| Créature | Compétence | Rang 1 | Rang 2 | Rang 3 |
|---|---|---|---|---|
| **Félin de brume** | **Voile de brume** : une bête vous a pris pour proie à moins de neuf cases, il est près de vous — vous voilà invisible | 4 s, toutes les 45 s | 6 s, toutes les 36 s | 8 s, toutes les 28 s |
| **Bramard** | **Brame** : une bête hostile à moins de sept cases de lui, il brame — toutes les bêtes alentour s'enfuient, les chasseurs renoncent à vous | 6 cases, 4 s, toutes les 20 s | 8 cases, 5 s, toutes les 16 s | 10 cases, 6 s, toutes les 12 s |
| **Sterne des nues** | **Vigie** : elle crie quand une bête vous guette, dit où (« vers l'ouest, à 13 pas ») et la désigne : sa fiche s'affiche, vos compagnes en défense s'en chargent. Elle voit aussi le félin fondu dans la brume, que le jeu n'annonce pas | à 14 cases | à 20 cases | à 26 cases |
| **Dragon à plumes** | **Souffle de braise** : sa boule de feu éclate plus large, et le brasier qu'elle laisse est plus grand et dure plus longtemps (sans potion : 1,5 case, 3,5 s) | 1,9 case, 5 s | 2,3 cases, 6,5 s | 2,7 cases, 8 s |
| **Silencieux** | **Silence** : près de lui, vos pas ne s'entendent plus — les bêtes vous remarquent de bien plus près, et un Silencieux sauvage ne vous entend pas | à 6 cases de lui | à 8 cases | à 10 cases |
| **Mille-gueules** | **Embuscade** : en jaillissant sous la menace, il cloue sur place les bêtes autour du trou, pour le coup qui suit (celles qui sont juste au-dessus prennent déjà le jaillissement) | 2 cases, 2 s | 2,4 cases, 3 s | 2,8 cases, 4 s |

- Le brame n'effraie ni les gardiens de portail, ni les horreurs, ni les dragons, ni les automates. Une bête qui fuit sous le brame ne lance plus d'assaut, même mordue par une compagne.
- Le voile de brume se dissipe si vous frappez, comme l'invisibilité des plats.
- Au passage : « vers le ouest » et « vers le est » s'écrivent maintenant « vers l'ouest », « vers l'est » (la vigie, et l'arche de l'île dans le panneau).
- Au passage aussi : un Mille-gueules **sous terre** n'est plus blessé par un autre Mille-gueules (le vôtre, en défense, le frappait à travers la terre et finissait par le tuer). Dehors, il reste une cible : pour en apprivoiser un second, mettez vos compagnes **au repos**, sinon elles s'en prennent à lui pendant qu'il se dresse.

Testé : les six liées, leurs recettes ; le voile (rien sans guetteur, 4 s puis le délai, rien si le félin est loin) ; le brame (rien pour une bête paisible seule, un traqueur en colère qui passe de 1,5 à 14 cases en trois secondes sans un assaut, rien au-delà du rayon) ; la vigie (un félin tapi à 13 cases signalé et désigné, pas deux fois, la portée par rang) ; le silence (bruit de course ramené à zéro dans le rayon, pas au-delà) ; le souffle (zone et brasier aux trois rangs, le dragon sauvage inchangé) ; l'embuscade (retenue selon la distance au trou et le rang). Pas vérifié : à deux joueurs, et le dragon et la sterne en vol réel sur une longue partie.

Dans le code : `BRUME`, `BRAME`, `VIGIE`, `BRAISE`, `SILENCE`, `EMBUSCADE` ; `guette`, `compBrume`, `compBrame` (et `b.brame` dans le choix d'état des bêtes), `compVigie`, `compSilence` ; `cracheFeu` et `allumerFeu` pour le dragon, la sortie de `fendre` dans `majMille` pour l'embuscade ; `compDe` rend le type, ou l'espèce pour une créature à part ; `versLe`.

## 85. La magie, première livraison : l'Écriture d'éclat

On n'apprend pas des sorts tout faits : **on les écrit**. Une phrase tient en deux glyphes — une **forme** (comment le sort part) et une **matière** (ce qu'il fait) — et le jeu lui donne son nom : « Trait de braise », « Mur de fange », « Égide d'effroi ». Cinq formes, six matières : trente sorts. La magie n'agit que dans l'instant, pour attaquer ou se défendre ; ce qui change le personnage pour de bon reste à l'alchimie. Rien ne change dans Supabase.

**Les formes**

| Forme | Rôle | Ce qu'elle fait | Éclats | À relancer après |
|---|---|---|---|---|
| Trait | attaque | un projectile sur la bête visée : celle qu'on vient de frapper, sinon la plus menaçante devant soi, à 14 cases au plus | 5 | 1,2 s |
| Onde | attaque | un anneau qui part de vous : tout ce qui est à 4,5 cases | 10 | 5 s |
| Piège | attaque | un glyphe posé à vos pieds ; armé en une seconde, il attend 90 s la première bête à une case, et touche à 2,2 cases. Trois pièges au plus | 8 | 4 s |
| Mur | défense | une barrière de cinq cases, deux cases devant vous, huit secondes : les bêtes à pied ne passent pas, leurs tirs non plus (ni les carreaux des tours) ; ce qui s'y frotte reçoit la matière. Un seul mur à la fois | 12 | 8 s |
| Égide | défense | dix secondes : toute blessure réduite d'un tiers, et la matière rendue à la bête qui vous frappe | 12 | 14 s |

**Les matières**

| Matière | Éclats | Son effet | Son coup | Son biome (son Tome I y repose, voir §86) |
|---|---|---|---|---|
| Fange | 3 | englue : clouée sur place 2,5 s | faible | la Tourbière |
| Vent | 3 | repousse au loin | faible | le Canyon d'ocre |
| Spore | 5 | trouble : la bête vous perd de vue six secondes et renonce | faible | la Sylve fongique |
| Effroi | 6 | met en fuite quatre secondes | faible | les Terres de l'effroi |
| Cristal | 7 | perce : aucun effet, les dégâts les plus forts | très fort | les Champs de cristal |
| Braise | 8 | brûle, et laisse un brasier de 3,5 s (il épargne le joueur et ses compagnes) | fort | la Caldeira de cendre |

Un sort coûte sa forme plus sa matière, en éclats du sac : de 8 (Trait de fange) à 20 (Mur ou Égide de braise). Le Manteau d'éclats, les Champs de cristal et la potion de mana les allègent, comme pour les anciens sorts. L'effroi ne prend ni sur les gardiens de portail, ni sur les horreurs, ni sur les dragons, ni sur les automates ; un gardien de portail se remet plus vite de tout le reste. Une bête tuée par un sort laisse son butin, comme à l'arme.

**La bibliothèque**, dernier module de l'anneau (au fond, face à l'entrée). Elle se crée grâce à l'établi (40 bois · 20 pierres · 30 éclats) et s'améliore deux fois (60 bois · 70 éclats · 20 os, puis 30 ferraille · 120 éclats · 80 bois). Son grimoire tient **trois sorts**, puis **cinq**, puis **sept**. Les niveaux 2 et 3 ouvriront les mélanges et les accents, dans une prochaine livraison. Devant elle, ACTION propose MAGIE.

**Le volet Magie** du Campement. À gauche, les six matières avec le tome lu (I, II, III) et où trouver le premier, puis les cinq formes. À droite, le **pupitre** : on choisit une forme et une matière, la phrase s'affiche avec son nom, ce qu'elle fait, son prix ; « Inscrire au grimoire » coûte 10 éclats d'encre et demande d'être au pupitre. Dessous, **le grimoire** : chaque sort inscrit se range dans une case du bord droit (ceinture), se tient en main (la touche X le lance), ou s'efface (deux appuis). Sur téléphone, les six volets tiennent sur une ligne, sans vignette.

**Les tomes.** Trois par matière ; le Tome I l'apprend. Depuis §86 ils se trouvent dans le monde (lutrins, coffres gardés, conteur, Tisseuse) ; le bouton bêta « Tomes : n/3 » les donne toujours. Une exception : le vieux grimoire **Souffle** vaut le Tome I du vent, et à la création de la bibliothèque « Onde de vent » est inscrite d'office.

**Les quatre grimoires de l'établi** ne changent pas. Si l'un d'eux est équipé, c'est lui que lance la case bonus (touche L, voir §89).

Les accords, les accents et le Codex sont en §87 ; les sorts entre joueurs en §88. **Pas vérifié** : à deux joueurs, et sur une faune partagée dont on n'est pas le gardien.

**Bêta** : « Bibliothèque n/3 » et « Tomes : n/3 ».

Testé : la bibliothèque refusée sans établi, créée (« Onde de vent » offerte), montée à 3 ; une matière inconnue refusée, l'encre payée, le doublon et le grimoire plein refusés, rien loin du pupitre ; le trait des six matières sur un bossu (dégâts, englué, repoussé, perdu de vue, en fuite, brasier), sans cible, avant le délai, sans éclats, effacé ; l'onde (trois bêtes touchées, une épargnée à 6,5 cases) ; le piège (rien à 2,5 cases, déclenché dessus, trois au plus) ; le mur (un traqueur en colère tenu derrière pendant huit secondes, puis il passe ; un tir ennemi arrêté ; son propre trait qui passe) ; l'égide (blessure ×0,67, l'attaquant englué, dix secondes) ; un brasier de sort (0,17 de vie en trois secondes sur un bossu, le joueur indemne, le butin à la mort) ; les cases, la touche X, le grimoire équipé qui garde la main ; la sauvegarde relue, gonflée puis ramenée aux bornes ; la page à l'écran, au clic, sur téléphone ; les essais des sections précédentes repassés.

Dans le code : `FORMES`, `MATIERES`, `phraseDe`, `nomPhrase`, `coutPhrase` ; `P.tomes`, `P.sorts`, `P.sortMain`, `P.egide`, `tomeDe`, `inscrireSort`, `effacerSort`, `tenirSort` ; `lancerPhrase`, `sortTrait` / `sortTouche`, `sortOnde`, `sortPiege`, `sortMur`, `sortEgide`, `matiereSur`, `frapperSort`, `toucherSort`, `brasierSort`, `viseSort` ; `SORTS_POSES`, `majSorts`, `murSort`, `sortOs` / `sortDecor` / `sortEmit` ; `pageBiblio`, `biblioOs`, `magieLue` ; les cases portent `sort:forme.matière`. Le huitième groupe de deux bits de `modsDits` porte le niveau de la bibliothèque.

## 86. La magie, deuxième livraison : les tomes dans le monde

Les tomes ne se donnent plus seulement en bêta : **on les trouve en explorant**, on les **porte**, et on les **déchiffre** au pupitre de la bibliothèque. Rien ne change dans les sorts de §85 ; les Tomes II et III se trouvent et se lisent déjà, mais ne servent qu'à la troisième livraison (mélanges, accents).

| Tome | Où il se trouve | Comment |
|---|---|---|
| **I** | sur un **lutrin de pierre**, dans le biome de sa matière | ACTION « LIRE » : on le recopie, le lutrin reste |
| **II** | dans les **coffres gardés** du Centre des automates, ou chez le **conteur** des Nomades | coffre du gardien 15 %, grand coffre de l'Horloge 50 % ; le conteur en cède un par halte, 40 éclats, offert à un ami |
| **III** | la **Tisseuse de fer** le porte | il tombe avec elle, la première fois qu'on la terrasse sur une île |

**Le lutrin.** Un par matière dont le biome pousse sur l'île : fange → Tourbière, vent → Canyon d'ocre, spore → Sylve fongique, cristal → Champs de cristal, braise → Caldeira de cendre (jamais sur une plaque vive), effroi → Ossuaire ou Terres creuses (un seul lutrin si l'île porte les deux). Sa place ne dépend que de la graine : **tous les joueurs le voient au même endroit**, et chacun peut le lire. Il est posé à plat, hors de l'eau, sans rien qui y pousse, à sept cases au moins de l'arche, et plutôt au cœur du biome qu'en lisière. Tant qu'on ne l'a pas lu, ses pages ont la couleur de la matière, un signe flotte au-dessus et des étincelles en montent ; **la nuit le livre luit**, avec un fil de lumière qui se voit de loin. À moins de quatorze cases, un message l'annonce et il se marque **à la boussole** (un petit livre de la couleur de la matière) jusqu'à ce qu'on l'ait lu. Une fois lu, le livre est terne et l'action devient « RECOPIÉ » puis « DÉJÀ LU ».

**Porter et déchiffrer.** Un tome trouvé va dans les **tomes rapportés** : il ne pèse rien, ne prend pas de place, et ne se perd pas en tombant à la surface. Le volet Magie les liste en tête, même sans bibliothèque, avec ce qui manque pour les lire. On les déchiffre **au pupitre**, contre de l'encre : **10, 25 et 45 éclats** pour les Tomes I, II et III, et **dans l'ordre** (pas de II sans le I). Le Tome I rend la matière inscriptible ; chaque ligne de matière dit où chercher le suivant.

**Le Souffle** vaut toujours le Tome I du vent : avec lui, le lutrin du canyon répond « DÉJÀ LU » et le Tome II du vent se déchiffre directement.

**Sous terre**, un tome suit la règle du butin : trouvé en bas, il n'est à soi qu'une fois remonté ; terrassé, on le perd (il est cité dans « perdu : … ») ; en descente d'essai, rien n'est gardé.

**Le tirage.** Un coffre, le conteur et la Tisseuse donnent toujours un tome qu'on n'a pas (ni lu, ni dans le sac), et **d'abord d'une matière dont on tient déjà le tome précédent**. Le conteur propose le même tome tant que la halte dure. Quand tous les tomes d'un rang sont là, il n'y en a plus.

**Le conteur.** Nouvelle question, « Que sais-tu des tomes ? » : il dit **vers où se trouve chaque lutrin non lu de l'île** (ce qui le marque à la boussole), cède son Tome II, et raconte six indices sur les tomes.

**Bêta** : « Tome rapporté +1 » (met au sac le prochain tome manquant) et « Aller au lutrin » (grisé sur une île sans biome de matière). « Tomes : n/3 » continue de tout donner.

**Ce que j'ai décidé seul** : le lutrin se recopie au lieu de se ramasser (pour que plusieurs joueurs le lisent) ; un tome ne se lit pas sur place, il faut le pupitre ; les prix d'encre et les chances des coffres ; un tome par halte chez le conteur ; pas de niveau de bibliothèque exigé pour déchiffrer ; on traverse le lutrin, il n'arrête pas le pas ; un lutrin aperçu s'oublie à la boussole quand on recharge l'île.

Les accords, l'instabilité, les accents et le Codex sont en §87. **Pas vérifié** : à deux joueurs réellement connectés ; le rendu en canvas, sans WebGL 2.

Testé : un lutrin posé pour chacun des six biomes (à plat, dans son biome, sans flore, loin de l'arche), un seul quand l'ossuaire et les terres creuses sont ensemble ; l'annonce à l'approche, « LIRE », le tome au sac, « RECOPIÉ », le repère de boussole qui apparaît puis s'efface ; les refus du pupitre (sans bibliothèque, loin du pupitre, sans encre, sans le tome précédent), l'encre payée, la matière apprise ; le Souffle ; la sauvegarde (aller-retour, clés invalides, doublons, vieille sauvegarde sans tomes) ; les tirages ; un Tome II dans le grand coffre, gardé en remontant, perdu en tombant, rendu en essai ; le Tome III à la chute de la Tisseuse ; le conteur (lutrin indiqué, troc payé, grisé sans éclats, offert à un ami, un seul par halte) ; la page à l'ordinateur et au téléphone ; les boutons bêta ; les essais de §85 rejoués sans écart.

Dans le code (`index.html`) : `LUTRINS`, `BIOME_MATIERE`, `placerLutrins` (appelé après `placerPortailIle`), `lutrinOs`, `majLutrins`, `lutrinProche`, `lutrinAction`, `lireLutrin` ; `P.tomesPortes` (clés `matière.rang`), `P.tomeHalte`, `tomeLu`, `nomTome`, `tomePorte`, `tomeAcquis`, `gagnerTome`, `tomeManquant`, `rangerTomes` ; `DECHIFFRE`, `freinTome`, `dechiffrerTome`, `blocTomesPortes`, `ouTome` ; `TOME_COFFRE`, `tomeCoffre`, `tomeTisseuse`, `TOME_CONTEUR`, `tomeConteur` ; les lutrins passent par `sortDecor` / `sortEmit`, et par `reperes` pour la boussole. `donjon.js` : `djOuvrir`, `djButin`, `djRendre` (`DJ.etat.tomes`). `nomades.js` : `NM_INDICES.tomes`, `nmTomes`, les nœuds `tomes` et `tomesPlus` du conteur. Aucun changement dans la base.

**À déposer** : `index.html`, `donjon.js`, `nomades.js` et `sw.js` (qui passe en `stone-valley-54`).

## 87. La magie, troisième livraison : les accords, les accents, le Codex

Une phrase peut maintenant **mêler deux matières** et porter un **accent**. Ce qu'on a écrit se retrouve dans un **Codex**, et un sort inscrit peut recevoir **le nom qu'on veut**.

**Les accords** (bibliothèque de niveau 2, Tome I des deux matières). L'ordre des deux matières ne compte pas : quinze paires. Le prix d'un accord est la somme des deux matières ; l'encre pour l'inscrire passe à **20 éclats**. Neuf accords sont **simples** : les deux effets à la fois, avec le coup de la plus forte des deux. Six sont **remarquables** : ils ont un nom, une couleur et un effet à eux, **et ne les disent qu'une fois inscrits** — avant, le pupitre annonce seulement « accord jamais essayé ». Chaque matière entre dans deux accords remarquables, pas plus.

| Accord | Matières | Coup | Ce qu'il fait |
|---|---|---|---|
| **Poix** | fange + braise | ×1 | englue, et la bête brûle tant qu'elle est prise (une brûlure toutes les demi-secondes) ; pas de brasier au sol |
| **Gangue** | fange + cristal | ×1,1 | fige moitié plus longtemps, et tout ce qui frappe la bête figée pèse moitié plus (armes et compagnes comprises) |
| **Nuée** | vent + spore | ×0,5 | repousse, et toutes les bêtes à cinq cases perdent le joueur de vue |
| **Épouvante** | vent + effroi | ×0,5 | repousse, et toutes les bêtes à sept cases prennent la fuite |
| **Grisou** | spore + braise | ×1 | explose : les bêtes à trois cases prennent la moitié du coup, et le sol brûle |
| **Glas** | effroi + cristal | ×1,6 | perce, met en fuite, et frappe double une bête qui a perdu la moitié de sa vie |

**L'instabilité.** Un accord dont on n'a pas lu **les deux Tomes II** est instable : **un lancer sur quatre tourne mal**, un sur huit si l'on tient un des deux. Une fois sur deux la phrase **se défait** (les éclats du lancer sont perdus, rien ne part) ; l'autre fois c'est la **brûlure d'éclat** : autant d'éclats de plus partent en fumée (dans la limite du sac) et le joueur perd 12 % de sa vie, sans jamais en mourir. Dans les deux cas le délai du sort court. Le pupitre, le grimoire et le Codex disent si un accord est stable.

**Les accents** (bibliothèque de niveau 3, Tome III de chaque matière de la phrase ; +10 éclats d'encre). Un seul par phrase, et il s'accorde : une onde *aiguë*.

| Accent | Prix | Effet |
|---|---|---|
| **Aigu** | +2 éclats | le délai avant de relancer est multiplié par 0,6 |
| **Grave** | +4 éclats | le coup pèse moitié plus |
| **Circonflexe** | +3 éclats | ×1,4 : le trait part plus vite et vise plus loin, l'onde porte à 6,3 cases, le piège se déclenche et frappe plus large, le mur fait sept cases et dure onze secondes, l'égide quatorze |

**Le Codex.** Dans le volet Magie, la colonne de gauche bascule entre « Tomes et formes » et « Codex » : les quinze paires (« jamais essayé », accord simple ●, accord remarquable ★ avec son nom et son effet, stable ou non), puis les trois accents. Un accord entre au Codex **à sa première inscription** ; l'effacer ensuite ne le fait pas oublier.

**Nommer un sort.** Bouton « Nommer » sur chaque ligne du grimoire : 24 caractères au plus ; vide, il reprend son nom. Le nom donné s'affiche partout (grimoire, cases, messages), le nom d'origine reste écrit dessous. Effacer le sort efface son nom.

**Le pupitre** : forme, matière, puis « Seule » ou la matière qu'on y mêle (niveau 2), puis l'accent (niveau 3). Avant ces niveaux, une ligne dit ce qu'ils ouvriront. Les vignettes des accords portent les deux couleurs, et l'accent en bas à droite ; dans le monde, murs et glyphes alternent les deux couleurs.

**Le conteur** a neuf indices de plus : un par accord remarquable, l'instabilité, les accents, le nom des sorts.

**La clé d'une phrase** : `forme.matière`, `forme.matière+matière`, et `~accent` à la suite (`onde.vent+spore~aigu`). Les vieilles sauvegardes se lisent telles quelles.

**Bêta** : « Codex : n/15 » fait connaître les quinze accords, puis revient à ceux qui sont inscrits.

**Ce que j'ai décidé seul** : quels accords sont remarquables, leurs noms et leurs effets ; les neuf autres donnent simplement leurs deux effets ; un sur huit avec un seul Tome II ; la brûlure ne tue pas ; les trois accents et leurs chiffres ; le Tome III exigé pour chaque matière d'un accord accentué ; le nom d'un accord caché jusqu'à l'inscription.

Les sorts sur les autres joueurs, et leur dessin chez les autres, sont en §88. **Pas vérifié** : à deux joueurs réellement connectés, et sur une faune partagée dont on n'est pas le gardien.

Testé : les clés (ordre des matières, clés fausses), les noms avant et après découverte, les prix ; les refus (Tome I, niveau 2, niveau 3, Tome III) ; l'inscription d'un accord remarquable puis d'un simple, l'encre, le Codex ; l'instabilité (défaite, brûlure, lancer réussi, un seul Tome II, les deux, sac presque vide et joueur presque mort, 1 012 ratés sur 4 000 lancers) ; les six accords remarquables et un simple sur des bêtes placées à distance (rayons de trois, cinq et sept cases, brûlure de la poix dans le temps, gangue ×1,5, glas doublé) ; les trois accents sur les cinq formes ; l'onde, le trait, l'égide et le mur avec un accord ; la sauvegarde (aller-retour, clés à l'envers, doublons, données fausses, vieille sauvegarde) ; le nom d'un sort (nettoyé, tronqué, effacé avec lui) ; la page aux niveaux 1, 2 et 3, à l'ordinateur et au téléphone ; les vignettes ; une case de raccourci ; les essais de §85 et §86 rejoués sans écart.

Dans le code (`index.html`) : `ACCENTS`, `ACCORDS`, `MELANGES` (les quinze entrent aussi dans `MATIERE`, avec `mix`, `acc`, `col2`, `feu`), `INSTABLE`, `phraseDe` (rend aussi `del`, `deg`, `amp`), `nomPhraseNu`, `nomPhrase`, `accordConnu`, `dessinSort`, `icSort` ; `encreDe`, `freinPhrase`, `instabilite`, `sortRate`, `nommerSort` ; `zoneSort`, `matiereSur`, `toucherSort`, `poixFin` et la boucle de la poix dans `majSorts`, `robuste` (la gangue) ; `P.codex`, `P.nomsSorts`, `pupitre` (`m2`, `a`, `vue`, `nomme`), `clePupitre`, `blocCodex`, `pageBiblio`. `nomades.js` : `NM_INDICES.tomes`. Aucun changement dans la base.

**À déposer** : `index.html`, `nomades.js` et `sw.js` (qui passe en `stone-valley-55`).

## 88. La magie entre joueurs : ce qu'on en voit, ce qu'on en prend

Jusqu'ici un sort n'existait que chez celui qui le lançait. Maintenant **les autres le voient**, et **il les touche**. La règle est celle des coups d'arme : celui qui lance décide qu'il a touché, celui qui est touché décide de ce qu'il encaisse.

**Ce qu'on voit d'en face** : le trait en vol, l'anneau de l'onde, le glyphe d'un piège, les stèles d'un mur, les étincelles d'une égide autour de l'autre joueur, un sort qui se défait ou qui brûle. Qui arrive sur l'île reçoit les pièges et le mur déjà posés ; ils disparaissent quand leur auteur part.

**Ce que fait chaque matière sur un joueur** (le coup est celui de la forme, pesé par la matière, divisé par le danger de l'île, puis réduit par l'armure et les potions de celui qui le reçoit) :

| Matière | Sur un joueur |
|---|---|
| Fange | englué deux secondes : ni pas, ni saut |
| Vent | projeté loin du lanceur |
| Spore | **des spores plein les yeux**, quatre secondes : la vue se referme en un rond étroit, et les autres joueurs sortent de la boussole |
| Effroi | **saisi d'effroi**, trois secondes : ni coup, ni flèche, ni sort |
| Cristal | le coup le plus fort, rien d'autre |
| Braise | une brûlure de deux secondes et demie (sauf sous un bouillon de braise) |
| Poix | englué et brûlé deux secondes |
| Gangue | englué trois secondes, et **toute blessure pèse moitié plus** pendant ce temps |
| Nuée / Épouvante | projeté et aveuglé / projeté et saisi d'effroi ; les autres joueurs à cinq / sept cases le sont aussi, sans dégâts |
| Grisou | brûlé ; les joueurs à trois cases prennent la moitié du coup |
| Glas | saisi d'effroi, et le coup double sous la moitié de la vie |

Un accord simple donne ses deux effets. Un joueur encore sonné par un coup (une seconde) prend la matière mais pas les dégâts. Les effets en cours s'affichent parmi les états, avec leur décompte — « Englué » aussi, qui n'y était pas.

**Les cinq formes contre un joueur.** Le trait le touche s'il est sur sa route ; il ne le **vise** de lui-même que si on vient de le frapper, ou s'il vient de nous frapper. L'onde prend tous les joueurs de l'anneau, et blesse leurs compagnes sorties. Le piège se déclenche sous le pas d'un joueur. **Le mur d'un autre arrête le pas** (pas le sien), arrête ses traits, et rend sa matière à qui s'y frotte. L'égide rend sa matière à qui nous frappe, à l'arme comme au sort — une seule fois par coup, pour que deux égides ne se renvoient pas la balle.

**Ce qui protège.** Comme pour les armes : rien ne part et rien n'est encaissé près de son campement, ni dans les cinq secondes après une arrivée ; lancer un sort sur quelqu'un fait de nous une cible pour ses tours pendant trente secondes. En plus, **les membres de son groupe d'expédition ne craignent rien de nos sorts** : ni l'onde, ni le piège, ni le mur (qu'ils traversent).

**Ce que j'ai décidé seul** : la protection du groupe d'expédition ; le trait qui ne vise un joueur que s'il y a déjà eu un coup ; les durées ; la spore qui voile la vue et l'effroi qui désarme ; le mur d'un autre qui arrête le pas.

**Pas fait** : les effets de matière sur les compagnes des autres (elles ne prennent que les dégâts) ; les flèches, que les murs de sort n'arrêtent pas ; le brasier d'une braise, qui ne se dessine que chez le lanceur. Sur une faune partagée dont on n'est pas le gardien, les effets de matière sur les bêtes sont en §89.

**Pas vérifié** : entre deux joueurs réellement connectés. Tout a été essayé d'un seul côté à la fois, avec un joueur d'en face simulé : ce qu'on envoie, puis ce qu'on reçoit.

Testé (émission) : le trait visé puis droit devant, l'onde, le piège posé puis déclenché, le mur et son frottement, l'égide, un sort raté, le groupe épargné, l'abri du campement, l'épouvante et le grisou qui débordent sur les voisins, l'onde sur une compagne d'en face. Testé (réception) : les six matières, un accord simple et les six remarquables, le glas sous la moitié de la vie, la gangue suivie d'un coup d'arme, deux sorts coup sur coup, un message pour un autre, des données fausses, l'abri, un allié, l'effroi qui empêche de frapper et de lancer, l'égide qui rend (et ne rend pas un coup rendu), le voile et la boussole. Testé (dessin) : un trait d'en face qui finit sans blesser, les données fausses refusées, le piège fantôme qui ne se déclenche pas, trois pièges au plus par joueur, les retraits, le mur d'un autre qui arrête le pas (pas celui d'un allié, pas le sien), son trait arrêté par notre mur, un mur trop long refusé, les durées bornées, l'arrivant qui reçoit nos poses, le départ qui les efface. Les essais de §85 et §87 rejoués sans écart.

Dans le code (`index.html`) : un seul événement de réseau, `sort`, avec `q` = `tir`, `onde`, `pose`, `ote`, `egide`, `rate` ou `touche` ; `direSort`, `poseDite`, `envoyerSortsPoses`, `toucherJoueur`, `recevoirSort`, `etreTouche`, `matiereSurMoi`, `allieSort`, `SORT_JOUEUR`, `ZONE_JOUEUR`, `voileSpore`, `majSortsJoueurs` ; les poses d'un autre portent `fantome`, `u`, `gid` ; `murSort(…, moi)` ; `P.trouble`, `P.effroi`, `P.gangue` (dans `vieK`). Aucun changement dans la base.

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-56`).

## 89. Quatre choses : la faune partagée sous les sorts, la case bonus, la recharge, les couleurs de rareté

### La magie sur une faune partagée

Sur une île à plusieurs, un seul appareil fait vivre les bêtes (le gardien, §57). Jusqu'ici, la matière d'un sort lancé par un suiveur ne touchait que sa copie de la bête : elle prenait les dégâts, mais n'était ni figée, ni repoussée, ni mise en fuite. Maintenant le suiveur **dit la matière au gardien**, qui la joue sur la vraie bête, avec le lanceur comme origine : le vent pousse loin de lui, la spore fait oublier ce joueur-là, l'effroi fait fuir devant lui, et les accords qui débordent (nuée, épouvante) prennent les voisines chez le gardien. La poix et le grisou passaient déjà par les coups. Le gardien dit en retour quelles bêtes sont **engluées** ou **prises dans la gangue** : chez tous, un coup sur une bête en gangue pèse moitié plus. La **boule visqueuse** d'une compagne suit le même chemin.

### La case bonus, et une vraie touche pour le sort en main

**Un défaut corrigé** : depuis §85 le grimoire disait « Tenir (X) », mais X est la touche d'attaque et rien ne lançait le sort tenu en main. Il fallait une ceinture et une case. Désormais :
- le sort en main a **sa propre case**, au-dessus des autres au bord droit, cerclée de violet, **même sans ceinture** ; un appui le lance ;
- au clavier, c'est la touche **L** ;
- si un grimoire de l'établi est équipé, c'est lui que montre et que lance cette case ; sans sort en main, elle montre un livre grisé tant qu'on a des sorts inscrits.

Une **égide** en cours s'affiche aussi parmi les états, en haut à gauche, avec sa vignette et son décompte.

### La recharge, comme une aiguille

Sur chaque case de sort (la case bonus comprise), le délai avant de relancer se voit : un voile sombre couvre la vignette et **se retire en tournant** depuis le haut, bordé d'un trait clair ; les **secondes** s'égrènent au milieu (au dixième sous la seconde) ; la case **luit un instant** quand le sort est de nouveau prêt.

### La rareté, en couleurs

Tout ce qui a un rang le dit de la même façon : **son nom et le tour de sa vignette**.

| Rang | Couleur |
|---|---|
| commun | neutre |
| peu commun | vert |
| rare | bleu |
| très rare | violet |
| légendaire | or |
| épique | rouge (rien ne l'est encore) |

Ce qui la porte :
- **les ingrédients** (viandes, poissons, produits de la flore, nectar) : au sac, à la cuisine, à l'alchimie ;
- **les poissons** du carnet de pêche ;
- **les biomes** de l'atlas (l'effroi et le village gardent leur couleur propre : ce ne sont pas des rangs) ;
- **les bêtes** : chacune a la rareté de sa viande (coursier vert, orange bleu, rouge violet, aurore or) ; une **robe rare** la monte au moins à bleu, une **forme extrêmement rare** à or. Cela se lit sur la bête visée, dans la liste et la fiche des compagnes, au carnet des variantes ;
- **les plantes rares**, sur la bête visée et sur le bouton d'action ;
- **les druses** : lavande en violet, dorée en or, sur le bouton d'action ;
- **les plats** : la couleur de leurs étoiles (2 vert, 3 bleu, 4 violet, 5 or), au sac, au livre de recettes et sur les cases du bord droit.

Une légende rappelle l'échelle au garde-manger et en tête de l'atlas.

**Ce que j'ai décidé seul** : la touche L ; la case bonus affichée même vide dès qu'on a un sort ; l'échelle exacte (le commun reste neutre, l'épique en rouge) ; la rareté d'une bête tirée de celle de sa viande ; les druses rangées d'après leur teinte (lavande violet, dorée or) plutôt que d'après leur fréquence ; les étoiles d'un plat comptées comme une rareté.

**Pas fait** : les objets de l'établi (ils ont un étage, pas une rareté) ; les messages qui défilent (« biome découvert », le butin) restent d'une seule couleur. **Pas vérifié** : la faune partagée entre deux joueurs réellement connectés — essayée d'un côté puis de l'autre, avec un joueur d'en face simulé.

Testé : en suiveur, la matière dite au gardien pour une matière simple, un accord de zone, le grisou, la poix dans le temps, rien pour une bête sans numéro, la boule visqueuse ; en gardien, les six effets joués avec le bon lanceur (poussée loin de lui, « oublie » et « fuit » ce joueur), l'épouvante sur la voisine, la gangue redite aux suiveurs, les données fausses et les messages pour un autre ignorés. La case bonus sans sort, avec des sorts mais aucun en main, avec un sort en main, sans puis avec ceinture ; la touche L ; l'appui ; la recharge au début, à mi-course, à la fin, et l'éclat de fin ; l'égide parmi les états. Les aides de rareté, puis à l'écran le sac, la cuisine, l'atlas, le carnet de pêche, la bête visée. Les essais de §85 à §88 rejoués sans écart.

Dans le code (`index.html`) : `matiereSur(o, m, de)`, le geste `matiere` et le geste `englue` (`fauneGeste`) ; `KeyL`, la case `data-sortx` dans `majCases`, `majRecharge`, les styles `.bonus`, `.cd`, `.cd-on`, `.pret` ; `NOM_RARE`, `RANG_RARE`, `clRar`, `nomRare`, `rareIngr`, `rareEspece`, `rareVariante`, `rareBete`, `rareIcone` (lu par `caseObjet`), `qPlat`, `legendeRare`, les styles `.rar2`…`.rar6` et `.case.r2`…`.r6`. `faune.js` : `gesteDistantFaune` (`matiere`, `englue`), `etatFaune` et `appliquerFaune` (`eg`, `gg`). Aucun changement dans la base.

**À déposer** : `index.html`, `faune.js` et `sw.js` (qui passe en `stone-valley-57`).

## 90. De la matière partout : les bêtes, le héros, le campement, les troncs, les décors

Le sol avait son grain, les maisons du village aussi. Tout le reste était en aplat. Chaque pièce dessinée porte maintenant un motif, toujours selon le même principe : du noir et du blanc transparents posés sur la couleur. **Aucune teinte ne change**, tout prend du grain.

**Onze motifs de plus** : pelage, plume, écaille, chitine, métal riveté, écorce, toile, tissu (sergé), cuir, peau nue, corde.

**Qui porte quoi**

| Quoi | Matière |
|---|---|
| Rampants (brouteur, bossu, glaneur, traqueur, spectre), Mille-gueules, oglodon | chitine |
| Automates, machines du souterrain, Tisseuse de fer | métal riveté |
| Coursiers, sterne | plume |
| Doux, félin, bramard | pelage |
| Dragon, varan, salamandre | écaille |
| Crapaud-buffle | peau nue |
| Vesseron | mycélium |
| Cerf de verre | facettes |
| Silencieux | os |
| Autres Telluriens | roche |
| Nomades, villageois | tissu |
| Le héros et les autres joueurs | tissu pour l'habit, cuir pour le sombre ; **la peau reste lisse** |
| Le campement, la marmite, le lutrin, la pêche, la fourmilière | d'après la couleur de chaque pièce : le gris est de la pierre taillée (du fer s'il est sombre), le brun du bois en planches, le vert et le clair de la toile, le vif de l'étoffe |
| Le souterrain | pareil, mais le gris y est de la tôle |
| Les arches | pierre taillée pour les montants et le linteau ; le voile reste lisse |
| La flore | les troncs et les branches prennent de l'écorce ; le feuillage garde son motif |
| Les plantes rares | feuillage, écorce ou herbe, d'après la couleur de chaque pièce |

Ce qui luit (flammes, cristaux, sorts, yeux, voiles) reste lisse : un motif y éteindrait la lumière.

**Le grain à la mesure de la pièce.** Avant, une tuile de 16 pixels était étirée sur chaque face, quelle que soit sa taille : fine sur une patte, énorme sur un grand sapin. Les pièces nouvellement texturées, et **tout le feuillage**, mesurent maintenant leurs faces : le grain a la même taille partout (une tuile et demie par case pour le feuillage, deux pour le bâti et les troncs, deux et demie pour les bêtes, quatre pour le héros), et il est décalé d'une pièce à l'autre pour ne pas se répéter. Les maisons du village, qui avaient déjà leur matière, ne changent pas.

**Le réglage « Textures »** coupe tout cela comme avant.

**Ce que j'ai décidé seul** : les onze motifs et leur dessin ; la matière de chaque famille ; la matière du campement devinée d'après la couleur des pièces, plutôt que notée pièce par pièce ; le feuillage repris à la mesure ; la peau du héros et ce qui luit laissés lisses.

**Pas fait** : le rendu en canvas (sans WebGL 2) ne reçoit pas ces nouvelles matières. **Pas vérifié** : en mouvement sur un vrai téléphone. Le grain, plus fin que celui du sol, peut scintiller de loin ; s'il gêne, une ligne règle chaque densité.

Testé à l'écran : le campement (plancher, établi, coffre cerclé de fer, tente, muret), le héros, seize bêtes de toutes les familles, une forêt de pins, une arche, un lutrin, le souterrain et son coffre. Les essais de §85 à §89 rejoués sans écart.

Dans le code (`index.html`) : `TEX.pelage` … `TEX.corde`, `MAT_CORPS`, `MAT_FAM`, `matiereEspece`, `matiereCouleur(c, genre)` (genres `bati`, `corps`, `flore`, `pierre`, `tronc`, `meca`) ; dans le rendu, `kCouleur`, `kEspece`, et un dernier argument `dens` à `boite` (tuiles par case ; 0 : une tuile étirée, comme avant). Les numéros de tuile se rangent désormais par paquets de 128 au lieu de 64 (`K`, et `vK` dans le programme de sommets) : il y a plus de 63 tuiles.

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-58`).

## 91. Le dragon revu : la marche, le sommeil, les poses au sol

Une vérification complète du dragon à plumes (§44), mesurée os par os : pour chaque pose, on regarde si un os passe sous le sol, si les pattes marchent sur place, si la bête saute. Ce qui était faux, et ce qui change :

- **Les pattes qui marchaient sur place.** Posé après un vol, le dragon gardait sa vitesse de vol : au sol, ses pattes continuaient de pédaler sans qu'il avance (plus de 2 000 images sur 2 600 dans l'essai). Au sol, sa vitesse est désormais celle qu'il a vraiment ; ses pattes ne bougent plus que lorsqu'il marche ou **tourne**.
- **Les demi-tours d'un coup.** Il pivotait instantanément pour faire face à vous ou à sa proie. Il tourne maintenant sur place, à son pas (environ 90° par seconde), en piétinant. Endormi, il ne tourne plus du tout.
- **Le sommeil.** En s'endormant, la tête et le cou s'enfonçaient dans le sol (jusqu'à près d'une demi-case) et les genoux se croisaient sous le ventre. Le sommeil vient maintenant doucement : le cou descend puis se couche à plat, la tête se pose, les pattes se replient sur les côtés, la respiration ralentit.
- **Les pieds** étaient à moitié dans le sol ; ils sont posés dessus, griffes au ras.
- **En mangeant**, la tête et surtout la mâchoire ouverte passaient sous le sol. La tête descend un peu moins bas, et la mâchoire s'ouvre au plus jusqu'au ras du sol.
- **Où il se pose.** Posé face à une marche ou dans un creux, il s'enfonçait dans la pente en dormant (cou, tête, ailes). Il choisit désormais son aire : un sol où rien ne dépasse sous son corps, les quatre pattes à plat, ni arbre ni dalle autour, de l'eau à la rigueur. Faute d'aire parfaite, il prend la moins mauvaise et se pose sur le haut du relief. Cela vaut pour son nid (le plus haut sommet **plat** de l'île), pour se poser près de vous (à quatre cases au plus de l'endroit visé, sinon il redécollerait aussitôt), près du campement, près d'une proie, et quand vous le rappelez ou le renvoyez au campement.
- **Le nid** ne peut plus tomber dans un arbre.

**Ce que j'ai décidé seul** : la vitesse de rotation ; la façon de se coucher (cou à plat, tête tournée vers le flanc) ; le barème qui classe les aires (une marche sous le corps compte bien plus qu'un arbre, un arbre plus qu'une flaque) ; si la seule aire possible près de vous l'obligerait à se percher sur une marche de plus de deux cases, le dragon apprivoisé continue de tourner au-dessus de vous plutôt que de s'y poser.

**Pas vérifié** : sur un vrai téléphone ; les anciennes parties dont le nid est déjà placé sur un relief gardent ce nid (il n'est pas déplacé).

Testé : sept poses × quatre caps sur sol plat, aucun os sous le sol ; six minutes de vie (jour puis nuit), deux minutes de nuit au nid, un dragon apprivoisé qui vous suit, s'arrête, se pose et s'endort près de vous : aucun os sous le sol, aucune valeur aberrante, aucun saut ; les quatre poses regardées à l'écran. Les essais de §85 à §90 rejoués sans écart.

Dans le code (`index.html`) : `majDragon` (rotation au sol, `b.vit` au sol), `osDragon` (`dk`, le sommeil lissé ; `COU_DORT` ; la mâchoire bornée), `aireDragon(x, y)` (null, ou `{ z, c }` : la hauteur où se poser et le coût, 0 = parfait), `lieuDragon(b, x, y, R)` (la meilleure aire près d'un point, gardée dans `b.aire`), `poserDragon` (le nid). Dans `faune.js`, le dragon vu par les autres joueurs suit la même règle de vitesse au sol.

**À déposer** : `index.html`, `faune.js` et `sw.js` (qui passe en `stone-valley-59`).


## 92. Les horreurs du Korlaz revues : le Décharné, la Silhouette, ce que voit l'infecté

Les visions du Korlaz (§46) n'étaient pas crédibles. La cause principale était un défaut de rendu : **les épaisseurs des pièces ne suivaient pas la taille de la bête**, seules les positions la suivaient. Le Décharné, qui est petit, avait donc des volumes 1,7 fois trop épais : d'où sa tête en cube et son air de robot. La Silhouette, qui est grande, avait au contraire des membres 1,3 fois trop minces : des bâtons. Depuis le §90, le Décharné prenait en plus la matière « pierre », à cause de sa couleur grise. Ce qui change :

- **Le Décharné**, refait pièce par pièce : voûté, la colonne droite au bassin puis courbée, les vertèbres qui saillent dans le dos, le cou maigre qui pousse la tête en avant. Un **crâne en œuf** (voûte, dôme, occiput, tempes creuses, arcade qui avance) sur un visage étroit qui finit en menton pointu. **Deux grandes orbites noires** au fond desquelles luit une pupille minuscule, l'arête du nez, deux fentes pour narines, des pommettes saillantes sur des joues creuses, une bouche fine qui s'ouvre en trou noir sur deux rangées de petites dents. Des côtes qu'on compte, en chevrons du sternum vers les flancs, et qui respirent ; le ventre rentré, le bassin et ses crêtes, les clavicules, les omoplates. Les bras descendent jusqu'aux genoux : coudes et poignets noueux, quatre doigts à deux phalanges qui se recourbent, des ongles. Les jambes sont en X et un peu fléchies, avec de gros genoux et de longs pieds. Des veines sombres sur les membres et le crâne. La peau est pâle, lisse, couleur cadavre. Il vous regarde par en dessous, la tête qui penche.
- **La Silhouette** : une taille de guêpe sous une poitrine étroite, des épaules hautes et pointues, voûtée ; un long cou qui plie vers l'épaule ; une tête petite, étirée en hauteur, **couchée sur l'épaule**, avec seulement deux points blancs. Des bras à trois articulations qui descendent sous les genoux, des mains aux **cinq longs doigts qui remuent** ; des jambes qui **se défont en fumée** ; des volutes d'ombre qui se détachent du dos. Quand elle se rue, elle se couche presque à l'horizontale, les mains ouvertes en avant, les jambes traînant derrière elle en fumée. Elle est d'un noir mat, sans matière.
- **Les têtes penchent pour de bon** : jusqu'ici, une tête inclinée gardait ses volumes d'aplomb (un escalier de boîtes). Une pièce peut maintenant donner son propre « haut », et elle tourne avec lui (`o.ref`, `refBete`). Seules les visions s'en servent ; les autres bêtes ne changent pas.
- **Ce que voit l'infecté** : le sang coule en vraies coulures (une tache en haut de l'image, un filet qui ondule, une goutte plus lourde au bout, un reflet) au lieu de traits droits. Les vrilles noires qui rentrent par les bords sont effilées, au bord flou, et ondulent. Le visage dans la brume se lit enfin : un crâne à peine plus clair que la brume, l'arcade, les pommettes, deux orbites où luit une pupille, une bouche ouverte en long.

**Ce que j'ai décidé seul** : les deux silhouettes et leurs proportions (le Décharné fait environ 1,10 m, la Silhouette un peu plus de 3 m) ; la peau lisse plutôt que grenue (la matière « peau » le faisait ressembler à de la pierre) ; la couleur cadavre ; garder le style en volumes du jeu plutôt que de chercher le réalisme.

**Pas fait** : le rendu en canvas (sans WebGL 2) garde les têtes d'aplomb. **Pas vérifié** : sur un vrai téléphone ; l'effet en mouvement (les tests regardent des images arrêtées et une minute de visions en simulation).

Testé : les deux visions regardées de face, de profil, de près et de loin, en 1re personne et en vue 3D, debout, surgie et ruée ; le Décharné bouche ouverte ; l'image de l'infecté avec le sang, les yeux, la brume et le visage. Quarante visions en simulation (Décharnés, Silhouettes qui surgissent puis se ruent) : aucune valeur aberrante, aucune erreur. Les essais de magie, de faune et de textures rejoués sans écart.

Dans le code : `etats.js` — `osIllusion` (les épaisseurs mises à l'échelle par `K` ; les repères `rep`, `tete`, `cadre`, `chaine` ; `bloc`, un volume posé dans un repère), `dessinerFiltre` (les vrilles, le visage, le sang) ; `index.html` — `refBete` et les deux lignes qui posent les pièces des bêtes en 3D, `matiereEspece` (les visions : `lisse`, sans matière).

**À déposer** : `index.html`, `etats.js` et `sw.js` (qui passe en `stone-valley-60`).

## 93. Korlaz : plus de visions, des griffes sur l'image, le mycélium, le noir et blanc

L'infecté voit davantage de choses, et ce qu'il voit lui colle à la peau.

- **Le mycélium** remplace les grosses vrilles noires. Ce sont des filaments noirs, fins, ramifiés, qui poussent des bords de l'image, surtout du bas, là où est le corps. Ils ondulent à peine, et leur front de pousse luit d'un vert pâle. Au début de l'infection, ce n'est qu'une frange ; au bout d'un quart d'heure, ils ont gagné une bonne partie de l'image, et la brume les fait avancer d'un coup. **Sur le corps** (vue 3D), des filaments noirs courent le long des membres du personnage et gagnent avec l'infection, sans toucher au sac ni aux cheveux.
- **Des griffes lacèrent l'image** : trois ou quatre entailles parallèles, en biais, s'ouvrent en un éclair. Chacune a une déchirure noire au bord déchiqueté, de la chair rouge autour et un liseré vif ; il y a des éclaboussures, et chaque entaille saigne en coulure. L'image tremble, avec un bruit de déchirure. Elles remplacent l'ancienne « blessure de nulle part » et viennent aussi quand une Silhouette, un Rampant ou une Main vous frappe. Le coup est réel, mais léger.
- **Le noir et blanc** (nouvelle vision) : le monde se vide de ses couleurs en moins d'une seconde, avec plus de contraste, un grain de vieux film, une rayure et un bord noir, pendant 9 à 19 secondes (plus longtemps quand l'infection dure). Le sang, lui, reste rouge. Dans le gris, des Décharnés vous regardent ; quand la couleur revient, il n'y a plus personne.
- **Le Rampant** (nouvelle vision) : un Décharné à quatre pattes, comme une araignée. Le dos est arqué, les coudes et les genoux plus hauts que l'échine, les mains à plat loin devant ; la **tête est retournée**, le menton en l'air. Il apparaît dans votre dos, et l'on entend des ongles sur la pierre. **Il ne bouge que si vous ne le regardez pas** : dos tourné, il détale (4,6 cases/s) ; regardé, il se fige et sa bouche s'ouvre. Il se dissipe si vous le fixez quatre secondes. S'il vous atteint, il vous griffe.
- **Les Mains** (nouvelle vision) : la terre s'ouvre autour de vous, dans un grondement et des mottes qui sautent. Trois à sept mains sortent l'une après l'autre : un avant-bras gris taché de terre, une main tournée vers vous dont les doigts trop longs griffent l'air. Elles restent quatre à six secondes puis replongent. Si vous passez à moins d'une case d'une main, elle vous **agrippe la cheville** : cloué sur place 1,4 s (l'état « Agrippé »), un coup léger, des griffes.
- La musique ment aussi pour le Rampant qui détale et les Mains qui cherchent : elle sonne comme un vrai danger.
- **Le tirage** : huit visions au lieu de cinq, chacune avec son poids : brume 15, regards 15, griffes 13, visage 8, Silhouette 13, Rampant 12, Mains 10, noir et blanc 8 (14 à la fin de l'infection). Les visions qui ajoutent des êtres ne sont pas tirées quand il y en a déjà trop.

**Ce que j'ai décidé seul** : les deux nouvelles visions (le Rampant et les Mains, que je vous avais proposées) ; leurs vitesses, durées, distances et dégâts ; le noir et blanc qui fait apparaître des Décharnés ; le mycélium tiré au hasard une fois pour toutes (il change si la taille de l'image change) ; le vert pâle du front de pousse ; la couleur et la largeur des entailles.

**Pas fait** : le mycélium sur le corps ne se voit pas en 1re personne (on n'y voit pas son corps : c'est celui des bords de l'image qui le remplace). **Pas vérifié** : sur un vrai téléphone, en particulier le coût du mycélium à l'image (0,6 ms par image ici) ; le son des trois nouveaux bruits (`lacere`, `grattement`, `terre`), que je n'ai pas pu entendre.

Testé : chaque vision forcée quatre fois, avec 3 s de jeu après chacune : aucune erreur, aucune valeur aberrante. Les Mains sortent, griffent et replongent ; le Rampant se fige quand on le regarde ; les Décharnés du noir et blanc disparaissent avec lui. Regardés à l'écran : le Rampant de face, de profil et en vue 3D, les Mains, les griffes (en couleur et en noir et blanc), le mycélium au début et à la fin de l'infection, le corps de l'infecté. Le Décharné et la Silhouette du §92 sont inchangés.

Dans le code : `etats.js` — `vision(I, force)` (le tableau des poids ; `force` impose une vision, pour les essais), `griffer`, `noirEtBlanc`, `mainsDeTerre`, `majIllusion` (les branches `rampant` et `mains`), `osIllusion` (`crane`, la tête partagée par le Décharné et le Rampant ; les modèles `rampant` et `mains`), `mycelium` (la trame), `myceliumHeros` (le corps), `dessinerFiltre` (le noir et blanc, le mycélium, les griffes, les coulures qui partent d'une entaille). `index.html` — `heroBones` (appelle `myceliumHeros`), les sons `lacere`, `grattement`, `terre`, l'état « Agrippé » (`P.agrippe`), la musique de danger.

**À déposer** : `index.html`, `etats.js` et `sw.js` (qui passe en `stone-valley-61`).

## 94. La brume sanglante, première livraison : la brume, la fureur, la valse (nouveau fichier `brume.js`)

Un second état d'île, après le Korlaz (§46). Sur certaines îles, un cercle de mages psalmodie quelque part, et une **brume rouge couvre l'île entière**. C'est une brume magique, et elle rend fou : tout ce qui vit s'y entretue. Le cercle des mages, ses Rôdeurs et son démon : §95.

- **Où** : dès l'exploration 8, environ une île sur dix, tirée de la graine comme le Korlaz (jamais les deux sur la même île). Tous les joueurs d'une même île ont la même brume. Les îles à Korlaz ne changent pas. Repères pour l'onglet Bêta : graines 1, 29, 32, 47 au niveau 8.
- **La vue** : le ciel et l'horizon virent au rouge sombre. En 1re personne, le brouillard commence à 2 cases et devient opaque à 11 ; au-delà, rien n'est plus dessiné. En vue 3D, il se referme autour du personnage, avec un bord rouge sombre qui respire. Des voiles rouges passent sur l'image, et des volutes rouges traînent au ras du sol. Ça marche aussi dans le rendu de secours. Il y a un avis à l'arrivée. Sous terre, pas de brume.
- **La fureur** : chaque bête s'en prend à ce qui vit le plus près d'elle (à 12 cases au plus) : vous, une autre bête, une compagne. Même les herbivores frappent. Ni la faim, ni la peur, ni la fatigue ne l'arrêtent, et elle garde sa cible tant que celle-ci vit. Ses yeux deviennent rouges et luisent, et sa fiche dit « pris de fureur ».
- **Vos compagnes** se retournent contre vous, ou contre la bête la plus proche, et vous frappent pour de bon. Elles ne meurent pas : quand elles tombent, le lien les reprend, comme toujours.
- **Ce que la brume ne touche pas** : les automates (ils n'ont pas de sang), le dragon, les coursiers, la sterne, la Tisseuse, le Silencieux et le Mille-gueules, qui gardent leur comportement. Les visions, la flore et les maisons ne sont jamais prises pour cibles.
- **La valse** : un morceau écrit pour la brume, une composition originale dans l'esprit des grandes valses de combat (aucune mélodie n'est reprise). C'est une valse rapide en ré mineur sur huit mesures : ré mineur, si bémol, sol mineur, la majeur. La basse joue au premier temps, les cordes piquent les deux autres. Plus la fureur rôde près de vous, plus les voix s'ajoutent : un ostinato d'arpèges, un chœur, le violon et sa mélodie, puis les timbales.

**Ce que j'ai décidé seul** : la distance de vue, la portée de la fureur (12 cases), les créatures que la brume épargne, le tempo et la mélodie de la valse.

**Pas vérifié** : la valse, que je n'ai pas pu entendre (le volume de chaque voix est réglé à l'oreille du code : à reprendre si besoin) ; sur un vrai téléphone.

Testé (graine 29, niveau 8) : l'île est bien « brume » et le ciel rouge. En 20 s de simulation avec une compagne liée, deux brouteurs, un traqueur et un cerf : la compagne vous frappe 8 fois, les bêtes s'entretuent (brouteur contre brouteur, traqueur contre cerf…) et vous attaquent, les brouteurs y restent. Regardé à l'écran : en 1re personne, en vue 3D, de jour et de nuit.

Dans le code : `brume.js` (`brumeIle`, `brumeSang`, `fureurIci`, `majBrume`, `dessinerBrume`, `brumeIntensite`) ; `etats.js` (`etatGraine` tire aussi la brume, `etatsIle`, `majEtats`, `dessinerFiltre` l'appellent) ; `index.html` : `couleurCiel` et `bruSang` (le ciel, le brouillard en vue de dessus et dans le rendu de secours), le brouillard de la 1re personne, l'état `furie` dans `majBete`, les yeux rouges dans `foeBones`, la valse (`VALSE`, `valse`) dans la musique.

**À déposer** : `index.html`, `etats.js`, **`brume.js` (nouveau)** et `sw.js` (qui passe en `stone-valley-62` et met `brume.js` en cache).


## 95. La brume sanglante, deuxième livraison : le cercle des mages, les Rôdeurs, le démon

La brume a maintenant sa source, et l'on peut la lever.

- **Le cercle** : sur un replat de l'île, entre 35 et 80 cases de l'arrivée, plutôt en hauteur (la flore y est rasée). Au sol, deux anneaux de runes rouges qui palpitent, un pentagramme et des glyphes. Au centre, un **pilier de lumière rouge** qui monte dans la brume et s'épaissit à mesure que l'incantation avance. La brume empêche de le voir de loin, alors un avis dit régulièrement **d'où vient le chant** (« le chant vient du nord-est · 64 cases »), et la valse enfle à mesure qu'on approche.
- **Les mages** : six, en robe presque noire (des silhouettes dans le rouge), avec une ceinture de corde et des runes qui luisent sur le devant ; sous la capuche pointue, le visage n'est qu'un trou noir où brillent deux yeux rouges. Ils psalmodient les bras levés, et un fil de sang va de leurs mains au pilier. La fureur ne les touche pas, et les bêtes furieuses ne s'en prennent ni à eux ni à leurs Rôdeurs : la brume protège les siens.
- **Quand on approche** (à 13 cases) : deux mages quittent le cercle pour se battre, trois quand il n'en reste que trois ; les autres continuent de chanter. Ils gardent leurs distances en tournant autour de vous. Ils ont trois gestes :
  - le **fouet de sang** : une lanière rouge qui pend, enroulée, à leur main droite. À moins de 5 cases, ils l'arment derrière l'épaule, puis elle claque et file vers vous en ondulant. Elle vous frappe et **vous tire vers eux** ;
  - la **volée** : les deux mains en avant, deux orbes rouges qui grossissent, puis **cinq traits de sang en éventail**. On les esquive de côté ; les traits traversent les autres mages ;
  - **se dérober** : trop près, un mage s'arrache d'un bond de trois cases, dans un nuage rouge.
- **Les Rôdeurs de brume** : dès votre arrivée (au bout de douze secondes, puis toutes les 30 secondes environ, plus vite à mesure que l'incantation avance), le cercle lance dans la brume, autour de vous, un ou deux loups de fumée rouge, trois à la fois au plus. Bas sur pattes, l'échine qui saille, les yeux rouges, des pattes et une queue qui se défont en brume. Ils traquent, se ramassent, la gueule ouverte, bondissent et mordent. Ils sont fragiles et se défont seuls au bout de quarante secondes.
- **Lever la brume** : chaque mage qui tombe l'éclaircit un peu (on voit plus loin). Quand le dernier tombe, **le cercle est brisé** et la brume se lève sur toute l'île en six secondes. La fureur cesse et les Rôdeurs se défont. L'île le garde : pour vous, la brume ne revient plus sur cette île.
- **L'incantation** : sept minutes si les six mages chantent, et elle ralentit à mesure qu'ils tombent (deux fois moins vite quand il n'en reste qu'un). Des avis jalonnent son avancée : le quart, la moitié, les trois quarts, puis « le cercle tremble ». **Si elle s'achève, le démon sort du cercle.**
- **Le démon du cercle** : une brute voûtée d'environ cinq mètres sur des pattes de bouc. Il a d'énormes épaules, de longs bras aux griffes noires, une tête de taureau aux cornes qui balaient vers l'arrière puis remontent, des yeux et une gueule de braise, une peau sombre fendue de lave qui palpite, des épines sur l'échine et une queue en pointe. Il sort lentement du cercle (l'image tremble), rugit les bras ouverts, puis **écrase les mages un par un** : ils ne fuient pas, ils prient à genoux. Il rugit encore, puis vient à vous. Il a trois coups, tous annoncés :
  - le **revers** : de près, il arme le bras et balaie tout ce qui est devant lui ;
  - le **martèlement** : un **cercle rouge** s'allume au sol devant lui (4,5 cases), puis ses deux poings s'abattent, la terre saute et tout tremble. Sortez du cercle ;
  - la **charge** : il gratte le sol, baisse les cornes, une **traînée rouge** montre sa ligne, puis il fonce à 13 cases par seconde. S'il percute un relief, il reste **sonné deux secondes**, la tête qui oscille : c'est le moment de frapper.
  Il est très coriace (robustesse 22, plus encore sur les îles lointaines). Tant qu'il vit, la brume est pleine ; à sa mort, elle se lève.
- **Ce qu'on y gagne** : un Rôdeur, 1 éclat. Un mage, 4 à 6 éclats, et une chance sur quatre d'un Tome II. Le cercle brisé, 15 éclats et un Tome III. Le démon, 40 éclats et un Tome III (un Tome II si vous les avez tous).
- **À plusieurs** : le cercle, les mages, les Rôdeurs et le démon sont ceux de l'île, les mêmes pour tous. C'est le gardien de l'île qui les fait vivre, et chacun voit leurs gestes et encaisse leurs coups chez lui. L'avancée de l'incantation et la levée de la brume sont partagées, et chaque joueur reçoit sa part quand la brume se lève.
- Les êtres de la brume ne se nourrissent pas, ne s'apprivoisent pas, et n'ont jamais de robe rare.

**Ce que j'ai décidé seul** : le nombre de mages et leur disposition ; la durée de l'incantation (sept minutes) ; le nom des créatures (Mage du cercle, Rôdeur de brume, Démon du cercle) ; leurs dégâts, cadences et portées ; les récompenses ; que la brume protège les siens de la fureur ; que les mages prient au lieu de fuir devant le démon ; l'avis qui dit d'où vient le chant.

**Pas vérifié** : à plusieurs pour de vrai (vérifié : le codage de ce qui est partagé, aller et retour) ; les sons nouveaux (`fouet`, `volee`, `rugissement`, `impact`), que je n'ai pas pu entendre ; l'équilibrage en vraie partie : dans l'essai, immobile au milieu du combat, les mages vous touchent 19 fois en 30 secondes et le démon 13 fois.

Testé (graine 29, niveau 8) : le cercle est placé à 78 cases de l'arrivée, en hauteur, avec six mages. Approché, deux mages combattent (fouets, volées) pendant que les autres chantent, et des Rôdeurs arrivent. L'incantation achevée, le démon sort, rugit, écrase les six mages, puis vous attaque (revers, martèlement). Tué, il fait lever la brume : l'île est notée comme libérée. Regardés à l'écran : le cercle et son pilier, un mage qui psalmodie, qui arme son fouet, qui lance une volée, un Rôdeur ramassé puis de profil, le démon qui rugit et qui arme son martèlement, en 1re personne et en vue 3D. Les essais de magie, de faune, de combat entre joueurs, du HUD et des visions du Korlaz rejoués sans écart.

Dans le code : `brume.js` — `brumeIle` et `placerCercle` (le cercle et les mages, posés avec le peuplement de l'île), `BRUME_SPEC` (les quatre espèces), `majBrumeBete`, `majMage` et `actionMage`, `majRodeur` et `invoquerRodeurs`, `invoquerDemon`, `majDemon` et `actionDemon`, `butinBrume`, `leverBrume`, `majCercle` (l'incantation, les invocations, l'épaisseur de la brume, les annonces), `osBrume` (`osMage`, `osRodeur`, `osDemon`, `osCercle`), `brumeMonde` et `brumeAppliquer`. `index.html` — l'aiguillage dans `majBete`, `osDeBase` et `butin`, les traits qui traversent les leurs (`impactTir`), `P.brumesLevees` dans la sauvegarde, les quatre sons, pas de « Nourrir » pour eux. `faune.js` — leur sac (`SAC_FAUNE.brume`) et l'état du cercle dans le monde partagé.

**À déposer** : `index.html`, `brume.js`, `faune.js` et `sw.js` (qui passe en `stone-valley-63`).

## 96. Bêta · Se téléporter : la brume sanglante

- **Viser un biome** a un bouton de plus, **Brume sanglante**, à côté de Korlaz. Il cherche une graine qui la porte, au niveau tapé ou au moins à l'exploration 8, et remplit la graine et le niveau ; « Y aller » vous y mène.
- Sous les champs, **« Cette graine »** dit maintenant « Brume sanglante » quand c'est elle (jusqu'ici, tout état d'île s'affichait « Korlaz »).
- Comme le Korlaz, la brume entre dans les vœux du portail (« Chercher un biome », dès l'exploration 8), et l'aperçu d'une île au portail la nomme : « Brume sanglante · un cercle de mages, tout ce qui vit s'y entretue ».

Testé : le bouton trouve une graine (264018365, exploration 8) ; « Y aller » arrive sur une île en brume, avec son cercle et ses six mages. Les vœux du portail la proposent à l'exploration 8, pas à la 7.

**Ce que j'ai décidé seul** : la brume entre aussi dans les vœux du portail, comme le Korlaz.

Dans le code (`index.html`) : `VISEES` (l'entrée `brume`), `viserBiome`, `voeuxPossibles`, `infoGraine`, `ETATS_NOMS`.

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-64`).

## 97. « La Valse rouge » : la musique de la brume sanglante, réécrite

La valse du §94 était une improvisation légère. Elle est remplacée par un vrai morceau de combat, une composition originale : une valse en 6/8 en ré mineur, la croche à 0,19 s (la noire pointée à 105 battements par minute), jouée par son propre petit orchestre.

- **L'orchestre** : des cordes piquées (deux pupitres, altos et violoncelles, puis violons) ; une basse ; une batterie (grosse caisse, caisse claire, charleston, cymbale) ; des toms et des timbales ; un chœur (des voix sur un « a » ou un « o ») ; des cuivres qui éclatent ; un violon solo avec son vibrato ; des cloches ; un bourdon ; un souffle qui monte. Tout joue dans une **salle** qui résonne, avec un compresseur qui tient l'ensemble.
- **Cinq parties**, qui s'enchaînent selon le danger autour de vous (la fureur proche, la distance au cercle, l'avancée de l'incantation, le démon) :
  - l'**ouverture** (4 mesures) : le bourdon et le chœur qui montent, l'horloge des pizzicati, une timbale à chaque mesure, puis la montée et un roulement de toms ;
  - le **riff** (8 mesures) : l'ostinato des cordes en croches sur ré mineur, si bémol, sol mineur et la majeur, la basse sur les deux temps, la batterie quand ça chauffe ;
  - le **thème** (8 mesures) : le violon chante la mélodie par-dessus le riff (ré mineur, do, si bémol, la, ré mineur, fa, sol mineur et la, ré mineur), le chœur tient les accords, les cuivres éclatent, la cymbale ouvre la partie ;
  - le **sommet** (8 mesures) : tout, une octave plus haut. Deux violons à la tierce, les cuivres à chaque mesure et en contretemps, les timbales sur les deux temps, la grosse caisse qui double, des roulements de toms. La progression si bémol, do, ré mineur pousse vers le haut, la majeur relance ;
  - le **pont** (8 mesures) : un cœur qui bat, les cloches qui rappellent le thème, le bourdon ; puis deux mesures de montée, avec un roulement de caisse claire qui enfle jusqu'à la reprise.
- **L'enchaînement** : au calme, le riff alterne avec le pont ; dès qu'il y a du danger, on passe au thème ; au plus fort (combat, démon), le thème et le sommet se relaient. Revenir dans la brume, ou y entrer, fait repartir le morceau de l'ouverture.

Mesuré sur un rendu hors ligne de 90 secondes : les parties s'enchaînent comme prévu, aucune saturation (crête à −2,6 dB), un niveau tenu (−19 dB au calme, −15 dB au sommet). Le moteur reste raisonnable : au sommet, le morceau demande à peu près le sixième d'un cœur de processeur (des sorties partagées, deux voix par note de chœur, des doublures à une voix). Dans le jeu, la musique passe bien sur la valse dès qu'on arrive dans la brume.

**Ce que j'ai décidé seul** : la mesure (6/8 plutôt que 3/4, pour que ça pousse), le tempo, les mélodies et les enchaînements, l'orchestre, le niveau (plus fort que la musique d'exploration, comme il sied à un combat).

**Pas vérifié** : à l'oreille (je ne peux pas écouter : tout est réglé à la mesure et au calcul) ; sur un vrai téléphone.

Dans le code : `brume.js`, `valseBrume(ctx, sortie, depart)` : les instruments, `PARTIES` (les accords et les deux mélodies), `suite` (l'enchaînement), `pas` (une croche) ; `index.html` : la musique appelle ce lecteur quand l'humeur est « brume » (l'ancienne `valse` est retirée).

**À déposer** : `index.html`, `brume.js` et `sw.js` (qui passe en `stone-valley-65`). Rappel : `etats.js` et `faune.js` des livraisons précédentes doivent aussi être en ligne (§96).

## 98. Le démon : sa marche et sa charge, revues

Ce qui n'allait pas : le bras et la jambe d'un même côté partaient ensemble (comme un pantin), ses pas allaient au même rythme quelle que soit sa vitesse (presque trois foulées par seconde en marchant, une douzaine pendant la charge) et ses pieds glissaient sur le sol ; la charge n'était qu'une marche penchée.

**La marche** : une vraie foulée. Chaque pied se pose devant, recule à plat pendant l'appui, puis revient en se levant ; les jambes sont pliées comme celles d'un taureau (le genou se calcule à chaque image, le pied reste au sol). Les bras balancent à l'opposé : bras gauche avec la jambe droite. Le corps plonge à chaque appui et se déhanche, la tête dodeline. La cadence suit ce qu'il parcourt vraiment : un pas d'un peu plus de deux mètres, à peu près un pas et demi par seconde, sans glisser ; tourner sur place le fait piétiner.

**La charge** : d'abord il gratte le sol du sabot (la poussière vole), tête basse, cornes en avant, en soufflant ; puis il se jette à quatre pattes : l'échine à l'horizontale, les mains loin devant qui frappent le sol, les jambes qui poussent ensemble, deux bonds et demi par seconde. Quand il percute un relief, il reste sonné (la tête qui roule) : cette pose ne s'affichait jamais, c'est réparé.

**Le poids** : chaque pas sonne sourd (un nouveau son, « pas lourd »), soulève de la poussière et fait trembler l'écran si l'on est à moins de seize cases.

En coopération et en PvP, les autres joueurs voient le même pas : leurs copies des êtres de la brume suivent maintenant la même cadence (`faune.js`).

**Ce que j'ai décidé seul** : la longueur du pas, la cadence du galop, la pose de la charge (à quatre pattes, comme un gorille ou un taureau), le tremblement et la poussière à chaque pas.

**Pas vérifié** : sur un vrai téléphone ; vu en vidéo (je l'ai vérifié image par image et en simulation : il marche, charge, galope, frappe, sans erreur).

Dans le code : `brume.js`, `osDemon(f, O)` (la pose ; `cycle` : un pied dans sa foulée ; `genouD` : le genou et le coude), `pasBrumeVisuel(b, dt)` (la cadence, les pas qui sonnent) ; `faune.js`, `VISUEL_FAUNE.brume` ; `index.html`, le son `pasLourd`.

**À déposer** : `index.html`, `brume.js`, `faune.js` et `sw.js` (qui passe en `stone-valley-66`).

## 99. « La Valse rouge », deuxième version : une vraie valse, comme les Dames Mante

*Abandonnée : Romain préfère la première version, remise en place au §100.*

Romain m'a fait écouter sa référence (le combat des Dames Mante, Hollow Knight). Je ne l'entends pas, mais je l'ai mesurée : do mineur, une valse à trois temps vers 125 à la minute (une mesure toutes les 1,4 s), le médium aussi présent que la basse, peu de notes à la fois. La première version de la Valse rouge (§97) avait les mêmes couleurs d'accords mais galopait en 6/8, plus vite, avec un début trop sourd et beaucoup de notes : je l'ai réécrite entièrement.

**Ce qui change** : une vraie valse (la basse sur le premier temps, les cordes piquées sur le deuxième et le troisième), en do mineur, la noire à 126. Moins d'instruments : un piano, des cordes, un alto et un violon solos, des timbales ; les cors, la grosse caisse d'orchestre et le chœur seulement au plus fort. Plus de batterie. Des mélodies nouvelles (toujours une composition originale).

**Les cinq parties** (même enchaînement selon le danger) :
- **L'ouverture** : le salut. Une note tenue grave, le piano seul qui pose le motif, puis la valse s'éveille en pizzicati et l'alto entre ; un roulement de timbales lance la suite.
- **La valse** (calme) : l'alto chante dans le bas ; quand ça chauffe, le piano ajoute des contretemps.
- **Le thème** (danger) : le violon s'envole, le piano court en croches, les cors enflent.
- **Le sommet** (combat, démon) : les violons en tierces à l'aigu, les altos à l'octave en dessous, les timbales à chaque mesure, les cors ; le chœur quand le démon est là.
- **Le pont** (accalmie) : le piano seul au-dessus d'une note tenue, puis le trémolo des cordes et le roulement de timbales qui ramènent le combat (vers le thème, ou le sommet si le danger est au plus haut).

Mesuré sur un rendu de 100 s, comparé à la référence : même tonalité, même tempo (123 à 129 mesuré), même équilibre grave/médium au début, même densité de notes. Au sommet, c'est plus brillant que la référence : la mélodie y monte haut, c'est voulu. Aucune saturation (crête −3,8 dB). Coût pour un téléphone inchangé (au sommet, environ le sixième d'un cœur de processeur ; le reste du temps, bien moins). Dans le jeu, la musique passe bien sur la valse dès qu'on arrive dans la brume.

**Ce que j'ai décidé seul** : les mélodies et les enchaînements d'accords, l'orchestration, de supprimer la batterie, l'ordre des parties (après le sommet ou le pont, on repasse par le thème plutôt que de sauter directement au sommet).

**Pas vérifié** : à l'oreille (tout est réglé à la mesure) ; sur un vrai téléphone.

Dans le code : `brume.js`, `valseBrume(ctx, sortie, depart)` : les instruments (`piano`, `corde`, `violon` avec l'alto, `nappe`, `timbale`, `cor`…), `PARTIES` (accords et mélodies), `suite` (l'enchaînement), `pas` (une croche).

**À déposer** : `brume.js` et `sw.js` (qui passe en `stone-valley-67`), plus ceux du §98 s'ils ne sont pas encore en ligne (`index.html`, `faune.js`) : en ligne, le jeu était encore à `stone-valley-64`.

## 100. Retour à la première « Valse rouge »

Après écoute des deux, Romain préfère la première version (§97, en 6/8, ré mineur). Elle est remise telle quelle dans `brume.js` ; la deuxième (§99) est retirée. Rien d'autre ne change (le démon du §98 reste).

**À déposer** : `brume.js` et `sw.js` (qui passe en `stone-valley-68`), plus `index.html` et `faune.js` du §98 s'ils ne sont pas encore en ligne.

## 101. Brume sanglante : l'incantation en quatre minutes, et sa barre en haut de l'écran

**Quatre minutes** au lieu de sept pour que les mages achèvent leur incantation (tous vivants ; chaque mage tué la ralentit, comme avant : un mage seul y mettrait huit minutes).

**La barre** : sous la boussole, une barre rouge qui se vide à mesure que les mages chantent, avec le temps qu'il leur reste et le nombre de mages encore debout (« Incantation · 3:12 · 5 mages »). Le temps est celui qu'il leur faut encore au rythme présent : tuer un mage le rallonge. Dans les trente dernières secondes, elle bat en rouge. Elle disparaît quand le démon sort, quand la brume se lève, ou dans un donjon. Sur téléphone, elle est sous la boussole, à droite ; la carte du joueur et la fiche de la cible descendent d'un cran pour lui laisser la place. En coopération, ceux qui suivent voient la même barre (l'avancement du chant est partagé).

**Ce que j'ai décidé seul** : la place (sous la boussole), le texte (temps et nombre de mages), le battement à trente secondes.

**Pas vérifié** : sur un vrai téléphone (vérifié en capture, format ordinateur et téléphone).

Dans le code : `brume.js`, `INCANT_DUREE` (240 s), `barreIncant()` (appelée par `majBrume`) ; `index.html`, l'élément `#incant` et son style (avec `body.incant` qui décale la fiche de la cible et, sur téléphone, la carte du joueur).

**À déposer** : `index.html`, `brume.js`, `sw.js` (qui passe en `stone-valley-69`), plus `faune.js` du §98 s'il n'est pas encore en ligne.

## 102. Brume sanglante : les Rôdeurs sautent

**Les Rôdeurs** sautent maintenant sur un relief de quatre cases de haut au plus, et par-dessus un trou ou de l'eau de quatre cases de large au plus ; s'il n'y a pas d'autre bord, ils se laissent tomber dedans (quatre cases au plus). Ils sautent plutôt que de contourner : un bond en arc (plus haut pour monter), un souffle au départ, un choc sourd et un peu de brume à l'arrivée. Ils voient désormais leur proie jusqu'à six cases et demie plus haut ou plus bas (avant : quatre), et ne lancent leur morsure bondissante que de plain-pied. En coopération, les autres joueurs voient le même saut (l'arc est partagé).

**Réparé au passage** : deux sons du démon portaient le même nom que des sons déjà là (son rugissement, celui du dragon ; son pas, un « pied de fer ») : c'étaient ceux-là qu'on entendait. Ils s'appellent maintenant `rugDemon` et `pasDemon`.

Vérifié en simulation : un Rôdeur monte d'un bond sur une falaise de trois cases, en franchit un trou de trois cases, et rejoint sa proie.

**Ce que j'ai décidé seul** : qu'ils préfèrent sauter plutôt que contourner ; qu'ils se laissent tomber dans un trou sans autre bord ; la hauteur et la durée du bond.

**Pas vérifié** : sur un vrai téléphone ; à l'œil (la pose du saut reprend celle de leur morsure bondissante, la gueule moins ouverte).

Dans le code : `brume.js`, `chercherSaut`, `sauterBrume`, `majSaut`, `arcSaut`, `solLibre`, `SAUT_HAUT` et `SAUT_LONG` (4 et 4) ; `cibleBrume(b, R, dz)` ; `faune.js`, le saut partagé (`SAC_FAUNE.brume`) et l'arc chez qui suit (`VISUEL_FAUNE.brume`).

**À déposer** : `index.html`, `brume.js`, `faune.js`, `sw.js` (qui passe en `stone-valley-70`).

## 103. La Valse rouge ne fait plus craquer le son ni ralentir le jeu

**Le problème** (sur téléphone) : dans la brume, la musique saturait, les autres sons aussi, et le jeu ralentissait. La valse était jouée note à note pendant la partie : des centaines de petits instruments créés à la volée, plus une salle (réverbération) et un compresseur à elle. Au plus fort, cela demandait déjà le cinquième d'un cœur de processeur ici ; sur un téléphone, le son ne suivait plus (d'où les craquements, sur tous les sons) et le jeu en pâtissait.

**La solution** : la valse est maintenant écrite d'avance. Dès la première entrée dans la brume, chaque partie (ouverture, valse calme, valse pleine, thème, sommet, pont) est rendue une fois, en tâche de fond, dans un enregistrement (24 kHz, stéréo) ; ensuite, le jeu ne fait plus que les enchaîner selon le danger, comme avant. Pendant la partie, la musique ne coûte presque plus rien (un ou deux sons à la fois au lieu de centaines). L'ouverture est prête en un instant ; le reste en quelques secondes (moins de trois ici). Les enregistrements occupent environ 12 Mo de mémoire, gardés pour la séance.

**Aussi** : l'orchestre est allégé (plus de salle ni de compresseur à part : la valse passe par la salle et le compresseur du jeu ; le chœur et le violon partagent leurs filtres et leur vibrato ; une ou deux voix par note ; chaque note se débranche dès qu'elle s'est tue). Le rendu d'avance coûte ainsi deux fois moins. La musique reste la même (mêmes parties, mêmes mélodies) ; le timbre est un peu plus simple. Elle s'éteint d'elle-même en une seconde quand on quitte la brume.

**Ce que j'ai décidé seul** : jouer des enregistrements plutôt que des notes ; deux versions de la valse (calme et pleine) au lieu d'une batterie qui entre selon le danger à la mesure près ; 24 kHz (les aigus au-delà de 12 kHz sont coupés, inaudible sur un téléphone).

**Pas vérifié** : sur un vrai téléphone (le craquement n'est pas reproductible ici) ; vérifié dans le jeu : la musique part, les parties s'enchaînent, tout est prêt en moins de dix secondes même sous la charge du jeu.

Dans le code : `brume.js`, `VALSE_PARTIES`, `valseSuite`, `valseDuree`, `partitionValse(ctx, sortie).jouer(partie, intensité)` (l'orchestre, hors ligne), `rendreValse()` (les rendus, `VALSE_RENDUS`), `valseBrume(ctx, sortie)` (le lecteur, inchangé pour `index.html`).

**À déposer** : `brume.js` et `sw.js` (qui passe en `stone-valley-71`).

## 104. Brume sanglante : l'incantation en une minute trente, et ses trois tomes

**L'incantation** dure maintenant une minute trente (tous les mages vivants ; chaque mage tué la ralentit : un mage seul y mettrait trois minutes). La barre en haut de l'écran suit.

**Les tomes** (ils remplacent ce que la brume donnait jusqu'ici : le Tome II d'un mage sur quatre, le Tome III du cercle brisé) :
- **Tome I** : quand les six mages sont tombés, un **lutrin de pierre** sort du cercle éteint, un livre ouvert dessus. On le recopie comme les lutrins des biomes. Il apparaît aussi si c'est le démon qui a fini les mages.
- **Tome II** : le **démon** le porte ; il vous revient quand il tombe.
- **Tome III** : sur un **lutrin posé au hasard sur l'île** (toujours au même endroit pour une même graine, loin de l'arrivée et du cercle), à trouver. Il est là dès l'arrivée ; comme les autres lutrins, un signe flotte au-dessus et, la nuit, un fil de lumière monte vers le ciel ; une fois vu, il s'inscrit sur la boussole. Quand la brume se lève, un message rappelle qu'un livre attend encore quelque part.

Chaque lutrin offre un tome qui vous manque, du rang voulu (sinon du rang le plus proche), d'abord dans une matière dont vous tenez le rang d'avant. Une fois recopié, il s'éteint pour de bon (même en revenant sur l'île) ; si vous obtenez ce tome ailleurs avant de l'avoir lu, il en propose un autre.

Vérifié en simulation : les six mages tués, le lutrin sort du cercle (Tome I), celui de l'île donne un Tome III, le démon un Tome II, les mages ne donnent plus que leurs éclats.

**Ce que j'ai décidé seul** : le lutrin du Tome I sort aussi quand c'est le démon qui tue les derniers mages ; les tomes restent ceux des six matières existantes (un tome qui vous manque) ; un rang de repli quand vous les avez tous ; le lutrin du Tome III présent dès l'arrivée ; le rappel quand la brume se lève.

**Pas vérifié** : sur un vrai téléphone ; à l'œil (le lutrin est celui des biomes, posé au centre du cercle).

Dans le code : `brume.js`, `INCANT_DUREE` (90 s), `tomeBrume`, `lutrinBrume`, `placerTomeIle`, `majTomesBrume` ; `butinBrume` (le démon : Tome II) ; `index.html`, les lutrins savent porter un tome II ou III (`l.n`) et s'éteindre une fois lus (`l.lu`, `l.surLu`), `P.brumeTomes` (sauvegardé).

**À déposer** : `index.html`, `brume.js`, `sw.js` (qui passe en `stone-valley-72`).

## 105. Une septième matière : le Sang, et ses trois tomes sanglants

**Le Sang** rejoint les six matières de la magie (fange, vent, spore, effroi, cristal, braise). Il **frappe fort** (son coup pèse 1,4 : plus que la braise, un peu moins que le cristal, qui perce) et il **boit** : près d'un tiers du coup vous revient en vie (au plus 12 % de votre vie par coup), et l'on voit un filet rouge remonter de la bête vers vous. Il coûte 8 éclats, comme la braise (un Trait de sang : 13 éclats). Il marche avec les cinq formes : un Trait qui soigne, une Onde qui boit sur chaque bête touchée, un Piège, un Mur qui boit à chaque bête qui s'y heurte, une Égide qui vous rend de la vie quand on vous frappe. En PvP aussi, il vous rend de la vie quand il touche un autre joueur.

**Ses tomes ne viennent que de la brume sanglante** (les tomes sanglants) : le **Tome I** sur le lutrin qui sort du cercle quand les six mages sont tombés, le **Tome II** sur le démon, le **Tome III** sur le lutrin caché quelque part sur l'île (§104). Ni les coffres, ni le conteur, ni la Tisseuse ne le donnent. Une fois un tome du Sang à vous, le lutrin ou le démon d'une autre île de brume donnent, à sa place, un tome qui vous manque dans une autre matière. On les déchiffre comme les autres, au pupitre de la bibliothèque, dans l'ordre.

**Les accords** : le Sang se mêle aux six autres matières (le Codex passe de quinze à vingt et un accords). Ce sont des accords simples (les deux effets, et le Sang boit toujours) ; il n'entre dans aucun accord remarquable (chaque matière n'en a que deux, et toutes ont déjà les leurs). L'accent (Tome III) marche comme pour les autres.

Vérifié : un Trait de sang soigne bien (12 % sur un mage), un accord braise et sang aussi ; le Sang n'est jamais tiré par les autres sources ; le lutrin de l'île porte le Tome III du Sang ; le test de la magie (formes, cases, sauvegarde, pupitre) passe, la sauvegarde garde les tomes du Sang.

**Ce que j'ai décidé seul** : la force du coup (1,4) et la part bue (30 %, 12 % au plus par coup) ; le prix (8 éclats) ; pas d'accord remarquable ; le vol de vie aussi en PvP ; la couleur (rouge sang).

**Pas vérifié** : sur un vrai téléphone ; l'équilibre en jeu (dites-moi s'il soigne trop ou pas assez).

Dans le code : `index.html`, `MATIERES` (le Sang, `brume: true`), `TOME_DE`, `tomeManquant` (le Sang exclu), `ouTome` (où le trouver), `boireSang` (appelée par `toucherSort` et `toucherJoueur`) ; `brume.js`, `choixTomeBrume`.

**À déposer** : `index.html`, `brume.js`, `sw.js` (qui passe en `stone-valley-73`).

## 106. La musique vivante : le camp, le large, et le feu qui crépite

Hors du Korlaz, de la brume sanglante, de l'île des automates et des donjons (qui gardent leur musique), la musique ne se fait plus par phrases et longs silences : elle joue sans s'arrêter et se règle, à chaque image, sur ce qui se passe. Tout est écrit (composition originale).

**Sur l'île du camp** (celle où il est planté ; avant d'en planter un, l'île de départ) : un air guilleret, à la manière des musiques d'heure d'un village, en do majeur, seize mesures (accords de septième, une basse qui sautille sur les temps 1 et 3, des accords piqués sur les contretemps, le marimba qui chante, une grosse caisse douce, des balais, des grelots, un peu de swing), à 104 à la minute.
- **La nuit** : il ralentit (jusqu'à 76), s'adoucit (le vibraphone, des accords tenus, une basse longue, presque plus de batterie) et respire : un tour sur deux sans mélodie.
- **Au combat** (une bête qui vous vise, vous charge ou vous traque) : il accélère jusqu'à 140 en moins d'une seconde, se redresse (plus de swing), la grosse caisse frappe chaque temps, la caisse claire entre, la basse court en croches, la mélodie passe à un son plus mordant, doublé du marimba deux octaves plus haut, et un roulement de toms ferme la boucle. Le combat fini, il redescend en quelques secondes.

**Au large** (toute autre île) : un air en ré mineur, huit mesures, et plus vous êtes loin de votre campement (l'écart en îles), plus il presse et se tend :
- tout près (une île) : 100 à la minute, des arpèges en croches, une basse en blanches, des grelots, la mélodie au marimba un tour sur deux ;
- plus loin : le tempo monte, la grosse caisse et la caisse claire entrent, la basse pulse en croches, les arpèges passent en doubles croches ;
- au-delà de la barrière (cinq îles) et plus loin : jusqu'à 135, la basse galope en doubles croches et frotte (une seconde mineure), la mélodie passe à un son mordant, doublé à l'octave au plus loin, la batterie à plein, et des accords qui grincent (seconde mineure et triton) au début des mesures 4 et 8.
- La nuit le calme un peu (un peu plus lent, plus doux) ; le combat le pousse d'un cran (jusqu'à 150).

**Le feu de camp** : près du feu (à onze cases), on l'entend maintenant vraiment : le souffle sourd des flammes, et des crépitements de toutes tailles, parfois en grappes, avec de temps en temps le « pop » d'un nœud qui éclate. C'est un enregistrement fabriqué une fois au démarrage (sept secondes, qui tournent en boucle sans couture).

**Pour le téléphone** (après la leçon de la valse, §103) : une ou deux voix par note, des filtres partagés par instrument, chaque note se débranche une fois tue, les notes posées deux dixièmes de seconde à l'avance. Mesuré : entre 1,3 % (camp, nuit, large proche) et 3,5 % (combat) d'un cœur de processeur ici, trois à six fois moins que l'ancienne valse. Le mélange est réglé pour un petit haut-parleur (la mélodie et les accords dans le médium, une basse qui garde ses harmoniques).

Vérifié dans le jeu : la musique du camp part au démarrage (104), celle du large à l'exploration 6 (125). Un aperçu de 97 secondes passe par toutes les situations : camp de jour avec le feu, combat, nuit, puis le large de près, de loin, et au combat.

**Ce que j'ai décidé seul** : les deux airs (mélodies, accords), les tempos (76, 104, 140 ; 90 à 150 au large), ce qui entre à chaque palier, que l'île des automates et les donjons gardent l'ancienne musique, la portée du feu (onze cases).

**Pas vérifié** : à l'oreille (réglé à la mesure) ; sur un vrai téléphone.

Dans le code : `index.html`, `musiqueVive(ctx, sortie)` (dans le moteur du son, avant la valse ; `PIECES` : les deux airs), branchée dans `MUS.maj` ; `feuDeCamp()` (l'ambiance).

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-74`).

## 107. La musique vivante, plus calme ; le feu à sa place

**Plus calme** (la première version courait trop) :
- au camp : 86 à la minute le jour (au lieu de 104), 68 la nuit (au lieu de 76), 112 au combat (au lieu de 140) ; au combat, les grelots en croches (et non plus en doubles croches), la grosse caisse sur les temps 1 et 3 ;
- au large : de 76 (une île) à 102 (au plus loin), au lieu de 90 à 135 ; 112 au plus au combat (au lieu de 150) ; plus de doubles croches : les arpèges restent en croches (ils s'étendent sur deux octaves quand on est loin), la basse pulse en croches au lieu de galoper, les grelots en croches. La tension vient de ce qui entre (la batterie, la seconde mineure, les accords qui grincent), plus de la vitesse ;
- la musique part directement au bon tempo (sans la petite accélération du début).

**Le feu** ne se mêle pas à la musique : il est sur le bus de l'ambiance (son curseur à lui), et maintenant **placé là où il est**, comme les autres sons du monde : fort tout près (à une case et demie), moitié moins à six cases, un souffle à quinze, rien au-delà de vingt-six ; à gauche ou à droite selon où l'on regarde. (Dans l'aperçu précédent, je l'avais mêlé à la musique pour qu'on l'entende : c'est ce qui prêtait à confusion.)

Vérifié dans le jeu : campement planté, le feu à 0,15 tout près, 0,075 à six cases, 0,018 à quinze, muet à trente ; il passe à gauche ou à droite quand on tourne la tête ; la musique du camp à 86. Coût de la musique : entre 1,6 % et 2,9 % d'un cœur ici.

**Ce que j'ai décidé seul** : les nouveaux tempos ; la portée du feu (celle des autres sons du monde).

**Pas vérifié** : à l'oreille ; sur un vrai téléphone.

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-75`).

## 108. Retour aux phrases et aux silences, mais composées ; elles évoluent avec le combat et le large

La musique vivante (§106, §107) est retirée : on revient au système d'avant (des phrases, puis des silences), mais les phrases ne sont plus des notes tirées au hasard. Le feu de camp reste tel qu'au §107 (à sa place, sur l'ambiance). Le Korlaz garde exactement sa musique d'avant ; la brume, sa valse.

**Des phrases composées** : une phrase fait quatre mesures de trois temps, chacune sur un accord (jour : en ré majeur pentatonique ; nuit : la mineur ; île des automates et donjons : leur mode grinçant). Elles vont par deux : la **question**, qui s'arrête sur un accord ouvert, la note en l'air, puis, après un souffle, la **réponse**, qui revient au repos sur la tonique, longue ; ensuite un vrai silence. La mélodie : un motif (un rythme et un contour) en mesure 1, un autre en mesure 2, le premier repris en mesure 3 à partir de l'accord suivant (on reconnaît l'idée), puis la cadence (une note d'approche, la note finale). Chaque premier temps tombe sur une note de l'accord ; entre deux, on va par degrés, et un saut est suivi d'un pas en sens inverse. La nappe change d'accord à chaque mesure (une voix légère par note, dans un filtre partagé).

**Le combat** (une bête qui vous vise, vous charge, vous traque) : la phrase en cours presse aussitôt (le pas raccourcit d'un tiers), la suivante part sans attendre et passe au mode du danger (phrygien, grave), le rythme se resserre (des croches), une pulsation grave bat chaque temps, la nappe s'épaissit, les silences tombent presque à rien. Le combat fini, tout cela retombe en quelques secondes, et l'on revient à la palette du lieu.

**Le large** : plus on est loin du campement (l'écart en îles), plus le pas presse (jusqu'à un cinquième plus vite), plus les silences raccourcissent (jusqu'aux deux cinquièmes), plus la nappe s'épaissit. À partir de trois îles de la maison, la palette passe au **mode dorien** (plus grave, entre l'aventure et l'inquiétude) ; à cinq îles et au-delà, la pulsation grave bat les temps ; au plus loin, le rythme se resserre et une note frotte parfois (un demi-ton au-dessus). Au camp, rien de tout cela : le jour et la nuit d'avant.

Un aperçu de 108 secondes (rendu avec le moteur du jeu) : le camp de jour, un combat au camp, la nuit, une île à trois de la maison, une île à huit, puis un combat là-bas. Vérifié à la mesure : chaque palette est dans sa tonalité (ré majeur, mi phrygien au combat, la mineur la nuit, sol dorien au loin).

**Ce que j'ai décidé seul** : les accords des phrases (question, réponse) pour chaque palette ; le mode dorien au loin, à partir de trois îles ; les seuils (pulsation à cinq îles, frottements au plus loin) ; garder la musique d'avant pour le Korlaz.

**Pas vérifié** : à l'oreille ; sur un vrai téléphone.

Dans le code : `index.html`, `HUMEURS.lointain`, `SUITES` (les accords), `composer(H, Q, question, serré)` (une phrase), `tenirLeger` (la nappe), `MUS.phrases(now)` (le jeu des phrases, le combat, le large) ; `musiqueVive` est retirée.

**À déposer** : `index.html` et `sw.js` (qui passe en `stone-valley-76`).

## 109. Les voyageurs du Seuil, première livraison : les curiosités

Le plan (accepté) : 1. les curiosités (ici) ; 2. les voyageurs au hasard, où la caravane se fond ; 3. des indices tirés de votre partie, et un carnet des rumeurs ; 4. les autres métiers.

**Les curiosités** : trente objets uniques (un seul exemplaire de chacun, jamais deux), chacun avec sa rareté, son histoire et un effet tant qu'on le porte.
- **Peu communes** (6) : Lanterne de tourbe (vision de nuit), Plume de héron (chute de plume), Semelles de mousse (pas feutrés), Serpette de cueilleuse (récolte abondante), Grelot du berger (main douce), Fiole de cendre froide (insensible aux braises).
- **Rares** (6) : Bottes de vent (pas vif), Ressort d'horloger (grand saut), Écaille de garde (peau dure), Poing de laiton (coups puissants), Bogue de châtaigne (épines), Conque des marées (grand souffle).
- **Très rares** (6) : Œil de hibou (vision de nuit II, pas feutrés), Givre en bouteille (coups glacés), Croc de meute (meute galvanisée), et trois à effet propre : la Carte des lutrins (les lutrins de l'île à la boussole, même jamais vus), la Bourse du Seuil (un éclat de plus par bête abattue), le Sceau des nomades (un quart du prix en moins chez les voyageurs).
- **Légendaires** (6) : Cœur de chêne (la vie revient d'elle-même, peau dure), Dent du démon (le Sang boit moitié plus, coups puissants), Aile de sterne (grand saut II, chute de plume II), Bottes de sept lieues (pas vif II), Masque de l'effroi (épines II, peau dure), Sablier inversé (régénération II).
- **Épiques** (6) : Couronne du Seuil, Larme de la Tisseuse, Boussole d'or, Cœur de brume, Corne de dragon, Plume de phénix (deux ou trois effets forts chacune).
- Les effets sont ceux des plats, permanents tant qu'on porte l'objet (sans s'ajouter à la ligne des effets de plats, qui garde ses minuteries) ; deux curiosités au même effet s'additionnent (au plus IV).

**Les porter** : trois au plus. Deux nouvelles places dans « Porté » (Breloque, Breloque), et l'accessoire s'il est libre (le sifflet y reste sinon ; la touche H ne siffle qu'avec le sifflet). « Porter » prend la première place libre, sinon remplace la première breloque (la fiche le dit). Dans l'onglet Sac, chaque curiosité a sa vignette, le tour à la couleur de sa rareté, et sa fiche : rareté, effet, histoire.

**Les acheter** : en attendant les voyageurs (livraison 2), la marchande de la caravane en propose trois par halte (« Tu as des curiosités ? »), tirées selon le niveau de l'île : près de chez soi, surtout des peu communes ; vers 4, des rares ; vers 8, des très rares ; au-delà de 13, des légendaires et parfois une épique. Jamais une qu'on a déjà. Elles se paient en éclats et en matière (de 12 éclats et 8 fibres à 140 éclats et 30 os), moins cher pour un ami, et d'un quart avec le Sceau.

Vérifié : le tirage selon le niveau, l'achat (éclats et matière retirés, l'objet au sac), les trois places et le remplacement, les effets (pas vif, vision de nuit, régénération, peau dure), la sauvegarde et le rechargement, la fiche du Sac (capture), le sifflet qui ne siffle plus avec une curiosité à l'accessoire.

**Ce que j'ai décidé seul** : les trente objets, leurs effets, leurs prix et leurs histoires ; les chances de rareté par niveau ; la régénération (0,3 % de vie par seconde et par niveau) ; que la marchande les vende en attendant les voyageurs.

**Pas vérifié** : sur un vrai téléphone ; l'équilibre en jeu.

Dans le code : `index.html`, `CURIOS` (les trente), `curioFx`, `porterCurio`, `tirerCurios`, `prixCurio`, `dessinCurio` (les vignettes), `effet` (plats et curiosités ; `effetRepas` pour les seuls plats), les places `breloque` et `breloque2` ; `nomades.js`, `nmCurios`.

**À déposer** : `index.html`, `nomades.js`, `sw.js` (qui passe en `stone-valley-77`).

## 110. Les voyageurs du Seuil, deuxième livraison : les voyageurs (la caravane fondue dedans)

**La caravane** (toujours une marchande, un dresseur, un conteur) n'existe plus : à sa place, des **haltes de un à trois voyageurs**, de métiers différents, tirés au hasard (une halte sur trois environ en compte un, une sur deux deux, une sur sept trois).
- **Plus souvent** : la première halte une à trois minutes après l'arrivée sur l'île (au lieu de deux et demie à sept et demie), puis cinq à dix minutes après chaque départ (au lieu de huit à dix-huit).
- **À un endroit qui s'y prête** : un replat sec, de préférence au bord de l'eau, sur une hauteur ou près de l'arche de l'île, à 14 à 32 cases (le message dit où : « un seuil s'ouvre au sud, à 28 cases · 3 voyageurs y font halte »), et marqué à la boussole. **La nuit**, un petit feu au milieu de la halte.
- **Qui** : pour les trois métiers d'avant (marchande, dresseur, conteur), une fois sur deux l'un des neuf qu'on connaît (s'il vit encore : on les reconnaît, ils se souviennent de vous) ; sinon, et pour les nouveaux métiers, un **inconnu** : un nom tiré au hasard, une robe d'une teinte au hasard, et un caractère (bavard, méfiant, joyeux, pressé) qui colore son accueil.

**Trois nouveaux métiers** :
- **Le cartographe** (un chapeau plat, des cartes roulées dans le dos) : il vend ce qu'il sait de l'île, à marquer à la boussole (un losange de parchemin, une croix rouge) : un lutrin jamais vu (et son tome), la trappe du souterrain, le cercle des mages, la fourmilière, l'aire du dragon, l'antre de la Tisseuse, le cœur d'un biome rare. De 6 à 14 éclats la marque, moins pour un ami. Le lutrin marqué compte comme vu.
- **Le devin** (à partir de l'exploration 3 ; capuche et orbe) : pour 6 éclats (rien pour un ami), il **voit l'île qui attend derrière l'arche** : son niveau, ses biomes rares, les automates, la brume sanglante ou le Korlaz. C'est bien elle que donnera le prochain portail. Et il peut **chercher un autre chemin** (12, puis 24, puis 36 éclats ; trois fois au plus) : on choisit un peu sa route.
- **L'égaré** (un baluchon, rien d'autre) : il demande un service, au hasard parmi trois : **six baies** (il a faim), **son sac** (perdu à 18 à 35 cases en fuyant une bête : marqué à la boussole, il luit ; on le ramasse en passant dessus, puis on le lui rapporte), ou **l'escorter jusqu'à l'arche** de l'île (il vous suit à deux pas, puis s'en va par l'arche). En remerciement : **une curiosité** tirée selon le niveau de l'île (ou des éclats, si l'on a tout). Tant qu'un service est en cours, la halte attend.

Ce qui ne change pas : la marchande (troc et curiosités), le dresseur (ses techniques, sa bête), le conteur (ses indices et les tomes : la livraison 3 les rendra vivants) ; l'amitié des neuf, la rancune, la défense quand on les frappe. En coopération, les inconnus se voient chez tous (tout ce qui les fait est partagé) ; l'escorte n'est proposée qu'à celui qui tient la halte.

Vérifié en simulation : 300 haltes (tailles, métiers, connus et inconnus), les marques du cartographe (à la boussole), la vision du devin et l'autre chemin (le portail donne bien l'île vue), les trois services de l'égaré et leurs curiosités, l'identité d'un inconnu partagée ; une halte vue en jeu (capture) ; le partage de la faune passe toujours.

**Ce que j'ai décidé seul** : les fréquences, les métiers et leurs chances, les prix du cartographe et du devin, les trois services de l'égaré, le petit feu de nuit, les noms des inconnus (deux syllabes tirées au hasard).

**Pas vérifié** : sur un vrai téléphone ; à l'œil, les nouvelles tenues de près.

Dans le code : `nomades.js`, `nmVoyageur` (les inconnus), `nmVenir` (qui vient, où), `NM_DIALOGUES.cartographe / devin / egare`, `nmLieux` / `nmCartes` / `nmMarques`, `nmVision` / `nmAutreChemin` / `nmDecrire`, `nmQuete` / `nmEgare` / `nmServices` / `nmRecompense` ; `faune.js`, `identiteFaune` / `poserIdentite` (les inconnus) ; `index.html`, `portailNormal` (l'île du devin), `reperes` et la boussole (les marques).

**À déposer** : `index.html`, `nomades.js`, `faune.js`, `sw.js` (qui passe en `stone-valley-78`).

## 111. Les voyageurs du Seuil, troisième livraison : de vrais indices, et le carnet des Rumeurs

Ce que disent les voyageurs ne sort plus d'une liste fixe : c'est tiré de votre partie. Trois sortes d'indices :

- **Sur cette île** : un lutrin pas encore vu, la trappe du souterrain, le cercle des mages de la brume, la fourmilière, l'aire du dragon, l'antre de la Tisseuse, le cœur d'un biome rare où vous n'êtes jamais allé. Le voyageur dit où (direction, distance) et **le marque à la boussole**, comme le cartographe, mais sans le faire payer.
- **Ce qui vous manque** : un tome rapporté et pas déchiffré, le tome suivant de chaque matière et où le trouver, un accord jamais essayé (bibliothèque 2 et plus), un biome rare jamais vu (s'il est à votre portée, ou presque), la brume sanglante (à partir de la sixième exploration), pas de compagne, pas de curiosité, ou des curiosités qui dorment au sac.
- **Ce qui vous coûte** : des cœurs déjà perdus sur l'expédition, peu d'éclats dans le sac (le mana), pas d'armure, pas d'arme, la nuit sans lumière, peu de vie.

Un indice ne se redit pas (ceux d'une île : pas deux fois sur la même île). Quand il n'y a plus rien à dire, on retombe sur les anciennes phrases.

Où les entendre : le conteur (« Que sais-tu de cette île ? », nouveau, et « Un conseil pour la route ? »), la marchande (« Quelles nouvelles des îles ? »), le cartographe (« Des nouvelles ? », gratuit, en plus des marques qu'il vend) et le devin (« Que vois-tu pour moi ? »).

**Le carnet des Rumeurs** : dans le Journal du campement, entre l'Atlas et le Carnet des variantes. Chaque indice entendu s'y écrit, le plus récent en haut (les 20 derniers affichés, 40 gardés dans la sauvegarde), avec l'exploration où on l'a entendu et, s'il parle de l'île où vous êtes, sa direction.

**Ce que j'ai décidé seul** : quand il y a quelque chose à dire sur l'île, une réponse sur quatre à dix en parle (quatre fois sur dix) ; « Que sais-tu de cette île ? » ne parle que d'elle ; les indices d'île sont gratuits alors que le cartographe vend ses marques (lui en propose jusqu'à cinq, au choix, les rumeurs en donnent une au hasard) ; le carnet n'est pas partagé en coopération.

**Pas vérifié** : sur un vrai téléphone.

Dans le code : `nomades.js`, `nmIndicesVivants` (tous les indices possibles), `nmIndiceVivant(pref)` (en choisit un pas encore dit, l'écrit au carnet, marque la boussole), `nmRumeur` ; `index.html`, `blocRumeurs` (le journal), `P.rumeurs` (sauvegarde).

**À déposer** : `index.html`, `nomades.js`, `sw.js` (qui passe en `stone-valley-79`), `LISEZ-MOI.md`.

## 112. La Cerisaie en fleur : un biome rare des premières îles

Un neuvième biome rare, rang « merveille » (son nom s'écrit en rose dans l'Atlas). Il ne paraît que **de l'exploration 1 à la 5** : au-delà, le portail ne tire plus d'île qui le porte (ni au hasard, ni dans les propositions du portail du campement, ni dans les vœux). Pour y revenir plus tard, il faut avoir **gardé** l'île. Environ une île sur sept, de la 1re à la 5e exploration (mesuré : 15 % à l'exploration 1, 11 % à la 5e, 0 % ensuite).

**Le lieu** : un sol couvert de pétales (rose, semé de blanc), qui prend des prairies, des bois et des landes.
- **Cerisiers en fleur** : un tronc sombre qui se tord, des bras, des nuages de fleurs. Trois teintes selon l'arbre (rose tendre, blanc, rose franc). Ils donnent du bois. Leurs pétales tombent sans arrêt, se balancent, puis se posent au sol.
- **Lanternes de pierre** : rares, souvent par petits groupes. La nuit, leur foyer luit et éclaire autour.
- **Iris d'eau** au bord de l'eau, **bambous** en bosquets, **pivoines**, et des **griottiers** qui portent des cerises (les baies du biome).
- **Douze plantes rares** de la cerisaie, comme dans les autres biomes : Étoile de sakura, Clochettes de glycine, Éventail d'érable rouge, Crosse de jade, Lampion de pétales, Prunier du Japon, Pivoine-reine, Saule de pétales, Voile de pétales, Arbre aux mille fleurs, et deux vives : Gueule de camélia, Fouet d'églantier.
- **L'air** : des pétales le jour, des lucioles roses la nuit.

**La paix des cerisiers** :
- Sous les cerisiers, aucune bête ne chasse. Une proie qui s'y réfugie est laissée tranquille, et un chasseur qui vous suivait renonce dès que vous y entrez. La seule exception : une bête que vous avez frappée vous en veut toujours.
- La vie y revient d'elle-même, doucement, quatre secondes après le dernier coup reçu (pleine en deux minutes environ).
- La musique y change : le jour, une gamme pentatonique sans demi-ton (yo), lente, pincée comme un koto ; la nuit, la gamme miyako-bushi, en cloches. Le large et le combat n'y entrent pas.

**Les bêtes** (elles ne vivent que là) :
- **Cerf des cerisiers** : un Tellurien blanc dont les bois fleurissent, en harde. On peut le lier ; il cueille les fleurs et les cerises.
- **Renard des pétales** : un renard crème aux oreilles roses, avec trois queues touffues en éventail. Le bout blanc de ses queues luit la nuit. Il est farouche ; lié, il rapporte les cerises.
- **Lentigrade-cerisier** : un ou deux par île. Un lentigrade géant qui porte un cerisier en fleur sur le dos, d'où tombent aussi des pétales. Très calme, et la meilleure défense des trois.
- Les cotonniers viennent aussi y paître.

**À pêcher** : la **carpe koï**, blanche à taches orange. On ne la trouve que dans les lacs et les rivières qui bordent la cerisaie, et seulement le jour (environ 45 % des prises là-bas). Elle s'ajoute au carnet de pêche (8 poissons).

**À cuisiner** : fleurs de cerisier, cerises, pousses de bambou, pétales de pivoine, iris d'eau, la koï et les douze plantes rares. Deux plats remarquables (leurs indices sont au livre de recettes) :
- **Panier d'hanami** : fleurs de cerisier, cerises, et une graine.
- **Thé du printemps** : fleurs de cerisier et une feuille, rien d'autre.

Comme pour tous les ingrédients, leurs effets sont tirés par le jeu selon leur famille.

**Ce que j'ai décidé seul** : le rang « merveille » ; la fenêtre 1 à 5 et sa fréquence ; la règle de la paix (une bête frappée garde sa rancune) ; la vitesse de la vie qui revient ; le nombre de bêtes (7 cerfs, 4 renards, 2 lentigrades au plus, et quelques petits) ; une île qui avait déjà été tirée peut maintenant porter une cerisaie (ses autres biomes ne bougent pas).

**Pas vérifié** : sur un vrai téléphone (le nombre de pétales en l'air, à 60 images par seconde) ; en coopération.

Dans le code : `index.html`, `RARES` (b 23, `max`), `horsSaison`, `quandRare`, `ESP` (toro, iris, sakura, bambou, pivoine, griottier), `formeFlore` (sakura, toro), `TEX.petales`, `AMBIANCE[23]`, `paixIci`, `majCerisaie`, `petale`, `CERISAIE_SPEC`, `osFelin` (le renard : `renard`, `queues`), `osDoux` (`arbre`), `osTellurien` (`fleurBois`), `POISSONS` (koi, `bio`), `presBiome`, `REMARQUABLES` (hanami, printemps), `HUMEURS.cerisaie` / `cerisaieNuit` ; `flore.js` (biome 23) ; `nomades.js` (l'indice sait que la cerisaie a une saison).

**À déposer** : `index.html`, `flore.js`, `nomades.js`, `sw.js` (qui passe en `stone-valley-80`), `LISEZ-MOI.md`.

## 113. Le son ne ralentit plus le jeu

La musique, l'ambiance et les bruitages demandaient trop au téléphone : le fil audio prenait le processeur, et tout le jeu ralentissait. J'ai mesuré la charge du son (rendu hors ligne, 12 secondes, sur la même machine) :

| scène | avant | après |
|---|---|---|
| calme (ambiance + musique) | 4,4 % | 1,1 % |
| pluie + effets | 7,0 % | 1,4 % |
| combat + effets | 6,5 % | 1,4 % |

Soit quatre à cinq fois moins. Sur un téléphone, ces chiffres sont à multiplier par cinq à dix.

Ce qui a changé :
- **Le son tourne à 24 kHz** au lieu de 48 : tout le calcul coûte moitié moins. Rien dans le jeu ne monte au-dessus de 10 kHz. La latence est « équilibrée » plutôt que la plus courte possible. Si le navigateur refuse, on retombe sur le réglage d'avant.
- **L'écho** : le convolveur (une salle de 1,8 s en stéréo) coûtait à lui seul plus que toute l'ambiance. Il est remplacé par deux retards croisés et filtrés, gauche et droite, qui se renvoient le son. La traîne est plus courte et un peu plus « écho ».
- **L'ambiance** : vent, feuillage, pluie, eau, mer, feu de camp, grillons, machines et lasers tournaient en permanence, même muets. Une boucle qui se tait est maintenant débranchée au bout de 2,5 s, et le navigateur ne la calcule plus. Elle se rebranche dès qu'il faut l'entendre et monte doucement.
- **La musique** : un filtre partagé par timbre au lieu d'un filtre par note, et chaque voix finie est débranchée.
- **Les bruitages** : 24 voix à la fois au plus (au lieu de 44). Un son placé trop loin pour s'entendre (moins de 1,2 % du volume) ne se joue plus. Deux fois moins de gouttes sous la pluie.
- **Le fil principal** : l'ambiance et la musique se mettent à jour dix fois par seconde au lieu de chaque image. Elles planifient de toute façon une demi-seconde d'avance. Les pas et les cris restent à chaque image.

**Ce que j'ai décidé seul** : 24 kHz (on perd l'extrême aigu, au-dessus de 12 kHz) ; l'écho par retards plutôt qu'une salle ; les seuils (24 voix, 1,2 %).

**Pas vérifié** : sur un vrai téléphone (le gain mesuré l'est sur ordinateur, en rendu hors ligne) ; à l'oreille, le nouvel écho et le son à 24 kHz.

Dans le code : `index.html`, `SON` : `demarrer` (le contexte), `brancher` (l'écho), `sortie` (les seuils), `osc` / `souffle` (débranchés à la fin), `filtreCommun`, `note`, `tenir`, `AMB.maj` (`vers` : débrancher, rebrancher), `maj` (dix fois par seconde).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-81`), `LISEZ-MOI.md`.

## 114. Le feu de camp se tait

La boucle de crépitements du feu de camp (§106, placée au feu en §107) est retirée : le feu ne fait plus de bruit. Le reste de l'ambiance ne change pas.

Dans le code : `index.html`, `SON` (la fonction `feuDeCamp` et sa ligne dans `AMB.maj` sont supprimées).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-82`), `LISEZ-MOI.md`.

## 115. Le feu de camp crépite, sans bruit blanc

Le feu reprend sa voix, refaite. L'ancienne boucle (§106) avait sous ses crépitements un lit de bruit qui, normalisé avec eux, s'entendait comme un bruit blanc en s'approchant : il était à −22 dB sous les crêtes. Il est maintenant à −39 dB : un grondement très bas, presque rien.

Les crépitements sont refaits :
- des clics nets (un échantillon, puis une petite résonance aiguë qui s'éteint en une ou deux millisecondes), au lieu de courtes rafales de bruit ;
- six par seconde en moyenne, parfois en grappes ;
- de temps en temps, le « pop » plus grave d'un nœud de bois.

Comme avant (§107), le son est placé au feu : on l'entend en s'approchant, plus fort tout près, à gauche ou à droite selon où l'on regarde. Il est débranché loin du feu (§113), donc il ne coûte rien ailleurs.

Dans le code : `index.html`, `SON`, `feuDeCamp` et sa ligne dans `AMB.maj`.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-83`), `LISEZ-MOI.md`.

## 116. Les plantes rares se font rares

Il y en avait trop : de deux à sept par biome, plus une géante et une vive de temps en temps, soit souvent une vingtaine par île. Maintenant :

| Exploration | Plantes rares sur l'île |
|---|---|
| 0 et 1 | aucune |
| 2 | une |
| 3 à 8 | une, et une seconde de plus en plus souvent (15 % de chances en plus par niveau) |
| 9 et plus | deux |

Quand il y en a deux, elles poussent sur deux biomes différents si l'île en a plusieurs. Le biome nuage (les dalles des îles volantes) compte comme un biome parmi les autres.

*(Remplacé par la section 117 : le port suit maintenant la rareté.)* Leur port vient avec la profondeur : à l'exploration 2, une simple le plus souvent, parfois une géante ; les vives n'apparaissent qu'à partir de l'exploration 3 (6 % + 2 % par niveau, jusqu'à 30 %) ; les géantes passent de 20 % à 40 %.

Mesuré sur 60 graines par niveau : 0 plante aux explorations 0 et 1 ; 1 à l'exploration 2 ; 1,2 en moyenne à 3 ; 1,6 à 6 ; 2 à 9 et au-delà.

Dans le code : `flore.js`, la fin de `floreIle`.

**À déposer** : `flore.js`, `sw.js` (qui passe en `stone-valley-84`), `LISEZ-MOI.md`.

## 117. La rareté des plantes suit le niveau de l'île

Les plantes rares de `flore.js` étaient toutes « rares ». Chacune a maintenant sa rareté, qui est aussi celle de son ingrédient. Dans chaque biome, sur les douze plantes :

| Rareté | Plantes | Port |
|---|---|---|
| commune | les 3 premières simples (étoile, clochettes, éventail) | simple |
| peu commune | les 3 autres simples (crosse, orbe, arbuste) | simple |
| rare | 2 géantes (colosse, saule) | géante |
| exotique | 2 géantes (méduse, arbre-lumière) | géante |
| légendaire | les 2 vives | vive, il faut l'abattre |

**L'île tire la rareté d'après son niveau d'exploration.** Le tirage se centre sur un rang qui monte d'un demi-cran par niveau : commune à l'exploration 2, peu commune vers 4, rare vers 6, exotique vers 8, puis moitié exotiques, moitié légendaires à partir de 9. Mesuré sur 100 graines par niveau (en % des plantes posées) :

| Exploration | commune | peu commune | rare | exotique | légendaire |
|---|---|---|---|---|---|
| 2 | 80 | 19 | 1 | – | – |
| 3 | 43 | 55 | 2 | – | – |
| 4 | 15 | 75 | 9 | 1 | – |
| 5 | 6 | 60 | 31 | 2 | – |
| 6 | 1 | 27 | 58 | 14 | 1 |
| 7 | – | 7 | 49 | 39 | 5 |
| 8 | – | 1 | 14 | 65 | 20 |
| 9 et plus | – | – | 4 | 48 | 48 |

**Pour les potions**, le chaudron demande une rareté minimale par étape (`ALCH_MOTIF`) : les rangs 1 et 2 se font avec des peu communes (explorations 2 à 5), le rang 3 demande des rares (vers 5 à 7), les rangs 4 et 5 des exotiques (vers 7 à 9). La force du personnage suit donc la profondeur. Les autres denrées gardent leur rareté d'avant ; les bêtes et les poissons suivent eux aussi la profondeur depuis la section 118.

**Pour la cuisine**, la flore commune et peu commune compte comme un ingrédient ordinaire ; la rare et l'exotique donnent le même bonus qu'avant ; la légendaire donne la régénération des plats légendaires.

**« Très rare » s'appelle maintenant « exotique »**, partout dans le jeu (même couleur violette, même rang 4), pour que l'échelle soit la même pour tout : commune, peu commune, rare, exotique, légendaire (et épique au-dessus).

Les ingrédients de flore déjà dans le sac prennent la rareté de leur plante. Les effets des ingrédients (tirés d'après leur nom) peuvent changer pour les communes et peu communes : le « cœur » est réservé aux rares et au-delà.

Dans le code : `flore.js` (`FL_TIER`, `FL_RANG`, la fin de `floreIle`) ; `index.html` (`RARETES`, `NOM_RARE`, `RANG_RARE`, le rang de la flore dans les plats).

**À déposer** : `flore.js`, `index.html`, `sw.js` (qui passe en `stone-valley-85`), `LISEZ-MOI.md`.

## 118. Les bêtes, les poissons et les curiosités suivent aussi la profondeur

Une seule échelle pour tout ce qui a une rareté et se trouve sur l'île (index.html, à côté de `RARETES`) :

- `NIV_RARETE` : l'exploration à partir de laquelle une rareté peut se montrer : **commune et peu commune partout, rare dès 4, exotique dès 6, légendaire dès 8, épique dès 10** ;
- `centreRarete(niv)` : la rareté la plus fréquente à ce niveau, qui monte d'un demi-cran par niveau à partir de 2 (commune à 2, peu commune à 4, rare à 6, exotique à 8, légendaire à 10) ;
- `poidsRarete(r, niv)` : le poids d'une rareté autour de ce centre. La flore rare (§117) s'en sert maintenant aussi.

**Les bêtes.** Une bête a la rareté de sa viande. Elle ne vit sur l'île que si cette rareté y est permise ; sinon elle sort du tirage et une autre espèce prend sa place (il y a toujours autant d'espèces).

| Bête | Viande | Avant | Maintenant |
|---|---|---|---|
| spectre | rare | dès 3 | dès 4 |
| coursier orange | rare | dès 3 | dès 4 |
| oglodon | rare | partout (une île sur deux) | dès 4 |
| félin de brume | rare | dès 4 | dès 4 |
| dragon à plumes | exotique | dès 3 | dès 6 |
| coursier rouge | exotique | dès 3 | dès 6 |
| coursier d'aurore | légendaire | dès 6 | dès 8 |

Au-delà de ces seuils, les îles gardent exactement le même bestiaire qu'avant. Les créatures des biomes rares ne sont pas filtrées (leur biome l'est déjà), mais la **queue de varan passe peu commune** : son canyon vient dès l'exploration 2. Les robes et les formes rares (`tirerVariante`) montaient déjà avec la profondeur ; elles ne changent pas.

**Les poissons.** Un poisson ne mord que si sa rareté est permise : anguille et raie (rares) dès 4, lune-de-fond (légendaire) dès 8. Une rareté tout juste permise mord moins souvent, puis de plus en plus en s'enfonçant (l'anguille : 4 % des prises à l'exploration 4, 10 % à 6). Quand rien n'est permis à cette heure (l'océan la nuit avant l'exploration 4), les poissons communs de cette eau mordent quand même. **La carpe koï passe peu commune** : la cerisaie ne vient qu'aux explorations 1 à 5, une exotique n'y aurait jamais mordu.

**Les curiosités des nomades.** Même échelle (`curioPoids`), au lieu des quatre paliers d'avant (0, 4, 8, 13). En % des curiosités proposées :

| Exploration | peu commune | rare | exotique | légendaire | épique |
|---|---|---|---|---|---|
| 0 à 3 | 100 | – | – | – | – |
| 4 | 83 | 17 | – | – | – |
| 5 | 52 | 48 | – | – | – |
| 6 | 17 | 67 | 17 | – | – |
| 7 | 3 | 48 | 48 | – | – |
| 8 | – | 17 | 67 | 17 | – |
| 9 | – | 3 | 48 | 48 | – |
| 10 et plus | – | – | 17 | 67 | 17 |

Avant, une île de départ proposait déjà 25 % de rares et 5 % d'exotiques. Quand toutes les curiosités d'une rareté sont prises, le voyageur propose la plus proche (comme avant).

Dans le code : `index.html` — `NIV_RARETE`, `rareteOk`, `centreRarete`, `poidsRarete` ; `bestiaireGraine` ; `tirerPoisson` et `POISSON_R` ; `curioPoids` et `tirerCurios` ; `VIANDES` (varan). `flore.js` — `floreIle` utilise `poidsRarete`.

**À déposer** : `index.html`, `flore.js`, `sw.js` (qui passe en `stone-valley-86`), `LISEZ-MOI.md`.

## 119. La culture, livraison 1 : le carré de culture

Le début de l'agriculture. Le plan complet :

1. le carré de niveau 1 (cette livraison) ;
2. les niveaux 2 et 3, avec des emplacements moyens et grands, les arbres, les plantes rares, les mauvaises herbes, l'engrais, la clôture et la taille ;
3. les compagnes au jardin ;
4. l'herboriste nomade ;
5. la fin de la repousse sur l'île du campement. Seuls les éclats y repousseront.

Les règles décidées : les carrés ne se posent que sur l'île du campement. Le niveau de l'établi débloque chaque nouvelle taille (établi 1 : petits emplacements, 2 : moyens, 3 : grands). Une plante sans eau ne pousse plus, mais ne meurt pas.

**Le carré de culture** (`carre`, établi 1, 40 bois et 30 fibres) :

- **Le poser.** Il se pose depuis sa fiche au sac (« Poser ici »), comme le campement, et seulement sur l'île du campement. Il faut un carré de cinq cases en terre ferme, à un cube de dénivelé au plus, sans eau, à l'écart du campement, de l'arche, de la fourmilière et des autres carrés.
- **Le terrain.** Le carré nivelle et désherbe son terrain (même mécanisme que le terrassement du campement, avec un cube de marche autour). Il est bordé de planches, et sa terre est labourée en sillons.
- **Combien.** Un carré, un deuxième au palier 3 du campement, un troisième au palier 8 (`champsMax`). La fiche dit combien sont posés et combien restent au sac.
- **Le reprendre.** Il revient au sac (avec confirmation) ; ce qui y poussait est perdu. Reprendre le campement renvoie aussi tous les carrés au sac, vides.

**Quatre petits emplacements**, aux coins du carré du milieu. Chacun montre une butte, et un piquet tant qu'il est libre. On y plante une herbe, une fleur, un champignon, une touffe, un roseau ou un buisson à baies de la flore (`cultivable` : fibre ou baies, petite taille, pas des dalles).

**Les graines** (`P.graines`) :

- **D'où elles viennent.** On en trouve en abattant un pied sauvage cultivable : une fois sur cinq. Au carré, la récolte en rend une fois sur sept. Pour les buissons à baies, c'est une « bouture ».
- **Les choisir.** La fiche du carré les liste ; un appui choisit celle à semer. Par défaut, c'est celle qu'on a en plus grand nombre.

**À la main, devant un emplacement (ACTION) :**

- **SEMER** quand il est libre ;
- **ARROSER** quand la plante a soif et que le seau n'est pas vide ;
- **POUSSE** pour voir où elle en est (pourcentage de pousse et d'eau) ;
- une fois mûre (à partir de 35 %, comme au sauvage), la récolte ordinaire : elle rend **moitié plus** qu'un pied sauvage, puis la plante repart de zéro à la même place.

**La pousse** :

- **Au temps réel, absence comprise** (horodatage `t` de chaque emplacement). Elle dure douze fois la repousse sauvage de l'espèce (`CHAMP_POUSSE`) : de 12 minutes (herbe haute) à une heure environ. C'est moitié plus long hors du biome de la plante.
- **L'eau.** Chaque emplacement a une réserve d'eau. Pleine, elle tient 30 minutes de pousse (`CHAMP_EAU`). L'eau ne se boit qu'en poussant. À sec, la plante s'arrête sans mourir.
- **La pluie** arrose tout le carré : une bonne averse remplit la réserve en une minute et demie.
- **Le seau** (`seau`, établi 1, 8 bois et 6 fibres) arrose. Il sort plein de l'atelier et se remplit tout seul quand on passe au bord de l'eau ; il tient quatre arrosages.
- **À l'œil.** La terre d'un emplacement est plus sombre quand elle est arrosée, plus claire quand elle sèche.

**Dans le code** (`index.html`, section LA CULTURE, juste après le campement) :

- `CHAMP_PLACES`, `cultivable`, `champsMax`, `champsIci` ;
- `pousserPlace` (la pousse), `majPlace`, `champsFloreRetirer` et `champsFloreMettre` (le pied dans la flore) ;
- `placeChamp`, `poserChamp`, `reprendreChamp`, `placeProche`, `semer`, `arroser`, `champAction`, `majChamps` (chaque seconde) ;
- `champOs` (le dessin), `ficheCarre`, `ficheSeau`, `champLu` (la relecture).

**Les branchements** :

- **Dans la flore.** La plante est un pied de la flore comme un autre (`Flo`), mais `maturite` lit sa pousse dans `CHAMP_CASE`. Tant qu'elle n'est pas mûre, elle est rangée avec les pieds qui repoussent (`coupes`), pour se dessiner à part.
- **Récolte.** `couperPied` la remet à zéro ; `coupRecolte` donne le bonus et les graines.
- **Terrassement.** `majTerrasse` nivelle aussi les carrés.
- **Dessin.** Les carrés se dessinent dans `emitCamp` (vue de dessus en canvas et première personne) et dans le rendu WebGL, avec la texture `terre` (nouveau genre de matière).
- **Bêtes.** Le moissonneur sauvage ne fauche pas les carrés.
- **Sauvegarde.** Sont enregistrés : `champs`, `carres`, `graines`, `graineSel` et `seau`.

**Pas encore** : les autres joueurs ne voient pas les carrés (ils ne sont qu'au personnage). Les compagnes récolteuses peuvent y cueillir comme ailleurs. La repousse sauvage est inchangée.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-87`), `LISEZ-MOI.md`.

## 120. La culture, livraison 2 : les carrés clos et grands, les arbres, les plantes rares

**Trois tailles de carré**, chacune débloquée par un niveau d'établi :

| Carré | Établi | Taille | Emplacements | Coût |
|---|---|---|---|---|
| Carré de culture (`carre`) | 1 | 5 × 5 | 4 petits | 40 bois, 30 fibres |
| Carré clos (`carre2`) | 2 | 7 × 7, palissade | 6 petits, 2 moyens | 120 bois, 60 pierres, 10 os |
| Grand carré (`carre3`) | 3 | 9 × 9, palissade | 8 petits, 3 moyens, 1 grand | 300 bois, 150 pierres, 30 éclats |

**Combien de carrés.** Le plafond n'a pas changé : un carré, un deuxième au palier 3 du campement, un troisième au palier 8, toutes tailles confondues. Au plafond, fabriquer une taille plus grande **agrandit** un carré plus petit qui attend au sac (`fabriquer`), en le consommant. La fiche de chaque taille dit combien il y en a de fabriqués, combien au sac, et le total. La sauvegarde garde le nombre par taille (`carres: {1, 2, 3}`) ; un nombre seul, venu d'une sauvegarde du §119, compte comme des carrés de niveau 1.

**Ce qui va où** (`tailleFlore`, `graineInfo`) :

- **Petit** : comme au §119 (herbes, fleurs, champignons, touffes, roseaux, buissons à baies), et les plantes rares simples, donc communes ou peu communes.
- **Moyen** : arbustes (genévrier), cactus, bambou, et les plantes rares géantes, donc rares ou exotiques.
- **Grand** : les arbres (feuillus, conifères, palmiers, josué, géant, arbre de verre, cerisier), et les plantes rares vives, donc légendaires. Au carré, une vive est docile : elle ne bouge pas, ne mord pas, et se cueille comme une autre.
- **Exclus** : les pierres, les métaux, les cristaux, les arbres morts. On ne les cultive pas.

ACTION devant un emplacement libre plante la graine choisie si elle est à sa taille. Sinon, il plante celle qu'on a en plus grand nombre pour cette taille. La fiche donne pour chaque graine sa taille et sa rareté (en couleur).

**Les graines et les plants** (`nomGraine` : « graine », « bouture » pour les baies, « plant » pour le bois) :

| Source | Chance |
|---|---|
| Pied sauvage cultivable abattu, arbres compris | 1 sur 5 |
| Récolte au carré | 1 sur 7 |
| Plante rare cueillie au sauvage | 1 sur 4 |
| Plante rare vive abattue | toujours |

La rareté d'une plante rare suit le niveau de l'île (§117). Une graine légendaire ne se trouve donc que loin, et elle demande un grand carré, donc l'établi 3.

**La pousse** (`dureeChamp`) :

| Plante | Durée de pousse | Exemples |
|---|---|---|
| Flore, petit emplacement | 12 × la repousse sauvage | 12 min à 1 h |
| Flore, moyen emplacement | 24 × la repousse sauvage | bambou 36 min, genévrier 1 h 15 |
| Flore, grand emplacement | 60 × la repousse sauvage | arbres 2 h 30 à 4 h 30 |
| Plante rare simple | 40 min | |
| Plante rare géante | 2 h | |
| Plante rare vive | 4 h | |

Hors de son biome, une plante pousse moitié plus lentement. La réserve d'eau d'un emplacement est plus grande selon sa taille : 30 minutes de pousse pour un petit, 1 h pour un moyen, 2 h pour un grand (`EAU_K`). La pluie la remplit d'autant plus lentement.

**À la main, devant un emplacement (ACTION)**, dans cet ordre :

1. **SEMER**, si l'emplacement est libre.
2. **DÉSHERBER**, s'il y a des mauvaises herbes. Elles viennent en poussant, environ une par heure et demie de pousse (`HERBE_T`), et ralentissent la pousse de moitié. Désherber rend parfois une fibre.
3. **ARROSER**, si la plante a soif et que le seau n'est pas vide.
4. **CUEILLIR**, pour une plante rare mûre. Elle rend 2 ingrédients (3 pour une vive), et une graine une fois sur sept. Une simple repart de zéro ; une géante ou une vive repart de 40 %.
5. **La récolte ordinaire**, pour la flore mûre (dès 35 %).
6. **ENGRAISSER**, pendant la pousse : 2 os, et la plante pousse moitié plus vite jusqu'à maturité.
7. **POUSSE**, qui dit où en est la plante.

**La récolte** rend selon la taille de l'emplacement : moitié plus qu'au sauvage dans un petit, le double dans un moyen, le triple dans un grand (`RECOLTE_K`). Un pin mûr rend environ 15 bois au lieu de 5.

**La taille.** Ce qui donne du bois (arbres, genévrier, bambou) n'est pas abattu au carré : il est **taillé**, et repart du tiers de sa pousse. C'est sous le seuil de récolte, pour qu'on ne puisse pas le tailler en boucle.

**La clôture.** Le carré de niveau 1 n'en a pas. Un herbivore sauvage qui y entre broute ce qui est mûr : la plante retombe à 15 %, avec un message quand on est à moins de 25 pas. Les carrés clos (niveaux 2 et 3) ont une palissade de pieux et de deux lisses, ouverte au sud, et les bêtes n'y broutent plus. La palissade ne bloque pas le passage.

**Ce qu'on voit.**

- Chaque emplacement est une butte à sa taille : plus sombre quand elle est arrosée, plus claire quand elle sèche, avec un piquet tant qu'elle est libre et des brins verts quand il y a des mauvaises herbes.
- La flore semée est un pied de la flore. Une plante rare semée est un corps à part (`CHAMP_RARES`), dessiné comme celles des îles mais sans vie de bête, et qui grandit avec sa pousse.
- Ces corps ne sont qu'au personnage : les autres joueurs ne les voient pas.

Dans le code : `index.html`, section LA CULTURE (réécrite), `couperPied` (la taille), `coupRecolte` (le rendement selon la taille), `emitCamp` et le rendu WebGL (les plantes rares semées), `fabriquer` (l'agrandissement). `flore.js` : `cueillirPlante` et `majPlante` (les graines de plantes rares).

**À déposer** : `index.html`, `flore.js`, `sw.js` (qui passe en `stone-valley-88`), `LISEZ-MOI.md`.

## 121. La culture, livraison 3 : les compagnes au jardin

**Une nouvelle récolte, « Jardin ».** Elle se choisit dans l'onglet Compagnes, avec le rôle Récolte, comme le bois ou la fibre. La compagne soigne alors les carrés de culture de l'île du campement. Elle va au plus pressé :

1. récolter ce qui est mûr ;
2. désherber ;
3. arroser ce qui a soif (moins de 40 % d'eau). Elle va chercher l'eau elle-même : pas besoin de seau.

Deux jardinières ne visent jamais le même emplacement. **Elle ne sème pas** : les graines, c'est vous. Quand il n'y a rien à faire, elle attend au bord du carré le plus proche. S'il n'y a aucun carré sur l'île, elle le dit (une fois toutes les trois minutes).

**Selon le comportement :**

- **Au campement** : tous les carrés de l'île du campement. Son rayon s'élargit jusqu'au carré le plus éloigné (`rayonJardin`). Ce qu'elle récolte va au coffre ; les plantes rares vont au garde-manger du campement (le cellier).
- **Avec le joueur** : les carrés à moins de 14 pas de vous, sur l'île du campement. Ce qu'elle récolte va au sac.
- **Autonome** : les carrés de l'île du campement, de carré en carré.

**Sa note au jardin** (`noteJardin`) : la moyenne de ses notes de fibre et de baies, plus un point pour les Douces, de 1 à 5. Elle règle sa vitesse : un geste dure de 2 fois à 0,8 fois une récolte ordinaire (`DUREE_JARDIN`), et une fois et demie pour arroser. Elle règle aussi ce qu'elle rapporte : le rendement du carré (`RECOLTE_K`) multiplié par le coefficient de sa note, et la chance du produit de la plante. Une plante rare rend 2 ingrédients, 3 pour une vive.

| Bête | Note au jardin |
|---|---|
| Brouteur, glaneur, cotonnier, lentigrade-cerisier | 5 |
| Lentigrade | 4 |

Le jardin ne devient jamais la récolte par défaut d'une espèce (`metierDe`) : il ne se choisit que sur ordre.

**Pendant votre absence** (`jardinAbsence`, appelée par `travailAbsence`) :

- **Combien de temps.** Chaque jardinière du campement tient le jardin une heure et demie (`ABS_MAX`) ; deux jardinières, trois heures.
- **Ce qu'elle fait.** Minute par minute, depuis le départ, elle ôte les mauvaises herbes, remet l'eau, et récolte ce qui mûrit : au coffre, ou au garde-manger pour les plantes rares. Un arbre est taillé, comme sur place.
- **Sans coffre**, elle soigne mais ne récolte pas.
- **Après ce temps**, les plantes poussent seules, comme d'habitude.
- **Le bilan d'absence** compte ce qui a été récolté ; les produits des plantes rares y figurent comme « produits du jardin ».

Exemple mesuré : un carré de quatre petits emplacements, trois heures d'absence, une jardinière : 106 fibres et 4 ingrédients rares en 90 minutes de soins.

**Les autres récolteuses** laissent désormais les carrés tranquilles (`chercherTacheTr`) : seules les jardinières y récoltent. La récolte abstraite des autres récolteuses en votre absence ne change pas : elle reflète la flore sauvage, qui repousse encore. Elle sera revue avec la fin de la repousse sur l'île du campement (livraison 5).

Dans le code : `index.html`, section LES COMPAGNES AU JARDIN, juste avant `majRecolte` : `jardiniere`, `rayonJardin`, `chercherJardin`, `jardinAttente`, `faireJardin`, `majJardin`, `jardinAbsence`. `APT_RES`, `NOM_APT` et `LE_APT` gagnent « jardin ». Ont aussi changé : `noteApt`, `metierDe`, `ancre`, `ORDRES_DIT` (trois textes), `chercherTacheTr` et `travailAbsence`.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-89`), `LISEZ-MOI.md`.

## 122. Les voyageurs du Seuil, quatrième livraison : six nouveaux métiers

La dernière étape du plan des voyageurs (§109). Six métiers rejoignent les haltes. Ce sont tous des inconnus : un nom, une robe et un caractère tirés au hasard. Comme pour les autres, un ami paie 15 % de moins, et le Sceau des nomades un quart de moins.

**Fréquences** : dans 400 haltes tirées à l'exploration 5, chacun des nouveaux métiers paraît de 40 à 58 fois, contre 98 pour la marchande et 83 pour le conteur.

| Métier | Poids | Dès l'exploration | Tenue |
|---|---|---|---|
| Herboriste | 2 | 0 | chapeau de paille, hotte de plants |
| Chasseur de primes | 1,6 | 2 | bonnet à plume rouge, arbalète en travers du dos |
| Collectionneur | 1,2 | 2 | haut-de-forme, monocle, cabinet à tiroirs sur le dos |
| Forgeron | 1,5 | 0 | tablier de cuir, marteau dans le dos |
| Érudit | 1 | 3 | calotte, lunettes, pile de livres sur le dos |
| Musicien | 1,5 | 0 | béret à plume, luth dans le dos |

Les métiers d'avant : marchande 3, conteur 2,5, dresseur 2, cartographe 2, égaré 1,5, devin 1,3 dès l'exploration 3.

**L'herboriste** (« Montre-moi tes graines ») vend quelques sachets par halte, un de chaque :

- de la flore : deux petits, un moyen, un grand ;
- à partir de l'exploration 2, une ou deux graines de plantes rares, dont la rareté suit le niveau de l'île (`poidsRarete`, §117–118).

| Sachet | Contenu | Prix |
|---|---|---|
| Graines, petit emplacement | 3 | 3 éclats et 4 fibres |
| Plants, moyen emplacement | 2 | 5 éclats et 6 bois |
| Plant, grand emplacement | 1 | 8 éclats et 10 bois |
| Plante rare | 1 | de 4 à 40 éclats selon la rareté, et 6 fibres |

Il donne aussi des conseils pour les carrés (« Un conseil pour mes carrés ? », huit, sans redite) et des nouvelles.

**Le chasseur de primes** propose une prime sur une espèce de l'île, plutôt un prédateur ou un automate, dont il reste au moins deux bêtes sauvages.

- **Combien.** Deux ou trois bêtes, payées (5 + 2 × l'exploration) éclats par bête, moitié plus pour un prédateur, plus 2 os par bête. Une fois sur trois, une curiosité en plus (tirée selon le niveau).
- **Le délai.** Dix minutes une fois acceptée. La halte attend jusque-là, et le temps qu'on revienne chercher la paie.
- **Le compte.** Chaque bête de l'espèce qu'on abat compte (`butin` appelle `nmPrime`). Le message dit où on en est (« prime · 2/3 renards des pétales »).

**Le collectionneur** :

- **Il rachète** les ingrédients rares du sac, au plus six sortes à la fois, une unité par appui : 2 éclats pour un rare, 5 pour un exotique, 10 pour un légendaire, 20 pour un épique ; 15 % de plus pour un ami.
- **Il échange** sa curiosité (tirée selon le niveau) contre une des vôtres de même rareté ou plus. Elle est retirée de sa place si on la portait.

**Le forgeron** (les effets sont ceux des plats, et s'ajoutent à leur ligne) :

| Service | Effet | Prix |
|---|---|---|
| Affûte mon arme | coups puissants II, 10 minutes | 8 pierres et 4 éclats |
| Renforce mon armure | peau dure II, 10 minutes | 10 pierres et 3 os |
| Forge-moi dix flèches | 10 flèches | 6 bois et 3 pierres |

Il n'améliore pas les outils : c'est le rôle de l'établi.

**L'érudit** déchiffre les tomes rapportés, sans bibliothèque et sans être au campement. Il respecte l'ordre (le Tome II après le Tome I) et coûte une fois et demie l'encre du pupitre (15, 38 ou 68 éclats). Il parle aussi des matières, sans redite, et donne des nouvelles.

**Le musicien** joue des airs, contre 3 baies (offert pour un ami). La mélodie s'entend : luth pincé, sur la gamme pentatonique (`nmMelodie`).

| Air | Quand | Effet |
|---|---|---|
| Air de marche | toujours | pas vif, 8 minutes |
| Chant des grands vents | toujours | grand souffle, 8 minutes |
| Berceuse | la nuit seulement | toute la vie rendue, toutes les forces rendues aux compagnes, et au moins 80 % de vie à celles qui sont dehors |

**Vérifié en simulation** :

- deux haltes réelles avec les six métiers ;
- un achat de graines (graines au sac, éclats retirés) ;
- une prime de trois renards des pétales (acceptée, comptée, payée : 45 éclats et 6 os) ;
- un rachat (10 éclats pour un croc légendaire) et un échange de curiosités (la portée est retirée de sa place) ;
- l'affûtage (coups puissants II) et les dix flèches ;
- un Tome I déchiffré par l'érudit ;
- l'air de marche et la berceuse, la nuit ;
- 400 haltes tirées, avec leurs métiers ;
- les six tenues, en jeu.

**Ce que j'ai décidé seul** :

- les six métiers et leurs services ;
- les prix, les poids et les niveaux d'apparition ;
- que l'échange accepte une curiosité de rareté supérieure ;
- la durée des effets ;
- que la berceuse ne se joue que la nuit.

Dans le code : `nomades.js`, section LES AUTRES MÉTIERS. On y trouve `nmRemise`, `nmPrix`, `nmPayer`, `nmEffet`, et pour chaque métier :

- l'herboriste : `nmHerbOffre`, `nmGraines`, `NM_HERBES` ;
- le chasseur : `nmPrimeQuete`, `nmChasseur`, `nmPrime` ;
- le collectionneur : `nmRachat`, `nmEchange` ;
- le forgeron : `NM_FORGE`, `nmForge` ;
- l'érudit : `nmDechiffrer` ;
- le musicien : `NM_AIRS`, `nmMelodie`, `nmJouer`.

Les nouveaux rôles s'ajoutent à `NM_ROLE`, `NM_ACCUEIL` et `NM_DIALOGUES`. Ont aussi changé : `nmVenir` (les poids), `nmServices` (la prime retient la halte), `nmOs` (les tenues). Dans `index.html`, `butin` compte les bêtes de la prime.

**À déposer** : `nomades.js`, `index.html`, `sw.js` (qui passe en `stone-valley-90`), `LISEZ-MOI.md`.

## 123. Faire affaire avec le Seuil est un privilège

Les voyageurs proposaient trop : trois curiosités, quatre trocs, des indices à volonté, cinq marques… C'est fini.

**La règle** (`nomades.js`, section « le privilège ») :

- **Une affaire par halte et par voyageur** : un achat, une vente, un service. Un ami (amitié 3 et plus) en fait deux.
- **Un indice par halte et par voyageur** : une rumeur, un conseil, une marque, un lutrin. Un ami en donne deux.
- **Une fois le compte atteint**, les offres restent visibles mais grisées (« — nous avons déjà fait affaire »). Les questions d'indice répondent « C'est tout ce que je sais pour aujourd'hui ».
- **Les récits** (« D'où venez-vous ? », l'histoire du dresseur, le métier du cartographe…) restent libres.

**Ce que chacun propose, par halte :**

| Voyageur | Avant | Maintenant |
|---|---|---|
| Marchande, curiosités | 3 | 1 |
| Marchande, étal | 4 trocs, 2 fois chacun | 2 trocs, 1 fois chacun |
| Dresseur | toutes les techniques qu'on ignore | une seule, tirée au hasard |
| Cartographe | jusqu'à 5 marques | 1, tirée au hasard |
| Devin | la vision, et jusqu'à 3 autres chemins | la vision ; un autre chemin une fois, qui compte pour une seconde affaire (donc pour un ami) |
| Conteur | tous les lutrins de l'île | le lutrin le plus proche, qui compte pour son indice ; le Tome II cédé compte pour son affaire |
| Herboriste | 5 à 6 sachets | 1 sachet, et une fois sur deux un second (une plante rare dès l'exploration 2) |
| Collectionneur | tous vos ingrédients rares, un par un | seulement le plus rare, jusqu'à trois en une fois ; l'échange de curiosité compte aussi comme une affaire |
| Forgeron | ses trois services | un seul, tiré au hasard (affûtage, renfort ou flèches) |
| Érudit | tous les tomes lisibles | un seul tome |
| Musicien | tous ses airs | un seul (la nuit, une fois sur deux la berceuse) |
| Chasseur de primes, égaré | | inchangés : c'était déjà une seule prime, un seul service |

Taille des sachets de l'herboriste : 2 graines pour un petit emplacement, 1 plant pour un moyen ou un grand, 1 graine de plante rare.

**Dans le code** :

- `nmBudget`, `nmPeutAffaire` et `nmAffaire` comptent les affaires de chaque voyageur.
- `NM_AFFAIRES` liste les nœuds d'affaire par métier.
- `nmAller` compte l'affaire au moment du choix, et grise au-delà.
- `nmUnIndice` donne un indice s'il en reste.
- `nmTomes` gère à part le lutrin et le Tome II du conteur.
- Les offres réduites : `nmTirerTrocs`, `nmCurios`, `nmApprendre`, `nmCartes`, `nmAutreChemin`, `nmHerbOffre`, `nmRachat`, `nmForge`, `nmDechiffrer`, `nmJouer`.

**À déposer** : `nomades.js`, `sw.js` (qui passe en `stone-valley-91`), `LISEZ-MOI.md`.

## 124. La culture, livraison 5 : rien ne repousse sur l'île du campement (sauf les éclats)

La dernière étape du plan de la culture (§119).

**Chez soi**, sur l'île du campement, ce qu'on abat ne repousse plus : arbres, buissons, herbes, fleurs, roseaux, pierres, ferraille, buissons à baies, mousse des nuages. **Seuls les éclats repoussent** (druses, obsidienne, lanternes, condensateurs…). Les carrés de culture sont ce qui pousse.

- **Le pied abattu disparaît de la flore**, et l'île s'en souvient (`CAMP_COUPES`). C'est valable que ce soit vous, une compagne ou un équipier qui l'abatte.
- **Les plantes rares** de l'île du campement, une fois cueillies, ne repoussent plus. Une plante vive abattue ne revient pas (`PL_CUEILLIES`).
- **La première fois**, un message le dit : « chez vous, rien ne repousse — sauf les éclats · ce qui pousse, ce sont les carrés de culture ».
- **Les autres îles** ne changent pas : on les retrouve neuves à chaque passage, et elles repoussent comme avant.
- **Reprendre le campement** efface ce souvenir. L'île redevient une île comme les autres, et un nouveau campement repart d'une île intacte.

**La sauvegarde** garde l'île (`coupesCamp.g`), ses cases abattues (en ordre croissant, chacune par son écart à la précédente, en base 36 : environ 3 octets par case, 212 octets pour 71 cases) et ses plantes rares cueillies. Au chargement, le terrassement les réapplique (`coupesCampAppliquer`).

**Les bêtes et les gens qui ne cueillent plus chez vous** (sinon ils videraient l'île) :

- les cueilleuses et cueilleurs d'un village posé sur l'île du campement ;
- les oglodons, qui ne vont plus chercher de baies ;
- le moissonneur sauvage, qui ne fauche plus.

**Les récolteuses pendant votre absence** (`travailAbsence`, `recolteReelle`) :

- **Ce qui ne repousse pas** (bois, pierre, fibre, baies, ferraille) se prend maintenant sur la flore réelle de l'île. Elles abattent les pieds les plus proches du feu, à 24 cases au plus, jamais dans un carré ni dans le rond du campement, et pas plus de 25 pieds par récolteuse et par absence (`ABS_PIEDS`). Ces pieds sont abattus pour de bon.
- **Quand il n'y a plus rien** de leur matière autour du feu, le bilan le dit : « plus de bois autour du campement ».
- **Les éclats, la chasse et la pêche** restent comptés comme avant : ils se renouvellent.
- **Sur place**, une récolteuse au campement abat pour de bon, comme vous.

Exemple mesuré : une récolteuse de bois (carillonneur), deux heures d'absence, 158 bois (25 pieds) ; l'île de l'essai n'avait que 71 pieds de bois autour du feu, épuisés à la troisième absence.

**Dans le code** : `index.html`, juste après `CHAMP_CASE` : `CAMP_COUPES`, `PL_CUEILLIES`, `coupeDefinitive`, `retirerPied`, `coupesCampAppliquer`, `coupesEcrire`, `coupesLire`. Ont aussi changé :

- `couperPied` (la coupe définitive) ;
- la réception d'une coupe d'équipier ;
- `majTerrasse` ;
- le moissonneur sauvage, et `buissonPourOglodon` ;
- `recolteReelle` et `travailAbsence` ;
- la sauvegarde et `reprendreCampement`.

Ailleurs : `flore.js` (`plCueillie`, dans `cueillirPlante` et à la mort d'une vive) et `village.js` (les cueilleuses).

**À déposer** : `index.html`, `flore.js`, `village.js`, `sw.js` (qui passe en `stone-valley-92`), `LISEZ-MOI.md`.


## 125. La culture, livraison 6 : les carrés à plusieurs

Sur l'île de votre campement, les autres joueurs voient vos carrés de culture et peuvent s'en occuper pour vous.

**Ce que voit le visiteur.** Vos carrés et ce qui y pousse : la terre aplanie, les sillons, les plantes à leur stade, les mauvaises herbes. Votre jeu les lui envoie à son arrivée, puis à chaque changement (au plus une fois par seconde), et toutes les 30 secondes de toute façon. Ils disparaissent quand vous quittez l'île.

**Ce qu'il peut faire.** Le bouton ACTION, au bord de vos carrés :

- **DÉSHERBER**.
- **ARROSER** : il utilise son propre seau.
- **RÉCOLTER** une plante mûre, pour vous : le bois, la fibre ou les baies vont à votre coffre (ou à votre sac si vous n'avez pas de coffre), les ingrédients des plantes rares à votre garde-manger. Un arbre est taillé, comme quand vous le récoltez vous-même.
- **Il ne sème pas.** Un emplacement vide affiche « CARRÉ de Romain · lui seul y sème ».

Il ne gagne rien : c'est un coup de main. Sa récolte ordinaire (le geste habituel sur la flore) ne prend pas dans vos carrés. Les cueilleuses des villages non plus.

**Ce que vous voyez.** « Pascal récolte votre pin · +15 bois au coffre » ; « Pascal arrose votre coquelicot ».

**Qui décide.** Votre jeu. Le geste du visiteur part chez vous ; votre jeu le vérifie (plante mûre, herbes présentes), l'applique et renvoie l'état. Un geste rejoué, ou qui ne vous est pas adressé, est ignoré. Hors ligne, rien ne part.

**Pas prévu** : piller les cultures pendant un raid.

**Dans le code** (`index.html`, bloc « les carrés à plusieurs », dans LA CULTURE) :

- les fonctions `CHAMPS_LOIN`, `champsVus`, `champPhoto`, `envoyerChamps`, `champLoinLu`, `recevoirChamps`, `oublierChampsLoin`, `actionChampLoin` et `champRecu` ;
- les messages `champs` (l'état des carrés) et `champ` (un geste) ;
- le terrassement, le dessin, `placeProche`, `placeChamp` et `champsFloreMettre` passent à `champsVus` ;
- `noeudProche` saute les cases des carrés des autres ;
- `majDistant` envoie les carrés aux nouveaux venus, `effacerDistant` les oublie.

Ailleurs : `village.js` (les cueilleuses ne prennent rien dans un carré).

## 126. Le journal de jeu (statistiques pour l'équilibrage)

Ce qui se passe en partie part, par paquets, dans une table Supabase, `vp_journal`. On y voit comment on joue vraiment : ce qu'on récolte, ce qu'on fabrique, où l'on meurt, combien de temps entre deux niveaux, la fluidité selon les appareils.

**Ce qui est noté.** Chaque ligne porte un genre, des données, l'heure de jeu, la session et la version.

| Genre | Quand | Données |
|---|---|---|
| `session` / `arrivee` | début de partie / chaque île (la page se recharge) | appareil, écran, WebGL, île, exploration, campement, vies, compagnes, sorts, tomes, minutes de session |
| `instantane` | toutes les 5 minutes | sac, coffre, garde-manger, ingrédients par rareté, modules, compagnes (espèce, rôle, mode), carrés, graines, pieds abattus au campement ; sur ces 5 minutes : récoltes par matière, coups, bêtes tuées par espèce, plats et potions consommés ; perf (images/s, ms de dessin, mémoire, bêtes vivantes) |
| `passage` | changement d'exploration, de niveau de campement, d'étage de donjon, entrée ou sortie de raid | avant, après, minutes de session |
| `portail` | départ vers une île | île visée, niveau, part du butin de raid |
| `coeur` | cœur perdu | vies restantes, tout perdu ou non, lieu (île, exploration, chez soi, donjon, raid, heure) |
| `fabrique`, `module`, `campement` | objet fabriqué, module créé ou amélioré, campement posé ou repris | objet, niveaux, coffre |
| `culture` | carré posé ou repris, semis, cueillette, geste d'un visiteur | graine, taille |
| `lien` | bête liée | espèce, rareté, nombre de compagnes |
| `culture` (§139) | semer, cueillir, récolter, arracher au carré | `q` : `seme`, `cueille`, `recolte`, `arrache` ; la graine, ce qui est rapporté |
| `potion`, `plat` | essai d'alchimie, plat cuisiné | potion, rang, chance, ingrédients, réussite, et depuis le §133 : points perdus aux gestes, fautes d'ordre, eau, cuisson (`tot`, `ok`, `tard`), potion parfaite ; niveau de la cuisine |
| `nomade`, `prime` | affaire faite avec un voyageur, prime remplie | métier, affaire, amitié |
| `absence` | retour au jeu | minutes, compagnes au camp, ce qu'elles ont rapporté |
| `erreur` | incident technique | lieu, message (20 par session au plus) |

**Comment ça part.** La file attend dans le navigateur. Elle part toutes les minutes, ou dès 40 lignes, 60 lignes par envoi au plus. Elle est gardée dans le navigateur au changement d'île, à l'arrière-plan et hors ligne, puis renvoyée ensuite. La base refuse au-delà de 1 500 lignes par heure et par joueur (une partie normale en écrit 20 à 40). Pas d'envoi en mode essai.

**Pour le joueur.**

- Réglages › Aide › **Statistiques de jeu** : « Envoyées » / « Coupées ».
- La page « Données personnelles » le dit.
- « Supprimer mon compte » efface aussi le journal.

**Dans la base** (migration `vp_journal`, appliquée le 14 octobre 2026) :

- la table `vp_journal`, en RLS sans aucune règle : personne ne la lit ni ne l'écrit directement ;
- la fonction `vp_journaliser(p_session, p_version, p_lignes)`, réservée aux joueurs connectés, qui vérifie chaque ligne (genre de 32 caractères au plus, données de 4 Ko au plus, heure plausible) ;
- `vp_supprimer_compte` n'a pas changé : les lignes du journal sont attachées au compte (`on delete cascade`) et partent avec lui.

Si la fonction venait à manquer, le jeu s'en apercevrait au premier envoi et se tairait jusqu'à la fin de la session. Essai fait à l'application de la migration : deux lignes valides gardées sur quatre envoyées (un genre vide et des données en tableau rejetés), une heure invalide mise à vide.

```sql
create table if not exists public.vp_journal (
  id bigint generated always as identity primary key,
  utilisateur uuid not null references auth.users(id) on delete cascade,
  session text not null default '' check (char_length(session) <= 24),
  version text not null default '' check (char_length(version) <= 24),
  genre text not null check (char_length(genre) between 1 and 32),
  donnees jsonb check (donnees is null or pg_column_size(donnees) <= 4096),
  joue_le timestamptz,
  cree_le timestamptz not null default now());
create index if not exists vp_journal_genre_idx on public.vp_journal (genre, cree_le desc);
create index if not exists vp_journal_utilisateur_idx on public.vp_journal (utilisateur, cree_le desc);
alter table public.vp_journal enable row level security;

create or replace function public.vp_journaliser(p_session text, p_version text, p_lignes jsonb)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare v_uid uuid := auth.uid(); v_deja int; v_n int := 0; l jsonb; v_t timestamptz;
begin
  if v_uid is null then raise exception 'compte requis'; end if;
  if jsonb_typeof(p_lignes) is distinct from 'array' then raise exception 'lignes attendues'; end if;
  select count(*) into v_deja from public.vp_journal where utilisateur = v_uid and cree_le > now() - interval '1 hour';
  if v_deja >= 1500 then return jsonb_build_object('ok', false, 'plein', true); end if;
  for l in select value from jsonb_array_elements(p_lignes) limit least(60, 1500 - v_deja) loop
    continue when jsonb_typeof(l) <> 'object' or jsonb_typeof(l->'g') <> 'string' or char_length(l->>'g') not between 1 and 32;
    continue when l ? 'd' and jsonb_typeof(l->'d') not in ('object', 'null');
    continue when pg_column_size(l->'d') > 4096;
    v_t := null;
    if jsonb_typeof(l->'t') = 'number' then
      v_t := to_timestamp((l->>'t')::double precision / 1000);
      if v_t < now() - interval '7 days' or v_t > now() + interval '1 hour' then v_t := null; end if;
    end if;
    insert into public.vp_journal (utilisateur, session, version, genre, donnees, joue_le)
      values (v_uid, left(coalesce(p_session, ''), 24), left(coalesce(p_version, ''), 24), l->>'g', nullif(l->'d', 'null'::jsonb), v_t);
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'n', v_n);
end $$;
revoke all on function public.vp_journaliser(text, text, jsonb) from public, anon;
grant execute on function public.vp_journaliser(text, text, jsonb) to authenticated;
```

**Lire le journal** (éditeur SQL) :

```sql
-- les dernières lignes
select cree_le, genre, donnees from vp_journal order by cree_le desc limit 100;
-- où l'on meurt
select donnees->>'expl' expl, (donnees->>'dj')::int >= 0 donjon, count(*) from vp_journal where genre = 'coeur' group by 1, 2 order by 1;
-- ce qu'on récolte, par matière, sur les instantanés
select k, sum(v::int) from vp_journal, jsonb_each_text(donnees->'recolte') e(k, v) where genre = 'instantane' group by k order by 2 desc;
-- la fluidité selon l'appareil
select round(avg((donnees->'perf'->>'img_s')::numeric)) img_s, donnees->'perf'->>'mode' mode, count(*) from vp_journal where genre = 'instantane' group by 2;
```

**Dans le code** : `index.html`, bloc « le journal de jeu », juste avant la boucle d'images :

- les fonctions `jnl`, `jnlEnvoyer`, `jnlGarder`, `jnlInstantane`, `jnlTic`, `jnlBrancher` et `jnlDemarrer` ;
- `jnlBrancher` enveloppe les fonctions de jeu (`fabriquer`, `faireCamp`, `semer`, `lier`, `tenterAlch`, `cuire`, `perdreCoeur`, `voyagerVers`, `travailAbsence`, `rattraper`…). Elle regarde avant et après, sans rien y changer ;
- `jnlTic` tourne avec la sauvegarde (toutes les deux secondes) ;
- `JNL_VERSION` suit le cache de `sw.js`.

Ailleurs : `nomades.js` (l'affaire faite).

**À déposer** (pour les sections 125 et 126) : `index.html`, `nomades.js`, `village.js`, `sw.js` (qui passe en `stone-valley-93`), `LISEZ-MOI.md`. La migration est appliquée (14 octobre 2026).

## 127. L'Achromie, livraison 1 : l'île sans couleur, les veilleurs, le sanctuaire rouge

Un troisième état d'île, en escape game. Dès l'exploration 4, environ une île sur huit (13 %) : la couleur a quitté l'île et le prisme de son arche s'est brisé. Pas d'autre état d'île en même temps, et jamais sur une île de Tisseuse.

**Ce qu'on voit.**

- Tout est gris : le sol, le ciel, l'eau, les bêtes, vous et vos compagnes. Le menu et les jauges restent en couleur.
- La musique se tait.
- L'arche est éteinte : plus de voile, un chaton vide en haut, des débris au pied. ACTION y dit **PRISME · brisé** et donne la direction du sanctuaire.
- Le HUD affiche « achromie · éclats 0/1 ».

**La lanterne prismatique** (touche **O**, ou le bouton LANTERNE au-dessus d'ATTAQUER).

- Dans son halo, environ 4 cases autour de vous, les vraies couleurs reviennent, vous compris.
- Elle tient 70 secondes allumée et se recharge en 30 secondes éteinte.

**Les veilleurs.** De grandes silhouettes noires, avec un masque blanc et une fente qui luit.

- **Où** : un dans la cour du sanctuaire, deux autour de son enceinte, un autour de l'arche, deux au loin.
- **Leurs rondes** suivent l'horloge réelle : deux joueurs de l'île les voient aux mêmes places sans rien échanger. Ils ne font pas partie de la faune partagée.
- **Leur regard** : un cône de 70° qui balaie de part et d'autre de leur route. Une poussière pâle au sol montre jusqu'où il porte. Les murs l'arrêtent.
- **Ils voient la couleur** : lanterne allumée, ils vous voient jusqu'à 9,5 cases ; éteinte, jusqu'à 3,4 cases. Chaque couleur rendue retire 12 % à leur portée.
- **Vu**, un voile blanc monte, environ 0,8 seconde de près avec la lanterne. Il redescend si vous sortez du cône.
- **Délavé** quand il est plein : vous revenez au dernier seuil (le point d'arrivée, ou l'entrée du sanctuaire dès qu'on est entré dans la cour). La lanterne est vide et les braseros se rééteignent. Pas de cœur perdu.
- Ils sont invulnérables (« le coup traverse le gris »). Vos compagnes les ignorent.
- Les 20 premières secondes sur l'île, ils ne voient rien.

**Le sanctuaire rouge.**

- **L'enceinte** : 17 × 17 cases, murs de 4 cubes, sur un replat tiré de la graine (le même pour tous). Son entrée regarde vers l'arrivée. Le sol est dallé et les petits gouffres sont comblés. Pas de campement ni de carré de culture dessus.
- **Dans la cour** :
  - quatre **braseros** sur leurs socles, chacun cerclé d'une bague en céramique rouge, verte, bleue ou jaune. Les quatre ont la même clarté : dans le gris, ils sont identiques ;
  - une **fresque** sur le mur du cœur montre l'ordre des feux en couleurs ;
  - un **lutrin** donne trois **indices**, un toutes les 40 secondes au plus. Le dernier donne l'ordre.
- **Les gestes** (ACTION) :
  - **LIRE** la fresque : sans lanterne, « toutes du même gris » ; avec, l'ordre en toutes lettres, pour les daltoniens ;
  - **ALLUMER** un brasero : avec la lanterne, l'étiquette nomme la couleur de sa bague. Une erreur éteint tout : « un souffle gris… ».
- **Les quatre feux dans l'ordre** : la porte du cœur s'ouvre.
- **Sur l'autel** : **PRENDRE** l'éclat rouge. Le rouge revient sur toute l'île : rouges, orangés, bruns et le feu. Les veilleurs voient moins loin.
- L'éclat est gardé par la logique du jeu : passer par-dessus un mur ne permet pas de le prendre.

**À l'arche** : **PRISME · reposer l'éclat**.

- Toute la couleur revient en deux ou trois secondes. Les veilleurs éclatent en couleurs, l'arche se rallume et FRANCHIR revient.
- Vous recevez **un pigment**, un seul par île et par joueur. Sa rareté suit le niveau de l'île, avec le même calcul que les plantes rares (`poidsRarete`) : plutôt peu commun à l'exploration 4, rare à 6, exotique à 8, légendaire à 10. L'épique n'existe qu'au plus profond : la nacre prismatique.

| | commun | peu commun | rare | exotique | légendaire |
|---|---|---|---|---|---|
| rouge | ocre rouge | garance | cinabre | carmin | pourpre |
| jaune | ocre jaune | safran | orpiment | jaune indien | or |
| vert | terre verte | vert-de-gris | malachite | vert émeraude | jade |
| bleu | guède | azurite | indigo | lapis-lazuli | bleu céleste |

Les pigments se voient dans le Journal (rubrique « Pigments »). Leur usage viendra plus tard.

**Sauvegardé.**

- `P.achromies` : les îles rendues à leurs couleurs. En y revenant, l'île est en couleur, sans veilleurs, et on ne gagne pas de second pigment.
- `P.grisProg` : l'île en cours (sanctuaire résolu, éclats pris). Un rechargement de la page ne fait rien perdre.
- `P.pigments`.

**Le journal de jeu** (§126) note des lignes `achromie` : arrivée, fresque lue, indice, mauvais ordre, sanctuaire résolu, éclat, délavage, fin. Elles portent les minutes passées sur l'île, le nombre de délavages, d'indices et de fautes, et le pigment.

**Le gris lui-même** est fait par la carte graphique.

- Le code GLSL `GRIS_GLSL` est inclus dans les shaders du décor, des panneaux et du ciel. Chaque couleur rendue garde sa bande de teinte : rouge −32° à 36°, jaune 36° à 72°, vert 72° à 168°, bleu 168° à 262°, violet 262° à 328°. La lanterne garde tout dans son halo. Le reste passe au gris de même clarté, contraste ×1,18.
- `GRIS_GL` porte ces valeurs à chaque image.
- Sans carte graphique (mode de secours), c'est un filtre CSS global, moins fin.

**Dans le code** :

- `achromie.js` (nouveau) ;
- `etats.js` : `etatGraine`, `etatsIle`, `etatsSolDOrigine`, `majEtats`, `dessinerFiltre`. Les visions du Korlaz ne comptent pas les veilleurs ;
- `index.html` :
  - les shaders ;
  - `majBete` et le dessin des bêtes ;
  - ACTION ;
  - `auPortailIle` et `portailOs` (l'arche éteinte) ;
  - `placeCamp` et `placeChamp` ;
  - la touche O ;
  - la musique ;
  - le portail du campement (vœu « Achromie ») ;
  - la sauvegarde ;
  - le Journal ;
  - le HUD.

**Pas encore** (livraisons 2 et 3) :

- les sanctuaires jaune, vert et bleu, avec leurs mécanismes (miroirs, blocs, plaques, vannes) ;
- l'arc-en-ciel ;
- la musique qui revient instrument par instrument ;
- l'Achromie partagée en coop : pour l'instant, chacun résout la sienne et voit sa propre porte.

**À déposer** : `achromie.js` (nouveau), `index.html`, `etats.js`, `sw.js` (qui passe en `stone-valley-94` et met `achromie.js` en cache), `LISEZ-MOI.md`.

## 128. L'Achromie, livraison 2 : le nouveau nom, et les sanctuaires jaune, vert et bleu

**Le nom.** La Grisaille s'appelle désormais l'**Achromie** (« sans couleur »). Changent avec lui : le fichier, qui devient `achromie.js` (`grisaille.js` disparaît), l'état d'île `achromie`, le HUD (« achromie · éclats 0/4 »), le vœu du portail, le journal de jeu (lignes `achromie`) et la sauvegarde (`P.achromies`). Une sauvegarde qui porterait encore `grisailles` est relue.

**Jusqu'à quatre sanctuaires par île.**

- Le rouge est toujours là. Les autres sont tirés de la graine.
- Sur une petite île, faute de place, il en manque parfois un.
- Ils sont éloignés d'au moins 26 à 30 cases les uns des autres.
- L'arche demande tous les éclats de l'île : « PRISME · brisé · 1 sur 4 ». Elle indique le sanctuaire manquant le plus proche et sa direction.

Chaque sanctuaire a :

- son enceinte et sa porte du cœur ;
- son autel et son éclat : prendre l'éclat rend sa couleur à l'île, et chaque couleur rendue retire 12 % à la portée des veilleurs ;
- son lutrin, avec ses trois indices ;
- trois veilleurs : un dans la cour, au ras des dalles, deux autour de l'enceinte.

Il y a aussi un veilleur autour de l'arche et deux au loin, soit 15 en tout avec quatre sanctuaires.

**JAUNE · les miroirs.**

- Un soleil de pierre, sculpté dans le mur de gauche, lance un rayon.
- Cinq miroirs sur pied se tournent d'un quart de tour (**TOURNER**) et renvoient le rayon. Trois servent, deux sont des leurres.
- Quand le rayon touche le cristal devant la porte, celui-ci s'allume et la porte s'ouvre.
- **Le rayon ne se voit qu'à la lanterne**, et seulement dans son halo. Le cristal allumé, lui, se voit de loin.

**VERT · les blocs.**

- Il y a trois dalles. Deux sont bordées de couleur ; la troisième porte une empreinte de pas.
- Deux blocs de mousse portent chacun une couleur : **POUSSER** les déplace d'une case dans le sens de la poussée.
- Les blocs sont de vrais cubes : on bute dessus et on peut monter dessus. Un mur, un autre bloc ou un objet les arrête.
- La porte s'ouvre quand chaque bloc est sur la dalle de sa couleur et que la troisième dalle porte un poids vivant : vous, ou une compagne.
- Dans le gris, les couleurs des blocs et des dalles se confondent ; à la lanterne, l'étiquette de POUSSER nomme la couleur du bloc.
- Un **levier** près de l'entrée (**RAMENER**) remet les blocs en place, pour sortir d'un coin.

**BLEU · les bassins.**

- Il y a un grand bassin de cinq mesures et un petit de trois.
- Six vannes remplissent, vident, ou versent un bassin dans l'autre (**REMPLIR**, **VIDER**, **VERSER**).
- La porte s'ouvre quand le grand bassin contient la mesure marquée par une encoche peinte en bleu. Ce bleu a la même clarté que la pierre : il ne se voit qu'à la lanterne.
- La mesure, tirée de la graine, est de 4 ou de 1 : six gestes dans les deux cas.
- ACTION sur un bassin donne son niveau et, à la lanterne, nomme l'encoche.

**Sauvegardé** : les sanctuaires résolus et les éclats pris (`P.grisProg`). Relus, les mécanismes sont remis dans leur état final : braseros allumés, rayon au cristal, blocs sur leurs dalles, bassin à la mesure. L'état d'un mécanisme en cours n'est pas gardé : un rechargement le remet à zéro.

**Le journal de jeu** note, par sanctuaire : sa résolution, les indices pris, les erreurs et les délavages.

**Dans le code** : `achromie.js`, réécrit pour plusieurs sanctuaires.

- `grBatir` construit chaque sanctuaire ; `GRIS.SS` les liste ; `grDans` trouve celui où l'on se tient.
- Le jaune : `grRayon`, `grMiroirDir`.
- Le vert : `grPousser`, `grBlocA`, `grBlocsA`, `grDallesTenues`.
- Le bleu : `grVanne`.
- `grResoluNet` remet un sanctuaire dans son état final.

**Pas encore** (livraison 3) : l'arc-en-ciel, la musique qui revient instrument par instrument, l'Achromie partagée en coop.

**À déposer** : `achromie.js` (nouveau ; supprimer `grisaille.js` du dépôt s'il y a été mis), `index.html`, `etats.js`, `sw.js` (qui passe en `stone-valley-95`), `LISEZ-MOI.md`.

## 129. L'Achromie, livraison 3 : l'arc-en-ciel, la musique qui revient, l'Achromie à plusieurs

**L'arc-en-ciel.**

- Sur une île frappée d'Achromie, un arc-en-ciel éteint se dresse dans le ciel, au-dessus de l'arche : son centre est toujours dans la direction de l'arche vue d'où l'on se trouve. Il se voit en 1re personne, et dans la vue de dessus en perspective.
- Le gris le prend comme le reste. Chaque éclat rapporté lui rend sa bande : le rouge à l'extérieur, puis le jaune, le vert, le bleu. Le violet, à l'intérieur, revient avec le prisme.
- C'est un compteur dans le ciel, et un repère pour retrouver l'arche.
- Le prisme reposé, il brille en entier une minute et demie, puis s'efface.

**La musique revient par couches.**

| | |
|---|---|
| aucun éclat | le silence |
| moins de la moitié des éclats | les accords seuls, en nappe |
| la moitié ou plus | les accords et la mélodie |
| le prisme reposé | toute la musique, y compris la pulsation des lointains |

**L'Achromie à plusieurs.** Les joueurs d'une même île partagent la même Achromie.

- **Les gestes** passent chez les autres et y sont rejoués : un brasero allumé (une erreur éteint aussi les braseros des autres), un miroir tourné, un bloc poussé, le levier, une vanne.
- Un **sanctuaire ouvert** l'est pour tous. Sur la dalle du vivant, un autre joueur compte comme poids, au même titre que vous ou une compagne.
- Un **éclat pris** par un joueur quitte l'autel pour tous, et la couleur revient pour tous.
- **Le prisme** peut être reposé par n'importe lequel des joueurs. Chacun de ceux qui sont sur l'île à ce moment-là reçoit son pigment, toujours un seul par île.
- **Un nouveau venu** reçoit l'état de l'île : sanctuaires ouverts, éclats pris, mécanismes en cours. Si l'île est déjà rendue à ses couleurs, il la trouve en couleur, sans pigment.
- **Restent propres à chacun** : la lanterne, les regards des veilleurs, le délavage.
- **Sauvegardé** : chacun garde dans sa propre sauvegarde ce que l'équipe a fait.

**Dans le code** :

- `achromie.js` :
  - le message `achro` : l'état (`grEtat`, `achromieEnvoyer`, envoyé à chaque nouveau venu), les gestes, les éclats, l'ouverture d'un sanctuaire, la fin ;
  - `achromieRecu` reçoit ces messages ; `grDire` les envoie ;
  - `grFinir` prend un mode : `local`, `equipe` ou `relu` ;
  - `achromieVoix` donne la couche de musique.
- `index.html` :
  - le ciel (`arcCoul`, `uArc`, `GRIS_GL.arc`) ;
  - `MUS.phrases` ;
  - `recevoir` et `majDistant`.

**À déposer** : `achromie.js`, `index.html`, `sw.js` (qui passe en `stone-valley-96`), `LISEZ-MOI.md`.

## 130. Graines et plants : une seule réserve, au garde-manger

Les graines à semer (§120) vivaient à part : on ne les voyait qu'en texte, dans la fiche d'un carré de culture. Elles rejoignent le garde-manger du sac.

**Au sac**, sous le garde-manger, une rangée **Graines et plants**. Chaque graine a son icône, bordée de sa rareté :

- un **sachet** de papier, marqué à la couleur de la plante, pour les herbes, les fleurs et les plantes basses ;
- un sachet mauve étoilé pour les **plantes rares** ;
- un **plant en motte** pour les arbres ;
- une **bouture** pour les buissons à baies.

Un appui choisit la graine à semer : ACTION devant un emplacement libre de sa taille. La fiche du carré de culture garde aussi sa liste.

**Les graines qui se mangent.** Quatre plantes donnent des graines comestibles : les pignons de pin, les glands, les graines d'herbe haute et les cônes de cyprès.

- Pour elles, la graine à semer et la denrée ne font plus qu'une : il faut choisir entre les manger et les semer.
- Elles se rangent sous « Graines et plants », et non plus dans la rangée du garde-manger.
- Un second appui sur une graine déjà choisie la mange crue.
- Elles restent dans les pages Cuisine et Alchimie, sous « Graines ».
- Les « plants de pin », de chêne, de cyprès et d'herbe haute d'une ancienne sauvegarde y sont versés.

**Les autres graines** ne se mangent pas, comme avant.

**Corrigé au passage** : depuis la §124, un commentaire avait avalé trois champs de la sauvegarde. Les graines, la graine choisie et l'eau du seau ne se gardaient plus d'une partie à l'autre. Elles se gardent de nouveau ; celles perdues entre-temps ne reviennent pas.

L'herboriste du Seuil met ses sachets dans la même réserve. Quand c'est une des quatre graines comestibles, elle va directement au garde-manger.

**Dans le code** (`index.html`, bloc LA CULTURE) :

- les fonctions `graineIngr`, `stockGraine`, `oterGraine`, `grainesDispo`, `icGraine`, `blocGraines` et `dessinGraine` ;
- `gagnerGraine` reçoit un nombre ;
- `semer`, `graineChoisie`, la fiche du carré, le sac, la sauvegarde et le journal de jeu passent par elles.

Ailleurs : `nomades.js` (l'herboriste).

**À déposer** : `index.html`, `nomades.js`, `sw.js` (qui passe en `stone-valley-97`), `LISEZ-MOI.md`.

## 131. La fenêtre du carré de culture

Dans un carré, ACTION ne fait plus un seul geste à la fois : elle ouvre **la fenêtre du carré**, sur l'emplacement visé. Le bouton ACTION affiche alors « CARRÉ » avec un résumé, par exemple « Coquelicot · 41 % · herbes ».

**L'en-tête** donne :

- le carré (« Carré de culture », « Carré clos », « Grand carré ») ;
- le nombre d'emplacements semés et à récolter ;
- l'eau du seau et les os en réserve ;
- la croix pour fermer.

**À gauche, le plan du carré.**

- Chaque emplacement est à sa place et à sa taille (petit, moyen, grand), avec :
  - l'icône de sa plante ;
  - une barre de pousse ;
  - un astérisque vert s'il a des mauvaises herbes ;
  - un point bleu s'il a soif ;
  - un liseré doré s'il est mûr.
- Le point blanc, c'est vous.
- Un appui sur un emplacement le choisit. On soigne tout le carré sans bouger.

**À droite, l'emplacement choisi.**

- **Libre** : les graines de sa taille, en icônes, avec leur nombre. Un appui sème. S'il n'y en a pas, la fenêtre dit où en trouver.
- **Planté** :
  - la plante (icône, nom, rareté) ;
  - la barre de pousse et la barre d'eau ;
  - quand elle sera mûre, si l'eau tiendra jusque-là, les herbes, l'engrais ;
  - les gestes, en gros boutons à icône, grisés quand ils ne s'appliquent pas, dorés quand ils s'imposent :
    - **Récolter**, d'un seul geste : tous les coups de la récolte ordinaire d'affilée. Un arbre est taillé, une fleur repart de zéro. Pour une plante rare, c'est **Cueillir**.
    - **Désherber**.
    - **Arroser**, avec le seau.
    - **Engraisser**, 2 os.
    - **Arracher**, en deux appuis. La place se libère ; la graine revient si elle venait d'être semée.

**Fermer** : ACTION de nouveau (le bouton dit « FERMER »), Échap, la croix, ou s'éloigner du carré. Ouvrir le sac la ferme aussi.

**Au clavier** : les flèches passent d'un emplacement à l'autre, Entrée fait le premier geste.

**Le geste part à l'appui**, pas au relâché : la fenêtre se met à jour en continu, et un appui ne doit jamais se perdre.

**Ne changent pas** :

- le carré d'un autre joueur (§125), qui garde ses gestes directs (désherber, arroser, récolter pour lui) ;
- les jardinières (§121).

**Dans le code** (`index.html`, bloc LA CULTURE, après `champAction`) : `CU`, `ouvrirCarre`, `fermerCarre`, `basculerCarre`, `rendreCarre`, `cuGeste`, `recolterPlace`, `arracherPlace` et `cuStyle` (le style, ajouté à la première ouverture). La récolte ordinaire de la flore n'a plus à trancher dans un carré : `champAction` ouvre toujours la fenêtre.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-98`), `LISEZ-MOI.md`.

## 132. L'engrais se prépare au carré

L'engrais n'est plus pris directement dans les os à chaque emplacement. Il se **prépare** et se **garde au carré**.

**Préparer.**

- Dans la fenêtre du carré (§131), sous le plan, on trouve la ligne **Engrais** : le sac de toile, les doses du carré en pastilles (pleines et vides) et le bouton **Préparer**.
- Une dose coûte **2 os et 3 fibre**, pris au sac, puis au coffre si l'on est au campement.
- Le bouton est grisé quand le carré est plein ou qu'il manque de quoi faire une dose.

**Le stock de chaque carré**, selon sa taille :

| Carré | Emplacements | Doses gardées |
|---|---|---|
| carré de culture | 4 | 2 |
| carré clos | 8 | 4 |
| grand carré | 12 | 6 |

**Engraisser** un emplacement prend une dose du carré. La pousse va moitié plus vite jusqu'à maturité, comme avant. Le geste est grisé s'il n'y a plus de dose et en dit la raison.

**Sauvegardé** : chaque carré garde ses doses. Reprendre un carré au sac les perd, comme ce qui y pousse.

L'en-tête de la fenêtre montre aussi la fibre en réserve, à côté du seau et des os. La fiche du carré au sac l'explique en une ligne. L'engrais a sa propre icône : un sac de toile noué, avec des éclats d'os et des brins de fibre.

**Dans le code** (`index.html`, bloc LA CULTURE) : `ENGRAIS_RECETTE`, `ENGRAIS_MAX`, `engraisDe`, `peutEngrais`, `preparerEngrais` ; `engraisser` prend une dose. Le stock est sauvegardé dans le champ `e` de chaque carré (relu par `champLu`). L'icône est `DESSINS.engrais`. `ENGRAIS_OS` disparaît.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-99`), `LISEZ-MOI.md`.

## 133. La table d'alchimie en fenêtre, et les gestes du chaudron

La préparation des potions quitte le sac. **ACTION devant la table** ouvre une fenêtre (ACTION, ✕, Échap ou s'éloigner la referment), et chaque recette demande maintenant des gestes : l'eau, le feu, le repos, la cuisson.

**La fenêtre.**

- **À gauche, les potions** : une vignette par caractéristique (une fiole à sa couleur, ses rangs en points), puis celles de chaque compagne (récolte, défense, compétence). Pendant un chaudron en cours, les autres sont grisées.
- **Au milieu, le chaudron**, dessiné en pixels et animé : la hauteur de l'eau, sa couleur qui prend celle des ingrédients, les flammes (une langue par cran), les bulles, la vapeur. Dessous, cinq gestes : **Louche** (de l'eau), **Attiser**, **Étouffer**, **En fiole**, **Vider** (deux appuis s'il y a des ingrédients).
- **À droite, la recette** : l'eau, chaque étape avec son repos et son feu, la cuisson. Une étape faite montre son ingrédient et ce qui n'allait pas (trop chaud, trop froid, trop tôt, trop tard). En dessous, **ce qu'on peut verser** : un appui verse. Un point rouge marque un ingrédient qui irait plus loin dans la recette (faute d'ordre). Enfin, la chance, et ce qu'elle doit à chaque chose.
- **Fermée, le chaudron se couvre** : le feu ne bouge plus et le temps ne court plus, jusqu'à ce qu'on revienne. Le chaudron est sauvegardé tel quel.
- **Au clavier** : ↑ attise, ↓ étouffe, Entrée met en fiole, Échap ferme. Le geste part à l'appui, comme au carré.
- **Sur téléphone**, les potions passent en deux lignes de quatre, et ce qu'on peut verser remonte juste sous le chaudron.

**Les gestes.** Chaque recette (une potion à un rang) a les siens, tirés d'une graine propre à la recette. Ils sont les mêmes pour tous et d'une partie à l'autre : on les découvre, puis on les connaît.

| Geste | Ce que demande la recette | Manqué |
|---|---|---|
| l'eau | 2 à 5 louches, avant le premier ingrédient (le chaudron en tient 6) | −6 par louche d'écart |
| le feu | un cran par étape, de 1 (braises) à 5 (feu ardent) ; il monte et descend d'un cran en 2,5 s | −8 par étape versée au mauvais cran |
| le repos | 4 à 10 s entre deux ingrédients | trop tôt −6, trop tard −4 |
| la cuisson | 10 à 20 s après le dernier ingrédient, puis En fiole | −10 |
| l'ordre | inchangé | −15 par faute |

On peut verser un peu avant le terme (1,5 s) ou un peu après (3 s). La cuisson a 2 s avant et 4 s après. **Quand la surface scintille**, c'est le moment juste.

**La potion parfaite** : rien de manqué, ni geste ni ordre. Elle gagne **+15 points** de chance et sort **d'or** (éclat doré, message « potion parfaite, d'or »). Le carnet la marque d'une étoile.

**Ce que la table en dit, selon son niveau.**

- **Niveau 1, à l'œil** : la recette reste vague (« un peu d'eau », « feu bas », « repos court », « cuire longtemps »). On lit le chaudron : la hauteur de l'eau, le nombre de flammes, les bulles, le scintillement.
- **Niveau 2, le thermomètre et la louche graduée** : la recette en clair (« 4 louches », « feu vif », « repos 7 s », « 13 s »). Le thermomètre montre le feu tel qu'il est et le réglage, la paroi est graduée.
- **Niveau 3, le sablier** : le repos et la cuisson se voient sur un cadran, avec leur fenêtre juste en vert, et les marges s'élargissent (2,5 s avant, 5 s après ; la cuisson 3,5 s et 7 s). La fenêtre dit aussi si la potion est à point. Avant ce niveau, la chance affichée suppose une cuisson juste.

**Le carnet de l'alchimiste.** Chaque geste fait juste se note pour sa recette, et s'affiche ensuite en clair même à la table 1 (marqué ✎). Le carnet garde aussi, par recette, les essais, les réussites, la meilleure chance et la potion parfaite. Il se lit au sac.

**Le sac.** Le volet Alchimie du Campement ne prépare plus rien. Il garde la fiche en lecture seule (vos caractéristiques, vos compagnes) et ajoute le carnet. Il signale un chaudron qui attend. *(Depuis le §140, ce volet n'existe plus : la fiche et le carnet sont dans la fenêtre de la table.)*

**Le journal de jeu** (§126) note aussi, pour chaque essai : les points perdus aux gestes, les fautes d'ordre, l'eau, la cuisson et la potion parfaite. La chance y était mal notée (un nombre illisible) : c'est corrigé.

**Une partie d'avant** : un chaudron commencé garde ses ingrédients, et ses gestes lui sont comptés justes.

**Dans le code** (`index.html`, bloc de l'alchimie) :

- les gestes : `FEU_NOM`, `ALCH_PEN`, `ALCH_PARFAITE`, `cleRecette`, `gestesAlch`, `margeRepos`, `margeCuisson`, `bilanGestes` ; `chanceAlch(k, juste)` rend aussi `gestes`, `parfaite` et `b` ;
- le chaudron : `chaudronNeuf`, `chaudronPret`, `avancerAlch`, `loucheAlch`, `feuAlch`, `verserAlch`, `tenterAlch`, `viderAlch`. `P.chaudron` vaut maintenant `{ c, e, s, f, eau, fa, fc, t }` ;
- le carnet : `P.carnetAlch`, `carnetDe`, `noterCarnet`, `carnetLu`, `ditGeste`, `INSTR_ALCH` ;
- la fenêtre : `AL`, `ouvrirAlchimie`, `fermerAlchimie`, `basculerAlchimie`, `rendreAlchimie`, `alGeste`, `alBoucle`, `dessinerChaudron`, `alFx`, `alGlint`, `alStyle` ; les icônes `fiole_*` ;
- `pageAlchimie` n'est plus que la fiche et le carnet.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-100`), `LISEZ-MOI.md`.

## 134. La Tisseuse de fer ne s'écrase plus au sol

Son corps était bien calculé à 2,75 au-dessus de ses pieds (§ de la Tisseuse), mais **dessiné au ras du sol** : en le faisant tourner pour le tangage et le roulis, le dessin retranchait sa hauteur au lieu de la garder. Éveillée, elle se dresse maintenant pour de bon sur ses huit pattes, le ventre haut ; endormie, elle reste couchée, pattes repliées ; terrassée, elle s'affaisse sur le sol.

Deux défauts voisins, corrigés en même temps :

- **son sol** était la case sous son centre. Posée au-dessus d'un trou, elle le prenait pour le sol : son ombre tombait au fond, et en première personne elle pouvait disparaître de la vue. Son sol est maintenant celui de ses pieds (la hauteur médiane des huit), et c'est là qu'elle s'affaisse à sa mort ;
- **son orientation de départ** (dos à l'arche qu'elle garde) était restée par erreur dans un commentaire. Elle est rétablie.

**Dans le code** : `osTisseuse` (la fonction `tb`), `marcheTiss` (`b.z`), `mortTisseuse` (`sol0`), `poserTisseuse` (`b.dir`).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-101`), `LISEZ-MOI.md`.

## 135. La Tisseuse un peu plus basse

Dressée à 2,75 au-dessus de ses pieds (§134), elle était trop haute : ses pattes descendaient presque droit du corps au sol. Son corps est maintenant à **1,6** au-dessus de ses pieds (`TISSEUSE.haut`). Les genoux montent au-dessus du corps, puis les pattes redescendent jusqu'au sol, comme une araignée. Le ventre reste à hauteur d'homme : on l'atteint toujours en passant sous elle.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-102`), `LISEZ-MOI.md`.

## 136. La couvée de la Tisseuse : les araignons

La Tisseuse a une cinquième arme. **Elle s'arrête et s'accroupit**, une trappe s'ouvre sous son abdomen (deux volets, une lueur orange dedans) et elle **lâche des araignons** un à un : deux (trois en rage). La barre de vie en haut dit « elle lâche ses araignons ».

**L'araignon** est un petit robot araignée : un dôme de fonte cerclé de cuivre, deux yeux rouges, un voyant qui clignote sur le dos, huit pattes qui montent au genou puis redescendent.

- **Il tombe de la trappe**, se pose, et court sur **le plus proche** : vous, un autre joueur de l'île, ou une de vos compagnes. Il ne voit pas qui est à l'abri ni qui est invisible.
- **Il court à 5 cases/s**, en zigzag : plus vite que la marche (4,2), moins vite que la course (5,8). Il grimpe deux cubes d'un bond, contourne l'eau profonde et ne descend pas dans un trou de plus de trois cubes.
- **Arrivé à 1,5 case**, il s'arrête et **bipe** : il rougit, son voyant s'affole. **0,65 s plus tard, il explose** (2,1 cases autour) : un coup modéré et un recul pour les joueurs, un coup plus fort pour les compagnes et les bêtes prises dans le souffle. La Tisseuse et les autres araignons n'en souffrent pas.
- **Un seul coup le brise**, avec n'importe quelle arme (le gourdin suffit), à n'importe quel niveau d'île. Brisé, il s'éteint dans quelques étincelles **sans exploser**, et rend parfois une ferraille.
- **Au bout de 14 s** sans avoir rejoint personne, il s'arme où il est.
- **La Tisseuse tombée**, ses araignons s'éteignent.
- **Un araignon ne se lie pas.**

**Le rythme** : la première couvée vient 7 s après le réveil, puis toutes les 15 s (11 en rage), et jamais plus de 4 araignons à la fois (6 en rage). Sous la trappe, s'il y a un trou, l'araignon tombe à côté, sur le sol de ses pieds.

**À plusieurs** : les araignons sont des bêtes de l'île. Chez le gardien de la faune (§58), ils naissent, courent et frappent pour tous. Les autres les voient trotter, biper et exploser, et chacun peut les briser. Limite : ils ne visent que les compagnes du gardien, pas celles des joueurs qui le suivent (ces compagnes vivent chez leur maître).

**Dans le code** (`index.html`, section LA TISSEUSE DE FER) : `ARAIGNON` (les réglages), `lacherAraignon`, `cibleAraignon`, `pasAraignon`, `majAraignon`, `armerAraignon`, `boumAraignon`, `fxBoumAraignon`, `eteindreAraignon`, `osAraignon` ; l'espèce `araignon` (jamais posée sur l'île : `cap` 0) ; l'action `couvee` de `majTisseuse` et la trappe dans `osTisseuse`. Dans `faune.js` : la sorte `arai` et sa marionnette, la Tisseuse accroupie chez les suiveurs.

**À déposer** : `index.html`, `faune.js`, `sw.js` (qui passe en `stone-valley-103`), `LISEZ-MOI.md`.

## 137. Les Trottins : une famille de bipèdes, joueurs, cueilleurs et soigneurs

Une cinquième famille de créatures, à côté des Rampants, des Coursiers, des Telluriens et des Doux. Les Trottins sont de petits bipèdes curieux, sans sol à eux : on les trouve sur toutes les îles, quel que soit le biome (sauf l'eau et les terres de l'effroi), en petites bandes.

**Les cinq lignées**, une même race, des physiques très différents (noms et allure revus au §138) :

| Lignée | Physique | Allure | Saut | Point fort | Friandise |
|---|---|---|---|---|---|
| **Trottin furet** | petit, vif, voûté, longs bras, oreilles immenses | trotte vite | 2 cubes | cueille vite | les baies et les fruits communs |
| **Trottin haute-tige** | grande, élancée, longues jambes, bois hauts et fins | grandes enjambées | 3 cubes | les fruits les plus hauts (Fruits et douceurs 5) | les fruits rares |
| **Trottin racine** | trapue, large d'épaules, l'écorce aux épaules, gros bois | lente | 2 cubes | robuste (défense 4), le plus de bois | les douceurs |
| **Trottin bondelaine** | pattes de bouc (poil, sabots, genou en arrière), cornes recourbées, courte queue | la plus rapide | 3 cubes | tout terrain | les fruits |
| **Trottin augure** (la rare, dès l'exploration 8) | coiffe et cape de plumes, bâton à pierre qui luit | sautille | 2 cubes, **plane** en tombant | les produits rares (Fruits et douceurs 5) | les douceurs rares |

**Où.** Ils sont tirés à part, comme le félin : deux îles sur trois dès la première exploration, une ou deux sortes par île. Une bande garde la même taille à tout niveau. Ils ont leurs robes rares, comme les autres bêtes.

**Le corps.**
- **La marche** : jambes alternées, genou résolu (devant ; derrière pour le bondeur et le huppé), bras qui balancent, tête qui dodeline, clignements.
- **La course** : penché en avant, grande foulée, un rebond à chaque pas, les oreilles et la crinière qui partent en arrière.
- **Le saut** : ils franchissent deux ou trois cubes d'un bond, jambes repliées et bras levés en l'air.
- **Cueillir** : penché, les bras tendus vers la plante.
- **Dormir** : assis, tête basse, yeux fermés.
- **Mort** : il roule sur le flanc.

**Le jeu.** Deux Trottins libres, tout près l'un de l'autre, se mettent à jouer de temps en temps :
- **la poursuite** : le « chat » court après l'autre, qui file en rond et bondit de côté quand il le serre. Touché, petit saut, et c'est à l'autre de courir (il compte jusqu'à trois) ;
- **la chamaille** : ils se tournent autour, se bousculent, sautillent ;
- entre deux, de petits sauts de joie. Ils babillent (un « pi-pou », plus grave chez la racine, plus aigu chez le furet et l'augure).

Sauvages, ils jouent entre eux. Liés, ils jouent ensemble autour de vous quand vous ne bougez pas.

**Ils se battent.** Frappé, un Trottin **rend les coups**, et **toute la bande** à moins de douze cases s'en mêle. Acculé par une bête, il se défend. Lié, il se bat pour vous comme toute compagne en défense.

**Les apprivoiser.** **G** leur tend **un fruit ou une douceur** du garde-manger (les baies comptent comme un fruit) ; ils ne prennent rien d'autre. Leur friandise préférée passe d'abord, et elle **compte double**. Le message dit si c'est sa friandise, sinon ce qu'il préfère. Environ six offrandes (trois avec la friandise), neuf pour le huppé ; il faut un lien libre. L'Appel les lie aussi.

**En compagne.**
- Elle vous suit **partout** : elle saute les marches de deux ou trois cubes au lieu de rester au pied.
- **Nouvelle spécialité de récolte, « Fruits et douceurs »** (le métier par défaut des Trottins) : elle ne vise que les plantes dont le produit est un fruit ou une douceur. Elle rapporte la ressource de la plante et, **presque à chaque fois**, son produit (95 % pour un produit commun, 35 % pour un légendaire, multipliés par sa note), quand une autre compagne ne le rapporte que rarement.
- **La compétence de la famille : Soins.** Quand votre vie passe sous un seuil, elle **accourt** (jusqu'à 22 cases), s'agenouille à vos côtés et vous **pose un bandage de votre réserve** (+35 % de vie). Une seule à la fois. Sans bandage, elle le dit (une fois par minute). Elle s'améliore par la potion d'éveil, à la table d'alchimie (fruit, douceur, fleur) :

| Rang | Seuil de vie | Délai | En plus |
|---|---|---|---|
| sans potion | 30 % | 40 s | — |
| 1 | 40 % | 30 s | — |
| 2 | 50 % | 22 s | +10 % ; un cataplasme s'il n'y a plus de bandage |
| 3 | 55 % | 15 s | +20 % |

**À plusieurs** : les Trottins sont des bêtes de l'île, partagées comme les autres (§58) ; leurs jeux se voient chez tous. Les îles changent pour tout le monde (deux sur trois ont maintenant des Trottins) : il faut que chacun ait la même version.

**Dans le code** (`index.html`) :
- l'espèce : `TROTTINS` (cinq entrées de `SPEC`), `trottin(sp)`, la famille dans `familleBete`, `NOM_TYPE`, `ORNEMENTS_DE`, `MAT_FAM` ;
- la section LES TROTTINS (avant `majBete`) : `TROTTIN_FAVORI`, `TROTTIN_SOIN`, `trottinsGraine`, `nourrirTrottin`, `soinTrottin`, `instinctTrottin`, `jeuTrottin`, `libreJeu`, `finJeu`, `pasTrottin`, `TROTTIN_FORME`, `osTrottin`, `dessinTrottin`, `friandisePlante` ;
- les branchements : `majBete` (l'instinct), `updateFoeLegs` (le pas), `osDeBase` (le corps), `bonBiome`, `capEsp`, `bestiaireGraine`, G (`nourrirTrottin`), `blesseParJoueur` (la bande) ;
- la récolte : `APT_RES` gagne `friandises` (`FRIANDISE_APT`, `noteApt`), `chercherTacheTr` et `majRecolte` ;
- la compétence `COMPETENCES.trottin`, le combat `COMBAT.trottin`, le son `babil` ;
- `faune.js` : la bande s'en mêle aussi quand un joueur d'en face frappe (`colereDistante`).

**À déposer** : `index.html`, `faune.js`, `sw.js` (qui passe en `stone-valley-104`), `LISEZ-MOI.md`.

## 138. Les Trottins : un petit peuple sylvestre

L'allure du §137 faisait trop dessin animé. Les Trottins sont maintenant **une même race fantasy, aux physiques différents**, et leurs lignées ont des noms à elles.

**Ce qu'ils ont tous** : la peau grise et verte **comme l'écorce** (la matière de leur corps est l'écorce), de **longues oreilles pointues** couchées vers l'arrière, des **yeux d'ambre qui luisent** sous une arcade lourde, un nez en arête, une **crinière tressée** qui finit par une perle d'os, un **pagne de cuir** à ceinture, un **collier** de trois perles d'os et une plume, de **petits bois de cerf**. La tête est petite, le dos plus ou moins voûté, les bras ont un coude et des mains sombres.

**Les cinq lignées** :

| Lignée | Avant (§137) | Ce qui la distingue |
|---|---|---|
| **Furet** | menu | petit, vif, très voûté, de longs bras, des oreilles immenses, deux pointes de bois |
| **Haute-Tige** | échasse | grande, élancée, longues jambes, cou long, bois hauts et fins, crinière pâle |
| **Racine** | pataud | trapue, épaules larges couvertes d'écorce, membres épais, gros bois, peau plus sombre |
| **Bondelaine** | bondeur | pattes de bouc (poil sombre, sabots, genou en arrière), cornes recourbées au lieu des bois, courte queue |
| **Augure** (la rare) | huppé | coiffe de plumes rouges et dorées, cape de plumes dans le dos (elle l'ouvre en planant), un bâton dont la pierre luit |

Rien ne change au jeu (mouvements, jeux, combat, apprivoisement, récolte, soins), ni aux icônes de compagnes qui suivent la nouvelle silhouette. Les identifiants restent ceux du §137 (`trottin_menu`…, corps `menu`…), pour que les compagnes déjà liées se retrouvent.

**Dans le code** (`index.html`, section LES TROTTINS) : `TROTTINS` (noms, couleurs : `crin`, `plume`, `plume2`, `pierre`, yeux d'ambre), `TROTTIN_FORME` (refait), `osTrottin` et `dessinTrottin` (refaits), `TROTTIN_CUIR`, `TROTTIN_OS`, `TROTTIN_BOIS`, `TROTTIN_CORNE`, `TROTTIN_SABOT` ; `MAT_FAM.trottin` passe à `ecorce`.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-105`), `LISEZ-MOI.md`.

## 139. Journal de jeu : le contexte de l'appareil, les récoltes des carrés

L'analyse du journal (§126) a montré deux trous.

**Le contexte perdu.** Sur la plupart des événements `session` et `arrivee`, le contexte de l'appareil (navigateur, écran, images par seconde, carte graphique) était remplacé par `ReferenceError: Cannot access 'Panne' before initialization`. Quand la sauvegarde est lue sur l'appareil (à chaque changement d'île, la page se recharge), le journal démarre pendant le chargement, avant la fin du script. Or `Panne`, le compteur des incidents que `contexteJeu` lit en dernier, n'était déclaré que tout en bas. Il l'est maintenant **tout en haut du script** : le contexte part complet à chaque session et à chaque arrivée. Rien ne changeait au jeu lui-même.

**Les récoltes des carrés.** Seuls les semis et la cueillette étaient notés. Le journal note maintenant aussi, depuis la fenêtre du carré (§131) :

| `culture`, `q` | Quand | Champs |
|---|---|---|
| `recolte` | Récolter un emplacement mûr | `g` la graine, `res` la ressource, `n` ce qui est arrivé au sac et au coffre, `m` la maturité |
| `arrache` | Arracher | `g`, `m` |

**Dans le code** : `const Panne` en tête du script principal ; dans `jnlBrancher`, les branchements `recolterPlace` et `arracherPlace`.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-106`), `LISEZ-MOI.md`.

## 140. Le sac : plus de volet Alchimie, et un défilement qui tient

**Le volet Alchimie disparaît du sac.** Le Campement n'a plus que ses volets Camp, Cuisine, Magie, Portail et Journal. Ce qu'il montrait passe dans la fenêtre de la table d'alchimie (§133) :

- **la fiche** : chaque vignette de potion porte maintenant la **valeur d'aujourd'hui** sous son nom (Vie 120, Vitesse 104 %…), et celles des compagnes leur récolte, leur défense, le rang de leur compétence ;
- **le carnet de l'alchimiste** : un bouton **Le carnet** dans l'en-tête de la fenêtre remplace la recette par la liste des recettes essayées (essais, réussites, meilleure chance, potion parfaite, gestes notés). **La recette** y revient, et choisir une potion aussi.

La carte « Vos caractéristiques, le carnet » de la case Table d'alchimie disparaît avec le volet ; la case elle-même (créer, améliorer la table) reste.

**Le défilement du sac.** Il revenait souvent en haut, ou se figeait sous le doigt. Deux causes :

- **le focus** : après un appui, le bouton touché gardait le focus, et chaque mise à jour du sac (une récolte d'une compagne, la vie qui bouge…) le refaisait puis lui rendait le focus, ce qui **faisait défiler la liste jusqu'à lui**. Le focus se rend maintenant sans faire défiler, et seulement s'il a été perdu ;
- **la réécriture complète** : le sac était reconstruit en entier à chaque mise à jour. Le défilement était remis à sa place, mais l'élan du doigt cassé. Désormais, sur la même page, le sac **n'est plus reconstruit** : l'ancien et le nouveau se comparent nœud à nœud, et seul ce qui a changé est modifié. Les listes, l'élan du doigt et le bouton touché restent tels quels. Une page identique n'est pas touchée du tout.

Changer d'onglet ou de volet réécrit la page comme avant, et **chaque page retrouve son défilement** (il était perdu dès qu'on passait par un autre onglet).

**Dans le code** : `majSac` (`SAC_VU` : la dernière page dessinée, sa clé, les défilements de chaque page), `morphSac` et `morphNoeud` ; `VOLETS_CAMP` sans `alchimie`, `ongletDe('alchimie')` mène au volet Camp ; `pageAlchimie` disparaît, remplacée par `nomCarnet`, `notesCarnet` et la vue `AL.vue = 'carnet'` de `rendreAlchimie`.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-107`), `LISEZ-MOI.md`.

## 141. Le bilan de la fiole

Mettre en fiole ouvre maintenant **une petite fenêtre de bilan** par-dessus la table d'alchimie :

- **le verdict**, en couleur : **★ Potion parfaite** (cadre et fiole d'or, qui luit), **Potion réussie** (vert), **La potion a tourné** (la fiole noircie, penchée) ;
- **le sort contre la chance** : une jauge dont la part verte est la chance de réussite ; un trait y glisse jusqu'au nombre tiré. Sous la part verte, la potion prend ; au-delà, elle tourne. (« chance 62 % · le sort est tombé sur 37, sous la chance ») ;
- **les gestes**, une pastille chacun, verte si juste, orange sinon : l'eau, chaque ingrédient versé (son icône, puis ✓ ou « trop chaud », « trop froid », « trop tôt », « trop tard »), la cuisson (à point, pas assez cuite, trop cuite), et les ingrédients versés hors de leur tour. Dessous, le détail de la chance (base, table, rareté, ordre, gestes, parfaite) ;
- **ce que la potion a fait** : « Bue · Vie 110 → 120 », « Donnée à … », « … apprend … » ; ou, ratée, « Tout est perdu : ce qui était versé, et 12 éclats ». Puis les rangs en pastilles, la nouvelle qui s'allume.

**Continuer** la ferme, comme Entrée, Espace, Échap ou un appui à côté. Entrée ne relance pas la fiole. Pendant le bilan, la table derrière ne reçoit rien. S'éloigner de la table ferme les deux.

**Dans le code** : `bilanFiole` (appelée par `tenterAlch` avant que le chaudron ne se vide), `montrerBilan`, `fermerBilan`, `bilanOuvert` ; `detChance`, le détail de la chance, est partagé avec la fenêtre. Le style est dans `alStyle` (`#al-bilan`, `.ab-*`).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-108`), `LISEZ-MOI.md`.

## 142. L'éclat d'encre, une potion

**Inscrire un sort coûte maintenant un éclat d'encre**, quel qu'il soit (simple, accord, avec accent). Avant, c'était 10, 20 ou 30 éclats. L'éclat d'encre se prépare **à la table d'alchimie**, dès le niveau 1 : une vignette **Encre**, sous « Le grimoire », à gauche de la fenêtre.

**La recette** est fixe, sans rang. Trois ingrédients alternent avec trois versées de 10 éclats :

| Étape | Ce qu'on verse |
|---|---|
| 1 | un champignon (toute rareté) |
| 2 | 10 éclats |
| 3 | une racine (toute rareté) |
| 4 | 10 éclats |
| 5 | une graine (toute rareté) |
| 6 | 10 éclats |

Les éclats se versent comme un ingrédient. Le bouton éclat de la liste « À verser » montre la versée attendue (10), et il est grisé s'il en manque. Ils sont pris au moment de la versée et perdus si la potion tourne ou si l'on vide le chaudron. Ils comptent comme le reste pour l'ordre, le feu et le repos, et l'eau prend la couleur de l'encre à mesure. Rien de plus n'est payé à la mise en fiole.

**Chance de base : 70 %**, plus le bonus de la table. Les gestes de l'encre sont les siens, les mêmes pour tous, et le carnet les note sous « Éclat d'encre ». **Une fiole réussie donne 1 éclat d'encre ; parfaite, elle en donne 2.** Le bilan (§141) le dit : « +2 éclats d'encre · 3 en réserve ».

**Où on le voit** : la vignette Encre (le nombre en réserve), le sac (case **Encre** parmi les réserves, dès qu'on en a), le pupitre (« 1 éclat d'encre pour l'inscrire (n en réserve) »). Sans encre, le pupitre le dit et le bouton « Inscrire au grimoire » est grisé.

**Les tomes ne changent pas** : on les déchiffre toujours contre des éclats (10, 25, 45 ; chez l'érudit, une fois et demie). Seuls les mots changent : « Il faut 10 éclats pour le déchiffrer », sans « d'encre », pour ne pas confondre avec l'éclat d'encre. Les répliques des nomades ont été ajustées de même.

**Dans le code** : `ENCRE_ALCH`. La potion `'encre'` de `potionDe` porte `motif`, `base`, `niv`, `cout`. `recetteAlch` lit l'étape `E` comme une versée d'éclats (`{ fam: 'eclat', n }`). `coutAlch`, `etapeVa`, `ditEtape`, `icIngr`, `icFiole`, `nomPotion` et `nomCarnet` connaissent l'éclat. `verserAlch('eclat')` paie la versée. `tenterAlch` ajoute à `P.encre` (sauvegardé, plafonné à 10 000). `DESSINS.encre`, `AL_TEINTE.eclat`, `AL_FIOLE.encre`. Côté grimoire, `inscrireSort` retire un éclat d'encre, et `ENCRE`, `ENCRE_MELANGE`, `ENCRE_ACCENT` et `encreDe` disparaissent. `nomades.js` : trois répliques.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-109`), `nomades.js`, `LISEZ-MOI.md`.

## 143. La magie en fenêtre : le pupitre, et l'onglet Grimoire

**Le volet Magie quitte le sac.** Le Campement garde Camp, Cuisine, Portail et Journal. La magie se partage désormais entre deux endroits.

### Au campement : la fenêtre du pupitre

**ACTION devant la bibliothèque** (« MAGIE · le pupitre ») ouvre la fenêtre ; ACTION à nouveau, Échap, ✕ ou s'éloigner la ferment. Comme la table d'alchimie, le geste part à l'appui, et la fenêtre ne réécrit que ce qui a changé.

**Au centre, la scène**, en pixels agrandis (128 × 88) :

- un mur de planches, deux rayons de livres ;
- un lutrin, **le grimoire ouvert**, aux pages bombées ;
- **une bougie qui vacille** et éclaire tout d'une lumière chaude qui faiblit au loin ; de la poussière dorée flotte dans sa lueur ;
- **un encrier** dont le niveau suit la réserve d'éclats d'encre ;
- **la pile des tomes rapportés**, à la couleur de leur matière (quatre au plus).

**La plume trace le glyphe** de la phrase composée sur la page de gauche, point par point, à la couleur de la matière (deux couleurs pour un accord). Une matière inconnue ne donne qu'**une esquisse grise**. **La page de droite joue l'aperçu du sort** :

| Forme | Aperçu |
|---|---|
| Trait | une flèche de lumière en arc, avec sa traîne |
| Onde | des anneaux qui s'élargissent |
| Piège | une rune qui pulse, des étincelles qui montent |
| Mur | trois piliers qui montent, tiennent, redescendent |
| Égide | une bulle qui miroite autour d'une silhouette |

L'accent est marqué dans le coin.

**Inscrire** (bouton sous le lutrin, ou Entrée ; 1 éclat d'encre) : le glyphe s'embrase et ses lettres s'envolent. Puis **la page tourne** et la plume retrace la phrase sur la page neuve. **Déchiffrer un tome** : ses lettres partent de la pile et tourbillonnent jusqu'à la page, qui s'illumine à sa couleur.

**À gauche** :

- **les matières**, avec leur pastille et leurs tomes (●●○) ; une matière inconnue est grisée mais reste choisissable, pour lire où trouver son Tome I ;
- **« + mêler »** (bibliothèque 2) : la tuile touchée ensuite devient la seconde matière, en pointillés ; « ✕ » la retire ;
- **les formes**, leur vignette à la couleur de la phrase ;
- **l'accent** (bibliothèque 3) : Sans, Aigu, Grave, Circonflexe.

**Sous le lutrin** : le nom de la phrase, son rôle, ses éclats par lancer, son délai, ce qui empêche de l'écrire, et le bouton **Inscrire au grimoire** avec la réserve d'encre.

**À droite** :

- **les tomes rapportés**, chacun avec son bouton **Déchiffrer** ;
- ce que fait la phrase : l'accord simple, remarquable ou jamais essayé, la stabilité, où trouver une matière inconnue ;
- **le grimoire**, une carte par sort : Tenir (L), les cases, Nommer (la saisie n'est pas effacée par le rafraîchissement), Effacer (deux appuis). **Toucher la vignette d'un sort le relit au pupitre** : sa phrase revient sur la page.

Deux boutons dans l'en-tête : **Codex** (les accords, essayés ou non, et les accents) et **Tomes** (chaque matière, ses tomes, où trouver le suivant ; les formes).

Sur téléphone, la scène vient en premier, puis les tuiles (quatre par ligne), puis le grimoire.

### Partout : l'onglet Grimoire du sac

Un **onglet Grimoire** rejoint le sac, après Campement (touche **5** ; Amis, Sauvegarde, Réglages et Bêta passent à 6, 7, 8 et 9). C'est **l'usage** des phrases inscrites, où qu'on soit : les tenir en main, les ranger dans les cases, les nommer. Il rappelle les tomes rapportés à déchiffrer. Au campement, près de la bibliothèque, un bouton **Ouvrir le pupitre** mène à la fenêtre. Écrire, effacer et déchiffrer ne se font qu'au pupitre.

**Dans le code** :

- `pageGrimoire` (l'onglet) ;
- `PU`, `puStyle`, `ouvrirPupitre`, `fermerPupitre`, `basculerPupitre`, `majPupitreUI`, `puGeste`, `puRendre`, `codexPu`, `tomesPu`, `glyphePu` (le glyphe tiré de `dessinSort`, dans l'ordre de la plume), `puInscrit`, `puDechiffre`, `puBoucle`, `dessinerPupitre` ;
- `pageBiblio`, `blocTomesPortes` et `blocCodex` disparaissent, avec les gestes `data-pup*`, `data-inscrire` et `data-dechiffre` du sac ;
- `ongletDe('biblio')` mène à l'onglet Grimoire ; `campAction` ouvre la fenêtre ;
- l'état du pupitre (`pupitre`) est partagé entre la fenêtre et l'onglet.

**Ce que j'ai décidé seul** : Effacer reste au pupitre (c'est écrire dans le grimoire) ; l'onglet n'a que l'usage. L'onglet vient après Campement.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-110`), `LISEZ-MOI.md`.

## 144. La cuisine en fenêtre : le feu, la marmite, et des recettes à découvrir

**Le volet Cuisine quitte le sac.** Le Campement garde Camp, Portail et Journal. Le garde-manger et les plats (manger, ranger dans une case) restaient déjà dans l'onglet Sac.

### La fenêtre

**ACTION à la cuisine du campement**, ou **devant la marmite portable**, l'ouvre. ACTION à nouveau, Échap, ✕ ou s'éloigner la ferment. Fermée, la marmite est couverte : rien n'y avance, ni le feu ni la cuisson.

**La scène**, en pixels agrandis (128 × 88) :

- **au campement**, un âtre de pierres, sa hotte noircie, la marmite pendue à la chaîne de la crémaillère ;
- **dehors** (la marmite portable), un ciel du soir, quelques étoiles, l'herbe, un trépied de bois ;
- les bûches, les braises, **une langue de flamme par cran de feu**, une lumière chaude qui faiblit au loin ;
- la panse de fonte, chauffée par en dessous ; l'eau qui monte à chaque louche ; le bouillon qui prend la couleur des ingrédients ;
- **des morceaux de chaque ingrédient** qui tournent, vite quand on remue ; **la louche** posée au bord, qui tourne dans la marmite quand on remue ;
- les bulles à l'eau, le grésillement à sec, la vapeur ;
- **la fumée noire quand ça brûle**, des lueurs rouges au fond ;
- **des volutes dorées quand c'est cuit à point** (jamais pour une mixture).

**À gauche, le garde-manger**, en tuiles par famille avec leur nombre : un appui met l'ingrédient dans la marmite (2, 3 ou 4 places selon le feu, comme avant). **« Une poignée au hasard »** la remplit avec ce qui tombe sous la main.

**Au centre, les gestes** : Louche (d'eau, six au plus), Attiser, Étouffer (cinq crans ; le feu suit le réglage avec un temps de retard), **Remuer** (un appui, un tour de louche), **Servir**, Vider (deux appuis s'il y a des ingrédients). Au clavier : ↑ ↓ le feu, Espace remue, Entrée sert, Échap. Au-dessus des gestes : ce qu'on voit, et la jauge **« ça brûle »**.

**À droite, la marmite** : ses places ; ce qu'elle promet (« Un plat inconnu… », le nom d'une recette déjà faite, ou « Ça ne se marie pas » pour un mélange déjà raté) ; **la manière** de ce plat (l'eau, le feu, remuer, la cuisson) telle qu'on la connaît. Le bouton **Le livre** remplace ce panneau par le livre de recettes.

### La manière de chaque plat

Chaque sorte de plat a **sa manière, cachée**, la même pour tout le monde. Elle est tirée d'une graine qui ne dépend que de la sorte, dans les bornes de son genre :

| Genre | Sortes | Eau | Feu | Remuer | Cuisson |
|---|---|---|---|---|---|
| Grillé | grillade, brochette, brochette sucrée, aux fleurs | à sec | vif ou ardent | jamais | 6 à 10 s |
| Sauté | poêlée | à sec ou 1 | moyen ou vif | souvent | 8 à 12 s |
| Au four | rôti, tourte, pain, galette ; Tarte d'ambre, Pain des premiers jours, Panier d'hanami | 1 | doux ou moyen | jamais | 14 à 20 s |
| Mijoté | ragoût, terre et mer ; Festin des Horlogers | 2 ou 3 | doux ou moyen | de temps en temps | 16 à 22 s |
| Bouillon | soupe, soupe des bois ; Soupe de lune, Bouillon de braise | 4 à 6 | moyen ou vif | de temps en temps | 12 à 18 s |
| Infusé | infusion ; Thé du printemps, Sérum | 4 ou 5 | braises ou doux | jamais | 6 à 10 s |
| Sucré | confiture, compote, caramel, sirop ; Gelée-lanterne | 1 ou 2 | braises ou doux | souvent | 14 à 20 s |
| Cru | salade | à sec | **sans feu** | de temps en temps | 3 à 5 s |

- **L'eau** se juge au service, à la louche près. Au feu ardent, elle s'évapore doucement.
- **Le feu** se juge en moyenne, sur toute la cuisson, à moins d'un cran près.
- **La cuisson** compte depuis le dernier ingrédient versé. On peut servir de 2 s avant le terme à 4 s après (3 s et 6 s avec la cuisine de niveau 3). Avant : pas assez cuit ; après : trop cuit.
- **« Ça brûle »** : la jauge monte tant qu'il y a des ingrédients. Elle monte d'autant plus vite que le feu est fort, l'eau rare et le plat de ceux qui attachent (beaucoup pour un plat sucré ou sauté, un peu pour un mijoté, presque pas pour un grillé). Un tour de louche la fait redescendre de près de moitié. Pleine, le fond brûle : fumée noire, et chaque seconde coûte. Une confiture bien menée mais jamais remuée finit par brûler.
- **Remuer** un plat qui ne se remue pas (grillé, au four, infusé), plus d'une fois : il se défait.

**Ce qu'on en lit** : la marmite portable et la cuisine de niveau 1, à l'œil (« un peu d'eau », « feu doux »). Au niveau 2, le thermomètre et la louche graduée : l'eau et le feu en clair. Au niveau 3, le sablier : le temps de cuisson, et plus de marge. La manière d'une sorte, elle, ne se lit pas : **elle se découvre**.

### La réussite fait la puissance

Au service, une note sur 100 : l'eau (−7 par louche d'écart), le feu (−10, ou −20 au-delà de près de deux crans), la cuisson (−18 pas assez cuit, −12 trop cuit), ce qui a brûlé (−10, plus 3 par seconde, 25 au plus), ce qui s'est défait (−12).

| Palier | Note | Vie | Effet |
|---|---|---|---|
| Raté | moins de 35 | la moitié | aucun |
| Correct | 35 à 69 | ×0,8 | durée ×0,7 |
| Réussi | 70 à 99 | telle quelle | tel quel |
| **★ Parfait** | 100 | ×1,3 | durée ×1,5 et **un niveau de plus** (IV au plus) |

Les étoiles viennent toujours des ingrédients. Le nom porte le palier quand il compte (« Ragoût de cerf · parfait », « … · raté »). **Le bilan** s'ouvre au service, comme pour la fiole (§141) : le palier, la jauge de réussite, une pastille par geste (l'eau, le feu, la cuisson, le remuage ou le brûlé), ce que fait le plat, ses parts.

### La découverte

- **Au début, on ne sait rien** : on mélange, au hasard s'il le faut.
- **Certains mélanges ne se marient pas** et donnent **une mixture** (+5 % de vie, rien d'autre) : tout ce qui n'entre dans aucune sorte (l'ancien « plat du voyageur »), et quatre mariages qui ne se font pas, **poisson et douceur, poisson et fleur, champignon et fruit, champignon et douceur**, sauf dans un plat remarquable. Le livre les retient (« Ne se marient pas »), et la marmite prévient quand on y remet le même mélange.
- **Un mélange qui se marie** entre au livre, avec ses ingrédients et son meilleur palier. **Les gestes justes s'y notent** au fil des essais, pour toute la sorte : une fois noté, un geste se lit en clair (✎). Une sorte déjà cuisinée se devine à l'œil (« beaucoup d'eau », « feu doux », « longtemps ») ; jamais cuisinée, sa manière n'est que « ? ».
- **Le livre** : chaque recette avec ses étoiles, son meilleur palier, sa manière connue, ses ingrédients (ce qu'on en a), **Refaire** (ses ingrédients dans la marmite vide) et **Épingler** (trois au plus, comme avant). Puis les mariages ratés, puis les plats remarquables encore à trouver, avec leurs indices.
- Les recettes déjà au livre restent connues, avec leurs ingrédients. Leurs gestes sont à découvrir. Les recettes « plat du voyageur » en sortent.

**Dans le code** :

- `GENRES_CUISINE`, `GENRE_SORTE`, `maniereDe`, `MARIAGES_RATES`, `mixtureDe` ;
- `P.pot` (la marmite : ingrédients, eau, feu, temps, feu moyen, « ça brûle », tours de louche ; sauvegardée) ;
- `avancerCuisine`, `bilanCuisine`, `appliquerPalier`, `ajouterMarmite`, `poigneeHasard`, `viderMarmite`, `refaire`, `cuire` (servir ; rend le plat) ;
- `P.manieres` (les gestes notés, par sorte), `P.ratees` (les mariages ratés), `cuisineLue` ;
- la fenêtre : `CZ`, `czStyle`, `ouvrirCuisine`, `fermerCuisine`, `basculerCuisine`, `czGeste`, `czRendre`, `ditManiere`, `livreCz`, `bilanPlat`, `czBoucle`, `dessinerMarmite`, `czFx` ;
- `pageCuisine`, `blocServi`, `blocPlats`, `blocRecettes` et la sélection `marmiteSel` disparaissent ;
- le journal (`plat`) note la sorte, la note et le palier.

**Ce que j'ai décidé seul** :

- les genres, leurs bornes et les quatre mariages ratés ;
- la salade se fait sans feu ;
- les seuils des paliers et ce que chacun change ;
- une mixture va au sac comme un plat chaud ;
- le palier dans le nom du plat.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-111`), `LISEZ-MOI.md`.

## 145. Le lien d'éclat se lance : apprivoiser, chaque créature à sa façon

**Le lien se lance.** Sur la bête visée, avec **Y**, ou avec **ACTION « LIER »** :

- ACTION propose « LIER » dès que la chance atteint 50 %, ou quand il n'y a rien d'autre à faire ;
- sous 50 %, ACTION garde ses autres gestes (nourrir, récolter…), et Y lance quand même.

**Le déroulé** :

1. Le lien file en arc, avec une traîne d'or et de rouge.
2. Il enserre la bête de fils de lumière ; elle se fige.
3. Elle **se débat une à trois fois** : chaque secousse est un tirage, et il en faut trois pour qu'elle cède.
4. Elle cède et se lie (le lien la tient, comme avant). **Ou le lien se brise : il est perdu**, et la bête réagit à sa façon (voir le tableau).

Un lien à la fois. Si la bête disparaît pendant le vol, le lien retombe intact.

**La bête visée** : la fiche de la cible (en haut de l'écran) choisit, quand on a un lien libre, la bête qu'on lierait devant soi, à neuf cases au plus. Une ligne dorée y dit **la chance et chaque condition, remplie (✓) ou non (✗)**. Par exemple : « lien 65 % · affaiblie, sous 40 % ✓ · presque à terre (en plus) ✗ ».

**Le prix ne change pas.** Il monte avec les liens qu'on possède : ceux du sac, plus ceux qui tiennent les compagnes. Un lien brisé ne compte plus, donc le suivant coûte un peu moins. Il se fabrique toujours à l'établi du campement. Six compagnes dehors au plus, comme avant ; aucune autre limite que le prix.

**Les offrandes ne lient plus.** Baies, poissons, friandises, viande et offrandes aux horreurs donnent la confiance comme avant. À confiance entière, il faut lancer le lien. Chaque offrande dit maintenant où en est le lien (« confiance 60 % · lien 65 % »).

**Les cas particuliers** :

- **Les automates** : la nuit, en veille, **G glisse l'éclat dans sa poitrine** (plusieurs pour l'élite), comme avant. Mais il faut ensuite **lui lancer un lien** avant qu'il ne s'éveille.
- **Les coursiers** : **le rodéo dompte**. Tenu jusqu'au bout, on descend, il reste là, essoufflé, **dix secondes** : c'est le moment du lien. Monter sans lien libre est refusé (« il faut un lien d'éclat pour le lier, une fois dompté »).
- **L'Appel** (grimoire) **ne lie plus** : il calme la bête (sans échec, au moins une fois sur trois), et le lien prend **+15 % pendant dix secondes**.

### Créature par créature

| Créature | Sa façon | Hors condition → dans la condition | À l'échec |
|---|---|---|---|
| Brouteur | la confiance (baies) | 20 % → 95 % | fuit |
| Glaneur | par surprise : ne vous a pas vu, sans courir | 15 % → 70 % | fuit |
| Bossu | affaibli, sous 40 % (presque à terre : +10) | 5 % → 65 % (75 %) | attaque |
| Traqueur | repu (une proie, de la viande offerte) ; affaibli : +20 | 5 % → 60 % (80 %) | attaque |
| Spectre | **de nuit**, et affaibli sous un tiers | 0 % de jour ; 10 % → 60 % | fuit |
| Traceur, Moissonneur, Mercenaire, Sentinelle | **en veille**, et l'éclat glissé (G) | 0 % éveillé ; 10 % → 70 % | rejette le lien, furieux, l'éclat perdu |
| Tireur d'élite, Mortier | pareil, avec plusieurs éclats | 0 % ; 10 % → 60 % | pareil |
| Coursiers | **dompté au rodéo**, dix secondes | 0 % → 90 % (aurore 70 %) | fuit |
| Crapaud-buffle | repu (un poisson offert) | 15 % → 75 % | fuit |
| Varan d'ocre | à l'aube, engourdi | 5 % → 65 % | attaque |
| Vesseron | la confiance | 20 % → 90 % | fuit |
| Cerf de verre | la confiance | 10 % → 90 % | fuit, **et oublie toute sa confiance** |
| Cerf des cerisiers | la confiance | 15 % → 90 % | fuit |
| Salamandre de braise | endormie | 5 % → 70 % | attaque |
| Lentigrade, Lentigrade-cerisier | la confiance | 30 % → 100 % | rien : il retourne à ses affaires |
| Cotonnier | aucune arme en main, et la confiance | 10 % → 80 % | fuit |
| Carillonneur | endormi | 10 % → 70 % | fuit |
| Oglodon | la confiance de sa colonie (rien sous la moitié) | 0 % → 80 % | attaque |
| Félin de brume | **sorti de sa brume**, et affaibli sous 30 % | 0 % caché ; 5 % → 60 % | fuit |
| Bramard | en rut | 5 % → 70 % | attaque |
| Sterne des nues | la confiance (poissons) ; ou endormie : 60 % | 10 % → 90 % | fuit |
| Dragon à plumes | **posé**, et affaibli sous un tiers ; la confiance (viande) jusqu'à +35 | 0 % en vol ; 5 % → 50 % (85 %) | attaque |
| Renard des pétales | de nuit, et la confiance | 10 % → 85 % | fuit |
| Silencieux | **vous, immobile** ; la confiance (offrandes) jusqu'à +30 | 0 % ; 50 % → 80 % | attaque |
| Mille-gueules | **sorti de terre**, et la confiance (offrandes) | 0 % dessous ; 10 % → 80 % | fuit |
| Trottins | en plein jeu ; la confiance (friandises) jusqu'à +30 | 15 % → 60 % (90 %) | toute la bande se sauve |
| Trottin augure | pareil, plus farouche | 10 % → 45 % (70 %) | toute la bande se sauve |

Chaque fuite fait aussi perdre un peu de confiance (−15 points). L'Appel ajoute 15 points à toutes les façons. La chance plafonne à 95 % (100 % pour les lentigrades).

**Ne se lient pas** :

- la Tisseuse et ses araignons ;
- les automates du Centre (tourelle, araignée de maintenance, gardien de salle) ;
- les horreurs du Korlaz (Décharné, Silhouette, Rampant, Main) ;
- les êtres de la brume ;
- les nomades, les villageois, les maisons, les plantes rares, les pièces des énigmes.

Ce sont les créatures sans façon : la fiche n'affiche pas de ligne de lien, et Y dit « … ne se lie pas ».

**Dans le code** :

- `COND_LIEN` (les conditions : ce qu'en dit la fiche, ce qu'elles valent) ;
- `FACONS` (par espèce : `req`, `c`, `b0`, `b1`, `plus`, `conf`, `ou`, `max`, `rate`, `perd`) ;
- `etatLien` (la chance et les conditions) et `lienDit` ;
- `viseLien`, `viseLienCone` (la fiche de la cible les suit, avec un lien libre) ;
- `lancerLien`, `majLiens` (appelée par `majSorts` : le vol, la prise, les secousses ; `__LIEN_DE` fixe le tirage pour les essais), `rateLien`, `lienApres` ;
- `rallumer` glisse l'éclat (`b.eclatG`), le rodéo pose `b.dompteT`, l'Appel pose `b.appelT` ;
- `lier` n'est plus appelée que par le lien lancé ;
- la touche Y ; la ligne `#cible small.lien`.

**Ce que j'ai décidé seul** :

- la confiance s'ajoute à quelques façons qui avaient déjà leurs offrandes (dragon, Silencieux, trottins) ;
- le Silencieux se lie à 50 % dès qu'on est immobile ;
- les automates gardent leur éclat glissé (G) avant le lien ;
- l'Appel calme au lieu de lier ;
- la fiche montre tout de suite la façon d'une créature (avec le pourcentage et les conditions) : rien à découvrir dans le bestiaire ;
- **la robe rare ne change pas la chance** (proposée dans le plan, pas faite).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-112`), `LISEZ-MOI.md`.

## 146. Le renard ne grimpe plus aux parois

Le Renard des pétales (§112) avait hérité du corps du félin, et avec lui sa faculté de **grimper aux parois** (`grimpe: .5`) : il marchait sur les murs. Un renard ne grimpe pas. Il ne grimpe donc plus ; il **bondit**, comme le cerf des cerisiers, jusqu'à **deux cubes** de haut (`bond: 2`). Une paroi plus haute, il la longe comme les autres marcheurs. Lié, il vous suit par les mêmes chemins.

Testé : trois renards posés au pied d'une paroi de trois cubes ou plus, poussés vers elle pendant trente secondes de jeu : aucun ne s'y accroche, aucun ne monte.

**À déposer** : `index.html` (la fiche `renard`), `sw.js` (qui passe en `stone-valley-113`), `LISEZ-MOI.md`.

## 147. Le félin de brume ne grimpe plus : il saute

Le félin de brume n'est pas un Rampant : il ne grimpe plus aux parois (`grimpe: 0`). À la place, c'est **un sauteur** (`sauteur: 1`) :

- **il bondit sur une marche de deux cubes** (`bond: 2`), comme le renard et le cerf des cerisiers ;
- **il se jette du haut d'une falaise**, jusqu'à **six cubes** en contrebas (`SAUT_FALAISE`). Les autres marcheurs s'arrêtent au bord, le coursier saute trois cubes ;
- **il saute par-dessus les trous** : l'eau, le vide, ou une fosse plus profonde que son bond. Il lui faut une terre où retomber, de deux à quatre cases devant, pas plus haute que son bond ni plus basse de deux cubes, et rien qui monte en travers. Il prend alors son élan et file en arc au-dessus du trou. Une paroi rencontrée en plein bond l'arrête, et il retombe. Sans terre où retomber, il ne s'y risque pas.
- Sa façon de choisir son chemin le sait : un trou qu'il peut franchir ne l'arrête plus, une falaise de six cubes non plus.

Lié, il vous suit par les mêmes bonds.

**Dans le code** : la fiche `felin`, `SAUT_FALAISE`, `enjambe` (la descente du sauteur), `sautPossible` (la terre où retomber), `bondir`, `b.bondL` (le bond en cours : `chute` le porte, `pasBete` le laisse faire), `libre` dans le choix du chemin.

Testé : trois trous (eau ou fosse), trois falaises de quatre cubes, trois parois de trois cubes et plus, avec le félin et le renard poussés droit dessus. Le félin franchit les trous et retombe sur la terre d'en face, descend les falaises, s'arrête aux parois. Le renard s'arrête partout.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-114`), `LISEZ-MOI.md`.

## 148. Le renard et les cerfs sautent aussi

Le **Renard des pétales**, le **Cerf de verre** et le **Cerf des cerisiers** deviennent des sauteurs (`sauteur: 1`), comme le félin de brume (§147). Ils sautent d'une falaise de six cubes au plus, sautent par-dessus les trous (l'eau, le vide, une fosse) quand une terre les attend à deux ou quatre cases, et bondissent sur une marche de deux cubes. Les parois les arrêtent. Liés, ils vous suivent par les mêmes bonds.

Testé : les mêmes trous, falaises et parois qu'au §147. Les trois franchissent les trous, descendent les falaises et s'arrêtent aux parois. Un brouteur, poussé de même sans grimper, s'arrête partout.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-115`), `LISEZ-MOI.md`.

## 149. Le dragon à plumes revu : longiforme, plus petit, couvert de plumes

**La taille.** Il était énorme : six mètres et demi de long au sol, deux mètres et demi de haut. Il fait maintenant **environ 3 m de long, queue comprise, et 1,2 m de haut** à la crête, pour un corps fin (moins de 30 cm d'épaisseur). C'est à peine plus gros qu'un lentigrade (1,7 m de long, 1,15 m de haut), en plus long. L'échelle tient dans `DR_ECH` (0,8).

**La forme.** Fini le torse potelé. Le dragon est **un long corps souple de onze anneaux**, du poitrail au bout de la queue, qui s'amincit après les hanches. Il a quatre pattes courtes (sous les épaules et sous les hanches), un cou de quatre anneaux et une tête fine et longue avec de petites cornes.

**Le dos ondule** :

- **au sol**, une bosse douce entre les épaules et les hanches, et une onde qui court dans la queue, plus vive quand il marche ; la queue se balance de côté ;
- **en vol**, tout le corps nage dans l'air, l'onde allant de la tête à la queue ;
- **endormi**, il se couche à plat, la queue revenue le long du flanc.

**Les plumes** :

- une **crête** dressée vers l'arrière sur chaque anneau, jusque sur la nuque, qui tire vers la couleur des pointes au bout de la queue ;
- sur chaque flanc, **deux rangs de plumes couchées** qui se recouvrent (le rang du haut décalé d'un demi-anneau) et frémissent ;
- un **éventail** de cinq longues plumes au bout de la queue ;
- sur la tête, une **aigrette** de quatre plumes et des **moustaches de plumes** sous les joues ;
- une culotte de plumes en haut de chaque patte ;
- **les ailes** gardent leurs rémiges et leurs secondaires, à la nouvelle taille. Repliées, elles se couchent le long du dos.

Les quatre robes (vert et orange, pourpre et or, bleu et blanc, fauve et brun) ne changent pas.

**Ce qui suit la taille** :

- le feu part de la gueule, où le dessin la place (`b._bouche`) ;
- les flèches et les coups le touchent sur trois cercles, du poitrail à la queue ;
- le pictogramme montre le long corps ondulant.

Rien ne change dans son comportement : le vol, l'aire, la chasse, le feu, l'apprivoisement (§145 : posé, et affaibli ou en confiance).

**Dans le code** : `osDragon` réécrite (`DR_NS`, `DR_SEG`, `DR_AILE`, `DR_ECH`), `dessinDragon`, `cracheFeu`, la touche des coups dans `toucheBete`, l'étendue de dessin du dragon (2,8 au lieu de 4,5).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-116`), `LISEZ-MOI.md`.


## 150. Le rempart : les bêtes ne s'y coincent plus, les joueurs sont arrêtés dans les deux sens

**Ce qui n'allait pas** : une bête sauvage qui marchait vers le campement entrait d'un pas dans le rond, était remise en arrière, puis recommençait. Elle restait collée à la palissade.

**Les bêtes** :

- la bête refuse le pas avant de toucher le rempart, à une marge qui dépend de sa taille ;
- en cherchant son chemin, elle voit le rempart comme un obstacle : elle le longe ou s'en va au lieu de pousser contre lui ;
- une bête sauvage déjà dedans peut toujours sortir ;
- les compagnes passent, sauf pendant un pillage quand la porte est encore debout ;
- **les bêtes volantes** (et celles qui sont en vol) passent par-dessus ;
- une monture montée suit la règle du joueur.

**Les joueurs** :

- arrêtés **dans les deux sens** : on n'entre et on ne sort que par la porte ;
- un étranger au campement ne passe pas, même par la porte ;
- une petite marge empêche de se coller au rempart.

**La hauteur** : le mur invisible monte à 30 cubes au-dessus du campement (il commence 3 cubes sous lui). Sauter ou grimper à côté ne suffit plus.

**Dans le code** : `MUR_HAUT`, `MUR_MARGE`, `sousMur`, `murJoueur` réécrite, `murBetePas` (nouvelle). Elle est appelée au début de `pasBete` et dans `libre`, et `murBete` passe par elle.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-117`), `LISEZ-MOI.md`.

## 151. La cible : proposée, désignée, suivie par la caméra ; le lien ne part plus par erreur

**Ce qui n'allait pas** : dès qu'une bête qui se lie était devant vous avec 50 % de chance ou plus, ACTION devenait « LIER ». On croyait nourrir ou cueillir, et le lien partait.

**Une seule cible pour tout** : la fiche, le coup, l'arc, les sorts et le lien visent la même bête. Un chevron la montre au-dessus d'elle :

- **doré et discret** quand le jeu la propose ;
- **rouge, avec quatre coins autour d'elle**, quand on l'a désignée.

**La cible proposée** est la plus probable :

- une bête qui vous attaque ou vous traque (jusqu'à 16 m), même derrière vous ;
- celle que vous venez de frapper (jusqu'à 20 m, pendant 10 s) ;
- sinon la plus proche devant vous (jusqu'à 9 m) ;
- les compagnes, les villageois et les plantes passent en dernier, et n'ont pas de chevron.

Le jeu ne change de cible que si une autre est nettement meilleure, sauf devant une bête qui attaque.

**Désigner une cible** :

- toucher ou cliquer la créature : elle est verrouillée ;
- toucher le vide, ou la même créature, la libère ;
- au clavier, **U** désigne la cible proposée (en 1re personne, ce qui est au viseur), puis les autres de la plus proche à la plus lointaine ; revenu à la première, on libère. **Maj+U** libère ;
- en 1re personne : un toucher bref, un clic gauche quand la caméra n'est pas prise, ou un clic molette pour ce qui est au viseur.

Une cible désignée tient tant qu'elle vit et reste à moins de 25 m ; sinon « cible perdue ».

**La caméra suiveuse** (sur une cible désignée) :

- **vue 3D** : la caméra pivote pour garder la cible devant vous, se centre entre vous deux, et recule tant que la cible passe sous la boussole ou la fiche, sort de l'écran, ou que vous descendez sur les commandes. Elle revient au zoom choisi quand on libère. Sans carte graphique, elle pivote par huitièmes de tour ;
- **1re personne** : le regard se tourne vers la cible et se pose sur son corps ;
- regarder à la main (glisser, la souris, Q et E) la suspend une seconde et demie.

**Le lien sécurisé** :

- « LIER » n'apparaît plus sur ACTION ;
- le lien ne part que sur une bête **désignée**, par le bouton **LIER · %** sous sa fiche (ou Y). Le bouton est en haut de l'écran, loin du pouce qui tient ACTION. Trop loin, il le dit et ne fait rien ;
- une bête qui se lie mais n'est pas désignée le rappelle sur sa fiche : « désignez-la pour la lier : touchez-la, ou U ».

**Ce qui suit la cible désignée** : le coup au corps à corps la frappe d'abord si elle est à portée ; l'arc en vue de dessus et dans le donjon la vise où qu'elle soit autour de vous ; les sorts la visent d'abord.

L'aide (Réglages) et les textes du lien sont mis à jour.

**Dans le code** : `CIB` (près de la caméra) ; le bloc LA CIBLE (`scoreCible`, `cibleAuto`, `cibleVue` réécrite, `verrouiller`, `lacherCible`, `ecranMonde`, `sousPoint`, `toucherCible`, `cibleSuivante`, `suivreCible`, `cadreCible`, `zoomCible`, `majMire`). Autres changements :

- `viseLien` ne prend que la cible désignée, et `viseLienCone` est supprimée ;
- dans `actionContexte`, plus de LIER ;
- `cibleContact`, l'arc, `viseSort` et `djVisee` (donjon.js) visent d'abord la cible ;
- les gestes sur la vue (un toucher bref désigne), la touche U, le bouton LIER de `majCible`.

**À déposer** : `index.html`, `donjon.js`, `sw.js` (qui passe en `stone-valley-118`), `LISEZ-MOI.md`.

## 152. Alchimie : une potion ne commence pas sans tout ce qu'il faut

**Avant** : on pouvait choisir une potion, mettre l'eau et verser, puis découvrir à la fin qu'il manquait de quoi la mettre en fiole, ou un ingrédient pour une étape.

**Maintenant**, le jeu compte tout ce que la potion demandera, du début à la fin :

- les éclats des étapes d'éclats, plus ceux de la fiole ;
- ce que coûte la fiole (éclats, spores de Korlaz) ;
- un ingrédient pour chaque étape, de la bonne famille et de la bonne rareté. Chaque ingrédient ne sert qu'une fois : le jeu vérifie qu'on peut en attribuer un à chaque étape à la fois.

**S'il manque quelque chose** :

- la tuile de la potion pâlit et affiche « manque » en rouge ; le détail est dans son info-bulle ;
- on peut toujours la choisir pour lire la recette, mais un message dit ce qui manque, par exemple « il manque 5 éclats » ou « il manque viande, douceur (peu commune ou plus) » ;
- la louche, le feu et les ingrédients restent bloqués, avec le même message sous le nom de la potion.

**Une potion déjà commencée** (au moins un ingrédient versé) n'est plus vérifiée : on la mène au bout. La mise en fiole garde sa propre vérification.

En mode essai, rien n'est compté.

**Dans le code** : `manqueAlch` (l'appariement des étapes et des ingrédients), `commenceeAlch`, la vérification à la fin de `freinAlch`, le message au choix dans `alGeste`, la classe `.manque` des tuiles dans `rendreAlchimie`.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-119`), `LISEZ-MOI.md`.


## 153. Les cent recettes

En plus des plats qui se font d'eux-mêmes (ragoût, soupe, confiture…) et des neuf remarquables d'avant, il y a **cent recettes écrites à la main**, de commune à épique.

**La règle** : chaque recette est un mariage **exact**. Il faut ces ingrédients-là dans la marmite, ni plus ni moins. Une place demande :

- un ingrédient précis (« glands ») ;
- ou une famille, d'une rareté au moins (« une racine légendaire ou plus »).

**Ce que donne la rareté de la recette** :

| Rareté | Nombre | Étoiles au moins | Niveau d'effet |
|---|---|---|---|
| commune | 24 | 3 | I |
| peu commune | 24 | 3 | I |
| rare | 20 | 4 | II |
| exotique | 14 | 4 | II |
| légendaire | 11 | 5 | III |
| épique | 7 | 5 | IV |

La rareté donne aussi un peu de vie en plus. Chaque recette a **son propre effet**, qui remplace ceux de ses ingrédients ; il dure deux fois plus longtemps que dans un plat ordinaire. Sa manière (eau, feu, remuage, temps) vient de son genre : grillé, sauté, au four, mijoté, bouilli, infusé, sucré, cru. Les légendaires et les épiques font une part de plus.

**Les séries (« elles se complètent »)** : 36 recettes vont par douze séries de trois. La première étape a deux ingrédients ; la deuxième reprend les mêmes et en ajoute un ; la troisième en ajoute encore un. Chaque étape est d'une rareté au-dessus, et son effet change parfois. Une étape trouvée, le livre dit ce qui la complète.

**Dix recettes se transmettent**, en clair : ingrédients au livre, il reste à trouver la manière.

- **Cinq villageois**, selon leur métier : la cuisinière, le pêcheur, le chasseur, la cueilleuse, l'enfant. Un choix « Une recette de chez vous ? » apparaît dans la conversation.
- **Cinq nomades**, selon leur rôle : le marchand, le dresseur, le conteur, l'herboriste, le devin. Un choix « Tu connais une recette de la route ? » apparaît à l'accueil.

Chacun ne la confie qu'une fois, et pas si on la sait déjà.

**Le livre de recettes** :

- les recettes trouvées portent leur rareté, en couleur ;
- une section « Recettes confiées · à cuisiner » donne les ingrédients et qui l'a confiée ;
- une section « Elles se complètent » donne l'ingrédient qui manque à l'étape suivante ;
- un compte des cent recettes, par rareté ;
- les neuf remarquables d'avant gardent leurs indices.

**Priorité** : les cent recettes sont reconnues avant les remarquables d'avant. J'ai vérifié que les remarquables donnent toujours leur plat. Chaque recette a été essayée avec 40 marmites tirées au hasard parmi les ingrédients qui conviennent : aucune n'est détournée vers une autre.

**Dans le code** :

- le bloc LES CENT RECETTES : `RECETTES`, `RECETTE`, `R_` et `S_`, `RECETTES_DITES`, `reqVa`, `apparie`, `recetteDuPot`, `ditReq`, `recetteSuivante`, `transmettreRecette`, `recetteNomade` ;
- `preparer` (étoiles, effet, niveau, vie) ;
- `GENRE_SORTE`, `PLAT_FORME` et `CONSERVE`, complétés en boucle ;
- `livreCz` ;
- `P.recTr` (les recettes confiées), gardé dans la sauvegarde ;
- dans village.js, `vlNoeud` et `vlDit` ; dans nomades.js, `nmAller`.

Les manières notées montent à 200 dans la sauvegarde, et le livre affiche jusqu'à 200 recettes.

### La liste

**Les séries** (chaque étape ajoute un ingrédient à la précédente) :

- Bouillon du passeur (commune, grand souffle) : gardon de schiste, racine de roseau → Bouillon du passeur aux herbes (peu commune, grand souffle) : + une feuille → Grand bouillon du passeur (rare, second souffle) : + un poisson rare ou plus;
- Galette de la bergère (commune, main douce) : graines d'herbe haute, baie → Galette de la bergère aux glands (peu commune, main douce) : + glands → Galette dorée de la bergère (rare, meute galvanisée) : + nectar d'oglodon;
- Grillade du trappeur (commune, coups puissants) : une viande, pignons de pin → Grillade du trappeur au genévrier (peu commune, coups puissants) : + baies de genévrier → Festin du trappeur (rare, meute galvanisée) : + venaison de verre;
- Poêlée des sous-bois (commune, pas feutrés) : champignon des bois, crosses de fougère → Poêlée des sous-bois à l'os-cep (peu commune, peau dure) : + os-cep → Poêlée des sous-bois luisante (rare, vision de nuit) : + clavaire lumineuse;
- Compote du verger (commune, récolte abondante) : grappe de groseilles, mûres de ronce → Confiture du verger (peu commune, récolte abondante) : + goutte de sève → Confiture des sylves (rare, grand saut) : + mûres de sylve;
- Soupe des marais (peu commune, antidote) : cuisses de crapaud-buffle, racine de massette → Soupe des marais à la sphaigne (rare, antidote) : + sphaigne rouge → Soupe des marais aux lueurs (exotique, vision de nuit) : + un champignon exotique ou plus;
- Infusion des cimes (rare, grand souffle) : aiguilles de sapin, fleur d'edelweiss → Infusion des cimes au cœur de lanterne (exotique, chute de plume) : + cœur de lanterne → Élixir des cimes (légendaire, second souffle) : + une racine légendaire ou plus;
- Grillade de braise (exotique, insensible aux braises) : chair de braise, baies de genévrier → Grillade de braise aux pétales (exotique, insensible aux braises) : + pétale de braise → Festin de braise du dragon (légendaire, coups puissants) : + filet de dragon;
- Tartare des marées (commune, antidote) : sardine de nacre, feuilles de bouleau → Tartare des marées à la truite (peu commune, pas vif) : + truite d'ardoise → Plateau des marées (rare, second souffle) : + raie-horloge;
- Salade du jardin (commune, invisible) : bleuets, crosses de fougère → Salade du jardin à la pivoine (peu commune, grand souffle) : + pétales de pivoine → Salade des cendres blanches (rare, chute de plume) : + pétales de cendrelys;
- Pain de caravane (peu commune, pas vif) : cônes de cyprès, noix de palme → Pain du désert (rare, grand souffle) : + figue de cactus → Pain du Seuil (exotique, pas vif) : + un fruit exotique ou plus;
- Rôti des rois (rare, peau dure) : venaison de verre, pousses de bambou → Rôti des rois au mycélium (exotique, peau dure) : + mycélium pâle → Rôti du roi des marées (légendaire, un cœur en plus) : + lune-de-fond.

**Uniques, communes** (17) :

- Tartine des champs : graines d'herbe haute, pétales de coquelicot · main douce;
- Brochette du glaneur : filet de glaneur, baie · récolte abondante;
- Potage de la forêt : pignons de pin, racine de massette, crosses de fougère · pas feutrés;
- Gardon grillé aux ajoncs : gardon de schiste, fleurs d'ajonc · chute de plume;
- Salade de bouleau : feuilles de bouleau, lichen · antidote;
- Galette de glands : glands, glands · prédateurs à distance;
- Compote de baies sauvages : baie, baie, mûres de ronce · grand souffle · confiée (v:enfant);
- Ragoût du bosseu : bosse de bossu, racine de roseau, vesse-de-loup · épines;
- Tisane de bleuet : bleuets, feuilles de bouleau · vision de nuit;
- Poêlée de vesses-de-loup : vesse-de-loup, champignon des bois · prédateurs à distance;
- Pot-au-feu du cotonnier : tendron de cotonnier, racine de massette, racine de roseau · vie en plus;
- Pain d'herbe tressé : graines d'herbe haute, pignons de pin, glands · grand souffle;
- Brochette du sentier : cuissot de brouteur, grappe de groseilles · coups puissants;
- Infusion d'ajonc : fleurs d'ajonc, crosses de fougère, lichen · chute de plume;
- Sardines au sel de roche : sardine de nacre, sardine de nacre · antidote;
- Chaudrée du ruisseau : gardon de schiste, sardine de nacre, racine de massette · pas feutrés · confiée (v:pecheur);
- Douceur des haies : baie, grappe de groseilles, mûres de ronce, pétales de coquelicot · main douce · confiée (v:cueilleuse).

**Uniques, peu communes** (15) :

- Truite au genévrier : truite d'ardoise, baies de genévrier · pas vif;
- Carpe en croûte d'herbes : carpe des brumes, graines d'herbe haute, aiguilles de sapin · peau dure;
- Ragoût du traqueur : chair de traqueur, cœur de chardon, os-cep · coups puissants;
- Brochette de varan aux airelles : queue de varan, airelles · peau dure;
- Sirop de sève à la pivoine : goutte de sève, pétales de pivoine · grand souffle;
- Thé d'iris : iris d'eau, aiguilles de sapin · vision de nuit;
- Pousses sautées au champignon géant : pousses de bambou, lamelles de champignon géant · grand saut;
- Tourte du lentigrade : côte de lentigrade, cônes de cyprès, racine creuse · vie en plus;
- Cerises à la sève : cerises, goutte de sève · pas vif;
- Salade de koï : carpe koï, mousse-veine · main douce;
- Brochette du carillonneur : gigot de carillonneur, noix de palme · prédateurs à distance;
- Bouillon de sterne : blanc de sterne, sphaigne rouge, mousse-veine · chute de plume;
- Galette de figue : figue de cactus, cônes de cyprès · grand souffle;
- Fricassée du bramard : bosse de bramard, os-cep, pousses de bambou · vie en plus;
- Nectar aux airelles : nectar d'oglodon, airelles · meute galvanisée.

**Uniques, rares** (9) :

- Anguille fumée au sapin : anguille-lanterne, aiguilles de sapin · vision de nuit;
- Civet de cerf : venaison de verre, baies de deuil, racine creuse · peau dure · confiée (v:chasseur);
- Tarte aux mûres de sylve : mûres de sylve, goutte de sève, cônes de cyprès · grand saut;
- Brochette du félin : chair de félin de brume, fleur de Josué · coups puissants;
- Rôti d'oglodon : chair d'oglodon, cœur de chardon, mousse céleste · peau dure;
- Infusion de cendrelys : pétales de cendrelys, fleur d'edelweiss · chute de plume;
- Soupe du spectre : chair pâle de spectre, clavaire lumineuse, mousse céleste · invisible;
- Raie aux baies de deuil : raie-horloge, baies de deuil · second souffle;
- Gelée de cerisier : fleurs de cerisier, goutte de sève · main douce.

**Uniques, exotiques** (8) :

- Salamandre en croûte : chair de braise, cônes de cyprès, glands · insensible aux braises;
- Velouté de mycélium : mycélium pâle, racine de massette, lichen · vision de nuit;
- Fruits de verre au nectar : fruit de verre, goutte de sève, nectar d'oglodon · pas vif;
- Cœur de lanterne confit : cœur de lanterne, cerises · vision de nuit;
- Grillade du coursier rouge : blanc de coursier rouge, cœur de chardon · épines;
- Pétales de braise poêlés : pétale de braise, lamelles de champignon géant · insensible aux braises;
- Bouillon d'anguille aux lueurs : anguille-lanterne, un champignon exotique ou plus · coups glacés;
- Tourte du dragon : filet de dragon, graines d'herbe haute, pignons de pin · coups puissants.

**Uniques, légendaires** (8) :

- Soupe de lune pleine : lune-de-fond, cœur de lanterne, aiguilles de sapin · grand souffle · confiée (n:conteur);
- Lune grillée aux étoiles : lune-de-fond, fleur de Josué · vision de nuit · confiée (n:devin);
- Coursier d'argent rôti : blanc d'aurore, une racine rare ou plus · meute galvanisée;
- Racines légendaires au four : une racine légendaire ou plus, une racine légendaire ou plus · peau dure;
- Poêlée des profondeurs : un champignon légendaire ou plus, mycélium pâle · invisible;
- Confit de dragon : filet de dragon, cœur de lanterne, goutte de sève · un cœur en plus;
- Infusion des anciens : une racine légendaire ou plus, fleur d'edelweiss, pétales de cendrelys · second souffle;
- Pain des légendes : une racine légendaire ou plus, une graine, un fruit exotique ou plus · un cœur en plus.

**Uniques, épiques** (7) :

- Banquet du Seuil : lune-de-fond, blanc d'aurore, une racine légendaire ou plus, un champignon légendaire ou plus · un cœur en plus;
- Bouillon des mondes : lune-de-fond, une racine légendaire ou plus, mycélium pâle, cœur de lanterne · second souffle;
- Dragon aux pétales de braise : filet de dragon, pétale de braise, un champignon légendaire ou plus · coups puissants;
- Nectar d'éternité : cœur de lanterne, fruit de verre, nectar d'oglodon, une racine légendaire ou plus · vie en plus;
- Couronne des cimes : fleur d'edelweiss, fleur de Josué, un champignon légendaire ou plus, lune-de-fond · chute de plume;
- Festin du roi-coursier : blanc d'aurore, blanc de coursier rouge, filet de dragon, un fruit exotique ou plus · meute galvanisée;
- Galette d'éclipse : un champignon légendaire ou plus, un champignon légendaire ou plus, mycélium pâle, cœur de lanterne · invisible.

**À déposer** : `index.html`, `village.js`, `nomades.js`, `sw.js` (qui passe en `stone-valley-120`), `LISEZ-MOI.md`.

## 154. Correctif : le jeu passait en affichage simplifié (canvas) sans raison

**Ce que dit le journal** : en version 118, 80 erreurs et 6 incidents, tous identiques : « Cannot read properties of null (reading 'sp') at menaceCible ». C'était sur Android, en vue 3D, près du campement.

**La cause** : le ciblage du §151. La cible proposée de l'image d'avant restait gardée tant qu'elle était à moins de 20 m. Quand aucune autre créature n'était assez proche pour être proposée, le jeu demandait si « rien » attaquait, et plantait. Le plantage avait lieu pendant le dessin. Or une seule image cassée suffisait à couper la carte graphique pour la session : d'où « AFFICHAGE SIMPLIFIÉ ».

**Les corrections** :

- `menaceCible` accepte « rien », et `cibleAuto` ne compare plus avec une cible absente ;
- une panne du HUD (fiche, chevron, boussole, jauges) est notée mais ne coupe plus jamais la carte graphique : `drawHud` est protégée ;
- le repli sur le canvas attend deux images cassées de suite, comme le disait déjà le commentaire du code. Une image qui passe remet le compte à zéro (`Panne.suite`).

Le repli n'est pas gardé d'une session à l'autre : recharger la page suffisait déjà à retrouver la vue 3D.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-121`), `LISEZ-MOI.md`.

## 155. Sauvegarde : plus de faux « conflit » quand Android coupe la page

**Ce que dit le journal** : la dernière sauvegarde en ligne date du 15/10 à 21:28:22 (révision 1039). Les sessions suivantes étaient en « conflit » : la sauvegarde y était figée, et la partie n'existait plus que sur le téléphone.

**La cause** : quand le jeu passe en arrière-plan, il écrit la copie locale, puis envoie la sauvegarde. Si Android coupe la page avant la réponse, le serveur a bien enregistré la nouvelle révision, mais la copie locale garde l'ancienne et se croit « pas envoyée ». À la réouverture, le jeu voit une version en ligne plus récente que la sienne, avec des changements locaux, et conclut qu'un autre appareil a joué : « ce personnage a avancé ailleurs ».

**La correction** :

- chaque envoi porte un **jeton** (dans `donnees.jeton`) ;
- ce jeton est noté dans la copie locale **avant** l'envoi (les huit derniers, `Sauve.envois`) ;
- à la réouverture, une version en ligne qui porte l'un de nos jetons est reconnue comme la nôtre : le jeu reprend sa révision et renvoie ses changements, sans conflit ;
- en cours de partie, une réponse perdue se rattrape de même, une fois, au prochain envoi.

**Ce qui reste un vrai conflit** : une version en ligne qui ne porte aucun de nos jetons, c'est-à-dire jouée sur un autre appareil. Le panneau du sac (« Prendre en ligne » / « Garder ici ») sert toujours.

**Vérifié contre un serveur simulé**, qui suit la règle de `vp_sauver_compte` :

- un envoi normal passe ;
- page coupée en route, puis réouverture : aucun conflit ;
- un vrai autre appareil : conflit ;
- « Garder ici » force la sauvegarde ;
- une réponse perdue en pleine partie se rattrape.

Rien ne change côté base. La sauvegarde pèse 7,7 Ko stockés, pour une limite de 32 Ko.

**Le conflit en cours sur ton téléphone** date d'avant ce correctif : sa version en ligne n'a pas de jeton. Il faut le lever une dernière fois à la main, dans le sac, avec « Garder ici ».

**Dans le code** : `Sauve.envois`, `sienne`, `envoyer` (le jeton, la copie locale avant l'envoi, le rattrapage), `synchroniser`, `ecrireLocal` et `demarrerSauvegarde` (les jetons gardés dans la copie locale).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-122`), `LISEZ-MOI.md`.

## 156. Le satellite : un petit automate volant qui vous suit

Un compagnon mécanique à la façon de Phantasy Star Online : une boule de métal grosse comme une tête, coque claire, un œil lumineux, deux ailerons dorés qui battent, une antenne. Il flotte à votre épaule, un peu en arrière.

**Le fabriquer** : à l'établi, niveau 2, filière Compagnes. Il coûte 18 ferrailles, 12 éclats, 10 pierres et 8 fibres. Fabriqué, il s'allume aussitôt. Depuis une case du bord, ou « équiper » dans le sac, on le fait venir ou on le range. Il porte un nom à lui, toujours le même pour un compte : Pip, Lumo, Tic, Orbi, Brin, Nox, Mica, Volt, Kiki, Zéphyr, Plume ou Bobine.

**Son intelligence, pour l'instant : suivre, avec tête** :

- **il anticipe** : il vise où vous allez, pas où vous êtes ; quand vous courez, il se range derrière vous, dans votre sillage ;
- **il vole proprement** : son vol est un ressort amorti, qui arrive vite sans osciller, à vitesse bornée. Il passe par-dessus le relief et reste sous une dalle si vous êtes dessous. Il n'entre jamais dans votre corps ; en 1re personne, il ne se colle jamais à l'œil et se tient sur le côté ;
- **il flâne** : quand vous ne bougez plus depuis quelques secondes, il tourne lentement autour de vous. Parfois il va regarder de près une bête ou une baie mûre, l'œil vert ;
- **il garde** : une bête qui vous attaque ou vous traque, et il se place entre elle et vous, l'œil orange, avec un bip ;
- **il ne se perd pas** : semé (à plus de 12 m, ou coincé depuis deux secondes), il saute à vos côtés dans un éclair. Il en fait autant après un portail ou la pierre de foyer.

**Son corps vit** : il se penche dans le mouvement, ses ailerons battent, son œil suit ce qui l'intéresse (la bête qui menace, la cible, ce qu'il examine, sinon droit devant vous). Une petite flamme de la couleur de son œil sort de sa tuyère, et il a son ombre.

**Ce qu'il ne fait pas encore** : rien d'autre que suivre. Les autres joueurs ne le voient pas.

**Dans le code** : le bloc LE SATELLITE (`SAT`, `majSatellite`, `osSatellite`, `emitSatellite`, `basculerSatellite`, `solSat`, `nomSatellite`) ; l'objet `satellite` (emplacement `satellite`, `P.equip.satellite` : sorti ou rangé) et sa vignette. Il est dessiné dans les trois tracés : le canvas de dessus, celui de la 1re personne, et la carte graphique, avec une ombre.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-123`), `LISEZ-MOI.md`.

## 157. Le cerveau du satellite : un réseau de neurones qui apprend de vous

Le satellite a maintenant un vrai petit réseau de neurones, écrit dans le jeu, sans bibliothèque. Il tourne entièrement dans le téléphone, sans serveur ni coût. Il apprend pendant que vous jouez, et seulement quand il est sorti : c'est en vous accompagnant qu'il vous connaît.

**Ce qu'il perçoit**, toutes les demi-secondes : 18 nombres.

- la menace la plus proche et sa distance ;
- la bête sauvage la plus proche ; le nombre de bêtes autour ;
- votre vie, votre souffle ;
- l'heure (en sinus et cosinus) ;
- la distance au campement ;
- un pied mûr tout près ;
- votre vitesse ;
- une arme en main ou non ;
- la charge du sac ;
- ce que vous faisiez juste avant.

**Ce qu'il devine** : ce que vous allez faire dans les trois secondes. Récolter, vous battre, fuir, explorer, ou souffler.

**Comment il apprend** : trois secondes plus tard, il voit ce que vous avez fait. Vous avez frappé, tiré ou lancé un sort ? Vous vous êtes battu. Récolté ? Récolte. Éloigné d'une menace ? Fuite. Beaucoup marché ? Exploration. Sinon, repos.

C'est sa leçon. Il compare à ce qu'il avait deviné, corrige ses poids (rétropropagation de l'entropie croisée), puis repasse trois souvenirs pris au hasard parmi les 400 qu'il garde, pour ne pas oublier les anciennes habitudes. Il retient aussi la sorte de ressource que vous récoltez le plus ces temps-ci.

**Le réseau** : 18 entrées, 16 neurones (tangente hyperbolique), 5 sorties (softmax), soit 389 poids. Il ne se fie à ce qu'il devine qu'après 40 leçons (une vingtaine de secondes) et à partir de 50 % de confiance.

**Ce que ça change** : il devance votre geste.

| Ce qu'il devine | Ce qu'il fait | Son œil |
|---|---|---|
| récolter | il file au-dessus du prochain pied mûr, de la sorte que vous préférez, devant vous | vert |
| vous battre | il se met en garde devant vous, face à la cible | ambre |
| fuir | il vous montre la sortie : vers le campement, ou à l'opposé de la menace | violet |
| explorer | il part en éclaireur, devant, plus haut | doré pâle |
| souffler | il reste à votre épaule, et flâne | cyan |

Une bête qui attaque reste prioritaire : il se place entre elle et vous. Quand il a vu juste, une petite étincelle verte sort de son antenne.

**Ce qu'il en dit** :

- dans le sac, sa fiche donne combien de moments il a observés, combien de fois il devine juste, et ce qu'il pense en ce moment, par exemple « récolter 62 %, explorer 21 % » ;
- trois paliers s'annoncent : « vous observe » (40 leçons), « vous comprend de mieux en mieux » (300), « vous connaît bien » (1 200).

**Son savoir voyage avec le personnage** : ses poids passent dans la sauvegarde, en entiers de 16 bits encodés en base 64 (1 040 caractères), avec le nombre de leçons, sa justesse et vos goûts de récolte. Un cerveau illisible repart de zéro.

**Vérifié** :

- sur un joueur imaginaire aux habitudes fixes, le réseau passe de 21 % juste (le hasard : 20 %) à 53 % après 200 leçons, 88 % après 800, 94 % après 2 400 ;
- la boucle réelle (percevoir, attendre, apprendre) tourne sans erreur ;
- relu depuis la sauvegarde, il garde la même pensée (écart nul).

**Dans le code** : le bloc LE CERVEAU DU SATELLITE (`IA`, `reseauNeuf`, `propager`, `apprendre`, `iaPercevoir`, `majCerveau`, `lecon`, `ancrePensee`, `piedProche`, `betesAutour`, `descSatellite`, `iaPhoto`, `iaLire`). Il observe par `iaNote`, appelé dans `recolter`, `lancerAttaque`, `tirerFleche` et `lancerSort`. `majSatellite` lui laisse la place après la menace, et la fiche du sac lit `descSatellite`.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-124`), `LISEZ-MOI.md`.

## 158. Le caractère du satellite : il devient comme vous

Ce que le cerveau apprend de vous (§157) forge au satellite un **caractère**, propre à chaque joueur. Il se voit à ce qu'il fait, à la couleur de ses ailerons et à ce qu'il dit.

**Comment il se forge** :

- **la bravoure** : face à une menace, vous battez-vous ou fuyez-vous ? C'est une moyenne lente, sur chaque leçon où une bête menaçait ;
- **les penchants** : ce que vous faites plus qu'un joueur moyen. Le jeu suppose qu'un joueur moyen récolte 20 % du temps, se bat 10 %, fuit 5 %, explore 35 % et souffle 30 %.
- Avant 150 leçons, il est **Naïf**. Ensuite :
  - après au moins 6 menaces, une bravoure au-dessus de 66 % le rend **Fonceur**, en dessous de 34 % **Prudent** ;
  - sinon, c'est ce que vous faites le plus au-dessus de la moyenne qui décide : **Glaneur**, **Éclaireur** ou **Rêveur**.
- Il fait le point toutes les 30 leçons, ne change qu'après deux constats de suite, et le dit.

**Ce que chaque caractère change** :

| Caractère | Face à une menace | Au quotidien | Ailerons |
|---|---|---|---|
| Naïf | entre vous et la bête | comme avant | dorés |
| Fonceur | il fonce sur la bête et tourne autour d'elle ; avant un combat, il y va le premier | — | rouges |
| Prudent | caché derrière vous, plus haut, il tremble ; quand vous fuyez, il est déjà loin devant | il ne se met pas en garde | bleu pâle |
| Glaneur | entre vous et la bête | il pense plus tôt à la récolte (dès 38 % de confiance) et cherche les pieds plus loin (9 m) | verts |
| Éclaireur | entre vous et la bête | il vise plus loin devant vous, tourne plus large, part plus loin en éclaireur | or vif |
| Rêveur | entre vous et la bête | il flotte plus haut et plus lentement, et tourne doucement | violets |

**Ce qu'il dit** : une bulle au-dessus de lui, à son nom et à son caractère. Quand il est hors de vue, elle s'affiche au bas de l'écran.

- **Treize moments** : quand il s'allume, une menace, une victoire, une fuite, une série de récoltes (4 en 30 s), la nuit qui tombe, le retour au campement, quand vous êtes blessé, quand vous revenez après un cœur perdu, une longue pause, une île nouvelle, quand il a deviné juste (parfois), et quand son caractère change.
- **Deux répliques** par moment et par caractère, soit plus de 150. Elles mentionnent la bête (« Brouteur en vue ! On fonce ! ») ou la ressource (« Encore du bois ? »).
- **Pas trop bavard** : une réplique toutes les 14 secondes au plus, pas deux fois le même moment en moins de 50 secondes, et jamais la même réplique deux fois de suite.

**Dans le sac**, sa fiche dit son caractère et sa bravoure, par exemple « caractère : Fonceur, il fonce dans le tas (bravoure 82 %) ».

**Vérifié** sur cinq joueurs simulés :

- celui qui se bat le rend Fonceur, qui va tourner à 0,5 m de la bête ;
- celui qui fuit le rend Prudent, caché du côté opposé à la bête ;
- ceux qui récoltent, explorent ou flânent le rendent Glaneur, Éclaireur ou Rêveur ;
- le caractère se relit depuis la sauvegarde.

**Dans le code** : le bloc LE CARACTÈRE DU SATELLITE (`PERSO`, `caractere`, `majCaractere`, `persoLecon`, `SAT_DIT`, `parler`, `satEvent`, `majPerso`, `bulle`, `majBulle`, `SAT_TEINTE`) ; ses effets dans `majSatellite`, `ancrePensee` et `majCerveau`. Le jeu le prévient par `butin` (une victoire), `perdreCoeur` et `iaNote` (une récolte). Il est sauvegardé avec le cerveau (`satIA.pe`).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-125`), `LISEZ-MOI.md`.

## 159. Le satellite évolue avec son caractère, et a son arbre de compétences

### Sa forme

La forme de son caractère (§158) **pousse à mesure qu'il vous connaît**. Elle commence à 150 leçons et a fini de pousser à 2 400, soit une vingtaine de minutes sorti.

| Caractère | Ce qui pousse |
|---|---|
| Naïf | la forme de départ : corps gris-bleu, ailerons dorés |
| Fonceur | corps rouge sombre, deux cornes, l'œil en visière, de grands ailerons en lames rabattues, un corps plus massif |
| Prudent | une coque haute, deux boucliers sur les flancs, de petits ailerons repliés, gris pâle |
| Glaneur | corps vert, deux petits bras sous lui, une pousse à deux feuilles sur l'antenne |
| Éclaireur | corps bleu allongé, l'œil au bout d'une lunette, de longues ailes, une dérive à l'arrière |
| Rêveur | corps violet, un anneau de huit lueurs qui tourne autour de lui, une étoile au bout d'une antenne plus haute, des battements lents |

- **Deux stades s'annoncent** : la forme II à 40 % de croissance, la forme III à 95 %, avec un éclat blanc et une réplique (« Je me sens plus fort. Regarde mes cornes ! »).
- **Une métamorphose** quand son caractère change : l'ancienne forme se résorbe en quatre secondes, puis la nouvelle pousse, avec une gerbe à la couleur du nouveau caractère.
- Au chargement, sa forme reprend directement là où elle en était.

### Son arbre de compétences, qui se débloque seul

Une **branche par comportement**, avec pour l'instant un nœud chacune ; les deux suivants sont marqués « ? à venir ». Chaque leçon (§157) nourrit la branche de ce que vous avez fait, et **deux fois plus vite** celle de son caractère. Au seuil, il apprend la compétence tout seul, le dit (message et réplique) et lâche une gerbe dorée.

| Branche | Nourrie par | Compétence | Seuil | Ce qu'elle fait |
|---|---|---|---|---|
| Fonceur | vos combats | **Décharge** | 60 | vous vous battez (un coup, un tir, un sort dans les 3 s) : il foudroie votre cible toutes les 4 s (3 s s'il est Fonceur), à 9 m au plus. Un trait rouge, et les dégâts comptent comme les vôtres, butin compris |
| Prudent | vos fuites | **Bouclier** | 30 | une bête menace et vous êtes sous la moitié de votre vie : il vous couvre d'un bouclier (20 % de vie en plus, 30 % s'il est Prudent), une fois par minute (45 s s'il est Prudent) |
| Glaneur | vos récoltes | **Glanage** | 150 | près d'un pied mûr (4 m), il en glane de lui-même 1 unité toutes les 25 s (2 s'il est Glaneur). Les éclats et la ferraille demandent une pioche |
| Éclaireur | vos explorations | **Repérage** | 250 | toutes les 20 s, il cherche à 40 m la bête ou la plante la plus rare (rare ou plus) et la marque à la boussole d'une étoile à sa couleur, pendant 45 s, en le disant (« Repéré : spectre, à 20 m ! ») |
| Rêveur | vos pauses | **Apaisement** | 250 | quand vous restez immobile plus de 3 s, sa lueur vous soigne de 1 % par seconde (1,5 % s'il est Rêveur) |

**Dans le sac**, la fiche du satellite montre son arbre : chaque branche à sa couleur (soulignée pour la sienne), le nœud appris en clair avec ce qu'il fait, les autres avec une barre de progression, et sa forme (« forme fonceur II »).

**Vérifié** :

- les cinq compétences se débloquent à leur seuil ;
- la Décharge fait passer une bête de 100 à 90 % ;
- le Bouclier donne +20 % de vie ;
- l'Apaisement soigne 5 % en 5 s ;
- le Repérage marque un spectre à 20 m ;
- le Glanage ajoute 1 bois près d'un arbre ;
- l'arbre se relit depuis la sauvegarde ;
- les six formes ont été dessinées (images de contrôle) ;
- la fiche s'affiche sur un écran de téléphone.

**Dans le code** : le bloc L'ÉVOLUTION ET L'ARBRE DU SATELLITE (`SAT_FORME`, `majForme`, `SAT_ARBRE`, `SAT_XP`, `SAT_COMP`, `xpComp`, `majCompSat`, `SC`, `rayon`, `satRepere`, `arbreSatHTML`) et `osSatellite` réécrite. Autres changements :

- `SAT_DIT` reçoit trois moments de plus : appris, repéré, évolue ;
- `parler` met une majuscule à toute variable ;
- la boussole reçoit le repère `sat` ;
- la fiche du sac montre l'arbre ;
- la sauvegarde garde l'arbre (`satIA.sk`).

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-126`), `LISEZ-MOI.md`.

## 160. Les formes du satellite : des évolutions à la manière de Phantasy Star Online

La croissance progressive du §159 est remplacée par de **vraies évolutions**, dans l'esprit des compagnons de Phantasy Star Online :

- il ne grandit plus peu à peu ; il **évolue d'un coup**, à des paliers ;
- chaque forme a un **nom** ;
- chaque forme a un **cœur lumineux** et des **pièces qui flottent détachées** du corps ;
- **la silhouette grandit** à chaque stade.

Les formes et les noms sont originaux, pas ceux du jeu.

**Trois stades** :

- **Noyau** : la forme de départ. Ses ailerons prennent déjà la teinte de son caractère.
- **Première évolution** à 600 leçons, environ 5 minutes sorti. Taille ×1,18.
- **Seconde évolution** à 2 400 leçons, environ 20 minutes sorti. Taille ×1,35.

**Les dix formes** portent chacune un nom d'étoile accordé à leur couleur et à leur rôle :

| Caractère | Première évolution | Seconde évolution |
|---|---|---|
| Fonceur | **Antarès** : une pointe de lance rouge, une crête d'or, une visière, deux lames détachées | **Bételgeuse** : lames dessus et dessous, deux cornes d'ivoire, une couronne d'or |
| Prudent | **Alcor** : deux coques autour d'un cœur bleu pâle, deux boucliers qui tournent autour de lui | **Polaris** : une cage de quatre boucliers qui tourne, et l'étoile fixe dressée au-dessus |
| Glaneur | **Spica** (l'épi) : un corps en épi vert, six grains d'or, deux feuilles | **Vindemiatrix** (la vendangeuse) : une corolle de six pétales vert et or qui tourne, un cœur doré, deux petits bras |
| Éclaireur | **Altaïr** (l'aigle) : un corps fin, de longues ailes d'or, une traîne, l'œil-lunette | **Canopus** (l'étoile des navigateurs) : trois rémiges par aile, de l'or au bleu, une traîne en éventail, une crête |
| Rêveur | **Véga** (la lyre) : un croissant de lune autour d'un cœur violet, trois étoiles qui tournent | **Pléiades** (l'amas) : deux croissants, sept étoiles en anneau incliné |

**L'évolution** : un tourbillon d'une seconde et demie. La forme d'avant rapetisse en tournoyant ; à mi-course, un éclair blanc et une gerbe à la couleur du cœur ; puis la nouvelle forme éclôt. Il l'annonce (« Volt évolue : Spica ! ») et le dit à sa façon (« Je deviens Spica ! De quoi cueillir mieux encore. »). Un changement de caractère fait évoluer de même vers la forme du nouveau caractère, au même stade. Au chargement, il reprend sa forme sans tourbillon.

**Dans le sac**, la fiche donne sa forme et la suivante, par exemple « Forme : Spica · vers Vindemiatrix : 42 % ».

**Vérifié** : la première évolution à 600 leçons (Noyau → Spica), la seconde à 2 400 (Vindemiatrix), le changement de caractère (→ Bételgeuse) et la relecture de la sauvegarde. Les onze formes ont été dessinées sur une planche de contrôle.

**Dans le code** : le bloc LES FORMES DU SATELLITE (`SAT_NOMS_FORME`, `SAT_COEUR`, `SAT_PALIERS`, `nomForme`, `stadeVise`, `majForme`, `formeSat`, `osSatellite`). `SAT_FORME` vaut désormais `{ type, stade, anim, de }`. L'ancienne croissance continue du §159 (`SAT_FORME.p`, `maturiteSat`, `stadeDe`) est retirée.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-127`), `LISEZ-MOI.md`.

## 161. Brume sanglante : le Tome I sort de terre à la mort des mages

Le Tome I du cercle ne pouvait être vu avant la mort du dernier mage : le livre aperçu dans le pilier rouge était, très probablement, le lutrin d'une matière (posé avant le cercle, sans que le cercle l'évite).

- **Le cercle évite les autres lutrins** : jamais à moins de 10 cases d'un lutrin des matières ni de l'arche. Son seul livre est le sien. Il reste à la même place à chaque visite (le hasard de la graine).
- **Le lutrin sort de terre** à la mort du dernier mage (sous vos coups ou sous ceux du démon) : il monte en deux secondes, dans une gerbe de terre et une colonne d'étincelles rouges, avec un grondement et une petite secousse.

**Vérifié** : cinq mages tombés, pas de lutrin ; le sixième tombé, il sort de terre au centre du cercle (images de contrôle à mi-course et à la fin).

**Dans le code** : `placerCercle` (brume.js, `libre`), `majTomesBrume` (`l.surgit`), `lutrinOs` (index.html, l'enfoncement).

**À déposer** : `brume.js`, `index.html`, `sw.js` (qui passe en `stone-valley-128`), `LISEZ-MOI.md`.

## 162. L'île démoniaque

Quand le démon sort du cercle, la brume ne s'épaissit plus : elle se retire d'un coup, et l'île **bascule**.

**La vague.** Elle part du cercle et traverse l'île en quinze secondes, avec un front de braise. Derrière elle :
- l'eau (lacs, rivières, mer) devient de la **lave** qui bouillonne et luit, la nuit aussi ;
- l'herbe et les feuilles virent à la **cendre** (les arbres deviennent des arbres-cendre) ;
- le reste du sol passe au **basalte**, parcouru de veines de lave et piqué de braises ;
- le **ciel** se ferme, presque noir, rouge sombre à l'horizon ; les nuages deviennent une fumée sombre, et un voile rouge couvre tout ;
- il pleut de la **cendre**, des braises montent du sol.

**La lave brûle** : environ 9 % de vie par seconde. La potion de braise protège, comme sur la caldeira. On ne pêche pas dans la lave.

**La faune de l'île brûle** quand la vague la rattrape. Vos compagnes, les nomades, les villageois et les automates ne brûlent pas. Les Rôdeurs se défont.

**La flore du démon** sort de terre au passage de la vague : jusqu'à quatorze plantes rares (biome 40 de flore.js), aux raretés habituelles :

| Port | Plantes |
|---|---|
| Simples | Étoile du Malin, Clochettes de soufre, Éventail d'obsidienne, Crosse de braise, Orbe-brasier, Ronce ardente |
| Géantes | Lys de l'abîme, Saule des damnés, Voile de soufre, Arbre-cendre |
| Vives | Gueule de l'enfer, Fouet d'obsidienne |

Elles donnent leurs ingrédients (cuisine, alchimie) et leurs graines, comme les autres plantes rares. Les nomades ne les vendent pas.

**Les créatures sortent du sol**, près des joueurs que la vague a passés. Elles viennent plus souvent près du cercle et du démon.
- **Larves de braise** : une à deux. Elles surgissent, rampent, se cabrent et mordent (la morsure brûle deux secondes). Puis elles replongent, filent sous terre (une traînée de terre et de braises trahit leur route) et ressortent à vos pieds. Au bout d'une demi-minute, elles s'enfoncent pour de bon. +1 éclat.
- **Diablotins** : deux ou trois, qui jaillissent d'une fente rouge. Ils tournent autour de vous en sautillant, fondent griffes en avant ou crachent une boule de feu. Au bout de cinquante secondes, ils replongent. +2 éclats.

**Le combat** garde la valse de la brume.

**La guérison.** Le démon mort, l'île guérit lentement, au temps réel : trente minutes, que vous soyez là ou non.

| Avancement | Ce qui se passe |
|---|---|
| Dès la mort du démon | Le ciel commence à se rouvrir (ouvert à 60 %) |
| 20 à 45 % | La lave se fige en obsidienne fendue |
| 50 à 80 % | L'obsidienne redevient eau, case à case |
| 35 à 95 % | La cendre reverdit, case à case |
| 40 à 85 % | La flore du démon se fane, plante par plante |
| Jusqu'à 70 % | Les créatures se font de plus en plus rares, puis plus rien |
| À partir de 55 % | La faune revient |

**Le retour.** Si vous quittez l'île pendant le combat, vous la retrouvez démoniaque et le démon vous attend. Les mages sont morts, le Tome I est sur son lutrin. Après la mort du démon, vous la retrouvez où en est sa guérison.

**Correctif au passage.** La sauvegarde n'est lue qu'après la construction de l'île. Une île dont vous aviez levé la brume la retrouvait donc au retour, mages compris. De même, un livre de la brume déjà lu se rallumait. Maintenant, la sauvegarde lue, l'île est remise dans l'état où vous l'avez laissée (`brumeReprise`).

**En plusieurs** :
- le gardien de l'île dit au suiveur que le démon est sorti, et l'île bascule chez lui aussi ;
- la flore du démon et les créatures sont des bêtes du gardien (la faune partagée dit désormais quelle plante rare est une plante semée en cours de partie) ;
- l'état de l'île (`P.enfers`) est propre à chacun.

**Sans carte graphique** (canvas), l'île n'est qu'assombrie et teintée par un filtre. La lave, les veines et la cendre case par case demandent la carte graphique.

**Vérifié** :
- la bascule, la vague, la faune qui brûle, la flore qui sort ;
- la lave, le basalte et la cendre, de jour et de nuit, en vue de dessus et en 1re personne ;
- les larves (surgir, ramper, mordre, replonger, ressortir) et les diablotins (rôder, griffer, cracher : 13 boules de feu en 35 s), le tout pas à pas ;
- la guérison à 30, 60 et 90 % ;
- le retour sur l'île (démon vivant, puis guérison à 62 et 80 %) à travers la sauvegarde ;
- le filtre canvas ; une île ordinaire inchangée.

**Dans le code** :
- brume.js : le bloc L'ÎLE DÉMONIAQUE (`ENF`, `debutEnfer`, `guerirEnfer`, `majEnfer`, `brulerFaune`, `nesEnfer`, `surgirEnfer`, `majLarve`, `majDiablotin`, `osLarve`, `osDiablotin`, `lieuxEnfer`, `poserPlanteEnfer`, `enferGL`, `enferCss`, `enferCielK`, `laveIci`, `enferFaune`), et `brumeReprise` / `reprendreEnfer` ;
- index.html : `ENFER_GLSL` (`enfer()` dans DECOR_FS, ni sur les bêtes ni sur les objets), le drapeau « eau » des sommets (65536), `couleurCiel`, `capEsp` (devenue `capEsp0`), la musique, la pêche, la sauvegarde ;
- flore.js : la palette 40 ; faune.js : `k.pl` ; etats.js : le filtre ; nomades.js.

**À déposer** : `brume.js`, `index.html`, `flore.js`, `faune.js`, `etats.js`, `nomades.js`, `sw.js` (qui passe en `stone-valley-129`), `LISEZ-MOI.md`.

## 163. Les Cercles de cendre : le donjon du Roi démon (premier cercle)

**La Brèche.** Dès que l'île bascule (§162), une faille rougeoyante s'ouvre dans le sol, à dix ou dix-sept cases du cercle (la graine en décide). Des braises en montent, et un message la signale quand on approche. ACTION : DESCENDRE. On peut y plonger pour fuir le démon. Elle reste ouverte tant que l'île est démoniaque et se referme quand l'île a guéri. Si vous êtes en bas à ce moment-là, vous remontez quand même.

**Les règles** sont celles du Centre des automates :
- le plan sort de la graine, le même pour tous les joueurs de l'île ;
- chaque étage a son canal, et ses bêtes sont partagées ;
- le butin n'est à vous qu'une fois remonté, par un **soupirail** (une chaîne qui pend du plafond, un cercle de braise au sol) ;
- terrassé, vous vous réveillez près de la Brèche, sans ce que vous avez trouvé.

**Le décor.** Tout est basalte, veiné de lave (le rendu de l'île démoniaque, partout). Le ciel de la roche est rouge sombre, la musique est la valse de la brume, et des braises flottent dans l'air.

**Le premier cercle : les Galeries de cendre.** Neuf à onze salles :

| Salle | Ce qu'on y trouve |
|---|---|
| Arrivée | Le soupirail |
| Rivière | Une rivière de lave en travers, un pont d'obsidienne, un coffre, parfois un diablotin |
| Nid | Des œufs de braise ; deux ou trois larves, tapies sous terre, qui jaillissent quand elles vous voient |
| Fente | Une fente rouge au sol ; deux ou trois diablotins |
| Trésor | Un ou deux coffres de cendre ; une larve tapie |
| Braseros | Quatre braseros, deux mares de lave, parfois un diablotin |
| La Mère | Voir plus bas |

- **Les ponts d'obsidienne** se fissurent sous les pas, s'effondrent une seconde et demie plus tard, et la lave se refige en douze secondes.
- **La lave** brûle comme à la surface.
- **Les geysers de feu** sont dans les couloirs, par paires. Ils grondent (des braises montent), puis crachent une seconde, toutes les 3,6 s, à la même cadence pour tous. Un geyser fait 9 % de dégâts et brûle une seconde et demie.
- **Les larves et les diablotins** ne chassent ici que ce qu'ils voient (ou ont vu il y a moins de six secondes), ne s'en vont jamais, et une larve sans proie attend sous terre.

**La Mère des larves**, gardienne du cercle :
- une larve de quatre mètres, l'abdomen gonflé d'œufs qui battent ;
- elle dort jusqu'à ce qu'on entre, puis le basalte ferme sa salle ;
- **elle mord** : elle se cabre 0,7 s avant, en cône devant elle (15 %, la morsure brûle) ;
- **elle plonge** toutes les dix à quatorze secondes : elle file sous terre vers vous (le sol tremble, on ne peut pas la toucher), un cercle de braise marque où elle va jaillir, et elle frappe tout ce qui s'y trouve (18 %, projeté) ;
- **elle pond** deux larves toutes les quatorze secondes, quatre au plus ;
- morte : +25 éclats et +8 os ; la salle se rouvre et son coffre se descelle (éclats, os, ferraille, pierre, et parfois un tome).

Dans sa salle se trouvent aussi un soupirail et l'escalier du cercle suivant, que ferme pour l'instant un **sceau de feu**. Les Forges hurlantes, les Ossuaires, les Jardins de soufre et le Trône viendront dans les deux prochaines livraisons.

**Vérifié** :
- la Brèche (sa place, son ouverture avec la vague, l'action) ;
- la descente d'essai ;
- le plan : 11 salles, 6 coffres, 2 ponts, 6 geysers ;
- la Mère pas à pas sur 40 s : mordre, plonger, sous terre, jaillir, pondre (4 larves) ;
- la salle qui se ferme et se rouvre, le coffre scellé puis ouvert, le sceau ;
- le pont (fissure, chute, lave, retour), le geyser (dégâts), la mort en bas (retour à la surface) ;
- les images : lave et pont, œufs, Mère, soupirail.

**Dans le code** :
- **roi.js** (nouveau) : la Brèche, `roiGenere`, `roiPeupler`, `roiMaj`, `roiAction`, `roiOuvrir`, la Mère (`majMere`, `actionMere`, `osMere`), `roiDecor` ;
- **donjon.js** : `DJ.etat.th === 'roi'` passe la main à roi.js ; la porte de la salle et la mort disent « la Mère », « la Brèche » ;
- **brume.js** : `cibleEnfer`, le routage de la Mère, la lave en bas (`enferGL`) ;
- **index.html** : le ciel, la musique, le bandeau, `ROI_SPEC`, le script ;
- **sw.js** : roi.js dans le cache.

**À déposer** : `roi.js` (nouveau), `donjon.js`, `brume.js`, `index.html`, `sw.js` (qui passe en `stone-valley-130`), `LISEZ-MOI.md`.

## 164. Les Forges hurlantes, les pactes et la clé d'os (deuxième cercle)

L'escalier de la Mère des larves s'ouvre : il mène au **deuxième cercle**, les Forges hurlantes. Les murs sont de cendre et de fer, avec des bords rougis. Des chaînes pendent du plafond et se balancent.

**Les salles** : forge, chenil, coulée, armurerie, salle des chaînes, salle d'arrivée (avec l'autel et un soupirail), et la salle du Bourreau.

**Les pièges** :
- les **marteaux-pilons** frappent toutes les 2,8 s ; leur sole rougit juste avant le coup. Un coup fait 14 % de dégâts et repousse. Ils écrasent aussi les bêtes ;
- les **coulées** sont des canaux de deux cases en travers de certaines salles. Le métal y coule 2,4 s, puis se fige 3 s. Juste avant la vague, la croûte s'éclaire et clignote.

Les pilons et les coulées suivent l'horloge de l'île : tous les joueurs les voient battre au même rythme.

**Les bêtes** :
- le **forgeron damné** est lent et porte un bouclier devant lui : de face, il n'encaisse que 15 % des coups, il faut le prendre de dos. Il lève son marteau, puis l'abat ;
- les **chiens de l'Abîme** dorment en meute dans le chenil, rôdent et mordent. La morsure brûle.

**Le Bourreau** (le gardien) : sa salle se ferme sur vous. Il commence par lancer sa chaîne : un trait rouge au sol montre où elle va. Si elle vous touche, elle vous tire contre lui et sa hache tombe 0,6 s plus tard. De près, il frappe seulement à la hache. Sous la moitié de sa vie, il fait tournoyer ses chaînes.
- Sa mort rapporte +30 éclats, +10 os, 2 fers damnés et la **clé d'os**. La salle se rouvre.

**La clé d'os** : à chaque cercle, un **coffre scellé**, cerclé de chaînes et fermé par une serrure d'os, attend dans une armurerie (au premier cercle : dans une salle des Galeries). Il ne s'ouvre qu'une fois le gardien du cercle abattu. Il contient 8 à 12 éclats, 4 à 7 os et 5 à 9 ferrailles, plus 2 fers damnés aux Forges.

**Les coffres-gueules** : un coffre sur dix mord (un sur quatre avec l'Avarice). La gueule se jette sur vous. Abattue, elle rend son butin doublé. Le tirage dépend de la graine : sur une même île, ce sont les mêmes coffres.

**Les pactes** : l'autel de basalte de la salle d'arrivée propose trois pactes, tirés de la graine. On en prend un (touches 1 à 3, Échap pour refuser). Un autel ne sert qu'une fois. Les pactes s'additionnent et durent jusqu'à la remontée ou la mort.

| Pacte | Avantage | Prix |
|---|---|---|
| Braise | vos coups brûlent | la lave et le feu brûlent deux fois plus |
| Sang | chaque coup porté rend un peu de vie | la vie ne dépasse plus les trois quarts |
| Avarice | butin des coffres doublé | un coffre sur quatre a des dents |
| Fer | −30 % de dégâts reçus | −15 % de vitesse |
| Ombre | les bêtes vous voient deux fois moins loin | rien ne vous soigne |
| Hâte | +20 % de vitesse et de cadence | +25 % de dégâts reçus |

Les pactes pris s'affichent dans le bandeau du donjon.

**Le fer damné** (ingrédient d'alchimie) : il est de famille *Démoniaque*, de rareté 5, et porte l'étiquette *braise*. Il ne se trouve qu'aux Forges :
- 3 dans le coffre du Bourreau, 2 dans le coffre scellé, 1 dans un petit coffre sur quatre ;
- 1 sur un forgeron sur trois.

Comme tout le butin du donjon, on le perd si l'on meurt avant de remonter. En alchimie, il remplit n'importe quelle étape « au choix ». Sa rareté élevée augmente les chances de réussite de la potion.

**Vérifié** (descente d'essai) :
- le plan : 9 salles, 4 pilons, 2 coulées, 14 chaînes, l'autel ;
- les bêtes : 4 forgerons, 2 chiens et le Bourreau ;
- le bouclier : 0,04 de dégâts de face, 0,27 de dos ;
- le forgeron qui frappe, la meute (sommeil, rôde, morsure, brûlure) ;
- le pilon (2 coups en 7 s), la coulée (figée, puis coulante, puis dégâts) ;
- le Bourreau : le lancer, la chaîne qui happe à 4 cases et ramène contre lui, puis la hache ;
- le Fer (×0,7), le Fer et la Hâte ensemble (×0,875) ;
- l'Avarice avec la gueule ; le coffre scellé ;
- la Braise (la bête brûle), le Sang (vol de vie, vie plafonnée à 0,75) ;
- le fer damné perdu à la mort ; l'autel (choix à la touche 2, bandeau).

**Dans le code** :
- **roi.js** :
  - `genForges`, `peuplerForges`, `majForges`, `decorForges`, et `roiPlan` (le plan des salles, mis en commun avec les Galeries sans rien changer à leurs plans) ;
  - les bêtes : `ROI_CORPS`, avec `majForgeron`, `majChien`, `majBourreau`, `majGueule` et leurs modèles `os*` ;
  - les pactes : `PACTES`, `pacte`, `majPactes`, `ouvrirAutel`, `choisirPacte`, `roiHud` ;
  - `roiDonnerIngr`, `roiGueule` ;
- **brume.js** : le routage des bêtes du Roi, `pacteVue` dans `cibleBrume` et `cibleEnfer` ;
- **donjon.js** : `djPropre` garde les pactes, les autels utilisés et les ingrédients trouvés en bas ; `djRendre` retire ces ingrédients à la mort ; le bandeau affiche les pactes ;
- **index.html** : `INGR.ferdamne`, la famille *Démoniaque*, et les pactes dans `degSubi`, `degJoueur` (le bouclier), la vitesse, la cadence et `blesseParJoueur` ;
- **sw.js** : `stone-valley-131`.

**À déposer** : `roi.js`, `donjon.js`, `brume.js`, `index.html`, `sw.js`, `LISEZ-MOI.md`.

## 165. Les Ossuaires (troisième cercle)

L'escalier du Bourreau s'ouvre : il mène au **troisième cercle**, les Ossuaires. Ce sont des catacombes noires, la nuit en plein donjon.

**La lumière** : seules la lave et la lanterne éclairent.
- Ce qui donne de la lumière : les bassins, les fosses et les rigoles de lave, les dalles ouvertes, et la pâle lueur des âmes.
- Sans lanterne, on ne voit qu'à trois ou quatre pas.
- Les murs sont d'os : des niches de crânes et deux rangs de fémurs empilés.
- Dans la lumière, la poussière flotte. Au loin, de pâles lueurs passent.

**Les salles** : arrivée (avec l'autel et un soupirail), crypte, ossuaire, fosse, galerie des gargouilles, salle piégée, salle effondrée, et la salle du Chœur.
- Crypte : des sarcophages, certains au couvercle glissé.
- Ossuaire : une rigole de lave au pied du mur, des chaînes.
- Fosse : un puits de lave entre quatre pieux à crâne.

**Les pièges** :
- **Les dalles** : un joint un peu plus sombre les trahit. Sous le pied, un déclic : le joint rougeoie, et une demi-seconde plus tard la dalle s'ouvre sur la lave. Elle se referme quatre secondes après, si personne n'est dedans. On en trouve dans les couloirs et dans la salle piégée.
- **Les plafonds** : on passe dessous, la poussière tombe, et une ombre grandit au sol pendant 1,2 s. Puis les pierres tombent : 16 % de dégâts dans l'ombre. Les gravats restent.

**Les bêtes** :
- **L'âme en peine** traverse les murs.
  - Quand elle vous sent, elle glisse vers vous et boit votre vie : sa vie remonte, et un filet de lueurs va de vous à elle.
  - La lumière d'une lanterne la tient à distance. Trop près, elle fuit en sifflant. Au bord de la lumière, elle tourne et guette.
- **La gargouille** ne bouge que quand on lui tourne le dos.
  - Il suffit d'un regard à moins de 72°, sans mur entre vous, pour qu'elle redevienne pierre. Elle reste alors figée, dans la pose où on l'a surprise.
  - De dos, elle bondit et griffe. Ses yeux ne s'allument que quand elle bouge.
  - Figée, la pierre encaisse : elle ne prend que 55 % des coups.
  - Dans la galerie, la plupart des statues ne sont que de pierre.

**Le Chœur des damnés** (le gardien) : trois voix liées par des fils de lumière, chacune de sa teinte. Elles tournent autour du puits.
- Sa salle se ferme sur vous.
- **Le cri** : une voix crie (sa bouche s'ouvre et luit 0,7 s), et une onde court au sol. Il faut la sauter.
- **La morsure** : trop près d'une voix, elle boit votre vie.
- **L'accord** : environ toutes les douze secondes, un triangle de lumière se tend au sol entre les voix vivantes et bat de plus en plus vite. Qui s'y trouve encore 1,6 s plus tard prend 20 % de dégâts.
- **Les voix qui se relèvent** : une voix abattue laisse une flamme pâle. Si les autres chantent encore six secondes après la première chute, les voix tombées se relèvent à moitié de leur vie. Plus il reste de voix à terre, plus le Chœur tourne vite et plus les cris pressent.
- **La victoire** : les trois voix à terre en même temps, le Chœur se tait. Il rapporte +35 éclats, +12 os, 3 poussières d'âme et la clé d'os. La salle se rouvre, et son coffre et le coffre scellé (dans une crypte) se descellent.

L'escalier du quatrième cercle est dans sa salle, encore scellé : les Jardins de soufre viendront avec le Roi.

**La poussière d'âme** (ingrédient d'alchimie) : famille *Démoniaque*, rareté 5, étiquette *nuit*.
- Où la trouver : 3 sur le Chœur, 3 dans son coffre, 2 dans le coffre scellé, 1 dans un petit coffre sur quatre, 1 sur une âme sur trois.
- Elle se perd si l'on meurt en bas.
- En alchimie, elle remplit les étapes « au choix », comme le fer damné.

**L'autel** : il propose trois pactes dans la salle d'arrivée de ce cercle aussi. Les pactes du deuxième cercle s'ajoutent.

**Corrigé au passage** (§164) :
- en bas, le sol n'est plus d'aucun biome : les Forges n'annoncent plus la « Terre des automates » comme un biome découvert, et la croûte figée d'une coulée ne brûle plus (seul le métal qui coule brûle) ;
- le pacte d'Ombre ne s'appliquait pas deux fois aux bêtes des Cercles ;
- (déjà dans la version 131, non signalé) le Bourreau lance sa chaîne 1,2 s après son réveil au lieu de 3 : avant, on était à portée de hache avant qu'il ne la lance.

**Vérifié** (descente d'essai, du deuxième cercle au troisième) :
- l'escalier du Bourreau mort ;
- le plan : 11 salles, 31 dalles, 7 plafonds, 22 lumières de lave ;
- les bêtes : 12 âmes, 7 gargouilles dont 3 statues, et le Chœur ;
- le noir (noirceur 1, huit lumières) ;
- la dalle (déclic, ouverture, la chute dans la lave, puis elle se referme) ;
- le plafond (ombre, chute, 19 % de dégâts) ;
- l'âme sans lanterne (elle vient et boit) puis avec (elle fuit et guette) ;
- la gargouille immobile de face, qui bondit et griffe de dos, puis se fige ;
- le Chœur : le réveil, la salle fermée, les cris et les ondes, l'accord, une voix qui se relève, puis les trois ensemble (fini, butin, salle rouverte, coffre scellé ouvert) ;
- la poussière d'âme perdue à la mort ;
- les images : arrivée, crypte, ossuaire, gargouilles, âme, Chœur et accord, plafond.

**Dans le code** :
- **roi.js** :
  - `genOssuaires`, `peuplerOssuaires`, `majOssuaires`, `majChoeurSalle`, `decorOssuaires` ;
  - `roiLueurs`, `roiNoir`, `roiCiel` ;
  - les bêtes et leurs modèles : `majAme`/`osAme`, `majGargouille`/`osGargouille`, `majChoeur`/`osChoeur` ;
  - `pierreK`, `roiDegK`, `ROI_INGR` ;
- **index.html** :
  - `lumiere` (la nuit des Ossuaires), `couleurCiel`, `majFeux` (`roiLueurs`) ;
  - le shader : si `uEnf2.w < 0`, seule la lave est touchée ;
  - `degJoueur` (`roiDegK`), `INGR.poussame`, `majBiome` ;
- **brume.js** : `enferGL`, `cibleEnfer` ;
- **donjon.js** : la salle du Chœur se ferme ;
- **sw.js** : `stone-valley-132`.

**À déposer** : `roi.js`, `index.html`, `brume.js`, `donjon.js`, `sw.js`, `LISEZ-MOI.md`.

## 166. Les Jardins de soufre, le Trône, les reliquaires et les objets uniques

La dernière livraison des Cercles de cendre. Le code est dans un nouveau fichier, **trone.js** ; roi.js garde la main et l'appelle selon le cercle. Les quatre cercles et le Trône sont maintenant tous ouverts.

### Le quatrième cercle : les Jardins de soufre

**Le décor** : un sol de soufre et d'ocre, des plaques de mousse rouge, des murs de cendre noire où grimpent des lianes à épines piquées de fleurs rouges. Une brume jaune flotte (un voile sur le rendu, un fond de couleur soufre). Du pollen qui luit, de la cendre qui tombe.

**La flore vive du démon** : ce sont les plantes de l'île démoniaque (flore.js).
- des fleurs à cueillir ;
- des géantes (le Saule des damnés, l'Arbre-cendre…) ;
- des vives, qui mordent ou fouettent (la Gueule de l'enfer, le Fouet d'obsidienne).

À côté poussent des **lys de soufre** dans des parterres bordés de pierre, des gerbes de **cristaux de soufre**, des ronces noires aux épines rouges, des fumerolles qui crachent une fumée jaune.

**Les salles** : arrivée (avec l'autel et un soupirail), serre, fumerolles, cercle des sorcières (des cierges noirs, un chaudron qui bouillonne), salle des geysers, mare de lave bordée de cristaux, roncier, reliquaire, et le jardin du gardien.

**Les dangers** :
- **les poches de soufre** : on s'y empoisonne et la vie baisse. Au contact du feu (un cercle de sorcière, un geyser), elles **explosent** : 20 % de dégâts et une brûlure. Elles se remplissent quatorze secondes plus tard.
- **les geysers de flammes** : ils grondent 1,4 s, puis crachent une colonne de près de quatre mètres pendant 1,5 s.

**La sorcière de soufre** : bossue, chapeau pointu à ruban jaune, bâton coiffé d'une pierre de soufre.
- Elle se tient à six ou neuf pas et tourne autour de vous.
- Toutes les quatre secondes environ, elle incante un **cercle de feu** là où vous allez : le cercle s'allume 1,3 s avant que les flammes ne montent, et elles brûlent 3 s.
- Trop près, elle disparaît dans un nuage jaune et reparaît plus loin.

**Le Jardinier** (le gardien) : une gueule géante enracinée au milieu de sa salle, entre six pétales, avec six lianes qui courent jusqu'aux murs.
- **La morsure** : il mord qui s'approche ; ses pétales s'ouvrent avant.
- **Le fouet** : une liane se soulève en rougeoyant (un trait rouge au sol), puis s'abat sur toute sa longueur.
- **L'étreinte** : sous le plus éloigné, un anneau de racines, puis une liane jaillit et le tient 1,8 s.
- **Les graines** : il en crache, et elles éclatent en poches de soufre.
- **La floraison** : à mi-vie, il fleurit. Deux plantes vives sortent de terre et le soufre de la salle s'embrase.
- **Sa mort** : +40 éclats, +14 os, 3 fleurs de soufre et la clé d'os.

### Le Trône

**L'antichambre** : le soupirail, l'autel des pactes, deux démons de pierre, des braseros et des bannières. Une allée y mène à la salle du Trône (vingt-huit cases sur vingt-quatre) :
- un tapis rouge bordé d'or jusqu'à l'estrade ;
- huit piliers en deux rangées ;
- des bannières rouges à la couronne d'or, des braseros sur trépied ;
- des cages pendues à des chaînes, des crânes au pied de l'estrade ;
- deux rigoles de lave le long des murs ;
- et le trône : un dossier immense hérissé de cornes, des accoudoirs à crânes.

**Le Roi démon** : trois mètres et demi, une armure noire filetée d'or, une cape cramoisie, deux cornes, l'épée de flammes, de grandes ailes repliées. Sa couronne a sept pointes d'obsidienne et des pierres de braise.
- **Assis** (au-dessus des deux tiers de sa vie) : il appelle trois diablotins, fait jaillir des colonnes de feu (un cercle au sol 1,4 s avant), et balaie de son épée qui monte sur l'estrade.
- **Il se lève** : 2,2 s pendant lesquelles on ne le touche pas. L'onde repousse tout le monde.
- **Debout** :
  - l'épée de flammes en arc ;
  - la chaîne, qui vous tire contre lui avant l'épée ;
  - la charge en ligne droite, annoncée par un trait rouge au sol. S'il heurte un pilier, le pilier tombe et le Roi reste sonné 1,6 s.
  - Toutes les seize secondes, un pilier tombe de lui-même (il tremble et se fend avant). Ses tambours restent couchés en travers : un abri, et plus tard un îlot.
- **Sous 30 %** : il s'envole, et le sol de la salle s'effondre en lave. Il rougeoie 2,5 s avant de céder du bord vers le centre ; il ne reste que l'estrade, les piliers tombés, sept îlots et l'entrée.
  - Dans les airs, on ne le touche pas.
  - Il crache des boules de feu (que le Bouclier d'obsidienne renvoie).
  - Il plonge sur vous : une ombre grandit au sol, et il frappe à l'impact.
  - Puis il reste **étourdi** 2,4 s, à genoux, la couronne embrasée : c'est son point faible, les coups y comptent double et plus.
- **Sa mort** : +80 éclats, +24 os, 2 Sang du Roi et la **Couronne du Roi démon**. La lave se refige, et son coffre se descelle : éclats, os, ferraille, pierre et deux de chaque ingrédient des cercles.

### Les reliquaires

Chaque cercle a maintenant sa salle de défi. Au fond, un reliquaire scellé (une châsse noire cerclée d'or) attend sur un socle, entre des cierges noirs, et trois sceaux marquent le sol.
- Qui entre, la porte se ferme.
- Trois vagues sortent des sceaux, de plus en plus fortes : larves et diablotins, chiens et forgerons, âmes et gargouilles, sorcières et plantes vives.
- La dernière tombée, la porte se rouvre et le reliquaire se descelle.
- Il donne l'**objet unique** du cercle. Si on l'a déjà, il donne un trésor : éclats, os et deux ingrédients du cercle.

Pour les trois premiers cercles, la salle de défi prend la place d'une salle sans relief : un trésor, une armurerie, une salle effondrée. Le plan des salles ne change pas, mais ce qu'elles contiennent change un peu.

### Les objets uniques

On ne les trouve nulle part ailleurs. Comme tout le butin d'en bas, ils ne sont à vous qu'une fois remontés.

| Objet | Où | Ce qu'il fait |
|---|---|---|
| Bouclier d'obsidienne (armure) | les Galeries | −55 % de dégâts ; porté dans le dos ; une boule de feu qui arrive de face repart vers celui qui l'a lancée |
| Fouet de chaînes (arme) | les Forges | dégâts 50, portée de quatre pas ; la chaîne file devant vous et tire la bête jusqu'à vous (pas les gardiens ni les grosses bêtes) |
| Bâton de l'Abîme (grimoire) | les Ossuaires | une boule de feu noire et rouge, vers ce que vous visez ; elle éclate : dégâts et brûlure à deux pas et demi, des brasiers au sol |
| Lame de soufre (arme) | les Jardins | dégâts 84, très vive ; une lame noire au fil jaune ; vos coups brûlent, partout, pas seulement en bas |

**La Couronne du Roi démon** est une curiosité épique, la plus haute rareté : coups puissants, insensible aux braises, et la vie revient d'elle-même.

**Les ingrédients** (famille *Démoniaque*) :
- l'**œuf de braise** aux Galeries (rareté 4, *braise*), sur la Mère et dans les coffres ;
- la **fleur de soufre** aux Jardins (rareté 5, *souffle*), sur les sorcières, le Jardinier et dans les coffres ;
- le **Sang du Roi** (rareté 6, la plus haute, *braise*), seulement sur le Roi.

**Corrigé au passage** :
- « le coffre de le Bourreau » devient « le coffre du Bourreau » (de même pour le Chœur, le Jardinier et le Roi) ;
- la brûlure des bêtes (pacte de Braise, Lame de soufre) marche maintenant partout.

**Vérifié** (descente d'essai, des Galeries au Trône) :
- les cinq plans, sans erreur ;
- le reliquaire : trois vagues, la porte, l'objet unique ;
- la Lame de soufre (la brûlure), le Fouet (une bête ramenée de 3,8 à 1,2 pas) ;
- le Bouclier (renvoyée de face : le diablotin prend 84 % ; de dos, elle touche) ;
- le Bâton (la cible et sa voisine abattues) ; la perte des uniques à la mort ;
- la sorcière (cercles, distance, disparition) ; la poche de soufre (poison, explosion) ;
- le Jardinier : morsure, fouet, étreinte, graines, floraison, mort, salle rouverte, escalier ;
- le Roi : assis (colonnes, diablotins), levé (intouchable), debout (épée, chaîne qui happe, charge et sonné, un pilier tombé), envol (517 cases de lave), vol (intouchable), boules de feu, plongée, étourdi (×2,2) ;
- sa mort : butin, couronne, lave refigée, coffre ;
- les images de chaque salle et de chaque phase.

**Dans le code** :
- **trone.js** (nouveau) :
  - les objets : `roiInit`, `roiGeomArme`, `roiDos`, `roiCoupArme`, `roiMajArmes`, `roiRenvoi`, `roiSortAbime`, `roiAbimeExplose` ;
  - les reliquaires : `peuplerReliquaire`, `lancerVague`, `majReliques`, `ouvrirReliquaire`, `decorReliquaire`, `decorReliques` ;
  - les Jardins : `genJardins`, `peuplerJardins`, `planteJardin`, `majJardins`, `exploserGaz`, `cercleFeu`, `majSorciere`, `clignoter`, `majJardinier`, `actionJardinier`, `osSorciere`, `osJardinier`, `decorJardins` ;
  - le Trône : `genTrone`, `peuplerTrone`, `majTrone`, `tomberPilier`, `effondrerTrone`, `majRoi`, `actionRoi`, `roiK`, `osRoi`, `decorTrone`, `roiButinBas` ;
- **roi.js** :
  - la répartition par cercle, les salles de défi des trois premiers cercles, les espèces, `ROI_INGR` ;
  - les geysers « grands », `deG`, `roiTerreNue`, `roiVoile` ;
- **index.html** :
  - le script trone.js, `roiInit` ;
  - les crochets de l'arme en main, du dos, de la traînée, du sort, du tir renvoyé, du voile ;
  - les trois ingrédients ; « le Trône » dans le bandeau ;
- **brume.js** : `roiTerreNue` ; le Jardinier et le Roi se défont lentement ;
- **donjon.js** : les salles du Jardinier et du Roi se ferment ; `defis` dans la sauvegarde ;
- **sw.js** : `stone-valley-133` et trone.js.

**À déposer** : `trone.js` (nouveau), `roi.js`, `index.html`, `brume.js`, `donjon.js`, `sw.js`, `LISEZ-MOI.md`.

## 167. La magie, plus forte ; le pupitre montre ce qui est verrouillé

**Plus forte** :

| Forme | Dégâts (avant → après) | Prix en éclats |
|---|---|---|
| Trait | 35 → 60 | 5 → **2** |
| Onde | 20 → 34 | 10 |
| Piège | 45 → 75 | 8 |
| Mur | 12 → 20 | 12 |
| Égide | 15 → 25 (rendus à qui vous frappe) | 12 |

Le prix d'un sort reste celui de sa forme plus celui de sa matière : un Trait de vent coûte maintenant 5 éclats au lieu de 8. Les dégâts sont ensuite multipliés par le poids de la matière (le Cristal ×1,6, le Vent ×0,5…).

**L'égide tient dix minutes** (quatorze avec le circonflexe), au lieu de dix secondes. Elle se garde dans la sauvegarde, et suit donc d'une île à l'autre et d'un cercle à l'autre. Les autres joueurs la voient tout du long.

**Le pupitre** : le bouton « mêler » et la ligne des accents se montrent même verrouillés, grisés d'un cadenas, avec ce qui manque :
- **mêler deux matières** : la bibliothèque de niveau 2 (le coût s'affiche), et le Tome I de chacune ; leurs Tomes II rendent le mélange stable ;
- **les accents** : la bibliothèque de niveau 3, et le Tome III de chaque matière de la phrase. Un accent qu'il manque un Tome III pour poser est en pointillé, et une note dit lequel (la Tisseuse de fer le porte).

**Corrigé** : déchiffrer un Tome II disait « cette matière pourra se mélanger ». On peut mêler dès les Tomes I : le Tome II rend les mélanges stables, et le message le dit maintenant.

**Vérifié** :
- le pupitre au niveau 1 (verrous et notes) et au niveau 3 (mélange, accent, note du Tome III) ;
- un Trait de vent à 5 éclats ;
- une égide de 600 s, toujours là après une relecture de la sauvegarde ;
- l'inscription d'un mélange accentué.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-134`), `LISEZ-MOI.md`.

## §168 — La nourriture, plus forte et plus longue

**Les durées** :
- l'effet d'un plat dure trois fois plus longtemps (135 s par ingrédient qui le porte, au lieu de 45) ;
- les plafonds passent de 10 à 30 min, et de 20 à 60 min pour les plats légendaires et épiques (×1,5 pour un plat parfait) ;
- la régénération des plats légendaires dure 3 min (au lieu d'1), celle des épiques 4 min 30 (au lieu d'1 min 30).

**La force** :
- **Soin** : la vie rendue par un plat cuisiné passe à environ ×1,4. Le bonus des plats rares passe de +10 % à +15 %, celui des légendaires de +30 % à +40 %. Manger cru ne change pas.
- **Régénération** : 1,5 %/s (légendaire), 3 %/s (épique).
- **Par niveau d'effet** :
  - coups puissants +35 % (au lieu de +25 %) ;
  - peau dure −25 % (au lieu de −20 %), jusqu'à −70 % ;
  - pas vif +20 % ;
  - saut +16 % ;
  - vampire 2,2 % de vie par coup ;
  - gel plus long ;
  - épines 40 % du coup rendu ;
  - meute +35 % ;
  - vision de nuit plus large.
- **Vie en plus et second souffle** : plus gros par plat. Les plafonds passent à 100 % (vie) et 200 % (souffle).
- **Les parts** : une part d'un plat à plusieurs parts vaut les trois quarts du plat entier (vie et durée), au lieu de la moitié.

**Remarques** :
- Les curiosités qui donnent un effet de plat profitent aussi des nouveaux niveaux.
- Les plats déjà cuisinés gardent leurs anciennes valeurs. Seuls les nouveaux en profitent.

**Vérifié** :
- un plat de 3 ingrédients rend 60 % de vie, avec un effet de 5 min 51 ;
- un plat légendaire rend 75 % de vie, avec un effet de 16 min et 3 min de régénération ;
- un plat parfait donne un effet de niveau II pendant 8 min 47, affiché au HUD ;
- aucune erreur.

**À déposer** : `index.html`, `faune.js`, `sw.js` (qui passe en `stone-valley-135`), `LISEZ-MOI.md`.

## §169 — L'alchimie : la chance fait la puissance

La puissance d'une potion dépend de la chance qu'elle avait au moment de la mise en fiole : **puissance = 50 % + la chance**.
- 5 % de chance donnent 55 % de puissance, 50 % donnent 100 %, 95 % donnent 145 %.
- Une potion parfaite donne 150 %.

**Effet en jeu** :
- Chaque rang garde sa puissance. Une caractéristique vaut la somme des puissances de ses rangs. Exemple : deux rangs, l'un à 150 %, l'autre à 77 %, valent 2,27 rangs.
- Cela vaut pour les huit caractéristiques du joueur, et pour la récolte et la défense des compagnes.
- Les compétences éveillées (boule visqueuse, charge…) restent par rang.
- L'encre ne change pas : deux éclats si la potion est parfaite.

**Affichage** :
- la fenêtre de la potion montre la puissance prévue, sous la chance de réussite ;
- elle montre aussi la valeur avant → après, avec cette puissance ;
- le message et le bilan de la fiole disent la puissance obtenue ;
- les tuiles montrent les valeurs réelles.

**Compatibilité** : les rangs gagnés avant cette version valent 100 %. La puissance est sauvegardée (`alchP` pour le joueur, `pot.p` pour une compagne).

**Vérifié** :
- une potion parfaite (95 %) donne 150 % de puissance (vie 100 → 115) ;
- une potion ratée de gestes (27 %), mais réussie au dé, donne 77 % ;
- la sauvegarde est relue sans perte ;
- une ancienne sauvegarde à 2 rangs vaut 2 ;
- une potion de récolte pour une compagne donne 150 % ;
- la fenêtre est capturée ;
- aucune erreur.

**À déposer** : `index.html`, `sw.js` (qui passe en `stone-valley-136`), `LISEZ-MOI.md`.

## §170 — Le Centre des automates, refait : plus dense, plus grand, et sa musique

Nouveau fichier : `rouages.js`. `donjon.js` lui passe la main pour le plan, le mobilier, ce qui bouge et la musique du Centre.

**Le plan, serré**
- Les salles se posent les unes contre les autres, au plus près du milieu, avec trois à six cases de roche entre elles. Le souterrain forme un bloc compact, et les couloirs sont courts.
- Chaque étage compte 15 à 18 salles, au lieu de 8 à 11.
- Une **grande halle des machines** (22-26 × 18-21) occupe chaque étage, sauf le dernier.
- Dès le deuxième étage s'ajoute une **fonderie** (15-17 × 13-15).
- Au dernier étage, la **salle de l'Horloge** est immense (30 × 24).
- Quatre boucles au lieu de deux : on a plus d'un chemin.
- Des **niches** (deux cases sur deux) s'ouvrent au flanc des couloirs. Chacune abrite un meuble et une lampe.
- **Les murs montent** autour des salles :
  - 4 cubes pour les petites, 5 ou 6 pour les grandes ;
  - 8 pour la halle, 7 pour la fonderie, 11 pour l'Horloge ;
  - autour des grandes salles, de l'arrivée, des archives et du générateur, les murs sont en tôle.

**Les salles nouvelles, plus calmes** (un coffre une fois sur deux ; à partir de l'étage 3, parfois une araignée) :
- l'**atelier** : établis, tableaux d'outils, et un automate démonté sur une table, sous un bras de soudure qui crache des étincelles ;
- le **dépôt** : un wagonnet de minerai sur ses rails, des piles de caisses ;
- les **archives** : des rangées de mémoires à bandes, avec leurs bobines qui tournent et leurs voyants ;
- la **chaufferie** : deux à quatre chaudières, leurs foyers, leurs cheminées, la vapeur des soupapes ;
- la **chaîne** : deux tapis roulants qui emportent caisses **et joueur**, des presses qui frappent ;
- le **générateur** : une dynamo à rotor, et deux bobines de Tesla qui s'arquent au-dessus de la salle (une tourelle à partir de l'étage 2).

**La halle**
- un volant de 6,6 m qui tourne dans son bâti, avec son régulateur à boules ;
- deux pistons géants ;
- deux colosses de bronze de sept mètres sur leurs socles ;
- deux paires de rouages muraux qui engrènent ;
- des balcons et un pont roulant qui promène sa charge ;
- des suspensions, des cheminées d'angle et des allées peintes ;
- deux araignées et une ou deux tourelles.

**La fonderie** : des fours rougeoyants avec leurs cheminées, et un creuset qui court sur sa poutre et verse le métal dans une rangée de moules. Des chaînes, des lingots, deux araignées ou trois.

**L'Horloge**
- un cadran de 8 m sur le mur nord, qui donne l'heure réelle, avec trois aiguilles ;
- ses deux tours et son balancier de 5 m, qui bat sur un socle ;
- des rouages muraux, six colonnes de 2 × 2 avec leurs lanternes, et des balcons ;
- un grand cadran au sol, où veille le gardien.

**Le mobilier**
- **Contre les murs**, et on ne le traverse pas : armoires, casiers, consoles à écran, étagères, établis, citernes, caisses, munitions, charbon, lingots, statues d'automates, condensateurs, mémoires à bandes.
- **Au mur**, on passe devant : tableaux électriques, vannes, tableaux d'outils, docks de recharge, bannières.
- Le mobilier laisse libres les abords des portes, les coffres et le monte-charge. Chaque salle a son assortiment.
- **De quoi se couvrir** : des barricades d'acier chez les tourelles, des caisses chez les araignées, au grenier et près de l'escalier, des cristaux sur socle dans la salle des cristaux.

**Partout**
- des nervures d'acier et des poutres sur les grands murs, et des conduites avec leurs brides ;
- des cadres de porte rayés de jaune, avec leur lampe au linteau et des bandes au sol ;
- une ligne peinte devant le mobilier, des grilles et des plaques d'égout ;
- dans les couloirs : conduites, câbles, lanternes grillagées, grilles ;
- une rambarde et une enseigne autour de l'escalier, et un cercle rouge dans l'arène du gardien.

**La lumière** : le Centre est éclairé, donc la brume y recule (18-44 en vue de dessus, 12-44 en vue à la première personne).

**Le rendu**
- En WebGL, le mobilier fixe (≈ 7 000 os) est rangé par tronçon de 16 cases et construit une seule fois avec la roche. Seul ce qui bouge est refait à chaque image : 200 à 800 os près du joueur, les petits détails à moins de 26 cases.
- En vue de dessus, le décor s'ouvre devant l'œil comme la roche.
- Le rendu canvas garde l'ancien chemin.

**La difficulté** : il y a plus de salles, donc moins de machines par salle :
- araignées : 2 + 60 % de l'étage au lieu de 3 + l'étage ;
- grenier : moitié moins d'araignées ;
- salle du gardien : la moitié de ses araignées.

Le dernier étage compte environ 25 machines.

**La musique : « La Grande Horloge »** (composition originale, 4/4 à 120, ut dièse mineur)
- Les instruments : le balancier (tic aigu, tac grave), une basse d'automate en doubles croches, le marteau-pilon, les sifflets de vapeur, l'enclume, une boîte à musique, un orgue, des cuivres, la grande cloche, des toms.
- Cinq parties :
  - l'ouverture ;
  - l'ostinato ;
  - le thème ;
  - le sommet ;
  - le pont, où l'horloge sonne avant que le cliquet ne s'emballe.
- Elles s'enchaînent selon le danger :
  - en exploration, une version calme, sans batterie ;
  - une machine qui vous voit fait monter le morceau ;
  - une salle refermée, ou le gardien, déclenche le sommet.
- Le morceau est rendu en tâche de fond dans des tampons, comme la Valse rouge, puis enchaîné par un lecteur léger.
- Il est joué partout dans le Centre (`MUS.choisir` → `rouages`), sauf pour un joueur infecté par le Korlaz. La surface de l'île des automates garde sa musique.

**Vérifié**
- Trois îles × trois étages, dont le dernier : tout est relié à l'arrivée, c'est-à-dire les coffres, toutes les salles, l'escalier et les monte-charge.
- Aucune erreur, au Centre comme dans les Cercles de cendre et à la surface.
- Captures en vue de dessus et à la première personne de chaque type de salle.
- Les niveaux sonores sont proches de ceux de la Valse rouge, et les tampons se rendent en jeu.

**À déposer** : `rouages.js` (nouveau), `donjon.js`, `index.html`, `sw.js` (qui passe en `stone-valley-137` et liste `rouages.js`), `LISEZ-MOI.md`.

## §171 — La Forge (phase A)

Nouveau fichier : `forge.js`. Une arme se forge comme une potion se prépare, avec des gestes **en temps réel**. Le métal refroidit pendant qu'on travaille.

**Le principe**
- **La recette fait l'arme** : sa forme, son allure et sa compétence. La recette, c'est le plan, la charge, le nombre de coups, les plis, l'âme (ordre compris), le bain et la monture.
- **L'exécution fait sa puissance** : c'est la justesse des gestes, de 5 à 100 %. À 97 % et plus, l'arme est un **chef-d'œuvre** : +5 %, et elle s'use deux fois moins vite.
- Deux joueurs qui suivent la même fiche obtiennent la même arme.

**La forge**
- Elle se bâtit depuis l'onglet Campement : « Forge », après l'établi.
- Elle ne prend pas de place dans l'anneau des modules. Elle s'élève sur un replat voisin, à cinq à douze pas du feu, et défriche s'il le faut.
- Sa place est gardée tant que le campement ne bouge pas.
- On y voit le foyer et sa hotte, le soufflet, l'enclume, le bac de trempe, puis la meule (niveau 2) et le râtelier (niveau 3).
- ACTION devant elle : FORGER.
- Coûts :
  - niveau 1 : 60 pierres, 30 bois, 20 ferrailles ;
  - niveau 2 : 80 pierres, 50 ferrailles, 30 éclats ;
  - niveau 3 : 100 ferrailles, 60 éclats, 30 os.

| Niveau | Ingrédients d'âme | Lecture de la forge | Lecture d'un code |
|---|---|---|---|
| 1 | 1 | à l'œil : la chaleur en mots, la trempe à la vapeur | plan, charge, monture |
| 2 | 2 | en clair | en plus : chauffe, coups, plis, trempe |
| 3 | 3, et la gravure (un nom sur la lame) | en clair, avec plus de marge à la trempe | tout, l'âme et la compétence comprises |

**Les gestes**

1. **Le plan** : six plans aujourd'hui. Les vingt-trois autres sont décrits et viendront.
2. **La charge** : de deux à quatre portions.
   - ferraille : 8 par portion ;
   - pierre : 10 ;
   - os : 6 ;
   - éclat : 6 ;
   - fer damné : 1.
   
   Elle fait l'alliage : tranchant, dureté, poids, couleur, et la chauffe juste.
3. **La chauffe** : on maintient le SOUFFLET, puis on pose la pièce SUR L'ENCLUME à la bonne couleur. Au-delà du jaune, la pièce brûle.
4. **Le martelage** : on FRAPPE sur le battement, de 6 à 21 coups. Le nombre de coups fait la longueur. Un coup à contretemps, ou à froid, est un défaut.
5. **Les plis** : de 0 à 5, la pièce encore chaude. Ils donnent le déclencheur de la compétence. Un sixième pli casse la lame.
6. **L'âme** : on verse les ingrédients sur le métal rouge. L'ordre compte : le premier pèse plus. Versée trop froide, l'âme ne prend pas.
7. **La trempe** : on choisit un bain, puis on PLONGE et on RETIRE au bon moment, à ±1 s (±1,4 au niveau 3). Les bains :
   - eau : gratuite ;
   - huile : 2 graines ;
   - sang : 2 viandes ;
   - nectar : 1 douceur ;
   - neige d'éclat : 6 éclats.
8. **L'affûtage** : il faut garder l'angle dans la bande pendant cinq secondes (◀ ▶).
9. **La monture** : bois, os, cuir ou laiton. Au niveau 3, on peut aussi graver un nom.

La pièce peut retourner AU FEU entre deux gestes. Clavier : Espace pour le geste principal, flèches pour la meule, Échap pour fermer.

**La compétence** : élément × déclencheur × forme, du niveau I à IV.
- **L'élément** vient de l'âme : du tag de l'ingrédient, sinon de sa famille, sinon de son identité. Les ingrédients du Roi démon donnent les éléments forts.
  - feu, givre, foudre (en chaîne), poison ;
  - vie, ombre (invisibilité), lumière (soin et aveuglement) ;
  - séisme (étourdit), vent (projette).
  
  Deux âmes contraires s'annulent : feu et givre, lumière et ombre, vie et poison, séisme et vent. Une seconde âme nuance la première.
- **Le déclencheur** vient des plis :
  - 0 : à chaque coup, une fois sur quatre ;
  - 1 : au 3ᵉ coup d'une série ;
  - 2 : sur un coup chargé ;
  - 3 : dans le dos ;
  - 4 : en tuant ;
  - 5 : en riposte, juste après avoir été touché.
- **La forme** vient du bain :
  - eau : sur le coup ;
  - huile : une zone au sol ;
  - sang : sur soi (peau dure, coups puissants, pas vif, invisibilité, régénération, coups brûlants…) ;
  - nectar : un trait vers la bête suivante ;
  - neige : une aura de quelques secondes.

**Les six armes de la phase A**
- **Dague** : très rapide. Dans le dos, elle fait trois fois les dégâts.
- **Épée** : trois coups en série. Le troisième frappe une fois et demie plus fort.
- **Lance** : longue portée. L'estoc touche aussi la bête de derrière, à 70 %.
- **Hache** : fend les boucliers et la pierre (forgerons, gargouilles), et fait saigner.
- **Marteau** : l'onde du choc étourdit tout autour, à 2,2 cases, avec 30 % des dégâts.
- **Arc court** : une rafale de trois flèches.

Toutes les armes de contact forgées se **chargent** : on maintient, puis on lâche, pour un coup à ×1,5. Un simple appui frappe au lâcher.

**L'usure** : une arme tient de 2 000 à 4 000 coups selon la dureté, le bain et les plis. Usée, elle est émoussée (−40 %). On la répare à la forge (onglet Mes armes), avec de la ferraille et un peu de sa charge.

**Le code, la fiche, le partage**
- Chaque arme a son code, FG-XXXX-XXXX-XXXXX : 62 bits pour le plan, la charge, les coups, les plis, le bain, la monture et trois ingrédients hachés.
- L'identifiant de l'arme, c'est son code et sa justesse. Le jeu, et les autres joueurs, la reconstruisent d'après lui : la même forme, la même vignette, les mêmes dégâts.
- On lit un code à la forge (onglet Lire un code). Ce qu'on en lit dépend du niveau de la forge. Une ligne illisible se déchiffre avec 15 éclats.
- La fiche dit aussi **ce qu'il faut éviter** : un pli de plus, l'ordre de l'âme, l'autre bain, l'âme versée trop froide, l'os qui brûle vite, le fer damné.
- Le **carnet de forge** garde les armes forgées (combien de fois, la meilleure justesse) et les codes lus.
- **Donner** : depuis Mes armes, à un équipier à portée. L'arme part avec sa fiche, son poinçon (« forgée par… ») et son usure. Message réseau `arme`.

**Sauvegarde** : `forge` contient le niveau, les armes (usure, forgeron, nom gravé), le carnet, les codes lus et la place de la forge.

**Vérifié** :
- bâtir, monter de niveau et ouvrir la forge ; forger une dague du premier au dernier geste ;
- la dague dans le dos ×3 (0,59 → 1,77), le 3ᵉ coup d'épée ×1,5, la lance qui traverse, le saignement de la hache, l'onde du marteau, la rafale de l'arc court (3 flèches) ;
- les cinq formes de compétence ;
- l'usure qui émousse ;
- l'aller-retour de la sauvegarde ;
- un don reçu ;
- la fiche, le déchiffrage, le carnet ;
- les armes en main et les vignettes ;
- sans régression au Centre, dans les Cercles et à la surface.

**À déposer** : `forge.js` (nouveau), `index.html`, `donjon.js`, `sw.js` (qui passe en `stone-valley-138` et liste `forge.js`), `LISEZ-MOI.md`.

## §172 — La Forge (phase B) : neuf armes de mêlée, et les plans

**Les plans** : les six plans de la phase A sont connus à la forge. Les neuf nouveaux se trouvent dans les coffres d'en bas (`forgePlanCoffre(taille, src)`, appelé par `djOuvrir` et `roiOuvrir`).
- Centre : petit 6 %, gardé 25 %, grand 60 %.
- Cercles : petit 5 %, gardé 35 %, scellé 30 %.

Un plan est appris sur-le-champ et se garde même à la mort (`P.forgePlans`, sauvegardé dans `forge.plans`). À la forge, les plans manquants apparaissent grisés sous « À trouver ».

**Les armes** (forme et vignette propres ; mécaniques dans `forgeAvant`, `forgeApres` et `forgeChargeUp`) :
- **Rapière** : un estoc sur cinq porte double. La **parade** : un coup lancé moins de 0,28 s avant d'être touché annule les dégâts (`forgeSubi`, appelé dans `porterCoup`), et le coup suivant, dans les 1,5 s, est une **riposte** ×2,5 (déclencheur `riposte`).
- **Sabre** : maintenir puis lâcher donne la **fente**, une ruée de 3,5 pas qui s'arrête aux murs et à l'eau ; elle frappe ×1,8 tout ce qui est sur le trajet (`fgFente`).
- **Griffes** : chaque coup qui porte dans les 1,25 s ajoute un cran, jusqu'à 5 ; chaque cran donne +6 % de dégâts et −10 % de temps entre deux coups (getter `cad`).
- **Fléau** : balayage de 150° à 70 % ; l'élan monte jusqu'à 5 crans (+12 % de dégâts et un peu de portée par cran).
- **Espadon** : balayage à 360° à 80 %, avec une petite secousse.
- **Faux** : arc de 160° à 85 % ; +2,5 % de vie par bête touchée.
- **Hallebarde** : un balayage de 120° à 75 %, puis le **crochet** ×1,2 qui tire la bête à vous (sauf les grandes et les gardiens).
- **Bâton** : repousse fort et étourdit un instant ; la parade (0,4 s) ne laisse passer qu'un quart du coup.
- **Épée-fouet** : maintenir puis lâcher bascule la lame en **fouet** (portée 4, coups ×1,3 plus lents) qui tire les bêtes légères, ou la referme. La forme en main suit le mode.

Assistants : `fgBalayage` et `fgFrappable` (ni gardiens, ni bâtiments, ni bêtes cachées).

**Vérifié** :
- chaque mécanique, en chiffres ;
- la parade dans `porterCoup` (vie 1 → 1, contre 0,76 sans) ;
- un plan tiré d'un grand coffre du Centre, puis l'aller-retour de la sauvegarde ;
- la liste des plans à la forge ;
- les neuf armes en main ;
- pas de régression sur la phase A.

**À déposer** : `forge.js`, `index.html`, `donjon.js`, `roi.js`, `sw.js` (`stone-valley-139`), `LISEZ-MOI.md`.

## §173 — La Forge (phase C) : les armes qu'on lance et qui tirent loin ; une forge plus chaleureuse

**L'atelier, plus chaleureux.**
- **La fenêtre de la forge** : murs de briques, poutre, poteau, étagère (bocaux, livres, bougie), outils pendus, plancher, tapis, foyer de pierre avec sa hotte de cuivre et son cendrier qui rougeoie, bûches.
  - La fenêtre montre le ciel de l'île à l'heure qu'il est (jour, couchant, nuit étoilée).
  - Une lanterne est accrochée à la poutre, et des étincelles montent du foyer.
  - Une lueur chaude, qui vacille, éclaire la pièce ; la pénombre gagne les coins.
  - Une chatte rousse dort roulée en boule près du feu ; un coup de marteau lui fait lever la tête.
  - Le décor fixe est peint une fois (`fgFond`). Le style de la fenêtre passe aux tons bruns et ambrés.
- **Au campement** : foyer de briques et margelle, hotte de cuivre, cendrier rougeoyant, étincelles, tas de bûches, tabouret, panneau d'outils, lanterne sur potence, et la chatte près du foyer.
  - La nuit, le foyer et la lanterne éclairent les alentours (`forgeLueurs`, appelée par `majFeux`).

**Les cinq armes** (un plan à trouver pour chacune, comme en phase B) :
- **Chakram** : lancé, il file sur 10 pas vers sa cible et rebondit jusqu'à 3 fois de bête en bête (−12 % à chaque rebond). Il revient ensuite dans la main ; un mur le renvoie aussi. Maintenir puis lâcher : 5 rebonds, ×1,5. Tant qu'il vole, il n'est plus en main.
- **Javelots** : 3 en main. Lancés (même balistique que les flèches), ils se plantent dans le sol ou dans la bête, qu'ils suivent. Maintenir puis lâcher, ou attaquer la main vide, les rappelle :
  - un javelot planté dans une bête en est arraché (×0,5) ;
  - au retour, il frappe ce qu'il traverse (×0,7).
  
  S'il n'y a rien à rappeler (javelots perdus en changeant d'île), les trois reviennent « de loin ».
- **Arc long** : flèches 25 % plus rapides ; bandé à fond, la flèche traverse jusqu'à 3 bêtes.
- **Arbalète** : carreaux 45 % plus rapides, qui repoussent. Si un mur ou un tronc se trouve à moins d'un pas et demi derrière la bête, elle y est **clouée** : étourdie 3 s, ×1,5. Les gestes, les sons et la pose sont ceux de l'arbalète à poulies (`armeBase` partout où l'arbalète était testée par son id).
- **Fronde** : les billes rebondissent 3 fois sur le sol et les murs, et ricochent vers la bête la plus proche (−15 % à chaque ricochet). Maintenir puis lâcher : 3 billes en éventail. Pas de munitions.

**Technique.**
- Les projectiles lancés vivent dans `FG.projs` : mis à jour par `fgMajProjs` (dans `forgeMaj`), dessinés par `forgeEmit` (dans `emitFleches`), effacés au changement d'île.
- `coupArme` passe la main à `forgeLance`. La flèche reçoit `perce`, et `tirerFleche` la vitesse `vK`.

**Vérifié** :
- les chiffres de chaque mécanique (rebonds du chakram et son retour ; javelot planté, arraché, rappelé ; ricochet de la fronde et éventail ; traversée de l'arc long ; recul et clouage de l'arbalète) ;
- les armes en main ;
- la fenêtre de la forge ;
- la forge au campement, de jour et de nuit ;
- pas de régression sur les phases A et B, ni sur les coffres.

**Pas vérifié** : les autres joueurs ne voient pas les projectiles lancés (seuls leurs effets sur les bêtes passent).

**À déposer** : `forge.js`, `index.html`, `sw.js` (`stone-valley-140`), `LISEZ-MOI.md`.

### §173 bis — Correctif : la case Forge
La case **Forge** manquait dans Campement → Camp : `modforge` n'était pas dans la liste `CASES_VOLET.camp`. Elle est maintenant placée entre la table d'alchimie et la bibliothèque. Le texte de l'établi cite aussi la forge parmi les modules. `sw.js` passe en `stone-valley-141`.

## §174 — La Forge (phase D) : les armes de mage
Quatre plans de plus dorment dans les coffres du Centre et des Cercles (`FG_PHASE = 'D'`). Ces armes lancent **la phrase tenue en main** (volet Magie : « Tenir »), payée en éclats du sac, avec le délai de la phrase. Le grimoire, les tomes, les accords et l'instabilité restent ce qu'ils sont.
- **La focale** : les dégâts de l'arme divisés par ceux de son type (ce que la forge y a mis : alliage, plis, justesse, usure). Elle multiplie les sorts lancés par l'arme. La fiche l'affiche : « les sorts ×1,38 ».
- **L'âme de l'arme** s'ajoute au sort comme à un coup : son déclencheur (chaque, série, charge, dos, tuer, riposte) est testé sur chaque bête touchée, six au plus (`forgeSortTouche`, appelé à la fin de `toucherSort`).
- Chaque sort lancé use l'arme d'un point et compte dans la série.
- **Sans phrase en main**, l'arme frappe (faiblement) et le dit. Si le sort n'est pas prêt ou si le mana manque, elle frappe aussi.

**Les quatre armes** :
- **Bâton de mage** : un appui lance la phrase. Maintenir puis lâcher la grossit, en trois paliers (0,5 s, 1 s, 1,6 s) :
  - dégâts ×1,6 / ×2,2 / ×3 ; ampleur ×1,15 / ×1,3 / ×1,5 ; prix ×1,5 / ×2 / ×3 ;
  - chaque palier s'entend, le cristal gonfle et la lueur converge vers vous ;
  - s'il manque des éclats, le plus haut palier qu'on peut payer part ;
  - le trait grossi se voit plus large et luit (`f.gros`, dans les deux rendus).
- **Baguette** : la phrase coûte 6 dixièmes du prix, se relance 3 fois plus vite (délai ×0,35), et frappe à ×0,7. Maintenir : la rafale, au rythme du délai (0,3 s au moins). Elle s'arrête au lâcher, ou quand le mana manque.
- **Orbe** : un trait, une onde ou un piège se posent en sphère, qui tourne autour de vous (3 au plus, 25 s). Le délai est réduit de moitié.
  - Après 0,8 s, la sphère part seule vers la bête **qui vous menace** (`beteHostile`) à moins de 10 pas, et vire pour la suivre.
  - Un trait ou un piège frappent la bête. Une onde éclate en anneau de 2,6 pas autour d'elle.
  - Maintenir puis lâcher, ou un appui quand trois sphères tournent : **la salve**. Toutes partent, vers la bête visée d'abord, même une bête paisible.
  - Le mur et l'égide partent tout de suite, comme d'habitude.
- **Lame runique** : une épée. Chaque coup qui porte remplit ses runes (15 %, 30 % chargé ; 5 runes s'allument sur la lame). Pleine, elle le dit et luit. Le coup chargé suivant **libère** :
  - avec une phrase en main, elle part sans mana ni délai, ×1,6 et la focale, et l'âme de la lame touche sûrement (×1,5) ;
  - sans phrase, l'âme éclate à 3 pas autour de vous (×1,6 et son élément).
  
  Laissées 10 s sans coup, les runes s'éteignent doucement.

**Technique.**
- `forgeLance` passe la main à `fgMagie` ; `fgLancerPhrase` reprend `lancerPhrase` avec ses facteurs.
- Les sphères vivent dans `FG.projs` (`fgOrbe`).
- `forgeOs` décrit en tronçons tous les projectiles forgés. `forgeEmit` les dessine sans carte graphique, et le rendu WebGL les dessine maintenant aussi : **le chakram, les javelots et les billes n'y étaient pas visibles** (oubli de la phase C, corrigé).
- Les os du héros acceptent `lum` (ce qui luit de soi-même), dans les deux rendus : le cristal du bâton, la pointe de la baguette, la sphère de l'orbe, les runes.

**Vérifié** (navigateur sans écran, aucune erreur) :
- bâton : l'appui (prix normal), le palier III (prix ×3, la bête abattue, la compétence « sur un coup chargé » déclenchée) ;
- baguette : la rafale (dix traits en trois secondes, trois éclats chacun) ;
- orbe : deux sphères qui tournent sans bête, puis qui partent seules quand une bête menaçante arrive ;
- lame runique : les runes pleines en sept coups, la libération sans phrase (l'âme éclate, la bête brûle) et avec une onde (zéro éclat) ;
- les quatre armes en main, les sphères et les traits grossis dans le rendu WebGL.

**Pas vérifié** : les autres joueurs ne voient pas les sphères de l'orbe (les traits, les ondes et leurs effets passent comme avant).

**À déposer** : `forge.js`, `index.html`, `sw.js` (`stone-valley-142`), `LISEZ-MOI.md`.

## §175 — La Forge (phase E) : les armes à feu
Les cinq derniers plans dorment dans les coffres du Centre et des Cercles (`FG_PHASE = 'E'` : les 29 armes sont là, et la forge ne dit plus « … plans viendront »).
- **Pas de munitions** : on recharge. Le temps de recharge est le « cad » de l'arme. La forge le règle : un alliage lourd recharge plus lentement. La fiche l'affiche (« recharge 2,8 s · sans munitions »).
- La recharge part seule quand l'arme est vide. Si l'arme a été entamée puis laissée 2 s, elle part aussi, et elle est plus courte. Tirer interrompt une recharge entamée.
- Le bandeau montre les coups en main (« CHARGÉ ●○ », « BARILLET ●●●○○○ ») ou la recharge en cours.
- Les armes à feu prennent le geste, la pose (épaulée au tir, à la hanche en garde) et la bretelle des fusils du Centre. `djEstFusil` les reconnaît par `forgeFeu`.
- Le tir est un trait (`djVisee`, `djRayon`), avec la flamme de bouche et la fumée. La visée est la même que pour les fusils du Centre : la bête désignée, sinon celle qui est devant.
- L'âme de l'arme agit à l'impact, comme pour une flèche. Le dernier coup avant la recharge compte comme un coup chargé.

**Les cinq armes** :
- **Pistolet à silex** : une paire. Deux coups forts (main droite, puis gauche), puis on recharge les deux, longuement (2,6 s de base). Les chiens s'abattent à chaque coup.
- **Tromblon** : 9 plombs en cône (±0,3 rad), portée 7,5 pas. Chaque plomb pèse ×0,24, moins de loin ; les plombs s'additionnent sur une même bête, qui est rejetée. Le tireur est repoussé (environ 1,7 pas). Un coup, puis 2 s de recharge.
- **Mousquet** : portée 32 pas, aucun écart. La balle traverse jusqu'à 3 bêtes. Un gros nuage de fumée, puis 3,2 s de recharge.
- **Revolver** : 6 coups, un toutes les 0,2 s. Maintenir les enchaîne. Puis on recharge le barillet (2,4 s). Les 6 chambres se vident sur l'arme.
- **Canon à main** : l'obus part à 55° et retombe sur la bête visée (ou à 10 pas devant). Un cercle au sol, qui bat de plus en plus vite, montre où il tombera. Il éclate au premier contact, à 2,6 pas : ×1 au centre, ×0,4 au bord, et les bêtes sont rejetées. Il ne blesse pas le tireur. Le tireur est repoussé. 3,6 s de recharge.

**Technique.**
- `forge.js` : `FG_FEU` (les réglages), `forgeTirDown` / `forgeTirUp` (appelés par `djTirDown` / `djTirUp`), `fgTirFeu`, l'obus (`fgLancerObus`, `fgObus`, `fgEclat`, dans `FG.projs`), `forgeHud` (ajouté à `djHud`), `fgGeomFeu` (l'arme en main, sur le cadre des fusils du Centre).
- `donjon.js` : `djEstFusil` reconnaît les armes à feu forgées. `djPoseFusil` prend leur recul ; les armes longues s'épaulent comme le fusil d'arpenteur. `djTirDistant` montre le coup des autres joueurs (pour le canon : le bruit et la fumée).
- `index.html` : l'arme à feu forgée n'a pas de carquois, seulement la bretelle.
- Le recul pousse le joueur sans frottement un court instant (`P.recul`).

**Vérifié** (navigateur sans écran, aucune erreur) :
- pistolet : deux coups, la bête abattue, la recharge, puis « CHARGÉ ●● » ;
- tromblon : la gerbe sur la première bête, le recul de 1,75 pas ;
- mousquet : trois bêtes en ligne touchées, pas la quatrième ;
- revolver : maintenu, il vide le barillet, puis recharge ;
- canon : l'obus monte à près de 15 pas de haut, puis éclate (deux bêtes touchées, moins celle du bord) ;
- les icônes et les formes des 29 armes ; la pose épaulée identique à celle du rayon de sentinelle.

**Pas vérifié** :
- sans carte graphique, le trait de la balle ne se dessine pas (comme pour les fusils du Centre) : on voit la flamme, la fumée et l'impact ;
- la fenêtre de la forge avec les 29 plans (seulement la liste, par le code).

**À déposer** : `forge.js`, `donjon.js`, `index.html`, `sw.js` (`stone-valley-143`), `LISEZ-MOI.md`.

## §176 — La fenêtre de la Forge au téléphone
Au téléphone, la fenêtre était mal agencée :
- debout, il fallait descendre de 1 700 pixels sous la liste des plans pour trouver la pièce et ses gestes ;
- les onglets s'empilaient et poussaient la croix de fermeture hors de l'écran ;
- couché, les boutons étaient coupés en bas et la recette se trouvait tout au fond.

**Au téléphone** (largeur ≤ 640 px, ou hauteur ≤ 500 px) :
- **La fenêtre prend tout l'écran**, opaque, en respectant les bords arrondis et l'encoche (`safe-area`).
- **L'en-tête reste fixe** et seul le corps défile : la croix est toujours à portée.
- **Les plans forment un bandeau horizontal** de vignettes (icône et nom) qu'on fait glisser du doigt. Le plan choisi se place au milieu, et sa description s'affiche juste dessous.
- **Pendant le travail**, le bandeau disparaît (on ne peut pas changer de plan en cours de route) : la pièce et ses gestes montent en haut.
- **Debout** :
  - l'en-tête tient sur trois lignes (le titre et la croix, les onglets, les réserves) ;
  - puis une seule colonne : le bandeau, la pièce (toute la largeur), la jauge, les gestes, la recette.
- **Couché** :
  - la pièce et sa jauge restent à gauche, toujours visibles ;
  - à droite défilent le bandeau, les gestes et la recette.
- **Des cibles plus grandes au doigt** : les boutons font au moins 44 px de haut, et les « − / + » de la charge 42 × 38 px.

**Le toucher.**
- Les gestes qui demandent du tempo partent dès qu'on touche l'écran, comme avant : le soufflet, la meule, frapper, plier, sortir du bain, plonger, sur l'enclume, au feu, la charge.
- Tous les autres (choisir un plan, les onglets, réparer, donner, déchiffrer, les ingrédients d'âme, le bain, la monture, finir) partent **au clic**. Un doigt qui fait défiler la liste ne déclenche donc plus rien par mégarde.

L'ordinateur garde sa mise en page : la pièce est seulement enveloppée dans un `.fg-vue`, sans aucun changement visible.

**Vérifié** (navigateur sans écran, en 390 × 844 et 844 × 390, en simulant le toucher) :
- la charge, le feu, l'âme, les onglets Mes armes, Lire un code et Carnet ;
- un vrai toucher sur un plan et sur « + » ;
- la mise en page de l'ordinateur, inchangée ;
- aucune erreur.

**À déposer** : `forge.js`, `index.html`, `sw.js` (`stone-valley-144`), `LISEZ-MOI.md`.

## §177 — La Forge : le Korlaz, les pigments, l'affûtage revu
**Le Korlaz dans la charge.**
- Une sixième ligne s'ajoute à la charge : **Korlaz**. Une dose au plus, qui coûte 12 spores de Korlaz (celles que rapporte la roche rongée).
- La dose ne compte pas dans les deux à quatre portions et ne change pas l'alliage, qu'elle assombrit seulement.
- Elle loge dans la lame **une ombre** : tant qu'on tient l'arme en main, l'ombre est là.
  - **Son allure** : une petite bête sombre qui flotte derrière l'épaule gauche. Elle a une tête aux oreilles pointues et deux yeux violets qui luisent (rouges à l'assaut). Ses pattes sont griffues, sa queue faite de quatre lambeaux de fumée qui ondulent, et elle perd sans cesse des volutes sombres piquées d'étincelles violettes.
  - **Au combat** : quand une bête vous menace à moins de 8 pas (ou celle que vous avez désignée), l'ombre fond sur elle à 16 pas par seconde. Elle la frappe 6 fois, en bondissant chaque fois d'un autre côté (l'angle d'or : jamais deux fois au même endroit), avec un sillage violet et une griffure en travers. Puis elle revient et souffle 1,8 s.
  - **Ses dégâts** : chaque coup vaut 12 % des dégâts de l'arme. Une bête qu'elle abat donne son butin, comme les vôtres.
  - **Intouchable** : ce n'est pas une bête. Ni les bêtes ni les joueurs ne peuvent la viser ni la toucher.
  - Les autres joueurs voient l'ombre flotter près de vous, mais pas ses assauts.

**Les pigments de l'Achromie** (ils étaient « gardés pour plus tard »).
- À la monture, on peut poser un pigment, ou rien. Il part dans l'arme quand on la finit.
- Il donne à l'arme **son aura** :
  - le fil de la lame prend la couleur du pigment, et luit dès le rang 2 ;
  - des lueurs s'échappent de l'arme, en main ou rangée : 5 par seconde au rang 1, jusqu'à 22 au rang 5, avec des éclats clairs dès le rang 4 ;
  - la nacre prismatique passe par toutes les couleurs.
- Il donne aussi **sa traînée** : le sillage des coups prend sa couleur, luit, et dure et s'élargit avec le rang. La nacre y fait courir l'arc-en-ciel. Le trait d'une arme à feu teintée prend sa couleur, plus large et plus long.
- Chacun des 21 pigments a sa teinte : cinabre, garance, lapis-lazuli, malachite…
- La fiche, la description et le bilan le disent.

**Le code des armes.** Le Korlaz et le pigment passent dans le code (dans des bits libres, puis dans un 14ᵉ signe si besoin). Une arme d'avant garde son code de 13 signes et son identifiant, inchangés. Un code de 14 signes se lit aussi à la forge.

**L'affûtage, revu.** Il marchait mal : la lame dérivait à peine, et ◀ ▶ l'accéléraient sans la freiner. Mieux valait ne rien toucher qu'agir.
- **La meule tire la lame** d'un côté puis de l'autre, avec une force qui change sans cesse, un peu plus faible que la main.
- **◀ ▶ (ou ← →) la poussent aussitôt**, et elle s'arrête quand on lâche.
- **Le fil ne se fait que dans le vert** : il faut y tenir la lame 2,6 s en tout, 8 s au plus. Hors du vert, la faute grandit avec l'écart, jusqu'à −18.
- La grande jauge sous la pièce devient la bande de la meule pendant l'affûtage. Elle montre la zone verte, la lame, le pourcentage du fil et un conseil (« elle part à gauche : ▶ »). Les deux boutons sont larges.

**Vérifié** (navigateur sans écran, aucune erreur) :
- les codes : une arme d'avant garde le même code et le même nom ; le Korlaz et les pigments 3, 17 et 21 font l'aller-retour, sur 13 ou 14 signes, et se relisent au clavier ;
- la dose (une au plus, hors des portions, 12 spores au coût) ;
- l'ombre : au repos, puis l'assaut complet (fondre, six bonds, revenir) sur une bête menaçante ;
- l'aura et la traînée (cinabre) ;
- l'affûtage : sans les mains, −18 ; avec un pilote qui ramène la lame au vert, aucune faute ;
- au téléphone, le choix du pigment au doigt, puis le pigment consommé à la fin.

**À déposer** : `forge.js`, `index.html`, `sw.js` (`stone-valley-145`), `LISEZ-MOI.md`.

## §178 — Le Korlaz : l'ombre à distance, les griffes au contact, la lame qui fume
La dose de Korlaz ne fait plus la même chose selon l'arme. La forge l'annonce dès la charge ; la fiche et le bilan le disent aussi.
- **Les armes à distance** (arcs, arbalète, chakram, javelots, fronde, armes à feu, bâton de mage, baguette, orbe) gardent **l'ombre** du §177. Les armes de contact n'en ont plus.
- **Les armes de contact** (toutes les autres, la lame runique comprise) **griffent** :
  - **Quand** : à chaque coup, même dans le vide, la cible est lacérée. C'est la bête désignée, ou celle que le jeu montre en haut de l'écran. Elle doit être à moins de 12 pas : de loin, ou en plus du coup quand on la touche.
  - **L'image** : trois grandes lacérations noires, parallèles, tracées en diagonale en travers de la bête (en 0,16 s), avec un fil violet au cœur. Elles sont fines aux deux bouts, larges au milieu, et à la taille de la bête.
  - **Le sens** : elles vont **vers la droite, puis vers la gauche** au coup suivant, et ainsi de suite.
  - **Les dégâts** : 40 % de ceux de l'arme, en une fois. Une bête abattue ainsi donne son butin.
  - Les compagnes, les villageois et les bêtes apprivoisées ne sont jamais griffés.
- **Toute arme au Korlaz perd des particules noires par la lame**, en main comme rangée : 22 par seconde, quelques-unes d'un violet qui luit. Elles naissent sur les tronçons de la lame, et montent en se dissipant.

**Vérifié** (navigateur sans écran, aucune erreur) :
- épée au Korlaz, cible désignée à 6 pas : chaque coup la griffe (−12 % de vie), le sens alterne, et aucune ombre ne vient ;
- l'arc court au Korlaz : l'ombre, et pas de griffes ;
- les trois lacérations, de près ;
- la lame qui fume.

**À déposer** : `forge.js`, `sw.js` (`stone-valley-146`), `index.html` (seulement le numéro de version), `LISEZ-MOI.md`.

## §179 — La Forge (phase F) : l'équilibrage
**Le banc d'essai.** Les 29 armes ont été mesurées dans le jeu lui-même (le monde avancé pas à pas, sans attendre l'écran), dans les mêmes conditions :
- **l'arme** : forgée « acier de pierre » (2 ferraille + 1 pierre), 12 coups, 2 plis, trempe à l'eau, monture de bois, justesse 85 %, sans âme ;
- **les cibles** : trois Cotonniers figés, dont la vie est remise à neuf à chaque pas ;
- **les deux mesures** : une seule bête (au contact, ou à 7 pas pour les armes à distance), puis trois bêtes groupées ;
- **le tir** : l'appui est répété dès que l'arme est prête ; les arcs sont bandés à fond ; le sort tenu est un trait de braise.
- **l'unité** : la vie d'un Cotonnier ôtée par seconde, à l'exploration 1.

**Ce que le banc a trouvé.**
- **Un vrai défaut des armes à feu** : vide, une arme pouvait encore tirer pendant un quart de seconde, à chaque image (le mousquet faisait 98, le canon 90). Pire, le revolver tenu ne rechargeait jamais. Désormais, une arme vide ne tire plus ; la recharge part dès le dernier coup et lâche la gâchette du revolver.
- **Le bâton de mage tapé faisait moins qu'un sort lancé à mains nues** (0,64 contre 0,74). Le sort attendait le milieu du geste, et un sort pas encore prêt faisait frapper le bâton à vide. Maintenant :
  - le sort du bâton, de la baguette et de l'orbe part **au lâcher** ;
  - un appui avant que la phrase soit prête ne fait rien (« encore 0,4 s »), au lieu de gâcher un geste ;
  - le bâton bat un peu plus vite (0,4 s).
- **L'usure était injuste** : une arme rapide s'émoussait cinq fois plus vite qu'une lente (les griffes en 8 min de combat, le marteau en 43). Chaque arme a maintenant son coefficient `us` (0,6 à 3,6), qui multiplie les coups qu'elle encaisse. Toutes tiennent environ 30 minutes de combat continu. Le bilan de la forge dit donc plus de coups pour une dague que pour un marteau.

**Les réglages** (`FG_TYPES`) :
- **Contact** :
  - lance 0,6 → 0,68 ;
  - bâton 0,45 → 0,48 ;
  - épée-fouet 0,6 → 0,64 ;
  - lame runique 0,62 → 0,7 ;
  - griffes 0,32 → 0,29 ;
  - fléau 0,85 → 0,8, son balayage ×0,7 → ×0,55, et chaque élan +12 % → +9 %.
- **Distance** :
  - arc court 0,55 → 0,48 (la rafale reste) ;
  - arc long 1,05 → 1,15 ;
  - chakram 0,62 → 0,95 ;
  - javelots 0,85 → 0,76 ;
  - fronde : chaque ricochet perd 25 % au lieu de 15 %.
- **Magie** : la baguette frappe à ×0,55 au lieu de ×0,7.
- **Poudre** :
  - pistolet : 1,5 de dégâts, 2,2 s de recharge ;
  - tromblon : plombs ×0,3, 1,7 s ;
  - mousquet : 2,4 et 2,6 s ;
  - revolver : 0,7 et 2 s ;
  - canon : 2,6 et 3 s.

**Après** (une bête · trois bêtes) :
- **Contact, une cible** : griffes 2,5 · épée 1,9 · rapière 1,8 · dague 1,8 (×3 dans le dos) · sabre 1,8 · hache 1,6 (+ saignement) · lame runique 1,6 · épée-fouet 1,4 · bâton 1,3 · lance 1,3 (1,4 en ligne).
- **Contact, de zone** : marteau 2,2 · 3,6 ; fléau 1,9 · 3,4 ; espadon 1,5 · 4,0 ; faux 1,3 · 3,4 (+ vie) ; hallebarde 1,5 · 2,6.
- **Distance** : javelots 1,7 · arbalète 1,7 · revolver 1,6 · arc court 1,5 · arc long 1,4 · pistolet 1,4 · fronde 1,2 · 2,8 · chakram 1,1 · 2,0 · mousquet 1,2 (traverse trois bêtes) · canon 0,8 · 1,6 (à 10 pas) · tromblon 1,2 à 3 pas, 0,6 à 5 pas (de près, c'est l'arme la plus vive).
- **Magie, sort de cristal** : bâton 0,86 et baguette 1,34, contre 0,70 à mains nues. Le bâton dépense le même mana, la baguette 1,55 fois plus. Le bâton chargé triple ses dégâts.
- **Les armes d'ailleurs, pour comparer** : épée de pierre 1,4 · lame d'éclat 2,1 · marteau-pilon 2,7 · arc 0,8 · arbalète à poulies 1,1 · lame de soufre (le Roi) 2,1 · fouet de chaînes (le Roi) 0,8 · rayon de sentinelle (le Centre) 0,7 · fusil d'arpenteur (le Centre) 0,7 à 7 pas.

Une arme forgée moyenne vaut donc une arme de base d'un rang au-dessus. Un bon alliage (de l'éclat) et un chef-d'œuvre la portent au-delà de la lame d'éclat et de la lame de soufre, d'environ 15 %.
- **Le Korlaz** : les griffes seules, à 6 pas, valent 0,8 ; au contact, elles ajoutent 37 % à l'épée. L'ombre ajoute 10 % à l'arc court.

**La charge coûte un peu plus** :
- ferraille 8 → 12 par portion ;
- pierre 10 → 14 ;
- os 6 → 9 ;
- éclat 6 → 9.

Le fer damné et le Korlaz ne changent pas. Une arme de trois portions coûte ainsi 35 à 40 ressources, avec la monture : moins qu'une lame d'éclat (76), pour mieux, mais il faut la forger.

**Les plans sont plus rares** :
- au Centre : petit coffre 6 % → 3,5 %, coffre du gardien 25 % → 16 %, grand coffre 60 % → 45 % ;
- aux Cercles : 5 % → 3 %, 35 % → 22 %, scellé 30 % → 25 % ;
- au tirage, les plans de magie pèsent 0,7 et ceux de la poudre 0,55 (contre 1 pour les autres) : ils se font attendre.

Selon le nombre de coffres, il faut compter à peu près une dizaine de descentes pour les 23 plans, au lieu de cinq.

**Vérifié** : les deux passes du banc (avant, après), sans erreur ; les armes de mage (le banc, et les essais du §174).

**À déposer** : `forge.js`, `sw.js` (`stone-valley-147`), `index.html` (le numéro de version), `LISEZ-MOI.md`.

## §180 — Des vignettes pour les pigments, les graines et les plants
**Les pigments ont leur vignette**, comme les ingrédients.
- **Le dessin** : un godet de terre, un tas de poudre à la couleur du pigment (chacun des 21 a sa teinte) et deux grains tombés à côté. Au rang 3, un éclat brille ; au rang 4, une étoile ; au rang 5, la lèvre du godet est dorée. La nacre prismatique fait un tas en bandes de toutes les couleurs.
- **Au sac** : ils ont leur rangée, « Pigments », sous les graines et plants. Chaque vignette est bordée de sa rareté, avec son nombre et son nom.
- **Ailleurs** : on les retrouve au Journal (carnet des pigments), et à la forge pour le choix du pigment à la monture.
- `icPigment('rouge:3')` donne `pig_rouge_3`, et `rareIcone` lit la rareté dans le nom de la vignette.

**Les graines, les plants et les boutures récoltés ont leur vignette dans les petits gains.**
- Au sac, elles en avaient déjà une ; mais le petit « +1 » qui monte au-dessus du personnage, et le journal des gains, ne savaient pas la trouver d'après le nom (« plant de bouleau », « graine de lys d'écume »…). Le texte restait donc sans image.
- `gainIcone` connaît maintenant tous ces noms, et ceux des pigments. Il sait aussi lire « pigment : cinabre (rare) ».

**Vérifié** (navigateur sans écran, aucune erreur) : la rangée des pigments au sac ; les vignettes des petits gains pour un plant, une graine rare, une graine commune, un pigment, la nacre.

**À déposer** : `index.html`, `achromie.js`, `forge.js`, `sw.js` (`stone-valley-148`), `LISEZ-MOI.md`.

## §181 — Le sac, refait : plus chaleureux, rangé, et l'appui long
**L'allure** (tout le sac, tous ses onglets) :
- **Des tons de cuir et de bois** : un brun profond, une lueur ambrée dans les coins, le rail plus sombre, un texte crème, l'or un peu plus chaud. Les survols, les sélections, les boutons, les jauges et les champs de saisie suivent : plus aucun bleu froid.
- **Les titres de catégorie sont plus grands** : 15,5 px au lieu de 12, en gras, crème doré.
- **Sur la page Sac**, chaque titre a sa vignette (la tunique, la ceinture, les baies, le bois, l'établi, le plat, le carré, la nacre) et un compte en pastille.

**La page Sac, rangée en cartes** (aux coins arrondis, à peine éclairées) :
- **à gauche, ce qu'on porte et ce qui sert tout de suite** : Sur vous (huit emplacements, quatre par ligne), Cases du bord droit, Réserves, Matières ;
- **à droite, ce qu'on a** : Objets, Soins, Plats, Garde-manger, Graines et plants, Pigments.

Les longues notes sont devenues une ligne chacune.

**La fiche de l'objet choisi est dans un tiroir**, en bas de la page, toujours en vue.
- Avant, elle était sous la grille des objets : au téléphone, il fallait descendre la chercher. Maintenant :
  - sur ordinateur, les deux colonnes défilent au-dessus du tiroir ;
  - au téléphone, le tiroir reste collé en bas, plus compact (la description en trois lignes).
- Une croix le ferme. Quand rien n'est choisi, il tient en une ligne : « Touchez un objet : il s'affiche ici · appui long sur une vignette : ce qu'elle est ».

**L'appui long** (une demi-seconde, au doigt ou à la souris) sur n'importe quelle vignette du sac ouvre une bulle :
- **Son contenu** : la vignette en grand, le nom à la couleur de sa rareté, sa sorte, ce qu'elle fait, et quelques lignes.
  - **Objets** : dégâts, portée, cadence ou recharge, niveau, récolte, protection, porté ou non.
  - **Denrées** : rareté, sorte, effet en cuisine, se mange cru ou non, combien au sac.
  - **Graines et plants** : la plante, la taille d'emplacement, combien au sac.
  - **Pigments** : à quoi ils servent.
  - **Matières** : où les trouver, au sac et au coffre.
  - **Réserves**, **plats**, **soins**, **emplacements vides**.
  - **Ailleurs dans le sac** (Fabrication, Compagnes…), la bulle dit au moins le nom.
- **Son comportement** :
  - la vignette s'enfonce un peu pendant qu'on appuie, puis une petite vibration au téléphone ;
  - la bulle reste quand on lève le doigt, jusqu'au prochain appui ou au défilement ;
  - **l'appui long ne choisit, ne mange et ne sème rien** ; le menu du navigateur ne s'ouvre pas.

**Vérifié** (navigateur sans écran, ordinateur 1100 × 720 et téléphone 390 × 844, au toucher et à la souris, aucune erreur) :
- la page Sac, avec et sans objet choisi ;
- les onglets Fabrication, Campement et Réglages ;
- l'appui long sur une denrée (la bulle, et elle n'est pas mangée), un pigment, une matière.

**À déposer** : `index.html`, `sw.js` (`stone-valley-149`), `LISEZ-MOI.md`.

## §182 · Les grimoires deviennent des arcanes, à trouver

L'emplacement **Grimoire** n'existe plus. Les cinq anciens grimoires (Souffle, Ancrage, Appel, Aube, Abîme) ne se fabriquent plus à l'établi : ce sont des **arcanes**, qu'on apprend d'un **tome trouvé**, déchiffré au **pupitre de la bibliothèque** comme les tomes de matière.

**Où trouver les tomes** :
- **Lutrin noirci** : une île sur quatre en a un, dès l'exploration 3 (Souffle, Ancrage ou Appel). Il est marqué sur la carte comme les autres lutrins ; ACTION pour le recopier.
- **Coffres gardés** : un grand coffre du Centre (30 %) ou un coffre scellé des Cercles (15 %) peut en contenir un (Souffle, Ancrage, Appel ou Aube).
- **Tome de l'Aube** : la première fois qu'on repose le prisme d'une île d'Achromie.
- **Tome de l'Abîme** : le reliquaire des Ossuaires (troisième cercle du Roi), à la place de l'ancien Bâton de l'Abîme.
- Un tome recopié est **gardé même à la mort**.

**Déchiffrer** : au pupitre, section « Arcanes rapportés ». Cela coûte des éclats (20 à 40), puis l'arcane est appris pour de bon. Le carnet du pupitre liste les arcanes.

**Lancer un arcane** : volet **Grimoire** du sac, section **Arcanes**.
- **Tenir (L)** : l'arcane va dans la case bonus du bord droit ; on le lance d'un appui ou avec la touche L, comme une phrase tenue en main.
- **Cases 1 à 5** : on peut aussi le ranger dans une case de la ceinture.
- La même section dit quels tomes attendent au pupitre, et où chercher ceux qui manquent.

**Les anciennes parties** : un grimoire déjà fabriqué ou trouvé reste appris, et celui qui était équipé reste en main.

**Vérifié** (navigateur sans écran, ordinateur 1100 × 720 et téléphone 390 × 780, aucune erreur) :
- plus d'emplacement Grimoire au sac, plus de grimoire à l'établi ;
- un lutrin d'arcane : LIRE, puis RECOPIÉ ;
- le pupitre : déchiffrer, les éclats payés, l'arcane appris ;
- le volet Grimoire : Tenir, ranger dans une case, lancer le Souffle depuis la case ;
- un coffre qui donne un tome (tirage forcé) ;
- la sauvegarde garde les tomes recopiés.

**Pas vérifié en jeu** : le tome dans un vrai coffre du Centre ou des Cercles, au reliquaire des Ossuaires, et au prisme d'Achromie (le code est relu, pas joué).

**À déposer** : `index.html`, `donjon.js`, `roi.js`, `trone.js`, `achromie.js`, `sw.js` (`stone-valley-150`), `LISEZ-MOI.md`.

## §183 · L'appui long dit tout : armes, plats, sorts

La bulle de l'appui long, au sac, donne maintenant tous les chiffres.

**Objets** : les mêmes lignes que la fiche du sac.
- **Armes** : dégâts, portée ou tir, cadence (recharge pour une arme à feu), flèches en réserve pour l'arc. Pour l'arme portée, les dégâts **avec vos effets** (plat de coups puissants, potion de force).
- **Armes forgées**, en plus :
  - le type et sa mécanique ;
  - la **compétence**, lisible si on a forgé l'arme ou déchiffré sa ligne ;
  - le **Korlaz** (l'ombre ou les griffes) ;
  - l'**aura** (le pigment) ;
  - l'usure, la facture et le forgeron ;
  - pour une arme magique, ce qu'elle fait aux sorts.
- **Armures, outils, soins, ceinture, arcanes** : leurs chiffres (dégâts reçus, coût des sorts, récolte, vie rendue, coût de l'arcane…).

**Plats** :
- vie rendue, souffle rempli ;
- régénération (par seconde, et combien de temps) ;
- l'effet, sa puissance (I à IV) et sa durée ;
- **ce qu'il fait concrètement**, par exemple « +70 % de dégâts à vos coups », « −50 % de dégâts reçus », « on voit à 11 cases dans le noir » ;
- les parts, et les ingrédients quand la recette est connue.

**Denrées** : la vie rendue crue, et environ ce qu'elles valent cuisinées.

**Sorts** (dans les cases du bord droit au sac, et au volet Grimoire) :
- dégâts, coût, délai de relance ;
- rayon de l'onde, durée du mur et de l'égide, nombre de pièges ;
- avec une arme magique en main, ses dégâts lancés par elle ;
- l'instabilité d'un accord ;
- ce que font la forme, la matière et l'accent.

**La bulle** : un peu plus large. Les lignes longues prennent toute la largeur, et la bulle défile si elle dépasse l'écran.

**Vérifié** (navigateur sans écran, ordinateur 1100 × 720 et téléphone 390 × 780, aucune erreur) : la bulle d'une arme forgée, d'un bâton de mage, d'un arc, d'une armure, d'un plat à effet, d'un sort en case et de l'égide au volet Grimoire. Le vrai appui long sur un sort affiche la bulle.

**À déposer** : `index.html`, `forge.js`, `sw.js` (`stone-valley-151`), `LISEZ-MOI.md`.

## §184 · Le Vyrel : l'île infectée

Un nouvel état d'île, dans un nouveau fichier `vyrel.js`. **Le Vyrel** : une île sur dix environ, dès l'exploration 7, jamais sur l'île d'une Tisseuse. Il est branché dans `etats.js`, `faune.js`, `forge.js` et `index.html`.

**L'île** :
- **Le décor** : l'image jaunie et violacée, le ciel et la brume violets, un bord d'écran violet.
- **Les miasmes** couvrent toute l'île : un fond léger partout, plus épais dans les creux et autour des charniers. Des volutes violettes dérivent au ras du sol.
- **Les charniers** (trois à cinq, toujours aux mêmes places pour une même graine) : un tertre de terre noire, des côtes, des carcasses, un crâne, une mare violette qui bout. Les miasmes en montent.

**Les bêtes** (toutes celles de l'île, sauf compagnes, automates, flore, nomades) :
- **Leur aspect** : la robe ternie, les yeux pâles qui luisent, des pustules violettes, des mouches autour d'elles, une toux.
- **Leur comportement** : elles foncent sur qui passe à moins de huit cases (vous, vos compagnes), même les herbivores.
- **Leurs forces** : 15 % plus lentes, 30 % plus dures à abattre.
- **La morsure** contamine.
- **À leur mort**, elles crèvent en un nuage de miasme.
- On ne peut ni les nourrir pour les apprivoiser, ni leur lancer le lien.

**L'exposition, puis la maladie** :
- **L'exposition** monte dans les miasmes, d'autant plus vite qu'ils sont épais. Une morsure en ajoute d'un coup. Tout près d'un joueur malade, on s'expose aussi. À 100 %, on est malade.
- **Ce qui protège** :
  - le **masque à bec** (établi niveau 2 : 16 fibres, 6 os, 4 pierres ; il se porte comme accessoire, à la place du sifflet) divise l'exposition par trois, et il se voit sur le personnage (face de cuir, verres violets, bec d'os), y compris pour les autres joueurs ;
  - la lanterne allumée (×0,75), le feu du campement (×0,3), le plat antidote (×0,5).
- **La maladie suit le joueur d'île en île**, en trois stades (à la contagion, à dix minutes, à vingt-cinq) :
  - la vie ne remonte plus au-delà de 85 %, 70 %, 55 % ;
  - le souffle revient à 75 %, 55 %, 40 % ;
  - des quintes de toux alertent les bêtes alentour, et les chasseurs viennent voir ;
  - aux stades II et III, la vue se trouble par moments ;
  - la fièvre bat au bord de l'image, et des pustules sortent sur le personnage.
- **La contagion en coop** : on est contagieux pour les joueurs tout près.
- **Les compagnes** tombent malades aussi (dans les miasmes épais, ou mordues) : elles frappent 30 % moins fort et toussent. N'importe quel soin de compagne (table de soin) les guérit.

**La Thériaque** : le remède, à la **table d'alchimie** (section « Les remèdes », qui paraît une fois le Vyrel croisé).
- **La recette** est fixe : fleur, éclats, racine, champignon, éclats, fleur (peu communes ou plus). Elle coûte 3 ichors de Vyrel.
- **Le produit** : une fiole (deux si elle est parfaite), qui se range avec les soins.
- **L'usage** : bue, elle guérit le Vyrel et rend 20 % de vie. Elle se donne aussi à un équipier.

**Guérir l'île** :
- **Abattre les charniers.** Frappé, un charnier crache ses miasmes et appelle jusqu'à quatre bêtes malades à moins de 28 cases.
- **Chaque charnier abattu** brûle (flammes, fumée) et éclaircit les miasmes.
- **Du dernier sort la Mère-Charogne** : une immense araignée malade, couverte de pustules. Elle traque à 40 cases, exhale un nuage autour d'elle toutes les six à huit secondes, et crache des miasmes en cloche sur vous (blessure, exposition, nuage).
- **Morte, l'île guérit** : les miasmes se lèvent en douze secondes, et les bêtes redeviennent saines et apprivoisables. +25 éclats et +4 ichors pour chaque joueur présent. L'île reste guérie, et c'est partagé en coop.

**L'ichor de Vyrel** (une matière du sac, comme les spores de Korlaz) :
- **Où le trouver** : 3 à 5 par charnier abattu, 6 sur la Mère-Charogne, et une bête malade abattue en lâche un une fois sur trois.
- **À quoi il sert** : la forge et la Thériaque.

**À la forge, la dose de Vyrel** (4 ichors, une au plus, jamais avec le Korlaz) :
- **Le visuel** : l'alliage se teinte de violet, la lame suinte des gouttes violettes, et la traînée est violette sans pigment.
- **Au contact** : la bête touchée est contaminée six secondes (elle s'affaiblit et ralentit).
- **L'épidémie** : morte contaminée, la bête éclate et contamine ses voisines, sur trois générations au plus.
- **Tirée** : la flèche, le carreau ou la balle laisse une flaque de miasme qui contamine ce qui y entre.
- **Le code** de l'arme porte le Vyrel (un bit de plus). Les anciens codes se lisent toujours.

**Vérifié** (navigateur sans écran, aucune erreur) :
- une île tirée au Vyrel : le filtre, le ciel, les charniers, les bêtes malades ;
- la fureur d'une bête malade, la morsure qui contamine (malade en six morsures) ;
- les stades, la vie bornée, le flou, le souffle ;
- le masque, vu de près sur le personnage ;
- la Thériaque qui guérit, la tuile et la recette à la table d'alchimie ;
- les charniers abattus, la Mère-Charogne qui sort, ses crachats, la guérison et son butin ;
- l'île guérie au retour (sauvegarde relue) ;
- le codage de la forge (Vyrel seul, refusé avec le Korlaz) et la bête contaminée ;
- la sauvegarde.

**Pas vérifié** :
- une partie jouée de bout en bout (le temps de jeu est trop lent dans le navigateur de test : les minuteries ont été avancées à la main) ;
- la coop à deux appareils (contagion, masque vu par l'autre, guérison partagée).

**À déposer** : `vyrel.js` (nouveau), `index.html`, `etats.js`, `faune.js`, `forge.js`, `sw.js` (`stone-valley-152`), `LISEZ-MOI.md`.

## §185 · La Mère-Charogne : une laie colossale

La Mère-Charogne n'a plus le corps d'araignée des bêtes de base. C'est maintenant **une laie colossale, rongée par le Vyrel**, dessinée et animée à part (`osLaie`, `majMere`, dans `vyrel.js`).

**Sa taille** : environ 5,5 cases de long et plus de 3 au garrot, deux fois la hauteur du personnage, et plus large que haute.

**Son corps** :
- **Le tronc** : un dos rond, la bosse du garrot, la croupe, un ventre qui pend.
- **La robe** : un pelage gris-brun, mité de plaques galeuses et de cicatrices. Une crinière de soies sombres court du cou aux reins.
- **La tête**, basse et lourde : le crâne, le chanfrein qui s'effile, un gros groin et ses naseaux, le toupet du front. Les oreilles sont déchirées, les yeux laiteux luisent violet.
- **Les défenses** : deux défenses jaunies, la gauche cassée.
- **Les pattes** : courtes et épaisses, avec des fanons de poils aux genoux et des sabots fendus.
- **La queue** et sa touffe.
- **Le Vyrel sur elle** :
  - des grappes de **pustules** violettes sur les flancs, l'épaule, le cou et le dos, qui gonflent, battent, crèvent et repoussent ;
  - des **veines** violettes sous le ventre et sur le dos ;
  - une **bave** violette qui pend, s'étire et goutte.

**Ses gestes** :
- **La respiration** lourde : le ventre se gonfle.
- **Le pas** : au trot, les pattes en diagonale ; le corps monte à chaque foulée, les épaules roulent, la tête balance.
- **Le sol tremble** à chaque sabot qui retombe, avec un bruit sourd et un peu de poussière, d'autant plus fort qu'elle court.
- **La charge** : elle baisse la tête en se ramassant, charge, puis relève les défenses.
- **Quand elle exhale ou crache**, la tête se lève et la gueule s'ouvre. Elle luit violet dedans.
- **Autour d'elle** : la vapeur monte de son dos, une nuée de mouches tourne, une pustule crève de temps en temps en jet violet, et elle grogne.
- **Sa mort** : toutes les pustules crèvent dans un grand nuage, elle hurle et le sol tremble. Puis elle bascule sur le flanc, les pattes raides, et s'affaisse et se défait en sept secondes.

**Ses coups** : la charge est plus longue (portée 3,4) et plus lourde. Elle crache de la gueule, plus de son centre.

**Vérifié** (navigateur sans écran, aucune erreur) : la laie au repos, de profil, de face, en marche vers le joueur, ramassée avant la charge, en train d'exhaler, puis effondrée sur le flanc. La partie du Vyrel (§184) a été relancée en entier : la Mère sort, meurt, l'île guérit, la sauvegarde.

**Pas vérifié** : le rendu chez un joueur suiveur en coop (ses gestes d'attaque n'y sont pas transmis, seulement son pas).

**À déposer** : `vyrel.js`, `index.html`, `sw.js` (`stone-valley-153`), `LISEZ-MOI.md`.

## §186 · De nouvelles formes : le pavé effilé, le prisme, la boule

Jusqu'ici, le moteur ne dessinait qu'une forme, le pavé étiré entre deux points. Il en connaît maintenant trois de plus, dans ses deux moteurs (la carte graphique `boite` → `formeGL`, et le canvas de secours `emitLimb` → `emitForme`), avec la même géométrie (`geoForme`).

**Les formes**, données sur l'os (`{ a, b, w, h, c, … }`) :
- **`fin`** : le pavé effilé. La section du bout B, en proportion de celle du bout A : un nombre, ou `[largeur, hauteur]`. À 0, c'est une pointe.
- **`pans: 6` ou `8`** : le prisme, presque rond, effilé lui aussi avec `fin`.
- **`boule: n`** : la boule à facettes, un ellipsoïde tendu de A à B, de section w × h. Elle a `n` bandes (4 par défaut, 3 pour les petites) et deux fois plus de méridiens.
- **Sans rien de tout ça**, l'os reste un pavé, dessiné exactement comme avant.

**Le rendu** :
- **L'éclairement** est celui des pavés (le dessus à 1, le dessous à 0,5, les flancs à 0,8 ou 0,6), mêlé pour les faces penchées. Les facettes restent nettes, dans l'esprit du jeu.
- **Le grain** (pelage, os…) se pose sur chaque face à sa mesure.
- **Les bêtes et le personnage** passent leur os au moteur : n'importe quel corps peut s'en servir.

**Ce qui s'en sert déjà** :
- **La Mère-Charogne**, refaite :
  - le corps en masses rondes qui se chevauchent : le tronc, le garrot, la croupe, le ventre qui respire ;
  - le crâne rond, le chanfrein et le groin en prismes qui s'effilent ;
  - des défenses qui finissent en pointe ;
  - des pattes rondes qui s'amincissent vers le sabot, des sabots à deux onglons ;
  - des soies de la crinière en pointes, des oreilles effilées ;
  - des yeux, une bave et des pustules rondes, posées sur la courbe du corps.
- **Les autres bêtes de l'île au Vyrel** : leurs pustules sont rondes.
- **Les charniers** : les bulles de la mare sont rondes.
- **Le masque à bec** : des verres ronds, un bec qui s'effile en pointe. Les verres luisent pour de bon.

**Le coût** : un prisme compte 10 faces, une petite boule 18, une grande 50, contre 6 pour un pavé. La Mère-Charogne en entier fait environ 1 500 faces : sans effet sensible.

**Vérifié** (navigateur sans écran, aucune erreur) :
- la Mère-Charogne de profil, de face, en marche, en train d'exhaler, effondrée ;
- le masque de près ;
- le tout aussi dans le canvas de secours (sans WebGL 2) ;
- la partie du Vyrel relancée en entier.

**La suite possible** : passer les autres créatures à ces formes, une par une.

**À déposer** : `index.html`, `vyrel.js`, `sw.js` (`stone-valley-154`), `LISEZ-MOI.md`.

## §187 · L'onglet Bêta, refait et mis à jour

L'onglet Bêta était une longue liste de lignes. Certains outils avaient disparu de l'écran (tomes, codex, potions, lutrin…) et les nouveautés manquaient. Il est refait en **tableau de bord**.

**Le bandeau du haut** reste en vue pendant qu'on fait défiler :
- **Le mode essai** : un grand interrupteur, avec ce qu'il fait. Le bandeau devient orangé quand il est actif.
- **Quatre gestes rapides**, avec leur icône : remplir le sac, tout fabriquer, soigner, invincible.
- **Où l'on est** : la graine, l'exploration, l'état de l'île, le moteur de dessin.
- **Les volets**, en pastilles : Tout, Personnage, Monde, Campement, Magie, Forge, États d'île, Voyage, Mesures. Le volet choisi reste en vue dans la rangée.

**Les cartes** : chacune a sa vignette, son état du moment (vie, heure, niveau, charniers restants…) et ses boutons.
- **Deux étiquettes** : *essai* (l'outil passe en mode essai, rien n'est gardé) et *gardé* (un réglage qui reste, à faire hors du mode essai).
- **Les niveaux se règlent d'un pas** : « − ●●○ + », au lieu de tourner en rond.

**Ce qui s'ajoute** (mise à jour) :
- **Personnage** : les matières rares (+24 spores, +12 ichors, +5 encre, un pigment de chaque).
- **Monde** : l'aube et le soir, en plus de midi et minuit.
- **Campement** : la forge parmi les modules ; les autres modules, le rempart et les tours au pas.
- **Magie** : les tomes au pas, tous les accords, un tome rapporté, aller au lutrin (ils étaient perdus).
  - **Les arcanes** : leurs tomes au sac, tout apprendre, tout oublier.
  - **Les potions** au pas, pour vous et pour les compagnes.
  - **+2 fioles de Thériaque**.
- **Forge** : son niveau au pas, tous les plans ou les oublier, et ce qui se forge (spores, ichor, pigments).
- **États d'île** :
  - partir sur une île **Korlaz, Brume, Achromie ou Vyrel** d'un seul appui ;
  - le Korlaz : infecter, guérir ;
  - la maladie du Vyrel : contaminer, stade suivant, guérir, mettre ou ôter le masque ;
  - l'île au Vyrel : abattre les charniers, faire venir la Mère-Charogne, guérir l'île ;
  - la brume sanglante : la lever.
- **Voyage** : la téléportation, sur toute la largeur.
- **Mesures** : les mesures du moteur, la position, la faune et l'île partagée, le diagnostic, écrire à l'équipe.

**Sur téléphone** : une colonne de cartes ; le bandeau se resserre (les gestes rapides en icônes seules, sans la ligne d'infos). Sur un écran très bas, il ne reste plus collé en haut.

**Vérifié** (navigateur sans écran, ordinateur 1100 × 720 et téléphone 390 × 800, aucune erreur) :
- chaque volet affiché, toutes les vignettes connues ;
- les pas (établi, forge, tomes) ;
- les arcanes, les plans, l'ichor (qui passe en essai) ;
- contaminer, stade suivant, guérir, le masque, le Korlaz ;
- abattre les charniers (la Mère se prépare).

**À déposer** : `index.html`, `sw.js` (`stone-valley-155`), `LISEZ-MOI.md`.

## §188 · Les créatures en formes, comme la Mère-Charogne

Les bêtes ne sont plus faites que de pavés : chacun de leurs os prend tout seul la forme que suggère sa mesure, sans qu'on ait redessiné chaque espèce (`formesAuto`, appelé à la fin de `foeBones`).

**Les règles** (`formeOs`), dans l'ordre :
- **Un os très fin** (antenne, fil, veine) reste un pavé.
- **Un œil, un point qui luit** devient une petite boule.
- **Une grande plaque courte** (la carapace du glaneur, le dos du crapaud) devient un dôme. Les autres plaques (ailes, oreilles, écailles) restent des pavés, effilés si elles sont longues.
- **Une masse** (tronc, croupe, garrot, tête), soit tout os presque aussi épais que le tronc, devient un galet. C'est une boule gonflée vers sa boîte, un rien plus longue et plus grosse (+8 % à chaque bout, +10 % d'épaisseur) pour garder sa masse et rester soudée à ses voisines.
- **Un membre** (patte, cou, queue, corne, bec) devient un prisme à six pans arrondi, qui s'effile vers son bout, d'autant plus qu'il est long.
- **Un petit bloc trapu** (les touffes de la queue du renard) reste un pavé. Un petit bloc long (pied, museau) devient un prisme court.
- **Ce qui a déjà sa forme ou son grain** n'est pas touché.

**Le galet** : les formes acceptent `rond` (de 0 à 1). Sous 1, la boule ou le prisme gonfle vers sa boîte : on garde la masse du pavé, sans ses arêtes. Une boule pleine perdait la moitié du volume, et les bêtes paraissaient maigres.

**Qui garde ses pavés** : les automates, les bâtiments, la flore, les gens et les villageois, les mages, l'araignon, la Tisseuse, les illusions, les charniers du Vyrel et la Mère-Charogne (déjà dessinés à la main).

**De près seulement** : à moins de 26 cases (14 sur le canvas de secours). Une bête plus lointaine n'a que quelques pixels et garde ses pavés.

**Le coût** : les os coûtent environ un quart de milliseconde de plus par image pour 25 bêtes proches. La carte graphique dessine un peu plus de faces.

**L'onglet Bêta**, volet Monde, a une nouvelle carte : « Les bêtes en formes ». Elle repasse aux pavés le temps d'une partie, pour comparer. Le réglage n'est pas gardé.

## §189 · Les cerfs refaits : deux physiques, deux bêtes

Les deux cerfs étaient trop fins et trop simples. Ils sont redessinés en formes (`osCerf`), plus massifs, un peu plus grands (Cerf de verre : taille 1,4 → 1,55 ; Cerf des cerisiers : 1,3 → 1,4), et chacun a maintenant son propre physique.

**Les largeurs suivent la taille de la bête.** Avant, elles ne grandissaient pas avec elle, et le cerf paraissait maigre. Le tronc est fait de galets qui se chevauchent : croupe, ventre qui respire, poitrail profond, garrot, dessous plus sombre. Les cuisses et les épaules sont épaisses. Les autres détails :
- le canon, le genou et le boulet ;
- le sabot fendu en deux onglons ;
- la mâchoire, le mufle et le larmier ;
- l'intérieur des oreilles.

**Le Cerf de verre**, un grand cerf de montagne :
- un garrot haut et un cou épais ;
- une crinière d'aiguilles de cristal qui pend sous le cou ;
- une crête de cristaux sur l'échine, plus grands au garrot ;
- un éperon de cristal derrière chaque boulet ;
- une ramure de cristal en lyre, qui s'ouvre puis se referme. Elle porte dix cors, dont le massacre sur le front et une couronne de trois au sommet.

Tout le cristal luit.

**Le Cerf des cerisiers**, un sika :
- plus ramassé, la croupe ronde ;
- la robe semée de taches couleur de pétale, sur deux rangs ;
- le miroir blanc cerclé de sombre, une raie sombre sur l'échine et une courte crinière sous la gorge ;
- des bois de bois vivant à huit cors, fleuris à chaque pointe (deux fleurs, une rose et une pâle), avec une feuille.

**Les attitudes** restent celles d'avant : brouter tête au sol, se dresser à l'alerte avec la queue levée, le trot en diagonale, le bond. La tête balance un peu au pas et la queue bat.

**Une correction du moteur de formes** : une pointe (`fin: 0`) ne se dessinait pas. Ses deux points du bout se confondaient, et la face prenait une normale nulle. Les flancs des prismes commencent maintenant par leurs deux points de base. Les pointes s'affichent enfin, partout où elles servent.

## §190 · Le carillonneur refait : l'antilope à cloches

Le carillonneur est redessiné en formes (`osCarillon`), sur le modèle des cerfs du §189. Il est plus massif, un peu plus grand (taille 1,25 → 1,35), et a son propre physique : ni cerf de verre ni sika, mais une antilope des hautes herbes.

**Le corps** :
- trapu, avec une bosse à l'épaule, un poitrail profond et un dessous plus sombre ;
- la robe rayée de blanc : cinq rayures descendent du dos sur chaque flanc ;
- une crinière courte sur l'échine et sur le cou ;
- une queue à houppe sombre, qui bat au pas et se lève à l'alerte en montrant son dessous blanc ;
- des pattes trapues, des chaussettes blanches au-dessus des sabots fendus.

**La tête** : un chevron blanc entre les yeux, une barbiche, et de grandes oreilles rondes, blanches dedans.

**Ce qui sonne** :
- **La cloche de gorge** : le fanon pend sous le cou et finit en une cloche de corne évasée, avec sa bouche sombre et son battant.
- **Les cornes creuses** font un tour et demi de vis, en arrière et en dehors. Elles sont annelées (un anneau plus sombre sur trois) et s'ouvrent en pavillon.
- **Deux clochettes** pendent à des fils sur chaque corne, chacune avec son battant.

Tout ce qui sonne balance au vent et au pas. Pendant les trois premières secondes après avoir vu un chasseur, tout bat à toute volée, au moment où il tinte (`guetCarillon`). À l'alerte, ça bat à moitié.

**Les attitudes** restent celles d'avant : brouter, l'alerte tête haute, le trot, le bond.

## §191 · Le Bossu, le Démon, la Tisseuse et le Dragon, en formes

Quatre bêtes de plus sont redessinées en formes, plus détaillées. Chacune pose ses os avec leur forme : des galets pour les masses, des prismes et des cylindres pour les membres, des pointes pour ce qui pique, des lames effilées pour les plumes, des lentilles pour les yeux.

**Le Bossu** (`osBossu`) a enfin son corps à lui. Il partageait celui des autres Rampants.
- Un gros rampant bas, sous une bosse de trois plaques en dôme qui se chevauchent, la plus haute au milieu.
- De la mousse et des cailloux poussent sur la bosse, et l'éclat volé y est planté (deux pointes de cristal).
- Devant : un bouclier de front et deux cornes courtes et épaisses, qui abattent les arbres et cassent la pierre ; des yeux sur de courts pédoncules ; des mandibules épaisses à pointe sombre.
- Dessous : des anneaux sur le ventre.
- Six pattes trapues (celles de devant plus fortes), un genou noueux, une épine au tibia et une griffe.
- Il respire. À l'alarme il se dresse, ses mandibules s'ouvrent, ses yeux rougissent quand il charge.

**Le Démon du cercle** (`osDemon`, brume.js) devient une masse de muscles et de corne. Toutes ses attitudes sont gardées : marche, rugissement, charge au galop, revers, martèlement, sonné, sortie du cercle.
- Bassin, ventre, cage qui se gonfle, épaules, bosse du garrot, pectoraux, plaques du ventre.
- Des épines sur l'échine et sur les épaules.
- Une tête de taureau : arcade, mufle, naseaux de braise, crocs en haut et en bas, oreilles. Les cornes sont annelées et finissent en pointe.
- Les bras : épaules, biceps, veines de lave, un éperon au coude, des griffes en pointe.
- Les jambes de bouc : cuisse velue (du poil à l'arrière), genou, ergot de poil au jarret, sabot fendu.
- La queue s'effile et finit en fer de lance.

**La Tisseuse de fer** (`osTisseuse`) passe en fonte ronde et en cylindres.
- Le céphalothorax et l'abdomen deviennent des dômes, ses plaques des carapaces, ses cerclages des bagues qui épousent l'abdomen.
- Rivets ronds, tuyaux à coude, rivets sur les flancs.
- Les cheminées ont une bouche noire, le fusil et le mortier deviennent des cylindres à bagues.
- Les crochets et les griffes sont en pointe, les yeux et la lentille en lentilles.
- Les pattes ont une rotule à la hanche, deux bagues de cuivre au fémur, un genou rond, une cheville de cuivre. Le vérin a un corps et une tige d'acier.

**Le Dragon à plumes** (`osDragon`) est un peu plus imposant : son échelle passe de 0,8 à 0,9.
- Un corps en anneaux ronds soudés par des jointures, qui s'affine jusqu'à la queue, avec les écailles du ventre en bandes.
- Des plumes en lames qui s'effilent : la crête, les flancs, la culotte des pattes, les moustaches, l'aigrette, et l'éventail de la queue, où chaque plume a sa tige.
- Une collerette de plumes à la base du cou, qui se hérisse à la menace.
- La tête : arcade, naseaux, crocs en haut et en bas (ceux du bas se voient quand la gueule s'ouvre), yeux ronds à la pupille fendue, cornes en deux temps.
- Les ailes ont des couvertures par-dessus les rémiges.

## §192 · Le démon, en contraste

Le démon était d'un rouge sombre uniforme, sous une peau grenue à points clairs : on ne lisait rien de son corps.

**Une nouvelle matière, la croûte** (`TEX.croute`, `MAT_CORPS.demon`) : des plaques de peau cuite, décalées d'un rang à l'autre. Des fentes très sombres les séparent ; le haut de chaque plaque accroche la lumière, le bas s'ombre, et quelques piqûres sombres s'y ajoutent.

**Des teintes qui varient d'une partie à l'autre** :
- le torse plus clair, les muscles plus vifs encore (pectoraux, épaules, genoux) ;
- les extrémités qui s'assombrissent (avant-bras, mains, bas des jambes, base du cou, bout de la queue) ;
- les plaques du ventre presque noires.

**La corne et l'os** (avec la matière os) :
- les cornes passent du noir à la base à l'os clair à la pointe, cerclées d'anneaux plus sombres ;
- les épines du dos et des épaules, les éperons des coudes et les crocs sont en os clair, sur une base de corne noire pour celles du dos ;
- les griffes et les sabots sont presque noirs, le fer de la queue couleur de corne.

**La lave**, plus vive :
- un cœur de braise, une fente jaune et orange entre les pectoraux ;
- des fentes de lave dans le dos et une veine sur chaque cuisse, en plus de celles du ventre et des bras.

## §193 · Le démon vit : son animation refaite

Toute l'animation du démon est refaite (`osDemon`, brume.js). Ses coups gardent leur moment et leur portée : le jeu ne change pas, seul ce qu'on voit change.

**Le squelette.** Le bassin a sa hauteur, son balancement, son lacet et son roulis. L'échine a quatre vertèbres qui se cambrent ou se plient, et les épaules tournent à l'inverse du bassin. Le cou et la tête suivent leur cible du regard : vous, ou la cible de son coup. Les jambes de bouc se plient en trois : hanche, genou devant, jarret derrière, avec un sabot qui bascule. Les bras se plient au coude, et les mains s'ouvrent ou se serrent en poing.

**Des poses clés, et pas d'à-coup.** Chaque geste est une suite de poses clés (`kf`), et tout est lissé d'une image à l'autre (`lis`). Au changement d'attitude, le lissage ralentit un instant (pendant 0,45 s) : il passe d'une attitude à l'autre, il ne saute pas. Les pôles des coudes sont choisis pour qu'aucun coude ne se retourne d'un coup pendant un geste. Mesure sur une suite marche, revers, martèlement, charge, rugissement : aucun saut entre deux images en dehors des coups eux-mêmes.

**Les muscles travaillent.**
- Le biceps gonfle quand le coude se plie, l'avant-bras quand le poing se serre.
- La cuisse gonfle sous la charge, le mollet à la poussée.
- L'épaule suit le bras ; les abdominaux se serrent quand il se plie.
- La cage et les pectoraux se gonflent au souffle. Le souffle est court et profond après l'effort, et ne se calme que lentement.

**La lave, les yeux, les naseaux.** La lave bat avec le souffle et flambe au coup, au rugissement et à la charge. Les yeux s'allument au coup et vacillent quand il est sonné. Les naseaux flambent quand il gratte le sol. Une oreille frémit de temps en temps.

**Les attitudes** :
- **Au repos** : il respire, change d'appui, laisse ses doigts jouer, penche la tête, et vous suit des yeux.
- **La marche** : chaque pied se pose, porte, puis pousse : le talon se lève et le sabot bascule. En l'air, la jambe se replie puis se tend vers l'avant. Sur l'appui, le pied recule sans glisser. Le corps plonge à chaque pas et se déhanche sur la jambe qui porte ; le bassin tourne avec la jambe qui avance, les épaules en sens inverse. Les bras balancent à contretemps, avec un léger retard, et la queue répond au bassin.
- **La charge** :
  - D'abord il gratte le sol du sabot droit, tête basse, le poids sur la gauche : il lève, frappe, racle, revient.
  - Puis il galope à quatre pattes. Les mains se posent loin devant, à plat, doigts en avant, coudes en arrière. Les deux pattes de bouc poussent, se ramassent sous le ventre et se replient en l'air. L'échine se plie et se déplie, la queue file derrière.
- **Le revers** : il arme, le buste tordu, le bras droit levé derrière lui, le poing serré, le poids en arrière. Puis le pied droit avance, tout le corps se détord, et la main balaie devant lui, griffes ouvertes, et passe en travers. Le bras gauche fait contrepoids, la queue contre-balance, et il revient.
- **Le martèlement** : il se dresse sur ses sabots, les poings joints au-dessus de la tête, le dos cambré, et rugit en tremblant. Puis il s'abat de tout son poids, genoux pliés, le pied gauche en avant, les deux poings au sol à l'endroit de l'impact. Il reste ramassé et souffle, puis se relève.
- **Le rugissement** : il inspire, voûté, les bras bas et en arrière. Puis il se cambre, les bras grands ouverts, les doigts écartés, la gueule grande ouverte qui tremble, la queue levée qui fouette. Enfin il se penche vers vous, poings serrés.
- **La sortie du cercle** : il s'y hisse à la force des bras, les mains agrippées au sol de chaque côté, la tête levée vers vous.
- **Sonné** : il titube, les pieds cherchent le sol, les bras ballants, et il secoue la tête.
- **La mort** : il tombe à genoux, puis s'effondre en avant, les bras tendus, la tête de côté, avant de s'enfoncer dans le sol.

## §194 · Le village remis d'aplomb

Trois défauts du biome village sont corrigés : les maisons bougeaient, elles tombaient à moitié dans le vide, et les villageois se coinçaient dans les murs.

**La place nivelée** (`villageTerrain`, village.js). Elle est faite au chargement de l'île, avant l'eau, la flore et les bêtes.
- Un rond de 11,5 cases autour du milieu du biome est ramené à une seule hauteur : la plus commune du rond, pour remuer le moins de terre possible.
- Sur cette place, les trous et l'eau sont comblés, et le sol devient de la terre battue d'un bord à l'autre. Les arbres et les rochers en sont ôtés.
- Autour, un talus en marches d'un cube rejoint le sol d'origine, sur 9 cases au plus.
- La même graine donne la même place à tous les joueurs. Le sol d'origine (hauteur, eau, sol) est gardé et rendu avant de recommencer, si l'île est remise à zéro.
- Les maisons sont posées sur la place, sur du plat de 5 × 5, à 5 cases au moins l'une de l'autre. Le puits est un peu plus loin du feu.

**Les maisons ne bougent plus.** En démêlant deux corps, le jeu poussait aussi les bâtiments : un joueur qui s'appuyait contre une maison la faisait glisser de plusieurs cases. Un bâtiment est maintenant fixe, et c'est l'autre corps qui s'écarte (`demeler`).

**Des corps à la mesure des maisons.**
- La maison longue n'est plus un disque de 1,7 case, qui laissait passer par ses coins et barrait ses flancs. C'est une gélule qui suit son axe (`demiL`, `ptCorps`), utilisée par les heurts, le joueur et le démêlage.
- La haute est un disque de 1,3 case.

**Les villageois ne traversent plus les murs.**
- Ils marchent comme les bêtes (`heurtCorps`) : ils glissent autour des maisons, du puits, du feu et des gens.
- Un but pris dans un bâtiment est ramené à son bord, un pas dehors (`vlDehors`).
- Bloqués une demi-seconde, ils cherchent leur chemin case par case (`vlChemin`) : autour des maisons, par des marches d'un cube au plus, sans eau ni trou. Sans chemin, ils renoncent à ce but.
- Pris dans la foule, loin du but, ils font un détour où les gens immobiles comptent comme des murs ; tout près du but, ils s'arrêtent là.
- Ils naissent devant leur porte et non plus dans la maison. Ils attendent devant la porte, hors des murs ; pour la maison longue, l'arrêt était dans le pignon.
- Au repas, chacun a sa place autour du feu, en rond, à 2,25 cases. Ce qu'on rapporte se pose à des tas distincts autour du feu, à 2,4 cases, et plus tous au même endroit.

**Mesuré** sur trois villages, en simulant 200 s de vie (le jour avec le repas de midi, puis la nuit) :
- aucun villageois dans un mur, à aucun instant ;
- aucune maison déplacée, même poussée par le joueur ;
- personne de bloqué plus de 8 secondes ;
- la nuit, tout le monde est rentré.

## §195 · L'île volcanique (lot 1 : le terrain et l'ambiance)

Un nouveau genre d'île, l'« île biome » : toute l'île est faite d'un seul monde, qu'on ne trouve nulle part ailleurs. La première est volcanique. Ce lot pose le terrain, la lave, les vapeurs et le ciel ; l'hostilité, la météo, la musique, la flore, la faune et la créature alpha suivront (lots 2 à 6). Tout le module est dans `volcan.js`.

**Quand.** Une graine signée sur vingt-cinq (environ une île sur quatre cents en tout), dès l'exploration 6 (`NIV_VOLCAN`, `ileVolcanGraine`). L'île volcanique n'a ni biome rare, ni état d'île (Korlaz, brume, Achromie, Vyrel), ni fourmilière, ni îles volantes. Ce n'est jamais aussi l'île des automates.

**Le relief** (`volcanRelief`, appelé dans la boucle du relief de `genWorld`) :
- l'île est ronde, avec une côte qui ondule ;
- au centre, légèrement décalé selon la graine, un cône concave jusqu'au sommet de l'île, raviné de crêtes qui rayonnent ;
- en haut, une lèvre, puis un cratère à parois raides.

**Les sols** (`volcanSols`, après les biomes). Huit sols nouveaux (`BIOME` 24 à 31), chacun avec sa texture, son flanc, son bruit de pas et ses particules d'ambiance :
- orgues de basalte : le dessus en hexagones, sur les parois et les vieilles coulées ;
- soufrière ;
- obsidienne : des reflets de verre ;
- sable noir : le rivage et les traînées de scories du cône ;
- cendre : le gros du cône ;
- lave ;
- bain brûlant ;
- travertin : des gradins qui ondulent.

Le cône n'a pas de gouffres : ils sont comblés jusqu'au pied du cône.

**La lave.**
- Un lac au fond du cratère.
- Une coulée part du lac par une brèche qu'elle se taille dans la lèvre, puis descend jusqu'à la mer.
- Deux ou trois autres coulées partent de bouches sur le flanc, chacune entourée d'un bourrelet de scories.
- Une coulée suit la pente, garde son élan et serpente. Son lit ne remonte jamais et court un cube sous ses berges d'obsidienne et de basalte. Là où elle entre dans la mer, la vapeur monte.
- Avec la carte graphique, la lave a son propre rendu (`laveVolc`) :
  - elle coule ;
  - des plaques de croûte noire dérivent dessus, fendues de feu ;
  - elle bat doucement ;
  - elle tombe le long des marches ;
  - elle luit la nuit ;
  - elle éclaire ses berges (`lueursRares`).

**Les soufrières.** Cinq ou six taches jaunes sur le cône, dont deux sur la lèvre du cratère, avec des évents qui fument.

**Les bains brûlants.** Deux ou trois sources, chacune avec trois à cinq vasques en terrasses qui descendent. Chaque vasque est un cube sous la précédente et ceinte de travertin. L'eau est turquoise et fume ; on peut s'y baigner.

**Les geysers.** Trois à cinq, surtout près des bains : un monticule de travertin, avec un trou d'eau au sommet. Chacun suit un cycle :
- il se repose de 20 à 60 s ;
- il gronde pendant 2,6 s (il bouillonne et crache) ;
- il jaillit pendant 4,5 à 7,5 s, sur 6 à 13 cubes de haut, couché par le vent, avec un nuage de vapeur.

**L'air.**
- Un panache monte du cratère, sombre en bas et cendré en haut, et le vent le couche de plus en plus. La nuit, son dessous rougeoie.
- Des gerbes et des bulles crèvent sur le lac et sur les coulées.
- Les fumées sont des disques doux qui grossissent et arrivent en fondu (`bouffee`, genre de panneau 9). En canvas, ce sont des disques pâles, deux fois moins nombreux.

**Le ciel et la lumière.**
- Le ciel est de cendre : brun le jour, rouge sombre la nuit (`volcanCiel`).
- Un voile roux couvre tout le décor (`volcanVoile`).
- En canvas, un filtre sépia chaud est appliqué (`volcanCss`).

**Sûreté.**
- Le joueur n'apparaît jamais dans la lave ni dans un bain : il apparaît de préférence sur la cendre ou le sable noir.
- Ni l'arche ni la réapparition ne se posent sur la lave.

**Pour l'instant**, aucune faune n'est posée sur l'île : `capEsp` n'y garde que les espèces marquées `volcan`, qui viendront au lot 4. La lave ne brûle pas encore ; ce sera le lot 2.

**Bêta.** Le bouton « Volcan » de la carte « Cette île » cherche une graine volcanique et vous y emmène, à l'exploration 6 au moins. Pour les tests, on peut aussi forcer l'île avec `globalThis.__VOLCAN = true`.

## §196 · L'île volcanique (lot 2 : l'hostilité, la météo, la musique)

L'île volcanique devient dangereuse, prend un ciel qui n'appartient qu'à elle, bien visible, et sa propre musique. Tout est dans `volcan.js`, avec quelques accroches dans `index.html`.

**Ce que l'île fait au corps** (`volcanCorps`) :
- **La lave.**
  - Elle brûle vite : on y meurt en trois à quatre secondes.
  - La brûlure dure encore deux secondes après en être sorti.
  - Un message dit « la lave ! sortez-en ».
- **La chaleur.**
  - Qui longe une coulée plus d'une seconde lit « la chaleur vous mord ».
  - Au-delà de deux secondes et demie, la chaleur blesse doucement.
- **Le soufre.**
  - Sur une soufrière ou près d'un évent, au bout de deux secondes, on est empoisonné, avec une toux et un message.
  - Ce poison ne tue pas. L'antidote le chasse.
- **Les bains.**
  - La source, en haut de chaque cascade, est brûlante, comme le trou d'eau d'un geyser.
  - Les vasques du bas apaisent : elles rendent de la vie et lavent le soufre. On entre dans l'eau avec un plouf.
- **Les geysers.**
  - Quand on approche, « le geyser gronde ».
  - Qui reste sur l'évent quand il jaillit est projeté de 8 à 12 cubes en l'air, et un peu ébouillanté.
- Le baume de braise (l'effet `braise`) protège de tout ce qui est feu.

**La météo de l'île.** Quatre temps qu'on ne voit qu'ici (`METEO`, avec `volc`). Chacun s'annonce par un message quand il arrive.

| Temps | Ce qu'on voit et ce qu'on subit |
|---|---|
| Fumées | Le temps de l'arrivée : un ciel brun, un peu de cendre. |
| Pluie de cendres | Le jour baisse et la brume se resserre. Des flocons gris tombent en se balançant et se posent. Des nappes de cendre traînent au ras du sol. Le ciel vire au gris sale. |
| Orage de cendre | La foudre tombe dans le panache et autour de vous : des éclairs brisés, ramifiés, avec un halo violet. Le ciel s'allume et le tonnerre suit. Il pleut de la boue. |
| Éruption | « La montagne gronde », puis le cratère éclate : détonation, secousse, puis la terre tremble par à-coups. Le panache triple, une fontaine de lave jaillit du cratère, le ciel et la brume s'embrasent. Des bombes de lave volent en cloche en traînant leur fumée et éclatent au sol, et deux sur cinq visent vos environs (un coup coûte un cinquième de la vie et vous repousse). |

- Après un sort qui change le temps, l'île revient d'elle-même à ses fumées.
- Il ne neige jamais sur le volcan.
- Le bouton météo de la Bêta ne fait défiler que les temps de l'île où l'on est.

**La musique : « Le Cœur de cendre »** (`volcanMusique`). Elle a son propre lecteur, comme la Grande Horloge.
- Un ré grave respire sous un filtre.
- Des tambours de peau suivent un cycle de deux mesures.
- Une voix d'anche en mode hijaz chante une phrase, puis se tait.
- Le danger (`volcanIntensite`) change la musique :
  - il resserre les tambours, ouvre la nappe et ajoute une basse en 3 + 3 + 2 ;
  - au plus fort, il ajoute des cuivres graves et des braises qui crépitent.
- Ce qui compte comme danger : l'éruption, le bord du cratère, l'orage, une bête qui vous chasse, une vie basse.
- Mesurée hors jeu, elle est aussi forte que la Valse rouge au calme, et 2 à 3 dB plus forte en éruption.

**Performances.** Une particule morte n'est plus retirée en décalant tout le tableau : la dernière prend sa place. L'éruption en fait vivre jusqu'à deux mille à la fois. En canvas, la fontaine, les bulles du lac et la cendre sont réduites.

## §197 · L'île volcanique (lot 3 : la flore et ses ressources)

L'île volcanique a maintenant sa propre flore : neuf espèces qu'on ne voit nulle part ailleurs, plus des plantes rares pour trois de ses sols. Les espèces sont ajoutées en queue de `ESP`, pour ne rien déplacer des autres. Elles ont sept silhouettes nouvelles dans `formeFlore`, communes au canvas et à la carte graphique.

**Les braises qui luisent vraiment.** Les braises du tison et les flammes du lis de feu sont teintes de `FL_LAVE`, une couleur qui porte le drapeau de la lave. La carte graphique leur donne le rendu de la lave (§195) : elles bougent, se couvrent de croûte et luisent la nuit. La nuit, l'île est semée de petites braises.

**Les espèces :**

| Espèce | Ce qu'on voit | Où elle pousse | Ce qu'elle donne |
|---|---|---|---|
| Arbre-tison | Un fût noir qui se tord, des bras nus avec une braise au bout de chacun, une fente qui couve. Il crache des étincelles. | Cendre, sable noir, basalte | Bois. Peut donner une braise de tison (peau dure) |
| Lis de feu | Une tige noire et des pétales en lames qui se referment comme une flamme. Il luit la nuit. | Obsidienne, basalte, cendre | Fibre. Peut donner des pétales de feu (insensible au feu) |
| Soufre en aiguilles | Une croûte jaune et des aiguilles de cristal qui rayonnent. | Soufrière | Éclats, à la pioche |
| Orgue de basalte | Des colonnes serrées, de hauteurs inégales. | Basalte | Beaucoup de pierre (8 par pied) |
| Lames d'obsidienne | Des lames noires aux reflets violets, fichées de biais dans le sol. | Obsidienne | Éclats, à la pioche |
| Vesse-de-vapeur | Un bulbe ventru avec une bouche au sommet. Elle souffle de la vapeur. | Travertin, près des sources | Fibre. Peut donner un bulbe de vapeur (grand souffle) |
| Tapis thermophile | Des anneaux orange, verts et jaunes, au ras de l'eau chaude. | Bord des bains | Fibre. Peut donner un voile thermophile (antidote) |
| Herbe de cendre | Des touffes pâles, qui donnent un peu de vie aux pentes grises. | Cendre, sable noir | Fibre. Peut donner des graines de cendre |
| Piment de lave | Un buisson sombre aux baies rouge vif, qui luisent. Un sur trois des buissons tirés sur la cendre. | Cendre | Baies. Peut donner des piments de lave (insensible au feu) |

L'arbre-tison, le lis de feu, la vesse, le tapis, l'herbe de cendre et le piment donnent des graines comme le reste de la flore. On peut donc les cultiver au campement.

**Ce que le volcan donne pour survivre au volcan.** Un plat préparé avec un ingrédient « braise » (les pétales de feu, les piments de lave, la chair de salamandre…) rend insensible au feu. L'effet s'appelle maintenant « insensible au feu ». On traverse alors la lave, la chaleur, les sources et les bombes sans brûler (§196). La première fois qu'on met le pied dans la lave, le jeu le dit : « un plat de braise protège du feu ». Le voile thermophile est un antidote contre le soufre.

**Les plantes rares** (`flore.js`). Trois nouvelles familles de douze, comme pour les autres biomes, avec leurs noms, leurs couleurs et leurs ingrédients :
- **la cendre :** de l'étoile de scorie au fouet de scories ;
- **la soufrière :** de l'étoile jaune à la cracheuse de soufre ;
- **le travertin :** de l'étoile des sources à la cracheuse de geyser.

**La flore vit.** Près de vous, la vesse-de-vapeur souffle de petites bouffées et l'arbre-tison laisse monter des étincelles (`majVolcan`).

**Mesuré** sur la graine 4242 :
- herbe de cendre : 1 208 pieds ;
- lis de feu : 752 ;
- arbre-tison : 357 ;
- orgues : 286 ;
- vesses : 252 ;
- lames : 81 ;
- soufre : 54 ;
- tapis : 50 ;
- piments : 22.

Deux plantes rares sont posées : une méduse de fumerolle et une cracheuse de geyser. La récolte a été vérifiée sur l'orgue, le lis, le tison et le soufre (le soufre demande la pioche).

## §198 · L'île volcanique (lot 4 : la faune)

Trois bêtes qu'on ne voit que sur l'île volcanique, toutes trois grandes. Leurs squelettes sont faits sur mesure dans `volcan.js` (`osVolcan`). Leurs pièces marquées `{ lave: 1 }` ont le rendu de la lave dans la carte graphique (épines, joints, braises), comme la flore du §197. Elles sont en queue de `SPEC` (`VOLCAN_SPEC`). Leur nombre sur l'île est fixe (`capEsp`) : 5 magmatons, 3 basilics, 4 charognards. On ne les tire jamais ailleurs.

**Le Magmaton** (2,5 fois la taille d'une bête ordinaire).

Son corps :
- **La carapace :** un dôme d'orgues de basalte (une colonne au sommet, deux couronnes autour), une jupe d'écailles plates qui déborde, et des joints de lave qui rayonnent du sommet entre les colonnes.
- **Le sommet :** un petit cratère qui fume.
- **La tête :** massive, avec un bec d'obsidienne crochu, une plaque de basalte sur le front et des yeux qui luisent.
- **Les pattes :** des piliers aux genoux cuirassés et aux ongles d'obsidienne.

Il vit ainsi :
- Il marche une patte après l'autre, lourdement, et le corps roule vers la patte qui porte.
- Près de vous, le sol tremble et sonne à chacun de ses pas.
- Il broute la cendre, la tête au sol, en troupeau lent, et dort au cœur de la nuit.
- Frappé, il se fâche : la tête se lève, la gueule rougeoie, et tout le troupeau charge.
- Sa charge est lourde : elle se prépare longtemps, mais un coup coûte cher.
- Sa viande donne le cœur de magmaton (peau dure, rare).

**Le Basilic de lave** (environ trois cases de long).

Son corps :
- **L'échine :** dix points, parcourus d'une onde qui va du cou à la queue, plus ample vers le bout.
- **Le dos et les flancs :** des épines dont la pointe est en feu, et des fissures de lave sur les flancs.
- **La queue :** terminée par une braise.
- **La tête :** un crâne plat, des cornes en arrière, des yeux jaunes, des dents, et une mâchoire qui s'ouvre sur une gueule-four.
- **La collerette :** sept lames qui se déploient quand il chasse ; leurs bords s'embrasent alors, et il crache des étincelles.
- **Les pattes :** écartées, le coude en dehors.

Il vit ainsi :
- Il chasse le jour comme la nuit, à la lueur de la lave.
- Il s'en prend au magmaton, et à vous quand il a faim.
- Il se ramasse longtemps avant de fondre sur vous, de loin.
- Sa morsure brûle.
- Il vit de la cendre entre deux proies.
- Sa viande donne la queue de basilic (insensible au feu, légendaire).

**Le Charognard de cendre** : un vautour de plus de deux cases d'envergure.

Son corps :
- **Les ailes :** des rémiges écartées en doigts, à la pointe de braise, et des couvertures plus claires.
- **La tête :** un cou nu, orange vif, une fraise de plumes grises, un bec crochu.
- **La queue :** en éventail.

Il a sa propre vie en l'air (`majVautour`) :
- **Planer :** il tourne en cercle sur une colonne chaude (le cratère, une soufrière, une bouche), et en change de temps en temps.
- **Guetter :** il vous suit et tourne au-dessus de vous.
- **Piquer :** il fond sur vous, bien plus volontiers si vous êtes blessé. Au bout du piqué, il ne lâche plus sa cible. Un coup vous lacère et vous repousse.
- **Remonter et fuir :** après le piqué, il remonte ; frappé, il s'enfuit.
- Il ne rentre jamais dans la roche, même au bout d'un piqué.
- Abattu, il tombe en vrille.
- Il ne s'apprivoise pas.
- Sa viande donne le blanc de charognard (grand souffle).

**La rencontre.** La première fois qu'on approche chacune des trois bêtes, le jeu l'annonce : « une montagne qui marche », « sa collerette s'embrase quand il chasse », « des charognards de cendre tournent sur les fumées ».

**Les sons.** Le magmaton soupire, très bas. Le basilic rugit. Le charognard crie.

**Mesuré.** Les trois comportements ont été vérifiés par simulation :
- le basilic traque, attaque et brûle ;
- le charognard passe par tous ses états (planer, guetter, piquer, remonter) et touche ;
- le magmaton frappé traque, puis charge.

Les trois bêtes s'affichent aussi en canvas. Les îles ordinaires n'en ont aucune, et aucune erreur n'apparaît sur ces îles.

## §199 · L'île volcanique (lot 5 : l'alpha, le Tisonnier)

Le gardien du volcan. Il y en a un par île volcanique ; il dort dans le lac de lave du cratère. Tout est dans `volcan.js` : son squelette (`osTisonnier`), sa vie (`majTisonnier`, `actionTisonnier`), son onde (`majOndes`), sa mort (`tisonMort`), sa barre (`majBarreTison`).

**Son corps.** Un titan voûté de basalte et de magma, d'environ cinq cases de haut, qui marche sur les poings comme un gorille.
- **Le tronc :** des pattes arrière courtes et épaisses, aux griffes d'obsidienne. Un poitrail massif qui respire, un ventre de magma qui luit.
- **Le dos :** l'échine hérissée d'orgues de basalte, avec des fentes de lave entre elles et sur les flancs. Entre les épaules, un petit volcan de huit orgues penchées, avec un lac de lave au fond : il fume et crache des braises en permanence.
- **Les épaules :** deux épaulières en orgues, bordées de lave.
- **La tête :** basse sous les épaules, sous un front de basalte, avec de grands yeux qui luisent, une mâchoire qui s'ouvre sur un four, deux défenses et une couronne de cinq pointes d'obsidienne.
- **Les bras :** le gauche finit en poing. Le droit finit en **tisonnier** : un bracelet de fer, une barre noire dont le dernier tiers est rouge et crochu. Il le plante en marchant, comme une béquille.

**Son animation.** Elle est faite comme celle du démon (§193) : un repère par pièce (le bassin, l'échine, le poitrail, la tête), des poses clés pour chaque geste, et tout passe de l'une à l'autre en douceur.
- **La marche sur les poings :** patte arrière gauche, poing gauche, patte arrière droite, tisonnier. Le corps plonge et roule à chaque appui, les épaules tournent contre le bassin.
- **À l'arrêt :** il souffle, change d'appui et vous suit du regard.

**Le combat.**
1. **Le réveil.** Quand on approche du cratère, ou qu'on le frappe dans son lac, le lac se soulève. Il se hisse hors de la lave à la force des bras, la lave coulant de lui, puis se cabre et rugit, les bras grands ouverts. La barre « LE TISONNIER » apparaît en bas de l'écran.
2. **Ses cinq coups.** Il tire au hasard parmi ceux qui sont à portée et prêts, sans répéter le même deux fois de suite quand il a le choix :
   - **Embrocher.** Il se cabre et ramène le fer ; une ligne d'étincelles au sol montre où il vise. Puis il se jette et plante le tisonnier jusqu'à 7,5 cases devant lui. Le sol brûle ensuite le long de la ligne.
   - **Balayer.** Il arme sur sa droite, le buste tordu, puis balaie tout devant lui sur six cases et vous jette de côté.
   - **Marteler.** Il se dresse, les deux bras au ciel, et s'abat. Il y a le coup, puis une onde de feu qui court au sol sur neuf cases. Celle-ci ne touche que ceux qui ont les pieds au sol : il faut sauter au bon moment, et le jeu le dit la première fois.
   - **Cracher.** Le volcan de son dos jette six bombes de lave autour de vous, quand vous restez loin.
   - **Charger.** Il gratte du poing, tête basse, puis galope sur les poings et fonce.
3. **À mi-vie, il s'embrase.** Il rugit et la montagne entre en éruption (§196). Il frappe 30 % plus vite, le volcan de son dos crache davantage, et des fentes de lave s'ouvrent sur ses bras, ses cuisses et ses pointes. Son tisonnier qui traîne laisse un sillage de feu.
4. **Le sol qui brûle.** Le sillage et la ligne plantée brûlent pendant trois à quatre secondes. Le baume de braise protège aussi de ce feu.

**Son domaine.** Il ne quitte pas son cône. Une proie qui s'en éloigne de plus de 45 cases, ou qui sort du cône, il ne la suit pas : il s'arrête et regarde. Au bout de dix secondes, il rentre au lac, s'y enfonce et guérit.

**Sa mort.** Il tombe à genoux, puis s'effondre en avant, et sa lave refroidit en croûte sombre. Il donne :
- le **cœur du Tisonnier** (ingrédient légendaire, insensible au feu) ;
- 30 éclats et 30 pierres.

La montagne se calme : dix minutes de fumées. Il ne revient pas tant qu'on ne recharge pas la page.

**À côté.**
- On ne le nourrit pas, et on ne nourrit pas non plus un charognard sauvage.
- Sa fiche dit « gardien du volcan », « embrasé » ou « il rentre au lac ».
- Pendant le combat, la musique du volcan est à son plus fort.

**Mesuré** par simulation, à l'exploration 8 :
- le réveil, les cinq coups, l'onde, le sol en feu, les bombes ;
- l'embrasement et l'éruption ;
- le retour au lac quand on fuit, avec la guérison ;
- la mort, le butin et le calme de la montagne.

Il s'affiche aussi en canvas et en 1re personne, sans erreur. Les îles ordinaires n'en ont pas.

## §200 · L'île volcanique (lot 6 : une flore à elle, ses matières, la fabrication, les performances)

**La flore rare du volcan a ses propres formes.** Jusqu'ici, les 36 plantes rares des trois biomes du volcan reprenaient les formes communes à toutes les îles, recolorées. Elles sont maintenant dessinées à part (volcan.js, `osPlanteVolcan`), en prismes et en boules de pierre, avec le grain de leur biome. Chacune garde la conduite de sa forme : elle respire, se ferme la nuit, mord, fouette ou crache comme avant (flore.js).
- **Étoile** : une rosette d'écailles de pierre, qui se referme la nuit sur sa braise.
- **Clochettes** : des lanternes de pierre creuse pendues à une hampe, une lueur dans chacune.
- **Éventail** : des lames de pierre ponce dressées en éventail, criblées de pores.
- **Crosse** : trois crosses de perles de pierre enroulées comme des ammonites. Elles fument (cendre), gouttent d'acide (soufre) ou fument de vapeur (travertin).
- **Orbe** : des œufs de croûte fendus, le cœur en fusion à nu, le couvercle soulevé. Sur le travertin, un petit jet en sort.
- **Arbuste** : une concrétion faite d'un tronc de nodules, de branches noueuses et de grappes au bout.
- **Lys-cratère** (géante) : une hampe d'orgues et un cratère de pétales épais, avec une mare qui bat au fond et des braises qui montent.
- **Saule** (géante) : des crins de verre roux qui pendent, une larme au bout de chacun, sous une couronne de cendre.
- **Méduse** (géante) : une cloche côtelée que porte la vapeur d'un évent. Ses bras sont des chapelets.
- **Arbre-coulée** (géante) : au bout de chaque branche, une vasque qui déborde, puis un filet qui tombe jusqu'au sol et sa flaque.
- **Gueule** (vive) : elle sort d'une fissure. Mâchoires en dalles, dents et cornes d'obsidienne, langue de feu.
- **Fouet de scories** (vive) : des chapelets de nodules aux jointures qui couvent, avec une masse hérissée au bout.
- **Cracheuse** (vive) : une fumerolle en gradins dont la bouche enfle avant de cracher.

Chaque biome a sa matière :
- **La cendre** : ce qui luit a le rendu de la lave.
- **La soufrière** : des aiguilles de soufre. La croûte est plus sombre que le sol, pour qu'on la voie.
- **Le travertin** : des perles et des vasques d'eau chaude.

**Deux plantes communes redessinées**, qui reprenaient elles aussi une forme commune :
- L'**herbe de cendre** est faite de crins de verre roux qui jaillissent d'un tas de cendre, avec une larme de verre au bout.
- Le **piment de lave** a des tiges grasses et sombres, gonflées aux nœuds, et des gousses sèches qui pendent. Ses piments mûrs restent les baies rouges.

**Trois matières.** On les montre au sac (Matières) dès qu'on en a, ou sur l'île volcanique. Elles vont aussi au coffre et au relevé des gains.

| Matière | D'où elle vient |
|---|---|
| **Soufre natif** | le soufre en aiguilles, à la main |
| **Éclats d'obsidienne** | les lames d'obsidienne, à la pioche (comme les éclats) |
| **Basalte** | les orgues de basalte ; un magmaton abattu (3 à 5) ; le Tisonnier |

Le Tisonnier abattu donne désormais le cœur, 30 éclats, 20 éclats d'obsidienne et 30 basalte (au lieu de 30 pierres).

**À l'établi**, quatre recettes :

| Objet | Établi | Coût | Effet |
|---|---|---|---|
| **Lame d'obsidienne** | 2 | 18 obsidienne, 6 basalte, 6 os | dégâts 88, très vive. Le verre noir entaille : la bête saigne trois secondes. Elle se tient comme la lame d'éclat, avec un fourreau et une traînée violette. |
| **Cuirasse de basalte** | 3 | 36 basalte, 8 obsidienne, 30 fibre, 6 os | −70 % de dégâts. La chaleur des coulées, le sol en feu et l'eau brûlante mordent trois fois moins, la lave deux fois moins. |
| **Masque filtrant** | 2 | 4 obsidienne, 6 soufre, 14 fibre, 2 os | les gaz des solfatares et des fumerolles ne prennent plus à la gorge. Il prend la place du sifflet et se met ou s'ôte d'une case. Il se voit sur le visage, y compris chez les autres joueurs. |
| **Pâte de soufre** | table de soin 2 | 5 soufre, 8 fibre, par deux | +30 % de vie, chasse le poison et la brûlure |

Quand le soufre prend à la gorge, le jeu le rappelle : « un masque filtrant vous en protégerait ».

**Les vignettes.** Les trois matières, les quatre objets, les denrées du volcan et les 36 denrées des plantes rares du volcan ont leur propre vignette :
- les denrées : braise de tison, pétales de feu, bulbe de vapeur, voile thermophile, graines de cendre, piments de lave, les trois viandes et le cœur du Tisonnier ;
- les plantes rares : une vignette par forme, aux couleurs du biome.

**Les performances (téléphone).** La fumée, la vapeur et la cendre ont un budget. Les bombes, la lave et les dégâts ne changent jamais.
- En canvas, ou sur un appareil qui fait moins de 40 images par seconde, elles sont émises moitié moins.
- Passé un plafond de particules (1 600 ; 700 sur un appareil lent ; 280 en canvas), elles attendent que la place se libère.

**Mesuré** (navigateur sans carte graphique, exploration 8) :

| Situation | Mise à jour | Particules |
|---|---|---|
| L'éruption, à mi-pente | 0,95 ms | 550 au plus |
| La pluie de cendre | 0,7 ms | — |
| Une île ordinaire, pour comparer | 2 ms | — |

- En canvas, la pente du volcan montre deux fois plus de faces qu'une île ordinaire (environ 100 ms contre 60). Les particules n'y comptent plus que pour 20 ms environ.
- Récolte, fabrication (en essai), saignement, masque contre le gaz et combat du Tisonnier vérifiés, sans erreur.
- Les îles ordinaires, le canvas et la 1re personne fonctionnent sans erreur.

## §201 · L'obsidienne à la forge

L'obsidienne entre à la forge comme matière de charge, au même titre que la ferraille, la pierre, l'os et l'éclat. Ce n'est pas une dose comme le Korlaz ou le Vyrel. Elle se place juste après la ferraille dans la liste, et on la prend dans ses éclats d'obsidienne (10 par portion).

**Le cran au-dessus de la ferraille.**

| | Tranchant | Dureté | Poids | Chauffe |
|---|---|---|---|---|
| Ferraille | 0,55 | 0,62 | 0,6 | 0,64 |
| Obsidienne | 0,62 | 0,88 | 0,5 | 0,7 |

- **Plus dure.** C'est la résistance : l'arme s'use moins (environ 13 % de coups en plus avant d'être à réparer) et frappe un peu plus fort.
- **Un peu plus tranchante, plus légère** : la cadence est un peu plus vive.
- **Elle veut une chauffe plus vive**, plus proche de l'orange.
- Seul le fer damné, plus rare, est plus dur.

L'alliage prend sa couleur (un noir violacé) et son nom : « obsidienne », « acier d'obsidienne », « obsidienne d'éclat »… Elle se mêle librement aux autres matières, au Korlaz, au Vyrel et aux pigments.

**Le code.** Les armes d'avant gardent leur code de treize ou quatorze signes. Une arme qui contient de l'obsidienne peut en prendre quinze. Le code se lit et se tape de la même façon (FG-XXXX-XXXX-XXXXXXX).

**Vérifié :**
- le codage et le décodage, de une à quatre portions, seules ou avec éclat, Vyrel, Korlaz et pigment ;
- les anciens codes, inchangés ;
- le coût de la charge et la forge ouverte, sans erreur.

## §202 · Le basalte et le soufre à la forge

**Le basalte : une charge lourde.** Il se prend sur les réserves de basalte, à 8 par portion, et s'affiche après la pierre.
- Il est lourd et dur, mais sans tranchant : tranchant 0,3, dureté 0,74, poids 1,05, chauffe 0,58.
- Sur une épée ou une lame, il fait une arme médiocre : elle est lente et frappe mal.
- Sur une arme qui frappe de sa masse (marteau, fléau, bâton), son poids s'ajoute au choc : jusqu'à +40 % de dégâts, avec 4 portions sur 4. Les dégâts gagnés compensent largement la lenteur.

Mesuré sur un marteau de trois portions, forgé juste à 80 %, trempé à l'eau :

| Charge | Dégâts | Cadence | Usure |
|---|---|---|---|
| ferraille | 225 | 0,71 s | 2 331 |
| pierre | 193 | 0,77 s | 2 184 |
| basalte | 285 | 0,80 s | 2 457 |

Le basalte donne environ 13 % de dégâts par seconde en plus que la ferraille, en coups plus lourds.

**Le soufre : un bain de trempe.** Le bain de soufre (6 soufre natif) s'ajoute aux cinq autres.
- La compétence porte sur le coup, comme avec l'eau.
- Le soufre y met le feu, même sans âme : une arme trempée au soufre embrase ce qu'elle frappe (feu I).
- Avec une âme, le feu s'y ajoute. Il peut devenir le second élément, ou prendre le dessus. Il annule le givre, son contraire.
- La trempe dure une seconde de plus qu'à l'eau.
- Elle rend l'arme un peu plus cassante : 200 coups de moins avant l'usure, comme la neige.
- L'arme prend un nom de feu (« … de Fournaise ») et un fil orange.

**Le code.** Les armes d'avant ne changent pas. Le basalte prend trois bits de plus dans le code, qui reste lisible et tapable sur quinze signes au plus. Le bain de soufre tient dans les bits du bain.

**Vérifié :**
- le codage et le décodage du basalte seul, mêlé à l'obsidienne, au Vyrel et à un pigment, et du bain de soufre ;
- les anciens codes, inchangés ;
- les dégâts, la cadence et l'usure ;
- la compétence de feu sans âme ;
- la forge ouverte, sans erreur.

## §203 · L'alchimie rééquilibrée : le soufre et le Vyrel ; le sérum du Korlaz passe à la table

**Ce que coûte une potion.** Jusqu'ici, à partir du rang 3, toutes les potions demandaient des spores de Korlaz. Désormais, chaque potion demande la matière qui va avec ce qu'elle travaille :

| Matière | D'où elle vient | Potions |
|---|---|---|
| **Soufre natif** | le volcan | le corps : Vie, Force, Récupération, et la Défense d'une compagne |
| **Spores de Korlaz** | l'île au Korlaz | l'esprit et la main : Mana, Récolte, Saut, et l'éveil d'une compagne |
| **Ichor de Vyrel** | l'île au Vyrel | le souffle et le pas : Souffle, Vitesse |

La dose suit la rareté de la matière : le soufre abonde, l'ichor est rare. Il en faut une dose au rang 3, deux au rang 4, trois au rang 5. Les éclats ne changent pas.

| Rang | Éclats | Soufre | Spores | Ichor |
|---|---|---|---|---|
| 1 | 6 | — | — | — |
| 2 | 12 | — | — | — |
| 3 | 20 | 6 | 4 | 3 |
| 4 | 30 | 12 | 8 | 6 |
| 5 | 45 | 18 | 12 | 9 |

Une potion ne demande qu'une seule de ces matières, celle de sa ligne. Les potions des compagnes suivent le même barème. L'en-tête de la table montre les éclats, plus les matières qu'on a ou que demande la potion choisie.

**Le sérum de clairvoyance quitte la cuisine.** Le remède du Korlaz n'est plus une recette de cuisine à quatre ingrédients. C'est maintenant une recette fixe de la table d'alchimie, comme la Thériaque du Vyrel.
- **La recette** : une table de niveau 1 et 6 spores de Korlaz. On verse un champignon, 6 éclats, une fleur, 6 éclats, une douceur puis un champignon, tous au moins peu communs.
- **Le résultat** : réussi, il donne une dose, deux s'il est parfait. Les doses rejoignent les soins, comme la Thériaque.
- **L'effet** : pour soi ou pour un équipier à portée, il guérit du Korlaz, chasse les visions et rend 20 % de vie.
- **Un équipier infecté** peut être soigné même s'il a toute sa vie : l'infection se voit désormais d'un joueur à l'autre.
- **Sur la table**, il paraît dans « Les remèdes » une fois le Korlaz croisé : arrivée sur l'île rongée, infection, ou spores dans le sac.
- **Les messages** de l'infection disent où le préparer.

**Les sauvegardes.** Les doses de sérum gardées en cuisine passent aux soins, et la recette sort du carnet de cuisine. Rien n'est perdu.

**L'essai** : une carte « Sérum de clairvoyance » donne deux doses.

**Vérifié :**
- le barème de chaque potion, du rang 1 au rang 5 ;
- un sérum brassé jusqu'au bout : 6 spores payées, une dose de plus ;
- un sérum utilisé : le Korlaz est guéri ;
- deux doses de cuisine passées aux soins au chargement (3 parts au total), la recette retirée ;
- la table d'alchimie, sans erreur.

## §204 · Les dons (lot 1 : le moteur)

**Le principe.** Les dons sont des compétences permanentes, à part des caractéristiques.
- **La formule.** Chaque don a sa formule, à trouver en trésor ; elle se garde, même à la mort.
- **La préparation.** On prépare un élixir de don à la table d'alchimie, comme une potion : ingrédients dans l'ordre, gestes, chance de réussite. On le boit sur place.
- **La puissance** dépend de la chance qu'avait le breuvage, de 55 à 150 %, comme pour les potions.
- **Le code.** Il est dans le nouveau fichier `dons.js`.

**Les sept familles.**
- Six familles vont par couples opposés :
  - le **Vent** (la mobilité) et la **Terre** (l'ancrage) ;
  - l'**Ombre** (la furtivité) et la **Lumière** (la vigilance et le soin) ;
  - l'**Instinct** (la bête et le sang) et l'**Esprit** (les arcanes).
- **Boire un don d'une famille dissout tous les dons de la famille opposée.**
- **Chaque famille a cinq dons** : un de niveau 1, puis une fourche de deux voies au niveau 2, puis le bout de chaque voie au niveau 3.
  - La voie qu'on n'a pas prise est fermée : la table refuse ses dons.
  - On a donc trois dons au plus par famille, neuf en tout sur trente.
- **Le Héros**, à part :
  - cinq dons exceptionnels ;
  - un seul à la fois : en boire un autre dissout le premier ;
  - aucune famille ne le dissout ;
  - il faut un don de niveau 3 pour en préparer un.

**Les dons.** Ce lot donne l'effet des six dons de niveau 1. Les autres sont décrits dans l'arbre et attendent leur lot ; leurs formules ne se trouvent pas encore.

| Famille | Niveau 1 (en jeu) | Voie a (niv. 2 → 3) | Voie b (niv. 2 → 3) |
|---|---|---|---|
| Vent | **Pied léger** : saut +12 %, pas +6 % | Troisième saut → Vol plané | Ruée → Ruée fantôme |
| Terre | **Racines** : les coups ne vous repoussent plus (le recul tombe à 15 %) | Peau de pierre → Colosse | Choc → Faille |
| Ombre | **Pas feutré** : les bêtes vous repèrent de 40 % moins loin et vous entendent moitié moins | Fondu → Assassin | Esquive → Contre |
| Lumière | **Lueur** : la nuit, on éclaire autour de soi sans lanterne (5 à 7 cases), et les autres joueurs le voient | Vigie → Œil du chercheur | Main guérisseuse → Aube intérieure |
| Instinct | **Flair** : la flore rend son produit moitié plus souvent, et chaque bête abattue donne une viande de plus | Meneur → Chef de meute | Fureur → Sang chaud |
| Esprit | **Mémoire** : les sorts coûtent 10 % de mana en moins | Écho → Archimage | Résonance → Âme liée |
| Héros | Phénix, Temps suspendu, Ailes de l'aube, Titan, Roi des bêtes | | |

Les chiffres des niveaux 1 sont donnés pour une puissance de 100 %. Ils suivent la puissance du don.

**Les recettes.**

| Niveau | Table | Base | Recette | Coût |
|---|---|---|---|---|
| 1 | 1 | 70 % | quatre étapes, ingrédients au moins peu communs | 15 éclats |
| 2 | 2 | 55 % | cinq étapes, rares | 30 éclats |
| 3 | 3 | 45 % | six étapes, dont un ingrédient légendaire | 50 éclats |
| Héros | 3 | 30 % | trois fers damnés, deux légendaires, deux exotiques, 15 éclats versés | 80 éclats |

Chaque niveau demande aussi la matière de sa famille, une dose par niveau :

| Famille | Matière par niveau |
|---|---|
| Terre | 8 basalte |
| Ombre | 4 spores |
| Lumière | 3 nectars |
| Instinct | 3 ichors |
| Esprit | 4 obsidiennes |
| Vent | une **plume de vautour** dans la recette (deux au niveau 3), à la place d'une matière |

La plume de vautour est une nouvelle denrée : un vautour sur deux environ en laisse une, une sterne sauvage parfois.

**Ce qu'on sait d'un don** s'apprend peu à peu. Il y a trois choses à savoir :
1. ce qu'il fait : la formule le dit ;
2. son niveau et ce qu'il demande avant lui ;
3. ce qu'il ferme et ce qu'il dissout.

Les nomades diront le reste au lot 2. Ce qu'on a vécu s'apprend aussi : une famille dissoute apprend les liens des deux familles. La table ne prévient en clair que de ce qu'on sait. Sinon : « quelque chose en vous résiste à ce breuvage », ou « il lui manque quelque chose en vous ».

**À la table.**
- La colonne de gauche montre « Les dons » dont on a la formule.
- Le bouton **Les dons**, en haut, ouvre l'arbre des sept familles dans le brouillard. Un don qu'on ne sait pas situer reste un « ? ». Les liens (fourches, oppositions) s'affichent une fois sus.
- Le carnet note chaque don essayé.

**Bêta.** Une carte « Les dons » donne les formules prêtes avec tout leur savoir, ou fait oublier ses dons.

**Vérifié :**
- un don préparé jusqu'au bout et bu, avec sa puissance ;
- la Terre bue après le Vent : le Pied léger dissous, et l'avertissement vague puis su ;
- une formule pas encore prête refusée ;
- l'effet des six dons de niveau 1 ;
- la sauvegarde relue à l'identique ;
- l'arbre à l'écran ;
- les îles ordinaires et le volcan, sans erreur.

## §205 · Les dons (lot 2 : les trésors et les nomades)

**Où trouver les formules.**

| Où | Ce qu'on y trouve |
|---|---|
| **La cache d'alchimiste** : un coffret de pierre cerclé de fer, une fiole qui luit posée dessus (la nuit, un fil de lumière en monte, visible de loin). Une île sur quatre dès l'exploration 3. | Une formule de niveau 1. |
| **La cache, sur l'île d'une famille** : le volcan (Terre), le Korlaz et la brume (Ombre), l'Achromie (Lumière), le Vyrel (Instinct), les îles volantes (Vent). Trois îles sur cinq. | Une formule de niveau 2 de cette famille. |
| **La cache, au plus haut des îles volantes** (exploration 10). | Une fois sur deux, le bout d'une voie du Vent. |
| **Les coffres gardés du Centre et des Cercles** : un grand coffre une fois sur trois environ, un coffre du gardien une fois sur sept. | Une formule de l'Esprit (niveau 2). |
| **Les gardiens** : le Tisonnier (Terre), la Mère-Charogne (Instinct), la Tisseuse (Ombre), le prisme reposé de l'Achromie (Lumière), le reliquaire du Roi (Esprit). | Le bout d'une voie de leur famille (niveau 3). |
| **Un égaré tiré d'affaire.** | Quatre fois sur dix, une formule de niveau 1, à la place de sa curiosité. |

- **Laquelle.** Une cache donne la première formule de son rang que vous n'avez pas encore. Ouverte, elle reste vide.
- **Les dons pas encore en jeu.** Tant qu'un rang n'a pas son effet en jeu, sa formule ne se trouve pas. Ce n'est pas perdu : on reçoit à la place la formule prête la plus proche, de la même famille d'abord. Aujourd'hui, toutes ces sources donnent des formules de niveau 1. Elles donneront les autres à mesure que leurs lots arrivent.
- **Le Héros** viendra au lot 6, chacun derrière son défi.

**Ce que disent les nomades.**
- À l'accueil, le marchand, le dresseur, le cartographe, le conteur et le devin proposent « Les dons… tu en sais quelque chose ? », dès l'exploration 3.
- **Une chose par question.** Une seule par halte chez le marchand, le dresseur et le cartographe, deux chez le conteur et le devin.
- **Dans quel ordre.** D'abord ce qu'on ignore des formules et des dons qu'on a, puis de leur famille, puis le reste : ce que fait un don, puis sa place, puis ce qu'il ferme et dissout.
- **La fourche.** Apprendre ce que ferme un don de niveau 2 ou 3 apprend aussi l'autre voie.
- **Les légendes du Héros**, seuls le conteur et le devin les content, une par expédition.
- **Où chercher.** Parfois, plutôt qu'un savoir, ils disent où trouver les formules : les caches, les îles des fléaux, les gardiens, les coffres des Horlogers.
- Chaque chose apprise s'inscrit à l'arbre de la table d'alchimie, et le jeu le signale.

**Vérifié :**
- une cache posée sur l'île du volcan, ouverte, sa formule reçue, puis vide ;
- les coffres gardés : 5 formules sur 40 grands coffres ;
- le repli sur une formule prête ;
- la récompense d'un égaré ;
- les répliques des nomades, leur budget par halte, et le savoir qui s'accumule sur douze haltes ;
- la cache à l'image, la nuit ;
- le combat du Tisonnier ;
- les îles ordinaires et le volcan, sans erreur.

## §206 · Les dons (lot 3 : le Vent, la Terre, l'Ombre)

Les douze dons de niveau 2 et 3 de ces trois familles sont en jeu. Leurs formules se trouvent désormais :
- dans les caches des îles de leur famille (niveau 2) ;
- sur les gardiens : le Tisonnier pour la Terre, la Tisseuse pour l'Ombre (niveau 3) ;
- au plus haut des îles volantes pour le Vent (niveau 3).

**La nouvelle touche W** (sous le X en AZERTY, Z en QWERTY) sert à la ruée et à l'esquive. Sur téléphone, un bouton RUÉE / ESQUIVE paraît à gauche de l'ACTION dès qu'on a l'un des deux ; il pâlit quand il se recharge. Avec les deux dons (ce sont deux familles qui ne s'opposent pas), la touche fait la ruée en l'air ou en courant, l'esquive sinon.

**Le Vent**
- **Troisième saut** : un saut de plus en l'air, après le double saut. On monte de 3,7 cubes au lieu de 2,1.
- **Ruée** : un bond à l'horizontale, dans la direction du pas (ou du regard). Environ trois cases en un sixième de seconde, intouchable pendant le bond, une recharge d'une seconde.
- **Vol plané** (après le troisième saut) : en tombant, SAUT maintenu, on plane. Deux voiles claires s'ouvrent aux épaules, et les autres joueurs les voient. On descend à 1,9 case par seconde au lieu de tomber : six cubes de chute en un peu plus de trois secondes, au lieu de deux tiers de seconde.
- **Ruée fantôme** (après la ruée) : deux ruées d'affilée. Elles traversent les bêtes, qui restent sonnées une seconde et prennent un petit coup.

**La Terre**
- **Peau de pierre** : −15 % de dégâts tant qu'on ne court pas.
- **Choc** : retomber de haut (à partir d'un cube environ) frappe le sol. L'onde, sur 2,4 cases, sonne les bêtes près d'une seconde et les blesse un peu. Le sol tremble.
- **Colosse** (après la peau de pierre) : un quatrième cœur. Il est rendu tout de suite, puis au feu comme les autres. Le plat « un cœur en plus » en donne encore un, le premier à partir.
- **Faille** (après le choc) : la retombée ouvre en plus, devant soi, une faille de feu en zigzag sur quatre cases, pendant trois secondes. Ce qui y passe brûle.

**L'Ombre**
- **Fondu** : une seconde et demie immobile dans l'ombre (la nuit, sous les grands arbres, sous terre), et l'on disparaît, pâle comme un fantôme. On le reste en marchant. On réapparaît en courant, en frappant ou au grand jour. Les bêtes ne vous cherchent plus.
- **Esquive** : une roulade de trois cases environ, intouchable un peu plus longtemps que la ruée. Recharge : un peu moins d'une seconde.
- **Assassin** (après le fondu) : le premier coup sur une bête qui ne vous a pas vu (ni alertée, ni en colère, ni en train d'attaquer, ni sur votre piste) porte trois fois.
- **Contre** (après l'esquive) : un coup esquivé pendant la roulade est rendu double à qui l'a porté, et le sonne une seconde.

Tout suit la puissance du don, de 55 à 150 % : la hauteur du troisième saut, la recharge de la ruée, la lenteur du plané, la peau de pierre, l'onde du choc, la durée de la faille, le temps qu'il faut pour se fondre.

**Vérifié** (simulation sur une dalle plate) :
- la hauteur des sauts ;
- la distance de la ruée, et un coup reçu pendant la ruée sans effet ;
- la ruée fantôme qui traverse et sonne ;
- l'esquive, puis le contre (la bête à 68 %, sonnée 1,2 s) ;
- la peau de pierre (0,39 au lieu de 0,46) ;
- la chute en planant ;
- le choc (sonnée, blessée) et la faille qui brûle ;
- le quatrième cœur ;
- le fondu la nuit : la bête ne vous veut plus ;
- l'assassin (×3, et ×1 sur une bête alertée) ;
- les voiles et la faille à l'image ;
- les îles ordinaires, le volcan et le Tisonnier, sans erreur.

## §207 · Les dons (lot 4 : la Lumière, l'Instinct, l'Esprit)

Les douze derniers dons ordinaires sont en jeu : les trente dons des six familles marchent tous. Restent les cinq dons du Héros (lot 6).

**La Lumière**
- **Vigie** : toutes les deux secondes et demie, la bête la plus proche qui vous guette (à 22 pas environ) est désignée. Un message dit où elle est, quelques étincelles rouges montent au-dessus d'elle, une étoile rouge la suit douze secondes sur la boussole. Une même bête n'est pas redite avant 25 secondes.
- **Main guérisseuse** : soins, plats, poissons, baies et fruits soignent moitié plus.
- **Œil du chercheur** (après la vigie) : à quarante pas, on voit ce qui vaut le détour, même derrière le relief. Une colonne de lumière monte de chaque trouvaille, une étoile de sa couleur sur la boussole (les huit plus proches). On voit ainsi :
  - les caches d'alchimiste (violet) ;
  - les lutrins pas encore lus ;
  - les coffres du donjon (orange) ;
  - les plantes rares (vert) ;
  - les filons de fer, l'obsidienne, les druses géantes, les condensateurs ;
  - les druses lavande et dorées.
- **Aube intérieure** (après la main guérisseuse) : une fois par expédition, tomber à zéro vous relève à mi-vie au lieu de coûter un cœur, intouchable une seconde et demie. Elle revient en rentrant au campement. Elle est gardée dans la sauvegarde : recharger ne la rend pas.

**L'Instinct**
- **Meneur** : sept compagnes en jeu au lieu de six, et des liens un quart moins chers (le quatrième : 12 éclats au lieu de 16).
- **Fureur** : sous 30 % de vie, +30 % de dégâts et de vitesse. Un message quand elle monte, des braises rouges autour de soi tant qu'elle dure.
- **Chef de meute** (après le meneur) : à huit pas de vous, vos compagnes frappent 20 % plus fort et encaissent 20 % de moins.
- **Sang chaud** (après la fureur) : chaque bête abattue rend 5 % de vie. Pas les plantes, ni les nomades.

**L'Esprit**
- **Écho** : un sort sur quatre ne coûte pas de mana (un anneau violet le montre, et le nom du sort dit « écho »).
- **Résonance** : la compétence de l'arme forgée qu'on tient gagne un niveau, jusqu'à V (un niveau de plus qu'à la forge).
- **Archimage** (après l'écho) : les sorts du grimoire frappent 30 % plus fort et portent 30 % plus loin. Cela vaut pour la portée du trait, le rayon de l'onde, la longueur du mur, la durée de l'égide. Le Souffle repousse plus loin et plus fort.
- **Âme liée** (après la résonance) : un coup d'arme forgée (de près ou tiré) rend un éclat, une fois sur trois environ. Au plus un toutes les 0,6 seconde.

Tout suit la puissance du don : par exemple l'écho tombe un sort sur trois à forte puissance, un sur cinq à faible.

**Vérifié** (simulation) :
- le soin (+20 % devient +30 %) ;
- la vigie et son étoile ;
- le chercheur (six trouvailles, la cache vue) et sa colonne violette à l'image ;
- l'aube (relevé à 50 %, cœur gardé, puis la chute suivante coûte un cœur) ;
- le meneur (7 en jeu, 16 → 12 éclats) ;
- la fureur (×1,30) ;
- le chef de meute (×1,2 / ×0,8, rien de loin) ;
- le sang chaud (0,50 → 0,55) ;
- l'écho (un sur quatre) ;
- l'archimage (0,60 → 0,78) ;
- la résonance (III → IV) ;
- l'âme liée ;
- les îles ordinaires, le volcan, le Tisonnier et les dons du lot 3, sans erreur.

## §208 · Les dons (lot 6 : le Héros)

Les cinq dons du Héros sont en jeu : les 35 dons marchent tous. On n'en porte qu'un à la fois, et il faut déjà un don de niveau 3 pour qu'il prenne. Sa recette demande 3 fers damnés et 2 ingrédients légendaires.

**La touche P** (ou le bouton doré HÉROS, au-dessus de l'ACTION sur téléphone) déclenche le Temps suspendu, le Titan et le Roi des bêtes. Le bouton affiche la recharge et pâlit tant qu'elle court. Le Phénix et les Ailes marchent seuls ; P dit alors où ils en sont.

La recharge court en temps réel, même jeu fermé, et elle est gardée dans la sauvegarde. La puissance du don (55 à 150 %) l'abrège ou l'allonge, et allonge aussi ce que le don dure.

**Les cinq dons**
- **Phénix** : tombé à zéro, on renaît sur place, toute la vie rendue, intouchable deux secondes. Une gerbe de feu blesse et embrase les bêtes à quatre pas. Recharge : dix minutes. Il passe avant l'Aube intérieure (Lumière), si l'on a les deux.
- **Temps suspendu** : cinq secondes, le monde tourne au quart de sa vitesse. Cela ralentit les bêtes sauvages, les gardiens et les tirs d'en face. Vous, vos compagnes et vos propres tirs gardez votre vitesse. L'écran pâlit pendant ce temps. Recharge : deux minutes.
- **Ailes de l'aube** : en l'air, SAUT maintenu, on vole vraiment. On monte de 2,2 cases par seconde, huit secondes en tout (une vingtaine de cubes), et tout se recharge en touchant le sol. Deux grandes ailes d'or battent aux épaules, et les autres joueurs les voient. Si l'on a aussi le Vol plané, il prend le relais quand les ailes sont vides.
- **Titan** : douze secondes, on grandit de moitié. Les coups font deux fois plus mal, et on ne recule presque plus sous les coups. Les autres joueurs vous voient grandir. Recharge : trois minutes.
- **Roi des bêtes** : un regard sur une bête sauvage (la cible désignée, sinon la plus proche devant soi, à douze pas), et elle se range à vos côtés quatre-vingt-dix secondes. Elle vous suit et vous défend, sans prendre de place parmi vos compagnes. Une couronne d'étincelles d'or flotte au-dessus d'elle. À la fin, elle retourne à la vie sauvage, calmée. Si elle tombe au combat, elle meurt (elle ne va pas au sac). Ni les gardiens, ni les dragons, ni les automates, ni les bêtes des fléaux n'y cèdent. Recharge : quatre minutes.

**Où trouver les formules** (chacune est gardée par une épreuve, et gardée même si l'on meurt) :
- **Phénix** : un œuf de feu dans un nid de basalte, au milieu du lac de lave du volcan. Il reste noir et froid tant que vit le Tisonnier. Une fois le gardien abattu, il s'éveille, pâle et lumineux. Il ne se laisse prendre que par qui porte la cuirasse de basalte : sans elle, il brûle les mains. Il faut aussi traverser la lave : la cuirasse en divise la brûlure par deux, un plat de braise l'annule.
- **Temps suspendu** : le grand coffre de la salle de l'Horloge, tout au fond du Centre des automates, à partir de l'exploration 12.
- **Ailes de l'aube** : une plume d'or qui flotte sur un socle blanc, au point le plus haut de deux îles volantes sur cinq, à partir de l'exploration 12.
- **Titan** : une fois le Roi démon abattu, s'asseoir sur son trône (ACTION, au pied du trône).
- **Roi des bêtes** : Hadrik, un vieux dompteur du Seuil à la barbe blanche et au long bâton. Il vient aux haltes des nomades à partir de l'exploration 10, tant que ses épreuves ne sont pas finies. Il en donne trois, une à chaque rencontre :
  - nourrir de sa main dix bêtes sauvages ;
  - avoir cinq compagnes liées à la fois ;
  - abattre trois prédateurs avec au moins deux compagnes en jeu.

  Ses épreuves avancent entre les haltes et sont gardées dans la sauvegarde. Un nomade tué ne revient jamais : Hadrik non plus.

Les conteurs et les devins disent désormais, dans leurs légendes du Héros, où chercher chaque formule. L'Œil du chercheur (Lumière) voit aussi l'œuf et la plume, en doré.

**Vérifié** (simulation) :
- **Phénix** : relevé à pleine vie sans perdre de cœur ; la chute suivante, pendant la recharge, coûte un cœur ; la recharge est gardée.
- **Temps suspendu** : une bête vit 0,25 s par seconde au lieu de 1 ; la teinte et le bouton s'affichent.
- **Titan** : force ×2 ; taille 0,72 → 1,10 ; recul réduit.
- **Roi des bêtes** : la bête liée suit, sans compter parmi les compagnes ; libre à la fin, morte si elle tombe.
- **Ailes** : 18,9 cubes de montée au lieu de 1,2 ; rechargées au sol.
- **Les formules** : la plume ; le coffre de l'Horloge (rien à l'exploration 11, ni dans une autre salle) ; le trône (rien tant que vit le Roi) ; l'œuf (froid, puis brûlant sans cuirasse, puis pris avec) ; Hadrik et ses trois épreuves jusqu'à la formule, et sa venue à une halte avec son dialogue.
- **À l'image** : les ailes, l'œuf dans son nid.
- **Régressions** : les îles, le volcan, le Tisonnier et les lots 3 et 4, sans erreur.


## §209 · Orvane — le monde vivant

Les bêtes de Stone Valley vivent désormais dans **Orvane**, un moteur d'écosystème et d'évolution indépendant du jeu (dépôt `orvane`, dossier `mondes/sv-1/`). Chaque nuit, Orvane fait avancer le monde d'un cycle — naissances, morts, prédation, migrations, saisons, épidémies, lignées qui se séparent — et publie un **instantané**. Le jeu le lit au lancement et l'applique ; ce que font les joueurs remonte en **pressions**, et le monde en tient compte la nuit suivante.

**Ce que ça change à l'écran.** Rien le premier jour (vérifié : mêmes poids, mêmes comptes, mêmes taux de variantes qu'avant). Ensuite, île par île, selon ce qu'Orvane dit des biomes de l'île :
- **combien** de bêtes de chaque espèce vivent sur l'île (`sp.cap`) et la chance qu'une espèce soit tirée au bestiaire (`POIDS_ESPECE`) suivent les effectifs d'Orvane, rapportés à la génération 0 ; tout repart des valeurs d'origine à chaque île ; une espèce éteinte, ou tombée sous 40 **et** sous le quart de ce qu'elle était, n'apparaît plus (une espèce rare dès le départ, comme le varan ou la salamandre, reste) ; la même île donne la même faune à tous ceux qui ont le même instantané ;
- les **variantes** (robes albinos, mélanique, dorée ; géant, nain) gardent les chances d'avant (1/1140 par robe, 1/18000 par forme) multipliées par l'écart d'Orvane depuis la génération 0 : une robe devenue deux fois plus fréquente dans le monde l'est deux fois plus à l'écran, une robe éteinte ne naît plus. Le changement glisse sur trois jours. Les bêtes déjà nées gardent leur robe. La règle « plus de variantes loin de chez soi » (`chanceVariante`) est conservée.

**Ce qui remonte.** Les bêtes croisées (à moins de douze pas, une fois chacune), celles que le joueur ou ses compagnes tuent (flèche, coup, piétinement, tour, satellite… — pas la faim, pas une bête de l'île qui en tue une autre : celle-ci meurt désormais de la cause `proie`, et Orvane simule déjà la prédation), celles qu'il lie. Le lot s'accumule en `localStorage` et part avec une sauvegarde, une fois par demi-heure au plus (`vp_orvane_pression`, 48 dépôts par compte et par jour ; un refus garde le lot). Un seul joueur pèse peu ; dix joueurs qui vident leurs îles chaque soir finissent par raréfier une espèce — et les variantes qu'ils épargnent gagnent du terrain.

**Le branchement** (tous les points gardés par `typeof … === 'function'` : sans Orvane, le jeu est exactement ce qu'il était ; les points 7 et 8 sont ceux du §210) :
1. les trois scripts après `flore.js`, précédés de `ORVANE_CHEMIN` (l'adresse du monde publié) ;
2. `orvaneAppliquer()` à l'arrivée sur l'île, avant `tirerBestiaire()` ;
3. `orvaneVariante(sp, r)` en tête de `tirerVariante` ;
4. `orvaneEvenement('prelevement', b, cause)` dans `mourirBete` ;
5. `orvaneEvenement('capture', b)` dans `lier` ;
6. `orvaneEnvoyer(rpc, Compte.uid)` après une sauvegarde réussie ;
7. `orvaneEspeces()` une fois les fiches posées (après le `sp.bio.push(15, 16)` des automates) ;
8. `osOrvane(f)` dans `osDeBase`, pour une lignée au corps construit.

Et les causes de mort : `proie` (au lieu de `chassé`) quand une bête de l'île tue — `porterCoup`, le Silencieux, le Mille sauvage ; `compagne` quand c'est une bête liée (le Silencieux lié, le Mille lié).

Côté Supabase : exécuter `traducteurs/stone-valley/supabase.sql` du dépôt Orvane (la table n'est accessible que par deux fonctions : le jeu dépose par `vp_orvane_pression`, Orvane lit par `orvane_lire_lots` avec son propre secret, les comptes pseudonymisés). Côté dépôt Orvane : le secret `ORVANE_LECTURE_SECRET` (le secret de lecture : jamais la clé de service du jeu), GitHub Pages activé — le monde est alors à `https://stonevalleyoff-ai.github.io/orvane/mondes/sv-1/instantane.json`, et l'observatoire à `…/orvane/monde/?monde=sv-1`.

**Vérifié** : chaque bloc `<script>` de `index.html` compile ; le banc du traducteur (`traducteurs/stone-valley/banc.js <index.html>`) passe : le jour un ne change rien, poids et caps suivent la chasse, les espèces rares restent, variantes tirées sur 400 000 naissances, causes, lot valide, envoi espacé, refus gardé, retour dans le moteur, monde refait de zéro repris. Sans `instantane.json` joignable, rien ne change.


## §210 · Les lignées d'Orvane — de nouvelles créatures

Quand une population d'Orvane vit longtemps loin de sa niche, elle se sépare en **lignée** (« Crapaud-buffle de sylve fongique ») : une nouvelle espèce, avec sa masse, sa vitesse, ses sols, et sa **silhouette** (forme, pattes, proportions, cornes, crête, ailes, carapace, antennes, motif, couleurs), qui dérive à chaque séparation. Le jeu en fait une créature.

**Sa fiche.** `orvaneEspeces()` (orvane-sv.js) inscrit chaque lignée dans `SPEC` : une copie de la fiche de son plus proche ancêtre — elle broute, chasse, fuit, se lie et récolte comme lui —, à sa mesure : son nom, sa taille d'après sa masse, sa vitesse, ses couleurs, ses sols (un Tellurien prend son sol rare). Les prédateurs de l'ancêtre la chassent ; sa viande, ses aptitudes, son combat et sa voix sont ceux de l'ancêtre. Sur une île, elle prend la part de son ancêtre à proportion de ses effectifs.

**Son corps.**
- tant qu'elle ressemble à son ancêtre, elle est **rendue par lui** : son dessin, à ses couleurs et à sa taille ;
- dès qu'elle s'en écarte (autre forme, autres pattes, des ailes gagnées, ou une silhouette trop différente), son corps est **construit** par `lignees.js` (`osOrvane`) avec les mêmes boîtes que les autres bêtes : le moteur les arrondit, les variantes les recolorent, la fureur rougit ses yeux. Quadrupède, hexapode (six ou huit pattes), bipède, oiseau ou serpent ; cou, tête, museau (un bec chez l'oiseau), oreilles, cornes, crête, antennes, queue, carapace, ailes repliées (battantes en vol) ; et les organes des traits que porte la majorité de la lignée : crocs, dard, glandes, membrane, palmes, grands yeux de nuit, rayures d'alerte. Elle marche, dort, meurt ; son pictogramme est dessiné de profil (`dessinOrvane`).

**Ce qui se garde.** Les fiches des lignées vivent en mémoire locale : une compagne liée garde la sienne même si sa lignée s'éteint, et revient au chargement. Une lignée inconnue de l'appareil (la compagne d'un autre joueur, une sauvegarde venue d'ailleurs) est rendue par son parent, sous son nom.

**Aujourd'hui.** Le monde sv-1 vient de naître : ses premières lignées viendront avec le temps (une séparation demande une population installée depuis longtemps loin de sa niche). Un monde né de la genèse (`mondes/genese-7` du dépôt Orvane), branché à la place, peuple les îles de cent lignées toutes construites.

**Vérifié** : dans le jeu, sur un monde d'essai accéléré (18 lignées) — inscription, apparition, mort, lien, panneau des compagnes, sauvegarde puis rechargement avec Orvane injoignable : la compagne revient, aucune erreur. Le banc d'essai du traducteur couvre les fiches, les tailles, les sols, les prédateurs, la part sur une île et la résolution d'une lignée inconnue.


## §211 · Les conduites — ce que l'évolution fait faire aux bêtes

Dans Orvane, une glande qui crache, une carapace, des yeux de nuit ou l'instinct de groupe évoluent comme le reste. Le jeu les fait désormais **agir**, bête par bête : chaque naissance tire son phénotype complet dans le monde d'Orvane. Les robes et les tailles restent au taux d'avant, et les traits qui agissent sortent à leur fréquence réelle. Si un crapaud sur cent crache dans Orvane, un crapaud sur cent crache dans le jeu ; si les cracheurs prennent le dessus, on le voit sur l'île.

**Ce que les bêtes font** (`conduites.js`) :
- **le jet** (glande à jet) : la gorge gonfle trois quarts de seconde, en vert pâle, puis un jet part, visé là où vous serez — on peut s'écarter. Touché : un voile jaune-vert gagne les bords de la vue, statut « Irrité ». Puis la bête fuit ;
- **le dard** : qui la frappe de près est piqué — le poison du jeu ; **la peau irritante** : qui la frappe au contact s'en met plein les yeux ;
- **la carapace** : elle encaisse (coups ÷ 1,6) ; mal en point, elle se replie, ramassée au sol, presque invulnérable deux secondes et demie ; **le cuir épais** : coups ÷ 1,25 ;
- **le camouflage** : à votre approche, elle se fige et se fond dans la teinte du sol ; à trois pas, elle détale ;
- **l'alerte** (grégarisme) : quand elle fuit, un cercle clair s'ouvre autour d'elle et tout le groupe détale ;
- **la défense des petits** : approchez un petit, sa mère charge ;
- **la vue** : yeux de nuit (elle voit 40 % plus loin la nuit, ses yeux y luisent), vibrisses (15 % plus loin), albinos (20 % moins loin au soleil) ; **les crocs** : morsure × 1,25 ; **la foulée** (pattes longues) : fuite et chasse × 1,25 ; **la lenteur** : tout × 0,85 ; **le terrier** (lignée fouisseuse au corps construit) : elle s'enterre d'un coup.

**Comment le joueur l'apprend.** Désignée et de près, une bête dont on ne connaît pas encore la conduite laisse voir son **présage** (« gonfle la glande sous sa gorge », « des plaques osseuses sur le dos »). La première fois qu'on voit une conduite chez une espèce, une ligne le dit et le **carnet** la garde (« Conduites observées », sous le carnet des variantes, sauvegardé avec le compte). Ensuite, le panneau de la bête la nomme : « cracheur », « grégaire », « cuirassé ».

**Ce qu'elle devient, liée.** La compagne garde son phénotype et ses conduites, sauvegardés avec elle, même quand elle rentre au sac. Une cracheuse crache sur ce qu'elle combat, ce qui l'étourdit. Une grégaire donne l'alerte quand un chasseur ou une machine vient pour vous. Des yeux de nuit débusquent les camouflés autour d'elle. Une ligne, au lien, dit ce qu'elle garde d'Orvane.

**Ce qui remonte.** Une bête abattue ou liée est rapportée à Orvane avec son phénotype exact (et non plus d'après sa seule robe) : ce que les joueurs font aux cracheurs, aux grégaires, aux camouflés pèse sur leur évolution.

**Le branchement** (tous gardés par `typeof … === 'function'`) : `orvaneNaissance(b)` après chaque `tirerVariante` d'une naissance (4 endroits) ; dans `majBete`, la vue (`conduitesVue`), la conduite qui s'impose avant le choix de l'état (`conduitesBete`), l'allure (`conduitesVit`) ; `conduitesDur` dans `robuste`, `conduitesBlesse` en tête de `blesseParJoueur`, `conduitesCoup` en tête de `porterCoup`, `conduitesOs` dans `foeBones`, `orvaneImpact` en tête de `eclaterSpore`, `orvaneStatuts` dans `statutsJoueur`, `orvaneCibleDit` dans le panneau de la cible, `orvaneCarnet` dans `blocCarnet`, `cond` dans `photo()` et `conduitesRelire(d.cond)` dans `appliquer`.

**Vérifié** : le banc du traducteur (phénotype exact pour chaque naissance, conduites à leur fréquence réelle sur 200 000 glaneurs — grégaires 0,62 % pour 0,63 % dans le monde —, robes toujours au taux du jeu, du catalogue aux conduites, prélèvement rapporté exact). Dans le jeu, chaque conduite jouée sur le terrain : le jet (la gorge, le voile, « Irrité », le carnet, puis « cracheur » au panneau), le figé puis la fuite, l'alerte (trois congénères détalent), le repli (robustesse 1,6 → 3), la charge de la mère, la compagne qui crache et étourdit un traqueur, la sauvegarde. Aucune erreur.

**En coop**, le jet d'une bête du gardien part chez les autres joueurs avec sa nature (`faune.js` : `ov` dans le message du tir) : il les irrite, il ne les empoisonne pas.


## §212 · Les traits continus — deux bêtes d'une espèce ne sont plus identiques

Dans Orvane, chaque population porte maintenant une **taille**, une **vitesse**, une **audace** et une **sociabilité** moyennes, avec leur variance, et la sélection les déplace : le froid fait grandir, la prédation rend plus vif, l'audace nourrit mieux mais se fait prendre, et **ce que font les joueurs compte**. Si l'on chasse les plus grands brouteurs d'une prairie, la population rapetisse (0,4 écart-type en trente cycles pour dix chasseurs assidus, 2 % de longueur) et ne regagne sa taille que lentement.

**Ce qui se voit.** Chaque bête qui naît tire ses valeurs dans la loi de la population de l'île et les garde. Le jeu montre l'écart de cette population depuis la génération 0 : une île où l'espèce a rapetissé a des bêtes plus petites (×0,9 pour deux écarts-types), une île où elle est devenue hardie laisse approcher plus près (la distance de fuite × 0,8 pour un écart-type), une espèce devenue vive détale plus vite. Le panneau de la bête désignée le dit : « l'espèce a rapetissé ici », « l'espèce est plus farouche ici ». Le profil d'Orvane règle aussi combien de la variation propre de chaque bête se voit (`variation`) : à 0 (le réglage actuel), toutes les bêtes d'une île se ressemblent et le jour un ne change rien ; à 1, on croise des grandes, des petites, des peu farouches, et le panneau les signale (« de grande taille », « allure vive », « peu farouche »).

**Ce qui remonte.** Chaque bête abattue ou liée est rapportée avec ses valeurs exactes. Tant que la variation propre ne se voit pas, les prises du joueur sont au hasard et Orvane le sait ; quand elle se verra, choisir les plus grandes pèsera.

**Ce qu'elle devient, liée.** Une compagne garde sa taille, son allure et son audace, sauvegardées avec elle.

**Le branchement** : `b.tq` multiplie la taille dans `rayonCorps`, `hautCorps` et `echB` ; `b.fq` la distance d'éveil face aux chasseurs (`menaceEtProie`) et la distance de fuite face au joueur (`rayonPeurJoueur`) ; `b.vq` l'allure, par `conduitesVit` (`conduites.js`) ; les mots par `orvaneCibleDit` ; la compagne les garde (`CDE.comp`, `qv`) ; en coop, la taille propre part avec la bête (`faune.js`, `tq`). Le tirage et le rapport sont dans `orvane/orvane-sv.js`, la loi de l'île dans `orvane/tampon.js` (`quantDe`). Service worker : `stone-valley-180`.

**Vérifié** : le banc du traducteur (45 vérifications, dont 9 nouvelles : valeurs tirées selon la loi de la population, aucune bête changée le jour un, chasse des plus grands → la population rapetisse, le jeu le montre sur l'île suivante, variation 1 → les tailles s'étalent comme la population, le lot rapporte la taille exacte des bêtes prises et respecte le schéma). Dans le jeu, sur un monde d'essai (brouteurs à −2,2 écarts-types, glaneurs hardis à +1,5) : les brouteurs naissent en moyenne à ×0,90 de taille, les glaneurs fuient en moyenne à ×0,76 de la distance, le panneau le dit, une compagne garde ses valeurs après sauvegarde et rechargement. Aucune erreur.


## §213 · L'hérédité — les petits ressemblent à leur mère

Dans Orvane, les bêtes se reproduisent maintenant à deux. Chaque petit reçoit un allèle de sa mère et un de son père pour chaque trait. Certains traits sont **dominants** (une copie suffit), d'autres **récessifs** : l'albinisme, la robe dorée et le nanisme ne se voient qu'avec deux copies, et se cachent chez des porteurs. Les pères sont **choisis** : une robe dorée ou une grande taille attirent, un nain ou un albinos moins.

**Ce qui se voit.** Une bête née d'une mère sur l'île lui ressemble : sa robe, sa forme (les mêmes cornes), ses conduites, sa taille, son allure, son audace se tirent sachant celles de la mère. Une mère albinos a environ un petit albinos sur cinquante (il faut que le père porte l'allèle), quand une naissance quelconque en donne un sur deux mille six cents. Une mère géante a la moitié de géants. Une cracheuse a souvent des petits cracheurs. Sur l'ensemble des mères, rien ne change dans les taux : seules les portées se ressemblent, et l'on apprend à suivre les bonnes mères. Cela vaut pour les trois naissances qui ont une mère : les petits des bêtes de l'île (`majBete`), le troupeau des coursiers qui grandit (`majCoursier`), les petits que les doux promènent derrière eux (cotonnier, sika, renard…, `peuplerDoux`).

**Dans le monde.** Ce que font les joueurs pèse autrement : abattre tous les albinos d'une espèce ne les supprime pas, ils reviennent par les porteurs cachés ; une robe voyante attire les prédateurs mais gagne par le choix des partenaires. Le monde sv-1 a été **refait de zéro** (nouveau rodage, nouvelle naissance) pour que sa génération 0 soit l'équilibre de ces règles : le premier chargement repart de cette nouvelle génération 0, et le jour un ne change rien.

**Correctif.** Le phénotype Orvane d'une bête était rangé dans `b.ph`, déjà utilisé par le jeu pour la phase de la foulée et des battements d'ailes. Dès qu'une bête marchait, il était écrasé : ses prélèvements n'étaient plus rapportés exactement, et une compagne pouvait perdre ses conduites au rechargement. Il est maintenant dans `b.phen`. Les sauvegardes gardent la même clé (`ph` dans `CDE.comp`).

**Le branchement** : `orvaneNaissance(petit, mere)` aux trois naissances qui ont une mère (`majBete`, `majCoursier`, `peuplerDoux`) ; tout le reste est dans `orvane/orvane-sv.js` (`heriter`) et `orvane/tampon.js` (`sachantMere`, `exprimer`). Service worker : `stone-valley-181`.

**Vérifié** : le banc du traducteur (50 vérifications, dont 5 nouvelles : les albinos abattus reviennent par les porteurs, la robe dorée gagne par le choix du partenaire, une mère albinos a 2 % de petits albinos contre 0,03 %, un trait se transmet sans que son taux bouge sur l'ensemble des mères, la taille d'un petit suit celle de sa mère avec la pente attendue). Dans le jeu, sur le monde sv-1 refait : 61 bêtes sauvages sur 61 gardent leur phénotype en marchant, un prélèvement rapporte le phénotype exact et les valeurs de la bête, et un petit né d'une mère de taille +1,6 naît en moyenne à +0,45. Aucune erreur.


## §214 · Les hybrides — quand deux lignées se retrouvent

Dans Orvane, une population qui ne reçoit plus d'immigrants diverge, et peut devenir une lignée. Quand deux lignées apparentées se retrouvent dans un même biome (une lignée fille revenue chez sa mère, deux sœurs), elles se croisent, d'autant moins qu'elles sont isolées : le temps depuis leur séparation, leur différence de taille, de silhouette, de niche. Les hybrides sont moins viables, mais ceux qui vivent mêlent les gènes des deux lignées.

**Ce qui se voit.** Sur une île où une espèce se croise avec une lignée apparentée, une part des bêtes naît hybride : la part que l'instantané donne à la zone hybride, pondérée par les biomes de l'île. Le panneau de la bête désignée le dit (« hybride, père brouteur de lande ») ; elle tient de son père la moitié de ses conduites possibles ; liée, elle le reste (sauvegardé avec la compagne). Le monde sv-1 n'a pas encore de lignée : les premiers hybrides viendront avec elles. Le monde de genèse, branché à la place, en a déjà.

**Le branchement** : rien de neuf dans `index.html` ; tout passe par `orvaneNaissance` (`orvane/orvane-sv.js` : `zoneHybride`, `hybrider`), le panneau par `orvaneCibleDit`, la sauvegarde de la compagne par `conduites.js` (`hy`). Service worker : `stone-valley-182`.

**Vérifié** : le banc du traducteur (54 vérifications, dont 4 nouvelles : l'isolement reproductif, nul avec soi, total sans parenté, croissant avec le temps ; l'écart génétique ; une zone hybride où 3,6 % des naissances ont un père de l'autre lignée et où les gènes passent ; sur une île, 2,8 % de brouteurs hybrides pour 2,7 % annoncés, et le panneau qui le dit). Dans le jeu, sur le monde sv-1 en ligne : aucune erreur.

## §215 · Les organes — des cornes, une massue, un aiguillon

Dans Orvane, la silhouette d'une lignée porte désormais une liste d'organes, chacun à sa place et à sa taille : une à quatre cornes, des défenses, une trompe, une collerette, une crête sur la tête ou sur le dos, des plaques, des épines, des nageoires, une massue, un aiguillon, un panache, des pinces. Un organe neuf est une innovation rare, à la séparation d'une lignée (une sur seize environ) : plutôt des armes chez un chasseur, des défenses chez une proie, des nageoires dans l'eau.

**Ce qui se voit.** Une lignée née dans Orvane est dessinée avec ses organes : en boîtes dans le monde, dans son pictogramme, et dans le croquis de l'observatoire, qui en donne aussi la liste. Elle en tire des conduites, d'autant plus fortes que l'organe est grand. Des cornes, des défenses ou une massue la font **charger** (ses coups portent plus fort ; c'est noté au carnet la première fois). Un aiguillon pique qui la frappe de près, avec du venin. Des plaques ou des épines encaissent, une carapace la fait se replier, des pinces mordent, des antennes sentent de près. De près, avant de l'avoir vue faire, on lit le présage (« balance sa queue lourde ») ; ensuite, le panneau dit le nom (« à massue »). Une compagne garde ces noms. Les espèces du jeu gardent leurs conduites à elles : le jour un ne change rien.

**Le branchement** : rien de neuf dans `index.html`. Les conduites des organes viennent de `orvane/correspondance.js` (`conduitesDe`, lu dans `catalogue.organes` de l'instantané) par `orvane/orvane-sv.js`, et le jeu les joue dans `conduites.js`, qui gagne la conduite `charge`. Les dessins sont dans `lignees.js` (`lgOrganes`, pictogramme), la description dans `orvane/corps.js`. Service worker : `stone-valley-183`.

**Vérifié** : le banc du traducteur (61 vérifications, dont 7 nouvelles : une silhouette d'avant se lit en organes ; un organe neuf naît à 6 % des séparations, nageoires d'abord dans l'eau ; la description et l'écart de silhouette ; l'instantané porte le catalogue des organes ; une massue charge à 1,4, à 1,18 si elle est petite, un aiguillon pique, une espèce du jeu n'en tire rien ; changer le catalogue de l'instantané suffit à changer le jeu ; les 15 organes se dessinent sur les 5 formes de corps, sans valeur perdue). Dans le jeu, sur un monde de genèse doté d'organes : 98 lignées dessinées et pourvues de conduites, aucune erreur.

## §216 · La méfiance — les bêtes qu'on chasse apprennent à fuir

Orvane tient désormais, par population, ce que les bêtes ont appris des joueurs. Les rencontres qui finissent mal (une bête tuée, une bête capturée) rendent la population **méfiante** ; les rencontres sans suite, et l'aide, l'**habituent**. La méfiance retombe de moitié en six nuits sans joueurs, l'habituation en quinze. Une population audacieuse s'habitue plus vite et se méfie moins.

**Ce qui se voit.** Une bête naît avec ce que sait la population de son biome : méfiante, elle s'éveille plus tôt et fuit de plus loin (jusqu'à × 2,2) ; habituée, elle laisse approcher (jusqu'à × 0,5). Cela s'ajoute à son audace. Le panneau de la bête désignée le dit : « se méfie des chasseurs », « fuit les chasseurs : on la chasse ici », « habituée aux passants ». Un soir de chasse ne change pas grand-chose ; plusieurs soirs de suite au même endroit, si. La boucle se referme d'elle-même : une population qui fuit se laisse moins prendre, et finit par se calmer. Le jour un ne change rien : aucune population n'a encore rien appris.

**Le branchement** : rien de neuf dans `index.html` ni dans ce que le jeu envoie ; les rencontres, prélèvements et captures déjà comptés suffisent. `orvane/orvane-sv.js` : `apprisFuite` à la naissance (le facteur de fuite `b.fq`, déjà lu par `rayonEveil` et la distance de garde), les mots du panneau par `quantMots`. `orvane/tampon.js` compte les contacts. Service worker : `stone-valley-184`.

**Vérifié** : le banc du traducteur (67 vérifications, dont 6 nouvelles : rien le jour un ; cinq soirs de chasse portent la méfiance à 0,57, un événement au journal, puis la moitié en six cycles ; huit soirs sans suite habituent à 0,83, une chasse défait l'habitude ; l'audace tempère la méfiance ; le tampon compte les contacts et ramène un compte trop actif à la mesure des autres ; sur l'île, une méfiance de 0,6 fait fuir de 1,60 fois plus loin, une habituation de 0,5 de 0,71 fois, et le profil peut l'éteindre).

## §217 · Le monde d'Orvane — un monde pour tous les jeux

Stone Valley joue désormais sur **le monde d'Orvane**, un seul monde où tous les jeux se branchent. Il est né de la genèse universelle d'Orvane : 24 biomes neutres (de la banquise aux abysses), 19 ancêtres très simples (des brouteurs, un fouisseur, un insecte, un oiseau, des prédateurs de toutes tailles, des filtreurs, des chasseurs d'eau douce et de mer, un crabe), 900 cycles d'évolution accélérée, et 112 lignées au bout, que personne n'a dessinées. Aucune des trente espèces de la faune habituelle n'y existe. Le premier monde du jeu (sv-1) est archivé : il ne tourne plus.

**Ce qui se voit.** Sur les îles, la faune habituelle (brouteurs, crapauds, traqueurs, trottins…) cède sa place aux lignées du monde. Chacune a :
- un nom inventé ;
- un corps construit à sa mesure (quadrupède, hexapode, bipède, oiseau ou serpent, avec ses organes : cornes, défenses, plaques, massue, aiguillon…) ;
- la conduite de son gabarit : un herbivore paisible est un Doux, comme le cotonnier (c'est d'eux que sont faites les premières îles) ; un herbivore plus vif broute et fuit comme un brouteur ; un omnivore glane comme un glaneur ; un carnivore chasse comme un traqueur.

Elle en donne les mêmes matières. L'île garde autant de bêtes qu'avant et la même part d'herbivores, d'omnivores et de carnivores, dans la mesure où le monde en a. Le monde a 13 lignées de vrais carnivores (rôdeurs, traqueurs, rapaces, un serpent, des chasseurs d'eau), rares en nombre comme au sommet d'une chaîne : ce sont les chasseurs des îles. Les lignées s'y partagent la place à proportion de leur présence dans le monde : leurs bêtes, pesées par leur taille (dix millions d'insectes ne se croisent pas plus qu'un troupeau). Une lignée sans ancêtre dans le jeu a une taille qui suit le logarithme de sa masse, d'un petit 0,5 pour un insecte à 1,6 pour une bête de 100 kg. Les automates, les boss et les villageois ne changent pas. Les compagnes déjà liées restent ce qu'elles sont. Une île où aucune lignée paisible ne peut se montrer garde ses Doux. Quand le monde d'Orvane arrive après que l'île a été peuplée (au premier lancement après la mise à jour, l'île l'est d'après l'ancien monde), l'île se repeuple aussitôt : les bêtes sauvages de l'ancienne faune s'en vont et les lignées viennent à leur place (`repeuplerIle`). Sans cela, leurs naissances perpétuaient l'ancienne faune tant qu'on restait sur l'île.

**Les sols du jeu dans le monde d'Orvane.**

| sol du jeu | biome du monde |
| --- | --- |
| rivage | côte |
| prairie | prairie |
| bois | forêt |
| lande | steppe |
| ossuaire | savane |
| falaise, champs de cristal | montagne |
| pierre | désert froid |
| neige | sommets |
| tourbière | marais |
| canyon d'ocre | désert |
| sylve fongique | jungle |
| caldeira, braises | volcan |
| terres creuses | grotte |
| cerisaie | maquis |

**Les pressions.** Ce que font les joueurs (chasse, liens, rencontres) part désormais vers **le Supabase d'Orvane**, et non plus vers celui du jeu. Le jeu y est inscrit et a sa clé ; Orvane ne garde qu'une empreinte du compte. Les lots partent à la sauvegarde, une fois par demi-heure au plus, 400 événements à la fois. Chaque nuit, Orvane les lit avec ceux des autres jeux, et avec ce que Stone Valley sait montrer (son exposition, publiée dans `jeux.json`) : une variante que le jeu montre rare mais qui vit nombreuse voit ses pertes redressées. Un seul jeu ne fait pas plus de la moitié de la pression sur une espèce que d'autres jeux montrent aussi.

**Le branchement.**
- `index.html` : `ORVANE_CHEMIN` pointe sur `mondes/orvane/` ; `ORVANE_DEPOT` donne l'adresse du Supabase d'Orvane, sa clé publique et la clé du jeu ;
- `orvane/orvane-sv.js` :
  - `orvaneEnvoyer` dépose par `orvane_deposer` ;
  - `repeuplerIle` : l'île se repeuple quand le monde arrive après elle ;
  - le réglage vient de `jeux.json` (sinon `Corr.EXPOSITION`) ;
  - `bestiaireOrvane` (le bestiaire d'Orvane) ;
  - le régime montré est le régime de fait : un carnivore qui digère aussi les plantes est un omnivore ;
  - l'instantané et la génération 0 se gardent dans le cache du navigateur (`stone-valley:orvane-monde`), pas dans le stockage local, où un grand monde aurait pu empêcher la sauvegarde du jeu. Le stockage local n'en garde qu'un abrégé (qui vit où, combien : de quoi peupler la première île au chargement) et les fiches des lignées ; quand le monde arrive après que l'île a été peuplée, ses comptes se refont ;
- `orvane/correspondance.js` :
  - chaque sol a son biome du monde d'Orvane (`BIOMES_SV[k].u`), et `choisirCarte` prend la carte qui ressemble au monde servi ;
  - `EXPOSITION` : ce que le jeu sait montrer ;
  - `FAUNE`, `GROUPE` ;
  - un herbivore paisible a pour gabarit le cotonnier ;
- `orvane/tampon.js` : l'exposition par jeu, la part d'un seul jeu, le régime de fait ;
- `sw.js` : le cache du monde survit aux mises à jour ; `stone-valley-187`.

**Vérifié** :
- le banc du traducteur, avec 7 nouvelles vérifications sur le monde d'Orvane :
  - les sols de l'île sont des biomes du monde ;
  - 32 lignées remplacent la faune du jeu sur une île à tourbière, dont 7 Doux ;
  - chaque lot est lu avec l'exposition de son jeu ;
  - la part d'un seul jeu est plafonnée ;
  - le lot part vers le Supabase d'Orvane avec la clé du jeu, 400 événements à la fois ;
- dans le navigateur : le passage de l'ancien monde au nouveau (l'île se repeuple dès que le monde arrive), aucune erreur, et le dépôt qui part à la bonne adresse avec les bonnes clés.

## §218 · L'exploration — des chasseurs, des trophées, un carnet des lignées

Avec le monde d'Orvane, une île lointaine ressemblait à la première : des petits herbivores, rien d'autre. Chaque exploration en apporte désormais un peu plus.

**Plus d'espèces au loin.** Le tirage de l'île (`bestiaireGraine`) ajoute une espèce dès la cinquième exploration et deux dès la dixième, huit au plus. Les premières îles gardent leurs deux ou trois Doux.

**Des chasseurs garantis.** Dès la troisième exploration, chaque île a au moins un chasseur d'Orvane qui vit sur ses sols (`orvaneTirage`, `garantirChasseur`), deux dès la huitième. Les chasseurs y sont un quart plus nombreux dès la huitième exploration, moitié plus dès la douzième, et vont en groupe de trois (ceux de 40 kg au plus).

**Des trophées.** Les lignées les plus rares du monde sont des trophées, et leur rareté suit celle des viandes du jeu :

| rareté | part des lignées | dès l'exploration | robustesse | butin en plus |
| --- | --- | --- | --- | --- |
| rare | le quart le plus rare | 4 | × 1,3 | 1 éclat |
| exotique | le dixième le plus rare | 6 | × 1,6 | 2 éclats |
| légendaire | les trois centièmes les plus rares | 8 | × 1,9 | 3 éclats |

La rareté se mesure à la présence de la lignée dans le monde : ses bêtes, pesées par leur taille, parmi les lignées qui vivent sur les sols du jeu. Une île sur cinq porte un trophée dès la quatrième exploration, jusqu'à une sur deux à la vingtième. C'est toujours le plus rare que l'île permet. Son nom prend la couleur de sa rareté, et l'espèce phare de l'île est annoncée à l'arrivée : la plus rare des lignées tirées, sinon la plus grande.

**Le carnet des lignées.** Chaque lignée d'Orvane croisée s'inscrit au carnet du journal, une fois pour toutes (« nouvelle lignée · … · notée au carnet (12/93) »). Le carnet dit combien de fois elle a été croisée et combien de trophées on en a pris. Il part avec la sauvegarde du compte, et un personnage neuf repart de zéro.

**La viande des lignées.** Une lignée d'Orvane donne la viande de son gabarit (cuissot de brouteur, chair de traqueur…), comme ses autres matières.

Sur 40 îles tirées à chaque niveau :

| exploration | îles à trophée | îles avec un chasseur d'Orvane | lignées d'Orvane par île | espèces par île |
| --- | --- | --- | --- | --- |
| 1 | 0 | 0 | 2,5 | 4,5 |
| 4 | 7 | 40 | 4,5 | 7,4 |
| 6 | 10 | 40 | 5,5 | 8,5 |
| 10 | 12 | 40 | 6,8 | 10,5 |
| 15 | 16 | 40 | 6,8 | 10,6 |

**Le branchement.**
- `index.html` :
  - `bestiaireGraine` : les espèces en plus selon la profondeur, puis le crochet `orvaneTirage(e, graine, niv, okR)` ;
  - `loadWorld` : `orvaneArrivee(especesIle)` ;
  - `viandeDe` : la viande du gabarit ;
  - `rareEspece` : `sp.rarete` ;
  - la mort d'une bête : `orvaneTrophee(b)` ;
  - `photo` et sa relecture : `orv` (`orvanePhoto`, `orvaneRelire`) ;
  - `blocCarnet` : `orvaneCarnetLignees()` ;
- `orvane/orvane-sv.js` : `rangsRarete`, `placeTrophee`, `chasseurLoin`, `garantirChasseur`, `orvaneTirage`, `orvaneArrivee`, `decouvrir`, `orvaneTrophee`, le carnet ;
- `sw.js` : `stone-valley-188`.

**Vérifié** :
- le banc du traducteur (tout passe) ;
- les tirages ci-dessus ;
- dans le navigateur : la rencontre qui s'inscrit au carnet (1/93), un trophée abattu (+2 éclats pour un exotique), le carnet qui part avec la sauvegarde et revient à la relecture, et la viande d'une lignée (celle du cotonnier pour un Doux). Aucune erreur.

## §219 · Le dessin des lignées — des silhouettes, des têtes, des bêtes vivantes

Les lignées d'Orvane se ressemblaient toutes : un tronc, quatre pattes droites, une boule pour tête. `lignees.js` les dessine désormais d'après ce qu'elles sont : leur masse, leur régime, leurs modes de déplacement, leurs traits.

**Des silhouettes.** Les proportions suivent l'animal :
- un brouteur a le cou long, le dos droit, des sabots ; un chasseur est bas, allongé, la queue longue ; un lourd (de 4 à 100 kg) s'épaissit, perd du cou et de la queue (un ours plutôt qu'un cerf) ; un petit (sous 600 g) a la tête et les oreilles plus grandes ;
- un coureur a les pattes fines et longues, un sauteur les cuisses fortes, un fouisseur les griffes et les pattes courtes, un grimpeur la queue longue, un nageur les pieds palmés ;
- une bête qui nage sans marcher ni ramper est un poisson : corps fuselé qui ondule, ventre clair, nageoire dorsale, pectorales, queue fourchue qui bat, pas d'oreilles ;
- un serpent a dix anneaux, un insecte un abdomen en trois anneaux et des mandibules, un oiseau un bec (crochu chez un carnivore).

**Des têtes.** Le cou a deux segments. La tête porte un crâne, un museau, une truffe sombre et une mâchoire qui s'ouvre (des crocs quand la bête mord). Les yeux sont de face chez un carnivore, sur les côtés chez une proie, avec un reflet blanc ; ils clignent. Les oreilles ont un intérieur clair, se dressent à l'alarme et frémissent. Les cornes ont deux segments, les antennes se balancent.

**Des pattes.** Trois segments, la cuisse dans la couleur du corps, le genou plié par une petite cinématique inverse (`lgGenou`). Le pas se fond dans le galop quand la bête accélère, et le corps tangue au galop.

**Des queues.** Cinq segments : un plumet chez un herbivore, une brosse chez un petit carnivore ou un omnivore, une palette chez un nageur. Elle se lève à l'alarme et au galop, et pend chez un lourd.

**Vivantes.** La bête respire. Elle broute tête basse, traque basse et tendue, dort roulée. En veille, aux abois ou à l'alarme, elle tourne la tête vers toi (`lgRegard`) ; sinon elle jette des coups d'œil.

**Le branchement.**
- `lignees.js` : `lgMesures`, `lgGenou`, `lgRegard`, `osOrvane`, `lgPattes`, `lgTete`, `lgQueue`, `lgPoisson` (les organes et `dessinOrvane` sont inchangés) ;
- `orvane/orvane-sv.js` : `sp.orvane` porte aussi la masse et le régime de la lignée ;
- `sw.js` : `stone-valley-189`.

**Vérifié** :
- le banc du traducteur (tout passe) ;
- les 112 lignées du monde d'Orvane dans sept poses chacune (errer, brouter, fuir, dormir, traquer, mordre, veiller) : 784 squelettes, 38 os en moyenne, 58 au plus, aucun os invalide ;
- le jeu chargé sur le monde en ligne : aucune erreur.
