import { Component, input } from '@angular/core';
import { THEME } from '../board-theme';
import { ArrowShape, BadgeShape } from './geometry/board-arrows-scene-model';

/** Arrows, then their badges on top of everything. */
@Component({
  selector: 'g[appBoardArrows]',
  templateUrl: './board-arrows.html',
})
export class BoardArrows {
  readonly arrows = input.required<ArrowShape[]>();
  readonly badges = input.required<BadgeShape[]>();

  protected readonly theme = THEME;
}
