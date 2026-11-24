import { computed } from '@angular/core';
import {
  patchState,
  signalMethod,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ExerciseData, ExerciseQuestionData } from './exercise.model';

interface NavigationState {
  /**
   * The exercise shown. Null only until the component passes its input to the store
   * (the store is created before Angular sets the inputs).
   */
  exercise: ExerciseData | null;
  /** Index of the current question in `exercise.exos` (0 = first question). */
  questionIndex: number;
}

const initialState: NavigationState = {
  exercise: null,
  questionIndex: 0,
};

/** Part of `ExerciseStore`: the exercise shown, its current question, previous / next question. */
export function withNavigation() {
  return signalStoreFeature(
    withState(initialState),

    withComputed(({ exercise, questionIndex }) => {
      const questionCount = computed(() => {
        const current = exercise();
        if (current === null) {
          return 0;
        }
        return current.exos.length;
      });

      /** Name of the exercise (its grid date), shown in the navigation. */
      const exerciseName = computed(() => {
        const current = exercise();
        if (current === null) {
          return '';
        }
        return current.nom;
      });

      const question = computed((): ExerciseQuestionData | null => {
        const current = exercise();
        if (current === null) {
          return null;
        }
        return current.exos[questionIndex()];
      });

      const hasPrevious = computed(() => questionIndex() > 0);
      const hasNext = computed(() => questionIndex() < questionCount() - 1);

      return { questionCount, exerciseName, question, hasPrevious, hasNext };
    }),

    withMethods((store) => ({
      /** Shows an exercise, starting from its first question. Accepts a value or a signal. */
      setExercise: signalMethod<ExerciseData>((exercise) => {
        patchState(store, { exercise, questionIndex: 0 });
      }),

      previous(): void {
        if (!store.hasPrevious()) {
          return;
        }
        patchState(store, { questionIndex: store.questionIndex() - 1 });
      },

      next(): void {
        if (!store.hasNext()) {
          return;
        }
        patchState(store, { questionIndex: store.questionIndex() + 1 });
      },
    })),
  );
}
