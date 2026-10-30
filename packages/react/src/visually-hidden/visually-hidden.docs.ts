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
        'Stops hiding the content while focus is inside it',
      ],
      ['render', '(props) => ReactNode', '—', 'VisuallyHidden', 'Renders a different element'],
      [
        'children',
        'ReactNode',
        '—',
        'VisuallyHidden',
        'Content exposed only to assistive technology',
      ],
      ['className', 'string', '—', 'VisuallyHidden', 'Class names, forwarded untouched'],
    ]),
    accessibility: [
      'The content stays in the accessibility tree: the stylesheet clips it rather than applying display: none or visibility: hidden.',
      'The content costs no space. The element is taken out of flow and held to one pixel, so a control that gains an accessible name this way is the size it was, and a hidden span between two flex items does not become a second gap.',
      'A screen reader reads the content in document order, so it belongs where it would be read, not at the end of the document.',
      'The whole string stays in the document, so a page search finds it and a selection copies it. Hidden text is content, not decoration.',
      'focusable is for content a sighted keyboard user must be able to reach, such as a skip link. While focus is inside, the hiding rule stops matching and the element renders as the consumer wrote it — the component paints nothing on the revealed state, so the appearance of a skip link belongs to the link.',
      'The component adds no role and no class. Wrap it in the element that carries the semantics, or hand the wiring to that element with render. Select it in the DOM as [data-ui="visually-hidden"].',
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
