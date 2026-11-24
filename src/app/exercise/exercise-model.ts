import { Cell, CellDigit, Frame } from '../board/board-model';

/** One grid file: the questions of a solved grid, in order (an exercise = this sequence of questions). */
export interface ExerciseData {
  nom: string;
  titre: string;
  exos: ExerciseQuestionData[];
}

/**
 * One question of a grid: the board at that point of the solve, what is asked (start cell, red
 * zone), the expected answer and its solution diagram.
 */
export interface ExerciseQuestionData {
  /** Number of the question in the grid (1..N), in solving order. */
  coup: number;
  /** 81 values, row by row, 0 = empty. */
  vals: number[];
  /** 81 × 0/1: 1 = given at the start. */
  givens: number[];
  /** Candidates of empty cells, keyed "r,c". */
  cands: Record<string, number[]>;
  under: CellDigit[];
  depart: Cell;
  reponse: number;
  autresReponses: OtherAnswer[];
  arrivee: Arrival;
  texte: string;
  frames: Frame[];
  etapes: number;
  piste: string | null;
}

/** Another accepted answer, with its own solution diagram. */
export interface OtherAnswer {
  v: number;
  frames: Frame[];
  etapes: number;
}

/** The red zone: a unit or a single cell that must lose its candidates. */
export interface Arrival {
  type: 'unit' | 'cell';
  /** "box 3", "row 9", "R5C9"… */
  nom: string;
  chiffre: number | null;
  cases: Cell[];
}
