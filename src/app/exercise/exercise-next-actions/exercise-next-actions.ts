import { Component, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * What the user can do once they answered: try the same question again (Reset), or go to the
 * next question. On the last question, a message replaces the "Next question" button.
 */
@Component({
  selector: 'app-exercise-next-actions',
  host: { class: 'flex flex-wrap items-center justify-center gap-3' },
  template: `
    <button
      type="button"
      class="cursor-pointer rounded-lg border-2 border-line bg-white px-4 py-1 text-sm font-semibold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain md:landscape:px-5 md:landscape:py-1.5 md:landscape:text-base"
      (click)="resetAnswer.emit()"
    >
      ↺ Reset
    </button>
    @if (hasNext()) {
      <button
        #nextButton
        type="button"
        class="cursor-pointer rounded-lg border-2 border-navy bg-navy px-4 py-1 text-sm font-semibold text-white transition-colors hover:border-chain hover:bg-chain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain md:landscape:px-5 md:landscape:py-1.5 md:landscape:text-base"
        (click)="next.emit()"
      >
        Next question →
      </button>
    } @else {
      <p class="text-base font-semibold md:landscape:text-xl">Last question of this grid.</p>
    }
  `,
})
export class ExerciseNextActions {
  /** Whether a next question exists (otherwise the end-of-grid message is shown). */
  readonly hasNext = input(false);

  /** Named `resetAnswer`, not `reset`, which is a native DOM event. */
  readonly resetAnswer = output();
  readonly next = output();

  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');

  /** Called by the parent once answered, when a next question exists. */
  focusNextButton(): void {
    this.nextButton()?.nativeElement.focus();
  }
}
