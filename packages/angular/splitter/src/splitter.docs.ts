import { defineSnippet } from '@slotted/storybook-workbench';
import type { AnatomyRow, ApiRow, EventRow, ReferenceImport } from '@slotted/storybook-workbench';
import splitterTokens from '@slotted/styles/splitter/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_SPLITTER_TOKENS = splitterTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Splitter decision',
}));

const imports: ReferenceImport = {
  source: "import { SlSplitter, provideSplitterDefaults } from '@slotted/angular/splitter';",
  selector: '[slSplitter]',
  exportAs: 'slSplitter',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element, with role=separator and tabindex=0',
    required: true,
    purpose:
      'The bar. A directive rather than a tag of its own, because the boundary sits inside a layout the consumer wrote and the element it should be is theirs to choose.',
  },
  {
    part: 'line',
    element: 'span',
    required: true,
    purpose:
      'A hairline each side of the grip, fading out away from it. Runs the whole track under the hand and under a drag.',
  },
  {
    part: 'grip',
    element: 'span[aria-hidden]',
    required: true,
    purpose:
      'The mark in the middle, so a resizable boundary is one a reader can see before touching it. Hidden from the accessibility tree: the bar around it is already named and already valued.',
  },
];

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'number',
    when: 'After the position moves. The two-way form of the model, for a template that binds [(value)].',
  },
  {
    name: 'valueChangeRequest',
    payload: 'SplitterValueRequest',
    when: 'Before the position moves, on every step of a drag and on every key press. Call cancel() on it to refuse; reason is pointer, keyboard or programmatic.',
  },
  {
    name: 'collapsedChangeRequest',
    payload: 'SplitterCollapsedRequest',
    when: 'Before Enter collapses the region or brings it back. Refusing it leaves both the state and the measure where they were.',
  },
  {
    name: 'resizeEnd',
    payload: 'number',
    when: 'Once, when a drag settles. The value moves throughout one, so a consumer saving a layout saves here rather than sixty times there.',
  },
];

export const ANGULAR_SPLITTER_DOCS = {
  splitter: {
    accessibility: [
      'The bar has no default accessible name: the family cannot know which region it sizes. Name it with aria-labelledby pointing at the heading of the element `for` names, or with aria-label.',
      'The bar is role="separator" with tabindex="0", which is the focusable widget form the role takes in the WAI-ARIA Window Splitter pattern; aria-valuenow, aria-valuemin and aria-valuemax are the fraction times a hundred, and the value reported is the clamped one, so the announcement and the layout cannot disagree.',
      'aria-orientation is written only for the vertical bar, because horizontal is the attribute’s own default on role="separator" and a family writes the departure from an element’s semantics rather than the agreement with it.',
      'aria-controls names the element [for] hands the bar — the same element that carries --slotted-splitter-value and the same one the bar sizes, so what a reader hears and what a reader sees are one region rather than two that can drift; the family writes that element an id when it has none.',
      'A role, a tabindex or an aria-controls the consumer wrote on the element is read with HostAttributeToken before the host bindings run, and kept: a binding that resolves to null removes an attribute rather than leaving the author’s value in place.',
      'A disabled bar keeps its tab stop and its announcement. A reader who cannot move a separator can still read the value it holds.',
    ],
    anatomy,
    api: apiRows([
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'slSplitter',
        'Which way the bar’s own line runs. A vertical line divides two regions side by side',
      ],
      [
        'for',
        'HTMLElement',
        'the previous element sibling',
        'slSplitter',
        'The element the bar sizes, announces and writes the fraction on, as a template reference',
      ],
      [
        'value',
        'model<number>',
        '0.5',
        'slSplitter',
        'The fraction of the container taken by the region before the bar, in [0, 1]',
      ],
      [
        'min',
        'number | string',
        '0',
        'slSplitter',
        'A fraction, or any CSS length resolved against the container — "200px", "18rem", "25%"',
      ],
      ['max', 'number | string', '1', 'slSplitter', 'The ceiling, in either unit'],
      [
        'defaultValue',
        'number',
        '0.5',
        'slSplitter',
        'Where reset() and a double click return the bar, brought inside min and max. An input of its own and not the model’s first value: the value bound on arrival is where the reader left the bar, restored from storage, and never where a reset should go',
      ],
      [
        'snapPoints',
        'readonly number[]',
        '',
        'slSplitter',
        'Stops a released drag lands on and an arrow steps between. Empty is a continuous range',
      ],
      [
        'collapsible',
        'boolean',
        'false',
        'slSplitter',
        'Whether Enter collapses the region before the bar',
      ],
      ['collapsedValue', 'number', '0', 'slSplitter', 'Where a collapse lands'],
      ['collapsed', 'model<boolean>', 'false', 'slSplitter', 'Whether the region is collapsed'],
      [
        'disabled',
        'boolean',
        'false',
        'slSplitter',
        'Stops the bar moving. It keeps the tab stop, so the value stays readable',
      ],
    ]),
    composition: apiRows([
      [
        'provideSplitterDefaults',
        '{ orientation, min, max, collapsedValue }',
        '—',
        'Providers',
        'An application states its floor once rather than on every bar in it',
      ],
      [
        'exportAs',
        "'slSplitter'",
        '—',
        'slSplitter',
        'collapse(), expand(), reset() and focus(), reachable from the template',
      ],
      [
        'the host element',
        'any element',
        '—',
        'slSplitter',
        'A directive, so the bar is whatever element the consumer’s layout wanted there',
      ],
      [
        '--slotted-splitter-value',
        'number',
        '—',
        'the element [for] names',
        'The fraction, published where CSS can read it, so the common case needs no component state at all',
      ],
    ]),
    events,
    imports,
    scenes: [
      {
        id: 'playground',
        title: 'A workspace with a movable boundary',
        note: 'Drag the bar, or Tab to it and use the arrows. The number announced and the measure applied are the same number, and the region beside it takes whatever is left.',
        snippet: defineSnippet({
          id: 'splitter-angular-playground',
          language: 'angular',
          label: 'The whole of the common case',
          source:
            '<div class="workspace">\n  <aside>…</aside>\n  <div slSplitter [(value)]="width"></div>\n  <main>…</main>\n</div>',
        }),
      },
      {
        id: 'orientation',
        title: 'Both axes, and the arrows each one answers',
        note: 'A vertical bar divides two regions side by side and answers Left and Right; a horizontal bar divides two stacked regions and answers Up and Down. The other pair is left to the page, so a document that scrolls still scrolls.',
        snippet: defineSnippet({
          id: 'splitter-angular-orientation',
          language: 'angular',
          label: 'The axis the bar runs on',
          source:
            '<div slSplitter orientation="vertical"></div>\n<div slSplitter orientation="horizontal"></div>',
        }),
      },
      {
        id: 'value',
        title: 'Two-way, and the fraction published to CSS',
        note: 'The left pair holds no value at all and is driven by the custom property; the right pair binds [(value)] and prints the number beside it. Both regions are sized by one CSS rule, never by a style attribute.',
        snippet: defineSnippet({
          id: 'splitter-angular-value',
          language: 'angular',
          label: 'The measure, without holding it',
          source:
            '<!-- aside { inline-size: calc(var(--slotted-splitter-value, 0.34) * 100%) } -->\n<div slSplitter></div>\n\n<div slSplitter [(value)]="width"></div>',
        }),
      },
      {
        id: 'limits',
        title: 'A floor in pixels beside a ceiling in per cent',
        note: 'Drag both bars to their ends. The first stops at two hundred pixels however narrow the window gets; the second stops at sixty per cent of it. Not one of the seven surveyed implementations can state the first — Zag says outright that it takes percentages only.',
        snippet: defineSnippet({
          id: 'splitter-angular-limits',
          language: 'angular',
          label: 'Either unit, on either limit',
          source: '<div slSplitter min="200px" [max]="0.6"></div>',
        }),
      },
      {
        id: 'collapse',
        title: 'Enter collapses the region, and Enter brings it back',
        note: 'The pattern’s own key. Collapsing stores the fraction the region had and expanding returns it, so a restored region comes back where it was rather than at some small size indistinguishable from a collapse.',
        snippet: defineSnippet({
          id: 'splitter-angular-collapse',
          language: 'angular',
          label: 'Collapse, with somewhere to collapse to',
          source: '<div slSplitter collapsible [collapsedValue]="0.06" [(value)]="width"></div>',
        }),
      },
      {
        id: 'snapPoints',
        title: 'Three stops a released drag lands on',
        note: 'Drag past a stop and let go: the bar takes the nearest one. It snaps on release and never during the drag, because a bar that snapped on every move would fight the hand rather than help it. The arrows step between the same stops.',
        snippet: defineSnippet({
          id: 'splitter-angular-snap',
          language: 'angular',
          label: 'Stops, and the keyboard that steps between them',
          source: '<div slSplitter [snapPoints]="[0.2, 0.34, 0.5]"></div>',
        }),
      },
      {
        id: 'reset',
        title: 'Double click puts it back at defaultValue',
        note: 'Move the bar anywhere, then double click it: it returns to defaultValue, inside min and max. The pattern assigns double click nothing, and every surveyed implementation that ships a reset puts it there; the same action is on the instance as reset().',
        snippet: defineSnippet({
          id: 'splitter-angular-reset',
          language: 'angular',
          label: 'Where a reset goes back to',
          source:
            '<div slSplitter #bar="slSplitter" [defaultValue]="0.34" [(value)]="width"></div>\n<button (click)="bar.reset()">Repor</button>',
        }),
      },
      {
        id: 'disabled',
        title: 'Frozen, and still readable',
        note: 'The bar keeps its tab stop and its three ARIA values, and the lines drop to the disabled step. Hover and press are held back for it. A reader who cannot move a separator can still be told where it is.',
        snippet: defineSnippet({
          id: 'splitter-angular-disabled',
          language: 'angular',
          label: 'Off, without leaving the tab order',
          source: '<div slSplitter disabled [value]="0.34"></div>',
        }),
      },
      {
        id: 'keyboard',
        title: 'Every key the pattern lists',
        note: 'Tab to the bar: arrows move sixteen pixels and sixty-four with Shift, Home and End go to the limits, Enter collapses and restores. Watch aria-valuenow in the row beneath as each one lands.',
        snippet: defineSnippet({
          id: 'splitter-angular-keyboard',
          language: 'angular',
          label: 'The keys, and where each one goes',
          source: '<div slSplitter collapsible [min]="0.15" [max]="0.75" [(value)]="width"></div>',
        }),
      },
      {
        id: 'twoBars',
        title: 'Two bars in series, each clamping alone',
        note: 'The shape the SAP Help Portal uses. The family holds no panels, so the consumer owns the layout and therefore the policy: each bar clamps against its own limits and neither negotiates with the other.',
        snippet: defineSnippet({
          id: 'splitter-angular-two-bars',
          language: 'angular',
          label: 'Three regions, two boundaries',
          source:
            '<div class="workspace">\n  <aside #toc>…</aside>\n  <div slSplitter [for]="toc" min="180px" [max]="0.4"></div>\n  <main #doc>…</main>\n  <div slSplitter [for]="doc" [min]="0.4" [max]="0.85"></div>\n  <aside>…</aside>\n</div>',
        }),
      },
      {
        id: 'persistence',
        title: 'A layout that survives a reload',
        note: 'Drag the bar: the moving number changes every frame and the saved one changes once, on release. The family never touches storage — which storage, and whether a layout crosses a login, are the application’s decisions.',
        snippet: defineSnippet({
          id: 'splitter-angular-persistence',
          language: 'angular',
          label: 'Emitted, never written',
          source: '<div slSplitter [(value)]="width" (resizeEnd)="save($event)"></div>',
        }),
      },
      {
        id: 'composition',
        title: 'The instance a template reaches, and a host the consumer chose',
        note: 'The bar is a directive, so it is written on whatever element the layout wanted there. The buttons drive the instance through exportAs; the second bar refuses every keyboard move from its own handler.',
        snippet: defineSnippet({
          id: 'splitter-angular-composition',
          language: 'angular',
          label: 'The escape hatches',
          source:
            '<section slSplitter #bar="slSplitter" collapsible></section>\n<button (click)="bar.collapse()">collapse()</button>',
        }),
      },
      {
        id: 'defaults',
        title: 'One floor, stated once for the application',
        note: 'Both bars inherit a two-hundred-pixel floor from the provider; the second states its own and wins, because an explicit consumer value always does. None of the seven surveyed implementations has an equivalent.',
        snippet: defineSnippet({
          id: 'splitter-angular-defaults',
          language: 'ts',
          label: 'Defaults for every bar in a product',
          source:
            "bootstrapApplication(App, {\n  providers: [provideSplitterDefaults({ min: '200px' })],\n});",
        }),
      },
      {
        id: 'accessibility',
        title: 'What a screen reader is told',
        note: 'The bar names the region through aria-controls and takes its name from that region’s own heading, which is the pattern’s rule: a separator is named for the region it sizes. The row beneath prints the four attributes as they stand in the DOM.',
        snippet: defineSnippet({
          id: 'splitter-angular-accessibility',
          language: 'angular',
          label: 'Named for the region it sizes',
          source:
            '<aside #region>\n  <h3 id="contas-heading">Contas a receber</h3>\n</aside>\n<div slSplitter [for]="region" aria-labelledby="contas-heading"></div>',
        }),
      },
    ],
    snippets: [
      defineSnippet({
        id: 'splitter-angular-import',
        language: 'ts',
        label: 'The import',
        source: "import { SlSplitter } from '@slotted/angular/splitter';",
      }),
      defineSnippet({
        id: 'splitter-css',
        language: 'css',
        label: 'The one rule a consumer writes',
        source:
          '.workspace {\n  display: flex;\n}\n\n.workspace > aside {\n  flex: none;\n  inline-size: calc(var(--slotted-splitter-value, 0.34) * 100%);\n}\n\n.workspace > main {\n  flex: 1;\n  min-inline-size: 0;\n}',
      }),
      defineSnippet({
        id: 'splitter-theming',
        language: 'css',
        label: 'Retuning the family in an application',
        source:
          "[data-ui='splitter'] {\n  --slotted-splitter-line-color: var(--slotted-border-strong);\n  --slotted-splitter-line-active-color: var(--slotted-text);\n}",
      }),
    ],
  },
} as const;
