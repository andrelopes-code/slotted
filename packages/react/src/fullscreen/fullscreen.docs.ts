import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import fullscreenTokens from '@slotted/styles/fullscreen/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_FULLSCREEN_TOKENS = fullscreenTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Fullscreen decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Fullscreen, FullscreenContent, FullscreenTrigger, FullscreenDefaultsProvider, useFullscreen } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The region that goes full screen. At rest it paints nothing — it is the container the consumer already had. In full screen it carries data-fullscreen and data-mode (native or layout), takes the page ground and the inset, and scrolls by itself.',
  },
  {
    part: 'trigger',
    element: 'button, or the element render returns',
    required: false,
    purpose:
      'The control. It carries data-ui="fullscreen" of its own, so it is styled wherever it stands — inside the region, or in a toolbar outside it with target. Its words and its mark say what the press does next.',
  },
  {
    part: 'content',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'A direct child of the region that takes, in full screen, the height the other children leave; its first child fills it. Without it, a region with one child gives that child the height, and a lone img, video or canvas fills it with object-fit: contain.',
  },
  {
    part: 'icon',
    element: 'span',
    required: true,
    purpose:
      'The mark, hidden from the reading order. Empty, it draws the four corners opening (maximize) or closing (minimize) from the glyph tokens; a consumer icon placed in it replaces the mark.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The words — “Full screen” or “Exit full screen” from the catalog of the language in force, or the consumer’s. With iconOnly they are visually hidden and stay the accessible name.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A revenue panel with its control in the header. Press it: the panel takes the screen through the browser, the words become “Exit full screen” and the mark turns inward. Escape, or the control again, gives the page back with the scroll where it was.',
    snippet: defineSnippet({
      id: 'fullscreen-react-playground',
      language: 'tsx',
      label: 'A panel the reader can give the whole screen',
      source: `<Fullscreen>
  <FullscreenContent>
    <Chart actions={<FullscreenTrigger iconOnly />} title="Revenue by month" {...revenue} />
  </FullscreenContent>
</Fullscreen>;`,
    }),
  },
  {
    id: 'layout',
    title: 'Inside the page, where the browser will not',
    note: 'mode="layout" never asks the browser: the region is fixed over the page, the page behind stops scrolling, and Escape leaves. It is the picture an iframe without allow="fullscreen" or a phone browser gets under the default mode too.',
    snippet: defineSnippet({
      id: 'fullscreen-react-layout',
      language: 'tsx',
      label: 'Expanding in the layout',
      source: `<Fullscreen mode="layout">
  <FullscreenTrigger />
  <ContractTerms />
</Fullscreen>;`,
    }),
  },
  {
    id: 'fill',
    title: 'The height of the screen, not only its width',
    note: 'The browser stretches the region and none of its children. FullscreenContent takes the height a bar and a caption leave, and the chart’s plot grows into it; a region with a single card gives the card the height instead.',
    snippet: defineSnippet({
      id: 'fullscreen-react-fill',
      language: 'tsx',
      label: 'A bar, the content part and a caption',
      source: `<Fullscreen>
  <Toolbar>
    <FullscreenTrigger />
  </Toolbar>
  <FullscreenContent>
    <Chart title="Revenue by month" {...revenue} />
  </FullscreenContent>
  <Text>Source: accounting close.</Text>
</Fullscreen>;`,
    }),
  },
  {
    id: 'controlled',
    title: 'The page holds the state',
    note: 'The page owns fullscreen and every change arrives as a request with its reason: pointer or keyboard from the control, escape when the reader left on their own. The log under the panel prints each one.',
    snippet: defineSnippet({
      id: 'fullscreen-react-controlled',
      language: 'tsx',
      label: 'The controlled pair',
      source: `const [presenting, setPresenting] = useState(false);

<Fullscreen
  fullscreen={presenting}
  onFullscreenChange={(next, request) => {
    log(request.reason);
    setPresenting(next);
  }}
>
  <FullscreenTrigger />
</Fullscreen>;`,
    }),
  },
  {
    id: 'error',
    title: 'Refused, and still full screen',
    note: 'When the browser has no API or refuses, the region enters the layout and onFullscreenError says why — unsupported or refused. The panel prints the last error. A page that prefers nothing sets the state back to false from the same handler.',
    snippet: defineSnippet({
      id: 'fullscreen-react-error',
      language: 'tsx',
      label: 'Reading the refusal',
      source: `<Fullscreen onFullscreenError={(error) => setNotice(error.kind)}>
  <FullscreenTrigger />
</Fullscreen>;`,
    }),
  },
  {
    id: 'overlays',
    title: 'A menu opened from inside',
    note: 'The select in the panel opens its list inside the region while it is full screen: the portal root follows the element the browser shows. Escape in the layout closes the list first and the region on the second press.',
    snippet: defineSnippet({
      id: 'fullscreen-react-overlays',
      language: 'tsx',
      label: 'An overlay in a region in full screen',
      source: `<Fullscreen>
  <Select defaultValue="6m">
    <SelectTrigger aria-label="Period">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="3m">Last 3 months</SelectItem>
      <SelectItem value="6m">Last 6 months</SelectItem>
    </SelectContent>
  </Select>
  <FullscreenTrigger />
</Fullscreen>;`,
    }),
  },
  {
    id: 'document',
    title: 'The whole document',
    note: 'useFullscreen takes any element — here document.documentElement — and hands its handle to a control that is not inside any region. Presentation mode for the whole application is this line and nothing else.',
    snippet: defineSnippet({
      id: 'fullscreen-react-document',
      language: 'tsx',
      label: 'The document as the region',
      source: `const page = useFullscreen(document.documentElement);

<FullscreenTrigger target={page} variant="outline" />;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab reaches the control, Space or Enter presses it and the reason says keyboard. While full screen, Tab wraps inside the region. Escape in native full screen belongs to the browser — the family writes no listener and reports the leave as escape.',
    snippet: defineSnippet({
      id: 'fullscreen-react-keyboard',
      language: 'tsx',
      label: 'Reading the reason',
      source: `<Fullscreen onFullscreenChange={(next, request) => log(request.reason)}>
  <FullscreenTrigger />
</Fullscreen>;`,
    }),
  },
  {
    id: 'trigger',
    title: 'The control: two variants, three steps, every state',
    note: 'ghost stands in a bar that is already framed, outline over content and carries its own ground. Each step reads the control scale, so the control lines up with a button of the same step. Disabled keeps the words legible and refuses the press.',
    snippet: defineSnippet({
      id: 'fullscreen-react-trigger',
      language: 'tsx',
      label: 'The framed step beside a button',
      source: `<FullscreenTrigger size="sm" variant="outline" />;`,
    }),
  },
  {
    id: 'iconOnly',
    title: 'The mark alone',
    note: 'iconOnly draws the control square from its height and keeps the words, visually hidden, as its name — so it still says “Exit full screen” to a screen reader when the mark turns inward.',
    snippet: defineSnippet({
      id: 'fullscreen-react-icon-only',
      language: 'tsx',
      label: 'A square control',
      source: `<FullscreenTrigger iconOnly />;`,
    }),
  },
  {
    id: 'outside',
    title: 'The control outside the region',
    note: 'A toolbar above a chart holds the control; the chart is the region. useFullscreen gives the handle, target hands it to the control, and the control changes with the chart’s state. Inside the region, a second control takes the reader back.',
    snippet: defineSnippet({
      id: 'fullscreen-react-outside',
      language: 'tsx',
      label: 'A handle and a target',
      source: `const [chart, setChart] = useState<HTMLElement | null>(null);
const handle = useFullscreen(chart);

<>
  <FullscreenTrigger target={handle} />
  <section ref={setChart}>…</section>
</>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Defaults once, words and mark of the consumer',
    note: 'A provider sets the control’s step and variant for a subtree. children and icon take a function of the state, so a “Present” control keeps following it; render puts the wiring on the consumer’s own element.',
    snippet: defineSnippet({
      id: 'fullscreen-react-composition',
      language: 'tsx',
      label: 'A provider and a label that follows the state',
      source: `<FullscreenDefaultsProvider size="sm">
  <Fullscreen>
    <FullscreenTrigger icon={(on) => (on ? <X size={14} /> : <Presentation size={14} />)}>
      {(on) => (on ? 'Terminar' : 'Apresentar')}
    </FullscreenTrigger>
  </Fullscreen>
</FullscreenDefaultsProvider>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onFullscreenChange',
    payload: '(fullscreen: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the state moves. The reason is pointer or keyboard from the control, programmatic from the handle, and escape when the reader left on their own — Escape in the layout, or the browser’s own exit in native, which has already happened by then. cancel() refuses it.',
  },
  {
    name: 'onFullscreenError',
    payload: "({ kind: 'unsupported' | 'refused', cause?: unknown })",
    when: 'When the browser has no API or refuses the request. The region has already entered the layout and the state stays true.',
  },
  {
    name: 'onClick',
    payload: 'the button’s own event',
    when: 'On the control, before the family acts. preventDefault() refuses the press.',
  },
];

export const REACT_FULLSCREEN_DOCS = {
  fullscreen: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'fullscreen',
        'boolean',
        '—',
        'Fullscreen',
        'Present means the consumer owns the state for the life of the component. Absent, the region owns it and starts from defaultFullscreen',
      ],
      [
        'defaultFullscreen',
        'boolean',
        'false',
        'Fullscreen',
        'What an uncontrolled region starts from, read once. True on mount asks the browser outside a gesture, which refuses, so the region starts in the layout',
      ],
      [
        'mode',
        "'auto' | 'layout'",
        'auto',
        'Fullscreen',
        'auto asks the browser and falls back to the layout when it has no API or refuses; layout never asks',
      ],
      [
        'navigationUI',
        "'auto' | 'show' | 'hide'",
        'auto',
        'Fullscreen',
        'Passed to the native request: whether the browser keeps its navigation interface on screen',
      ],
      [
        'messages',
        'Partial<FullscreenMessages>',
        '—',
        'Fullscreen',
        'Words laid over the language in force, key by key: the two labels of the control (enter, exit) and the two announcements (entered, exited). entered says how to leave',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'FullscreenTrigger',
        'The control step, from the control scale',
      ],
      [
        'variant',
        "'ghost' | 'outline'",
        'ghost',
        'FullscreenTrigger',
        'ghost inside a framed bar; outline over content, with its own ground',
      ],
      [
        'iconOnly',
        'boolean',
        'false',
        'FullscreenTrigger',
        'The mark alone in a square; the words stay as the accessible name',
      ],
      [
        'children',
        'ReactNode | (fullscreen: boolean) => ReactNode',
        'the message',
        'FullscreenTrigger',
        'Words in place of the message the state picks',
      ],
      [
        'icon',
        'ReactNode | (fullscreen: boolean) => ReactNode',
        'maximize / minimize',
        'FullscreenTrigger',
        'A mark in place of the family’s',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'FullscreenTrigger',
        'The native attribute; the press is refused',
      ],
      [
        'type',
        "'button' | 'submit' | 'reset'",
        'button',
        'FullscreenTrigger',
        'The native type; a button unless the consumer says otherwise',
      ],
      [
        'target',
        'FullscreenHandle',
        'the nearest Fullscreen',
        'FullscreenTrigger',
        'The handle of a region the control is not inside',
      ],
    ]),
    composition: apiRows([
      [
        'useFullscreen',
        '(target, options) => FullscreenHandle',
        '—',
        'any element',
        'The state and the actions for any element: { fullscreen, mode, supported, error, enter, exit, toggle }',
      ],
      [
        'FullscreenDefaultsProvider',
        '{ mode, navigationUI, size, variant }',
        '—',
        'a subtree',
        'The decisions an application takes once; an instance still wins',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Fullscreen, FullscreenTrigger',
        'Substitutes the element and hands it every attribute and the ref callback the family was going to write',
      ],
      [
        'ref',
        'Ref<HTMLDivElement> / Ref<HTMLButtonElement>',
        '—',
        'Fullscreen, FullscreenTrigger',
        'The native elements',
      ],
      [
        'FullscreenContent',
        "ComponentPropsWithRef<'div'> & { render? }",
        '—',
        'a direct child of Fullscreen',
        'The part that takes the height in full screen; render substitutes its element',
      ],
      [
        'useFullscreenContext',
        '() => FullscreenHandle | null',
        '—',
        'inside Fullscreen',
        'The handle for a consumer control of its own',
      ],
    ]),
    accessibility: [
      'The control is a native button whose label says what the press does next, so it carries no aria-pressed: the APG Button pattern (w3.org/WAI/ARIA/apg/patterns/button/) keeps aria-pressed for a toggle whose label does not change. A screen reader hears “Full screen, button” and then “Exit full screen, button”.',
      'Escape in native full screen belongs to the browser, and the family writes no listener for it; the specification makes it leave before any close watcher. In the layout, Escape asks through the one layer stack, so a list opened inside closes first.',
      'While the region is full screen, Tab wraps inside it: what is outside is not painted, and a focus there would be invisible. On the way out, focus returns to the element that held it when it came from outside, and the page’s and the region’s scroll return to where they were.',
      'Entering is announced politely with how to leave (“Full screen. Press Escape to exit.”), and leaving is announced too; the layout does not make the page inert, because an inert page would silence that announcement. The cost is that a screen reader’s virtual cursor can reach the covered page.',
    ],
    snippets: [
      defineSnippet({
        id: 'fullscreen-react-anatomy',
        language: 'tsx',
        label: 'The anatomy as it reaches the DOM',
        source: `<div data-ui="fullscreen" data-part="root" data-fullscreen data-mode="native">
  <div data-ui="fullscreen" data-part="content">
    …
  </div>
  <button
    data-ui="fullscreen"
    data-part="trigger"
    data-fullscreen
    data-size="md"
    data-variant="ghost"
    type="button"
  >
    <span data-part="icon" aria-hidden="true"></span>
    <span data-part="label">Exit full screen</span>
  </button>
</div>;`,
      }),
      defineSnippet({
        id: 'fullscreen-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='fullscreen'] {
  --slotted-fullscreen-surface: var(--slotted-surface-sunken);
  --slotted-fullscreen-inset: var(--slotted-space-10);
  --slotted-fullscreen-trigger-radius: var(--slotted-radius-full);
}`,
      }),
    ],
  },
} as const;
