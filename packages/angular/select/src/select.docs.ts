import selectTokens from '@slotted/styles/select/tokens.json';
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

export const ANGULAR_SELECT_TOKENS = selectTokens.map((name) => ({
  name,
  purpose: 'A Select value the theme sets.',
}));

const imports: ReferenceImport = {
  source:
    "import { SlSelect, SlSelectGroup, SlSelectItem, SlSelectSeparator, SlSelectValue } from '@slotted/angular/select';",
  selector: 'sl-select, sl-select-group, sl-select-item, sl-select-separator, [slSelectValue]',
  exportAs: 'slSelect, slSelectGroup, slSelectItem, slSelectSeparator',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'sl-select, the host element itself',
    required: true,
    purpose:
      'The frame, carrying data-ui="select". It draws the border, the shadow, the focus ring and every state, from the same tokens as the text field frame.',
  },
  {
    part: 'trigger',
    element: 'button with role="combobox"',
    required: true,
    purpose:
      'The button with role="combobox". It fills the frame, keeps DOM focus for the whole interaction, and carries aria-expanded, aria-controls and aria-activedescendant. Inside a field it carries the field’s control id, so a press on the label focuses it.',
  },
  {
    part: 'value',
    element: 'span',
    required: true,
    purpose:
      'What the control shows: the chosen label, a summary of several, or the placeholder. An ng-template with slSelectValue replaces the summary. It carries data-placeholder while nothing is chosen, and data-unmatched when a value has no known label.',
  },
  {
    part: 'arrow',
    element: 'span',
    required: true,
    purpose:
      'The chevron, a Glyph inside an Icon box, turned over while the list is open. It sits against the end of the frame and takes no pointer events, so a press on it reaches the trigger.',
  },
  {
    part: 'busy',
    element: 'span',
    required: false,
    purpose:
      'The spinner, drawn in place of the chevron while loading is set. It carries data-ui="spinner", so its ring comes from the spinner stylesheet.',
  },
  {
    part: 'tags',
    element: 'span',
    required: false,
    purpose:
      'The chosen values of a multiple select, one tag each, laid over the trigger rather than inside it: a remove button inside a button would be a control inside a control. Tags that do not fit collapse into one +N tag.',
  },
  {
    part: 'summary',
    element: 'span',
    required: false,
    purpose:
      'The text a multiple select shows under 120 pixels instead of tags, such as ‘3 selected’. It sits inside the value, so it names the trigger whichever of the two is drawn, and it is visually hidden rather than removed while the tags are shown.',
  },
  {
    part: 'clear',
    element: 'button',
    required: false,
    purpose:
      'The clear button. It is drawn while clearable is set and something is chosen, as a sibling of the trigger rather than a child: a focusable element inside a combobox would be a widget inside a widget.',
  },
  {
    part: 'positioner',
    element: 'div, built into the portal when the popup opens',
    required: true,
    purpose:
      'The layer, portalled to the end of the document. It carries data-ui="select" again, because a stylesheet cannot reach the portalled list through the root. Its content is an ng-template, so the options are not created until the list first opens.',
  },
  {
    part: 'content',
    element: 'div with role="listbox", or role="dialog" under search',
    required: true,
    purpose:
      'The list surface. It defines the three columns every option uses, is bounded by the height the positioner reports, and scrolls inside it. With search it becomes a dialog that holds the search field and the list, because a listbox may hold only options and groups.',
  },
  {
    part: 'search',
    element: 'div, drawn only under search',
    required: false,
    purpose:
      'The search row, fixed at the top of the list so it stays in view while the results scroll. The control itself never takes typed text; a value the reader types belongs in a combobox.',
  },
  {
    part: 'search-icon',
    element: 'span, aria-hidden',
    required: false,
    purpose: 'The magnifier, a Glyph inside an Icon box.',
  },
  {
    part: 'search-input',
    element: 'input with role="combobox"',
    required: false,
    purpose:
      'The search field. It carries aria-controls naming the list, aria-autocomplete="list" and aria-activedescendant, and holds DOM focus while the list is open, because a dialog popup does not support aria-activedescendant on the trigger.',
  },
  {
    part: 'list',
    element: 'div with role="listbox", drawn only under search',
    required: false,
    purpose:
      'The listbox inside the dialog when search is set. It scrolls under the fixed search row and defines the option columns in place of the surface.',
  },
  {
    part: 'chosen',
    element: 'div, aria-hidden, drawn while several values are chosen',
    required: false,
    purpose:
      'Every chosen value of a multiple select, as tags at the top of the list. The control holds one line, so it may show three tags and a count; this band shows them all, wraps, and scrolls after two rows. It is aria-hidden and holds no buttons: without search focus never reaches the list, and with search Tab leaves the control, so a remove button here would answer only the pointer. A value is removed from its option or from its tag in the control.',
  },
  {
    part: 'match',
    element: 'mark, the match part of the highlight family, whose root sits inside label',
    required: false,
    purpose:
      'The span of a label that the query matched, found with the same comparison the filter used. It is drawn only for an option given the label input, because Angular cannot read projected content before it is created.',
  },
  {
    part: 'group',
    element: 'sl-select-group with role="group"',
    required: false,
    purpose:
      'A run of options under a heading. It spans every column and inherits them, so its options align with the options outside it.',
  },
  {
    part: 'group-label',
    element: 'div',
    required: false,
    purpose:
      'The group’s heading. The group references it with aria-labelledby, as the listbox pattern requires of every option group.',
  },
  {
    part: 'item',
    element: 'sl-select-item with role="option"',
    required: true,
    purpose:
      'One option, not a button: an option is not separately focusable, and a button would add a tab stop. data-current marks the highlight and data-selected the chosen option.',
  },
  {
    part: 'indicator',
    element: 'span',
    required: true,
    purpose:
      'The check mark in the last column. Its box is reserved whether or not the mark is drawn, so rows do not shift as the highlight moves.',
  },
  {
    part: 'icon',
    element: 'span',
    required: false,
    purpose:
      'The glyph the icon input names, drawn as a Glyph inside an Icon box. It is separate from the check mark, which says whether the option is chosen.',
  },
  {
    part: 'label',
    element: 'span',
    required: true,
    purpose:
      'The option’s text, and the only column that shrinks. It wraps to two lines and then truncates, with the whole text still in the DOM.',
  },
  {
    part: 'description',
    element: 'span',
    required: false,
    purpose: 'A second line under the label, for detail the label has no room for.',
  },
  {
    part: 'separator',
    element: 'sl-select-separator with role="separator"',
    required: false,
    purpose: 'A line between two runs of options. It is not focusable and not interactive.',
  },
  {
    part: 'empty',
    element: 'div',
    required: false,
    purpose: 'The text the list shows when it holds no options: the empty message.',
  },
  {
    part: 'status',
    element: 'div with role="status"',
    required: false,
    purpose:
      'The live region that announces the loading message, and the number of results while searching. It keeps the width of the list, so nothing shifts when the options arrive.',
  },
  {
    part: 'placeholder',
    element: 'div',
    required: false,
    purpose:
      'Three rows the height of an option, drawn with the skeleton stylesheet while loading is set. They are hidden from assistive technology, because the status row announces the wait.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One select with every axis on it, driven by the controls under the canvas. Change size, variant and width and watch the control and its popup answer together.',
    snippet: defineSnippet({
      id: 'select-angular-playground',
      language: 'angular',
      label: 'A control, and the options it opens',
      source: `<sl-select aria-label="Fruit" placeholder="Choose a fruit">
  <sl-select-item value="apple">Apple</sl-select-item>
  <sl-select-item value="blueberry">Blueberry</sl-select-item>
</sl-select>`,
    }),
  },
  {
    id: 'selection',
    title: 'Two-way, and the request',
    note: 'The model moves the value in both directions; the request output arrives first and carries the reason, so a page can tell a press from a key — or refuse the change.',
    snippet: defineSnippet({
      id: 'select-angular-selection',
      language: 'angular',
      label: 'Who owns the value',
      source: `<sl-select [(value)]="fruit" (valueChangeRequest)="log($event.reason)">…</sl-select>`,
    }),
  },
  {
    id: 'placeholder',
    title: 'Placeholder and unresolved values',
    note: 'Nothing chosen shows the placeholder in the muted step. A value the collection cannot name shows the value itself, which is what an async list holds for one render.',
    snippet: defineSnippet({
      id: 'select-angular-placeholder',
      language: 'angular',
      label: 'Empty, and holding a value it cannot name',
      source: `<sl-select placeholder="Choose a fruit" [items]="known" [value]="'usr_8f21c0'">…</sl-select>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups, icons and descriptions',
    note: 'Two named groups with a line between them. Every label starts on the same line whether or not its option carries artwork, because the column belongs to the list.',
    snippet: defineSnippet({
      id: 'select-angular-groups',
      language: 'angular',
      label: 'A list with sections',
      source: `<sl-select aria-label="Produce">
  <sl-select-group label="Berries">
    <sl-select-item value="raspberry" description="In season until September">
      Raspberry
    </sl-select-item>
  </sl-select-group>
  <sl-select-separator />
  <sl-select-group label="Citrus">
    <sl-select-item value="pomelo" icon="dot">Pomelo</sl-select-item>
  </sl-select-group>
</sl-select>`,
    }),
  },
  {
    id: 'multiple',
    title: 'Multiple selection',
    note: 'The popup stays open as options are taken, and the control shows the first label and how many more. Space toggles without closing, which is the listbox pattern’s own model.',
    snippet: defineSnippet({
      id: 'select-angular-multiple',
      language: 'angular',
      label: 'Several values, summarized',
      source: `<sl-select multiple [(value)]="fruit">
  <ng-template slSelectValue let-values>{{ values.length }} chosen</ng-template>
  <sl-select-item value="apple">Apple</sl-select-item>
</sl-select>`,
    }),
  },
  {
    id: 'clearable',
    title: 'Clearable',
    note: 'The clear button appears only once something is chosen, and focus goes back to the control it belonged to rather than to the document.',
    snippet: defineSnippet({
      id: 'select-angular-clearable',
      language: 'angular',
      label: 'Taking the choice back',
      source: `<sl-select clearable [(value)]="fruit">…</sl-select>`,
    }),
  },
  {
    id: 'sizes',
    title: 'Sizes',
    note: 'Three steps, and every one of them reads control geometry — so a select beside a text field of the same size is the same height to the pixel.',
    snippet: defineSnippet({
      id: 'select-angular-sizes',
      language: 'angular',
      label: 'The three control steps',
      source: `<sl-select size="sm">…</sl-select>
<sl-select size="md">…</sl-select>
<sl-select size="lg">…</sl-select>`,
    }),
  },
  {
    id: 'variants',
    title: 'Variants',
    note: 'outline on the page, subtle where a form sinks into its card, and plain for a table cell that is only a control while it is being used.',
    snippet: defineSnippet({
      id: 'select-angular-variants',
      language: 'angular',
      label: 'How much frame the control shows',
      source: `<sl-select variant="outline">…</sl-select>
<sl-select variant="subtle">…</sl-select>
<sl-select variant="plain">…</sl-select>`,
    }),
  },
  {
    id: 'states',
    title: 'States',
    note: 'Required, invalid, read-only and disabled side by side. Read-only keeps its value legible and refuses to open; disabled answers nothing at all.',
    snippet: defineSnippet({
      id: 'select-angular-states',
      language: 'angular',
      label: 'What the control refuses, and how it says so',
      source: `<sl-select invalid>…</sl-select>
<sl-select readOnly [value]="'apple'">…</sl-select>
<sl-select disabled [value]="'apple'">…</sl-select>`,
    }),
  },
  {
    id: 'loading-and-empty',
    title: 'Loading and empty',
    note: 'A popup with nothing in it opens onto a sentence rather than onto a two-pixel box, and a loading one keeps that measure so nothing jumps when the options land.',
    snippet: defineSnippet({
      id: 'select-angular-loading-and-empty',
      language: 'angular',
      label: 'Two states no surveyed implementation draws',
      source: `<sl-select loading [messages]="{ loading: 'Fetching teams…' }">…</sl-select>
<sl-select [messages]="{ empty: 'No teams yet' }"></sl-select>`,
    }),
  },
  {
    id: 'long-content',
    title: 'Content the family did not choose',
    note: 'A translated label, an unbroken identifier and a hundred options. The label clamps at two lines with the whole string still in the DOM, and the token breaks inside the option.',
    snippet: defineSnippet({
      id: 'select-angular-long-content',
      language: 'angular',
      label: 'Long, translated and unbroken',
      source: `<sl-select-item value="urn">urn:acme:catalogue:9f2c41ab8de07c5511903fbe</sl-select-item>`,
    }),
  },
  {
    id: 'search',
    title: 'Searching a long list',
    note: 'search opens the popup onto a field. The query filters the options, the span it matched is marked, and the count is announced. It is transient: it never becomes a value, it is emptied when an option is taken, and the control goes on showing the chosen label. Escape clears the query before it closes the popup, and Tab commits and leaves the control.',
    snippet: defineSnippet({
      id: 'select-angular-search',
      language: 'angular',
      label: 'A field above the options, and what it filters',
      source: `<sl-select search aria-label="Country" placeholder="Choose a country">
  <sl-select-item value="nl" label="Netherlands" />
  <sl-select-item value="nz" label="New Zealand" />
</sl-select>

<!-- The query is a value like any other, and it is not the selection. -->
<sl-select search [(searchValue)]="query" (searchValueChangeRequest)="onQuery($event)" />

<!-- A list a server has already filtered decides nothing here. -->
<sl-select search [filter]="null" [loading]="pending()" />`,
    }),
  },
  {
    id: 'placement',
    title: 'Placement and width',
    note: 'The popup hangs from the start edge of its control. It is never narrower than the control and grows when an option needs more room, so a narrow control does not wrap its labels. width="anchor" pins it to the width of the control.',
    snippet: defineSnippet({
      id: 'select-angular-placement',
      language: 'angular',
      label: 'Where the popup goes, and how wide it is',
      source: `<sl-select side="top" align="end" width="anchor">…</sl-select>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'Keyboard',
    note: 'Focus never leaves the button: the arrows, Home, End and the page keys move aria-activedescendant, and typing jumps to the first option that begins with it.',
    snippet: defineSnippet({
      id: 'select-angular-keyboard',
      language: 'angular',
      label: 'What the reader can reach without a pointer',
      source: `<sl-select typeahead [typeaheadTimeout]="500" [loop]="false">…</sl-select>`,
    }),
  },
  {
    id: 'form',
    title: 'In a Reactive Form',
    note: 'The control is a ControlValueAccessor and a Validator, so formControl moves the value and required is reported by the family — the hidden native select always holds an option, so the browser cannot answer it.',
    snippet: defineSnippet({
      id: 'select-angular-form',
      language: 'angular',
      label: 'A control a form owns',
      source: `<div slField required>
  <label slFieldLabel>Fruit</label>
  <sl-select [formControl]="fruit" required aria-label="Fruit">
    <sl-select-item value="apple">Apple</sl-select-item>
  </sl-select>
  <span slFieldError>Choose one.</span>
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Composition',
    note: 'Defaults provided once for a whole application, a summary the consumer writes as a template, and the instance reached from the template through exportAs.',
    snippet: defineSnippet({
      id: 'select-angular-composition',
      language: 'ts',
      label: 'What a consumer can replace',
      source: `providers: [provideSelectDefaults({ size: 'sm', variant: 'subtle', width: 'anchor' })];`,
    }),
  },
];

const api = apiRows([
  [
    'search',
    'boolean',
    'false',
    'sl-select',
    'Puts a search field at the top of the list. The list becomes a dialog, DOM focus moves into the search field, and typeahead turns off.',
  ],
  [
    'searchValue',
    'model<string>',
    "''",
    'sl-select',
    'The search query. Two-way bindable. It is never the selection.',
  ],
  [
    'filter',
    '((label: string, query: string) => boolean) | null',
    'createFilter',
    'sl-select',
    'Decides whether an option matches the query. Unset uses a locale-sensitive contains that ignores case and accents. null turns filtering off, for a list a server has already filtered. A function replaces the comparison.',
  ],
  [
    'highlightMatch',
    'boolean',
    'true',
    'sl-select',
    'Whether the span of a label that matched the query is marked.',
  ],
  [
    'locale',
    'string',
    '—',
    'sl-select',
    'The BCP 47 language the default filter compares in. Defaults to the language in force.',
  ],
  [
    'label',
    'string',
    '—',
    'sl-select-item',
    'The label as text instead of projected content. The filter compares it and the match mark splits it. An option that projects its label is filtered on textValue or on its rendered text and is not marked, because Angular cannot read projected content before it is created.',
  ],
  [
    'value',
    'model<string | string[] | null>',
    'null',
    'sl-select',
    'The chosen value, or values when multiple is set. Two-way bindable; formControl, formControlName and ngModel bind it too.',
  ],
  ['open', 'model<boolean>', 'false', 'sl-select', 'Whether the list is open. Two-way bindable.'],
  [
    'highlightedValue',
    'model<string | null>',
    'null',
    'sl-select',
    'The highlighted option. Two-way bindable. The highlight is where the keyboard is, not what is chosen.',
  ],
  ['placeholder', 'string', '—', 'sl-select', 'What the control shows while nothing is chosen.'],
  [
    'items',
    'SelectItems',
    '—',
    'sl-select',
    'Values with their labels, so the closed control can show the label of a value whose option has not been rendered. Options are rendered only while the list is open.',
  ],
  [
    'name',
    'string',
    '—',
    'sl-select',
    'The name the value is submitted under. It renders a hidden native select that a plain form submits.',
  ],
  [
    'form',
    'string',
    '—',
    'sl-select',
    'The id of the form the control belongs to, when it is not the enclosing form.',
  ],
  [
    'total',
    'number',
    '—',
    'sl-select',
    'The size of the whole collection when only part of it is rendered. Options with position then carry aria-setsize and aria-posinset.',
  ],
  [
    'size',
    "'sm' | 'md' | 'lg'",
    'md',
    'sl-select',
    'The step of the control scale. When unset, the select takes the size of its field.',
  ],
  [
    'variant',
    "'outline' | 'subtle' | 'plain'",
    'outline',
    'sl-select',
    'How much frame the control draws: an outline, a filled subtle frame, or plain, with no frame at rest.',
  ],
  [
    'side',
    "'bottom' | 'top' | 'inline-start' | 'inline-end' | 'left' | 'right'",
    'bottom',
    'sl-select',
    'The edge of the control the list opens from.',
  ],
  [
    'align',
    "'start' | 'center' | 'end'",
    'start',
    'sl-select',
    'Where the list aligns along that edge.',
  ],
  [
    'width',
    "'anchor' | 'content'",
    'content',
    'sl-select',
    'content keeps the list at least as wide as the control and widens it to its longest option; anchor pins it to the width of the control.',
  ],
  [
    'mount',
    "'active' | 'lazy' | 'eager'",
    'active',
    'sl-select',
    'When the list exists in the DOM: active while it is open, lazy from the first open on, eager from the start.',
  ],
  [
    'strategy',
    "'absolute' | 'fixed'",
    'absolute',
    'sl-select',
    'The CSS position the positioner gives the list.',
  ],
  [
    'multiple',
    'boolean',
    'false',
    'sl-select',
    'Allows several values. The value becomes an array, and the list stays open as options are chosen.',
  ],
  ['clearable', 'boolean', 'false', 'sl-select', 'Draws a clear button once something is chosen.'],
  [
    'loop',
    'boolean',
    'false',
    'sl-select',
    'Whether the arrow keys wrap from the last option to the first.',
  ],
  [
    'typeahead',
    'boolean',
    'true',
    'sl-select',
    'Whether typing the first letters of a label highlights the matching option. Off while search is set.',
  ],
  [
    'typeaheadTimeout',
    'number',
    '500',
    'sl-select',
    'How long typed letters keep building one search, in milliseconds.',
  ],
  [
    'closeOnSelect',
    'boolean',
    'true',
    'sl-select',
    'Whether choosing an option closes the list. A multiple select stays open regardless.',
  ],
  ['closeOnEscape', 'boolean', 'true', 'sl-select', 'Whether Escape closes the list.'],
  [
    'closeOnOutsidePress',
    'boolean',
    'true',
    'sl-select',
    'Whether a press outside the list closes it.',
  ],
  [
    'flip',
    'boolean',
    'true',
    'sl-select',
    'Whether the list may open on the opposite side when it does not fit.',
  ],
  [
    'shift',
    'boolean',
    'true',
    'sl-select',
    'Whether the list may slide along its edge to stay in view.',
  ],
  [
    'hideWhenDetached',
    'boolean',
    'true',
    'sl-select',
    'Whether the list hides while its control is scrolled out of view.',
  ],
  [
    'portal',
    'boolean',
    'true',
    'sl-select',
    'Whether the list renders at the end of the document instead of inside the control.',
  ],
  [
    'fullWidth',
    'boolean',
    'true',
    'sl-select',
    'Whether the control fills its container. false sizes it to its widest value.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-select',
    'Disables the control and takes it out of the tab order. When unset, the select takes the state of its field or of its form control.',
  ],
  [
    'readOnly',
    'boolean',
    'false',
    'sl-select',
    'Keeps the value visible and focusable and never opens the list. When unset, the select takes the state of its field.',
  ],
  [
    'required',
    'boolean',
    'false',
    'sl-select',
    'Sets aria-required, and makes the select’s validator report a required error while nothing is chosen.',
  ],
  [
    'invalid',
    'boolean',
    'false',
    'sl-select',
    'Sets aria-invalid and draws the border and the focus ring in the danger tone. When unset, the select takes the state of its field.',
  ],
  [
    'loading',
    'boolean',
    'false',
    'sl-select',
    'Shows the spinner, three placeholder rows and the loading message, and sets aria-busy on the listbox.',
  ],
  [
    'sideOffset',
    'number',
    '4',
    'sl-select',
    'The gap between the control and the list, in pixels.',
  ],
  ['alignOffset', 'number', '0', 'sl-select', 'How far the list shifts along its edge, in pixels.'],
  [
    'collisionPadding',
    'number',
    '8',
    'sl-select',
    'The distance the list keeps from the edges of the viewport, in pixels.',
  ],
  [
    'messages',
    'Partial<SelectMessages>',
    '—',
    'sl-select',
    'Replaces any of the phrases the select writes: clear, remove ({label}), summary ({count}), search, searchPlaceholder, count ({count}), empty and loading. Phrases left out come from the language in force.',
  ],
  [
    'value',
    'string',
    '—',
    'sl-select-item',
    'The option’s value: what is submitted and what a change request carries.',
  ],
  [
    'disabled',
    'boolean',
    'false',
    'sl-select-item',
    'Announces the option as unavailable, keeps it in the list, and skips it with every movement key.',
  ],
  ['description', 'string', '—', 'sl-select-item', 'A second line under the label.'],
  [
    'icon',
    'GlyphName',
    '—',
    'sl-select-item',
    'The glyph drawn in the first column, inside an Icon box.',
  ],
  [
    'textValue',
    'string',
    '—',
    'sl-select-item',
    'The text typeahead and the filter match on, when the label is not plain text.',
  ],
  [
    'position',
    'number',
    '—',
    'sl-select-item',
    'The option’s one-based place in the whole collection, written as aria-posinset.',
  ],
  [
    'label',
    'string',
    '—',
    'sl-select-group',
    'The group’s heading, which names the group through aria-labelledby.',
  ],
]);

const events: EventRow[] = [
  {
    name: 'valueChange',
    payload: 'string | string[] | null',
    when: 'After the selection changes. It is the output half of [(value)].',
  },
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<string | string[] | null>',
    when: 'Before the selection changes. reason is pointer, keyboard, clear, select or programmatic, and cancel() refuses the change.',
  },
  {
    name: 'openChange',
    payload: 'boolean',
    when: 'After the list opens or closes. It is the output half of [(open)].',
  },
  {
    name: 'openChangeRequest',
    payload: 'ChangeRequest<boolean>',
    when: 'Before the list opens or closes. reason tells a choice from a dismissal: select, escape, outsidePress, pointer, keyboard, dismiss, blur or programmatic.',
  },
  {
    name: 'searchValueChange',
    payload: 'string',
    when: 'After the query changes. It is the output half of [(searchValue)].',
  },
  {
    name: 'searchValueChangeRequest',
    payload: 'ChangeRequest<string>',
    when: 'Before the query changes. reason is keyboard for typing, select when an option is chosen while the list stays open, and clear when Escape empties the field or the list empties it as it opens and closes.',
  },
  {
    name: 'highlightedValueChangeRequest',
    payload: 'ChangeRequest<string | null>',
    when: 'Before the highlight moves. reason is pointer, keyboard or programmatic.',
  },
];

const composition = apiRows([
  [
    'provideSelectDefaults()',
    'Provider',
    '—',
    'Application',
    'Sets any axis once, in a bootstrap, a route or a component’s providers. The words come from the language in force, set by provideSlotted. An input set on one select still wins.',
  ],
  [
    'slSelectValue',
    'ng-template',
    '—',
    'sl-select',
    'Replaces the built-in summary. The template context holds the values as $implicit and their labels as labels.',
  ],
  [
    'exportAs',
    'slSelect',
    '—',
    'sl-select',
    'The SlSelect instance, for a template that calls focus(), focusSearch(), setOpen() or scrollToKey().',
  ],
  [
    'ControlValueAccessor',
    'NG_VALUE_ACCESSOR',
    '—',
    'sl-select',
    'formControl, formControlName and ngModel bind the value, and the form’s disabled state reaches the control.',
  ],
  [
    'Validator',
    'NG_VALIDATORS',
    '—',
    'sl-select',
    'The select reports required itself: the hidden native select always holds an option, so the browser cannot.',
  ],
]);

const accessibility = [
  'The trigger is a button with role="combobox", aria-haspopup="listbox" and aria-expanded. The list is a listbox with an option for each row.',
  'DOM focus stays on the trigger. aria-activedescendant names the highlighted option, which also carries data-current; chosen options carry aria-selected and data-selected. The highlight is where the keyboard is; the selection is what was chosen.',
  'A disabled option carries aria-disabled, keeps its place in the list, and is skipped by every movement key, typeahead included.',
  'Inside a field, the trigger carries the field’s control id, so a press on the label focuses it without opening the list. The trigger also takes the label through aria-labelledby, because the name a label gives a button does not reliably reach a button with role="combobox". Outside a field, give sl-select an aria-label, which it forwards to the trigger.',
  'With search, the list is a dialog that holds a search field and a listbox, the trigger sets aria-haspopup="dialog", and focus moves into the search field while the list is open.',
  'Tab chooses the highlighted option and moves focus on, as the APG select-only example specifies; a native select only closes. Escape closes without choosing.',
];

const code = defineSnippet({
  id: 'select-angular-anatomy',
  language: 'angular',
  label: 'The anatomy as it reaches the DOM',
  source: `<sl-select data-ui="select" data-part="root" data-size="md" data-variant="outline" data-open>
  <button
    data-part="trigger"
    type="button"
    role="combobox"
    aria-haspopup="listbox"
    aria-expanded="true"
    aria-activedescendant="option-blueberry"
  >
    <span data-part="value">Blueberry</span>
  </button>
  <span data-part="arrow"></span>
</sl-select>`,
});

const theming = defineSnippet({
  id: 'select-theming',
  language: 'css',
  label: 'What an application retunes',
  source: `[data-ui='select'] {
  --slotted-select-radius: var(--slotted-radius-md);
  --slotted-select-highlight: var(--slotted-tone-accent-surface);
  --slotted-select-highlight-ring: var(--slotted-tone-accent-border);
  --slotted-select-measure: 20rem;
}`,
});

export const ANGULAR_SELECT_DOCS = {
  select: {
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
