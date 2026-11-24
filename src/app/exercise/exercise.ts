import { Component, Injector, afterNextRender, inject, input, viewChild } from '@angular/core';
import { ExerciseData } from './exercise-model';
import { ExerciseStore } from './store/exercise-store';
import { ExerciseBoard } from './exercise-board/exercise-board';
import { ExerciseCandidates } from './exercise-candidates/exercise-candidates';
import { ExerciseMissedClue } from './exercise-missed-clue/exercise-missed-clue';
import { ExerciseNav } from './exercise-nav/exercise-nav';
import { ExerciseNextActions } from './exercise-next-actions/exercise-next-actions';
import { ExerciseQuestion } from './exercise-question/exercise-question';
import { ExerciseSolutionSteps } from './exercise-solution-steps/exercise-solution-steps';
import { ExerciseVerdict } from './exercise-verdict/exercise-verdict';

let nextId = 0;

/**
 * An exercise: the sequence of questions of one grid. Lays out its parts (navigation, board,
 * question, candidates, verdict, solution steps, missed clue, next actions), connects them to
 * `ExerciseStore`, where all the exercise state lives, and moves the focus between them.
 */
@Component({
  selector: 'app-exercise',
  imports: [
    ExerciseNav,
    ExerciseBoard,
    ExerciseQuestion,
    ExerciseCandidates,
    ExerciseVerdict,
    ExerciseSolutionSteps,
    ExerciseMissedClue,
    ExerciseNextActions,
  ],
  providers: [ExerciseStore],
  // Stacked by default (navigation, board, question). On wide landscape screens (≥ 768px and
  // wider than tall) the host becomes a grid: the board fills the height of the left column, the
  // right column reads from the top: navigation (row 1), then question, candidates and result
  // (row 2), so it only grows downward when the result appears (row 3 takes the remaining space).
  // The host is a size container: the board column is as wide as the height allows, minus room
  // for the right column (20rem) and the gap.
  host: {
    class:
      'flex flex-col gap-4 md:landscape:grid md:landscape:h-full md:landscape:grid-cols-[auto_minmax(20rem,28rem)] md:landscape:grid-rows-[auto_auto_1fr] md:landscape:justify-center md:landscape:gap-x-10 md:landscape:gap-y-8 md:landscape:@container-size',
  },
  templateUrl: './exercise.html',
})
export class Exercise {
  readonly exercise = input.required<ExerciseData>();

  protected readonly store = inject(ExerciseStore);

  /** Id of the question, which names the candidates group; unique if several exercises are shown. */
  protected readonly questionId = `exercise-question-${nextId++}`;

  private readonly injector = inject(Injector);
  private readonly candidates = viewChild.required(ExerciseCandidates);
  // Present only once answered.
  private readonly verdict = viewChild(ExerciseVerdict);
  private readonly actions = viewChild(ExerciseNextActions);

  constructor() {
    // Keep the store in sync with the input: a new exercise starts again from its first question.
    this.store.setExercise(this.exercise);
  }

  /**
   * The user picks a candidate. The candidate buttons become disabled, so the focus moves to the
   * result (once it is rendered) instead of being lost.
   */
  protected choose(digit: number): void {
    this.store.choose(digit);
    afterNextRender(() => this.focusAfterAnswer(), { injector: this.injector });
  }

  /** "Next question" if there is one; on the last question, the verdict. */
  private focusAfterAnswer(): void {
    if (this.store.hasNext()) {
      this.actions()?.focusNextButton();
      return;
    }
    this.verdict()?.focus();
  }

  /** Back to the same question; the focus returns to the first candidate. */
  protected reset(): void {
    this.store.reset();
    afterNextRender(() => this.candidates().focusFirstCandidate(), { injector: this.injector });
  }
}
