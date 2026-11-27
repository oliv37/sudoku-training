import { Component, computed, input } from '@angular/core';
import { GRID_SIZE, THEME, VIEW_BOX, boardSceneOf } from './geometry/board-geometry';
import { BoardData, BoardSolution, Highlights } from './board-model';
import { solutionSceneOf, solutionSceneUpTo } from './geometry/solution-geometry';
import { BoardGridLines } from './board-grid-lines/board-grid-lines';
import { BoardRedZone } from './board-red-zone/board-red-zone';
import { BoardStartCell } from './board-start-cell/board-start-cell';
import { BoardValues } from './board-values/board-values';
import { BoardCandidates } from './board-candidates/board-candidates';
import { BoardSolutionDiagram } from './board-solution-diagram/board-solution-diagram';

let nextId = 0;

/**
 * Declarative SVG rendering of a sudoku board with optional highlights
 * (start cell, red zone, solution diagram).
 * Knows nothing about exercises: callers map their data to `board` + `highlights`.
 */
@Component({
  selector: 'app-board',
  host: { class: 'block' },
  imports: [
    BoardGridLines,
    BoardRedZone,
    BoardStartCell,
    BoardValues,
    BoardCandidates,
    BoardSolutionDiagram,
  ],
  templateUrl: './board.html',
})
export class Board {
  readonly board = input.required<BoardData>();
  readonly highlights = input<Highlights>({});
  /** Solution diagram and the step drawn; null when no solution is shown. */
  readonly solution = input<BoardSolution | null>(null);
  /** Accessible description of the grid (role="img"). */
  readonly label = input('Sudoku grid');

  protected readonly theme = THEME;
  protected readonly viewBox = VIEW_BOX;
  protected readonly gridSize = GRID_SIZE;
  protected readonly hatchId = `hatch-${nextId++}`;
  protected readonly hatchUrl = `url(#${this.hatchId})`;

  /**
   * Frames of the solution, without the step drawn. The array stays the same while the steps
   * appear, so the scenes computed from it are not recomputed at every step of the animation.
   */
  private readonly solutionFrames = computed(() => this.solution()?.frames ?? null);

  /** The whole solution diagram (every step); null when no solution is shown. */
  private readonly solutionScene = computed(() => {
    const frames = this.solutionFrames();
    if (frames === null) {
      return null;
    }
    const { redZone } = this.highlights();
    // What disappears from the red zone: every candidate of a cell, or one digit of a unit.
    const lastDigit = redZone?.type === 'cell' ? 'all' : (redZone?.digit ?? null);
    return solutionSceneOf(this.board(), frames, redZone?.cases ?? [], lastDigit, THEME.hyp);
  });

  /** The solution diagram limited to the steps drawn so far. */
  protected readonly shownSolutionScene = computed(() => {
    const solutionScene = this.solutionScene();
    const solution = this.solution();
    if (solutionScene === null || solution === null) {
      return null;
    }
    return solutionSceneUpTo(solutionScene, solution.shownStep);
  });

  /** Grid, digits, candidates and question marks. */
  protected readonly boardScene = computed(() =>
    boardSceneOf(this.board(), this.highlights(), this.solutionScene()?.touched ?? null),
  );
}
