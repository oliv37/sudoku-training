/**
 * Reading the cells of a question: placed digit and candidates of a cell.
 */
import { Cell } from '../board/board-model';
import { ExerciseQuestionData } from './exercise-model';

/** Digit placed in a cell; 0 when the cell is empty. */
export function cellValueOf(question: ExerciseQuestionData, [r, c]: Cell): number {
  return question.digits[r * 9 + c];
}

/** Candidates of an empty cell; none for a filled cell. */
export function candidatesOf(question: ExerciseQuestionData, [r, c]: Cell): number[] {
  return question.candidates[r * 9 + c];
}
