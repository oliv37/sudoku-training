/**
 * Questions and solution chains written by hand, shared by the exercise tests. Used by the
 * `*.spec.ts` files only.
 */
import { Cell, CellDigit } from '../../board/board-model';
import { Arrival, ExerciseQuestionData } from '../exercise-model';
import { BadFrame, DomFrame, HypFrame } from '../exercise-solution/exercise-solution-model';

/**
 * A question with only the given placed digits, candidates (both keyed "r,c"), underlined
 * candidates, start cell and red zone; the other fields are left empty.
 */
export function questionWith({
  values = {},
  candidates = {},
  underlined = [],
  start = [0, 0],
  redZone = { type: 'cell', nom: 'R9C9', chiffre: null, cases: [[8, 8]] },
}: {
  values?: Record<string, number>;
  candidates?: Record<string, number[]>;
  underlined?: CellDigit[];
  start?: Cell;
  redZone?: Arrival;
}): ExerciseQuestionData {
  const vals = new Array<number>(81).fill(0);
  for (const [key, value] of Object.entries(values)) {
    const [r, c] = key.split(',').map(Number);
    vals[r * 9 + c] = value;
  }
  return {
    coup: 1,
    vals,
    givens: new Array<number>(81).fill(0),
    cands: candidates,
    under: underlined,
    depart: start,
    reponse: 0,
    autresReponses: [],
    arrivee: redZone,
    texte: '',
    frames: [],
    etapes: 0,
    piste: null,
  };
}

/** Frame 0 of a chain: the hypothesis. */
export function hypothesis(circle: CellDigit, strikes: CellDigit[] = []): HypFrame {
  return { kind: 'hyp', circle, strikes };
}

/** A forced placement caused by the frame `cause`; a naked single unless `why` says otherwise. */
export function forced(
  circle: CellDigit,
  cause: number,
  strikes: CellDigit[] = [],
  why = 'nu',
): DomFrame {
  return { kind: 'dom', circle, strikes, cause, why };
}

/** Last frame of a chain: the contradiction. */
export function contradiction(): BadFrame {
  return { kind: 'bad', cells: [], unit: null };
}
