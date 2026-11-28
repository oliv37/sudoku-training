import { ZoneShape } from '../geometry/board-scene-model';

/** A zone as the template draws it: its `fill` paint is a color or the board's hatch pattern. */
export interface ZoneView extends ZoneShape {
  backgroundPaint: string;
}
