/**
 * Cells and units written by hand, shared by the board tests (and the tests of the domains that
 * draw a board). Used by the `*.spec.ts` files only.
 */
import { Cell } from '../board-model';

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
