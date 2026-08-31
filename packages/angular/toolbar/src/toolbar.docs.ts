import toolbarTokens from '@slotted/styles/toolbar/tokens.json';
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

export const ANGULAR_TOOLBAR_TOKENS = toolbarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toolbar decision',
}));

export const ANGULAR_TOOLBAR_DOCS = {
  toolbar: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slToolbar',
        'Axis the controls are arranged on, and the arrow pair that moves between them',
      ],
      ['aria-label', 'string', '—', 'slToolbar', 'Names the toolbar; required'],
    ]),
    accessibility: [
      'The toolbar is one tab stop. Twelve buttons in a formatting bar should cost a keyboard user one Tab, not twelve, and that is the whole reason the pattern exists.',
      'Arrows across the axis move between controls, Home and End go to the ends, and focus wraps past either end.',
      'The arrow pair along the axis is left alone, so a page inside or around the toolbar still scrolls.',
      'A disabled control is stepped over but stays in the list, so disabling one does not renumber the others.',
      'The toolbar needs a name; a development build warns when neither aria-label nor aria-labelledby is present.',
      'The controls are the consumer’s own elements. Nothing has to be wrapped, and a control added later joins the tab stop on its own.',
    ],
    snippets: [
      defineSnippet({
        id: 'toolbar-angular-formatting',
        language: 'angular',
        label: 'A formatting bar with a separator',
        source:
          '<div slToolbar aria-label="Formatting">\n  <button slButton size="sm">Bold</button>\n  <hr slDivider orientation="vertical" />\n  <button slButton size="sm">Align left</button>\n</div>',
      }),
    ],
  },
} as const;
