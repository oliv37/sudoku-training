import { Component, input } from '@angular/core';
import { RedZoneShape } from '../geometry/board-scene-model';
import { THEME } from '../board-theme';

/**
 * Red zone of the question: hatched background, then its outline (dashed for a unit, plain for a
 * single cell). Drawn over the grid lines.
 */
@Component({
  selector: 'g[appBoardRedZone]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  // `mix-blend-multiply` on the background: it is drawn over the grid lines, and multiplying its
  // colors with what lies under it keeps the lines dark and visible instead of covering them.
  template: `
    <svg:rect
      [attr.x]="redZone().fill.x"
      [attr.y]="redZone().fill.y"
      [attr.width]="redZone().fill.width"
      [attr.height]="redZone().fill.height"
      [attr.fill]="hatchUrl()"
      class="mix-blend-multiply"
    />
    <svg:rect
      [attr.x]="redZone().outline.x"
      [attr.y]="redZone().outline.y"
      [attr.width]="redZone().outline.width"
      [attr.height]="redZone().outline.height"
      fill="none"
      [attr.stroke]="theme.bad"
      [attr.stroke-width]="redZone().kind === 'unit' ? 4 : 5"
      [attr.stroke-dasharray]="redZone().kind === 'unit' ? '12 7' : null"
    />
  `,
})
export class BoardRedZone {
  readonly redZone = input.required<RedZoneShape>();
  /** `url(#…)` of the hatch pattern defined by the board. */
  readonly hatchUrl = input.required<string>();

  protected readonly theme = THEME;
}
