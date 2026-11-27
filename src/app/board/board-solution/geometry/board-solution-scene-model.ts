/**
 * What the solution diagram draws: positions in SVG user units, ready for the template.
 * Computed by `solutionSceneOf` (board-solution-scene.ts).
 */
import { CellDigit } from '../../board-model';

/** Line striking out a candidate eliminated by the chain. */
export interface StrikeLine {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Candidate in a cell not involved in the solution: thinner and greyed. */
  greyed: boolean;
}

/**
 * Last candidates of the red zone, wiped out by the chain (the contradiction itself):
 * struck like the others, and framed by a red square.
 */
export interface LastCandidate {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  /** Red square around the digit. */
  square: { x: number; y: number; size: number };
}

/** Circle around a candidate placed by the chain (the hypothesis or a forced placement). */
export interface SolutionCircle {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  /** Centre of the circle (the candidate). */
  x: number;
  y: number;
  /** Hypothesis (green, thicker) or forced placement (branch color). */
  isHypothesis: boolean;
  color: string;
}

/** Arrow from the placement that causes a forced placement to that placement. */
export interface SolutionArrow {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  /** Quadratic curve from the cause circle to the forced circle. */
  path: string;
  /** Triangle at the end of the curve. */
  head: string;
  color: string;
}

/** Numbered badge of a step, on its arrow. */
export interface StepBadge {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  /** Centre of the badge. */
  x: number;
  y: number;
  /** Baseline of the step number, below the centre so the number looks centred. */
  textY: number;
  step: number;
  color: string;
}

/**
 * Everything the solution diagram draws. Each element knows its step (`frame`), so the scene can be
 * limited to the steps shown (`solutionSceneUpTo`) without moving anything.
 */
export interface SolutionScene {
  /** Cells drawn normally; candidates of every other cell are greyed out. */
  involvedCells: Set<string>;
  strikes: StrikeLine[];
  lastCandidates: LastCandidate[];
  circles: SolutionCircle[];
  arrows: SolutionArrow[];
  badges: StepBadge[];
}

/*
 * Intermediate types, used while building the scene (not drawn directly).
 */

/** A candidate placed by the chain: the hypothesis or a forced placement. */
export interface CircledCandidate {
  candidate: CellDigit;
  /** Step that places it (frame index; 0 = hypothesis). */
  frame: number;
  isHypothesis: boolean;
  /** Green for the hypothesis, the color of its branch otherwise. */
  color: string;
}

/** A candidate eliminated by the chain. */
export interface StruckCandidate {
  candidate: CellDigit;
  /** First step that strikes it (frame index). */
  frame: number;
}
