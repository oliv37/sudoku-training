import { signalStore } from '@ngrx/signals';
import { withAnswer } from './exercise-answer.feature';
import { withNavigation } from './exercise-navigation.feature';
import { withSolutionAnimation } from './exercise-solution-animation.feature';

/**
 * Everything about one exercise, provided by the `Exercise` component (one store per component).
 * Each feature builds on the previous one:
 * - navigation: the exercise, its current question, previous / next question;
 * - answer: the candidate chosen for the current question, and the solution to show;
 * - solution animation: which step of that solution is drawn.
 */
export const ExerciseStore = signalStore(withNavigation(), withAnswer(), withSolutionAnimation());
