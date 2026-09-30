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

Jusqu'à l'exploration 8, le danger monte (les bêtes frappent et encaissent plus fort). Au-delà, il plafonne, mais les automates, eux, continuent de monter jusqu'à l'exploration 20 :

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

Sur toutes les îles, les îles volantes et leurs escaliers sont de **nuage** : blanc, doux, en plein jour même au-dessus d'une falaise, et sans aucun végétal. Elles ne portent que les **druses** : un socle de roche pâle et des prismes trapus, en deux tons comme le reste de la flore. C'est toujours là qu'on détache les éclats, et leur couleur dit ce qu'elles valent :

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
- **Ce qui est partagé** : votre pseudo, l'île et la place de votre campement, son niveau, le contenu du coffre et l'espèce, la santé et la robe de vos gardiennes. Jamais votre adresse. Personne ne peut lire les campements des autres : la base choisit la cible, et ne révèle que celle qu'elle vous donne. Vous ne lisez que vos propres pillages.
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

Dans le sac, l'onglet Bêta (**touche 8**, sac ouvert) réunit tout ce qui sert à tester. Les outils qui donnent quelque chose passent d'eux-mêmes en **mode essai** : rien de ce qu'on y gagne ne part dans la sauvegarde, et « Arrêter l'essai » rend le vrai sac.

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

Un moteur, à la façon d'un Zelda : on met ce qu'on veut dans la marmite (jusqu'à quatre ingrédients), et **il en sort toujours un plat**. L'onglet **Cuisine** du sac (touche 9, sac ouvert) montre la marmite, le garde-manger et les plats.

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
- **Manger** : dans l'onglet Cuisine ou le sac. Le sac garde aussi le « garde-manger » : un appui mange cru (moitié moins de vie ; la viande, jamais).
- **Les compagnes** : G donne à une compagne le plat le plus modeste qu'on ait. Elle est soignée, et n'a plus faim de quatre à douze minutes.
- **Le carnet des recettes** (onglet Journal) : chaque plat trouvé, ses meilleures étoiles, combien de fois on l'a préparé.


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
