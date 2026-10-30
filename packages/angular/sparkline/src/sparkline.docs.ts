import sparklineTokens from '@slotted/styles/sparkline/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
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

export const ANGULAR_SPARKLINE_TOKENS = sparklineTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Sparkline decision',
}));

const imports: ReferenceImport = {
  source: "import { SlSparkline, provideSparklineDefaults } from '@slotted/angular/sparkline';",
  selector: '[slSparkline]',
  exportAs: 'slSparkline',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'span',
    required: true,
    purpose:
      'An inline image, role="img", named by the generated description. Takes the whole inline size of what holds it and the height of its size step; measures itself and lays the drawing out in pixels.',
  },
  {
    part: 'plot',
    element: 'svg',
    required: true,
    purpose:
      'The drawing, hidden from assistive technology. Its viewBox is the measured box, and until it is measured, the nominal grid of the size step.',
  },
  {
    part: 'area',
    element: 'path',
    required: false,
    purpose: 'The wash under a line, faded to nothing at the bottom edge. Present with area.',
  },
  {
    part: 'line',
    element: 'path',
    required: false,
    purpose:
      'The series as a two-pixel line, straight or monotone, broken wherever the data has a gap. Present for type="line" with two or more real points.',
  },
  {
    part: 'bar',
    element: 'path',
    required: false,
    purpose:
      'One period, rounded at its data end and square at the baseline. Every bar but the last is dimmed; the last carries data-current.',
  },
  {
    part: 'reference',
    element: 'line',
    required: false,
    purpose: 'A dashed hairline at the reference value, in the neutral of the page.',
  },
  {
    part: 'ring',
    element: 'path',
    required: false,
    purpose:
      'The ground-coloured ring under the marker, drawn as a round-capped stroke so it stays round on a stretched grid.',
  },
  {
    part: 'marker',
    element: 'path',
    required: false,
    purpose:
      'The disc on the last real point, in the series colour. Present with marker on a line.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One series, driven by the controls: switch the form, the curve, the wash and the marker, and read the description the screen reader gets in the tab title of the root.',
    snippet: defineSnippet({
      id: 'sparkline-angular-playground',
      language: 'angular',
      label: 'A trend beside a value',
      source: '<span slSparkline [data]="fillRate" label="Fill rate, last 12 weeks"></span>',
    }),
  },
  {
    id: 'types',
    title: 'A line for a trend, bars for a count per period',
    note: 'The same twelve weeks four ways: a straight line, the line washed, the line smoothed with a monotone curve that never overshoots a point, and one bar per week with the current week at full colour.',
    snippet: defineSnippet({
      id: 'sparkline-angular-types',
      language: 'angular',
      label: 'The two forms and the two options on a line',
      source:
        '<span slSparkline [data]="orders"></span>\n<span slSparkline [data]="orders" area></span>\n<span slSparkline [data]="orders" area curve="monotone"></span>\n<span slSparkline [data]="orders" type="bar"></span>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three heights, and the width is the container’s',
    note: 'sm is twenty pixels tall for a table row, md thirty-two for a card, lg forty-eight for a card that leads a page. The stroke and the marker step down with sm; the width is always what the cell or the column gave.',
    snippet: defineSnippet({
      id: 'sparkline-angular-sizes',
      language: 'angular',
      label: 'By size',
      source:
        '<span slSparkline [data]="orders" size="sm"></span>\n<span slSparkline [data]="orders" size="md"></span>\n<span slSparkline [data]="orders" size="lg"></span>',
    }),
  },
  {
    id: 'tone',
    title: 'How the series is doing',
    note: 'A tone paints the line in the tone’s text colour: success for an error rate that fell, danger for a lead time that grew, neutral for the comparison series behind a current one. Without a tone the line is the first slot of the data scale, the accent’s own hue.',
    snippet: defineSnippet({
      id: 'sparkline-angular-tone',
      language: 'angular',
      label: 'A tone says what the shape means',
      source:
        '<span slSparkline [data]="errorRate" label="Error rate" tone="success"></span>\n<span slSparkline [data]="leadTime" label="Lead time" tone="danger"></span>\n<span slSparkline [data]="lastQuarter" label="Last quarter" tone="neutral"></span>',
    }),
  },
  {
    id: 'series',
    title: 'Which series this is',
    note: 'Eight slots of the data scale in a fixed order, so the sparklines of eight warehouses beside each other are eight colours a reader with deuteranopia still tells apart. A tone wins over a series where both are given.',
    snippet: defineSnippet({
      id: 'sparkline-angular-series',
      language: 'angular',
      label: 'One slot per warehouse',
      source:
        '@for (warehouse of warehouses; track warehouse.id; let index = $index) {\n  <span\n    slSparkline\n    [data]="warehouse.shipments"\n    [label]="warehouse.name"\n    [series]="index + 1"\n  ></span>\n}',
    }),
  },
  {
    id: 'reference',
    title: 'A line that is not data',
    note: 'The reference is dashed and neutral so it reads as a target before its colour does, and it widens the extent when it lies outside the data: a target of 95% above a series that peaks at 91% is drawn above the line, not clipped.',
    snippet: defineSnippet({
      id: 'sparkline-angular-reference',
      language: 'angular',
      label: 'A target and an explicit floor',
      source:
        '<span slSparkline [data]="onTime" label="On-time delivery" area [reference]="0.95"></span>\n\n<!-- A share of a whole is drawn from nought. -->\n<span slSparkline [data]="onTime" type="bar" [min]="0"></span>',
    }),
  },
  {
    id: 'gaps',
    title: 'A gap is a gap, not a value',
    note: 'A null breaks the line and leaves the bar’s slot empty rather than being drawn as nought or bridged; a single point is a marker with no line; an empty series draws nothing and says so; a constant series runs through the middle.',
    snippet: defineSnippet({
      id: 'sparkline-angular-gaps',
      language: 'angular',
      label: 'Missing weeks stay missing',
      source:
        '<span slSparkline [data]="[10, 12, null, null, 15, 14, 16, null, 18, 19]" area></span>\n<span slSparkline [data]="[10, 12, null, null, 15, 14, 16, null, 18, 19]" type="bar"></span>\n<span slSparkline [data]="[7]"></span>\n<span slSparkline [data]="[]" label="Returns"></span>',
    }),
  },
  {
    id: 'extremes',
    title: 'Content the family did not choose',
    note: 'Four hundred points in eighty pixels stay one path; bars with no room for a gap draw contiguous and never under a pixel; a series that crosses nought hangs its bars from a baseline inside the box; a right-to-left document reads the series from the right.',
    snippet: defineSnippet({
      id: 'sparkline-angular-extremes',
      language: 'angular',
      label: 'Dense, negative and mirrored',
      source:
        '<span slSparkline [data]="everyMinute" label="Requests per minute"></span>\n<span slSparkline [data]="netStock" type="bar"></span>\n<div dir="rtl">\n  <span slSparkline [data]="orders"></span>\n</div>',
    }),
  },
  {
    id: 'in-table',
    title: 'A trend column',
    note: 'The sparkline’s real home beside a stat card: a size="sm" line in a table cell, taking the column’s width, with the value it annotates in the column before it and the description carrying the same numbers to a screen reader.',
    snippet: defineSnippet({
      id: 'sparkline-angular-in-table',
      language: 'angular',
      label: 'A cell of the table',
      source:
        '<td slTableCell>\n  <span slSparkline [data]="line.fillRate" [label]="line.name + \' fill rate\'" size="sm"></span>\n</td>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The root is an image named “Fill rate: 96.1%, up 3.2% since 92.9%” — last value, direction, change since the first, each number in the locale and format you give; description replaces the sentence, and messages replace its words.',
    snippet: defineSnippet({
      id: 'sparkline-angular-accessibility',
      language: 'angular',
      label: 'The description, formatted and translated',
      source:
        '<span\n  slSparkline\n  [data]="fillRate"\n  [formatOptions]="{ style: \'percent\', maximumFractionDigits: 1 }"\n  label="Fill rate"\n></span>',
    }),
  },
];

export const ANGULAR_SPARKLINE_DOCS = {
  sparkline: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'data',
        '(number | null)[]',
        '—',
        'Sparkline',
        'The series, oldest first. null is a gap: the line breaks, the bar is not drawn, the summary ignores it',
      ],
      [
        'type',
        "'line' | 'bar'",
        'line',
        'Sparkline',
        'A line through the points, or one bar per period',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Sparkline',
        'The height of the box: 20, 32 or 48 pixels',
      ],
      [
        'curve',
        "'linear' | 'monotone'",
        'linear',
        'Sparkline',
        'Straight segments, or a monotone curve that never draws a value the series does not hold',
      ],
      ['area', 'boolean', 'false', 'Sparkline', 'The wash under a line'],
      ['marker', 'boolean', 'true', 'Sparkline', 'A disc on the last real point'],
      [
        'reference',
        'number',
        '—',
        'Sparkline',
        'A dashed hairline at this value. Widens the extent to hold it',
      ],
      [
        'min',
        'number',
        '—',
        'Sparkline',
        'The lowest value the extent must hold. The data widens the extent, never narrows it',
      ],
      ['max', 'number', '—', 'Sparkline', 'The highest value the extent must hold'],
      [
        'tone',
        "'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        '—',
        'Sparkline',
        'How the series is doing. Wins over series; unset, a container may decide',
      ],
      [
        'series',
        '1 | 2 | 3 | 4 | 5 | 6 | 7 | 8',
        '—',
        'Sparkline',
        'Which series this is, as a slot of the data scale. Unset, a container decides, then slot 1',
      ],
      ['label', 'string', '—', 'Sparkline', 'What the series is, said first in the description'],
      [
        'description',
        'string',
        '—',
        'Sparkline',
        'The whole accessible name, in place of the generated one',
      ],
      [
        'formatOptions',
        'Intl.NumberFormatOptions',
        '—',
        'Sparkline',
        'How each number in the description is written',
      ],
      [
        'valueFormatter',
        '(value: number) => string',
        '—',
        'Sparkline',
        'A formatter of your own for the description, in place of Intl',
      ],
      [
        'locale',
        'string',
        '—',
        'Sparkline',
        'BCP 47, for the description’s numbers; the language in force when absent',
      ],
      [
        'messages',
        'Partial<SparklineMessages>',
        '—',
        'Sparkline',
        'Words laid over the language in force, key by key: up, down and flat with {last}, {change} and {first}, and noData',
      ],
    ]),
    events: [] satisfies EventRow[],
    composition: apiRows([
      [
        '[slSparkline]',
        'attribute selector',
        '—',
        'your element',
        'The directive attaches to the element you wrote — a span in a cell, a div in a card — and it stays yours',
      ],
      [
        'exportAs slSparkline',
        'template reference',
        '—',
        'SlSparkline',
        'Reaches the instance and its computed layout and name from a template',
      ],
      [
        'aria-label',
        'attribute',
        '—',
        'your element',
        'An aria-label you wrote on the element wins over the generated description',
      ],
      [
        '--slotted-sparkline-color',
        'custom property',
        '—',
        'a container',
        'What a sparkline with no tone and no series is drawn in. stat-card writes it on its trend from the delta’s tone',
      ],
      [
        'provideSparklineDefaults',
        'SparklineDefaults',
        '—',
        'Application',
        'Sets curve, area, marker and formatOptions once, in a route or the application config; an input still wins',
      ],
    ]),
    accessibility: [
      'The root carries role="img" and an aria-label generated from the data: the last value, the direction and the change since the first — “Fill rate: 96.1%, up 3.2% since 92.9%”. Those are the two numbers a sparkline exists to compare, and they reach a reader who cannot see the shape.',
      'The svg is aria-hidden. A drawing with no interaction is an image, and its content is pixels; there is no APG pattern for a sparkline, and the WAI-ARIA Graphics module reserves graphics-document for a drawing whose parts are navigable, which this one has none of.',
      'Nothing here is focusable and nothing answers a key. Tooltips and per-point highlight belong to chart; a sparkline with them would be a small line chart.',
      'Colour never carries the reading alone: the direction is in the description, the current bar is the last one by position as well as by colour, and a tone is a second encoding on top of the shape.',
      'Under forced colours the data scale and the tones map to CanvasText, the wash is withdrawn, earlier bars take GrayText and the current one CanvasText, so a series still reads as one.',
      'The eight slots of the data scale were chosen by measurement: adjacent slots separate by at least ΔE 16.8 under simulated protanopia and deuteranopia in every scheme, and every slot clears 3:1 against every surface.',
    ],
    snippets: [
      defineSnippet({
        id: 'sparkline-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<span\n  aria-label="Fill rate: 96.1%, up 3.2% since 92.9%"\n  data-ui="sparkline"\n  data-part="root"\n  data-type="line"\n  data-size="md"\n  data-curve="linear"\n  role="img"\n>\n  <svg aria-hidden="true" data-part="plot" preserveAspectRatio="none" viewBox="0 0 96 32">\n    <path data-part="area" d="…" />\n    <path data-part="line" d="…" />\n    <line data-part="reference" x1="0" x2="96" y1="9" y2="9" />\n    <path data-part="ring" d="M92 5h0.001" />\n    <path data-part="marker" d="M92 5h0.001" />\n  </svg>\n</span>',
      }),
      defineSnippet({
        id: 'sparkline-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='sparkline'] {\n  --slotted-sparkline-line-width: 1.5px;\n  --slotted-sparkline-area-opacity: 0.12;\n  --slotted-sparkline-bar-share: 50%;\n}\n\n/* A row on a tinted ground hands the marker its ring colour. */\n[data-ui='table'] [data-part='row']:hover {\n  --slotted-sparkline-ring-color: var(--slotted-tone-secondary-subtle-hover);\n}",
      }),
    ],
  },
} as const;
