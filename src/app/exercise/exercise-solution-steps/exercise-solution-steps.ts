import { Component, computed, input, output } from '@angular/core';
import { ExerciseSolutionStep } from '../store/with-solution-steps';

/** Classes shared by every step button (round, small bold number, focus ring). */
const STEP_BASE_CLASSES =
  'flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chain';

/**
 * Numbered steps of the solution, with the same numbers and colors as on the board. Once the
 * animation is over, clicking a step shows the solution up to that step.
 */
@Component({
  selector: 'app-exercise-solution-steps',
  host: {
    role: 'group',
    'aria-label': 'Solution steps',
    class: 'flex flex-wrap justify-center gap-x-3 gap-y-2',
  },
  template: `
    @for (button of buttons(); track button.step) {
      <button
        type="button"
        [class]="button.classes"
        [style.background-color]="button.backgroundColor"
        [disabled]="animating()"
        [attr.aria-pressed]="button.selected"
        [attr.aria-label]="button.label"
        (click)="showUpTo.emit(button.step)"
      >
        {{ button.step }}
      </button>
    }
  `,
})
export class ExerciseSolutionSteps {
  readonly steps = input.required<ExerciseSolutionStep[]>();
  /** True while the steps appear one by one: the buttons wait for the end. */
  readonly animating = input(false);

  /** Show the solution up to this step. */
  readonly showUpTo = output<number>();

  /** What the template needs for each button. */
  protected readonly buttons = computed(() => {
    const animating = this.animating();
    return this.steps().map((step) => toStepButton(step, animating));
  });
}

function toStepButton(step: ExerciseSolutionStep, animating: boolean) {
  // Steps already drawn take their branch color (set as a style); the others stay grey.
  const colorClasses = step.reached ? 'text-white' : 'bg-line text-navy';
  const cursorClasses = animating ? 'cursor-default' : 'cursor-pointer hover:opacity-80';
  return {
    step: step.step,
    selected: step.selected,
    backgroundColor: step.reached ? step.color : null,
    classes: `${STEP_BASE_CLASSES} ${colorClasses} ${cursorClasses}`,
    label: `Show steps 1 to ${step.step}`,
  };
}
