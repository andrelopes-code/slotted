import linkTokens from '@slotted/styles/link/tokens.json';
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

export const ANGULAR_LINK_TOKENS = linkTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Link decision',
}));

export const ANGULAR_LINK_DOCS = {
  link: {
    api: apiRows([
      [
        'underline',
        "'always' | 'hover' | 'none'",
        'always',
        'slLink',
        'When the underline is drawn',
      ],
      ['external', 'boolean', 'false', 'slLink', 'Opens a new tab and warns that it does'],
      [
        'externalHint',
        'string',
        '(opens in a new tab)',
        'slLink',
        'Wording of that warning, for translation',
      ],
    ]),
    accessibility: [
      'The directive sits on a plain anchor, so the link role, keyboard activation and context menu come from the platform, and routerLink composes with it.',
      'underline="always" is the default because colour alone does not distinguish a link for a reader who cannot see the difference.',
      'Whatever the underline axis says, the underline returns under forced-colors, where the palette flattens the colour contrast a bare link relies on.',
      'external appends hidden text to the accessible name, so a screen reader user learns that the link leaves the page before following it.',
      'external also sets rel="noopener noreferrer", and a rel or target the consumer passed is kept instead.',
    ],
    snippets: [
      defineSnippet({
        id: 'link-angular-inline',
        language: 'angular',
        label: 'Inline in prose',
        source: '<p>Read the <a slLink href="/terms">terms of service</a> before continuing.</p>',
      }),
      defineSnippet({
        id: 'link-angular-external',
        language: 'angular',
        label: 'Leaving the application',
        source: '<a slLink external href="https://example.com/docs">Documentation</a>',
      }),
    ],
  },
} as const;
