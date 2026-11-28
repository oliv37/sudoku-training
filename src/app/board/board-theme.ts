/**
 * Colors of the SVG board. The board does not use the Tailwind tokens: its colors come from the
 * "Ciel" theme of the reference renderer (THEMES.sky in docs/sudoku-training-modele.html).
 */
import { BackgroundTone, Tone } from './board-model';

export const THEME = {
  thinLine: '#2b2d30',
  thickLine: '#123a66',
  candidate: '#1d3557',
  /** Greyed candidates, with their underline and strike. */
  greyedCandidate: '#a3b4c8',
  /** Large digits of the filled cells. */
  digit: '#0f2a4a',
  underline: '#111111',
  /** Background of the whole grid. */
  background: '#ffffff',
  /** Label inside the colored badges of the arrows. */
  badgeText: '#ffffff',
} as const;

/**
 * Color of each named tone of a `BoardDrawing`: the green and red of the reference renderer, then
 * its branch colors (THEMES.sky.branches).
 */
export const TONE_COLORS: Record<Tone, string> = {
  green: '#15924f',
  red: '#e0342a',
  blue: '#1f6fd6',
  violet: '#9b3fd4',
  orange: '#e07800',
  teal: '#0f9aa0',
};

/** Color of a named tone of a `BoardDrawing`. */
export function toneColor(tone: Tone): string {
  return TONE_COLORS[tone];
}

/** Light background color of the tones that have one, under a framed candidate for instance. */
export const TONE_BACKGROUNDS: Record<BackgroundTone, string> = {
  green: '#d2f2df',
  red: '#fbd8d3',
};
