/**
 * What the arrows layer draws: positions in SVG user units, ready for the template. Computed by
 * `arrowsSceneOf` (board-arrows-scene.ts).
 */

/** Curved arrow from a candidate to another. */
export interface ArrowShape {
  key: string;
  /** Not drawn (`display="none"`), but kept in place. */
  hidden: boolean;
  /** Quadratic curve between the two candidates. */
  path: string;
  /** Triangle at the end of the curve. */
  head: string;
  color: string;
}

/** Round badge on an arrow, with its label. */
export interface BadgeShape {
  key: string;
  /** Not drawn (`display="none"`), but kept in place. */
  hidden: boolean;
  /** Centre of the badge. */
  x: number;
  y: number;
  /** Baseline of the label, below the centre so the label looks centred. */
  textY: number;
  label: string;
  color: string;
}

/** Every arrow, then every badge: the badges are painted on top of all the arrows. */
export interface ArrowsScene {
  arrows: ArrowShape[];
  badges: BadgeShape[];
}
