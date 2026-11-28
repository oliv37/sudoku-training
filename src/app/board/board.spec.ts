/**
 * The SVG the board renders for a drawing that uses everything a `BoardDrawing` can hold. The
 * snapshot keeps the DOM order, so it also fixes the painting order (SVG has no z-index).
 * Update it only for an intended visual change, after reading the diff.
 */
import { TestBed } from '@angular/core/testing';
import { Board } from './board';
import { BoardDrawing } from './board-model';
import { rowCells } from './testing/board-fixtures';

/** Every kind of element, visible and hidden, in a few cells. */
const fullDrawing: BoardDrawing = {
  digits: [
    { cell: [0, 0], digit: 5 },
    { cell: [4, 4], digit: 9 },
  ],
  candidates: [
    { candidate: [0, 1, 1] },
    { candidate: [0, 1, 2], underlined: true },
    { candidate: [0, 2, 3], greyed: true, underlined: true },
    { candidate: [0, 2, 4], greyed: true, struck: { tone: 'red' } },
    { candidate: [1, 0, 5], struck: { tone: 'red' } },
    { candidate: [1, 0, 6], struck: { tone: 'red', hidden: true } },
    { candidate: [1, 1, 7], circled: { tone: 'green', bold: true } },
    { candidate: [1, 1, 8], circled: { tone: 'blue' }, struck: { tone: 'red' } },
    { candidate: [1, 2, 9], circled: { tone: 'violet', hidden: true } },
    { candidate: [3, 8, 1], struck: { tone: 'red' }, framed: { tone: 'red' } },
    { candidate: [3, 8, 2], framed: { tone: 'green', hidden: true } },
  ],
  zones: [
    { cells: rowCells(3), fill: 'red-hatched', outline: 'dashed' },
    { cells: [[2, 2]], fill: 'red-hatched', outline: 'solid' },
    { cells: [[1, 1]], fill: 'green', outline: 'solid' },
  ],
  arrows: [
    { from: [1, 1, 7], to: [1, 1, 8], tone: 'blue', label: '1' },
    { from: [1, 1, 8], to: [3, 8, 1], tone: 'orange' },
    { from: [1, 1, 7], to: [1, 2, 9], tone: 'violet', label: '2', hidden: true },
  ],
};

async function renderedSvgOf(drawing: BoardDrawing): Promise<SVGSVGElement> {
  const fixture = TestBed.createComponent(Board);
  fixture.componentRef.setInput('drawing', drawing);
  await fixture.whenStable();
  const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
  if (svg === null) {
    throw new Error('The board drew no <svg>');
  }
  return svg;
}

/** One line per element, in DOM order, indented by depth: tag, sorted attributes, text. */
function markupOf(element: Element, depth = 0): string[] {
  const lines = [`${'  '.repeat(depth)}${elementLineOf(element)}`];
  for (const child of element.children) {
    lines.push(...markupOf(child, depth + 1));
  }
  return lines;
}

function elementLineOf(element: Element): string {
  const attributes: string[] = [];
  for (const { name, value } of element.attributes) {
    if (isAngularAttribute(name)) {
      continue;
    }
    attributes.push(`${name}="${withoutGeneratedId(value)}"`);
  }
  attributes.sort();
  const line = [element.tagName, ...attributes].join(' ');
  if (element.tagName === 'text') {
    return `${line} | ${element.textContent.trim()}`;
  }
  return line;
}

/** Attributes Angular adds for its own needs (style encapsulation, debugging). */
function isAngularAttribute(name: string): boolean {
  return name.startsWith('_ng') || name.startsWith('ng-');
}

/** The hatch pattern id is numbered per board instance (`hatch-3`): keep only its name. */
function withoutGeneratedId(value: string): string {
  return value.replace(/hatch-\d+/g, 'hatch');
}

describe('board', () => {
  it('renders every kind of element as before', async () => {
    const svg = await renderedSvgOf(fullDrawing);
    expect(markupOf(svg).join('\n')).toMatchSnapshot();
  });

  it('renders an empty drawing as the grid alone', async () => {
    const svg = await renderedSvgOf({ digits: [], candidates: [], zones: [], arrows: [] });
    expect(markupOf(svg).join('\n')).toMatchSnapshot();
  });
});
