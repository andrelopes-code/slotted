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

export const ANGULAR_WIZARD_TOKENS = wizardTokens.map((name) => ({
  name,
  purpose: 'Theme-owned SlWizard decision',
}));

const imports: ReferenceImport = {
  source:
    "import { SlWizard, SlWizardStep, SlWizardForm, SlWizardComplete, SlWizardEdit, provideWizardDefaults } from '@slotted/angular/wizard';",
  selector:
    '[slWizard], ng-template[slWizardStep], form[slWizardForm], ng-template[slWizardComplete], ng-template[slWizardActions], button[slWizardEdit]',
  exportAs: 'slWizard',
};

const anatomy: AnatomyRow[] = [
  {
    part: 'root',
    element: 'the element slWizard is on',
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
      'The slStepper, beside the step or above it; data-open while the compact list is open. Absent under progress="none".',
  },
  {
    part: 'progress-toggle',
    element: 'button',
    required: false,
    purpose: 'Below 600 pixels of the wizard’s width: the position and one segment per step.',
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
    purpose: 'aria-hidden: one segment per step present.',
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
    element: 'div around an slAlert',
    required: false,
    purpose: 'The error input, or a failed submission, in the danger tone. Focus moves to it.',
  },
  {
    part: 'step',
    element: 'div',
    required: true,
    purpose: 'The current step’s header and template. aria-busy while a draft is restored.',
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
    purpose: 'By level; the focus target on every step change.',
  },
  {
    part: 'position',
    element: 'span',
    required: true,
    purpose: '“Step 2 of 5”, above the name; below 600 pixels only in the heading’s text.',
  },
  {
    part: 'optional',
    element: 'span around an slTag',
    required: false,
    purpose: 'messages.optional, on an optional step.',
  },
  {
    part: 'step-description',
    element: 'p',
    required: false,
    purpose: 'The step’s description input.',
  },
  {
    part: 'actions',
    element: 'div',
    required: true,
    purpose: 'The row under the step; an ng-template[slWizardActions] replaces its content.',
  },
  {
    part: 'actions-start',
    element: 'div (slWizardActionsStart)',
    required: true,
    purpose: 'Cancel, save draft and the draft status.',
  },
  {
    part: 'actions-end',
    element: 'div (slWizardActionsEnd)',
    required: true,
    purpose: 'Skip, back, and next or submit at the end edge.',
  },
  {
    part: 'cancel',
    element: 'button[slWizardCancel]',
    required: false,
    purpose: 'Emits cancelRequest with dirty. Shown under cancellable.',
  },
  {
    part: 'save-draft',
    element: 'button[slWizardSaveDraft]',
    required: false,
    purpose: 'Writes the draft. Shown with persistence or under draftable.',
  },
  {
    part: 'draft-status',
    element: '[slWizardDraftStatus] role="status"',
    required: false,
    purpose: '“Draft saved at 14:02”, announced once.',
  },
  {
    part: 'skip',
    element: 'button[slWizardSkip]',
    required: false,
    purpose: 'On an optional step: accepts it with no answers.',
  },
  {
    part: 'previous',
    element: 'button[slWizardPrevious]',
    required: false,
    purpose: 'The previous step, keeping what was typed. Absent on the first.',
  },
  {
    part: 'next',
    element: 'button[slWizardNext]',
    required: false,
    purpose: 'Submits the step’s form from outside it through the form attribute.',
  },
  {
    part: 'submit',
    element: 'button[slWizardNext]',
    required: false,
    purpose: 'The same button on the step whose acceptance submits the flow; data-final.',
  },
  {
    part: 'edit',
    element: 'button[slWizardEdit]',
    required: false,
    purpose:
      'On a review step: goes to a step and comes back; named “Change” and the step’s label.',
  },
  {
    part: 'complete',
    element: 'div',
    required: false,
    purpose: 'The slWizardComplete template after an accepted submission; takes focus.',
  },
  {
    part: 'skeleton',
    element: 'div',
    required: false,
    purpose:
      'While an asynchronous draft is restored: one field whose label and control are skeletons.',
  },
];

const scenes: ReferenceSceneMeta[] = [
  {
    id: 'playground',
    title: 'Opening a business account',
    note: 'Four steps with real fields. Next accepts a step only once its form is valid; the progress beside it marks what is done and closes what is not reached yet.',
    snippet: defineSnippet({
      id: 'wizard-angular-playground',
      language: 'angular',
      label: 'Each step a template, each form the consumer’s',
      source: `<div slWizard [submitWizard]="open">
  <ng-template slWizardStep="account" label="Account">
    <form slForm slWizardForm [formGroup]="account">
      <div slField>
        <label slFieldLabel>Work email</label>
        <div slTextField>
          <input slTextFieldInput formControlName="email" type="email" />
        </div>
      </div>
    </form>
  </ng-template>
  <ng-template slWizardComplete>…</ng-template>
</div>`,
    }),
  },
  {
    id: 'progress',
    title: 'Where the progress stands',
    note: 'progress="start" is a column beside the step, "top" a row above it, "none" leaves the position in the heading alone.',
    snippet: defineSnippet({
      id: 'wizard-angular-progress',
      language: 'angular',
      label: 'One input',
      source: `<div slWizard progress="top">…</div>`,
    }),
  },
  {
    id: 'validation',
    title: 'A step refused, by Reactive Forms and by the server',
    note: 'The email is required, and validate asks the server whether it is taken: Next waits, the answer lands in the form’s summary, and the step turns red in the progress.',
    snippet: defineSnippet({
      id: 'wizard-angular-validation',
      language: 'angular',
      label: 'validate runs after the group’s validators',
      source: `<ng-template slWizardStep="account" label="Account" [validate]="emailFree">
  <form slForm slWizardForm [formGroup]="account">…</form>
</ng-template>`,
    }),
  },
  {
    id: 'branching',
    title: 'Steps that depend on an answer',
    note: 'Choose Business and accept the step: a Company step appears after it. Choose Personal again and it leaves — its answers are kept and never submitted.',
    snippet: defineSnippet({
      id: 'wizard-angular-branching',
      language: 'angular',
      label: 'A branch is @if around a step',
      source: `<div slWizard [(value)]="value">
  <ng-template slWizardStep="account" label="Account">…</ng-template>
  @if (value()?.account?.type === 'business') {
    <ng-template slWizardStep="company" label="Company">…</ng-template>
  }
  <ng-template slWizardStep="billing" label="Billing">…</ng-template>
</div>`,
    }),
  },
  {
    id: 'optional',
    title: 'An optional step',
    note: 'The heading and the progress both say Optional; Skip accepts the step with no answers.',
    snippet: defineSnippet({
      id: 'wizard-angular-optional',
      language: 'angular',
      label: 'optional',
      source: `<ng-template slWizardStep="invite" label="Invite teammates" optional> … </ng-template>`,
    }),
  },
  {
    id: 'review',
    title: 'Review, change and come back',
    note: 'Change goes to the step and Next reads Save and return: accepting it comes back to the review.',
    snippet: defineSnippet({
      id: 'wizard-angular-review',
      language: 'angular',
      label: 'slWizardEdit on a review step',
      source: `<dd slDescriptionListAction>
  <button slWizardEdit="billing"></button>
</dd>`,
    }),
  },
  {
    id: 'submit',
    title: 'Submitting, failing and finishing',
    note: 'The first try is refused with the step and the field named: the wizard goes back to Account with the error above it. The second succeeds and the complete part takes focus.',
    snippet: defineSnippet({
      id: 'wizard-angular-submit',
      language: 'ts',
      label: 'A failure names the step',
      source: `const open: WizardSubmit = async (values) => {
  const answer = await api.openAccount(values);
  if (answer.error === 'email-taken') {
    return { step: 'account', errors: { email: 'Taken since you started' } };
  }
};`,
    }),
  },
  {
    id: 'drafts',
    title: 'Drafts, reload and a draft of another version',
    note: 'Save draft writes to sessionStorage and the status says when. Reload the page and the wizard opens where the draft left it; a slow store shows the step’s own skeleton meanwhile.',
    snippet: defineSnippet({
      id: 'wizard-angular-drafts',
      language: 'angular',
      label: 'A declared policy',
      source: `<div slWizard [persistence]="drafts" [version]="3" guardUnsaved>…</div>`,
    }),
  },
  {
    id: 'url',
    title: 'The step in the address',
    note: 'A router binds step two-way. A link to a step past the work done is clamped to the first incomplete one.',
    snippet: defineSnippet({
      id: 'wizard-angular-url',
      language: 'angular',
      label: 'Bound to the route',
      source: `<div slWizard [(step)]="step" (stepChangeRequest)="navigate($event.value)">…</div>`,
    }),
  },
  {
    id: 'narrow',
    title: 'On a phone',
    note: 'Below 600 pixels the progress folds behind a bar that says the position; the actions stack.',
    snippet: defineSnippet({
      id: 'wizard-angular-narrow',
      language: 'angular',
      label: 'The container decides',
      source: `<div slWizard [(progressOpen)]="open">…</div>`,
    }),
  },
  {
    id: 'dialog',
    title: 'Inside a layer',
    note: 'scroll="self" takes the height it is given: the step scrolls and the actions stay at the bottom.',
    snippet: defineSnippet({
      id: 'wizard-angular-dialog',
      language: 'angular',
      label: 'scroll="self"',
      source: `<div slWizard progress="none" scroll="self">…</div>`,
    }),
  },
  {
    id: 'content',
    title: 'Seven steps, in German',
    note: 'Long translated names wrap in the column and in the heading; the row of actions wraps before it squeezes a button.',
    snippet: defineSnippet({
      id: 'wizard-angular-content',
      language: 'angular',
      label: 'Labels are content',
      source: `<ng-template slWizardStep="zahlung" label="Zahlungsinformationen und Rechnungsanschrift">
  …
</ng-template>`,
    }),
  },
  {
    id: 'forms',
    title: 'Reactive Forms',
    note: 'The group lives in your component and keeps what was typed across steps; its raw value is the step’s answers, and a pending async validator holds Next.',
    snippet: defineSnippet({
      id: 'wizard-angular-forms',
      language: 'angular',
      label: 'The group is the answers',
      source: `<form slForm slWizardForm [formGroup]="billing">
  <input slTextFieldInput formControlName="city" />
</form>`,
    }),
  },
  {
    id: 'labels',
    title: 'Words for another product',
    note: 'Every word is a message; provideSlotted sets the language once, and a wizard lays its own words over it.',
    snippet: defineSnippet({
      id: 'wizard-angular-labels',
      language: 'ts',
      label: 'In Portuguese',
      source: `providers: [provideSlotted({ locale: 'pt-BR', catalogs: { 'pt-BR': PT_BR } })];`,
    }),
  },
  {
    id: 'accessibility',
    title: 'What a screen reader hears',
    note: 'Each step change moves focus to the heading, which says “Step 2 of 4, Company”; Enter in any text field submits the step.',
    snippet: defineSnippet({
      id: 'wizard-angular-accessibility',
      language: 'angular',
      label: 'The list is named',
      source: `<div slWizard [messages]="{ progress: 'Account opening' }">…</div>`,
    }),
  },
];

const events: EventRow[] = [
  {
    name: 'stepChangeRequest',
    payload: 'ChangeRequest<string> & { reason }',
    when: 'Before the step moves: an accepted step or Enter (submit), a header or Back (pointer, keyboard), a clamp or a restore (programmatic). cancel() refuses it; otherwise step is written.',
  },
  {
    name: 'valueChangeRequest',
    payload: 'ChangeRequest<WizardValue> & { reason }',
    when: 'Before the accepted answers move: a step accepted (submit), reset (clear), a restored draft (programmatic).',
  },
  {
    name: 'progressOpenChangeRequest',
    payload: 'ChangeRequest<boolean> & { reason }',
    when: 'Before the compact list opens or closes: its bar (pointer, keyboard), a step chosen (select), Escape (escape).',
  },
  {
    name: 'cancelRequest',
    payload: '{ dirty, source }',
    when: 'When cancel is pressed. The family closes nothing.',
  },
  {
    name: 'draftSave',
    payload: '{ snapshot, reason, source }',
    when: 'When a draft is written, before persistence keeps it.',
  },
  {
    name: 'completed',
    payload: 'WizardValue',
    when: 'After submitWizard accepted the submission.',
  },
];

export const ANGULAR_WIZARD_DOCS = {
  wizard: {
    imports,
    anatomy,
    scenes,
    events,
    api: apiRows([
      [
        'step',
        'model<string | undefined>',
        '—',
        'slWizard',
        'The current step’s name; [(step)] binds it',
      ],
      [
        'defaultStep',
        'string',
        'the first incomplete step',
        'slWizard',
        'Where an unbound wizard starts, read once and clamped',
      ],
      [
        'value',
        'model<WizardValue | undefined>',
        '—',
        'slWizard',
        'The accepted answers; [(value)] binds it',
      ],
      ['defaultValue', 'WizardValue', '{}', 'slWizard', 'The unbound answers, read once'],
      [
        'progressOpen',
        'model<boolean>',
        'false',
        'slWizard',
        'Whether the compact list is open; [(progressOpen)] binds it',
      ],
      [
        'defaultProgressOpen',
        'boolean',
        'false',
        'slWizard',
        'Whether an unbound list starts open, read once',
      ],
      [
        'progress',
        "'start' | 'top' | 'none'",
        'start',
        'slWizard, provideWizardDefaults',
        'Where the list of steps stands',
      ],
      [
        'scroll',
        "'ancestor' | 'self'",
        'ancestor',
        'slWizard, provideWizardDefaults',
        'self takes the height given and pins the actions',
      ],
      [
        'linear',
        'boolean',
        'true',
        'slWizard, provideWizardDefaults',
        'A step ahead is reached only once every step before it is complete',
      ],
      ['level', '2 | 3 | 4', '2', 'slWizard, provideWizardDefaults', 'The step heading’s level'],
      [
        'messages',
        'PartialMessages<WizardMessages>',
        '—',
        'slWizard',
        'Words laid over the language in force, key by key: position, progress (the name of the list of steps), previous, next, submit, return, cancel, saveDraft, saving, saved with {time}, draftFailed, skip, optional, edit, incomplete, submitFailed, restoring',
      ],
      ['error', 'string', '—', 'slWizard', 'An error of your own above the step'],
      ['disabled', 'boolean', 'false', 'slWizard', 'Every action refused'],
      [
        'submitWizard',
        '(values, request) => void | WizardFailure | Promise<…>',
        '—',
        'slWizard',
        'Called with the steps present once the last step is accepted',
      ],
      [
        'persistence',
        'WizardPersistence',
        '—',
        'slWizard',
        'load, save and clear; storagePersistence keeps drafts in Storage',
      ],
      ['version', 'string | number', '—', 'slWizard', 'A draft of another version is not restored'],
      [
        'autosave',
        "'none' | 'step'",
        'step with persistence',
        'slWizard',
        'step writes a draft after every accepted step',
      ],
      [
        'guardUnsaved',
        'boolean',
        'false',
        'slWizard',
        'A beforeunload guard while anything is unsubmitted',
      ],
      ['cancellable', 'boolean', 'false', 'slWizard', 'Shows the cancel action'],
      ['draftable', 'boolean', 'false', 'slWizard', 'Shows save draft without persistence'],
      [
        'delay',
        'number',
        '200',
        'slWizard, provideWizardDefaults',
        'How long a restore may take before its skeleton is drawn',
      ],
      [
        'minDuration',
        'number',
        '400',
        'slWizard, provideWizardDefaults',
        'How long a drawn skeleton stays',
      ],
      ['slWizardStep', 'string', '—', 'ng-template[slWizardStep]', 'The step’s name'],
      [
        'label',
        'string',
        '—',
        'ng-template[slWizardStep]',
        'The step’s name in the heading and the progress',
      ],
      ['description', 'string', '—', 'ng-template[slWizardStep]', 'A sentence under the heading'],
      [
        'optional',
        'boolean',
        'false',
        'ng-template[slWizardStep]',
        'Marked Optional, and skippable',
      ],
      [
        'disabled',
        'boolean',
        'false',
        'ng-template[slWizardStep]',
        'Out of reach and stepped over',
      ],
      [
        'validate',
        'WizardValidate',
        '—',
        'ng-template[slWizardStep]',
        'Runs after the group’s validators; errors by control name',
      ],
      [
        'values',
        'StepValues',
        'the group’s raw value',
        'ng-template[slWizardStep]',
        'Typed answers to accept instead',
      ],
      [
        'template context',
        '{ $implicit: values, values, name, complete, optional, errors }',
        '—',
        'ng-template[slWizardStep]',
        'errors is what a failed submission sent back, for the form’s [defaultErrors]',
      ],
      [
        'slWizardEdit',
        'string',
        '—',
        'button[slWizardEdit]',
        'The step to change and come back from',
      ],
      [
        'exportAs slWizard',
        'next, previous, goTo, edit, skip, saveDraft, clearDraft, reset, focus',
        '—',
        'slWizard',
        'The imperative moves, from a template reference',
      ],
    ]),
    accessibility: [
      'No WAI-ARIA pattern names a wizard; the WAI Multi-page Forms tutorial is the source. The progress is the slStepper, an ordered list whose current header carries aria-current="step" and whose headers say their status.',
      'Every step change moves focus to the step’s heading, which starts with its position, so a reader hears “Step 2 of 4, Company”; focus is not moved on the first render.',
      'Each step’s form is the consumer’s form[slForm]: Enter in a text field submits it, Reactive Forms marks every control touched on a refused step, and the error summary takes focus.',
      'A failed submission shows an slAlert above the step and moves focus to it; an accepted one moves focus to the complete part. The draft status is a polite status.',
      'Back and a header behind the current step keep what was typed; a header ahead is reached only once the steps before it are complete, and stays in the tab order with aria-disabled until then.',
    ],
    snippets: [
      defineSnippet({
        id: 'wizard-angular-dom',
        language: 'angular',
        label: 'Anatomy, as it reaches the DOM',
        source: `<div data-ui="wizard" data-part="root" data-progress="start" data-scroll="ancestor">
  <div data-part="layout">
    <div data-part="progress">
      <button data-part="progress-toggle" aria-expanded="false">…</button>
      <div data-ui="stepper">…</div>
    </div>
    <div data-part="main">
      <div data-part="step">
        <div data-part="step-header">
          <h2 data-part="step-title" tabindex="-1">
            <span data-part="position">Step 2 of 4</span> Company
          </h2>
        </div>
        <form data-ui="form" id="slotted-wizard-1-form">…</form>
      </div>
      <div data-part="actions">…</div>
    </div>
  </div>
</div>`,
      }),
      defineSnippet({
        id: 'wizard-theming',
        language: 'css',
        label: 'Retuning the family for an application',
        source: `[data-ui='wizard'] {
  --slotted-wizard-progress-inline-size: 16rem;
}`,
      }),
    ],
  },
} as const;
