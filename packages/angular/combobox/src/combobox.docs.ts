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

export const ANGULAR_COMBOBOX_TOKENS = comboboxTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Combobox decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  SlCombobox,\n  SlComboboxGroup,\n  SlComboboxItem,\n  SlComboboxItemIcon,\n  SlComboboxSeparator,\n} from '@slotted/angular/combobox';",
  selector:
    'sl-combobox, sl-combobox-group, sl-combobox-item, [slComboboxItemIcon], sl-combobox-separator',
  exportAs: 'slCombobox, slComboboxGroup, slComboboxItem, slComboboxSeparator',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'sl-combobox, the host element',
    required: true,
    purpose:
      'The visible frame, carrying data-ui="combobox". It draws the border, the shadow, the focus ring and every state, from the same tokens as the text field and the select.',
  },
  {
    part: 'input',
    element: 'input with role="combobox"',
    required: true,
    purpose:
      'A native text input, so the caret, the selection, IME, autofill and every text-editing key behave as in any input. It keeps focus for the whole interaction.',
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
      'Resets both the text and the chosen value, and returns focus to the input. Present only while clearable is set and the input holds text.',
  },
  {
    part: 'positioner',
    element: 'div, built at the end of the document when the popup opens',
    required: true,
    purpose:
      'The popup layer. It carries data-ui="combobox" again, because a stylesheet scoped to the root cannot reach a subtree outside it.',
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
    element: 'sl-combobox-group with role="group"',
    required: false,
    purpose:
      'A named set of options. A group whose options were all filtered away is hidden, so no heading appears without options under it.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose: 'The name of a group, which the group references through aria-labelledby.',
  },
  {
    part: 'item',
    element: 'sl-combobox-item with role="option"',
    required: true,
    purpose:
      'One option. It compares its own label against the query and hides itself when it does not match.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose: 'The check in the last column, shown on the chosen option.',
  },
  {
    part: 'icon',
    element: 'span, or the element slComboboxItemIcon is on',
    required: false,
    purpose:
      'The first column: the glyph the icon input names, drawn as a Glyph inside an Icon, or an element of your own marked slComboboxItemIcon.',
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
    element: 'sl-combobox-separator with role="separator"',
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
      id: 'combobox-angular-playground',
      language: 'angular',
      label: 'An input, and the options it filters',
      source: `<sl-combobox aria-label="Fruit" placeholder="Search fruit">
  <sl-combobox-item value="blueberry" label="Blueberry" />
  <sl-combobox-item value="raspberry" label="Raspberry" />
</sl-combobox>`,
    }),
  },
  {
    id: 'filtering',
    title: 'Filtering, and the mark',
    note: 'The default comparison is locale-sensitive, so resume finds Resumé — and the mark shows the span the collator matched rather than a naive substring that would disagree with it.',
    snippet: defineSnippet({
      id: 'combobox-angular-filtering',
      language: 'angular',
      label: 'Three answers, and which one each asks for',
      source: `<sl-combobox locale="pt-BR">…</sl-combobox>
<sl-combobox [filter]="startsWith">…</sl-combobox>
<sl-combobox [filter]="null">…</sl-combobox>`,
    }),
  },
  {
    id: 'autocomplete',
    title: 'Autocomplete',
    note: 'The pattern’s own three values. both writes the rest of the first match into the field as a selected range, so the next character replaces it and Backspace withdraws it.',
    snippet: defineSnippet({
      id: 'combobox-angular-autocomplete',
      language: 'angular',
      label: 'What the field does as the reader types',
      source: `<sl-combobox autocomplete="none">…</sl-combobox>
<sl-combobox autocomplete="list">…</sl-combobox>
<sl-combobox autocomplete="both">…</sl-combobox>`,
    }),
  },
  {
    id: 'custom-value',
    title: 'A value that is not on the list',
    note: 'With allowsCustomValue the typed text commits as the value. Without it, Enter puts the text back to the committed option’s label — the pattern’s own "reverts".',
    snippet: defineSnippet({
      id: 'combobox-angular-custom-value',
      language: 'angular',
      label: 'Inventing a value, or refusing to',
      source: `<sl-combobox allowsCustomValue [(value)]="label">…</sl-combobox>`,
    }),
  },
  {
    id: 'creation',
    title: 'Adding a value the list does not hold',
    note: 'With creatable, the last option offers to add what was typed once nothing matched. It is an option — ArrowDown reaches it, Enter takes it — and taking it emits create with the query and selects nothing: the collection is the consumer’s.',
    snippet: defineSnippet({
      id: 'combobox-angular-creation',
      language: 'angular',
      label: 'Offering to add what was typed',
      source: `<sl-combobox creatable (create)="add($event.query)">…</sl-combobox>`,
    }),
  },
  {
    id: 'async',
    title: 'Asynchronous results',
    note: 'Debounce the fetch, not the combobox: a component that delayed its own request would delay a controlled consumer’s re-render and drop characters between them.',
    snippet: defineSnippet({
      id: 'combobox-angular-async',
      language: 'angular',
      label: 'A search a page owns',
      source: `<sl-combobox
  [filter]="null"
  [loading]="pending()"
  [(inputValue)]="query"
  (loadMore)="fetchNextPage()"
>
  …
</sl-combobox>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups',
    note: 'Two named groups. A group whose every option was filtered away disappears with them, so a heading never claims a category matched when none did.',
    snippet: defineSnippet({
      id: 'combobox-angular-groups',
      language: 'angular',
      label: 'Results with sections',
      source: `<sl-combobox aria-label="Produce">
  <sl-combobox-group label="Berries">
    <sl-combobox-item value="blueberry" label="Blueberry" />
  </sl-combobox-group>
  <sl-combobox-group label="Citrus">
    <sl-combobox-item value="pomelo" label="Pomelo" />
  </sl-combobox-group>
</sl-combobox>`,
    }),
  },
  {
    id: 'clearable',
    title: 'Clearable',
    note: 'One press takes both contracts back — the text and the chosen key — and focus returns to the field rather than to the document.',
    snippet: defineSnippet({
      id: 'combobox-angular-clearable',
      language: 'angular',
      label: 'Emptying the field',
      source: `<sl-combobox clearable [messages]="{ clear: 'Clear the search' }">…</sl-combobox>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'Three steps, every one reading control geometry — so a combobox beside a text field of the same size is the same height to the pixel.',
    snippet: defineSnippet({
      id: 'combobox-angular-sizes',
      language: 'angular',
      label: 'The three control steps',
      source: `<sl-combobox size="sm">…</sl-combobox>
<sl-combobox size="md">…</sl-combobox>
<sl-combobox size="lg">…</sl-combobox>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline on the page, subtle where a form sinks into its card, and plain for a table cell that is only a control while it is being used.',
    snippet: defineSnippet({
      id: 'combobox-angular-variants',
      language: 'angular',
      label: 'How much frame the control shows',
      source: `<sl-combobox variant="outline">…</sl-combobox>
<sl-combobox variant="subtle">…</sl-combobox>
<sl-combobox variant="plain">…</sl-combobox>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Required, invalid, read-only and disabled. Read-only keeps the caret, the selection and the copy, and withholds only the popup, which the combobox decides because the pattern has no read-only state.',
    snippet: defineSnippet({
      id: 'combobox-angular-states',
      language: 'angular',
      label: 'What the control refuses, and how it says so',
      source: `<sl-combobox [invalid]="true">…</sl-combobox>
<sl-combobox [readOnly]="true">…</sl-combobox>
<sl-combobox [disabled]="true">…</sl-combobox>`,
    }),
  },
  {
    id: 'empty',
    title: 'Nothing matched, and still travelling',
    note: 'A query with no answers opens onto a sentence. A query whose answer is in flight keeps the same measure, so nothing jumps when the results land.',
    snippet: defineSnippet({
      id: 'combobox-angular-empty',
      language: 'angular',
      label: 'The two states the field spends most time in',
      source: `<sl-combobox [messages]="{ empty: 'Try a different spelling' }">…</sl-combobox>`,
    }),
  },
  {
    id: 'long-content',
    title: 'Long, translated and unbroken content',
    note: 'A translated label, an unbroken identifier and two hundred options. The label clamps at two lines with the whole string in the DOM, and the mark sits inside the token that broke.',
    snippet: defineSnippet({
      id: 'combobox-angular-long-content',
      language: 'angular',
      label: 'Long, translated and unbroken',
      source: `<sl-combobox-item value="urn" label="urn:acme:catalogue:9f2c41ab8de07c5511903fbe" />`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'The arrows and the page keys move the highlight without moving the caret; Home, End, Backspace and Delete are never intercepted, which the pattern asks for by name.',
    snippet: defineSnippet({
      id: 'combobox-angular-keyboard',
      language: 'angular',
      label: 'What the combobox binds, and what it leaves alone',
      source: `<sl-combobox openOn="input" [autoHighlight]="false" [loop]="false">…</sl-combobox>`,
    }),
  },
  {
    id: 'form',
    title: 'In a Reactive Form',
    note: 'A ControlValueAccessor and a Validator: required is reported, and so is a typed string that matches no option when a custom value is not allowed — a state no native input can describe.',
    snippet: defineSnippet({
      id: 'combobox-angular-form',
      language: 'angular',
      label: 'A control a form owns',
      source: `<div slField [required]="true">
  <label slFieldLabel>Reviewer</label>
  <sl-combobox [formControl]="reviewer" [required]="true" aria-label="Reviewer">
    <sl-combobox-item value="amanda" label="Amanda Okoro" />
  </sl-combobox>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'Defaults provided once for a whole application; the words come from the language in force (provideSlotted).',
    snippet: defineSnippet({
      id: 'combobox-angular-composition',
      language: 'ts',
      label: 'What a consumer can replace',
      source: `providers: [provideComboboxDefaults({ size: 'sm' })];`,
    }),
  },
];

const api = apiRows([
  [
    'inputValue',
    'model<string>',
    "''",
    'sl-combobox',
    'The text in the input, separate from the chosen value. Two-way.',
  ],
  [
    'value',
    'model<string | null>',
    'null',
    'sl-combobox',
    'The key of the chosen option. Two-way, and the value a form control binds.',
  ],
  [
    'defaultValue',
    'string | null',
    '—',
    'sl-combobox',
    'The initial value when value is not bound, read once at init. It sets the key, not the text.',
  ],
  ['open', 'model<boolean>', 'false', 'sl-combobox', 'Whether the popup is open. Two-way.'],
  [
    'highlightedValue',
    'model<string | null>',
    'null',
    'sl-combobox',
    'The key of the highlighted option, which is separate from the chosen one. Two-way.',
  ],
  [
    'aria-label',
    'string',
    '—',
    'sl-combobox',
    'Names the input and the listbox when no field label names them. The host element keeps no name.',
  ],
  ['placeholder', 'string', "''", 'sl-combobox', 'The text the input shows while it is empty.'],
  [
    'filter',
    '((label, query) => boolean) | null',
    '—',
    'sl-combobox',
    'The comparison between a label and the query. Unset uses a locale-sensitive contains; null turns filtering off for a list a server has already filtered.',
  ],
  [
    'locale',
    'string',
    '—',
    'sl-combobox',
    'The BCP 47 language of the default filter. The active locale when unset.',
  ],
  [
    'items',
    'ComboboxItems',
    '—',
    'sl-combobox',
    'Labels for values, so a closed combobox can show the label of an option it has not rendered.',
  ],
  [
    'name',
    'string',
    '—',
    'sl-combobox',
    'The name the value is submitted under. Renders a hidden input that carries the chosen key.',
  ],
  [
    'form',
    'string',
    '—',
    'sl-combobox',
    'The id of the form the value is submitted with, when it is not the enclosing one.',
  ],
  [
    'total',
    'number',
    '—',
    'sl-combobox',
    'The size of the whole collection, written to aria-setsize on each option.',
  ],
  [
    'autocomplete',
    "'none' | 'list' | 'both'",
    'list',
    'sl-combobox',
    'What typing does: none keeps every option, list filters the options, and both also completes the first match inline. Written to aria-autocomplete.',
  ],
  [
    'openOn',
    "'input' | 'focus' | 'manual'",
    'input',
    'sl-combobox',
    'When the popup opens without the trigger: on typing or a press on the input (input), on every focus and press (focus), or only from the trigger and the arrow keys (manual).',
  ],
  [
    'allowsCustomValue',
    'boolean',
    'false',
    'sl-combobox',
    'Whether text that matches no option becomes the value on Enter or blur.',
  ],
  [
    'creatable',
    'boolean',
    'false',
    'sl-combobox',
    'Whether the popup offers to create what was typed when nothing matched. Taking the offer emits create.',
  ],
  [
    'autoHighlight',
    'boolean',
    'false',
    'sl-combobox',
    'Whether the first match is highlighted when the popup opens and after each query typed, so Enter takes it. A chosen option that is showing takes precedence.',
  ],
  [
    'highlightMatch',
    'boolean',
    'true',
    'sl-combobox',
    'Whether the part of each label the query matched is marked.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'sl-combobox',
    'The control size. Unset follows the enclosing field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'sl-combobox',
    'How much frame the control draws.',
  ],
  [
    'side',
    "'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'sl-combobox',
    'The edge of the control the popup opens from.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'sl-combobox',
    'The alignment of the popup along that edge.',
  ],
  [
    'width',
    "'anchor' | 'content'",
    'content',
    'sl-combobox',
    'The popup width: content keeps it at least as wide as the control and widens it to its longest option; anchor pins it to the width of the control.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'sl-combobox',
    'When the popup is built: only while open, from the first open, or from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'sl-combobox',
    'The CSS positioning the popup uses.',
  ],
  [
    'clearable',
    'boolean',
    'true',
    'sl-combobox',
    'Whether a clear button appears once the input holds text.',
  ],
  [
    'loop',
    'boolean',
    'false',
    'sl-combobox',
    'Whether ArrowDown and ArrowUp wrap at the ends of the list.',
  ],
  [
    'closeOnSelect',
    'boolean',
    'true',
    'sl-combobox',
    'Whether choosing an option closes the popup.',
  ],
  ['closeOnEscape', 'boolean', 'true', 'sl-combobox', 'Whether Escape closes the popup.'],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'sl-combobox',
    'Whether a press outside the combobox closes the popup.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'sl-combobox',
    'Whether the popup moves to the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'sl-combobox',
    'Whether the popup slides along its side to stay in view.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'sl-combobox',
    'Whether the popup hides once the control scrolls out of view.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'sl-combobox',
    'Whether the popup is built at the end of the document instead of inside the combobox.',
  ],
  [
    'fullWidth',
    'boolean',
    'true',
    'sl-combobox',
    'Whether the control fills its container or keeps its own width.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-combobox',
    'Turns off the input, the trigger and the popup. Unset follows the enclosing field and the disabled state of the form control.',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'sl-combobox',
    'Keeps the text selectable and copyable and never opens the popup. Unset follows the enclosing field.',
  ],
  [
    'required',
    'boolean',
    'false',
    'sl-combobox',
    'Sets the native required attribute on the input, and the validator reports an empty value. Unset follows the enclosing field.',
  ],
  [
    'invalid',
    'boolean',
    'false',
    'sl-combobox',
    'Draws the border and the focus ring in the invalid tone and sets aria-invalid. Unset follows the enclosing field.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'sl-combobox',
    'Shows the spinner, the placeholder rows and the loading message, and sets aria-busy on the listbox.',
  ],
  [
    'sideOffset',
    'number',
    '4',
    'sl-combobox',
    'The gap between the control and the popup, in pixels.',
  ],
  [
    'alignOffset',
    'number',
    '0',
    'sl-combobox',
    'How far the popup shifts along its side, in pixels.',
  ],
  [
    'collisionPadding',
    'number',
    '8',
    'sl-combobox',
    'The minimum distance between the popup and the edge of the viewport, in pixels.',
  ],
  [
    'messages',
    'Partial<ComboboxMessages>',
    '—',
    'sl-combobox',
    'Phrases that replace the active locale’s, key by key: clear, trigger, create ({query}), empty, loading and count ({count}).',
  ],
  [
    'value',
    'string',
    '—',
    'sl-combobox-item',
    'The option key: what the form submits and what valueChange emits.',
  ],
  [
    'label',
    'string',
    '—',
    'sl-combobox-item',
    'The option text: what the reader sees, what the filter compares and what the mark splits.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-combobox-item',
    'Keeps the option in the list, announces it as unavailable, and skips it with every movement key.',
  ],
  ['description', 'string', '—', 'sl-combobox-item', 'The second line under the label.'],
  [
    'icon',
    'GlyphName',
    '—',
    'sl-combobox-item',
    'The glyph drawn in the first column, as a Glyph inside an Icon. An element of your own goes there through slComboboxItemIcon.',
  ],
  [
    'position',
    'number',
    '—',
    'sl-combobox-item',
    'The position of the option in the whole collection, written to aria-posinset.',
  ],
  [
    'label',
    'string',
    '—',
    'sl-combobox-group',
    'The name of the group, which the group references through aria-labelledby.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'inputValueChange',
    payload: 'string',
    when: 'After the text changes; the output half of [(inputValue)].',
  },
  {
    name: 'valueChange',
    payload: 'string | null',
    when: 'After the chosen value changes; the output half of [(value)].',
  },
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'After the popup opens or closes; the output half of [(open)].',
  },
  {
    name: 'highlightedValueChange',
    payload: 'string | null',
    when: 'After the highlight moves; the output half of [(highlightedValue)].',
  },
  {
    name: 'inputValueChangeRequest',
    payload: 'ChangeRequest<string>',
    when: 'Before the text changes. The reason is keyboard while the reader types, select when an option is chosen, and clear, blur or programmatic otherwise.',
  },
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<string | null>',
    when: 'Before the chosen value changes. Typing emits only the text request; choosing an option emits both, each with the reason select.',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the popup opens or closes. The reason tells a selection from a dismissal: select, escape, outsidePress, dismiss, blur, pointer, keyboard or programmatic.',
  },
  {
    name: 'highlightedValueChangeRequest',
    payload: 'ChangeRequest<string | null>',
    when: 'Before the highlight moves, by key or by pointer, and when the filter removes the highlighted option.',
  },
  {
    name: 'create',
    payload: '{ query: string; reason: ComboboxValueReason }',
    when: 'When the reader takes the create option, which appears while creatable is set, the query is not empty and nothing matched. The popup closes and nothing is selected: add the option to your collection and select it.',
  },
  {
    name: 'inputReset',
    payload: "{ rejected: string; reason: 'blur' }",
    when: 'When the input loses focus holding text that matches no option while allowsCustomValue is off. The text returns to the label of the chosen option, or empties, and the event carries the rejected text.',
  },
  {
    name: 'loadMore',
    payload: 'void',
    when: 'When the end of the rendered list scrolls into view. Fetch the next page; the combobox keeps no cursor of its own.',
  },
];

const composition = apiRows([
  [
    'provideComboboxDefaults()',
    'Provider',
    '—',
    'Application',
    'Sets any axis once, in a bootstrap, a route or the providers of a component. The phrases come from the active locale, set by provideSlotted.',
  ],
  [
    'slComboboxItemIcon',
    'directive',
    '—',
    'element inside sl-combobox-item',
    'Places the element in the first column, for artwork a glyph cannot draw, such as an avatar.',
  ],
  [
    'exportAs',
    'slCombobox',
    '—',
    'sl-combobox',
    'The component instance, for a template that calls focus(), setOpen() or scrollToKey().',
  ],
  [
    'ControlValueAccessor',
    'NG_VALUE_ACCESSOR',
    '—',
    'sl-combobox',
    'formControl, formControlName and ngModel bind the chosen value, and the disabled state of the form control reaches the combobox.',
  ],
  [
    'Validator',
    'NG_VALIDATORS',
    '—',
    'sl-combobox',
    'Reports required, and text that matches no option while allowsCustomValue is off. A native input cannot report the second.',
  ],
  [
    'native attributes',
    'placeholder, aria-label',
    '—',
    'sl-combobox',
    'The two attributes the host passes to the input. Other attributes stay on the host element, and every text-editing key keeps its browser behavior.',
  ],
]);

const accessibility = [
  'The input has role="combobox" with aria-autocomplete, aria-expanded and aria-controls. The popup has role="listbox", and each row has role="option". The trigger button is out of the tab sequence, as the ARIA combobox pattern requires.',
  'Focus stays on the input, so Home, End, ArrowLeft, ArrowRight, Backspace and Delete keep their text-editing behavior. The highlight moves through aria-activedescendant, and the caret does not move with it.',
  'Escape works in two steps, both named by the pattern. With the popup open, it closes the popup and keeps the text. With the popup closed, it restores the label of the chosen option, and a second press clears the selection.',
  'The status row is a polite live region. It announces how many options matched, and "Loading…" while a request is in flight.',
  'Tab commits nothing: an option the reader arrowed past is not a choice, which is where the combobox differs from the select. Tab does accept an inline completion that is still showing.',
];

const code = defineSnippet({
  id: 'combobox-angular-anatomy',
  language: 'angular',
  label: 'The anatomy as it reaches the DOM',
  source: `<sl-combobox data-ui="combobox" data-part="root" data-size="md" data-open>
  <input
    data-part="input"
    type="text"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded="true"
  />
  <button data-part="clear" type="button" aria-label="Clear"></button>
  <button data-part="trigger" type="button" tabindex="-1" aria-label="Show options">
    <span data-part="arrow"></span>
  </button>
</sl-combobox>`,
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
}`,
});

export const ANGULAR_COMBOBOX_DOCS = {
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
