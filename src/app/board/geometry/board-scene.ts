/**
 * Builds the scene of the grid that the board layers draw from a `BoardDrawing`: lines, zones,
 * placed digits, and candidates with their marks. The arrows are built in board-arrows/.
 */
import {
  BoardDrawing,
  DrawnCandidate,
  DrawnDigit,
  DrawnZone,
  ZoneFill,
  ZoneOutline,
} from '../board-model';
import { candidateKey, cellKey } from '../board-cells';
import { TONE_BACKGROUNDS, toneColor } from '../board-theme';
import {
  BoardScene,
  CandidateCircleShape,
  CandidateShape,
  CandidateFrameShape,
  CandidateStrikeShape,
  GridLineShape,
  DigitShape,
  ZoneBackground,
  ZoneOutlineStyle,
  ZoneShape,
} from './board-scene-model';
import { GRID_SIZE, CELL_SIZE, candidateCenter, cellCenter, cellsRect } from './board-coordinates';
import { Point } from './board-coordinates-model';

/** `y` of a placed digit is the baseline of its text: this far below the centre of the cell. */
const DIGIT_BASELINE_OFFSET = 20;
/** Same for a candidate (smaller text). */
const CANDIDATE_BASELINE_OFFSET = 8;
/** The underline of a candidate: this far below its centre, this wide on each side. */
const UNDERLINE_OFFSET_Y = 13;
const UNDERLINE_HALF_WIDTH = 8;
/** The strike line is a diagonal across the candidate, this far from its centre on each side. */
const STRIKE_HALF_LENGTH = 9;
/** Side of the square around a framed candidate. */
const FRAME_SQUARE_SIZE = 28;

/** Solid outline of a zone (a single cell, as a rule). */
const SOLID_OUTLINE: ZoneOutlineStyle = { inset: 4, width: 5, dashes: null };
/** Dashed outline, lighter, for a whole unit. */
const DASHED_OUTLINE: ZoneOutlineStyle = { inset: 3, width: 4, dashes: '12 7' };

/** Everything needed to draw the grid of a drawing, except the arrows. */
export function boardSceneOf(drawing: BoardDrawing): BoardScene {
  return {
    lines: gridLineShapes(),
    zones: zoneShapes(drawing.zones),
    digits: digitShapes(drawing.digits),
    candidates: candidateShapes(drawing.candidates),
  };
}

/** Thin lines between cells, thick lines between boxes and around the grid. */
export function gridLineShapes(): GridLineShape[] {
  const thinLines: GridLineShape[] = [];
  const thickLines: GridLineShape[] = [];
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

/** Zones in list order (later ones are painted on top); each outline is drawn inside its zone. */
export function zoneShapes(zones: DrawnZone[]): ZoneShape[] {
  const shapes: ZoneShape[] = [];
  zones.forEach((zone, index) => {
    const outlineStyle = outlineStyleOf(zone.outline);
    shapes.push({
      key: `zone-${index}`,
      fill: cellsRect(zone.cells),
      background: backgroundOf(zone.fill),
      outline: cellsRect(zone.cells, outlineStyle.inset),
      outlineColor: outlineColorOf(zone.fill),
      outlineWidth: outlineStyle.width,
      outlineDashes: outlineStyle.dashes,
    });
  });
  return shapes;
}

function backgroundOf(fill: ZoneFill): ZoneBackground {
  switch (fill) {
    case 'green':
      return { kind: 'color', color: TONE_BACKGROUNDS.green };
    case 'red-hatched':
      return { kind: 'hatch' };
  }
}

/** The outline is in the strong color of the fill. */
function outlineColorOf(fill: ZoneFill): string {
  switch (fill) {
    case 'green':
      return toneColor('green');
    case 'red-hatched':
      return toneColor('red');
  }
}

function outlineStyleOf(outline: ZoneOutline): ZoneOutlineStyle {
  switch (outline) {
    case 'solid':
      return SOLID_OUTLINE;
    case 'dashed':
      return DASHED_OUTLINE;
  }
}

/** Placed digits (large digits of the filled cells), centred in their cell. */
export function digitShapes(digits: DrawnDigit[]): DigitShape[] {
  const shapes: DigitShape[] = [];
  for (const { cell, digit } of digits) {
    const [r, c] = cell;
    const [x, centerY] = cellCenter(cell);
    shapes.push({ key: cellKey(r, c), x, y: centerY + DIGIT_BASELINE_OFFSET, digit });
  }
  return shapes;
}

/**
 * Candidates (small digits), at their place in the 3 × 3 layout of their cell, with their
 * underline and their marks.
 */
export function candidateShapes(candidates: DrawnCandidate[]): CandidateShape[] {
  const shapes: CandidateShape[] = [];
  for (const candidate of candidates) {
    shapes.push(candidateShapeOf(candidate));
  }
  return shapes;
}

function candidateShapeOf(drawnCandidate: DrawnCandidate): CandidateShape {
  const { candidate, underlined = false, greyed = false } = drawnCandidate;
  const [x, y] = candidateCenter(candidate);
  return {
    key: candidateKey(candidate),
    x,
    y,
    textY: y + CANDIDATE_BASELINE_OFFSET,
    digit: candidate[2],
    greyed,
    underlined,
    underline: {
      x1: x - UNDERLINE_HALF_WIDTH,
      y1: y + UNDERLINE_OFFSET_Y,
      x2: x + UNDERLINE_HALF_WIDTH,
      y2: y + UNDERLINE_OFFSET_Y,
    },
    frame: frameShapeOf(drawnCandidate, [x, y]),
    strike: strikeShapeOf(drawnCandidate, [x, y]),
    circle: circleShapeOf(drawnCandidate),
  };
}

/** `[x, y]`: the centre of the candidate. */
function frameShapeOf({ framed }: DrawnCandidate, [x, y]: Point): CandidateFrameShape | null {
  if (framed === undefined) {
    return null;
  }
  const halfSize = FRAME_SQUARE_SIZE / 2;
  return {
    hidden: framed.hidden ?? false,
    x: x - halfSize,
    y: y - halfSize,
    size: FRAME_SQUARE_SIZE,
    color: toneColor(framed.tone),
    background: TONE_BACKGROUNDS[framed.tone],
  };
}

/** `[x, y]`: the centre of the candidate. */
function strikeShapeOf(
  { struck, circled }: DrawnCandidate,
  [x, y]: Point,
): CandidateStrikeShape | null {
  // As in the reference renderer, a circled candidate is never drawn struck.
  if (struck === undefined || circled !== undefined) {
    return null;
  }
  return {
    hidden: struck.hidden ?? false,
    x1: x - STRIKE_HALF_LENGTH,
    y1: y + STRIKE_HALF_LENGTH,
    x2: x + STRIKE_HALF_LENGTH,
    y2: y - STRIKE_HALF_LENGTH,
    color: toneColor(struck.tone),
  };
}

function circleShapeOf({ circled }: DrawnCandidate): CandidateCircleShape | null {
  if (circled === undefined) {
    return null;
  }
  return {
    hidden: circled.hidden ?? false,
    color: toneColor(circled.tone),
    bold: circled.bold ?? false,
  };
}
