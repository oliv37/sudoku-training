/**
 * What the board draws, except the arrows: positions in SVG user units, ready for the
 * templates. Computed by `boardSceneOf` (board-scene.ts).
 */
import { Rect } from './board-coordinates-model';

/** One line of the grid: thin between cells, thick between boxes and around the grid. */
export interface GridLineShape {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thick: boolean;
}

/** A placed digit (large digit of a filled cell), centred in its cell. */
export interface DigitShape {
  key: string;
  x: number;
  y: number;
  digit: number;
}

/**
 * A candidate (small digit of an empty cell), at its place in the 3 × 3 layout of the cell, with
 * its marks (null when it has none).
 */
export interface CandidateShape {
  key: string;
  /** Centre of the candidate. */
  x: number;
  y: number;
  /** Baseline of the text, below the centre so the digit looks centred. */
  textY: number;
  digit: number;
  /** Drawn in grey, with its underline and strike (the strike also thinner). */
  greyed: boolean;
  underlined: boolean;
  /** Where the underline goes, under the digit (drawn only when `underlined`). */
  underline: { x1: number; y1: number; x2: number; y2: number };
  frame: CandidateFrameShape | null;
  strike: CandidateStrikeShape | null;
  circle: CandidateCircleShape | null;
}

/** Square around a framed candidate, with a light background. */
export interface CandidateFrameShape {
  /** Not drawn (`display="none"`), but kept in place. */
  hidden: boolean;
  x: number;
  y: number;
  size: number;
  color: string;
  background: string;
}

/** Diagonal line across a struck candidate. */
export interface CandidateStrikeShape {
  /** Not drawn (`display="none"`), but kept in place. */
  hidden: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

/** Circle around a circled candidate, centred on it. */
export interface CandidateCircleShape {
  /** Not drawn (`display="none"`), but kept in place. */
  hidden: boolean;
  color: string;
  bold: boolean;
}

/** A colored cell or unit: its background, then its outline. */
export interface ZoneShape {
  key: string;
  fill: Rect;
  background: ZoneBackground;
  /** Drawn inside the zone, so the grid lines do not cover it. */
  outline: Rect;
  outlineColor: string;
  outlineWidth: number;
  /** `stroke-dasharray` of a dashed outline; null for a solid one. */
  outlineDashes: string | null;
}

/** Background of a zone: a light color, or the hatch pattern defined by the board. */
export type ZoneBackground = { kind: 'color'; color: string } | { kind: 'hatch' };

/** Everything the board layers draw, except the arrows (`ArrowsScene`). */
export interface BoardScene {
  lines: GridLineShape[];
  digits: DigitShape[];
  candidates: CandidateShape[];
  zones: ZoneShape[];
}

/*
 * Intermediate types, used while building the scene (not drawn directly).
 */

/** How a zone outline is drawn: this far inside the zone, this thick, dashed or not. */
export interface ZoneOutlineStyle {
  inset: number;
  width: number;
  /** `stroke-dasharray`; null for a solid outline. */
  dashes: string | null;
}
