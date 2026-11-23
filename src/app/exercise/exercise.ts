import { Component, inject, input } from '@angular/core';
import { ExerciseData } from './exercise.model';
import { ExerciseStore } from './exercise.store';
import { Move } from './move/move';

/**
 * An exercise: the sequence of moves of one grid. Shows the move navigation (‹ › buttons and
 * ← → keys) and the current move with `Move`. All the exercise state lives in `ExerciseStore`.
 */
@Component({
  selector: 'app-exercise',
  imports: [Move],
  providers: [ExerciseStore],
  // Stacked by default (navigation, board, question). On wide landscape screens (≥ 768px and
  // wider than tall) the host becomes a grid: the board fills the height of the left column, the
  // right column reads from the top: navigation (row 1), then the question panel (row 2), so the
  // panel only grows downward when the result appears (row 3 takes the remaining space).
  // `Move` uses `display: contents`, so its board column and panel are items of this grid.
  // The host is a size container: the board column is as wide as the height allows, minus room
  // for the right panel (20rem) and the gap.
  host: {
    class:
      'flex flex-col gap-4 md:landscape:grid md:landscape:h-full md:landscape:grid-cols-[auto_minmax(20rem,28rem)] md:landscape:grid-rows-[auto_auto_1fr] md:landscape:justify-center md:landscape:gap-x-10 md:landscape:gap-y-8 md:landscape:@container-size',
    '(document:keydown)': 'onKeydown($event)',
  },
  templateUrl: './exercise.html',
})
export class Exercise {
  readonly exercise = input.required<ExerciseData>();

  protected readonly store = inject(ExerciseStore);

  constructor() {
    // Keep the store in sync with the input: a new exercise starts again from its first move.
    this.store.setExercise(this.exercise);
  }

  /** ← / → go to the previous / next move. */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.shouldIgnoreKey(event)) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      // The arrow would otherwise scroll the page sideways.
      event.preventDefault();
      this.store.previous();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.store.next();
      return;
    }
  }

  /** Keys that belong to someone else and must not change the move. */
  private shouldIgnoreKey(event: KeyboardEvent): boolean {
    // Already handled by another element of the page.
    if (event.defaultPrevented) {
      return true;
    }
    // Arrows combined with a modifier are browser or system shortcuts:
    // Alt+← / Alt+→ go back / forward in the browser history,
    // Shift / Ctrl / Cmd + arrows select text or jump by word.
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return true;
    }
    // In a form field the arrows move the text cursor.
    if (this.isTypingInFormField(event)) {
      return true;
    }
    return false;
  }

  /**
   * True when the key was pressed inside a form field (input, textarea, select or an editable
   * element), where the user is typing and the arrows must keep moving the text cursor.
   */
  private isTypingInFormField(event: KeyboardEvent): boolean {
    const target = event.target;
    return (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]') !== null
    );
  }
}
