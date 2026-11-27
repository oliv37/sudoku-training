import { RedZone } from '../board-model';
import { boardWith, rowCells } from '../board-test-data';
import { boardSceneOf, candidateTexts, gridLines, valueTexts } from './board-scene';
import { allCellKeys } from '../board-cells';

describe('board scene', () => {
  describe('grid lines', () => {
    const lines = gridLines();

    it('has 10 horizontal and 10 vertical lines', () => {
      expect(lines.length).toBe(20);
    });

    it('draws the thick lines every 3 cells: between boxes and around the grid', () => {
      const thickPositions = new Set<number>();
      for (const line of lines.filter((line) => line.thick)) {
        thickPositions.add(line.x1 === line.x2 ? line.x1 : line.y1);
      }
      expect(thickPositions).toEqual(new Set([0, 288, 576, 864]));
    });

    it('draws the thin lines first, so the thick ones are painted on top', () => {
      const thickness = lines.map((line) => line.thick);
      const firstThick = thickness.indexOf(true);
      expect(thickness.slice(0, firstThick).every((thick) => !thick)).toBe(true);
      expect(thickness.slice(firstThick).every((thick) => thick)).toBe(true);
    });

    it('draws each line across the whole grid', () => {
      const horizontal = lines.find((line) => line.y1 === line.y2 && line.y1 === 96);
      expect(horizontal).toEqual({ x1: 0, y1: 96, x2: 864, y2: 96, thick: false });
    });
  });

  describe('placed digits', () => {
    it('are drawn in the filled cells only, centred, with the text baseline 20 below the centre', () => {
      const board = boardWith({ values: { '0,0': 5, '4,7': 3 } });
      expect(valueTexts(board)).toEqual([
        { key: '0,0', x: 48, y: 68, value: 5 },
        { key: '4,7', x: 720, y: 452, value: 3 },
      ]);
    });
  });

  describe('candidates', () => {
    it('are drawn at their place in the 3 × 3 layout of their cell', () => {
      const board = boardWith({ candidates: { '0,0': [1, 9] } });
      const [one, nine] = candidateTexts(board, allCellKeys());
      expect(one).toMatchObject({ key: '0,0,1', x: 20, y: 21, digit: 1 });
      expect(nine).toMatchObject({ key: '0,0,9', x: 76, y: 75, digit: 9 });
    });

    it('put the text baseline 8 below the centre, and the underline 13 below it, 16 wide', () => {
      const board = boardWith({ candidates: { '0,0': [1] } });
      const [one] = candidateTexts(board, allCellKeys());
      expect(one.textY).toBe(29);
      expect(one.underline).toEqual({ x1: 12, y1: 34, x2: 28, y2: 34 });
    });

    it('are not drawn in a filled cell', () => {
      const board = boardWith({ values: { '0,0': 5 }, candidates: { '0,0': [1, 9] } });
      expect(candidateTexts(board, allCellKeys())).toEqual([]);
    });

    it('are never greyed when every cell is involved (no solution shown)', () => {
      const board = boardWith({ candidates: { '0,0': [1], '8,8': [2] } });
      expect(candidateTexts(board, allCellKeys()).map((candidate) => candidate.greyed)).toEqual([
        false,
        false,
      ]);
    });

    it('are greyed in the cells not involved in the solution', () => {
      const board = boardWith({ candidates: { '0,0': [1], '8,8': [2] } });
      const involvedCells = new Set(['0,0']);
      const [involved, notInvolved] = candidateTexts(board, involvedCells);
      expect(involved.greyed).toBe(false);
      expect(notInvolved.greyed).toBe(true);
    });

    it('are underlined only when listed in `under`', () => {
      const board = boardWith({ candidates: { '0,0': [1, 2] }, underlined: [[0, 0, 2]] });
      const [one, two] = candidateTexts(board, allCellKeys());
      expect(one.underlined).toBe(false);
      expect(two.underlined).toBe(true);
    });
  });

  describe('question marks', () => {
    const board = boardWith({});

    it('are absent when the board has no highlights', () => {
      const scene = boardSceneOf(board, {}, allCellKeys());
      expect(scene.start).toBeNull();
      expect(scene.redZone).toBeNull();
    });

    it('draw the start cell with its outline 4 inside the cell, so the grid lines do not cover it', () => {
      const scene = boardSceneOf(board, { start: [1, 2] }, allCellKeys());
      expect(scene.start).toEqual({
        fill: { x: 192, y: 96, width: 96, height: 96 },
        outline: { x: 196, y: 100, width: 88, height: 88 },
      });
    });

    it('draw a unit red zone around the whole unit, with its outline 3 inside', () => {
      const row = rowCells(3);
      const scene = boardSceneOf(
        board,
        { redZone: { type: 'unit', cases: row, digit: 6 } },
        allCellKeys(),
      );
      expect(scene.redZone).toEqual({
        kind: 'unit',
        fill: { x: 0, y: 288, width: 864, height: 96 },
        outline: { x: 3, y: 291, width: 858, height: 90 },
      });
    });

    it('draw a cell red zone around the cell, with its outline 4 inside', () => {
      const redZone: RedZone = { type: 'cell', cases: [[4, 8]], digit: null };
      const scene = boardSceneOf(board, { redZone }, allCellKeys());
      expect(scene.redZone).toEqual({
        kind: 'cell',
        fill: { x: 768, y: 384, width: 96, height: 96 },
        outline: { x: 772, y: 388, width: 88, height: 88 },
      });
    });
  });
});
