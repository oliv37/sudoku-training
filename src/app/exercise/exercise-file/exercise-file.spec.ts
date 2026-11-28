import gridFile from '../../../../public/data/exercices-2026-11-14.json';
import { parseExerciseFile } from './exercise-file';
import { DomFrameFile, ExerciseFile, QuestionFile } from './exercise-file-model';

/** A question of the file with only what a test needs; the other fields are left empty. */
function questionFileWith(fields: Partial<QuestionFile>): QuestionFile {
  return {
    coup: 1,
    vals: new Array<number>(81).fill(0),
    givens: new Array<number>(81).fill(0),
    cands: {},
    under: [],
    depart: [0, 0],
    reponse: 0,
    autresReponses: [],
    arrivee: { type: 'cell', nom: 'R9C9', chiffre: null, cases: [[8, 8]] },
    texte: '',
    frames: [],
    etapes: 0,
    piste: null,
    ...fields,
  };
}

/** The one question of a file made of `question` alone. */
function parsedQuestion(question: QuestionFile) {
  const file: ExerciseFile = { nom: '2026-01-01', titre: 'January 1 grid', exos: [question] };
  return parseExerciseFile(file).questions[0];
}

/** A forced placement whose reason in the file is `why`. */
function forcedFrameFile(why: string): DomFrameFile {
  return { kind: 'dom', circle: [1, 1, 2], strikes: [], cause: 0, why };
}

describe('exercise file', () => {
  it('reads the name, the title and the questions of the grid', () => {
    const file: ExerciseFile = {
      nom: '2026-01-01',
      titre: 'January 1 grid',
      exos: [questionFileWith({}), questionFileWith({ coup: 2 })],
    };
    const exercise = parseExerciseFile(file);
    expect(exercise.name).toBe('2026-01-01');
    expect(exercise.title).toBe('January 1 grid');
    expect(exercise.questions.length).toBe(2);
  });

  it('reads what is asked, the expected answer and the texts of a question', () => {
    const question = parsedQuestion(
      questionFileWith({
        under: [[0, 1, 4]],
        depart: [1, 5],
        reponse: 6,
        arrivee: { type: 'unit', nom: 'box 3', chiffre: 6, cases: [[0, 6]] },
        etapes: 2,
        texte: 'No 6 left in box 3',
        piste: 'Look at box 3',
      }),
    );
    expect(question.underlined).toEqual([[0, 1, 4]]);
    expect(question.startCell).toEqual([1, 5]);
    expect(question.expectedAnswer).toBe(6);
    expect(question.redZone).toEqual({ kind: 'unit', name: 'box 3', digit: 6, cells: [[0, 6]] });
    expect(question.stepCount).toBe(2);
    expect(question.contradiction).toBe('No 6 left in box 3');
    expect(question.missedClue).toBe('Look at box 3');
  });

  it('reads the placed digits and the candidates of the 81 cells, row by row', () => {
    const vals = new Array<number>(81).fill(0);
    vals[14] = 6;
    const question = parsedQuestion(questionFileWith({ vals, cands: { '8,8': [2, 7] } }));
    expect(question.digits[14]).toBe(6);
    expect(question.candidates.length).toBe(81);
    expect(question.candidates[80]).toEqual([2, 7]);
    // A cell missing from `cands` (a filled one) has no candidates.
    expect(question.candidates[14]).toEqual([]);
  });

  it('reads the other accepted answers with their own solution', () => {
    const question = parsedQuestion(
      questionFileWith({
        autresReponses: [
          { v: 8, frames: [{ kind: 'hyp', circle: [0, 0, 8], strikes: [] }], etapes: 3 },
        ],
      }),
    );
    expect(question.otherAnswers).toEqual([
      {
        answer: 8,
        solution: [{ kind: 'hypothesis', placement: [0, 0, 8], eliminations: [] }],
        stepCount: 3,
      },
    ]);
  });

  describe('solution', () => {
    it('reads the hypothesis, the forced placements and the contradiction', () => {
      const question = parsedQuestion(
        questionFileWith({
          frames: [
            { kind: 'hyp', circle: [0, 0, 5], strikes: [[0, 1, 5]] },
            { kind: 'dom', circle: [0, 1, 3], strikes: [[0, 8, 3]], cause: 0, why: 'nu' },
            { kind: 'bad', cells: [[0, 8]], strikes: [], unit: null },
          ],
        }),
      );
      expect(question.solution).toEqual([
        { kind: 'hypothesis', placement: [0, 0, 5], eliminations: [[0, 1, 5]] },
        {
          kind: 'forced',
          placement: [0, 1, 3],
          eliminations: [[0, 8, 3]],
          causeStep: 0,
          reason: { kind: 'naked-single' },
        },
        { kind: 'contradiction', cells: [[0, 8]] },
      ]);
    });

    it('reads a hidden single in a row, a column or a box, counting units from 0', () => {
      const reasons = ['caché ligne 3', 'caché colonne 1', 'caché bloc 9'].map((why) => {
        const [frame] = parsedQuestion(
          questionFileWith({ frames: [forcedFrameFile(why)] }),
        ).solution;
        return frame.kind === 'forced' ? frame.reason : null;
      });
      expect(reasons).toEqual([
        { kind: 'hidden-single', unit: { kind: 'row', index: 2 } },
        { kind: 'hidden-single', unit: { kind: 'column', index: 0 } },
        { kind: 'hidden-single', unit: { kind: 'box', index: 8 } },
      ]);
    });

    it('reads any other reason as a naked single', () => {
      const [frame] = parsedQuestion(
        questionFileWith({ frames: [forcedFrameFile('something else')] }),
      ).solution;
      expect(frame).toMatchObject({ reason: { kind: 'naked-single' } });
    });
  });

  it('reads every question of a real grid file into a chain from a hypothesis to a contradiction', () => {
    const exercise = parseExerciseFile(gridFile);
    expect(exercise.name).toBe('2026-11-14');
    expect(exercise.questions.length).toBe(20);
    for (const question of exercise.questions) {
      expect(question.solution.at(0)?.kind).toBe('hypothesis');
      expect(question.solution.at(-1)?.kind).toBe('contradiction');
    }
  });
});
