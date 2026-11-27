/**
 * Small boards and solution chains written by hand, shared by the board tests.
 * Used by the `*.spec.ts` files only.
 */
import { BoardData, Cell, CellDigit } from './board-model';
import { BadFrame, DomFrame, HypFrame } from './board-solution/board-solution-model';

/** A board with no placed digit and no candidate. */
export function emptyBoard(): BoardData {
  return boardWith({});
}

/** A board with only the given placed digits and candidates (both keyed "r,c"). */
export function boardWith({
  values = {},
  candidates = {},
  underlined = [],
}: {
  values?: Record<string, number>;
  candidates?: Record<string, number[]>;
  underlined?: CellDigit[];
}): BoardData {
  const vals = new Array<number>(81).fill(0);
  for (const [key, value] of Object.entries(values)) {
    const [r, c] = key.split(',').map(Number);
    vals[r * 9 + c] = value;
  }
  return { vals, cands: candidates, under: underlined };
}

/** The 9 cells of row `r` (0..8). */
export function rowCells(r: number): Cell[] {
  const cells: Cell[] = [];
  for (let c = 0; c < 9; c++) {
    cells.push([r, c]);
  }
  return cells;
}

/** The 9 cells of box `box` (0..8, numbered row by row). */
export function boxCells(box: number): Cell[] {
  const firstRow = Math.floor(box / 3) * 3;
  const firstColumn = (box % 3) * 3;
  const cells: Cell[] = [];
  for (let r = firstRow; r < firstRow + 3; r++) {
    for (let c = firstColumn; c < firstColumn + 3; c++) {
      cells.push([r, c]);
    }
  }
  return cells;
}

/** Frame 0 of a chain: the hypothesis. */
export function hypothesis(circle: CellDigit, strikes: CellDigit[] = []): HypFrame {
  return { kind: 'hyp', circle, strikes };
}

/** A forced placement caused by the frame `cause`; a naked single unless `why` says otherwise. */
export function forced(
  circle: CellDigit,
  cause: number,
  strikes: CellDigit[] = [],
  why = 'nu',
): DomFrame {
  return { kind: 'dom', circle, strikes, cause, why };
}

/** Last frame of a chain: the contradiction. */
export function contradiction(): BadFrame {
  return { kind: 'bad', cells: [], unit: null };
}
