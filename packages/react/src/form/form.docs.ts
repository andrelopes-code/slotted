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

export const REACT_FORM_TOKENS = formTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Form decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Form, FormActions, FormAside, FormDefaultsProvider, FormSummary, useFormState } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'form',
    required: true,
    purpose:
      'The element itself. Carries data-ui="form", data-invalid, data-loading and data-disabled, writes novalidate, and is the query container the action row is measured against. It stays a form: a submit event has nowhere else to come from, FormData reads a form, and requestSubmit() and reset() are the element’s own.',
  },
  {
    part: 'summary',
    element: 'div[role=alert][tabindex=-1]',
    required: false,
    purpose:
      'The region a reader is sent to after a failed submit. Rendered by the form under summary="auto", or placed by the consumer as <FormSummary /> under summary="none". It exists only while something is wrong. It carries data-ui="form" beside its data-part, so the family’s rules reach it wherever it stands and never a nested family’s summary — a table’s totals row.',
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
    element: 'div',
    required: false,
    purpose:
      'The row a form’s actions stand in, aligned to the reading end. Below 360 container pixels it becomes a column of full-width actions with the primary one first — a reader’s thumb is at the bottom of a phone and their eye at the end of a row. It carries data-ui="form" beside its data-part, so a nested family’s actions — a section’s — keep their own row.',
  },
  {
    part: 'aside',
    element: 'div',
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
      id: 'form-react-playground',
      language: 'tsx',
      label: 'A form, its fields and its actions',
      source: `<Form onSubmit={(values) => save(values)}>
  <Field>
    <FieldLabel>Nome completo</FieldLabel>
    <TextField name="nome" required />
  </Field>
  <FormActions>
    <Button type="submit">Save</Button>
  </FormActions>
</Form>;`,
    }),
  },
  {
    id: 'validation',
    title: 'When the form checks its controls',
    note: 'submit is the default and re-checks on change afterwards; blur checks only the control that lost focus; change checks after the first submit; none leaves validation entirely to the consumer. novalidate is written either way, so the browser’s bubble never lands beside a message the field is already drawing.',
    snippet: defineSnippet({
      id: 'form-react-validation',
      language: 'tsx',
      label: 'Four policies, and the platform underneath all of them',
      source: `<Form validate="submit">…</Form>;
<Form validate="blur">…</Form>;

// The browser still validates; only its bubble is off.
<TextField name="email" required type="email" />;`,
    }),
  },
  {
    id: 'errors',
    title: 'Where the errors come from',
    note: 'Three sources merge into one map, latest last: a server’s answer, the platform’s own constraint validation, and whatever the submit handler returned. A server error is dropped as soon as the field it names is edited, and every error is dropped at the next submit.',
    snippet: defineSnippet({
      id: 'form-react-errors',
      language: 'tsx',
      label: 'A server’s answer, handed straight back',
      source: `const [errors, setErrors] = useState({});

<Form
  errors={errors}
  onErrorsChange={setErrors}
  onSubmit={async (values) => (await save(values)).errors}
>
  …
</Form>;`,
    }),
  },
  {
    id: 'summary',
    title: 'The region a reader is sent to',
    note: 'The four things the sourced error summary states a summary must do: focus moves to it, it carries a heading, it links to each answer in error, and its messages are the same strings the fields show. errorFocus="control" skips it and goes to the first field instead.',
    snippet: defineSnippet({
      id: 'form-react-summary',
      language: 'tsx',
      label: 'Rendered by the family, or placed by the consumer',
      source: `<Form summaryTitle="Corrija estes campos">…</Form>;

// Somewhere else on the page, under a heading of your own.
<Form summary="none">
  <PageHeader />
  <FormSummary />…
</Form>;`,
    }),
  },
  {
    id: 'submit',
    title: 'Submission, and the second press that does nothing',
    note: 'A handler that returns a promise puts the form in its busy state until it settles, and a second submit while one is pending is refused — the defect a double-clicked button produces in a bare form. Returning an error map from the handler re-enters the same path a failed validation takes.',
    snippet: defineSnippet({
      id: 'form-react-submit',
      language: 'tsx',
      label: 'An asynchronous submit that can answer with errors',
      source: `<Form
  onSubmit={async (values) => {
    const answer = await fetch('/orders', {
      body: new URLSearchParams(values as never),
      method: 'POST',
    });
    if (!answer.ok) return await answer.json();
  }}
>
  …
</Form>;`,
    }),
  },
  {
    id: 'actions',
    title: 'The row the actions stand in',
    note: 'end is the default, between pushes a destructive action away from the one beside it, and stretch shares the row. Narrow the column below 360 pixels and every alignment becomes the same column of full-width actions, primary first.',
    snippet: defineSnippet({
      id: 'form-react-actions',
      language: 'tsx',
      label: 'Four alignments, one reflow',
      source: `<FormActions>
  <Button tone="secondary" type="button" variant="ghost">
    Cancel
  </Button>
  <Button type="submit">Save changes</Button>
</FormActions>;

<FormActions align="between">…</FormActions>;`,
    }),
  },
  {
    id: 'states',
    title: 'Every state the family carries',
    note: 'data-invalid while anything is wrong, data-loading and aria-busy while a submit is in flight, data-disabled when the consumer says so. The form does not dim itself while it saves: a form that hid its own values would hide what the reader is waiting on.',
    snippet: defineSnippet({
      id: 'form-react-states',
      language: 'tsx',
      label: 'Busy from the family, and busy from the consumer',
      source: `// The family's own submission, and a mutation the consumer started.
<Form loading={mutation.isPending}>…</Form>;

const form = useFormState();
<Button disabled={form?.submitting} type="submit">
  Save
</Button>;`,
    }),
  },
  {
    id: 'content',
    title: 'Eleven errors, and one for a field that is not there',
    note: 'The list scrolls past twelve lines rather than truncating, and an error naming a control the form does not hold keeps its place without a link. Both are cases a real server produces and none of the surveyed implementations answers.',
    snippet: defineSnippet({
      id: 'form-react-content',
      language: 'tsx',
      label: 'A server that answered about a field the page no longer renders',
      source: `<Form errors={{ coupon: 'The coupon provided has expired', email: 'Invalid address' }}>
  <Field>
    <FieldLabel>Email</FieldLabel>
    <TextField name="email" />
  </Field>
</Form>;`,
    }),
  },
  {
    id: 'composition',
    title: 'Setting it once, reaching past it, and guarding it',
    note: 'The provider carries the six decisions an application takes once; the handle reaches the four actions a value cannot express; guardUnsaved registers a beforeunload while anything has been edited, which nothing surveyed ships.',
    snippet: defineSnippet({
      id: 'form-react-composition',
      language: 'tsx',
      label: 'A provider, a handle and an unsaved guard',
      source: `<FormDefaultsProvider validate="blur">
  <Form guardUnsaved handle={handle}>
    …
  </Form>
</FormDefaultsProvider>;

<Button onClick={() => handle.current?.validate()}>Conferir</Button>;`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a reader hears, and where focus goes',
    note: 'Tab into the form, submit it empty, and follow what happens: the region announces itself, takes focus, and each link moves focus to the control it names without changing the address bar. Every message in the summary is the same string the field shows.',
    snippet: defineSnippet({
      id: 'form-react-accessibility',
      language: 'tsx',
      label: 'One map, two places it is shown',
      source: `<Form errors={{ email: 'The address must contain an at sign' }}>
  <Field invalid>
    <FieldLabel>Email</FieldLabel>
    <TextField name="email" />
    <FieldError>The address must contain an at sign</FieldError>
  </Field>
</Form>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onErrorsChange',
    payload: '(errors: FormErrors, request: ChangeRequest<FormErrors>)',
    when: 'Before the error map moves. The request carries the new map, the map it replaces, the reason — "submit" for validation running, "keyboard" for a field changing and dropping its own error, "clear" for a reset, "programmatic" for validate() — the originating event, and cancel(). A request for the map the family already holds is not emitted.',
  },
  {
    name: 'onSubmit',
    payload: '(values, request) => void | FormErrorInput | Promise<void | FormErrorInput>',
    when: 'When the form submits and nothing is wrong with it. The values are read from FormData in document order. Returning an error map publishes those errors and moves focus; returning a promise holds the form in its busy state until it settles.',
  },
];

export const REACT_FORM_DOCS = {
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
        'Form',
        'Present means the consumer owns the error map, for the life of the component. Keyed by the name attribute of the control each error is about, which is the key the platform already uses and the key a server already sends',
      ],
      [
        'defaultErrors',
        'Record<string, string | string[]>',
        '—',
        'Form',
        'The errors an uncontrolled form starts from, read once — a page rendered on the server with a failed submission already in it',
      ],
      [
        'validate',
        "'submit' | 'blur' | 'change' | 'none'",
        'submit',
        'Form, FormDefaultsProvider',
        'When the form checks its controls. submit re-checks on change afterwards, because telling a reader an answer is wrong before they have finished writing it is noise and telling them nothing after they have fixed it is worse',
      ],
      [
        'errorFocus',
        "'summary' | 'control' | 'none'",
        'summary',
        'Form, FormDefaultsProvider',
        'Where focus goes after a failed submit. summary is the sourced pattern’s answer; control is for a form of one field, where a summary is ceremony',
      ],
      [
        'summary',
        "'auto' | 'none'",
        'auto',
        'Form, FormDefaultsProvider',
        'Whether the family renders the summary as its first child. none leaves it to the consumer, who places <FormSummary /> wherever the page needs it',
      ],
      [
        'summaryTitle',
        'ReactNode',
        '—',
        'Form',
        'The summary’s heading as content of the page’s own, replacing the summaryTitle message',
      ],
      [
        'messages',
        'Partial<FormMessages>',
        '—',
        'Form',
        'Words laid over the language in force: the summary’s heading (summaryTitle)',
      ],
      [
        'summaryDescription',
        'ReactNode',
        '—',
        'Form, FormDefaultsProvider',
        'A sentence under the heading, for a form whose failure needs more than a list',
      ],
      [
        'align',
        "'end' | 'start' | 'between' | 'stretch'",
        'end',
        'Form, FormActions, FormDefaultsProvider',
        'How the action row is arranged above the reflow. Every alignment becomes one column of full-width actions below 360 container pixels',
      ],
      [
        'nativeValidation',
        'boolean',
        'false',
        'Form, FormDefaultsProvider',
        'Lets the browser draw its own validation bubble. Off by default, because the field around each control already draws the message — and constraint validation still runs either way',
      ],
      [
        'guardUnsaved',
        'boolean',
        'false',
        'Form',
        'Registers a beforeunload while anything in the form has been edited. Off by default: a page that refuses to close after one character is a trap',
      ],
      [
        'loading',
        'boolean',
        'false',
        'Form',
        'Marks the form busy for work the family did not start. It is merged with the family’s own submission, so either one writes data-loading and aria-busy',
      ],
      [
        'disabled',
        'boolean',
        '—',
        'Form',
        'Writes data-disabled on the root. It does not disable the controls: a fieldset does that, and it does it natively',
      ],
    ]),
    composition: apiRows([
      [
        'ref',
        'Ref<HTMLFormElement>',
        '—',
        'Form',
        'Reaches the element. requestSubmit(), reset(), checkValidity() and FormData are the element’s own, so nothing is invented for what the platform already ships',
      ],
      [
        'handle',
        'Ref<FormHandle>',
        '—',
        'Form',
        'validate(), submit(), reset() and focusFirstError() — the four actions a consumer cannot express by passing a value',
      ],
      [
        'FormSummary',
        'HTMLAttributes<HTMLElement>',
        '—',
        'inside a Form',
        'The summary, placed by the consumer under summary="none". It renders nothing while nothing is wrong',
      ],
      [
        'FormActions',
        '{ align } & HTMLAttributes<HTMLElement>',
        '—',
        'inside a Form',
        'The action row, with its own alignment when the form’s is not the one this row wants',
      ],
      [
        'useFormState()',
        '() => FormContextValue | undefined',
        '—',
        'inside a Form',
        'The errors, their document order, whether a submit is in flight and whether the form has been submitted. It is what a submit button reads to disable itself',
      ],
      [
        'FormDefaultsProvider',
        '{ validate, errorFocus, summary, summaryDescription, align, nativeValidation }',
        '—',
        'a subtree',
        'The six decisions an application takes once. The summary’s heading comes from the language in force (SlottedProvider)',
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
        id: 'form-react-anatomy',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<form data-ui="form" data-part="root" data-invalid noValidate>
  <div data-part="summary" role="alert" tabIndex={-1} aria-labelledby="summary-title">
    <h2 data-part="summary-title" id="summary-title">
      There is a problem
    </h2>
    <ul data-part="summary-list">
      <li>
        <a data-part="summary-item" href="#email">
          The address must contain an at sign
        </a>
      </li>
      <li>
        <span data-part="summary-item">O cupom informado expirou</span>
      </li>
    </ul>
  </div>
  <div data-part="actions" data-align="end" />
</form>;`,
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
