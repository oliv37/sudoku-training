import { Component, inject, input } from '@angular/core';
import { ExerciseData } from './exercise.model';
import { ExerciseStore } from './exercise.store';
import { Move } from './move/move';
import { ExerciseNav } from './exercise-nav/exercise-nav';

/**
 * An exercise: the sequence of moves of one grid. Lays out the move navigation (`ExerciseNav`) and
 * the current move (`Move`), and connects them to `ExerciseStore`, where all the exercise state lives.
 */
@Component({
  selector: 'app-exercise',
  imports: [ExerciseNav, Move],
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
}
