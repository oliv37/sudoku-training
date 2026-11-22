import { Component, computed, input } from '@angular/core';
import { THEME, VIEW_BOX, gridScene } from './grid-geometry';
import { Board, Highlights } from './grid.model';

let nextId = 0;

/**
 * Declarative SVG rendering of a sudoku board with optional highlights.
 * Knows nothing about exercises: callers map their data to `board` + `highlights`.
 */
@Component({
  selector: 'app-grid',
  host: { class: 'block' },
  templateUrl: './grid.component.html',
})
export class GridComponent {
  readonly board = input.required<Board>();
  readonly highlights = input<Highlights>({});
  /** Accessible description of the grid (role="img"). */
  readonly label = input('Sudoku grid');
  /** Not used yet: the solution diagram comes in the next step. */
  readonly showSolution = input(false);
  /** Not used yet: step-by-step display of the solution (frame index). */
  readonly step = input<number | null>(null);

  protected readonly T = THEME;
  protected readonly viewBox = VIEW_BOX;
  protected readonly hatchId = `hatch-${nextId++}`;
  protected readonly hatchUrl = `url(#${this.hatchId})`;

  protected readonly scene = computed(() => gridScene(this.board(), this.highlights()));
}
