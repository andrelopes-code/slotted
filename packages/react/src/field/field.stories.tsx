import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Badge } from '../badge';
import { Field } from './field';
import { useField } from './field-context';
import { FieldDefaultsProvider } from './field-defaults';
import { Grid, Measure, Scene } from './field-demo';
import {
  FieldAction,
  FieldControl,
  FieldCounter,
  FieldDescription,
  FieldError,
  FieldHeader,
  FieldHelp,
  FieldIndicator,
  FieldLabel,
} from './field-parts';
import { REACT_FIELD_DOCS, REACT_FIELD_TOKENS } from './field.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_FIELD_DOCS.field.scenes, {
    playground: Playground,
    necessity: Necessity,
    placement: Placement,
    sizes: Sizes,
    states: States,
    messages: Messages,
    counter: Counter,
    header: Header,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Field',
  component: Field,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Field',
        description:
          'One control, its name, its necessity, its help and its error — and the identifiers that bind them, derived from one base so nothing has to be coordinated between siblings.',
        framework: 'React',
        ...REACT_FIELD_DOCS.field,
        tokens: REACT_FIELD_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    labelPlacement: 'top',
    required: true,
    necessity: 'mark',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Field {...args}>
        <FieldLabel>Email</FieldLabel>
        <FieldControl placeholder="you@company.com" type="email" />
        <FieldDescription>We will use this address for billing.</FieldDescription>
      </Field>
    </div>
  ),
};

export const Necessity: Story = {
  parameters: scenario('necessity'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The asterisk, and the field that carries none"
        note="The mark is drawn by the label rather than written by the page, so it cannot be forgotten — and it is aria-hidden, because aria-required on the control already says it."
      >
        <Field required>
          <FieldLabel>Tax ID</FieldLabel>
          <FieldControl defaultValue="12.345.678/0001-90" />
        </Field>
        <Field>
          <FieldLabel>State registration</FieldLabel>
          <FieldControl />
        </Field>
      </Scene>
      <Scene
        label="The words, for a form where most fields are optional"
        note='Marking the two required fields in a form of twenty optional ones leaves the other eighteen ambiguous. necessity="words" names both sides, and the two words come from the provider.'
      >
        <Field required necessity="words">
          <FieldLabel>Tax ID</FieldLabel>
          <FieldControl defaultValue="12.345.678/0001-90" />
        </Field>
        <Field necessity="words">
          <FieldLabel>State registration</FieldLabel>
          <FieldControl />
        </Field>
      </Scene>
      <Scene
        label="Only the exception, for a form where most fields are required"
        note='necessity="optional" writes (optional) on the field a reader may skip and nothing on the others — the recommendation GOV.UK and Carbon make, because twenty asterisks say less than one word.'
      >
        <Field necessity="optional" required>
          <FieldLabel>Legal name</FieldLabel>
          <FieldControl defaultValue="Sirius Group Technology Ltd." />
        </Field>
        <Field necessity="optional">
          <FieldLabel>Trade name</FieldLabel>
          <FieldControl />
        </Field>
      </Scene>
      <Scene
        label="Nothing, when the form says it once"
        note='necessity="none" draws no mark. aria-required still reaches the control, so a reader hears “required” on every field the form marked.'
      >
        <Field necessity="none" required>
          <FieldLabel>Tax ID</FieldLabel>
          <FieldControl defaultValue="12.345.678/0001-90" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Beside the control, in a page-width form"
        note="The label takes a track of its own and the control the rest. A label of twelve words wraps inside its track and stays level with the control’s first line rather than sliding under it."
      >
        <Field labelPlacement="side">
          <FieldLabel>Legal name</FieldLabel>
          <FieldControl defaultValue="Sirius Group Technology" />
        </Field>
        <Field labelPlacement="side">
          <FieldLabel>Headquarters mailing address</FieldLabel>
          <FieldControl defaultValue="Avenida Paulista, 1000" />
        </Field>
      </Scene>
      <Scene
        label="The same two fields, in a 280-pixel drawer"
        note="Nothing changed but the width the field has. The container query is on the field itself, so a form in a drawer stacks while the same markup in a page grid does not."
      >
        <Measure width="drawer">
          <Field labelPlacement="side">
            <FieldLabel>Legal name</FieldLabel>
            <FieldControl defaultValue="Sirius Group Technology" />
          </Field>
        </Measure>
        <Measure width="drawer">
          <Field labelPlacement="side">
            <FieldLabel>Headquarters mailing address</FieldLabel>
            <FieldControl defaultValue="Avenida Paulista, 1000" />
          </Field>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Three steps, matching the control"
        note="A field is not a control and has no height of its own; what steps is the type of the label, the message and the counter, so a field sits level with the control it wraps."
      >
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Field key={size} size={size}>
            <FieldLabel>{`Apelido — ${size}`}</FieldLabel>
            <FieldControl defaultValue={size} />
            <FieldDescription>Appears in the reports.</FieldDescription>
          </Field>
        ))}
      </Scene>
      <Scene
        label="Every step answers the density switch"
        note="Set the toolbar to dense: all three steps read the control type scale, which is one of the three the theme restates per density, so a field in a dense table shrinks whole rather than in parts."
      >
        <Field size="lg">
          <FieldLabel>Unit description</FieldLabel>
          <FieldControl defaultValue="Headquarters — Seattle" />
          <FieldDescription>Appears in the report header.</FieldDescription>
        </Field>
        <Field size="sm">
          <FieldLabel>Cost center</FieldLabel>
          <FieldControl defaultValue="CC-4021" />
        </Field>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Invalid, and what stays the colour it was"
        note="Only the message turns. The label keeps its ink because the error already says the same thing in words and in colour, and a red marker on a red label is a marker nobody can see."
      >
        <Field invalid required>
          <FieldLabel>Tax ID</FieldLabel>
          <FieldControl defaultValue="12.345.678" />
          <FieldDescription>Numbers only, with branch and check digit.</FieldDescription>
          <FieldError>Six digits are missing.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Read-only, and disabled"
        note="Read-only stays focusable and copyable and looks nothing like disabled, which is muted to a colour the theme measures rather than faded by opacity — a label nobody can read is a field nobody can identify."
      >
        <Field readOnly>
          <FieldLabel>Account identifier</FieldLabel>
          <FieldControl defaultValue="acc_9f2b7c41" readOnly />
          <FieldDescription>Generated when the account is created, and copyable.</FieldDescription>
        </Field>
        <Field disabled required>
          <FieldLabel>Cost center</FieldLabel>
          <FieldControl defaultValue="Choose a unit first" />
          <FieldDescription>Available once a unit is chosen.</FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};

function SubmitOnce() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <Field invalid={submitted}>
        <FieldLabel>Phone</FieldLabel>
        <FieldControl defaultValue="(11) 90000-0000" />
        <FieldError live="polite" reserve>
          {submitted ? 'Enter the ninth digit.' : undefined}
        </FieldError>
      </Field>
      <button onClick={() => setSubmitted((value) => !value)} type="button">
        {submitted ? 'Clear the error' : 'Submit'}
      </button>
    </>
  );
}

export const Messages: Story = {
  parameters: scenario('messages'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Help, an error, and a warning that is neither"
        note="All three are inline-message roots. The error carries a clipped “Error:” a screen reader reads before the sentence, and the warning is the same part in another tone rather than a member of its own."
      >
        <Field>
          <FieldLabel>Password</FieldLabel>
          <FieldControl defaultValue="paulista1000" type="password" />
          <FieldDescription>
            Between 8 and 64 characters, with at least one number.
          </FieldDescription>
          <FieldError tone="warning">The password is valid but easy to guess.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="The line held open before the error arrives"
        note="Press the button twice and watch the button itself: reserve keeps one line box of the error’s own leading whether or not there is a message, so nothing below the field moves when the error appears."
      >
        <SubmitOnce />
      </Scene>
    </Grid>
  ),
};

function Description() {
  const [value, setValue] = useState(
    'Payroll, time tracking and benefits in one place, with accrual-based accounting close.',
  );
  const over = value.length > 140;

  return (
    <Field invalid={over}>
      <FieldLabel>Public description</FieldLabel>
      <FieldCounter invalid={over}>{`${value.length}/140`}</FieldCounter>
      <FieldControl
        render={(props) => (
          <textarea
            {...props}
            onChange={(event) => setValue(event.target.value)}
            rows={3}
            value={value}
          />
        )}
      />
      {over ? <FieldError>{`Corte ${value.length - 140} caracteres.`}</FieldError> : null}
    </Field>
  );
}

export const Counter: Story = {
  parameters: scenario('counter'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Type past the limit and watch the row above"
        note="The count sits in the label row’s spare column, so it never shares a row with the error and never adds one. It turns at its own limit, which a count reaches before the form has decided anything."
      >
        <Description />
      </Scene>
      <Scene
        label="The same counter beside a side label"
        note="The count stands under the label, at the end of the label’s track — the place a header puts it too — so a side field says its count in one place and the control keeps the whole of its track."
      >
        <Field labelPlacement="side">
          <FieldLabel>Assunto</FieldLabel>
          <FieldCounter>12/60</FieldCounter>
          <FieldControl defaultValue="March invoice" />
        </Field>
      </Scene>
    </Grid>
  ),
};

function Bio() {
  const [value, setValue] = useState('Data engineer; Apache Arrow contributor.');
  const over = value.length > 160;
  return (
    <Field invalid={over}>
      <FieldHeader>
        <FieldLabel>Introduction</FieldLabel>
        <FieldAction
          onClick={() =>
            setValue(
              'Data engineer at Sirius; maintains the ingestion layer and the internal Arrow fork.',
            )
          }
        >
          Generate from the job title
        </FieldAction>
        <FieldCounter invalid={over}>{`${value.length}/160`}</FieldCounter>
      </FieldHeader>
      <FieldControl
        onChange={(event) => setValue(event.currentTarget.value)}
        render={(props) => <textarea {...props} rows={3} />}
        value={value}
      />
    </Field>
  );
}

export const Header: Story = {
  parameters: scenario('header'),
  render: () => (
    <>
      <Grid columns={2}>
        <Scene
          label="A password, its rule and the way back in"
          note="Hover the circle or tab to it and the rule opens; press it and it stays until a second press. The link takes the end of the row and a 24-pixel target that gives the line its height back."
        >
          <Field required>
            <FieldHeader>
              <FieldLabel>Password</FieldLabel>
              <FieldHelp>At least eight characters, with letters and numbers.</FieldHelp>
              <FieldAction render={(props) => <a {...props} href="#recover" />}>
                Forgot your password?
              </FieldAction>
            </FieldHeader>
            <FieldControl autoComplete="current-password" type="password" />
          </Field>
        </Scene>
        <Scene
          label="What qualifies the field, heard on the control"
          note="The badge stands outside the label, so the asterisk stays against the last word, and it joins the control’s description with the help: a reader on the control hears “Beta”, then the rule, then the sentence under it."
        >
          <Field required>
            <FieldHeader>
              <FieldLabel>Notification endpoint</FieldLabel>
              <FieldHelp>The address that receives a POST for every invoice issued.</FieldHelp>
              <FieldIndicator>
                <Badge size="sm" tone="accent" variant="soft">
                  Beta
                </Badge>
              </FieldIndicator>
            </FieldHeader>
            <FieldControl defaultValue="https://api.sirius.com/webhooks/invoices" type="url" />
            <FieldDescription>
              Use HTTPS; the certificate is checked on every delivery.
            </FieldDescription>
          </Field>
          <Field disabled>
            <FieldHeader>
              <FieldLabel>Cost center</FieldLabel>
              <FieldHelp>Unlocked once a unit is chosen.</FieldHelp>
              <FieldIndicator>
                <Badge size="sm" tone="secondary" variant="soft">
                  Pro
                </Badge>
              </FieldIndicator>
            </FieldHeader>
            <FieldControl placeholder="Choose a unit first" />
          </Field>
        </Scene>
        <Scene
          label="An action beside a count the page keeps"
          note="Press the action and the text is replaced; type past 160 and the count turns before the form has decided anything. A count after an action stands twelve pixels from it, so a link and a number never read as one phrase."
        >
          <Bio />
        </Scene>
        <Scene
          label="All of it in a 280-pixel drawer"
          note="The row wraps rather than squeezing: the label breaks between words, and the badge, the action and the count move to a line of their own, the action and the count still at its end."
        >
          <Measure width="drawer">
            <Field required>
              <FieldHeader>
                <FieldLabel>Headquarters mailing address</FieldLabel>
                <FieldHelp>Receives the paper invoices.</FieldHelp>
                <FieldIndicator>
                  <Badge size="sm" tone="warning" variant="soft">
                    Required for companies
                  </Badge>
                </FieldIndicator>
                <FieldAction>Use the billing one</FieldAction>
                <FieldCounter>0/120</FieldCounter>
              </FieldHeader>
              <FieldControl />
            </Field>
          </Measure>
        </Scene>
      </Grid>
      <Grid columns={1}>
        <Scene
          label="The same row beside the control"
          note="With the label beside the control the header takes the label’s track: the help follows the label, the action wraps under it, and the count stands on a line of its own at the end of the track."
        >
          <Field labelPlacement="side">
            <FieldHeader>
              <FieldLabel>Password</FieldLabel>
              <FieldHelp>At least eight characters, with letters and numbers.</FieldHelp>
              <FieldAction render={(props) => <a {...props} href="#recover" />}>
                Forgot your password?
              </FieldAction>
            </FieldHeader>
            <FieldControl type="password" />
          </Field>
          <Field labelPlacement="side">
            <FieldHeader>
              <FieldLabel>Assunto</FieldLabel>
              <FieldCounter>12/60</FieldCounter>
            </FieldHeader>
            <FieldControl defaultValue="March invoice" />
          </Field>
        </Scene>
      </Grid>
    </>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A label no language can break, and a digest for a description"
        note="Both break rather than overflowing, and the whole string stays in the DOM and findable by a page search. The necessity word never breaks: it is the one part of a label that is always a word."
      >
        <Measure>
          <Field labelPlacement="side" required necessity="words">
            <FieldLabel lang="de">Kraftfahrzeug-Haftpflichtversicherungsnummer</FieldLabel>
            <FieldControl />
            <FieldDescription>
              sha256:9f2b7c41a8d3e05f6c1b4a97e2d80f3c5b6a1d4e7f0938271a6b5c4d3e2f1a09
            </FieldDescription>
          </Field>
        </Measure>
      </Scene>
      <Scene
        label="The same field, mirrored"
        note="Every distance is logical, so the label, the marker and the counter change sides together. Switch the toolbar to rtl and the two fields here read the same way round."
      >
        <Field dir="rtl" invalid lang="ar">
          <FieldLabel>رقم التعريف الضريبي</FieldLabel>
          <FieldCounter>3/14</FieldCounter>
          <FieldControl defaultValue="٣٠٠" />
          <FieldError prefix="خطأ:">الرقم غير مكتمل.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

/** A control the library does not own, wiring itself from the field. */
function MoneyInput() {
  const field = useField();

  return (
    <input
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid === true ? true : undefined}
      data-part="control"
      data-part-control=""
      defaultValue="R$ 1.250,00"
      disabled={field?.disabled}
      id={field?.ids.control}
      inputMode="decimal"
    />
  );
}

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One decision for every field in the application"
        note="The provider sets the step and the necessity style once; the words come from the language in force. A field that states its own still wins, which is the same rule the control follows against the field."
      >
        <FieldDefaultsProvider necessity="words" size="sm">
          <Field required>
            <FieldLabel>Tax ID</FieldLabel>
            <FieldControl defaultValue="12.345.678/0001-90" />
          </Field>
          <Field>
            <FieldLabel>State registration</FieldLabel>
            <FieldControl />
          </Field>
        </FieldDefaultsProvider>
      </Scene>
      <Scene
        label="A control of your own, and a part rendered as another element"
        note="useField hands a control the identifier and the description without a wrapper around it; render substitutes any part’s element, here turning the counter into an output."
      >
        <Field id="money">
          <FieldLabel>Installment amount</FieldLabel>
          <FieldCounter render={(props) => <output {...props} />}>1 of 12</FieldCounter>
          <MoneyInput />
          <FieldDescription>Charged on the 5th of each month.</FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Tab into the control and listen"
        note="A screen reader reads the label, then “required”, then the help behind the icon, the description and the error — one name, one description in a fixed order, and no asterisk read aloud."
      >
        <Field id="cnpj" invalid required>
          <FieldHeader>
            <FieldLabel>Tax ID</FieldLabel>
            <FieldHelp>The headquarters one, with all fourteen digits.</FieldHelp>
          </FieldHeader>
          <FieldControl defaultValue="12.345.678" />
          <FieldDescription>Numbers only, with branch and check digit.</FieldDescription>
          <FieldError live="polite">Six digits are missing.</FieldError>
        </Field>
      </Scene>
      <Scene
        label="Click the label, not the control"
        note="The association is explicit — for pointing at the derived identifier — so the click moves focus into the control. The implicit form, wrapping the control in the label, is the one the APG records as unreliable."
      >
        <Field id="account">
          <FieldLabel>Account identifier</FieldLabel>
          <FieldControl defaultValue="acc_9f2b7c41" />
          <FieldDescription>
            Click the label above: focus enters the field, with no JavaScript.
          </FieldDescription>
        </Field>
      </Scene>
    </Grid>
  ),
};
