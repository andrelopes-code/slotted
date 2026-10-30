import comboboxTokens from '@slotted/styles/combobox/tokens.json';
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

export const REACT_COMBOBOX_TOKENS = comboboxTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Combobox decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Combobox, ComboboxContent, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxSeparator } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div, rendered by ComboboxInput',
    required: true,
    purpose:
      'The visible frame, carrying data-ui="combobox". It draws the border, the shadow, the focus ring and every state, from the same tokens as the text field and the select.',
  },
  {
    part: 'input',
    element: 'input with role="combobox"',
    required: true,
    purpose:
      'A native text input, so the caret, the selection, IME, autofill and every text-editing key behave as in any input. It keeps focus for the whole interaction and carries aria-autocomplete, aria-expanded and aria-activedescendant.',
  },
  {
    part: 'trigger',
    element: 'button',
    required: true,
    purpose:
      'Opens and closes the popup with the pointer. It has tabindex="-1", as the ARIA combobox pattern requires, so Tab reaches the input once and skips the button.',
  },
  {
    part: 'arrow',
    element: 'span',
    required: true,
    purpose:
      'The chevron inside the trigger, a Glyph inside an Icon, turned over while the popup is open.',
  },
  {
    part: 'busy',
    element: 'span',
    required: false,
    purpose:
      'The spinner that replaces the chevron while loading is set, because the chevron promises a list that has not arrived. It carries data-ui="spinner" beside this part, so the spinner stylesheet draws the ring and the combobox sets only its place and size.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'Resets both the text and the chosen value. Present only while clearable is set and the input holds text.',
  },
  {
    part: 'positioner',
    element: 'div, rendered by ComboboxContent',
    required: true,
    purpose:
      'The popup layer, portalled to the end of the document. It carries data-ui="combobox" again, because a stylesheet scoped to the root cannot reach a subtree outside it.',
  },
  {
    part: 'content',
    element: 'div with role="listbox"',
    required: true,
    purpose:
      'The popup surface, holding the options that pass the filter. Its height is bounded by the space the positioner reports, and it scrolls inside that bound.',
  },
  {
    part: 'group',
    element: 'div with role="group"',
    required: false,
    purpose:
      'A named set of options. A group whose options were all filtered away renders nothing, so no heading appears without options under it.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The name of a group, which the group references through aria-labelledby.',
  },
  {
    part: 'item',
    element: 'div with role="option"',
    required: true,
    purpose:
      'One option. It compares its own label against the query and renders nothing when it does not match.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose: 'The check in the last column, shown on the chosen option.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose: 'The first column: an Icon holding a Glyph, or any element of your own.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The option text. It wraps to two lines and then truncates, with the whole text still in the DOM.',
  },
  {
    part: 'match',
    element: 'mark',
    required: false,
    purpose:
      'The part of the label the query matched, found with the same collator the filter used. It shows the reader why the option is in the results.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'A second line under the label, for detail the label has no room for.',
  },
  {
    part: 'separator',
    element: 'div with role="separator"',
    required: false,
    purpose: 'A line between two runs of options.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'The message the popup shows when nothing matched, instead of an empty box.',
  },
  {
    part: 'status',
    element: 'div with role="status" and aria-live="polite"',
    required: true,
    purpose:
      'The loading message and the live region in one row, so a screen reader user hears how many options matched.',
  },
  {
    part: 'placeholder',
    element: 'div',
    required: false,
    purpose:
      'Three rows the height of an option, drawn with the skeleton stylesheet while loading is set, so the popup already has the shape of the list. Hidden from assistive technology, because the status row announces the wait.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One combobox with every axis on it, driven by the controls under the canvas. Type into it and watch the list, the marks and the count answer together.',
    snippet: defineSnippet({
      id: 'combobox-react-playground',
      language: 'tsx',
      label: 'An input, and the options it filters',
      source: `<Combobox>
  <ComboboxInput aria-label="Fruit" placeholder="Search fruit" />
  <ComboboxContent>
    <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
    <ComboboxItem value="raspberry">Raspberry</ComboboxItem>
  </ComboboxContent>
</Combobox>;`,
    }),
  },
  {
    id: 'filtering',
    title: 'Filtering, and the mark',
    note: 'The default comparison is locale-sensitive, so resume finds Resumé — and the mark shows the span the collator matched rather than a naive substring that would disagree with it.',
    snippet: defineSnippet({
      id: 'combobox-react-filtering',
      language: 'tsx',
      label: 'Three answers, and which one each asks for',
      source: `<Combobox locale="pt-BR">…</Combobox>;

<Combobox filter={(label, query) => label.toLowerCase().startsWith(query.toLowerCase())}>
  …
</Combobox>;

<Combobox filter={null}>…</Combobox>;`,
    }),
  },
  {
    id: 'autocomplete',
    title: 'Autocomplete',
    note: 'The pattern’s own three values. both writes the rest of the first match into the field as a selected range, so the next character replaces it and Backspace withdraws it.',
    snippet: defineSnippet({
      id: 'combobox-react-autocomplete',
      language: 'tsx',
      label: 'What the field does as the reader types',
      source: `<Combobox autocomplete="none">…</Combobox>;
<Combobox autocomplete="list">…</Combobox>;
<Combobox autocomplete="both">…</Combobox>;`,
    }),
  },
  {
    id: 'custom-value',
    title: 'A value that is not on the list',
    note: 'With allowsCustomValue the typed text commits as the value. Without it, Enter puts the text back to the committed option’s label — the pattern’s own "reverts".',
    snippet: defineSnippet({
      id: 'combobox-react-custom-value',
      language: 'tsx',
      label: 'Inventing a value, or refusing to',
      source: `<Combobox allowsCustomValue onValueChange={(next, request) => add(next, request.reason)}>
  …
</Combobox>;`,
    }),
  },
  {
    id: 'creation',
    title: 'Adding a value the list does not hold',
    note: 'With onCreate, the last option offers to add what was typed once nothing matched. It is an option — ArrowDown reaches it, Enter takes it — and taking it reports the query and selects nothing: the collection is the consumer’s, and only it knows whether this one can grow.',
    snippet: defineSnippet({
      id: 'combobox-react-creation',
      language: 'tsx',
      label: 'Offering to add what was typed',
      source: `<Combobox onCreate={(query) => add(query)}>…</Combobox>;`,
    }),
  },
  {
    id: 'async',
    title: 'Asynchronous results',
    note: 'Debounce the fetch, not the combobox: a component that delayed its own request would delay a controlled consumer’s re-render and drop characters between them.',
    snippet: defineSnippet({
      id: 'combobox-react-async',
      language: 'tsx',
      label: 'Three lines that debounce a search',
      source: `const [query, setQuery] = useState('');
const deferred = useDeferredValue(query);
const { data, isPending } = useQuery({ queryKey: ['people', deferred], queryFn: search });

<Combobox
  filter={null}
  inputValue={query}
  loading={isPending}
  onInputValueChange={setQuery}
  onLoadMore={fetchNextPage}
>
  …
</Combobox>;`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'Two named groups. A group whose every option was filtered away disappears with them, so a heading never claims a category matched when none did.',
    snippet: defineSnippet({
      id: 'combobox-react-groups',
      language: 'tsx',
      label: 'Results with sections',
      source: `<ComboboxContent>
  <ComboboxGroup label="Berries">
    <ComboboxItem value="blueberry">Blueberry</ComboboxItem>
  </ComboboxGroup>
  <ComboboxGroup label="Citrus">
    <ComboboxItem value="pomelo">Pomelo</ComboboxItem>
  </ComboboxGroup>
</ComboboxContent>;`,
    }),
  },
  {
    id: 'clearable',
    title: 'Clearable',
    note: 'One press takes both contracts back — the text and the chosen key — and focus returns to the field rather than to the document.',
    snippet: defineSnippet({
      id: 'combobox-react-clearable',
      language: 'tsx',
      label: 'Emptying the field',
      source: `<Combobox clearable messages={{ clear: 'Clear the search' }}>
  …
</Combobox>;`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'Three steps, every one reading control geometry — so a combobox beside a text field of the same size is the same height to the pixel.',
    snippet: defineSnippet({
      id: 'combobox-react-sizes',
      language: 'tsx',
      label: 'The three control steps',
      source: `<Combobox size="sm">…</Combobox>;
<Combobox size="md">…</Combobox>;
<Combobox size="lg">…</Combobox>;`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline on the page, subtle where a form sinks into its card, and plain for a table cell that is only a control while it is being used.',
    snippet: defineSnippet({
      id: 'combobox-react-variants',
      language: 'tsx',
      label: 'How much frame the control shows',
      source: `<Combobox variant="outline">…</Combobox>;
<Combobox variant="subtle">…</Combobox>;
<Combobox variant="plain">…</Combobox>;`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Required, invalid, read-only and disabled. Read-only keeps the caret, the selection and the copy, and withholds only the popup, which the combobox decides because the pattern has no read-only state.',
    snippet: defineSnippet({
      id: 'combobox-react-states',
      language: 'tsx',
      label: 'What the control refuses, and how it says so',
      source: `<Combobox invalid>…</Combobox>;
<Combobox readOnly defaultInputValue="Blueberry">
  …
</Combobox>;
<Combobox disabled defaultInputValue="Blueberry">
  …
</Combobox>;`,
    }),
  },
  {
    id: 'empty',
    title: 'Nothing matched, and still travelling',
    note: 'A query with no answers opens onto a sentence. A query whose answer is in flight keeps the same measure, so nothing jumps when the results land.',
    snippet: defineSnippet({
      id: 'combobox-react-empty',
      language: 'tsx',
      label: 'The two states the field spends most time in',
      source: `<ComboboxContent empty="Try a different spelling" status="Searching…" />;`,
    }),
  },
  {
    id: 'long-content',
    title: 'Long, translated and unbroken content',
    note: 'A translated label, an unbroken identifier and two hundred options. The label clamps at two lines with the whole string in the DOM, and the mark sits inside the token that broke.',
    snippet: defineSnippet({
      id: 'combobox-react-long-content',
      language: 'tsx',
      label: 'Long, translated and unbroken',
      source: `<ComboboxItem textValue="urn:acme:catalogue:9f2c41ab" value="urn">
  urn:acme:catalogue:9f2c41ab8de07c5511903fbe
</ComboboxItem>;`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'The arrows and the page keys move the highlight without moving the caret; Home, End, Backspace and Delete are never intercepted, which the pattern asks for by name.',
    snippet: defineSnippet({
      id: 'combobox-react-keyboard',
      language: 'tsx',
      label: 'What the combobox binds, and what it leaves alone',
      source: `<Combobox autoHighlight={false} loop={false} openOn="input">
  …
</Combobox>;`,
    }),
  },
  {
    id: 'form',
    title: 'In a form',
    note: 'Inside a field, with a label, a description and an error. name renders a hidden input carrying the chosen key — never the typed text, which is the other contract.',
    snippet: defineSnippet({
      id: 'combobox-react-form',
      language: 'tsx',
      label: 'A control a form can submit',
      source: `<Field required>
  <FieldLabel>Reviewer</FieldLabel>
  <Combobox name="reviewer">
    <ComboboxInput placeholder="Search people" />
    <ComboboxContent>{options}</ComboboxContent>
  </Combobox>
</Field>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'Defaults set once for an application, the words from the language in force, the frame replaced through render, and the imperative handle for what a consumer cannot say declaratively.',
    snippet: defineSnippet({
      id: 'combobox-react-composition',
      language: 'tsx',
      label: 'What a consumer can replace',
      source: `<ComboboxDefaultsProvider size="sm">
  <Combobox ref={handle}>
    <ComboboxInput render={(props) => <label {...props} />} />…
  </Combobox>
</ComboboxDefaultsProvider>;`,
    }),
  },
];

const api = apiRows([
  [
    'inputValue',
    'string',
    '—',
    'Combobox',
    'The text in the input. Passing it makes the text controlled.',
  ],
  [
    'defaultInputValue',
    'string',
    '—',
    'Combobox',
    'The initial text of an uncontrolled input, read once.',
  ],
  [
    'value',
    'string | null',
    '—',
    'Combobox',
    'The key of the chosen option, which is separate from the typed text. Passing it makes the value controlled.',
  ],
  [
    'defaultValue',
    'string | null',
    '—',
    'Combobox',
    'The initial value of an uncontrolled combobox. It sets the key, not the text.',
  ],
  [
    'open',
    'boolean',
    '—',
    'Combobox',
    'Whether the popup is open. Passing it makes the open state controlled.',
  ],
  ['defaultOpen', 'boolean', 'false', 'Combobox', 'Whether an uncontrolled popup starts open.'],
  [
    'highlightedValue',
    'string | null',
    '—',
    'Combobox',
    'The key of the highlighted option, which is separate from the chosen one.',
  ],
  [
    'defaultHighlightedValue',
    'string | null',
    '—',
    'Combobox',
    'The initial highlight of an uncontrolled combobox.',
  ],
  [
    'filter',
    '((label, query) => boolean) | null',
    '—',
    'Combobox',
    'The comparison between a label and the query. Unset uses a locale-sensitive contains; null turns filtering off for a list a server has already filtered.',
  ],
  [
    'locale',
    'string',
    '—',
    'Combobox',
    'The BCP 47 language of the default filter. The active locale when unset.',
  ],
  [
    'items',
    'ComboboxItems',
    '—',
    'Combobox',
    'Labels for values, so a closed combobox can show the label of an option it has not rendered.',
  ],
  [
    'name',
    'string',
    '—',
    'Combobox',
    'The name the value is submitted under. Renders a hidden input that carries the chosen key.',
  ],
  [
    'form',
    'string',
    '—',
    'Combobox',
    'The id of the form the value is submitted with, when it is not the enclosing one.',
  ],
  [
    'total',
    'number',
    '—',
    'Combobox',
    'The size of the whole collection, written to aria-setsize on each option.',
  ],
  [
    'autocomplete',
    "'none' | 'list' | 'both'",
    'list',
    'Combobox',
    'What typing does: none keeps every option, list filters the options, and both also completes the first match inline. Written to aria-autocomplete.',
  ],
  [
    'openOn',
    "'input' | 'focus' | 'manual'",
    'input',
    'Combobox',
    'When the popup opens without the trigger: on typing or a press on the input (input), on every focus and press (focus), or only from the trigger and the arrow keys (manual).',
  ],
  [
    'allowsCustomValue',
    'boolean',
    'false',
    'Combobox',
    'Whether text that matches no option becomes the value on Enter or blur.',
  ],
  [
    'autoHighlight',
    'boolean',
    'false',
    'Combobox',
    'Whether the first match is highlighted when the popup opens and after each query typed, so Enter takes it. A chosen option that is showing takes precedence.',
  ],
  [
    'highlightMatch',
    'boolean',
    'true',
    'Combobox',
    'Whether the part of each label the query matched is marked.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'Combobox',
    'The control size. Unset follows the enclosing field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'Combobox',
    'How much frame the control draws.',
  ],
  [
    'side',
    "'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'Combobox',
    'The edge of the control the popup opens from.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'Combobox',
    'The alignment of the popup along that edge.',
  ],
  [
    'width',
    "'anchor' | 'content'",
    'content',
    'Combobox',
    'The popup width: content keeps it at least as wide as the control and widens it to its longest option; anchor pins it to the width of the control.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'Combobox',
    'When the popup exists in the DOM: only while open, from the first open, or from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'Combobox',
    'The CSS positioning the popup uses.',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'Combobox',
    'Whether a clear button appears once the input holds text.',
  ],
  [
    'loop',
    'boolean',
    'false',
    'Combobox',
    'Whether ArrowDown and ArrowUp wrap at the ends of the list.',
  ],
  ['closeOnSelect', 'boolean', 'true', 'Combobox', 'Whether choosing an option closes the popup.'],
  ['closeOnEscape', 'boolean', 'true', 'Combobox', 'Whether Escape closes the popup.'],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'Combobox',
    'Whether a press outside the combobox closes the popup.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'Combobox',
    'Whether the popup moves to the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'Combobox',
    'Whether the popup slides along its side to stay in view.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'Combobox',
    'Whether the popup hides once the control scrolls out of view.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'Combobox',
    'Whether the popup renders at the end of the document instead of inside the combobox.',
  ],
  [
    'fullWidth',
    'boolean',
    'true',
    'Combobox',
    'Whether the control fills its container or keeps its own width.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'Combobox',
    'Turns off the input, the trigger and the popup. Unset follows the enclosing field.',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'Combobox',
    'Keeps the text selectable and copyable and never opens the popup. Unset follows the enclosing field.',
  ],
  [
    'required',
    'boolean',
    'false',
    'Combobox',
    'Sets the native required attribute on the input. Unset follows the enclosing field.',
  ],
  [
    'invalid',
    'boolean',
    'false',
    'Combobox',
    'Draws the border and the focus ring in the invalid tone and sets aria-invalid. Unset follows the enclosing field.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'Combobox',
    'Shows the spinner, the placeholder rows and the loading message, and sets aria-busy on the listbox.',
  ],
  [
    'sideOffset',
    'number',
    '4',
    'Combobox',
    'The gap between the control and the popup, in pixels.',
  ],
  ['alignOffset', 'number', '0', 'Combobox', 'How far the popup shifts along its side, in pixels.'],
  [
    'collisionPadding',
    'number',
    '8',
    'Combobox',
    'The minimum distance between the popup and the edge of the viewport, in pixels.',
  ],
  [
    'messages',
    'Partial<ComboboxMessages>',
    '—',
    'Combobox',
    'Phrases that replace the active locale’s, key by key: clear, trigger, create ({query}), empty, loading and count ({count}).',
  ],
  ['empty', 'ReactNode', '—', 'ComboboxContent', 'Replaces the empty message for this popup.'],
  [
    'status',
    'ReactNode',
    '—',
    'ComboboxContent',
    'Replaces the message in the status row for this popup.',
  ],
  [
    'value',
    'string',
    '—',
    'ComboboxItem',
    'The option key: what the form submits and what onValueChange receives.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'ComboboxItem',
    'Keeps the option in the list, announces it as unavailable, and skips it with every movement key.',
  ],
  [
    'textValue',
    'string',
    '—',
    'ComboboxItem',
    'The text the filter compares and the mark splits, when the children are not a string.',
  ],
  ['description', 'ReactNode', '—', 'ComboboxItem', 'The second line under the label.'],
  ['icon', 'ReactNode', '—', 'ComboboxItem', 'The element in the first column.'],
  [
    'position',
    'number',
    '—',
    'ComboboxItem',
    'The position of the option in the whole collection, written to aria-posinset.',
  ],
  [
    'label',
    'ReactNode',
    '—',
    'ComboboxGroup',
    'The name of the group, which the group references through aria-labelledby.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'onInputValueChange',
    payload: '(value: string, request: ChangeRequest)',
    when: 'Before the text changes. The reason is keyboard while the reader types, select when an option is chosen, and clear, blur or programmatic otherwise.',
  },
  {
    name: 'onValueChange',
    payload: '(value: string | null, request: ChangeRequest)',
    when: 'Before the chosen value changes. Typing calls only onInputValueChange; choosing an option calls both, each with the reason select.',
  },
  {
    name: 'onOpenChange',
    payload: '(open: boolean, request: ChangeRequest)',
    when: 'Before the popup opens or closes. The reason tells a selection from a dismissal: select, escape, outsidePress, dismiss, blur, pointer, keyboard or programmatic.',
  },
  {
    name: 'onHighlightedValueChange',
    payload: '(value: string | null, request: ChangeRequest)',
    when: 'Before the highlight moves, by key or by pointer, and when the filter removes the highlighted option.',
  },
  {
    name: 'onCreate',
    payload: '(query: string, details: { reason, source? })',
    when: 'When the reader takes the create option, which appears while onCreate is set, the query is not empty and nothing matched. The popup closes and nothing is selected: add the option to your collection and select it.',
  },
  {
    name: 'onInputReset',
    payload: "(rejected: string, details: { reason: 'blur', source? })",
    when: 'When the input loses focus holding text that matches no option while allowsCustomValue is off. The text returns to the label of the chosen option, or empties, and the handler receives the rejected text.',
  },
  {
    name: 'onLoadMore',
    payload: '()',
    when: 'When the end of the rendered list scrolls into view. Fetch the next page; the combobox keeps no cursor of its own.',
  },
];

const composition = apiRows([
  [
    'ComboboxDefaultsProvider',
    'component',
    '—',
    'Application',
    'Sets any axis once for a subtree. The phrases come from the active locale, set by SlottedProvider.',
  ],
  [
    'render',
    '(props) => ReactNode',
    '—',
    'ComboboxInput, ComboboxContent',
    'Replaces the frame around the input, or the popup layer. The input and the listbox carry the role and the ARIA wiring, so they cannot be replaced.',
  ],
  [
    'ref',
    'Ref<ComboboxHandle>',
    '—',
    'Combobox',
    'focus(), open(), close() and scrollToKey(value), for actions a prop cannot express.',
  ],
  [
    'ref',
    'Ref<HTMLInputElement>',
    '—',
    'ComboboxInput',
    'The input element, for code that reads the caret or the selection.',
  ],
  [
    'native props',
    'ComponentPropsWithRef<…>',
    '—',
    'every part',
    'Each part accepts the props of its element. Your onKeyDown, placeholder, maxLength or aria-label reaches that element, and the combobox handler runs alongside yours instead of replacing it.',
  ],
]);

const accessibility = [
  'The input has role="combobox" with aria-autocomplete, aria-expanded and aria-controls. The popup has role="listbox", and each row has role="option". The trigger button is out of the tab sequence, as the ARIA combobox pattern requires.',
  'Focus stays on the input, so Home, End, ArrowLeft, ArrowRight, Backspace and Delete keep their text-editing behaviour. The highlight moves through aria-activedescendant, and the caret does not move with it.',
  'Escape works in two steps, both named by the pattern. With the popup open, it closes the popup and keeps the text. With the popup closed, it restores the label of the chosen option, and a second press clears the selection.',
  'The status row is a polite live region. It announces how many options matched, and "Loading…" while a request is in flight.',
  'Tab commits nothing: an option the reader arrowed past is not a choice, which is where the combobox differs from the select. Tab does accept an inline completion that is still showing.',
];

const code = defineSnippet({
  id: 'combobox-react-anatomy',
  language: 'tsx',
  label: 'The anatomy as it reaches the DOM',
  source: `<div
  data-ui="combobox"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-full-width
  data-open
>
  <input
    data-part="input"
    type="text"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded="true"
    aria-controls="listbox-id"
    aria-activedescendant="option-blueberry"
    value="berr"
  />
  <button data-part="clear" type="button" aria-label="Clear"></button>
  <button data-part="trigger" type="button" tabindex="-1" aria-label="Show options">
    <span data-part="arrow"></span>
  </button>
</div>;

<div data-ui="combobox" data-part="positioner" data-side="bottom" data-align="start" data-open>
  <div data-part="content" role="listbox" id="listbox-id">
    <div data-part="item" role="option" id="option-blueberry" data-value="blueberry" data-current>
      <span data-part="label">
        Blue<mark data-part="match">berr</mark>y
      </span>
      <span data-part="indicator"></span>
    </div>
    <div data-part="status" role="status" aria-live="polite">
      3 results
    </div>
  </div>
</div>;`,
});

const theming = defineSnippet({
  id: 'combobox-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='combobox'] {
  --slotted-combobox-radius: var(--slotted-radius-md);
  --slotted-combobox-highlight: var(--slotted-tone-accent-surface);
  --slotted-combobox-measure: 28rem;
}

/* The span a query matched is the highlight family's mark, painted once
   for every list a reader types into, and retuned under its own identifier. */
[data-ui='highlight'] {
  --slotted-highlight-background: var(--slotted-tone-warning-surface);
  --slotted-highlight-color: var(--slotted-tone-warning-text);
}`,
});

export const REACT_COMBOBOX_DOCS = {
  combobox: {
    accessibility,
    anatomy,
    api,
    composition,
    events,
    imports,
    scenes,
    snippets: [code, theming],
  },
};
