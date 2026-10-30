import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import ratingTokens from '@slotted/styles/rating/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_RATING_TOKENS = ratingTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Rating decision',
}));

const imports: ReferenceImport = {
  source: "import { Rating, RatingDisplay, RatingProvider, RatingSummary } from '@slotted/react';",
};

/**
 * One demonstration. The snippet is written out at the call with a literal id,
 * language and source, because `scripts/verify-docs-snippets.test.mjs` reads
 * every `defineSnippet` statically and a snippet built from variables is one it
 * cannot check.
 */
const scene = (
  id: string,
  title: string,
  note: string,
  snippet: ReferenceSceneMeta['snippet'],
): ReferenceSceneMeta => ({ id, title, note, snippet });

const symbolRows: AnatomyRow[] = [
  {
    part: 'symbols',
    element: 'div',
    required: true,
    purpose:
      'The row of symbols. It never wraps: ten symbols at 240 pixels stay one row and each item shrinks to a square, because the star inside reads the item’s width. On the input member it is the surface a finger scrubs along, with touch-action: pan-y so the page still scrolls vertically.',
  },
  {
    part: 'item',
    element: 'span',
    required: true,
    purpose:
      'One symbol’s square. On the display it carries --slotted-rating-fill, the lit share from nought to one; on the input member it carries data-checked when it holds the checked radio.',
  },
  {
    part: 'symbol',
    element: 'span',
    required: true,
    purpose:
      'The unlit shape: the star glyph, or what renderSymbol returns, filled with the secondary surface so an unlit star reads as a shape rather than as an outline.',
  },
  {
    part: 'fill',
    element: 'span',
    required: true,
    purpose:
      'The same shape again, painted in the tone’s solid step and clipped to the lit share. Half a star is this layer clipped at the middle; the transition of the clip follows the direction of the change.',
  },
];

const ratingAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The radio group. Carries data-ui="rating", data-size, data-tone, data-max, data-step at half steps, data-disabled, data-readonly, data-invalid and data-dragging while a finger scrubs, and the keydown that answers the arrows, Home, End, Backspace and Delete.',
  },
  ...symbolRows.slice(0, 2),
  {
    part: 'input',
    element: 'input type="radio"',
    required: true,
    purpose:
      'One value. Every radio shares the generated or written name, so Tab, Space and submission are the platform’s. At half steps each item holds two: the half radio first, with data-half, stacked above the whole one so the inline-start half of the symbol asks for the half value.',
  },
  ...symbolRows.slice(2),
  {
    part: 'value',
    element: 'span aria-hidden="true"',
    required: false,
    purpose:
      'The caption: a word for the value, or for the value under the pointer when caption is a function. It is hidden from assistive technology, because each radio’s own name already says the number.',
  },
];

const displayAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div role="img", or the element render returns',
    required: true,
    purpose:
      'One image with one name. aria-label says the value, the scale and the count once, from displayLabel or displayLabelWithCount; data-variant is written for compact and histogram.',
  },
  ...symbolRows,
  {
    part: 'value',
    element: 'span aria-hidden="true"',
    required: false,
    purpose:
      'The number, always to one place in the locale’s digits — 4,6 in pt-BR — and in tabular figures, so a column of displays lines up. showValue={false} removes it.',
  },
  {
    part: 'histogram',
    element: 'span aria-hidden="true"',
    required: false,
    purpose:
      'The histogram variant’s bars, one per level, lowest first. Present only when distribution is.',
  },
  {
    part: 'bar',
    element: 'span',
    required: false,
    purpose:
      'One level of the histogram, its height --slotted-rating-share: the level’s count divided by the largest count, so the tallest bar is always full.',
  },
  {
    part: 'count',
    element: 'span aria-hidden="true"',
    required: false,
    purpose:
      'How many ratings the value is made of, in the locale’s grouping — (1.284) beside five stars, 1.284 in a histogram row. Present only when count is.',
  },
];

const summaryAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'section, or the element render returns',
    required: true,
    purpose:
      'A region named by its aria-label. data-variant is summary for bars and spectrum for the spectrum, which also writes --slotted-rating-mean, --slotted-rating-low and --slotted-rating-high from summarizeRatings.',
  },
  {
    part: 'aggregate',
    element: 'div',
    required: true,
    purpose:
      'The figure a page leads with: the mean, its scale, the stars (bars) or the conclusion (spectrum), and the count. With nothing rated it writes no figure and no scale.',
  },
  {
    part: 'value',
    element: 'span',
    required: false,
    purpose: 'The mean to one place, at the key-figure step. Absent while nothing is rated.',
  },
  {
    part: 'scale',
    element: 'span',
    required: false,
    purpose: 'The scale beside the figure, from the scale message: de 5.',
  },
  {
    part: 'insight',
    element: 'span',
    required: false,
    purpose:
      'The spectrum’s one conclusion as a pill in its tone: divided (warning), few (secondary), consensus (success) or mixed (secondary). Removed by showInsight={false} and while nothing is rated.',
  },
  {
    part: 'count',
    element: 'span',
    required: true,
    purpose:
      'How many ratings, and in the spectrum the margin of the mean — or the interval, in words, when the margin reaches half a star.',
  },
  {
    part: 'distribution',
    element: 'ul',
    required: false,
    purpose: 'The bars variant’s levels, highest first, named by distributionLabel.',
  },
  {
    part: 'level',
    element: 'button aria-pressed with filterable, div role="group" otherwise',
    required: false,
    purpose:
      'One level, named by levelLabel with its count and share. Filtering, it is a toggle, disabled when nobody gave that rating, with data-pressed while pressed.',
  },
  {
    part: 'level-label',
    element: 'span',
    required: false,
    purpose: 'The level’s number and a star.',
  },
  {
    part: 'track',
    element: 'span aria-hidden="true"',
    required: false,
    purpose: 'The bar’s full length.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose: 'The level’s share of the total, as --slotted-rating-share.',
  },
  {
    part: 'level-count',
    element: 'span',
    required: false,
    purpose: 'The level’s count in the locale’s grouping.',
  },
  {
    part: 'plot',
    element: 'div',
    required: false,
    purpose: 'The spectrum’s drawing: the field above the axis.',
  },
  {
    part: 'field',
    element: 'div',
    required: false,
    purpose: 'The area the columns, the interval and the mean share, on the axis of the scale.',
  },
  {
    part: 'columns',
    element: 'div',
    required: false,
    purpose: 'The columns, lowest level first, as the axis reads.',
  },
  {
    part: 'column',
    element: 'button aria-pressed with filterable, div role="group" otherwise',
    required: false,
    purpose:
      'One level of the spectrum, its height --slotted-rating-share against the largest level, named and pressed as a level is.',
  },
  {
    part: 'bar',
    element: 'span',
    required: false,
    purpose: 'The painted column inside the target, which keeps its full height.',
  },
  {
    part: 'interval',
    element: 'span aria-hidden="true"',
    required: false,
    purpose:
      'The 95% interval of the mean, from --slotted-rating-low to --slotted-rating-high, clamped to the scale.',
  },
  {
    part: 'mean',
    element: 'span aria-hidden="true"',
    required: false,
    purpose: 'The mean’s mark on the axis, at --slotted-rating-mean.',
  },
  {
    part: 'mean-label',
    element: 'span',
    required: false,
    purpose: 'The mean to one place, above its mark.',
  },
  {
    part: 'axis',
    element: 'div aria-hidden="true"',
    required: false,
    purpose: 'The scale under the columns: one tick per level.',
  },
  {
    part: 'tick',
    element: 'span',
    required: false,
    purpose: 'One level on the axis.',
  },
  {
    part: 'tick-label',
    element: 'span',
    required: false,
    purpose: 'The level’s number and a star.',
  },
  {
    part: 'tick-share',
    element: 'span',
    required: false,
    purpose: 'The level’s share of the total, as a whole percent.',
  },
  {
    part: 'sentiment',
    element: 'p',
    required: false,
    purpose:
      'The three buckets in one line: the upper two levels positive, the middle neutral, the lower two negative.',
  },
  {
    part: 'bucket',
    element: 'span',
    required: false,
    purpose: 'One bucket, its share in strong, with data-tone success, secondary or danger.',
  },
  {
    part: 'swatch',
    element: 'span aria-hidden="true"',
    required: false,
    purpose: 'The bucket’s color key.',
  },
];

const ratingScenes: ReferenceSceneMeta[] = [
  scene(
    'playground',
    'Playground',
    'One rating with every prop on the controls below the canvas. Hover previews the value and the caption follows it; press the lit star again and the value empties.',
    defineSnippet({
      id: 'rating-react-playground',
      language: 'tsx',
      label: 'A rating a reader gives',
      source: `<Rating aria-label="Your rating" defaultValue={4} />;`,
    }),
  ),
  scene(
    'half',
    'Half steps',
    'step={0.5} puts two radios in each star: the half radio sits above the whole one, so the inline-start half of a star asks for the half value. Ten arrow stops for five stars is the cost.',
    defineSnippet({
      id: 'rating-react-half',
      language: 'tsx',
      label: 'A rating by halves',
      source: `<Rating aria-label="Rating in half points" defaultValue={3.5} step={0.5} />;`,
    }),
  ),
  scene(
    'states',
    'Read-only, disabled and invalid',
    'Read-only keeps every tab stop and the lit stars, and refuses every change; disabled dims the row and leaves the value readable; invalid writes aria-invalid and reddens the focus ring.',
    defineSnippet({
      id: 'rating-react-states',
      language: 'tsx',
      label: 'Three states',
      source: `<Rating aria-label="Your previous score" defaultValue={4} readOnly />;
<Rating aria-label="Closed rating" defaultValue={2} disabled />;
<Rating aria-label="Required rating" invalid required />;`,
    }),
  ),
  scene(
    'field',
    'Inside a field',
    'The field names the group through aria-labelledby, says its description and error through aria-describedby, and hands down size, disabled, required and invalid. A checkbox beside it is the answer for a question that may not apply.',
    defineSnippet({
      id: 'rating-react-field',
      language: 'tsx',
      label: 'A labelled, required rating',
      source: `<Field required>
  <FieldLabel>Qualidade do som</FieldLabel>
  <Rating />
  <FieldDescription>De uma a cinco estrelas.</FieldDescription>
</Field>;`,
    }),
  ),
  scene(
    'labels',
    'Words for the value',
    'caption as a function receives the value held and the value under the pointer, so the word follows the pointer and settles back. Each radio keeps its own number as its accessible name, through the itemLabel message.',
    defineSnippet({
      id: 'rating-react-labels',
      language: 'tsx',
      label: 'A caption that follows the pointer',
      source: `const WORDS = ['Terrible', 'Poor', 'Fair', 'Good', 'Excellent'];

<Rating
  aria-label="Atendimento"
  caption={({ preview, value }) => {
    const shown = preview ?? value;
    return shown === null ? 'No rating' : WORDS[shown - 1];
  }}
  defaultValue={4}
/>;`,
    }),
  ),
  scene(
    'keyboard',
    'The keyboard',
    'Tab lands on the checked star, or on the first. The arrows move one step and stop at both ends instead of wrapping; Home and End reach them; Backspace and Delete empty the value. The inline arrows swap in a right-to-left document.',
    defineSnippet({
      id: 'rating-react-keyboard',
      language: 'tsx',
      label: 'Keys, and the reason each request carries',
      source: `<Rating
  aria-label="Delivery"
  defaultValue={3}
  onValueChange={(value, request) => console.log(value, request.reason)}
/>;`,
    }),
  ),
  scene(
    'touch',
    'A finger along the row',
    'A finger or a pen dragged along the stars asks for the value under it, and only when that value changes; the root carries data-dragging so the fill follows without easing. A mouse does not scrub: it previews on hover and chooses on press.',
    defineSnippet({
      id: 'rating-react-touch',
      language: 'tsx',
      label: 'Scrubbing on a touch screen',
      source: `<Rating aria-label="Arraste para avaliar" max={10} size="lg" />;`,
    }),
  ),
];

const displayScenes: ReferenceSceneMeta[] = [
  scene(
    'playground',
    'Playground',
    'A reported value on the controls below the canvas. It is one image: the stars, the number and the count are hidden, and the name says all three once.',
    defineSnippet({
      id: 'rating-display-react-playground',
      language: 'tsx',
      label: 'A rating a page reports',
      source: `<RatingDisplay count={1284} value={4.6} />;`,
    }),
  ),
  scene(
    'fractions',
    'Any fraction',
    'Each star is lit by its own share of the value, so 4,6 lights six tenths of the fifth star and 2,25 a quarter of the third — the display draws what the input member cannot offer.',
    defineSnippet({
      id: 'rating-display-react-fractions',
      language: 'tsx',
      label: 'Fractions the input member does not offer',
      source: `<RatingDisplay value={4.6} />;
<RatingDisplay value={3.5} />;
<RatingDisplay value={2.25} />;`,
    }),
  ),
  scene(
    'compact',
    'Compact',
    'One star, the number and the count, for a card or a table cell with no room for five. The name still says the whole value and the scale.',
    defineSnippet({
      id: 'rating-display-react-compact',
      language: 'tsx',
      label: 'One star beside the number',
      source: `<RatingDisplay count={1284} size="sm" value={4.6} variant="compact" />;`,
    }),
  ),
  scene(
    'histogram',
    'Histogram in a list',
    'Five bars beside the number, each the share of the largest level, so a reader comparing products sees that 3,3 from a split audience and 3,3 from a lukewarm one are different products.',
    defineSnippet({
      id: 'rating-display-react-histogram',
      language: 'tsx',
      label: 'The shape of a distribution at list density',
      source: `<RatingDisplay count={8} distribution={[3, 0, 1, 0, 4]} value={3.25} variant="histogram" />;`,
    }),
  ),
  scene(
    'count',
    'With and without a count',
    'count is written in the locale’s grouping and added to the accessible name; without it the name says only the value. A product nobody rated shows zero, not an empty row.',
    defineSnippet({
      id: 'rating-display-react-count',
      language: 'tsx',
      label: 'The count, grouped by the locale',
      source: `<RatingDisplay count={1284} value={4.6} />;
<RatingDisplay value={3.5} />;
<RatingDisplay count={0} value={0} />;`,
    }),
  ),
  scene(
    'content',
    'Content the family did not choose',
    'Ten symbols in a narrow column shrink rather than wrap, another locale changes the separators, and a different symbol comes through renderSymbol, drawn in both the unlit and the lit layer.',
    defineSnippet({
      id: 'rating-display-react-content',
      language: 'tsx',
      label: 'Ten symbols, another locale, another symbol',
      source: `<RatingDisplay max={10} value={7.5} />;
<RatingDisplay count={1284} locale="en-US" value={4.6} />;
<RatingDisplay
  renderSymbol={() => (
    <Icon>
      <Glyph name="dot" />
    </Icon>
  )}
  value={3}
/>;`,
    }),
  ),
];

const summaryScenes: ReferenceSceneMeta[] = [
  scene(
    'playground',
    'Playground',
    'The bars variant: the mean as a figure, its scale, the stars and the count, then one bar per level, highest first, each the level’s share of the total.',
    defineSnippet({
      id: 'rating-summary-react-playground',
      language: 'tsx',
      label: 'The summary a product page leads with',
      source: `<RatingSummary aria-label="Customer ratings" counts={[9, 18, 47, 158, 1052]} />;`,
    }),
  ),
  scene(
    'filter',
    'Levels that filter',
    'filterable turns each level into a toggle with aria-pressed; a level nobody chose is disabled. The pressed levels are a state model of their own, controlled or not, with the reason pointer or keyboard.',
    defineSnippet({
      id: 'rating-summary-react-filter',
      language: 'tsx',
      label: 'Filtering reviews by level',
      source: `const [levels, setLevels] = useState<readonly number[]>([5]);

<RatingSummary
  aria-label="Filter ratings"
  counts={[9, 18, 47, 158, 1052]}
  filterable
  onSelectedLevelsChange={setLevels}
  selectedLevels={levels}
/>;`,
    }),
  ),
  scene(
    'spectrum',
    'Spectrum',
    'The same counts on the axis of the scale: a column per level, the mean, its 95% interval and the three buckets. Few readings widen the interval until the count says the mean is uncertain.',
    defineSnippet({
      id: 'rating-summary-react-spectrum',
      language: 'tsx',
      label: 'A distribution with its uncertainty',
      source: `<RatingSummary aria-label="Ratings summary" counts={[9, 18, 47, 158, 1052]} variant="spectrum" />;`,
    }),
  ),
  scene(
    'insight',
    'The conclusion',
    'The first conclusion that holds: divided when both ends pass a quarter, few under thirty readings or with a margin of half a star, consensus when four in five are positive, mixed otherwise. Thresholds come from the provider or the instance.',
    defineSnippet({
      id: 'rating-summary-react-insight',
      language: 'tsx',
      label: 'Four conclusions, and thresholds to move them',
      source: `<RatingSummary counts={[40, 12, 10, 14, 60]} variant="spectrum" />;
<RatingSummary counts={[1, 0, 2, 3, 4]} variant="spectrum" />;
<RatingSummary
  counts={[9, 18, 47, 158, 1052]}
  insightThresholds={{ consensus: 0.95 }}
  variant="spectrum"
/>;`,
    }),
  ),
  scene(
    'empty',
    'Nothing rated yet',
    'No figure and no scale: an absent mean is not a nought. The stars stay unlit, the count says why, and the conclusion is withheld.',
    defineSnippet({
      id: 'rating-summary-react-empty',
      language: 'tsx',
      label: 'A product nobody has rated',
      source: `<RatingSummary aria-label="No ratings" counts={[0, 0, 0, 0, 0]} />;`,
    }),
  ),
  scene(
    'narrow',
    'At a phone’s width',
    'The aggregate and the distribution stand side by side while both fit and stack when they do not; the spectrum keeps its axis and lets the count wrap.',
    defineSnippet({
      id: 'rating-summary-react-narrow',
      language: 'tsx',
      label: 'The summary in a narrow column',
      source: `<Measure>
  <RatingSummary aria-label="Ratings" counts={[9, 18, 47, 158, 1052]} />
</Measure>;`,
    }),
  ),
];

const ratingEvents: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: number | null, request: ChangeRequest<number | null>)',
    when: 'Before the value moves. reason is pointer for a press or a scrub, keyboard for an arrow, Home, End or a Space the keyboard synthesised, and clear for a press on the checked star or Backspace and Delete. cancel() refuses the move. A request equal to the value held is not emitted.',
  },
  {
    name: 'onPreviewChange',
    payload: '(value: number | null)',
    when: 'When the pointer moves over a radio, with its value, and with null when the pointer leaves the group. It is an event, not a state model: nothing the consumer owns has moved.',
  },
  {
    name: 'onKeyDown, onPointerDown, onPointerOver, onPointerLeave',
    payload: 'the element’s own events',
    when: 'Composed with the family’s: the consumer’s handler runs first, and a preventDefault() in onKeyDown keeps the key from the family.',
  },
];

const summaryEvents: EventRow[] = [
  {
    name: 'onSelectedLevelsChange',
    payload: '(levels: readonly number[], request: ChangeRequest<readonly number[]>)',
    when: 'Before the pressed levels move, with the levels in ascending order. reason is pointer for a press and keyboard for Enter or Space. cancel() refuses the move.',
  },
];

const shared = {
  size: [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'all members, RatingProvider',
    'The step the symbols and the text sit at. The symbol does not follow density; the text does',
  ],
  tone: [
    'tone',
    "'accent' | 'info' | 'success' | 'warning' | 'danger'",
    'warning',
    'all members, RatingProvider',
    'The color a lit symbol takes. secondary is declined: its solid step is a ground, and a star lit in it reads as unlit',
  ],
  max: [
    'max',
    'number',
    '5',
    'all members, RatingProvider',
    'How many symbols, or how many levels a summary reads from counts',
  ],
  locale: [
    'locale',
    'string',
    'the language in force',
    'all members',
    'The locale every number is written in: 4,6 and 1.284 in pt-BR',
  ],
  messages: [
    'messages',
    'Partial<RatingMessages>',
    '—',
    'all members',
    'Words laid over the language in force, key by key: every string the family writes',
  ],
} as const satisfies Record<string, ApiTuple>;

const composition = (member: string, rootElement: string): ApiRow[] =>
  apiRows([
    [
      'render',
      '(props: RatingRootProps) => ReactNode',
      '—',
      member,
      `Substitutes the ${rootElement} root and hands it every attribute and handler`,
    ],
    [
      'renderSymbol',
      '(state: { index, fill }) => ReactNode',
      '<Icon><Glyph name="star" /></Icon>',
      member,
      'Replaces the symbol. It is drawn in the unlit layer and in the lit one, so it lights the way the star does',
    ],
    [
      'RatingProvider',
      '{ size, tone, max, clearable, insightThresholds }',
      '—',
      'a subtree',
      'The decisions an application takes once. insightThresholds merges key by key; the instance always wins. The words and the locale come from SlottedProvider',
    ],
  ]);

export const REACT_RATING_DOCS = {
  rating: {
    imports,
    anatomy: ratingAnatomy,
    scenes: ratingScenes,
    events: ratingEvents,
    api: apiRows([
      [
        'value',
        'number | null',
        '—',
        'Rating',
        'Present means controlled, for the life of the component; null is a controlled empty value. Put on the grid of the scale: 3,2 on a whole scale is 4',
      ],
      [
        'defaultValue',
        'number | null',
        'null',
        'Rating',
        'The value an uncontrolled rating starts from, read once',
      ],
      shared.max,
      [
        'step',
        '1 | 0.5',
        '1',
        'Rating',
        'A whole symbol or half of one. Finer fractions are declined: a third of a 20-pixel star is below the minimum target',
      ],
      [
        'clearable',
        'boolean',
        'true',
        'Rating, RatingProvider',
        'Whether a press on the checked star, Backspace and Delete empty the value',
      ],
      shared.size,
      shared.tone,
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'Rating',
        'Unstated rather than false. Every radio is disabled natively; the value stays readable',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'Rating',
        'Unstated rather than false. Every change is refused, every radio keeps its tab stop, and aria-readonly is written',
      ],
      [
        'required',
        'boolean',
        'from the field, or false',
        'Rating',
        'Unstated rather than false. Writes aria-required on the group, never the native attribute',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'Rating',
        'Unstated rather than false. Writes aria-invalid and data-invalid',
      ],
      [
        'name',
        'string',
        'generated',
        'Rating',
        'The submission name every radio shares. Generated with useId when it is not written',
      ],
      ['form', 'string', '—', 'Rating', 'The form the radios submit with'],
      [
        'caption',
        'ReactNode | ((state: { value, preview }) => ReactNode)',
        '—',
        'Rating',
        'A word for the value in the value part. A function follows the pointer',
      ],
      shared.locale,
      shared.messages,
    ]),
    composition: [
      ...composition('Rating', 'div'),
      ...apiRows([
        ['ref', 'Ref<HTMLDivElement>', '—', 'Rating', 'Reaches the root element'],
        [
          'handle',
          'Ref<{ focus(): void }>',
          '—',
          'Rating',
          'focus() moves focus to the checked radio, or to the first when the value is empty',
        ],
      ]),
    ],
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Rating Radio Group: a radiogroup of native radios that share a name, each named by the itemLabel message — 3,5 de 5 — so the number is heard on every stop. Tab and Space are the platform’s.',
      'The arrows depart from the radio example on purpose: they stop at both ends instead of wrapping, as the APG’s rating slider, Ark, MUI and Mantine do, because a rating that falls from five to one on one keystroke too many is a defect. Home and End reach the ends, and the inline arrows swap in a right-to-left document.',
      'Read-only has no platform answer for a radio, so the change is refused on the click a pointer and Space share, aria-readonly is announced, and every radio keeps its tab stop. aria-required and aria-invalid are written on the group; the native required is not, because it would engage the browser’s own validation.',
      'In the light and dark schemes a star does not reach 3:1 against the page: the value is always in the accessible name and may be written beside the stars, and the high-contrast scheme and forced colors draw lit and unlit stars as distinct shapes with a contrasting edge.',
      'Under a coarse pointer each target grows to 44 pixels, and a finger can scrub along the row without losing vertical scrolling.',
    ],
    snippets: [
      defineSnippet({
        id: 'rating-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="rating" data-part="root" data-size="md" data-tone="warning" role="radiogroup">
  <div data-part="symbols">
    <span data-part="item" data-checked>
      <input data-part="input" type="radio" name="r" value="1" aria-label="1 de 5" checked />
      <span data-part="symbol">…</span>
      <span data-part="fill">…</span>
    </span>
  </div>
  <span data-part="value" aria-hidden="true">
    Terrible
  </span>
</div>;`,
      }),
      defineSnippet({
        id: 'rating-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='rating'] {
  --slotted-rating-bar-size: var(--slotted-space-3);
}`,
      }),
    ],
  },
  ratingDisplay: {
    imports,
    anatomy: displayAnatomy,
    scenes: displayScenes,
    api: apiRows([
      [
        'value',
        'number',
        '—',
        'RatingDisplay',
        'The value reported, any fraction, clamped to the scale',
      ],
      shared.max,
      shared.size,
      shared.tone,
      [
        'variant',
        "'full' | 'compact' | 'histogram'",
        'full',
        'RatingDisplay',
        'Every symbol, or one star beside the number, or one star and a bar per level',
      ],
      [
        'count',
        'number',
        '—',
        'RatingDisplay',
        'How many ratings. Written beside the number and added to the accessible name',
      ],
      [
        'distribution',
        'readonly number[]',
        '—',
        'RatingDisplay',
        'Counts per level, lowest first, drawn by the histogram variant',
      ],
      [
        'showValue',
        'boolean',
        'true',
        'RatingDisplay',
        'Whether the number is written beside the symbols',
      ],
      shared.locale,
      shared.messages,
    ]),
    composition: [
      ...composition('RatingDisplay', 'div'),
      ...apiRows([
        ['ref', 'Ref<HTMLDivElement>', '—', 'RatingDisplay', 'Reaches the root element'],
      ]),
    ],
    accessibility: [
      // language: pt-BR
      'The display is one image: role="img" with an aria-label from displayLabel or displayLabelWithCount — Avaliação 4,6 de 5, 1.284 avaliações — and every symbol, number and count inside is hidden, so the value is said once.',
      // language: en-US
      'The value is written in the locale’s digits and, as a label read aloud, a whole value is written whole: 4 de 5, not 4,0 de 5.',
      'A partial star is a clip of one shape, never a color alone; the number beside it is the reading that does not depend on seeing the fraction.',
    ],
    snippets: [
      defineSnippet({
        id: 'rating-display-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        // language: pt-BR
        source: `<div data-ui="rating" data-part="root" role="img" aria-label="Avaliação 4,6 de 5">
  <div data-part="symbols">
    <span data-part="item" style={{ '--slotted-rating-fill': 0.6 }}>
      <span data-part="symbol">…</span>
      <span data-part="fill">…</span>
    </span>
  </div>
  <span data-part="value" aria-hidden="true">
    4,6
  </span>
</div>;`,
        // language: en-US
      }),
    ],
  },
  ratingSummary: {
    imports,
    anatomy: summaryAnatomy,
    scenes: summaryScenes,
    events: summaryEvents,
    api: apiRows([
      [
        'counts',
        'readonly number[]',
        '—',
        'RatingSummary',
        'How many ratings each level holds, lowest level first; a negative or fractional count is dropped to its whole non-negative part',
      ],
      shared.max,
      [
        'variant',
        "'bars' | 'spectrum'",
        'bars',
        'RatingSummary',
        'One bar per level beside the figure, or columns on the axis with the mean and its interval',
      ],
      [
        'filterable',
        'boolean',
        'false',
        'RatingSummary',
        'Whether each level is a toggle that filters',
      ],
      [
        'selectedLevels',
        'readonly number[]',
        '—',
        'RatingSummary',
        'The pressed levels. Present means controlled',
      ],
      [
        'defaultSelectedLevels',
        'readonly number[]',
        '[]',
        'RatingSummary',
        'The levels an uncontrolled summary starts pressed',
      ],
      [
        'showInsight',
        'boolean',
        'true',
        'RatingSummary',
        'Whether the spectrum writes its conclusion',
      ],
      [
        'insightThresholds',
        'Partial<RatingInsightThresholds>',
        '{ divided: 0.25, few: 30, margin: 0.5, consensus: 0.8 }',
        'RatingSummary, RatingProvider',
        'Where the conclusions are drawn, merged over the provider’s',
      ],
      shared.size,
      shared.tone,
      shared.locale,
      shared.messages,
    ]),
    composition: [
      ...composition('RatingSummary', 'section').filter((row) => row.name !== 'renderSymbol'),
      ...apiRows([['ref', 'Ref<HTMLElement>', '—', 'RatingSummary', 'Reaches the section']]),
    ],
    accessibility: [
      'The summary is a region named by its aria-label. The figure, the scale and the count are text; the stars beside them are one image with its own name.',
      // language: pt-BR
      'Each level is named in full by levelLabel — 5 estrelas: 1.052 avaliações, 82% — so a reader hears the level, its count and its share without reading the bar. Filtering, each is a toggle with aria-pressed, disabled where nobody rated.',
      // language: en-US
      'The spectrum’s axis, its interval and its mean are hidden: the count line says the margin or the interval in words, and the conclusion is text in a pill, never a color alone.',
    ],
    snippets: [
      defineSnippet({
        id: 'rating-summary-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        // language: pt-BR
        source: `<section data-ui="rating" data-part="root" data-variant="summary" aria-label="Ratings">
  <div data-part="aggregate">…</div>
  <ul data-part="distribution" aria-label="Distribuição por estrelas">
    <li>
      <div data-part="level" role="group" aria-label="5 estrelas: 1.052 avaliações, 82%">
        …
      </div>
    </li>
  </ul>
</section>;`,
        // language: en-US
      }),
    ],
  },
} as const;
