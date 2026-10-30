import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import accordionTokens from '@slotted/styles/accordion/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_ACCORDION_TOKENS = accordionTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Accordion decision',
}));

const imports: ReferenceImport = {
  source: "import { SlAccordion } from '@slotted/angular/accordion';",
  selector: '[slAccordion]',
  exportAs: 'slAccordion',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slAccordion',
    required: true,
    purpose:
      'The set. A single column carrying data-ui="accordion", data-size, data-variant and data-disabled, and the chrome that belongs to the set rather than to one item — the rule under the last one, the frame around them all, the air between cards. Its items are slCollapsibles: a family beside this one, never a part of it, so nothing here selects into their DOM.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One set with every input on it, driven by the controls below the canvas. Tab reaches every header; the arrows move between them without opening anything.',
    snippet: defineSnippet({
      id: 'accordion-angular-playground',
      language: 'angular',
      label: 'A set of sections that share a value',
      source: `<div slAccordion [(value)]="open">
  <div slCollapsible value="delivery">
    <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery</button></h3>
    <div slCollapsiblePanel>Scheduled for September 12.</div>
  </div>
  <div slCollapsible value="payment">
    <h3 slCollapsibleHeader><button slCollapsibleTrigger>Payment</button></h3>
    <div slCollapsiblePanel>Credit card, approved.</div>
  </div>
</div>`,
    }),
  },
  {
    id: 'multiple',
    title: 'One panel open, or several',
    note: 'With multiple off, opening one closes the one that was — and that panel is told it closed with the reason select, not because the reader asked it to.',
    snippet: defineSnippet({
      id: 'accordion-angular-multiple',
      language: 'angular',
      label: 'Several panels at once',
      source: `<div slAccordion [multiple]="true" [value]="['delivery', 'payment']">…</div>`,
    }),
  },
  {
    id: 'requireOpen',
    title: 'A set that refuses to empty',
    note: 'The one open header carries aria-disabled="true", which is the pattern’s own instruction for an accordion that does not permit its panel to be collapsed. It stays focusable and announced.',
    snippet: defineSnippet({
      id: 'accordion-angular-require-open',
      language: 'angular',
      label: 'One panel always open',
      source: `<div slAccordion [requireOpen]="true" [value]="['delivery']">…</div>`,
    }),
  },
  {
    id: 'variant',
    title: 'The four ways a set is drawn',
    note: 'ruled puts one hairline per seam and closes the stack at the bottom, framed wraps that set in one frame, separated gives each item a card, and plain paints nothing at all.',
    snippet: defineSnippet({
      id: 'accordion-angular-variant',
      language: 'angular',
      label: 'The set’s variant, and the item’s',
      source: `<div slAccordion variant="separated">…</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the set sits at',
    note: 'The set hands the step to every item, so one word moves the type of every title and the rhythm of every row at once. The gap between cards moves with it.',
    snippet: defineSnippet({
      id: 'accordion-angular-sizes',
      language: 'angular',
      label: 'One step for the whole set',
      source: `<div slAccordion size="lg" variant="separated">…</div>`,
    }),
  },
  {
    id: 'mount',
    title: 'When each panel’s content exists',
    note: 'The set hands the strategy to every item: eager keeps every panel ready to transition, lazy builds one on its first open, and active drops each one as it closes.',
    snippet: defineSnippet({
      id: 'accordion-angular-mount',
      language: 'angular',
      label: 'A set of panels that fetch',
      source: `<div slAccordion mount="lazy">
  <div slCollapsible value="delivery">
    <h3 slCollapsibleHeader><button slCollapsibleTrigger>Delivery</button></h3>
    <div slCollapsiblePanel>
      <ng-template slCollapsibleContent>{{ delivery() }}</ng-template>
    </div>
  </div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the set paints',
    note: 'A disabled set reaches every trigger as the native attribute, and one item may be out of action inside a live set. Hover and press are the item’s, held back for both.',
    snippet: defineSnippet({
      id: 'accordion-angular-states',
      language: 'angular',
      label: 'The set, and one item on its own',
      source: `<div slAccordion>
  <div slCollapsible value="nota" [disabled]="true">…</div>
</div>`,
    }),
  },
  {
    id: 'imperative',
    title: 'Opening and closing everything',
    note: 'exportAs reaches the set from the template, so the pair Angular Material ships needs no component class in between and no handle to be passed down.',
    snippet: defineSnippet({
      id: 'accordion-angular-imperative',
      language: 'angular',
      label: 'The two moves an array cannot express',
      source: `<div slAccordion #set="slAccordion" [multiple]="true">…</div>

<button slButton (click)="set.openAll()">Open all</button>
<button slButton (click)="set.closeAll()">Close all</button>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the set did not choose',
    note: 'A hundred sections, a title longer than its row, and an accordion nested inside another’s panel — which stays closed, because nothing in the family is a descendant rule.',
    snippet: defineSnippet({
      id: 'accordion-angular-content',
      language: 'angular',
      label: 'A set inside a panel',
      source: `<div slCollapsiblePanel>
  <div slAccordion variant="plain">…</div>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'provideAccordionDefaults carries the ten decisions an application takes once, and a set that states any of them still wins over it.',
    snippet: defineSnippet({
      id: 'accordion-angular-composition',
      language: 'ts',
      label: 'Ten decisions, taken once',
      source: `bootstrapApplication(App, {
  providers: [provideAccordionDefaults({ variant: 'separated', multiple: true })],
});`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The pattern’s table, and the four keys beside it',
    note: 'Every header is a Tab stop, which is what the pattern requires; the arrows, Home and End move focus on top of that sequence and open nothing at all.',
    snippet: defineSnippet({
      id: 'accordion-angular-keyboard',
      language: 'angular',
      label: 'Reading the reason off the request',
      source: `<div slAccordion (valueChangeRequest)="reason.set($event.reason)">…</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'readonly string[]',
    when: 'The write-back half of the two-way binding. `[(value)]="open"` keeps a signal in step with the set of open panels, which is the form this ecosystem expects.',
  },
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<readonly string[]>',
    when: 'Before the set of open panels moves. The request carries the new set, the set it replaces, the reason (pointer, keyboard, select or programmatic), the originating event, and cancel(), which refuses the move before anything commits. Two sets holding the same values in any order are the same set, so no request is emitted for a move that changes nothing.',
  },
  {
    name: 'openChangeRequest, on each item',
    payload: 'ChangeRequest<boolean>',
    when: 'Before that one panel moves, and before the set is asked. It is what lets a consumer watch one section without unpacking the array, and cancelling it stops the set from being asked at all.',
  },
  {
    name: 'focusin, keydown, on the set',
    payload: 'the element’s own events',
    when: 'Whenever the set fires them. Which header has focus is read from $event.target.dataset.value, which is why the family ships no separate focus-change output.',
  },
];

export const ANGULAR_ACCORDION_DOCS = {
  accordion: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'model<readonly string[]>',
        '[]',
        'slAccordion',
        'The set of open panels. A model, so [(value)] is both the value and the write-back — the initial value is the uncontrolled start and a bound signal is the controlled one. Each entry is an slCollapsible’s value',
      ],
      [
        'multiple',
        'boolean',
        'false',
        'slAccordion, provideAccordionDefaults',
        'Whether more than one panel may be open. With it off, opening one closes the one that was, and that panel is told the reason was select',
      ],
      [
        'requireOpen',
        'boolean',
        'false',
        'slAccordion, provideAccordionDefaults',
        'Whether the set refuses to empty. The one open header then carries aria-disabled="true", which is what the pattern asks of an accordion that does not permit its panel to be collapsed',
      ],
      [
        'loop',
        'boolean',
        'true',
        'slAccordion, provideAccordionDefaults',
        'Whether the arrow keys wrap past the ends of the set',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slAccordion, provideAccordionDefaults',
        'The step every item sits at, and the air between cards under separated',
      ],
      [
        'variant',
        "'plain' | 'ruled' | 'framed' | 'separated'",
        'ruled',
        'slAccordion, provideAccordionDefaults',
        'How the set is drawn. Each value maps onto the item variant the set hands over: plain to plain, ruled and framed to ruled, separated to framed. The set never selects into an item to draw it',
      ],
      [
        'indicator',
        "'chevron' | 'plus-minus' | 'none'",
        'chevron',
        'slAccordion, provideAccordionDefaults',
        'The mark every header carries, handed to each item',
      ],
      [
        'togglePlacement',
        "'end' | 'start'",
        'end',
        'slAccordion, provideAccordionDefaults',
        'Which side of the words that mark stands on, handed to each item',
      ],
      [
        'headingLevel',
        "'none' | '1' | '2' | '3' | '4' | '5' | '6'",
        '3',
        'slAccordion, provideAccordionDefaults',
        'The heading level every item’s header answers to. A native heading element the consumer wrote is left alone; anything else is given role="heading" and this level',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager' | 'until-found'",
        'eager',
        'slAccordion, provideAccordionDefaults',
        'When each panel’s content exists, handed to every item',
      ],
      [
        'truncate',
        'boolean',
        'false',
        'slAccordion, provideAccordionDefaults',
        'Clips every title to one line instead of letting the row grow',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slAccordion',
        'Reaches every item, and every trigger as the native attribute',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        "'slAccordion'",
        '—',
        'slAccordion',
        '#set="slAccordion" reaches the instance from the template: openAll(), closeAll(), holds(value), isHeld(value) and every resolved axis, with no component class in between',
      ],
      [
        'openAll, closeAll',
        '() => void',
        '—',
        'the instance',
        'The two moves an array cannot express while the family owns the array. Both carry the reason programmatic; openAll skips a disabled item, and closeAll leaves one open when requireOpen holds it',
      ],
      [
        'provideAccordionDefaults',
        '(defaults: Partial<AccordionDefaults>) => Provider',
        '—',
        'an injector',
        'The ten decisions an application takes once. A set that states any of them itself still wins',
      ],
      [
        'the element the directive is on',
        'any',
        '—',
        'slAccordion',
        'The set attaches to the consumer’s own element, so a set of sections can be a section without a render prop existing',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Accordion (w3.org/WAI/ARIA/apg/patterns/accordion/). Its keyboard table is four keys and all four are the platform’s: Enter and Space toggle the focused header because it is a button, and Tab and Shift + Tab move through the set because every focusable element in an accordion is in the page tab sequence. Nothing here writes tabindex.',
      'ArrowDown, ArrowUp, Home and End are a deliberate departure, and the cost is written down. The arrows were optional guidance until w3c/aria-practices#3434 removed them, and Base UI deprecated its own loopFocus and orientation in the same change; Radix and Ark still ship them and readers have learned them. Here they are additive — they move focus between headers, open nothing, and take no header out of the tab sequence — so a reader who does not know them loses nothing.',
      'Each header is a heading at the level headingLevel names, and the trigger is its only element, which is what the pattern requires. The set itself carries no role: a group of headings is already an outline a reader can navigate, and a container announced around it is one more thing to move past.',
      'requireOpen writes aria-disabled="true" on the one header the set will not let close. The pattern asks for exactly that, and the APG’s own example is the only surveyed implementation that ships it; the header stays focusable and announced rather than leaving the reader’s path.',
      'A horizontal accordion is not shipped. Radix and Ark both offer one and Base UI has deprecated its own; a horizontally stacked set of sections of which one is open is a tab list, and slTabs owns it — with the marker, the scrolling list and that pattern’s own keyboard model.',
      'A nested set is two sets. The arrow ring is scoped to the headers this set owns, so arrowing through an outer accordion never falls into an inner one, and the inner panel stays closed while the outer is open.',
    ],
    snippets: [
      defineSnippet({
        id: 'accordion-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="accordion" data-part="root" data-size="md" data-variant="ruled">
  <div data-ui="collapsible" data-part="root" data-variant="ruled" data-value="delivery" data-open>
    <h3 data-part="header">
      <button data-part="trigger" aria-expanded="true" aria-controls="p-a" type="button">…</button>
    </h3>
    <div data-part="panel" id="p-a">
      <div data-part="content">…</div>
    </div>
  </div>
</div>`,
      }),
      defineSnippet({
        id: 'accordion-theming',
        language: 'css',
        label: 'Retuning the set for an application',
        source: `[data-ui='accordion'] {
  --slotted-accordion-rule-color: var(--slotted-border-strong);
  --slotted-accordion-radius: var(--slotted-radius-lg);
  --slotted-accordion-gap: var(--slotted-space-6);
}`,
      }),
    ],
  },
} as const;
