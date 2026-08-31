import progressBarTokens from '@slotted/styles/progress-bar/tokens.json';
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

export const ANGULAR_PROGRESS_BAR_TOKENS = progressBarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned ProgressBar decision',
}));

export const ANGULAR_PROGRESS_BAR_DOCS = {
  progressBar: {
    api: apiRows([
      [
        'value',
        'number | null',
        '—',
        'slProgressBar',
        'Position between zero and max; null is indeterminate',
      ],
      ['max', 'number', '100', 'slProgressBar', 'Value that counts as complete'],
      [
        'valueText',
        'string',
        '—',
        'slProgressBar',
        'What a screen reader reads instead of the percentage',
      ],
    ]),
    accessibility: [
      'The bar needs an accessible name. Give it aria-label, or aria-labelledby pointing at the text that names it; a development build warns when neither is present.',
      'A value outside the range is clamped. The reported aria-valuenow is the clamped one, so the announcement and the painted bar always agree.',
      '[value]="null" is indeterminate: aria-valuenow is omitted entirely, which is how a screen reader is told the position is unknown.',
      'valueText replaces the percentage a screen reader would otherwise compute. "3 of 7 files" tells a listener more than "43 percent".',
      'The indeterminate animation slows under prefers-reduced-motion rather than stopping, because a still bar reports nothing.',
    ],
    snippets: [
      defineSnippet({
        id: 'progress-bar-angular-determinate',
        language: 'angular',
        label: 'Counting files rather than percent',
        source: '<div slProgressBar aria-label="Uploading" [max]="7" [value]="3"></div>',
      }),
      defineSnippet({
        id: 'progress-bar-angular-indeterminate',
        language: 'angular',
        label: 'A wait of unknown length',
        source: '<div slProgressBar aria-label="Preparing" [value]="null"></div>',
      }),
    ],
  },
} as const;
