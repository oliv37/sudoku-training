/**
 * The board drawing of a question: placed digits, candidates, and the question marks (red zone,
 * green start cell). Once the solution is shown, its diagram too: the hypothesis and the forced
 * placements circled, the eliminated candidates struck, the last candidates of the red zone framed,
 * arrows from each placement to the placements it forces, and the cells it does not involve greyed.
 * The elements of the steps not shown yet are hidden: the board keeps them in place, so nothing
 * moves when they appear.
 */
import {
  BoardDrawing,
  CellDigit,
  DrawnArrow,
  DrawnCandidate,
  DrawnDigit,
  DrawnZone,
  ZoneOutline,
} from '../../board/board-model';
import { candidateKey, cellKey } from '../../board/board-cells';
import { candidatesOf, cellValueOf } from '../exercise-cells';
import { ShownSolution } from '../exercise-solution/exercise-solution-model';
import {
  branchTone,
  branchesOf,
  involvedCellsOf,
  lastStep,
} from '../exercise-solution/exercise-solution';
import { Arrival, ExerciseQuestionData } from '../exercise-model';
import { CandidateMarks, MarkedCandidate } from './exercise-board-drawing-model';

/** `solution`: the solution shown on the board and its step reached; null before the user answers. */
export function boardDrawingOf(
  question: ExerciseQuestionData,
  solution: ShownSolution | null,
): BoardDrawing {
  const greyedCells = greyedCellsOf(question, solution);
  const solutionMarks = solutionMarksOrNoneOf(question, solution);
  return {
    digits: digitsOf(question),
    candidates: drawnCandidatesOf(question, greyedCells, solutionMarks),
    zones: zonesOf(question),
    arrows: solution === null ? [] : solutionArrowsOf(solution),
  };
}

/** Marks of the solution, keyed by `candidateKey`; none before the user answers. */
function solutionMarksOrNoneOf(
  question: ExerciseQuestionData,
  solution: ShownSolution | null,
): Map<string, MarkedCandidate> {
  if (solution === null) {
    return new Map<string, MarkedCandidate>();
  }
  return solutionMarksOf(question, solution);
}

/** An element of the step `step` is hidden until the solution is shown up to that step. */
function isNotShownYet(step: number, { shownStep }: ShownSolution): boolean {
  return step > shownStep;
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
 * Candidates of the empty cells, row by row, underlined when listed in `under`, with the marks of
 * the solution. Row by row is also the order in which the arrows avoid the marks.
 */
function drawnCandidatesOf(
  question: ExerciseQuestionData,
  greyedCells: Set<string>,
  solutionMarks: Map<string, MarkedCandidate>,
): DrawnCandidate[] {
  const underlinedKeys = new Set(question.under.map(candidateKey));
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

/**
 * Cells whose candidates are greyed, as `cellKey` strings: none before the solution is shown,
 * then every cell the solution does not involve.
 */
function greyedCellsOf(
  question: ExerciseQuestionData,
  solution: ShownSolution | null,
): Set<string> {
  const greyedCells = new Set<string>();
  if (solution === null) {
    return greyedCells;
  }
  // Those of the whole solution, whatever the step shown: the greyed cells do not change.
  const involvedCells = involvedCellsOf(question, solution.frames, question.arrivee.cases);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!involvedCells.has(cellKey(r, c))) {
        greyedCells.add(cellKey(r, c));
      }
    }
  }
  return greyedCells;
}

/** The red zone, then the green start cell on top of it. */
function zonesOf(question: ExerciseQuestionData): DrawnZone[] {
  const redZone: DrawnZone = {
    cells: question.arrivee.cases,
    fill: 'red-hatched',
    outline: redZoneOutlineOf(question.arrivee),
  };
  const startCell: DrawnZone = { cells: [question.depart], fill: 'green', outline: 'solid' };
  return [redZone, startCell];
}

/** Dashed around a whole unit, solid around a single cell. */
function redZoneOutlineOf(arrival: Arrival): ZoneOutline {
  if (arrival.type === 'unit') {
    return 'dashed';
  }
  return 'solid';
}

/**
 * Marks of the solution, keyed by `candidateKey`.
 * As in the reference renderer, a candidate struck then circled keeps both marks: the board draws
 * only its circle, but its strike still counts as an obstacle for the arrows.
 */
function solutionMarksOf(
  question: ExerciseQuestionData,
  solution: ShownSolution,
): Map<string, MarkedCandidate> {
  const marks = new Map<string, MarkedCandidate>();
  addCircles(marks, solution);
  addStrikes(marks, solution);
  addLastCandidateFrames(marks, question.arrivee, solution);
  return marks;
}

/** The marks of a candidate, created empty the first time the candidate is marked. */
function marksOf(marks: Map<string, MarkedCandidate>, candidate: CellDigit): CandidateMarks {
  const key = candidateKey(candidate);
  let markedCandidate = marks.get(key);
  if (markedCandidate === undefined) {
    markedCandidate = { candidate, marks: {} };
    marks.set(key, markedCandidate);
  }
  return markedCandidate.marks;
}

/** The hypothesis circled in green (bold), each forced placement in the tone of its branch. */
function addCircles(marks: Map<string, MarkedCandidate>, solution: ShownSolution): void {
  const branches = branchesOf(solution.frames);
  solution.frames.forEach((frame, index) => {
    if (frame.kind === 'bad') {
      return;
    }
    const isHypothesis = frame.kind === 'hyp';
    const tone = isHypothesis ? 'green' : branchTone(branches[index]);
    const hidden = isNotShownYet(index, solution);
    marksOf(marks, frame.circle).circled = { tone, bold: isHypothesis, hidden };
  });
}

/** Each eliminated candidate struck once, at the first step that eliminates it. */
function addStrikes(marks: Map<string, MarkedCandidate>, solution: ShownSolution): void {
  solution.frames.forEach((frame, index) => {
    if (frame.kind === 'bad') {
      return;
    }
    for (const candidate of frame.strikes) {
      const candidateMarks = marksOf(marks, candidate);
      if (candidateMarks.struck === undefined) {
        candidateMarks.struck = { tone: 'red', hidden: isNotShownYet(index, solution) };
      }
    }
  });
}

/**
 * The last candidates of the red zone, struck by the chain: the contradiction itself, framed in red
 * and shown with the last step only.
 */
function addLastCandidateFrames(
  marks: Map<string, MarkedCandidate>,
  redZone: Arrival,
  solution: ShownSolution,
): void {
  const hidden = isNotShownYet(lastStep(solution.frames), solution);
  for (const { candidate, marks: candidateMarks } of marks.values()) {
    if (isStruckOnly(candidateMarks) && isLastCandidateOfRedZone(candidate, redZone)) {
      candidateMarks.framed = { tone: 'red', hidden };
    }
  }
}

/** Struck by the chain, but not placed by it. */
function isStruckOnly({ struck, circled }: CandidateMarks): boolean {
  return struck !== undefined && circled === undefined;
}

/** Whether a candidate is one of those that disappear from the red zone. */
function isLastCandidateOfRedZone([r, c, digit]: CellDigit, redZone: Arrival): boolean {
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
  return digit === redZone.chiffre;
}

/**
 * One arrow per forced placement, from the placement that causes it, numbered by its step, in the
 * tone of its branch. In step order: the arrows are routed in that order.
 */
function solutionArrowsOf(solution: ShownSolution): DrawnArrow[] {
  const { frames } = solution;
  const branches = branchesOf(frames);
  const arrows: DrawnArrow[] = [];
  frames.forEach((frame, index) => {
    if (frame.kind !== 'dom') {
      return;
    }
    const cause = frames[frame.cause];
    if (cause === undefined || cause.kind === 'bad') {
      return;
    }
    arrows.push({
      from: cause.circle,
      to: frame.circle,
      tone: branchTone(branches[index]),
      label: String(index),
      hidden: isNotShownYet(index, solution),
    });
  });
  return arrows;
}
