import { BoardDrawing, DrawnArrow } from '../../board-model';
import { toneColor } from '../../board-theme';
import { arrowsSceneOf } from './board-arrows-scene';

/** A drawing with only these arrows (no digit, no candidate in the way). */
function drawingWithArrows(arrows: DrawnArrow[]): BoardDrawing {
  return { digits: [], candidates: [], zones: [], arrows };
}

describe('board arrows scene', () => {
  it('draws each arrow in the color of its tone, hidden or not', () => {
    const { arrows } = arrowsSceneOf(
      drawingWithArrows([
        { from: [4, 1, 5], to: [4, 6, 5], tone: 'blue', hidden: true },
        { from: [0, 0, 1], to: [8, 8, 9], tone: 'orange' },
      ]),
    );
    expect(arrows.map(({ key, hidden, color }) => ({ key, hidden, color }))).toEqual([
      { key: 'arrow-0', hidden: true, color: toneColor('blue') },
      { key: 'arrow-1', hidden: false, color: toneColor('orange') },
    ]);
  });

  it('draws a badge with the label of the arrow, its baseline 6 below the centre', () => {
    const { badges } = arrowsSceneOf(
      drawingWithArrows([{ from: [4, 1, 5], to: [4, 6, 5], tone: 'blue', label: '3' }]),
    );
    expect(badges.length).toBe(1);
    expect(badges[0]).toMatchObject({
      key: 'badge-0',
      hidden: false,
      label: '3',
      color: toneColor('blue'),
    });
    expect(badges[0].textY - badges[0].y).toBe(6);
  });

  it('draws no badge on an arrow without a label', () => {
    const { badges } = arrowsSceneOf(
      drawingWithArrows([{ from: [4, 1, 5], to: [4, 6, 5], tone: 'blue' }]),
    );
    expect(badges).toEqual([]);
  });

  it('draws no arrow from a candidate to itself', () => {
    const scene = arrowsSceneOf(
      drawingWithArrows([{ from: [4, 1, 5], to: [4, 1, 5], tone: 'blue', label: '1' }]),
    );
    expect(scene).toEqual({ arrows: [], badges: [] });
  });

  it('bends an arrow away from a circled candidate in its way', () => {
    const arrow: DrawnArrow = { from: [4, 1, 5], to: [4, 6, 5], tone: 'blue' };
    const alone = arrowsSceneOf(drawingWithArrows([arrow]));
    // The 9 of R5C4 sits next to the gentlest bend, the one taken when nothing is in the way.
    const withObstacle = arrowsSceneOf({
      ...drawingWithArrows([arrow]),
      candidates: [{ candidate: [4, 3, 9], circled: { tone: 'green' } }],
    });
    expect(withObstacle.arrows[0].path).not.toBe(alone.arrows[0].path);
  });

  it('bends an arrow away from a hidden circled candidate too, so nothing moves when it is shown', () => {
    const arrow: DrawnArrow = { from: [4, 1, 5], to: [4, 6, 5], tone: 'blue' };
    const visibleCircle = arrowsSceneOf({
      ...drawingWithArrows([arrow]),
      candidates: [{ candidate: [4, 3, 9], circled: { tone: 'green' } }],
    });
    const hiddenCircle = arrowsSceneOf({
      ...drawingWithArrows([arrow]),
      candidates: [{ candidate: [4, 3, 9], circled: { tone: 'green', hidden: true } }],
    });
    expect(hiddenCircle.arrows[0].path).toBe(visibleCircle.arrows[0].path);
  });

  it('routes the next arrows around a hidden arrow as around a visible one', () => {
    const first: DrawnArrow = { from: [4, 1, 5], to: [4, 6, 5], tone: 'blue', label: '1' };
    const second: DrawnArrow = { from: [4, 2, 5], to: [4, 7, 5], tone: 'blue', label: '2' };
    const afterVisible = arrowsSceneOf(drawingWithArrows([first, second]));
    const afterHidden = arrowsSceneOf(drawingWithArrows([{ ...first, hidden: true }, second]));
    expect(afterHidden.arrows[1].path).toBe(afterVisible.arrows[1].path);
    expect(afterHidden.badges[1]).toEqual(afterVisible.badges[1]);
  });
});
