/**
 * What the board draws, except the solution diagram: positions in SVG user units, ready for the
 * templates. Computed by `boardSceneOf` (board-scene.ts).
 */
import { Rect } from './board-coordinates-model';

/** One line of the grid: thin between cells, thick between boxes and around the grid. */
export interface GridLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thick: boolean;
}

/** A placed digit (large digit of a filled cell), centred in its cell. */
export interface ValueText {
  key: string;
  x: number;
  y: number;
  value: number;
}

/** A candidate (small digit of an empty cell), at its place in the 3 × 3 layout of the cell. */
export interface CandidateText {
  key: string;
  /** Centre of the candidate. */
  x: number;
  y: number;
  /** Baseline of the text, below the centre so the digit looks centred. */
  textY: number;
  digit: number;
  /** Greyed out (cell not involved in the solution). Always false in the question. */
  greyed: boolean;
  underlined: boolean;
  /** Where the underline goes, under the digit (drawn only when `underlined`). */
  underline: { x1: number; y1: number; x2: number; y2: number };
}

/** Red zone of the question: a unit (row, column, box) or a single cell. */
export interface RedZoneShape {
  kind: 'unit' | 'cell';
  /** Hatched fill. */
  fill: Rect;
  /** Outline: dashed for a unit, plain for a cell. */
  outline: Rect;
}

/** Green start cell: background and outline. */
export interface StartCellShape {
  fill: Rect;
  outline: Rect;
}

/** Everything the board layers draw, except the solution diagram (see `SolutionScene`). */
export interface BoardScene {
  lines: GridLine[];
  values: ValueText[];
  candidates: CandidateText[];
  start: StartCellShape | null;
  redZone: RedZoneShape | null;
}
