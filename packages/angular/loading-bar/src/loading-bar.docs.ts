import loadingBarTokens from '@slotted/styles/loading-bar/tokens.json';
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

export const ANGULAR_LOADING_BAR_TOKENS = loadingBarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned LoadingBar decision',
}));

export const ANGULAR_LOADING_BAR_DOCS = {
  loadingBar: {
    api: apiRows([
      [
        'value',
        'number | null',
        '—',
        'slLoadingBar',
        'Position between zero and max; null is indeterminate',
      ],
      ['max', 'number', '100', 'slLoadingBar', 'Value that counts as complete'],
      [
        'placement',
        "'inline' | 'fixed'",
        'inline',
        'slLoadingBar',
        'In the flow, or pinned to the top of the viewport',
      ],
      [
        'valueText',
        'string',
        '—',
        'slLoadingBar',
        'What a screen reader reads instead of the percentage',
      ],
    ]),
    accessibility: [
      'The bar needs an accessible name; a development build warns when neither aria-label nor aria-labelledby is present.',
      '[value] is null by default and the bar is then indeterminate: aria-valuenow is omitted, which is how a screen reader is told the position is unknown.',
      'Render the bar only while something is loading. A bar that is always present but empty reports a wait that is not happening.',
      'placement="fixed" pins the bar to the top of the viewport and takes it out of the flow, so it never moves the content it sits above.',
      'A page-level wait usually also deserves a message. This bar is a picture of progress; a status message says what is being waited for.',
    ],
    snippets: [
      defineSnippet({
        id: 'loading-bar-angular-route',
        language: 'angular',
        label: 'A page-level wait of unknown length',
        source: '<div slLoadingBar placement="fixed" aria-label="Loading page"></div>',
      }),
    ],
  },
} as const;
