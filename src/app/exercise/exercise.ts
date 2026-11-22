import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Board } from '../board/board';
import { Frame, candidatesOf, cellName } from '../board/board.model';
import { ExerciseData, exerciseHighlights } from './exercise.model';

/**
 * State of a candidate button:
 * - idle: not answered yet
 * - found: clicked and accepted
 * - wrong: clicked and not accepted
 * - answer: the expected answer, shown after a wrong click
 * - inactive: any other candidate once answered
 */
type CandidateState = 'idle' | 'found' | 'wrong' | 'answer' | 'inactive';

const CANDIDATE_CLASSES: Record<CandidateState, string> = {
  // Hover fade only on unanswered buttons: result colors (and back to idle) appear instantly.
  idle: 'cursor-pointer border-line bg-white hover:border-navy hover:transition-colors',
  found: 'border-hyp bg-hyp-bg',
  wrong: 'border-bad bg-bad-bg line-through',
  answer: 'border-hyp bg-white ring-2 ring-hyp ring-offset-2',
  inactive: 'border-line bg-white opacity-40',
};

const CANDIDATE_LABELS: Record<CandidateState, string> = {
  idle: 'Eliminate',
  found: 'Correct:',
  wrong: 'Wrong:',
  answer: 'Expected answer:',
  inactive: 'Candidate',
};

/** One exercise: the grid, the question, one button per candidate of the start cell, then the result. */
@Component({
  selector: 'app-exercise',
  imports: [Board],
  // Stacked by default. On wide landscape screens (≥ 768px and wider than tall):
  // info line + grid on the left, question + buttons on the right, centered vertically.
  // There the host is a size container: the left column is exactly as wide as the grid
  // (limited by the height minus the info line, and by the width minus the question panel),
  // and the question panel takes all the remaining width.
  host: {
    class:
      'flex flex-col gap-4 md:landscape:h-full md:landscape:flex-row md:landscape:justify-center md:landscape:gap-10 md:landscape:@container-size',
  },
  templateUrl: './exercise.html',
})
export class Exercise {
  readonly exo = input.required<ExerciseData>();
  /** Whether a next move exists (otherwise the end-of-grid message is shown). */
  readonly hasNext = input(false);
  readonly next = output<void>();

  private readonly injector = inject(Injector);
  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');
  private readonly result = viewChild<ElementRef<HTMLElement>>('result');
  private readonly candidateButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('candidateButton');

  /** Candidate clicked by the user; back to null whenever the move changes. */
  protected readonly answer = linkedSignal<ExerciseData, number | null>({
    source: this.exo,
    computation: () => null,
  });

  /** Accepted candidates with their own solution diagram (SPEC: `reponse` + `autresReponses`). */
  private readonly accepted = computed(() => {
    const e = this.exo();
    return new Map<number, Frame[]>([
      [e.reponse, e.frames],
      ...e.autresReponses.map((a) => [a.v, a.frames] as const),
    ]);
  });

  protected readonly found = computed(() => {
    const a = this.answer();
    return a !== null && this.accepted().has(a);
  });

  /** Candidate shown as eliminated in the conclusion: the chosen one if accepted, else `reponse`. */
  protected readonly eliminated = computed(() =>
    this.found() ? this.answer() : this.exo().reponse,
  );

  protected readonly highlights = computed(() => {
    const base = exerciseHighlights(this.exo());
    const a = this.answer();
    if (a === null) return base;
    return { ...base, solution: this.accepted().get(a) ?? this.exo().frames };
  });

  protected readonly boardLabel = computed(() => {
    const e = this.exo();
    const label = `Sudoku grid, move ${e.coup}. Green start cell ${cellName(e.depart)}, red zone ${e.arrivee.nom}.`;
    return this.answer() === null ? label : `${label} Solution diagram shown.`;
  });

  protected readonly startName = computed(() => cellName(this.exo().depart));

  protected readonly candidates = computed(() => {
    const e = this.exo();
    const a = this.answer();
    return candidatesOf(e, e.depart).map((d) => {
      const state: CandidateState =
        a === null
          ? 'idle'
          : d === a
            ? this.found()
              ? 'found'
              : 'wrong'
            : !this.found() && d === e.reponse
              ? 'answer'
              : 'inactive';
      return {
        d,
        state,
        classes: CANDIDATE_CLASSES[state],
        label: `${CANDIDATE_LABELS[state]} ${d}`,
      };
    });
  });

  protected choose(d: number): void {
    if (this.answer() !== null) return;
    this.answer.set(d);
    // The candidate buttons become disabled: move focus to "Next move" (or to the result at the end).
    afterNextRender(() => (this.nextButton() ?? this.result())?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  /** Back to the question for the same move; focus returns to the first candidate. */
  protected reset(): void {
    this.answer.set(null);
    afterNextRender(() => this.candidateButtons()[0]?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}
