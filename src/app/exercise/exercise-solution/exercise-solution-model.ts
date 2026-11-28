/**
 * The solution of a question: a chain of deductions from a hypothesis to a contradiction. What it
 * means (steps, branches, cells involved) is read in exercise-solution.ts.
 */
import { Cell, CellDigit } from '../../board/board-model';

/** Frame 0: the hypothesis, a candidate supposed placed. */
export interface HypothesisFrame {
  kind: 'hypothesis';
  placement: CellDigit;
  /** Candidates it eliminates. */
  eliminations: CellDigit[];
}

/** Frames 1..n: forced placements, the steps of the chain. */
export interface ForcedFrame {
  kind: 'forced';
  placement: CellDigit;
  /** Candidates it eliminates. */
  eliminations: CellDigit[];
  /** Index of the frame whose placement forces this one. */
  causeStep: number;
  reason: ForcedReason;
}

/** Why a placement is forced: the only candidate of its cell, or the only place of its digit in a unit. */
export type ForcedReason = { kind: 'naked-single' } | { kind: 'hidden-single'; unit: Unit };

/** A row, column or box. */
export interface Unit {
  kind: 'row' | 'column' | 'box';
  /** 0..8; boxes numbered row by row. */
  index: number;
}

/** Last frame: the contradiction, the cells left without candidates. */
export interface ContradictionFrame {
  kind: 'contradiction';
  cells: Cell[];
}

/** One moment of the solution chain: the hypothesis, the forced placements, then the contradiction. */
export type Frame = HypothesisFrame | ForcedFrame | ContradictionFrame;

/** A solution shown on the board, and how much of it is drawn. */
export interface ShownSolution {
  frames: Frame[];
  /**
   * Drawn up to this step (frame index; 0 = hypothesis only). To draw everything, pass the last
   * step (`lastStep(frames)`). Grey cells stay those of the whole solution.
   */
  shownStep: number;
}
