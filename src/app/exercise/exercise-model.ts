import { Cell, CellDigit } from '../board/board-model';
import { Frame } from './exercise-solution/exercise-solution-model';

/**
 * One grid: the questions of a solved grid, in solving order (an exercise = this sequence of
 * questions). Read from the grid file by `parseExerciseFile` (exercise-file/exercise-file.ts).
 */
export interface ExerciseData {
  /** The grid date, "2026-11-14". */
  name: string;
  title: string;
  questions: ExerciseQuestionData[];
}

/**
 * One question of a grid: the board at that point of the solve, what is asked (start cell, red
 * zone), the expected answer and its solution.
 */
export interface ExerciseQuestionData {
  /** 81 placed digits, row by row (index r × 9 + c), 0 = empty cell. */
  digits: number[];
  /** Candidates of the 81 cells, row by row (index r × 9 + c); none for a filled cell. */
  candidates: number[][];
  /** Candidates with only 2 places left in a row, column or box. */
  underlined: CellDigit[];
  startCell: Cell;
  redZone: RedZone;
  /** The candidate of the start cell to eliminate. */
  expectedAnswer: number;
  /** Other candidates also accepted, each with its own solution. */
  otherAnswers: OtherAnswer[];
  /** The chain of deductions of the expected answer. */
  solution: Frame[];
  /** Number of steps of the chain, shown with the question. */
  stepCount: number;
  /** How the red zone ends up at the end of the chain, e.g. "No 6 left in box 3". */
  contradiction: string;
  /** What should have caught the user's eye, shown after a wrong answer. */
  missedClue: string | null;
}

/** Another accepted answer, with its own solution. */
export interface OtherAnswer {
  answer: number;
  solution: Frame[];
  stepCount: number;
}

/** The red zone: a unit or a single cell that must lose its candidates. */
export interface RedZone {
  kind: 'unit' | 'cell';
  /** "box 3", "row 9", "R5C9"… */
  name: string;
  /** The digit that disappears from a unit; null for a cell (all its candidates disappear). */
  digit: number | null;
  cells: Cell[];
}
