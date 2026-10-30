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
      [
        'inset',
        'boolean',
        'false',
        'Divider',
        'Stops the rule short of both ends of its container',
      ],
      ['label', 'string', '—', 'Divider', 'Short string the rule is interrupted by, and its name'],
      ['align', "'start' | 'center' | 'end'", 'center', 'Divider', 'Where the label sits'],
      ['render', '(props) => ReactNode', '—', 'Divider', 'Renders a different root element'],
    ]),
    accessibility: [
      'The plain rule is an hr, which already exposes the separator role, so the component writes no role of its own.',
      'A vertical rule receives aria-orientation, because a separator is horizontal unless it says otherwise.',
      'decorative sets role="none". Use it when the rule groups content visually and a screen reader user loses nothing by not hearing it.',
      'A labelled rule renders a div, because an hr takes no content. Its name comes from aria-label: the separator role makes its children presentational, so the visible label alone would leave the rule announced as empty.',
      'A decorative rule carries no name, because role="none" prohibits one. Its label is read in document order, like any other text.',
      'A rule rendered into another element — the li a menu separator has to be — receives role="separator", because only the hr carries that meaning by itself.',
      'A role or an aria-label the consumer passes is kept, so a rule that has to say something else keeps saying it.',
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
      defineSnippet({
        id: 'divider-react-label',
        language: 'tsx',
        label: 'A rule interrupted by a label',
        source:
          '<>\n  <SignInWithGoogle />\n  <Divider label="Or" />\n  <EmailAndPassword />\n</>;',
      }),
      defineSnippet({
        id: 'divider-react-menu',
        language: 'tsx',
        label: 'A separator between two groups of menu items',
        source:
          '<ul role="menu">\n  <li role="menuitem">Rename</li>\n  <Divider inset render={(props) => <li {...props} />} />\n  <li role="menuitem">Delete</li>\n</ul>;',
      }),
    ],
  },
} as const;
