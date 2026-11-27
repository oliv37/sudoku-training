import gridFile from '../../../../../public/data/exercices-2026-11-14.json';
import { BoardData, CellDigit, RedZone } from '../../board-model';
import { Frame } from '../board-solution-model';
import { emptyBoard } from '../../board-test-data';
import { Point } from '../../geometry/board-coordinates-model';
import { obstaclesOf, placeArrow } from './board-solution-arrows';
import { Arrow, Obstacle } from './board-solution-arrows-model';
import { solutionSceneOf } from './board-solution-scene';

/**
 * The fields of a question of the grid file that the board needs (format in docs/SPEC.md). Read
 * here without the exercise types, since the board knows nothing about exercises.
 */
interface ReferenceQuestion extends BoardData {
  coup: number;
  frames: Frame[];
  arrivee: { type: RedZone['type']; cases: RedZone['cases']; chiffre: number | null };
}

// TypeScript infers a literal type from the JSON content (each question its own `cands` keys),
// which does not match `ReferenceQuestion` directly.
const referenceQuestions = (gridFile as unknown as { exos: ReferenceQuestion[] }).exos;

/** Solution scene of a question of the grid file, with its red zone. */
function solutionSceneOfQuestion(question: ReferenceQuestion) {
  const { type, cases, chiffre } = question.arrivee;
  return solutionSceneOf(question, question.frames, { type, cases, digit: chiffre });
}

/** Start, control point and end of the curve, read from its SVG path ("M x y Q x y x y"). */
function curveOf(path: string): { start: Point; control: Point; end: Point } {
  const numbers = path.replace(/[MQ]/g, ' ').trim().split(/\s+/).map(Number);
  return {
    start: [numbers[0], numbers[1]],
    control: [numbers[2], numbers[3]],
    end: [numbers[4], numbers[5]],
  };
}

describe('board solution arrows', () => {
  // A long horizontal arrow on row 5: from the 5 of R5C2 (centre [144, 432]) to the 5 of R5C7
  // (centre [624, 432]), 480 units apart.
  const from: CellDigit = [4, 1, 5];
  const to: CellDigit = [4, 6, 5];

  describe('obstacles', () => {
    it('are the placed digits, then the circled candidates, then the struck candidates', () => {
      const board = emptyBoard();
      board.vals[0] = 9;
      const obstacles = obstaclesOf(board, [[1, 1, 5]], [[2, 2, 1]]);
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

    it('starts 17 from the centre of the cause circle and stops 27 before the forced one', () => {
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

  describe('same arrows as the reference renderer', () => {
    // Snapshot of every arrow and badge of the 20 questions of the 2026-11-14 grid, taken from
    // code checked against `renderCard` (the scene snapshot taken before the refactor). Never
    // update it to make a test pass: if it differs, the routing changed.
    it.each(referenceQuestions.map((question) => [question.coup, question] as const))(
      'places the arrows of question %i as before',
      (_questionNumber, question) => {
        const scene = solutionSceneOfQuestion(question);
        expect({ arrows: scene.arrows, badges: scene.badges }).toMatchSnapshot();
      },
    );

    // Exact output for question 1 of the 2026-11-14 grid, identical to `renderCard` (checked
    // against the snapshot taken before the refactor). If this test fails, the routing changed.
    it('places the two arrows of question 1 exactly', () => {
      const scene = solutionSceneOfQuestion(referenceQuestions[0]);

      expect(scene.arrows.map(({ path, head }) => ({ path, head }))).toEqual([
        {
          path: 'M554.8445274471608 160.96068640060406 Q608.1872156002389 348.99751508731566 529.8351622898034 528.0624392460994',
          head: 'M525.4256284765836 538.139939509065 L523.8802757707783 525.4568056291968 L535.7900488088285 530.6680728630021 Z',
        },
        {
          path: 'M544.8734014774932 552.929173455035 Q634.1172348595609 550.9090666308721 721.2010682416285 531.2889598067093',
          head: 'M731.9320825320067 528.8712476030548 L722.6297163619697 537.6300137055691 L719.7724201212873 524.9479059078494 Z',
        },
      ]);
      expect(scene.badges.map(({ x, y }) => [x, y])).toEqual([
        [575.2635302343605, 346.7545389553337],
        [633.5772348595608, 546.5090666308721],
      ]);
    });
  });
});

/** `placeArrow` for two different candidates, which always gives an arrow. */
function arrowBetween(from: CellDigit, to: CellDigit, obstacles: Obstacle[]): Arrow {
  const arrow = placeArrow(from, to, obstacles);
  if (arrow === null) {
    throw new Error('Expected an arrow between two different candidates');
  }
  return arrow;
}
