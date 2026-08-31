import visuallyHiddenTokens from '@slotted/styles/visually-hidden/tokens.json';
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

export const ANGULAR_VISUALLY_HIDDEN_TOKENS = (visuallyHiddenTokens as readonly string[]).map(
  (name) => ({ name, purpose: 'Theme-owned VisuallyHidden decision' }),
);

export const ANGULAR_VISUALLY_HIDDEN_DOCS = {
  visuallyHidden: {
    api: apiRows([
      [
        'focusable',
        'boolean',
        'false',
        'slVisuallyHidden',
        'Reveals the content while focus is inside it',
      ],
    ]),
    accessibility: [
      'The content stays in the accessibility tree: the stylesheet clips it rather than applying display: none or visibility: hidden.',
      'A screen reader reads the content in document order, so it belongs where it would be read, not at the end of the document.',
      'focusable is for content a sighted keyboard user must be able to reach, such as a skip link, which has to become visible once it holds focus.',
      'The directive selector is the bare attribute, so it applies to whichever element carries the semantics: a span, an anchor, or a table cell.',
    ],
    snippets: [
      defineSnippet({
        id: 'visually-hidden-angular-icon-label',
        language: 'angular',
        label: 'An accessible name for an icon-only control',
        source:
          '<button type="button">\n  <span aria-hidden="true">&#128465;</span>\n  <span slVisuallyHidden>Delete invoice</span>\n</button>',
      }),
      defineSnippet({
        id: 'visually-hidden-angular-skip-link',
        language: 'angular',
        label: 'A skip link that appears on focus',
        source: '<a slVisuallyHidden focusable href="#main">Skip to content</a>',
      }),
    ],
  },
} as const;
