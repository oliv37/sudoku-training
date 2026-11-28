/**
 * The solution of a question, as exported by the Python script: a chain of deductions from a
 * hypothesis to a contradiction. What it means (steps, branches, cells involved) is read in
 * exercise-solution.ts.
 */
import { Cell, CellDigit } from '../../board/board-model';

/** Frame 0: the hypothesis, a candidate supposed placed (green circle). */
export interface HypFrame {
  kind: 'hyp';
  circle: CellDigit;
  strikes: CellDigit[];
}

/** Frames 1..n: forced placements, the steps of the chain (numbered circles, arrow from `cause`). */
export interface DomFrame {
  kind: 'dom';
  circle: CellDigit;
  strikes: CellDigit[];
  /** Index of the frame whose circle causes this one. */
  cause: number;
  /** "nu" (naked single) or "caché ligne 3" / "caché colonne 2" / "caché bloc 5" (hidden single). */
  why: string;
}

/** A row, column or box, as named in the reason of a hidden single ("caché ligne 3"). */
export interface Unit {
  kind: 'ligne' | 'colonne' | 'bloc';
  /** 0..8 (the reason counts from 1). */
  index: number;
}

/** Last frame: the contradiction, the unit or cell that becomes empty. */
export interface BadFrame {
  kind: 'bad';
  cells: Cell[];
  unit: string | null;
}

/**
 * One moment of the solution chain. A solution is a list of frames, as exported by the Python
 * script: the hypothesis, the forced placements, then the contradiction ("Format du schéma" in
 * docs/SPEC.md).
 */
export type Frame = HypFrame | DomFrame | BadFrame;

/** A solution shown on the board, and how much of it is drawn. */
export interface ShownSolution {
  frames: Frame[];
  /**
   * Drawn up to this step (frame index; 0 = hypothesis only). To draw everything, pass the last
   * step (`lastStep(frames)`). Grey cells stay those of the whole solution.
   */
  shownStep: number;
}
