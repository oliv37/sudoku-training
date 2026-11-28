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
import { ShownSolution } from '../exercise-solution/exercise-solution-model';
import { questionWith } from '../testing/exercise-fixtures';
import { ExerciseQuestionData } from '../exercise-model';
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
