import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import drawerTokens from '@slotted/styles/drawer/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_DRAWER_TOKENS = drawerTokens.map((name) => ({
  name,
  purpose: 'A theme-owned decision of the drawer.',
}));

const imports: ReferenceImport = {
  source:
    "import { Drawer, DrawerActions, DrawerBody, DrawerClose, DrawerDefaultsProvider, DrawerDescription, DrawerFooter, DrawerHeader, DrawerPanel, DrawerResizer, DrawerTitle, DrawerTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, in a portal under mode="overlay"',
    required: true,
    purpose:
      'The layer. Under mode="overlay" it is fixed to the viewport and stacked above the page; under mode="inline" it is a box in your own layout, and its own width or height is what opens and closes. It carries data-ui="drawer", every axis as a data attribute, and data-open, data-loading and data-dragging.',
  },
  {
    part: 'trigger',
    element: 'button, or the element render returns',
    required: false,
    purpose:
      'The control that opens and closes the drawer, rendered where it is written. It carries aria-expanded and aria-controls in both modes, and aria-haspopup="dialog" only under mode="overlay", because an inline drawer is a disclosure. A press on it is never read as a press outside the drawer.',
  },
  {
    part: 'backdrop',
    element: 'div',
    required: false,
    purpose:
      'The scrim behind the panel, painted from --slotted-drawer-scrim under mode="overlay" whether the drawer is modal or not, and not painted while the measure is below scrimFrom. It takes a press like the page would, so a press on it is a press outside the drawer. Set --slotted-drawer-scrim: transparent to paint none.',
  },
  {
    part: 'panel',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The surface, aligned to side. Under mode="overlay" it carries role="dialog", and aria-modal="true" while modal; under mode="inline" it has no role, so use render to make it a nav or an aside. Its rows are the header, the body and the footer, and only the body scrolls.',
  },
  {
    part: 'resizer',
    element: 'div with role="separator"',
    required: false,
    purpose:
      'The separator the reader drags, or focuses and moves with the keyboard, to resize the panel. Rendering it is what makes the drawer resizable. It carries role="separator", tabindex="0", aria-orientation, aria-valuenow, aria-valuemin and aria-valuemax as percentages, aria-controls naming the panel and aria-labelledby naming the title. On start and end it sits on the panel’s inner edge; on top and bottom it is the grip above the header.',
  },
  {
    part: 'line',
    element: 'span',
    required: true,
    purpose:
      'A hairline on each side of the grip on start and end, which runs the whole edge under the pointer, under focus and during a drag. It is not drawn on top and bottom.',
  },
  {
    part: 'grip',
    element: 'span[aria-hidden]',
    required: true,
    purpose:
      'The mark the pointer aims at: a dot grid on start and end, and a pill above the header on top and bottom. It is hidden from assistive technology, because the separator around it is already named and valued.',
  },
  {
    part: 'header',
    element: 'header, or the element render returns',
    required: false,
    purpose:
      'Lays out the title and the description in one column, the actions in a second when they are rendered, and the close button in the last, so a title that wraps grows the row instead of moving the buttons.',
  },
  {
    part: 'actions',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'One or two actions beside the title, such as icon buttons for history and a new conversation, on the title’s row between the title and the close button. The buttons keep the size you give them.',
  },
  {
    part: 'title',
    element: 'h2, or the element render returns',
    required: false,
    purpose:
      'The visible name of the drawer. The panel and the separator point at it with aria-labelledby, and only while it is rendered.',
  },
  {
    part: 'description',
    element: 'p, or the element render returns',
    required: false,
    purpose:
      'The sentence under the title. The panel points at it with aria-describedby while it is rendered.',
  },
  {
    part: 'body',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The row that scrolls, and the row that carries aria-busy while loading is set. A wheel that reaches its end does not scroll the page behind. inset="none" removes its padding, for content that brings its own, such as a list that runs to the panel’s edges.',
  },
  {
    part: 'footer',
    element: 'footer, or the element render returns',
    required: false,
    purpose:
      'The actions, in a wrapping row aligned to the end, on a sunken surface with a rule above it.',
  },
  {
    part: 'close',
    element: 'button',
    required: false,
    purpose:
      'The ✕ button. Its target is at least --slotted-target-min in both directions. It closes the drawer with the reason dismiss, and its value is the result of that close.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A drawer opened inside the scene rather than over the page. Press the trigger, then Tab: focus is contained, Escape closes, and focus returns to the button it came from.',
    snippet: defineSnippet({
      id: 'drawer-react-playground',
      language: 'tsx',
      label: 'A trigger, a panel and the actions',
      source: `<Drawer>
  <DrawerTrigger>Open details</DrawerTrigger>
  <DrawerPanel>
    <DrawerHeader>
      <DrawerTitle>Invoice 4471</DrawerTitle>
      <DrawerDescription>Issued on August 12.</DrawerDescription>
      <DrawerClose />
    </DrawerHeader>
    <DrawerBody>
      <TextField label="Note" />
    </DrawerBody>
    <DrawerFooter>
      <Button variant="ghost" tone="secondary">
        Cancel
      </Button>
      <Button>Save</Button>
    </DrawerFooter>
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'mode',
    title: 'A layer over the page, or a panel beside it',
    note: 'One axis rather than two components, because an application binds it to its own breakpoint: swapping one element for another there would take the panel’s scroll position, its focus and every uncontrolled field with it.',
    snippet: defineSnippet({
      id: 'drawer-react-mode',
      language: 'tsx',
      label: 'The two lines that make it responsive',
      source: `const wide = useMediaQuery('(min-width: 60rem)');

<div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)' }}>
  <Drawer mode={wide ? 'inline' : 'overlay'} open={open} side="start">
    <DrawerPanel render={(props) => <nav {...props} aria-label="Sections" />}>…</DrawerPanel>
  </Drawer>
  <main>…</main>
</div>;`,
    }),
  },
  {
    id: 'side',
    title: 'Which edge it comes from',
    note: 'start and end rather than left and right, so the whole layout mirrors in a right-to-left document with no second stylesheet. Only the exit slide is physical, and it takes one rule per inline side.',
    snippet: defineSnippet({
      id: 'drawer-react-side',
      language: 'tsx',
      label: 'Four edges, two of them logical',
      source: `<Drawer side="bottom">
  <DrawerTrigger>Filtrar</DrawerTrigger>
  <DrawerPanel>…</DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'size',
    title: 'How much room the panel takes',
    note: 'Five named steps rather than a pixel string, because a theme can retune a step and cannot retune width: 400px. A drawer wider than the layer is clamped to it, which is what makes a side drawer full-bleed on a phone.',
    snippet: defineSnippet({
      id: 'drawer-react-size',
      language: 'tsx',
      label: 'A step, or an exact measure',
      source: `<Drawer size="lg">…</Drawer>;

// An exact measure is the token the steps resolve into.
<Drawer style={{ '--slotted-drawer-extent': '27rem' }}>…</Drawer>;`,
    }),
  },
  {
    id: 'resize',
    title: 'An edge the reader can move — with a keyboard',
    note: 'Rendering the separator is the capability; there is no resizable prop. Arrow keys move it sixteen pixels at a time and sixty-four with Shift, Home and End reach the limits, Enter collapses and restores, and a double click puts the panel back on the measure its size step gives it — which is the Window Splitter pattern, and which no surveyed drawer answers.',
    snippet: defineSnippet({
      id: 'drawer-react-resize',
      language: 'tsx',
      label: 'The part is the capability',
      source: `<Drawer defaultExtent={0.32} minExtent={0.2} side="start">
  <DrawerPanel>
    <DrawerHeader>
      <DrawerTitle>Collections</DrawerTitle>
    </DrawerHeader>
    <DrawerBody>…</DrawerBody>
    <DrawerResizer />
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'snapPoints',
    title: 'Stops the sheet lands on',
    note: 'A snap point is a stop of the same separator, so the arrows that move it move between them — which is the condition the guide puts on shipping snap points at all. A drag released below the first stop asks to close.',
    snippet: defineSnippet({
      id: 'drawer-react-snap-points',
      language: 'tsx',
      label: 'Three heights, all reachable by keyboard',
      source: `<Drawer side="bottom" snapPoints={[0.3, 0.6, 0.95]} defaultExtent={0.3}>
  <DrawerPanel>
    <DrawerResizer />
    <DrawerBody>…</DrawerBody>
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'sheet',
    title: 'A bottom sheet as a phone draws one',
    note: 'The sheet measures what it holds — the default size on top and bottom — stops at forty rems on a wide layer, and is moved by the platform’s own scroll, so the finger, the fling and the landing on a stop run on the compositor. The opening, the close and a tap on the grabber travel in --slotted-drawer-slide-duration and --slotted-drawer-slide-easing (default --slotted-easing-standard) going up, and in --slotted-drawer-slide-exit-duration and --slotted-drawer-slide-exit-easing (default --slotted-easing-exit) going down. The sheet and its content are one scroll: pushing up lifts the sheet to the top of the screen and, without letting go, goes on through the list under the header, which sticks there; pulling down from the top of the list brings the sheet down. A fling out of the list stops at its top and never closes the sheet. A tap on the grabber walks the stops.',
    snippet: defineSnippet({
      id: 'drawer-react-sheet',
      language: 'tsx',
      label: 'Half the layer, and the height of the content as the second stop',
      source: `<Drawer side="bottom" snapPoints={[0.5]} defaultExtent={0.5}>
  <DrawerTrigger>Filtros</DrawerTrigger>
  <DrawerPanel>
    <DrawerResizer />
    <DrawerHeader>
      <DrawerTitle>Filter invoices</DrawerTitle>
      <DrawerClose />
    </DrawerHeader>
    <DrawerBody>…</DrawerBody>
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'scrimFrom',
    title: 'A sheet over a page that stays in use',
    note: 'Below scrimFrom the scrim is not painted and a press reaches the page — the sheet over a map. It is written beside modal={false} and outsidePress="none", because an undimmed page that stayed inert would promise something it does not do. Drag the sheet past sixty per cent and the scrim fades in.',
    snippet: defineSnippet({
      id: 'drawer-react-scrim-from',
      language: 'tsx',
      label: 'Undimmed up to the middle stop',
      source: `<Drawer
  side="bottom"
  snapPoints={[0.25, 0.6, 0.95]}
  defaultExtent={0.25}
  scrimFrom={0.6}
  modal={false}
  outsidePress="none"
>
  …
</Drawer>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'A sheet above the virtual keyboard',
    note: 'On a phone the keyboard shrinks the visual viewport and leaves fixed layers under the keys. The open layer reads what the keyboard covers and recedes by it, so the sheet — and its footer — land above the keys. The button beside the scene writes the same property the binding writes, 260 pixels, to show it on a screen without one.',
    snippet: defineSnippet({
      id: 'drawer-react-keyboard',
      language: 'tsx',
      label: 'Nothing to write: the layer does it',
      source: `<Drawer side="bottom">
  <DrawerPanel>
    <DrawerHeader>
      <DrawerTitle>Send reminder</DrawerTitle>
    </DrawerHeader>
    <DrawerBody>
      <TextField aria-label="Note to the customer" />
    </DrawerBody>
    <DrawerFooter>…</DrawerFooter>
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'modal',
    title: 'A drawer the page behind can still be used',
    note: 'modal={false} writes no aria-modal, makes nothing inert, locks no scroll and contains no focus. The APG warns that marking a container modal without doing all four is worse for a screen-reader reader than not marking it at all.',
    snippet: defineSnippet({
      id: 'drawer-react-modal',
      language: 'tsx',
      label: 'Non-modal, and honest about it',
      source: `<Drawer modal={false}>
  <DrawerTrigger>Order details</DrawerTrigger>
  <DrawerPanel>…</DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'policy',
    title: 'Refusing a close, and refusing it once',
    note: 'Five ways to close and one request. A guard on onOpenChange covers Escape, an outside press, the close button, the trigger and the imperative handle together; Angular Material’s disableClose refuses two of them and Ant needs two booleans for one.',
    snippet: defineSnippet({
      id: 'drawer-react-policy',
      language: 'tsx',
      label: 'One guard for every way out',
      source: `<Drawer
  open={open}
  onOpenChange={(next, request) => {
    if (!next && saving) return request.cancel();
    setOpen(next);
  }}
>
  …
</Drawer>;`,
    }),
  },
  {
    id: 'focus',
    title: 'Where focus goes, and where it comes back to',
    note: 'An overlay drawer takes focus on open and gives it back on close. An inline one takes nothing — a sidebar that stole focus every time a breakpoint crossed would be unusable — and still gives it back when it closes under the reader’s hands.',
    snippet: defineSnippet({
      id: 'drawer-react-focus',
      language: 'tsx',
      label: 'Naming the element focus lands on',
      source: `const search = useRef<HTMLInputElement>(null);

<Drawer initialFocus={search}>
  <DrawerTrigger>Buscar</DrawerTrigger>
  <DrawerPanel>
    <DrawerBody>
      <TextField label="Buscar" ref={search} />
    </DrawerBody>
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'loading',
    title: 'Open before the content arrived',
    note: 'The body carries aria-busy and keeps a floor so the panel does not jump to size when the data lands. The header, the close button, Escape and the separator all stay operable: a drawer a reader cannot leave is the worse failure of the two.',
    snippet: defineSnippet({
      id: 'drawer-react-loading',
      language: 'tsx',
      label: 'Busy, and still closable',
      source: `<Drawer loading={invoice === undefined} defaultOpen>
  <DrawerPanel>
    <DrawerHeader>
      <DrawerTitle>Invoice 4471</DrawerTitle>
      <DrawerClose />
    </DrawerHeader>
    <DrawerBody>
      <Skeleton shape="text" />
    </DrawerBody>
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'nested',
    title: 'A drawer opened from a drawer',
    note: 'Escape reaches the topmost layer only, and a layer that refuses it stops the request reaching the one beneath. The depth comes from the single stack dismissable-layer keeps, so nothing here states a z-index.',
    snippet: defineSnippet({
      id: 'drawer-react-nested',
      language: 'tsx',
      label: 'Two layers, one stack',
      source: `<Drawer defaultOpen>
  <DrawerPanel>
    <DrawerBody>
      <Drawer size="sm">
        <DrawerTrigger>Ver o item</DrawerTrigger>
        <DrawerPanel>…</DrawerPanel>
      </Drawer>
    </DrawerBody>
  </DrawerPanel>
</Drawer>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A ninety-character token in a title breaks rather than widening the panel, and a body longer than the layer scrolls while the actions hold still. Radix, MUI and Angular Material ship no layout, so a footer past the fold is the default of following any of them.',
    snippet: defineSnippet({
      id: 'drawer-react-content',
      language: 'tsx',
      label: 'The body scrolls; the footer stays',
      source: `<DrawerPanel>
  <DrawerHeader>
    <DrawerTitle>{fileName}</DrawerTitle>
  </DrawerHeader>
  <DrawerBody>{longText}</DrawerBody>
  <DrawerFooter>
    <Button>Save</Button>
  </DrawerFooter>
</DrawerPanel>;`,
    }),
  },
  {
    id: 'composition',
    title: 'The parts are the consumer’s own elements',
    note: 'render hands each part every attribute the family wrote, so the trigger is the library’s Button and an inline panel is a nav — nothing is reimplemented and nothing is wrapped. An empty list inside the body is result-state, which owns that question.',
    snippet: defineSnippet({
      id: 'drawer-react-composition',
      language: 'tsx',
      label: 'A Button that opens it, a nav that holds it',
      source: `<DrawerTrigger render={(props) => <Button {...props} variant="outline" />}>Open</DrawerTrigger>;

<DrawerPanel render={(props) => <nav {...props} aria-label="Sections" />}>…</DrawerPanel>;`,
    }),
  },
  {
    id: 'defaults',
    title: 'What an application decides once',
    note: 'Seven axes set for a whole subtree rather than repeated on every drawer in a product. A drawer that states any of them itself still wins, because an explicit consumer value always does.',
    snippet: defineSnippet({
      id: 'drawer-react-defaults',
      language: 'tsx',
      label: 'One decision for the whole product',
      source: `<DrawerDefaultsProvider side="start" size="lg" outsidePress="none">
  <App />
</DrawerDefaultsProvider>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears, and what they can reach',
    note: 'The title names the panel and the separator; the trigger says expanded in both modes and haspopup in one. Tab wraps inside a modal panel, and the closed panel of an inline drawer is inert so the collapse the eye reads and the tab order agree.',
    snippet: defineSnippet({
      id: 'drawer-react-accessibility',
      language: 'tsx',
      label: 'The name every part is wired to',
      source: `<DrawerPanel>
  <DrawerHeader>
    <DrawerTitle>Collections</DrawerTitle>
  </DrawerHeader>
  <DrawerResizer />
</DrawerPanel>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: DrawerChangeRequest)',
    when: 'Before the drawer opens or closes, for every way it can: the trigger, the ✕, Escape, a press outside, the back gesture and the handle. The request carries value, previous, reason (pointer, keyboard, dismiss, escape, outsidePress, back or programmatic), result, the source event and cancel(), which keeps the drawer as it is.',
  },
  {
    name: 'onOpenChangeComplete',
    payload: '(open: boolean)',
    when: 'After the entrance or the exit has ended: true once the drawer is settled open, false once it has left — the moment an application that renders the drawer conditionally removes it, so the exit runs. A drawer mounted open enters from its closed style, as one opened later does.',
  },
  {
    name: 'onExtentChange',
    payload: '(extent: number | undefined, request: DrawerExtentRequest)',
    when: 'Before the panel’s measure changes, with the reason pointer for a drag or a tap on the grip, keyboard for an arrow key, Home, End or Enter, and programmatic for a change from code. A drag of the separator fires on every pointer move and can report a value below minExtent; a bottom sheet fires once its scroll comes to rest, with the stop it rests on. undefined means the panel is back on its size step, or on the height of its content under size="content".',
  },
  {
    name: 'onClick, onKeyDown, onPointerDown, on every part',
    payload: 'the element’s own events',
    when: 'Whenever the element fires them. Your handler runs first, and preventDefault() in it cancels the drawer’s own behavior for that event.',
  },
];

const composition = apiRows([
  [
    'render',
    '(props) => ReactNode',
    '—',
    'every part',
    'Replaces the element a part renders and passes it every attribute the drawer wrote. On DrawerPanel it replaces the panel, not the layer, which is how an inline drawer becomes a nav or an aside.',
  ],
  [
    'ref',
    'Ref<DrawerHandle> on Drawer, Ref<HTMLElement> on every part',
    '—',
    'Drawer, every part',
    'On a part, the element. On Drawer, a handle with open(), close(result), focus() and panel, the panel element once it is in the document.',
  ],
  [
    'container',
    'Element | null',
    '—',
    'Drawer',
    'An element to portal this layer into instead of the shared portal root, for an application shell with its own stacking context. setPortalContainer from @slotted/core/portal sets one for the whole document.',
  ],
  [
    'useDrawer()',
    '() => DrawerContextValue',
    '—',
    'inside Drawer',
    'Reads the drawer inside Drawer: whether it is open, the measure, the ids, the resolved axes and close(reason, result). It throws outside a drawer.',
  ],
  [
    'DrawerDefaultsProvider',
    '{ mode, side, size, mount, modal, escape, outsidePress, back, drag }',
    '—',
    'a subtree',
    'Sets these nine axes for every drawer under it. A value set on one drawer still wins.',
  ],
]);

const accessibility = [
  'Under mode="overlay" the drawer follows the WAI-ARIA dialog (modal) pattern. While it is modal, Tab and Shift+Tab move through the panel and wrap at its ends. Escape closes it, and reaches only the topmost layer, so one press never closes two drawers.',
  'Under mode="inline" the panel has no role, because a navigation drawer is a navigation landmark and a filter panel is complementary; give it one with render. The trigger has no aria-haspopup there, because an inline drawer is a disclosure, not a popup.',
  'aria-modal="true" is written only while the drawer is modal, which is the only state in which the page behind is inert. modal is always false under mode="inline".',
  'The separator follows the WAI-ARIA window splitter pattern. The arrow keys move it in the direction they point, Home and End go to the limits, and Enter collapses the panel to its minimum and then restores it. Enter never closes the drawer; Escape does. The values are percentages, and there is no aria-valuetext, so a screen reader announces 40 rather than 40 per cent.',
  'A bottom sheet moves under a touch on its body as well as on its separator, and every stop a finger reaches, the height of the content among them, is also reachable with the arrow keys on the separator. It is moved by the page’s own scroll, so a control whose touch-action takes vertical movement keeps its gesture, and a scrolling region at its edge — a message list at its top — passes the pull on to the sheet, unless it sits inside data-drawer-drag="none".',
  'A closed panel is inert in both modes, so its controls are in neither the tab order nor the accessibility tree.',
  'Focus moves into an overlay panel when it opens, to the first focusable element unless initialFocus names another, and returns on close to the element that had it before; if that element has left the document, focus goes to its nearest ancestor still in it. An inline drawer moves no focus when it opens, and on close restores focus only when focus is inside the panel or on the page body.',
  'The ✕ button and the separator are each at least --slotted-target-min across, so both meet the WCAG 2.2 minimum target size of 24 by 24 pixels.',
];

const snippets = [
  defineSnippet({
    id: 'drawer-react-anatomy',
    language: 'tsx',
    label: 'Anatomy, as it reaches the DOM',
    source: `<div
  data-ui="drawer"
  data-part="root"
  data-mode="overlay"
  data-side="end"
  data-size="md"
  data-mount="active"
  data-modal
  data-open
>
  <div data-part="backdrop" />
  <div data-part="panel" role="dialog" aria-modal="true" aria-labelledby="d-t">
    <div
      data-part="resizer"
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-controls="d-p"
      aria-labelledby="d-t"
      aria-valuenow={40}
      aria-valuemin={20}
      aria-valuemax={100}
    />
    <header data-part="header">
      <h2 data-part="title" id="d-t">
        Invoice 4471
      </h2>
      <p data-part="description" id="d-d">
        Emitida em 12 de agosto.
      </p>
      <button data-part="close" type="button" aria-label="Close" />
    </header>
    <div data-part="body">…</div>
    <footer data-part="footer">…</footer>
  </div>
</div>;`,
  }),
  defineSnippet({
    id: 'drawer-theming',
    language: 'css',
    label: 'Retuning the family for an application',
    source: `[data-ui='drawer'] {
  --slotted-drawer-extent-md: 26rem;
  --slotted-drawer-scrim: rgb(12 20 40 / 0.6);
  --slotted-drawer-border-color: var(--slotted-border-subtle);
  --slotted-drawer-resizer-line-color: var(--slotted-tone-accent-border);
  --slotted-drawer-footer-surface: transparent;
}`,
  }),
];

const api = apiRows([
  [
    'open',
    'boolean',
    '—',
    'Drawer',
    'Whether the drawer is open, when you own the state. Update it from onOpenChange.',
  ],
  [
    'defaultOpen',
    'boolean',
    '—',
    'Drawer',
    'Whether an uncontrolled drawer starts open. It is read once, on mount.',
  ],
  [
    'extent',
    'number',
    '—',
    'Drawer',
    'The panel’s measure, when you own it: a fraction from 0 to 1 of the screen, or of your layout under mode="inline". undefined means the size step decides. Update it from onExtentChange.',
  ],
  [
    'defaultExtent',
    'number',
    '—',
    'Drawer',
    'The measure an uncontrolled drawer starts at. It is read once, on mount.',
  ],
  [
    'minExtent',
    'number',
    '0.2',
    'Drawer',
    'The smallest measure the reader can set, and the separator’s aria-valuemin. A drag released below it asks to close the drawer, with the reason pointer.',
  ],
  [
    'maxExtent',
    'number',
    '1',
    'Drawer',
    'The largest measure the reader can set, and the separator’s aria-valuemax. With snap points, both limits default to the first and the last stop.',
  ],
  [
    'snapPoints',
    'readonly number[]',
    '—',
    'Drawer',
    'The stops the measure moves between, as fractions. With them an arrow key moves to the next stop, Home and End go to the first and the last, and a drag is released onto the nearest.',
  ],
  [
    'mode',
    "'overlay' | 'inline'",
    'overlay',
    'Drawer, DrawerDefaultsProvider',
    'overlay puts the drawer over the page, in a portal; inline puts it in your own layout. The value can change while the drawer is open, and the panel’s content and the state of its fields are kept across the change.',
  ],
  [
    'side',
    "'start' | 'end' | 'top' | 'bottom'",
    'end',
    'Drawer, DrawerDefaultsProvider',
    'The edge the panel comes from. start and end follow the writing direction, so the drawer changes sides in a right-to-left document.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg' | 'xl' | 'full' | 'content'",
    'content on top and bottom, md on start and end',
    'Drawer, DrawerDefaultsProvider',
    'The panel’s measure at rest: one of the steps sm (18rem), md (24rem), lg (30rem), xl (40rem) and full, or content, which fits what the panel holds, up to 4rem short of the screen. A step wider than the screen is held to it. On a bottom sheet, full is the screen’s height and the footer rests at its bottom.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'Drawer, DrawerDefaultsProvider',
    'When an overlay layer is in the document: active only while it is open or closing, lazy from the first open on, and eager from the start, inert while closed. An inline drawer is always in the document.',
  ],
  [
    'modal',
    'boolean',
    'true',
    'Drawer, DrawerDefaultsProvider',
    'Whether the page behind is inert, its scroll is locked and focus is contained in the panel, and whether the panel carries aria-modal. The scrim is painted either way. Always false under mode="inline".',
  ],
  [
    'escape',
    "'close' | 'none'",
    'close',
    'Drawer, DrawerDefaultsProvider',
    'Whether Escape asks to close the drawer. Escape reaches only the topmost layer, and a layer that refuses it does not pass it to the one below.',
  ],
  [
    'outsidePress',
    "'close' | 'none'",
    'close',
    'Drawer, DrawerDefaultsProvider',
    'Whether a press outside the layer, the scrim included, asks to close the drawer. It has no effect under mode="inline".',
  ],
  [
    'back',
    "'close' | 'none'",
    'close',
    'Drawer, DrawerDefaultsProvider',
    'Whether the browser’s back button or a phone’s back gesture closes a modal drawer instead of leaving the page. The drawer holds one close watcher while it is open where the browser has CloseWatcher, and one history entry elsewhere; a drawer opened without a press shares the way back with the layer opened before it. It has no effect under mode="inline".',
  ],
  [
    'drag',
    "'panel' | 'resizer'",
    'panel',
    'Drawer, DrawerDefaultsProvider',
    'What a touch moves a bottom sheet by: panel, anywhere on the panel, the sheet and its content scrolling as one; or resizer, the separator only, the body scrolling on its own at the highest stop. A mouse drags the separator, and the sheet settles on the nearest stop.',
  ],
  [
    'scrimFrom',
    'number',
    '0',
    'Drawer',
    'While the measure is below this fraction, the scrim is not painted, a press reaches the page, and the root carries data-undimmed. Use it with modal={false} and outsidePress="none".',
  ],
  [
    'loading',
    'boolean',
    'false',
    'Drawer',
    'Marks the body as busy with aria-busy and gives it a minimum height, so the panel does not jump when the content arrives. The header, the ✕, Escape and the separator stay available.',
  ],
  [
    'messages',
    'Partial<DrawerMessages>',
    '—',
    'Drawer',
    'Words laid over the current language, key by key: close, the name of the ✕. An aria-label on DrawerClose takes precedence.',
  ],
  [
    'initialFocus',
    "'first' | 'container' | RefObject | false",
    'first',
    'Drawer',
    'Where focus goes when an overlay drawer opens: first, the first focusable element; container, the panel itself, for content that is read before it is used; a ref; or false, nowhere. An inline drawer moves no focus.',
  ],
  [
    'finalFocus',
    'RefObject | false',
    '—',
    'Drawer',
    'Where focus goes when the drawer closes, as a ref, or false for nowhere. When unset, it returns to the element that had focus when the drawer opened, usually the trigger.',
  ],
  [
    'inset',
    "'none'",
    '—',
    'DrawerBody',
    'none removes the body’s padding, for content that brings its own inset, such as a page or a list that runs to the panel’s edges.',
  ],
  [
    'step',
    'number',
    '16',
    'DrawerResizer',
    'How far one arrow key moves the separator, in pixels, when there are no snap points.',
  ],
  [
    'largeStep',
    'number',
    '64',
    'DrawerResizer',
    'How far Shift and an arrow key move the separator, in pixels, when there are no snap points.',
  ],
  [
    'value',
    'string',
    '—',
    'DrawerClose',
    'The result of a close from this button, carried on the close request as result.',
  ],
]);

export const REACT_DRAWER_DOCS = {
  drawer: {
    accessibility,
    anatomy,
    api,
    composition,
    events,
    imports,
    scenes,
    snippets,
  },
};
