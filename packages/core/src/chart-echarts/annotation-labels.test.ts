import { describe, expect, it } from 'vitest';

import { createChartModel, type ChartTheme } from '../chart/index';
import { placeLineLabels } from './annotation-labels';
import { buildChartOption } from './option';

const theme: ChartTheme = {
  slots: ['#2563eb', '#ea580c', '#0891b2', '#dc2626', '#7c3aed', '#a16207', '#c026d3', '#16a34a'],
  tones: {
    neutral: 'rgb(71, 85, 105)',
    accent: 'rgb(37, 99, 235)',
    secondary: 'rgb(100, 116, 139)',
    success: 'rgb(22, 163, 74)',
    info: 'rgb(2, 132, 199)',
    warning: 'rgb(202, 138, 4)',
    danger: 'rgb(220, 38, 38)',
  },
  overflow: 'rgb(100, 116, 139)',
  text: 'rgb(15, 23, 42)',
  label: 'rgb(71, 85, 105)',
  grid: 'rgb(216, 222, 230)',
  axis: 'rgb(148, 163, 184)',
  reference: 'rgb(100, 116, 139)',
  surface: 'rgb(255, 255, 255)',
  fontFamily: 'sans-serif',
  labelSize: 11,
  lineWidth: 2,
  markerSize: 6,
  barRadius: 4,
  areaOpacity: 0.16,
  inset: 8,
  duration: 320,
  easing: [0.2, 0, 0, 1],
  forcedColors: false,
};

type Box = { left: number; right: number; row: number; hidden: boolean };

const overlap = (a: Box, b: Box) =>
  !a.hidden && !b.hidden && a.row === b.row && a.left < b.right && b.left < a.right;

describe('placeLineLabels', () => {
  /* A 31-day axis at 400 pixels: "Today" on day 18 and "Card statement" on
     day 25. Aligned to end at its line, as the last third of the axis was,
     the second label ran back over the first. */
  const lines = [
    { at: 220, text: 'Today', priority: 0, placement: 'auto' as const },
    { at: 305, text: 'Card statement', priority: 0, placement: 'auto' as const },
  ];

  it('lays no two labels over each other', () => {
    const boxes = placeLineLabels(lines, { start: 8, end: 392, charWidth: 6.6, maxRows: 2 });
    expect(
      boxes.some((box, index) => boxes.slice(index + 1).some((other) => overlap(box, other))),
    ).toBe(false);
    expect(boxes.every((box) => !box.hidden)).toBe(true);
  });

  it('keeps every label inside the plot', () => {
    const boxes = placeLineLabels(lines, { start: 8, end: 392, charWidth: 6.6, maxRows: 2 });
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(8);
      expect(box.right).toBeLessThanOrEqual(392);
    }
  });

  it('hides the lower priority label when the rows run out', () => {
    const crowded = [
      { at: 200, text: 'Today', priority: 2, placement: 'auto' as const },
      { at: 205, text: 'Payday', priority: 1, placement: 'auto' as const },
      { at: 210, text: 'Rent', priority: 0, placement: 'auto' as const },
    ];
    const boxes = placeLineLabels(crowded, { start: 8, end: 392, charWidth: 6.6, maxRows: 2 });
    expect(boxes.map((box) => box.hidden)).toEqual([false, false, true]);
  });

  it('hangs a label on the side its placement names', () => {
    const [start, end] = placeLineLabels(
      [
        { at: 100, text: 'Before', priority: 0, placement: 'start' as const },
        { at: 300, text: 'After', priority: 0, placement: 'end' as const },
      ],
      { start: 8, end: 392, charWidth: 6.6, maxRows: 2 },
    );
    expect(start!.right).toBe(100);
    expect(end!.left).toBe(300);
  });
});

describe('the option of a chart with crowded line labels', () => {
  it('staggers the second label onto a second row, and tells the tooltip about both', () => {
    const model = createChartModel({
      x: { field: 'd' },
      data: Array.from({ length: 31 }, (_, index) => ({ d: String(index + 1), v: index })),
      series: [{ kind: 'line', field: 'v' }],
      annotations: [
        { kind: 'line', axis: 'x', value: '18', label: 'Today' },
        { kind: 'line', axis: 'x', value: '20', label: 'Card statement' },
      ],
    });
    const { option } = buildChartOption({ model, theme }, 400);
    const marks = (
      option['series'] as {
        markLine?: { data: { label: { offset?: number[]; show: boolean } }[] };
      }[]
    )[0]!.markLine!.data;
    expect(marks.map((mark) => mark.label.show)).toEqual([true, true]);
    expect(marks[0]!.label.offset?.[1] ?? 0).not.toBe(marks[1]!.label.offset?.[1] ?? 0);
  });
});
