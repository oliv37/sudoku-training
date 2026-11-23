# Sudoku Training

Web app for anyone who wants to train and improve at sudoku. It offers exercises taken from real grids: at key moments of a solve, the user looks for the right deduction, then the app shows the reasoning behind it.

Today's exercise type: find which candidate of the green start cell must be eliminated to empty the red zone. The exercises come as JSON files, one per grid (format in `docs/SPEC.md`); the tool that produces them is outside this project.

- Specification: `docs/SPEC.md` (in French). Read it before working on a feature; it says what is in scope now and what is deliberately postponed ("Plus tard").
- Progress: the "État d'avancement" section at the top of `docs/SPEC.md` lists what is done, the next steps and the open points. Read it at the start of a session, and update it at the end of each feature (with the date).
- Visual/computation reference: `docs/sudoku-training-modele.html` (`renderCard`). It is a reference to port, not code to call.

## Working agreement

- Do not make design or product choices on your own: when something is ambiguous or several options are reasonable, ask first.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`…), subject line only. Commit only when asked.
- Linting: run `pnpm lint` before each commit, or when the user asks; not after every edit. Fix what it reports (ask first if a fix changes behavior or a rule seems wrong).
- Formatting: run Prettier (`pnpm exec prettier --write <files>`) on every file you create or edit, before finishing. The user's editor formats on save with the project's `.prettierrc`, so unformatted files show up as unexpected changes. `.prettierignore` excludes the exercise data and the reference HTML.

## Commands

- `pnpm start` — dev server
- `pnpm build` — production build with prerendering (static output in `dist/sudoku-training/browser`)
- `pnpm test` — unit tests (Vitest)
- `pnpm lint` — ESLint (angular-eslint, typed rules, template accessibility; config in `eslint.config.js`)

## Architecture

- Static site generation: `outputMode: "static"`, every route is prerendered (`app.routes.server.ts`). No Node server in production; `main.server.ts` / `app.config.server.ts` are only used at build time.
- Organized by pages and domains, no type-based folders, no `shared/` unless really needed. File names without `.component` suffix (`home.ts`, `board.ts`).
  - `src/app/pages/<page>/` — components loaded by a route. Every route is lazy-loaded with `loadComponent` (the prerendered HTML preloads the chunk of the current page).
  - `src/app/exercise/` — exercise domain. An exercise is the sequence of moves of one grid (`ExerciseData`). `Exercise` component: input `grid`, owns the current move, the move navigation (‹ ›) and the ← → keys, and lays out the screen (CSS grid).
    - `src/app/exercise/move/` — one move: `Move` component (question, answer state, solution animation, result, `next` output; host `display: contents`, so its board and panel sit in the `Exercise` grid), `MoveData` model, `moveHighlights()` (maps a move to board highlights). Keep sub-parts of a domain in their own subfolder rather than letting the domain folder grow flat.
  - Pages only load data: `Home` loads a grid file and renders `<app-exercise [grid]>`.
  - `src/app/board/` — reusable SVG sudoku board, knows nothing about exercises: `Board` component (`board` + optional `highlights` inputs: start cell, red zone, solution frames), `BoardData`/`Frame` models, pure geometry in `geometry/board-geometry.ts` (grid) and `geometry/solution-geometry.ts` (circles, strikes, arrows — port of `renderCard`, keep the algorithm as is).
- Vocabulary: "grid" means a magazine puzzle (a JSON file with its moves, route `/grid/:nom`); "board" means the 9×9 drawing.
- Board rendering is declarative: pure functions compute the scene, the template renders it with `@for` / `@if`. No `ElementRef`, no imperative DOM creation.

## Data

- One file per grid: `public/data/exercices-YYYY-MM-DD.json`, served at `/data/…` and loaded on demand with `httpResource` (never load them all at once).
- Internal coordinates are 0..8 `[row, col]`; displayed as `RxCy` (1..9).
- The JSON field names are a French/English mix (`depart`, `arrivee`, `exos`, `under`…); keep them as they are for now.

## UI

- Interface texts in English.
- Light theme only, white background. Theme colors and fonts are Tailwind tokens in `src/styles.css` (`navy`, `hyp` green, `bad` red, `chain` blue; Barlow / Barlow Condensed / IBM Plex Mono from Google Fonts).
- Header height is the CSS variable `--header-height`. The home exercise fits in `100dvh - header` with a minimum height (page scrolls below it); this constraint is local to the home page, not site-wide.
- Responsive: stacked on phones and portrait tablets (move navigation, board, question); side by side on `md:landscape:` (board filling the height on the left; on the right, everything aligned to the top: move navigation, then the question panel), via a CSS grid on the `Exercise` host.
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

## Components

- Keep components small and focused on a single responsibility
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

- Use signals for local component state
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
