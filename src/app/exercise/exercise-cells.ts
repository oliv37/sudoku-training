/**
 * Reading the cells of a question, as written in the grid file: placed digit and candidates of a
 * cell.
 */
import { Cell } from '../board/board-model';
import { cellKey } from '../board/board-cells';
import { ExerciseQuestionData } from './exercise-model';

/** Digit placed in a cell; 0 when the cell is empty. */
export function cellValueOf(question: ExerciseQuestionData, [r, c]: Cell): number {
  return question.vals[r * 9 + c];
}

/** Candidates of an empty cell (`cands` is keyed by `cellKey`); none for a filled cell. */
export function candidatesOf(question: ExerciseQuestionData, [r, c]: Cell): number[] {
  return question.cands[cellKey(r, c)] ?? [];
}
