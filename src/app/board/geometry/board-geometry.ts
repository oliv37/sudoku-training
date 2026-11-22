/**
 * Pure geometry of the sudoku grid (no DOM).
 * Same computations as `renderCard` in sudoku-training-modele.html, with the grid
 * origin moved to (0, 0): GX = GY = 0, CS = 96 (so the arrow tuning constants stay identical).
 * The solution diagram is in solution-geometry.ts.
 */
import { BoardData, Cell, Highlights, candidatesOf } from '../board.model';

/** Cell size, in SVG user units. */
export const CS = 96;
export const GRID_SIZE = 9 * CS;
/** Margin around the grid so the thick outer lines (7 units) are not clipped. */
const MARGIN = 4;
export const VIEW_BOX = `${-MARGIN} ${-MARGIN} ${GRID_SIZE + 2 * MARGIN} ${GRID_SIZE + 2 * MARGIN}`;

/** "Ciel" theme of the reference renderer (THEMES.sky), grid-related colors only. */
export const THEME = {
  thin: '#2b2d30',
  thick: '#123a66',
  cand: '#1d3557',
  candOff: '#a3b4c8',
  given: '#0f2a4a',
  hyp: '#15924f',
  hypBg: '#d2f2df',
  bad: '#e0342a',
  badBg: '#fbd8d3',
  underline: '#111111',
} as const;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thick: boolean;
}

export interface ValueText {
  key: string;
  x: number;
  y: number;
  value: number;
}

export interface CandidateText {
  key: string;
  x: number;
  y: number;
  digit: number;
  /** Greyed out (cell not involved in the solution). Always false in the question. */
  off: boolean;
  underlined: boolean;
}

export interface RedZone {
  kind: 'unit' | 'cell';
  /** Hatched fill. */
  fill: Rect;
  /** Outline: dashed for a unit, plain for a cell. */
  outline: Rect;
}

export interface BoardScene {
  lines: GridLine[];
  values: ValueText[];
  candidates: CandidateText[];
  start: { fill: Rect; outline: Rect } | null;
  redZone: RedZone | null;
}

const cellX = (c: number) => c * CS;
const cellY = (r: number) => r * CS;

/** Centre of candidate `d` in cell (r, c) — `P(r,c,d)` of the reference renderer. */
export function P(r: number, c: number, d: number): [number, number] {
  return [cellX(c) + 20 + ((d - 1) % 3) * 28, cellY(r) + 21 + Math.floor((d - 1) / 3) * 27];
}

export function gridLines(): GridLine[] {
  const lines: GridLine[] = [];
  for (let i = 0; i <= 9; i++) {
    const thick = i % 3 === 0;
    lines.push({ x1: 0, y1: i * CS, x2: GRID_SIZE, y2: i * CS, thick });
    lines.push({ x1: i * CS, y1: 0, x2: i * CS, y2: GRID_SIZE, thick });
  }
  // Thin lines first so the thick block lines are drawn on top.
  return [...lines.filter((l) => !l.thick), ...lines.filter((l) => l.thick)];
}

export function cellRect([r, c]: Cell, inset = 0): Rect {
  return {
    x: cellX(c) + inset,
    y: cellY(r) + inset,
    width: CS - 2 * inset,
    height: CS - 2 * inset,
  };
}

/** Bounding rectangle of a set of cells (a row, column or box). */
export function cellsBounds(cells: Cell[], inset = 0): Rect {
  const rs = cells.map((p) => p[0]);
  const cs = cells.map((p) => p[1]);
  const r0 = Math.min(...rs);
  const r1 = Math.max(...rs);
  const c0 = Math.min(...cs);
  const c1 = Math.max(...cs);
  return {
    x: cellX(c0) + inset,
    y: cellY(r0) + inset,
    width: (c1 - c0 + 1) * CS - 2 * inset,
    height: (r1 - r0 + 1) * CS - 2 * inset,
  };
}

export function redZone({ type, cases }: NonNullable<Highlights['redZone']>): RedZone {
  if (type === 'unit') {
    return { kind: 'unit', fill: cellsBounds(cases), outline: cellsBounds(cases, 3) };
  }
  return { kind: 'cell', fill: cellRect(cases[0]), outline: cellRect(cases[0], 4) };
}

export function valueTexts(board: BoardData): ValueText[] {
  const out: ValueText[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const value = board.vals[r * 9 + c];
      if (value)
        out.push({ key: `${r},${c}`, x: cellX(c) + CS / 2, y: cellY(r) + CS / 2 + 20, value });
    }
  }
  return out;
}

/**
 * Candidates (small digits) and underlines.
 * `touched`: cells involved in the solution; null in the question (nothing greyed out).
 */
export function candidateTexts(
  board: BoardData,
  touched: Set<string> | null = null,
): CandidateText[] {
  const underlined = new Set((board.under ?? []).map((u) => u.join()));
  const out: CandidateText[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board.vals[r * 9 + c]) continue;
      const off = touched !== null && !touched.has(`${r},${c}`);
      for (const digit of candidatesOf(board, [r, c])) {
        const [x, y] = P(r, c, digit);
        out.push({
          key: `${r},${c},${digit}`,
          x,
          y,
          digit,
          off,
          underlined: underlined.has(`${r},${c},${digit}`),
        });
      }
    }
  }
  return out;
}

/**
 * Everything needed to draw a board and its (optional) start cell and red zone.
 * `touched`: cells involved in the solution (others are greyed), null when no solution is shown.
 */
export function boardScene(
  board: BoardData,
  highlights: Highlights = {},
  touched: Set<string> | null = null,
): BoardScene {
  const { start } = highlights;
  return {
    lines: gridLines(),
    values: valueTexts(board),
    candidates: candidateTexts(board, touched),
    start: start ? { fill: cellRect(start), outline: cellRect(start, 4) } : null,
    redZone: highlights.redZone ? redZone(highlights.redZone) : null,
  };
}
