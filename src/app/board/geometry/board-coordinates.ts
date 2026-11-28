/**
 * Where things are on the drawn grid, in SVG user units: cells, units, candidates.
 * Same measures as `renderCard` (docs/sudoku-training-modele.html), with the grid origin at (0, 0)
 * instead of (GX, GY). The tuning constants of the arrows depend on these measures.
 */
import { Cell, CellDigit } from '../board-model';
import { Point, Rect } from './board-coordinates-model';

/**
 * Size of a cell, in SVG user units. Not a setting: every measure of the board is expressed for a
 * 96-unit cell (candidate positions, text sizes, line widths, arrow constants), as in `renderCard`.
 * The size on screen comes from the CSS; the `viewBox` scales the whole drawing to fit.
 */
export const CELL_SIZE = 96;
export const GRID_SIZE = 9 * CELL_SIZE;
/** Margin around the grid so the thick outer lines (7 units) are not clipped. */
const MARGIN = 4;
export const VIEW_BOX = `${-MARGIN} ${-MARGIN} ${GRID_SIZE + 2 * MARGIN} ${GRID_SIZE + 2 * MARGIN}`;

/**
 * Candidates are laid out 3 × 3 in their cell (1 2 3 on top, then 4 5 6, then 7 8 9):
 * centre of candidate 1 from the top-left corner of the cell, and distance between two neighbours.
 */
const FIRST_CANDIDATE_X = 20;
const FIRST_CANDIDATE_Y = 21;
const CANDIDATE_SPACING_X = 28;
const CANDIDATE_SPACING_Y = 27;

/** Left edge of column `c`. */
export function cellLeft(c: number): number {
  return c * CELL_SIZE;
}

/** Top edge of row `r`. */
export function cellTop(r: number): number {
  return r * CELL_SIZE;
}

/** Centre of a cell, [x, y]. */
export function cellCenter([r, c]: Cell): Point {
  return [cellLeft(c) + CELL_SIZE / 2, cellTop(r) + CELL_SIZE / 2];
}

/** Centre of a candidate (small digit) in its cell, [x, y]. */
export function candidateCenter([r, c, digit]: CellDigit): Point {
  const columnInCell = (digit - 1) % 3;
  const rowInCell = Math.floor((digit - 1) / 3);
  const x = cellLeft(c) + FIRST_CANDIDATE_X + columnInCell * CANDIDATE_SPACING_X;
  const y = cellTop(r) + FIRST_CANDIDATE_Y + rowInCell * CANDIDATE_SPACING_Y;
  return [x, y];
}

/** Rectangle of a cell, shrunk by `inset` on each side (to draw an outline inside the cell). */
export function cellRect([r, c]: Cell, inset = 0): Rect {
  return {
    x: cellLeft(c) + inset,
    y: cellTop(r) + inset,
    width: CELL_SIZE - 2 * inset,
    height: CELL_SIZE - 2 * inset,
  };
}

/** Smallest rectangle around some cells (a row, column or box), shrunk by `inset` on each side. */
export function cellsRect(cells: Cell[], inset = 0): Rect {
  const rows = cells.map(([r]) => r);
  const columns = cells.map(([, c]) => c);
  const firstRow = Math.min(...rows);
  const lastRow = Math.max(...rows);
  const firstColumn = Math.min(...columns);
  const lastColumn = Math.max(...columns);
  const rowCount = lastRow - firstRow + 1;
  const columnCount = lastColumn - firstColumn + 1;
  return {
    x: cellLeft(firstColumn) + inset,
    y: cellTop(firstRow) + inset,
    width: columnCount * CELL_SIZE - 2 * inset,
    height: rowCount * CELL_SIZE - 2 * inset,
  };
}
