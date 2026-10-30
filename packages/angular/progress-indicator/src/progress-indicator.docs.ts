import progressTokens from '@slotted/styles/progress-indicator/tokens.json';
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

export const ANGULAR_PROGRESS_INDICATOR_TOKENS = progressTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Progress Indicator decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlProgressBar, SlProgressCircle, SlLoader, provideProgressIndicatorDefaults } from '@slotted/angular/progress-indicator';",
  selector: '[slProgressBar] · [slProgressCircle] · [slLoader]',
  exportAs: 'slProgressBar · slProgressCircle · slLoader',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element you put the attribute on',
    required: true,
    purpose:
      'The host, and the element that carries role="progressbar", the range and the states. The selector is a bare attribute, so a bar in a table cell is that cell and a ring in a menu item is that item.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose:
      'The rendered accessible name, referenced by aria-labelledby. Present when label is set; clipped by visually-hidden when hideLabel is, and a page-level bar clips it by itself.',
  },
  {
    part: 'value',
    element: 'span',
    required: false,
    purpose:
      'The formatted number, in tabular figures so a counting bar does not jitter. Present when showValue is set and the indicator has a value to write.',
  },
  {
    part: 'track',
    element: 'div, or an svg circle',
    required: true,
    purpose:
      'The ground the indicator is drawn on: painted for the bar, painted for a determinate ring, and transparent for the loader unless contained. The remaining track, the buffer and the stop indicator are drawn on it and are not parts.',
  },
  {
    part: 'indicator',
    element: 'div, or an svg circle or path',
    required: true,
    purpose:
      'The quantity: the filled bar, the arc, or the morphing shape. It is what the tone paints and what the motion moves.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A bar in the row it would really stand in, driven by the controls below the canvas. Move the value and watch the gap, the stop indicator and the number move together.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-playground',
      language: 'angular',
      label: 'One bar',
      source: '<div slProgressBar label="Uploading invoices" showValue [value]="uploaded()"></div>',
    }),
  },
  {
    id: 'recipes',
    title: 'Three shapes, three jobs',
    note: 'The bar reports a quantity along a row, the ring reports one in a cell too narrow for a bar, and the loader keeps a short wait company. Pick the directive; there is no shape input.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-recipes',
      language: 'angular',
      label: 'The three directives',
      source:
        '<div slProgressBar label="Uploading invoices" [value]="40"></div>\n<div slProgressCircle label="Rebuilding index" [value]="70"></div>\n<span slLoader label="Signing you in"></span>',
    }),
  },
  {
    id: 'determinate',
    title: 'A quantity, and the range it is measured against',
    note: 'value against min and max, the number written by Intl in the page language, and the finished bar closing its own gap. Compare the four per cent bar with the one at forty.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-determinate',
      language: 'angular',
      label: 'A value, a range and a format',
      source:
        '<div slProgressBar label="Copying files" showValue [value]="copied()"></div>\n\n<!-- A range of your own, written in the unit you passed in. -->\n<div\n  slProgressBar\n  label="Downloading"\n  showValue\n  [format]="{ style: \'unit\', unit: \'megabyte\', unitDisplay: \'narrow\' }"\n  [max]="512"\n  [value]="128"\n></div>',
    }),
  },
  {
    id: 'indeterminate',
    title: 'A wait with no number in it',
    note: 'Leave value alone and the indicator reports a wait instead of a quantity: aria-valuenow is omitted, the whole track shows, and the arc has no remainder to draw.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-indeterminate',
      language: 'angular',
      label: 'No value, and none implied',
      source:
        '<div slProgressBar label="Preparing your export"></div>\n<div slProgressCircle label="Checking availability"></div>\n\n<!-- Reporting nought per cent would be a claim nobody made. -->\n<div slProgressBar label="Preparing" [value]="null"></div>',
    }),
  },
  {
    id: 'loader',
    title: 'The wait a shape keeps',
    note: 'M3 Expressive’s loading indicator: a shape morphs through a sequence while it turns, at two periods that never repeat a frame. Google recommends it over a spinning ring below five seconds.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-loader',
      language: 'angular',
      label: 'Bare, and in M3’s container',
      source:
        '<span slLoader label="Signing you in"></span>\n\n<!-- On a photograph or a coloured surface, where a bare shape has no ground. -->\n<span slLoader contained label="Signing you in" size="lg"></span>',
    }),
  },
  {
    id: 'wave',
    title: 'The wavy active indicator',
    note: 'M3 Expressive’s wave, on the bar and on the ring. The crests run back toward the start, which reads as the fill flowing forward; the track stays flat, and the ring grows a fifth to make room for its own crests, as M3’s does from 40dp to 48dp.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-wave',
      language: 'angular',
      label: 'One input, two shapes',
      source:
        '<div slProgressBar label="Rendering the report" size="lg" wave [value]="62"></div>\n<div slProgressCircle label="Rendering the report" wave [value]="62"></div>',
    }),
  },
  {
    id: 'waveRamp',
    title: 'The wave flattens at both ends',
    note: 'The amplitude is a ramp on the value rather than a switch: flat to six per cent, full from sixteen to eighty-four, flat again from ninety-six. The fill’s own spring moves it, so the crests settle as the bar arrives.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-wave-ramp',
      language: 'angular',
      label: 'One input, five values',
      source:
        '<div slProgressBar label="Five per cent" size="lg" wave [value]="5"></div>\n<div slProgressBar label="Half way" size="lg" wave [value]="50"></div>\n<div slProgressBar label="Finished" size="lg" wave [value]="100"></div>',
    }),
  },
  {
    id: 'wavePace',
    title: 'The wave keeps its own pace',
    note: 'The crests run back toward the start at one wavelength every 1.1 seconds whatever the value does, which is what reads on screen as the fill flowing forward. A load of a second and a half overtakes them and closes before they have crossed the track; a load of half a minute lets them pass its standing end many times.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-wave-pace',
      language: 'angular',
      label: 'The same bar, driven at two speeds',
      source:
        '<!-- Four points every sixty milliseconds, or one every three hundred: the wave is the same. -->\n<div slProgressBar label="Compressing" showValue size="lg" wave [value]="fast()"></div>\n<div slProgressBar label="Rebuilding the index" showValue size="lg" wave [value]="slow()"></div>',
    }),
  },
  {
    id: 'waveIndeterminate',
    title: 'The wave with no value',
    note: 'Leave value alone and the travelling bar carries M3’s tighter indeterminate wave — one period every five thicknesses instead of ten — wavy along its whole length, because there is no value to flatten it against.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-wave-indeterminate',
      language: 'angular',
      label: 'No value, and a wave',
      source: '<div slProgressBar label="Preparing your export" size="lg" wave></div>',
    }),
  },
  {
    id: 'waveSizes',
    title: 'The wave is measured in thicknesses',
    note: 'One wavelength is ten thicknesses and a crest is three quarters of one at every size, so the small bar’s wave is forty pixels long and the large bar’s eighty. Every ring carries eight crests, because the wave is wound on the viewBox and the viewBox scales.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-wave-sizes',
      language: 'angular',
      label: 'Three sizes, one wave',
      source:
        '<div slProgressBar label="Small" size="sm" wave [value]="55"></div>\n<div slProgressBar label="Large" size="lg" wave [value]="55"></div>\n<div slProgressCircle label="Saving" size="lg" wave [value]="55"></div>',
    }),
  },
  {
    id: 'buffer',
    title: 'Received, and not yet processed',
    note: 'Two quantities in one track: the indicator is what is done and the lighter band is what has arrived. Beside it, the same value with no buffer, so the gap is visible again.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-buffer',
      language: 'angular',
      label: 'A second quantity',
      source:
        '<div\n  slProgressBar\n  label="Processing uploaded pages"\n  showValue\n  size="lg"\n  [buffer]="72"\n  [value]="34"\n></div>',
    }),
  },
  {
    id: 'sizes',
    title: 'Three steps, in the geometry each shape has',
    note: 'size is the bar’s thickness, the ring’s diameter and the loader’s box. The rings read the control height scale, so one standing beside a button is exactly as tall as the button.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-sizes',
      language: 'angular',
      label: 'The same word, three geometries',
      source:
        '<div slProgressBar label="Small" size="sm" [value]="55"></div>\n<div slProgressCircle label="Beside a button" size="md" [value]="55"></div>\n<span slLoader label="Large" size="lg"></span>',
    }),
  },
  {
    id: 'tones',
    title: 'What the wait means, in colour',
    note: 'The five the theme owns, each in the context it exists for: work in hand, a background job, an upload that landed, a quota nearly spent, a transfer that failed.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-tones',
      language: 'angular',
      label: 'Tone, and the sentence beside it',
      source:
        '<div slProgressBar label="Uploading invoices" [value]="62"></div>\n<div slProgressBar label="Reindexing in the background" tone="secondary" [value]="62"></div>\n<div slProgressBar label="Storage used" tone="warning" [value]="88"></div>\n<div slProgressBar label="Transfer failed" tone="danger" [value]="41"></div>',
    }),
  },
  {
    id: 'timing',
    title: 'The flash, and the flash in reverse',
    note: 'Two loads that finish every nine hundred milliseconds. On the left nothing is timed and the row churns; on the right the delay withholds the paint and minDuration holds it.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-timing',
      language: 'ts',
      label: 'The recommended pair, set once',
      source:
        'bootstrapApplication(App, {\n  providers: [provideProgressIndicatorDefaults({ delay: 200, minDuration: 400 })],\n});',
    }),
  },
  {
    id: 'page',
    title: 'The bar on an edge: the viewport’s, or a box’s',
    note: 'placement="page" pins the bar to the top edge of the viewport, squares its corners, drops its track and reads the sticky stacking token. edge-start and edge-end stand the same bar on the block-start or block-end edge of the nearest positioned box, over the line that edge draws; slAppShellProgress and slPageHeaderProgress are the boxes the library gives it. Each grows out of its edge and goes back into it.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-page',
      language: 'angular',
      label: 'A page-level bar',
      source:
        '<div slProgressBar label="Loading page" placement="page" [loading]="navigating()"></div>\n\n<!-- The same bar on an edge of the nearest positioned box. -->\n<div slProgressBar label="Refreshing" placement="edge-start"></div>\n<div slProgressBar label="Saving" placement="edge-end" [value]="62"></div>\n\n<!-- The name is clipped by the placement, because an edge bar has nowhere to show it. -->\n<div slProgressBar label="Loading page" placement="page" [hideLabel]="false"></div>',
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A four-word label in a 360-pixel column, an unbreakable digest beside a number that must not break, and a right-to-left row where every edge changes ends but the clock does not.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-content',
      language: 'angular',
      label: 'A label it cannot predict',
      source:
        '<div slProgressBar label="Verificando assinaturas do pacote publicado" showValue [value]="47"></div>\n\n<div dir="rtl">\n  <div\n    slProgressCircle\n    label="جارٍ التحقق من التوقيعات"\n    locale="ar-EG"\n    showValue\n    [value]="47"\n  ></div>\n</div>',
    }),
  },
  {
    id: 'composition',
    title: 'A wait a product would ship',
    note: 'An upload row: the file, the bar, the number, and a button to cancel. Beside it the provider that sets the timing, the tone and the language of every indicator below it.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-composition',
      language: 'angular',
      label: 'An upload row',
      source:
        '<div slInline gap="5">\n  <span slText>report-q3.pdf</span>\n  <div slProgressBar hideLabel label="Uploading report-q3.pdf" showValue [value]="uploaded()"></div>\n  <button slButton tone="secondary" variant="outline" type="button">Cancel</button>\n</div>',
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The two attributes ARIA asks a consumer to write on their own region, the sentence that carries the wait in words, and the indicator that leaves the tree because the words already say it.',
    snippet: defineSnippet({
      id: 'progress-indicator-angular-accessibility',
      language: 'angular',
      label: 'The region, the message and the decoration',
      source:
        '<section [attr.aria-busy]="pending() ? \'true\' : null" aria-describedby="import-progress">\n  <div slProgressBar id="import-progress" label="Importing contacts" showValue [value]="62"></div>\n</section>\n\n<!-- The words a reader hears are the words a reader sees. -->\n<div slInline gap="4">\n  <span slLoader decorative size="sm"></span>\n  <p slInlineMessage>Importing contacts — 62%</p>\n</div>',
    }),
  },
];

export const ANGULAR_PROGRESS_INDICATOR_DOCS = {
  progressIndicator: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'value',
        'number | null',
        'null (indeterminate)',
        'slProgressBar, slProgressCircle',
        'The quantity. Absent or null is a wait rather than nought per cent, and a value outside the range is clamped',
      ],
      [
        'min',
        'number',
        '0',
        'slProgressBar, slProgressCircle',
        'The bottom of the range, and what aria-valuemin reports',
      ],
      [
        'max',
        'number',
        '100',
        'slProgressBar, slProgressCircle',
        'The top of the range, and what aria-valuemax reports. Reaching it writes data-complete',
      ],
      [
        'buffer',
        'number | null',
        '—',
        'slProgressBar',
        'A second, further quantity: received but not yet processed. Never painted behind the value',
      ],
      [
        'size',
        'sm | md | lg',
        'md',
        'all three',
        'The bar’s thickness, the ring’s diameter, the loader’s box. Rings and loaders read the control height scale, so they match a control of the same step',
      ],
      [
        'tone',
        'accent | secondary | info | success | warning | danger',
        'accent',
        'all three',
        'The five the theme owns. The indicator is the tone’s text role and the track is a computed tint of it',
      ],
      [
        'label',
        'string',
        '—',
        'all three',
        'The rendered accessible name. Without it, or an aria-label on your own element, or decorative, a development warning names the component',
      ],
      [
        'hideLabel',
        'boolean',
        'false',
        'all three',
        'Clips the label with visually-hidden and keeps it as the name. A page-level bar sets it by itself',
      ],
      [
        'showValue',
        'boolean',
        'false',
        'slProgressBar, slProgressCircle',
        'Whether the formatted number is rendered beside the name. A wait needs no number to be understood',
      ],
      [
        'valueText',
        'string',
        '—',
        'slProgressBar, slProgressCircle',
        'A string the family cannot compute — “3 of 7 files”. It becomes both aria-valuetext and the rendered value',
      ],
      [
        'format',
        'Intl.NumberFormatOptions',
        '—',
        'slProgressBar, slProgressCircle',
        'How the number is written, applied to the value. Absent, the ratio is written as a percentage',
      ],
      [
        'locale',
        'string',
        '—',
        'slProgressBar, slProgressCircle',
        'BCP 47. Absent, the token’s, then the runtime’s own',
      ],
      [
        'wave',
        'boolean',
        'false',
        'slProgressBar, slProgressCircle',
        'M3 Expressive’s wavy active indicator. The ring grows a fifth to make room for its crests',
      ],
      [
        'contained',
        'boolean',
        'false',
        'slLoader',
        'M3’s fully rounded container behind the morphing shape, at M3’s own 38:48 ratio',
      ],
      [
        'placement',
        'inline | page | edge-start | edge-end',
        'inline',
        'slProgressBar',
        'page pins the bar to the top edge of the viewport, squares it, drops its track and reads the sticky stacking token; edge-start and edge-end stand it on the block-start or block-end edge of the nearest positioned box, over the line that edge draws. Every value but inline clips the label and grows the bar out of its edge',
      ],
      [
        'decorative',
        'boolean',
        'false',
        'all three',
        'Takes the indicator out of the accessibility tree — no role, no range, no name — for a spinner beside text that already says what is happening',
      ],
      [
        'loading',
        'boolean',
        'true',
        'all three',
        'Whether the wait is still on. false withdraws the indicator, honouring minDuration',
      ],
      [
        'delay',
        'number',
        '0',
        'all three',
        'Milliseconds the wait must last before anything is painted. Until then the host carries hidden — no box, no role, no reserved band',
      ],
      [
        'minDuration',
        'number',
        '0',
        'all three',
        'Milliseconds an indicator that did appear is held before it is withdrawn',
      ],
    ]),
    events: [
      {
        name: 'withdraw',
        payload: 'void',
        when: 'The indicator actually leaves the page — later than loading turning false whenever minDuration is still holding it. It is the moment an application unmounts the card the indicator was in.',
      },
    ] satisfies EventRow[],
    composition: apiRows([
      [
        'the host element',
        'any element',
        '—',
        'all three',
        'The selector is a bare attribute, so the element stays yours: a bar is the row that already holds it, and a ring is the menu item it sits in',
      ],
      [
        'exportAs',
        'slProgressBar | slProgressCircle | slLoader',
        '—',
        'all three',
        'Reaches the instance from a template, for the painted signal and the resolved size and tone',
      ],
      [
        'provideProgressIndicatorDefaults',
        'ProgressIndicatorDefaults',
        '—',
        'Application',
        'Sets size, tone, delay, minDuration, locale and label once through PROGRESS_INDICATOR_DEFAULTS_TOKEN; an input on an indicator still wins',
      ],
      [
        'ng-content',
        'projected content',
        '—',
        'slLoader',
        'Content after the label, so a loader can stand inside a sentence you wrote rather than only beside a string it was given',
      ],
      [
        'aria-busy, aria-describedby',
        'boolean, string',
        '—',
        'Your own region',
        'ARIA asks a consumer to write both on the region that is loading, pointing at the indicator’s id. The family cannot: the region is yours',
      ],
      [
        'slInlineMessage',
        'a p beside the indicator',
        '—',
        'Beside the indicator',
        'The words that carry the wait. role="progressbar" prunes its own subtree, so a message inside an indicator is never heard — it belongs next to one',
      ],
    ]),
    accessibility: [
      'The host carries role="progressbar" with aria-valuemin and aria-valuemax written out, and aria-valuenow only while there is a value. ARIA 1.3 asks an author to omit aria-valuenow when the value is indeterminate, and the omission is what says “in progress, and nobody knows how far”.',
      'A value outside the range is clamped, and the clamped value is what both the paint and aria-valuenow report — so the picture a reader sees and the number a reader hears cannot disagree. Progress is usually computed from numbers an application does not fully control.',
      'progressbar carries Children Presentational: True in ARIA 1.3, which means everything inside the host is pruned from the accessibility tree. The label reaches a reader through aria-labelledby and the number through aria-valuetext; anything else you project is silent. A live region inside an indicator is silent too, which is why the words that carry a wait belong to slInlineMessage beside it rather than to a hidden region within it.',
      'An accessible name is required, and there are three ways to give one: label, an aria-label or aria-labelledby you wrote on your own element — read once through HostAttributeToken and never overwritten — or decorative for the case the feature guide names. With none of the three, development warns and the indicator still renders: a nameless bar reports visually, and taking a screen down mid-upload is worse than the defect.',
      'If the indicator describes the loading of a region, ARIA asks you to set aria-busy on that region and point aria-describedby at the indicator. The family writes neither, because the region is yours; the accessibility demonstration shows both.',
      'Under prefers-reduced-motion every loop stops rather than shortening — an animation that repeats forever needs to stop, and the indeterminate indicator rests at a length that reads as a fraction rather than as nought or as full. The cost is real: a still indicator says nothing on its own, so the name matters more, and the loader is best given a visible label.',
      'The indicator is a tone’s text role, which the theme holds to the 4.5:1 reading ratio against every surface — more than the 3:1 WCAG 2.2 1.4.11 asks of a meaningful graphic — in all three colour schemes. Under forced colours the track keeps a ButtonBorder edge and the indicator takes Highlight, so the geometry survives a palette the family did not choose.',
    ],
    snippets: [
      defineSnippet({
        id: 'progress-indicator-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  aria-labelledby="slotted-progress-1"\n  aria-valuemax="100"\n  aria-valuemin="0"\n  aria-valuenow="40"\n  aria-valuetext="40%"\n  data-part="root"\n  data-shape="linear"\n  data-size="md"\n  data-tone="accent"\n  data-ui="progress-indicator"\n  role="progressbar"\n  style="--slotted-progress-indicator-percent: 40"\n>\n  <span data-part="label" id="slotted-progress-1">Uploading invoices</span>\n  <span data-part="value">40%</span>\n  <div data-part="track"><div data-part="indicator"></div></div>\n</div>',
      }),
      defineSnippet({
        id: 'progress-indicator-angular-defaults',
        language: 'ts',
        label: 'One decision for a whole application',
        source:
          // language: pt-BR
          "bootstrapApplication(App, {\n  providers: [\n    provideProgressIndicatorDefaults({\n      delay: 200,\n      label: 'A carregar…',\n      locale: 'pt-BR',\n      minDuration: 400,\n      size: 'lg',\n    }),\n  ],\n});",
        // language: en-US
      }),
      defineSnippet({
        id: 'progress-indicator-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='progress-indicator'] {\n  --slotted-progress-indicator-thickness: var(--slotted-space-4);\n  --slotted-progress-indicator-radius: var(--slotted-radius-xs);\n  --slotted-progress-indicator-track-color: var(--slotted-surface-sunken);\n}\n\n/* One ring in an icon slot, at the size that slot already has. */\n[data-ui='button'] [data-ui='progress-indicator'] {\n  --slotted-progress-indicator-size: var(--slotted-control-icon-size-md);\n}",
      }),
    ],
  },
} as const;
