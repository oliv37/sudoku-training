# Sudoku Training

Web app to train and improve at sudoku.

It offers exercises taken from real sudoku grids: at key moments of a solve, you look for the right
deduction, then the app shows the reasoning behind it, so that you learn to spot these patterns
on your own.

What is planned, what is done and what comes next: see [docs/SPEC.md](docs/SPEC.md).

## Tech stack

- [Angular](https://angular.dev) 22 (standalone components, signals, zoneless, `httpResource`)
- [Tailwind CSS](https://tailwindcss.com) 4
- Static site generation with `@angular/ssr` (`outputMode: "static"`)
- [Vitest](https://vitest.dev) for unit tests
- [pnpm](https://pnpm.io) as package manager

## Getting started

Requirements: Node.js `^22.22.3`, `^24.15.0` or `>=26`, and pnpm 12.

```bash
pnpm install
```

```bash
pnpm start
```

Then open <http://localhost:4200/>.

| Command      | Description                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| `pnpm start` | Development server with live reload                                           |
| `pnpm build` | Production build; prerendered static files in `dist/sudoku-training/browser/` |
| `pnpm lint`  | Lint TypeScript and templates (ESLint, angular-eslint)                        |
| `pnpm test`  | Unit tests (Vitest)                                                           |
| `pnpm watch` | Development build in watch mode                                               |

## Project structure

```
src/
  index.html, styles.css        global page, theme tokens (colors, fonts)
  app/
    app.ts, app.routes.ts       shell (header) and routes (all lazy-loaded)
    pages/                      components loaded by a route
    exercise/                   exercise screen and its data model
    board/                      reusable SVG sudoku board (knows nothing about exercises)
      geometry/                 pure functions computing what to draw
public/
  data/                         exercise files, one per grid (format in docs/SPEC.md)
docs/
  SPEC.md                       specification and progress (in French)
  sudoku-training-modele.html   reference renderer the board was ported from
```

Project conventions (architecture, accessibility, styling, prerendering pitfalls) are in [CLAUDE.md](CLAUDE.md).

## Deployment

`pnpm build` produces a fully static site in `dist/sudoku-training/browser/`:
upload that folder to any static host (GitHub Pages, Netlify, Cloudflare Pages, an S3 bucket…).

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org)
(`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`…).
