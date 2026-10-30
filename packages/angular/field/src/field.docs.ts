import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import fieldTokens from '@slotted/styles/field/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_FIELD_TOKENS = fieldTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Field decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideFieldDefaults,\n  SlField,\n  SlFieldAction,\n  SlFieldControl,\n  SlFieldCounter,\n  SlFieldDescription,\n  SlFieldError,\n  SlFieldHeader,\n  SlFieldHelp,\n  SlFieldIndicator,\n  SlFieldLabel,\n} from '@slotted/angular/field';",
  selector: '[slField]',
  exportAs: 'slField',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element carrying slField, a div',
    required: true,
    purpose:
      'The field. It carries data-ui="field", the three axes, and data-disabled, data-invalid, data-required and data-readonly. It is its own size container, so a side label reflows on the field’s width rather than the window’s.',
  },
  {
    part: 'header',
    element: 'the element carrying slFieldHeader, a div',
    required: false,
    purpose:
      'The label row, written when the label has company: the help, an indicator, an action and the counter. It aligns them on the label’s first baseline, wraps when it runs out of room, and puts the action and the count at its end. When the page writes no counter, it draws the count the control published. A field whose label stands alone writes the label on the root and no header.',
  },
  {
    part: 'label',
    element: 'label[slFieldLabel]',
    required: false,
    purpose:
      'Names the control through for, which points at the derived control identifier. The WAI-ARIA Authoring Practices name the explicit association as the one with the broadest support; some assistive technologies fail to treat the implicit one, a label wrapping its control, as a name.',
  },
  {
    part: 'mark',
    element: 'span, drawn inside the label',
    required: false,
    purpose:
      'The necessity marker the label draws: an asterisk on a required field, (optional) on a field a reader may skip, or both words. The asterisk is aria-hidden because aria-required already states the fact; the words are read, because they carry information.',
  },
  {
    part: 'help',
    element: 'button[slFieldHelp]',
    required: false,
    purpose:
      'A circle-question button beside the label that shows the directive’s value in a tooltip. It opens on hover and on keyboard focus, and a press keeps it open until a second press, Escape or a press elsewhere. SlTooltip and SlTooltipTrigger are composed on the button as host directives. A hidden node inside the button carries the same words, so the button and the control are described by the help whether the tooltip is open or not.',
  },
  {
    part: 'indicator',
    element: 'the element carrying slFieldIndicator, a span',
    required: false,
    purpose:
      'What qualifies the field, such as Beta, Pro or New, as one or more slBadge elements after the label. It sits outside the label, so the necessity mark stays against the last word, and it joins the control’s description, so a reader on the control hears it.',
  },
  {
    part: 'action',
    element: 'the a or button carrying slFieldAction',
    required: false,
    purpose:
      'A link or a button at the end of the label row, such as Forgot password? or Generate. On a button the directive writes type="button" unless the page wrote a type; on a link it writes none. The field does not disable it with the control.',
  },
  {
    part: 'control',
    element: 'the element carrying slFieldControl',
    required: false,
    purpose:
      'A control Slotted does not ship. Slotted’s own controls inject SlField and need no directive. The field gives the control an identifier, a description, aria-invalid, aria-required, disabled and readonly, and overwrites nothing the consumer wrote: each written value is read with HostAttributeToken before the binding is computed.',
  },
  {
    part: 'counter',
    element: 'the element carrying slFieldCounter',
    required: false,
    purpose:
      'The count, at the end of the label row, where IBM Carbon also places it, and inside the header when there is one. A control with showCount publishes its count and the field draws it; a page that counts words or bytes writes its own slFieldCounter. The count joins the control’s description and carries its own data-invalid, because a count can pass its limit before validation runs.',
  },
];

const events: EventRow[] = [
  {
    name: '(openChange)',
    payload: 'boolean',
    when: 'On button[slFieldHelp], after the hint opened or closed. It is the output half of [(open)].',
  },
  {
    name: '(openChangeRequest)',
    payload: 'ChangeRequest<boolean>',
    when: 'On button[slFieldHelp], before the hint opens or closes, once per transition. reason is pointer for a hover or a press; keyboard for focus, Enter or Space; or escape, blur or programmatic. cancel() refuses the change.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One field with every axis on it, driven by the controls below the canvas. Switch labelPlacement to side and narrow the window: below 320 pixels of its own width the field stacks again.',
    snippet: defineSnippet({
      id: 'field-angular-playground',
      language: 'angular',
      label: 'A field, its label and its help',
      source:
        '<div slField required>\n  <label slFieldLabel>Email</label>\n  <input slFieldControl type="email" />\n  <span slFieldDescription>We will use this address for billing.</span>\n</div>',
    }),
  },
  {
    id: 'necessity',
    title: 'Saying which answers are required',
    note: 'The asterisk is the convention. A form where most fields are required marks the exception instead — optional writes (optional) on the fields a reader may skip and nothing on the rest — and words names both sides. All four answers come from one input an application sets once.',
    snippet: defineSnippet({
      id: 'field-angular-necessity',
      language: 'angular',
      label: 'A mark, a word on the optional fields, both words, or nothing',
      source:
        '<div slField required>…</div>\n<div slField necessity="optional">…</div>\n<div slField required necessity="words">…</div>\n<div slField required necessity="none">…</div>',
    }),
  },
  {
    id: 'placement',
    title: 'The label above the control, or beside it',
    note: 'Drag the narrow column’s edge, or read it at 360 pixels: the side label stacks below 320 pixels of the field’s own width, so the same field reflows in a drawer and stays beside its control in a page grid.',
    snippet: defineSnippet({
      id: 'field-angular-placement',
      language: 'angular',
      label: 'A side label that stacks when the field is narrow',
      source:
        '<div slField labelPlacement="side">\n  <label slFieldLabel>Legal name</label>\n  <input slFieldControl />\n</div>',
    }),
  },
  {
    id: 'sizes',
    title: 'The step the field sits at',
    note: 'Three steps matching the control the field wraps, and every one of them reads the control type scale — set the toolbar to dense and the label, the message and the counter step down together.',
    snippet: defineSnippet({
      id: 'field-angular-sizes',
      language: 'angular',
      label: 'Three steps, all answering density',
      source:
        '<div slField size="sm">…</div>\n<div slField size="md">…</div>\n<div slField size="lg">…</div>',
    }),
  },
  {
    id: 'states',
    title: 'The four states a field can be in',
    note: 'The label never turns red when the field is invalid: the error already says so in words and in colour, and a red marker on a red label is a marker nobody can see. Read-only stays legible and focusable; disabled is muted to a measured colour rather than faded.',
    snippet: defineSnippet({
      id: 'field-angular-states',
      language: 'angular',
      label: 'Every state unset by default, and native where the word means native',
      source:
        '<div slField invalid required>\n  <label slFieldLabel>Tax ID</label>\n  <input slFieldControl />\n  <span slFieldError>Six digits are missing.</span>\n</div>\n\n<div slField disabled>…</div>\n<div slField readOnly>…</div>',
    }),
  },
  {
    id: 'messages',
    title: 'Help, errors, and the line held open for one',
    note: 'Both messages are inline-message roots the field renders around what the page wrote, so the error carries a clipped “Error:” a screen reader reads first. The right-hand column keeps its line with reserve, so the button below does not move when the error arrives.',
    snippet: defineSnippet({
      id: 'field-angular-messages',
      language: 'angular',
      label: 'A description, an error, and a warning that is not one',
      source:
        '<div slField [invalid]="submitted">\n  <input slFieldControl />\n  <span slFieldDescription>Numbers only.</span>\n  <span slFieldError reserve live="polite">{{ errors.cnpj }}</span>\n</div>\n\n<span slFieldError tone="warning">The password is valid but easy to guess.</span>',
    }),
  },
  {
    id: 'counter',
    title: 'Counting what the page is counting',
    note: 'The count sits in the label row’s spare column, so it never shares a row with the error and never adds one. It turns at its own limit rather than at the field’s, because a count passes its maximum before validation runs.',
    snippet: defineSnippet({
      id: 'field-angular-counter',
      language: 'angular',
      label: 'The page owns the number; the field owns where it sits',
      source:
        '<div slField [invalid]="value.length > 140">\n  <label slFieldLabel>Public description</label>\n  <span slFieldCounter [invalid]="value.length > 140">{{ value.length }}/140</span>\n  <textarea slFieldControl [(ngModel)]="value" rows="3"></textarea>\n</div>',
    }),
  },
  {
    id: 'header',
    title: 'The label row: help, indicator, action and count',
    note: 'Hover the circle, or tab to it: the hint opens. Press it and it stays until a second press, which is what a finger needs. The row is as tall as the label with or without them, aligns on the label’s baseline, and in a narrow field sends the action and the count to a line of their own.',
    snippet: defineSnippet({
      id: 'field-angular-header',
      language: 'angular',
      label: 'A header around the label and what stands beside it',
      source:
        '<div slField required>\n  <div slFieldHeader>\n    <label slFieldLabel>Password</label>\n    <button slFieldHelp="At least eight characters, with letters and numbers."></button>\n    <a slFieldAction routerLink="/recover">Forgot your password?</a>\n  </div>\n  <input slFieldControl type="password" />\n</div>\n\n<div slField>\n  <div slFieldHeader>\n    <label slFieldLabel>API endpoint</label>\n    <span slFieldIndicator><span slBadge size="sm" tone="accent" variant="soft">Beta</span></span>\n  </div>\n  <input slFieldControl />\n</div>',
    }),
  },
  {
    id: 'content',
    title: 'Content the field did not choose',
    note: 'A German compound with no break opportunity, a container digest in the description, and an Arabic field in a right-to-left document — the label breaks rather than sliding under the control, and the necessity word never breaks.',
    snippet: defineSnippet({
      id: 'field-angular-content',
      language: 'angular',
      label: 'A label no language can break, and a mirrored field',
      source:
        '<div slField labelPlacement="side" lang="ar" dir="rtl">\n  <label slFieldLabel>رقم التعريف الضريبي</label>\n  <input slFieldControl />\n</div>',
    }),
  },
  {
    id: 'composition',
    title: 'Composition and escape hatches',
    note: 'provideFieldDefaults sets the whole application’s fields once, exportAs hands a template the identifiers the field derived, and slFieldControl wires a control the library does not own without wrapping it in anything.',
    snippet: defineSnippet({
      id: 'field-angular-composition',
      language: 'ts',
      label: 'One decision for the application, and one control of your own',
      source:
        "bootstrapApplication(App, {\n  providers: [provideFieldDefaults({ size: 'sm', necessity: 'words' })],\n});",
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears, in order',
    note: 'Turn a screen reader on and enter the control: the label, then “required”, then the indicator, the help behind the icon, the description, the count and the error — one name, one description in a fixed order, and no asterisk read aloud.',
    snippet: defineSnippet({
      id: 'field-angular-accessibility',
      language: 'angular',
      label: 'The identifiers, and the ones that are read',
      source:
        '<div data-ui="field" data-part="root">\n  <div data-part="header">\n    <label data-part="label" for="cnpj-control">\n      Tax ID<span aria-hidden="true" data-part="mark">*</span>\n    </label>\n    <button data-part="help" aria-label="More information" aria-describedby="cnpj-help">\n      <span data-part="help-text" id="cnpj-help" hidden>Numbers only.</span>\n    </button>\n  </div>\n  <input\n    data-part="control"\n    id="cnpj-control"\n    aria-describedby="cnpj-help cnpj-description cnpj-error"\n    aria-invalid="true"\n    aria-required="true"\n  />\n</div>',
    }),
  },
];

export const ANGULAR_FIELD_DOCS = {
  field: {
    imports,
    anatomy,
    scenes,
    api: apiRows([
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slField',
        'The type step, matching the control the field wraps. The label, the messages and the counter read the control type scale, which the theme restates per density.',
      ],
      [
        'labelPlacement',
        "'top' | 'side'",
        'top',
        'slField',
        'Where the label sits. side reflows to top when the field’s own inline size is below 320 pixels; the query is a container query, not a viewport query.',
      ],
      [
        'necessity',
        "'mark' | 'optional' | 'words' | 'none'",
        'mark',
        'slField',
        'How necessity is written: an asterisk on a required field, (optional) on a field a reader may skip, both words, or nothing, for a form that says once that every field is required.',
      ],
      [
        'width',
        "'short' | 'medium' | 'full'",
        'full',
        'slField',
        'The longest the control stands, as a cue to the length of its answer: short (--slotted-field-width-short, 6rem) for an integer of up to four digits, medium (--slotted-field-width-medium, 15rem) for an amount, a code or a short word, full for free text, a name or a picker of records. The control still shrinks below the bound in a narrower field.',
      ],
      [
        'messages',
        'Partial<FieldMessages>',
        '—',
        'slField',
        'Words that replace the active language’s, key by key: the necessity words (optional, required) and the help button’s name (help).',
      ],
      [
        'required',
        'boolean',
        '—',
        'slField',
        'Unset rather than false. Reaches the control as aria-required, never as the native required, which would turn on browser constraint validation and change how the form submits.',
      ],
      [
        'invalid',
        'boolean',
        '—',
        'slField, slFieldCounter',
        'On slField: unset rather than false; writes aria-invalid on the control and data-invalid on the field, and leaves the label’s colour unchanged. On slFieldCounter: the count has passed its limit, which can happen before validation runs, so it is the counter’s own state and defaults to false.',
      ],
      [
        'disabled',
        'boolean',
        'from the group, then the token',
        'slField, provideFieldDefaults',
        'Unset rather than false, so a field follows the slFieldGroup around it. A stated value wins, and it reaches the control as the native attribute.',
      ],
      [
        'readOnly',
        'boolean',
        'from the group, then the token',
        'slField, provideFieldDefaults',
        'Unset rather than false. Reaches the control as the native readonly, which keeps the value focusable and copyable.',
      ],
      [
        'id',
        'string',
        'generated',
        'slField',
        'A static attribute, read with HostAttributeToken, that is the base of <id>-control, <id>-label, <id>-indicator, <id>-help, <id>-description, <id>-counter and <id>-error. When unset, an application-scoped factory generates it, so two applications in one server process do not collide.',
      ],
      [
        'slFieldHelp',
        'string',
        "''",
        'button[slFieldHelp]',
        'The help text, written once as the directive’s value. It reaches the tooltip and the hidden node that describes the button and the control.',
      ],
      [
        'open',
        'boolean',
        'false',
        'button[slFieldHelp]',
        'Whether the hint is showing. It is the composed SlTooltip’s model, exposed on the button, so [(open)] binds it both ways.',
      ],
      [
        'side',
        "'top' | 'bottom' | 'inline-start' | 'inline-end' | 'left' | 'right'",
        'top',
        'button[slFieldHelp]',
        'Where the hint opens. It flips to the opposite side when there is no room.',
      ],
      [
        'aria-label',
        'string',
        'messages.help',
        'button[slFieldHelp]',
        'The accessible name of the help button, read with HostAttributeToken. Unset, it is the field’s help message; written, it applies to this button alone.',
      ],
      [
        'type',
        "'button' | 'submit' | 'reset'",
        'button on a button',
        '[slFieldAction]',
        'Written on a button that states no type, so the action never submits the form it sits in. A link gets none.',
      ],
      [
        'tone',
        "'accent' | 'secondary' | 'success' | 'warning' | 'danger'",
        'secondary on slFieldDescription, danger on slFieldError',
        'slFieldDescription, slFieldError',
        'Both messages are inline-message roots and take its five tones, so a warning that does not block submission is slFieldError with tone="warning".',
      ],
      [
        'mark',
        "'glyph' | 'dot' | 'none'",
        'none',
        'slFieldDescription, slFieldError',
        'The mark the message draws. A field’s messages draw none by default: an icon repeated under every control of a form reads as texture, and the ink and the sentence already state the tone. glyph draws the tone’s icon at the text size, and dot draws one neutral bullet.',
      ],
      [
        'live',
        "'off' | 'polite' | 'assertive'",
        'off',
        'slFieldDescription, slFieldError',
        'Whether the message announces itself. off by default, because a message present when the page loads is not announced whatever role it carries.',
      ],
      [
        'reserve',
        'boolean',
        'false',
        'slFieldDescription, slFieldError',
        'Keeps one line open whether or not there is a message, so a form that renders its error unconditionally does not move when the error appears.',
      ],
    ]),
    events,
    composition: apiRows([
      [
        'exportAs="slFieldHelp"',
        'SlFieldHelp',
        '—',
        'button[slFieldHelp]',
        'Hands the template the help button. Its state is the composed tooltip’s, bound through [(open)] and (openChangeRequest) rather than through a method.',
      ],
      [
        'exportAs="slField"',
        'SlField',
        '—',
        'slField',
        'Hands the template the field instance, so a page can point its own element at ids().control, ids().description or ids().error without inventing an identifier, and read count() to draw a count of its own.',
      ],
      [
        'slFieldControl',
        'directive',
        '—',
        'any control element',
        'Wires a control Slotted does not ship, on the consumer’s own element. Slotted’s own controls inject SlField themselves and need no directive, so their wiring cannot be written wrong.',
      ],
      [
        'provideFieldDefaults()',
        '{ size, labelPlacement, necessity, disabled, readOnly }',
        '—',
        'an application, a route or a component',
        'The five decisions an application takes once for every field under the provider. slFieldGroup answers the same source for its own subtree, so a compact or disabled section is one attribute instead of one per field.',
      ],
      [
        'ng-content',
        'projected content',
        '—',
        'slField',
        'The label or the header, the counter and the two message directives are selected by name; everything else, the control and anything beside it, is projected as written. slFieldHeader projects its content in the order the page wrote it.',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA Authoring Practices pattern covers a field. Four sources cover it together: the Authoring Practices’ Providing Accessible Names and Descriptions practice (w3.org/WAI/ARIA/apg/practices/names-and-descriptions/) for the label and the description, the HTML specification for label[for] and fieldset[disabled], and WCAG 2.2 Understanding 3.3.1 Error Identification and 3.3.2 Labels or Instructions for the error and the help.',
      'The label is associated explicitly. The naming practice records that some combinations of assistive technology and browser do not treat the implicit form, a label wrapping its control, as an accessible name, so the field derives an identifier and points for at it instead of nesting.',
      'slField writes aria-required, never the native required. The native attribute turns on browser constraint validation and changes how the form submits, which describing a field must not do as a side effect. To get it, write required on the control: every written attribute is read with HostAttributeToken before the binding that would replace it. disabled and readonly are native, because taking a control out of the tab order and out of submission is what those attributes mean.',
      'The accessible description is the indicator, the help, the description, the count and the error, in that order, whatever order the page writes them in. Each slot has one correct reading order, so the field states it instead of reading it from the DOM. The count is included so a counter is related to its control by identifier.',
      'The help, the indicator and the action stand beside the label, never inside it. HTML forbids labelable content such as a button inside a label other than the control it labels, and a press on it would reach the label and move focus to the control instead of opening the hint.',
      'The help is a toggletip. A tooltip alone opens on a touch screen only on a long press, because a tap triggers the element’s own action; the help button has no other action, so a press opens the hint and a second press closes it. The help text also sits in a hidden node inside the button, which describes the button and the control while the tooltip is closed, because a hidden element referenced directly still enters the description. The tooltip describes nothing, so the hint is never read twice.',
      'A disabled field leaves its help and its action operable, because the help often explains why the field is disabled.',
      'The necessity asterisk is hidden from assistive technology and the necessity words are not. A reader working through a form of twenty required fields does not need to hear “asterisk” twenty times, and aria-required already states the fact; (optional) is information no other attribute supplies.',
      'The error is text in the page, as WCAG 2.2 SC 3.3.1 requires, never a tooltip. As an inline message it also carries the severity as visually hidden text, so a reader who cannot see the red ink hears “Error:” before the sentence.',
      'live defaults to off, because a message present when the page finishes loading is not announced whatever role it carries. A form that shows the error after submit writes live="polite", and the reader hears it once.',
    ],
    snippets: [
      defineSnippet({
        id: 'field-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source:
          '<div\n  data-ui="field"\n  data-part="root"\n  data-size="md"\n  data-label-placement="top"\n  data-necessity="mark"\n  data-required\n  data-invalid\n>\n  <label data-part="label" for="cnpj-control">\n    Tax ID<span aria-hidden="true" data-part="mark">*</span>\n  </label>\n  <span data-part="counter">14/18</span>\n  <input data-part="control" id="cnpj-control" aria-invalid="true" aria-required="true" />\n  <p data-ui="inline-message" data-part="root" data-tone="secondary" id="cnpj-description">\n    <span data-part="text">Numbers only.</span>\n  </p>\n</div>',
      }),
      defineSnippet({
        id: 'field-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source:
          "[data-ui='field'] {\n  --slotted-field-row-gap: var(--slotted-space-2);\n  --slotted-field-column-gap: var(--slotted-space-6);\n  --slotted-field-label-inline-size: 10rem;\n  --slotted-field-mark-color: var(--slotted-tone-accent-text);\n}",
      }),
    ],
  },
} as const;
