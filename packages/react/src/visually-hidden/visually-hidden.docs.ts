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

export const REACT_VISUALLY_HIDDEN_TOKENS = (visuallyHiddenTokens as readonly string[]).map(
  (name) => ({ name, purpose: 'Theme-owned VisuallyHidden decision' }),
);

export const REACT_VISUALLY_HIDDEN_DOCS = {
  visuallyHidden: {
    api: apiRows([
      [
        'focusable',
        'boolean',
        'false',
        'VisuallyHidden',
        'Reveals the content while focus is inside it',
      ],
      ['render', '(props) => ReactNode', '—', 'VisuallyHidden', 'Renders a different element'],
      [
        'children',
        'ReactNode',
        '—',
        'VisuallyHidden',
        'Content exposed only to assistive technology',
      ],
      ['className', 'string', '—', 'VisuallyHidden', 'Additional class names'],
    ]),
    accessibility: [
      'The content stays in the accessibility tree: the stylesheet clips it rather than applying display: none or visibility: hidden.',
      'A screen reader reads the content in document order, so it belongs where it would be read, not at the end of the document.',
      'focusable is for content a sighted keyboard user must be able to reach, such as a skip link, which has to become visible once it holds focus.',
      'The component adds no role. Wrap it in the element that carries the semantics, or hand the wiring to that element with render.',
    ],
    snippets: [
      defineSnippet({
        id: 'visually-hidden-react-icon-label',
        language: 'tsx',
        label: 'An accessible name for an icon-only control',
        source:
          '<button type="button">\n  <TrashIcon aria-hidden="true" />\n  <VisuallyHidden>Delete invoice</VisuallyHidden>\n</button>;',
      }),
      defineSnippet({
        id: 'visually-hidden-react-skip-link',
        language: 'tsx',
        label: 'A skip link that appears on focus',
        source:
          '<VisuallyHidden focusable render={(props) => <a {...props} href="#main" />}>\n  Skip to content\n</VisuallyHidden>;',
      }),
    ],
  },
} as const;
