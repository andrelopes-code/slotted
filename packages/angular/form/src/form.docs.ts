import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import formTokens from '@slotted/styles/form/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const ANGULAR_FORM_TOKENS = formTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Form decision',
}));

const imports: ReferenceImport = {
  source:
    "import {\n  provideFormDefaults,\n  provideFormErrorMessages,\n  SlForm,\n  SlFormActions,\n  SlFormAside,\n  SlFormSummary,\n} from '@slotted/angular/form';",
  selector: 'form[slForm]',
  exportAs: 'slForm',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'form',
    required: true,
    purpose:
      'The element itself, and the selector is form[slForm] rather than [slForm]: a submit event has nowhere else to come from, FormData reads a form, and requestSubmit() and reset() are the element’s own. It carries data-ui="form", data-invalid, data-loading and data-disabled, writes novalidate, and is the query container the action row is measured against.',
  },
  {
    part: 'summary',
    element: 'the element carrying slFormSummary',
    required: false,
    purpose:
      'The region a reader is sent to after a failed submit, with role="alert" and tabindex="-1". Rendered by the form under summary="auto", or placed by the consumer under summary="none". It exists only while something is wrong. It carries data-ui="form" beside its data-part, so the family’s rules reach it wherever it stands and never a nested family’s summary — a table’s totals row.',
  },
  {
    part: 'summary-title',
    element: 'h2',
    required: false,
    purpose:
      'The heading the sourced pattern requires, the summaryTitle message of the language in force (“There is a problem”). It labels the region, so a reader who is moved there is told what they arrived at.',
  },
  {
    part: 'summary-list',
    element: 'ul',
    required: false,
    purpose:
      'One item per message, in document order. It scrolls past twelve lines rather than truncating, because a hundred errors is a real answer from a real server and none of them may leave the DOM.',
  },
  {
    part: 'summary-item',
    element: 'a[href], or span',
    required: false,
    purpose:
      'A link to the control the message is about, which moves focus there without following the fragment. An error naming a control the form does not hold is a span instead: a message a reader cannot reach is still a message they have to be given.',
  },
  {
    part: 'actions',
    element: 'the element carrying slFormActions',
    required: false,
    purpose:
      'The row a form’s actions stand in, aligned to the reading end. Below 360 container pixels it becomes a column of full-width actions with the primary one first — a reader’s thumb is at the bottom of a phone and their eye at the end of a row. It carries data-ui="form" beside its data-part, so a nested family’s actions — a section’s — keep their own row.',
  },
  {
    part: 'aside',
    element: 'the element carrying slFormAside',
    required: false,
    purpose:
      'What the form says about the whole record — a live preview, a summary in words, a help panel. From a form 75rem wide it stands beside the column of fields, --slotted-form-aside-size (20rem) wide at the end, and sticks under --slotted-page-sticky-top while the fields scroll; below that it follows in source order, so write it after the last field. With or without it, the fields, the summary and the actions stand at most --slotted-form-measure (40rem) wide.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Playground',
    note: 'A form of two fields with the family’s whole lifecycle on it. Submit it empty: the platform’s own messages appear in the summary, focus moves there, and each link jumps to the field it names. Two fields written one after the other inside the form stand apart by --slotted-form-field-gap (space-6 by default), and two field groups by --slotted-form-section-gap (space-9 by default); a layout the page draws itself — a Grid, a Stack — keeps its own gap.',
    snippet: defineSnippet({
      id: 'form-angular-playground',
      language: 'angular',
      label: 'A form, its fields and its actions',
      source: `<form slForm (formSubmit)="save($event.values)">
  <div slField>
    <label slFieldLabel>Nome completo</label>
    <div slTextField><input slTextFieldInput name="nome" required /></div>
  </div>
  <div slFormActions>
    <button slButton type="submit">Save</button>
  </div>
</form>`,
    }),
  },
  {
    id: 'validation',
    title: 'When the form checks its controls',
    note: 'submit is the default and re-checks on change afterwards; blur checks only the control that lost focus; change checks after the first submit; none leaves validation entirely to the consumer. novalidate is written either way, so the browser’s bubble never lands beside a message the field is already drawing.',
    snippet: defineSnippet({
      id: 'form-angular-validation',
      language: 'angular',
      label: 'Four policies, and the platform underneath all of them',
      source: `<form slForm validate="submit">…</form>
<form slForm validate="blur">…</form>

<!-- The browser still validates; only its bubble is off. -->
<input slTextFieldInput name="email" type="email" required />`,
    }),
  },
  {
    id: 'errors',
    title: 'Where the errors come from',
    note: 'Three sources merge into one map, latest last: a server’s answer, the platform’s own constraint validation, and Reactive Forms. A server error is dropped as soon as the field it names is edited, and every error is dropped at the next submit.',
    snippet: defineSnippet({
      id: 'form-angular-errors',
      language: 'angular',
      label: 'A server’s answer, and a validator’s key',
      source: `<form slForm [errors]="serverErrors()" [formGroup]="group" (formSubmit)="save($event)">
  <div slField>
    <label slFieldLabel>Nome</label>
    <div slTextField><input slTextFieldInput name="nome" formControlName="nome" /></div>
  </div>
</form>`,
    }),
  },
  {
    id: 'summary',
    title: 'The region a reader is sent to',
    note: 'The four things the sourced error summary states a summary must do: focus moves to it, it carries a heading, it links to each answer in error, and its messages are the same strings the fields show. errorFocus="control" skips it and goes to the first field instead.',
    snippet: defineSnippet({
      id: 'form-angular-summary',
      language: 'angular',
      label: 'Rendered by the family, or placed by the consumer',
      source: `<form slForm [messages]="{ summaryTitle: 'Corrija estes campos' }">…</form>

<!-- Somewhere else on the page, under a heading of your own. -->
<form slForm summary="none">
  <h1>Order</h1>
  <div slFormSummary></div>
</form>`,
    }),
  },
  {
    id: 'submit',
    title: 'Submission, and the second press that does nothing',
    note: 'The submit event hands back a pending() for work that takes time and an errors() for what the server answered. A second submit while one is pending is refused — the defect a double-clicked button produces in a bare form.',
    snippet: defineSnippet({
      id: 'form-angular-submit',
      language: 'ts',
      label: 'An asynchronous submit that can answer with errors',
      source: `class CheckoutPage {
  save(request: { values: Record<string, unknown>; pending: (work: Promise<unknown>) => void }) {
    request.pending(
      firstValueFrom(this.orders.create(request.values)).then((answer) => answer.errors),
    );
  }
}`,
    }),
  },
  {
    id: 'actions',
    title: 'The row the actions stand in',
    note: 'end is the default, between pushes a destructive action away from the one beside it, and stretch shares the row. Narrow the column below 360 pixels and every alignment becomes the same column of full-width actions, primary first.',
    snippet: defineSnippet({
      id: 'form-angular-actions',
      language: 'angular',
      label: 'Four alignments, one reflow',
      source: `<div slFormActions>
  <button slButton type="button" tone="secondary" variant="ghost">Cancel</button>
  <button slButton type="submit">Save changes</button>
</div>

<div slFormActions align="between">…</div>`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family carries',
    note: 'data-invalid while anything is wrong, data-loading and aria-busy while a submit is in flight, data-disabled when the consumer says so. The form does not dim itself while it saves: a form that hid its own values would hide what the reader is waiting on.',
    snippet: defineSnippet({
      id: 'form-angular-states',
      language: 'angular',
      label: 'Busy from the family, and busy from the consumer',
      source: `<form slForm [loading]="saving()" #checkout="slForm">
  <div slFormActions>
    <button slButton type="submit" [loading]="saving()">Save</button>
  </div>
</form>`,
    }),
  },
  {
    id: 'content',
    title: 'Eleven errors, and one for a field that is not there',
    note: 'The list scrolls past twelve lines rather than truncating, and an error naming a control the form does not hold keeps its place without a link. Both are cases a real server produces and none of the surveyed implementations answers.',
    snippet: defineSnippet({
      id: 'form-angular-content',
      language: 'angular',
      label: 'A server that answered about a field the page no longer renders',
      source: `<form slForm [errors]="{ cupom: 'The coupon provided has expired', email: 'Invalid address' }">
  <div slField>
    <label slFieldLabel>Email</label>
    <div slTextField><input slTextFieldInput name="email" /></div>
  </div>
</form>`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, reaching past it, and guarding it',
    note: 'Two injection tokens carry what an application decides once: how its forms behave, and the sentence of a validator the application adds. exportAs reaches the four actions a value cannot express, and guardUnsaved registers a beforeunload nothing surveyed ships.',
    snippet: defineSnippet({
      id: 'form-angular-composition',
      language: 'ts',
      label: 'Two providers an application writes once',
      source: `providers: [
  provideFormDefaults({ validate: 'blur' }),
  provideFormErrorMessages({
    cnpj: () => 'Invalid EIN.',
  }),
];`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears, and where focus goes',
    note: 'Tab into the form, submit it empty, and follow what happens: the region announces itself, takes focus, and each link moves focus to the control it names without changing the address bar. Every message in the summary is the same string the field shows.',
    snippet: defineSnippet({
      id: 'form-angular-accessibility',
      language: 'angular',
      label: 'One map, two places it is shown',
      source: `<form slForm [errors]="{ email: 'The address must contain an at sign' }">
  <div slField [invalid]="true">
    <label slFieldLabel>Email</label>
    <div slTextField><input slTextFieldInput name="email" /></div>
    <p slFieldError>The address must contain an at sign</p>
  </div>
</form>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'errorsChange',
    payload: 'ChangeRequest<FormErrors>',
    when: 'Before the error map moves. The request carries the new map, the map it replaces, the reason — "submit" for validation running, "keyboard" for a field changing and dropping its own error, "clear" for a reset, "programmatic" for validateNow() — the originating event, and cancel(). A request for the map the family already holds is not emitted.',
  },
  {
    name: 'formSubmit',
    payload: '{ values, event, errors(map), pending(promise) }',
    when: 'When the form submits and nothing is wrong with it. The values are read from FormData in document order; errors() publishes what a server answered and moves focus; pending() holds the form in its busy state until the promise settles.',
  },
];

export const ANGULAR_FORM_DOCS = {
  form: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'errors',
        'Record<string, string | string[]>',
        '—',
        'slForm',
        'Present means the consumer owns the error map, for the life of the component. Keyed by the name attribute of the control each error is about, which is the key the platform already uses and the key a server already sends',
      ],
      [
        'defaultErrors',
        'Record<string, string | string[]>',
        '—',
        'slForm',
        'The errors an uncontrolled form starts from, read once — a page rendered on the server with a failed submission already in it',
      ],
      [
        'validate',
        "'submit' | 'blur' | 'change' | 'none'",
        'submit',
        'slForm, provideFormDefaults',
        'When the form checks its controls. submit re-checks on change afterwards, because telling a reader an answer is wrong before they have finished writing it is noise and telling them nothing after they have fixed it is worse',
      ],
      [
        'errorFocus',
        "'summary' | 'control' | 'none'",
        'summary',
        'slForm, provideFormDefaults',
        'Where focus goes after a failed submit. summary is the sourced pattern’s answer; control is for a form of one field, where a summary is ceremony',
      ],
      [
        'summary',
        "'auto' | 'none'",
        'auto',
        'slForm, provideFormDefaults',
        'Whether the family renders the summary as its first child. none leaves it to the consumer, who puts slFormSummary wherever the page needs it',
      ],
      [
        'messages',
        'Partial<FormMessages>',
        '—',
        'slForm',
        'Words laid over the language in force, key by key: the summary’s heading (summaryTitle) and the built-in validators’ sentences (errors.required, errors.minlength, …)',
      ],
      [
        'summaryDescription',
        'string',
        '—',
        'slForm, provideFormDefaults',
        'A sentence under the heading, for a form whose failure needs more than a list',
      ],
      [
        'align',
        "'end' | 'start' | 'between' | 'stretch'",
        'end',
        'slForm, slFormActions, provideFormDefaults',
        'How the action row is arranged above the reflow. Every alignment becomes one column of full-width actions below 360 container pixels',
      ],
      [
        'nativeValidation',
        'boolean',
        'false',
        'slForm, provideFormDefaults',
        'Lets the browser draw its own validation bubble. Off by default, because the field around each control already draws the message — and constraint validation still runs either way',
      ],
      [
        'guardUnsaved',
        'boolean',
        'false',
        'slForm',
        'Registers a beforeunload while anything in the form has been edited. Off by default: a page that refuses to close after one character is a trap',
      ],
      [
        'loading',
        'boolean',
        'false',
        'slForm',
        'Marks the form busy for work the family did not start. It is merged with the family’s own submission, so either one writes data-loading and aria-busy',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'slForm',
        'Writes data-disabled on the root. It does not disable the controls: a fieldset does that, and it does it natively',
      ],
    ]),
    composition: apiRows([
      [
        'exportAs',
        "'slForm'",
        '—',
        'the template',
        'Reaches the instance, and through it validateNow(), submit(), reset() and focusFirstError() — the four actions a consumer cannot express by passing a value',
      ],
      [
        'ControlContainer',
        'formGroup, ngForm',
        '—',
        'the same element',
        'Reactive Forms is the second source of errors. Every control is marked touched at submit, and each failing one becomes a sentence: a built-in validator’s from the catalog’s errors.* messages, an application’s own through SL_FORM_ERROR_MESSAGES',
      ],
      [
        'provideFormErrorMessages',
        'Record<string, (context) => string>',
        '{}',
        'an injector',
        'The sentence for a validator the application adds, by its key. Angular reports a key and a shape and never a message; the seven built-in keys are written by the catalog, and an entry for one of them replaces the catalog’s',
      ],
      [
        'provideFormDefaults',
        '{ validate, errorFocus, summary, summaryDescription, align, nativeValidation }',
        '—',
        'an injector',
        'The six decisions an application takes once. The summary’s heading comes from the language in force (provideSlotted)',
      ],
      [
        'slFormSummary / slFormActions',
        'directives on the consumer’s own element',
        '—',
        'inside a form',
        'The summary placed by the page rather than by the family, and the action row with its own alignment when the form’s is not the one this row wants',
      ],
      [
        'Signal Forms',
        '[field]',
        '—',
        'Angular 22',
        'Nothing is added here. Signal Forms binds a control through its ControlValueAccessor, which every Slotted control provides, so they work under [field] today',
      ],
    ]),
    accessibility: [
      'There is no APG pattern for a form. The sourced guidance is WCAG 2.2 SC 3.3.1 Error Identification, the GOV.UK error summary component, and the HTML form element itself; each decides something the family does, and the contract names all three.',
      'The summary answers the four things GOV.UK states a summary must do: keyboard focus moves to it, it carries the heading “There is a problem”, it links to each of the answers that have validation errors, and its messages are worded the same as the ones beside the inputs. The last one is free here — one map feeds the summary and the field, so the two cannot drift.',
      'The region is role="alert" with tabindex="-1" and is labelled by its own heading, so it announces when it appears and can be reached afterwards. A link inside it moves focus to the control rather than following the fragment: a page that never navigated should not gain a history entry or write a control’s identifier into the address bar.',
      'novalidate is written by default. The browser would otherwise draw its own bubble beside a control whose error the field is already showing, and the two would say the same thing twice in two places. Constraint validation still runs: checkValidity() is called explicitly, and validationMessage is the platform’s own string, localized by the operating system in a way no library can better.',
      'An error naming a control the form does not hold keeps its place in the list and loses its link. A server may answer about a field the page no longer renders, and a message a reader cannot reach is still a message they have to be given.',
      'A submit while one is pending is refused, and aria-busy says so. The form does not dim or disable itself while it saves: what a reader is waiting on is the values, and a form that hid them would take away the only thing they can check.',
    ],
    snippets: [
      defineSnippet({
        id: 'form-angular-anatomy',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<form data-ui="form" data-part="root" data-invalid novalidate>
  <div data-part="summary" role="alert" tabindex="-1" aria-labelledby="summary-title">
    <h2 data-part="summary-title" id="summary-title">There is a problem</h2>
    <ul data-part="summary-list">
      <li><a data-part="summary-item" href="#email">The address must contain an at sign</a></li>
      <li><span data-part="summary-item">The coupon provided has expired</span></li>
    </ul>
  </div>
  <div data-part="actions" data-align="end"></div>
</form>`,
      }),
      defineSnippet({
        id: 'form-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='form'] {
  --slotted-form-summary-background: var(--slotted-tone-warning-surface);
  --slotted-form-summary-border-color: var(--slotted-tone-warning-border);
  --slotted-form-summary-color: var(--slotted-tone-warning-text);
  --slotted-form-summary-radius: var(--slotted-radius-lg);
}`,
      }),
    ],
  },
} as const;
