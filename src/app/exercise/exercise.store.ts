import { computed } from '@angular/core';
import {
  patchState,
  signalMethod,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ExerciseData } from './exercise.model';
import { MoveData } from './move/move.model';

interface ExerciseState {
  /**
   * The exercise shown. Null only until the component passes its input to the store
   * (the store is created before Angular sets the inputs).
   */
  exercise: ExerciseData | null;
  /** Index of the current move in `exercise.exos` (0 = first move). */
  moveIndex: number;
}

const initialState: ExerciseState = {
  exercise: null,
  moveIndex: 0,
};

/**
 * Everything about one exercise: the exercise shown, which move is current, and how to go to
 * the previous / next move. Provided by the `Exercise` component (one store per component).
 */
export const ExerciseStore = signalStore(
  withState(initialState),

  withComputed(({ exercise, moveIndex }) => {
    const moveCount = computed(() => {
      const current = exercise();
      if (current === null) {
        return 0;
      }
      return current.exos.length;
    });

    /** Name of the exercise (its grid date), shown in the move navigation. */
    const exerciseName = computed(() => {
      const current = exercise();
      if (current === null) {
        return '';
      }
      return current.nom;
    });

    const move = computed((): MoveData | null => {
      const current = exercise();
      if (current === null) {
        return null;
      }
      return current.exos[moveIndex()];
    });

    const hasPrevious = computed(() => moveIndex() > 0);
    const hasNext = computed(() => moveIndex() < moveCount() - 1);

    /** Width reserved for the move number, so "9 / 20" → "10 / 20" does not shift the line. */
    const counterWidth = computed(() => String(moveCount()).length);

    return { moveCount, exerciseName, move, hasPrevious, hasNext, counterWidth };
  }),

  withMethods((store) => ({
    /** Shows an exercise, starting from its first move. Accepts a value or a signal. */
    setExercise: signalMethod<ExerciseData>((exercise) => {
      patchState(store, { exercise, moveIndex: 0 });
    }),

    previous(): void {
      if (!store.hasPrevious()) {
        return;
      }
      patchState(store, { moveIndex: store.moveIndex() - 1 });
    },

    next(): void {
      if (!store.hasNext()) {
        return;
      }
      patchState(store, { moveIndex: store.moveIndex() + 1 });
    },
  })),
);
