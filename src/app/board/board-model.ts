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

/** Optional marks of the question drawn on the board (fixed for a given question). */
export interface Highlights {
  /** Green start cell. */
  start?: Cell;
  redZone?: RedZone;
}

/**
 * Red hatched zone of the question: a whole unit (dashed outline) or a single cell.
 * `digit`: the digit that disappears from a unit (null for a cell: all its candidates disappear).
 */
export interface RedZone {
  type: 'unit' | 'cell';
  cases: Cell[];
  digit?: number | null;
}
