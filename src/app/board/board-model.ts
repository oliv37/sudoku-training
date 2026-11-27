/** Cell coordinates, 0..8: [row, column]. */
export type Cell = [number, number];
/** A digit in a cell: [row, column, digit]. */
export type CellDigit = [number, number, number];

/** What the grid shows, independent of any exercise. */
export interface BoardData {
  /** 81 values, row by row, 0 = empty. */
  vals: number[];
  /** Candidates of empty cells, keyed "r,c". */
  cands: Record<string, number[]>;
  /** Underlined candidates (only 2 places left in a row, column or box). */
  under?: CellDigit[];
}

/**
 * Solution diagram, as exported by the Python script: frame 0 is the hypothesis (green circle),
 * frames 1..n are forced placements (numbered circles, arrow from frame `cause`), the last one is
 * the unit or cell that becomes empty.
 */
export interface HypFrame {
  kind: 'hyp';
  circle: CellDigit;
  strikes: CellDigit[];
}

export interface DomFrame {
  kind: 'dom';
  circle: CellDigit;
  strikes: CellDigit[];
  /** Index of the frame whose circle causes this one. */
  cause: number;
  /** "nu" (naked single) or "caché ligne 3" / "caché colonne 2" / "caché bloc 5" (hidden single). */
  why: string;
}

export interface BadFrame {
  kind: 'bad';
  cells: Cell[];
  unit: string | null;
}

export type Frame = HypFrame | DomFrame | BadFrame;

/** Optional marks of the question drawn on the board (fixed for a given question). */
export interface Highlights {
  /** Green start cell. */
  start?: Cell;
  /**
   * Red hatched zone: a whole unit (dashed outline) or a single cell.
   * `digit`: the digit that disappears from a unit (null for a cell: all its candidates disappear).
   */
  redZone?: { type: 'unit' | 'cell'; cases: Cell[]; digit?: number | null };
}

/**
 * A solution diagram (circles, struck candidates, arrows; cells not involved are greyed) and how
 * much of it is drawn.
 */
export interface BoardSolution {
  frames: Frame[];
  /**
   * Drawn up to this step (frame index; 0 = hypothesis only). To draw everything, pass the last
   * step (`lastStep(frames)`). Grey cells stay those of the whole solution.
   */
  shownStep: number;
}

/** "R2C6" from internal [1, 5]. */
export function cellName([r, c]: Cell): string {
  return `R${r + 1}C${c + 1}`;
}

export function candidatesOf(board: BoardData, [r, c]: Cell): number[] {
  return board.cands[`${r},${c}`] ?? [];
}
