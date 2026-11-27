/**
 * Pure geometry of the solution diagram (no DOM): port of the `sol` part of `renderCard`
 * in docs/sudoku-training-modele.html. Same constants and same arrow-routing algorithm,
 * with the grid origin at (0, 0) instead of (GX, GY).
 */
import { BoardData, Cell, CellDigit, Frame, candidatesOf } from '../board-model';
import { CS, GRID_SIZE, P } from './board-geometry';

/** One color per branch of the chain (THEMES.sky.branches). */
export const BRANCH_COLORS = ['#1f6fd6', '#9b3fd4', '#e07800', '#0f9aa0'] as const;

export interface StrikeLine {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Candidate in a cell not involved in the solution: thinner and greyed. */
  off: boolean;
}

/**
 * Last candidates of the red zone, wiped out by the chain (the contradiction itself):
 * struck like the others, and framed by a red square.
 */
export interface LastCandidate {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  /** Red square around the digit. */
  square: { x: number; y: number; size: number };
}

export interface SolutionCircle {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  cx: number;
  cy: number;
  /** Hypothesis (green, thicker) or forced placement (branch color). */
  hyp: boolean;
  color: string;
}

export interface SolutionArrow {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  /** Quadratic curve from the cause circle to the forced circle. */
  path: string;
  /** Triangle at the end of the curve. */
  head: string;
  color: string;
}

export interface StepBadge {
  key: string;
  /** Step this element belongs to (frame index; 0 = hypothesis). */
  frame: number;
  x: number;
  y: number;
  step: number;
  color: string;
}

export interface SolutionScene {
  /** Cells drawn normally; candidates of every other cell are greyed out. */
  touched: Set<string>;
  strikes: StrikeLine[];
  lastCandidates: LastCandidate[];
  circles: SolutionCircle[];
  arrows: SolutionArrow[];
  badges: StepBadge[];
}

interface Obstacle {
  x: number;
  y: number;
  r: number;
  w: number;
}

type Point = [number, number];

const cellKey = (r: number, c: number) => `${r},${c}`;

/**
 * Cells that matter in the solution: the red zone, the cells of the chain, and the cells that
 * justify a hidden single ("caché ligne|colonne|bloc n": every cell of that unit holding the digit).
 */
export function touchedCells(board: BoardData, frames: Frame[], target: Cell[]): Set<string> {
  const touched = new Set(target.map(([r, c]) => cellKey(r, c)));
  for (const f of frames) {
    if (f.kind === 'bad') continue;
    const [fr, fc, d] = f.circle;
    touched.add(cellKey(fr, fc));
    const w = f.kind === 'dom' ? /^caché (ligne|colonne|bloc) (\d)$/.exec(f.why ?? '') : null;
    if (!w) continue;
    const n = Number(w[2]) - 1;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const inUnit =
          w[1] === 'ligne'
            ? r === n
            : w[1] === 'colonne'
              ? c === n
              : Math.floor(r / 3) * 3 + Math.floor(c / 3) === n;
        if (inUnit && candidatesOf(board, [r, c]).includes(d)) touched.add(cellKey(r, c));
      }
    }
  }
  return touched;
}

/** Point at parameter t on the quadratic Bézier (s, m, e). */
function quad(s: Point, m: Point, e: Point, t: number): Point {
  const u = 1 - t;
  return [
    u * u * s[0] + 2 * u * t * m[0] + t * t * e[0],
    u * u * s[1] + 2 * u * t * m[1] + t * t * e[1],
  ];
}

/** Penalty of a point: how deep it sits inside the obstacles. */
function penalty(p: Point, obstacles: Obstacle[]): number {
  let s = 0;
  for (const o of obstacles) {
    const d = Math.hypot(p[0] - o.x, p[1] - o.y);
    if (d < o.r) s += o.w * (1 - d / o.r);
  }
  return s;
}

/**
 * Curved arrow from candidate `a` to candidate `b`, avoiding obstacles; returns null when the two
 * points coincide. The obstacles list is extended with the badge and the curve (as in the original),
 * so later arrows avoid earlier ones.
 */
function routeArrow(
  a: CellDigit,
  b: CellDigit,
  obstacles: Obstacle[],
): { path: string; head: string; badge: Point } | null {
  const [x1, y1] = P(...a);
  const [x2, y2] = P(...b);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const S0: Point = [x1 + ux * 17, y1 + uy * 17];
  const E0: Point = [x2 - ux * 27, y2 - uy * 27];

  // Try several bends on both sides, keep the least obstructed one.
  let best: { sc: number; mm: Point } | null = null;
  for (const k of [0.12, -0.12, 0.24, -0.24, 0.04, -0.04, 0.36, -0.36]) {
    const off =
      Math.sign(k) *
      Math.min(Math.abs(k) * len, Math.abs(k) > 0.3 ? 96 : Math.abs(k) > 0.2 ? 66 : 38);
    const mm: Point = [(S0[0] + E0[0]) / 2 - uy * off, (S0[1] + E0[1]) / 2 + ux * off];
    let sc = Math.abs(k) * 1.5;
    for (let t = 0.12; t < 0.9; t += 0.08) sc += penalty(quad(S0, mm, E0, t), obstacles);
    const z = quad(S0, mm, E0, 0.5);
    if (z[0] < 6 || z[0] > GRID_SIZE - 6 || z[1] < 6 || z[1] > GRID_SIZE - 6) sc += 5;
    if (!best || sc < best.sc) best = { sc, mm };
  }
  const mm = best!.mm;

  const path = `M${S0[0]} ${S0[1]} Q${mm[0]} ${mm[1]} ${E0[0]} ${E0[1]}`;
  const tx = E0[0] - mm[0];
  const ty = E0[1] - mm[1];
  const tl = Math.hypot(tx, ty) || 1;
  const vx = tx / tl;
  const vy = ty / tl;
  const head =
    `M${E0[0] + vx * 11} ${E0[1] + vy * 11} ` +
    `L${E0[0] - vy * 6.5} ${E0[1] + vx * 6.5} ` +
    `L${E0[0] + vy * 6.5} ${E0[1] - vx * 6.5} Z`;

  // Numbered badge: near the middle of the curve, where it is least obstructed.
  let bb: { sc: number; pt: Point } | null = null;
  for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
    for (const sh of len < 130 ? [19, -19] : [0]) {
      const z = quad(S0, mm, E0, t);
      const pt: Point = [z[0] - uy * sh, z[1] + ux * sh];
      const sc = penalty(pt, obstacles) + Math.abs(t - 0.5) * 0.6;
      if (!bb || sc < bb.sc) bb = { sc, pt };
    }
  }
  const badge = bb!.pt;
  obstacles.push({ x: badge[0], y: badge[1], r: 28, w: 4 });
  for (let t = 0.15; t < 0.9; t += 0.1) {
    const z = quad(S0, mm, E0, t);
    obstacles.push({ x: z[0], y: z[1], r: 14, w: 1.2 });
  }
  return { path, head, badge };
}

/**
 * Everything needed to draw the solution diagram on top of the board.
 * `target` / `targetDigit`: the red zone and what disappears from it: one digit (unit),
 * 'all' (single cell: all its candidates), or null (unknown: no special highlight).
 */
export function solutionSceneOf(
  board: BoardData,
  frames: Frame[],
  target: Cell[],
  targetDigit: number | 'all' | null,
  hypColor: string,
): SolutionScene {
  const touched = touchedCells(board, frames, target);
  const targetCells = new Set(target.map(([r, c]) => cellKey(r, c)));
  const isLastCandidate = ([r, c, d]: CellDigit) =>
    targetCells.has(cellKey(r, c)) && (targetDigit === 'all' || d === targetDigit);

  // Kept circles and struck candidates, as in the reference (a circled candidate is never struck).
  const kept = new Map<string, { cd: CellDigit; hyp: boolean; frame: number }>();
  const struck = new Map<string, { cd: CellDigit; frame: number }>();
  frames.forEach((f, i) => {
    if (f.kind !== 'bad')
      kept.set(f.circle.join(), { cd: f.circle, hyp: f.kind === 'hyp', frame: i });
    for (const s of f.kind === 'bad' ? [] : f.strikes) {
      // A candidate struck several times belongs to the first step that strikes it.
      if (!struck.has(s.join())) struck.set(s.join(), { cd: s, frame: i });
    }
  });

  const branch = branchesOf(frames);
  const keptBranch = new Map<string, number>();
  frames.forEach((f, i) => {
    if (f.kind === 'dom') keptBranch.set(f.circle.join(), branch[i]);
  });

  const strikes: StrikeLine[] = [];
  const lastCandidates: LastCandidate[] = [];
  const last = lastStep(frames);
  for (const [key, { cd, frame }] of struck) {
    if (kept.has(key)) continue;
    const [r, c, d] = cd;
    const [x, y] = P(r, c, d);
    if (isLastCandidate(cd)) {
      // The conclusion: shown with the last step only.
      lastCandidates.push({ key, frame: last, square: { x: x - 14, y: y - 14, size: 28 } });
    }
    strikes.push({
      key,
      frame,
      x1: x - 9,
      y1: y + 9,
      x2: x + 9,
      y2: y - 9,
      off: !touched.has(cellKey(r, c)),
    });
  }

  const circles: SolutionCircle[] = [];
  for (const [key, { cd, hyp, frame }] of kept) {
    const [cx, cy] = P(...cd);
    const color = hyp ? hypColor : branchColor(keptBranch.get(key) ?? 0);
    circles.push({ key, frame, cx, cy, hyp, color });
  }

  // Arrows: obstacles are placed digits, circles and struck candidates, then each drawn arrow.
  const obstacles: Obstacle[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board.vals[r * 9 + c])
        obstacles.push({ x: c * CS + CS / 2, y: r * CS + CS / 2, r: 32, w: 1 });
    }
  }
  for (const { cd } of kept.values()) {
    const [x, y] = P(...cd);
    obstacles.push({ x, y, r: 27, w: 3 });
  }
  for (const { cd } of struck.values()) {
    const [x, y] = P(...cd);
    obstacles.push({ x, y, r: 17, w: 1 });
  }

  const arrows: SolutionArrow[] = [];
  const badges: StepBadge[] = [];
  frames.forEach((f, i) => {
    if (f.kind !== 'dom') return;
    const cause = frames[f.cause];
    if (!cause || cause.kind === 'bad') return;
    const routed = routeArrow(cause.circle, f.circle, obstacles);
    if (!routed) return;
    const color = branchColor(branch[i]);
    arrows.push({ key: `a${i}`, frame: i, path: routed.path, head: routed.head, color });
    badges.push({ key: `b${i}`, frame: i, x: routed.badge[0], y: routed.badge[1], step: i, color });
  });

  return { touched, strikes, lastCandidates, circles, arrows, badges };
}

/** Branch of each forced placement: a new branch for each direct consequence of the hypothesis. */
function branchesOf(frames: Frame[]): number[] {
  const branch: number[] = [];
  let nextBranch = 0;
  frames.forEach((f, i) => {
    if (f.kind === 'dom') branch[i] = f.cause === 0 ? nextBranch++ : branch[f.cause];
  });
  return branch;
}

function branchColor(branch: number): string {
  return BRANCH_COLORS[branch % BRANCH_COLORS.length];
}

/** Number of the last step (index of the last forced placement); 0 if there is none. */
export function lastStep(frames: Frame[]): number {
  let last = 0;
  frames.forEach((f, i) => {
    if (f.kind === 'dom') last = i;
  });
  return last;
}

/** The numbered steps of a solution with their branch color, as on the board badges. */
export function solutionSteps(frames: Frame[]): { step: number; color: string }[] {
  const branch = branchesOf(frames);
  return frames.flatMap((f, i) =>
    f.kind === 'dom' ? [{ step: i, color: branchColor(branch[i]) }] : [],
  );
}

/**
 * The scene limited to the hypothesis and steps 1..`step`.
 * Positions are those of the full diagram, so nothing moves while steps appear.
 */
export function solutionSceneUpTo(scene: SolutionScene, step: number): SolutionScene {
  const upTo = <T extends { frame: number }>(items: T[]) => items.filter((it) => it.frame <= step);
  return {
    touched: scene.touched,
    strikes: upTo(scene.strikes),
    lastCandidates: upTo(scene.lastCandidates),
    circles: upTo(scene.circles),
    arrows: upTo(scene.arrows),
    badges: upTo(scene.badges),
  };
}
