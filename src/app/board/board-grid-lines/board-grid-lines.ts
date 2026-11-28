import { Component, input } from '@angular/core';
import { GridLineShape } from '../geometry/board-scene-model';
import { THEME } from '../board-theme';

/** Thin cell lines and thick box lines of the grid. */
@Component({
  selector: 'g[appBoardGridLines]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  template: `
    @for (line of lines(); track $index) {
      <svg:line
        [attr.x1]="line.x1"
        [attr.y1]="line.y1"
        [attr.x2]="line.x2"
        [attr.y2]="line.y2"
        [attr.stroke]="line.thick ? theme.thickLine : theme.thinLine"
        [attr.stroke-width]="line.thick ? 7 : 1.8"
        stroke-linecap="square"
      />
    }
  `,
})
export class BoardGridLines {
  readonly lines = input.required<GridLineShape[]>();

  protected readonly theme = THEME;
}
