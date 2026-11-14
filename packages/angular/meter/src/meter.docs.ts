import meterTokens from '@slotted/styles/meter/tokens.json';
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

export const ANGULAR_METER_TOKENS = meterTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Meter decision',
}));

const imports: ReferenceImport = {
  source: "import { SlMeter, provideMeterDefaults } from '@slotted/angular/meter';",
  selector: '[slMeter]',
  exportAs: 'slMeter',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'role="meter" with aria-valuenow, aria-valuemin, aria-valuemax and the share as aria-valuetext; no role and aria-hidden under decorative. Takes the whole inline size it is given, at least 4rem.',
  },
  {
    part: 'track',
    element: 'span',
    required: true,
    purpose: 'One continuous ground, with no gap and no end mark: a share goes nowhere.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose:
      'The share, from the inline start, in the tone’s ink. Mirrors in a right-to-left document.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One reading against its range: change the value, the range and the size, and inspect the root for the value text a screen reader hears.',
    snippet: defineSnippet({
      id: 'meter-angular-playground',
      language: 'angular',
      label: 'A share of a whole',
      source: '<div slMeter aria-label="Share of the total" [value]="41"></div>',
    }),
  },
  {
    id: 'tones',
    title: 'What the reading means',
    note: 'A tone paints the indicator in the tone’s ink over a ground mixed from the same ink, so a pale track never reads as a filled one. secondary and neutral take the strong border step.',
    snippet: defineSnippet({
      id: 'meter-angular-tones',
      language: 'angular',
      label: 'A tone per meaning',
      source:
        '<div slMeter aria-label="Budget used" tone="warning" [value]="82"></div>\n<div slMeter aria-label="Quota left" tone="success" [value]="64"></div>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three thicknesses, and the length is the container’s',
    note: 'sm is four pixels for a dense row, md six for a card, lg eight for a summary that leads a page. The length is always what the cell or the column gave, never less than 4rem.',
    snippet: defineSnippet({
      id: 'meter-angular-sizes',
      language: 'angular',
      label: 'By size',
      source:
        '<div slMeter aria-label="Storage" size="sm" [value]="72"></div>\n<div slMeter aria-label="Storage" size="lg" [value]="72"></div>',
    }),
  },
  {
    id: 'regions',
    title: 'Regions that pick the tone',
    note: 'low, high and optimum split the range as the HTML meter element does: a disk with optimum at nought is success below 60%, warning up to 85% and danger past it. A stated tone wins.',
    snippet: defineSnippet({
      id: 'meter-angular-regions',
      language: 'angular',
      label: 'Disk usage against its thresholds',
      source:
        '<div slMeter aria-label="Disk usage" [high]="85" [low]="60" [optimum]="0" [value]="91"></div>',
    }),
  },
  {
    id: 'in-table',
    title: 'A share column',
    note: 'The meter’s home: a decorative bar in the column after the exact percentage, filling the cell of an auto-layout table, so a reader hears the number once and sees the proportion beside it.',
    snippet: defineSnippet({
      id: 'meter-angular-in-table',
      language: 'angular',
      label: 'A cell of the table',
      source:
        '<td slTableCell numeric>43.80%</td>\n<td slTableCell>\n  <div slMeter decorative [max]="10000" [value]="4380"></div>\n</td>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The root is a meter named by its aria-label, read as “Fixed income, meter, 43.8%”: the share in the locale of the language in force, or the valueText given in its place.',
    snippet: defineSnippet({
      id: 'meter-angular-accessibility',
      language: 'angular',
      label: 'A name and the text of the value',
      source:
        '<div slMeter aria-label="Used storage" [max]="5" [value]="3" valueText="3 of 5 GB"></div>',
    }),
  },
];

export const ANGULAR_METER_DOCS = {
  meter: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'value',
        'number',
        '—',
        'slMeter',
        'The reading. A value outside the range is drawn at its end',
      ],
      ['min', 'number', '0', 'slMeter', 'The start of the range'],
      ['max', 'number', '100', 'slMeter', 'The end of the range'],
      [
        'low, high, optimum',
        'number',
        '—',
        'slMeter',
        'The marks that split the range into regions; with any of them the region the value falls in picks the tone',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger'",
        'accent',
        'slMeter',
        'The ink of the indicator. Wins over the regions',
      ],
      ['size', "'sm' | 'md' | 'lg'", 'md', 'slMeter', 'The thickness of the track'],
      [
        'decorative',
        'boolean',
        'false',
        'slMeter',
        'No role and aria-hidden, for a meter beside words that state its value',
      ],
      ['valueText', 'string', '—', 'slMeter', 'The whole aria-valuetext, replacing the share'],
      [
        'formatOptions',
        'Intl.NumberFormatOptions',
        "{ style: 'percent' }",
        'slMeter',
        'How the share is written in aria-valuetext',
      ],
      [
        'locale',
        'string',
        '—',
        'slMeter',
        'The locale of the share; the language in force when absent',
      ],
      [
        'render',
        '(props: MeterRootProps) => ReactNode',
        '—',
        'slMeter',
        'Substitutes the root element',
      ],
      [
        'provideMeterDefaults',
        'MeterDefaults',
        '—',
        'Application',
        'Sets size and formatOptions once for everything below it; an input still wins',
      ],
    ]),
    accessibility: [
      'The host carries role="meter", the role the APG and the HTML meter element give a static value in a range. A progressbar announces a task under way, and a page that drew a share with one read as still loading to a screen reader and to a test that waits for no progressbar.',
      'aria-valuenow, aria-valuemin and aria-valuemax state the reading; aria-valuetext states the share in the locale of the language in force, because 4380 out of 10000 is heard as 43.8% rather than as four thousand three hundred and eighty.',
      'The meter needs a name: aria-label or aria-labelledby, written on the element the directive is on.',
      'decorative removes the role and hides the root, for a meter whose value is written beside it: the reader hears the number once.',
      'Color never carries the reading alone: the length is the value, and a tone is a second encoding on top of it. Under forced colors the track keeps a CanvasText outline and the indicator takes Highlight.',
    ],
    snippets: [
      defineSnippet({
        id: 'meter-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  slMeter\n  aria-label="Share"\n  aria-valuemax="100"\n  aria-valuemin="0"\n  aria-valuenow="41"\n  aria-valuetext="41%"\n  data-part="root"\n  data-size="md"\n  data-tone="accent"\n  data-ui="meter"\n  role="meter"\n>\n  <span data-part="track"><span data-part="indicator"></span></span>\n</div>',
      }),
      defineSnippet({
        id: 'meter-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='meter'] {\n  --slotted-meter-thickness: 4px;\n  --slotted-meter-radius: 2px;\n}",
      }),
    ],
  },
} as const;
