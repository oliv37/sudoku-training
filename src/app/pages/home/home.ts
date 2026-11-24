import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Exercise } from '../../exercise/exercise';
import { ExerciseData } from '../../exercise/exercise.model';

/** For now: a single hard-coded exercise (the November 14 grid). */
const EXERCISE_URL = '/data/exercices-2026-11-14.json';

/** Home page: loads an exercise and shows it. */
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
    @if (exerciseResource.value(); as exercise) {
      <app-exercise [exercise]="exercise" class="min-h-0 shrink" />
    } @else if (exerciseResource.error()) {
      <p role="alert" class="text-center text-bad">Could not load the exercise.</p>
    } @else {
      <p class="animate-delayed-appear text-center text-muted">Loading…</p>
    }
  `,
})
export class Home {
  protected readonly exerciseResource = httpResource<ExerciseData>(() => EXERCISE_URL);
}
