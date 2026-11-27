import { Component, computed, input } from '@angular/core';
import { Board } from '../../board/board';
import { BoardSolution, Highlights, cellName } from '../../board/board-model';
import { ExerciseQuestionData } from '../exercise-model';

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
        [board]="question()"
        [highlights]="highlights()"
        [solution]="solution()"
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
  readonly solution = input<BoardSolution | null>(null);

  /** Marks of the question: the same object for the whole question, steps of the solution included. */
  protected readonly highlights = computed(() => highlightsOf(this.question()));

  /** Description of the board for screen readers. */
  protected readonly label = computed(() => {
    const question = this.question();
    const startCell = cellName(question.depart);
    const label = `Sudoku grid, question ${this.questionNumber()}. Green start cell ${startCell}, red zone ${question.arrivee.nom}.`;
    if (this.solution() === null) {
      return label;
    }
    return `${label} Solution diagram shown.`;
  });
}

/** Marks of the question on the board: green start cell and red zone. */
function highlightsOf(question: ExerciseQuestionData): Highlights {
  const { type, cases, chiffre } = question.arrivee;
  return { start: question.depart, redZone: { type, cases, digit: chiffre } };
}
