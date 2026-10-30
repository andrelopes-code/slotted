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

export const REACT_LISTBOX_TOKENS = listboxTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Listbox decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  Listbox,\n  ListboxDefaultsProvider,\n  ListboxDescription,\n  ListboxEmpty,\n  ListboxGroup,\n  ListboxIcon,\n  ListboxIndicator,\n  ListboxLabel,\n  ListboxLoader,\n  ListboxMeta,\n  ListboxOption,\n} from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, or the element render returns',
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
    element: 'div with role="group"',
    required: false,
    purpose:
      'A run of options with a name. The pattern requires the name, so the group carries aria-labelledby to its own label, or aria-label when the label row is scrolled out of a window.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The group name a reader hears when they land inside it.',
  },
  {
    part: 'option',
    element: 'div with role="option"',
    required: true,
    purpose:
      'One choice. It carries data-key, aria-selected, data-selected, data-current and, when the collection is one the family was handed, aria-setsize and aria-posinset.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: false,
    purpose:
      'The mark that says an option is chosen, drawn from the glyph scale. Its column is reserved whether or not the mark is painted, so the list does not shift sideways as one option is chosen.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The option own artwork, in the same column the mark uses and never beside it: an Icon holding a Glyph, or an element of the page own. No stylesheet fills it.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose: 'The option primary text, and the only one of the three columns that gives way.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'A second line under the label, for what the label cannot say on its own.',
  },
  {
    part: 'meta',
    element: 'span',
    required: false,
    purpose:
      'The value beside the name — a count, a price, a status word. Menu calls the same column shortcut, because a menu third column holds a key binding.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose:
      'What the listbox says when it holds nothing. Inside the listbox, so a reader hears the message rather than "listbox, zero items" and then silence.',
  },
  {
    part: 'loader',
    element: 'div with role="option"',
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
      id: 'listbox-react-playground',
      language: 'tsx',
      label: 'A listbox, and the options inside it',
      source: `<Listbox aria-label="Region" defaultValue="europe">
  {regions.map((region) => (
    <ListboxOption key={region.id} value={region.id}>
      <ListboxIndicator />
      <ListboxLabel>{region.name}</ListboxLabel>
      <ListboxMeta>{region.count}</ListboxMeta>
    </ListboxOption>
  ))}
</Listbox>;`,
    }),
  },
  {
    id: 'selection',
    title: 'One choice, several, or none',
    note: 'Three listboxes side by side. The multi-select one writes aria-multiselectable; the read-only one refuses every change and still lets the arrows through.',
    snippet: defineSnippet({
      id: 'listbox-react-selection',
      language: 'tsx',
      label: 'The three selection modes',
      source: `<Listbox aria-label="Contents" selectionMode="multiple" defaultValue={['cheese']}>
  {fillings.map((filling) => (
    <ListboxOption key={filling} value={filling}>
      <ListboxIndicator />
      <ListboxLabel>{filling}</ListboxLabel>
    </ListboxOption>
  ))}
</Listbox>;`,
    }),
  },
  {
    id: 'behavior',
    title: 'Both of the selection models the pattern offers',
    note: 'The recommended model needs no modifier; the alternative replaces on a plain press and extends with Control. Press one, then Control-press another, in each.',
    snippet: defineSnippet({
      id: 'listbox-react-behavior',
      language: 'tsx',
      label: 'The desktop model, where a plain press replaces',
      source: `<Listbox
  aria-label="Files"
  selectionMode="multiple"
  selectionBehavior="replace"
  defaultValue={['budget.xlsx']}
>
  {files.map((file) => (
    <ListboxOption key={file} value={file}>
      <ListboxLabel>{file}</ListboxLabel>
    </ListboxOption>
  ))}
</Listbox>;`,
    }),
  },
  {
    id: 'sections',
    title: 'Groups, and the name each one needs',
    note: 'Every group carries an accessible name, which the pattern requires of it. Land inside one with the arrows and a screen reader says which group you are in.',
    snippet: defineSnippet({
      id: 'listbox-react-sections',
      language: 'tsx',
      label: 'A group written by hand',
      source: `<Listbox aria-label="Fruit">
  <ListboxGroup label="Pome">
    <ListboxOption value="apple">
      <ListboxIndicator />
      <ListboxLabel>Apple</ListboxLabel>
    </ListboxOption>
  </ListboxGroup>
</Listbox>;`,
    }),
  },
  {
    id: 'size',
    title: 'Three steps of type and control geometry',
    note: 'An option is a control, so its height, inset, type and glyph all read the control scale. Switch the density in the toolbar and the meaning does not change with the size.',
    snippet: defineSnippet({
      id: 'listbox-react-size',
      language: 'tsx',
      label: 'The type step the whole listbox sits at',
      source: `<Listbox aria-label="Plan" size="lg">
  {plans.map((plan) => (
    <ListboxOption key={plan.id} value={plan.id}>
      <ListboxLabel>{plan.name}</ListboxLabel>
      <ListboxMeta>{plan.price}</ListboxMeta>
    </ListboxOption>
  ))}
</Listbox>;`,
    }),
  },
  {
    id: 'variant',
    title: 'A control on its own, or a list inside a layer',
    note: 'framed draws the edge, the ground and the shadow a standalone control needs; plain draws none of them, because the layer around it already has an edge.',
    snippet: defineSnippet({
      id: 'listbox-react-variant',
      language: 'tsx',
      label: 'What a Select renders inside its own layer',
      source: `<Listbox aria-label="Sort by" variant="plain" indicator="check">
  {orders.map((order) => (
    <ListboxOption key={order} value={order}>
      <ListboxIndicator />
      <ListboxLabel>{order}</ListboxLabel>
    </ListboxOption>
  ))}
</Listbox>;`,
    }),
  },
  {
    id: 'layout',
    title: 'Two dimensions, and one along the inline axis',
    note: 'With columns the arrows step by one across and by columns down; horizontal turns the axes and mirrors them in a right-to-left document.',
    snippet: defineSnippet({
      id: 'listbox-react-layout',
      language: 'tsx',
      label: 'Three options across, and the keyboard that follows',
      source: `<Listbox aria-label="Planets" columns={3} selectionMode="multiple">
  {planets.map((planet) => (
    <ListboxOption key={planet} value={planet}>
      <ListboxIndicator />
      <ListboxLabel>{planet}</ListboxLabel>
    </ListboxOption>
  ))}
</Listbox>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the contract declares',
    note: 'Disabled outranks selected, so a chosen option that is disabled keeps its mark and loses its ground. Read-only keeps every option reachable and refuses each change.',
    snippet: defineSnippet({
      id: 'listbox-react-states',
      language: 'tsx',
      label: 'A disabled option that stays in the set',
      source: `<Listbox aria-label="Region" defaultValue="europe">
  <ListboxOption value="europe">
    <ListboxIndicator />
    <ListboxLabel>Europe</ListboxLabel>
  </ListboxOption>
  <ListboxOption value="antarctica" disabled>
    <ListboxIndicator />
    <ListboxLabel>Antarctica</ListboxLabel>
  </ListboxOption>
</Listbox>;`,
    }),
  },
  {
    id: 'typeahead',
    title: 'Typing at a long list',
    note: 'Type the first letters of an option and the highlight goes there; the same letter pressed again cycles through the options beginning with it. Space mid-sequence is a character.',
    snippet: defineSnippet({
      id: 'listbox-react-typeahead',
      language: 'tsx',
      label: 'What typeahead matches, when the label is not it',
      source: `<Listbox aria-label="Airports">
  {airports.map((airport) => (
    <ListboxOption key={airport.iata} value={airport.iata} textValue={airport.city}>
      <ListboxLabel>{airport.city}</ListboxLabel>
      <ListboxMeta>{airport.iata}</ListboxMeta>
    </ListboxOption>
  ))}
</Listbox>;`,
    }),
  },
  {
    id: 'empty-and-loading',
    title: 'Nothing yet, and nothing at all',
    note: 'The message lives inside the listbox: outside it a reader hears "listbox, zero items" and then silence, and the words fall outside the box a framed listbox paints.',
    snippet: defineSnippet({
      id: 'listbox-react-empty',
      language: 'tsx',
      label: 'What the listbox says when it holds nothing',
      source: `<Listbox aria-label="Results" items={matches} getKey={(match) => match.id}>
  <ListboxEmpty>No region matches that name.</ListboxEmpty>
</Listbox>;`,
    }),
  },
  {
    id: 'virtualization',
    title: 'Ten thousand options, and the ones that are rendered',
    note: 'Scroll it, then arrow through it: the highlight survives a recycled row, because the active option is pinned and the listbox names it rather than roving a tab stop onto it.',
    snippet: defineSnippet({
      id: 'listbox-react-virtual',
      language: 'tsx',
      label: 'A windowed collection, and the four things it needs',
      source: `<Listbox
  aria-label="Cities"
  virtual
  itemSize={34}
  items={cities}
  getKey={(city) => city.id}
  getLabel={(city) => city.name}
  renderOption={(city) => (
    <>
      <ListboxIndicator />
      <ListboxLabel>{city.name}</ListboxLabel>
      <ListboxMeta>{city.country}</ListboxMeta>
    </>
  )}
/>;`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A label long enough to wrap onto three lines, an unbroken URL, a compound German noun and a right-to-left string. The mark stays on the first line and the value never moves.',
    snippet: defineSnippet({
      id: 'listbox-react-content',
      language: 'tsx',
      label: 'An option with two lines of text and a value',
      source: `<ListboxOption value="asia-pacific">
  <ListboxIndicator />
  <ListboxLabel>Asia Pacific</ListboxLabel>
  <ListboxDescription>Sydney, Tokyo, Singapore</ListboxDescription>
  <ListboxMeta>28</ListboxMeta>
</ListboxOption>;`,
    }),
  },
  {
    id: 'forms',
    title: 'A choice a form carries',
    note: 'Give it a name and every chosen key is submitted as a hidden input; required and invalid come from the Field around it, which owns the label and the message.',
    snippet: defineSnippet({
      id: 'listbox-react-forms',
      language: 'tsx',
      label: 'A listbox inside a field, inside a form',
      source: `<Field>
  <FieldLabel>Regions</FieldLabel>
  <Listbox aria-label="Regions" name="regions" selectionMode="multiple" required>
    {regionOptions}
  </Listbox>
</Field>;`,
    }),
  },
  {
    id: 'composition',
    title: 'What an application decides once',
    note: 'The provider sets nineteen axes for every listbox under it, and an instance that states one still wins. The render prop moves the root onto an element the page owns.',
    snippet: defineSnippet({
      id: 'listbox-react-defaults',
      language: 'tsx',
      label: 'One decision for every listbox in the application',
      source: `<ListboxDefaultsProvider size="sm" loop selectionBehavior="replace">
  <Workspace />
</ListboxDefaultsProvider>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'The whole keyboard, one press at a time',
    note: 'Tab in, then arrow, page, Home, End, Shift and Control. The panel beside the listbox names the last key it answered and what it did with it.',
    snippet: defineSnippet({
      id: 'listbox-react-keyboard',
      language: 'tsx',
      label: 'Watching where the keyboard is, without owning the selection',
      source: `<Listbox aria-label="Regions" activeKey={activeKey} onActiveKeyChange={setActiveKey} loop>
  {regionOptions}
</Listbox>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears',
    note: 'The same listbox under the two focus models, side by side. One roves a tab stop; the other keeps focus on the box and names the active option.',
    snippet: defineSnippet({
      id: 'listbox-react-activedescendant',
      language: 'tsx',
      label: 'The model a combobox needs, stated rather than inferred',
      source: `<Listbox aria-label="Suggestions" focusMode="activedescendant" activeKey={highlighted}>
  {suggestionOptions}
</Listbox>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onValueChange',
    payload: '(value: string | readonly string[] | null, request: ChangeRequest)',
    when: 'Before the selection moves. The value is one key in single and none, and the set in multiple. The request carries the value it replaces, the reason — pointer, keyboard, select, clear or programmatic — the originating event, and cancel().',
  },
  {
    name: 'onActiveKeyChange',
    payload: '(key: string | null, request: ChangeRequest)',
    when: 'Before the option the keyboard is on moves. Reasons: pointer, keyboard, programmatic. It is a value of its own, because the pattern makes focus and selection two things.',
  },
  {
    name: 'onLoadMore',
    payload: '()',
    when: 'Once the rendered window has come within loadMoreThreshold options of the end of what has been loaded, and only while hasMore is true and loading is false.',
  },
];

const composition: ApiRow[] = apiRows([
  [
    'ListboxDefaultsProvider',
    '{ size, variant, selectionMode, … }',
    '—',
    'a subtree',
    'Sets nineteen axes once for every listbox under it. An explicit prop still wins',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'Listbox, ListboxOption, ListboxGroup, ListboxEmpty, ListboxLoader',
    'Renders the part into another element, keeping every attribute and handler it was given',
  ],
  [
    'handleRef',
    'Ref<ListboxHandle>',
    '—',
    'Listbox',
    'focus(), scrollToKey(key, align) and getActiveKey() — the three actions no prop can express',
  ],
  [
    'ref',
    'Ref<HTMLDivElement>',
    '—',
    'every part',
    'Reaches the native element; each part extends its own element props',
  ],
  [
    'aria-label / aria-labelledby',
    'string',
    '—',
    'Listbox',
    'The listbox own name. The pattern requires one when it is not part of another widget',
  ],
  [
    'onKeyDown / onFocus / onBlur / onClick',
    'handler',
    '—',
    'Listbox, ListboxOption',
    'Runs before the family own, and preventDefault() stops the family from answering',
  ],
]);

const api: ApiRow[] = apiRows([
  [
    'value',
    'string | readonly string[] | null, or string',
    '—',
    'Listbox, ListboxOption',
    'On the listbox: the chosen key, or the set of them; present means controlled, for the life of the component. On an option: the key it chooses, which is what the listbox value holds',
  ],
  [
    'defaultValue',
    'string | readonly string[] | null',
    '—',
    'Listbox',
    'What an uncontrolled listbox starts from, read once',
  ],
  [
    'activeKey',
    'string | null',
    '—',
    'Listbox',
    'Which option the keyboard is on. Present means controlled',
  ],
  ['defaultActiveKey', 'string | null', '—', 'Listbox', 'Where the keyboard starts, read once'],
  [
    'selectionMode',
    "'none' | 'single' | 'multiple'",
    'single',
    'Listbox',
    'How many options may be chosen. multiple writes aria-multiselectable',
  ],
  [
    'selectionBehavior',
    "'toggle' | 'replace'",
    'toggle',
    'Listbox',
    'toggle is the model the pattern recommends; replace is the desktop one, where a plain press replaces',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Listbox',
    'The type and control geometry step. Defaults to the Field around it before the provider',
  ],
  [
    'variant',
    "'plain' | 'framed'",
    'framed',
    'Listbox',
    'framed is the standalone control; plain is what a layer already frames',
  ],
  [
    'orientation',
    "'vertical' | 'horizontal'",
    'vertical',
    'Listbox',
    'Which axis the arrows move along. horizontal is mirrored in a right-to-left document',
  ],
  [
    'focusMode',
    "'auto' | 'roving' | 'activedescendant'",
    'auto',
    'Listbox',
    'auto answers activedescendant whenever the set is windowed, because a roving tab stop cannot survive a recycled row',
  ],
  [
    'indicator',
    "'check' | 'none'",
    'check',
    'Listbox',
    'Whether a chosen option draws a mark as well as its ground and its ink',
  ],
  ['loop', 'boolean', 'false', 'Listbox', 'Whether the arrows wrap past the ends'],
  ['typeahead', 'boolean', 'true', 'Listbox', 'Whether printable characters move the highlight'],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'Listbox',
    'Milliseconds of silence before a new typeahead sequence begins',
  ],
  [
    'selectOnFocus',
    'boolean',
    'false',
    'Listbox',
    'Whether moving the highlight also chooses. The pattern names the accessibility cost, so the default is the safe one',
  ],
  [
    'navigateDisabled',
    'boolean',
    'false',
    'Listbox',
    'Whether the arrows land on a disabled option, which the pattern allows where discoverability matters',
  ],
  [
    'disallowEmptySelection',
    'boolean',
    'false',
    'Listbox',
    'Refuses the press that would leave nothing chosen',
  ],
  ['disallowSelectAll', 'boolean', 'false', 'Listbox', 'Refuses the select-all accelerator'],
  [
    'rows',
    'number',
    '7',
    'Listbox',
    'How many options tall the box is before it scrolls. <select size> under another name',
  ],
  [
    'columns',
    'number',
    '1',
    'Listbox',
    'How many options across. The arrows step by this number down a column',
  ],
  ['pageSize', 'number', '10', 'Listbox', 'How far PageUp and PageDown travel'],
  [
    'disabled',
    'boolean',
    'false',
    'Listbox, ListboxOption',
    'On the listbox, unstated it defers to the Field and stated it wins, and every option inherits it. On an option it is aria-disabled and never the native attribute, so the option keeps its place in the set',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'Listbox',
    'Every option stays reachable and every change is refused. Writes aria-readonly',
  ],
  ['required', 'boolean', 'false', 'Listbox', 'Writes aria-required. The Field owns the message'],
  ['invalid', 'boolean', 'false', 'Listbox', 'Writes aria-invalid and turns the edge and the ring'],
  [
    'loading',
    'boolean',
    'false',
    'Listbox',
    'Writes aria-busy, which ARIA asks of a container whose options have not arrived',
  ],
  [
    'name',
    'string',
    '—',
    'Listbox',
    'Submits one hidden input per chosen key, so a bare form carries the set',
  ],
  [
    'items',
    'readonly T[]',
    '—',
    'Listbox',
    'The whole collection. Without it the collection is read from the rendered options',
  ],
  [
    'sections',
    'readonly ListboxSection<T>[]',
    '—',
    'Listbox',
    'A grouped collection. Mutually exclusive with items',
  ],
  [
    'getKey',
    '(item: T) => string',
    '—',
    'Listbox',
    'The identity that survives a reorder. It is a string, so no comparator is needed',
  ],
  [
    'getLabel',
    '(item: T) => string',
    '—',
    'Listbox',
    'What typeahead matches and what a reader hears',
  ],
  [
    'isItemDisabled',
    '(item: T) => boolean',
    '—',
    'Listbox',
    'Whether one item refuses to be chosen',
  ],
  [
    'renderOption',
    '(item: T) => ReactNode',
    '—',
    'Listbox',
    'The content of one option. The family renders the option around it',
  ],
  [
    'totalCount',
    'number',
    '—',
    'Listbox',
    'How large the whole set is when only part of it has loaded. Writes aria-setsize',
  ],
  [
    'virtual',
    'boolean',
    'false',
    'Listbox',
    'Renders only the options the viewport covers, plus the pinned ones',
  ],
  [
    'itemSize',
    'number',
    '36',
    'Listbox',
    'The block size of one option. Required whenever virtual is set',
  ],
  [
    'sectionSize',
    'number',
    '28',
    'Listbox',
    'The block size of a group label row. Defaults to itemSize',
  ],
  ['overscan', 'number', '4', 'Listbox', 'Options rendered either side of the viewport'],
  ['hasMore', 'boolean', 'false', 'Listbox', 'Whether the consumer has another page to give'],
  [
    'loadMoreThreshold',
    'number',
    '0',
    'Listbox',
    'How many options before the end the request goes out',
  ],
  [
    'emptyContent',
    'ReactNode',
    '—',
    'Listbox',
    'What a handed collection shows when it holds nothing',
  ],
  [
    'loaderContent',
    'ReactNode',
    '—',
    'Listbox',
    'What the row at the end of an unfinished page says',
  ],
  [
    'textValue',
    'string',
    '—',
    'ListboxOption',
    'What typeahead matches, when the visible text is not it',
  ],
  [
    'label',
    'ReactNode',
    '—',
    'ListboxGroup',
    'The group accessible name, which the pattern requires of every group',
  ],
]);

const accessibility = [
  'The pattern is https://www.w3.org/WAI/ARIA/apg/patterns/listbox/, read on 4 September 2026 from the rendered page and from the pattern source in w3c/aria-practices, so the optional keys and both selection models come from the source rather than from the summary. The root carries role="listbox", every option carries role="option", and a group carries role="group" with the accessible name the pattern requires of it.',
  'Selection is aria-selected on every selectable option, true or false and never absent, and aria-checked on none of them: the pattern forbids a listbox that carries both. A chosen option says so three ways — a tinted ground, a start-edge bar and a mark — because under forced colours the ground becomes Canvas and a family that spoke only in colour would say nothing in the mode that needs it most.',
  'There is one tab stop for the whole set. Under the roving model it lives on the active option, and under aria-activedescendant it lives on the root; focusMode="auto" chooses the second whenever the set is windowed, because an element carrying tabindex="0" that is recycled out of the DOM takes focus to the body with it. The active option is pinned into the rendered window for the same reason: a property naming an id that is not in the document leaves a reader operating a widget with no focused option.',
  'aria-setsize and aria-posinset are written on every option of a collection the family was handed and on none written as children. That is the pattern condition — the pair is required when the complete set is not in the DOM — and with children the whole set is in the DOM and the platform counts it.',
  'A disabled option carries aria-disabled rather than the native attribute, so it keeps its place in the set and can still be reached when navigateDisabled says discoverability matters more. readonly keeps every option reachable and refuses every change; disabled outranks selected, so a chosen option that is disabled keeps its mark and loses the ground that said it was yours to change.',
  'Keyboard: Tab in and out, arrows along the axis, Home and End, PageUp and PageDown, Space and Enter to choose, Shift with an arrow to move and toggle, Shift+Space for a range, Control+Shift+Home or End to select to an end, Control+A to select everything and again to clear, Control with an arrow to move without choosing under the alternative model, and printable characters for typeahead — where a space is a character once a sequence is open, which is what makes an option named in two words reachable.',
];

export const REACT_LISTBOX_DOCS = {
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
        id: 'listbox-react-controlled',
        language: 'tsx',
        label: 'Owning the value, and reading the reason it moved',
        source: `<Listbox
  aria-label="Region"
  value={region}
  onValueChange={(next, request) => {
    if (request.reason === 'keyboard') announce(next);
    setRegion(next);
  }}
>
  {regionOptions}
</Listbox>;`,
      }),
      defineSnippet({
        id: 'listbox-react-scroll-to-key',
        language: 'tsx',
        label: 'Revealing an option the window has not rendered',
        source: `const listbox = useRef<ListboxHandle>(null);

listbox.current?.scrollToKey('reykjavik', 'center');`,
      }),
      defineSnippet({
        id: 'listbox-react-incremental',
        language: 'tsx',
        label: 'A page at a time, with the set size the reader is told',
        source: `<Listbox
  aria-label="Cities"
  items={loaded}
  getKey={(city) => city.id}
  totalCount={total}
  hasMore={loaded.length < total}
  loading={pending}
  onLoadMore={fetchNextPage}
  loaderContent="Loading more…"
/>;`,
      }),
    ],
  },
} as const;
