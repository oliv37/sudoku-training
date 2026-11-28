import { Component, computed, input } from '@angular/core';
import { Board } from '../../board/board';
import { cellName } from '../../board/board-cells';
import { ShownSolution } from '../exercise-solution/exercise-solution-model';
import { ExerciseQuestionData } from '../exercise-model';
import { boardDrawingOf } from './exercise-board-drawing';

/**
 * The board of a question: the green start cell and the red zone, then the solution diagram
 * once the user answered. The parent places and sizes the host (column of the `Exercise` grid).
 */
@Component({
  selector: 'app-exercise-board',
  imports: [Board],
  template: `
    <!-- Square by default (height = width), shrinks when the height runs out;
         the board is the largest square fitting this box. -->
    <div class="aspect-square min-h-0 w-full shrink @container-size">
      <app-board
        [drawing]="drawing()"
        [label]="label()"
        class="mx-auto aspect-square w-[min(100cqw,100cqh)] overflow-hidden rounded-lg shadow-[0_1px_0_var(--color-line),0_6px_18px_color-mix(in_srgb,var(--color-navy)_12%,transparent)]"
      />
    </div>
  `,
})
export class ExerciseBoard {
  readonly question = input.required<ExerciseQuestionData>();
  /** Number of the question, as shown in the navigation (1 = first question). */
  readonly questionNumber = input.required<number>();
  /** Solution diagram and the step drawn; null before the user answers. */
  readonly solution = input<ShownSolution | null>(null);

  /**
   * Rebuilt at each step of the animation: only the hidden flags change, and the board keeps every
   * element in place, so nothing moves.
   */
  protected readonly drawing = computed(() => boardDrawingOf(this.question(), this.solution()));

  /** Description of the board for screen readers. */
  protected readonly label = computed(() => {
    const question = this.question();
    const startCell = cellName(question.startCell);
    const label = `Sudoku grid, question ${this.questionNumber()}. Green start cell ${startCell}, red zone ${question.redZone.name}.`;
    if (this.solution() === null) {
      return label;
    }
    return `${label} Solution diagram shown.`;
  });
}
