import { CellDigit } from '../../board/board-model';
import { candidateKey } from '../../board/board-cells';
import { rowCells } from '../../board/testing/board-fixtures';
import { Frame, ShownSolution } from '../exercise-solution/exercise-solution-model';
import { contradiction, forced, hypothesis, questionWith } from '../testing/exercise-fixtures';
import { RedZone } from '../exercise-model';
import { CandidateMarks } from './exercise-board-solution-drawing-model';
import {
  greyedCellsOf,
  solutionArrowsOf,
  solutionMarksOf,
} from './exercise-board-solution-drawing';

/**
 * A small chain, two branches:
 * - step 0, hypothesis: 5 in R1C1; strikes 1 in R1C1, 5 in R1C2, R1C9 and R5C5;
 * - step 1, from the hypothesis: 3 in R1C2; strikes 7 in R1C2, 3 in R1C9;
 * - step 2, from the hypothesis: 7 in R2C1; strikes 7 in R1C9, 7 in R1C2 again, 5 in R1C1 (circled);
 * - then R1C9, the red zone, has no candidate left.
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
const candidates = {
  '0,0': [1, 5],
  '0,1': [3, 5, 7],
  '0,8': [3, 5, 7],
  '1,0': [7],
  '4,4': [5],
};
const lastCell: RedZone = { kind: 'cell', name: 'R1C9', digit: null, cells: [[0, 8]] };
const question = questionWith({ candidates, redZone: lastCell });
const wholeSolution: ShownSolution = { frames, shownStep: 2 };
const upToStep1: ShownSolution = { frames, shownStep: 1 };

/** The marks the solution puts on a candidate; none when it does not mark it. */
function marksOn(solution: ShownSolution, candidate: CellDigit): CandidateMarks {
  const marks = solutionMarksOf(question, solution);
  return marks.get(candidateKey(candidate))?.marks ?? {};
}

describe('exercise board solution drawing', () => {
  describe('greyed cells', () => {
    it('are none before the user answers', () => {
      expect(greyedCellsOf(question, null).size).toBe(0);
    });

    it('are, whatever the step shown, the cells outside the red zone and the cells of the chain', () => {
      const chainQuestion = questionWith({
        redZone: { kind: 'cell', name: 'R9C9', digit: null, cells: [[8, 8]] },
      });
      const chain: Frame[] = [hypothesis([0, 0, 1]), forced([4, 4, 3], 0), contradiction()];
      const greyedCells = greyedCellsOf(chainQuestion, { frames: chain, shownStep: 0 });
      expect(greyedCells.size).toBe(81 - 3);
      expect(greyedCells.has('2,2')).toBe(true);
      expect(greyedCells.has('0,0')).toBe(false);
      expect(greyedCells.has('4,4')).toBe(false);
      expect(greyedCells.has('8,8')).toBe(false);
    });
  });

  describe('marks', () => {
    it('are none before the user answers', () => {
      expect(solutionMarksOf(question, null).size).toBe(0);
    });

    it('circle the hypothesis in bold green and each forced placement in the tone of its branch', () => {
      expect(marksOn(wholeSolution, [0, 0, 5]).circled).toEqual({
        tone: 'green',
        bold: true,
        hidden: false,
      });
      expect(marksOn(wholeSolution, [0, 1, 3]).circled).toEqual({
        tone: 'blue',
        bold: false,
        hidden: false,
      });
      expect(marksOn(wholeSolution, [1, 0, 7]).circled).toEqual({
        tone: 'violet',
        bold: false,
        hidden: false,
      });
    });

    it('strike each eliminated candidate in red', () => {
      expect(marksOn(wholeSolution, [0, 0, 1]).struck).toEqual({ tone: 'red', hidden: false });
      expect(marksOn(wholeSolution, [0, 1, 7]).struck).toEqual({ tone: 'red', hidden: false });
      expect(marksOn(wholeSolution, [0, 8, 7]).struck).toEqual({ tone: 'red', hidden: false });
    });

    it('keep the strike of a circled candidate (the board draws only its circle)', () => {
      const hypothesisMarks = marksOn(wholeSolution, [0, 0, 5]);
      expect(hypothesisMarks.struck).toEqual({ tone: 'red', hidden: false });
      expect(hypothesisMarks.circled).toBeDefined();
    });

    it('frame in red every struck candidate of a red cell', () => {
      for (const digit of [3, 5, 7]) {
        expect(marksOn(wholeSolution, [0, 8, digit]).framed).toEqual({
          tone: 'red',
          hidden: false,
        });
      }
    });

    it('frame, for a red unit, only the struck candidates of its digit', () => {
      const firstRowWithout3: RedZone = {
        kind: 'unit',
        name: 'row 1',
        digit: 3,
        cells: rowCells(0),
      };
      const unitQuestion = questionWith({ candidates, redZone: firstRowWithout3 });
      const framed: CellDigit[] = [];
      for (const { candidate, marks } of solutionMarksOf(unitQuestion, wholeSolution).values()) {
        if (marks.framed !== undefined) {
          framed.push(candidate);
        }
      }
      // The 3 of R1C2 is circled, so not framed.
      expect(framed).toEqual([[0, 8, 3]]);
    });

    it('hide, until their step is shown, the marks of the later steps', () => {
      // Step 1 is shown: the 3 of R1C2 and the 7 it strikes in R1C2.
      expect(marksOn(upToStep1, [0, 1, 3]).circled?.hidden).toBe(false);
      expect(marksOn(upToStep1, [0, 1, 7]).struck?.hidden).toBe(false);
      // Step 2 is not: the 7 of R2C1 and the 7 it strikes first in R1C9.
      expect(marksOn(upToStep1, [1, 0, 7]).circled?.hidden).toBe(true);
      expect(marksOn(upToStep1, [0, 8, 7]).struck?.hidden).toBe(true);
      // The last candidates of the red zone come with the last step.
      expect(marksOn(upToStep1, [0, 8, 3]).framed?.hidden).toBe(true);
    });
  });

  describe('arrows', () => {
    it('are none before the user answers', () => {
      expect(solutionArrowsOf(null)).toEqual([]);
    });

    it('go to each forced placement from its cause, numbered by its step, in the tone of its branch', () => {
      expect(solutionArrowsOf(wholeSolution)).toEqual([
        { from: [0, 0, 5], to: [0, 1, 3], tone: 'blue', label: '1', hidden: false },
        { from: [0, 0, 5], to: [1, 0, 7], tone: 'violet', label: '2', hidden: false },
      ]);
    });

    it('are hidden until their step is shown', () => {
      expect(solutionArrowsOf(upToStep1).map(({ hidden }) => hidden)).toEqual([false, true]);
    });
  });
});
