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
import { Frame } from '../board/board.model';
import { lastStep, solutionSteps } from '../board/geometry/solution-geometry';

/** Delay between two steps of the solution animation. */
const STEP_DELAY_MS = 600;

interface SolutionAnimationState {
  /** Last step drawn on the board (0 = hypothesis only); null = no solution shown. */
  shownStep: number | null;
  /** True while the steps appear one after the other (step buttons not clickable yet). */
  animating: boolean;
}

const initialState: SolutionAnimationState = {
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
 * Part of `ExerciseStore`: once a solution is shown, draws it step by step (hypothesis first,
 * then one step every STEP_DELAY_MS), then lets the user pick the step to show.
 */
export function withSolutionAnimation() {
  return signalStoreFeature(
    { props: type<{ solution: Signal<Frame[] | null> }>() },

    withState(initialState),

    withComputed(({ solution, shownStep, animating }) => ({
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

      _hideSolution(): void {
        patchState(store, { shownStep: null, animating: false });
      },

      _showWholeSolution(frames: Frame[]): void {
        patchState(store, { shownStep: lastStep(frames), animating: false });
      },

      /** Starts with the hypothesis alone; returns the timer that adds the next steps. */
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
