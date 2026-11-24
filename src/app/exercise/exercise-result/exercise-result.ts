import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { ExerciseAnswerResult } from '../exercise-answer.feature';
import { ExerciseSolutionStep } from '../exercise-solution-animation.feature';

/** Classes shared by every step button (round, small bold number, focus ring). */
const STEP_BASE_CLASSES =
  'flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain';

/**
 * The result of the current question once answered: verdict and explanation, numbered steps of
 * the solution, hint after a wrong answer, Reset / Next question. Always rendered, even before
 * answering, so the verdict lands in a live region that already exists (screen readers announce
 * it).
 */
@Component({
  selector: 'app-exercise-result',
  // `display: contents`: its parts are items of the right column of `Exercise`, with its gaps.
  host: { class: 'contents' },
  templateUrl: './exercise-result.html',
})
export class ExerciseResult {
  /** Null before answering: nothing is shown. */
  readonly result = input.required<ExerciseAnswerResult | null>();
  readonly steps = input.required<ExerciseSolutionStep[]>();
  /** True while the steps appear one by one: the step buttons wait for the end. */
  readonly animating = input(false);
  /** Whether a next question exists (otherwise the end-of-grid message is shown). */
  readonly hasNext = input(false);

  /** Show the solution up to this step. */
  readonly showUpTo = output<number>();
  /** Named `resetAnswer`, not `reset`, which is a native DOM event. */
  readonly resetAnswer = output();
  readonly next = output();

  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');
  private readonly verdict = viewChild<ElementRef<HTMLElement>>('verdict');

  /**
   * Called by the parent once answered: the candidate buttons are disabled, so the focus goes to
   * "Next question" (or to the verdict on the last question).
   */
  focusAfterAnswer(): void {
    const target = this.nextButton() ?? this.verdict();
    target?.nativeElement.focus();
  }

  protected stepClasses(step: ExerciseSolutionStep): string {
    // Steps already drawn take their branch color (set as a style); the others stay grey.
    const colorClasses = step.reached ? 'text-white' : 'bg-line text-navy';
    const cursorClasses = this.animating() ? 'cursor-default' : 'cursor-pointer hover:opacity-80';
    return `${STEP_BASE_CLASSES} ${colorClasses} ${cursorClasses}`;
  }
}
