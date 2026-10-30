import statCardTokens from '@slotted/styles/stat-card/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_STAT_CARD_TOKENS = statCardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Stat card decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  StatCard,\n  StatCardHeader,\n  StatCardLabel,\n  StatCardStatus,\n  StatCardAction,\n  StatCardFigure,\n  StatCardValue,\n  StatCardUnit,\n  StatCardDelta,\n  StatCardComparison,\n  StatCardPeriod,\n  StatCardTrend,\n  StatCardMessage,\n  StatCardDefaultsProvider,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'The frame and the query container: role="group" named by the label, carrying size, fill, layout, status, goodWhen, the derived tone, attention and the loading state. Floored at ten rem; under that it overflows its column rather than shrinking.',
  },
  {
    part: 'body',
    element: 'div',
    required: true,
    purpose:
      'The grid, rendered by StatCard one element inside the root: header on top, figure and trend on the row that grows, message at the bottom.',
  },
  {
    part: 'header',
    element: 'div',
    required: false,
    purpose: 'The name, a status beside it and an action at the end, wrapping on the baseline.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose: 'The name of the metric, in the muted step. Carries the id the root is named by.',
  },
  {
    part: 'status',
    element: 'span',
    required: false,
    purpose: 'A slot beside the name for a Badge or a StatusIndicator.',
  },
  {
    part: 'action',
    element: 'span',
    required: false,
    purpose:
      'The end of the header, for your own Link or Button. Stays on the first line when the name wraps, set on the name’s own size and line so the header keeps its height whichever face has loaded.',
  },
  {
    part: 'figure',
    element: 'div',
    required: false,
    purpose:
      'The value line and the comparison under it. The value and the delta share a baseline; a delta with no room drops under the value.',
  },
  {
    part: 'value',
    element: 'span',
    required: false,
    purpose:
      'The number, in the size step’s type, proportional figures, never truncated. A dash while empty or failed; a placeholder while loading.',
  },
  {
    part: 'unit',
    element: 'span',
    required: false,
    purpose:
      'The unit, a step down, wherever you put it inside the value: $ before, % after. The value spaces it from the figure by its own gap on either side.',
  },
  {
    part: 'delta',
    element: 'span',
    required: false,
    purpose:
      'The change: the indicator, the direction a screen reader hears, and the signed number, in the tone derived from goodWhen. Carries data-trend and data-tone.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The mark beside the delta: trending-up, turned over for a fall, minus for no change. Painted from the delta’s ink and kept under forced colours.',
  },
  {
    part: 'comparison',
    element: 'p',
    required: false,
    purpose:
      'The prose under the figure: what the value was. Rendered only while there is a value.',
  },
  {
    part: 'period',
    element: 'span',
    required: false,
    purpose: 'The period the comparison names, inside the comparison.',
  },
  {
    part: 'trend',
    element: 'div',
    required: false,
    purpose:
      'Where a Sparkline goes: beside the figure, or under it when stacked or under 220 pixels. Hands the sparkline the card’s tone, ground and box, and draws a line smoothed and washed unless the application or the sparkline says otherwise; a block placeholder in the same box while loading; hidden under forty pixels.',
  },
  {
    part: 'message',
    element: 'p',
    required: false,
    purpose:
      'What is said in place of a missing or failed value. Rendered only then; in the danger tone on error.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One card, driven by the controls: move delta across nought and switch goodWhen to watch the tone follow the meaning; switch status and loading to see the layout hold.',
    snippet: defineSnippet({
      id: 'stat-card-react-playground',
      language: 'tsx',
      label: 'A metric with its change and its trend',
      source:
        '<StatCard delta={0.124} goodWhen="up">\n  <StatCardHeader>\n    <StatCardLabel>Open orders</StatCardLabel>\n  </StatCardHeader>\n  <StatCardFigure>\n    <StatCardValue value={1510} />\n    <StatCardDelta />\n    <StatCardComparison>\n      from 1,343 <StatCardPeriod>last week</StatCardPeriod>\n    </StatCardComparison>\n  </StatCardFigure>\n  <StatCardTrend>\n    <Sparkline area data={orders} label="Open orders" />\n  </StatCardTrend>\n</StatCard>;',
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part in its place',
    note: 'A label with a live badge and a details link, a value with its unit, a delta, the comparison and its period, and a sparkline in the trend region: the whole family on one card, with the message part waiting for a status that needs it.',
    snippet: defineSnippet({
      id: 'stat-card-react-anatomy-scene',
      language: 'tsx',
      label: 'The full composition',
      source:
        '<StatCard delta={0.032} goodWhen="up">\n  <StatCardHeader>\n    <StatCardLabel>Fill rate</StatCardLabel>\n    <StatCardStatus>\n      <Badge tone="success" variant="soft">\n        Live\n      </Badge>\n    </StatCardStatus>\n    <StatCardAction>\n      <Link href="/reports/fill-rate">Details</Link>\n    </StatCardAction>\n  </StatCardHeader>\n  <StatCardFigure>\n    <StatCardValue>\n      96.1<StatCardUnit>%</StatCardUnit>\n    </StatCardValue>\n    <StatCardDelta />\n    <StatCardComparison>\n      from 92.9% <StatCardPeriod>vs. previous quarter</StatCardPeriod>\n    </StatCardComparison>\n  </StatCardFigure>\n  <StatCardTrend>\n    <Sparkline area data={fillRate} label="Fill rate" />\n  </StatCardTrend>\n  <StatCardMessage>No data for this period yet.</StatCardMessage>\n</StatCard>;',
    }),
  },
  {
    id: 'good-when',
    title: 'The tone comes from the meaning, not the sign',
    note: 'A rise in fill rate and a fall in stockouts are both success; a rise in lead time and a fall in orders are both danger; a flat change and a metric with no valence stay neutral, and the sparkline in the trend follows the delta.',
    snippet: defineSnippet({
      id: 'stat-card-react-good-when',
      language: 'tsx',
      label: 'goodWhen decides the colour',
      source:
        '<StatCard delta={0.18} goodWhen="down">\n  <StatCardHeader>\n    <StatCardLabel>Average lead time</StatCardLabel>\n  </StatCardHeader>\n  <StatCardFigure>\n    <StatCardValue>\n      4.6<StatCardUnit>days</StatCardUnit>\n    </StatCardValue>\n    <StatCardDelta />\n  </StatCardFigure>\n</StatCard>;\n\n// A count nobody wants more or less of.\n<StatCard delta={0.094} goodWhen="none">\n  …\n</StatCard>;',
    }),
  },
  {
    id: 'sizes',
    title: 'Three sizes of figure',
    note: 'sm sets the value at 20 pixels for a row of eight, md at 24 for the four a dashboard opens with, lg at 32 — the step the type scale gained for it — for the one metric a page leads with. The trend column widens with the step.',
    snippet: defineSnippet({
      id: 'stat-card-react-sizes',
      language: 'tsx',
      label: 'By size',
      source:
        '<StatCard size="sm">…</StatCard>;\n<StatCard size="md">…</StatCard>;\n<StatCard size="lg">…</StatCard>;',
    }),
  },
  {
    id: 'fill',
    title: 'Four frames',
    note: 'outline is the hairline card; elevated lifts on a shadow and keeps the hairline for forced colours; subtle recedes onto the sunken surface; plain has no frame and no inset, for a table cell or a row divided by rules where a second edge would be a box in a box.',
    snippet: defineSnippet({
      id: 'stat-card-react-fill',
      language: 'tsx',
      label: 'The frame the page asks for',
      source:
        '<StatCard fill="outline">…</StatCard>;\n<StatCard fill="elevated">…</StatCard>;\n<StatCard fill="subtle">…</StatCard>;\n<StatCard fill="plain">…</StatCard>;',
    }),
  },
  {
    id: 'layout',
    title: 'The trend beside the figure, or under it',
    note: 'inline puts the sparkline in a column beside the value, as tall as the figure; stacked runs it to the card’s edges on the last row, level with the bottom of every card in the row. Under 220 pixels a card stacks on its own and drops the value one step.',
    snippet: defineSnippet({
      id: 'stat-card-react-layout',
      language: 'tsx',
      label: 'The two layouts',
      source: '<StatCard layout="inline">…</StatCard>;\n<StatCard layout="stacked">…</StatCard>;',
    }),
  },
  {
    id: 'loading',
    title: 'The layout is kept while the value is on its way',
    note: 'Every text part stands in with a placeholder of its own line height and the trend with a block in the trend’s own box, so nothing moves when the numbers arrive; the previous value is not shown as if it were current.',
    snippet: defineSnippet({
      id: 'stat-card-react-loading',
      language: 'tsx',
      label: 'One prop, every part answers',
      source:
        '<StatCard loading={pending}>\n  <StatCardHeader>\n    <StatCardLabel>Open orders</StatCardLabel>\n  </StatCardHeader>\n  <StatCardFigure>\n    <StatCardValue value={orders.total} />\n    <StatCardDelta value={orders.delta} />\n  </StatCardFigure>\n  <StatCardTrend>\n    <Sparkline data={orders.series} />\n  </StatCardTrend>\n</StatCard>;',
    }),
  },
  {
    id: 'status',
    title: 'A value that is missing, and one that failed',
    note: 'empty and error keep the card’s frame and height, put a dash where the value was, drop the delta, the comparison and the trend, and show the message — in the danger tone when the metrics service did not answer.',
    snippet: defineSnippet({
      id: 'stat-card-react-status',
      language: 'tsx',
      label: 'The two statuses and their message',
      source:
        "<StatCard status={error ? 'error' : 'empty'}>\n  <StatCardHeader>\n    <StatCardLabel>Churn</StatCardLabel>\n  </StatCardHeader>\n  <StatCardFigure>\n    <StatCardValue />\n  </StatCardFigure>\n  <StatCardMessage>\n    {error ? 'The metrics service did not answer.' : 'No data for this period yet.'}\n  </StatCardMessage>\n</StatCard>;",
    }),
  },
  {
    id: 'row',
    title: 'A row of metrics, as a dashboard opens',
    note: 'Four cards in a grid with different content — a wrapped delta, no delta, bars instead of a line — keep their labels level at the top and their trends level at the bottom; below, three plain cards in one framed row separated by rules.',
    snippet: defineSnippet({
      id: 'stat-card-react-row',
      language: 'tsx',
      label: 'Cards in a grid, and plain cards in a rail',
      source:
        '<Grid columns={4} gap={4}>\n  <StatCard delta={0.124}>…</StatCard>\n  <StatCard delta={0.032}>…</StatCard>\n  <StatCard delta={0.003} goodWhen="down">\n    …\n  </StatCard>\n  <StatCard delta={-0.012}>…</StatCard>\n</Grid>;\n\n<StatCardDefaultsProvider fill="plain" size="sm">\n  <StatCard delta={0.081}>…</StatCard>\n  <StatCard delta={-0.0004} goodWhen="down">\n    …\n  </StatCard>\n</StatCardDefaultsProvider>;',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German label that wraps to three lines and keeps its badge on the first; a currency value too wide for the trend, which gives way instead of the number breaking; a card at 200 pixels that stacks; a right-to-left document where the sign stays in front and the marks turn.',
    snippet: defineSnippet({
      id: 'stat-card-react-content',
      language: 'tsx',
      label: 'A long value formatted compact instead',
      source:
        "<StatCardValue\n  formatOptions={{ style: 'currency', currency: 'BRL', notation: 'compact' }}\n  value={1234567890}\n/>;",
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The card is a group named by its label, so the details link inside it is “Details, Fill rate”; the delta reads “up +3.2%” with the direction said before the sign; the sparkline is an image described in the same numbers; the words are those of the language in force.',
    snippet: defineSnippet({
      id: 'stat-card-react-accessibility',
      language: 'tsx',
      label: 'Translated once',
      source:
        '<SlottedProvider locale="pt-BR" catalogs={{ \'pt-BR\': PT_BR }}>\n  <Dashboard />\n</SlottedProvider>;',
    }),
  },
];

export const REACT_STAT_CARD_DOCS = {
  'stat-card': {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      ['size', "'sm' | 'md' | 'lg'", 'md', 'StatCard', 'The figure’s type and the card’s inset'],
      [
        'fill',
        "'outline' | 'elevated' | 'subtle' | 'plain'",
        'outline',
        'StatCard',
        'The frame: a hairline, a shadow, a sunken fill, or none at all',
      ],
      [
        'layout',
        "'inline' | 'stacked'",
        'inline',
        'StatCard',
        'The trend beside the figure, or on its own row under it',
      ],
      [
        'status',
        "'ready' | 'empty' | 'error'",
        'ready',
        'StatCard',
        'Whether there is a value to show, and if not, why. The layout is kept either way',
      ],
      [
        'loading',
        'boolean',
        'false',
        'StatCard',
        'The value is on its way: every part stands in with a placeholder and the root is aria-busy',
      ],
      [
        'goodWhen',
        "'up' | 'down' | 'none'",
        'up',
        'StatCard, StatCardDelta',
        'Which way is good for this metric. The tone of a change is derived from it, never from the sign',
      ],
      [
        'delta',
        'number',
        '—',
        'StatCard',
        'The change, as the first delta reads it: a fraction for a percentage. Stated on the root so the card knows its tone before its delta renders',
      ],
      [
        'tone',
        "'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        '—',
        'StatCard, StatCardDelta',
        'An explicit tone, which wins over the derived one. On the root it is what the trend hands its sparkline',
      ],
      [
        'attention',
        "'warning' | 'danger'",
        '—',
        'StatCard',
        'The figure is past a threshold the product states: the value and the edge take the tone, the delta keeps its own. Ready values only; the comparison line names the threshold',
      ],
      [
        'locale',
        'string',
        '—',
        'StatCard',
        'BCP 47, for every number the card formats; the language in force when absent',
      ],
      [
        'formatOptions',
        'Intl.NumberFormatOptions',
        '—',
        'StatCard, StatCardValue, StatCardDelta',
        'How a number is written. On the root, the default for the value and the delta',
      ],
      [
        'emphasis',
        "'none' | 'whole'",
        "'none'",
        'StatCardValue',
        'whole draws the symbol, the decimals and the suffix of a numeric value in the unit part, so the whole units carry the figure; the text is the formatter’s either way',
      ],
      [
        'messages',
        'Partial<StatCardMessages>',
        '—',
        'StatCard',
        'Words laid over the language in force, key by key: up, down and flat, heard before the delta; empty, shown in place of a missing value',
      ],
      [
        'value',
        'number | string',
        '—',
        'StatCardValue, StatCardDelta',
        'A number the card formats, or text as written. On a delta, unset means the root’s delta',
      ],
      [
        'format',
        "'percent' | 'decimal'",
        'percent',
        'StatCardDelta',
        'percent reads the value as a fraction; decimal reads it as it is. The sign is shown except on nought',
      ],
    ]),
    events: [] satisfies EventRow[],
    composition: apiRows([
      [
        'children',
        'ReactNode',
        '—',
        'StatCardValue, StatCardDelta',
        'Your own rendering of the number, unit and all; wins over value',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'every part',
        'Substitutes the rendered element: a heading for the label, a link for the action, a figure for the root',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the native element; each part’s props are that element’s, extended',
      ],
      [
        'StatCardTrend',
        'children',
        '—',
        'StatCard',
        'Takes a Sparkline and hands it the card’s tone through --slotted-sparkline-color, its ground for the marker’s ring, and curve="monotone" with area unless sparkline defaults or the sparkline state otherwise; a tone or series on the sparkline still wins',
      ],
      [
        'StatCardStatus, StatCardAction',
        'children',
        '—',
        'StatCardHeader',
        'Slots for a Badge or StatusIndicator, and for a Link or Button, kept as you wrote them',
      ],
      [
        'trendOf, toneOf',
        'function',
        '—',
        'Application',
        'The two derivations, exported for a delta you format yourself',
      ],
      [
        'StatCardDefaultsProvider',
        'StatCardDefaults',
        '—',
        'Application',
        'Sets goodWhen, size, fill, layout and formatOptions once for everything below it; a prop still wins',
      ],
    ]),
    accessibility: [
      'The root is a group named by its label through aria-labelledby, so a reader who lands on the action inside it hears which metric it belongs to. There is no APG pattern for a statistic; a group with a name is what the platform offers a labelled region that is not a landmark.',
      'The delta reads its direction before its number — “up +12.4%” — from a visually hidden word, because a sign is a glyph some readers skip and “12.4%” alone does not say which way. The indicator is aria-hidden; it repeats what the word says.',
      'The tone is never the only channel: the indicator turns, the word is read, the sign is written. A rise that is bad and a rise that is good differ in colour and in nothing a reader without colour loses.',
      'While loading the root carries aria-busy="true" and every placeholder is a skeleton, hidden and inert. One announcement for a whole dashboard is a SkeletonRegion around it, which is the platform’s own answer rather than one per card.',
      'A missing or failed value is a dash and a message, in the DOM and in the tree; a card never announces a stale number as current.',
      'The value is never truncated. A number wider than the trend’s room takes the room; a number wider than the card breaks; nothing is clipped or hidden behind an ellipsis.',
    ],
    snippets: [
      defineSnippet({
        id: 'stat-card-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  aria-labelledby=":r1:"\n  data-ui="stat-card"\n  data-part="root"\n  data-size="md"\n  data-fill="outline"\n  data-layout="inline"\n  data-status="ready"\n  data-good-when="up"\n  data-tone="success"\n  role="group"\n>\n  <div data-part="body">\n    <div data-part="header">\n      <span data-part="label" id=":r1:">\n        Fill rate\n      </span>\n      <span data-part="status">…</span>\n      <span data-part="action">…</span>\n    </div>\n    <div data-part="figure">\n      <span data-part="value">\n        96.1<span data-part="unit">%</span>\n      </span>\n      <span data-part="delta" data-trend="up" data-tone="success">\n        <span aria-hidden="true" data-part="indicator" />\n        <span data-ui="visually-hidden">up </span>+3.2%\n      </span>\n      <p data-part="comparison">\n        from 92.9% <span data-part="period">vs. previous quarter</span>\n      </p>\n    </div>\n    <div data-part="trend">\n      <span data-ui="sparkline" role="img" aria-label="…">\n        …\n      </span>\n    </div>\n  </div>\n</div>;',
      }),
      defineSnippet({
        id: 'stat-card-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='stat-card'] {\n  --slotted-stat-card-radius: var(--slotted-radius-md);\n  --slotted-stat-card-trend-inline-size: 8rem;\n  --slotted-stat-card-min-inline-size: 12rem;\n}\n\n/* A dashboard whose values are all money keeps them tabular. */\n[data-ui='stat-card'] [data-part='value'] {\n  font-variant-numeric: tabular-nums;\n}",
      }),
    ],
  },
} as const;
