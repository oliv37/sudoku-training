import { Component, input } from '@angular/core';
import { DigitShape } from '../geometry/board-scene-model';
import { THEME } from '../board-theme';

/** Placed digits (large digits of the filled cells). */
@Component({
  selector: 'g[appBoardDigits]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  template: `
    @for (digit of digits(); track digit.key) {
      <svg:text
        [attr.x]="digit.x"
        [attr.y]="digit.y"
        text-anchor="middle"
        [attr.fill]="theme.digit"
        font-family="Barlow"
        font-weight="700"
        font-size="58"
      >
        {{ digit.digit }}
      </svg:text>
    }
  `,
})
export class BoardDigits {
  readonly digits = input.required<DigitShape[]>();

  protected readonly theme = THEME;
}
