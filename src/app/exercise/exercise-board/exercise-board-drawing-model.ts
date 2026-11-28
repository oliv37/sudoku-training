/** Types used while building the board drawing of a question (exercise-board-drawing.ts). */
import {
  CandidateCircle,
  CandidateFrame,
  CandidateStrike,
  CellDigit,
} from '../../board/board-model';

/** The marks the solution puts on a candidate. */
export interface CandidateMarks {
  struck?: CandidateStrike;
  circled?: CandidateCircle;
  framed?: CandidateFrame;
}

/** A candidate marked by the solution, with its marks. */
export interface MarkedCandidate {
  candidate: CellDigit;
  marks: CandidateMarks;
}
