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

export const ANGULAR_RATING_TOKENS = ratingTokens.map((name) => ({
  name,
  purpose: name.startsWith('--slotted-rating-')
    ? 'Rating decision a theme or an application retunes'
    : 'Foundation token the rating reads',
}));

const SIZE = "'sm' | 'md' | 'lg'";
const TONE = "'accent' | 'info' | 'success' | 'warning' | 'danger'";

const IMPORT_SOURCE =
  "import {\n  provideRating,\n  SlRating,\n  SlRatingCaption,\n  SlRatingDisplay,\n  SlRatingSummary,\n  SlRatingSymbol,\n} from '@slotted/angular/rating';";

const symbolRows: AnatomyRow[] = [
  {
    part: 'symbols',
    element: 'div',
    required: true,
    purpose:
      'The row of symbols. It never wraps: ten symbols in a narrow column shrink, each item staying square, rather than breaking onto a second line.',
  },
  {
    part: 'item',
    element: 'span',
    required: true,
    purpose:
      'One symbol’s square. On the input member it holds the radios and carries data-checked when one of them is checked; on the display it carries --slotted-rating-fill.',
  },
  {
    part: 'symbol',
    element: 'span, holding slIcon and the star glyph',
    required: true,
    purpose:
      'The unlit shape, painted in the secondary surface with the rating edge around it. It takes no pointer events, so the radio beneath it is the target.',
  },
  {
    part: 'fill',
    element: 'span, holding the same glyph',
    required: true,
    purpose:
      'The lit shape over the unlit one, clipped to the lit share of the symbol: the checked radio or the hovered one on the input member, --slotted-rating-fill on the display.',
  },
];

/* ------------------------------------------------------------------ rating */

const ratingImports: ReferenceImport = {
  source: IMPORT_SOURCE,
  selector: 'div[slRating]',
  exportAs: 'slRating',
};

const ratingAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the div carrying slRating',
    required: true,
    purpose:
      'The radio group. Carries data-ui="rating", role="radiogroup" (withdrawn inside a field group), data-size, data-tone, data-max, data-step when the step is a half, data-disabled, data-readonly, data-invalid and data-dragging, and the aria-invalid, aria-readonly and aria-required the platform has no attribute for. The value accessor and the validator are on this element.',
  },
  symbolRows[0] as AnatomyRow,
  symbolRows[1] as AnatomyRow,
  {
    part: 'input',
    element: 'input type="radio", one per step',
    required: true,
    purpose:
      'The control. Native, sharing one name, named "3 de 5" by aria-label. With step 0.5 each item holds two, the half first with data-half, stacked above the whole one over the inline-start half of the symbol.',
  },
  symbolRows[2] as AnatomyRow,
  symbolRows[3] as AnatomyRow,
  {
    part: 'value',
    element: 'span aria-hidden="true"',
    required: false,
    purpose:
      'The caption beside the row: projected content marked slRatingCaption, or an ng-template slRatingCaption rendered with the value and the preview. Hidden from assistive technology, because the checked radio already says the value.',
  },
];

const ratingScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One rating with every axis on it, driven by the controls below the canvas. Hover the row: the stars light up to the one under the pointer and the caption says its word before anything is chosen.',
    snippet: defineSnippet({
      id: 'rating-angular-playground',
      language: 'angular',
      label: 'A rating with a caption that follows the pointer',
      source: `<div slRating aria-label="Qualidade do som" [(value)]="nota">
  <ng-template slRatingCaption let-value="value" let-preview="preview">
    {{ palavras[preview ?? value ?? 0] }}
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'half',
    title: 'Half a star at a time',
    note: 'With step 0.5 each star holds two radios, and the inline-start half of the star asks for the half value. The arrow keys stop ten times on five stars, and each radio is named "3,5 de 5" in the locale.',
    snippet: defineSnippet({
      id: 'rating-angular-half',
      language: 'angular',
      label: 'Whole and half steps',
      source: `<div slRating aria-label="Conforto" [step]="0.5" [value]="3.5"></div>`,
    }),
  },
  {
    id: 'states',
    title: 'Read-only, disabled and invalid',
    note: 'Read-only keeps every tab stop and the lit stars, because the value is real, and refuses the press; disabled removes the row from the tab order; invalid reddens the edge and announces aria-invalid.',
    snippet: defineSnippet({
      id: 'rating-angular-states',
      language: 'angular',
      label: 'Three states on one row',
      source: `<div slRating aria-label="Published rating" readOnly [value]="4"></div>
<div slRating aria-label="Locked rating" disabled [value]="2"></div>
<div slRating aria-label="Required rating" invalid required></div>`,
    }),
  },
  {
    id: 'field',
    title: 'In a field, and in a reactive form',
    note: 'The field supplies the label, the description, the error and the size; the rating is the value accessor and the validator, so required means "choose a rating" and the error appears once the form is touched.',
    snippet: defineSnippet({
      id: 'rating-angular-field',
      language: 'angular',
      label: 'formControlName on the rating',
      source: `<div slField required>
  <label slFieldLabel>Sound quality</label>
  <div slRating formControlName="sound"></div>
  <p slFieldError>Choose a rating.</p>
</div>`,
    }),
  },
  {
    id: 'labels',
    title: 'Words for each value, and a scale of ten',
    note: 'The caption is the consumer’s: a word per star on a scale of five, the number on a scale of ten. Each radio’s own name comes from the itemLabel message, which a provider or one instance may reword.',
    snippet: defineSnippet({
      id: 'rating-angular-labels',
      language: 'angular',
      label: 'A caption and a reworded radio name',
      source: `<div
  slRating
  aria-label="Recomendaria a um amigo"
  [max]="10"
  [messages]="{ itemLabel: 'Nota {value} de {max}' }"
>
  <ng-template slRatingCaption let-value="value" let-preview="preview">
    {{ preview ?? value ?? 'No rating' }}
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keys, which stop at both ends',
    note: 'The arrows raise and lower by one step and stop at the first and the last, Home and End reach both ends, and Backspace or Delete empty a clearable rating. In a right-to-left page the inline arrows swap.',
    snippet: defineSnippet({
      id: 'rating-angular-keyboard',
      language: 'angular',
      label: 'The family’s keys, beside the platform’s Tab and Space',
      source: `<!-- ArrowRight/ArrowUp +1 · ArrowLeft/ArrowDown −1 · Home · End
     Backspace/Delete empty it when clearable -->
<div slRating aria-label="Atendimento" [value]="3"></div>`,
    }),
  },
  {
    id: 'touch',
    title: 'A finger dragged along the row',
    note: 'A touch or a pen dragged along the stars checks the one under it, read by ratingAtPoint, and the root carries data-dragging so the fill follows without its transition. The row keeps vertical panning; a mouse does not scrub.',
    snippet: defineSnippet({
      id: 'rating-angular-touch',
      language: 'angular',
      label: 'The same row, on a phone',
      source: `<div slRating aria-label="Bateria" size="lg" [(value)]="nota"></div>`,
    }),
  },
];

const ratingEvents: EventRow[] = [
  {
    name: '[(value)] and (valueChangeRequest)',
    payload: 'number | null, and ChangeRequest<number | null>',
    when: 'The request is emitted before the value moves, with the value asked for, the one it replaces, the reason — pointer, keyboard or clear — the event, and cancel(). A request nobody cancelled moves the model, which emits valueChange for the two-way binding. A value equal to the one held is never requested.',
  },
  {
    name: '(previewChange)',
    payload: 'number | null',
    when: 'When the pointer enters a radio, with its value, and null when it leaves the rating. It moves nothing the consumer owns, so it is an event and not a model.',
  },
  {
    name: 'ControlValueAccessor and Validator',
    payload: 'number | null',
    when: 'Whenever the value moves under formControl, formControlName or ngModel. A radio that loses focus marks the control touched, and required reports { required: true } while the value is null.',
  },
];

const ratingApi = apiRows([
  [
    'value',
    'model<number | null>',
    'null',
    'SlRating',
    'The rating, null for none. Put on the grid of the scale when drawn: 7 of 5 is 5, 3,2 on whole steps is 4, NaN is none',
  ],
  ['max', 'number', '5', 'SlRating, provideRating', 'How many symbols the row has'],
  [
    'step',
    '1 | 0.5',
    '1',
    'SlRating',
    'The smallest move. A half adds a second radio per symbol; smaller fractions are refused because a third of a star is below the minimum target',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'SlRating, provideRating',
    'Whether a press on the checked radio, Backspace or Delete empty the value, with the reason clear',
  ],
  [
    'size',
    SIZE,
    'md',
    'SlRating, provideRating',
    'The step of the symbols and the caption. Read from the field or field group first',
  ],
  [
    'tone',
    TONE,
    'warning',
    'SlRating, provideRating',
    'The colour of a lit symbol. secondary is outside the axis: its solid step is a ground, and a lit star in it reads as unlit',
  ],
  [
    'name',
    'string',
    'generated',
    'SlRating',
    'The submission name every radio shares. Generated when none is written, because an unnamed set of radios is not a group',
  ],
  [
    'form',
    'string',
    '—',
    'SlRating',
    'The form the radios belong to when the rating sits outside it',
  ],
  [
    'disabled',
    'boolean',
    'from the field, or false',
    'SlRating',
    'Native on every radio: the row leaves the tab order. A disabled form control sets it too',
  ],
  [
    'readOnly',
    'boolean',
    'from the field, or false',
    'SlRating',
    'The platform has no read-only radio, so the press and the keys are refused and aria-readonly is announced; every radio stays focusable',
  ],
  [
    'invalid',
    'boolean',
    'from the field, or false',
    'SlRating',
    'Writes aria-invalid and data-invalid, which reddens the edge of every symbol',
  ],
  [
    'required',
    'boolean',
    'from the field, or false',
    'SlRating',
    'Writes aria-required and makes the Validator demand a value. Never the native attribute, which would engage browser constraint validation',
  ],
  [
    'messages',
    'Partial<RatingMessages>',
    '—',
    'SlRating',
    'Words laid over the language in force, key by key. itemLabel names each radio: "{value} out of {max}"',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlRating',
    'The locale the radio names are written in: "3,5 de 5" in pt-BR, "3.5 de 5" in en',
  ],
  [
    'slRatingCaption',
    'directive',
    '—',
    'an element or an ng-template',
    'The caption in the value part. On an ng-template its context is { value, preview }, and it is rendered again whenever either moves',
  ],
  [
    'slRatingSymbol',
    'directive',
    '—',
    'an ng-template',
    'Replaces the star in both the symbol and the fill parts. Its context is { index, fill }',
  ],
]);

const ratingComposition = apiRows([
  [
    'exportAs="slRating"',
    'SlRating',
    '—',
    'a template',
    'Reaches the instance: focus() puts focus on the checked radio, or on the first when none is checked; current() reads the value on the grid of the scale',
  ],
  [
    'ControlValueAccessor and Validator',
    'formControl, formControlName, ngModel',
    '—',
    'the host element',
    'Both on the root, so a form binding goes where the directive is written. The integration React has no equivalent of',
  ],
  [
    'provideRating()',
    '{ size, tone, max, clearable, insightThresholds }',
    '—',
    'an injector',
    'The decisions an application takes once, for all three members. insightThresholds merges key by key; an instance input always wins. The words and the locale come from provideSlotted',
  ],
  [
    'aria-label, aria-describedby, role',
    'string',
    '—',
    'the host element',
    'Static attributes the consumer writes are read before the host bindings; aria-describedby is merged with the field’s description and error',
  ],
]);

const ratingAccessibility = [
  'The pattern is the WAI-ARIA APG Rating Radio Group example: a radiogroup of native radios, each named "3 de 5" by aria-label. Tab lands on the checked radio or on the first, and Space checks — both the platform’s, because the radios share a name.',
  'The arrows are the family’s and they do not wrap: the APG radio example wraps from the last star to the first, and a rating that falls from five to one on one key too many is the defect the APG slider example, Ark, MUI and Mantine all avoid. Home and End reach both ends; PageUp and PageDown are declined, because ten symbols are crossed key by key.',
  'The caption is aria-hidden, because the checked radio already announces the value; the glyphs are aria-hidden inside slIcon. Read-only is enforced by refusing the press and the keys, and every radio keeps its tab stop, its focus ring and its contrast.',
  'In the light and dark schemes a lit star measures 1,53:1 against the page, the ReUI yellow the family adopted; the value is never left to colour alone, because it is always in the accessible name and usually written beside the row. The high-contrast scheme and forced colours draw a solid edge around every star.',
];

/* ----------------------------------------------------------- ratingDisplay */

const displayImports: ReferenceImport = {
  source: IMPORT_SOURCE,
  selector: 'div[slRatingDisplay]',
  exportAs: 'slRatingDisplay',
};

const displayAnatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the div carrying slRatingDisplay',
    required: true,
    purpose:
      'An image: role="img", named "Rated 4.6 out of 5, 1,284 ratings" from displayLabel or displayLabelWithCount, unless the consumer wrote aria-label. Carries data-size, data-tone and data-variant for compact and histogram.',
  },
  ...symbolRows,
  {
    part: 'value',
    element: 'span aria-hidden="true"',
    required: false,
    purpose: 'The number, always to one place in the locale: 4,6. Omitted with showValue false.',
  },
  {
    part: 'histogram',
    element: 'span aria-hidden="true"',
    required: false,
    purpose: 'The distribution, lowest level first, in the histogram variant only.',
  },
  {
    part: 'bar',
    element: 'span',
    required: false,
    purpose:
      'One level of the histogram, its height --slotted-rating-share: the level over the largest level.',
  },
  {
    part: 'count',
    element: 'span aria-hidden="true"',
    required: false,
    purpose:
      'How many readings, grouped in the locale: "(1.284)" beside the stars, "1.284" at the end of a histogram row. Present when count is set.',
  },
];

const displayScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One display with every axis on it. Move the value by a tenth and watch the last star: the display draws any fraction, because nothing here is a target.',
    snippet: defineSnippet({
      id: 'rating-display-angular-playground',
      language: 'angular',
      label: 'A reported rating',
      source: `<div slRatingDisplay [value]="4.6" [count]="1284"></div>`,
    }),
  },
  {
    id: 'fractions',
    title: 'Any fraction of a star',
    note: 'Each item reads --slotted-rating-fill from ratingFills: 4,6 lights six tenths of the fifth star, 2,25 a quarter of the third. The number beside the stars is always to one place.',
    snippet: defineSnippet({
      id: 'rating-display-angular-fractions',
      language: 'angular',
      label: 'Fractions the input member does not offer',
      source: `<div slRatingDisplay [value]="4.6"></div>
<div slRatingDisplay [value]="2.25"></div>`,
    }),
  },
  {
    id: 'compact',
    title: 'One star, for a row or a card',
    note: 'compact draws one lit star, the number and the count — the form a product card or a table cell has room for. The name still says the whole value and the scale.',
    snippet: defineSnippet({
      id: 'rating-display-angular-compact',
      language: 'angular',
      label: 'The compact variant',
      source: `<div slRatingDisplay variant="compact" size="sm" [value]="4.6" [count]="1284"></div>`,
    }),
  },
  {
    id: 'histogram',
    title: 'The mean, and the spread behind it',
    note: 'histogram adds one bar per level, each over the largest. Two products at 3,3 read differently: one split between ones and fives, the other spread evenly — which a mean alone would hide.',
    snippet: defineSnippet({
      id: 'rating-display-angular-histogram',
      language: 'angular',
      label: 'A list row with its distribution',
      source: `<div
  slRatingDisplay
  variant="histogram"
  aria-label="Average 3.3 of 5, 8 reviews, divided opinions"
  [value]="3.3"
  [count]="8"
  [distribution]="[3, 0, 1, 0, 4]"
></div>`,
    }),
  },
  {
    id: 'count',
    title: 'How many readings the number is made of',
    note: 'count writes the grouped number beside the stars and joins the accessible name through displayLabelWithCount. A rating with no readings says 0,0 and (0) rather than hiding.',
    snippet: defineSnippet({
      id: 'rating-display-angular-count',
      language: 'angular',
      label: 'With and without a count',
      source: `<div slRatingDisplay [value]="4.6" [count]="1284"></div>
<div slRatingDisplay [value]="0" [count]="0"></div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A scale of ten in a narrow column shrinks each star rather than wrapping the row, a count of twelve million is grouped in the locale, and the row mirrors in a right-to-left page.',
    snippet: defineSnippet({
      id: 'rating-display-angular-content',
      language: 'angular',
      label: 'A long scale and a large count',
      source: `<div slRatingDisplay [max]="10" [value]="8.2" [count]="12408117"></div>`,
    }),
  },
];

const displayApi = apiRows([
  [
    'value',
    'number',
    '—',
    'SlRatingDisplay',
    'The number drawn. Any fraction; clamped to the scale, NaN drawn as nought',
  ],
  ['max', 'number', '5', 'SlRatingDisplay, provideRating', 'How many symbols the scale has'],
  ['size', SIZE, 'md', 'SlRatingDisplay, provideRating', 'The step of the symbols and the text'],
  ['tone', TONE, 'warning', 'SlRatingDisplay, provideRating', 'The colour of the lit share'],
  [
    'variant',
    "'full' | 'compact' | 'histogram'",
    'full',
    'SlRatingDisplay',
    'Every symbol; one lit star with the number; or one star, the number and the distribution',
  ],
  [
    'count',
    'number',
    '—',
    'SlRatingDisplay',
    'How many readings. Written beside the stars and in the accessible name',
  ],
  [
    'distribution',
    'readonly number[]',
    '—',
    'SlRatingDisplay',
    'Counts per level, lowest first, drawn by the histogram variant',
  ],
  [
    'showValue',
    'boolean',
    'true',
    'SlRatingDisplay',
    'Whether the number is written beside the stars',
  ],
  [
    'messages',
    'Partial<RatingMessages>',
    '—',
    'SlRatingDisplay',
    'Words laid over the language in force, key by key: displayLabel and displayLabelWithCount name the image',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlRatingDisplay',
    'The locale the number and the count are written in',
  ],
]);

const displayAccessibility = [
  'The display is one image, role="img", named by its whole value and its count: "Rated 4.6 out of 5, 1,284 ratings". The stars, the number and the count inside it are aria-hidden, so a screen reader hears one sentence rather than five images and two numbers.',
  'A name the consumer writes as a static aria-label wins, which is how a histogram row says "divided opinions" as well as the mean.',
  'The number is always written beside the stars unless showValue is false, because a lit share of a star is not a readable quantity for anyone, at any contrast.',
];

/* ----------------------------------------------------------- ratingSummary */

const summaryImports: ReferenceImport = {
  source: IMPORT_SOURCE,
  selector: 'section[slRatingSummary]',
  exportAs: 'slRatingSummary',
};

const part = (name: string, element: string, purpose: string, required = false): AnatomyRow => ({
  part: name,
  element,
  required,
  purpose,
});

const summaryAnatomy: AnatomyRow[] = [
  part(
    'root',
    'the section carrying slRatingSummary',
    'A region named by the consumer’s aria-label. data-variant is summary for bars and spectrum for the spectrum, which also carries --slotted-rating-mean, --slotted-rating-low and --slotted-rating-high.',
    true,
  ),
  part(
    'aggregate',
    'div',
    'The figure and the scale; then the stars in bars, or the conclusion in the spectrum; then the count.',
    true,
  ),
  part(
    'value',
    'span',
    'The mean to one place. Omitted when nothing has been rated: a missing mean is not nought.',
  ),
  part('scale', 'span', '"de 5", from the scale message. Omitted with the value.'),
  part(
    'insight',
    'span data-tone',
    'The one conclusion that holds first — divided, few, consensus, mixed — as a pill in its tone. Spectrum only, because it is read from the spread only the spectrum draws; omitted with showInsight false or no readings.',
  ),
  part(
    'count',
    'span',
    'How many readings; for the spectrum, also the margin or the uncertain interval.',
    true,
  ),
  part(
    'distribution',
    'ul aria-label',
    'The bars variant’s list of levels, highest first, named by distributionLabel.',
  ),
  part(
    'level',
    'button aria-pressed, or div role="group"',
    'One level: a toggle when filterable, disabled at zero readings; a named group otherwise.',
  ),
  part('level-label', 'span', 'The level’s number and a star.'),
  part('track', 'span aria-hidden="true"', 'The ground of one level’s bar.'),
  part(
    'indicator',
    'span',
    'The bar, its length --slotted-rating-share: the level’s share of all readings.',
  ),
  part('level-count', 'span', 'The level’s count, grouped in the locale.'),
  part('plot', 'div', 'The spectrum’s drawing: the field over the axis.'),
  part('field', 'div', 'The columns, with the interval and the mean laid over them.'),
  part('columns', 'div', 'The five columns, lowest level first.'),
  part(
    'column',
    'button aria-pressed, or div role="group"',
    'One level of the spectrum, its height --slotted-rating-share: the level over the largest level.',
  ),
  part('bar', 'span', 'The painted column inside each column target.'),
  part(
    'interval',
    'span aria-hidden="true"',
    'The 95% interval of the mean, from --slotted-rating-low to -high.',
  ),
  part('mean', 'span aria-hidden="true"', 'The mean’s mark on the axis, at --slotted-rating-mean.'),
  part('mean-label', 'span', 'The mean written on its mark.'),
  part('axis', 'div aria-hidden="true"', 'The scale under the columns.'),
  part('tick', 'span', 'One level on the axis.'),
  part('tick-label', 'span', 'The level’s number and a star.'),
  part('tick-share', 'span', 'The level’s share, a whole percent.'),
  part('sentiment', 'p', 'The three buckets, when anything has been rated.'),
  part('bucket', 'span data-tone', 'Positive, neutral or negative, with its share in strong.'),
  part('swatch', 'span aria-hidden="true"', 'The bucket’s colour key.'),
];

const summaryScenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The aggregate beside one bar per level, highest first. The two blocks stand side by side while both fit and stack when they do not; narrow the window to see the break.',
    snippet: defineSnippet({
      id: 'rating-summary-angular-playground',
      language: 'angular',
      label: 'A summary from counts per level',
      source: `<section slRatingSummary aria-label="Customer reviews" [counts]="[9, 18, 47, 158, 1052]"></section>`,
    }),
  },
  {
    id: 'filter',
    title: 'Levels that filter the reviews',
    note: 'filterable turns each level into a toggle button with aria-pressed; the pressed levels are selectedLevels, asked for first through selectedLevelsChangeRequest. A level nobody chose is disabled, because a filter that returns nothing is a dead end.',
    snippet: defineSnippet({
      id: 'rating-summary-angular-filter',
      language: 'angular',
      label: 'selectedLevels, two-way',
      source: `<section
  slRatingSummary
  aria-label="Filter reviews"
  filterable
  [counts]="contagens"
  [(selectedLevels)]="niveis"
></section>`,
    }),
  },
  {
    id: 'spectrum',
    title: 'The spectrum: spread, mean and margin',
    note: 'The same counts as columns over the scale, lowest first, with the mean and its 95% interval laid over them and the readings split into positive, neutral and negative. Eight readings at 3.3 say "uncertain average, between 2.0 and 4.5".',
    snippet: defineSnippet({
      id: 'rating-summary-angular-spectrum',
      language: 'angular',
      label: 'The spectrum variant',
      source: `<section
  slRatingSummary
  variant="spectrum"
  aria-label="Review summary"
  filterable
  [counts]="[9, 18, 47, 158, 1052]"
></section>`,
    }),
  },
  {
    id: 'insight',
    title: 'One conclusion, the first that holds',
    note: 'Divided when both ends hold a quarter each, few below thirty readings or with a margin of half a level, consensus when four fifths are positive, mixed otherwise. The pill belongs to the spectrum; insightThresholds moves each line; showInsight false removes it.',
    snippet: defineSnippet({
      id: 'rating-summary-angular-insight',
      language: 'angular',
      label: 'Thresholds an instance moves',
      source: `<section
  slRatingSummary
  variant="spectrum"
  aria-label="Reviews"
  [counts]="[40, 12, 10, 14, 60]"
  [insightThresholds]="{ divided: 0.3 }"
></section>`,
    }),
  },
  {
    id: 'empty',
    title: 'Nobody has rated it yet',
    note: 'With zero readings the figure and the scale are omitted — a missing mean is not nought — the stars are unlit, the count says "No ratings yet", and no conclusion is drawn.',
    snippet: defineSnippet({
      id: 'rating-summary-angular-empty',
      language: 'angular',
      label: 'An empty summary',
      source: `<section slRatingSummary aria-label="No reviews" [counts]="[0, 0, 0, 0, 0]"></section>`,
    }),
  },
  {
    id: 'narrow',
    title: 'In a narrow column',
    note: 'In a 360-pixel column the aggregate stacks above the distribution and every row of bars keeps its label, its bar and its count aligned with the rows above it.',
    snippet: defineSnippet({
      id: 'rating-summary-angular-narrow',
      language: 'angular',
      label: 'The same summary in a drawer',
      source: `<section slRatingSummary size="sm" aria-label="Reviews" [counts]="[9, 18, 47, 158, 1052]"></section>`,
    }),
  },
];

const summaryEvents: EventRow[] = [
  {
    name: '[(selectedLevels)] and (selectedLevelsChangeRequest)',
    payload: 'readonly number[], and ChangeRequest<readonly number[]>',
    when: 'The request is emitted before the pressed levels move, with the levels asked for in ascending order, the ones they replace, the reason — pointer, or keyboard for Space and Enter — the event and cancel(). A request nobody cancelled moves the model.',
  },
];

const summaryApi = apiRows([
  [
    'counts',
    'readonly number[]',
    '—',
    'SlRatingSummary',
    'How many readings each level holds, lowest first. Negative and fractional counts are dropped to their whole non-negative part',
  ],
  [
    'max',
    'number',
    '5',
    'SlRatingSummary, provideRating',
    'How many levels the scale has. A level missing from counts holds none; a count past it is dropped',
  ],
  [
    'variant',
    "'bars' | 'spectrum'",
    'bars',
    'SlRatingSummary',
    'One bar per level, or columns over the scale with the mean, its interval and the buckets',
  ],
  [
    'filterable',
    'boolean',
    'false',
    'SlRatingSummary',
    'Each level or column becomes a toggle button, disabled with zero readings',
  ],
  [
    'selectedLevels',
    'model<readonly number[]>',
    '[]',
    'SlRatingSummary',
    'The pressed levels, ascending. Two-way; every move is asked first',
  ],
  [
    'insightThresholds',
    'Partial<RatingInsightThresholds>',
    '{ divided: 0.25, few: 30, margin: 0.5, consensus: 0.8 }',
    'SlRatingSummary, provideRating',
    'Where each conclusion is drawn, merged key by key. margin also decides when the spectrum says its mean is uncertain',
  ],
  [
    'showInsight',
    'boolean',
    'true',
    'SlRatingSummary',
    'Whether the spectrum draws its conclusion. The bars variant draws none',
  ],
  ['size', SIZE, 'md', 'SlRatingSummary, provideRating', 'The step of the text and the rows'],
  [
    'tone',
    TONE,
    'warning',
    'SlRatingSummary, provideRating',
    'The colour of the stars and the bars',
  ],
  [
    'messages',
    'Partial<RatingMessages>',
    '—',
    'SlRatingSummary',
    'Words laid over the language in force, key by key — every sentence of the summary: summaryCount, summaryEmpty, spectrumCount, spectrumUncertain, levelLabel, distributionLabel, the buckets and the four conclusions',
  ],
  [
    'locale',
    'string',
    'the language in force',
    'SlRatingSummary',
    'The locale every number is written in',
  ],
]);

const summaryAccessibility = [
  'The summary is a section named by the consumer’s aria-label, so it is a region a screen reader can reach by landmark. The figure is plain text, and the stars inside the aggregate are one image named by the mean.',
  'Each level is named whole — "5 stars: 1,052 ratings, 82%" — and the bar, the axis and the mean mark are aria-hidden, because the name already carries what they draw.',
  'A filterable level is a native toggle button with aria-pressed, so Space and Enter press it; a level with no readings is disabled rather than offered as a filter that returns nothing.',
  'The conclusion and the three buckets are words, not colours: the tone of the pill and of each swatch repeats a sentence that is already written.',
];

export const ANGULAR_RATING_DOCS = {
  rating: {
    imports: ratingImports,
    anatomy: ratingAnatomy,
    scenes: ratingScenes,
    events: ratingEvents,
    api: ratingApi,
    composition: ratingComposition,
    accessibility: ratingAccessibility,
    snippets: [
      defineSnippet({
        id: 'rating-angular-defaults',
        language: 'ts',
        label: 'The decisions an application takes once',
        source: `import { provideSlotted } from '@slotted/angular/i18n';
import { provideRating } from '@slotted/angular/rating';

bootstrapApplication(App, {
  providers: [
    provideSlotted({ locale: 'pt-BR' }),
    provideRating({ tone: 'accent', clearable: false }),
  ],
});`,
      }),
      defineSnippet({
        id: 'rating-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="rating"
  data-part="root"
  data-size="md"
  data-tone="warning"
  data-max="5"
  role="radiogroup"
  aria-label="Rating"
>
  <div data-part="symbols">
    <span data-part="item" data-checked>
      <input data-part="input" type="radio" name="nota" value="4" aria-label="4 de 5" checked />
      <span data-part="symbol"
        ><span data-ui="icon" data-part="root" aria-hidden="true"></span
      ></span>
      <span data-part="fill"><span data-ui="icon" data-part="root" aria-hidden="true"></span></span>
    </span>
  </div>
  <span data-part="value" aria-hidden="true">Bom</span>
</div>`,
      }),
      defineSnippet({
        id: 'rating-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='rating'] {
  --slotted-rating-lit-color: var(--slotted-tone-accent-solid);
  --slotted-rating-symbol-size: 24px;
  --slotted-rating-gap: var(--slotted-space-2);
}`,
      }),
    ],
  },
  ratingDisplay: {
    imports: displayImports,
    anatomy: displayAnatomy,
    scenes: displayScenes,
    api: displayApi,
    composition: apiRows([
      [
        'aria-label',
        'string',
        'displayLabel',
        'the host element',
        'A static name the consumer writes wins over the family’s sentence',
      ],
      [
        'provideRating()',
        '{ size, tone, max }',
        '—',
        'an injector',
        'Shared with the other two members',
      ],
    ]),
    accessibility: displayAccessibility,
    snippets: [
      defineSnippet({
        id: 'rating-display-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="rating"
  data-part="root"
  data-size="md"
  data-tone="warning"
  role="img"
  aria-label="Rated 4.6 out of 5, 1,284 ratings"
>
  <div data-part="symbols">
    <span data-part="item" style="--slotted-rating-fill: 0.6">…</span>
  </div>
  <span data-part="value" aria-hidden="true">4,6</span>
  <span data-part="count" aria-hidden="true">(1.284)</span>
</div>`,
      }),
    ],
  },
  ratingSummary: {
    imports: summaryImports,
    anatomy: summaryAnatomy,
    scenes: summaryScenes,
    events: summaryEvents,
    api: summaryApi,
    composition: apiRows([
      [
        'exportAs="slRatingSummary"',
        'SlRatingSummary',
        '—',
        'a template',
        'Reaches the instance: summary() is the whole summariseRatings result, for a caption of one’s own',
      ],
      [
        'provideRating()',
        '{ size, tone, max, insightThresholds }',
        '—',
        'an injector',
        'Shared with the other two members',
      ],
    ]),
    accessibility: summaryAccessibility,
    snippets: [
      defineSnippet({
        id: 'rating-summary-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<section data-ui="rating" data-part="root" data-variant="summary" aria-label="Reviews">
  <div data-part="aggregate">
    <span data-part="value">4,7</span>
    <span data-part="scale">de 5</span>
    <span data-part="count">Based on 1,284 ratings</span>
  </div>
  <ul data-part="distribution" aria-label="Distribution by stars">
    <li>
      <div data-part="level" role="group" aria-label="5 stars: 1,052 ratings, 82%">…</div>
    </li>
  </ul>
</section>`,
      }),
    ],
  },
} as const;
