/**
 * The part of the board drawing that comes from the solution shown: the cells it does not involve
 * greyed, the hypothesis and the forced placements circled, the eliminated candidates struck, the
 * last candidates of the red zone framed, and arrows from each placement to the placements it
 * forces. The elements of the steps not shown yet are hidden: the board keeps them in place, so
 * nothing moves when they appear. Each function gives nothing before the user answers (no
 * solution shown). Assembled with the question in exercise-board-drawing.ts.
 */
import { CellDigit, DrawnArrow } from '../../board/board-model';
import { candidateKey, cellKey } from '../../board/board-cells';
import { ShownSolution } from '../exercise-solution/exercise-solution-model';
import {
  branchTone,
  branchesOf,
  involvedCellsOf,
  lastStep,
} from '../exercise-solution/exercise-solution';
import { ExerciseQuestionData, RedZone } from '../exercise-model';
import { CandidateMarks, MarkedCandidate } from './exercise-board-solution-drawing-model';

/**
 * Cells whose candidates are greyed, as `cellKey` strings: none before the solution is shown,
 * then every cell the solution does not involve.
 */
export function greyedCellsOf(
  question: ExerciseQuestionData,
  solution: ShownSolution | null,
): Set<string> {
  const greyedCells = new Set<string>();
  if (solution === null) {
    return greyedCells;
  }
  // Those of the whole solution, whatever the step shown: the greyed cells do not change.
  const involvedCells = involvedCellsOf(question, solution.frames, question.redZone.cells);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!involvedCells.has(cellKey(r, c))) {
        greyedCells.add(cellKey(r, c));
      }
    }
  }
  return greyedCells;
}

/** An element of the step `step` is hidden until the solution is shown up to that step. */
function isNotShownYet(step: number, { shownStep }: ShownSolution): boolean {
  return step > shownStep;
}

/**
 * Marks of the solution, keyed by `candidateKey`; none before the user answers.
 * As in the reference renderer, a candidate struck then circled keeps both marks: the board draws
 * only its circle, but its strike still counts as an obstacle for the arrows.
 */
export function solutionMarksOf(
  question: ExerciseQuestionData,
  solution: ShownSolution | null,
): Map<string, MarkedCandidate> {
  const marks = new Map<string, MarkedCandidate>();
  if (solution === null) {
    return marks;
  }
  addCircles(marks, solution);
  addStrikes(marks, solution);
  addLastCandidateFrames(marks, question.redZone, solution);
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
    if (frame.kind === 'contradiction') {
      return;
    }
    const isHypothesis = frame.kind === 'hypothesis';
    const tone = isHypothesis ? 'green' : branchTone(branches[index]);
    const hidden = isNotShownYet(index, solution);
    marksOf(marks, frame.placement).circled = { tone, bold: isHypothesis, hidden };
  });
}

/** Each eliminated candidate struck once, at the first step that eliminates it. */
function addStrikes(marks: Map<string, MarkedCandidate>, solution: ShownSolution): void {
  solution.frames.forEach((frame, index) => {
    if (frame.kind === 'contradiction') {
      return;
    }
    for (const candidate of frame.eliminations) {
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
  redZone: RedZone,
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
function isLastCandidateOfRedZone([r, c, digit]: CellDigit, redZone: RedZone): boolean {
  const isInRedZone = redZone.cells.some(
    ([zoneRow, zoneColumn]) => zoneRow === r && zoneColumn === c,
  );
  if (!isInRedZone) {
    return false;
  }
  // A single cell loses all its candidates; a unit loses one digit.
  if (redZone.kind === 'cell') {
    return true;
  }
  return digit === redZone.digit;
}

/**
 * One arrow per forced placement, from the placement that causes it, numbered by its step, in the
 * tone of its branch; none before the user answers. In step order: the arrows are routed in that
 * order.
 */
export function solutionArrowsOf(solution: ShownSolution | null): DrawnArrow[] {
  if (solution === null) {
    return [];
  }
  const { frames } = solution;
  const branches = branchesOf(frames);
  const arrows: DrawnArrow[] = [];
  frames.forEach((frame, index) => {
    if (frame.kind !== 'forced') {
      return;
    }
    const cause = frames[frame.causeStep];
    if (cause === undefined || cause.kind === 'contradiction') {
      return;
    }
    arrows.push({
      from: cause.placement,
      to: frame.placement,
      tone: branchTone(branches[index]),
      label: String(index),
      hidden: isNotShownYet(index, solution),
    });
  });
  return arrows;
}
