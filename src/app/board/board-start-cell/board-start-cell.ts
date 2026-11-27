import { Component, input } from '@angular/core';
import { StartCellShape } from '../geometry/board-scene-model';
import { THEME } from '../board-theme';

/** Green start cell of the question: light green background, then its outline. Drawn over the grid lines. */
@Component({
  selector: 'g[appBoardStartCell]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  // `mix-blend-multiply` on the background: it is drawn over the grid lines, and multiplying its
  // color with what lies under it keeps the lines dark and visible instead of covering them.
  template: `
    <svg:rect
      [attr.x]="start().fill.x"
      [attr.y]="start().fill.y"
      [attr.width]="start().fill.width"
      [attr.height]="start().fill.height"
      [attr.fill]="theme.hypBg"
      class="mix-blend-multiply"
    />
    <svg:rect
      [attr.x]="start().outline.x"
      [attr.y]="start().outline.y"
      [attr.width]="start().outline.width"
      [attr.height]="start().outline.height"
      fill="none"
      [attr.stroke]="theme.hyp"
      stroke-width="5"
    />
  `,
})
export class BoardStartCell {
  readonly start = input.required<StartCellShape>();

  protected readonly theme = THEME;
}
