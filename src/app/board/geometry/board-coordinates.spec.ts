import {
  CELL_SIZE,
  GRID_SIZE,
  VIEW_BOX,
  candidateCenter,
  cellCenter,
  cellLeft,
  cellRect,
  cellTop,
  cellsRect,
} from './board-coordinates';
import { boxCells, rowCells } from '../board-test-data';

describe('board coordinates', () => {
  describe('grid', () => {
    it('is 9 cells of 96 units', () => {
      expect(CELL_SIZE).toBe(96);
      expect(GRID_SIZE).toBe(864);
    });

    it('has a margin of 4 units around the grid in the viewBox, for the thick outer lines', () => {
      expect(VIEW_BOX).toBe('-4 -4 872 872');
    });
  });

  describe('cells', () => {
    it('places column c at c × 96 from the left and row r at r × 96 from the top', () => {
      expect(cellLeft(0)).toBe(0);
      expect(cellLeft(3)).toBe(288);
      expect(cellTop(2)).toBe(192);
    });

    it('gives the centre of a cell', () => {
      expect(cellCenter([0, 0])).toEqual([48, 48]);
      expect(cellCenter([2, 3])).toEqual([336, 240]);
    });

    it('gives the rectangle of a cell', () => {
      expect(cellRect([0, 0])).toEqual({ x: 0, y: 0, width: 96, height: 96 });
    });

    it('shrinks the rectangle of a cell by the inset on each side', () => {
      expect(cellRect([1, 2], 4)).toEqual({ x: 196, y: 100, width: 88, height: 88 });
    });
  });

  describe('candidates', () => {
    it('lays out the candidates 3 × 3 in their cell: 1 2 3 on top, 4 5 6, then 7 8 9', () => {
      expect(candidateCenter([0, 0, 1])).toEqual([20, 21]);
      expect(candidateCenter([0, 0, 3])).toEqual([76, 21]);
      expect(candidateCenter([0, 0, 5])).toEqual([48, 48]);
      expect(candidateCenter([0, 0, 7])).toEqual([20, 75]);
      expect(candidateCenter([0, 0, 9])).toEqual([76, 75]);
    });

    it('moves the candidates with their cell', () => {
      expect(candidateCenter([1, 2, 1])).toEqual([212, 117]);
    });
  });

  describe('units', () => {
    it('gives the rectangle around a whole row', () => {
      expect(cellsRect(rowCells(3))).toEqual({ x: 0, y: 288, width: 864, height: 96 });
    });

    it('gives the rectangle around a box', () => {
      expect(cellsRect(boxCells(4))).toEqual({ x: 288, y: 288, width: 288, height: 288 });
    });

    it('shrinks the rectangle of a unit by the inset on each side', () => {
      expect(cellsRect(rowCells(3), 3)).toEqual({ x: 3, y: 291, width: 858, height: 90 });
    });
  });
});
