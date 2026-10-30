import { bindScenes, createReferencePage, scenario } from '@slotted/storybook-workbench';
import type { ReferencePageConfig } from '@slotted/storybook-workbench';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Field, FieldError, FieldLabel } from '../field';
import { FieldGroup, FieldGroupLegend } from '../field-group';
import { Stack } from '../stack';
import { Switch } from './switch';
import { SwitchDefaultsProvider } from './switch-defaults';
import { Grid, Measure, Scene } from './switch-demo';
import { REACT_SWITCH_DOCS, REACT_SWITCH_TOKENS } from './switch.docs';

const referenceScenes: ReferencePageConfig['scenes'] = () =>
  bindScenes(REACT_SWITCH_DOCS.switch.scenes, {
    playground: Playground,
    sizes: Sizes,
    indicator: Indicator,
    placement: Placement,
    description: Description,
    states: States,
    loading: Loading,
    field: InsideAField,
    settings: Settings,
    composition: Composition,
    keyboard: Keyboard,
  }) as never;

const meta = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    controls: { disable: true },
    docs: {
      page: createReferencePage({
        title: 'Switch',
        description:
          'A binary setting that takes effect immediately, built on the checkbox the platform already ships and able to say that the effect has not landed yet.',
        framework: 'React',
        ...REACT_SWITCH_DOCS.switch,
        tokens: REACT_SWITCH_TOKENS,
        scenes: referenceScenes,
      }),
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    indicator: 'mark',
    labelPlacement: 'end',
    loading: false,
    size: 'md',
  },
  parameters: { ...scenario('playground'), controls: { disable: false } },
  render: (args) => (
    <div className="slotted-demo-stage" data-layout="block">
      <Switch
        {...args}
        defaultChecked
        description="The invoice is charged on the 5th of each month."
        name="autopay"
      >
        Autopay
      </Switch>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: scenario('sizes'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The three steps on their own"
        note="Pill, thumb, mark and label all come from the control scales, so switching the toolbar to dense shrinks each step whole rather than in parts."
        layout="block"
      >
        <Switch defaultChecked size="sm">
          Compacto
        </Switch>
        <Switch defaultChecked size="md">
          Default
        </Switch>
        <Switch defaultChecked size="lg">
          Comfortable
        </Switch>
      </Scene>
      <Scene
        label="Inside a field, the field decides"
        note="A small field holding a medium control is a field and a control disagreeing about one row, so the switch reads the field’s step before its own provider’s."
        layout="block"
      >
        <Field size="sm">
          <FieldLabel>Notifications</FieldLabel>
          <Switch defaultChecked>By email</Switch>
        </Field>
        <Field size="lg">
          <FieldLabel>Maintenance</FieldLabel>
          <Switch>Maintenance mode</Switch>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Indicator: Story = {
  parameters: scenario('indicator'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A check when it is on, and nothing when it is off"
        note="The mark is what makes the state readable beyond colour and beyond position: a switch you cannot compare to another still says which way it is set."
        layout="block"
      >
        <Switch defaultChecked>Com marca, ligado</Switch>
        <Switch>Com marca, desligado</Switch>
      </Scene>
      <Scene
        label="Withdrawn, where something else carries the state"
        note='indicator="none" leaves colour and position as the whole of the signal, which is what the mark exists to avoid — so it belongs beside a label that already says the state.'
        layout="block"
      >
        <Switch defaultChecked indicator="none">
          Sem marca, ligado
        </Switch>
        <Switch indicator="none">Sem marca, desligado</Switch>
      </Scene>
    </Grid>
  ),
};

export const Placement: Story = {
  parameters: scenario('placement'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="The label after the pill"
        note="The default, and the arrangement a single control in a form wants: the pill leads and the label reads as its name."
        layout="block"
      >
        <Switch defaultChecked>Alertas por e-mail</Switch>
        <Switch>Resumo semanal</Switch>
      </Scene>
      <Scene
        label="The label first, and the pill at the end"
        note="The settings row. The label takes the free width, so a column of rows ends with every pill at the same distance from the edge however long the labels are."
        layout="block"
      >
        <Switch defaultChecked labelPlacement="start">
          Alertas por e-mail
        </Switch>
        <Switch labelPlacement="start">Weekly summary of overdue orders</Switch>
        <Switch labelPlacement="start">Staging environment</Switch>
      </Scene>
    </Grid>
  ),
};

export const Description: Story = {
  parameters: scenario('description'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Under the label, never inside it"
        note="Inside the label it would join the accessible name, and a paragraph of help text that toggles a setting when it is clicked is a paragraph nobody reads."
        layout="block"
      >
        <Switch
          defaultChecked
          description="The invoice is charged on the 5th of each month, using the account's default payment method."
        >
          Autopay
        </Switch>
      </Scene>
      <Scene
        label="At 360 pixels"
        note="The label wraps and the description wraps with it; the pill never shrinks, because the pill is the target and the text is what can give up width."
        layout="block"
      >
        <Measure>
          <Switch description="Checks the queue every five minutes." labelPlacement="start">
            Automatic order sync
          </Switch>
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
        label="Read-only, and invalid"
        note="Read-only goes hollow and keeps the accent in its mark, because the value is real and still submitted; invalid draws the danger edge and retargets the focus ring to it."
        layout="block"
      >
        <Switch defaultChecked readOnly>
          Production key
        </Switch>
        <Switch invalid>I accept the terms</Switch>
      </Scene>
      <Scene
        label="Disabled, and disabled by a fieldset"
        note="The knob goes grey with the track, so a locked setting still says which way it is set. The one in the group was never told it is disabled: a fieldset disables what it holds, and the stylesheet matches :disabled beside the attribute."
        layout="block"
      >
        <Switch defaultChecked disabled>
          Included in the plan
        </Switch>
        <FieldGroup disabled>
          <FieldGroupLegend>Integration</FieldGroupLegend>
          <Switch defaultChecked>Sync orders</Switch>
        </FieldGroup>
      </Scene>
    </Grid>
  ),
};

function PessimisticSwitch() {
  const [on, setOn] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <Switch
      checked={on}
      loading={saving}
      messages={{ loading: 'Saving preference' }}
      onCheckedChange={(next) => {
        setSaving(true);
        setTimeout(() => {
          setOn(next);
          setSaving(false);
        }, 1200);
      }}
    >
      Automatic sync
    </Switch>
  );
}

export const Loading: Story = {
  parameters: scenario('loading'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="A write that has not returned"
        note="Press it: the thumb holds its place, the arc turns where the mark was, and a second press is refused before the DOM can show a state the server does not have."
        layout="block"
      >
        <PessimisticSwitch />
      </Scene>
      <Scene
        label="Pending, on and off"
        note="The pill keeps its size in both states, because a control that resizes while it saves moves the row under the pointer."
        layout="block"
      >
        <Switch loading>Salvando, desligado</Switch>
        <Switch defaultChecked loading>
          Salvando, ligado
        </Switch>
      </Scene>
    </Grid>
  ),
};

export const InsideAField: Story = {
  parameters: scenario('field'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Nothing wires the control"
        note="The switch reads the field for its identifier, its description and the four shared states, and it keeps its own label — so the field’s label names the group of settings and the switch’s names the setting."
        layout="block"
      >
        <Field>
          <FieldLabel>Billing preferences</FieldLabel>
          <Switch defaultChecked name="autopay">
            Charge automatically
          </Switch>
        </Field>
      </Scene>
      <Scene
        label="Required, and in error"
        note="The field marks necessity and the control writes aria-required — never the native attribute, which would engage the browser’s own validation as a side effect."
        layout="block"
      >
        <Field invalid required>
          <FieldLabel>Terms of use</FieldLabel>
          <Switch>I accept the terms</Switch>
          <FieldError>You must accept to continue.</FieldError>
        </Field>
      </Scene>
    </Grid>
  ),
};

export const Settings: Story = {
  parameters: scenario('settings'),
  render: () => (
    <Grid columns={1}>
      <Scene
        label="Where a switch actually lives"
        note="Three rows, each one label, one sentence and one pill. The labels take the free width and the pills line up, whatever the labels say."
        layout="block"
      >
        <Stack gap={7}>
          <Switch
            defaultChecked
            description="One notice for each overdue order."
            labelPlacement="start"
          >
            Email alerts
          </Switch>
          <Switch description="Orders created here are not charged." labelPlacement="start">
            Staging environment
          </Switch>
          <Switch
            defaultChecked
            description="Only the account owner can change this."
            labelPlacement="start"
            readOnly
          >
            Production key
          </Switch>
        </Stack>
      </Scene>
    </Grid>
  ),
};

export const Composition: Story = {
  parameters: scenario('composition'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="An application decides once"
        note="Size, indicator and placement are set for a subtree; a switch that states any of them itself still wins, and a field outranks the provider for size alone."
        layout="block"
      >
        <SwitchDefaultsProvider labelPlacement="start" size="sm">
          <Switch defaultChecked>Alertas por e-mail</Switch>
          <Switch size="lg">Resumo semanal</Switch>
        </SwitchDefaultsProvider>
      </Scene>
      <Scene
        label="The root becomes the consumer’s own element"
        note="render hands every attribute to whatever element is returned. Here the root is a list item, so a settings list is a list rather than a stack of boxes."
        layout="block"
      >
        <Switch defaultChecked render={(props) => <li {...props} />}>
          Weekly summary
        </Switch>
        <Switch aria-label="No visible label" />
      </Scene>
    </Grid>
  ),
};

export const Keyboard: Story = {
  parameters: scenario('keyboard'),
  render: () => (
    <Grid columns={2}>
      <Scene
        label="Tab, then Space"
        note="Both are the platform’s. Tab reaches the control and the ring is drawn on the pill; Space toggles it, and the request says the reason was the keyboard."
        layout="block"
      >
        <Switch>Desligado</Switch>
        <Switch defaultChecked>Ligado</Switch>
      </Scene>
      <Scene
        label="Enter is left to the form"
        note="The APG lists Enter as optional. Inside a form it submits, so a switch that stole it would break the form for the sake of a shortcut nobody asked for."
        layout="block"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Switch defaultChecked name="invoice">
            Receive the invoice by email
          </Switch>
        </form>
      </Scene>
    </Grid>
  ),
};
