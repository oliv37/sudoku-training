import { Component, input } from '@angular/core';
import { CandidateText, THEME } from '../geometry/board-geometry';

/** Candidates (small digits) of the empty cells, with their underline. */
@Component({
  selector: 'g[appBoardCandidates]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  template: `
    @for (candidate of candidates(); track candidate.key) {
      <svg:text
        [attr.x]="candidate.x"
        [attr.y]="candidate.y + 8"
        text-anchor="middle"
        [attr.fill]="candidate.off ? theme.candOff : theme.cand"
        font-family="Barlow"
        font-weight="600"
        font-size="23"
      >
        {{ candidate.digit }}
      </svg:text>
      @if (candidate.underlined) {
        <svg:line
          [attr.x1]="candidate.x - 8"
          [attr.y1]="candidate.y + 13"
          [attr.x2]="candidate.x + 8"
          [attr.y2]="candidate.y + 13"
          [attr.stroke]="candidate.off ? theme.candOff : theme.underline"
          stroke-width="2.4"
          stroke-linecap="round"
        />
      }
    }
  `,
})
export class BoardCandidates {
  readonly candidates = input.required<CandidateText[]>();

  protected readonly theme = THEME;
}
