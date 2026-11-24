# Sudoku Training — application d'exercices (Angular)

Application web pour revoir les coups des grilles de sudoku déjà résolues (niveau 13, magazine).
Textes de l'interface **en anglais**. Coordonnées affichées **RxCy** (ligne x, colonne y, de 1 à 9).

## État d'avancement

> À tenir à jour à la fin de chaque fonctionnalité. Dernière mise à jour : 2026-11-24.

### Fait

- **Socle** : Angular 22 + Tailwind 4, génération statique (`outputMode: "static"`, toutes les routes pré-rendues au build, serveur Express retiré). Organisation `pages/` / `exercise/` / `board/` (voir `CLAUDE.md`).
- **Identité** : logo dans l'en-tête (pleine largeur), polices Google Fonts, couleurs en tokens Tailwind (`src/styles.css`), thème clair, fond blanc.
- **Accueil** (`/`, chargé en lazy) : grille du 14 novembre **codée en dur** (`public/data/exercices-2026-11-14.json`), navigation libre entre les coups (‹ › et ← →, ligne « date · k / N »).
- **Grille SVG** (`Board`) : rendu de la question et du schéma de solution, porté de `renderCard` (cercles, chiffres barrés, flèches numérotées par branche, cases non concernées en gris) + mise en évidence des derniers candidats de la zone rouge.
- **Exercice** : question avec badges vert/rouge, boutons des candidats, « Found! » / « Lost », explication + piste, « ↺ Reset », « Next move → », question masquée après la réponse, focus et annonces pour les lecteurs d'écran.
- **Pas à pas** : animation des étapes du schéma (0,6 s par étape) et ronds numérotés cliquables pour n'afficher la solution que jusqu'à une étape.
- **Outillage** : Prettier (tout le projet, `.prettierignore`), ESLint avec angular-eslint (`pnpm lint`, règles d'accessibilité des templates et conventions du `CLAUDE.md`).
- **Mise en page** : l'exercice tient dans la hauteur de l'écran moins l'en-tête (minimum 30rem) ; empilé sur téléphone et tablette en portrait, côte à côte en `md:landscape` (grille sur toute la hauteur à gauche ; à droite, tout aligné en haut : navigation entre les coups, puis question et résultat).

### Revue du code en cours (règles : section « Code readability » et « State Management » du `CLAUDE.md`)

Revue composant par composant, avec l'utilisateur, pour rendre le code explicite et déplacer l'état dans des Signal Stores locaux.

- Fait : `App`, `Home`, `Exercise` (+ `ExerciseStore`), `ExerciseNav` (navigation entre les coups sortie d'`Exercise` le 2026-11-24 : composant de présentation, inputs/outputs, gère aussi ← →).
- Convention décidée le 2026-11-24 : tous les fichiers, classes et sélecteurs du domaine exercice commencent par `exercise`. Le mot « move » (`Move`, `MoveData`, inputs `moveNumber` / `moveCount`) doit disparaître : nouveau nom à choisir avec l'utilisateur.
- À faire, dans l'ordre : `Move` (état de la réponse et de l'animation à passer dans un store ; supprimer les ternaires imbriqués du calcul de l'état des boutons), `Board`, la géométrie (`board-geometry.ts`, `solution-geometry.ts`), les modèles.

### Prochaines étapes (ordre proposé, à confirmer avec l'utilisateur)

1. **`index.json` + `scripts/build-index.mjs`** (scripts `prestart` / `prebuild`), puis accueil complet : tirage d'une grille au hasard, enchaînement des grilles, liste des grilles sous l'exercice.
2. **Page Grids** (`/grid/:nom`) et **menu** Home · Grids · Patterns.
3. **Page Patterns** (`/patterns`) : contenu de l'artefact « Motifs de sudoku », à fournir.

### Points ouverts

- `docs/sudoku-training-modele.html` : gardé pour l'instant ; à supprimer plus tard (tout ce qui servait est porté), en mettant à jour la SPEC et `CLAUDE.md`.
- Schéma de solution vérifié à l'œil seulement (pas de comparaison automatique avec le rendu de référence).
- `autresReponses` : géré dans le code mais jamais testé (la grille du 14 novembre n'en a aucune).
- Aucun audit AXE lancé pour l'instant ; pas de tests unitaires (choix de la première étape).
- Contraste : texte blanc sur les couleurs des 3e et 4e branches (orange `#e07800`, turquoise `#0f9aa0`) sous le seuil WCAG AA (ronds numérotés et pastilles de la grille) ; à décider (assombrir ces couleurs ou non).
- À tester sur un vrai téléphone (lisibilité du texte et de la grille).
- Numéro du coup dans l'URL : non pour l'instant ; à envisager sur `/grid/:nom`.
- Noms de champs du JSON en franglais : à revoir plus tard, côté export Python.

## Données

Les exercices sont produits par `python3 sudoku_training.py grille-AAAA-MM-JJ.json export` (un fichier par grille). Pour ajouter une grille, il suffit de déposer son fichier dans `public/data/`.

- `exercices-AAAA-MM-JJ.json` : un fichier par grille, chargé à la demande (ne jamais tout charger d'un coup).
  ```json
  {"nom": "2026-11-14", "titre": "November 14 grid", "exos": [ … ]}
  ```
- `index.json` (**pas dans la première étape**) : liste des grilles, **générée automatiquement** par un script Node du projet (`scripts/build-index.mjs`), lancé avant `ng serve` et `ng build` (scripts npm `prestart` et `prebuild`). Il lit tous les `public/data/exercices-*.json` et écrit :
  ```json
  {
    "grilles": [
      {
        "nom": "2026-11-14",
        "titre": "November 14 grid",
        "fichier": "exercices-2026-11-14.json",
        "exos": 20
      }
    ]
  }
  ```
  Grilles triées par date. Ne jamais éditer `index.json` à la main.

Un exercice (`exos[i]`) — coordonnées internes de 0 à 8, `[ligne, colonne]` :

| Champ            | Contenu                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `coup`           | numéro du coup dans la grille (1..N), ordre de la grille                                                       |
| `vals`           | 81 valeurs, ligne par ligne, 0 = case vide                                                                     |
| `givens`         | 81 × 0/1 : 1 = chiffre donné au départ (les autres valeurs ont été posées par les coups précédents)            |
| `cands`          | candidats des cases vides : `{"r,c": [1,4,7]}`                                                                 |
| `under`          | chiffres soulignés `[r, c, chiffre]` (candidat qui n'a que 2 places dans une ligne, colonne ou bloc)           |
| `depart`         | case de départ `[r, c]` (en vert)                                                                              |
| `reponse`        | le candidat de la case de départ à éliminer                                                                    |
| `autresReponses` | autres candidats acceptés (même zone d'arrivée) : `[{"v": 8, "frames": […], "etapes": 8}]` ; souvent vide      |
| `arrivee`        | zone rouge : `{"type": "unit" \| "cell", "nom": "box 3" \| "R5C9", "chiffre": 6 \| null, "cases": [[r,c], …]}` |
| `texte`          | phrase de la contradiction, ex. `"No 6 left in box 3"`, `"R5C9 has no candidate left"`                         |
| `frames`         | le schéma de solution (voir plus bas)                                                                          |
| `etapes`         | nombre d'étapes de la chaîne                                                                                   |
| `piste`          | phrase « What should have caught your eye: » ou `null`                                                         |

### Format du schéma (`frames`)

Liste ordonnée ; numérotation continue des étapes.

- `frames[0]` : `{"kind": "hyp", "circle": [r, c, v], "strikes": [[r, c, d], …]}` — l'hypothèse : on suppose `v` en `(r, c)` (cercle vert) ; `strikes` = candidats barrés par ce placement.
- `frames[1..n]` : `{"kind": "dom", "circle": [r, c, v], "strikes": […], "cause": k, "why": "nu" | "caché ligne 3" | …}` — étape i : `v` est forcé en `(r, c)` (cercle bleu numéroté i) ; **flèche** depuis le cercle de `frames[k]` vers ce cercle ; `why` = singleton nu ou caché (unité en français).
- dernière : `{"kind": "bad", "cells": [[r, c], …], "unit": "bloc 3" | null}` — la zone qui se vide (contour rouge).

Rendu de référence : `docs/sudoku-training-modele.html` dessine la grille et ce schéma **en SVG** pour les pages de révision (fonction `renderCard`, thème `THEMES.sky`). Ce fichier est **une référence de calcul et d'apparence, pas du code à appeler** : `renderCard` crée les éléments SVG à la main (impératif), ce qu'on ne veut pas dans Angular.

Approche demandée (déclarative) :

1. **Fonctions TypeScript pures** (`board/geometry/board-geometry.ts` et `board/geometry/solution-geometry.ts`, sans DOM) qui reprennent les calculs de `renderCard` et renvoient des données : positions des cases et des candidats (`P(r,c,d)`), cases « concernées » (les autres en gris), candidats barrés, cercles avec leur couleur de branche, **flèches** (chemin courbe `d`, pointe, pastille numérotée — l'algorithme d'évitement des obstacles est à reprendre tel quel, c'est du calcul pur).
2. **Composant `Board`** (`board/board.ts`, standalone, signaux) : entrées `board` (`vals`, `cands`, `under`), `highlights` (case de départ, zone rouge, schéma de solution `solution` = `frames`, tous facultatifs ; le schéma est affiché quand `solution` est fourni), `label`, `step` (pour le pas à pas) ; il ne connaît pas les exercices (conversion par `moveHighlights()`) ; un `computed()` appelle ces fonctions ; le template est un `<svg viewBox>` qui affiche le résultat avec `@for` / `@if` (`<rect>`, `<line>`, `<text>`, `<circle>`, `<path>`). Aucune création d'élément à la main, aucun `ElementRef`.
3. Même rendu : fond, traits fins et épais, chiffres posés, candidats en petits chiffres, soulignés, case de départ verte, zone rouge hachurée (motif `<pattern>`), puis en solution : cercles, chiffres barrés, flèches courbes numérotées (une couleur par branche), cases non concernées en gris. **Ajout par rapport au modèle** : les derniers candidats de la zone rouge éliminés par la chaîne (le chiffre `arrivee.chiffre` dans l'unité, ou tous les candidats si l'arrivée est une case) sont barrés comme les autres et entourés d'un carré rouge (fond rouge clair). Ne pas reprendre le texte dessiné sous la grille : l'app affiche ses propres textes en HTML.
   Correspondance des champs : dans le modèle, `m.hyp.cell` = `depart`, `m.hyp.v` = `reponse`, `m.target` = `arrivee.cases`, `m.tkind` = `arrivee.type` ; `vals`, `cands`, `under`, `frames` sont identiques.

## Première étape (faite)

Un test minimal, avant tout le reste. **Seul objectif : vérifier qu'on peut afficher correctement la grille et le schéma de solution dans l'application.**

- Une seule page, qui affiche **un seul coup en dur** : le premier coup de la grille du 14 novembre (`exercices-2026-11-14.json`, `exos[0]`).
- La grille de la question avec le composant `Board` : candidats, chiffres soulignés, case de départ verte, zone rouge.
- Les boutons des candidats de la case de départ. Au clic : « Found! » ou « Lost », et la grille affiche le schéma de solution (cercles, chiffres barrés, flèches numérotées).
- **Rien d'autre** : pas d'`index.json` ni de script pour le générer, pas de tirage au hasard, pas de « Next exercise », pas de menu, pas de page Grille ni Motifs, pas de « Step by step » (mais prévoir l'entrée `step` du composant).
- Pour vérifier le rendu : il doit ressembler au coup 1 de la page de révision « November 14 grid » (question, puis solution).

## Écrans (version complète)

**Navigation libre entre les coups** (ajoutée après la première étape) : au-dessus de la grille, « ‹ AAAA-MM-JJ · k / N › ». Les boutons ‹ / › et les touches ← / → passent au coup précédent / suivant **à tout moment**, sans avoir à répondre (‹ désactivé au premier coup, › au dernier). Le numéro du coup a une largeur fixe (pas de décalage de 9 à 10). Le nombre d'étapes (« 2-STEP CHAIN ») est affiché sous la question. Changer de coup réaffiche le nouveau coup en mode question. Pas de numéro de coup dans l'URL pour l'instant.

### Accueil (`/`)

1. **Un exercice s'affiche immédiatement**, sans clic : charger `index.json`, tirer une grille au hasard, et afficher son **premier coup**.
2. Après chaque exercice (gagné ou perdu) : bouton **« Next exercise »** → coup suivant de la **même grille**, dans l'ordre des coups ; afficher le titre de la grille et « Move k / N ».
3. Quand tous les coups de la grille sont passés : tirer **une autre grille au hasard** (différente de la précédente s'il y en a plusieurs) et recommencer à son premier coup.
4. Sous l'exercice : la **liste des grilles** (titre + nombre d'exercices).

### Grille (`/grid/:nom`)

Clic sur une grille → ses exercices **dans l'ordre des coups** (1, 2, 3…), « Next exercise » passe au suivant ; afficher « Move k / N ». À la fin : message de fin + retour à l'accueil.

### Exercice (composant commun)

- Grille 9×9 avec tous les candidats (petits chiffres), chiffres soulignés, chiffres posés en noir.
- **Case de départ en vert**, **zone d'arrivée en rouge**.
- Question : « Which candidate of RxCy must be eliminated to empty the red zone? » (adapter : « …to leave RxCy without candidates » si `arrivee.type == "cell"`).
- Sous la grille : **un bouton par candidat** de la case de départ (lus dans `cands`).
- Clic sur `reponse` ou une des `autresReponses` → **« Found! »** + schéma de solution (celui du chiffre choisi), `texte`, et `piste` si présente.
- Clic sur un autre candidat → **arrêt immédiat** : **« Lost »**, le bouton cliqué passe en rouge (barré), le bon candidat (`reponse`) est entouré de vert, schéma de solution de `reponse`.
- Une seule réponse par coup : ensuite les boutons sont désactivés. Le résultat affiche `texte`, « so RxCy ≠ v » et, seulement en cas de mauvaise réponse, `piste` ; un bouton « Next move → » (qui reçoit le focus) passe au coup suivant, ou « Last move of this grid. » au dernier coup ; à sa gauche, un bouton secondaire « ↺ Reset » remet le coup en mode question pour réessayer. Une fois la réponse donnée, la question et « N-STEP CHAIN » sont masquées visuellement (gardées pour les lecteurs d'écran) pour laisser la place au résultat et à la piste ; sur téléphone, tout doit tenir sans défilement.
- **Pas à pas** (remplace le bouton « Step by step » prévu à l'origine) : à la réponse, l'hypothèse s'affiche tout de suite, puis une étape toutes les 0,6 s (tout d'un coup si le système demande de réduire les animations). Sous la phrase du résultat (Found!/Lost) et au-dessus de la piste, un rond numéroté par étape (mêmes numéros et couleurs de branche que sur la grille) : tous présents dès le début, gris tant que l'étape n'est pas affichée, colorés ensuite. Une fois l'animation finie, cliquer sur un rond n'affiche que les étapes jusqu'à celle-ci (les suivantes sont masquées sur la grille et leurs ronds repassent en gris). Les carrés rouges de la conclusion n'apparaissent qu'avec la dernière étape ; les cases grisées sont là dès le début.

### Motifs (`/patterns`)

Page présentant les 8 motifs visés : X-wing, Skyscraper, 2-String Kite, XY-wing, W-wing, Swordfish, Empty Rectangle, Finned X-wing. Chaque motif : petite grille d'exemple, explication pas à pas, ce qu'on élimine.
Contenu : reprendre l'artefact « Motifs de sudoku » (à fournir). **Ne pas inclure le rectangle unique** (Unique Rectangle) : écarté volontairement.

Menu : Home · Grids · Patterns.

## Identité visuelle

- Couleurs : bleu marine `#123a66` (traits de blocs, titres), vert `#15924f` (case de départ), rouge `#e0342a` (zone d'arrivée, contradiction), bleu des chaînes `#1f6fd6`. Fond `#f4f8fb`, cellules blanches, lignes fines presque noires.
- Polices : Barlow Condensed (marque), Barlow (textes), IBM Plex Mono (petites mentions).
- Logo : `public/sudoku-training-logo.svg` ; « SUDOKU » en bleu marine, « TRAINING » en vert.
- Responsive : utilisable sur téléphone (grille pleine largeur, boutons de candidats assez grands).

## Plus tard (NE PAS FAIRE MAINTENANT)

Rien de cette section n'est à développer dans la première version. C'est noté pour garder ces évolutions en tête et prévoir une structure qui permette de les ajouter sans tout refaire (par exemple un composant grille réutilisable et un champ « mode » par exercice).

**Autres modes d'exercice**, sur les mêmes grilles et le même écran :

1. **Case de départ** : la zone rouge est montrée, trois cases sont entourées ; choisir la case, puis le chiffre à éliminer avec les boutons. Les deux fausses cases ne doivent avoir aucun candidat menant à une contradiction dans la zone rouge (calculé par l'export Python). Variantes plus dures ensuite : zone rouge seule sans les trois cases, puis rien.
2. **Zone d'arrivée** : la case de départ et le chiffre sont donnés ; cliquer sur l'unité (ligne, colonne, bloc) ou la case qui se vide. Données déjà présentes dans l'export (`arrivee`).
3. **Moteurs** : une paire ou un chiffre souligné est montré avec un sens de bascule ; cliquer sur toutes les cases qui se remplissent. Exercice court (~2 min). Demandera un ajout à l'export.

**Autres évolutions** :

- **Statistiques** (localStorage) : par exercice, gagné / perdu et date ; à terme, reproposer les exercices perdus (répétition espacée).
- Champ facultatif `exclus` dans le fichier grille pour retirer un coup.
