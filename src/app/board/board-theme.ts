/**
 * Colors of the SVG board. The board does not use the Tailwind tokens: its colors come from the
 * "Ciel" theme of the reference renderer (THEMES.sky in docs/sudoku-training-modele.html).
 */

export const THEME = {
  thinLine: '#2b2d30',
  thickLine: '#123a66',
  candidate: '#1d3557',
  /** Candidates in the cells not involved in the solution. */
  greyedCandidate: '#a3b4c8',
  /** Placed digits: givens and digits placed by the previous questions. */
  placedDigit: '#0f2a4a',
  hyp: '#15924f',
  hypBg: '#d2f2df',
  bad: '#e0342a',
  badBg: '#fbd8d3',
  underline: '#111111',
  /** Background of the whole grid. */
  background: '#ffffff',
  /** Step number inside the colored badges of the solution. */
  badgeText: '#ffffff',
} as const;

/** One color per branch of the solution chain (THEMES.sky.branches); used in turn when there are more branches. */
export const BRANCH_COLORS = ['#1f6fd6', '#9b3fd4', '#e07800', '#0f9aa0'] as const;

/** Color of a branch of the solution chain (0 = first branch). */
export function branchColor(branch: number): string {
  return BRANCH_COLORS[branch % BRANCH_COLORS.length];
}
