import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Board } from '../../board/board';
import { cellName } from '../../board/board.model';
import { CandidateState } from '../exercise-answer.feature';
import { questionHighlights } from '../exercise.model';
import { ExerciseStore } from '../exercise.store';
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

/** One move: the board, the question, one button per candidate of the start cell, then the result. */
@Component({
  selector: 'app-move',
  imports: [Board],
  // `display: contents`: the board column and the question panel are laid out directly by the
  // parent `Exercise` grid (see its host classes), next to the move navigation.
  host: { class: 'contents' },
  templateUrl: './move.html',
})
export class Move {
  /** Temporary while `Move` is split into smaller components: everything comes from the store. */
  protected readonly store = inject(ExerciseStore);

  private readonly injector = inject(Injector);
  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');
  private readonly result = viewChild<ElementRef<HTMLElement>>('result');
  private readonly candidateButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('candidateButton');

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

  protected readonly highlights = computed(() => {
    const question = this.store.question();
    if (question === null) {
      return {};
    }
    const base = questionHighlights(question);
    const frames = this.store.solution();
    return frames ? { ...base, solution: frames } : base;
  });

  protected readonly boardLabel = computed(() => {
    const e = this.store.question();
    if (e === null) {
      return '';
    }
    const label = `Sudoku grid, question ${e.coup}. Green start cell ${cellName(e.depart)}, red zone ${e.arrivee.nom}.`;
    return this.store.answered() ? `${label} Solution diagram shown.` : label;
  });

  protected readonly startName = computed(() => {
    const e = this.store.question();
    return e === null ? '' : cellName(e.depart);
  });

  protected readonly candidates = computed(() =>
    this.store.candidates().map((c) => ({
      ...c,
      classes: `${CANDIDATE_BASE_CLASSES} ${CANDIDATE_CLASSES[c.state]}`,
      label: `${CANDIDATE_LABELS[c.state]} ${c.digit}`,
    })),
  );

  protected choose(d: number): void {
    this.store.choose(d);
    // The candidate buttons become disabled: move focus to "Next question" (or to the result at the end).
    afterNextRender(() => (this.nextButton() ?? this.result())?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  /** Back to the question for the same move; focus returns to the first candidate. */
  protected reset(): void {
    this.store.reset();
    afterNextRender(() => this.candidateButtons()[0]?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}
