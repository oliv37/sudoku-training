/** Types of the arrow placement (board-solution-arrows.ts). */
import { Point } from '../../geometry/board-coordinates-model';

/** Something an arrow or a badge should not cross: a disc, heavier when it matters more. */
export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  weight: number;
}

/** An arrow ready to draw: SVG paths of its curve and of its head, and where its badge goes. */
export interface Arrow {
  path: string;
  head: string;
  /** Centre of the numbered badge of the step. */
  badge: Point;
}

/** Quadratic Bézier curve: from `start` to `end`, pulled towards `control`. */
export interface Curve {
  start: Point;
  control: Point;
  end: Point;
}
