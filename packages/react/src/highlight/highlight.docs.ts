import highlightTokens from '@slotted/styles/highlight/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
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

export const REACT_HIGHLIGHT_TOKENS = highlightTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Highlight decision',
}));

const imports: ReferenceImport = {
  source: "import { Highlight, HighlightDefaultsProvider } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'span',
    required: true,
    purpose:
      'The element that holds the text. Carries data-ui="highlight", data-disabled when the marks step down, and every native attribute the consumer passes. Inside a host it sits inside the host’s label part.',
  },
  {
    part: 'match',
    element: 'mark',
    required: false,
    purpose:
      'One per contiguous span the query found, in the element the HTML Standard defines for the term searched for inside a result. Carries data-current on the match a find bar is standing on. Absent when nothing matched.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One supplier name and the query typed against it, driven by the controls below the canvas. Change the query and watch the marks move without the word moving.',
    snippet: defineSnippet({
      id: 'highlight-react-playground',
      language: 'tsx',
      label: 'One text, one query',
      // language: pt-BR
      source: '<Highlight text="Açaí Valley Ltd." query="aca" />;',
      // language: en-US
    }),
  },
  {
    id: 'query',
    title: 'A query, compared the way the reader’s locale compares',
    // language: pt-BR
    note: 'The comparison is Intl.Collator at base sensitivity: aca finds Açaí, resume finds Résumé and strasse finds Straße. Nothing is a regular expression — C++ and a.b are text.',
    // language: en-US
    snippet: defineSnippet({
      id: 'highlight-react-query',
      language: 'tsx',
      label: 'Diacritics, case and ß are one letter each',
      source:
        // language: pt-BR
        '<Highlight text="Açaí Valley Ltd." query="aca" />;\n<Highlight text="Résumé Services" query="RESUME" />;\n<Highlight text="Straße 12" query="strasse" />;\n<Highlight text="C++ Consulting a.b" query="c++" />;',
      // language: en-US
    }),
  },
  {
    id: 'multiple',
    title: 'Several queries at once',
    note: 'An array marks every query, and two that overlap or touch become one run: an and na over banana is one mark, never a mark inside a mark.',
    snippet: defineSnippet({
      id: 'highlight-react-multiple',
      language: 'tsx',
      label: 'Overlapping queries merge',
      source:
        "<Highlight text=\"Banana Brazil Foods\" query={['an', 'na']} />;\n<Highlight text=\"Sale ticket no 2026-0441\" query={['sale', '0441']} />;",
    }),
  },
  {
    id: 'occurrences',
    title: 'Every occurrence, or the first',
    note: 'all marks every place the query appears, which is the default; first marks one span per query, for a list that reads the mark as “why this row is here”.',
    snippet: defineSnippet({
      id: 'highlight-react-occurrences',
      language: 'tsx',
      label: 'The occurrences axis',
      source:
        '<Highlight text="Ana Banana Santana" query="an" />;\n<Highlight text="Ana Banana Santana" query="an" occurrences="first" />;',
    }),
  },
  {
    id: 'ranges',
    title: 'Spans a server already found',
    note: 'ranges wins over query: the marks are the indexes the search engine returned, in the text’s own code units. A span past the end is clipped, an inverted one is turned round, and one inside an emoji is widened to the whole character.',
    snippet: defineSnippet({
      id: 'highlight-react-ranges',
      language: 'tsx',
      label: 'Explicit ranges, normalized',
      source:
        '<Highlight text="Contractor authorized in 2024" ranges={[[11, 21]]} />;\n<Highlight\n  text="🇧🇷 Brazil Cables"\n  ranges={[\n    [1, 2],\n    [12, 40],\n  ]}\n/>;',
    }),
  },
  {
    id: 'matcher',
    title: 'A matcher of the consumer’s own',
    note: 'matcher replaces the collator scan and receives the queries already trimmed of empties. Here it marks whole words only — the one capability Chakra ships as exactMatch, written in three lines over what the family exports.',
    snippet: defineSnippet({
      id: 'highlight-react-matcher',
      language: 'tsx',
      label: 'Whole words only',
      source:
        'import { matchRanges } from \'@slotted/core/highlight\';\n\nfunction boundary(text: string, at: number) {\n  const around = text.slice(Math.max(0, at - 1), at + 1);\n  return at === 0 || at === text.length || /\\W/.test(around);\n}\nfunction wholeWords(text: string, queries: readonly string[]) {\n  const inside = ([start, end]: readonly [number, number]) =>\n    boundary(text, start) && boundary(text, end);\n  return matchRanges(text, queries).filter(inside);\n}\n\n<Highlight text="Steel cable and network cables" query="cable" matcher={wholeWords} />;',
    }),
  },
  {
    id: 'current',
    title: 'The match a find bar is standing on',
    note: 'current names one match by index, counting matches only, and that mark takes the accent’s solid ground and ink. The family never moves it: the arrows belong to the find bar, and scrolling to it is the consumer’s, through the ref.',
    snippet: defineSnippet({
      id: 'highlight-react-current',
      language: 'tsx',
      label: 'Two of five',
      source:
        'const [current, setCurrent] = useState(1);\n\n<Highlight text={clause} query="supplier" current={current} />;',
    }),
  },
  {
    id: 'states',
    title: 'Disabled, from the root or from the row above it',
    note: 'A disabled mark gives up the tone and keeps the rule, so the reader still sees which span matched on an option they cannot take. The state is read from data-disabled on the root or on any ancestor, so a host’s option says it once.',
    snippet: defineSnippet({
      id: 'highlight-react-states',
      language: 'tsx',
      label: 'Own and inherited',
      source:
        '<Highlight text="Cloudberry Logistics" query="berr" disabled />;\n\n<div data-disabled>\n  <Highlight text="Gooseberry Transport" query="berr" />\n</div>;',
    }),
  },
  {
    id: 'context',
    title: 'Where the family lives',
    note: 'A supplier search: the results list is what combobox, select, multi-select and command-palette render, one root inside each label. The family is content inside a host; the host owns the row, the keyboard and the count.',
    snippet: defineSnippet({
      id: 'highlight-react-context',
      language: 'tsx',
      label: 'Inside a host’s label',
      source:
        // language: pt-BR
        '<Combobox>\n  <ComboboxItem value="acai">Açaí Valley Ltd.</ComboboxItem>\n</Combobox>;\n\n// What the item renders once the reader has typed "aca":\n<span data-part="label">\n  <Highlight text="Açaí Valley Ltd." query="aca" />\n</span>;',
      // language: en-US
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A run that wraps is two boxes and both carry the band; a mark inside Arabic sits where the logical indexes put it in either direction; a query inside a flag or a decomposed accent widens to the whole character; a thousand-character label with a one-letter query answers under a millisecond.',
    snippet: defineSnippet({
      id: 'highlight-react-content',
      language: 'tsx',
      label: 'Wrapping, bidi and graphemes',
      source:
        '<Highlight text="Consolidated annual sales report" query="consolidated annual" />;\n<Highlight text="شركة النور للتجارة" query="النور" />;\n<Highlight text="🇧🇷 Brazil · Crème" query={[\'bra\', \'e\']} />;',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The text is the text: the runs are slices of the string and nothing is hidden. mark is not announced by most screen readers by default, and the family injects no hidden “highlight start” — five matches in an option would be ten announcements.',
    snippet: defineSnippet({
      id: 'highlight-announcement',
      language: 'css',
      label: 'The announcement is the consumer’s to add',
      source:
        "/* In the application's own stylesheet, where the announcement is wanted. */\n[data-ui='highlight'] [data-part='match']::before {\n  content: ' [match] ';\n  clip-path: inset(100%);\n  position: absolute;\n}",
    }),
  },
];

export const REACT_HIGHLIGHT_DOCS = {
  highlight: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'text',
        'string',
        '—',
        'Highlight',
        'The text, whole. The only content the family renders; nothing in it is HTML, and every run is a slice of it',
      ],
      [
        'query',
        'string | readonly string[]',
        '—',
        'Highlight',
        'One query or several. Empty and whitespace-only entries find nothing; overlapping matches merge into one run',
      ],
      [
        'ranges',
        'readonly [number, number][]',
        '—',
        'Highlight',
        'Spans already found, in the text’s own code units. Wins over query and matcher; clipped, ordered, merged and widened to graphemes',
      ],
      [
        'matcher',
        '(text, queries) => ranges',
        '—',
        'Highlight',
        'Replaces the default collator scan. Receives the queries trimmed of empties; loses to ranges',
      ],
      [
        'occurrences',
        "'all' | 'first'",
        'all',
        'Highlight',
        'all marks every place a query appears; first marks one span per query',
      ],
      [
        'sensitivity',
        "'base' | 'accent' | 'case' | 'variant'",
        'base',
        'Highlight',
        // language: pt-BR
        'The collator’s own steps. base treats a, á and A as one letter, which is what typeahead and the filters compare at',
        // language: en-US
      ],
      [
        'locale',
        'string',
        'null',
        'Highlight',
        'BCP 47. Unset asks the runtime; a host passes the locale its filter used. Falls back to the provider',
      ],
      [
        'current',
        'number',
        'null',
        'Highlight',
        'The match a find bar is standing on, counting matches only; that mark carries data-current. Out of range marks nothing',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Highlight',
        'Writes data-disabled on the root: the marks give up the tone and keep the rule. Any ancestor’s data-disabled does the same',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: HighlightRootProps) => ReactNode',
        '—',
        'Highlight',
        'Substitutes the root element and hands it the runs as children with every data attribute. The mark inside is fixed: it is the element that carries the semantics',
      ],
      [
        'ref',
        'Ref<HTMLSpanElement>',
        '—',
        'Highlight',
        'Reaches the root. A find bar scrolls to its current match through it: querySelector("[data-current]").scrollIntoView()',
      ],
      [
        '…native',
        'ComponentPropsWithRef<"span">',
        '—',
        'Highlight',
        'lang, dir, className, aria-* and every other native attribute reach the root',
      ],
      [
        'HighlightDefaultsProvider',
        '{ locale, sensitivity, occurrences }',
        '—',
        'a subtree',
        'Sets all three once for everything below it; an explicit prop on a mark still wins',
      ],
    ]),
    accessibility: [
      'There is no highlight pattern in the WAI-ARIA Authoring Practices, and the HTML Standard defines mark for exactly this — “a run of text marked or highlighted for reference purposes, due to its relevance in another context”, with the term searched for inside a result as its example. The family therefore renders mark and writes no role, no aria-label and no aria-hidden.',
      'The text a reader hears is the text: every run is a slice of the string handed in, nothing is parsed and nothing is hidden. A label holding <b> reads <b>.',
      'Most screen readers do not announce mark by default (MDN, Accessibility). The family injects no hidden “highlight start” before each match: a five-match option would become ten announcements. An application that needs the announcement writes the ::before rule in its own scope, over [data-ui="highlight"] [data-part="match"].',
      'The mark changes no metric of the word — weight, spacing and padding are the label’s own — so a filter that marks a different span on every keystroke never reflows the label under the reader’s eyes.',
      'The current match is not a stronger band: 0.075 is the share the 7:1 promise caps in high-contrast, and doubling it leaves 6.5:1. It takes the accent’s solid ground and the ink the theme pairs with it, and under forced colors the Highlight and HighlightText pair the user agent draws its own find match in.',
      'A disabled row’s mark gives up the tone and keeps the rule, so the reader still sees which span matched on the one option they cannot take, and the loudest color on the surface is not on it.',
    ],
    snippets: [
      defineSnippet({
        id: 'highlight-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source:
          // language: pt-BR
          '<span data-ui="highlight" data-part="root">\n  Açaí Valley <mark data-part="match">Ltd</mark>.\n</span>;\n\n// Inside a host, the root sits inside the label part:\n<span data-part="label">\n  <span data-ui="highlight" data-part="root">\n    Blue<mark data-part="match">berr</mark>y\n  </span>\n</span>;',
        // language: en-US
      }),
      defineSnippet({
        id: 'highlight-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='highlight'] {\n  --slotted-highlight-background: var(--slotted-tone-warning-surface);\n  --slotted-highlight-color: var(--slotted-tone-warning-text);\n  --slotted-highlight-rule-color: var(--slotted-tone-warning-border);\n  --slotted-highlight-current-background: var(--slotted-tone-warning-solid);\n  --slotted-highlight-current-color: var(--slotted-tone-warning-on-solid);\n}",
      }),
    ],
  },
} as const;
