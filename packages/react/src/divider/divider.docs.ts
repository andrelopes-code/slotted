import dividerTokens from '@slotted/styles/divider/tokens.json';
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

export const REACT_DIVIDER_TOKENS = dividerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Divider decision',
}));

export const REACT_DIVIDER_DOCS = {
  divider: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Divider',
        'Direction the rule runs in',
      ],
      ['decorative', 'boolean', 'false', 'Divider', 'Removes the rule from the accessibility tree'],
      ['render', '(props) => ReactNode', '—', 'Divider', 'Renders a different root element'],
      ['className', 'string', '—', 'Divider', 'Additional class names'],
    ]),
    accessibility: [
      'The rendered element is an hr, which already exposes the separator role, so the component sets no role of its own.',
      'A vertical rule receives aria-orientation, because a separator is horizontal unless it says otherwise.',
      'decorative sets role="none". Use it when the rule groups content visually and a screen reader user loses nothing by not hearing it.',
      'A role the consumer passes is kept, so a rule rendered as another element can carry the semantics that element needs.',
    ],
    snippets: [
      defineSnippet({
        id: 'divider-react-sections',
        language: 'tsx',
        label: 'Separating two regions',
        source: '<section>\n  <h2>Billing</h2>\n  <Divider />\n  <h2>Members</h2>\n</section>;',
      }),
      defineSnippet({
        id: 'divider-react-toolbar',
        language: 'tsx',
        label: 'A vertical rule between groups of controls',
        source:
          '<div className="toolbar">\n  <Button>Bold</Button>\n  <Divider orientation="vertical" />\n  <Button>Align left</Button>\n</div>;',
      }),
    ],
  },
} as const;
