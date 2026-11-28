/**
 * Questions and solution chains written by hand, shared by the exercise tests. Used by the
 * `*.spec.ts` files only.
 */
import { Cell, CellDigit } from '../../board/board-model';
import { ExerciseQuestionData, RedZone } from '../exercise-model';
import {
  ContradictionFrame,
  ForcedFrame,
  ForcedReason,
  HypothesisFrame,
  Unit,
} from '../exercise-solution/exercise-solution-model';

/**
 * A question with only the given placed digits and candidates (both keyed "r,c"), underlined
 * candidates, start cell and red zone; the other fields are left empty.
 */
export function questionWith({
  digits = {},
  candidates = {},
  underlined = [],
  startCell = [0, 0],
  redZone = { kind: 'cell', name: 'R9C9', digit: null, cells: [[8, 8]] },
}: {
  digits?: Record<string, number>;
  candidates?: Record<string, number[]>;
  underlined?: CellDigit[];
  startCell?: Cell;
  redZone?: RedZone;
}): ExerciseQuestionData {
  const digitsByCell = new Array<number>(81).fill(0);
  const candidatesByCell: number[][] = [];
  for (let index = 0; index < 81; index++) {
    candidatesByCell.push([]);
  }
  for (const [key, digit] of Object.entries(digits)) {
    digitsByCell[cellIndexOf(key)] = digit;
  }
  for (const [key, cellCandidates] of Object.entries(candidates)) {
    candidatesByCell[cellIndexOf(key)] = cellCandidates;
  }
  return {
    digits: digitsByCell,
    candidates: candidatesByCell,
    underlined,
    startCell,
    redZone,
    expectedAnswer: 0,
    otherAnswers: [],
    solution: [],
    stepCount: 0,
    contradiction: '',
    missedClue: null,
  };
}

/** Index r × 9 + c of the cell keyed "r,c". */
function cellIndexOf(key: string): number {
  const [r, c] = key.split(',').map(Number);
  return r * 9 + c;
}

/** Frame 0 of a chain: the hypothesis. */
export function hypothesis(placement: CellDigit, eliminations: CellDigit[] = []): HypothesisFrame {
  return { kind: 'hypothesis', placement, eliminations };
}

/** A forced placement caused by the frame `causeStep`; a naked single unless `reason` says otherwise. */
export function forced(
  placement: CellDigit,
  causeStep: number,
  eliminations: CellDigit[] = [],
  reason: ForcedReason = { kind: 'naked-single' },
): ForcedFrame {
  return { kind: 'forced', placement, eliminations, causeStep, reason };
}

/** The reason of a hidden single in a unit (index 0..8). */
export function hiddenSingleIn(kind: Unit['kind'], index: number): ForcedReason {
  return { kind: 'hidden-single', unit: { kind, index } };
}

/** Last frame of a chain: the contradiction. */
export function contradiction(): ContradictionFrame {
  return { kind: 'contradiction', cells: [] };
}
