import { Component, input } from '@angular/core';
import { THEME, ValueText } from '../geometry/board-geometry';

/** Placed digits (large digits of the filled cells). */
@Component({
  selector: 'g[appBoardValues]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  template: `
    @for (value of values(); track value.key) {
      <svg:text
        [attr.x]="value.x"
        [attr.y]="value.y"
        text-anchor="middle"
        [attr.fill]="theme.given"
        font-family="Barlow"
        font-weight="700"
        font-size="58"
      >
        {{ value.value }}
      </svg:text>
    }
  `,
})
export class BoardValues {
  readonly values = input.required<ValueText[]>();

  protected readonly theme = THEME;
}
