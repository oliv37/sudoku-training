import { Signal, computed, linkedSignal } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  type,
  withComputed,
  withLinkedState,
  withMethods,
} from '@ngrx/signals';
import { cellName } from '../../board/board-cells';
import { candidatesOf } from '../exercise-cells';
import { Frame } from '../exercise-solution/exercise-solution-model';
import { ExerciseQuestionData } from '../exercise-model';

/**
 * State of a candidate button:
 * - idle: not answered yet
 * - found: clicked and accepted
 * - wrong: clicked and not accepted
 * - answer: the expected answer, shown after a wrong click
 * - inactive: any other candidate once answered
 */
export type CandidateState = 'idle' | 'found' | 'wrong' | 'answer' | 'inactive';

/** One candidate of the start cell, as a button the user can click. */
export interface ExerciseCandidate {
  digit: number;
  state: CandidateState;
}

/** What the user sees once they answered. */
export interface ExerciseAnswerResult {
  found: boolean;
  /** Why the candidate must be eliminated, e.g. "…, so R3C4 ≠ 7". */
  explanation: string;
  /** What should have caught the user's eye; only after a wrong answer. */
  missedClue: string | null;
}

/**
 * Part of `ExerciseStore`: the candidate the user chose for the current question, whether it is
 * accepted, and the solution diagram to show.
 */
export function withAnswer() {
  return signalStoreFeature(
    { props: type<{ question: Signal<ExerciseQuestionData | null> }>() },

    withLinkedState(({ question }) => ({
      /** Candidate chosen by the user, null before answering. Back to null for every new question. */
      answer: linkedSignal<ExerciseQuestionData | null, number | null>({
        source: question,
        computation: () => null,
      }),
    })),

    withComputed(({ question, answer }) => {
      const answered = computed(() => answer() !== null);

      /**
       * Solution diagram of the chosen candidate if it is accepted; null if it is not accepted or
       * before answering. The one place that decides whether the answer is accepted.
       */
      const acceptedFrames = computed((): Frame[] | null => {
        const current = question();
        const chosen = answer();
        if (current === null || chosen === null) {
          return null;
        }
        return acceptedSolution(current, chosen);
      });

      const found = computed(() => acceptedFrames() !== null);

      /**
       * Solution diagram to draw: the one of the chosen candidate if accepted, else the one of
       * the expected answer. Null before answering.
       */
      const solution = computed((): Frame[] | null => {
        const current = question();
        if (current === null || !answered()) {
          return null;
        }
        return acceptedFrames() ?? current.frames;
      });

      const candidates = computed((): ExerciseCandidate[] => {
        const current = question();
        if (current === null) {
          return [];
        }
        const chosen = answer();
        const isFound = found();
        const digits = candidatesOf(current, current.depart);
        return digits.map((digit) => ({
          digit,
          state: candidateState(digit, { chosen, found: isFound, expected: current.reponse }),
        }));
      });

      const result = computed((): ExerciseAnswerResult | null => {
        const current = question();
        const chosen = answer();
        if (current === null || chosen === null) {
          return null;
        }
        const isFound = found();
        return {
          found: isFound,
          explanation: explanationOf(current, eliminatedDigit(current, chosen, isFound)),
          missedClue: isFound ? null : current.piste,
        };
      });

      return { answered, found, solution, candidates, result };
    }),

    withMethods((store) => ({
      /** The user picks a candidate; only the first click counts. */
      choose(digit: number): void {
        if (store.answered()) {
          return;
        }
        patchState(store, { answer: digit });
      },

      /** Back to the same question, unanswered. */
      reset(): void {
        patchState(store, { answer: null });
      },
    })),
  );
}

/**
 * Solution diagram of `digit` if it is an accepted answer (the expected one or one of the other
 * accepted answers), null otherwise.
 */
function acceptedSolution(question: ExerciseQuestionData, digit: number): Frame[] | null {
  if (digit === question.reponse) {
    return question.frames;
  }
  const otherAnswer = question.autresReponses.find((other) => other.v === digit);
  if (otherAnswer === undefined) {
    return null;
  }
  return otherAnswer.frames;
}

/** What the user answered, as needed to color each candidate button. */
interface AnswerSummary {
  /** Candidate chosen by the user; null before answering. */
  chosen: number | null;
  /** Whether the chosen candidate is accepted. */
  found: boolean;
  /** The expected answer (`reponse`). */
  expected: number;
}

/** State of the button of `digit`, given what the user answered. */
function candidateState(digit: number, { chosen, found, expected }: AnswerSummary): CandidateState {
  if (chosen === null) {
    return 'idle';
  }
  if (digit === chosen) {
    return found ? 'found' : 'wrong';
  }
  // After a wrong answer, point at the expected one.
  if (!found && digit === expected) {
    return 'answer';
  }
  return 'inactive';
}

/** Candidate shown as eliminated in the explanation: the chosen one if accepted, else the expected one. */
function eliminatedDigit(question: ExerciseQuestionData, chosen: number, found: boolean): number {
  if (found) {
    return chosen;
  }
  return question.reponse;
}

function explanationOf(question: ExerciseQuestionData, eliminated: number): string {
  const startCell = cellName(question.depart);
  return `${question.texte}, so ${startCell} ≠ ${eliminated}.`;
}
