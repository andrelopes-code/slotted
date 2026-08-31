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
    ]),
    accessibility: [
      'The rendered element is an hr, which already exposes the separator role, so the component sets no role of its own.',
      'A vertical rule receives aria-orientation, because a separator is horizontal unless it says otherwise.',
      'decorative sets role="none". Use it when the rule groups content visually and a screen reader user loses nothing by not hearing it.',
      'A role already on the element is kept, so a rule that has to say something else keeps saying it.',
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
    ],
  },
} as const;
