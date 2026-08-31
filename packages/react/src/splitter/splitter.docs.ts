import splitterTokens from '@slotted/styles/splitter/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_SPLITTER_TOKENS = splitterTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Splitter decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_SPLITTER_DOCS = {
  splitter: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Splitter',
        'How the two panes are arranged',
      ],
      ['value', 'number', '—', 'Splitter', 'Percentage of the container taken by the first pane'],
      ['defaultValue', 'number', '50', 'Splitter', 'Starting percentage when uncontrolled'],
      [
        'onValueChange',
        '(value: number) => void',
        '—',
        'Splitter',
        'Called with each new position',
      ],
      ['min', 'number', '0', 'Splitter', 'Smallest percentage the first pane may take'],
      ['max', 'number', '100', 'Splitter', 'Largest percentage the first pane may take'],
      ['step', 'number', '5', 'Splitter', 'Percentage each arrow key moves the separator'],
      ...wiringApi,
    ]),
    accessibility: [
      'The handle is role="separator" with tabindex="0", which is what makes a separator a widget rather than a decoration.',
      'Its aria-orientation is perpendicular to the root’s: a vertical line separates two side-by-side panes. horizontal is the attribute’s default, so it is written only for the side-by-side case.',
      'The keyboard model is the Authoring Practices window splitter pattern: arrows across the separator move it, Home and End go to the limits, Enter collapses and restores.',
      'The arrow pair along the separator is deliberately left alone, so a page inside a pane still scrolls with the keyboard.',
      'In a right-to-left document the arrows swap, because the first pane is on the right and Left must still give it more room.',
      'The handle needs an accessible name; a development build warns when neither aria-label nor aria-labelledby is present. Pass aria-controls pointing at the pane it resizes when the panes have ids.',
    ],
    snippets: [
      defineSnippet({
        id: 'splitter-react-basic',
        language: 'tsx',
        label: 'Two panes with a movable boundary',
        source:
          '<Splitter defaultValue={30} min={15} max={70}>\n  <SplitterPane id="nav">Navigation</SplitterPane>\n  <SplitterHandle aria-controls="nav" aria-label="Resize navigation" />\n  <SplitterPane>Content</SplitterPane>\n</Splitter>;',
      }),
    ],
  },
  splitterPane: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  splitterHandle: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
