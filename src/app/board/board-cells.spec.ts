import { candidateKey, cellKey, cellName } from './board-cells';

describe('board cells', () => {
  describe('cellName', () => {
    it('names a cell RxCy, counting rows and columns from 1', () => {
      expect(cellName([0, 0])).toBe('R1C1');
      expect(cellName([1, 5])).toBe('R2C6');
      expect(cellName([8, 8])).toBe('R9C9');
    });
  });

  describe('keys', () => {
    it('key a cell "r,c", counting from 0', () => {
      expect(cellKey(1, 5)).toBe('1,5');
    });

    it('key a candidate "r,c,digit"', () => {
      expect(candidateKey([1, 5, 7])).toBe('1,5,7');
    });
  });
});
