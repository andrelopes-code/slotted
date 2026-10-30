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

export const ANGULAR_TOGGLE_GROUP_TOKENS = toggleGroupTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Toggle Group decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideToggleGroupDefaults,\n  SlToggleGroup,\n  SlToggleGroupIcon,\n  SlToggleGroupItem,\n} from '@slotted/angular/toggle-group';",
  selector: '[slToggleGroup]',
  exportAs: 'slToggleGroup',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the consumer’s own element, with slToggleGroup on it',
    required: true,
    purpose:
      'The group. It carries role="group", data-ui="toggle-group", the axes, and one tab stop for the whole set. It states no frame of its own: a joined bar has one edge, and the items make it between them, which is also what keeps the bar exactly one control tall.',
  },
  {
    part: 'item',
    element: 'button, with slToggleGroupItem on it',
    required: true,
    purpose:
      'One two-state control. It carries aria-pressed in both states and data-pressed when it is on, and its border is always present so that turning it on changes a colour and never the geometry.',
  },
  {
    part: 'icon',
    element: 'the consumer’s own element, with slToggleGroupIcon on it',
    required: false,
    purpose:
      'The mark an item was given, sized from the control glyph scale and hidden from the reading order. An item with a mark and no words takes its accessible name from the aria-label the consumer writes.',
  },
  {
    part: 'label',
    element: 'span',
    required: false,
    purpose:
      'The words the item projects. A box of their own, so a label the bar made too narrow clips at the ellipsis instead of wrapping the item onto a second line — and the string stays whole in the DOM.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One bar with every axis on it, driven by the controls below the canvas. Tab into it once: the whole group is a single stop, and the arrows move focus from there without changing anything.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-playground',
      language: 'angular',
      label: 'A set of two-state buttons sharing one value',
      source: `<div slToggleGroup aria-label="Chart period" [defaultValue]="['week']">
  <button slToggleGroupItem value="day">Day</button>
  <button slToggleGroupItem value="week">Week</button>
  <button slToggleGroupItem value="month">Month</button>
</div>`,
    }),
  },
  {
    id: 'selection',
    title: 'One at a time, several at once, or none',
    note: 'The value is an array in both modes: multiple caps it at every item rather than at one. Press the item that is already on — the set empties, unless deselectable says it may not.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-selection',
      language: 'angular',
      label: 'Single, multiple, and a set that always holds one',
      source: `<div slToggleGroup aria-label="Text style" multiple [defaultValue]="['bold']">
  <button slToggleGroupItem value="bold">Bold</button>
  <button slToggleGroupItem value="italic">Italic</button>
</div>`,
    }),
  },
  {
    id: 'variant',
    title: 'Framed, or bare',
    note: 'outline draws the bar’s own edge; ghost draws none, for a bar that sits inside something already framed — a toolbar, a card header. The colour of an item that is on is the same in both.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-variant',
      language: 'angular',
      label: 'The two paintings',
      source: `<div slToggleGroup aria-label="Density" variant="ghost" [defaultValue]="['compact']">
  <button slToggleGroupItem value="comfortable">Comfortable</button>
  <button slToggleGroupItem value="compact">Compact</button>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The three control steps',
    note: 'Each step reads the control scale, so a bar is exactly as tall as the text field and the button beside it at every size and at every density.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-sizes',
      language: 'angular',
      label: 'sm, md and lg',
      source: `<div slToggleGroup aria-label="Sorting" size="sm" [defaultValue]="['newest']">
  <button slToggleGroupItem value="newest">Newest</button>
  <button slToggleGroupItem value="oldest">Oldest</button>
</div>`,
    }),
  },
  {
    id: 'orientation',
    title: 'Along the line, or down the page',
    note: 'A vertical bar moves with ArrowUp and ArrowDown and writes aria-orientation; a horizontal one leaves the cross axis to the page, so scrolling still works with focus inside the group.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-orientation',
      language: 'angular',
      label: 'A column of toggles',
      source: `<div slToggleGroup aria-label="Alignment" orientation="vertical" [defaultValue]="['center']">
  <button slToggleGroupItem value="start">Start</button>
  <button slToggleGroupItem value="center">Center</button>
</div>`,
    }),
  },
  {
    id: 'attached',
    title: 'Joined, or spaced apart',
    note: 'A joined bar overlaps its items by one border so the shared column holds one line rather than two — which is what keeps the edge even at 110%, 150% and 175% zoom.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-attached',
      language: 'angular',
      label: 'The two shapes',
      source: `<div slToggleGroup aria-label="Camadas" multiple [attached]="false" [defaultValue]="['roads']">
  <button slToggleGroupItem value="roads">Ruas</button>
  <button slToggleGroupItem value="terrain">Relevo</button>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Hover, focus, press, on, unavailable, and unavailable while on — that last one keeps both facts, because the state a reader cannot change is still one they have to be able to read.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-states',
      language: 'angular',
      label: 'One item unavailable inside a live bar',
      source: `<div slToggleGroup aria-label="Formato" [defaultValue]="['csv']">
  <button slToggleGroupItem value="csv">CSV</button>
  <button slToggleGroupItem value="xlsx" disabled>XLSX</button>
</div>`,
    }),
  },
  {
    id: 'iconOnly',
    title: 'Marks without words',
    note: 'An item with only a mark draws square and takes its accessible name from aria-label, which is the one thing the family cannot supply for a consumer’s own artwork.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-icon-only',
      language: 'angular',
      label: 'A formatting bar',
      source: `<div slToggleGroup aria-label="Estilo do texto" multiple [defaultValue]="['bold']">
  <button slToggleGroupItem value="bold" aria-label="Negrito">
    <ng-icon slToggleGroupIcon name="lucideBold" />
  </button>
</div>`,
    }),
  },
  {
    id: 'width',
    title: 'Content width, or the whole line',
    note: 'Left alone the bar is as wide as its labels; fullWidth makes the items share the line. Either way an item gives way rather than pushing the layout, and its label clips at the ellipsis.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-width',
      language: 'angular',
      label: 'A bar that fills its column',
      source: `<div slToggleGroup aria-label="Billing" fullWidth [defaultValue]="['monthly']">
  <button slToggleGroupItem value="monthly">Monthly</button>
  <button slToggleGroupItem value="yearly">Yearly</button>
</div>`,
    }),
  },
  {
    id: 'toolbar',
    title: 'Inside a toolbar, the bar owns the keyboard',
    note: 'A toolbar is already one tab stop with arrow navigation across every control it holds, so the group stands down rather than putting a second stop inside the first. Nothing has to be passed.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-toolbar',
      language: 'angular',
      label: 'A toggle group in a bar',
      source: `<div slToolbar aria-label="Formatting">
  <div
    slToggleGroup
    aria-label="Estilo do texto"
    multiple
    variant="ghost"
    [defaultValue]="['bold']"
  >
    <button slToggleGroupItem value="bold" aria-label="Negrito">
      <ng-icon slToggleGroupIcon name="lucideBold" />
    </button>
  </div>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label nine words long, one unbroken token, and a right-to-left string inside a left-to-right page. Each clips at the ellipsis and keeps its whole text in the DOM.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-content',
      language: 'angular',
      label: 'Long, unbroken and mirrored labels',
      source: `<div slToggleGroup aria-label="Frequency" fullWidth [defaultValue]="['now']">
  <button slToggleGroupItem value="now">Immediately</button>
  <button slToggleGroupItem value="digest">Once a day, in the evening digest</button>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'The directive on the consumer’s own element, and the defaults once',
    note: 'Every part is a directive, so the element is always the consumer’s; provideToggleGroupDefaults states the axes once for a whole application or one route.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-composition',
      language: 'ts',
      label: 'An application states its axes once',
      source: `providers: [provideToggleGroupDefaults({ size: 'sm', variant: 'ghost' })];`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The keyboard, key by key',
    note: 'Tab reaches the group once; the arrows move focus and never toggle; Home and End reach the ends; Space and Enter turn the focused item on and off. An item is a button, and that is why.',
    snippet: defineSnippet({
      id: 'toggle-group-angular-keyboard',
      language: 'angular',
      label: 'Wrapping turned off',
      source: `<div slToggleGroup aria-label="Period" [loop]="false" [defaultValue]="['week']">
  <button slToggleGroupItem value="day">Day</button>
  <button slToggleGroupItem value="week">Week</button>
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<readonly string[]>',
    when: 'Before the value moves. The request carries the new array, the array it replaces, the reason — pointer or keyboard — the originating event, and cancel(), which refuses the move before anything commits. Nothing is emitted for a value equal to the one the group already holds.',
  },
  {
    name: 'click, focus, blur, on each item',
    payload: 'the element’s own events',
    when: 'Whenever that item’s button fires them. The item is a directive on the consumer’s own element, so every listener the consumer bound is on the element itself and runs exactly as it was written.',
  },
];

export const ANGULAR_TOGGLE_GROUP_DOCS = {
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
        'slToggleGroup',
        'Present means the consumer owns the set, for the life of the component. Absent, the group owns it and starts from defaultValue',
      ],
      [
        'defaultValue',
        'readonly string[]',
        '—',
        'slToggleGroup',
        'What an uncontrolled group starts from, read once in ngOnInit. A later change to it does not silently become new state',
      ],
      [
        'multiple',
        'boolean',
        'false',
        'slToggleGroup',
        'Whether more than one item may be on at a time. The value stays an array either way, so one signal holds it in every mode',
      ],
      [
        'deselectable',
        'boolean',
        'true',
        'slToggleGroup',
        'Whether the last item on may be turned off. Ignored while multiple is true, where a set may always empty',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slToggleGroup',
        'The control step the bar and every item sit at. It reads the control scale, so the bar is as tall as the field beside it',
      ],
      [
        'variant',
        "'outline' | 'ghost' | 'chips'",
        'outline',
        'slToggleGroup',
        'Whether the bar draws its own edge, or draws its items as chips: separate rounded items that wrap, never joined, the pressed one in the neutral tone ink. There is no tone axis: “on” is one colour across the system',
      ],
      [
        'orientation',
        "'horizontal' | 'vertical'",
        'horizontal',
        'slToggleGroup',
        'How the items flow, and which pair of arrows moves focus. A vertical group writes aria-orientation',
      ],
      [
        'attached',
        'boolean',
        'true',
        'slToggleGroup',
        'Whether the items are joined into one bar or spaced apart. A joined bar overlaps its items by one border so a shared column holds one line',
      ],
      [
        'fullWidth',
        'boolean',
        'false',
        'slToggleGroup',
        'Whether the items share the whole line. Left alone the bar is as wide as its labels',
      ],
      [
        'loop',
        'boolean',
        'true',
        'slToggleGroup',
        'Whether the arrows wrap past the ends of the set',
      ],
      [
        'rovingFocus',
        'boolean',
        'inferred',
        'slToggleGroup',
        'Whether the group holds a tab stop of its own. Unstated it is inferred after the first render: a group inside a toolbar stands down',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slToggleGroup',
        'Unstated rather than false, so an item may state its own. Stated, it reaches every item as the native attribute',
      ],
      [
        'value, on slToggleGroupItem',
        'string',
        '—',
        'slToggleGroupItem',
        'What this item turns on, and what the group’s value holds. It is required: an item with no value is a control that changes nothing',
      ],
      [
        'disabled, on slToggleGroupItem',
        'boolean',
        '—',
        'slToggleGroupItem',
        'One item out of action while the rest of the bar stays live. An item that is on and unavailable keeps saying both',
      ],
    ]),
    composition: apiRows([
      [
        'slToggleGroupItem',
        'directive on a button',
        '—',
        'the consumer’s element',
        'The item is a directive, so the button is the consumer’s own: every attribute, every listener and every structural directive around it stay exactly as they were written',
      ],
      [
        'slToggleGroupIcon',
        'directive on any element',
        '—',
        'inside an item',
        'The mark, projected into the item and hidden from the reading order. An ng-icon, an inline svg or a span all work and none of them loses its own semantics',
      ],
      [
        'exportAs',
        "'slToggleGroup' | 'slToggleGroupItem'",
        '—',
        'a template reference',
        'Reaches the instance, so a template can read selection(), resolvedSize() or an item’s pressed() without the component owning a second copy of the state',
      ],
      [
        'provideToggleGroupDefaults()',
        '(defaults: Partial<ToggleGroupDefaults>) => Provider',
        '—',
        'an injector',
        'The six decisions an application takes once, at the root or on one route. A group that states any of them itself still wins',
      ],
      [
        'role',
        'string',
        'group',
        'slToggleGroup',
        'Read from the host with HostAttributeToken before the host bindings write, so a consumer’s own survives. The family writes group and never toolbar: toolbar is a keyboard model, and it is the toolbar family',
      ],
    ]),
    accessibility: [
      'There is no APG pattern called “toggle group”. The container is a group, each item is the Button pattern’s toggle button (w3.org/WAI/ARIA/apg/patterns/button/), and the movement between them is the Toolbar pattern’s roving tabindex (w3.org/WAI/ARIA/apg/patterns/toolbar/). Citing one and implying the other is how a family ends up with half a keyboard.',
      'So the arrows move focus and never toggle, which is the one place this family and segmented-control genuinely differ and the one a reader feels. Space and Enter turn the focused item on or off; Home and End reach the ends; a horizontal group ignores the cross axis so the page keeps scrolling with focus inside it.',
      'aria-pressed is written in both states, so an item is announced as a toggle rather than as a button that happens to be pressed — and the label never changes with the state, which the Button pattern calls critical. An item with only a mark takes its name from an aria-label the consumer writes on the button.',
      'Inside a toolbar the group gives its keyboard up: the bar is found in the DOM by its public identifier rather than by injecting the other family, so neither depends on the other. rovingFocus states it outright for a bar this library did not write.',
      'disabled is the native attribute, because that is also what makes the browser refuse focus and what makes the ring skip the item. The group is not a form control and implements no ControlValueAccessor: a set of choices a form submits is checkbox-group for many and segmented-control for one.',
      'The target is the item itself, never narrower than it is tall, so the WCAG 2.2 minimum of 24 by 24 holds at the smallest step and the tightest density — and the theme grows every control to 44 under a coarse pointer.',
    ],
    snippets: [
      defineSnippet({
        id: 'toggle-group-angular-anatomy',
        language: 'angular',
        label: 'The anatomy as it reaches the DOM',
        source: `<div
  slToggleGroup
  role="group"
  aria-label="Chart period"
  data-ui="toggle-group"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-attached
>
  <button slToggleGroupItem data-part="item" type="button" aria-pressed="true" data-pressed>
    <span data-part="label">Week</span>
  </button>
</div>`,
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
