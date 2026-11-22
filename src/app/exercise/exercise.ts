import { Component, computed, input } from '@angular/core';
import { Board } from '../board/board';
import { candidatesOf, cellName } from '../board/board.model';
import { ExerciseData, exerciseHighlights } from './exercise.model';

/** One exercise: the grid, the question and one button per candidate of the start cell. */
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

  protected readonly highlights = computed(() => exerciseHighlights(this.exo()));
  protected readonly boardLabel = computed(() => {
    const e = this.exo();
    return `Sudoku grid, move ${e.coup}. Green start cell ${cellName(e.depart)}, red zone ${e.arrivee.nom}.`;
  });
  protected readonly candidates = computed(() => candidatesOf(this.exo(), this.exo().depart));
  protected readonly startName = computed(() => cellName(this.exo().depart));
}
