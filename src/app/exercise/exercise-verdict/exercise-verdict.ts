import { Component, ElementRef, input, viewChild } from '@angular/core';
import { ExerciseAnswerResult } from '../store/with-answer';

/** "Found!" or "Lost", followed by why the candidate must be eliminated. */
@Component({
  selector: 'app-exercise-verdict',
  host: { class: 'block' },
  template: `
    <p
      #verdict
      tabindex="-1"
      class="text-center text-base leading-snug focus:outline-none md:landscape:text-xl"
    >
      @if (result().found) {
        <span class="mr-1 rounded-md border-2 border-hyp bg-hyp-bg px-1.5 font-bold">Found!</span>
      } @else {
        <span class="mr-1 rounded-md border-2 border-bad bg-bad-bg px-1.5 font-bold">Lost</span>
      }
      {{ result().explanation }}
    </p>
  `,
})
export class ExerciseVerdict {
  readonly result = input.required<ExerciseAnswerResult>();

  private readonly verdict = viewChild.required<ElementRef<HTMLElement>>('verdict');

  /** Called by the parent on the last question, where there is no "Next question" button. */
  focus(): void {
    this.verdict().nativeElement.focus();
  }
}
