/** Cell coordinates, 0..8: [row, column]. */
export type Cell = [number, number];
/** A digit in a cell: [row, column, digit]. */
export type CellDigit = [number, number, number];

/*
 * What the board draws, in sudoku terms: cells and digits, no SVG positions (those are computed
 * by the board). Callers build a `BoardDrawing` from their own data; the board knows nothing
 * about what the marks mean, nor why some are hidden.
 */

/** Named colors of the board: each has its color in `TONE_COLORS` (board-theme.ts). */
export type Tone = 'green' | 'red' | 'blue' | 'violet' | 'orange' | 'teal';

/** Tones that also have a light background color (`TONE_BACKGROUNDS` in board-theme.ts). */
export type BackgroundTone = 'green' | 'red';

/** Everything the board draws. */
export interface BoardDrawing {
  /** Large digits of the filled cells. */
  digits: DrawnDigit[];
  /** Small digits of the empty cells, with their marks. */
  candidates: DrawnCandidate[];
  /** Colored cells or units, drawn under the digits, in list order. */
  zones: DrawnZone[];
  /**
   * Arrows from a candidate to another, placed in list order: each arrow avoids the digits, the
   * marks and the arrows placed before it (hidden ones included), so the order changes how they
   * bend.
   */
  arrows: DrawnArrow[];
}

/** A large digit, placed in its cell. */
export interface DrawnDigit {
  cell: Cell;
  digit: number;
}

/** A small digit of an empty cell, with its marks. */
export interface DrawnCandidate {
  candidate: CellDigit;
  underlined?: boolean;
  /** Drawn in grey, with its marks (e.g. a cell that does not matter right now). */
  greyed?: boolean;
  struck?: CandidateStrike;
  /** A circled candidate is never drawn struck, even when it has a strike. */
  circled?: CandidateCircle;
  framed?: CandidateFrame;
}

/** Diagonal line across the candidate (grey and thinner on a greyed candidate). */
export interface CandidateStrike {
  tone: Tone;
  /**
   * Kept in place but not drawn. It still counts as an obstacle for the arrows, so nothing moves
   * when it is shown.
   */
  hidden?: boolean;
}

/** Circle around the candidate. */
export interface CandidateCircle {
  tone: Tone;
  /** Thicker line. */
  bold?: boolean;
  /**
   * Kept in place but not drawn. It still counts as an obstacle for the arrows, so nothing moves
   * when it is shown.
   */
  hidden?: boolean;
}

/** Square around the candidate, with a light background. */
export interface CandidateFrame {
  tone: BackgroundTone;
  /**
   * Kept in place but not drawn. It still counts as an obstacle for the arrows, so nothing moves
   * when it is shown.
   */
  hidden?: boolean;
}

/** Background and outline of a single cell or a whole unit (the rectangle around its cells). */
export interface DrawnZone {
  cells: Cell[];
  fill: ZoneFill;
  /** In the color of the fill: solid, or dashed (lighter, for a whole unit). */
  outline: ZoneOutline;
}

export type ZoneFill = 'green' | 'red-hatched';

export type ZoneOutline = 'solid' | 'dashed';

/** Curved arrow from a candidate to another. */
export interface DrawnArrow {
  from: CellDigit;
  to: CellDigit;
  tone: Tone;
  /** Text of the round badge on the arrow (e.g. a number); no badge without one. */
  label?: string;
  /**
   * Kept in place but not drawn. It still counts as an obstacle for the arrows, so nothing moves
   * when it is shown.
   */
  hidden?: boolean;
}
