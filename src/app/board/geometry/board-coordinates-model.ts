/** Basic shapes of the drawn grid, in SVG user units (board-coordinates.ts). */

/** A position in SVG user units: [x, y]. */
export type Point = [number, number];

/** Rectangle in SVG user units (a cell is CELL_SIZE = 96 wide). */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
