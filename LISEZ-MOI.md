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
2. Déposer les fichiers (index.html, donjon.js, nomades.js, etats.js, village.js, coop.js, flore.js, sw.js, manifest et icônes) à la racine du dépôt (glisser-déposer dans « Add file › Upload files »).
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
- **Le remède** : une **recette légendaire** à découvrir dans la cuisine, à **quatre ingrédients** — le **Sérum de clairvoyance** : le mycélium pâle de la roche rongée, la fleur d'edelweiss des cimes (la mousse céleste ne pousse plus : voir §68), le nectar des oglodons, une goutte de sève. Une dose, qui se garde ; au sac, son bouton dit **Injecter**. Injecté : la brume se lève, les visions se dissipent, guéri.

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

**Sur l'île** (`floreIle`, la graine décide) : sur chaque biome assez grand, **2 à 7 rares**, **une légendaire** une fois sur deux environ (un peu plus en s'enfonçant), **une épique** une fois sur trois environ dès l'exploration 2 ; jamais près de l'arche, du village ni du point d'arrivée. Leurs lueurs : du pollen lumineux autour des légendaires et des épiques ; la nuit, **les quatre plus proches éclairent** autour d'elles. La fiche dit leur nom et leur rang.

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
| **À la main**, partout, sans campement | couteau d'os, pioche, gourdin, tunique de fibre, canne à pêche, flèches, baume de relève, campement |
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
