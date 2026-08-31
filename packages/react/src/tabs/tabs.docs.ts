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

export const REACT_TABS_TOKENS = tabsTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Tabs family decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_TABS_DOCS = {
  tabs: {
    api: apiRows([
      ['value', 'string', '—', 'Tabs', 'Selected value when controlled'],
      ['defaultValue', 'string', '—', 'Tabs', 'Selected value when uncontrolled'],
      ['onValueChange', '(value: string) => void', '—', 'Tabs', 'Reports a new selection'],
      ['orientation', 'horizontal | vertical', 'horizontal', 'Tabs', 'Axis the arrow keys follow'],
      ['activation', 'automatic | manual', 'automatic', 'Tabs', 'Whether focus also selects'],
      ['id', 'string', '—', 'Tabs', 'Base every identifier derives from'],
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
        id: 'tabs-react-basic',
        language: 'tsx',
        label: 'Tabs with panels',
        source:
          '<Tabs defaultValue="overview">\n  <TabList aria-label="Report sections">\n    <Tab value="overview">Overview</Tab>\n    <Tab value="billing">Billing</Tab>\n  </TabList>\n  <TabPanel value="overview">Overview panel</TabPanel>\n  <TabPanel value="billing">Billing panel</TabPanel>\n</Tabs>;',
      }),
    ],
  },
  tabList: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  tab: {
    api: apiRows([
      ['value', 'string', '—', 'Tab', 'Identifies the tab and its panel'],
      ['disabled', 'boolean', 'false', 'Tab', 'Skips the tab in the roving tab stop'],
      ...wiringApi,
    ]),
    accessibility: [],
    snippets: [],
  },
  tabPanel: {
    api: apiRows([['value', 'string', '—', 'TabPanel', 'Matches its tab'], ...wiringApi]),
    accessibility: [],
    snippets: [],
  },
} as const;
