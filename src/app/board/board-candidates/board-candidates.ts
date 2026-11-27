import { Component, input } from '@angular/core';
import { CandidateText } from '../geometry/board-scene-model';
import { THEME } from '../board-theme';

/** Candidates (small digits) of the empty cells, with their underline. */
@Component({
  selector: 'g[appBoardCandidates]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  template: `
    @for (candidate of candidates(); track candidate.key) {
      <svg:text
        [attr.x]="candidate.x"
        [attr.y]="candidate.textY"
        text-anchor="middle"
        [attr.fill]="candidate.greyed ? theme.greyedCandidate : theme.candidate"
        font-family="Barlow"
        font-weight="600"
        font-size="23"
      >
        {{ candidate.digit }}
      </svg:text>
      @if (candidate.underlined) {
        <svg:line
          [attr.x1]="candidate.underline.x1"
          [attr.y1]="candidate.underline.y1"
          [attr.x2]="candidate.underline.x2"
          [attr.y2]="candidate.underline.y2"
          [attr.stroke]="candidate.greyed ? theme.greyedCandidate : theme.underline"
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
