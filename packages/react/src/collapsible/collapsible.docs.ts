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

export const REACT_COLLAPSIBLE_TOKENS = collapsibleTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Collapsible decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Collapsible, CollapsibleActions, CollapsibleDefaultsProvider, CollapsibleHeader, CollapsiblePanel, CollapsibleTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The family. A two-column, two-row grid carrying data-ui="collapsible", the six axes, data-open, data-disabled, data-loading and data-value. It is also its own container, so the header reflows on its own inline size rather than the viewport’s.',
  },
  {
    part: 'header',
    element: 'h1 to h6, or a div at level="none"',
    required: true,
    purpose:
      'The heading. level decides the element, and the accordion sets it for a whole set at once. Its only child is the trigger: the pattern requires the button to be the only element inside the heading.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'The control. Holds aria-expanded, aria-controls, the identifier, and every native prop and ref the consumer wrote. Enter and Space are the platform’s, so the family binds no key of its own.',
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
      'The title. A box of its own, so text-overflow has something to clip under truncate and so a title in another script reads its own way without reordering the row around it.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose:
      'A second line under the title. It is inside the trigger, so it is part of the accessible name — “Delivery, 3 of 12 items” is what a reader hears.',
  },
  {
    part: 'actions',
    element: 'div, or the element render returns',
    required: false,
    purpose:
      'The always-visible controls beside the header, on its own row and outside the button. What belongs in it is a Toolbar. Below 22rem it takes a row of its own.',
  },
  {
    part: 'panel',
    element: 'div, optionally role="region"',
    required: true,
    purpose:
      'The box the trigger controls: aria-labelledby its trigger, inert while closed, and hidden="until-found" under that mount. The box always exists, so aria-controls never names an element that is gone.',
  },
  {
    part: 'content',
    element: 'div',
    required: true,
    purpose:
      'What the panel’s grid track clips. Its content-visibility is what takes closed content out of the tab sequence, out of the accessibility tree and out of the browser’s page search. mount decides whether it is built at all.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One disclosure with every axis on it, driven by the controls below the canvas. Tab lands on the trigger; Enter and Space are the platform’s.',
    snippet: defineSnippet({
      id: 'collapsible-react-playground',
      language: 'tsx',
      label: 'A header and the panel it controls',
      source: `<Collapsible defaultOpen>
  <CollapsibleHeader>
    <CollapsibleTrigger>Delivery address</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>402 Maple Street — Seattle.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'variant',
    title: 'The three ways it is drawn',
    note: 'plain paints no chrome, ruled puts a hairline above the header so a stack reads as one list, and framed is a card. All three keep the same geometry.',
    snippet: defineSnippet({
      id: 'collapsible-react-variant',
      language: 'tsx',
      label: 'plain, ruled and framed',
      source: `<Collapsible variant="framed" defaultOpen>
  <CollapsibleHeader>
    <CollapsibleTrigger>Payment methods</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>Credit card, ACH transfer and Zelle.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the header sits at',
    note: 'The title comes from the type scale, because a header is prose; the row’s height, padding, gap and mark come from the control scales, so a dense page is tighter rather than smaller.',
    snippet: defineSnippet({
      id: 'collapsible-react-sizes',
      language: 'tsx',
      label: 'sm, md and lg',
      source: `<Collapsible size="lg" defaultOpen>
  <CollapsibleHeader>
    <CollapsibleTrigger description="3 of 12 items">Summary</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>Delivery scheduled for September 12.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'indicator',
    title: 'The mark, and which side it stands on',
    note: 'The chevron turns rather than pointing along the inline axis, so a right-to-left document needs no mirrored artwork; plus-minus is one pair drawn on one grid, and none draws nothing.',
    snippet: defineSnippet({
      id: 'collapsible-react-indicator',
      language: 'tsx',
      label: 'Two marks, and the start edge',
      source: `<Collapsible indicator="plus-minus" togglePlacement="start">
  <CollapsibleHeader>
    <CollapsibleTrigger>Invoice</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>Issued on September 3.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'heading',
    title: 'Where it sits in the outline',
    note: 'level renders the heading element itself, so a screen reader’s heading list holds the disclosure at the right depth. none renders a div, for a control that belongs to no outline.',
    snippet: defineSnippet({
      id: 'collapsible-react-heading',
      language: 'tsx',
      label: 'A real heading around the trigger',
      source: `<Collapsible level="3">
  <CollapsibleHeader>
    <CollapsibleTrigger>Return conditions</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>Thirty calendar days.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'description',
    title: 'A summary that stays visible',
    note: 'The second line is inside the trigger and therefore inside the accessible name, which is what the pattern means by a snippet of the hidden content staying visible.',
    snippet: defineSnippet({
      id: 'collapsible-react-description',
      language: 'tsx',
      label: 'Title and summary in one control',
      source: `<CollapsibleTrigger description="2 regras ativas">Regras de frete</CollapsibleTrigger>;`,
    }),
  },
  {
    id: 'actions',
    title: 'A control beside the heading',
    note: 'It is a sibling of the heading rather than a child, because the pattern requires the button to be the only element inside it — and a control inside a button is invalid besides.',
    snippet: defineSnippet({
      id: 'collapsible-react-actions',
      language: 'tsx',
      label: 'A toolbar on the header’s row',
      source: `<Collapsible variant="framed" defaultOpen>
  <CollapsibleHeader>
    <CollapsibleTrigger>Regras de frete</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsibleActions>
    <Toolbar aria-label="Rule actions" size="sm">
      <Button size="sm" variant="ghost">
        Edit
      </Button>
    </Toolbar>
  </CollapsibleActions>
  <CollapsiblePanel>Free shipping over $250.00.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'mount',
    title: 'When the content exists',
    note: 'eager builds it up front so the panel can transition closed, lazy builds it on the first open, active drops it each time, and until-found lets the browser’s own page search open the panel. A closed item under active commits once and reads no layout and no computed style; it creates no observer and no portal. Fifty closed items inside an Accordion, measured in Chrome: 7 ms of script and 23 ms to layout with a production build of React, 46 ms of script and 83 ms to layout with its development build.',
    snippet: defineSnippet({
      id: 'collapsible-react-mount',
      language: 'tsx',
      label: 'Four answers, one axis',
      source: `<Collapsible mount="until-found">
  <CollapsibleHeader>
    <CollapsibleTrigger>Delivery history</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>Delivered on September 2 by Anna Rivers.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family paints',
    note: 'Hover lays a wash under the row and press goes one step further; disabled answers neither, because the browser has already taken the control out of action; loading holds the box open and says so.',
    snippet: defineSnippet({
      id: 'collapsible-react-states',
      language: 'tsx',
      label: 'Disabled, and a panel still loading',
      source: `<Collapsible loading defaultOpen mount="lazy">
  <CollapsibleHeader>
    <CollapsibleTrigger>Delivery history</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>
    <Skeleton shape="text" />
  </CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A long title grows the row instead of pushing the mark off the line, truncate clips it to one line with the whole string still in the DOM, and a title in another script reads its own way.',
    snippet: defineSnippet({
      id: 'collapsible-react-content',
      language: 'tsx',
      label: 'A title the row cannot hold',
      source: `<Collapsible truncate>
  <CollapsibleHeader>
    <CollapsibleTrigger>Return conditions for international orders</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>Thirty calendar days.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the seven decisions an application takes once, render substitutes every root, and a disclosure nests inside another’s panel without the outer one opening it.',
    snippet: defineSnippet({
      id: 'collapsible-react-composition',
      language: 'tsx',
      label: 'Seven decisions, taken once',
      source: `<CollapsibleDefaultsProvider variant="framed" size="sm">
  <Collapsible>…</Collapsible>
</CollapsibleDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The pattern’s table, and which device asked',
    note: 'Enter and Space toggle because the trigger is a button; Tab reaches it like any other control, because the pattern keeps every disclosure in the page tab sequence.',
    snippet: defineSnippet({
      id: 'collapsible-react-keyboard',
      language: 'tsx',
      label: 'Reading the reason off the request',
      source: `<Collapsible onOpenChange={(open, request) => report(request.reason)}>
  <CollapsibleHeader>
    <CollapsibleTrigger>With the pointer, then with the keyboard</CollapsibleTrigger>
  </CollapsibleHeader>
  <CollapsiblePanel>The reason changes with the device.</CollapsiblePanel>
</Collapsible>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the panel moves. The request carries the new value, the value it replaces, the reason (pointer, keyboard, select or programmatic), the originating event, and cancel(), which refuses the move before anything commits. Inside an Accordion it still fires, so a consumer may watch one panel without unpacking the set’s array.',
  },
  {
    name: 'onClick, onFocus, onKeyDown, on the trigger',
    payload: 'the element’s own events',
    when: 'Whenever the button fires them. The family composes with a consumer’s handler rather than replacing it: the consumer’s runs first, and preventDefault() in onClick refuses the toggle as well.',
  },
];

export const REACT_COLLAPSIBLE_DOCS = {
  collapsible: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'open',
        'boolean',
        '—',
        'Collapsible',
        'Present means the consumer owns the state, for the life of the component. Inside an Accordion the set owns it instead, and an explicit open still wins over both',
      ],
      [
        'defaultOpen',
        'boolean',
        '—',
        'Collapsible',
        'The value an uncontrolled disclosure starts from, read once. A later change to it does not silently become new state',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Collapsible, Accordion, CollapsibleDefaultsProvider',
        'The step the header sits at. The title comes from the type scale and everything geometric from the control scales, so a density changes the rhythm rather than the reading size',
      ],
      [
        'variant',
        "'plain' | 'ruled' | 'framed'",
        'plain',
        'Collapsible, CollapsibleDefaultsProvider',
        'plain paints no chrome, ruled draws a hairline above the header so a stack reads as one list, and framed is its own card. An Accordion hands its items the one its own variant maps onto',
      ],
      [
        'indicator',
        "'chevron' | 'plus-minus' | 'none'",
        'chevron',
        'Collapsible, Accordion, CollapsibleDefaultsProvider',
        'The mark, drawn from a glyph token. The chevron turns between down and up rather than pointing along the inline axis, so nothing is mirrored for a right-to-left document',
      ],
      [
        'togglePlacement',
        "'end' | 'start'",
        'end',
        'Collapsible, Accordion, CollapsibleDefaultsProvider',
        'Which side of the words the mark stands on. With it at the start the panel’s content is indented to line up with the title rather than with the mark',
      ],
      [
        'level',
        "'none' | '1' | '2' | '3' | '4' | '5' | '6'",
        'none',
        'Collapsible, CollapsibleDefaultsProvider',
        'The heading element the trigger is wrapped in. none renders a div and writes no heading semantics; an Accordion sets it for a whole set through headingLevel',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager' | 'until-found'",
        'eager',
        'Collapsible, Accordion, CollapsibleDefaultsProvider',
        'When the panel’s content exists. The box always does, so aria-controls never names an element that is gone. until-found writes hidden="until-found" and answers beforematch by opening',
      ],
      [
        'truncate',
        'boolean',
        'false',
        'Collapsible, Accordion, CollapsibleDefaultsProvider',
        'Clips the title to one line instead of letting the row grow. The whole string stays in the DOM, which the library decided once for every family',
      ],
      [
        'region',
        'boolean',
        'false',
        'Collapsible',
        'Makes the panel a region landmark. Off by default, because the pattern’s own example warns that a landmark per panel fills the landmark list',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Collapsible',
        'Reaches the trigger as the native attribute, which is also what stops the press. Unstated rather than false, so the disclosure defers to the Accordion around it',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Collapsible',
        'The panel keeps a line’s height and carries aria-busy; what stands in for the content is Skeleton, composed by the consumer',
      ],
      [
        'value',
        'string',
        'from useId',
        'Collapsible',
        'What this disclosure is called inside an Accordion. It is identity rather than state, and it reaches the DOM as data-value',
      ],
      [
        'description',
        'ReactNode',
        '—',
        'CollapsibleTrigger',
        'A second line under the title, inside the trigger and therefore inside its accessible name',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Collapsible, CollapsibleHeader, CollapsibleTrigger, CollapsibleActions, CollapsiblePanel',
        'Substitutes any of the five roots and hands it every attribute — a disclosure can be a section, a panel an article. The heading may become another element, but the trigger has to stay its only child',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'every part',
        'Reaches the element itself, so focus() and click() are the platform’s and no imperative handle is invented for what it already ships',
      ],
      [
        'useCollapsible()',
        '() => CollapsibleContextValue',
        '—',
        'inside Collapsible',
        'What the parts read: the open state, the identifiers, the mount strategy, whether the group holds this one open, and toggle(next, reason). It throws outside a family rather than rendering a control that does nothing',
      ],
      [
        'CollapsibleDefaultsProvider',
        '{ size, variant, indicator, togglePlacement, level, mount, truncate }',
        '—',
        'a subtree',
        'The seven decisions an application takes once. An Accordion sits between it and the item, and a disclosure that states any of them itself still wins',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Disclosure (w3.org/WAI/ARIA/apg/patterns/disclosure/), and inside an Accordion it answers the Accordion pattern as well. Its whole keyboard table is the platform’s: the trigger is a button, so Enter and Space toggle without the family binding a key, and Tab reaches it like any other control — the pattern requires every focusable element in an accordion to be in the page tab sequence, which is why nothing here writes tabindex.',
      'The trigger carries aria-expanded and aria-controls; the panel carries aria-labelledby pointing back. Both identifiers come from useId, so a server response and the first client render agree. The panel’s box is never removed — mount drops its content, not the box — because aria-controls naming an element that is not there is a reference a screen reader has to make sense of.',
      'A closed panel is out of the tab sequence and out of the accessibility tree twice over: the stylesheet with content-visibility, and the binding with inert, so a browser without the property still cannot put focus inside it. Under mount="until-found" neither applies: hidden="until-found" is what lets the browser’s page search reach the text and open the panel, and beforematch is what tells the family to.',
      'The heading is real. level renders h1 to h6 and the trigger is its only element, which is what the pattern requires; an accordion sets the level once for a whole set. level="none" writes no heading semantics at all, for a disclosure that belongs to no outline.',
      'aria-disabled appears on the trigger only when an Accordion refuses to let this panel close. That is the pattern’s own instruction for a set that requires one panel to stay open, and it leaves the control focusable and announced rather than removing it from the reader’s path.',
      'The element is a button and a region rather than details and summary. What that costs is written down: a page with JavaScript disabled cannot open a panel. What it buys is the accordion pattern — a summary cannot be wrapped in a heading — a value the consumer can own, a request that carries a reason, and a panel that animates without interpolate-size.',
      'The mark is never the only thing that says the state: aria-expanded says it to a reader, and the indicator turns rather than changing colour, so the high-contrast scheme and forced colours both keep it.',
    ],
    snippets: [
      defineSnippet({
        id: 'collapsible-react-anatomy',
        language: 'tsx',
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
    <button data-part="trigger" id="t-a" aria-controls="p-a" aria-expanded="true">
      <span data-part="indicator" aria-hidden="true" />
      <span data-part="label">Delivery</span>
      <span data-part="description">3 of 12 items</span>
    </button>
  </h3>
  <div data-part="actions">…</div>
  <div data-part="panel" id="p-a" aria-labelledby="t-a">
    <div data-part="content">…</div>
  </div>
</div>;`,
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
