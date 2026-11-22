import { Cell, CellDigit, Frame, Highlights } from '../board/board.model';

export interface OtherAnswer {
  v: number;
  frames: Frame[];
  etapes: number;
}

export interface Arrival {
  type: 'unit' | 'cell';
  /** "box 3", "row 9", "R5C9"… */
  nom: string;
  chiffre: number | null;
  cases: Cell[];
}

export interface ExerciseData {
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

export interface ExerciseFile {
  nom: string;
  titre: string;
  exos: ExerciseData[];
}

/** Question marks of the standard mode: green start cell and red arrival zone. */
export function exerciseHighlights(exo: ExerciseData): Highlights {
  const { type, cases, chiffre } = exo.arrivee;
  return { start: exo.depart, redZone: { type, cases, digit: chiffre } };
}
