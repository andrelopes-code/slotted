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

export const REACT_ACCORDION_TOKENS = accordionTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Accordion decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Accordion, AccordionDefaultsProvider, Collapsible, CollapsibleHeader, CollapsiblePanel, CollapsibleTrigger } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The set. A single column carrying data-ui="accordion", data-size, data-variant and data-disabled, and the chrome that belongs to the set rather than to one item — the rule under the last one, the frame around them all, the air between cards. Its items are Collapsibles: a family beside this one, never a part of it, so nothing here selects into their DOM.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One set with every axis on it, driven by the controls below the canvas. Tab reaches every header; the arrows move between them without opening anything.',
    snippet: defineSnippet({
      id: 'accordion-react-playground',
      language: 'tsx',
      label: 'A set of sections that share a value',
      source: `<Accordion defaultValue={['delivery']}>
  <Collapsible value="delivery">
    <CollapsibleHeader>
      <CollapsibleTrigger>Delivery</CollapsibleTrigger>
    </CollapsibleHeader>
    <CollapsiblePanel>Scheduled for September 12.</CollapsiblePanel>
  </Collapsible>
  <Collapsible value="payment">
    <CollapsibleHeader>
      <CollapsibleTrigger>Payment</CollapsibleTrigger>
    </CollapsibleHeader>
    <CollapsiblePanel>Credit card, approved.</CollapsiblePanel>
  </Collapsible>
</Accordion>;`,
    }),
  },
  {
    id: 'multiple',
    title: 'One panel open, or several',
    note: 'With multiple off, opening one closes the one that was — and that panel is told it closed with the reason select, not because the reader asked it to.',
    snippet: defineSnippet({
      id: 'accordion-react-multiple',
      language: 'tsx',
      label: 'Several panels at once',
      source: `<Accordion multiple defaultValue={['delivery', 'payment']}>
  …
</Accordion>;`,
    }),
  },
  {
    id: 'requireOpen',
    title: 'A set that refuses to empty',
    note: 'The one open header carries aria-disabled="true", which is the pattern’s own instruction for an accordion that does not permit its panel to be collapsed. It stays focusable and announced.',
    snippet: defineSnippet({
      id: 'accordion-react-require-open',
      language: 'tsx',
      label: 'One panel always open',
      source: `<Accordion requireOpen defaultValue={['delivery']}>
  …
</Accordion>;`,
    }),
  },
  {
    id: 'variant',
    title: 'The four ways a set is drawn',
    note: 'ruled puts one hairline per seam and closes the stack at the bottom, framed wraps that set in one frame, separated gives each item a card, and plain paints nothing at all.',
    snippet: defineSnippet({
      id: 'accordion-react-variant',
      language: 'tsx',
      label: 'The set’s variant, and the item’s',
      source: `<Accordion variant="separated">…</Accordion>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the set sits at',
    note: 'The set hands the step to every item, so one word moves the type of every title and the rhythm of every row at once. The gap between cards moves with it.',
    snippet: defineSnippet({
      id: 'accordion-react-sizes',
      language: 'tsx',
      label: 'One step for the whole set',
      source: `<Accordion size="lg" variant="separated">
  …
</Accordion>;`,
    }),
  },
  {
    id: 'mount',
    title: 'When each panel’s content exists',
    note: 'The set hands the strategy to every item: eager keeps every panel ready to transition, lazy builds one on its first open, and active drops each one as it closes.',
    snippet: defineSnippet({
      id: 'accordion-react-mount',
      language: 'tsx',
      label: 'A set of panels that fetch',
      source: `<Accordion mount="lazy">…</Accordion>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the set paints',
    note: 'A disabled set reaches every trigger as the native attribute, and one item may be out of action inside a live set. Hover and press are the item’s, held back for both.',
    snippet: defineSnippet({
      id: 'accordion-react-states',
      language: 'tsx',
      label: 'The set, and one item on its own',
      source: `<Accordion>
  <Collapsible value="delivery" disabled>
    …
  </Collapsible>
</Accordion>;`,
    }),
  },
  {
    id: 'imperative',
    title: 'Opening and closing everything',
    note: 'A controlled consumer already owns the array and needs neither of these; an uncontrolled one has no array to set, which is the case the handle exists for.',
    snippet: defineSnippet({
      id: 'accordion-react-imperative',
      language: 'tsx',
      label: 'The two moves an array cannot express',
      source: `const set = useRef<AccordionHandle>(null);

<Accordion handle={set} multiple>
  …
</Accordion>;

<Button onClick={() => set.current?.openAll()}>Open all</Button>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the set did not choose',
    note: 'A hundred sections, a title longer than its row, and an accordion nested inside another’s panel — which stays closed, because nothing in the family is a descendant rule.',
    snippet: defineSnippet({
      id: 'accordion-react-content',
      language: 'tsx',
      label: 'A set inside a panel',
      source: `<CollapsiblePanel>
  <Accordion variant="plain">…</Accordion>
</CollapsiblePanel>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'The provider carries the ten decisions an application takes once, and a set that states any of them still wins; render substitutes the set’s own root.',
    snippet: defineSnippet({
      id: 'accordion-react-composition',
      language: 'tsx',
      label: 'Ten decisions, taken once',
      source: `<AccordionDefaultsProvider variant="separated" multiple>
  <Accordion>…</Accordion>
</AccordionDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The pattern’s table, and the four keys beside it',
    note: 'Every header is a Tab stop, which is what the pattern requires; the arrows, Home and End move focus on top of that sequence and open nothing at all.',
    snippet: defineSnippet({
      id: 'accordion-react-keyboard',
      language: 'tsx',
      label: 'Reading the reason off the request',
      source: `<Accordion onValueChange={(value, request) => report(request.reason)}>…</Accordion>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before the set of open panels moves. The request carries the new set, the set it replaces, the reason (pointer, keyboard, select or programmatic), the originating event, and cancel(), which refuses the move before anything commits. Two sets holding the same values in any order are the same set, so no request is emitted for a move that changes nothing.',
  },
  {
    name: 'onOpenChange, on each item',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before that one panel moves, and before the set is asked. It is what lets a consumer watch one section without unpacking the array, and cancelling it stops the set from being asked at all.',
  },
  {
    name: 'onFocusIn, onKeyDown, on the set',
    payload: 'the element’s own events',
    when: 'Whenever the set fires them. Which header has focus is read from event.target.dataset.value, which is why the family ships no separate focus-change output.',
  },
];

export const REACT_ACCORDION_DOCS = {
  accordion: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'readonly string[]',
        '—',
        'Accordion',
        'Present means the consumer owns the set of open panels, for the life of the component. Each entry is a Collapsible’s value',
      ],
      [
        'defaultValue',
        'readonly string[]',
        '—',
        'Accordion',
        'The set an uncontrolled accordion starts from, read once. A later change to it does not silently become new state',
      ],
      [
        'multiple',
        'boolean',
        'false',
        'Accordion, AccordionDefaultsProvider',
        'Whether more than one panel may be open. With it off, opening one closes the one that was, and that panel is told the reason was select',
      ],
      [
        'requireOpen',
        'boolean',
        'false',
        'Accordion, AccordionDefaultsProvider',
        'Whether the set refuses to empty. The one open header then carries aria-disabled="true", which is what the pattern asks of an accordion that does not permit its panel to be collapsed',
      ],
      [
        'loop',
        'boolean',
        'true',
        'Accordion, AccordionDefaultsProvider',
        'Whether the arrow keys wrap past the ends of the set',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'Accordion, AccordionDefaultsProvider',
        'The step every item sits at, and the air between cards under separated',
      ],
      [
        'variant',
        "'plain' | 'ruled' | 'framed' | 'separated'",
        'ruled',
        'Accordion, AccordionDefaultsProvider',
        'How the set is drawn. Each value maps onto the item variant the set hands over: plain to plain, ruled and framed to ruled, separated to framed. The set never selects into an item to draw it',
      ],
      [
        'indicator',
        "'chevron' | 'plus-minus' | 'none'",
        'chevron',
        'Accordion, AccordionDefaultsProvider',
        'The mark every header carries, handed to each item',
      ],
      [
        'togglePlacement',
        "'end' | 'start'",
        'end',
        'Accordion, AccordionDefaultsProvider',
        'Which side of the words that mark stands on, handed to each item',
      ],
      [
        'headingLevel',
        "'none' | '1' | '2' | '3' | '4' | '5' | '6'",
        '3',
        'Accordion, AccordionDefaultsProvider',
        'The heading element every item’s header renders as. 3 is the level the pattern’s own example uses for a set inside a section',
      ],
      [
        'mount',
        "'active' | 'lazy' | 'eager' | 'until-found'",
        'eager',
        'Accordion, AccordionDefaultsProvider',
        'When each panel’s content exists, handed to every item',
      ],
      [
        'truncate',
        'boolean',
        'false',
        'Accordion, AccordionDefaultsProvider',
        'Clips every title to one line instead of letting the row grow',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'Accordion',
        'Reaches every item, and every trigger as the native attribute',
      ],
    ]),
    composition: apiRows([
      [
        'handle',
        'Ref<AccordionHandle>',
        '—',
        'Accordion',
        'openAll() and closeAll(), the two moves an array cannot express while the family owns the array. They are on a handle of their own so ref keeps reaching the element, which is the rule for every other family here',
      ],
      [
        'render',
        '(props) => ReactNode',
        '—',
        'Accordion',
        'Substitutes the set’s root and hands it every attribute — a set of sections can be a real section element',
      ],
      [
        'ref',
        'Ref<HTMLElement>',
        '—',
        'Accordion',
        'Reaches the element itself, so the platform’s own methods are the platform’s',
      ],
      [
        'useAccordion()',
        '() => AccordionContextValue | undefined',
        '—',
        'inside Accordion',
        'What each item reads: the axes the set hands over, whether a value is open, whether it is held open, and toggle(value, reason). It is undefined outside a set rather than a throw, because a Collapsible standing alone is a complete component',
      ],
      [
        'AccordionDefaultsProvider',
        '{ multiple, requireOpen, loop, size, variant, indicator, togglePlacement, headingLevel, mount, truncate }',
        '—',
        'a subtree',
        'The ten decisions an application takes once. A set that states any of them itself still wins',
      ],
    ]),
    accessibility: [
      'The pattern is the WAI-ARIA APG’s Accordion (w3.org/WAI/ARIA/apg/patterns/accordion/). Its keyboard table is four keys and all four are the platform’s: Enter and Space toggle the focused header because it is a button, and Tab and Shift + Tab move through the set because every focusable element in an accordion is in the page tab sequence. Nothing here writes tabindex.',
      'ArrowDown, ArrowUp, Home and End are a deliberate departure, and the cost is written down. The arrows were optional guidance until w3c/aria-practices#3434 removed them, and Base UI deprecated its own loopFocus and orientation in the same change; Radix and Ark still ship them and readers have learned them. Here they are additive — they move focus between headers, open nothing, and take no header out of the tab sequence — so a reader who does not know them loses nothing.',
      'Each header is a real heading at the level headingLevel names, and the trigger is its only element, which is what the pattern requires. The set itself carries no role: a group of headings is already an outline a reader can navigate, and a container announced around it is one more thing to move past.',
      'requireOpen writes aria-disabled="true" on the one header the set will not let close. The pattern asks for exactly that, and the APG’s own example is the only surveyed implementation that ships it; the header stays focusable and announced rather than leaving the reader’s path.',
      'A horizontal accordion is not shipped. Radix and Ark both offer one and Base UI has deprecated its own; a horizontally stacked set of sections of which one is open is a tab list, and tabs owns it — with the marker, the scrolling list and that pattern’s own keyboard model.',
      'Which header has focus is read from the platform: onFocusIn on the set and event.target.dataset.value. Ark ships an output for it, and an output that repeats what the DOM already says is one more thing to keep in step.',
    ],
    snippets: [
      defineSnippet({
        id: 'accordion-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="accordion" data-part="root" data-size="md" data-variant="ruled">
  <div data-ui="collapsible" data-part="root" data-variant="ruled" data-value="delivery" data-open>
    <h3 data-part="header">
      <button data-part="trigger" aria-expanded="true" aria-controls="p-a">
        …
      </button>
    </h3>
    <div data-part="panel" id="p-a">
      <div data-part="content">…</div>
    </div>
  </div>
</div>;`,
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
