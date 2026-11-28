import { CellDigit } from '../../board-model';
import { Point } from '../../geometry/board-coordinates-model';
import { obstaclesOf, placeArrow } from './board-arrows-routing';
import { RoutedArrow, Obstacle } from './board-arrows-routing-model';

/** Start, control point and end of the curve, read from its SVG path ("M x y Q x y x y"). */
function curveOf(path: string): { start: Point; control: Point; end: Point } {
  const numbers = path.replace(/[MQ]/g, ' ').trim().split(/\s+/).map(Number);
  return {
    start: [numbers[0], numbers[1]],
    control: [numbers[2], numbers[3]],
    end: [numbers[4], numbers[5]],
  };
}

describe('board arrows routing', () => {
  // A long horizontal arrow on row 5: from the 5 of R5C2 (centre [144, 432]) to the 5 of R5C7
  // (centre [624, 432]), 480 units apart.
  const from: CellDigit = [4, 1, 5];
  const to: CellDigit = [4, 6, 5];

  describe('obstacles', () => {
    it('are the placed digits, then the circled candidates, then the struck candidates', () => {
      const obstacles = obstaclesOf([[0, 0]], [[1, 1, 5]], [[2, 2, 1]]);
      expect(obstacles).toEqual([
        { x: 48, y: 48, radius: 32, weight: 1 },
        { x: 144, y: 144, radius: 27, weight: 3 },
        { x: 212, y: 213, radius: 17, weight: 1 },
      ]);
    });
  });

  describe('placeArrow', () => {
    it('places no arrow between a candidate and itself', () => {
      expect(placeArrow([4, 1, 5], [4, 1, 5], [])).toBeNull();
    });

    it('starts 17 from the centre of the start candidate and stops 27 before the end one', () => {
      const arrow = arrowBetween(from, to, []);
      const { start, end } = curveOf(arrow.path);
      expect(start).toEqual([161, 432]);
      expect(end).toEqual([597, 432]);
    });

    it('takes the gentlest bend when nothing is in the way', () => {
      const arrow = arrowBetween(from, to, []);
      const { control } = curveOf(arrow.path);
      // The smallest bend tried is 4 % of the length (480), on the first side tried.
      expect(control[0]).toBeCloseTo(379);
      expect(control[1] - 432).toBeCloseTo(0.04 * 480);
    });

    it('bends to the other side when an obstacle sits on the first side', () => {
      const obstacles: Obstacle[] = [{ x: 379, y: 447, radius: 40, weight: 10 }];
      const arrow = arrowBetween(from, to, obstacles);
      const { control } = curveOf(arrow.path);
      expect(control[1]).toBeLessThan(432);
    });

    it('puts the badge in the middle of a long arrow', () => {
      const arrow = arrowBetween(from, to, []);
      const { start, control, end } = curveOf(arrow.path);
      const middleY = 0.25 * start[1] + 0.5 * control[1] + 0.25 * end[1];
      expect(arrow.badge[0]).toBeCloseTo(379);
      expect(arrow.badge[1]).toBeCloseTo(middleY);
    });

    it('puts the badge beside a short arrow, 19 from the middle of the curve, so it does not hide it', () => {
      // From R5C2 to R5C3: 96 units apart.
      const arrow = arrowBetween([4, 1, 5], [4, 2, 5], []);
      const { start, control, end } = curveOf(arrow.path);
      const middleY = 0.25 * start[1] + 0.5 * control[1] + 0.25 * end[1];
      expect(Math.abs(arrow.badge[1] - middleY)).toBeCloseTo(19);
    });

    it('adds the badge and points along the curve to the obstacles, for the next arrows', () => {
      const obstacles: Obstacle[] = [];
      const arrow = arrowBetween(from, to, obstacles);
      const [badgeObstacle, ...curveObstacles] = obstacles;
      expect(badgeObstacle).toEqual({
        x: arrow.badge[0],
        y: arrow.badge[1],
        radius: 28,
        weight: 4,
      });
      expect(curveObstacles.length).toBe(8);
      expect(curveObstacles.every((obstacle) => obstacle.radius === 14)).toBe(true);
    });
  });
});

/** `placeArrow` for two different candidates, which always gives an arrow. */
function arrowBetween(from: CellDigit, to: CellDigit, obstacles: Obstacle[]): RoutedArrow {
  const arrow = placeArrow(from, to, obstacles);
  if (arrow === null) {
    throw new Error('Expected an arrow between two different candidates');
  }
  return arrow;
}
