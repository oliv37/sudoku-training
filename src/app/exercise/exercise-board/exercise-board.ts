import { Component, computed, input } from '@angular/core';
import { Board } from '../../board/board';
import { Frame, Highlights, cellName } from '../../board/board.model';
import { ExerciseQuestionData } from '../exercise.model';

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
        [label]="label()"
        [step]="step()"
        class="mx-auto aspect-square w-[min(100cqw,100cqh)] overflow-hidden rounded-lg shadow-[0_1px_0_var(--color-line),0_6px_18px_rgba(18,58,102,0.12)]"
      />
    </div>
  `,
})
export class ExerciseBoard {
  readonly question = input.required<ExerciseQuestionData>();
  /** Solution diagram to draw; null before the user answers. */
  readonly solution = input<Frame[] | null>(null);
  /** Last step of the solution drawn (0 = hypothesis only); null = the whole diagram. */
  readonly step = input<number | null>(null);

  protected readonly highlights = computed((): Highlights => {
    const questionMarks = questionHighlights(this.question());
    const solution = this.solution();
    if (solution === null) {
      return questionMarks;
    }
    return { ...questionMarks, solution };
  });

  /** Description of the board for screen readers. */
  protected readonly label = computed(() => {
    const question = this.question();
    const startCell = cellName(question.depart);
    const label = `Sudoku grid, question ${question.coup}. Green start cell ${startCell}, red zone ${question.arrivee.nom}.`;
    if (this.solution() === null) {
      return label;
    }
    return `${label} Solution diagram shown.`;
  });
}

/** Marks of the question on the board: green start cell and red zone. */
function questionHighlights(question: ExerciseQuestionData): Highlights {
  const { type, cases, chiffre } = question.arrivee;
  return { start: question.depart, redZone: { type, cases, digit: chiffre } };
}
