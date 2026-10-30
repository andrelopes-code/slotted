import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import otpInputTokens from '@slotted/styles/otp-input/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_OTP_INPUT_TOKENS = otpInputTokens.map((name) => ({
  name,
  purpose: 'Theme-owned OTP Input decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideOtpInputDefaults,\n  SlOtpInput,\n  SlOtpInputControl,\n} from '@slotted/angular/otp-input';",
  selector: '[slOtpInput]',
  exportAs: 'slOtpInput',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slOtpInput',
    required: true,
    purpose:
      'The frame around the boxes. Carries data-ui="otp-input", the axes, and data-disabled, data-invalid, data-readonly and data-complete. It has no role: the control inside is the only thing announced. A press anywhere on it puts the cursor in the box under the pointer.',
  },
  {
    part: 'input',
    element: 'input[slOtpInputControl]',
    required: true,
    purpose:
      'The control. One real text input laid over the boxes, transparent: it holds the value, name, form, autocomplete="one-time-code", the identifier the field’s label points at, and it is the one tab stop. It is the ControlValueAccessor, so it belongs in a reactive form as it stands. With the frame’s mask it becomes type="password".',
  },
  {
    part: 'group',
    element: 'div, drawn by the frame',
    required: true,
    purpose:
      'A row of boxes, one per entry of groups. Hidden from assistive technology. With attached, its boxes share one seam and keep a corner only at the ends.',
  },
  {
    part: 'separator',
    element: 'div, drawn by the frame',
    required: false,
    purpose:
      'A short rule between two groups, drawn in CSS and never a character — a dash in the DOM would be read by nothing and mirrored by nothing.',
  },
  {
    part: 'slot',
    element: 'div, drawn by the frame',
    required: true,
    purpose:
      'One box: the character at data-index, or a bullet under mask, or the placeholder while empty. data-current marks the box where the cursor or the selection is while the control has focus; the caret and the selection tint are drawn there.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'The second step of a sign-in, driven by the controls below the canvas. Type into it: the value is one string, the boxes paint it, and the sixth digit completes it.',
    snippet: defineSnippet({
      id: 'otp-input-angular-playground',
      language: 'angular',
      label: 'A verification step, in a field',
      source: `<div slField>
  <label slFieldLabel>Verification code</label>
  <div slOtpInput [groups]="[3, 3]">
    <input slOtpInputControl name="code" (complete)="verify($event)" />
  </div>
  <span slFieldDescription>We sent an SMS to +1 206 •••-4821.</span>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the boxes sit at',
    note: 'A box is a square on the control height of its step, so a code beside a text field in the same form sits on the same row. Inside a field the control takes the field’s step rather than its own.',
    snippet: defineSnippet({
      id: 'otp-input-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source: `<div slOtpInput size="sm" length="4"><input slOtpInputControl /></div>
<div slOtpInput size="md"><input slOtpInputControl /></div>
<div slOtpInput size="lg"><input slOtpInputControl /></div>

<!-- Inside a field the field decides, and the control follows. -->
<div slField size="sm">
  <div slOtpInput><input slOtpInputControl /></div>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame each box shows',
    note: 'outline takes the ground it is placed on; subtle sinks into the page. The same two steps text-field draws, with the same tokens, so a code under a text field in one form is one form.',
    snippet: defineSnippet({
      id: 'otp-input-angular-variants',
      language: 'angular',
      label: 'Two frames, one box',
      source: `<div slOtpInput variant="outline"><input slOtpInputControl /></div>
<div slOtpInput variant="subtle"><input slOtpInputControl /></div>`,
    }),
  },
  {
    id: 'groups',
    title: 'Groups, separators and joined boxes',
    note: 'groups partitions the boxes the way the SMS is written — 482-915 — and attached joins the boxes of a group along one seam, which is how a PIN pad reads.',
    snippet: defineSnippet({
      id: 'otp-input-angular-groups',
      language: 'angular',
      label: 'A partition of length, and one seam per group',
      source: `<!-- The sum has to be length; a partition that does not add up draws one group. -->
<div slOtpInput [groups]="[3, 3]"><input slOtpInputControl /></div>
<div slOtpInput [groups]="[4, 4]" length="8" attached>
  <input slOtpInputControl type="alphanumeric" />
</div>
<div slOtpInput length="4" attached><input slOtpInputControl /></div>`,
    }),
  },
  {
    id: 'types',
    title: 'What the code accepts',
    note: 'type decides the characters and the keyboard a phone offers; pattern outranks it per character; transform runs over every edit before the filter. What an edit loses is reported, so the page can say why nothing appeared.',
    snippet: defineSnippet({
      id: 'otp-input-angular-types',
      language: 'angular',
      label: 'Digits, letters, a pattern and a transform',
      source: `<div slOtpInput><input slOtpInputControl type="numeric" /></div>
<div slOtpInput length="8"><input slOtpInputControl type="alphanumeric" /></div>

<!-- A backup code is printed in uppercase with a prefix nobody types. -->
<div slOtpInput length="8">
  <input
    slOtpInputControl
    type="alphanumeric"
    [transform]="stripPrefix"
    (rejected)="hint = $event.text + ' is not part of the code'"
  />
</div>

<!-- Only the characters a hexadecimal code has. -->
<div slOtpInput><input slOtpInputControl [pattern]="hex" /></div>`,
    }),
  },
  {
    id: 'mask',
    title: 'A code nobody should read over your shoulder',
    note: 'mask makes the control type="password": the platform treats the value as a secret — the screen reader counts characters instead of reading them — and each filled box shows a bullet.',
    snippet: defineSnippet({
      id: 'otp-input-angular-mask',
      language: 'angular',
      label: 'A PIN, masked through the platform',
      source: `<div slField>
  <label slFieldLabel>Authorization PIN</label>
  <div slOtpInput length="4" mask attached>
    <input slOtpInputControl autocomplete="off" />
  </div>
</div>`,
    }),
  },
  {
    id: 'states',
    title: 'The four states the frame paints',
    note: 'Invalid keeps its danger edge on every box while the ring says where the cursor is; read-only keeps full-strength ink and only its ground changes; disabled is muted to a measured colour rather than faded, so a disabled form still says what it holds.',
    snippet: defineSnippet({
      id: 'otp-input-angular-states',
      language: 'angular',
      label: 'Every state unset by default, and native where the word means native',
      source: `<!-- Unstated rather than false, so the control defers to its field. -->
<div slOtpInput><input slOtpInputControl invalid defaultValue="482910" /></div>
<div slOtpInput><input slOtpInputControl readOnly defaultValue="482915" /></div>
<div slOtpInput><input slOtpInputControl disabled defaultValue="48" /></div>

<!-- A control inside a disabled fieldset is painted too, because the
     stylesheet matches :disabled beside the attribute. -->`,
    }),
  },
  {
    id: 'complete',
    title: 'The sixth digit',
    note: '(complete) fires the moment the value reaches length, once per value; autoSubmit calls requestSubmit() on the owning form in the same moment. A code edited into another full code reports again.',
    snippet: defineSnippet({
      id: 'otp-input-angular-complete',
      language: 'angular',
      label: 'Verify on the last digit',
      source: `<form (ngSubmit)="verify()">
  <div slOtpInput><input slOtpInputControl name="code" autoSubmit /></div>
</form>

<!-- Or hold the value and react to it. -->
<div slOtpInput>
  <input slOtpInputControl [formControl]="code" (complete)="verify($event)" />
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A value longer than the code is cut; a paste with hyphens and spaces keeps its digits; in a right-to-left page the boxes stay left-to-right, because a code is a number and a number does not mirror; and at 240 pixels the boxes give up width before the row overflows.',
    snippet: defineSnippet({
      id: 'otp-input-angular-content',
      language: 'angular',
      label: 'Long, pasted, mirrored and narrow',
      source: `<!-- "12-3456789" becomes "123456". -->
<div slOtpInput><input slOtpInputControl defaultValue="12-3456789" /></div>

<!-- Paste "482-915": the hyphen is dropped and reported, the digits land. -->
<div slOtpInput><input slOtpInputControl (rejected)="log($event.text)" /></div>

<!-- The row is left-to-right whatever the page does. -->
<div dir="rtl">
  <div slOtpInput [groups]="[3, 3]"><input slOtpInputControl /></div>
</div>`,
    }),
  },
  {
    id: 'form',
    title: 'One control in a reactive form',
    note: 'slOtpInputControl is the ControlValueAccessor: a FormControl writes it, a disabled control disables it, blur marks it touched, and validators see one string. name still works for a native form, and where the WebOTP API exists the code arrives from the SMS with reason "programmatic".',
    snippet: defineSnippet({
      id: 'otp-input-angular-form',
      language: 'angular',
      label: 'Reactive Forms, and the SMS that fills them',
      source: `<form [formGroup]="form" (ngSubmit)="submit()">
  <div slOtpInput [groups]="[3, 3]">
    <input slOtpInputControl formControlName="code" webOtp />
  </div>
  <button slButton type="submit">Confirmar</button>
</form>

<!-- form = new FormGroup({ code: new FormControl('', [Validators.minLength(6)]) }) -->`,
    }),
  },
  {
    id: 'composition',
    title: 'In a field, with a resend',
    note: 'The field names the control, describes it and carries its error; the resend is a button and a countdown the page owns, because the family has no clock. provideOtpInputDefaults sets the length once for an application whose codes are all four digits.',
    snippet: defineSnippet({
      id: 'otp-input-angular-composition',
      language: 'angular',
      label: 'The whole verification step',
      source: `<div slField [invalid]="error() !== null">
  <label slFieldLabel>Verification code</label>
  <div slOtpInput [groups]="[3, 3]">
    <input slOtpInputControl name="code" (complete)="verify($event)" />
  </div>
  <span slFieldDescription>We sent an SMS to +1 206 •••-4821.</span>
  <span slFieldError>{{ error() }}</span>
</div>
<button slButton variant="ghost" [disabled]="seconds() > 0" (click)="resend()">
  {{ seconds() > 0 ? 'Resend in 0:' + pad(seconds()) : 'Resend code' }}
</button>

<!-- Every code in this application is four digits:
     providers: [provideOtpInputDefaults({ length: 4, attached: true })] -->`,
    }),
  },
  {
    id: 'keyboard',
    title: 'One tab stop, every key the browser’s',
    note: 'Tab lands on one control. Arrows move the cursor across the boxes, Backspace and Delete edit, Shift+arrows select a range, Ctrl+A selects all, and typing on a full code replaces the selected character instead of being refused.',
    snippet: defineSnippet({
      id: 'otp-input-angular-keyboard',
      language: 'angular',
      label: 'Nothing is bound; the selection is normalised',
      source: `<!-- Inside the value there is always one character selected: the one in
     front of a collapsed cursor, the last one at the end of a full code. The
     next key replaces it. A cursor after the last character inserts. -->
<div slOtpInput [groups]="[3, 3]">
  <input slOtpInputControl defaultValue="482915" />
</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<string>',
    when: 'Before the value moves, on slOtpInputControl. The request carries the new value, the value it replaces, the reason — "keyboard" for an edit made in the control, including a paste and the keyboard’s own autofill; "programmatic" for a code the WebOTP API delivered — the originating event, and cancel(), which refuses the move before anything commits.',
  },
  {
    name: '(complete)',
    payload: 'string',
    when: 'The moment the value reaches length characters, once per value. A full code edited into another full code reports again; a code emptied and retyped reports again.',
  },
  {
    name: '(rejected)',
    payload: '{ text: string; source: Event }',
    when: 'Before the value moves, with every character an edit lost to type, pattern or length, in order. Nothing is emitted when an edit lost nothing.',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'the form’s own value and touched state',
    when: 'Whenever the value moves and the request was not cancelled, and on blur for touched. It is the two-way binding the ecosystem expects, and the reason there is no [(value)]: a two-way binding has one slot and can carry neither a reason nor cancel().',
  },
];

export const ANGULAR_OTP_INPUT_DOCS = {
  otpInput: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'slOtpInputControl',
        'Present means the consumer owns the value. It is written into the element the way a form writes it; a form uses formControl instead',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'slOtpInputControl',
        'What the control starts from when nobody else writes one, read once and cut to what the code accepts',
      ],
      [
        'length',
        'number',
        '6',
        'slOtpInput, provideOtpInputDefaults',
        'How many characters the code has. It is the element’s maxlength and the number of boxes',
      ],
      [
        'type',
        "'numeric' | 'alphanumeric'",
        'numeric',
        'slOtpInputControl, provideOtpInputDefaults',
        'Which characters the code takes — digits, or ASCII letters and digits — and which keyboard a phone offers: inputmode numeric or text, unless the consumer wrote one',
      ],
      [
        'pattern',
        'RegExp',
        '—',
        'slOtpInputControl',
        'Tested against each character; outranks type in what is accepted and leaves the keyboard to it. Never the element’s whole-value attribute',
      ],
      [
        'transform',
        '(text: string) => string',
        '—',
        'slOtpInputControl',
        'Run over every edit before the filter — typing, paste, autofill — to strip a prefix or uppercase a code',
      ],
      [
        'groups',
        'number[]',
        '[length]',
        'slOtpInput',
        'How the boxes are partitioned, with a separator between two groups. The sum has to be length; a partition that does not add up draws one group',
      ],
      [
        'attached',
        'boolean',
        'false',
        'slOtpInput, provideOtpInputDefaults',
        'Joins the boxes of a group along one seam, with a corner only at the ends',
      ],
      [
        'placeholder',
        'string',
        '',
        'slOtpInput, provideOtpInputDefaults',
        'What an empty box shows: one character repeats over every box, a string as long as the code distributes',
      ],
      [
        'mask',
        'boolean',
        'false',
        'slOtpInput',
        'Makes the control type="password" and paints a bullet per character. The platform treats the value as a secret',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slOtpInput, provideOtpInputDefaults',
        'The step the boxes sit at, read from the field first when there is one, then from the token. The box is the control height at that step; the type is the text scale’s step of the same name',
      ],
      [
        'variant',
        "'outline' | 'subtle'",
        'outline',
        'slOtpInput, provideOtpInputDefaults',
        'How much frame each box shows. There is no plain: a code is never a cell',
      ],
      [
        'autoSubmit',
        'boolean',
        'false',
        'slOtpInputControl',
        'Calls requestSubmit() on the owning form the moment the code is complete',
      ],
      [
        'webOtp',
        'boolean',
        'false',
        'slOtpInputControl',
        'Asks the platform for the code from the SMS where the WebOTP API exists, and abandons the request when the form submits or the directive is destroyed. Opt-in, because the request opens a permission prompt',
      ],
      [
        'disabled',
        'boolean',
        'from the form, the field, or false',
        'slOtpInputControl',
        'Unstated rather than false, so the control defers to the form’s setDisabledState and then to the field. Stated, it wins, and it is the native attribute',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'slOtpInputControl',
        'Unstated rather than false. The native readonly, which stays focusable, selectable and submitted; a readonly attribute the consumer wrote is honoured',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'slOtpInputControl',
        'Unstated rather than false. Writes aria-invalid on the control and data-invalid on the frame',
      ],
      [
        'required',
        'boolean',
        '—',
        'slOtpInputControl',
        'The element’s own attribute, left where the consumer wrote it and never written by the family. A field marks necessity with aria-required instead, because the native attribute engages browser constraint validation',
      ],
      [
        'autocomplete',
        'string',
        'one-time-code',
        'slOtpInputControl',
        'The element’s own attribute, read before the host binding computes; unwritten, the token that asks the keyboard for the code it just received',
      ],
    ]),
    composition: apiRows([
      [
        '[slOtpInput]',
        'attribute selector',
        '—',
        'the consumer’s element',
        'The frame is the consumer’s own element rather than one the family creates, so a div, a fieldset or a label can carry it. The boxes are drawn by its template and are not projectable: they are paint over one input, and their geometry is what a press is mapped to',
      ],
      [
        'input[slOtpInputControl]',
        'attribute selector',
        '—',
        'the consumer’s input',
        'The control is the consumer’s own input, so every native attribute is written where it belongs and read before the host bindings compute. It injects the frame without optional: an input written outside one fails at construction',
      ],
      [
        'exportAs',
        "'slOtpInput' / 'slOtpInputControl'",
        '—',
        'a template',
        'The frame’s resolved step, variant and complete state, and the control’s code, selection and inputElement, for a template that reaches either',
      ],
      [
        'provideOtpInputDefaults',
        '{ size, variant, attached, length, type, placeholder }',
        '—',
        'an injector',
        'The six decisions an application takes once. size is the one a field outranks, so a control inside a field takes the field’s step',
      ],
      [
        'SlOtpInputState',
        'abstract class',
        '—',
        'a frame of your own',
        'What the frame reads from the control: code, selection, focused, the three resolved states, and pressAt(). Provided by the control, so a frame that draws its own boxes can query for it',
      ],
    ]),
    accessibility: [
      'There is no WAI-ARIA APG pattern for a verification code: the APG lists no such entry, so the control is the platform’s own textbox and the sources are the HTML specification for the element, the autocomplete attribute’s one-time-code token, and the WebOTP API.',
      'One control, one tab stop, one accessible name, one value. Ark, Chakra and Mantine render one input per box and pay for it with N tab stops and no real label; here the boxes are aria-hidden paint over one input, so a screen reader hears "Verification code, edit text, 482" and nothing about boxes.',
      'The control takes its name from the field’s label, through for pointing at the identifier the field derived, and its description and error through aria-describedby merged after anything the consumer wrote.',
      'aria-required, never the native required: the native attribute engages browser constraint validation and changes submit behaviour. disabled and readonly are native, because that is what those two words mean, and a form’s setDisabledState reaches the same attribute.',
      'Every key is the browser’s. The family binds nothing — no Escape, no arrow handling — and only normalises the selection after the fact, so a reader who knows a text field knows this one; WCAG 2.1.4 exists for the class of defect single-key shortcuts produce.',
      'The focus ring sits on the box where the cursor is, in the theme’s ring colour, and the invalid state retargets that colour rather than repainting it. Invalid is never colour alone: aria-invalid announces it and the field’s error says it in words.',
      'mask is a platform decision, not paint: the control becomes type="password", so the screen reader counts the characters instead of reading a PIN aloud and the keyboard keeps nothing. The cost is that a password manager may offer to save it; the autocomplete the consumer wrote decides.',
    ],
    snippets: [
      defineSnippet({
        id: 'otp-input-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="otp-input" data-part="root" data-size="md" data-variant="outline">
  <input
    data-part="input"
    id="code-control"
    autocomplete="one-time-code"
    inputmode="numeric"
    maxlength="6"
  />
  <div data-part="group" aria-hidden="true">
    <div data-part="slot" data-index="0">4</div>
    <div data-part="slot" data-index="1">8</div>
    <div data-part="slot" data-index="2" data-current></div>
  </div>
  <div data-part="separator" aria-hidden="true"></div>
  <div data-part="group" aria-hidden="true">
    <div data-part="slot" data-index="3"></div>
    <div data-part="slot" data-index="4"></div>
    <div data-part="slot" data-index="5"></div>
  </div>
</div>`,
      }),
      defineSnippet({
        id: 'otp-input-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='otp-input'] {
  --slotted-otp-input-radius: var(--slotted-radius-md);
  --slotted-otp-input-current-border-color: var(--slotted-tone-accent-solid);
  --slotted-otp-input-selection-background: var(--slotted-tone-accent-surface);
  --slotted-otp-input-mask-size: var(--slotted-font-size-3xl);
}`,
      }),
    ],
  },
} as const;
