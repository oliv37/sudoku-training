import { Component, computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Exercise } from '../../exercise/exercise';
import { ExerciseFile } from '../../exercise/exercise.model';

/** First step: a single hard-coded move (November 14 grid, move 1). */
const GRID_FILE = '/data/exercices-2026-11-14.json';
const MOVE_INDEX = 0;

@Component({
  selector: 'app-home',
  imports: [Exercise],
  // Exercise screen: never taller than the viewport minus the header (the grid shrinks to fit),
  // but never shorter than 30rem — below that the page scrolls instead of shrinking the grid further.
  host: {
    class:
      'mx-auto flex h-[calc(100dvh-var(--header-height))] min-h-120 w-full max-w-xl flex-col justify-center px-4 py-4 md:landscape:max-w-none md:landscape:pb-10',
  },
  template: `
    @if (exo(); as e) {
      <app-exercise [exo]="e" class="min-h-0 shrink">
        <p
          class="flex-none text-center font-mono text-xs md:landscape:text-sm tracking-wider text-muted uppercase"
        >
          {{ grid.value()?.nom }} · {{ e.coup }} / {{ grid.value()?.exos?.length }} ·
          {{ e.etapes }}-step chain
        </p>
      </app-exercise>
    } @else if (grid.error()) {
      <p role="alert" class="text-bad">Could not load the exercise.</p>
    } @else {
      <p class="text-muted">Loading…</p>
    }
  `,
})
export class Home {
  protected readonly grid = httpResource<ExerciseFile>(() => GRID_FILE);
  protected readonly exo = computed(() => this.grid.value()?.exos[MOVE_INDEX]);
}
