import listboxTokens from '@slotted/styles/listbox/tokens.json';
import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_LISTBOX_TOKENS = listboxTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Listbox decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlListbox,\n  SlListboxDescription,\n  SlListboxEmpty,\n  SlListboxGroup,\n  SlListboxIcon,\n  SlListboxIndicator,\n  SlListboxLabel,\n  SlListboxLoader,\n  SlListboxMeta,\n  SlListboxOption,\n  SlListboxOptionContent,\n} from '@slotted/angular/listbox';",
  selector:
    '[slListbox], [slListboxOption], [slListboxGroup], [slListboxIndicator], [slListboxIcon], [slListboxLabel], [slListboxDescription], [slListboxMeta], [slListboxEmpty], [slListboxLoader], [slListboxOptionContent]',
  exportAs: 'slListbox, slListboxOption, slListboxGroup',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element the directive is on',
    required: true,
    purpose:
      'The listbox itself, not a wrapper around one. It carries role="listbox", data-ui="listbox" and every axis, it is the scroll container, and it is the one tab stop the whole set has.',
  },
  {
    part: 'canvas',
    element: 'div with role="presentation"',
    required: false,
    purpose:
      'Only while the set is windowed. It holds the whole list block size so the scrollbar is the length of the data, and starts the rendered slice at the offset the engine returned. The role is what keeps the options owned by the listbox.',
  },
  {
    part: 'group',
    element: 'the element slListboxGroup is on',
    required: false,
    purpose:
      'A run of options with a name. The pattern requires the name, so the group carries aria-labelledby to its own label row, or aria-label when the label row is scrolled out of a window.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The group name a reader hears when they land inside it.',
  },
  {
    part: 'option',
    element: 'the element slListboxOption is on',
    required: true,
    purpose:
      'One choice. It carries data-key, aria-selected, data-selected, data-current and, when the collection is one the family was handed, aria-setsize and aria-posinset.',
  },
  {
    part: 'indicator',
    element: 'the element slListboxIndicator is on',
    required: false,
    purpose:
      'The mark that says an option is chosen, drawn from the glyph scale. Its column is reserved whether or not the mark is painted, so the list does not shift sideways as one option is chosen.',
  },
  {
    part: 'icon',
    element: 'the element slListboxIcon is on',
    required: false,
    purpose:
      'The option own artwork, in the same column the mark uses and never beside it: a span[slIcon] holding an svg[slGlyph], or an element of the page own. No stylesheet fills it.',
  },
  {
    part: 'label',
    element: 'the element slListboxLabel is on',
    required: true,
    purpose: 'The option primary text, and the only one of the three columns that gives way.',
  },
  {
    part: 'description',
    element: 'the element slListboxDescription is on',
    required: false,
    purpose: 'A second line under the label, for what the label cannot say on its own.',
  },
  {
    part: 'meta',
    element: 'the element slListboxMeta is on',
    required: false,
    purpose:
      'The value beside the name — a count, a price, a status word. Menu calls the same column shortcut, because a menu third column holds a key binding.',
  },
  {
    part: 'empty',
    element: 'the element slListboxEmpty is on',
    required: false,
    purpose:
      'What the listbox says when it holds nothing. Inside the listbox, so a reader hears the message rather than "listbox, zero items" and then silence.',
  },
  {
    part: 'loader',
    element: 'the element slListboxLoader is on',
    required: false,
    purpose:
      'The row at the end of a page that has not arrived. It is an option by role because a listbox owns nothing else, and disabled because it is not a choice.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One listbox with every axis on it, driven by the controls under the canvas. Arrow through it, hold Shift, and watch the ring and the bar say two different things.',
    snippet: defineSnippet({
      id: 'listbox-angular-playground',
      language: 'angular',
      label: 'A listbox, and the options inside it',
      source: `<div slListbox aria-label="Region" defaultValue="europe">
  @for (region of regions; track region.id) {
    <div slListboxOption [value]="region.id">
      <span slListboxIndicator></span>
      <span slListboxLabel>{{ region.name }}</span>
      <span slListboxMeta>{{ region.count }}</span>
    </div>
  }
</div>`,
    }),
  },
  {
    id: 'selection',
    title: 'One choice, several, or none',
    note: 'Three listboxes side by side. The multi-select one writes aria-multiselectable; the read-only one refuses every change and still lets the arrows through.',
    snippet: defineSnippet({
      id: 'listbox-angular-selection',
      language: 'angular',
      label: 'The three selection modes',
      source: `<div slListbox aria-label="Contents" selectionMode="multiple" [defaultValue]="['cheese']">
  @for (filling of fillings; track filling) {
    <div slListboxOption [value]="filling">
      <span slListboxIndicator></span>
      <span slListboxLabel>{{ filling }}</span>
    </div>
  }
</div>`,
    }),
  },
  {
    id: 'behavior',
    title: 'Both of the selection models the pattern offers',
    note: 'The recommended model needs no modifier; the alternative replaces on a plain press and extends with Control. Press one, then Control-press another, in each.',
    snippet: defineSnippet({
      id: 'listbox-angular-behavior',
      language: 'angular',
      label: 'The desktop model, where a plain press replaces',
      source: `<div
  slListbox
  aria-label="Files"
  selectionMode="multiple"
  selectionBehavior="replace"
  [defaultValue]="['budget.xlsx']"
>
  @for (file of files; track file) {
    <div slListboxOption [value]="file">
      <span slListboxLabel>{{ file }}</span>
    </div>
  }
</div>`,
    }),
  },
  {
    id: 'sections',
    title: 'Groups, and the name each one needs',
    note: 'Every group carries an accessible name, which the pattern requires of it. Land inside one with the arrows and a screen reader says which group you are in.',
    snippet: defineSnippet({
      id: 'listbox-angular-sections',
      language: 'angular',
      label: 'A group written by hand',
      source: `<div slListbox aria-label="Fruit">
  <div slListboxGroup label="Pome">
    <div slListboxOption value="apple">
      <span slListboxIndicator></span>
      <span slListboxLabel>Apple</span>
    </div>
  </div>
</div>`,
    }),
  },
  {
    id: 'size',
    title: 'Three steps of type and control geometry',
    note: 'An option is a control, so its height, inset, type and glyph all read the control scale. Switch the density in the toolbar and the meaning does not change with the size.',
    snippet: defineSnippet({
      id: 'listbox-angular-size',
      language: 'angular',
      label: 'The type step the whole listbox sits at',
      source: `<div slListbox aria-label="Plan" size="lg">
  @for (plan of plans; track plan.id) {
    <div slListboxOption [value]="plan.id">
      <span slListboxLabel>{{ plan.name }}</span>
      <span slListboxMeta>{{ plan.price }}</span>
    </div>
  }
</div>`,
    }),
  },
  {
    id: 'variant',
    title: 'A control on its own, or a list inside a layer',
    note: 'framed draws the edge, the ground and the shadow a standalone control needs; plain draws none of them, because the layer around it already has an edge.',
    snippet: defineSnippet({
      id: 'listbox-angular-variant',
      language: 'angular',
      label: 'What a Select renders inside its own layer',
      source: `<div slListbox aria-label="Sort by" variant="plain">
  @for (order of orders; track order) {
    <div slListboxOption [value]="order">
      <span slListboxIndicator></span>
      <span slListboxLabel>{{ order }}</span>
    </div>
  }
</div>`,
    }),
  },
  {
    id: 'layout',
    title: 'Two dimensions, and one along the inline axis',
    note: 'With columns the arrows step by one across and by columns down; horizontal turns the axes and mirrors them in a right-to-left document.',
    snippet: defineSnippet({
      id: 'listbox-angular-layout',
      language: 'angular',
      label: 'Three options across, and the keyboard that follows',
      source: `<div slListbox aria-label="Planets" columns="3" selectionMode="multiple">
  @for (planet of planets; track planet) {
    <div slListboxOption [value]="planet">
      <span slListboxIndicator></span>
      <span slListboxLabel>{{ planet }}</span>
    </div>
  }
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Disabled outranks selected, so a chosen option that is disabled keeps its mark and loses its ground. Read-only keeps every option reachable and refuses each change.',
    snippet: defineSnippet({
      id: 'listbox-angular-states',
      language: 'angular',
      label: 'A disabled option that stays in the set',
      source: `<div slListbox aria-label="Region" defaultValue="europe">
  <div slListboxOption value="europe">
    <span slListboxIndicator></span>
    <span slListboxLabel>Europe</span>
  </div>
  <div slListboxOption value="antarctica" disabled>
    <span slListboxIndicator></span>
    <span slListboxLabel>Antarctica</span>
  </div>
</div>`,
    }),
  },
  {
    id: 'typeahead',
    title: 'Typing at a long list',
    note: 'Type the first letters of an option and the highlight goes there; the same letter pressed again cycles through the options beginning with it. Space mid-sequence is a character.',
    snippet: defineSnippet({
      id: 'listbox-angular-typeahead',
      language: 'angular',
      label: 'What typeahead matches, when the label is not it',
      source: `<div slListbox aria-label="Airports">
  @for (airport of airports; track airport.iata) {
    <div slListboxOption [value]="airport.iata" [textValue]="airport.city">
      <span slListboxLabel>{{ airport.city }}</span>
      <span slListboxMeta>{{ airport.iata }}</span>
    </div>
  }
</div>`,
    }),
  },
  {
    id: 'empty-and-loading',
    title: 'Nothing yet, and nothing at all',
    note: 'The message lives inside the listbox: outside it a reader hears "listbox, zero items" and then silence, and the words fall outside the box a framed listbox paints.',
    snippet: defineSnippet({
      id: 'listbox-angular-empty',
      language: 'angular',
      label: 'What the listbox says when it holds nothing',
      source: `<div slListbox aria-label="Results">
  @if (matches.length === 0) {
    <div slListboxEmpty>No region matches that name.</div>
  }
</div>`,
    }),
  },
  {
    id: 'virtualization',
    title: 'Ten thousand options, and the ones that are rendered',
    note: 'Scroll it, then arrow through it: the highlight survives a recycled row, because the active option is pinned and the listbox names it rather than roving a tab stop onto it.',
    snippet: defineSnippet({
      id: 'listbox-angular-virtual',
      language: 'angular',
      label: 'A windowed collection, and the template one option holds',
      source: `<div
  slListbox
  aria-label="Cities"
  virtual
  itemSize="34"
  [items]="cities"
  [getKey]="cityKey"
  [getLabel]="cityLabel"
>
  <ng-template slListboxOptionContent let-city>
    <span slListboxIndicator></span>
    <span slListboxLabel>{{ city.name }}</span>
    <span slListboxMeta>{{ city.country }}</span>
  </ng-template>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label long enough to wrap onto three lines, an unbroken URL, a compound German noun and a right-to-left string. The mark stays on the first line and the value never moves.',
    snippet: defineSnippet({
      id: 'listbox-angular-content',
      language: 'angular',
      label: 'An option with two lines of text and a value',
      source: `<div slListboxOption value="asia-pacific">
  <span slListboxIndicator></span>
  <span slListboxLabel>Asia Pacific</span>
  <span slListboxDescription>Sydney, Tokyo, Singapore</span>
  <span slListboxMeta>28</span>
</div>`,
    }),
  },
  {
    id: 'forms',
    title: 'A choice a form carries',
    note: 'The listbox is a ControlValueAccessor and a Validator, so a Reactive Form reads the value and required is the collection own validity rather than any one option.',
    snippet: defineSnippet({
      id: 'listbox-angular-forms',
      language: 'angular',
      label: 'A listbox inside a Reactive Form',
      source: `<div slField>
  <label slFieldLabel>Region</label>
  <div slListbox aria-label="Region" required [formControl]="region">
    @for (option of regions; track option.id) {
      <div slListboxOption [value]="option.id">
        <span slListboxIndicator></span>
        <span slListboxLabel>{{ option.name }}</span>
      </div>
    }
  </div>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'What an application decides once',
    note: 'provideListboxDefaults sets nineteen axes for every listbox under the injector, and an instance that states one still wins. exportAs reaches the instance from the template.',
    snippet: defineSnippet({
      id: 'listbox-angular-defaults',
      language: 'ts',
      label: 'One decision for every listbox in the application',
      source: `bootstrapApplication(App, {
  providers: [provideListboxDefaults({ size: 'sm', loop: true, selectionBehavior: 'replace' })],
});`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The whole keyboard, one press at a time',
    note: 'Tab in, then arrow, page, Home, End, Shift and Control. The panel beside the listbox names the option the keyboard is on and how it got there.',
    snippet: defineSnippet({
      id: 'listbox-angular-keyboard',
      language: 'angular',
      label: 'Watching where the keyboard is, without owning the selection',
      source: `<div
  slListbox
  aria-label="Regions"
  loop
  [activeKey]="activeKey()"
  (activeKeyChange)="activeKey.set($event.value)"
>
  <ng-content />
</div>`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The same listbox under the two focus models, side by side. One roves a tab stop; the other keeps focus on the box and names the active option.',
    snippet: defineSnippet({
      id: 'listbox-angular-activedescendant',
      language: 'angular',
      label: 'The model a combobox needs, stated rather than inferred',
      source: `<div slListbox aria-label="Suggestions" focusMode="activedescendant" [activeKey]="highlighted()">
  <ng-content />
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'ChangeRequest<string | readonly string[] | null>',
    when: 'Before the selection moves. The value is one key in single and none, and the set in multiple. The request carries the value it replaces, the reason — pointer, keyboard, select, clear or programmatic — the originating event, and cancel().',
  },
  {
    name: 'activeKeyChange',
    payload: 'ChangeRequest<string | null>',
    when: 'Before the option the keyboard is on moves. Reasons: pointer, keyboard, programmatic. It is a value of its own, because the pattern makes focus and selection two things.',
  },
  {
    name: 'loadMore',
    payload: 'void',
    when: 'Once the rendered window has come within loadMoreThreshold options of the end of what has been loaded, and only while hasMore is true and loading is false.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'provideListboxDefaults',
    '(defaults: Partial<ListboxDefaults>) => Provider',
    '—',
    'an injector',
    'Sets nineteen axes once for every listbox under it. An explicit input still wins',
  ],
  [
    'exportAs',
    'slListbox, slListboxOption, slListboxGroup',
    '—',
    'a template',
    'Reaches the instance, and with it focus(), scrollToKey(key, align) and getActiveKey()',
  ],
  [
    'slListboxOptionContent',
    'ng-template',
    '—',
    'a handed collection',
    'What one option holds. The family renders the option element around it, so the template never wires anything',
  ],
  [
    'ng-content',
    'projection',
    '—',
    'SlListbox, SlListboxOption, SlListboxGroup',
    'Options, groups, the empty message and the loader are all projected content, so a template decides when each appears',
  ],
  [
    'role',
    'string',
    '—',
    'SlListbox',
    'A role the consumer wrote is read with HostAttributeToken before the host bindings write anything, and is never replaced',
  ],
  [
    'ControlValueAccessor / Validator',
    'formControl, ngModel',
    '—',
    'SlListbox',
    'A Reactive Form or a template form reads and writes the value; required is the collection validity, which no single option can see',
  ],
]);

const api: ApiRow[] = apiRows([
  [
    'value',
    'string | readonly string[] | null, or string',
    '—',
    'SlListbox, SlListboxOption',
    'On the listbox: the chosen key, or the set of them; present means controlled, for the life of the component. On an option: the key it chooses',
  ],
  [
    'defaultValue',
    'string | readonly string[] | null',
    '—',
    'SlListbox',
    'What an uncontrolled listbox starts from, read once at init',
  ],
  [
    'activeKey',
    'string | null',
    '—',
    'SlListbox',
    'Which option the keyboard is on. Present means controlled',
  ],
  [
    'defaultActiveKey',
    'string | null',
    '—',
    'SlListbox',
    'Where the keyboard starts, read once at init',
  ],
  [
    'selectionMode',
    "'none' | 'single' | 'multiple'",
    'single',
    'SlListbox',
    'How many options may be chosen. multiple writes aria-multiselectable',
  ],
  [
    'selectionBehavior',
    "'toggle' | 'replace'",
    'toggle',
    'SlListbox',
    'toggle is the model the pattern recommends; replace is the desktop one, where a plain press replaces',
  ],
  ['size', "'sm' | 'md' | 'lg'", 'md', 'SlListbox', 'The type and control geometry step'],
  [
    'variant',
    "'plain' | 'framed'",
    'framed',
    'SlListbox',
    'framed is the standalone control; plain is what a layer already frames',
  ],
  [
    'orientation',
    "'vertical' | 'horizontal'",
    'vertical',
    'SlListbox',
    'Which axis the arrows move along. horizontal is mirrored in a right-to-left document',
  ],
  [
    'focusMode',
    "'auto' | 'roving' | 'activedescendant'",
    'auto',
    'SlListbox',
    'auto answers activedescendant whenever the set is windowed, because a roving tab stop cannot survive a recycled row',
  ],
  [
    'indicator',
    "'check' | 'none'",
    'check',
    'SlListbox',
    'Whether a chosen option draws a mark as well as its ground and its ink',
  ],
  ['loop', 'boolean', 'false', 'SlListbox', 'Whether the arrows wrap past the ends'],
  ['typeahead', 'boolean', 'true', 'SlListbox', 'Whether printable characters move the highlight'],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'SlListbox',
    'Milliseconds of silence before a new typeahead sequence begins',
  ],
  [
    'selectOnFocus',
    'boolean',
    'false',
    'SlListbox',
    'Whether moving the highlight also chooses. The pattern names the accessibility cost, so the default is the safe one',
  ],
  [
    'navigateDisabled',
    'boolean',
    'false',
    'SlListbox',
    'Whether the arrows land on a disabled option, which the pattern allows where discoverability matters',
  ],
  [
    'disallowEmptySelection',
    'boolean',
    'false',
    'SlListbox',
    'Refuses the press that would leave nothing chosen',
  ],
  ['disallowSelectAll', 'boolean', 'false', 'SlListbox', 'Refuses the select-all accelerator'],
  [
    'rows',
    'number',
    '7',
    'SlListbox',
    'How many options tall the box is before it scrolls. select size under another name',
  ],
  [
    'columns',
    'number',
    '1',
    'SlListbox',
    'How many options across. The arrows step by this number down a column',
  ],
  ['pageSize', 'number', '10', 'SlListbox', 'How far PageUp and PageDown travel'],
  [
    'disabled',
    'boolean',
    'false',
    'SlListbox, SlListboxOption',
    'On the listbox, unstated it defers to the form and stated it wins. On an option it is aria-disabled and never the native attribute, so the option keeps its place in the set',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'SlListbox',
    'Every option stays reachable and every change is refused. Writes aria-readonly',
  ],
  [
    'required',
    'boolean',
    'false',
    'SlListbox',
    'Writes aria-required, and is the validity a Reactive Form reads',
  ],
  [
    'invalid',
    'boolean',
    'false',
    'SlListbox',
    'Writes aria-invalid and turns the edge and the ring',
  ],
  [
    'loading',
    'boolean',
    'false',
    'SlListbox',
    'Writes aria-busy, which ARIA asks of a container whose options have not arrived',
  ],
  [
    'items',
    'readonly T[]',
    '—',
    'SlListbox',
    'The whole collection. Without it the collection is read from the rendered options',
  ],
  [
    'sections',
    'readonly ListboxSection<T>[]',
    '—',
    'SlListbox',
    'A grouped collection. Mutually exclusive with items',
  ],
  [
    'getKey',
    '(item: T) => string',
    '—',
    'SlListbox',
    'The identity that survives a reorder. It is a string, so no comparator is needed',
  ],
  [
    'getLabel',
    '(item: T) => string',
    '—',
    'SlListbox',
    'What typeahead matches and what a reader hears',
  ],
  [
    'isItemDisabled',
    '(item: T) => boolean',
    '—',
    'SlListbox',
    'Whether one item refuses to be chosen',
  ],
  [
    'totalCount',
    'number',
    '—',
    'SlListbox',
    'How large the whole set is when only part of it has loaded. Writes aria-setsize',
  ],
  [
    'virtual',
    'boolean',
    'false',
    'SlListbox',
    'Renders only the options the viewport covers, plus the pinned ones',
  ],
  [
    'itemSize',
    'number',
    '36',
    'SlListbox',
    'The block size of one option. Required whenever virtual is set',
  ],
  [
    'sectionSize',
    'number',
    '28',
    'SlListbox',
    'The block size of a group label row. Defaults to itemSize',
  ],
  ['overscan', 'number', '4', 'SlListbox', 'Options rendered either side of the viewport'],
  ['hasMore', 'boolean', 'false', 'SlListbox', 'Whether the consumer has another page to give'],
  [
    'loadMoreThreshold',
    'number',
    '0',
    'SlListbox',
    'How many options before the end the request goes out',
  ],
  [
    'textValue',
    'string',
    '—',
    'SlListboxOption',
    'What typeahead matches, when the visible text is not it',
  ],
  [
    'pinned',
    'boolean',
    'false',
    'SlListboxOption',
    'Rendered outside the window that covers it, at its own place on the canvas. The listbox sets it; nothing else should',
  ],
  [
    'label',
    'string',
    '—',
    'SlListboxGroup',
    'The group accessible name, rendered as its own label row',
  ],
  [
    'groupLabel',
    'string',
    '—',
    'SlListboxGroup',
    'The name without the row, which is what a windowed group takes when its label has scrolled out of the slice',
  ],
  [
    'renderOption',
    'ng-template slListboxOptionContent',
    '—',
    'SlListbox',
    'What one option of a handed collection holds. Angular projects a template where React takes a function',
  ],
]);

const accessibility = [
  'The pattern is https://www.w3.org/WAI/ARIA/apg/patterns/listbox/, read on 4 September 2026 from the rendered page and from the pattern source in w3c/aria-practices, so the optional keys and both selection models come from the source rather than from the summary. The root carries role="listbox", every option carries role="option", and a group carries role="group" with the accessible name the pattern requires of it.',
  'Selection is aria-selected on every selectable option, true or false and never absent, and aria-checked on none of them: the pattern forbids a listbox that carries both. A chosen option says so three ways — a tinted ground, a start-edge bar and a mark — because under forced colours the ground becomes Canvas and a family that spoke only in colour would say nothing in the mode that needs it most.',
  'There is one tab stop for the whole set. Under the roving model it lives on the active option, and under aria-activedescendant it lives on the root; focusMode="auto" chooses the second whenever the set is windowed, because an element carrying tabindex="0" that is recycled out of the DOM takes focus to the body with it. The active option is pinned into the rendered window for the same reason: a property naming an id that is not in the document leaves a reader operating a widget with no focused option.',
  'aria-setsize and aria-posinset are written on every option of a collection the family was handed and on none written in the template. That is the pattern condition — the pair is required when the complete set is not in the DOM — and with options in the template the whole set is in the DOM and the platform counts it.',
  'A disabled option carries aria-disabled rather than the native attribute, so it keeps its place in the set and can still be reached when navigateDisabled says discoverability matters more. readonly keeps every option reachable and refuses every change; disabled outranks selected, so a chosen option that is disabled keeps its mark and loses the ground that said it was yours to change.',
  'Keyboard: Tab in and out, arrows along the axis, Home and End, PageUp and PageDown, Space and Enter to choose, Shift with an arrow to move and toggle, Shift+Space for a range, Control+Shift+Home or End to select to an end, Control+A to select everything and again to clear, Control with an arrow to move without choosing under the alternative model, and printable characters for typeahead — where a space is a character once a sequence is open, which is what makes an option named in two words reachable.',
  'A role the consumer wrote is read with HostAttributeToken before the host bindings run and is never replaced, so a template wiring the element into something else keeps what it wrote.',
];

export const ANGULAR_LISTBOX_DOCS = {
  listbox: {
    imports,
    anatomy,
    scenes,
    api,
    events,
    composition,
    accessibility,
    snippets: [
      defineSnippet({
        id: 'listbox-angular-controlled',
        language: 'angular',
        label: 'Owning the value, and reading the reason it moved',
        source: `<div slListbox aria-label="Region" [value]="region()" (valueChange)="onRegion($event)">
  <ng-content />
</div>`,
      }),
      defineSnippet({
        id: 'listbox-angular-scroll-to-key',
        language: 'ts',
        label: 'Revealing an option the window has not rendered',
        source: `class Directory {
  readonly listbox = viewChild.required(SlListbox);

  reveal() {
    this.listbox().scrollToKey('reykjavik', 'center');
  }
}`,
      }),
      defineSnippet({
        id: 'listbox-angular-incremental',
        language: 'angular',
        label: 'A page at a time, with the set size the reader is told',
        source: `<div
  slListbox
  aria-label="Cities"
  [items]="loaded()"
  [getKey]="cityKey"
  [totalCount]="total()"
  [hasMore]="loaded().length < total()"
  [loading]="pending()"
  (loadMore)="fetchNextPage()"
>
  <ng-template slListboxOptionContent let-city>
    <span slListboxLabel>{{ city.name }}</span>
  </ng-template>
  @if (pending()) {
    <div slListboxLoader>Loading more…</div>
  }
</div>`,
      }),
    ],
  },
} as const;
