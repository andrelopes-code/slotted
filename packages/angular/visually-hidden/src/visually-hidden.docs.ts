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

/**
 * Empty on purpose. A hiding technique has nothing a theme retunes: the box is
 * one pixel because a screen reader needs a rendered box, not because a scale
 * said so.
 */
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
        'Stops hiding the content while focus is inside it',
      ],
    ]),
    accessibility: [
      'The content stays in the accessibility tree: the stylesheet clips it rather than applying display: none or visibility: hidden.',
      'The content costs no space. The element is taken out of flow and held to one pixel, so a control that gains an accessible name this way is the size it was, and a hidden span between two flex items does not become a second gap.',
      'A screen reader reads the content in document order, so it belongs where it would be read, not at the end of the document.',
      'The whole string stays in the document, so a page search finds it and a selection copies it. Hidden text is content, not decoration.',
      'focusable is for content a sighted keyboard user must be able to reach, such as a skip link. While focus is inside, the hiding rule stops matching and the element renders as it was written — the family paints nothing on the revealed state, so the appearance of a skip link belongs to the link.',
      'The selector is the bare attribute, so it applies to whichever element carries the semantics: a span, an anchor, or a table cell. It adds no role and no class, and is selected in the DOM as [data-ui="visually-hidden"].',
    ],
    snippets: [
      defineSnippet({
        id: 'visually-hidden-angular-icon-label',
        language: 'angular',
        label: 'An accessible name for an icon-only control',
        source:
          '<button type="button">\n  <svg aria-hidden="true" viewBox="0 0 24 24">\n    <path d="M18 6 6 18M6 6l12 12" />\n  </svg>\n  <span slVisuallyHidden>Delete invoice</span>\n</button>',
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
