import cardTokens from '@slotted/styles/card/tokens.json';
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

export const REACT_CARD_TOKENS = cardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Card decision',
}));

const wiringApi: ApiTuple[] = [
  ['children', 'ReactNode', '—', 'Part', 'Rendered content'],
  ['className', 'string', '—', 'Part', 'Additional class names'],
];

export const REACT_CARD_DOCS = {
  card: {
    api: apiRows([
      ['render', '(props) => ReactNode', '—', 'Card', 'Renders a different root element'],
      ...wiringApi,
    ]),
    accessibility: [
      'The card sets no role. A card is an article in one page, a list item in another and a plain grouping in a third, and only the page knows which.',
      'Use render to become the element that carries the semantics, and give that element an accessible name — usually aria-labelledby pointing at the heading in the header.',
      'A card that is entirely a link should contain one link around its title, not be wrapped in one. Wrapping swallows every control inside it into a single tab stop.',
      'The three regions are optional and carry no semantics of their own. They are spacing, and a card of only a body reads exactly like one with all three.',
    ],
    snippets: [
      defineSnippet({
        id: 'card-react-article',
        language: 'tsx',
        label: 'A card that is an article',
        source:
          '<Card render={(props) => <article {...props} aria-labelledby="invoice-title" />}>\n  <CardHeader>\n    <h3 id="invoice-title">INV-0042</h3>\n  </CardHeader>\n  <CardBody>Due in thirty days.</CardBody>\n</Card>;',
      }),
    ],
  },
  cardHeader: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  cardBody: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
  cardFooter: { api: apiRows(wiringApi), accessibility: [], snippets: [] },
} as const;
