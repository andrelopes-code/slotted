import { defineSnippet } from '@slotted/storybook-workbench';
import type { ApiRow } from '@slotted/storybook-workbench';
import tabsTokens from '@slotted/styles/tabs/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TABS_TOKENS = tabsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tabs family decision',
}));

const wiringApi: ApiTuple[] = [
  ['content', 'projected', '—', 'Part', 'Projected content'],
  ['class', 'string', '—', 'Part', 'Additional class names'],
];

export const ANGULAR_TABS_DOCS = {
  tabs: {
    api: apiRows([
      ['value', 'string', '—', 'SlTabs', 'Selected value when controlled'],

      ['valueChange', 'output<string>', '—', 'SlTabs', 'Reports a new selection'],
      [
        'orientation',
        'horizontal | vertical',
        'horizontal',
        'SlTabs',
        'Axis the arrow keys follow',
      ],
      ['activation', 'automatic | manual', 'automatic', 'SlTabs', 'Whether focus also selects'],
      ['id', 'string', '—', 'SlTabs', 'Base every identifier derives from'],
      ...wiringApi,
    ]),
    accessibility: [
      'The list is one tab stop; arrow keys move between tabs and Home and End jump to the ends.',
      'Arrow keys follow the orientation, and disabled tabs are skipped rather than focused.',
      'Each tab carries aria-controls and each panel aria-labelledby, resolved through derived identifiers.',
      'Unselected panels are hidden rather than unmounted, so content inside them keeps its state.',
      'Manual activation exists for panels that are expensive to render: focus moves, Enter or Space selects.',
      'The rule under the list is a layout opinion: inside a bordered surface it doubles up. Setting --slotted-tabs-track-color to transparent removes it.',
    ],
    snippets: [
      defineSnippet({
        id: 'tabs-angular-basic',
        language: 'angular',
        label: 'Tabs with panels',
        source:
          '<div slTabs [(value)]="section">\n  <div slTabList aria-label="Report sections">\n    <button slTab value="overview">Overview</button>\n    <button slTab value="billing">Billing</button>\n  </div>\n  <div slTabPanel value="overview">Overview panel</div>\n  <div slTabPanel value="billing">Billing panel</div>\n</div>',
      }),
    ],
  },
  tabList: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  tab: {
    api: apiRows([
      ['value', 'string', '—', 'SlTab', 'Identifies the tab and its panel'],
      ['disabled', 'boolean', 'false', 'SlTab', 'Skips the tab in the roving tab stop'],
      ...wiringApi,
    ]),
    accessibility: [],
    snippets: [],
  },
  tabPanel: {
    api: apiRows([['value', 'string', '—', 'SlTabPanel', 'Matches its tab'], ...wiringApi]),
    accessibility: [],
    snippets: [],
  },
} as const;
