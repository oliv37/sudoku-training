# Sudoku Training — application d'exercices (Angular)

Application web pour revoir les coups des grilles de sudoku déjà résolues (niveau 13, magazine).
Textes de l'interface **en anglais**. Coordonnées affichées **RxCy** (ligne x, colonne y, de 1 à 9).

## État d'avancement

> À tenir à jour à la fin de chaque fonctionnalité. Dernière mise à jour : 2026-11-27.

### Fait

- **Socle** : Angular 22 + Tailwind 4, génération statique (`outputMode: "static"`, toutes les routes pré-rendues au build, serveur Express retiré). Organisation `pages/` / `exercise/` / `board/` (voir `CLAUDE.md`).
- **Identité** : logo dans l'en-tête (pleine largeur), polices Google Fonts, couleurs en tokens Tailwind (`src/styles.css`), thème clair, fond blanc.
- **Accueil** (`/`, chargé en lazy) : grille du 14 novembre **codée en dur** (`public/data/exercices-2026-11-14.json`), navigation libre entre les questions (‹ › et ← →, ligne « date · k / N »).
- **Grille SVG** (`Board`) : rendu de la question et du schéma de solution, porté de `renderCard` (cercles, chiffres barrés, flèches numérotées par branche, cases non concernées en gris) + mise en évidence des derniers candidats de la zone rouge.
- **Exercice** : question avec badges vert/rouge, boutons des candidats, « Found! » / « Lost », explication + piste, « ↺ Reset », « Next move → », question masquée après la réponse, focus et annonces pour les lecteurs d'écran.
- **Pas à pas** : animation des étapes du schéma (0,6 s par étape) et ronds numérotés cliquables pour n'afficher la solution que jusqu'à une étape.
- **Outillage** : Prettier (tout le projet, `.prettierignore`), ESLint avec angular-eslint (`pnpm lint`, règles d'accessibilité des templates et conventions du `CLAUDE.md`).
- **Mise en page** : l'exercice tient dans la hauteur de l'écran moins l'en-tête (minimum 30rem) ; empilé sur téléphone et tablette en portrait, côte à côte en `md:landscape` (grille sur toute la hauteur à gauche ; à droite, tout aligné en haut : navigation entre les coups, puis question et résultat).

### Revue du code en cours (règles : section « Code readability » et « State Management » du `CLAUDE.md`)

Revue composant par composant, avec l'utilisateur, pour rendre le code explicite et déplacer l'état dans des Signal Stores locaux.

- Fait : `App`, `Home`, `Exercise` (+ `ExerciseStore`).
- 2026-11-24 : « move » renommé « question » partout (code et interface : « Next question → », « Question 3 of 20 »). Tous les fichiers, classes et sélecteurs du domaine exercice commencent par `exercise`. `Move` découpé en composants de présentation (`ExerciseNav`, `ExerciseBoard`, `ExerciseQuestion`, `ExerciseCandidates`, `ExerciseVerdict`, `ExerciseSolutionSteps`, `ExerciseMissedClue`, `ExerciseNextActions`) assemblés dans `exercise.html`, qui porte toutes les conditions d'affichage ; état de la réponse et de l'animation dans `ExerciseStore`, découpé en trois features (navigation, réponse, étapes de la solution) ; ternaires imbriqués supprimés.
- 2026-11-24 : noms de fichiers en kebab-case sans suffixe à point, comme dans la documentation NgRx : `store/exercise-store.ts`, features `with-navigation.ts` / `with-answer.ts` / `with-solution-steps.ts`, modèles `exercise-model.ts` et `board/board-model.ts`.
- 2026-11-24, revue de la partie exercice (lisibilité) : le numéro de question vient du store (`questionNumber` = index + 1) pour la navigation et le label de la grille, plus de `coup` ; id de la question généré une fois dans `Exercise` ; boutons des candidats et des étapes calculés par des `computed` ; zone `aria-live` du verdict en `block` (et non `contents`) ; ombre de la grille avec le token `navy` ; `with-answer.ts` : un seul `acceptedFrames` décide si la réponse est acceptée.
- 2026-11-24 : l'étape affichée fait partie de la solution : `Highlights.solution` est un `BoardSolution` (`frames` + `shownStep`, toujours un nombre ; dernière étape pour tout afficher). L'input `step` de `Board` et le cas `null` de `solutionUpTo()` ont disparu ; le store expose `drawnSolution`.
- 2026-11-27 : `Board` reste sans store (aucun état, seulement des valeurs calculées à partir des inputs). Son template est découpé en calques SVG, un composant de présentation par calque dans l'ordre de dessin (`BoardGridLines`, `BoardRedZone`, `BoardStartCell`, `BoardValues`, `BoardCandidates`, `BoardSolutionDiagram`), sélecteurs d'attribut sur `<g>` (autorisés dans la règle ESLint `component-selector`) et éléments préfixés `svg:`. La zone rouge et la case de départ sont dessinées d'un bloc (fond puis contour) après les lignes de la grille, leurs fonds en `mix-blend-multiply` pour que les lignes restent visibles (type `StartCell` ajouté dans `board-geometry.ts`). Tout ce qui dépend de l'étape affichée est dessiné par `BoardSolutionDiagram`, y compris les carrés rouges des derniers candidats de la zone rouge, passés au-dessus des candidats avec `mix-blend-multiply` (le chiffre reste lisible ; seule différence visible : les hachures se voient légèrement à travers le carré). Rendu vérifié dans le navigateur.
- 2026-11-27 : la solution n'est plus dans `Highlights` (qui ne garde que les marques de la question : case de départ, zone rouge) : `Board` a un input `solution` (`BoardSolution | null`). `ExerciseBoard.highlights` ne dépend plus que de la question, et `Board` extrait les frames dans un `computed` : pendant l'animation, seul le filtrage par étape (`solutionSceneUpTo`) est recalculé, plus le placement des flèches ni la grille (vérifié avec des compteurs temporaires). Noms dans `Board` : `boardScene`, `solutionScene` (privé), `shownSolutionScene` ; fonctions `boardSceneOf`, `solutionSceneOf`, `solutionSceneUpTo`.
- 2026-11-27, géométrie, étape 0 : test instantané `src/app/board/board-scenes.spec.ts` (`pnpm test`). Pour les 20 questions du 14 novembre, il fige la scène de la grille (question et solution), la scène de la solution (complète et limitée à l'étape 1), `lastStep` et `solutionSteps`. Il doit rester vert, sans mettre à jour l'instantané, pendant toute la réécriture de la géométrie : l'algorithme de `renderCard` ne doit pas changer. Vérifié : changer une seule courbure (0,12 → 0,13) fait échouer 4 questions.
- 2026-11-27, géométrie, étape 1 : ce qui n'est pas de la géométrie est sorti. Les couleurs (`THEME`, `BRANCH_COLORS`, `branchColor`) sont dans `board/board-theme.ts`. La logique de la chaîne (`lastStep`, `branchesOf`, `solutionSteps`, `touchedCells`) est dans `board/solution-chain.ts`, réécrite pour être lisible (plus de ternaire imbriqué : `hiddenSingleUnitOf`, `isInUnit`, `boxOf`, `allCells`). `cellKey` est dans `board-model.ts`. Instantané inchangé.
- 2026-11-27, géométrie, étape 2 : les types des scènes sont séparés des calculs, dans `geometry/board-scene-model.ts` (grille) et `geometry/solution-scene-model.ts` (schéma de solution), avec un commentaire par type ; les calques importent leurs types de là. `Obstacle` et `Point` restent dans `solution-geometry.ts` jusqu'à l'étape 4. Instantané inchangé.
- 2026-11-27, géométrie, étape 3 : `geometry/grid-coordinates.ts` dit où se trouve chaque chose en unités SVG (`CELL_SIZE` ex-`CS`, `GRID_SIZE`, `VIEW_BOX`, `cellLeft` / `cellTop`, `cellCenter`, `candidateCenter` ex-`P` avec ses constantes nommées, `cellRect`, `cellsRect` ex-`cellsBounds`). Fichiers de calcul renommés d'après ce qu'ils produisent : `board-geometry.ts` → `board-scene.ts`, `solution-geometry.ts` → `solution-scene.ts`. `board-scene.ts` réécrit lisiblement (`startCellOf`, `redZoneOf`, plus de noms courts). Ajouts dans `board-model.ts` : `cellValueOf`, `candidateKey`. Instantané inchangé.
- 2026-11-27, géométrie, étape 4 : placement des flèches dans `geometry/arrows.ts`, découpé en petites fonctions (`placeArrow` ex-`routeArrow`, `leastObstructedControlPoint`, `bendOffset`, `bendScore`, `leastObstructedBadgePosition`, `addArrowToObstacles`, `obstructionAt` ex-`penalty`, `pointOnCurve` ex-`quad`, `curvePath`, `arrowHead`), types `Obstacle { x, y, radius, weight }`, `Curve`, `Arrow` (forme d’une flèche : courbe, pointe, position de la pastille), constantes nommées (rayons et poids des obstacles, `BEND_RATIOS`, `BADGE_POSITIONS`…). La liste des obstacles est construite par `obstaclesOf`. `Point` est dans `grid-coordinates.ts`. Mêmes opérations dans le même ordre : instantané inchangé.
- 2026-11-27, géométrie, étape 5 : `solutionSceneOf(board, frames, redZone)` est un sommaire qui appelle `circledCandidatesOf`, `struckCandidatesOf`, `strikeLinesOf`, `lastCandidatesOf` (avec `isLastCandidateOfRedZone`), `circlesOf` et `arrowsAndBadgesOf` ; types internes `CircledCandidate` / `StruckCandidate`, constantes `STRIKE_HALF_LENGTH` et `LAST_CANDIDATE_SQUARE_SIZE`, `itemsUpToStep` pour `solutionSceneUpTo`. Plus de paramètre `hypColor` (`THEME.hyp` importé) ni de `target` / `targetDigit` (`'all'` / `null` à deviner) : on passe la zone rouge, type `RedZoneHighlight` nommé dans `board-model.ts` ; `Board` et le test ne recalculent plus `lastDigit`. Instantané inchangé.
- 2026-11-27, géométrie, étape 6 : champs des scènes renommés : `off` → `greyed` (`CandidateText`, `StrikeLine`), `hyp` → `isHypothesis` et `cx` / `cy` → `x` / `y` (`SolutionCircle`), `touched` → `involvedCells` (`SolutionScene` ; `touchedCells` → `involvedCellsOf`). Clés de `THEME` : `thin` → `thinLine`, `thick` → `thickLine`, `cand` → `candidate`, `candOff` → `greyedCandidate`, `given` → `placedDigit` ; `hyp`, `hypBg`, `bad`, `badBg` gardés, comme les tokens Tailwind. L'instantané n'est pas régénéré : il reste celui d'avant la réécriture, et le test redonne leurs anciens noms aux champs renommés (`withOldKeys`) avant de comparer ; il passe, donc seuls les noms ont changé. Rendu vérifié dans le navigateur (couleurs, cercles, traits).
- 2026-11-27 : les types de la solution (`HypFrame`, `DomFrame`, `BadFrame`, `Frame`, `BoardSolution`) quittent `board-model.ts` pour `board/solution-model.ts`, à côté de `solution-chain.ts` qui les lit ; `board-model.ts` garde la grille et les marques de la question. Instantané inchangé.
- 2026-11-27 : dossier `board/solution/` pour tout ce qui concerne la solution : `solution-model.ts`, `solution-chain.ts`, `geometry/solution-scene.ts` (+ `-model`), `geometry/solution-arrows.ts` (ex-`geometry/arrows.ts`) ; le calque `board-solution-diagram/` reste à la racine avec les autres calques. `board/geometry/` garde la grille (`grid-coordinates.ts`, partagé, et `board-scene.ts`). Instantané inchangé, rendu vérifié dans le navigateur.
- 2026-11-27 : plus aucun type dans les fichiers de calcul : `CircledCandidate` / `StruckCandidate` dans `solution-scene-model.ts`, `Obstacle` / `Arrow` / `Curve` dans `solution/geometry/solution-arrows-model.ts`, `Point` et `Rect` dans `geometry/grid-coordinates-model.ts`, `Unit` dans `solution-model.ts`. Instantané inchangé.
- 2026-11-27 : tous les fichiers du board commencent par `board`, comme ceux de l'exercice : `solution/` → `board-solution/` (`board-solution-model.ts`, `board-solution-chain.ts`, `geometry/board-solution-scene.ts`, `geometry/board-solution-arrows.ts`, avec leurs `-model.ts`), le calque `board-solution-diagram/` y entre ; `geometry/grid-coordinates.ts` → `geometry/board-coordinates.ts` (et son `-model`). Noms dans le code inchangés. Instantané inchangé, rendu vérifié dans le navigateur.
- 2026-11-27 : `board-solution-chain.ts` → `board-solution.ts`, en paire avec `board-solution-model.ts` (comme `board-scene.ts` / `board-scene-model.ts`).
- 2026-11-27 : les fonctions de `board-model.ts` (`cellName`, `cellKey`, `candidateKey`, `cellValueOf`, `candidatesOf`) sont dans `board/board-cells.ts` ; plus aucune fonction dans un fichier `-model.ts`. Instantané inchangé.
- 2026-11-27 : `RedZoneHighlight` → `RedZone` (la zone rouge dans les données, `board-model.ts`) ; types de scène `RedZone` → `RedZoneShape` et `StartCell` → `StartCellShape` (les rectangles à dessiner). Instantané inchangé.
- 2026-11-27 : premiers tests ciblés (comportement attendu sur de petits exemples écrits à la main) : `geometry/board-coordinates.spec.ts` (taille de la grille, `viewBox`, cases, disposition 3 × 3 des candidats, rectangles d'une case et d'une unité) et `board-solution/board-solution.spec.ts` (`lastStep`, branches, numéros et couleurs des étapes, cases concernées dont les singletons cachés en ligne, colonne et bloc). Vérifié : casser la règle des colonnes fait échouer le test correspondant.
- 2026-11-27 : `geometry/board-scene.spec.ts` (lignes de la grille : nombre, épaisses tous les 3, fines d'abord ; chiffres posés ; candidats : position, absents d'une case remplie, grisés seulement hors des cases concernées, soulignés ; case de départ et zone rouge unité / case avec leurs retraits). Vérifié : changer le retrait du contour de la case de départ fait échouer le test correspondant.
- 2026-11-27 : `board-solution/geometry/board-solution-scene.spec.ts`, sur une petite chaîne à deux branches écrite à la main (cercles : vert pour l'hypothèse, couleur de la branche sinon ; candidats barrés une fois, à la première étape, jamais s'ils sont entourés, grisés hors des cases concernées ; derniers candidats d'une case ou d'une unité, à la dernière étape ; flèches et pastilles numérotées ; `solutionSceneUpTo` sans rien déplacer). Vérifié : rattacher un candidat barré deux fois à la dernière étape fait échouer le test correspondant.
- 2026-11-27 : `board-solution/geometry/board-solution-arrows.spec.ts` : obstacles (ordre, rayons, poids), `placeArrow` (pas de flèche d'un candidat vers lui-même ; départ à 17, arrêt à 27 ; courbure la plus faible sans obstacle ; autre côté si un obstacle gêne ; pastille au milieu d'une flèche longue, à 19 à côté d'une flèche courte ; flèche et pastille ajoutées aux obstacles) et chemins exacts des 2 flèches de la question 1. Vérifié : changer l'écart de départ (17 → 18) fait échouer 4 tests. Limite : changer la courbure 0,12 → 0,13 n'est vu que par le gros instantané (les flèches de la question 1 n'utilisent pas cette courbure).
- 2026-11-27 : le gros instantané (`board-scenes.spec.ts`, 75 000 lignes) est supprimé. Il est remplacé par les tests ciblés et, dans `board-solution-arrows.spec.ts`, un petit instantané des flèches et pastilles des 20 questions (≈ 1 900 lignes), pris avec le code vérifié contre l'ancien instantané : il garde la preuve que le placement des flèches reste celui de `renderCard`. Ne jamais le mettre à jour pour faire passer un test. Vérifié : changer la courbure 0,12 → 0,13 fait échouer les questions 6, 7, 9 et 13.
- 2026-11-27 : `board/board-cells.spec.ts` (`cellName` en RxCy, clés de case et de candidat, chiffre posé lu ligne par ligne, candidats d'une case). Vérifié : inverser ligne et colonne dans `cellValueOf` fait échouer le test correspondant.
- 2026-11-27, corrections de la relecture du board : le test des flèches lit le fichier de grille sans les types de l'exercice ; `involvedCellsOf(…, redZoneCells)` ; plus de `null` pour « rien de grisé » : `boardSceneOf` / `candidateTexts` reçoivent toujours les cases concernées, toutes (`allCellKeys()`) quand aucune solution n'est affichée ; les décalages de texte sortent des templates (`CandidateText.textY` et `underline`, `StepBadge.textY`, constantes nommées) : instantané des flèches réécrit, prouvé identique à part l'ajout de `textY` (= `y + 6`) ; la règle ESLint n'accepte les sélecteurs d'attribut que dans `src/app/board/` ; données de test communes dans `board/board-test-data.ts`.
- Revue du board : géométrie réécrite et testée. À faire ensuite : les modèles (noms de champs du JSON en franglais, côté export Python).
- À faire, ensuite : les modèles.

### Prochaines étapes (ordre proposé, à confirmer avec l'utilisateur)

1. **`index.json` + `scripts/build-index.mjs`** (scripts `prestart` / `prebuild`), puis accueil complet : tirage d'une grille au hasard, enchaînement des grilles, liste des grilles sous l'exercice.
2. **Page Grids** (`/grid/:nom`) et **menu** Home · Grids · Patterns.
3. **Page Patterns** (`/patterns`) : contenu de l'artefact « Motifs de sudoku », à fournir.

### Points ouverts

- `docs/sudoku-training-modele.html` : gardé pour l'instant ; à supprimer plus tard (tout ce qui servait est porté), en mettant à jour la SPEC et `CLAUDE.md`.
- Schéma de solution vérifié à l'œil seulement (pas de comparaison automatique avec le rendu de référence).
- `autresReponses` : géré dans le code mais jamais testé (la grille du 14 novembre n'en a aucune).
- Aucun audit AXE lancé pour l'instant, ni test avec un vrai lecteur d'écran (VoiceOver, NVDA), notamment l'annonce du verdict (zone `aria-live`) ; tests unitaires : seulement le board (géométrie et lecture de la solution, voir la revue du code).
- Contraste : texte blanc sur les couleurs des 3e et 4e branches (orange `#e07800`, turquoise `#0f9aa0`) sous le seuil WCAG AA (ronds numérotés et pastilles de la grille) ; à décider (assombrir ces couleurs ou non).
- À tester sur un vrai téléphone (lisibilité du texte et de la grille), et dans Safari et Firefox : les fonds de la zone rouge et de la case de départ, et les carrés rouges des derniers candidats, comptent sur `mix-blend-mode: multiply` pour laisser voir les lignes et les chiffres (vérifié seulement dans Chromium).
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

1. **Fonctions TypeScript pures** (`board/geometry/grid-coordinates.ts`, `board-scene.ts` et `solution-scene.ts`, sans DOM) qui reprennent les calculs de `renderCard` et renvoient des données : positions des cases et des candidats (`candidateCenter`, `P(r,c,d)` dans `renderCard`), cases « concernées » (les autres en gris), candidats barrés, cercles avec leur couleur de branche, **flèches** (chemin courbe `d`, pointe, pastille numérotée — l'algorithme d'évitement des obstacles est à reprendre tel quel, c'est du calcul pur).
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
