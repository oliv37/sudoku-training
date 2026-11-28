import { Component, input } from '@angular/core';
import { CandidateShape } from '../geometry/board-scene-model';
import { THEME } from '../board-theme';

/**
 * Candidates (small digits) of the empty cells, each with its underline and its marks: frame,
 * strike, then circle.
 */
@Component({
  selector: 'g[appBoardCandidates]',
  templateUrl: './board-candidates.html',
})
export class BoardCandidates {
  readonly candidates = input.required<CandidateShape[]>();

  protected readonly theme = THEME;
}
