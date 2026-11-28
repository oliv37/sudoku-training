import gridFile from '../../../../public/data/exercices-2026-11-14.json';
import {
  BoardDrawing,
  Cell,
  CellDigit,
  DrawnArrow,
  DrawnCandidate,
  DrawnZone,
} from '../../board/board-model';
import { cellName } from '../../board/board-cells';
import { rowCells } from '../../board/testing/board-fixtures';
import { lastStep } from '../exercise-solution/exercise-solution';
import { Frame, ShownSolution } from '../exercise-solution/exercise-solution-model';
import { contradiction, forced, hypothesis, questionWith } from '../testing/exercise-fixtures';
import { ExerciseQuestionData, RedZone } from '../exercise-model';
import { parseExerciseFile } from '../exercise-file/exercise-file';
import { boardDrawingOf } from './exercise-board-drawing';

const gridQuestions = parseExerciseFile(gridFile).questions;

/**
 * Questions of the grid file whose drawing is recorded: a box red zone with one branch (1), a
 * column with three branches and hidden singles (6), a single cell with a long chain (11).
 */
const RECORDED_QUESTION_NUMBERS = [1, 6, 11];

function gridQuestionNumbered(questionNumber: number): ExerciseQuestionData {
  // Questions are numbered from 1, in the order of the file.
  const question = gridQuestions.at(questionNumber - 1);
  if (question === undefined) {
    throw new Error(`No question ${questionNumber} in the grid file`);
  }
  return question;
}

/** Before the answer, at step 1 (later steps hidden), and with the whole solution. */
function recordedSolutionsOf(question: ExerciseQuestionData): [string, ShownSolution | null][] {
  return [
    ['before the answer', null],
    ['at step 1', { frames: question.solution, shownStep: 1 }],
    [
      'with the whole solution',
      { frames: question.solution, shownStep: lastStep(question.solution) },
    ],
  ];
}

/** The drawing, one line per element and in list order (the order changes how arrows bend). */
function drawingLinesOf(drawing: BoardDrawing): string {
  const lines: string[] = [];
  for (const { cell, digit } of drawing.digits) {
    lines.push(`digit ${cellName(cell)} ${digit}`);
  }
  for (const candidate of drawing.candidates) {
    lines.push(candidateLineOf(candidate));
  }
  for (const zone of drawing.zones) {
    lines.push(zoneLineOf(zone));
  }
  for (const arrow of drawing.arrows) {
    lines.push(arrowLineOf(arrow));
  }
  return lines.join('\n');
}

/** "R1C2 3" for the candidate 3 of R1C2. */
function candidateNameOf([r, c, digit]: CellDigit): string {
  const cell: Cell = [r, c];
  return `${cellName(cell)} ${digit}`;
}

/** "candidate R1C2 3 underlined struck(red hidden) circled(blue bold)". */
function candidateLineOf(drawn: DrawnCandidate): string {
  const parts = [`candidate ${candidateNameOf(drawn.candidate)}`];
  if (drawn.underlined === true) {
    parts.push('underlined');
  }
  if (drawn.greyed === true) {
    parts.push('greyed');
  }
  if (drawn.struck !== undefined) {
    parts.push(markOf('struck', [drawn.struck.tone], drawn.struck.hidden));
  }
  if (drawn.circled !== undefined) {
    const bold = drawn.circled.bold === true ? ['bold'] : [];
    parts.push(markOf('circled', [drawn.circled.tone, ...bold], drawn.circled.hidden));
  }
  if (drawn.framed !== undefined) {
    parts.push(markOf('framed', [drawn.framed.tone], drawn.framed.hidden));
  }
  return parts.join(' ');
}

/** "struck(red hidden)". */
function markOf(name: string, details: string[], hidden: boolean | undefined): string {
  const allDetails = hidden === true ? [...details, 'hidden'] : details;
  return `${name}(${allDetails.join(' ')})`;
}

function zoneLineOf({ cells, fill, outline }: DrawnZone): string {
  return `zone ${fill} ${outline} ${cells.map(cellName).join(' ')}`;
}

function arrowLineOf({ from, to, tone, label, hidden }: DrawnArrow): string {
  const parts = [`arrow ${candidateNameOf(from)} -> ${candidateNameOf(to)} ${tone}`];
  if (label !== undefined) {
    parts.push(`label ${label}`);
  }
  if (hidden === true) {
    parts.push('hidden');
  }
  return parts.join(' ');
}

describe('exercise board drawing', () => {
  describe('digits', () => {
    it('are the placed digits, row by row', () => {
      const question = questionWith({ digits: { '4,7': 3, '0,0': 5 } });
      expect(boardDrawingOf(question, null).digits).toEqual([
        { cell: [0, 0], digit: 5 },
        { cell: [4, 7], digit: 3 },
      ]);
    });
  });

  describe('candidates', () => {
    it('are those of the empty cells, row by row', () => {
      const question = questionWith({
        digits: { '0,1': 7 },
        candidates: { '8,8': [2], '0,0': [1, 9], '0,1': [4] },
      });
      const candidates = boardDrawingOf(question, null).candidates;
      expect(candidates.map(({ candidate }) => candidate)).toEqual([
        [0, 0, 1],
        [0, 0, 9],
        [8, 8, 2],
      ]);
    });

    it('are underlined when listed in `under`', () => {
      const question = questionWith({ candidates: { '0,0': [1, 2] }, underlined: [[0, 0, 2]] });
      const [one, two] = boardDrawingOf(question, null).candidates;
      expect(one.underlined).toBe(false);
      expect(two.underlined).toBe(true);
    });

    it('are never greyed before the solution is shown', () => {
      const question = questionWith({ candidates: { '0,0': [1], '2,2': [5] } });
      const candidates = boardDrawingOf(question, null).candidates;
      expect(candidates.map(({ greyed }) => greyed)).toEqual([false, false]);
    });

    it('are greyed, once the solution is shown, outside the red zone and the cells of the chain', () => {
      const question = questionWith({
        candidates: { '0,0': [1], '2,2': [5], '4,4': [3], '8,8': [2] },
        redZone: { kind: 'cell', name: 'R9C9', digit: null, cells: [[8, 8]] },
      });
      const frames: Frame[] = [hypothesis([0, 0, 1]), forced([4, 4, 3], 0), contradiction()];
      // The greyed cells are those of the whole solution, whatever the step shown.
      const candidates = boardDrawingOf(question, { frames, shownStep: 0 }).candidates;
      expect(candidates.map(({ candidate, greyed }) => [candidate, greyed])).toEqual([
        [[0, 0, 1], false],
        [[2, 2, 5], true],
        [[4, 4, 3], false],
        [[8, 8, 2], false],
      ]);
    });
  });

  describe('zones', () => {
    it('are the red zone, then the green start cell on top of it', () => {
      const question = questionWith({ startCell: [1, 2] });
      const zones = boardDrawingOf(question, null).zones;
      expect(zones.map(({ fill }) => fill)).toEqual(['red-hatched', 'green']);
      expect(zones[1]).toEqual({ cells: [[1, 2]], fill: 'green', outline: 'solid' });
    });

    it('outline a whole unit with dashes', () => {
      const row = rowCells(3);
      const question = questionWith({
        redZone: { kind: 'unit', name: 'row 4', digit: 6, cells: row },
      });
      const [redZone] = boardDrawingOf(question, null).zones;
      expect(redZone).toEqual({ cells: row, fill: 'red-hatched', outline: 'dashed' });
    });

    it('outline a single cell with a solid line', () => {
      const question = questionWith({
        redZone: { kind: 'cell', name: 'R5C9', digit: null, cells: [[4, 8]] },
      });
      const [redZone] = boardDrawingOf(question, null).zones;
      expect(redZone).toEqual({ cells: [[4, 8]], fill: 'red-hatched', outline: 'solid' });
    });
  });

  describe('solution', () => {
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

    /** The drawn candidate of R`r`C`c`, digit `digit` (coordinates 0..8). */
    function drawnCandidate(
      drawingCandidates: DrawnCandidate[],
      [r, c, digit]: CellDigit,
    ): DrawnCandidate {
      const found = drawingCandidates.find(
        ({ candidate }) => candidate[0] === r && candidate[1] === c && candidate[2] === digit,
      );
      if (found === undefined) {
        throw new Error(`No candidate ${digit} in R${r + 1}C${c + 1}`);
      }
      return found;
    }

    const wholeSolution = { frames, shownStep: 2 };
    const drawn = boardDrawingOf(question, wholeSolution);

    it('is not drawn before the user answers', () => {
      const beforeAnswer = boardDrawingOf(question, null);
      expect(beforeAnswer.arrows).toEqual([]);
      for (const candidate of beforeAnswer.candidates) {
        expect(candidate.struck).toBeUndefined();
        expect(candidate.circled).toBeUndefined();
        expect(candidate.framed).toBeUndefined();
      }
    });

    it('circles the hypothesis in bold green and each forced placement in the tone of its branch', () => {
      expect(drawnCandidate(drawn.candidates, [0, 0, 5]).circled).toEqual({
        tone: 'green',
        bold: true,
        hidden: false,
      });
      expect(drawnCandidate(drawn.candidates, [0, 1, 3]).circled).toEqual({
        tone: 'blue',
        bold: false,
        hidden: false,
      });
      expect(drawnCandidate(drawn.candidates, [1, 0, 7]).circled).toEqual({
        tone: 'violet',
        bold: false,
        hidden: false,
      });
    });

    it('strikes each eliminated candidate in red', () => {
      expect(drawnCandidate(drawn.candidates, [0, 0, 1]).struck).toEqual({
        tone: 'red',
        hidden: false,
      });
      expect(drawnCandidate(drawn.candidates, [0, 1, 7]).struck).toEqual({
        tone: 'red',
        hidden: false,
      });
      expect(drawnCandidate(drawn.candidates, [0, 8, 7]).struck).toEqual({
        tone: 'red',
        hidden: false,
      });
    });

    it('keeps the strike of a circled candidate (the board draws only its circle)', () => {
      const hypothesisCandidate = drawnCandidate(drawn.candidates, [0, 0, 5]);
      expect(hypothesisCandidate.struck).toEqual({ tone: 'red', hidden: false });
      expect(hypothesisCandidate.circled).toBeDefined();
    });

    it('frames in red every struck candidate of a red cell', () => {
      const framed = drawn.candidates.filter(({ framed }) => framed !== undefined);
      expect(framed.map(({ candidate, framed }) => [candidate, framed])).toEqual([
        [[0, 8, 3], { tone: 'red', hidden: false }],
        [[0, 8, 5], { tone: 'red', hidden: false }],
        [[0, 8, 7], { tone: 'red', hidden: false }],
      ]);
    });

    it('frames, for a red unit, only the struck candidates of its digit', () => {
      const firstRowWithout3: RedZone = {
        kind: 'unit',
        name: 'row 1',
        digit: 3,
        cells: rowCells(0),
      };
      const unitDrawing = boardDrawingOf(
        questionWith({ candidates, redZone: firstRowWithout3 }),
        wholeSolution,
      );
      const framed = unitDrawing.candidates.filter(({ framed }) => framed !== undefined);
      // The 3 of R1C2 is circled, so not framed.
      expect(framed.map(({ candidate }) => candidate)).toEqual([[0, 8, 3]]);
    });

    it('draws an arrow to each forced placement from its cause, numbered by its step, in the tone of its branch', () => {
      expect(drawn.arrows).toEqual([
        { from: [0, 0, 5], to: [0, 1, 3], tone: 'blue', label: '1', hidden: false },
        { from: [0, 0, 5], to: [1, 0, 7], tone: 'violet', label: '2', hidden: false },
      ]);
    });

    it('hides, until their step is shown, the elements of the later steps', () => {
      const upToStep1 = boardDrawingOf(question, { frames, shownStep: 1 });
      const candidates = upToStep1.candidates;
      // Step 1 is shown: the 3 of R1C2 and the 7 it strikes in R1C2.
      expect(drawnCandidate(candidates, [0, 1, 3]).circled?.hidden).toBe(false);
      expect(drawnCandidate(candidates, [0, 1, 7]).struck?.hidden).toBe(false);
      // Step 2 is not: the 7 of R2C1, the 7 it strikes first in R1C9, and its arrow.
      expect(drawnCandidate(candidates, [1, 0, 7]).circled?.hidden).toBe(true);
      expect(drawnCandidate(candidates, [0, 8, 7]).struck?.hidden).toBe(true);
      expect(upToStep1.arrows.map(({ hidden }) => hidden)).toEqual([false, true]);
      // The last candidates of the red zone come with the last step.
      expect(drawnCandidate(candidates, [0, 8, 3]).framed?.hidden).toBe(true);
    });
  });

  // Snapshot of the drawing of real questions. Update it only for an intended change, after
  // reading the diff.
  describe('of questions of the grid file', () => {
    for (const questionNumber of RECORDED_QUESTION_NUMBERS) {
      const question = gridQuestionNumbered(questionNumber);
      for (const [moment, solution] of recordedSolutionsOf(question)) {
        it(`draws question ${questionNumber} ${moment} as before`, () => {
          expect(drawingLinesOf(boardDrawingOf(question, solution))).toMatchSnapshot();
        });
      }
    }
  });
});
