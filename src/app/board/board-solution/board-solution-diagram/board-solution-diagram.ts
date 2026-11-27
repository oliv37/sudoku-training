import { Component, input } from '@angular/core';
import { THEME } from '../../board-theme';
import { SolutionScene } from '../geometry/board-solution-scene-model';

/**
 * Solution diagram, over the candidates: red squares around the last candidates of the red zone,
 * struck candidates, circles, arrows, then the numbered badges on top of everything.
 */
@Component({
  selector: 'g[appBoardSolutionDiagram]',
  templateUrl: './board-solution-diagram.html',
})
export class BoardSolutionDiagram {
  /** The part of the solution to draw (already limited to the shown step). */
  readonly scene = input.required<SolutionScene>();

  protected readonly theme = THEME;
}
