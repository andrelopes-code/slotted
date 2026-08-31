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

export const REACT_COLLAPSIBLE_TOKENS = collapsibleTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Collapsible decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_COLLAPSIBLE_DOCS = {
  collapsible: {
    api: apiRows([
      ['open', 'boolean', 'false', 'Collapsible', 'Whether the region is showing'],
      ['defaultOpen', 'boolean', 'false', 'Collapsible', 'Starting state when uncontrolled'],
      [
        'onOpenChange',
        '(open: boolean) => void',
        '—',
        'Collapsible',
        'Called when the reader opens or closes it',
      ],
      ...wiringApi,
    ]),
    accessibility: [
      'The family is a details and a summary. The disclosure role, the expanded state, Enter and Space, and find-in-page reaching text inside a closed region all come from the platform.',
      'Nothing here sets aria-expanded or aria-controls. Adding them would restate what the element already says, and one of the two is usually the one that goes stale.',
      'The trigger must be the first child of the root. That is the platform’s constraint on summary, not the library’s.',
      'A controlled Collapsible is put back where the consumer says it is: the element opens itself on click, and the component closes it again until the new value arrives.',
      'The disclosure marker is a pseudo-element, so it is never announced. The summary already reports collapsed or expanded.',
    ],
    snippets: [
      defineSnippet({
        id: 'collapsible-react-basic',
        language: 'tsx',
        label: 'A region the reader can put away',
        source:
          '<Collapsible defaultOpen>\n  <CollapsibleTrigger>Billing details</CollapsibleTrigger>\n  <CollapsibleContent>Invoices are issued monthly.</CollapsibleContent>\n</Collapsible>;',
      }),
    ],
  },
  collapsibleTrigger: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  collapsibleContent: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
