/**
 * The grid file exactly as exported by the Python script (`public/data/exercices-YYYY-MM-DD.json`,
 * format in docs/SPEC.md), French field names included. Read only by `parseExerciseFile`
 * (exercise-file.ts): the rest of the app uses the model of exercise-model.ts.
 */
import { Cell, CellDigit } from '../../board/board-model';

/** One grid file: the questions of a solved grid, in solving order. */
export interface ExerciseFile {
  nom: string;
  titre: string;
  exos: QuestionFile[];
}

/** One question of the grid file. */
export interface QuestionFile {
  /** Number of the question in the grid (1..N). */
  coup: number;
  /** 81 values, row by row, 0 = empty. */
  vals: number[];
  /** 81 × 0/1: 1 = given at the start. */
  givens: number[];
  /** Candidates of the empty cells, keyed "r,c" (0..8). */
  cands: Record<string, number[]>;
  under: CellDigit[];
  depart: Cell;
  reponse: number;
  autresReponses: OtherAnswerFile[];
  arrivee: ArrivalFile;
  texte: string;
  frames: FrameFile[];
  etapes: number;
  piste: string | null;
}

/** Another accepted answer, with its own solution. */
export interface OtherAnswerFile {
  v: number;
  frames: FrameFile[];
  etapes: number;
}

/** The red zone. */
export interface ArrivalFile {
  type: 'unit' | 'cell';
  /** "box 3", "row 9", "R5C9"… */
  nom: string;
  chiffre: number | null;
  cases: Cell[];
}

/** Frame 0: the hypothesis. */
export interface HypFrameFile {
  kind: 'hyp';
  circle: CellDigit;
  strikes: CellDigit[];
}

/** Frames 1..n: the forced placements. */
export interface DomFrameFile {
  kind: 'dom';
  circle: CellDigit;
  strikes: CellDigit[];
  /** Index of the frame that causes this one. */
  cause: number;
  /** "nu" (naked single) or "caché ligne 3" / "caché colonne 2" / "caché bloc 5" (hidden single). */
  why: string;
}

/** Last frame: the contradiction. */
export interface BadFrameFile {
  kind: 'bad';
  cells: Cell[];
  strikes: CellDigit[];
  /** "bloc 3", "ligne 9"…, null for a single cell. */
  unit: string | null;
}

export type FrameFile = HypFrameFile | DomFrameFile | BadFrameFile;
