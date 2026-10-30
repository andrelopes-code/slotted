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

export const ANGULAR_DIVIDER_TOKENS = dividerTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Divider decision',
}));

export const ANGULAR_DIVIDER_DOCS = {
  divider: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slDivider',
        'Direction the rule runs in',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'slDivider',
        'Removes the rule from the accessibility tree',
      ],
      [
        'inset',
        'boolean',
        'false',
        'slDivider',
        'Stops the rule short of both ends of its container',
      ],
      [
        'label',
        'string',
        '—',
        'slDivider',
        'Short string the rule is interrupted by, and its name',
      ],
      ['align', "'start' | 'center' | 'end'", 'center', 'slDivider', 'Where the label sits'],
    ]),
    accessibility: [
      'The selector is a bare attribute, so the element is the consumer’s. On an hr the separator role is already there and the component writes no role of its own.',
      'On any other element — the li a menu separator has to be, or the div a label needs — the component writes role="separator", because only the hr carries that meaning by itself.',
      'A vertical rule receives aria-orientation, because a separator is horizontal unless it says otherwise.',
      'decorative sets role="none". Use it when the rule groups content visually and a screen reader user loses nothing by not hearing it.',
      'A labelled rule takes its name from aria-label: the separator role makes its children presentational, so the visible label alone would leave the rule announced as empty. An hr takes no content, so put the label on a div.',
      'A decorative rule carries no name, because role="none" prohibits one. Its label is read in document order, like any other text.',
      'A role or an aria-label already on the element is kept, so a rule that has to say something else keeps saying it.',
    ],
    snippets: [
      defineSnippet({
        id: 'divider-angular-sections',
        language: 'angular',
        label: 'Separating two regions',
        source: '<section>\n  <h2>Billing</h2>\n  <hr slDivider />\n  <h2>Members</h2>\n</section>',
      }),
      defineSnippet({
        id: 'divider-angular-toolbar',
        language: 'angular',
        label: 'A vertical rule between groups of controls',
        source:
          '<div class="toolbar">\n  <button slButton>Bold</button>\n  <hr slDivider orientation="vertical" />\n  <button slButton>Align left</button>\n</div>',
      }),
      defineSnippet({
        id: 'divider-angular-label',
        language: 'angular',
        label: 'A rule interrupted by a label',
        source:
          '<sl-sign-in-with-google />\n<div slDivider label="Or"></div>\n<sl-email-and-password />',
      }),
      defineSnippet({
        id: 'divider-angular-menu',
        language: 'angular',
        label: 'A separator between two groups of menu items',
        source:
          '<ul role="menu">\n  <li role="menuitem">Rename</li>\n  <li slDivider inset></li>\n  <li role="menuitem">Delete</li>\n</ul>',
      }),
    ],
  },
} as const;
