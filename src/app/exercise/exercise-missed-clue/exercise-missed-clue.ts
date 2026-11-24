import { Component, input } from '@angular/core';

/** Part of the result, after a wrong answer: what should have caught the user's eye. */
@Component({
  selector: 'app-exercise-missed-clue',
  host: { class: 'block' },
  template: `
    <p class="text-center text-sm leading-snug text-muted md:landscape:text-base">
      <b class="font-semibold text-navy">What should have caught your eye:</b> {{ clue() }}
    </p>
  `,
})
export class ExerciseMissedClue {
  readonly clue = input.required<string>();
}
