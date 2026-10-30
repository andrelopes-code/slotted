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

export const ANGULAR_DRAWER_TOKENS = drawerTokens.map((name) => ({
  name,
  purpose: 'A theme-owned decision of the drawer.',
}));

const imports: ReferenceImport = {
  source:
    "import { SlDrawer, SlDrawerActions, SlDrawerBody, SlDrawerClose, SlDrawerDescription, SlDrawerFooter, SlDrawerHeader, SlDrawerResizer, SlDrawerTitle, SlDrawerTrigger, provideDrawerDefaults } from '@slotted/angular/drawer';",
  selector: '<sl-drawer>, exportAs slDrawer',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div inside <sl-drawer>, moved into a portal under mode="overlay"',
    required: true,
    purpose:
      'The layer. Under mode="overlay" it is fixed to the viewport and stacked above the page; under mode="inline" it is a box in your own layout, and its own width or height is what opens and closes. It carries data-ui="drawer", every axis as a data attribute, and data-open, data-loading and data-dragging. The <sl-drawer> host renders display: contents where you wrote it, and the layer keeps the theme, density and direction of that place.',
  },
  {
    part: 'trigger',
    element: 'your own element, with slDrawerTrigger on it',
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
    element: 'div, holding the projected content',
    required: true,
    purpose:
      'The surface, aligned to side. Under mode="overlay" it carries role="dialog", and aria-modal="true" while modal; under mode="inline" it has no role, so put a landmark such as <nav slDrawerBody> inside it. Its rows are the header, the body and the footer, and only the body scrolls. An aria-label written on <sl-drawer> is moved to it.',
  },
  {
    part: 'resizer',
    element: 'your own element, with slDrawerResizer on it',
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
    element: 'your own element, with slDrawerHeader on it',
    required: false,
    purpose:
      'Lays out the title and the description in one column, the actions in a second when they are rendered, and the close button in the last, so a title that wraps grows the row instead of moving the buttons.',
  },
  {
    part: 'actions',
    element: 'your own element, with slDrawerActions on it',
    required: false,
    purpose:
      'One or two actions beside the title, such as icon buttons for history and a new conversation, on the title’s row between the title and the close button. The buttons keep the size you give them.',
  },
  {
    part: 'title',
    element: 'your own heading, with slDrawerTitle on it',
    required: false,
    purpose:
      'The visible name of the drawer. The panel and the separator point at it with aria-labelledby, and only while it is rendered.',
  },
  {
    part: 'description',
    element: 'your own element, with slDrawerDescription on it',
    required: false,
    purpose:
      'The sentence under the title. The panel points at it with aria-describedby while it is rendered.',
  },
  {
    part: 'body',
    element: 'your own element, with slDrawerBody on it',
    required: false,
    purpose:
      'The row that scrolls, and the row that carries aria-busy while loading is set. A wheel that reaches its end does not scroll the page behind. inset="none" removes its padding, for content that brings its own, such as a list that runs to the panel’s edges.',
  },
  {
    part: 'footer',
    element: 'your own element, with slDrawerFooter on it',
    required: false,
    purpose:
      'The actions, in a wrapping row aligned to the end, on a sunken surface with a rule above it.',
  },
  {
    part: 'close',
    element: 'your own button, with slDrawerClose on it',
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
      id: 'drawer-angular-playground',
      language: 'angular',
      label: 'A trigger, a panel and the actions',
      source: `<button slButton [slDrawerTrigger]="d">Open details</button>
<sl-drawer #d="slDrawer">
  <header slDrawerHeader>
    <h2 slDrawerTitle>Invoice 4471</h2>
    <p slDrawerDescription>Issued on August 12.</p>
    <button slDrawerClose></button>
  </header>
  <div slDrawerBody>
    <input slTextField aria-label="Note" />
  </div>
  <footer slDrawerFooter>
    <button slButton size="sm" variant="ghost" tone="secondary">Cancel</button>
    <button slButton size="sm">Save</button>
  </footer>
</sl-drawer>`,
    }),
  },
  {
    id: 'mode',
    title: 'A layer over the page, or a panel beside it',
    note: 'One axis rather than two components, because an application binds it to its own breakpoint: swapping one element for another there would take the panel’s scroll position, its focus and every uncontrolled control with it.',
    snippet: defineSnippet({
      id: 'drawer-angular-mode',
      language: 'angular',
      label: 'The two lines that make it responsive',
      source: `<div style="display: grid; grid-template-columns: auto minmax(0, 1fr)">
  <sl-drawer [mode]="wide() ? 'inline' : 'overlay'" [(open)]="open" side="start">
    <nav slDrawerBody aria-label="Sections">…</nav>
  </sl-drawer>
  <main>…</main>
</div>`,
    }),
  },
  {
    id: 'side',
    title: 'Which edge it comes from',
    note: 'start and end rather than left and right, so the whole layout mirrors in a right-to-left document with no second stylesheet. Only the exit slide is physical, and it takes one rule per inline side.',
    snippet: defineSnippet({
      id: 'drawer-angular-side',
      language: 'angular',
      label: 'Four edges, two of them logical',
      source: `<sl-drawer side="bottom" [(open)]="open">
  <div slDrawerBody>…</div>
</sl-drawer>`,
    }),
  },
  {
    id: 'size',
    title: 'How much room the panel takes',
    note: 'Five named steps rather than a pixel string, because a theme can retune a step and cannot retune width: 400px. A drawer wider than the layer is clamped to it, which is what makes a side drawer full-bleed on a phone.',
    snippet: defineSnippet({
      id: 'drawer-angular-size',
      language: 'angular',
      label: 'A step, or an exact measure',
      source: `<sl-drawer size="lg">…</sl-drawer>

<!-- An exact measure is the token the steps resolve into. -->
<sl-drawer style="--slotted-drawer-extent: 27rem">…</sl-drawer>`,
    }),
  },
  {
    id: 'resize',
    title: 'An edge the reader can move — with a keyboard',
    note: 'Putting slDrawerResizer on an element is the capability; there is no resizable input. Arrow keys move it sixteen pixels at a time and sixty-four with Shift, Home and End reach the limits, Enter collapses and restores, and a double click puts the panel back on the measure its size step gives it — which is the Window Splitter pattern, and which no surveyed drawer answers.',
    snippet: defineSnippet({
      id: 'drawer-angular-resize',
      language: 'angular',
      label: 'The directive is the capability',
      source: `<sl-drawer side="start" [(extent)]="extent" [minExtent]="0.2">
  <header slDrawerHeader><h2 slDrawerTitle>Collections</h2></header>
  <div slDrawerBody>…</div>
  <div slDrawerResizer></div>
</sl-drawer>`,
    }),
  },
  {
    id: 'snapPoints',
    title: 'Stops the sheet lands on',
    note: 'A snap point is a stop of the same separator, so the arrows that move it move between them — which is the condition the guide puts on shipping snap points at all. A drag released below the first stop asks to close.',
    snippet: defineSnippet({
      id: 'drawer-angular-snap-points',
      language: 'angular',
      label: 'Three heights, all reachable by keyboard',
      source: `<sl-drawer side="bottom" [snapPoints]="[0.3, 0.6, 0.95]" [(extent)]="extent">
  <div slDrawerResizer></div>
  <div slDrawerBody>…</div>
</sl-drawer>`,
    }),
  },
  {
    id: 'sheet',
    title: 'A bottom sheet as a phone draws one',
    note: 'The sheet measures what it holds — the default size on top and bottom — stops at forty rems on a wide layer, and is moved by the platform’s own scroll, so the finger, the fling and the landing on a stop run on the compositor. The opening, the close and a tap on the grabber travel in --slotted-drawer-slide-duration and --slotted-drawer-slide-easing (default --slotted-easing-standard) going up, and in --slotted-drawer-slide-exit-duration and --slotted-drawer-slide-exit-easing (default --slotted-easing-exit) going down. The sheet and its content are one scroll: pushing up lifts the sheet to the top of the screen and, without letting go, goes on through the list under the header, which sticks there; pulling down from the top of the list brings the sheet down. A fling out of the list stops at its top and never closes the sheet. A tap on the grabber walks the stops.',
    snippet: defineSnippet({
      id: 'drawer-angular-sheet',
      language: 'angular',
      label: 'Half the layer, and the height of the content as the second stop',
      source: `<button slButton [slDrawerTrigger]="sheet">Filtros</button>
<sl-drawer #sheet="slDrawer" side="bottom" [snapPoints]="[0.5]" [(extent)]="extent">
  <div slDrawerResizer></div>
  <header slDrawerHeader>
    <h2 slDrawerTitle>Filter invoices</h2>
    <button slDrawerClose></button>
  </header>
  <div slDrawerBody>…</div>
</sl-drawer>`,
    }),
  },
  {
    id: 'scrimFrom',
    title: 'A sheet over a page that stays in use',
    note: 'Below scrimFrom the scrim is not painted and a press reaches the page — the sheet over a map. It is written beside [modal]="false" and outsidePress="none", because an undimmed page that stayed inert would promise something it does not do. Move the sheet past sixty per cent and the scrim fades in.',
    snippet: defineSnippet({
      id: 'drawer-angular-scrim-from',
      language: 'angular',
      label: 'Undimmed up to the middle stop',
      source: `<sl-drawer
  side="bottom"
  [snapPoints]="[0.25, 0.6, 0.95]"
  [(extent)]="extent"
  [scrimFrom]="0.6"
  [modal]="false"
  outsidePress="none"
>
  …
</sl-drawer>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'A sheet above the virtual keyboard',
    note: 'On a phone the keyboard shrinks the visual viewport and leaves fixed layers under the keys. The open layer reads what the keyboard covers and recedes by it, so the sheet — and its footer — land above the keys. The button beside the scene writes the same property the binding writes, 260 pixels, to show it on a screen without one.',
    snippet: defineSnippet({
      id: 'drawer-angular-keyboard',
      language: 'angular',
      label: 'Nothing to write: the layer does it',
      source: `<sl-drawer side="bottom" [(open)]="reminding">
  <header slDrawerHeader><h2 slDrawerTitle>Send reminder</h2></header>
  <div slDrawerBody>
    <input slTextField aria-label="Note for the customer" />
  </div>
  <footer slDrawerFooter>…</footer>
</sl-drawer>`,
    }),
  },
  {
    id: 'modal',
    title: 'A drawer the page behind can still be used',
    note: 'modal="false" writes no aria-modal, makes nothing inert, locks no scroll and contains no focus. The APG warns that marking a container modal without doing all four is worse for a screen-reader reader than not marking it at all.',
    snippet: defineSnippet({
      id: 'drawer-angular-modal',
      language: 'angular',
      label: 'Non-modal, and honest about it',
      source: `<sl-drawer [modal]="false" [(open)]="open">
  <div slDrawerBody>…</div>
</sl-drawer>`,
    }),
  },
  {
    id: 'policy',
    title: 'Refusing a close, and refusing it once',
    note: 'Five ways to close and one output. A guard on openChangeRequest covers Escape, an outside press, the close button, the trigger and the imperative call together; Angular Material’s disableClose refuses two of them.',
    snippet: defineSnippet({
      id: 'drawer-angular-policy',
      language: 'angular',
      label: 'One guard for every way out',
      source: `<sl-drawer [(open)]="open" (openChangeRequest)="guard($event)">…</sl-drawer>`,
    }),
  },
  {
    id: 'focus',
    title: 'Where focus goes, and where it comes back to',
    note: 'An overlay drawer takes focus on open and gives it back on close. An inline one takes nothing — a sidebar that stole focus every time a breakpoint crossed would be unusable — and still gives it back when it closes under the reader’s hands.',
    snippet: defineSnippet({
      id: 'drawer-angular-focus',
      language: 'angular',
      label: 'Naming the element focus lands on',
      source: `<sl-drawer [initialFocus]="search">
  <div slDrawerBody>
    <input #search slTextField aria-label="Buscar" />
  </div>
</sl-drawer>`,
    }),
  },
  {
    id: 'loading',
    title: 'Open before the content arrived',
    note: 'The body carries aria-busy and keeps a floor so the panel does not jump to size when the data lands. The header, the close button, Escape and the separator all stay operable: a drawer a reader cannot leave is the worse failure of the two.',
    snippet: defineSnippet({
      id: 'drawer-angular-loading',
      language: 'angular',
      label: 'Busy, and still closable',
      source: `<sl-drawer [loading]="invoice() === undefined" [(open)]="open">
  <header slDrawerHeader>
    <h2 slDrawerTitle>Invoice 4471</h2>
    <button slDrawerClose></button>
  </header>
  <div slDrawerBody><sl-skeleton shape="text" /></div>
</sl-drawer>`,
    }),
  },
  {
    id: 'nested',
    title: 'A drawer opened from a drawer',
    note: 'Escape reaches the topmost layer only, and a layer that refuses it stops the request reaching the one beneath. The depth comes from the single stack dismissable-layer keeps, so nothing here states a z-index.',
    snippet: defineSnippet({
      id: 'drawer-angular-nested',
      language: 'angular',
      label: 'Two layers, one stack',
      source: `<sl-drawer [(open)]="open">
  <div slDrawerBody>
    <button slButton [slDrawerTrigger]="inner">Ver o item</button>
    <sl-drawer #inner="slDrawer" size="sm">…</sl-drawer>
  </div>
</sl-drawer>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A ninety-character token in a title breaks rather than widening the panel, and a body longer than the layer scrolls while the actions hold still. MUI and Angular Material ship no layout, so a footer past the fold is the default of following either.',
    snippet: defineSnippet({
      id: 'drawer-angular-content',
      language: 'angular',
      label: 'The body scrolls; the footer stays',
      source: `<sl-drawer>
  <header slDrawerHeader>
    <h2 slDrawerTitle>{{ fileName }}</h2>
  </header>
  <div slDrawerBody>{{ longText }}</div>
  <footer slDrawerFooter><button slButton>Save</button></footer>
</sl-drawer>`,
    }),
  },
  {
    id: 'composition',
    title: 'The parts are the consumer’s own elements',
    note: 'Every part is a directive on an element the consumer wrote, so the trigger is the library’s button and an inline panel’s content is a nav — nothing is reimplemented and nothing is wrapped. An empty list inside the body is result-state, which owns that question.',
    snippet: defineSnippet({
      id: 'drawer-angular-composition',
      language: 'angular',
      label: 'A button that opens it, a nav that holds it',
      source: `<button slButton variant="outline" [slDrawerTrigger]="d">Open</button>
<sl-drawer #d="slDrawer" mode="inline" side="start">
  <nav slDrawerBody aria-label="Sections">…</nav>
</sl-drawer>`,
    }),
  },
  {
    id: 'defaults',
    title: 'What an application decides once',
    note: 'Seven axes set for a whole injector rather than repeated on every drawer in a product. A drawer that states any of them itself still wins, because an explicit consumer value always does.',
    snippet: defineSnippet({
      id: 'drawer-angular-defaults',
      language: 'ts',
      label: 'One decision for the whole product',
      source: `bootstrapApplication(App, {
  providers: [provideDrawerDefaults({ side: 'start', size: 'lg', outsidePress: 'none' })],
});`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears, and what they can reach',
    note: 'The title names the panel and the separator; the trigger says expanded in both modes and haspopup in one. Tab wraps inside a modal panel, and the closed panel of an inline drawer is inert so the collapse the eye reads and the tab order agree.',
    snippet: defineSnippet({
      id: 'drawer-angular-accessibility',
      language: 'angular',
      label: 'The name every part is wired to',
      source: `<sl-drawer mode="inline" side="start">
  <header slDrawerHeader><h2 slDrawerTitle>Collections</h2></header>
  <div slDrawerResizer></div>
</sl-drawer>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'The two-way half of open, which [(open)] binds. It fires once the drawer has opened or closed.',
  },
  {
    name: 'openChangeRequest',
    payload: 'DrawerChangeRequest',
    when: 'Before the drawer opens or closes, for every way it can: the trigger, the ✕, Escape, a press outside, the back gesture and a call from code. The request carries value, previous, reason (pointer, keyboard, dismiss, escape, outsidePress, back or programmatic), result, the source event and cancel(), which keeps the drawer as it is.',
  },
  {
    name: 'openChangeComplete',
    payload: 'boolean',
    when: 'After the entrance or the exit has ended: true once the drawer is settled open, false once it has left — the moment an application that renders the drawer conditionally removes it, so the exit runs. A drawer mounted open enters from its closed style, as one opened later does.',
  },
  {
    name: 'extentChange',
    payload: 'number | undefined',
    when: 'The two-way half of extent, which [(extent)] binds. It fires once the measure has changed.',
  },
  {
    name: 'extentChangeRequest',
    payload: 'DrawerExtentRequest',
    when: 'Before the panel’s measure changes, with the reason pointer for a drag or a tap on the grip, keyboard for an arrow key, Home, End or Enter, and programmatic for a change from code. A drag of the separator fires on every pointer move and can report a value below minExtent; a bottom sheet fires once its scroll comes to rest, with the stop it rests on. undefined means the panel is back on its size step, or on the height of its content under size="content".',
  },
  {
    name: 'closed',
    payload: 'string | undefined',
    when: 'Once the drawer has closed, with the result of the close, or undefined for a close that carried none.',
  },
];

const composition = apiRows([
  [
    'exportAs',
    "'slDrawer'",
    '—',
    '<sl-drawer>',
    'A template reference variable, #drawer="slDrawer", reaches the drawer, which is how a trigger anywhere in the same template opens it.',
  ],
  [
    'ng-content',
    '—',
    '—',
    '<sl-drawer>',
    'The drawer’s content is your own elements with the part directives on them, projected into the panel. Under mount="active" the layer is built only while the drawer is open.',
  ],
  [
    'openDrawer(), close(result), focus()',
    '() => void',
    '—',
    '<sl-drawer>',
    'Open the drawer, close it with a result, and move focus into the panel, from code. Each opens or closes with the reason programmatic.',
  ],
  [
    'container',
    'Element | null',
    '—',
    '<sl-drawer>',
    'An element to portal this layer into instead of the shared portal root, for an application shell with its own stacking context. setPortalContainer from @slotted/core/portal sets one for the whole document.',
  ],
  [
    'provideDrawerDefaults()',
    '{ mode, side, size, mount, modal, escape, outsidePress, back, drag }',
    '—',
    'an injector',
    'Sets these nine axes for every drawer in the injector, through DRAWER_DEFAULTS. A value set on one drawer still wins.',
  ],
]);

const accessibility = [
  'Under mode="overlay" the drawer follows the WAI-ARIA dialog (modal) pattern. While it is modal, Tab and Shift+Tab move through the panel and wrap at its ends. Escape closes it, and reaches only the topmost layer, so one press never closes two drawers.',
  'Under mode="inline" the panel has no role, because a navigation drawer is a navigation landmark and a filter panel is complementary; write the landmark yourself, such as <nav slDrawerBody>. The trigger has no aria-haspopup there, because an inline drawer is a disclosure, not a popup.',
  'aria-modal="true" is written only while the drawer is modal, which is the only state in which the page behind is inert. modal is always false under mode="inline". An aria-label written on <sl-drawer> is moved to the panel, which is the element the role is on.',
  'The separator follows the WAI-ARIA window splitter pattern. The arrow keys move it in the direction they point, Home and End go to the limits, and Enter collapses the panel to its minimum and then restores it. Enter never closes the drawer; Escape does. The values are percentages, and there is no aria-valuetext, so a screen reader announces 40 rather than 40 per cent.',
  'A bottom sheet moves under a touch on its body as well as on its separator, and every stop a finger reaches, the height of the content among them, is also reachable with the arrow keys on the separator. It is moved by the page’s own scroll, so a control whose touch-action takes vertical movement keeps its gesture, and a scrolling region at its edge — a message list at its top — passes the pull on to the sheet, unless it sits inside data-drawer-drag="none".',
  'A closed panel is inert in both modes, so its controls are in neither the tab order nor the accessibility tree.',
  'Focus moves into an overlay panel when it opens, to the first focusable element unless initialFocus names another, and returns on close to the element that had it before; if that element has left the document, focus goes to its nearest ancestor still in it. An inline drawer moves no focus when it opens, and on close restores focus only when focus is inside the panel or on the page body.',
  'The ✕ button and the separator are each at least --slotted-target-min across, so both meet the WCAG 2.2 minimum target size of 24 by 24 pixels.',
];

const snippets = [
  defineSnippet({
    id: 'drawer-angular-anatomy',
    language: 'angular',
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
  <div data-part="backdrop"></div>
  <div data-part="panel" role="dialog" aria-modal="true" aria-labelledby="d-t">
    <div
      data-part="resizer"
      role="separator"
      tabindex="0"
      aria-orientation="vertical"
      aria-controls="d-p"
      aria-labelledby="d-t"
      aria-valuenow="40"
      aria-valuemin="20"
      aria-valuemax="100"
    ></div>
    <header data-part="header">
      <h2 data-part="title" id="d-t">Invoice 4471</h2>
      <p data-part="description" id="d-d">Issued on August 12.</p>
      <button data-part="close" type="button" aria-label="Close"></button>
    </header>
    <div data-part="body">…</div>
    <footer data-part="footer">…</footer>
  </div>
</div>`,
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
    'model<boolean>',
    'false',
    '<sl-drawer>',
    'Whether the drawer is open. A model, so [(open)] binds both halves and there is no defaultOpen.',
  ],
  [
    'extent',
    'model<number | undefined>',
    '—',
    '<sl-drawer>',
    'The panel’s measure: a fraction from 0 to 1 of the screen, or of your layout under mode="inline". undefined means the size step decides. A model, so [(extent)] binds both halves.',
  ],
  [
    'minExtent',
    'number',
    '0.2',
    '<sl-drawer>',
    'The smallest measure the reader can set, and the separator’s aria-valuemin. A drag released below it asks to close the drawer, with the reason pointer.',
  ],
  [
    'maxExtent',
    'number',
    '1',
    '<sl-drawer>',
    'The largest measure the reader can set, and the separator’s aria-valuemax. With snap points, both limits default to the first and the last stop.',
  ],
  [
    'snapPoints',
    'readonly number[]',
    '—',
    '<sl-drawer>',
    'The stops the measure moves between, as fractions. With them an arrow key moves to the next stop, Home and End go to the first and the last, and a drag is released onto the nearest.',
  ],
  [
    'mode',
    "'overlay' | 'inline'",
    'overlay',
    '<sl-drawer>, provideDrawerDefaults',
    'overlay puts the drawer over the page, in a portal; inline puts it in your own layout. The value can change while the drawer is open, and the panel’s content and the state of its fields are kept across the change.',
  ],
  [
    'side',
    "'start' | 'end' | 'top' | 'bottom'",
    'end',
    '<sl-drawer>, provideDrawerDefaults',
    'The edge the panel comes from. start and end follow the writing direction, so the drawer changes sides in a right-to-left document.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg' | 'xl' | 'full' | 'content'",
    'content on top and bottom, md on start and end',
    '<sl-drawer>, provideDrawerDefaults',
    'The panel’s measure at rest: one of the steps sm (18rem), md (24rem), lg (30rem), xl (40rem) and full, or content, which fits what the panel holds, up to 4rem short of the screen. A step wider than the screen is held to it. On a bottom sheet, full is the screen’s height and the footer rests at its bottom.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    '<sl-drawer>, provideDrawerDefaults',
    'When an overlay layer is in the document: active only while it is open or closing, lazy from the first open on, and eager from the start, inert while closed. An inline drawer is always in the document.',
  ],
  [
    'modal',
    'boolean',
    'true',
    '<sl-drawer>, provideDrawerDefaults',
    'Whether the page behind is inert, its scroll is locked and focus is contained in the panel, and whether the panel carries aria-modal. The scrim is painted either way. Always false under mode="inline".',
  ],
  [
    'escape',
    "'close' | 'none'",
    'close',
    '<sl-drawer>, provideDrawerDefaults',
    'Whether Escape asks to close the drawer. Escape reaches only the topmost layer, and a layer that refuses it does not pass it to the one below.',
  ],
  [
    'outsidePress',
    "'close' | 'none'",
    'close',
    '<sl-drawer>, provideDrawerDefaults',
    'Whether a press outside the layer, the scrim included, asks to close the drawer. It has no effect under mode="inline".',
  ],
  [
    'back',
    "'close' | 'none'",
    'close',
    '<sl-drawer>, provideDrawerDefaults',
    'Whether the browser’s back button or a phone’s back gesture closes a modal drawer instead of leaving the page. The drawer holds one close watcher while it is open where the browser has CloseWatcher, and one history entry elsewhere; a drawer opened without a press shares the way back with the layer opened before it. It has no effect under mode="inline".',
  ],
  [
    'drag',
    "'panel' | 'resizer'",
    'panel',
    '<sl-drawer>, provideDrawerDefaults',
    'What a touch moves a bottom sheet by: panel, anywhere on the panel, the sheet and its content scrolling as one; or resizer, the separator only, the body scrolling on its own at the highest stop. A mouse drags the separator, and the sheet settles on the nearest stop.',
  ],
  [
    'scrimFrom',
    'number',
    '0',
    '<sl-drawer>',
    'While the measure is below this fraction, the scrim is not painted, a press reaches the page, and the root carries data-undimmed. Use it with [modal]="false" and outsidePress="none".',
  ],
  [
    'loading',
    'boolean',
    'false',
    '<sl-drawer>',
    'Marks the body as busy with aria-busy and gives it a minimum height, so the panel does not jump when the content arrives. The header, the ✕, Escape and the separator stay available.',
  ],
  [
    'messages',
    'Partial<DrawerMessages>',
    '—',
    '<sl-drawer>',
    'Words laid over the current language, key by key: close, the name of the ✕. An aria-label on slDrawerClose takes precedence.',
  ],
  [
    'initialFocus',
    "'first' | 'container' | HTMLElement | false",
    'first',
    '<sl-drawer>',
    'Where focus goes when an overlay drawer opens: first, the first focusable element; container, the panel itself, for content that is read before it is used; an element; or false, nowhere. An inline drawer moves no focus.',
  ],
  [
    'finalFocus',
    'HTMLElement | false',
    '—',
    '<sl-drawer>',
    'Where focus goes when the drawer closes, as an element, or false for nowhere. When unset, it returns to the element that had focus when the drawer opened, usually the trigger.',
  ],
  [
    'inset',
    "'none'",
    '—',
    'slDrawerBody',
    'none removes the body’s padding, for content that brings its own inset, such as a page or a list that runs to the panel’s edges.',
  ],
  [
    'step',
    'number',
    '16',
    'slDrawerResizer',
    'How far one arrow key moves the separator, in pixels, when there are no snap points.',
  ],
  [
    'largeStep',
    'number',
    '64',
    'slDrawerResizer',
    'How far Shift and an arrow key move the separator, in pixels, when there are no snap points.',
  ],
  [
    'value',
    'string',
    '—',
    'slDrawerClose',
    'The result of a close from this button, carried on the close request as result.',
  ],
]);

export const ANGULAR_DRAWER_DOCS = {
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
