import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import toggleGroupTokens from '@slotted/styles/toggle-group/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_TOGGLE_GROUP_TOKENS = toggleGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toggle Group decision',
}));

const imports: ReferenceImport = {
  source:
    "import { ToggleGroup, ToggleGroupDefaultsProvider, ToggleGroupItem } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
    required: true,
    purpose:
      'The group. It carries role="group", data-ui="toggle-group", the axes, and one tab stop for the whole set. It states no frame of its own: a joined bar has one edge, and the items make it between them, which is also what keeps the bar exactly one control tall.',
  },
  {
    part: 'item',
    element: 'button, or the element ToggleGroupItem’s render returns',
    required: true,
    purpose:
      'One two-state control. It carries aria-pressed in both states and data-pressed when it is on, and its border is always present so that turning it on changes a colour and never the geometry.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The mark an item was given, sized from the control glyph scale and hidden from the reading order. An item with a mark and no words takes its accessible name from the aria-label the consumer writes.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose:
      'The words. A box of their own, so a label the bar made too narrow clips at the ellipsis instead of wrapping the item onto a second line — and the string stays whole in the DOM.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One bar with every axis on it, driven by the controls below the canvas. Tab into it once: the whole group is a single stop, and the arrows move focus from there without changing anything.',
    snippet: defineSnippet({
      id: 'toggle-group-react-playground',
      language: 'tsx',
      label: 'A set of two-state buttons sharing one value',
      source: `<ToggleGroup aria-label="Chart period" defaultValue={['week']}>
  <ToggleGroupItem value="day">Day</ToggleGroupItem>
  <ToggleGroupItem value="week">Week</ToggleGroupItem>
  <ToggleGroupItem value="month">Month</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'selection',
    title: 'One at a time, several at once, or none',
    note: 'The value is an array in both modes: multiple caps it at every item rather than at one. Press the item that is already on — the set empties, unless deselectable says it may not.',
    snippet: defineSnippet({
      id: 'toggle-group-react-selection',
      language: 'tsx',
      label: 'Single, multiple, and a set that always holds one',
      source: `<ToggleGroup aria-label="Text style" defaultValue={['bold', 'italic']} multiple>
  <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
  <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
</ToggleGroup>;

<ToggleGroup aria-label="Period" defaultValue={['week']} deselectable={false}>
  <ToggleGroupItem value="week">Week</ToggleGroupItem>
  <ToggleGroupItem value="month">Month</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'variant',
    title: 'Framed, or bare',
    note: 'outline draws the bar’s own edge; ghost draws none, for a bar that sits inside something already framed — a toolbar, a card header. The colour of an item that is on is the same in both.',
    snippet: defineSnippet({
      id: 'toggle-group-react-variant',
      language: 'tsx',
      label: 'The two paintings',
      source: `<ToggleGroup aria-label="Density" defaultValue={['compact']} variant="ghost">
  <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
  <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'The three control steps',
    note: 'Each step reads the control scale, so a bar is exactly as tall as the text field and the button beside it at every size and at every density.',
    snippet: defineSnippet({
      id: 'toggle-group-react-sizes',
      language: 'tsx',
      label: 'sm, md and lg',
      source: `<ToggleGroup aria-label="Sorting" defaultValue={['newest']} size="sm">
  <ToggleGroupItem value="newest">Newest</ToggleGroupItem>
  <ToggleGroupItem value="oldest">Oldest</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'orientation',
    title: 'Along the line, or down the page',
    note: 'A vertical bar moves with ArrowUp and ArrowDown and writes aria-orientation; a horizontal one leaves the cross axis to the page, so scrolling still works with focus inside the group.',
    snippet: defineSnippet({
      id: 'toggle-group-react-orientation',
      language: 'tsx',
      label: 'A column of toggles',
      source: `<ToggleGroup aria-label="Alignment" defaultValue={['center']} orientation="vertical">
  <ToggleGroupItem value="start">Start</ToggleGroupItem>
  <ToggleGroupItem value="center">Center</ToggleGroupItem>
  <ToggleGroupItem value="end">End</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'attached',
    title: 'Joined, or spaced apart',
    note: 'A joined bar overlaps its items by one border so the shared column holds one line rather than two — which is what keeps the edge even at 110%, 150% and 175% zoom.',
    snippet: defineSnippet({
      id: 'toggle-group-react-attached',
      language: 'tsx',
      label: 'The two shapes',
      source: `<ToggleGroup aria-label="Camadas" attached={false} defaultValue={['roads']} multiple>
  <ToggleGroupItem value="roads">Ruas</ToggleGroupItem>
  <ToggleGroupItem value="terrain">Relevo</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Hover, focus, press, on, unavailable, and unavailable while on — that last one keeps both facts, because the state a reader cannot change is still one they have to be able to read.',
    snippet: defineSnippet({
      id: 'toggle-group-react-states',
      language: 'tsx',
      label: 'One item unavailable inside a live bar',
      source: `<ToggleGroup aria-label="Formato" defaultValue={['pdf']}>
  <ToggleGroupItem value="csv">CSV</ToggleGroupItem>
  <ToggleGroupItem disabled value="xlsx">
    XLSX
  </ToggleGroupItem>
  <ToggleGroupItem disabled value="pdf">
    PDF
  </ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'iconOnly',
    title: 'Marks without words',
    note: 'An item with only a mark draws square and takes its accessible name from aria-label, which is the one thing the family cannot supply for a consumer’s own artwork.',
    snippet: defineSnippet({
      id: 'toggle-group-react-icon-only',
      language: 'tsx',
      label: 'A formatting bar',
      source: `<ToggleGroup aria-label="Text style" defaultValue={['bold']} multiple>
  <ToggleGroupItem aria-label="Bold" icon={<BoldIcon />} value="bold" />
  <ToggleGroupItem aria-label="Italic" icon={<ItalicIcon />} value="italic" />
</ToggleGroup>;`,
    }),
  },
  {
    id: 'width',
    title: 'Content width, or the whole line',
    note: 'Left alone the bar is as wide as its labels; fullWidth makes the items share the line. Either way an item gives way rather than pushing the layout, and its label clips at the ellipsis.',
    snippet: defineSnippet({
      id: 'toggle-group-react-width',
      language: 'tsx',
      label: 'A bar that fills its column',
      source: `<ToggleGroup aria-label="Billing" defaultValue={['monthly']} fullWidth>
  <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
  <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'toolbar',
    title: 'Inside a toolbar, the bar owns the keyboard',
    note: 'A toolbar is already one tab stop with arrow navigation across every control it holds, so the group stands down rather than putting a second stop inside the first. Nothing has to be passed.',
    snippet: defineSnippet({
      id: 'toggle-group-react-toolbar',
      language: 'tsx',
      label: 'A toggle group in a bar',
      source: `<Toolbar aria-label="Formatting">
  <ToggleGroup aria-label="Text style" defaultValue={['bold']} multiple variant="ghost">
    <ToggleGroupItem aria-label="Bold" icon={<BoldIcon />} value="bold" />
    <ToggleGroupItem aria-label="Italic" icon={<ItalicIcon />} value="italic" />
  </ToggleGroup>
  <ToolbarSeparator />
  <Button size="sm" tone="secondary" variant="ghost">
    Publicar
  </Button>
</Toolbar>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label nine words long, one unbroken token, and a right-to-left string inside a left-to-right page. Each clips at the ellipsis and keeps its whole text in the DOM.',
    snippet: defineSnippet({
      id: 'toggle-group-react-content',
      language: 'tsx',
      label: 'Long, unbroken and mirrored labels',
      source: `<ToggleGroup aria-label="Frequency" defaultValue={['now']} fullWidth>
  <ToggleGroupItem value="now">Immediately</ToggleGroupItem>
  <ToggleGroupItem value="digest">Once a day, in the evening digest</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Substituting an element, and setting the defaults once',
    note: 'render hands either root every attribute it was going to write, so a bar can be a real ul with each item an li; the provider states the axes once for a whole application.',
    snippet: defineSnippet({
      id: 'toggle-group-react-composition',
      language: 'tsx',
      label: 'A provider over a substituted root',
      source: `<ToggleGroupDefaultsProvider size="sm" variant="ghost">
  <ToggleGroup aria-label="Camadas" render={(props) => <nav {...props} />}>
    <ToggleGroupItem value="roads">Ruas</ToggleGroupItem>
  </ToggleGroup>
</ToggleGroupDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab reaches the group once; the arrows move focus and never toggle; Home and End reach the ends; Space and Enter turn the focused item on and off. An item is a button, and that is why.',
    snippet: defineSnippet({
      id: 'toggle-group-react-keyboard',
      language: 'tsx',
      label: 'Wrapping turned off',
      source: `<ToggleGroup aria-label="Period" defaultValue={['week']} loop={false}>
  <ToggleGroupItem value="day">Day</ToggleGroupItem>
  <ToggleGroupItem value="week">Week</ToggleGroupItem>
</ToggleGroup>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: readonly string[], request: ChangeRequest<readonly string[]>)',
    when: 'Before the value moves. The request carries the new array, the array it replaces, the reason — pointer or keyboard — the originating event, and cancel(), which refuses the move before anything commits. Nothing is emitted for a value equal to the one the group already holds.',
  },
  {
    name: 'onClick, onFocus, onBlur, on each item',
    payload: 'the element’s own events',
    when: 'Whenever that item’s button fires them. The family composes with a consumer’s handler rather than replacing it: the consumer’s runs first, and always runs. Calling preventDefault() in onClick stops the toggle as well.',
  },
];

export const REACT_TOGGLE_GROUP_DOCS = {
  toggleGroup: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'readonly string[]',
        '—',
        'ToggleGroup',
        'Present means the consumer owns the set, for the life of the component. Absent, the group owns it and starts from defaultValue',
      ],
      [
        'defaultValue',
        'readonly string[]',
        '—',
        'ToggleGroup',
        'What an uncontrolled group starts from, read once. A later change to it does not silently become new state',
      ],
      [
        'multiple',
        'boolean',
        'false',
        'ToggleGroup',
        'Whether more than one item may be on at a time. The value stays an array either way, so both bindings hold one shape and a single-select consumer writes an array of one',
      ],
      [
        'deselectable',
        'boolean',
        'true',
        'ToggleGroup',
        'Whether the last item on may be turned off. Ignored while multiple is true, where a set may always empty',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'ToggleGroup',
        'The control step the bar and every item sit at. It reads the control scale, so the bar is as tall as the field beside it',
      ],
      [
        'variant',
        "'outline' | 'ghost' | 'chips'",
        'outline',
        'ToggleGroup',
        'Whether the bar draws its own edge, or draws its items as chips: separate rounded items that wrap, never joined, the pressed one in the neutral tone ink. There is no tone axis: “on” is one colour across the system, and a bar that wants the whole palette is button-group around ToggleButtons',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'ToggleGroup',
        'How the items flow, and which pair of arrows moves focus. A vertical group writes aria-orientation',
      ],
      [
        'attached',
        'boolean',
        'true',
        'ToggleGroup',
        'Whether the items are joined into one bar or spaced apart. A joined bar overlaps its items by one border so a shared column holds one line',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'ToggleGroup',
        'Whether the items share the whole line. Left alone the bar is as wide as its labels',
      ],
      [
        'loop',
        'boolean',
        'true',
        'ToggleGroup',
        'Whether the arrows wrap past the ends of the set',
      ],
      [
        'rovingFocus',
        'boolean',
        'inferred',
        'ToggleGroup',
        'Whether the group holds a tab stop of its own. Unstated it is inferred: a group inside a toolbar stands down, because a bar is already one stop with arrow navigation across every control it holds',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'ToggleGroup',
        'Unstated rather than false, so an item may state its own. Stated, it reaches every item as the native attribute, which is also what makes the browser skip it with the arrows',
      ],
      [
        'value, on ToggleGroupItem',
        'string',
        '—',
        'ToggleGroupItem',
        'What this item turns on, and what the group’s value holds. It is required: an item with no value is a control that changes nothing',
      ],
      [
        'icon, on ToggleGroupItem',
        'ReactNode',
        '—',
        'ToggleGroupItem',
        'The mark drawn before the words, sized from the control glyph scale and hidden from the reading order',
      ],
      [
        'disabled, on ToggleGroupItem',
        'boolean',
        '—',
        'ToggleGroupItem',
        'One item out of action while the rest of the bar stays live. An item that is on and unavailable keeps saying both',
      ],
    ]),
    composition: apiRows([
      [
        'render',
        '(props: ToggleGroupRootProps | ToggleGroupItemRootProps) => ReactNode',
        '—',
        'ToggleGroup, ToggleGroupItem',
        'Substitutes either root and hands it every attribute the family was going to write, including the ref the group needs for its own ring',
      ],
      [
        'ref',
        'Ref<HTMLDivElement> | Ref<HTMLButtonElement>',
        '—',
        'ToggleGroup, ToggleGroupItem',
        'Reaches the element. focus() and click() are the element’s own, so no imperative handle is invented for what the platform already ships',
      ],
      [
        'useToggleGroup()',
        '() => ToggleGroupContextValue',
        '—',
        'inside a ToggleGroup',
        'What an item reads to know whether it is on and how to ask for a change. It throws outside a group rather than rendering a button that toggles nothing',
      ],
      [
        'ToggleGroupDefaultsProvider',
        '{ attached, deselectable, loop, orientation, size, variant }',
        '—',
        'a subtree',
        'The six decisions an application takes once. A group that states any of them itself still wins',
      ],
      [
        'role',
        'string',
        'group',
        'ToggleGroup',
        'A consumer’s own wins. The family writes group and never toolbar: toolbar is a keyboard model, and it is the toolbar family',
      ],
    ]),
    accessibility: [
      'There is no APG pattern called “toggle group”. The container is a group, each item is the Button pattern’s toggle button (w3.org/WAI/ARIA/apg/patterns/button/), and the movement between them is the Toolbar pattern’s roving tabindex (w3.org/WAI/ARIA/apg/patterns/toolbar/). Citing one and implying the other is how a family ends up with half a keyboard.',
      'So the arrows move focus and never toggle, which is the one place this family and segmented-control genuinely differ and the one a reader feels. Space and Enter turn the focused item on or off; Home and End reach the ends; a horizontal group ignores the cross axis so the page keeps scrolling with focus inside it.',
      'aria-pressed is written in both states, so an item is announced as a toggle rather than as a button that happens to be pressed — and the label never changes with the state, which the Button pattern calls critical. An item with only a mark takes its name from an aria-label the consumer writes.',
      'Inside a toolbar the group gives its keyboard up: a bar is already one tab stop with arrow navigation across every control it holds. The bar is found in the DOM by its public identifier rather than through an imported context, so neither family depends on the other; rovingFocus states it outright for a bar this library did not write.',
      'disabled is the native attribute, because that is also what makes the browser refuse focus and what makes the ring skip the item. The group is not a form control: a set of choices a form submits is checkbox-group for many and segmented-control for one.',
      'The target is the item itself, never narrower than it is tall, so the WCAG 2.2 minimum of 24 by 24 holds at the smallest step and the tightest density — and the theme grows every control to 44 under a coarse pointer.',
    ],
    snippets: [
      defineSnippet({
        id: 'toggle-group-react-anatomy',
        language: 'tsx',
        label: 'The anatomy as it reaches the DOM',
        source: `<div
  data-ui="toggle-group"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-orientation="horizontal"
  data-attached
  role="group"
  aria-label="Chart period"
>
  <button data-part="item" type="button" aria-pressed="true" data-pressed tabindex="0">
    <span data-part="icon" aria-hidden="true"></span>
    <span data-part="label">Week</span>
  </button>
</div>;`,
      }),
      defineSnippet({
        id: 'toggle-group-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='toggle-group'] {
  --slotted-toggle-group-radius: var(--slotted-radius-full);
  --slotted-toggle-group-border-color: var(--slotted-border-subtle);
  --slotted-toggle-group-pressed-background: var(--slotted-tone-success-surface);
  --slotted-toggle-group-pressed-border-color: var(--slotted-tone-success-border);
  --slotted-toggle-group-pressed-color: var(--slotted-tone-success-text);
}`,
      }),
    ],
  },
} as const;
