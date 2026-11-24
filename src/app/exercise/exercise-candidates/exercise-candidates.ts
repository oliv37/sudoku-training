import { Component, ElementRef, input, output, viewChildren } from '@angular/core';
import { CandidateState, ExerciseCandidate } from '../exercise-answer.feature';

/** Classes shared by every candidate button (size, font, focus ring). */
const BUTTON_BASE_CLASSES =
  'h-11 min-w-11 rounded-lg border-2 px-3 text-xl font-bold text-navy tabular-nums ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain ' +
  'md:landscape:h-16 md:landscape:min-w-16 md:landscape:rounded-xl md:landscape:text-3xl';

/** Classes depending on the candidate state (colors). */
const BUTTON_STATE_CLASSES: Record<CandidateState, string> = {
  // Hover fade only on unanswered buttons: result colors (and back to idle) appear instantly.
  idle: 'cursor-pointer border-line bg-white hover:border-navy hover:transition-colors',
  found: 'border-hyp bg-hyp-bg',
  wrong: 'border-bad bg-bad-bg line-through',
  answer: 'border-hyp bg-white ring-2 ring-hyp ring-offset-2',
  inactive: 'border-line bg-white opacity-40',
};

/** What screen readers say before the digit, since the colors are not seen. */
const STATE_LABELS: Record<CandidateState, string> = {
  idle: 'Eliminate',
  found: 'Correct:',
  wrong: 'Wrong:',
  answer: 'Expected answer:',
  inactive: 'Candidate',
};

/** One button per candidate of the start cell; the buttons show the answer once chosen. */
@Component({
  selector: 'app-exercise-candidates',
  host: {
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy()',
    class: 'flex flex-wrap justify-center gap-2 md:landscape:gap-3',
  },
  template: `
    @for (candidate of candidates(); track candidate.digit) {
      <button
        #candidateButton
        type="button"
        [class]="buttonClasses(candidate.state)"
        [attr.aria-label]="buttonLabel(candidate)"
        [disabled]="candidate.state !== 'idle'"
        (click)="choose.emit(candidate.digit)"
      >
        {{ candidate.digit }}
      </button>
    }
  `,
})
export class ExerciseCandidates {
  readonly candidates = input.required<ExerciseCandidate[]>();
  /** Id of the element that names the group (the question). */
  readonly labelledBy = input.required<string>();
  readonly choose = output<number>();

  private readonly candidateButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('candidateButton');

  /** Called by the parent after a reset, so keyboard users can answer again right away. */
  focusFirstCandidate(): void {
    const firstButton = this.candidateButtons()[0];
    firstButton?.nativeElement.focus();
  }

  protected buttonClasses(state: CandidateState): string {
    return `${BUTTON_BASE_CLASSES} ${BUTTON_STATE_CLASSES[state]}`;
  }

  protected buttonLabel(candidate: ExerciseCandidate): string {
    return `${STATE_LABELS[candidate.state]} ${candidate.digit}`;
  }
}
