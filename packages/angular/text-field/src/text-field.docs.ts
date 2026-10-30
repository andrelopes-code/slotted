import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import textFieldTokens from '@slotted/styles/text-field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TEXT_FIELD_TOKENS = textFieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Text Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideTextFieldDefaults,\n  SlTextField,\n  SlTextFieldAction,\n  SlTextFieldEnd,\n  SlTextFieldInput,\n  SlTextFieldStart,\n} from '@slotted/angular/text-field';",
  selector: '[slTextField]',
  exportAs: 'slTextField',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slTextField',
    required: true,
    purpose:
      'The frame. It carries data-ui="text-field", data-size, data-variant and data-mono, and data-disabled, data-invalid, data-readonly and data-loading. It has no role: WAI-ARIA allows a textbox only non-interactive children, so the buttons sit beside the input inside a box that announces nothing.',
  },
  {
    part: 'input',
    element: 'input[slTextFieldInput]',
    required: true,
    purpose:
      'The control. It holds the value and the identifier, and keeps every native attribute you write: type, autocomplete, inputmode, enterkeyhint, pattern, maxlength, name and required. Each is read before the host bindings compute, so none is overwritten. It is a ControlValueAccessor, so a reactive or template-driven form binds to it directly.',
  },
  {
    part: 'start',
    element: 'any element carrying slTextFieldStart',
    required: false,
    purpose:
      'Content before the value in the reading direction, such as a currency, an icon or an @. It is its own bidirectional run, so R$ keeps its order in a right-to-left document, and an icon inside it takes the control’s icon size.',
  },
  {
    part: 'end',
    element: 'any element carrying slTextFieldEnd',
    required: false,
    purpose:
      'Content after the value in the reading direction, such as a unit, a domain or a suffix.',
  },
  {
    part: 'action',
    element: 'button[slTextFieldAction], inside slTextFieldStart or slTextFieldEnd',
    required: false,
    purpose:
      'A button you place inside the frame: a submit, a menu trigger or a tooltip trigger. It is square when named by aria-label and padded when named by its text. aria-expanded="true" keeps it pressed while its menu is open. slMenuTriggerFor can sit on the same element.',
  },
  {
    part: 'busy',
    element: 'span[data-ui="spinner"], rendered by the frame',
    required: false,
    purpose:
      'The shared spinner, before the buttons, while [loading] is true. It is rendered whenever loading is bound and hidden while loading is false, so it can leave with a transition. It is hidden from assistive technology; aria-busy on the input carries the state.',
  },
  {
    part: 'caps-lock',
    element: 'span, rendered by the frame',
    required: false,
    purpose:
      'A mark in a password field while Caps Lock is on and the input has focus. It is hidden from assistive technology; the capsLock message is announced once when Caps Lock turns on.',
  },
  {
    part: 'clear',
    element: 'button, rendered by the frame',
    required: false,
    purpose:
      'Empties the value with reason "clear" and returns focus to the input. It is rendered while clearable is set, hidden while the value is empty or cannot be changed, and never smaller than 24 CSS pixels.',
  },
  {
    part: 'copy',
    element: 'button, rendered by the frame',
    required: false,
    purpose:
      'Writes the value to the clipboard, shows a check with data-complete for two seconds and announces the outcome. It stays on a read-only value and is hidden while the value is empty or the input is disabled.',
  },
  {
    part: 'reveal',
    element: 'button, rendered by the frame',
    required: false,
    purpose:
      'Shows the password as characters and hides it again, keeping the caret where it was. Its name does not change with its state, which is the APG rule for a toggle button; aria-pressed carries the state.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Type into it: the clear button appears only once there is something to clear.',
    snippet: defineSnippet({
      id: 'text-field-angular-playground',
      language: 'angular',
      label: 'A control, its label and its help',
      source: `<div slField>
  <label slFieldLabel>E-mail</label>
  <div slTextField clearable>
    <input slTextFieldInput type="email" placeholder="you@company.com" />
  </div>
  <span slFieldDescription>We will use this address for billing.</span>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'Three steps, and inside a field the control takes the field’s rather than its own: a small field holding a medium control is a field and a control disagreeing about one row.',
    snippet: defineSnippet({
      id: 'text-field-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slTextField size="sm"><input slTextFieldInput /></div>
<div slTextField size="lg"><input slTextFieldInput /></div>

<!-- Inside a field the field decides, and the control follows. -->
<div slField size="sm">
  <div slTextField><input slTextFieldInput /></div>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'outline takes the ground it is placed on, subtle sinks into the page, and plain shows nothing until the pointer or the caret arrives — which is what a dense table cell needs.',
    snippet: defineSnippet({
      id: 'text-field-angular-variants',
      language: 'angular',
      label: 'Three frames, one box',
      source: `<div slTextField variant="subtle"><input slTextFieldInput /></div>

<!-- A cell that is only a control while it is being used. -->
<div slTextField variant="plain" mono><input slTextFieldInput /></div>`,
    }),
  },
  {
    id: 'adornments',
    title: 'What sits inside the border',
    note: 'start and end name the reading direction rather than a side, so the currency mark stays before the amount in Arabic as well. Neither of them is ever squeezed: the value gives up width first.',
    snippet: defineSnippet({
      id: 'text-field-angular-adornments',
      language: 'angular',
      label: 'A mark before the value and a unit after it',
      source: `<div slTextField>
  <span slTextFieldStart>R$</span>
  <input slTextFieldInput inputmode="decimal" defaultValue="1.480,00" />
  <span slTextFieldEnd>BRL</span>
</div>`,
    }),
  },
  {
    id: 'actions',
    title: 'The two buttons the frame draws',
    note: 'Both are real buttons inside the frame, both keep the caret, and both are held to the 24-pixel minimum. Tab into the field and press Tab again: the ring moves to the button rather than staying around the box.',
    snippet: defineSnippet({
      id: 'text-field-angular-actions',
      language: 'angular',
      label: 'Clear, and reveal',
      source: `<div slTextField clearable>
  <input slTextFieldInput type="search" defaultValue="invoice 2026" />
</div>

<div slTextField revealable>
  <input slTextFieldInput type="password" autocomplete="current-password" />
</div>`,
    }),
  },
  {
    id: 'menu',
    title: 'A button of your own inside the frame',
    note: 'A country code that opens a menu, a category beside a search, a submit named in words, an overflow mark: each is a real button in start or end. Open one — it stays pressed while its menu is open, and the value keeps its place beside it.',
    snippet: defineSnippet({
      id: 'text-field-angular-menu',
      language: 'angular',
      label: 'A menu trigger on an action',
      source: `<div slTextField>
  <span slTextFieldStart>
    <button slTextFieldAction [slMenuTriggerFor]="countries">
      {{ country() }}
      <span slIcon><svg slGlyph name="chevron-down"></svg></span>
    </button>
  </span>
  <input slTextFieldInput type="tel" autocomplete="tel-national" />
</div>
<sl-menu #countries>
  <sl-menu-radio-group [(value)]="country">
    <button slMenuRadioItem value="+55">Brasil +55</button>
    <button slMenuRadioItem value="+351">Portugal +351</button>
  </sl-menu-radio-group>
</sl-menu>`,
    }),
  },
  {
    id: 'copy',
    title: 'Copying a value somebody has to paste elsewhere',
    note: 'Press the copy button: the mark turns to a check in the success ink for two seconds and the outcome is announced. A clipboard that refuses — an insecure page, a denied permission — is announced as a failure and shows no check.',
    snippet: defineSnippet({
      id: 'text-field-angular-copy',
      language: 'angular',
      label: 'A read-only link',
      source: `<div slTextField copyable (valueCopy)="$event.copied && track('invite-copied')">
  <input slTextFieldInput readonly defaultValue="https://nexora.app/convite/8f3a" />
</div>`,
    }),
  },
  {
    id: 'password',
    title: 'A password: showing it, and warning about Caps Lock',
    note: 'Focus the password and turn Caps Lock on: the warning mark appears before the eye and is announced once. The eye swaps to a crossed eye and back, and the caret stays where it was.',
    snippet: defineSnippet({
      id: 'text-field-angular-password',
      language: 'angular',
      label: 'Reveal, and the Caps Lock mark every password gets',
      source: `<div slTextField revealable>
  <span slTextFieldStart
    ><span slIcon><svg slGlyph name="lock"></svg></span
  ></span>
  <input slTextFieldInput type="password" autocomplete="current-password" />
</div>`,
    }),
  },
  {
    id: 'loading',
    title: 'Checking the value while the reader keeps typing',
    note: 'A user name checked against the server: the ring stands before the buttons and the input is aria-busy, but it stays editable. Turn loading off and the ring shrinks out rather than vanishing.',
    snippet: defineSnippet({
      id: 'text-field-angular-loading',
      language: 'angular',
      label: 'An asynchronous check',
      source: `<div slTextField clearable [loading]="checking()">
  <span slTextFieldStart>@</span>
  <input slTextFieldInput [formControl]="handle" />
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'The four states the frame paints',
    note: 'Read-only keeps full-strength ink and only its ground changes, because the value is real and still submitted; disabled is muted to a measured colour rather than faded, so a disabled form still says what it holds.',
    snippet: defineSnippet({
      id: 'text-field-angular-states',
      language: 'angular',
      label: 'Every state unset by default, and native where the word means native',
      source: `<!-- Unstated rather than false, so the control defers to its field. -->
<div slTextField>
  <input slTextFieldInput invalid />
</div>
<div slTextField>
  <input slTextFieldInput readonly defaultValue="Somente leitura" />
</div>
<div slTextField>
  <input slTextFieldInput disabled defaultValue="Desativado" />
</div>`,
    }),
  },
  {
    id: 'count',
    title: 'Counting what has been typed',
    note: 'The control counts and the field places it, in the spare column of the label row. Pass countMax without maxlength and the limit becomes a soft one: the value may pass it, and the counter turns before validation runs.',
    snippet: defineSnippet({
      id: 'text-field-angular-count',
      language: 'angular',
      label: 'A hard limit, and a soft one',
      source: `<div slField>
  <label slFieldLabel>Assunto</label>
  <div slTextField>
    <input slTextFieldInput showCount maxlength="60" />
  </div>
</div>

<!-- A limit the browser does not enforce: the value may pass it. -->
<div slField>
  <div slTextField>
    <input slTextFieldInput showCount countMax="16" />
  </div>
</div>`,
    }),
  },
  {
    id: 'types',
    title: 'What kind of text this is',
    note: 'type is the element’s own, and so is everything that travels with it. A phone field that offers the wrong keyboard on a phone is a field nobody fills in twice.',
    snippet: defineSnippet({
      id: 'text-field-angular-types',
      language: 'angular',
      label: 'The six types, and the attributes that go with them',
      source: `<div slTextField>
  <input slTextFieldInput type="email" autocomplete="email" inputmode="email" />
</div>
<div slTextField>
  <input slTextFieldInput type="tel" autocomplete="tel" inputmode="tel" />
</div>
<div slTextField clearable>
  <input slTextFieldInput type="search" enterkeyhint="search" />
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A value longer than the control ellipsises rather than clipping mid-glyph; an unbroken token scrolls, which is the platform’s answer; and at 240 pixels the value surrenders width while the adornments keep their target size.',
    snippet: defineSnippet({
      id: 'text-field-angular-content',
      language: 'angular',
      label: 'Long, translated and right-to-left',
      source: `<div slTextField>
  <input slTextFieldInput defaultValue="Kraftfahrzeug-Haftpflichtversicherungsnummer" />
</div>

<!-- Nothing is removed from the DOM: the whole value stays selectable. -->
<div slTextField clearable>
  <input slTextFieldInput dir="rtl" defaultValue="مرحبا بالعالم" />
</div>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'provideTextFieldDefaults carries the decisions an application takes once; exportAs reaches the instance, and inputElement is the native element with focus, select and setSelectionRange already on it.',
    snippet: defineSnippet({
      id: 'text-field-angular-composition',
      language: 'angular',
      label: 'A token, a reactive form, and the element itself',
      source: `<!-- ControlValueAccessor: the control belongs in a form as it stands. -->
<div slTextField clearable>
  <input slTextFieldInput [formControl]="email" type="email" />
</div>

<!-- exportAs, for the element the template has to reach. -->
<div slTextField>
  <input slTextFieldInput #field="slTextFieldInput" />
  <span slTextFieldEnd>
    <button slTextFieldAction (click)="field.inputElement.select()">Select</button>
  </span>
</div>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Tab reaches the value, then each button in turn. Nothing is bound to Escape: some user agents clear a search input on it, and a control that swallowed the key inside a dialog would be one a keyboard user cannot leave.',
    snippet: defineSnippet({
      id: 'text-field-angular-keyboard',
      language: 'angular',
      label: 'No key is bound, and the buttons are real buttons',
      source: `<form (ngSubmit)="buscar()">
  <div slTextField clearable>
    <input slTextFieldInput type="search" name="q" [(ngModel)]="q" />
  </div>
</form>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<string>',
    when: 'Emitted by slTextFieldInput before the value changes. The request carries the new value, the value it replaces, the reason ("keyboard" for an edit in the input, "clear" for the clear button), the originating event, and cancel(), which refuses the change before it commits.',
  },
  {
    name: '(revealedChange)',
    payload: 'ChangeRequest<boolean>',
    when: 'Emitted by slTextFieldInput before the password toggle changes, with reason "pointer" or "keyboard" read from the click. A form that hides the password again on blur binds [revealed] and listens here.',
  },
  {
    name: '(valueCopy)',
    payload: 'TextFieldCopyDetail — { copied, reason, source, value }',
    when: 'Emitted by slTextField after the copy button has asked the clipboard. copied is false when the clipboard refused the value, and reason is "pointer" or "keyboard".',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'the form’s own value and touched state',
    when: 'The form receives the value whenever it changes and the request was not cancelled, and the touched state on blur. There is no [(value)], because a two-way binding carries only the value, neither the reason nor cancel().',
  },
];

export const ANGULAR_TEXT_FIELD_DOCS = {
  textField: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'slTextFieldInput',
        'Makes the value controlled. It is written to the input the way a form control’s value is. Without it the input keeps its own value.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'slTextFieldInput',
        'The value the input starts from when nothing else writes one. It is read once the inputs are bound.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slTextField, provideTextFieldDefaults',
        'The step of the control scale. Without it the text field takes the size of the field around it, then the one provideTextFieldDefaults sets. Height, padding, type and icon size come from the control scales, which the theme restates for each density.',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'slTextField, provideTextFieldDefaults',
        'How much frame the control draws. plain draws no border at rest and keeps the same box, for a dense table cell.',
      ],
      [
        'mono',
        'boolean',
        'false',
        'slTextField, provideTextFieldDefaults',
        'Sets the value in the monospaced font with tabular figures, for identifiers, hashes and keys.',
      ],
      [
        'clearable',
        'boolean',
        'false',
        'slTextField',
        'Draws a button that empties the value with reason "clear" and returns focus to the input. The button is withdrawn while the value is empty, disabled or read-only.',
      ],
      [
        'revealable',
        'boolean',
        'false',
        'slTextField',
        'Draws a toggle that shows a password as characters. It appears only on type="password" and is withdrawn while the input is disabled.',
      ],
      [
        'revealed',
        'boolean',
        '—',
        'slTextFieldInput',
        'Makes the password toggle controlled. defaultRevealed sets the uncontrolled starting state.',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'slTextFieldInput',
        'Publishes the length of the value to the field around it, which draws the count at the end of its label row.',
      ],
      [
        'countMax',
        'number',
        'maxlength',
        'slTextFieldInput',
        'The limit the count is measured against. Without maxlength it is a soft limit: the value can pass it, and the count turns to the danger tone before validation runs.',
      ],
      [
        'start',
        'slTextFieldStart',
        '—',
        'any element',
        'Content before the value in the reading direction, on your own element, which keeps its own semantics.',
      ],
      [
        'end',
        'slTextFieldEnd',
        '—',
        'any element',
        'Content after the value in the reading direction.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'slTextFieldInput',
        'Unset by default, so the input takes the state of the field around it and of a disabled form control. When set, it wins, and it is the native attribute.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'slTextFieldInput',
        'Unset by default, so the input takes the state of the field around it. It is the native readonly: the input stays focusable and selectable, and its value is submitted. A static readonly attribute you write is read before the binding computes.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'slTextFieldInput',
        'Unset by default, so the input takes the state of the field around it. It sets aria-invalid on the input and data-invalid on the frame.',
      ],
      [
        'required',
        'boolean',
        '—',
        'the input element',
        'The input’s own attribute; slTextFieldInput never writes it. A field marks a required value with aria-required instead, because the native attribute turns on browser constraint validation.',
      ],
      [
        'type',
        "'text' | 'search' | 'email' | 'url' | 'tel' | 'password'",
        'text',
        'the input element',
        'The input’s own type, one of the six listed, written as a static attribute. It is read before the host binding computes, so the reveal toggle can swap it and restore what you wrote. A date, a time, a month or a number is not a text field: use date-picker (forms.md FM-16), time-picker or number-field. Other strings still reach the element for compatibility and are not supported.',
      ],
      [
        'copyable',
        'boolean',
        'false',
        'slTextField',
        'Draws a button that writes the value to the clipboard, shows a check for two seconds and announces the outcome. It is hidden while the value is empty or the input is disabled.',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slTextField',
        'Draws the shared spinner before the buttons and sets aria-busy on the input; the value stays editable. Once loading is bound, false included, the spinner keeps its place so it can leave with a transition.',
      ],
      [
        'messages',
        'Partial<TextFieldMessages>',
        '—',
        'slTextField',
        'Replaces words of the active language, key by key. clear, reveal and copy name the buttons; reveal does not change with the state, because aria-pressed carries it. copied and copyFailed announce the outcome of a copy. capsLock is announced once when Caps Lock turns on in a focused password field.',
      ],
    ]),
    composition: apiRows([
      [
        'button[slTextFieldAction]',
        'directive',
        'type="button"',
        'inside slTextFieldStart or slTextFieldEnd',
        'A button you place inside the frame. slMenuTriggerFor, slTooltipTrigger or a popover trigger can sit on the same element. The part attribute is written back after the first render, because slMenuTriggerFor binds data-part to null. Its exportAs is slTextFieldAction.',
      ],
      [
        'the directives themselves',
        'slTextField, slTextFieldInput, slTextFieldStart, slTextFieldEnd',
        '—',
        'your own elements',
        'Every part except the buttons and marks the frame renders is a directive on an element you write, so each keeps its own semantics, attributes and listeners.',
      ],
      [
        'exportAs',
        "'slTextField' / 'slTextFieldInput'",
        '—',
        'a template',
        'Reaches the instance from a template. inputElement on slTextFieldInput is the native input, with focus(), select() and setSelectionRange().',
      ],
      [
        'provideTextFieldDefaults()',
        '{ size, variant, mono }',
        '—',
        'an injector',
        'Sets size, variant and mono once for every text field in the injector. A field outranks it for size, so a text field inside a field takes the field’s size.',
      ],
      [
        'ControlValueAccessor',
        'formControl, formControlName, ngModel',
        '—',
        'slTextFieldInput',
        'slTextFieldInput works with reactive and template-driven forms as it is. It provides no validator: the form owns validity.',
      ],
    ]),
    accessibility: [
      'There is no WAI-ARIA Authoring Practices pattern for a text field: the APG lists thirty patterns, and none of them is a single-line text input. The sources are the HTML specification for the input element, the APG practice Providing Accessible Names and Descriptions (w3.org/WAI/ARIA/apg/practices/names-and-descriptions/) for its name, and the ARIA textbox role for what may sit inside it.',
      'The frame has no role. WAI-ARIA requires the children of a textbox to be non-interactive and presentational, so the clear and reveal buttons are siblings of the input inside a box that announces nothing.',
      'The input takes its name from the field’s label, whose for attribute points at the identifier the field generates. The APG naming practice records that some combinations of browser and assistive technology compute no name from a label that wraps its control.',
      'Inside a required field the input carries aria-required, never the native required. In Angular a host binding overrides a static attribute, so every attribute you write that slTextFieldInput also binds (id, aria-describedby, aria-invalid, aria-required, readonly and type) is read before the binding computes and is never overwritten.',
      'The clear and reveal buttons are native buttons with names you translate once through messages. Each is at least 24 CSS pixels wide at every size and density, which meets WCAG 2.2 success criterion 2.5.8. The reveal button keeps one name and carries its state in aria-pressed, which is the APG rule for a toggle button.',
      'The copy button announces its outcome through the shared live announcer, Copied or Copy failed, because the check that replaces the copy mark is only visible. The Caps Lock mark is hidden from assistive technology; its message is announced once when Caps Lock turns on while the password field has focus.',
      'loading sets aria-busy on the input and leaves it enabled, so the keyboard stays on the input while an asynchronous check runs. The spinner is hidden from assistive technology.',
      'A menu inside the frame follows the APG menu button pattern (w3.org/WAI/ARIA/apg/patterns/menu-button/). slMenuTriggerFor on the action supplies aria-haspopup, aria-expanded, and Enter, Space and ArrowDown to open.',
      'No key is bound to Escape. Some browsers clear a search input on Escape, and a text field that consumed the key inside a dialog would leave a keyboard user unable to close the dialog. WCAG success criterion 2.1.4 addresses the defects that single-key shortcuts cause.',
    ],
    snippets: [
      defineSnippet({
        id: 'text-field-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="text-field" data-part="root" data-size="md" data-variant="outline">
  <span data-part="start">R$</span>
  <input data-part="input" id="valor-control" aria-describedby="valor-description" />
  <button data-part="clear" type="button" aria-label="Clear">
    <span data-ui="icon" data-part="root" aria-hidden="true"
      ><svg data-part="glyph" data-glyph="x" aria-hidden="true"></svg
    ></span>
  </button>
  <span data-part="end">BRL</span>
</div>`,
      }),
      defineSnippet({
        id: 'text-field-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='text-field'] {
  --slotted-text-field-border-color: var(--slotted-tone-secondary-border);
  --slotted-text-field-hover-border-color: var(--slotted-tone-accent-solid);
  --slotted-text-field-radius: var(--slotted-radius-md);
  --slotted-text-field-autofill-background: var(--slotted-tone-success-surface);
}`,
      }),
    ],
  },
} as const;
