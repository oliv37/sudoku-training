import { Component, computed, input } from '@angular/core';
import { ZoneShape } from '../geometry/board-scene-model';
import { ZoneView } from './board-zones-model';

/**
 * Colored cells and units: for each zone, its background, then its outline. Drawn over the grid
 * lines, in list order.
 */
@Component({
  selector: 'g[appBoardZones]',
  // Elements prefixed with `svg:`: this template has no <svg> ancestor, so without the prefix
  // Angular would create HTML elements, which the browser does not draw.
  // `mix-blend-multiply` on the background: it is drawn over the grid lines, and multiplying its
  // colors with what lies under it keeps the lines dark and visible instead of covering them.
  template: `
    @for (zone of zoneViews(); track zone.key) {
      <svg:rect
        [attr.x]="zone.fill.x"
        [attr.y]="zone.fill.y"
        [attr.width]="zone.fill.width"
        [attr.height]="zone.fill.height"
        [attr.fill]="zone.backgroundPaint"
        class="mix-blend-multiply"
      />
      <svg:rect
        [attr.x]="zone.outline.x"
        [attr.y]="zone.outline.y"
        [attr.width]="zone.outline.width"
        [attr.height]="zone.outline.height"
        fill="none"
        [attr.stroke]="zone.outlineColor"
        [attr.stroke-width]="zone.outlineWidth"
        [attr.stroke-dasharray]="zone.outlineDashes"
      />
    }
  `,
})
export class BoardZones {
  readonly zones = input.required<ZoneShape[]>();
  /** `url(#…)` of the hatch pattern defined by the board. */
  readonly hatchUrl = input.required<string>();

  protected readonly zoneViews = computed(() => this.zones().map((zone) => this.toZoneView(zone)));

  private toZoneView(zone: ZoneShape): ZoneView {
    return { ...zone, backgroundPaint: this.backgroundPaintOf(zone) };
  }

  private backgroundPaintOf({ background }: ZoneShape): string {
    if (background.kind === 'hatch') {
      return this.hatchUrl();
    }
    return background.color;
  }
}
