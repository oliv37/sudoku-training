import { Component, computed, input } from '@angular/core';
import { GRID_SIZE, VIEW_BOX } from './geometry/board-coordinates';
import { boardSceneOf } from './geometry/board-scene';
import { THEME, TONE_BACKGROUNDS, toneColor } from './board-theme';
import { BoardDrawing } from './board-model';
import { arrowsSceneOf } from './board-arrows/geometry/board-arrows-scene';
import { BoardGridLines } from './board-grid-lines/board-grid-lines';
import { BoardZones } from './board-zones/board-zones';
import { BoardDigits } from './board-digits/board-digits';
import { BoardCandidates } from './board-candidates/board-candidates';
import { BoardArrows } from './board-arrows/board-arrows';

let nextId = 0;

/**
 * Declarative SVG rendering of a sudoku board: grid, zones, digits, candidates and their marks,
 * arrows. Knows nothing about exercises: callers map their data to a `BoardDrawing`.
 */
@Component({
  selector: 'app-board',
  host: { class: 'block' },
  imports: [BoardGridLines, BoardZones, BoardDigits, BoardCandidates, BoardArrows],
  templateUrl: './board.html',
})
export class Board {
  /** What the board draws. */
  readonly drawing = input.required<BoardDrawing>();
  /** Accessible description of the grid (role="img"). */
  readonly label = input('Sudoku grid');

  protected readonly theme = THEME;
  protected readonly viewBox = VIEW_BOX;
  protected readonly gridSize = GRID_SIZE;
  protected readonly hatchId = `hatch-${nextId++}`;
  protected readonly hatchUrl = `url(#${this.hatchId})`;
  /** The hatch pattern of the 'red-hatched' zones. */
  protected readonly hatchBackground = TONE_BACKGROUNDS.red;
  protected readonly hatchLine = toneColor('red');

  /** Grid, zones, digits, and candidates with their marks. */
  protected readonly boardScene = computed(() => boardSceneOf(this.drawing()));
  protected readonly arrowsScene = computed(() => arrowsSceneOf(this.drawing()));
}
