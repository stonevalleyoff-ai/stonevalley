# Audit — la faune et la flore de Stone Valley

*6 novembre 2026. État du dépôt au commit `10a3fb8` (§223), lu contre le monde d'Orvane publié (cycle 44). Rien n'a encore été modifié dans le jeu.*

---

## L'essentiel

1. **Trois faunes se mélangent aujourd'hui sur les îles.**
   - Tes créatures faites main : une trentaine d'espèces sauvages, les créatures à part, la faune du volcan, les boss.
   - 99 lignées de la « genèse 7 » : Orvane les a fait naître **à partir de tes 30 créatures** (le monde sv-1), puis les a versées dans son monde.
   - Les vraies lignées d'Orvane : 120 sur les sols du jeu.
2. **Le jeu montre surtout la deuxième faune, par accident.** Depuis l'arrivée de la genèse 7, le jeu lit les biomes d'Orvane qui portent les noms de Stone Valley (sylve, cerisaie, ossuaire…). Ce choix s'est fait tout seul. Résultat : sur 15 sols sur 16, **100 % des lignées affichées descendent de tes anciennes créatures**. Les lignées propres à Orvane n'apparaissent qu'en prairie.
3. **Les lignées d'Orvane portent les habits de tes créatures.** Chacune copie une créature modèle (cotonnier, brouteur, glaneur ou traqueur) :
   - son comportement, sa viande, ses compétences ;
   - sa texture (de la chitine d'insecte sur des mammifères) ;
   - parfois son duvet de coton (sur des bêtes jusqu'à 60 kg).
4. **La flore n'est pas mélangée dans le jeu.** Elle est entièrement à toi : 69 espèces sur la carte et 264 plantes rares. Le jeu ne lit rien de la flore d'Orvane. Le seul mélange est dans Orvane : il fait pousser des plantes génériques sur les biomes venus de Stone Valley. Je n'y touche pas.
5. **Le dessin des lignées est générique, sans style.** Un seul fichier (`lignees.js`) assemble chaque lignée en boîtes. Il n'a aucun réglage de style, ne tient pas compte de l'île, ses transitions sont sèches, et il a quelques défauts (§4).
6. **Le comportement est riche, mais attaché à tes créatures.** Le moteur de comportement commun est bon. Mais il est nourri par les valeurs fixes de la créature modèle, et tout ce qui fait la personnalité (meutes, affûts, jeux, rut, colonie, nids) est câblé sur une espèce faite main. Orvane fournit beaucoup d'informations de comportement que le jeu ignore (§5).
7. **Il faut construire l'« épique ».** Le monde d'Orvane n'en fournit presque pas : la moitié des lignées pèse moins de 500 g, la plus grosse 60 kg, et peu ont des organes. Le passage du mignon à l'épique doit venir de Stone Valley : du dessin, de l'animation, du comportement et du choix des bêtes selon l'île (§7).

**Ce que je propose** (§7 et §8) :
- tout faire venir d'Orvane, en écartant la genèse 7 ;
- supprimer la faune faite main ;
- dessiner chaque lignée dans un style propre au jeu, gradué selon sa puissance : des bêtes rondes et mignonnes, tirées sur les premières îles, jusqu'à des bêtes épiques sur les îles lointaines ;
- tirer le comportement des données d'Orvane, et non plus d'une créature modèle.

Le chantier tient en sept lots, et le jeu reste jouable après chacun. Les quatre décisions sont prises (§9).

---

## 1. Ce qui peuple les îles aujourd'hui

### 1.1 La carte des sols a basculé toute seule

Pour savoir quels biomes du monde lire, `choisirCarte` (`orvane/correspondance.js:29`) compare les biomes publiés par Orvane à deux listes : les noms de Stone Valley (`id`) et leurs équivalents dans Orvane (`u`). La liste qui l'emporte gagne.

Le monde d'Orvane contient maintenant les deux listes, à cause de la genèse 7 :
- 15 biomes n'existent que sous un nom de Stone Valley ;
- 13 biomes n'existent que sous un nom d'Orvane.

15 l'emporte sur 13, donc la carte passe en `'id'`. Le jeu lit alors les biomes peuplés par la genèse 7.

| sol du jeu | biome lu aujourd'hui | lignées : genèse 7 / Orvane | biome qu'il faudrait lire | lignées Orvane disponibles |
| --- | --- | --- | --- | --- |
| rivage | rivage | 60 / 0 | côte | 64 (dont 22 marines) |
| prairie | prairie | 79 / 42 | prairie | 42 |
| bois | bois | 71 / 0 | forêt | 39 |
| lande | lande | 80 / 0 | steppe | 33 |
| falaise, cristal | falaise, cristal | 48-49 / 0 | montagne | 45 |
| pierre | pierre | 43 / 0 | désert froid | 23 |
| neige | neige | 35 / 0 | sommets | 24 |
| tourbière | tourbière | 65 / 0 | marais | 47 |
| canyon | canyon | 42 / 0 | désert | 22 |
| sylve fongique | sylve | 51 / 0 | jungle | 31 |
| caldeira, braises | caldeira, braises | 30 et 19 / 0 | volcan | 23 |
| ossuaire | ossuaire | 30 / 0 | savane | 26 |
| terres creuses | terres creuses | 28 / 0 | grotte | 23 |
| cerisaie | cerisaie | 64 / 0 | maquis | 34 |

**Correction** (côté jeu, quelques lignes) :
- forcer la carte sur les biomes d'Orvane ;
- écarter les lignées dont `origine.fusion` vaut `genese-7`.

79 lignées de la genèse 7 ont aussi passé les ponts vers la prairie et la forêt d'Orvane : le filtre les écarte également. Il reste **118 bêtes et 2 machines, toutes nées dans Orvane** : 72 quadrupèdes, 31 serpents et poissons, 10 bêtes à six ou huit pattes, 4 oiseaux, 1 bipède.

### 1.2 Les lignées copient une créature modèle

`gabaritDe` (`correspondance.js:122`) donne à chaque lignée un modèle pris parmi tes créatures. `appliquerDef` (`orvane-sv.js:183`) copie alors **tous** les champs du modèle, sauf une dizaine. Mesuré sur les 243 lignées du monde :

| modèle | lignées | ce qu'elles reçoivent sans raison |
| --- | --- | --- |
| cotonnier (Doux) | 52 | famille Doux, corps « cotonnier », duvet de coton, métier « file son duvet », curiosité 0,8, masse fixe 0,62 |
| brouteur | 47 | vue, peur, troupeau, maturité du brouteur ; texture chitine ; compétence « Boule visqueuse » |
| glaneur | 124 | omnivore qui **ne chasse jamais** ; pas de troupeau |
| traqueur | 18 | troupeau obligatoire ; liste de proies de 231 espèces |
| traceur / moissonneur | 2 | les machines, réglées ensuite par Orvane |

Conséquences visibles en jeu :
- **48 des 66 carnivores ne chassent jamais.** Le trait « estomac large » en fait des omnivores de fait, donc des glaneurs.
- **N'importe quel carnivore chasse n'importe quel herbivore.** Une bête de 180 g peut s'en prendre à une de 60 kg. Orvane a sa propre règle (`appetence` : la taille, la vitesse, le vol, l'heure), mais le jeu ne la lit pas.
- **Tout carnivore nocturne chasse le joueur la nuit, même rassasié.** C'est la règle du spectre, copiée par le modèle.
- **Les rythmes et les sauts sont perdus.**
  - 48 lignées crépusculaires et 17 actives jour et nuit vivent comme des bêtes de jour.
  - 55 lignées sauteuses ne sautent pas.
- **Les groupes ne suivent pas la sociabilité.**
  - 40 lignées solitaires vont en troupeau.
  - 23 lignées grégaires vont seules.
- **La viande, les compétences et la façon de se lier** sont celles du modèle : « Cuissot de brouteur », « Tendron de cotonnier ».

### 1.3 Là où tes créatures faites main se montrent encore

- **Le repli « garde ses Doux »** : une île où aucune lignée paisible ne peut paraître garde ses Doux (`orvane-sv.js:561`).
- **Les lignées proches de leur ancêtre** (`genere = false`) sont dessinées avec le corps de l'ancêtre fait main.
- **Les compagnes déjà liées** (`P.compagnes[].esp`).
- **Les familles du départ** : `peuplerDoux` ne connaît que les petits de tes Doux (table `PETITS`).
- **Les modules à part** : le volcan (magmaton, basilic, charognard, Tisonnier) que la carte d'Orvane ne couvre pas, et les boss, horreurs, machines et habitants (§2.2).
- **Sans monde d'Orvane** (premier lancement hors ligne, instantané injoignable et rien en cache) : `appliquerIle` s'arrête (`orvane-sv.js:319`) et **toute l'ancienne faune revient**.
- **Les espèces ajoutées d'office.** `bestiaireGraine` ajoute toujours l'oglodon, le félin, le bramard, la sterne, les trottins, le dragon et les coursiers rouge et d'aurore (`index.html:14317-14324`). Ils ne naissent plus, mais :
  - l'aperçu du portail les annonce encore ;
  - une bête déjà née reste sur l'île jusqu'à sa mort.
- **Le terrain est taillé pour elles** : la fourmilière des oglodons, les hautes plaines du bramard, l'aire du dragon, la colonie de sternes sur les îles volantes.
- **Les lignées sont muettes.** Leur voix devait venir du modèle, mais la table des voix est enfermée dans le module du son (`index.html:1372`), et la copie échoue sans bruit.

---

## 2. Inventaire des créatures faites main

### 2.1 La faune sauvage (ce que le chantier retire)

| groupe | espèces | code propre |
| --- | --- | --- |
| Rampants | brouteur, bossu, glaneur, traqueur, spectre | corps commun + `osBossu` ; pattes plantées (`initFoeLegs`…) |
| Telluriens | crapaud-buffle, varan d'ocre, vesseron, cerf de verre, salamandre de braise, cerf des cerisiers (sika) | `osTellurien`, `osCerf`, `instinctTellurien` (le crapaud s'enterre, le varan lézarde, la farce du vesseron, les spores) |
| Doux | lentigrade, cotonnier, carillonneur, oglodon, lentigrade-cerisier | `osDoux`, `osCarillon`, `instinctDoux` (petits en file, cloche d'alarme), `instinctOglodon` (la fourmilière, le nectar) |
| Coursiers (montures) | coursier, orange, rouge, d'aurore | `coursierBones`, `majCoursier` (troupeau, rosée, rodéo) |
| Créatures à part | félin de brume, bramard, sterne des nues, dragon à plumes, renard des pétales | `osFelin` (meute, affût), `osBramard` (rut, joutes), `osSterne`/`majVolant`, `osDragon` (nid, souffle, sommeil) |
| Trottins (petit peuple) | furet, haute-tige, racine, bondelaine, augure | `osTrottin`, `instinctTrottin` (soins, jeux, bagarres) |
| Faune du volcan (**gardée**, décision du §9) | magmaton, basilic de lave, charognard de cendre, le Tisonnier (alpha) | `volcan.js:654-1400` |

Ce sont les 30 espèces de `Corr.FAUNE`, plus les quatre du volcan. Leurs corps et leurs pictogrammes font environ 135 Ko d'`index.html` et 30 Ko de `volcan.js`. Leurs comportements à part (`instinct*`, `maj*`) s'y ajoutent.

### 2.2 Les créatures qui ne sont pas de la faune (à garder, sauf décision contraire)

| groupe | créatures | où |
| --- | --- | --- |
| Boss et gardiens | Tisseuse de fer et araignons, Mère-Charogne (Vyrel), Silencieux et Mille-gueules (terres de l'effroi) | `index.html`, `vyrel.js` |
| L'île démoniaque | mages du cercle, Rôdeurs, Démon, larves, diablotins ; les 11 habitants des Cercles de cendre (Mère des larves, Bourreau, Chœur, Roi démon…) | `brume.js`, `roi.js`, `trone.js` |
| Machines | traceur, moissonneur, mercenaire, sentinelle, tireur d'élite, mortier ; les machines du Centre | `index.html`, `donjon.js`, `rouages.js` |
| Habitants | villageois, Nomades du Seuil (et la bête du dresseur) | `village.js`, `nomades.js` |
| Visions et objets | les hallucinations du Korlaz, les Veilleurs et les pièces de l'Achromie, les plantes rares (rangées comme des bêtes), les maisons | `etats.js`, `achromie.js`, `flore.js`, `village.js` |

### 2.3 Ce qui casse si on retire la faune faite main

Chaque point doit avoir son remplaçant avant la suppression.

1. **Les lignées elles-mêmes.**
   - Les créatures modèles servent de base à chaque lignée (`especeJeu`, `appliquerDef`, `completer`, `especeDeSecours`). Supprimer le brouteur supprime toutes les lignées bâties sur lui.
   - Remplacement : des **profils neutres** calculés depuis les données d'Orvane, sans espèce faite main derrière.
2. **Le nombre de bêtes par île.**
   - Le budget d'une île est la somme des effectifs et des poids **des espèces faites main retirées** (`budgetDe`, `orvane-sv.js:545`). Les lignées se le partagent.
   - Sans elles, le budget tombe à zéro.
   - Il faut une vraie table de budget par régime et par sol.
   - `bestiaireGraine` tire toujours un herbivore en premier. Sur une liste vide, le jeu plante, y compris dans l'aperçu du portail.
3. **Le monde de secours.** Pour jouer sans connexion dès le premier lancement, il faut livrer un abrégé du monde d'Orvane avec le jeu.
4. **Les matières.**
   - La viande est rangée par espèce (`VIANDES`, 25 viandes `v_<espèce>`). Une vingtaine de recettes en nomment une : brochette du glaneur, pot-au-feu du cotonnier, filet de dragon ×4, blanc d'aurore ×3…
   - Avec la faune d'aujourd'hui, la plupart de ces recettes sont **déjà impossibles**. Seules les viandes du brouteur, du glaneur, du traqueur et du cotonnier tombent encore, par les lignées.
   - La rareté d'une lignée passe par la viande de son modèle (`rareEspece`).
   - Les plumes ne tombent que des sternes et des charognards : les dons du Vent en dépendent.
   - Les éclats de bois viennent du cerf de verre, le cœur de braise de la salamandre, le basalte du magmaton.
   - Le **nectar d'oglodon** sert aux dons de la Lumière et à l'élément lumière de la forge.
   - Remplacement : des **matières tirées du corps** de la lignée (viande selon la taille et le régime, plumes des ailes, écailles, chitine, corne, venin, nectar des butineurs…).
5. **Les compagnes.** Ces tables sont rangées par espèce :
   - les compétences (`COMPETENCES` : une par famille, une pour chacune des six créatures à part) ;
   - les métiers (`APT`) et la façon de se lier (`FACONS`) ;
   - les dons de la pêche (sterne), du saut (cerf) et des friandises (trottins) ;
   - la monture (coursiers seulement).
   - Remplacement : **par traits** (un fouisseur creuse, un grimpeur cueille en hauteur, un nageur pêche, un oiseau éclaire, un grand quadrupède se monte).
6. **Les sauvegardes.**
   - Les compagnes liées gardent l'id de leur espèce.
   - Au chargement, **une compagne dont l'espèce n'existe plus est effacée sans un mot** (`index.html:27613`). Il en va de même pour :
     - les gardiennes du campement ;
     - le carnet des variantes ;
     - la confiance de la colonie d'oglodons ;
     - les conduites observées.
   - La migration (§9, question 3) doit passer avant ce filtre.
   - Le relevé des îles visitées compte les bêtes **par position dans `SPEC`** (`index.html:6570`). Retirer ou déplacer une ligne décale les noms des îles déjà vues. C'est déjà fragile, puisque les lignées s'ajoutent en fin de liste au chargement.
7. **La faune partagée** (`faune.js`).
   - Une bête s'y désigne par `sp.id`, et un id inconnu ne naît pas chez l'autre joueur.
   - Ces mécanismes reposent sur des drapeaux d'espèces faites main : les sortes à part (`myco`, `dragon`…), les gestes (nourrir le dragon, puiser le nectar), la colère de la colonie.
8. **La chasse aux villageois.** Seuls les traqueurs, spectres, varans, salamandres, félins et dragons ont `villageois` dans leur liste de proies.
9. **Ce que seules tes créatures savent faire**, à redonner aux lignées par traits :
   - **la monture**, avec tout le rodéo : les coursiers ;
   - **la pêche et la récolte des îles volantes** : la sterne, le cerf ;
   - **les friandises et les soins** : les trottins ;
   - **le nectar** : l'oglodon ;
   - **les six compétences à part**, la « Secousse » des Telluriens, la charge des coursiers ;
   - **deux techniques des Nomades** (« regard oblique », « souffle lent »).
10. **Le code commun à garder**, même s'il vit dans une section d'espèce :
    - l'intelligence générique de `majBete` ;
    - le vol de la sterne (`volerVers`), que reprennent les lignées volantes ;
    - les automates (`majAutomate`, `automateBones`), que reprennent les machines d'Orvane ;
    - la mise en meute à l'apparition (`poser`).
11. **Les textes.**
   - Nomades : `nomades.js:583-638, 771-774, 926-927, 1134-1137`.
   - Dons : `dons.js:907`.
   - Indices, rumeurs, carnet, onglet Bêta (téléport, apparitions).

### 2.4 Bugs trouvés en route (hors faune)

- **La Mère des larves ne bouge plus**, probablement depuis le §185. `roi.js:416` et `vyrel.js:324` déclarent tous les deux `majMere`. `vyrel.js` est chargé après, donc le boss du premier cercle appelle l'animation de la Mère-Charogne avec de mauvais arguments.
- **Le dessin peut lâcher pour toute la session.** Aucune protection autour du dessin de chaque bête : un seul corps qui plante, deux fois, fait passer tout le jeu en affichage simplifié (canvas) jusqu'au rechargement.
- **La bête du dresseur est tirée dans tout `SPEC`** (`nomades.js:150`). Elle peut tomber sur une maison, une plante, une vision ou un boss.
- **Le modèle de traducteur d'Orvane est plus avancé que la copie du jeu.**
  - Les docs d'Orvane décrivent des §224 à §231 de Stone Valley (familles, signes, castes, savoirs, élevage). Ils n'existent pas dans ce dépôt : le journal s'arrête au §223.
  - Le `orvane/corps.js` du jeu ne connaît pas les nouvelles formes (segmenté, rayonné, tentacules) : il en fait des quadrupèdes.
  - On reprendra ce qui sert, en ne modifiant que Stone Valley.
- **Une branche abandonnée** (`stonevalleyoff-ai-Orvane`, 26 octobre : `vivant.js`) garde un premier essai de faune vivante. Elle peut être supprimée.

---

## 3. La flore

**Elle n'est pas mélangée dans le jeu.** Le jeu ne télécharge pas `flore.json` et l'instantané d'Orvane ne contient aucune plante.

| ce qui est à toi | combien | à quoi ça sert |
| --- | --- | --- |
| La flore de la carte (`ESP`, `index.html:3006`) | 69 espèces, dont 53 plantes (le reste : roches, métaux) | bois, fibres, baies, éclats ; 34 qui freinent, 33 qui arrêtent (§14) |
| Les plantes rares (`flore.js`) | 264 (22 biomes × 12), de commune à légendaire | 264 ingrédients `p_fl…`, l'alchimie de rang 3 à 5 |
| Les ingrédients | 314 `p_*` | ~100 recettes, l'alchimie, la forge, la culture (48 plantes à semer + les 264 rares) |

**La flore d'Orvane ne peut pas la remplacer.**
- Elle n'a qu'une lignée par forme et par biome (« Tadé arbre », « Roul buisson »), avec un nom fait de syllabes au hasard.
- Elle n'a ni couleurs, ni matières, ni rareté, ni graines.
- Elle n'a rien pour les biomes propres au jeu (nuages, volcan, village, île démoniaque).
- Elle met de l'herbe et un arbre de 12 m dans la sylve fongique.

**Recommandation :** garder ta flore telle quelle. Le seul lien utile à créer va dans l'autre sens : laisser le **régime** des lignées d'Orvane (feuilles, fruits, graines, nectar) décider vers quelles plantes elles vont. Un mangeur de fruits va aux buissons à baies, un butineur aux fleurs. Ta flore reste le décor et la ressource, et elle sert aussi le comportement.

---

## 4. Le dessin et l'animation aujourd'hui

**La technique.**
- Le jeu est en WebGL2 écrit à la main.
- Chaque bête est reconstruite à chaque image en une liste d'« os » : des boîtes, prismes ou boules orientés, avec leur couleur.
- L'éclairage est celui de Minecraft (faces plus ou moins claires) sur une texture de grain. Il n'y a ni contour ni brillance.
- Une bête de lignée fait en moyenne 38 os (58 au plus), environ 650 triangles de près.

**Les lignées** (`lignees.js`, 41 Ko).
- `lgMesures` tire les proportions de la masse, du régime et des déplacements : un lourd s'épaissit, un petit a une grosse tête, un coureur des pattes fines.
- Les pièces sont posées une à une : tronc, pattes à genou plié, tête avec mâchoire, yeux qui clignent, oreilles qui frémissent, queue en cinq segments, organes (cornes, massue, aiguillon, collerette…).
- Les poses : marcher puis galoper, brouter, traquer, mordre, dormir, voler, nager, s'enterrer.

**Ce qui manque ou ne va pas.**
- **Aucun réglage de style.** La profondeur de l'île (`profondeur()`) est lisible au moment du dessin, mais rien ne s'en sert, et une bête ne garde pas l'île où elle est née.
- **Les largeurs des os ne suivent pas la taille.** Une bête de 30 g est dodue, une de 50 kg toute maigre, et toutes les petites ont des pattes de 7 cm.
- **Toutes les transitions sont sèches** : se coucher, s'accroupir et se réveiller se font d'une image à l'autre. Pas d'élan avant l'attaque, pas de réaction au coup (juste un flash), pas de pose de saut.
- **Les nouvelles formes d'Orvane** (segmenté, rayonné, tentacules) deviennent des quadrupèdes.
- **La texture vient de la créature modèle** : de la chitine pour presque tout le monde.
- **Les pictogrammes** font 16 × 16 pixels. Le carnet et la carte de la cible n'ont pas d'image.

**Ce qui se réutilise.**
- Le format des os et le moteur de formes (boules, prismes, effilés).
- Les pattes plantées à genou (`piedsPoses`, `genou`).
- Le lissage par images clés du démon (`brume.js`).
- Les surcouches de variantes, de fureur et de conduites.
- La fabrique de pictogrammes.

Les points d'entrée existent tous : `osDeBase`, `lgMesures`, `foeBones`, le shader `DECOR_FS` (des bits de drapeaux sont libres), `matiereEspece`.

---

## 5. Le comportement aujourd'hui

**Le tronc commun est solide** (`majBete`, `index.html:15279`). Une chaîne de priorités :
- conduites d'Orvane, enterré, assaut, fureur, fuite, acculé ;
- traque à deux places d'attaque, boire, chasser, quête ;
- brouter, dormir, troupeau, errer, curiosité.

Il gère aussi la faim, la soif et l'énergie, « la faim plus forte que la peur » (§24), l'habituation au joueur calme, le contournement des marches et les parois. Tout cela marche pour n'importe quelle lignée.

**Mais il est nourri par la créature modèle.** La vue, la peur, le troupeau, la maturité, la curiosité, le régime et la liste des proies sont ceux du cotonnier, du brouteur, du glaneur ou du traqueur.

**Et la personnalité est câblée sur tes espèces.** Une vingtaine d'espèces ont leur propre intelligence, et cinq familles ont leur instinct (Tellurien, Doux, Oglodon, Trottin, Bramard, Félin). C'est là que vivent :
- la meute qui chasse ensemble et l'affût ;
- les jeux et les soins ;
- le rut et les joutes ;
- la colonie ;
- les petits qui suivent leur mère en file.

Aucune lignée n'y a accès.

**Ce qu'Orvane donne et que le jeu ignore.**

| donnée d'Orvane | ce qu'elle dit | lue par le jeu ? |
| --- | --- | --- |
| `diete` | feuilles, fruits, graines, nectar, insectes, viande, sang | non |
| `appetence` | qui peut chasser qui (taille de 1/50 à 1,5 fois la sienne, vitesse, vol, heure) | non |
| `sociabilite`, `quant.sociabilite` | solitaire → grégaire, et l'écart propre à chaque bête | non |
| `temperament`, `perception` | hardiesse, portée des sens | à peine (le seuil des Doux) |
| `activite` | diurne, crépusculaire, nocturne, continue | nocturne seulement |
| `locomotion` | saut, course, reptation, fouissage, escalade, vol, nage | escalade, vol, nage pure, terrier |
| `reproduction`, `maturite`, `portee` | ovipare ou vivipare, âge adulte, taille de la portée | non (pas d'œufs, pas de nids) |
| organes « d'avertissement » | collerette, couleurs d'alerte (11 lignées) | non |
| groupes (`moteur/collectif.js`) | troupeau, meute, banc, volée, essaim, colonie ; chef, sentinelles, chasse en cercle | non (pas encore publiés dans le monde d'Orvane) |
| savoirs, castes, stades | des gestes appris, des colonies, une larve puis un adulte | non |
| maladie, infection | des populations malades | non |

**Les conduites** (`conduites.js` : le jet, le dard, la carapace, le camouflage, l'alerte, la défense des petits, la charge…) sont la seule partie vraiment générique. Mais :
- elles ne visent que le joueur, pas les autres bêtes ;
- le monde actuel porte surtout les traits « métabolisme lent », camouflage, vibrisses et grégarisme. Le jet et le dard n'y existent pas encore ;
- la « charge » fait mal, mais la bête ne charge pas.

---

## 6. Ce que le monde d'Orvane permet, et ses limites

Une fois la genèse 7 écartée, il reste 118 bêtes sur les sols du jeu.
- **Les formes** sont variées : 72 quadrupèdes, 31 serpents et poissons, 10 à six ou huit pattes, 4 oiseaux.
- **Elles sont petites** : la moitié pèse moins de 500 g, 90 % moins de 8 kg, la plus grosse 60 kg.
- **Les organes sont rares** : 0,3 à 0,5 par lignée (antennes, collerettes, carapaces, crêtes, une massue…).

| les plus douces (début de partie) | les plus redoutables (îles lointaines) |
| --- | --- |
| Kivine broutard de forêt (35 g, six pattes) | Kaorvi picoreur des fonds (60 kg, crête) |
| Soméne mangeur d'herbe (20 g, antennes) | Mufir rapace de forêt (2,8 kg, ailes) |
| Musilnou tondeur de prairie (60 g, grimpe, saute) | Tiskata fureteur de côte (35 kg) |
| Anka brouteur de savane (50 g) | Nesil glaneur de mangrove (40 kg) |
| Vavator broutard de mangrove (90 g, grimpe) | Visoka rôdeur de marais (panache) |

La matière du mignon est là. **L'épique, il faut le construire côté jeu.** C'est d'ailleurs ce que demande Orvane : la simulation propose, le jeu montre.

---

## 7. Proposition

### 7.1 Du mignon à l'épique : par les espèces (décidé le 6 novembre)

Chaque lignée a **un seul aspect**. La progression vient de deux choses.

**1. La puissance d'une espèce décide de son style.** Chaque lignée reçoit une note de **puissance**, calculée depuis Orvane :
- sa masse ;
- son régime (un carnivore pèse plus qu'un brouteur) ;
- ses organes et leur taille ;
- son tempérament ;
- sa rareté.

La note est un **rang** parmi les lignées du monde : la plus douce vaut 0, la plus redoutable 1. Le style suit ce rang, de façon continue.

| rang | allure |
| --- | --- |
| **0 → 0,3 · les mignonnes** | toutes rondes, tête énorme, grands yeux brillants, pattes courtes, couleurs douces |
| **0,3 → 0,7 · les ordinaires** | la silhouette d'Orvane telle quelle |
| **0,7 → 0,9 · les redoutables** | plus grandes, organes exagérés (cornes, crêtes, épines), robe contrastée, marques lumineuses |
| **0,9 → 1 · les épiques** | immenses, silhouette anguleuse, lueurs qui pulsent, particules selon le biome (poussière, braises, givre) |

**2. L'île choisit les espèces.**
- Les premières îles tirent les lignées les plus douces.
- Plus on s'éloigne, plus le tirage glisse vers les rangs élevés.
- Les trophées et le chasseur garanti (§218) prennent toujours le rang le plus haut que l'île permet.

**Ce qui reste reconnaissable** : une espèce a la même allure partout. Un Musilnou croisé à l'île 2 est le même à l'île 20.

**Le point de vigilance** : le monde d'Orvane n'a qu'une quinzaine de lignées redoutables aujourd'hui (§6). Les îles lointaines risquent de montrer souvent les mêmes. Trois parades :
- le rang est relatif : il y aura toujours un haut du classement ;
- les îles lointaines mêlent quelques rangs moyens à leurs bêtes redoutables ;
- le monde d'Orvane évolue chaque nuit, et de nouvelles lignées viendront.

**Côté Orvane, rien ne change.** Le rang est une affaire d'affichage et de jeu.

### 7.2 Le style Stone Valley

Un nouveau `lignees.js`. Tout est calculé, rien n'est dessiné à la main par espèce. Le réglage est le rang de puissance (§7.1).
- **Les formes.**
  - Des boules et des formes arrondies chez les mignonnes.
  - Des prismes et des formes effilées chez les épiques.
  - Le moteur de formes du §186 le permet déjà.
- **Les proportions.**
  - La tête passe de 0,9 à 0,45 de la longueur du tronc ; les yeux de 35 % à 12 % de la tête.
  - Les pattes passent de ×0,6 à ×1,2 ; les organes de ×0,6 à ×1,8.
  - Les largeurs suivent enfin la taille.
- **Les couleurs.**
  - La robe d'Orvane, adoucie (pastel) chez les mignonnes, saturée et contrastée chez les redoutables.
  - Le motif (rayures, taches) devient lumineux chez les épiques.
- **La lumière.** Un bit « créature » dans le shader donnera :
  - un liseré de lumière sur les bords, qui détache la bête du décor ;
  - de vraies lueurs qui brillent la nuit (aujourd'hui `luit` s'assombrit comme le reste).
- **Les matières.** Fourrure, écailles, chitine, plumes ou peau lisse, selon la forme et les traits de la lignée, et non plus selon la créature modèle.
- **Le portrait.** Un vrai portrait dans le carnet, la carte de la cible et le panneau des compagnes, en plus du pictogramme.
- **Les nouvelles formes d'Orvane.** Mettre à jour `orvane/corps.js` du jeu et dessiner le segmenté, le rayonné et les tentacules.

### 7.3 L'animation

Un seul système pour toutes les lignées :
- des états qui se fondent l'un dans l'autre ;
- des ressorts sur les oreilles, la queue et les antennes ;
- de l'écrasement et de l'étirement ;
- de l'anticipation avant une attaque, une réaction aux coups.

Tout est réglé par le rang de puissance et par le caractère de la bête.

**Les mignonnes.**
- Une démarche qui rebondit, qui s'écrase un peu à chaque pas.
- Une tête qui dodeline, des oreilles molles, une queue qui frétille, des clignements fréquents.
- Au repos, il s'assoit, se gratte, renifle, se roule par terre, bâille, ou te regarde la tête penchée.
- Surpris, il sursaute sur place, oreilles dressées, puis file en zigzag.
- De petits signes au-dessus de la tête : ! en alerte, ? s'il est curieux, ♥ quand on le nourrit, Zzz quand il dort.

**Les ordinaires.**
- Une allure naturelle, avec les pattes plantées au sol (fini les pieds qui glissent).

**Les redoutables et les épiques.**
- Des pas lents et lourds : la poussière se soulève, la caméra tremble un peu à l'approche.
- Le poids passe d'une patte à l'autre, le souffle se voit (buée, fumée).
- Le regard te suit lentement.
- Avant d'attaquer, une **parade** : il se dresse, déploie sa collerette ou sa crête, baisse les cornes, rugit.
- Ses organes pulsent de lumière.
- **Des attaques signature tirées de ses organes** :

| organe | attaque |
| --- | --- |
| cornes, défenses | une vraie charge en ligne, annoncée au sol |
| massue | un coup de queue en arc |
| aiguillon | une piqûre à distance |
| carapace | une roulade |
| ailes | un piqué |
| collerette | une intimidation qui fait reculer |

**La bête la plus redoutable d'une île tient le rôle d'alpha**, comme le Tisonnier, mais pour n'importe quelle lignée.

### 7.4 Le comportement, tiré d'Orvane

Plus de créature modèle. Chaque lignée reçoit un **profil de vie** calculé depuis ses données.

| d'après | elle |
| --- | --- |
| sa diète | broute l'herbe, cueille sous les buissons à baies, butine les fleurs, gratte et picore pour les insectes, chasse, ou filtre dans l'eau |
| l'appétence d'Orvane | ne chasse que ce qui est à sa mesure (taille, vitesse, vol, heure) |
| sa sociabilité | vit seule, en couple, en famille, en troupeau ou en meute, avec un chef, des sentinelles et les petits au centre ; la meute chasse en cercle |
| son tempérament et son audace | est peureuse, curieuse, joueuse ou territoriale, et deux bêtes de la même espèce n'ont pas le même caractère |
| son activité | vit le jour, à l'aube et au crépuscule, la nuit, ou tout le temps |
| sa locomotion | saute, court, rampe, fouit, grimpe, plane, vole ou nage, chacune à sa façon |
| sa reproduction | pond dans un nid qu'elle garde (ovipare), ou mène des petits qui la suivent (vivipare) |
| ses organes | se défend par ses conduites, et prévient avant d'attaquer (collerette, couleurs d'alerte) |

**Les bêtes réagissent aussi entre elles.** L'alerte fait fuir le troupeau devant un chasseur, le camouflage trompe les prédateurs. L'île vit sans le joueur.

**Selon le rang.**
- Les mignonnes sont curieuses et joueuses : elles approchent un joueur calme, se poursuivent entre elles, te suivent un moment. Les jeux des Trottins deviennent ceux de toutes.
- Les redoutables et les épiques sont territoriales : elles tiennent une zone, font leur parade, protègent leur groupe.

**Ce qui est déjà générique reste** : la faim, la soif, la peur, l'habituation, le contournement, les conduites, l'hérédité, la méfiance.

### 7.5 Les compagnes

- **Le métier vient du corps et des traits.**

| la bête | son métier |
| --- | --- |
| brouteur | fibres |
| fouisseur | pierres et galets |
| grimpeur | fruits en hauteur |
| nageur | pêche |
| oiseau | éclaireur, plumes |
| chasseur | os et viande |
| vibrisses ou yeux de nuit | trouvailles |

- **La compétence** est tirée de l'organe le plus marqué : charge, piqûre, roulade, souffle de la glande…
- **La façon de se lier** dépend du tempérament et du régime : un peureux se gagne par la patience, un chasseur rassasié se laisse approcher.
- **La monture** : tout quadrupède assez grand, à la place des coursiers.

---

## 8. Le plan du chantier

Sept lots. Après chacun, le jeu tourne, chaque `<script>` compile, et une section du journal (§224 et suivants) dit ce qui a changé.

| lot | contenu | taille |
| --- | --- | --- |
| **0 · Ménage immédiat** | carte des sols sur les biomes d'Orvane ; genèse 7 écartée ; le bug de la Mère des larves ; la protection du dessin | petit |
| **1 · Plus de faune faite main** | socles neutres à la place des créatures modèles ; budget des îles par régime ; monde de secours livré avec le jeu ; plus d'espèces ajoutées d'office ni de repli « garde ses Doux » ; matières et viandes tirées du corps (recettes revues) ; voix ; textes | gros |
| **2 · Le corps, style Stone Valley** | rang de puissance ; tirage des îles par rang ; nouveau `lignees.js` gradué du mignon à l'épique ; largeurs à l'échelle ; matières ; bit « créature » dans le shader (liseré, vraies lueurs) ; nouvelles formes ; portraits | gros |
| **3 · L'animation** | états fondus, ressorts, écrasement et étirement ; le vocabulaire des mignonnes et celui des épiques ; gestes de repos ; parades ; attaques signature | gros |
| **4 · Le comportement d'Orvane** | profils de vie : diète, appétence, groupes, rythmes, locomotions, nids ; réactions entre bêtes ; caractères selon le rang | gros |
| **5 · Les compagnes** | métiers, compétences, liens et montures par traits ; migration des compagnes faites main vers la lignée la plus proche, avant le filtre de chargement ; carnet avec portraits | moyen |
| **6 · Le grand nettoyage** | suppression du code des anciennes créatures (corps, instincts, tables, pictogrammes, environ 200 Ko) ; onglet Bêta ; service worker ; docs | moyen |

**Où on en est.**
- **Lot 0 fait** (§224).
- **Lot 1 fait** (§225). La migration des compagnes a glissé au lot 5 : une compagne faite main garde ses talents (monture, pêche, soins) tant que les lignées ne savent pas les reprendre par leurs traits.
- **Lot 2 bien avancé** (§226, §229, §230) :
  - fait : la puissance, le tirage des îles par la puissance, l'allure du mignon à l'épique, les largeurs à l'échelle, les vraies lueurs la nuit, la matière du corps ;
  - reste : un liseré de lumière dans le shader, les nouvelles formes (segmenté, rayonné, tentacules), les portraits.
- **Lot 3 commencé** (§227) :
  - fait : les états qui se fondent, le ressort des mignonnes, le poids des épiques, le recul, les signes « ! » et « z » ;
  - reste : les gestes de repos, les parades et les attaques signature.
- **Lot 4 commencé** (§228, §231) :
  - fait : les rythmes (crépusculaires, jour et nuit), le joueur qui n'est plus une proie pour les petites bêtes, les mangeurs de fruits aux buissons ;
  - reste : les groupes (meutes, chefs, sentinelles), les nids, les réactions entre bêtes, l'équilibre des chasseurs au loin.
- **Lots 5 et 6** : pas commencés.

L'ordre 0 → 1 → 2 → 3 → 4 → 5 → 6 garde le jeu jouable à chaque étape. Les anciennes créatures disparaissent des îles dès le lot 1, et leur code part au lot 6, une fois que plus rien n'en dépend.

---

## 9. Les décisions (6 novembre 2026)

1. **Le périmètre.** On retire :
   - la faune ordinaire : Rampants, Telluriens, Doux, Coursiers (21 espèces) ;
   - les créatures à part : félin de brume, bramard, sterne des nues, dragon à plumes, renard des pétales ;
   - les cinq Trottins.

   **On garde** :
   - la faune du volcan : magmaton, basilic, charognard, Tisonnier ;
   - les boss et les horreurs : Tisseuse, Silencieux, Mille-gueules, Mère-Charogne, l'île démoniaque et les Cercles ;
   - les machines et les habitants.
2. **La flore.** On garde la tienne, sans mélange (§3). Les lignées choisissent seulement leurs plantes selon leur régime.
3. **Les compagnes déjà liées** d'une espèce retirée deviennent la lignée d'Orvane la plus proche (même régime, taille voisine). Elles gardent leur nom et leur niveau, et le joueur en est averti.
4. **Le mignon → épique** passe par les espèces seulement : le style suit le rang de puissance de chaque lignée, et l'île choisit les espèces (§7.1). Pas de stades.

**Conséquences sur le plan.**
- Lot 1 : les espèces du volcan restent dans `Corr.FAUNE` hors du retrait. Leurs viandes, le basalte et la plume du charognard restent.
- Lot 6 : le code des boss, du volcan, des machines et des habitants ne bouge pas. Le code commun qu'ils partagent avec les espèces retirées reste : les pattes plantées (`PATTES_T`, `piedsPoses`), utilisées par le magmaton et le basilic, et le vol (`volerVers`).
- Le dragon disparaît aussi, avec son aire, son nid et ses recettes. Les Trottins emportent les soins et les friandises, à redonner par traits (§7.5).
