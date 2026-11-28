import { DrawnZone } from '../board-model';
import { TONE_BACKGROUNDS, toneColor } from '../board-theme';
import { rowCells } from '../testing/board-fixtures';
import { candidateShapes, gridLineShapes, digitShapes, zoneShapes } from './board-scene';

describe('board scene', () => {
  describe('grid lines', () => {
    const lines = gridLineShapes();

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
    it('are centred in their cell, with the text baseline 20 below the centre', () => {
      const shapes = digitShapes([
        { cell: [0, 0], digit: 5 },
        { cell: [4, 7], digit: 3 },
      ]);
      expect(shapes).toEqual([
        { key: '0,0', x: 48, y: 68, digit: 5 },
        { key: '4,7', x: 720, y: 452, digit: 3 },
      ]);
    });
  });

  describe('candidates', () => {
    it('are drawn at their place in the 3 × 3 layout of their cell', () => {
      const [one, nine] = candidateShapes([{ candidate: [0, 0, 1] }, { candidate: [0, 0, 9] }]);
      expect(one).toMatchObject({ key: '0,0,1', x: 20, y: 21, digit: 1 });
      expect(nine).toMatchObject({ key: '0,0,9', x: 76, y: 75, digit: 9 });
    });

    it('put the text baseline 8 below the centre, and the underline 13 below it, 16 wide', () => {
      const [one] = candidateShapes([{ candidate: [0, 0, 1] }]);
      expect(one.textY).toBe(29);
      expect(one.underline).toEqual({ x1: 12, y1: 34, x2: 28, y2: 34 });
    });

    it('are neither greyed nor underlined unless the drawing says so', () => {
      const [plain] = candidateShapes([{ candidate: [0, 0, 1] }]);
      expect(plain.greyed).toBe(false);
      expect(plain.underlined).toBe(false);
    });

    it('are greyed or underlined as the drawing says', () => {
      const [greyed, underlined] = candidateShapes([
        { candidate: [0, 0, 1], greyed: true },
        { candidate: [0, 0, 2], underlined: true },
      ]);
      expect(greyed).toMatchObject({ greyed: true, underlined: false });
      expect(underlined).toMatchObject({ greyed: false, underlined: true });
    });
  });

  describe('candidate marks', () => {
    it('are none on a candidate without marks', () => {
      const [plain] = candidateShapes([{ candidate: [0, 0, 1] }]);
      expect(plain.frame).toBeNull();
      expect(plain.strike).toBeNull();
      expect(plain.circle).toBeNull();
    });

    it('circle a candidate in the color of its tone, bold or not, hidden or not', () => {
      const [bold, hidden] = candidateShapes([
        { candidate: [0, 0, 5], circled: { tone: 'green', bold: true } },
        { candidate: [0, 1, 3], circled: { tone: 'blue', hidden: true } },
      ]);
      expect(bold.circle).toEqual({ hidden: false, color: toneColor('green'), bold: true });
      expect(hidden.circle).toEqual({ hidden: true, color: toneColor('blue'), bold: false });
    });

    it('strike a candidate with a diagonal, 9 from its centre on each side, in the color of its tone', () => {
      const [struck] = candidateShapes([
        { candidate: [0, 0, 1], struck: { tone: 'red', hidden: true } },
      ]);
      expect(struck.strike).toEqual({
        hidden: true,
        x1: 11,
        y1: 30,
        x2: 29,
        y2: 12,
        color: toneColor('red'),
      });
    });

    it('never strike a circled candidate', () => {
      const [circled] = candidateShapes([
        { candidate: [0, 0, 5], struck: { tone: 'red' }, circled: { tone: 'green' } },
      ]);
      expect(circled.strike).toBeNull();
      expect(circled.circle).not.toBeNull();
    });

    it('frame a candidate with a 28-unit square centred on it, over a light background', () => {
      const [framed] = candidateShapes([{ candidate: [0, 8, 5], framed: { tone: 'red' } }]);
      expect(framed.frame).toEqual({
        hidden: false,
        x: 802,
        y: 34,
        size: 28,
        color: toneColor('red'),
        background: TONE_BACKGROUNDS.red,
      });
    });
  });

  describe('zones', () => {
    it('are none when the drawing has none', () => {
      expect(zoneShapes([])).toEqual([]);
    });

    it('draw a green cell with a light green background and a solid outline 4 inside the cell', () => {
      const [zone] = zoneShapes([{ cells: [[1, 2]], fill: 'green', outline: 'solid' }]);
      expect(zone).toEqual({
        key: 'zone-0',
        fill: { x: 192, y: 96, width: 96, height: 96 },
        background: { kind: 'color', color: TONE_BACKGROUNDS.green },
        outline: { x: 196, y: 100, width: 88, height: 88 },
        outlineColor: toneColor('green'),
        outlineWidth: 5,
        outlineDashes: null,
      });
    });

    it('draw a hatched unit around the whole unit, with a red dashed outline 3 inside', () => {
      const [zone] = zoneShapes([{ cells: rowCells(3), fill: 'red-hatched', outline: 'dashed' }]);
      expect(zone).toEqual({
        key: 'zone-0',
        fill: { x: 0, y: 288, width: 864, height: 96 },
        background: { kind: 'hatch' },
        outline: { x: 3, y: 291, width: 858, height: 90 },
        outlineColor: toneColor('red'),
        outlineWidth: 4,
        outlineDashes: '12 7',
      });
    });

    it('keep the order of the drawing, so later zones are painted on top', () => {
      const zones: DrawnZone[] = [
        { cells: [[4, 8]], fill: 'red-hatched', outline: 'solid' },
        { cells: [[0, 0]], fill: 'green', outline: 'solid' },
      ];
      const shapes = zoneShapes(zones);
      expect(shapes.map(({ key, outlineColor }) => [key, outlineColor])).toEqual([
        ['zone-0', toneColor('red')],
        ['zone-1', toneColor('green')],
      ]);
    });
  });
});
