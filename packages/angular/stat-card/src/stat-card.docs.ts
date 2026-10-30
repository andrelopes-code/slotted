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

export const ANGULAR_STAT_CARD_TOKENS = statCardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Stat card decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlStatCard,\n  SlStatCardHeader,\n  SlStatCardLabel,\n  SlStatCardStatus,\n  SlStatCardAction,\n  SlStatCardFigure,\n  SlStatCardValue,\n  SlStatCardUnit,\n  SlStatCardDelta,\n  SlStatCardComparison,\n  SlStatCardPeriod,\n  SlStatCardTrend,\n  SlStatCardMessage,\n  provideStatCardDefaults,\n} from '@slotted/angular/stat-card';",
  selector:
    '[slStatCard] · [slStatCardLabel] · [slStatCardValue] · [slStatCardDelta] · [slStatCardTrend] · …',
  exportAs: 'slStatCard · slStatCardValue · slStatCardDelta · slStatCardTrend · …',
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
      'The grid, rendered by slStatCard one element inside the host: header on top, figure and trend on the row that grows, message at the bottom.',
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
    purpose: 'A slot beside the name for a badge or a status indicator.',
  },
  {
    part: 'action',
    element: 'span',
    required: false,
    purpose:
      'The end of the header, for your own link or button. Stays on the first line when the name wraps, set on the name’s own size and line so the header keeps its height whichever face has loaded.',
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
    purpose: 'The prose under the figure: what the value was. Hidden while there is no value.',
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
      'Where a sparkline goes: beside the figure, or under it when stacked or under 220 pixels. Hands the sparkline the card’s tone, ground and box, and draws a line smoothed and washed unless the application or the sparkline says otherwise; a block placeholder in the same box while loading; hidden under forty pixels.',
  },
  {
    part: 'message',
    element: 'p',
    required: false,
    purpose:
      'What is said in place of a missing or failed value. Hidden otherwise; in the danger tone on error.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One card, driven by the controls: move delta across nought and switch goodWhen to watch the tone follow the meaning; switch status and loading to see the layout hold.',
    snippet: defineSnippet({
      id: 'stat-card-angular-playground',
      language: 'angular',
      label: 'A metric with its change and its trend',
      source:
        '<div slStatCard [delta]="0.124" goodWhen="up">\n  <div slStatCardHeader><span slStatCardLabel>Open orders</span></div>\n  <div slStatCardFigure>\n    <span slStatCardValue [value]="1510"></span>\n    <span slStatCardDelta></span>\n    <p slStatCardComparison>from 1,343 <span slStatCardPeriod>last week</span></p>\n  </div>\n  <div slStatCardTrend><span slSparkline [data]="orders" label="Open orders" area></span></div>\n</div>',
    }),
  },
  {
    id: 'anatomy',
    title: 'Every part in its place',
    note: 'A label with a live badge and a details link, a value with its unit, a delta, the comparison and its period, and a sparkline in the trend region: the whole family on one card, with the message part waiting for a status that needs it.',
    snippet: defineSnippet({
      id: 'stat-card-angular-anatomy-scene',
      language: 'angular',
      label: 'The full composition',
      source:
        '<div slStatCard [delta]="0.032" goodWhen="up">\n  <div slStatCardHeader>\n    <span slStatCardLabel>Fill rate</span>\n    <span slStatCardStatus><span slBadge tone="success" variant="soft">Live</span></span>\n    <span slStatCardAction><a slLink href="/reports/fill-rate">Details</a></span>\n  </div>\n  <div slStatCardFigure>\n    <span slStatCardValue>96.1<span slStatCardUnit>%</span></span>\n    <span slStatCardDelta></span>\n    <p slStatCardComparison>from 92.9% <span slStatCardPeriod>vs. previous quarter</span></p>\n  </div>\n  <div slStatCardTrend><span slSparkline [data]="fillRate" label="Fill rate" area></span></div>\n  <p slStatCardMessage>No data for this period yet.</p>\n</div>',
    }),
  },
  {
    id: 'good-when',
    title: 'The tone comes from the meaning, not the sign',
    note: 'A rise in fill rate and a fall in stockouts are both success; a rise in lead time and a fall in orders are both danger; a flat change and a metric with no valence stay neutral, and the sparkline in the trend follows the delta.',
    snippet: defineSnippet({
      id: 'stat-card-angular-good-when',
      language: 'angular',
      label: 'goodWhen decides the colour',
      source:
        '<div slStatCard [delta]="0.18" goodWhen="down">\n  <div slStatCardHeader><span slStatCardLabel>Average lead time</span></div>\n  <div slStatCardFigure>\n    <span slStatCardValue>4.6<span slStatCardUnit>days</span></span>\n    <span slStatCardDelta></span>\n  </div>\n</div>\n\n<!-- A count nobody wants more or less of. -->\n<div slStatCard [delta]="0.094" goodWhen="none">…</div>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three sizes of figure',
    note: 'sm sets the value at 20 pixels for a row of eight, md at 24 for the four a dashboard opens with, lg at 32 — the step the type scale gained for it — for the one metric a page leads with. The trend column widens with the step.',
    snippet: defineSnippet({
      id: 'stat-card-angular-sizes',
      language: 'angular',
      label: 'By size',
      source:
        '<div slStatCard size="sm">…</div>\n<div slStatCard size="md">…</div>\n<div slStatCard size="lg">…</div>',
    }),
  },
  {
    id: 'fill',
    title: 'Four frames',
    note: 'outline is the hairline card; elevated lifts on a shadow and keeps the hairline for forced colours; subtle recedes onto the sunken surface; plain has no frame and no inset, for a table cell or a row divided by rules where a second edge would be a box in a box.',
    snippet: defineSnippet({
      id: 'stat-card-angular-fill',
      language: 'angular',
      label: 'The frame the page asks for',
      source:
        '<div slStatCard fill="outline">…</div>\n<div slStatCard fill="elevated">…</div>\n<div slStatCard fill="subtle">…</div>\n<div slStatCard fill="plain">…</div>',
    }),
  },
  {
    id: 'layout',
    title: 'The trend beside the figure, or under it',
    note: 'inline puts the sparkline in a column beside the value, as tall as the figure; stacked runs it to the card’s edges on the last row, level with the bottom of every card in the row. Under 220 pixels a card stacks on its own and drops the value one step.',
    snippet: defineSnippet({
      id: 'stat-card-angular-layout',
      language: 'angular',
      label: 'The two layouts',
      source: '<div slStatCard layout="inline">…</div>\n<div slStatCard layout="stacked">…</div>',
    }),
  },
  {
    id: 'loading',
    title: 'The layout is kept while the value is on its way',
    note: 'Every text part stands in with a placeholder of its own line height and the trend with a block in the trend’s own box, so nothing moves when the numbers arrive; the previous value is not shown as if it were current.',
    snippet: defineSnippet({
      id: 'stat-card-angular-loading',
      language: 'angular',
      label: 'One prop, every part answers',
      source:
        '<div slStatCard [loading]="pending()">\n  <div slStatCardHeader><span slStatCardLabel>Open orders</span></div>\n  <div slStatCardFigure>\n    <span slStatCardValue [value]="orders().total"></span>\n    <span slStatCardDelta [value]="orders().delta"></span>\n  </div>\n  <div slStatCardTrend><span slSparkline [data]="orders().series"></span></div>\n</div>',
    }),
  },
  {
    id: 'status',
    title: 'A value that is missing, and one that failed',
    note: 'empty and error keep the card’s frame and height, put a dash where the value was, drop the delta, the comparison and the trend, and show the message — in the danger tone when the metrics service did not answer.',
    snippet: defineSnippet({
      id: 'stat-card-angular-status',
      language: 'angular',
      label: 'The two statuses and their message',
      source:
        "<div slStatCard [status]=\"error() ? 'error' : 'empty'\">\n  <div slStatCardHeader><span slStatCardLabel>Churn</span></div>\n  <div slStatCardFigure><span slStatCardValue></span></div>\n  <p slStatCardMessage>\n    {{ error() ? 'The metrics service did not answer.' : 'No data for this period yet.' }}\n  </p>\n</div>",
    }),
  },
  {
    id: 'row',
    title: 'A row of metrics, as a dashboard opens',
    note: 'Four cards in a grid with different content — a wrapped delta, no delta, bars instead of a line — keep their labels level at the top and their trends level at the bottom; below, three plain cards in one framed row separated by rules.',
    snippet: defineSnippet({
      id: 'stat-card-angular-row',
      language: 'angular',
      label: 'Cards in a grid, and plain cards in a rail',
      source:
        '<div slGrid [columns]="4" [gap]="4">\n  <div slStatCard [delta]="0.124">…</div>\n  <div slStatCard [delta]="0.032">…</div>\n  <div slStatCard [delta]="0.003" goodWhen="down">…</div>\n  <div slStatCard>…</div>\n</div>\n\n<!-- Plain and small, in a framed rail; set once with provideStatCardDefaults. -->\n<div slStatCard fill="plain" size="sm" [delta]="0.081">…</div>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A German label that wraps to three lines and keeps its badge on the first; a currency value too wide for the trend, which gives way instead of the number breaking; a card at 200 pixels that stacks; a right-to-left document where the sign stays in front and the marks turn.',
    snippet: defineSnippet({
      id: 'stat-card-angular-content',
      language: 'angular',
      label: 'A long value formatted compact instead',
      source:
        "<span\n  slStatCardValue\n  [value]=\"1234567890\"\n  [formatOptions]=\"{ style: 'currency', currency: 'BRL', notation: 'compact' }\"\n></span>",
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The card is a group named by its label, so the details link inside it is “Details, Fill rate”; the delta reads “up +3.2%” with the direction said before the sign; the sparkline is an image described in the same numbers; the words are those of the language in force.',
    snippet: defineSnippet({
      id: 'stat-card-angular-accessibility',
      language: 'ts',
      label: 'Translated once',
      source:
        "bootstrapApplication(App, {\n  providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })],\n});",
    }),
  },
];

export const ANGULAR_STAT_CARD_DOCS = {
  'stat-card': {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      ['size', "'sm' | 'md' | 'lg'", 'md', 'slStatCard', 'The figure’s type and the card’s inset'],
      [
        'fill',
        "'outline' | 'elevated' | 'subtle' | 'plain'",
        'outline',
        'slStatCard',
        'The frame: a hairline, a shadow, a sunken fill, or none at all',
      ],
      [
        'layout',
        "'inline' | 'stacked'",
        'inline',
        'slStatCard',
        'The trend beside the figure, or on its own row under it',
      ],
      [
        'status',
        "'ready' | 'empty' | 'error'",
        'ready',
        'slStatCard',
        'Whether there is a value to show, and if not, why. The layout is kept either way',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slStatCard',
        'The value is on its way: every part stands in with a placeholder and the root is aria-busy',
      ],
      [
        'goodWhen',
        "'up' | 'down' | 'none'",
        'up',
        'slStatCard, slStatCardDelta',
        'Which way is good for this metric. The tone of a change is derived from it, never from the sign',
      ],
      [
        'delta',
        'number',
        '—',
        'slStatCard',
        'The change, as the first delta reads it: a fraction for a percentage. Stated on the root so the card knows its tone before its delta renders',
      ],
      [
        'tone',
        "'neutral' | 'accent' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'",
        '—',
        'slStatCard, slStatCardDelta',
        'An explicit tone, which wins over the derived one. On the root it is what the trend hands its sparkline',
      ],
      [
        'attention',
        "'warning' | 'danger'",
        '—',
        'slStatCard',
        'The figure is past a threshold the product states: the value and the edge take the tone, the delta keeps its own. Ready values only; the comparison line names the threshold',
      ],
      [
        'locale',
        'string',
        '—',
        'slStatCard',
        'BCP 47, for every number the card formats; the language in force when absent',
      ],
      [
        'formatOptions',
        'Intl.NumberFormatOptions',
        '—',
        'slStatCard, slStatCardValue, slStatCardDelta',
        'How a number is written. On the root, the default for the value and the delta',
      ],
      [
        'emphasis',
        "'none' | 'whole'",
        "'none'",
        'slStatCardValue',
        'whole draws the symbol, the decimals and the suffix of a numeric value in the unit part, so the whole units carry the figure; the text is the formatter’s either way',
      ],
      [
        'messages',
        'Partial<StatCardMessages>',
        '—',
        'slStatCard',
        'Words laid over the language in force, key by key: up, down and flat, heard before the delta; empty, shown in place of a missing value',
      ],
      [
        'value',
        'number | string',
        '—',
        'slStatCardValue, slStatCardDelta',
        'A number the card formats, or text as written. On a delta, unset means the root’s delta',
      ],
      [
        'format',
        "'percent' | 'decimal'",
        'percent',
        'slStatCardDelta',
        'percent reads the value as a fraction; decimal reads it as it is. The sign is shown except on nought',
      ],
    ]),
    events: [] satisfies EventRow[],
    composition: apiRows([
      [
        'projected content',
        'ng-content',
        '—',
        'slStatCardValue, slStatCardDelta',
        'Your own rendering after the formatted number: a unit, or the whole text when value is unset',
      ],
      [
        '[slStatCard…]',
        'attribute selectors',
        '—',
        'your elements',
        'Every part is a directive on the element you wrote: a heading for the label, an anchor for the action, a p for the comparison',
      ],
      [
        'exportAs',
        'template reference',
        '—',
        'slStatCard, slStatCardValue, slStatCardDelta, slStatCardTrend, …',
        'Reaches the instance: the derived tone, the trend, the formatted text',
      ],
      [
        'slStatCardTrend',
        'projected content',
        '—',
        'slStatCard',
        'Takes an slSparkline and hands it the card’s tone through --slotted-sparkline-color, its ground for the marker’s ring, and curve="monotone" with area unless the sparkline defaults or the sparkline state otherwise; a tone or series on the sparkline still wins',
      ],
      [
        'aria-label, aria-labelledby, id',
        'attributes',
        '—',
        'your elements',
        'A name or an id you wrote on the host or on the label wins over the generated one',
      ],
      [
        'trendOf, toneOf',
        'function',
        '—',
        'Application',
        'The two derivations, exported for a delta you format yourself',
      ],
      [
        'provideStatCardDefaults',
        'StatCardDefaults',
        '—',
        'Application',
        'Sets goodWhen, size, fill, layout and formatOptions once, in a route or the application config; an input still wins',
      ],
    ]),
    accessibility: [
      'The root is a group named by its label through aria-labelledby, so a reader who lands on the action inside it hears which metric it belongs to. There is no APG pattern for a statistic; a group with a name is what the platform offers a labelled region that is not a landmark.',
      'The delta reads its direction before its number — “up +12.4%” — from a visually hidden word, because a sign is a glyph some readers skip and “12.4%” alone does not say which way. The indicator is aria-hidden; it repeats what the word says.',
      'The tone is never the only channel: the indicator turns, the word is read, the sign is written. A rise that is bad and a rise that is good differ in colour and in nothing a reader without colour loses.',
      'While loading the root carries aria-busy="true" and every placeholder is a skeleton, hidden and inert. One announcement for a whole dashboard is an slSkeletonRegion around it, which is the platform’s own answer rather than one per card.',
      'A missing or failed value is a dash and a message, in the DOM and in the tree; a card never announces a stale number as current.',
      'The value is never truncated. A number wider than the trend’s room takes the room; a number wider than the card breaks; nothing is clipped or hidden behind an ellipsis.',
    ],
    snippets: [
      defineSnippet({
        id: 'stat-card-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  aria-labelledby="slotted-stat-card-label-0"\n  data-ui="stat-card"\n  data-part="root"\n  data-size="md"\n  data-fill="outline"\n  data-layout="inline"\n  data-status="ready"\n  data-good-when="up"\n  data-tone="success"\n  role="group"\n>\n  <div data-part="body">\n    <div data-part="header">\n      <span data-part="label" id="slotted-stat-card-label-0"> Fill rate </span>\n      <span data-part="status">…</span>\n      <span data-part="action">…</span>\n    </div>\n    <div data-part="figure">\n      <span data-part="value"> 96.1<span data-part="unit">%</span> </span>\n      <span data-part="delta" data-trend="up" data-tone="success">\n        <span aria-hidden="true" data-part="indicator" />\n        <span data-ui="visually-hidden">up </span>+3.2%\n      </span>\n      <p data-part="comparison">from 92.9% <span data-part="period">vs. previous quarter</span></p>\n    </div>\n    <div data-part="trend">\n      <span data-ui="sparkline" role="img" aria-label="…"> … </span>\n    </div>\n  </div>\n</div>',
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
