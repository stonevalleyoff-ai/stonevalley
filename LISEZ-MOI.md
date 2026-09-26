# Stone Valley — bêta (PWA)

Le dossier à mettre en ligne :

| fichier | rôle |
| --- | --- |
| `index.html` | le jeu entier, porte de connexion comprise |
| `donjon.js` | le Centre des automates (le donjon) et ses armes, chargé par `index.html` : à déposer avec lui |
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
| Champs de cristal | très rare | 5 | ~8 % | arbre de verre, druse géante (éclats), herbe de quartz | mana deux fois plus vite, tout luit la nuit |
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

Dans le sac, le dernier onglet (**touche 8**, sac ouvert) réunit tout ce qui sert à tester. Les outils qui donnent quelque chose passent d'eux-mêmes en **mode essai** : rien de ce qu'on y gagne ne part dans la sauvegarde, et « Arrêter l'essai » rend le vrai sac.

- **Ressources** : le mode essai (ressources illimitées : rien ne se paie, flèches et mana compris) et « Tout fabriquer ».
- **Remplir le sac** : +200 de chaque ressource, 50 baies, 64 flèches.
- **Armes d'en bas** : le rayon de sentinelle et le fusil d'arpenteur, rangés et en main.
- **Le personnage** : soins complets (santé, mana, endurance, trois vies) et **Invincible** (plus rien ne blesse : coups, tirs, brûlures, chute).
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
| Cotonnier | une petite boule de duvet, en troupeau. Les petits suivent leur mère **en file indienne**. En fuyant, il perd son duvet : des aigrettes que le vent emporte | file son duvet : de la fibre |
| Carillonneur | fin et haut sur pattes, des cornes creuses en pavillon, avec des clochettes que le vent balance : **on l'entend avant de le voir** (une gamme mineure, plus souvent quand il vente) | abat le bois mort, et **tinte fort quand un chasseur approche** |
| Oglodon | un grand scarabée gris d'ardoise, six pattes, une corne, un ventre d'ambre. Il vit en colonie dans une **fourmilière géante**, grignote la pierre, descend aux buissons cueillir des baies qu'il remonte à la fourmilière, où elles deviennent du **nectar** | grignote la pierre (de la pierre), et change en nectar les baies qu'il cueille |

Les petits naissent plus petits et grandissent jusqu'à leur maturité. Les chasseurs des îles suivantes (traqueur, spectre, varan, salamandre, traceur) chassent aussi les Doux — sauf l'oglodon.

**La fourmilière** (une île sur deux, sur un replat de la montagne) : un cône d'argile d'une douzaine de cases, qu'on monte d'un cube à la fois, trois entrées dans ses gradins, un cratère et des cheminées au sommet. Le nectar perle aux entrées quand elle est pleine.

- **PUISER** (à une entrée ou au cratère) : jusqu'à 4 nectars. Toute la colonie vous a vu : elle charge.
- **La charge** : l'oglodon gratte le sol tête basse, puis fonce de loin (plus de 4 cases) et projette. On l'esquive de côté. Il charge aussi si on le frappe, ou si l'on s'approche trop de la fourmilière. Loin de chez lui et calme, il se contente de vous tenir à l'œil : c'est là qu'on peut l'apprivoiser aux baies.
- La fourmilière se remplit d'un nectar par baie rapportée, et un peu d'elle-même (jusqu'à la moitié).

**Le nectar d'oglodon** (une nouvelle matière, au sac et au coffre) :

- **le boire** : +35 % de vie et tout le souffle — touche **N**, ou le bouton de l'onglet Sac ;
- **la Lampe d'ambre** (établi) : la lumière de la lanterne, sans éclat (8 nectars, 12 bois, 8 fibres).

Côté Supabase, la liste des matières du coffre accepte le nectar (fonction `vp_coffre_propre`, déjà mise à jour).

