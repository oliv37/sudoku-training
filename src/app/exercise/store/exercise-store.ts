import { signalStore } from '@ngrx/signals';
import { withAnswer } from './with-answer';
import { withNavigation } from './with-navigation';
import { withSolutionSteps } from './with-solution-steps';

/**
 * Everything about one exercise, provided by the `Exercise` component (one store per component).
 * Each feature builds on the previous one:
 * - navigation: the exercise, its current question, previous / next question;
 * - answer: the candidate chosen for the current question, and the solution to show;
 * - solution steps: which step of that solution is drawn (animation, then the user's choice).
 */
export const ExerciseStore = signalStore(withNavigation(), withAnswer(), withSolutionSteps());
