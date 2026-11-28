/** Types of the arrow routing (board-arrows-routing.ts). */
import { Point } from '../../geometry/board-coordinates-model';

/** Something an arrow or a badge should not cross: a disc, heavier when it matters more. */
export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  weight: number;
}

/** An arrow routed between two candidates: SVG paths of its curve and of its head, and where its badge goes. */
export interface RoutedArrow {
  path: string;
  head: string;
  /** Centre of the badge; its place is kept free even when the arrow has no badge. */
  badge: Point;
}

/** Quadratic Bézier curve: from `start` to `end`, pulled towards `control`. */
export interface Curve {
  start: Point;
  control: Point;
  end: Point;
}
