import { Signal, computed, effect, untracked } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  type,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ShownSolution, Frame } from '../exercise-solution/exercise-solution-model';
import { lastStep, solutionSteps } from '../exercise-solution/exercise-solution';

/** Delay between two steps of the solution animation. */
const STEP_DELAY_MS = 600;

interface SolutionStepsState {
  /** Last step drawn on the board (0 = hypothesis only); null = no solution shown. */
  shownStep: number | null;
  /** True while the steps appear one after the other (step buttons not clickable yet). */
  animating: boolean;
}

const initialState: SolutionStepsState = {
  shownStep: null,
  animating: false,
};

/** One numbered step of the solution, as a button that shows the diagram up to that step. */
export interface ExerciseSolutionStep {
  step: number;
  /** Color of the step's branch, the same as on the board. */
  color: string;
  /** Already drawn on the board. */
  reached: boolean;
  /** Last step drawn once the animation is over (the one the user picked). */
  selected: boolean;
}

/**
 * Part of `ExerciseStore`: which step of the solution is drawn on the board. Once a solution is
 * shown, an animation draws it step by step (hypothesis first, then one step every
 * STEP_DELAY_MS); then the user can pick the step to show with the numbered step buttons.
 */
export function withSolutionSteps() {
  return signalStoreFeature(
    { props: type<{ solution: Signal<Frame[] | null> }>() },

    withState(initialState),

    withComputed(({ solution, shownStep, animating }) => ({
      /** The solution as the board draws it: its frames and the step reached; null = nothing drawn. */
      drawnSolution: computed((): ShownSolution | null => {
        const frames = solution();
        const step = shownStep();
        if (frames === null || step === null) {
          return null;
        }
        return { frames, shownStep: step };
      }),

      solutionSteps: computed((): ExerciseSolutionStep[] => {
        const frames = solution();
        if (frames === null) {
          return [];
        }
        const shown = shownStep() ?? 0;
        return solutionSteps(frames).map(({ step, color }) => ({
          step,
          color,
          reached: step <= shown,
          selected: !animating() && step === shown,
        }));
      }),
    })),

    withMethods((store) => ({
      /** Once the animation is over: show the solution up to this step only. */
      showUpTo(step: number): void {
        if (store.animating()) {
          return;
        }
        patchState(store, { shownStep: step });
      },

      // Members starting with `_` are private to the store (NgRx convention): only the hook below
      // calls them, components cannot.
      _hideSolution(): void {
        patchState(store, { shownStep: null, animating: false });
      },

      _showWholeSolution(frames: Frame[]): void {
        patchState(store, { shownStep: lastStep(frames), animating: false });
      },

      /**
       * Starts with the hypothesis alone; returns the timer that adds the next steps. The timer
       * stops itself after the last step; the hook stops it earlier if the solution changes.
       */
      _startAnimation(frames: Frame[]): ReturnType<typeof setInterval> {
        patchState(store, { shownStep: 0, animating: true });
        const last = lastStep(frames);
        const timer = setInterval(() => {
          const step = (store.shownStep() ?? 0) + 1;
          patchState(store, { shownStep: step });
          if (step >= last) {
            clearInterval(timer);
            patchState(store, { animating: false });
          }
        }, STEP_DELAY_MS);
        return timer;
      },
    })),

    withHooks((store) => ({
      onInit(): void {
        // Restarts or stops whenever the solution changes (answer, reset, other question).
        effect((onCleanup) => {
          const frames = store.solution();
          untracked(() => {
            if (frames === null) {
              store._hideSolution();
              return;
            }
            if (lastStep(frames) === 0 || prefersReducedMotion()) {
              store._showWholeSolution(frames);
              return;
            }
            const timer = store._startAnimation(frames);
            // Answer reset or other question before the end: stop the steps still to come.
            onCleanup(() => clearInterval(timer));
          });
        });
      },
    })),
  );
}

/** The user asked the system to reduce animations: show every step at once. */
function prefersReducedMotion(): boolean {
  // `matchMedia` does not exist while prerendering.
  if (typeof matchMedia !== 'function') {
    return false;
  }
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
