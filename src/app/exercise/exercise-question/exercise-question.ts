import { Component, computed, input } from '@angular/core';
import { cellName } from '../../board/board-cells';
import { ExerciseQuestionData } from '../exercise-model';

/**
 * What is asked: which candidate of the green start cell must be eliminated to empty the red
 * zone, and the length of the chain. Only the statement: the answer and the solution are shown
 * by other components.
 */
@Component({
  selector: 'app-exercise-question',
  host: {
    class: 'flex flex-col gap-2 md:landscape:gap-3',
  },
  template: `
    <h2
      class="text-center text-base leading-relaxed font-semibold md:landscape:text-2xl md:landscape:leading-relaxed"
    >
      Which candidate of
      <span class="whitespace-nowrap rounded-md border-2 border-hyp bg-hyp-bg px-1.5">{{
        startCell()
      }}</span>
      must be eliminated to
      @if (question().arrivee.type === 'cell') {
        leave
        <span class="whitespace-nowrap rounded-md border-2 border-bad bg-bad-bg px-1.5">{{
          question().arrivee.nom
        }}</span>
        without candidates?
      } @else {
        empty the
        <span
          class="whitespace-nowrap rounded-md border-2 border-dashed border-bad bg-bad-bg px-1.5"
          >red zone</span
        >?
      }
    </h2>
    <p
      class="text-center font-mono text-xs tracking-wider text-muted uppercase md:landscape:text-sm"
    >
      {{ question().etapes }}-step chain
    </p>
  `,
})
export class ExerciseQuestion {
  readonly question = input.required<ExerciseQuestionData>();

  protected readonly startCell = computed(() => cellName(this.question().depart));
}
