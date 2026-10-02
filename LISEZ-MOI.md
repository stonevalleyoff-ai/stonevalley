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
2. Déposer les fichiers (index.html, donjon.js, nomades.js, etats.js, village.js, sw.js, manifest et icônes) à la racine du dépôt (glisser-déposer dans « Add file › Upload files »).
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

Un moteur, à la façon d'un Zelda : on met ce qu'on veut dans la marmite (jusqu'à quatre ingrédients), et **il en sort toujours un plat**. L'onglet **Cuisine** du sac (touche 9, sac ouvert) montre à gauche la marmite, le plat servi et les plats du sac ; à droite, deux sous-onglets : **Ingrédients** (le garde-manger) et **Recettes** (le livre).

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
| tout le reste (grillade, brochette, compote, infusion, poêlée, rôti, salade, plat du voyageur…) | 1 | chaud |

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
| Cuisiner | ouvre l'onglet Cuisine |
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

**Son corps sur plusieurs niveaux** : chaque patte se pose sur le sol qu'elle touche, à portée de jambe (3 cubes sous le corps, 2 au-dessus ; sinon tout près, ou elle reste où elle est). Le corps est **suspendu** entre ses pattes, à 2,75 au-dessus de ses pieds (`TISSEUSE.haut`), le ventre bien au-dessus du sol. Les jambes sont longues (cuisse 2,3, jambe 2,4) : le genou, résolu à chaque image (deux os, un pôle vers le haut et le dehors), s'arque haut au-dessus du corps. Le corps **épouse le relief qu'il couvre** (dix points : tête, thorax, abdomen, flancs ; `CORPS_TISS`) autant que ses pieds : il **tangue et roule** entre deux niveaux, et **aucun de ces points ne passe sous le sol**, même pendant qu'il s'incline (testé : 0 image sur 600 en 30 s sur des gradins de 4 cubes, tangage jusqu'à 0,45, roulis 0,37). Elle marche en deux quatuors alternés ; le pied décrit un arc plus haut quand il monte et retombe lourdement (poussière, éclaboussure dans l'eau, bruit sourd, secousse selon la distance ; dessous, on se fait écraser). Elle patauge, contourne les falaises plus hautes que sa jambe, ne passe pas sous les îles de nuage. Testé sur un relief de 4 cubes : pieds sur 4 niveaux à la fois, le corps incliné.

**Son combat** : elle tient 9 à 18 cases, de flanc, face à vous, et change de sens de temps en temps. Une arme à la fois, toutes annoncées :

| Arme | Ce qu'on voit | Comment s'en sortir |
|---|---|---|
| Mortier (abdomen) | la tourelle se dresse ; 3 obus en cloche (5 en rage), le cercle rouge au sol | sortir des cercles |
| Fusil (sous la tête) | un laser rouge qui vous suit en retard, la lentille qui grossit puis clignote ; le coup part à 42 cases/s | un pas de côté au dernier moment |
| Toile (dès la moitié de sa vie) | la filière se lève, un paquet de soie électrique ; il s'ouvre au sol en toile bleue | dedans : vitesse au tiers, des piqûres ; en sortir |
| Cabrer (à moins de 5,5 cases) | elle lève les pattes avant… et frappe le sol : une onde | **sauter** au bon moment |

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

- **À moitié apprivoisé** : le Silencieux connaît votre pas (il ne fonce plus sur vous, ne vous saisit plus) ; le Mille-gueules ne vous chasse plus. Un moment après chaque offrande, ils restent calmes.
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
- **Le remède** : une **recette légendaire** à découvrir dans la cuisine, à **quatre ingrédients** — le **Sérum de clairvoyance** : le mycélium pâle de la roche rongée, la mousse céleste des îles de nuage, le nectar des oglodons, une goutte de sève. Une dose, qui se garde ; au sac, son bouton dit **Injecter**. Injecté : la brume se lève, les visions se dissipent, guéri.

**Le visuel, retravaillé** :
- **L'île** : la roche rongée vire au noir violacé ; des **excroissances** y poussent (des pointes noires aux bouts d'un vert maladif, qui luisent ; une case sur neuf) ; les spores sont lentes, noires ou vert-jaune, certaines luisent ; l'image perd un peu de couleur (filtre CSS sur les toiles `c` et `c3`).
- **Infecté** : l'image se **désature** et se contraste ; la brume noire respire, des **vrilles** rentrent par les bords, des **yeux** blancs s'ouvrent et clignent au bord du noir ; parfois un **visage immense** se devine dans la brume (deux orbites, une bouche) sur un bourdon grave ; la blessure fait **couler du sang** du haut de l'image ; le coup d'une silhouette **inverse l'image** un éclair.
- **Le Décharné**, modèle fin : un enfant famélique trop grand de tête — crâne nu, tempes creuses, deux **orbites noires énormes** où une **pupille minuscule** vous suit, une fente de bouche qui **s'ouvre sans un son** sur de petites dents ; un cou trop long aux vertèbres saillantes, quatre paires de côtes, le ventre rentré, des bras jusqu'aux genoux aux doigts trop longs, des genoux noueux, de longs pieds, des veines sombres. Il penche la tête lentement, puis d'un coup ; dos tourné, il **avance par à-coups** (jamais sous vos yeux) ; tout près, on l'entend **respirer**.
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
