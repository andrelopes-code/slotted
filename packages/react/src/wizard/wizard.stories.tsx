import { createSnapshot, storagePersistence } from '@slotted/core/wizard';
import type { WizardPersistence } from '@slotted/core/wizard';
import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '../button';
import { Checkbox } from '../checkbox';
import {
  DescriptionList,
  DescriptionListAction,
  DescriptionListDescription,
  DescriptionListItem,
  DescriptionListTerm,
} from '../description-list';
import { Field, FieldDescription, FieldLabel } from '../field';
import { Grid, Scene } from '../field/field-demo';
import { SlottedProvider } from '../i18n';
import { Radio, RadioGroup } from '../radio-group';
import {
  ResultState,
  ResultStateContent,
  ResultStateDescription,
  ResultStateTitle,
} from '../result-state';
import { Stack } from '../stack';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { Wizard } from './wizard';
import { useWizard, useWizardStep } from './wizard-context';
import { WizardComplete, WizardEdit, WizardStep } from './wizard-parts';
import { REACT_WIZARD_DOCS, REACT_WIZARD_TOKENS } from './wizard.docs';
import type { WizardFailure, WizardProgress, WizardProps, WizardValue } from './wizard.types';

/* ── Opening a business account, one domain for the whole page ─────────── */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A text field that starts from the answer the wizard holds for it. */
function Answer({
  description,
  label,
  name,
  required = false,
  type,
}: {
  description?: string;
  label: string;
  name: string;
  required?: boolean;
  type?: 'email' | 'text' | 'tel';
}) {
  const step = useWizardStep();
  const shown = step?.values[name];
  return (
    <Field required={required}>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        defaultValue={typeof shown === 'string' ? shown : ''}
        name={name}
        required={required}
        {...(type === undefined ? {} : { type })}
      />
      {description === undefined ? null : <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}

function AccountFields() {
  return (
    <Stack gap={6}>
      <Answer label="Full name" name="name" required />
      <Answer
        description="We send the opening documents here."
        label="Work email"
        name="email"
        required
        type="email"
      />
    </Stack>
  );
}

function CompanyFields() {
  return (
    <Stack gap={6}>
      <Answer label="Registered name" name="company" required />
      <Answer label="Tax number" name="taxId" required />
    </Stack>
  );
}

function BillingFields() {
  return (
    <Stack gap={6}>
      <Answer label="Street and number" name="street" required />
      <Answer label="City" name="city" required />
    </Stack>
  );
}

function text(value: WizardValue, step: string, name: string) {
  const answer = value[step]?.[name];
  return typeof answer === 'string' && answer !== '' ? answer : 'Not provided';
}

/** The review: the consumer's description list, with the family's edit control. */
function Review() {
  const wizard = useWizard();
  const value = wizard.value;
  const rows = [
    ['account', 'Work email', text(value, 'account', 'email')],
    ...(wizard.steps.some((step) => step.name === 'company')
      ? [['company', 'Registered name', text(value, 'company', 'company')]]
      : []),
    [
      'billing',
      'Billing address',
      `${text(value, 'billing', 'street')} · ${text(value, 'billing', 'city')}`,
    ],
    ...(wizard.steps.some((step) => step.name === 'invite')
      ? [['invite', 'Teammates', text(value, 'invite', 'emails')]]
      : []),
  ] as const;
  return (
    <DescriptionList>
      {rows.map(([step, term, answer]) => (
        <DescriptionListItem key={step}>
          <DescriptionListTerm>{term}</DescriptionListTerm>
          <DescriptionListDescription>{answer}</DescriptionListDescription>
          <DescriptionListAction>
            <WizardEdit step={step} />
          </DescriptionListAction>
        </DescriptionListItem>
      ))}
    </DescriptionList>
  );
}

function Done() {
  return (
    <WizardComplete>
      <ResultState status="success">
        <ResultStateContent>
          <ResultStateTitle>Your account is open</ResultStateTitle>
          <ResultStateDescription>
            The opening documents are on their way to your work email.
          </ResultStateDescription>
        </ResultStateContent>
      </ResultState>
    </WizardComplete>
  );
}

/** The flow every scene draws, with the parts a scene switches on. */
function Opening({
  company = true,
  invite = false,
  onSubmit = async () => {
    await wait(900);
  },
  ...props
}: Partial<WizardProps> & { company?: boolean; invite?: boolean }) {
  return (
    <Wizard
      onCancel={() => undefined}
      onSubmit={onSubmit}
      {...props}
      messages={{ progress: 'Account opening', ...props.messages }}
    >
      <WizardStep
        description="The person who signs for the company."
        label="Account"
        name="account"
      >
        <AccountFields />
      </WizardStep>
      {company ? (
        <WizardStep label="Company" name="company">
          <CompanyFields />
        </WizardStep>
      ) : null}
      <WizardStep label="Billing" name="billing">
        <BillingFields />
      </WizardStep>
      {invite ? (
        <WizardStep
          description="They receive an invitation once the account is open."
          label="Invite teammates"
          name="invite"
          optional
        >
          <Answer label="Emails, separated by commas" name="emails" />
        </WizardStep>
      ) : null}
      <WizardStep
        description="Check the answers before the account is opened."
        label="Review"
        name="review"
      >
        <Review />
      </WizardStep>
      <Done />
    </Wizard>
  );
}

const FILLED: WizardValue = {
  account: { email: 'ana.ribeiro@acme.example', name: 'Ana Ribeiro' },
  billing: { city: 'Porto', street: 'Rua de Santa Catarina, 312' },
  company: { company: 'Acme Logistics, Lda.', taxId: 'PT 509 876 543' },
};

/**
 * A room of a stated width, with the inset a page gives its content. The inset
 * is also what keeps a field's focus ring clear of the room's own edge, which
 * scrolls and so clips.
 */
function Room({
  children,
  room = 'laptop',
}: {
  children: ReactNode;
  room?: 'desktop' | 'laptop' | 'tablet' | 'phone';
}) {
  return (
    <div className="slotted-demo-room" data-room={room}>
      <div className="slotted-demo-viewport" data-size="content">
        {children}
      </div>
    </div>
  );
}

function One({ label, note, children }: { label: string; note: ReactNode; children: ReactNode }) {
  return (
    <Grid columns={1}>
      <Scene label={label} note={note}>
        {children}
      </Scene>
    </Grid>
  );
}

/* ── The page ──────────────────────────────────────────────────────────── */

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_WIZARD_DOCS.wizard.scenes, {
    playground: Playground,
    progress: Progress,
    validation: Validation,
    branching: Branching,
    optional: Optional,
    review: ReviewStory,
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

const meta = {
  title: 'Components/Wizard',
  component: Wizard,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Wizard',
        description:
          'A flow of steps that accumulates answers: each step a form validated on its own, the progress beside it, back, next and submit, a draft that survives a reload, and a review that changes an answer and comes back. The steps are the ones you render, so a branch is a condition in JSX.',
        framework: 'React',
        ...REACT_WIZARD_DOCS.wizard,
        tokens: REACT_WIZARD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Wizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: scenario('playground'),
  render: () => (
    <One
      label="Opening a business account"
      note="Fill Account and press Next, or press Enter in a field. A step ahead opens only once the steps before it are done."
    >
      <Room>
        <Opening />
      </Room>
    </One>
  ),
};

const PROGRESS: readonly WizardProgress[] = ['start', 'top', 'none'];

export const Progress: Story = {
  parameters: scenario('progress'),
  render: () => (
    <Grid columns={1}>
      {PROGRESS.map((progress) => (
        <Scene
          key={progress}
          label={`progress="${progress}"`}
          note={
            progress === 'start'
              ? 'A column beside the step, which stays in view while a long step scrolls.'
              : progress === 'top'
                ? 'A row above the step, closed by a rule, for a flow of three or four short names.'
                : 'No list: the position stays in the heading, for two steps or a layer.'
          }
        >
          <Room>
            <Opening
              defaultStep="company"
              defaultValue={{ account: FILLED['account']! }}
              progress={progress}
            />
          </Room>
        </Scene>
      ))}
    </Grid>
  ),
};

export const Validation: Story = {
  parameters: scenario('validation'),
  render: () => (
    <One
      label="Required fields, then the server"
      note="Press Next with the fields empty, then try taken@acme.example: validate waits 900 ms, and the answer lands in the summary and beside the field."
    >
      <Room>
        <Wizard messages={{ progress: 'Account opening' }} progress="top">
          <WizardStep
            label="Account"
            name="account"
            validate={async (values, { signal }) => {
              await wait(900);
              if (signal.aborted) return undefined;
              return values['email'] === 'taken@acme.example'
                ? { email: 'This email already has an account' }
                : undefined;
            }}
          >
            <AccountFields />
          </WizardStep>
          <WizardStep label="Billing" name="billing">
            <BillingFields />
          </WizardStep>
        </Wizard>
      </Room>
    </One>
  ),
};

/** Business or personal, decided by the accepted answer. */
function AccountType() {
  const step = useWizardStep();
  const shown = step?.values['type'];
  return (
    <Stack gap={6}>
      <Answer label="Full name" name="name" required />
      <RadioGroup
        aria-label="Account type"
        defaultValue={typeof shown === 'string' ? shown : 'personal'}
        name="type"
      >
        <Radio value="personal">Personal</Radio>
        <Radio value="business">Business</Radio>
      </RadioGroup>
    </Stack>
  );
}

function AcceptedBranch() {
  const [value, setValue] = useState<WizardValue>({});
  const business = value['account']?.['type'] === 'business';
  return (
    <Wizard messages={{ progress: 'Account opening' }} onValueChange={setValue} value={value}>
      <WizardStep label="Account" name="account">
        <AccountType />
      </WizardStep>
      {business ? (
        <WizardStep label="Company" name="company">
          <CompanyFields />
        </WizardStep>
      ) : null}
      <WizardStep label="Billing" name="billing">
        <BillingFields />
      </WizardStep>
    </Wizard>
  );
}

function LiveBranch() {
  const [business, setBusiness] = useState(false);
  return (
    <Wizard messages={{ progress: 'Account opening' }}>
      <WizardStep label="Account" name="account">
        <Stack gap={6}>
          <Answer label="Full name" name="name" required />
          <Checkbox checked={business} name="business" onCheckedChange={setBusiness}>
            This account is for a company
          </Checkbox>
        </Stack>
      </WizardStep>
      {business ? (
        <WizardStep label="Company" name="company">
          <CompanyFields />
        </WizardStep>
      ) : null}
      <WizardStep label="Billing" name="billing">
        <BillingFields />
      </WizardStep>
    </Wizard>
  );
}

export const Branching: Story = {
  parameters: scenario('branching'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="A branch on the accepted answer"
        note="Choose Business and press Next: Company appears after Account. Go back, choose Personal and accept again: it leaves, and its answers wait for it."
      >
        <Room>
          <AcceptedBranch />
        </Room>
      </Scene>
      <Scene
        label="A branch on what is being typed"
        note="Your own state drives the condition, so the progress shows Company the moment the box is ticked — before the step is accepted."
      >
        <Room>
          <LiveBranch />
        </Room>
      </Scene>
    </Grid>
  ),
};

export const Optional: Story = {
  parameters: scenario('optional'),
  render: () => (
    <One
      label="Invite teammates, or skip"
      note="Skip accepts the step with no answers and the review says Not provided; Back returns to it with nothing lost."
    >
      <Room>
        <Opening defaultStep="invite" defaultValue={FILLED} invite />
      </Room>
    </One>
  ),
};

export const ReviewStory: Story = {
  name: 'Review',
  parameters: scenario('review'),
  render: () => (
    <One
      label="Change an answer and come back"
      note="Press Change beside the billing address: Next reads Save and return, and accepting the step comes straight back here."
    >
      <Room>
        <Opening defaultStep="review" defaultValue={FILLED} />
      </Room>
    </One>
  ),
};

function Refusing() {
  const [tries, setTries] = useState(0);
  return (
    <Opening
      defaultStep="review"
      defaultValue={FILLED}
      onSubmit={async (): Promise<WizardFailure | undefined> => {
        await wait(900);
        setTries((count) => count + 1);
        if (tries === 0) {
          return {
            errors: { email: 'This email was registered while you were filling the form' },
            message: 'The bank refused the work email.',
            step: 'account',
          };
        }
        return undefined;
      }}
    />
  );
}

export const Submit: Story = {
  parameters: scenario('submit'),
  render: () => (
    <One
      label="Refused once, accepted the second time"
      note="Open account: the first answer names the Account step and its email, so the wizard goes back there with the error above and beside the field. Change the email and submit again."
    >
      <Room>
        <Refusing />
      </Room>
    </One>
  ),
};

/** A store that answers late, to show the restore wait. */
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

function Reloadable() {
  const [mount, setMount] = useState(0);
  const persistence = useMemo(() => slowPersistence('wizard-story-remote'), []);
  return (
    <Stack gap={4}>
      <Stack align="start">
        <Button onClick={() => setMount((count) => count + 1)} size="sm" variant="outline">
          Reload the wizard
        </Button>
      </Stack>
      <Opening key={mount} persistence={persistence} version={3} />
    </Stack>
  );
}

export const Drafts: Story = {
  parameters: scenario('drafts'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Saved to this tab, restored on reload"
        note="Type in Account and press Save draft; the status says when. Reload the page: the wizard opens where the draft left it, typed values included."
      >
        <Room>
          <Opening
            guardUnsaved
            persistence={storagePersistence({
              key: 'wizard-story',
              storage: 'session',
              version: 3,
            })}
            version={3}
          />
        </Room>
      </Scene>
      <Scene
        label="A draft kept by a server"
        note="load answers after 1.2 s: the step keeps its header and one field as skeletons, the actions stay away, and the restored step replaces them without moving."
      >
        <Room>
          <Reloadable />
        </Room>
      </Scene>
    </Grid>
  ),
};

function Routed() {
  const [path, setPath] = useState('/open/account');
  const step = path.split('/').at(-1);
  return (
    <Stack gap={4}>
      <Stack align="start" gap={2}>
        <Text size="sm" tone="muted">
          Address: {path}
        </Text>
        <Button onClick={() => setPath('/open/review')} size="sm" variant="outline">
          Follow a link to /open/review
        </Button>
      </Stack>
      <Opening onStepChange={(next) => setPath(`/open/${next}`)} step={step} />
    </Stack>
  );
}

export const Url: Story = {
  parameters: scenario('url'),
  render: () => (
    <One
      label="A link past the work done"
      note="The address owns the step. Following /open/review before Account is done lands on Account, and the address follows the programmatic request."
    >
      <Room>
        <Routed />
      </Room>
    </One>
  ),
};

export const Narrow: Story = {
  parameters: scenario('narrow'),
  render: () => (
    <One
      label="375 pixels"
      note="Open the bar to see every step; choosing one closes it, and Escape returns to the bar."
    >
      <Room room="phone">
        <Opening
          defaultStep="billing"
          defaultValue={{ account: FILLED['account']!, company: FILLED['company']! }}
        />
      </Room>
    </One>
  ),
};

export const InsideALayer: Story = {
  name: 'Dialog',
  parameters: scenario('dialog'),
  render: () => (
    <One
      label="A layer of fixed height"
      note="The step scrolls under a pinned row of actions; the frame stands for a Dialog or a Drawer body."
    >
      <div className="slotted-demo-viewport" data-fill="" data-frame="window" data-size="tall">
        <Opening
          defaultStep="company"
          defaultValue={{ account: FILLED['account']! }}
          progress="none"
          scroll="self"
        />
      </div>
    </One>
  ),
};

const GERMAN = [
  ['konto', 'Kontodaten'],
  ['person', 'Persönliche Angaben'],
  ['lieferung', 'Lieferanschrift'],
  ['zahlung', 'Zahlungsinformationen und Rechnungsanschrift'],
  ['geschenk', 'Geschenkoptionen'],
  ['datenschutz', 'Datenschutzeinwilligung'],
  ['pruefung', 'Überprüfung'],
] as const;

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <One
      label="Sieben Schritte"
      note="The fourth step’s name takes two lines in the column and in the heading; the row of actions wraps before it squeezes a button."
    >
      <Room>
        <Wizard
          defaultStep="zahlung"
          defaultValue={{ konto: {}, lieferung: {}, person: {} }}
          messages={{
            next: 'Weiter',
            position: 'Schritt {index} von {count}',
            previous: 'Zurück',
            progress: 'Fortschritt',
            saveDraft: 'Entwurf speichern',
            submit: 'Absenden',
          }}
          onSaveDraft={() => undefined}
        >
          {GERMAN.map(([name, label]) => (
            <WizardStep key={name} label={label} name={name}>
              <Answer label="IBAN" name="iban" />
            </WizardStep>
          ))}
        </Wizard>
      </Room>
    </One>
  ),
};

function TypedPlan() {
  const [seats, setSeats] = useState(5);
  const [accepted, setAccepted] = useState<WizardValue>({});
  return (
    <Stack gap={4}>
      <Wizard messages={{ progress: 'Plan' }} onValueChange={setAccepted} progress="top">
        <WizardStep label="Seats" name="plan" values={{ annual: true, seats }}>
          <Stack gap={4}>
            <Text size="sm">Seats: {seats}</Text>
            <Stack gap={2}>
              <Button onClick={() => setSeats((count) => count + 1)} size="sm" variant="outline">
                Add a seat
              </Button>
            </Stack>
          </Stack>
        </WizardStep>
        <WizardStep label="Confirm" name="confirm" />
      </Wizard>
      <Text size="sm" tone="muted">
        onValueChange: {JSON.stringify(accepted)}
      </Text>
    </Stack>
  );
}

export const Forms: Story = {
  parameters: scenario('forms'),
  render: () => (
    <One
      label="A number from your own state"
      note="The seat count lives in the story’s state; values hands the wizard { seats, annual } as numbers and booleans rather than FormData strings."
    >
      <Room>
        <TypedPlan />
      </Room>
    </One>
  ),
};

export const Labels: Story = {
  parameters: scenario('labels'),
  render: () => (
    <One
      label="Account opening, in Portuguese"
      // language: pt-BR
      note="The language in force says Etapa 2 de 4, Voltar and Cancelar; this wizard's messages say Continuar and Abrir conta, and the draft status and the failure follow."
      // language: en-US
    >
      <Room>
        <SlottedProvider locale="pt-BR">
          <Opening
            defaultStep="company"
            defaultValue={{ account: FILLED['account']! }}
            // language: pt-BR
            messages={{ next: 'Continuar', submit: 'Abrir conta' }}
            // language: en-US
          />
        </SlottedProvider>
      </Room>
    </One>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <One
      label="Focus follows the step"
      note="Tab to Next and press Enter: focus lands on the heading, which says Step 2 of 4, Company. The list of steps is named Account opening."
    >
      <Room>
        <Opening defaultValue={{}} />
      </Room>
    </One>
  ),
};
