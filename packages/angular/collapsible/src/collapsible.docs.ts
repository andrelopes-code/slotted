import collapsibleTokens from '@slotted/styles/collapsible/tokens.json';
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

export const ANGULAR_COLLAPSIBLE_TOKENS = collapsibleTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Collapsible decision',
}));

export const ANGULAR_COLLAPSIBLE_DOCS = {
  collapsible: {
    api: apiRows([
      [
        'open',
        'boolean',
        'false',
        'slCollapsible',
        'Whether the region is showing; two-way with [(open)]',
      ],
    ]),
    accessibility: [
      'The family is a details and a summary. The disclosure role, the expanded state, Enter and Space, and find-in-page reaching text inside a closed region all come from the platform.',
      'Nothing here sets aria-expanded or aria-controls. Adding them would restate what the element already says, and one of the two is usually the one that goes stale.',
      'The trigger must be the first child of the root. That is the platform’s constraint on summary, not the library’s.',
      '[(open)] writes the reader’s change back into the consumer’s signal, so the value and the element never disagree.',
      'The disclosure marker is a pseudo-element, so it is never announced. The summary already reports collapsed or expanded.',
    ],
    snippets: [
      defineSnippet({
        id: 'collapsible-angular-basic',
        language: 'angular',
        label: 'A region the reader can put away',
        source:
          '<details slCollapsible [(open)]="showBilling">\n  <summary slCollapsibleTrigger>Billing details</summary>\n  <div slCollapsibleContent>Invoices are issued monthly.</div>\n</details>',
      }),
    ],
  },
  collapsibleTrigger: { api: [], accessibility: [], snippets: [] },
  collapsibleContent: { api: [], accessibility: [], snippets: [] },
} as const;
