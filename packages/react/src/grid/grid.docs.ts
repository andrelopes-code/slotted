import gridTokens from '@slotted/styles/grid/tokens.json';
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

export const REACT_GRID_TOKENS = gridTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-grid-')
    ? 'A decision the foundation does not hold'
    : 'The foundation scale this family reads',
}));

const GAP = '0 | 1 | … | 12';

export const REACT_GRID_DOCS = {
  grid: {
    api: apiRows([
      ['gap', GAP, '6', 'Grid', 'Separation between cells, as a step on the space scale'],
      [
        'columns',
        '1 | 2 | … | 12',
        'auto',
        'Grid',
        'At most this many tracks; absent, the grid fits as many as it can',
      ],
      [
        'minItemWidth',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'Grid',
        'The narrowest a cell may become before a column is dropped',
      ],
      [
        'align',
        "'start' | 'center' | 'end' | 'stretch'",
        '—',
        'Grid',
        'Positions a child across the flow, inside its own cell',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'stretch'",
        '—',
        'Grid',
        'Positions a child along the flow, inside its own cell',
      ],
      ['render', '(props) => ReactNode', '—', 'Grid', 'Renders a different root element'],
    ]),
    accessibility: [
      'This is not the APG grid widget. There is no role="grid", no cell and no arrow-key navigation: the family lays children out, and the children keep whatever semantics they already had.',
      'There is no axis that reorders or places children. Visual order stays DOM order, which is what WCAG 2.2 SC 1.3.2 asks for (technique C27, failure F1) and what keeps the Tab order matching the page.',
      'A stated count is a ceiling the container may lower. Twelve columns become six and then one as the container narrows, so a page reflows to 320 CSS pixels without scrolling in two dimensions, as WCAG 1.4.10 requires.',
      'The reflow is measured against the grid’s own inline size, not the viewport, so a grid inside a narrow panel behaves the same as one inside a narrow window. No breakpoint and no container query appears in the family.',
      'minItemWidth is stated in rem, so the point at which a column is dropped moves with the browser zoom WCAG 1.4.4 requires.',
    ],
    snippets: [
      defineSnippet({
        id: 'grid-react-cards',
        language: 'tsx',
        label: 'As many cards as fit, never narrower than a card should be',
        source:
          '<Grid gap={6} minItemWidth="md">\n  {workspaces.map((workspace) => (\n    <Card key={workspace.id} {...workspace} />\n  ))}\n</Grid>;',
      }),
      defineSnippet({
        id: 'grid-react-ceiling',
        language: 'tsx',
        label: 'Three columns at most, fewer when the container narrows',
        source:
          '<Grid columns={3} gap={4} minItemWidth="sm">\n  <Metric label="Revenue" />\n  <Metric label="Refunds" />\n  <Metric label="Disputes" />\n</Grid>;',
      }),
      defineSnippet({
        id: 'grid-react-span',
        language: 'tsx',
        label: 'A child that crosses two tracks says so on itself',
        source:
          "<Grid columns={2} gap={6}>\n  <Panel style={{ gridColumn: 'span 2' }}>Summary</Panel>\n  <Panel>Left</Panel>\n  <Panel>Right</Panel>\n</Grid>;",
      }),
    ],
  },
} as const;
