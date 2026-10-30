import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Field, FieldControl, FieldDescription, FieldLabel } from '../field';
import { Grid, Measure, Scene } from '../field/field-demo';
import { FieldGroup } from './field-group';
import {
  FieldGroupContent,
  FieldGroupDescription,
  FieldGroupError,
  FieldGroupLegend,
} from './field-group-parts';
import { REACT_FIELD_GROUP_DOCS, REACT_FIELD_GROUP_TOKENS } from './field-group.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_FIELD_GROUP_DOCS.fieldGroup.scenes, {
    playground: Playground,
    orientation: Orientation,
    states: States,
    messages: Messages,
    provision: Provision,
    content: Content,
    composition: Composition,
    accessibility: Accessibility,
  }) as never;

const meta = {
  title: 'Components/Field Group',
  component: FieldGroup,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Field Group',
        description:
          'A set of fields under one name, in a native fieldset — so the group role, the accessible name and the disabling of every control inside all arrive from the platform rather than from ARIA.',
        framework: 'React',
        ...REACT_FIELD_GROUP_DOCS.fieldGroup,
        tokens: REACT_FIELD_GROUP_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof FieldGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function Address() {
  return (
    <FieldGroupContent>
      <Field>
        <FieldLabel>Logradouro</FieldLabel>
        <FieldControl defaultValue="Avenida Paulista, 1000" />
      </Field>
      <Field>
        <FieldLabel>City</FieldLabel>
        <FieldControl defaultValue="Seattle" />
      </Field>
    </FieldGroupContent>
  );
}

export const Playground: Story = {
  args: {
    orientation: 'vertical',
    required: false,
    necessity: 'mark',
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <FieldGroup {...args}>
        <FieldGroupLegend>Billing address</FieldGroupLegend>
        <FieldGroupDescription>We need it to issue the invoice.</FieldGroupDescription>
        <Address />
      </FieldGroup>
    </div>
  ),
};

export const Orientation: Story = {
  parameters: scenario('orientation'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A column, which is what a form is"
        note="One field under the next, at the distance the group owns. There is no gap input: a group that took one would be a second Stack that also happens to draw a legend."
      >
        <FieldGroup>
          <FieldGroupLegend>Billing address</FieldGroupLegend>
          <Address />
        </FieldGroup>
      </Scene>
      <Scene
        label="A row, and the same row in a narrow column"
        note="A row wraps rather than squeezing: each field keeps enough width to hold a date, and the second one drops to the next line instead of clipping what is being typed into it."
      >
        <FieldGroup orientation="horizontal">
          <FieldGroupLegend>Contract term</FieldGroupLegend>
          <FieldGroupContent>
            <Field>
              <FieldLabel>Start</FieldLabel>
              <FieldControl defaultValue="2026-03-01" type="date" />
            </Field>
            <Field>
              <FieldLabel>Fim</FieldLabel>
              <FieldControl defaultValue="2027-02-28" type="date" />
            </Field>
          </FieldGroupContent>
        </FieldGroup>
        <Measure>
          <FieldGroup orientation="horizontal">
            <FieldGroupLegend>Contract term</FieldGroupLegend>
            <FieldGroupContent>
              <Field>
                <FieldLabel>Start</FieldLabel>
                <FieldControl defaultValue="2026-03-01" type="date" />
              </Field>
              <Field>
                <FieldLabel>Fim</FieldLabel>
                <FieldControl defaultValue="2027-02-28" type="date" />
              </Field>
            </FieldGroupContent>
          </FieldGroup>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const States: Story = {
  parameters: scenario('states'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Disabled, in one attribute"
        note="Try to type into either control: the browser refuses, because a disabled fieldset disables its descendants and nothing was passed down. The legend and the labels are muted by the family, which the attribute alone would not reach."
      >
        <FieldGroup disabled>
          <FieldGroupLegend>Automatic payout</FieldGroupLegend>
          <FieldGroupDescription>
            Available once a bank account is registered.
          </FieldGroupDescription>
          <FieldGroupContent>
            <Field>
              <FieldLabel>Dia do repasse</FieldLabel>
              <FieldControl defaultValue="5" />
            </Field>
            <Field necessity="words">
              <FieldLabel>Minimum amount</FieldLabel>
              <FieldControl defaultValue="$250.00" />
            </Field>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
      <Scene
        label="Invalid, about the set rather than about a control"
        note="“Choose at least one” is a fact about the group: no control in it is individually wrong, so the message belongs to the fieldset and its id goes there rather than on any checkbox."
      >
        <FieldGroup invalid required>
          <FieldGroupLegend>Nationality</FieldGroupLegend>
          <FieldGroupDescription>Select all that apply.</FieldGroupDescription>
          <FieldGroupError>Choose at least one nationality.</FieldGroupError>
          <FieldGroupContent>
            <label htmlFor="nat-br">
              <input id="nat-br" type="checkbox" /> Brasileira
            </label>
            <label htmlFor="nat-pt">
              <input id="nat-pt" type="checkbox" /> Portuguesa
            </label>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
    </Grid>
  ),
};

export const Messages: Story = {
  parameters: scenario('messages'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Before the set, not after it"
        note="A group’s help is read on the way in, so it sits between the legend and the first field. A single field’s help sits after its control, which is the opposite order and the right one for each."
      >
        <FieldGroup id="billing">
          <FieldGroupLegend>Billing address</FieldGroupLegend>
          <FieldGroupDescription>We need it to issue the invoice.</FieldGroupDescription>
          <FieldGroupContent>
            <Field>
              <FieldLabel>ZIP code</FieldLabel>
              <FieldControl defaultValue="98101" />
              <FieldDescription>Digits only.</FieldDescription>
            </Field>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
      <Scene
        label="A warning about a section, and a line held open"
        note="Both messages take inline-message’s five tones, so a warning that does not block submission is the same part in another tone. reserve keeps the fields below from moving when the error arrives."
      >
        <FieldGroup>
          <FieldGroupLegend>Notifications</FieldGroupLegend>
          <FieldGroupError tone="warning">
            Without a verified email, only the in-app notice will be sent.
          </FieldGroupError>
          <FieldGroupContent>
            <label htmlFor="notify-email">
              <input id="notify-email" type="checkbox" /> Por e-mail
            </label>
            <label htmlFor="notify-app">
              <input defaultChecked id="notify-app" type="checkbox" /> No aplicativo
            </label>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
    </Grid>
  ),
};

export const Provision: Story = {
  parameters: scenario('provision'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="One attribute for the whole section"
        note="The group sets the step, the placement and the necessity style for every field inside it. Nothing is repeated per field, and nothing had to be threaded through by the page."
      >
        <FieldGroup labelPlacement="side" required necessity="words" size="sm">
          <FieldGroupLegend>Dados fiscais</FieldGroupLegend>
          <FieldGroupContent>
            <Field required>
              <FieldLabel>CNPJ</FieldLabel>
              <FieldControl defaultValue="12.345.678/0001-90" />
            </Field>
            <Field>
              <FieldLabel>State tax ID</FieldLabel>
              <FieldControl />
            </Field>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
      <Scene
        label="And the one field that says otherwise"
        note="A field that states its own value wins over the group, which is the same rule a control follows against its field: the explicit value always wins, and absence is what defers."
      >
        <FieldGroup size="sm">
          <FieldGroupLegend>Dados fiscais</FieldGroupLegend>
          <FieldGroupContent>
            <Field>
              <FieldLabel>CNPJ</FieldLabel>
              <FieldControl defaultValue="12.345.678/0001-90" />
            </Field>
            <Field size="lg">
              <FieldLabel>Legal name</FieldLabel>
              <FieldControl defaultValue="Sirius Group Technology" />
            </Field>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
    </Grid>
  ),
};

export const Content: Story = {
  parameters: scenario('content'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The page’s heading, inside the legend"
        note="The heading keeps its own type and loses only the block break, so the necessity words stay on its line. A reader hears the question once rather than as a heading and then again as a group name."
      >
        <FieldGroup required necessity="words" size="lg">
          <FieldGroupLegend>
            <h2>What is your nationality?</h2>
          </FieldGroupLegend>
          <FieldGroupDescription>
            If you hold dual nationality, check every relevant option.
          </FieldGroupDescription>
          <FieldGroupContent>
            <label htmlFor="heading-br">
              <input id="heading-br" type="checkbox" /> Brasileira
            </label>
            <label htmlFor="heading-pt">
              <input id="heading-pt" type="checkbox" /> Portuguesa
            </label>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
      <Scene
        label="A legend no language can break, in a narrow column"
        note="A fieldset arrives from the user agent with a min-inline-size of min-content, which would refuse to shrink below the widest control; the family removes it, so the group fits the column and the legend wraps."
      >
        <Measure>
          <FieldGroup size="sm">
            <FieldGroupLegend lang="de">Kraftfahrzeug-Haftpflichtversicherung</FieldGroupLegend>
            <FieldGroupDescription>
              sha256:9f2b7c41a8d3e05f6c1b4a97e2d80f3c5b6a1d4e7f0938271a6b5c4d3e2f1a09
            </FieldGroupDescription>
            <FieldGroupContent>
              <Field>
                <FieldLabel>Nummer</FieldLabel>
                <FieldControl defaultValue="HV-2026-0041" />
              </Field>
            </FieldGroupContent>
          </FieldGroup>
        </Measure>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A section inside a section"
        note="The inner group inherits the step the outer one decided and restates only the necessity style, so a nested set is a difference from its parent rather than a repetition of it."
      >
        <FieldGroup size="sm">
          <FieldGroupLegend>Contrato</FieldGroupLegend>
          <FieldGroupContent>
            <Field required necessity="words">
              <FieldLabel>Number</FieldLabel>
              <FieldControl defaultValue="CT-2026-0041" />
            </Field>
            <FieldGroup orientation="horizontal" necessity="none">
              <FieldGroupLegend>Term</FieldGroupLegend>
              <FieldGroupContent>
                <Field required>
                  <FieldLabel>Start</FieldLabel>
                  <FieldControl defaultValue="2026-03-01" type="date" />
                </Field>
                <Field required>
                  <FieldLabel>Fim</FieldLabel>
                  <FieldControl defaultValue="2027-02-28" type="date" />
                </Field>
              </FieldGroupContent>
            </FieldGroup>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
      <Scene
        label="A list for the content, and a group that is not a fieldset"
        note="render substitutes any part’s element. The content becomes a ul when the set is a list of choices; the group becomes a div when a page already has a fieldset around it and a second one would name the set twice."
      >
        <FieldGroup>
          <FieldGroupLegend>Payment methods</FieldGroupLegend>
          <FieldGroupContent render={(props) => <ul {...props} />}>
            <li>
              <label htmlFor="pay-pix">
                <input defaultChecked id="pay-pix" type="checkbox" /> Pix
              </label>
            </li>
            <li>
              <label htmlFor="pay-boleto">
                <input id="pay-boleto" type="checkbox" /> Boleto
              </label>
            </li>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
    </Grid>
  ),
};

export const Accessibility: Story = {
  parameters: scenario('accessibility'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Tab into either checkbox and listen"
        note="The group’s name and its two messages are read before the checkbox’s own label, because all three live on the fieldset. Nothing here writes a role, an aria-label or an aria-describedby onto a control."
      >
        <FieldGroup id="nationality" invalid required>
          <FieldGroupLegend>Nationality</FieldGroupLegend>
          <FieldGroupDescription>Select all that apply.</FieldGroupDescription>
          <FieldGroupError live="polite">Choose at least one nationality.</FieldGroupError>
          <FieldGroupContent>
            <label htmlFor="a11y-br">
              <input id="a11y-br" type="checkbox" /> Brasileira
            </label>
            <label htmlFor="a11y-pt">
              <input id="a11y-pt" type="checkbox" /> Portuguesa
            </label>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
      <Scene
        label="The marker on the set, and nothing on the fields"
        note="required is a fact about one value, so it marks the legend and stops there. Neither field below carries an asterisk, because the group cannot know which of them the requirement is about."
      >
        <FieldGroup required>
          <FieldGroupLegend>Emergency contact</FieldGroupLegend>
          <FieldGroupContent>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <FieldControl defaultValue="(206) 555-0100" />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <FieldControl defaultValue="contact@sirius.example" type="email" />
            </Field>
          </FieldGroupContent>
        </FieldGroup>
      </Scene>
    </Grid>
  ),
};
