import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import textareaTokens from '@slotted/styles/textarea/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_TEXTAREA_TOKENS = textareaTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Textarea decision',
}));

const imports: ReferenceImport = {
  source: "import { provideTextareaDefaults, SlTextarea } from '@slotted/angular/textarea';",
  selector: 'textarea[slTextarea]',
  exportAs: 'slTextarea',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'textarea[slTextarea]',
    required: true,
    purpose:
      'The textarea element, which is both the control and its frame. It carries data-ui="textarea", data-size, data-variant and data-resize, data-mono and data-auto-size when they are on, and data-disabled, data-invalid and data-readonly. It has no wrapper: the text field wraps its input so that buttons can sit inside one border, but no adornment sits inside a textarea, and its corner holds the resize handle. It is also the ControlValueAccessor, so the textarea binds to a reactive or template form as it stands.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'One control with every axis on it, driven by the controls below the canvas. Turn autoSize on and type: the box grows to the ceiling and then scrolls.',
    snippet: defineSnippet({
      id: 'textarea-angular-playground',
      language: 'angular',
      label: 'A control, its label and its help',
      source: `<div slField>
  <label slFieldLabel>Notes</label>
  <textarea slTextarea [rows]="3" placeholder="Describe what happened"></textarea>
  <span slFieldDescription>Appears in the ticket history.</span>
</div>`,
    }),
  },
  {
    id: 'sizes',
    title: 'The step the control sits at',
    note: 'The block padding is derived rather than chosen — half of what is left when one line box comes out of the control height — so a one-row textarea is exactly as tall as an input of the same step, at every density.',
    snippet: defineSnippet({
      id: 'textarea-angular-sizes',
      language: 'angular',
      label: 'Three steps, and the field that outranks them',
      source: `<textarea slTextarea size="sm" [rows]="2"></textarea>
<textarea slTextarea size="lg" [rows]="2"></textarea>

<!-- Inside a field the field decides, and the control follows. -->
<div slField size="sm">
  <textarea slTextarea></textarea>
</div>`,
    }),
  },
  {
    id: 'variants',
    title: 'How much frame the control shows',
    note: 'The same three frames the single-line control paints, against the same tokens: one that takes the ground it is placed on, one that sinks into the page, and one that shows nothing until it is used.',
    snippet: defineSnippet({
      id: 'textarea-angular-variants',
      language: 'angular',
      label: 'Three frames, and a payload in monospace',
      source: `<textarea slTextarea variant="subtle"></textarea>
<textarea slTextarea variant="plain"></textarea>

<!-- Tabular figures and the monospaced family, for a payload. -->
<textarea slTextarea mono variant="subtle"></textarea>`,
    }),
  },
  {
    id: 'auto-size',
    title: 'Growing with the content',
    note: 'Nothing is measured on the main thread: CSS field-sizing grows the box, rows is the floor and maxRows the ceiling. Type past four lines in the first example and the control scrolls rather than pushing the page.',
    snippet: defineSnippet({
      id: 'textarea-angular-auto-size',
      language: 'angular',
      label: 'A floor, a ceiling, and no measurement',
      source: `<textarea slTextarea autoSize [rows]="1" [maxRows]="4"></textarea>

<!-- The ceiling has a default and cannot be removed: a control that grows
     forever pushes the page out from under the caret. -->
<textarea slTextarea autoSize></textarea>`,
    }),
  },
  {
    id: 'resize',
    title: 'The handle in the corner',
    note: 'block is the default rather than the platform’s both, because a control wider than its field breaks the field’s own grid. The handle is withdrawn entirely while autoSize is on, since the two would disagree on the next keystroke.',
    snippet: defineSnippet({
      id: 'textarea-angular-resize',
      language: 'angular',
      label: 'Three axes, and the one that withdraws it',
      source: `<textarea slTextarea resize="none"></textarea>
<textarea slTextarea resize="both"></textarea>

<!-- autoSize wins: the handle is withdrawn rather than left to fight. -->
<textarea slTextarea autoSize resize="both"></textarea>`,
    }),
  },
  {
    id: 'states',
    title: 'The four states the control paints',
    note: 'Read-only keeps full-strength ink and its handle, because the commonest thing a read-only textarea holds is a value someone has to copy; disabled loses the handle as well, since a handle on a control nobody can type in is a handle that lies.',
    snippet: defineSnippet({
      id: 'textarea-angular-states',
      language: 'angular',
      label: 'Every state unset by default',
      source: `<!-- Unstated rather than false, so the control defers to its field. -->
<textarea slTextarea invalid></textarea>
<textarea slTextarea readonly>Somente leitura</textarea>
<textarea slTextarea disabled>Desativado</textarea>`,
    }),
  },
  {
    id: 'count',
    title: 'Counting what has been typed',
    note: 'The control counts and the field draws it in the spare column of the label row, so a count that appears on the first keystroke never shares a row with the error and pushes it — which is where Angular Material puts it.',
    snippet: defineSnippet({
      id: 'textarea-angular-count',
      language: 'angular',
      label: 'A count bound to the value',
      source: `<div slField>
  <label slFieldLabel>Notes</label>
  <textarea slTextarea showCount maxlength="280" autoSize [rows]="2"></textarea>
</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Content the family did not choose',
    note: 'A pasted token with no break in it — a signed URL, a certificate, a container digest — wraps instead of taking the page’s horizontal scrollbar with it, and nothing is removed from the value.',
    snippet: defineSnippet({
      id: 'textarea-angular-content',
      language: 'angular',
      label: 'Unbreakable, translated and right-to-left',
      source: `<textarea slTextarea [rows]="3">{{ jwt }}</textarea>

<!-- overflow-wrap: anywhere in the stylesheet, so the whole string stays
     selectable, copyable and reachable with the caret. -->
<textarea slTextarea dir="rtl" [rows]="3">مرحبا بالعالم</textarea>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, and reaching past it',
    note: 'provideTextareaDefaults carries the four decisions an application takes once; exportAs reaches the instance, and textareaElement is the native element with focus, select and setSelectionRange already on it.',
    snippet: defineSnippet({
      id: 'textarea-angular-composition',
      language: 'angular',
      label: 'A token, a reactive form, and the element itself',
      source: `<!-- ControlValueAccessor: the control belongs in a form as it stands. -->
<textarea slTextarea [formControl]="notes" autoSize></textarea>

<!-- exportAs, for the element the template has to reach. -->
<textarea slTextarea #field="slTextarea"></textarea>
<button type="button" (click)="field.textareaElement.select()">Select</button>`,
    }),
  },
  {
    id: 'keyboard',
    title: 'What the keyboard does, and what it deliberately does not',
    note: 'Enter makes a line and never submits — the difference WAI-ARIA notes between a single-line and a multi-line control — and Tab leaves the control rather than inserting a tab, so a keyboard user is never trapped in a comment box.',
    snippet: defineSnippet({
      id: 'textarea-angular-keyboard',
      language: 'angular',
      label: 'Enter makes a line; the form is submitted elsewhere',
      source: `<form (ngSubmit)="submit()">
  <textarea slTextarea [formControl]="notes" [rows]="3"></textarea>
  <button slButton type="submit">Submit</button>
</form>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: '(valueChange)',
    payload: 'ChangeRequest<string>',
    when: 'Before the value moves. request.value is the new value and request.previous the value it replaces. request.reason is always keyboard, because only an edit in the textarea moves the value, and request.source is the originating event. request.cancel() refuses the change: the form control and the count do not move, and the element keeps what was typed.',
  },
  {
    name: 'ControlValueAccessor',
    payload: 'the form’s own value and touched state',
    when: 'Whenever the value moves and the request was not cancelled, and on blur for touched. It is the two-way binding Angular forms expect, which is why there is no [(value)]: a two-way binding carries neither a reason nor cancel().',
  },
];

export const ANGULAR_TEXTAREA_DOCS = {
  textarea: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'value',
        'string',
        '—',
        'slTextarea',
        'Makes the value controlled: it is written to the element whenever it changes, the way a form control’s value is. Without it the element keeps its own value.',
      ],
      [
        'defaultValue',
        'string',
        '—',
        'slTextarea',
        'The value the textarea starts from when no value or form control writes one. It is read once the inputs are bound.',
      ],
      [
        'size',
        "'sm' | 'md' | 'lg'",
        'md',
        'slTextarea, provideTextareaDefaults',
        'The step of the control scale. When unset, the textarea takes the size of its field, then of provideTextareaDefaults. The vertical padding is derived from the step, so a textarea of one row is as tall as a text field of the same step at every density.',
      ],
      [
        'variant',
        "'outline' | 'subtle' | 'plain'",
        'outline',
        'slTextarea, provideTextareaDefaults',
        'How much frame the textarea draws: the three frames of the text field, read from the same tokens. When unset, the textarea takes the variant set by provideTextareaDefaults.',
      ],
      [
        'mono',
        'boolean',
        'false',
        'slTextarea, provideTextareaDefaults',
        'Sets the value in the monospaced font with tabular figures, for a payload, a template or a diff.',
      ],
      [
        'resize',
        "'block' | 'none' | 'both'",
        'block',
        'slTextarea, provideTextareaDefaults',
        'Which way the resize handle drags. The default is block rather than the platform’s both, because a textarea wider than its field breaks the field’s grid. While autoSize is on, the handle is removed.',
      ],
      [
        'autoSize',
        'boolean',
        'false',
        'slTextarea',
        'Grows the textarea with its content through CSS field-sizing, with no measurement in script, which cdkTextareaAutosize performs. rows becomes the floor and maxRows the ceiling.',
      ],
      [
        'rows',
        'number',
        '3',
        'slTextarea',
        'The starting height in lines, and the floor while autoSize is on. The default is 3 rather than the platform’s 2, because a box of two rows reads as a mistyped input.',
      ],
      [
        'maxRows',
        'number',
        '12',
        'slTextarea',
        'The ceiling autoSize grows to, in lines; past it the textarea scrolls. It cannot be removed, because a textarea that grows without limit pushes the page out from under the caret.',
      ],
      [
        'showCount',
        'boolean',
        'false',
        'slTextarea',
        'Publishes the length of the value to the field around it, which draws the count at the end of its label row.',
      ],
      [
        'countMax',
        'number',
        'maxlength',
        'slTextarea',
        'The limit the count is measured against; it defaults to maxlength. Without maxlength it is a soft limit: the value may pass it, and the count is then drawn as invalid.',
      ],
      [
        'maxLength',
        'number',
        '—',
        'slTextarea',
        'The native limit, which refuses input past it. Bound as [maxLength] or written as a static maxlength attribute, it reaches the element as maxlength and the count is measured against it.',
      ],
      [
        'disabled',
        'boolean',
        'from the field, or false',
        'slTextarea',
        'Unset rather than false, so the textarea follows the field around it and a disabled form control. When set, it wins and writes the native disabled.',
      ],
      [
        'readOnly',
        'boolean',
        'from the field, or false',
        'slTextarea',
        'Unset rather than false, so the textarea follows the field around it. Writes the native readonly: the textarea stays focusable, selectable and submitted, and keeps its resize handle. A static readonly attribute on the element counts as set.',
      ],
      [
        'invalid',
        'boolean',
        'from the field, or false',
        'slTextarea',
        'Unset rather than false, so the textarea follows the field around it. Writes aria-invalid and data-invalid.',
      ],
      [
        'required',
        'boolean',
        '—',
        'the textarea element',
        'The element’s own attribute; SlTextarea never writes it. Inside a required field, the textarea receives aria-required instead, because the native attribute turns on browser constraint validation.',
      ],
    ]),
    composition: apiRows([
      [
        'the directive itself',
        'slTextarea',
        '—',
        'the consumer’s own textarea',
        'slTextarea sits on your own textarea element, which is its only part. Every native attribute, listener and form binding you write stays on that element.',
      ],
      [
        'exportAs',
        "'slTextarea'",
        '—',
        'a template',
        'Reaches the directive instance. Its textareaElement is the native element, with focus(), select() and setSelectionRange().',
      ],
      [
        'provideTextareaDefaults()',
        '{ size, variant, mono, resize }',
        '—',
        'an injector',
        'Sets size, variant, mono and resize once for every textarea under the injector. A textarea that states a value keeps it, and a textarea inside a field takes the field’s size over the token’s.',
      ],
      [
        'ControlValueAccessor',
        'formControl, formControlName, ngModel',
        '—',
        'slTextarea',
        'formControl, formControlName and ngModel bind the textarea directly. It registers no validator: SlTextarea owns no validity, and the form decides it.',
      ],
    ]),
    accessibility: [
      'The WAI-ARIA Authoring Practices define no pattern for a multi-line text control. Textarea follows the HTML specification for the element and the ARIA textbox role, whose aria-multiline the native element supplies.',
      'Inside a field, the textarea takes its accessible name from the field’s label, whose for attribute points at the identifier the field generates. aria-describedby lists any value you write first, then the ones the field adds: help, description, count and error.',
      'A required field sets aria-required, not the native required. Every value you write on the element (id, aria-describedby, aria-invalid, aria-required and readonly) is read before the host bindings compute and is never overwritten, although an Angular host binding otherwise wins over a static attribute.',
      'Enter adds a line and never submits the form. WAI-ARIA describes this as the difference between a single-line and a multi-line text control, and a comment box that submitted on Enter would lose what was being written.',
      'Tab moves focus out of the textarea. No key is bound, so no shortcut holds keyboard focus inside it.',
      'Growth with the content is CSS, not script: the textarea takes its new height with no animation, so a screen reader announces nothing and a reader who asked for reduced motion sees no movement.',
    ],
    snippets: [
      defineSnippet({
        id: 'textarea-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<textarea
  data-ui="textarea"
  data-part="root"
  data-size="md"
  data-variant="outline"
  data-resize="none"
  data-auto-size
  rows="2"
  style="--slotted-textarea-rows: 2; --slotted-textarea-max-rows: 6"
></textarea>`,
      }),
      defineSnippet({
        id: 'textarea-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='textarea'] {
  --slotted-textarea-border-color: var(--slotted-tone-secondary-border);
  --slotted-textarea-line-height: var(--slotted-line-height-lg);
  --slotted-textarea-rows: 4;
  --slotted-textarea-max-rows: 16;
}`,
      }),
    ],
  },
} as const;
