import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Board } from '../board/board';
import { Frame, candidatesOf, cellName } from '../board/board.model';
import { lastStep, solutionSteps } from '../board/geometry/solution-geometry';
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

/** Classes shared by every candidate button (size, font, focus ring). */
const CANDIDATE_BASE_CLASSES =
  'h-11 min-w-11 rounded-lg border-2 px-3 text-xl font-bold text-navy tabular-nums ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain ' +
  'md:landscape:h-16 md:landscape:min-w-16 md:landscape:rounded-xl md:landscape:text-3xl';

/** Classes depending on the candidate state (colors). */
const CANDIDATE_CLASSES: Record<CandidateState, string> = {
  // Hover fade only on unanswered buttons: result colors (and back to idle) appear instantly.
  idle: 'cursor-pointer border-line bg-white hover:border-navy hover:transition-colors',
  found: 'border-hyp bg-hyp-bg',
  wrong: 'border-bad bg-bad-bg line-through',
  answer: 'border-hyp bg-white ring-2 ring-hyp ring-offset-2',
  inactive: 'border-line bg-white opacity-40',
};

/** Delay between two steps of the solution animation. */
const STEP_DELAY_MS = 600;

const STEP_BASE_CLASSES =
  'flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain';

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
  // Stacked by default (navigation, board, question). On wide landscape screens (≥ 768px and
  // wider than tall) the host becomes a grid: the board fills the height of the left column, the
  // right column reads from the top: navigation (row 1), then the question panel (row 2), so the
  // panel only grows downward when the result appears (row 3 takes the remaining space). The host is a size container: the board column is as wide
  // as the height allows, minus room for the right panel (20rem) and the gap.
  host: {
    class:
      'flex flex-col gap-4 md:landscape:grid md:landscape:h-full md:landscape:grid-cols-[auto_minmax(20rem,28rem)] md:landscape:grid-rows-[auto_auto_1fr] md:landscape:justify-center md:landscape:gap-x-10 md:landscape:gap-y-8 md:landscape:@container-size',
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

  /** Solution diagram of the chosen candidate if accepted, else of `reponse`; null before answering. */
  private readonly solutionFrames = computed(() => {
    const a = this.answer();
    return a === null ? null : (this.accepted().get(a) ?? this.exo().frames);
  });

  /** Last step drawn on the board (0 = hypothesis only); null = no solution shown. */
  protected readonly shownStep = signal<number | null>(null);
  /** True while the steps appear one after the other (step circles not clickable yet). */
  protected readonly animating = signal(false);

  private readonly steps = computed(() => {
    const frames = this.solutionFrames();
    return frames ? solutionSteps(frames) : [];
  });

  /**
   * Numbered step circles next to the result, all present from the start (no layout jump):
   * steps already drawn on the board take their branch color, the others stay grey.
   */
  protected readonly stepButtons = computed(() => {
    const shown = this.shownStep() ?? 0;
    const animating = this.animating();
    return this.steps().map((s) => {
      const reached = s.step <= shown;
      return {
        ...s,
        reached,
        /** Last step drawn once the animation is over (the one the user picked). */
        selected: !animating && s.step === shown,
        classes:
          STEP_BASE_CLASSES +
          (reached ? ' text-white' : ' bg-line text-navy') +
          (animating ? ' cursor-default' : ' cursor-pointer hover:opacity-80'),
      };
    });
  });

  protected readonly highlights = computed(() => {
    const base = exerciseHighlights(this.exo());
    const frames = this.solutionFrames();
    return frames ? { ...base, solution: frames } : base;
  });

  constructor() {
    // Solution animation: hypothesis at once, then one step every STEP_DELAY_MS.
    // Restarts or stops whenever the solution changes (answer, reset, other move).
    effect((onCleanup) => {
      const frames = this.solutionFrames();
      untracked(() => {
        if (!frames) {
          this.shownStep.set(null);
          this.animating.set(false);
          return;
        }
        const last = lastStep(frames);
        if (last === 0 || prefersReducedMotion()) {
          this.shownStep.set(last);
          this.animating.set(false);
          return;
        }
        this.shownStep.set(0);
        this.animating.set(true);
        const timer = setInterval(() => {
          const step = (this.shownStep() ?? 0) + 1;
          this.shownStep.set(step);
          if (step >= last) {
            clearInterval(timer);
            this.animating.set(false);
          }
        }, STEP_DELAY_MS);
        onCleanup(() => clearInterval(timer));
      });
    });
  }

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
        classes: `${CANDIDATE_BASE_CLASSES} ${CANDIDATE_CLASSES[state]}`,
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

  /** Once the animation is over: show the solution up to this step only. */
  protected showUpTo(step: number): void {
    if (!this.animating()) this.shownStep.set(step);
  }

  /** Back to the question for the same move; focus returns to the first candidate. */
  protected reset(): void {
    this.answer.set(null);
    afterNextRender(() => this.candidateButtons()[0]?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}

/** The user asked the system to reduce animations: show every step at once. */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
