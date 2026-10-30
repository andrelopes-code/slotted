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

export const ANGULAR_GRID_TOKENS = gridTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-grid-')
    ? 'A decision the foundation does not hold'
    : 'The foundation scale this family reads',
}));

const GAP = '0 | 1 | … | 12';

export const ANGULAR_GRID_DOCS = {
  grid: {
    api: apiRows([
      ['gap', GAP, '6', 'slGrid', 'Separation between cells, as a step on the space scale'],
      [
        'columns',
        '1 | 2 | … | 12',
        'auto',
        'slGrid',
        'At most this many tracks; absent, the grid fits as many as it can',
      ],
      [
        'minItemWidth',
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        'md',
        'slGrid',
        'The narrowest a cell may become before a column is dropped',
      ],
      [
        'align',
        "'start' | 'center' | 'end' | 'stretch'",
        '—',
        'slGrid',
        'Positions a child across the flow, inside its own cell',
      ],
      [
        'justify',
        "'start' | 'center' | 'end' | 'stretch'",
        '—',
        'slGrid',
        'Positions a child along the flow, inside its own cell',
      ],
    ]),
    accessibility: [
      'This is not the APG grid widget. There is no role="grid", no cell and no arrow-key navigation: the family lays children out, and the children keep whatever semantics they already had.',
      'The directive selector is an attribute, so the element is always the consumer’s. Write ul when the children are list items.',
      'There is no input that reorders or places children. Visual order stays DOM order, which is what WCAG 2.2 SC 1.3.2 asks for (technique C27, failure F1) and what keeps the Tab order matching the page.',
      'A stated count is a ceiling the container may lower. Twelve columns become six and then one as the container narrows, so a page reflows to 320 CSS pixels without scrolling in two dimensions, as WCAG 1.4.10 requires.',
      'The reflow is measured against the grid’s own inline size, not the viewport, so a grid inside a narrow panel behaves the same as one inside a narrow window.',
    ],
    snippets: [
      defineSnippet({
        id: 'grid-angular-cards',
        language: 'angular',
        label: 'As many cards as fit, never narrower than a card should be',
        source:
          '<div slGrid [gap]="6" minItemWidth="md">\n  @for (workspace of workspaces; track workspace.id) {\n    <app-card [workspace]="workspace" />\n  }\n</div>',
      }),
      defineSnippet({
        id: 'grid-angular-ceiling',
        language: 'angular',
        label: 'Three columns at most, fewer when the container narrows',
        source:
          '<div slGrid [columns]="3" [gap]="4" minItemWidth="sm">\n  <app-metric label="Revenue" />\n  <app-metric label="Refunds" />\n  <app-metric label="Disputes" />\n</div>',
      }),
      defineSnippet({
        id: 'grid-angular-span',
        language: 'angular',
        label: 'A child that crosses two tracks says so on itself',
        source:
          '<div slGrid [columns]="2" [gap]="6">\n  <section style="grid-column: span 2">Summary</section>\n  <section>Left</section>\n  <section>Right</section>\n</div>',
      }),
    ],
  },
} as const;
