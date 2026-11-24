import { Component, computed, input } from '@angular/core';
import { THEME, VIEW_BOX, boardScene } from './geometry/board-geometry';
import { BoardData, Highlights } from './board-model';
import { solutionScene, solutionUpTo } from './geometry/solution-geometry';

let nextId = 0;

/**
 * Declarative SVG rendering of a sudoku board with optional highlights
 * (start cell, red zone, solution diagram).
 * Knows nothing about exercises: callers map their data to `board` + `highlights`.
 */
@Component({
  selector: 'app-board',
  host: { class: 'block' },
  templateUrl: './board.html',
})
export class Board {
  readonly board = input.required<BoardData>();
  readonly highlights = input<Highlights>({});
  /** Accessible description of the grid (role="img"). */
  readonly label = input('Sudoku grid');

  protected readonly T = THEME;
  protected readonly viewBox = VIEW_BOX;
  protected readonly hatchId = `hatch-${nextId++}`;
  protected readonly hatchUrl = `url(#${this.hatchId})`;

  protected readonly solution = computed(() => {
    const { solution, redZone } = this.highlights();
    if (!solution) return null;
    // What disappears from the red zone: every candidate of a cell, or one digit of a unit.
    const lastDigit = redZone?.type === 'cell' ? 'all' : (redZone?.digit ?? null);
    return solutionScene(this.board(), solution.frames, redZone?.cases ?? [], lastDigit, THEME.hyp);
  });
  /** Part of the solution currently drawn. */
  protected readonly shownSolution = computed(() => {
    const scene = this.solution();
    const shownStep = this.highlights().solution?.shownStep;
    if (scene === null || shownStep === undefined) {
      return null;
    }
    return solutionUpTo(scene, shownStep);
  });
  protected readonly scene = computed(() =>
    boardScene(this.board(), this.highlights(), this.solution()?.touched ?? null),
  );
}
