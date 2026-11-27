import { RedZone } from '../../board-model';
import { contradiction, emptyBoard, forced, hypothesis, rowCells } from '../../board-test-data';
import { BRANCH_COLORS, THEME } from '../../board-theme';
import { Frame } from '../board-solution-model';
import { solutionSceneOf, solutionSceneUpTo } from './board-solution-scene';

/**
 * A small chain, two branches:
 * - step 0, hypothesis: 5 in R1C1; strikes 1 in R1C1, 5 in R1C2, R1C9 and R5C5;
 * - step 1, from the hypothesis: 3 in R1C2; strikes 7 in R1C2, 3 in R1C9;
 * - step 2, from the hypothesis: 7 in R2C1; strikes 7 in R1C9, 7 in R1C2 again, 5 in R1C1 (circled);
 * - then R1C9 has no candidate left.
 */
const frames: Frame[] = [
  hypothesis(
    [0, 0, 5],
    [
      [0, 0, 1],
      [0, 1, 5],
      [0, 8, 5],
      [4, 4, 5],
    ],
  ),
  forced([0, 1, 3], 0, [
    [0, 1, 7],
    [0, 8, 3],
  ]),
  forced([1, 0, 7], 0, [
    [0, 8, 7],
    [0, 1, 7],
    [0, 0, 5],
  ]),
  contradiction(),
];
const lastCell: RedZone = { type: 'cell', cases: [[0, 8]], digit: null };
const board = emptyBoard();

describe('board solution scene', () => {
  const scene = solutionSceneOf(board, frames, lastCell);

  describe('circles', () => {
    it('circle the hypothesis in green and each forced placement in the color of its branch', () => {
      expect(
        scene.circles.map(({ key, frame, isHypothesis, color }) => ({
          key,
          frame,
          isHypothesis,
          color,
        })),
      ).toEqual([
        { key: '0,0,5', frame: 0, isHypothesis: true, color: THEME.hyp },
        { key: '0,1,3', frame: 1, isHypothesis: false, color: BRANCH_COLORS[0] },
        { key: '1,0,7', frame: 2, isHypothesis: false, color: BRANCH_COLORS[1] },
      ]);
    });

    it('are centred on their candidate', () => {
      const [hypothesisCircle] = scene.circles;
      expect(hypothesisCircle).toMatchObject({ x: 48, y: 48 });
    });
  });

  describe('strikes', () => {
    it('strike each eliminated candidate once, at the first step that strikes it', () => {
      expect(scene.strikes.map(({ key, frame }) => ({ key, frame }))).toEqual([
        { key: '0,0,1', frame: 0 },
        { key: '0,1,5', frame: 0 },
        { key: '0,8,5', frame: 0 },
        { key: '4,4,5', frame: 0 },
        { key: '0,1,7', frame: 1 },
        { key: '0,8,3', frame: 1 },
        { key: '0,8,7', frame: 2 },
      ]);
    });

    it('never strike a circled candidate', () => {
      const keys = scene.strikes.map((strike) => strike.key);
      expect(keys).not.toContain('0,0,5');
    });

    it('draw a diagonal across the candidate, 9 from its centre on each side', () => {
      const [firstStrike] = scene.strikes;
      expect(firstStrike).toMatchObject({ x1: 11, y1: 30, x2: 29, y2: 12 });
    });

    it('are greyed in the cells not involved in the solution', () => {
      const greyedKeys = scene.strikes
        .filter((strike) => strike.greyed)
        .map((strike) => strike.key);
      expect(greyedKeys).toEqual(['4,4,5']);
    });
  });

  describe('involved cells', () => {
    it('are the red zone and the cells of the chain', () => {
      expect(scene.involvedCells).toEqual(new Set(['0,8', '0,0', '0,1', '1,0']));
    });
  });

  describe('last candidates of the red zone', () => {
    it('are, for a cell, all its struck candidates, shown with the last step', () => {
      expect(scene.lastCandidates.map(({ key, frame }) => ({ key, frame }))).toEqual([
        { key: '0,8,5', frame: 2 },
        { key: '0,8,3', frame: 2 },
        { key: '0,8,7', frame: 2 },
      ]);
    });

    it('are, for a unit, only the struck candidates of its digit', () => {
      const firstRowWithout3: RedZone = { type: 'unit', cases: rowCells(0), digit: 3 };
      const unitScene = solutionSceneOf(board, frames, firstRowWithout3);
      expect(unitScene.lastCandidates.map((lastCandidate) => lastCandidate.key)).toEqual(['0,8,3']);
    });

    it('are framed by a 28-unit square centred on the candidate', () => {
      const [first] = scene.lastCandidates;
      expect(first.square).toEqual({ x: 802, y: 34, size: 28 });
    });

    it('are none without a red zone', () => {
      expect(solutionSceneOf(board, frames, null).lastCandidates).toEqual([]);
    });
  });

  describe('arrows and badges', () => {
    it('go to each forced placement, numbered by its step, in the color of its branch', () => {
      expect(scene.arrows.map(({ key, frame, color }) => ({ key, frame, color }))).toEqual([
        { key: 'a1', frame: 1, color: BRANCH_COLORS[0] },
        { key: 'a2', frame: 2, color: BRANCH_COLORS[1] },
      ]);
      expect(scene.badges.map(({ key, step, color }) => ({ key, step, color }))).toEqual([
        { key: 'b1', step: 1, color: BRANCH_COLORS[0] },
        { key: 'b2', step: 2, color: BRANCH_COLORS[1] },
      ]);
    });
  });

  describe('up to a step', () => {
    const firstStep = solutionSceneUpTo(scene, 1);

    it('keeps only the elements of the hypothesis and the steps shown', () => {
      expect(firstStep.circles.map((circle) => circle.key)).toEqual(['0,0,5', '0,1,3']);
      expect(firstStep.strikes.every((strike) => strike.frame <= 1)).toBe(true);
      expect(firstStep.arrows.map((arrow) => arrow.key)).toEqual(['a1']);
      expect(firstStep.badges.map((badge) => badge.key)).toEqual(['b1']);
    });

    it('shows the last candidates only with the last step', () => {
      expect(firstStep.lastCandidates).toEqual([]);
      expect(solutionSceneUpTo(scene, 2).lastCandidates.length).toBe(3);
    });

    it('moves nothing: the elements shown are those of the whole diagram', () => {
      expect(firstStep.circles).toEqual(scene.circles.slice(0, 2));
      expect(firstStep.arrows).toEqual(scene.arrows.slice(0, 1));
    });

    it('keeps the involved cells of the whole solution, so the greyed cells do not change', () => {
      expect(firstStep.involvedCells).toBe(scene.involvedCells);
    });
  });
});
