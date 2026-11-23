import { Component, computed, input, linkedSignal } from '@angular/core';
import { ExerciseData } from './exercise.model';
import { Move } from './move/move';

/**
 * An exercise: the sequence of moves of one grid. Owns the current move, the move navigation
 * (‹ › buttons and ← → keys) and shows the current move with `Move`.
 */
@Component({
  selector: 'app-exercise',
  imports: [Move],
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
  readonly grid = input.required<ExerciseData>();

  /** Index of the current move; back to the first move when another grid is given. */
  protected readonly moveIndex = linkedSignal<ExerciseData, number>({
    source: this.grid,
    computation: () => 0,
  });

  protected readonly total = computed(() => this.grid().exos.length);
  protected readonly move = computed(() => this.grid().exos[this.moveIndex()]);
  protected readonly hasPrevious = computed(() => this.moveIndex() > 0);
  protected readonly hasNext = computed(() => this.moveIndex() < this.total() - 1);
  /** Width reserved for the move number, so "9 / 20" → "10 / 20" does not shift the line. */
  protected readonly counterWidth = computed(() => String(this.total()).length);

  protected previous(): void {
    if (this.hasPrevious()) this.moveIndex.update((i) => i - 1);
  }

  protected next(): void {
    if (this.hasNext()) this.moveIndex.update((i) => i + 1);
  }

  /** ← / → change move, unless the user is typing or using a shortcut. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]')
    ) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      this.previous();
    } else if (event.key === 'ArrowRight') {
      this.next();
    } else {
      return;
    }
    event.preventDefault();
  }
}
