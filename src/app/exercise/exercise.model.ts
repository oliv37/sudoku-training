import { Cell, CellDigit, Highlights } from '../board/board.model';

export interface HypFrame {
  kind: 'hyp';
  circle: CellDigit;
  strikes: CellDigit[];
}

export interface DomFrame {
  kind: 'dom';
  circle: CellDigit;
  strikes: CellDigit[];
  /** Index of the frame whose circle causes this one. */
  cause: number;
  /** "nu" (naked single) or "caché ligne 3" / "caché colonne 2" / "caché bloc 5" (hidden single). */
  why: string;
}

export interface BadFrame {
  kind: 'bad';
  cells: Cell[];
  unit: string | null;
}

export type Frame = HypFrame | DomFrame | BadFrame;

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
  return { start: exo.depart, redZone: exo.arrivee };
}
