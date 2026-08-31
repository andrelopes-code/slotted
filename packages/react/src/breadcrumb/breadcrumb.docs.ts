import breadcrumbTokens from '@slotted/styles/breadcrumb/tokens.json';
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

export const REACT_BREADCRUMB_TOKENS = breadcrumbTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Breadcrumb decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_BREADCRUMB_DOCS = {
  breadcrumb: {
    api: apiRows([
      ['aria-label', 'string', 'Breadcrumb', 'Breadcrumb', 'Names the navigation landmark'],
      ['render', '(props) => ReactNode', '—', 'Breadcrumb', 'Renders a different root element'],
      ...wiringApi,
    ]),
    accessibility: [
      'The root is a nav landmark with a default name of "Breadcrumb", because a page with two unnamed navigation landmarks gives a screen reader two identical entries to choose between.',
      'Pointing at visible text with aria-labelledby suppresses the default label, so the two never both appear.',
      'The list is an ol: the crumbs are a path and their order is the information a ul would throw away.',
      'The separator is drawn by the stylesheet and is never in the accessibility tree, so a reader hears "Workspace, Invoices, INV-0042" rather than a slash between each.',
      'The current crumb keeps its href and carries aria-current="page". Dropping the link would take it out of the tab order and out of the list of links a screen reader can enumerate.',
    ],
    snippets: [
      defineSnippet({
        id: 'breadcrumb-react-basic',
        language: 'tsx',
        label: 'A path with the current page at the end',
        source:
          '<Breadcrumb>\n  <BreadcrumbList>\n    <BreadcrumbItem>\n      <BreadcrumbLink href="/">Workspace</BreadcrumbLink>\n    </BreadcrumbItem>\n    <BreadcrumbItem>\n      <BreadcrumbLink current href="/invoices/42">\n        INV-0042\n      </BreadcrumbLink>\n    </BreadcrumbItem>\n  </BreadcrumbList>\n</Breadcrumb>;',
      }),
    ],
  },
  breadcrumbList: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  breadcrumbItem: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  breadcrumbLink: {
    api: apiRows([
      ['current', 'boolean', 'false', 'BreadcrumbLink', 'Marks the page the reader is on'],
      ...wiringApi,
    ]),
    accessibility: [],
    snippets: [],
  },
} as const;
