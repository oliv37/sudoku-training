import { MoveData } from './move/move.model';

/** One grid file: the moves of a solved grid, in order (an exercise = this sequence of moves). */
export interface ExerciseData {
  nom: string;
  titre: string;
  exos: MoveData[];
}
