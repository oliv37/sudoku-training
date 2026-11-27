# Sudoku Training

Web app for anyone who wants to train and improve at sudoku. It offers exercises taken from real grids: at key moments of a solve, the user looks for the right deduction, then the app shows the reasoning behind it.

Today's exercise type: find which candidate of the green start cell must be eliminated to empty the red zone. The exercises come as JSON files, one per grid (format in `docs/SPEC.md`); the tool that produces them is outside this project.

- Specification: `docs/SPEC.md` (in French). Read it before working on a feature; it says what is in scope now and what is deliberately postponed ("Plus tard").
- Progress: the "État d'avancement" section at the top of `docs/SPEC.md` lists what is done, the next steps and the open points. Read it at the start of a session, and update it at the end of each feature (with the date).
- Visual/computation reference: `docs/sudoku-training-modele.html` (`renderCard`). It is a reference to port, not code to call.

## Working agreement

- Do not make design, product or code-structure choices on your own (naming, where state lives, how to split a component…): when something is ambiguous, several options are reasonable, or you are unsure what the user prefers, ask first.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`…), subject line only. Commit only when the user explicitly asks, for that change: the user reviews all the code first. A plan that mentions commits, or a "go" on that plan, is not a commit request.
- Linting: run `pnpm lint` before each commit, or when the user asks; not after every edit. Fix what it reports (ask first if a fix changes behavior or a rule seems wrong).
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
- Functions are named as actions or relations (`highlightsOf`, `toCandidateButton`), values as nouns (`questionHighlights`). Never use a leading `_` just to avoid a name clash (`_` means private or unused).
- No special value whose meaning must be guessed (e.g. `null` meaning "everything"): group the value with what it depends on (`BoardSolution` = frames + `shownStep`).

## Commands

- `pnpm start` — dev server
- `pnpm build` — production build with prerendering (static output in `dist/sudoku-training/browser`)
- `pnpm test` — unit tests (Vitest)
- `pnpm lint` — ESLint (angular-eslint, typed rules, template accessibility; config in `eslint.config.js`)

## Architecture

- Static site generation: `outputMode: "static"`, every route is prerendered (`app.routes.server.ts`). No Node server in production; `main.server.ts` / `app.config.server.ts` are only used at build time.
- Organized by pages and domains, no type-based folders, no `shared/` unless really needed. File names in kebab-case, without a dotted type suffix: `home.ts`, `board.ts` (no `.component`), `board-model.ts`, `exercise-store.ts`. Only the Angular CLI files keep their usual names (`app.config.ts`, `app.routes.ts`, `main.server.ts`…).
  - `src/app/pages/<page>/` — components loaded by a route. Every route is lazy-loaded with `loadComponent` (the prerendered HTML preloads the chunk of the current page).
  - `src/app/exercise/` — exercise domain. An exercise is the sequence of questions of one grid (`ExerciseData`, one `ExerciseQuestionData` per question, in `exercise-model.ts`). `Exercise` component: input `exercise`; it lays out the screen (CSS grid), connects its children to the store through inputs/outputs (all visible in `exercise.html`), and moves the focus between them (after an answer, after Reset).
    - `store/` — `ExerciseStore` (`store/exercise-store.ts`) holds all the exercise state, split into `signalStoreFeature`s, one file each in the same folder: `withNavigation()` (`with-navigation.ts`: exercise, current question, previous / next), `withAnswer()` (`with-answer.ts`: chosen candidate, found, candidate states, result, solution to draw; the answer resets on every new question), `withSolutionSteps()` (`with-solution-steps.ts`: which step of the solution is drawn, the step-by-step animation, the step buttons and the user's choice).
    - Child components are presentational: inputs/outputs only, none of them injects `ExerciseStore` (see "Components" below). Each in its own subfolder: `exercise-nav/` (‹ › buttons, "name · k / N" line, ← → keys), `exercise-board/` (the `Board` with the question marks and the solution; the parent places the host in the grid), `exercise-question/` (the statement only: start cell, red zone, chain length; once answered `exercise.html` hides it visually with `sr-only`, but keeps it because it names the candidates group), `exercise-candidates/` (one button per candidate, role group labelled by the question), then, once answered: `exercise-verdict/` (Found! / Lost and the explanation, inside an `aria-live` region declared in `exercise.html` that exists before the verdict appears), `exercise-solution-steps/` (numbered step buttons), `exercise-missed-clue/` (what should have caught the eye, after a wrong answer), `exercise-next-actions/` (Reset / Next question). Every condition that shows or hides a part is written in `exercise.html`, so the template tells what is displayed when.
    - Naming: every file, class and selector of the exercise domain starts with `exercise` (`exercise-nav/exercise-nav.ts`, `ExerciseNav`, `app-exercise-nav`), so a search for "exercise" lists the whole domain. A component subfolder has the same name as its files. Exception: the store files go in `store/`, and its feature files are named after their function (`with-answer.ts`). Vocabulary: a "question" is one item of the exercise (board, statement, answer, solution); "step" is reserved for the steps of a solution chain.
  - Pages only load data: `Home` loads an exercise (one grid file) and renders `<app-exercise [exercise]>`.
  - `src/app/board/` — reusable SVG sudoku board, knows nothing about exercises: `Board` component (`board` input, optional `highlights` input: the question marks, start cell and red zone, fixed for a question; optional `solution` input: solution frames with the step drawn, kept apart so the steps of the animation only recompute the cheap step filter, not the arrows), `BoardData`/`Frame` models, pure geometry in `geometry/board-geometry.ts` (grid) and `geometry/solution-geometry.ts` (circles, strikes, arrows — port of `renderCard`, keep the algorithm as is).
    - `Board` has no store: it holds no state (inputs in, scene out through `computed`); the state that changes (step drawn, animation) lives in `ExerciseStore`.
    - `board.html` lists the SVG layers in drawing order (in SVG, later elements are painted on top), one presentational child component per layer, each in its own subfolder named `board-…`: `BoardGridLines`, `BoardRedZone` and `BoardStartCell` (background then outline of each question mark), `BoardValues`, `BoardCandidates`, `BoardSolutionDiagram` (everything that depends on the step drawn: red squares around the last candidates of the red zone, strikes, circles, arrows, badges; the squares use `mix-blend-multiply` so the digit under them stays readable). SVG has no `z-index`. A colored background drawn over something that must stay visible (grid lines, a digit) uses `mix-blend-multiply`: its colors are multiplied with what lies under it, so dark lines and digits stay dark; this keeps each shape in one component instead of splitting it across layers.
    - A custom element is not drawn inside an `<svg>`, so a layer is an attribute selector on a `<g>` (`g[appBoardGridLines]`; ESLint allows attribute selectors for components). Its template has no `<svg>` ancestor: prefix its top-level elements with `svg:` (`<svg:line>`), otherwise Angular creates HTML elements that are silently not drawn. Layers import `THEME` directly.
- Vocabulary: "grid" means a magazine puzzle (a JSON file with its questions, route `/grid/:nom`); "board" means the 9×9 drawing.
- Board rendering is declarative: pure functions compute the scene, the template renders it with `@for` / `@if`. No `ElementRef`, no imperative DOM creation.

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

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Lazy-load every route, including the home page (`loadComponent`)
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
- Never put ARIA attributes or roles on an element with `display: contents` (some browsers drop it from the accessibility tree).
- Ids used by `aria-labelledby` (or other ARIA references) are generated once in the component (`exercise-question-0`), not written as strings in two places.

## Components

- Keep components small and focused on a single responsibility
- A parent template reads like the outline of the screen: one small, well-named child component per visible block, so the parent shows at a glance what is displayed, and you open a child only for the detail (e.g. `exercise.html`). Avoid big template blocks inside one component.
  - Every condition that shows or hides a block (`@if`, visual hiding with `sr-only`, an `aria-live` region that must exist beforehand) is written in the parent template, with a short comment when the reason is not obvious (accessibility…). A child must not hide itself or render nothing depending on an input: reading the parent would suggest it is always displayed.
  - Child components are presentational by default: inputs/outputs only; the parent connects them to its store. Injecting the parent's store in a child is acceptable only when passing values through several levels would become heavy; ask the user first.
  - The name says what the block is in its context (`ExerciseMissedClue`, not `ExerciseHint`, which suggests help before answering). Propose the split and the names to the user before coding.
  - When a feature adds a new visible block to a component, create a child component for it instead of growing the template. A template with several distinct blocks, or over ~30 lines, is the signal to propose a split.
  - Data a template needs for a list (classes, labels, disabled…) is built in a `computed` that maps each item (e.g. `toCandidateButton`), not by methods called from the template.
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components (up to ~30 lines); beyond that, use a separate `.html` file next to the component
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- As soon as a component has state to manage (values that change over time and the rules to change them), move that state out of the component into an NgRx Signal Store (`@ngrx/signals`), provided locally by the component (`providers: [XxxStore]`, one store per component instance) unless it must be shared. The component keeps only UI concerns (template bindings, DOM events, focus) and calls the store.
- Store file next to the component: `<name>-store.ts` (kebab-case, as in the NgRx docs: `books-store.ts`); once the store is split into features (`signalStoreFeature`, one file each, named after its function as in the NgRx docs: `withAnswer()` in `with-answer.ts`), the store and its features go in a `store/` subfolder next to the component. The store file exports `XxxStore = signalStore(withState(...), withComputed(...), withMethods(...))`. Change state only with `patchState` inside store methods; keep methods short and explicit like any other code.
- Put all the state of the component in the store, including data that arrives through an input, so there is one place to look. Feed inputs with a `signalMethod` of the store, called with the input signal in the component constructor (e.g. `this.store.setExercise(this.exercise)`).
- Such input-fed state starts as `null` (the store is created before Angular sets the inputs). Handle the null inside the store's computed values, and in the template narrow it once with a single `@if (store.x(); as x)` at the top, rather than scattering checks.
- When a store holds several concerns (e.g. navigation, answer, animation), split it into one `signalStoreFeature` per concern. Members starting with `_` are private to the store (NgRx convention); say so in a comment where they are defined.
- `patchState` with an updater `(state) => ({ … })` when the new value depends on the previous one; a plain object otherwise.
- Plain signals in a component only for purely visual details that are not state to manage (e.g. a hover flag); everything else goes to the store.
- Keep state transformations pure and predictable
- Use `set` or `update` to change a signal

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Prefer `httpResource` and signals for async data; if an Observable is unavoidable, convert it with `toSignal()`

## Prerendering (SSG)

- Every page is rendered at build time, without a browser: `window`, `document` and `localStorage` do not exist there, and `new Date()` would return the build date, not the visitor's.
- Access browser APIs only in `afterNextRender()` or behind an `isPlatformBrowser()` check, and render something sensible without them.

## Styling

- Style with Tailwind utility classes in templates; no per-component CSS files.
- Use the theme tokens from `src/styles.css` (colors, fonts) instead of hard-coded values in templates. The SVG board keeps its colors in `THEME` (`board/geometry/board-geometry.ts`).

## Services

- Design services around a single responsibility
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
