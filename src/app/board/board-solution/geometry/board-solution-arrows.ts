/**
 * Arrows of the solution diagram. Each arrow goes from the circle of a placement to the circle of
 * the placement it forces, as a quadratic curve that avoids what is already drawn: placed digits,
 * circles, struck candidates, and the arrows and badges placed before it.
 *
 * Port of the arrow routing of `renderCard` (docs/sudoku-training-modele.html): same constants and
 * same operations in the same order, so the curves come out exactly the same.
 */
import { BoardData, CellDigit } from '../../board-model';
import { cellValueOf } from '../../board-cells';
import { GRID_SIZE, candidateCenter, cellCenter } from '../../geometry/board-coordinates';
import { Point } from '../../geometry/board-coordinates-model';
import { Arrow, Curve, Obstacle } from './board-solution-arrows-model';

/** Size and weight of each kind of obstacle. */
const PLACED_DIGIT_OBSTACLE = { radius: 32, weight: 1 };
const CIRCLE_OBSTACLE = { radius: 27, weight: 3 };
const STRUCK_CANDIDATE_OBSTACLE = { radius: 17, weight: 1 };
const BADGE_OBSTACLE = { radius: 28, weight: 4 };
const CURVE_OBSTACLE = { radius: 14, weight: 1.2 };

/** The curve starts this far from the centre of the cause circle, outside the circle… */
const START_GAP = 17;
/** …and stops this far from the centre of the forced circle, leaving room for the head. */
const END_GAP = 27;

/**
 * Bends tried, as a share of the arrow length, on both sides of the straight line. Tried in this
 * order: when two bends are equally good, the first one wins.
 */
const BEND_RATIOS = [0.12, -0.12, 0.24, -0.24, 0.04, -0.04, 0.36, -0.36];
/** Cost of bending, per unit of ratio: straighter arrows are preferred. */
const BEND_COST = 1.5;
/** Cost of a curve whose middle leaves the grid (closer than the margin to its edge). */
const OUT_OF_GRID_COST = 5;
const GRID_EDGE_MARGIN = 6;

/** Places tried for the badge along the curve (0 = start, 1 = end), from the middle outwards. */
const BADGE_POSITIONS = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74];
/** Cost of moving the badge away from the middle of the curve. */
const BADGE_OFF_CENTER_COST = 0.6;
/** On an arrow shorter than this, the badge goes beside the curve, so it does not hide it. */
const SHORT_ARROW_LENGTH = 130;
const BADGE_SIDE_SHIFT = 19;

/** Arrow head: a triangle this long, and this wide on each side of the curve. */
const HEAD_LENGTH = 11;
const HEAD_HALF_WIDTH = 6.5;

/** What the arrows must avoid before any arrow is drawn. */
export function obstaclesOf(
  board: BoardData,
  circledCandidates: CellDigit[],
  struckCandidates: CellDigit[],
): Obstacle[] {
  const obstacles: Obstacle[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (cellValueOf(board, [r, c]) !== 0) {
        const [x, y] = cellCenter([r, c]);
        obstacles.push({ x, y, ...PLACED_DIGIT_OBSTACLE });
      }
    }
  }
  for (const candidate of circledCandidates) {
    const [x, y] = candidateCenter(candidate);
    obstacles.push({ x, y, ...CIRCLE_OBSTACLE });
  }
  for (const candidate of struckCandidates) {
    const [x, y] = candidateCenter(candidate);
    obstacles.push({ x, y, ...STRUCK_CANDIDATE_OBSTACLE });
  }
  return obstacles;
}

/**
 * Curved arrow from candidate `from` to candidate `to`, avoiding the obstacles; null when both are
 * the same candidate. Adds the arrow and its badge to `obstacles`, so later arrows avoid them.
 */
export function placeArrow(from: CellDigit, to: CellDigit, obstacles: Obstacle[]): Arrow | null {
  const [fromX, fromY] = candidateCenter(from);
  const [toX, toY] = candidateCenter(to);
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  const length = Math.hypot(deltaX, deltaY);
  if (length < 1) {
    return null;
  }
  // Unit vector from `from` to `to`.
  const direction: Point = [deltaX / length, deltaY / length];
  const [directionX, directionY] = direction;
  const start: Point = [fromX + directionX * START_GAP, fromY + directionY * START_GAP];
  const end: Point = [toX - directionX * END_GAP, toY - directionY * END_GAP];

  const control = leastObstructedControlPoint(start, end, length, direction, obstacles);
  const curve: Curve = { start, control, end };
  const badge = leastObstructedBadgePosition(curve, length, direction, obstacles);
  addArrowToObstacles(curve, badge, obstacles);
  return { path: curvePath(curve), head: arrowHead(curve), badge };
}

/** Tries every bend of `BEND_RATIOS` and keeps the one whose curve is the least obstructed. */
function leastObstructedControlPoint(
  start: Point,
  end: Point,
  length: number,
  direction: Point,
  obstacles: Obstacle[],
): Point {
  let bestControl: Point = [0, 0];
  let bestScore = Infinity;
  for (const ratio of BEND_RATIOS) {
    const control = controlPointOf(start, end, bendOffset(ratio, length), direction);
    const score = bendScore(ratio, { start, control, end }, obstacles);
    if (score < bestScore) {
      bestScore = score;
      bestControl = control;
    }
  }
  return bestControl;
}

/**
 * Distance of the control point from the straight line, signed (the side of the bend): a share of
 * the arrow length, capped, with a higher cap for stronger bends.
 */
function bendOffset(ratio: number, length: number): number {
  const strength = Math.abs(ratio);
  return Math.sign(ratio) * Math.min(strength * length, maxBendOffset(strength));
}

function maxBendOffset(strength: number): number {
  if (strength > 0.3) {
    return 96;
  }
  if (strength > 0.2) {
    return 66;
  }
  return 38;
}

/** Control point: the middle of the straight line, moved sideways by `offset`. */
function controlPointOf(
  start: Point,
  end: Point,
  offset: number,
  [directionX, directionY]: Point,
): Point {
  return [
    (start[0] + end[0]) / 2 - directionY * offset,
    (start[1] + end[1]) / 2 + directionX * offset,
  ];
}

/** Lower is better: how much the bend costs, plus how obstructed the curve is along its length. */
function bendScore(ratio: number, curve: Curve, obstacles: Obstacle[]): number {
  let score = Math.abs(ratio) * BEND_COST;
  for (let t = 0.12; t < 0.9; t += 0.08) {
    score += obstructionAt(pointOnCurve(curve, t), obstacles);
  }
  if (middleLeavesGrid(curve)) {
    score += OUT_OF_GRID_COST;
  }
  return score;
}

function middleLeavesGrid(curve: Curve): boolean {
  const [x, y] = pointOnCurve(curve, 0.5);
  const min = GRID_EDGE_MARGIN;
  const max = GRID_SIZE - GRID_EDGE_MARGIN;
  return x < min || x > max || y < min || y > max;
}

/** The badge goes near the middle of the curve, where it is the least obstructed. */
function leastObstructedBadgePosition(
  curve: Curve,
  length: number,
  [directionX, directionY]: Point,
  obstacles: Obstacle[],
): Point {
  const sideShifts = length < SHORT_ARROW_LENGTH ? [BADGE_SIDE_SHIFT, -BADGE_SIDE_SHIFT] : [0];
  let bestPosition: Point = [0, 0];
  let bestScore = Infinity;
  for (const t of BADGE_POSITIONS) {
    for (const shift of sideShifts) {
      const [x, y] = pointOnCurve(curve, t);
      const position: Point = [x - directionY * shift, y + directionX * shift];
      const offCenterCost = Math.abs(t - 0.5) * BADGE_OFF_CENTER_COST;
      const score = obstructionAt(position, obstacles) + offCenterCost;
      if (score < bestScore) {
        bestScore = score;
        bestPosition = position;
      }
    }
  }
  return bestPosition;
}

/** The badge and points along the curve become obstacles for the next arrows. */
function addArrowToObstacles(curve: Curve, badge: Point, obstacles: Obstacle[]): void {
  obstacles.push({ x: badge[0], y: badge[1], ...BADGE_OBSTACLE });
  for (let t = 0.15; t < 0.9; t += 0.1) {
    const [x, y] = pointOnCurve(curve, t);
    obstacles.push({ x, y, ...CURVE_OBSTACLE });
  }
}

/**
 * How much a point is in the way: for each obstacle it sits in, the obstacle's weight, scaled by
 * how deep the point is (full weight at the centre, nothing at the edge).
 */
function obstructionAt([x, y]: Point, obstacles: Obstacle[]): number {
  let total = 0;
  for (const obstacle of obstacles) {
    const distance = Math.hypot(x - obstacle.x, y - obstacle.y);
    if (distance < obstacle.radius) {
      total += obstacle.weight * (1 - distance / obstacle.radius);
    }
  }
  return total;
}

/** Point of the curve at `t` (0 = start, 1 = end). */
function pointOnCurve({ start, control, end }: Curve, t: number): Point {
  const u = 1 - t;
  return [
    u * u * start[0] + 2 * u * t * control[0] + t * t * end[0],
    u * u * start[1] + 2 * u * t * control[1] + t * t * end[1],
  ];
}

/** SVG path of the curve. */
function curvePath({ start, control, end }: Curve): string {
  return `M${start[0]} ${start[1]} Q${control[0]} ${control[1]} ${end[0]} ${end[1]}`;
}

/** SVG path of the head: a triangle at the end of the curve, pointing along it. */
function arrowHead({ control, end }: Curve): string {
  const tangentX = end[0] - control[0];
  const tangentY = end[1] - control[1];
  // `|| 1` avoids a division by zero when the control point is on the end.
  const tangentLength = Math.hypot(tangentX, tangentY) || 1;
  const alongX = tangentX / tangentLength;
  const alongY = tangentY / tangentLength;
  const tip: Point = [end[0] + alongX * HEAD_LENGTH, end[1] + alongY * HEAD_LENGTH];
  const left: Point = [end[0] - alongY * HEAD_HALF_WIDTH, end[1] + alongX * HEAD_HALF_WIDTH];
  const right: Point = [end[0] + alongY * HEAD_HALF_WIDTH, end[1] - alongX * HEAD_HALF_WIDTH];
  return `M${tip[0]} ${tip[1]} L${left[0]} ${left[1]} L${right[0]} ${right[1]} Z`;
}
