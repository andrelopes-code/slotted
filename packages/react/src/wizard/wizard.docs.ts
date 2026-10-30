import { defineSnippet } from '@slotted/storybook-workbench';
import type {
  AnatomyRow,
  ApiRow,
  EventRow,
  ReferenceImport,
  ReferenceSceneMeta,
} from '@slotted/storybook-workbench';
import wizardTokens from '@slotted/styles/wizard/tokens.json';

type ApiTuple = readonly [string, string, string, string, string];
const apiRows = (rows: readonly ApiTuple[]): ApiRow[] =>
  rows.map(([name, type, defaultValue, appliesTo, description]) => ({
    name,
    type,
    defaultValue,
    appliesTo,
    description,
  }));

export const REACT_WIZARD_TOKENS = wizardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned Wizard decision',
}));

const imports: ReferenceImport = {
  source:
    "import { Wizard, WizardStep, WizardComplete, WizardEdit, useWizardStep } from '@slotted/react';",
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'div',
    required: true,
    purpose:
      'data-ui="wizard", data-progress, data-scroll, and data-loading, data-invalid or data-complete for the submission. The container named slotted-wizard.',
  },
  {
    part: 'layout',
    element: 'div',
    required: true,
    purpose: 'The grid of progress and main, one element in so the container query can change it.',
  },
  {
    part: 'progress',
    element: 'div',
    required: false,
    purpose:
      'The Stepper, beside the step (progress="start") or above it ("top"); data-open while the compact list is open. Absent under progress="none".',
  },
  {
    part: 'progress-toggle',
    element: 'button',
    required: false,
    purpose:
      'Below 600 pixels of the wizard’s own width: “Step 2 of 5” and one segment per step; aria-expanded opens the list.',
  },
  {
    part: 'progress-position',
    element: 'span',
    required: false,
    purpose: 'messages.position, the toggle’s accessible name.',
  },
  {
    part: 'progress-track',
    element: 'span',
    required: false,
    purpose: 'aria-hidden: the whole flow at a glance, one segment per step present.',
  },
  {
    part: 'progress-segment',
    element: 'span',
    required: false,
    purpose: 'data-complete, data-current or data-invalid.',
  },
  {
    part: 'main',
    element: 'div',
    required: true,
    purpose: 'The column of error, step and actions, or of complete.',
  },
  {
    part: 'error',
    element: 'div around an Alert',
    required: false,
    purpose: 'The consumer’s error, or a failed submission, in the danger tone. Focus moves to it.',
  },
  {
    part: 'step',
    element: 'div',
    required: true,
    purpose: 'The current step: its header and its form. aria-busy while a draft is restored.',
  },
  {
    part: 'step-header',
    element: 'div',
    required: true,
    purpose: 'The step’s heading and description.',
  },
  {
    part: 'step-title',
    element: 'h2, h3 or h4',
    required: true,
    purpose:
      'By level; tabindex="-1" and the focus target on every step change. Holds the position, the label and the optional mark.',
  },
  {
    part: 'position',
    element: 'span',
    required: true,
    purpose:
      '“Step 2 of 5” above the name. Below 600 pixels it leaves the picture and stays in the heading’s text.',
  },
  {
    part: 'optional',
    element: 'span around a Tag',
    required: false,
    purpose: 'messages.optional, on an optional step.',
  },
  {
    part: 'step-description',
    element: 'p',
    required: false,
    purpose: 'The step’s description.',
  },
  {
    part: 'actions',
    element: 'div',
    required: true,
    purpose: 'The row under the step, WizardActions by default; the actions prop replaces it.',
  },
  {
    part: 'actions-start',
    element: 'div',
    required: true,
    purpose: 'What leaves the flow: cancel, save draft, then the draft status.',
  },
  {
    part: 'actions-end',
    element: 'div',
    required: true,
    purpose: 'What moves it: skip, back, then next or submit at the end edge.',
  },
  {
    part: 'cancel',
    element: 'button (Button, ghost)',
    required: false,
    purpose: 'Asks onCancel with dirty. Rendered when onCancel is given.',
  },
  {
    part: 'save-draft',
    element: 'button (Button, ghost)',
    required: false,
    purpose: 'Writes the draft. Rendered when onSaveDraft or persistence is given.',
  },
  {
    part: 'draft-status',
    element: 'span role="status"',
    required: false,
    purpose: '“Draft saved at 14:02”, announced once, politely.',
  },
  {
    part: 'skip',
    element: 'button (Button, ghost)',
    required: false,
    purpose: 'On an optional step: accepts it with no answers.',
  },
  {
    part: 'previous',
    element: 'button (Button, outline)',
    required: false,
    purpose: 'The previous step, keeping what was typed. Absent on the first.',
  },
  {
    part: 'next',
    element: 'button type="submit" (Button, solid)',
    required: false,
    purpose:
      'Submits the step’s form from outside it through the form attribute; “Save and return” after an edit from a review step.',
  },
  {
    part: 'submit',
    element: 'button type="submit" (Button, solid)',
    required: false,
    purpose: 'The same button on the step whose acceptance submits the flow; data-final.',
  },
  {
    part: 'edit',
    element: 'button (WizardEdit)',
    required: false,
    purpose:
      'Placed by the consumer on a review step: goes to a step and comes back. Text in the accent; named “Change” and the step’s label.',
  },
  {
    part: 'complete',
    element: 'div',
    required: false,
    purpose:
      'WizardComplete’s content after an accepted submission, in place of step and actions; takes focus.',
  },
  {
    part: 'skeleton',
    element: 'div',
    required: false,
    purpose:
      'While an asynchronous draft is restored: one field whose label and control are skeletons, with the header’s lines beside it.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Opening a business account',
    note: 'Four steps with real fields. Next accepts a step only once its form is valid; the progress beside it marks what is done and closes what is not reached yet.',
    snippet: defineSnippet({
      id: 'wizard-react-playground',
      language: 'tsx',
      label: 'Steps are children, each a form',
      source: `<Wizard onSubmit={(values) => api.openAccount(values)}>
  <WizardStep label="Account" name="account">
    <Field>
      <FieldLabel>Work email</FieldLabel>
      <TextField name="email" required type="email" />
    </Field>
  </WizardStep>
  <WizardStep label="Company" name="company">
    …
  </WizardStep>
  <WizardComplete>…</WizardComplete>
</Wizard>;`,
    }),
  },
  {
    id: 'progress',
    title: 'Where the progress stands',
    note: 'progress="start" is a column beside the step, "top" a row above it, "none" leaves the position in the heading alone. Each is read at the width a page gives it.',
    snippet: defineSnippet({
      id: 'wizard-react-progress',
      language: 'tsx',
      label: 'One axis',
      source: `<Wizard progress="top">…</Wizard>;`,
    }),
  },
  {
    id: 'validation',
    title: 'A step refused, by the platform and by the server',
    note: 'The email is required, and validate asks the server whether it is taken: Next waits in its loading state, the answer lands in the form’s summary and beside the field, and the step turns red in the progress.',
    snippet: defineSnippet({
      id: 'wizard-react-validation',
      language: 'tsx',
      label: 'validate runs after the platform',
      source: `<WizardStep
  label="Account"
  name="account"
  validate={async (values, { signal }) => {
    const taken = await api.emailTaken(values.email, { signal });
    return taken ? { email: 'This email already has an account' } : undefined;
  }}
>
  …
</WizardStep>;`,
    }),
  },
  {
    id: 'branching',
    title: 'Steps that depend on an answer',
    note: 'Choose Business and accept the step: a Company step appears after it. Choose Personal again and it leaves — its answers are kept for when it returns and never submitted.',
    snippet: defineSnippet({
      id: 'wizard-react-branching',
      language: 'tsx',
      label: 'A branch is a condition in JSX',
      source: `const business = value.account?.type === 'business';

<Wizard onValueChange={setValue} value={value}>
  <WizardStep label="Account" name="account">
    …
  </WizardStep>
  {business ? (
    <WizardStep label="Company" name="company">
      …
    </WizardStep>
  ) : null}
  <WizardStep label="Billing" name="billing">
    …
  </WizardStep>
</Wizard>;`,
    }),
  },
  {
    id: 'optional',
    title: 'An optional step',
    note: 'The heading and the progress both say Optional; Skip accepts the step with no answers, and the review says Not provided.',
    snippet: defineSnippet({
      id: 'wizard-react-optional',
      language: 'tsx',
      label: 'optional',
      source: `<WizardStep label="Invite teammates" name="invite" optional>
  …
</WizardStep>;`,
    }),
  },
  {
    id: 'review',
    title: 'Review, change and come back',
    note: 'Change goes to the step and Next reads Save and return: accepting it comes back to the review, unless the change opened a new question, which is asked first.',
    snippet: defineSnippet({
      id: 'wizard-react-review',
      language: 'tsx',
      label: 'WizardEdit on a review step',
      source: `<WizardStep label="Review" name="review">
  <DescriptionList>
    <DescriptionListItem>
      <DescriptionListTerm>Work email</DescriptionListTerm>
      <DescriptionListDescription>{value.account?.email}</DescriptionListDescription>
      <DescriptionListAction>
        <WizardEdit step="account" />
      </DescriptionListAction>
    </DescriptionListItem>
  </DescriptionList>
</WizardStep>;`,
    }),
  },
  {
    id: 'submit',
    title: 'Submitting, failing and finishing',
    note: 'Open account waits in its loading state. The first try is refused by the server with the step and the field named: the wizard goes back to Account, shows the error above it and in the field. The second succeeds and the complete part takes focus.',
    snippet: defineSnippet({
      id: 'wizard-react-submit',
      language: 'tsx',
      label: 'A failure names the step',
      source: `<Wizard
  onSubmit={async (values) => {
    const answer = await api.openAccount(values);
    if (answer.error === 'email-taken') {
      return { step: 'account', errors: { email: 'Taken since you started' } };
    }
  }}
>
  …
</Wizard>;`,
    }),
  },
  {
    id: 'drafts',
    title: 'Drafts, reload and a draft of another version',
    note: 'Save draft writes to sessionStorage and the status says when; each accepted step saves as well. Reload the page and the wizard opens where the draft left it. A draft of another version is cleared, not restored.',
    snippet: defineSnippet({
      id: 'wizard-react-drafts',
      language: 'tsx',
      label: 'A declared policy',
      source: `const persistence = storagePersistence({
  key: 'open-account',
  storage: 'session',
  version: 3,
});

<Wizard persistence={persistence} version={3} guardUnsaved>
  …
</Wizard>;`,
    }),
  },
  {
    id: 'url',
    title: 'The step in the address',
    note: 'The router owns step. A link to a step past the work done is clamped to the first incomplete one, and the request carries programmatic so the router follows.',
    snippet: defineSnippet({
      id: 'wizard-react-url',
      language: 'tsx',
      label: 'Controlled by the router',
      source: `const { step } = useParams();
const navigate = useNavigate();

<Wizard onStepChange={(next) => navigate(\`/open/\${next}\`)} step={step}>
  …
</Wizard>;`,
    }),
  },
  {
    id: 'narrow',
    title: 'On a phone',
    note: 'Below 600 pixels the progress folds behind a bar that says the position and draws one segment per step; the actions stack, the moving ones sharing the line.',
    snippet: defineSnippet({
      id: 'wizard-react-narrow',
      language: 'tsx',
      label: 'The container decides',
      source: `<Wizard progressOpen={open} onProgressOpenChange={setOpen}>
  …
</Wizard>;`,
    }),
  },
  {
    id: 'dialog',
    title: 'Inside a layer',
    note: 'scroll="self" takes the height it is given: the step scrolls and the actions stay at the bottom on the layer’s ground, which is what a Dialog or a Drawer body needs.',
    snippet: defineSnippet({
      id: 'wizard-react-dialog',
      language: 'tsx',
      label: 'scroll="self"',
      source: `<Dialog open={open} onOpenChange={setOpen}>
  <DialogBody>
    <Wizard progress="none" scroll="self">
      …
    </Wizard>
  </DialogBody>
</Dialog>;`,
    }),
  },
  {
    id: 'content',
    title: 'Seven steps, in German',
    note: 'Long translated names wrap in the column and in the heading; the draft status and the long “Save and return” label wrap the row rather than squeezing the buttons.',
    snippet: defineSnippet({
      id: 'wizard-react-content',
      language: 'tsx',
      label: 'Labels are content',
      source: `<WizardStep label="Zahlungsinformationen und Rechnungsanschrift" name="payment">
  …
</WizardStep>;`,
    }),
  },
  {
    id: 'forms',
    title: 'Typed answers from your own state',
    note: 'A step’s values replace its FormData: a date picker and a number field keep their own state, and the wizard accepts the typed object. useWizardStep gives a field the answer to start from.',
    snippet: defineSnippet({
      id: 'wizard-react-forms',
      language: 'tsx',
      label: 'values and useWizardStep',
      source: `function Shipping() {
  const step = useWizardStep();
  return <TextField defaultValue={step?.values.city as string} name="city" />;
}

<WizardStep label="Plan" name="plan" values={{ seats, start }}>
  …
</WizardStep>;`,
    }),
  },
  {
    id: 'labels',
    title: 'Words for another product',
    note: 'Every word is a message: the position, the four actions, the draft status and the failure. The language in force sets them once; a wizard lays its own over them.',
    snippet: defineSnippet({
      id: 'wizard-react-labels',
      language: 'tsx',
      label: 'In Portuguese',
      // language: pt-BR
      source: `<SlottedProvider locale="pt-BR" catalogs={{ 'pt-BR': PT_BR }}>
  <Wizard messages={{ next: 'Continuar', submit: 'Abrir conta' }}>…</Wizard>
</SlottedProvider>;`,
      // language: en-US
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader hears',
    note: 'Each step change moves focus to the heading, which says “Step 2 of 4, Company”. The progress is an ordered list whose headers say their status; Enter in any text field submits the step.',
    snippet: defineSnippet({
      id: 'wizard-react-accessibility',
      language: 'tsx',
      label: 'The list is named',
      source: `<Wizard messages={{ progress: 'Account opening' }}>…</Wizard>;`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'onStepChange',
    payload: '(step: string, request: ChangeRequest<string>)',
    when: 'Before the step moves: an accepted step or Enter (submit), a header or Back (pointer, keyboard), a clamp, a restore or the handle (programmatic). cancel() refuses it.',
  },
  {
    name: 'onValueChange',
    payload: '(value: WizardValue, request: ChangeRequest<WizardValue>)',
    when: 'Before the accepted answers move: a step accepted (submit), reset (clear), a restored draft (programmatic).',
  },
  {
    name: 'onProgressOpenChange',
    payload: '(open: boolean, request: ChangeRequest<boolean>)',
    when: 'Before the compact list opens or closes: its bar (pointer, keyboard), choosing a step (select), Escape (escape).',
  },
  {
    name: 'onSubmit',
    payload:
      '(values: WizardValue, request: { reason, source, value }) => void | WizardFailure | Promise<…>',
    when: 'Once the last step is accepted and every step present is complete. values holds only the steps present; a returned failure is shown and may name a step and its errors.',
  },
  {
    name: 'onCancel',
    payload: '({ dirty, source })',
    when: 'When cancel is pressed. The family closes nothing.',
  },
  {
    name: 'onSaveDraft',
    payload: '(snapshot: WizardSnapshot, { reason, source }) => void | Promise<void>',
    when: 'Before persistence keeps a draft: the save-draft button (pointer), the handle (programmatic), autosave after a step (submit).',
  },
];

export const REACT_WIZARD_DOCS = {
  wizard: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      ['step', 'string', '—', 'Wizard', 'The current step’s name. Present means controlled'],
      [
        'defaultStep',
        'string',
        'the first incomplete step',
        'Wizard',
        'The uncontrolled start, read once and clamped to a step in reach',
      ],
      [
        'value',
        'WizardValue',
        '—',
        'Wizard',
        'The accepted answers by step name. Present means controlled',
      ],
      ['defaultValue', 'WizardValue', '{}', 'Wizard', 'The uncontrolled answers, read once'],
      [
        'progressOpen',
        'boolean',
        '—',
        'Wizard',
        'Whether the compact list is open. Present means controlled',
      ],
      ['defaultProgressOpen', 'boolean', 'false', 'Wizard', 'The uncontrolled start, read once'],
      [
        'progress',
        "'start' | 'top' | 'none'",
        'start',
        'Wizard, WizardDefaultsProvider',
        'Where the list of steps stands',
      ],
      [
        'scroll',
        "'ancestor' | 'self'",
        'ancestor',
        'Wizard, WizardDefaultsProvider',
        'self takes the height given, scrolls the step and pins the actions',
      ],
      [
        'linear',
        'boolean',
        'true',
        'Wizard, WizardDefaultsProvider',
        'A step ahead is reached only once every step before it is complete',
      ],
      ['level', '2 | 3 | 4', '2', 'Wizard, WizardDefaultsProvider', 'The step heading’s level'],
      [
        'messages',
        'PartialMessages<WizardMessages>',
        '—',
        'Wizard',
        'Words laid over the language in force, key by key: position, progress (the name of the list of steps), previous, next, submit, return, cancel, saveDraft, saving, saved with {time}, draftFailed, skip, optional, edit, incomplete, submitFailed, restoring',
      ],
      [
        'error',
        'ReactNode',
        '—',
        'Wizard',
        'An error of your own above the step; it wins over a failed submission',
      ],
      ['disabled', 'boolean', 'false', 'Wizard', 'The form disabled and every action refused'],
      [
        'persistence',
        'WizardPersistence',
        '—',
        'Wizard',
        'load, save and clear; storagePersistence from @slotted/core/wizard keeps drafts in Storage',
      ],
      ['version', 'string | number', '—', 'Wizard', 'A draft of another version is not restored'],
      [
        'autosave',
        "'none' | 'step'",
        'step with persistence',
        'Wizard',
        'step writes a draft after every accepted step',
      ],
      [
        'guardUnsaved',
        'boolean',
        'false',
        'Wizard',
        'A beforeunload guard while anything is unsubmitted',
      ],
      [
        'delay',
        'number',
        '200',
        'Wizard, WizardDefaultsProvider',
        'How long a restore may take before its skeleton is drawn',
      ],
      [
        'minDuration',
        'number',
        '400',
        'Wizard, WizardDefaultsProvider',
        'How long a drawn skeleton stays',
      ],
      ['actions', 'ReactNode', '<WizardActions />', 'Wizard', 'The row under the step'],
      [
        'handle',
        'Ref<WizardHandle>',
        '—',
        'Wizard',
        'next, previous, goTo, edit, skip, submit, saveDraft, clearDraft, reset, focus',
      ],
      [
        'render',
        '(props: WizardRootProps) => ReactNode',
        'a div',
        'Wizard',
        'Substitutes the root element',
      ],
      [
        'native props',
        'ComponentPropsWithRef<"div">',
        '—',
        'Wizard',
        'aria-*, data-*, className, style and handlers reach the root',
      ],
      [
        'name',
        'string',
        '—',
        'WizardStep',
        'The step’s identity: the key of its answers, of a URL, of a draft',
      ],
      ['label', 'ReactNode', '—', 'WizardStep', 'The step’s name in the heading and the progress'],
      ['description', 'ReactNode', '—', 'WizardStep', 'A sentence under the heading'],
      ['optional', 'boolean', 'false', 'WizardStep', 'Marked Optional, and skippable'],
      ['disabled', 'boolean', 'false', 'WizardStep', 'Out of reach and stepped over'],
      [
        'validate',
        '(values, { value, signal }) => errors | void | Promise<…>',
        '—',
        'WizardStep',
        'Runs after the platform’s validation; errors by control name',
      ],
      [
        'values',
        'StepValues',
        'the form’s FormData',
        'WizardStep',
        'Typed answers to accept instead',
      ],
      ['start, end', 'ReactNode', 'the default actions', 'WizardActions', 'The two groups'],
      [
        'WizardNext, WizardPrevious, WizardCancel, WizardSaveDraft, WizardSkip',
        'ButtonProps',
        '—',
        'the actions',
        'Each a Button with its part; props, onClick and render compose',
      ],
      ['step', 'string', '—', 'WizardEdit', 'The step to change and come back from'],
      [
        'WizardDefaultsProvider',
        '{ progress, linear, level, scroll, delay, minDuration }',
        '—',
        'a subtree',
        'The decisions an application takes once; an instance that states any of them wins',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA pattern names a wizard; the WAI Multi-page Forms tutorial is the source. The progress is the Stepper, an ordered list whose current header carries aria-current="step" and whose headers say their status in a visually hidden run: “Account, Step 1 of 4, completed”.',
      'Every step change moves focus to the step’s heading, which starts with its position, so a reader hears “Step 2 of 4, Company” where they land; focus is not moved on the first render, and the heading draws no ring because it is a reading position rather than a control.',
      'Each step is a form of the Form family: Enter in a text field submits it by the platform’s implicit submission, the error summary takes focus on a refused step, and the Next button submits it from outside through the form attribute.',
      'A failed submission shows an Alert above the step and moves focus to it; an accepted one moves focus to the complete part. The draft status is a polite status that announces once.',
      'Back and a header behind the current step keep what was typed without validating it; a header ahead is reached only once the steps before it are complete, and a step out of reach stays in the tab order with aria-disabled.',
    ],
    snippets: [
      defineSnippet({
        id: 'wizard-react-dom',
        language: 'tsx',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="wizard" data-part="root" data-progress="start" data-scroll="ancestor">
  <div data-part="layout">
    <div data-part="progress">
      <button data-part="progress-toggle" aria-expanded="false">
        …
      </button>
      <div data-ui="stepper">…</div>
    </div>
    <div data-part="main">
      <div data-part="step">
        <div data-part="step-header">
          <h2 data-part="step-title" tabindex="-1">
            <span data-part="position">Step 2 of 4</span> Company
          </h2>
        </div>
        <form data-ui="form" id=":r1:-form">
          …
        </form>
      </div>
      <div data-part="actions">
        <div data-part="actions-start">…</div>
        <div data-part="actions-end">
          <button data-part="previous">Back</button>
          <button data-part="next" form=":r1:-form" type="submit">
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</div>;`,
      }),
      defineSnippet({
        id: 'wizard-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='wizard'] {
  --slotted-wizard-progress-inline-size: 16rem;
  --slotted-wizard-rhythm: var(--slotted-space-9);
}`,
      }),
    ],
  },
} as const;
