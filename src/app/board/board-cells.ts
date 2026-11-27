/**
 * Reading the cells of a board: names, keys, placed digit and candidates of a cell.
 * The types are in board-model.ts.
 */
import { BoardData, Cell, CellDigit } from './board-model';

/** "R2C6" from internal [1, 5]. */
export function cellName([r, c]: Cell): string {
  return `R${r + 1}C${c + 1}`;
}

/** Key of a cell in `BoardData.cands` and in sets of cells: "r,c" (0..8). */
export function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

/** Key of a candidate in sets of candidates: "r,c,digit". */
export function candidateKey([r, c, digit]: CellDigit): string {
  return `${r},${c},${digit}`;
}

/** Keys of the 81 cells: when no solution is shown, every cell is involved and nothing is greyed. */
export function allCellKeys(): Set<string> {
  const keys = new Set<string>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      keys.add(cellKey(r, c));
    }
  }
  return keys;
}

/** Digit placed in a cell; 0 when the cell is empty. */
export function cellValueOf(board: BoardData, [r, c]: Cell): number {
  return board.vals[r * 9 + c];
}

/** Candidates of an empty cell; none for a filled cell. */
export function candidatesOf(board: BoardData, [r, c]: Cell): number[] {
  return board.cands[cellKey(r, c)] ?? [];
}
