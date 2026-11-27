/**
 * Builds the scene of the solution diagram (circles, struck candidates, arrows, badges): port of
 * the `sol` part of `renderCard` in docs/sudoku-training-modele.html. The arrows are placed in
 * board-solution-arrows.ts.
 */
import { BoardData, CellDigit, RedZone } from '../../board-model';
import { candidateKey, cellKey } from '../../board-cells';
import { Frame } from '../board-solution-model';
import { THEME, branchColor } from '../../board-theme';
import { branchesOf, lastStep, involvedCellsOf } from '../board-solution';
import { obstaclesOf, placeArrow } from './board-solution-arrows';
import { candidateCenter } from '../../geometry/board-coordinates';
import {
  CircledCandidate,
  LastCandidate,
  SolutionArrow,
  SolutionCircle,
  SolutionScene,
  StepBadge,
  StrikeLine,
  StruckCandidate,
} from './board-solution-scene-model';

/** The strike line is a diagonal across the candidate, this far from its centre on each side. */
const STRIKE_HALF_LENGTH = 9;
/** Side of the red square around a last candidate of the red zone. */
const LAST_CANDIDATE_SQUARE_SIZE = 28;
/** `y` of a step number is the baseline of its text: this far below the centre of the badge. */
const BADGE_BASELINE_OFFSET = 6;

/**
 * Everything needed to draw the solution diagram on top of the board. `redZone`: the red zone of
 * the question, whose last candidates are framed; null when there is none.
 */
export function solutionSceneOf(
  board: BoardData,
  frames: Frame[],
  redZone: RedZone | null,
): SolutionScene {
  const involvedCells = involvedCellsOf(board, frames, redZone?.cases ?? []);
  const circled = circledCandidatesOf(frames);
  const struck = struckCandidatesOf(frames);
  const { arrows, badges } = arrowsAndBadgesOf(board, frames, circled, struck);
  return {
    involvedCells,
    strikes: strikeLinesOf(struck, circled, involvedCells),
    lastCandidates: lastCandidatesOf(struck, circled, redZone, lastStep(frames)),
    circles: circlesOf(circled),
    arrows,
    badges,
  };
}

/**
 * The scene limited to the hypothesis and steps 1..`step`.
 * Positions are those of the full diagram, so nothing moves while steps appear.
 */
export function solutionSceneUpTo(scene: SolutionScene, step: number): SolutionScene {
  return {
    involvedCells: scene.involvedCells,
    strikes: itemsUpToStep(scene.strikes, step),
    lastCandidates: itemsUpToStep(scene.lastCandidates, step),
    circles: itemsUpToStep(scene.circles, step),
    arrows: itemsUpToStep(scene.arrows, step),
    badges: itemsUpToStep(scene.badges, step),
  };
}

function itemsUpToStep<Item extends { frame: number }>(items: Item[], step: number): Item[] {
  return items.filter((item) => item.frame <= step);
}

/** Candidates placed by the chain, keyed by `candidateKey`. */
function circledCandidatesOf(frames: Frame[]): Map<string, CircledCandidate> {
  const branches = branchesOf(frames);
  const circled = new Map<string, CircledCandidate>();
  frames.forEach((frame, index) => {
    if (frame.kind === 'bad') {
      return;
    }
    const isHypothesis = frame.kind === 'hyp';
    const color = isHypothesis ? THEME.hyp : branchColor(branches[index]);
    circled.set(candidateKey(frame.circle), {
      candidate: frame.circle,
      frame: index,
      isHypothesis,
      color,
    });
  });
  return circled;
}

/** Candidates eliminated by the chain, keyed by `candidateKey`, each at the first step that strikes it. */
function struckCandidatesOf(frames: Frame[]): Map<string, StruckCandidate> {
  const struck = new Map<string, StruckCandidate>();
  frames.forEach((frame, index) => {
    if (frame.kind === 'bad') {
      return;
    }
    for (const candidate of frame.strikes) {
      const key = candidateKey(candidate);
      if (!struck.has(key)) {
        struck.set(key, { candidate, frame: index });
      }
    }
  });
  return struck;
}

/** One diagonal line per struck candidate, greyed in the cells not involved in the solution. */
function strikeLinesOf(
  struck: Map<string, StruckCandidate>,
  circled: Map<string, CircledCandidate>,
  involvedCells: Set<string>,
): StrikeLine[] {
  const lines: StrikeLine[] = [];
  for (const [key, { candidate, frame }] of struck) {
    // As in the reference renderer, a circled candidate is never struck.
    if (circled.has(key)) {
      continue;
    }
    const [r, c] = candidate;
    const [x, y] = candidateCenter(candidate);
    lines.push({
      key,
      frame,
      x1: x - STRIKE_HALF_LENGTH,
      y1: y + STRIKE_HALF_LENGTH,
      x2: x + STRIKE_HALF_LENGTH,
      y2: y - STRIKE_HALF_LENGTH,
      greyed: !involvedCells.has(cellKey(r, c)),
    });
  }
  return lines;
}

/**
 * The last candidates of the red zone, struck by the chain: the contradiction itself, framed by a
 * red square and shown with the last step only.
 */
function lastCandidatesOf(
  struck: Map<string, StruckCandidate>,
  circled: Map<string, CircledCandidate>,
  redZone: RedZone | null,
  lastStepNumber: number,
): LastCandidate[] {
  const lastCandidates: LastCandidate[] = [];
  for (const [key, { candidate }] of struck) {
    if (circled.has(key) || !isLastCandidateOfRedZone(candidate, redZone)) {
      continue;
    }
    const [x, y] = candidateCenter(candidate);
    const halfSize = LAST_CANDIDATE_SQUARE_SIZE / 2;
    lastCandidates.push({
      key,
      frame: lastStepNumber,
      square: { x: x - halfSize, y: y - halfSize, size: LAST_CANDIDATE_SQUARE_SIZE },
    });
  }
  return lastCandidates;
}

/** Whether a candidate is one of those that disappear from the red zone. */
function isLastCandidateOfRedZone([r, c, digit]: CellDigit, redZone: RedZone | null): boolean {
  if (redZone === null) {
    return false;
  }
  const isInRedZone = redZone.cases.some(
    ([zoneRow, zoneColumn]) => zoneRow === r && zoneColumn === c,
  );
  if (!isInRedZone) {
    return false;
  }
  // A single cell loses all its candidates; a unit loses one digit.
  if (redZone.type === 'cell') {
    return true;
  }
  return digit === redZone.digit;
}

function circlesOf(circled: Map<string, CircledCandidate>): SolutionCircle[] {
  const circles: SolutionCircle[] = [];
  for (const [key, { candidate, frame, isHypothesis, color }] of circled) {
    const [x, y] = candidateCenter(candidate);
    circles.push({ key, frame, x, y, isHypothesis, color });
  }
  return circles;
}

/**
 * One arrow per forced placement, from the placement that causes it, with its numbered badge.
 * Arrows avoid what is already drawn; each arrow placed becomes an obstacle for the next ones.
 */
function arrowsAndBadgesOf(
  board: BoardData,
  frames: Frame[],
  circled: Map<string, CircledCandidate>,
  struck: Map<string, StruckCandidate>,
): { arrows: SolutionArrow[]; badges: StepBadge[] } {
  const circledCandidates = [...circled.values()].map(({ candidate }) => candidate);
  const struckCandidates = [...struck.values()].map(({ candidate }) => candidate);
  const obstacles = obstaclesOf(board, circledCandidates, struckCandidates);
  const branches = branchesOf(frames);
  const arrows: SolutionArrow[] = [];
  const badges: StepBadge[] = [];
  frames.forEach((frame, index) => {
    if (frame.kind !== 'dom') {
      return;
    }
    const cause = frames[frame.cause];
    if (cause === undefined || cause.kind === 'bad') {
      return;
    }
    const arrow = placeArrow(cause.circle, frame.circle, obstacles);
    if (arrow === null) {
      return;
    }
    const color = branchColor(branches[index]);
    const [badgeX, badgeY] = arrow.badge;
    arrows.push({ key: `a${index}`, frame: index, path: arrow.path, head: arrow.head, color });
    badges.push({
      key: `b${index}`,
      frame: index,
      x: badgeX,
      y: badgeY,
      textY: badgeY + BADGE_BASELINE_OFFSET,
      step: index,
      color,
    });
  });
  return { arrows, badges };
}
