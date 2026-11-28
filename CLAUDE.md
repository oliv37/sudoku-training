# Sudoku Training

Web app for anyone who wants to train and improve at sudoku. It offers exercises taken from real grids: at key moments of a solve, the user looks for the right deduction, then the app shows the reasoning behind it.

Today's exercise type: find which candidate of the green start cell must be eliminated to empty the red zone. The exercises come as JSON files, one per grid (format in `docs/SPEC.md`); the tool that produces them is outside this project.

- Specification: `docs/SPEC.md` (in French). Read it before working on a feature; it says what is in scope now and what is deliberately postponed ("Plus tard").
- Progress: the "État d'avancement" section at the top of `docs/SPEC.md` lists what is done, the next steps and the open points. Read it at the start of a session, and update it at the end of each feature. Keep it short: the current state only, no dated log of changes (that is the git history).
- Visual/computation reference: `docs/sudoku-training-modele.html` (`renderCard`). It is a reference to port, not code to call.

## Working agreement

- Do not make design, product or code-structure choices on your own (naming, where state lives, how to split a component…): when something is ambiguous, several options are reasonable, or you are unsure what the user prefers, ask first.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`…), subject line only. Commit only when the user explicitly asks, for that change: the user reviews all the code first. A plan that mentions commits, or a "go" on that plan, is not a commit request.
- Linting and tests: run `pnpm lint` and `pnpm test` before each commit, or when the user asks; not after every edit. Fix what they report (ask first if a fix changes behavior or a rule seems wrong).
- Formatting: run Prettier (`pnpm exec prettier --write <files>`) on every file you create or edit, before finishing. The user's editor formats on save with the project's `.prettierrc`, so unformatted files show up as unexpected changes. `.prettierignore` excludes the exercise data and the reference HTML.

## Code readability (priority)

The code must be easy to understand for a human reading it. Prefer more lines of explicit code over compact or clever code.

- Short functions and methods, each doing one thing, with a name that says what it does or returns.
- Explicit names for variables and parameters (`answer`, `digit`, `question`), no one-letter names, except where the meaning is obvious and conventional: `r` / `c` for row / column on the 9×9 grid, `(m) => m.Home` in a lazy route import.
- No nested ternaries. Use `if` / `else`, early returns, a `switch`, or a small named function. A single, simple ternary is fine.
- Functions returning a boolean: when the cases have different reasons (each deserving its own comment), a series of `if (condition) { return true; }` ending with `return false;`. When the conditions read naturally as one sentence (e.g. `target instanceof Element && target.closest(…) !== null`), a single `return` with `&&` is clearer.
- Break long expressions and conditions into named intermediate variables or helper functions (e.g. `isExpectedAnswer(digit)` rather than a raw comparison inside a bigger condition).
- Avoid dense one-liners (`flatMap` + ternary + spread in one expression…) when a short loop or two steps read better.
- Comments explain _why_ (intent, constraints, non-obvious choices), not what the code already says.
- Functions are named as actions or relations (`boardDrawingOf`, `toCandidateButton`), values as nouns (`greyedCells`). Never use a leading `_` just to avoid a name clash (`_` means private or unused).
- No special value whose meaning must be guessed (e.g. `null` meaning "everything"): group the value with what it depends on (`ShownSolution` = frames + `shownStep`).

## Commands

- `pnpm start` — dev server
- `pnpm build` — production build with prerendering (static output in `dist/sudoku-training/browser`)
- `pnpm test` — unit tests (Vitest)
- `pnpm lint` — ESLint (angular-eslint, typed rules, template accessibility; config in `eslint.config.js`)

## Architecture

- Static site generation: `outputMode: "static"`, every route is prerendered (`app.routes.server.ts`). No Node server in production; `main.server.ts` / `app.config.server.ts` are only used at build time.
- Organized by domain, then by subject, then by nature; no type-based folders, no `shared/` unless really needed. File names in kebab-case, without a dotted type suffix (`board.ts`, `board-model.ts`, `exercise-store.ts`); only the Angular CLI files keep their usual names (`app.config.ts`, `main.server.ts`…).
- Naming: every file, folder, class and selector of a domain starts with its name (`exercise…`, `board…`), so a search for it lists the whole domain. A component subfolder has the same name as its files; a sub-subject folder (`exercise-solution/`) prefixes its files with its own name. Names inside the code (`candidateShapes`…) are not prefixed. Exception: the store files go in `store/`, its features named after their function (`with-answer.ts`).
- Types: a `-model.ts` file holds only types, no functions. Every type, internal ones included, goes in the `-model.ts` next to the file that uses it (`x.ts` → `x-model.ts`), never in a computation file.
- `src/app/pages/<page>/` — components loaded by a route, each lazy-loaded with `loadComponent`. Pages only load data: `Home` loads one grid file and renders `<app-exercise [exercise]>`.
- `src/app/exercise/` — an exercise is the sequence of questions of one grid. `Exercise` lays out the screen (CSS grid on its host), connects its presentational children to `ExerciseStore` (`store/`, one `signalStoreFeature` per concern) and moves the focus; `exercise.html` holds every condition that shows or hides a part. Vocabulary: a "question" is one item of the exercise; "step" is reserved for the steps of a solution chain. Its board: `exercise-board/exercise-board-drawing.ts` turns a question and its shown solution into a `BoardDrawing` (elements of the steps not shown yet are `hidden`); reading the solution (frames, branches, involved cells) is in `exercise-solution/`.
- `src/app/board/` — generic SVG board: knows nothing about exercises, solutions or steps (its tests neither). Inputs: `drawing` (`BoardDrawing`, in sudoku terms: digits, candidates and their marks — underlined, greyed, struck, circled, framed —, zones, arrows) and `label`. An element with `hidden` keeps its place (still an obstacle for the arrows) but is not drawn. A new kind of mark, zone or color is a new property or tone of `BoardDrawing`, not a new input. `Board` has no store: it holds no state.
  - Geometry: pure functions (`geometry/`, `board-arrows/geometry/`) compute the scene, the templates render it with `@for` / `@if`; no `ElementRef`, no imperative DOM. It is a port of `renderCard`: keep the algorithm as is (same constants, same operations in the same order). The arrows snapshot (`exercise-board-arrows.spec.ts`, from a question to the board scene) proves it: never regenerate it to make a test pass.
  - Rendering snapshots: `board.spec.ts` fixes the SVG rendered for a drawing using every kind of element (DOM order, so the painting order too); `exercise-board-drawing.spec.ts` fixes the drawing of real questions. Update them only for an intended visual change, after reading the diff; a change in a refactor is a regression.
  - SVG layers: `board.html` lists them in drawing order (later elements are painted on top), one presentational component per layer. SVG has no `z-index`: a background drawn over lines or digits uses `mix-blend-multiply`, so one shape stays in one component. A custom element is not drawn inside an `<svg>`, so a layer is an attribute selector on a `<g>` (`g[appBoardGridLines]`, allowed by ESLint in `src/app/board/` only), and its template prefixes its top-level elements with `svg:` (otherwise Angular creates HTML elements, silently not drawn).
- Test data shared between spec files goes in `<domain>/testing/<domain>-fixtures.ts`, excluded from the app build (`tsconfig.app.json`).
- Vocabulary: "grid" means a magazine puzzle (a JSON file with its questions, route `/grid/:nom`); "board" means the 9×9 drawing.

## Data

- One file per grid: `public/data/exercices-YYYY-MM-DD.json`, served at `/data/…` and loaded on demand with `httpResource` (never load them all at once).
- Internal coordinates are 0..8 `[row, col]`; displayed as `RxCy` (1..9).
- The JSON field names are a French/English mix (`depart`, `arrivee`, `exos`, `under`…); keep them as they are for now.

## UI

- Interface texts in English.
- Light theme only, white background. Theme colors and fonts are Tailwind tokens in `src/styles.css` (`navy`, `hyp` green, `bad` red, `chain` blue; Barlow / Barlow Condensed / IBM Plex Mono from Google Fonts).
- Header height is the CSS variable `--header-height`. The home exercise fits in `100dvh - header` with a minimum height (page scrolls below it); this constraint is local to the home page, not site-wide.
- Responsive: stacked on phones and portrait tablets (question navigation, board, question); side by side on `md:landscape:` (board filling the height on the left; on the right, everything aligned to the top: question navigation, then the question, candidates and result), via a CSS grid on the `Exercise` host.
- Colored text must keep WCAG AA contrast: use colored backgrounds/borders (badges) rather than green/red text.

# Angular guidelines

Project choices on top of current Angular practice (Angular 22, signals, standalone components, native control flow, `inject()`, strict TypeScript without `any`).

## Angular

- Do NOT set `standalone: true` nor `changeDetection: ChangeDetectionStrategy.OnPush`: both are the default.
- Lazy-load every route, including the home page (`loadComponent`).
- Host bindings in the `host` object of the decorator, not `@HostBinding` / `@HostListener`.
- `input()`, `output()`, `model()` (for `[(prop)]`), `computed()`; no decorators for inputs/outputs.
- `class` / `style` bindings, not `ngClass` / `ngStyle`; never import `CommonModule`.
- `NgOptimizedImage` for static images (not for inline base64).
- Services: each designed around a single responsibility; new singleton services use `@Service`, not `@Injectable({ providedIn: 'root' })`.
- Async data with `httpResource` and signals; an unavoidable Observable goes through `toSignal()`.

## Accessibility

- It MUST pass all AXE checks and follow all WCAG AA minimums (focus management, color contrast, ARIA).
- Never put ARIA attributes or roles on an element with `display: contents` (some browsers drop it from the accessibility tree).
- Ids used by `aria-labelledby` (or other ARIA references) are generated once in the component (`exercise-question-0`), not written as strings in two places.

## Components

- Keep components small, each focused on a single responsibility.
- A parent template reads like the outline of the screen: one small, well-named child component per visible block (e.g. `exercise.html`). A template with several distinct blocks, or over ~30 lines, is the signal to propose a split; a new visible block gets its own child component. Propose the split and the names to the user before coding.
  - Every condition that shows or hides a block (`@if`, `sr-only`, an `aria-live` region that must exist beforehand) is written in the parent template, with a short comment when the reason is not obvious. A child must not hide itself or render nothing depending on an input.
  - Children are presentational: inputs/outputs only; the parent connects them to its store. Injecting the parent's store in a child is acceptable only when passing values through several levels would become heavy; ask first.
  - The name says what the block is in its context (`ExerciseMissedClue`, not `ExerciseHint`, which suggests help before answering).
  - Data a template needs for a list (classes, labels, disabled…) is built in a `computed` that maps each item (e.g. `toCandidateButton`), not by methods called from the template.
- Keep templates simple and avoid complex logic: what a template needs is computed beforehand (store, `computed`, pure functions).
- Inline templates up to ~30 lines; beyond that, a `.html` file next to the component (paths relative to the TS file).

## State Management

- As soon as a component has state to manage (values that change over time and the rules to change them), move it into an NgRx Signal Store (`@ngrx/signals`) provided by the component (`providers: [XxxStore]`, one per instance) unless it must be shared. The component keeps only UI concerns (bindings, DOM events, focus).
- Store file next to the component: `<name>-store.ts`, exporting `XxxStore = signalStore(withState(...), withComputed(...), withMethods(...))`. Several concerns: one `signalStoreFeature` per concern, one file each named after its function (`withAnswer()` in `with-answer.ts`), all in a `store/` subfolder.
- All the state lives in the store, including input data: a `signalMethod` of the store is called with the input signal in the component constructor (`this.store.setExercise(this.exercise)`). Such state starts as `null`: handle it in the store's computed values, and narrow it once in the template with `@if (store.x(); as x)`.
- Change state only with `patchState` in short store methods; an updater `(state) => ({ … })` when the new value depends on the previous one. Members starting with `_` are private to the store (say so in a comment).
- Keep state transformations pure and predictable.
- Plain signals in a component only for purely visual details (e.g. a hover flag).

## Prerendering (SSG)

- Every page is rendered at build time, without a browser: `window`, `document` and `localStorage` do not exist there, and `new Date()` would return the build date.
- Access browser APIs only in `afterNextRender()` or behind `isPlatformBrowser()`, and render something sensible without them.

## Styling

- Tailwind utility classes in templates; no per-component CSS files.
- Theme tokens from `src/styles.css` (colors, fonts) instead of hard-coded values; the SVG board keeps its colors in `THEME` and the named tones `TONE_COLORS` / `TONE_BACKGROUNDS` (`board/board-theme.ts`).
