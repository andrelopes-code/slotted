/** Which side of its line a label hangs on. `auto` centers it and moves it inward at an edge. */
export type LineLabelPlacement = 'start' | 'end' | 'auto';

export interface LineLabel {
  /** Where the line stands on the plot, in pixels from the chart's left edge. */
  readonly at: number;
  readonly text: string;
  /** The higher keeps its place; the lowest is the one hidden when the rows run out. */
  readonly priority: number;
  readonly placement: LineLabelPlacement;
}

export interface LineLabelBox {
  readonly left: number;
  readonly right: number;
  /** Counted from the line's end outward: 0 is the row next to the plot. */
  readonly row: number;
  readonly hidden: boolean;
}

/** The space between two labels on one row. */
const GAP = 4;

/**
 * Where the labels of upright lines stand: each label's box, the row it takes
 * and whether it is hidden. A label takes the first row where it overlaps no
 * label already placed; labels are placed highest priority first, then in the
 * order written, so when `maxRows` runs out the label hidden is the one that
 * mattered least. Every box is kept inside `[start, end]`. The width is
 * estimated from the text, as the rest of the option builder estimates it,
 * because the engine measures nothing before it draws.
 */
export function placeLineLabels(
  lines: readonly LineLabel[],
  options: { start: number; end: number; charWidth: number; maxRows: number },
): LineLabelBox[] {
  const { start, end, charWidth, maxRows } = options;
  const boxes: LineLabelBox[] = lines.map((line) => {
    const width = Math.min(line.text.length * charWidth, end - start);
    let left =
      line.placement === 'start'
        ? line.at - width
        : line.placement === 'end'
          ? line.at
          : line.at - width / 2;
    left = Math.min(Math.max(left, start), end - width);
    return { left, right: left + width, row: 0, hidden: false };
  });

  const order = lines
    .map((line, index) => ({ index, priority: line.priority }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index)
    .map(({ index }) => index);

  const placed: LineLabelBox[] = [];
  for (const index of order) {
    const box = boxes[index]!;
    let row = 0;
    while (
      row < maxRows &&
      placed.some(
        (other) =>
          other.row === row && box.left < other.right + GAP && other.left < box.right + GAP,
      )
    ) {
      row += 1;
    }
    const next = row < maxRows ? { ...box, row } : { ...box, hidden: true };
    boxes[index] = next;
    if (!next.hidden) placed.push(next);
  }
  return boxes;
}
