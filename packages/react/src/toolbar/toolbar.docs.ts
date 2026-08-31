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

export const REACT_TOOLBAR_TOKENS = toolbarTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toolbar decision',
}));

export const REACT_TOOLBAR_DOCS = {
  toolbar: {
    api: apiRows([
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'Toolbar',
        'Axis the controls are arranged on, and the arrow pair that moves between them',
      ],
      ['aria-label', 'string', '—', 'Toolbar', 'Names the toolbar; required'],
      ['children', 'ReactNode', '—', 'Toolbar', 'The controls, which are the consumer’s own'],
      ['className', 'string', '—', 'Toolbar', 'Additional class names'],
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
        id: 'toolbar-react-formatting',
        language: 'tsx',
        label: 'A formatting bar with a separator',
        source:
          '<Toolbar aria-label="Formatting">\n  <Button size="sm">Bold</Button>\n  <Button size="sm">Italic</Button>\n  <Divider orientation="vertical" />\n  <Button size="sm">Align left</Button>\n</Toolbar>;',
      }),
    ],
  },
} as const;
