import { candidateKey, candidatesOf, cellKey, cellName, cellValueOf } from './board-cells';
import { BoardData } from './board-model';

describe('board cells', () => {
  describe('cellName', () => {
    it('names a cell RxCy, counting rows and columns from 1', () => {
      expect(cellName([0, 0])).toBe('R1C1');
      expect(cellName([1, 5])).toBe('R2C6');
      expect(cellName([8, 8])).toBe('R9C9');
    });
  });

  describe('keys', () => {
    it('key a cell "r,c", counting from 0 like the candidates of the JSON', () => {
      expect(cellKey(1, 5)).toBe('1,5');
    });

    it('key a candidate "r,c,digit"', () => {
      expect(candidateKey([1, 5, 7])).toBe('1,5,7');
    });
  });

  describe('cellValueOf', () => {
    // Values are stored row by row: R2C6 is at index 1 × 9 + 5 = 14.
    const vals = new Array<number>(81).fill(0);
    vals[14] = 6;
    vals[80] = 9;
    const board: BoardData = { vals, cands: {} };

    it('reads the digit placed in a cell, row by row', () => {
      expect(cellValueOf(board, [1, 5])).toBe(6);
      expect(cellValueOf(board, [8, 8])).toBe(9);
    });

    it('gives 0 for an empty cell', () => {
      expect(cellValueOf(board, [0, 0])).toBe(0);
    });
  });

  describe('candidatesOf', () => {
    const board: BoardData = { vals: new Array<number>(81).fill(0), cands: { '1,5': [2, 7] } };

    it('reads the candidates of a cell', () => {
      expect(candidatesOf(board, [1, 5])).toEqual([2, 7]);
    });

    it('gives none for a cell without candidates listed (a filled cell)', () => {
      expect(candidatesOf(board, [0, 0])).toEqual([]);
    });
  });
});
