/**
 * Names and keys of the cells and candidates of a board.
 * The types are in board-model.ts.
 */
import { Cell, CellDigit } from './board-model';

/** "R2C6" from internal [1, 5]. */
export function cellName([r, c]: Cell): string {
  return `R${r + 1}C${c + 1}`;
}

/** Key of a cell in sets of cells: "r,c" (0..8). */
export function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

/** Key of a candidate in sets of candidates: "r,c,digit". */
export function candidateKey([r, c, digit]: CellDigit): string {
  return `${r},${c},${digit}`;
}
