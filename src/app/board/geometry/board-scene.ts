/**
 * Builds the scene of the grid that the board layers draw: lines, placed digits, candidates and
 * the question marks (start cell, red zone). The solution diagram is built in board-solution/geometry/board-solution-scene.ts.
 */
import { BoardData, Cell, CellDigit, Highlights, RedZone } from '../board-model';
import { candidateKey, candidatesOf, cellKey, cellValueOf } from '../board-cells';
import {
  BoardScene,
  CandidateText,
  GridLine,
  RedZoneShape,
  StartCellShape,
  ValueText,
} from './board-scene-model';
import {
  GRID_SIZE,
  CELL_SIZE,
  candidateCenter,
  cellCenter,
  cellRect,
  cellsRect,
} from './board-coordinates';

/** `y` of a placed digit is the baseline of its text: this far below the centre of the cell. */
const VALUE_BASELINE_OFFSET = 20;
/** Same for a candidate (smaller text). */
const CANDIDATE_BASELINE_OFFSET = 8;
/** The underline of a candidate: this far below its centre, this wide on each side. */
const UNDERLINE_OFFSET_Y = 13;
const UNDERLINE_HALF_WIDTH = 8;

/**
 * Everything needed to draw a board and its (optional) start cell and red zone.
 * `involvedCells`: cells involved in the solution, the others are greyed (all cells when no solution
 * is shown: `allCellKeys()`).
 */
export function boardSceneOf(
  board: BoardData,
  highlights: Highlights,
  involvedCells: Set<string>,
): BoardScene {
  const { start, redZone } = highlights;
  return {
    lines: gridLines(),
    values: valueTexts(board),
    candidates: candidateTexts(board, involvedCells),
    start: start ? startCellOf(start) : null,
    redZone: redZone ? redZoneOf(redZone) : null,
  };
}

/** Thin lines between cells, thick lines between boxes and around the grid. */
export function gridLines(): GridLine[] {
  const thinLines: GridLine[] = [];
  const thickLines: GridLine[] = [];
  for (let index = 0; index <= 9; index++) {
    const position = index * CELL_SIZE;
    const thick = index % 3 === 0;
    const horizontal = { x1: 0, y1: position, x2: GRID_SIZE, y2: position, thick };
    const vertical = { x1: position, y1: 0, x2: position, y2: GRID_SIZE, thick };
    if (thick) {
      thickLines.push(horizontal, vertical);
    } else {
      thinLines.push(horizontal, vertical);
    }
  }
  // Thin lines first so the thick box lines are drawn on top.
  return [...thinLines, ...thickLines];
}

/** Green start cell; its outline is drawn inside the cell, so the grid lines do not cover it. */
function startCellOf(cell: Cell): StartCellShape {
  return { fill: cellRect(cell), outline: cellRect(cell, 4) };
}

/** Red zone: the hatched unit or cell; its outline is drawn inside, like the start cell's. */
function redZoneOf({ type, cases }: RedZone): RedZoneShape {
  if (type === 'unit') {
    return { kind: 'unit', fill: cellsRect(cases), outline: cellsRect(cases, 3) };
  }
  const cell = cases[0];
  return { kind: 'cell', fill: cellRect(cell), outline: cellRect(cell, 4) };
}

/** Placed digits (large digits of the filled cells). */
export function valueTexts(board: BoardData): ValueText[] {
  const texts: ValueText[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const value = cellValueOf(board, [r, c]);
      if (value === 0) {
        continue;
      }
      const [x, centerY] = cellCenter([r, c]);
      texts.push({ key: cellKey(r, c), x, y: centerY + VALUE_BASELINE_OFFSET, value });
    }
  }
  return texts;
}

/**
 * Candidates (small digits) of the empty cells, with their underline.
 * `involvedCells`: cells involved in the solution, the others are greyed.
 */
export function candidateTexts(board: BoardData, involvedCells: Set<string>): CandidateText[] {
  const underlinedKeys = new Set((board.under ?? []).map(candidateKey));
  const texts: CandidateText[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (cellValueOf(board, [r, c]) !== 0) {
        continue;
      }
      const greyed = !involvedCells.has(cellKey(r, c));
      for (const digit of candidatesOf(board, [r, c])) {
        const candidate: CellDigit = [r, c, digit];
        const key = candidateKey(candidate);
        const [x, y] = candidateCenter(candidate);
        texts.push({
          key,
          x,
          y,
          textY: y + CANDIDATE_BASELINE_OFFSET,
          digit,
          greyed,
          underlined: underlinedKeys.has(key),
          underline: {
            x1: x - UNDERLINE_HALF_WIDTH,
            y1: y + UNDERLINE_OFFSET_Y,
            x2: x + UNDERLINE_HALF_WIDTH,
            y2: y + UNDERLINE_OFFSET_Y,
          },
        });
      }
    }
  }
  return texts;
}
