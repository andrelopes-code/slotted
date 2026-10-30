import { Component, computed, input, model, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SlButton } from '@slotted/angular/button';
import { provideSlotted } from '@slotted/angular/i18n';
import { SlCheckbox } from '@slotted/angular/checkbox';
import {
  SlDescriptionList,
  SlDescriptionListAction,
  SlDescriptionListDescription,
  SlDescriptionListItem,
  SlDescriptionListTerm,
} from '@slotted/angular/description-list';
import { SlField, SlFieldLabel } from '@slotted/angular/field';
import { SlForm } from '@slotted/angular/form';
import { SlRadio, SlRadioGroup } from '@slotted/angular/radio-group';
import {
  SlResultState,
  SlResultStateContent,
  SlResultStateDescription,
  SlResultStateTitle,
} from '@slotted/angular/result-state';
import { SlStack } from '@slotted/angular/stack';
import { SlTextField, SlTextFieldInput } from '@slotted/angular/text-field';
import { SlText } from '@slotted/angular/typography';
import type { PartialMessages, WizardMessages } from '@slotted/core/i18n';
import { createSnapshot, storagePersistence } from '@slotted/core/wizard';
import type { WizardPersistence, WizardValue } from '@slotted/core/wizard';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';

import { SlWizard, SlWizardComplete, SlWizardEdit, SlWizardForm, SlWizardStep } from './wizard';
import type {
  WizardFailure,
  WizardProgress,
  WizardScroll,
  WizardSubmit,
  WizardValidate,
} from './wizard-defaults';
import { ANGULAR_WIZARD_DOCS, ANGULAR_WIZARD_TOKENS } from './wizard.docs';

/* ── Opening a business account, one domain for the whole page ─────────── */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const FILLED: WizardValue = {
  account: { email: 'ana.ribeiro@acme.example', name: 'Ana Ribeiro' },
  billing: { city: 'Porto', street: 'Rua de Santa Catarina, 312' },
  company: { company: 'Acme Logistics, Lda.', taxId: 'PT 509 876 543' },
};

function text(value: WizardValue | undefined, step: string, name: string) {
  const answer = value?.[step]?.[name];
  return typeof answer === 'string' && answer !== '' ? answer : 'Not provided';
}

/**
 * The flow every scene draws. Each step's form is plain and starts from the
 * answer the wizard holds, which is what restores a draft into it; the forms
 * scene shows the same flow over Reactive Forms.
 */
@Component({
  selector: 'sl-wizard-opening-demo',
  standalone: true,
  imports: [
    SlDescriptionList,
    SlDescriptionListAction,
    SlDescriptionListDescription,
    SlDescriptionListItem,
    SlDescriptionListTerm,
    SlField,
    SlFieldLabel,
    SlForm,
    SlResultState,
    SlResultStateContent,
    SlResultStateDescription,
    SlResultStateTitle,
    SlStack,
    SlTextField,
    SlTextFieldInput,
    SlWizard,
    SlWizardComplete,
    SlWizardEdit,
    SlWizardForm,
    SlWizardStep,
  ],
  template: `
    <div
      slWizard
      cancellable
      [messages]="words()"
      [(step)]="step"
      [(value)]="value"
      [defaultStep]="startStep()"
      [progress]="progress()"
      [scroll]="scroll()"
      [persistence]="persistence()"
      [version]="3"
      [guardUnsaved]="guard()"
      [submitWizard]="submit"
    >
      <ng-template
        slWizardStep="account"
        label="Account"
        description="The person who signs for the company."
        [validate]="validate()"
        let-values
        let-errors="errors"
      >
        <form slForm slWizardForm [defaultErrors]="errors">
          <div slStack [gap]="6">
            <div slField>
              <label slFieldLabel>Full name</label>
              <div slTextField>
                <input slTextFieldInput name="name" required [value]="read(values, 'name')" />
              </div>
            </div>
            <div slField>
              <label slFieldLabel>Work email</label>
              <div slTextField>
                <input
                  slTextFieldInput
                  name="email"
                  type="email"
                  required
                  [value]="read(values, 'email')"
                />
              </div>
            </div>
          </div>
        </form>
      </ng-template>
      @if (company()) {
        <ng-template slWizardStep="company" label="Company" let-values>
          <form slForm slWizardForm>
            <div slStack [gap]="6">
              <div slField>
                <label slFieldLabel>Registered name</label>
                <div slTextField>
                  <input
                    slTextFieldInput
                    name="company"
                    required
                    [value]="read(values, 'company')"
                  />
                </div>
              </div>
              <div slField>
                <label slFieldLabel>Tax number</label>
                <div slTextField>
                  <input slTextFieldInput name="taxId" required [value]="read(values, 'taxId')" />
                </div>
              </div>
            </div>
          </form>
        </ng-template>
      }
      <ng-template slWizardStep="billing" label="Billing" let-values>
        <form slForm slWizardForm>
          <div slStack [gap]="6">
            <div slField>
              <label slFieldLabel>Street and number</label>
              <div slTextField>
                <input slTextFieldInput name="street" required [value]="read(values, 'street')" />
              </div>
            </div>
            <div slField>
              <label slFieldLabel>City</label>
              <div slTextField>
                <input slTextFieldInput name="city" required [value]="read(values, 'city')" />
              </div>
            </div>
          </div>
        </form>
      </ng-template>
      @if (invite()) {
        <ng-template
          slWizardStep="invite"
          label="Invite teammates"
          description="They receive an invitation once the account is open."
          optional
          let-values
        >
          <form slForm slWizardForm>
            <div slField>
              <label slFieldLabel>Emails, separated by commas</label>
              <div slTextField>
                <input slTextFieldInput name="emails" [value]="read(values, 'emails')" />
              </div>
            </div>
          </form>
        </ng-template>
      }
      <ng-template
        slWizardStep="review"
        label="Review"
        description="Check the answers before the account is opened."
      >
        <div slDescriptionList>
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Work email</dt>
            <dd slDescriptionListDescription>{{ answer('account', 'email') }}</dd>
            <dd slDescriptionListAction><button slWizardEdit="account"></button></dd>
          </div>
          @if (company()) {
            <div slDescriptionListItem>
              <dt slDescriptionListTerm>Registered name</dt>
              <dd slDescriptionListDescription>{{ answer('company', 'company') }}</dd>
              <dd slDescriptionListAction><button slWizardEdit="company"></button></dd>
            </div>
          }
          <div slDescriptionListItem>
            <dt slDescriptionListTerm>Billing address</dt>
            <dd slDescriptionListDescription>
              {{ answer('billing', 'street') }} · {{ answer('billing', 'city') }}
            </dd>
            <dd slDescriptionListAction><button slWizardEdit="billing"></button></dd>
          </div>
        </div>
      </ng-template>
      <ng-template slWizardComplete>
        <div slResultState status="success">
          <div slResultStateContent>
            <div slResultStateTitle>Your account is open</div>
            <p slResultStateDescription>
              The opening documents are on their way to your work email.
            </p>
          </div>
        </div>
      </ng-template>
    </div>
  `,
})
class OpeningDemo implements OnInit {
  readonly company = input(true);
  readonly invite = input(false);
  readonly progress = input<WizardProgress | undefined>(undefined);
  readonly scroll = input<WizardScroll | undefined>(undefined);
  readonly persistence = input<WizardPersistence | undefined>(undefined);
  readonly guard = input(false);
  readonly validate = input<WizardValidate | undefined>(undefined);
  readonly startStep = input<string | undefined>(undefined);
  readonly startValue = input<WizardValue | undefined>(undefined);
  readonly refuseOnce = input(false);
  /** Words a scene lays over the language in force; the list of steps is named after the flow. */
  readonly messages = input<PartialMessages<WizardMessages>>({});
  protected readonly words = computed(() => ({ progress: 'Account opening', ...this.messages() }));

  /** Two-way, so a scene can stand for the router that owns it. */
  readonly step = model<string | undefined>(undefined);
  protected readonly value = signal<WizardValue | undefined>(undefined);
  private tries = 0;

  ngOnInit() {
    this.value.set(this.startValue());
  }

  /** One answer as text, for an input's value. */
  protected read(values: Readonly<Record<string, unknown>>, name: string): string {
    const answer = values[name];
    return typeof answer === 'string' ? answer : '';
  }

  protected answer(step: string, name: string) {
    return text(this.value(), step, name);
  }

  protected readonly submit: WizardSubmit = async (): Promise<WizardFailure | undefined> => {
    await wait(900);
    this.tries += 1;
    if (this.refuseOnce() && this.tries === 1) {
      return {
        errors: { email: 'This email was registered while you were filling the form' },
        message: 'The bank refused the work email.',
        step: 'account',
      };
    }
    return undefined;
  };
}

/** Business or personal: a branch on the accepted answer, and one on the live form. */
@Component({
  selector: 'sl-wizard-branch-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlCheckbox,
    SlField,
    SlFieldLabel,
    SlForm,
    SlRadio,
    SlRadioGroup,
    SlStack,
    SlTextField,
    SlTextFieldInput,
    SlWizard,
    SlWizardForm,
    SlWizardStep,
  ],
  template: `
    <div slWizard [messages]="{ progress: 'Account opening' }" [(value)]="value">
      <ng-template slWizardStep="account" label="Account">
        <form slForm slWizardForm [formGroup]="account">
          <div slStack [gap]="6">
            @if (live()) {
              <label slCheckbox formControlName="business">This account is for a company</label>
            } @else {
              <div slRadioGroup aria-label="Account type" formControlName="type">
                <label slRadio value="personal">Personal</label>
                <label slRadio value="business">Business</label>
              </div>
            }
          </div>
        </form>
      </ng-template>
      @if (business()) {
        <ng-template slWizardStep="company" label="Company">
          <form slForm slWizardForm>
            <div slField>
              <label slFieldLabel>Registered name</label>
              <div slTextField><input slTextFieldInput name="company" required /></div>
            </div>
          </form>
        </ng-template>
      }
      <ng-template slWizardStep="billing" label="Billing">
        <form slForm slWizardForm>
          <div slField>
            <label slFieldLabel>City</label>
            <div slTextField><input slTextFieldInput name="city" required /></div>
          </div>
        </form>
      </ng-template>
    </div>
  `,
})
class BranchDemo {
  readonly live = input(false);
  protected readonly value = signal<WizardValue | undefined>(undefined);
  readonly account = new FormGroup({
    business: new FormControl(false, { nonNullable: true }),
    type: new FormControl('personal', { nonNullable: true }),
  });
  private readonly typed = toSignal(this.account.valueChanges, {
    initialValue: this.account.getRawValue(),
  });
  protected readonly business = computed(() =>
    this.live()
      ? this.typed().business === true
      : this.value()?.['account']?.['type'] === 'business',
  );
}

/** Reactive Forms, with an async validator the wizard waits for. */
@Component({
  selector: 'sl-wizard-reactive-demo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlField,
    SlFieldLabel,
    SlForm,
    SlStack,
    SlText,
    SlTextField,
    SlTextFieldInput,
    SlWizard,
    SlWizardForm,
    SlWizardStep,
  ],
  template: `
    <div slStack [gap]="4">
      <div slWizard [messages]="{ progress: 'Account opening' }" progress="top" [(value)]="value">
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
        <ng-template slWizardStep="billing" label="Billing">
          <form slForm slWizardForm [formGroup]="billing">
            <div slField>
              <label slFieldLabel>City</label>
              <div slTextField><input slTextFieldInput formControlName="city" /></div>
            </div>
          </form>
        </ng-template>
      </div>
      <p slText size="sm" tone="muted">value: {{ json() }}</p>
    </div>
  `,
})
class ReactiveDemo {
  protected readonly value = signal<WizardValue | undefined>(undefined);
  readonly account = new FormGroup({
    email: new FormControl('', {
      asyncValidators: [
        async (control) => {
          await wait(700);
          return control.value === 'taken@acme.example' ? { taken: true } : null;
        },
      ],
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  readonly billing = new FormGroup({
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected json() {
    return JSON.stringify(this.value() ?? {});
  }
}

/** A draft kept by a server that answers after 1.2 seconds. */
function slowPersistence(key: string): WizardPersistence {
  const store = storagePersistence({ key, storage: 'session', version: 3 });
  return {
    clear: () => store.clear(),
    load: async () => {
      await wait(1200);
      return (
        store.load() ??
        createSnapshot({
          drafts: {},
          step: 'billing',
          value: { account: FILLED['account']!, company: FILLED['company']! },
          version: 3,
        })
      );
    },
    save: (snapshot) => store.save(snapshot),
  };
}

@Component({
  selector: 'sl-wizard-reload-demo',
  standalone: true,
  imports: [OpeningDemo, SlButton, SlStack],
  template: `
    <div slStack [gap]="4">
      <div slStack align="start">
        <button slButton size="sm" variant="outline" type="button" (click)="reload()">
          Reload the wizard
        </button>
      </div>
      @for (key of [mount()]; track key) {
        <sl-wizard-opening-demo [persistence]="persistence" />
      }
    </div>
  `,
})
class ReloadDemo {
  protected readonly mount = signal(0);
  protected readonly persistence = slowPersistence('wizard-story-remote-ng');
  protected reload() {
    this.mount.update((count) => count + 1);
  }
}

@Component({
  selector: 'sl-wizard-routed-demo',
  standalone: true,
  imports: [SlButton, SlStack, SlText, OpeningDemo, SlWizard],
  template: `
    <div slStack [gap]="4">
      <p slText size="sm" tone="muted">Address: /open/{{ step() ?? 'account' }}</p>
      <div slStack align="start">
        <button slButton size="sm" variant="outline" type="button" (click)="step.set('review')">
          Follow a link to /open/review
        </button>
      </div>
      <sl-wizard-opening-demo [(step)]="step" />
    </div>
  `,
})
class RoutedDemo {
  protected readonly step = signal<string | undefined>('account');
}

@Component({
  selector: 'sl-wizard-german-demo',
  standalone: true,
  imports: [
    SlField,
    SlFieldLabel,
    SlForm,
    SlTextField,
    SlTextFieldInput,
    SlWizard,
    SlWizardForm,
    SlWizardStep,
  ],
  template: `
    <div slWizard draftable defaultStep="zahlung" [defaultValue]="start" [messages]="german">
      @for (step of steps; track step[0]) {
        <ng-template [slWizardStep]="step[0]" [label]="step[1]">
          <form slForm slWizardForm>
            <div slField>
              <label slFieldLabel>IBAN</label>
              <div slTextField><input slTextFieldInput name="iban" /></div>
            </div>
          </form>
        </ng-template>
      }
    </div>
  `,
})
class GermanDemo {
  protected readonly start: WizardValue = { konto: {}, lieferung: {}, person: {} };
  protected readonly german: PartialMessages<WizardMessages> = {
    next: 'Weiter',
    position: 'Schritt {index} von {count}',
    previous: 'Zurück',
    progress: 'Fortschritt',
    saveDraft: 'Entwurf speichern',
    submit: 'Absenden',
  };
  protected readonly steps = [
    ['konto', 'Kontodaten'],
    ['person', 'Persönliche Angaben'],
    ['lieferung', 'Lieferanschrift'],
    ['zahlung', 'Zahlungsinformationen und Rechnungsanschrift'],
    ['geschenk', 'Geschenkoptionen'],
    ['datenschutz', 'Datenschutzeinwilligung'],
    ['pruefung', 'Überprüfung'],
  ] as const;
}

@Component({
  selector: 'sl-wizard-provided-demo',
  standalone: true,
  imports: [OpeningDemo],
  providers: [provideSlotted({ locale: 'pt-BR' })],
  template: `<sl-wizard-opening-demo
    startStep="company"
    [startValue]="start"
    [messages]="words"
  />`,
})
class ProvidedDemo {
  protected readonly start: WizardValue = { account: FILLED['account']! };
  protected readonly words: PartialMessages<WizardMessages> = {
    // language: pt-BR
    next: 'Continuar',
    progress: 'Abertura de conta',
    submit: 'Abrir conta',
    // language: en-US
  };
}

/* ── Template helpers ───────────────────────────────────────────────────── */

function scene(label: string, note: string, body: string) {
  return `<section class="slotted-demo-scene">
    <header class="slotted-demo-scene__header">
      <span class="slotted-demo-scene__label">${label}</span>
      <span class="slotted-demo-scene__note">${note}</span>
    </header>
    <div class="slotted-demo-stage" data-layout="block">${body}</div>
  </section>`;
}

function grid(scenes: string) {
  return `<div class="slotted-demo-grid" data-columns="1">${scenes}</div>`;
}

/**
 * A room of a stated width, with the inset a page gives its content. The inset
 * is also what keeps a field's focus ring clear of the room's own edge, which
 * scrolls and so clips.
 */
const room = (body: string, size = 'laptop') =>
  `<div class="slotted-demo-room" data-room="${size}"><div class="slotted-demo-viewport" data-size="content">${body}</div></div>`;

const one = (label: string, note: string, body: string, props: Record<string, unknown> = {}) => ({
  props,
  template: grid(scene(label, note, body)),
});

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(ANGULAR_WIZARD_DOCS.wizard.scenes, {
    playground: Playground,
    progress: Progress,
    validation: Validation,
    branching: Branching,
    optional: Optional,
    review: Review,
    submit: Submit,
    drafts: Drafts,
    url: Url,
    narrow: Narrow,
    dialog: InsideALayer,
    content: Content,
    forms: Forms,
    labels: Labels,
    accessibility: Accessibility,
  });

const meta: Meta = {
  title: 'Components/Wizard',
  decorators: [
    moduleMetadata({
      imports: [
        OpeningDemo,
        BranchDemo,
        ReactiveDemo,
        ReloadDemo,
        RoutedDemo,
        GermanDemo,
        ProvidedDemo,
      ],
    }),
  ],
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Wizard',
        description:
          'A flow of steps that accumulates answers: each step a form validated on its own, the progress beside it, back, next and submit, a draft that survives a reload, and a review that changes an answer and comes back. The steps are the templates you write, so a branch is @if around one.',
        framework: 'Angular',
        ...ANGULAR_WIZARD_DOCS.wizard,
        tokens: ANGULAR_WIZARD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () =>
    one(
      'Opening a business account',
      'Fill Account and press Next, or press Enter in a field. A step ahead opens only once the steps before it are done.',
      room('<sl-wizard-opening-demo />'),
    ),
};

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => ({
    props: { start: { account: FILLED['account'] } },
    template: grid(
      scene(
        'progress="start"',
        'A column beside the step, which stays in view while a long step scrolls.',
        room(
          '<sl-wizard-opening-demo progress="start" startStep="company" [startValue]="start" />',
        ),
      ) +
        scene(
          'progress="top"',
          'A row above the step, closed by a rule, for a flow of three or four short names.',
          room(
            '<sl-wizard-opening-demo progress="top" startStep="company" [startValue]="start" />',
          ),
        ) +
        scene(
          'progress="none"',
          'No list: the position stays in the heading, for two steps or a layer.',
          room(
            '<sl-wizard-opening-demo progress="none" startStep="company" [startValue]="start" />',
          ),
        ),
    ),
  }),
};

const emailFree: WizardValidate = async (values, { signal }) => {
  await wait(900);
  if (signal.aborted) return undefined;
  return values['email'] === 'taken@acme.example'
    ? { email: 'This email already has an account' }
    : undefined;
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () =>
    one(
      'Required fields, then the server',
      'Press Next with the fields empty, then try taken@acme.example: validate waits 900 ms, and the answer lands in the summary.',
      room('<sl-wizard-opening-demo progress="top" [company]="false" [validate]="emailFree" />'),
      { emailFree },
    ),
};

export const Branching: Story = {
  parameters: scenario('branching'),
  render: () => ({
    template: grid(
      scene(
        'A branch on the accepted answer',
        'Choose Business and press Next: Company appears after Account. Go back, choose Personal and accept again: it leaves.',
        room('<sl-wizard-branch-demo />'),
      ) +
        scene(
          'A branch on what is being typed',
          'The group’s live value drives the condition, so Company appears the moment the box is ticked.',
          room('<sl-wizard-branch-demo [live]="true" />'),
        ),
    ),
  }),
};

export const Optional: Story = {
  parameters: scenario('optional'),
  render: () =>
    one(
      'Invite teammates, or skip',
      'Skip accepts the step with no answers; Back returns to it with nothing lost.',
      room('<sl-wizard-opening-demo [invite]="true" startStep="invite" [startValue]="filled" />'),
      { filled: FILLED },
    ),
};

export const Review: Story = {
  parameters: scenario('review'),
  render: () =>
    one(
      'Change an answer and come back',
      'Press Change beside the billing address: Next reads Save and return, and accepting the step comes straight back here.',
      room('<sl-wizard-opening-demo startStep="review" [startValue]="filled" />'),
      { filled: FILLED },
    ),
};

export const Submit: Story = {
  parameters: scenario('submit'),
  render: () =>
    one(
      'Refused once, accepted the second time',
      'Submit: the first answer names the Account step and its email, so the wizard goes back there with the error above. Submit again from the review.',
      room(
        '<sl-wizard-opening-demo startStep="review" [startValue]="filled" [refuseOnce]="true" />',
      ),
      { filled: FILLED },
    ),
};

export const Drafts: Story = {
  parameters: scenario('drafts'),
  render: () => ({
    props: {
      persistence: storagePersistence({ key: 'wizard-story-ng', storage: 'session', version: 3 }),
    },
    template: grid(
      scene(
        'Saved to this tab, restored on reload',
        'Type in Account and press Save draft; the status says when. Reload the page: the wizard opens where the draft left it.',
        room('<sl-wizard-opening-demo [persistence]="persistence" [guard]="true" />'),
      ) +
        scene(
          'A draft kept by a server',
          'load answers after 1.2 s: the step keeps its header and one field as skeletons, and the restored step replaces them without moving.',
          room('<sl-wizard-reload-demo />'),
        ),
    ),
  }),
};

export const Url: Story = {
  parameters: scenario('url'),
  render: () =>
    one(
      'A link past the work done',
      'The address owns the step. Following /open/review before Account is done lands on Account.',
      room('<sl-wizard-routed-demo />'),
    ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () =>
    one(
      '375 pixels',
      'Open the bar to see every step; choosing one closes it, and Escape returns to the bar.',
      room('<sl-wizard-opening-demo startStep="billing" [startValue]="partial" />', 'phone'),
      { partial: { account: FILLED['account'], company: FILLED['company'] } },
    ),
};

export const InsideALayer: Story = {
  name: 'Dialog',
  parameters: scenario('dialog'),
  render: () =>
    one(
      'A layer of fixed height',
      'The step scrolls under a pinned row of actions; the frame stands for a dialog or a drawer body.',
      `<div class="slotted-demo-viewport" data-fill="" data-frame="window" data-size="tall">
        <sl-wizard-opening-demo progress="none" scroll="self" startStep="company" [startValue]="start" />
      </div>`,
      { start: { account: FILLED['account'] } },
    ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () =>
    one(
      'Sieben Schritte',
      'The fourth step’s name takes two lines in the column and in the heading; the row of actions wraps before it squeezes a button.',
      room('<sl-wizard-german-demo />'),
    ),
};

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () =>
    one(
      'Reactive Forms',
      'The groups live in the component and keep what was typed across steps. Try taken@acme.example: the async validator holds Next until it answers.',
      room('<sl-wizard-reactive-demo />'),
    ),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () =>
    one(
      'Account opening, in Portuguese',
      // language: pt-BR
      'The language in force says Etapa 2 de 4, Voltar and Cancelar; the wizard’s messages say Continuar and Abrir conta.',
      // language: en-US
      room('<sl-wizard-provided-demo />'),
    ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () =>
    one(
      'Focus follows the step',
      'Tab to Next and press Enter: focus lands on the heading, which says Step 2 of 4, Company.',
      room('<sl-wizard-opening-demo />'),
    ),
};
