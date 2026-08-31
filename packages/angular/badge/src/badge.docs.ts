import badgeTokens from '@slotted/styles/badge/tokens.json';
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

export const ANGULAR_BADGE_TOKENS = badgeTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Badge decision',
}));

export const ANGULAR_BADGE_DOCS = {
  badge: {
    api: apiRows([
      [
        'variant',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        'secondary',
        'slBadge',
        'Tone the badge is painted in',
      ],
      [
        'fill',
        "'solid' | 'outline' | 'subtle'",
        'solid',
        'slBadge',
        'How much of the tone is painted',
      ],
      ['size', "'sm' | 'md'", 'md', 'slBadge', 'Height and type size'],
    ]),
    accessibility: [
      'The badge carries no role. What it means comes from where it sits, and the library cannot know that.',
      'A badge whose text alone is not self-explanatory — a bare count, a single letter — needs an accessible name from the consumer, through aria-label or adjacent hidden text.',
      'Tone is never the only carrier of meaning: a danger badge that reads "Overdue" says so in words as well as in colour.',
      'A badge reporting a value that changes while the page is open belongs inside a live region the consumer owns, not in one the badge declares.',
    ],
    snippets: [
      defineSnippet({
        id: 'badge-angular-status',
        language: 'angular',
        label: 'A status in a table row',
        source: '<span slBadge variant="success">Paid</span>',
      }),
      defineSnippet({
        id: 'badge-angular-count',
        language: 'angular',
        label: 'A count that needs words of its own',
        source: '<span slBadge size="sm" variant="danger" aria-label="3 unread">3</span>',
      }),
    ],
  },
} as const;
