import { Component, ElementRef, computed, inject, output, viewChild } from '@angular/core';
import { ExerciseStore } from '../exercise.store';
const STEP_BASE_CLASSES =
  'flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain';

/** The result of the current question once answered: verdict, solution steps, hint, Reset / Next. */
@Component({
  selector: 'app-move',
  // `display: contents`: its parts are items of the right column of `Exercise`.
  host: { class: 'contents' },
  templateUrl: './move.html',
})
export class Move {
  readonly resetAnswer = output();

  /** Temporary while `Move` is split into smaller components: everything comes from the store. */
  protected readonly store = inject(ExerciseStore);

  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');
  private readonly result = viewChild<ElementRef<HTMLElement>>('result');

  protected readonly stepButtons = computed(() => {
    const animating = this.store.animating();
    return this.store.solutionSteps().map((s) => ({
      ...s,
      classes:
        STEP_BASE_CLASSES +
        (s.reached ? ' text-white' : ' bg-line text-navy') +
        (animating ? ' cursor-default' : ' cursor-pointer hover:opacity-80'),
    }));
  });

  /** Called by the parent once answered: the candidate buttons are disabled, so the focus goes
   * to "Next question" (or to the verdict on the last question). */
  focusAfterAnswer(): void {
    const target = this.nextButton() ?? this.result();
    target?.nativeElement.focus();
  }
}
