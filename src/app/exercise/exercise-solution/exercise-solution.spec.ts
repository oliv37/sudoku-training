import { Cell } from '../../board/board-model';
import { toneColor } from '../../board/board-theme';
import { contradiction, forced, hypothesis, questionWith } from '../testing/exercise-fixtures';
import { branchesOf, involvedCellsOf, lastStep, solutionSteps } from './exercise-solution';
import { Frame } from './exercise-solution-model';

describe('exercise solution', () => {
  describe('lastStep', () => {
    it('is the last forced placement, the frame before the contradiction', () => {
      const frames = [
        hypothesis([0, 0, 5]),
        forced([1, 1, 2], 0),
        forced([2, 2, 3], 1),
        contradiction(),
      ];
      expect(lastStep(frames)).toBe(2);
    });

    it('is 0 when the hypothesis leads directly to the contradiction', () => {
      const frames = [hypothesis([0, 0, 5]), contradiction()];
      expect(lastStep(frames)).toBe(0);
    });
  });

  describe('branches', () => {
    // Two direct consequences of the hypothesis (steps 1 and 3), each followed by another step.
    const frames: Frame[] = [
      hypothesis([0, 0, 5]),
      forced([1, 1, 2], 0),
      forced([2, 2, 3], 1),
      forced([3, 3, 4], 0),
      forced([4, 4, 6], 3),
      forced([5, 5, 7], 2),
      contradiction(),
    ];

    it('starts a new branch for each direct consequence of the hypothesis', () => {
      const branches = branchesOf(frames);
      expect(branches[1]).toBe(0);
      expect(branches[3]).toBe(1);
    });

    it('puts any other placement in the branch of the placement that caused it', () => {
      const branches = branchesOf(frames);
      expect(branches[2]).toBe(0);
      expect(branches[4]).toBe(1);
      expect(branches[5]).toBe(0);
    });

    it('gives no branch to the hypothesis and the contradiction', () => {
      const branches = branchesOf(frames);
      expect(branches[0]).toBeUndefined();
      expect(branches[6]).toBeUndefined();
    });

    it('numbers the steps with the color of their branch', () => {
      const firstBranch = toneColor('blue');
      const secondBranch = toneColor('violet');
      expect(solutionSteps(frames)).toEqual([
        { step: 1, color: firstBranch },
        { step: 2, color: firstBranch },
        { step: 3, color: secondBranch },
        { step: 4, color: secondBranch },
        { step: 5, color: firstBranch },
      ]);
    });
  });

  describe('involved cells', () => {
    it('are the red zone and the cells of the chain', () => {
      const question = questionWith({ candidates: {} });
      const frames = [hypothesis([0, 0, 5]), forced([1, 1, 2], 0), contradiction()];
      const redZone: Cell[] = [[8, 8]];

      expect(involvedCellsOf(question, frames, redZone)).toEqual(new Set(['8,8', '0,0', '1,1']));
    });

    it('include, for a hidden single in a row, the cells of the row that still hold the digit', () => {
      // 7 is forced in R2C5 because no other cell of row 2 can hold it.
      const question = questionWith({
        candidates: { '1,4': [7, 8], '1,6': [2, 7], '1,8': [3], '2,4': [7] },
      });
      const frames = [
        hypothesis([0, 0, 5]),
        forced([1, 4, 7], 0, [], 'caché ligne 2'),
        contradiction(),
      ];

      expect(involvedCellsOf(question, frames, [])).toEqual(new Set(['0,0', '1,4', '1,6']));
    });

    it('include, for a hidden single in a column, the cells of the column that still hold the digit', () => {
      const question = questionWith({ candidates: { '2,4': [9], '6,4': [1, 9], '6,5': [9] } });
      const frames = [
        hypothesis([0, 0, 5]),
        forced([2, 4, 9], 0, [], 'caché colonne 5'),
        contradiction(),
      ];

      expect(involvedCellsOf(question, frames, [])).toEqual(new Set(['0,0', '2,4', '6,4']));
    });

    it('include, for a hidden single in a box, the cells of the box that still hold the digit', () => {
      const question = questionWith({ candidates: { '6,6': [4], '8,8': [4, 6], '5,8': [4] } });
      const frames = [
        hypothesis([0, 0, 5]),
        forced([7, 7, 4], 0, [], 'caché bloc 9'),
        contradiction(),
      ];

      expect(involvedCellsOf(question, frames, [])).toEqual(new Set(['0,0', '7,7', '6,6', '8,8']));
    });
  });
});
