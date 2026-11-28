/**
 * The arrows of the questions of a grid file, from the question to the board scene: the drawing
 * of the solution (exercise-board-drawing.ts), then the board routing. Proves that the arrows are
 * still those of the reference renderer.
 */
import gridFile from '../../../../public/data/exercices-2026-11-14.json';
import { arrowsSceneOf } from '../../board/board-arrows/geometry/board-arrows-scene';
import { BoardDrawing } from '../../board/board-model';
import { lastStep } from '../exercise-solution/exercise-solution';
import { ExerciseData, ExerciseQuestionData } from '../exercise-model';
import { boardDrawingOf } from './exercise-board-drawing';

// TypeScript infers a literal type from the JSON content (each question its own `cands` keys),
// which does not match `ExerciseData` directly.
const questions = (gridFile as unknown as ExerciseData).exos;

/** The drawing of a question with its whole solution shown. */
function wholeSolutionDrawingOf(question: ExerciseQuestionData): BoardDrawing {
  return boardDrawingOf(question, {
    frames: question.frames,
    shownStep: lastStep(question.frames),
  });
}

/** Arrows and badges of the whole solution of a question. */
function arrowsSceneOfQuestion(question: ExerciseQuestionData) {
  return arrowsSceneOf(wholeSolutionDrawingOf(question));
}

/**
 * The arrows and badges in the shape the snapshot was taken with, before the board was made
 * generic: keyed and numbered by their step (`frame`), the badge label as a number (`step`). Each
 * arrow is labelled with its step, and every arrow of these questions is drawn, so the arrow, the
 * badge and the drawn arrow of a same index go together.
 */
function inSnapshotShape(question: ExerciseQuestionData) {
  const drawing = wholeSolutionDrawingOf(question);
  const scene = arrowsSceneOf(drawing);
  const stepOfArrow = (index: number) => Number(drawing.arrows[index].label);
  const arrows = scene.arrows.map(({ path, head, color }, index) => ({
    key: `a${stepOfArrow(index)}`,
    frame: stepOfArrow(index),
    path,
    head,
    color,
  }));
  const badges = scene.badges.map(({ x, y, textY, label, color }) => ({
    key: `b${label}`,
    frame: Number(label),
    x,
    y,
    textY,
    step: Number(label),
    color,
  }));
  expect(arrows.length).toBe(drawing.arrows.length);
  return { arrows, badges };
}

// The describe and test names are those of the snapshot keys (the snapshot was taken when these
// tests were in the board): keep them, or the snapshot would no longer be compared.
describe('board solution arrows', () => {
  describe('same arrows as the reference renderer', () => {
    // Snapshot of every arrow and badge of the 20 questions of the 2026-11-14 grid, taken from
    // code checked against `renderCard` (the scene snapshot taken before the refactor). Never
    // update it to make a test pass: if it differs, the routing changed.
    it.each(questions.map((question) => [question.coup, question] as const))(
      'places the arrows of question %i as before',
      (_questionNumber, question) => {
        expect(inSnapshotShape(question)).toMatchSnapshot();
      },
    );

    // Exact output for question 1 of the 2026-11-14 grid, identical to `renderCard` (checked
    // against the snapshot taken before the refactor). If this test fails, the routing changed.
    it('places the two arrows of question 1 exactly', () => {
      const scene = arrowsSceneOfQuestion(questions[0]);

      expect(scene.arrows.map(({ path, head }) => ({ path, head }))).toEqual([
        {
          path: 'M554.8445274471608 160.96068640060406 Q608.1872156002389 348.99751508731566 529.8351622898034 528.0624392460994',
          head: 'M525.4256284765836 538.139939509065 L523.8802757707783 525.4568056291968 L535.7900488088285 530.6680728630021 Z',
        },
        {
          path: 'M544.8734014774932 552.929173455035 Q634.1172348595609 550.9090666308721 721.2010682416285 531.2889598067093',
          head: 'M731.9320825320067 528.8712476030548 L722.6297163619697 537.6300137055691 L719.7724201212873 524.9479059078494 Z',
        },
      ]);
      expect(scene.badges.map(({ x, y }) => [x, y])).toEqual([
        [575.2635302343605, 346.7545389553337],
        [633.5772348595608, 546.5090666308721],
      ]);
    });
  });
});
