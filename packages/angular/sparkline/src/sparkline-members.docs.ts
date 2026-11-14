import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

const TONE = "'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'";

const stripAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'span',
    required: true,
    purpose:
      'role="img", data-type="strip", named by the value, the span of the periods and the reference. Three columns: the two ends at one fixed width, the track between them.',
  },
  { part: 'track', element: 'span', required: true, purpose: 'The axis every mark is placed on.' },
  {
    part: 'band',
    element: 'span',
    required: false,
    purpose: 'The span of the periods, smallest to largest, in a wash of the series color.',
  },
  { part: 'dot', element: 'span', required: false, purpose: 'One period, in the dimmed color.' },
  {
    part: 'value',
    element: 'span',
    required: false,
    purpose: 'The current value, larger and ringed in the ground. Absent under hideValue.',
  },
  {
    part: 'reference',
    element: 'span',
    required: false,
    purpose: 'A dashed tick at the reference: it is the one mark that is not data.',
  },
  {
    part: 'zero',
    element: 'span',
    required: false,
    purpose: 'A solid tick at zero, present when the extent crosses it.',
  },
  {
    part: 'start',
    element: 'span',
    required: true,
    purpose: 'The low end of the extent, written.',
  },
  { part: 'end', element: 'span', required: true, purpose: 'The high end of the extent, written.' },
];

const stripScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One ratio this period against its last eight: the band is their span, the larger dot this period, the dashed tick a long-run mean.',
    snippet: defineSnippet({
      id: 'position-strip-angular-playground',
      language: 'angular',
      label: 'A value among its periods',
      source:
        '<span\n  slPositionStrip\n  label="Savings rate"\n  [reference]="1200"\n  [value]="800"\n  [values]="periods"\n></span>',
    }),
  },
  {
    id: 'stacked',
    title: 'Rows that line up',
    note: 'Several strips stacked in a card state one min and max, so their planes line up: the ends are one fixed width and every mark is a share of the track.',
    snippet: defineSnippet({
      id: 'position-strip-angular-stacked',
      language: 'angular',
      label: 'One extent for every row',
      source:
        '<span\n  slPositionStrip\n  label="Savings rate"\n  [max]="3000"\n  [min]="-1000"\n  [value]="800"\n  [values]="savings"\n></span>\n<span\n  slPositionStrip\n  label="Debt ratio"\n  [max]="3000"\n  [min]="-1000"\n  [value]="2200"\n  [values]="debt"\n></span>',
    }),
  },
  {
    id: 'pending',
    title: 'A value not known yet',
    note: 'hideValue leaves the value dot out while the period is incomplete, and the name says the value is pending rather than reading the last one.',
    snippet: defineSnippet({
      id: 'position-strip-angular-pending',
      language: 'angular',
      label: 'The current period still open',
      source: '<span slPositionStrip hideValue label="Savings rate" [values]="periods"></span>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The root is an image named “Savings rate: 800, against a range of -500 to 2,500, reference 1,200”, every number in the locale and format given.',
    snippet: defineSnippet({
      id: 'position-strip-angular-accessibility',
      language: 'angular',
      label: 'The name, formatted',
      source:
        '<span\n  slPositionStrip\n  label="Savings"\n  [formatOptions]="currency"\n  [value]="800"\n  [values]="periods"\n></span>',
    }),
  },
];

const compareAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'span',
    required: true,
    purpose:
      'role="img", data-type="compare", named by every row’s label and value. Two columns: the labels, then the axis.',
  },
  {
    part: 'row',
    element: 'span',
    required: true,
    purpose:
      'One value. data-negative below zero, data-texture with a hatched fill. Rows touch, so the zero line and the ticks run unbroken.',
  },
  { part: 'label', element: 'span', required: true, purpose: 'What the value is.' },
  {
    part: 'track',
    element: 'span',
    required: true,
    purpose: 'The axis, with room on both sides for the value written past a bar.',
  },
  {
    part: 'bar',
    element: 'span',
    required: true,
    purpose: 'From zero to the value, in the series color or hatched.',
  },
  {
    part: 'value',
    element: 'span',
    required: true,
    purpose:
      'The value, written past the bar’s far end: after a positive bar, before a negative one.',
  },
  {
    part: 'zero',
    element: 'span',
    required: false,
    purpose: 'The zero line, present when the domain crosses it.',
  },
  { part: 'tick', element: 'span', required: false, purpose: 'A faint line at each step.' },
];

const compareScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A result against a benchmark on one signed axis: the negative result hangs left of the zero line and each value is written at its bar’s end.',
    snippet: defineSnippet({
      id: 'bar-compare-angular-playground',
      language: 'angular',
      label: 'A result against a benchmark',
      source: '<span slBarCompare [data]="pair"></span>',
    }),
  },
  {
    id: 'shared-domain',
    title: 'One axis across sections',
    note: 'Roots that state the same min, max and step draw the same axis and the same ticks, so pairs in separate sections compare at a glance.',
    snippet: defineSnippet({
      id: 'bar-compare-angular-shared-domain',
      language: 'angular',
      label: 'The same domain on every root',
      source:
        '<span slBarCompare [data]="march" [max]="800" [min]="-1600" [step]="800"></span>\n<span slBarCompare [data]="april" [max]="800" [min]="-1600" [step]="800"></span>',
    }),
  },
  {
    id: 'texture',
    title: 'A reference told apart without color',
    note: 'texture hatches a row’s fill, so the reference reads as a reference in grayscale, in print and under forced colors.',
    snippet: defineSnippet({
      id: 'bar-compare-angular-texture',
      language: 'angular',
      label: 'A hatched reference',
      source: '<span slBarCompare [data]="withIndex"></span>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The root is an image named by every row: “Result: -1,000; Benchmark: 33”, each value in the locale and format given; description replaces it.',
    snippet: defineSnippet({
      id: 'bar-compare-angular-accessibility',
      language: 'angular',
      label: 'The name, formatted',
      source: '<span slBarCompare [data]="pair" [formatOptions]="currency"></span>',
    }),
  },
];

const shared = (member: string): ApiTuple[] => [
  [
    'formatOptions',
    'Intl.NumberFormatOptions',
    '—',
    member,
    'How a number is written, on the page and in the name',
  ],
  ['valueFormatter', '(value: number) => string', '—', member, 'Writes a number instead'],
  ['locale', 'string', '—', member, 'The locale; the language in force when absent'],
  ['description', 'string', '—', member, 'The whole accessible name'],
  ['tone', TONE, '—', member, 'How the value is doing'],
];

export const ANGULAR_POSITION_STRIP_DOCS = {
  imports: {
    source: "import { SlPositionStrip } from '@slotted/angular/sparkline';",
    selector: '[slPositionStrip]',
    exportAs: 'slPositionStrip',
  } satisfies ReferenceImport,
  anatomy: stripAnatomy,
  scenes: stripScenes,
  api: apiRows([
    ['value', 'number | null', '—', 'slPositionStrip', 'The current value'],
    [
      'values',
      '(number | null)[]',
      '—',
      'slPositionStrip',
      'The periods, oldest first; null is a gap',
    ],
    ['reference', 'number', '—', 'slPositionStrip', 'A dashed tick, which widens the extent'],
    ['min', 'number', '—', 'slPositionStrip', 'Widens the extent, for rows that line up'],
    ['max', 'number', '—', 'slPositionStrip', 'Widens the extent, for rows that line up'],
    ['hideValue', 'boolean', 'false', 'slPositionStrip', 'Leaves the value dot out, and says so'],
    ['size', "'sm' | 'md' | 'lg'", 'md', 'slPositionStrip', 'The height of the track'],
    ['label', 'string', '—', 'slPositionStrip', 'What the strip is, said first in the name'],
    ...shared('slPositionStrip'),
  ]),
  accessibility: [
    'The root carries role="img" and a name built from the value, the smallest and largest period and the reference, because those are the numbers the strip exists to compare.',
    'Every mark is hidden from the tree by being inside the image: nothing is focusable and nothing answers a key, as for a sparkline.',
    'The value is told apart by size and a ring as well as by color, and the reference by its dash; under forced colors the dots and the band take GrayText and the value CanvasText.',
  ],
  snippets: [],
} as const;

export const ANGULAR_BAR_COMPARE_DOCS = {
  imports: {
    source: "import { SlBarCompare } from '@slotted/angular/sparkline';",
    selector: '[slBarCompare]',
    exportAs: 'slBarCompare',
  } satisfies ReferenceImport,
  anatomy: compareAnatomy,
  scenes: compareScenes,
  api: apiRows([
    [
      'data',
      '{ label: string; value: number; texture?: boolean }[]',
      '—',
      'slBarCompare',
      'One row per value',
    ],
    ['min', 'number', '—', 'slBarCompare', 'The low end of the domain; zero and the data widen it'],
    [
      'max',
      'number',
      '—',
      'slBarCompare',
      'The high end of the domain; zero and the data widen it',
    ],
    ['step', 'number', '—', 'slBarCompare', 'The distance between two ticks'],
    ...shared('slBarCompare'),
  ]),
  accessibility: [
    'The root carries role="img" named by every row’s label and value, in order: the comparison is read as the list of numbers it draws.',
    'A negative value is written with its sign and drawn left of the zero line; the sign never depends on the color.',
    'texture tells a reference from the subject without color, and forced colors draw it as CanvasText stripes over Canvas.',
  ],
  snippets: [],
} as const;
