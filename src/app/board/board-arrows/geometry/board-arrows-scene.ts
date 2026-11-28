/**
 * Builds the scene of the arrows of a drawing and of their badges. The arrows are routed in list
 * order (board-arrows-routing.ts): each one avoids the digits, the marks, and the arrows and badges
 * placed before it. Hidden marks and arrows are routed and avoided like the others, so nothing
 * moves when they are shown.
 */
import { BoardDrawing, Cell, CellDigit, DrawnCandidate, DrawnDigit } from '../../board-model';
import { toneColor } from '../../board-theme';
import { obstaclesOf, placeArrow } from './board-arrows-routing';
import { ArrowShape, ArrowsScene, BadgeShape } from './board-arrows-scene-model';

/** `y` of a badge label is the baseline of its text: this far below the centre of the badge. */
const BADGE_BASELINE_OFFSET = 6;

/** Each arrow and its badge (when it has a label); no arrow from a candidate to itself. */
export function arrowsSceneOf(drawing: BoardDrawing): ArrowsScene {
  const obstacles = obstaclesOf(
    digitCellsOf(drawing.digits),
    circledCandidatesOf(drawing.candidates),
    struckCandidatesOf(drawing.candidates),
  );
  const arrows: ArrowShape[] = [];
  const badges: BadgeShape[] = [];
  drawing.arrows.forEach(({ from, to, tone, label, hidden = false }, index) => {
    const arrow = placeArrow(from, to, obstacles);
    if (arrow === null) {
      return;
    }
    const color = toneColor(tone);
    arrows.push({ key: `arrow-${index}`, hidden, path: arrow.path, head: arrow.head, color });
    if (label === undefined) {
      return;
    }
    const [x, y] = arrow.badge;
    badges.push({
      key: `badge-${index}`,
      hidden,
      x,
      y,
      textY: y + BADGE_BASELINE_OFFSET,
      label,
      color,
    });
  });
  return { arrows, badges };
}

function digitCellsOf(digits: DrawnDigit[]): Cell[] {
  return digits.map(({ cell }) => cell);
}

function circledCandidatesOf(candidates: DrawnCandidate[]): CellDigit[] {
  return candidates
    .filter(({ circled }) => circled !== undefined)
    .map(({ candidate }) => candidate);
}

/** Every struck candidate, circled ones included: their strike is not drawn, but still in the way. */
function struckCandidatesOf(candidates: DrawnCandidate[]): CellDigit[] {
  return candidates.filter(({ struck }) => struck !== undefined).map(({ candidate }) => candidate);
}
