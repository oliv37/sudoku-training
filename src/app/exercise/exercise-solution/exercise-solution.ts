/**
 * What a solution chain says, independently of how it is drawn: its numbered steps, its branches,
 * and the cells it involves. Used by the board drawing of a question and by the step buttons.
 */
import { Cell, Tone } from '../../board/board-model';
import { cellKey } from '../../board/board-cells';
import { toneColor } from '../../board/board-theme';
import { candidatesOf } from '../exercise-cells';
import { ExerciseQuestionData } from '../exercise-model';
import { Frame, Unit } from './exercise-solution-model';

/** Number of the last step (index of the last forced placement); 0 if there is none. */
export function lastStep(frames: Frame[]): number {
  let last = 0;
  frames.forEach((frame, index) => {
    if (frame.kind === 'forced') {
      last = index;
    }
  });
  return last;
}

/**
 * Branch of each forced placement, indexed like `frames` (no entry for the hypothesis and the
 * final contradiction). Each direct consequence of the hypothesis starts a new branch; any other
 * placement belongs to the branch of the placement that caused it.
 */
export function branchesOf(frames: Frame[]): number[] {
  const branches: number[] = [];
  let nextBranch = 0;
  frames.forEach((frame, index) => {
    if (frame.kind !== 'forced') {
      return;
    }
    if (frame.causeStep === 0) {
      branches[index] = nextBranch;
      nextBranch++;
    } else {
      branches[index] = branches[frame.causeStep];
    }
  });
  return branches;
}

/** One tone per branch of the chain (the branch colors of the reference renderer), used in turn. */
const BRANCH_TONES: Tone[] = ['blue', 'violet', 'orange', 'teal'];

/** Tone of a branch of the chain (0 = first branch). */
export function branchTone(branch: number): Tone {
  return BRANCH_TONES[branch % BRANCH_TONES.length];
}

/** The numbered steps of a solution with their branch color, as on the board badges. */
export function solutionSteps(frames: Frame[]): { step: number; color: string }[] {
  const branches = branchesOf(frames);
  const steps: { step: number; color: string }[] = [];
  frames.forEach((frame, index) => {
    if (frame.kind === 'forced') {
      steps.push({ step: index, color: toneColor(branchTone(branches[index])) });
    }
  });
  return steps;
}

/**
 * Cells that matter in the solution (the other cells are greyed out), as `cellKey` strings:
 * the red zone, the cells of the chain, and the cells that justify a hidden single.
 */
export function involvedCellsOf(
  question: ExerciseQuestionData,
  frames: Frame[],
  redZoneCells: Cell[],
): Set<string> {
  const involvedCells = new Set<string>();
  for (const [r, c] of redZoneCells) {
    involvedCells.add(cellKey(r, c));
  }
  for (const frame of frames) {
    if (frame.kind === 'contradiction') {
      continue;
    }
    const [r, c, digit] = frame.placement;
    involvedCells.add(cellKey(r, c));
    for (const [unitRow, unitColumn] of cellsJustifyingHiddenSingle(question, frame, digit)) {
      involvedCells.add(cellKey(unitRow, unitColumn));
    }
  }
  return involvedCells;
}

/**
 * A hidden single is justified by its unit: every cell of that unit that still holds the digit
 * shows that the digit has no other place. None for a naked single or the hypothesis.
 */
function cellsJustifyingHiddenSingle(
  question: ExerciseQuestionData,
  frame: Frame,
  digit: number,
): Cell[] {
  const unit = hiddenSingleUnitOf(frame);
  if (unit === null) {
    return [];
  }
  return allCells().filter(
    (cell) => isInUnit(cell, unit) && candidatesOf(question, cell).includes(digit),
  );
}

/** The unit of a hidden single; null for a naked single, the hypothesis or the contradiction. */
function hiddenSingleUnitOf(frame: Frame): Unit | null {
  if (frame.kind !== 'forced' || frame.reason.kind !== 'hidden-single') {
    return null;
  }
  return frame.reason.unit;
}

function isInUnit([r, c]: Cell, unit: Unit): boolean {
  switch (unit.kind) {
    case 'row':
      return r === unit.index;
    case 'column':
      return c === unit.index;
    case 'box':
      return boxOf([r, c]) === unit.index;
  }
}

/** Box of a cell, 0..8, numbered row by row like the cells. */
function boxOf([r, c]: Cell): number {
  const boxRow = Math.floor(r / 3);
  const boxColumn = Math.floor(c / 3);
  return boxRow * 3 + boxColumn;
}

/** The 81 cells, row by row. */
function allCells(): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push([r, c]);
    }
  }
  return cells;
}
