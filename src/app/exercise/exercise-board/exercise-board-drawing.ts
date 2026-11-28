/**
 * The board drawing of a question: placed digits, candidates, and the question marks (red zone,
 * green start cell). Once the solution is shown, its part of the drawing (greyed cells, marks,
 * arrows) comes from exercise-board-solution-drawing.ts.
 */
import {
  BoardDrawing,
  DrawnCandidate,
  DrawnDigit,
  DrawnZone,
  ZoneOutline,
} from '../../board/board-model';
import { candidateKey, cellKey } from '../../board/board-cells';
import { candidatesOf, cellValueOf } from '../exercise-cells';
import { ShownSolution } from '../exercise-solution/exercise-solution-model';
import { ExerciseQuestionData, RedZone } from '../exercise-model';
import { MarkedCandidate } from './exercise-board-solution-drawing-model';
import {
  greyedCellsOf,
  solutionArrowsOf,
  solutionMarksOf,
} from './exercise-board-solution-drawing';

/** `solution`: the solution shown on the board and its step reached; null before the user answers. */
export function boardDrawingOf(
  question: ExerciseQuestionData,
  solution: ShownSolution | null,
): BoardDrawing {
  const greyedCells = greyedCellsOf(question, solution);
  const solutionMarks = solutionMarksOf(question, solution);
  return {
    digits: digitsOf(question),
    candidates: drawnCandidatesOf(question, greyedCells, solutionMarks),
    zones: zonesOf(question),
    arrows: solutionArrowsOf(solution),
  };
}

/** Placed digits, row by row. */
function digitsOf(question: ExerciseQuestionData): DrawnDigit[] {
  const digits: DrawnDigit[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = cellValueOf(question, [r, c]);
      if (digit !== 0) {
        digits.push({ cell: [r, c], digit });
      }
    }
  }
  return digits;
}

/**
 * Candidates of the empty cells, row by row, underlined when listed in `underlined`, greyed and
 * marked as the solution says. Row by row is also the order in which the arrows avoid the marks.
 */
function drawnCandidatesOf(
  question: ExerciseQuestionData,
  greyedCells: Set<string>,
  solutionMarks: Map<string, MarkedCandidate>,
): DrawnCandidate[] {
  const underlinedKeys = new Set(question.underlined.map(candidateKey));
  const candidates: DrawnCandidate[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (cellValueOf(question, [r, c]) !== 0) {
        continue;
      }
      const greyed = greyedCells.has(cellKey(r, c));
      for (const digit of candidatesOf(question, [r, c])) {
        const key = candidateKey([r, c, digit]);
        const underlined = underlinedKeys.has(key);
        const marks = solutionMarks.get(key)?.marks ?? {};
        candidates.push({ candidate: [r, c, digit], underlined, greyed, ...marks });
      }
    }
  }
  return candidates;
}

/** The red zone, then the green start cell on top of it. */
function zonesOf(question: ExerciseQuestionData): DrawnZone[] {
  const redZone: DrawnZone = {
    cells: question.redZone.cells,
    fill: 'red-hatched',
    outline: redZoneOutlineOf(question.redZone),
  };
  const startCell: DrawnZone = { cells: [question.startCell], fill: 'green', outline: 'solid' };
  return [redZone, startCell];
}

/** Dashed around a whole unit, solid around a single cell. */
function redZoneOutlineOf(redZone: RedZone): ZoneOutline {
  if (redZone.kind === 'unit') {
    return 'dashed';
  }
  return 'solid';
}
