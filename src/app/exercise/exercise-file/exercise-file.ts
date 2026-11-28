/**
 * Reads a grid file (format of the Python export, exercise-file-model.ts) into the model the app
 * uses (exercise-model.ts): the only place that knows the file format and its French names.
 */
import { Cell } from '../../board/board-model';
import { ExerciseData, ExerciseQuestionData, OtherAnswer, RedZone } from '../exercise-model';
import { ForcedReason, Frame, Unit } from '../exercise-solution/exercise-solution-model';
import {
  ArrivalFile,
  ExerciseFile,
  FrameFile,
  OtherAnswerFile,
  QuestionFile,
} from './exercise-file-model';

/** A hidden single in the file: "caché ligne 3", "caché colonne 2", "caché bloc 5" (1..9). */
const HIDDEN_SINGLE_REASON = /^caché (ligne|colonne|bloc) (\d)$/;

/** Unit kinds as named in the file. */
const UNIT_KINDS: Record<string, Unit['kind']> = {
  ligne: 'row',
  colonne: 'column',
  bloc: 'box',
};

/**
 * The exercise of a grid file, as received from the server. The file comes from our own export,
 * so it is trusted and not validated.
 */
export function parseExerciseFile(file: unknown): ExerciseData {
  return exerciseOf(file as ExerciseFile);
}

function exerciseOf(file: ExerciseFile): ExerciseData {
  return {
    name: file.nom,
    title: file.titre,
    questions: file.exos.map(questionOf),
  };
}

function questionOf(question: QuestionFile): ExerciseQuestionData {
  return {
    digits: question.vals,
    candidates: candidatesByCellOf(question.cands),
    underlined: question.under,
    startCell: question.depart,
    redZone: redZoneOf(question.arrivee),
    expectedAnswer: question.reponse,
    otherAnswers: question.autresReponses.map(otherAnswerOf),
    solution: solutionOf(question.frames),
    stepCount: question.etapes,
    contradiction: question.texte,
    missedClue: question.piste,
  };
}

/** The candidates of the 81 cells, row by row; none for a cell missing from the file (filled). */
function candidatesByCellOf(candidatesByKey: Record<string, number[]>): number[][] {
  const candidates: number[][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      candidates.push(candidatesByKey[fileCellKey([r, c])] ?? []);
    }
  }
  return candidates;
}

/** Key of a cell in the `cands` of the file: "r,c" (0..8). */
function fileCellKey([r, c]: Cell): string {
  return `${r},${c}`;
}

function redZoneOf(arrival: ArrivalFile): RedZone {
  return {
    kind: arrival.type,
    name: arrival.nom,
    digit: arrival.chiffre,
    cells: arrival.cases,
  };
}

function otherAnswerOf(otherAnswer: OtherAnswerFile): OtherAnswer {
  return {
    answer: otherAnswer.v,
    solution: solutionOf(otherAnswer.frames),
    stepCount: otherAnswer.etapes,
  };
}

function solutionOf(frames: FrameFile[]): Frame[] {
  return frames.map(frameOf);
}

function frameOf(frame: FrameFile): Frame {
  switch (frame.kind) {
    case 'hyp':
      return { kind: 'hypothesis', placement: frame.circle, eliminations: frame.strikes };
    case 'dom':
      return {
        kind: 'forced',
        placement: frame.circle,
        eliminations: frame.strikes,
        causeStep: frame.cause,
        reason: reasonOf(frame.why),
      };
    case 'bad':
      return { kind: 'contradiction', cells: frame.cells };
  }
}

/**
 * "nu" is a naked single, "caché ligne 3" a hidden single in row 3. Any other reason is read as a
 * naked single: no unit justifies it on the board.
 */
function reasonOf(why: string): ForcedReason {
  const match = HIDDEN_SINGLE_REASON.exec(why);
  if (match === null) {
    return { kind: 'naked-single' };
  }
  const unit: Unit = { kind: UNIT_KINDS[match[1]], index: Number(match[2]) - 1 };
  return { kind: 'hidden-single', unit };
}
