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

/** Optional marks drawn on top of a board. */
export interface Highlights {
  /** Green start cell. */
  start?: Cell;
  /** Red hatched zone: a whole unit (dashed outline) or a single cell. */
  redZone?: { type: 'unit' | 'cell'; cases: Cell[] };
}

/** "R2C6" from internal [1, 5]. */
export function cellName([r, c]: Cell): string {
  return `R${r + 1}C${c + 1}`;
}

export function candidatesOf(board: BoardData, [r, c]: Cell): number[] {
  return board.cands[`${r},${c}`] ?? [];
}
