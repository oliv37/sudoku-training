import { candidatesOf, cellValueOf } from './exercise-cells';
import { questionWith } from './testing/exercise-fixtures';

describe('exercise cells', () => {
  describe('cellValueOf', () => {
    // Values are stored row by row: R2C6 is at index 1 × 9 + 5 = 14.
    const question = questionWith({ digits: { '1,5': 6, '8,8': 9 } });

    it('reads the digit placed in a cell, row by row', () => {
      expect(question.digits[14]).toBe(6);
      expect(cellValueOf(question, [1, 5])).toBe(6);
      expect(cellValueOf(question, [8, 8])).toBe(9);
    });

    it('gives 0 for an empty cell', () => {
      expect(cellValueOf(question, [0, 0])).toBe(0);
    });
  });

  describe('candidatesOf', () => {
    const question = questionWith({ candidates: { '1,5': [2, 7] } });

    it('reads the candidates of a cell', () => {
      expect(candidatesOf(question, [1, 5])).toEqual([2, 7]);
    });

    it('gives none for a cell without candidates listed (a filled cell)', () => {
      expect(candidatesOf(question, [0, 0])).toEqual([]);
    });
  });
});
