import { defineSnippet } from '@slotted/storybook-workbench';
import type { AnatomyRow, ApiRow, EventRow } from '@slotted/storybook-workbench';
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

export const REACT_SPLITTER_TOKENS = splitterTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Splitter decision',
}));

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div[role=separator][tabindex=0]',
    required: true,
    purpose:
      'The bar. The target, the tab stop, and the whole family: it carries the value, the limits, the ARIA triple and the keyboard.',
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
    name: 'onValueChange',
    payload: '(value: number, request: SplitterValueRequest)',
    when: 'Before the position moves, on every step of a drag and on every key press. Call request.cancel() to refuse it; request.reason is pointer, keyboard or programmatic.',
  },
  {
    name: 'onCollapsedChange',
    payload: '(collapsed: boolean, request: SplitterCollapsedRequest)',
    when: 'Before Enter collapses the region or brings it back. Refusing it leaves both the state and the measure where they were.',
  },
  {
    name: 'onResizeEnd',
    payload: '(value: number)',
    when: 'Once, when a drag settles. onValueChange fires throughout one, so a consumer saving a layout saves here rather than sixty times there.',
  },
];

export const REACT_SPLITTER_DOCS = {
  splitter: {
    accessibility: [
      'The bar has no default accessible name: the family cannot know which region it sizes. Name it with aria-labelledby pointing at the heading of the element `for` names, or with aria-label.',
      'The bar is role="separator" with tabindex="0", which is the focusable widget form the role takes in the WAI-ARIA Window Splitter pattern; aria-valuenow, aria-valuemin and aria-valuemax are the fraction times a hundred, and the value reported is the clamped one, so the announcement and the layout cannot disagree.',
      'aria-orientation is written only for the vertical bar, because horizontal is the attribute’s own default on role="separator" and a family writes the departure from an element’s semantics rather than the agreement with it.',
      'aria-controls names the element `for` hands the bar — the same element that carries --slotted-splitter-value and the same one the bar sizes, so what a reader hears and what a reader sees are one region rather than two that can drift; the family writes that element an id when it has none.',
      'A disabled bar keeps its tab stop and its announcement. A reader who cannot move a separator can still read the value it holds, and taking the stop away would take the value with it.',
      'Both lines and the grip are aria-hidden: they are the bar’s own picture, and the bar around them is already named and already valued.',
    ],
    anatomy,
    api: apiRows([
      [
        'orientation',
        "'vertical' | 'horizontal'",
        'vertical',
        'Splitter',
        'Which way the bar’s own line runs. A vertical line divides two regions side by side',
      ],
      [
        'for',
        'RefObject<HTMLElement | null>',
        'the previous element sibling',
        'Splitter',
        'The element the bar sizes, announces, and writes the fraction on',
      ],
      [
        'value',
        'number',
        '—',
        'Splitter',
        'The fraction of the container taken by the region before the bar, in [0, 1]',
      ],
      [
        'defaultValue',
        'number',
        '0.5',
        'Splitter',
        'Where an uncontrolled bar starts, and where a double click and reset() return it, brought inside min and max',
      ],
      [
        'min',
        'number | string',
        '0',
        'Splitter',
        'A fraction, or any CSS length resolved against the container — "200px", "18rem", "25%"',
      ],
      ['max', 'number | string', '1', 'Splitter', 'The ceiling, in either unit'],
      [
        'snapPoints',
        'readonly number[]',
        '',
        'Splitter',
        'Stops a released drag lands on and an arrow steps between. Empty is a continuous range',
      ],
      [
        'collapsible',
        'boolean',
        'false',
        'Splitter',
        'Whether Enter collapses the region before the bar',
      ],
      ['collapsedValue', 'number', '0', 'Splitter', 'Where a collapse lands'],
      [
        'collapsed',
        'boolean',
        '—',
        'Splitter',
        'Whether the region is collapsed, when the consumer owns it',
      ],
      ['defaultCollapsed', 'boolean', 'false', 'Splitter', 'Where an uncontrolled collapse starts'],
      [
        'disabled',
        'boolean',
        'false',
        'Splitter',
        'Stops the bar moving. It keeps the tab stop, so the value stays readable',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Splitter',
        'Renders a different root element, keeping the picture',
      ],
    ]),
    composition: apiRows([
      [
        'SplitterDefaultsProvider',
        'orientation | min | max | collapsedValue',
        '—',
        'Provider',
        'An application states its floor once rather than on every bar in it',
      ],
      [
        'ref',
        'RefObject<SplitterHandle>',
        '—',
        'Splitter',
        'collapse(), expand(), reset(), focus() and the bar itself',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Splitter',
        'Substitutes the element; the two lines and the grip travel with it, so the element must accept children',
      ],
      [
        'onKeyDown, onPointerDown, onDoubleClick',
        '(event) => void',
        '—',
        'Splitter',
        'Composed, never replaced: the consumer’s handler runs first, and preventDefault() refuses the family’s',
      ],
      [
        '--slotted-splitter-value',
        'number',
        '—',
        'the element `for` names',
        'The fraction, published where CSS can read it, so the common case needs no state at all',
      ],
    ]),
    events,
    imports: {
      source: "import { Splitter, SplitterDefaultsProvider } from '@slotted/react/splitter';",
    },
    scenes: [
      {
        id: 'playground',
        title: 'A workspace with a movable boundary',
        note: 'Drag the bar, or Tab to it and use the arrows. The number announced and the measure applied are the same number, and the region beside it takes whatever is left.',
        snippet: defineSnippet({
          id: 'splitter-react-playground',
          language: 'tsx',
          label: 'The whole of the common case',
          source:
            '<div className="workspace">\n  <aside>…</aside>\n  <Splitter defaultValue={0.34} />\n  <main>…</main>\n</div>;',
        }),
      },
      {
        id: 'orientation',
        title: 'Both axes, and the arrows each one answers',
        note: 'A vertical bar divides two regions side by side and answers Left and Right; a horizontal bar divides two stacked regions and answers Up and Down. The other pair is left to the page, so a document that scrolls still scrolls.',
        snippet: defineSnippet({
          id: 'splitter-react-orientation',
          language: 'tsx',
          label: 'The axis the bar runs on',
          source: '<Splitter orientation="vertical" />;\n<Splitter orientation="horizontal" />;',
        }),
      },
      {
        id: 'value',
        title: 'Controlled, and the fraction published to CSS',
        note: 'The left pair is uncontrolled and writes --slotted-splitter-value on the region; the right pair is controlled and the number is in React state. Both regions are sized by one CSS rule, never by a style attribute.',
        snippet: defineSnippet({
          id: 'splitter-react-value',
          language: 'tsx',
          label: 'The measure, without holding it',
          source:
            '/* aside { inline-size: calc(var(--slotted-splitter-value, 0.34) * 100%) } */\n<Splitter defaultValue={0.34} />;\n\n<Splitter onValueChange={setValue} value={value} />;',
        }),
      },
      {
        id: 'limits',
        title: 'A floor in pixels beside a ceiling in per cent',
        note: 'Drag both bars to their ends. The first stops at two hundred pixels however narrow the window gets; the second stops at sixty per cent of it. Not one of the seven surveyed implementations can state the first — Zag says outright that it takes percentages only.',
        snippet: defineSnippet({
          id: 'splitter-react-limits',
          language: 'tsx',
          label: 'Either unit, on either limit',
          source: '<Splitter max={0.6} min="200px" />;',
        }),
      },
      {
        id: 'collapse',
        title: 'Enter collapses the region, and Enter brings it back',
        note: 'The pattern’s own key. Collapsing stores the fraction the region had and expanding returns it, so a restored region comes back where it was rather than at some small size indistinguishable from a collapse.',
        snippet: defineSnippet({
          id: 'splitter-react-collapse',
          language: 'tsx',
          label: 'Collapse, with somewhere to collapse to',
          source: '<Splitter collapsedValue={0.06} collapsible defaultValue={0.34} />;',
        }),
      },
      {
        id: 'snapPoints',
        title: 'Three stops a released drag lands on',
        note: 'Drag past a stop and let go: the bar takes the nearest one. It snaps on release and never during the drag, because a bar that snapped on every move would fight the hand rather than help it. The arrows step between the same stops.',
        snippet: defineSnippet({
          id: 'splitter-react-snap',
          language: 'tsx',
          label: 'Stops, and the keyboard that steps between them',
          source: '<Splitter snapPoints={[0.2, 0.34, 0.5]} />;',
        }),
      },
      {
        id: 'reset',
        title: 'Double click puts it back at defaultValue',
        note: 'Move the bar anywhere, then double click it: it returns to defaultValue, inside min and max. The pattern assigns double click nothing, and every surveyed implementation that ships a reset puts it there; the same action is on the handle as reset().',
        snippet: defineSnippet({
          id: 'splitter-react-reset',
          language: 'tsx',
          label: 'Where a reset goes back to',
          source: '<Splitter defaultValue={0.34} />; /* double click returns to 0.34 */',
        }),
      },
      {
        id: 'disabled',
        title: 'Frozen, and still readable',
        note: 'The bar keeps its tab stop and its three ARIA values, and the lines drop to the disabled step. Hover and press are held back for it. A reader who cannot move a separator can still be told where it is.',
        snippet: defineSnippet({
          id: 'splitter-react-disabled',
          language: 'tsx',
          label: 'Off, without leaving the tab order',
          source: '<Splitter disabled value={0.34} />;',
        }),
      },
      {
        id: 'keyboard',
        title: 'Every key the pattern lists',
        note: 'Tab to the bar: arrows move sixteen pixels and sixty-four with Shift, Home and End go to the limits, Enter collapses and restores. Watch aria-valuenow in the row beneath as each one lands.',
        snippet: defineSnippet({
          id: 'splitter-react-keyboard',
          language: 'tsx',
          label: 'The keys, and where each one goes',
          source:
            '<Splitter collapsible max={0.75} min={0.15} onValueChange={(value) => setAnnounced(value)} />;',
        }),
      },
      {
        id: 'twoBars',
        title: 'Two bars in series, each clamping alone',
        note: 'The shape the SAP Help Portal uses. The family holds no panels, so the consumer owns the layout and therefore the policy: each bar clamps against its own limits and neither negotiates with the other.',
        snippet: defineSnippet({
          id: 'splitter-react-two-bars',
          language: 'tsx',
          label: 'Three regions, two boundaries',
          source:
            '<div className="workspace">\n  <aside ref={toc}>…</aside>\n  <Splitter for={toc} max={0.4} min="180px" />\n  <main ref={doc}>…</main>\n  <Splitter for={doc} max={0.85} min={0.4} />\n  <aside>…</aside>\n</div>;',
        }),
      },
      {
        id: 'persistence',
        title: 'A layout that survives a reload',
        note: 'Move the bar and press Reload: the position comes back. onResizeEnd fires once when a drag settles, so the write happens once rather than on every frame of it. The family never touches storage — which storage, and whether a layout crosses a login, are the application’s decisions.',
        snippet: defineSnippet({
          id: 'splitter-react-persistence',
          language: 'tsx',
          label: 'Emitted, never written',
          source:
            "<Splitter\n  defaultValue={load() ?? 0.34}\n  onResizeEnd={(value) => localStorage.setItem('workspace', String(value))}\n/>;",
        }),
      },
      {
        id: 'composition',
        title: 'A different element, a ref, and a handler that refuses',
        note: 'The bar is rendered as the consumer’s own element with render, and the two lines and the grip travel with it. The buttons drive the handle; the third bar refuses every keyboard move from its own onKeyDown.',
        snippet: defineSnippet({
          id: 'splitter-react-composition',
          language: 'tsx',
          label: 'The escape hatches',
          source:
            '<Splitter ref={handle} render={(props) => <section {...props} />} />;\n\nhandle.current?.collapse();',
        }),
      },
      {
        id: 'defaults',
        title: 'One floor, stated once for the application',
        note: 'Both bars inside the provider inherit a two-hundred-pixel floor; the second states its own and wins, because an explicit consumer value always does. None of the seven surveyed implementations has an equivalent.',
        snippet: defineSnippet({
          id: 'splitter-react-defaults',
          language: 'tsx',
          label: 'Defaults for every bar in a product',
          source:
            '<SplitterDefaultsProvider min="200px">\n  <Splitter />\n  <Splitter min={0.05} />\n</SplitterDefaultsProvider>;',
        }),
      },
      {
        id: 'accessibility',
        title: 'What a screen reader is told',
        note: 'The bar names the region through aria-controls and takes its name from that region’s own heading, which is the pattern’s rule: a separator is named for the region it sizes. The row beneath prints the four attributes as they stand in the DOM.',
        snippet: defineSnippet({
          id: 'splitter-react-accessibility',
          language: 'tsx',
          label: 'Named for the region it sizes',
          source:
            '<div className="workspace">\n  <aside ref={region}>\n    <h3 id="contas-heading">Contas a receber</h3>\n  </aside>\n  <Splitter aria-labelledby="contas-heading" for={region} />\n  <main>…</main>\n</div>;',
        }),
      },
    ],
    snippets: [
      defineSnippet({
        id: 'splitter-react-import',
        language: 'tsx',
        label: 'The import',
        source: "import { Splitter } from '@slotted/react/splitter';",
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
