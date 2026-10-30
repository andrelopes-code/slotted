import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import collapsibleTokens from '@slotted/styles/collapsible/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_COLLAPSIBLE_TOKENS = collapsibleTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Collapsible decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlCollapsible, SlCollapsibleActions, SlCollapsibleContent, SlCollapsibleHeader, SlCollapsiblePanel, SlCollapsibleTrigger } from '@slotted/angular/collapsible';",
  selector:
    '[slCollapsible], [slCollapsibleHeader], button[slCollapsibleTrigger], [slCollapsibleActions], [slCollapsiblePanel], ng-template[slCollapsibleContent]',
  exportAs: 'slCollapsible, slCollapsibleHeader, slCollapsibleTrigger, slCollapsiblePanel',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slCollapsible',
    required: true,
    purpose:
      'The family. A two-column, two-row grid carrying data-ui="collapsible", the six axes, data-open, data-disabled, data-loading and data-value. It is also its own container, so the header reflows on its own inline size rather than the viewport’s.',
  },
  {
    part: 'header',
    element: 'the element the consumer wrote — h1 to h6, or anything else',
    required: true,
    purpose:
      'The heading. A native heading is left alone; anything else is given role="heading" and the aria-level the disclosure resolved, which is the alternative the pattern names. Its only child is the trigger.',
  },
  {
    part: 'trigger',
    element: 'button[slCollapsibleTrigger]',
    required: true,
    purpose:
      'The control. Holds aria-expanded, aria-controls, the identifier, and every native attribute the consumer wrote on the button. Enter and Space are the platform’s, so the family binds no key of its own.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The mark, drawn as a mask from a glyph token. A chevron turns between down and up; plus-minus swaps one bar for the pair. indicator="none" draws nothing at all.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The title, holding whatever the trigger projects. A box of its own, so text-overflow has something to clip under truncate and so a title in another script reads its own way.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose:
      'A second line under the title, from the description input. It is inside the trigger, so it is part of the accessible name — “Delivery, 3 of 12 items” is what a reader hears.',
  },
  {
    part: 'actions',
    element: 'the element carrying slCollapsibleActions',
    required: false,
    purpose:
      'The always-visible controls beside the header, on its own row and outside the button. What belongs in it is an slToolbar. Below 22rem it takes a row of its own.',
  },
  {
    part: 'panel',
    element: 'the element carrying slCollapsiblePanel',
    required: true,
    purpose:
      'The box the trigger controls: aria-labelledby its trigger, inert while closed, and hidden="until-found" under that mount. The box always exists, so aria-controls never names an element that is gone.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'What the panel’s grid track clips. Its content-visibility takes closed content out of the tab sequence, out of the accessibility tree and out of the browser’s page search. mount decides whether it is built at all, and an ng-template[slCollapsibleContent] inside it is what makes lazy actually lazy.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One disclosure with every input on it, driven by the controls below the canvas. Tab lands on the trigger; Enter and Space are the platform’s.',
    snippet: defineSnippet({
      id: 'collapsible-angular-playground',
      language: 'angular',
      label: 'A header and the panel it controls',
      source: `<div slCollapsible [(open)]="open">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>Delivery address</button>
  </h3>
  <div slCollapsiblePanel>402 Maple Street — Seattle.</div>
</div>`,
    }),
  },
  {
    id: 'variant',
    title: 'The three ways it is drawn',
    note: 'plain paints no chrome, ruled puts a hairline above the header so a stack reads as one list, and framed is a card. All three keep the same geometry.',
    snippet: defineSnippet({
      id: 'collapsible-angular-variant',
      language: 'angular',
      label: 'plain, ruled and framed',
      source: `<div slCollapsible variant="framed" [open]="true">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>Payment methods</button>
  </h3>
  <div slCollapsiblePanel>Credit card, ACH transfer and Zelle.</div>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the header sits at',
    note: 'The title comes from the type scale, because a header is prose; the row’s height, padding, gap and mark come from the control scales, so a dense page is tighter rather than smaller.',
    snippet: defineSnippet({
      id: 'collapsible-angular-sizes',
      language: 'angular',
      label: 'sm, md and lg',
      source: `<div slCollapsible size="lg" [open]="true">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger description="3 of 12 items">Summary</button>
  </h3>
  <div slCollapsiblePanel>Delivery scheduled for September 12.</div>
</div>`,
    }),
  },
  {
    id: 'indicator',
    title: 'The mark, and which side it stands on',
    note: 'The chevron turns rather than pointing along the inline axis, so a right-to-left document needs no mirrored artwork; plus-minus is one pair drawn on one grid, and none draws nothing.',
    snippet: defineSnippet({
      id: 'collapsible-angular-indicator',
      language: 'angular',
      label: 'Two marks, and the start edge',
      source: `<div slCollapsible indicator="plus-minus" togglePlacement="start">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>Invoice</button>
  </h3>
  <div slCollapsiblePanel>Issued on September 3.</div>
</div>`,
    }),
  },
  {
    id: 'heading',
    title: 'Where it sits in the outline',
    note: 'The element is the consumer’s own: a real heading is left alone, and anything else is given role="heading" and the level — the alternative the pattern names.',
    snippet: defineSnippet({
      id: 'collapsible-angular-heading',
      language: 'angular',
      label: 'The consumer’s own element',
      source: `<div slCollapsible level="3">
  <div slCollapsibleHeader>
    <button slCollapsibleTrigger>Return conditions</button>
  </div>
  <div slCollapsiblePanel>Thirty calendar days.</div>
</div>`,
    }),
  },
  {
    id: 'description',
    title: 'A summary that stays visible',
    note: 'The second line is inside the trigger and therefore inside the accessible name, which is what the pattern means by a snippet of the hidden content staying visible.',
    snippet: defineSnippet({
      id: 'collapsible-angular-description',
      language: 'angular',
      label: 'Title and summary in one control',
      source: `<button slCollapsibleTrigger description="2 regras ativas">Regras de frete</button>`,
    }),
  },
  {
    id: 'actions',
    title: 'A control beside the heading',
    note: 'It is a sibling of the heading rather than a child, because the pattern requires the button to be the only element inside it — and a control inside a button is invalid besides.',
    snippet: defineSnippet({
      id: 'collapsible-angular-actions',
      language: 'angular',
      label: 'A toolbar on the header’s row',
      source: `<div slCollapsible variant="framed" [open]="true">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>Regras de frete</button>
  </h3>
  <div slCollapsibleActions>
    <div slToolbar aria-label="Rule actions" size="sm">
      <button slButton size="sm" variant="ghost">Edit</button>
    </div>
  </div>
  <div slCollapsiblePanel>Free shipping over $250.00.</div>
</div>`,
    }),
  },
  {
    id: 'mount',
    title: 'When the content exists',
    note: 'eager builds it up front so the panel can transition closed, lazy waits for the first open, active drops it each time, and until-found lets the browser’s page search open the panel.',
    snippet: defineSnippet({
      id: 'collapsible-angular-mount',
      language: 'angular',
      label: 'Content built on the first open',
      source: `<div slCollapsible mount="lazy">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>Delivery history</button>
  </h3>
  <div slCollapsiblePanel>
    <ng-template slCollapsibleContent>{{ history() }}</ng-template>
  </div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family paints',
    note: 'Hover lays a wash under the row and press goes one step further; disabled answers neither, because the browser has already taken the control out of action; loading holds the box open and says so.',
    snippet: defineSnippet({
      id: 'collapsible-angular-states',
      language: 'angular',
      label: 'Disabled, and a panel still loading',
      source: `<div slCollapsible [loading]="true" [open]="true" mount="lazy">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>Delivery history</button>
  </h3>
  <div slCollapsiblePanel>
    <span slSkeleton shape="text"></span>
  </div>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A long title grows the row instead of pushing the mark off the line, truncate clips it to one line with the whole string still in the DOM, and a title in another script reads its own way.',
    snippet: defineSnippet({
      id: 'collapsible-angular-content',
      language: 'angular',
      label: 'A title the row cannot hold',
      source: `<div slCollapsible [truncate]="true">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>Return conditions for international orders</button>
  </h3>
  <div slCollapsiblePanel>Thirty calendar days.</div>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'provideCollapsibleDefaults carries the seven decisions an application takes once, exportAs reaches the instance, and a disclosure nests inside another’s panel without the outer one opening it.',
    snippet: defineSnippet({
      id: 'collapsible-angular-composition',
      language: 'ts',
      label: 'Seven decisions, taken once',
      source: `bootstrapApplication(App, {
  providers: [provideCollapsibleDefaults({ variant: 'framed', size: 'sm' })],
});`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The pattern’s table, and which device asked',
    note: 'Enter and Space toggle because the trigger is a button; Tab reaches it like any other control, because the pattern keeps every disclosure in the page tab sequence.',
    snippet: defineSnippet({
      id: 'collapsible-angular-keyboard',
      language: 'angular',
      label: 'Reading the reason off the request',
      source: `<div slCollapsible (openChangeRequest)="reason.set($event.reason)">
  <h3 slCollapsibleHeader>
    <button slCollapsibleTrigger>With the pointer, then with the keyboard</button>
  </h3>
  <div slCollapsiblePanel>The reason changes with the device.</div>
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'The write-back half of the two-way binding. `[(open)]="open"` keeps a signal in step with the panel, which is the form this ecosystem expects of a value a component and a template share.',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the panel moves. The request carries the new value, the value it replaces, the reason (pointer, keyboard, select or programmatic), the originating event, and cancel(), which refuses the move before anything commits. Inside an slAccordion it still fires, so a consumer may watch one panel without unpacking the set’s array.',
  },
  {
    name: 'click, focus, keydown, on the trigger',
    payload: 'the element’s own events',
    when: 'Whenever the button fires them. The listener is on the host, so a consumer’s own (click) runs beside it rather than in place of it, and preventDefault() refuses the toggle.',
  },
];

export const ANGULAR_COLLAPSIBLE_DOCS = {
  collapsible: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'open',
        'model<boolean>',
        'false',
        'slCollapsible',
        'Whether the panel is open. A model, so [(open)] is both the value and the write-back — the initial value is the uncontrolled start and a bound signal is the controlled one. Inside an slAccordion the set owns it instead',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slCollapsible, slAccordion, provideCollapsibleDefaults',
        'The step the header sits at. The title comes from the type scale and everything geometric from the control scales, so a density changes the rhythm rather than the reading size',
      ],
      [
        'variant',
        "'plain' | 'ruled' | 'framed'",
        'plain',
        'slCollapsible, provideCollapsibleDefaults',
        'plain paints no chrome, ruled draws a hairline above the header so a stack reads as one list, and framed is its own card. An slAccordion hands its items the one its own variant maps onto',
      ],
      [
        'indicator',
        "'chevron' | 'plus-minus' | 'none'",
        'chevron',
        'slCollapsible, slAccordion, provideCollapsibleDefaults',
        'The mark, drawn from a glyph token. The chevron turns between down and up rather than pointing along the inline axis, so nothing is mirrored for a right-to-left document',
      ],
      [
        'togglePlacement',
        "'end' | 'start'",
        'end',
        'slCollapsible, slAccordion, provideCollapsibleDefaults',
        'Which side of the words the mark stands on. With it at the start the panel’s content is indented to line up with the title rather than with the mark',
      ],
      [
        'level',
        "'none' | '1' | '2' | '3' | '4' | '5' | '6'",
        'none',
        'slCollapsible, provideCollapsibleDefaults',
        'The heading level the header answers to. A native heading element is left alone; anything else is given role="heading" and this level. none writes no heading semantics at all',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager' | 'until-found'",
        'eager',
        'slCollapsible, slAccordion, provideCollapsibleDefaults',
        'When the panel’s content exists. The box always does, so aria-controls never names an element that is gone. lazy needs an ng-template[slCollapsibleContent], because projected content is built whether or not it is inserted',
      ],
      [
        'truncate',
        'boolean',
        'false',
        'slCollapsible, slAccordion, provideCollapsibleDefaults',
        'Clips the title to one line instead of letting the row grow. The whole string stays in the DOM, which the library decided once for every family',
      ],
      [
        'region',
        'boolean',
        'false',
        'slCollapsible',
        'Makes the panel a region landmark. Off by default, because the pattern’s own example warns that a landmark per panel fills the landmark list',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slCollapsible',
        'Reaches the trigger as the native attribute, which is also what stops the press. Unstated rather than false, so the disclosure defers to the slAccordion around it',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slCollapsible',
        'The panel keeps a line’s height and carries aria-busy; what stands in for the content is slSkeleton, composed by the consumer',
      ],
      [
        'value',
        'string',
        'from SlCollapsibleIdFactory',
        'slCollapsible',
        'What this disclosure is called inside an slAccordion. It is identity rather than state, and it reaches the DOM as data-value',
      ],
      [
        'description',
        'string',
        '—',
        'slCollapsibleTrigger',
        'A second line under the title, inside the trigger and therefore inside its accessible name',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        "'slCollapsible' | 'slCollapsibleHeader' | 'slCollapsibleTrigger' | 'slCollapsiblePanel'",
        '—',
        'every part',
        'Reaches the instance from the template: #panel="slCollapsible" gives isOpen(), toggle(next, reason) and the resolved axes without a component class in between',
      ],
      [
        'slCollapsibleContent',
        'ng-template',
        '—',
        'inside slCollapsiblePanel',
        'Content built the first time the panel opens. ng-content is instantiated whether or not it is inserted, so lazy needs a template — which is Angular Material’s own matExpansionPanelContent',
      ],
      [
        'provideCollapsibleDefaults',
        '(defaults: Partial<CollapsibleDefaults>) => Provider',
        '—',
        'an injector',
        'The seven decisions an application takes once. An slAccordion sits between it and the item, and a disclosure that states any of them itself still wins',
      ],
      [
        'the element each directive is on',
        'any',
        '—',
        'slCollapsible, slCollapsibleHeader, slCollapsibleActions, slCollapsiblePanel',
        'Every part but the trigger attaches to the consumer’s own element, so a disclosure can be a section and a heading can be an h2 without a render prop existing',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Disclosure (w3.org/WAI/ARIA/apg/patterns/disclosure/), and inside an slAccordion it answers the Accordion pattern as well. Its whole keyboard table is the platform’s: the trigger is a button, so Enter and Space toggle without the family binding a key, and Tab reaches it like any other control — the pattern requires every focusable element in an accordion to be in the page tab sequence, which is why nothing here writes tabindex.',
      'The trigger carries aria-expanded and aria-controls; the panel carries aria-labelledby pointing back. Both identifiers come from an application-scoped factory, so two applications rendering in one server process do not collide and the server and client sequences match. The panel’s box is never removed — mount drops its content, not the box — because aria-controls naming an element that is not there is a reference a screen reader has to make sense of.',
      'The heading is the element the consumer wrote. A native h1 to h6 is left exactly as it is; anything else is given role="heading" and the resolved aria-level, which the pattern names as the alternative to a native element. React reads the element off level instead, because there the component owns the tag; both reach the same accessibility tree.',
      'A closed panel is out of the tab sequence and out of the accessibility tree twice over: the stylesheet with content-visibility, and the directive with inert, so a browser without the property still cannot put focus inside it. Under mount="until-found" neither applies: hidden="until-found" is what lets the browser’s page search reach the text and open the panel, and beforematch is what tells the family to.',
      'aria-disabled appears on the trigger only when an slAccordion refuses to let this panel close. That is the pattern’s own instruction for a set that requires one panel to stay open, and it leaves the control focusable and announced rather than removing it from the reader’s path.',
      'The element is a button and a region rather than details and summary. What that costs is written down: a page with JavaScript disabled cannot open a panel. What it buys is the accordion pattern — a summary cannot be wrapped in a heading — a value a template can bind, a request that carries a reason, and a panel that animates without interpolate-size.',
    ],
    snippets: [
      defineSnippet({
        id: 'collapsible-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div
  data-ui="collapsible"
  data-part="root"
  data-size="md"
  data-variant="ruled"
  data-indicator="chevron"
  data-toggle-placement="end"
  data-mount="eager"
  data-value="delivery"
  data-open
>
  <h3 data-part="header">
    <button data-part="trigger" id="t-a" aria-controls="p-a" aria-expanded="true" type="button">
      <span data-part="indicator" aria-hidden="true"></span>
      <span data-part="label">Delivery</span>
      <span data-part="description">3 of 12 items</span>
    </button>
  </h3>
  <div data-part="actions">…</div>
  <div data-part="panel" id="p-a" aria-labelledby="t-a">
    <div data-part="content">…</div>
  </div>
</div>`,
      }),
      defineSnippet({
        id: 'collapsible-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='collapsible'] {
  --slotted-collapsible-rule-color: var(--slotted-border-strong);
  --slotted-collapsible-hover-background: var(--slotted-tone-accent-surface);
  --slotted-collapsible-indicator-color: var(--slotted-tone-accent-text);
  --slotted-collapsible-radius: var(--slotted-radius-lg);
}`,
      }),
    ],
  },
} as const;
